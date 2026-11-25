# 229 多栏布局（MULTI-COLUMN LAYOUT）互动页方案

## 1. 一句话道理
把过宽的长行拆成宽度适中、栏距清晰的多列流式阅读通道，缩短每次换行回扫的视线跳距，同时靠跨栏标题与防断块规则维持整版层级与连贯性。

## 2. 开场玩具：「活体多栏报样排版桌」
- **怎么玩**：舞台是一张真正用原生 CSS Multi-column（`column-count` / `column-width`、`column-gap`、`column-rule`、`column-span`、`break-inside`）排版的暖纸报样，上方叠一层 2D Canvas 活体流式阅读路径与栏距标尺；读者可以**左右拖动报样右侧的朱红纸幅拉柄（`data-perf-drag`）**实时改变版面容器宽度（就像缩放窗宽或切换开本），观察固定栏数与响应式栏宽下文字如何像水流般跨栏倾泻，并直接切换栏数/自适应栏宽、连续推拉栏距、开关竖向分隔线、把主标设为跨栏通排、给插块加上防截断保护，以及开关原海报同款朱红蛇形视线流预览（也全部支持键盘方向键与原生按钮操控）。
- **开场错态（0/4）**：报样起始落在 72% 中窄纸幅下强行 `column-count: 4`、`column-gap: 6px`（无分隔线）、主标题 `column-span: none` 挤在第一栏、插块 `break-inside: auto` 拦腰劈成两截——同时暴露碎栏、串行、无锚与断块四重问题，不设一键过关按钮。
- **怎样算玩错与读数怎么说**：由单一真源 `model.js` 按当前纸宽、W3C 分栏公式与实测 DOM 截断状态实时判定 6 类失误：① 碎条窄栏（单栏汉字 < 13 字/行，频繁折行点读）；② 过宽长行（单栏汉字 > 34 字/行，回扫易串行）；③ 栏距过窄串行（无分隔线时栏距小于行间空隙，视线横穿栏缝跳进邻栏）；④ 栏距过宽割裂（栏距 > 2.8em，版面裂成孤岛）；⑤ 标题困在首栏（`column-span: none` 缺少统一入口）；⑥ 插块拦腰截断（`break-inside: auto` 实测被拆入两栏）。每条诊断都说明「为什么眼睛会这样看」与下一步调什么；过关不限于唯一答案，任何让四项体检同时达标的组合（例如切换合理栏数、拉宽纸幅或改用 `column-width` 自适应）均可成立。
- **与最近 12 页的区别**：区别于 228 的父子网格列轨对齐、227 的 6×4 单元格拖块、272 的便当分仓、144 的套框审校、022/023/060/104/105/189/190/311 的画布构图玩具，本页紧扣多栏布局独有的「单股连续文本流随容器宽度自动跨栏倾泻 + 栏距/行距视觉竞争 + 跨栏锚点与分片截断」机制。

## 3. 版式骨架
- 忠实承袭 229 原海报的「通栏广幅报刊（Broadsheet）」无重框、无侧栏纵落结构（不锁 `min-height: 100svh`，避免平板留白空洞）：
  - **1440×900 / 2560×1440**：顶沿极细报眉下接刊头（左上排跨 4 轨细线的示范大标「多栏布局」+ 朱红短杠与总述，右上压原海报同款大朱红四分之一圆弧、松绿点阵与 4 枚红绿交替达标圆徽）；中段为极薄单行排字工具带 + 近通栏活体报样排版桌（右侧附切割垫刻度尺与可拖纸幅拉柄，2560 放宽版心至 1840px）；底沿通栏接原海报细线分隔的实况诊断与 CSS 声明条，首屏一气收束。
  - **390×844（手机竖屏）**：单行压紧刊头与 4 枚迷你圆灯，紧接着铺开高度约 395px（≥ 46% 屏高）的活体报样排版桌（起始纸幅 72%，让拉柄左右各有约 100px 拖幅），同屏下方直接见白话诊断与触控区 ≥ 42px 的高频按钮。
  - **844×390（手机横屏）**：切为左 58% 活体报样排版桌 × 右 42% 紧凑诊断与控件并行，避免上下挤压。

## 4. 配色和字体
- **配色（实采自 `poster.webp`）**：暖宣报纸底 `#F1E8DB`、象牙报样面 `#F9F4EC`、暖沙栏块 `#E9DEC9`、深松绿墨 `#163828`（暗版底 `#143527`、正文墨 `#1D2C24`、次级墨 `#475A50`）、朱红点缀 `#E85D41`（浅底可读深朱红文字 `#B9381E`，对比度 > 5.3:1）、细栏线 `#BEB8AA`。
- **字体搭配**：`Noto Sans SC`（正文与厚重示范标题）+ **`Archivo`**（报刊无衬线英文标，最近 12 页未用）+ **`DM Serif Display`**（正斜体，承接原海报第 4 枚圆徽经典衬线 T 与引语，最近 12 页未用）+ **`Space Mono`**（CSS 声明与标尺刻度，最近 12 页未用）。全库唯一且三款西文均避开最近 12 页与相邻 228 号。

## 5. 节目录（每节标题 ≤ 12 字，相邻不撞控件）
- **01 为什么宽屏要把文字拆成栏**（Why Wide Lines Break Reading）：引原海报「分栏」「流式阅读」与设计箴言，讲回扫疲劳与行长经验区间。交互：**眼动回扫模拟播放器**（1/2/3 栏切换 + 播放/暂停眼动路径动画）。
- **02 从古腾堡双栏到 CSS 规范**（From 1455 Print to W3C Multicol）：梳理 1455 B42 双栏圣经 → 报刊广幅 → 1981 瑞士网格 → 1992 行长准则 → 1999/2001 W3C Multicol 草案。交互：**四时代版样切换书签**（点击时代标签切换纸面与液态视口结构剖面）。
- **03 栏距与行距的视觉拉锯**（Gutter vs. Leading）：引原海报「栏距」三档要点，温和修正原海报 TIP「正文字号的 1/2 ~ 1 倍」在无分隔线时偏窄的边界，对照 W3C `normal = 1em` 与邻近律。交互：**4×4 行距×栏距点击矩阵 + 竖分隔线开关**。
- **04 自动算栏：数量还是栏宽**（How CSS Computes Columns）：拆解 W3C `column-count`、`column-width` 与 `columns` 简写伪算法，一句外链 226/227/240/242。交互：**四档设备宽切签 + 三种 CSS 规则并排实算对照**。
- **05 跨栏锚点与不断块连贯性**（Spanners, Balancing & Breaks）：引原海报「跨栏标题」「连续性」，讲 `column-span: all`、`column-fill`、`break-inside: avoid` / `break-after: avoid`。交互：**三处红标错版热点逐一点击修复**。
- **06 什么时候用，什么时候别用**（When to Use & When Not To）：引原海报四类适用场景，重点剖析网页独有的「溜溜球上下往返滚屏」与伪瀑布流陷阱，一句外链 222/228/230/236。交互：**文章高度与视口高度往返滚屏里程模拟器**。
- **07 排版小练习：挑出最稳妥的版面**（Quick Typographic Check）：单变量四选一实景判断。交互：**四张实时微型报样单选卡片**。
- **08 原海报与关键词**（Original Poster & Keywords）：高清原海报灯箱（放大/拖动/Esc 关闭）、原海报三组关键词与同小类关联入口。

## 6. 来源与核实网址
- W3C CSS Multi-column Layout Module Level 1（Håkon Wium Lie 1999-06-23 早期草案、2001-01-18 工作草案；Rachel Andrew / Florian Rivoal 现行编辑；`column-gap: normal = 1em` 与列宽伪算法）：`https://www.w3.org/TR/css-multicol-1/`、`https://www.w3.org/TR/2001/WD-css3-multicol-20010118/`
- MDN Web Docs CSS Multi-column Layout（`column-span`、`break-inside`、`column-fill`）：`https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_multicol_layout`
- Library of Congress Gutenberg Bible Exhibition（约 1455 年美因茨 42 行双栏圣经 B42）：`https://www.loc.gov/exhibits/bibles/the-gutenberg-bible.html`
- Robert Bringhurst, *The Elements of Typographic Style* (1992, Hartley & Marks) — 单栏 45–75 字符、多栏 40–50 字符经验行长（经 Web Typography 文献摘录核实：`https://webtypography.net/2.1.2`）
- Josef Müller-Brockmann, *Grid Systems in Graphic Design / Rastersysteme für die visuelle Gestaltung* (1981, Verlag Arthur Niggli)：`https://www.niggli.ch/en/produkt/grid-systems-in-graphic-design/`

## 7. 练习设计
- **题干**：一份宽度 `720px`、字号 `15px`、行高 `1.65`（行间空隙约 `10px`）、不加竖分隔线的电子简报，要排 3 栏导读短文。四个微型报样在纸宽、栏数、跨栏标题与防断块上完全相同，**只改变栏距（`column-gap`）这一个变量**。哪一版最不容易串行也不显得割裂？
- **四个选项（中性标签，不泄底）**：
  - `方案 A`：`column-gap: 6px`（`0.4em`）—— 明显窄于行间空隙，视线极易横向串栏。
  - `方案 B`：`column-gap: 10px`（`0.67em`）—— 贴近原海报 TIP 的下限且几乎等于行间空隙，是最具迷惑性的干扰项；无分隔线时横纵间距打架，依旧易串行。
  - `方案 C`：`column-gap: 26px`（`1.73em`）—— **正确答案**：约行间空隙的 2.6 倍，明确建立纵向列群组，同时让三栏保持整体呼吸而不割裂。
  - `方案 D`：`column-gap: 64px`（`4.27em`）—— 栏缝过宽，页面被白带切成三条孤立窄纸条。
