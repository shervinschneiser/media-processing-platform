import subprocess
from pathlib import Path
from uuid import uuid4

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.config import settings

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

        input_path = Path(job.input_file_path)
        output_dir = Path(settings.output_dir)

        output_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_filename = f"{uuid4()}.mp3"
        output_path = output_dir / output_filename

        job.status = JobStatus.PROCESSING
        db.commit()

        subprocess.run(
            [
                "ffmpeg",
                "-i",
                str(input_path),
                str(output_path),
                "-y",
            ],
            check=True,
        )
        
        job.output_file_path = str(output_path)
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