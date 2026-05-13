from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.reply import Reply
from app.models.bottle import Bottle


async def create_reply(db: AsyncSession, bottle: Bottle, author_id: str, content: str) -> Reply:
    if author_id not in (bottle.author_id, bottle.picked_by):
        raise ValueError("只有对话参与者可以回信")

    result = await db.execute(
        select(func.max(Reply.round)).where(Reply.bottle_id == bottle.id)
    )
    max_round = result.scalar() or 0

    if max_round == 0:
        expected_author = bottle.picked_by
    else:
        expected_author = bottle.author_id if max_round % 2 == 1 else bottle.picked_by

    if author_id != expected_author:
        raise ValueError("还没轮到你回信")

    reply = Reply(
        bottle_id=bottle.id,
        author_id=author_id,
        content=content,
        round=max_round + 1,
    )
    db.add(reply)

    await db.flush()
    await db.refresh(reply)
    return reply


async def get_replies_by_bottle(db: AsyncSession, bottle_id: str) -> list[Reply]:
    result = await db.execute(
        select(Reply).where(
            and_(Reply.bottle_id == bottle_id, Reply.deleted_at.is_(None))
        ).order_by(Reply.round)
    )
    return list(result.scalars().all())
