import Link from "next/link";

export default function Hero() {
  return (
    <section className="gradient-hero-dark relative overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-4 lg:px-6 py-14 lg:py-24">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        bg-white/10 border border-white/15
                        text-[13px] text-white/90 font-medium mb-6
                        backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
          天津产业服务平台 · 产业经纪人 · 社会组织运营职业经理人
        </div>

        {/* Headline */}
        <h1 className="text-white font-bold leading-[1.15] tracking-tight
                       text-[30px] sm:text-[38px] lg:text-[52px] mb-5 text-balance">
          天津产业服务平台<br className="hidden sm:block" />
          <span className="text-gold-400">通过社会组织科学运营促进产业高质量发展</span>
        </h1>

        <p className="text-white/90 text-lg sm:text-xl lg:text-2xl
                      max-w-3xl leading-relaxed mb-8">
          由天津市高新技术企业协会、天津市电池行业协会、天津市知识产权保护协会、天津市节水产业协会等共同发起，面向智能科技、生物医药、新能源新材料、航空航天、装备制造、绿色石化、汽车等重点产业，建设产业协同发展综合服务平台。
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md">
          <Link href="/services" className="btn-gold w-full sm:w-auto">
            查看产业服务
            <svg viewBox="0 0 24 24" className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/opportunities"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5
                       bg-white/5 hover:bg-white/10 text-white
                       border border-white/20 hover:border-white/40
                       px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            提交企业问题
          </Link>
        </div>

        {/* Trust strip */}
        <div className="mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80 text-base lg:text-lg">
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
            </svg>
            10056 家会员单位
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 9h18" />
            </svg>
            18 个区域分中心
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
            </svg>
            120 亿+订单促成
          </span>
        </div>
      </div>
    </section>
  );
}
