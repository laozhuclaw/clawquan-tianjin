# 评审：P0 紧急补丁 followup

> 评审人：Claude（laozhu 工作站）
> 评审对象：工作区里**未提交**的 3 个文件改动，对应 [REVIEW_HARDEN_REGISTRATION.md §7](REVIEW_HARDEN_REGISTRATION.md) 紧急补丁
> 评审时间：2026-04-27
> 前置评审：
> - [REVIEW_AGENT_AUTO_REGISTER.md](REVIEW_AGENT_AUTO_REGISTER.md)（991880b）
> - [REVIEW_HARDEN_REGISTRATION.md](REVIEW_HARDEN_REGISTRATION.md)（31da14b + §7 紧急补丁建议）

---

## 0. 总评

```
M app/routes/agents.py
M app/routes/auth.py
M web/src/app/login/page.tsx
```

**好消息**：3 处代码改动**逐字按 §7 来的**，实测正确：

| # | 改动 | 实测 |
|---|---|---|
| 1 | `AGENT_REGISTRATION_CODE` 不设直接 `RuntimeError` | ✅ 不设 import 即抛错；设了正常 |
| 2 | `DEMO_SMS_CODES` 默认 `false` | ✅ |
| 3 | 登录页 demo 块包 `NEXT_PUBLIC_DEMO_MODE === "true"` | ✅ |

**坏消息**：3 个配套问题没处理，合并后**任何人 pull 下来都跑不起来**。

---

## 1. 必须立即处理的 3 个配套问题

### 🔴 A. 代码改了但**没 commit**

`git log` 和 `origin/main` 上都没有这 3 处改动。如果 codex 是在阿里云服务器上改的，那是服务器本地工作区，从没推到 GitHub。

**修复**：
```bash
git add app/routes/agents.py app/routes/auth.py web/src/app/login/page.tsx
git commit -m "fix: P0 hardening — fail-fast on missing AGENT_REGISTRATION_CODE, demo defaults off"
git push origin main
```

---

### 🔴 B. `.env.example` 没加 `AGENT_REGISTRATION_CODE`

[/.env.example](../.env.example) 当前内容（已检查）只有 `SECRET_KEY` / `POSTGRES_*` / `DATABASE_URL` / `REDIS_URL` / `DEBUG` / `NEXT_PUBLIC_API_URL`。

新开发者按 README 流程 `cp .env.example .env` 之后启动，会撞上：

```
RuntimeError: AGENT_REGISTRATION_CODE env var must be set.
```

**没有任何提示告诉他要设什么、设多长**。

**修复**：在 `.env.example` 末尾追加：

```bash
# === Agent 注册流程 ===
# 智能体自动注册的共享秘密。后端启动时强制要求，未设置直接 RuntimeError。
# 生产请用 32 字节随机串，比如 `openssl rand -hex 32`
AGENT_REGISTRATION_CODE=dev-only-do-not-share-replace-in-prod

# Agent PoW 计算挑战难度（SHA-256 前缀 0 个数，1-6 合理）
AGENT_CHALLENGE_DIFFICULTY=4

# === 验证码 demo 模式 ===
# true 时 /api/auth/send-code 会把验证码直接放在响应里（仅供本地开发）
# 生产**必须** false，否则任何人能登录任何手机号
DEMO_SMS_CODES=false
```

同时 [web/.env.local.example](../web/.env.local.example) 加：

```bash
# 演示模式开关 — true 时登录页显示三个 demo 账号 + 默认密码 demo12345
# 生产必须 false 或不设
NEXT_PUBLIC_DEMO_MODE=true
```

---

### 🔴 C. [start-backend.command](../start-backend.command) 不设 env

当前最后一行：

```bash
exec $PY -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**不带任何 env**。这次合并完，**所有现有开发者双击这个脚本都会立刻报错退出**。

#### 修复方案 1（最简单）—— 脚本里给默认值

```bash
# 必填 env，未设置时给开发态默认值
export AGENT_REGISTRATION_CODE="${AGENT_REGISTRATION_CODE:-dev-only-do-not-share}"
export DEMO_SMS_CODES="${DEMO_SMS_CODES:-true}"   # 本地开发默认开 demo 验证码

exec $PY -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 修复方案 2（更优）—— 用 `python-dotenv` 自动读 `.env`

[app/main.py](../app/main.py) 顶部加：

```python
from dotenv import load_dotenv
load_dotenv()  # 自动从项目根 .env 读，不存在静默跳过
```

然后开发者只需要：
```bash
cp .env.example .env
./start-backend.command
```

`requirements.txt` 加 `python-dotenv`。这个方案对生产 docker-compose 也兼容（因为 docker-compose 已经从 .env 注入 env 了，`load_dotenv` 不会覆盖已存在的 env）。

**推荐方案 2**——更通用、更接近其他 FastAPI 项目惯例。

---

## 2. 上份评审里 P1 / P2 / M 仍全部未处理

按 [REVIEW_HARDEN_REGISTRATION.md §6](REVIEW_HARDEN_REGISTRATION.md) 的优先级表：

| 类别 | 编号 | 问题 | 状态 |
|---|---|---|---|
| 🟡 P1 | §3 P1-1 | 进程内 dict 不耐多 worker / 重启 / 内存爆 / 并发 | ❌ |
| 🟡 P1 | §3 P1-2 | 手机号归一化丢国家码（同人两条记录）| ❌ |
| 🟡 P1 | §3 P1-3 | `phone` 列无 DB unique 约束 | ❌ |
| 🟡 P1 | §3 P1-4 | 假邮箱 `xxx@phone.clawquan.local` 污染 users 表 | ❌ |
| ⚪ M | §4 M-2 | query string → JSON body | ❌ |
| ⚪ M | §4 M-3 | 201 Created 用在幂等复用 | ❌ |
| ⚪ M | §4 M-4 | 注册表单缺 `organization_id` 字段 | ❌ |
| ⚪ M | §4 M-5 | 输入长度校验 | ❌ |
| 🟢 P2 | §5 P2-1 | PoW difficulty=4 等于装饰 | ❌ |
| 🟢 P2 | §5 P2-2 | PoW 阻塞 UI 主线程 | ❌ |
| 🟢 P2 | §5 P2-3 | send-code 无限流（SMS bombing 风险）| ❌ |

**特别提醒 P1-1**：现在的 `_phone_codes` / `_agent_challenges` 都是模块级 dict。线上一旦 `uvicorn --workers 4` 部署，**~75% 的验证码请求会失败**——A worker 发的验证码到 B/C/D worker 验不过。这个不修就**不要尝试多 worker 部署**，否则用户体验会非常诡异（"验证码错误" 但其实给的就是收到的）。

**建议下一轮 PR 优先吃掉 P1-1（换 Redis）+ P1-2（手机号归一化）**——这两个是会直接影响真实用户的。

---

## 3. 优先级建议

### 🔥 这次 PR 必须包含
1. ✅ §1.A：commit + push 当前的 3 处改动
2. ✅ §1.B：补 `.env.example` / `web/.env.local.example`
3. ✅ §1.C：修 `start-backend.command`（推荐用 `python-dotenv` 方案）

不到 50 行总改动，可以一个 commit 搞定，建议 commit message：

```
fix: P0 hardening — fail-fast missing env vars + dev scaffolding

- agents.py: AGENT_REGISTRATION_CODE 未设直接 RuntimeError
- auth.py: DEMO_SMS_CODES 默认 false
- login/page.tsx: 演示账号块 gate 在 NEXT_PUBLIC_DEMO_MODE
- .env.example / web/.env.local.example: 补齐新增 env 说明
- start-backend.command: 用 python-dotenv 自动加载 .env

详见 docs/REVIEW_P0_FOLLOWUP.md
```

### 一周内
4. P1-1：换 Redis 存验证码/挑战
5. P1-2：手机号归一化策略写死（推荐：中国大陆 11 位、可选 +86）
6. M-4：注册表单加 `organization_id` 下拉

### 长期
- P1-3、P1-4 牵 migration，可以攒一次性做
- M-2、M-3、M-5 是清洁工作，不紧急
- P2 三条按业务量决定何时做

---

## 评审结束

参考：
- [REVIEW_HARDEN_REGISTRATION.md §7](REVIEW_HARDEN_REGISTRATION.md) — 这次三处代码改动的来源
- [REVIEW_HARDEN_REGISTRATION.md §3](REVIEW_HARDEN_REGISTRATION.md) — P1 架构问题详解
- 实测证据：
  ```bash
  # fail-fast 验证
  $ unset AGENT_REGISTRATION_CODE; python3 -c "from app.routes import agents"
  RuntimeError: AGENT_REGISTRATION_CODE env var must be set.

  # 设了正常 import
  $ AGENT_REGISTRATION_CODE=test python3 -c "from app.routes import agents"
  # (no error)
  ```
