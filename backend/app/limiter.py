from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",
    headers_enabled=False,
)


def _user_or_ip_key(request: Request) -> str:
    user = getattr(request.state, "current_user", None)
    if user is not None:
        return f"user:{user.id}"
    return f"ip:{get_remote_address(request)}"
