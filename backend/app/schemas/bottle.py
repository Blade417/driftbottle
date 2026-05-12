from pydantic import BaseModel, Field
from datetime import datetime


class BottleCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class ReplyOut(BaseModel):
    id: str
    author_avatar_seed: str
    content: str
    round: int
    created_at: datetime
    is_mine: bool = False


class BottleOut(BaseModel):
    id: str
    author_avatar_seed: str
    content: str
    status: str
    picked_by_avatar_seed: str | None = None
    reply_count: int = 0
    created_at: datetime
    picked_at: datetime | None = None

    class Config:
        from_attributes = True


class BottleDetail(BottleOut):
    replies: list[ReplyOut] = []
    is_mine: bool = False
    is_picker: bool = False
    next_round_is_mine: bool = False
