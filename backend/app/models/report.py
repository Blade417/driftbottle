import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


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
