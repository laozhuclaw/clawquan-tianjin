"use client";

import { useMemo, useState } from "react";

type OppType = "SUPPLY" | "DEMAND" | "PARTNERSHIP" | "EVENT";

const TYPE_LABEL: Record<OppType, string> = {
  SUPPLY: "供给",
  DEMAND: "需求",
  PARTNERSHIP: "合作",
  EVENT: "活动",
};

const TYPE_STYLE: Record<OppType, { bar: string; chip: string; icon: string }> = {
  SUPPLY: { bar: "bg-brand-500", chip: "bg-brand-50 text-brand-700", icon: "bg-brand-50 text-brand-700 border-brand-100" },
  DEMAND: { bar: "bg-gold-400", chip: "bg-gold-50 text-gold-600", icon: "bg-gold-50 text-gold-600 border-gold-100" },
  PARTNERSHIP: { bar: "bg-cyan-500", chip: "bg-cyan-50 text-cyan-700", icon: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  EVENT: { bar: "bg-ink-600", chip: "bg-ink-100 text-ink-700", icon: "bg-ink-100 text-ink-700 border-ink-200" },
};

const MOCK_OPPORTUNITIES = [
  {
    id: "tj-1",
    type: "DEMAND" as const,
    title: "常态化培训：法务、财税、知识产权专题服务需求",
    source_org: "天津高企协政策服务部",
    industry: "培训服务",
    region: "天津",
    description: "平台常态化组织法务、财税、知识产权专题培训、沙龙等各类活动，已服务企业万余家次，现征集下一批企业需求。",
    status: "OPEN" as const,
    created_by_agent: "政策申报官",
    match_score: 94,
    created_at: "今天",
  },
  {
    id: "tj-2",
    type: "PARTNERSHIP" as const,
    title: "常态化产业撮合：上下游企业与投融资机构接链",
    source_org: "天津产业服务平台",
    industry: "产业协同",
    region: "天津",
    description: "平台积极为上下游企业、投融资机构、科研院所和服务组织搭桥接链，已促成订单额超过 120 亿元。",
    status: "MATCHED" as const,
    created_by_agent: "场景开放官",
    match_score: 91,
    created_at: "2 小时前",
  },
  {
    id: "tj-3",
    type: "SUPPLY" as const,
    title: "节水融通365：政银企校精准对接",
    source_org: "天津市节水产业协会",
    industry: "节水产业",
    region: "天津",
    description: "围绕节水产业前沿技术产业化融资模式分享、绿色金融助力企业扩产扩能，组织政银企校精准对接。",
    status: "OPEN" as const,
    created_by_agent: "成果转化官",
    match_score: 83,
    created_at: "昨天",
  },
  {
    id: "tj-4",
    type: "EVENT" as const,
    title: "京津冀（国际）高新技术企业大会企业征集",
    source_org: "天津市高新技术企业协会",
    industry: "会展活动",
    region: "京津冀",
    description: "大会以“科创领航，协同发展”为主题，通过会、展、赛、评+特色活动的 4+X 模式展示高新技术企业创新活力。",
    status: "OPEN" as const,
    created_by_agent: "会展路演官",
    match_score: 88,
    created_at: "1 天前",
  },
  {
    id: "tj-5",
    type: "DEMAND" as const,
    title: "扬帆出海：重点领域拓展国际市场",
    source_org: "天津产业服务平台",
    industry: "国际产业",
    region: "全球资源",
    description: "助力重点领域扬帆出海、拓展国际市场、整合全球资源，组织银企协同赋能专题系列活动。",
    status: "OPEN" as const,
    created_by_agent: "产业服务官",
    match_score: 86,
    created_at: "2 天前",
  },
  {
    id: "tj-6",
    type: "PARTNERSHIP" as const,
    title: "中国先进制造业集群高峰论坛资源对接",
    source_org: "天津产业服务平台",
    industry: "装备制造",
    region: "全国先进制造集群",
    description: "面向先进制造业集群促进机构、企业代表、专家学者，沉淀论坛资源、产业清单和后续对接需求。",
    status: "MATCHED" as const,
    created_by_agent: "产业撮合官",
    match_score: 89,
    created_at: "3 天前",
  },
  {
    id: "tj-7",
    type: "SUPPLY" as const,
    title: "294 个项目专项支持后续服务",
    source_org: "天津产业服务平台",
    industry: "金融资本",
    region: "天津",
    description: "平台组织智能科技产业政策、人才政策宣贯会，促成 294 个项目获得专项支持，现跟进后续资金、人才和场景需求。",
    status: "OPEN" as const,
    created_by_agent: "融资服务官",
    match_score: 82,
    created_at: "3 天前",
  },
  {
    id: "tj-8",
    type: "EVENT" as const,
    title: "全国产业交流：上海、北京、深圳、南京等渠道对接",
    source_org: "天津产业服务平台",
    industry: "区域协同",
    region: "全国合作交流",
    description: "平台常态化开展与外省市合作交流，携会员企业赴上海、北京、深圳、南京、甘肃、海南等地调研参展。",
    status: "OPEN" as const,
    created_by_agent: "活动助手",
    match_score: 77,
    created_at: "4 天前",
  },
];

type Filter = "ALL" | OppType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "SUPPLY", label: "供给" },
  { key: "DEMAND", label: "需求" },
  { key: "PARTNERSHIP", label: "合作" },
  { key: "EVENT", label: "活动" },
];

export default function OpportunitiesPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const visible = useMemo(
    () => (filter === "ALL" ? MOCK_OPPORTUNITIES : MOCK_OPPORTUNITIES.filter((o) => o.type === filter)),
    [filter]
  );

  const counts = useMemo(() => {
    const base: Record<Filter, number> = { ALL: MOCK_OPPORTUNITIES.length, SUPPLY: 0, DEMAND: 0, PARTNERSHIP: 0, EVENT: 0 };
    MOCK_OPPORTUNITIES.forEach((item) => {
      base[item.type] += 1;
    });
    return base;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="chip chip-brand mb-2">天津高企供需撮合</div>
          <h1 className="text-3xl lg:text-5xl font-bold text-ink-900 tracking-tight mb-3">
            企业服务机会池
          </h1>
          <p className="text-lg lg:text-xl text-ink-500 leading-relaxed max-w-4xl">
            机会池基于 PDF 中的实践探索：产业撮合、专题培训、节水融通365、扬帆出海、京津冀大会和全国产业交流。
          </p>
        </div>
        <button className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed shrink-0" disabled>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          发布需求
        </button>
      </header>

      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 -mx-4 px-4 pb-1">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-base lg:text-lg font-medium whitespace-nowrap border transition-colors ${
                active ? "bg-brand-700 text-white border-brand-800" : "bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {item.label}
              <span className={`tabular-nums text-sm ${active ? "text-white/80" : "text-ink-400"}`}>{counts[item.key]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visible.map((item) => {
          const style = TYPE_STYLE[item.type];
          return (
            <article key={item.id} className="relative bg-white rounded-xl p-6 lg:p-7 shadow-card hover:shadow-card-hover border border-ink-100/70 transition-all">
              <span className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${style.bar}`} />
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${style.icon}`}>
                    <TypeIcon type={item.type} />
                  </div>
                  <span className={`text-sm lg:text-base font-medium px-3 py-1 rounded ${style.chip}`}>{TYPE_LABEL[item.type]}</span>
                  {item.status === "MATCHED" && <span className="text-sm lg:text-base font-medium px-3 py-1 rounded bg-brand-700 text-white">撮合中</span>}
                </div>
                <MatchScore score={item.match_score} />
              </div>
              <h2 className="text-xl lg:text-2xl font-semibold text-ink-900 mb-3 leading-snug">{item.title}</h2>
              <p className="text-lg lg:text-xl text-ink-600 mb-5 leading-relaxed">{item.description}</p>
              <div className="border-t border-ink-100 pt-4 space-y-2 text-base lg:text-lg text-ink-500">
                <Row label="发布方" value={item.source_org} />
                <Row label="行业 · 地域" value={`${item.industry} · ${item.region}`} />
                <Row label="服务智能体" value={item.created_by_agent} />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button className="flex-1 btn-primary py-2.5">发起服务对接</button>
                <span className="text-sm text-ink-400 tabular-nums shrink-0">{item.created_at}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TypeIcon({ type }: { type: OppType }) {
  if (type === "SUPPLY") return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
  if (type === "DEMAND") return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>;
  if (type === "PARTNERSHIP") return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h8M12 8v8" /><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
  return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-start gap-2"><span className="font-medium text-ink-700 shrink-0">{label}</span><span className="text-ink-400">:</span><span className="text-ink-600 min-w-0 break-words">{value}</span></div>;
}

function MatchScore({ score }: { score: number }) {
  return (
    <div className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 bg-brand-50 text-brand-700 ring-brand-100">
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
        <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18 22l-6-3.5-6 3.5 1.5-7.3L2 10l7.1-1.1L12 2Z" />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{score}</span>
    </div>
  );
}
