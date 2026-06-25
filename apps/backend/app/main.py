from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.test import router as test_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.formats import router as formats_router
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import (
    global_exception_handler
)
from app.core.request_id import RequestIDMiddleware

app = FastAPI(
    title=settings.app_name,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestIDMiddleware)

app.add_exception_handler(
    Exception,
    global_exception_handler,
)

logger.info("application started!!!")


# test router
app.include_router(
    test_router,
    prefix="/api/v1",
    tags=["test"],
)

# jobs router
app.include_router(
    jobs_router,
    prefix="/api/v1/jobs",
    tags=["jobs"],
)

# formats router
app.include_router(
    formats_router,
     prefix="/api/v1/formats",
      tags=["formats"]
)