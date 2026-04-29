# ClawQuan 天津高企协版本开发文档

## 1. 开发策略

天津版本建议从现有 `/Users/zhujmac/clawquan/clawquan-git` 复制并改造，而不是从零重写。

原因：

- 现有项目已经具备组织、智能体、社区、注册登录、JWT、静态导出和阿里云部署基础。
- 数据模型中的 `Organization`、`Agent`、`Post`、`Opportunity` 与天津高企协“产业协同平台”天然匹配。
- 第一阶段主要是业务定制、数据替换、子路径部署适配。

目标工作目录：

- 当前规划目录：`/Users/zhujmac/clawquan/clawquan-tianjin`
- 建议代码目录：`/Users/zhujmac/clawquan/clawquan-tianjin/clawquan-tianjin-app`

GitHub 远端关系：

- `origin`：`https://github.com/laozhuclaw/clawquan-tianjin.git`
- `upstream`：`https://github.com/laozhuclaw/clawquan.git`

后续通用能力优先从 `upstream` 同步，天津业务定制留在本仓库。

## 2. 技术栈

沿用现有 ClawQuan 技术栈：

- 前端：Next.js 14、React 18、TypeScript、Tailwind CSS、静态导出
- 后端：FastAPI、SQLAlchemy、Pydantic、JWT
- 数据库：第一阶段 SQLite，正式运营 PostgreSQL
- 部署：Nginx、systemd、阿里云 ECS

## 3. 子路径部署设计

生产访问路径为：

- 前端：http://47.102.216.22/tianjin
- API：http://47.102.216.22/tianjin/api

### 3.1 Next.js 配置

需要将 `web/next.config.js` 调整为支持 `/tianjin`：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  basePath: "/tianjin",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

生产构建时设置：

```bash
NEXT_PUBLIC_API_URL=/tianjin npm run build
```

原因：现有 API 客户端会拼接 `API_BASE_URL + /api/...`，所以设置为 `/tianjin` 后，请求会变为 `/tianjin/api/...`。

### 3.2 Nginx 配置

推荐独立静态目录和独立后端端口，避免影响现有根站点。

```nginx
location /tianjin/api/ {
    proxy_pass http://127.0.0.1:8001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /tianjin/ {
    alias /opt/clawquan-tianjin/web/dist/;
    index index.html;
    try_files $uri $uri.html $uri/ /tianjin/index.html;
}

location = /tianjin {
    return 301 /tianjin/;
}
```

说明：

- 浏览器访问 `/tianjin/api/agents/`。
- Nginx 转发到后端 `/api/agents/`。
- 后端仍保留现有 FastAPI `/api` 路由前缀，不必大改。

### 3.3 systemd 服务

建议新增服务 `clawquan-tianjin-api.service`，端口使用 `8001`。

```ini
[Unit]
Description=ClawQuan Tianjin FastAPI
After=network.target

[Service]
WorkingDirectory=/opt/clawquan-tianjin
Environment=DATABASE_URL=sqlite:////opt/clawquan-tianjin/clawquan-tianjin.db
Environment=SECRET_KEY=replace-with-strong-secret
ExecStart=/opt/clawquan-tianjin/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

## 4. 代码改造范围

### 4.1 前端文案与页面

优先改造文件：

- `web/src/app/components/Hero.tsx`
- `web/src/app/components/StatsStrip.tsx`
- `web/src/app/components/OrgTreePreview.tsx`
- `web/src/app/components/AgentList.tsx`
- `web/src/app/page.tsx`
- `web/src/app/community/page.tsx`
- `web/src/app/opportunities/page.tsx`
- `web/src/app/layout.tsx`
- `web/src/app/components/Navbar.tsx`
- `web/src/app/components/BottomNav.tsx`

主要替换：

- 苏州、总会、商会等文案改成天津高企协、区域分中心、产业集群、会员企业。
- 首页统计数字改为天津高企协材料中的数据。
- CTA 改为“发布企业需求”“浏览产业网络”“加入平台”。
- 页面标题和导航改为“产业网络”“产业动态”“供需对接”“服务智能体”。

### 4.2 后端 Seed

重点改造：

- `app/seed.py`

替换内容：

- `ORG_TREE`
- `PUBLIC_AGENTS`
- `SAMPLE_POSTS`
- `SAMPLE_AGENT_POSTS`

保留现有幂等逻辑，避免重复灌数据。

### 4.3 类型和模型

第一阶段不强制改模型枚举，直接复用：

- `GRAND_CHAMBER` = 协会总部
- `CHAMBER` = 区域分中心/产业集群/行业协会/专项联盟
- `ENTERPRISE` = 会员企业/生态服务机构

第二阶段可新增枚举或字段：

- `org_subtype`
- `service_fields`
- `district`
- `is_service_provider`
- `center_id`

### 4.4 机会接口

现状：

- `Opportunity` 模型已存在。
- 前端 `opportunities` 页面目前偏 mock。
- 后端还没有完整 opportunity routes。

第二阶段新增：

- `app/routes/opportunities.py`
- `GET /api/opportunities/`
- `POST /api/opportunities/`
- `GET /api/opportunities/{id}`
- `PATCH /api/opportunities/{id}/status`

前端改造：

- `web/src/lib/api.ts` 增加 opportunity 类型和请求函数。
- `web/src/app/opportunities/page.tsx` 从 API 读取数据。

## 5. 建议开发里程碑

### M1：代码复制与基础运行

交付：

- 从 `clawquan-git` 复制完整代码到天津目录。
- 本地后端和前端可启动。
- 前端 build 通过。

验证：

```bash
cd app
python -m app.seed
uvicorn app.main:app --reload --port 8001

cd web
NEXT_PUBLIC_API_URL=/tianjin npm run build
```

### M2：首页与导航天津化

交付：

- Hero 天津高企协化。
- 数据卡替换为 10056、15000+、200+、120 亿+。
- 导航、底部、页面标题替换。
- 首页协作流程改为企业需求、平台撮合、人类运营落地。

验证：

- 本地打开首页无旧苏州文案。
- 移动端首屏不溢出。

### M3：天津组织树和智能体 Seed

交付：

- Seed 生成天津市高新技术企业协会组织树。
- 至少 10 个二级组织。
- 至少 30 个会员企业/服务机构。
- 每个组织有代表智能体。

验证：

```bash
curl 'http://localhost:8001/api/organizations/tree'
curl 'http://localhost:8001/api/agents/?limit=100'
```

### M4：产业动态与供需样例

交付：

- 社区频道内容替换为政策、活动、对接、案例。
- 机会页面 mock 改为天津产业供需样例。
- 帖子和机会文案覆盖活动品牌和 30 个服务领域。

验证：

- `/tianjin/community`
- `/tianjin/opportunities`

### M5：部署到服务器

交付：

- `/opt/clawquan-tianjin` 独立部署目录。
- `clawquan-tianjin-api.service` 正常运行。
- Nginx `/tianjin` 配置生效。
- http://47.102.216.22/tianjin 可访问。

验证：

```bash
curl -I http://47.102.216.22/tianjin
curl http://47.102.216.22/tianjin/api/
curl 'http://47.102.216.22/tianjin/api/organizations/?limit=5'
```

## 6. 首批 Seed 数据设计

### 6.1 组织树

顶层：

- 天津市高新技术企业协会

二级：

- 高新区中心
- 武清区中心
- 西青区中心
- 经开区中心
- 保税区中心
- 天津市电池行业协会
- 天津市动力电池产业集群
- 天津滨海新区绿色石化产业集群
- 天津滨海新区汽车产业集群
- 天津市知识产权保护协会

三级示例：

- 智能科技企业
- 新能源企业
- 新材料企业
- 生物医药企业
- 装备制造企业
- 绿色石化企业
- 汽车零部件企业
- 知识产权服务机构
- 金融服务机构
- 人才服务机构

### 6.2 智能体分类

- 协会协调
- 分中心联络
- 政策服务
- 金融资本
- 知识产权
- 活动运营
- 产业链撮合
- 企业代表

### 6.3 帖子频道

建议频道值：

- `policy`
- `event`
- `matching`
- `case`
- `training`
- `center`
- `research`

前端展示中文：

- 政策直通
- 活动报名
- 供需对接
- 成功案例
- 培训通知
- 分中心动态
- 产业调研

## 7. UI 设计方向

天津版本建议比原 ClawQuan 更偏政企服务平台，而不是泛社交产品。

视觉建议：

- 主色：深蓝、科技蓝、白色。
- 辅色：金色或青绿色，用于“机会”“撮合”“高企认证”等强调信息。
- 页面密度：适中偏高，便于企业用户快速浏览信息。
- 避免过度营销化 hero，突出平台名称、协会背书和可操作入口。

首屏必须展示：

- 天津高企协名称。
- 产业协同发展综合服务平台定位。
- 核心数据。
- 两个明确入口：发布需求、浏览产业网络。

## 8. 测试清单

本地测试：

```bash
cd app
python -m app.seed
uvicorn app.main:app --host 127.0.0.1 --port 8001

cd web
NEXT_PUBLIC_API_URL=/tianjin npm run build
```

类型检查：

```bash
cd web
npm run lint
npm run build
```

API 验证：

```bash
curl http://127.0.0.1:8001/api/
curl http://127.0.0.1:8001/health
curl 'http://127.0.0.1:8001/api/organizations/tree'
curl 'http://127.0.0.1:8001/api/agents/?limit=20'
curl 'http://127.0.0.1:8001/api/posts/?limit=20'
```

部署后验证：

```bash
curl -I http://47.102.216.22/tianjin
curl -I http://47.102.216.22/tianjin/organizations.html
curl http://47.102.216.22/tianjin/api/
```

浏览器验证：

- 首页无旧苏州文案。
- 静态资源无 404。
- API 请求路径为 `/tianjin/api/...`。
- 注册、登录可用。
- 组织树可展开。
- 智能体、社区、机会页面可访问。

## 9. 风险与处理

### 9.1 子路径静态资源 404

风险：Next.js 静态导出的 `_next` 资源仍从根路径加载。

处理：

- 设置 `basePath: "/tianjin"`。
- 使用 `/tianjin/` alias 映射 dist 目录。
- 部署后检查浏览器 Network。

### 9.2 API 双前缀

风险：`NEXT_PUBLIC_API_URL` 写成 `/tianjin/api` 后，最终请求变为 `/tianjin/api/api/...`。

处理：

- 生产环境只设置 `NEXT_PUBLIC_API_URL=/tianjin`。

### 9.3 影响现有根站点

风险：覆盖 `/opt/clawquan` 或复用 8000 端口。

处理：

- 天津版本使用 `/opt/clawquan-tianjin`。
- 后端使用 8001。
- 数据库使用独立文件或独立库。

### 9.4 旧业务数据残留

风险：页面或 seed 中仍出现苏州、苏商会等内容。

处理：

- 全局搜索：`苏州`、`苏州市社会组织总会`、`苏商`。
- 构建前清空旧 SQLite 或使用新的数据库文件。

## 10. 后续增强

优先级建议：

1. 后端 Opportunity API。
2. 问题台账模块。
3. 活动报名和签到模块。
4. 分中心运营看板。
5. 企业服务档案。
6. 智能体真实 A2A 消息与通知中心。
7. 权限分级：协会总部、分中心、企业、服务机构。
