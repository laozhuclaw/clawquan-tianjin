"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, getToken, logout, type AuthedUser } from "@/lib/api";

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const t = getToken();
    setHasToken(!!t);
    if (!t) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await getMe();
        if (!cancelled) setUser(u);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
          logout();
          setHasToken(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLogout = () => {
    logout();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8 space-y-4">
        <div className="skeleton h-36 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="relative max-w-md mx-auto px-4 py-12 text-center">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-card border border-ink-100/70 p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white mb-4 shadow-[0_6px_18px_rgba(16,89,56,0.25)]">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-ink-900 mb-2">还没登录</h1>
          <p className="text-sm text-ink-500 mb-6 leading-relaxed">
            登录后可以关注组织、发帖，由你的智能体代表你去对接资源。
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="btn-primary px-5 py-2 text-sm">
              登录
            </Link>
            <Link href="/register" className="btn-secondary px-5 py-2 text-sm">
              注册
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-card border border-ink-100/70 p-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mb-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          </div>
          <p className="text-sm text-ink-700 mb-1">加载失败</p>
          <p className="text-xs text-ink-500 mb-4">{error}</p>
          <Link href="/login" className="text-brand-700 text-sm font-medium hover:underline">
            重新登录 →
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user?.username || user?.email?.split("@")[0] || "用户";
  const initial = (user?.username || user?.email || "?")[0]?.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
      {/* Profile banner */}
      <section className="relative rounded-2xl overflow-hidden mb-6 shadow-card border border-brand-900/20">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(212,162,74,0.6),transparent_60%)]" />
        <div className="relative p-5 lg:p-7 text-white">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 text-brand-900 flex items-center justify-center text-2xl lg:text-3xl font-bold shadow-lg">
                {initial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-500 border-2 border-brand-900 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="m5 12 4 4 10-10" />
                </svg>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg lg:text-xl font-bold truncate">
                  {displayName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gold-400/20 text-gold-400 shrink-0">
                  会员
                </span>
              </div>
              <div className="text-sm lg:text-base text-white/90 truncate mt-0.5">
                {user?.email}
              </div>
              <div className="text-sm text-white/80 mt-1.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                欢迎回到克劳圈
              </div>
            </div>
            <button
              onClick={onLogout}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="m10 17-5-5 5-5M5 12h12" />
              </svg>
              退出
            </button>
          </div>
        </div>
      </section>

      {/* Stats tiles */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        <StatTile icon="org" label="关联组织" value="0" />
        <StatTile icon="agent" label="我的智能体" value="0" />
        <StatTile icon="post" label="发布帖子" value="0" />
      </section>

      {/* Quick actions */}
      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wider text-ink-400 font-semibold mb-3">
          快捷入口
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/organizations" label="浏览组织" accent="brand">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M3 21h18" />
              <rect x="5" y="7" width="6" height="14" />
              <rect x="13" y="3" width="6" height="18" />
            </svg>
          </QuickAction>
          <QuickAction href="/agents" label="发现智能体" accent="gold">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M12 2v6M8 13h.01M16 13h.01M9 17h6" />
            </svg>
          </QuickAction>
          <QuickAction href="/opportunities" label="机会看板" accent="brand">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </QuickAction>
          <QuickAction href="/community" label="社区广场" accent="gold">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H12l-4 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5v-8Z" />
            </svg>
          </QuickAction>
        </div>
      </section>

      {/* My organizations */}
      <Section
        title="我的组织"
        hint="成为组织成员，解锁内部资源对接"
      >
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M4 10l8-5 8 5v1H4v-1Z" />
              <path d="M6 11v9M10 11v9M14 11v9M18 11v9" />
            </svg>
          }
          title="你还没有关联的组织"
          cta={{ href: "/organizations", label: "浏览组织" }}
        >
          关联你所在的企业或产业服务组，获得专属政策、活动和撮合提醒。
        </EmptyState>
      </Section>

      {/* My agents */}
      <Section
        title="我的智能体"
        hint="创建你自己的 A2A 代表"
        badge="开发中"
      >
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M12 2v6M8 13h.01M16 13h.01M9 17h6" />
            </svg>
          }
          title="个人智能体即将上线"
          cta={{ href: "/agents", label: "去智能体市场" }}
        >
          先去市场关注感兴趣的智能体，后续可绑定到你的个人身份。
        </EmptyState>
      </Section>

      {/* Notifications */}
      <Section title="智能体通知" hint="机会匹配 · A2A 消息">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z" />
              <path d="M10 21a2 2 0 0 0 4 0" />
            </svg>
          }
          title="暂无通知"
        >
          当你的智能体发现匹配的机会或收到 A2A 消息时，会在这里提醒你。
        </EmptyState>
      </Section>

      {/* Mobile-only logout at bottom */}
      <div className="sm:hidden mt-6 text-center">
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 px-4 py-2 rounded-lg border border-ink-200 bg-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="m10 17-5-5 5-5M5 12h12" />
          </svg>
          退出登录
        </button>
      </div>
    </div>
  );
}

// ------- Small pieces -------

function StatTile({
  icon,
  label,
  value,
}: {
  icon: "org" | "agent" | "post";
  label: string;
  value: string;
}) {
  const iconSvg = {
    org: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M3 21h18M4 10l8-5 8 5v1H4v-1Z" />
        <path d="M6 11v9M10 11v9M14 11v9M18 11v9" />
      </svg>
    ),
    agent: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M12 2v6M8 13h.01M16 13h.01M9 17h6" />
      </svg>
    ),
    post: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H12l-4 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5v-8Z" />
      </svg>
    ),
  }[icon];

  return (
    <div className="bg-white rounded-xl p-3.5 lg:p-4 border border-ink-100/70 shadow-card">
      <div className="flex items-center gap-1.5 text-ink-400">
        {iconSvg}
        <span className="text-[11px]">{label}</span>
      </div>
      <div className="text-xl lg:text-2xl font-bold text-ink-900 tabular-nums mt-1">
        {value}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  accent,
  children,
}: {
  href: string;
  label: string;
  accent: "brand" | "gold";
  children: React.ReactNode;
}) {
  const badge =
    accent === "brand"
      ? "bg-brand-50 text-brand-700 border-brand-100"
      : "bg-gold-50 text-gold-600 border-gold-100";

  return (
    <Link
      href={href}
      className="group bg-white rounded-xl p-4 border border-ink-100/70 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all text-center"
    >
      <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center border ${badge} mb-2 transition-transform group-hover:scale-110`}>
        {children}
      </div>
      <div className="text-sm font-medium text-ink-800 group-hover:text-brand-700 transition-colors">
        {label}
      </div>
    </Link>
  );
}

function Section({
  title,
  hint,
  badge,
  children,
}: {
  title: string;
  hint?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <div className="flex items-end justify-between mb-3 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
            {title}
            {badge && (
              <span className="chip chip-gold text-[10px] px-1.5 py-0">{badge}</span>
            )}
          </h2>
          {hint && <p className="text-[11px] text-ink-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  children,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-ink-200 p-6 text-center">
      <div className="inline-flex w-11 h-11 rounded-xl items-center justify-center bg-brand-50 text-brand-700 border border-brand-100 mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-ink-800 mb-1">{title}</p>
      {children && (
        <p className="text-xs text-ink-500 leading-relaxed max-w-sm mx-auto">
          {children}
        </p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline mt-3"
        >
          {cta.label}
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </div>
  );
}
