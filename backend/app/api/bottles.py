from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.schemas.bottle import BottleCreate, BottleOut, BottleDetail, ReplyOut
from app.schemas.reply import ReplyCreate
from app.services.bottle_service import create_bottle, pick_random_bottle, get_my_bottles, get_bottle_by_id
from app.services.reply_service import create_reply, get_replies_by_bottle
from app.api.deps import get_current_user
from app.models.user import User
from app.models.reply import Reply

router = APIRouter(prefix="/api/bottles", tags=["bottles"])


def _make_bottle_out(bottle, reply_count: int = 0) -> BottleOut:
    return BottleOut(
        id=bottle.id,
        author_avatar_seed=bottle.author.avatar_seed if bottle.author else "",
        content=bottle.content,
        status=bottle.status,
        picked_by_avatar_seed=bottle.picker.avatar_seed if bottle.picker else None,
        reply_count=reply_count,
        created_at=bottle.created_at,
        picked_at=bottle.picked_at,
    )


@router.post("", response_model=BottleOut, status_code=status.HTTP_201_CREATED)
async def throw_bottle(
    data: BottleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        bottle = await create_bottle(db, current_user.id, data.content)
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))
    await db.refresh(bottle, ["author", "picker"])
    return _make_bottle_out(bottle, reply_count=0)


@router.get("/pick", response_model=BottleOut)
async def pick_bottle(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        bottle = await pick_random_bottle(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))
    if not bottle:
        raise HTTPException(status_code=404, detail="海面上暂时没有漂流瓶")
    await db.refresh(bottle, ["author", "picker"])
    return _make_bottle_out(bottle, reply_count=0)


@router.get("/mine", response_model=list[BottleOut])
async def my_bottles(
    type_: str = Query("thrown", alias="type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if type_ not in ("thrown", "picked"):
        raise HTTPException(status_code=400, detail="type 必须是 thrown 或 picked")
    bottles = await get_my_bottles(db, current_user.id, type_)
    result = []
    # TODO: N+1 查询，部署 PostgreSQL 时改成 outerjoin + group_by 一次查出 reply_count
    for b in bottles:
        await db.refresh(b, ["author", "picker"])
        cnt = await db.execute(select(func.count()).where(Reply.bottle_id == b.id))
        result.append(_make_bottle_out(b, reply_count=cnt.scalar() or 0))
    return result


@router.get("/{bottle_id}", response_model=BottleDetail)
async def bottle_detail(
    bottle_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bottle = await get_bottle_by_id(db, bottle_id)
    if not bottle:
        raise HTTPException(status_code=404, detail="瓶子不存在")
    if current_user.id not in (bottle.author_id, bottle.picked_by):
        raise HTTPException(status_code=403, detail="你没有权限查看这个瓶子")
    await db.refresh(bottle, ["author", "picker"])
    replies = await get_replies_by_bottle(db, bottle.id)

    uid = current_user.id
    is_author = uid == bottle.author_id
    is_picker = uid == bottle.picked_by

    reply_outs = []
    for r in replies:
        await db.refresh(r, ["author"])
        reply_outs.append(ReplyOut(
            id=r.id,
            author_avatar_seed=r.author.avatar_seed,
            content=r.content,
            round=r.round,
            created_at=r.created_at,
            is_mine=(r.author_id == uid),
        ))

    # 计算下一轮该谁写
    # TODO: status=closed 时前端要显示"对话已结束"提示，
    #       而不是单纯隐藏输入框
    next_round = len(reply_outs) + 1
    if bottle.status != "picked":
        next_round_is_mine = False
    elif next_round % 2 == 1:
        next_round_is_mine = is_picker
    else:
        next_round_is_mine = is_author

    return BottleDetail(
        id=bottle.id,
        author_avatar_seed=bottle.author.avatar_seed,
        content=bottle.content,
        status=bottle.status,
        picked_by_avatar_seed=bottle.picker.avatar_seed if bottle.picker else None,
        reply_count=len(reply_outs),
        created_at=bottle.created_at,
        replies=reply_outs,
        is_mine=is_author,
        is_picker=is_picker,
        next_round_is_mine=next_round_is_mine,
    )


@router.post("/{bottle_id}/reply", response_model=ReplyOut, status_code=status.HTTP_201_CREATED)
async def reply_to_bottle(
    bottle_id: str,
    data: ReplyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bottle = await get_bottle_by_id(db, bottle_id)
    if not bottle:
        raise HTTPException(status_code=404, detail="瓶子不存在")
    if bottle.status == "floating":
        raise HTTPException(status_code=400, detail="这个瓶子还没有被捡到")
    try:
        reply = await create_reply(db, bottle, current_user.id, data.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    await db.refresh(reply, ["author"])
    return ReplyOut(
        id=reply.id,
        author_avatar_seed=reply.author.avatar_seed,
        content=reply.content,
        round=reply.round,
        created_at=reply.created_at,
        is_mine=True,
    )
