import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  PRESETS,
  QUIZ_ITEMS,
  clamp,
  projectScene,
  solveOptics,
  vpsFromFocalYaw,
} from "./model.js";

// ==================== 调色板（逐像素实采 071 原海报） ====================
const C = {
  paper: "#FAF1E4",
  paperBright: "#FDF9F1",
  paperSand: "#F2E7D3",
  teal: "#0C625C",
  tealDeep: "#0B5D56",
  tealSoft: "rgba(12, 98, 92, 0.14)",
  tealRay: "rgba(12, 98, 92, 0.56)",
  tealShadow: "rgba(104, 134, 125, 0.72)",
  warmShadow: "rgba(164, 149, 130, 0.62)",
  orange: "#DF5320",
  orangeRay: "rgba(223, 83, 32, 0.58)",
  terracotta: "#E49D71",
  terracottaShade: "#D58A5D",
  creamWall: "#F7EAD7",
  roofWarm: "#EFE1CC",
  ink: "#141615",
  inkSoft: "#464C48",
  doorDark: "#201F1A",
  doorInner: "#39362E",
  grid: "rgba(125, 118, 104, 0.30)",
  err: "#B3261E",
  errSoft: "rgba(179, 38, 30, 0.16)",
  darkBg: "#0A2624",
  darkGrid: "rgba(108, 211, 198, 0.12)",
  darkTeal: "#6CD3C6",
  darkOrange: "#F58255",
  darkInk: "#FAF1E4",
  darkErr: "#FF8575",
};

// 工具：按设备像素比自动缩放 2D Canvas（上限 2）
function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  ctx.closePath();
}

function drawBadge(ctx, x, y, text, bg, fg, align = "center") {
  ctx.save();
  ctx.font = '500 11.5px "IBM Plex Mono", "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(text).width;
  const padX = 7;
  const bh = 20;
  const bw = tw + padX * 2;
  let bx = x - bw / 2;
  if (align === "left") bx = x;
  if (align === "right") bx = x - bw;
  const by = y - bh / 2;
  ctx.fillStyle = bg;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + padX, y + 0.5);
  ctx.restore();
}

// ==================== 公共体块绘制（供开场制图台与第 07 节盲测共用） ====================
function renderTwoPointStage(ctx, w, h, state, opts = {}) {
  const {
    showHandles = true,
    showRays = true,
    showGrid = true,
    reveal = 1,
    activeDrag = null,
    compact = false,
  } = opts;
  const aspect = w / h;
  const proj = projectScene(state, aspect);
  const { box, door, extra, shadowLeft, shadowRight, gridLinesL, gridLinesR, vpL, vpR, horizon, metrics, diagnosis } = proj;
  const X = (u) => u * w;
  const Y = (v) => v * h;
  const pt = (p) => [X(p.u), Y(p.v)];

  // 1. 暖象牙图纸底
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);

  // 柔和远景地平纸面过渡（极克制的暖米上下分隔）
  const skyGrad = ctx.createLinearGradient(0, 0, 0, Y(horizon));
  skyGrad.addColorStop(0, "#FAF1E4");
  skyGrad.addColorStop(1, "#F6ECDC");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, Y(horizon));

  // 2. 地面透视网格
  if (showGrid) {
    ctx.save();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (const [a, b] of gridLinesL) {
      ctx.beginPath();
      ctx.moveTo(X(a.u), Y(a.v));
      ctx.lineTo(X(b.u), Y(b.v));
      ctx.stroke();
    }
    for (const [a, b] of gridLinesR) {
      ctx.beginPath();
      ctx.moveTo(X(a.u), Y(a.v));
      ctx.lineTo(X(b.u), Y(b.v));
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. 地平线（通宽深青线）与右灭点错位撕裂示意线（盲测无射线模式下隐藏剧透红线）
  ctx.save();
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, Y(horizon));
  ctx.lineTo(w * clamp(reveal * 1.15, 0.25, 1), Y(horizon));
  ctx.stroke();

  if (showRays && metrics.absSplitPct >= 2) {
    // 撕裂的错误右视平虚线
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = C.err;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, Y(vpR.v));
    ctx.lineTo(w, Y(vpR.v));
    ctx.stroke();
    // 竖向高差标尺
    const gx = clamp(X(vpR.u), w * 0.62, w - 26);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(gx, Y(horizon));
    ctx.lineTo(gx, Y(vpR.v));
    ctx.stroke();
  }
  ctx.restore();

  // 4. 透视辅助射线（左深青虚线 / 右陶土橘虚线）
  if (showRays) {
    ctx.save();
    const rayProgress = clamp(reveal, 0.35, 1);
    const drawRay = (fromP, toVP, color, dashed = true) => {
      const fx = X(fromP.u), fy = Y(fromP.v);
      const tx = X(toVP.u), ty = Y(toVP.v);
      const ex = fx + (tx - fx) * rayProgress;
      const ey = fy + (ty - fy) * rayProgress;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.15;
      ctx.setLineDash(dashed ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    };

    // 左灭点射线
    drawRay(box.c0t, vpL, C.tealRay, true);
    drawRay(box.c0b, vpL, C.tealRay, true);
    drawRay(box.cRt, vpL, "rgba(12, 98, 92, 0.26)", true);
    // 右灭点射线（错位时改警示赤）
    const rColor = metrics.absSplitPct >= 2 ? "rgba(179, 38, 30, 0.72)" : C.orangeRay;
    drawRay(box.c0t, vpR, rColor, true);
    drawRay(box.c0b, vpR, rColor, true);
    drawRay(box.cLt, vpR, metrics.absSplitPct >= 2 ? "rgba(179, 38, 30, 0.32)" : "rgba(223, 83, 32, 0.26)", true);
    ctx.restore();
  }

  // 5. 地面双色投影（原海报左暖石 + 右深青长影）
  ctx.save();
  ctx.fillStyle = C.warmShadow;
  poly(ctx, shadowLeft.map(pt));
  ctx.fill();
  ctx.fillStyle = C.tealShadow;
  poly(ctx, shadowRight.map(pt));
  ctx.fill();
  ctx.restore();

  // 6. 如为双体展馆，先绘左侧远处的附属展盒
  if (extra && extra.type === "twin") {
    ctx.save();
    if (metrics.roofVisible) {
      ctx.fillStyle = C.roofWarm;
      poly(ctx, [extra.f0t, extra.fLt, extra.fBt, extra.fRt].map(pt));
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
    ctx.fillStyle = "#D89A72";
    poly(ctx, [extra.f0b, extra.f0t, extra.fLt, extra.fLb].map(pt));
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    ctx.fillStyle = "#EFE2CF";
    poly(ctx, [extra.f0b, extra.f0t, extra.fRt, extra.fRb].map(pt));
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 7. 主建筑体块：如地平线高于屋顶，则绘制完整屋面
  ctx.save();
  if (metrics.roofVisible) {
    ctx.fillStyle = C.roofWarm;
    poly(ctx, [box.c0t, box.cLt, box.cBt, box.cRt].map(pt));
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 左墙面（陶土暖橘，受侧光带轻微纸面明暗渐变）
  const leftGrad = ctx.createLinearGradient(X(box.cLb.u), 0, X(box.c0b.u), 0);
  leftGrad.addColorStop(0, C.terracottaShade);
  leftGrad.addColorStop(1, C.terracotta);
  ctx.fillStyle = leftGrad;
  poly(ctx, [box.c0b, box.c0t, box.cLt, box.cLb].map(pt));
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "miter";
  ctx.stroke();

  // 右墙面（ sunlit 暖米白石膏墙）
  const rightGrad = ctx.createLinearGradient(X(box.c0b.u), 0, X(box.cRb.u), 0);
  rightGrad.addColorStop(0, C.creamWall);
  rightGrad.addColorStop(1, "#EFE1CE");
  ctx.fillStyle = rightGrad;
  poly(ctx, [box.c0b, box.c0t, box.cRt, box.cRb].map(pt));
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 右墙深墨门洞 + 内壁进深（带精确透视厚度）
  ctx.fillStyle = C.doorDark;
  poly(ctx, [door.b0, door.b1, door.t1, door.t0].map(pt));
  ctx.fill();
  ctx.fillStyle = C.doorInner;
  poly(ctx, [door.b0, door.inB0, door.inT0, door.t0].map(pt));
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.3;
  poly(ctx, [door.b0, door.b1, door.t1, door.t0].map(pt));
  ctx.stroke();

  // 街角书店附加橱窗与转角雨篷
  if (extra && extra.type === "bookstore") {
    ctx.fillStyle = "rgba(12, 98, 92, 0.24)";
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.2;
    for (const quad of [...extra.winL, ...extra.winR]) {
      poly(ctx, quad.map(pt));
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = C.teal;
    poly(ctx, extra.awning.l.map(pt));
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#187B73";
    poly(ctx, extra.awning.r.map(pt));
    ctx.fill();
    ctx.stroke();
  }

  // 加粗强调中央垂直前棱（视觉锚点 & 水平拖拽把手）
  ctx.strokeStyle = activeDrag === "corner" ? C.orange : C.ink;
  ctx.lineWidth = activeDrag === "corner" ? 3 : 2.2;
  ctx.beginPath();
  ctx.moveTo(X(box.c0t.u), Y(box.c0t.v));
  ctx.lineTo(X(box.c0b.u), Y(box.c0b.v));
  ctx.stroke();
  ctx.restore();

  // 8. 前底转角夹角微弧标注（当爆角畸变时用赤红醒目标出）
  if (!compact && showHandles && (diagnosis.code === "pinched" || metrics.f < 0.42)) {
    const cx = X(box.c0b.u), cy = Y(box.c0b.v);
    const a1 = Math.atan2(Y(box.cLb.v) - cy, X(box.cLb.u) - cx);
    const a2 = Math.atan2(Y(box.cRb.v) - cy, X(box.cRb.u) - cx);
    ctx.save();
    ctx.strokeStyle = C.err;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, a2, a1, false);
    ctx.stroke();
    drawBadge(ctx, cx, cy + 26, `前角偏尖 ${metrics.minCornerAngleDeg}°`, C.err, "#FFFFFF");
    ctx.restore();
  }

  // 9. 交互手柄与标签（VP-L、VP-R、地平线柄、前棱滑柄）
  if (showHandles) {
    // 左消失点（在画内画圆环手柄，在画外画边缘指示牌）
    const vpLx = X(vpL.u), vpLy = Y(vpL.v);
    if (vpL.u >= 0.02 && vpL.u <= 0.98) {
      ctx.save();
      ctx.fillStyle = C.paperBright;
      ctx.beginPath();
      ctx.arc(vpLx, vpLy, activeDrag === "vpL" ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = C.teal;
      ctx.stroke();
      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.arc(vpLx, vpLy, 4, 0, Math.PI * 2);
      ctx.fill();
      if (!compact) {
        drawBadge(
          ctx,
          clamp(vpLx, 44, w - 44),
          vpLy - 20,
          "左消失点 VP-L",
          C.teal,
          "#FFFFFF"
        );
      }
      ctx.restore();
    } else {
      const distOut = Math.abs(vpL.u).toFixed(2);
      drawBadge(ctx, 8, clamp(vpLy - 16, 16, h - 16), `← VP-L 画外 ${distOut}×`, C.teal, "#FFFFFF", "left");
    }

    // 右消失点
    const vpRx = X(vpR.u), vpRy = Y(vpR.v);
    const rightCol = metrics.absSplitPct >= 2 ? C.err : C.orange;
    if (vpR.u >= 0.02 && vpR.u <= 0.98) {
      ctx.save();
      ctx.fillStyle = C.paperBright;
      ctx.beginPath();
      ctx.arc(vpRx, vpRy, activeDrag === "vpR" ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = rightCol;
      ctx.stroke();
      ctx.fillStyle = rightCol;
      ctx.beginPath();
      ctx.arc(vpRx, vpRy, 4, 0, Math.PI * 2);
      ctx.fill();
      if (!compact) {
        const label = metrics.absSplitPct >= 2
          ? `右灭点错位 ${metrics.vpSplitPct < 0 ? "↑" : "↓"}${metrics.absSplitPct}%`
          : "右消失点 VP-R";
        drawBadge(
          ctx,
          clamp(vpRx, 58, w - 58),
          vpRy - 20,
          label,
          rightCol,
          "#FFFFFF"
        );
      }
      ctx.restore();
    } else {
      const distOut = (vpR.u - 1).toFixed(2);
      drawBadge(ctx, w - 8, clamp(vpRy - 16, 16, h - 16), `VP-R 画外 ${distOut}× →`, rightCol, "#FFFFFF", "right");
    }

    // 前棱中段简洁手柄（提示可横向拖动旋转转角）
    if (!compact) {
      const midX = X(box.c0t.u);
      const midY = (Y(box.c0t.v) + Y(box.c0b.v)) * 0.5;
      ctx.save();
      ctx.fillStyle = activeDrag === "corner" ? C.orange : C.ink;
      ctx.beginPath();
      ctx.arc(midX, midY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 11px "IBM Plex Mono", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", midX, midY + 0.5);
      ctx.restore();

      // 地平线右/左端小标签
      const hlX = w > 520 ? w * 0.14 : 64;
      const hlLabel = `地平线 ${metrics.horizonPct}%`;
      if (Math.abs(hlX - vpLx) > 74) {
        drawBadge(ctx, hlX, clamp(Y(horizon) + 15, 16, h - 16), hlLabel, "rgba(12, 98, 92, 0.9)", "#FFFFFF");
      }
    }
  }

  return proj;
}

// ==================== 俯视泰勒斯 90° 站位条绘制 ====================
function renderOverheadPlan(ctx, w, h, state) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.paperBright;
  ctx.fillRect(0, 0, w, h);

  const optics = solveOptics(state.vpL, state.vpR, 0.5);
  // 将 u ∈ [-0.85, 1.85] 映射到横条宽度，使画外消失点也能在俯视图上看得清清楚楚
  const minU = -0.8;
  const maxU = 1.8;
  const mapX = (u) => ((u - minU) / (maxU - minU)) * (w - 28) + 14;
  const ppY = 12; // 画面线 Picture Plane 位置
  const scaleY = (h - 20) / 1.15; // f 映射到站位退距像素

  const x0 = mapX(0);
  const x1 = mapX(1);
  const xMid = mapX(0.5);
  const xL = mapX(clamp(state.vpL, minU, maxU));
  const xR = mapX(clamp(state.vpR, minU, maxU));
  const spY = clamp(ppY + optics.f * scaleY * 0.66, ppY + 12, h - 18);

  // 1. 60° 自然视锥扇面（±30° from central visual ray）
  const coneHalfW = Math.tan(Math.PI / 6) * (spY - ppY) * 1.45;
  const pinched = optics.f < 0.40;
  ctx.save();
  ctx.fillStyle = pinched ? C.errSoft : C.tealSoft;
  ctx.beginPath();
  ctx.moveTo(xMid, spY);
  ctx.lineTo(xMid - coneHalfW, ppY);
  ctx.lineTo(xMid + coneHalfW, ppY);
  ctx.closePath();
  ctx.fill();

  // 2. 画面线（深粗框表示真实画幅 [0..1]，浅灰延申表示画外空间）
  ctx.strokeStyle = "#C6BDAE";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(14, ppY);
  ctx.lineTo(w - 14, ppY);
  ctx.stroke();

  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, ppY);
  ctx.lineTo(x1, ppY);
  ctx.stroke();

  // 3. 泰勒斯半圆弧示意与 SP → VP_L / VP_R 90° 视线
  const semiCx = (xL + xR) * 0.5;
  const semiRx = Math.max(8, (xR - xL) * 0.5);
  const semiRy = Math.max(8, Math.min(h - ppY - 15, semiRx * 0.40));
  ctx.strokeStyle = "rgba(12, 98, 92, 0.32)";
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(semiCx, ppY, semiRx, semiRy, 0, 0, Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  // SP 到左右灭点连线
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(xMid, spY);
  ctx.lineTo(xL, ppY);
  ctx.stroke();

  ctx.strokeStyle = state.vpSplit && Math.abs(state.vpSplit) >= 0.02 ? C.err : C.orange;
  ctx.beginPath();
  ctx.moveTo(xMid, spY);
  ctx.lineTo(xR, ppY);
  ctx.stroke();

  // 节点圆点
  ctx.fillStyle = C.teal;
  ctx.beginPath(); ctx.arc(xL, ppY, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.orange;
  ctx.beginPath(); ctx.arc(xR, ppY, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath(); ctx.arc(xMid, spY, 4, 0, Math.PI * 2); ctx.fill();

  // 文字标注（放在 SP 下方，绝不与斜线重合）
  ctx.font = '500 10.5px "IBM Plex Mono", "Noto Sans SC", sans-serif';
  ctx.fillStyle = C.inkSoft;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText("画外", 16, h - 2);
  ctx.textAlign = "right";
  ctx.fillText("画外", w - 16, h - 2);
  ctx.textAlign = "center";
  ctx.fillStyle = pinched ? C.err : C.teal;
  ctx.fillText(pinched ? "SP 站位贴墙 · 60° 视锥爆角" : "SP 站位点 · ∠90° 泰勒斯半圆", xMid, h - 2);
  ctx.restore();
}

// ==================== 开场控制器 ====================
const heroState = { ...INITIAL_STATE };
const heroCanvas = document.getElementById("hero-canvas");
const planCanvas = document.getElementById("plan-canvas");

const els = {
  subRayL: document.getElementById("sub-ray-l"),
  subRayR: document.getElementById("sub-ray-r"),
  planMeta: document.getElementById("plan-meta"),
  diagStar: document.getElementById("diag-star"),
  diagPill: document.getElementById("diag-pill"),
  diagMetrics: document.getElementById("diag-metrics"),
  diagHeadline: document.getElementById("diag-headline"),
  diagDesc: document.getElementById("diag-desc"),
  diagHint: document.getElementById("diag-hint"),
  rngSpan: document.getElementById("rng-span"),
  rngHorizon: document.getElementById("rng-horizon"),
  rngYaw: document.getElementById("rng-yaw"),
  valSpan: document.getElementById("val-span"),
  valHorizon: document.getElementById("val-horizon"),
  valYaw: document.getElementById("val-yaw"),
  btnRays: document.getElementById("btn-rays"),
  btnLockH: document.getElementById("btn-lock-h"),
  btnReset: document.getElementById("btn-reset"),
  kpHorizon: document.getElementById("kp-st-horizon"),
  kpVp: document.getElementById("kp-st-vp"),
  kpVolume: document.getElementById("kp-st-volume"),
  kpDirection: document.getElementById("kp-st-direction"),
};

let heroDirty = true;
let activeDrag = null;
let dragStart = null;
let introDone = false;

function syncHeroUI(proj) {
  const { metrics: m, diagnosis: d } = proj;

  // 标题双色斜线与实际顶棱斜率联动（标题即示范）
  const tiltL = clamp(-m.slopeLeftDeg * 0.42, -16, 16);
  const tiltR = clamp(m.slopeRightDeg * 0.42, -16, 16);
  els.subRayL.style.transform = `rotate(${tiltL.toFixed(1)}deg)`;
  els.subRayR.style.transform = `rotate(${tiltR.toFixed(1)}deg)`;

  // 俯视条读数
  els.planMeta.textContent = `等效 ${Math.round(m.focalMm)}mm · 画幅视场 ${m.fovFrameDeg}° · 主体 ${m.fovSubjectDeg}°`;

  // 橘星白话诊单
  els.diagStar.classList.toggle("is-ok", d.ok);
  els.diagStar.classList.toggle("is-err", !d.ok && (d.code === "split" || d.code === "pinched" || d.code === "inverted"));
  els.diagPill.textContent = d.badge;
  els.diagPill.className = `diag-pill ${d.ok ? "is-ok" : (d.code === "equal" || d.code === "tangent" ? "is-warn" : "is-err")}`;
  els.diagMetrics.textContent = `等效 ${Math.round(m.focalMm)}mm · 左右 ${m.leftPct}:${m.rightPct} · 前角 ${m.minCornerAngleDeg}°`;
  els.diagHeadline.textContent = d.headline;
  els.diagDesc.textContent = d.body;
  els.diagHint.textContent = d.hint;

  // 滑块回显
  const spanPct = Math.round(m.vpSpan * 100);
  els.rngSpan.value = String(clamp(spanPct, 36, 220));
  els.valSpan.textContent = `${spanPct}% · ${Math.round(m.focalMm)}mm`;
  els.rngHorizon.value = String(clamp(m.horizonPct, 16, 82));
  els.valHorizon.textContent = `${m.horizonPct}% · ${m.eyeLevelMode}`;
  els.rngYaw.value = String(clamp(Math.round(m.thetaDeg), 18, 72));
  els.valYaw.textContent = `${Math.round(m.thetaDeg)}° · ${m.leftPct}:${m.rightPct}`;

  // 四栏原海报核心要点实况灯
  const setPill = (el, st) => {
    el.textContent = st.tag;
    el.className = `kp-status mono is-${st.state}`;
  };
  setPill(els.kpHorizon, d.pillarStatus.horizon);
  setPill(els.kpVp, d.pillarStatus.vp);
  setPill(els.kpVolume, d.pillarStatus.volume);
  setPill(els.kpDirection, d.pillarStatus.direction);
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const reveal = still || introDone ? 1 : clamp(0.45 + t / 0.65, 0.45, 1);
  if (reveal >= 1) introDone = true;
  if (!heroDirty && introDone && !still) return;

  const { ctx, w, h } = fitCanvas(heroCanvas);
  const proj = renderTwoPointStage(ctx, w, h, heroState, {
    showHandles: true,
    showRays: heroState.showRays,
    showGrid: heroState.showGrid,
    reveal,
    activeDrag,
  });

  const p = fitCanvas(planCanvas);
  renderOverheadPlan(p.ctx, p.w, p.h, heroState);

  syncHeroUI(proj);
  heroDirty = false;
});

function markHeroDirty() {
  heroDirty = true;
  if (reducedMotion.matches) heroLoop.draw();
}

// 直接画布交互：支持拖 VP-L / VP-R / 地平线 / 中央建筑前棱（含 data-perf-drag 水平拖动！）
function getCanvasUV(e) {
  const rect = heroCanvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    u: (cx - rect.left) / Math.max(1, rect.width),
    v: (cy - rect.top) / Math.max(1, rect.height),
    w: rect.width,
    h: rect.height,
  };
}

function hitTestHero(u, v, w, h) {
  const aspect = w / h;
  const proj = projectScene(heroState, aspect);
  const distPx = (au, av, bu, bv) => Math.hypot((au - bu) * w, (av - bv) * h);

  // 先检测画内 VP 圆点
  if (heroState.vpL >= 0.01 && heroState.vpL <= 0.99 && distPx(u, v, proj.vpL.u, proj.vpL.v) < 28) return "vpL";
  if (heroState.vpR >= 0.01 && heroState.vpR <= 0.99 && distPx(u, v, proj.vpR.u, proj.vpR.v) < 28) return "vpR";
  // 建筑中央区域优先触发转角横拖（确保 perf.mjs 从画布中心起拖稳定驱动重画）
  if (u > proj.box.cLb.u - 0.04 && u < proj.box.cRb.u + 0.04 && v > proj.box.c0t.v - 0.06 && v < proj.box.c0b.v + 0.06) {
    return "corner";
  }
  // 靠近地平线则上下升降地平线
  if (Math.abs(v - heroState.horizon) * h < 20) return "horizon";
  // 靠左/右外侧空白区域可顺手把画外灭点拉近或推远
  if (u < 0.28) return "vpL";
  if (u > 0.72) return "vpR";
  return "corner";
}

function onHeroDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  const pos = getCanvasUV(e);
  activeDrag = hitTestHero(pos.u, pos.v, pos.w, pos.h);
  const opt = solveOptics(heroState.vpL, heroState.vpR);
  dragStart = {
    u: pos.u,
    v: pos.v,
    vpL: heroState.vpL,
    vpR: heroState.vpR,
    horizon: heroState.horizon,
    vpSplit: heroState.vpSplit,
    f: opt.f,
    thetaDeg: opt.thetaDeg,
  };
  if (e.pointerId !== undefined && heroCanvas.setPointerCapture) {
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  }
  markHeroDirty();
}

function onHeroMove(e) {
  if (!activeDrag || !dragStart) return;
  const pos = getCanvasUV(e);
  const du = pos.u - dragStart.u;
  const dv = pos.v - dragStart.v;

  if (activeDrag === "corner") {
    // 水平拖拽旋转建筑转角（保持当前焦距，按 90° 泰勒斯半圆同步滑动双灭点）
    const nextTheta = clamp(dragStart.thetaDeg + du * 95, 16, 74);
    const { vpL, vpR } = vpsFromFocalYaw(dragStart.f, nextTheta);
    heroState.vpL = vpL;
    heroState.vpR = vpR;
    // 靠近经典 36° 主次位轻轻吸附
    if (Math.abs(nextTheta - 36) < 1.2) {
      const snapped = vpsFromFocalYaw(dragStart.f, 36);
      heroState.vpL = snapped.vpL;
      heroState.vpR = snapped.vpR;
    }
  } else if (activeDrag === "vpL") {
    heroState.vpL = clamp(dragStart.vpL + du * 1.35, -0.82, 0.44);
    if (!heroState.lockHorizon && Math.abs(dv) > 0.015) {
      heroState.horizon = clamp(dragStart.horizon + dv, 0.16, 0.82);
    }
  } else if (activeDrag === "vpR") {
    heroState.vpR = clamp(dragStart.vpR + du * 1.35, 0.56, 1.82);
    if (heroState.lockHorizon) {
      heroState.vpSplit = 0;
    } else {
      let nextSplit = clamp(dragStart.vpSplit + dv, -0.22, 0.22);
      // 靠近地平线 ±1.8% 轻轻吸附归齐
      if (Math.abs(nextSplit) < 0.018) nextSplit = 0;
      heroState.vpSplit = nextSplit;
    }
  } else if (activeDrag === "horizon") {
    heroState.horizon = clamp(dragStart.horizon + dv, 0.16, 0.82);
  }
  markHeroDirty();
}

function onHeroUp() {
  if (!activeDrag) return;
  activeDrag = null;
  dragStart = null;
  markHeroDirty();
}

heroCanvas.addEventListener("pointerdown", onHeroDown);
heroCanvas.addEventListener("pointermove", onHeroMove);
heroCanvas.addEventListener("pointerup", onHeroUp);
heroCanvas.addEventListener("pointercancel", onHeroUp);

// 键盘操控（方向键微调转角与地平线，[ ] 调双灭点跨度，R 复原）
heroCanvas.addEventListener("keydown", (e) => {
  const opt = solveOptics(heroState.vpL, heroState.vpR);
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? -3 : 3;
    const { vpL, vpR } = vpsFromFocalYaw(opt.f, clamp(opt.thetaDeg + step, 16, 74));
    heroState.vpL = vpL;
    heroState.vpR = vpR;
    markHeroDirty();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    heroState.horizon = clamp(heroState.horizon + (e.key === "ArrowUp" ? -0.03 : 0.03), 0.16, 0.82);
    markHeroDirty();
  } else if (e.key === "[" || e.key === "]") {
    e.preventDefault();
    const df = e.key === "]" ? 0.06 : -0.06;
    const { vpL, vpR } = vpsFromFocalYaw(clamp(opt.f + df, 0.22, 1.15), opt.thetaDeg);
    heroState.vpL = vpL;
    heroState.vpR = vpR;
    markHeroDirty();
  }
});

// 顶部题材按钮、开关与预设按钮
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.scene = btn.dataset.scene;
    document.querySelectorAll("[data-scene]").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    markHeroDirty();
  });
});

els.btnRays.addEventListener("click", () => {
  heroState.showRays = !heroState.showRays;
  els.btnRays.classList.toggle("is-on", heroState.showRays);
  els.btnRays.setAttribute("aria-pressed", String(heroState.showRays));
  markHeroDirty();
});

els.btnLockH.addEventListener("click", () => {
  heroState.lockHorizon = !heroState.lockHorizon;
  if (heroState.lockHorizon) heroState.vpSplit = 0;
  els.btnLockH.classList.toggle("is-on", heroState.lockHorizon);
  els.btnLockH.setAttribute("aria-pressed", String(heroState.lockHorizon));
  markHeroDirty();
});

els.btnReset.addEventListener("click", () => {
  Object.assign(heroState, {
    vpL: PRESETS.broken.vpL,
    vpR: PRESETS.broken.vpR,
    horizon: PRESETS.broken.horizon,
    vpSplit: PRESETS.broken.vpSplit,
    lockHorizon: false,
  });
  els.btnLockH.classList.remove("is-on");
  els.btnLockH.setAttribute("aria-pressed", "false");
  markHeroDirty();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    heroState.vpL = p.vpL;
    heroState.vpR = p.vpR;
    heroState.horizon = p.horizon;
    heroState.vpSplit = p.vpSplit;
    markHeroDirty();
  });
});

els.rngSpan.addEventListener("input", () => {
  const span = Number(els.rngSpan.value) / 100;
  const opt = solveOptics(heroState.vpL, heroState.vpR);
  // 保持当前偏角比 r = pR / pL = tan^2(theta)
  const r = Math.pow(Math.tan(opt.thetaRad), 2);
  const pL = span / (1 + r);
  const pR = span - pL;
  heroState.vpL = clamp(0.5 - pL, -0.88, 0.44);
  heroState.vpR = clamp(0.5 + pR, 0.56, 1.88);
  markHeroDirty();
});

els.rngHorizon.addEventListener("input", () => {
  heroState.horizon = Number(els.rngHorizon.value) / 100;
  markHeroDirty();
});

els.rngYaw.addEventListener("input", () => {
  const opt = solveOptics(heroState.vpL, heroState.vpR);
  const { vpL, vpR } = vpsFromFocalYaw(opt.f, Number(els.rngYaw.value));
  heroState.vpL = vpL;
  heroState.vpR = vpR;
  markHeroDirty();
});

// ==================== 01 节：一面转两面 + 斜转副楼双对灭点 ====================
const s1Canvas = document.getElementById("s1-canvas");
const s1YawInput = document.getElementById("s1-yaw");
const s1AngleVal = document.getElementById("s1-angle-val");
const s1Note = document.getElementById("s1-note");
const s1SecondBtn = document.getElementById("s1-second-btn");
const s1State = { yaw: 32, showSecond: false };
let s1Dirty = true;

function drawSec01() {
  const { ctx, w, h } = fitCanvas(s1Canvas);
  ctx.fillStyle = C.paperBright;
  ctx.fillRect(0, 0, w, h);

  const yaw = s1State.yaw;
  const vH = h * 0.42;

  // 地平线
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, vH);
  ctx.lineTo(w, vH);
  ctx.stroke();

  const f = 0.78;
  const cx = w * (s1State.showSecond ? 0.36 : 0.5);
  const drawBoxRotated = (centerX, deg, scale, colors, labelPrefix, vpColorL, vpColorR) => {
    const rad = (deg * Math.PI) / 180;
    const isOnePt = deg <= 2 || deg >= 88;
    const L = 128 * scale;
    const D = 148 * scale;
    const H = 108 * scale;
    const zc = 340;
    const eyeY = H * 0.62;
    const fl = w * f * 0.72;

    const uLx = -Math.cos(rad), uLz = Math.sin(rad);
    const uRx = Math.sin(rad), uRz = Math.cos(rad);
    const xShift = -0.5 * (L * uLx + D * uRx);

    const P = (dL, y, dR) => {
      const x = xShift + dL * uLx + dR * uRx;
      const z = zc + dL * uLz + dR * uRz;
      return [centerX + (fl * x) / z, vH - (fl * (y - eyeY)) / z];
    };

    const p0b = P(0, 0, 0), p0t = P(0, H, 0);
    const pLb = P(L, 0, 0), pLt = P(L, H, 0);
    const pRb = P(0, 0, D), pRt = P(0, H, D);

    // 灭点位置
    const vpLx = Math.abs(uLz) > 0.04 ? centerX + fl * (uLx / uLz) : null;
    const vpRx = Math.abs(uRz) > 0.04 ? centerX + fl * (uRx / uRz) : null;

    // 射线
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.1;
    if (vpLx !== null) {
      ctx.strokeStyle = vpColorL;
      ctx.beginPath(); ctx.moveTo(p0t[0], p0t[1]); ctx.lineTo(vpLx, vH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p0b[0], p0b[1]); ctx.lineTo(vpLx, vH); ctx.stroke();
      if (vpLx > 8 && vpLx < w - 8) {
        ctx.fillStyle = vpColorL;
        ctx.beginPath(); ctx.arc(vpLx, vH, 5, 0, Math.PI * 2); ctx.fill();
        drawBadge(ctx, clamp(vpLx, 34, w - 34), vH - 17, `${labelPrefix}L`, vpColorL, "#FFFFFF");
      }
    }
    if (vpRx !== null) {
      ctx.strokeStyle = vpColorR;
      ctx.beginPath(); ctx.moveTo(p0t[0], p0t[1]); ctx.lineTo(vpRx, vH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p0b[0], p0b[1]); ctx.lineTo(vpRx, vH); ctx.stroke();
      if (vpRx > 8 && vpRx < w - 8) {
        ctx.fillStyle = vpColorR;
        ctx.beginPath(); ctx.arc(vpRx, vH, 5, 0, Math.PI * 2); ctx.fill();
        drawBadge(ctx, clamp(vpRx, 34, w - 34), vH - 17, `${labelPrefix}R`, vpColorR, "#FFFFFF");
      }
    }
    ctx.restore();

    // 画左/右墙面
    if (deg < 89) {
      ctx.fillStyle = colors.left;
      poly(ctx, [p0b, p0t, pLt, pLb]);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (deg > 1) {
      ctx.fillStyle = colors.right;
      poly(ctx, [p0b, p0t, pRt, pRb]);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (isOnePt) {
      drawBadge(ctx, centerX, h - 22, "一面正对画框 · 已退化为一点透视", C.err, "#FFFFFF");
    }
  };

  drawBoxRotated(
    cx,
    yaw,
    s1State.showSecond ? 0.86 : 1.05,
    { left: C.terracotta, right: C.creamWall },
    "A-",
    C.teal,
    C.orange
  );

  if (s1State.showSecond) {
    const secondDeg = clamp((yaw + 26) % 72 + 12, 16, 76);
    drawBoxRotated(
      w * 0.72,
      secondDeg,
      0.72,
      { left: "#6D978E", right: "#EDE6D8" },
      "B-",
      "#365A54",
      "#9B4B24"
    );
    drawBadge(ctx, w * 0.5, h - 18, "两栋角度不同的楼：同一条地平线，两对各自独立的消失点", C.teal, "#FFFFFF");
  }

  // 更新白话解说
  if (yaw <= 3 || yaw >= 87) {
    s1AngleVal.textContent = `${yaw}° · 退回一点透视`;
    s1Note.textContent = "一面墙几乎平行于画框，另一侧消失点甩到无穷远——画面失去转角厚度，已经回到 070 一点透视的正面逻辑。";
  } else if (Math.abs(yaw - 45) <= 4) {
    s1AngleVal.textContent = `${yaw}° · 均分对称`;
    s1Note.textContent = "45° 均分虽然在光学上成立，但左右墙宽几乎相等，中央竖棱把画面对半劈开，视觉主次不够干脆。";
  } else {
    s1AngleVal.textContent = `${yaw}° · 主次分明`;
    s1Note.textContent = `转角 ${yaw}°：一面舒展承担主要信息，另一面急收交代纵深，两组明暗把平面矩形立刻撑成立体建筑。`;
  }
}

const s1Loop = loop(s1Canvas, (_t, _dt, { still }) => {
  if (!s1Dirty && !still) return;
  drawSec01();
  s1Dirty = false;
});
const markS1 = () => { s1Dirty = true; s1Loop.draw(); };

s1YawInput.addEventListener("input", () => {
  s1State.yaw = Number(s1YawInput.value);
  document.querySelectorAll("[data-s1-yaw]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.s1Yaw) === s1State.yaw));
  markS1();
});
document.querySelectorAll("[data-s1-yaw]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s1State.yaw = Number(btn.dataset.s1Yaw);
    s1YawInput.value = String(s1State.yaw);
    document.querySelectorAll("[data-s1-yaw]").forEach((b) => b.classList.toggle("is-active", b === btn));
    markS1();
  });
});
s1SecondBtn.addEventListener("click", () => {
  s1State.showSecond = !s1State.showSecond;
  s1SecondBtn.classList.toggle("is-active", s1State.showSecond);
  s1SecondBtn.setAttribute("aria-pressed", String(s1State.showSecond));
  markS1();
});

// ==================== 02 节：地平线标高电梯 + 无五官剪影行人 ====================
const s2Canvas = document.getElementById("s2-canvas");
const s2EyeInput = document.getElementById("s2-eye");
const s2Meters = document.getElementById("s2-meters");
const s2Mode = document.getElementById("s2-mode");
const s2Note = document.getElementById("s2-note");
let s2Eye = 1.7;
let s2Dirty = true;

// 画无五官建筑剪影行人（只画头椭圆+身躯轮廓，绝不画眼口鼻）
function drawSilhouettePerson(ctx, footX, footY, heightPx, color) {
  ctx.save();
  ctx.fillStyle = color;
  const headR = heightPx * 0.095;
  const headY = footY - heightPx + headR;
  // 头
  ctx.beginPath();
  ctx.arc(footX, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  // 肩与躯干剪影
  ctx.beginPath();
  ctx.moveTo(footX - headR * 1.45, headY + headR * 1.3);
  ctx.quadraticCurveTo(footX, headY + headR * 0.9, footX + headR * 1.45, headY + headR * 1.3);
  ctx.lineTo(footX + headR * 1.1, footY - heightPx * 0.36);
  ctx.lineTo(footX + headR * 0.9, footY);
  ctx.lineTo(footX + headR * 0.25, footY);
  ctx.lineTo(footX, footY - heightPx * 0.36);
  ctx.lineTo(footX - headR * 0.25, footY);
  ctx.lineTo(footX - headR * 0.9, footY);
  ctx.lineTo(footX - headR * 1.1, footY - heightPx * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSec02() {
  const { ctx, w, h } = fitCanvas(s2Canvas);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);

  // 真实 3D 街角两层建筑（高 7.2m）+ 三名 1.7m 行人（近、中、远）
  const H = 7.2, L = 7.0, D = 8.4;
  const theta = (34 * Math.PI) / 180;
  const f = 0.85;
  const zc = 16.5;
  const uLx = -Math.cos(theta), uLz = Math.sin(theta);
  const uRx = Math.sin(theta), uRz = Math.cos(theta);
  const xc = -0.35;

  // 地平线屏幕位置随相机高度 s2Eye ∈ [0.3, 12.0] 平滑升降
  const tEye = clamp((s2Eye - 0.3) / (12.0 - 0.3), 0, 1);
  const vH = 0.78 - tEye * 0.62; // 低相机 → 地平线在底，高相机 → 地平线在顶
  const scale = w * f;
  const P = (dL, y, dR) => {
    const x = xc + dL * uLx + dR * uRx;
    const z = zc + dL * uLz + dR * uRz;
    return [w * 0.5 + (scale * x) / z, h * vH - (scale * (y - s2Eye)) / z];
  };

  // 地平线
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(0, h * vH);
  ctx.lineTo(w, h * vH);
  ctx.stroke();
  ctx.setLineDash([]);

  // 地面辅助线
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = -2; i <= 5; i++) {
    const a = P(-3, 0, i * 2.4), b = P(L + 5, 0, i * 2.4);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    const c = P(i * 2.4, 0, -3), d = P(i * 2.4, 0, D + 5);
    ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
  }

  // 建筑屋顶、左墙、右墙
  const c0b = P(0, 0, 0), c0t = P(0, H, 0);
  const cLb = P(L, 0, 0), cLt = P(L, H, 0);
  const cRb = P(0, 0, D), cRt = P(0, H, D);
  const cBt = P(L, H, D);

  if (s2Eye > H) {
    ctx.fillStyle = C.roofWarm;
    poly(ctx, [c0t, cLt, cBt, cRt]);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = C.terracotta;
  poly(ctx, [c0b, c0t, cLt, cLb]);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = C.creamWall;
  poly(ctx, [c0b, c0t, cRt, cRb]);
  ctx.fill();
  ctx.stroke();

  // 一二层楼层线与门窗
  const fl0 = P(0, H * 0.48, 0), flL = P(L, H * 0.48, 0), flR = P(0, H * 0.48, D);
  ctx.strokeStyle = "rgba(20, 22, 21, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(flL[0], flL[1]); ctx.lineTo(fl0[0], fl0[1]); ctx.lineTo(flR[0], flR[1]); ctx.stroke();

  // 门洞（高 2.5m）
  ctx.fillStyle = C.doorDark;
  poly(ctx, [P(0, 0, 2.2), P(0, 0, 4.1), P(0, 2.5, 4.1), P(0, 2.5, 2.2)]);
  ctx.fill();

  // 三名身高完全相同（1.7m）的无五官剪影行人：近、中、远
  const walkers = [
    { dL: -1.6, dR: -1.2, col: C.tealDeep },
    { dL: -1.4, dR: 3.4, col: C.orange },
    { dL: -1.2, dR: 8.6, col: C.inkSoft },
  ];
  for (const p of walkers) {
    const foot = P(p.dL, 0, p.dR);
    const head = P(p.dL, 1.7, p.dR);
    const pxH = Math.max(10, foot[1] - head[1]);
    drawSilhouettePerson(ctx, foot[0], foot[1], pxH, p.col);
  }

  drawBadge(ctx, w - 10, clamp(h * vH - 14, 16, h - 16), `地平线 · 相机 ${s2Eye.toFixed(1)}m`, C.teal, "#FFFFFF", "right");

  s2Meters.textContent = `${s2Eye.toFixed(1)} m`;
  if (s2Eye < 1.1) {
    s2Mode.textContent = "低位贴地仰视";
    s2Note.textContent = `相机压到 ${s2Eye.toFixed(1)}m：地平线落到行人腰部以下，屋檐向两侧陡峭下斜，普通两层小楼立刻生出高耸纪念碑气势，但全部墙角竖线依然垂直。`;
  } else if (s2Eye <= 2.3) {
    s2Mode.textContent = "日常人眼平视";
    s2Note.textContent = `相机在 ${s2Eye.toFixed(1)}m：注意近、中、远三位 1.7m 剪影行人——虽然越远个头越小，他们的头眼始终齐刷刷压在深青地平线上，这就是“同高同视平”检校律。`;
  } else if (s2Eye <= 7.2) {
    s2Mode.textContent = "二楼露台平视";
    s2Note.textContent = `相机升至 ${s2Eye.toFixed(1)}m：行人全部沉到地平线下方，屋檐几乎被拉平，建筑呈现沉稳的街区中景尺度。`;
  } else {
    s2Mode.textContent = "高空俯视屋顶";
    s2Note.textContent = `相机升至 ${s2Eye.toFixed(1)}m 高过 7.2m 屋檐：屋顶平面完整摊开，三位行人缩成地坪上的小尺度参照，画面变成建筑模型俯瞰图。`;
  }
}

const s2Loop = loop(s2Canvas, (_t, _dt, { still }) => {
  if (!s2Dirty && !still) return;
  drawSec02();
  s2Dirty = false;
});
const markS2 = () => { s2Dirty = true; s2Loop.draw(); };

s2EyeInput.addEventListener("input", () => {
  s2Eye = Number(s2EyeInput.value) / 10;
  document.querySelectorAll("[data-s2-eye]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.s2Eye) === Number(s2EyeInput.value)));
  markS2();
});
document.querySelectorAll("[data-s2-eye]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s2EyeInput.value = btn.dataset.s2Eye;
    s2Eye = Number(btn.dataset.s2Eye) / 10;
    document.querySelectorAll("[data-s2-eye]").forEach((b) => b.classList.toggle("is-active", b === btn));
    markS2();
  });
});

// ==================== 03 节：深松墨暗室 泰勒斯 90° 半圆实验台 ====================
const s3PlanCanvas = document.getElementById("s3-plan-canvas");
const s3ViewCanvas = document.getElementById("s3-view-canvas");
const s3FocalInput = document.getElementById("s3-focal");
const s3ThetaInput = document.getElementById("s3-theta");
const s3FVal = document.getElementById("s3-f-val");
const s3TVal = document.getElementById("s3-t-val");
const s3Math = document.getElementById("s3-math");
const s3Status = document.getElementById("s3-status");
const s3Note = document.getElementById("s3-note");
const s3State = { focalMm: 28, thetaDeg: 36 };
let s3Dirty = true;

function drawSec03() {
  const f = s3State.focalMm / 36;
  const { vpL, vpR } = vpsFromFocalYaw(f, s3State.thetaDeg);
  const opt = solveOptics(vpL, vpR);

  // 左画布：俯视泰勒斯 90° 半圆几何台
  {
    const { ctx, w, h } = fitCanvas(s3PlanCanvas);
    ctx.fillStyle = C.darkBg;
    ctx.fillRect(0, 0, w, h);

    // 细网格
    ctx.strokeStyle = C.darkGrid;
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 24; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const ppY = h * 0.24;
    const uMin = -1.4, uMax = 2.4;
    const mapX = (u) => ((u - uMin) / (uMax - uMin)) * (w - 36) + 18;
    const pxPerUnit = (w - 36) / (uMax - uMin);

    const xMid = mapX(0.5);
    const xL = mapX(vpL);
    const xR = mapX(vpR);
    const spY = clamp(ppY + opt.f * pxPerUnit, ppY + 26, h - 30);
    const semiCx = (xL + xR) * 0.5;
    const semiR = Math.abs(xR - xL) * 0.5;

    // 60° 自然视锥扇面
    const coneHalf = Math.tan(Math.PI / 6) * (spY - ppY);
    const isPinched = s3State.focalMm < 16;
    ctx.fillStyle = isPinched ? "rgba(255, 133, 117, 0.20)" : "rgba(108, 211, 198, 0.16)";
    ctx.beginPath();
    ctx.moveTo(xMid, spY);
    ctx.lineTo(xMid - coneHalf, ppY);
    ctx.lineTo(xMid + coneHalf, ppY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isPinched ? C.darkErr : C.darkTeal;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(xMid, spY); ctx.lineTo(xMid - coneHalf, ppY);
    ctx.moveTo(xMid, spY); ctx.lineTo(xMid + coneHalf, ppY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 泰勒斯半圆（以 VP-L — VP-R 为直径）
    ctx.strokeStyle = "rgba(250, 241, 228, 0.34)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(semiCx, ppY, semiR, 0, Math.PI);
    ctx.stroke();

    // 画面线（含画框粗白段）
    ctx.strokeStyle = "rgba(250, 241, 228, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(14, ppY); ctx.lineTo(w - 14, ppY); ctx.stroke();
    ctx.strokeStyle = C.darkInk;
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(mapX(0), ppY); ctx.lineTo(mapX(1), ppY); ctx.stroke();

    // SP → VP_L 与 SP → VP_R 的 90° 夹角射线
    ctx.strokeStyle = C.darkTeal;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(xMid, spY); ctx.lineTo(xL, ppY); ctx.stroke();
    ctx.strokeStyle = C.darkOrange;
    ctx.beginPath(); ctx.moveTo(xMid, spY); ctx.lineTo(xR, ppY); ctx.stroke();

    // SP 处直角方框标记 90°
    const dxL = xL - xMid, dyL = ppY - spY;
    const lenL = Math.hypot(dxL, dyL) || 1;
    const dxR = xR - xMid, dyR = ppY - spY;
    const lenR = Math.hypot(dxR, dyR) || 1;
    const sq = 12;
    const uxL = (dxL / lenL) * sq, uyL = (dyL / lenL) * sq;
    const uxR = (dxR / lenR) * sq, uyR = (dyR / lenR) * sq;
    ctx.strokeStyle = C.darkInk;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(xMid + uxL, spY + uyL);
    ctx.lineTo(xMid + uxL + uxR, spY + uyL + uyR);
    ctx.lineTo(xMid + uxR, spY + uyR);
    ctx.stroke();

    // 点
    ctx.fillStyle = C.darkTeal; ctx.beginPath(); ctx.arc(clamp(xL, 12, w - 12), ppY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.darkOrange; ctx.beginPath(); ctx.arc(clamp(xR, 12, w - 12), ppY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.darkInk; ctx.beginPath(); ctx.arc(xMid, spY, 5, 0, Math.PI * 2); ctx.fill();

    // 文字标注
    ctx.font = '500 11.5px "IBM Plex Mono", "Noto Sans SC", sans-serif';
    ctx.fillStyle = C.darkInk;
    ctx.textAlign = "center";
    ctx.fillText("画幅窗口 [0..1]", xMid, ppY - 10);
    ctx.fillStyle = isPinched ? C.darkErr : C.darkTeal;
    ctx.fillText("60° 自然视锥", xMid, ppY + 18);
    ctx.fillStyle = C.darkInk;
    ctx.fillText(`SP 站位点 (∠90° 恒定)`, xMid, Math.min(h - 10, spY + 20));
  }

  // 右画布：同一瞬间的实算正方体暗室蓝图投影
  {
    const { ctx, w, h } = fitCanvas(s3ViewCanvas);
    ctx.fillStyle = C.darkBg;
    ctx.fillRect(0, 0, w, h);

    const proj = projectScene(
      { scene: "poster", vpL, vpR, horizon: 0.42, vpSplit: 0 },
      w / h
    );
    const { box, metrics: m } = proj;
    const X = (u) => u * w;
    const Y = (v) => v * h;
    const pt = (p) => [X(p.u), Y(p.v)];

    // 地平线
    ctx.strokeStyle = "rgba(108, 211, 198, 0.55)";
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(0, Y(0.42)); ctx.lineTo(w, Y(0.42)); ctx.stroke();

    // 双色射线
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(108, 211, 198, 0.45)";
    ctx.beginPath(); ctx.moveTo(X(box.c0t.u), Y(box.c0t.v)); ctx.lineTo(X(vpL), Y(0.42)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(box.c0b.u), Y(box.c0b.v)); ctx.lineTo(X(vpL), Y(0.42)); ctx.stroke();
    ctx.strokeStyle = "rgba(245, 130, 85, 0.45)";
    ctx.beginPath(); ctx.moveTo(X(box.c0t.u), Y(box.c0t.v)); ctx.lineTo(X(vpR), Y(0.42)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(box.c0b.u), Y(box.c0b.v)); ctx.lineTo(X(vpR), Y(0.42)); ctx.stroke();
    ctx.restore();

    // 暗室发光线框建筑体块
    const isPinched = s3State.focalMm < 16;
    ctx.fillStyle = isPinched ? "rgba(255, 133, 117, 0.24)" : "rgba(245, 130, 85, 0.28)";
    poly(ctx, [box.c0b, box.c0t, box.cLt, box.cLb].map(pt));
    ctx.fill();
    ctx.strokeStyle = C.darkInk;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = "rgba(108, 211, 198, 0.16)";
    poly(ctx, [box.c0b, box.c0t, box.cRt, box.cRb].map(pt));
    ctx.fill();
    ctx.stroke();

    // 标前底转角
    drawBadge(
      ctx,
      X(box.c0b.u),
      Y(box.c0b.v) + 20,
      `实绘前角 ${m.minCornerAngleDeg}° · 视场 ${m.fovFrameDeg}°`,
      isPinched ? C.err : C.teal,
      "#FFFFFF"
    );

    s3FVal.textContent = `${s3State.focalMm} mm`;
    s3TVal.textContent = `${s3State.thetaDeg}°`;
    s3Math.textContent = `f = ${s3State.focalMm}mm · 视场 ${m.fovFrameDeg}° · 主体 ${m.fovSubjectDeg}°`;
    if (isPinched) {
      s3Status.textContent = "超出 60° 视锥 · 尖角畸变";
      s3Status.style.color = C.darkErr;
      s3Note.innerHTML = `当前焦距仅 <strong>${s3State.focalMm}mm</strong>，站位点被逼到贴近画面，双灭点被硬塞进画框内部，前角急剧收尖到 ${m.minCornerAngleDeg}°——这正是新手把两个消失点画太近造成的“尖嘴盒子”。`;
    } else if (s3State.focalMm >= 62) {
      s3Status.textContent = "长焦压扁 · 趋近平行";
      s3Status.style.color = C.darkOrange;
      s3Note.innerHTML = `焦距拉长到 <strong>${s3State.focalMm}mm</strong>，双灭点退至画外极远处，透视汇聚变得非常平缓，空间压缩感增强，观感正逐渐靠近 <a href="https://layout.xiaoxiaodong.ai/073/play/">073 平行透视构图</a>。`;
    } else {
      s3Status.textContent = "60° 视锥内 · 方正自然";
      s3Status.style.color = C.darkTeal;
      s3Note.innerHTML = `焦距 <strong>${s3State.focalMm}mm</strong>，建筑稳稳落在经验 60° 自然视锥内；至少一侧消失点退到画框之外，转角沉着方正，这正是建筑效果图最常用的舒展比例。`;
    }
  }
}

const s3Loop = loop(s3PlanCanvas, (_t, _dt, { still }) => {
  if (!s3Dirty && !still) return;
  drawSec03();
  s3Dirty = false;
});
const markS3 = () => { s3Dirty = true; s3Loop.draw(); };

s3FocalInput.addEventListener("input", () => { s3State.focalMm = Number(s3FocalInput.value); markS3(); });
s3ThetaInput.addEventListener("input", () => { s3State.thetaDeg = Number(s3ThetaInput.value); markS3(); });
document.querySelectorAll("[data-s3]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [fm, th] = btn.dataset.s3.split(",").map(Number);
    s3State.focalMm = fm;
    s3State.thetaDeg = th;
    s3FocalInput.value = String(fm);
    s3ThetaInput.value = String(th);
    document.querySelectorAll("[data-s3]").forEach((b) => b.classList.toggle("is-active", b === btn));
    markS3();
  });
});

// ==================== 04 节：五步落笔与对角线透视等分 ====================
const s4Canvas = document.getElementById("s4-canvas");
const s4Badge = document.getElementById("s4-badge");
const s4Title = document.getElementById("s4-title");
const s4Desc = document.getElementById("s4-desc");
const s4SubdivBox = document.getElementById("s4-subdiv-box");
const s4BaysVal = document.getElementById("s4-bays-val");
const s4Prev = document.getElementById("s4-prev");
const s4Next = document.getElementById("s4-next");

const STEP_COPY = [
  {
    title: "先定通宽水平地平线，把双灭点尽量放宽",
    desc: "响应海报练习建议第一步：先画一条水平地平线定下观者视高，再在其左右两端定下 VP-L 与 VP-R。实战里不必强求两点都挤进画纸内，拉得够宽才能避免尖角变形。",
  },
  {
    title: "立起离观者最近的一条垂直前棱",
    desc: "在画面偏中（最好避开 50% 死正中）画一条严格垂直的竖线，它决定建筑在画面里的真实高度，也是左右两面墙共同的起跑线。",
  },
  {
    title: "把前棱上下两端分别连向左右双灭点",
    desc: "从垂直前棱的顶端和底端各引两条射线，左边收向深青 VP-L，右边收向陶土 VP-R。四条线搭出两条无限延伸的墙面走廊，确定了空间走向。",
  },
  {
    title: "用两条垂直边界切出宽窄主次，补出体量",
    desc: "在左右走廊上各落一条竖线截断墙宽（比如左窄右宽形成 38:62 主次节奏），再将明暗区分开，一座立体的建筑体块瞬间从白纸上站了起来。",
  },
  {
    title: "用 X 对角线法做透视等分，拒绝直尺死平分",
    desc: "想在右墙排一列等宽柱廊或门窗，绝不能拿尺子在纸上量中点——真实透视中点总偏靠远处。画墙面两条对角线求交点，再穿过中点向 VP-R 引水平中线，就能精确递推出近宽远密的等分格。",
  },
];

const s4State = { step: 1, bays: 4 };
let s4Dirty = true;

function drawSec04() {
  const { ctx, w, h } = fitCanvas(s4Canvas);
  ctx.fillStyle = C.paperBright;
  ctx.fillRect(0, 0, w, h);

  const proj = projectScene(
    { scene: "poster", vpL: 0.05, vpR: 1.04, horizon: 0.41, vpSplit: 0 },
    w / h
  );
  const { box, vpL, vpR, horizon } = proj;
  const X = (u) => u * w;
  const Y = (v) => v * h;
  const step = s4State.step;

  // Step 1: 地平线 + 双灭点
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, Y(horizon)); ctx.lineTo(w, Y(horizon)); ctx.stroke();
  ctx.fillStyle = C.teal;
  ctx.beginPath(); ctx.arc(X(vpL.u), Y(vpL.v), 6, 0, Math.PI * 2); ctx.fill();
  drawBadge(ctx, X(vpL.u) + 8, Y(vpL.v) - 18, "① VP-L", C.teal, "#FFFFFF", "left");
  drawBadge(ctx, w - 8, Y(horizon) - 18, "① VP-R (画外延展) →", C.orange, "#FFFFFF", "right");

  // Step 2: 垂直前棱
  if (step >= 2) {
    ctx.strokeStyle = step === 2 ? C.orange : C.ink;
    ctx.lineWidth = step === 2 ? 3.2 : 2.2;
    ctx.beginPath();
    ctx.moveTo(X(box.c0t.u), Y(box.c0t.v));
    ctx.lineTo(X(box.c0b.u), Y(box.c0b.v));
    ctx.stroke();
    if (step === 2) {
      drawBadge(ctx, X(box.c0t.u), Y(box.c0t.v) - 16, "② 严格垂直的前棱（定身高）", C.orange, "#FFFFFF");
    }
  }

  // Step 3: 上下端点连向双灭点
  if (step >= 3) {
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = step === 3 ? 1.8 : 1.1;
    ctx.strokeStyle = C.teal;
    ctx.beginPath(); ctx.moveTo(X(box.c0t.u), Y(box.c0t.v)); ctx.lineTo(X(vpL.u), Y(vpL.v)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(box.c0b.u), Y(box.c0b.v)); ctx.lineTo(X(vpL.u), Y(vpL.v)); ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.beginPath(); ctx.moveTo(X(box.c0t.u), Y(box.c0t.v)); ctx.lineTo(X(vpR.u), Y(vpR.v)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(box.c0b.u), Y(box.c0b.v)); ctx.lineTo(X(vpR.u), Y(vpR.v)); ctx.stroke();
    ctx.restore();
  }

  // Step 4: 切出左右墙面实体
  if (step >= 4) {
    ctx.fillStyle = C.terracotta;
    poly(ctx, [[X(box.c0b.u), Y(box.c0b.v)], [X(box.c0t.u), Y(box.c0t.v)], [X(box.cLt.u), Y(box.cLt.v)], [X(box.cLb.u), Y(box.cLb.v)]]);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = C.creamWall;
    poly(ctx, [[X(box.c0b.u), Y(box.c0b.v)], [X(box.c0t.u), Y(box.c0t.v)], [X(box.cRt.u), Y(box.cRt.v)], [X(box.cRb.u), Y(box.cRb.v)]]);
    ctx.fill();
    ctx.stroke();
  }

  // Step 5: 右墙精确 3D 等分开间 + X 对角线几何校验
  if (step === 5) {
    const N = s4State.bays;
    const x0 = X(box.c0t.u), y0t = Y(box.c0t.v), y0b = Y(box.c0b.v);
    const x1 = X(box.cRt.u), y1t = Y(box.cRt.v), y1b = Y(box.cRb.v);
    const vRx = X(vpR.u), vRy = Y(vpR.v);

    // 真实透视等分：由三维空间均匀步长 t = k/N 沿透视映射（等价于 X 对角线递推的精确解）
    // 透视比例映射：若近端深度 z0、远端深度 z1，屏幕参数 s(k) = (k/N * z0) / (z1 + (k/N)*(z0 - z1))
    // 直接利用墙面端点与 VP-R 的射线交比精确求 z1/z0！
    const hNear = y0b - y0t;
    const hFar = y1b - y1t;
    const zRatio = hNear / Math.max(1, hFar); // = z_far / z_near

    const bayXs = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      // 投影交比 s ∈ [0, 1]
      const s = (t * 1) / (t + (1 - t) * zRatio);
      const bx = x0 + (x1 - x0) * s;
      const bt = y0t + (y1t - y0t) * s;
      const bb = y0b + (y1b - y0b) * s;
      bayXs.push({ x: bx, top: bt, bot: bb });
    }

    // 画出大墙面两条红橘对角线（求透视中点）与中位射线
    ctx.save();
    ctx.strokeStyle = "rgba(223, 83, 32, 0.72)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(x0, y0t); ctx.lineTo(x1, y1b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y0b); ctx.lineTo(x1, y1t); ctx.stroke();

    // 中位水平射线（前棱中点连向 VP-R）
    const midY0 = (y0t + y0b) * 0.5;
    ctx.strokeStyle = C.teal;
    ctx.beginPath(); ctx.moveTo(x0, midY0); ctx.lineTo(vRx, vRy); ctx.stroke();
    ctx.restore();

    // 画每一根透视等分柱线与开间窗框
    for (let k = 1; k < N; k++) {
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bayXs[k].x, bayXs[k].top);
      ctx.lineTo(bayXs[k].x, bayXs[k].bot);
      ctx.stroke();
    }

    // 画每间开间内门窗示意（越远越窄）
    ctx.fillStyle = "rgba(12, 98, 92, 0.22)";
    for (let k = 0; k < N; k++) {
      const a = bayXs[k], b = bayXs[k + 1];
      const m0 = 0.22, m1 = 0.78;
      const xa = a.x + (b.x - a.x) * m0;
      const xb = a.x + (b.x - a.x) * m1;
      const ta = a.top + (b.top - a.top) * m0;
      const tb = a.top + (b.top - a.top) * m1;
      const ba = a.bot + (b.bot - a.bot) * m0;
      const bb = a.bot + (b.bot - a.bot) * m1;
      poly(ctx, [
        [xa, ta + (ba - ta) * 0.28],
        [xb, tb + (bb - tb) * 0.28],
        [xb, ba - (ba - ta) * 0.14],
        [xa, ba - (ba - ta) * 0.14],
      ]);
      ctx.fill();
    }

    // 计算首间与末间屏幕宽度比，实算反馈！
    const firstW = bayXs[1].x - bayXs[0].x;
    const lastW = bayXs[N].x - bayXs[N - 1].x;
    const ratio = (firstW / Math.max(1, lastW)).toFixed(2);
    s4BaysVal.textContent = `${N} 间 · 近/远宽比 ${ratio}×`;
    drawBadge(ctx, (x0 + x1) * 0.5, Math.max(y0b, y1b) + 18, `实算透视等分 ${N} 间（近格比远格宽 ${ratio}×）`, C.teal, "#FFFFFF");
  }

  // 更新文字卡片
  const info = STEP_COPY[step - 1];
  s4Badge.textContent = `STEP 0${step} / 05`;
  s4Title.textContent = info.title;
  s4Desc.textContent = info.desc;
  s4SubdivBox.style.opacity = step === 5 ? "1" : "0.62";
  s4Prev.disabled = step === 1;
  s4Next.disabled = step === 5;
}

const s4Loop = loop(s4Canvas, (_t, _dt, { still }) => {
  if (!s4Dirty && !still) return;
  drawSec04();
  s4Dirty = false;
});
const markS4 = () => { s4Dirty = true; s4Loop.draw(); };

function setStep04(n) {
  s4State.step = clamp(n, 1, 5);
  document.querySelectorAll(".step-tab").forEach((b) => {
    const active = Number(b.dataset.step) === s4State.step;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  markS4();
}
document.querySelectorAll(".step-tab").forEach((b) => b.addEventListener("click", () => setStep04(Number(b.dataset.step))));
s4Prev.addEventListener("click", () => setStep04(s4State.step - 1));
s4Next.addEventListener("click", () => setStep04(s4State.step + 1));
document.querySelectorAll("[data-bays]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s4State.bays = Number(btn.dataset.bays);
    if (s4State.step !== 5) setStep04(5);
    document.querySelectorAll("[data-bays]").forEach((b) => b.classList.toggle("is-active", b === btn));
    markS4();
  });
});

// ==================== 05 节：1711 巴洛克剧场座次验真器 ====================
const s5Canvas = document.getElementById("s5-canvas");
const s5Note = document.getElementById("s5-note");
const s5State = { mode: "two", seat: "side" };
let s5Dirty = true;

function drawSec05() {
  const { ctx, w, h } = fitCanvas(s5Canvas);
  ctx.fillStyle = C.paperBright;
  ctx.fillRect(0, 0, w, h);

  // 左 36%：剧院平面座次图；右 64%：该座位眼中的舞台布景
  const splitX = Math.round(w * 0.36);

  // ---- 左：平面座次 ----
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, splitX, h);
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(splitX, 0); ctx.lineTo(splitX, h); ctx.stroke();

  const px = splitX * 0.5;
  const stageY = h * 0.25;
  // 舞台开口
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(splitX * 0.14, h * 0.1, splitX * 0.72, h * 0.26);
  // 布景片方向示意
  ctx.strokeStyle = s5State.mode === "one" ? C.teal : C.orange;
  ctx.lineWidth = 2;
  if (s5State.mode === "one") {
    for (let i = 0; i < 3; i++) {
      const y = h * (0.14 + i * 0.07);
      ctx.beginPath(); ctx.moveTo(splitX * 0.20, y); ctx.lineTo(splitX * 0.36, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(splitX * 0.64, y); ctx.lineTo(splitX * 0.80, y); ctx.stroke();
    }
  } else {
    // 斜角柱廊布景片
    ctx.beginPath();
    ctx.moveTo(splitX * 0.22, h * 0.31);
    ctx.lineTo(splitX * 0.50, h * 0.14);
    ctx.lineTo(splitX * 0.78, h * 0.28);
    ctx.stroke();
  }

  // 观众席马蹄弧
  ctx.strokeStyle = "#B8AEA0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, h * 0.60, splitX * 0.34, 0, Math.PI);
  ctx.stroke();

  const seatCenter = [px, h * 0.84];
  const seatSide = [px + splitX * 0.29, h * 0.68];
  const activeSeat = s5State.seat === "center" ? seatCenter : seatSide;

  // 视线锥
  ctx.fillStyle = "rgba(12, 98, 92, 0.14)";
  ctx.beginPath();
  ctx.moveTo(activeSeat[0], activeSeat[1]);
  ctx.lineTo(splitX * 0.16, stageY + 12);
  ctx.lineTo(splitX * 0.84, stageY + 12);
  ctx.closePath();
  ctx.fill();

  // 两个座位点
  const drawSeat = (p, active, lbl, dx = 0) => {
    ctx.fillStyle = active ? C.orange : "#A59E92";
    ctx.beginPath(); ctx.arc(p[0], p[1], active ? 6 : 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '500 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = active ? C.ink : C.inkSoft;
    ctx.textAlign = "center";
    ctx.fillText(lbl, p[0] + dx, p[1] + 18);
  };
  drawSeat(seatCenter, s5State.seat === "center", "中央座", 0);
  drawSeat(seatSide, s5State.seat === "side", "侧翼座", -8);

  // ---- 右：该座位看到的舞台透视 ----
  const sx = splitX + 16;
  const sw = w - splitX - 32;
  const sy = 16;
  const sh = h - 32;
  const hLine = sy + sh * 0.52;

  ctx.save();
  ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
  ctx.fillStyle = "#FAF1E4";
  ctx.fillRect(sx, sy, sw, sh);

  if (s5State.mode === "one") {
    // 旧式一点透视长廊：中轴 VP 写死在舞台中央，侧座观看时产生明显的斜向拉扯错位
    const skew = s5State.seat === "side" ? -sw * 0.18 : 0;
    const vpX = sx + sw * 0.5 + skew;
    ctx.strokeStyle = s5State.seat === "side" ? C.err : C.teal;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(sx, hLine); ctx.lineTo(sx + sw, hLine); ctx.stroke();
    ctx.setLineDash([]);

    // 两侧对称列柱
    for (let i = 0; i < 4; i++) {
      const t = 0.12 + i * 0.19;
      const lx = sx + sw * (0.08 + t * 0.36) + skew * t * 0.6;
      const rx = sx + sw * (0.92 - t * 0.36) + skew * t * 0.6;
      const topY = sy + sh * (0.10 + t * 0.36);
      const botY = sy + sh * (0.90 - t * 0.32);
      const colW = Math.max(6, (1 - t) * 20);
      ctx.fillStyle = C.terracotta;
      ctx.fillRect(lx, topY, colW, botY - topY);
      ctx.fillStyle = "#D4C5AF";
      ctx.fillRect(rx - colW, topY, colW, botY - topY);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(lx, topY, colW, botY - topY);
      ctx.strokeRect(rx - colW, topY, colW, botY - topY);
    }

    // 收束线
    ctx.strokeStyle = s5State.seat === "side" ? C.err : C.teal;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx + sw * 0.08, sy + sh * 0.10); ctx.lineTo(vpX, hLine);
    ctx.moveTo(sx + sw * 0.92, sy + sh * 0.10); ctx.lineTo(vpX, hLine);
    ctx.moveTo(sx + sw * 0.08, sy + sh * 0.90); ctx.lineTo(vpX, hLine);
    ctx.moveTo(sx + sw * 0.92, sy + sh * 0.90); ctx.lineTo(vpX, hLine);
    ctx.stroke();

    ctx.fillStyle = s5State.seat === "side" ? C.err : C.teal;
    ctx.beginPath(); ctx.arc(vpX, hLine, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    // 1711 比比耶纳斜角舞台：中央柱廊转角向前，左右双灭点甩出台口之外
    const shift = s5State.seat === "side" ? -0.06 : 0;
    const cornerX = sx + sw * (0.46 + shift);
    const vpLx = sx - sw * 0.25;
    const vpRx = sx + sw * 1.28;

    ctx.strokeStyle = C.teal;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx, hLine); ctx.lineTo(sx + sw, hLine); ctx.stroke();
    ctx.setLineDash([]);

    // 柱廊斜向两侧退远
    const drawWing = (toX, fillCol, count) => {
      const top0 = sy + sh * 0.12, bot0 = sy + sh * 0.90;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(cornerX, top0); ctx.lineTo(toX, hLine); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cornerX, bot0); ctx.lineTo(toX, hLine); ctx.stroke();
      for (let i = 0; i < count; i++) {
        const s = 0.06 + i * 0.15;
        const x = cornerX + (toX - cornerX) * s;
        const yT = top0 + (hLine - top0) * s;
        const yB = bot0 + (hLine - bot0) * s;
        const pw = Math.max(5, (1 - s) * 16);
        ctx.fillStyle = fillCol;
        ctx.fillRect(x - pw * 0.5, yT, pw, yB - yT);
        ctx.strokeRect(x - pw * 0.5, yT, pw, yB - yT);
      }
    };
    drawWing(vpLx, C.terracotta, 4);
    drawWing(vpRx, C.creamWall, 5);
  }

  ctx.restore();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx, sy, sw, sh);

  if (s5State.mode === "one" && s5State.seat === "side") {
    s5Note.textContent = "旧式单点舞台 · 右侧翼包厢：画死在舞台中轴的唯一灭点与你的实际视线错开，侧翼观众会一眼看出对称长廊向左侧扭斜穿帮。";
  } else if (s5State.mode === "one") {
    s5Note.textContent = "旧式单点舞台 · 中央君王座：唯有坐在正中轴的公爵包厢里，对称长廊的透视才完全严丝合缝。";
  } else if (s5State.seat === "side") {
    s5Note.textContent = "比比耶纳斜角舞台 · 右侧翼包厢：双灭点把纵深甩向台口左右两侧之外，不再强绑单一中心轴，侧座观众看到的依然是宏阔连贯的斜向柱廊。";
  } else {
    s5Note.textContent = "比比耶纳斜角舞台 · 中央座：柱廊从前转角向左右斜插延伸，即使坐在正中也比传统中轴更富戏剧张力与无限纵深感。";
  }
}

const s5Loop = loop(s5Canvas, (_t, _dt, { still }) => {
  if (!s5Dirty && !still) return;
  drawSec05();
  s5Dirty = false;
});
const markS5 = () => { s5Dirty = true; s5Loop.draw(); };

document.querySelectorAll("[data-t-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s5State.mode = btn.dataset.tMode;
    document.querySelectorAll("[data-t-mode]").forEach((b) => {
      const a = b === btn; b.classList.toggle("is-active", a); b.setAttribute("aria-pressed", String(a));
    });
    markS5();
  });
});
document.querySelectorAll("[data-t-seat]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s5State.seat = btn.dataset.tSeat;
    document.querySelectorAll("[data-t-seat]").forEach((b) => {
      const a = b === btn; b.classList.toggle("is-active", a); b.setAttribute("aria-pressed", String(a));
    });
    markS5();
  });
});

// ==================== 06 节：什么时候用 / 何时换法 ====================
const USE_CASES = {
  corner: {
    ok: true,
    verdict: "推荐使用两点透视",
    title: "建筑街角与外观方案",
    body: "建筑摄影与方案效果图最常端平相机（必要时用移轴镜头），让全部竖向墙角绝对垂直、左右立面向画外双灭点沉稳收束——既立体真实，又没有大楼后仰倒塌感。",
    alt: '同属线性透视家族：先看总纲 <a href="https://layout.xiaoxiaodong.ai/069/play/">069 线性透视</a>，再按镜头姿态切换单点、两点与三点。',
  },
  interior: {
    ok: true,
    verdict: "推荐使用两点透视",
    title: "室内客厅与展厅转角",
    body: "从房间一角斜望两面交汇的墙，能同时展示沙发主墙与采光窗侧墙的深度关系，比死板正对一面墙更轻松自然；只需注意别把双灭点挤进画内，以免墙角鼓胀。",
    alt: '若想营造走道尽头聚焦的庄重感，则可换用 <a href="https://layout.xiaoxiaodong.ai/070/play/">070 一点透视</a>。',
  },
  product: {
    ok: true,
    verdict: "推荐使用两点透视",
    title: "桌拍产品与包装立体图",
    body: "包装盒、音箱、家电在画册或主图里微转 25°–35° 摆放，并用中长焦把双灭点推远至画外，就能兼顾正面品牌识别与侧面结构厚度。",
    alt: '若画面需要多个模块按完全一致的比例排阵，建议改用 <a href="https://layout.xiaoxiaodong.ai/075/play/">075 等距构图</a>。',
  },
  cad: {
    ok: false,
    verdict: "慎用两点 · 改用等距或轴测",
    title: "工业零件与尺寸比对图",
    body: "两点透视天生遵循“近大远小”，同样 10 厘米的孔距放在远端会被透视压短，工程师和读者无法直接跨前后比对真实尺寸，强用只会制造读数错觉。",
    alt: '需要无透视缩放的严谨尺寸可读性时，请直接换用 <a href="https://layout.xiaoxiaodong.ai/075/play/">075 等距构图</a> 或 <a href="https://layout.xiaoxiaodong.ai/076/play/">076 轴测构图</a>。',
  },
  ritual: {
    ok: false,
    verdict: "慎用两点 · 改用一点透视",
    title: "仪式感中轴长廊海报",
    body: "当你需要礼堂、地铁站厅或对称海报那样直指尽头焦点的强烈居中引力时，偏转出第二个消失点反而会打散中轴气场，让视线分流到画面两侧。",
    alt: '正面纵深、对称仪式感与强向心聚焦，交给 <a href="https://layout.xiaoxiaodong.ai/070/play/">070 一点透视</a> 更干脆。',
  },
  tower: {
    ok: false,
    verdict: "慎用两点 · 改用三点透视",
    title: "贴脚仰望摩天大楼",
    body: "站在 300 米高楼脚下仰头望天，人眼和镜头都必然向上仰起，竖向立柱会冲向高空第三个消失点。此时硬拉直竖线（强保两点）不仅丢失仰望震撼，楼顶还容易显得头重脚轻。",
    alt: '需要表现摩天高耸的仰视压迫或深渊俯瞰时，直接切到 <a href="https://layout.xiaoxiaodong.ai/072/play/">072 三点透视</a>。',
  },
};

const s6Canvas = document.getElementById("s6-canvas");
const s6Verdict = document.getElementById("s6-verdict");
const s6Title = document.getElementById("s6-title");
const s6Body = document.getElementById("s6-body");
const s6Alt = document.getElementById("s6-alt");
let s6Key = "corner";
let s6Dirty = true;

function drawSec06() {
  const { ctx, w, h } = fitCanvas(s6Canvas);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  const item = USE_CASES[s6Key];

  if (s6Key === "corner") {
    renderTwoPointStage(ctx, w, h, { scene: "bookstore", vpL: -0.08, vpR: 1.18, horizon: 0.45, vpSplit: 0 }, { showHandles: false, compact: true });
  } else if (s6Key === "product") {
    renderTwoPointStage(ctx, w, h, { scene: "poster", vpL: -0.35, vpR: 1.52, horizon: 0.25, vpSplit: 0 }, { showHandles: false, compact: true });
  } else if (s6Key === "interior") {
    // 室内墙角两点透视（内凹转角向左右灭点展开）
    const hl = h * 0.48;
    const cx = w * 0.42;
    ctx.strokeStyle = C.teal; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(0, hl); ctx.lineTo(w, hl); ctx.stroke();
    ctx.setLineDash([]);
    // 左内墙
    ctx.fillStyle = "#EFE2CF";
    poly(ctx, [[cx, h * 0.18], [cx, h * 0.78], [w * 0.06, h * 0.92], [w * 0.06, h * 0.06]]);
    ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.stroke();
    // 右内墙（窗墙）
    ctx.fillStyle = "#F7EAD7";
    poly(ctx, [[cx, h * 0.18], [cx, h * 0.78], [w * 0.94, h * 0.94], [w * 0.94, h * 0.04]]);
    ctx.fill(); ctx.stroke();
    // 窗框
    ctx.fillStyle = "rgba(12, 98, 92, 0.22)";
    poly(ctx, [[w * 0.56, h * 0.22], [w * 0.84, h * 0.16], [w * 0.84, h * 0.64], [w * 0.56, h * 0.60]]);
    ctx.fill(); ctx.stroke();
    // 地板
    ctx.fillStyle = "#E4D4BE";
    poly(ctx, [[w * 0.06, h * 0.92], [cx, h * 0.78], [w * 0.94, h * 0.94]]);
    ctx.fill(); ctx.stroke();
    drawBadge(ctx, cx, h * 0.12, "内凹墙角 · 两面墙各自向画外灭点舒展", C.teal, "#FFFFFF");
  } else if (s6Key === "cad") {
    // 等距平行线（零灭点，等长平行）
    const cx = w * 0.5, cy = h * 0.56, r = Math.min(w, h) * 0.28;
    const dx = r * Math.cos(Math.PI / 6), dy = r * Math.sin(Math.PI / 6);
    ctx.fillStyle = C.roofWarm;
    poly(ctx, [[cx, cy - r], [cx + dx, cy - r + dy], [cx, cy - r + dy * 2], [cx - dx, cy - r + dy]]);
    ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = C.terracotta;
    poly(ctx, [[cx - dx, cy - r + dy], [cx, cy - r + dy * 2], [cx, cy + dy * 2], [cx - dx, cy + dy]]);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.creamWall;
    poly(ctx, [[cx, cy - r + dy * 2], [cx + dx, cy - r + dy], [cx + dx, cy + dy], [cx, cy + dy * 2]]);
    ctx.fill(); ctx.stroke();
    drawBadge(ctx, cx, 22, "平行无灭点 · 前后等长可直读尺寸（等距构图）", C.teal, "#FFFFFF");
  } else if (s6Key === "ritual") {
    // 一点透视对称长廊
    const cx = w * 0.5, cy = h * 0.50;
    ctx.fillStyle = C.terracotta;
    poly(ctx, [[0, 0], [w * 0.36, h * 0.34], [w * 0.36, h * 0.66], [0, h]]);
    ctx.fill(); ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = C.creamWall;
    poly(ctx, [[w, 0], [w * 0.64, h * 0.34], [w * 0.64, h * 0.66], [w, h]]);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.teal; ctx.lineWidth = 1.4;
    ctx.strokeRect(w * 0.36, h * 0.34, w * 0.28, h * 0.32);
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    drawBadge(ctx, cx, 22, "唯一中心灭点 · 仪式中轴引力（070 一点透视）", C.orange, "#FFFFFF");
  } else if (s6Key === "tower") {
    // 三点透视冲天仰视
    const vpTop = [w * 0.5, -h * 0.35];
    const cx = w * 0.48;
    const b0 = [cx, h * 0.88], bL = [w * 0.26, h * 0.76], bR = [w * 0.74, h * 0.74];
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const t0 = lerp(b0, vpTop, 0.58), tL = lerp(bL, vpTop, 0.56), tR = lerp(bR, vpTop, 0.56);
    ctx.save();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = C.teal;
    [b0, bL, bR].forEach((p) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(vpTop[0], 0); ctx.stroke(); });
    ctx.restore();
    ctx.fillStyle = C.terracotta;
    poly(ctx, [b0, t0, tL, bL]); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = C.creamWall;
    poly(ctx, [b0, t0, tR, bR]); ctx.fill(); ctx.stroke();
    drawBadge(ctx, w * 0.5, 22, "竖线向高空第三灭点汇聚（072 三点透视）", C.err, "#FFFFFF");
  }

  s6Verdict.textContent = item.verdict;
  s6Verdict.className = `use-verdict ${item.ok ? "" : "is-no"}`;
  s6Title.textContent = item.title;
  s6Body.textContent = item.body;
  s6Alt.innerHTML = item.alt;
}

const s6Loop = loop(s6Canvas, (_t, _dt, { still }) => {
  if (!s6Dirty && !still) return;
  drawSec06();
  s6Dirty = false;
});
const markS6 = () => { s6Dirty = true; s6Loop.draw(); };

document.querySelectorAll("[data-use]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s6Key = btn.dataset.use;
    document.querySelectorAll("[data-use]").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-selected", String(a));
    });
    markS6();
  });
});

// ==================== 07 节：四选一盲测小练习 ====================
const quizCards = [...document.querySelectorAll(".quiz-card")];
const quizResult = document.getElementById("quiz-result");
const quizResTitle = document.getElementById("quiz-res-title");
const quizResBody = document.getElementById("quiz-res-body");
const quizBreakdown = document.getElementById("quiz-breakdown");
const quizRetry = document.getElementById("quiz-retry");

let quizAnswered = null;
let quizDirty = true;

function drawQuizAll() {
  for (const item of QUIZ_ITEMS) {
    const cv = document.querySelector(`[data-quiz="${item.key}"]`);
    if (!cv) continue;
    const { ctx, w, h } = fitCanvas(cv);
    renderTwoPointStage(ctx, w, h, item.state, {
      showHandles: false,
      showRays: quizAnswered !== null, // 作答前盲测无射线；作答后全部亮出隐藏检验射线！
      showGrid: true,
      compact: true,
    });
    if (quizAnswered !== null) {
      drawBadge(
        ctx,
        w - 8,
        16,
        item.correct ? "✓ 光学成立" : "× 结构有误",
        item.correct ? C.teal : C.err,
        "#FFFFFF",
        "right"
      );
    }
  }
}

const quizGridEl = document.getElementById("quiz-grid");
const quizLoop = loop(quizGridEl, (_t, _dt, { still }) => {
  if (!quizDirty && !still) return;
  drawQuizAll();
  quizDirty = false;
});
const markQuiz = () => { quizDirty = true; quizLoop.draw(); };

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.choice;
    quizAnswered = key;
    const picked = QUIZ_ITEMS.find((x) => x.key === key);
    quizCards.forEach((c) => {
      const it = QUIZ_ITEMS.find((x) => x.key === c.dataset.choice);
      c.classList.toggle("is-correct", it.correct);
      c.classList.toggle("is-wrong", c.dataset.choice === key && !it.correct);
    });
    quizResult.hidden = false;
    quizResTitle.textContent = picked.correct
      ? "选对了！方案 C 的双灭点与视锥最稳"
      : `你选了方案 ${key}——展开射线后就能一眼看出它的光学硬伤`;
    quizResBody.textContent = picked.reason;
    quizBreakdown.innerHTML = QUIZ_ITEMS.map(
      (it) => `<li><strong>${it.label}${it.correct ? "（正解）" : ""}：</strong>${it.reason}</li>`
    ).join("");
    markQuiz();
  });
});

quizRetry.addEventListener("click", () => {
  quizAnswered = null;
  quizResult.hidden = true;
  quizCards.forEach((c) => c.classList.remove("is-correct", "is-wrong"));
  markQuiz();
});

// ==================== 08 节：原海报放大拖拽灯箱 ====================
const posterImg = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbScaleEl = document.getElementById("lb-scale");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

const lb = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLb() {
  lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
  lbScaleEl.textContent = `${Math.round(lb.scale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lb.scale = 1; lb.x = 0; lb.y = 0;
  applyLb();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => { lb.scale = clamp(lb.scale + 0.35, 0.7, 4); applyLb(); });
lbZoomOut.addEventListener("click", () => { lb.scale = clamp(lb.scale - 0.35, 0.7, 4); applyLb(); });
lbReset.addEventListener("click", () => { lb.scale = 1; lb.x = 0; lb.y = 0; applyLb(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lb.scale = clamp(lb.scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 4);
  applyLb();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lb.dragging = true;
  lb.sx = e.clientX; lb.sy = e.clientY;
  lb.ox = lb.x; lb.oy = lb.y;
  if (lbStage.setPointerCapture) {
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  }
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lb.dragging) return;
  lb.x = lb.ox + (e.clientX - lb.sx);
  lb.y = lb.oy + (e.clientY - lb.sy);
  applyLb();
});
lbStage.addEventListener("pointerup", () => { lb.dragging = false; });
lbStage.addEventListener("pointercancel", () => { lb.dragging = false; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// 窗口尺寸变化时统一标记全部画布重画
window.addEventListener("resize", () => {
  markHeroDirty();
  markS1();
  markS2();
  markS3();
  markS4();
  markS5();
  markS6();
  markQuiz();
});
