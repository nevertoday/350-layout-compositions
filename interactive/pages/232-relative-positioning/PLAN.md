# 232 相对定位布局（RELATIVE POSITIONING）设计方案

## 1. 一句话道理
`position: relative` 让元素拥有「两个分身」——原位幽灵锁住文档流空间、不挤动兄弟元素，视觉本体从原位做小幅四向偏移；更常以「零偏移锚点」的身份框住绝对定位子件并开启 `z-index` 层级。

## 2. 开场玩具
- **名字**：真实双层排架 · 四卡相对定位工坊（原生真实 CSS `position: relative` 四卡排架 `A / B / C / D` + 同步顶部「1 原始位置」参照标尺 + 2D Canvas 实时蓝图尺寸箭与碰撞测绘层）。
- **怎么玩**：直接拖动朱红 `C` 卡片本身（`data-perf-drag`，鼠标/触屏直拖，方向键 `← → ↑ ↓` 每次微调 `4px`，`Shift+方向键` `16px`），观察真实蓝虚线幽灵原位（保留占位）和右侧兄弟 `D` 的纹丝不动；可切换 `C` 的 `position`（`relative / absolute / static`）、CSS 偏移轴向（`top+left` / `bottom+right` / `四边冲突`）、`C` 的 `z-index`（`-1 / auto / 2 / 9999`）以及卡片 `B` 是否挂零偏移 `position: relative` 锚点，还可在「蓝图 A-B-C-D」与「真实卡片 UI」两种视角间切换，或一键套用「原海报 +60/+40」对比教学示意与真实 UI 微调的差别。
- **开场初始错态（0/4 待校）**：
  1. **撞遮邻居与空洞**：`C` 卡片以 `left: +84px; top: +38px` 猛偏右下，直接压住兄弟 `D` 卡片并在蓝虚线原位留下刺眼空洞；
  2. **四边过约束死代码**：同时写入 `top + bottom`、`left + right`，触发 CSS 2.1 §9.4.3 过约束冲突（LTR 下 `right` 与 `bottom` 被静默丢弃）；
  3. **层叠沉底**：`C` 停在 `z-index: -1`，视觉上被底面排架与相邻 `D` 卡片反压；
  4. **角标锚点逃逸**：兄弟卡片 `B` 未设 `position: relative`（保持 `static`），导致它内部的 `position: absolute` 状态角标 `NEW` 逃逸飞到外层舞台右上角（2D Canvas 画出红色虚线逃逸牵引线）。
- **怎样算玩错、读数怎么说**：
  - 把 `C` 拖成 `0, 0` → 报「未产生视觉偏移，回到普通流平权状态」；
  - 往左或往右拖过界撞上 `B` 或 `D` → 实测真实 DOM `getBoundingClientRect()` 重叠面积，报「压遮相邻卡片 XX%，影响可读与点击」；
  - 往下拉太深（> 24px）→ 报「原位幽灵空洞过大，排架像缺了一颗牙」；
  - 把 `C` 切到 `position: absolute` → `D` 当场向左冲进 `C` 的位置，蓝虚线原位消失，报「已脱离文档流，原位占位塌陷」；
  - 切到 `bottom+right` 轴向并往右下拖 → 实时 CSS 显示负数 `right/bottom`、往左上拖才显示正数，解释为什么正值代表「从该边向内推」；
  - 把 `z-index` 飙到 `9999` → 报「层叠军备竞赛过载，局部微抬用 `1–2` 即可」；
  - 不给 `B` 设 `relative` → 持续报「`NEW` 状态角标找不到包含块，正逃逸到外层容器角落」。
- **与最近 12 页的区别**：不用独立拉尺、十字把手或通用仪表盘，而是把海报标志性的「1 原始位置 + 2 相对定位后」双排蓝图做成真实可拖动的 CSS `position: relative` 四卡 UI 排架，既测偏移占位也测零偏移锚点与层叠，除 232 外没有任何编号可原样套用。

## 3. 版式骨架
- 忠实承袭 232 原海报的「暖米工程蓝图整页 + 右上朱红大圆压「局」示范刊头 + 上下双排 1/2 虚线对照排架 + 右缘虚线图例诊单 + 底部单黑框圆角微调盘 + 右下朱红四分之一圆印章」骨架，绝不锁 `min-height: 100svh`。
- **1440×900**：容器宽 `1360px`，整座首屏自然落在约 `840px` 内：极细顶眉 → 左置示范大标「相对定位布局」（「局」叠朱红大圆，「位」随 `C` 偏移做微幅实景联动）与红黑双点细线 → 紧凑 `1 原始位置` 对照条 → 虚线分割 → 左 72% 活体 `2 相对定位后` 四卡排架与蓝图 Canvas 标注 × 右 28% 原海报蓝红双虚线图例、白话诊单与实时 CSS 窗 → 底部 1.5px 黑边圆角单带控件盘与右下朱红四分之一圆。
- **2560×1440**：内容区舒展至 `1760px`，四卡排架按比例放大且不空荡。
- **1024×1366 / 768×1024**：自然流纵排，`2 相对定位后` 舞台通栏展宽，图例诊单与控件盘紧接下方，无垂直空洞。
- **390×844**：刊头压紧为单行（保留朱红圆压「局」与校对章），`1 原始位置` 缩成细参考标尺，确保 `2 相对定位后` 四卡活体排架 + 白话诊单稳占首屏 ≥ 48%，四张卡保持舒适纵横比且 `C` 触控区 ≥ 56×56px。
- **844×390 横屏**：顶眉极薄，中段切为左 57% 活体排架 × 右 43% 诊单与核心控件并行，无横向溢出。

## 4. 配色和字体
- **配色（像素实采自 232 原海报）**：
  - 工程暖米纸底 `#F1E9DA`（实采 `#F1E8D9` / `#F2EBDD`），浅象牙交替节 `#F8F4EC`，微暖蓝图灰纸 `#EAE2D2`，03 节深夜制图炭黑暗版 `#141518`；
  - 印刷墨黑 `#0C0C0E`，次正文炭灰 `#3B3A37`，辅注 `#5B5850`；
  - 标志朱红 `#F4280F`（实采 `#F1240A` / `#F7290F`，浅底小字与按钮文字加深至 `#B91C0A` 确保对比度 > 5.5，暗底提亮 `#FF5A42`）；
  - 蓝图虚线钴蓝 `#1E55C9`（实采 `#1E55C9`，暗底提亮 `#7BA6FF`），幽灵浅蓝底 `#E5ECFA`；
  - 硬投影灰 `#AEA7A2`；校准达标深青 `#0F6A58`（暗底 `#4DD4B5`）。
- **字体搭配**（全库唯一，两款西文在最近 12 页全部 0 次使用）：
  - `Noto Sans SC`（400 / 500 / 700 / 900）：中文标题与 UI 技术正文；
  - `Bricolage Grotesque`（500 / 700 / 800，最近 12 页未用）：英文刊头 `RELATIVE POSITIONING` 与标志大字母 `A B C D`；
  - `JetBrains Mono`（400 / 600，最近 12 页未用）：CSS 代码声明、偏移像素坐标与标尺刻度。

## 5. 节目录
- **01 幽灵原位：流中不动，画布微移**（`GHOST FOOTPRINT`）：原话引海报要点 1–2，拆解双阶段排流与 `overflow` 溢出真相；交互为「内联+块级真实段落步进切换台」（对比 `Pass 1 原位` / `Pass 2 relative` / `absolute 塌陷` / `margin 推挤`）。
- **02 四边罗盘：正负方向与过约束陷阱**（`INSET COMPASS`）：温和纠正原海报把 `bottom(+)` / `right(+)` 标成向外推的常见误区，实讲向内推入与 LTR/RTL 过约束消解及 Level 3 逻辑属性；交互为「真实 CSS 四边推杆罗盘 + LTR/RTL 切换」。
- **03 零偏移真身：锚点与层叠上下文**（`CONTAINING BLOCK & Z-INDEX` · 深炭暗版）：讲清生产代码中最常见的无偏移 `position: relative` 两大职责与 `z-index: 9999` 困死陷阱；交互为「双卡叠压实景 + 2.5D Z 轴分层展开透视」。
- **04 从哪来：1997 到 Level 3**（`SPEC EVOLUTION`）：1997 W3C 定位草案 → 1998 CSS2 §9.4.3 → 2011 CSS 2.1 → 当代 CSS Positioned Layout Level 3；交互为「四代规范蓝图板点选对照」。
- **05 什么时候用：四个真实界面微调**（`WHEN TO USE IT`）：图标基线 1–2px 对齐、角标锚点、卡片微错位、拼接输入框 `:focus` 边框抬层；交互为「四组真 UI 部件开关验收箱」。
- **06 什么时候别用：别拿微调干排版的活**（`WHEN NOT TO USE IT`）：整页分栏（链 226/227）、高频动画改用 `transform`、脱流顶位（链 233/234/235/231）、滥设 `z-index`；交互为「`top/left` vs `transform: translate()` 渲染管线对比器」。
- **07 小练习：修好三栏卡片的抬升与角标**（`QUICK PRACTICE`）：4 项中性选项单变量对比，点击即时渲染对应真实 CSS 效果并给理由。
- **08 原海报与关键词**（`ORIGINAL POSTER`）：原海报可放大拖动灯箱（`draggable="false"`、Esc 关闭）、海报原话与同类编号链接。

## 6. 来源与核实网址
- W3C Working Draft (1997-01-31 / 1997-08-19), *Positioning HTML Elements with Cascading Style Sheets*（Scott Furman, Scott Isaacs, Robert Stevahn）: `https://www.w3.org/TR/WD-positioning`
- W3C Recommendation (1998-05-12), *Cascading Style Sheets, level 2 (CSS2)* §9.4.3 Relative positioning（Bert Bos, Håkon Wium Lie, Chris Lilley, Ian Jacobs）: `https://www.w3.org/TR/1998/REC-CSS2-19980512/visuren.html#relative-positioning`
- W3C Recommendation (2011-06-07), *Cascading Style Sheets Level 2 Revision 1 (CSS 2.1)* §9.4.3 Relative positioning: `https://www.w3.org/TR/CSS21/visuren.html#relative-positioning`
- W3C *CSS Positioned Layout Module Level 3*（Elika J. Etemad / fantasai, Tab Atkins Jr.）: `https://www.w3.org/TR/css-position-3/`
- MDN Web Docs, *CSS `position` / Containing block / Stacking context*: `https://developer.mozilla.org/en-US/docs/Web/CSS/position`
- web.dev, *How to create high-performance CSS animations*: `https://web.dev/articles/animations-guide`

## 7. 练习设计
- **题目**：三栏套餐卡（基础版 / 专业版 / 企业版）要同时满足：① 保持三栏横向占位不塌陷；② 让中间「专业版」向上微抬 `12px`；③ 把红色「推荐」角标钉死在「专业版」右上角。下面四段写给「专业版」的样式，哪一段能一次全对？
- **四项只差定位变量（中性标签 A / B / C / D）**：
  - **A**：`position: absolute; top: -12px;`（角标 `absolute; top: -8px; right: -8px;`）→ 错在脱流塌陷，「企业版」左冲盖位。
  - **B**：`position: relative; bottom: 12px;`（角标 `absolute; top: -8px; right: -8px;`）→ **正确**：保留原位占位 + `bottom: +12px` 从底边向上推 `12px` + 成为角标包含块。
  - **C**：`position: relative; top: 12px;`（角标 `absolute; top: -8px; right: -8px;`）→ 错在方向符号相反，正 `top` 向下沉了 `12px`。
  - **D**：`position: static; margin-top: -12px;`（角标 `absolute; top: -8px; right: -8px;`）→ 错在 `static` 不能做包含块，「推荐」角标飞出到外层容器右上角。
