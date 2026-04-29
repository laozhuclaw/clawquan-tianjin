import Link from "next/link";

interface AgentCardProps {
  id: string;
  icon: string;
  name: string;
  description: string;
  category: string;
  star_count?: number;
  usage_count?: number;
}

export default function AgentCard({
  id,
  icon,
  name,
  description,
  category,
  star_count = 0,
  usage_count = 0,
}: AgentCardProps) {
  const displayUsage = usage_count >= 1000
    ? `${(usage_count / 1000).toFixed(1)}k`
    : usage_count > 0
    ? usage_count.toString()
    : "新";

  return (
    <Link href={`/agent?id=${id}`}>
      <div className="group bg-white rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full flex flex-col">
        {/* Icon & Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-[11px] font-medium border border-brand-200">
            {category}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-ink-900 mb-2 group-hover:text-brand-700 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-ink-600 mb-4 leading-relaxed flex-1 line-clamp-2">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 pt-3 border-t border-ink-100">
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-ink-500">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
              </svg>
              {star_count > 0 ? star_count : "—"}
            </span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-500">{displayUsage} 用户</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="w-full py-2.5 bg-brand-700 text-white rounded-lg font-medium text-sm group-hover:bg-brand-800 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md"
        >
          查看详情
        </button>
      </div>
    </Link>
  );
}
