from pydantic import BaseModel


class JobCreate(BaseModel):
    pass


class JobResponse(BaseModel):
    id: int
    uuid: str
    status: str


class JobDetailResponse(BaseModel):
    id: int
    uuid: str
    status: str
    error_message: str | None = None