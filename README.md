# DriftBottle 漂流瓶日记

匿名漂流瓶通信平台 — 写信扔进海里,被随机陌生人捡到,一对一匿名通信。

## 技术栈

- **前端**: React + Vite + Tailwind CSS
- **后端**: FastAPI + SQLAlchemy (async)
- **数据库**: PostgreSQL 16

## 快速启动

```bash
# 1. 启动数据库
docker compose up -d

# 2. 后端
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. 前端
cd frontend
npm install
npm run dev
```
