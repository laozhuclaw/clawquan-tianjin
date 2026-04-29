"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  getOrganization,
  listOrgMembers,
  listOrgAgents,
  type Organization,
  type Agent,
  type Member,
  ORG_TYPE_LABEL,
  formatUsage,
} from "@/lib/api";

type TabKey = "overview" | "members" | "agents" | "posts" | "opportunities";

function OrgDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const [o, ms, as] = await Promise.all([
          getOrganization(id),
          listOrgMembers(id),
          listOrgAgents(id),
        ]);
        if (!cancelled) {
          setOrg(o);
          setMembers(ms);
          setAgents(as);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <EmptyState
        title="没有指定组织 id"
        ctaHref="/organizations"
        ctaLabel="返回组织列表"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        tone="warn"
        title={`加载失败：${error}`}
        ctaHref="/organizations"
        ctaLabel="返回组织列表"
      />
    );
  }

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
        <div className="skeleton h-40 mb-4" />
        <div className="skeleton h-10 mb-4" />
        <div className="skeleton h-48" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "概览" },
    { key: "members", label: "成员", count: org.member_count },
    { key: "agents", label: "智能体", count: org.agent_count },
    { key: "posts", label: "动态" },
    { key: "opportunities", label: "机会" },
  ];

  return (
    <>
      {/* Banner header */}
      <section className="gradient-primary relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
          <Link
            href="/organizations"
            className="inline-flex items-center gap-1 text-white/90 hover:text-white text-base mb-6 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            返回组织列表
          </Link>

          <div className="flex items-start gap-4 lg:gap-5">
            <div
              className={`shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center
                          ${
                            org.type === "GRAND_CHAMBER"
                              ? "bg-gold-400 text-brand-900"
                              : org.type === "CHAMBER"
                              ? "bg-white text-brand-700"
                              : "bg-white/10 text-white border border-white/20 backdrop-blur"
                          }`}
            >
              <OrgBigIcon type={org.type} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white/80 text-[11px] font-medium border border-white/15">
                  {ORG_TYPE_LABEL[org.type]}
                </span>
                {org.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gold-400/15 text-gold-400 text-[11px] font-medium border border-gold-400/30">
                    ✓ 平台认证
                  </span>
                )}
              </div>
              <h1 className="text-white text-xl lg:text-3xl font-bold tracking-tight mb-2 text-balance">
                {org.name}
              </h1>
              <div className="text-white/80 text-sm lg:text-base flex flex-wrap gap-x-3 gap-y-1">
                {org.region && (
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 22s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    {org.region}
                  </span>
                )}
                {org.industry && <span>· {org.industry}</span>}
                <span>· 成员 {org.member_count}</span>
                <span>· 智能体 {org.agent_count}</span>
                {org.child_count > 0 && <span>· 下属 {org.child_count}</span>}
              </div>
            </div>
          </div>

          {org.description && (
            <p className="text-white/90 text-base lg:text-lg mt-5 leading-relaxed max-w-2xl">
              {org.description}
            </p>
          )}

          <div className="flex gap-2 mt-6">
            <button className="btn-gold text-sm py-2 px-4">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              关注
            </button>
            <button className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 text-sm font-semibold transition-colors">
              申请加入
            </button>
          </div>
        </div>
      </section>

      {/* Tabs — sticky under the top navbar */}
      <div className="sticky top-[60px] z-10 bg-white/90 backdrop-blur border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  tab === t.key
                    ? "text-brand-700 border-brand-700"
                    : "text-ink-500 border-transparent hover:text-ink-700"
                }`}
              >
                {t.label}
                {t.count != null && (
                  <span
                    className={`ml-1.5 text-[11px] font-semibold tabular-nums ${
                      tab === t.key ? "text-brand-700" : "text-ink-400"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl p-5 lg:p-6 shadow-card border border-ink-100/70">
              <div className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-brand-700 rounded" />
                基本信息
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <InfoRow label="组织类型" value={ORG_TYPE_LABEL[org.type]} />
                <InfoRow label="所在地" value={org.region || "—"} />
                <InfoRow label="行业" value={org.industry || "—"} />
                <InfoRow label="成员数" value={String(org.member_count)} />
                <InfoRow label="智能体" value={String(org.agent_count)} />
                <InfoRow label="下属组织" value={String(org.child_count)} />
              </dl>
            </div>

            <div className="bg-white rounded-xl p-5 lg:p-6 shadow-card border border-ink-100/70">
              <div className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gold-400 rounded" />
                快捷入口
              </div>
              <div className="space-y-2.5 text-sm">
                <button
                  onClick={() => setTab("members")}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-ink-100 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                >
                  <span className="text-ink-700">查看成员</span>
                  <span className="text-ink-400 tabular-nums">{org.member_count}</span>
                </button>
                <button
                  onClick={() => setTab("agents")}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-ink-100 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                >
                  <span className="text-ink-700">查看智能体</span>
                  <span className="text-ink-400 tabular-nums">{org.agent_count}</span>
                </button>
                <Link
                  href="/opportunities"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-ink-100 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                >
                  <span className="text-ink-700">去机会看板</span>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {tab === "members" && (
          <div className="space-y-3">
            {members?.length === 0 && (
              <p className="text-ink-500 text-sm bg-white rounded-xl p-6 border border-ink-100/70 text-center">
                暂无成员。
              </p>
            )}
            {members?.map((m) => {
              const initial = (m.username || "?")[0]?.toUpperCase();
              const isOwner = m.role === "OWNER";
              return (
                <div
                  key={m.user_id}
                  className="bg-white rounded-xl p-4 shadow-card border border-ink-100/70 flex items-center gap-3"
                >
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold shrink-0 ${
                      isOwner
                        ? "bg-gradient-to-br from-brand-700 to-brand-500"
                        : "bg-gradient-to-br from-ink-500 to-ink-700"
                    }`}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 truncate">
                      {m.username || "匿名成员"}
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      {m.title ? `${m.title} · ` : ""}
                      {roleLabel(m.role)}
                    </div>
                  </div>
                  {isOwner && (
                    <span className="chip chip-gold shrink-0">负责人</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "agents" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents?.length === 0 && (
              <p className="text-ink-500 text-sm bg-white rounded-xl p-6 border border-ink-100/70 text-center md:col-span-2">
                这个组织还没有智能体代表。
              </p>
            )}
            {agents?.map((a) => (
              <Link
                key={a.id}
                href={`/agent?id=${a.id}`}
                className="group bg-white rounded-xl p-5 shadow-card border border-ink-100/70 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center text-xl shrink-0">
                    {a.icon || "🤖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 truncate group-hover:text-brand-700 transition-colors">
                      {a.name}
                    </div>
                    <div className="text-xs text-ink-500 mb-2">{a.category}</div>
                  </div>
                </div>
                <p className="text-sm text-ink-700 mt-3 line-clamp-2 leading-relaxed">
                  {a.description}
                </p>
                <div className="text-xs text-ink-400 mt-3 flex items-center gap-3 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                      <path d="M12 8v4l3 2" strokeLinecap="round" />
                    </svg>
                    {formatUsage(a.usage_count)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18 22l-6-3.5-6 3.5 1.5-7.3L2 10l7.1-1.1L12 2Z" />
                    </svg>
                    {a.star_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === "posts" && (
          <div className="bg-white rounded-xl p-8 shadow-card border border-ink-100/70 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </div>
            <p className="text-sm text-ink-500 mb-3">组织动态 feed 开发中。</p>
            <Link href="/community" className="text-brand-700 text-sm font-medium hover:underline">
              先去社区看看 →
            </Link>
          </div>
        )}

        {tab === "opportunities" && (
          <div className="bg-white rounded-xl p-8 shadow-card border border-ink-100/70 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-gold-50 text-gold-600 border border-gold-100 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 21h6M12 17v4" />
                <path d="M7 4h10l-1 10H8L7 4Z" />
              </svg>
            </div>
            <p className="text-sm text-ink-500 mb-3">
              这里会列出该组织发起或撮合中的机会（API 待落地）。
            </p>
            <Link href="/opportunities" className="text-brand-700 text-sm font-medium hover:underline">
              去机会看板 →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500 mb-0.5">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
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

function OrgBigIcon({ type }: { type: Organization["type"] }) {
  if (type === "GRAND_CHAMBER") {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <path d="M3 21h18" />
        <path d="M4 10l8-5 8 5v1H4v-1Z" />
        <path d="M6 11v9M10 11v9M14 11v9M18 11v9" />
      </svg>
    );
  }
  if (type === "CHAMBER") {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="1.5" />
        <path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 20V8l6-4 6 4v12" />
      <path d="M15 20V12l6 2v6" />
      <path d="M3 20h18" />
    </svg>
  );
}

function roleLabel(role: Member["role"]): string {
  return role === "OWNER" ? "负责人" : role === "ADMIN" ? "管理员" : "成员";
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12" />}>
      <OrgDetailInner />
    </Suspense>
  );
}
