from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi import status as http_status
from fastapi.responses import FileResponse
from pathlib import Path
import os
from uuid import uuid4
from app.core.config import settings
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.job import Job, JobStatus
from app.schemas.job import JobResponse
from app.schemas.job import JobListResponse
from app.core.formats import get_job_type, is_conversion_supported
from app.core.celery_app import celery_app
from app.core.file_validation import (
    detect_mime_type,
    is_mime_consistent_with_extension,
    MAX_FILE_SIZE_BYTES,
)


router = APIRouter()

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job

@router.post("/", response_model=JobResponse)
async def create_job(
    file: UploadFile = File(...),
    output_format: str = Form(...),
    db: Session = Depends(get_db),
):

    # check file format
    input_format = Path(file.filename).suffix.lstrip(".").lower()

    if not input_format:
        raise HTTPException(status_code=422, detail="File has no extension")

    try:
        job_type = get_job_type(input_format)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported input format: '{input_format}'",
        )

    if not is_conversion_supported(input_format, output_format):
        raise HTTPException(
            status_code=422,
            detail=f"Cannot convert '{input_format}' to '{output_format}'",
        )

    # check file size
    file_bytes = await file.read()

    max_size = MAX_FILE_SIZE_BYTES.get(job_type.value, 100 * 1024 * 1024)
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size for {job_type.value}: {max_size // (1024*1024)}MB",
        )

    # check MIME type
    mime_type = detect_mime_type(file_bytes)
    if not is_mime_consistent_with_extension(mime_type, input_format):
        raise HTTPException(
            status_code=422,
            detail=f"File content does not match declared extension '.{input_format}' (detected: {mime_type})",
        )

    # prepare storage
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # generate file path
    filename = f"{uuid4()}.{input_format}"
    file_path = upload_dir / filename

    # save file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # create job with file path
    job = Job(
        input_file_path=str(file_path),
        job_type=job_type,
        input_format=input_format,
        output_format=output_format.lower(),
        status=JobStatus.PENDING,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    # enqueue celery task
    celery_app.send_task("process_job", args=[job.id])

    return job


@router.get("/{job_id}/download")
def download_job_output(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail=f"Job is not completed (status: {job.status})")

    if not job.output_file_path:
        raise HTTPException(status_code=404, detail="Output file not found")

    output_path = Path(job.output_file_path)

    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Output file missing from disk")

    return FileResponse(
        path=output_path,
        media_type="audio/mpeg",
        filename=f"job_{job.uuid}.mp3",
    )


@router.get("/", response_model=JobListResponse)
def list_jobs(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    if page < 1:
        raise HTTPException(status_code=422, detail="page must be >= 1")
    if page_size < 1 or page_size > 100:
        raise HTTPException(status_code=422, detail="page_size must be between 1 and 100")

    offset = (page - 1) * page_size

    total = db.scalar(func.count(Job.id))
    jobs = db.query(Job).order_by(Job.created_at.desc()).offset(offset).limit(page_size).all()

    return JobListResponse(
        items=jobs,
        total=total,
        page=page,
        page_size=page_size,
    )

@router.delete("/{job_id}", status_code=http_status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == JobStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Cannot delete a job that is currently processing")

    # delete files from disc
    for path_str in [job.input_file_path, job.output_file_path]:
        if path_str:
            path = Path(path_str)
            if path.exists():
                path.unlink()

    db.delete(job)
    db.commit()