from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_, case, literal_column
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User
from app.models.bottle import Bottle
from app.models.reply import Reply
from app.models.report import Report, ReportStatus
from app.schemas.admin import (
    AdminStats, RemoveResult,
    ResolveRequest, ResolveResult,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _truncate(s: str | None, n: int = 100) -> str:
    if not s:
        return ""
    return s[:n] + "..." if len(s) > n else s


# ============================================================
# A. Dashboard
# ============================================================

@router.get("/stats", response_model=AdminStats)
async def admin_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)

    users_total = (await db.execute(select(func.count(User.id)))).scalar() or 0
    users_today = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )).scalar() or 0

    # 总瓶子数（含全部状态，含 removed）
    bottles_total = (await db.execute(select(func.count(Bottle.id)))).scalar() or 0
    # 今日新增瓶子（含 removed）
    bottles_today = (await db.execute(
        select(func.count(Bottle.id)).where(Bottle.created_at >= today_start)
    )).scalar() or 0
    bottles_floating = (await db.execute(
        select(func.count(Bottle.id)).where(Bottle.status == "floating")
    )).scalar() or 0
    bottles_removed = (await db.execute(
        select(func.count(Bottle.id)).where(Bottle.status == "removed")
    )).scalar() or 0

    replies_today = (await db.execute(
        select(func.count(Reply.id)).where(Reply.created_at >= today_start)
    )).scalar() or 0

    reports_pending = (await db.execute(
        select(func.count(Report.id)).where(Report.status == ReportStatus.PENDING.value)
    )).scalar() or 0

    return AdminStats(
        users_total=users_total,
        users_today=users_today,
        bottles_total=bottles_total,
        bottles_today=bottles_today,
        bottles_floating=bottles_floating,
        bottles_removed=bottles_removed,
        replies_today=replies_today,
        reports_pending=reports_pending,
    )


# ============================================================
# B. 瓶子管理
# ============================================================

@router.get("/bottles")
async def list_bottles(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    has_reports: bool | None = None,
    content_keyword: str | None = None,
    created_after: datetime | None = None,
    created_before: datetime | None = None,
    order_by: str = "created_desc",
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # 基础查询
    query = select(Bottle)
    count_query = select(func.count(Bottle.id))

    # 过滤条件
    filters = []
    if status:
        filters.append(Bottle.status == status)
    if content_keyword:
        filters.append(Bottle.content.like(f"%{content_keyword}%"))
    if created_after:
        filters.append(Bottle.created_at >= created_after)
    if created_before:
        filters.append(Bottle.created_at <= created_before)

    # has_reports 过滤
    if has_reports is True:
        report_subq = select(Report.bottle_id).where(Report.bottle_id.isnot(None)).distinct()
        filters.append(Bottle.id.in_(report_subq))
    elif has_reports is False:
        report_subq = select(Report.bottle_id).where(Report.bottle_id.isnot(None)).distinct()
        filters.append(Bottle.id.notin_(report_subq))

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    # 排序
    if order_by == "created_asc":
        query = query.order_by(Bottle.created_at.asc())
    elif order_by == "reports_desc":
        reports_count_subq = (
            select(Report.bottle_id, func.count(Report.id).label("rc"))
            .where(Report.bottle_id.isnot(None))
            .group_by(Report.bottle_id)
            .subquery()
        )
        query = query.outerjoin(reports_count_subq, Bottle.id == reports_count_subq.c.bottle_id)
        query = query.order_by(func.coalesce(reports_count_subq.c.rc, 0).desc(), Bottle.created_at.desc())
    else:
        query = query.order_by(Bottle.created_at.desc())

    total = (await db.execute(count_query)).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    bottles = list(result.scalars().all())

    # 预加载作者和捡到的人（避免 N+1）
    author_ids = set(b.author_id for b in bottles) | set(b.picked_by for b in bottles if b.picked_by)
    if author_ids:
        users_result = await db.execute(select(User).where(User.id.in_(author_ids)))
        users_map = {u.id: u for u in users_result.scalars().all()}
    else:
        users_map = {}

    # 预加载举报数
    bottle_ids = [b.id for b in bottles]
    if bottle_ids:
        reports_count_result = await db.execute(
            select(Report.bottle_id, func.count(Report.id))
            .where(Report.bottle_id.in_(bottle_ids))
            .group_by(Report.bottle_id)
        )
        reports_count_map = {row[0]: row[1] for row in reports_count_result.all()}

        replies_count_result = await db.execute(
            select(Reply.bottle_id, func.count(Reply.id))
            .where(and_(Reply.bottle_id.in_(bottle_ids), Reply.deleted_at.is_(None)))
            .group_by(Reply.bottle_id)
        )
        replies_count_map = {row[0]: row[1] for row in replies_count_result.all()}
    else:
        reports_count_map = {}
        replies_count_map = {}

    items = []
    for b in bottles:
        author = users_map.get(b.author_id)
        picker = users_map.get(b.picked_by) if b.picked_by else None

        items.append({
            "id": b.id,
            "content": _truncate(b.content),
            "status": b.status,
            "author": {"id": author.id, "email": author.email, "avatar_seed": author.avatar_seed} if author else None,
            "picked_by": {"id": picker.id, "email": picker.email} if picker else None,
            "reports_count": reports_count_map.get(b.id, 0),
            "replies_count": replies_count_map.get(b.id, 0),
            "created_at": b.created_at.isoformat(),
        })

    return {"items": items, "total": total, "page": page, "size": size}


@router.get("/bottles/{bottle_id}")
async def get_bottle_detail(
    bottle_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    bottle = (await db.execute(select(Bottle).where(Bottle.id == bottle_id))).scalar_one_or_none()
    if not bottle:
        raise HTTPException(status_code=404, detail="瓶子不存在")

    author = users_map_get(bottle.author_id, db)
    author = (await db.execute(select(User).where(User.id == bottle.author_id))).scalar_one()
    picker = None
    if bottle.picked_by:
        picker = (await db.execute(select(User).where(User.id == bottle.picked_by))).scalar_one()

    replies_result = await db.execute(
        select(Reply).where(Reply.bottle_id == bottle_id).order_by(Reply.round)
    )
    replies = []
    for r in replies_result.scalars().all():
        replies.append({
            "id": r.id,
            "author_id": r.author_id,
            "content": r.content,
            "round": r.round,
            "is_deleted": r.deleted_at is not None,
            "created_at": r.created_at.isoformat(),
        })

    reports_result = await db.execute(
        select(Report).where(Report.bottle_id == bottle_id).order_by(Report.created_at.desc())
    )
    reports = []
    for rp in reports_result.scalars().all():
        reports.append({
            "id": rp.id,
            "reporter_id": rp.reporter_id,
            "reason": rp.reason,
            "status": rp.status,
            "created_at": rp.created_at.isoformat(),
        })

    return {
        "id": bottle.id,
        "content": bottle.content,
        "status": bottle.status,
        "author": {"id": author.id, "email": author.email, "avatar_seed": author.avatar_seed},
        "picked_by": {"id": picker.id, "email": picker.email} if picker else None,
        "replies": replies,
        "reports": reports,
        "created_at": bottle.created_at.isoformat(),
        "picked_at": bottle.picked_at.isoformat() if bottle.picked_at else None,
    }


@router.post("/bottles/{bottle_id}/remove", response_model=RemoveResult)
async def remove_bottle(
    bottle_id: str,
    body: dict | None = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    bottle = (await db.execute(select(Bottle).where(Bottle.id == bottle_id))).scalar_one_or_none()
    if not bottle:
        raise HTTPException(status_code=404, detail="瓶子不存在")

    if bottle.status == "removed":
        return RemoveResult(bottle_removed=False, replies_deleted=0, reports_auto_resolved=0)

    note = (body or {}).get("note", "")
    now = datetime.now(timezone.utc)

    bottle.status = "removed"

    replies_result = await db.execute(select(Reply).where(Reply.bottle_id == bottle_id))
    replies = list(replies_result.scalars().all())
    replies_deleted = 0
    for r in replies:
        if r.deleted_at is None:
            r.deleted_at = now
            replies_deleted += 1

    reports_result = await db.execute(
        select(Report).where(
            and_(Report.bottle_id == bottle_id, Report.status == ReportStatus.PENDING.value)
        )
    )
    reports = list(reports_result.scalars().all())
    reports_auto_resolved = 0
    for rp in reports:
        rp.status = ReportStatus.RESOLVED.value
        rp.handled_by = admin.id
        rp.handled_at = now
        rp.handler_note = note or "随关联瓶子下架自动处理"
        reports_auto_resolved += 1

    await db.flush()

    return RemoveResult(
        bottle_removed=True,
        replies_deleted=replies_deleted,
        reports_auto_resolved=reports_auto_resolved,
    )


# ============================================================
# C. 用户管理
# ============================================================

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    email_keyword: str | None = None,
    is_verified: bool | None = None,
    order_by: str = "created_desc",
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    count_query = select(func.count(User.id))

    filters = []
    if email_keyword:
        filters.append(User.email.like(f"%{email_keyword}%"))
    if is_verified is not None:
        filters.append(User.is_verified == is_verified)

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    if order_by == "reports_desc":
        bottle_reports = (
            select(Bottle.author_id.label("uid"), func.count(Report.id).label("rc"))
            .join(Report, Report.bottle_id == Bottle.id)
            .group_by(Bottle.author_id)
            .subquery()
        )
        reply_reports = (
            select(Reply.author_id.label("uid"), func.count(Report.id).label("rc"))
            .join(Report, Report.reply_id == Reply.id)
            .group_by(Reply.author_id)
            .subquery()
        )
        query = query.outerjoin(bottle_reports, User.id == bottle_reports.c.uid)
        query = query.outerjoin(reply_reports, User.id == reply_reports.c.uid)
        total_reports = func.coalesce(bottle_reports.c.rc, 0) + func.coalesce(reply_reports.c.rc, 0)
        query = query.order_by(total_reports.desc(), User.created_at.desc())
    elif order_by == "created_asc":
        query = query.order_by(User.created_at.asc())
    else:
        query = query.order_by(User.created_at.desc())

    total = (await db.execute(count_query)).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    users = list(result.scalars().all())

    user_ids = [u.id for u in users]

    if user_ids:
        # 瓶子数（不含 removed）
        bottles_count_result = await db.execute(
            select(Bottle.author_id, func.count(Bottle.id))
            .where(and_(Bottle.author_id.in_(user_ids), Bottle.status != "removed"))
            .group_by(Bottle.author_id)
        )
        bottles_count_map = {row[0]: row[1] for row in bottles_count_result.all()}

        # 回复数（不含已删除）
        replies_count_result = await db.execute(
            select(Reply.author_id, func.count(Reply.id))
            .where(and_(Reply.author_id.in_(user_ids), Reply.deleted_at.is_(None)))
            .group_by(Reply.author_id)
        )
        replies_count_map = {row[0]: row[1] for row in replies_count_result.all()}

        # 被举报次数（瓶子）
        bottle_reports_result = await db.execute(
            select(Bottle.author_id, func.count(Report.id))
            .join(Report, Report.bottle_id == Bottle.id)
            .where(Bottle.author_id.in_(user_ids))
            .group_by(Bottle.author_id)
        )
        bottle_reports_map = {row[0]: row[1] for row in bottle_reports_result.all()}

        # 被举报次数（回复）
        reply_reports_result = await db.execute(
            select(Reply.author_id, func.count(Report.id))
            .join(Report, Report.reply_id == Reply.id)
            .where(Reply.author_id.in_(user_ids))
            .group_by(Reply.author_id)
        )
        reply_reports_map = {row[0]: row[1] for row in reply_reports_result.all()}
    else:
        bottles_count_map = {}
        replies_count_map = {}
        bottle_reports_map = {}
        reply_reports_map = {}

    items = []
    for u in users:
        reports_against_count = bottle_reports_map.get(u.id, 0) + reply_reports_map.get(u.id, 0)
        items.append({
            "id": u.id,
            "email": u.email,
            "avatar_seed": u.avatar_seed,
            "is_verified": u.is_verified,
            "is_admin": u.is_admin,
            "bottles_count": bottles_count_map.get(u.id, 0),
            "replies_count": replies_count_map.get(u.id, 0),
            "reports_against_count": reports_against_count,
            "created_at": u.created_at.isoformat(),
        })

    return {"items": items, "total": total, "page": page, "size": size}


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 该用户的瓶子（最多 51 个，判断是否超过 50）
    bottles_result = await db.execute(
        select(Bottle).where(Bottle.author_id == user_id).order_by(Bottle.created_at.desc()).limit(51)
    )
    all_bottles = list(bottles_result.scalars().all())
    bottles_total = len(all_bottles)
    bottles = []
    for b in all_bottles[:50]:
        bottles.append({
            "id": b.id,
            "content": _truncate(b.content),
            "status": b.status,
            "created_at": b.created_at.isoformat(),
        })

    # 该用户的回复（最多 51 个）
    replies_result = await db.execute(
        select(Reply).where(Reply.author_id == user_id).order_by(Reply.created_at.desc()).limit(51)
    )
    all_replies = list(replies_result.scalars().all())
    replies_total = len(all_replies)
    replies = []
    for r in all_replies[:50]:
        replies.append({
            "id": r.id,
            "bottle_id": r.bottle_id,
            "content": _truncate(r.content),
            "round": r.round,
            "created_at": r.created_at.isoformat(),
        })

    # 针对该用户的举报
    bottle_report_ids = select(Bottle.id).where(Bottle.author_id == user_id)
    reply_report_ids = select(Reply.id).where(Reply.author_id == user_id)

    reports_result = await db.execute(
        select(Report).where(
            or_(
                Report.bottle_id.in_(bottle_report_ids),
                Report.reply_id.in_(reply_report_ids),
            )
        ).order_by(Report.created_at.desc())
    )
    reports_against = []
    for rp in reports_result.scalars().all():
        target_type = "bottle" if rp.bottle_id else "reply"
        target_id = rp.bottle_id or rp.reply_id
        reports_against.append({
            "id": rp.id,
            "target_type": target_type,
            "target_id": target_id,
            "reason": rp.reason,
            "status": rp.status,
            "created_at": rp.created_at.isoformat(),
        })

    return {
        "id": user.id,
        "email": user.email,
        "avatar_seed": user.avatar_seed,
        "is_verified": user.is_verified,
        "is_admin": user.is_admin,
        "bottles": bottles,
        "bottles_total": bottles_total,
        "replies": replies,
        "replies_total": replies_total,
        "reports_against": reports_against,
        "created_at": user.created_at.isoformat(),
    }


# ============================================================
# D. 举报管理
# ============================================================

@router.get("/reports")
async def list_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    order_by: str = "created_desc",
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Report)
    count_query = select(func.count(Report.id))

    filters = []
    if status:
        filters.append(Report.status == status)
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    if order_by == "created_asc":
        query = query.order_by(Report.created_at.asc())
    else:
        query = query.order_by(Report.created_at.desc())

    total = (await db.execute(count_query)).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    reports = list(result.scalars().all())

    # 预加载 reporter 和 handler
    reporter_ids = set(rp.reporter_id for rp in reports)
    handler_ids = set(rp.handled_by for rp in reports if rp.handled_by)
    all_user_ids = reporter_ids | handler_ids
    if all_user_ids:
        users_result = await db.execute(select(User).where(User.id.in_(all_user_ids)))
        users_map = {u.id: u for u in users_result.scalars().all()}
    else:
        users_map = {}

    # 预加载被举报内容
    bottle_ids = [rp.bottle_id for rp in reports if rp.bottle_id]
    reply_ids = [rp.reply_id for rp in reports if rp.reply_id]

    bottles_map = {}
    if bottle_ids:
        bottles_result = await db.execute(select(Bottle).where(Bottle.id.in_(bottle_ids)))
        bottles_map = {b.id: b for b in bottles_result.scalars().all()}

    replies_map = {}
    if reply_ids:
        replies_result = await db.execute(select(Reply).where(Reply.id.in_(reply_ids)))
        replies_map = {r.id: r for r in replies_result.scalars().all()}

    items = []
    for rp in reports:
        reporter = users_map.get(rp.reporter_id)
        handler = users_map.get(rp.handled_by) if rp.handled_by else None

        target_type = "bottle" if rp.bottle_id else "reply"
        target_id = rp.bottle_id or rp.reply_id

        target_content_preview = ""
        if rp.bottle_id and rp.bottle_id in bottles_map:
            target_content_preview = _truncate(bottles_map[rp.bottle_id].content)
        elif rp.reply_id and rp.reply_id in replies_map:
            target_content_preview = _truncate(replies_map[rp.reply_id].content)

        items.append({
            "id": rp.id,
            "status": rp.status,
            "reporter": {"id": reporter.id, "email": reporter.email} if reporter else None,
            "target_type": target_type,
            "target_id": target_id,
            "target_content_preview": target_content_preview,
            "reason": rp.reason,
            "handled_by": {"id": handler.id, "email": handler.email} if handler else None,
            "handled_at": rp.handled_at.isoformat() if rp.handled_at else None,
            "handler_note": rp.handler_note,
            "created_at": rp.created_at.isoformat(),
        })

    return {"items": items, "total": total, "page": page, "size": size}


@router.get("/reports/{report_id}")
async def get_report_detail(
    report_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    rp = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if not rp:
        raise HTTPException(status_code=404, detail="举报不存在")

    reporter = (await db.execute(select(User).where(User.id == rp.reporter_id))).scalar_one()

    handler = None
    if rp.handled_by:
        handler_user = (await db.execute(select(User).where(User.id == rp.handled_by))).scalar_one_or_none()
        if handler_user:
            handler = {"id": handler_user.id, "email": handler_user.email}

    target_type = "bottle" if rp.bottle_id else "reply"
    target = None
    context = None

    if rp.bottle_id:
        bottle = (await db.execute(select(Bottle).where(Bottle.id == rp.bottle_id))).scalar_one_or_none()
        if bottle:
            target = {
                "id": bottle.id,
                "content": bottle.content,
                "author_id": bottle.author_id,
                "created_at": bottle.created_at.isoformat(),
            }
            replies_result = await db.execute(
                select(Reply).where(Reply.bottle_id == bottle.id).order_by(Reply.round)
            )
            replies = []
            for r in replies_result.scalars().all():
                replies.append({
                    "id": r.id,
                    "author_id": r.author_id,
                    "content": r.content,
                    "round": r.round,
                    "is_deleted": r.deleted_at is not None,
                    "created_at": r.created_at.isoformat(),
                })
            context = {
                "bottle_id": bottle.id,
                "bottle_content": bottle.content,
                "replies": replies,
            }

    elif rp.reply_id:
        reply = (await db.execute(select(Reply).where(Reply.id == rp.reply_id))).scalar_one_or_none()
        if reply:
            target = {
                "id": reply.id,
                "content": reply.content,
                "author_id": reply.author_id,
                "created_at": reply.created_at.isoformat(),
            }
            bottle = (await db.execute(select(Bottle).where(Bottle.id == reply.bottle_id))).scalar_one_or_none()
            if bottle:
                replies_result = await db.execute(
                    select(Reply).where(Reply.bottle_id == bottle.id).order_by(Reply.round)
                )
                replies = []
                for r in replies_result.scalars().all():
                    replies.append({
                        "id": r.id,
                        "author_id": r.author_id,
                        "content": r.content,
                        "round": r.round,
                        "is_deleted": r.deleted_at is not None,
                        "created_at": r.created_at.isoformat(),
                    })
                context = {
                    "bottle_id": bottle.id,
                    "bottle_content": bottle.content,
                    "replies": replies,
                }

    return {
        "id": rp.id,
        "status": rp.status,
        "reporter": {"id": reporter.id, "email": reporter.email},
        "target_type": target_type,
        "target": target,
        "context": context,
        "reason": rp.reason,
        "handled_by": handler,
        "handled_at": rp.handled_at.isoformat() if rp.handled_at else None,
        "handler_note": rp.handler_note,
        "created_at": rp.created_at.isoformat(),
    }


@router.post("/reports/{report_id}/resolve", response_model=ResolveResult)
async def resolve_report(
    report_id: str,
    body: ResolveRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    rp = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if not rp:
        raise HTTPException(status_code=404, detail="举报不存在")

    if rp.status != ReportStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="该举报已被处理")

    now = datetime.now(timezone.utc)
    side_effects = None

    if body.action == "remove":
        if rp.bottle_id:
            bottle = (await db.execute(select(Bottle).where(Bottle.id == rp.bottle_id))).scalar_one_or_none()
            if bottle and bottle.status != "removed":
                bottle.status = "removed"

                replies_result = await db.execute(select(Reply).where(Reply.bottle_id == bottle.id))
                replies_deleted = 0
                for r in replies_result.scalars().all():
                    if r.deleted_at is None:
                        r.deleted_at = now
                        replies_deleted += 1

                other_reports = await db.execute(
                    select(Report).where(
                        and_(
                            Report.bottle_id == bottle.id,
                            Report.status == ReportStatus.PENDING.value,
                            Report.id != rp.id,
                        )
                    )
                )
                reports_auto_resolved = 0
                for other_rp in other_reports.scalars().all():
                    other_rp.status = ReportStatus.RESOLVED.value
                    other_rp.handled_by = admin.id
                    other_rp.handled_at = now
                    other_rp.handler_note = "随关联瓶子下架自动处理"
                    reports_auto_resolved += 1

                side_effects = {
                    "bottle_removed": True,
                    "replies_deleted": replies_deleted,
                    "reports_auto_resolved": reports_auto_resolved,
                }

        elif rp.reply_id:
            reply = (await db.execute(select(Reply).where(Reply.id == rp.reply_id))).scalar_one_or_none()
            if reply and reply.deleted_at is None:
                reply.deleted_at = now

            other_reports = await db.execute(
                select(Report).where(
                    and_(
                        Report.reply_id == rp.reply_id,
                        Report.status == ReportStatus.PENDING.value,
                        Report.id != rp.id,
                    )
                )
            )
            reports_auto_resolved = 0
            for other_rp in other_reports.scalars().all():
                other_rp.status = ReportStatus.RESOLVED.value
                other_rp.handled_by = admin.id
                other_rp.handled_at = now
                other_rp.handler_note = "随关联回复下架自动处理"
                reports_auto_resolved += 1

            side_effects = {
                "reply_deleted": True,
                "reports_auto_resolved": reports_auto_resolved,
            }

        rp.status = ReportStatus.RESOLVED.value

    elif body.action == "reject":
        rp.status = ReportStatus.REJECTED.value

    else:
        raise HTTPException(status_code=400, detail="action 必须是 remove 或 reject")

    rp.handled_by = admin.id
    rp.handled_at = now
    rp.handler_note = body.note

    await db.flush()

    return ResolveResult(
        report_id=rp.id,
        action=body.action,
        status=rp.status,
        side_effects=side_effects,
    )
