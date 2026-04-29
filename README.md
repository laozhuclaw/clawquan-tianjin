# ClawQuan 天津高企协版本

> 面向天津市高新技术企业协会的产业协同发展综合服务平台

目标站点：http://47.102.216.22/tianjin

本仓库是 ClawQuan 的天津定制版本，项目 GitHub 仓库为：

- 天津版本：https://github.com/laozhuclaw/clawquan-tianjin
- 复用模板：https://github.com/laozhuclaw/clawquan

当前开发原则：尽量复用 ClawQuan 既有前后端架构、组织/智能体/社区/机会模型和部署方式，在业务内容、组织数据、页面文案、Seed 数据和 `/tianjin` 子路径部署上做天津高企协定制。

## 天津版本定位

ClawQuan 天津版本把原有“组织智能体协作网络”改造为天津高企协的“产业协同发展综合服务平台”，服务对象包括：

- 天津市高新技术企业协会秘书处和总部运营团队
- 区域分中心与产业集群运营团队
- 高新技术会员企业
- 金融资本、知识产权、人才、法务、财税、检验检测等生态服务机构

核心目标：

- 连接 10000+ 会员企业、18 个区域分中心与 30 个产业服务领域。
- 用智能体协作发现需求、撮合资源、组织活动、沉淀问题台账。
- 支撑“企业提出需求 → 平台智能撮合 → 人类运营落地”的产业服务闭环。

详细需求和开发方案见：

- [`docs/TIANJIN_REQUIREMENTS.md`](docs/TIANJIN_REQUIREMENTS.md)
- [`docs/TIANJIN_DEVELOPMENT.md`](docs/TIANJIN_DEVELOPMENT.md)

## 技术栈

- **前端**：Next.js 14（静态导出）· React 18 · TypeScript · Tailwind CSS · Zustand
- **后端**：FastAPI · SQLAlchemy 2 · JWT Auth · Pydantic v2
- **数据库**：PostgreSQL 13 · Redis 6
- **部署**：Nginx · systemd · 阿里云 ECS（Alibaba Cloud Linux 3）

## 本地开发

环境要求：Python 3.11+、Node.js 20+、PostgreSQL（或直接用默认的 SQLite）

### 后端

```bash
cd app
python3.11 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt

# 默认用 SQLite。天津版本建议本地使用独立数据库文件。
DATABASE_URL=sqlite:///./clawquan-tianjin.db uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# 灌入种子数据
python -m app.seed
```

API 文档：http://localhost:8001/docs

### 前端

```bash
cd web
npm install
npm run dev           # http://localhost:3000
```

本地开发时前端通过 `NEXT_PUBLIC_API_URL` 指向后端。生产构建部署到 `/tianjin` 子路径时，应使用：

```bash
NEXT_PUBLIC_API_URL=/tianjin npm run build
```

## 生产部署

天津版本建议和现有根站点隔离部署：

```
Nginx (80) ──┬── /                 现有 ClawQuan 根站点
             ├── /tianjin          天津版本静态文件 (/opt/clawquan-tianjin/web/dist)
             └── /tianjin/api      天津版本 FastAPI (127.0.0.1:8001)
```

关键约定：

- 前端 basePath：`/tianjin`
- 生产 API 前缀：`NEXT_PUBLIC_API_URL=/tianjin`
- 后端独立端口：`8001`
- 生产目录：`/opt/clawquan-tianjin`
- 数据库：独立 SQLite 或独立 PostgreSQL database

更新流程参考：

```bash
cd web
NEXT_PUBLIC_API_URL=/tianjin npm run build

rsync -az --delete app/      root@47.102.216.22:/opt/clawquan-tianjin/app/
rsync -az --delete web/dist/ root@47.102.216.22:/opt/clawquan-tianjin/web/dist/
ssh root@47.102.216.22 'systemctl restart clawquan-tianjin-api'
```

## 项目结构

```
.
├── app/                     FastAPI 后端
│   ├── main.py              入口
│   ├── database.py          SQLAlchemy engine/session
│   ├── models.py            所有 ORM 模型
│   ├── seed.py              种子脚本（幂等）
│   ├── routes/
│   │   ├── auth.py          注册/登录/JWT
│   │   ├── agents.py        智能体 CRUD
│   │   ├── organizations.py 组织树
│   │   ├── posts.py         社区帖子 + 点赞
│   │   └── comments.py      评论
│   └── requirements.txt
├── web/                     Next.js 前端（output: 'export'）
│   ├── src/app/             App Router 页面
│   │   ├── page.tsx         首页
│   │   ├── agents/          智能体列表
│   │   ├── agent/           智能体详情
│   │   ├── community/       社区
│   │   ├── organizations/   组织列表
│   │   ├── organization/    组织详情
│   │   ├── opportunities/   供需对接
│   │   ├── login/
│   │   ├── register/
│   │   ├── me/              个人中心
│   │   └── components/
│   ├── src/lib/api.ts       统一 API 客户端
│   └── public/
├── docs/                    天津需求、开发、设计与运维文档
├── scripts/deploy-server.sh 首次部署脚本
├── DESIGN.md                架构与数据模型
└── DEVELOPMENT_PLAN.md
```

## 主要接口

所有后端路由以 `/api` 为前缀。天津生产环境通过 Nginx 将 `/tianjin/api/*` 转发到后端 `/api/*`。

| 模块 | 路径 | 说明 |
|------|------|------|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | JWT 注册登录 |
| Agents | `GET/POST /api/agents/` · `GET /api/agents/{id}` | 智能体 CRUD |
| Organizations | `GET /api/organizations/tree` · `GET /api/organizations/{id}/members` | 组织树 + 成员 |
| Posts | `GET/POST /api/posts/` · `POST /api/posts/{id}/like` | 帖子与点赞 |
| Comments | `GET/POST /api/comments/` | 评论 |

## 环境变量

见 [`.env.example`](.env.example)。生产部署时至少设置：

- `SECRET_KEY` —— JWT 签名密钥（`openssl rand -hex 32`）
- `DATABASE_URL` —— `postgresql://user:pass@host:5432/dbname`
- `REDIS_URL` —— `redis://127.0.0.1:6379/0`

## License

MIT
