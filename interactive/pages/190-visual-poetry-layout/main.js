import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { BANDS, INITIAL_STATE, layoutPoem } from "./model.js";
import { initLabs } from "./labs.js";

const canvas = document.getElementById("poem-canvas");
const ctx = canvas.getContext("2d");

const inSlope = document.getElementById("in-slope");
const inRiver = document.getElementById("in-river");
const inBreath = document.getElementById("in-breath");
const outSlope = document.getElementById("out-slope");
const outRiver = document.getElementById("out-river");
const outBreath = document.getElementById("out-breath");
const btnGuides = document.getElementById("btn-guides");
const btnReset = document.getElementById("btn-reset");
const modeBtns = [...document.querySelectorAll(".hero-controls [data-mode]")];
const titleChars = [...document.querySelectorAll(".dt-ch")];

const diagScore = document.getElementById("diag-score");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagDetail = document.getElementById("diag-detail");
const chkSem = document.getElementById("chk-sem");
const chkSlope = document.getElementById("chk-slope");
const chkRiver = document.getElementById("chk-river");
const chkSpace = document.getElementById("chk-space");
const valSem = document.getElementById("val-sem");
const valSlope = document.getElementById("val-slope");
const valRiver = document.getElementById("val-river");
const valSpace = document.getElementById("val-space");

// 运行态（直接驱动画布）与布局缓存
const state = { ...INITIAL_STATE };
let targetSlope = state.slope;
let targetRiver = state.river;
let layout = layoutPoem(state);
let dirty = true;
let introDone = false;

// 画布逻辑映射参数（始终等比，保证圆日绝不变椭圆）
let viewW = 600;
let viewH = 560;
let unit = 540;
let cx = 300;
let cy = 280;

const toPx = (u, v) => ({ x: cx + (u - 0.5) * unit, y: cy + (v - 0.5) * unit });
const toUv = (px, py) => ({ u: (px - cx) / unit + 0.5, v: (py - cy) / unit + 0.5 });

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const dpr = pixelRatio(2);
  viewW = rect.width;
  viewH = rect.height;
  const bw = Math.round(viewW * dpr);
  const bh = Math.round(viewH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  unit = Math.min(viewW * 0.96, viewH * 0.96);
  cx = viewW * 0.5;
  cy = viewH * 0.5;
  dirty = true;
}

function syncUI() {
  layout = layoutPoem(state);
  const { metrics, checks, verdict } = layout;

  inSlope.value = String(Math.round(state.slope));
  inRiver.value = String(Math.round(state.river));
  inBreath.value = String(Math.round(state.breath));

  outSlope.textContent = `${metrics.slopeDeg}°`;
  outRiver.textContent = `${metrics.riverPct}%`;
  const sign = metrics.trackingEm >= 0 ? "+" : "";
  outBreath.textContent = `${sign}${metrics.trackingEm.toFixed(2)}em · 留白 ${metrics.whitespacePct}%`;

  const lockedMode = state.mode !== "mountain";
  inSlope.disabled = lockedMode;
  inRiver.disabled = lockedMode;

  modeBtns.forEach((b) => {
    const on = b.dataset.mode === state.mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));

  // 示范大标随山势微微起伏（尊重减少动态效果）
  if (!reducedMotion.matches) {
    const k = state.mode === "mountain" ? Math.min(1, state.slope / 28) : 0;
    const offsets = [3 * k, -2 * k, -6 * k, -1 * k, 4 * k];
    titleChars.forEach((el, idx) => {
      el.style.transform = `translateY(${offsets[idx].toFixed(1)}px)`;
    });
  }

  diagScore.textContent = `${metrics.passedCount} / 4`;
  diagBadge.textContent = verdict.badge;
  diagBadge.className = `diag-badge is-${verdict.status}`;
  diagHeadline.textContent = verdict.headline;
  diagDetail.textContent = verdict.detail;

  chkSem.classList.toggle("is-pass", checks.semanticsOk);
  chkSlope.classList.toggle("is-pass", checks.slopeOk);
  chkRiver.classList.toggle("is-pass", checks.riverOk);
  chkSpace.classList.toggle("is-pass", checks.spaceOk);

  valSem.textContent =
    checks.semanticsOk
      ? "✓ 山水合拍"
      : state.mode === "rain"
      ? "× 斜雨错配"
      : state.mode === "prose"
      ? "× 平排无形"
      : "× 未立成形";

  if (state.mode !== "mountain") {
    valSlope.textContent = "— 已切他形";
  } else if (metrics.mountainCollisions > 0) {
    valSlope.textContent = `× 撞叠 ${metrics.mountainCollisions} 处`;
  } else if (metrics.slopeDeg < BANDS.slopeMin) {
    valSlope.textContent = `${metrics.slopeDeg}° · 偏平`;
  } else if (metrics.slopeDeg > BANDS.slopeMax) {
    valSlope.textContent = `${metrics.slopeDeg}° · 过陡`;
  } else {
    valSlope.textContent = `✓ ${metrics.slopeDeg}° 顺读`;
  }

  if (state.mode !== "mountain") {
    valRiver.textContent = "— 已切他形";
  } else if (metrics.riverCollisions > 0) {
    valRiver.textContent = `× 急弯叠 ${metrics.riverCollisions} 处`;
  } else if (metrics.riverPct < BANDS.riverMin) {
    valRiver.textContent = `${metrics.riverPct}% · 僵直`;
  } else if (metrics.riverPct > BANDS.riverMax) {
    valRiver.textContent = `${metrics.riverPct}% · 过弯`;
  } else {
    valRiver.textContent = `✓ ${metrics.riverPct}% 流畅`;
  }

  if (metrics.sunOverlapCount > 0) {
    valSpace.textContent = `× 落日压 ${metrics.sunOverlapCount} 字`;
  } else if (metrics.sunClipped) {
    valSpace.textContent = "× 落日贴边";
  } else if (metrics.whitespacePct < BANDS.wsMin) {
    valSpace.textContent = `${metrics.whitespacePct}% · 偏挤`;
  } else if (metrics.whitespacePct > BANDS.wsMax) {
    valSpace.textContent = `${metrics.whitespacePct}% · 过散`;
  } else if (state.breath < BANDS.breathMin) {
    valSpace.textContent = `${metrics.whitespacePct}% · 字紧`;
  } else if (state.breath > BANDS.breathMax) {
    valSpace.textContent = `${metrics.whitespacePct}% · 字散`;
  } else {
    valSpace.textContent = `✓ 留白 ${metrics.whitespacePct}%`;
  }

  dirty = true;
}

// 2D 画布绘制：完全开放姜黄版画纸面 + 朱陶落日 + 实算字符 + 碰撞与骨架注记
function drawScene(t, dt, { still }) {
  // 开场 0.65s 轻缓墨落动画（减少动态效果时直接画终帧）
  const introP = still ? 1 : Math.min(1, t / 0.65);
  const easeIntro = 1 - Math.pow(1 - introP, 3);
  if (!still && introP < 1) dirty = true;
  else if (!introDone) {
    introDone = true;
    dirty = true;
  }

  // 拖动时对山势与水曲做轻缓阻尼追踪，让每一帧都顺滑重绘
  let moved = false;
  if (!still) {
    const ds = targetSlope - state.slope;
    const dr = targetRiver - state.river;
    if (Math.abs(ds) > 0.08) {
      state.slope += ds * Math.min(1, dt * 18 + 0.28);
      moved = true;
    } else if (state.slope !== targetSlope) {
      state.slope = targetSlope;
      moved = true;
    }
    if (Math.abs(dr) > 0.12) {
      state.river += dr * Math.min(1, dt * 18 + 0.28);
      moved = true;
    } else if (state.river !== targetRiver) {
      state.river = targetRiver;
      moved = true;
    }
    if (moved) syncUI();
  }

  if (!dirty && !dragState.active) return;
  dirty = false;

  ctx.clearRect(0, 0, viewW, viewH);

  // 1. 透视骨架层（开启透视或正在拖动时轻显）
  const { glyphs, guides, hitPairs, metrics } = layout;
  if (state.showGuides || dragState.active) {
    ctx.save();
    ctx.strokeStyle = state.showGuides ? "rgba(18, 15, 10, 0.34)" : "rgba(18, 15, 10, 0.16)";
    ctx.lineWidth = 1.1;
    ctx.setLineDash([4, 4]);

    // 画布极简版心参考
    const pTL = toPx(0.06, 0.06);
    const pBR = toPx(0.94, 0.94);
    if (state.showGuides) {
      ctx.strokeRect(pTL.x, pTL.y, pBR.x - pTL.x, pBR.y - pTL.y);
    }

    if (guides.ridgeLeft.length > 1) {
      ctx.beginPath();
      guides.ridgeLeft.forEach((pt, i) => {
        const p = toPx(pt.x, pt.y);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
    if (guides.ridgeRight.length > 1) {
      ctx.beginPath();
      guides.ridgeRight.forEach((pt, i) => {
        const p = toPx(pt.x, pt.y);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
    if (guides.riverPts.length > 1) {
      ctx.beginPath();
      guides.riverPts.forEach((pt, i) => {
        const p = toPx(pt.x, pt.y);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
    if (guides.rainVectors.length) {
      guides.rainVectors.forEach((v) => {
        const a = toPx(v.x0, v.y0);
        const b = toPx(v.x1, v.y1);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    }

    // 读序编号 ① ② ③（开启透视骨架时显示）
    if (state.showGuides && state.mode === "mountain") {
      ctx.setLineDash([]);
      const tags = [
        { u: 0.5, v: 0.055, text: "① 峰脊" },
        { u: 0.22, v: 0.34, text: `② 坡角 ${metrics.slopeDeg}°` },
        { u: 0.78, v: 0.66, text: `③ 曲流 ${metrics.riverPct}%` },
      ];
      ctx.font = `600 ${Math.max(11, Math.round(unit * 0.023))}px "Noto Serif SC", serif`;
      ctx.fillStyle = "#5E2405";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      tags.forEach((tg) => {
        const p = toPx(tg.u, tg.v);
        ctx.fillText(tg.text, p.x, p.y);
      });
    }
    ctx.restore();
  }

  // 2. 哑光朱陶落日（绝对正圆，实采 #B95A1D）
  const sunP = toPx(state.sunX, state.sunY);
  const sunPxR = BANDS.sunR * unit;
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.8 * easeIntro;
  const sunGrad = ctx.createRadialGradient(
    sunP.x - sunPxR * 0.26,
    sunP.y - sunPxR * 0.26,
    sunPxR * 0.1,
    sunP.x,
    sunP.y,
    sunPxR
  );
  sunGrad.addColorStop(0, "#C76827");
  sunGrad.addColorStop(0.72, "#B95A1D");
  sunGrad.addColorStop(1, "#A64B14");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunP.x, sunP.y, sunPxR, 0, Math.PI * 2);
  ctx.fill();

  // 若落日压字或贴边，画细虚线告警圈
  if (metrics.sunOverlapCount > 0 || metrics.sunClipped) {
    ctx.strokeStyle = "#5E2405";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(sunP.x, sunP.y, sunPxR + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (dragState.target === "sun" && dragState.active) {
    ctx.strokeStyle = "rgba(18, 15, 10, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sunP.x, sunP.y, sunPxR + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 3. 逐字绘制原海报诗句（采用霞鹜文楷）
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const liftY = (1 - easeIntro) * 10;

  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const p = toPx(g.x, g.y);
    const fs = Math.max(10.5, g.size * unit);
    const a = (g.alpha ?? 1) * (0.25 + 0.75 * easeIntro);

    ctx.save();
    ctx.translate(p.x, p.y + liftY);
    if (g.angle) ctx.rotate(g.angle);
    ctx.globalAlpha = a;
    ctx.font = `400 ${fs.toFixed(1)}px "LXGW WenKai", "Noto Serif SC", serif`;
    ctx.fillStyle = g.hit || g.sunHit ? "#6B2204" : "#120F0A";
    ctx.fillText(g.char, 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // 4. 真实叠字碰撞警示点（只标真正发生碰撞处，最多标前 14 处保持清朗）
  if (hitPairs.length > 0) {
    ctx.save();
    ctx.strokeStyle = "#7D2404";
    ctx.lineWidth = 1.3;
    const cap = Math.min(14, hitPairs.length);
    for (let i = 0; i < cap; i++) {
      const p = toPx(hitPairs[i].x, hitPairs[i].y);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(4.5, unit * 0.012), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. 拖动中或初始平排态在画布底沿画极轻的「拖开山势」双箭标尺（非按钮卡片，融入版画）
  if (dragState.active || (state.mode === "mountain" && metrics.slopeDeg < 14)) {
    ctx.save();
    const yBar = toPx(0.5, 0.965).y;
    const xL = toPx(0.26, 0.965).x;
    const xR = toPx(0.74, 0.965).x;
    ctx.strokeStyle = "rgba(18, 15, 10, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xL, yBar);
    ctx.lineTo(xR, yBar);
    ctx.stroke();
    const ratio = state.slope / 64;
    const knobX = xL + (xR - xL) * ratio;
    ctx.fillStyle = "#120F0A";
    ctx.beginPath();
    ctx.arc(knobX, yBar, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.fillStyle = "#2A2216";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("0°", xL - 6, yBar);
    ctx.textAlign = "left";
    ctx.fillText("64°", xR + 6, yBar);
    ctx.restore();
  }
}

// ---------- 直接操作交互（鼠标 + 触屏 + 键盘） ----------
const dragState = {
  active: false,
  pointerId: null,
  target: "slope", // "sun" | "river" | "slope"
  startX: 0,
  startY: 0,
  startSunX: 0,
  startSunY: 0,
  moved: false,
};

function getLocalPt(e) {
  const rect = canvas.getBoundingClientRect();
  return { px: e.clientX - rect.left, py: e.clientY - rect.top };
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button && e.button !== 0) return;
  const { px, py } = getLocalPt(e);
  const { u, v } = toUv(px, py);
  const dSun = Math.hypot(u - state.sunX, v - state.sunY);

  dragState.active = true;
  dragState.pointerId = e.pointerId;
  dragState.startX = px;
  dragState.startY = py;
  dragState.startSunX = state.sunX;
  dragState.startSunY = state.sunY;
  dragState.moved = false;

  if (dSun <= BANDS.sunR * 1.15) {
    dragState.target = "sun";
  } else if (v > 0.62 && state.mode === "mountain") {
    dragState.target = "river";
  } else {
    dragState.target = "slope";
  }

  canvas.classList.add("is-dragging");
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
  dirty = true;
  stageLoop.draw();
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragState.active || e.pointerId !== dragState.pointerId) return;
  const { px, py } = getLocalPt(e);
  const dx = px - dragState.startX;
  const dy = py - dragState.startY;
  if (!dragState.moved && Math.hypot(dx, dy) < 3) return;
  dragState.moved = true;

  if (dragState.target === "sun") {
    state.sunX = Math.max(0.08, Math.min(0.92, dragState.startSunX + dx / unit));
    state.sunY = Math.max(0.08, Math.min(0.90, dragState.startSunY + dy / unit));
    syncUI();
    stageLoop.draw();
    return;
  }

  // 若用户在平排或斜雨态直接拖画布，自动切回山水原形进入雕琢
  if (state.mode !== "mountain") {
    state.mode = "mountain";
  }

  const { u } = toUv(px, py);
  if (dragState.target === "river") {
    // 拖动下半区直接左右调曲流弯度（0..100%）
    const nextR = Math.max(0, Math.min(100, ((u - 0.10) / 0.80) * 100));
    targetRiver = state.river = nextR;
    syncUI();
    stageLoop.draw();
    return;
  }

  // 主区域水平扫动：按绝对横向比例直接驱动山势坡角（0°..64°），触控来回拖每帧持续响应
  const nextS = Math.max(0, Math.min(64, ((u - 0.10) / 0.80) * 64));
  targetSlope = state.slope = nextS;
  syncUI();
  stageLoop.draw();
});

function endDrag(e) {
  if (!dragState.active || (e && e.pointerId !== dragState.pointerId)) return;
  dragState.active = false;
  dragState.pointerId = null;
  canvas.classList.remove("is-dragging");
  dirty = true;
  stageLoop.draw();
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

// 键盘微调支持：←/→ 调山势坡角，↑/↓ 调水句曲度，Shift 配合挪落日
canvas.addEventListener("keydown", (e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  e.preventDefault();
  if (e.shiftKey) {
    const step = 0.04;
    if (e.key === "ArrowLeft") state.sunX = Math.max(0.08, state.sunX - step);
    if (e.key === "ArrowRight") state.sunX = Math.min(0.92, state.sunX + step);
    if (e.key === "ArrowUp") state.sunY = Math.max(0.08, state.sunY - step);
    if (e.key === "ArrowDown") state.sunY = Math.min(0.90, state.sunY + step);
  } else {
    if (state.mode !== "mountain") state.mode = "mountain";
    if (e.key === "ArrowLeft") targetSlope = state.slope = Math.max(0, state.slope - 2);
    if (e.key === "ArrowRight") targetSlope = state.slope = Math.min(64, state.slope + 2);
    if (e.key === "ArrowUp") targetRiver = state.river = Math.min(100, state.river + 4);
    if (e.key === "ArrowDown") targetRiver = state.river = Math.max(0, state.river - 4);
  }
  syncUI();
  stageLoop.draw();
});

// 滑杆与按钮绑定
inSlope.addEventListener("input", () => {
  state.mode = "mountain";
  targetSlope = state.slope = Number(inSlope.value);
  syncUI();
  stageLoop.draw();
});
inRiver.addEventListener("input", () => {
  state.mode = "mountain";
  targetRiver = state.river = Number(inRiver.value);
  syncUI();
  stageLoop.draw();
});
inBreath.addEventListener("input", () => {
  state.breath = Number(inBreath.value);
  syncUI();
  stageLoop.draw();
});

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    syncUI();
    stageLoop.draw();
  });
});

btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI();
  stageLoop.draw();
});

btnReset.addEventListener("click", () => {
  Object.assign(state, INITIAL_STATE);
  targetSlope = state.slope;
  targetRiver = state.river;
  syncUI();
  stageLoop.draw();
});

// 启动画布渲染与监听尺寸变化
const stageLoop = loop(canvas, drawScene);
resizeCanvas();
syncUI();
stageLoop.draw();

if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    resizeCanvas();
    stageLoop.draw();
  }).observe(canvas);
} else {
  window.addEventListener("resize", () => {
    resizeCanvas();
    stageLoop.draw();
  });
}

// 字体加载完毕后重画一次，确保 LXGW WenKai 立即生效
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    dirty = true;
    stageLoop.draw();
  });
}

// 初始化正文 01–07 节全部交互实验
initLabs();
