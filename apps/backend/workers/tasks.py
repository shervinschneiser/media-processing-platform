from app.core.celery_app import celery_app

@celery_app.task(name="process_job")
def process_job(job_id: int):
    print(f"processing job {job_id}")