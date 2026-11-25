// 142 大标题 版式 — 统一数据模型、单一常量表与同源几何实测引擎
// 全页（开场封面、四关键词灯、02 节参数、07 节小练习）共用本文件导出的常量与判定函数。

export const RULES = Object.freeze({
  // 封面严格 4:5 逻辑基准尺寸（所有视口等比缩放，杜绝拉扁）
  BASE_W: 440,
  BASE_H: 550,

  // 主辅字号倍率（主标题渲染字号 ÷ 最大辅助信息渲染字号）— 实务经验值
  RATIO_FLAT_MAX: 2.2,     // < 2.2×：平权贴近，看不出头号锚点
  RATIO_MIN_PASS: 3.5,     // ≥ 3.5×：进入大标题经验起步线
  RATIO_SWEET_MAX: 6.0,    // 3.5×–6.0×：焦距稳健（实务经验区）
  RATIO_HARD_MAX: 6.5,     // > 6.5×：极易压迫辅文或挤干留白

  // 纸面净留白：1 - (DOM 行框矩形并集面积 ÷ 封面总面积) — 实务经验值
  WHITESPACE_MIN: 0.42,    // < 42%：留白不足 / 过载撑爆
  WHITESPACE_MAX: 0.74,    // 42%–74%：纸面呼吸经验区

  // 主标题精炼度 — 实务经验值
  CHARS_MIN: 3,
  CHARS_MAX: 7,
  LINES_MAX: 2,

  // 辅文近看可读下限（弱化是退后，不是删掉）
  AUX_MIN_RENDER_PX: 11,   // 实际渲染字号 < 11px 触发「辅文消失」
  AUX_HARD_FLOOR_PX: 10,   // CSS 渲染保护硬底，防止小屏出现 < 10px 碎字
  AUX_MIN_CONTRAST: 4.5,   // WCAG AA 普通文本对比度下限

  // 巨字行高经验区（02 节行距夹钳）
  LEADING_MIN: 0.95,
  LEADING_MAX: 1.12,

  // 基准字号拖拽边界（按 BASE_W = 440 计）
  HEADLINE_MIN: 20,
  HEADLINE_MAX: 156,
  SUB_MIN: 8.5,
  SUB_MAX: 42,
  META_MIN: 8.5,
  META_MAX: 36,
});

export const PAPER_RGB = [247, 242, 234]; // #F7F2EA

export function contrastRatio(rgb1, rgb2) {
  const lum = ([r, g, b]) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const l1 = lum(rgb1);
  const l2 = lum(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 辅文三档墨重：强（抢戏）/ 弱化（退后且近看清晰）/ 过弱（发虚失读，演示「辅文消失」）
export const INK_TIERS = Object.freeze({
  sub: {
    strong: {
      id: "strong",
      label: "粗黑强档",
      short: "强",
      color: "#111111",
      rgb: [17, 17, 17],
      weight: 800,
      contrast: +contrastRatio([17, 17, 17], PAPER_RGB).toFixed(1), // 17.0
      massFactor: 1.0,
    },
    muted: {
      id: "muted",
      label: "炭灰弱化",
      short: "弱化",
      color: "#524F4A",
      rgb: [82, 79, 74],
      weight: 400,
      contrast: +contrastRatio([82, 79, 74], PAPER_RGB).toFixed(1), // 7.3
      massFactor: 0.34,
    },
    ghost: {
      id: "ghost",
      label: "过弱发虚",
      short: "过弱",
      color: "#837E75",
      rgb: [131, 126, 117],
      weight: 400,
      contrast: +contrastRatio([131, 126, 117], PAPER_RGB).toFixed(1), // 3.6 (< 4.5)
      massFactor: 0.16,
    },
  },
  meta: {
    strong: {
      id: "strong",
      label: "实底蓝块",
      short: "强",
      color: "#FFFFFF",
      bg: "#1446B8",
      rgb: [20, 70, 184],
      weight: 700,
      isSolidBlock: true,
      contrast: +contrastRatio([255, 255, 255], [20, 70, 184]).toFixed(1), // 7.9
      massFactor: 1.38, // 实底高饱和蓝块在三米外极抢眼
    },
    muted: {
      id: "muted",
      label: "去底弱化",
      short: "弱化",
      color: "#524F4A",
      bg: "transparent",
      rgb: [82, 79, 74],
      weight: 500,
      isSolidBlock: false,
      contrast: +contrastRatio([82, 79, 74], PAPER_RGB).toFixed(1), // 7.3
      massFactor: 0.32,
    },
    ghost: {
      id: "ghost",
      label: "过弱发虚",
      short: "过弱",
      color: "#837E75",
      bg: "transparent",
      rgb: [131, 126, 117],
      weight: 400,
      isSolidBlock: false,
      contrast: +contrastRatio([131, 126, 117], PAPER_RGB).toFixed(1), // 3.6 (< 4.5)
      massFactor: 0.15,
    },
  },
});

// 开场活体封面的 6 枚可点击删减词块（共 14 字；「旧船厂」为核心主体词）
export const COVER_WORDS = Object.freeze([
  { id: "annual", text: "年度", core: false, role: "时间修饰" },
  { id: "shipyard", text: "旧船厂", core: true, role: "核心主体" },
  { id: "industrial", text: "工业遗址", core: false, role: "重复限定" },
  { id: "space", text: "空间", core: false, role: "宽泛泛词" },
  { id: "rebirth", text: "再生", core: false, keyAction: true, role: "核心动作" },
  { id: "report", text: "观察报告", core: false, role: "文体套话" },
]);

export function createInitialState() {
  return {
    kept: COVER_WORDS.map((w) => w.id),
    selectedLayer: "headline", // "headline" | "sub" | "meta"
    headlinePx: 28,
    subPx: 21,
    metaPx: 17,
    subTier: "strong",
    metaTier: "strong",
  };
}

// 精确二维矩形并集面积（归一化坐标 [0..1]），零像素扫描、完全确定
export function unionRectArea(rects) {
  const valid = rects
    .map((r) => ({
      x1: Math.max(0, Math.min(1, r.x)),
      y1: Math.max(0, Math.min(1, r.y)),
      x2: Math.max(0, Math.min(1, r.x + r.w)),
      y2: Math.max(0, Math.min(1, r.y + r.h)),
    }))
    .filter((r) => r.x2 > r.x1 + 1e-5 && r.y2 > r.y1 + 1e-5);
  if (!valid.length) return 0;

  const xs = [...new Set(valid.flatMap((r) => [r.x1, r.x2]))].sort((a, b) => a - b);
  let total = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    const x1 = xs[i];
    const x2 = xs[i + 1];
    const dx = x2 - x1;
    if (dx <= 1e-6) continue;
    const ys = [];
    for (const r of valid) {
      if (r.x1 <= x1 + 1e-6 && r.x2 >= x2 - 1e-6) ys.push([r.y1, r.y2]);
    }
    if (!ys.length) continue;
    ys.sort((a, b) => a[0] - b[0]);
    let curStart = ys[0][0];
    let curEnd = ys[0][1];
    let coveredY = 0;
    for (let j = 1; j < ys.length; j++) {
      if (ys[j][0] <= curEnd) {
        curEnd = Math.max(curEnd, ys[j][1]);
      } else {
        coveredY += curEnd - curStart;
        curStart = ys[j][0];
        curEnd = ys[j][1];
      }
    }
    coveredY += curEnd - curStart;
    total += dx * coveredY;
  }
  return Math.max(0, Math.min(1, total));
}

// 从真实 DOM 文本节点提取行框矩形，返回相对于 container 的归一化矩形组
export function collectTextLineRects(containerEl, el, meta = {}) {
  const cr = containerEl.getBoundingClientRect();
  if (cr.width < 1 || cr.height < 1 || !el) {
    return { rects: [], lines: 0, bbox: null, fontSize: 0 };
  }
  const cs = getComputedStyle(el);
  const fontSize = parseFloat(cs.fontSize) || 14;
  const raw = [];

  if (meta.useSolidBox) {
    const r = el.getBoundingClientRect();
    if (r.width > 1 && r.height > 1) raw.push(r);
  } else {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent || !node.textContent.trim()) continue;
      const parent = node.parentElement;
      if (parent && (parent.hidden || getComputedStyle(parent).display === "none")) continue;
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width > 1 && r.height > 1) raw.push(r);
      }
    }
  }

  // 把同一水平行上拆碎的词块矩形合并成行框，并统计行数
  const rows = [];
  const tol = Math.max(4, fontSize * 0.42);
  for (const r of raw) {
    const cy = r.top + r.height / 2;
    let row = rows.find((g) => Math.abs(g.cy - cy) <= tol);
    if (!row) {
      row = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, cy };
      rows.push(row);
    } else {
      row.left = Math.min(row.left, r.left);
      row.top = Math.min(row.top, r.top);
      row.right = Math.max(row.right, r.right);
      row.bottom = Math.max(row.bottom, r.bottom);
      row.cy = (row.top + row.bottom) / 2;
    }
  }
  rows.sort((a, b) => a.top - b.top);

  const rects = rows.map((row) => ({
    x: (row.left - cr.left) / cr.width,
    y: (row.top - cr.top) / cr.height,
    w: (row.right - row.left) / cr.width,
    h: (row.bottom - row.top) / cr.height,
    layer: meta.layer || "headline",
    weight: meta.weight ?? 1,
    color: meta.color || "#111111",
    isSolidBlock: !!meta.useSolidBox,
  }));

  let bbox = null;
  if (rows.length) {
    bbox = {
      left: Math.min(...rows.map((r) => r.left)) - cr.left,
      top: Math.min(...rows.map((r) => r.top)) - cr.top,
      right: Math.max(...rows.map((r) => r.right)) - cr.left,
      bottom: Math.max(...rows.map((r) => r.bottom)) - cr.top,
    };
  }
  return { rects, lines: rows.length, bbox, fontSize };
}

export function ratioTierLabel(ratio) {
  if (ratio < RULES.RATIO_FLAT_MAX) return { code: "flat", label: "平权贴近" };
  if (ratio < RULES.RATIO_MIN_PASS) return { code: "weak", label: "级差偏弱" };
  if (ratio <= RULES.RATIO_SWEET_MAX) return { code: "sweet", label: "焦距稳健" };
  return { code: "extreme", label: "极强压迫" };
}

export function whitespaceTierLabel(ws, ratio = RULES.RATIO_MIN_PASS) {
  if (ws < RULES.WHITESPACE_MIN) return { code: "tight", label: "偏满拥挤" };
  if (ws <= RULES.WHITESPACE_MAX) return { code: "good", label: "呼吸充裕" };
  if (ratio < RULES.RATIO_MIN_PASS) return { code: "sparse", label: "松散无托" };
  return { code: "good", label: "大留白" };
}

// 统一评估封面状态：同一组 DOM 行框矩形同时导出净留白、第一眼墨团、四灯与严格优先级单条主诊断
export function evaluateCover(state, geom) {
  const keptWords = COVER_WORDS.filter((w) => state.kept.includes(w.id));
  const charCount = keptWords.reduce((sum, w) => sum + w.text.length, 0);
  const hasCore = state.kept.includes("shipyard");

  const subMeta = INK_TIERS.sub[state.subTier];
  const metaMeta = INK_TIERS.meta[state.metaTier];

  const hPx = geom.headline.fontSize || state.headlinePx;
  const sPx = geom.sub.fontSize || state.subPx;
  const mPx = geom.meta.fontSize || state.metaPx;
  const maxAuxPx = Math.max(sPx, mPx);
  const minAuxPx = Math.min(sPx, mPx);
  const ratio = maxAuxPx > 0 ? hPx / maxAuxPx : 0;

  const allRects = [...geom.headline.rects, ...geom.sub.rects, ...geom.meta.rects];
  const coveredArea = unionRectArea(allRects);
  const whitespace = Math.max(0, Math.min(1, 1 - coveredArea));

  // 三米远观「第一眼墨团」：由同一组 DOM 行框矩形按 面积 × 字重/实底权重 计算
  const massOf = (rects) => rects.reduce((acc, r) => acc + Math.max(0, r.w * r.h) * r.weight, 0);
  const masses = {
    headline: massOf(geom.headline.rects),
    sub: massOf(geom.sub.rects),
    meta: massOf(geom.meta.rects),
  };
  const totalMass = masses.headline + masses.sub + masses.meta || 1;
  const headlineShare = masses.headline / totalMass;

  // 第一眼归属判定
  let firstEyeLayer = "headline";
  const maxAuxMass = Math.max(masses.sub, masses.meta);
  if (masses.meta > masses.headline && masses.meta >= masses.sub) {
    firstEyeLayer = "meta";
  } else if (masses.sub > masses.headline && masses.sub > masses.meta) {
    firstEyeLayer = "sub";
  } else if (masses.headline <= maxAuxMass * 1.35) {
    firstEyeLayer = "split"; // 多处抢戏、无唯一焦点
  }

  // 安全间距 / 撞区判定
  const hBox = geom.headline.bbox;
  const sBox = geom.sub.bbox;
  const mBox = geom.meta.bbox;
  const collisionSub = !!(hBox && sBox && hBox.bottom > sBox.top - 6 && hBox.left < sBox.right && hBox.right > sBox.left);
  const collisionMeta = !!(hBox && mBox && hBox.top < mBox.bottom + 4 && hBox.left < mBox.right && hBox.right > mBox.left);
  const overflowBottom = !!(hBox && geom.coverH > 0 && hBox.bottom > geom.coverH - 12);
  const collision = collisionSub || collisionMeta || overflowBottom;

  const lines = geom.headline.lines;
  const minContrast = Math.min(subMeta.contrast, metaMeta.contrast);
  const auxTooSmall = minAuxPx < RULES.AUX_MIN_RENDER_PX - 0.05;
  const auxTooFaint = minContrast < RULES.AUX_MIN_CONTRAST;
  const auxVanished = auxTooSmall || auxTooFaint;
  const auxStrong = state.subTier === "strong" || state.metaTier === "strong";

  const inverted = maxAuxPx >= hPx - 0.5;
  const missingCore = !hasCore || charCount < RULES.CHARS_MIN;
  const flatNoFocus = ratio < RULES.RATIO_FLAT_MAX;
  const longBlownUp = charCount > RULES.CHARS_MAX && (ratio >= RULES.RATIO_FLAT_MAX || lines >= 3);
  const overcrowded = whitespace < RULES.WHITESPACE_MIN || lines > RULES.LINES_MAX || collision || ratio > RULES.RATIO_HARD_MAX;
  const upstaged = auxStrong || ratio < RULES.RATIO_MIN_PASS || firstEyeLayer !== "headline";

  // 严格优先级（1 → 7 → PASS），每次只报一条主诊断
  let status;
  if (missingCore) {
    status = {
      code: "MISSING_CORE",
      priority: 1,
      pass: false,
      badge: "错态 · 剪丢核心",
      title: "版面空了，但核心主体「旧船厂」被删没了",
      why: "大标题版式的第一任务是「迅速传达核心信息」。把关键主体词剪空只剩泛词，读者退后三米只看见大字，却读不懂这期特刊到底讲什么——点下方废字槽把「旧船厂」还原回来。",
    };
  } else if (inverted) {
    const who = mPx >= hPx || firstEyeLayer === "meta" ? "刊期色块" : "副标导语";
    status = {
      code: "INVERTED",
      priority: 2,
      pass: false,
      badge: "错态 · 本末倒置",
      title: `配角压过主角：第一眼先撞上${who}`,
      why: `当前${who}的体量或墨重反超了主标题，画面虽有大小差，但三米外最先送进眼睛的却是期号或辅文。把主标题放大，同时把副标与刊期退回到次级。`,
    };
  } else if (auxVanished) {
    const reason = auxTooSmall && auxTooFaint
      ? `实测辅文已缩至 ${minAuxPx.toFixed(1)}px 且对比度仅 ${minContrast.toFixed(1)}:1`
      : auxTooSmall
        ? `实测辅文已缩至 ${minAuxPx.toFixed(1)}px（低于 ${RULES.AUX_MIN_RENDER_PX}px 近看下限）`
        : `辅文切到过弱档，对比度仅 ${minContrast.toFixed(1)}:1（低于 ${RULES.AUX_MIN_CONTRAST}:1 下限）`;
    status = {
      code: "AUX_VANISHED",
      priority: 3,
      pass: false,
      badge: "错态 · 辅文消失",
      title: "弱化是退后，不是删掉——走近已看不清辅文",
      why: `${reason}。大标题负责三米外拉住人，副标与刊期负责走近后交代期号与导语；把辅文调回 ≥${RULES.AUX_MIN_RENDER_PX}px 并改用「弱化」炭灰档（7.3:1），才算稳妥退让。`,
    };
  } else if (flatNoFocus) {
    status = {
      code: "FLAT_NO_FOCUS",
      priority: 4,
      pass: false,
      badge: "错态 · 平权无焦",
      title: `主辅倍率仅 ${ratio.toFixed(1)}×，封面像平铺通知单`,
      why: `主标与辅文块头太接近（低于 ${RULES.RATIO_FLAT_MAX}× 平权线），加上实底刊期块抢眼，远观窗里几条墨带平摊。先点击标题里多余修饰词剪短，再向右拖主标题缩放角标拉开级差。`,
    };
  } else if (longBlownUp) {
    status = {
      code: "LONG_BLOWN_UP",
      priority: 5,
      pass: false,
      badge: "错态 · 长句硬放大",
      title: `保留了 ${charCount} 字长句直接吹大，排成 ${lines} 行黑字墙`,
      why: `大标题不是把完整报告句硬放大——超过 ${RULES.CHARS_MAX} 字一放大就会拆散节奏并吃掉呼吸空间。直接点击标题里的「年度」「工业遗址」「空间」「观察报告」划删精炼后再放大。`,
    };
  } else if (overcrowded) {
    const detail = collision
      ? "主标题已顶撞副标或刊期安全区"
      : lines > RULES.LINES_MAX
        ? `主标题被撑成 ${lines} 行（超过 ${RULES.LINES_MAX} 行上限）`
        : whitespace < RULES.WHITESPACE_MIN
          ? `纸面净留白跌至 ${Math.round(whitespace * 100)}%（低于 ${Math.round(RULES.WHITESPACE_MIN * 100)}% 经验底线）`
          : `倍率拉到 ${ratio.toFixed(1)}×（超出 ${RULES.RATIO_HARD_MAX}× 挤压线）`;
    status = {
      code: "OVERCROWDED",
      priority: 6,
      pass: false,
      badge: "错态 · 过载撑爆",
      title: `冲击力变成压迫感：${detail}`,
      why: `超大标题必须靠留白缓冲才能立得住。稍微向左收一点主标题角标，让标题落在 ${RULES.LINES_MAX} 行以内并守住 ${Math.round(RULES.WHITESPACE_MIN * 100)}% 以上净留白。`,
    };
  } else if (upstaged) {
    const detail = state.metaTier === "strong" && state.subTier === "strong"
      ? "粗黑副标与实底蓝块刊期都在抢戏"
      : state.metaTier === "strong"
        ? "刊期实底蓝块仍在高声抢戏"
        : state.subTier === "strong"
          ? "副标导语仍是粗黑强档"
          : `主辅倍率 ${ratio.toFixed(1)}× 尚未跨过 ${RULES.RATIO_MIN_PASS}× 经验起步线`;
    status = {
      code: "UPSTAGED",
      priority: 7,
      pass: false,
      badge: "错态 · 喧宾夺主",
      title: `主标立起来一半，但${detail}`,
      why: `大标题成立靠「主角放大」与「配角退让」双向拉扯。选中副标导语与刊期元数据切到「弱化」档，并确保主辅倍率跨过 ${RULES.RATIO_MIN_PASS}×。`,
    };
  } else {
    status = {
      code: "PASS",
      priority: 0,
      pass: true,
      badge: "焦点确立 · 过关",
      title: `1 秒锁定「${keptWords.map((w) => w.text).join("")}」，层级通透且近看清晰`,
      why: `核心词精炼为 ${charCount} 字 ${lines} 行，主辅倍率 ${ratio.toFixed(1)}× 落在 ${RULES.RATIO_MIN_PASS}×–${RULES.RATIO_SWEET_MAX}× 经验区，纸面净留白 ${Math.round(whitespace * 100)}%，副标与刊期稳守 ≥${RULES.AUX_MIN_RENDER_PX}px 与 ≥${RULES.AUX_MIN_CONTRAST}:1 近看底线。`,
    };
  }

  const wsTier = whitespaceTierLabel(whitespace, ratio);

  // 四关键词体检灯（严格同源：只有 7 错态全清零时四灯同亮，并与读数档位 100% 一致）
  const lamps = {
    hierarchy: !inverted && !auxVanished && !auxStrong && ratio >= RULES.RATIO_MIN_PASS,
    focus: !missingCore && !inverted && !flatNoFocus && firstEyeLayer === "headline",
    rhythm: !missingCore && charCount <= RULES.CHARS_MAX && lines >= 1 && lines <= RULES.LINES_MAX,
    space: !overcrowded && wsTier.code === "good" && !collision,
  };

  return {
    charCount,
    lines,
    hPx,
    sPx,
    mPx,
    minAuxPx,
    minContrast,
    ratio,
    ratioTier: ratioTierLabel(ratio),
    whitespace,
    whitespaceTier: wsTier,
    masses,
    headlineShare,
    firstEyeLayer,
    lamps,
    status,
    allRects,
  };
}

// ---------- 01 节：0.8 秒快闪扫读测验 ----------
export const FLASH_SPECIMENS = Object.freeze([
  {
    id: "flat",
    label: "样张 A",
    tag: "平权公告",
    headline: "港口旧船厂秋季城市更新建筑展览开幕公告",
    sub: "十月十二日 · 东岸三号船坞展厅免费开放",
    meta: "EXHIBITION 2026",
    ratioText: "约 1.3×",
    verdict: "字号平齐，0.8 秒内只觉得是一段灰字通知，抓不出核心词。",
  },
  {
    id: "wall",
    label: "样张 B",
    tag: "长句黑墙",
    headline: "港口旧船厂工业遗址空间再生年度建筑展",
    sub: "十月十二日 · 东岸三号船坞",
    meta: "EXHIBITION 2026",
    ratioText: "约 3.8× · 4 行",
    verdict: "字确实很大，但 18 字整句放大把纸面堵满，一眼反而喘不过气。",
  },
  {
    id: "hero",
    label: "样张 C",
    tag: "大标题版式",
    headline: "旧船厂再生",
    sub: "十月十二日 · 东岸三号船坞展厅",
    meta: "EXHIBITION 2026",
    ratioText: "约 4.8× · 2 行",
    verdict: "五字巨标独霸第一眼，弱化副标与留白托住反差，0.8 秒即记住主题。",
    best: true,
  },
]);

// ---------- 03 节：它从哪来（6 段已核实原始史料） ----------
export const TIMELINE_ERAS = Object.freeze([
  {
    year: "1803+",
    tag: "金属展示体诞生",
    title: "Robert Thorne 与 Fat Face",
    summary: "19 世纪初商业招贴兴起，伦敦 Fann Street Foundry 铸字师 Robert Thorne 推出笔画粗细反差极端的金属「Fat Face」展示体——字体史上第一次专为远距离抢眼而非长文通读造字。",
    specimenTitle: "SHIPYARD",
    specimenSub: "LONDON · FANN STREET FOUNDRY · DISPLAY TYPE",
    specimenStyle: "fatface",
    source: "核实来源：Wikipedia Fat face 条目（引用 T. C. Hansard 与 W. Savage 印刷史料）",
  },
  {
    year: "1827–28",
    tag: "木活字量产巨标",
    title: "Darius Wells 与首部木活字目录",
    summary: "金属大字浇铸笨重且冷却易翘裂。纽约印刷商 Darius Wells 于 1827 年发明侧向铣刀批量切削木活字，并于 1828 年印出已知最早的木活字样张目录，指出木活字成本仅约大号金属活字一半，让巨幅街头海报大标题得以普及。",
    specimenTitle: "GRAND AUCTION",
    specimenSub: "WOOD TYPE · LATERAL ROUTER · NEW YORK 1828",
    specimenStyle: "woodtype",
    source: "核实来源：Hamilton 木活字博物馆 & 德州大学 Rob Roy Kelly 美国木活字馆藏",
  },
  {
    year: "1898",
    tag: "报业通栏巨标",
    title: "《缅因号》事件与头版大标题",
    summary: "1898 年 2 月美舰 USS Maine 沉没后，纽约报界在头版大范围启用横贯多栏的巨幅大标题，标题从此不再是小号目录标签，而成为报摊上几步之外先声夺人的核心入口。",
    noteLink: { text: "标题如何跨越多个纵栏组织复杂版面，见 184 跨栏标题。", href: "https://layout.xiaoxiaodong.ai/184/play/" },
    specimenTitle: "MAINE DESTROYED",
    specimenSub: "NEW YORK FRONT PAGE · FEBRUARY 1898",
    specimenStyle: "banner",
    source: "核实来源：美国国会图书馆 Chronicling America 美西战争专题指南",
  },
  {
    year: "1928",
    tag: "现代主义层级宣言",
    title: "Jan Tschichold《新字体排印学》",
    summary: "Jan Tschichold 在柏林首版《Die neue Typographie》，系统反对古典居中对称装饰，提出用强烈的字号反差、非对称落位与积极留白直接表达信息轻重，为现代大标题版式奠定理论骨架。",
    specimenTitle: "DIE NEUE",
    specimenSub: "ASYMMETRIE · KONTRAST · BERLIN 1928",
    specimenStyle: "modern",
    source: "核实来源：加州大学出版社《The New Typography》书目页",
  },
  {
    year: "1963 / 67",
    tag: "广告实务与瑞士教材",
    title: "David Ogilvy 与 Emil Ruder",
    summary: "David Ogilvy 在 1963 年《一个广告人的自白》中总结纸媒广告实务经验：平均而言，读标题的人数是读正文的五倍（纸媒广告经验观察）；1967 年瑞士大师 Emil Ruder 出版《Typographie》，将大小对比、字重层级与留白节奏写进现代设计教材。",
    specimenTitle: "FIVE TO ONE",
    specimenSub: "OGILVY 1963 · RUDER TYPOGRAPHIE 1967",
    specimenStyle: "swiss",
    source: "核实来源：Wikipedia Confessions of an Advertising Man & Emil Ruder 条目",
  },
  {
    year: "2019 / 21",
    tag: "屏幕眼动实证",
    title: "NN/g 扫读研究与视觉层级定义",
    summary: "屏幕时代读者同样极少逐字通读：Nielsen Norman Group 的 Kara Pernice（2019）用眼动追踪记录到读者沿醒目标题与副标题跳跃的「层蛋糕」扫读习惯，Kelley Gordon（2021）进一步将大小与对比归纳为建立 UX 视觉层级的首要手段。",
    noteLink: { text: "层蛋糕扫读路径的完整拆解，见 130 层蛋糕扫描模式。", href: "https://layout.xiaoxiaodong.ai/130/play/" },
    specimenTitle: "SCAN FIRST",
    specimenSub: "PERNICE 2019 · GORDON 2021 · NN/G",
    specimenStyle: "digital",
    source: "核实来源：NN/g Layer-Cake Pattern (2019) & Visual Hierarchy in UX (2021)",
  },
]);

// ---------- 04 节：字一巨大，图形退让 ----------
export const COMP_MODES = Object.freeze([
  {
    id: "top-heavy",
    name: "压顶退图",
    en: "TOP ANCHOR",
    desc: "巨标稳压左上疆界，钴蓝圆斜线悬于右腰留白、蓝三角退到右下出血托底——与 142 原海报同一骨架，字与图互不侵占。",
    defaultPos: { x: 0.78, y: 0.36 },
  },
  {
    id: "split",
    name: "左右切分",
    en: "ASYMMETRIC SPLIT",
    desc: "巨标贴左纵轴展开，钴蓝正圆与 45° 斜线落在右翼留白充当平衡配重，视线先读左字再扫右形。",
    defaultPos: { x: 0.80, y: 0.50 },
  },
  {
    id: "bleed",
    name: "边角出血",
    en: "CORNER BLEED",
    desc: "图形大胆裁切在边角之外，只露出一角锋利斜边，把纸面中心完整让给大标题与呼吸白。",
    defaultPos: { x: 0.86, y: 0.76 },
  },
  {
    id: "underlay",
    name: "浅底穿插",
    en: "SUBTLE UNDERLAY",
    desc: "若图形必须贴近标题，必须大幅降饱和、降明度反差或退到字后作浅色底衬，绝不拿高饱和深色压碎字口。",
    defaultPos: { x: 0.56, y: 0.38 },
  },
]);

// ---------- 05 节：封面、章节页与重点页 ----------
export const SCENE_CASES = Object.freeze([
  {
    id: "cover",
    name: "杂志封面",
    en: "MAGAZINE COVER",
    headline: "海港重塑",
    sub: "冬季建筑特刊 · 十二座工业码头的公共转身",
    meta: "NO. 48 · WINTER 2026",
    note: "书报架上要在两三米外先声夺人：主标最大，刊期、日期与导语全部收细降重，退到边角。",
  },
  {
    id: "chapter",
    name: "章节扉页",
    en: "CHAPTER OPENER",
    headline: "第三章 潮汐",
    sub: "从防波堤混凝土结构到滨水步道尺度，记录港湾日常的十二个月",
    meta: "CHAPTER 03 · P. 084",
    note: "读完长文进入新章，需要一次大幅度的视觉停顿：用巨标和超过一半的空纸给大脑「翻页感」。",
  },
  {
    id: "keynote",
    name: "重点转场页",
    en: "KEYNOTE SLIDE",
    headline: "零延迟上线",
    sub: "离线单文件打包，跨端字体内联，双击即看",
    meta: "RELEASE KEYNOTE · 04 / 12",
    note: "大屏幕演讲最忌满屏要点：一页只放一句大结论，台下最后一排也能 1 秒看完，听众注意力回到讲述者。",
  },
]);

// ---------- 06 节：什么时候别用大标题 + 同小类 12 兄弟页 ----------
export const ANTI_CASES = Object.freeze([
  {
    id: "dashboard",
    title: "高频操作的数据后台",
    badLabel: "硬塞大标题：巨字吃掉半屏，关键指标和筛选按钮被迫挤出首屏。",
    goodLabel: "换用对路：紧凑顶栏（18–20px）配清晰卡片与表格框架，把面积还给高频数据。",
    link: { id: "144", name: "框架版式", href: "https://layout.xiaoxiaodong.ai/144/play/" },
  },
  {
    id: "legal",
    title: "平等并列的长文条款",
    badLabel: "硬塞大标题：把某一句条款单独放大，会误导读者漏掉同样重要的其余细则。",
    goodLabel: "换用对路：走均衡文本层级，用稳定段距、小标与缩进建立平等可读秩序。",
    link: { id: "141", name: "文字主导版式", href: "https://layout.xiaoxiaodong.ai/141/play/" },
  },
  {
    id: "photo",
    title: "靠照片气氛说话的海报",
    badLabel: "硬塞大标题：巨幅粗黑字块盖在人像与光影上，直接打断摄影情绪。",
    goodLabel: "换用对路：让照片独霸画面，标题缩成轻巧细字退到边角。",
    link: { id: "140", name: "图片主导版式", href: "https://layout.xiaoxiaodong.ai/140/play/" },
  },
  {
    id: "long-cond",
    title: "超过 15 字的复杂条件句",
    badLabel: "硬塞大标题：把「如遇恶劣天气活动顺延至下周六且已购票观众可全额退换」吹大，整屏塌成黑墙。",
    goodLabel: "换用对路：先提炼 4 字通知头「活动顺延」，把条件细则放进清晰分栏或面板。",
    link: { id: "145", name: "多面板版式", href: "https://layout.xiaoxiaodong.ai/145/play/" },
  },
]);

export const SIBLING_LAYOUTS = Object.freeze([
  { id: "140", name: "图片主导版式", note: "视觉焦点交给完整大图，文字全面退让" },
  { id: "141", name: "文字主导版式", note: "整页靠多级正文编排阅读秩序，不赌单一巨标" },
  { id: "143", name: "图片窗口版式", note: "借框形开口裁出画面局部制造预览聚焦" },
  { id: "144", name: "框架版式", note: "用清晰线框或色块界定板块边界与秩序" },
  { id: "145", name: "多面板版式", note: "把并列信息拆进多个面板同步陈列" },
  { id: "146", name: "蒙德里安版式", note: "以黑线网格与三原色块建立几何比例对位" },
  { id: "147", name: "马戏团版式", note: "刻意用多处跳跃字号与热闹节奏制造张力" },
  { id: "148", name: "剪影版式", note: "围绕单一醒目剪影排布文字与负空间" },
  { id: "149", name: "字母造型版式", note: "把单个字母当造型容器承载图形或内文" },
  { id: "150", name: "图文谜语版式", note: "用图形直接替代句子里的部分词汇制造互动" },
  { id: "151", name: "拼贴版式", note: "借剪贴重叠与材质对比叠出情绪层次" },
  { id: "152", name: "蒙太奇版式", note: "拼接多组影像碎片形成叙事节奏" },
]);

// ---------- 07 节：小练习（全四档 > 3×、乱序排列、统一常量实测） ----------
// 逻辑扉页 280×350（4:5），内栏宽 232px，副标固定 17px 弱化炭灰（7.3:1）。
// 唯一变量是主标题「冬日港口」字号：72 / 104 / 88 / 56px（全员 > 3×，绝非太小/偏小/合适/太大顺序）
export const EXERCISE_SPEC = Object.freeze({
  baseW: 280,
  baseH: 350,
  padX: 24,
  colW: 232,
  subPx: 17,
  metaPx: 12,
  headlineText: "冬日港口",
  subText: "寒潮后的老码头，记录十二处岸线改造的回声",
  metaText: "CHAPTER 03 · P. 042",
  options: [
    {
      id: "A",
      headlinePx: 72,
      correct: false,
      issueTag: "词组拦腰折断",
      explain: "虽然倍率落在经验区内、留白也够，但 72px 刚好在一行挤进三字、把第四字挤下去，硬生生折成「冬日港 / 口」，撕碎了词组节奏。",
    },
    {
      id: "B",
      headlinePx: 104,
      correct: false,
      issueTag: "留白跌破底线",
      explain: `虽然折成两行「冬日 / 港口」，但倍率超过 ${RULES.RATIO_SWEET_MAX}× 经验上限，且实测净留白跌破 ${Math.round(RULES.WHITESPACE_MIN * 100)}% 底线，巨字向下压迫副标呼吸区。`,
    },
    {
      id: "C",
      headlinePx: 88,
      correct: true,
      issueTag: "焦点与留白兼得",
      explain: `倍率稳落 ${RULES.RATIO_MIN_PASS}×–${RULES.RATIO_SWEET_MAX}× 经验区，利落折成「冬日 / 港口」两行词义完整，实测净留白守住 ${Math.round(RULES.WHITESPACE_MIN * 100)}% 以上，主角稳压右下蓝三角。`,
    },
    {
      id: "D",
      headlinePx: 56,
      correct: false,
      issueTag: "略逊起步线且偏薄",
      explain: `虽然已超 3 倍，但实测倍率（约 3.3×）仍略低于统一 ${RULES.RATIO_MIN_PASS}× 经验起步线；四字排成一条细横带，开阔纸面上重心被右下大蓝三角分走近半。`,
    },
  ],
});
