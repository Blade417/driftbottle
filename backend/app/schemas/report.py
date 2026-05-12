from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    bottle_id: str | None = None
    reply_id: str | None = None
    reason: str = Field(..., min_length=1, max_length=500)
