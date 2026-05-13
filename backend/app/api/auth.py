from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import SendCodeRequest, RegisterRequest, UserLogin, UserOut, Token
from app.services.auth_service import (
    send_register_code, verify_register_code, register_user,
    authenticate_user, create_access_token, EmailAlreadyRegisteredError,
)
from app.api.deps import get_current_user
from app.models.user import User
from app.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/send-code")
@limiter.limit("1/minute;5/hour")
async def send_code(
    request: Request,
    data: SendCodeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    ok = await send_register_code(db, data.email, background_tasks)
    if not ok:
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    return {"message": "验证码已发送，请查收邮箱"}


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not verify_register_code(data.email, data.code):
        raise HTTPException(status_code=400, detail="验证码无效或已过期")
    try:
        user = await register_user(db, data.email, data.password)
    except EmailAlreadyRegisteredError:
        raise HTTPException(status_code=400, detail="该邮箱已注册")
    return user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute;50/hour")
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    token = create_access_token(user.id)
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
