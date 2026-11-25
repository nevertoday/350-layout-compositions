// 196 模块化网格 — 单真源模型
// 开场积木拼版台、01 跨格吃缝矩阵、02 格斯特纳 58 格解算器、04 基线×横缝咬合模型全部由此计算，绝不写死读数。

export const GRID_PRESETS = [
  { id: "4x3", cols: 4, rows: 3, label: "4×3 过粗" },
  { id: "6x4", cols: 6, rows: 4, label: "6×4 轻简" },
  { id: "8x6", cols: 8, rows: 6, label: "8×6 经典" },
  { id: "10x7", cols: 10, rows: 7, label: "10×7 精密" },
];

export const GUTTER_PRESETS = [
  { id: "none", frac: 0, label: "0 贴死" },
  { id: "tight", frac: 0.06, label: "偏窄" },
  { id: "ideal", frac: 0.16, label: "标准 16%" },
  { id: "wide", frac: 0.34, label: "过宽 34%" },
];

export const SCENE_THEMES = {
  poster: {
    id: "poster",
    label: "海报排布",
    en: "POSTER",
    blocks: {
      visual: { title: "未来生活节", sub: "06.01 — 06.07", tag: "主视觉" },
      text: { title: "用一个小单元", body: "横向与纵向建立统一尺度，跨格合并出秩序与呼吸。", tag: "正文块" },
      quote: { title: "“秩序是自由的骨架”", sub: "MODULAR SYSTEM", tag: "引用块" },
      data: { value: "68%", label: "视觉聚焦提升", tag: "数据块" },
      meta: { title: "探索 · 灵感", sub: "NO.196", tag: "徽章块" },
    },
  },
  card: {
    id: "card",
    label: "名片与卡片",
    en: "CARD",
    blocks: {
      visual: { title: "林予安", sub: "产品设计师", tag: "主视觉" },
      text: { title: "联系方式", body: "linyuan@design.co · 137 8888 9999 · design.co", tag: "正文块" },
      quote: { title: "“专注体验与系统思维”", sub: "SYSTEM DESIGN", tag: "引用块" },
      data: { value: "09年", label: "设计系统实践", tag: "数据块" },
      meta: { title: "上海 · 静安", sub: "CARD", tag: "徽章块" },
    },
  },
  dashboard: {
    id: "dashboard",
    label: "数据看板",
    en: "DASHBOARD",
    blocks: {
      visual: { title: "周活跃趋势", sub: "实时曲线 · 7 日", tag: "主视觉" },
      text: { title: "核心摘要", body: "各模块沿双轴基线对齐，多维度指标同屏可读不打架。", tag: "正文块" },
      quote: { title: "“先搭结构，再填数据”", sub: "KPI REPORT", tag: "引用块" },
      data: { value: "12,860", label: "总用户 +18.6%", tag: "数据块" },
      meta: { value: "72%", title: "活跃率", sub: "Q3", tag: "徽章块" },
    },
  },
};

// 5 块基础规格：weight 用于加权光学重心，minW/minH/minArea 用于内容适配真源校验
export const BLOCK_DEFS = [
  { id: "visual", role: "visual", name: "图像主视觉", tone: "plum", weight: 1.38, minW: 2, minH: 2, minArea: 4, minRatio: 0.48, maxRatio: 2.4 },
  { id: "text", role: "text", name: "文字信息块", tone: "tan", weight: 0.92, minW: 2, minH: 1, minArea: 3, minRatio: 0.5, maxRatio: 4.5 },
  { id: "quote", role: "quote", name: "引用模块", tone: "orange", weight: 1.24, minW: 2, minH: 1, minArea: 2, minRatio: 0.6, maxRatio: 4.5 },
  { id: "data", role: "data", name: "数据模块", tone: "cream", weight: 0.85, minW: 1, minH: 1, minArea: 2, minRatio: 0.35, maxRatio: 3.5 },
  { id: "meta", role: "meta", name: "点阵徽章", tone: "tan-dark", weight: 1.05, minW: 1, minH: 1, minArea: 1, minRatio: 0.35, maxRatio: 4.0 },
];

// 开场刻意停在 0/5 翻车错态：
// 1) visual 恰好跨过 8x6 画布中心 (4.0, 3.0)，确保任何从画布中心起拖都能抓到模块并重绘；
// 2) 全员脱格（半格偏移）、缝隙为 0、全员接近 1x1 豆腐块、正文/主图被挤扁、整体重心塌向左上角。
export function createBrokenState() {
  return {
    cols: 8,
    rows: 6,
    gutterFrac: 0,
    snap: false,
    scene: "poster",
    selectedId: "visual",
    blocks: [
      { id: "visual", x: 3.36, y: 2.38, w: 1.32, h: 1.24 },
      { id: "text", x: 0.24, y: 0.22, w: 1.18, h: 1.08 },
      { id: "quote", x: 1.48, y: 0.34, w: 1.12, h: 1.04 },
      { id: "data", x: 0.32, y: 1.42, w: 1.06, h: 1.05 },
      { id: "meta", x: 1.54, y: 1.56, w: 1.05, h: 1.02 },
    ],
  };
}

// 一组正当参考解（不同粒度下动态生成，绝非唯一解；用户自己拼出其他合规格局照样 5/5 过关）
export function createReferenceBlocks(cols, rows) {
  if (cols === 6 && rows === 4) {
    return [
      { id: "visual", x: 0, y: 0, w: 3, h: 3 },
      { id: "text", x: 3, y: 0, w: 3, h: 2 },
      { id: "data", x: 3, y: 2, w: 2, h: 1 },
      { id: "quote", x: 0, y: 3, w: 3, h: 1 },
      { id: "meta", x: 5, y: 2, w: 1, h: 2 },
    ];
  }
  if (cols === 10 && rows === 7) {
    return [
      { id: "visual", x: 0, y: 0, w: 5, h: 4 },
      { id: "text", x: 5, y: 0, w: 5, h: 2 },
      { id: "quote", x: 5, y: 2, w: 3, h: 2 },
      { id: "data", x: 8, y: 2, w: 2, h: 3 },
      { id: "meta", x: 1, y: 5, w: 4, h: 2 },
    ];
  }
  if (cols === 4 && rows === 3) {
    return [
      { id: "visual", x: 0, y: 0, w: 2, h: 2 },
      { id: "text", x: 2, y: 0, w: 2, h: 2 },
      { id: "quote", x: 0, y: 2, w: 2, h: 1 },
      { id: "data", x: 2, y: 2, w: 1, h: 1 },
      { id: "meta", x: 3, y: 2, w: 1, h: 1 },
    ];
  }
  // 默认 8×6 经典瑞士非对称模块化格局（留白约 25%，重心稳在中心附近）
  return [
    { id: "visual", x: 0, y: 0, w: 4, h: 4 },
    { id: "text", x: 4, y: 0, w: 4, h: 2 },
    { id: "quote", x: 4, y: 2, w: 2, h: 2 },
    { id: "data", x: 6, y: 2, w: 2, h: 2 },
    { id: "meta", x: 1, y: 4, w: 3, h: 1 },
  ];
}

export function clampBlocksToGrid(blocks, cols, rows, snap) {
  return blocks.map((b) => {
    let w = Math.max(1, Math.min(cols, b.w));
    let h = Math.max(1, Math.min(rows, b.h));
    let x = Math.max(0, Math.min(cols - w, b.x));
    let y = Math.max(0, Math.min(rows - h, b.y));
    if (snap) {
      w = Math.max(1, Math.min(cols, Math.round(w)));
      h = Math.max(1, Math.min(rows, Math.round(h)));
      x = Math.max(0, Math.min(cols - w, Math.round(x)));
      y = Math.max(0, Math.min(rows - h, Math.round(y)));
    }
    return { ...b, x, y, w, h };
  });
}

// 计算矩形交集
function rectIntersect(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const w = x2 - x1;
  const h = y2 - y1;
  if (w <= 0.04 || h <= 0.04) return null;
  return { x: x1, y: y1, w, h, area: w * h };
}

// 精确计算所有块的并集占位面积（采用细网格采样：每个格子拆 4×4 子点，100% 精确处理浮点脱格与重叠）
function computeUnionCoverage(blocks, cols, rows) {
  const sub = 4;
  const nx = cols * sub;
  const ny = rows * sub;
  let covered = 0;
  for (let iy = 0; iy < ny; iy++) {
    const py = (iy + 0.5) / sub;
    for (let ix = 0; ix < nx; ix++) {
      const px = (ix + 0.5) / sub;
      for (let k = 0; k < blocks.length; k++) {
        const b = blocks[k];
        if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
          covered++;
          break;
        }
      }
    }
  }
  return covered / (nx * ny);
}

// 统一坐标系换算：把网格矩阵居中放入给定画布区域，强制 1:1 正方形单元 X × X，绝不压扁变形！
export function computeMatrixGeometry(canvasW, canvasH, cols, rows, gutterFrac, pad = {}) {
  const padL = pad.left ?? 44;
  const padR = pad.right ?? 18;
  const padT = pad.top ?? 38;
  const padB = pad.bottom ?? 22;
  const availW = Math.max(60, canvasW - padL - padR);
  const availH = Math.max(60, canvasH - padT - padB);
  const denomX = cols + (cols - 1) * gutterFrac;
  const denomY = rows + (rows - 1) * gutterFrac;
  const cell = Math.min(availW / denomX, availH / denomY);
  const gutter = cell * gutterFrac;
  const matrixW = denomX * cell;
  const matrixH = denomY * cell;
  const ox = padL + (availW - matrixW) / 2;
  const oy = padT + (availH - matrixH) / 2;
  const step = cell + gutter;
  return { ox, oy, cell, gutter, step, matrixW, matrixH, cols, rows };
}

export function blockToRect(b, geom) {
  const x = geom.ox + b.x * geom.step;
  const y = geom.oy + b.y * geom.step;
  const w = b.w * geom.cell + Math.max(0, b.w - 1) * geom.gutter;
  const h = b.h * geom.cell + Math.max(0, b.h - 1) * geom.gutter;
  return { x, y, w, h };
}

// 单真源全面诊断：所有 5 项模块化原则 + 9 类错态 + 实测数值 + 操作建议
export function evaluateLayout(state) {
  const { cols, rows, gutterFrac, blocks } = state;
  const totalCells = cols * rows;
  const defMap = Object.fromEntries(BLOCK_DEFS.map((d) => [d.id, d]));

  // 1. 脱格与越界
  const blockIssues = {};
  let maxOff = 0;
  let offGridCount = 0;
  let outOfBoundsCount = 0;

  for (const b of blocks) {
    const dx = Math.abs(b.x - Math.round(b.x));
    const dy = Math.abs(b.y - Math.round(b.y));
    const dw = Math.abs(b.w - Math.round(b.w));
    const dh = Math.abs(b.h - Math.round(b.h));
    const off = Math.max(dx, dy, dw, dh);
    if (off > maxOff) maxOff = off;
    const isOff = off > 0.06;
    if (isOff) offGridCount++;
    const oob = b.x < -0.02 || b.y < -0.02 || b.x + b.w > cols + 0.02 || b.y + b.h > rows + 0.02;
    if (oob) outOfBoundsCount++;
    blockIssues[b.id] = { off, isOff, oob, overlap: false, fitProblem: null };
  }

  // 2. 重叠检测
  const overlaps = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const inter = rectIntersect(blocks[i], blocks[j]);
      if (inter) {
        overlaps.push({ a: blocks[i].id, b: blocks[j].id, ...inter });
        blockIssues[blocks[i].id].overlap = true;
        blockIssues[blocks[j].id].overlap = true;
      }
    }
  }
  const hasOverlap = overlaps.length > 0;

  // 3. 原则① 系统化（对齐与无碰撞）
  const p1Ok = offGridCount === 0 && outOfBoundsCount === 0 && !hasOverlap;
  let p1Badge = "严咬交点";
  if (hasOverlap) p1Badge = `撞车 ${overlaps.length} 处`;
  else if (outOfBoundsCount > 0) p1Badge = "越出边线";
  else if (offGridCount > 0) p1Badge = `脱格 +${maxOff.toFixed(2)}X`;

  // 4. 原则② 可重复（统一缝隙 + 合理矩阵粒度）
  const coarseGrid = cols * rows <= 12; // 4×3 = 12 格偏粗
  const gutterTooTight = gutterFrac < 0.09;
  const gutterTooWide = gutterFrac > 0.25;
  const p2Ok = !gutterTooTight && !gutterTooWide && !coarseGrid;
  let p2Badge = `缝 ${Math.round(gutterFrac * 100)}%X`;
  if (gutterFrac === 0) p2Badge = "0 缝粘连";
  else if (gutterTooTight) p2Badge = `缝偏窄 ${Math.round(gutterFrac * 100)}%`;
  else if (gutterTooWide) p2Badge = `宽缝散架 ${Math.round(gutterFrac * 100)}%`;
  else if (coarseGrid) p2Badge = `${cols}×${rows} 偏粗`;

  // 5. 原则③ 灵活组合（跨格层级与面积跨比）
  const areas = blocks.map((b) => b.w * b.h);
  const maxArea = Math.max(...areas);
  const minArea = Math.max(0.25, Math.min(...areas));
  const areaRatio = maxArea / minArea;
  const distinctSpecs = new Set(blocks.map((b) => `${Math.round(b.w)}x${Math.round(b.h)}`)).size;
  const maxShare = maxArea / totalCells;
  const visualBlock = blocks.find((b) => b.id === "visual");
  const visualArea = visualBlock ? visualBlock.w * visualBlock.h : 0;

  const flatUniform = areaRatio < 1.95 || distinctSpecs < 2;
  const monopoly = maxShare > 0.56;
  const p3Ok = !flatUniform && !monopoly && !hasOverlap && maxArea >= 4;
  let p3Badge = `跨比 ${areaRatio.toFixed(1)}×`;
  if (hasOverlap) p3Badge = "重叠失序";
  else if (flatUniform) p3Badge = `平权 ${areaRatio.toFixed(1)}×`;
  else if (monopoly) p3Badge = `独大 ${Math.round(maxShare * 100)}%`;
  else if (maxArea < 4) p3Badge = "缺大主块";

  // 6. 原则④ 内容适配（每块面积与比例符合内容物理载体要求）
  const fitFailures = [];
  for (const b of blocks) {
    const def = defMap[b.id];
    const area = b.w * b.h;
    const ratio = b.w / Math.max(0.2, b.h);
    let prob = null;
    if (b.id === "visual") {
      if (b.w < def.minW - 0.05 || b.h < def.minH - 0.05 || area < def.minArea - 0.1) prob = "主图挤扁";
      else if (ratio < def.minRatio || ratio > def.maxRatio) prob = "画幅过扁";
    } else if (b.id === "text") {
      if (b.w < def.minW - 0.05) prob = "窄条断行";
      else if (area < def.minArea - 0.1) prob = "字行挤扁";
      else if (ratio < def.minRatio) prob = "竖条断行";
    } else if (b.id === "quote") {
      if (b.w < def.minW - 0.05 || area < def.minArea - 0.1) prob = "引文折碎";
    } else if (b.id === "data") {
      if (area < def.minArea - 0.1) prob = "数字挤爆";
    } else if (b.id === "meta") {
      if (visualArea > 0 && area > visualArea * 1.05 && area >= 4) prob = "喧宾夺主";
    }
    if (prob) {
      blockIssues[b.id].fitProblem = prob;
      fitFailures.push({ id: b.id, name: def.name, prob });
    }
  }
  const p4Ok = fitFailures.length === 0;
  let p4Badge = "载体合身";
  if (fitFailures.length > 0) p4Badge = `${fitFailures[0].prob} (${fitFailures.length})`;

  // 7. 原则⑤ 视觉平衡（占位留白 + 加权光学重心）
  const coverage = computeUnionCoverage(blocks, cols, rows);
  const whitespace = 1 - coverage;
  let sumW = 0;
  let sumWx = 0;
  let sumWy = 0;
  for (const b of blocks) {
    const def = defMap[b.id];
    const wgt = b.w * b.h * def.weight;
    const bx = (b.x + b.w / 2) / cols;
    const by = (b.y + b.h / 2) / rows;
    sumW += wgt;
    sumWx += wgt * bx;
    sumWy += wgt * by;
  }
  const gx = sumW > 0 ? sumWx / sumW : 0.5;
  const gy = sumW > 0 ? sumWy / sumW : 0.5;
  const centerDist = Math.hypot(gx - 0.5, gy - 0.5);

  const tooCrowded = whitespace < 0.12;
  const tooSparse = whitespace > 0.54;
  const offBalance = centerDist > 0.175;
  const p5Ok = !hasOverlap && !tooCrowded && !tooSparse && !offBalance;
  let p5Badge = `留白 ${Math.round(whitespace * 100)}%`;
  if (hasOverlap) p5Badge = "模块相撞";
  else if (offBalance) p5Badge = `重心偏 ${Math.round(centerDist * 100)}%`;
  else if (tooCrowded) p5Badge = `满版 ${Math.round(coverage * 100)}%`;
  else if (tooSparse) p5Badge = `过稀 ${Math.round(coverage * 100)}%`;

  const principles = [
    { id: 1, key: "system", title: "系统化", ok: p1Ok, badge: p1Badge, desc: "建立统一的模块尺寸，形成可拓展的设计系统。" },
    { id: 2, key: "repeat", title: "可重复", ok: p2Ok, badge: p2Badge, desc: "单元可横向、纵向重复，确保一致性与效率。" },
    { id: 3, key: "combine", title: "灵活组合", ok: p3Ok, badge: p3Badge, desc: "多个模块可组合成不同内容块，适配多样需求。" },
    { id: 4, key: "adapt", title: "内容适配", ok: p4Ok, badge: p4Badge, desc: "文本、图像、图标等内容可在模块内自由排布。" },
    { id: 5, key: "balance", title: "视觉平衡", ok: p5Ok, badge: p5Badge, desc: "依靠网格对齐与间距，实现节奏与层级的平衡。" },
  ];

  const score = principles.filter((p) => p.ok).length;

  // 生成高优先级白话诊断（讲清现象 + 视觉原因 + 下一步具体动作）
  let diag = {
    code: "ok",
    tag: `秩序成立 (${score}/5)`,
    headline: "小单元立住规矩，大跨格撑出节奏",
    why: `5 块内容严丝合缝咬在 ${cols}×${rows} 模数交点上，统一 ${Math.round(gutterFrac * 100)}%X 缝隙隔出呼吸；最大与最小模块跨比 ${areaRatio.toFixed(1)}×，视线先落主视觉再顺读文图，留白 ${Math.round(whitespace * 100)}% 恰好透气。`,
    action: "你已经搭出一套合法解——试试换一种非对称摆法，或切到「名片 / 看板」看同一套骨架怎么装不同内容。",
    severity: "ok",
  };

  if (hasOverlap) {
    diag = {
      code: "overlap",
      tag: `错态 · 重叠撞车 (${score}/5)`,
      headline: `有 ${overlaps.length} 处模块互相压叠，网格边界被踩破`,
      why: "模块化网格的底层约定是「每格有主、以缝分界」。两块内容互相吃进对方领地时，读者分不清哪段文字配哪张图，整套矩阵瞬间退化成随意叠纸。",
      action: "把画布上带红斜线的撞车模块拖开到空位，或拖它右下角手柄缩小 1 格腾出边界。",
      severity: "error",
    };
  } else if (offGridCount > 0 || outOfBoundsCount > 0) {
    diag = {
      code: "offgrid",
      tag: `错态 · 脱格散架 (${score}/5)`,
      headline: `${offGridCount} 块模块悬在半格缝里，最大脱格 ${maxOff.toFixed(2)}X`,
      why: "人眼极其擅长沿横竖直线扫视对齐。哪怕只差 0.2 格，上下左右四条隐形参考线就全对不上号，版面看起来就像贴歪的便利贴。",
      action: "点「网格吸附：关」打开并归格，再把缝隙切到「标准 16%」、拖大主视觉跨格。",
      severity: "error",
    };
  } else if (gutterFrac === 0) {
    diag = {
      code: "zero-gutter",
      tag: `错态 · 零缝粘连 (${score}/5)`,
      headline: "模块缝隙为 0%，所有色块糊成一整坨",
      why: "没有缝隙（gutter）隔开相邻模块，大脑会按「接近性原则」把不同内容强行看成同一块，层级边界彻底消失。",
      action: "把上方「缝隙」切到「标准 16%」（经验参考带 10%–24%X），给横竖交界留出统一气口。",
      severity: "error",
    };
  } else if (gutterTooTight) {
    diag = {
      code: "tight-gutter",
      tag: `错态 · 窄缝互咬 (${score}/5)`,
      headline: `缝隙仅 ${Math.round(gutterFrac * 100)}%X，紧挨的文字与色块快粘住了`,
      why: "模块缝隙比正文行距还窄时，眼睛读完左块会误跳进右块，上下模块之间也缺少喘气通道。",
      action: "将缝隙切到「标准 16%」（经验带 10%–24%X），让每一块边界清清楚楚。",
      severity: "error",
    };
  } else if (gutterTooWide) {
    diag = {
      code: "wide-gutter",
      tag: `错态 · 宽缝散架 (${score}/5)`,
      headline: `缝隙撑到了 ${Math.round(gutterFrac * 100)}%X，页面裂成彼此无关的孤岛`,
      why: "缝隙超过基础模块宽度的四分之一后，空白河道比模块本身还抢眼，读者不再觉得它们属于同一张版面。",
      action: "把缝隙收回「标准 16%」，让缝隙退居幕后、只做安静的节奏刻度。",
      severity: "error",
    };
  } else if (coarseGrid) {
    diag = {
      code: "coarse-grid",
      tag: `错态 · 粒度过粗 (${score}/5)`,
      headline: `仅 ${cols}×${rows} 共 ${totalCells} 格，模块施展不开手脚`,
      why: "格子切得太粗时，5 块内容几乎没有跨格搭配的余地，不是挤成一排，就是被迫切成同样大小的块。",
      action: "把矩阵粒度切回「8×6 经典」或「6×4 轻简」，再拉大主视觉跨格。",
      severity: "error",
    };
  } else if (flatUniform) {
    diag = {
      code: "flat",
      tag: `错态 · 平权豆腐块 (${score}/5)`,
      headline: `最大与最小块跨比仅 ${areaRatio.toFixed(1)}×，五块一样大没主次`,
      why: "很多新手以为「模块化 = 切成一样大的方格子」。但人人平权等于无人领衔，视线扫过整张纸找不到第一个落脚点。",
      action: "选中深茄色「图像主视觉」，拖它右下角橘色手柄（或按跨格键）拉成 4×3 或 4×4，让面积跨比 ≥ 2.0×。",
      severity: "error",
    };
  } else if (monopoly) {
    diag = {
      code: "monopoly",
      tag: `错态 · 单块独大 (${score}/5)`,
      headline: `单块占去 ${Math.round(maxShare * 100)}% 矩阵，其余模块被挤到墙根`,
      why: "一个巨无霸模块吃掉大半版面，剩余模块只能塞成零碎边角料，模块化原本的多区均衡彻底失灵。",
      action: "把最大块缩小一两格（占总格数 ≤ 55%），把空间还给文字与数据块。",
      severity: "error",
    };
  } else if (fitFailures.length > 0) {
    const f = fitFailures[0];
    const reasons = {
      "主图挤扁": "图像主视觉只有 1 格多，缩成邮票大小根本撑不起视觉锚点——把它拉宽拉高到至少 2×2（≥ 4 格）。",
      "画幅过扁": "图像块拉得太细长，画面主体被裁切变形——把它的宽和高收回到更舒适的矩形比例。",
      "窄条断行": "文字信息块宽度只有 1 格，每行只能塞下三五个字，眼睛被迫疯狂折返——至少拉宽到 2 格以上。",
      "竖条断行": "文字块拉成了极细长的竖条，阅读节奏被频繁换行打碎——拉宽列数、减点行数。",
      "字行挤扁": "正文信息块总面积不足 3 格，段落装不下被强行截断——至少给它 2×2 或 3×1 的容身之所。",
      "引文折碎": "引用模块宽度不到 2 格，一句短话被折成四五截——横跨至少 2 格承托整句。",
      "数字挤爆": "数据指标需要留出大号数字与说明的空间，1 格太促狭——扩到至少 2 格（如 2×1 或 2×2）。",
      "喧宾夺主": "辅助徽章块比主视觉还大，抢走了第一视线——把徽章块缩小，把大面积留给主角。",
    };
    diag = {
      code: "fit",
      tag: `错态 · ${f.prob} (${score}/5)`,
      headline: `「${f.name}」的格数比例配不上它装的内容`,
      why: reasons[f.prob] || "内容类型和模块尺寸不匹配。",
      action: `选中「${f.name}」，拖它的右下角缩放柄（或用画布下方跨格快调）调整到合身尺寸。`,
      severity: "error",
    };
  } else if (tooCrowded) {
    diag = {
      code: "crowded",
      tag: `错态 · 满版窒息 (${score}/5)`,
      headline: `占位率高达 ${Math.round(coverage * 100)}%，几乎没留呼吸白`,
      why: "把矩阵里每一格都填满并不会显得充实，反而会让所有边缘相互顶撞。适度空置的模块格本身就是视觉停顿。",
      action: "把一两块非主视觉模块缩窄 1 格，腾出 14%–48% 的经验留白带。",
      severity: "error",
    };
  } else if (tooSparse) {
    diag = {
      code: "sparse",
      tag: `错态 · 稀疏散落 (${score}/5)`,
      headline: `占位率只有 ${Math.round(coverage * 100)}%，整张网格空荡荡撑不起来`,
      why: "模块太小、散落在广阔空白里时，横竖网格隐形骨架难以被大脑补全，模块之间的呼应关系断开。",
      action: "适当拉大主视觉或正文块的跨格数，让整体占位落在 48%–86% 的紧凑舒适带。",
      severity: "error",
    };
  } else if (offBalance) {
    const dirX = gx < 0.42 ? "偏左" : gx > 0.58 ? "偏右" : "";
    const dirY = gy < 0.42 ? "偏上" : gy > 0.58 ? "偏下" : "";
    diag = {
      code: "imbalance",
      tag: `错态 · 重心塌角 (${score}/5)`,
      headline: `画面加权视觉重心${dirX}${dirY}（偏离 ${Math.round(centerDist * 100)}%），另一侧大片空荒`,
      why: "大块深茄与橘色模块全堆在同一侧时，整张版面像翘起一边的托盘。不对称依然需要重量平衡——大块在一边，另一边要用多块小模块或深色块把力矩拉住。",
      action: "把一部分模块往空白那侧挪动，把画布上的橘色光学重心圆环拉回中央虚线平衡框内。",
      severity: "error",
    };
  }

  return {
    score,
    total: 5,
    principles,
    diag,
    metrics: {
      cols,
      rows,
      totalCells,
      gutterPct: Math.round(gutterFrac * 100),
      maxOff,
      offGridCount,
      overlapCount: overlaps.length,
      areaRatio,
      maxArea,
      minArea,
      distinctSpecs,
      coverage,
      whitespace,
      gx,
      gy,
      centerDist,
    },
    overlaps,
    blockIssues,
  };
}

// ---------- 01 节：跨格合并吃缝公式 ----------
export function computeSpanFormula(spanW, spanH, unitPx = 64, gutterPx = 12) {
  const totalW = spanW * unitPx + (spanW - 1) * gutterPx;
  const totalH = spanH * unitPx + (spanH - 1) * gutterPx;
  const eatenGutterX = Math.max(0, spanW - 1);
  const eatenGutterY = Math.max(0, spanH - 1);
  return {
    spanW,
    spanH,
    cells: spanW * spanH,
    totalW,
    totalH,
    eatenGutterX,
    eatenGutterY,
    formulaW: `${spanW}×${unitPx} + ${eatenGutterX}×${gutterPx} = ${totalW}px`,
    formulaH: `${spanH}×${unitPx} + ${eatenGutterY}×${gutterPx} = ${totalH}px`,
  };
}

// ---------- 02 节：格斯特纳 58 单位活动网格数学解算器 ----------
export function solveGerstnerGrid(totalUnits, cols, gutterUnits = 2) {
  const totalGutter = (cols - 1) * gutterUnits;
  const usable = totalUnits - totalGutter;
  const colWidth = Math.floor(usable / cols);
  const remainder = usable - colWidth * cols;
  const exact = remainder === 0 && colWidth > 0;
  return {
    totalUnits,
    cols,
    gutterUnits,
    totalGutter,
    colWidth,
    remainder,
    exact,
    equation: exact
      ? `${cols} 栏 × ${colWidth} 格 + ${cols - 1} 缝 × ${gutterUnits} 格 = ${totalUnits} 格（严丝合缝）`
      : `${cols} 栏 × ${colWidth} 格 + ${cols - 1} 缝 × ${gutterUnits} 格 = ${totalUnits - remainder} 格（余 ${remainder} 格错位）`,
  };
}

// ---------- 04 节：基线行距 × 横模块咬合模型 ----------
export function evaluateBaselineLock(linesPerModule, gutterLines, lineHeightPx = 22) {
  const modH = linesPerModule * lineHeightPx;
  const gutH = gutterLines * lineHeightPx;
  // 左侧主图跨 2 个横模块（包含 1 道横缝）
  const span2Height = 2 * modH + gutH;
  // 右侧第 2 个模块起点距离顶部的行数
  const row2StartLines = linesPerModule + gutterLines;
  const phaseFrac = Math.abs(row2StartLines - Math.round(row2StartLines));
  const locked = phaseFrac < 0.01;
  // 若按整行基线强行排版，右侧第 2 块正文末行与左侧跨 2 块主图底边的真实像素错位
  const snappedRow2Lines = Math.ceil(row2StartLines);
  const snappedBottomLines = snappedRow2Lines + linesPerModule;
  const idealBottomLines = 2 * linesPerModule + gutterLines;
  const driftLines = snappedBottomLines - idealBottomLines;
  const driftPx = Math.round(driftLines * lineHeightPx);
  return {
    linesPerModule,
    gutterLines,
    lineHeightPx,
    modH,
    gutH,
    span2Height,
    row2StartLines,
    locked,
    driftLines,
    driftPx,
    formula: `2 块高 = 2 × ${linesPerModule} 行 + ${gutterLines} 行缝 = ${idealBottomLines} 行（${Math.round(span2Height)}px）`,
  };
}
