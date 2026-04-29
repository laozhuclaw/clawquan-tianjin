# ClawQuan — AI 部署长期记忆

> 本文档供 Kimi Code CLI 每次部署时直接参考，确保一致性和效率。

---

## 1. 服务器信息

| 项 | 值 |
|---|---|
| 服务商 | 阿里云 ECS |
| 公网 IP | `47.102.216.22` |
| SSH 用户名 | `root` |
| SSH 密码 | `<通过安全渠道获取>` |
| 系统 | Alibaba Cloud Linux 3 (OpenAnolis Edition) |
| 连接方式 | `ssh -p 50022 root@47.102.216.22` |

---

## 2. 技术栈与架构

```
浏览器 ──► Nginx (80) ──┬── /            → 静态文件 (/opt/clawquan/web/dist)
                         ├── /_next/static/ → 静态资源（缓存1年）
                         ├── /health        → 代理到后端 :8000/health
                         ├── /api/*         → 代理到后端 :8000
                         └── /tianjin/*     → 天津高企协版静态文件 (/opt/clawquan-tianjin/web/dist)

后端: FastAPI + uvicorn @ 127.0.0.1:8000 (systemd: clawquan-api)
数据库: PostgreSQL 13 (systemd: postgresql)
缓存: Redis 6 (systemd: redis)
前端: Next.js 14 静态导出 (output: 'export') → web/dist/
```

**重要：前端是静态导出，不需要 Node 进程跑在生产环境。**

---

## 3. 关键路径

| 路径 | 说明 |
|---|---|
| 项目根目录 | `/opt/clawquan` |
| 前端构建输出 | `/opt/clawquan/web/dist` |
| 天津版前端输出 | `/opt/clawquan-tianjin/web/dist` |
| Nginx 配置 | `/etc/nginx/conf.d/clawquan.conf` |
| 后端 systemd | `/etc/systemd/system/clawquan-api.service` |
| Python venv | `/opt/clawquan/venv` (Python 3.11.13) |
| 环境变量文件 | `/opt/clawquan/.env` |
| SQLite 文件 | `/opt/clawquan/clawquan.db`（开发/本地用，生产实际走 PostgreSQL） |

---

## 4. 已知陷阱（必读）

### 陷阱 1：seed 必须加载 `.env`

直接运行 `python3 -m app.seed` **不会**加载 `.env`，会用默认 SQLite。正确做法：

```bash
cd /opt/clawquan
source venv/bin/activate
set -a && source .env && set +a
python3 -m app.seed
```

### 陷阱 2：`NEXT_PUBLIC_API_URL` 必须留空

生产构建时该变量应为空字符串，前端走相对路径 `/api/*`，由 Nginx 同域反代。

**不要**写成 `https://<域名>/api/`，会导致 `/api/api/...` 双前缀事故。

### 陷阱 3：`/api/` 根路由

FastAPI 默认只有 `/` 路由，Nginx `proxy_pass` 保留 `/api/` 前缀会导致外网 `/api/` 404。

**已在 `main.py` 中添加 `/api/` 路由**，后续若覆盖代码需保留：

```python
@app.get("/api/")
async def api_root():
    return {"message": "ClawQuan API is running!", "version": app.version}
```

### 陷阱 4：`/_next/static/` 资源 404

Nginx 配置中 `location /_next/static/` 不需要 `alias`，因为静态文件已在 `root /opt/clawquan/web/dist` 下。

但构建后必须确保 `web/dist/_next/` 目录存在且权限正确（`chmod -R 755`）。

### 陷阱 5：Python 版本 ≥ 3.10

代码使用 `X | None` (PEP 604) 语法，Python 3.9 会报错。服务器 venv 已用 Python 3.11，安全。

### 陷阱 6：文件权限

Git checkout 后 `app/` 和 `web/` 目录属主可能变成 `501 games`（macOS 上传残留）。

每次部署后必须执行：

```bash
chown -R root:root /opt/clawquan/app /opt/clawquan/web
chmod -R 755 /opt/clawquan/web/dist /opt/clawquan/app
```

---

## 5. 标准部署流程

```bash
# 1. 连接服务器（在本地执行）
ssh -p 50022 root@47.102.216.22

# 2. 停止后端（避免文件占用）
systemctl stop clawquan-api

# 3. 备份 .env 和数据库（以防万一）
cp /opt/clawquan/.env /root/.env.backup.$(date +%Y%m%d_%H%M%S)
cp /opt/clawquan/clawquan.db /root/clawquan.db.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 4. 拉取最新代码
cd /opt/clawquan
git fetch origin main
git checkout -f origin/main

# 5. 恢复 .env（git checkout -f 不会删除未跟踪文件，但保险起见确认一下）
# .env 不在 git 跟踪中，通常会自动保留。如果丢失，从 /root/.env.backup.* 恢复

# 6. 安装后端依赖
cd /opt/clawquan
source venv/bin/activate
pip install -r app/requirements.txt

# 7. 运行 seed（幂等，必须加载 .env）
set -a && source .env && set +a
python3 -m app.seed

# 8. 构建前端
cd /opt/clawquan/web
echo 'NEXT_PUBLIC_API_URL=' > .env.local
npm ci
npm run build

# 9. 修复权限
chown -R root:root /opt/clawquan/app /opt/clawquan/web
chmod -R 755 /opt/clawquan/web/dist /opt/clawquan/app

# 10. 重启后端
systemctl restart clawquan-api
sleep 3
systemctl status clawquan-api --no-pager

# 11. 重载 Nginx
nginx -t && nginx -s reload
```

---

## 6. 健康检查验证清单

部署完成后必须全部验证通过：

### 6.1 后端 API

```bash
curl -s http://127.0.0.1:8000/api/   # → {"message":"...", "version":"0.2.0"}
curl -s http://127.0.0.1:8000/health # → {"status":"healthy"}
```

### 6.2 外网访问

```bash
curl -s http://47.102.216.22/api/    # → {"message":"...", "version":"0.2.0"}
curl -s http://47.102.216.22/health  # → {"status":"healthy"}
```

### 6.3 数据完整性（基准值）

| 数据项 | 预期数量 | 验证命令 |
|---|---|---|
| 总会 (GRAND_CHAMBER) | 1 | `curl '127.0.0.1:8000/api/organizations/?type=GRAND_CHAMBER&limit=10' \| jq length` |
| 商会 (CHAMBER) | **11** | `curl '127.0.0.1:8000/api/organizations/?type=CHAMBER&limit=20' \| jq length` |
| 企业 (ENTERPRISE) | **49** | `curl '127.0.0.1:8000/api/organizations/?type=ENTERPRISE&limit=200' \| jq length` |
| 智能体 (Agents) | **67** | `curl '127.0.0.1:8000/api/agents/?limit=100' \| jq length` |
| 用户 (Users) | **17** | 通过 PostgreSQL: `sudo -u postgres psql -d clawquan -c 'SELECT COUNT(*) FROM users;'` |
| 帖子 (Posts) | **53** | `curl '127.0.0.1:8000/api/posts/?limit=200' \| jq length` |

### 6.4 前端路由 200

```bash
for p in / /organizations.html /community.html /opportunities.html /agents.html /agent.html /login.html /register.html /me.html; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://127.0.0.1$p"
done
# 全部应为 200
```

### 6.5 静态资源

```bash
# 找一条具体 CSS/JS 验证
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1/_next/static/css/$(ls web/dist/_next/static/css/*.css | head -1 | xargs basename)"
# → 200
```

### 6.6 天津高企协子路径

天津版部署入口为 `http://47.102.216.22/tianjin/`，静态导出目录独立于根站：

```bash
# 静态页面
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1/tianjin/
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1/tianjin/organizations

# 子路径 API（会转发到后端 /api/*）
curl -s http://127.0.0.1/tianjin/api/
curl -s http://127.0.0.1/tianjin/health

# 子路径静态资源
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" \
  "http://127.0.0.1/tianjin/_next/static/css/$(ls /opt/clawquan-tianjin/web/dist/_next/static/css/*.css | head -1 | xargs basename)"
```

**当前 Nginx 已配置：**

- `location /tianjin/` → `/opt/clawquan-tianjin/web/dist/`
- `location /tianjin/_next/static/` → 天津版静态资源
- `location /tianjin/api/` → `http://127.0.0.1:8000/api/`
- `location /tianjin/health` → `http://127.0.0.1:8000/health`

**注意**：天津前端 `web/next.config.js` 必须保留 `basePath: '/tianjin'`，前端 API 请求应走 `/tianjin/api/*`。

---

## 7. 服务管理速查

```bash
# 后端服务
systemctl status clawquan-api
systemctl restart clawquan-api
systemctl stop clawquan-api
journalctl -u clawquan-api -f

# 数据库
systemctl status postgresql
systemctl status redis
sudo -u postgres psql -d clawquan

# Nginx
nginx -t
nginx -s reload
systemctl status nginx
cat /var/log/nginx/error.log

# 端口监听
ss -tlnp | grep -E '80|8000|5432|6379'
```

---

## 8. 环境变量（生产 .env）

```bash
# 当前生产配置（密码已脱敏）
SECRET_KEY=<production-secret-key>
DATABASE_URL=postgresql://clawquan:****@127.0.0.1:5432/clawquan
REDIS_URL=redis://127.0.0.1:6379/0
DEBUG=false
```

**注意**：`.env` 不在 Git 跟踪中（已加入 `.gitignore`），每次部署不会覆盖。

---

## 9. 回滚方案

如需回滚到上一版本：

```bash
cd /opt/clawquan
git log --oneline -5          # 查看提交历史
git checkout <上一版本哈希>    # 切到上一版本
# 然后重新执行第 6-11 步（装依赖、seed、构建、重启）
```

如需完全重置数据库：

```bash
sudo -u postgres psql -d clawquan -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
set -a && source .env && set +a && python3 -m app.seed
```

---

*文档创建时间: 2026-04-25*
*最后部署: 2026-04-25 — 全部验证通过*
