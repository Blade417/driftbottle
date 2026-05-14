# 服务器侧配置

这些文件已经部署到生产服务器,放在 repo 里是为了:
- 灾难恢复(机器跑路了能照着重建)
- 改动可追踪(直接改这里再 push 到服务器)

## 文件清单

| 文件 | 服务器路径 | 作用 |
|---|---|---|
| `driftbottle-backend.service` | `/etc/systemd/system/driftbottle-backend.service` | systemd 单元,跑 uvicorn |
| `driftbottle-backup.sh` | `/usr/local/bin/driftbottle-backup.sh` | SQLite 备份脚本,sqlite3 backup API + gzip |

## 配套服务器侧操作(不在文件里的)

```bash
# 1. 创建运行用户
useradd --system --no-create-home --shell /usr/sbin/nologin --home-dir /opt/driftbottle driftbottle
chown -R driftbottle:driftbottle /opt/driftbottle
chmod 600 /opt/driftbottle/backend/.env

# 2. 装 systemd 单元
cp scripts/server/driftbottle-backend.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now driftbottle-backend

# 3. 装备份脚本 + cron
cp scripts/server/driftbottle-backup.sh /usr/local/bin/
chmod +x /usr/local/bin/driftbottle-backup.sh
echo '0 4 * * * root /usr/local/bin/driftbottle-backup.sh' > /etc/cron.d/driftbottle-backup
```

## 改动后同步到服务器

```bash
scp scripts/server/driftbottle-backend.service root@driftmsg.top:/etc/systemd/system/
ssh root@driftmsg.top 'systemctl daemon-reload && systemctl restart driftbottle-backend'
```
