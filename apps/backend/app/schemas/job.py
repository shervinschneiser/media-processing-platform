from datetime import datetime
from pydantic import BaseModel


class JobCreate(BaseModel):
    pass


class JobResponse(BaseModel):
    id: int
    uuid: str
    status: str
    input_file_path: str | None = None
    output_file_path: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobDetailResponse(BaseModel):
    id: int
    uuid: str
    status: str
    error_message: str | None = None