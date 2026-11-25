# 235 · 粘性定位布局（STICKY POSITIONING）设计方案

## 1. 一句话道理
粘性定位让标题或工具条先守在正常文档流里占住位置，滚到指定阈值才贴边停驻，等它所属分区的最后一行划过再顺势退场交棒——既有固定导航的就近参照，又不会永久侵占整页视口。

## 2. 开场玩具：「三联阶段同步滚卷与接力吸附试验台」
- **怎么玩**：
  - 复刻 235 原海报的奶油手账风格「滚动状态演示」：舞台内是一份真实可滚动的三分区手账长文（阅读分区一 / 二 / 三，各含覆盆子粉书签标头与橄榄金图标内容卡片），水平粉红虚线标出 `top` 触发阈值，左侧是原海报同款的「阶段 01 正常流程 → 阶段 02 过渡状态 → 阶段 03 吸附顶部 → 阶段 04 顶出交棒」竖向实检轴，右侧是原海报「↑ 滚动中」步进流向标。
  - 舞台顶部嵌入一条 **2D Canvas「粘性状态轨道示波器与滚卷拖轨」**（标有 `data-perf-drag`）：实时画出三个分区容器的滑行轨道长度、当前卷动游标位置，以及正常流（橄榄段）/ 吸附中（玫粉段）/ 顶出交棒（焦糖段）的区间。用户既可以左右拖拽轨道（适配触屏与桌面）、也可以在阅读器里滚轮滚动、点右侧「↑ 滚动中」步进或按 `←`/`→`/`↑`/`↓` 键滚卷，并就地切换四个核心 CSS 参数。
- **开场初始状态（0/4 经典失灵翻车态，绝不先给答案）**：
  - ① `top` 阈值为 `未设 (auto)`（写了 `position: sticky` 却漏写阈值，规范直接退化为普通相对定位）；
  - ② 祖先容器 `.article-shell` 套了 `overflow: hidden`（最常见杀手：意外创建不滚动的滚动祖先，所有子级粘性瞬间锁死）；
  - ③ 父容器仅孤立包住标题自身（滑行行程 0px，毫无轨道可滑；切回完整分区后获得 268px 滑行行程）；
  - ④ 层叠 `z-index: 0` 且透明无底（吸住后正文卡片直接穿字反压）。
- **怎样算玩错 & 读数如何说「为什么」**：
  - 除了初始 4 种错态，用户手动调节还会触发新错态：例如把阈值调到 `top: 148px`（悬腰挡字：标题虽吸住却横卡视口中段把正文拦腰截断）、把祖先切到 `overflow: auto` 矮盒（双滚轴嵌套陷阱）、或叠加多层过厚吸顶栏导致吸顶占比 > 32%（挤压净阅读区）。
  - 全部吸附位置、三阶段状态、滑行余量（px）、穿帮状态与净可视区占比均由 `model.js` 单真源按真实像素几何实时算出；读数不只报数字，还用白话讲清浏览器的包含块/滚动祖先计算逻辑与读者的视线后果。
  - 接受多组正当解：`overflow: visible` 或 `overflow: clip` 均过关；`top: 0px` 或 `top: 12px` 呼吸缝均过关；单吸顶或合理错层轻双吸顶（≤ 28% 视口高）均过关。
- **与最近 12 页的差异**：
  - 隔壁 234 是深海藏蓝三翼蓝图 + 永久焊死在视口四角的固定导航 + 右翼 Z 轴侧剖；本页是暖奶油手账出版风 + 原海报「左柱规则手账 × 右大幅滚卷联台」+ 独属于 sticky 的「三分区接力交棒 + 横向 2D 轨道滑行余量示波器」，别的编号无法套用。

## 3. 版式骨架
- **1440×900 桌面**：主容器宽 `1360px`（不锁 `100svh`）。顶眉下为原海报同款不对称刊头（左：嵌入动态吸附徽的「粘性」示范大标 + 英文；右：原海报粉红波浪线 + 简介 + 橄榄金圆点）。主体忠实复刻原海报「左 37% 规则诊单与四维排障控参 + 实时 CSS 语法盒 × 右 63% 轨迹拖轨 + 阶段轴 + 活体三分区阅读器 + 滚动箭头」，底部以原海报 4×4 粉点阵 + 淡梅雾粉「一行记忆」圆角胶囊收口。
- **2560×1440 宽屏**：容器舒展至 `1760px`，放大轨道与阅读器视口，绝不居中缩成窄条。
- **1024×1366 / 768×1024 平板**：不锁 `100svh`，收束为全宽滚卷舞台在上、双栏诊单与控参在下，无大块空洞。
- **390×844 手机竖屏**：极紧单行刊头（收起装饰波浪），立刻置顶展示 2D 轨迹拖轨（48px 触控区）与等比活体三分区阅读器（首屏稳占 ≥ 46% 屏高），紧跟诊单首句与第一组关键修复钮。
- **844×390 手机横屏**：切左 55% 轨迹拖轨与活体阅读器 × 右 45% 紧凑刊头、白话诊单与核心控参并行。

## 4. 配色和字体
- **配色（逐像素实采自 235 号原海报）**：
  - 奶油手账底纸 `#FBF0DD` / 洁净象牙 `#FDF9F0` / 暖杏卡底 `#F5E9D4` / 浅梅雾纸 `#F6EBEE` / 淡梅粉胶囊 `#EAD7DB` / 03 节深焙浓缩棕暗室 `#24140B`。
  - 主墨深焙咖啡棕 `#361905` / 次墨焦糖棕 `#5C3B26` / 暖褐说明 `#705440`。
  - 覆盆子玫粉粘性色 `#F15B87` / 强粉 `#E43C74` / 浅纸可读深覆盆子字 `#B31E4F`（对比度 > 6.2:1）/ 暗室亮粉 `#FF82A8`。
  - 橄榄芥末金绿 `#A89139` / 亮点圆 `#CBC216` / 浅纸可读深橄榄字 `#5F500F`（对比度 > 6.6:1）/ 暗室柔金 `#E2CC68`。
  - 状态克制色：达标松青 `#136B52`（暗底 `#6EE0BD`），错态信号红 `#B82822`（暗底 `#FF887A`）。
- **字体搭配（全库唯一，三款西文在最近 12 页全部 0 次使用）**：
  - `Noto Sans SC`（400/500/700/900，中文大标与正文）
  - `Bricolage Grotesque`（500/700/800，英文副标、大号读数与界面标签，**近 12 页 0 次**）
  - `DM Serif Display`（400 正体+斜体，章节大序号 `01`–`07` 与出版引句点缀，**近 12 页 0 次**）
  - `IBM Plex Mono`（400/500/600，CSS 代码块与像素刻度，**近 12 页 0 次**）

## 5. 节目录（7 编号大节 + 尾节原海报）
1. **01 · 什么是粘性定位**（`THE HYBRID STATE`）：引原海报概念并温和补充「父盒顶出交棒」第四阶段；交互为「三列同步滚筒对比（relative / sticky / fixed）」。
2. **02 · 阈值与双向吸合**（`THRESHOLD & RELAY`）：引原海报 CSS 属性与三阶段，讲四向阈值与二维锁边；交互为「真实可横纵双滚的双向粘性数据表实验室」（独立切换锁顶行、锁首列与双层表头）。
3. **03 · 四大失效暗坑诊所**（`WHY STICKY FAILS`，深焙棕暗室）：专拆 `overflow: hidden`、Flex `stretch`、缺 `top`、超高粘性块四大现场；交互为「4 份可滚动 CSS 故障病历逐行修复台」。
4. **04 · 从哪来**（`WHERE IT CAME FROM`）：从 2002 OEBPS 先声、2008 iPhone OS 2.0 `UITableView`、2012 Edward O'Connor W3C 提案、WebKit/Firefox 32/Chrome 56 到 2022 `overflow: clip` 与 2025 `scroll-state(stuck)`；交互为「年代节点脉络卡与 JS 抖动 vs 原生合成帧对比」。
5. **05 · 什么时候用与别用**（`WHEN TO USE & AVOID`）：引原海报四大场景，重点讲手机横屏占空、多级叠罗汉、`scroll-margin-top` 与何时改用 234 固定定位或 233 绝对定位；交互为「多屏设备粘性占空计算器 + 矮屏自动解粘切换」。
6. **06 · 实战小练习**（`PRACTICE QUIZ`）：单变量四选一代码审查题（只标方案 A/B/C/D，各差唯一关键 CSS 属性），答完展开逐项验证与原因。
7. **07 · 原海报与关键词**（`ORIGINAL POSTER`）：原海报可点放大/拖拽/Esc 灯箱，完整保留「一行记忆」、四大适用场景词与同小类链接。

## 6. 来源与核实网址
- Edward O'Connor (Apple), *Sticky Positioning* proposal on W3C `www-style`, June 26, 2012: https://lists.w3.org/Archives/Public/www-style/2012Jun/0555.html
- W3C CSS Positioned Layout Module Level 3: https://www.w3.org/TR/css-position-3/
- Chrome Developers, *position: sticky is back in Chrome* (Chrome 56, Jan 2017): https://developer.chrome.com/blog/position-sticky-is-back-in-chrome
- MDN Web Docs, *CSS `position` & `overflow: clip`*: https://developer.mozilla.org/en-US/docs/Web/CSS/position 与 https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
- Chrome Developers, *CSS scroll-state() queries* (Chrome 133, 2025): https://developer.chrome.com/blog/css-scroll-state-queries

## 7. 小练习设计
- **场景**：双栏长文页面（左正文 + 右短目录 `.toc`），希望页面外层 `.page` 防止超宽图片横向撑破屏幕，且右侧目录在滚到距顶 `24px` 时吸住并在文章结束时随父盒退场。
- **四个中性选项（只差一个 CSS 属性）**：
  - **方案 A**：`.page { overflow-x: hidden; }` + `.main { display: flex; align-items: flex-start; }` + `.toc { position: sticky; top: 24px; }`（错因：`overflow-x: hidden` 令另一轴计算为 `auto`，将 `.page` 暗转为滚动祖先，截断 sticky）
  - **方案 B**：`.page { overflow-x: clip; }` + `.main { display: flex; align-items: stretch; }` + `.toc { position: sticky; top: 24px; }`（错因：Flex `stretch` 把 `.toc` 拉到和正文等高，滑行余量为 0）
  - **方案 C**：`.page { overflow-x: clip; }` + `.main { display: flex; align-items: flex-start; }` + `.toc { position: sticky; top: 24px; }`（**唯一正解**：`clip` 裁边不建滚动容器 + `flex-start` 保留滑行余量 + 显式 `top` 阈值）
  - **方案 D**：`.page { overflow-x: clip; }` + `.main { display: flex; align-items: flex-start; }` + `.toc { position: sticky; z-index: 10; }`（错因：未声明 `top/bottom/left/right` 任意阈值，规范退化为不吸附）
