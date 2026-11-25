// 059 层叠构图 · 唯一事实源模型（几何布局、真实可见面积采样、T 形交点、切边检测与分层诊断）
// 渲染画布、控件状态、读数与正文引用均读取本模块，不写死重复常量。

export const STAGE = { w: 1000, h: 455 };

// 经验阈值常量表（页面所有读数与说明只从此处取数，并明确标为「经验值」）
export const EMPIRICAL = {
  overlapMin: 16,      // 相邻两层交叠率经验下限（%）
  overlapMax: 52,      // 相邻两层交叠率经验上限（%）
  minVisible: 38,      // 任意单层保留可见轮廓面积经验下限（%）
  tangentBand: 14,     // 边缘间距 ≤ 14 逻辑单位（约舞台宽 1.4%）触发切边碰线警告
};

// 四片直接化用自 059 原海报的剪纸景片，按理想纵深由远到近（Z1 → Z4）定义
export const IDEAL_ORDER = ["sky", "ridge", "gate", "disc"];

export const LAYER_META = {
  sky: {
    id: "sky",
    name: "远山暖日",
    short: "远山",
    en: "FAR SKY & SUN",
    role: "远景底幕",
    idealSlot: 0,
    w: 316,
    h: 356,
    cy: 214,
    spreadCx: 180,
    compactCx: 462,
  },
  ridge: {
    id: "ridge",
    name: "叠扇中峰",
    short: "中峰",
    en: "MID RIDGE & FAN",
    role: "中远过渡",
    idealSlot: 1,
    w: 244,
    h: 298,
    cy: 252,
    spreadCx: 478,
    compactCx: 498,
  },
  gate: {
    id: "gate",
    name: "深咖拱门",
    short: "拱门",
    en: "ESPRESSO MONOLITH",
    role: "中近结构锚",
    idealSlot: 2,
    w: 178,
    h: 342,
    cy: 236,
    spreadCx: 706,
    compactCx: 526,
  },
  disc: {
    id: "disc",
    name: "焦糖主盘",
    short: "主盘",
    en: "HERO TERRACOTTA",
    role: "前景视觉焦点",
    idealSlot: 3,
    w: 168,
    h: 222,
    cy: 298,
    spreadCx: 896,
    compactCx: 548,
  },
};

export const TONE_MODES = {
  flat: {
    id: "flat",
    label: "同频平贴",
    en: "FLAT",
    desc: "四层同一明度反差、零投影，边界容易粘在一起。",
  },
  aerial: {
    id: "aerial",
    label: "近实远虚",
    en: "AERIAL",
    desc: "远层退淡雾化，近层沉实锐利并投下逐级软影。",
  },
  inverted: {
    id: "inverted",
    label: "远实近虚",
    en: "INVERTED",
    desc: "远山刷深重墨、前景退淡发虚，明暗和遮挡对着干。",
  },
};

// 开场刻意停在「失序 · 平贴散开」错态（0/4 成立），留出真实调校空间
export function createInitialState() {
  return {
    order: ["sky", "disc", "gate", "ridge"], // Z1 → Z4：前景主盘被压在拱门与中峰后面
    stagger: 0.08,                            // 偏散近切边（约 3%–6% 极微交叠）
    manualDx: { sky: 0, ridge: 0, gate: 0, disc: 0 },
    toneMode: "flat",                         // 同频平贴，无投影与明暗梯度
    cutaway: false,                           // false = 0° 正面构图；true = 38° 侧剖景箱
  };
}

export function createSolvedState() {
  return {
    order: [...IDEAL_ORDER],
    stagger: 0.52,
    manualDx: { sky: 0, ridge: 0, gate: 0, disc: 0 },
    toneMode: "aerial",
    cutaway: false,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

// 由当前状态算出四片剪纸在 1000×560 逻辑画框中的精确矩形与 Z 槽位
export function getLayerRects(state) {
  const s = clamp(state.stagger, 0, 1);
  const byId = {};
  for (let slot = 0; slot < state.order.length; slot++) {
    const id = state.order[slot];
    const m = LAYER_META[id];
    const baseCx = lerp(m.spreadCx, m.compactCx, s);
    const dx = state.manualDx?.[id] || 0;
    const minCx = m.w / 2 + 12;
    const maxCx = STAGE.w - m.w / 2 - 12;
    const cx = clamp(baseCx + dx, minCx, maxCx);
    const cy = m.cy;
    byId[id] = {
      id,
      slot, // 0 = Z1 最远, 3 = Z4 最近
      zNorm: slot / 3,
      x: cx - m.w / 2,
      y: cy - m.h / 2,
      w: m.w,
      h: m.h,
      cx,
      cy,
      right: cx + m.w / 2,
      bottom: cy + m.h / 2,
    };
  }
  return state.order.map((id) => byId[id]);
}

// 精确判断点 (px, py) 是否落在剪纸片实际实心造型内（与画布绘制路径同源）
export function hitLayerShape(id, px, py, r) {
  if (px < r.x || px > r.right || py < r.y || py > r.bottom) return false;
  const u = (px - r.x) / r.w; // 0..1
  const v = (py - r.y) / r.h; // 0..1
  if (id === "sky") {
    // 完整暖奶白底纸矩形（对应原海报上方与背景纸片）
    return true;
  }
  if (id === "ridge") {
    // 左侧玫瑰起伏山脉 + 右侧半圆叠扇剪影
    const fanCx = 0.72, fanCy = 0.44, fanRx = 0.28, fanRy = 0.36;
    const inFan = u >= fanCx - 0.02 && ((u - fanCx) / fanRx) ** 2 + ((v - fanCy) / fanRy) ** 2 <= 1;
    // 山脊曲线高度（v 越小越高）
    const ridgeTop =
      0.32 +
      0.13 * Math.sin(u * Math.PI * 2.1 - 0.6) -
      0.16 * Math.exp(-((u - 0.56) ** 2) / 0.055) -
      0.08 * Math.exp(-((u - 0.22) ** 2) / 0.04);
    const inMountain = v >= ridgeTop;
    return inMountain || inFan;
  }
  if (id === "gate") {
    // 主深咖建筑斜顶竖板 + 左侧半透雾片
    const topEdge = u < 0.22 ? 0.14 : 0.02 + (1 - u) * 0.08;
    return v >= topEdge;
  }
  if (id === "disc") {
    // 主焦糖大圆盘 + 右下叠压暖白应用角卡
    const cx = 0.48, cy = 0.44;
    const dx = (px - (r.x + r.w * cx)) / (r.w * 0.46);
    const dy = (py - (r.y + r.h * cy)) / (r.w * 0.46);
    const inCircle = dx * dx + dy * dy <= 1;
    const inCard = u >= 0.34 && v >= 0.56;
    return inCircle || inCard;
  }
  return true;
}

// 矩形交集面积（用于判断相邻层级横向咬合度与切边距离）
function rectOverlapArea(a, b) {
  const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
  return ox * oy;
}

// 计算全部核心指标与严格单错优先诊断
export function evaluate(state) {
  const rects = getLayerRects(state); // 按 Z1 → Z4 排好
  const byId = Object.fromEntries(rects.map((r) => [r.id, r]));

  // 1. 确定性网格采样（60×34 = 2040 点，耗时 <0.05ms）：同时测每片真实可见面积与相邻层真实交叠率
  const cols = 60, rows = 34;
  const totalPts = { sky: 0, ridge: 0, gate: 0, disc: 0 };
  const visPts = { sky: 0, ridge: 0, gate: 0, disc: 0 };
  const pairHit = [0, 0, 0]; // Z1∩Z2, Z2∩Z3, Z3∩Z4

  for (let gy = 0; gy < rows; gy++) {
    const py = ((gy + 0.5) / rows) * STAGE.h;
    for (let gx = 0; gx < cols; gx++) {
      const px = ((gx + 0.5) / cols) * STAGE.w;
      const hits = [];
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (hitLayerShape(r.id, px, py, r)) {
          totalPts[r.id]++;
          hits.push(i);
        }
      }
      if (hits.length) {
        // 最上层（slot 最大者）可见
        const topIdx = hits[hits.length - 1];
        visPts[rects[topIdx].id]++;
        // 相邻 Z 槽位交叠计数
        for (let k = 0; k < 3; k++) {
          if (hits.includes(k) && hits.includes(k + 1)) pairHit[k]++;
        }
      }
    }
  }

  const visibleMap = {};
  let minVisible = 100;
  let minVisibleId = rects[0].id;
  for (const r of rects) {
    const pct = totalPts[r.id] > 0 ? Math.round((visPts[r.id] / totalPts[r.id]) * 100) : 100;
    visibleMap[r.id] = pct;
    if (pct < minVisible) {
      minVisible = pct;
      minVisibleId = r.id;
    }
  }

  // 每对相邻层的交叠率 = 真实交叠点数 / 两者中较小片的总点数
  const pairOverlaps = [0, 1, 2].map((k) => {
    const a = rects[k], b = rects[k + 1];
    const denom = Math.max(1, Math.min(totalPts[a.id], totalPts[b.id]));
    return Math.round((pairHit[k] / denom) * 100);
  });
  const avgOverlap = Math.round((pairOverlaps[0] + pairOverlaps[1] + pairOverlaps[2]) / 3);
  const minPairOverlap = Math.min(...pairOverlaps);

  // 2. 切边碰线检测（两个矩形的左/右竖边落在 ±EMPIRICAL.tangentBand 内且纵向区间重叠）
  const tangentPairs = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      if (yOverlap < 40) continue;
      const edgeChecks = [
        { dist: Math.abs(a.right - b.x), x: (a.right + b.x) / 2 },
        { dist: Math.abs(b.right - a.x), x: (b.right + a.x) / 2 },
        { dist: Math.abs(a.x - b.x), x: (a.x + b.x) / 2 },
        { dist: Math.abs(a.right - b.right), x: (a.right + b.right) / 2 },
      ];
      // 只把「外部相切或几乎零交叠擦边」标为切边，避免把正常重叠误报成切边
      const area = rectOverlapArea(a, b);
      const minArea = Math.min(a.w * a.h, b.w * b.h);
      const isBarelyTouching = area / minArea < 0.08;
      for (const ec of edgeChecks.slice(0, 2)) {
        if (ec.dist <= EMPIRICAL.tangentBand && isBarelyTouching) {
          tangentPairs.push({
            a: a.id,
            b: b.id,
            x: ec.x,
            y: (Math.max(a.y, b.y) + Math.min(a.bottom, b.bottom)) / 2,
            dist: Math.round(ec.dist),
          });
          break;
        }
      }
    }
  }

  // 3. T 形交点定位：前层边界干净切过相邻后层水平/轮廓边时的交点
  const tJunctions = [];
  for (let k = 0; k < 3; k++) {
    const back = rects[k];
    const front = rects[k + 1];
    if (pairOverlaps[k] < 10) continue;
    // 取前层左缘或右缘穿过后层上/中腰的位置作为真实 T 交点标记
    const candX = front.x > back.x && front.x < back.right ? front.x : front.right > back.x && front.right < back.right ? front.right : null;
    if (candX !== null) {
      const yMid = Math.max(back.y + 24, front.y + 28);
      if (yMid < Math.min(back.bottom, front.bottom) - 16) {
        tJunctions.push({ x: candX, y: yMid, back: back.id, front: front.id, pairIndex: k });
      }
    }
  }

  // 4. 层序检测（是否严格按远山→中峰→拱门→主盘递进，同时区分大底反盖）
  let inversions = 0;
  for (let i = 0; i < state.order.length; i++) {
    for (let j = i + 1; j < state.order.length; j++) {
      if (LAYER_META[state.order[i]].idealSlot > LAYER_META[state.order[j]].idealSlot) inversions++;
    }
  }
  const orderCorrect = inversions === 0;
  const skyInFrontOfAny = state.order.indexOf("sky") > 0;

  // 5. 四项原海报教学要点实测达标（对应右侧四枚细线空心圆徽）
  const overlapInBand = avgOverlap >= EMPIRICAL.overlapMin && avgOverlap <= EMPIRICAL.overlapMax && minPairOverlap >= 10 && tangentPairs.length === 0;
  const visibilityOk = minVisible >= EMPIRICAL.minVisible;
  const checks = {
    frontBack: orderCorrect,
    overlap: overlapInBand,
    hierarchy: orderCorrect && visibilityOk && tJunctions.length >= 2,
    contrast: state.toneMode === "aerial",
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 6. 严格优先级单主错诊断（只报当下最致命的一条，说清为什么）
  let diagnosis;
  if (!visibilityOk || avgOverlap > EMPIRICAL.overlapMax) {
    const coveredName = LAYER_META[minVisibleId].name;
    diagnosis = {
      code: "buried",
      severity: "error",
      tag: skyInFrontOfAny ? "大底反盖 · 吞没后层" : "过度压死 · 轮廓失认",
      title: `「${coveredName}」仅剩 ${minVisible}% 可见，后层造型被遮死`,
      reason: skyInFrontOfAny
        ? `面积最大的「远山暖日」放到了中前层，像一堵白墙挡住后面的剪纸，画面失去透气纵深。先把远山退回 Z1 底槽。`
        : `四片挤得太紧（平均交叠 ${avgOverlap}%，高于 ${EMPIRICAL.overlapMax}% 经验上限），被盖住的轮廓认不出来，层次反而塌成一块。往左拉开咬合游标，给每片留出至少 ${EMPIRICAL.minVisible}% 露面。`,
    };
  } else if (!orderCorrect) {
    const heroSlot = state.order.indexOf("disc") + 1;
    const skySlot = state.order.indexOf("sky") + 1;
    diagnosis = {
      code: "order",
      severity: "error",
      tag: `层序错位 · ${inversions} 处前后倒置`,
      title: skySlot > 1 ? `「远山暖日」跑到 Z${skySlot}，底幕越位抢前` : `「焦糖主盘」沉在 Z${heroSlot}，前景主角被中景遮住`,
      reason: `人眼默认小而实的主体在前、大而淡的背景在后。现在有 ${inversions} 组前后关系打架，视线进画面后会被中途挡住；在槽轨上把四片理顺为「远山 Z1 → 中峰 Z2 → 拱门 Z3 → 主盘 Z4」。`,
    };
  } else if (tangentPairs.length > 0) {
    const tp = tangentPairs[0];
    diagnosis = {
      code: "tangent",
      severity: "warn",
      tag: "边缘切边 · 前后发僵",
      title: `「${LAYER_META[tp.a].short}」与「${LAYER_META[tp.b].short}」边缘仅距 ${tp.dist} 格，刚好碰线`,
      reason: `两片轮廓在 ±${EMPIRICAL.tangentBand} 格切边带内擦肩而过却没真正压过去，形不成 T 形交点，大脑会一瞬间把它们看成贴在同一张平纸上。把咬合游标往右推过切边区，让前片干脆压入后片。`,
    };
  } else if (avgOverlap < EMPIRICAL.overlapMin || minPairOverlap < 10) {
    diagnosis = {
      code: "separated",
      severity: "warn",
      tag: "零遮挡 · 平面漂浮",
      title: `相邻平均交叠仅 ${avgOverlap}%（低于 ${EMPIRICAL.overlapMin}% 经验下限）`,
      reason: `四片剪纸各自排开、互相不压边，缺少「谁打断了谁的轮廓」这一条最强深度线索，画面读起来像四张并排贴纸而不是前后空间。往右拖咬合游标进入 ${EMPIRICAL.overlapMin}%–${EMPIRICAL.overlapMax}% 甜区。`,
    };
  } else if (state.toneMode === "inverted") {
    diagnosis = {
      code: "inverted-tone",
      severity: "error",
      tag: "线索打架 · 远实近虚",
      title: "遮挡关系说主盘在前，明暗反差却把远山往前拽",
      reason: "浓重深墨会把远山硬拉到眼前，淡化的主盘反而向后退缩；「物理压边」与「空气透视」方向相反，眼睛越看越别扭。把虚实档切回「近实远虚」，让两组线索朝同一方向使劲。",
    };
  } else if (state.toneMode === "flat") {
    diagnosis = {
      code: "flat-tone",
      severity: "warn",
      tag: "同频平贴 · 缺少纵深呼吸",
      title: "层序与压边都对了，但四层同明度零投影，交界发粘",
      reason: "单靠遮挡只能知道谁前谁后，拉不开「离得多远」的空气感。把虚实档切到「近实远虚」，让远山退淡、近片沉实并落下克制软影，四层立刻松开呼吸。",
    };
  } else {
    diagnosis = {
      code: "solved",
      severity: "ok",
      tag: "四层成立 · 纵深通透",
      title: `层序由远及近，平均咬合 ${avgOverlap}%，最小露面 ${minVisible}%`,
      reason: "遮挡关系（T 形交点）、体量层级与「近实远虚」空气透视完全同向，视线沿远山→中峰→拱门自然聚焦到焦糖主盘。点「掀开侧剖 38°」可直观检视四片纸的真实层距与投影落点。",
    };
  }

  return {
    rects,
    byId,
    visibleMap,
    minVisible,
    minVisibleId,
    pairOverlaps,
    avgOverlap,
    minPairOverlap,
    tangentPairs,
    tJunctions,
    inversions,
    orderCorrect,
    checks,
    passCount,
    diagnosis,
  };
}

// 不同虚实模式下四片剪纸的色彩与投影参数（供 Hero 景箱与 02 节共用）
export function getLayerVisualStyle(id, slot, toneMode) {
  // slot: 0 (Z1 far) .. 3 (Z4 near)
  const depthT = slot / 3;
  if (toneMode === "flat") {
    return {
      alpha: 1,
      hazeMix: 0,
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowAlpha: 0,
      contrastBoost: 0,
      palette: {
        skyBg: "#E6C7BA",
        skySun: "#C57C6A",
        skyHill: "#CFA69B",
        ridgeHillFar: "#BD8C84",
        ridgeHillNear: "#AC7772",
        ridgeFanOuter: "#CFA89E",
        ridgeFanInner: "#DEC0B6",
        gateBody: "#6E4F4B",
        gateVellum: "rgba(182, 134, 128, 0.55)",
        discFill: "#C47863",
        cardBg: "#E6D2C5",
      },
    };
  }
  if (toneMode === "inverted") {
    // 远景超深超锐、前景退淡发灰（故意与遮挡顺序对着干）
    return {
      alpha: 1,
      hazeMix: depthT * 0.45,
      shadowBlur: (1 - depthT) * 14,
      shadowOffsetX: -(1 - depthT) * 6,
      shadowOffsetY: (1 - depthT) * 10,
      shadowAlpha: 0.3 * (1 - depthT),
      contrastBoost: -1,
      palette: {
        skyBg: "#D7B4A8",
        skySun: "#5B1E17",
        skyHill: "#2E1918",
        ridgeHillFar: "#4C2928",
        ridgeHillNear: "#643B3A",
        ridgeFanOuter: "#7D524F",
        ridgeFanInner: "#9B716C",
        gateBody: "#9B7A76",
        gateVellum: "rgba(218, 194, 187, 0.45)",
        discFill: "#DFB8AA",
        cardBg: "#E8D5CB",
      },
    };
  }
  // aerial：忠实 059 原海报的「近实远虚」高质感色阶 + 逐级纸片浮起软影
  return {
    alpha: 1,
    hazeMix: (1 - depthT) * 0.2,
    shadowBlur: 6 + depthT * 18,
    shadowOffsetX: -3 - depthT * 7,
    shadowOffsetY: 4 + depthT * 11,
    shadowAlpha: 0.12 + depthT * 0.24,
    contrastBoost: 1,
    palette: {
      skyBg: "#F4E4D8",
      skySun: "#D87C65",
      skyHill: "#EBD1C5",
      ridgeHillFar: "#C89B92",
      ridgeHillNear: "#A77370",
      ridgeFanOuter: "#D9B9AF",
      ridgeFanInner: "#EAD4C4",
      gateBody: "#3A2827",
      gateVellum: "rgba(197, 143, 136, 0.62)",
      discFill: "#BB664E",
      cardBg: "#F4E4D8",
    },
  };
}
