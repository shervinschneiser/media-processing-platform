from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import SuccessResponse
from app.core.logging import logger

router = APIRouter()


@router.get("/test")
def test(
    db: Session = Depends(get_db)
):
    db.execute(text("SELECT 1"))
    logger.info("test endpoint called")
    return SuccessResponse()