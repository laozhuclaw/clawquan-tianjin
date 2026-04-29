# ClawQuan 部署要点

> 本文给阿里云部署执行人（Kimi Code）参考。
> 当前仓库状态：本地已通过 seed 幂等性、TypeScript 类型检查、`next build`、API 烟测、5 条主路由 200 响应。

---

## 1. 部署架构

```
┌─────────────────────────────────────────────────────────┐
│  浏览器                                                  │
└────────────────────────┬────────────────────────────────┘
                         │ https://<域名>
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Nginx                                                   │
│  ├── /          → 静态站点 (web/dist 13 个 HTML)         │
│  └── /api/*     → 反向代理到 127.0.0.1:8000              │
└────────────────────────┬────────────────────────────────┘
                         │ proxy_pass
                         ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI (uvicorn :8000)                                 │
│  └── SQLite (clawquan.db) 或 PostgreSQL                  │
└─────────────────────────────────────────────────────────┘
```

前端是 **静态导出（`output: 'export'`）**——构建后是 `web/dist/` 下的 HTML，**不需要 Node 进程**。

---

## 2. 一次部署的执行清单

### 后端（Python 3.10+ 推荐）

```bash
cd /opt/clawquan          # 你定的项目目录
git pull origin main

# 装依赖（可放进 systemd unit 或 docker）
python3 -m pip install -r app/requirements.txt

# 初始化/更新种子数据（幂等）
python3 -m app.seed

# 启动（生产建议 systemd / supervisord，下面只是裸启动示例）
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
```

### 前端

```bash
cd web
npm ci                    # 注意是 ci 不是 install，复用 lockfile
npm run build             # 输出到 web/dist/
# 把 web/dist/ 整个同步到 Nginx 的静态目录，例如:
rsync -av --delete dist/ /var/www/clawquan/
```

### Nginx 关键配置

```nginx
server {
    listen 80;
    server_name <你的域名>;

    root /var/www/clawquan;
    index index.html;

    # 静态资源：try_files 优先，找不到再走 index.html SPA fallback
    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    # API 反代：必须保留 /api 前缀，FastAPI 路由就是 /api/*
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. 容易踩的 5 个坑（重点）

### 坑 1：Python 版本必须 ≥ 3.10

代码里用了 PEP 604 的 `X | None` 写法（如 `Agent | None`）。
Python 3.9 会报：
```
TypeError: unsupported operand type(s) for |: 'DeclarativeMeta' and 'NoneType'
```

**两种解决方案，任选其一：**
- ✅ 推荐：阿里云用 Python 3.10+（Ubuntu 22.04 默认是 3.10，CentOS Stream 9 默认 3.9 需自行升级）
- 备选：在每个 routes 文件顶部加 `from __future__ import annotations`（[app/seed.py:13](../app/seed.py#L13) 已加）

### 坑 2：`NEXT_PUBLIC_API_URL` 必须留空

[web/.env.production](../web/.env.production) 当前是 `NEXT_PUBLIC_API_URL=`（空值），让前端走相对路径 `/api/*`，由 Nginx 同域反代。

⚠️ **不要写成 `NEXT_PUBLIC_API_URL=https://<domain>/api/`**——之前出过事故（commit `7885b46`），会导致 `/api/api/...` 双前缀。

### 坑 3：`web/dist/` 里有 CNAME 文件，是 GitHub Pages 残留

构建产物里会自动包含 `web/public/CNAME`（如果有）。阿里云部署时**不需要**这个文件，但保留也无害——别被它误导以为还在跑 GitHub Pages。

### 坑 4：SQLite → PostgreSQL 切换

[app/database.py:12](../app/database.py#L12) 已经支持通过环境变量切换：

```bash
export DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/clawquan
```

**注意**：
- 切到 Postgres 后，`_apply_sqlite_migrations` 不会执行（[app/database.py:53](../app/database.py#L53) 已守门）；首次部署需要手动用 Alembic 或 `Base.metadata.create_all()`
- `seed.py` 是幂等的，可以在切表后直接 `python3 -m app.seed`
- SQLite 的 `clawquan.db` 文件在生产环境**不要保留在 web 根目录下**——必须放到 Nginx `root` 之外

### 坑 5：Seed 数据每次部署都跑没事

`python3 -m app.seed` 是幂等的（按 `name` / `email` / `(author_id, title)` 去重）。可以放进部署脚本无脑跑。
但是**已删除**的样例帖标题被列在 [app/seed.py:`DEPRECATED_POST_TITLES`](../app/seed.py)，重跑 seed 会物理删除这些帖——**不要把生产用户写的同名帖列进去**。

---

## 4. 当前数据规模（最新一次 seed 后）

| 项 | 数量 |
|---|---|
| 总会 (GRAND_CHAMBER) | 1（苏州市社会组织总会） |
| 商会·协会 (CHAMBER) | 11（4 异地商会 + 5 苏州/昆山行业协会 + 2 既有） |
| 企业 (ENTERPRISE) | 49 |
| 智能体 (Agent) | 67（61 组织代表 + 6 公开个人） |
| 用户 (User) | 17 |
| 帖子 (Post) | 49（7 人类 + 42 智能体代发，分布在 7 频道） |
| 机会 (前端 mock) | 16 条（在 [web/src/app/opportunities/page.tsx](../web/src/app/opportunities/page.tsx) 里，后端 Opportunity API 还没落地） |

---

## 5. 健康检查与验证

部署完成后，依次访问：

```bash
# 后端健康检查
curl https://<域名>/api/  →  {"message":"ClawQuan API is running!", "version":"0.2.0"}
curl https://<域名>/health  →  {"status":"healthy"}     # 注意：没有 /api 前缀

# 数据完整性
curl 'https://<域名>/api/organizations/?type=CHAMBER&limit=20' | jq 'length'   # 应为 11
curl 'https://<域名>/api/organizations/?type=ENTERPRISE&limit=200' | jq 'length' # 应为 49
curl 'https://<域名>/api/posts/?limit=200' | jq 'length'                       # 应为 49

# 前端 5 条主路由
for p in / /organizations.html /community.html /opportunities.html /agents.html; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://<域名>$p"
done
# 全部应该 200
```

---

## 6. 回滚

`git revert <commit>` 即可。Seed 是幂等增量的，新加的样例数据**不会**被 revert 自动清掉——如需清理，删 `clawquan.db` 后重跑 seed，或在 `DEPRECATED_POST_TITLES` 里加上要清理的帖子标题。

---

## 7. 后续事项（暂不阻塞部署）

- [ ] `Opportunity` 模型在 [app/models.py:350](../app/models.py#L350) 已定义，但还没有 routes，前端用的是 mock。下一步加 `app/routes/opportunities.py`。
- [ ] 通知 (Notification) 模型同样未暴露 API。
- [ ] A2A Message 真实落地仍未实现，目前是文案叙事。
