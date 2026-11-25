// 232 相对定位布局 · 单一真源数据与诊断模型
// 所有开场读数、CSS 代码、四项验收、罗盘推演、规范年表与练习选项均由此处统一产出。

export const INITIAL_HERO = Object.freeze({
  positionMode: "relative", // "relative" | "absolute" | "static"
  dx: 36,                   // 相对原位水平偏移 px（正向右，负向左）
  dy: 28,                   // 相对原位垂直偏移 px（正向下，负向上）
  axisMode: "conflict",     // "conflict" | "tl" | "br"
  zMode: "-1",              // "-1" | "auto" | "2" | "9999"
  bAnchor: false,           // 邻卡 B 是否设 position: relative（零偏移包含块）
  uiSkin: "blueprint",      // "blueprint" | "card"
});

export const POSTER_PRESET = Object.freeze({
  positionMode: "relative",
  dx: 60,
  dy: 40,
  axisMode: "tl",
  zMode: "2",
  bAnchor: true,
});

export const SAFE_OFFSET = Object.freeze({
  minDist: 6,     // 至少有可感知的微调偏移（经验值）
  maxDy: 24,      // 垂直偏离超过 24px 易形成刺眼空洞（经验值）
  snapX: 0,
  snapY: -12,
  snapRadius: 6,
});

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function fmtPx(n) {
  const r = Math.round(n);
  return `${r > 0 ? "+" : ""}${r}px`;
}

export function rawPx(n) {
  return `${Math.round(n)}px`;
}

/**
 * 计算两个矩形的重叠面积与相对目标盒的比例
 */
export function rectOverlap(a, b) {
  if (!a || !b) return { px: 0, ratio: 0 };
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const area = x * y;
  const targetArea = Math.max(1, b.width * b.height);
  return { px: Math.round(area), ratio: Math.round((area / targetArea) * 100) };
}

/**
 * 由 Hero 状态 + 真实 DOM 测得的卡片矩形算出全部读数与四项诊断
 * rects = { cardA, cardB, cardC, cardD, ghostC, stage, gap }
 */
export function evaluateHero(state, rects = null) {
  const isStatic = state.positionMode === "static";
  const isAbsolute = state.positionMode === "absolute";
  const isRelative = state.positionMode === "relative";

  // 实际生效的偏移（static 忽略 top/left/right/bottom）
  const effDx = isStatic ? 0 : Math.round(state.dx);
  const effDy = isStatic ? 0 : Math.round(state.dy);
  const dist = Math.round(Math.hypot(effDx, effDy));

  // 真实 DOM 重叠检测（降级时按估算宽/间距计算，保证无 DOM 时也有一致结果）
  const cardW = rects?.ghostC?.width || 150;
  const cardH = rects?.ghostC?.height || 110;
  const gap = rects?.gap ?? 20;
  const maxSafeX = Math.max(12, Math.floor(gap - 2));

  let overlapB = { px: 0, ratio: 0 };
  let overlapD = { px: 0, ratio: 0 };
  if (rects?.cardC && rects?.cardB && rects?.cardD) {
    overlapB = rectOverlap(rects.cardC, rects.cardB);
    overlapD = rectOverlap(rects.cardC, rects.cardD);
  } else if (!isStatic) {
    const oxD = Math.max(0, effDx - gap);
    const oxB = Math.max(0, -effDx - gap);
    const oy = Math.max(0, cardH - Math.abs(effDy));
    overlapD = { px: Math.round(oxD * oy), ratio: Math.round((oxD * oy) / (cardW * cardH) * 100) };
    overlapB = { px: Math.round(oxB * oy), ratio: Math.round((oxB * oy) / (cardW * cardH) * 100) };
  }

  const maxOverlapRatio = Math.max(overlapB.ratio, overlapD.ratio);
  const hitNeighbor = overlapD.ratio >= overlapB.ratio && overlapD.ratio > 0
    ? "D"
    : overlapB.ratio > 0
      ? "B"
      : null;

  const ghostHolePx = isRelative ? Math.max(Math.abs(effDx), Math.abs(effDy)) : 0;
  const ghostSlotPreserved = isRelative || isStatic;

  // 四项核验
  // 1. 偏移分寸与占位（必须是 relative，有微调，不撞邻居，空洞克制）
  let offsetOk = false;
  let offsetBadge = "";
  let offsetErrType = "";
  if (isAbsolute) {
    offsetBadge = "占位塌陷";
    offsetErrType = "absolute";
  } else if (isStatic) {
    offsetBadge = "偏移失效";
    offsetErrType = "static";
  } else if (maxOverlapRatio > 0) {
    offsetBadge = `撞遮 ${hitNeighbor} 卡 ${maxOverlapRatio}%`;
    offsetErrType = "overlap";
  } else if (Math.abs(effDy) > SAFE_OFFSET.maxDy || Math.abs(effDx) > maxSafeX) {
    offsetBadge = `空洞 ${ghostHolePx}px 过大`;
    offsetErrType = "hole";
  } else if (dist < SAFE_OFFSET.minDist) {
    offsetBadge = "零偏移未微调";
    offsetErrType = "zero";
  } else {
    offsetOk = true;
    offsetBadge = `${fmtPx(effDx)} / ${fmtPx(effDy)}`;
  }

  // 2. 轴向纯净（不可同时对边过约束）
  const axisOk = state.axisMode === "tl" || state.axisMode === "br";
  const axisBadge = state.axisMode === "conflict"
    ? "四边过约束"
    : state.axisMode === "tl"
      ? "top + left"
      : "bottom + right";

  // 3. 受控层叠（z-index: 2 或 auto 且不沉底不军备竞赛；-1 沉底错，9999 过载错）
  const layerOk = state.zMode === "2" || state.zMode === "auto";
  const layerBadge = state.zMode === "-1"
    ? "z-index: -1 沉底"
    : state.zMode === "9999"
      ? "9999 层级失控"
      : state.zMode === "2"
        ? "z-index: 2 抬层"
        : "z-index: auto 自然";

  // 4. 锚点包含块（邻卡 B 开启零偏移 position: relative，锁住 NEW 状态角标）
  const anchorOk = !!state.bAnchor;
  const anchorBadge = anchorOk ? "B 已建包含块" : "NEW 角标逃逸";

  const checks = [
    { id: "offset", label: "占位与微偏", ok: offsetOk, badge: offsetBadge },
    { id: "axis", label: "单一轴向", ok: axisOk, badge: axisBadge },
    { id: "layer", label: "受控层叠", ok: layerOk, badge: layerBadge },
    { id: "anchor", label: "角标锚点", ok: anchorOk, badge: anchorBadge },
  ];
  const passed = checks.filter((c) => c.ok).length;

  // 最高优先级白话诊单
  let tone = "error"; // "error" | "warn" | "pass"
  let tag = `错态 · ${passed} / 4`;
  let title = "";
  let body = "";
  let hint = "";

  if (isAbsolute) {
    tag = "错态 · 原位塌陷";
    title = "切到 absolute 后，蓝色原位消失，D 卡当场左冲补位";
    body = "absolute 会让 C 彻底脱离普通文档流：它原本占着的第 3 格瞬间被后面的 D 卡片顶替，整个四栏节奏少了一格。这正是 relative 与 absolute 最根本的分水岭。";
    hint = "把「C 定位」切回「relative」，看 D 卡片退回第 4 格、蓝色虚线原位重新现身。";
  } else if (isStatic) {
    tag = "错态 · 偏移被忽略";
    title = "position: static 下，一切 top / left / z-index 全部无效";
    body = "元素默认处于普通流（static），浏览器会直接无视偏移属性与 z-index。哪怕写了数值，C 也会被死死钉在原位，拖动也只能留在原地。";
    hint = "把「C 定位」切回「relative」，再拖动红块 C 做轻微上提或偏移。";
  } else if (offsetErrType === "overlap") {
    tag = `错态 · 撞遮 ${hitNeighbor} 卡`;
    title = `红块 C 偏移过猛，压遮了相邻的 ${hitNeighbor} 卡片 ${maxOverlapRatio}%`;
    body = `相对定位保留原位、却绝不推开邻居——现在 C 相对蓝虚线原位偏了（${fmtPx(effDx)}, ${fmtPx(effDy)}），视觉本体直接盖住了 ${hitNeighbor} 卡的字面与点击区，原位还留下明显空洞。`;
    hint = `按住朱红 C 卡片往原位上方轻收（例如上提 -12px、水平微移不超过 ${maxSafeX}px），让它突出又不撞邻居。`;
  } else if (offsetErrType === "hole") {
    tag = "错态 · 空洞过大";
    title = `原位蓝虚线露出 ${ghostHolePx}px 大空洞，排架像缺了一颗牙`;
    body = "虽然 C 没有压到邻居，但偏离原位已超过经验微调带（纵向 ≤ 24px，横向不出槽隙）。元素移走了、原坑还占着，读者第一眼会以为这里漏加载了一块内容。";
    hint = "把红块 C 拉回蓝虚线框附近（纵向微提 -6px 到 -20px 最稳妥），把大挪位留给 Flex 或 Grid。";
  } else if (offsetErrType === "zero") {
    tag = "待调 · 未微偏";
    title = "偏移归零（0px, 0px），C 与普通流卡片完全平权";
    body = "零偏移的 relative 适合当包含块锚点（就像旁边的 B 卡），但如果任务是让推荐项 C 视觉微抬，就需要给 6–20px 的克制位移。";
    hint = "按住朱红 C 卡片往上轻提约 12px（或按键盘 ↑ 键 3 次）。";
  } else if (!axisOk) {
    tag = "错态 · 过约束冲突";
    title = "同时给 top/bottom 和 left/right 赋值，一半代码是死代码";
    body = "按 W3C CSS 2.1 §9.4.3：相对定位同时写对边时，纵向浏览器只认 top、静默丢弃 bottom；横向在从左到右（LTR）排版里只认 left、丢弃 right，极易埋下维护暗坑。";
    hint = "把「CSS 轴向」改为「top + left」或「bottom + right」（只留垂直、水平各一条边）。";
  } else if (state.zMode === "-1") {
    tag = "错态 · 层叠沉底";
    title = "z-index: -1 让红块 C 沉到了排架底板下面";
    body = "position: relative 开启了 z-index 开关，但负层级会把整个 C 卡片压进父级背景与邻卡背后，阴影与微抬效果全被吞掉，鼠标点击也容易被挡。";
    hint = "把「C 层叠」切到「z-index: 2」（或「auto」），用克制的正整数抬出前景。";
  } else if (state.zMode === "9999") {
    tag = "告警 · 层级飙高";
    title = "z-index: 9999 是前端常见坏习惯：会引发全站层叠军备竞赛";
    body = "局部卡片抬升只需比同级大 1–2；一旦动辄写 9999，后续弹窗、下拉菜单被迫堆到 99999，还会与隔离层叠上下文互相打架。";
    hint = "把「C 层叠」降回「z-index: 2」，用最小必要层级完成抬升。";
  } else if (!anchorOk) {
    tag = "错态 · 角标逃逸";
    title = "邻卡 B 忘了加 position: relative，NEW 角标逃到外框角落了";
    body = "原海报要点提到相对定位适合「状态提示」：靠的正是给父卡挂零偏移的 position: relative 当包含块。现在 B 仍是 static，它里面的 absolute 角标只能一路向上找外层容器停靠。";
    hint = "点开「B 角标锚点 → 设 relative」，看 B 纹丝不动，而红角标瞬间飞回 B 卡右上角。";
  } else {
    tone = "pass";
    tag = "已校准 · 4 / 4 达标";
    title = "原位稳固、微偏克制、轴向干净，零偏移锚点也各归其位";
    body = state.axisMode === "br"
      ? `你用 bottom: ${rawPx(-effDy)}; right: ${rawPx(-effDx)} 完成了同样精准的微调——正值向内推，负值向外拉。C 保留了蓝虚线原位且零遮挡，B 以零偏移 relative 锁住了 NEW 角标。`
      : `C 相对蓝虚线原位只做了克制微偏（${fmtPx(effDx)}, ${fmtPx(effDy)}），既未撞遮邻居也未留下刺眼空洞；同时 B 用零偏移 position: relative 牢牢框住了绝对定位的 NEW 状态角标。`;
    hint = "试试把「C 定位」临时切到 absolute 看占位塌陷，或点「看原海报 +60/+40」对比教学放大图。";
  }

  // 生成实时 CSS 声明代码
  const cssLines = [];
  cssLines.push(".card-C {");
  cssLines.push(`  position: ${state.positionMode};`);
  if (state.axisMode === "conflict") {
    cssLines.push(`  top: ${rawPx(effDy)}; left: ${rawPx(effDx)};`);
    cssLines.push(`  bottom: ${rawPx(effDy)}; right: ${rawPx(effDx)}; /* 过约束：被忽略 */`);
  } else if (state.axisMode === "tl") {
    cssLines.push(`  top: ${rawPx(effDy)}; left: ${rawPx(effDx)};`);
  } else {
    cssLines.push(`  bottom: ${rawPx(-effDy)}; right: ${rawPx(-effDx)};`);
  }
  cssLines.push(`  z-index: ${state.zMode};`);
  cssLines.push("}");
  cssLines.push(`.card-B { position: ${state.bAnchor ? "relative" : "static"}; } /* NEW 角标${state.bAnchor ? "锚定成功" : "逃逸外框"} */`);

  return {
    effDx,
    effDy,
    dist,
    maxSafeX,
    overlapB,
    overlapD,
    maxOverlapRatio,
    hitNeighbor,
    ghostHolePx,
    ghostSlotPreserved,
    checks,
    passed,
    tone,
    tag,
    title,
    body,
    hint,
    cssCode: cssLines.join("\n"),
  };
}

/**
 * 02 节：四边推杆罗盘的单真源计算（严格遵循 CSS 2.1 §9.4.3 过约束规则）
 */
export function evaluateCompass({ top, bottom, left, right, dir = "ltr" }) {
  const hasTop = top !== null;
  const hasBottom = bottom !== null;
  const hasLeft = left !== null;
  const hasRight = right !== null;

  // CSS 2.1 §9.4.3: top 与 bottom 同设时，忽略 bottom
  const ignoredBottom = hasTop && hasBottom;
  // LTR 下 left 与 right 同设时忽略 right；RTL 下忽略 left
  const ignoredRight = hasLeft && hasRight && dir === "ltr";
  const ignoredLeft = hasLeft && hasRight && dir === "rtl";

  // 实际位移：正 top 向下(+y)，正 bottom 向上(-y)，正 left 向右(+x)，正 right 向左(-x)
  let dx = 0;
  let dy = 0;
  if (hasTop) dy = top;
  else if (hasBottom) dy = -bottom;

  if (hasLeft && !ignoredLeft) dx = left;
  else if (hasRight && !ignoredRight) dx = -right;

  const lines = [".box-C {", "  position: relative;"];
  if (hasTop) lines.push(`  top: ${top}px;`);
  if (hasBottom) lines.push(`  bottom: ${bottom}px;${ignoredBottom ? " /* 过约束：被 top 覆盖忽略 */" : ""}`);
  if (hasLeft) lines.push(`  left: ${left}px;${ignoredLeft ? " /* 过约束：RTL 下被 right 覆盖 */" : ""}`);
  if (hasRight) lines.push(`  right: ${right}px;${ignoredRight ? " /* 过约束：LTR 下被 left 覆盖 */" : ""}`);
  lines.push("}");

  let note = "";
  if (ignoredBottom || ignoredRight || ignoredLeft) {
    const dropped = [
      ignoredBottom && "bottom",
      ignoredRight && "right（当前为 LTR）",
      ignoredLeft && "left（当前为 RTL）",
    ].filter(Boolean).join(" 与 ");
    note = `触发过约束：浏览器已静默丢弃 ${dropped}，实际视觉位移为（水平 ${fmtPx(dx)}，垂直 ${fmtPx(dy)}）。`;
  } else if ((hasBottom && bottom > 0) || (hasRight && right > 0)) {
    note = `注意方向：正值表示「从该边向内推」——${hasBottom && bottom > 0 ? `bottom: +${bottom}px 反而向上推了 ${bottom}px` : ""}${hasBottom && bottom > 0 && hasRight && right > 0 ? "，" : ""}${hasRight && right > 0 ? `right: +${right}px 反而向左推了 ${right}px` : ""}。`;
  } else if (dx === 0 && dy === 0) {
    note = "四边未产生净偏移，盒子停在蓝虚线原位。试着给 bottom 或 right 一个正值看看它往哪走。";
  } else {
    note = `当前净视觉位移：水平 ${fmtPx(dx)}，垂直 ${fmtPx(dy)}。蓝虚线始终留在文档流原位。`;
  }

  return {
    dx,
    dy,
    ignoredBottom,
    ignoredRight,
    ignoredLeft,
    css: lines.join("\n"),
    note,
  };
}

/**
 * 04 节：规范演进四代蓝图板（全部基于已核实的 W3C 原始文档）
 */
export const SPEC_ERAS = [
  {
    id: "wd1997",
    year: "1997",
    date: "1997 年 1 月 / 8 月",
    title: "W3C 定位草案",
    en: "WD-positioning",
    people: "Scott Furman（Netscape）· Scott Isaacs（Microsoft）· 编辑 Robert Stevahn（HP）",
    summary: "在浏览器大战中，两家竞争对手破天荒联手在 W3C 提出《Positioning HTML Elements with Cascading Style Sheets》草案，首次引入 position: relative / absolute、top / left 与 z-index，让网页开始摆脱表格嵌套与透明 GIF 垫片。",
    code: "/* 1997 W3C 早期草案写法 */\n#badge {\n  position: relative;\n  top: 12px; left: 16px;\n  z-index: 2;\n}",
    tag: "诞生起点",
  },
  {
    id: "css2",
    year: "1998",
    date: "1998 年 5 月 12 日",
    title: "CSS Level 2 正式推荐",
    en: "REC-CSS2 §9.4.3",
    people: "编辑：Bert Bos · Håkon Wium Lie · Chris Lilley · Ian Jacobs",
    summary: "W3C CSS2 第 9.4.3 节「Relative positioning」用简洁的三条规则定型：先按普通流排好位置与尺寸，再按偏移量移动视觉盒；后续兄弟盒当它从未动过，因此可能重叠；同时为后代建立新的包含块。",
    code: "/* CSS2 §9.4.3 确立三条铁律 */\n.item {\n  position: relative; /* 保留原位 + 建立包含块 */\n  top: 40px; left: 60px;\n}",
    tag: "三条铁律定型",
  },
  {
    id: "css21",
    year: "2011",
    date: "2011 年 6 月 7 日",
    title: "CSS 2.1 清理歧义",
    en: "REC-CSS21 §9.4.3",
    people: "W3C CSS 工作组历经十余年互通测试修订",
    summary: "把早期浏览器五花八门的边界行为全部钉死：明确 top 与 bottom 同时设定时丢弃 bottom，left 与 right 同设时按 direction（LTR/RTL）决定谁胜出；理清表格单元与行内相对定位的包含块细节。",
    code: "/* CSS 2.1 明确过约束消解规则 */\n.rtl-box {\n  direction: rtl;\n  position: relative;\n  left: 40px;  /* RTL 下被忽略 */\n  right: 20px; /* 生效：向左推 20px */\n}",
    tag: "边界规则钉死",
  },
  {
    id: "pos3",
    year: "Level 3",
    date: "当代标准模块",
    title: "CSS Positioned Layout L3",
    en: "css-position-3",
    people: "编辑：Elika J. Etemad（fantasai）· Tab Atkins Jr.",
    summary: "将物理偏移（top/right/bottom/left）统一纳入「内缩属性（inset properties）」，引入跟随书写方向的逻辑属性 inset-block-start / inset-inline-start 与 inset 简写，并与 position: sticky 共同组成现代定位体系。",
    code: "/* Level 3 逻辑方向内缩属性 */\n.tag {\n  position: relative;\n  inset-block-start: -2px;\n  inset-inline-start: 6px;\n}",
    tag: "逻辑方向统一",
  },
];

/**
 * 07 节：小练习（四项仅在定位变量上不同，标签严格中性）
 */
export const PRACTICE_OPTIONS = [
  {
    id: "A",
    label: "选项 A",
    code: ".card-pro {\n  position: absolute;\n  top: -12px;\n}\n.badge {\n  position: absolute;\n  top: -8px; right: -8px;\n}",
    correct: false,
    verdict: "原位塌陷：企业版左冲撞车",
    explain: "把「专业版」改成 position: absolute 会让它脱离三栏文档流，后面的「企业版」立刻向左顶进它的空位，两张卡叠在一起。角标虽然锁住了，但三栏骨架被拆散了。",
  },
  {
    id: "B",
    label: "选项 B",
    code: ".card-pro {\n  position: relative;\n  bottom: 12px;\n}\n.badge {\n  position: absolute;\n  top: -8px; right: -8px;\n}",
    correct: true,
    verdict: "全部满足：占位、上提、锚点一次到位",
    explain: "position: relative 既锁住了三栏原始占位，又为绝对定位的「推荐」角标提供了包含块；而正值 bottom: 12px 代表「从原始底边向内（向上）推 12px」，与 top: -12px 视觉完全等价，精准完成微抬。",
  },
  {
    id: "C",
    label: "选项 C",
    code: ".card-pro {\n  position: relative;\n  top: 12px;\n}\n.badge {\n  position: absolute;\n  top: -8px; right: -8px;\n}",
    correct: false,
    verdict: "方向反了：专业版反而向下沉了 12px",
    explain: "占位和角标锚点都对了，但把偏移方向写反了。top 的正值是从原始顶边向内（向下）推 12px，想让卡片向上微抬应写 top: -12px 或 bottom: 12px。",
  },
  {
    id: "D",
    label: "选项 D",
    code: ".card-pro {\n  position: static;\n  margin-top: -12px;\n}\n.badge {\n  position: absolute;\n  top: -8px; right: -8px;\n}",
    correct: false,
    verdict: "角标逃逸：static 不能做包含块",
    explain: "负 margin-top 虽然让卡片上移了，但 position: static 无法成为绝对定位后代的包含块——红色「推荐」角标找不到停靠点，直接飞到了外层整排容器的右上角。",
  },
];
