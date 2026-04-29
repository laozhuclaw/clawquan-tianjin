"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getAgent, type Agent, formatUsage } from "@/lib/api";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  ts: Date;
}

function timeFmt(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function AgentDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const a = await getAgent(id);
        if (!cancelled) {
          setAgent(a);
          setMessages([
            {
              role: "agent",
              content: `你好，我是${a.name}。${a.description}`,
              ts: new Date(),
            },
          ]);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (maybeText?: string) => {
    const text = (maybeText ?? input).trim();
    if (!text || busy || !agent) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text, ts: new Date() }]);
    setBusy(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          content: `【${agent.name} · 演示回复】收到你的消息："${text}"。真实对话能力需要接入 LLM / A2A 端点。`,
          ts: new Date(),
        },
      ]);
      setBusy(false);
    }, 700);
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  if (!id) {
    return (
      <EmptyState
        title="没有指定智能体 id"
        ctaHref="/agents"
        ctaLabel="返回智能体列表"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        tone="warn"
        title={`加载失败：${error}`}
        ctaHref="/agents"
        ctaLabel="返回智能体列表"
      />
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
        <div className="skeleton h-40 mb-4" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  const quickPrompts = [
    "介绍一下你负责的业务",
    "最近有什么值得关注的机会？",
    "帮我对接一个合作方",
  ];

  return (
    <>
      {/* Banner */}
      <section className="gradient-primary relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link
            href="/agents"
            className="inline-flex items-center gap-1 text-white/90 hover:text-white text-base mb-5 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            返回智能体列表
          </Link>

          <div className="flex items-start gap-4">
            <div className="shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl lg:text-4xl backdrop-blur">
              {agent.icon || "🤖"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white/80 text-[11px] font-medium border border-white/15">
                  {agent.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gold-400/15 text-gold-400 text-[11px] font-medium border border-gold-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                  在线
                </span>
              </div>
              <h1 className="text-white text-xl lg:text-3xl font-bold tracking-tight mb-2 text-balance">
                {agent.name}
              </h1>
              <div className="text-white/80 text-sm lg:text-base flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18 22l-6-3.5-6 3.5 1.5-7.3L2 10l7.1-1.1L12 2Z" />
                  </svg>
                  {agent.star_count}
                </span>
                <span>· {formatUsage(agent.usage_count)}</span>
              </div>
            </div>
          </div>

          <p className="text-white/90 text-base lg:text-lg mt-5 leading-relaxed max-w-2xl">
            {agent.description}
          </p>

          {agent.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {agent.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/15"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Chat panel */}
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="bg-white rounded-xl shadow-card border border-ink-100/70 overflow-hidden flex flex-col"
          style={{ minHeight: 520 }}>
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-ink-100 bg-ink-50/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-lg">
              {agent.icon || "🤖"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink-900 truncate">
                {agent.name}
              </div>
              <div className="text-[11px] text-ink-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                在线 · 演示模式
              </div>
            </div>
            <span className="chip chip-gold">DEMO</span>
          </div>

          {/* Messages */}
          <div
            className="flex-1 px-4 py-5 overflow-y-auto space-y-4 bg-gradient-to-b from-ink-50/40 to-white"
            style={{ maxHeight: 520 }}
          >
            {messages.map((m, i) => (
              <MessageBubble key={i} msg={m} agent={agent} />
            ))}
            {busy && <TypingBubble agent={agent} />}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-ink-50 hover:bg-brand-50 text-ink-700 hover:text-brand-700 border border-ink-100 hover:border-brand-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-ink-100 p-3 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoGrow(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={`和 ${agent.name} 对话…（Enter 发送，Shift+Enter 换行）`}
                className="flex-1 resize-none px-3.5 py-2.5 rounded-lg border border-ink-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm leading-relaxed bg-white placeholder:text-ink-400"
                style={{ maxHeight: 140 }}
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="shrink-0 btn-primary px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Enter 发送"
              >
                {busy ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M2 21l20-9L2 3v7l15 2-15 2v7Z" />
                  </svg>
                )}
                发送
              </button>
            </div>
            <p className="text-[11px] text-ink-400 mt-2">
              演示回复为占位文本，真实对话需接入 LLM / A2A 端点。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ msg, agent }: { msg: ChatMessage; agent: Agent }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-sm">
          {agent.icon || "🤖"}
        </div>
      )}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[82%]`}>
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-brand-700 text-white rounded-2xl rounded-br-sm"
              : "bg-white text-ink-800 border border-ink-100 rounded-2xl rounded-bl-sm shadow-chip"
          }`}
        >
          {msg.content}
        </div>
        <div className="text-[10px] text-ink-400 mt-1 px-1 tabular-nums">
          {timeFmt(msg.ts)}
        </div>
      </div>
      {isUser && (
        <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-semibold">
          你
        </div>
      )}
    </div>
  );
}

function TypingBubble({ agent }: { agent: Agent }) {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-sm">
        {agent.icon || "🤖"}
      </div>
      <div className="bg-white border border-ink-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-chip">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  ctaHref,
  ctaLabel,
  tone = "info",
}: {
  title: string;
  ctaHref: string;
  ctaLabel: string;
  tone?: "info" | "warn";
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className={tone === "warn" ? "text-amber-700 mb-4" : "text-ink-600 mb-4"}>
        {title}
      </p>
      <Link href={ctaHref} className="text-brand-700 hover:underline text-sm font-medium">
        {ctaLabel}
      </Link>
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12" />}>
      <AgentDetailInner />
    </Suspense>
  );
}
