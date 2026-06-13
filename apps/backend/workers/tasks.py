import time

from app.core.celery_app import celery_app
from app.core.database import SessionLocal

from app.models.job import Job
from app.models.job import JobStatus

@celery_app.task(name="process_job")
def process_job(job_id: int):
    db = SessionLocal()
    job = None
    
    try:
        job = db.get(Job, job_id)

        if job is None:
            return

        job.status = JobStatus.PROCESSING
        db.commit()

        # simulate processing
        time.sleep(3)

        job.status = JobStatus.COMPLETED
        db.commit()

    except Exception as exc:
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(exc)
            db.commit()

        raise

    finally:
        db.close()