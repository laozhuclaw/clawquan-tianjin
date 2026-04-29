type Service = {
  title: string;
  category: string;
  stage: string;
  owner: string;
  description: string;
};

const SERVICES: Service[] = [
  { title: "高企认定诊断", category: "政策申报", stage: "认定/复审", owner: "政策申报官", description: "围绕知识产权、研发费用、成果转化和成长性指标生成自测清单。" },
  { title: "高企复审提醒", category: "政策申报", stage: "认定/复审", owner: "政策申报官", description: "按证书周期、材料缺口和申报批次生成复审计划。" },
  { title: "科技型中小企业评价", category: "政策申报", stage: "成长型", owner: "政策申报官", description: "匹配评价条件，整理研发、人员和知识产权证明材料。" },
  { title: "专精特新培育", category: "政策申报", stage: "规模化", owner: "梯度培育官", description: "对照创新能力、专业化、精细化和特色化指标形成提升建议。" },
  { title: "创新券与补贴匹配", category: "政策申报", stage: "全阶段", owner: "政策申报官", description: "根据企业所在区、产业方向和服务需求推荐可申请政策。" },
  { title: "知识产权布局", category: "创新链", stage: "研发期", owner: "知识产权官", description: "梳理专利、软著、商标和技术秘密布局，支撑高企与融资材料。" },
  { title: "科技成果评价", category: "创新链", stage: "转化期", owner: "成果转化官", description: "对成果成熟度、应用场景、市场空间和转化路径进行结构化评估。" },
  { title: "高校院所对接", category: "创新链", stage: "研发期", owner: "产学研撮合官", description: "连接天津高校、科研院所和企业研发需求，形成联合攻关清单。" },
  { title: "技术需求揭榜", category: "创新链", stage: "攻关期", owner: "产学研撮合官", description: "把企业难题转成可发布、可匹配、可跟进的技术榜单。" },
  { title: "应用场景开放", category: "应用链", stage: "验证期", owner: "场景开放官", description: "为新技术、新产品寻找园区、链主和公共服务场景。" },
  { title: "产业链上下游撮合", category: "应用链", stage: "市场期", owner: "产业撮合官", description: "按产业链位置、供应能力和采购需求推荐合作企业。" },
  { title: "链主企业对接", category: "应用链", stage: "市场期", owner: "产业撮合官", description: "围绕链主采购、配套、验证和联合方案组织定向对接。" },
  { title: "联合解决方案", category: "应用链", stage: "市场期", owner: "方案组装官", description: "把多家会员能力打包为面向客户的行业解决方案。" },
  { title: "首台套/首版次服务", category: "应用链", stage: "验证期", owner: "场景开放官", description: "协助梳理创新产品证明材料和示范应用路径。" },
  { title: "融资需求诊断", category: "资金链", stage: "融资期", owner: "融资服务官", description: "判断适合股权、债权、担保、基金或银企对接的融资路径。" },
  { title: "银企对接", category: "资金链", stage: "融资期", owner: "融资服务官", description: "将企业经营、知识产权和订单情况转成金融机构可读材料。" },
  { title: "基金路演", category: "资金链", stage: "融资期", owner: "路演服务官", description: "生成 BP 摘要、路演议程、投资人匹配和会后跟进清单。" },
  { title: "上市培育", category: "资金链", stage: "规模化", owner: "资本路径官", description: "围绕规范治理、财务指标、融资历史和中介资源给出路径建议。" },
  { title: "人才需求画像", category: "人才链", stage: "全阶段", owner: "人才服务官", description: "把岗位需求转成技能画像、招聘渠道和候选人匹配条件。" },
  { title: "专家委员会对接", category: "人才链", stage: "研发期", owner: "专家对接官", description: "按产业方向和问题类型匹配专家、顾问和评审资源。" },
  { title: "产教融合合作", category: "人才链", stage: "成长型", owner: "产教融合官", description: "连接院校、实训基地和企业岗位，共建课程、实习和订单班。" },
  { title: "高端人才申报", category: "人才链", stage: "规模化", owner: "人才服务官", description: "匹配人才政策，整理企业平台、项目成果和人才证明材料。" },
  { title: "线上企业展厅", category: "会展活动", stage: "市场期", owner: "会展路演官", description: "把企业产品、技术、案例和合作诉求沉淀为可分享展厅。" },
  { title: "项目路演组织", category: "会展活动", stage: "市场期", owner: "会展路演官", description: "围绕主题征集项目、匹配嘉宾、生成路演议程和撮合名单。" },
  { title: "高新技术展示", category: "会展活动", stage: "市场期", owner: "会展路演官", description: "服务京津冀高新技术产业展示、线上线下双展和企业宣传。" },
  { title: "论坛沙龙报名", category: "会展活动", stage: "全阶段", owner: "活动助手", description: "按企业标签推荐活动，形成报名、签到和会后纪要。" },
  { title: "会后智能撮合", category: "会展活动", stage: "市场期", owner: "产业撮合官", description: "根据参会名单和需求自动生成值得继续沟通的企业清单。" },
  { title: "京津冀企业协同", category: "区域协同", stage: "市场期", owner: "京津冀协同官", description: "连接北京、河北高企协会资源，推动跨区域产业合作。" },
  { title: "外地资源来津", category: "区域协同", stage: "招商期", owner: "区域协同官", description: "承接外部项目、技术、人才和资本来津对接。" },
  { title: "园区载体推荐", category: "区域协同", stage: "落地期", owner: "载体服务官", description: "按研发、生产、办公、实验室需求匹配天津各区园区载体。" },
  { title: "区级政策导航", category: "区域协同", stage: "全阶段", owner: "政策申报官", description: "按滨海新区、南开、西青、武清等区域匹配政策窗口。" },
  { title: "智能科技服务", category: "重点产业", stage: "全阶段", owner: "产业服务官", description: "面向人工智能、信创、软件和数字服务企业组织资源对接。" },
  { title: "生物医药服务", category: "重点产业", stage: "全阶段", owner: "产业服务官", description: "围绕研发、临床、注册、BD 和产业化资源提供对接。" },
  { title: "新能源新材料服务", category: "重点产业", stage: "全阶段", owner: "产业服务官", description: "服务电池、储能、光伏、氢能、新材料企业的供需协作。" },
  { title: "航空航天服务", category: "重点产业", stage: "全阶段", owner: "产业服务官", description: "服务航天配套、无人系统、低空经济和高端装备需求。" },
  { title: "装备制造服务", category: "重点产业", stage: "全阶段", owner: "产业服务官", description: "组织智能装备、机器人、检测和自动化产线合作。" },
  { title: "石油化工服务", category: "重点产业", stage: "全阶段", owner: "产业服务官", description: "连接绿色化工、安全环保、材料升级和工艺改造资源。" },
  { title: "汽车工业服务", category: "重点产业", stage: "全阶段", owner: "产业服务官", description: "服务汽车零部件、智能网联、检测认证和供应链协同。" },
  { title: "数字服务示范", category: "数字化", stage: "成长型", owner: "数字化顾问", description: "沉淀数字服务案例，支撑示范企业申报和市场推广。" },
  { title: "企业 AI 名片", category: "数字化", stage: "全阶段", owner: "企业代表智能体", description: "为会员企业生成可问答、可撮合、可维护的 AI 企业代表。" },
  { title: "数据看板搭建", category: "数字化", stage: "运营期", owner: "协会运营官", description: "为协会管理层呈现服务热度、需求分布和撮合进度。" },
  { title: "会员需求工单", category: "数字化", stage: "运营期", owner: "协会运营官", description: "统一收集企业需求，形成派单、跟进、回访和归档闭环。" },
  { title: "品牌传播服务", category: "市场品牌", stage: "市场期", owner: "品牌传播官", description: "帮助企业整理案例、新闻、奖项和展会传播材料。" },
  { title: "产品市场对接", category: "市场品牌", stage: "市场期", owner: "市场拓展官", description: "按客户行业、区域和采购意向推荐渠道与潜在客户。" },
  { title: "合规风控提示", category: "合规服务", stage: "全阶段", owner: "合规助手", description: "围绕合同、数据、知识产权和申报诚信风险提供提示。" },
  { title: "服务成效回访", category: "运营闭环", stage: "运营期", owner: "协会运营官", description: "跟进服务结果，沉淀案例、满意度和后续需求。" },
];

const CATEGORIES = Array.from(new Set(SERVICES.map((service) => service.category)));
const PDF_SERVICE_GROUPS = [
  ["产业政策", "会展会务", "高企认定", "金融资本", "知识产权"],
  ["技术开发", "人才资源", "市场渠道", "科普培训", "检验检测"],
  ["成果转化", "智库支撑", "法律法务", "工业适配", "工业研学"],
  ["视频直播", "工业设计", "财税审计", "绿色低碳", "生活餐饮"],
  ["联合培养", "质量认证", "文化商旅", "现代物流", "企业文化"],
  ["党建文化", "电子商务", "产业协同", "集中采购", "质量体系"],
  ["信创产业", "低空经济", "智能网联", "产业园区", "国际产业"],
];
const VALUE_STEPS = ["全流程一站式服务", "精准配置产业资源", "全局视野联动出击", "无中生有联合创造机遇"];

export default function ServicesPage() {
  return (
    <div className="bg-ink-50">
      <section className="gradient-primary">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
          <div className="chip chip-gold mb-3">天津产业服务平台服务目录</div>
          <h1 className="text-white text-3xl lg:text-5xl font-bold tracking-tight">
            产业协同发展综合服务平台
          </h1>
          <p className="text-white/90 text-lg lg:text-2xl mt-4 max-w-4xl leading-relaxed">
            服务区域经济、服务会员企业，通过拓展大外联、营造大氛围、建立大清单，在存量中拓展增量。
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5 mb-10">
          <Metric label="会员单位" value="10056" suffix="家" />
          <Metric label="服务企业" value="15000+" suffix="家" />
          <Metric label="专职人员" value="60+" suffix="人" />
          <Metric label="合作城市" value="50+" suffix="个" />
        </div>

        <section className="card-surface p-6 lg:p-8 mb-10">
          <div className="chip chip-brand mb-3">服务能力 4.0 价值体系</div>
          <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">
            从一站式服务到联合创造机遇
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-7">
            {VALUE_STEPS.map((step, index) => (
              <div key={step} className="rounded-lg border border-ink-100 bg-ink-50 p-5 lg:p-6">
                <div className="text-base font-semibold text-brand-700">0{index + 1}</div>
                <div className="text-xl lg:text-2xl font-semibold text-ink-900 mt-3">{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="chip chip-gold mb-3">PDF 原始服务清单</div>
              <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">
                平台已沉淀的产业服务能力
              </h2>
            </div>
            <span className="text-base lg:text-lg text-ink-500">首屏展示 35 项核心服务，扩展至 46 类服务体系</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PDF_SERVICE_GROUPS.map((group, index) => (
              <article key={index} className="card-surface p-6 lg:p-7">
                <div className="text-xl lg:text-2xl font-semibold text-brand-700 mb-4">服务组 {index + 1}</div>
                <div className="flex flex-wrap gap-3">
                  {group.map((item) => (
                    <span key={item} className="chip chip-brand">{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3 mb-8">
          {CATEGORIES.map((category) => (
            <a key={category} href={`#${category}`} className="chip chip-brand">
              {category}
            </a>
          ))}
        </div>

        <div className="space-y-10">
          {CATEGORIES.map((category) => {
            const items = SERVICES.filter((service) => service.category === category);
            return (
              <section key={category} id={category} className="scroll-mt-24">
                <div className="flex items-end justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-3xl lg:text-5xl font-bold text-ink-900">{category}</h2>
                    <p className="text-lg lg:text-xl text-ink-600 mt-2">{items.length} 类服务</p>
                  </div>
                  <span className="text-lg text-ink-500 tabular-nums">{items.length}/46</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {items.map((service) => (
                    <article key={service.title} className="card-surface p-6 lg:p-7">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-xl lg:text-2xl font-semibold text-ink-900 leading-snug">{service.title}</h3>
                          <p className="text-lg lg:text-xl text-ink-600 leading-relaxed mt-3">{service.description}</p>
                        </div>
                        <span className="chip chip-gold shrink-0">{service.stage}</span>
                      </div>
                      <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between gap-3">
                        <span className="text-base lg:text-lg text-ink-500">责任智能体</span>
                        <span className="text-base lg:text-lg font-medium text-brand-700">{service.owner}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="card-surface p-5 lg:p-6">
      <div className="text-3xl lg:text-4xl font-bold text-ink-900 tabular-nums">
        {value}
        <span className="text-base lg:text-lg text-ink-500 ml-1">{suffix}</span>
      </div>
      <div className="text-base lg:text-lg text-ink-600 mt-2">{label}</div>
    </div>
  );
}
