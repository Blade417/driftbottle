from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.bottle import Bottle
from app.services.moderation import assert_clean

DAILY_THROW_LIMIT = 3
DAILY_PICK_LIMIT = 5

# 用户体验意义上的"今天"按北京时间算（凌晨 0 点重置，而非 UTC 0 点 = 北京 8 点）
CN_TZ = timezone(timedelta(hours=8))


def _today_start_utc() -> datetime:
    """北京时间今日 00:00 对应的 UTC 时刻。"""
    now_cn = datetime.now(CN_TZ)
    midnight_cn = now_cn.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight_cn.astimezone(timezone.utc)


async def create_bottle(db: AsyncSession, author_id: str, content: str) -> Bottle:
    assert_clean(content)
    today_start = _today_start_utc()
    result = await db.execute(
        select(func.count()).where(
            and_(Bottle.author_id == author_id, Bottle.created_at >= today_start)
        )
    )
    if result.scalar() >= DAILY_THROW_LIMIT:
        raise ValueError(f"每天最多扔 {DAILY_THROW_LIMIT} 个瓶子")

    bottle = Bottle(author_id=author_id, content=content)
    db.add(bottle)
    await db.flush()
    await db.refresh(bottle)
    return bottle


async def pick_random_bottle(db: AsyncSession, user_id: str) -> Bottle | None:
    today_start = _today_start_utc()
    result = await db.execute(
        select(func.count()).where(
            and_(Bottle.picked_by == user_id, Bottle.picked_at >= today_start)
        )
    )
    if result.scalar() >= DAILY_PICK_LIMIT:
        raise ValueError(f"每天最多捡 {DAILY_PICK_LIMIT} 个瓶子")

    result = await db.execute(
        select(Bottle).where(
            and_(
                Bottle.status == "floating",
                Bottle.author_id != user_id,
            )
        ).order_by(func.random()).limit(1)
    )
    bottle = result.scalar_one_or_none()
    if not bottle:
        return None

    bottle.picked_by = user_id
    bottle.picked_at = datetime.now(timezone.utc)
    bottle.status = "picked"
    await db.flush()
    await db.refresh(bottle)
    return bottle


async def get_my_bottles(db: AsyncSession, user_id: str, type_: str = "thrown") -> list[Bottle]:
    if type_ == "picked":
        query = select(Bottle).where(
            and_(Bottle.picked_by == user_id, Bottle.status != "removed")
        ).order_by(Bottle.picked_at.desc())
    else:
        query = select(Bottle).where(
            and_(Bottle.author_id == user_id, Bottle.status != "removed")
        ).order_by(Bottle.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_bottle_by_id(db: AsyncSession, bottle_id: str) -> Bottle | None:
    result = await db.execute(select(Bottle).where(Bottle.id == bottle_id))
    return result.scalar_one_or_none()
