from fastapi import FastAPI

from app.api.v1.test import router as test_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
)


app.include_router(
    test_router,
    prefix="/api/v1",
    tags=["test"],
)