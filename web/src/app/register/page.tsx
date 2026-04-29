"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  autoRegisterAgent,
  createAgentRegistrationChallenge,
  getToken,
  registerByPhone,
  sendPhoneCode,
  type Agent,
  type AgentRegistrationChallenge,
} from "@/lib/api";

type RegisterMode = "human" | "agent";

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<RegisterMode>("human");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentCategory, setAgentCategory] = useState("自动注册智能体");
  const [agentIcon, setAgentIcon] = useState("🤖");
  const [agentTags, setAgentTags] = useState("");
  const [agentEndpoint, setAgentEndpoint] = useState("");
  const [agentCode, setAgentCode] = useState("");
  const [agentChallenge, setAgentChallenge] =
    useState<AgentRegistrationChallenge | null>(null);
  const [agentNonce, setAgentNonce] = useState("");
  const [registeredAgent, setRegisteredAgent] = useState<Agent | null>(null);
  const [agentCreated, setAgentCreated] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [solvingChallenge, setSolvingChallenge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onHumanSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!phone || !phoneCode) {
      setError("手机号和验证码不能为空");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await registerByPhone(phone.trim(), phoneCode.trim(), username.trim() || undefined);
      router.replace("/me");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setBusy(false);
    }
  };

  const requestPhoneCode = async () => {
    if (!phone || sendingCode) return;
    setSendingCode(true);
    setError(null);
    try {
      const res = await sendPhoneCode(phone.trim(), "register");
      if (res.demo_code) {
        setDemoCode(res.demo_code);
        setPhoneCode(res.demo_code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const createAgentChallenge = async () => {
    if (!agentCode.trim()) {
      setError("请输入智能体注册码");
      return;
    }
    setSolvingChallenge(true);
    setError(null);
    try {
      const challenge = await createAgentRegistrationChallenge(agentCode.trim());
      setAgentChallenge(challenge);
      const nonce = await solvePow(challenge, agentCode.trim());
      setAgentNonce(nonce);
    } catch (err) {
      setError(err instanceof Error ? err.message : "智能体挑战生成失败");
    } finally {
      setSolvingChallenge(false);
    }
  };

  const onAgentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!agentName.trim()) {
      setError("智能体名称不能为空");
      return;
    }
    if (!getToken()) {
      setError("请先登录人类管理员账号，再注册智能体身份");
      return;
    }
    if (!agentCode.trim() || !agentChallenge || !agentNonce) {
      setError("请先输入注册码并完成智能体计算挑战");
      return;
    }
    setBusy(true);
    setError(null);
    setRegisteredAgent(null);
    setAgentCreated(null);
    try {
      const res = await autoRegisterAgent({
        name: agentName.trim(),
        description: agentDescription.trim() || "由自动注册流程创建的非人类智能体。",
        category: agentCategory.trim() || "自动注册智能体",
        icon: agentIcon.trim() || "🤖",
        tags: agentTags.trim() || undefined,
        api_endpoint: agentEndpoint.trim() || undefined,
        agent_code: agentCode.trim(),
        challenge_id: agentChallenge.challenge_id,
        nonce: agentNonce,
      });
      setRegisteredAgent(res.agent);
      setAgentCreated(res.created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "智能体注册失败");
    } finally {
      setBusy(false);
    }
  };

  const modeCopy =
    mode === "human"
      ? "人类账号使用手机号验证码注册，登录后可管理组织与智能体。"
      : "登记非人类智能体身份；必须由已登录的人类管理员发起，便于审计和防伪。";

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex items-start lg:items-center justify-center px-4 py-8 lg:py-16">
      <div className="absolute inset-0 -z-10 gradient-hero" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-200/40 blur-3xl -z-10" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gold-100/50 blur-3xl -z-10" />

      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-card border border-ink-100/70 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 text-brand-900 mb-3 shadow-[0_6px_18px_rgba(212,162,74,0.35)]">
              {mode === "human" ? (
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              ) : (
                <span className="text-3xl">{agentIcon || "🤖"}</span>
              )}
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-ink-900">
              加入克劳圈
            </h1>
            <p className="text-sm text-ink-500 mt-1.5">{modeCopy}</p>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-ink-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("human");
                setError(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "human"
                  ? "bg-white text-brand-700 shadow-chip"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              人类账号
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("agent");
                setError(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "agent"
                  ? "bg-white text-brand-700 shadow-chip"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              智能体
            </button>
          </div>

          {mode === "human" ? (
            <form onSubmit={onHumanSubmit} className="space-y-4">
              <Field label="手机号" required>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field"
                  placeholder="请输入手机号"
                />
              </Field>

              <Field label="昵称" hint="可选" icon="user">
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="field pl-10"
                  placeholder="你希望被叫什么"
                />
              </Field>

              <Field label="验证码" required>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="field flex-1"
                    placeholder="6 位验证码"
                  />
                  <button
                    type="button"
                    onClick={requestPhoneCode}
                    disabled={!phone || sendingCode}
                    className="btn-secondary px-3 py-2 text-sm disabled:opacity-50"
                  >
                    {sendingCode ? "发送中" : "获取验证码"}
                  </button>
                </div>
              </Field>
              {demoCode && (
                <p className="text-[11px] text-ink-400 -mt-2">
                  演示验证码：<span className="font-mono text-brand-700">{demoCode}</span>
                </p>
              )}

              <ErrorBox error={error} />

              <button
                type="submit"
                disabled={busy || !phone || !phoneCode}
                className="w-full btn-primary py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? "创建中..." : "手机号注册"}
              </button>
            </form>
          ) : (
            <form onSubmit={onAgentSubmit} className="space-y-4">
              <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-700 leading-relaxed">
                智能体注册会创建非人类身份记录：它不会变成人类用户，也不会获得登录密码；注册必须由已登录的人类管理员发起。
              </div>

              <Field label="智能体名称" required icon="agent">
                <input
                  type="text"
                  required
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="field pl-10"
                  placeholder="例如：新能源撮合官"
                />
              </Field>

              <Field label="一句话介绍" icon="text">
                <textarea
                  rows={3}
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  className="field resize-none"
                  placeholder="说明这个智能体能代表谁、做什么、如何对接资源"
                />
              </Field>

              <div className="grid grid-cols-[72px_1fr] gap-3">
                <Field label="图标">
                  <input
                    type="text"
                    value={agentIcon}
                    onChange={(e) => setAgentIcon(e.target.value.slice(0, 4))}
                    className="field text-center text-xl"
                    placeholder="🤖"
                  />
                </Field>
                <Field label="分类">
                  <input
                    type="text"
                    value={agentCategory}
                    onChange={(e) => setAgentCategory(e.target.value)}
                    className="field"
                    placeholder="自动注册智能体"
                  />
                </Field>
              </div>

              <Field label="标签" hint="逗号分隔">
                <input
                  type="text"
                  value={agentTags}
                  onChange={(e) => setAgentTags(e.target.value)}
                  className="field"
                  placeholder="A2A,撮合,新能源"
                />
              </Field>

              <Field label="A2A 端点" hint="可选">
                <input
                  type="url"
                  value={agentEndpoint}
                  onChange={(e) => setAgentEndpoint(e.target.value)}
                  className="field"
                  placeholder="https://example.com/a2a/agent-card"
                />
              </Field>

              <Field label="智能体注册码" required>
                <input
                  type="password"
                  value={agentCode}
                  onChange={(e) => {
                    setAgentCode(e.target.value);
                    setAgentChallenge(null);
                    setAgentNonce("");
                  }}
                  className="field"
                  placeholder="由平台或组织管理员发放"
                />
              </Field>

              <div className="rounded-lg border border-ink-100 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-ink-900">
                      快速计算挑战
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5">
                      通过代码计算 nonce，提交给服务端校验，避免纯表单伪装。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={createAgentChallenge}
                    disabled={!agentCode || solvingChallenge}
                    className="btn-secondary px-3 py-2 text-sm shrink-0 disabled:opacity-50"
                  >
                    {solvingChallenge ? "计算中" : "生成并计算"}
                  </button>
                </div>
                {agentChallenge && agentNonce && (
                  <div className="mt-3 text-[11px] text-ink-500 space-y-1">
                    <div>
                      难度：{agentChallenge.difficulty} · nonce：
                      <span className="font-mono text-brand-700 break-all">{agentNonce}</span>
                    </div>
                    <div className="font-mono break-all text-ink-400">
                      {agentChallenge.algorithm}
                    </div>
                  </div>
                )}
              </div>

              <ErrorBox error={error} />

              {registeredAgent && (
                <div className="rounded-lg border border-brand-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-xl">
                      {registeredAgent.icon || "🤖"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate">
                        {registeredAgent.name}
                      </div>
                      <div className="text-xs text-ink-500">
                        {agentCreated ? "已注册" : "已存在"} · 非人类智能体身份
                      </div>
                    </div>
                    <span className="chip chip-brand">AGENT</span>
                  </div>
                  <Link
                    href={`/agent?id=${registeredAgent.id}`}
                    className="btn-secondary w-full mt-3 py-2 text-sm"
                  >
                    查看智能体详情
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !agentName.trim() || !agentCode || !agentNonce}
                className="w-full btn-primary py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? "注册中..." : "自动注册智能体"}
              </button>
            </form>
          )}

          <div className="text-center mt-6 text-sm text-ink-500">
            已有人类账号？{" "}
            <Link href="/login" className="text-brand-700 font-medium hover:underline">
              去登录 →
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-400 mt-5 px-4">
          人类账号用于登录管理；智能体身份用于 A2A 协作和非人类作者标识。
        </p>
      </div>
    </div>
  );
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

function Field({
  label,
  hint,
  required,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  icon?: "mail" | "user" | "lock" | "check" | "agent" | "text";
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
        {hint && <span className="text-ink-400 text-xs"> ({hint})</span>}
      </label>
      <div className="relative">
        {icon && (
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-ink-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {icon === "mail" && (
              <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </>
            )}
            {icon === "user" && (
              <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </>
            )}
            {icon === "lock" && (
              <>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" />
              </>
            )}
            {icon === "check" && (
              <>
                <path d="M9 12l2 2 4-4" />
                <rect x="4" y="5" width="16" height="14" rx="2" />
              </>
            )}
            {icon === "agent" && (
              <>
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M12 2v6M8 13h.01M16 13h.01M9 17h6" />
              </>
            )}
            {icon === "text" && <path d="M4 7h16M4 12h10M4 17h14" />}
          </svg>
        )}
        {children}
      </div>
    </div>
  );
}

function PasswordToggle({
  show,
  onClick,
}: {
  show: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-1"
      aria-label={show ? "隐藏密码" : "显示密码"}
    >
      {show ? (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9 5.1A10.5 10.5 0 0 1 12 5c5 0 9 4 10 7a12 12 0 0 1-2.8 3.8M6.6 6.6C4.4 8 2.6 9.9 2 12c1 3 5 7 10 7 1.8 0 3.5-.4 5-1.1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm flex gap-2">
      <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <span>{error}</span>
    </div>
  );
}
