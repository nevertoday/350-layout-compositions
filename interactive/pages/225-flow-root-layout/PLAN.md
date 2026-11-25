# 225 流根布局（FLOW-ROOT LAYOUT）· 互动页方案（PLAN）

> 所属分类：网页与 UI / CSS 流、定位与响应  
> 原海报总述：创建独立的排版上下文，隔离内部流动 CREATE AN INDEPENDENT FLOW CONTEXT, ISOLATE INTERNAL FLOW

---

## 1. 一句话道理

普通 `display: block` 容器和外部页面共享同一个块格式化上下文（BFC），于是容器里的浮动会刺穿底边撞歪外面的兄弟元素、子元素的上下外边距会穿透父框把整块拽偏、外部浮动也会钻进容器搅乱正文；给容器声明 `display: flow-root`，就是在普通文档流里种下一颗新的「流之根」——不改它块级占满整行的外观，也不靠裁剪或伪元素打补丁，只用一行纯正声明建立零副作用的独立 BFC，把内部浮动与子元素外边距封在边界之内、把外部浮动拦在边界之外。

> **对原海报的温和补充（正文 01、06 节以小签说明）**：  
> 1. 原海报第三支柱题为「清除影响 CLEAR（`×` + 三横条）」，描述的是对外部布局的干净结果，但机制上 `display: flow-root` 并不是在受害者身上打 `clear: both`（把后面的元素硬推下去），而是从源头把父容器封成独立 BFC，顺带还解决了原海报未画出的**父子外边距穿透**与**避让外部浮动**两大难题。  
> 2. 原海报将其命名为「流根布局」，需温和点明：它内部依然是 [222 普通流布局](https://layout.xiaoxiaodong.ai/222/play/)（标准双值语法即 `display: block flow-root`），本质是一枚**流隔离开关**而非多列网格系统；要做等高对齐或二维轨道排版，应交给 [226 弹性盒布局](https://layout.xiaoxiaodong.ai/226/play/) 或 [227 网格布局](https://layout.xiaoxiaodong.ai/227/play/)。

---

## 2. 开场玩具：流根印章（Flow-Root Stamp Workbench）

- **为什么改版**：页面标题与原海报代码本身已出现 `flow-root`，若开场直接并排五个属性签，用户点一下即过关、答案提前暴露。因此开场改成「**把流根印章盖在哪个选择器层级上**」的真实场景诊断，四种历史偏方的横向对比统一挪到 **04 节** 并入体检矩阵。
- **核心架构（真实评论流 DOM + 2D Canvas X-Ray 标注层，零写死常量）**：
  - 舞台中央是一列真实 CSS 渲染的评论流 `.feed`（深蓝灰点阵舱底 `#131A33`，边框以 `outline` 绘制以避免抑制真实外边距合并），自上而下依次包含：
    1. **3 张真实评论卡 `.comment`**（共用类选择器 `.comment`）：每张内含一枚左浮动头像 `.avatar`（`float: left`，高出短评正文）与一段带真实 `margin-top: 16px` 的短评 `p`；
    2. **1 块公告 `.notice`**：内含一枚左浮动小插图 `.notice-fig` 与 **2 段需跨图绕排的正文 `p`**（第一段在插图右侧，第二段从插图右侧接续并自然折回插图下方占满全宽）；
    3. **1 条页脚 `.feed-foot`**。
  - 透明 2D Canvas X-Ray 层叠加在评论流之上，每帧读取 `model.js` 的真实 DOM 实测结果（`getBoundingClientRect()` 与文本 `Range` 行盒坐标），动态绘制：顶部外边距穿透双箭头、浮动漏出底边的玫瑰粉斜纹冲突区、三张头像的阶梯水平错位尺、公告绕排流线（或误盖 `p` 后的插图下空洞警示框），以及拖起印章时的实时目标高亮框。
- **怎么玩（拖拽印章 / 点击选择器 / 键盘三通道）**：
  - 用户手里只有 **2 枚流根印章（`display: flow-root`）**，按 **类 / 标签选择器** 生效（共有 5 个可盖层级：`.feed`、`.comment`、`.avatar`、`p`、`.notice`；盖在 `.comment` 上时 3 张评论卡一起生效，盖在 `p` 上时 3 段评论正文与 2 段公告正文一起生效）。
  - 拖起托盘里的实体印章（印章 1 标 `data-perf-drag`）直接盖到评论流里的任意区块，或直接点击评论流中的元素、点击托盘下方的 5 枚选择器槽盖章/摘章（键盘 Tab + Enter/Space 亦可操作，`R` 重置）。
  - 底沿原海报同款双圆点粉框代码条不剧透答案，而是**随用户当前盖章实时拼出真实 CSS 规则**（初始显示 `/* 尚未盖章：全员 display: block */`）。
- **一打开是什么状态（绝不先给答案）**：
  - 0 枚印章，所有区块均为默认 `display: block`。
  - 真实 DOM 同时暴露两类典型故障：① 第 1 张 `.comment` 的浮动头像探出底边，把第 2、3 张 `.comment` 的浮动头像逐级向右顶偏形成**浮动阶梯**，第 3 张头像顺带刺进下方 `.notice`；② 首张 `.comment` 首段 `p` 的 `margin-top: 16px` 穿透父框与 `.feed` 顶沿，把整条评论流顶沿向下拽离顶部基准虚线 `16px`。此时公告 `.notice` 内部插图跨两段绕排完好。
- **怎样算玩错、错了读数怎么说（不同层级各有真实 CSS 后果）**：
  - **盖在 `.avatar`（浮动元素本身）**：浮动元素天生就是独立 BFC，给它加 `flow-root` 只隔离它自己内部，救不了父盒 `.comment`；实测浮动漏出、阶梯错位、顶距穿透**纹丝不动**。
  - **盖在 `p`（正文段落）**：不仅 `.comment` 依然非 BFC（漏出与阶梯仍在）、首段 `margin-top` 依然穿出父盒（BFC 只隔离自己与子元素，不阻止自己与普通父盒合并），还会让公告块里的第 2 段 `p` 变成独立矩形 BFC，强行避开左浮插图、**截断绕排并在插图下方留下大片空洞**！
  - **盖在 `.feed`（最外层评论流外壳）**：顶距穿透立刻归 `0px`、最外层不再漏出，但三张 `.comment` 依然共享 `.feed` 这同一个 BFC，三张头像**照样互相撞出浮动阶梯**、第 3 张照样刺进 `.notice`。
  - **盖在 `.notice`（仅盖公告块）**：公告块本身隔离了，但上方 3 张 `.comment` 的浮动阶梯与顶距穿透全未解决。
  - **盖 `.comment` + `p`（过量误伤）**：评论卡齐了，但第 2 枚印章误伤 `p`，把公告绕排硬切成了右侧直筒 → 判为未过关，提示摘下 `p` 上的印章。
  - **正解：只盖 `.comment`（1/2 枚即精准达标，且不殃及公告绕排）**：三张 `.comment` 同步建独立流根，各自严丝合缝包住浮动头像（漏出 `0px`、阶梯 `0px`）、锁住首段顶距（顶距穿透 `0px`），同时公告 `.notice` 内部保持普通流绕排（绕排完好），省下第 2 枚印章；若用户多盖 `.notice`（`.comment` + `.notice`）虽不破绕排也达标，读数会温柔说明 `.comment` 已解决全部故障、`.notice` 那枚作为公告兜底可选但非必需。
- **与最近做完的 12 页不同在哪**：
  - 彻底避开 **239 流体布局**（拖单窗右墙拉宽三轨）、**240 响应式布局**（标尺双切刀驱三设备）、**295 画布外模式**（拖拉抽屉进视口）、**296 堆叠重排**（逐块拖入单列）、**186/187/129**（活字铅空/标点凸排/报版对调）及 **018/019/072/101/128**。开场以「2 枚印章 × CSS 选择器层级作用域」操纵真实 BFC 隔离边界，别的编号完全无法套用。

---

## 3. 版式骨架

承袭 225 号原海报的**圆角玫瑰粉尖角框 `∨` + 左右虚线圆点标注 + 点阵主舱 + 底沿双圆点粉框代码条**骨架，并刻意与同为深底青色的 **128 号** 拉开距离（用深靛紫夜 `#140E32`、玫瑰兰粉 `#E27AA5`、点阵底纹与圆角尖角框，**不用整片虚线网格**）：

- **1440×900（及 2560×1440 宽屏）**：
  - 顶沿极简细眉（~32px）。
  - 玫瑰粉圆角尖角书扉头（~108px，主容器宽 `min(1320px, 92vw)`，2560 放宽至 `min(1640px, 84vw)`），底边尖角 `∨` 正指下方评论流。
  - **三段平衡舞台**：左翼 `22%` 排两条玫瑰粉虚线圆点实测标注（`印章与漏出` / `阶梯错位`）、中舱 `56%` 排真实评论流与 Canvas X-Ray 透视层、右翼 `22%` 排两条青绿虚线圆点实测标注（`顶距穿透` / `公告绕排`）。
  - 底沿排 **2 枚流根印章托盘 + 5 枚类选择器盖章槽 + 实时代码粉框条 + 白话诊断**，整套首屏落入 900px 视口内。
- **390×844（手机竖屏）**：
  - 顶眉与玫瑰粉尖角头压紧至 ~86px（总述移到诊断下方/01 节），首屏**同时呈现原尺寸真实评论流（不压扁、不缩放，稳占 ≥ 45% 屏高）、4 项紧凑实测读数、2 枚印章托盘 + 两行（3+2）类选择器按钮（每枚点击区高度 ≥ 44px，绝不把 5 个签挤成一行）以及一行实时诊断**。
- **844×390（手机横屏）**：
  - 顶眉压紧集成标题；下方维持 **左 58% 真实评论流舞台 + 右 42% 印章托盘、两行选择器钮、实时代码条与两行诊断**，零横向溢出与遮挡。
- **768×1024 / 1024×1366（竖屏平板）**：
  - 不写 `min-height: 100svh`，内容自然收紧；1024 保持三段平衡，768 将四路读数折为舞台下 4 列紧排。
- **正文八节底色节奏**：
  - 在深靛紫夜 `#140E32`、深紫幕布 `#1E1544` 与两段暖奶油纸 `#F3EFE4`（03 历史、06 避坑）间交替，双栏均配 `sticky` 或等高排布杜绝单侧留白。

---

## 4. 配色和字体

### 配色（严格实采自 `site/public/p/225.webp` 原海报，以玫瑰粉 + 点阵 + 尖角框鲜明区分于 128）

| 角色 | 色值 | 来源与对比度 |
| --- | --- | --- |
| 深靛紫夜主底 | `#140E32` | 实采原海报主底 `#140E32` |
| 次级深紫幕布 / 公告框底 | `#1E1544` / `#25163B` | 实采原海报下框底 `#25163B` |
| 评论流内舱深蓝灰 | `#131A33` | 实采原海报中舱 `#131A33`（叠青绿圆点阵，不用虚线网格） |
| 暖奶油白（大标 / 亮节纸底） | `#F3EFE4` | 实采原海报大标 `#FAF9EE` 微柔化，配 `#140E32` **15.8:1** |
| 浅薰衣草灰（暗底辅文） | `#C4BED9` | 配 `#140E32` **10.1:1**、配 `#1E1544` **8.9:1** |
| 青绿流根主色（暗底） | `#63C2C8` | 实采原海报青绿 `#63C2C8`，配 `#140E32` **9.2:1** |
| 深海青（暖奶油底强调色） | `#14666E` | 亮底专配，对比度 **5.8:1** |
| 玫瑰兰粉（暗底框/印章/警示） | `#E27AA5` | 实采原海报粉框与粉图形，配 `#140E32` **6.8:1** |
| 深玫瑰梅红（暖奶油底强调色） | `#A6265B` | 亮底专配，对比度 **6.2:1** |
| 深靛墨字（暖奶油底正文） | `#19123B` | 配 `#F3EFE4` **14.9:1**；亮底辅灰 `#4E4769` **7.8:1** |

### 字体搭配（全站唯一，含两款最近 12 页未用字体）

1. **`zcool-qingke-huangyou`（400）** — **最近 12 页未使用**，专用于主标题「流根布局」与少量大展示字（构建后用 `npm run glyphs -- 225` 核验无缺字）。
2. **`manrope`（500 / 700 / 800）** — **最近 12 页未使用**，专用于 `FLOW-ROOT LAYOUT`、节号 `01`–`08` 与海报英文小标。
3. **`ibm-plex-mono`（400 / 500 / 600）** — 专用于选择器印章、实时代码条、考古源码与 `tabular-nums` 实测读数。
4. **`noto-sans-sc`（400 / 500 / 700）** — 全页 `h2`、中文正文与按钮文案（正文段落内嵌西文人名、年份、属性名与正文保持同字体，防止基线跳动）。

---

## 5. 节目录（共 8 节，h2 均 ≤ 12 字，邻节不重复同类控件）

| 节号 | 标题（字数） | 底色 | 一句话内容、温和补充与同小类链接 | 专属交互控件（邻节不重样） |
| --- | --- | --- | --- | --- |
| `01` | **一座自给自足的小容器**（10） | `#1E1544` | 展开原海报三大特性（`独立上下文` / `包含` / `清除影响`）；温和补充说明 `flow-root` 是把 [223 块级布局](https://layout.xiaoxiaodong.ai/223/play/) 容器封成独立 [222 普通流布局](https://layout.xiaoxiaodong.ai/222/play/) 根，而非对外部打 `clear: both`。 | **原海报三徽标解剖台**：点选四角框 / 虚线包含圆 / 粉叉三横条切换解剖微剖面，单键翻转「未建 BFC ↔ 建流根」。 |
| `02` | **顶距穿透与侧浮避让**（10） | `#140E32` | 讲清原海报未画出的 BFC 另外两项关键行为：① 阻止父子外边距穿透；② 避让 [231 浮动布局](https://layout.xiaoxiaodong.ai/231/play/) 侧图形成矩形独立列（媒体对象）。 | **双场景连续卡尺对照台**：切场景并用 `<input type="range">` 连续调 `margin-top (0–48px)` 或侧浮宽 `(56–168px)`，左右并排真 DOM 实时读差值。 |
| `03` | **从补丁时代到流根标准**（10） | `#F3EFE4` | **从哪来**：1998 CSS2 §9.4.1 → 2004-05-14 Tony Aslett / PIE `:after` 清浮动 → 2010-06-25 Nicole Sullivan 媒体对象 → 2011-04-21 Gallagher micro clearfix & 2011-06-07 CSS 2.1 → 2015-07-21 W3C Display L3 WD 首次引入 `flow-root` → 2017-01-24 Rachel Andrew 报道落地预览版与 2017–2020 全线支持。 | **6 年代源码考古印章带**：横向切换 6 枚年份印章，直看各时期真实 CSS 代码、行数与遗留隐患。 |
| `04` | **老偏方为什么总留后遗症**（11） | `#1E1544` | 承接五种清浮动写法的横向对比与 Display L3 双值语法（`block/inline` × `flow/flow-root`）；一句话区分 [224 行内布局](https://layout.xiaoxiaodong.ai/224/play/) 与 [233 绝对定位布局](https://layout.xiaoxiaodong.ai/233/play/)。 | **五方案活体体检舱（`.card` 必设 `position: relative` 实裁绝对定位气泡，配浮动高度卡尺按实测浮动高与正文高动态判断「图矮暂时藏住漏水」警告）+ 2×2 双值拼装器 + 五方案体检矩阵**。 |
| `05` | **实战里的三个高频用法**（10） | `#140E32` | 在已有 [226 弹性盒布局](https://layout.xiaoxiaodong.ai/226/play/) 与 [227 网格布局](https://layout.xiaoxiaodong.ai/227/play/) 的今天，仍最顺手的三种轻场景：杂志首图绕排容器、评论媒体对象、防穿顶公告横幅。 | **三联真实组件独立拨片卡**：每卡自带 `block ↔ flow-root` 拨片 + 全局边界透视复选开关。 |
| `06` | **什么时候别用流根**（8） | `#F3EFE4` | **什么时候别用**：① 多列对齐与等高分配改用 [226 弹性盒布局](https://layout.xiaoxiaodong.ai/226/play/) / [227 网格布局](https://layout.xiaoxiaodong.ai/227/play/) / [229 多栏布局](https://layout.xiaoxiaodong.ai/229/play/)；② 需要插图跨多段绕排时别给段落加 `flow-root`；③ **给分节外壳加 `flow-root` 后，节标题 `margin-top` 不再和外壳合并，节顶平白多出空白**（同时澄清：BFC 根自身外边距仍与相邻兄弟合并，不合并的只是它与首末子元素之间）；④ 配合 [235 粘性定位布局](https://layout.xiaoxiaodong.ai/235/play/) 吸顶时，废掉吸顶的是 `overflow: hidden` 而非 `flow-root`。 | **四场景反例对照簿**：4 场景切换真 DOM 实测对照（第 3 景实测节顶 `0px` vs `+20px` 多余空白；第 4 景内嵌真可滚 `position: sticky` 视口）。 |
| `07` | **小练习：外边距算得准吗？**（11） | `#1E1544` | 全新外边距合并预测题（详见第 7 项）。 | **A / B / C / D 纯数字盲选 + 同源实测揭晓台**（答后用 `model.js` 同一个实测函数量出真 DOM 距离并支持一键切 `block` 对照）。 |
| `08` | **原海报与关键词**（7） | `#140E32` | 完整原海报、海报四枚关键词、同小类 `222–242` 一句话速览链接与标准一行页脚。 | **原海报灯箱缩放与拖拽检视器**（`draggable="false"`，`Esc` 关闭）。 |

---

## 6. 来源（全部逐页打开原件 HTTP 200 核实）

1. **W3C (1998-05-12)**，*Cascading Style Sheets, level 2 (CSS2 Specification)* — §9.4.1 *Block formatting contexts*（首次正式定义 BFC）：  
   `https://www.w3.org/TR/1998/REC-CSS2-19980512/visuren.html#block-formatting`
2. **Tony Aslett / Position Is Everything (2004-05-14)**，*How To Clear Floats Without Structural Markup*（原址 `http://www.positioniseverything.net/easyclearing.html` 现已 404，经 2004-12-04 Internet Archive 存档核实创建日期 May 14, 2004 及 Tony Aslett 归属）：  
   `https://web.archive.org/web/20041204032833/http://www.positioniseverything.net/easyclearing.html`
3. **Nicole Sullivan (2010-06-25)**，*"The media object saves hundreds of lines of code"*，Stubbornella：  
   `https://www.stubbornella.org/2010/06/25/the-media-object-saves-hundreds-of-lines-of-code/`
4. **Nicolas Gallagher (2011-04-21)**，*"A new micro clearfix hack"*（页面 `<time datetime="April 21, 2011">` 核实；承接 Thierry Koblentz *clearfix reloaded*，用 `:before / :after { display: table }` 兼顾阻止首子顶边距塌陷）：  
   `https://nicolasgallagher.com/micro-clearfix-hack/`
5. **W3C (2011-06-07)**，*Cascading Style Sheets Level 2 Revision 1 (CSS 2.1)* — §9.4.1 / §8.3.1 / §10.6.7：  
   `https://www.w3.org/TR/CSS21/visuren.html#block-formatting`  
   `https://www.w3.org/TR/CSS21/box.html#collapsing-margins`  
   `https://www.w3.org/TR/CSS21/visudet.html#root-height`
6. **W3C CSS Display Module Level 3**：经逐版比对，**2014-09-11 WD** 不含 `flow-root`；**2015-07-21 Working Draft** 变更日志明确记载首次创建 `flow` 与 `flow-root` 内显示类型以替代 `::after { clear: both }` 与 `overflow: hidden`；**2015-10-15 Working Draft** 原文含 24 处 `flow-root` 延续该定义；2018-08-28 进入 CR，现行规范定义于 §2.2：  
   `https://www.w3.org/TR/2015/WD-css-display-3-20150721/`  
   `https://www.w3.org/TR/2015/WD-css-display-3-20151015/`  
   `https://www.w3.org/TR/css-display-3/#valdef-display-flow-root`
7. **Rachel Andrew (2017-01-24)**，*"The end of the clearfix hack?"*（页面 `<time datetime="2017-01-24">` 核实，报道 `display: flow-root` 落地 Chrome Canary 与 Firefox Nightlies）：  
   `https://rachelandrew.co.uk/archives/2017/01/24/the-end-of-the-clearfix-hack/`
8. **MDN Web Docs & Can I use**（Firefox 53、Chrome 58、Safari 13 / iOS Safari 13、Edge 79 全线支持）：  
   `https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Block_formatting_context`  
   `https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display`  
   `https://caniuse.com/flow-root`

---

## 7. 小练习设计（外边距合并精准预测题 + 同源 DOM 实测揭晓）

- **题目**：同一普通流容器里上下紧挨着两张 `.card`，样式只有：
  ```css
  .card { display: flow-root; margin: 32px 0; }
  .card p:first-child { margin-top: 24px; }
  ```
  两张卡均无 `border` 与 `padding`。请预测两个真实像素距离：① **两张 `.card` 外沿之间**；② **每张卡顶沿到内部首段 `p` 上沿**。
- **四个选项（标签仅写 `A / B / C / D`，只改数字、零暗示词）**：
  - **`A`**：`64px` / `24px`（误以为 BFC 根自身与相邻兄弟也不合并外边距）
  - **`B`（正确答案）**：`32px` / `24px`（BFC 根作为外部兄弟外边距照常合并 `max(32, 32) = 32px`；但阻止了与首子元素的合并，卡顶到首段实为 `24px`）
  - **`C`**：`32px` / `0px`（按普通 `display: block` 顶距穿出父框来估算）
  - **`D`**：`56px` / `0px`（误将卡外边距 `32px` 与首段 `24px` 相加推出卡外）
- **揭晓方式**：提交选项后，立刻用真实 DOM 渲染出两张 `.card`，并调用与正文共用的 `measureMarginGap()` 实测函数直接读出 `card2.top - card1.bottom` 与 `firstP.top - card1.top` 叠加标尺展示；另配一键「切换 `display: block` 对照」，亲眼看到卡顶到首段瞬间从 `24px` 坍缩成 `0px`。
