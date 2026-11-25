# 247 侧栏原语（SIDEBAR PRIMITIVE）互动页方案

## 1. 一句话道理
侧栏原语把「一窄一宽」两栏关系写成浏览器自带的弹性算法：宽容器里用 `flex-grow: 999` 让主内容吸走余量、侧栏守住 `flex-basis` 充当稳定锚点；容器一旦窄到主内容低于 `min-inline-size` 底线（精确临界宽 `W_wrap = (B + G) / (1 - P)`），两栏不靠视口 `@media` 断点、原地无声翻折成上下 100% 满宽堆叠。

## 2. 开场玩具：活体量子侧栏实验舱（Live Quantum Sidebar Chamber）
- **玩法**：
  - 在 1:1 承袭 247 原海报深松青 × 暖羊皮纸 × 信号金的锐角建筑画布上（2D Canvas，`data-perf-drag`），直接左右横拖右侧金色边界墙（或画布轨道），连续改变父容器宽度 `W`（280px–920px），跨越标尺上的金色量子临界线 `W_wrap`，亲眼见证侧栏与主区在「左右并排 ⇄ 上下满宽堆叠」间完成无断点相变。
  - 并排状态下可直接拖移侧栏与主区的竖向分界柄微调 `flex-basis (B)`；直接点击暗绿侧栏里的 6 个导航锚点项可切换羊皮纸主区的实时内容段落（验证锚点与索引）；点击画布上的红底诊签可直接定位/定位症结；顶部可切换三类真实题材（原海报文档站 / 搜索框+提交按钮 / 头像+简介条）以及「左置 / 右置」侧栏方向。
- **开场初始态（0/4 错态，绝不预给答案）**：
  - `flex-wrap: nowrap`、`min-inline-size: 24%`、`sidebar flex-grow: 0`、`main flex-grow: 1`、`sidebar flex-basis: 310px`、导航项「平铺无分组」。
  - 宽屏下侧栏肥大占近 40% 且平铺杂乱；拖窄到 360px 时主区被挤成窄条；打开换行后又暴露 `sidebar flex-grow: 0` 留半行死空；把 `sidebar flex-grow` 改为 `1` 后宽屏侧栏立刻因 `1:1` 抢空间暴涨，逼出为什么主区必须 `flex-grow: 999` 的顿悟时刻。
- **怎样算玩错 & 读数怎么说「为什么」**：
  - 所有像素宽、占比与临界线 `W_wrap = (B + G) / (1 - P)` 全部由 `model.js` 按 W3C Flexbox 空间分配算法单真源实时算出。
  - **可玩出的 6 类真实错误**：(1) 不换行或底线过低（<45%）→ 窄屏主区被挤死；(2) 底线过高（≥75%）或侧栏基准宽过大 → `W_wrap` 超过桌面宽导致宽屏也永久竖叠；(3) `sidebar flex-grow: 0` → 折行后右侧留出大片死空；(4) `main flex-grow: 1` → 宽屏剩余空间被 1:1 对分，侧栏膨胀喧宾夺主；(5) 侧栏过窄（<130px）→ 索引文字挤断不可扫读；(6) 平铺无分组 → 失去原海报「层级清晰、稳定可预测」的索引结构。
  - 接受多组合法解（紧凑 176px/60%、标准 210px/55%、宽松 240px/52%、右置侧栏解等）。
- **与最近 12 页的明显差异**：
  - 不同于 246（圆点聚类包络）、245（对称居中器视口拉墙）、287（冷灰三栏表单设置窗口）、203（圆盘放射星图）和 037（深松夜绿流动 S 河道）：本页是 **0px 锐角建筑双色纸页**，核心动作是跨越数学公式 `W_wrap` 的**非对称两栏拓扑相变（并排 ⇄ 堆叠）**与四条 CSS 弹性属性的因果博弈，别的编号无法套用。

## 3. 版式骨架
- **全页绝不锁 `min-height: 100svh`**（避免平板空洞）。
- **1440×900（主宽 1380px，2560×1440 舒展至 1680px）**：忠实承袭 247 原海报「左侧深松青通高侧栏脊（276px，顶部金横杠 + 竖排大字『侧/栏/原/语』+ `SIDEBAR PRIMITIVE` + 三枚金色建筑图标实况锚点 + 0px 锐角金框 `KEYWORDS` + 快选按钮）｜ 1px 鼠尾草竖分割线 ｜ 右侧主工作区（顶沿宣言大标与三题材切换 → 中央巨幅暖羊皮纸活体量子侧栏画布 → 底沿原海报 `01/02/03` 建筑设计要点表、星标白话诊单与 4 条实时 CSS 装调槽）」，左右两栏收尾高度匹配（~850px），首屏完整落地。
- **1024×1366 / 768×1024 平板**：自动执行侧栏原语自身的折行哲学——左脊翻折为紧凑横向建筑刊头条，下方全宽量子画布 + 双栏诊单与 CSS 装调，自然流排零空洞。
- **390×844 竖屏手机**：顶部压紧单行刊头（`侧栏原语` + `0/4`）与一行题材切签，紧接等比活体量子画布稳占首屏 ≥47% 屏高，底沿直见白话诊单首句；宣言与详细控件后置。
- **844×390 横屏手机**：左 56% 活体画布 × 右 44% 紧凑刊头、题材与诊单并行，零溢出。

## 4. 配色和字体
- **配色（逐像素采自 `247.webp`）**：
  - 深松青原底 `#003731` / `#003933`（暗舱 `#05463E` / 03 暗室 `#00302B`）
  - 暖羊皮纸 `#EFE6D6` / 大字米白 `#EDE3CB` / 正文浅纸 `#F6F0E4` / 鼠尾草浅纸 `#EAECE3` / 暖砂浅纸 `#ECE4D4` / 卡片暖石 `#C8C3B7`
  - 建筑金 `#F0B921`（暗底对比度 ~8.9:1；浅纸绝不直接用亮金字，改用深赭金 `#7D5600`，对比度 ~5.8:1）
  - 建筑细线 `#66857A`（暗底）/ `#C7C0B0`（浅纸）；达标松翠 `#6CE0B3`（暗）/ `#0E664B`（浅）；警示赤 `#FF837A`（暗）/ `#A8201A`（浅）；全站锐角 `0px` 建筑骨架。
- **字体（全库唯一、与 244/245/246 西文零重合，三款西文在近 12 页全部 0 次使用）**：
  - `Noto Sans SC`（400, 500, 700, 900）：中文建筑标题与正文
  - `Outfit`（500, 700）：几何建筑感英文副标与图注（近 12 页 0 次）
  - `Bebas Neue`（400）：高耸窄体建筑大写编号 `01`–`07` 与标牌（近 12 页 0 次）
  - `DM Mono`（400, 500）：海报同款等宽副标、实时 CSS 代码与 `W_wrap` 像素刻度（近 12 页 0 次）

## 5. 节目录（7 大节，相邻不用同种控件做同件事）
- **01 解剖四行代码**（`FOUR CSS RULES` · 暖羊皮纸）：真正用浏览器原生 CSS `display: flex; flex-wrap: wrap` 跑出来的 DOM 实验盒，配 4 枚单行代码开关 + 容器宽度拖尺 + 实测 `getBoundingClientRect()` 读数，验证 `flex-basis`、`flex-grow: 1`、`flex-grow: 999`、`min-inline-size` 缺一不可。
- **02 容器而非视口**（`INTRINSIC WRAP` · 鼠尾草浅纸）：左右对比「视口 `@media (max-width: 768px)`」与「侧栏原语」同时放进宽页和 420px 窄卡时的生死表现，附 `W_wrap = (B + G) / (1 - P)` 交互式临界线计算标尺。
- **03 一套规则四种变身**（`BEYOND PAGE SHELL` · 深松青暗室）：4 个真实 UI 微件（文档目录、搜索栏+按钮、头像+简介、右侧属性检查器）共用同一套 CSS 原语，一条容器宽度滑尺同时挤压四者，观察各自在自己的 `W_wrap` 独立翻折；顺带一句话链接同小类兄弟原语（243 堆栈、244 盒子、245 居中器、246 簇群、248 切换器、250 自适应网格、254 图标文字组合）。
- **04 从圣杯到量子原语**（`WHERE IT CAME FROM` · 暖羊皮纸）：核实过的演进时间轴（2006 Matthew Levine《In Search of the Holy Grail》→ 2010 Ethan Marcotte《Responsive Web Design》→ 2012–2018 W3C Flexbox Level 1 CR → 2018 Jen Simmons「Intrinsic Web Design」→ 2019 Heydon Pickering & Andy Bell *Every Layout*「The Sidebar」），并温和补充原海报「侧栏固定」一语的语境边界。
- **05 什么时候别用**（`WHEN NOT TO USE` · 暖砂纸）：四枚可翻转诊卡（等宽双栏→换 248 切换器；多栏卡片阵→换 250 网格；侧栏过胖越过底线→永久竖叠；沉浸阅读单栏→换 245 居中器+243 堆栈），点击切换「错用现场 / 推荐替代」。
- **06 眼力练习**（`SPOT THE SOLID RULE` · 亮羊皮纸）：四套只差一个 CSS 参数的中性方案（A/B/C/D），同时展示 760px 宽页与 380px 窄抽屉双态线框，选完揭晓并按 `W_wrap` 数学给出逐项解释。
- **07 原海报与关键词**（`ORIGINAL POSTER` · 深松青展墙）：247 原海报高清图（可点击放大、滚轮缩放、拖拽漫游、`draggable="false"`、Esc 关闭）、原海报原话与 TIP 引述、关键词及布局原语家族索引。

## 6. 核实来源
1. Heydon Pickering & Andy Bell, *Every Layout* — "The Sidebar" (2019): `https://every-layout.dev/layouts/sidebar/`
2. Matthew Levine, "In Search of the Holy Grail", *A List Apart* Issue 211 (January 30, 2006): `https://alistapart.com/article/in-search-of-the-holy-grail/`
3. Ethan Marcotte, "Responsive Web Design", *A List Apart* (May 25, 2010): `https://alistapart.com/article/responsive-web-design/`
4. W3C, *CSS Flexible Box Layout Module Level 1* (CR 2012 / CR Snapshot Nov 2018): `https://www.w3.org/TR/css-flexbox-1/`
5. Jen Simmons, "Everything You Know About Web Design Just Changed" / Intrinsic Web Design (*An Event Apart*, 2018): `https://jensimmons.com/`

## 7. 练习设计
- **题干**：一个目录组件要同时放进 760px 宽页和 380px 窄抽屉（`gap: 16px`），希望宽处保持约 200px 窄目录配宽正文、窄处上下满宽堆叠。下列四份 CSS 规则只差一个变量，哪一份在两个宽度下都成立？
- **四选项（标签仅写 方案 A/B/C/D，各只差一个参数）**：
  - `方案 A`：`sidebar: flex-basis: 200px; flex-grow: 1` + `main: flex-basis: 0; flex-grow: 1; min-inline-size: 55%`（宽处 1:1 分余量，侧栏膨胀至 472px）
  - `方案 B`：`sidebar: flex-basis: 200px; flex-grow: 0` + `main: flex-basis: 0; flex-grow: 999; min-inline-size: 55%`（窄处折行后侧栏停在 200px，右留 180px 死空）
  - `方案 C`：`sidebar: flex-basis: 200px; flex-grow: 1` + `main: flex-basis: 0; flex-grow: 999; min-inline-size: 55%`（**正确**：`W_wrap = (200+16)/0.45 = 480px`，760px 下 200px+544px 稳健并排，380px 下双双满宽堆叠）
  - `方案 D`：`sidebar: flex-basis: 200px; flex-grow: 1` + `main: flex-basis: 0; flex-grow: 999; min-inline-size: 75%`（`W_wrap = (200+16)/0.25 = 864px > 760px`，宽页也被迫竖叠）
