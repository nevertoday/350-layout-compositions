// 107 重复原则 · 单一真源几何与状态模型
// 所有 9×8 印版坐标、间距比例、破格占比、四项判定与白话诊断均由此产出。

export const COLS = 9;
export const ROWS = 8;
export const TOTAL_CELLS = COLS * ROWS; // 72

// 107 号原海报实测 2×2 大圆位置：占第 4–5 列、第 5–6 行（0 起始为 c=3, r=4）
export const POSTER_BREAK = Object.freeze({ c: 3, r: 4 });

export const PALETTE = Object.freeze({
  paper: "#F7F2E6",
  cotton: "#FBF8F0",
  sand: "#EFE8D8",
  ink: "#0E0D0B",
  inkSoft: "#45413A",
  ruleGray: "#B4B2AE",
  vermilion: "#F2521D",
  vermilionDeep: "#B53308",
  vermilionGlow: "#FF6B3D",
  chaos: ["#F2521D", "#2C597D", "#8A7621", "#2E2C29"],
});

export const SPACING_MODES = Object.freeze({
  tight: {
    id: "tight",
    label: "过密贴撞",
    short: "过密",
    radiusRatio: 0.486,
    gapRatio: 0.028,
    gapPct: 3,
    note: "圆缘仅留约 3% 格宽的缝隙，相邻圆紧贴挤撞，产生视觉拥挤与炫目感。",
  },
  sweet: {
    id: "sweet",
    label: "舒朗甜区",
    short: "舒朗",
    radiusRatio: 0.402,
    gapRatio: 0.196,
    gapPct: 20,
    note: "圆间净隙约占格宽的 20%（接近 107 原海报比例），行阵清晰、呼吸均匀。",
  },
  loose: {
    id: "loose",
    label: "过疏碎散",
    short: "过疏",
    radiusRatio: 0.215,
    gapRatio: 0.57,
    gapPct: 57,
    note: "圆点缩得过小、净隙拉到 57%，邻近联系断裂，阵列解体成零散碎点。",
  },
});

export const ORDER_PASS_MIN = 88;
export const MAX_BREAKS = 4;

// 确定性伪随机表：保证每个格位的错态形状、杂色、抖动位移可复现、不跳帧
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(1072026);
export const CELL_SEEDS = Array.from({ length: TOTAL_CELLS }, (_, idx) => {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  // 错态形状：0 圆、1 方、2 三角、3 菱形；错态杂色：4 种冲突色
  const shape = (c * 3 + r * 5 + Math.floor(rng() * 4)) % 4;
  const colorIdx = (c * 2 + r * 3 + Math.floor(rng() * 4)) % 4;
  const dx = (rng() * 2 - 1) * 0.26;
  const dy = (rng() * 2 - 1) * 0.26;
  const scaleErr = 0.62 + rng() * 0.62; // 0.62x .. 1.24x
  const rotErr = (rng() * 2 - 1) * 0.48; // ±27°
  return Object.freeze({ c, r, shape, colorIdx, dx, dy, scaleErr, rotErr });
});

export function createInitialState() {
  return {
    order: 16,
    unifiedShape: false,
    unifiedColor: false,
    spacing: "tight",
    // 开场故意置入 2 处破格：1 处贴死左上外缘切破框线，另 1 处与之争焦
    breaks: [
      { c: 0, r: 0 },
      { c: 6, r: 5 },
    ],
    showPosterGuide: false,
    cursor: { c: POSTER_BREAK.c, r: POSTER_BREAK.r },
  };
}

export function createWallpaperState() {
  return {
    order: 100,
    unifiedShape: true,
    unifiedColor: true,
    spacing: "sweet",
    breaks: [],
    showPosterGuide: false,
    cursor: { c: POSTER_BREAK.c, r: POSTER_BREAK.r },
  };
}

export function isEdgeBreak(b) {
  return b.c === 0 || b.c === COLS - 2 || b.r === 0 || b.r === ROWS - 2;
}

export function breakCoversCell(b, c, r) {
  return c >= b.c && c <= b.c + 1 && r >= b.r && r <= b.r + 1;
}

export function breaksOverlap(a, b) {
  return Math.abs(a.c - b.c) <= 1 && Math.abs(a.r - b.r) <= 1;
}

// 点击画布格位 (c, r)：若该格属于已有 2×2 破格则拆回 4 枚小圆；否则种下新的 2×2 破格
export function toggleBreakAt(state, c, r) {
  const clampedC = Math.max(0, Math.min(COLS - 1, c));
  const clampedR = Math.max(0, Math.min(ROWS - 1, r));
  const hitIdx = state.breaks.findIndex((b) => breakCoversCell(b, clampedC, clampedR));
  if (hitIdx >= 0) {
    const next = state.breaks.slice();
    next.splice(hitIdx, 1);
    return { ...state, breaks: next, cursor: { c: clampedC, r: clampedR } };
  }
  const cand = {
    c: Math.max(0, Math.min(COLS - 2, clampedC)),
    r: Math.max(0, Math.min(ROWS - 2, clampedR)),
  };
  // 若与已有破格重叠则替换重叠者；否则追加（最多 4 处，避免完全糊掉）
  const kept = state.breaks.filter((b) => !breaksOverlap(b, cand));
  if (kept.length >= MAX_BREAKS) kept.shift();
  kept.push(cand);
  return { ...state, breaks: kept, cursor: { c: clampedC, r: clampedR } };
}

export function evaluate(state) {
  const spacingInfo = SPACING_MODES[state.spacing] || SPACING_MODES.sweet;
  const unityOk = state.unifiedShape && state.unifiedColor;
  const rhythmOk = state.spacing === "sweet";
  const orderOk = state.order >= ORDER_PASS_MIN;
  const breakCount = state.breaks.length;
  const edgeBreaks = state.breaks.filter(isEdgeBreak);
  const emphasisOk = breakCount === 1 && edgeBreaks.length === 0;
  const isPosterSpot =
    breakCount === 1 &&
    state.breaks[0].c === POSTER_BREAK.c &&
    state.breaks[0].r === POSTER_BREAK.r;

  const passedCount = [unityOk, rhythmOk, emphasisOk, orderOk].filter(Boolean).length;
  const breakAreaPct = +(((breakCount * 4) / TOTAL_CELLS) * 100).toFixed(1);
  const smallCount = TOTAL_CELLS - breakCount * 4;
  const jitterPct = Math.max(0, 100 - Math.round(state.order));

  // 四词实况标签（直接驱动原海报四栏实况条）
  const pillars = {
    unity: {
      ok: unityOk,
      status: unityOk
        ? "同圆同色"
        : !state.unifiedShape && !state.unifiedColor
          ? "四形四色"
          : !state.unifiedShape
            ? "四形杂排"
            : "四色分散",
    },
    rhythm: {
      ok: rhythmOk,
      status: spacingInfo.short + " " + spacingInfo.gapPct + "%",
    },
    emphasis: {
      ok: emphasisOk,
      status:
        breakCount === 0
          ? "零破格"
          : breakCount > 1
            ? `${breakCount} 处争焦`
            : edgeBreaks.length > 0
              ? "贴边破框"
              : isPosterSpot
                ? "原海报位"
                : "单点破格",
    },
    order: {
      ok: orderOk,
      status: orderOk ? `对位 ${Math.round(state.order)}%` : `抖动 ${jitterPct}%`,
    },
  };

  // 分层白话诊断：明确指出错在哪里、为什么人眼会这样看、下一步做什么
  let tier = "错态 · 杂乱失序";
  let headline = "";
  let reason = "";
  let hint = "";
  let kind = "error"; // "error" | "warn" | "ok"

  if (passedCount === 4) {
    kind = "ok";
    tier = isPosterSpot ? "成立 · 吻合 107 原海报" : "成立 · 统一且有焦点";
    headline = `${smallCount} 枚同形朱橘圆立住底盘，1 处内部破格一眼锁焦`;
    reason =
      "格式塔相似律把 68 枚等距圆点自动打包成一片安静底盘，第 1 次看就省下识别成本；正因底盘高度一致，内部唯一一枚 2×2 放大圆触发前注意突显，视线不必扫读就会直接落到它身上。" +
      (isPosterSpot
        ? "你落印的第 4–5 列、第 5–6 行正好与 107 原海报的偏心焦点完全重合。"
        : "你也可以开启「原海报格位」，对比原海报偏左下黄金区（第 4–5 列、第 5–6 行）的落点。");
    hint = "试着点掉这枚大圆看「全等壁纸」，或再多点 1 处大圆感受焦点如何被分走。";
  } else if (!state.unifiedShape && !state.unifiedColor) {
    tier = "错态 · 形色杂乱";
    headline = "四种图形与四种杂色混排，大脑没法把它们看成一组";
    reason =
      "重复原则的第一步是给视觉建立共享基因。眼下圆、方、三角、菱形叠加蓝黄灰橘，相似律完全失效，哪怕场内有放大块也被背景杂讯吞没，视线只能逐格盲扫。";
    hint = "先点亮「同形为圆」与「同色朱橘」，把 72 格收拢到同一套母题里。";
  } else if (!state.unifiedShape || !state.unifiedColor) {
    tier = "错态 · 局部未齐";
    headline = !state.unifiedShape
      ? "颜色虽已统一成朱橘，但方圆三角仍在互相打架"
      : "形状虽已统一为圆点，但四种杂色把阵列割成了碎片";
    reason = !state.unifiedShape
      ? "只重复单一属性而放任轮廓乱跳时，整体感仍有一半裂口，重复的记忆锚立不稳。"
      : "人眼对色相差异极敏感（前注意通道优先），四种颜色会把同一个矩阵强行拆成四个分散群组。";
    hint = !state.unifiedShape ? "再打开「同形为圆」，让轮廓彻底归队。" : "再打开「同色朱橘」，把颜色收归同一印色。";
  } else if (!orderOk) {
    tier = "错态 · 格位失序";
    headline = `秩序归位仅 ${Math.round(state.order)}%，位置抖动与大小参差拖垮了阵列`;
    reason =
      "即便形色一致，只要每个圆各自偏离行轴、半径忽大忽小，视线就没法按稳定节拍前进，画面显得像随意撒落的圆片而非可控秩序。";
    hint = `向右拖动下方「秩序归位轨」至 ${ORDER_PASS_MIN}% 以上，把 9×8 阵列对齐正交格网。`;
  } else if (!rhythmOk) {
    tier = state.spacing === "tight" ? "错态 · 过密贴撞" : "错态 · 过疏碎散";
    headline =
      state.spacing === "tight"
        ? `圆间净隙仅 ${spacingInfo.gapPct}%，圆缘几乎撞在一起`
        : `圆间净隙拉到 ${spacingInfo.gapPct}%，点阵散成互不相连的碎点`;
    reason =
      state.spacing === "tight"
        ? "间隔被挤干后，相邻朱橘圆在边缘互相干扰，整片阵面发闷发花，连大圆的轮廓优势都被贴身邻居啃掉。"
        : "留白远大于元素本身直径时，邻近律变弱，眼睛不再把它们读成一面有节奏的墙，破格大圆也失去底盘衬托。";
    hint = "把间距节奏切到「舒朗甜区」，留出约 20% 格宽的经验呼吸缝。";
  } else if (breakCount === 0) {
    kind = "warn";
    tier = "错态 · 全等壁纸";
    headline = "72 枚圆点完全相同，统一拉满了，但眼睛无处落脚";
    reason =
      "这是最常见也最容易忽视的「过度重复」：统一、节奏、秩序都成立了，画面却像一张均匀墙纸——没有克制的破格（王无邪称为「特异」），重复就没办法把视线引向重点。";
    hint = "直接在印版矩阵内圈（避开最外一圈）点击任意一格，种下 1 处 2×2 放大破格圆。";
  } else if (breakCount > 1) {
    tier = "错态 · 破格泛滥";
    headline = `阵内同时有 ${breakCount} 处大圆（占 ${breakAreaPct}%），焦点开始互相抢戏`;
    reason =
      "破格之所以有效，全靠其余 68 枚小圆保持克制。一旦出现两处以上大圆，它们就会把注意力拉成几股，重复建立的稳定秩序被凿出多个洞。";
    hint = "点击多余的大圆将其拆回 4 枚小圆，全阵只保留 1 处内部破格。";
  } else if (edgeBreaks.length > 0) {
    tier = "错态 · 破格贴边";
    headline = "这处 2×2 大圆贴死在最外一圈，啃破了阵列边界";
    reason =
      "矩阵外缘四条齐整的切线是建立秩序感的框架。破格点一旦压到第 1/9 列或第 1/8 行，就像把书页页边咬出缺口，视觉重量往画框外漏。";
    hint = "先点这枚贴边大圆拆回小圆，再在矩阵内圈（第 2–8 列、第 2–7 行）点出一处内部焦点。";
  }

  return {
    unityOk,
    rhythmOk,
    emphasisOk,
    orderOk,
    passedCount,
    breakCount,
    smallCount,
    breakAreaPct,
    gapPct: spacingInfo.gapPct,
    jitterPct,
    isPosterSpot,
    edgeBreaks,
    pillars,
    kind,
    tier,
    headline,
    reason,
    hint,
  };
}

// 画布与指针命中共用同一套 1:1 等比格网坐标，确保任何屏幕圆点绝不变椭圆
export function computeMatrixGeometry(width, height) {
  const padX = Math.max(12, Math.round(width * 0.032));
  const padY = Math.max(12, Math.round(height * 0.036));
  const availW = Math.max(60, width - padX * 2);
  const availH = Math.max(60, height - padY * 2);
  const cell = Math.min(availW / COLS, availH / ROWS);
  const gridW = cell * COLS;
  const gridH = cell * ROWS;
  const ox = (width - gridW) / 2;
  const oy = (height - gridH) / 2;
  return { ox, oy, cell, gridW, gridH, width, height };
}

export function hitTestCell(geom, px, py) {
  const c = Math.floor((px - geom.ox) / geom.cell);
  const r = Math.floor((py - geom.oy) / geom.cell);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
  return { c, r };
}

// 04 节 · 破格临界刻度单真源（60 点阵中破格格数 0..27 → 0%..45%）
export const THRESHOLD_TOTAL = 60;
export function evaluateThreshold(count) {
  const n = Math.max(0, Math.min(27, Math.round(count)));
  const pct = +((n / THRESHOLD_TOTAL) * 100).toFixed(1);
  if (n === 0) {
    return {
      n,
      pct,
      zone: "monotone",
      badge: "单调壁纸（0%）",
      headline: "全员一致无例外，画面退化成静态底纹",
      detail:
        "60 个单元全部相同，统一与秩序无懈可击，但人眼扫过一遍抓不到重点。做背景底纸可以，做需要传达核心信息的海报或界面就缺了锚点。",
    };
  }
  if (pct <= 12) {
    return {
      n,
      pct,
      zone: "sweet",
      badge: "单点 / 极少破格（经验参考 2%–12%）",
      headline: `破格占 ${pct}%（${n} / ${THRESHOLD_TOTAL}），重复底盘稳稳托起焦点`,
      detail:
        "绝大多数单元依然守住统一规则，极少数例外立刻在视野里跳出。107 原海报用 4 格合一占 5.6%（4 / 72），正落在这个高识别区间内。",
    };
  }
  if (pct <= 25) {
    return {
      n,
      pct,
      zone: "split",
      badge: "多点分焦（13%–25%）",
      headline: `破格升至 ${pct}%（${n} / ${THRESHOLD_TOTAL}），视线开始在多处来回跳`,
      detail:
        "破格点多到彼此呼应又彼此竞争，第一眼不再有唯一主角；若不是有意做节奏群组或热力分布，信息层级已经变模糊。",
    };
  }
  return {
    n,
    pct,
    zone: "collapse",
    badge: "规则瓦解（> 25%）",
    headline: `破格高达 ${pct}%（${n} / ${THRESHOLD_TOTAL}），重复规则本身已经失效`,
    detail:
      "当超过四分之一的单元都在打破常规，大脑不再把它们看成「秩序里的例外」，而是直接判定为杂乱阵列——破格越用力，强调反而越弱。",
  };
}
