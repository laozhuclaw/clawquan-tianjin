"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  createAgentRegistrationChallenge,
  login,
  loginByPhone,
  sendPhoneCode,
  type AgentRegistrationChallenge,
} from "@/lib/api";

type LoginMode = "phone" | "password" | "agent";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentCode, setAgentCode] = useState("");
  const [agentEndpoint, setAgentEndpoint] = useState("");
  const [agentChallenge, setAgentChallenge] =
    useState<AgentRegistrationChallenge | null>(null);
  const [agentNonce, setAgentNonce] = useState("");
  const [agentConnected, setAgentConnected] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "phone") {
        if (!phone || !code) throw new Error("手机号和验证码不能为空");
        await loginByPhone(phone.trim(), code.trim());
        router.replace("/me");
      } else if (mode === "password") {
        if (!email || !password) throw new Error("邮箱和密码不能为空");
        await login(email.trim(), password);
        router.replace("/me");
      } else {
        if (!agentName.trim()) throw new Error("智能体名称不能为空");
        if (!agentCode.trim()) throw new Error("智能体注册码不能为空");
        const endpointStatus = await probeAgentEndpoint(agentEndpoint.trim());
        const challenge = await createAgentRegistrationChallenge(agentCode.trim());
        const nonce = await solvePow(challenge, agentCode.trim());
        setAgentChallenge(challenge);
        setAgentNonce(nonce);
        window.localStorage.setItem(
          "clawquan_agent_session",
          JSON.stringify({
            name: agentName.trim(),
            endpoint: agentEndpoint.trim() || null,
            endpoint_status: endpointStatus,
            challenge_id: challenge.challenge_id,
            nonce,
            algorithm: challenge.algorithm,
            connected_at: new Date().toISOString(),
          })
        );
        setAgentConnected(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "agent" ? "智能体接入失败" : "登录失败");
    } finally {
      setBusy(false);
    }
  };

  const requestCode = async () => {
    if (!phone || sendingCode) return;
    setSendingCode(true);
    setError(null);
    try {
      const res = await sendPhoneCode(phone.trim(), "login");
      if (res.demo_code) {
        setDemoCode(res.demo_code);
        setCode(res.demo_code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const fillDemo = (mail: string) => {
    setEmail(mail);
    setPassword("demo12345");
    setError(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-start lg:items-center justify-center px-4 py-8 lg:py-16">
      <div className="absolute inset-0 -z-10 gradient-hero" />

      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-card border border-ink-100/70 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white mb-3 shadow-[0_6px_18px_rgba(16,89,56,0.25)]">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-ink-900">
              登录天津高企协平台
            </h1>
            <p className="text-sm text-ink-500 mt-1.5">
              人类账号登录管理后台，智能体通过接入校验进入服务网络
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-ink-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("phone");
                setError(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "phone"
                  ? "bg-white text-brand-700 shadow-chip"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              手机验证码
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "password"
                  ? "bg-white text-brand-700 shadow-chip"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              演示账号
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("agent");
                setError(null);
                setAgentConnected(false);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "agent"
                  ? "bg-white text-brand-700 shadow-chip"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              智能体接入
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "phone" ? (
              <>
                <PhoneField value={phone} onChange={setPhone} />
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">
                    验证码
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="field flex-1"
                      placeholder="6 位验证码"
                    />
                    <button
                      type="button"
                      onClick={requestCode}
                      disabled={!phone || sendingCode}
                      className="btn-secondary px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {sendingCode ? "发送中" : "获取验证码"}
                    </button>
                  </div>
                  {demoCode && (
                    <p className="text-[11px] text-ink-400 mt-1">
                      演示验证码：<span className="font-mono text-brand-700">{demoCode}</span>
                    </p>
                  )}
                </div>
              </>
            ) : mode === "password" ? (
              <>
                <EmailField value={email} onChange={setEmail} />
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  show={showPw}
                  setShow={setShowPw}
                />
              </>
            ) : mode === "agent" ? (
              <AgentAccessFields
                name={agentName}
                setName={setAgentName}
                code={agentCode}
                setCode={(value) => {
                  setAgentCode(value);
                  setAgentChallenge(null);
                  setAgentNonce("");
                  setAgentConnected(false);
                }}
                endpoint={agentEndpoint}
                setEndpoint={setAgentEndpoint}
                connected={agentConnected}
                challenge={agentChallenge}
                nonce={agentNonce}
              />
            ) : null}

            {error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm flex gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                busy ||
                (mode === "phone"
                  ? !phone || !code
                  : mode === "password"
                  ? !email || !password
                  : !agentName.trim() || !agentCode.trim())
              }
              className="w-full btn-primary py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
                  </svg>
                  登录中…
                </>
              ) : (
                mode === "phone"
                  ? "验证码登录"
                  : mode === "password"
                  ? "登录"
                  : agentConnected
                  ? "重新校验智能体"
                  : "校验并接入智能体"
              )}
            </button>
          </form>

          {/* Demo helper — dev-friendly */}
          {mode === "password" && process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div className="mt-5 pt-5 border-t border-ink-100">
            <div className="text-[11px] text-ink-400 mb-2 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
              </svg>
              演示账号（密码均为 <code className="text-brand-700 font-mono">demo12345</code>）
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { mail: "admin@clawquan.local", label: "管理员" },
                { mail: "service@tjhta.cn", label: "协会服务" },
                { mail: "policy@tjhta.cn", label: "政策专员" },
              ].map((d) => (
                <button
                  key={d.mail}
                  type="button"
                  onClick={() => fillDemo(d.mail)}
                  className="text-[11px] px-2 py-1 rounded bg-ink-100 text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {agentConnected && (
            <Link href="/agents" className="btn-secondary w-full mt-4 py-2.5">
              进入 AI 服务专员台
            </Link>
          )}

          <div className="text-center mt-6 text-sm text-ink-500">
            还没有账号？{" "}
            <Link href="/register" className="text-brand-700 font-medium hover:underline">
              注册人类账号或智能体 →
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-ink-400 mt-5 px-4">
          智能体接入用于 A2A 服务网络校验；正式服务端智能体会话将在后端接口补齐后接入。
        </p>
      </div>
    </div>
  );
}

function AgentAccessFields({
  name,
  setName,
  code,
  setCode,
  endpoint,
  setEndpoint,
  connected,
  challenge,
  nonce,
}: {
  name: string;
  setName: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  endpoint: string;
  setEndpoint: (value: string) => void;
  connected: boolean;
  challenge: AgentRegistrationChallenge | null;
  nonce: string;
}) {
  return (
    <>
      <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-700 leading-relaxed">
        智能体不是人类账号。平台会按“注册码、端点、计算挑战”三步验证，确认它可以接入天津高企协 46 类产业服务网络。
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["1", "注册码", "协会发放的接入密钥"],
          ["2", "端点", "A2A 地址格式与可达性"],
          ["3", "挑战", "服务端 nonce 计算校验"],
        ].map(([num, title, body]) => (
          <div key={num} className="rounded-lg border border-ink-100 bg-white p-2">
            <div className="text-[11px] font-semibold text-brand-700">STEP {num}</div>
            <div className="text-xs font-medium text-ink-900 mt-1">{title}</div>
            <div className="text-[10px] text-ink-500 leading-snug mt-1">{body}</div>
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">
          智能体名称
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field"
          placeholder="例如：政策申报官 / 企业 AI 代表"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">
          A2A 端点
        </label>
        <input
          type="url"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="field"
          placeholder="https://agent.example.com/a2a"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">
          智能体注册码
        </label>
        <input
          type="password"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="field"
          placeholder="由协会管理员发放"
        />
      </div>
      {connected && challenge && nonce && (
        <div className="rounded-lg border border-brand-100 bg-white p-3 text-sm">
          <div className="font-semibold text-brand-700 mb-1">智能体已完成接入校验</div>
          <div className="text-xs text-ink-500 leading-relaxed">
            验证结果：注册码有效，计算挑战通过，接入凭证已写入本机
            <br />
            challenge：<span className="font-mono">{challenge.challenge_id}</span>
            <br />
            nonce：<span className="font-mono">{nonce}</span>
          </div>
        </div>
      )}
    </>
  );
}

async function probeAgentEndpoint(endpoint: string): Promise<"skipped" | "format-ok" | "reachable" | "blocked"> {
  if (!endpoint) return "skipped";
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("A2A 端点必须是有效 URL");
  }
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("A2A 端点必须使用 http 或 https");
  }
  try {
    await fetch(endpoint, { method: "HEAD", mode: "no-cors" });
    return "reachable";
  } catch {
    return "blocked";
  }
}

async function solvePow(
  challenge: AgentRegistrationChallenge,
  agentCode: string
): Promise<string> {
  const prefix = "0".repeat(challenge.difficulty);
  for (let i = 0; i < 2_000_000; i++) {
    const nonce = String(i);
    const raw = `${challenge.challenge_id}:${agentCode}:${nonce}:${challenge.salt}`;
    const bytes = new TextEncoder().encode(raw);
    const digestBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const digest = Array.from(new Uint8Array(digestBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (digest.startsWith(prefix)) return nonce;
  }
  throw new Error("计算挑战超时，请重试");
}

function PhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">
        手机号
      </label>
      <input
        type="tel"
        required
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
        placeholder="请输入手机号"
      />
    </div>
  );
}

function EmailField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">
        邮箱
      </label>
      <input
        type="email"
        required
        autoComplete="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
        placeholder="you@example.com"
      />
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  setShow,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean | ((v: boolean) => boolean)) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-ink-700">密码</label>
        <span className="text-[11px] text-ink-400">忘记密码？请联系管理员</span>
      </div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          autoComplete="current-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field pr-12"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-1"
          aria-label={show ? "隐藏密码" : "显示密码"}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
