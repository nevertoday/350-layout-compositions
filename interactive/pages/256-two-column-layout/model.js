// 256 双列页面 · 单真源几何、文本折行与诊断模型
// 所有画布坐标、行盒、视觉分量、对齐落差与 4 项设计要点评判均由此模块统一算出，杜绝写死读数。

export const SCENARIOS = {
  bilingual: {
    id: "bilingual",
    tab: "原海报 · 双语对读",
    shortTab: "双语对读",
    left: {
      kicker: "中文版 · CN",
      titleLines: ["自然", "与生活"],
      lead: "自然为日常带来灵感，让设计回归本质，创造更舒适的体验。",
      bullets: ["可持续材料", "简约生活方式", "人与自然的连接"],
    },
    right: {
      kicker: "ENGLISH · EN",
      titleLines: ["DESIGN", "FOR LIFE"],
      lead: "Nature inspires everyday life. Design with purpose creates a better experience.",
      bullets: ["Sustainable Materials", "Minimal Lifestyle", "Connecting People and Nature"],
    },
    artA: {
      id: "arch",
      kind: "arch",
      label: "拱窗远径",
      hint: "点此跨栏调位",
      opticalDensity: 0.78,
      baseAspect: 0.92,
    },
    artB: {
      id: "geo",
      kind: "geo",
      label: "日轮构形",
      hint: "点此跨栏调位",
      opticalDensity: 0.72,
      baseAspect: 1.0,
    },
  },
  compare: {
    id: "compare",
    tab: "产品方案对比",
    shortTab: "方案对比",
    left: {
      kicker: "STANDARD · 个人版",
      titleLines: ["标准", "创作版"],
      lead: "覆盖日常排版校对、离线导出与基础双栏模板，适合独立作者轻装上手。",
      bullets: ["单文件离线 HTML 导出", "内置 12 套双列网格", "自动适配手机单列折叠"],
    },
    right: {
      kicker: "STUDIO · 团队版",
      titleLines: ["专业", "协作版"],
      lead: "面向设计团队的共享网格规范、版本比对与跨端批量质检工具。",
      bullets: ["多人共享品牌色与字库", "六端视口自动对比截图", "支持设计系统变量同步"],
    },
    artA: {
      id: "arch",
      kind: "priceA",
      label: "¥68 / 月",
      hint: "点此跨栏调位",
      opticalDensity: 0.68,
      baseAspect: 1.45,
    },
    artB: {
      id: "geo",
      kind: "priceB",
      label: "¥198 / 月",
      hint: "点此跨栏调位",
      opticalDensity: 0.74,
      baseAspect: 1.45,
    },
  },
  editorial: {
    id: "editorial",
    tab: "图文专题页",
    shortTab: "图文专题",
    left: {
      kicker: "FEATURE · 空间叙事",
      titleLines: ["器物", "与光影"],
      lead: "在客厅与书房的交界处，一扇面向庭院的竖窗将白昼的斜光引入室内，墙面与木桌因此有了时间的刻度。",
      bullets: ["原木纹理随季候微变", "留白墙面承接斜射日影", "双栏将叙事与图注清晰隔开"],
    },
    right: {
      kicker: "NOTES · 材质图注",
      titleLines: ["MATERIAL", "ARCHIVE"],
      lead: "Unfinished cedar, washed linen, and matte stone hold quiet contrast without glossy glare.",
      bullets: ["01 · 哑光亚麻织面", "02 · 粗陶与冷灰石材", "03 · 深松绿涂装木框"],
    },
    artA: {
      id: "arch",
      kind: "arch",
      label: "庭院光窗",
      hint: "点此跨栏调位",
      opticalDensity: 0.76,
      baseAspect: 0.95,
    },
    artB: {
      id: "geo",
      kind: "geo",
      label: "材质色块",
      hint: "点此跨栏调位",
      opticalDensity: 0.72,
      baseAspect: 1.05,
    },
  },
};

export const SNAP_SPLITS = [
  { v: 0.38, label: "38:62" },
  { v: 0.5, label: "50:50" },
  { v: 0.62, label: "62:38" },
];

export const INITIAL_STATE = {
  scenario: "bilingual",
  split: 0.72,        // 左栏占可用宽比例（0.22..0.78），开场刻意偏左挤碎右栏
  gutter: 6,          // 栏间中缝（px，0..92），开场仅 6px 触发跨栏串行
  offsetY: 36,        // 右栏顶沿偏移（px，-44..+48），开场下沉 36px 破坏对齐
  hierarchy: "flat",  // "flat" 拉平 | "clear" 清晰 | "clash" 双核抢戏
  artASide: "left",   // 拱窗图所在栏
  artBSide: "left",   // 几何图所在栏（开场两张图都堆在左栏，造成严重左重右轻）
  showGuides: true,   // 对齐标尺与视线引导叠加
  focusRule: null,    // 高亮某条设计要点: "align" | "balance" | "scan" | "hierarchy" | null
};

export const PRESETS = {
  equal: {
    label: "50:50 对等解",
    kind: "good",
    patch: { split: 0.5, gutter: 34, offsetY: 0, hierarchy: "clear", artASide: "left", artBSide: "right" },
  },
  primary: {
    label: "60:40 主次解",
    kind: "good",
    patch: { split: 0.6, gutter: 36, offsetY: 0, hierarchy: "clear", artASide: "left", artBSide: "right" },
  },
  visual: {
    label: "38:62 图文解",
    kind: "good",
    patch: { split: 0.38, gutter: 32, offsetY: 0, hierarchy: "clear", artASide: "left", artBSide: "right" },
  },
  err_bleed: {
    label: "试错：窄缝串行",
    kind: "bad",
    patch: { split: 0.5, gutter: 4, offsetY: 0, hierarchy: "clear", artASide: "left", artBSide: "right" },
  },
  err_island: {
    label: "试错：宽缝割裂",
    kind: "bad",
    patch: { split: 0.5, gutter: 84, offsetY: 0, hierarchy: "clear", artASide: "left", artBSide: "right" },
  },
  err_right: {
    label: "试错：右重倒挂",
    kind: "bad",
    patch: { split: 0.3, gutter: 28, offsetY: -28, hierarchy: "clash", artASide: "right", artBSide: "right" },
  },
  reset: {
    label: "复原开场错态",
    kind: "reset",
    patch: {
      split: INITIAL_STATE.split,
      gutter: INITIAL_STATE.gutter,
      offsetY: INITIAL_STATE.offsetY,
      hierarchy: INITIAL_STATE.hierarchy,
      artASide: INITIAL_STATE.artASide,
      artBSide: INITIAL_STATE.artBSide,
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function snapSplit(raw, threshold = 0.022) {
  const c = clamp(raw, 0.22, 0.78);
  for (const s of SNAP_SPLITS) {
    if (Math.abs(c - s.v) <= threshold) return { value: s.v, snapped: s.label };
  }
  return { value: c, snapped: null };
}

// 轻量准确的字符宽度估算（保证不依赖 canvas context 也能单真源算出行数与每行字数）
function charUnits(ch) {
  const code = ch.charCodeAt(0);
  if (code <= 0x7f) {
    if (ch === " ") return 0.32;
    if ("ilI1.,:;|!'`".includes(ch)) return 0.34;
    if ("MW@#%&".includes(ch)) return 0.78;
    return 0.56;
  }
  return 1.0; // CJK 全角字
}

export function wrapText(text, maxWidthPx, fontSizePx) {
  if (!text || maxWidthPx <= fontSizePx) return [text || ""];
  const maxUnits = Math.max(2.2, maxWidthPx / fontSizePx);
  const tokens = [];
  // 英文按词切，中文按单字切，避免生硬截断英文词
  let buf = "";
  for (const ch of text) {
    if (/[A-Za-z0-9'-]/.test(ch)) {
      buf += ch;
    } else {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
      tokens.push(ch);
    }
  }
  if (buf) tokens.push(buf);

  const lines = [];
  let cur = "";
  let curUnits = 0;

  for (const tok of tokens) {
    let tokUnits = 0;
    for (const ch of tok) tokUnits += charUnits(ch);
    if (tok === " " && cur === "") continue;
    if (cur && curUnits + tokUnits > maxUnits) {
      lines.push(cur.trimEnd());
      cur = tok === " " ? "" : tok;
      curUnits = tok === " " ? 0 : tokUnits;
    } else {
      cur += tok;
      curUnits += tokUnits;
    }
  }
  if (cur.trim()) lines.push(cur.trimEnd());
  return lines.length ? lines : [""];
}

// 从当前状态和真实画布尺寸，一次算出两栏所有元素的几何坐标 + 单真源指标 + 诊断结论
export function computeLayout(state, width, height) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.bilingual;
  const compact = width < 480;
  const short = height < 330;
  const spacious = width >= 880 && height >= 450;
  const padX = compact ? 14 : spacious ? 34 : 26;
  const topHeaderY = short ? 34 : compact ? 38 : spacious ? 48 : 44;
  const bottomReserve = short ? 28 : compact ? 34 : 40;
  const innerW = Math.max(220, width - padX * 2);

  // 中缝在极窄屏按比例柔和缩放，避免把 360px 画布撑爆，同时保留真实的数值映射
  const gutterScale = compact ? 0.62 : 1;
  const drawnGutter = clamp(Math.round(state.gutter * gutterScale), 0, Math.round(innerW * 0.28));
  const availW = Math.max(140, innerW - drawnGutter);

  const split = clamp(state.split, 0.22, 0.78);
  const leftW = Math.round(availW * split);
  const rightW = availW - leftW;
  const leftX = padX;
  const rightX = padX + leftW + drawnGutter;
  const dividerX = padX + leftW + drawnGutter / 2;

  const offsetScale = short ? 0.56 : compact ? 0.68 : 1;
  const drawnOffsetY = Math.round(state.offsetY * offsetScale);
  const baseTopY = topHeaderY + (drawnOffsetY < 0 ? Math.abs(drawnOffsetY) : 0);
  const leftTopY = baseTopY;
  const rightTopY = baseTopY + drawnOffsetY;

  // 根据层级档位与画布尺度确定字号与字重（844×390 横屏不裁底、2560 宽屏饱满舒展）
  const baseScale = short ? 0.76 : compact ? 0.8 : spacious ? 1.16 : 1;
  let titleSize = Math.round(25 * baseScale);
  let bodySize = Math.round(12.2 * baseScale);
  let bulletSize = Math.round(11.4 * baseScale);
  let titleWeight = 800;
  let bodyWeight = 400;
  let accentBar = true;

  if (state.hierarchy === "flat") {
    titleSize = Math.round(13.5 * baseScale);
    bodySize = Math.round(12.5 * baseScale);
    bulletSize = Math.round(12 * baseScale);
    titleWeight = 500;
    bodyWeight = 500;
    accentBar = false;
  } else if (state.hierarchy === "clash") {
    titleSize = Math.round(25 * baseScale);
    bodySize = Math.round(16.5 * baseScale);
    bulletSize = Math.round(14.5 * baseScale);
    titleWeight = 900;
    bodyWeight = 700;
    accentBar = true;
  }

  const lineH = Math.round(bodySize * (short ? 1.38 : 1.56));
  const titleLineH = Math.round(titleSize * (short ? 1.1 : 1.18));

  // 给左右两栏按顺序排版，算出每个模块的真实矩形
  const artsLeft = [];
  const artsRight = [];
  if (state.artASide === "left") artsLeft.push(sc.artA);
  else artsRight.push(sc.artA);
  if (state.artBSide === "left") artsLeft.push(sc.artB);
  else artsRight.push(sc.artB);

  const maxArtH = short ? 74 : compact ? 96 : spacious ? 164 : 126;

  function buildColumn(side, colX, colW, startY, content, arts) {
    let y = startY;
    const items = [];

    // 1. Kicker
    const kickerH = Math.round(13 * baseScale);
    items.push({ kind: "kicker", x: colX, y, w: colW, h: kickerH, text: content.kicker });
    y += kickerH + (short ? 2 : compact ? 4 : spacious ? 7 : 5);

    // 2. Title
    const titleStartY = y;
    const titleLines = [];
    for (const raw of content.titleLines) {
      const wrapped = wrapText(raw, colW - 4, titleSize * 0.96);
      titleLines.push(...wrapped);
    }
    const titleH = titleLines.length * titleLineH;
    items.push({ kind: "title", x: colX, y, w: colW, h: titleH, lines: titleLines, lineH: titleLineH, size: titleSize, weight: titleWeight });
    y += titleH + (short ? 3 : compact ? 5 : spacious ? 9 : 7);

    // 3. Short accent rule
    if (accentBar) {
      items.push({ kind: "bar", x: colX, y, w: Math.min(34, colW * 0.28), h: 3 });
      y += short ? 5 : compact ? 8 : spacious ? 13 : 11;
    } else {
      y += short ? 2 : compact ? 3 : 5;
    }

    // 4. Lead paragraph
    const leadLines = wrapText(content.lead, colW - 4, bodySize);
    const leadH = leadLines.length * lineH;
    items.push({ kind: "lead", x: colX, y, w: colW, h: leadH, lines: leadLines, lineH, size: bodySize, weight: bodyWeight });
    y += leadH + (short ? 5 : compact ? 8 : spacious ? 14 : 10);

    // 5. Movable artworks inside this column
    const artRects = [];
    const artCount = arts.length;
    const perArtMaxH = artCount > 1 ? Math.round(maxArtH * (short ? 0.56 : 0.54)) : maxArtH;
    const minArtH = short ? 36 : 50;
    for (const art of arts) {
      const w = Math.min(colW, Math.round(perArtMaxH * art.baseAspect));
      const h = Math.min(perArtMaxH, Math.max(minArtH, Math.round(w / art.baseAspect)));
      const rect = {
        kind: "art",
        artId: art.id,
        artKind: art.kind,
        label: art.label,
        hint: art.hint,
        side,
        opticalDensity: art.opticalDensity,
        x: colX,
        y,
        w: Math.max(short ? 38 : 46, Math.min(colW, w)),
        h,
      };
      items.push(rect);
      artRects.push(rect);
      y += h + (short ? 4 : compact ? 6 : spacious ? 10 : 8);
    }

    // 6. Bullets
    const bulletItems = [];
    const bulletLineH = Math.round(bulletSize * (short ? 1.32 : 1.48));
    for (const b of content.bullets) {
      const wrapped = wrapText(b, Math.max(40, colW - 18), bulletSize);
      bulletItems.push({ y, lines: wrapped, lineH: bulletLineH });
      y += wrapped.length * bulletLineH + (short ? 2 : compact ? 3 : spacious ? 5 : 4);
    }
    items.push({ kind: "bullets", x: colX, y: bulletItems[0]?.y ?? y, w: colW, h: y - (bulletItems[0]?.y ?? y), list: bulletItems, size: bulletSize });

    // 估算该栏实绘视觉墨量（图形面积 × 光学密度 + 标题面积 × 字重系数 + 正文面积）
    let visualMass = 0;
    const titleWeightFactor = titleWeight >= 800 ? 0.56 : 0.28;
    visualMass += titleLines.reduce((s, l) => s + Math.min(colW, l.length * titleSize * 0.82), 0) * titleLineH * titleWeightFactor;
    visualMass += leadLines.reduce((s, l) => s + Math.min(colW, l.length * bodySize * 0.68), 0) * lineH * (bodyWeight >= 600 ? 0.36 : 0.22);
    for (const ar of artRects) {
      visualMass += ar.w * ar.h * ar.opticalDensity;
    }
    visualMass += content.bullets.length * Math.min(colW, 130) * bulletLineH * 0.2;

    // 计算正文平均每行字符单元数（CJU）
    const totalUnits = leadLines.reduce((acc, ln) => {
      let u = 0;
      for (const ch of ln) u += charUnits(ch);
      return acc + u;
    }, 0);
    const avgCharsPerLine = leadLines.length ? totalUnits / leadLines.length : 0;

    return {
      side,
      x: colX,
      y: startY,
      w: colW,
      h: Math.max(40, y - startY),
      bottomY: y,
      titleStartY,
      items,
      artRects,
      leadLines,
      avgCharsPerLine,
      visualMass,
    };
  }

  const leftCol = buildColumn("left", leftX, leftW, leftTopY, sc.left, artsLeft);
  const rightCol = buildColumn("right", rightX, rightW, rightTopY, sc.right, artsRight);

  const totalMass = Math.max(1, leftCol.visualMass + rightCol.visualMass);
  const leftMassPct = Math.round((leftCol.visualMass / totalMass) * 100);
  const rightMassPct = 100 - leftMassPct;
  const splitLeftPct = Math.round(split * 100);
  const splitRightPct = 100 - splitLeftPct;

  // 等效桌面像素宽（按 960px 参考内容区核算，保证手机与桌面规则标准一致）
  const refAvail = 960 - state.gutter;
  const effLeftPx = Math.round(refAvail * split);
  const effRightPx = Math.round(refAvail * (1 - split));
  const minColPx = Math.min(effLeftPx, effRightPx);

  const heightRatio = Math.max(leftCol.h, rightCol.h) / Math.max(1, Math.min(leftCol.h, rightCol.h));
  const gutterToLine = +(state.gutter / 20).toFixed(2); // 相对 20px 标准行距的倍数

  // ---- 四大设计要点单真源判定（双向错态全覆盖） ----
  const issues = [];

  // 1. 对齐 ALIGNMENT
  let alignOk = Math.abs(state.offsetY) <= 8;
  let alignTag = "顶沿齐平";
  if (state.offsetY > 8) {
    alignTag = `右栏下沉 +${state.offsetY}px`;
    issues.push({
      priority: 2,
      rule: "align",
      code: "top_drop",
      title: `右栏顶沿下沉 ${state.offsetY}px，跨栏对照基准断裂`,
      reason: `双列页面靠同一条顶沿和水平基线建立并行秩序。现在右栏整体往下滑了 ${state.offsetY}px，读完左栏标题再横扫右栏时，视线会先扑空再向下寻锚，对比效率明显下降。`,
      actionLabel: "对齐双栏顶沿",
      fixPatch: { offsetY: 0 },
    });
  } else if (state.offsetY < -8) {
    alignTag = `右栏上翘 ${state.offsetY}px`;
    issues.push({
      priority: 2,
      rule: "align",
      code: "top_lift",
      title: `右栏顶沿倒翘 ${Math.abs(state.offsetY)}px，头重脚错`,
      reason: `右栏反超左栏顶沿 ${Math.abs(state.offsetY)}px，违背从左到右起眼的自然入口，页面顶部形成锯齿台阶，双栏看起来像两张贴歪的纸片。`,
      actionLabel: "对齐双栏顶沿",
      fixPatch: { offsetY: 0 },
    });
  }

  // 2. 平衡 BALANCE（同时检视栏宽挤压与左右视觉墨量/高度配重）
  let balanceOk = true;
  let balanceTag = `配重 ${leftMassPct}:${rightMassPct}`;
  if (split > 0.66) {
    balanceOk = false;
    balanceTag = `右栏挤窄 ${splitRightPct}%`;
    issues.push({
      priority: 1,
      rule: "balance",
      code: "split_crush_right",
      title: `栏比 ${splitLeftPct}:${splitRightPct}，右栏被挤成碎字窄条`,
      reason: `右栏仅分得 ${splitRightPct}%（等效约 ${effRightPx}px），每行只能塞进约 ${Math.max(3, Math.round(rightCol.avgCharsPerLine))} 个字宽，句子被频繁折断；左栏又拉得过宽，双栏退化成「主文压死残条」。`,
      actionLabel: "拉开至 50:50 或 60:40",
      fixPatch: { split: 0.5 },
    });
  } else if (split < 0.34) {
    balanceOk = false;
    balanceTag = `左栏挤窄 ${splitLeftPct}%`;
    issues.push({
      priority: 1,
      rule: "balance",
      code: "split_crush_left",
      title: `栏比 ${splitLeftPct}:${splitRightPct}，左栏入口被压碎`,
      reason: `左栏只剩 ${splitLeftPct}%（等效约 ${effLeftPx}px），作为第一落眼的起手区域却过窄断句，而右栏被拉成宽幅单块，整页重心向右倾覆。`,
      actionLabel: "回拉至 38:62 或 50:50",
      fixPatch: { split: 0.5 },
    });
  } else if (leftMassPct > 63) {
    balanceOk = false;
    balanceTag = `左重 ${leftMassPct}%`;
    issues.push({
      priority: 2,
      rule: "balance",
      code: "left_heavy",
      title: `左栏实测分量占 ${leftMassPct}%，两幅主图压垮左翼`,
      reason: `视觉平衡不只看框宽，更看墨量与图块分量。现在图块都堆在左栏，左栏高度和墨量远超右栏，页面右侧像留了一块未完工的空洞。直接点画布里的图块即可跨中缝移去右栏。`,
      actionLabel: "将图块移去右栏平衡",
      fixPatch: { artASide: "left", artBSide: "right" },
    });
  } else if (rightMassPct > 63) {
    balanceOk = false;
    balanceTag = `右重 ${rightMassPct}%`;
    issues.push({
      priority: 2,
      rule: "balance",
      code: "right_heavy",
      title: `右栏实测分量占 ${rightMassPct}%，画面向右倾覆`,
      reason: `两幅图块全部压在右栏，使右栏视觉重量高达 ${rightMassPct}%，而左栏起手显得空薄失重。点击画布中的图块把它调回左栏，可立刻稳住重心。`,
      actionLabel: "将图块移回左栏平衡",
      fixPatch: { artASide: "left", artBSide: "right" },
    });
  }

  // 3. 浏览 SCAN（中缝过窄串行 vs 中缝过宽割裂）
  let scanOk = true;
  let scanTag = `中缝 ${state.gutter}px`;
  if (state.gutter < 16) {
    scanOk = false;
    scanTag = `串行 ${state.gutter}px`;
    issues.push({
      priority: 0,
      rule: "scan",
      code: "gutter_bleed",
      title: `栏间中缝仅 ${state.gutter}px，眼睛极易跨栏串行`,
      reason: `中缝比正文行距还窄（仅约 ${gutterToLine}× 行距）。按格式塔亲密性原则，左栏行尾与右栏行首贴得比上下行还近，读者扫读时容易直接横穿中缝读错行。`,
      actionLabel: "拉开安全中缝至 32px",
      fixPatch: { gutter: 32 },
    });
  } else if (state.gutter > 68) {
    scanOk = false;
    scanTag = `割裂 ${state.gutter}px`;
    issues.push({
      priority: 1,
      rule: "scan",
      code: "gutter_split",
      title: `栏间中缝宽达 ${state.gutter}px，两栏割裂成孤岛`,
      reason: `中缝拉到 ${state.gutter}px（超出行距 3.4 倍），两栏被一道大白沟彻底切断，原本并列对照的双语或方案失去横向关联，眼球来回摆动距离暴增。`,
      actionLabel: "收紧中缝至 34px",
      fixPatch: { gutter: 34 },
    });
  }

  // 4. 层级 HIERARCHY
  let hierarchyOk = state.hierarchy === "clear";
  let hierarchyTag = "层级分明";
  if (state.hierarchy === "flat") {
    hierarchyTag = "字级拉平";
    issues.push({
      priority: 3,
      rule: "hierarchy",
      code: "flat_hierarchy",
      title: "标题与正文尺度拉平，进场找不到起读锚点",
      reason: "双列本身同时呈现两套信息，如果没有明确的标题字号、字重与短隔线拉开层级，读者面对两片同样灰度的文字块，第一秒就会犹豫该从哪里下眼。",
      actionLabel: "建立清晰标题层级",
      fixPatch: { hierarchy: "clear" },
    });
  } else if (state.hierarchy === "clash") {
    hierarchyTag = "双核抢戏";
    issues.push({
      priority: 3,
      rule: "hierarchy",
      code: "over_loud",
      title: "正文与标题全员加粗放大，两栏互相抢戏",
      reason: "处处强调等于没有强调。左右两栏的正文全被推成粗大块，视觉噪声盖过了主标与要点，扫视时眼睛在两栏之间来回拉扯。",
      actionLabel: "恢复克制主次层级",
      fixPatch: { hierarchy: "clear" },
    });
  }

  issues.sort((a, b) => a.priority - b.priority);
  const passCount = [alignOk, balanceOk, scanOk, hierarchyOk].filter(Boolean).length;
  const allPass = passCount === 4;

  // 识别当前命中的是哪一类合法双列解
  let solutionName = "经典双列平衡";
  if (Math.abs(split - 0.5) <= 0.04) solutionName = "50:50 对等对比解";
  else if (split > 0.54) solutionName = `${splitLeftPct}:${splitRightPct} 左主右辅解`;
  else solutionName = `${splitLeftPct}:${splitRightPct} 左导右展解`;

  const primaryIssue = issues[0] || null;
  const shortBadge = allPass
    ? `4/4 · ${solutionName}`
    : `${passCount}/4 · ${
        primaryIssue.code === "gutter_bleed"
          ? "窄缝串行"
          : primaryIssue.code === "gutter_split"
            ? "宽缝割裂"
            : primaryIssue.code === "split_crush_right"
              ? "右栏挤碎"
              : primaryIssue.code === "split_crush_left"
                ? "左栏挤碎"
                : primaryIssue.code === "top_drop" || primaryIssue.code === "top_lift"
                  ? "顶沿错位"
                  : primaryIssue.code === "left_heavy"
                    ? "左重失衡"
                    : primaryIssue.code === "right_heavy"
                      ? "右重倒挂"
                      : primaryIssue.code === "over_loud"
                        ? "双核抢戏"
                        : "层级拉平"
      }`;

  const diagnosis = allPass
    ? {
        ok: true,
        title: `已达成「${solutionName}」，四项双列要点全部稳住`,
        reason: `当前栏比 ${splitLeftPct}:${splitRightPct}、中缝 ${state.gutter}px、顶沿齐平、左右视觉配重 ${leftMassPct}:${rightMassPct}。视线能先在左栏清晰落脚，再沿齐平基线顺畅扫向右栏，不串行也不割裂。试试拖到 60:40 或 38:62，感受不同主次节奏。`,
        actionLabel: "切换 60:40 主次解",
        fixPatch: Math.abs(split - 0.5) <= 0.04 ? { split: 0.6, gutter: 36 } : { split: 0.5, gutter: 34 },
      }
    : {
        ok: false,
        title: primaryIssue.title,
        reason: primaryIssue.reason,
        actionLabel: primaryIssue.actionLabel,
        fixPatch: primaryIssue.fixPatch,
      };

  const cssSnippet = `display: grid;\ngrid-template-columns: ${splitLeftPct}fr ${splitRightPct}fr;\ncolumn-gap: ${state.gutter}px;\nalign-items: start;${state.offsetY !== 0 ? ` /* 右栏错顶 ${state.offsetY > 0 ? "+" : ""}${state.offsetY}px */` : ""}`;

  // 给出适合画布的动态内容总高（不留底部大片空洞，也保证所有块都能装下）
  const contentBottom = Math.max(leftCol.bottomY, rightCol.bottomY) + bottomReserve;

  return {
    scenario: sc,
    padX,
    topHeaderY,
    leftX,
    rightX,
    leftW,
    rightW,
    drawnGutter,
    dividerX,
    leftTopY,
    rightTopY,
    drawnOffsetY,
    leftCol,
    rightCol,
    contentBottom,
    metrics: {
      splitLeftPct,
      splitRightPct,
      gutter: state.gutter,
      gutterToLine,
      offsetY: state.offsetY,
      leftMassPct,
      rightMassPct,
      effLeftPx,
      effRightPx,
      minColPx,
      heightRatio: +heightRatio.toFixed(2),
    },
    rules: {
      align: { ok: alignOk, tag: alignTag },
      balance: { ok: balanceOk, tag: balanceTag },
      scan: { ok: scanOk, tag: scanTag },
      hierarchy: { ok: hierarchyOk, tag: hierarchyTag },
    },
    issues,
    passCount,
    allPass,
    shortBadge,
    diagnosis,
    cssSnippet,
  };
}
