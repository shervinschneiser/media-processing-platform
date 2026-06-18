from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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
from app.core.celery_app import celery_app


router = APIRouter()

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job

@router.post("/", response_model=JobResponse)
async def create_job(file: UploadFile = File(...), db: Session = Depends(get_db)):

    # check file format
    ALLOWED_EXTENSIONS = {".mp4"}
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Only .mp4 is accepted.",
        )

    # prepare storage
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # generate file path
    ext = Path(file.filename).suffix
    filename = f"{uuid4()}{ext}"
    file_path = upload_dir / filename

    # save file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # create job with file path
    job = Job(
        input_file_path=str(file_path),
        status=JobStatus.PENDING
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