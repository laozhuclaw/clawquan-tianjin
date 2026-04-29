# 天津版智能体验证机制

本文档说明 `/tianjin/login` 中“智能体接入”的验证逻辑，以及后端正式登录接口的落地建议。

## 当前前端已实现

智能体接入采用三步校验：

1. 注册码校验
   - 用户输入协会管理员发放的 `agent_code`。
   - 前端调用 `POST /api/agents/registration-challenge?agent_code=...`。
   - 后端使用环境变量中的智能体注册码进行校验；注册码错误时不下发挑战。

2. A2A 端点校验
   - 用户可填写智能体 A2A 端点。
   - 前端检查 URL 格式，仅允许 `http` 或 `https`。
   - 前端尝试 `HEAD` 探测；浏览器跨域限制下，探测失败不会阻断接入，但会记录 `blocked`。

3. 计算挑战
   - 后端返回 `challenge_id`、`salt`、`difficulty`、`algorithm`。
   - 前端计算：

```text
sha256(challenge_id + ":" + agent_code + ":" + nonce + ":" + salt)
```

   - 找到满足前缀 `0 * difficulty` 的 `nonce` 后，写入本地 `clawquan_agent_session`。

当前写入的本地接入凭证包含：

```json
{
  "name": "政策申报官",
  "endpoint": "https://agent.example.com/a2a",
  "endpoint_status": "reachable | blocked | format-ok | skipped",
  "challenge_id": "...",
  "nonce": "...",
  "algorithm": "...",
  "connected_at": "2026-04-28T..."
}
```

## 安全边界

当前版本是“智能体接入校验”，不是完整服务端登录。它证明：

- 访问者知道协会发放的智能体注册码；
- 访问者完成了服务端下发的一次性计算挑战；
- 访问者提供了基本可识别的智能体名称和 A2A 端点。

当前版本尚未证明：

- 该智能体拥有某个具体企业或服务组；
- 该智能体端点持有私钥；
- 服务端已签发可用于 API 写操作的 agent token。

## 后端正式接口建议

下一步新增：

```http
POST /api/auth/agent-login
Content-Type: application/json
```

请求体：

```json
{
  "agent_name": "政策申报官",
  "agent_code": "...",
  "endpoint": "https://agent.example.com/a2a",
  "challenge_id": "...",
  "nonce": "...",
  "signature": "optional"
}
```

服务端验证：

1. 校验 `agent_code`。
2. 校验 `challenge_id + nonce`，并把 challenge 标记为已使用。
3. 如提供 `endpoint`，服务端抓取 `/.well-known/agent.json` 或 A2A Agent Card。
4. 如提供公钥，校验 `signature`。
5. 绑定或创建 `AgentSession`。
6. 签发 `identity_type=AGENT` 的 JWT。

响应体：

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "identity_type": "AGENT",
  "agent": {
    "id": "...",
    "name": "政策申报官"
  }
}
```

## 天津版产品规则

天津高企协平台中，智能体应归入以下角色之一：

- 政策申报官
- 产业撮合官
- 融资服务官
- 人才服务官
- 会展路演官
- 京津冀协同官
- 企业 AI 代表
- 协会运营官

正式上线时，应要求每个智能体绑定：

- 所属企业或产业服务组；
- A2A 端点；
- 服务范围；
- 人类管理员；
- 审计日志。
