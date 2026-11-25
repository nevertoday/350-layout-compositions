import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  WORLD_W,
  WORLD_H,
  PALETTE,
  RATIOS,
  SCENES,
  clampFrame,
  createInitialState,
  applyRatio,
  scaleFrameToZoom,
  evaluate,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// =========================================================================
// 1. 首屏双屏：暖米白全幅取景刀口台 × 深靛蓝暗房成品显影窗
// =========================================================================

const state = createInitialState("poster");
let ev = evaluate(state);
let introProgress = reducedMotion.matches ? 1 : 0;
let dashPhase = 0;
let dirtyWork = true;
let dirtyOut = true;
let outVisible = true;
let workRectCache = { width: 640, height: 420 };
let outRectCache = { width: 400, height: 260 };

const workCanvas = $("#work-canvas");
const workCtx = workCanvas.getContext("2d");
const outCanvas = $("#output-canvas");
const outCtx = outCanvas.getContext("2d");

function refreshCanvasRects() {
  const wr = workCanvas.getBoundingClientRect();
  if (wr.width >= 40 && wr.height >= 40) workRectCache = { width: wr.width, height: wr.height };
  const or = outCanvas.getBoundingClientRect();
  if (or.width >= 40 && or.height >= 40) outRectCache = { width: or.width, height: or.height };
  dirtyWork = true;
  dirtyOut = true;
}

if (typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver(([entry]) => {
    outVisible = entry.isIntersecting;
    if (outVisible) {
      dirtyOut = true;
      drawOutputCanvas();
    }
  }).observe(outCanvas);
}

const canvasDpr = () => pixelRatio(window.innerWidth <= 680 ? 1.5 : 2);

// DOM 引用
const els = {
  topStatus: $("#top-status"),
  titleFrame: $("#title-frame"),
  pageTitle: $("#page-title"),
  workHud: $("#work-hud"),
  zoomSlider: $("#zoom-slider"),
  zoomVal: $("#zoom-val"),
  xrayToggle: $("#xray-toggle"),
  outAspect: $("#output-aspect"),
  diagCard: $("#diag-card"),
  diagBadge: $("#diag-badge"),
  diagHeadline: $("#diag-headline"),
  diagBody: $("#diag-body"),
  diagTip: $("#diag-tip"),
  mEdges: $("#m-edges"),
  mVis: $("#m-vis"),
  mTension: $("#m-tension"),
  takeawayBadge: $("#takeaway-badge"),
  seals: {
    framing: { box: $("#seal-framing"), st: $("#st-framing") },
    truncation: { box: $("#seal-truncation"), st: $("#st-truncation") },
    tension: { box: $("#seal-tension"), st: $("#st-tension") },
    offCanvas: { box: $("#seal-offCanvas"), st: $("#st-offCanvas") },
  },
};

function traceShape(ctx, s, mapX, mapY, scale) {
  ctx.beginPath();
  if (s.kind === "circle") {
    ctx.arc(mapX(s.cx), mapY(s.cy), s.r * scale, 0, Math.PI * 2);
  } else if (s.kind === "rect") {
    ctx.rect(mapX(s.x), mapY(s.y), s.w * scale, s.h * scale);
  } else if (s.kind === "poly") {
    s.pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(mapX(x), mapY(y));
      else ctx.lineTo(mapX(x), mapY(y));
    });
    ctx.closePath();
  }
}

// 场景次级细节（无五官：如建筑拱洞内光、人物纯色衣领线等，仅作视觉层次修饰）
function drawSceneAccents(ctx, sceneId, mapX, mapY, scale, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (sceneId === "portrait") {
    // 纯几何衣领与肩线高光，绝不画任何五官
    ctx.strokeStyle = "rgba(252,249,243,0.45)";
    ctx.lineWidth = Math.max(1.5, scale * 0.005);
    ctx.beginPath();
    ctx.moveTo(mapX(0.49), mapY(0.39));
    ctx.quadraticCurveTo(mapX(0.57), mapY(0.47), mapX(0.66), mapY(0.39));
    ctx.stroke();
    // 颈侧柔和轮廓阴影
    ctx.fillStyle = PALETTE.green;
    ctx.fillRect(mapX(0.525), mapY(0.335), 0.08 * scale, 0.06 * scale);
  } else if (sceneId === "arch") {
    // 拱门内暖白光线
    ctx.fillStyle = "#FFFDF9";
    ctx.beginPath();
    ctx.moveTo(mapX(0.64), mapY(0.78));
    ctx.lineTo(mapX(0.64), mapY(0.52));
    ctx.quadraticCurveTo(mapX(0.64), mapY(0.38), mapX(0.75), mapY(0.38));
    ctx.quadraticCurveTo(mapX(0.86), mapY(0.38), mapX(0.86), mapY(0.52));
    ctx.lineTo(mapX(0.86), mapY(0.78));
    ctx.closePath();
    ctx.fill();
    // 前景巨柱细长受光面
    ctx.fillStyle = "rgba(255,253,249,0.16)";
    ctx.fillRect(mapX(0.34), mapY(0.11), 0.055 * scale, 0.81 * scale);
  }
  ctx.restore();
}

function getWorkMetrics(cw, ch) {
  const pad = Math.min(cw, ch) * 0.04;
  const scale = Math.min((cw - pad * 2) / WORLD_W, (ch - pad * 2) / WORLD_H);
  const ox = (cw - WORLD_W * scale) / 2;
  const oy = (ch - WORLD_H * scale) / 2;
  return {
    scale,
    ox,
    oy,
    mx: (x) => ox + x * scale,
    my: (y) => oy + y * scale,
    ux: (px) => (px - ox) / scale,
    uy: (py) => (py - oy) / scale,
  };
}

// 绘制右屏：暖米白全幅取景刀口台
function drawWorkCanvas() {
  const dpr = canvasDpr();
  const cw = Math.max(240, Math.round(workRectCache.width));
  const ch = Math.max(180, Math.round(workRectCache.height));
  if (workCanvas.width !== Math.round(cw * dpr) || workCanvas.height !== Math.round(ch * dpr)) {
    workCanvas.width = Math.round(cw * dpr);
    workCanvas.height = Math.round(ch * dpr);
  }
  dirtyWork = false;
  const ctx = workCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const m = getWorkMetrics(cw, ch);
  const sc = ev.scene;
  const f = ev.frame;

  // 1. 暖米白原海报纸底 + 极细暗房标尺微格
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, cw, ch);

  ctx.strokeStyle = "rgba(13,16,20,0.045)";
  ctx.lineWidth = 1;
  const step = 0.08 * m.scale;
  ctx.beginPath();
  for (let x = m.ox; x <= m.ox + WORLD_W * m.scale + 1; x += step) {
    ctx.moveTo(x, m.oy);
    ctx.lineTo(x, m.oy + WORLD_H * m.scale);
  }
  for (let y = m.oy; y <= m.oy + WORLD_H * m.scale + 1; y += step) {
    ctx.moveTo(m.ox, y);
    ctx.lineTo(m.ox + WORLD_W * m.scale, y);
  }
  ctx.stroke();

  const fx = m.mx(f.x);
  const fy = m.my(f.y);
  const fw = f.w * m.scale;
  const fh = f.h * m.scale;

  // 2. 框外区域：123 原海报标志性「彩色虚线延伸轮廓」+ 极淡纸灰投影
  ctx.save();
  // 先淡化绘制整个原稿的幽灵色块（帮助理解完整形体），再叠加原海报同色虚线轮廓
  for (const s of sc.shapes) {
    traceShape(ctx, s, m.mx, m.my, m.scale);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = 0.085;
    ctx.fill();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = s.dashColor;
    ctx.lineWidth = Math.max(2, m.scale * 0.0055);
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -dashPhase;
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // 3. 框内实景裁剪区：100% 饱和实色形体
  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();

  ctx.fillStyle = PALETTE.paperBright;
  ctx.fillRect(fx, fy, fw, fh);

  for (const s of sc.shapes) {
    traceShape(ctx, s, m.mx, m.my, m.scale);
    ctx.fillStyle = s.color;
    ctx.fill();
  }
  drawSceneAccents(ctx, sc.id, m.mx, m.my, m.scale, 1);

  // 框内微弱三分辅助点（仅极轻印迹，绝不抢戏）
  ctx.strokeStyle = "rgba(255,253,249,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fx + fw / 3, fy);
  ctx.lineTo(fx + fw / 3, fy + fh);
  ctx.moveTo(fx + (fw * 2) / 3, fy);
  ctx.lineTo(fx + (fw * 2) / 3, fy + fh);
  ctx.moveTo(fx, fy + fh / 3);
  ctx.lineTo(fx + fw, fy + fh / 3);
  ctx.moveTo(fx, fy + (fh * 2) / 3);
  ctx.lineTo(fx + fw, fy + (fh * 2) / 3);
  ctx.stroke();
  ctx.restore();

  // 4. 人物关节 / 建筑檐口禁忌线提示（仅在对应题材里轻显）
  if (sc.joints.length) {
    ctx.save();
    for (const j of sc.joints) {
      const yMid = m.my((j.min + j.max) / 2);
      const isHit = ev.jointHit && ev.jointHit.id === j.id;
      ctx.strokeStyle = isHit ? PALETTE.alert : "rgba(185,28,28,0.28)";
      ctx.lineWidth = isHit ? 2.5 : 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(m.mx(0.24), yMid);
      ctx.lineTo(m.mx(1.04), yMid);
      ctx.stroke();
      ctx.setLineDash([]);
      if (isHit) {
        ctx.fillStyle = PALETTE.alert;
        ctx.font = `700 ${Math.max(11, Math.round(cw * 0.015))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText(`× 误切：${j.label}`, m.mx(1.03), yMid - 6);
      }
    }
    ctx.restore();
  }

  // 5. 取景框外框线 + 四条破框边高亮 + 四个粗 L 形取景角标（带平滑入场微动）
  const spread = (1 - introProgress) * 18;
  const borderCol = ev.ok ? PALETTE.green : PALETTE.ink;

  ctx.save();
  // 外围细白衬底线增强对比（还原 123 原海报白框切色块质感）
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4.5;
  ctx.strokeRect(fx, fy, fw, fh);

  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2;
  ctx.strokeRect(fx, fy, fw, fh);

  // 被有效破框的边用朱橘/松绿强调边线
  if (ev.brokenEdges.length) {
    ctx.strokeStyle = ev.ok ? PALETTE.green : PALETTE.orange;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    if (ev.brokenEdges.includes("top")) { ctx.moveTo(fx, fy); ctx.lineTo(fx + fw, fy); }
    if (ev.brokenEdges.includes("bottom")) { ctx.moveTo(fx, fy + fh); ctx.lineTo(fx + fw, fy + fh); }
    if (ev.brokenEdges.includes("left")) { ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + fh); }
    if (ev.brokenEdges.includes("right")) { ctx.moveTo(fx + fw, fy); ctx.lineTo(fx + fw, fy + fh); }
    ctx.stroke();
  }

  // 四个粗白 L 形取景角标（内嵌在取景框四角，1:1 呼应 123 原海报！）
  const arm = clamp(Math.min(fw, fh) * 0.11, 14, 28);
  const inset = 9;
  const drawL = (x, y, dx, dy) => {
    ctx.strokeStyle = "rgba(13,16,20,0.45)";
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(x + dx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * arm);
    ctx.stroke();

    ctx.strokeStyle = "#FFFDF9";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + dx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * arm);
    ctx.stroke();
  };
  drawL(fx + inset - spread, fy + inset - spread, 1, 1);
  drawL(fx + fw - inset + spread, fy + inset - spread, -1, 1);
  drawL(fx + inset - spread, fy + fh - inset + spread, 1, -1);
  drawL(fx + fw - inset + spread, fy + fh - inset + spread, -1, -1);

  // 四角与四边中点物理抓手块
  const drawGrip = (gx, gy, isCorner) => {
    const r = isCorner ? 6 : 4.5;
    ctx.fillStyle = ev.ok ? PALETTE.green : PALETTE.orangeVivid;
    ctx.strokeStyle = "#FFFDF9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isCorner) ctx.rect(gx - r, gy - r, r * 2, r * 2);
    else ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  drawGrip(fx, fy, true);
  drawGrip(fx + fw, fy, true);
  drawGrip(fx, fy + fh, true);
  drawGrip(fx + fw, fy + fh, true);
  drawGrip(fx + fw / 2, fy, false);
  drawGrip(fx + fw / 2, fy + fh, false);
  drawGrip(fx, fy + fh / 2, false);
  drawGrip(fx + fw, fy + fh / 2, false);

  // 6. 擦边 / 零破框警示标（直观标出哪里出问题）
  const tagFont = `700 ${Math.max(11, Math.round(cw * 0.0155))}px "Noto Sans SC", sans-serif`;
  ctx.font = tagFont;
  if (ev.worstTangent) {
    const tp = ev.worstTangent.pos;
    const tx = clamp(m.mx(tp.x), 88, cw - 88);
    const ty = clamp(m.my(tp.y), 26, ch - 26);
    const txt = ev.worstTangent.kind === "skim"
      ? `× 削薄皮 ${ev.worstTangent.distPct}%`
      : `× 擦边 ${ev.worstTangent.distPct}% 发紧`;
    drawCalloutPill(ctx, tx, ty, txt, PALETTE.alert);
  } else if (ev.code === "none") {
    drawCalloutPill(ctx, fx + fw / 2, Math.max(24, fy - 14), "× 0 边破框 · 向里拖边角裁切", PALETTE.alert);
  } else if (ev.code === "overcrop") {
    drawCalloutPill(ctx, fx + fw / 2, Math.max(24, fy + 20), `× 过切失认（仅留 ${Math.round(ev.primaryVisibleRatio * 100)}%）`, PALETTE.alert);
  } else if (ev.code === "ok") {
    drawCalloutPill(ctx, clamp(fx + fw - 76, 86, cw - 86), Math.max(22, fy - 14), `✓ 破框 ${ev.brokenEdges.length} 边 · 画外 ${Math.round(ev.offCanvasRatio * 100)}%`, PALETTE.green);
  }

  ctx.restore();
}

function drawCalloutPill(ctx, cx, cy, text, color) {
  const tw = ctx.measureText(text).width;
  const pw = tw + 18;
  const ph = 24;
  const x = cx - pw / 2;
  const y = cy - ph / 2;
  ctx.fillStyle = "#FFFDF9";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.fillRect(x, y, pw, ph);
  ctx.strokeRect(x, y, pw, ph);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
}

// 绘制左屏：深靛蓝暗房「观者成品显影窗」（纯裁后成片，支持一键 X-Ray 透视画外脑补）
function drawOutputCanvas() {
  const dpr = canvasDpr();
  const cw = Math.max(160, Math.round(outRectCache.width));
  const ch = Math.max(120, Math.round(outRectCache.height));
  if (outCanvas.width !== Math.round(cw * dpr) || outCanvas.height !== Math.round(ch * dpr)) {
    outCanvas.width = Math.round(cw * dpr);
    outCanvas.height = Math.round(ch * dpr);
  }
  dirtyOut = false;
  const ctx = outCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = "#061026";
  ctx.fillRect(0, 0, cw, ch);

  const sc = ev.scene;
  const f = ev.frame;
  // 若开启透视脑补（X-Ray），为画框周围留出 22% 暗夜空间展示大脑补全的发光虚线
  const padRatio = state.showXray ? 0.20 : 0.05;
  const availW = cw * (1 - padRatio * 2);
  const availH = ch * (1 - padRatio * 2);
  const scale = Math.min(availW / f.w, availH / f.h);
  const pw = f.w * scale;
  const ph = f.h * scale;
  const px0 = (cw - pw) / 2;
  const py0 = (ch - ph) / 2;

  const mx = (wx) => px0 + (wx - f.x) * scale;
  const my = (wy) => py0 + (wy - f.y) * scale;

  // 若开启 X-Ray：在成品窗外的深蓝暗室里透视绘制大脑自动补全的画外发光虚线！
  if (state.showXray) {
    ctx.save();
    for (const s of sc.shapes) {
      traceShape(ctx, s, mx, my, scale);
      ctx.strokeStyle = s.id === "navy" ? "#8CB8FF" : s.dashColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -dashPhase;
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 成品画幅纯裁切输出（严格 clip 到成品边界，所见即所得！）
  ctx.save();
  ctx.beginPath();
  ctx.rect(px0, py0, pw, ph);
  ctx.clip();

  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(px0, py0, pw, ph);

  for (const s of sc.shapes) {
    traceShape(ctx, s, mx, my, scale);
    ctx.fillStyle = s.color;
    ctx.fill();
  }
  drawSceneAccents(ctx, sc.id, mx, my, scale, 1);
  ctx.restore();

  // 成品外纸边细线
  ctx.strokeStyle = ev.ok ? PALETTE.okBright : "rgba(255,255,255,0.65)";
  ctx.lineWidth = ev.ok ? 2 : 1.5;
  ctx.strokeRect(px0, py0, pw, ph);
}

let lastUiSig = "";
const setTxt = (el, val) => { if (el.textContent !== val) el.textContent = val; };

// 同步所有 DOM 读数（全部只读同一份 ev 单真源，差量写入避免拖动期多余回流）
function syncUI(forceButtons = false) {
  ev = evaluate(state);
  const stateAttr = ev.ok ? "ok" : "warn";

  setTxt(els.topStatus, ev.badge);
  if (els.topStatus.dataset.state !== stateAttr) els.topStatus.dataset.state = stateAttr;

  // 自示范标题联动：裁切成立时，标题大字微微左推轻触绿色取景角标
  els.titleFrame.classList.toggle("is-cropped", ev.ok);
  const shiftX = ev.brokenEdges.length ? -Math.min(7, ev.brokenEdges.length * 1.8) : 0;
  els.pageTitle.style.transform = `translateX(${shiftX.toFixed(1)}px)`;

  setTxt(els.workHud, `${ev.brokenEdges.length}/4 EDGES · ZOOM ${ev.zoomPct}%`);
  const zStr = String(ev.zoomPct);
  if (els.zoomSlider.value !== zStr) els.zoomSlider.value = zStr;
  setTxt(els.zoomVal, `${ev.zoomPct}%`);

  const ratioObj = RATIOS[state.ratio];
  const realAspect = (ev.frame.w / ev.frame.h).toFixed(2);
  setTxt(els.outAspect, `${ratioObj ? ratioObj.id.toUpperCase() : "FREE"} · ${realAspect}:1`);

  const diagSig = `${stateAttr}|${ev.badge}|${ev.headline}|${ev.brokenEdges.length}|${Math.round(ev.primaryVisibleRatio * 100)}|${Math.round(ev.offCanvasRatio * 100)}|${ev.tensionTier}`;
  if (diagSig !== lastUiSig || forceButtons) {
    lastUiSig = diagSig;
    els.diagCard.dataset.state = stateAttr;
    setTxt(els.diagBadge, ev.badge);
    setTxt(els.diagHeadline, ev.headline);
    setTxt(els.diagBody, ev.body);
    setTxt(els.diagTip, ev.tip);

    setTxt(els.mEdges, `${ev.brokenEdges.length} / 4 边`);
    setTxt(els.mVis, `${Math.round(ev.primaryVisibleRatio * 100)}% / ${Math.round(ev.offCanvasRatio * 100)}%`);
    setTxt(els.mTension, ev.tensionTier);

    els.takeawayBadge.classList.toggle("is-ok", ev.ok);

    // 原海报底沿四符实况同步
    els.seals.framing.box.dataset.pass = String(ev.checks.framing);
    setTxt(els.seals.framing.st, ev.jointHit
      ? "误切死穴"
      : ev.worstTangent
        ? `擦边 ${ev.worstTangent.distPct}%`
        : `${ev.brokenEdges.length} 边破框`);

    els.seals.truncation.box.dataset.pass = String(ev.checks.truncation);
    setTxt(els.seals.truncation.st, ev.code === "overcrop"
      ? `仅留 ${Math.round(ev.primaryVisibleRatio * 100)}%`
      : `留存 ${Math.round(ev.primaryVisibleRatio * 100)}%`);

    els.seals.tension.box.dataset.pass = String(ev.checks.tension);
    setTxt(els.seals.tension.st, ev.tensionTier.replace("（示意）", ""));

    els.seals.offCanvas.box.dataset.pass = String(ev.checks.offCanvas);
    setTxt(els.seals.offCanvas.st, `延伸 ${Math.round(ev.offCanvasRatio * 100)}%`);
  }

  if (forceButtons) {
    $$(".scene-btn").forEach((b) => {
      const active = b.dataset.scene === state.scene;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    $$(".chip-btn").forEach((b) => {
      const active = b.dataset.ratio === state.ratio;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    const pr = ev.scene.presets;
    $$(".preset-btn[data-preset]").forEach((b) => {
      const key = b.dataset.preset;
      if (key !== "reset" && pr[key]) b.textContent = pr[key].label;
    });
  }
}

let pendingSync = false;
function redrawAll(immediate = false, forceButtons = true) {
  if (immediate || reducedMotion.matches) {
    pendingSync = false;
    syncUI(forceButtons);
    dirtyWork = true;
    dirtyOut = true;
    drawWorkCanvas();
    if (outVisible) drawOutputCanvas();
  } else {
    pendingSync = true;
    dirtyWork = true;
    dirtyOut = true;
    if (forceButtons) syncUI(true);
  }
}

// =========================================================================
// 2. 取景框物理交互（拖四边 / 四角 / 框内平移 / 空白横拖倍率 + 触屏 + 键盘）
// =========================================================================

let drag = null;

function hitTestFrame(wx, wy, f, tol) {
  const x0 = f.x, y0 = f.y, x1 = f.x + f.w, y1 = f.y + f.h;
  const nearL = Math.abs(wx - x0) <= tol && wy >= y0 - tol && wy <= y1 + tol;
  const nearR = Math.abs(wx - x1) <= tol && wy >= y0 - tol && wy <= y1 + tol;
  const nearT = Math.abs(wy - y0) <= tol && wx >= x0 - tol && wx <= x1 + tol;
  const nearB = Math.abs(wy - y1) <= tol && wx >= x0 - tol && wx <= x1 + tol;

  if (nearL && nearT) return "nw";
  if (nearR && nearT) return "ne";
  if (nearL && nearB) return "sw";
  if (nearR && nearB) return "se";
  if (nearL) return "w";
  if (nearR) return "e";
  if (nearT) return "n";
  if (nearB) return "s";
  if (wx > x0 && wx < x1 && wy > y0 && wy < y1) return "move";
  return "zoom";
}

const CURSOR_MAP = {
  nw: "nwse-resize", se: "nwse-resize",
  ne: "nesw-resize", sw: "nesw-resize",
  n: "ns-resize", s: "ns-resize",
  e: "ew-resize", w: "ew-resize",
  move: "grab", zoom: "ew-resize",
};

function pointerToWorld(clientX, clientY) {
  const rect = workCanvas.getBoundingClientRect();
  const m = getWorkMetrics(rect.width, rect.height);
  return {
    wx: m.ux(clientX - rect.left),
    wy: m.uy(clientY - rect.top),
    tol: 20 / m.scale,
    rect,
  };
}

function beginDrag(clientX, clientY, pointerId) {
  const { wx, wy, tol } = pointerToWorld(clientX, clientY);
  const mode = hitTestFrame(wx, wy, state.frame, tol);
  drag = {
    pointerId,
    mode,
    startX: clientX,
    startY: clientY,
    startWx: wx,
    startWy: wy,
    startFrame: { ...state.frame },
    startZoom: ev.zoomPct,
    lockedAxis: false,
  };
  workCanvas.classList.add("is-dragging");
}

function moveDrag(clientX, clientY) {
  if (!drag) return;
  const { wx, wy } = pointerToWorld(clientX, clientY);
  const dx = wx - drag.startWx;
  const dy = wy - drag.startWy;
  const sf = drag.startFrame;

  if (drag.mode === "move") {
    // 若移动幅度明显，平移取景框；同时保证在 perf 横拖测试中实时重绘
    state.frame = clampFrame({ x: sf.x + dx, y: sf.y + dy, w: sf.w, h: sf.h });
  } else if (drag.mode === "zoom") {
    const pxDelta = clientX - drag.startX;
    const nextZoom = clamp(drag.startZoom + pxDelta * 0.25, 0, 100);
    state.frame = scaleFrameToZoom(sf, nextZoom, state.ratio);
  } else {
    // 拖拽边或角：若当前锁定画幅比例，切换到自由刀口以让四边完全跟手
    let x0 = sf.x, y0 = sf.y, x1 = sf.x + sf.w, y1 = sf.y + sf.h;
    if (drag.mode.includes("w")) x0 = clamp(sf.x + dx, 0.02, x1 - 0.24);
    if (drag.mode.includes("e")) x1 = clamp(sf.x + sf.w + dx, x0 + 0.24, WORLD_W - 0.02);
    if (drag.mode.includes("n")) y0 = clamp(sf.y + dy, 0.02, y1 - 0.20);
    if (drag.mode.includes("s")) y1 = clamp(sf.y + sf.h + dy, y0 + 0.20, WORLD_H - 0.02);

    const aspect = RATIOS[state.ratio]?.aspect;
    if (aspect && drag.mode.length === 2) {
      // 角拖保持当前锁定比例
      const nw = x1 - x0;
      const nh = nw / aspect;
      if (drag.mode.includes("n")) y0 = y1 - nh;
      else y1 = y0 + nh;
    } else if (aspect && drag.mode.length === 1) {
      // 拖单边时自动释放为自由刀口，符合直觉
      state.ratio = "free";
    }
    state.frame = clampFrame({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  redrawAll(false, false);
}

function endDrag() {
  drag = null;
  workCanvas.classList.remove("is-dragging");
  redrawAll(true, true);
}

// Pointer 事件（桌面鼠标 + 现代触控）
workCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  workCanvas.setPointerCapture(e.pointerId);
  beginDrag(e.clientX, e.clientY, e.pointerId);
});

workCanvas.addEventListener("pointermove", (e) => {
  if (drag && drag.pointerId === e.pointerId) {
    moveDrag(e.clientX, e.clientY);
    return;
  }
  if (e.pointerType === "mouse") {
    const { wx, wy, tol } = pointerToWorld(e.clientX, e.clientY);
    const mode = hitTestFrame(wx, wy, state.frame, tol);
    workCanvas.style.cursor = CURSOR_MAP[mode] || "grab";
  }
});

workCanvas.addEventListener("pointerup", () => endDrag());
workCanvas.addEventListener("pointercancel", () => endDrag());

// 兼容 CDP touchStart/touchMove（tools/perf.mjs 测慢手机拖动帧率）
workCanvas.addEventListener("touchstart", (e) => {
  if (!e.touches.length || drag) return;
  const t = e.touches[0];
  beginDrag(t.clientX, t.clientY, "touch");
}, { passive: true });

workCanvas.addEventListener("touchmove", (e) => {
  if (!drag || drag.pointerId !== "touch" || !e.touches.length) return;
  const t = e.touches[0];
  const adx = Math.abs(t.clientX - drag.startX);
  const ady = Math.abs(t.clientY - drag.startY);
  if (!drag.lockedAxis && (adx > 5 || ady > 5)) {
    // 明显横向拖动则接管裁切操作，竖向则让给浏览器正常滚页
    if (ady > adx * 1.4 && drag.mode !== "n" && drag.mode !== "s") {
      endDrag();
      return;
    }
    drag.lockedAxis = true;
  }
  if (drag.lockedAxis) e.preventDefault();
  moveDrag(t.clientX, t.clientY);
}, { passive: false });

workCanvas.addEventListener("touchend", () => {
  if (drag && drag.pointerId === "touch") endDrag();
}, { passive: true });

// 键盘操作（方向键平移，+/- 缩放，R 复原）
workCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.05 : 0.02;
  let handled = true;
  const f = state.frame;
  if (e.key === "ArrowLeft") state.frame = clampFrame({ ...f, x: f.x - step });
  else if (e.key === "ArrowRight") state.frame = clampFrame({ ...f, x: f.x + step });
  else if (e.key === "ArrowUp") state.frame = clampFrame({ ...f, y: f.y - step });
  else if (e.key === "ArrowDown") state.frame = clampFrame({ ...f, y: f.y + step });
  else if (e.key === "+" || e.key === "=") state.frame = scaleFrameToZoom(f, ev.zoomPct + 5, state.ratio);
  else if (e.key === "-" || e.key === "_") state.frame = scaleFrameToZoom(f, ev.zoomPct - 5, state.ratio);
  else if (e.key === "r" || e.key === "R") {
    const fresh = createInitialState(state.scene);
    state.frame = fresh.frame;
    state.ratio = fresh.ratio;
  } else {
    handled = false;
  }
  if (handled) {
    e.preventDefault();
    redrawAll(true, true);
  }
});

// 按钮与滑杆绑定
$$(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = createInitialState(btn.dataset.scene);
    state.scene = next.scene;
    state.ratio = next.ratio;
    state.frame = next.frame;
    redrawAll(true, true);
  });
});

$$(".chip-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.ratio = btn.dataset.ratio;
    state.frame = applyRatio(state.frame, state.ratio);
    redrawAll(true, true);
  });
});

els.zoomSlider.addEventListener("input", () => {
  const z = Number(els.zoomSlider.value);
  state.frame = scaleFrameToZoom(state.frame, z, state.ratio);
  redrawAll(false, false);
});

$$(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.preset;
    if (key === "reset") {
      const fresh = createInitialState(state.scene);
      state.frame = fresh.frame;
      state.ratio = fresh.ratio;
    } else {
      const p = SCENES[state.scene].presets[key];
      if (!p) return;
      state.ratio = p.ratio;
      state.frame = clampFrame({ ...p.frame });
    }
    redrawAll(true, true);
  });
});

els.xrayToggle.addEventListener("click", () => {
  state.showXray = !state.showXray;
  els.xrayToggle.setAttribute("aria-pressed", String(state.showXray));
  els.xrayToggle.textContent = state.showXray ? "透视画外：开" : "透视画外：关";
  drawOutputCanvas();
});

// 省电动画循环（入场落位与交互脏标记按帧合并重绘，避免软件渲染空烧与同帧双绘）
const heroLoop = loop(workCanvas, (t, dt, { still }) => {
  if (still) {
    introProgress = 1;
    dashPhase = 0;
    dirtyWork = true;
    dirtyOut = true;
  } else {
    if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + dt * 2.1);
      dirtyWork = true;
    }
    if (ev.brokenEdges.length > 0 && drag) {
      dashPhase = (t * 14) % 14;
      dirtyWork = true;
    }
  }
  if (pendingSync) {
    pendingSync = false;
    syncUI(false);
  }
  if (dirtyWork) drawWorkCanvas();
  if (dirtyOut && (outVisible || still)) drawOutputCanvas();
});

window.addEventListener("resize", () => {
  refreshCanvasRects();
  heroLoop.draw();
});

// 首帧立即同步尺寸、DOM 与画布
refreshCanvasRects();
redrawAll(true);

// =========================================================================
// 3. 01 节：盒装完整 ⇄ 破框裁切刮幕对比帘
// =========================================================================

const curtainStage = $("#curtain-stage");
const curtainBefore = $("#curtain-before");
const curtainHandle = $("#curtain-handle");
const curtainRange = $("#curtain-range");
const curtainReadout = $("#curtain-readout");
const curtainCaption = $("#curtain-caption");

function setCurtain(pct) {
  const v = clamp(Math.round(pct), 8, 92);
  curtainBefore.style.width = `${v}%`;
  curtainHandle.style.left = `${v}%`;
  curtainRange.value = String(v);
  curtainReadout.textContent = `当前帘位 ${v}% · 裁切版主角视面积约 1.9×`;
  if (v <= 24) {
    curtainCaption.textContent = "已几乎全部掀开到「破框裁切版」：同一块画幅内，朱橘大圆视面积放大约 1.9 倍，边缘向外顶出强烈的压迫感与画外空间。";
  } else if (v >= 76) {
    curtainCaption.textContent = "已拉回「盒装完整版」：四个形体老实缩在方框里，四周空出一圈拘谨的留边，像陈列盒里的标本，缺乏张力。";
  } else {
    curtainCaption.textContent = "左右拖动对比帘，直接比较同一块画幅里「把形体全装进去」与「果断切出画外」的尺度落差。";
  }
}

curtainRange.addEventListener("input", () => setCurtain(Number(curtainRange.value)));

let curtainDragging = false;
curtainStage.addEventListener("pointerdown", (e) => {
  curtainDragging = true;
  curtainStage.setPointerCapture(e.pointerId);
  const r = curtainStage.getBoundingClientRect();
  setCurtain(((e.clientX - r.left) / r.width) * 100);
});
curtainStage.addEventListener("pointermove", (e) => {
  if (!curtainDragging) return;
  const r = curtainStage.getBoundingClientRect();
  setCurtain(((e.clientX - r.left) / r.width) * 100);
});
curtainStage.addEventListener("pointerup", () => { curtainDragging = false; });
curtainStage.addEventListener("pointercancel", () => { curtainDragging = false; });

// =========================================================================
// 4. 02 节：刀口落点交互解剖仪（人物无五官侧影 / 双耳陶瓶 / 拱廊建筑）
// =========================================================================

const SPECIMENS = {
  figure: {
    // 纯侧影剪影，绝不画任何五官
    artwork: `
      <rect width="360" height="420" fill="#FCF9F3"/>
      <circle cx="118" cy="148" r="76" fill="#DA4807" opacity="0.92"/>
      <!-- 发髻与无五官头部侧影 -->
      <circle cx="212" cy="82" r="20" fill="#085C44"/>
      <circle cx="178" cy="96" r="40" fill="#085C44"/>
      <!-- 颈部 -->
      <rect x="163" y="132" width="28" height="28" fill="#085C44"/>
      <!-- 躯干与双臂（明确标出肩、肘、腕轮廓） -->
      <path d="M126 164 Q177 154 228 164 L248 256 L238 352 L212 350 L216 262 L212 248 L210 385 L144 385 L142 248 L138 262 L142 350 L116 352 L106 256 Z" fill="#112E6D"/>
      <!-- 樱粉披肩 -->
      <path d="M126 164 Q177 188 228 164 L236 202 Q177 218 118 202 Z" fill="#F290B1"/>
    `,
    cuts: [
      {
        id: "f1", yPct: 14.5, label: "① 发顶微削 3%", kind: "bad",
        tag: "禁忌 · 擦边削皮",
        title: "刀口 ①：发顶微削 3%（Tangent 擦边）",
        desc: "刀口刚刚蹭掉发顶一丁点弧边，既不像留出舒展顶空，又不像大胆切入额发。观者第一眼会觉得构图没框正，视觉被迫粘在顶边。",
        rule: "修正准则：宁可向上退开留足 12% 顶空，或果断下压切入发冠 18%–25%。",
        viewBox: "30 61 300 208",
      },
      {
        id: "f2", yPct: 21.5, label: "② 切发冠 22%", kind: "good",
        tag: "成立 · 特写强张力",
        title: "刀口 ②：果断切入发冠 22%（近景特写）",
        desc: "在守住头型弧度与肩颈大势的前提下大胆切入发顶，视距瞬间推近，人物侧影与朱橘圆轮充满画幅，像时尚杂志特写封面。",
        rule: "成立原理：大脑对圆形头颅有极强先验图式，切掉顶部两成完全不影响识别。",
        viewBox: "52 88 256 178",
      },
      {
        id: "f3", yPct: 35.5, label: "③ 颈部咽喉切", kind: "bad",
        tag: "禁忌 · 关节断颈",
        title: "刀口 ③：底边正切颈部最细处",
        desc: "下框线正好横截在脖子正中，仿佛把头颅生硬地摆在画框底边上，缺乏肩颈托底，造成强烈的不安与“斩首”错觉。",
        rule: "修正准则：半身像底边绝不停在脖子正中，应继续向下纳入肩膀与锁骨。",
        viewBox: "44 26 272 123",
      },
      {
        id: "f4", yPct: 50.5, label: "④ 胸上安全切", kind: "good",
        tag: "成立 · 经典半身",
        title: "刀口 ④：胸口中段平稳截断（经典近景）",
        desc: "刀口避开颈部与手肘，稳稳落在胸腹平整肌理段，同时左方朱橘圆盘破出左框，兼具舒展呼吸与清晰人物气场。",
        rule: "成立原理：把刀口落在骨骼长段中腹（大臂中段、胸口、大腿中段），观感最自然。",
        viewBox: "58 24 274 189",
      },
      {
        id: "f5", yPct: 62.5, label: "⑤ 肘关节切", kind: "bad",
        tag: "禁忌 · 切中肘弯",
        title: "刀口 ⑤：底边恰好切在手肘关节转折处",
        desc: "关节是人体弯折与承重的节点。画框压在肘弯上，会让双臂像截肢般僵直停住，破坏肢体向画外延伸的流畅势头。",
        rule: "修正准则：上移到上臂中段（胸上景），或下移至小臂中段/腰胯以下。",
        viewBox: "36 28 288 234",
      },
      {
        id: "f6", yPct: 83.5, label: "⑥ 手腕关节切", kind: "bad",
        tag: "禁忌 · 断腕裁切",
        title: "刀口 ⑥：底边截断在手腕处",
        desc: "刚好把整条手臂全拍进来，却单单把双手切在画框底沿外面，观者下意识会疑惑“手去哪了”，视觉重量悬空不落地。",
        rule: "修正准则：要拍手就留完整手掌并给底边呼吸距；不拍手就在小臂中段果断收口。",
        viewBox: "26 30 308 320",
      },
    ],
  },

  vessel: {
    artwork: `
      <rect width="360" height="420" fill="#FCF9F3"/>
      <circle cx="116" cy="166" r="88" fill="#DA4807"/>
      <rect x="0" y="346" width="360" height="74" fill="#112E6D"/>
      <rect x="190" y="346" width="170" height="30" fill="#F290B1"/>
      <!-- 双耳高颈陶瓶 -->
      <path d="M150 156 C108 160 108 228 142 238" fill="none" stroke="#085C44" stroke-width="14" stroke-linecap="round"/>
      <path d="M210 156 C252 160 252 228 218 238" fill="none" stroke="#085C44" stroke-width="14" stroke-linecap="round"/>
      <path d="M154 96 L206 96 L196 122 L196 174 C236 196 244 252 228 314 C222 336 208 348 202 350 L158 350 C152 348 138 336 132 314 C116 252 124 196 164 174 L164 122 Z" fill="#085C44"/>
      <ellipse cx="180" cy="96" rx="26" ry="6" fill="#053F2E"/>
      <path d="M132 256 Q180 270 228 256" fill="none" stroke="#FCF9F3" stroke-width="4.5"/>
    `,
    cuts: [
      {
        id: "v1", yPct: 22.8, label: "① 瓶口擦边", kind: "bad",
        tag: "禁忌 · 顶框压口",
        title: "刀口 ①：顶框线紧擦瓶口边缘",
        desc: "陶瓶瓶口只差几像素就顶破画框，产生强烈的窒息摩擦感，原本舒展的器型被死死顶在天花板上。",
        rule: "修正准则：给瓶口上方留足 15% 空气，或直接切掉瓶身下半部而非蹭擦瓶口。",
        viewBox: "26 94 308 266",
      },
      {
        id: "v2", yPct: 37.5, label: "② 瓶颈喉口切", kind: "bad",
        tag: "禁忌 · 切中结构转折",
        title: "刀口 ②：横切在细颈与瓶耳起势转折处",
        desc: "瓶颈与瓶耳连接处是最关键的辨识转折点，把刀口压在这里，下方只剩一坨半圆绿块，器物身份瞬间模糊。",
        rule: "修正准则：保留完整的瓶口—瓶颈—瓶耳特征链，改从瓶腹下缘和背景圆盘处破框。",
        viewBox: "54 156 260 180",
      },
      {
        id: "v3", yPct: 68.0, label: "③ 瓶腹果断破底", kind: "good",
        tag: "成立 · 静物大特写",
        title: "刀口 ③：果断切掉瓶腹底段与左圆盘",
        desc: "完整保住瓶口、双耳与腰线白环三大识别锚点，同时让瓶腹下缘与朱橘圆盘左沿果断破框，器物立刻显出雕塑般的纪念碑体量。",
        rule: "成立原理：先守住辨识锚点，再切掉大脑最容易脑补的对称延伸段。",
        viewBox: "68 64 236 222",
      },
      {
        id: "v4", yPct: 83.2, label: "④ 瓶底紧擦底线", kind: "bad",
        tag: "禁忌 · 无立足垫底",
        title: "刀口 ④：底框线刚好擦过陶瓶最底缘",
        desc: "瓶身一毫米不差地站在画框底沿上，连桌面厚度都没留出来，器物像浮在纸边缘随时要掉下去。",
        rule: "修正准则：要么多露 12% 以上深靛蓝桌面托底，要么往上切进瓶腹 20% 彻底破底。",
        viewBox: "24 58 312 292",
      },
    ],
  },

  facade: {
    artwork: `
      <rect width="360" height="420" fill="#FCF9F3"/>
      <circle cx="252" cy="118" r="64" fill="#DA4807"/>
      <!-- 深靛蓝拱廊主体 -->
      <path d="M126 112 H318 V348 H266 V226 Q266 174 222 174 Q178 174 178 226 V348 H126 Z" fill="#112E6D"/>
      <!-- 深松绿前景巨柱 -->
      <rect x="46" y="42" width="66" height="328" fill="#085C44"/>
      <rect x="92" y="42" width="16" height="328" fill="#18785C"/>
      <!-- 樱粉台阶 -->
      <rect x="34" y="346" width="298" height="42" fill="#F290B1"/>
    `,
    cuts: [
      {
        id: "a1", yPct: 26.8, label: "① 檐口压顶擦边", kind: "bad",
        tag: "禁忌 · 顶天憋死",
        title: "刀口 ①：顶框线紧贴深靛蓝廊檐边沿",
        desc: "拱廊水平屋檐与画框顶边几乎重合成一条死线，建筑物失去天空喘息，整张图憋闷局促。",
        rule: "修正准则：抬高顶边留出天空与橘日，或大胆切穿巨柱与廊壁 15% 以上。",
        viewBox: "24 110 312 246",
      },
      {
        id: "a2", yPct: 41.5, label: "② 拱顶弧尖擦边", kind: "bad",
        tag: "禁忌 · 切破拱门顶点",
        title: "刀口 ②：顶边恰好压死在拱洞最高弧尖",
        desc: "拱门最迷人的几何张力来自完整半圆弧顶；刀口紧擦弧顶会让拱门显得坍塌矮挫，失去建筑韵律。",
        rule: "修正准则：拱门弧顶上方必须留出结构实墙承重，绝不在圆弧切点落刀。",
        viewBox: "36 173 296 206",
      },
      {
        id: "a3", yPct: 19.5, label: "③ 巨柱破顶经典切", kind: "good",
        tag: "成立 · 宏大建筑尺度",
        title: "刀口 ③：果断切穿前景巨柱顶底 + 保全拱门光洞",
        desc: "前景深松绿巨柱向上下双双破出画框，暗示它直入云端；右侧拱门完整保留承重墙与半圆光洞，远近尺度瞬间拉开。",
        rule: "成立原理：用前景巨柱破框代表“无限高大”，用远景完整拱洞锚定空间焦点。",
        viewBox: "66 80 236 250",
      },
      {
        id: "a4", yPct: 83.0, label: "④ 仅剩柱脚失认", kind: "bad",
        tag: "禁忌 · 过切丢结构",
        title: "刀口 ④：砍掉拱顶与半柱，只留一排底脚色块",
        desc: "裁掉上半全部拱门特征后，画面退化成四条看不懂来历的竖色块，建筑空间感彻底瓦解。",
        rule: "修正准则：确认观者能从留存片段认出建筑门廊关系，再做边缘截断。",
        viewBox: "42 256 260 148",
      },
    ],
  },
};

let activeSpecimen = "figure";
let activeCutIdx = 0;

function renderSpecimen(specId, cutIdx = 0) {
  activeSpecimen = specId;
  const sp = SPECIMENS[specId];
  activeCutIdx = clamp(cutIdx, 0, sp.cuts.length - 1);

  $("#specimen-svg").innerHTML = sp.artwork;
  const overlay = $("#cutline-buttons");
  overlay.innerHTML = "";

  sp.cuts.forEach((c, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cutline-btn" + (idx === activeCutIdx ? " is-active" : "");
    btn.dataset.kind = c.kind;
    btn.style.top = `${c.yPct}%`;
    btn.setAttribute("aria-pressed", String(idx === activeCutIdx));
    btn.innerHTML = `<span class="cutline-pill">${c.label}</span>`;
    btn.addEventListener("click", () => renderSpecimen(specId, idx));
    overlay.appendChild(btn);
  });

  const cur = sp.cuts[activeCutIdx];
  const prevSvg = $("#cut-preview-svg");
  prevSvg.setAttribute("viewBox", cur.viewBox);
  prevSvg.innerHTML = sp.artwork;

  const tag = $("#cut-tag");
  tag.textContent = cur.tag;
  tag.dataset.kind = cur.kind;
  $("#cut-title").textContent = cur.title;
  $("#cut-desc").textContent = cur.desc;
  $("#cut-rule").innerHTML = `<strong>${cur.rule.split("：")[0]}：</strong>${cur.rule.split("：").slice(1).join("：")}`;

  $$(".anat-tab").forEach((b) => {
    const on = b.dataset.specimen === specId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

$$(".anat-tab").forEach((b) => b.addEventListener("click", () => renderSpecimen(b.dataset.specimen, 0)));
renderSpecimen("figure", 0);

// =========================================================================
// 5. 03 节深松绿暗室：诺埃尔·布尔什「画外的六个房间」
// =========================================================================

const ROOMS = {
  left: {
    kicker: "ROOM 01 · LEFT BORDER",
    title: "左画外：巨物压入与来源悬念",
    desc: "当朱橘大圆或车头只露出右半边压进左侧画框，大脑会立刻在画框左边搭建出庞大得多的主体与行进起点，形成强烈的“正在闯入”动能。",
    use: "常见用法：展讯海报巨型字首破左框、移动端卡片左滑入场、人物半身从左入画。",
    svg: `
      <rect width="360" height="270" fill="#072B21"/>
      <rect x="64" y="34" width="248" height="202" fill="#FCF9F3" stroke="#6DE0B8" stroke-width="2.5"/>
      <!-- 框外左室虚线巨圆 -->
      <circle cx="64" cy="135" r="78" fill="none" stroke="#FF8547" stroke-width="2.5" stroke-dasharray="6 5"/>
      <clipPath id="rm-clip-l"><rect x="64" y="34" width="248" height="202"/></clipPath>
      <g clip-path="url(#rm-clip-l)">
        <circle cx="64" cy="135" r="78" fill="#DA4807"/>
        <rect x="196" y="88" width="68" height="94" fill="#112E6D"/>
      </g>
      <!-- 动能指示箭 -->
      <path d="M18 135H52M42 125L54 135L42 145" fill="none" stroke="#FF8547" stroke-width="3"/>
      <text x="188" y="256" text-anchor="middle" fill="#6DE0B8" font-size="12" font-weight="700">激活左画外 · 破框压入感</text>
    `,
  },
  right: {
    kicker: "ROOM 02 · RIGHT BORDER",
    title: "右画外：视线去向与未完待续",
    desc: "当画面内的侧影人物望向右侧、或箭矢与卡片向右侧破出画框时，右画外房间被点亮——观者会不由自主地猜测“那边还有谁、滑过去还有什么”。",
    use: "常见用法：移动端横向轮播右缘露头（Peek Cropping）、叙事海报视线留前。",
    svg: `
      <rect width="360" height="270" fill="#072B21"/>
      <rect x="48" y="34" width="248" height="202" fill="#FCF9F3" stroke="#6DE0B8" stroke-width="2.5"/>
      <!-- 右画外延展虚线 -->
      <rect x="242" y="72" width="104" height="126" fill="none" stroke="#FFA9C5" stroke-width="2.5" stroke-dasharray="6 5"/>
      <clipPath id="rm-clip-r"><rect x="48" y="34" width="248" height="202"/></clipPath>
      <g clip-path="url(#rm-clip-r)">
        <circle cx="132" cy="135" r="46" fill="#085C44"/>
        <rect x="242" y="72" width="104" height="126" fill="#F290B1"/>
        <path d="M184 135H232" stroke="#DA4807" stroke-width="3" stroke-dasharray="5 4"/>
      </g>
      <path d="M306 135H342M332 125L344 135L332 145" fill="none" stroke="#FF8547" stroke-width="3"/>
      <text x="172" y="256" text-anchor="middle" fill="#6DE0B8" font-size="12" font-weight="700">激活右画外 · 引导视线继续向右</text>
    `,
  },
  top: {
    kicker: "ROOM 03 · TOP BORDER",
    title: "上画外：直入云霄的纪念碑高度",
    desc: "把高柱、塔楼、林木的上半截果断切出顶框，建筑物的高度就不再被纸张封顶，观者在脑海里会顺着竖线一直向上延伸。",
    use: "常见用法：建筑摄影巨柱破顶、123 原海报深松绿 L 柱顶破画框。",
    svg: `
      <rect width="360" height="270" fill="#072B21"/>
      <rect x="56" y="54" width="248" height="184" fill="#FCF9F3" stroke="#6DE0B8" stroke-width="2.5"/>
      <rect x="192" y="10" width="76" height="162" fill="none" stroke="#6DE0B8" stroke-width="2.5" stroke-dasharray="6 5"/>
      <clipPath id="rm-clip-t"><rect x="56" y="54" width="248" height="184"/></clipPath>
      <g clip-path="url(#rm-clip-t)">
        <rect x="192" y="10" width="76" height="162" fill="#085C44"/>
        <circle cx="126" cy="166" r="46" fill="#DA4807"/>
      </g>
      <path d="M230 46V16M220 26L230 14L240 26" fill="none" stroke="#FF8547" stroke-width="3"/>
      <text x="180" y="258" text-anchor="middle" fill="#6DE0B8" font-size="12" font-weight="700">激活上画外 · 无限拔高尺度</text>
    `,
  },
  bottom: {
    kicker: "ROOM 04 · BOTTOM BORDER",
    title: "下画外：沉稳扎根与重力延展",
    desc: "半身像、阶梯、建筑基座稳稳沉出底框，不再悬浮在画内，而是仿佛站在观者脚下同一片大地之上，画面立刻厚重稳当。",
    use: "常见用法：人物胸上近景、产品基座沉底、123 原海报深靛蓝与樱粉块破底。",
    svg: `
      <rect width="360" height="270" fill="#072B21"/>
      <rect x="56" y="24" width="248" height="182" fill="#FCF9F3" stroke="#6DE0B8" stroke-width="2.5"/>
      <rect x="92" y="142" width="176" height="106" fill="none" stroke="#8CB8FF" stroke-width="2.5" stroke-dasharray="6 5"/>
      <clipPath id="rm-clip-b"><rect x="56" y="24" width="248" height="182"/></clipPath>
      <g clip-path="url(#rm-clip-b)">
        <circle cx="180" cy="108" r="44" fill="#DA4807"/>
        <rect x="92" y="142" width="176" height="106" fill="#112E6D"/>
      </g>
      <path d="M180 214V244M170 234L180 246L190 234" fill="none" stroke="#FF8547" stroke-width="3"/>
      <text x="180" y="262" text-anchor="middle" fill="#6DE0B8" font-size="12" font-weight="700">激活下画外 · 沉稳落地重量</text>
    `,
  },
  behind: {
    kicker: "ROOM 05 · BEHIND THE VIEWER",
    title: "第五房间：镜头与观者身后",
    desc: "当一个巨型物体从前景斜角猛烈放大并切出左右与底边，像从画面冲向镜头外，观者会意识到自己正站在这个场景的“前面”——打破了第四堵墙。",
    use: "常见用法：广重《龟户梅屋铺》极近前景枝干、第一视角产品开箱封面。",
    svg: `
      <rect width="360" height="270" fill="#072B21"/>
      <rect x="56" y="34" width="248" height="196" fill="#FCF9F3" stroke="#6DE0B8" stroke-width="2.5"/>
      <clipPath id="rm-clip-be"><rect x="56" y="34" width="248" height="196"/></clipPath>
      <g clip-path="url(#rm-clip-be)">
        <circle cx="220" cy="112" r="24" fill="#F290B1"/>
        <rect x="160" y="144" width="110" height="86" fill="#112E6D" opacity="0.35"/>
        <!-- 极大前景逼近镜头 -->
        <polygon points="40,240 162,72 212,240" fill="#085C44"/>
        <circle cx="84" cy="212" r="76" fill="#DA4807"/>
      </g>
      <!-- 向镜头外辐射的透视线 -->
      <path d="M90 198 L24 252 M156 178 L224 252" stroke="#FF8547" stroke-width="2.5" stroke-dasharray="5 4"/>
      <text x="180" y="254" text-anchor="middle" fill="#6DE0B8" font-size="12" font-weight="700">激活第五房间 · 前景冲向观者身侧</text>
    `,
  },
  depth: {
    kicker: "ROOM 06 · BEHIND THE SET",
    title: "第六房间：画面内遮挡物之后",
    desc: "不一定要靠画框边裁切！画内一根前景柱子、半扇门扉或卡片叠层，同样能充当“画内裁刀”，截断后方物体并激起“门后还藏着什么”的纵深好奇。",
    use: "常见用法：建筑拱廊前后遮挡、杂志封面主视觉压住半个大标题。",
    svg: `
      <rect width="360" height="270" fill="#072B21"/>
      <rect x="56" y="34" width="248" height="196" fill="#FCF9F3" stroke="#6DE0B8" stroke-width="2.5"/>
      <!-- 被前景蓝墙遮住一半的橘圆（虚线示意墙后隐藏部分） -->
      <circle cx="176" cy="132" r="56" fill="#DA4807"/>
      <rect x="176" y="34" width="94" height="196" fill="#112E6D"/>
      <circle cx="176" cy="132" r="56" fill="none" stroke="#FF8547" stroke-width="2.4" stroke-dasharray="5 4"/>
      <rect x="196" y="96" width="54" height="72" fill="#FCF9F3" opacity="0.16"/>
      <text x="180" y="254" text-anchor="middle" fill="#6DE0B8" font-size="12" font-weight="700">激活第六房间 · 画内遮挡藏景</text>
    `,
  },
};

function selectRoom(roomId) {
  const r = ROOMS[roomId] || ROOMS.left;
  $("#room-kicker").textContent = r.kicker;
  $("#room-title").textContent = r.title;
  $("#room-desc").textContent = r.desc;
  $("#room-use").textContent = r.use;
  $("#room-svg").innerHTML = r.svg;
  $$(".room-btn").forEach((b) => {
    const on = b.dataset.room === roomId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

$$(".room-btn").forEach((b) => b.addEventListener("click", () => selectRoom(b.dataset.room)));
selectRoom("left");

// =========================================================================
// 6. 04 节：四张年代史料胶片卡（原构图 ⇄ 叠加裁切线翻转）
// =========================================================================

const HIST_DATA = {
  hiroshige: {
    base: `
      <rect width="280" height="180" fill="#FCF9F3"/>
      <!-- 远山与落日红霞 -->
      <rect x="0" y="0" width="280" height="74" fill="#F290B1" opacity="0.45"/>
      <path d="M0 116 Q72 96 144 114 T280 106 V180 H0 Z" fill="#ECF3F0"/>
      <!-- 远景极小人物剪影 -->
      <circle cx="198" cy="128" r="5" fill="#112E6D"/><rect x="195" y="134" width="6" height="14" fill="#112E6D"/>
      <circle cx="216" cy="131" r="4.5" fill="#112E6D"/><rect x="213" y="136" width="6" height="12" fill="#112E6D"/>
      <!-- 极近前景巨型破框梅树主干（上下左右破出） -->
      <path d="M-12 186 L46 86 L24 -12 L72 -12 L88 78 L152 24 L168 42 L94 112 L52 186 Z" fill="#085C44"/>
      <circle cx="118" cy="48" r="7" fill="#DA4807"/>
      <circle cx="144" cy="34" r="6" fill="#DA4807"/>
      <circle cx="88" cy="84" r="8" fill="#DA4807"/>
    `,
    overlay: `
      <rect x="4" y="4" width="272" height="172" fill="none" stroke="#E94300" stroke-width="2.5"/>
      <path d="M24 4H72 M-2 176H52" stroke="#E94300" stroke-width="5"/>
      <line x1="88" y1="84" x2="198" y2="128" stroke="#112E6D" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="266" y="22" text-anchor="end" fill="#B23600" font-size="11" font-weight="700">前景巨树双破顶底</text>
    `,
  },
  degas: {
    base: `
      <rect width="280" height="180" fill="#F3EDE2"/>
      <!-- 舞台斜向地板线 -->
      <polygon points="0,104 280,76 280,180 0,180" fill="#FCF9F3"/>
      <line x1="0" y1="104" x2="280" y2="76" stroke="#CFC6B7" stroke-width="2"/>
      <!-- 舞台中央远距舞者侧影（无五官） -->
      <circle cx="152" cy="84" r="10" fill="#112E6D"/>
      <path d="M144 96 L160 96 L176 124 L128 124 Z" fill="#F290B1"/>
      <line x1="146" y1="124" x2="142" y2="152" stroke="#112E6D" stroke-width="4"/>
      <line x1="158" y1="124" x2="164" y2="152" stroke="#112E6D" stroke-width="4"/>
      <!-- 画面右缘被果断切掉半边的近景舞者与左缘乐器琴颈 -->
      <circle cx="268" cy="68" r="16" fill="#085C44"/>
      <path d="M248 86 L288 86 L296 148 L224 148 Z" fill="#DA4807"/>
      <rect x="-8" y="88" width="28" height="100" fill="#112E6D"/>
    `,
    overlay: `
      <rect x="4" y="4" width="272" height="172" fill="none" stroke="#E94300" stroke-width="2.5"/>
      <path d="M276 50V152 M4 88V176" stroke="#E94300" stroke-width="5"/>
      <circle cx="268" cy="68" r="24" fill="none" stroke="#085C44" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="14" y="22" fill="#B23600" font-size="11" font-weight="700">右缘舞者快门式截断</text>
    `,
  },
  arnheim: {
    base: `
      <rect width="280" height="180" fill="#FCF9F3"/>
      <!-- 阿恩海姆结构骨架虚线 -->
      <line x1="0" y1="0" x2="280" y2="180" stroke="#CFC6B7" stroke-width="1.2" stroke-dasharray="4 4"/>
      <line x1="280" y1="0" x2="0" y2="180" stroke="#CFC6B7" stroke-width="1.2" stroke-dasharray="4 4"/>
      <line x1="140" y1="0" x2="140" y2="180" stroke="#CFC6B7" stroke-width="1.2"/>
      <line x1="0" y1="90" x2="280" y2="90" stroke="#CFC6B7" stroke-width="1.2"/>
      <!-- 靠向左上边破框的朱橘圆，展示边缘引力场 -->
      <circle cx="52" cy="64" r="64" fill="#DA4807"/>
      <rect x="196" y="106" width="52" height="46" fill="#112E6D"/>
    `,
    overlay: `
      <path d="M116 64H152 M142 56L154 64L142 72" fill="none" stroke="#085C44" stroke-width="2.5"/>
      <path d="M52 128V162 M44 152L52 164L60 152" fill="none" stroke="#085C44" stroke-width="2.5"/>
      <rect x="4" y="4" width="272" height="172" fill="none" stroke="#112E6D" stroke-width="2.5"/>
      <text x="266" y="22" text-anchor="end" fill="#0F2A63" font-size="11" font-weight="700">画框边力场推拉</text>
    `,
  },
  burch: {
    base: `
      <rect width="280" height="180" fill="#0B1A3B"/>
      <!-- 模拟移动端界面两张卡片，右卡露头 22% -->
      <rect x="18" y="28" width="168" height="124" fill="#DA4807"/>
      <rect x="34" y="54" width="96" height="12" fill="#FFFDF9"/>
      <rect x="34" y="76" width="120" height="8" fill="#FFFDF9" opacity="0.65"/>
      <rect x="200" y="28" width="168" height="124" fill="#085C44"/>
      <rect x="216" y="54" width="76" height="12" fill="#FFFDF9"/>
    `,
    overlay: `
      <line x1="200" y1="14" x2="200" y2="166" stroke="#FF8547" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M276 14V166" stroke="#6DE0B8" stroke-width="4"/>
      <path d="M214 140H264 M254 132L266 140L254 148" fill="none" stroke="#6DE0B8" stroke-width="2.5"/>
      <text x="192" y="166" text-anchor="end" fill="#FF8547" font-size="11" font-weight="700">右缘裁切 = 暗示横滑</text>
    `,
  },
};

const histState = { hiroshige: false, degas: false, arnheim: false, burch: false };

function renderHist(key) {
  const on = histState[key];
  const d = HIST_DATA[key];
  $(`#hsvg-${key}`).innerHTML = on ? d.base + d.overlay : d.base;
  const btn = $(`[data-hist-btn="${key}"]`);
  btn.setAttribute("aria-pressed", String(on));
  btn.textContent = on ? "收起裁切线" : "叠加裁切线";
}

Object.keys(HIST_DATA).forEach((k) => {
  renderHist(k);
  $(`[data-hist-btn="${k}"]`).addEventListener("click", () => {
    histState[k] = !histState[k];
    renderHist(k);
  });
});

// =========================================================================
// 7. 05 节：真实可横向滑动的迷你 UI 卡片流（Peek Cropping 实战沙盒）
// =========================================================================

const PEEK_COPY = {
  flush: {
    tag: "PEEK 0%",
    msg: "刚好切齐右缘（0% 露出）：用户以为只有当前两张卡片，根本不会伸手去滑。",
  },
  good: {
    tag: "PEEK 22%",
    msg: "果断破框露出下一张约 22%：无需画翻页箭头，人眼一眼读懂“画外还有更多卡片”。",
  },
  skim: {
    tag: "PEEK 4%",
    msg: "仅蹭出一条 4% 细边：看起来像排版溢出的渲染 Bug，让人发紧而不知能否滑动。",
  },
};

const track = $("#carousel-track");
const peekTag = $("#peek-pct-tag");
const cnavStatus = $("#cnav-status");

function setPeekMode(mode) {
  track.dataset.peek = mode;
  track.scrollLeft = 0;
  peekTag.textContent = PEEK_COPY[mode].tag;
  cnavStatus.textContent = PEEK_COPY[mode].msg;
  $$(".peek-btn").forEach((b) => {
    const on = b.dataset.peek === mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

$$(".peek-btn").forEach((b) => b.addEventListener("click", () => setPeekMode(b.dataset.peek)));

$("#cnav-prev").addEventListener("click", () => {
  track.scrollLeft = Math.max(0, track.scrollLeft - track.clientWidth * 0.72);
});
$("#cnav-next").addEventListener("click", () => {
  track.scrollLeft = Math.min(track.scrollWidth, track.scrollLeft + track.clientWidth * 0.72);
});

// =========================================================================
// 8. 06 节深靛蓝暗室：四组「强行裁切 ⇄ 保留完整」翻牌现场
// =========================================================================

const DONT_DATA = {
  dress: {
    badSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <!-- 强行裁掉裙摆，只看到上半截身躯 -->
      <path d="M104 20 L176 20 L198 110 L224 185 L56 185 L82 110 Z" fill="#085C44"/>
      <circle cx="140" cy="4" r="24" fill="#112E6D"/>
      <line x1="12" y1="164" x2="268" y2="164" stroke="#B91C1C" stroke-width="3" stroke-dasharray="6 4"/>
      <text x="140" y="152" text-anchor="middle" fill="#FFFDF9" font-size="12" font-weight="700">裙长与下摆被切出画外？</text>
    `,
    goodSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <circle cx="140" cy="24" r="12" fill="#112E6D"/>
      <path d="M122 40 L158 40 L168 84 L182 142 L98 142 L112 84 Z" fill="#085C44"/>
      <line x1="128" y1="142" x2="128" y2="156" stroke="#112E6D" stroke-width="4"/>
      <line x1="152" y1="142" x2="152" y2="156" stroke="#112E6D" stroke-width="4"/>
      <line x1="204" y1="40" x2="204" y2="142" stroke="#085C44" stroke-width="1.5"/>
      <text x="212" y="96" fill="#085C44" font-size="11" font-weight="700">衣长清晰</text>
    `,
    badTxt: "<strong>翻车：</strong>切掉裙摆长度和裤脚比例后，买家根本无法判断衣服版型与衣长，徒增退货率。",
    goodTxt: "<strong>回归完整：</strong>商品主图需要如实交代轮廓与尺寸比例，四周留足呼吸边界，细节特写另放副图。",
  },
  chart: {
    badSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <rect x="44" y="112" width="42" height="72" fill="#112E6D"/>
      <rect x="116" y="54" width="42" height="130" fill="#DA4807"/>
      <rect x="188" y="-22" width="42" height="206" fill="#085C44"/>
      <line x1="18" y1="165" x2="262" y2="165" stroke="#B91C1C" stroke-width="3" stroke-dasharray="5 4"/>
      <rect x="16" y="12" width="142" height="22" fill="#FFFDF9" stroke="#B91C1C" stroke-width="1.2"/>
      <text x="87" y="27" text-anchor="middle" fill="#B91C1C" font-size="11" font-weight="700">零基线与峰值双截断</text>
    `,
    goodSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <line x1="36" y1="24" x2="36" y2="144" stroke="#0D1014" stroke-width="1.8"/>
      <line x1="36" y1="144" x2="254" y2="144" stroke="#0D1014" stroke-width="1.8"/>
      <rect x="58" y="114" width="38" height="30" fill="#112E6D"/>
      <rect x="124" y="78" width="38" height="66" fill="#DA4807"/>
      <rect x="190" y="38" width="38" height="106" fill="#085C44"/>
      <text x="26" y="148" text-anchor="end" fill="#0D1014" font-size="11" font-weight="700">0</text>
      <text x="209" y="31" text-anchor="middle" fill="#085C44" font-size="11" font-weight="700">100</text>
    `,
    badTxt: "<strong>翻车：</strong>把柱状图底部零基线或最高峰截出画面，数值对比立刻失真，被读成误导性统计或渲染故障。",
    goodTxt: "<strong>回归完整：</strong>数据图表以准确比较为第一原则，坐标轴、零基线与峰值必须完整落于画框安全区内。",
  },
  unknown: {
    badSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <!-- 陌生异形机械件被切掉一大半 -->
      <path d="M-20 34 L96 34 L126 70 L168 56 L182 110 L120 132 L-20 132 Z" fill="#112E6D"/>
      <circle cx="92" cy="84" r="18" fill="#FCF9F3"/>
      <text x="262" y="156" text-anchor="end" fill="#B91C1C" font-size="12" font-weight="700">这是什么零件？补不出来</text>
    `,
    goodSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <!-- 完整展现是一把精密测绘卡尺/扳手 -->
      <path d="M36 74 H196 L218 52 H244 L232 76 L244 100 H218 L196 96 H36 Z" fill="#112E6D"/>
      <circle cx="62" cy="85" r="8" fill="#FCF9F3"/>
      <rect x="116" y="42" width="16" height="86" fill="#DA4807"/>
      <text x="140" y="152" text-anchor="middle" fill="#085C44" font-size="11.5" font-weight="700">完整呈现后，结构一目了然</text>
    `,
    badTxt: "<strong>翻车：</strong>大脑只能补全它“本来就认识的形状”（圆、人、杯子）。面对陌生工业零件，裁切不会引发想象，只会让人一头雾水。",
    goodTxt: "<strong>回归完整：</strong>新产品或非日常机械件首次出场时，必须先完整建立识别图式，才能在后续画面里局部特写。",
  },
  logo: {
    badSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <!-- 被切掉顶角与右角的品牌徽标+二维码 -->
      <rect x="20" y="24" width="110" height="110" fill="none" stroke="#112E6D" stroke-width="6"/>
      <circle cx="75" cy="79" r="34" fill="#DA4807"/>
      <!-- 右侧二维码被右框切掉定位角 -->
      <rect x="206" y="34" width="96" height="96" fill="#0D1014"/>
      <rect x="214" y="42" width="24" height="24" fill="#FCF9F3"/>
      <rect x="219" y="47" width="14" height="14" fill="#0D1014"/>
      <rect x="214" y="98" width="24" height="24" fill="#FCF9F3"/>
      <line x1="276" y1="16" x2="276" y2="154" stroke="#B91C1C" stroke-width="5"/>
      <text x="14" y="156" fill="#B91C1C" font-size="11.5" font-weight="700">二维码定位角被切 → 无法扫码</text>
    `,
    goodSvg: `
      <rect width="280" height="170" fill="#FCF9F3"/>
      <!-- 安全净空虚线框 -->
      <rect x="20" y="24" width="104" height="104" fill="none" stroke="#085C44" stroke-width="1.5" stroke-dasharray="4 3"/>
      <circle cx="72" cy="76" r="28" fill="#DA4807"/>
      <rect x="156" y="28" width="96" height="96" fill="none" stroke="#085C44" stroke-width="1.5" stroke-dasharray="4 3"/>
      <rect x="172" y="44" width="64" height="64" fill="#0D1014"/>
      <rect x="178" y="50" width="16" height="16" fill="#FCF9F3"/><rect x="182" y="54" width="8" height="8" fill="#0D1014"/>
      <rect x="214" y="50" width="16" height="16" fill="#FCF9F3"/><rect x="218" y="54" width="8" height="8" fill="#0D1014"/>
      <rect x="178" y="86" width="16" height="16" fill="#FCF9F3"/><rect x="182" y="90" width="8" height="8" fill="#0D1014"/>
      <text x="140" y="154" text-anchor="middle" fill="#085C44" font-size="11.5" font-weight="700">严守安全净空区，识别与扫码无误</text>
    `,
    badTxt: "<strong>翻车：</strong>品牌规范明确要求标识四周留出净空安全区；裁切徽标、正文行尾或二维码定位角会直接破坏识别与可用性。",
    goodTxt: "<strong>回归完整：</strong>让图片与装饰几何去破框造势，品牌徽标、正文与功能码永远待在清晰的安全净空内。",
  },
};

const dontState = { dress: "bad", chart: "bad", unknown: "bad", logo: "bad" };

function renderDont(key) {
  const mode = dontState[key];
  const d = DONT_DATA[key];
  const card = $(`.dont-card[data-dont="${key}"]`);
  card.dataset.mode = mode;
  $(`#dsvg-${key}`).innerHTML = mode === "bad" ? d.badSvg : d.goodSvg;
  $(`#dtxt-${key}`).innerHTML = mode === "bad" ? d.badTxt : d.goodTxt;
  const btn = $(`[data-dont-btn="${key}"]`);
  btn.textContent = mode === "bad" ? "切到：保留完整" : "切回：强行裁切";
  btn.setAttribute("aria-pressed", String(mode === "good"));
}

Object.keys(DONT_DATA).forEach((k) => {
  renderDont(k);
  $(`[data-dont-btn="${k}"]`).addEventListener("click", () => {
    dontState[k] = dontState[k] === "bad" ? "good" : "bad";
    renderDont(k);
  });
});

// =========================================================================
// 9. 07 节：练一练（同静物四刀中性选项 A / B / C / D）
// =========================================================================

const QUIZ_ANSWERS = {
  A: {
    right: false,
    title: "选了 A：踩中「全包 + 双重擦边（Tangent）」陷阱",
    body: "A 虽然把整只陶瓶和圆盘全装进画面，却既没有果断破框、又让朱橘圆盘顶沿离上框仅剩 2.5% 尴尬细缝、瓶底紧贴底框，整张图局促发紧。正确答案是 C：果断切掉圆盘左上与瓶腹底缘，同时守住瓶口、细颈与双耳识别锚点。",
  },
  B: {
    right: false,
    title: "选了 B：踩中「过度裁切失认」陷阱",
    body: "B 把陶瓶切掉了超过七成，瓶颈、瓶口和双耳等核心特征锚点全丢在画外，只剩一片绿色孤弧和橘色边角，观者无法通过闭合律补回它是一只陶瓶。正确答案是 C。",
  },
  C: {
    right: true,
    title: "答对了！C 是这四刀中裁切构图最成立的一张",
    body: "C 同时满足裁切构图四要素：① 左上与底边果断破框（无擦边）；② 完整守住瓶口、细颈、双耳与大段圆盘弧线，一眼辨认无障碍；③ 视距大幅拉近、体量饱满；④ 朱橘圆盘左上与陶瓶下缘自然向画外延展，空间比画框本身更辽阔。",
  },
  D: {
    right: false,
    title: "选了 D：踩中「结构咽喉误切」陷阱",
    body: "D 的顶框线正好横切在陶瓶最细的瓶颈咽喉与瓶耳转折点上，就像人像里横切颈部或肘关节一样生硬，破坏了器型的连贯美感。正确答案是 C。",
  },
};

const quizGrid = $("#quiz-grid");
const quizVerdict = $("#quiz-verdict");
const qvTitle = $("#qv-title");
const qvBody = $("#qv-body");

$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const ch = card.dataset.choice;
    const info = QUIZ_ANSWERS[ch];
    quizGrid.classList.add("is-revealed");
    $$(".quiz-card").forEach((c) => {
      const k = c.dataset.choice;
      c.setAttribute("aria-pressed", String(k === ch));
      c.classList.toggle("is-selected", k === ch);
      c.classList.toggle("is-right", k === "C");
      c.classList.toggle("is-wrong", k === ch && k !== "C");
    });
    quizVerdict.dataset.state = info.right ? "right" : "wrong";
    qvTitle.textContent = info.title;
    qvBody.textContent = info.body;
  });
});

// =========================================================================
// 10. 08 节：原海报灯箱放大查看（缩放、鼠标拖动、Esc 关闭）
// =========================================================================

const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbZoomLabel = $("#lb-zoom");
const posterOpen = $("#poster-open");
const posterEl = $("#poster");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbPan = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomLabel.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterEl.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterOpen.setAttribute("aria-expanded", "true");
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpen.setAttribute("aria-expanded", "false");
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 1, 3.5);
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 1, 3.5);
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1; lbTx = 0; lbTy = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = clamp(lbScale + delta, 1, 3.5);
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbPan = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lbTx, oy: lbTy };
  lbStage.setPointerCapture(e.pointerId);
  lbStage.classList.add("is-panning");
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbPan || lbPan.id !== e.pointerId) return;
  lbTx = lbPan.ox + (e.clientX - lbPan.sx);
  lbTy = lbPan.oy + (e.clientY - lbPan.sy);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbPan = null;
  lbStage.classList.remove("is-panning");
});
lbStage.addEventListener("pointercancel", () => {
  lbPan = null;
  lbStage.classList.remove("is-panning");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
