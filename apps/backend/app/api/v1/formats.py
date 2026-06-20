from fastapi import APIRouter, HTTPException
from app.core.formats import get_supported_targets

router = APIRouter()

@router.get("/{input_format}/targets")
def get_targets(input_format: str):
    try:
        targets = get_supported_targets(input_format)
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail=f"Format '{input_format}' is not supported",
        )

    return {
        "input_format": input_format.lower(),
        "supported_targets": targets,
    }