// 120 共同区域原则 · 单真源几何、亮度与感知诊断模型
// 所有画布坐标、标尺数字、折箭标注、底栏四格状态与诊单文案均由此处同一套计算输出。

export const PALETTE = {
  paper: "#FCF9F3",
  paperBright: "#FFFDF9",
  ink: "#0C0E14",
  inkSoft: "#3F3B37",
  line: "#D4C9BE",
  // 120 原海报逐像素实采三道粉彩底框
  regions: [
    { name: "暖米砂区", fill: "#EBE1D7", tint: "#F4EEE7", ghost: "#FAF7F1", accent: "#E74F08", text: "#B83800" },
    { name: "柔樱粉区", fill: "#FDC2CD", tint: "#FDF0F2", ghost: "#FCF5F2", accent: "#155930", text: "#114B28" },
    { name: "浅藕灰区", fill: "#E2D5D3", tint: "#F2ECEB", ghost: "#F9F6F2", accent: "#0D285F", text: "#0D285F" },
  ],
  // 原海报三色圆点
  dots: ["#E74F08", "#155930", "#0D285F"],
  dotMono: "#1D222B",
  orange: "#E74F08",
  orangeText: "#B83800",
  green: "#155930",
  navy: "#0D285F",
  err: "#B81D24",
  errFill: "rgba(184, 29, 36, 0.08)",
  ok: "#155930",
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 三排圆点",
    shortLabel: "原海报圆点",
    rowNames: ["第一组", "第二组", "第三组"],
    items: [
      { title: "A1", sub: "圆点 1" }, { title: "A2", sub: "圆点 2" }, { title: "A3", sub: "圆点 3" },
      { title: "B1", sub: "圆点 4" }, { title: "B2", sub: "圆点 5" }, { title: "B3", sub: "圆点 6" },
      { title: "C1", sub: "圆点 7" }, { title: "C2", sub: "圆点 8" }, { title: "C3", sub: "圆点 9" },
    ],
  },
  pricing: {
    id: "pricing",
    label: "界面 · 套餐对比卡",
    shortLabel: "套餐对比卡",
    rowNames: ["个人版", "团队版", "企业版"],
    items: [
      { title: "个人版", sub: "1 位成员" }, { title: "¥39/月", sub: "含基础导出" }, { title: "选用", sub: "立即开通", cta: true },
      { title: "团队版", sub: "5 位成员" }, { title: "¥99/月", sub: "含共享组件" }, { title: "选用", sub: "立即开通", cta: true },
      { title: "企业版", sub: "不限人数" }, { title: "¥249/月", sub: "含专属部署" }, { title: "联系", sub: "预约演示", cta: true },
    ],
  },
  form: {
    id: "form",
    label: "表单 · 寄件与发票",
    shortLabel: "寄件与发票",
    rowNames: ["收件人", "派送地址", "开票信息"],
    items: [
      { title: "姓名", sub: "林致远" }, { title: "手机", sub: "138-0013" }, { title: "称谓", sub: "先生" },
      { title: "城市", sub: "上海市" }, { title: "门牌", sub: "安福路 82" }, { title: "邮编", sub: "200031" },
      { title: "抬头", sub: "简墨设计" }, { title: "税号", sub: "9131****" }, { title: "邮箱", sub: "bill@jm" },
    ],
  },
};

export const REGION_MODES = [
  { id: "none", label: "无底框", short: "无框", desc: "纯靠元素距离与颜色" },
  { id: "ghost", label: "幽灵弱底", short: "弱底", desc: "底纸明度差不足 3%" },
  { id: "pastel", label: "粉彩底框", short: "粉彩底", desc: "120 原海报无边框底色" },
  { id: "dashed", label: "深蓝虚线", short: "虚线框", desc: "120 原海报底栏边界线" },
  { id: "solid", label: "克制细框", short: "细实线", desc: "1.5px 低噪轻线容器" },
  { id: "cage", label: "逐点黑牢笼", short: "逐点框", desc: "9 个元素各加 2px 黑框" },
];

export const COLOR_MODES = [
  { id: "mono", label: "纯单色盲测", short: "单色盲测" },
  { id: "conflict", label: "按列撞色拆台", short: "按列撞色" },
  { id: "poster", label: "原海报三色", short: "原海报三色" },
];

// 精确 WCAG 相对亮度
export function hexToRgb(hex) {
  const s = hex.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

export function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const l1 = relLuminance(hexA);
  const l2 = relLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 感知底纸明度差（百分比，以 3 条区域的平均相对亮度差计）
export function regionLumaDiffPct(regionMode) {
  const paperL = relLuminance(PALETTE.paper);
  if (regionMode === "none" || regionMode === "dashed" || regionMode === "solid" || regionMode === "cage") return 0;
  const diffs = PALETTE.regions.map((reg) => {
    const fill = regionMode === "ghost" ? reg.ghost : reg.fill;
    return Math.abs(paperL - relLuminance(fill)) * 100;
  });
  return +(diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1);
}

export function makeZeroOffsets() {
  return Array.from({ length: 9 }, () => ({ dx: 0, dy: 0 }));
}

export function createInitialState() {
  // 开场 0/4 错态：幽灵弱底 + 组内距远大于跨区距(2.08×) + 纯单色盲测 + 第 5 枚圆点下坠压线骑墙
  const offsets = makeZeroOffsets();
  offsets[4] = { dx: 0, dy: 0.42 }; // 相对行步距的偏移：恰好骑在第 2 条底框底边上
  return {
    theme: "poster",
    regionMode: "ghost",
    colorMode: "mono",
    intraRatio: 2.08, // 组内水平距 / 跨区垂直距（范围 0.65 ~ 2.40）
    boxGap: 14,       // 相邻底框外缝 px（范围 0 ~ 28）
    boxPad: 14,       // 底框上下内净空 px（范围 2 ~ 24）
    offsets,
  };
}

export const PRESETS = {
  broken: () => createInitialState(),
  poster: () => ({
    theme: "poster",
    regionMode: "pastel",
    colorMode: "poster",
    intraRatio: 1.82,
    boxGap: 14,
    boxPad: 14,
    offsets: makeZeroOffsets(),
  }),
  adversarial: () => ({
    theme: "poster",
    regionMode: "pastel",
    colorMode: "conflict",
    intraRatio: 2.15,
    boxGap: 14,
    boxPad: 14,
    offsets: makeZeroOffsets(),
  }),
  dashed: () => ({
    theme: "poster",
    regionMode: "dashed",
    colorMode: "mono",
    intraRatio: 1.72,
    boxGap: 16,
    boxPad: 14,
    offsets: makeZeroOffsets(),
  }),
  errCage: () => ({
    theme: "poster",
    regionMode: "cage",
    colorMode: "mono",
    intraRatio: 1.95,
    boxGap: 14,
    boxPad: 12,
    offsets: makeZeroOffsets(),
  }),
  errMerge: () => {
    const offsets = makeZeroOffsets();
    offsets[5] = { dx: 0, dy: 0.96 }; // 第 6 枚点直接串门掉进第 3 条底框
    return {
      theme: "poster",
      regionMode: "pastel",
      colorMode: "mono",
      intraRatio: 1.9,
      boxGap: 1,
      boxPad: 5,
      offsets,
    };
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 依据真实画布尺寸计算全部几何坐标（保证圆点恒为正圆，绝不压扁）
export function computeGeometry(state, W, H) {
  const compact = W < 440;
  const padTop = compact ? 52 : 56;
  const padBot = compact ? 28 : 34;
  const padLeft = compact ? 14 : 26;
  const padRight = compact ? 48 : 76; // 右侧留给跨区红 × 距离标尺

  const availW = Math.max(220, W - padLeft - padRight);
  const availH = Math.max(200, H - padTop - padBot);

  // 三条区域纵向排布：窄屏下收紧单条盒高上限，确保组内水平距仍明显大于跨区垂直距（可呈现真 3 竖列错态）
  const gapPx = clamp(state.boxGap, 0, compact ? 14 : 28);
  const totalGaps = gapPx * 2;
  const maxBoxH = compact ? 58 : 104;
  const boxH = clamp((availH - totalGaps) / 3, compact ? 46 : 56, maxBoxH);
  const interDist = boxH + gapPx; // 上下行中心垂直距

  // 严格正圆半径：由盒高和内边距推得，但保证圆点清晰可读
  const innerPadY = clamp(state.boxPad, 2, Math.floor(boxH * 0.28));
  const dotR = clamp(
    Math.min((boxH - innerPadY * 2) * 0.48, compact ? 16 : 25, availW * 0.062),
    11,
    25
  );

  // 真实元素尺寸（圆点模式为直径 2*dotR 的正圆；卡片/表单模式为小块芯片）
  const isPoster = state.theme === "poster";
  const itemW = isPoster ? dotR * 2 : clamp(availW * 0.25, 60, 126);
  const itemH = isPoster ? dotR * 2 : clamp(boxH - innerPadY * 2, 28, 54);

  // 目标组内水平中心距 intraDist = intraRatio * interDist，并夹在画布允许范围内
  const minIntra = Math.max(itemW + 8, interDist * 0.62);
  const maxIntra = Math.max(minIntra + 12, (availW - itemW - (compact ? 14 : 24)) / 2);
  const desiredIntra = clamp(state.intraRatio, 0.65, 2.4) * interDist;
  const intraDist = clamp(desiredIntra, minIntra, maxIntra);
  const actualRatio = +(intraDist / interDist).toFixed(2);

  // 三条底框外宽：包住左右两列 + 水平内距
  const padX = clamp(Math.max(12, state.boxPad * 1.15), 8, 30);
  const boxW = Math.min(availW, intraDist * 2 + itemW + padX * 2);
  const boxX = padLeft + (availW - boxW) * 0.5;
  const stackH = boxH * 3 + gapPx * 2;
  const stackY = padTop + (availH - stackH) * 0.5;
  const boxRadius = clamp(boxH * 0.25, 12, 26);

  const regions = [0, 1, 2].map((rIdx) => {
    const y = stackY + rIdx * (boxH + gapPx);
    return {
      index: rIdx,
      x: boxX,
      y,
      w: boxW,
      h: boxH,
      r: boxRadius,
      cy: y + boxH * 0.5,
      palette: PALETTE.regions[rIdx],
    };
  });

  const cxMid = boxX + boxW * 0.5;
  const themeData = THEMES[state.theme] || THEMES.poster;

  const items = [];
  for (let rIdx = 0; rIdx < 3; rIdx++) {
    for (let cIdx = 0; cIdx < 3; cIdx++) {
      const idx = rIdx * 3 + cIdx;
      const baseX = cxMid + (cIdx - 1) * intraDist;
      const baseY = regions[rIdx].cy;
      const off = state.offsets[idx] || { dx: 0, dy: 0 };
      const x = clamp(baseX + off.dx * intraDist, padLeft + itemW * 0.5, W - padRight + 10);
      const y = clamp(baseY + off.dy * interDist, padTop * 0.6 + itemH * 0.5, H - 14 - itemH * 0.5);

      // 精确检测该元素相对于 3 条底框的归属拓扑
      let status = "outside"; // inside | straddle | wrong | outside
      let hostRegion = -1;
      const halfH = itemH * 0.5;
      const halfW = itemW * 0.5;
      for (const reg of regions) {
        const insideX = x - halfW >= reg.x + 2 && x + halfW <= reg.x + reg.w - 2;
        const insideY = y - halfH >= reg.y + 1 && y + halfH <= reg.y + reg.h - 1;
        const overlapsX = x + halfW > reg.x && x - halfW < reg.x + reg.w;
        const overlapsY = y + halfH > reg.y && y - halfH < reg.y + reg.h;
        if (insideX && insideY) {
          hostRegion = reg.index;
          status = reg.index === rIdx ? "inside" : "wrong";
          break;
        } else if (overlapsX && overlapsY) {
          hostRegion = reg.index;
          status = "straddle";
        }
      }

      // 颜色取决于 colorMode
      let color = PALETTE.dotMono;
      if (state.colorMode === "poster") color = PALETTE.dots[rIdx];
      else if (state.colorMode === "conflict") color = PALETTE.dots[cIdx];

      items.push({
        index: idx,
        row: rIdx,
        col: cIdx,
        baseX,
        baseY,
        x,
        y,
        r: dotR,
        w: itemW,
        h: itemH,
        color,
        status,
        hostRegion,
        meta: themeData.items[idx],
      });
    }
  }

  // 统计每条底框真实包进来的元素数
  const countsByRegion = [0, 0, 0];
  for (const it of items) {
    if ((it.status === "inside" || it.status === "wrong") && it.hostRegion >= 0) {
      countsByRegion[it.hostRegion]++;
    }
  }

  // 实测内壁最小净空（仅针对正常归位元素）
  const innerClearancePx = Math.round((boxH - itemH) * 0.5);

  return {
    W,
    H,
    compact,
    boxX,
    boxW,
    boxH,
    boxGapPx: Math.round(gapPx),
    innerClearancePx,
    intraDistPx: Math.round(intraDist),
    interDistPx: Math.round(interDist),
    actualRatio,
    dotR,
    itemW,
    itemH,
    regions,
    items,
    countsByRegion,
    lumaDiffPct: regionLumaDiffPct(state.regionMode),
  };
}

// 单真源诊断：算出 4 项检核、精确错态、感知分组结论与原海报三条折箭活体文案
export function diagnose(state, geom) {
  const mode = state.regionMode;
  const hasVisibleRegion = mode === "pastel" || mode === "dashed" || mode === "solid";
  const isCage = mode === "cage";
  const isGhost = mode === "ghost";
  const isNone = mode === "none";

  const straddlers = geom.items.filter((it) => it.status === "straddle");
  const wrongers = geom.items.filter((it) => it.status === "wrong");
  const outsiders = geom.items.filter((it) => it.status === "outside");
  const misplaced = [...wrongers, ...straddlers, ...outsiders];

  const mergedGap = hasVisibleRegion && geom.boxGapPx <= 4;
  const crampedPad = (hasVisibleRegion || isGhost) && geom.innerClearancePx < 7;

  // 感知主导分组判定（基于几何距离比 + 区域边界 + 颜色相似性）
  let perceived = "3 横组（共同区域主导）";
  let perceivedShort = "3 横组";
  let perceivedType = "rows"; // rows | cols | scattered | single_cage

  if (isCage) {
    perceived = "9 个孤立格（过度加框）";
    perceivedShort = "9 孤格";
    perceivedType = "single_cage";
  } else if (!hasVisibleRegion || mergedGap) {
    if (geom.actualRatio >= 1.12) {
      if (state.colorMode === "poster" && !mergedGap) {
        perceived = "横纵打架（仅靠颜色勉强拉成横排）";
        perceivedShort = "色距冲突";
        perceivedType = "conflict";
      } else {
        perceived = "3 竖列（邻近性反客为主）";
        perceivedShort = "3 竖列";
        perceivedType = "cols";
      }
    } else if (state.colorMode === "conflict") {
      perceived = "3 竖列（同列撞色接管）";
      perceivedShort = "3 竖列";
      perceivedType = "cols";
    } else {
      perceived = "松散点阵（缺少清晰边界）";
      perceivedShort = "松散阵";
      perceivedType = "scattered";
    }
  } else if (wrongers.length > 0) {
    perceived = `错归分组（${geom.countsByRegion.join(" / ")} 失衡）`;
    perceivedShort = "虚假分组";
    perceivedType = "wrong";
  } else if (straddlers.length > 0 || outsiders.length > 0) {
    perceived = `3 横组 + ${straddlers.length + outsiders.length} 枚归属悬空`;
    perceivedShort = "归属悬空";
    perceivedType = "straddle";
  }

  // 四项检核（对应原海报底栏四格：边界 / 区域 / 归属 / 分组）
  const checks = {
    boundary: {
      ok: hasVisibleRegion,
      tag: isCage ? "过度加框" : isGhost ? `弱差 ${geom.lumaDiffPct}%` : isNone ? "无边界" : mode === "pastel" ? `底差 ${geom.lumaDiffPct}%` : mode === "dashed" ? "虚线清晰" : "细框清晰",
    },
    region: {
      ok: hasVisibleRegion && !mergedGap && !crampedPad,
      tag: !hasVisibleRegion ? "未建区域" : mergedGap ? `缝仅 ${geom.boxGapPx}px` : crampedPad ? `净空 ${geom.innerClearancePx}px` : `缝 ${geom.boxGapPx}px`,
    },
    belonging: {
      ok: hasVisibleRegion && misplaced.length === 0,
      tag: !hasVisibleRegion ? "0/9 归区" : wrongers.length ? `${wrongers.length} 枚串门` : straddlers.length ? `${straddlers.length} 枚骑墙` : outsiders.length ? `${outsiders.length} 枚落单` : "9/9 归位",
    },
    grouping: {
      ok: hasVisibleRegion && !mergedGap && !crampedPad && misplaced.length === 0 && perceivedType === "rows",
      tag: perceivedShort,
    },
  };

  const passCount = Object.values(checks).filter((c) => c.ok).length;

  // 8 类错态与多组合法解精确诊断
  let code = "ok";
  let badge = "";
  let headline = "";
  let body = "";
  let hint = "";

  if (isCage) {
    code = "cage";
    badge = `错态 · 逐点牢笼 (${passCount}/4)`;
    headline = "给 9 个元素各套一层黑框，反而把 3 组切碎成了 9 格";
    body = `画布上突然多出 36 条非数据黑边线（Tufte 批评的「格子牢笼」）。每个元素都被锁进独立小方盒后，横向 3 项之间的共同区域反而消失，视觉重量全被黑框抢走。`;
    hint = "把边界切回「粉彩底框」或「深蓝虚线」，只包住需要成组的 3 个整体，绝不逐项加框。";
  } else if (isGhost) {
    code = "ghost";
    badge = `错态 · 幽灵弱底 (${passCount}/4)`;
    headline = `底框与纸面亮度差仅 ${geom.lumaDiffPct}%，邻近性抢走了分组`;
    body = `当前组内水平距 ${geom.intraDistPx}px，是跨区垂直距 ${geom.interDistPx}px 的 ${geom.actualRatio} 倍。三道浅底框几乎融进暖象牙纸里，眼睛抓不住边界，立刻按更近的竖向距离看成「${perceivedShort}」${straddlers.length ? `，且还有 ${straddlers.length} 枚元素压在边界线上` : ""}。`;
    hint = "先把下方边界切到「粉彩底框」（或「深蓝虚线」），再把压线骑墙的圆点拖回中间底框内。";
  } else if (isNone && state.colorMode === "poster" && geom.actualRatio >= 1.12) {
    code = "color_crutch";
    badge = `错态 · 颜色帮腔 (${passCount}/4)`;
    headline = "撤掉底框后看似还在横排，其实是颜色在偷偷救场";
    body = `此刻没有任何共同区域，组内距（${geom.intraDistPx}px）仍是跨区距（${geom.interDistPx}px）的 ${geom.actualRatio} 倍。之所以还没完全竖劈成三列，是因为 115 相似性（橘/绿/蓝同行同色）在硬撑；一旦切到「纯单色盲测」，横排会当场散架。`;
    hint = "点一下「纯单色盲测」验证原海报的隐藏帮手，再打开「粉彩底框」或「细实线」立起真正的共同区域。";
  } else if (isNone) {
    code = "none";
    badge = `错态 · 无界散群 (${passCount}/4)`;
    headline = `没有共同区域托底，${geom.actualRatio}× 距差把画面竖劈成 3 列`;
    body = `组内水平距 ${geom.intraDistPx}px 明显大于跨区垂直距 ${geom.interDistPx}px。少了可感知的容器边界，人眼立刻遵从 116 邻近性原则，把上下挨得更近的元素自动粘成了三道竖列。`;
    hint = "给三行开启「粉彩底框」「深蓝虚线」或「克制细框」，亲眼看边界如何瞬间压过距离。";
  } else if (mergedGap) {
    code = "merge";
    badge = `错态 · 框间粘连 (${passCount}/4)`;
    headline = `三条底框之间只剩 ${geom.boxGapPx}px 缝隙，彼此粘连成一整块`;
    body = `共同区域要靠「外沿留缝」来界定彼此外界。现在上下底框紧紧贴在一起，跨区边界失去呼吸，相邻两组的圆点重新在交界处发生视觉串门。`;
    hint = "把下方「框间缝隙」拉大到 8px 以上，让三条区域清清爽爽彼此独立。";
  } else if (wrongers.length > 0) {
    const w = wrongers[0];
    code = "wrong";
    badge = `错态 · 串门错归 (${passCount}/4)`;
    headline = `「${w.meta.title}」掉进了${PALETTE.regions[w.hostRegion].name}，制造了虚假分组`;
    body = `共同区域的捆绑力太强——只要把原本属于${THEMES[state.theme].rowNames[w.row]}的元素塞进另一条底框，读者会毫不犹豫地相信它们是一家人（当前各区元素数变成 ${geom.countsByRegion.join(" : ")}）。`;
    hint = `直接在画布上把红环标出的「${w.meta.title}」拖回第 ${w.row + 1} 条底框，或点画布红标一键归位。`;
  } else if (straddlers.length > 0 || outsiders.length > 0) {
    const s = straddlers[0] || outsiders[0];
    code = "straddle";
    badge = `错态 · 骑墙越界 (${passCount}/4)`;
    headline = `「${s.meta.title}」压在底框边线上，归属悬在半空`;
    body = `元素半进半出跨在容器轮廓上时，视觉系统无法判定它属于框内还是框外，整个分组的干脆感立刻打折（当前仅 ${9 - misplaced.length}/9 枚完整归区）。`;
    hint = `拖动画布上带红圈的「${s.meta.title}」放回第 ${s.row + 1} 条底框中央，或点击画布上的红标归位。`;
  } else if (crampedPad) {
    code = "cramped";
    badge = `错态 · 框边勒紧 (${passCount}/4)`;
    headline = `底框内壁只留了 ${geom.innerClearancePx}px 净空，边墙快勒住元素了`;
    body = `容器内边距比框外缝隙窄得多时，元素与边框发生轮廓粘连，产生局促感；好的共同区域应该像温柔的包裹，而不是紧绷的箍圈。`;
    hint = "把「框内净空」往右推到 9px 以上，让元素在底框里舒展呼吸。";
  } else {
    // 全部 4/4 通过！按不同合法解风格输出差异化洞察
    code = "ok";
    if (state.colorMode === "conflict" && geom.actualRatio >= 1.35) {
      badge = "达标 · 逆风双抗解 (4/4)";
      headline = `同时赢过 ${geom.actualRatio}× 远距与按列撞色，共同区域完胜`;
      body = `现在既有按列同色拆台（相似性拉向竖列），又有组内距 ${geom.intraDistPx}px 远超跨区距 ${geom.interDistPx}px（邻近性拉向竖列），但清晰的共同区域依然让眼睛一眼认出 3 条横组——这正是 Palmer（1992）原则最强的地方。`;
      hint = "试着把边界切回「无底框」看画面如何瞬间坍塌成 3 竖列，或切到「套餐对比卡 / 寄件表单」感受真实界面。";
    } else if (mode === "dashed" || mode === "solid") {
      badge = `达标 · ${mode === "dashed" ? "轻盈虚线解" : "克制细框解"} (4/4)`;
      headline = `零填色只靠${mode === "dashed" ? "深蓝虚线" : " 1.5px 细实线"}，同样锁住 3 条横组`;
      body = `即使不铺底色，一条克制的闭合边界也足以克服 ${geom.actualRatio}× 的距差（组内 ${geom.intraDistPx}px vs 跨区 ${geom.interDistPx}px），非常适配黑白打印稿或白底套白底的卡片布局。`;
      hint = "可以左右横拖画布把组内距继续拉宽，验证边界的极限拉力。";
    } else if (geom.actualRatio < 1.15) {
      badge = "达标 · 区域＋邻近协同解 (4/4)";
      headline = "共同区域与紧凑组内距同向合力，识别零犹豫";
      body = `组内距（${geom.intraDistPx}px）与跨区距（${geom.interDistPx}px）比例为 ${geom.actualRatio}×，再配上明度差 ${geom.lumaDiffPct}% 的柔和底色，两条格式塔线索朝同一方向发力，阅读负担最轻。`;
      hint = "把画布往右横拖拉大组内距到 1.8× 以上，体验共同区域独自抗衡远距的能力。";
    } else {
      badge = "达标 · 原海报粉彩解 (4/4)";
      headline = `组内远于跨区 ${geom.actualRatio}×，粉彩底框仍把它们稳锁成 3 组`;
      body = `组内水平距 ${geom.intraDistPx}px、跨区垂直距 ${geom.interDistPx}px，靠暖米砂、柔樱粉、浅藕灰三道柔和底色（平均明度差 ${geom.lumaDiffPct}%）零边框噪音建起共同区域，完全复现 120 原海报的分组魔力。`;
      hint = "试试点「纯单色盲测」或「按列撞色」，撤掉颜色帮手看看底框有多硬核。";
    }
  }

  // 原海报右侧三条虚线折箭的活体标注（与画布几何 100% 同源）
  const callouts = [
    {
      row: 0,
      ok: checks.boundary.ok && geom.items.slice(0, 3).every((it) => it.status === "inside"),
      zh: !hasVisibleRegion
        ? isCage ? "9 个独立黑框把第一排拆成了 3 个孤岛。" : "没有清晰底框，第一排 3 点无法自动成组。"
        : geom.countsByRegion[0] === 3
          ? "同一底框中的 3 枚元素被自动看作一组。"
          : `第一条底框里现包着 ${geom.countsByRegion[0]} 枚元素，归属已偏移。`,
      en: "DOTS WITHIN THE SAME BACKGROUND REGION ARE PERCEIVED AS A GROUP.",
    },
    {
      row: 1,
      ok: checks.grouping.ok && geom.actualRatio >= 1.15,
      zh: geom.actualRatio >= 1.15
        ? (checks.grouping.ok
            ? `组内 ${geom.intraDistPx}px 是跨区 ${geom.interDistPx}px 的 ${geom.actualRatio}×，仍按共同区域分组。`
            : `组内 ${geom.intraDistPx}px 远超跨区 ${geom.interDistPx}px（${geom.actualRatio}×），此刻正被竖向邻近性拉偏。`)
        : `当前组内 ${geom.intraDistPx}px 与跨区 ${geom.interDistPx}px 接近（${geom.actualRatio}×），右拖画布可测试远距。`,
      en: "EVEN IF THE DISTANCE WITHIN A REGION IS GREATER, ELEMENTS ARE STILL GROUPED BY THE COMMON REGION.",
    },
    {
      row: 2,
      ok: hasVisibleRegion && !mergedGap && wrongers.length === 0,
      zh: !hasVisibleRegion
        ? `上下仅隔 ${geom.interDistPx}px 且无底框阻断，跨行元素已被看成同一竖列。`
        : mergedGap
          ? `两道底框缝仅 ${geom.boxGapPx}px，跨区阻断失效，上下开始串门。`
          : wrongers.length > 0
            ? "有元素跨入相邻底框，引发了错误的逻辑归属。"
            : `不同底框间隔 ${geom.boxGapPx}px 缝隙，上下虽更近（${geom.interDistPx}px）仍不归为一组。`,
      en: "DOTS IN DIFFERENT REGIONS ARE NOT GROUPED TOGETHER, EVEN IF THEY ARE CLOSER TO EACH OTHER.",
    },
  ];

  return {
    code,
    passCount,
    isOk: passCount === 4,
    checks,
    perceived,
    perceivedShort,
    perceivedType,
    badge,
    headline,
    body,
    hint,
    callouts,
    straddlers,
    wrongers,
    outsiders,
    misplaced,
  };
}

// 05 节「剥洋葱削框」真实 390px 手机卡片单真源核算
export function computeNestingDemo(level) {
  // level: 4(4层牢笼) | 3(3层) | 2(2层) | 1(1层浅底框·推荐) | 0(纯留白)
  const phoneW = 390;
  const pageGutter = 16; // 页面左右安全边
  const levels = {
    4: {
      layers: 4,
      padPerLayer: 14,
      borderPerLayer: 2,
      extraInnerBorders: 4, // 内部两条分割框
      tag: "4 层框套框（重度牢笼）",
      verdict: "四层嵌套连同页边距啃掉了 41% 的手机横向空间（仅四层框壁就独吞 128px），正文每行只剩 230px、断行稀碎，眼睛先看到的是一堆方框而不是内容。",
      badgeType: "err",
    },
    3: {
      layers: 3,
      padPerLayer: 14,
      borderPerLayer: 1.5,
      extraInnerBorders: 2,
      tag: "3 层嵌套（冗余偏重）",
      verdict: "剥掉最外层大框后宽敞了些，但三层边墙依然在抢戏，手机端卡片里套卡片会迅速耗尽行宽。",
      badgeType: "warn",
    },
    2: {
      layers: 2,
      padPerLayer: 12,
      borderPerLayer: 1,
      extraInnerBorders: 0,
      tag: "2 层嵌套（可用上限）",
      verdict: "NN/g 建议的嵌套上限：外层轻底区分大区、内层承载子模块。但若内容简单，还能继续减一层。",
      badgeType: "mid",
    },
    1: {
      layers: 1,
      padPerLayer: 16,
      borderPerLayer: 0,
      extraInnerBorders: 0,
      tag: "1 层柔和底色（清爽推荐）",
      verdict: "零多余硬黑线、只用一层柔和粉彩底色建立共同区域！正文可用宽度达到 326px，分组一眼明了且毫无牢笼感。",
      badgeType: "ok",
    },
    0: {
      layers: 0,
      padPerLayer: 0,
      borderPerLayer: 0,
      extraInnerBorders: 0,
      tag: "0 层纯留白（极简阅读）",
      verdict: "358px 最大净宽，适合长文或元素结构高度规整的列表；如果单条内部包含多种杂乱控件，再加回 1 层浅底即可。",
      badgeType: "ok",
    },
  };
  const cfg = levels[level] || levels[4];
  const consumedX = pageGutter * 2 + cfg.layers * (cfg.padPerLayer + cfg.borderPerLayer) * 2;
  const contentW = Math.round(phoneW - consumedX);
  const ratioPct = Math.round((contentW / phoneW) * 100);
  const borderLines = cfg.layers * (cfg.borderPerLayer > 0 ? 4 : 0) + cfg.extraInnerBorders;
  return { phoneW, contentW, ratioPct, borderLines, ...cfg };
}
