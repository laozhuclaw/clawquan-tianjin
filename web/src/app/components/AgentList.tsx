"use client";

import { useEffect, useState } from "react";
import AgentCard from "./AgentCard";
import { listAgents, formatUsage, type Agent } from "@/lib/api";

// Fallback shown if the backend is unreachable — keeps the landing page
// presentable even when the API is down, and matches the seed data.
const FALLBACK_AGENTS: Agent[] = [
  {
    id: "fallback-1",
    icon: "🤖",
    name: "小助手",
    description: "全能型 AI 助手，回答问题、协助工作、提供建议",
    category: "通用助手",
    tags: [],
    is_public: true,
    star_count: 0,
    usage_count: 12500,
  },
  {
    id: "fallback-2",
    icon: "💻",
    name: "代码官",
    description: "专业编程助手，代码审查、Bug 修复、架构设计",
    category: "编程开发",
    tags: [],
    is_public: true,
    star_count: 0,
    usage_count: 8300,
  },
  {
    id: "fallback-3",
    icon: "🎨",
    name: "设计师",
    description: "创意设计助手,UI/UX 设计、视觉优化、品牌策划",
    category: "设计创意",
    tags: [],
    is_public: true,
    star_count: 0,
    usage_count: 5700,
  },
];


export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAgents({ limit: 12 });
        if (!cancelled) setAgents(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
          setAgents(FALLBACK_AGENTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-4 py-12" id="agents">
      <h2 className="text-2xl lg:text-3xl font-bold text-center text-gray-900 mb-8">
        热门智能体
      </h2>

      {error && (
        <p className="text-center text-sm text-amber-600 mb-6">
          暂时无法连接到服务器（{error}），展示本地示例。
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : agents.map((agent) => (
              <AgentCard
                key={agent.id}
                id={agent.id}
                icon={agent.icon || "🤖"}
                name={agent.name}
                description={agent.description}
                category={agent.category}
                star_count={agent.star_count}
                usage_count={agent.usage_count}
              />
            ))}
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 mb-4" />
      <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-4/5 mb-6" />
      <div className="h-10 bg-gray-100 rounded" />
    </div>
  );
}
