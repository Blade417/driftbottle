import uuid
import enum
import html as html_mod
import bcrypt
import secrets
import smtplib
import logging
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import BackgroundTasks
from app.config import get_settings
from app.models.user import User

settings = get_settings()
logger = logging.getLogger(__name__)

# TODO: 多 worker 部署前必须改用 Redis，当前内存限流不跨进程共享
_resend_cooldown: dict[str, float] = {}


class VerifyResult(enum.Enum):
    SUCCESS = "success"
    ALREADY_VERIFIED = "already_verified"
    INVALID = "invalid"


class EmailAlreadyRegisteredError(Exception):
    pass


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


async def register_user(
    db: AsyncSession, email: str, password: str, background_tasks: BackgroundTasks
) -> User:
    # secrets.token_urlsafe(32) 生成 43 字符的 URL-safe token
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.EMAIL_VERIFY_EXPIRE_MINUTES)
    user = User(
        email=email,
        password_hash=hash_password(password),
        avatar_seed=str(uuid.uuid4()),
        verify_token=token,
        verify_token_expires=expires,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise EmailAlreadyRegisteredError("该邮箱已注册")
    await db.refresh(user)
    # BackgroundTasks 在响应返回后执行；依赖 get_db 在响应前完成 commit，
    # 确保邮件中的 token 在数据库中已持久化
    background_tasks.add_task(send_verify_email, email, token)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user and verify_password(password, user.password_hash):
        return user
    return None


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


def send_verify_email(to_email: str, token: str):
    """同步发送验证邮件，由 BackgroundTasks 在响应后执行。"""
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST 未配置，跳过发送验证邮件")
        return
    verify_url = f"{settings.FRONTEND_URL}/verify?token={token}"
    safe_url = html_mod.escape(verify_url, quote=True)
    body = f"""
    <h2>漂流瓶日记 - 邮箱验证</h2>
    <p>请点击下方链接完成邮箱验证：</p>
    <a href="{safe_url}">{safe_url}</a>
    <p>链接 {settings.EMAIL_VERIFY_EXPIRE_MINUTES} 分钟内有效。</p>
    """
    msg = MIMEText(body, "html", "utf-8")
    msg["Subject"] = "漂流瓶日记 - 邮箱验证"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
    except Exception as e:
        logger.error(f"发送验证邮件失败: {e}")


async def verify_email_token(db: AsyncSession, token: str) -> tuple[VerifyResult, User | None]:
    result = await db.execute(select(User).where(User.verify_token == token))
    user = result.scalar_one_or_none()
    if not user:
        return (VerifyResult.INVALID, None)
    if user.is_verified:
        return (VerifyResult.ALREADY_VERIFIED, user)
    if user.verify_token_expires and user.verify_token_expires < datetime.now(timezone.utc):
        return (VerifyResult.INVALID, None)
    user.is_verified = True
    user.verify_token = None
    user.verify_token_expires = None
    await db.flush()
    return (VerifyResult.SUCCESS, user)


async def resend_verify_email(db: AsyncSession, email: str, background_tasks: BackgroundTasks) -> bool:
    """重发验证邮件。无论邮箱是否存在/已验证都返回 True，防止枚举。内含 60 秒限流。"""
    now = datetime.now(timezone.utc).timestamp()
    last = _resend_cooldown.get(email, 0)
    if now - last < 60:
        return True  # 限流但不暴露状态

    # 清理超过 1 小时的旧记录，防止内存无限增长
    stale = [k for k, v in _resend_cooldown.items() if now - v > 3600]
    for k in stale:
        del _resend_cooldown[k]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or user.is_verified:
        return True  # 统一返回，防枚举

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.EMAIL_VERIFY_EXPIRE_MINUTES)
    user.verify_token = token
    user.verify_token_expires = expires
    await db.flush()
    _resend_cooldown[email] = now
    background_tasks.add_task(send_verify_email, email, token)
    return True
