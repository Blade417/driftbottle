import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    REJECTED = "rejected"


# TODO: 重复举报策略待定
# 当前 UniqueConstraint 不区分 status，被驳回后用户无法重新举报
# 未来可能改为 partial unique index（仅 pending 唯一），需要重建表
# 待引入 Alembic 后一起处理
class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    reporter_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    bottle_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("bottles.id"), nullable=True
    )
    reply_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("replies.id"), nullable=True
    )
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), default=ReportStatus.PENDING.value,
        server_default="pending", nullable=False, index=True
    )
    # 注意：FK 约束仅 ORM 层生效，数据库层未约束（SQLite ALTER TABLE 限制）
    handled_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    handled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    handler_note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        CheckConstraint(
            "bottle_id IS NOT NULL OR reply_id IS NOT NULL",
            name="ck_report_target",
        ),
        UniqueConstraint("reporter_id", "bottle_id", name="uq_reporter_bottle"),
        UniqueConstraint("reporter_id", "reply_id", name="uq_reporter_reply"),
    )
