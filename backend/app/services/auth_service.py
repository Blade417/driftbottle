import uuid
import enum
import html as html_mod
import bcrypt
import secrets
import smtplib
import logging
import random
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

# TODO: 多 worker 部署前必须改用 Redis，当前内存存储不跨进程共享
_resend_cooldown: dict[str, float] = {}
# 邮箱验证码：email -> (code, expires_at)
_verify_codes: dict[str, tuple[str, datetime]] = {}


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


def _generate_code() -> str:
    """生成 6 位数字验证码"""
    return f"{random.randint(0, 999999):06d}"


async def send_register_code(db: AsyncSession, email: str, background_tasks: BackgroundTasks) -> bool:
    """发送注册验证码。如果邮箱已注册返回 False。"""
    # 检查邮箱是否已注册
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        return False

    # 限流：60 秒内只能发一次
    now = datetime.now(timezone.utc).timestamp()
    last = _resend_cooldown.get(email, 0)
    if now - last < 60:
        return True  # 限流但不暴露状态

    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    _verify_codes[email] = (code, expires)
    _resend_cooldown[email] = now

    # 清理过期的验证码
    stale = [k for k, (_, exp) in _verify_codes.items() if exp < datetime.now(timezone.utc)]
    for k in stale:
        del _verify_codes[k]

    background_tasks.add_task(_send_code_email, email, code)
    return True


def _send_code_email(to_email: str, code: str):
    """同步发送验证码邮件"""
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST 未配置，跳过发送验证码邮件")
        return
    body = f"""
    <h2>漂流瓶日记 - 邮箱验证</h2>
    <p>您的注册验证码是：</p>
    <h1 style="font-size:32px;letter-spacing:8px;color:#3b82f6;">{code}</h1>
    <p>验证码 10 分钟内有效。</p>
    """
    msg = MIMEText(body, "html", "utf-8")
    msg["Subject"] = "漂流瓶日记 - 注册验证码"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
    except Exception as e:
        logger.error(f"发送验证码邮件失败: {e}")


def verify_register_code(email: str, code: str) -> bool:
    """验证注册验证码"""
    stored = _verify_codes.get(email)
    if not stored:
        return False
    stored_code, expires = stored
    if datetime.now(timezone.utc) > expires:
        del _verify_codes[email]
        return False
    if stored_code != code:
        return False
    del _verify_codes[email]
    return True


async def register_user(
    db: AsyncSession, email: str, password: str
) -> User:
    """注册用户（验证码已通过）"""
    user = User(
        email=email,
        password_hash=hash_password(password),
        avatar_seed=str(uuid.uuid4()),
        is_verified=True,  # 验证码通过后直接标记已验证
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise EmailAlreadyRegisteredError("该邮箱已注册")
    await db.refresh(user)
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
