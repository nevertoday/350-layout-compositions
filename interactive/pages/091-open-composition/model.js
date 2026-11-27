// 091 开放式构图 · 单真源几何与视觉审计算法（零硬编码常量，所有读数由实绘几何直接导出）

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 海天长路",
    shortLabel: "海天长路",
    badge: "POSTER 091 · COASTAL HORIZON",
    focalName: "金帆小舟",
    arrowName: "破空弧箭",
    pathName: "云白海岸路",
    clutterLabels: ["左上封角印章", "中左冗余说明盒", "底部装饰封边条"],
    caption: "1:1 转译 091 原海报：破框双金日、钴蓝海山、小金帆、S 弯云白海路与破空弧箭。",
  },
  arch: {
    id: "arch",
    label: "展览 · 拱门回廊",
    shortLabel: "拱门回廊",
    badge: "EXHIBITION · OPEN COLONNADE",
    focalName: "观展剪影",
    arrowName: "日光斜束",
    pathName: "回廊光道",
    clutterLabels: ["左上场馆徽章", "中左冗长票务卡", "底部赞助商黑条"],
    caption: "建筑摄影展海报：石拱破右缘延伸、日光斜穿画外，左上留出大片晴空承载展讯。",
  },
  editorial: {
    id: "editorial",
    label: "杂志 · 帆影跨页",
    shortLabel: "帆影跨页",
    badge: "EDITORIAL · BLEED SPREAD",
    focalName: "远海帆标",
    arrowName: "风向导引线",
    pathName: "潮汐留白带",
    clutterLabels: ["左上栏目彩块", "中左密排导读框", "底部期号满栏框"],
    caption: "杂志特刊跨页：超大标题与海岸线冲出页缘，给文字与视野留出自由呼吸。",
  },
};

export const INITIAL_STATE = {
  scenario: "poster",
  expansion: 0.68,       // 0.60 ~ 1.54；开场缩在框内（0 处破框）
  enclosure: true,       // 开场套着粗重封闭围栏
  arrowOut: false,       // 开场弧箭向内折回画心
  clutters: [true, true, true], // 3 处闷塞边角堵块
  leftAnchor: true,      // 左下大蓝圆（马远留白解可收起以释放大留白）
  sunShift: 0,           // -0.22 ~ +0.18，微调右上日轮切口深度
  focusShift: 0,         // -0.24 ~ +0.24，微调主体位置
  xray: false,           // 画外世界 X-Ray 透视开关
  highlight: null,       // 'bleed' | 'breath' | 'open' | 'flow' | null
};

// 多组合法解与双向试错预设（全部由同一 evaluate 函数实测，不走任何捷径）
export const PRESETS = {
  // 合法多解
  poster: {
    label: "原海报海天解",
    kind: "good",
    patch: {
      expansion: 1.05,
      enclosure: false,
      arrowOut: true,
      clutters: [false, false, false],
      leftAnchor: true,
      sunShift: 0,
      focusShift: 0,
    },
  },
  mayuan: {
    label: "马远留白解",
    kind: "good",
    patch: {
      expansion: 1.0,
      enclosure: false,
      arrowOut: true,
      clutters: [false, false, false],
      leftAnchor: false,
      sunShift: 0.04,
      focusShift: 0.02,
    },
  },
  twinBleed: {
    label: "双翼穿框解",
    kind: "good",
    patch: {
      expansion: 1.15,
      enclosure: false,
      arrowOut: true,
      clutters: [false, false, false],
      leftAnchor: true,
      sunShift: -0.02,
      focusShift: -0.06,
    },
  },
  // 双向试错
  canned: {
    label: "封闭罐头",
    kind: "bad",
    patch: {
      expansion: 0.68,
      enclosure: true,
      arrowOut: false,
      clutters: [true, true, true],
      leftAnchor: true,
      sunShift: 0,
      focusShift: 0,
    },
  },
  tangent: {
    label: "擦边切线",
    kind: "bad",
    patch: {
      expansion: 0.87,
      enclosure: false,
      arrowOut: true,
      clutters: [false, false, false],
      leftAnchor: true,
      sunShift: -0.055,
      focusShift: 0,
    },
  },
  overcrop: {
    label: "过度裁切",
    kind: "bad",
    patch: {
      expansion: 1.47,
      enclosure: false,
      arrowOut: true,
      clutters: [false, false, false],
      leftAnchor: true,
      sunShift: 0.06,
      focusShift: 0.14,
    },
  },
  crowded: {
    label: "闷堵填满",
    kind: "bad",
    patch: {
      expansion: 1.05,
      enclosure: false,
      arrowOut: true,
      clutters: [true, true, true],
      leftAnchor: true,
      sunShift: 0,
      focusShift: 0,
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createState(overrides = {}) {
  return {
    ...INITIAL_STATE,
    clutters: [...INITIAL_STATE.clutters],
    ...overrides,
  };
}

// 依据当前状态在画框归一化坐标 [0,1]x[0,1]（外扩画外区到 [-0.36, 1.36]）构造全部实绘几何
export function buildGeometry(state) {
  const e = clamp(state.expansion, 0.6, 1.54);
  const k = (e - 0.68) / (1.05 - 0.68); // 0 = 缩在框内，1 = 原海报标准破框，>1 = 进一步推近/过切
  const sunS = clamp(state.sunShift, -0.22, 0.18);
  const focS = clamp(state.focusShift, -0.24, 0.24);
  const sc = state.scenario;

  // 1. 右上金黄太阳圆（缩框时完全在 [0,1] 内；破框时优雅跨出右上两缘）
  const trRadius = sc === "arch" ? 0.145 * (0.78 + 0.22 * e) : 0.165 * (0.76 + 0.24 * e);
  const trCx = 0.77 + 0.225 * k + sunS;
  const trCy = 0.21 - 0.17 * k - sunS * 0.45;
  const sunTopRight = { id: "sunTR", label: sc === "arch" ? "右上日光盘" : "右上金黄日", cx: trCx, cy: trCy, r: trRadius };

  // 2. 白色云光轮（衬在弧箭后，提供清爽呼吸亮区）
  const halo = {
    cx: 0.73 + 0.14 * k,
    cy: 0.30 - 0.05 * k,
    r: 0.18 * (0.82 + 0.18 * e),
  };

  // 3. 右下破框金黄前景圆（马远留白解时仍保留但更收敛；过推时占据过大）
  const brRadius = sc === "editorial" ? 0.16 * (0.78 + 0.22 * e) : 0.195 * (0.76 + 0.24 * e);
  const brCx = 0.74 + 0.24 * k + sunS * 0.35;
  const brCy = 0.76 + 0.225 * k;
  const sunBottomRight = { id: "sunBR", label: "右下破框金圆", cx: brCx, cy: brCy, r: brRadius };

  // 4. 左下破框钴蓝圆（可选辅助呼应，马远留白解下关闭）
  const blRadius = 0.138 * (0.78 + 0.22 * e);
  const blCx = 0.18 - 0.175 * k;
  const blCy = 0.80 + 0.19 * k;
  const blueBottomLeft = {
    id: "blueBL",
    label: "左下钴蓝圆",
    active: !!state.leftAnchor,
    cx: blCx,
    cy: blCy,
    r: blRadius,
  };

  // 5. 海平线与钴蓝远山（或拱门回廊轮廓）
  const horizonY = sc === "arch" ? 0.56 : sc === "editorial" ? 0.50 : 0.525;
  const hillStartX = clamp(0.50 - 0.04 * k + focS * 0.25, 0.28, 0.68);
  const hillEndX = 0.88 + 0.26 * k + focS * 0.3; // k=0 时 0.88 缩框内；k=1 时 1.14 穿出右缘
  const hillPeakY = horizonY - (sc === "arch" ? 0.19 : 0.115) * (0.85 + 0.18 * e);
  const hill = {
    id: "hill",
    label: sc === "arch" ? "钴蓝石拱廊" : "钴蓝远山",
    startX: hillStartX,
    endX: hillEndX,
    horizonY,
    peakY: hillPeakY,
  };

  // 6. 主角锚点（小金帆 / 剪影观展人 / 帆标）— 随延展与偏移移动，推过头会逼近并切出右缘！
  const focalW = sc === "arch" ? 0.052 * (0.85 + 0.2 * e) : 0.056 * (0.85 + 0.22 * e);
  const focalH = sc === "arch" ? 0.125 * (0.85 + 0.2 * e) : 0.095 * (0.85 + 0.22 * e);
  const focalCx = 0.72 + 0.105 * k + focS;
  const focalBottomY = horizonY + 0.004;
  const focal = {
    id: "focal",
    label: SCENARIOS[sc].focalName,
    cx: focalCx,
    cy: focalBottomY - focalH * 0.5,
    x: focalCx - focalW * 0.5,
    y: focalBottomY - focalH,
    w: focalW,
    h: focalH,
    bottomY: focalBottomY,
  };

  // 7. 蜿蜒出底边的云白 S 形海岸路（k<0.55 时被截停在框内，k>=0.85 时穿出底边）
  const pathEndY = 0.84 + 0.28 * k; // k=0 -> 0.84 (框内), k=1 -> 1.12 (破底边)
  const pathStartX = hillStartX + 0.03;
  const pathStartY = horizonY + 0.005;
  const pathEndX = clamp(0.62 + 0.04 * k, 0.45, 0.78);
  const path = {
    id: "path",
    label: SCENARIOS[sc].pathName,
    startX: pathStartX,
    startY: pathStartY,
    cp1X: 0.94 + 0.04 * k,
    cp1Y: horizonY + 0.08,
    cp2X: 0.34,
    cp2Y: horizonY + 0.24,
    endX: pathEndX,
    endY: pathEndY,
    baseWidth: 0.16 * (0.78 + 0.22 * e),
  };

  // 8. 破空弧箭（arrowOut=true 向右上穿入白云轮直指画外；false 时折回框内指向左中）
  const arrowStart = { x: hillStartX + 0.015, y: horizonY - 0.006 };
  const arrow = state.arrowOut
    ? {
        outward: true,
        start: arrowStart,
        cp: { x: 0.62 + 0.04 * k, y: 0.35 - 0.03 * k },
        tip: { x: 0.82 + 0.11 * k, y: 0.31 - 0.07 * k },
        // 延长射线指向画外
        extTip: { x: 1.12, y: 0.12 },
      }
    : {
        outward: false,
        start: arrowStart,
        cp: { x: 0.56, y: 0.28 },
        tip: { x: 0.36, y: 0.43 },
        extTip: { x: 0.36, y: 0.43 },
      };

  // 9. 三处可点击扫除的边角闷塞堵块
  const cLabels = SCENARIOS[sc].clutterLabels;
  const clutterBoxes = [
    { id: 0, label: cLabels[0], x: 0.055, y: 0.06, w: 0.31, h: 0.135, active: !!state.clutters[0] },
    { id: 1, label: cLabels[1], x: 0.055, y: 0.27, w: 0.34, h: 0.24, active: !!state.clutters[1] },
    { id: 2, label: cLabels[2], x: 0.19, y: 0.835, w: 0.50, h: 0.105, active: !!state.clutters[2] },
  ];

  // 10. 主题字块（editorial / poster 的左上标题锚点，在画框左侧呼吸区）
  const titleBlock = {
    x: sc === "editorial" ? -0.025 * Math.max(0, k) : 0.06,
    y: 0.08,
    w: 0.32,
    h: 0.14,
  };

  return {
    expansion: e,
    k,
    sunTopRight,
    halo,
    sunBottomRight,
    blueBottomLeft,
    hill,
    focal,
    path,
    arrow,
    clutterBoxes,
    titleBlock,
    enclosure: !!state.enclosure,
  };
}

// 检测一个圆形与 [0,1]x[0,1] 边界的破框与擦边关系
function inspectCircleBoundary(c) {
  const margins = [
    { edge: "top", dist: c.cy - c.r, depth: (0 - (c.cy - c.r)) / (2 * c.r) },
    { edge: "right", dist: 1 - (c.cx + c.r), depth: (c.cx + c.r - 1) / (2 * c.r) },
    { edge: "bottom", dist: 1 - (c.cy + c.r), depth: (c.cy + c.r - 1) / (2 * c.r) },
    { edge: "left", dist: c.cx - c.r, depth: (0 - (c.cx - c.r)) / (2 * c.r) },
  ];
  const bleedingEdges = [];
  const tangentEdges = [];
  let maxDepth = 0;

  for (const m of margins) {
    // 有效破框：越界至少 0.032（且未完全飞出画框）
    if (m.dist < -0.032 && m.depth < 0.86) {
      bleedingEdges.push(m.edge);
      if (m.depth > maxDepth) maxDepth = m.depth;
    } else if (Math.abs(m.dist) <= 0.032) {
      // 致命擦边切线：刚好蹭在边界 ±3.2% 以内
      tangentEdges.push(m.edge);
    }
  }
  const fullyOutside = c.cx - c.r > 0.98 || c.cx + c.r < 0.02 || c.cy - c.r > 0.98 || c.cy + c.r < 0.02;
  return { bleedingEdges, tangentEdges, maxDepth, fullyOutside };
}

// 实绘 16×16 网格积分计算画框 [0,1]x[0,1] 内的真实留白呼吸率（单真源，极速 <0.02ms）
function computeWhitespacePct(geo) {
  const N = 16;
  let occupied = 0;
  const total = N * N;

  for (let iy = 0; iy < N; iy++) {
    const y = (iy + 0.5) / N;
    for (let ix = 0; ix < N; ix++) {
      const x = (ix + 0.5) / N;
      let hit = false;

      // 封闭围栏边框占去四周呼吸边缘
      if (geo.enclosure && (x < 0.055 || x > 0.945 || y < 0.055 || y > 0.945)) {
        hit = true;
      }

      // 闷塞边角堵块
      if (!hit) {
        for (const cb of geo.clutterBoxes) {
          if (cb.active && x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
            hit = true;
            break;
          }
        }
      }

      // 三个实心圆（右上金日、右下金圆、左下蓝圆）
      if (!hit) {
        const circles = [geo.sunTopRight, geo.sunBottomRight];
        if (geo.blueBottomLeft.active) circles.push(geo.blueBottomLeft);
        for (const c of circles) {
          const dx = x - c.cx;
          const dy = y - c.cy;
          if (dx * dx + dy * dy <= c.r * c.r) {
            hit = true;
            break;
          }
        }
      }

      // 钴蓝远山体块（简化包络）
      if (!hit && x >= geo.hill.startX && x <= geo.hill.endX && y <= geo.hill.horizonY && y >= geo.hill.peakY) {
        const u = (x - geo.hill.startX) / Math.max(0.01, geo.hill.endX - geo.hill.startX);
        const ridgeY = geo.hill.horizonY - (geo.hill.horizonY - geo.hill.peakY) * Math.sin(clamp(u, 0, 1) * Math.PI * 0.78);
        if (y >= ridgeY) hit = true;
      }

      // 海面水色实体（右侧下方海湾烘托，只计高饱和色带，白色海岸路不算占用！）
      if (!hit && y > geo.hill.horizonY && x > 0.60 && y < 0.86) {
        // 排除中间的白色 S 弯海岸路
        const t = clamp((y - geo.path.startY) / Math.max(0.01, geo.path.endY - geo.path.startY), 0, 1);
        const px =
          (1 - t) ** 3 * geo.path.startX +
          3 * (1 - t) ** 2 * t * geo.path.cp1X +
          3 * (1 - t) * t ** 2 * geo.path.cp2X +
          t ** 3 * geo.path.endX;
        const halfW = geo.path.baseWidth * (0.14 + 0.55 * t);
        if (Math.abs(x - px) > halfW && x > 0.68) {
          hit = true;
        }
      }

      // 主角小金帆包围盒
      if (!hit && x >= geo.focal.x && x <= geo.focal.x + geo.focal.w && y >= geo.focal.y && y <= geo.focal.y + geo.focal.h) {
        hit = true;
      }

      if (hit) occupied++;
    }
  }

  return Math.round(((total - occupied) / total) * 100);
}

export function evaluate(state) {
  const geo = buildGeometry(state);
  const sc = SCENARIOS[state.scenario];

  const tr = inspectCircleBoundary(geo.sunTopRight);
  const br = inspectCircleBoundary(geo.sunBottomRight);
  const bl = geo.blueBottomLeft.active ? inspectCircleBoundary(geo.blueBottomLeft) : { bleedingEdges: [], tangentEdges: [], maxDepth: 0, fullyOutside: false };

  // 检测山体与海岸路破框 / 擦边
  const hillDist = 1 - geo.hill.endX;
  const hillBleeds = hillDist < -0.032;
  const hillTangent = Math.abs(hillDist) <= 0.032;

  const pathDist = 1 - geo.path.endY;
  const pathBleeds = pathDist < -0.032;
  const pathTangent = Math.abs(pathDist) <= 0.032;

  const bleedingElements = [];
  const bleedEdgeSet = new Set();
  const tangentItems = [];

  if (tr.bleedingEdges.length) {
    bleedingElements.push(geo.sunTopRight.label);
    tr.bleedingEdges.forEach((ed) => bleedEdgeSet.add(ed));
  } else if (tr.tangentEdges.length) {
    tangentItems.push({ label: geo.sunTopRight.label, edge: tr.tangentEdges[0], x: geo.sunTopRight.cx, y: geo.sunTopRight.cy, r: geo.sunTopRight.r });
  }

  if (br.bleedingEdges.length) {
    bleedingElements.push(geo.sunBottomRight.label);
    br.bleedingEdges.forEach((ed) => bleedEdgeSet.add(ed));
  } else if (br.tangentEdges.length) {
    tangentItems.push({ label: geo.sunBottomRight.label, edge: br.tangentEdges[0], x: geo.sunBottomRight.cx, y: geo.sunBottomRight.cy, r: geo.sunBottomRight.r });
  }

  if (bl.bleedingEdges.length) {
    bleedingElements.push(geo.blueBottomLeft.label);
    bl.bleedingEdges.forEach((ed) => bleedEdgeSet.add(ed));
  } else if (bl.tangentEdges.length) {
    tangentItems.push({ label: geo.blueBottomLeft.label, edge: bl.tangentEdges[0], x: geo.blueBottomLeft.cx, y: geo.blueBottomLeft.cy, r: geo.blueBottomLeft.r });
  }

  if (hillBleeds) {
    bleedingElements.push(geo.hill.label);
    bleedEdgeSet.add("right");
  } else if (hillTangent) {
    tangentItems.push({ label: geo.hill.label, edge: "right", x: geo.hill.endX, y: geo.hill.horizonY - 0.04, r: 0.05 });
  }

  if (pathBleeds) {
    bleedingElements.push(geo.path.label);
    bleedEdgeSet.add("bottom");
  } else if (pathTangent) {
    tangentItems.push({ label: geo.path.label, edge: "bottom", x: geo.path.endX, y: geo.path.endY, r: 0.05 });
  }

  // 主角识别完整性检查（小金帆 / 剪影不能被边框切碎或逃出画框）
  const focalRightMargin = 1 - (geo.focal.x + geo.focal.w);
  const focalLeftMargin = geo.focal.x;
  const focalClipped = focalRightMargin < 0.015 || focalLeftMargin < 0.015 || geo.expansion > 1.40;
  const focalTangent = !focalClipped && (focalRightMargin < 0.035 || focalLeftMargin < 0.035);
  if (focalTangent) {
    tangentItems.push({ label: geo.focal.label, edge: focalRightMargin < 0.035 ? "right" : "left", x: geo.focal.cx, y: geo.focal.cy, r: 0.05 });
  }

  const clutterCount = geo.clutterBoxes.filter((b) => b.active).length;
  const whitespacePct = computeWhitespacePct(geo);
  const tooCrowded = whitespacePct < 48 || clutterCount > 0;
  const tooEmpty = whitespacePct > 86;
  const bleedCount = bleedingElements.length;
  const allEdgesBlocked = geo.enclosure || (clutterCount >= 3 && bleedCount === 0);
  const sunEscaped = tr.fullyOutside || br.fullyOutside;

  // 四条原海报原则实时判定
  const pillars = {
    bleed: {
      ok: bleedCount >= 2 && tangentItems.length === 0 && !focalClipped && !sunEscaped,
      tag: focalClipped || sunEscaped
        ? "过切失认"
        : tangentItems.length > 0
          ? `擦边 ${tangentItems.length} 处`
          : bleedCount === 0
            ? "0 处出框"
            : bleedCount === 1
              ? "仅 1 处出框"
              : `${bleedCount} 处破框`,
    },
    breath: {
      ok: clutterCount === 0 && whitespacePct >= 48 && whitespacePct <= 86,
      tag: clutterCount > 0
        ? `堵块 ${clutterCount} 处`
        : whitespacePct < 48
          ? `留白仅 ${whitespacePct}%`
          : whitespacePct > 86
            ? `过空 ${whitespacePct}%`
            : `留白 ${whitespacePct}%`,
    },
    open: {
      ok: !geo.enclosure && bleedEdgeSet.size >= 2 && !allEdgesBlocked,
      tag: geo.enclosure
        ? "围栏锁死"
        : bleedEdgeSet.size < 2
          ? `仅敞 ${bleedEdgeSet.size} 边`
          : `${bleedEdgeSet.size} 边敞开`,
    },
    flow: {
      ok: geo.arrow.outward && pathBleeds && !focalClipped,
      tag: !geo.arrow.outward
        ? "内折闭环"
        : !pathBleeds
          ? "路径截断"
          : focalClipped
            ? "主角出框"
            : "外延贯通",
    },
  };

  const score = Object.values(pillars).filter((p) => p.ok).length;

  // 定性空间延展档位（绝不用假精确百分比）
  let tier = "局部透气（示意）";
  if (score === 4) tier = "豁然敞开（示意）";
  else if (geo.enclosure || bleedCount === 0) tier = "封闭闷塞（示意）";
  else if (focalClipped || sunEscaped) tier = "过切失认（示意）";
  else if (tangentItems.length > 0) tier = "擦边粘连（示意）";
  else if (tooCrowded) tier = "拥堵发闷（示意）";

  // 按严重优先级生成单真源白话诊断（覆盖 9 类错态 + 合法解说明）
  let diag;
  if (geo.enclosure) {
    diag = {
      code: "enclosure",
      status: "bad",
      shortTag: `${score}/4 · 围栏锁死`,
      headline: "四道粗重封闭围栏把视野锁死在画框里",
      why: "人眼一碰到四面闭合的硬边框，就会把画面当成装在盒子里的孤立标本，立刻停止想象画外还有什么——这已经滑回了 092 封闭式构图。",
      action: "直接点击画布四周的红色虚线「封闭围栏」把它拆掉（或点击下方「拆围栏」），先让四边敞开。",
    };
  } else if (focalClipped || sunEscaped) {
    diag = {
      code: "overcrop",
      status: "bad",
      shortTag: `${score}/4 · 过切失认`,
      headline: `破框推得过猛（${Math.round(geo.expansion * 100)}%），${sc.focalName}被边界切残`,
      why: "开放式构图切的是「外围延续元素」（太阳、山脚、道路、圆弧），核心识别主体必须完整留在呼吸区。一旦主角被裁掉一半，画面不再显得开阔，而像排版失误。",
      action: "在画布上向左横拖收回一点延展度（或把滑轨拉回 98%–118% 区间），把主角请回安全区内。",
    };
  } else if (tangentItems.length > 0) {
    const names = tangentItems.map((t) => t.label).join("、");
    diag = {
      code: "tangent",
      status: "bad",
      shortTag: `${score}/4 · 擦边切线`,
      headline: `${names}刚好贴边相切，产生刺眼的边缘粘连`,
      why: "排版与摄影最忌讳「犹犹豫豫的边界」：元素停在离画边 0–3% 的尴尬缝隙里，大脑拿不准你是想留边还是想裁切，视觉张力全卡在切点上。",
      action: "在画布上向右横拖再推深一点，让它果断穿出边框 20%–45%（或拖动太阳圆离开擦边红区）。",
    };
  } else if (bleedCount < 2) {
    diag = {
      code: "no_bleed",
      status: "bad",
      shortTag: `${score}/4 · ${bleedCount === 0 ? "零出框" : "破框不足"}`,
      headline: bleedCount === 0 ? "全部元素都蜷缩在画框内，没有任何外延" : `只有「${bleedingElements[0]}」一处出框，开放感撑不起来`,
      why: "当太阳、远山、海路都老实躲在画框里面时，观众看到的是一张完整收尾的小卡片，不会去脑补画外风景。需要至少 2 处外围元素果断破框，画框才会退化成一扇窗。",
      action: "在画布上向右横拖（或推高「破框延展度」到 98% 以上），让双日、远山与海岸路自然冲出右缘与底边。",
    };
  } else if (clutterCount > 0 || tooCrowded) {
    diag = {
      code: "crowded",
      status: "bad",
      shortTag: `${score}/4 · 留白 ${whitespacePct}%`,
      headline: clutterCount > 0 ? `角落残留 ${clutterCount} 处闷塞堵块，有效留白被压到 ${whitespacePct}%` : `有效留白只有 ${whitespacePct}%，画面发闷喘不过气`,
      why: "开放式构图靠「破框」打开出口，靠「大面积留白」提供空气。左上和底部被多余方盒塞满时，视线刚进画框就被堵死，轻盈感荡然无存。",
      action: clutterCount > 0 ? "直接点击画布上标红的闷塞堵块将它们逐一扫除，腾出 52%–82% 的晴空留白。" : "适当收回延展度或隐藏左下辅助圆，让晴空留白回到 50% 以上。",
    };
  } else if (tooEmpty) {
    diag = {
      code: "empty",
      status: "bad",
      shortTag: `${score}/4 · 过空 ${whitespacePct}%`,
      headline: `留白高到 ${whitespacePct}%，画面滑向苍白失锚`,
      why: "留白不是越空越好。当图形退得太稀薄、彼此失去呼应时，画面不再是开放的风景，而是没画完的白纸。",
      action: "开启左下蓝圆或略微调整延展度，让实景与留白重新形成舒展对照。",
    };
  } else if (!geo.arrow.outward || !pathBleeds) {
    diag = {
      code: "inward_flow",
      status: "bad",
      shortTag: `${score}/4 · ${!geo.arrow.outward ? "内折闭环" : "路径截断"}`,
      headline: !geo.arrow.outward ? `${sc.arrowName}折回画心打转，切断了画外想象` : `${sc.pathName}在底边前硬生生停住，没接上画外`,
      why: "光靠边角裁切还不够，视线需要一根「走向线索」领着往画外走。箭头往回勾，眼睛就会被拽回画面内部反复兜圈。",
      action: !geo.arrow.outward ? `直接点击画布上标红的内折${sc.arrowName}（或点「扳向外延」），让它划过云轮指向右上画外。` : "向右横拖推大一点延展度，让白色海岸路顺势滑出底边。",
    };
  } else {
    // 4/4 全部通过！识别属于哪一种经典风格解
    const styleNote = !geo.blueBottomLeft.active
      ? "极简一角留白解（类南宋马远「边角构图」：大面积晴空托起右侧延展）"
      : geo.expansion >= 1.12
        ? "双翼穿框广角解（多边果断破框，穿堂视野极具开阔感）"
        : "原海报海天平衡解（出框、留白、敞开与视线延续四项严丝合缝）";
    diag = {
      code: "ok",
      status: "ok",
      shortTag: `4/4 · ${bleedCount} 处破框`,
      headline: `开放式构图成立：${bleedCount} 处破框、${whitespacePct}% 晴空留白`,
      why: `当前为${styleNote}。四边无围栏阻隔，${bleedingElements.slice(0, 3).join("、")}等元素果断跨出边框，${sc.focalName}完整立于呼吸区，眼睛顺着${sc.arrowName}与${sc.pathName}自然飞向画外。`,
      action: "按 Space（或点「透视画外」）掀开画外世界幕布，看视线光流如何冲出边界；也可点右侧「试错」体验擦边切线与过度裁切。",
    };
  }

  return {
    geo,
    bleedCount,
    bleedingElements,
    bleedEdgeCount: bleedEdgeSet.size,
    bleedEdges: [...bleedEdgeSet],
    tangentItems,
    focalClipped,
    clutterCount,
    whitespacePct,
    pillars,
    score,
    tier,
    diag,
    expansionPct: Math.round(geo.expansion * 100),
  };
}
