import { loop, pixelRatio } from "../../lib/stage.js";
import {
  ANTI_CASES,
  DIPTYCH_H,
  DIPTYCH_W,
  HISTORY_NODES,
  INITIAL_HERO,
  MEANING_PAIRS,
  PALETTE,
  PATTERNS,
  QUIZ_OPTIONS,
  THRESHOLDS,
  clamp,
  evaluateHero,
  evaluateSeamZone,
} from "./model.js";

// ==================== 1. 开场：双联中缝并置天平台 ====================
const heroState = { ...INITIAL_HERO };
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");
const seamRail = document.getElementById("seam-rail");
const railThumb = document.getElementById("rail-thumb");
const railReadout = document.getElementById("rail-readout");
const weightRange = document.getElementById("weight-range");
const weightVal = document.getElementById("weight-val");
const diagBox = document.getElementById("hero-diag");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");

let animTilt = evaluateHero(heroState).tiltDeg;
let introProg = 0;
let hitMeta = null;
let dragTarget = null; // "left" | "right" | null
let dragStartX = 0;
let dragOrigOffset = 0;
let heroDirty = true;

function syncHeroUI(ev) {
  // 更新六柱翼板与窄屏芯片
  for (const [id, info] of Object.entries(ev.pillars)) {
    const el = document.querySelector(`[data-pillar="${id}"]`);
    if (el) el.dataset.state = info.state;
    const valEl = document.querySelector(`[data-pval="${id}"]`);
    if (valEl) valEl.textContent = info.value;
    const chip = document.querySelector(`[data-chip="${id}"]`);
    if (chip) chip.dataset.state = info.state;
  }

  // 更新诊断
  diagBox.dataset.kind = ev.diag.kind;
  diagBadge.className = `diag-badge ${ev.diag.kind}`;
  diagBadge.textContent = ev.diag.badge;
  diagTitle.textContent = ev.diag.title;
  diagBody.textContent = ev.diag.body;

  // 更新拉距轨
  const norm = clamp((ev.gapPct - -6) / (28 - -6), 0, 1);
  railThumb.style.left = `${clamp(norm * 100, 10, 90)}%`;
  railThumb.firstElementChild.textContent = ev.gapPct < 0 ? `↔ 叠${Math.abs(ev.gapPct)}%` : `↔ ${ev.gapPct}%`;
  seamRail.setAttribute("aria-valuenow", String(ev.gapPct));
  seamRail.dataset.ok = String(ev.pillars.adjacency.ok);
  seamRail.dataset.warn = String(!ev.pillars.adjacency.ok);

  const tiltStr = ev.snapped ? "横梁锁平 0.0°" : `${ev.tiltDeg > 0 ? "右沉 +" : "左沉 "}${ev.tiltDeg.toFixed(1)}°`;
  railReadout.textContent = `${ev.gapPct < 0 ? `重叠 ${Math.abs(ev.gapPct)}%` : `缝距 ${ev.gapPct}%`} · ${tiltStr}`;

  // 更新按钮按压态
  document.querySelectorAll("#left-shape-seg button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.shape === heroState.leftShape));
  });
  document.querySelectorAll("#right-shape-seg button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.shape === heroState.rightShape));
  });
  document.querySelectorAll("#color-mode-seg button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.color === heroState.colorMode));
  });
  weightRange.value = String(Math.round(heroState.rightScale * 100));
  weightVal.textContent = `${Math.round(heroState.rightScale * 100)}%`;
}

function drawShapePath(ctx, shape, cx, cy, box, side, pxPerUnit) {
  ctx.beginPath();
  if (shape === "rect") {
    const w = box.w * pxPerUnit;
    const h = box.h * pxPerUnit;
    ctx.rect(cx - w / 2, cy - h / 2, w, h);
  } else if (shape === "circle") {
    const r = box.r * pxPerUnit;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else {
    // 尖角指向中缝，增强左右对抗动势
    const w = box.w * pxPerUnit;
    const h = box.h * pxPerUnit;
    if (side === "left") {
      ctx.moveTo(cx + w * 0.5, cy);
      ctx.lineTo(cx - w * 0.5, cy - h * 0.5);
      ctx.lineTo(cx - w * 0.5, cy + h * 0.5);
    } else {
      ctx.moveTo(cx - w * 0.5, cy);
      ctx.lineTo(cx + w * 0.5, cy - h * 0.5);
      ctx.lineTo(cx + w * 0.5, cy + h * 0.5);
    }
    ctx.closePath();
  }
}

function drawHeroCanvas(t, dt, { still }) {
  const rect = heroCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const dpr = pixelRatio(2);
  const bw = Math.round(rect.width * dpr);
  const bh = Math.round(rect.height * dpr);
  if (heroCanvas.width !== bw || heroCanvas.height !== bh) {
    heroCanvas.width = bw;
    heroCanvas.height = bh;
    heroDirty = true;
  }

  const ev = evaluateHero(heroState);
  const targetTilt = ev.tiltDeg;

  if (still) {
    introProg = 1;
    animTilt = targetTilt;
  } else {
    if (introProg < 1) {
      introProg = Math.min(1, introProg + (dt || 0.016) * 1.9);
      heroDirty = true;
    }
    const diff = targetTilt - animTilt;
    if (Math.abs(diff) > 0.04) {
      animTilt += diff * Math.min(1, (dt || 0.016) * 11);
      heroDirty = true;
    } else if (animTilt !== targetTilt) {
      animTilt = targetTilt;
      heroDirty = true;
    }
  }

  // 六柱全亮时中缝保持微呼吸脉冲，其余状态稳定后不空烧 CPU
  const pulseActive = !still && ev.passCount === 6;
  if (!heroDirty && !pulseActive) return;
  heroDirty = false;

  const ctx = heroCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);

  // 为黑三角支点、横梁与最大旋转角留足上下留白（严格等比，保证四角永不裁切、圆永不变椭圆）
  const fulcrumH = Math.max(22, Math.min(34, H * 0.10));
  const beamGap = 9;
  const maxTiltRad = (THRESHOLDS.maxVisualTilt * Math.PI) / 180;
  const cosM = Math.cos(maxTiltRad);
  const sinM = Math.sin(maxTiltRad);
  // 绕底部支点旋转后，顶角上扬量为 (dipW/2)*sinM + (dipH+beamGap)*cosM；左右展开量为 dipW*cosM + (dipH+beamGap)*sinM
  const availH = H - fulcrumH - 20;
  const availW = W - 24;
  const pxByH = (availH - beamGap) / (DIPTYCH_H * cosM + DIPTYCH_W * 0.5 * sinM);
  const pxByW = availW / (DIPTYCH_W * cosM + DIPTYCH_H * sinM);
  const pxPerUnit = Math.max(40, Math.min(pxByH, pxByW));
  const dipW = DIPTYCH_W * pxPerUnit;
  const dipH = DIPTYCH_H * pxPerUnit;

  const rotHeadroom = dipW * 0.5 * sinM + 10;
  const pivotX = W * 0.5;
  const pivotY = rotHeadroom + dipH + beamGap;

  // 水平基准虚线（让倾角一目了然）
  ctx.save();
  ctx.strokeStyle = "rgba(22, 24, 23, 0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pivotX - dipW * 0.56, pivotY);
  ctx.lineTo(pivotX + dipW * 0.56, pivotY);
  ctx.stroke();
  ctx.restore();

  // 黑色等边支点三角（105 原海报标志母题）
  const triHalf = fulcrumH * 0.68;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY + 2);
  ctx.lineTo(pivotX - triHalf, pivotY + fulcrumH + 2);
  ctx.lineTo(pivotX + triHalf, pivotY + fulcrumH + 2);
  ctx.closePath();
  ctx.fillStyle = ev.pillars.balance.ok ? PALETTE.pine : PALETTE.fulcrum;
  ctx.fill();

  // 开场缓动（0.55 秒完成，0.9 秒首屏截图已经完整停稳）
  const ease = 1 - Math.pow(1 - introProg, 3);
  const tiltRad = (animTilt * ease * Math.PI) / 180;

  // 旋转整个双联版画 + 天平横梁绕支点转动
  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(tiltRad);

  // 天平横梁
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-dipW * 0.5, 0);
  ctx.lineTo(dipW * 0.5, 0);
  ctx.stroke();

  const dipTop = -beamGap - dipH;
  const dipCy = dipTop + dipH * 0.5;

  // 轻微实感落影，不破坏版画锐利感
  ctx.fillStyle = "rgba(22, 24, 23, 0.08)";
  ctx.fillRect(-dipW * 0.5 + 3, dipTop + 4, dipW, dipH);

  // 左联（枯玫瑰粉）与右联（深黛松绿）
  ctx.fillStyle = PALETTE.rose;
  ctx.fillRect(-dipW * 0.5, dipTop, dipW * 0.5, dipH);
  ctx.fillStyle = PALETTE.pine;
  ctx.fillRect(0, dipTop, dipW * 0.5, dipH);

  // 中缝细标与碰撞区指示
  const lx = ev.left.cx * pxPerUnit;
  const rx = ev.right.cx * pxPerUnit;

  // 如果两形贴近到中缝（且不是混叠状态），圆弧像 105 原海报一样在中缝处干净贴切
  const clipHalf = (side) => {
    ctx.save();
    ctx.beginPath();
    if (side === "left") ctx.rect(-dipW * 0.5, dipTop, dipW * 0.5, dipH);
    else ctx.rect(0, dipTop, dipW * 0.5, dipH);
    ctx.clip();
  };

  // 若越缝混叠，不裁剪以真实展示越界冲突；否则像原海报在各自半区干净裁齐中缝
  const isOverlap = ev.gapPct < THRESHOLDS.gapMinPct;

  // 绘制左形
  if (!isOverlap) clipHalf("left");
  drawShapePath(ctx, ev.left.shape, lx, dipCy, ev.left.box, "left", pxPerUnit);
  ctx.fillStyle = ev.left.fill;
  ctx.fill();
  if (dragTarget === "left") {
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (!isOverlap) ctx.restore();

  // 绘制右形
  if (!isOverlap) clipHalf("right");
  drawShapePath(ctx, ev.right.shape, rx, dipCy, ev.right.box, "right", pxPerUnit);
  ctx.fillStyle = ev.right.fill;
  ctx.fill();
  if (dragTarget === "right") {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (!isOverlap) ctx.restore();

  // 越缝混叠时在中缝标出斜纹碰撞警示带
  if (isOverlap) {
    const ovW = Math.max(8, Math.abs(ev.seamGapUnits) * pxPerUnit);
    ctx.save();
    ctx.fillStyle = "rgba(156, 48, 58, 0.34)";
    ctx.fillRect(-ovW * 0.5, dipCy - dipH * 0.28, ovW, dipH * 0.56);
    ctx.strokeStyle = PALETTE.paperSoft;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(-ovW * 0.5, dipCy - dipH * 0.28, ovW, dipH * 0.56);
    ctx.restore();
  }

  // 中缝中心垂直线 + 跨缝间距标尺
  const innerLx = (ev.left.cx + ev.left.box.centroidFromInner) * pxPerUnit;
  const innerRx = (ev.right.cx - ev.right.box.centroidFromInner) * pxPerUnit;

  ctx.save();
  if (ev.passCount === 6) {
    const glow = still ? 0.85 : 0.55 + 0.35 * Math.sin(t * 3.0);
    ctx.strokeStyle = `rgba(245, 232, 216, ${glow.toFixed(2)})`;
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = "rgba(22, 24, 23, 0.38)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
  }
  ctx.beginPath();
  ctx.moveTo(0, dipTop + 4);
  ctx.lineTo(0, dipTop + dipH - 4);
  ctx.stroke();
  ctx.restore();

  // 顶部缝距标尺线（清楚显示失联宽沟还是贴缝对话）
  const rulerY = dipTop + 20;
  ctx.save();
  const rulerColor = ev.pillars.adjacency.ok ? PALETTE.paperSoft : PALETTE.roseInk;
  ctx.strokeStyle = rulerColor;
  ctx.fillStyle = rulerColor;
  ctx.lineWidth = 1.4;
  if (ev.gapPct > 2) {
    ctx.beginPath();
    ctx.moveTo(innerLx, rulerY);
    ctx.lineTo(innerRx, rulerY);
    ctx.moveTo(innerLx, rulerY - 4);
    ctx.lineTo(innerLx, rulerY + 4);
    ctx.moveTo(innerRx, rulerY - 4);
    ctx.lineTo(innerRx, rulerY + 4);
    ctx.stroke();
  }
  // 缝距徽标
  const badgeText = isOverlap ? `越缝 ${Math.abs(ev.gapPct)}%` : `缝距 ${ev.gapPct}%`;
  ctx.font = `700 11.5px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
  const tw = ctx.measureText(badgeText).width + 16;
  ctx.fillStyle = ev.pillars.adjacency.ok ? PALETTE.pineDeep : PALETTE.roseInk;
  ctx.fillRect(-tw / 2, rulerY - 10, tw, 20);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, 0, rulerY + 0.5);
  ctx.restore();

  // 左右拖拽提示小点（细微克制，不抢画面）
  const drawHandleDot = (x, y, onLight) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = onLight ? PALETTE.paper : PALETTE.ink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = onLight ? PALETTE.pine : PALETTE.rose;
    ctx.fill();
    ctx.restore();
  };
  drawHandleDot(lx, dipCy, ev.colorMode !== "same");
  drawHandleDot(rx, dipCy, false);

  // 倾角角标（非零时标在横梁低沉侧上方）
  if (!ev.snapped) {
    const sideSign = animTilt < 0 ? -1 : 1;
    const tagX = sideSign * (dipW * 0.36);
    const tagY = dipTop + dipH - 16;
    const label = `${animTilt < 0 ? "左沉" : "右沉"} ${Math.abs(ev.tiltDeg).toFixed(1)}°`;
    ctx.save();
    ctx.font = `700 11.5px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
    const lw = ctx.measureText(label).width + 14;
    ctx.fillStyle = PALETTE.roseInk;
    ctx.fillRect(tagX - lw / 2, tagY - 10, lw, 20);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, tagX, tagY + 0.5);
    ctx.restore();
  }

  // 如果成立（6/6），在中缝画两颗对话微圆点呼应原海报
  if (ev.passCount === 6) {
    ctx.save();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(-6, dipCy, 3, 0, Math.PI * 2);
    ctx.arc(6, dipCy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore(); // 结束绕支点旋转

  // 保存点击命中几何供画布直拖
  hitMeta = {
    pivotX,
    pivotY,
    dipTop,
    dipCy,
    dipW,
    dipH,
    pxPerUnit,
    tiltRad,
    lx,
    rx,
    lBox: ev.left.box,
    rBox: ev.right.box,
  };

  ctx.restore();
}

const heroLoop = loop(heroCanvas, drawHeroCanvas);

function commitHero() {
  heroDirty = true;
  syncHeroUI(evaluateHero(heroState));
  heroLoop.draw();
}

// 绑定开场中缝拉距轨（支持指针/触控 + 键盘，与 perf.mjs touchStart/touchMove 完全契合）
function applyRailClientX(clientX) {
  const r = seamRail.getBoundingClientRect();
  const frac = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
  const gapPct = -6 + frac * 34; // -6% .. 28%
  const eachOffset = clamp((gapPct / 100) * 0.5, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
  // 保留轻微非对称偏移差，同时把两侧一起拉近/推远中缝
  const asym = clamp((heroState.leftOffset - heroState.rightOffset) * 0.5, -0.04, 0.04);
  heroState.leftOffset = clamp(eachOffset + asym, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
  heroState.rightOffset = clamp(eachOffset - asym, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
  commitHero();
}

let railDragging = false;
seamRail.addEventListener("pointerdown", (e) => {
  railDragging = true;
  seamRail.setPointerCapture?.(e.pointerId);
  applyRailClientX(e.clientX);
});
seamRail.addEventListener("pointermove", (e) => {
  if (!railDragging) return;
  applyRailClientX(e.clientX);
});
const endRail = () => { railDragging = false; };
seamRail.addEventListener("pointerup", endRail);
seamRail.addEventListener("pointercancel", endRail);

// 兼容纯 TouchEvent 派发（如 headless perf 触摸测试）
seamRail.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  railDragging = true;
  applyRailClientX(e.touches[0].clientX);
}, { passive: true });
seamRail.addEventListener("touchmove", (e) => {
  if (!railDragging || !e.touches.length) return;
  applyRailClientX(e.touches[0].clientX);
}, { passive: true });
seamRail.addEventListener("touchend", endRail, { passive: true });

seamRail.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.025 : 0.01;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    heroState.leftOffset = clamp(heroState.leftOffset - step, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
    heroState.rightOffset = clamp(heroState.rightOffset - step, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
    commitHero();
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    heroState.leftOffset = clamp(heroState.leftOffset + step, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
    heroState.rightOffset = clamp(heroState.rightOffset + step, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
    commitHero();
  }
});

// 画布内直拖左右形（微调单侧力臂与缝距）
function canvasToLocal(clientX, clientY) {
  if (!hitMeta) return null;
  const r = heroCanvas.getBoundingClientRect();
  const dx = clientX - r.left - hitMeta.pivotX;
  const dy = clientY - r.top - hitMeta.pivotY;
  const c = Math.cos(-hitMeta.tiltRad);
  const s = Math.sin(-hitMeta.tiltRad);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const pt = canvasToLocal(e.clientX, e.clientY);
  if (!pt || !hitMeta) return;
  if (pt.y < hitMeta.dipTop || pt.y > hitMeta.dipTop + hitMeta.dipH) return;
  dragTarget = pt.x < 0 ? "left" : "right";
  dragStartX = pt.x;
  dragOrigOffset = dragTarget === "left" ? heroState.leftOffset : heroState.rightOffset;
  heroCanvas.setPointerCapture?.(e.pointerId);
  heroDirty = true;
  heroLoop.draw();
});
heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragTarget || !hitMeta) return;
  const pt = canvasToLocal(e.clientX, e.clientY);
  if (!pt) return;
  const deltaUnits = (pt.x - dragStartX) / hitMeta.dipW;
  if (dragTarget === "left") {
    // 往左拖远离中缝（offset 增大），往右拖贴近中缝（offset 减小）
    heroState.leftOffset = clamp(dragOrigOffset - deltaUnits, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
  } else {
    heroState.rightOffset = clamp(dragOrigOffset + deltaUnits, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
  }
  commitHero();
});
const endCanvasDrag = () => {
  if (!dragTarget) return;
  dragTarget = null;
  heroDirty = true;
  heroLoop.draw();
};
heroCanvas.addEventListener("pointerup", endCanvasDrag);
heroCanvas.addEventListener("pointercancel", endCanvasDrag);

// 按钮与配重滑块
document.querySelectorAll("#left-shape-seg button, #right-shape-seg button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.side === "left") heroState.leftShape = btn.dataset.shape;
    else heroState.rightShape = btn.dataset.shape;
    commitHero();
  });
});
document.querySelectorAll("#color-mode-seg button").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.colorMode = btn.dataset.color;
    commitHero();
  });
});
weightRange.addEventListener("input", () => {
  heroState.rightScale = clamp(Number(weightRange.value) / 100, THRESHOLDS.minScale, THRESHOLDS.maxScale);
  commitHero();
});
document.getElementById("hero-reset").addEventListener("click", () => {
  Object.assign(heroState, INITIAL_HERO);
  commitHero();
});

window.addEventListener("resize", () => {
  heroDirty = true;
  heroLoop.draw();
  drawSeamCanvas();
});

// 初始化开场 UI 与首帧
syncHeroUI(evaluateHero(heroState));

// ==================== 2. 01 节：库里肖夫换义台 ====================
const kRightSvg = document.getElementById("k-right-svg");
const kRightTag = document.getElementById("k-right-tag");
const kRightEn = document.getElementById("k-right-en");
const kEmerged = document.getElementById("k-emerged");
const kEmergedEn = document.getElementById("k-emerged-en");
const kExplain = document.getElementById("k-explain");
const kSubnote = document.getElementById("k-subnote");

function renderRightPairSvg(id) {
  let inner = "";
  if (id === "soup") {
    inner = `
      <rect width="260" height="280" fill="#2F483B"/>
      <path d="M52 162 H208 C204 214 172 238 130 238 C88 238 56 214 52 162 Z" fill="#F1A3A6"/>
      <rect x="86" y="238" width="88" height="10" fill="#E57F86"/>
      <ellipse cx="130" cy="162" rx="78" ry="14" fill="#F5E8D8"/>
      <ellipse cx="130" cy="162" rx="64" ry="8" fill="#E57F86"/>
      <g fill="none" stroke="#F5E8D8" stroke-width="3" stroke-linecap="round">
        <path d="M98 134 Q90 112 102 92 Q112 74 102 58"/>
        <path d="M130 128 Q120 104 132 82 Q144 64 134 46"/>
        <path d="M162 136 Q154 114 166 96 Q176 78 166 64"/>
      </g>
    `;
  } else if (id === "chair") {
    inner = `
      <rect width="260" height="280" fill="#2F483B"/>
      <g stroke="#F1A3A6" stroke-width="5" fill="none" stroke-linecap="square">
        <line x1="78" y1="86" x2="78" y2="246"/>
        <line x1="78" y1="168" x2="182" y2="168"/>
        <line x1="176" y1="168" x2="176" y2="246"/>
        <line x1="78" y1="106" x2="134" y2="106"/>
        <line x1="78" y1="134" x2="134" y2="134"/>
        <line x1="134" y1="86" x2="134" y2="168"/>
      </g>
      <path d="M150 68 Q182 96 196 132 M176 92 L208 82 M186 112 L214 110" stroke="#F5E8D8" stroke-width="2.5" fill="none"/>
      <ellipse cx="144" cy="240" rx="10" ry="4" fill="#F1A3A6" transform="rotate(-14 144 240)"/>
      <ellipse cx="198" cy="244" rx="8" ry="3.5" fill="#F5E8D8" transform="rotate(18 198 244)"/>
    `;
  } else if (id === "bloom") {
    inner = `
      <rect width="260" height="280" fill="#2F483B"/>
      <path d="M64 268 Q112 192 152 108" stroke="#F5E8D8" stroke-width="3.5" fill="none"/>
      <circle cx="156" cy="102" r="34" fill="#F1A3A6"/>
      <circle cx="118" cy="128" r="24" fill="#EFA9AA"/>
      <circle cx="176" cy="144" r="20" fill="#F5E8D8"/>
      <circle cx="154" cy="104" r="10" fill="#2F483B"/>
      <path d="M98 206 Q62 190 56 164 Q90 168 104 196 Z" fill="#F1A3A6"/>
      <path d="M118 182 Q156 186 178 212 Q140 218 116 192 Z" fill="#F5E8D8"/>
    `;
  } else {
    inner = `
      <rect width="260" height="280" fill="#2F483B"/>
      <g transform="rotate(-16 140 144)">
        <circle cx="140" cy="144" r="76" fill="#F1A3A6"/>
        <circle cx="140" cy="144" r="64" fill="#F5E8D8"/>
        <line x1="140" y1="144" x2="140" y2="92" stroke="#161817" stroke-width="5" stroke-linecap="square"/>
        <line x1="140" y1="144" x2="184" y2="128" stroke="#9C303A" stroke-width="4" stroke-linecap="square"/>
        <circle cx="140" cy="144" r="6" fill="#161817"/>
      </g>
      <g stroke="#F1A3A6" stroke-width="2" stroke-dasharray="6 5">
        <line x1="24" y1="74" x2="74" y2="96"/>
        <line x1="20" y1="140" x2="54" y2="146"/>
        <line x1="28" y1="210" x2="78" y2="192"/>
      </g>
    `;
  }
  kRightSvg.innerHTML = inner;
}

function selectPair(id) {
  const item = MEANING_PAIRS.find((p) => p.id === id) || MEANING_PAIRS[0];
  renderRightPairSvg(item.id);
  kRightTag.textContent = `右联 · ${item.rightTitle}`;
  kRightEn.textContent = item.rightEn;
  kEmerged.textContent = item.emerged;
  kEmergedEn.textContent = item.emergedEn;
  kExplain.textContent = item.explain;
  kSubnote.textContent = item.note;
  document.querySelectorAll(".k-card").forEach((c) => {
    c.setAttribute("aria-pressed", String(c.dataset.pair === item.id));
  });
}

document.querySelectorAll(".k-card").forEach((c) => {
  c.addEventListener("click", () => selectPair(c.dataset.pair));
});
selectPair("soup");

// ==================== 3. 02 节：历史脉络图谱 ====================
const histSvg = document.getElementById("hist-svg");
const hcMeta = document.getElementById("hc-meta");
const hcTitle = document.getElementById("hc-title");
const hcBody = document.getElementById("hc-body");
const hcTake = document.getElementById("hc-take");

function renderHistorySvg(id) {
  const map = {
    kuleshov: `
      <rect width="420" height="260" fill="#1B2822"/>
      <rect x="26" y="42" width="114" height="150" fill="#F1A3A6"/>
      <path d="M52 192 C52 154 68 140 86 138 L90 124 C78 114 78 82 96 82 C112 82 118 96 116 114 L124 126 L116 132 L114 142 C126 150 132 166 134 192 Z" fill="#2F483B"/>
      <text x="83" y="216" fill="#F5E8D8" font-size="12" text-anchor="middle" font-family="Noto Sans SC, sans-serif">同一镜头 A</text>
      <text x="166" y="124" fill="#F1A3A6" font-size="24" text-anchor="middle" font-weight="900">＋</text>
      <g>
        <rect x="192" y="34" width="76" height="52" fill="#2F483B" stroke="#F1A3A6" stroke-width="1.5"/>
        <text x="230" y="65" fill="#F5E8D8" font-size="12" text-anchor="middle">热汤 B1</text>
        <rect x="192" y="100" width="76" height="52" fill="#2F483B" stroke="#F1A3A6" stroke-width="1.5"/>
        <text x="230" y="131" fill="#F5E8D8" font-size="12" text-anchor="middle">棺木 B2</text>
        <rect x="192" y="166" width="76" height="52" fill="#2F483B" stroke="#F1A3A6" stroke-width="1.5"/>
        <text x="230" y="197" fill="#F5E8D8" font-size="12" text-anchor="middle">女子 B3</text>
      </g>
      <g stroke="#F1A3A6" stroke-width="1.5" stroke-dasharray="4 3">
        <line x1="274" y1="60" x2="312" y2="60"/>
        <line x1="274" y1="126" x2="312" y2="126"/>
        <line x1="274" y1="192" x2="312" y2="192"/>
      </g>
      <text x="356" y="65" fill="#F1A3A6" font-size="14" font-weight="700" text-anchor="middle">→ 饥饿</text>
      <text x="356" y="131" fill="#F1A3A6" font-size="14" font-weight="700" text-anchor="middle">→ 悲恸</text>
      <text x="356" y="197" fill="#F1A3A6" font-size="14" font-weight="700" text-anchor="middle">→ 渴望</text>
    `,
    wertheimer: `
      <rect width="420" height="260" fill="#1B2822"/>
      <text x="210" y="34" fill="#F1A3A6" font-size="12" text-anchor="middle" font-family="IBM Plex Mono, monospace">LAW OF PROXIMITY · 1923</text>
      <g fill="#F5E8D8">
        <circle cx="62" cy="96" r="10"/><circle cx="90" cy="96" r="10"/>
        <circle cx="176" cy="96" r="10"/><circle cx="204" cy="96" r="10"/>
        <circle cx="290" cy="96" r="10"/><circle cx="318" cy="96" r="10"/>
      </g>
      <g fill="none" stroke="#F1A3A6" stroke-width="1.8" stroke-dasharray="4 3">
        <rect x="44" y="76" width="64" height="40"/>
        <rect x="158" y="76" width="64" height="40"/>
        <rect x="272" y="76" width="64" height="40"/>
      </g>
      <line x1="44" y1="150" x2="376" y2="150" stroke="rgba(245,232,216,0.28)" stroke-dasharray="3 4"/>
      <g fill="#F1A3A6">
        <rect x="136" y="172" width="66" height="48"/>
      </g>
      <g fill="#F5E8D8">
        <circle cx="234" cy="196" r="24"/>
      </g>
      <text x="210" y="242" fill="#E4D9C9" font-size="12" text-anchor="middle">近距强制分组：大脑先读「成对关系」，再读单个零件</text>
    `,
    warburg: `
      <rect width="420" height="260" fill="#1B2822"/>
      <rect x="34" y="26" width="352" height="196" fill="#121A16" stroke="#F5E8D8" stroke-width="1.5"/>
      <rect x="54" y="46" width="84" height="62" fill="#F5E8D8"/>
      <rect x="154" y="42" width="102" height="72" fill="#F1A3A6"/>
      <rect x="274" y="50" width="90" height="58" fill="#F5E8D8"/>
      <rect x="66" y="128" width="94" height="72" fill="#2F483B" stroke="#F1A3A6" stroke-width="1.5"/>
      <rect x="178" y="132" width="76" height="64" fill="#F5E8D8"/>
      <rect x="272" y="124" width="92" height="76" fill="#F1A3A6"/>
      <path d="M138 78 L154 78 M256 78 L274 78 M196 114 L196 132 M254 164 L272 164" stroke="#F5E8D8" stroke-width="1.6" stroke-dasharray="3 2"/>
      <text x="210" y="244" fill="#F1A3A6" font-size="12" text-anchor="middle">63 块黑布展板 · 图像间隔即是思考空间</text>
    `,
    eisenstein: `
      <rect width="420" height="260" fill="#1B2822"/>
      <rect x="38" y="66" width="106" height="106" fill="#F1A3A6"/>
      <text x="91" y="126" fill="#161817" font-size="38" font-weight="900" text-anchor="middle">水</text>
      <text x="166" y="126" fill="#F5E8D8" font-size="26" font-weight="900" text-anchor="middle">×</text>
      <circle cx="238" cy="119" r="53" fill="#2F483B" stroke="#F1A3A6" stroke-width="2"/>
      <text x="238" y="131" fill="#F5E8D8" font-size="38" font-weight="900" text-anchor="middle">目</text>
      <text x="312" y="126" fill="#F1A3A6" font-size="24" font-weight="900" text-anchor="middle">＝</text>
      <rect x="332" y="76" width="60" height="86" fill="#F5E8D8"/>
      <text x="362" y="131" fill="#161817" font-size="36" font-weight="900" text-anchor="middle">泪</text>
      <text x="210" y="220" fill="#E4D9C9" font-size="12.5" text-anchor="middle">两个具体物象相撞，生出两者之外的抽象新概念</text>
    `,
    "berger-dondis": `
      <rect width="420" height="260" fill="#1B2822"/>
      <rect x="44" y="34" width="164" height="176" fill="#F5E8D8"/>
      <rect x="212" y="34" width="164" height="176" fill="#F1A3A6"/>
      <line x1="210" y1="24" x2="210" y2="218" stroke="#161817" stroke-width="3"/>
      <rect x="66" y="60" width="120" height="90" fill="#2F483B"/>
      <circle cx="126" cy="105" r="24" fill="#F5E8D8"/>
      <text x="126" y="182" fill="#161817" font-size="12" font-weight="700" text-anchor="middle">古典油画构图</text>
      <rect x="234" y="60" width="120" height="90" fill="#161817"/>
      <circle cx="294" cy="105" r="24" fill="#F1A3A6"/>
      <text x="294" y="182" fill="#161817" font-size="12" font-weight="700" text-anchor="middle">当代杂志广告</text>
      <text x="210" y="242" fill="#E4D9C9" font-size="12" text-anchor="middle">跨页无字并置：视觉语法本身就是论证</text>
    `,
  };
  histSvg.innerHTML = map[id] || map.kuleshov;
}

function selectHistory(id) {
  const node = HISTORY_NODES.find((n) => n.id === id) || HISTORY_NODES[0];
  renderHistorySvg(node.id);
  hcMeta.textContent = `${node.year} · ${node.en}`;
  hcTitle.textContent = node.title;
  hcBody.textContent = node.body;
  hcTake.textContent = node.takeaway;
  document.querySelectorAll(".h-tab").forEach((t) => {
    t.setAttribute("aria-selected", String(t.dataset.hist === node.id));
  });
}

document.querySelectorAll(".h-tab").forEach((t) => {
  t.addEventListener("click", () => selectHistory(t.dataset.hist));
});
selectHistory("kuleshov");

// ==================== 4. 03 节：中缝尺度实验室 ====================
const seamCanvas = document.getElementById("seam-canvas");
const seamCtx = seamCanvas.getContext("2d");
const seamRange = document.getElementById("seam-range");
const seamPctRead = document.getElementById("seam-pct-read");
const srBadge = document.getElementById("sr-badge");
const srHop = document.getElementById("sr-hop");
const srGroup = document.getElementById("sr-group");
const srDesc = document.getElementById("sr-desc");

function drawSeamCanvas() {
  const rect = seamCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const dpr = pixelRatio(2);
  const bw = Math.round(rect.width * dpr);
  const bh = Math.round(rect.height * dpr);
  if (seamCanvas.width !== bw || seamCanvas.height !== bh) {
    seamCanvas.width = bw;
    seamCanvas.height = bh;
  }

  const gapPct = Number(seamRange.value);
  const info = evaluateSeamZone(gapPct);

  seamPctRead.textContent = `${info.gapPct}%`;
  srBadge.textContent = info.badge;
  srBadge.dataset.zone = info.zone;
  srHop.textContent = info.eyeHop;
  srGroup.textContent = info.groupStrength;
  srDesc.textContent = info.desc;

  const ctx = seamCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;

  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, W, H);

  const marginX = Math.max(18, W * 0.06);
  const spreadW = W - marginX * 2;
  const gapPx = (info.gapPct / 100) * spreadW;
  const panelW = (spreadW - gapPx) * 0.5;
  const panelH = Math.min(H * 0.62, panelW * 1.15);
  const topY = (H - panelH) * 0.54;
  const leftX = marginX;
  const rightX = marginX + panelW + gapPx;

  // 左联粉底 + 深绿方
  ctx.fillStyle = PALETTE.rose;
  ctx.fillRect(leftX, topY, panelW, panelH);
  const sqW = Math.min(panelW * 0.56, panelH * 0.5);
  const sqH = panelH * 0.56;
  ctx.fillStyle = PALETTE.pine;
  ctx.fillRect(leftX + panelW - sqW - Math.min(12, panelW * 0.06), topY + (panelH - sqH) / 2, sqW, sqH);

  // 右联绿底 + 粉红圆
  ctx.fillStyle = PALETTE.pine;
  ctx.fillRect(rightX, topY, panelW, panelH);
  const cr = Math.min(panelW * 0.34, panelH * 0.29);
  ctx.fillStyle = PALETTE.roseSoft;
  ctx.beginPath();
  ctx.arc(rightX + cr + Math.min(12, panelW * 0.06), topY + panelH * 0.5, cr, 0, Math.PI * 2);
  ctx.fill();

  // 中缝标尺
  const seamStart = leftX + panelW;
  const seamEnd = rightX;
  const midX = (seamStart + seamEnd) * 0.5;
  const rulerY = topY + panelH + 22;

  ctx.strokeStyle = info.zone === "isolated" ? PALETTE.roseInk : PALETTE.pine;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(seamStart, rulerY - 6);
  ctx.lineTo(seamStart, rulerY + 6);
  ctx.moveTo(seamEnd, rulerY - 6);
  ctx.lineTo(seamEnd, rulerY + 6);
  ctx.moveTo(seamStart, rulerY);
  ctx.lineTo(seamEnd, rulerY);
  ctx.stroke();

  ctx.font = `600 12px "IBM Plex Mono", monospace`;
  ctx.fillStyle = info.zone === "isolated" ? PALETTE.roseInk : PALETTE.pineDeep;
  ctx.textAlign = "center";
  ctx.fillText(`中缝 ${info.gapPct}%`, midX, rulerY + 18);

  // 格式塔分组弧线（近距连成一整条拱桥，超过 15% 断成两个独立小帽）
  const arcY = topY - 12;
  ctx.save();
  ctx.lineWidth = 2;
  if (info.zone === "isolated") {
    ctx.strokeStyle = PALETTE.roseInk;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(leftX + 12, arcY);
    ctx.quadraticCurveTo(leftX + panelW * 0.5, arcY - 18, leftX + panelW - 12, arcY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightX + 12, arcY);
    ctx.quadraticCurveTo(rightX + panelW * 0.5, arcY - 18, rightX + panelW - 12, arcY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.roseInk;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.fillText("各自成组（滑入隔离）", midX, Math.max(18, arcY - 22));
  } else {
    ctx.strokeStyle = info.zone === "loose" ? PALETTE.muted : PALETTE.pine;
    if (info.zone === "loose") ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(leftX + panelW * 0.25, arcY);
    ctx.quadraticCurveTo(midX, Math.max(16, arcY - 34), rightX + panelW * 0.75, arcY);
    ctx.stroke();
    ctx.fillStyle = info.zone === "loose" ? PALETTE.muted : PALETTE.pineDeep;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.fillText(info.zone === "kiss" ? "强碰撞合组" : info.zone === "sweet" ? "格式塔成对分组" : "弱分组（关联趋松）", midX, Math.max(18, arcY - 26));
  }
  ctx.restore();

  ctx.restore();
}

seamRange.addEventListener("input", drawSeamCanvas);
drawSeamCanvas();

// ==================== 5. 04 节：四种并置骨架 ====================
const patSvg = document.getElementById("pat-svg");
const piEn = document.getElementById("pi-en");
const piTitle = document.getElementById("pi-title");
const piScene = document.getElementById("pi-scene");
const piDesc = document.getElementById("pi-desc");
const piBridge = document.getElementById("pi-bridge");
const piTension = document.getElementById("pi-tension");
const patXrayBtn = document.getElementById("pat-xray");

let currentPat = "before-after";
let xrayOn = false;

function renderPatternSvg() {
  const x = xrayOn;
  let content = "";
  if (currentPat === "before-after") {
    content = `
      <rect width="520" height="300" fill="#F5E8D8"/>
      <rect x="30" y="34" width="228" height="232" fill="#2F483B"/>
      <rect x="262" y="34" width="228" height="232" fill="#F1A3A6"/>
      <!-- 相同建筑窗框轮廓（共性桥梁） -->
      <path d="M84 226 V108 Q144 64 204 108 V226 Z" fill="#1B2822"/>
      <path d="M316 226 V108 Q376 64 436 108 V226 Z" fill="#FAF4EB"/>
      <circle cx="376" cy="138" r="24" fill="#E57F86"/>
      <text x="144" y="250" fill="#F5E8D8" font-size="12" font-weight="700" text-anchor="middle">BEFORE · 改造前</text>
      <text x="376" y="250" fill="#24392E" font-size="12" font-weight="700" text-anchor="middle">AFTER · 改造后</text>
      ${x ? `
        <line x1="30" y1="226" x2="490" y2="226" stroke="#2F483B" stroke-width="2.5" stroke-dasharray="6 4"/>
        <line x1="30" y1="108" x2="490" y2="108" stroke="#2F483B" stroke-width="2.5" stroke-dasharray="6 4"/>
        <rect x="180" y="18" width="160" height="22" fill="#2F483B"/>
        <text x="260" y="33" fill="#FAF4EB" font-size="11.5" font-weight="700" text-anchor="middle">绿线：同机位基准桥梁</text>
        <line x1="260" y1="48" x2="260" y2="266" stroke="#9C303A" stroke-width="3"/>
      ` : ""}
    `;
  } else if (currentPat === "editorial-split") {
    content = `
      <rect width="520" height="300" fill="#F5E8D8"/>
      <rect x="30" y="32" width="230" height="236" fill="#FAF4EB" stroke="#161817" stroke-width="1.5"/>
      <rect x="260" y="32" width="230" height="236" fill="#2F483B" stroke="#161817" stroke-width="1.5"/>
      <text x="54" y="88" fill="#161817" font-size="22" font-weight="900">慢工手造</text>
      <rect x="54" y="106" width="136" height="8" fill="#F1A3A6"/>
      <rect x="54" y="126" width="168" height="6" fill="#525751"/>
      <rect x="54" y="142" width="152" height="6" fill="#525751"/>
      <rect x="54" y="210" width="84" height="28" fill="#2F483B"/>
      <text x="96" y="229" fill="#FAF4EB" font-size="11.5" font-weight="700" text-anchor="middle">方案甲</text>
      <text x="284" y="88" fill="#FAF4EB" font-size="22" font-weight="900">批量精工</text>
      <rect x="284" y="106" width="136" height="8" fill="#F1A3A6"/>
      <rect x="284" y="126" width="168" height="6" fill="#DFD4C4"/>
      <rect x="284" y="142" width="152" height="6" fill="#DFD4C4"/>
      <rect x="284" y="210" width="84" height="28" fill="#F1A3A6"/>
      <text x="326" y="229" fill="#161817" font-size="11.5" font-weight="700" text-anchor="middle">方案乙</text>
      ${x ? `
        <line x1="30" y1="88" x2="490" y2="88" stroke="#2F483B" stroke-width="2" stroke-dasharray="5 4"/>
        <line x1="30" y1="224" x2="490" y2="224" stroke="#2F483B" stroke-width="2" stroke-dasharray="5 4"/>
        <line x1="260" y1="22" x2="260" y2="278" stroke="#9C303A" stroke-width="3.5"/>
        <rect x="176" y="268" width="168" height="22" fill="#9C303A"/>
        <text x="260" y="283" fill="#FAF4EB" font-size="11.5" font-weight="700" text-anchor="middle">红轴：黑白反转立场切缝</text>
      ` : ""}
    `;
  } else if (currentPat === "visual-metaphor") {
    content = `
      <rect width="520" height="300" fill="#F5E8D8"/>
      <rect x="44" y="30" width="216" height="240" fill="#F1A3A6"/>
      <rect x="260" y="30" width="216" height="240" fill="#2F483B"/>
      <!-- 左侧有机半树冠与年轮 -->
      <path d="M260 66 C188 66 138 110 138 164 C138 202 164 234 260 234 Z" fill="#2F483B"/>
      <path d="M260 94 C208 94 172 124 172 164 C172 190 192 210 260 210" fill="none" stroke="#F1A3A6" stroke-width="3"/>
      <path d="M260 124 C228 124 206 140 206 164 C206 178 218 188 260 188" fill="none" stroke="#F1A3A6" stroke-width="2.5"/>
      <!-- 右侧工业条码严格沿同一半圆外轮廓截齐 -->
      <g fill="#F1A3A6">
        <rect x="264" y="68" width="14" height="164"/>
        <rect x="286" y="74" width="6" height="154"/>
        <rect x="300" y="80" width="18" height="142"/>
        <rect x="326" y="92" width="8" height="120"/>
        <rect x="342" y="108" width="14" height="92"/>
        <rect x="364" y="128" width="8" height="58"/>
      </g>
      ${x ? `
        <circle cx="260" cy="150" r="96" fill="none" stroke="#2F483B" stroke-width="2.5" stroke-dasharray="6 4"/>
        <line x1="260" y1="22" x2="260" y2="278" stroke="#9C303A" stroke-width="3"/>
        <rect x="150" y="14" width="220" height="22" fill="#2F483B"/>
        <text x="260" y="29" fill="#FAF4EB" font-size="11.5" font-weight="700" text-anchor="middle">绿圈：共享外轮廓把两物缝成一体</text>
      ` : ""}
    `;
  } else {
    content = `
      <rect width="520" height="300" fill="#F5E8D8"/>
      <rect x="36" y="34" width="224" height="232" fill="#F1A3A6"/>
      <rect x="260" y="34" width="224" height="232" fill="#FAF4EB" stroke="#161817" stroke-width="1.5"/>
      <!-- 左侧温柔圆弧波纹 -->
      <circle cx="148" cy="150" r="64" fill="#FAF4EB"/>
      <circle cx="148" cy="150" r="40" fill="#E57F86"/>
      <circle cx="148" cy="150" r="18" fill="#2F483B"/>
      <!-- 右侧冷静锐利文字断言 -->
      <text x="286" y="106" fill="#161817" font-size="24" font-weight="900">越柔和的包装</text>
      <text x="286" y="142" fill="#9C303A" font-size="24" font-weight="900">越藏着锋芒</text>
      <line x1="286" y1="164" x2="438" y2="164" stroke="#161817" stroke-width="1.5"/>
      <text x="286" y="192" fill="#525751" font-size="12.5">图温润 · 文犀利 → 预期反差生义</text>
      ${x ? `
        <line x1="36" y1="150" x2="484" y2="150" stroke="#2F483B" stroke-width="2" stroke-dasharray="5 4"/>
        <line x1="260" y1="24" x2="260" y2="276" stroke="#9C303A" stroke-width="3"/>
        <rect x="166" y="268" width="188" height="22" fill="#9C303A"/>
        <text x="260" y="283" fill="#FAF4EB" font-size="11.5" font-weight="700" text-anchor="middle">红轴：柔和图像 × 锋利断言</text>
      ` : ""}
    `;
  }
  patSvg.innerHTML = content;
}

function selectPattern(id) {
  currentPat = id;
  const item = PATTERNS.find((p) => p.id === id) || PATTERNS[0];
  piEn.textContent = item.en;
  piTitle.textContent = item.label;
  piScene.textContent = `适用：${item.scene}`;
  piDesc.textContent = item.desc;
  piBridge.textContent = item.bridge;
  piTension.textContent = item.tension;
  document.querySelectorAll(".pat-tab").forEach((t) => {
    t.setAttribute("aria-selected", String(t.dataset.pat === item.id));
  });
  renderPatternSvg();
}

document.querySelectorAll(".pat-tab").forEach((t) => {
  t.addEventListener("click", () => selectPattern(t.dataset.pat));
});
patXrayBtn.addEventListener("click", () => {
  xrayOn = !xrayOn;
  patXrayBtn.setAttribute("aria-pressed", String(xrayOn));
  patXrayBtn.textContent = xrayOn ? "隐藏结构透视线" : "显出桥梁与冲突轴";
  renderPatternSvg();
});
selectPattern("before-after");

// ==================== 6. 05 节：什么时候别用（翻转改法卡） ====================
function renderAvoidSvg(id, fixed) {
  if (id === "crowd") {
    return fixed
      ? `<rect width="320" height="156" fill="#1B2822"/>
         <rect x="18" y="18" width="180" height="120" fill="#F1A3A6"/>
         <rect x="208" y="18" width="94" height="34" fill="#2F483B" stroke="#F5E8D8" stroke-width="1"/>
         <rect x="208" y="61" width="94" height="34" fill="#2F483B" stroke="#F5E8D8" stroke-width="1"/>
         <rect x="208" y="104" width="94" height="34" fill="#2F483B" stroke="#F5E8D8" stroke-width="1"/>
         <text x="108" y="84" fill="#161817" font-size="14" font-weight="900" text-anchor="middle">唯一主角</text>`
      : `<rect width="320" height="156" fill="#1B2822"/>
         <rect x="14" y="20" width="68" height="116" fill="#F1A3A6"/>
         <rect x="88" y="20" width="68" height="116" fill="#DFAD24"/>
         <rect x="162" y="20" width="68" height="116" fill="#4B86B8"/>
         <rect x="236" y="20" width="68" height="116" fill="#E57F86"/>
         <rect x="78" y="64" width="164" height="28" fill="#161817"/>
         <text x="160" y="83" fill="#FAF4EB" font-size="12.5" font-weight="700" text-anchor="middle">四块齐喊 · 彼此抵消</text>`;
  }
  if (id === "random") {
    return fixed
      ? `<rect width="320" height="156" fill="#1B2822"/>
         <rect x="26" y="24" width="134" height="108" fill="#F1A3A6"/>
         <rect x="160" y="24" width="134" height="108" fill="#2F483B"/>
         <rect x="92" y="48" width="54" height="60" fill="#2F483B"/>
         <circle cx="204" cy="78" r="30" fill="#F1A3A6"/>
         <line x1="160" y1="24" x2="160" y2="132" stroke="#F5E8D8" stroke-width="2"/>`
      : `<rect width="320" height="156" fill="#1B2822"/>
         <rect x="26" y="24" width="134" height="108" fill="#6E5239"/>
         <circle cx="88" cy="78" r="24" fill="#3B2717"/>
         <rect x="160" y="24" width="134" height="108" fill="#D5E3EE"/>
         <polyline points="176,108 206,68 238,94 276,46" fill="none" stroke="#1E5F8A" stroke-width="3"/>
         <circle cx="160" cy="78" r="15" fill="#161817"/>
         <text x="160" y="84" fill="#FAF4EB" font-size="16" font-weight="900" text-anchor="middle">?</text>`;
  }
  return fixed
    ? `<rect width="320" height="156" fill="#1B2822"/>
       <rect x="22" y="16" width="276" height="124" fill="#F5E8D8"/>
       <circle cx="160" cy="78" r="32" fill="#2F483B"/>
       <text x="160" y="128" fill="#525751" font-size="11.5" text-anchor="middle">单主留白隔离 · 安静传达</text>`
    : `<rect width="320" height="156" fill="#1B2822"/>
       <rect x="22" y="16" width="138" height="124" fill="#F5E8D8"/>
       <circle cx="91" cy="78" r="28" fill="#2F483B"/>
       <rect x="160" y="16" width="138" height="124" fill="#9C303A"/>
       <polygon points="229,44 264,110 194,110" fill="#F5E8D8"/>
       <text x="229" y="130" fill="#F5E8D8" font-size="11" text-anchor="middle">多余强对抗</text>`;
}

function syncAvoidCard(card) {
  const id = card.dataset.avoid;
  const fixed = card.dataset.fixed === "true";
  const item = ANTI_CASES.find((a) => a.id === id);
  if (!item) return;
  card.querySelector(".ac-svg").innerHTML = renderAvoidSvg(id, fixed);
  card.querySelector(`[data-status="${id}"]`).textContent = fixed ? item.rightLabel : item.wrongLabel;
  card.querySelector(`[data-text="${id}"]`).textContent = fixed ? item.rightText : item.wrongText;
  const btn = card.querySelector(".ac-toggle");
  btn.setAttribute("aria-pressed", String(fixed));
  btn.textContent = fixed ? "看回错版" : "换用正法";
}

document.querySelectorAll(".avoid-card").forEach((card) => {
  syncAvoidCard(card);
  card.querySelector(".ac-toggle").addEventListener("click", () => {
    card.dataset.fixed = String(card.dataset.fixed !== "true");
    syncAvoidCard(card);
  });
});

// ==================== 7. 06 节：单变量小练习 ====================
let quizPicked = null;

function renderQuizSvg(opt, revealed) {
  // 同题材「木刻（古）× 电路（今）」，四个方案严格只差一个变量
  let lRectX = 72;
  let lRectW = 64;
  let lRectH = 104;
  let rCx = 186;
  let rR = 44;
  let lFill = PALETTE.pine;
  let rFill = PALETTE.roseSoft;
  let lineLeft = PALETTE.roseSoft;
  let lineRight = PALETTE.pine;

  if (opt === "A") {
    // 仅中缝拉宽（外推到边缘，邻接断裂）
    lRectX = 14;
    rCx = 222;
  } else if (opt === "B") {
    // 仅重量失衡（左块特大，右圆过小）
    lRectX = 24;
    lRectW = 112;
    lRectH = 144;
    rCx = 168;
    rR = 23;
  } else if (opt === "D") {
    // 仅丢失共性桥梁（改用无关明黄与冷蓝）
    lFill = PALETTE.clashLeft;
    rFill = PALETTE.clashRight;
    lineLeft = "#161817";
    lineRight = "#FAF4EB";
  }

  const lRectY = 105 - lRectH / 2;
  const overlay = revealed
    ? (opt === "A"
        ? `<line x1="78" y1="30" x2="176" y2="30" stroke="#9C303A" stroke-width="2.5"/><rect x="86" y="18" width="84" height="20" fill="#9C303A"/><text x="128" y="32" fill="#FAF4EB" font-size="11" font-weight="700" text-anchor="middle">断缝 26%</text>`
        : opt === "B"
        ? `<line x1="30" y1="196" x2="250" y2="180" stroke="#9C303A" stroke-width="3"/><polygon points="140,188 130,204 150,204" fill="#9C303A"/><rect x="80" y="16" width="120" height="20" fill="#9C303A"/><text x="140" y="30" fill="#FAF4EB" font-size="11" font-weight="700" text-anchor="middle">左沉失衡</text>`
        : opt === "C"
        ? `<line x1="34" y1="192" x2="246" y2="192" stroke="#2F483B" stroke-width="2.5"/><polygon points="140,193 132,205 148,205" fill="#2F483B"/><rect x="74" y="16" width="132" height="20" fill="#2F483B"/><text x="140" y="30" fill="#FAF4EB" font-size="11" font-weight="700" text-anchor="middle">贴缝·互借·稳平</text>`
        : `<rect x="74" y="16" width="132" height="20" fill="#9C303A"/><text x="140" y="30" fill="#FAF4EB" font-size="11" font-weight="700" text-anchor="middle">四色割裂无桥</text>`)
    : "";

  return `
    <rect width="280" height="210" fill="#F5E8D8"/>
    <rect x="8" y="10" width="132" height="174" fill="#F1A3A6"/>
    <rect x="140" y="10" width="132" height="174" fill="#2F483B"/>
    <!-- 左木刻直方 -->
    <rect x="${lRectX}" y="${lRectY}" width="${lRectW}" height="${lRectH}" fill="${lFill}"/>
    <g stroke="${lineLeft}" stroke-width="1.6" opacity="0.85">
      <line x1="${lRectX + 12}" y1="${lRectY + 18}" x2="${lRectX + lRectW - 12}" y2="${lRectY + 18}"/>
      <line x1="${lRectX + 12}" y1="${lRectY + 34}" x2="${lRectX + lRectW - 18}" y2="${lRectY + 34}"/>
      <line x1="${lRectX + 12}" y1="${lRectY + 50}" x2="${lRectX + lRectW - 10}" y2="${lRectY + 50}"/>
      <line x1="${lRectX + 12}" y1="${lRectY + 66}" x2="${lRectX + lRectW - 20}" y2="${lRectY + 66}"/>
    </g>
    <!-- 右电路圆环 -->
    <circle cx="${rCx}" cy="105" r="${rR}" fill="${rFill}"/>
    <g stroke="${lineRight}" stroke-width="1.8" fill="none">
      <circle cx="${rCx}" cy="105" r="${Math.max(8, rR * 0.48)}"/>
      <line x1="${rCx - rR * 0.7}" y1="105" x2="${rCx - rR * 0.48}" y2="105"/>
      <line x1="${rCx + rR * 0.48}" y1="105" x2="${rCx + rR * 0.72}" y2="105"/>
      <circle cx="${rCx}" cy="105" r="3" fill="${lineRight}"/>
    </g>
    <line x1="140" y1="10" x2="140" y2="184" stroke="#161817" stroke-width="1" stroke-dasharray="3 3"/>
    ${overlay}
  `;
}

function renderAllQuiz(revealed) {
  for (const item of QUIZ_OPTIONS) {
    document.getElementById(`q-svg-${item.id}`).innerHTML = renderQuizSvg(item.id, revealed);
    const btn = document.querySelector(`.quiz-card[data-opt="${item.id}"]`);
    const res = document.querySelector(`[data-qres="${item.id}"]`);
    btn.classList.remove("is-right", "is-wrong");
    if (revealed) {
      res.textContent = item.variable;
      if (item.ok) btn.classList.add("is-right");
      else if (quizPicked === item.id) btn.classList.add("is-wrong");
    } else {
      res.textContent = "点击选择";
    }
    btn.setAttribute("aria-pressed", String(quizPicked === item.id));
  }
}

document.querySelectorAll(".quiz-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizPicked = btn.dataset.opt;
    const item = QUIZ_OPTIONS.find((q) => q.id === quizPicked);
    renderAllQuiz(true);
    document.getElementById("qv-title").textContent = item.ok
      ? `答对了！${item.tag}`
      : `再看一眼：你选的是「${item.tag}」（正确是方案 C）`;
    document.getElementById("qv-body").textContent = item.explain;
  });
});
renderAllQuiz(false);

// ==================== 8. 07 节：原海报放大灯箱 ====================
const posterOpen = document.getElementById("poster-open");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbZoom = document.getElementById("lb-zoom");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = false;
let lbSx = 0;
let lbSy = 0;

function updateLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoom.textContent = lbScale > 1 ? "复原 1.0×" : "放大 1.6×";
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  updateLbTransform();
  lightbox.hidden = false;
  posterOpen.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpen.setAttribute("aria-expanded", "false");
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoom.addEventListener("click", () => {
  lbScale = lbScale > 1 ? 1 : 1.6;
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  updateLbTransform();
});
lightbox.addEventListener("click", (e) => {
  if (e.target === lbStage) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDrag = true;
  lbSx = e.clientX - lbTx;
  lbSy = e.clientY - lbTy;
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbSx;
  lbTy = e.clientY - lbSy;
  updateLbTransform();
});
const endLb = () => { lbDrag = false; };
lbStage.addEventListener("pointerup", endLb);
lbStage.addEventListener("pointercancel", endLb);
