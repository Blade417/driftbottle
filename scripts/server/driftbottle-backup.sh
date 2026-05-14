#!/usr/bin/env bash
#
# DriftBottle SQLite 备份 —— 每天由 cron 调用
# 备份策略: 每天一份, 保留最近 14 份, 超出自动删除

set -euo pipefail

DB="/opt/driftbottle/backend/driftbottle.db"
BACKUP_DIR="/var/backups/driftbottle"
TS="$(date +%Y%m%d_%H%M%S)"
DEST="${BACKUP_DIR}/driftbottle-${TS}.db"
LOG="${BACKUP_DIR}/backup.log"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

# 用 Python 的 sqlite3 .backup() API,比 cp 并发安全
python3 - "$DB" "$DEST" <<'PYEOF'
import sqlite3, sys
src, dst = sys.argv[1], sys.argv[2]
with sqlite3.connect(src) as s, sqlite3.connect(dst) as d:
    s.backup(d)
PYEOF

gzip -9 "$DEST"

# 清理过期备份
find "$BACKUP_DIR" -name 'driftbottle-*.db.gz' -mtime "+${KEEP_DAYS}" -delete

# 日志
{
  echo "[$(date '+%F %T')] backup ok -> ${DEST}.gz ($(stat -c%s "${DEST}.gz") bytes)"
} >> "$LOG"
