# 评审：`feat: add agent auto registration`（commit 991880b）

> 评审人：Claude（laozhu 工作站）
> 评审对象：`origin/main` 991880b2f49406126ea3e4bf043117ec4aaa162d
> 评审时间：2026-04-26
> 已实际起服 + curl + headless Chrome 端到端验证过

---

## 0. 一个意外发现

工作区里发现你（codex）应该是没 commit 完就停了——本地有 3 个文件的未提交改动：

```
modified:   app/routes/agents.py
modified:   web/src/app/register/page.tsx
modified:   web/src/lib/api.ts
```

这部分改动恰好补上了 `991880b` 的几个严重漏洞（详见 §3）。本评审基于**已 push 到 GitHub 的 991880b**，但会在最后比对你这份 WIP 补丁是否覆盖到位。

---

## 1. 写得好的部分

- `_agent_to_dict` / `_user_to_dict` 把序列化逻辑收口，`identity_type` + `is_human` 的对偶字段语义清晰，前端拿到的对象一眼能区分人类 / 智能体身份。
- `auto-register` 的幂等性思路正确：先按 `api_endpoint` 命中，再按 `name + owner_id + organization_id` 兜底；同名重复注册不会创建副本，返回 `created: false`。
- `AgentCard.tsx` 链接从 `/agents/${id}` 改为 `/agent?id=${id}`，和 `/organization?id=...` 风格统一。
- `auth.py` 的 `register / login / me` 三个接口同步使用 `_user_to_dict`，前端拿到的人类对象现在也带 `identity_type: "HUMAN"`，前后端契约统一。

---

## 2. 必须修复的问题

### 🔴 P0-1. 端点完全无认证

**文件**：[app/routes/agents.py](../app/routes/agents.py)（991880b 版本中的 `auto_register_agent`）

`@router.post("/auto-register")` 没有 `Depends(get_current_user)`，**任何匿名请求都能直接注册智能体**。实测：

```bash
curl -s -X POST "http://localhost:8000/api/agents/auto-register?name=TestAgent"
# → 201 Created, agent 已写入 DB
```

### 🔴 P0-2. `organization_id` 完全被信任

注册路径里只检查"组织是否存在"，**不检查调用者是不是该组织成员**。也就是说任何人都可以伪造一个智能体挂在「苏州市社会组织总会」名下。

按 ClawQuan 「三级社会组织 AI Agent 协作社交网络」的定位，**伪冒商会智能体是政治红线级别风险**——这个 endpoint 不能在线上跑。

### 🔴 P0-3. 默认 `is_public=true` + 无限流 / CAPTCHA

结合 P0-1，相当于一个公开的智能体广场写入接口。垃圾 spam 一键灌爆。

### 🔴 P0-4. `owner_id` 永远是 `None`

```python
agent = Agent(..., owner_id=None, ...)
```

注册成功后**没有任何人是这个 agent 的 owner**，意味着：
- 不能通过普通 CRUD 修改 / 删除（PUT / DELETE 接口都按 owner 鉴权）
- 一旦 spam 上来，只能 DBA 直改数据库清理

---

## 3. 中等问题

### 🟡 M-1. `api_endpoint` 撞车跨组织 / 跨用户静默接管

[app/routes/agents.py](../app/routes/agents.py)：

```python
existing = db.query(Agent).filter(Agent.api_endpoint == api_endpoint).first()
...
if existing:
    return {"message": "Agent already registered", ..., "agent": _agent_to_dict(existing)}
```

如果 A 公司的 endpoint 已经登记，B 公司用同样的 endpoint 注册时**会被静默引导到 A 的 agent 详情**。攻击场景：先注册一个 endpoint 占位，等真正的 owner 来注册时把流量截走。

应该 `409 Conflict`，而不是返回别人的 agent。

### 🟡 M-2. 请求体走 query string

```python
async def auto_register_agent(
    name: str,
    description: str = "",
    ...
):
```

FastAPI 默认把这些都当 query 参数。前端 [web/src/lib/api.ts](../web/src/lib/api.ts) 的 `autoRegisterAgent` 也确实在拼 `URLSearchParams`：

```ts
const qs = new URLSearchParams({ name: params.name });
if (params.description) qs.set("description", params.description);
...
return request(`/api/agents/auto-register?${qs}`, { method: "POST" });
```

问题：

- `description`、`tags`（含中文、长文本）全部进 URL → 进 nginx access log；
- 长 description 容易触发 URL 长度上限（生产 nginx 默认 8KB header）；
- `POST` 不该用 query 传业务字段，是 REST 反模式。

应该改成 Pydantic body model + 前端 JSON body。

### 🟡 M-3. 幂等复用却返回 `201 Created`

```python
@router.post("/auto-register", status_code=status.HTTP_201_CREATED)
```

幂等命中复用时也回 `201`，按 REST 习惯应当 `200 OK`。语义上 client 不知道这次到底创建了没（虽然 body 里有 `created: false`，但 status code 也应该一致）。

建议：复用时 `Response.status_code = 200`，新建保留 `201`。

### 🟡 M-4. 前端表单缺 `organization_id`

[web/src/app/register/page.tsx](../web/src/app/register/page.tsx)：智能体表单只有 name / description / category / icon / tags / api_endpoint，**没有"挂在哪家组织下"这一项**。

后果：所有自动注册的智能体都是孤立的，**无法接入三级社会组织模型**，和产品定位直接冲突。

至少应该提供一个组织下拉框（带搜索 + 仅显示当前用户有 OWNER/ADMIN 权限的组织）。

### 🟡 M-5. 无输入长度 / 字符校验

`name`、`description`、`category`、`icon`、`tags` 都是 free-form 字符串，没有：

- 最大长度（agent name 应该 ≤ 64 字，description ≤ 500 字之类）
- emoji 字段长度限制（`agentIcon.slice(0, 4)` 在前端做了，后端没有兜底）
- HTML / 控制字符过滤

风险点：被人塞超长内容撑爆列表 UI。

---

## 4. 你的 WIP 补丁覆盖度评估

下面这份 diff 在工作区里但还没提交。我假设是你写到一半的版本：

```diff
# app/routes/agents.py
+ from ..models import OrganizationMembership, MemberRole
+ current_user: User = Depends(get_current_user)
+
+ # 校验组织成员身份
+ membership = db.query(OrganizationMembership).filter(
+     OrganizationMembership.organization_id == organization_id,
+     OrganizationMembership.user_id == current_user.id,
+ ).first()
+ if not membership or membership.role not in (MemberRole.OWNER, MemberRole.ADMIN):
+     raise HTTPException(status_code=403, ...)
+
+ # endpoint 撞车检测
+ if existing and organization_id and existing.organization_id != organization_id:
+     raise HTTPException(status_code=409, detail="API endpoint already registered")
+
+ # owner_id 不再永久 None
+ owner_id=None if organization_id else current_user.id

# web/src/lib/api.ts
- return request(`/api/agents/auto-register?${qs}`, { method: "POST" });
+ return request(`/api/agents/auto-register?${qs}`, { method: "POST", auth: true });

# web/src/app/register/page.tsx
+ if (!getToken()) {
+   setError("请先登录人类管理员账号，再注册智能体身份");
+   return;
+ }
```

| 问题 | 是否被 WIP 覆盖 |
|---|---|
| P0-1 端点无认证 | ✅ 覆盖（`Depends(get_current_user)`）|
| P0-2 organization_id 不校验 | ✅ 覆盖（OWNER/ADMIN 成员校验）|
| P0-3 spam 风险 | ⚠️ 部分缓解（要求登录就需要先注册人类账号），但**仍无限流 / CAPTCHA**，仍可被脚本批量注册 |
| P0-4 owner_id=None | ✅ 覆盖（个人 agent owner_id 落到 current_user）|
| M-1 endpoint 撞车 | ✅ 覆盖（409 Conflict）|
| M-2 query → body | ❌ 未处理 |
| M-3 201 vs 200 | ❌ 未处理 |
| M-4 前端缺 organization_id 字段 | ❌ 未处理 |
| M-5 输入校验 | ❌ 未处理 |

**结论**：WIP 补丁堵住了所有 P0 漏洞，方向正确，建议尽快提交。剩下 M-2 / M-3 / M-4 / M-5 可以在后续 PR 里继续。

---

## 5. 建议的后续工作

按优先级：

### 立即（合并前）
1. **提交并 push WIP 补丁**——P0 漏洞不能等
2. 在 commit message 里写清楚是 `991880b` 的安全加固

### 一周内
3. **M-1**：补 `auto-register` 的 endpoint 撞车 409 测试用例
4. **M-2**：把 query 参数改成 Pydantic body model
5. **M-4**：注册表单加 `organization_id` 下拉（仅显示当前用户管理的组织）

### 长期
6. **M-3 / M-5**：状态码、输入长度、限流（IP 级 + 用户级）
7. 给智能体加一个独立的「智能体凭据」概念——auto-register 应该返回一个 `agent_token`，给该 agent 后续 A2A 调用时签名用，而不是依赖人类管理员的 token

---

## 6. 顺便：两个独立 issue

我在排查过程中发现的小问题，跟 agent 注册不直接相关，但你看到了顺手处理：

- 部署到 47.102.216.22 的版本仍是 `991880b` 之前的旧 build，**首页折叠和社区计数 bug 修复都还没生效**。看起来部署脚本没有自动 pull + build。
- `app/routes/posts.py` 的路由是 `/api/posts/`（带尾斜杠），不带尾斜杠会 404。前端 `listPosts` 走的是带斜杠版本所以 OK，但直接 curl 容易踩坑，建议加一个 `/api/posts` → `/api/posts/` 的 redirect 或干脆去掉尾斜杠。

---

## 评审结束

如有疑问可以直接看：
- 实测脚本：`/tmp/claw-shots/test-register.mjs`（headless Chrome E2E）
- curl 实测记录：本评审 §2 P0-1 块
