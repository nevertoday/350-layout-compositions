# 226 弹性盒布局（FLEXBOX LAYOUT）· 互动页方案（PLAN）

> 所属分类：网页与 UI / CSS 流、定位与响应  
> 原海报总述：一个维度，多种可能

---

## 1. 一句话道理

传统 CSS 普通流把块级框写死为竖排、行内框写死为横排，容器既不知道自己还剩多少空闲空间，也无法让子项按权重协商宽窄或一键垂直居中；弹性盒布局（`display: flex`）在同一时刻只接管**一根可旋转的主轴与垂直于它的交叉轴**，先把子项按基数摆上轨道，再把剩余空间按 `flex-grow` 分配、把空间赤字按 `flex-shrink × flex-basis` 加权分摊，并用 `align-items` 与 `flex-wrap` 在单轴维度里彻底解决对齐、伸缩与折行问题。

> **对原海报的温和补充（正文 03、05 节以小签说明）**：  
> 1. 原海报 `一行排列（默认不换行）` 图示里 5 块方格工整待在虚线框内，但在真实页面中，默认 `flex-wrap: nowrap` 在容器缩窄到低于子项内容底线（`min-width: auto`）时，子项会直接**溢出刺穿容器**而非无限缩扁。  
> 2. 原海报右下角 `综合示例（应用）` 展示了一整页含顶栏、主区/侧栏、三卡与页脚的界面，但 `一个维度，多种可能` 并非靠一个 `display: flex` 同时管横纵二维——它实际由 **4 层嵌套的一维弹性容器**（1 根外层竖轴 + 3 根内层横轴）协同搭成；若是多行卡片要求跨行严格列对齐，应交给 [227 网格布局](https://layout.xiaoxiaodong.ai/227/play/)。

---

## 2. 开场玩具：一维弹轨工坊（1D Flex Track Bench）

- **核心结构（真实 CSS Flexbox DOM + 2D Canvas X-Ray 透视层，零写死常量）**：
  - 舞台嵌入原海报标志性的**巨幅朱红小写 `f` 建筑结构框**右侧内舱，内含一条真实 `display: flex` 应用顶栏组件（取材自原海报综合示例），由 4 个高度各异的真实 UI 子项构成：`01 LOGO`（46px 高）、`02 搜索栏`（36px 高）、`03 导航组`（30px 高）、`04 操作钮`（38px 高）。
  - 容器右侧边框带有一枚粗朱红实体**「弹轨拉杆」**（标 `data-perf-drag`），支持鼠标拖拽、触摸横滑与键盘 `← / →` 连续改变容器主轴宽度（桌面 300–760px，移动端按容器等比映射）。
  - 叠加在容器上的 2D Canvas X-Ray 层每帧直接调用 `model.js` 读取真实 DOM `getBoundingClientRect()`，实时绘制原海报同款双向朱红主轴/交叉轴箭头（切 `column` 时同步旋转 90°）、各子项相对自然基数的**膨胀 `+px` / 压缩 `-px`** 标尺、未分配剩余空间斜纹、交叉轴中心线偏差折线，以及刺穿虚线框的朱红**实测溢出警示带**。
- **怎么玩（拉轨压测 + 逐项定弹性 + 切轴向对齐）**：
  - 点击 4 个子项本身或下方 4 组策略槽，为每项分配三种真实 CSS 伸缩角色：**锁死**（`flex: 0 0 auto`）、**仅缩**（`flex: 0 1 auto`，CSS 默认初值）、**弹性**（`flex: 1 1 0px; min-width: 0`）。
  - 顶沿配容器轴向控制键：`主轴方向 row / column`、`交叉轴对齐 flex-start / center / stretch`、`换行 nowrap / wrap`，并实时拼接当前生效的真实 CSS 规则条。
- **一打开是什么状态（绝不先给答案）**：
  - 初始停在经典新手翻车态：`flex-direction: row`、`flex-wrap: nowrap`、`align-items: flex-start`；`01 LOGO` 和 `04 操作钮` 被误设为 `弹性`（宽屏下膨胀成笨重横幅），`02 搜索栏` 被误设为固定 `锁死`（宽时不伸、一往左拉就顶破右框），`03 导航组` 为 `仅缩`；四件高度参差不齐、全部挂在顶沿。
- **怎样算玩错、错了读数怎么说（7 类实测状态，靠理解分工过关，绝不可「全点满」蒙混）**：
  1. **溢出破框**：实时 `overflowPx > 1` → 红斜纹标出实测溢出 `+XX px`，说明 `nowrap` 下子项总下限超出容器宽，须把主区改弹性或开启 `wrap`。
  2. **平均主义（全员开弹性）**：4 项全设 `flex: 1` → 判为错态，点明「全员弹性不是自适应，是平均主义——品牌标和操作钮不该抢走主搜索区空间」。
  3. **配角发胖**：`LOGO`、`操作钮` 或 `导航组` 开了 `弹性` 且实测比自然宽多出 `> 8px` → 点名哪一项膨胀了 `+XX px`。
  4. **主区僵死**：没有任何项吸收剩余空间（`搜索栏` 非弹性）且右侧露出未分配余量 → 标出闲置 `+XX px`，指出搜索栏应拿 `flex: 1 1 0`。
  5. **导航被挤塌**：`导航组` 在窄宽下被 `flex-shrink` 压成纵向单字条 → 提醒锁死导航宽度或开启 `wrap`。
  6. **轴向误转竖排**：切到 `column` 时两根轴箭互换 90° → 说明此刻 `flex-grow` 改分垂直高度、不适合横向工具栏。
  7. **交叉轴失齐**：主轴分工已对，但 `align-items` 仍是 `flex-start` 或 `stretch` → 标出四件中线实测偏差或强行拉伸变形，引导切至 `center`。
  8. **成立（一维弹轨就位）**：`row` + `align-items: center` + 品牌标/按钮锁死 + 搜索栏弹性吸收余量 + 导航不发胖不被压塌 + 零溢出。过关后仍鼓励把拉杆拉向极窄端验证 `nowrap` 临界溢出与 `wrap` 优雅折行。
- **与最近做完的 12 页不同在哪**：
  - 225 是深靛紫夜评论流盖流根印章；296 是把 4 块从横排拖进 375px 单列重排；240 是拖双断点切刀驱三硬件框；295 是拖画布外抽屉入画；142/102/020/269/129/187/019/072 分别是封面排字、形状对比、镜像轴、S 轨信息流、古腾堡报版、标点凸排、非对称配重与 3D 三点透视。本页以**实测 CSS Flexbox 单轴余量协商 + 逐项三态伸缩策略 + 旋转轴向透视**为核心，别的编号完全无法套用。

---

## 3. 版式骨架

忠实承袭 226 号原海报的**顶部五图标瑞士报头 + 巨幅朱红小写 `f` 建筑框托起内舱舞台 + 底部朱红大圆收束**骨架：

- **1440×900 与 2560×1440（桌面宽屏）**：
  - 顶眉 32px（分类 + `NO. 226`），下接紧凑瑞士海报报头（左：`弹性盒布局` 900 重黑大字 + 朱红 `FLEXBOX LAYOUT`；竖线右：原海报 5 枚极简线图标 `主轴 / 交叉轴 / 对齐 / 分配 / 换行`，随开场工坊真实体检状态逐枚点亮）。
  - 报头正下展开通栏 **巨幅朱红小写 `f` 框**（顶横梁贯通全宽、左竖柱垂落并在横杠下嵌原海报 5×7 朱红圆点阵，容器宽 `min(1340px, 94vw)`，2560 放宽至 `min(1680px, 86vw)`）；`f` 右侧内舱全宽铺开一维弹轨舞台、4 项伸缩策略槽与白话诊断栏，整套首屏落入 900px 视口。
- **390×844（手机竖屏）**：
  - 压紧报头至 ~66px，巨幅 `f` 凝练为 10px 顶部朱红结构横梁与左侧短柱，释放 100% 宽度给满幅弹轨舞台（舞台+轴线标尺+拉杆占首屏 ≥ 45% 高度），紧接单行轴向切键、2×2 子项策略钮（每钮高度 ≥ 44px）与简洁两行诊断，首屏同见。
- **844×390（手机横屏）**：
  - 顶标压紧为单行 38px；下方切为左 58% 满高弹轨舞台 + 右 42% 轴向键、2×2 子项策略钮与实时诊断，零横向溢出。
- **1024×1366 / 768×1024（平板竖屏）**：
  - 不设 `min-height: 100svh`，内容紧贴自然高度零大片空白；768 下左竖柱收窄，保舞台宽敞。
- **正文八节底色节奏**：
  - 暖石纸 `#EFEAE0`（01）→ 奶油纸 `#F8F3E9`（02）→ 瑞士深墨板 `#151311`（03）→ 奶油纸 `#F8F3E9`（04）→ 暖石纸 `#EFEAE0`（05）→ 瑞士深墨板 `#151311`（06）→ 奶油纸 `#F8F3E9`（07）→ 暖石纸 `#EFEAE0`（08），明暗有致、绝无单侧悬空留白。

---

## 4. 配色和字体

### 配色（严格采样自 `site/public/p/226.webp` 原海报）

| 角色 | 色值 | 来源与对比度验证 |
| --- | --- | --- |
| 档案奶油纸主底 | `#F8F3E9` | 实采原海报主纸底 `#F8F3E9` |
| 暖石次底 / 侧栏灰 | `#EFEAE0` / `#E6E0D3` | 实采原海报侧栏与柔框 `#ECE9DF` |
| 瑞士朱红主色（巨幅 `f` / 实块 / 轴箭） | `#E73E12` | 实采原海报朱红 `#E73E12`，配纯白字 `#FFFFFF` **4.14:1**（大字/粗体按钮过关），配 `#F8F3E9` 图形醒目 |
| 深朱红文字强调（纸底小字/链接） | `#B92D09` | 亮纸底专配，对 `#F8F3E9` 对比度 **5.86:1**、对 `#EFEAE0` **5.40:1** |
| 瑞士重墨黑（主标/正文） | `#111111` | 实采原海报大标黑墨，对 `#F8F3E9` **17.1:1** |
| 暖铅灰辅文（纸底次级文字） | `#4F4A42` | 对 `#F8F3E9` **8.0:1**、对 `#EFEAE0` **7.4:1** |
| 深墨板节底（03 / 06 暗节） | `#151311` | 瑞士印刷暗版底，配奶油字 `#F8F3E9` **16.7:1**、亮朱红 `#FF6238` **5.6:1**、暖银辅文 `#C8C0B4` **10.4:1** |
| 虚线框线与发丝分割线 | `#9F978A` / `#D6CFC2` | 实采原海报虚线容器框与细分割线 |

### 字体搭配（全库唯一，含两款最近 12 页均未使用的字体）

1. **`unbounded`（500 / 700 / 800）** — **最近 12 页未使用**，宽阔锐利的建筑感展示无衬线，专用于 `FLEXBOX LAYOUT`、节号 `01`–`08` 与海报英文大标。
2. **`jetbrains-mono`（400 / 500 / 700）** — **最近 12 页未使用**，清晰干练的技术等宽体，专用于实时 CSS 代码条、属性名标签与 `tabular-nums` 像素实测读数。
3. **`noto-sans-sc`（400 / 500 / 700 / 900）** — 900 重黑呼应原海报厚重几何黑体主标「弹性盒布局」，400–700 用于全部 `h2`、中文正文与内嵌西文人名年份（正文内不混换字体，防基线跳动）。

---

## 5. 节目录（共 8 节，h2 均 ≤ 12 字，相邻节交互不重样）

| 节号 | 标题（字数） | 底色 | 核心内容与同小类链接 | 专属交互（邻节不重复） |
| --- | --- | --- | --- | --- |
| `01` | **一根主轴，九十度旋转**（10） | `#EFEAE0` | 展开原海报 `flex-direction` / `justify-content` / `align-items`（含 `baseline`），讲清方向一转两轴互换；对照 [222 普通流](https://layout.xiaoxiaodong.ai/222/play/)、[223 块级](https://layout.xiaoxiaodong.ai/223/play/)、[224 行内](https://layout.xiaoxiaodong.ai/224/play/)。 | **4 向主轴罗盘 × 5×5 对齐矩阵台**（含真实不同字号 `baseline` 红基线与旋转轴向箭）。 |
| `02` | **伸缩三件套怎么算账**（9） | `#F8F3E9` | 展开原海报 `flex-grow` 与 `flex-shrink / flex-basis`，讲清 `flex: 1`（`0%`）与 `flex-grow: 1`（`auto`）本质差别及加权收缩与 `min-width: auto`。 | **连续容器宽滑块（`<input type="range">`）+ 3 套经典算账 preset + 实时分账公式条**。 |
| `03` | **换行后，行轨归谁管**（9） | `#151311` | 展开原海报 `nowrap`（附温和补充：过窄必溢出）、`wrap / wrap-reverse`、`align-content` 与 `gap`，厘清「行内 `align-items` vs 行间 `align-content`」。 | **多行积木增删盒（`+ / −` 3–10 块）+ 行轨虚线透视**（仅 1 行时实证 `align-content` 无效）。 |
| `04` | **从补丁时代到弹性标准**（10） | `#F8F3E9` | **从哪来**：回顾 [230 表格](https://layout.xiaoxiaodong.ai/230/play/) / [231 浮动](https://layout.xiaoxiaodong.ai/231/play/) / [225 流根](https://layout.xiaoxiaodong.ai/225/play/) / [233 绝对定位](https://layout.xiaoxiaodong.ai/233/play/) 的权宜年代，逐年梳理 2009 → 2012-03 → 2012-09 → 2013 → 2018 → 2021 六个核实里程碑。 | **6 节点规范考古时间轴 + 新旧语法代码对照卡片**。 |
| `05` | **原海报整页怎么搭**（8） | `#EFEAE0` | 还原原海报 `综合示例（应用）` 学习网站，温和澄清「一维如何嵌套搭整页」，并一句话引出 [234 固定定位](https://layout.xiaoxiaodong.ai/234/play/)、[235 粘性定位](https://layout.xiaoxiaodong.ai/235/play/)、[240 响应式](https://layout.xiaoxiaodong.ai/240/play/) 与 [242 容器查询](https://layout.xiaoxiaodong.ai/242/play/)。 | **4 层嵌套剥洋葱 X-Ray 开关（L0–L3 逐层点亮轴线）+ 桌面/手机视口切换**。 |
| `06` | **什么时候别用弹性盒**（9） | `#151311` | **什么时候别用**：多行卡片墙末行歪斜改用 [227 网格](https://layout.xiaoxiaodong.ai/227/play/) / [228 子网格](https://layout.xiaoxiaodong.ai/228/play/)；流淌多栏与错落卡墙改用 [229 多栏](https://layout.xiaoxiaodong.ai/229/play/) / [236 瀑布流](https://layout.xiaoxiaodong.ai/236/play/)；绕排与叠层改用 [231 浮动](https://layout.xiaoxiaodong.ai/231/play/) / [232 相对定位](https://layout.xiaoxiaodong.ai/232/play/) / [237 覆盖](https://layout.xiaoxiaodong.ai/237/play/)；以及 `order` 破坏键盘焦点顺序。 | **3 景真 DOM 翻车对照台**（5 卡 Flex vs Grid、长词顶破 vs `min-width: 0`、交互式 `Tab` 焦点跳序步进器）。 |
| `07` | **小练习：谁会拿到多宽？**（10） | `#F8F3E9` | `600px` 容器内 `60px` 短标签与 `240px` 长标题同设 `flex-grow: 1`（`flex-basis: auto`），预测渲染实宽。 | **A / B / C / D 纯像素盲选 + 真 Flexbox DOM 比例拆账揭晓台（附一键切 `flex: 1` 对照）**。 |
| `08` | **原海报与关键词**（7） | `#EFEAE0` | 原海报灯箱检视、全部 9 枚原海报关键词、底部红圆「一个维度，多种可能」与同小类 `222–242` 全览索引（含 [238 固定宽度](https://layout.xiaoxiaodong.ai/238/play/)、[239 流体](https://layout.xiaoxiaodong.ai/239/play/)、[241 自适应](https://layout.xiaoxiaodong.ai/241/play/)）及标准页脚。 | **原海报缩放拖拽灯箱（`draggable="false"`，`Esc` 关闭）**。 |

---

## 6. 来源（均已访问原页 HTTP 200 核实）

1. **W3C (2009-07-23)**，*Flexible Box Layout Module*（首份公开工作草案，`display: box`，编辑 L. David Baron，前任作者 Neil Deakin、Ian Hickson、David Hyatt）：  
   `https://www.w3.org/TR/2009/WD-css3-flexbox-20090723/`
2. **W3C (2012-03-22)**，*CSS Flexible Box Layout Module*（重写过渡草案，`display: flexbox`，编辑 Tab Atkins Jr.、Alex Mogilevsky、L. David Baron）：  
   `https://www.w3.org/TR/2012/WD-css3-flexbox-20120322/`
3. **W3C (2012-09-18)**，*CSS Flexible Box Layout Module*（首次候选推荐标准 CR，`display: flex` 现代语法定型，编辑 Tab Atkins Jr.、Elika J. Etemad、Alex Mogilevsky）：  
   `https://www.w3.org/TR/2012/CR-css3-flexbox-20120918/`
4. **Philip Walton (2013)**，*Solved by Flexbox — Cleaner, hack-free CSS*：  
   `https://philipwalton.github.io/solved-by-flexbox/`
5. **W3C (2018-11-19)**，*CSS Flexible Box Layout Module Level 1*（候选推荐标准更新版，编辑 Tab Atkins Jr.、Elika J. Etemad / fantasai、Rossen Atanassov）及现行编辑版：  
   `https://www.w3.org/TR/2018/CR-css-flexbox-1-20181119/`  
   `https://www.w3.org/TR/css-flexbox-1/`
6. **WebKit Blog (2021-04-29)**，*New WebKit Features in Safari 14.1*（Safari 14.1 / iOS 14.5 补齐 Flexbox `gap` 原生支持）：  
   `https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/`
7. **MDN Web Docs**，*Basic concepts of flexbox*：  
   `https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox`

---

## 7. 小练习设计

- **题目**：宽 `600px` 的无内边距、无间距弹性容器（`display: flex; gap: 0`）里横向排列两项：甲项内容自然宽 `60px`，乙项内容自然宽 `240px`，两项**都只写了一句 `flex-grow: 1`**（`flex-basis` 保持默认 `auto`）。渲染后甲、乙实宽分别是多少？
- **选项（仅标 A / B / C / D 与纯像素数对，无好坏暗示）**：
  - `A`：`甲 300px · 乙 300px`（把 `flex-grow: 1` 误当作 `flex: 1` 即 `flex-basis: 0%`）
  - `B`（正确）：`甲 210px · 乙 390px`（`flex-basis: auto` 先扣除 `60 + 240 = 300px`，仅剩余 `300px` 按 `1:1` 平分各加 `150px`）
  - `C`：`甲 120px · 乙 480px`（误按 `60:240 = 1:4` 直接等比放大 `600px`）
  - `D`：`甲 60px · 乙 540px`（误以为剩余空间只给长内容项）
- **揭晓**：用真实 CSS Flexbox 渲染出同比例容器与双色拆账条（基数 + 分得余量），并附一键切换 `flex: 1`（`flex-basis: 0%`）立见 `300px / 300px` 的反差。
