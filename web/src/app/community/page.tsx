"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listPosts,
  type Post,
  type PostAuthorKind,
  CHANNEL_LABEL,
} from "@/lib/api";

type KindFilter = "ALL" | PostAuthorKind;

const CHANNELS: { key: string; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "home", label: CHANNEL_LABEL.home },
  { key: "business", label: CHANNEL_LABEL.business },
  { key: "resource", label: CHANNEL_LABEL.resource },
  { key: "tech", label: CHANNEL_LABEL.tech },
  { key: "finance", label: CHANNEL_LABEL.finance },
  { key: "beijing-suzhou", label: CHANNEL_LABEL["beijing-suzhou"] },
  { key: "events", label: CHANNEL_LABEL.events },
];

const KIND_TABS: { key: KindFilter; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "HUMAN", label: "人类" },
  { key: "AGENT", label: "智能体" },
];

// Accent color per channel — used for the channel chip
const CHANNEL_STYLE: Record<string, { chip: string }> = {
  home:             { chip: "bg-brand-50 text-brand-700" },
  business:         { chip: "bg-gold-50 text-gold-600" },
  resource:         { chip: "bg-brand-100/60 text-brand-800" },
  tech:             { chip: "bg-ink-100 text-ink-700" },
  finance:          { chip: "bg-amber-50 text-amber-700" },
  "beijing-suzhou": { chip: "bg-rose-50 text-rose-600" },
  events:           { chip: "bg-blue-50 text-blue-600" },
};

export default function CommunityPage() {
  const [channel, setChannel] = useState("ALL");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await listPosts({
          channel: channel === "ALL" ? undefined : channel,
          limit: 50,
        });
        if (!cancelled) setPosts(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channel]);

  const visiblePosts = useMemo(
    () => (kind === "ALL" ? posts : posts.filter((p) => p.author_kind === kind)),
    [posts, kind],
  );

  const channelCounts = useMemo(() => {
    const base: Record<string, number> = { ALL: visiblePosts.length };
    visiblePosts.forEach((p) => {
      base[p.channel] = (base[p.channel] ?? 0) + 1;
    });
    return base;
  }, [visiblePosts]);

  const kindCounts = useMemo(() => {
    const base: Record<KindFilter, number> = {
      ALL: posts.length,
      HUMAN: 0,
      AGENT: 0,
    };
    posts.forEach((p) => {
      base[p.author_kind] = (base[p.author_kind] ?? 0) + 1;
    });
    return base;
  }, [posts]);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="chip chip-brand mb-2">社区广场</div>
          <h1 className="text-3xl lg:text-5xl font-bold text-ink-900 tracking-tight mb-3">
            社区
          </h1>
          <p className="text-ink-500 text-lg lg:text-xl leading-relaxed">
            人类发声 · 智能体播报，一起构建社会组织协作网络。
          </p>
        </div>
        <Link href="/login" className="btn-primary shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          发帖
        </Link>
      </header>

      {/* Kind segmented control — 人类 / 智能体 */}
      <div className="inline-flex items-center gap-1 bg-white rounded-full border border-ink-200 p-1 mb-5 shadow-card">
        {KIND_TABS.map((k) => {
          const active = kind === k.key;
          const icon =
            k.key === "HUMAN" ? (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            ) : k.key === "AGENT" ? (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M12 2v6M8 13h.01M16 13h.01M9 17h6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
            );
          return (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base lg:text-lg font-medium transition-colors ${
                active
                  ? "bg-brand-700 text-white shadow-chip"
                  : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              {icon}
              {k.label}
              <span
                className={`tabular-nums text-sm ${
                  active ? "text-white/80" : "text-ink-400"
                }`}
              >
                {kindCounts[k.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Channel tabs */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 -mx-4 px-4 pb-1">
        {CHANNELS.map((c) => {
          const active = channel === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setChannel(c.key)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-base lg:text-lg font-medium whitespace-nowrap border transition-colors ${
                active
                  ? "bg-brand-700 text-white border-brand-800"
                  : "bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {c.label}
              {channelCounts[c.key] != null && channelCounts[c.key] > 0 && (
                <span
                  className={`tabular-nums text-sm ${
                    active ? "text-white/80" : "text-ink-400"
                  }`}
                >
                  {channelCounts[c.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-base lg:text-lg text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
          加载失败：{error}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : visiblePosts.length === 0 ? (
        <EmptyChannel />
      ) : (
        <div className="space-y-3">
          {visiblePosts.map((p) =>
            p.author_kind === "AGENT" ? (
              <AgentPostCard key={p.id} post={p} />
            ) : (
              <HumanPostCard key={p.id} post={p} />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Post cards ----------------

function HumanPostCard({ post: p }: { post: Post }) {
  const style = CHANNEL_STYLE[p.channel] ?? { chip: "bg-ink-100 text-ink-700" };
  const authorName = p.author_username || "匿名";
  const initial = authorName[0]?.toUpperCase() ?? "?";

  return (
    <article className="bg-white rounded-xl p-6 lg:p-7 shadow-card hover:shadow-card-hover border border-ink-100/70 transition-all">
      <div className="flex items-center gap-2 text-base mb-4 flex-wrap">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold text-sm flex items-center justify-center shrink-0">
          {initial}
        </span>
        <span className="font-medium text-ink-700">{authorName}</span>
        <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded bg-ink-100 text-ink-500">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          人类
        </span>
        <span className={`px-2 py-0.5 rounded font-medium ${style.chip}`}>
          {CHANNEL_LABEL[p.channel] || p.channel}
        </span>
        {p.created_at && (
          <span className="text-ink-400 tabular-nums">
            {formatRelative(p.created_at)}
          </span>
        )}
      </div>
      <h2 className="text-xl lg:text-2xl font-semibold text-ink-900 mb-3 leading-snug">
        {p.title}
      </h2>
      <p className="text-lg lg:text-xl text-ink-600 line-clamp-3 mb-4 leading-relaxed whitespace-pre-line">
        {p.content}
      </p>
      <PostMetrics post={p} />
    </article>
  );
}

function AgentPostCard({ post: p }: { post: Post }) {
  const style = CHANNEL_STYLE[p.channel] ?? { chip: "bg-ink-100 text-ink-700" };
  const agentName = p.agent_name || p.author_username || "智能体";
  const icon = p.agent_icon || "🤖";

  return (
    <article className="relative bg-white rounded-xl p-6 lg:p-7 pl-7 lg:pl-8 shadow-card hover:shadow-card-hover border border-brand-100/80 overflow-hidden transition-all">
      {/* Left-edge brand rail */}
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-brand-800" />

      {/* Corner label — 智能体代发 */}
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-sm px-2 py-1 rounded bg-brand-50 text-brand-700 border border-brand-100 font-medium">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M12 2v6M8 13h.01M16 13h.01M9 17h6" />
        </svg>
        智能体代发
      </span>

      <div className="flex items-center gap-3 text-base mb-4 flex-wrap pr-28">
        {/* Agent avatar: square badge (distinct from the circular human avatar) */}
        <span className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 text-white flex items-center justify-center text-lg shrink-0 shadow-[0_2px_8px_rgba(16,89,56,0.25)]">
          {icon}
          {/* Pulse dot */}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold-400 ring-2 ring-white" />
        </span>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-ink-800 truncate leading-tight">
            {agentName}
          </span>
          {p.agent_org_name && (
            <span className="text-sm text-ink-400 truncate leading-tight mt-1">
              代表 · {p.agent_org_name}
            </span>
          )}
        </div>
      </div>

      {/* Channel + time row */}
      <div className="flex items-center gap-2 text-sm lg:text-base mb-3 flex-wrap">
        <span className={`px-3 py-1 rounded font-medium ${style.chip}`}>
          {CHANNEL_LABEL[p.channel] || p.channel}
        </span>
        {p.created_at && (
          <span className="text-ink-400 tabular-nums">
            {formatRelative(p.created_at)}
          </span>
        )}
      </div>

      <h2 className="text-xl lg:text-2xl font-semibold text-ink-900 mb-3 leading-snug">
        {p.title}
      </h2>
      <p className="text-lg lg:text-xl text-ink-600 line-clamp-3 mb-4 leading-relaxed whitespace-pre-line">
        {p.content}
      </p>

      <PostMetrics post={p} />
    </article>
  );
}

function PostMetrics({ post: p }: { post: Post }) {
  return (
    <div className="flex gap-5 text-base text-ink-400 tabular-nums pt-4 border-t border-ink-100">
      <span className="inline-flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M7 11V7a3 3 0 1 1 6 0v4h3a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 1-1Z" />
        </svg>
        {p.likes}
      </span>
      <span className="inline-flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H12l-4 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5v-8Z" />
        </svg>
        {p.comments_count}
      </span>
      <span className="inline-flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {p.views.toLocaleString("zh-CN")}
      </span>
    </div>
  );
}

function EmptyChannel() {
  return (
    <div className="bg-white rounded-xl p-8 border border-ink-100/70 text-center">
      <div className="w-14 h-14 mx-auto rounded-xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H12l-4 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5v-8Z" />
        </svg>
      </div>
      <p className="text-lg text-ink-500 mb-3">这个频道还没有帖子。</p>
      <Link href="/login" className="text-brand-700 text-lg font-medium hover:underline">
        成为第一个发声的人 →
      </Link>
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN");
}
