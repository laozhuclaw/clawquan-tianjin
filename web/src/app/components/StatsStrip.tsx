"use client";

type Item = {
  label: string;
  value: string;
  suffix?: string;
  accent: "brand" | "brand-light" | "gold" | "ink";
  icon: JSX.Element;
};

const accentMap: Record<Item["accent"], { bg: string; fg: string; border: string }> = {
  brand:        { bg: "bg-brand-700",  fg: "text-white",     border: "border-brand-800" },
  "brand-light":{ bg: "bg-brand-50",   fg: "text-brand-700", border: "border-brand-100" },
  gold:         { bg: "bg-gold-50",    fg: "text-gold-600",  border: "border-gold-100" },
  ink:          { bg: "bg-ink-50",     fg: "text-ink-700",   border: "border-ink-100" },
};

// 天津高企协版展示口径 —— 先用协会服务运营口径，后续接入真实后台统计。
const ITEMS: Item[] = [
  {
    label: "会员单位",
    value: "10056",
    suffix: "家",
    accent: "brand",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M4 10l8-5 8 5v1H4v-1Z" />
        <path d="M6 11v9M10 11v9M14 11v9M18 11v9" />
      </svg>
    ),
  },
  {
    label: "年度总产值",
    value: "13800",
    suffix: "亿元",
    accent: "brand-light",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="1.5" />
        <path d="M8 8h2m4 0h2M8 12h2m4 0h2M8 16h2m4 0h2" />
      </svg>
    ),
  },
  {
    label: "年均活动",
    value: "300+",
    suffix: "场",
    accent: "gold",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M3 20V8l6-4 6 4v12" />
        <path d="M15 20V12l6 2v6" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    label: "协助获取订单",
    value: "120+",
    suffix: "亿元",
    accent: "ink",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="5" y="7" width="14" height="12" rx="2" />
        <path d="M12 7V4M8 11v2M16 11v2M9 17h6" />
      </svg>
    ),
  },
];

export default function StatsStrip() {
  return (
    <section className="px-4 lg:px-6 -mt-10 lg:-mt-16 relative z-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {ITEMS.map((it) => {
          const a = accentMap[it.accent];
          return (
            <div
              key={it.label}
              className="bg-white rounded-xl p-5 lg:p-6 shadow-card border border-ink-100/70
                         min-h-[132px] flex flex-col justify-between"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${a.bg} ${a.fg} border ${a.border} shrink-0`}
              >
                {it.icon}
              </div>
              <div className="min-w-0 mt-3">
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-3xl lg:text-4xl font-bold text-ink-900 leading-none tabular-nums">
                    {it.value}
                  </span>
                  {it.suffix && (
                    <span className="text-base lg:text-lg text-ink-500">
                      {it.suffix}
                    </span>
                  )}
                </div>
                <div className="text-base lg:text-lg text-ink-600 mt-2 leading-snug">
                  {it.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
