from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.job import Job
from app.schemas.job import JobResponse
from app.core.celery_app import celery_app

router = APIRouter()

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job

@router.post("/jobs", response_model=JobResponse)
def create_job(db: Session = Depends(get_db)):
    job = Job()

    db.add(job)
    db.commit()
    db.refresh(job)

    # enqueue celery task
    celery_app.send_task("process_job", args=[job.id])

    return job