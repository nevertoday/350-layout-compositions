import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SHOT_SCALES,
  SCENES,
  PRINCIPLES,
  TAKEAWAYS,
  QUIZ_ROUNDS,
  clamp,
  lerp,
  createInitialState,
  evaluateFrame,
  evaluateBodyCrop,
  evaluateLightingStudio,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 共用：无五官人物剪影绘制器（2D Canvas） ====================
// 严格遵守规则：绝不画眼睛、嘴巴等五官细节，纯以优雅侧影 / 背影轮廓塑形。
function drawFigureSilhouette(ctx, cx, topY, bodyH, facing = "back", fill = "#0B0E0D") {
  const h = bodyH;
  const headR = h * 0.068;
  const headCy = topY + headR;
  const neckTop = topY + headR * 1.88;
  const shoulderY = topY + h * 0.165;
  const waistY = topY + h * 0.43;
  const hipY = topY + h * 0.51;
  const footY = topY + h;

  ctx.save();
  ctx.fillStyle = fill;

  if (facing === "back") {
    // 头部圆润剪影（带极轻微发际后脑起伏，无五官）
    ctx.beginPath();
    ctx.ellipse(cx, headCy, headR * 0.86, headR * 1.02, 0, 0, Math.PI * 2);
    ctx.fill();

    // 颈部 + 利落大衣肩线 + 垂手侧袋站姿（1:1 呼应 301 原海报孤峰剪影）
    const shW = h * 0.112;
    const armW = h * 0.128;
    const waistW = h * 0.082;
    const ankleGap = h * 0.012;
    const legOut = h * 0.072;
    const footW = h * 0.044;

    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.42, neckTop);
    ctx.lineTo(cx + headR * 0.42, neckTop);
    ctx.lineTo(cx + headR * 0.5, shoulderY - h * 0.012);
    ctx.quadraticCurveTo(cx + shW, shoulderY, cx + armW, shoulderY + h * 0.08);
    ctx.lineTo(cx + armW * 0.92, waistY + h * 0.05);
    ctx.lineTo(cx + waistW * 1.05, hipY);
    // 右腿
    ctx.lineTo(cx + legOut * 0.86, footY - h * 0.02);
    ctx.lineTo(cx + legOut * 0.94, footY);
    ctx.lineTo(cx + ankleGap, footY);
    ctx.lineTo(cx + ankleGap * 0.8, hipY + h * 0.045);
    // 裆线过渡至左腿
    ctx.lineTo(cx - ankleGap * 0.8, hipY + h * 0.045);
    ctx.lineTo(cx - ankleGap, footY);
    ctx.lineTo(cx - legOut * 0.94, footY);
    ctx.lineTo(cx - legOut * 0.86, footY - h * 0.02);
    ctx.lineTo(cx - waistW * 1.05, hipY);
    ctx.lineTo(cx - armW * 0.92, waistY + h * 0.05);
    ctx.lineTo(cx - armW, shoulderY + h * 0.08);
    ctx.quadraticCurveTo(cx - shW, shoulderY, cx - headR * 0.5, shoulderY - h * 0.012);
    ctx.closePath();
    ctx.fill();
  } else {
    // 侧影轮廓（朝左或朝右）：自然鼻梁/下颌外剪影，绝不画眼嘴内部细节
    const dir = facing === "right" ? 1 : -1;
    ctx.translate(cx, 0);
    ctx.scale(dir, 1);

    // 侧脸头颅剪影（圆润颅顶 + 轻微鼻额曲线 + 下巴 + 后脑）
    ctx.beginPath();
    ctx.moveTo(-headR * 0.72, headCy + headR * 0.82);
    ctx.bezierCurveTo(-headR * 1.05, headCy + headR * 0.2, -headR * 0.95, topY + headR * 0.05, 0, topY);
    ctx.bezierCurveTo(headR * 0.82, topY, headR * 0.92, topY + headR * 0.45, headR * 0.86, headCy - headR * 0.14);
    ctx.lineTo(headR * 1.06, headCy + headR * 0.14); // 极简鼻尖外轮廓
    ctx.lineTo(headR * 0.85, headCy + headR * 0.28);
    ctx.lineTo(headR * 0.82, headCy + headR * 0.68); // 极简下颌外轮廓
    ctx.quadraticCurveTo(headR * 0.56, headCy + headR * 0.96, headR * 0.32, neckTop + h * 0.015);
    ctx.lineTo(-headR * 0.52, neckTop + h * 0.02);
    ctx.closePath();
    ctx.fill();

    // 侧身风衣/肩胸背腰腿轮廓
    const backX = -h * 0.088;
    const chestX = h * 0.095;
    ctx.beginPath();
    ctx.moveTo(-headR * 0.5, neckTop);
    ctx.lineTo(headR * 0.34, neckTop);
    ctx.quadraticCurveTo(chestX * 0.96, shoulderY + h * 0.01, chestX, shoulderY + h * 0.11);
    ctx.lineTo(chestX * 0.88, waistY);
    ctx.lineTo(chestX * 0.95, hipY + h * 0.02);
    // 前步腿
    ctx.lineTo(h * 0.085, footY - h * 0.02);
    ctx.lineTo(h * 0.11, footY);
    ctx.lineTo(h * 0.02, footY);
    ctx.lineTo(-h * 0.008, hipY + h * 0.06);
    // 后立腿
    ctx.lineTo(-h * 0.025, footY);
    ctx.lineTo(-h * 0.088, footY);
    ctx.lineTo(-h * 0.072, hipY + h * 0.02);
    ctx.lineTo(backX, waistY);
    ctx.quadraticCurveTo(backX * 1.1, shoulderY + h * 0.04, -headR * 0.5, neckTop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 绘制干扰物（航标灯 / 撑伞路人 / 霓虹牌 / 推车 / 落地灯 / 挂画框）
function drawDistractor(ctx, d, W, H, t) {
  if (!d.inFrame) return;
  const cx = d.u * W;
  const cy = d.v * H;
  const dw = d.w * W;
  const dh = d.h * H;
  const x0 = cx - dw * 0.5;
  const y0 = cy - dh * 0.5;

  ctx.save();
  if (d.kind === "beacon") {
    // 左缘暖白航标灯塔 + 刺眼光斑
    const pulse = 0.85 + 0.15 * Math.sin(t * 3.2);
    const g = ctx.createRadialGradient(cx, y0 + dh * 0.16, 2, cx, y0 + dh * 0.16, dw * 1.4);
    g.addColorStop(0, `rgba(255, 226, 178, ${0.88 * pulse})`);
    g.addColorStop(0.45, `rgba(255, 147, 117, ${0.32 * pulse})`);
    g.addColorStop(1, "rgba(255, 147, 117, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, y0 + dh * 0.16, dw * 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#101615";
    ctx.beginPath();
    ctx.moveTo(cx - dw * 0.2, y0 + dh * 0.24);
    ctx.lineTo(cx + dw * 0.2, y0 + dh * 0.24);
    ctx.lineTo(cx + dw * 0.34, y0 + dh);
    ctx.lineTo(cx - dw * 0.34, y0 + dh);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FFF0D6";
    ctx.beginPath();
    ctx.arc(cx, y0 + dh * 0.16, Math.max(5, dw * 0.18), 0, Math.PI * 2);
    ctx.fill();
  } else if (d.kind === "stranger") {
    // 崖边举伞路人剪影（无五官）
    ctx.fillStyle = "#141A19";
    ctx.beginPath();
    ctx.arc(cx, y0 + dh * 0.22, dw * 0.48, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#141A19";
    ctx.lineWidth = Math.max(2, dw * 0.04);
    ctx.beginPath();
    ctx.moveTo(cx, y0 + dh * 0.22);
    ctx.lineTo(cx, y0 + dh * 0.56);
    ctx.stroke();
    drawFigureSilhouette(ctx, cx + dw * 0.06, y0 + dh * 0.28, dh * 0.72, "left", "#141A19");
  } else if (d.kind === "neon") {
    // 刺眼暖橘招牌灯箱
    ctx.fillStyle = "#FF8A6B";
    ctx.fillRect(x0, y0, dw, dh * 0.65);
    ctx.fillStyle = "#0B0E0D";
    ctx.fillRect(x0 + dw * 0.14, y0 + dh * 0.18, dw * 0.72, dh * 0.11);
    ctx.fillRect(x0 + dw * 0.22, y0 + dh * 0.38, dw * 0.56, dh * 0.1);
  } else if (d.kind === "scooter") {
    // 站台推车/杂物剪影
    ctx.fillStyle = "#111716";
    ctx.fillRect(x0 + dw * 0.1, y0 + dh * 0.28, dw * 0.78, dh * 0.44);
    ctx.beginPath();
    ctx.arc(x0 + dw * 0.26, y0 + dh * 0.84, dw * 0.13, 0, Math.PI * 2);
    ctx.arc(x0 + dw * 0.74, y0 + dh * 0.84, dw * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.kind === "lamp") {
    // 抢光落地灯
    const g = ctx.createRadialGradient(cx, y0 + dh * 0.2, 2, cx, y0 + dh * 0.2, dw * 1.15);
    g.addColorStop(0, "rgba(255, 224, 175, 0.85)");
    g.addColorStop(1, "rgba(255, 224, 175, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, y0 + dh * 0.2, dw * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F5E4C6";
    ctx.beginPath();
    ctx.moveTo(cx - dw * 0.34, y0 + dh * 0.26);
    ctx.lineTo(cx + dw * 0.34, y0 + dh * 0.26);
    ctx.lineTo(cx + dw * 0.22, y0 + dh * 0.04);
    ctx.lineTo(cx - dw * 0.22, y0 + dh * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0B0E0D";
    ctx.fillRect(cx - 2, y0 + dh * 0.26, 4, dh * 0.72);
  } else {
    // 墙面杂乱挂画框
    ctx.strokeStyle = "#F5E4C6";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#0A2A29";
    ctx.fillRect(x0, y0, dw * 0.62, dh * 0.68);
    ctx.strokeRect(x0, y0, dw * 0.62, dh * 0.68);
    ctx.fillRect(x0 + dw * 0.42, y0 + dh * 0.26, dw * 0.56, dh * 0.64);
    ctx.strokeRect(x0 + dw * 0.42, y0 + dh * 0.26, dw * 0.56, dh * 0.64);
  }

  // 红虚线清场热区框 + 点击提示标签
  const pad = 6;
  const rx = clamp(x0 - pad, 12, W - 90);
  const ry = clamp(y0 - pad, 12, H - 40);
  const rw = Math.max(54, dw + pad * 2);
  const rh = Math.max(44, dh + pad * 2);

  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "#FF9375";
  ctx.lineWidth = 1.6;
  ctx.strokeRect(rx, ry, rw, rh);
  ctx.setLineDash([]);

  const pillText = "× 点此清场";
  ctx.font = '600 11px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(pillText).width + 14;
  const px = clamp(cx - tw * 0.5, 14, W - tw - 14);
  const py = Math.max(14, ry - 22);
  ctx.fillStyle = "#A62A12";
  ctx.fillRect(px, py, tw, 20);
  ctx.strokeStyle = "#FF9375";
  ctx.lineWidth = 1;
  ctx.strokeRect(px, py, tw, 20);
  ctx.fillStyle = "#FFF5EA";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, px + tw * 0.5, py + 10.5);
  ctx.restore();
}

// ==================== HERO · 电影取景器主舞台 ====================
const vfCanvas = $("#vf-canvas");
const vfCtx = vfCanvas.getContext("2d");

let state = createInitialState("cliff");
// 平滑过渡目标（点景别格或预设时优雅滑移，拖动画布时零延迟直跟）
let animTarget = null;
let vfDirty = true;
let introProgress = reducedMotion.matches ? 1 : 0;
let lastEval = null;
let lastSize = { w: 800, h: 450, dpr: 1 };

function sizeCanvas(canvas, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(180, Math.round(rect.height));
  const isSmall = window.innerWidth <= 640;
  const dpr = pixelRatio(isSmall ? 1.5 : maxDpr);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  return { w, h, dpr };
}

function syncHeroUI(ev) {
  // 顶部状态签
  const stEl = $("#hero-status");
  stEl.textContent = ev.diag.badge;
  stEl.dataset.state = ev.diag.severity === "ok" ? "ok" : "bad";

  // 左侧五项原则实况徽标
  for (const p of PRINCIPLES) {
    const info = ev.principleStatus[p.id];
    const tag = $(`#ptag-${p.id}`);
    if (tag) {
      tag.textContent = info.tag;
      tag.dataset.state = info.state;
    }
    const btn = $(`.prin-item[data-prin="${p.id}"]`);
    if (btn) {
      const sel = state.activePrinciple === p.id;
      btn.classList.toggle("is-selected", sel);
      btn.setAttribute("aria-pressed", String(sel));
    }
  }

  // 底部速记五条勾选
  for (const tk of TAKEAWAYS) {
    const li = $(`#takeaway-list li[data-tk="${tk.id}"]`);
    if (li) li.classList.toggle("is-done", !!ev.takeawayChecks[tk.id]);
  }

  // 诊单舱
  const box = $("#diag-box");
  box.dataset.state = ev.diag.severity === "ok" ? "ok" : "bad";
  $("#diag-badge").textContent = ev.diag.badge;
  $("#diag-headline").textContent = ev.diag.headline;
  $("#diag-body").textContent = ev.diag.body;
  $("#diag-hint").textContent = ev.diag.hint;
  const fixBtn = $("#btn-fix");
  if (ev.diag.fixLabel) {
    fixBtn.hidden = false;
    fixBtn.textContent = ev.diag.fixLabel;
    fixBtn.dataset.action = ev.diag.fixAction;
  } else {
    fixBtn.hidden = true;
  }

  // 五格景别接触印样高亮
  for (const card of $$(".shot-card")) {
    const active = card.dataset.shot === ev.shot.id;
    card.classList.toggle("is-active", active);
    card.setAttribute("aria-pressed", String(active));
  }

  // 场景按钮与辅助线按钮
  for (const b of $$(".scene-btn")) {
    const active = b.dataset.scene === state.sceneId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  }
  const gBtn = $("#btn-guides");
  gBtn.classList.toggle("is-on", state.showGuides);
  gBtn.setAttribute("aria-pressed", String(state.showGuides));
  gBtn.textContent = state.showGuides ? "辅助线：开" : "辅助线：关";

  // 朝向按钮
  for (const b of $$(".mini-btn[data-facing]")) {
    const active = b.dataset.facing === state.facing;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  }

  // 滑块与读数（全部从单真源 ev 取）
  $("#rng-scale").value = String(Math.round(ev.scale * 100));
  $("#val-scale").textContent = `${ev.focal}mm · ${ev.shot.zh}`;
  $("#rng-tilt").value = String(Math.round(ev.tilt * 100));
  $("#val-tilt").textContent = `留顶 ${Math.round(ev.headroom * 100)}%`;
  $("#vf-telemetry").textContent = `${ev.focal}mm · ${ev.shot.en} · 留白 ${Math.round(ev.quietRatio * 100)}% · ${ev.statusLabel}`;
}

function drawHeroFrame(t, dt, { still }) {
  const sz = sizeCanvas(vfCanvas);
  const resized = sz.w !== lastSize.w || sz.h !== lastSize.h || sz.dpr !== lastSize.dpr;
  lastSize = sz;

  // 开场 1.2s 内优雅落位（减少动态效果时直接 1）
  let animating = false;
  if (still) {
    introProgress = 1;
  } else if (introProgress < 1) {
    introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) / 1.1);
    animating = true;
  }

  // 按钮点击后的平滑推拉/摇镜缓动
  if (animTarget) {
    const k = still ? 1 : 1 - Math.exp(-Math.max(dt, 0.016) * 11);
    state.subjU = lerp(state.subjU, animTarget.subjU, k);
    state.scale = lerp(state.scale, animTarget.scale, k);
    state.tilt = lerp(state.tilt, animTarget.tilt, k);
    const done =
      Math.abs(state.subjU - animTarget.subjU) < 0.002 &&
      Math.abs(state.scale - animTarget.scale) < 0.002 &&
      Math.abs(state.tilt - animTarget.tilt) < 0.002;
    if (done || still) {
      state.subjU = animTarget.subjU;
      state.scale = animTarget.scale;
      state.tilt = animTarget.tilt;
      animTarget = null;
    } else {
      animating = true;
    }
    vfDirty = true;
  }

  const aspect = sz.w / sz.h;
  const ev = evaluateFrame(state, aspect);
  const hasPulse = !still && ev.visibleDistractors.length > 0 && introProgress < 1;

  if (!vfDirty && !resized && !animating && !hasPulse) {
    return;
  }
  vfDirty = false;
  lastEval = ev;
  syncHeroUI(ev);

  const W = sz.w;
  const H = sz.h;
  const ctx = vfCtx;
  ctx.save();
  ctx.scale(sz.dpr, sz.dpr);

  // 1. 深松青背景（实采原海报 #024D4B）
  ctx.fillStyle = "#024D4B";
  ctx.fillRect(0, 0, W, H);

  // 2. 场景专属背景亮区（100% 等比正圆 / 建筑拱窗 / 月光落地窗）
  const lx = ev.lightU * W;
  const ly = ev.lightV * H;
  const lr = ev.lightR * Math.min(W, H);
  const easeIntro = 1 - Math.pow(1 - introProgress, 3);

  if (state.sceneId === "cliff") {
    // 301 原海报标志暖月大圆盘
    ctx.save();
    ctx.fillStyle = "#F5E4C6";
    ctx.globalAlpha = 0.25 + 0.75 * easeIntro;
    ctx.beginPath();
    ctx.arc(lx, ly, lr * (0.94 + 0.06 * easeIntro), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (state.sceneId === "station") {
    // 夜站极简暖米拱窗 + 细长月台线
    ctx.save();
    const aw = lr * 1.6;
    const ah = lr * 2.15;
    const ax = lx - aw * 0.5;
    const ay = ly - ah * 0.42;
    ctx.fillStyle = "#F3DEB7";
    ctx.beginPath();
    ctx.moveTo(ax, ay + ah);
    ctx.lineTo(ax, ay + aw * 0.5);
    ctx.arc(lx, ay + aw * 0.5, aw * 0.5, Math.PI, 0);
    ctx.lineTo(ax + aw, ay + ah);
    ctx.closePath();
    ctx.fill();
    // 站台深影柱
    ctx.fillStyle = "#063331";
    ctx.fillRect(0, clamp(ev.footV * H, H * 0.62, H * 0.94), W, H);
    ctx.restore();
  } else {
    // 窗畔极简暖米落地窗（四格细窗棂）
    ctx.save();
    const ww = lr * 1.95;
    const wh = lr * 2.35;
    const wx = lx - ww * 0.5;
    const wy = ly - wh * 0.48;
    ctx.fillStyle = "#F5E4C6";
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = "#024D4B";
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.009);
    ctx.beginPath();
    ctx.moveTo(lx, wy);
    ctx.lineTo(lx, wy + wh);
    ctx.moveTo(wx, ly);
    ctx.lineTo(wx + ww, ly);
    ctx.stroke();
    ctx.restore();
  }

  // 3. 301 原海报标志性前景斜切玄墨悬崖（带视差）
  if (state.sceneId === "cliff" && ev.cliffTopV < 1.03) {
    const cliffY = ev.cliffTopV * H;
    const figX = ev.subjU * W;
    // 崖顶左肩刚好稳稳托住主角脚底，向右下方气势延展（1:1 呼应原海报黑崖）
    const ledgeL = figX - Math.max(46, ev.bodyH * H * 0.36);
    const ledgeR = figX + Math.max(40, ev.bodyH * H * 0.28);
    ctx.save();
    ctx.fillStyle = "#0B0E0D";
    ctx.beginPath();
    ctx.moveTo(ledgeL, cliffY);
    ctx.lineTo(ledgeR, cliffY);
    ctx.lineTo(W + 30, cliffY + Math.max(70, (H - cliffY) * 0.36));
    ctx.lineTo(W + 30, H + 10);
    ctx.lineTo(ledgeL + (H - cliffY) * 0.24, H + 10);
    ctx.closePath();
    ctx.fill();
    // 微弱斜棱受光面，增加层次不呆板
    ctx.fillStyle = "#161B1A";
    ctx.beginPath();
    ctx.moveTo(ledgeR, cliffY);
    ctx.lineTo(W + 30, cliffY + Math.max(70, (H - cliffY) * 0.36));
    ctx.lineTo(W + 30, cliffY + Math.max(88, (H - cliffY) * 0.46));
    ctx.lineTo(ledgeR - 6, cliffY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. 绘制闯入画面的干扰物（未清场且在视锥内时显示）
  for (const d of ev.distractors) {
    drawDistractor(ctx, d, W, H, t);
  }

  // 5. 绘制唯一单人剪影（无五官）
  const sx = ev.subjU * W;
  const sy = ev.headTopV * H;
  const sh = ev.bodyH * H;
  drawFigureSilhouette(ctx, sx, sy, sh, state.facing, "#0B0E0D");

  // 6. 可选参考线：原海报同款白色虚线三分格 + 原则联动诊断叠层
  if (state.showGuides) {
    ctx.save();
    ctx.strokeStyle = "rgba(245, 228, 198, 0.36)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    const x1 = W / 3;
    const x2 = (W * 2) / 3;
    const y1 = H / 3;
    const y2 = (H * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(x1, 14);
    ctx.lineTo(x1, H - 14);
    ctx.moveTo(x2, 14);
    ctx.lineTo(x2, H - 14);
    ctx.moveTo(14, y1);
    ctx.lineTo(W - 14, y1);
    ctx.moveTo(14, y2);
    ctx.lineTo(W - 14, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 7. 实时几何诊断标注（关节硬切 / 视线方向 / 头顶留白 / 点击左侧原则高亮）
  const ap = state.activePrinciple;

  // 7a. 视线空间引导线（当朝左/朝右，或点选了「引导视线」）
  if (state.facing !== "back" || ap === "focus") {
    const dir = state.facing === "left" ? -1 : 1;
    const eyeY = clamp(sy + sh * 0.08, 28, H - 28);
    const startX = sx + dir * Math.max(12, ev.bodyW * W * 0.36);
    const endX = dir > 0 ? W - 24 : 24;
    const blocked = ev.principleStatus.focus.state === "bad";
    if (state.facing !== "back") {
      ctx.save();
      ctx.strokeStyle = blocked ? "#FF9375" : "#78E6C0";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, eyeY);
      ctx.lineTo(endX, eyeY);
      ctx.stroke();
      ctx.setLineDash([]);
      // 箭头
      ctx.fillStyle = blocked ? "#FF9375" : "#78E6C0";
      ctx.beginPath();
      ctx.moveTo(endX, eyeY);
      ctx.lineTo(endX - dir * 8, eyeY - 4.5);
      ctx.lineTo(endX - dir * 8, eyeY + 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 7b. 关节硬切告警标线（直接在底框正切关节处高亮）
  if (ev.cutInfo.bad || ap === "scale") {
    ctx.save();
    ctx.strokeStyle = ev.cutInfo.bad ? "#FF9375" : "#78E6C0";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(20, H - 5);
    ctx.lineTo(W - 20, H - 5);
    ctx.stroke();
    ctx.setLineDash([]);
    if (ev.cutInfo.bad) {
      const msg = `× ${ev.cutInfo.label}`;
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      const mw = ctx.measureText(msg).width + 18;
      const mx = clamp(sx - mw * 0.5, 22, W - mw - 22);
      ctx.fillStyle = "#A62A12";
      ctx.fillRect(mx, H - 30, mw, 22);
      ctx.fillStyle = "#FFF5EA";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, mx + mw * 0.5, H - 18.5);
    }
    ctx.restore();
  }

  // 7c. 点选「保持平衡」或头顶留白真正越界时显示头顶留白标尺；失衡时显示底部重心标
  const isBadHead = ev.headroom < 0.045 || (ev.shot.id !== "ls" && ev.shot.id !== "fs" && ev.headroom > 0.36) || ev.headroom > 0.64;
  if (ap === "balance" || isBadHead) {
    ctx.save();
    ctx.strokeStyle = isBadHead ? "#FF9375" : "#F5E4C6";
    ctx.lineWidth = 1.4;
    const hTop = clamp(sy, 14, H - 40);
    ctx.beginPath();
    ctx.moveTo(sx, 14);
    ctx.lineTo(sx, hTop);
    ctx.moveTo(sx - 8, hTop);
    ctx.lineTo(sx + 8, hTop);
    ctx.stroke();
    ctx.restore();
  }
  if (ap === "balance" || ev.principleStatus.balance.state === "bad") {
    ctx.save();
    const gx = ev.cgU * W;
    ctx.fillStyle = ev.principleStatus.balance.ok ? "#78E6C0" : "#FF9375";
    ctx.beginPath();
    ctx.moveTo(gx, H - 15);
    ctx.lineTo(gx - 6, H - 6);
    ctx.lineTo(gx + 6, H - 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 7d. 点选「善用留白」时显示静空百分比胶囊
  if (ap === "space") {
    ctx.save();
    const label = `安静留白 ${Math.round(ev.quietRatio * 100)}% · 主体占 ${Math.round(ev.subjectArea * 100)}%`;
    ctx.font = '600 12px "DM Mono", "Noto Sans SC", monospace';
    const tw = ctx.measureText(label).width + 20;
    ctx.fillStyle = "rgba(6, 50, 48, 0.92)";
    ctx.fillRect(24, 24, tw, 26);
    ctx.strokeStyle = "#F5E4C6";
    ctx.strokeRect(24, 24, tw, 26);
    ctx.fillStyle = "#F5E4C6";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 34, 37.5);
    ctx.restore();
  }

  // 8. 301 原海报标志性四角米白取景折角 ┌ ┐ └ ┘（随开场进度缓缓落定）
  const inset = lerp(34, 14, easeIntro);
  const arm = Math.min(34, Math.min(W, H) * 0.085);
  ctx.save();
  ctx.strokeStyle = "#F5E4C6";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  // 左上
  ctx.moveTo(inset, inset + arm);
  ctx.lineTo(inset, inset);
  ctx.lineTo(inset + arm, inset);
  // 右上
  ctx.moveTo(W - inset - arm, inset);
  ctx.lineTo(W - inset, inset);
  ctx.lineTo(W - inset, inset + arm);
  // 左下
  ctx.moveTo(inset, H - inset - arm);
  ctx.lineTo(inset, H - inset);
  ctx.lineTo(inset + arm, H - inset);
  // 右下
  ctx.moveTo(W - inset - arm, H - inset);
  ctx.lineTo(W - inset, H - inset);
  ctx.lineTo(W - inset, H - inset - arm);
  ctx.stroke();

  // 取景器内顶部微标（加松青实底防线穿字，克制单行）
  ctx.font = '500 11.5px "DM Mono", "Noto Sans SC", monospace';
  const tlText = `${ev.focal}mm · ${ev.shot.zh}`;
  const tlW = ctx.measureText(tlText).width + 10;
  ctx.fillStyle = "rgba(2, 77, 75, 0.88)";
  ctx.fillRect(inset + 8, inset + 6, tlW, 18);
  ctx.fillStyle = "#F5E4C6";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(tlText, inset + 13, inset + 9);
  ctx.textAlign = "right";
  ctx.fillStyle = ev.passCount === 5 ? "#78E6C0" : "#FF9375";
  ctx.fillText(`${ev.passCount}/5`, W - inset - 12, inset + 9);
  ctx.restore();

  ctx.restore();
}

const heroLoop = loop(vfCanvas, drawHeroFrame);
const invalidateHero = () => {
  vfDirty = true;
  heroLoop.draw();
};

// ---------- Hero 画布交互：横拖摇镜 / 点击清场 / 触屏兼容 / 键盘操作 ----------
let dragInfo = null;

function canvasCoords(e) {
  const r = vfCanvas.getBoundingClientRect();
  const pt = e.touches ? e.touches[0] : e;
  return {
    u: clamp((pt.clientX - r.left) / r.width, 0, 1),
    v: clamp((pt.clientY - r.top) / r.height, 0, 1),
    x: pt.clientX - r.left,
    y: pt.clientY - r.top,
    w: r.width,
    h: r.height,
  };
}

function hitDistractor(u, v) {
  if (!lastEval) return null;
  for (const d of lastEval.visibleDistractors) {
    const padU = 0.04;
    const padV = 0.06;
    if (u >= d.x0 - padU && u <= d.x1 + padU && v >= d.y0 - padV && v <= d.y1 + padV) {
      return d;
    }
  }
  return null;
}

vfCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const p = canvasCoords(e);
  animTarget = null;
  dragInfo = {
    id: e.pointerId,
    startX: p.x,
    startY: p.y,
    startU: state.subjU,
    moved: false,
    w: p.w,
  };
  try { vfCanvas.setPointerCapture(e.pointerId); } catch {}
});

vfCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || dragInfo.id !== e.pointerId) return;
  const p = canvasCoords(e);
  const dx = p.x - dragInfo.startX;
  const dy = p.y - dragInfo.startY;
  if (!dragInfo.moved && Math.hypot(dx, dy) > 4) dragInfo.moved = true;
  if (dragInfo.moved) {
    state.subjU = clamp(dragInfo.startU + dx / Math.max(180, dragInfo.w * 0.85), 0.06, 0.94);
    invalidateHero();
  }
});

function endDrag(e) {
  if (!dragInfo || dragInfo.id !== e.pointerId) return;
  const p = canvasCoords(e);
  const wasClick = !dragInfo.moved;
  dragInfo = null;
  if (wasClick) {
    const hit = hitDistractor(p.u, p.v);
    if (hit) {
      state.cleared[hit.id] = true;
      invalidateHero();
    } else {
      animTarget = { subjU: clamp(p.u, 0.08, 0.92), scale: state.scale, tilt: state.tilt };
      invalidateHero();
    }
  }
}
vfCanvas.addEventListener("pointerup", endDrag);
vfCanvas.addEventListener("pointercancel", () => { dragInfo = null; });

// 兼容 perf.mjs 直接派发的原生 touch 事件（确保慢手机拖动测帧真实响应每一帧）
let touchDrag = null;
vfCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length) return;
    const p = canvasCoords(e);
    animTarget = null;
    touchDrag = { startX: p.x, startY: p.y, startU: state.subjU, w: p.w, lockH: false };
  },
  { passive: true }
);
vfCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!touchDrag || !e.touches.length) return;
    const p = canvasCoords(e);
    const dx = p.x - touchDrag.startX;
    const dy = p.y - touchDrag.startY;
    if (!touchDrag.lockH && Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 3) {
      touchDrag.lockH = true;
    }
    if (touchDrag.lockH) {
      state.subjU = clamp(touchDrag.startU + dx / Math.max(160, touchDrag.w * 0.85), 0.06, 0.94);
      invalidateHero();
    }
  },
  { passive: true }
);
vfCanvas.addEventListener("touchend", () => { touchDrag = null; }, { passive: true });

vfCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.08 : 0.04;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    animTarget = null;
    state.subjU = clamp(state.subjU - step, 0.06, 0.94);
    invalidateHero();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    animTarget = null;
    state.subjU = clamp(state.subjU + step, 0.06, 0.94);
    invalidateHero();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    animTarget = null;
    state.tilt = clamp(state.tilt - 0.03, -0.24, 0.24);
    invalidateHero();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    animTarget = null;
    state.tilt = clamp(state.tilt + 0.03, -0.24, 0.24);
    invalidateHero();
  } else if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    animTarget = null;
    state.scale = clamp(state.scale + 0.06, 0, 1);
    invalidateHero();
  } else if (e.key === "-") {
    e.preventDefault();
    animTarget = null;
    state.scale = clamp(state.scale - 0.06, 0, 1);
    invalidateHero();
  } else if (/^[1-5]$/.test(e.key)) {
    e.preventDefault();
    const s = SHOT_SCALES[Number(e.key) - 1];
    animTarget = { subjU: state.subjU, scale: s.scale, tilt: 0 };
    invalidateHero();
  } else if (e.key === " ") {
    e.preventDefault();
    for (const k of Object.keys(state.cleared)) state.cleared[k] = true;
    invalidateHero();
  }
});

// ---------- Hero 控件事件绑定 ----------
for (const btn of $$(".scene-btn")) {
  btn.addEventListener("click", () => {
    animTarget = null;
    state = createInitialState(btn.dataset.scene);
    invalidateHero();
  });
}

$("#btn-guides").addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  invalidateHero();
});

for (const btn of $$(".prin-item")) {
  btn.addEventListener("click", () => {
    const id = btn.dataset.prin;
    state.activePrinciple = state.activePrinciple === id ? null : id;
    invalidateHero();
  });
}

$("#rng-scale").addEventListener("input", (e) => {
  animTarget = null;
  state.scale = clamp(Number(e.target.value) / 100, 0, 1);
  invalidateHero();
});

$("#rng-tilt").addEventListener("input", (e) => {
  animTarget = null;
  state.tilt = clamp(Number(e.target.value) / 100, -0.24, 0.24);
  invalidateHero();
});

for (const btn of $$(".mini-btn[data-facing]")) {
  btn.addEventListener("click", () => {
    state.facing = btn.dataset.facing;
    invalidateHero();
  });
}

for (const card of $$(".shot-card")) {
  card.addEventListener("click", () => {
    const s = SHOT_SCALES.find((x) => x.id === card.dataset.shot);
    if (!s) return;
    animTarget = { subjU: state.subjU, scale: s.scale, tilt: 0 };
    invalidateHero();
  });
}

$("#btn-fix").addEventListener("click", () => {
  const act = $("#btn-fix").dataset.action;
  const sc = SCENES[state.sceneId];
  if (act === "clearDistractors") {
    for (const k of Object.keys(state.cleared)) state.cleared[k] = true;
  } else if (act === "recenterSubject" || act === "alignLight") {
    animTarget = { subjU: sc.posterSolve.subjU, scale: state.scale, tilt: state.tilt };
  } else if (act === "fixLookRoom") {
    const targetU = state.facing === "right" ? 0.35 : state.facing === "left" ? 0.65 : sc.posterSolve.subjU;
    animTarget = { subjU: targetU, scale: state.scale, tilt: state.tilt };
  } else if (act === "fixScale") {
    animTarget = { subjU: state.subjU, scale: sc.posterSolve.scale, tilt: 0 };
  } else if (act === "fixTilt") {
    animTarget = { subjU: state.subjU, scale: state.scale, tilt: 0 };
  }
  invalidateHero();
});

const clearAllDistractors = () => {
  const out = {};
  for (const d of SCENES[state.sceneId].distractors) out[d.id] = true;
  return out;
};

for (const btn of $$(".preset-btn")) {
  btn.addEventListener("click", () => {
    const p = btn.dataset.preset;
    const sc = SCENES[state.sceneId];
    if (p === "poster") {
      state.facing = sc.posterSolve.facing;
      state.cleared = clearAllDistractors();
      animTarget = { subjU: sc.posterSolve.subjU, scale: sc.posterSolve.scale, tilt: sc.posterSolve.tilt };
    } else if (p === "wide") {
      state.sceneId = "cliff";
      state.facing = "back";
      state.cleared = { beacon: true, stranger: true };
      animTarget = { subjU: 0.62, scale: 0.05, tilt: -0.02 };
    } else if (p === "leftRoom") {
      state.sceneId = "station";
      state.facing = "right";
      state.cleared = { neon: true, scooter: true };
      animTarget = { subjU: 0.34, scale: 0.50, tilt: -0.01 };
    } else if (p === "errJoint") {
      state.cleared = clearAllDistractors();
      animTarget = { subjU: sc.posterSolve.subjU, scale: 0.58, tilt: 0.23 };
    } else if (p === "errWall") {
      state.cleared = clearAllDistractors();
      state.facing = "right";
      animTarget = { subjU: 0.78, scale: sc.posterSolve.scale, tilt: 0 };
    } else if (p === "errCrowd") {
      for (const d of sc.distractors) state.cleared[d.id] = false;
      animTarget = { subjU: sc.posterSolve.subjU, scale: 0.26, tilt: 0 };
    } else if (p === "reset") {
      animTarget = null;
      state = createInitialState(state.sceneId);
    }
    invalidateHero();
  });
}

window.addEventListener("resize", () => {
  invalidateHero();
  renderCropLab();
});

// ==================== 01 · 五项原则结构拆解卡 ====================
const BLUEPRINTS = {
  emphasize: {
    quote: "原海报：「只保留一个核心主体，避免视觉干扰。」",
    title: "清掉第二亮斑，画面才会立刻安静下来",
    desc: "人眼天生追逐高反差与人形轮廓。只要画框角落多出一盏亮灯、一块刺眼招牌或半个路人剪影，大脑就不得不把注意力拆成两份。所谓突出主体，往往不是把主角打得多亮，而是先替他把周围多余的东西挪走，或干脆推近焦段把杂物裁在画外。",
    metric: "片场速查：眯眼看画面，能不能只剩一处最先跳出来？",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#024D4B"/>
      <circle cx="184" cy="96" r="58" fill="#F5E4C6"/>
      <path d="M164 156H216L320 184V210H182Z" fill="#0B0E0D"/>
      <circle cx="188" cy="100" r="6.8" fill="#0B0E0D"/>
      <path d="M180 116c1-6 4-8 8-8s7 2 8 8l-2 22l-2 18h-3.2l-1-16l-1 16h-3.2l-2-18z" fill="#0B0E0D"/>
      <rect x="34" y="54" width="38" height="38" stroke="#FF9375" stroke-width="1.6" stroke-dasharray="4 3"/>
      <path d="M40 60L66 86M66 60L40 86" stroke="#FF9375" stroke-width="1.8"/>
      <path d="M16 36V16H36M304 36V16H284M16 174V194H36M304 174V194H284" stroke="#F5E4C6" stroke-width="2"/>
    </svg>`,
  },
  focus: {
    quote: "原海报：「利用位置、方向与留白，自然引导观者视线。」",
    title: "给目光和斜线留出出口，视线才会自己滑向主角",
    desc: "单人画面里的道路、崖脊、栏杆和人物朝向都是隐形箭头。人物偏居一侧、面向开阔的那大半片空白，观众会顺着他的目光把整个画面巡游一遍；如果脸朝边缘贴着边框站，视线刚起步就撞墙折断。",
    metric: "片场速查：人物朝向的一侧，前方是否留出至少四成画宽？",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#024D4B"/>
      <line x1="107" y1="16" x2="107" y2="194" stroke="#F5E4C6" stroke-opacity="0.3" stroke-dasharray="3 4"/>
      <line x1="213" y1="16" x2="213" y2="194" stroke="#F5E4C6" stroke-opacity="0.3" stroke-dasharray="3 4"/>
      <circle cx="107" cy="96" r="46" fill="#F5E4C6"/>
      <rect x="16" y="158" width="288" height="36" fill="#0B0E0D"/>
      <path d="M104 94c-3-4-2-10 3-12c5-2 10 1 10 6l2.5 3l-2.5 2l-1 4c-2 2-6 2-8 1z" fill="#0B0E0D"/>
      <path d="M98 112c1-7 5-10 10-10s9 3 10 10l-1 22l4 24h-6l-4-18l-3 18h-6l-1-24z" fill="#0B0E0D"/>
      <path d="M128 88H284" stroke="#78E6C0" stroke-width="2.2" stroke-dasharray="6 4"/>
      <path d="M276 82L288 88L276 94Z" fill="#78E6C0"/>
      <path d="M16 36V16H36M304 36V16H284M16 174V194H36M304 174V194H284" stroke="#F5E4C6" stroke-width="2"/>
    </svg>`,
  },
  balance: {
    quote: "原海报：「通过构图与重心平衡，让画面稳定而舒适。」",
    title: "不对称也能稳：用大块留白和景物去托住人物重量",
    desc: "平衡不等于把人死钉在正中间。就像 301 原海报那样，人物站在偏右位置，脚下暗崖压实右下角，左侧大片清静深松青与圆月则托起另一边重量；再加上恰当的头顶留白，整张画面既有方向张力又不偏坠。",
    metric: "片场速查：盖住人物一秒，画面是不是向某一角倾斜塌陷？",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#024D4B"/>
      <circle cx="204" cy="86" r="48" fill="#F5E4C6"/>
      <path d="M180 144H244L320 170V210H202Z" fill="#0B0E0D"/>
      <circle cx="212" cy="96" r="7.5" fill="#0B0E0D"/>
      <path d="M206 111c1-4 3-6 6-6s5 2 6 6l-2 33h-8z" fill="#0B0E0D"/>
      <line x1="48" y1="168" x2="272" y2="168" stroke="#78E6C0" stroke-width="2"/>
      <path d="M160 168L150 184H170Z" fill="#78E6C0"/>
      <rect x="52" y="70" width="84" height="72" stroke="#F5E4C6" stroke-opacity="0.55" stroke-dasharray="4 4"/>
    </svg>`,
  },
  space: {
    quote: "原海报：「留白不是空，而是为主体提供呼吸空间。」",
    title: "留白越大，唯一主体的情绪回响越长",
    desc: "心理学上把大面积低细节区域视为「负空间」。它不是没拍满的废料，而是隔离杂音的静音舱——留白托住人物轮廓时，观者会自动用想象力填补人物身处的孤独、宁静或期待。",
    metric: "片场速查：远/全/中景留白宜 ≥ 50%；特写则保背景纯净零干扰。",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#024D4B"/>
      <rect x="26" y="24" width="268" height="162" stroke="#F5E4C6" stroke-dasharray="5 5" stroke-width="1.4"/>
      <circle cx="210" cy="118" r="26" fill="#F5E4C6"/>
      <circle cx="210" cy="114" r="4.5" fill="#0B0E0D"/>
      <path d="M206 123c0-3 2-4 4-4s4 1 4 4l-1 22h-6z" fill="#0B0E0D"/>
      <path d="M26 146H294" stroke="#F5E4C6" stroke-opacity="0.45"/>
    </svg>`,
  },
  scale: {
    quote: "原海报：「根据表达需求，选择恰当的拍摄距离。」",
    title: "远景讲处境，中景讲动作，近景特写讲心事",
    desc: "景别其实就是观众和主角之间的心理距离。把人拉成远景里的一个小点，讲的是人与天地的关系；推进到胸口以上的近景与特写，环境退出，人物的每一次停顿和轮廓起伏都会直击观众。",
    metric: "片场速查：先问这一镜想让人看「在哪里」，还是看「怎么想」。",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#024D4B"/>
      <rect x="24" y="24" width="272" height="162" stroke="#F5E4C6" stroke-opacity="0.35"/>
      <rect x="64" y="42" width="192" height="126" stroke="#F5E4C6" stroke-opacity="0.6"/>
      <rect x="108" y="60" width="104" height="90" stroke="#78E6C0" stroke-width="2"/>
      <circle cx="160" cy="96" r="16" fill="#F5E4C6"/>
      <path d="M136 148c3-18 11-26 24-26s21 8 24 26Z" fill="#F5E4C6"/>
    </svg>`,
  },
};

function renderBlueprint(key) {
  const b = BLUEPRINTS[key] || BLUEPRINTS.emphasize;
  $("#bp-art").innerHTML = b.svg;
  $("#bp-quote").textContent = b.quote;
  $("#bp-title").textContent = b.title;
  $("#bp-desc").textContent = b.desc;
  $("#bp-metric").textContent = b.metric;
  for (const t of $$(".bp-tab")) {
    const active = t.dataset.bp === key;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  }
}
for (const tab of $$(".bp-tab")) {
  tab.addEventListener("click", () => renderBlueprint(tab.dataset.bp));
}
renderBlueprint("emphasize");

// ==================== 02 · 历史演进年代步进器 ====================
const ERAS = [
  {
    meta: "1808–1810 & 约 1817 · 柏林旧国家画廊 / 汉堡美术馆",
    title: "弗里德里希把整幅画交给了「一个孤立背影」",
    body: "德国浪漫主义画家卡斯帕·大卫·弗里德里希在《海边僧侣》（1808–1810）里把海天清空到极致，只留岸边一抹微小身影；约 1817 年创作的《雾海上的旅人》则让黑衣独行者立于暗崖之上、背向观众凝望茫茫雾海。这种「背影人物（Rückenfigur）」把画外观众直接代进主角视线里，正是 301 原海报最直接的视觉祖先。",
    src: "核实来源：柏林国家博物馆在线藏品库（《海边僧侣》）；汉堡美术馆在线藏品库（《雾海上的旅人》）。",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#033D3B"/>
      <rect x="0" y="0" width="320" height="156" fill="#F3DEB7" fill-opacity="0.88"/>
      <rect x="0" y="156" width="320" height="22" fill="#05534E"/>
      <path d="M0 178Q120 166 210 176L320 184V210H0Z" fill="#0B0E0D"/>
      <circle cx="110" cy="154" r="3.4" fill="#0B0E0D"/>
      <path d="M107 159h6l1 15h-8z" fill="#0B0E0D"/>
      <text x="16" y="26" fill="#0B0E0D" font-size="11" font-family="DM Mono, monospace">SKY &amp; SEA &gt; 80%</text>
    </svg>`,
  },
  {
    meta: "1915 · 哥本哈根大学博士论文《Synsoplevede Figurer》",
    title: "埃德加·鲁宾提出「图底分离」，解释单主体为何抓眼",
    body: "丹麦心理学家埃德加·鲁宾在 1915 年的经典论文《视觉经验中的图形》中系统区分了「图形（Figure）」与「背景（Ground）」。大脑看画面时会先剥离出一个轮廓闭合、反差清晰的对象，其余退作背景。单人构图之所以能一秒锁焦，根本上是在帮视觉系统把「图」和「底」分得毫不模棱两可。",
    src: "核实来源：Edgar Rubin, Synsoplevede Figurer (1915)，格式塔心理学图底知觉奠基文献。",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#033D3B"/>
      <rect x="34" y="24" width="252" height="162" fill="#F5E4C6"/>
      <path d="M34 24H116C136 52 104 82 126 105C104 128 136 158 116 186H34Z" fill="#0B0E0D"/>
      <path d="M286 24H204C184 52 216 82 194 105C216 128 184 158 204 186H286Z" fill="#0B0E0D"/>
      <text x="160" y="109" text-anchor="middle" fill="#024D4B" font-size="12" font-family="DM Mono, monospace">FIGURE / GROUND</text>
    </svg>`,
  },
  {
    meta: "1954 首版 / 1974 修订扩充版 · 加州大学出版社",
    title: "鲁道夫·阿恩海姆证明：画框里的留白是个活的力场",
    body: "艺术心理学家鲁道夫·阿恩海姆在《艺术与视知觉》开篇《平衡》一章中指出，画框绝不是一块被动装东西的白纸——中心、对角线与四条边框共同构成隐形骨架。单个主体放进画框后，它的大小、明暗与离边距离会产生真实的心理重量与推拉力，留白正是参与配重的另一半力量。",
    src: "核实来源：Rudolf Arnheim, Art and Visual Perception (University of California Press, 1954 / 1974)。",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#033D3B"/>
      <rect x="44" y="22" width="232" height="166" stroke="#F5E4C6" stroke-width="1.5"/>
      <line x1="44" y1="22" x2="276" y2="188" stroke="#F5E4C6" stroke-opacity="0.35" stroke-dasharray="4 4"/>
      <line x1="276" y1="22" x2="44" y2="188" stroke="#F5E4C6" stroke-opacity="0.35" stroke-dasharray="4 4"/>
      <line x1="160" y1="22" x2="160" y2="188" stroke="#F5E4C6" stroke-opacity="0.35"/>
      <line x1="44" y1="105" x2="276" y2="105" stroke="#F5E4C6" stroke-opacity="0.35"/>
      <circle cx="196" cy="94" r="16" fill="#F5E4C6"/>
      <path d="M196 94L160 105" stroke="#78E6C0" stroke-width="2"/>
      <circle cx="160" cy="105" r="4" fill="#78E6C0"/>
    </svg>`,
  },
  {
    meta: "1965 · Cine/Grafic Publications（后 Silman-James Press 再版）",
    title: "约瑟夫·马塞利把单人取景规则写进《电影摄影的五个 C》",
    body: "资深电影摄影师约瑟夫·马塞利在 1965 年出版的片场圣经《电影摄影的五个 C》（机位角度、连贯性、剪辑、特写、构图）里，把单人镜头的实操规矩系统化：远景交待环境、特写独占情绪；头顶要留恰当 headroom，人物面向或行进前方要给足 lead / looking room，成为几代摄影指导的案头基准。",
    src: "核实来源：Joseph V. Mascelli, The Five C's of Cinematography (1965), Open Library / Silman-James Press。",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#033D3B"/>
      <rect x="28" y="26" width="264" height="158" stroke="#F5E4C6" stroke-width="2"/>
      <line x1="28" y1="54" x2="292" y2="54" stroke="#78E6C0" stroke-dasharray="4 3"/>
      <circle cx="116" cy="84" r="22" fill="#F5E4C6"/>
      <path d="M84 184c4-40 16-58 32-58s28 18 32 58Z" fill="#F5E4C6"/>
      <path d="M144 82H274" stroke="#78E6C0" stroke-width="2"/>
      <text x="150" y="72" fill="#78E6C0" font-size="11" font-family="DM Mono, monospace">LOOK ROOM</text>
      <text x="36" y="46" fill="#F5E4C6" font-size="10.5" font-family="DM Mono, monospace">HEADROOM</text>
    </svg>`,
  },
  {
    meta: "1998 首版（Focal Press）— 2023 第 5 版（Routledge）",
    title: "汤普森与鲍文《镜头语法》把景别与关节避切标准化",
    body: "罗伊·汤普森 1998 年首版、克里斯托弗·鲍文持续修订至 2023 年第 5 版的《镜头语法》（Grammar of the Shot），把单人镜头的景别序列（ELS/LS/FS/MS/CU/ECU）与避开脚踝、膝盖、颈部关节裁切的经验整理为清晰图谱，让今天的新手摄影师也能迅速拍出稳当的单人镜。",
    src: "核实来源：Roy Thompson & Christopher J. Bowen, Grammar of the Shot (Focal Press / Routledge)。",
    svg: `<svg viewBox="0 0 320 210" fill="none">
      <rect width="320" height="210" fill="#033D3B"/>
      <circle cx="160" cy="40" r="14" fill="#F5E4C6"/>
      <path d="M138 72c2-12 10-16 22-16s20 4 22 16l-5 112h-11l-6-48l-6 48h-11z" fill="#F5E4C6"/>
      <line x1="66" y1="84" x2="254" y2="84" stroke="#78E6C0" stroke-width="1.8"/>
      <line x1="66" y1="118" x2="254" y2="118" stroke="#78E6C0" stroke-width="1.8"/>
      <line x1="66" y1="146" x2="254" y2="146" stroke="#FF9375" stroke-width="2" stroke-dasharray="4 3"/>
      <line x1="66" y1="176" x2="254" y2="176" stroke="#FF9375" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="70" y="80" fill="#78E6C0" font-size="10" font-family="DM Mono, monospace">CU SAFE</text>
      <text x="70" y="142" fill="#FF9375" font-size="10" font-family="DM Mono, monospace">NO KNEE CUT</text>
    </svg>`,
  },
];

function renderEra(idx) {
  const e = ERAS[idx] || ERAS[0];
  $("#era-svg").innerHTML = e.svg;
  $("#era-meta").textContent = e.meta;
  $("#era-title").textContent = e.title;
  $("#era-body").textContent = e.body;
  $("#era-src").textContent = e.src;
  for (const b of $$(".era-btn")) {
    const active = Number(b.dataset.era) === idx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  }
}
for (const b of $$(".era-btn")) {
  b.addEventListener("click", () => renderEra(Number(b.dataset.era)));
}
renderEra(0);

// ==================== 03 · 人体关节裁切标尺台（独立双画布） ====================
const cropCanvas = $("#crop-canvas");
const cropCtx = cropCanvas.getContext("2d");
const prevCanvas = $("#crop-preview");
const prevCtx = prevCanvas.getContext("2d");

let cropCut = 0.73; // 开场刻意停在「正切膝关节」禁切带，一眼看懂为何别扭

function renderCropLab() {
  const ev = evaluateBodyCrop(cropCut);
  // 1. 左侧全身解剖标尺画布
  const s1 = sizeCanvas(cropCanvas, 2);
  const W1 = s1.w, H1 = s1.h;
  cropCtx.save();
  cropCtx.scale(s1.dpr, s1.dpr);
  cropCtx.fillStyle = "#063230";
  cropCtx.fillRect(0, 0, W1, H1);

  const figTop = H1 * 0.08;
  const figH = H1 * 0.80;
  const figCx = W1 * 0.42;

  // 绘制红/绿解剖禁切带与安全线
  const bands = [
    { a: 0.165, b: 0.195, label: "颈部禁切", bad: true },
    { a: 0.67, b: 0.785, label: "膝关节禁切", bad: true },
    { a: 0.88, b: 0.975, label: "脚踝禁切", bad: true },
  ];
  for (const bd of bands) {
    const y0 = figTop + figH * bd.a;
    const bh = figH * (bd.b - bd.a);
    cropCtx.fillStyle = "rgba(255, 147, 117, 0.22)";
    cropCtx.fillRect(14, y0, W1 - 28, bh);
    cropCtx.font = '500 11px "Noto Sans SC", sans-serif';
    cropCtx.fillStyle = "#FF9375";
    cropCtx.textAlign = "right";
    cropCtx.textBaseline = "middle";
    cropCtx.fillText(bd.label, W1 - 20, y0 + bh * 0.5);
  }

  const safes = [
    { f: 0.30, label: "近景·胸口" },
    { f: 0.54, label: "中景·大腿" },
    { f: 1.03, label: "全景·留地" },
  ];
  for (const sf of safes) {
    const y = figTop + figH * sf.f;
    cropCtx.strokeStyle = "rgba(120, 230, 192, 0.5)";
    cropCtx.setLineDash([4, 4]);
    cropCtx.beginPath();
    cropCtx.moveTo(14, y);
    cropCtx.lineTo(W1 - 14, y);
    cropCtx.stroke();
    cropCtx.setLineDash([]);
    cropCtx.font = '500 11px "Noto Sans SC", sans-serif';
    cropCtx.fillStyle = "#78E6C0";
    cropCtx.textAlign = "right";
    cropCtx.textBaseline = "bottom";
    cropCtx.fillText(sf.label, W1 - 20, y - 3);
  }

  // 绘制全身剪影（暖米色高亮框内部分、半暗框外部分）
  drawFigureSilhouette(cropCtx, figCx, figTop, figH, "back", "rgba(245, 228, 198, 0.28)");
  const cutY = clamp(figTop + figH * cropCut, figTop + figH * 0.12, H1 - 12);
  cropCtx.save();
  cropCtx.beginPath();
  cropCtx.rect(0, 0, W1, cutY);
  cropCtx.clip();
  drawFigureSilhouette(cropCtx, figCx, figTop, figH, "back", "#F5E4C6");
  cropCtx.restore();

  // 可拖动底框切线标尺
  cropCtx.strokeStyle = ev.safe ? "#78E6C0" : "#FF9375";
  cropCtx.lineWidth = 2.6;
  cropCtx.beginPath();
  cropCtx.moveTo(12, cutY);
  cropCtx.lineTo(W1 - 12, cutY);
  cropCtx.stroke();

  // 左侧拖动圆钮
  cropCtx.fillStyle = ev.safe ? "#78E6C0" : "#FF9375";
  cropCtx.beginPath();
  cropCtx.arc(24, cutY, 8, 0, Math.PI * 2);
  cropCtx.fill();
  cropCtx.fillStyle = "#0B0E0D";
  cropCtx.font = '700 11px "DM Mono", monospace';
  cropCtx.textAlign = "center";
  cropCtx.textBaseline = "middle";
  cropCtx.fillText("↕", 24, cutY + 0.5);
  cropCtx.restore();

  // 2. 右侧实时银幕成片监视器
  const s2 = sizeCanvas(prevCanvas, 2);
  const W2 = s2.w, H2 = s2.h;
  prevCtx.save();
  prevCtx.scale(s2.dpr, s2.dpr);
  prevCtx.fillStyle = "#024D4B";
  prevCtx.fillRect(0, 0, W2, H2);

  // 背景暖月随景别同步放大
  const zoom = clamp(1.04 / cropCut, 0.9, 5.2);
  const moonR = Math.min(W2, H2) * clamp(0.28 * Math.pow(zoom, 0.35), 0.26, 0.52);
  prevCtx.fillStyle = "#F5E4C6";
  prevCtx.beginPath();
  prevCtx.arc(W2 * 0.54, H2 * 0.46, moonR, 0, Math.PI * 2);
  prevCtx.fill();

  // 根据 cropCut 精准算出银幕里人物应画多高，确保底框刚好切在 cropCut 处
  const headMargin = cropCut <= 0.16 ? 0.05 : cropCut >= 1.0 ? 0.18 : 0.12;
  const effBodyH = (1 - headMargin) / Math.min(cropCut, 1.05);
  const drawH = effBodyH * H2;
  const drawTop = headMargin * H2;
  drawFigureSilhouette(prevCtx, W2 * 0.54, drawTop, drawH, cropCut <= 0.16 ? "left" : "back", "#0B0E0D");

  // 底部安全/禁切提醒条 + 四角折角
  prevCtx.strokeStyle = "#F5E4C6";
  prevCtx.lineWidth = 2;
  const ins = 12, a = 18;
  prevCtx.beginPath();
  prevCtx.moveTo(ins, ins + a); prevCtx.lineTo(ins, ins); prevCtx.lineTo(ins + a, ins);
  prevCtx.moveTo(W2 - ins - a, ins); prevCtx.lineTo(W2 - ins, ins); prevCtx.lineTo(W2 - ins, ins + a);
  prevCtx.moveTo(ins, H2 - ins - a); prevCtx.lineTo(ins, H2 - ins); prevCtx.lineTo(ins + a, H2 - ins);
  prevCtx.moveTo(W2 - ins - a, H2 - ins); prevCtx.lineTo(W2 - ins, H2 - ins); prevCtx.lineTo(W2 - ins, H2 - ins - a);
  prevCtx.stroke();

  if (!ev.safe) {
    prevCtx.strokeStyle = "#FF9375";
    prevCtx.lineWidth = 3;
    prevCtx.setLineDash([6, 4]);
    prevCtx.beginPath();
    prevCtx.moveTo(14, H2 - 4);
    prevCtx.lineTo(W2 - 14, H2 - 4);
    prevCtx.stroke();
    prevCtx.setLineDash([]);
  }
  prevCtx.restore();

  // 3. 同步读数与按钮态
  $("#crop-scale-code").textContent = `${ev.shot.en} · ${ev.shot.zh}`;
  const badge = $("#crop-badge");
  badge.textContent = ev.zone;
  badge.dataset.state = ev.safe ? "ok" : "bad";
  $("#crop-zone").textContent = ev.zone;
  $("#crop-emotion").textContent = ev.emotion;
  $("#crop-ratio").textContent = ev.ratioText;
  cropCanvas.setAttribute("aria-valuenow", String(Math.round(cropCut * 100)));

  for (const b of $$(".snap-btn")) {
    const active = Math.abs(Number(b.dataset.cut) - cropCut) < 0.035;
    b.classList.toggle("is-active", active);
  }
}

let cropDragging = false;
function updateCropFromPointer(e) {
  const r = cropCanvas.getBoundingClientRect();
  const y = (e.clientY - r.top) / r.height;
  cropCut = clamp((y - 0.08) / 0.80, 0.14, 1.05);
  renderCropLab();
}
cropCanvas.addEventListener("pointerdown", (e) => {
  cropDragging = true;
  try { cropCanvas.setPointerCapture(e.pointerId); } catch {}
  updateCropFromPointer(e);
});
cropCanvas.addEventListener("pointermove", (e) => {
  if (cropDragging) updateCropFromPointer(e);
});
cropCanvas.addEventListener("pointerup", () => { cropDragging = false; });
cropCanvas.addEventListener("pointercancel", () => { cropDragging = false; });
cropCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    e.preventDefault();
    cropCut = clamp(cropCut - 0.04, 0.14, 1.05);
    renderCropLab();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    cropCut = clamp(cropCut + 0.04, 0.14, 1.05);
    renderCropLab();
  }
});
for (const b of $$(".snap-btn")) {
  b.addEventListener("click", () => {
    cropCut = Number(b.dataset.cut);
    renderCropLab();
  });
}
renderCropLab();

// ==================== 04 · 四维图底分离灯棚 ====================
const studioState = { luma: "flat", blur: false, color: false, clean: false };

function renderStudio() {
  const st = $("#studio-stage");
  st.dataset.luma = studioState.luma;
  st.dataset.blur = studioState.blur ? "on" : "off";
  st.dataset.color = studioState.color ? "on" : "off";
  st.dataset.clean = studioState.clean ? "on" : "off";

  for (const b of $$(".sw-btn[data-luma]")) {
    const active = b.dataset.luma === studioState.luma;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  }
  const bBlur = $("#sw-blur");
  bBlur.setAttribute("aria-pressed", String(studioState.blur));
  bBlur.textContent = studioState.blur ? "f/2.0 背景柔焦虚化（开）" : "f/11 全景锐利（未虚化）";

  const bColor = $("#sw-color");
  bColor.setAttribute("aria-pressed", String(studioState.color));
  bColor.textContent = studioState.color ? "松青冷底 × 暖米亮光（开）" : "同色混融（关）";

  const bClean = $("#sw-clean");
  bClean.setAttribute("aria-pressed", String(studioState.clean));
  bClean.textContent = studioState.clean ? "背景已做几何减法（开）" : "保留杂乱街景（未清）";

  const ev = evaluateLightingStudio(studioState);
  const v = $("#studio-verdict");
  v.dataset.state = ev.state;
  $("#sv-level").textContent = ev.level;
  $("#sv-score").textContent = `分离度 ${ev.score} / ${ev.max}`;
  $("#sv-head").textContent = ev.verdict;
  $("#sv-advice").textContent = ev.advice;
}

for (const b of $$(".sw-btn[data-luma]")) {
  b.addEventListener("click", () => {
    studioState.luma = b.dataset.luma;
    renderStudio();
  });
}
$("#sw-blur").addEventListener("click", () => { studioState.blur = !studioState.blur; renderStudio(); });
$("#sw-color").addEventListener("click", () => { studioState.color = !studioState.color; renderStudio(); });
$("#sw-clean").addEventListener("click", () => { studioState.clean = !studioState.clean; renderStudio(); });
renderStudio();

// ==================== 05 · 什么时候别用单人构图 ====================
const ANTI_CASES = [
  {
    badTitle: "对手凭空消失，张力被剪碎",
    badBody: "审讯、争执或谈判戏里，如果一路只拍干净的纯单人正反打，观众感受不到彼此的距离压迫，只剩两张孤零零的证件照轮流切屏。",
    goodTitle: "把对手带进框，保留空间联系",
    goodBody: "让两个人同框建立对话轴线，或者把听话者的半个肩膀压在前景边缘，不用一句台词就能感到压迫与关系还在场。",
    links: `延伸阅读：<a href="https://layout.xiaoxiaodong.ai/302/play/">302 双人构图</a> · <a href="https://layout.xiaoxiaodong.ai/309/play/">309 脏单人镜头</a>`,
    badSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><rect x="12" y="12" width="120" height="116" stroke="#FF9375" stroke-dasharray="4 3"/><rect x="148" y="12" width="120" height="116" stroke="#FF9375" stroke-dasharray="4 3"/><circle cx="72" cy="54" r="14" fill="#F5E4C6"/><path d="M52 118c3-24 10-34 20-34s17 10 20 34Z" fill="#F5E4C6"/><circle cx="208" cy="54" r="14" fill="#F5E4C6"/><path d="M188 118c3-24 10-34 20-34s17 10 20 34Z" fill="#F5E4C6"/></svg>`,
    goodSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><circle cx="94" cy="56" r="13" fill="#F5E4C6"/><path d="M76 128c3-26 9-38 18-38s15 12 18 38Z" fill="#F5E4C6"/><circle cx="192" cy="56" r="13" fill="#F5E4C6"/><path d="M174 128c3-26 9-38 18-38s15 12 18 38Z" fill="#F5E4C6"/><line x1="112" y1="56" x2="174" y2="56" stroke="#78E6C0" stroke-width="2" stroke-dasharray="5 3"/></svg>`,
  },
  {
    badTitle: "孤影演不出群体规模与阵营层级",
    badBody: "当故事要交待家庭站位、乐队默契或众人对立时，只留一个孤立主角会让观众完全丧失「谁站在哪一边、人数有多少」的宏观判断。",
    goodTitle: "转向三角稳定或分层群像队形",
    goodBody: "三人入画靠三角关系立住稳定感；多人入画则按主次大小与疏密聚散排阵，让秩序而不是空旷承担叙事。",
    links: `延伸阅读：<a href="https://layout.xiaoxiaodong.ai/303/play/">303 三人构图</a> · <a href="https://layout.xiaoxiaodong.ai/304/play/">304 群像构图</a>`,
    badSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><circle cx="140" cy="60" r="12" fill="#F5E4C6"/><path d="M124 124c2-24 8-34 16-34s14 10 16 34Z" fill="#F5E4C6"/><text x="140" y="26" text-anchor="middle" fill="#FF9375" font-size="11" font-family="DM Mono, monospace">MISSING CONTEXT</text></svg>`,
    goodSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><path d="M140 34L82 114H198Z" stroke="#78E6C0" stroke-dasharray="4 3"/><circle cx="140" cy="48" r="11" fill="#F5E4C6"/><path d="M126 120c2-24 7-34 14-34s12 10 14 34Z" fill="#F5E4C6"/><circle cx="84" cy="70" r="8.5" fill="#D4E6DF"/><path d="M73 122c1-18 5-26 11-26s10 8 11 26Z" fill="#D4E6DF"/><circle cx="196" cy="70" r="8.5" fill="#D4E6DF"/><path d="M185 122c1-18 5-26 11-26s10 8 11 26Z" fill="#D4E6DF"/></svg>`,
  },
  {
    badTitle: "为凑「大留白」把关键卖点删光",
    badBody: "在产品参数页、功能对比图或操作指南里盲目追求「留白大于主体」，会让真正帮用户做决策的信息被迫藏进小字或第二屏，形式压倒功能。",
    goodTitle: "按信息密度选网格或图文分栏",
    goodBody: "情绪海报与品牌主视觉适合单人留白；多维度信息展示则应改用有序模块与层级排版，把留白留给组间距而非大片空白。",
    links: `回到核心判断：先问这幅画面要传递「一种情绪」，还是「一组事实」。`,
    badSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><rect x="122" y="54" width="36" height="36" fill="#F5E4C6"/><text x="140" y="114" text-anchor="middle" fill="#FF9375" font-size="10.5" font-family="DM Mono, monospace">INFO STRIPPED</text></svg>`,
    goodSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><rect x="24" y="24" width="96" height="92" fill="#F5E4C6"/><rect x="136" y="24" width="120" height="24" fill="#78E6C0"/><rect x="136" y="58" width="120" height="24" fill="#D4E6DF" fill-opacity="0.7"/><rect x="136" y="92" width="84" height="24" fill="#D4E6DF" fill-opacity="0.5"/></svg>`,
  },
  {
    badTitle: "连拍五镜大留白，高级感迅速变矫情",
    badBody: "同一支短片里，如果连续四五个镜头全是居中、大留白、极简剪影，节奏会彻底失去起伏，观众很快从「被克制打动」变成审美疲劳。",
    goodTitle: "把单人空镜当作节奏里的重音",
    goodBody: "在热闹的群像或紧凑的动作剪辑之后，突然切进一帧安静的单人远景或近景特写——对比之下，一个人的分量才会震住全场。",
    links: `剪辑规律：单人留白的力量一半来自构图本身，另一半来自前后镜头的疏密反差。`,
    badSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><rect x="14" y="34" width="76" height="72" stroke="#FF9375"/><circle cx="52" cy="70" r="8" fill="#F5E4C6"/><rect x="102" y="34" width="76" height="72" stroke="#FF9375"/><circle cx="140" cy="70" r="8" fill="#F5E4C6"/><rect x="190" y="34" width="76" height="72" stroke="#FF9375"/><circle cx="228" cy="70" r="8" fill="#F5E4C6"/></svg>`,
    goodSvg: `<svg viewBox="0 0 280 140" fill="none"><rect width="280" height="140" fill="#024D4B"/><rect x="14" y="34" width="76" height="72" stroke="#D4E6DF"/><circle cx="34" cy="72" r="6" fill="#D4E6DF"/><circle cx="52" cy="66" r="6" fill="#D4E6DF"/><circle cx="70" cy="74" r="6" fill="#D4E6DF"/><rect x="102" y="34" width="76" height="72" stroke="#78E6C0" stroke-width="2"/><circle cx="148" cy="70" r="10" fill="#F5E4C6"/><rect x="190" y="34" width="76" height="72" stroke="#D4E6DF"/><circle cx="228" cy="68" r="20" fill="#F5E4C6"/></svg>`,
  },
];

function renderAnti(idx) {
  const c = ANTI_CASES[idx] || ANTI_CASES[0];
  $("#anti-svg-bad").innerHTML = c.badSvg;
  $("#anti-bad-title").textContent = c.badTitle;
  $("#anti-bad-body").textContent = c.badBody;
  $("#anti-svg-good").innerHTML = c.goodSvg;
  $("#anti-good-title").textContent = c.goodTitle;
  $("#anti-good-body").textContent = c.goodBody;
  $("#anti-link-wrap").innerHTML = c.links;
  for (const b of $$(".anti-tab")) {
    const active = Number(b.dataset.anti) === idx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  }
}
for (const b of $$(".anti-tab")) {
  b.addEventListener("click", () => renderAnti(Number(b.dataset.anti)));
}
renderAnti(0);

// ==================== 06 · 两道单变量选镜练习 ====================
let quizRound = 0;
const quizPicked = [null, null];

function quizOptionSvg(opt) {
  const W = 240, H = 180;
  const cx = Math.round(opt.subjU * W);
  if (opt.cutMode === "full") {
    // 第 1 题：海堤独行全景（只变水平位置 opt.subjU，其余全同，面向右）
    return `<svg viewBox="0 0 ${W} ${H}" fill="none">
      <rect width="${W}" height="${H}" fill="#024D4B"/>
      <rect x="0" y="0" width="${W}" height="126" fill="#F3DEB7"/>
      <rect x="0" y="126" width="${W}" height="24" fill="#0B504A"/>
      <rect x="0" y="148" width="${W}" height="32" fill="#0B0E0D"/>
      <g transform="translate(${cx} 82)" fill="#0B0E0D">
        <path d="M-4 14c-2-4-2-10 3-13c5-2 10 1 10 6l2 3l-2 2l-1 4c-2 2-5 2-7 1z"/>
        <path d="M-7 22c1-5 5-7 9-7s8 2 9 7l-1 18l5 27h-6l-4-19l-3 19h-6l-1-27z"/>
      </g>
      <path d="M10 24V10H24M230 24V10H216M10 156V170H24M230 156V170H216" stroke="#024D4B" stroke-width="1.6"/>
    </svg>`;
  }
  // 第 2 题：室内中近景（水平位置全同 cx，只变垂直裁切与留顶）
  let topY = 24, scaleH = 260;
  if (opt.cutMode === "knee") {
    topY = 28;
    scaleH = 208; // 底框 180 落在 (180-28)/208 = 0.73 膝关节！
  } else if (opt.cutMode === "clipHead") {
    topY = 2;
    scaleH = 500; // 削顶
  } else if (opt.cutMode === "chestSafe") {
    topY = 24;
    scaleH = 490; // 舒适留顶 + 胸口安全切位
  } else {
    topY = 82;
    scaleH = 380; // 过半空顶下沉
  }
  const headR = scaleH * 0.068;
  const headCy = topY + headR;
  const shY = topY + scaleH * 0.168;
  const shW = scaleH * 0.14;
  const waistY = topY + scaleH * 0.45;
  const hipY = topY + scaleH * 0.54;
  const footY = topY + scaleH;
  return `<svg viewBox="0 0 ${W} ${H}" fill="none">
    <rect width="${W}" height="${H}" fill="#024D4B"/>
    <rect x="44" y="14" width="152" height="152" fill="#F5E4C6"/>
    <line x1="120" y1="14" x2="120" y2="166" stroke="#024D4B" stroke-width="2"/>
    <g fill="#0B0E0D">
      <ellipse cx="${cx}" cy="${headCy.toFixed(1)}" rx="${(headR * 0.88).toFixed(1)}" ry="${headR.toFixed(1)}"/>
      <path d="M${(cx - headR * 0.45).toFixed(1)} ${(topY + headR * 1.85).toFixed(1)}H${(cx + headR * 0.45).toFixed(1)}L${(cx + shW).toFixed(1)} ${(shY + scaleH * 0.05).toFixed(1)}L${(cx + shW * 0.86).toFixed(1)} ${waistY.toFixed(1)}L${(cx + shW * 0.65).toFixed(1)} ${footY.toFixed(1)}H${(cx + shW * 0.1).toFixed(1)}L${cx} ${(hipY + scaleH * 0.04).toFixed(1)}L${(cx - shW * 0.1).toFixed(1)} ${footY.toFixed(1)}H${(cx - shW * 0.65).toFixed(1)}L${(cx - shW * 0.86).toFixed(1)} ${waistY.toFixed(1)}L${(cx - shW).toFixed(1)} ${(shY + scaleH * 0.05).toFixed(1)}Z"/>
    </g>
    <path d="M10 24V10H24M230 24V10H216M10 156V170H24M230 156V170H216" stroke="#F5E4C6" stroke-width="1.6"/>
  </svg>`;
}

function renderQuiz() {
  const q = QUIZ_ROUNDS[quizRound];
  const picked = quizPicked[quizRound];
  $("#quiz-var").textContent = q.variable;
  $("#quiz-prompt").textContent = q.prompt;

  for (const b of $$(".q-round-btn")) {
    const active = Number(b.dataset.round) === quizRound;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  }

  const grid = $("#quiz-grid");
  grid.innerHTML = "";
  for (const opt of q.options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "q-card";
    btn.dataset.key = opt.key;
    let mark = "";
    if (picked) {
      if (opt.correct) {
        btn.classList.add("is-right");
        mark = "✓ 推荐";
      } else if (picked === opt.key) {
        btn.classList.add("is-wrong");
        mark = "× 所选";
      }
    }
    btn.innerHTML = `<span class="q-frame" aria-hidden="true">${quizOptionSvg(opt)}</span>
      <span class="q-label"><span>${opt.label}</span><span class="q-mark">${mark}</span></span>`;
    btn.addEventListener("click", () => {
      quizPicked[quizRound] = opt.key;
      renderQuiz();
    });
    grid.appendChild(btn);
  }

  const fb = $("#quiz-feedback");
  if (!picked) {
    fb.innerHTML = `<p class="qf-idle">点选上方 A / B / C / D 任意一镜查看片场拆解。</p>`;
    return;
  }
  const chosen = q.options.find((o) => o.key === picked);
  const right = q.options.find((o) => o.correct);
  const otherIdx = quizRound === 0 ? 1 : 0;
  fb.innerHTML = `
    <p class="qf-head ${chosen.correct ? "" : "is-wrong"}">${
      chosen.correct ? `答对了：${right.label} 最稳` : `再看看：你选了 ${chosen.label}，最稳的是 ${right.label}`
    }</p>
    <p class="qf-body">${chosen.explain}</p>
    <ul class="qf-list">
      ${q.options.map((o) => `<li><strong>${o.label}</strong>：${o.explain}</li>`).join("")}
    </ul>
    <div class="qf-actions">
      <button type="button" class="qf-next" id="qf-switch">${quizRound === 0 ? "继续第 2 题 →" : "回到第 1 题"}</button>
    </div>
  `;
  $("#qf-switch").addEventListener("click", () => {
    quizRound = otherIdx;
    renderQuiz();
  });
}

for (const b of $$(".q-round-btn")) {
  b.addEventListener("click", () => {
    quizRound = Number(b.dataset.round);
    renderQuiz();
  });
}
renderQuiz();

// ==================== 07 · 原海报放大灯箱（只引用一次 poster.webp） ====================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbPct = $("#lb-pct");
let lbZoom = 1, lbX = 0, lbY = 0, lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbZoom})`;
  lbPct.textContent = `${Math.round(lbZoom * 100)}%`;
}
function openLightbox() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbZoom = 1.25;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}
function closeLightbox() {
  lb.hidden = true;
  $("#poster-open").focus();
}

$("#poster-open").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => { lbZoom = clamp(lbZoom + 0.35, 0.8, 3.2); applyLbTransform(); });
$("#lb-zoom-out").addEventListener("click", () => { lbZoom = clamp(lbZoom - 0.35, 0.8, 3.2); applyLbTransform(); });
$("#lb-reset").addEventListener("click", () => { lbZoom = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || lbDrag.id !== e.pointerId) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.2 : -0.2), 0.8, 3.2);
  applyLbTransform();
}, { passive: false });
lb.addEventListener("click", (e) => {
  if (e.target === lbStage) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// 初次渲染一帧，确保静态与减少动态效果下画面立即完整
heroLoop.draw();
