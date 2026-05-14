from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.report import Report
from app.models.bottle import Bottle
from app.models.reply import Reply


async def create_report(
    db: AsyncSession, reporter_id: str, bottle_id: str | None, reply_id: str | None, reason: str
) -> Report:
    if bool(bottle_id) == bool(reply_id):
        raise ValueError("必须指定举报的瓶子或回信(且只能二选一)")

    if bottle_id:
        bottle = (await db.execute(select(Bottle).where(Bottle.id == bottle_id))).scalar_one_or_none()
        if not bottle or bottle.status == "removed":
            raise ValueError("瓶子不存在或已下架")
        if bottle.author_id == reporter_id:
            raise ValueError("不能举报自己发的瓶子")
        existing = await db.execute(
            select(Report).where(
                and_(Report.reporter_id == reporter_id, Report.bottle_id == bottle_id)
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("你已经举报过这个瓶子了")

    else:
        reply = (await db.execute(select(Reply).where(Reply.id == reply_id))).scalar_one_or_none()
        if not reply or reply.deleted_at is not None:
            raise ValueError("回信不存在或已删除")
        if reply.author_id == reporter_id:
            raise ValueError("不能举报自己发的回信")
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
