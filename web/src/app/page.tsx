import Hero from "./components/Hero";
import StatsStrip from "./components/StatsStrip";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <PlatformPositioning />
      <TianjinIndustryBoard />
      <RegionalCenters />
      <ActivitySystem />
      <ServiceAgentMatrix />
      <ServiceOperatingLoop />
      <HowItWorks />
      <FooterBand />
    </>
  );
}

function PlatformPositioning() {
  const cards = [
    ["使命", "通过社会组织科学运营促进产业高质量发展"],
    ["定位", "社会组织运营职业经理人、产业经纪人"],
    ["愿景", "做中国加强版弗劳恩霍夫协会"],
    ["原则", "平台化、职业化、市场化、范式化"],
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
      <div className="chip chip-brand mb-3">平台定位</div>
      <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">
        做社会组织运营标准引领者
      </h2>
      <p className="text-lg lg:text-xl text-ink-600 mt-4 max-w-4xl leading-relaxed">
        平台以“服务区域经济、服务会员企业”为宗旨，通过拓展大外联、营造大氛围、建立大清单，为产业提供真正价值并形成可持续运营模式。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-8">
        {cards.map(([title, body]) => (
          <article key={title} className="card-surface p-6 lg:p-7">
            <div className="text-xl lg:text-2xl font-semibold text-brand-700">{title}</div>
            <p className="text-lg lg:text-xl text-ink-700 leading-relaxed mt-4">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TianjinIndustryBoard() {
  const industries = [
    { name: "智能科技", area: "1+3+4 产业布局", focus: "人工智能、信创产业、智能网联、数字服务" },
    { name: "装备制造", area: "重点产业", focus: "机器人、先进制造、工业适配、质量体系" },
    { name: "绿色石化", area: "重点产业", focus: "绿色低碳、检验检测、国际产业合作" },
    { name: "新能源", area: "重点产业", focus: "电池产业、储能、绿色金融、产业协同" },
    { name: "新材料", area: "重点产业", focus: "技术开发、成果转化、集中采购" },
    { name: "生物医药", area: "重点产业", focus: "研发转化、检验检测、质量认证" },
    { name: "航空航天", area: "重点产业", focus: "低空经济、工业设计、产业园区" },
    { name: "汽车", area: "重点产业", focus: "智能网联、零部件、市场渠道" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-6 py-10 lg:py-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="chip chip-brand mb-3">天津产业服务地图</div>
          <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">
            按产业方向组织服务，而不是按传统组织层级
          </h2>
          <p className="text-lg lg:text-xl text-ink-600 mt-4 max-w-3xl leading-relaxed">
            让企业从自身产业和发展阶段进入平台，直接找到政策、融资、人才、场景和会展资源。
          </p>
        </div>
        <a href="/organizations" className="btn-secondary w-full sm:w-auto">
          查看企业库
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {industries.map((item) => (
          <article key={item.name} className="card-surface p-6 lg:p-7">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl lg:text-2xl font-semibold text-ink-900">{item.name}</h3>
              <span className="chip chip-gold">{item.area}</span>
            </div>
            <p className="text-lg lg:text-xl text-ink-600 leading-relaxed mt-4">{item.focus}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RegionalCenters() {
  const centers = ["高新区中心", "武清区中心", "西青区中心", "经开区中心", "保税区中心"];
  return (
    <section className="bg-white border-y border-ink-100">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <div className="chip chip-gold mb-3">区域分中心</div>
        <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">
          天津 16 区设置 18 个分中心
        </h2>
        <p className="text-lg lg:text-xl text-ink-600 mt-4 max-w-4xl leading-relaxed">
          每个分中心配置 300㎡ 办公区、3 人专职团队、30 个生态合作伙伴，年度目标是 1000 个企业会员、1000 场对接活动、解决 1000 个实际问题。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          {["1000 个企业会员", "1000 场对接活动", "解决 1000 个实际问题"].map((item) => (
            <article key={item} className="rounded-lg border border-ink-100 bg-ink-50 p-6 lg:p-7">
              <div className="text-4xl lg:text-5xl font-bold text-brand-700">{item.split(" ")[0]}</div>
              <div className="text-lg lg:text-xl text-ink-700 mt-3">{item.replace(item.split(" ")[0] + " ", "")}</div>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {centers.map((center) => (
            <span key={center} className="chip chip-brand">{center}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivitySystem() {
  const brands = ["科技兴安", "企业金钥匙", "节水融通365", "扬帆出海"];
  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
      <div className="chip chip-brand mb-3">活动品牌</div>
      <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">
        4 x 3 x 8 x 36 = 3456 类节点活动
      </h2>
      <p className="text-lg lg:text-xl text-ink-600 mt-4 max-w-4xl leading-relaxed">
        围绕四大品牌系列、三种活动形式、八大重点产业和企业 36 个重点需求，形成高峰论坛、活动沙龙、工业研学行等常态化产业服务活动。
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
        {brands.map((brand) => (
          <article key={brand} className="card-surface p-6 lg:p-7">
            <div className="text-2xl lg:text-3xl font-bold text-ink-900">{brand}</div>
            <div className="text-lg lg:text-xl text-ink-600 mt-3">专题系列活动</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServiceAgentMatrix() {
  const agents = [
    ["产业经纪人", "为上下游企业、投融资机构、科研院所和服务组织搭桥接链"],
    ["分中心运营官", "一企一策一台账，了解企业真实诉求并配置产业资源"],
    ["活动编排官", "把高峰论坛、沙龙、工业研学行编排为可跟进节点活动"],
    ["项目支持官", "跟进政策、人才、金融、知识产权等专题服务和专项支持"],
  ];

  return (
    <section className="bg-white border-y border-ink-100">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <div className="chip chip-gold mb-3">AI 服务专员</div>
        <h2 className="text-3xl lg:text-5xl font-bold text-ink-900 mb-8">
          每类服务都有可追踪的智能体入口
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {agents.map(([name, body]) => (
            <article key={name} className="rounded-lg border border-ink-100 bg-ink-50 p-6 lg:p-7">
              <div className="w-12 h-12 rounded-lg bg-brand-700 text-white flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="7" width="16" height="12" rx="2" />
                  <path d="M12 7V4M8 12h.01M16 12h.01M9 16h6" />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-ink-900">{name}</h3>
              <p className="text-lg text-ink-600 leading-relaxed mt-3">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — 3-step flow with connectors                           */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "需求诊断",
      body: "企业提交政策、融资、人才、市场或技术需求，AI 先归类到 46 类服务目录。",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      ),
      accent: "brand" as const,
    },
    {
      num: "02",
      title: "服务派单",
      body: "政策申报官、产业撮合官、融资服务官等智能体推荐资源与责任人。",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 8h10M7 12h6M7 16h10" />
          <rect x="3" y="4" width="18" height="16" rx="2" />
        </svg>
      ),
      accent: "gold" as const,
    },
    {
      num: "03",
      title: "闭环跟进",
      body: "协会专员跟进材料、对接、活动和回访，沉淀成可复用的企业服务案例。",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z" />
          <path d="M8 12h0M12 12h0M16 12h0" />
        </svg>
      ),
      accent: "brand-light" as const,
    },
  ];

  return (
    <section className="px-4 lg:px-6 py-14 lg:py-20 max-w-5xl mx-auto">
      <header className="text-center mb-10">
        <div className="chip chip-brand mb-3">协作流程</div>
        <h2 className="text-3xl lg:text-5xl font-bold text-ink-900 tracking-tight">
          46 类服务如何跑起来
        </h2>
        <p className="text-lg lg:text-xl text-ink-500 mt-4 max-w-3xl mx-auto leading-relaxed">
          不只展示服务清单，而是把企业诉求变成可分派、可跟踪、可复盘的协会运营流程。
        </p>
      </header>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Connector line on desktop */}
        <div
          aria-hidden
          className="hidden md:block absolute top-[58px] left-[16%] right-[16%] h-px bg-gradient-to-r from-brand-100 via-gold-200 to-brand-100"
        />

        {steps.map((s) => {
          const accentClass =
            s.accent === "brand"
              ? "bg-brand-700 text-white border-brand-800"
              : s.accent === "gold"
              ? "bg-gold-50 text-gold-600 border-gold-100"
              : "bg-brand-50 text-brand-700 border-brand-100";

          return (
            <div
              key={s.num}
              className="relative bg-white rounded-xl p-6 lg:p-7 shadow-card border border-ink-100/70 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border ${accentClass}`}
                >
                  {s.icon}
                </div>
                <span className="text-xs font-semibold text-ink-400 tabular-nums tracking-widest">
                  STEP {s.num}
                </span>
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-ink-900 mb-2">{s.title}</div>
              <div className="text-lg text-ink-600 leading-relaxed">{s.body}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ServiceOperatingLoop() {
  const cards = [
    {
      title: "四链联动",
      body: "创新链、人才链、资金链、应用链统一进入需求池，避免企业重复找入口。",
      stat: "4 链",
    },
    {
      title: "重点产业",
      body: "智能科技、生物医药、新能源新材料、航空航天、装备制造等方向独立运营。",
      stat: "8 类",
    },
    {
      title: "会展协同",
      body: "把京津冀展会、路演、论坛沙龙沉淀为线上展厅与会后撮合清单。",
      stat: "4+X",
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="chip chip-gold mb-3">天津高企协特色</div>
          <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">
            从服务目录到产业生态运营
          </h2>
        </div>
        <a href="/services" className="btn-secondary w-full sm:w-auto">
          查看服务目录
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <article key={card.title} className="card-surface p-6 lg:p-7">
            <div className="text-4xl lg:text-5xl font-bold text-brand-700 tabular-nums">{card.stat}</div>
            <h3 className="text-xl lg:text-2xl font-semibold text-ink-900 mt-4">{card.title}</h3>
            <p className="text-lg text-ink-600 leading-relaxed mt-3">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer band — trust + disclaimer                                     */
/* ------------------------------------------------------------------ */
function FooterBand() {
  return (
    <section className="gradient-primary border-t border-brand-800/40">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-10 lg:py-14 text-center">
        <h3 className="text-white font-bold text-xl lg:text-3xl mb-2">
          让每一家天津高企，都能找到对应服务入口
        </h3>
        <p className="text-white/90 text-lg lg:text-xl max-w-2xl mx-auto mb-6 leading-relaxed">
          从高企认定到产业协同，从节水融通365到扬帆出海，从分中心台账到产业撮合，企业问题可被记录、派单和解决。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/services" className="btn-gold">
            进入 46 类服务
            <svg viewBox="0 0 24 24" className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <a
            href="/opportunities"
            className="inline-flex items-center justify-center gap-1.5
                       bg-white/5 hover:bg-white/10 text-white
                       border border-white/20 hover:border-white/40
                       px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            查看供需撮合
          </a>
        </div>
        <div className="mt-8 pt-6 border-t border-white/15 text-white/80 text-sm">
          © 2026 天津高企协 ClawQuan · 46 类产业服务 AI 协同平台
        </div>
      </div>
    </section>
  );
}
