const AGENTS = [
  { name: "产业经纪人", category: "产业撮合", icon: "经", usage: "为上下游企业、投融资机构、科研院所和服务组织搭桥接链" },
  { name: "分中心运营官", category: "区域中心", icon: "区", usage: "围绕18个分中心建立一企一策一台账，跟进企业实际问题" },
  { name: "活动编排官", category: "节点活动", icon: "活", usage: "编排4x3x8x36节点活动，管理高峰论坛、沙龙和工业研学行" },
  { name: "项目支持官", category: "政策人才", icon: "项", usage: "跟进政策宣贯、人才政策和294个专项支持项目后续服务" },
  { name: "节水融通官", category: "专题活动", icon: "水", usage: "组织节水融通365，推动政银企校精准对接和绿色金融服务" },
  { name: "扬帆出海官", category: "国际产业", icon: "海", usage: "服务重点领域拓展国际市场、整合全球资源和银企协同赋能" },
  { name: "企业金钥匙", category: "企业服务", icon: "钥", usage: "围绕企业重点需求，组织服务资源打开具体问题解决入口" },
  { name: "科技兴安官", category: "重点品牌", icon: "安", usage: "围绕交通应急安全等专题，组织产业链资源和技术对接" },
];

export default function AgentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
      <header className="mb-8">
        <div className="chip chip-brand mb-2">平台运营智能体矩阵</div>
        <h1 className="text-3xl lg:text-5xl font-bold text-ink-900 tracking-tight mb-3">
          产业服务智能体
        </h1>
        <p className="text-ink-500 text-lg lg:text-xl leading-relaxed max-w-4xl">
          围绕 PDF 中的平台定位，把社会组织运营、产业经纪、分中心台账和节点活动转成可执行的智能体角色。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {AGENTS.map((agent) => (
          <article key={agent.name} className="card-surface p-6 lg:p-7">
            <div className="w-14 h-14 rounded-xl bg-brand-700 text-white flex items-center justify-center text-xl font-bold mb-5">
              {agent.icon}
            </div>
            <div className="chip chip-gold mb-3">{agent.category}</div>
            <h2 className="text-xl lg:text-2xl font-semibold text-ink-900">{agent.name}</h2>
            <p className="text-lg text-ink-500 leading-relaxed mt-3">{agent.usage}</p>
            <button className="btn-secondary w-full mt-6 py-2.5">配置服务流程</button>
          </article>
        ))}
      </div>
    </div>
  );
}
