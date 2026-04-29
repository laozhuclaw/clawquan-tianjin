"use client";

import { useMemo, useState } from "react";

type Item = {
  name: string;
  type: "协会平台" | "产业服务组" | "会员企业";
  industry: string;
  region: string;
  description: string;
  tags: string[];
};

const ITEMS: Item[] = [
  { name: "天津市高新技术企业协会", type: "协会平台", industry: "综合服务", region: "天津", description: "高新技术企业重要阵地，发挥政企桥梁作用，会员单位 10056 家，服务企业 15000+。", tags: ["政企桥梁", "产业经纪人", "社会组织运营"] },
  { name: "天津市电池行业协会", type: "协会平台", industry: "新能源", region: "天津", description: "天津产业服务平台共同发起单位，服务电池产业、绿色金融和产业链协同。", tags: ["电池产业", "新能源", "绿色金融"] },
  { name: "天津市知识产权保护协会", type: "协会平台", industry: "知识产权", region: "天津", description: "天津产业服务平台共同发起单位，支撑知识产权保护、运营、成果转化和高企认定。", tags: ["知识产权", "成果转化", "高企认定"] },
  { name: "天津市节水产业协会", type: "协会平台", industry: "节水产业", region: "天津", description: "天津产业服务平台共同发起单位，打造节水融通365专题系列活动。", tags: ["节水融通365", "绿色低碳", "政银企校"] },
  { name: "天津市智能科技产业专家咨询委员会", type: "产业服务组", industry: "智能科技", region: "天津", description: "产业型社会组织矩阵成员，服务智能科技产业政策、人才政策宣贯和项目支持。", tags: ["智能科技", "专家咨询", "项目支持"] },
  { name: "天津新能源产业人才联盟", type: "产业服务组", industry: "新能源", region: "天津", description: "围绕新能源产业人才、联合培养、产业协同和区域交流开展服务。", tags: ["产业人才", "联合培养", "新能源"] },
  { name: "天津滨海新区绿色石化产业集群", type: "产业服务组", industry: "绿色石化", region: "滨海新区", description: "聚焦绿色石化产业集群建设，推动绿色低碳、检验检测和国际产业合作。", tags: ["绿色石化", "产业集群", "绿色低碳"] },
  { name: "天津滨海新区汽车产业集群", type: "产业服务组", industry: "汽车", region: "滨海新区", description: "服务汽车产业链、智能网联、质量体系和市场渠道对接。", tags: ["汽车", "智能网联", "质量体系"] },
];

const TYPES = ["全部", "协会平台", "产业服务组", "会员企业"] as const;

export default function OrganizationsPage() {
  const [type, setType] = useState<(typeof TYPES)[number]>("全部");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    return ITEMS.filter((item) => {
      const byType = type === "全部" || item.type === type;
      const keyword = search.trim();
      const bySearch = !keyword || `${item.name}${item.industry}${item.region}${item.description}${item.tags.join("")}`.includes(keyword);
      return byType && bySearch;
    });
  }, [type, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
      <header className="mb-8">
        <div className="chip chip-brand mb-2">天津企业服务库</div>
        <h1 className="text-3xl lg:text-5xl font-bold text-ink-900 tracking-tight mb-3">
          产业组织与会员企业
        </h1>
        <p className="text-ink-500 text-lg lg:text-xl leading-relaxed max-w-4xl">
          根据 PDF 中的产业型社会组织矩阵，先展示协会平台、产业服务组和重点集群入口。
        </p>
      </header>

      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-5 -mx-4 px-4 pb-1">
        {TYPES.map((item) => (
          <button
            key={item}
            onClick={() => setType(item)}
            className={`shrink-0 inline-flex items-center px-4 py-2 rounded-full text-base lg:text-lg font-medium whitespace-nowrap border transition-colors ${
              type === item ? "bg-brand-700 text-white border-brand-800" : "bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="relative mb-8">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder="搜索产业、区域、企业或服务关键词"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-lg border border-ink-200 text-lg text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visible.map((item) => (
          <article key={item.name} className="card-surface p-6 lg:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl lg:text-2xl font-semibold text-ink-900">{item.name}</h2>
                <div className="text-base lg:text-lg text-ink-500 mt-2">{item.industry} · {item.region}</div>
              </div>
              <span className="chip chip-brand shrink-0">{item.type}</span>
            </div>
            <p className="text-lg lg:text-xl text-ink-600 leading-relaxed mt-4">{item.description}</p>
            <div className="flex flex-wrap gap-3 mt-5">
              {item.tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
