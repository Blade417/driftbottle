from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, UserOut, Token, EmailVerifyRequest, EmailVerifyConfirm
from app.services.auth_service import (
    register_user, authenticate_user, create_access_token,
    verify_email_token, resend_verify_email,
    VerifyResult, EmailAlreadyRegisteredError,
)
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    try:
        user = await register_user(db, data.email, data.password, background_tasks)
    except EmailAlreadyRegisteredError:
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    return user


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="请先验证邮箱后再登录")
    token = create_access_token(user.id)
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/verify")
async def verify(data: EmailVerifyConfirm, db: AsyncSession = Depends(get_db)):
    result, user = await verify_email_token(db, data.token)
    if result == VerifyResult.INVALID:
        raise HTTPException(status_code=400, detail="验证链接无效或已过期")
    if result == VerifyResult.ALREADY_VERIFIED:
        return {"message": "邮箱已验证", "email": user.email}
    return {"message": "邮箱验证成功", "email": user.email}


@router.post("/resend-verify")
async def resend_verify(
    data: EmailVerifyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    await resend_verify_email(db, data.email, background_tasks)
    return {"message": "如果邮箱已注册，验证邮件将稍后发送"}
