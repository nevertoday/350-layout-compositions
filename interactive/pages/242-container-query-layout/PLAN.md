# 242 容器查询布局（CONTAINER QUERY LAYOUT）设计方案

## 1. 一句话道理
响应式媒体查询（`@media`）只能问“整块浏览器屏幕有多宽”，可现代界面里**同一个组件常常同时出现在窄侧栏、中等分栏和宽主区**；容器查询（`@container`）把判断基准从全局视口下放给组件所在的祖先容器，让组件真正按自己拿到的局部空间自主重排，放进哪儿都能活。

## 2. 开场玩具：同屏三槽组件自治实验室
- **怎么玩**：忠实化用 242 原海报“深靛紫底上垂直阶梯排开的小/中/大三座翠绿框容器 + 暖米组件卡”：锁定全局视口为 `1280px`（也可切 `900px` / `390px` 验真），三座容器装着**同一份组件代码**（可切换「原海报组件卡 / 电商商品卡 / 数据摘要卡」三套真实 UI 题材）。用户在 2D 画布上**直接横向拖动任意容器右侧翠绿调宽墙**（画布标 `data-perf-drag`，支持鼠标、触屏横向拖拽与方向键微调），观察单个容器变宽或变窄时组件如何只做局部响应而不波及邻槽；下方四组工程控件可调：查询依据（`@media` 视口 / `@container` 容器）、容器声明（未声明 / `size` 双轴未定高 / `inline-size`）、自治方式（槽位补丁 `.sidebar` / 纯组件自治 `cqi` / 视口字号 `vw`）、组件自身两道门槛 `M` 与 `L`。
- **一打开是什么状态（0/4 错配翻车态，绝不先给答案）**：
  - 查询依据错锁 `@media` 视口、父容器未声明 `container-type`、采用 `.sidebar` 槽位补丁与过早的门槛 `M 220px / L 310px`。
  - 画面当场翻车：虽然视口高达 `1280px`，但 `260px` 小容器被 `@media` 硬塞进大容器展开态，文案被压成细窄竖条、三枚指标碰撞溢出、红斑报警；如果只把规则改成 `@container` 却不设 `container-type: inline-size`，三槽又全部失配回退；如果误选 `container-type: size` 且未定高，三座容器直接塌成 `0px` 细缝！
- **怎样算玩错、错了读数怎么说**：由 `model.js` 按实绘槽宽、当前题材的真实最小图文/指标宽单真源实算 8 类失误——① `@media` 视口误判、② 漏写 `container-type` 查询静默失效、③ `container-type: size` 未定高致高度塌陷 0px、④ `.sidebar` 槽位硬编码补丁拖宽也不变、⑤ `vw` 视口字号致窄槽标题爆大、⑥ 门槛 `M ≥ L` 吞并平衡态、⑦ 早切挤碎（`M/L` 小于当前题材真实几何下限致内容拥挤碰撞）、⑧ 晚切空旷（宽槽仍锁死窄版浪费留白）。每种错态都在画布就地标红并在暖米诊单里说清“为什么这样摆会出事”和下一步怎么修。接受多组合法解（任意满足当前题材几何舒适带的 `M/L` 组合都可通关，如原海报三阶解 `380/560` 或宽松舒展解 `420/620`）。
- **与最近 12 页的明显区别**：
  - 241 是全朱红底 + 三张并排预设模板 + 底部黑示波轨按视口宽度阶梯切档；240 是暖象牙纸三端设备联屏调 `@media` 断点；238 是暖米双侧毫米尺调单个固定容器宽；其余 116/321/069/032/155/199/282/115/031/320 为平面/构图/地图类。
  - 本页 242 是深靛紫底 + 垂直三阶翠绿容器框，**视口锁死不动、只拖动单个容器壁改变局部宽度**，并能真实踩出 `container-type: size` 高度归零塌陷与 `.sidebar` 槽位硬编码失效——这是容器查询独有的物理与工程现象，无法套用到任何其他编号。

## 3. 版式骨架
- **1440×900**：主宽 `1360px`（不锁 `100svh`，绝无空洞）。32px 深靛顶眉下，上段复刻原海报不对称刊头（左：嵌翠绿实时 `inline-size` 标尺括号的自示范大标「容器查询布局」+ `CONTAINER QUERY LAYOUT` + 总述；右：原海报米圆/5×5 点阵/翠绿半圆/姜黄竖条几何徽章 + 题材/预设按钮）→ 原海报三圆支柱实况带（`以容器为准 | 组件自治 | 局部响应`）→ 全宽深靛三槽 2D Canvas 实验台 → 底接左 46% 暖米单真源诊单 × 右 54% 四维工程控槽 → 原海报虚线标语底栏（`4×3 点阵 | 相同组件 · 不同容器宽度 · 自动重排 · 更好体验 | ●■▲`）。
- **2560×1440**：主宽舒展至 `1720px`，画布与栏宽同步放大，不缩中间留白海。
- **1024×1366 / 768×1024**：自然流排，不锁 `100svh`；1024 下诊单与控槽并列，768 下流式叠排。
- **390×844**：压紧单行刊头与状态丸，把总述放到实验台下方；三槽画布切为竖向等比布局（高度约 395px，占首屏 ≥ 46%，圆形与山峰严格等比不压扁），首屏同见快控钮与诊单首句。
- **844×390**：横屏切为左 58% 三槽画布 × 右 42% 刊头、诊单首句与核心开关并行。
- **正文节奏**：7 节在暖米亮纸（`#F6F1E8`）、原海报暖米纸（`#EFE8DE`）、03 节深靛紫暗室（`#180A3F`）、淡薄荷雾纸（`#E7F3EC`）、柔紫米纸（`#EFEBF7`）与 07 节深靛展墙间明暗交替，拒绝“深色仪表盘 + 圆角卡”套壳。

## 4. 配色和字体
- **逐像素采自 242 原海报**：
  - 深靛紫主底与暗室：`#180A3F`（深舱 `#110630`、抬升 `#231257`）
  - 暖米纸与卡面：`#EFE8DE`（亮米纸 `#F6F1E8`、柔砂 `#E6DDD0`、淡薄荷雾 `#E7F3EC`、柔紫米 `#EFEBF7`）
  - 标志翠绿：`#67C89D`（浅纸高对比深翠字 `#116A4B`）
  - 标志姜黄：`#F2BD38`（浅纸高对比深赭字 `#825300`）
  - 深靛主墨：`#190C42`（次墨 `#463B68`），暗底暖米字 `#F2EBE0`（次字 `#C9C0DE`）
  - 错态警示克制使用：暗底珊瑚红 `#FF7E75`、浅底赤红 `#B5232E`。
- **字体搭配**（全库唯一；与 241 的 Syne/Archivo/JetBrains Mono 零西文重合；三款西文在近 12 页全部 0 次使用）：
  - `Noto Sans SC`（正文与厚黑标题，400/500/700/900）
  - `Unbounded`（**近 12 页未用**，模块感宽几何展示西文，600/800）
  - `Manrope`（**近 12 页未用**，现代几何界面西文，500/700）
  - `Space Mono`（**近 12 页未用**，CSS 代码、像素标尺与 `cqi` 读数等宽字，400/700）

## 5. 节目录（7 节，标题均 ≤ 10 字，相邻不重复控件）
- **01 同一张卡，三种宽**（`Same card, three widths`）：展开原海报三大核心原则并温和补充“尺寸查询已进 Baseline 2023，而样式/滚动状态查询仍在各浏览器陆续落地”的边界。交互：**原生 CSS `@container` 实弹搬家台**（点击四个真实页面插槽，把同一张原生 DOM 组件卡瞬间搬进侧栏/双栏/通栏/抽屉并高亮实时命中的 `@container` 规则）。
- **02 为什么等了十二年**（`Where it comes from`）：梳理 2011–2023 从元素查询死循环到单轴尺寸隔离的真实来历。交互：**SVG 布局引擎循环步进器**（点击「单步推演」对比 2013 元素自查无限震荡 vs 2020 `inline-size` 防火墙一步收敛）。
- **03 容器里的尺子：cqi**（`Container query units`）：深靛暗室；讲清 `@container` 管结构切换、`cqi` 管字号与留白连续缩放，以及为什么 `vw` 会害惨侧栏卡片。交互：**连续游标卡尺**（`range` 滑块 + `cqi`/`vw`/`px` 单位切换，同步绘制字号/内边距/图标三条响应曲线与活体排版卡）。
- **04 两个最容易踩的坑**（`Two classic pitfalls`）：实演 `container-type: size` 未定高导致高度归零塌陷，以及 Containment 新建包含块截断 `fixed` 悬浮菜单的问题与解法。交互：**DOM 代码诊所开关组**（切换 `container-type` / `height` 与触发悬浮菜单测试）。
- **05 何时用，何时别用**（`When to use, when not`）：厘清与 [240 响应式](https://layout.xiaoxiaodong.ai/240/play/)、[241 自适应](https://layout.xiaoxiaodong.ai/241/play/)、[226 弹性盒](https://layout.xiaoxiaodong.ai/226/play/)、[227 网格](https://layout.xiaoxiaodong.ai/227/play/)、[228 子网格](https://layout.xiaoxiaodong.ai/228/play/)、[238 固定宽度](https://layout.xiaoxiaodong.ai/238/play/)、[239 流体](https://layout.xiaoxiaodong.ai/239/play/)的分工，并列 4 类禁用场景。交互：**6 张真实界面需求分拣台**（点击卡片立即给出归属策略与最短 CSS）。
- **06 四份写法，哪份对？**（`Practice · pick the setup`）：单变量四选一练习题。交互：**A/B/C/D 视觉与规则卡片选择器**，选后逐项揭示三槽渲染后果与理由。
- **07 原海报**（`The original poster`）：完整展示原海报（点击放大、拖动平移、滚轮缩放、Esc 关闭）及底部标语与几何符号回顾。

## 6. 来源与核实网址
- Andy Hume（2011），*Selector Queries* 概念与早期组件容器响应讨论
- Mat Marquis（2015-06-30），《Container Queries: Once More Unto the Breach》，*A List Apart*：https://alistapart.com/article/container-queries-once-more-unto-the-breach/
- David Baron（2020），*Container Queries Implementability*（提出基于 CSS Containment 切断布局循环）：https://github.com/dbaron/container-queries-implementability
- Miriam Suzanne / OddBird（2021），*CSS Container Queries Explainer & Proposal*：https://css.oddbird.net/rwd/query/explainer/
- W3C，*CSS Containment Module Level 3*（2021-12-21 FPWD）与 *CSS Conditional Rules Module Level 5*：https://www.w3.org/TR/css-contain-3/ 、https://drafts.csswg.org/css-conditional-5/
- MDN Web Docs，*CSS container queries*（核实 Chrome/Edge 105、Safari 16、Firefox 110 达成 Baseline 2023，以及 `cqi` 与 `scroll-state()` 兼容现状）：https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries

## 7. 练习设计
- **题目**：同一张项目进度卡要同时放进 `1280px` 工作台里的 `260px` 侧栏、`460px` 分栏与 `700px` 焦点区；下面 A/B/C/D 四份方案三槽尺寸与卡片内容完全相同，只差「容器查询声明与门槛写法」这一处，哪一份能让三个插槽同时正常？
- **四个中性标签选项（只差容器查询策略这一个变量）**：
  - `A`：用 `@media (min-width: 600px)` 切横排，父级不写 `container-type`（错：1280px 视口让 260px 侧栏也硬切横排，图文挤碎）。
  - `B`：父级设 `container-type: size; height: auto;`，配 `@container (width >= 380px)`（错：双轴隔离未定高，三槽高度集体塌成扁缝）。
  - `C`：父级设 `container-type: inline-size;`，配 `@container (width >= 380px)` 与 `>= 560px`（**正确**：单轴隔离既切断循环又保留内容自然高度，三槽各按己宽在紧排/平衡/展开三态间自治重排）。
  - `D`：父级设 `container-type: inline-size;`，门槛写到 `@container (width >= 640px)`（错：460px 中槽白白卡死在窄版紧凑态，右侧大片空洞）。
