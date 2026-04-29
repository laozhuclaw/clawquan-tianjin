"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getOrgTree, type Organization, ORG_TYPE_LABEL } from "@/lib/api";

const COLLAPSE_THRESHOLD = 3;

export default function OrgTreePreview() {
  const [tree, setTree] = useState<Organization[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getOrgTree();
        if (cancelled) return;
        setTree(data);

        const def = new Set<string>();
        const walk = (node: Organization) => {
          if (node.type === "GRAND_CHAMBER") def.add(node.id);
          if (
            node.type === "CHAMBER" &&
            (node.children?.length ?? 0) <= COLLAPSE_THRESHOLD
          ) {
            def.add(node.id);
          }
          node.children?.forEach(walk);
        };
        data.forEach(walk);
        setExpanded(def);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const collapsibleIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (n: Organization) => {
      if (n.children && n.children.length > 0) ids.push(n.id);
      n.children?.forEach(walk);
    };
    tree?.forEach(walk);
    return ids;
  }, [tree]);

  const allExpanded =
    collapsibleIds.length > 0 &&
    collapsibleIds.every((id) => expanded.has(id));

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(collapsibleIds));
  }

  return (
    <section className="px-4 lg:px-6 pt-10 lg:pt-16 pb-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between mb-7 gap-4">
        <div>
          <div className="chip chip-brand mb-2">组织网络</div>
          <h2 className="text-3xl lg:text-5xl font-bold text-ink-900 tracking-tight">
            协会平台 → 产业服务组 → 企业，三层连通
          </h2>
          <p className="text-lg lg:text-xl text-ink-500 mt-3 leading-relaxed">
            从协会平台到产业服务组再到会员企业，每一层都配备自己的智能体代表。
          </p>
        </div>
        <Link
          href="/organizations"
          className="hidden sm:inline-flex items-center gap-1 text-brand-700 text-lg font-medium hover:underline shrink-0"
        >
          查看全部
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </header>

      {error && (
        <p className="text-base lg:text-lg text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
          暂时无法加载组织（{error}）
        </p>
      )}

      {!tree && !error && (
        <div className="space-y-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-16 ml-6" />
          <div className="skeleton h-16 ml-6" />
        </div>
      )}

      {tree && tree.length === 0 && (
        <p className="text-lg text-ink-500">
          还没有组织，
          <Link href="/register" className="text-brand-700 hover:underline">
            注册第一个服务组
          </Link>
        </p>
      )}

      {tree && tree.length > 0 && collapsibleIds.length > 0 && (
        <div className="flex items-center justify-end mb-3">
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex items-center gap-1.5 text-base font-medium text-ink-500
                       hover:text-brand-700 transition-colors px-3 py-2 rounded-md
                       hover:bg-brand-50 border border-transparent hover:border-brand-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {allExpanded ? (
                <path d="M5 12h14" />
              ) : (
                <>
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </>
              )}
            </svg>
            {allExpanded ? "全部收起" : "全部展开"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {tree?.map((grand) => (
          <OrgNode
            key={grand.id}
            org={grand}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
          />
        ))}
      </div>

      <div className="mt-5 sm:hidden">
        <Link href="/organizations" className="btn-secondary w-full">
          查看全部组织
        </Link>
      </div>
    </section>
  );
}

function OrgNode({
  org,
  depth,
  expanded,
  onToggle,
}: {
  org: Organization;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = !!(org.children && org.children.length > 0);
  const isOpen = expanded.has(org.id);

  const typeAccent =
    org.type === "GRAND_CHAMBER"
      ? "border-l-[3px] border-brand-700"
      : org.type === "CHAMBER"
      ? "border-l-[3px] border-brand-400"
      : "border-l-[3px] border-gold-400";

  return (
    <div className={depth === 0 ? "" : "relative"}>
      {depth > 0 && (
        <>
          <span
            aria-hidden
            className="absolute left-3 -top-3 bottom-1/2 w-px bg-ink-200"
            style={{ marginLeft: (depth - 1) * 24 }}
          />
          <span
            aria-hidden
            className="absolute left-3 top-1/2 h-px w-3 bg-ink-200"
            style={{ marginLeft: (depth - 1) * 24 }}
          />
        </>
      )}

      <Link
        href={`/organization?id=${org.id}`}
        className={`group flex items-center gap-3 p-3.5 pr-2 bg-white rounded-xl
                    shadow-card hover:shadow-card-hover border border-ink-100/70
                    transition-all ${typeAccent}`}
        style={{ marginLeft: depth * 24 }}
      >
        <div
          className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                      ${
                        org.type === "GRAND_CHAMBER"
                          ? "bg-brand-700 text-white"
                          : org.type === "CHAMBER"
                          ? "bg-brand-50 text-brand-700 border border-brand-100"
                          : "bg-gold-50 text-gold-600 border border-gold-100"
                      }`}
        >
          <OrgIcon type={org.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink-900 truncate">
              {org.name}
            </span>
            {org.is_verified && <span className="chip chip-brand">✓ 认证</span>}
            {hasChildren && !isOpen && (
              <span className="chip bg-ink-50 text-ink-500 border border-ink-100">
                +{org.children!.length} {childCountLabel(org)}
              </span>
            )}
          </div>
          <div className="text-base text-ink-500 flex flex-wrap gap-x-3 gap-y-1 mt-2 tabular-nums">
            <span>{ORG_TYPE_LABEL[org.type]}</span>
            {org.region && (
              <span className="flex items-center gap-0.5">
                <span className="text-ink-300">·</span>
                {org.region}
              </span>
            )}
            {org.industry && (
              <span className="flex items-center gap-0.5">
                <span className="text-ink-300">·</span>
                {org.industry}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <span className="text-ink-300">·</span>
              成员 {org.member_count}
            </span>
            <span className="flex items-center gap-0.5">
              <span className="text-ink-300">·</span>
              智能体 {org.agent_count}
            </span>
          </div>
        </div>

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(org.id);
            }}
            aria-label={isOpen ? "收起下级" : "展开下级"}
            aria-expanded={isOpen}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-md
                       text-ink-500 hover:text-brand-700 hover:bg-brand-50
                       border border-transparent hover:border-brand-100 transition-colors"
          >
            <span className="text-sm font-semibold tabular-nums">
              {org.children!.length}
            </span>
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-ink-300 group-hover:text-brand-700 shrink-0 mr-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        )}
      </Link>

      {hasChildren && isOpen && (
        <div className="mt-2.5 space-y-2.5">
          {org.children!.map((c) => (
            <OrgNode
              key={c.id}
              org={c}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function childCountLabel(org: Organization): string {
  if (org.type === "GRAND_CHAMBER") return "个服务组";
  if (org.type === "CHAMBER") return "家企业";
  return "项";
}

function OrgIcon({ type }: { type: Organization["type"] }) {
  if (type === "GRAND_CHAMBER") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M4 10l8-5 8 5v1H4v-1Z" />
        <path d="M6 11v9M10 11v9M14 11v9M18 11v9" />
      </svg>
    );
  }
  if (type === "CHAMBER") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="1.5" />
        <path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 20V8l6-4 6 4v12" />
      <path d="M15 20V12l6 2v6" />
      <path d="M3 20h18" />
    </svg>
  );
}
