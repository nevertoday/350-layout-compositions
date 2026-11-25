import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  HERO_ITEMS,
  POLICY_META,
  createInitialHeroState,
  createReferenceHeroState,
  measureHeroDom,
  normFromWidth,
  railBounds,
  solveFlex1D,
  widthFromNorm,
} from "./model.js";

// ==================== 装饰点阵（5×7 原海报左柱点阵 & 5×4 底圆点阵） ====================
function mountDotGrid(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) frag.append(document.createElement("i"));
  el.append(frag);
}
mountDotGrid("hero-dots", 35);
mountDotGrid("motto-dots", 20);

// ==================== HERO：一维弹轨工坊 ====================
const heroStage = document.getElementById("hero-stage");
const heroTrack = document.getElementById("hero-track");
const heroFlex = document.getElementById("hero-flex");
const heroHandle = document.getElementById("hero-rail-handle");
const heroHandlePx = document.getElementById("hero-handle-px");
const heroWidthRead = document.getElementById("hero-width-read");
const heroAxisMain = document.getElementById("hero-axis-main");
const heroAxisCross = document.getElementById("hero-axis-cross");
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const roWrap = document.getElementById("hero-readout");
const roBadge = document.getElementById("ro-badge");
const roCss = document.getElementById("ro-css");
const roTitle = document.getElementById("ro-title");
const roDetail = document.getElementById("ro-detail");

const heroItemEls = Object.fromEntries(
  HERO_ITEMS.map((m) => [m.id, heroFlex.querySelector(`[data-item="${m.id}"]`)])
);
const heroSlotEls = Object.fromEntries(
  HERO_ITEMS.map((m) => [m.id, document.querySelector(`[data-slot="${m.id}"]`)])
);
const heroPxEls = Object.fromEntries(
  HERO_ITEMS.map((m) => [m.id, document.querySelector(`[data-px="${m.id}"]`)])
);
const pillarEls = Object.fromEntries(
  [...document.querySelectorAll("[data-pillar]")].map((el) => [el.dataset.pillar, el])
);

let heroState = createInitialHeroState();
let naturalSizes = {};
let lastMeasure = null;
let introProgress = reducedMotion.matches ? 1 : 0;
let needsRedraw = true;

function measureNaturalSizes() {
  // 临时按 lock/auto 测定每项在当前字号断点下的真实自然尺寸
  const prevStyles = {};
  for (const m of HERO_ITEMS) {
    const el = heroItemEls[m.id];
    prevStyles[m.id] = el.getAttribute("data-policy");
    el.setAttribute("data-policy", "lock");
    if (m.id === "search") {
      el.style.flex = "0 0 auto";
      el.style.minWidth = "auto";
    }
  }
  const prevW = heroFlex.style.width;
  const prevDir = heroFlex.style.flexDirection;
  const prevAi = heroFlex.style.alignItems;
  const prevWrap = heroFlex.style.flexWrap;
  heroFlex.style.width = "max-content";
  heroFlex.style.flexDirection = "row";
  heroFlex.style.alignItems = "flex-start";
  heroFlex.style.flexWrap = "nowrap";

  for (const m of HERO_ITEMS) {
    const r = heroItemEls[m.id].getBoundingClientRect();
    naturalSizes[m.id] = { w: Math.round(r.width), h: Math.round(r.height) };
  }

  heroFlex.style.width = prevW;
  heroFlex.style.flexDirection = prevDir;
  heroFlex.style.alignItems = prevAi;
  heroFlex.style.flexWrap = prevWrap;
  for (const m of HERO_ITEMS) {
    const el = heroItemEls[m.id];
    if (m.id === "search") {
      el.style.flex = "";
      el.style.minWidth = "";
    }
    if (prevStyles[m.id]) el.setAttribute("data-policy", prevStyles[m.id]);
  }
}

function applyHeroDom() {
  // 先收窄容器宽再读轨道真实可用宽，避免旧宽度撑大 grid 栏宽导致测量失真
  heroFlex.style.width = "160px";
  const trackW = heroTrack.clientWidth || 320;
  const targetW = widthFromNorm(heroState.widthNorm, trackW);
  const { minPx, maxPx } = railBounds(trackW);

  heroFlex.style.width = `${targetW}px`;
  heroFlex.style.flexDirection = heroState.direction;
  heroFlex.style.alignItems = heroState.alignItems;
  heroFlex.style.flexWrap = heroState.wrap;
  heroFlex.classList.toggle("is-column", heroState.direction === "column");

  heroHandle.setAttribute("aria-valuemin", String(minPx));
  heroHandle.setAttribute("aria-valuemax", String(maxPx));
  heroHandle.setAttribute("aria-valuenow", String(targetW));
  heroHandlePx.textContent = String(targetW);
  heroWidthRead.textContent = `容器 ${targetW}px`;

  if (heroState.direction === "row") {
    heroAxisMain.textContent = "主轴方向 / MAIN AXIS →";
    heroAxisCross.textContent = "交叉轴 ↕";
  } else {
    heroAxisMain.textContent = "交叉轴 / CROSS AXIS →";
    heroAxisCross.textContent = "主轴 ↓";
  }

  for (const m of HERO_ITEMS) {
    const pol = heroState.policies[m.id];
    const el = heroItemEls[m.id];
    el.setAttribute("data-policy", pol);
    el.setAttribute("aria-pressed", String(heroState.selectedId === m.id));
    el.title = `${m.code} ${m.label}（当前：${POLICY_META[pol].name} · 点击切换）`;
    heroSlotEls[m.id].classList.toggle("is-focus", heroState.selectedId === m.id);
    for (const pill of heroSlotEls[m.id].querySelectorAll("[data-policy]")) {
      pill.setAttribute("aria-pressed", String(pill.dataset.policy === pol));
    }
  }

  document.querySelectorAll("[data-dir]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.dir === heroState.direction))
  );
  document.querySelectorAll("[data-align]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.align === heroState.alignItems))
  );
  document.querySelectorAll("[data-wrap]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.wrap === heroState.wrap))
  );

  // 立即实测真实 DOM 盒模型
  const m = measureHeroDom(heroFlex, heroItemEls, naturalSizes, heroState);
  lastMeasure = m;

  heroFlex.classList.toggle("is-overflow", m.overflowPx > 2);

  for (const it of m.items) {
    const sign = it.deltaPx > 2 ? `+${it.deltaPx}` : it.deltaPx < -2 ? `${it.deltaPx}` : "±0";
    heroPxEls[it.id].textContent = `${it.mainPx}px (${sign})`;
  }

  roWrap.dataset.status = m.verdict.status;
  roBadge.textContent = m.verdict.badge;
  roCss.textContent = `display: flex; flex-direction: ${heroState.direction}; align-items: ${heroState.alignItems}; flex-wrap: ${heroState.wrap};`;
  roTitle.textContent = m.verdict.title;
  roDetail.textContent = m.verdict.detail;

  for (const [k, ok] of Object.entries(m.healthyFlags)) {
    if (pillarEls[k]) pillarEls[k].classList.toggle("is-ok", ok);
  }

  needsRedraw = true;
}

function drawHeroXray(progress) {
  if (!lastMeasure) return;
  const dpr = pixelRatio(2);
  const w = heroTrack.clientWidth;
  const h = heroTrack.clientHeight;
  if (w < 10 || h < 10) return;

  if (heroCanvas.width !== Math.round(w * dpr) || heroCanvas.height !== Math.round(h * dpr)) {
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
  }

  const ctx = heroCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const trackRect = heroTrack.getBoundingClientRect();
  const boxRect = heroFlex.getBoundingClientRect();
  const ox = boxRect.left - trackRect.left;
  const oy = boxRect.top - trackRect.top;
  const bw = boxRect.width;
  const bh = boxRect.height;

  const p = Math.max(0.15, Math.min(1, progress));
  const isRow = heroState.direction === "row";

  // 1. 双向主轴与交叉轴朱红箭头（复刻原海报，随 flex-direction 真实旋转 90°）
  ctx.save();
  ctx.strokeStyle = "#E73E12";
  ctx.fillStyle = "#E73E12";
  ctx.lineWidth = 1.6;

  const drawDoubleArrow = (x1, y1, x2, y2, color) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 12) return;
    const ux = dx / len;
    const uy = dy / len;
    const ex = x1 + dx * p;
    const ey = y1 + dy * p;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    const ah = 5.5;
    const aw = 3.5;
    // 起点箭翼
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * ah - uy * aw, y1 + uy * ah + ux * aw);
    ctx.lineTo(x1 + ux * ah + uy * aw, y1 + uy * ah - ux * aw);
    ctx.closePath();
    ctx.fill();
    // 终点箭翼
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * ah - uy * aw, ey - uy * ah + ux * aw);
    ctx.lineTo(ex - ux * ah + uy * aw, ey - uy * ah - ux * aw);
    ctx.closePath();
    ctx.fill();
  };

  const mainColor = "#E73E12";
  const crossColor = "#5A5349";
  drawDoubleArrow(ox + 2, oy - 11, ox + bw - 2, oy - 11, isRow ? mainColor : crossColor);
  drawDoubleArrow(ox - 10, oy + 2, ox - 10, oy + bh - 2, isRow ? crossColor : mainColor);

  // 2. 正剩余空间斜纹（行模式下未分配尾部空白）
  if (isRow && lastMeasure.freeSpacePx > 10 && lastMeasure.overflowPx <= 1) {
    const fx = ox + bw - lastMeasure.padR - lastMeasure.freeSpacePx;
    const fy = oy + lastMeasure.padT;
    const fw = lastMeasure.freeSpacePx;
    const fh = bh - lastMeasure.padT - lastMeasure.padB;
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();
    ctx.fillStyle = "rgba(17, 17, 17, 0.045)";
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = "rgba(17, 17, 17, 0.16)";
    ctx.lineWidth = 1;
    for (let s = -fh; s < fw + fh; s += 8) {
      ctx.beginPath();
      ctx.moveTo(fx + s, fy + fh);
      ctx.lineTo(fx + s + fh, fy);
      ctx.stroke();
    }
    ctx.restore();
    if (fw > 46) {
      ctx.fillStyle = "#4F4A42";
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(`+${lastMeasure.freeSpacePx}px`, fx + fw / 2, fy + fh / 2 + 4);
    }
  }

  // 3. 溢出红斜纹警示区（真实 DOM 刺穿虚线边界时高亮）
  if (isRow && lastMeasure.overflowPx > 2) {
    const rx = ox + bw;
    const rw = Math.min(lastMeasure.overflowPx + 4, w - rx - 2);
    if (rw > 4) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, oy, rw, bh);
      ctx.clip();
      ctx.fillStyle = "rgba(231, 62, 18, 0.16)";
      ctx.fillRect(rx, oy, rw, bh);
      ctx.strokeStyle = "rgba(231, 62, 18, 0.55)";
      ctx.lineWidth = 1.2;
      for (let s = -bh; s < rw + bh; s += 7) {
        ctx.beginPath();
        ctx.moveTo(rx + s, oy + bh);
        ctx.lineTo(rx + s + bh, oy);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 4. 交叉轴中线基准与各子项中心点连线（行模式）
  if (isRow && lastMeasure.lines.length > 0) {
    const ln0 = lastMeasure.lines[0];
    const midY = oy + (ln0.top + ln0.bot) / 2;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = lastMeasure.crossSpreadPx <= 2 && heroState.alignItems === "center"
      ? "rgba(23, 106, 69, 0.72)"
      : "rgba(231, 62, 18, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ox + 4, midY);
    ctx.lineTo(ox + bw - 4, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 标出每个子项底部实测宽度标尺
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    for (const it of lastMeasure.items) {
      const ix = ox + it.rect.x + it.rect.w / 2;
      const iy = oy + bh + 15;
      if (ix > ox + 12 && ix < w - 16 && it.rect.y < ln0.bot + 4) {
        ctx.fillStyle = (it.role !== "primary" && it.policy === "grow" && it.deltaPx > 8)
          ? "#B92D09"
          : "#4F4A42";
        ctx.fillText(`${it.mainPx}px`, ix, iy);
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

const heroLoop = loop(heroStage, (_t, dt, { still }) => {
  if (still) {
    introProgress = 1;
    drawHeroXray(1);
    needsRedraw = false;
    return;
  }
  if (introProgress < 1) {
    introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.6);
    drawHeroXray(introProgress);
    needsRedraw = false;
  } else if (needsRedraw) {
    drawHeroXray(1);
    needsRedraw = false;
  }
});

// 拖拽右壁朱红拉杆（同时兼容鼠标 Pointer 与纯 Touch 事件，确保 tools/perf.mjs 触控测量 100% 命中）
let dragStart = null;
function startDrag(clientX) {
  dragStart = {
    x: clientX,
    w0: heroFlex.getBoundingClientRect().width,
  };
  heroHandle.classList.add("is-dragging");
}
function moveDrag(clientX) {
  if (!dragStart) return;
  const trackW = heroTrack.clientWidth || 640;
  const nextW = dragStart.w0 + (clientX - dragStart.x);
  heroState.widthNorm = normFromWidth(nextW, trackW);
  applyHeroDom();
  drawHeroXray(introProgress);
}
function endDrag() {
  if (!dragStart) return;
  dragStart = null;
  heroHandle.classList.remove("is-dragging");
}

heroHandle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  try { heroHandle.setPointerCapture?.(e.pointerId); } catch {}
  startDrag(e.clientX);
});
window.addEventListener("pointermove", (e) => {
  if (!dragStart) return;
  moveDrag(e.clientX);
});
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);

// 额外兜底原生 touch 事件，适配某些无头合成 touchEvent
heroHandle.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  e.preventDefault();
  startDrag(e.touches[0].clientX);
}, { passive: false });
window.addEventListener("touchmove", (e) => {
  if (!dragStart || !e.touches.length) return;
  moveDrag(e.touches[0].clientX);
}, { passive: true });
window.addEventListener("touchend", endDrag);

// 拉杆键盘微调
heroHandle.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  const trackW = heroTrack.clientWidth || 640;
  const curW = widthFromNorm(heroState.widthNorm, trackW);
  const step = e.shiftKey ? 40 : 18;
  heroState.widthNorm = normFromWidth(curW + (e.key === "ArrowRight" ? step : -step), trackW);
  applyHeroDom();
  heroLoop.draw();
});

// 容器轴向 / 对齐 / 换行切换
document.querySelectorAll("[data-dir]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.direction = btn.dataset.dir;
    applyHeroDom();
    heroLoop.draw();
  });
});
document.querySelectorAll("[data-align]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.alignItems = btn.dataset.align;
    applyHeroDom();
    heroLoop.draw();
  });
});
document.querySelectorAll("[data-wrap]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.wrap = btn.dataset.wrap;
    applyHeroDom();
    heroLoop.draw();
  });
});

// 点击子项循环切换策略（同时选中对应槽位）
const POLICY_CYCLE = ["lock", "shrink", "grow"];
for (const m of HERO_ITEMS) {
  heroItemEls[m.id].addEventListener("click", () => {
    heroState.selectedId = m.id;
    const curIdx = POLICY_CYCLE.indexOf(heroState.policies[m.id]);
    heroState.policies[m.id] = POLICY_CYCLE[(curIdx + 1) % POLICY_CYCLE.length];
    applyHeroDom();
    heroLoop.draw();
  });
}

// 点击下方策略槽按钮直接指定
document.querySelectorAll("[data-set-item]").forEach((pill) => {
  pill.addEventListener("click", () => {
    const id = pill.dataset.setItem;
    heroState.selectedId = id;
    heroState.policies[id] = pill.dataset.policy;
    applyHeroDom();
    heroLoop.draw();
  });
});

document.getElementById("hero-reset").addEventListener("click", () => {
  heroState = createInitialHeroState();
  applyHeroDom();
  heroLoop.draw();
});
document.getElementById("hero-solve").addEventListener("click", () => {
  heroState = createReferenceHeroState();
  applyHeroDom();
  heroLoop.draw();
});

// ==================== 01 节：一根主轴，九十度旋转 ====================
const axStage = document.getElementById("ax-stage");
const axBox = document.getElementById("ax-box");
const axMainDesc = document.getElementById("ax-main-desc");
const axCrossDesc = document.getElementById("ax-cross-desc");
const axBaseRule = document.getElementById("ax-baseline-rule");
const axVTitle = document.getElementById("ax-v-title");
const axVSub = document.getElementById("ax-v-sub");

const axState = { dir: "row", jc: "flex-start", ai: "center" };
const DIR_TEXT = {
  row: { main: "从左到右（水平）", cross: "从上到下（垂直）", mainAxisZh: "左右", crossAxisZh: "上下" },
  "row-reverse": { main: "从右到左（水平反转）", cross: "从上到下（垂直）", mainAxisZh: "右→左", crossAxisZh: "上下" },
  column: { main: "从上到下（垂直）", cross: "从左到右（水平）", mainAxisZh: "上下", crossAxisZh: "左右" },
  "column-reverse": { main: "从下到上（垂直反转）", cross: "从左到右（水平）", mainAxisZh: "下→上", crossAxisZh: "左右" },
};
const JC_NOTE = {
  "flex-start": "贴主轴起点集合，剩余空间留在尾部",
  center: "抱团停在主轴正中，两端平分剩余空间",
  "space-between": "首尾两块贴边，剩余空间全分进项间缝隙",
  "space-around": "每项两侧各得半份空隙，所以项间空隙是边缘的 2 倍",
  "space-evenly": "首尾边缘与项间空隙严格等宽",
};
const AI_NOTE = {
  "flex-start": "向交叉轴起点靠齐",
  center: "沿交叉轴中线居中对齐",
  "flex-end": "向交叉轴终点靠齐",
  stretch: "取消固定尺寸，沿交叉轴把所有子项拉满整条轨道",
  baseline: "不按框顶或中线，而是把三个字号不同的字母 A 按文字底脚基线穿成一线",
};

function renderAxisLab() {
  axStage.dataset.dir = axState.dir;
  axBox.style.flexDirection = axState.dir;
  axBox.style.justifyContent = axState.jc;
  axBox.style.alignItems = axState.ai;

  const info = DIR_TEXT[axState.dir];
  axMainDesc.textContent = `主轴：${info.main}`;
  axCrossDesc.textContent = `交叉轴：${info.cross}`;

  document.querySelectorAll("[data-ax-dir]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.axDir === axState.dir))
  );
  document.querySelectorAll("[data-ax-jc]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.axJc === axState.jc))
  );
  document.querySelectorAll("[data-ax-ai]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.axAi === axState.ai))
  );

  // baseline 辅助红线仅在横排且 baseline 时定位在三块文字基线上
  if (axState.ai === "baseline" && axState.dir.startsWith("row")) {
    axBaseRule.style.display = "block";
    requestAnimationFrame(() => {
      const stageR = axStage.getBoundingClientRect();
      const gR = axBox.querySelector(".ax-b .ax-glyph").getBoundingClientRect();
      axBaseRule.style.top = `${Math.round(gR.bottom - stageR.top - 4)}px`;
    });
  } else {
    axBaseRule.style.display = "none";
  }

  axVTitle.textContent = `${axState.dir}：justify-content 管${info.mainAxisZh}，align-items 管${info.crossAxisZh}。`;
  axVSub.textContent = `此刻主轴采用 ${axState.jc}（${JC_NOTE[axState.jc]}）；交叉轴采用 ${axState.ai}（${AI_NOTE[axState.ai]}）。`;
}

document.querySelectorAll("[data-ax-dir]").forEach((b) =>
  b.addEventListener("click", () => { axState.dir = b.dataset.axDir; renderAxisLab(); })
);
document.querySelectorAll("[data-ax-jc]").forEach((b) =>
  b.addEventListener("click", () => { axState.jc = b.dataset.axJc; renderAxisLab(); })
);
document.querySelectorAll("[data-ax-ai]").forEach((b) =>
  b.addEventListener("click", () => { axState.ai = b.dataset.axAi; renderAxisLab(); })
);

// ==================== 02 节：伸缩三件套算账器 ====================
const MATH_PRESETS = {
  poster: {
    width: 560,
    items: [
      { name: "A", grow: 1, shrink: 1, basis: 200, minW: 54, basisLabel: "200px" },
      { name: "B", grow: 1, shrink: 1, basis: 120, minW: 54, basisLabel: "auto(120)" },
      { name: "C", grow: 0, shrink: 0, basis: 100, minW: 100, basisLabel: "100px" },
    ],
    tip: "复刻原海报：A(200px) 与 B(auto≈120px) 允许伸缩，C 设 flex: 0 0 100px 稳如定海神针。拖窄到 340px 看 A 因 basis 更大而按加权缩得更快。",
  },
  grow121: {
    width: 560,
    items: [
      { name: "1", grow: 1, shrink: 1, basis: 0, minW: 44, basisLabel: "0%" },
      { name: "2", grow: 2, shrink: 1, basis: 0, minW: 44, basisLabel: "0%" },
      { name: "3", grow: 1, shrink: 1, basis: 0, minW: 44, basisLabel: "0%" },
    ],
    tip: "复刻原海报 1 : 2 : 1：三项 flex-basis 全归 0%，整条容器宽度严丝合缝按 1 : 2 : 1 切分。",
  },
  basisDiff: {
    width: 560,
    items: [
      { name: "短", grow: 1, shrink: 1, basis: 60, minW: 48, basisLabel: "auto(60)" },
      { name: "较长标题", grow: 1, shrink: 1, basis: 180, minW: 64, basisLabel: "auto(180)" },
      { name: "固定", grow: 0, shrink: 0, basis: 80, minW: 80, basisLabel: "80px" },
    ],
    tip: "前两项同写 flex-grow: 1 但保留 basis: auto——它们先领走各自内容宽（60px 与 180px），再平分剩余空间，所以结果绝不是两块一样宽！",
  },
};

let mathPresetKey = "poster";
let mathWidth = 560;
let mathItems = MATH_PRESETS.poster.items.map((x) => ({ ...x }));

const mathSlider = document.getElementById("math-width");
const mathWVal = document.getElementById("math-w-val");
const mathModeTag = document.getElementById("math-mode-tag");
const mathRulerMid = document.getElementById("math-ruler-mid");
const mathRulerEnd = document.getElementById("math-ruler-end");
const mathFlex = document.getElementById("math-flex");
const mathEq = document.getElementById("math-eq");
const mathExplain = document.getElementById("math-explain");

function renderMathLab() {
  const solved = solveFlex1D(mathWidth, 0, mathItems);
  mathWVal.textContent = `${mathWidth}px`;
  mathRulerMid.textContent = `${Math.round(mathWidth / 2)}px`;
  mathRulerEnd.textContent = `${mathWidth}px`;

  // 容器在窄屏下等比缩放显示，保证 390px 也不溢出，数值仍按真实 1D 算式 1:1 映射
  const pct = Math.min(100, (mathWidth / 660) * 100);
  mathFlex.style.width = `${pct.toFixed(1)}%`;

  solved.items.forEach((it, idx) => {
    const el = document.getElementById(`mf-${idx}`);
    el.querySelector(".mf-name").textContent = it.name;
    document.getElementById(`mf-spec-${idx}`).textContent = `${it.grow} ${it.shrink} ${it.basisLabel}`;
    const rounded = Math.round(it.final);
    document.getElementById(`mf-out-${idx}`).textContent = `${rounded}px`;
    el.style.flex = `0 0 ${((it.final / Math.max(1, mathWidth)) * 100).toFixed(2)}%`;

    document.getElementById(`tw-label-${idx}`).textContent = `grow ${it.grow}`;
    document.querySelectorAll(`[data-tw-i="${idx}"]`).forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.twV) === it.grow))
    );
  });

  if (solved.mode === "grow") {
    mathModeTag.textContent = `正余量 +${Math.round(solved.free)}px`;
    const parts = solved.items.map((it) => `${it.name}=${it.basis}+${Math.round(it.delta)}=${Math.round(it.final)}px`).join(" · ");
    mathEq.textContent = `容器 ${mathWidth}px − 基数和 ${solved.sumBase}px = 剩余 +${Math.round(solved.free)}px → ${parts}`;
  } else if (solved.mode === "shrink") {
    mathModeTag.textContent = `负空间 −${Math.round(solved.deficit)}px`;
    const parts = solved.items.map((it) => `${it.name}=${it.basis}${Math.round(it.delta)}=${Math.round(it.final)}px`).join(" · ");
    mathEq.textContent = `容器 ${mathWidth}px 低于基数和 ${solved.sumBase}px（赤字 ${Math.round(solved.deficit)}px，按 shrink×basis 加权扣除）→ ${parts}`;
  } else if (solved.mode === "overflow") {
    mathModeTag.textContent = `触底溢出 +${Math.round(solved.overflow)}px`;
    mathEq.textContent = `触及子项最小宽度下限，实测总宽超出容器 +${Math.round(solved.overflow)}px。`;
  } else {
    mathModeTag.textContent = "恰好吻合 ±0px";
    mathEq.textContent = `容器 ${mathWidth}px 恰好等于三项基数之和 ${solved.sumBase}px，无需伸缩。`;
  }
  mathExplain.textContent = MATH_PRESETS[mathPresetKey].tip;

  document.querySelectorAll("[data-math-preset]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.mathPreset === mathPresetKey))
  );
}

mathSlider.addEventListener("input", () => {
  mathWidth = Number(mathSlider.value);
  renderMathLab();
});
document.querySelectorAll("[data-math-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    mathPresetKey = btn.dataset.mathPreset;
    mathWidth = MATH_PRESETS[mathPresetKey].width;
    mathSlider.value = String(mathWidth);
    mathItems = MATH_PRESETS[mathPresetKey].items.map((x) => ({ ...x }));
    renderMathLab();
  });
});
document.querySelectorAll("[data-tw-i]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const i = Number(btn.dataset.twI);
    mathItems[i].grow = Number(btn.dataset.twV);
    renderMathLab();
  });
});

// ==================== 03 节：换行与 align-content 积木盒 ====================
const wrapStage = document.getElementById("wrap-stage");
const wrapOverlay = document.getElementById("wrap-line-overlay");
const wrapCountEl = document.getElementById("wrap-count");
const wrapLinesBadge = document.getElementById("wrap-lines-badge");
const wrapOverflowBadge = document.getElementById("wrap-overflow-badge");
const wrapVTitle = document.getElementById("wrap-v-title");
const wrapVSub = document.getElementById("wrap-v-sub");

const wrapState = { count: 3, mode: "wrap", ac: "flex-start", gap: 10 };

function renderWrapLab() {
  wrapCountEl.textContent = `${wrapState.count} 块`;
  wrapStage.style.flexWrap = wrapState.mode;
  wrapStage.style.alignContent = wrapState.ac;
  wrapStage.style.gap = `${wrapState.gap}px`;

  wrapStage.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= wrapState.count; i++) {
    const d = document.createElement("div");
    d.className = "wrap-block";
    d.textContent = String(i);
    if (wrapState.ac === "stretch") {
      d.style.height = "auto";
    }
    frag.append(d);
  }
  wrapStage.append(frag);

  document.querySelectorAll("[data-wr-mode]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.wrMode === wrapState.mode))
  );
  document.querySelectorAll("[data-wr-ac]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.wrAc === wrapState.ac))
  );
  document.querySelectorAll("[data-wr-gap]").forEach((b) =>
    b.setAttribute("aria-pressed", String(Number(b.dataset.wrGap) === wrapState.gap))
  );

  // 实测真实行数、行轨坐标与溢出量
  requestAnimationFrame(() => {
    const sRect = wrapStage.getBoundingClientRect();
    const blocks = [...wrapStage.children];
    const lines = [];
    let maxOver = 0;

    for (const b of blocks) {
      const r = b.getBoundingClientRect();
      const over = Math.max(0, Math.round(r.right - (sRect.right - 2)));
      if (over > 2) b.classList.add("is-out");
      maxOver = Math.max(maxOver, over);
      const top = r.top - sRect.top;
      const bot = r.bottom - sRect.top;
      let ln = lines.find((x) => !(bot <= x.top + 3 || top >= x.bot - 3));
      if (!ln) lines.push({ top, bot });
      else { ln.top = Math.min(ln.top, top); ln.bot = Math.max(ln.bot, bot); }
    }

    wrapOverlay.innerHTML = "";
    for (const ln of lines) {
      const band = document.createElement("div");
      band.className = "wrap-line-band";
      band.style.top = `${Math.max(4, Math.round(ln.top) - 3)}px`;
      band.style.height = `${Math.max(12, Math.round(ln.bot - ln.top) + 6)}px`;
      wrapOverlay.append(band);
    }

    const active = wrapState.mode !== "nowrap" && lines.length > 1;
    wrapLinesBadge.textContent = active
      ? `实测 ${lines.length} 条行轨（align-content: ${wrapState.ac} 已生效）`
      : `实测 ${lines.length} 行（align-content 未激活）`;
    wrapOverflowBadge.textContent = maxOver > 2 ? `右缘溢出 +${maxOver}px` : "溢出 0px";

    if (wrapState.mode === "nowrap" && maxOver > 2) {
      wrapVTitle.textContent = `nowrap 下 ${wrapState.count} 块总宽撑过容器，右缘实测溢出 +${maxOver}px。`;
      wrapVSub.textContent = "因为方块设了 flex: 0 0 106px 不允许缩扁，不换行时它们直接冲出虚线框；切到 wrap 立刻折行回到框内。";
    } else if (!active) {
      wrapVTitle.textContent = "当前仅 1 行：align-content 处于休眠状态，点击不同值不会移动方块。";
      wrapVSub.textContent = "点「+ 加一块」让方块折出第 2 行，再用 space-between、center 或 stretch 看多条虚线行轨如何上下分配。";
    } else if (wrapState.mode === "wrap-reverse") {
      wrapVTitle.textContent = `wrap-reverse 把交叉轴起点翻到容器底沿，第 1 行落在最下方（共 ${lines.length} 行）。`;
      wrapVSub.textContent = `此刻 align-content: ${wrapState.ac} 依然在 ${lines.length} 条行轨之间分配垂直空间，只是行序从底向上生长。`;
    } else {
      wrapVTitle.textContent = `已折出 ${lines.length} 条行轨，align-content: ${wrapState.ac} 正在指挥整行间距。`;
      wrapVSub.textContent = "注意虚线框出的每一整行：align-content 移动的是整条行轨，而每个方块在各自那一行里仍由 align-items 对齐。";
    }
  });
}

document.getElementById("wrap-dec").addEventListener("click", () => {
  wrapState.count = Math.max(2, wrapState.count - 1);
  renderWrapLab();
});
document.getElementById("wrap-inc").addEventListener("click", () => {
  wrapState.count = Math.min(10, wrapState.count + 1);
  renderWrapLab();
});
document.querySelectorAll("[data-wr-mode]").forEach((b) =>
  b.addEventListener("click", () => { wrapState.mode = b.dataset.wrMode; renderWrapLab(); })
);
document.querySelectorAll("[data-wr-ac]").forEach((b) =>
  b.addEventListener("click", () => { wrapState.ac = b.dataset.wrAc; renderWrapLab(); })
);
document.querySelectorAll("[data-wr-gap]").forEach((b) =>
  b.addEventListener("click", () => { wrapState.gap = Number(b.dataset.wrGap); renderWrapLab(); })
);

// ==================== 04 节：历史考古时间轴 ====================
const ERAS = [
  {
    date: "2009-07-23 · W3C Working Draft",
    title: "从 XUL 走出的第一代 box 语法",
    body: "W3C 发布首份 Flexible Box Layout Module 工作草案，编辑为 Mozilla 的 L. David Baron，早期作者包括 Neil Deakin、Ian Hickson 与 David Hyatt。它直接脱胎于 Firefox 界面使用的 XUL 盒模型，语法写作 display: box 与 box-pack、box-orient，虽然在早期 WebKit 与 Gecko 中实验落地，但面对复杂网页排版暴露出扩展瓶颈。",
    source: "核实来源：W3C Flexible Box Layout Module (WD-css3-flexbox-20090723)",
    oldCap: "2009 年第一代语法（display: box）",
    oldCode: `.bar {\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-box-pack: justify;\n  -webkit-box-align: center;\n}`,
    newCode: `.bar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}`,
  },
  {
    date: "2012-03-22 · W3C Working Draft",
    title: "推倒重写的过渡期：display: flexbox",
    body: "CSS 工作组放弃旧盒模型并彻底重写规范，由 Google 的 Tab Atkins Jr.、Microsoft 的 Alex Mogilevsky 与 Mozilla 的 L. David Baron 共同编辑。2012 年 3 月草案短暂使用 display: flexbox、flex-pack 与 flex-align，IE 10 恰好在这一阶段抢先实现了带 -ms- 前缀的版本。",
    source: "核实来源：W3C CSS Flexible Box Layout Module (WD-css3-flexbox-20120322)",
    oldCap: "2012 年初过渡语法（IE 10 -ms-flexbox）",
    oldCode: `.bar {\n  display: -ms-flexbox;\n  -ms-flex-pack: justify;\n  -ms-flex-align: center;\n}\n.search { -ms-flex: 1 1 0px; }`,
    newCode: `.bar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.search { flex: 1 1 0px; }`,
  },
  {
    date: "2012-09-18 · W3C Candidate Recommendation",
    title: "现代 display: flex 正式定型",
    body: "W3C 发布首份候选推荐标准（CR），编辑为 Tab Atkins Jr.、Elika J. Etemad（fantasai）与 Alex Mogilevsky。今天耳熟能详的 display: flex、flex-direction、justify-content、align-items 与 flex 三值简写全部在此拍板，成为现代浏览器的统一实现蓝本。",
    source: "核实来源：W3C CSS Flexible Box Layout Module (CR-css3-flexbox-20120918)",
    oldCap: "在这之前实现垂直居中（绝对定位补丁）",
    oldCode: `.dialog {\n  position: absolute;\n  top: 50%; left: 50%;\n  width: 320px; height: 200px;\n  margin: -100px 0 0 -160px;\n}`,
    newCode: `.backdrop {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
  },
  {
    date: "2013 · Solved by Flexbox",
    title: "六道 CSS 世纪难题一夕迎刃而解",
    body: "随着 Firefox 22、Safari 6.1 与 IE 11 陆续落地新语法，工程师 Philip Walton 在 2013 年推出示范站 Solved by Flexbox，逐一展示垂直居中、粘底页脚、圣杯三栏、等高卡片、媒体对象与输入框配按钮如何在零 hack 的前提下几行搞定，推动弹性盒在社区全面普及。",
    source: "核实来源：Philip Walton, Solved by Flexbox (philipwalton.github.io/solved-by-flexbox/)",
    oldCap: "老式等高三栏与粘底页脚（浮动 + 负边距）",
    oldCode: `.wrap { padding-bottom: 64px; overflow: hidden; }\n.col  { float: left; padding-bottom: 9999px;\n        margin-bottom: -9999px; }`,
    newCode: `.page { display: flex; flex-direction: column; min-height: 100vh; }\n.main { display: flex; flex: 1; }`,
  },
  {
    date: "2018-11-19 · W3C CR Update",
    title: "精雕细琢：自动最小尺寸与边界修补",
    body: "W3C 发布 CSS Flexible Box Layout Module Level 1 更新版候选推荐标准（编辑 Tab Atkins Jr.、Elika J. Etemad / fantasai、Rossen Atanassov），系统修补多年跨浏览器互操作问题，尤其是确立并细化了弹性子项自动最小尺寸（min-width: auto）与内容收缩边界规则。",
    source: "核实来源：W3C CSS Flexible Box Layout Module Level 1 (CR-css-flexbox-1-20181119)",
    oldCap: "容易忘写的长词截断保护",
    oldCode: `.title {\n  flex: 1;\n  white-space: nowrap;\n  overflow: hidden; /* 缺 min-width: 0 会失效 */\n}`,
    newCode: `.title {\n  flex: 1 1 0;\n  min-width: 0;\n  white-space: nowrap;\n  overflow: hidden; text-overflow: ellipsis;\n}`,
  },
  {
    date: "2021-04-29 · Safari 14.1 / iOS 14.5",
    title: "最后一块拼图：Flexbox gap 全线贯通",
    body: "此前 Firefox 与 Chromium 已支持在弹性容器上直接使用 gap，但 Safari 迟迟未补齐，开发者只能靠负外边距与 :last-child 清边距硬凑。2021 年 4 月 29 日 WebKit 宣布 Safari 14.1（macOS）与 iOS 14.5 正式支持 Flexbox gap，父容器统一管间距终于全浏览器通用。",
    source: "核实来源：WebKit Blog, New WebKit Features in Safari 14.1 (2021-04-29)",
    oldCap: "gap 普及前的间距清扫写法",
    oldCode: `.nav > a { margin-right: 16px; }\n.nav > a:last-child { margin-right: 0; }`,
    newCode: `.nav {\n  display: flex;\n  gap: 16px;\n}`,
  },
];

function renderEra(idx) {
  const e = ERAS[idx];
  document.getElementById("era-date").textContent = e.date;
  document.getElementById("era-title").textContent = e.title;
  document.getElementById("era-body").textContent = e.body;
  document.getElementById("era-source").textContent = e.source;
  document.getElementById("era-old-cap").textContent = e.oldCap;
  document.getElementById("era-old-code").textContent = e.oldCode;
  document.getElementById("era-new-code").textContent = e.newCode;
  document.querySelectorAll(".era-tab").forEach((t) =>
    t.setAttribute("aria-selected", String(Number(t.dataset.era) === idx))
  );
}
document.querySelectorAll(".era-tab").forEach((tab) =>
  tab.addEventListener("click", () => renderEra(Number(tab.dataset.era)))
);

// ==================== 05 节：原海报网站 4 层剥洋葱 ====================
const NEST_INFO = {
  all: {
    title: "四层一维弹性盒嵌套总览：一根竖轴撑骨架，三根横轴分内容。",
    sub: "每一层都只操心自己那一根主轴——互不打架，这就是「一个维度，多种可能」的真实含义。",
  },
  l0: {
    title: "L0 整页外壳：主轴竖排（flex-direction: column），把顶栏、中区、三卡与页脚连成一列。",
    sub: "给中间区设 flex: 1，即使内容很短，底部「页脚信息 / 联系我们」也能自动沉底，不再半空悬着。",
  },
  l1: {
    title: "L1 顶栏导航：横排配 justify-content: space-between 与 align-items: center。",
    sub: "左侧 LOGO 与右侧「首页 课程 资源 关于」自动推向两端并垂直居中；菜单内部再套一小段 gap: 14px 管字间距。",
  },
  l2: {
    title: "L2 主内容与侧边栏：横排按 flex: 2 与 flex: 1 分配 2 : 1 宽幅，且天生等高。",
    sub: "切到手机窄屏后，这一层只需一行 flex-direction: column，主内容区与侧边栏立刻优雅改为上下堆叠。",
  },
  l3: {
    title: "L3 三张功能卡片：视频课程、学习资料、进度统计各设 flex: 1 1 0 严格三等分。",
    sub: "每张卡片自身又是一个垂直居中的迷你 column 弹性盒，图标与文字纵向居中对齐。",
  },
};
const nestShell = document.getElementById("nest-shell");
const nestVpBtn = document.getElementById("nest-vp-toggle");
const nestVTitle = document.getElementById("nest-v-title");
const nestVSub = document.getElementById("nest-v-sub");

document.querySelectorAll("[data-layer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.layer;
    nestShell.dataset.activeLayer = key;
    document.querySelectorAll("[data-layer]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.layer === key))
    );
    nestVTitle.textContent = NEST_INFO[key].title;
    nestVSub.textContent = NEST_INFO[key].sub;
  });
});

nestVpBtn.addEventListener("click", () => {
  const isMob = nestShell.dataset.vp === "mobile";
  nestShell.dataset.vp = isMob ? "desktop" : "mobile";
  nestVpBtn.setAttribute("aria-pressed", String(!isMob));
  nestVpBtn.textContent = isMob ? "切到手机窄屏" : "切回桌面宽屏";
});

// ==================== 06 节：反例三景与 Tab 跳序模拟器 ====================
document.querySelectorAll("[data-pit]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = btn.dataset.pit;
    document.querySelectorAll("[data-pit]").forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.pit === idx))
    );
    document.querySelectorAll("[data-pit-panel]").forEach((p) => {
      p.hidden = p.dataset.pitPanel !== idx;
    });
  });
});

let tabStep = 1;
const TAB_NOTES = [
  "当前焦点落在视觉第 3 格（DOM ① 登录）。按一次 Tab，看看焦点往哪跳。",
  "焦点突然向左折返回视觉第 1 格（DOM ② 返回）——视觉阅读顺序和焦点轨迹完全拧巴。",
  "焦点又跨过两格猛跳到最右侧视觉第 4 格（DOM ③ 提交），键盘用户极易迷失。",
  "最后折回视觉第 2 格（DOM ④ 帮助）！想改视觉先后，请直接调整 HTML 结构而不是乱写 order。",
];
document.getElementById("tab-step-btn").addEventListener("click", () => {
  tabStep = (tabStep % 4) + 1;
  document.getElementById("tab-step-no").textContent = String(tabStep);
  document.querySelectorAll("#order-track .ord-card").forEach((c) => {
    c.classList.toggle("is-focused", Number(c.dataset.dom) === tabStep);
  });
  document.getElementById("order-readout").textContent = TAB_NOTES[tabStep - 1];
});

// ==================== 07 节：小练习与同源真 Flexbox 拆账揭晓 ====================
const QUIZ_COPY = {
  A: {
    ok: false,
    headline: "选了 A（300px / 300px）——掉进了最经典的 flex-grow: 1 误区！",
    explain: "只有写简写 flex: 1（把 flex-basis 设为 0%）才会把整条 600px 平分成 300px 与 300px。题目里只写了 flex-grow: 1，flex-basis 仍是默认值 auto，必须先扣除各自内容自然宽 60px 与 240px，只把剩下的 300px 对半平分，所以正确答案是 B：210px 与 390px。",
  },
  B: {
    ok: true,
    headline: "答对了！正是 B（甲 210px · 乙 390px）。",
    explain: "因为 flex-basis 保持默认 auto，两项先各自领走内容自然宽（60px + 240px = 300px），剩下的 300px 剩余空间再按 flex-grow 的 1 : 1 各分得 +150px，最终甲为 60 + 150 = 210px、乙为 240 + 150 = 390px。点上方按钮切到 flex: 1 即可直看 basis 归零后的变化。",
  },
  C: {
    ok: false,
    headline: "选了 C（120px / 480px）——flex-grow 分的不是总宽比例。",
    explain: "弹性盒不会把 600px 按 60 : 240（1 : 4）整体放大；它先给甲 60px、乙 240px，再把多出的 300px 余量按两项相同的 flex-grow: 1 各加 150px，所以正确结果是 B（210px / 390px）。",
  },
  D: {
    ok: false,
    headline: "选了 D（60px / 540px）——甲项同样开了 flex-grow: 1。",
    explain: "只有当甲项的 flex-grow 为 0 时，全部 300px 余量才会归乙项独吞；两项都写了 flex-grow: 1，所以余量 300px 对半分，正确答案是 B（210px / 390px）。",
  },
};

const qrStatus = document.getElementById("qr-status");
const qrDemo = document.getElementById("qr-demo");
const qrLiveFlex = document.getElementById("qr-live-flex");
const qrToggle = document.getElementById("qr-toggle-basis");
const qrModeDesc = document.getElementById("qr-mode-desc");
const qrExplain = document.getElementById("qr-explain");
let quizZeroMode = false;

function renderQuizLive() {
  qrLiveFlex.classList.toggle("is-zero", quizZeroMode);
  qrToggle.setAttribute("aria-pressed", String(quizZeroMode));
  qrToggle.textContent = quizZeroMode ? "切回原题（flex-basis: auto）" : "改用 flex: 1（basis: 0%）对照";

  const specs = quizZeroMode
    ? [{ basis: 0, grow: 1, shrink: 1, minW: 0 }, { basis: 0, grow: 1, shrink: 1, minW: 0 }]
    : [{ basis: 60, grow: 1, shrink: 1, minW: 0 }, { basis: 240, grow: 1, shrink: 1, minW: 0 }];
  const solved = solveFlex1D(600, 0, specs);
  const a = solved.items[0];
  const b = solved.items[1];

  qrModeDesc.innerHTML = quizZeroMode
    ? '当前对照：<code class="tok">flex: 1</code>（等价 <code class="tok">flex: 1 1 0%</code>，平分全宽）'
    : '当前实测：<code class="tok">flex-grow: 1</code>（<code class="tok">flex-basis: auto</code>，平分余量）';

  document.getElementById("qr-base-a").textContent = `基数 ${a.basis}px`;
  document.getElementById("qr-extra-a").textContent = `+${Math.round(a.delta)}px`;
  document.getElementById("qr-total-a").textContent = `甲 · ${Math.round(a.final)}px`;

  document.getElementById("qr-base-b").textContent = `基数 ${b.basis}px`;
  document.getElementById("qr-extra-b").textContent = `+${Math.round(b.delta)}px`;
  document.getElementById("qr-total-b").textContent = `乙 · ${Math.round(b.final)}px`;
}

document.querySelectorAll(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.ans;
    const res = QUIZ_COPY[pick];
    document.querySelectorAll(".quiz-opt").forEach((b) => {
      const k = b.dataset.ans;
      b.setAttribute("aria-pressed", String(k === pick));
      b.classList.toggle("is-right", k === "B");
      b.classList.toggle("is-wrong", k === pick && pick !== "B");
    });
    qrStatus.textContent = res.headline;
    qrExplain.textContent = res.explain;
    quizZeroMode = false;
    qrDemo.hidden = false;
    renderQuizLive();
  });
});
qrToggle.addEventListener("click", () => {
  quizZeroMode = !quizZeroMode;
  renderQuizLive();
});

// ==================== 08 节：原海报灯箱（复用 #poster src，支持缩放、拖拽、Esc 关闭） ====================
const posterImg = document.getElementById("poster");
const posterBtn = document.getElementById("poster-btn");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function updateLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  document.getElementById("lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}
function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  updateLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  document.getElementById("lb-close").focus();
}
function closeLightbox() {
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  updateLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  updateLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1; lbX = 0; lbY = 0;
  updateLbTransform();
});
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = Math.max(0.7, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  updateLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1.01) { closeLightbox(); return; }
  lbDrag = { x: e.clientX, y: e.clientY, x0: lbX, y0: lbY, moved: false };
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  const dx = e.clientX - lbDrag.x;
  const dy = e.clientY - lbDrag.y;
  if (Math.hypot(dx, dy) > 4) lbDrag.moved = true;
  lbX = lbDrag.x0 + dx;
  lbY = lbDrag.y0 + dy;
  updateLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  if (lbDrag && !lbDrag.moved && lbScale <= 1.01) closeLightbox();
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化与视口尺寸自适应 ====================
function initAll() {
  measureNaturalSizes();
  applyHeroDom();
  heroLoop.draw();
  renderAxisLab();
  renderMathLab();
  renderWrapLab();
  renderEra(0);
}

if (document.fonts?.ready) {
  document.fonts.ready.then(initAll);
} else {
  initAll();
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measureNaturalSizes();
    applyHeroDom();
    heroLoop.draw();
    renderWrapLab();
  }, 60);
});
