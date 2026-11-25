# 244「盒子 BOX」互动页设计方案

## 1. 一句话道理
网页里的每一个元素本质上都是由内容区、内边距、边框、外边距四层嵌套构成的矩形盒子；把「盒内呼吸与边界（padding / border / transparent outline）」和「盒外占位（box-sizing 与 margin）」算明白，容器才不会撑爆父槽、贴边窒息或在高对比模式下失踪。

## 2. 开场玩具
- **名字与形态**：活体四层盒模型解剖台（2D Canvas 1:1 承袭 244 原海报玫瑰粉外边距、纯黑边框、暖奶油内边距与内虚线、深翠青内容核 + 立体白色小立方体 + 右侧四道黑圆点水平引线，外罩原海报黑色虚线父槽边界 `320px`）。
- **怎么玩**：
  - 在画布中直接横向拖拽深翠青内容核（`data-perf-drag`）实时拉伸声明宽度，或在对应色带边缘直接拖拽改写内边距、边框与外边距；
  - 点击画布右侧四条原海报引线标签（外边距 / 边框 / 内边距 / 内容）或下方四栏要点条，选中某一层并用方向键 `←/→` 精确微调；
  - 切换 `box-sizing: content-box` 与 `border-box`、`outline` 透明护边开关；
  - 切换三种真实内容皮层（原海报立方体 / 提示信息卡 / 主要操作按钮）以及 `平视解剖`、`立体剥层`（2.5D 等轴分层视图）与 `高对比 X 光`（模拟系统 forced-colors 剥离背景色）。
- **开场初始状态（0 / 4 撑爆错态，绝不提前给答案）**：
  - `box-sizing: content-box`、`width: 300px`、`padding: 4px`、`border: 10px`、`margin: 26px`（父槽宽 `320px`）。
  - 此时单真源几何实算：`borderBoxW = 328px`（连边框盒都已冲破父槽）、总占宽 `outerW = 380px`（超出父槽 `+60px`，画布右侧直接标出赤红斜纹爆槽区）、内边距仅 `4px` 导致内容紧贴粗黑边框、10px 粗框抢戏、26px 外边距替父级越权占位。
- **怎样算玩错 & 错了读数怎么说**：
  - 爆槽溢出（`borderBoxW > 320` 或 `outerW > 320`）：直指 `content-box` 叠算或外边距越界导致的准确溢出像素值与为什么会挤爆容器或引发折行；
  - 内容压扁（`contentW < 150px`）：在 `border-box` 下把 padding/border 推得过大时，指出内容区被挤成窄柱；
  - 内边距贴边（`< 12px`）或虚胖（`> 36px`）：说明文字贴壁压迫或留白吞噬正文；
  - 粗框压主（`> 6px`）或无框且缺 `transparent outline`（高对比失踪）：说明视觉喧宾夺主或高对比模式剥底色后盒子消失；
  - 负边距吞边（`margin < 0`）或外边距越权（`margin > 16px`）：说明破坏相邻边界。
  - 接受多组合法解：原海报平衡解、Every Layout 无框护边解、紧凑卡片解，甚至 `content-box` 手动扣算达标解均可 4/4 通过。
- **与最近 12 页的差异**：
  - 邻页 243 是深橄榄底垂直三卡堆栈 + 顶部横向游标尺；242 是深靛紫三槽容器宽实验；284 是冰薄荷真表单眼动扫视；201 是鼠尾草绿 8×8 方格；118/117/071/070/034/033/157/323 为图形构图或出版页。
  - 244 是全库唯一明黄包豪斯构造底色的「四层同心盒模型剥层解剖台」，直拖四层实墙 + 立体剥层 + 高对比 X 光 + 原海报四栏竖线实况柱，玩法、视觉和构架完全独立。

## 3. 版式骨架
- 忠实承袭 244 原海报「满幅包豪斯明黄 `#FCC003` 开场展台（不锁 `100svh`，彻底避开平板 1024×1366 空洞）× 顶沿左超粗黑自示范刊头『盒子 BOX』与右 4×4 黑点阵+奶/青/粉三叠方块徽章 × 主区左 60% 同心盒模型蓝图画布（带右侧四道圆点引线）与右 40% 硬边 4px 黑框暖奶油诊单/实时 CSS/层控案头 × 全宽原海报四栏竖线核心要点实况条 × 底沿 6×3 黑点阵+深翠青横杠与直角压脚」。
- **1440×900**：主体宽 `1360px`（`2560×1440` 舒展至 `1720px`），画布与诊单左右并置，紧接原海报四栏要点条。
- **390×844 竖屏**：顶部压紧单行刊头与紧凑皮层切换，等比画布稳占首屏 ≥ 46% 屏高，首屏底沿直接露白话诊单主句与一键切 `border-box` 快钮；四栏要点条转 2×2 清晰方格。
- **844×390 横屏**：切左 55% 盒模型画布 × 右 45% 刊头、诊单与核心按钮并行，不压扁。
- **正文七节表面交替**：暖奶油纸 `#F7F1E2`（01/04/06）→ 淡日光黄 `#FDF4D2`（02）→ 深翠青暗室 `#042B26`（03）→ 淡蔷薇粉纸 `#FCEEF0`（05）→ 原海报包豪斯明黄 `#FCC003`（07 与页脚）。

## 4. 配色和字体
- **配色（逐像素采自 244 原海报）**：
  - 包豪斯明黄主底 `#FCC003` / 浅日光纸 `#FDF4D2`
  - 深翠青内容色 `#05796B` / 高对比文字深青 `#034C43` / 03 节深翠青暗室 `#042B26` & 暗舱 `#083D36` / 暗底亮青 `#6CE6D2`
  - 玫瑰珊瑚粉外边距 `#F47F92` / 浅纸深莓字 `#98203A` / 淡粉纸 `#FCEEF0`
  - 暖奶油内边距纸 `#F2EBDD` / 洁净奶油纸 `#F7F1E2` / 亮奶油 `#FAF6EC`
  - 纯黑边框与主墨 `#080A09` / 次墨 `#333A37`
  - 警示赤红 `#B41E22`（浅底）/ `#FF8282`（暗底）专标溢出与错态
- **字体搭配（全库唯一，与 243/242 零西文重合，三款西文在近 12 页全部 0 次使用）**：
  - `noto-sans-sc`（400 / 500 / 700 / 900）：中文主标与理性正文
  - `syne`（700 / 800，近 12 页 0 次）：宽几何展示英文字 `BOX` 与章节标号
  - `inter`（400 / 600，近 12 页 0 次）：英文副标与界面注脚
  - `jetbrains-mono`（400 / 600，近 12 页 0 次）：实时 CSS 代码、像素算式与表格读数

## 5. 节目录
- `01` 四层盒模型解剖（`FOUR LAYERS`）：引述原海报四点定义，用「点击热区与 `background-clip` 透视器」点击实测内/外边距在背景绘制与点击命中上的本质区别。
- `02` 算宽陷阱：标准与边界盒（`BOX-SIZING MATH`）：拆解 `content-box` 致 `50%` 两栏折行的原因，用「双栏并排折行实验室」现场切换 `box-sizing` 与内外边框厚观察真实 DOM 折行。
- `03` 留白分工与高对比护边（`BOUNDARY & CONTRAST`）：深翠青暗室，温和补充原海报把外边距画成实粉带容易引起的误解，并结合 *Every Layout* 说明盒内外分工与 `outline: 2px solid transparent` 护边；交互为「系统高对比 `forced-colors` X 光切换台」。
- `04` 从 CSS1 到布局原语（`ORIGIN & STANDARDS`）：按可查证的一手 W3C 与文献时间线梳理 1996 CSS1 → IE5 盒模型分歧 → 2012 Paul Irish → 2018 CSS UI 3 → 2019 *Every Layout* → 2023/2024 CSS Box Model 3；交互为「年代代码规范切换卡」。
- `05` 什么时候用，何时别用（`WHEN TO USE & AVOID`）：给出四类适用场景与四类明确反例（套娃盒、行内词组、定比媒体、跨区布局），配「套娃盒子剥层压测器」亲手切换 1–4 层嵌套看 340px 窄屏如何被边距吃空。
- `06` 小练习：挑出最稳的盒子（`PRACTICE`）：320px 侧栏提醒卡四选一（方案 A/B/C/D 中性标签，仅盒模型属性各差一个变量），选后立即渲染高对比验证与几何理由。
- `07` 原海报与关键词（`ORIGINAL POSTER`）：高清展示 244 原海报（点击放大、拖动、`Esc` 关闭）、原海报四关键词、同小类 243–254 导航链接与页脚。

## 6. 来源（核实用网址）
- W3C *Cascading Style Sheets, level 1 (CSS1)*, Håkon Wium Lie & Bert Bos, W3C Recommendation, 1996-12-17: `https://www.w3.org/TR/REC-CSS1/`
- Paul Irish, *`* { box-sizing: border-box }` FTW*, Feb 2012 (updated Aug 2014): `https://www.paulirish.com/2012/box-sizing-border-box-ftw/`
- W3C *CSS Basic User Interface Module Level 3 (CSS3 UI)*, W3C Recommendation, 2018-06-21: `https://www.w3.org/TR/css-ui-3/`
- Heydon Pickering & Andy Bell, *Every Layout — The Box* (2019): `https://every-layout.dev/layouts/box/`
- W3C *CSS Box Model Module Level 3*, W3C Recommendation, 2023-04-06 (updated 2024-04-11): `https://www.w3.org/TR/css-box-3/`
- MDN Web Docs, *The box model*: `https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model`

## 7. 练习
- **题干**：在 `320px` 宽的侧栏槽位里放一张浅色提示卡，要求卡身刚好填满不溢出、文字不贴边，且在系统高对比模式（背景色被剥离）下依然看得出边框轮廓。以下四个方案宽都是 `320px`，哪一个最稳妥？
- **四个选项（标签仅写 方案 A / B / C / D，只差一个变量）**：
  - 方案 A：`box-sizing: content-box; width: 320px; padding: 20px; border: 2px solid; margin: 0;`（唯一错因：`content-box` 把总宽撑成 `364px` 溢出）
  - 方案 B：`box-sizing: border-box; width: 320px; padding: 2px; border: 2px solid; margin: 0;`（唯一错因：`padding: 2px` 内边距窒息贴边）
  - 方案 C（正确）：`box-sizing: border-box; width: 320px; padding: 20px; border: 0; outline: 2px solid transparent; outline-offset: -2px; margin: 0;`（总宽稳锁 `320px`、内部留白舒展、无外边距越权、高对比下透明轮廓自动显形）
  - 方案 D：`box-sizing: border-box; width: 320px; padding: 20px; border: 0; margin: 0;`（唯一错因：无实边也无透明 `outline`，高对比剥离背景后轮廓彻底消失）
