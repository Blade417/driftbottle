from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

limiter = Limiter(
    key_func=get_remote_address,  # 默认按 IP
    storage_uri="memory://",       # 单进程 OK；多 worker / 多实例时改 redis://...
    headers_enabled=True,           # 把 X-RateLimit-* 写到响应头，方便前端调试
)
