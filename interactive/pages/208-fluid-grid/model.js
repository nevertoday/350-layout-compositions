// 208 流体网格 · 单真源几何与流体力学核算模块
// 开场 2D 弹性水槽、底部活体 CSS 代码舱、四枚原理徽、白话诊单全部从本模块同源计算。

export const VIEW_MIN = 320;
export const VIEW_MAX = 1600;
export const FIXED_TOTAL = 1280;
export const CLAMP_MAX = 1440;

// 逐像素实采自 208 原海报的六档紫粉比例带色阶
export const COL_PALETTE_6 = [
  "#302276", // 10% 深靛紫
  "#3C2B87", // 10% 蓝靛紫
  "#4B36A2", // 20% 皇室紫
  "#E8689E", // 30% 标志珊瑚粉（视觉焦点列）
  "#5943AF", // 20% 亮紫罗兰
  "#34266D", // 10% 深暮紫
];

export const COL_PALETTE_4 = [
  "#352680",
  "#4B36A2",
  "#E8689E",
  "#5943AF",
];

export const COL_PALETTE_TABLET5 = [
  "#352680",
  "#433096",
  "#E8689E",
  "#F078AB",
  "#5943AF",
];

export const COL_PALETTE_STACK = [
  "#E970A0",
  "#6048AE",
  "#3D2C86",
];

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报比例",
    shortLabel: "原海报",
    colNames6: ["导引", "边栏", "次栏", "主焦点", "辅栏", "留白"],
    colNames4: ["目录", "次栏", "主内容", "侧注"],
    stackNames: ["主视觉与标题模块", "核心正文流动区", "辅助信息与索引"],
  },
  editorial: {
    id: "editorial",
    label: "编辑图文",
    shortLabel: "编辑",
    colNames6: ["眉注", "索引", "配图", "正文主栏", "引语", "批注"],
    colNames4: ["章节", "图版", "长文主栏", "边注"],
    stackNames: ["头条封面与导语", "沉浸正文与图注", "延伸注脚与相关阅读"],
  },
  dashboard: {
    id: "dashboard",
    label: "数据看板",
    shortLabel: "看板",
    colNames6: ["导航", "筛选", "指标卡", "趋势主图", "排行", "快讯"],
    colNames4: ["菜单", "核心指标", "实时趋势主图", "明细"],
    stackNames: ["核心营收趋势主图", "关键指标概览组", "实时明细列表"],
  },
};

export const INITIAL_STATE = {
  width: 960,
  unit: "px",
  weights: [4, 6, 12, 62, 10, 6],
  gap: 16,
  reflow: false,
  clampGuard: false,
  scene: "poster",
};

export const PRESETS = {
  broken: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_STATE, weights: [...INITIAL_STATE.weights] },
  },
  poster: {
    label: "原海报无缝解",
    kind: "valid",
    patch: {
      unit: "pct",
      weights: [10, 10, 20, 30, 20, 10],
      gap: 0,
      reflow: true,
      clampGuard: true,
    },
  },
  modernFr: {
    label: "现代 fr 带缝解",
    kind: "valid",
    patch: {
      unit: "fr",
      weights: [10, 10, 20, 30, 20, 10],
      gap: 16,
      reflow: true,
      clampGuard: true,
    },
  },
  asym4: {
    label: "四列不对称解",
    kind: "valid",
    patch: {
      unit: "fr",
      weights: [15, 25, 35, 25],
      gap: 16,
      reflow: true,
      clampGuard: true,
    },
  },
  even4: {
    label: "四列均衡解",
    kind: "valid",
    patch: {
      unit: "fr",
      weights: [25, 25, 25, 25],
      gap: 16,
      reflow: true,
      clampGuard: true,
    },
  },
  errPctGap: {
    label: "试错：% 加缝爆框",
    kind: "trap",
    patch: {
      width: 1320,
      unit: "pct",
      weights: [10, 10, 20, 30, 20, 10],
      gap: 28,
      reflow: true,
      clampGuard: false,
    },
  },
  errUltrawide: {
    label: "试错：超宽拉爆",
    kind: "trap",
    patch: {
      width: 1560,
      unit: "fr",
      weights: [8, 8, 12, 54, 10, 8],
      gap: 16,
      reflow: true,
      clampGuard: false,
    },
  },
};

export function clampWidth(w) {
  return Math.max(VIEW_MIN, Math.min(VIEW_MAX, Math.round(w)));
}

export function gcd(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function formatFraction(pct) {
  const n = Math.round(pct);
  if (n <= 0) return "0";
  if (n >= 100) return "1/1";
  const g = gcd(n, 100);
  return `${n / g}/${100 / g}`;
}

export function deviceTier(width) {
  if (width >= 1280) return { id: "desktop", zh: "宽屏桌面", en: "DESKTOP", range: "≥ 1280px" };
  if (width >= 768) return { id: "tablet", zh: "平板横屏", en: "TABLET", range: "768px–1279px" };
  return { id: "mobile", zh: "手机竖屏", en: "MOBILE", range: "< 768px" };
}

function isPosterWeights(weights) {
  return (
    weights.length === 6 &&
    weights[0] === 10 &&
    weights[1] === 10 &&
    weights[2] === 20 &&
    weights[3] === 30 &&
    weights[4] === 20 &&
    weights[5] === 10
  );
}

// 拖拽相邻列缝时，保证总和始终为 100% 且单列落在 3%..76%（允许玩家故意拉出针眼错态或过宽错态）
export function adjustSeam(weights, seamIndex, deltaPct) {
  if (seamIndex < 0 || seamIndex >= weights.length - 1) return weights;
  const next = [...weights];
  const pair = next[seamIndex] + next[seamIndex + 1];
  const minW = 3;
  const maxLeft = Math.min(76, pair - minW);
  const left = Math.max(minW, Math.min(maxLeft, Math.round(next[seamIndex] + deltaPct)));
  const right = pair - left;
  next[seamIndex] = left;
  next[seamIndex + 1] = right;
  return next;
}

export function solveTracks(viewWidth, state) {
  const tier = deviceTier(viewWidth);
  const baseWeights = state.weights;
  const gap = state.gap;
  const unit = state.unit;
  const sceneMeta = SCENES[state.scene] || SCENES.poster;

  // 护栏生效时：非固定 px 模式下限制最大容器宽为 1440px（居中留白，不拉爆行长）
  const clamped = state.clampGuard && unit !== "px" && viewWidth > CLAMP_MAX;
  const boxW = clamped ? CLAMP_MAX : viewWidth;
  const safeMarginX = clamped ? (viewWidth - boxW) / 2 : 0;

  // 情况 1：手机自动重排（<768px 堆叠成 100% 满宽三段，1:1 呼应原海报）
  if (state.reflow && viewWidth < 768 && unit !== "px") {
    const rows = sceneMeta.stackNames.map((name, idx) => ({
      index: idx,
      weight: 100,
      fraction: "1/1",
      px: boxW,
      color: COL_PALETTE_STACK[idx],
      name,
      isFocal: idx === 0,
    }));
    const focalPx = boxW;
    return {
      viewWidth,
      boxW,
      safeMarginX,
      clamped,
      tier,
      stacked: true,
      reflowedTablet: false,
      cols: rows,
      gap,
      usedW: boxW,
      overflowPx: 0,
      voidPx: 0,
      minColPx: boxW,
      maxColPx: boxW,
      focalColPx: focalPx,
      minWeight: 100,
      maxWeight: 100,
      focalWeight: 100,
      focalIndex: 0,
      focalChZh: Math.round(focalPx / 16.5),
      focalChEn: Math.round(focalPx / 8.8),
    };
  }

  // 情况 2：平板自动重排（768–1279px 且开启重排的 6 列布局自动并入 5 列，呼应原海报 15/15/25/25/20）
  let activeWeights = baseWeights;
  let reflowedTablet = false;
  if (state.reflow && viewWidth >= 768 && viewWidth < 1280 && unit !== "px" && baseWeights.length === 6) {
    reflowedTablet = true;
    if (isPosterWeights(baseWeights)) {
      activeWeights = [15, 15, 25, 25, 20];
    } else {
      // 把最末外侧一列按比例并回前 5 列，保持总和 100
      const first5 = baseWeights.slice(0, 5);
      const sum5 = first5.reduce((a, b) => a + b, 0) || 100;
      const merged = first5.map((w) => Math.max(4, Math.round((w / sum5) * 100)));
      const diff = 100 - merged.reduce((a, b) => a + b, 0);
      const maxIdx = merged.indexOf(Math.max(...merged));
      merged[maxIdx] += diff;
      activeWeights = merged;
    }
  }

  const n = activeWeights.length;
  const totalGaps = Math.max(0, n - 1) * gap;
  const sumW = activeWeights.reduce((a, b) => a + b, 0) || 100;
  let focalIndex = 0;
  let maxWeight = -1;
  activeWeights.forEach((w, i) => {
    if (w > maxWeight) {
      maxWeight = w;
      focalIndex = i;
    }
  });
  // 原海报四列均衡时，默认标第 2 列（index 1）或全柔和无强焦点；原海报 6 列 index 3 为 30% 珊瑚粉
  const isUniform = activeWeights.every((w) => w === activeWeights[0]);
  if (isUniform) focalIndex = n >= 4 ? 1 : 0;

  let colWidths = [];
  let usedW = 0;
  let overflowPx = 0;
  let voidPx = 0;

  if (unit === "px") {
    // 刚性固定像素：总宽锁死 1280px
    const avail = FIXED_TOTAL - totalGaps;
    colWidths = activeWeights.map((w) => (avail * w) / sumW);
    usedW = colWidths.reduce((a, b) => a + b, 0) + totalGaps;
    overflowPx = Math.max(0, Math.round(usedW - viewWidth));
    voidPx = Math.max(0, Math.round(viewWidth - usedW));
  } else if (unit === "pct") {
    // 纯百分比：严格按真实 CSS Grid 规范——% 按容器宽 100% 算，再额外加上 gap！
    colWidths = activeWeights.map((w) => (boxW * w) / sumW);
    usedW = colWidths.reduce((a, b) => a + b, 0) + totalGaps;
    overflowPx = Math.max(0, Math.round(usedW - boxW));
    voidPx = 0;
  } else {
    // fr 弹性份数：先减去 gap，再按份数均分剩余空间；开护栏时模拟 minmax(floor, Xfr)
    const avail = Math.max(0, boxW - totalGaps);
    colWidths = activeWeights.map((w) => (avail * w) / sumW);
    if (state.clampGuard) {
      const floorPx = viewWidth >= 1000 ? 78 : 60;
      let deficit = 0;
      const lifted = colWidths.map((cw) => {
        if (cw < floorPx) {
          deficit += floorPx - cw;
          return floorPx;
        }
        return cw;
      });
      if (deficit > 0) {
        const slack = lifted.reduce((acc, cw) => acc + Math.max(0, cw - floorPx), 0);
        if (slack >= deficit) {
          colWidths = lifted.map((cw) => {
            const extra = Math.max(0, cw - floorPx);
            return extra > 0 ? cw - (deficit * extra) / slack : cw;
          });
        } else {
          // 连全部设成 floor 都塞不下，真实溢出（与真实 CSS minmax 行为一致）
          colWidths = lifted;
        }
      }
    }
    usedW = colWidths.reduce((a, b) => a + b, 0) + totalGaps;
    overflowPx = Math.max(0, Math.round(usedW - boxW));
    voidPx = 0;
  }

  // 配色与列名映射
  const palette = reflowedTablet
    ? COL_PALETTE_TABLET5
    : n === 4
      ? COL_PALETTE_4
      : COL_PALETTE_6;
  const names = n === 4 ? sceneMeta.colNames4 : sceneMeta.colNames6;

  let cursorX = safeMarginX;
  const cols = activeWeights.map((weight, i) => {
    const px = colWidths[i];
    const x = cursorX;
    cursorX += px + gap;
    let color = palette[i % palette.length];
    if (isUniform) {
      color = ["#3A2A88", "#4D3AA8", "#614BC2", "#47359B"][i % 4];
    } else if (!reflowedTablet && i === focalIndex) {
      color = "#E8689E";
    } else if (!reflowedTablet && color === "#E8689E" && i !== focalIndex) {
      color = "#4B36A2";
    }
    return {
      index: i,
      x,
      px,
      weight,
      fraction: formatFraction(weight),
      color,
      name: names[i % names.length],
      isFocal: !isUniform && i === focalIndex,
      isNeedle: px < (viewWidth >= 1000 ? 64 : 46) || weight < 8,
    };
  });

  const minColPx = Math.min(...cols.map((c) => c.px));
  const maxColPx = Math.max(...cols.map((c) => c.px));
  const minWeight = Math.min(...activeWeights);
  const focalColPx = cols[focalIndex].px;

  return {
    viewWidth,
    boxW,
    safeMarginX,
    clamped,
    tier,
    stacked: false,
    reflowedTablet,
    cols,
    gap,
    usedW,
    overflowPx,
    voidPx,
    minColPx,
    maxColPx,
    focalColPx,
    minWeight,
    maxWeight,
    focalWeight: activeWeights[focalIndex],
    focalIndex,
    focalChZh: Math.round(focalColPx / 16.5),
    focalChEn: Math.round(focalColPx / 8.8),
  };
}

export function evaluate(state) {
  const live = solveTracks(state.width, state);
  const desktop = solveTracks(1440, state);
  const tablet = solveTracks(960, state);
  const mobile = solveTracks(390, state);

  const issues = [];

  // 1. 固定像素写死导致溢出或闲置
  if (state.unit === "px") {
    if (live.overflowPx > 0) {
      issues.push({
        id: "fixed-overflow",
        badge: `溢出 +${live.overflowPx}px`,
        title: `固定写死 1280px，当前 ${state.width}px 视口向右破框 +${live.overflowPx}px`,
        why: `像素锁死后，列宽不会随屏幕变窄而收缩。超出容器壁的 ${live.overflowPx}px 会强行撑出横向滚动条，读者只能左右拖着看页面。`,
        action: "把下方单位从「固定 px」切到「弹性 fr」或「百分比 %」，立刻把写死列宽改成按比例分配。",
        fixLabel: "改用弹性 fr 单位",
        fixAction: "fix-unit-fr",
      });
    } else if (live.voidPx > 80) {
      issues.push({
        id: "fixed-void",
        badge: `死白 ${live.voidPx}px`,
        title: `固定写死 1280px，宽屏右侧白白浪费 ${live.voidPx}px`,
        why: `把视口拉到 ${state.width}px 后，刚性网格停在 1280px 原地不动，右侧露出 ${live.voidPx}px 闲置死白，既没有按比例延展，也没有居中护栏秩序。`,
        action: "切换到「弹性 fr」并开启「行宽护栏」，让列宽随空间流淌的同时守住 1440px 舒适上限。",
        fixLabel: "改用弹性 fr 单位",
        fixAction: "fix-unit-fr",
      });
    } else {
      issues.push({
        id: "fixed-rigid",
        badge: "固定锁死",
        title: "当前虽恰逢 1280px，但网格仍是刚性像素锁死",
        why: "只在 1280px 这一格恰好贴边，一旦换成 960px 平板或 390px 手机就会立即溢出破框——流体网格的核心是用相对单位而非赌中某一个屏幕宽度。",
        action: "切到「弹性 fr」或「百分比 %」，再把容器往左拉到 760px 试一试。",
        fixLabel: "改用弹性 fr 单位",
        fixAction: "fix-unit-fr",
      });
    }
  }

  // 2. 经典 CSS 暗礁：100% 百分比 + 固定 gap 溢出
  if (state.unit === "pct" && live.overflowPx > 0) {
    const gapCount = Math.max(0, live.cols.length - 1);
    issues.push({
      id: "pct-gap-overflow",
      badge: `缝溢 +${live.overflowPx}px`,
      title: `100% 百分比叠加 ${gapCount} 条 ${state.gap}px 栏距，实测爆框 +${live.overflowPx}px`,
      why: `这是写流体网格最常踩的暗礁：CSS 的 % 是按容器满宽 100% 算的，加上 ${gapCount} × ${state.gap}px 栏距后总宽必然超过 100%。原海报之所以敢写 10% 10% 20% 30% 20% 10%，前提是零间隙。`,
      action: "两种合法解法：把单位换为「弹性 fr」（先扣栏距再分余量），或把栏距归回「0px（无缝）」。",
      fixLabel: "切换 fr 吸收栏距",
      fixAction: "fix-unit-fr",
    });
  }

  // 3. 窄列压成针眼（权重 < 8% 或实绘宽跌破安全下限）
  const needleThresh = state.width >= 1000 ? 64 : 46;
  const desktopNeedle = !desktop.stacked && (desktop.minWeight < 8 || desktop.minColPx < 72);
  const liveNeedle = !live.stacked && (live.minWeight < 8 || live.minColPx < needleThresh);
  if (liveNeedle || desktopNeedle) {
    const showPx = Math.round(liveNeedle ? live.minColPx : desktop.minColPx);
    const showWt = liveNeedle ? live.minWeight : desktop.minWeight;
    issues.push({
      id: "needle-col",
      badge: `针眼 ${showPx}px`,
      title: `最窄列只剩 ${showWt}%（实宽 ${showPx}px），文字会被挤成针眼竖条`,
      why: `比例悬殊过大（如 ${showWt}% 对 ${live.maxWeight}%）时，外侧列在中等屏幕上只能塞下两三个汉字，按钮与标签被迫折成高塔，秩序感瞬间坍塌。`,
      action: "在画布上拖开过窄列的竖向分界线（让最窄列 ≥ 10%），或套用「原海报比例 10·10·20·30·20·10」。",
      fixLabel: "校准为原海报比例",
      fixAction: "fix-weights-poster",
    });
  }

  // 4. 主栏拉爆行长（权重过大或超宽屏无护栏）
  const overWeight = !live.stacked && live.focalWeight > 52;
  const overWide = !live.stacked && live.focalColPx > 660;
  const unguardedWide = state.width > 1460 && !state.clampGuard && state.unit !== "px";
  if (overWeight || overWide || unguardedWide) {
    issues.push({
      id: "measure-overstretch",
      badge: `过宽 ${Math.round(live.focalColPx)}px`,
      title: overWeight
        ? `主栏独吞 ${live.focalWeight}%（${Math.round(live.focalColPx)}px，约 ${live.focalChZh} 字/行），单行过长失节奏`
        : `超宽屏（${state.width}px）未设容器上限，焦点栏拉到 ${Math.round(live.focalColPx)}px`,
      why: "流体网格不是无限拉伸。屏幕越宽，无约束的百分比会把正文拽成一条漫长的横线，视线扫完一行往回找下一行极易跳行迷路（经验上中文正文约 25–42 字/行更舒适）。",
      action: overWeight
        ? "拖窄主栏分界线（压到 45% 以内）并开启「行宽护栏」。"
        : "点亮「行宽护栏（max-width: 1440px）」，让超宽屏居中留出克制外边距。",
      fixLabel: overWeight ? "平衡比例并开护栏" : "开启行宽护栏",
      fixAction: overWeight ? "fix-balance-clamp" : "fix-clamp",
    });
  }

  // 5. 手机 390px 端挤碎（三端联动检测）
  if (mobile.overflowPx > 0 || mobile.minColPx < 56) {
    issues.push({
      id: "mobile-crush",
      badge: `手机 ${Math.round(mobile.minColPx)}px`,
      title:
        mobile.overflowPx > 0
          ? `手机 390px 屏下溢出 +${mobile.overflowPx}px，无法正常浏览`
          : `手机 390px 屏硬塞 ${mobile.cols.length} 列，最窄列仅 ${Math.round(mobile.minColPx)}px`,
      why: "在 390px 窄屏里继续死守桌面 6 列比例，哪怕是 10% 列宽也只剩 39px——原海报第三排明确给出答案：小屏应重排为 100% 满宽堆叠。",
      action: "开启「小屏重排（<768px 折为 100%）」开关，再点底栏「手机 390」看三层自动叠落。",
      fixLabel: "开启小屏重排",
      fixAction: "fix-reflow",
    });
  }

  // 四枚原海报核心原理实时检定（1:1 对应原海报四枚珊瑚粉圆徽）
  const pRatio = state.unit !== "px" && desktop.minWeight >= 8 && desktop.maxWeight <= 52;
  const pFlow = state.unit !== "px" && live.overflowPx === 0 && desktop.overflowPx === 0 && tablet.overflowPx === 0;
  const pElastic =
    state.unit !== "px" &&
    !liveNeedle &&
    !overWeight &&
    !overWide &&
    !unguardedWide;
  const pResponsive =
    state.unit !== "px" &&
    mobile.overflowPx === 0 &&
    mobile.minColPx >= 120 &&
    tablet.overflowPx === 0 &&
    tablet.minColPx >= 48;

  const passedCount = [pRatio, pFlow, pElastic, pResponsive].filter(Boolean).length;
  const healthy = issues.length === 0 && passedCount === 4;

  // 三端摘要（供画布底部三端同步条直接绘制）
  const tierStatus = (t, isMob = false) => {
    if (state.unit === "px") {
      if (t.overflowPx > 0) return { ok: false, tag: `溢+${t.overflowPx}` };
      if (t.voidPx > 80) return { ok: false, tag: `空${t.voidPx}` };
      return { ok: false, tag: "锁死" };
    }
    if (t.overflowPx > 0) return { ok: false, tag: `溢+${t.overflowPx}` };
    if (isMob && t.minColPx < 56) return { ok: false, tag: `挤${Math.round(t.minColPx)}px` };
    if (!t.stacked && (t.minWeight < 8 || t.minColPx < 46)) return { ok: false, tag: `针${Math.round(t.minColPx)}px` };
    if (!t.stacked && (t.focalWeight > 52 || t.focalColPx > 660)) return { ok: false, tag: "过宽" };
    return { ok: true, tag: t.stacked ? "100%堆叠" : `${t.cols.length}列通畅` };
  };

  let verdictTitle = "";
  let verdictWhy = "";
  let verdictAction = "";
  let fixLabel = "";
  let fixAction = "";

  if (healthy) {
    const modeDesc =
      state.unit === "pct"
        ? "无缝百分比（与 208 原海报一致）"
        : live.cols.length === 4 && live.cols.every((c) => c.weight === live.cols[0].weight)
          ? "四列均衡 fr 流体"
          : live.cols.length === 4
            ? "四列不对称 fr 流体"
            : "六列弹性 fr 带缝流体";
    verdictTitle = `三端通流成立 · ${modeDesc}`;
    verdictWhy = `当前 ${state.width}px（${live.tier.zh}）下零溢出、最窄列 ${Math.round(live.minColPx)}px、主焦点列 ${Math.round(live.focalColPx)}px（约 ${live.focalChZh} 汉字/行）；把右壁一路从 320px 拖到 1600px，桌面、平板与手机都会平滑衔接而不失秩序。`;
    verdictAction = "继续左右扯动视口右壁，或点上方「试错：% 加缝爆框」「试错：超宽拉爆」反向验证流体网格的边界。";
  } else {
    const top = issues[0];
    verdictTitle = top.title;
    verdictWhy = top.why;
    verdictAction = top.action;
    fixLabel = top.fixLabel;
    fixAction = top.fixAction;
  }

  return {
    live,
    tiers: {
      desktop: { data: desktop, status: tierStatus(desktop, false) },
      tablet: { data: tablet, status: tierStatus(tablet, false) },
      mobile: { data: mobile, status: tierStatus(mobile, true) },
    },
    issues,
    healthy,
    passedCount,
    statusLabel: healthy ? "三端通流" : issues[0].badge,
    verdictTitle,
    verdictWhy,
    verdictAction,
    fixLabel,
    fixAction,
    principles: [
      {
        key: "ratio",
        icon: "pct",
        title: "比例宽度",
        en: "PERCENTAGE WIDTH",
        ok: pRatio,
        badge: state.unit === "px" ? "写死 px" : desktop.minWeight < 8 ? `极窄 ${desktop.minWeight}%` : desktop.maxWeight > 52 ? `独大 ${desktop.maxWeight}%` : `${state.unit === "fr" ? "fr 份数" : "% 比例"}`,
      },
      {
        key: "flow",
        icon: "wave",
        title: "连续流动",
        en: "CONTINUITY",
        ok: pFlow,
        badge: live.overflowPx > 0 ? `溢 +${live.overflowPx}px` : state.unit === "px" ? "未流动" : state.gap === 0 ? "无缝连流" : `${state.gap}px 净缝`,
      },
      {
        key: "elastic",
        icon: "elastic",
        title: "弹性伸缩",
        en: "ELASTICITY",
        ok: pElastic,
        badge: liveNeedle ? `针 ${Math.round(live.minColPx)}px` : overWide || overWeight || unguardedWide ? `宽 ${Math.round(live.focalColPx)}px` : state.unit === "px" ? "刚性锁死" : `主列 ${live.focalChZh}字`,
      },
      {
        key: "responsive",
        icon: "expand",
        title: "响应适配",
        en: "RESPONSIVE",
        ok: pResponsive,
        badge: mobile.minColPx < 56 || mobile.overflowPx > 0 ? `机 ${Math.round(mobile.minColPx)}px` : state.reflow ? "三端自排" : "单端未排",
      },
    ],
  };
}

// 生成与原海报底部同款的活体 CSS 代码块（单真源，直接反映当前状态和报错）
export function formatCSSLines(state, evalRes) {
  const live = evalRes.live;
  const ws = state.weights;
  let trackVal = "";
  let comment = "";

  if (state.unit === "px") {
    const avail = FIXED_TOTAL - Math.max(0, ws.length - 1) * state.gap;
    trackVal = ws.map((w) => `${Math.round((avail * w) / 100)}px`).join(" ");
    comment = live.overflowPx > 0 ? `/* 写死 1280px → 溢出 +${live.overflowPx}px */` : "/* 刚性像素，不会随容器伸缩 */";
  } else if (state.unit === "pct") {
    const activeW = live.stacked ? [100] : live.cols.map((c) => c.weight);
    const gapCnt = Math.max(0, activeW.length - 1);
    trackVal = activeW.map((w) => `${w}%`).join(" ");
    if (live.overflowPx > 0) comment = `/* 100% + ${gapCnt}×${state.gap}px = 爆框 +${live.overflowPx}px */`;
    else comment = "/* 零间隙百分比（原海报写法） */";
  } else {
    // 把权重简化成漂亮的小整数 fr（如 10 10 20 30 20 10 -> 1fr 1fr 2fr 3fr 2fr 1fr）
    const g = ws.reduce((a, b) => gcd(a, b));
    const frs = ws.map((w) => w / g);
    trackVal = state.clampGuard
      ? frs.map((f) => `minmax(72px, ${f}fr)`).join(" ")
      : frs.map((f) => `${f}fr`).join(" ");
    comment = state.clampGuard ? "/* fr 自动扣缝 + minmax 防塌缩 */" : "/* fr 自动吸收栏距，无上限护栏 */";
  }

  const lines = [
    { sel: ".fluid-grid", rest: " {" },
    { prop: "display", val: "grid;" },
    { prop: "grid-template-columns", val: `${trackVal};`, warn: state.unit === "px" || (state.unit === "pct" && state.gap > 0) },
  ];
  if (state.gap > 0) {
    lines.push({ prop: "gap", val: `${state.gap}px;`, warn: state.unit === "pct" });
  }
  lines.push({
    prop: "width",
    val: state.unit === "px" ? "1280px;" : "100%;",
    warn: state.unit === "px",
  });
  if (state.clampGuard && state.unit !== "px") {
    lines.push({ prop: "max-width", val: "1440px; margin-inline: auto;" });
  }
  lines.push({ rest: "}", note: comment, warn: !evalRes.healthy });

  if (state.reflow && state.unit !== "px") {
    lines.push({
      sel: "@media (max-width: 767px)",
      rest: " { .fluid-grid { grid-template-columns: 1fr; } }",
    });
  }

  return lines;
}
