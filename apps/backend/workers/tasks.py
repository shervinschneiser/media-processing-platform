from app.core.celery_app import celery_app

@celery_app.task(name="test_task")
def test_task():
    return "Hello, World from celery"