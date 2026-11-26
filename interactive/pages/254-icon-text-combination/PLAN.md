# 254 图标文字组合（ICON-TEXT COMBINATION）设计方案

## 1. 一句话道理
图标负责在扫视瞬间用图形形状「抢先锚定」，文字负责把模糊的图形隐喻「一锤定音」；只有当两者的**组内间距明显小于组间外距**、**光学纵轴对齐**、**体量权重相称**时，眼睛才会把它们读成同一个认知单元（格式塔亲密性 + 双重编码），而不是漂浮的贴纸或猜谜游戏。

## 2. 开场玩具：图文联组校样板（Icon-Text Pairing & Optical Lockup Bench）
- **载体与动作**：直接落于 254 原海报满幅柿红展面（`#EC4109`）的 2D Canvas（标 `data-perf-drag`），1:1 承袭原海报 2×3 标本矩阵（目标 / 时间 / 灵感 / 学习 / 成长 / 协作）及中央黑线与三枚黑圆隔点，支持在 **原海报 6 组 / 导航栏 UI / 操作列表** 三个真实场景间切换。
  - **画布横向拖动（含触屏横滑与方向键 `←/→`）**：连续推拉「图字内距（`internalGap`, 0–52px）」，实时触发格式塔亲密性临界判定；一旦内距逼近或超过列间/项间组距，画布直接浮现「跨组错连引力虚线」，让用户亲眼看到右列圆标是如何被吸到左列文字上的。
  - **画布纵向拖动图标圆盘（或方向键 `↑/↓`）**：连续偏移图标的「光学纵轴（`verticalOffset`, -18..+18px）」，在画布上浮现原海报式细黑中轴基准线，直观看见文字上下颠簸或对齐。
  - **直点画布任意圆标**：将该单元装入底部 1:1 复刻原海报的**实黑「= 成品单元」检视匣**，查看这一组的单真源实测几何与实时 CSS；点击底部三枚虚线公式框可调图标尺寸（`0.45×–1.55×`）、隐藏文字/图标、切左右/上下排布或故意制造语义错配。
- **开场状态（非答案）**：刻意停在三重真实坏态——`internalGap = 44px`（远超当前 `groupGap = 20px`，外/内比 `0.45×` 形成**亲密性倒挂**，左右列跨组错配）+ `verticalOffset = +14px`（**光学下沉脱轴**）+ `iconScale = 0.60×`（**蚁图失认**）。
- **怎样算玩错（7 类双向真错态，全由 `model.js` 从实绘图标框、文字框与列槽矩形单真源计算）**：
  1. `proximity-invert`（亲密性倒挂）：内距 ≥ 组距（外/内 ≤ 1.0×）→ 跨组误配；外/内 < 1.5× → 边界模糊；
  2. `collision-zero`（零缝撞字，反方向拉过头）：内距 < 6px → 图形边缘挤压/贴撞首字；
  3. `icon-too-small`（蚁图失认）：缩放 < 0.72× → 图标缩成视觉灰点失去锚点；
  4. `icon-too-large`（巨图压字，反方向拉过头）：缩放 > 1.32× → 巨圆侵占文字栏、压扁标签；
  5. `axis-drift`（光学脱轴）：纵偏绝对值 > 3px（偏上漂浮或偏下坠落）→ 扫视视线上下跳动；
  6. `missing-half`（单腿瘸行）：纯图标无字（猜谜导航）或纯文字无图（失去图形锚点）；
  7. `semantic-mismatch`（图意背离）：打开「图标错意」把时钟配给灵感、灯泡配给时间 → 图形识别与文字理解打架。
- **多组合法解**：支持「原海报经典解」「紧凑工具栏解」「上下堆叠解」以及用户任意拖入健康区间（内距 ≥ 6px、外/内 ≥ 1.5×、图标尺度 0.72×–1.32×、轴差 ≤ 3px、图文俱全且语义相合）的合法组合；读数永远讲清「读者眼睛会怎么看」，绝不报假精确百分比。
- **与最近 12 页的差异**：近 12 页里 043 是深渊冰青倒三角冰山漏斗、168 是暖米建筑轴景双翼图、131 是极夜星图信噪比、212 是钴蓝横排左起校排、081 是松青暖米强制透视走廊、332 是深松绿四圆镜起承转合、298 是松绿立体折页、167 是炭黑酸黄绿引语断行、253 是深梅紫 3D Z 轴叠层剥离、042 是暖沙立体金字塔砌石、130 是深靛紫层蛋糕切层、211 是淡青解构网格切刀；本页独创「满幅柿红公式海报 × 活体亲密性跨组引力实时校准 × 底部虚线公式盒组装成实黑成品匣」，且只针对图文组合的亲密性/尺度/光学轴/语义错配，任何其他编号都无法套用。

## 3. 版式骨架
忠实转译 254 原海报的「通栏柿红公式海报」纵轴骨架（零深色通用顶栏、零左右仪表盘侧箱、不锁 `100svh` 避平板空洞）：
- **1440×900（宽屏，主宽 1380px；2560×1440 舒展至 1680px）**：
  - 顶沿开放海报刊头：左置自示范字距联动巨标「图标文字 组合」（1:1 复刻原海报 `┌` 与 `┌ ┘` 细黑直角括弧 + 右上黑圆与钴蓝圆），下置 `Anton` 凝黑英文副标 `ICON-TEXT COMBINATION`；右置实黑状态印章与 3 场景切签。
  - 通栏三段公式实况带：`[■ 眼] 图形识别` `+` `[■ T] 文字补充` `+` `[■ 格] 组合成组`，每项配原海报点状虚下划线与实时单真源状态签。
  - 细黑线 + 居中倒黑三角 `▼` → 全宽 2×3 活体图文标本画布（带中央竖线与三枚黑圆节点）。
  - 细黑线 + 居中倒黑三角 `▼` → 底部 1:1 原海报公式控制条：左 62% 为三枚圆角虚线框（`● ICON` `+` `T LABEL` `+` `≡ ASSOCIATION`）内置紧凑原生控件，`=` 号右接 38% 实黑成品诊断匣（选中单元微缩预览 + 白话「为什么」诊单 + 一键校准 + 实时 CSS 匣）→ 底沿钴蓝点阵装饰带 `ICON · LABEL · ASSOCIATION`。
- **1024×1366 / 768×1024 平板**：自然流排，画布保持等比圆标绝不拉扁，底部公式框整齐收齐，无留白空洞。
- **390×844 手机竖屏**：压紧单行刊头与场景切签，将三段公式说明移至画布下方，让等比 2D 画布（竖屏自动切清晰 2×3 等比网格，绝不压成椭圆）稳占首屏 ≥ 48%，同屏底部直接露出实黑诊单首句与主控按钮。
- **844×390 手机横屏**：切换左 56% 活体标本画布 × 右 44% 紧凑刊头、切签与实黑诊单主控并行，画布顶沿留足标尺净空绝不遮字。

## 4. 配色与字体
- **逐像素实采自 254 原海报四色印刷体系**：
  - 柿红海报主底 `#EC4109`（边缘深柿 `#C63103`；浅纸安全深柿红字 `#B02700`，对比度 ≥ 6.0:1；暗室亮柿 `#FF7A47`）
  - 暖奶油标题与圆盘 `#F6E0C1`（浅读暖纸 `#FAF2E4`、清象牙 `#FFFBF4`、暖羊皮 `#F4E6CE`）
  - 纯墨黑框线、实黑匣与 03 暗室 `#11120D`（暗舱 `#1C1C16`、次墨 `#3C3730`）
  - 皇家钴蓝点缀、05 浅蓝雾纸与 06 深钴暗室 `#2950A5`（浅纸安全深钴字 `#1A3C87`；浅蓝雾 `#EEF3FA`；06 深钴暗室 `#13244A`、暗舱 `#1C3263`、暗底亮蓝 `#8BB5FF`）
  - 状态辅色：克制使用深松绿 `#126346` / 暗底亮薄荷 `#6CE2B4` 标图文咬合成型。
- **字体搭配（全库唯一、与 253/252 零西文/等宽重合，IBM Plex Sans 在近 12 页 0 次使用）**：
  - `Noto Sans SC`（400/500/700/900）：中文展示大标与 UI 正文
  - `Anton`（400）：原海报式粗窄高冲击全大写招牌英文标题与节码
  - `IBM Plex Sans`（400/600/700，固定 `wdth: 100`）：理性工业无衬线 UI 标签与算符（**近 12 页 0 次使用**）
  - `Space Mono`（400/700）：复古几何等宽，承载单真源像素/比例读数与实时 CSS 代码

## 5. 节目录（7 大节，所有 h2 ≤ 12 字，相邻节零控件重复）
1. **01 为什么图标需要文字**（`DUAL CODING & AMBIGUITY`，暖奶油纸 `#FAF2E4`）：双重编码与孤立图标歧义；交互：**4 枚常见界面图标盲猜测试**，点猜后揭晓多义冲突并切「仅图标 / 仅文字 / 图标 + 文字」对比。
2. **02 亲密性与光学对齐**（`PROXIMITY & OPTICAL ALIGNMENT`，清象牙纸 `#FFFBF4`）：格式塔亲密性外距/内距比（经验值 1.5–2×）与单行/多行光学对位，附 [246 簇群](https://layout.xiaoxiaodong.ai/246/play/) 与 [243 堆栈](https://layout.xiaoxiaodong.ai/243/play/) 一句话链接；交互：**SVG 标尺显微镜**，切换单行按钮/双行菜单/多行海报卡、4 种对齐法及 14–28px 字号倍率对比固定 `16px` 与 `1.15em` 图标。
3. **03 三类真实界面拆解**（`UI PATTERNS IN PRACTICE`，纯墨黑暗室 `#12120E`）：底栏导航（44px 触控区）、操作按钮（动宾短语 + WCAG 2.2 24px 最小点击区）、状态提示条（图标破色盲 + `aria-hidden="true"`），一句提及 [244 盒子](https://layout.xiaoxiaodong.ai/244/play/) 与 [253 悬浮层](https://layout.xiaoxiaodong.ai/253/play/)；交互：**3 组真实 DOM 微界面模拟器**（含底栏塞满压力测试与红绿色弱滤镜开关）。
4. **04 这个方法从哪来**（`HISTORICAL LINEAGE`，暖羊皮纸 `#F4E6CE`）：1923 Wertheimer → 1925–1936 Neurath & Arntz ISOTYPE → 1971 Paivio 双重编码 → 1981–1982 Xerox Star → 1999 Wiedenbeck & 2014 NN/g → 2019 Every Layout & 2023 WCAG 2.2；交互：**年代档案抽屉**，点选 6 个历史节点展开对应矢量实物图示与出处。
5. **05 什么时候用，什么时候别用**（`WHEN TO USE & WHEN TO AVOID`，浅钴蓝雾纸 `#EEF3FA`）：温和给海报「图文结合，信息更有力量」标「温和补充 · 有前提」并列出 4 类禁区与 2 类主战场，一句提及 [247 侧栏原语](https://layout.xiaoxiaodong.ai/247/play/)、[250 自适应网格原语](https://layout.xiaoxiaodong.ai/250/play/)；交互：**6 张场景正反对照翻检卡**（一键切换「反例演示」与「克制取舍」）。
6. **06 眼力小测：挑出对的那组**（`SINGLE-VARIABLE DIAGNOSTIC QUIZ`，深钴蓝暗室 `#13244A`）：2 道严格单变量四选一辨别题；交互：**可点击 SVG 考场卡片**，作答后原图叠加像素/光学标尺并逐项解析。
7. **07 原海报与关键词**（`ORIGINAL POSTER & REFERENCES`，暖奶油原纸 `#F6E0C1`）：原海报展示与 `<dialog>` 缩放平移灯箱（`draggable="false"`、Esc 关闭）、三大关键词与原话、其余 11 个同小类原语一句话导航（243–253）、核实书目与页脚。

## 6. 来源与核实网址
- Max Wertheimer (1923), *Laws of Organization in Perceptual Forms* (*Untersuchungen zur Lehre von der Gestalt II*, *Psychologische Forschung*): https://psychclassics.yorku.ca/Wertheimer/Forms/forms.htm
- Otto Neurath, Marie Neurath & Gerd Arntz (1925–1936), ISOTYPE / *International Picture Language* (1936), Isotype Revisited / University of Reading: https://isotyperevisited.org/
- Allan Paivio (1971), *Imagery and Verbal Processes* & (1986) *Mental Representations: A Dual Coding Approach* (Oxford University Press)
- David Canfield Smith et al. (April 1982), *Designing the Star User Interface*, *BYTE* Vol. 7, No. 4, pp. 242–282 (Xerox 8010 Star, 1981)
- Susan Wiedenbeck (1999), *The use of icons and labels in an end user application program: An empirical study of learning and retention*, *Behaviour & Information Technology* 18(2), 68–82: https://doi.org/10.1080/014492999119129
- Aurora Harley (2014), *Icon Usability*, Nielsen Norman Group: https://www.nngroup.com/articles/icon-usability/
- Heydon Pickering & Andy Bell (2019), *Every Layout — The Icon*: https://every-layout.dev/layouts/icon/
- W3C WCAG 2.2 (October 2023) — *SC 2.5.8 Target Size (Minimum)*: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html & *WAI Decorative Images*: https://www.w3.org/WAI/tutorials/images/decorative/

## 7. 练习（严格单变量、中性标签）
- **题 1（亲密性变量）**：四张完全相同的 3 项横向工具栏 SVG（图标、文字、色值全一致），仅改变「图字内距 / 组间外距」——A（内距 2px / 组距 36px，贴字撞击）、B（内距 10px / 组距 34px，清晰咬合）、C（内距 24px / 组距 22px，边界倒挂）、D（内距 30px / 组距 10px，跨组误配）。选项按钮仅标 A / B / C / D；正确答案为 **B**，因为内距留出呼吸缝且明显小于组距，亲密性牢牢锁住每个图标与自身标签。
- **题 2（光学纵轴单变量）**：四张完全相同的双行功能项卡片（相同 34px 圆标、相同字号、相同内距 14px、相同文案），**仅改变图标的纵轴位置**——A（上浮超顶，偏移 -14px）、B（光学居中对齐双行文字块，偏移 0px）、C（下沉齐末行，偏移 +11px）、D（悬垂拖底，偏移 +22px）。选项按钮仅标 A / B / C / D；正确答案为 **B**，34px 圆标中心与双行文字块视觉中线重合，视线平顺切入标题与说明。
