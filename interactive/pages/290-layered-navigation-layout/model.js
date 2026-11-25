// 290 分层导航布局 · 单真源数据与架构核算引擎
// 首屏活体六层档案夹界面、L4 2D 透视切面画布与 L6 单真源诊单共用同一份计算结果。

export const SITES = {
  course: {
    id: "course",
    label: "原海报·在线课程",
    shortLabel: "在线课程",
    brand: "COURSE",
    rootCrumb: "HOME",
    siteDomain: "UI DESIGN",
    historyNoise: ["HOME", "练习巩固", "实战应用"],
    l2: [
      {
        id: "overview",
        label: "课程概览",
        en: "OVERVIEW",
        l3: [
          {
            id: "roadmap",
            label: "学习路线",
            l5: [
              { code: "01", title: "目标拆解", summary: "先用全局视角看清整门课的四段能力阶梯，再决定从哪一章切入。" },
              { code: "02", title: "前置知识", summary: "列出排版网格与视觉权重的基础门槛，避免新手直接撞上复杂案例。" },
              { code: "03", title: "学时节奏", summary: "按周次切分阅读与实操比例，让长期课程保持稳定的推进节奏。" },
              { code: "04", title: "考核标准", summary: "明确结课评审看结构清晰度、定位准确性与跨端折叠策略三项指标。" },
            ],
          },
          {
            id: "syllabus",
            label: "章节目录",
            l5: [
              { code: "01", title: "信息架构", summary: "从内容盘点、卡片分类到树状层级建立，梳理大站骨架的起点。" },
              { code: "02", title: "导航模式", summary: "对比全局导航、局部导航与上下文关联链接的职责边界。" },
              { code: "03", title: "状态反馈", summary: "设计当前位置高亮、焦点环与键盘跳转，让定位清晰无歧义。" },
              { code: "04", title: "多端适配", summary: "把桌面端多层导航平滑折叠到窄屏，不丢失上级回溯路径。" },
            ],
          },
          {
            id: "tools",
            label: "配套工具",
            l5: [
              { code: "01", title: "站点地图", summary: "用两到四层节点图校验宽深比例，提前发现过深套娃分支。" },
              { code: "02", title: "路径清单", summary: "逐页核对结构型面包屑，杜绝点击历史替代层级位置。" },
              { code: "03", title: "权重标尺", summary: "量测每层导航行高与对比度，确认主次视觉梯度单调递减。" },
              { code: "04", title: "可用性测", summary: "用五分钟后备箱测试抽查深层落地页，检验定位信息是否齐全。" },
            ],
          },
          {
            id: "faq",
            label: "常见问题",
            l5: [
              { code: "01", title: "层数上限", summary: "大多数内容型产品控制在二到四层最稳，超过四层应先合并类目。" },
              { code: "02", title: "搜索配合", summary: "分层浏览与站内搜索互为补充，前者给结构，后者解精确直达。" },
              { code: "03", title: "移动端取舍", summary: "手机屏优先保留当前层与向上一步返回，避免把三条顶栏全吸顶。" },
              { code: "04", title: "语义标签", summary: "用独立 nav 地标与 aria-current 标注当前页，照顾读屏与键盘用户。" },
            ],
          },
        ],
      },
      {
        id: "modules",
        label: "知识模块",
        en: "INFORMATION ARCHITECTURE",
        l3: [
          {
            id: "intro",
            label: "概念导入",
            l5: [
              { code: "01", title: "何为分层", summary: "把平铺直叙的入口按父子归属收进阶梯，让视线先抓大纲再进细节。" },
              { code: "02", title: "认知负担", summary: "单栏塞满十几个同级选项会让短时记忆过载，合理分组能显著提速。" },
              { code: "03", title: "信息气味", summary: "每一层标签都要准确预告下层内容，让用户点击前就心里有底。" },
              { code: "04", title: "适用边界", summary: "体量庞大、主题分明时分层最有效；十页以内的小站不必硬拆。" },
            ],
          },
          {
            id: "structure",
            label: "结构原理",
            l5: [
              { code: "01", title: "概念解析", summary: "拆解路径层、主导航、次导航与分区标签各自的语义范围与职责。" },
              { code: "02", title: "结构模型", summary: "在广度与深度之间寻找平衡，避开一锅端平铺与无底洞套娃两端。" },
              { code: "03", title: "布局策略", summary: "合理运用层级导航，帮助用户理解结构、定位位置、聚焦内容，提升学习效率与体验质量。" },
              { code: "04", title: "交互优化", summary: "切换上级时同步刷新下级与路径条，保持级联状态严丝合缝。" },
            ],
          },
          {
            id: "spec",
            label: "设计规范",
            l5: [
              { code: "01", title: "高度预算", summary: "所有常驻导航条合计宜控制在桌面视口三成左右，把舞台留给正文。" },
              { code: "02", title: "权重递减", summary: "主导航最强、次导航收敛、分区签贴近正文、面包屑保持克制轻量。" },
              { code: "03", title: "状态唯一", summary: "同一层级只能有一个激活项，高亮样式须与普通项形成清晰反差。" },
              { code: "04", title: "边界留白", summary: "用底色阶差与细线区分层级，比堆砌重阴影更能保持画面透气。" },
            ],
          },
          {
            id: "practice",
            label: "实战应用",
            l5: [
              { code: "01", title: "课程站点", summary: "按学科、模块、章节与课时四级展开，学习者随时知道进度落点。" },
              { code: "02", title: "文档中心", summary: "顶栏切产品线、次栏切主题、页内切接口分组，支持搜索引擎空降。" },
              { code: "03", title: "电商类目", summary: "大类导航配合属性筛选与位置路径，缩短跨品类折返的决策步数。" },
              { code: "04", title: "企业后台", summary: "将全局工作区切换与当前业务子页分离，防止高频操作误触顶栏。" },
            ],
          },
        ],
      },
      {
        id: "cases",
        label: "案例解析",
        en: "CASE STUDIES",
        l3: [
          {
            id: "portal",
            label: "知识门户",
            l5: [
              { code: "01", title: "层级瘦身", summary: "将原有六级目录归并为三层主题后，深层文章的回溯路径缩短一半。" },
              { code: "02", title: "路径纠偏", summary: "把记录点击顺序的假面包屑改为结构型，空降读者的迷航明显下降。" },
              { code: "03", title: "标签重命", summary: "淘汰内部部门缩写，改用用户检索词汇，强化每层入口的信息气味。" },
              { code: "04", title: "首屏减重", summary: "把通栏公告和次级横幅从导航区剥离，正文首屏露出面积回升。" },
            ],
          },
          {
            id: "saas",
            label: "后台系统",
            l5: [
              { code: "01", title: "域与页分离", summary: "顶层只放跨模块全局域，单业务内的详情切换交给局部耳签。" },
              { code: "02", title: "避免双顶栏", summary: "把低频设置收纳进明确分区，避免三条同色顶栏挤占数据表格高度。" },
              { code: "03", title: "跨区回跳", summary: "点击面包屑中段直接回到上级列表并保留筛选态，减少重复点击。" },
              { code: "04", title: "权限剪枝", summary: "无权限的层级直接不呈现空壳标签，保持可见树与实际能力一致。" },
            ],
          },
          {
            id: "shop",
            label: "多品电商",
            l5: [
              { code: "01", title: "类目宽深", summary: "把高频大类平铺在 L2，细分子类放进 L3，避免一级菜单超宽折行。" },
              { code: "02", title: "多归属处理", summary: "商品同时属于季节与品类时，面包屑固定主归属，防止路径来回跳变。" },
              { code: "03", title: "详情分区", summary: "参数、评测与售后用 L5 局部标签组织，紧贴商品主内容不抢全局。" },
              { code: "04", title: "窄屏折叠", summary: "手机端仅保留返回上级路径与当前分区签，释放商品浏览视口。" },
            ],
          },
          {
            id: "gov",
            label: "政务办事",
            l5: [
              { code: "01", title: "对象分流", summary: "首层先按个人与企业切分，瞬间砍掉一半无关事项的浏览干扰。" },
              { code: "02", title: "事项清晰", summary: "每一层入口都带直白动词，降低不熟悉行政架构群众的试错成本。" },
              { code: "03", title: "指南与办理", summary: "申报条件、材料清单与办理入口通过 L5 标签并列，不再跨页迷路。" },
              { code: "04", title: "无障碍合规", summary: "严格遵守键盘焦点顺序与语义列表，让辅助技术顺畅播报所在层级。" },
            ],
          },
        ],
      },
      {
        id: "drills",
        label: "练习巩固",
        en: "WORKSHOP DRILLS",
        l3: [
          {
            id: "audit",
            label: "导航体检",
            l5: [
              { code: "01", title: "后备箱测验", summary: "遮住首页直接空降深层页，检查 5 秒内能否答出我是谁、我在哪。" },
              { code: "02", title: "占屏比核查", summary: "在 720px 桌面视口量出导航总高度，警惕导航帽压过三成半红线。" },
              { code: "03", title: "断链排查", summary: "逐层切换 L2 与 L3，确认面包屑与下方分区不会残存旧分支内容。" },
              { code: "04", title: "权重对比", summary: "把页面去色成灰度，检验主导航是否依然比次导航和路径更醒目。" },
            ],
          },
          {
            id: "cardsort",
            label: "卡片分类",
            l5: [
              { code: "01", title: "开放分类", summary: "让真实读者把 40 张页面卡片自由归堆，观察自然心智分组边界。" },
              { code: "02", title: "封闭验证", summary: "固定拟好的 L2 类别请人归类，统计放错率高的模糊标签并改名。" },
              { code: "03", title: "树形测试", summary: "剥离视觉样式只留纯文字层级树，测试纯靠标签气味能否找对页。" },
              { code: "04", title: "宽深微调", summary: "把过深的单枝提平、过宽的散项归簇，收敛到清晰的三层平衡态。" },
            ],
          },
          {
            id: "wire",
            label: "线框重排",
            l5: [
              { code: "01", title: "主次拉开", summary: "用高度、色块饱和度与字重拉出三阶层次，让四条栏各安其位。" },
              { code: "02", title: "耳签贴近", summary: "让 L5 分区签直接扣在 L6 内容顶沿，用空间接近性说明它只管局部。" },
              { code: "03", title: "键盘流向", summary: "按 L1 → L2 → L3 → L5 → L6 排布 DOM 顺序，Tab 键自然向下推进。" },
              { code: "04", title: "端侧退让", summary: "为 390px 竖屏预设降维方案，保证正文永远是首屏真正的主角。" },
            ],
          },
          {
            id: "review",
            label: "复盘清单",
            l5: [
              { code: "01", title: "层序核对", summary: "检查是否存在局部标签爬到全局导航上面的反直觉倒置。" },
              { code: "02", title: "唯一高亮", summary: "确保任意时刻每一层恰好只有一个明确的当前位置标记。" },
              { code: "03", title: "路径一致", summary: "路径末尾不可点击且与当前标题一致，上级节点逐级可回跳。" },
              { code: "04", title: "克制留白", summary: "宁可把低频链接下沉到页脚，也不在顶部多加一层常驻横条。" },
            ],
          },
        ],
      },
    ],
  },

  docs: {
    id: "docs",
    label: "设计系统文档",
    shortLabel: "设计文档",
    brand: "DOCS",
    rootCrumb: "ROOT",
    siteDomain: "DESIGN SYSTEM",
    historyNoise: ["ROOT", "组件库", "颜色令牌"],
    l2: [
      {
        id: "start",
        label: "快速起步",
        en: "GETTING STARTED",
        l3: [
          {
            id: "install",
            label: "环境接入",
            l5: [
              { code: "01", title: "包安装", summary: "引入核心样式与图标包，按需加载导航组件以控制产物体积。" },
              { code: "02", title: "令牌配置", summary: "定义全局色板、层级高度与间距变量，让多级导航共用一套节奏。" },
              { code: "03", title: "主题切换", summary: "通过语义令牌映射浅纸与深墨绿暗室，保障对比度稳定达标。" },
              { code: "04", title: "升级迁移", summary: "从旧版双侧栏迁入分层导航时，先对齐路由树再拆分导航层。" },
            ],
          },
          {
            id: "principles",
            label: "架构原则",
            l5: [
              { code: "01", title: "单一事实", summary: "路由配置同时驱动面包屑与各级高亮，杜绝手工维护导致脱节。" },
              { code: "02", title: "渐进展开", summary: "只在进入某个域后展示其下级菜单，避免一开始就暴露全部叶子。" },
              { code: "03", title: "空间诚实", summary: "让物理叠压顺序对应信息包容关系，上层包住下层、外部包住内部。" },
              { code: "04", title: "容错回退", summary: "任何深层文档都能通过面包屑一步回到专题总览或根目录。" },
            ],
          },
          {
            id: "tokens",
            label: "设计令牌",
            l5: [
              { code: "01", title: "字阶体系", summary: "主导航用高清晰字重，次导航适度降轻，路径条用紧凑等宽字。" },
              { code: "02", title: "高度阶梯", summary: "按 L2 > L3 ≈ L5 > L1 控制行高，在视觉上直接表露层级权重。" },
              { code: "03", title: "边界线宽", summary: "用 1px 细线与切角轮廓划分纸层，避免滥用厚重投影干扰阅读。" },
              { code: "04", title: "焦点样式", summary: "所有交互节点配置统一的高对比键盘焦点框，确保可访问性。" },
            ],
          },
          {
            id: "a11y",
            label: "无障碍规范",
            l5: [
              { code: "01", title: "地标命名", summary: "主导航、次导航与面包屑必须具备互不相同的 aria-label 名称。" },
              { code: "02", title: "当前标记", summary: "用 aria-current 声明当前页或当前步，不只依赖颜色变化。" },
              { code: "03", title: "分隔隐藏", summary: "面包屑里的斜杠或箭头由 CSS 伪元素生成，避免读屏逐个念出。" },
              { code: "04", title: "跳过导航", summary: "在多层导航前提供直达正文链接，减少键盘用户重复按 Tab。" },
            ],
          },
        ],
      },
      {
        id: "foundations",
        label: "基础规范",
        en: "FOUNDATIONS",
        l3: [
          {
            id: "ia",
            label: "信息架构",
            l5: [
              { code: "01", title: "分类维度", summary: "按任务、对象或主题择一为主轴，避免同一层里混装不同分类法。" },
              { code: "02", title: "宽深约束", summary: "每层导航保持 3–7 个平行项，既不撑破横栏也不迫使深层钻洞。" },
              { code: "03", title: "路径映射", summary: "URL 段与面包屑层一一对应，直接剪掉末端路径也能访问父页。" },
              { code: "04", title: "内容归属", summary: "每篇文档指定唯一主归属，交叉主题通过文内链接而非重复挂树。" },
            ],
          },
          {
            id: "navlayers",
            label: "导航层级",
            l5: [
              { code: "01", title: "适用边界", summary: "当文档跨越大模块且子主题超过三层时，分层导航最能稳定定向。" },
              { code: "02", title: "权重阶梯", summary: "L2 承担全局锚定，L3 负责域内切换，L5 贴身服务当前正文块。" },
              { code: "03", title: "键盘流", summary: "支持左右方向键在同层签间移动，Enter 确认并同步更新路径。" },
              { code: "04", title: "响应折叠", summary: "窄屏下将全局层折入抽屉，只留轻量化返回路径与分区标签。" },
            ],
          },
          {
            id: "crumb",
            label: "面包屑",
            l5: [
              { code: "01", title: "位置优先", summary: "永远呈现网站层级位置而非用户点击轨迹，服务搜索空降访客。" },
              { code: "02", title: "末项不链", summary: "当前页名称放在路径末端作视觉定锚，不设为无效刷新链接。" },
              { code: "03", title: "折行截断", summary: "路径超长时折叠中间层为可展开节点，保留起点与紧邻父级。" },
              { code: "04", title: "辅助角色", summary: "面包屑永远是主导航的帮手，不可为了省空间而删掉主导航。" },
            ],
          },
          {
            id: "focus",
            label: "焦点管理",
            l5: [
              { code: "01", title: "切换不丢", summary: "切换 L5 分区标签时焦点留在对应签上，不把键盘读者弹回页顶。" },
              { code: "02", title: "状态播报", summary: "面板内容更新后通过清晰标题锚定，让辅助设备立即感知变化。" },
              { code: "03", title: "热区充裕", summary: "触摸设备下每枚导航标签高度不少于 40px，避免相邻层误点。" },
              { code: "04", title: "减动兼容", summary: "开启减少动态效果时，档案层直接切换落位，不做位移动画。" },
            ],
          },
        ],
      },
      {
        id: "components",
        label: "组件库",
        en: "COMPONENTS",
        l3: [
          {
            id: "topnav",
            label: "全局顶栏",
            l5: [
              { code: "01", title: "槽位上限", summary: "全局栏最多承载 5–7 个核心域，低频入口移交页脚或工具菜单。" },
              { code: "02", title: "激活反差", summary: "通过色块底板与字重拉开激活态，让用户余光即可锁定大区。" },
              { code: "03", title: "品牌锚点", summary: "最左侧固定站点标识与回首页锚点，构成后备箱测试第一问答。" },
              { code: "04", title: "防折行", summary: "顶栏文案精炼在二到四字内，防止中屏宽度下爆成双行压屏。" },
            ],
          },
          {
            id: "subnav",
            label: "次级导航",
            l5: [
              { code: "01", title: "降权处理", summary: "采用浅底细线或底杠表达激活，视觉音量明显低于上层主导航。" },
              { code: "02", title: "作用域明", summary: "随 L2 切换整体替换选项集合，清楚传达这是当前大区的子目录。" },
              { code: "03", title: "竖线分隔", summary: "在浅暖底面上用极细竖线隔开条目，比堆叠圆角胶囊更利落。" },
              { code: "04", title: "溢出提示", summary: "条目超宽时在边缘给出渐隐提示或切换更紧凑的分组方案。" },
            ],
          },
          {
            id: "tabs",
            label: "分区耳签",
            l5: [
              { code: "01", title: "形态绑定", summary: "激活耳签与下方详情面板共用同色衔接，一眼看清归属关系。" },
              { code: "02", title: "编号序次", summary: "对有阅读先后顺序的内容加 01–04 编号，强化学习路径预期。" },
              { code: "03", title: "等宽克制", summary: "分区项控制在 2–5 项，超出时应升级为独立目录而非塞满耳签。" },
              { code: "04", title: "不跨页跳", summary: "耳签只切换同一详情视图内的分区，不混入跳去外站的链接。" },
            ],
          },
          {
            id: "drawer",
            label: "移动抽屉",
            l5: [
              { code: "01", title: "按需展开", summary: "手机端把 L2/L3 收进清晰标注的菜单抽屉，保留单层返回路径。" },
              { code: "02", title: "展开当前", summary: "打开抽屉时默认展开当前所在分支，用户不必从根重新逐层点开。" },
              { code: "03", title: "背景锁定", summary: "抽屉展开期间拦截底层滚动并支持 Esc 关闭，保持操作可预期。" },
              { code: "04", title: "清晰出口", summary: "抽屉顶部同时提供关闭键与回首页入口，避免窄屏陷入死胡同。" },
            ],
          },
        ],
      },
      {
        id: "patterns",
        label: "模式指南",
        en: "PATTERNS",
        l3: [
          {
            id: "deep",
            label: "空降着陆",
            l5: [
              { code: "01", title: "首眼定向", summary: "搜索引擎来的访客先看标题与面包屑，再扫全局栏判断站点范围。" },
              { code: "02", title: "同级漫游", summary: "L3 与 L5 直接露出相邻文档，让空降读者能顺手浏览前后主题。" },
              { code: "03", title: "向上拓展", summary: "如果落地页太具体，点面包屑上一级就能退回概览重选方向。" },
              { code: "04", title: "减少弹窗", summary: "深层页切忌在导航栏下方再叠促销横幅，否则整屏全被界面吞掉。" },
            ],
          },
          {
            id: "search",
            label: "搜览结合",
            l5: [
              { code: "01", title: "已知走搜", summary: "记得确切 API 名称时搜索最快，分层导航负责提供结果所属语境。" },
              { code: "02", title: "探索走层", summary: "还不清楚专有名词时，靠分层入口逐级缩小范围比盲搜更安心。" },
              { code: "03", title: "结果带径", summary: "搜索结果条目下附带简化层级路径，帮用户快速区分同名词条。" },
              { code: "04", title: "无果回栏", summary: "搜索无结果时直接给出 L2 核心分类入口，避免用户流失。" },
            ],
          },
          {
            id: "version",
            label: "多版本切换",
            l5: [
              { code: "01", title: "独立槽位", summary: "版本号属于全局上下文而非内容分类，应与 L2 分类明显区隔。" },
              { code: "02", title: "尽量保页", summary: "切换版本后优先留在同名章节，不存在时才退回该版本首页。" },
              { code: "03", title: "旧版提示", summary: "阅读归档版本时用轻提示标明，不额外增开一条常驻深色导航条。" },
              { code: "04", title: "路径标明", summary: "路径中可轻标主版本代号，防止多标签页对照阅读时看串。" },
            ],
          },
          {
            id: "auditdoc",
            label: "文档体检",
            l5: [
              { code: "01", title: "死角清查", summary: "统计点击三层以上仍无人到达的冷门叶节点，考虑上提或合并。" },
              { code: "02", title: "重名消歧", summary: "不同 L2 分支下出现同名 L3 标签时，补充限定词避免误认。" },
              { code: "03", title: "高度复测", summary: "在 1366×768 常见笔记本屏核实导航总占高，严防首屏无正文。" },
              { code: "04", title: "迭代同步", summary: "每新增一个文档大类都要复核宽深平衡，防止主栏悄然膨胀。" },
            ],
          },
        ],
      },
    ],
  },

  repo: {
    id: "repo",
    label: "开源代码仓库",
    shortLabel: "代码仓库",
    brand: "REPO",
    rootCrumb: "ORG",
    siteDomain: "CORE ROUTER",
    historyNoise: ["ORG", "发布文档", "安全公告"],
    l2: [
      {
        id: "code",
        label: "代码库",
        en: "SOURCE CODE",
        l3: [
          {
            id: "tree",
            label: "目录树",
            l5: [
              { code: "01", title: "路由入口", summary: "顶部路径条映出仓库与子目录层级，点击任意目录段即可向上回溯。" },
              { code: "02", title: "核心模块", summary: "用 L5 分区签在源码、类型定义、单测与变更记录之间快速横跳。" },
              { code: "03", title: "依赖拓扑", summary: "将模块依赖按域分层展开，避免在一整张扁平列表里肉眼检索。" },
              { code: "04", title: "性能基准", summary: "把压测脚本与历史对照放在同一详情面板的不同耳签下查阅。" },
            ],
          },
          {
            id: "commits",
            label: "提交记录",
            l5: [
              { code: "01", title: "主干变更", summary: "L2 锁定代码域，L3 切至提交史，再用 L5 区分功能、修复与文档。" },
              { code: "02", title: "差异审阅", summary: "大改动时保持路径条常显文件名，滚动审阅也不迷失上下文。" },
              { code: "03", title: "回溯标签", summary: "借助清晰分层把构建状态与代码变更并列呈现，缩短排障时间。" },
              { code: "04", title: "贡献统计", summary: "按子目录维度筛选维护记录，路径与正文保持严密一致。" },
            ],
          },
          {
            id: "deps",
            label: "依赖关系",
            l5: [
              { code: "01", title: "直接依赖", summary: "顶层先分清生产依赖与开发工具，避免风险清单混成一锅。" },
              { code: "02", title: "间接传递", summary: "仅在点选具体包后才展开下级传递链，克制首屏信息密度。" },
              { code: "03", title: "许可审计", summary: "用局部耳签切到开源协议摘要，不额外增加顶层导航负担。" },
              { code: "04", title: "安全通告", summary: "把高危告警精准挂到对应包路径下，定位直观可追溯。" },
            ],
          },
          {
            id: "changelog",
            label: "变更志",
            l5: [
              { code: "01", title: "破坏更新", summary: "优先把不兼容改动前置到首个分区签，提醒升级者第一时间核查。" },
              { code: "02", title: "新增能力", summary: "按核心、插件与工具链归类展示，路径始终锚定当前主版本。" },
              { code: "03", title: "缺陷修复", summary: "关联对应议题编号，实现从变更志到讨论上下文的一步穿透。" },
              { code: "04", title: "弃用预告", summary: "集中列出待移除接口及替代方案，减少开发者跨页来回翻找。" },
            ],
          },
        ],
      },
      {
        id: "issues",
        label: "议题追踪",
        en: "ISSUES",
        l3: [
          {
            id: "open",
            label: "待处理",
            l5: [
              { code: "01", title: "缺陷复现", summary: "按模块分层收敛议题，让维护者聚焦自己负责的子域。" },
              { code: "02", title: "优先级排", summary: "通过分区标签区分阻塞、高优与待确认，避免顶栏塞满筛选按钮。" },
              { code: "03", title: "指派分发", summary: "保持全局域不变，仅在局部视图中切换待认领与已指派列表。" },
              { code: "04", title: "复现环境", summary: "把复现步骤与日志折叠在详情页分区内，保持议题脉络清楚。" },
            ],
          },
          {
            id: "triage",
            label: "分诊队列",
            l5: [
              { code: "01", title: "待补信息", summary: "把缺复现的条目归入独立耳签，不干扰已确认缺陷的修复队列。" },
              { code: "02", title: "重复合并", summary: "通过面包屑快速核对议题所属组件，更快识别同源重复上报。" },
              { code: "03", title: "首次贡献", summary: "将新手友好任务独立成签，让外部贡献者一眼找到合适切入口。" },
              { code: "04", title: "路线排期", summary: "把短期迭代与长期提案拆开呈现，减少讨论区噪声。" },
            ],
          },
          {
            id: "milestones",
            label: "里程碑",
            l5: [
              { code: "01", title: "当前迭代", summary: "聚焦本周期必达目标，用结构路径标清所处发布轨道。" },
              { code: "02", title: "下个版本", summary: "提前收敛下期需求边界，同级切换不打断全局位置认知。" },
              { code: "03", title: "长期规划", summary: "保留架构演进方向供社区审阅，与当前排期清清楚楚隔开。" },
              { code: "04", title: "已归档期", summary: "历史里程碑沉淀为可追溯档案，便于复盘延期原因。" },
            ],
          },
          {
            id: "labels",
            label: "标签体系",
            l5: [
              { code: "01", title: "类型维", summary: "将缺陷、增强与文档作为独立标签族，保持分类维度互斥。" },
              { code: "02", title: "子域维", summary: "标签命名与目录树层级保持一致，强化跨页面信息气味。" },
              { code: "03", title: "状态维", summary: "明确处理阶段，防止一条议题同时挂着相互矛盾的状态签。" },
              { code: "04", title: "清理规则", summary: "定期合并低频碎标签，控制每个分组的宽度在可扫描范围内。" },
            ],
          },
        ],
      },
      {
        id: "pulls",
        label: "合并请求",
        en: "PULL REQUESTS",
        l3: [
          {
            id: "review",
            label: "待审队列",
            l5: [
              { code: "01", title: "改动概览", summary: "先看意图与影响范围，再通过 L5 切进文件差异与检查结果。" },
              { code: "02", title: "文件变更", summary: "顶部结构路径标明改动所在模块，跨文件审阅不丢失全局坐标。" },
              { code: "03", title: "流水检查", summary: "构建、单测与体积极限在独立耳签汇总，不把顶栏撑成仪表墙。" },
              { code: "04", title: "审阅意见", summary: "把未解决评论单独成签，临近合并前一键清零遗漏项。" },
            ],
          },
          {
            id: "drafts",
            label: "草稿提案",
            l5: [
              { code: "01", title: "方案探讨", summary: "提前公开未完成改动收集架构意见，与可合并队列清楚隔离。" },
              { code: "02", title: "接口草案", summary: "将类型签名与示例单独呈现，降低评审者阅读未完代码的成本。" },
              { code: "03", title: "待办核对", summary: "清晰列出尚缺的测试与文档，避免误合并半成品。" },
              { code: "04", title: "关联议题", summary: "用双向路径锚定起源需求，评审时随时回查原始背景。" },
            ],
          },
          {
            id: "merged",
            label: "已合并",
            l5: [
              { code: "01", title: "本周合入", summary: "按合入时间回溯近期变化，帮助排障人员迅速锁定回归点。" },
              { code: "02", title: "关联发布", summary: "指明该改动进入哪个正式版本，打通代码与发布文档的层级链。" },
              { code: "03", title: "回滚预案", summary: "记录高风险改动的开关与回退提交，应急时路径最短。" },
              { code: "04", title: "性能对比", summary: "留存合入前后关键指标对照，验证优化是否真实有效。" },
            ],
          },
          {
            id: "ci",
            label: "集成流水",
            l5: [
              { code: "01", title: "构建矩阵", summary: "分平台列出构建结果，仅在出错时下钻查看详细日志。" },
              { code: "02", title: "覆盖报告", summary: "按目录层级汇总测试覆盖率，直指薄弱子模块。" },
              { code: "03", title: "产物校验", summary: "核对打包大小与离线约束，超标立即高亮警示。" },
              { code: "04", title: "缓存命中", summary: "监控流水线耗时分布，优先优化瓶颈阶段。" },
            ],
          },
        ],
      },
      {
        id: "releases",
        label: "发布文档",
        en: "RELEASES",
        l3: [
          {
            id: "latest",
            label: "最新稳定版",
            l5: [
              { code: "01", title: "核心亮点", summary: "提炼最影响使用者的三项改进，不把全部零碎提交倾倒在首屏。" },
              { code: "02", title: "升级指南", summary: "按步骤给出迁移清单，帮助团队低风险跨越版本。" },
              { code: "03", title: "下载校验", summary: "提供离线包与校验摘要，入口位置始终固定易找。" },
              { code: "04", title: "已知限制", summary: "坦诚列出尚未覆盖的边界场景，减少无谓踩坑。" },
            ],
          },
          {
            id: "lts",
            label: "长期支持",
            l5: [
              { code: "01", title: "维护窗口", summary: "清晰标明安全修复截止日期，便于生产系统安排升级排期。" },
              { code: "02", title: "补丁列表", summary: "仅收录稳定向后兼容的修补，不夹带破坏性特性。" },
              { code: "03", title: "兼容矩阵", summary: "按运行环境分层对照支持状态，查表一目了然。" },
              { code: "04", title: "迁出路径", summary: "提供从旧 LTS 平滑过渡到新一代版本的对照文档。" },
            ],
          },
          {
            id: "security",
            label: "安全公告",
            l5: [
              { code: "01", title: "影响范围", summary: "第一时间标明受影响版本与模块路径，方便自查。" },
              { code: "02", title: "缓解措施", summary: "给出临时配置规避方案与正式补丁版本。" },
              { code: "03", title: "披露流程", summary: "提供私密上报渠道与响应时效说明。" },
              { code: "04", title: "历史通告", summary: "按年份分层归档所有已结案公告，透明可查。" },
            ],
          },
          {
            id: "archive",
            label: "归档版本",
            l5: [
              { code: "01", title: "v2 归档", summary: "保留历史文档快照供遗留项目查阅，顶栏明确提示非最新版。" },
              { code: "02", title: "v1 归档", summary: "保留原始架构脉络，见证目录与导航的演进取舍。" },
              { code: "03", title: "对照表", summary: "汇总跨大版本的术语与路由变更，避免旧链接失效无解。" },
              { code: "04", title: "离线镜像", summary: "提供完整静态压缩包，内网环境双击即可查阅。" },
            ],
          },
        ],
      },
    ],
  },
};

// 开场默认状态：刻意停在 0/4 迷航错态（绝非答案）
export function createInitialState() {
  return {
    site: "course",
    l2: 1, // 知识模块
    l3: 1, // 结构原理
    l5: 2, // 03 布局策略（与 290 原海报一致的起点内容，但导航架构处于四重错态）
    order: "inverted",     // 层序倒置：L5 分区层错叠在 L2 主导航之上
    crumbMode: "history",  // 历史型假面包屑：与当前所在结构脱节
    orientMode: "none",    // 定位失标：L2/L3/L5 无高亮当前状态
    weightMode: "flat",    // 权重平齐：各层同高同重抢第一眼
    depthSpan: 0.90,       // 过深套娃：0.90 -> 6 层堆叠，导航吃掉 44% 首屏
    trunkTest: false,      // 后备箱空降测验开关
  };
}

// 多组合法解 + 试错预设（单真源）
export const PRESETS = {
  poster: {
    label: "原海报三层解",
    kind: "valid",
    patch: { order: "cascade", crumbMode: "location", orientMode: "single", weightMode: "stepped", depthSpan: 0.58 },
  },
  light: {
    label: "轻量两层解",
    kind: "valid",
    patch: { order: "cascade", crumbMode: "location", orientMode: "single", weightMode: "stepped", depthSpan: 0.36 },
  },
  compact4: {
    label: "紧凑四层解",
    kind: "valid",
    patch: { order: "cascade", crumbMode: "location", orientMode: "single", weightMode: "stepped", depthSpan: 0.69 },
  },
  errFlat: {
    label: "试错：单栏平铺",
    kind: "error",
    patch: { order: "cascade", crumbMode: "none", orientMode: "single", weightMode: "stepped", depthSpan: 0.10 },
  },
  errDeep: {
    label: "试错：六层压屏",
    kind: "error",
    patch: { order: "cascade", crumbMode: "location", orientMode: "double", weightMode: "inverted", depthSpan: 0.94 },
  },
  reset: {
    label: "复原 0/4 错态",
    kind: "reset",
    patch: { order: "inverted", crumbMode: "history", orientMode: "none", weightMode: "flat", depthSpan: 0.90 },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 从 depthSpan (0..1) 连续推导出结构形态档位（同一处定义，画布和 DOM 共用）
export function depthProfile(depthSpan) {
  const d = clamp(depthSpan, 0, 1);
  if (d < 0.24) {
    return {
      zone: "flat",
      label: "过度扁平（1层16项）",
      navTierCount: 1,
      showL3: false,
      showL5: false,
      extraLayers: 0,
      maxItemsPerBar: 16,
      chromeScale: 0.92,
    };
  }
  if (d < 0.46) {
    return {
      zone: "light",
      label: "轻量两层（L2 + L5）",
      navTierCount: 2,
      showL3: false,
      showL5: true,
      extraLayers: 0,
      maxItemsPerBar: 4,
      chromeScale: 0.88 + (d - 0.24) * 0.45,
    };
  }
  if (d <= 0.72) {
    return {
      zone: "classic",
      label: d <= 0.64 ? "原海报三层（L1+L2+L3+L5）" : "紧凑四层（全层展开）",
      navTierCount: d <= 0.64 ? 3 : 4,
      showL3: true,
      showL5: true,
      extraLayers: 0,
      maxItemsPerBar: 4,
      chromeScale: 0.94 + (d - 0.46) * 0.62,
    };
  }
  const extra = d > 0.86 ? 2 : 1;
  return {
    zone: "deep",
    label: `过度嵌套（${4 + extra}层压屏）`,
    navTierCount: 4 + extra,
    showL3: true,
    showL5: true,
    extraLayers: extra,
    maxItemsPerBar: 4,
    chromeScale: 1.15 + (d - 0.72) * 1.35,
  };
}

// 单真源架构评估：根据当前状态计算真实渲染层序、像素高、权重值、四维达标、后备箱 6 问与白话诊单
export function evaluate(state, viewportH = 720) {
  const site = SITES[state.site] || SITES.course;
  const l2Node = site.l2[state.l2] || site.l2[0];
  const l3Node = l2Node.l3[state.l3] || l2Node.l3[0];
  const l5Node = l3Node.l5[state.l5] || l3Node.l5[0];
  const prof = depthProfile(state.depthSpan);

  // 1. 计算每一层的真实参考像素高（桌面 720px 内容视口基准）与视觉权重分数（相对显著度）
  let h1 = 36, h2 = 52, h3 = 44, h5 = 48;
  let w1 = 28, w2 = 90, w3 = 60, w5 = 54;

  if (state.weightMode === "flat") {
    // 层层等高同重：面包屑、主导航、次导航、分区几乎一样粗重
    h1 = 54; h2 = 54; h3 = 54; h5 = 54;
    w1 = 86; w2 = 88; w3 = 86; w5 = 84;
  } else if (state.weightMode === "inverted") {
    // 喧宾夺主：辅助面包屑比主导航还粗还亮
    h1 = 62; h2 = 42; h3 = 48; h5 = 50;
    w1 = 96; w2 = 52; w3 = 66; w5 = 62;
  } else {
    // 主次递减（stepped）：L2 > L3 > L1，L5 贴身服务 L6
    h1 = Math.round(34 * prof.chromeScale);
    h2 = Math.round(52 * prof.chromeScale);
    h3 = Math.round(42 * prof.chromeScale);
    h5 = Math.round(46 * prof.chromeScale);
    w1 = 26; w2 = 92; w3 = 58; w5 = 52;
  }

  // 过度扁平时单栏被 16 项撑爆成双行高
  if (prof.zone === "flat") {
    h2 = Math.round(92 * (state.weightMode === "flat" ? 1.08 : 1));
  }

  const crumbVisible = state.crumbMode !== "none";
  const layers = [];

  const mkL1 = () => ({
    id: "L1",
    name: "路径层",
    en: "PATH",
    role: "crumb",
    heightPx: crumbVisible ? h1 : 0,
    weight: crumbVisible ? w1 : 0,
    visible: crumbVisible,
    color: state.weightMode === "inverted" ? "#E85D38" : "#0B3D25",
    items: 4,
  });
  const mkL2 = () => ({
    id: "L2",
    name: "主导航层",
    en: "GLOBAL",
    role: "primary",
    heightPx: h2,
    weight: w2,
    visible: true,
    color: "#E85D38",
    items: prof.zone === "flat" ? 16 : 4,
  });
  const mkL3 = () => ({
    id: "L3",
    name: "次导航层",
    en: "LOCAL",
    role: "secondary",
    heightPx: prof.showL3 ? h3 : 0,
    weight: prof.showL3 ? w3 : 0,
    visible: prof.showL3,
    color: "#E6DCC8",
    items: 4,
  });
  const mkL5 = () => ({
    id: "L5",
    name: "分区导航层",
    en: "SECTION",
    role: "section",
    heightPx: prof.showL5 ? h5 : 0,
    weight: prof.showL5 ? w5 : 0,
    visible: prof.showL5,
    color: "#D6CFB4",
    items: 4,
  });

  // 按层序拼出实际渲染顺序（顺序直接驱动 DOM flex order 与 2D 切面画布）
  if (state.order === "inverted") {
    // 错态：分区导航 L5 错叠在 L2 主导航上方
    layers.push(mkL1(), mkL5(), mkL2(), mkL3());
  } else if (state.order === "swapped") {
    // 错态：次导航 L3 错叠在 L2 主导航上方
    layers.push(mkL1(), mkL3(), mkL2(), mkL5());
  } else {
    layers.push(mkL1(), mkL2(), mkL3(), mkL5());
  }

  // 过度嵌套时多出的冗余子导航层（真实计入导航占高与画布叠层）
  for (let i = 0; i < prof.extraLayers; i++) {
    layers.push({
      id: i === 0 ? "L3b" : "L3c",
      name: i === 0 ? "冗余四级栏" : "冗余五级栏",
      en: i === 0 ? "NESTED +1" : "NESTED +2",
      role: "extra",
      heightPx: state.weightMode === "flat" ? 52 : 44,
      weight: state.weightMode === "flat" ? 82 : 56,
      visible: true,
      color: i === 0 ? "#C9B99B" : "#9F8D6F",
      items: 3,
    });
  }

  const visibleNavLayers = layers.filter((l) => l.visible);
  const chromePx = visibleNavLayers.reduce((s, l) => s + l.heightPx, 0);
  const chromePct = Math.round((chromePx / viewportH) * 100);
  const contentPct = Math.max(12, 100 - chromePct);
  const activeBarCount = visibleNavLayers.length;

  // 2. 路径条真实文本（结构位置型 vs 点击历史脱节型）
  const crumbs =
    state.crumbMode === "location"
      ? [
          { label: site.rootCrumb, level: 0 },
          { label: site.brand, level: 1 },
          { label: l2Node.label, level: 2 },
          { label: l3Node.label, level: 3 },
          { label: `${l5Node.code} ${l5Node.title}`, level: 4, current: true },
        ]
      : state.crumbMode === "history"
      ? [
          { label: site.historyNoise[0], level: 0 },
          { label: site.historyNoise[1], level: 2, mismatch: true },
          { label: site.historyNoise[2], level: 3, mismatch: true },
          { label: `${l5Node.code} ${l5Node.title}`, level: 4, current: true },
        ]
      : [];

  // 3. 四维架构单真源判定
  const orderOk = state.order === "cascade";
  const depthOk = prof.zone === "light" || prof.zone === "classic";
  const levelOk = orderOk && depthOk;

  const pathOk = state.crumbMode === "location" && orderOk;
  const orientOk = state.orientMode === "single";
  const weightMonotonic = state.weightMode === "stepped";
  const chromeOk = chromePct <= 36;
  const weightOk = weightMonotonic && chromeOk;

  const passedCount = [levelOk, pathOk, orientOk, weightOk].filter(Boolean).length;

  // 4. 归纳具体故障清单（按危害优先级排第一主诊断）
  const faults = [];
  if (!orderOk) {
    faults.push({
      code: "order",
      layer: state.order === "inverted" ? "L5 / L2" : "L3 / L2",
      short: "层序倒置",
      headline:
        state.order === "inverted"
          ? "L5 分区标签爬到了 L2 主导航上面，先见局部后见全局"
          : "L3 次导航压在了 L2 主导航前面，父子归属头脚倒挂",
      why: "分层导航的第一条规律是「由上至下、从全局到细节」。一旦局部标签排在全局大区前面，读者点完上面才发现下面大区变了，心智模型瞬间断裂。",
      fix: "在 L6 装调区把「层序」切回「自上而下」，让 L1 → L2 → L3 → L5 按包容范围逐级向下展开。",
      action: { key: "order", value: "cascade", label: "校准层序" },
    });
  }
  if (prof.zone === "flat") {
    faults.push({
      code: "flat",
      layer: "L2",
      short: "单栏塞爆",
      headline: `16 个入口硬塞进 1 条扁平栏，视觉扫描过载`,
      why: "没有父子分层时，眼球被迫逐条硬扫十几个平权链接，记不住结构归属。Kiger (1984) 与 Larson & Czerwinski (1998) 都表明，无分组的极端平铺会拖慢检索并削弱信息气味。",
      fix: "向右拖动 L4 切面画布（或按 → 键），把单栏收束进 2–4 层合理阶梯（例如 4×4 或 4×4×4）。",
      action: { key: "depthSpan", value: 0.58, label: "展开至三层" },
    });
  }
  if (prof.zone === "deep") {
    faults.push({
      code: "deep",
      layer: "L1–L5",
      short: `深叠压屏 ${chromePct}%`,
      headline: `叠出 ${prof.navTierCount} 层导航，光导航条就吃掉首屏 ${chromePct}%`,
      why: `当前导航区累计占去 ${chromePx}px（按 720px 桌面视口折算 ${chromePct}%），正文只剩 ${contentPct}%。Kiger (1984) 指出过深层级不仅挤压正文，还会叠加短时记忆负担与迷航风险。`,
      fix: "向左拖动 L4 切面画布（或按 ← 键），把层数收回到 2 层轻量解或 3 层原海报解（导航占高 ≤ 36% 经验线）。",
      action: { key: "depthSpan", value: 0.58, label: "收束层数" },
    });
  }
  if (state.crumbMode === "history") {
    faults.push({
      code: "crumb-history",
      layer: "L1",
      short: "路径脱节",
      headline: "L1 面包屑记的是历史乱跳，与当前所属结构对不上",
      why: `你此刻正在「${l2Node.label} › ${l3Node.label}」，但 L1 仍显示「${site.historyNoise[1]} › ${site.historyNoise[2]}」。NN/g 导航研究指出：面包屑应反映站点的固定层级位置，而非浏览器后退历史。`,
      fix: "点 L1 纠错签或把「路径模式」切到「结构位置」，让面包屑与当前所在分支严格同步。",
      action: { key: "crumbMode", value: "location", label: "同步结构路径" },
    });
  } else if (state.crumbMode === "none") {
    faults.push({
      code: "crumb-none",
      layer: "L1",
      short: "路径缺失",
      headline: "空降深层页面时看不到上级路径，只能盲按浏览器后退",
      why: "绝大多数读者通过搜索或分享链接直接落在深层页。缺少结构型面包屑时，用户既看不出这一页隶属于哪个专题，也没法一键跳回上一层总览。",
      fix: "开启 L1「结构位置」路径层，给深层落地页补上清晰可追溯的归属链。",
      action: { key: "crumbMode", value: "location", label: "开启结构路径" },
    });
  }
  if (state.orientMode === "none") {
    faults.push({
      code: "orient-none",
      layer: "L2 / L3 / L5",
      short: "定位盲区",
      headline: "L2、L3、L5 都没有当前项高亮，看不出「你在这里」",
      why: "Steve Krug「后备箱测试」最关键的一问就是「我现在在哪一栏」。所有标签长得一模一样时，读者只能逐字对照标题猜自己身处哪个模块。",
      fix: "点击「定位亮标」切为「单点定位」，让每一层只亮起唯一一个当前落点。",
      action: { key: "orientMode", value: "single", label: "点亮当前定位" },
    });
  } else if (state.orientMode === "double") {
    faults.push({
      code: "orient-double",
      layer: "L2 / L3",
      short: "双项抢亮",
      headline: "同一导航层里同时亮起两个激活项，定位信号自相矛盾",
      why: "在一个单选层级里如果两枚标签同时呈激活态，用户会怀疑页面是不是混合展示两个模块，或者误把悬停/推广角标当成当前位置。",
      fix: "把「定位亮标」切回「单点定位」，保证每一层在任意时刻只对应唯一位置。",
      action: { key: "orientMode", value: "single", label: "恢复唯一高亮" },
    });
  }
  if (state.weightMode === "flat") {
    faults.push({
      code: "weight-flat",
      layer: "权重",
      short: "层层同重",
      headline: "四条导航等高同重一起抢眼，分不清谁是主干谁是辅助",
      why: `原海报把「层级与权重的平衡方法」列为第二大要点。现在 L1(${w1})、L2(${w2})、L3(${w3}) 权重几乎拉平，导航总高涨到 ${chromePx}px（${chromePct}%），视线无从主次分流。`,
      fix: "把「视觉权重」切到「主次递减」，让 L2 最醒目、L3 退半阶、L1 保持轻巧辅助。",
      action: { key: "weightMode", value: "stepped", label: "拉出权重阶梯" },
    });
  } else if (state.weightMode === "inverted") {
    faults.push({
      code: "weight-inverted",
      layer: "L1 / L2",
      short: "喧宾夺主",
      headline: "辅助面包屑做得比主导航还高还亮，次要路径压过全局主干",
      why: `L1 路径条本该是轻量的辅助定位线，现在却占到 ${h1}px 高且视觉权重高于 L2 主导航（${w1} > ${w2}），把真正承重的全局导航压成了配角。`,
      fix: "把「视觉权重」切回「主次递减」，把最高视觉权重还给 L2 全局主导航。",
      action: { key: "weightMode", value: "stepped", label: "归正主次权重" },
    });
  } else if (!chromeOk && prof.zone !== "deep") {
    faults.push({
      code: "chrome-heavy",
      layer: "视口",
      short: `导航占 ${chromePct}%`,
      headline: `导航区累计占去首屏 ${chromePct}%，略超 36% 经验参考线`,
      why: `导航总高 ${chromePx}px 让正文可用高度降到 ${contentPct}%，在笔记本短屏下容易把首段挤出首屏。`,
      fix: "向左微调 L4 切面画布收紧行高，或改用两层轻量方案。",
      action: { key: "depthSpan", value: 0.56, label: "收紧行高" },
    });
  }

  // 5. Steve Krug 后备箱测试 6 项逐条单真源核验
  const trunkChecks = [
    { id: "site", q: "这是什么网站？", ok: true, note: `${site.brand} · 站点标识清晰` },
    { id: "page", q: "我现在看的是哪一页？", ok: true, note: `${l5Node.code} ${l5Node.title}` },
    { id: "major", q: "全站有哪些主分区？", ok: prof.zone !== "flat" && orderOk, note: prof.zone === "flat" ? "16项挤成一团" : orderOk ? "L2 四大区清楚" : "L2 被下层压住" },
    { id: "local", q: "本层还有哪些同级选项？", ok: prof.zone !== "flat" && orientOk, note: prof.zone === "flat" ? "缺少局部归组" : orientOk ? "L3/L5 同级明确" : "看不清谁是当前项" },
    { id: "here", q: "我在整体结构中的哪一层？", ok: pathOk && orientOk, note: pathOk && orientOk ? "路径与高亮一致" : !pathOk ? "路径缺失或脱节" : "缺少高亮定锚" },
    { id: "back", q: "怎么一步退回上级或换区？", ok: pathOk && orderOk && chromeOk, note: !pathOk ? "缺可点结构路径" : !chromeOk ? "导航过厚遮挡视野" : "逐级可回溯" },
  ];
  const trunkScore = trunkChecks.filter((c) => c.ok).length;

  // 6. 总结论（支持多组合法解！）
  const allOk = passedCount === 4;
  let solutionName = "";
  if (allOk) {
    solutionName =
      prof.zone === "light"
        ? "轻量两层解成立"
        : prof.navTierCount === 4
        ? "紧凑四层专业解成立"
        : "原海报经典三层解成立";
  }

  const primaryFault = faults[0] || null;
  const verdict = allOk
    ? `4/4 · ${solutionName}`
    : `${passedCount}/4 · ${primaryFault ? primaryFault.short : "待校准"}`;

  const headline = allOk
    ? `${solutionName}：导航仅占 ${chromePct}%，后备箱测试 ${trunkScore}/6 全过`
    : primaryFault.headline;

  const why = allOk
    ? prof.zone === "light"
      ? `你用 L1 路径 + L2 全局 + L5 分区的轻量双层解收束了结构，正文留下 ${contentPct}% 充裕视野——适合中等体量或移动端优先的站点。同样也可以把 L4 画布右拖到三层带体验原海报经典解。`
      : `L1 路径轻、L2 主导重、L3 次导收敛、L5 贴近正文，层序自上而下且每层唯一亮标，把 ${contentPct}% 的视口干净交还给「${l5Node.code} ${l5Node.title}」。`
    : primaryFault.why;

  const nextHint = allOk
    ? "试试直接点击 L1 面包屑、L2/L3 导航或打开「后备箱空降测验」，感受清晰级联下的零迷航浏览。"
    : primaryFault.fix;

  // 7. 底部五步动线链状态（与原海报底部 5 关键词严格对应）
  const flowSteps = [
    { zh: "全局视野", en: "GLOBAL", ok: orderOk && prof.zone !== "flat" },
    { zh: "路径引导", en: "PATH", ok: pathOk },
    { zh: "当前位置", en: "ORIENTATION", ok: orientOk },
    { zh: "聚焦内容", en: "FOCUS", ok: weightOk },
    { zh: "达成目标", en: "GOAL", ok: allOk },
  ];

  // 8. 左侧 L1–L6 轨道实时签
  const railStatus = {
    L1: !crumbVisible ? { text: "缺失", bad: true } : state.crumbMode === "history" ? { text: "脱节", bad: true } : state.weightMode === "inverted" ? { text: "过重", bad: true } : { text: "同步", bad: false },
    L2: prof.zone === "flat" ? { text: "塞爆", bad: true } : !orderOk ? { text: "错序", bad: true } : !orientOk ? { text: "失标", bad: true } : state.weightMode !== "stepped" ? { text: "失衡", bad: true } : { text: "稳态", bad: false },
    L3: !prof.showL3 ? { text: "收起", bad: false } : !orderOk ? { text: "错序", bad: true } : !orientOk ? { text: "失标", bad: true } : state.weightMode === "flat" ? { text: "同重", bad: true } : { text: "稳态", bad: false },
    L4: allOk ? { text: "聚焦", bad: false } : { text: `${passedCount}/4`, bad: true },
    L5: !prof.showL5 ? { text: "缺失", bad: true } : state.order === "inverted" ? { text: "倒置", bad: true } : !orientOk ? { text: "失标", bad: true } : { text: "贴身", bad: false },
    L6: chromeOk ? { text: `正文${contentPct}%`, bad: false } : { text: `剩${contentPct}%`, bad: true },
  };

  return {
    site,
    l2Node,
    l3Node,
    l5Node,
    prof,
    layers,
    crumbs,
    chromePx,
    chromePct,
    contentPct,
    activeBarCount,
    passedCount,
    allOk,
    pillars: {
      level: { ok: levelOk, tag: levelOk ? `${prof.navTierCount}层有序` : !orderOk ? "层序倒置" : prof.zone === "flat" ? "单栏16项" : `${prof.navTierCount}层压屏` },
      path: { ok: pathOk, tag: pathOk ? "结构同步" : state.crumbMode === "history" ? "历史脱节" : !orderOk ? "层序断裂" : "路径缺失" },
      orient: { ok: orientOk, tag: orientOk ? "单点定锚" : state.orientMode === "double" ? "双项抢亮" : "无高亮标" },
      weight: { ok: weightOk, tag: weightOk ? `占屏${chromePct}%` : state.weightMode === "flat" ? "层层同重" : state.weightMode === "inverted" ? "路径喧宾" : `压屏${chromePct}%` },
    },
    faults,
    primaryFault,
    verdict,
    headline,
    why,
    nextHint,
    trunkChecks,
    trunkScore,
    flowSteps,
    railStatus,
    weights: { w1, w2, w3, w5 },
    heights: { h1, h2, h3, h5 },
  };
}

// ---------- 正文各节单真源模型数据 ----------

// 01 节：64 节点宽深推演（呼应 Kiger 1984 的 64 终端实验）
export const TREE_CONFIGS = [
  {
    depth: 1,
    shape: [64],
    formula: "1 层 × 64 项",
    clicks: 1,
    perScreen: 64,
    chromePct: 24,
    scent: "极低（示意）",
    tier: "过宽过平",
    tone: "bad",
    desc: "全部 64 个页面裸奔在一屏里：只需 1 次点击，但眼睛必须在无分组长墙里逐项硬找，工作记忆迅速疲劳。",
  },
  {
    depth: 2,
    shape: [8, 8],
    formula: "2 层（8 × 8）",
    clicks: 2,
    perScreen: 8,
    chromePct: 21,
    scent: "高（示意）",
    tier: "高效甜点",
    tone: "good",
    desc: "Kiger (1984) 实验中表现最稳健的宽浅结构之一：只需 2 步直达目标，每层 8 项在扫描范围之内且几乎不迷路。",
  },
  {
    depth: 3,
    shape: [4, 4, 4],
    formula: "3 层（4 × 4 × 4）",
    clicks: 3,
    perScreen: 4,
    chromePct: 28,
    scent: "高（示意）",
    tier: "原海报平衡解",
    tone: "good",
    desc: "正好对应 290 原海报的 4 主导航 × 4 次导航 × 4 分区：每层只看 4 项毫无压迫感，配合 L1 面包屑即可轻松定向。",
  },
  {
    depth: 4,
    shape: [4, 2, 2, 4],
    formula: "4 层（4 × 2 × 2 × 4）",
    clicks: 4,
    perScreen: 3,
    chromePct: 37,
    scent: "中等（示意）",
    tier: "临界偏深",
    tone: "warn",
    desc: "中间两层被迫拆成二选一，多点一次才看到具体主题；若四个导航条同时常驻，桌面短屏的正文高度开始吃紧。",
  },
  {
    depth: 6,
    shape: [2, 2, 2, 2, 2, 2],
    formula: "6 层（每层 2 分支）",
    clicks: 6,
    perScreen: 2,
    chromePct: 54,
    scent: "低（示意）",
    tier: "过深迷航",
    tone: "bad",
    desc: "Kiger (1984) 中耗时最长、错误率最高、用户最反感的 6 层深树：每次只能猜二选一，走错一步就要反复折返。",
  },
];

// 02 节：四层视觉权重调音方案
export const WEIGHT_SCHEMES = {
  stepped: {
    id: "stepped",
    label: "主次递减（推荐）",
    summary: "L2 全局最醒目，L3 次导航降噪，L5 用耳签贴身绑定 L6，L1 面包屑细字克制。",
    totalPx: 174,
    bars: [
      { id: "L1", name: "路径层", role: "辅助回溯", h: 34, bg: "#0B3D25", fg: "#D8E4D7", contrast: "9.8:1", weightRank: "轻 · 辅助" },
      { id: "L2", name: "主导航层", role: "全局锚点", h: 52, bg: "#E85D38", fg: "#1B150A", contrast: "5.2:1", weightRank: "重 · 主导" },
      { id: "L3", name: "次导航层", role: "域内同级", h: 42, bg: "#EDE4D2", fg: "#1B1914", contrast: "13.1:1", weightRank: "中 · 收敛" },
      { id: "L5", name: "分区导航", role: "局部详情", h: 46, bg: "#D6CFB4", fg: "#0D3B2B", contrast: "8.4:1", weightRank: "贴近正文" },
    ],
  },
  equal: {
    id: "equal",
    label: "四栏等重打架",
    summary: "每层都给满 56px 粗条和高饱和实底，四层同时喊话，眼睛找不到主入口且吃掉 31% 屏高。",
    totalPx: 224,
    bars: [
      { id: "L1", name: "路径层", role: "喧宾抢戏", h: 56, bg: "#E85D38", fg: "#1B150A", contrast: "5.2:1", weightRank: "过重" },
      { id: "L2", name: "主导航层", role: "被淹没", h: 56, bg: "#0B3D25", fg: "#F4ECE0", contrast: "11.5:1", weightRank: "同重" },
      { id: "L3", name: "次导航层", role: "过度抢眼", h: 56, bg: "#AD2D11", fg: "#FFFDF8", contrast: "6.4:1", weightRank: "同重" },
      { id: "L5", name: "分区导航", role: "像第二顶栏", h: 56, bg: "#2B2010", fg: "#F4ECE0", contrast: "13.4:1", weightRank: "过重" },
    ],
  },
  whisper: {
    id: "whisper",
    label: "全线弱对比失焦",
    summary: "所有导航退成极浅同色灰线，虽然不占色块，但激活项与普通项难分彼此，扫读成本飙升。",
    totalPx: 168,
    bars: [
      { id: "L1", name: "路径层", role: "辨识偏弱", h: 42, bg: "#EFE7D8", fg: "#6A6356", contrast: "4.6:1", weightRank: "过平" },
      { id: "L2", name: "主导航层", role: "缺主锚", h: 42, bg: "#EFE7D8", fg: "#5C564A", contrast: "5.5:1", weightRank: "过弱" },
      { id: "L3", name: "次导航层", role: "与 L2 混同", h: 42, bg: "#EFE7D8", fg: "#5C564A", contrast: "5.5:1", weightRank: "无区分" },
      { id: "L5", name: "分区导航", role: "脱节悬浮", h: 42, bg: "#EFE7D8", fg: "#5C564A", contrast: "5.5:1", weightRank: "无归属" },
    ],
  },
};

// 03 节：核实过的五代演进节点
export const ERAS = [
  {
    year: "19 世纪末",
    title: "竖立档案夹与索引耳签",
    who: "实体办公归档体系",
    insight: "马尼拉纸档案夹把错开的耳签露在文件夹上方，让人不必抽开抽屉就能扫清全局分类——这正是 290 原海报切角叠层与 L5 耳签的物理源头。",
    htmlTag: "物理隐喻：错位标签页 + 抽屉层级",
    rule: "空间位置本身承担索引功能：被拉起的那一页自然和下方文件连成一体。",
  },
  {
    year: "1981–1984",
    title: "菜单宽深权衡实验",
    who: "D. P. Miller (1981) · John I. Kiger (1984)",
    insight: "在早期层级菜单人机实验中，Kiger 用 64 个终端项对比 2⁶ 深树与 8×8、4×16 宽浅树，证实过深层级会显著拉长检索时间并抬高迷航错误率。",
    htmlTag: "实证结论：宁可适度宽浅，切忌无休止钻洞",
    rule: "每多一层菜单都会累加一次跳转判断与短时记忆损耗。",
  },
  {
    year: "1998",
    title: "信息架构与中等宽深定型",
    who: "Rosenfeld & Morville（O'Reilly）· Larson & Czerwinski（CHI '98）",
    insight: "「北极熊书」首次系统划分全局导航、局部导航与上下文导航；同年微软研究院 CHI '98 论文证实，在网页场景中「中等宽深 + 强语义线索」胜过极端宽平或极端深层。",
    htmlTag: "<nav aria-label=\"主导航\"> + <nav aria-label=\"次导航\">",
    rule: "网页不同于纯按键菜单，中等分层既减轻单屏扫描，又不至于深陷迷宫。",
  },
  {
    year: "1999–2000",
    title: "信息气味与后备箱测试",
    who: "Pirolli & Card（1999）· Steve Krug（2000）",
    insight: "Pirolli 与 Card 提出信息觅食理论，解释人眼靠标签「气味」预判下层价值；Steve Krug 在《点石成金》提出「后备箱测试」，要求任意深层页都能瞬间答清 6 个定位问题。",
    htmlTag: "aria-current=\"page\" + 清晰可见的当前项反差",
    rule: "把用户蒙眼空降到任何子页，导航必须一眼说出「这是哪站、我在哪层、怎么退回」。",
  },
  {
    year: "现代 Web 标准",
    title: "位置型路径与无障碍地标",
    who: "W3C WAI-ARIA APG · Nielsen Norman Group",
    insight: "NN/g 反复证实面包屑应表达站点固定层级而非历史点击流；W3C APG 规定用独立 nav 地标包裹有序列表 ol，用 CSS 绘制分隔符，并在当前项标注 aria-current=\"page\"。",
    htmlTag: "<nav aria-label=\"Breadcrumb\"><ol>…<li aria-current=\"page\">",
    rule: "视觉层次与语义树完全一致时，屏幕阅读器、键盘与鼠标读者拿到的是同一份地图。",
  },
];

// 04 节：跨端折叠对比数据
export const VIEWPORT_MODES = {
  desktop: {
    id: "desktop",
    label: "桌面 1440px",
    w: 1440,
    h: 720,
    bad: {
      chromePx: 268,
      bars: ["公告横幅 44px（吸顶）", "L1 路径条 52px（吸顶）", "L2 主导航 60px（吸顶）", "L3 次导航 56px（吸顶）", "L5 分区签 56px（吸顶）"],
      note: "五条栏全部固定吸顶，滚动时吃掉 37% 画面，正文变成狭窄的邮票缝。",
    },
    good: {
      chromePx: 148,
      bars: ["L1 细字路径 32px（随页滚走）", "L2 主导航 50px（仅此层轻吸顶）", "L3 次导航 40px（随页滚走）", "L5 贴身耳签（挂在 L6 顶沿）"],
      note: "首屏导航只占 21%，开始阅读后只留必要定位条，正文舒展通透。",
    },
  },
  tablet: {
    id: "tablet",
    label: "平板 768px",
    w: 768,
    h: 900,
    bad: {
      chromePx: 292,
      bars: ["L1 路径折成两行 64px", "L2 主导航 8 项折行 96px", "L3 次导航挤爆换行 76px", "L5 分区拥挤 56px"],
      note: "直接把桌面宽度硬缩到 768px，导航文字折成两三行，视觉秩序全散。",
    },
    good: {
      chromePx: 154,
      bars: ["L1 单行路径（折叠中段）34px", "L2 主导航紧凑 4 项 48px", "L3 次导航单行 40px", "L5 局部耳签 42px（非吸顶）"],
      note: "中屏精简间距并折叠超长路径中段，三层继续清晰可辨且不换行。",
    },
  },
  mobile: {
    id: "mobile",
    label: "手机 390px",
    w: 390,
    h: 660,
    bad: {
      chromePx: 288,
      bars: ["L1 长面包屑折三行 74px", "L2 横滚条 1（54px）", "L3 横滚条 2（54px）", "L5 横滚条 3（54px）", "悬浮工具条（52px）"],
      note: "手机首屏叠了三条横滚导航栏，占去 44% 屏高，手指上下滑动还老误触横滚。",
    },
    good: {
      chromePx: 126,
      bars: ["顶栏：站标 + 菜单抽屉（收 L2/L3）48px", "单步返回：‹ 结构原理 34px", "当前分区耳签（单行 4 签）44px"],
      note: "窄屏果断降维：L2/L3 进菜单抽屉，画面只留「回上级」与「当前分区」，正文占回 81%。",
    },
  },
};

// 05 节：六张产品场景诊断卡
export const SCENARIOS = [
  {
    id: "lms",
    title: "多学科在线课程平台",
    meta: "4 学科 × 5 模块 × 6 课时（120 页）",
    verdict: "强烈推荐",
    tone: "good",
    reason: "学习者既需要全局课程大纲，又需要明确当前学到第几章第几节，典型 3 层导航 + 位置面包屑的最佳舞台。",
    alt: null,
  },
  {
    id: "apidocs",
    title: "大型技术文档中心",
    meta: "380 篇指南、规范与接口参考",
    verdict: "强烈推荐",
    tone: "good",
    reason: "读者多半从搜索引擎空降深层文档，L1 路径 + L2 大域 + L3 专题 + L5 细节签能瞬间通过后备箱测试。",
    alt: null,
  },
  {
    id: "launch",
    title: "新品发布营销单页",
    meta: "1 页长叙事 + 1 个预约转化按钮",
    verdict: "不要用分层导航",
    tone: "bad",
    reason: "单页叙事要的是第一眼聚光与单一行动路径，多叠两层导航条只会切碎主视觉并把读者引离转化按钮。",
    alt: { num: "289", name: "Hero 主视觉布局" },
  },
  {
    id: "checkout",
    title: "五步医保在线申报",
    meta: "强依赖前后校验的线性填报流程",
    verdict: "不要用分层导航",
    tone: "bad",
    reason: "自由跳层的全局与次级导航会让填表人半路跳走丢数据，线性任务应收敛成明确的进度步骤条。",
    alt: { num: "285", name: "分步表单" },
  },
  {
    id: "portfolio",
    title: "6 页个人摄影作品集",
    meta: "首页、3 个系列、关于、联系",
    verdict: "不必硬拆多层",
    tone: "warn",
    reason: "总共不到 10 个页面时，硬造 L1/L2/L3/L5 只是为了分层而分层，一条清爽的单层导航就已足够。",
    alt: { num: "275", name: "画廊布局" },
  },
  {
    id: "ide",
    title: "8 层深度的代码目录浏览",
    meta: "数千文件、动态深度不齐的工程树",
    verdict: "改用树形浏览",
    tone: "bad",
    reason: "横向分层导航在超过 4 层后会迅速压扁视口；面对极深且各分支深度不一的文件目录，纵向可折叠树更合适。",
    alt: { num: "280", name: "树形浏览布局" },
  },
];

// 06 节：小练习（纯中性选项标签 A/B/C/D，仅差单变量）
export const QUIZ = {
  prompt:
    "某设计课程网站有 4 大模块 × 4 个专题 × 4 节小课（共 64 节），学习者经常从搜索引擎直接点进深层页面「03 布局策略」。下面四套画面同样整洁的导航方案，哪一套最能兼顾定位清晰与正文空间？",
  options: [
    {
      id: "A",
      label: "方案 A · 顶栏单层展开",
      spec: "1 层主栏（12 项并排） · 无次导航 · 无路径",
      correct: false,
      feedback:
        "虽然留给正文的面积很大，但把 12 个专题平铺进单条顶栏既容易在中屏折行，又让空降到「03 布局策略」的读者看不出它隶属于哪个模块、周围还有哪几节同级课。",
    },
    {
      id: "B",
      label: "方案 B · 三层递减级联",
      spec: "L1 轻字位置路径 + L2 单亮主栏 + L3 细线下划 + L5 局部签（导航占 28%）",
      correct: true,
      feedback:
        "答对了。它同时满足四条底线：层序由全局到局部自上而下、L1 实时同步结构位置、每一层唯一高亮当前落点、视觉权重由 L2 向 L3/L1 递减，且把超过七成的视口干净留给了正文。",
    },
    {
      id: "C",
      label: "方案 C · 三层等重高亮",
      spec: "L1 粗橙路径 + L2/L3/L5 等高深底（导航占 49%）",
      correct: false,
      feedback:
        "层级结构虽然完整，但四条导航条高度相同、全部高饱和抢眼，不仅让辅助面包屑喧宾夺主，还一口气吃掉近半个首屏，正文被压到视口下半截。",
    },
    {
      id: "D",
      label: "方案 D · 历史轨迹模式",
      spec: "L1 显示刚点过的历史顺序 + L2 无当前项高亮（导航占 27%）",
      correct: false,
      feedback:
        "行高和权重阶梯看起来很克制，但 L1 记的是点击历史（例如首页 > 练习巩固 > 布局策略）而非真实归属，加上 L2 丢失高亮，空降读者依旧通不过后备箱定位测试。",
    },
  ],
};
