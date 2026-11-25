import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SCENES,
  DEFAULT_POSITIONS,
  SNAP_RADIUS,
  SNAP_HINT_RADIUS,
  getScenePreset,
  createInitialState,
  clampCoord,
  maybeSnap,
  analyzeLayout,
  sampleGaze,
  projectOntoWaypoints,
  DISTRACT_TIERS,
  CTA_TIERS,
  computeHierarchyOverride,
} from "./model.js";

// =========================================================================
// 1. 开场：Z 轨校准排布台（2D Canvas + 四节点磁吸拖拽 + 路径白点与底沿扫读轨）
// =========================================================================
const state = createInitialState();
const stageWrap = document.getElementById("z-stage-wrap");
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const nodeHandles = [...stageWrap.querySelectorAll(".node-handle")];
const gazeHandle = document.getElementById("gaze-handle");
const gazeRail = document.getElementById("gaze-rail");
const railTrack = document.getElementById("rail-track");
const railFill = document.getElementById("rail-fill");
const railThumb = document.getElementById("rail-thumb");
const railPct = document.getElementById("rail-pct");

const elPhase = document.getElementById("gaze-phase");
const elProgress = document.getElementById("gaze-progress");
const elShortHint = document.getElementById("hud-short-hint");
const elBadge = document.getElementById("diag-badge");
const elHeadline = document.getElementById("diag-headline");
const elReason = document.getElementById("diag-reason");
const elExtra = document.getElementById("dist-extra");
const elReplayLabel = document.getElementById("replay-label");

const btnDiag = document.getElementById("btn-diag");
const btnDistract = document.getElementById("btn-distract");
const btnWeak = document.getElementById("btn-weak");
const btnReset = document.getElementById("btn-reset");
const btnReplay = document.getElementById("btn-replay");
const sceneBtns = [...document.querySelectorAll("#scene-tabs .scene-btn")];

let stageW = 800;
let stageH = 440;
let dpr = 1;
let lastReadoutKey = "";

// 离屏静态布局缓存 + 视点局部脏矩形复原（大幅降低软件渲染帧耗，拖动与开场稳高帧率）
const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");
let bgDirty = true;
let needsDraw = true;
let lastSpot = null; // { x, y, r }（CSS 像素）
let cachedAnalysis = null;

// 共享几何尺寸：保证画布方块/卡片与 DOM 拖拽手柄 1:1 严格对齐，2560 宽屏同步放大
function getStageMetrics(w, h) {
  const compact = w < 540;
  const shortLandscape = h < 260 && !compact;
  const wide = w > 1600;
  const box = compact
    ? Math.min(58, Math.round(w * 0.155))
    : shortLandscape
      ? Math.min(64, Math.round(h * 0.26))
      : Math.min(176, Math.max(82, Math.round(h * 0.22)));
  const cardW = compact
    ? Math.min(132, Math.round(w * 0.36))
    : Math.min(312, Math.max(198, Math.round(w * 0.175)));
  const cardH = compact
    ? 52
    : shortLandscape
      ? 52
      : Math.min(96, Math.max(68, Math.round(h * 0.11)));
  return { compact, shortLandscape, wide, box, cardW, cardH };
}

// 精确射线-矩形边界距离：确保对角箭头（2→3、3→4）稳稳停在方块/卡片外缘之外，不刺入节点、不压序号圈
function rectEdgeDist(hw, hh, ang, gap = 0) {
  const ca = Math.abs(Math.cos(ang));
  const sa = Math.abs(Math.sin(ang));
  const tx = ca > 1e-4 ? hw / ca : Infinity;
  const ty = sa > 1e-4 ? hh / sa : Infinity;
  return Math.min(tx, ty) + gap;
}

function resizeCanvas() {
  const rect = stageWrap.getBoundingClientRect();
  stageW = Math.max(280, Math.round(rect.width));
  stageH = Math.max(180, Math.round(rect.height));
  // 窄屏手机上限 1.5 像素比（GUIDE.md 建议），兼顾清晰度与软渲染帧率
  dpr = pixelRatio(stageW < 540 ? 1.5 : 2);
  const pw = Math.round(stageW * dpr);
  const ph = Math.round(stageH * dpr);
  canvas.width = pw;
  canvas.height = ph;
  bgCanvas.width = pw;
  bgCanvas.height = ph;
  bgDirty = true;
  needsDraw = true;
  lastSpot = null;
  syncNodeHandles();
}

function syncNodeHandles() {
  const { box, cardW, cardH } = getStageMetrics(stageW, stageH);
  const hw = state.scene === "poster" ? box : cardW;
  const hh = state.scene === "poster" ? box : cardH;

  state.positions.forEach((p, i) => {
    const h = nodeHandles[i];
    h.style.left = `${(p.u * 100).toFixed(2)}%`;
    h.style.top = `${(p.v * 100).toFixed(2)}%`;
    h.style.width = `${hw}px`;
    h.style.height = `${hh}px`;
  });
}

function syncGazeControls(gaze) {
  const px = Math.round(gaze.u * stageW);
  const py = Math.round(gaze.v * stageH);
  gazeHandle.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;

  const pctStr = `${gaze.pct}%`;
  railFill.style.width = pctStr;
  railThumb.style.left = pctStr;
  railPct.textContent = pctStr;
  gazeRail.setAttribute("aria-valuenow", String(gaze.pct));
}

function syncHandlePositions() {
  syncNodeHandles();
}

function markLayoutDirty() {
  bgDirty = true;
  needsDraw = true;
  if (reducedMotion.matches) heroLoop.draw();
}

function markGazeDirty() {
  needsDraw = true;
  if (reducedMotion.matches) heroLoop.draw();
}

// 刷新遥测坞读数（仅在内容变化时改 DOM，避免高频无效重排）
function syncTelemetry(analysis, gaze) {
  const shortHint =
    analysis.status === "ok"
      ? "Z 轨已贯通"
      : state.distractor || state.weakCta
        ? "切下方开关排查"
        : state.scene === "poster" && Math.hypot(state.positions[2].u - 0.48, state.positions[2].v - 0.58) < 0.09
          ? "拖 3 号试试"
          : "拖 1–4 节点排查";

  const key = `${analysis.badge}|${analysis.shares.join(",")}|${analysis.distractorShare}|${gaze.progressText}|${gaze.phase}|${state.replaying}|${shortHint}`;
  if (key === lastReadoutKey) return;
  lastReadoutKey = key;

  elPhase.textContent = gaze.phase;
  elProgress.textContent = gaze.progressText;
  if (elShortHint) elShortHint.textContent = shortHint;

  elBadge.textContent = analysis.badge;
  elBadge.className = `diag-badge is-${analysis.status}`;
  elHeadline.textContent = analysis.headline;
  elReason.textContent = analysis.reason;

  for (let i = 0; i < 4; i++) {
    const valEl = document.getElementById(`share-${i}`);
    const barEl = document.getElementById(`bar-${i}`);
    const pillEl = document.querySelector(`.dist-pill[data-pill="${i}"]`);
    const share = analysis.shares[i];
    if (valEl) valEl.textContent = `${share}%`;
    if (barEl) {
      const pct = Math.max(12, Math.min(100, Math.round((share / 46) * 100)));
      barEl.style.height = `${pct}%`;
    }
    if (pillEl) pillEl.classList.toggle("is-weak", (i === 3 && state.weakCta) || share < 16);
  }

  if (analysis.distractorShare > 0) {
    elExtra.hidden = false;
    elExtra.textContent = `模型示意：中段干扰劫走约 ${analysis.distractorShare}%`;
  } else {
    elExtra.hidden = true;
  }

  elReplayLabel.textContent = state.replaying ? `扫读中 · ${gaze.pct}%` : "重播眼动 >>>";
}

function drawThickArrow(targetCtx, x1, y1, x2, y2, width, color, dashed = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 6) return;
  const ang = Math.atan2(dy, dx);
  const head = Math.min(width * 2.15, len * 0.35);

  targetCtx.save();
  targetCtx.strokeStyle = color;
  targetCtx.fillStyle = color;
  targetCtx.lineWidth = width;
  targetCtx.lineCap = "round";
  targetCtx.setLineDash(dashed ? [8, 8] : []);
  targetCtx.beginPath();
  targetCtx.moveTo(x1, y1);
  targetCtx.lineTo(x2 - Math.cos(ang) * head * 0.65, y2 - Math.sin(ang) * head * 0.65);
  targetCtx.stroke();

  if (!dashed) {
    targetCtx.setLineDash([]);
    targetCtx.beginPath();
    targetCtx.moveTo(x2, y2);
    targetCtx.lineTo(x2 - Math.cos(ang - 0.56) * head, y2 - Math.sin(ang - 0.56) * head);
    targetCtx.lineTo(x2 - Math.cos(ang + 0.56) * head, y2 - Math.sin(ang + 0.56) * head);
    targetCtx.closePath();
    targetCtx.fill();
  }
  targetCtx.restore();
}

function drawPosterMotif(targetCtx, motif, cx, cy, box, isWeakCta, isAction) {
  const half = box * 0.5;
  const fill = isAction && !isWeakCta ? "#ec3e0b" : isWeakCta && isAction ? "#163849" : "#13b5c2";
  const inner = isWeakCta && isAction ? "#6d8c9b" : "#001122";

  targetCtx.fillStyle = fill;
  targetCtx.fillRect(cx - half, cy - half, box, box);

  targetCtx.fillStyle = inner;
  targetCtx.strokeStyle = inner;

  if (motif === "circle") {
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, box * 0.31, 0, Math.PI * 2);
    targetCtx.fill();
  } else if (motif === "bars") {
    const pad = box * 0.16;
    const bw = box - pad * 2;
    targetCtx.fillRect(cx - half + pad, cy - half + pad, bw, box * 0.11);
    targetCtx.fillRect(cx - half + pad, cy - half + pad + box * 0.18, bw * 0.72, box * 0.11);
    targetCtx.fillRect(cx - half + pad, cy + box * 0.06, bw * 0.42, box * 0.32);
  } else if (motif === "triangle") {
    targetCtx.beginPath();
    targetCtx.moveTo(cx, cy - box * 0.3);
    targetCtx.lineTo(cx + box * 0.31, cy + box * 0.27);
    targetCtx.lineTo(cx - box * 0.31, cy + box * 0.27);
    targetCtx.closePath();
    targetCtx.fill();
  } else if (motif === "check") {
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, box * 0.3, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.strokeStyle = isWeakCta ? "#8fb3c2" : "#f0f1ec";
    targetCtx.lineWidth = Math.max(2.6, box * 0.065);
    targetCtx.lineCap = "round";
    targetCtx.lineJoin = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(cx - box * 0.13, cy + box * 0.01);
    targetCtx.lineTo(cx - box * 0.03, cy + box * 0.11);
    targetCtx.lineTo(cx + box * 0.16, cy - box * 0.1);
    targetCtx.stroke();
  }
}

function drawUiCard(targetCtx, node, cx, cy, w, h, isAction, isWeakCta) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  targetCtx.save();
  if (isAction) {
    targetCtx.fillStyle = isWeakCta ? "#0c2535" : "#ec3e0b";
    targetCtx.strokeStyle = isWeakCta ? "rgba(152,184,199,0.45)" : "#ff6b3d";
  } else {
    targetCtx.fillStyle = "#042336";
    targetCtx.strokeStyle = "rgba(19, 192, 209, 0.78)";
  }
  targetCtx.lineWidth = isAction && isWeakCta ? 1.4 : 1.6;
  targetCtx.setLineDash(isAction && isWeakCta ? [5, 4] : []);
  targetCtx.fillRect(x, y, w, h);
  targetCtx.strokeRect(x, y, w, h);
  targetCtx.setLineDash([]);

  targetCtx.fillStyle = isAction ? (isWeakCta ? "#587687" : "#f0f1ec") : "#13c0d1";
  targetCtx.fillRect(x, y, w, 4);

  const titleSize = Math.max(12, Math.min(18, w * 0.082));
  const subSize = Math.max(10.5, Math.min(14, w * 0.064));
  const padX = Math.max(10, Math.round(w * 0.06));
  targetCtx.fillStyle = isAction && isWeakCta ? "#89a8b8" : "#f0f1ec";
  targetCtx.font = `700 ${titleSize}px "Noto Sans SC", sans-serif`;
  targetCtx.textAlign = "left";
  targetCtx.textBaseline = "top";
  targetCtx.fillText(node.zh, x + padX, y + Math.round(h * 0.19));

  targetCtx.fillStyle = isAction ? (isWeakCta ? "#6d8c9b" : "rgba(240,241,236,0.92)") : "#98b8c7";
  targetCtx.font = `500 ${subSize}px "Noto Sans SC", sans-serif`;
  targetCtx.fillText(node.sub, x + padX, y + Math.round(h * 0.54));
  targetCtx.restore();
}

// 仅在布局状态或尺寸变化时把底图、网格、虚线环、箭头、四节点与文字画到离屏 bgCanvas
function rebuildBackgroundLayer(analysis) {
  const w = stageW;
  const h = stageH;
  const { compact, wide, box, cardW, cardH } = getStageMetrics(w, h);
  const scene = SCENES[state.scene];

  bgCtx.save();
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 1. 深海夜蓝底 + 原海报纵贯虚线网格
  bgCtx.fillStyle = "#001122";
  bgCtx.fillRect(0, 0, w, h);

  bgCtx.save();
  bgCtx.strokeStyle = "rgba(19, 192, 209, 0.14)";
  bgCtx.lineWidth = 1;
  bgCtx.setLineDash([4, 6]);
  const cols = compact ? 6 : wide ? 12 : 10;
  for (let i = 1; i < cols; i++) {
    const gx = Math.round((w / cols) * i) + 0.5;
    bgCtx.beginPath();
    bgCtx.moveTo(gx, 0);
    bgCtx.lineTo(gx, h);
    bgCtx.stroke();
  }
  const rows = 4;
  for (let j = 1; j < rows; j++) {
    const gy = Math.round((h / rows) * j) + 0.5;
    bgCtx.beginPath();
    bgCtx.moveTo(0, gy);
    bgCtx.lineTo(w, gy);
    bgCtx.stroke();
  }
  bgCtx.restore();

  const pts = state.positions.map((p) => ({ x: p.u * w, y: p.v * h }));
  const targetW = state.scene === "poster" ? box : cardW;
  const targetH = state.scene === "poster" ? box : cardH;

  // 2. 吸附参考框：平时隐藏、不写字，仅在拖动某节点靠近其标准角位时柔和淡现
  if (state.activeNode >= 0) {
    const idx = state.activeNode;
    const dp = DEFAULT_POSITIONS[idx];
    const cur = state.positions[idx];
    const dist = Math.hypot(cur.u - dp.u, cur.v - dp.v);
    if (dist < SNAP_HINT_RADIUS) {
      const prox = Math.max(0, Math.min(1, 1 - dist / SNAP_HINT_RADIUS));
      const snapped = dist <= SNAP_RADIUS;
      const rx = dp.u * w;
      const ry = dp.v * h;
      bgCtx.save();
      bgCtx.strokeStyle = snapped
        ? "rgba(67, 203, 207, 0.85)"
        : `rgba(67, 203, 207, ${(0.18 + prox * 0.55).toFixed(2)})`;
      bgCtx.fillStyle = `rgba(19, 192, 209, ${(prox * 0.11).toFixed(2)})`;
      bgCtx.setLineDash([5, 5]);
      bgCtx.lineWidth = snapped ? 1.8 : 1.3;
      bgCtx.fillRect(rx - targetW * 0.5, ry - targetH * 0.5, targetW, targetH);
      bgCtx.strokeRect(rx - targetW * 0.5, ry - targetH * 0.5, targetW, targetH);
      bgCtx.restore();
    }
  }

  // 3. 节点周围同心注意力扩散虚线环
  pts.forEach((pt, idx) => {
    const share = analysis.shares[idx] || 20;
    const baseR = (state.scene === "poster" ? box * 0.66 : cardW * 0.44) + share * (wide ? 0.62 : 0.42);
    const isEnd = idx === 3 && !state.weakCta;
    bgCtx.save();
    bgCtx.strokeStyle = isEnd ? "rgba(236, 62, 11, 0.44)" : "rgba(240, 241, 236, 0.24)";
    bgCtx.lineWidth = 1;
    bgCtx.setLineDash([3, 5]);
    bgCtx.beginPath();
    bgCtx.arc(pt.x, pt.y, baseR, 0, Math.PI * 2);
    bgCtx.stroke();
    bgCtx.beginPath();
    bgCtx.arc(pt.x, pt.y, baseR + (wide ? 18 : 13), 0, Math.PI * 2);
    bgCtx.stroke();
    bgCtx.restore();
  });

  // 4. 对角牵引辅助引导线（沿 2→3 对角走廊两侧画细虚线轨道，无额外眼眸干扰）
  if (state.diagonalCue && !state.distractor) {
    const p2 = pts[1];
    const p3 = pts[2];
    const dx = p3.x - p2.x;
    const dy = p3.y - p2.y;
    const dLen = Math.hypot(dx, dy);
    if (dLen > 60) {
      const nx = -dy / dLen;
      const ny = dx / dLen;
      const offset = compact ? 13 : wide ? 24 : 18;
      bgCtx.save();
      bgCtx.strokeStyle = "rgba(19, 192, 209, 0.24)";
      bgCtx.lineWidth = 1;
      bgCtx.setLineDash([3, 6]);
      for (const side of [-1, 1]) {
        bgCtx.beginPath();
        bgCtx.moveTo(p2.x + dx * 0.22 + nx * offset * side, p2.y + dy * 0.22 + ny * offset * side);
        bgCtx.lineTo(p2.x + dx * 0.78 + nx * offset * side, p2.y + dy * 0.78 + ny * offset * side);
        bgCtx.stroke();
      }
      bgCtx.restore();
    }
  }

  // 5. 实际计算出的模拟眼动路线箭头（射线与矩形边界精确求交，箭头尖始终停在方块外缘，绝不刺入节点或撞序号圈）
  const wpPts = analysis.waypoints.map((wp) => ({ ...wp, x: wp.u * w, y: wp.v * h }));
  const arrowW = compact ? 6.5 : Math.max(10, Math.round(box * 0.11));
  const distW = compact ? 148 : Math.min(276, Math.max(188, Math.round(w * 0.16)));
  const distH = Math.min(76, Math.max(54, Math.round(h * 0.095)));
  const halfOf = (wp) => {
    if (wp.kind === "distractor") return [distW * 0.5, distH * 0.5];
    if (wp.kind === "exit") return [0, 0];
    return state.scene === "poster" ? [box * 0.5, box * 0.5] : [cardW * 0.5, cardH * 0.5];
  };

  for (let i = 0; i < wpPts.length - 1; i++) {
    const a = wpPts[i];
    const b = wpPts[i + 1];
    const isHijackSeg = a.kind === "distractor" || b.kind === "distractor";
    const isExitSeg = b.kind === "exit";
    const isWeakDiag = i === 1 && !state.diagonalCue && !isHijackSeg;

    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const [hwA, hhA] = halfOf(a);
    const [hwB, hhB] = halfOf(b);
    const padA = a.kind === "exit" ? 4 : rectEdgeDist(hwA, hhA, ang, compact ? 3 : 4);
    const padB = b.kind === "exit" ? 4 : rectEdgeDist(hwB, hhB, ang, compact ? 5 : 6);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    if (dist <= padA + padB + 8) continue;

    const sx = a.x + Math.cos(ang) * padA;
    const sy = a.y + Math.sin(ang) * padA;
    const ex = b.x - Math.cos(ang) * padB;
    const ey = b.y - Math.sin(ang) * padB;

    const col = isHijackSeg ? "#ec3e0b" : isExitSeg ? "#8fb3c2" : isWeakDiag ? "rgba(19, 192, 209, 0.42)" : "#13c0d1";
    drawThickArrow(bgCtx, sx, sy, ex, ey, arrowW, col, isExitSeg || isWeakDiag);
  }

  // 6. 四个页面锚点与标牌
  pts.forEach((pt, idx) => {
    const node = scene.nodes[idx];
    const isAction = idx === 3;
    if (state.scene === "poster") {
      drawPosterMotif(bgCtx, node.motif, pt.x, pt.y, box, state.weakCta, isAction);
      bgCtx.save();
      bgCtx.font = `700 ${compact ? 11.5 : wide ? 17 : 13.5}px "Noto Sans SC", sans-serif`;
      bgCtx.fillStyle = isAction && !state.weakCta ? "#ff9270" : "#13c0d1";
      if (compact) {
        const isTop = state.positions[idx].v < 0.5;
        bgCtx.textAlign = "center";
        bgCtx.textBaseline = isTop ? "bottom" : "top";
        const lx = Math.max(44, Math.min(w - 44, isTop ? pt.x + 8 : pt.x));
        const ly = isTop ? Math.max(16, pt.y - box * 0.5 - 10) : Math.min(h - 16, pt.y + box * 0.5 + 10);
        bgCtx.fillText(node.zh, lx, ly);
      } else {
        const u = state.positions[idx].u;
        const marginNeed = wide ? 150 : 108;
        let leftSide = u < 0.52;
        if (leftSide && pt.x - box * 0.68 < marginNeed) leftSide = false;
        if (!leftSide && w - (pt.x + box * 0.68) < marginNeed) leftSide = true;
        bgCtx.textAlign = leftSide ? "right" : "left";
        bgCtx.textBaseline = "middle";
        const lx = leftSide ? pt.x - box * 0.68 : pt.x + box * 0.68;
        bgCtx.fillText(node.zh, lx, pt.y - (wide ? 12 : 9));
        bgCtx.font = `400 ${wide ? 13 : 11}px "Space Mono", monospace`;
        bgCtx.fillStyle = "#98b8c7";
        bgCtx.fillText(`${node.en} · ${analysis.shares[idx]}%`, lx, pt.y + (wide ? 13 : 10));
      }
      bgCtx.restore();
    } else {
      drawUiCard(bgCtx, node, pt.x, pt.y, cardW, cardH, isAction, state.weakCta);
    }
  });

  // 7. 干扰弹窗
  if (state.distractor) {
    const dx = w * 0.5;
    const dy = h * 0.49;
    const dw = compact ? 148 : Math.min(276, Math.max(188, Math.round(w * 0.16)));
    const dh = Math.min(76, Math.max(54, Math.round(h * 0.095)));
    const popTitle = state.scene === "event" ? "早鸟立减 50%！" : "限时 5 折弹窗！";
    bgCtx.save();
    bgCtx.fillStyle = "#ec3e0b";
    bgCtx.fillRect(dx - dw / 2, dy - dh / 2, dw, dh);
    bgCtx.strokeStyle = "#f0f1ec";
    bgCtx.lineWidth = 2;
    bgCtx.strokeRect(dx - dw / 2, dy - dh / 2, dw, dh);
    bgCtx.fillStyle = "#f0f1ec";
    bgCtx.font = `900 ${compact ? 12.5 : wide ? 17 : 14}px "Noto Sans SC", sans-serif`;
    bgCtx.textAlign = "center";
    bgCtx.textBaseline = "middle";
    bgCtx.fillText(popTitle, dx, dy - Math.round(dh * 0.16));
    bgCtx.font = `400 ${wide ? 12.5 : 10.5}px "Space Mono", monospace`;
    bgCtx.fillText(`HIJACK · ${analysis.distractorShare}%`, dx, dy + Math.round(dh * 0.21));
    bgCtx.restore();
  }

  bgCtx.restore();
}

function drawHeroFrame(t, dt, { still }) {
  let animating = false;
  if (still) {
    state.replaying = false;
    if (state.gazeProgress !== 1) {
      state.gazeProgress = 1;
      needsDraw = true;
    }
  } else if (state.replaying) {
    state.replayClock += dt;
    state.gazeProgress = Math.min(1, state.replayClock / 1.95);
    if (state.gazeProgress >= 1) state.replaying = false;
    animating = true;
  } else if (!state.scrubbing && state.activeNode < 0 && t <= 2.0) {
    state.gazeProgress = Math.min(1, t / 1.95);
    animating = true;
  }

  // 静置且无脏标记时零重绘，省电且保持 60fps
  if (!bgDirty && !needsDraw && !animating && !still) return;

  if (bgDirty || !cachedAnalysis) {
    cachedAnalysis = analyzeLayout(state);
    rebuildBackgroundLayer(cachedAnalysis);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);
    bgDirty = false;
    lastSpot = null;
  } else if (lastSpot) {
    // 仅复原上一帧视点所占的局部矩形，避免整屏软件像素重刷
    const pad = 5;
    const sx = Math.max(0, Math.floor((lastSpot.x - lastSpot.r - pad) * dpr));
    const sy = Math.max(0, Math.floor((lastSpot.y - lastSpot.r - pad) * dpr));
    const ex = Math.min(bgCanvas.width, Math.ceil((lastSpot.x + lastSpot.r + pad) * dpr));
    const ey = Math.min(bgCanvas.height, Math.ceil((lastSpot.y + lastSpot.r + pad) * dpr));
    const sw = ex - sx;
    const sh = ey - sy;
    if (sw > 0 && sh > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(bgCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
    }
  }

  const analysis = cachedAnalysis;
  const gaze = sampleGaze(analysis.waypoints, state.gazeProgress);
  syncTelemetry(analysis, gaze);
  syncGazeControls(gaze);

  const w = stageW;
  const h = stageH;
  const { compact, wide, box, cardH } = getStageMetrics(w, h);
  const gx = gaze.u * w;
  const gy = gaze.v * h;
  const lastWp = analysis.waypoints[analysis.waypoints.length - 1];
  const arrivedAtNode = state.gazeProgress >= 0.985 && lastWp && lastWp.kind === "node";

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (arrivedAtNode) {
    // 抵达终点站时改画镂空聚焦环，让 4 号节点里的对勾图标保持完整清晰
    const ringR = state.scene === "poster" ? box * 0.42 : cardH * 0.46;
    const haloR = ringR + (compact ? 11 : 15);
    ctx.strokeStyle = state.distractor ? "rgba(236, 62, 11, 0.35)" : "rgba(67, 203, 207, 0.35)";
    ctx.lineWidth = compact ? 5 : 7;
    ctx.beginPath();
    ctx.arc(gx, gy, haloR - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#f0f1ec";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(gx, gy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    lastSpot = { x: gx, y: gy, r: haloR + 3 };
  } else {
    const outerR = compact ? 23 : wide ? 46 : 34;
    const midR = compact ? 14 : wide ? 26 : 20;
    const dotR = compact ? 8.5 : wide ? 11.5 : 9.5;

    // 轻量分层同心光斑（无 createRadialGradient 分配，软件渲染极速）
    ctx.fillStyle = state.distractor ? "rgba(236, 62, 11, 0.22)" : "rgba(67, 203, 207, 0.22)";
    ctx.beginPath();
    ctx.arc(gx, gy, outerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state.distractor ? "rgba(236, 62, 11, 0.44)" : "rgba(67, 203, 207, 0.44)";
    ctx.beginPath();
    ctx.arc(gx, gy, midR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(240, 241, 236, 0.94)";
    ctx.beginPath();
    ctx.arc(gx, gy, dotR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f0f1ec";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gx, gy, dotR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#001122";
    ctx.beginPath();
    ctx.arc(gx, gy, compact ? 3.4 : wide ? 4.8 : 4, 0, Math.PI * 2);
    ctx.fill();

    lastSpot = { x: gx, y: gy, r: outerR };
  }

  ctx.restore();
  needsDraw = false;
}

const heroLoop = loop(canvas, drawHeroFrame);

// 拖拽 4 个节点手柄（监听 window 确保快速甩动鼠标绝不断触；支持鼠标、触屏、方向键）
nodeHandles.forEach((btn, index) => {
  let dragId = null;

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragId = e.pointerId;
    try { btn.setPointerCapture(dragId); } catch {}
    state.activeNode = index;
    state.replaying = false;
    btn.classList.add("is-dragging");
    markLayoutDirty();
  });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerId !== dragId) return;
    const rect = stageWrap.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const v = (e.clientY - rect.top) / rect.height;
    const snapped = maybeSnap(index, u, v);
    state.positions[index].u = snapped.u;
    state.positions[index].v = snapped.v;
    syncHandlePositions();
    markLayoutDirty();
  });

  const endDrag = (e) => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    state.activeNode = -1;
    btn.classList.remove("is-dragging");
    markLayoutDirty();
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  btn.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.08 : 0.03;
    let moved = false;
    if (e.key === "ArrowLeft") { state.positions[index].u = clampCoord(state.positions[index].u - step); moved = true; }
    else if (e.key === "ArrowRight") { state.positions[index].u = clampCoord(state.positions[index].u + step); moved = true; }
    else if (e.key === "ArrowUp") { state.positions[index].v = clampCoord(state.positions[index].v - step); moved = true; }
    else if (e.key === "ArrowDown") { state.positions[index].v = clampCoord(state.positions[index].v + step); moved = true; }
    if (moved) {
      e.preventDefault();
      syncHandlePositions();
      markLayoutDirty();
    }
  });
});

// 1) 直接沿 Z 轨拖动路径白色视线点本体（投影到最近路径段，支持鼠标、触屏、方向键）
(() => {
  let dragId = null;
  let touching = false;

  const scrubAlongPath = (clientX, clientY) => {
    const rect = stageWrap.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const analysis = cachedAnalysis || analyzeLayout(state);
    state.gazeProgress = projectOntoWaypoints(analysis.waypoints, u, v, state.gazeProgress);
    markGazeDirty();
  };

  gazeHandle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragId = e.pointerId;
    try { gazeHandle.setPointerCapture(dragId); } catch {}
    state.scrubbing = true;
    state.replaying = false;
    gazeHandle.classList.add("is-dragging");
    scrubAlongPath(e.clientX, e.clientY);
  });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerId !== dragId) return;
    scrubAlongPath(e.clientX, e.clientY);
  });

  const endDot = (e) => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    state.scrubbing = false;
    gazeHandle.classList.remove("is-dragging");
    markGazeDirty();
  };
  window.addEventListener("pointerup", endDot);
  window.addEventListener("pointercancel", endDot);

  gazeHandle.addEventListener("touchstart", (e) => {
    if (!e.touches.length || dragId !== null) return;
    e.preventDefault();
    touching = true;
    state.scrubbing = true;
    state.replaying = false;
    scrubAlongPath(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  gazeHandle.addEventListener("touchmove", (e) => {
    if (!touching || !e.touches.length) return;
    e.preventDefault();
    scrubAlongPath(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  const endDotTouch = () => {
    if (!touching) return;
    touching = false;
    state.scrubbing = false;
    markGazeDirty();
  };
  gazeHandle.addEventListener("touchend", endDotTouch);
  gazeHandle.addEventListener("touchcancel", endDotTouch);

  gazeHandle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      state.replaying = false;
      state.scrubbing = true;
      state.gazeProgress = Math.max(0, Math.min(1, state.gazeProgress + (e.key === "ArrowRight" ? 0.06 : -0.06)));
      markGazeDirty();
    }
  });
})();

// 2) 舞台底沿路径进度轨（点击或左右拖动实时扫读 0–100%，同时作为 perf 触屏压测标靶）
(() => {
  let dragId = null;
  let touching = false;

  const scrubFromRailX = (clientX) => {
    const rect = railTrack.getBoundingClientRect();
    const span = Math.max(40, rect.width);
    const prog = Math.max(0, Math.min(1, (clientX - rect.left) / span));
    state.gazeProgress = prog;
    markGazeDirty();
  };

  gazeRail.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragId = e.pointerId;
    try { gazeRail.setPointerCapture(dragId); } catch {}
    state.scrubbing = true;
    state.replaying = false;
    gazeRail.classList.add("is-dragging");
    scrubFromRailX(e.clientX);
  });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerId !== dragId) return;
    scrubFromRailX(e.clientX);
  });

  const endRail = (e) => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    state.scrubbing = false;
    gazeRail.classList.remove("is-dragging");
    markGazeDirty();
  };
  window.addEventListener("pointerup", endRail);
  window.addEventListener("pointercancel", endRail);

  // 兜底原生 TouchEvent，确保 CDP 触屏压测同样顺滑跟手
  gazeRail.addEventListener("touchstart", (e) => {
    if (!e.touches.length || dragId !== null) return;
    e.preventDefault();
    touching = true;
    state.scrubbing = true;
    state.replaying = false;
    gazeRail.classList.add("is-dragging");
    scrubFromRailX(e.touches[0].clientX);
  }, { passive: false });

  gazeRail.addEventListener("touchmove", (e) => {
    if (!touching || !e.touches.length) return;
    e.preventDefault();
    scrubFromRailX(e.touches[0].clientX);
  }, { passive: false });

  const endRailTouch = () => {
    if (!touching) return;
    touching = false;
    state.scrubbing = false;
    gazeRail.classList.remove("is-dragging");
    markGazeDirty();
  };
  gazeRail.addEventListener("touchend", endRailTouch);
  gazeRail.addEventListener("touchcancel", endRailTouch);

  gazeRail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      state.replaying = false;
      state.scrubbing = true;
      state.gazeProgress = Math.max(0, Math.min(1, state.gazeProgress + (e.key === "ArrowRight" ? 0.06 : -0.06)));
      markGazeDirty();
    }
  });
})();

// 场景切换按钮：三个标本分别加载不同的预埋毛病，切标本即切三道诊断题
sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextScene = btn.dataset.scene;
    const preset = getScenePreset(nextScene);
    state.scene = nextScene;
    state.positions = preset.positions;
    state.diagonalCue = preset.diagonalCue;
    state.distractor = preset.distractor;
    state.weakCta = preset.weakCta;
    state.scrubbing = false;
    state.replaying = !reducedMotion.matches;
    state.replayClock = 0;
    state.gazeProgress = reducedMotion.matches ? 1 : 0;

    sceneBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncControlButtons();
    syncHandlePositions();
    markLayoutDirty();
  });
});

// 遥测坞控制按钮
function syncControlButtons() {
  btnDiag.classList.toggle("is-on", state.diagonalCue);
  btnDiag.setAttribute("aria-pressed", String(state.diagonalCue));
  btnDistract.classList.toggle("is-on", state.distractor);
  btnDistract.classList.toggle("is-danger", state.distractor);
  btnDistract.setAttribute("aria-pressed", String(state.distractor));
  btnWeak.classList.toggle("is-on", state.weakCta);
  btnWeak.classList.toggle("is-danger", state.weakCta);
  btnWeak.setAttribute("aria-pressed", String(state.weakCta));
}

btnDiag.addEventListener("click", () => {
  state.diagonalCue = !state.diagonalCue;
  syncControlButtons();
  markLayoutDirty();
});

btnDistract.addEventListener("click", () => {
  state.distractor = !state.distractor;
  syncControlButtons();
  markLayoutDirty();
});

btnWeak.addEventListener("click", () => {
  state.weakCta = !state.weakCta;
  syncControlButtons();
  markLayoutDirty();
});

btnReset.addEventListener("click", () => {
  state.positions = DEFAULT_POSITIONS.map((p) => ({ ...p }));
  state.diagonalCue = true;
  state.distractor = false;
  state.weakCta = false;
  state.gazeProgress = 1;
  state.replaying = false;
  syncControlButtons();
  syncHandlePositions();
  markLayoutDirty();
});

btnReplay.addEventListener("click", () => {
  state.scrubbing = false;
  if (reducedMotion.matches) {
    state.gazeProgress = 1;
    state.replaying = false;
    markGazeDirty();
    return;
  }
  state.replaying = true;
  state.replayClock = 0;
  state.gazeProgress = 0;
  markGazeDirty();
});

new ResizeObserver(() => {
  resizeCanvas();
  if (reducedMotion.matches) heroLoop.draw();
}).observe(stageWrap);
resizeCanvas();
syncControlButtons();

// =========================================================================
// 2. Section 01：五步路径拆解交互
// =========================================================================
const STOPS_DATA = [
  {
    badge: "01 · LEAD",
    kw: "曝光 EXPOSURE",
    title: "顶部吸引",
    orig: "原海报：「最先进入视野的区域，决定内容是否被关注」",
    plain: "左向右阅读文化里，视线的默认落脚点就在左上角。这里要放最容易辨认的身份锚点——品牌标志、一句直白的主标题，或者画面里最先亮起来的主角，让读者第一眼确认「这页和我有关」。",
    pitfall: "把冗长免责声明、灰淡小字或空洞装饰摆在左上，读者第一眼抓不到重点，后面三站根本走不到。",
    litNodes: ["ss-n0"],
    litLegs: [],
  },
  {
    badge: "02 · TRANSIT",
    kw: "浏览 BROWSE",
    title: "横向浏览",
    orig: "原海报：「沿水平方向快速浏览，获取关键信息与内容」",
    plain: "眼球顺着同一条水平线迅速向右滑动，只适合承接轻量、好扫读的补充信息——例如精简导航、时间地点标签或登录入口，不要在这里堆七八个菜单项把视线卡死。",
    pitfall: "顶栏塞满下拉菜单、搜索框和红点通知，横扫直接变成决策疲劳，视线根本下不去。",
    litNodes: ["ss-n0", "ss-n1"],
    litLegs: ["ss-leg1"],
  },
  {
    badge: "↘ · PULL",
    kw: "牵引 PULL",
    title: "对角牵引",
    orig: "原海报：「对角线具有更强的牵引力，引导视线自然向下」",
    plain: "右上看完后，眼睛准备开始下一段扫视，自然斜向回扫到左下。中段保持清爽留白，再放一张朝向左下倾斜的主视觉、产品动势或一句凝练核心主张，就能把眼波顺滑接住。",
    pitfall: "中段做成大片空白断层，或者在正中弹出刺眼的无关广告，都会让斜向扫视半路断线。",
    litNodes: ["ss-n1", "ss-mid", "ss-n3"],
    litLegs: ["ss-leg2"],
  },
  {
    badge: "03 · FOCUS",
    kw: "聚焦 FOCUS",
    title: "对角落点",
    orig: "原海报：「视觉停留的重点区域，承接核心信息」",
    plain: "对角线落回左下角，阅读速度在这里明显放慢。适合放最能打消疑虑的核心卖点、一句实证口碑或简洁的产品价值说明，为紧接着的行动按钮做最后一次铺垫。",
    pitfall: "把左下当成可有可无的脚注区，只塞版权小字，浪费了整条对角线辛辛苦苦送过来的注意力。",
    litNodes: ["ss-n3"],
    litLegs: ["ss-leg2"],
  },
  {
    badge: "04 · ACTION",
    kw: "行动 ACTION",
    title: "终点转化",
    orig: "原海报：「完整信息的落点，驱动行动与转化」",
    plain: "视线沿底边再次向右横扫，抵达整张版面的终点。因为经过前三站后自然注意力会下降，这里必须用全页唯一的高对比色块（如原海报右下那块朱红）承接主行动按钮，让决定零犹豫。",
    pitfall: "右下角放一个灰白细框按钮，或者同时并排三个同色按钮让人选，转化会在最后一厘米流失。",
    litNodes: ["ss-n3", "ss-n4"],
    litLegs: ["ss-leg3"],
  },
];

const stopTabs = [...document.querySelectorAll("#stops-tabs .stop-tab")];
const stopNodeIds = ["ss-n0", "ss-n1", "ss-mid", "ss-n3", "ss-n4"];
const stopLegIds = ["ss-leg1", "ss-leg2", "ss-leg3"];

function selectStop(idx) {
  const item = STOPS_DATA[idx];
  stopTabs.forEach((b, i) => {
    const on = i === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  stopNodeIds.forEach((id) => {
    document.getElementById(id)?.classList.toggle("is-lit", item.litNodes.includes(id));
  });
  stopLegIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("opacity", item.litLegs.includes(id) ? "1" : "0.2");
  });
  document.getElementById("sd-badge").textContent = item.badge;
  document.getElementById("sd-kw").textContent = item.kw;
  document.getElementById("sd-title").textContent = item.title;
  document.getElementById("sd-orig").textContent = item.orig;
  document.getElementById("sd-plain").textContent = item.plain;
  document.getElementById("sd-pitfall").innerHTML = `<strong>常见失误：</strong>${item.pitfall}`;
}

stopTabs.forEach((b, i) => b.addEventListener("click", () => selectStop(i)));
selectStop(0);

// =========================================================================
// 3. Section 02：层级改写实验（双三档滑杆 + RTL 翻转，线从卡底穿行、主标避开对角通道）
// =========================================================================
const ovState = {
  distractTier: 0, // 0 克制 / 1 抢眼 / 2 霸屏
  ctaTier: 2, // 0 淡对比 / 1 中对比 / 2 高对比
  rtl: false,
};

const ovDistractInput = document.getElementById("ov-distract");
const ovCtaInput = document.getElementById("ov-cta");
const ovRtlBtn = document.getElementById("ov-rtl");
const ovPresetBtns = [...document.querySelectorAll("#override-controls .ov-preset")];

function renderOverride() {
  const res = computeHierarchyOverride(ovState);
  const { distractTier, ctaTier, rtl } = ovState;
  const hijacked = distractTier === 2;
  const competing = distractTier === 1;
  const weakTerminal = ctaTier === 0;

  document.getElementById("ov-distract-val").textContent = DISTRACT_TIERS[distractTier];
  document.getElementById("ov-cta-val").textContent = CTA_TIERS[ctaTier];
  ovDistractInput.value = String(distractTier);
  ovCtaInput.value = String(ctaTier);
  ovRtlBtn.setAttribute("aria-pressed", String(rtl));
  ovRtlBtn.textContent = rtl ? "当前：RTL 右向左 ⇄ 切回 LTR" : "当前：LTR 左向右 ⇄ 切 RTL";

  ovPresetBtns.forEach((b) => {
    const active =
      (b.dataset.ov === "clean" && distractTier === 0 && ctaTier === 2 && !rtl) ||
      (b.dataset.ov === "hijack" && distractTier === 2) ||
      (b.dataset.ov === "fade" && distractTier !== 2 && ctaTier === 0) ||
      (b.dataset.ov === "rtl" && rtl && distractTier === 0 && ctaTier > 0);
    b.classList.toggle("is-active", active);
  });

  // 四块坐标（严格支持 LTR / RTL 水平镜像）
  const brandX = rtl ? 436 : 32;
  const navX = rtl ? 32 : 404;
  const evX = rtl ? 348 : 32;
  const ctaX = rtl ? 32 : 408;

  // 主标区严格避开 2 → 3 对角通道（LTR 靠左上，RTL 靠右上）
  const headX = rtl ? 336 : 32;
  const headW = 232;

  // 线锚在各块中心（线画在卡片图层之下，从边缘干净穿出，绝不压过任何一行字）
  const c1 = [brandX + 66, 46];
  const c2 = [navX + 82, 46];
  const c3 = [evX + 110, 293];
  const c4 = [ctaX + 80, 293];

  // 外角编号徽标位置
  const b1 = rtl ? [brandX + 132, 24] : [brandX, 24];
  const b2 = rtl ? [navX, 24] : [navX + 164, 24];
  const b3 = rtl ? [evX + 220, 264] : [evX, 264];
  const b4 = rtl ? [ctaX, 266] : [ctaX + 160, 266];

  // 终点按钮三档视觉映射
  const ctaFill = ctaTier === 0 ? "#f0f5f7" : ctaTier === 1 ? "#1b6b78" : "#ec3e0b";
  const ctaStroke = ctaTier === 0 ? "#9ab2bd" : ctaFill;
  const ctaText = ctaTier === 0 ? "#6a8390" : "#ffffff";

  // 图层 2：纯图形对角引导带（仅克制档显示，无文字叠线）
  const cueGraphic =
    distractTier === 0
      ? rtl
        ? `<polygon points="150,126 236,126 300,214 214,214" fill="rgba(8,124,138,0.1)" stroke="rgba(8,124,138,0.42)" stroke-dasharray="4 4"/>`
        : `<polygon points="364,126 450,126 386,214 300,214" fill="rgba(8,124,138,0.1)" stroke="rgba(8,124,138,0.42)" stroke-dasharray="4 4"/>`
      : "";

  // 图层 3：视线轨迹（画在不透明 UI 卡片下方，穿过留白间隙与对角通道，零划字）
  let traceLineSvg = "";
  let traceBadgeSvg = "";

  if (hijacked) {
    const mC = [300, 166];
    const mB = [rtl ? 488 : 112, 122];
    traceLineSvg = `
      <polyline points="${mC[0]},${mC[1]} ${c1[0]},${c1[1]} ${c3[0]},${c3[1]}" fill="none" stroke="#ec3e0b" stroke-width="3.6" stroke-dasharray="8 5" stroke-linejoin="round"/>
    `;
    traceBadgeSvg = `
      <circle cx="${mB[0]}" cy="${mB[1]}" r="14" fill="#071928" stroke="#ffffff" stroke-width="2.5"/>
      <text x="${mB[0]}" y="${mB[1] + 5}" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700">1</text>
      <circle cx="${b1[0]}" cy="${b1[1]}" r="12" fill="#ec3e0b"/><text x="${b1[0]}" y="${b1[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="700">2</text>
      <circle cx="${b3[0]}" cy="${b3[1]}" r="12" fill="#ec3e0b"/><text x="${b3[0]}" y="${b3[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="700">3</text>
      <text x="${ctaX + 80}" y="252" text-anchor="middle" fill="#c43006" font-size="11.5" font-weight="700">× 被中段分流</text>
    `;
  } else if (weakTerminal) {
    const exitStartX = rtl ? evX : evX + 220;
    const exitEndX = rtl ? exitStartX - 88 : exitStartX + 88;
    const midPt = competing ? `${rtl ? 248 : 352},198 ` : "";
    traceLineSvg = `
      <polyline points="${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${midPt}${c3[0]},${c3[1]}" fill="none" stroke="${competing ? "#d15a26" : "#087c8a"}" stroke-width="3.6" stroke-linejoin="round"/>
      <line x1="${exitStartX}" y1="308" x2="${exitEndX}" y2="338" stroke="#ec3e0b" stroke-width="3.4" stroke-dasharray="7 5"/>
    `;
    traceBadgeSvg = `
      <circle cx="${b1[0]}" cy="${b1[1]}" r="13" fill="#087c8a"/><text x="${b1[0]}" y="${b1[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">1</text>
      <circle cx="${b2[0]}" cy="${b2[1]}" r="12" fill="#087c8a"/><text x="${b2[0]}" y="${b2[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="700">2</text>
      <circle cx="${b3[0]}" cy="${b3[1]}" r="13" fill="#087c8a"/><text x="${b3[0]}" y="${b3[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">3</text>
      ${competing ? `<circle cx="${rtl ? 148 : 452}" cy="170" r="12" fill="#ec3e0b"/><text x="${rtl ? 148 : 452}" y="174" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">!</text>` : ""}
      <text x="${exitEndX + (rtl ? -52 : 52)}" y="341" text-anchor="middle" fill="#c43006" font-size="11.5" font-weight="700">视线滑出画外</text>
    `;
  } else if (competing) {
    const promoC = [rtl ? 248 : 352, 198];
    const promoBadge = [rtl ? 148 : 452, 170];
    traceLineSvg = `
      <polyline points="${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${promoC[0]},${promoC[1]} ${c3[0]},${c3[1]} ${c4[0]},${c4[1]}" fill="none" stroke="#d15a26" stroke-width="3.6" stroke-dasharray="9 5" stroke-linejoin="round"/>
    `;
    traceBadgeSvg = `
      <circle cx="${b1[0]}" cy="${b1[1]}" r="13" fill="#087c8a"/><text x="${b1[0]}" y="${b1[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">1</text>
      <circle cx="${b2[0]}" cy="${b2[1]}" r="12" fill="#087c8a"/><text x="${b2[0]}" y="${b2[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="700">2</text>
      <circle cx="${promoBadge[0]}" cy="${promoBadge[1]}" r="12" fill="#ec3e0b"/><text x="${promoBadge[0]}" y="${promoBadge[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">停</text>
      <circle cx="${b3[0]}" cy="${b3[1]}" r="13" fill="#087c8a"/><text x="${b3[0]}" y="${b3[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">3</text>
      <circle cx="${b4[0]}" cy="${b4[1]}" r="14" fill="#071928" stroke="${ctaTier === 2 ? "#ec3e0b" : "#087c8a"}" stroke-width="2.6"/><text x="${b4[0]}" y="${b4[1] + 5}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">4</text>
    `;
  } else {
    traceLineSvg = `
      <polyline points="${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${c3[0]},${c3[1]} ${c4[0]},${c4[1]}" fill="none" stroke="#087c8a" stroke-width="3.6" stroke-linejoin="round"/>
    `;
    traceBadgeSvg = `
      <circle cx="${b1[0]}" cy="${b1[1]}" r="13" fill="#087c8a"/><text x="${b1[0]}" y="${b1[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">1</text>
      <circle cx="${b2[0]}" cy="${b2[1]}" r="12" fill="#087c8a"/><text x="${b2[0]}" y="${b2[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="700">2</text>
      <circle cx="${b3[0]}" cy="${b3[1]}" r="13" fill="#087c8a"/><text x="${b3[0]}" y="${b3[1] + 4}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">3</text>
      <circle cx="${b4[0]}" cy="${b4[1]}" r="15" fill="#071928" stroke="${ctaTier === 2 ? "#ec3e0b" : "#087c8a"}" stroke-width="3"/><text x="${b4[0]}" y="${b4[1] + 5}" text-anchor="middle" fill="#ffffff" font-size="12.5" font-weight="700">4</text>
    `;
  }

  // 图层 4：中段内容（克制：主标靠侧避开对角；抢眼：促销条挤进通道；霸屏：红色横幅接管画心）
  let midCardsSvg = "";
  if (hijacked) {
    midCardsSvg = `
      <rect x="112" y="122" width="376" height="88" fill="#ec3e0b" stroke="#071928" stroke-width="2"/>
      <text x="300" y="160" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="900">全场 5 折限时抢！</text>
      <text x="300" y="188" text-anchor="middle" fill="#ffe2d8" font-size="12">霸屏档 · 强饱和色块直接截走第一眼</text>
    `;
  } else {
    midCardsSvg = `
      <rect x="${headX}" y="94" width="${headW}" height="68" fill="#ffffff" stroke="rgba(7,25,40,0.2)" stroke-dasharray="4 4"/>
      <text x="${headX + 16}" y="124" fill="#071928" font-size="15.5" font-weight="900">${rtl ? "主标靠右上让出通道" : "主标靠左上让出通道"}</text>
      <text x="${headX + 16}" y="146" fill="#395567" font-size="11.5">${competing ? "克制主标被下方横条抢戏" : "视线沿中段留白平稳斜渡"}</text>
    `;
    if (competing) {
      const px = rtl ? 148 : 252;
      midCardsSvg += `
        <rect x="${px}" y="170" width="200" height="56" fill="#fde2d6" stroke="#ec3e0b" stroke-width="1.8"/>
        <text x="${px + 100}" y="195" text-anchor="middle" fill="#8f1e00" font-size="13.5" font-weight="900">限时促销横条（抢眼档）</text>
        <text x="${px + 100}" y="214" text-anchor="middle" fill="#7c341d" font-size="11">挤进对角通道，眼球多停一站</text>
      `;
    }
  }

  document.getElementById("ov-svg").innerHTML = `
    <rect x="0" y="0" width="600" height="350" fill="#f7fbfc"/>
    <g stroke="rgba(7,25,40,0.08)" stroke-dasharray="4 5">
      <line x1="150" y1="12" x2="150" y2="338"/>
      <line x1="300" y1="12" x2="300" y2="338"/>
      <line x1="450" y1="12" x2="450" y2="338"/>
    </g>
    ${cueGraphic}
    ${traceLineSvg}
    <!-- 顶部品牌与轻导览（不透明底色盖在线上，零划字） -->
    <rect x="${brandX}" y="24" width="132" height="44" fill="${hijacked ? "#b8ccd3" : "#071928"}"/>
    <text x="${brandX + 66}" y="51" text-anchor="middle" fill="${hijacked ? "#395567" : "#edf4f6"}" font-size="13.5" font-weight="700">${rtl ? "RTL 品牌起笔" : "BRAND 标识"}</text>
    <rect x="${navX}" y="29" width="164" height="34" fill="#d9eaee" stroke="#087c8a"/>
    <text x="${navX + 82}" y="51" text-anchor="middle" fill="#071928" font-size="12">${rtl ? "登录 · 定价 · 功能" : "功能 · 定价 · 登录"}</text>
    ${midCardsSvg}
    <!-- 底部佐证与终点 CTA -->
    <rect x="${evX}" y="264" width="220" height="58" fill="#e2eff2" stroke="#071928"/>
    <text x="${evX + 16}" y="290" fill="#071928" font-size="13.5" font-weight="700">核心佐证与信任说明</text>
    <text x="${evX + 16}" y="309" fill="#395567" font-size="11.5">两行以内，帮人放下顾虑</text>
    <rect x="${ctaX}" y="266" width="160" height="54" fill="${ctaFill}" stroke="${ctaStroke}" stroke-width="1.6" stroke-dasharray="${weakTerminal ? "4 4" : "none"}"/>
    <text x="${ctaX + 80}" y="298" text-anchor="middle" fill="${ctaText}" font-size="14.5" font-weight="${weakTerminal ? 500 : 900}">${rtl ? "← 立即试用" : "立即试用 →"}</text>
    ${traceBadgeSvg}
  `;

  document.getElementById("ov-kicker").textContent = res.kicker;
  document.getElementById("ov-title").textContent = res.title;
  document.getElementById("ov-desc").textContent = res.desc;
  document.getElementById("ov-first").textContent = res.first;
  document.getElementById("ov-cta-out").textContent = res.cta;
  document.getElementById("ov-dir-out").textContent = res.dirLabel;
  document.getElementById("ov-why").textContent = res.why;
}

ovDistractInput.addEventListener("input", () => {
  ovState.distractTier = Number(ovDistractInput.value);
  renderOverride();
});

ovCtaInput.addEventListener("input", () => {
  ovState.ctaTier = Number(ovCtaInput.value);
  renderOverride();
});

ovRtlBtn.addEventListener("click", () => {
  ovState.rtl = !ovState.rtl;
  renderOverride();
});

const OV_PRESETS = {
  clean: { distractTier: 0, ctaTier: 2, rtl: false },
  hijack: { distractTier: 2, ctaTier: 2, rtl: false },
  fade: { distractTier: 0, ctaTier: 0, rtl: false },
  rtl: { distractTier: 0, ctaTier: 2, rtl: true },
};

ovPresetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = OV_PRESETS[b.dataset.ov];
    if (!p) return;
    Object.assign(ovState, p);
    renderOverride();
  });
});
renderOverride();

// =========================================================================
// 4. Section 04：三套真实界面 X 光透视器（轨迹线在 UI 卡底穿行、主标让出对角通道，零划字）
// =========================================================================
const XRAY_DATA = {
  saas: {
    tag: "USE CASE 01 · SAAS LANDING",
    title: "极简落地页首屏",
    summary: "页面上只有一个核心行动目标（注册、预约或下载），且整屏独立视觉锚点控制在 4–5 个以内（设计经验值），这时 Z 型最能把「认识你 → 理解价值 → 立刻动手」压缩进一次干脆扫视。",
    bullets: [
      "<strong>1 左上：</strong>品牌名 + 一句定位，不做长导航",
      "<strong>2 右上：</strong>轻入口（定价 / 登录），收住顶部横扫",
      "<strong>↘ 对角：</strong>主标靠左上让出通道，斜向配图顺势把眼波送向左下",
      "<strong>3 左下：</strong>一句硬核证据或关键数据，消除犹豫",
      "<strong>4 右下：</strong>高反差主行动按钮，一眼落点完成转化",
    ],
    bgSvg: `
      <rect x="0" y="0" width="640" height="380" fill="#001122"/>
      <rect x="24" y="20" width="592" height="340" fill="#041c2f" stroke="rgba(19,192,209,0.35)"/>
      <!-- 对角通道上的斜向产品示意图形（无文字，让视线顺斜道滑向左下） -->
      <polygon points="460,104 574,104 494,240 380,240" fill="rgba(19,192,209,0.16)" stroke="#13c0d1" stroke-width="1.4"/>
      <line x1="452" y1="138" x2="528" y2="138" stroke="rgba(67,203,207,0.45)" stroke-width="3"/>
      <line x1="436" y1="162" x2="508" y2="162" stroke="rgba(240,241,236,0.28)" stroke-width="2.5"/>
      <line x1="418" y1="186" x2="482" y2="186" stroke="rgba(240,241,236,0.22)" stroke-width="2.5"/>
    `,
    cardsSvg: `
      <rect x="54" y="38" width="130" height="34" fill="#13b5c2"/>
      <text x="119" y="60" text-anchor="middle" fill="#001122" font-size="13" font-weight="900">KINETA 云笔记</text>
      <rect x="412" y="38" width="174" height="34" fill="#072438" stroke="rgba(19,192,209,0.55)"/>
      <text x="462" y="60" text-anchor="middle" fill="#98b8c7" font-size="12.5">功能 · 定价</text>
      <rect x="514" y="43" width="64" height="24" fill="#041c2f" stroke="#13c0d1"/>
      <text x="546" y="59" text-anchor="middle" fill="#f0f1ec" font-size="11.5">登录</text>
      <!-- 主标靠左上，彻底让出右上的斜向对角通道 -->
      <rect x="54" y="100" width="244" height="114" fill="#072840" stroke="rgba(240,241,236,0.18)"/>
      <text x="72" y="135" fill="#f0f1ec" font-size="22" font-weight="900">把零散灵感</text>
      <text x="72" y="167" fill="#f0f1ec" font-size="22" font-weight="900">三秒理成清晰大纲</text>
      <text x="72" y="196" fill="#98b8c7" font-size="12.5">打开浏览器即写即存，零配置同步</text>
      <rect x="54" y="274" width="276" height="62" fill="#062236" stroke="rgba(19,192,209,0.4)"/>
      <text x="70" y="299" fill="#43cbcf" font-size="13" font-weight="700">支持离线单文件导出</text>
      <text x="70" y="321" fill="#98b8c7" font-size="12">无需绑定信用卡，随时带走你的全部文档</text>
      <rect x="424" y="278" width="162" height="54" fill="#ec3e0b"/>
      <text x="505" y="310" text-anchor="middle" fill="#f0f1ec" font-size="15" font-weight="900">免费开始试用 →</text>
    `,
    overlayPts: "50,55 590,55 50,305 590,305",
  },
  launch: {
    tag: "USE CASE 02 · PRODUCT POSTER",
    title: "单品发售与活动海报",
    summary: "户外灯箱、社群分享图或展讯海报只给路过读者极短的扫视时间。用对角构图把目光从主标题斜引到卖点，再落到右下角日期或扫码区，信息一遍读清。",
    bullets: [
      "<strong>1 左上：</strong>一眼看懂的主题大标题（少于 8 字）",
      "<strong>2 右上：</strong>届次、日期或限量编号，补齐时间坐标",
      "<strong>↘ 对角：</strong>斜切几何图形或实物剪影，制造向下动势",
      "<strong>3 左下：</strong>核心看点或三大亮点短条",
      "<strong>4 右下：</strong>醒目朱红预约卡或二维码行动区",
    ],
    bgSvg: `
      <rect x="0" y="0" width="640" height="380" fill="#001122"/>
      <rect x="24" y="20" width="592" height="340" fill="#021728" stroke="rgba(19,192,209,0.35)"/>
      <line x1="510" y1="98" x2="136" y2="256" stroke="#13c0d1" stroke-width="22" opacity="0.22"/>
      <circle cx="320" cy="180" r="52" fill="#083249" stroke="#13c0d1" stroke-width="2"/>
      <polygon points="320,144 350,200 290,200" fill="#13c0d1"/>
    `,
    cardsSvg: `
      <rect x="54" y="36" width="176" height="44" fill="#041e33" stroke="rgba(19,192,209,0.4)"/>
      <text x="142" y="67" text-anchor="middle" fill="#f0f1ec" font-size="25" font-weight="900">光影构图季</text>
      <rect x="470" y="40" width="116" height="36" fill="#13b5c2"/>
      <text x="528" y="63" text-anchor="middle" fill="#001122" font-size="13" font-weight="700">11.24 · 上海</text>
      <rect x="54" y="274" width="290" height="62" fill="#062236" stroke="rgba(19,192,209,0.4)"/>
      <text x="70" y="300" fill="#43cbcf" font-size="14.5" font-weight="700">12 场实战拆解 · 现场眼动演示</text>
      <text x="70" y="322" fill="#98b8c7" font-size="12">西岸艺术中心 B 馆 · 限时开放预约</text>
      <rect x="436" y="276" width="150" height="58" fill="#ec3e0b"/>
      <text x="511" y="302" text-anchor="middle" fill="#f0f1ec" font-size="15" font-weight="900">锁定席位</text>
      <text x="511" y="322" text-anchor="middle" fill="#ffdfd5" font-size="11">BOOK NOW &gt;&gt;&gt;</text>
    `,
    overlayPts: "50,58 590,58 50,305 590,305",
  },
  auth: {
    tag: "USE CASE 03 · MODAL & SIGNUP",
    title: "注册与引导弹窗",
    summary: "紧凑的弹窗或引导卡片最怕按钮乱放。左上标题交代用途、右上保留退出、对角线穿过表单输入框、左下放辅助切换（已有账号？）、右下放主提交按钮，肌肉记忆零摩擦。",
    bullets: [
      "<strong>1 左上：</strong>弹窗任务名（创建工作区）",
      "<strong>2 右上：</strong>清晰的关闭按钮 ×，给足安全感",
      "<strong>↘ 对角：</strong>2–3 个精简输入项，顺着视线从上填到下",
      "<strong>3 左下：</strong>次级退路（已有账号？直接登录）",
      "<strong>4 右下：</strong>唯一高对比主按钮（确认创建）",
    ],
    bgSvg: `
      <rect x="0" y="0" width="640" height="380" fill="#000b17"/>
      <rect x="104" y="34" width="432" height="312" fill="#052136" stroke="#13c0d1" stroke-width="1.6"/>
    `,
    cardsSvg: `
      <rect x="128" y="48" width="196" height="36" fill="#072840"/>
      <text x="140" y="73" fill="#f0f1ec" font-size="19.5" font-weight="900">创建新项目空间</text>
      <rect x="478" y="50" width="32" height="32" fill="#041c2f" stroke="#98b8c7"/>
      <text x="494" y="71" text-anchor="middle" fill="#f0f1ec" font-size="16">×</text>
      <rect x="132" y="108" width="378" height="44" fill="#001122" stroke="rgba(19,192,209,0.5)"/>
      <text x="148" y="135" fill="#98b8c7" font-size="13">项目名称：2026 春季视觉改版</text>
      <rect x="132" y="170" width="378" height="44" fill="#001122" stroke="rgba(19,192,209,0.5)"/>
      <text x="148" y="197" fill="#98b8c7" font-size="13">协作成员：design@studio.example</text>
      <rect x="128" y="280" width="166" height="34" fill="#052136"/>
      <text x="134" y="302" fill="#43cbcf" font-size="13" text-decoration="underline">已有空间？直接进入</text>
      <rect x="372" y="274" width="138" height="46" fill="#ec3e0b"/>
      <text x="441" y="302" text-anchor="middle" fill="#f0f1ec" font-size="14.5" font-weight="900">立即创建 →</text>
    `,
    overlayPts: "120,66 520,66 120,297 520,297",
  },
};

let currentXray = "saas";
let showXrayOverlay = true;
const xrayBtns = [...document.querySelectorAll("#xray-tabs .xr-btn")];
const xrayToggle = document.getElementById("xr-toggle");

function renderXray() {
  const item = XRAY_DATA[currentXray];
  const pts = item.overlayPts.split(" ").map((pair) => pair.split(",").map(Number));
  const overlayLine = showXrayOverlay
    ? `<polyline points="${item.overlayPts}" fill="none" stroke="#43cbcf" stroke-opacity="0.78" stroke-width="4" stroke-dasharray="9 6" stroke-linejoin="round"/>`
    : "";
  const overlayBadges = showXrayOverlay
    ? `<g>
        ${pts
          .map(
            ([x, y], i) => `
          <circle cx="${x}" cy="${y}" r="16" fill="${i === 3 ? "#ec3e0b" : "#13c0d1"}" fill-opacity="0.22" stroke="${i === 3 ? "#ec3e0b" : "#43cbcf"}" stroke-width="1.8"/>
          <circle cx="${x}" cy="${y}" r="10.5" fill="#001122" stroke="${i === 3 ? "#ec3e0b" : "#43cbcf"}" stroke-width="2"/>
          <text x="${x}" y="${y + 4}" text-anchor="middle" fill="#f0f1ec" font-size="11.5" font-weight="700">${i + 1}</text>
        `
          )
          .join("")}
      </g>`
    : "";

  document.getElementById("xray-svg").innerHTML = item.bgSvg + overlayLine + item.cardsSvg + overlayBadges;
  document.getElementById("xr-tag").textContent = item.tag;
  document.getElementById("xr-title").textContent = item.title;
  document.getElementById("xr-summary").textContent = item.summary;
  document.getElementById("xr-list").innerHTML = item.bullets.map((b) => `<li>${b}</li>`).join("");
}

xrayBtns.forEach((b) => {
  b.addEventListener("click", () => {
    currentXray = b.dataset.xr;
    xrayBtns.forEach((x) => {
      const on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-pressed", String(on));
    });
    renderXray();
  });
});

xrayToggle.addEventListener("click", () => {
  showXrayOverlay = !showXrayOverlay;
  xrayToggle.classList.toggle("is-on", showXrayOverlay);
  xrayToggle.setAttribute("aria-pressed", String(showXrayOverlay));
  xrayToggle.textContent = showXrayOverlay ? "透视 Z 轨热区：开" : "透视 Z 轨热区：关";
  renderXray();
});
renderXray();

// =========================================================================
// 5. Section 05：之字形长页 vs 统一竖轴眼动对比（编号与虚线独立走廊，绝不压字）
// =========================================================================
const zzBtns = [...document.querySelectorAll("#zz-switch .zz-btn")];
function renderZigzag(mode) {
  zzBtns.forEach((b) => {
    const on = b.dataset.zz === mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  const rows = [
    { y: 16, title: "01 · 自动版本快照", desc: "每次保存自动留档，随时回退任意时间点。" },
    { y: 86, title: "02 · 多端实时协作", desc: "评论直接锚在段落旁，减少来回截图沟通。" },
    { y: 156, title: "03 · 离线本地优先", desc: "断网也能流畅写作，联网后静默合并修改。" },
    { y: 226, title: "04 · 一键规范导出", desc: "支持单文件 HTML 与标准 PDF 无损分发。" },
  ];

  let body = `<rect x="0" y="0" width="760" height="296" fill="#f7fbfc"/>`;
  const anchors = [];
  let crossJumps = 0;

  rows.forEach((r, idx) => {
    const flip = mode === "zigzag" && idx % 2 === 1;
    const imgX = flip ? 416 : 24;
    const txtX = flip ? 24 : 374;
    const dotX = txtX + 20;
    const dotY = r.y + 28;
    const trackY = r.y + 52;

    body += `
      <rect x="${imgX}" y="${r.y}" width="320" height="56" fill="#d9eaee" stroke="#087c8a" stroke-dasharray="4 4"/>
      <rect x="${imgX + 14}" y="${r.y + 15}" width="26" height="26" fill="#087c8a" opacity="0.48"/>
      <text x="${imgX + 52}" y="${r.y + 33}" fill="#395567" font-size="12.5">功能配图 0${idx + 1}</text>
      <rect x="${txtX}" y="${r.y}" width="362" height="56" fill="#ffffff" stroke="#071928"/>
      <line x1="${txtX + 38}" y1="${r.y + 6}" x2="${txtX + 38}" y2="${r.y + 50}" stroke="rgba(7,25,40,0.12)"/>
      <text x="${txtX + 48}" y="${r.y + 24}" fill="#071928" font-size="13.5" font-weight="900">${r.title}</text>
      <text x="${txtX + 48}" y="${r.y + 43}" fill="#395567" font-size="11.5">${r.desc}</text>
    `;
    anchors.push({ dotX, dotY, trackY, endX: txtX + 210 });
    if (idx > 0 && Math.abs(anchors[idx].dotX - anchors[idx - 1].dotX) > 80) crossJumps++;
  });

  if (mode === "zigzag") {
    const pts = [];
    anchors.forEach((a, i) => {
      pts.push(`${a.dotX},${a.dotY}`);
      if (i < anchors.length - 1) {
        const gapY = rows[i].y + 63;
        const next = anchors[i + 1];
        pts.push(`${a.dotX},${gapY}`);
        pts.push(`${next.dotX},${gapY}`);
      }
    });
    body += `<polyline points="${pts.join(" ")}" fill="none" stroke="#ec3e0b" stroke-width="3.2" stroke-dasharray="7 5" stroke-linejoin="round"/>`;
    anchors.forEach((a, i) => {
      body += `<circle cx="${a.dotX}" cy="${a.dotY}" r="11" fill="#ec3e0b"/><text x="${a.dotX}" y="${a.dotY + 4}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">${i + 1}</text>`;
    });
    document.getElementById("zz-sub").textContent =
      "当前为「左右交错之字形」：视线在左右两列之间来回跨列折返，每换一行都得重新找标题左缘，还容易被配图绊住。";
    const jEl = document.getElementById("zz-jumps");
    jEl.textContent = `横向折返：${crossJumps} 次大跨度跳列`;
    jEl.classList.add("is-bad");
    document.getElementById("zz-axis").textContent = "标题左缘锚线：2 条错位";
  } else {
    const xs = anchors[0].dotX;
    body += `<line x1="${xs}" y1="20" x2="${xs}" y2="274" stroke="#087c8a" stroke-width="4"/>`;
    anchors.forEach((a, i) => {
      body += `<circle cx="${a.dotX}" cy="${a.dotY}" r="11" fill="#087c8a"/><text x="${a.dotX}" y="${a.dotY + 4}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">${i + 1}</text>`;
    });
    document.getElementById("zz-sub").textContent =
      "当前为「统一竖轴对齐」：所有标题锁在同一条垂直线上，眼睛直落扫完四条要点，想看哪条再向左看配图，扫读零绊脚。";
    const jEl = document.getElementById("zz-jumps");
    jEl.textContent = "横向折返：0 次（纯垂直扫读）";
    jEl.classList.remove("is-bad");
    document.getElementById("zz-axis").textContent = "标题左缘锚线：1 条直通";
  }

  document.getElementById("zz-svg").innerHTML = body;
}

zzBtns.forEach((b) => b.addEventListener("click", () => renderZigzag(b.dataset.zz)));
renderZigzag("zigzag");

// =========================================================================
// 6. Section 07：实战三题小练习（每题 4 选项 A/B/C/D，单变量中性描述）
// =========================================================================
const QUIZ = [
  {
    title: "题目 1：单屏发布页其他位置都已定稿，四版只改「免费试用」按钮的位置或样式，选哪版？",
    sub: "唯一变量：主行动按钮的落位与对比度。点选后在四张卡上同时叠画模拟眼动轨迹。",
    best: 2,
    explain:
      "方案 C 最稳：放在右下角顺接 Z 轨收口，并用全页唯一的高对比朱红实心块补回末端衰减的注意力。方案 A 位置对但描边对比弱，视线到末端容易滑走；方案 B 把按钮压在左下卖点正下方，少了底边横扫且右侧失重；方案 D 放右上，用户还没读完中段价值就被催促点击。",
    options: [
      {
        label: "方案 A",
        cap: "按钮置右下角，细描边透明样式",
        svgBase: `
          <rect x="14" y="14" width="60" height="18" fill="#13b5c2"/>
          <rect x="184" y="16" width="62" height="14" fill="#0d3a50"/>
          <rect x="44" y="52" width="172" height="40" fill="#072840" stroke="rgba(19,192,209,0.35)"/>
          <text x="130" y="76" text-anchor="middle" fill="#f0f1ec" font-size="11">核心价值主标</text>
          <rect x="14" y="118" width="112" height="26" fill="#062236"/>
          <rect x="164" y="118" width="82" height="26" fill="none" stroke="#5d7f90"/>
          <text x="205" y="135" text-anchor="middle" fill="#89a8b8" font-size="10.5">免费试用 →</text>
        `,
        svgTrace: `
          <polyline points="20,18 242,18 20,122" fill="none" stroke="#8fb3c2" stroke-width="2.8"/>
          <line x1="20" y1="122" x2="148" y2="152" stroke="#ec3e0b" stroke-width="2.8" stroke-dasharray="5 4"/>
          <text x="196" y="110" text-anchor="middle" fill="#ff9a7c" font-size="10">对比弱易跳过</text>
        `,
      },
      {
        label: "方案 B",
        cap: "按钮置左下角，朱红实心块样式",
        svgBase: `
          <rect x="14" y="14" width="60" height="18" fill="#13b5c2"/>
          <rect x="184" y="16" width="62" height="14" fill="#0d3a50"/>
          <rect x="44" y="50" width="172" height="36" fill="#072840" stroke="rgba(19,192,209,0.35)"/>
          <text x="130" y="72" text-anchor="middle" fill="#f0f1ec" font-size="11">核心价值主标</text>
          <rect x="14" y="96" width="114" height="20" fill="#062236"/>
          <rect x="14" y="122" width="90" height="26" fill="#ec3e0b"/>
          <text x="59" y="139" text-anchor="middle" fill="#fff" font-size="10.5" font-weight="700">免费试用 →</text>
        `,
        svgTrace: `
          <polyline points="20,18 242,18 59,134" fill="none" stroke="#ec3e0b" stroke-width="2.8" stroke-dasharray="5 3"/>
          <text x="192" y="136" text-anchor="middle" fill="#ff9a7c" font-size="10">右下空置失衡</text>
        `,
      },
      {
        label: "方案 C",
        cap: "按钮置右下角，朱红实心块样式",
        svgBase: `
          <rect x="14" y="14" width="60" height="18" fill="#13b5c2"/>
          <rect x="184" y="16" width="62" height="14" fill="#0d3a50"/>
          <rect x="44" y="52" width="172" height="40" fill="#072840" stroke="rgba(19,192,209,0.35)"/>
          <text x="130" y="76" text-anchor="middle" fill="#f0f1ec" font-size="11">核心价值主标</text>
          <rect x="14" y="118" width="112" height="26" fill="#062236"/>
          <rect x="164" y="118" width="82" height="26" fill="#ec3e0b"/>
          <text x="205" y="135" text-anchor="middle" fill="#fff" font-size="10.5" font-weight="700">免费试用 →</text>
        `,
        svgTrace: `
          <polyline points="20,18 242,18 20,122 242,122" fill="none" stroke="#43cbcf" stroke-width="3.2"/>
          <circle cx="242" cy="122" r="8" fill="#001122" stroke="#43cbcf" stroke-width="2"/>
          <text x="242" y="125" text-anchor="middle" fill="#fff" font-size="9.5">4</text>
        `,
      },
      {
        label: "方案 D",
        cap: "按钮置右上角，朱红实心块样式",
        svgBase: `
          <rect x="14" y="14" width="60" height="18" fill="#13b5c2"/>
          <rect x="164" y="12" width="82" height="24" fill="#ec3e0b"/>
          <text x="205" y="28" text-anchor="middle" fill="#fff" font-size="10.5" font-weight="700">免费试用 →</text>
          <rect x="44" y="52" width="172" height="40" fill="#072840" stroke="rgba(19,192,209,0.35)"/>
          <text x="130" y="76" text-anchor="middle" fill="#f0f1ec" font-size="11">核心价值主标</text>
          <rect x="14" y="118" width="112" height="26" fill="#062236"/>
        `,
        svgTrace: `
          <line x1="20" y1="22" x2="205" y2="22" stroke="#ec3e0b" stroke-width="3"/>
          <text x="196" y="135" text-anchor="middle" fill="#ff9a7c" font-size="10">未读价值先催点</text>
        `,
      },
    ],
  },
  {
    title: "题目 2：活动首屏四角已固定，四版只改中段区域，哪版最能顺畅把视线从右上引向左下？",
    sub: "唯一变量：2 号到 3 号之间的中段排布方式。",
    best: 1,
    explain:
      "方案 B 最顺畅：中段用朝向左下倾斜的主视觉顺势承接右上横扫，把眼波渡进左下亮点，再交棒给右下预约钮。方案 A 纯空无过渡容易造成上下断层；方案 C 中段同色朱红横幅反客为主劫持第一眼；方案 D 密排三栏日程表把稀疏首屏拉成密集阅读页。",
    options: [
      {
        label: "方案 A",
        cap: "中段保留等高纯空白，不做连接元素",
        svgBase: `
          <rect x="14" y="14" width="66" height="18" fill="#13b5c2"/>
          <rect x="184" y="14" width="62" height="18" fill="#0d3a50"/>
          <rect x="14" y="120" width="108" height="24" fill="#062236"/>
          <rect x="170" y="120" width="76" height="24" fill="#ec3e0b"/>
          <text x="208" y="136" text-anchor="middle" fill="#fff" font-size="10">锁定席位</text>
        `,
        svgTrace: `
          <line x1="20" y1="22" x2="240" y2="22" stroke="#8fb3c2" stroke-width="3"/>
          <line x1="230" y1="36" x2="72" y2="114" stroke="#ec3e0b" stroke-width="2.2" stroke-dasharray="4 6"/>
          <text x="130" y="80" text-anchor="middle" fill="#ff9a7c" font-size="10">中段空白易断层</text>
        `,
      },
      {
        label: "方案 B",
        cap: "中段放置朝向左下倾斜的展品视觉桥",
        svgBase: `
          <rect x="14" y="14" width="66" height="18" fill="#13b5c2"/>
          <rect x="184" y="14" width="62" height="18" fill="#0d3a50"/>
          <polygon points="184,46 218,46 92,106 58,106" fill="rgba(19,192,209,0.28)" stroke="#13c0d1"/>
          <rect x="14" y="120" width="108" height="24" fill="#062236"/>
          <rect x="170" y="120" width="76" height="24" fill="#ec3e0b"/>
          <text x="208" y="136" text-anchor="middle" fill="#fff" font-size="10">锁定席位</text>
        `,
        svgTrace: `
          <polyline points="20,18 242,18 20,122 242,122" fill="none" stroke="#43cbcf" stroke-width="3.2"/>
          <circle cx="138" cy="74" r="6" fill="#43cbcf"/>
        `,
      },
      {
        label: "方案 C",
        cap: "中段正中叠加同色朱红限时优惠横幅",
        svgBase: `
          <rect x="14" y="14" width="66" height="18" fill="#13b5c2"/>
          <rect x="184" y="14" width="62" height="18" fill="#0d3a50"/>
          <rect x="34" y="48" width="192" height="54" fill="#ec3e0b"/>
          <text x="130" y="79" text-anchor="middle" fill="#fff" font-size="11.5" font-weight="700">早鸟立减 50%</text>
          <rect x="14" y="120" width="108" height="24" fill="#062236"/>
          <rect x="170" y="120" width="76" height="24" fill="#ec3e0b"/>
        `,
        svgTrace: `
          <polyline points="130,75 40,22 62,130" fill="none" stroke="#ec3e0b" stroke-width="2.8" stroke-dasharray="5 3"/>
          <circle cx="130" cy="75" r="9" fill="#001122" stroke="#fff" stroke-width="2"/>
          <text x="130" y="79" text-anchor="middle" fill="#fff" font-size="9.5">1</text>
        `,
      },
      {
        label: "方案 D",
        cap: "中段排入三栏全宽详细日程文字表",
        svgBase: `
          <rect x="14" y="14" width="66" height="18" fill="#13b5c2"/>
          <rect x="184" y="14" width="62" height="18" fill="#0d3a50"/>
          <rect x="14" y="44" width="72" height="62" fill="#072840"/>
          <rect x="94" y="44" width="72" height="62" fill="#072840"/>
          <rect x="174" y="44" width="72" height="62" fill="#072840"/>
          <line x1="22" y1="58" x2="78" y2="58" stroke="#5c7d8e" stroke-width="3"/>
          <line x1="22" y1="72" x2="72" y2="72" stroke="#5c7d8e" stroke-width="3"/>
          <line x1="102" y1="58" x2="158" y2="58" stroke="#5c7d8e" stroke-width="3"/>
          <line x1="102" y1="72" x2="152" y2="72" stroke="#5c7d8e" stroke-width="3"/>
          <line x1="182" y1="58" x2="238" y2="58" stroke="#5c7d8e" stroke-width="3"/>
          <rect x="14" y="120" width="108" height="24" fill="#062236"/>
          <rect x="170" y="120" width="76" height="24" fill="#ec3e0b"/>
        `,
        svgTrace: `
          <path d="M22 58 H78 M102 58 H158 M182 58 H238 M22 76 H150" fill="none" stroke="#ec3e0b" stroke-width="2.4" stroke-dasharray="4 3"/>
          <text x="130" y="99" text-anchor="middle" fill="#ff9a7c" font-size="9.5">高密度卡住斜扫</text>
        `,
      },
    ],
  },
  {
    title: "题目 3：首屏往下滚到「四项核心功能」长列表，四版只改图文排布结构，哪版最省眼？",
    sub: "唯一变量：四组图文条目的对齐结构。参考 NN/g（2017）眼动研究结论判断。",
    best: 0,
    explain:
      "方案 A 最省眼：四行统一左图右文，所有小标题左缘锁在同一条垂直线上，眼球一次直落即可扫完全部要点。方案 B 逐行交错成之字形，每换一行都要横跨页面重找文字左缘；方案 C 全居中堆叠缺少固定左缘锚线；方案 D 双列瀑布错落高度令阅读次序模糊。",
    options: [
      {
        label: "方案 A",
        cap: "四行统一左图右文，标题锁在同一竖轴",
        svgBase: `
          <rect x="18" y="14" width="76" height="26" fill="#0d3a50"/><rect x="106" y="14" width="136" height="26" fill="#072840"/>
          <rect x="18" y="48" width="76" height="26" fill="#0d3a50"/><rect x="106" y="48" width="136" height="26" fill="#072840"/>
          <rect x="18" y="82" width="76" height="26" fill="#0d3a50"/><rect x="106" y="82" width="136" height="26" fill="#072840"/>
          <rect x="18" y="116" width="76" height="26" fill="#0d3a50"/><rect x="106" y="116" width="136" height="26" fill="#072840"/>
        `,
        svgTrace: `
          <line x1="114" y1="18" x2="114" y2="138" stroke="#43cbcf" stroke-width="3.6"/>
          <circle cx="114" cy="27" r="4.5" fill="#43cbcf"/><circle cx="114" cy="61" r="4.5" fill="#43cbcf"/>
          <circle cx="114" cy="95" r="4.5" fill="#43cbcf"/><circle cx="114" cy="129" r="4.5" fill="#43cbcf"/>
        `,
      },
      {
        label: "方案 B",
        cap: "四行按左图右文与右图左文逐行交替",
        svgBase: `
          <rect x="18" y="14" width="76" height="26" fill="#0d3a50"/><rect x="106" y="14" width="136" height="26" fill="#072840"/>
          <rect x="18" y="48" width="136" height="26" fill="#072840"/><rect x="166" y="48" width="76" height="26" fill="#0d3a50"/>
          <rect x="18" y="82" width="76" height="26" fill="#0d3a50"/><rect x="106" y="82" width="136" height="26" fill="#072840"/>
          <rect x="18" y="116" width="136" height="26" fill="#072840"/><rect x="166" y="116" width="76" height="26" fill="#0d3a50"/>
        `,
        svgTrace: `
          <polyline points="116,27 220,27 28,61 130,61 116,95 220,95 28,129" fill="none" stroke="#ec3e0b" stroke-width="2.8" stroke-dasharray="5 3"/>
        `,
      },
      {
        label: "方案 C",
        cap: "四行文字与配图均居中对齐单栏堆叠",
        svgBase: `
          <rect x="78" y="12" width="104" height="14" fill="#0d3a50"/>
          <line x1="92" y1="34" x2="168" y2="34" stroke="#6c92a4" stroke-width="4"/>
          <rect x="78" y="48" width="104" height="14" fill="#0d3a50"/>
          <line x1="70" y1="70" x2="190" y2="70" stroke="#6c92a4" stroke-width="4"/>
          <rect x="78" y="84" width="104" height="14" fill="#0d3a50"/>
          <line x1="98" y1="106" x2="162" y2="106" stroke="#6c92a4" stroke-width="4"/>
          <rect x="78" y="120" width="104" height="14" fill="#0d3a50"/>
          <line x1="76" y1="142" x2="184" y2="142" stroke="#6c92a4" stroke-width="4"/>
        `,
        svgTrace: `
          <polyline points="92,34 70,70 98,106 76,142" fill="none" stroke="#ec3e0b" stroke-width="2.6" stroke-dasharray="4 3"/>
        `,
      },
      {
        label: "方案 D",
        cap: "两列瀑布流，四张卡片按字数错落排布",
        svgBase: `
          <rect x="18" y="14" width="106" height="62" fill="#072840"/>
          <rect x="136" y="14" width="106" height="44" fill="#072840"/>
          <rect x="136" y="68" width="106" height="74" fill="#072840"/>
          <rect x="18" y="86" width="106" height="56" fill="#072840"/>
        `,
        svgTrace: `
          <polyline points="32,26 150,26 150,82 32,98" fill="none" stroke="#ec3e0b" stroke-width="2.6" stroke-dasharray="5 3"/>
        `,
      },
    ],
  },
];

let qIndex = 0;
const qAnswers = [null, null, null];
const qStepBtns = [...document.querySelectorAll("#quiz-steps .q-step")];
const qCardsWrap = document.getElementById("quiz-cards");
const qFeedback = document.getElementById("quiz-feedback");
const qScoreEl = document.getElementById("q-score");

function renderQuiz() {
  const q = QUIZ[qIndex];
  const picked = qAnswers[qIndex];

  qStepBtns.forEach((b, i) => {
    b.classList.toggle("is-active", i === qIndex);
    b.classList.toggle("is-done", qAnswers[i] === QUIZ[i].best);
    b.setAttribute("aria-pressed", String(i === qIndex));
  });

  const correctCount = qAnswers.filter((a, i) => a === QUIZ[i].best).length;
  qScoreEl.textContent = String(correctCount);

  document.getElementById("q-title").textContent = q.title;
  document.getElementById("q-sub").textContent = q.sub;

  qCardsWrap.innerHTML = q.options
    .map((opt, idx) => {
      const answered = picked !== null;
      const isPicked = picked === idx;
      const isBest = idx === q.best;
      let cls = "q-card";
      let statusTxt = "点此选择";
      if (answered) {
        if (isPicked && isBest) { cls += " is-picked-ok"; statusTxt = "✓ 选对了"; }
        else if (isPicked && !isBest) { cls += " is-picked-bad"; statusTxt = "× 路线受阻"; }
        else if (isBest) { cls += " is-best-reveal"; statusTxt = "推荐方案"; }
        else { statusTxt = "备选对比"; }
      }
      return `
        <button type="button" class="${cls}" data-opt="${idx}">
          <div class="q-card-head">
            <span class="q-opt-tag">${opt.label}</span>
            <span class="q-opt-status">${statusTxt}</span>
          </div>
          <svg viewBox="0 0 260 160" aria-hidden="true">
            ${opt.svgBase}
            ${answered ? opt.svgTrace : ""}
          </svg>
          <span class="q-card-cap">${opt.cap}</span>
        </button>
      `;
    })
    .join("");

  qCardsWrap.querySelectorAll(".q-card").forEach((card) => {
    card.addEventListener("click", () => {
      qAnswers[qIndex] = Number(card.dataset.opt);
      renderQuiz();
    });
  });

  if (picked !== null) {
    const ok = picked === q.best;
    qFeedback.hidden = false;
    qFeedback.classList.toggle("is-bad", !ok);
    document.getElementById("qf-verdict").textContent = ok
      ? `判断准确！${q.options[q.best].label} 的视线路径最稳`
      : `这一版路线卡壳了——对照看 ${q.options[q.best].label} 的实线轨迹`;
    document.getElementById("qf-explain").textContent = q.explain;
  } else {
    qFeedback.hidden = true;
  }
}

qStepBtns.forEach((b, i) => b.addEventListener("click", () => { qIndex = i; renderQuiz(); }));
document.getElementById("q-reset").addEventListener("click", () => {
  qAnswers.fill(null);
  qIndex = 0;
  renderQuiz();
});
renderQuiz();

// =========================================================================
// 7. Section 08：原海报放大灯箱（复用 #poster.src，支持拖拽平移 / 缩放 / Esc）
// =========================================================================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbScaleEl = document.getElementById("lb-scale");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDragId = null;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.25).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.75, +(lbScale - 0.25).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.75, Math.min(3, +(lbScale + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbScale <= 1) {
    closeLightbox();
    return;
  }
  e.preventDefault();
  lbDragId = e.pointerId;
  try { lbViewport.setPointerCapture(lbDragId); } catch {}
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbViewport.classList.add("is-dragging");
});

window.addEventListener("pointermove", (e) => {
  if (e.pointerId !== lbDragId) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});

const endLbDrag = (e) => {
  if (e.pointerId !== lbDragId) return;
  lbDragId = null;
  lbViewport.classList.remove("is-dragging");
};
window.addEventListener("pointerup", endLbDrag);
window.addEventListener("pointercancel", endLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
