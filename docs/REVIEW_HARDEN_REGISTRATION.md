# 评审：`fix: harden human and agent registration`（commit 31da14b）

> 评审人：Claude（laozhu 工作站）
> 评审对象：`origin/main` 31da14bbd0143e420f4c4d6803c49660a26ca53f
> 评审时间：2026-04-26
> 前置评审：[REVIEW_AGENT_AUTO_REGISTER.md](REVIEW_AGENT_AUTO_REGISTER.md)（commit 991880b 的 5 个问题列表）

---

## 0. 总评

这次走得比上一份评审建议的远很多——直接把人类账号体系切到**手机号 + 验证码**，agent 注册引入**注册码 + PoW 计算挑战**双因子。

| 维度 | 评价 |
|---|---|
| 上份评审 P0（4 条） | ✅ 全部修了（auth、组织成员校验、owner_id、endpoint 冲突）|
| 上份评审 M（5 条） | ❌ 4 条仍未处理（详见 §4）|
| 新引入的问题 | ⚠️ 至少 5 条 P0/P1，**生产配置默认值会击穿安全模型** |

**核心结论：方向对，但默认值和进程内状态这两件事不修就不能上线。**

---

## 1. 写得好的部分

### 1.1 全部 P0 漏洞封死
- `auto_register_agent` 加了 `Depends(get_current_user)`
- `organization_id` 必须校验调用者是 `OWNER`/`ADMIN` 成员
- `api_endpoint` 跨用户/跨组织撞车直接 `409 Conflict`
- 个人 agent `owner_id = current_user.id`，组织 agent `owner_id = None`（语义清晰）

### 1.2 手机号 + OTP 切换
- 中国市场习惯，比邮箱密码反爬强
- 同时保留 `/api/auth/login` 邮箱密码通道做演示，平滑过渡
- 前端登录页拆 `手机验证码` / `演示账号` 两个 tab，DX 友好

### 1.3 智能体注册码 + PoW 挑战
- 共享 `agent_code` 是真正的访问控制
- `_challenge_digest` 的 hash 输入包含 `challenge_id + agent_code + nonce + salt`，盐值正确，不会让攻击者预计算
- `secrets.compare_digest` 防时序攻击，做得规范

### 1.4 序列化收口
- 上份评审赞过的 `_agent_to_dict` / `_user_to_dict` 进一步收紧（user 现在多 `phone` 字段）
- JWT issue 路径全部走 `_user_to_dict` 出，前后端契约稳定

---

## 2. 必须立即修复（P0）

### 🔴 P0-1. `DEMO_SMS_CODES=true` 是默认值

[app/routes/auth.py:24](../app/routes/auth.py#L24)：

```python
DEMO_SMS_CODES = os.getenv("DEMO_SMS_CODES", "true").lower() == "true"
```

后果：[app/routes/auth.py:118](../app/routes/auth.py#L118) 的 `send_phone_code` 会把验证码**直接放在 HTTP 响应里返回**：

```python
if DEMO_SMS_CODES:
    response["demo_code"] = code
```

**整个手机验证码安全模型会被这个默认值瞬间击穿**。生产环境忘了设环境变量 → 任何人能拿任何手机号注册并登录别人的账号。

**修复**：
```python
DEMO_SMS_CODES = os.getenv("DEMO_SMS_CODES", "false").lower() == "true"
```
默认 `false`，本地开发显式 `export DEMO_SMS_CODES=true`。

---

### 🔴 P0-2. `AGENT_REGISTRATION_CODE` 默认值是公开字符串

[app/routes/agents.py:21](../app/routes/agents.py#L21)：

```python
AGENT_REGISTRATION_CODE = os.getenv("AGENT_REGISTRATION_CODE", "clawquan-agent-demo")
```

线上忘了设 env → `clawquan-agent-demo` 就是公开秘密（现在已经在 GitHub 公开仓库上了）。任何人拿到这串字符 + 一个有效人类登录态就能给任意自己已 OWNER 的组织注册无限智能体。

**修复**：未设置时直接 fail-fast：
```python
AGENT_REGISTRATION_CODE = os.getenv("AGENT_REGISTRATION_CODE")
if not AGENT_REGISTRATION_CODE:
    raise RuntimeError("AGENT_REGISTRATION_CODE env var is required")
```

或者给一个不同的 demo 默认 `"DEMO-DO-NOT-USE-IN-PROD"` 然后在生产部署文档里强烈标注。

---

### 🔴 P0-3. 登录页公开打印演示账号密码

[web/src/app/login/page.tsx:203](../web/src/app/login/page.tsx#L203)：

```tsx
演示账号（密码均为 <code>demo12345</code>）
```

任何访客都能看到这个字段，本地开发友好，**生产环境是个公开告示牌**。

**修复**：用环境变量包起来：
```tsx
{mode === "password" && process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
  <div>...演示账号...</div>
)}
```

---

## 3. 架构问题（P1）

### 🟡 P1-1. 进程内 dict 存验证码/挑战

[app/routes/auth.py:27](../app/routes/auth.py#L27)：

```python
_phone_codes: dict[str, tuple[str, float]] = {}
```

[app/routes/agents.py:25](../app/routes/agents.py#L25)：

```python
_agent_challenges: dict[str, dict] = {}
```

这是模块级 dict，在四种场景下会出问题：

1. **多 worker uvicorn**：worker A 发的 code 在 worker B 验不过。`uvicorn --workers 4` 直接挂 75% 请求。
2. **进程重启**：所有 in-flight 的验证码/挑战丢失。
3. **无后台清理**：过期项只在被访问时移除，未消费就一直在。攻击者批量调 `send-code` 给随机号码 → 内存无界增长。
4. **并发竞态**：`challenge["used"] = True` 不是原子操作，FastAPI 异步并发下能用同一个挑战注册多次。

**修复**：
- 短期：单 worker 部署 + 加个 `asyncio` 后台任务定期 sweep + 内存上限（>10000 条直接拒新）
- 长期：换 Redis（`SET ... EX 300 NX` 一行解决全部 4 个问题）

---

### 🟡 P1-2. 手机号归一化丢弃国家码

[app/routes/auth.py:46](../app/routes/auth.py#L46)：

```python
def _normalize_phone(phone: str) -> str:
    normalized = re.sub(r"\D", "", phone or "")
```

| 用户输入 | 归一化结果 |
|---|---|
| `+8615912345678` | `8615912345678` |
| `15912345678` | `15912345678` |
| `+86 159 1234 5678` | `8615912345678` |

**同一个人用两种写法注册会建两条记录，登录时另一种写法直接 404。**

**修复**：明确国家码策略。最简单做法——
```python
def _normalize_phone(phone: str) -> str:
    normalized = re.sub(r"\D", "", phone or "")
    if normalized.startswith("86") and len(normalized) == 13:
        normalized = normalized[2:]  # 中国手机号永远去掉 86
    if not (len(normalized) == 11 and normalized.startswith("1")):
        raise HTTPException(400, "请输入有效的中国大陆手机号")
    return normalized
```

如果要支持国际手机号，引入 `phonenumbers` 库或在 DB 里存 E.164 格式（永远带 `+86`）。

---

### 🟡 P1-3. `phone` 列没有 DB 级 unique 约束

[app/models.py:107](../app/models.py#L107)：

```python
phone = Column(String(32))  # 没 unique=True
```

应用层在 [auth.py:148](../app/routes/auth.py#L148) 的 `or_()` 检查在并发提交下**有竞态窗口**：两个请求几乎同时来 → 都通过查询 → 都成功插入。

**修复**：
1. `phone = Column(String(32), unique=True)` （但 SQLite 会拒绝多个 NULL，所以等价于全表唯一）
2. 或加 partial unique index（仅当 phone 非空），需要 migration
3. 或改成 PostgreSQL 后用 `UNIQUE NULLS NOT DISTINCT`（PG 15+）

短期方案：在事务里 `with db.begin():` 包住查询和插入，至少保证单进程内串行。

---

### 🟡 P1-4. 假邮箱混入 users 表

[app/routes/auth.py:67](../app/routes/auth.py#L67)：

```python
def _phone_email(phone: str) -> str:
    return f"{phone}@phone.clawquan.local"
```

phone 注册的用户 email 字段被填成 `15912345678@phone.clawquan.local`。问题：

1. 群发邮件、邮箱列表导出会带上这些假地址，发出去会被 SMTP 拒绝或被反垃圾邮件列入黑名单
2. **JWT 的 `sub` 用的是 email**（[auth.py:175](../app/routes/auth.py#L175) `data={"sub": new_user.email}`），所以这个假地址进了 token，每次请求 `get_current_user` 都按这个假邮箱查
3. 用户后来想绑真实邮箱时，得先把这个假邮箱解开

**修复**：
1. `email = Column(String(255), unique=True, nullable=True)` —— 让 email 真正可空
2. JWT 改成 `data={"sub": str(new_user.id)}`，`get_current_user` 按 id 查
3. `_phone_email` 直接删掉

这个改动牵动 migration，但不做的话整个用户表会污染。

---

## 4. 上份评审里仍未处理的 4 条

| 编号 | 问题 | 状态 |
|---|---|---|
| M-2 | query string → JSON body | ❌ 反而更糟（`agent_code`、`nonce` 也进 URL，access log 一抓一个准）|
| M-3 | 201 Created 用在幂等复用 | ❌ |
| M-4 | 前端表单缺 `organization_id` 字段 | ❌（agent 仍只能注册成孤儿）|
| M-5 | 输入长度校验 | ❌ |

特别说一下 **M-4**：

agent 现在有两条路径——
- 个人 agent：`owner_id = current_user.id`，挂在用户名下
- 组织 agent：`organization_id = X`，调用者必须是该 X 的 OWNER/ADMIN

但**前端表单只暴露了"个人 agent"路径**——没有任何地方让用户选 organization_id。意味着所有自动注册的智能体永远都是孤立个人 agent，**接不进三级社会组织模型**，和产品核心定位（总会—商会—企业）直接冲突。

需要在 agent 表单里加一个：
```tsx
<Field label="挂在哪家组织下" hint="可选">
  <select>
    <option value="">个人智能体</option>
    {/* 通过 GET /api/organizations?manage_only=true 拿到当前用户管理的所有组织 */}
    {orgs.map(o => <option value={o.id}>{o.name}</option>)}
  </select>
</Field>
```

后端配套需要一个 `/api/organizations?manage_only=true` 接口（仅返回当前用户是 OWNER/ADMIN 的组织）。

---

## 5. 弱化或易绕过（P2）

### 🟢 P2-1. PoW difficulty=4 等于装饰

[app/routes/agents.py:23](../app/routes/agents.py#L23)：

```python
AGENT_CHALLENGE_DIFFICULTY = int(os.getenv("AGENT_CHALLENGE_DIFFICULTY", "4"))
```

SHA-256 前缀 4 个 0，平均期望 8 次尝试，浏览器 `crypto.subtle.digest` 几毫秒搞定。脚本攻击者解得**一样快**——这个 PoW 实际不构成任何反爬障碍。

实际安全完全靠 `agent_code` 共享秘密。一旦 `agent_code` 泄露，PoW 就是个表演节目。

**建议**：
- 要么承认 PoW 防的是表单骚扰不是自动化，难度提到 5（仍快）+ 在 README 里写清楚
- 要么直接移除，把节省下来的 UI 复杂度还给用户

---

### 🟢 P2-2. PoW 在主线程同步循环阻塞 UI

[web/src/app/register/page.tsx:432](../web/src/app/register/page.tsx#L432)：

```tsx
for (let i = 0; i < 2_000_000; i++) {
  ...
  const digestBuffer = await crypto.subtle.digest("SHA-256", bytes);
  ...
}
```

难度=4 时几毫秒结束没事；难度调到 6 → ~4096 次 → 几百毫秒，UI 已经卡顿；难度=8 → 主线程冻住几秒到几十秒。

**修复**：
- 移到 Web Worker（最干净）
- 或每 1000 次 `await new Promise(r => requestAnimationFrame(r))` 让出主线程

---

### 🟢 P2-3. `/api/auth/send-code` 无限流

攻击者拿目标手机号反复调 `send-code` → 真人手机被短信轰炸（业内叫 SMS bombing）。生产环境通常需要：

- 同 IP 60 秒内 1 次
- 同手机号 60 秒内 1 次 + 同手机号 24 小时内 ≤ 10 次

**修复**：用 SlowAPI 或 fastapi-limiter；进程内方案需要先解决 §3 P1-1（多 worker）。

---

## 6. 优先级建议

### 🔥 上线前必修（不修就不要 push 到生产）
1. **§2 P0-1**：`DEMO_SMS_CODES` 默认 `false`
2. **§2 P0-2**：`AGENT_REGISTRATION_CODE` 没设就 fail-fast
3. **§2 P0-3**：登录页"演示账号"包 `NEXT_PUBLIC_DEMO_MODE` 开关

这三个改动加起来不到 30 行代码，可以单独一个 commit 立刻 push。

### 一周内
4. **§3 P1-1**：换 Redis（或至少加 sweep + 上限）
5. **§3 P1-2**：手机号归一化策略写死
6. **§3 P1-3**：phone 加 unique 约束 + migration
7. **§4 M-4**：注册表单加 `organization_id` 下拉

### 长期
8. **§3 P1-4**：JWT sub 切到 user.id，email 真正可空（migration 较大）
9. **§4 M-2 / M-3 / M-5**：query → body、201 → 200、输入长度限制
10. **§5**：PoW 决定保留还是移除，限流框架引入

---

## 7. 一组建议的 30 行紧急补丁（直接可贴）

```python
# app/routes/auth.py
- DEMO_SMS_CODES = os.getenv("DEMO_SMS_CODES", "true").lower() == "true"
+ DEMO_SMS_CODES = os.getenv("DEMO_SMS_CODES", "false").lower() == "true"
```

```python
# app/routes/agents.py
- AGENT_REGISTRATION_CODE = os.getenv("AGENT_REGISTRATION_CODE", "clawquan-agent-demo")
+ AGENT_REGISTRATION_CODE = os.getenv("AGENT_REGISTRATION_CODE")
+ if not AGENT_REGISTRATION_CODE:
+     raise RuntimeError(
+         "AGENT_REGISTRATION_CODE env var must be set. "
+         "For local dev: export AGENT_REGISTRATION_CODE=dev-only-do-not-share"
+     )
```

```tsx
// web/src/app/login/page.tsx
- {mode === "password" && (
+ {mode === "password" && process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
  <div className="mt-5 pt-5 border-t border-ink-100">
    ...演示账号...
  </div>
  )}
```

```bash
# docs/DEPLOYMENT.md 里需要写清楚
# 生产 .env 必须设置：
AGENT_REGISTRATION_CODE=<32 位随机字符串>
DEMO_SMS_CODES=false
NEXT_PUBLIC_DEMO_MODE=false
```

---

## 评审结束

如有疑问可以看：
- 上一份评审：[REVIEW_AGENT_AUTO_REGISTER.md](REVIEW_AGENT_AUTO_REGISTER.md)
- 完整 diff：`git show 31da14b`
