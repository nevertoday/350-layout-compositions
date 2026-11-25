# 233 绝对定位布局 · 互动页方案

## 1. 一句话道理
绝对定位通过让元素彻底脱离文档流、改以最近已定位祖先的 padding 盒为坐标原点，把「精确落点」与「自由叠层」从顺序排版的牵制里解放出来；但前提是父容器必须显式立锚、坐标要随容器宽度选对参照边，且层叠顺序受层叠上下文约束。

## 2. 开场玩具
- **玩法**：1:1 化用 233 号原海报的 **800×600 奶油色坐标画框与 6 枚真实 CSS `position: absolute` 几何块**（置顶、靠左、靠右、居中、层叠覆盖、置底，并支持一键切到「商品卡片 UI」真实界面皮肤）。用户可直接在舞台里**四向拖动朱红「居中」块（`data-perf-drag`）或用方向键微调**，实时看到 2D Canvas 测绘层标出到参照容器四边的距离与居中偏差；同时拨动四组原生控件：`.parent` 定位（`static` / `relative`）、居中校准（纯 `50%` 错位 / 补 `translate(-50%,-50%)`）、`居中` 与 `层叠覆盖` 的 `z-index` 层级、以及 `靠右` 圆的锚定边（固定 `left: 668px` / 相对右缘 `right: 30px`）与容器窄屏压测（`800px` / `540px`）。
- **开场状态（0/4 待校准）**：绝不预先摆成答案，一打开就是四处常见真实翻车态：
  1. `.parent` 为 `static`（忘了设 `relative`），`靠右` 朱红圆当场逃出 `.parent` 奶油框，飞到外层视口框右上角；
  2. `居中` 朱红方仅写 `top: 50%; left: 50%` 未减自身半宽半高，左上角落在中轴交叉点上，整块斜坠右下偏离中心；
  3. `层叠覆盖` 设为 `z-index: 6` 而 `居中` 为 `1`，深松绿块反压切过 `居中` 右下边缘（仍保留 `居中` 几何中心可直接按住拖动）；
  4. `靠右` 圆写死 `left: 668px`（且在缩窄压测或贴边时越出右界），而非按 `right: 30px` 贴右锚定。
- **怎样算玩错、读数如何解释「为什么」**：所有 4 项规则由 `model.js` 与舞台真实 DOM 几何单源核算。例如：把 `.parent` 切回 `static` 会立刻算出逃逸像素并提示「`absolute` 会一路向上找非 `static` 祖先，找不到就直接跳到外框」；把 `居中` 拖离中轴或撞上 `置顶`/`置底` 块会实时报出偏离量/碰撞面积与「脱离文档流不会推开邻居，撞上就会硬叠覆盖」；把 `居中` 设为 `z-index: -1` 会沉到背景参考线之下并提示负层级陷阱；选 `left: 668px` 再缩窄容器则当场撞破右边框并解释为何靠右元素应以 `right` 锚定。
- **与最近 12 页的明显区别**：紧邻的 232 是暖米蓝图上下双排 A/B/C/D 卡片原位对比；231 是天空冰蓝左 5 圆徽浮块排字池；026/148/314/063/147/025 是暖米或深蓝 Canvas 构图台；276 是浅薄荷水平轮播；275 是深梅画廊墙；108 是深绿母砖织机；193 是深蓝横排校样纸。本页独创 **酸黄 Bauhaus 坐标工程单 + 真实 CSS 多元素绝对定位容器逃逸/居中/层叠/缩宽四维排错台 + 纯黑实时语法终端与迷你效果示意**，别的编号完全无法套用。

## 3. 版式骨架
忠实承袭 233 号原海报「酸黄底板 × 顶部左大标右五关键词 × 中部满幅黑框奶油坐标舞台（四角圆点）× 下部黑框双栏要点控台与纯黑代码终端/效果示意 × 底部箭头圆点斜杠铭牌带」整幅海报架构，绝不锁 `min-height: 100svh`：
- **1440×900**：容器宽 `1360px`，顶部酸黄刊头（左大标与松绿竖杠总述 × 右 5 枚关键词实时状态灯）→ 中部左 60% 大幅 800×600 奶油坐标舞台（含外层逃逸带与四角原点，高 ~560px）× 右 40% 原海报黑框技术规格盒（上置四维排错开关与白话诊单、下置纯黑实时 CSS 终端与迷你「效果示意」）→ 底沿原海报 `▸▸▸▸ ● ///////` 铭牌带，整套首屏约 860px 完整可见。
- **2560×1440**：主容器舒展至 `1820px`，坐标舞台按比例增高至 ~520px，主体充实不缩在中间。
- **390×844（竖屏手机）**：顶眉与大标压成单行，把长总述移至舞台之后；坐标舞台置顶保持等比（高 ~395px，占首屏约 47%），正下方紧跟紧凑单行主控与诊单首行；圆形保持正圆绝不压扁。
- **844×390（横屏手机）**：切换为左 56% 坐标舞台 × 右 44% 紧凑标题、控制与白话诊单并行。
- **1024×1366（竖屏平板）**：自然高度流式排布，不留大片竖向空洞。

## 4. 配色与字体
- **实采自 233 号原海报**：
  - 标志酸亮黄 `#F1FB2F`（柔和浅黄辅底 `#F7FA9B`）
  - 奶油制图画布 `#F9EECD`（长文浅象牙纸 `#FDFBF2`）
  - 深松林绿 `#04412C`（暗底亮松绿 `#6FE3B5`）
  - 信号朱红橘 `#F45809`（浅底小字高对比深橘 `#B83B00`，暗底亮橘 `#FF8A4C`）
  - 印刷墨黑 `#090A08` 与终端代码黑 `#10110E`
- **字体搭配（全库唯一，三款西文在最近 12 页全部 0 次使用）**：
  - `Noto Sans SC`（400 / 500 / 700 / 900）— 中文重黑大标与清晰 UI 正文
  - `Chivo`（700 / 900）— 最近 12 页 0 使用，用于 `ABSOLUTE POSITIONING` 工业展示大标与节号
  - `IBM Plex Sans`（400 / 600）— 最近 12 页 0 使用，用于英文技术标签与图表副标
  - `DM Mono`（400 / 500）— 最近 12 页 0 使用，用于 `(0, 0)` / `(800, 600)` 坐标刻度与纯黑 CSS 代码终端

## 5. 节目录（8 节，标题均 ≤12 字，相邻不同控件）
- **01 脱离文档流发生了什么** (`REMOVED FROM FLOW`) — 浅象牙纸：三态流塌陷切换器（`static` / `relative` / `absolute`），实测兄弟上移与空父盒塌成 0px。
- **02 谁才是真正的参照容器** (`CONTAINING BLOCK`) — 暖奶油纸：三层嵌套 DOM 树点击器，支持挂 `position: relative` 及现代隐藏陷阱 `transform` / `filter` / `contain: layout`，温和补充海报「非 static」要点。
- **03 四边坐标与自动拉伸** (`INSET & COORDINATES`) — 深夜代码黑：四边绳索开关 + 容器宽度滑杆，演示 padding-box 原点、双边同写隐式拉伸（`inset`）与居中公式差异。
- **04 层叠上下文的「天花板」** (`STACKING CONTEXT`) — 浅象牙纸：2D Canvas 等轴测 3D 图层剖面 + 双父容器步进器，直观拆解「`z-index: 9999` 为何输给 `2`」。
- **05 绝对定位从哪来** (`ORIGIN & EVOLUTION`) — 深松林绿：四段历史规范卡切换（1997 W3C CSS-P → 1998 CSS2 → 2011 CSS 2.1 → 现代 Positioned 3 与 Anchor Positioning）。
- **06 什么时候用，什么时候别用** (`WHEN TO USE / AVOID`) — 酸黄框暖奶油纸：6 张场景翻转体检卡（附同小类 222/226/227/231/232/234/235/237/240 一句话链接）。
- **07 小练习：哪段代码稳贴角标** (`QUICK PRACTICE`) — 浅象牙纸：四选一单变量代码选择题 + 无剧透目标区与实时微型真实渲染验片室。
- **08 原海报与关键词** (`ORIGINAL POSTER`) — 酸黄底：原海报放大拖看灯箱（`draggable="false"`、Esc 关闭）+ 5 组原海报关键词 + 页脚。

## 6. 来源（均经上网核实）
- W3C Working Draft, *Positioning HTML Elements with Cascading Style Sheets* (`WD-positioning-970131`, 1997-01-31; `WD-positioning-19970819`, 1997-08-19), Editor: Robert Stevahn (HP), Authors: Scott Furman et al. (Netscape), Scott Isaacs et al. (Microsoft) — https://www.w3.org/TR/WD-positioning-970131
- W3C Recommendation, *Cascading Style Sheets, level 2 (CSS2)* (`REC-CSS2-19980512`, 1998-05-12), Editors: Bert Bos, Håkon Wium Lie, Chris Lilley, Ian Jacobs — https://www.w3.org/TR/1998/REC-CSS2-19980512/
- W3C Working Draft, *CSS Positioned Layout Module Level 3* — https://www.w3.org/TR/css-position-3/
- W3C Working Draft, *CSS Anchor Positioning Module Level 1* — https://www.w3.org/TR/css-anchor-position-1/
- MDN Web Docs, *Layout and the containing block* — https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block

## 7. 小练习
- **题目**：要让右上角的 `NEW` 徽标稳稳贴在商品卡片内右上角（距顶 12px、距右 12px），即使卡片从 360px 缩窄到 220px 或标题折行，徽标既不能逃出卡片，也不能撑乱标题排版，该选哪段写法？
- **四个选项（中性标签 A/B/C/D，仅差一个变量）**：
  - `A`：`.card { position: static; }` + `.badge { position: absolute; top: 12px; right: 12px; }`（仅差父级未立锚 → 逃出卡片飞向页面角落）
  - `B`：`.card { position: relative; }` + `.badge { position: absolute; top: 12px; left: 296px; }`（仅差锁死左侧像素 → 卡片缩窄时冲破右边界）
  - `C`：`.card { position: relative; }` + `.badge { position: absolute; top: 12px; right: 12px; }`（正确解：父级立锚、子级脱流并以右顶边定位，缩窄与折行都稳）
  - `D`：`.card { position: relative; }` + `.badge { position: relative; top: 12px; right: 12px; }`（仅差未脱流 → 仍占文档流顶开标题且向内偏左）
