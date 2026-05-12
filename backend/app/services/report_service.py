from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.report import Report


async def create_report(
    db: AsyncSession, reporter_id: str, bottle_id: str | None, reply_id: str | None, reason: str
) -> Report:
    if not bottle_id and not reply_id:
        raise ValueError("必须指定举报的瓶子或回信")

    if bottle_id:
        existing = await db.execute(
            select(Report).where(
                and_(Report.reporter_id == reporter_id, Report.bottle_id == bottle_id)
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("你已经举报过这个瓶子了")

    if reply_id:
        existing = await db.execute(
            select(Report).where(
                and_(Report.reporter_id == reporter_id, Report.reply_id == reply_id)
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("你已经举报过这条回信了")

    report = Report(
        reporter_id=reporter_id,
        bottle_id=bottle_id,
        reply_id=reply_id,
        reason=reason,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report
