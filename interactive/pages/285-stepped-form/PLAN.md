# 285 分步表单 STEPPED FORM — 设计与实现方案

## 1. 一句话道理
人类工作记忆一次只能稳稳处理少数几个信息块（George Miller，1956）；分步表单把一长串跨主题的复杂填报按自然语义切分成 3–5 个明确阶段，配合可见进度、单步校验与草稿退路，把「一眼望不到头的表单墙」转成「每步只做一件事」的可控路径——但它只负责降低单屏认知负荷，若不删减冗余字段，硬拆步数同样救不了完成率。

## 2. 开场玩具：活体分步切分与试跑工作台
- **怎么玩**：
  - 顶部的通栏步骤轨内嵌 **2D Canvas「任务切分与认知负荷轨」（`data-perf-drag`）**：横排展示当前流程全部 12 个有序字段（按语义域分色），字段之间插有**可左右直拖的分步切分闸门**，上方实时画出各步认知负荷波形。横向拖拽闸门即可连续重划步骤边界，也可点击字段间隙增删切点，或在「原海报·账户注册 / 跨境电商结账 / 云服务企业入驻」三套真实流程间切换。
  - 下方右侧是**1:1 承袭 285 原海报的活体分步表单**（真实 `<input>`、单选、下拉、字数统计文本框与「上一步 / 下一步 / 提交」按钮），字段分组、右上「第 X 步，共 N 步」小进度条、顶轨里程碑与底部自动保存提示条全随切分闸门和四项流程规则实时联动；用户可以真的填字、翻步、点顶轨已完成节点回跳，亲测草稿是自动留存还是被回退清空。
- **开场初始态（0/4 失序错态，绝非答案）**：
  - 12 个字段仅在正中央被硬劈成 2 步（切点 `[6]`，恰好在画布中心 50% 处，直接横拖即可上手），把「个人信息」4 项活生生劈成两半，且每步塞满 6 项混杂字段；
  - 进度条设为「隐身盲走」（隐藏总步数与后续步骤名）；
  - 校验设为「末尾总算账」（前步放行无提示，最后一步才统一报前面出错）；
  - 退路设为「禁返回 · 丢草稿」（隐藏上一步、切换清空输入、关闭自动保存）。
- **怎样算玩错，错了读数怎么说**：
  - 由 `model.js` 单真源实时判定 **11 类错态**：1 步长墙（12 项全挤一屏）、碎片过切（≥7 步点击疲劳）、跨主题硬劈（同语义域被闸门拆断）、单步超载（单步 ≥6 项）、轻重悬殊（含孤步且最重步 ≥3× 最轻步）、隐身盲走、虚标百分比（进度条跳变且不告知下一步材料）、末尾总算账、未输先报红（选填被锁成必填）、禁返回丢草稿、单向锁死禁回改。
  - 左侧暖桃诊单实时用白话点明当前首要症结、用户会在哪一步放弃（为什么），以及「试着改一步」的具体引导；同时接受多组合法解（原海报 4 步经典解 `[3,7,10]`、3 步精简合并解 `[3,7]`、5 步轻量拆分解 `[3,5,7,10]` 等）。
- **和最近 12 页的明显区别**：
  - 紧邻的 284 是「单页表单字段对齐 + 眼动扫视红线探针」，283 是「深炭灰图形画布工具栏配比」，242/241 是「容器/视口断点分拣」，201/200/070/117/033/322/156/116 均属网格、透视、构图与分栏；285 首次围绕「任务沿时间轴切分 + 活体多步流转试跑」构建玩具，其他任何编号都无法套用。

## 3. 版式骨架
- **忠实转译 285 原海报结构（零深色顶眉、零通用深色仪表盘卡、不锁 `100svh`）**：
  - 开放暖桃粉纸面刊头（左：随当前步数移动活跃橙标的自示范大标「分步表单」+ `STEPPED FORM` + 深梅紫左杠总述；右：原海报招牌柔桃大圆 + 深梅紫小圆 + 同心细弧 + 4×3 珊瑚点阵）→
  - 通栏纯白大圆角「步骤里程碑 + 2D 任务切分轨」主卡 →
  - 不对称双卡主舞台：左 31% 暖桃色卡片（靶心图标 + 「为什么分步？」三项实况胶囊 + 白话单真源诊单 + 4 项实时读数）× 右 69% 纯白活体分步表单与四维流程控槽 →
  - 正文八节在暖白纸、柔桃粉纸、03 节深梅紫暗室、浅暖纸、暖桃砂纸与暖粉原纸间交替推进，01 节内置原海报五栏「分步表单设计要点」白卡与深梅紫「核心原则」通栏色带。
- **多屏适配**：
  - `1440×900`：主容器宽 `1360px`（`2560×1440` 舒展至 `1720px`），开放刊头压紧至 ~104px，首屏直接完整呈现通栏步骤切分轨与 30:70 活体表单主体。
  - `1024×1366` / `768×1024`：不锁高度，自然流排——通栏切分轨下接全宽活体表单，再接双栏并排的暖桃「为什么分步？」与实时诊单，绝无大块空白。
  - `390×844`：刊头压成紧凑一行标题 + 状态徽章，让等比步骤切分轨（`data-perf-drag`）与活体当前步表单合计稳占首屏 ≥52% 屏高，并在同屏可见诊单首句。
  - `844×390`：横屏切左 58% 步骤切分轨与当前步表单 × 右 42% 刊头、实时诊单与快控并行。

## 4. 配色和字体
- **逐像素采自 285 原海报**：
  - 暖桃粉原纸 `#FEF3F0` / 洁亮暖白 `#FFFCFA` / 纯白表单卡 `#FEFEFC` / 柔桃侧卡 `#FFF0E7` / 暖桃砂纸 `#F9EBE3`
  - 深梅紫主墨 `#340426` / 深梅紫原海报色带与已完成态 `#5E1949` & `#611A45` / 次墨 `#4D2A3F` / 辅墨 `#7A5468` / 03 节深梅紫暗室 `#2B0820`（暗舱 `#3E1030`）
  - 标志珊瑚橘 `#F47341`（图标/进度填色/焦点高亮）/ 高对比深珊瑚橘字 `#C44518`（浅底 ≥4.48:1）/ 实底按钮橘 `#D44E20`（配白字 ≥4.2:1）/ 暗底亮杏橘 `#FF9A70`（≥8.4:1）
  - 装饰桃粉圆 `#FDC5B6` & 4×3 点阵 `#F7BCAE`；克制以深森绿 `#1A6E4E`（暗 `#7CE3B8`）标通过，深朱赤 `#B4232C`（暗 `#FF8B8B`）标错态。
- **字体搭配**：`Noto Sans SC` + **`Bricolage Grotesque`** + **`Sora`** + **`Instrument Serif`**（正斜体）。
  - 三款西文字体（`Bricolage Grotesque`、`Sora`、`Instrument Serif`）在最近 12 页全部 **0 次使用**，与紧邻 284（`Manrope + Chivo + DM Mono`）及 283 零西文重合，全库无重复搭配。

## 5. 节目录（8 节，h2 均 ≤ 12 字，相邻节不复用同一种控件）
- **01 为什么分步有效**（`Why chunking works`）：呈现原海报 5 栏设计要点与深梅紫核心原则条，用「说多了一点」温和修正「分步必然提升完成率」的夸大说法（引 Baymard 研究）；交互：**三态视图对比卡片**（12 项单页长墙 / 4 步逻辑拆解 / 删冗 8 项 3 步），观察首屏密度与工作记忆负荷（示意）。
- **02 进度条怎么选**（`Progress indicator patterns`）：横向步骤轨、左侧目录轨、紧凑步数标、手风琴展开四种结构对照；交互：**视口缩窄滑轨（320px–1080px）**实时压窄容器，验证不同进度条在窄屏下的折行与清晰度。
- **03 条件分支与跳步**（`Branching & dynamic paths`）：深梅紫暗室；揭示分步表单相对单页表单（[284](https://layout.xiaoxiaodong.ai/284/play/)）的核心结构优势——按前步答案动态跳过无关步骤；交互：**2D Canvas 活体条件分支路径图**（切换个人/企业、发票、实名三个开关，实时点亮路径并统计省去步数与字段数）。
- **04 退路、校验与草稿**（`Validation, back & drafts`）：解析单步校验、返回保数据、已完成节点可回跳、自动保存与末步复核页；交互：**四场事故翻牌复盘卡**（在「翻车现场」与「修复状态机」间逐案切换对照）。
- **05 它从哪来**（`Where stepped forms came from`）：核实过的演进年表（1956 Miller → 1991 Microsoft Publisher PageWizards → 2006 Nielsen 渐进披露 & Kivetz 等目标梯度 → 2008 Wroblewski / Jarrett → GOV.UK One thing per page 与 Baymard 实证）。静态精排年表，不叠多余控件。
- **06 何时用，何时别用**（`When to use and avoid`）：双栏等高适用/反例对照（短表单用 [284](https://layout.xiaoxiaodong.ai/284/play/)、高频专家配置用 [287](https://layout.xiaoxiaodong.ai/287/play/) 与 [290](https://layout.xiaoxiaodong.ai/290/play/)、对话式填报看 [281](https://layout.xiaoxiaodong.ai/281/play/)、历程记录看 [277](https://layout.xiaoxiaodong.ai/277/play/)）；交互：**四题决策速诊矩阵**，按字段数、分支、频次、异步校验即时给出选型结论。
- **07 练一练：哪种拆法最稳？**（`Practice · pick the best flow`）：四选一练习（中性标签 A/B/C/D），提交后展开各选项的语义域色带揭晓原因。
- **08 原海报**（`The original poster`）：可点击放大/拖拽/Esc 关闭的原海报图与原海报 5 个关键词徽章。

## 6. 核实来源
1. George A. Miller (1956), *"The Magical Number Seven, Plus or Minus Two: Some Limits on our Capacity for Processing Information"*, *Psychological Review*, 63(2), 81–97 — https://doi.org/10.1037/h0043158
2. Microsoft Publisher 1.0 *PageWizards* (Sept 1991) — https://en.wikipedia.org/wiki/Wizard_(software)
3. Jakob Nielsen (Dec 2006), *"Progressive Disclosure"*, Nielsen Norman Group — https://www.nngroup.com/articles/progressive-disclosure/
4. Ran Kivetz, Oleg Urminsky & Yuhuang Zheng (2006), *"The Goal-Gradient Hypothesis Resurrected"*, *Journal of Marketing Research*, 43(1), 39–58 — https://doi.org/10.1509/jmkr.43.1.39
5. Luke Wroblewski (May 2008), *Web Form Design: Filling in the Blanks*, Rosenfeld Media — https://rosenfeldmedia.com/books/web-form-design/
6. Caroline Jarrett & Gerry Gaffney (2008), *Forms that Work: Designing Web Forms for Usability*, Morgan Kaufmann — https://www.formsthatwork.com/
7. Raluca Budiu, *"Wizards: Definition and Design Recommendations"*, Nielsen Norman Group — https://www.nngroup.com/articles/wizards/
8. GOV.UK Service Manual, *"Structuring forms — Start with one thing per page"* — https://www.gov.uk/service-manual/design/structuring-forms
9. Baymard Institute, *"One-Page Checkouts – The Holy Grail of Checkout Usability?"* — https://baymard.com/blog/one-page-checkout

## 7. 练习设计
- **题目**：线上医院预约挂号共有 10 个固定字段（3 项挂号排班：科室·日期·时段；4 项就诊人资料：姓名·证件·手机·医保；3 项确认结算：症状简述·费用明细·确认支付）。四套方案视觉样式、按钮、自动保存与校验机制完全相同，**唯一变量是步骤切分边界**。哪一套最稳妥？
- **四个选项（标签全中性，仅差切分边界一个变量）**：
  - **A**：3 步切分 `3 / 4 / 3`（排班 3 ｜ 就诊人 4 ｜ 结算 3）——**正确答案**：零跨主题硬劈，每步负荷均匀落在 3–4 项舒适区，且费用与确认集中在末步核对。
  - **B**：3 步切分 `5 / 3 / 2`（排班+姓名证件 ｜ 手机医保+症状 ｜ 费用确认）——把「就诊人资料」拆成两半并和排班混装。
  - **C**：3 步切分 `1 / 7 / 2`（仅科室 ｜ 日期时段+就诊人+症状 7 项 ｜ 费用确认）——第 1 步过虚、第 2 步严重超载且横跨三个主题。
  - **D**：5 步切分 `2 / 2 / 2 / 2 / 2`（机械按每页 2 项均分）——把「日期与时段」「姓名与证件」「医保与症状」全部生硬拆散，翻页过多且破坏语义连贯。
