# 231 浮动布局（FLOAT LAYOUT）设计方案

## 1. 一句话道理
浮动让元素退出普通块级排队、贴靠容器左缘或右缘，却仍对周围的文字行盒保持排斥，迫使行盒自动缩短并沿浮块外缘自然包裹——它天生为图文环绕而生，但因为脱离普通块流高度计算，必须配以合理的环绕宽度、呼吸外边距、父容器清除机制（`display: flow-root` / `clearfix`）与后续 `clear` 避让，才不会引发父框塌陷或版面串台。

## 2. 开场玩具
- **命名**：活体浮块排字台（Live Float Typography Tank）
- **构成**：真实可运行的原生 CSS `float` 排版纸面（亮朱红 3D 等轴测感 `FLOAT` 浮块 + 真实中文环绕文章流 + 深蓝虚线父框 + 紧贴其下的「后续章节盒」）+ 轻量 2D Canvas 实时测绘叠加层（读取真实 `Range.getClientRects()` 与 `getBoundingClientRect()` 绘制每行文字缩短宽度标线、外边距气垫线与右侧原海报同款「高度塌陷 / 高度正常」双箭头高度标尺）。
- **怎么玩**：
  - 直接左右拖动亮朱红 `FLOAT` 浮块（标 `data-perf-drag`）：连续缩放浮块占容器宽度的比例（16%–76%），同步驱动立体倾斜微光与浏览器真实文字重排；
  - 切换浮动方向（`float: left` / `float: none` / `float: right`）；
  - 调节外边距呼吸距 `margin`（`0px` / `16px` / `44px`）；
  - 切换父容器清除浮动（`未清除` / `clearfix ::after` / `display: flow-root`）；
  - 切换下方后续章节的 `clear`（`none` / `left` / `right` / `both`）。
- **开场初始状态（非答案，0/5 翻车错态）**：
  - 浮块设为 `float: left`，宽占 **66%**，`margin: 0px`，父容器**未清除浮动**，下方后续章节为 `clear: none`。
  - 画面当场暴露多重真实 CSS 翻车：朱红浮块右侧被挤成 3–5 字的碎条烟囱且文字贴死红边、父容器深蓝虚线框高度塌陷（浮块底截刺出父框外，右侧红双箭头实测标出塌陷像素）、下方后续章节直接顶撞并钻入浮块旁侧。
- **怎么算玩错与读数说明**：
  - 设 `float: none`：退出浮动，文字断流掉至下方，失去环绕；
  - 浮块拉太宽（> 54%）或实测最短环绕行 < 8 字：提示环绕列挤成碎字烟囱，阅读频繁断行；
  - 浮块缩太窄（< 22%）：浮块弱化成小邮票，失去图文焦点锚定；
  - `margin` 为 0px：文字紧贴浮块边沿窒息；`margin` 过大（≥ 40px）：图文断离像隔着鸿沟；
  - 父容器未清除且浮块高于流内文本：实测 `collapsePx > 0`，提示父框塌陷、边框无法包裹内容；
  - **方向错配陷阱**：当浮块切到 `float: right` 却误选 `clear: left`（或 `float: left` 误选 `clear: right`）时，实测依然清不掉另一侧的浮动，明确指出「方向不匹配，后续块仍在绕行未清掉的浮块」。
  - 所有读数（真实父框高、塌陷像素差、最短环绕行字数与行宽、边距、5 项检核状态与实时 CSS 声明）均由 `model.js` 与真实 DOM 测量单一真源产出。
- **与最近 12 页的差异**：
  - 230/274 是数据表与列宽标尺，229 是多栏纸幅拉柄，062/106/061/107 是几何点阵与半径滑轨，191 是贝塞尔曲线排字，273 是 24h 时间轴仪表盘，313 是宽银幕镜头推轨，146 是蒙德里安网格，024 是平行线梳轨；231 独创**真实 CSS 浮块排字池 + 实时 `Range` 行盒测绘 + 原海报左侧 5 枚深蓝圆徽实检清单 + 父框塌陷双向标尺**，且直接拖动浮块主体本身，无任何套壳感。

## 3. 版式骨架
- **整体美学**：忠实承袭 231 号原海报的天空冰蓝纸（`#DBF0FD` → `#E7F6FE`）+ 纯白圆角卡片（`#F9FFFF`）+ 深海军蓝墨与圆徽（`#01245A`）+ 亮朱红等轴测巨块（`#FD491F` / `#E42A0A`）+ 冰蓝投影（`#B2DCFF`），不锁 `100svh` 避免竖屏平板大片留白。
- **1440×900（2560×1440 放宽至 1760px）**：
  - 极细顶眉下，刊头左置示范大标「浮动布局」（「浮」字微升配冰蓝投影，下接原海报红蓝虚点线与总述），右置随状态联动的迷你等轴测朱红 `FLOAT` 雕塑徽与达标徽；
  - 中段采用原海报专属的 **左 23% 五枚深海军蓝圆徽实检竖列 × 右 77% 纯白大卡片活体排字舞台**（舞台内右沿设原海报红/蓝高度双向标尺，下方一体承接操控带 + 白话诊单 + 实时 CSS 代码盒）；
  - 首屏底沿以原海报同款深海军蓝折角「要点速记」条 + 朱红细竖杠 5 关键词 + 9×3 淡蓝圆点阵收束。
- **1024×1366 / 768×1024**：5 枚深蓝圆徽收成紧凑 5 列顶横带，下方活体舞台全宽舒展，绝无空洞。
- **390×844（手机竖屏）**：单行极简标题压紧，纯白活体排字舞台直接置顶稳占首屏 ≥ 48% 屏高（完整露出朱红可拖浮块、真实环绕文字与塌陷双箭头），同屏可见白话诊单摘要与主控按钮。
- **844×390（手机横屏）**：切左 58% 活体排字舞台 × 右 42% 操控与白话诊单并行，零横向溢出。

## 4. 配色和字体
- **原海报实采色值**：
  - 天空冰蓝底：`#DBF0FD`（顶） / `#E1F1FE`（中） / `#E7F6FE`（底） / `#EDF7FE`（浅云蓝节）
  - 雪白卡纸：`#F9FFFF` / `#FFFFFF`
  - 深海军蓝主墨与圆徽：`#01245A`（暗节深夜蓝底 `#051B42` / 次暗卡 `#0B285C`）
  - 朱红巨块三面：顶 `#FD4319` · 正 `#FD491F` · 侧 `#E42A0A`（浅底可读深朱红文字 `#B82506` / 暗底亮朱红 `#FF7452`）
  - 冰蓝斜影与行条：`#B2DCFF` / `#C3E1FB`；正常态蓝箭头与虚线：`#3B76DB`（浅底文字 `#1553B8`）
- **字体搭配（全库唯一，三款西文在最近 12 页全部 0 次使用）**：
  - `Noto Sans SC`（400/500/700/900）：中文大标与清晰正文（正文内嵌西文与数字保持同字体不跳动）
  - `Outfit`（500/600/700）：几何无衬线英文副标与 UI 标签（**最近 12 页未使用**）
  - `Bebas Neue`（400）：窄高全大写海报展示字，用于朱红等轴测巨块 `FLOAT` 铭牌与章节英文编号装饰（**最近 12 页未使用**）
  - `IBM Plex Mono`（400/500/600）：工业等宽字体，用于实时 CSS 代码窗与像素测量读数（**最近 12 页未使用**）

## 5. 节目录
1. `01` **脱离块流，只让行盒绕道** (`HALF OUT OF FLOW`) — 剖析浮块为何「对块盒隐身、对行盒显形」；交互：2.5D 等轴测三层剥离透视台（分别显隐块盒背景层 / 浮块层 / 缩短行盒层）。
2. `02` **三式图解与多浮块卡钩** (`LEFT, RIGHT & FLOAT SNAG`) — 复现原海报三卡并温和纠正「用浮动排卡片」的过时做法；交互：6 张活体卡片点击增删摘要行亲眼触发 Float Snag 阶梯卡钩，并一键切换 CSS Grid 对比。
3. `03` **父框塌陷与四种清浮术** (`COLLAPSE, CLEARFIX & FLOW-ROOT`) — 深海军蓝暗版，实测未清除 / `overflow: hidden` / Micro Clearfix / `display: flow-root`；交互：带探出边框「NEW 角标」的真实 DOM 实验室与实时高度标尺，亲眼看 `overflow: hidden` 误裁角标。
4. `04` **不止矩形：沿轮廓自由包裹** (`SHAPE-OUTSIDE & RUNAROUND`) — 展示 `float` 今日不可替代的独门价值；交互：真实 `shape-outside` 轮廓雕刻器（方盒 / 正圆 / 斜切多边形 / 首字下沉 + `shape-margin` 滑杆）。
5. `05` **从铅字绕图到 CSS 三十年** (`ORIGIN & TIMELINE`) — 梳理报刊绕图、1997 HTML 3.2、1996 CSS1、2004–2011 Clearfix 与 Media Object、直至 `flow-root` 与 `shape-outside`；交互：五年代时间轴卡切换与真实历史代码快照。
6. `06` **何时该浮，何时换方案** (`WHEN TO USE & AVOID`) — 明确适用边界与四个禁用场景，链接同小类 225/226/227/236/240/242；交互：6 场景前端需求分诊器。
7. `07` **四选一实战小练习** (`LAYOUT DIAGNOSTIC QUIZ`) — 真实渲染的 4 张微缩卡片选项（只差父容器一条 CSS 属性，纯中性 A/B/C/D 标签）。
8. `08` **原海报与要点速记** (`ORIGINAL POSTER & KEYWORDS`) — 高清原海报可放大拖移灯箱、五条原话卡片与底沿「要点速记」徽条。

## 6. 来源与核实网址
- **W3C CSS1 Recommendation**（Håkon Wium Lie & Bert Bos，1996 年 12 月 17 日，第 5.5.25 节 `float`）：`https://www.w3.org/TR/REC-CSS1/#float`
- **W3C HTML 3.2 Reference Specification**（Dave Raggett，1997 年 1 月 14 日，`IMG ALIGN=LEFT|RIGHT` 与 `BR CLEAR`）：`https://www.w3.org/TR/2018/SPSD-html32-20180315/#img`
- **W3C CSS 2.1 Recommendation**（2011 年 6 月 7 日，第 9.4.1 节 Block Formatting Contexts 与第 9.5 节 Floats）：`https://www.w3.org/TR/CSS21/visuren.html#floats`
- **Nicolas Gallagher — A new micro clearfix hack**（2011 年 4 月，回溯 Tony Aslett 与 Thierry Koblentz）：`https://nicolasgallagher.com/micro-clearfix-hack/`
- **Nicole Sullivan — The media object saves hundreds of lines of code**（Stubbornella，2010 年 6 月）：`http://www.stubbornella.org/content/2010/06/25/the-media-object-saves-hundreds-of-lines-of-code/`
- **W3C CSS Display Module Level 3**（`display: flow-root`）：`https://www.w3.org/TR/css-display-3/#valdef-display-flow-root`
- **W3C CSS Shapes Module Level 1**（`shape-outside`）：`https://www.w3.org/TR/css-shapes-1/#shape-outside-property`

## 7. 练习设计
- **题干**：卡片内有一张左浮缩略图与三行简介，卡片右上角挂着一枚探出边框外 10px 的「精选」角标。要防止父卡片高度塌陷，同时不裁掉右上角探出的角标，父容器应加哪一行 CSS？
- **四选项（只差父容器一条属性，标签纯中性）**：
  - A：`overflow: visible;`（默认不处理 → 父框高度塌陷，缩略图捅出底边）
  - B：`overflow: hidden;`（触发 BFC 但裁剪溢出 → 父框正常，右上角「精选」角标被切掉一半）
  - C：`display: flow-root;`（建立无副作用的独立 BFC → **唯一正解**，包住浮块且完整保留探出角标）
  - D：`clear: both;`（误把 `clear` 写在父容器上 → 只清除父容器之前兄弟的浮动，对内部子浮块无效，依然塌陷）
