from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.report import ReportCreate
from app.services.report_service import create_report
from app.api.deps import get_current_user
from app.models.user import User
from app.limiter import limiter, _user_or_ip_key

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("", status_code=201)
@limiter.limit("5/minute;30/hour", key_func=_user_or_ip_key)
async def report(
    request: Request,
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        report = await create_report(
            db, current_user.id, data.bottle_id, data.reply_id, data.reason
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": report.id, "message": "举报已提交"}
