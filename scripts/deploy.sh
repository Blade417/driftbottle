#!/usr/bin/env bash
# DriftBottle 部署脚本
#
# 用法:
#   ./scripts/deploy.sh             # 部署后端 + 前端
#   ./scripts/deploy.sh backend     # 只部署后端
#   ./scripts/deploy.sh frontend    # 只部署前端
#
# 前提:
#   - SSH key 已配好到 root@driftmsg.top
#   - WSL 里能跑 npm (走 nvm)
#
# 不会动:
#   - 服务器上的 .env / driftbottle.db / 备份文件

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_HOST="root@driftmsg.top"
REMOTE_BACKEND="/opt/driftbottle/backend"

TARGET="${1:-all}"

deploy_backend() {
  echo "==> 推送 backend/app/ 到服务器"
  rsync -avz --delete \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    "$REPO_ROOT/backend/app/" \
    "$REMOTE_HOST:$REMOTE_BACKEND/app/"

  echo "==> 同步 requirements.txt"
  scp "$REPO_ROOT/backend/requirements.txt" "$REMOTE_HOST:$REMOTE_BACKEND/requirements.txt"

  echo "==> 安装新依赖 + 重启 systemd 服务"
  ssh "$REMOTE_HOST" "cd $REMOTE_BACKEND && venv/bin/pip install -q -r requirements.txt && systemctl restart driftbottle-backend"

  echo "==> 健康检查"
  sleep 2
  curl -sS -o /dev/null -w "https://driftmsg.top/api/health -> %{http_code}\n" https://driftmsg.top/api/health
}

deploy_frontend() {
  # 始终用 WSL 里 nvm 的 Node。WSL 的 PATH 默认会带上 Windows 的 npm,
  # 但那个走 cmd.exe 跑构建会因 UNC 路径炸,所以这里强制走 Linux 版。
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$HOME/.nvm/nvm.sh"
  else
    echo "ERROR: 找不到 ~/.nvm/nvm.sh,请先安装 nvm 和 Node" >&2
    exit 1
  fi

  echo "==> npm run build (node $(node -v))"
  (cd "$REPO_ROOT/frontend" && npm run build)

  echo "==> 推送 dist/ 到服务器 static/"
  rsync -avz --delete \
    "$REPO_ROOT/frontend/dist/" \
    "$REMOTE_HOST:$REMOTE_BACKEND/static/"

  echo "==> 验证首页"
  curl -sS -o /dev/null -w "https://driftmsg.top/ -> %{http_code}\n" https://driftmsg.top/
}

case "$TARGET" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  all)      deploy_backend; deploy_frontend ;;
  *) echo "用法: $0 [backend|frontend|all]"; exit 1 ;;
esac

echo "==> 完成"
