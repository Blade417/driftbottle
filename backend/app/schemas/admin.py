from pydantic import BaseModel
from datetime import datetime


# --- Dashboard ---

class AdminStats(BaseModel):
    users_total: int
    users_today: int
    bottles_total: int
    bottles_today: int
    bottles_floating: int
    bottles_removed: int
    replies_today: int
    reports_pending: int


# --- 通用分页 ---

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    size: int


# --- 瓶子相关 ---

class BottleAuthorInfo(BaseModel):
    id: str
    email: str
    avatar_seed: str

    class Config:
        from_attributes = True


class BottlePickerInfo(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True


class AdminBottleListItem(BaseModel):
    id: str
    content: str  # 截断到 100 字符
    status: str
    author: BottleAuthorInfo
    picked_by: BottlePickerInfo | None = None
    reports_count: int
    replies_count: int
    created_at: str


class ReplyDetail(BaseModel):
    id: str
    author_id: str
    content: str
    round: int
    is_deleted: bool
    created_at: str


class ReportInBottle(BaseModel):
    id: str
    reporter_id: str
    reason: str
    status: str
    created_at: str


class AdminBottleDetail(BaseModel):
    id: str
    content: str
    status: str
    author: BottleAuthorInfo
    picked_by: BottlePickerInfo | None = None
    replies: list[ReplyDetail]
    reports: list[ReportInBottle]
    created_at: str
    picked_at: str | None = None


class RemoveResult(BaseModel):
    bottle_removed: bool
    replies_deleted: int
    reports_auto_resolved: int


# --- 用户相关 ---

class AdminUserListItem(BaseModel):
    id: str
    email: str
    avatar_seed: str
    is_verified: bool
    is_admin: bool
    bottles_count: int
    replies_count: int
    reports_against_count: int
    created_at: str


class UserBottleBrief(BaseModel):
    id: str
    content: str  # 截断 100 字符
    status: str
    created_at: str


class UserReplyBrief(BaseModel):
    id: str
    bottle_id: str
    content: str  # 截断 100 字符
    round: int
    created_at: str


class UserReportBrief(BaseModel):
    id: str
    target_type: str  # "bottle" | "reply"
    target_id: str
    reason: str
    status: str
    created_at: str


class AdminUserDetail(BaseModel):
    id: str
    email: str
    avatar_seed: str
    is_verified: bool
    is_admin: bool
    bottles: list[UserBottleBrief]
    replies: list[UserReplyBrief]
    reports_against: list[UserReportBrief]
    created_at: str


# --- 举报相关 ---

class ReporterInfo(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True


class HandlerInfo(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True


class AdminReportListItem(BaseModel):
    id: str
    status: str
    reporter: ReporterInfo
    target_type: str  # "bottle" | "reply"
    target_id: str
    target_content_preview: str  # 前 100 字符
    reason: str
    handled_by: HandlerInfo | None = None
    handled_at: str | None = None
    handler_note: str | None = None
    created_at: str


class ReportTargetDetail(BaseModel):
    id: str
    content: str
    author_id: str
    created_at: str


class ReportContext(BaseModel):
    """被举报对象所在的上下文"""
    bottle_id: str
    bottle_content: str
    replies: list[ReplyDetail] | None = None  # 如果举报的是回复，附带所属瓶子的所有回复


class AdminReportDetail(BaseModel):
    id: str
    status: str
    reporter: ReporterInfo
    target_type: str
    target: ReportTargetDetail
    context: ReportContext
    reason: str
    handled_by: HandlerInfo | None = None
    handled_at: str | None = None
    handler_note: str | None = None
    created_at: str


class ResolveRequest(BaseModel):
    action: str  # "remove" | "reject"
    note: str | None = None


class ResolveResult(BaseModel):
    report_id: str
    action: str
    status: str
    side_effects: dict | None = None  # remove 操作的副作用统计
