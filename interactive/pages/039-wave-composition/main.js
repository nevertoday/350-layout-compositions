// 039 波浪形构图 · 开场「潮汐波形雕塑与节拍调音台」主驱动 + 全页接入
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_BROKEN,
  LIMITS,
  PRESETS,
  THEMES,
  backWaveUnit,
  clamp,
  evaluate,
  frontY,
  idealCrestStations,
  nearestUpperCrest,
  upperY,
} from "./model.js";
import { createSurferMedallion } from "./surfer.js";
import { initAnatomy, initAssociationLab, initLineage, initPosterLightbox, initPractice, initSpectrum, initUseAvoid } from "./sections.js";

const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");

// DOM 引用
const titleChars = [...document.querySelectorAll(".wave-char")];
const statusPill = document.getElementById("hero-status-pill");
const themeBtns = [...document.querySelectorAll(".theme-btn")];
const pulseBtn = document.getElementById("btn-pulse");

const pillarSoft = document.querySelector('[data-pillar="soft"]');
const pillarRhythm = document.querySelector('[data-pillar="rhythm"]');
const pillarGuidance = document.querySelector('[data-pillar="guidance"]');
const pillarSoftTag = document.getElementById("pillar-soft-tag");
const pillarRhythmTag = document.getElementById("pillar-rhythm-tag");
const pillarGuidanceTag = document.getElementById("pillar-guidance-tag");
const pillarSoftDots = document.getElementById("pillar-soft-dots");
const pillarRhythmDots = document.getElementById("pillar-rhythm-dots");
const pillarGuidanceDots = document.getElementById("pillar-guidance-dots");

const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const btnFixStep = document.getElementById("btn-fix-step");

const mCycles = document.getElementById("m-cycles");
const mAmp = document.getElementById("m-amp");
const mTurn = document.getElementById("m-turn");
const mFlow = document.getElementById("m-flow");

const slCycles = document.getElementById("sl-cycles");
const slAmp = document.getElementById("sl-amp");
const slSharp = document.getElementById("sl-sharp");
const slPhase = document.getElementById("sl-phase");
const valCycles = document.getElementById("val-cycles");
const valAmp = document.getElementById("val-amp");
const valSharp = document.getElementById("val-sharp");
const valPhase = document.getElementById("val-phase");

const presetBtns = [...document.querySelectorAll(".preset-btn")];

// 唯一状态源
let state = {
  ...INITIAL_BROKEN,
  stations: [...INITIAL_BROKEN.stations],
  pulseActive: false,
};

let evalCache = evaluate(state);
let redHotspots = []; // 每帧绘制后缓存可点击红标热区
let focalHit = { x: 0, y: 0, r: 44 };
let stationHits = [];
let hoverTarget = null;
let dragMode = null; // null | { kind: 'wave', startX, startCycles } | { kind: 'station', idx } | { kind: 'focal' }
let pulseProgress = 0;

// 从原海报 #poster 裁出真实冲浪者 + 暖阳圆
let heroLoop = null;
const surfer = createSurferMedallion(() => {
  if (heroLoop) heroLoop.draw();
});

function renderDots(el, litCount) {
  if (el.dataset.lit === String(litCount)) return;
  el.dataset.lit = String(litCount);
  el.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < litCount ? "is-lit" : ""}"></i>`).join("");
}

// 标题本身就是示范：五个字随当前波形的柔和度与周期起伏，错态尖折时显出微抖与硬斜
function syncLivingTitle() {
  const ampPx = Math.min(9, state.amplitude * 42);
  titleChars.forEach((span, i) => {
    const u = i / 4;
    const th = 2 * Math.PI * clamp(state.cycles * 0.45, 0.5, 2.2) * (u - 0.5);
    const s = Math.cos(th);
    const tri = 1 - (2 / Math.PI) * Math.acos(clamp(s, -1, 1));
    const wv = (1 - state.sharpness) * s + state.sharpness * tri;
    const dy = -wv * ampPx;
    const rot = state.sharpness > 0.3 ? (i % 2 === 0 ? -3.2 : 3.2) * state.sharpness : -Math.sin(th) * ampPx * 0.45;
    span.style.transform = `translateY(${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
  });
}

// 同步所有 DOM 读数、三支柱金胶囊、四滑块、诊单
function syncUI() {
  evalCache = evaluate(state);
  const ev = evalCache;

  statusPill.textContent = ev.diagnosis.badge;
  statusPill.classList.toggle("is-ok", ev.diagnosis.ok);

  diagBadge.textContent = ev.diagnosis.badge;
  diagBadge.className = `diag-badge ${ev.diagnosis.ok ? "is-ok" : "is-bad"}`;
  diagTitle.textContent = ev.diagnosis.headline;
  diagWhy.textContent = ev.diagnosis.why;
  diagAction.textContent = ev.diagnosis.action;
  btnFixStep.hidden = ev.diagnosis.ok;

  mCycles.textContent = `${ev.metrics.cycles.toFixed(2)} 波`;
  mAmp.textContent = `${ev.metrics.amplitudePct}%`;
  mTurn.textContent = `${ev.metrics.maxTurnDeg}°`;
  mFlow.textContent = ev.metrics.flowGrade;

  slCycles.value = String(state.cycles);
  slAmp.value = String(state.amplitude);
  slSharp.value = String(state.sharpness);
  slPhase.value = String(state.phaseShift);
  valCycles.textContent = `${state.cycles.toFixed(2)} 波`;
  valAmp.textContent = `${Math.round(state.amplitude * 100)}%`;
  valSharp.textContent = `${Math.round(state.sharpness * 100)}%`;
  valPhase.textContent = `${Math.round(state.phaseShift * 100)}%`;

  // 更新三支柱胶囊
  pillarSoftTag.textContent = ev.pillars.soft.tag;
  pillarSoft.classList.toggle("is-ok", ev.pillars.soft.ok);
  pillarSoft.classList.toggle("is-bad", !ev.pillars.soft.ok);
  renderDots(pillarSoftDots, ev.pillars.soft.dots);

  pillarRhythmTag.textContent = ev.pillars.rhythm.tag;
  pillarRhythm.classList.toggle("is-ok", ev.pillars.rhythm.ok);
  pillarRhythm.classList.toggle("is-bad", !ev.pillars.rhythm.ok);
  renderDots(pillarRhythmDots, ev.pillars.rhythm.dots);

  pillarGuidanceTag.textContent = ev.pillars.guidance.tag;
  pillarGuidance.classList.toggle("is-ok", ev.pillars.guidance.ok);
  pillarGuidance.classList.toggle("is-bad", !ev.pillars.guidance.ok);
  renderDots(pillarGuidanceDots, ev.pillars.guidance.dots);

  themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });

  pulseBtn.setAttribute("aria-pressed", state.pulseActive ? "true" : "false");
  pulseBtn.textContent = state.pulseActive ? "停止巡游" : "沿浪巡游";

  syncLivingTitle();
}

function setState(patch, fromDrag = false) {
  state = { ...state, ...patch };
  syncUI();
  if ((!fromDrag || reducedMotion.matches) && heroLoop) heroLoop.draw();
}

// 绘制小圆徽图标（1:1 呼应原海报三图标：水波 / 声波条 / 上扬曲线箭）
function drawStationGlyph(c, kind, cx, cy, r, color) {
  c.save();
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = Math.max(2, r * 0.13);
  c.lineCap = "round";
  c.lineJoin = "round";
  if (kind === "wave") {
    for (const dy of [-r * 0.24, 0, r * 0.24]) {
      c.beginPath();
      c.moveTo(cx - r * 0.48, cy + dy);
      c.bezierCurveTo(cx - r * 0.2, cy + dy - r * 0.24, cx + r * 0.2, cy + dy + r * 0.24, cx + r * 0.48, cy + dy);
      c.stroke();
    }
  } else if (kind === "bars") {
    const hs = [0.22, 0.42, 0.56, 0.42, 0.22];
    const xs = [-0.4, -0.2, 0, 0.2, 0.4];
    hs.forEach((hh, i) => {
      c.beginPath();
      c.moveTo(cx + xs[i] * r, cy - hh * r);
      c.lineTo(cx + xs[i] * r, cy + hh * r);
      c.stroke();
    });
  } else {
    c.beginPath();
    c.moveTo(cx - r * 0.44, cy + r * 0.12);
    c.quadraticCurveTo(cx + r * 0.04, cy + r * 0.42, cx + r * 0.42, cy - r * 0.26);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + r * 0.18, cy - r * 0.26);
    c.lineTo(cx + r * 0.44, cy - r * 0.28);
    c.lineTo(cx + r * 0.42, cy - r * 0.02);
    c.stroke();
  }
  c.restore();
}

// 非冲浪题材的替代主焦点圆（山岚音乐季 / 茶山茶韵，零面具人脸）
function drawAlternateFocal(c, themeId, cx, cy, rad) {
  c.save();
  c.beginPath();
  c.arc(cx, cy, rad, 0, Math.PI * 2);
  c.clip();

  const sun = c.createLinearGradient(cx, cy - rad, cx, cy + rad);
  sun.addColorStop(0, "#FFE066");
  sun.addColorStop(1, "#F7B71D");
  c.fillStyle = sun;
  c.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);

  if (themeId === "music") {
    // 落日声浪主舞台剪影
    c.fillStyle = "#065C6E";
    c.beginPath();
    c.moveTo(cx - rad, cy + rad * 0.32);
    c.quadraticCurveTo(cx - rad * 0.35, cy - rad * 0.12, cx + rad * 0.15, cy + rad * 0.22);
    c.quadraticCurveTo(cx + rad * 0.62, cy + rad * 0.45, cx + rad, cy + rad * 0.08);
    c.lineTo(cx + rad, cy + rad);
    c.lineTo(cx - rad, cy + rad);
    c.closePath();
    c.fill();
    c.strokeStyle = "#FFFFFF";
    c.lineWidth = 2.6;
    for (let i = -3; i <= 3; i++) {
      const h = (1 - Math.abs(i) / 4.2) * rad * 0.42;
      c.beginPath();
      c.moveTo(cx + i * rad * 0.16, cy - h * 0.55);
      c.lineTo(cx + i * rad * 0.16, cy + h * 0.55);
      c.stroke();
    }
  } else {
    // 茶山梯田弧垄与一片悬浮茶叶
    c.fillStyle = "#0D8A7B";
    c.beginPath();
    c.moveTo(cx - rad, cy + rad * 0.16);
    c.bezierCurveTo(cx - rad * 0.3, cy - rad * 0.16, cx + rad * 0.3, cy + rad * 0.38, cx + rad, cy + rad * 0.04);
    c.lineTo(cx + rad, cy + rad);
    c.lineTo(cx - rad, cy + rad);
    c.closePath();
    c.fill();
    c.fillStyle = "#064E46";
    c.beginPath();
    c.moveTo(cx - rad, cy + rad * 0.46);
    c.bezierCurveTo(cx - rad * 0.2, cy + rad * 0.18, cx + rad * 0.4, cy + rad * 0.64, cx + rad, cy + rad * 0.35);
    c.lineTo(cx + rad, cy + rad);
    c.lineTo(cx - rad, cy + rad);
    c.closePath();
    c.fill();
    // 简笔茶叶轮廓
    c.fillStyle = "#F4FBF9";
    c.beginPath();
    c.moveTo(cx - rad * 0.22, cy - rad * 0.04);
    c.quadraticCurveTo(cx + rad * 0.06, cy - rad * 0.42, cx + rad * 0.32, cy - rad * 0.18);
    c.quadraticCurveTo(cx + rad * 0.1, cy + rad * 0.12, cx - rad * 0.22, cy - rad * 0.04);
    c.fill();
  }

  c.restore();
  c.strokeStyle = "rgba(255,255,255,0.92)";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(cx, cy, rad, 0, Math.PI * 2);
  c.stroke();
}

// 缓存文字测量宽度与渐变，避免软件渲染每帧重算
const textWidthCache = new Map();
function measureCached(c, font, text) {
  const key = `${font}|${text}`;
  let w = textWidthCache.get(key);
  if (w === undefined) {
    c.font = font;
    w = c.measureText(text).width;
    textWidthCache.set(key, w);
  }
  return w;
}

// 画带白边的红色可点击诊断浮标，并登记热区
function drawDiagPin(c, x, y, text, faultId, w) {
  c.save();
  const font = '700 12px "Noto Sans SC", sans-serif';
  const tw = measureCached(c, font, text);
  c.font = font;
  const pw = tw + 22;
  const ph = 26;
  const px = clamp(x - pw / 2, 10, w - pw - 10);
  const py = Math.max(10, y - ph / 2);

  c.fillStyle = "#A9241D";
  c.beginPath();
  c.roundRect(px, py, pw, ph, 13);
  c.fill();
  c.strokeStyle = "#FFFFFF";
  c.lineWidth = 1.8;
  c.stroke();

  c.fillStyle = "#FFFFFF";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, px + pw / 2, py + ph / 2 + 0.5);
  c.restore();

  redHotspots.push({ x: px, y: py, w: pw, h: ph, faultId });
}

let gradCache = { key: "", sky: null, ocean: null };

// 主渲染循环（支持开机舒展、沿浪巡游、减少动态效果静态帧）
heroLoop = loop(canvas, (t, dt, { still }) => {
  const w = canvas.clientWidth || 1200;
  const h = canvas.clientHeight || 390;
  const compact = w < 560;
  const dpr = compact ? 1.25 : pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const theme = THEMES[state.theme] || THEMES.poster;
  const ev = evalCache;
  const steps = compact ? 40 : 96;
  const intro = still ? 1 : Math.min(1, 0.55 + t * 0.9); // 首帧即有 55% 完整形态，0.5s 舒展到 100%

  if (state.pulseActive && !still) {
    pulseProgress = (pulseProgress + dt * 0.24) % 1;
  }

  // 轻微海面呼吸漂移（不喧宾夺主，reduced-motion 下完全静止）
  const swellDrift = still ? 0 : Math.sin(t * 1.15) * 2.2;

  ctx.save();
  ctx.scale(dpr, dpr);
  redHotspots = [];
  stationHits = [];

  // 1. 海雾薄荷天光背景（缓存渐变，手机窄屏用纯色提速软件渲染）
  if (compact) {
    ctx.fillStyle = theme.skyTop;
    ctx.fillRect(0, 0, w, h);
  } else {
    const gKey = `${w}x${h}:${theme.id}`;
    if (gradCache.key !== gKey) {
      const sg = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      sg.addColorStop(0, theme.skyTop);
      sg.addColorStop(1, theme.skyBot);
      const og = ctx.createLinearGradient(0, h * 0.55, 0, h);
      og.addColorStop(0, theme.front);
      og.addColorStop(0.72, theme.frontDeep);
      og.addColorStop(1, "#05737F");
      gradCache = { key: gKey, sky: sg, ocean: og };
    }
    ctx.fillStyle = gradCache.sky;
    ctx.fillRect(0, 0, w, h);
  }

  // 2. 远层浅青浪（Layer 1：置于太阳与冲浪者后方，避免吞没冲浪主角）
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const y = (0.45 - state.amplitude * 0.48 * intro * backWaveUnit(u, state, 0)) * h + swellDrift * 0.5;
    i === 0 ? ctx.moveTo(u * w, y) : ctx.lineTo(u * w, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = theme.back1;
  ctx.fill();

  // 上层细虚线引导流（呼应原海报最上方的细虚线）
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const y = (upperY(u, state) - 0.03) * h + swellDrift * 0.4;
    i === 0 ? ctx.moveTo(u * w, y) : ctx.lineTo(u * w, y);
  }
  ctx.strokeStyle = "rgba(4, 104, 111, 0.48)";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([9, 8]);
  ctx.stroke();
  ctx.restore();

  // 3. 暖阳视觉焦点圆与真实冲浪者裁片（高显于远浪之上，沉谷时仅下半浸入中浪，始终清晰见冲浪主角！）
  const fx = ev.focal.u * w;
  const fRad = clamp(Math.min(w * 0.088, h * 0.22), 38, 76);
  const sinkOffset = ev.focal.sunk ? (compact ? 22 : 28) : (compact ? -16 : -22);
  const fyBase = ev.focal.y * h - (compact ? 42 : 52) + sinkOffset;
  const fy = clamp(fyBase + swellDrift * 0.6, fRad + 26, h * 0.46);
  focalHit = { x: fx, y: fy, r: fRad };

  ctx.save();
  if (!ev.focal.ok) {
    ctx.strokeStyle = "#C43228";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(fx, fy, fRad + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = "rgba(253, 202, 51, 0.28)";
    ctx.beginPath();
    ctx.arc(fx, fy, fRad + 11, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(fx, fy);
  ctx.rotate(clamp(ev.focal.slopeRad * 0.32, -0.2, 0.2));
  if (state.theme === "poster" && surfer.ready) {
    ctx.drawImage(surfer.canvas, -fRad, -fRad, fRad * 2, fRad * 2);
  } else {
    drawAlternateFocal(ctx, state.theme, 0, 0, fRad);
  }
  ctx.restore();

  // 4. 中层碧青浪（Layer 2：轻轻托住暖阳冲浪圆底部边缘，复刻原海报水花衔接感）
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const y = (0.58 - state.amplitude * 0.54 * intro * backWaveUnit(u, state, 1)) * h + swellDrift * 0.8;
    i === 0 ? ctx.moveTo(u * w, y) : ctx.lineTo(u * w, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = theme.back2;
  ctx.fill();

  // 中层白虚线海流
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const y = (0.61 - state.amplitude * 0.50 * intro * backWaveUnit(u, state, 1)) * h + swellDrift * 0.8;
    i === 0 ? ctx.moveTo(u * w, y) : ctx.lineTo(u * w, y);
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([9, 8]);
  ctx.stroke();
  ctx.restore();

  // 5. 前景主海浪体（无缝汇入底部 #05737F 深松石海域）
  const ptStride = compact ? 3 : 1;
  ctx.beginPath();
  for (let i = 0; i < ev.pts.length; i += ptStride) {
    const p = ev.pts[i];
    const px = p.u * w;
    const py = (0.73 - (0.73 - p.y) * intro) * h + swellDrift;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  const lastP = ev.pts[ev.pts.length - 1];
  ctx.lineTo(lastP.u * w, (0.73 - (0.73 - lastP.y) * intro) * h + swellDrift);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = compact ? "#05737F" : gradCache.ocean;
  ctx.fill();

  // 6. 原海报标志性粗珍珠白主浪脊线
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < ev.pts.length; i += ptStride) {
    const p = ev.pts[i];
    const px = p.u * w;
    const py = (0.73 - (0.73 - p.y) * intro) * h + swellDrift;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.lineTo(lastP.u * w, (0.73 - (0.73 - lastP.y) * intro) * h + swellDrift);
  ctx.strokeStyle = state.sharpness > LIMITS.sharpness.sweetMax ? "#FFE5DF" : "#FBFFFF";
  ctx.lineWidth = compact ? 6 : 8;
  ctx.lineJoin = state.sharpness > 0.35 ? "miter" : "round";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  // 7. 画出前景波谷处原海报小圆锚点（深海青与暖阳金交替）
  ev.troughs.slice(0, 4).forEach((tr, idx) => {
    const tx = tr.u * w;
    const ty = (0.73 - (0.73 - tr.y) * intro) * h + swellDrift;
    ctx.save();
    ctx.fillStyle = idx % 2 === 0 ? "#03636D" : "#FDCA33";
    ctx.beginPath();
    ctx.arc(tx, ty, compact ? 6 : 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  });

  // 8. 理想波峰幽灵参考环（仅当站点尚未对齐时轻声提示波峰在哪）
  if (!ev.checks.continuityOk) {
    const idealUs = idealCrestStations(state.cycles);
    idealUs.forEach((iu) => {
      const ix = iu * w;
      const iy = (0.73 - (0.73 - frontY(iu, state)) * intro) * h + swellDrift;
      ctx.save();
      ctx.strokeStyle = "rgba(253, 215, 98, 0.72)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(ix, iy, compact ? 19 : 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // 9. 沿浪巡游光脉（顺着前景白浪一直流向暖阳主焦点！）
  if (state.pulseActive && !still) {
    const pIdx = Math.min(ev.pts.length - 1, Math.floor(pulseProgress * ev.pts.length));
    const pp = ev.pts[pIdx];
    const px = pp.u * w;
    const py = (0.73 - (0.73 - pp.y) * intro) * h + swellDrift;
    ctx.save();
    ctx.fillStyle = "rgba(253, 202, 51, 0.35)";
    ctx.beginPath();
    ctx.arc(px, py, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FDCA33";
    ctx.beginPath();
    ctx.arc(px, py, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#001947";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // 10. 三枚可拖动白色波峰圆徽（严格等比正圆，复刻原海报三枚圆形图标站点）
  const stR = compact ? 21 : 27;
  ev.stations.forEach((st, idx) => {
    const sx = st.u * w;
    const sy = (0.73 - (0.73 - st.y) * intro) * h + swellDrift;
    const meta = theme.stations[idx];
    const onCrest = st.w >= LIMITS.stationCrestFloor;
    const active = (dragMode && dragMode.kind === "station" && dragMode.idx === idx) || hoverTarget === `st-${idx}`;

    stationHits.push({ idx, x: sx, y: sy, r: stR + 8 });

    ctx.save();
    // 阴影
    ctx.fillStyle = "rgba(0, 25, 71, 0.16)";
    ctx.beginPath();
    ctx.arc(sx, sy + 4, stR + 2, 0, Math.PI * 2);
    ctx.fill();

    // 外圈珍珠环
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(sx, sy, stR + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = active ? "#FFF9DF" : "#F3FAF9";
    ctx.beginPath();
    ctx.arc(sx, sy, stR - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = onCrest ? "#04686F" : "#C43228";
    ctx.lineWidth = active ? 3 : 2.2;
    ctx.stroke();

    drawStationGlyph(ctx, meta.icon, sx, sy, stR * 0.72, onCrest ? "#04686F" : "#A9241D");

    // 紧贴圆徽下方的迷你胶囊标（带深海青背板，绝不与波谷圆点或浪线混叠）
    const lblFont = compact ? '700 10.5px "Noto Sans SC", sans-serif' : '700 12px "Noto Sans SC", sans-serif';
    const labelW = measureCached(ctx, lblFont, meta.zh) + 14;
    ctx.font = lblFont;
    const labelH = compact ? 18 : 20;
    const lyTag = Math.min(h - labelH - 4, sy + stR + 6);
    ctx.fillStyle = "rgba(3, 56, 66, 0.86)";
    ctx.beginPath();
    ctx.roundRect(sx - labelW / 2, lyTag, labelW, labelH, 9);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(meta.zh, sx, lyTag + labelH / 2 + 0.5);
    ctx.restore();
  });

  // 10b. 原海报右侧「视觉焦点」虚线引注（放在所有波浪层之上，绝不被浪脊遮挡）
  if (!compact) {
    const labelRight = fx < w * 0.78;
    const lx = labelRight ? fx + fRad + 16 : fx - fRad - 98;
    const ly = Math.max(20, fy - fRad * 0.34);
    ctx.save();
    ctx.strokeStyle = "#001947";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(labelRight ? fx + fRad + 2 : fx - fRad - 2, ly + 10);
    ctx.lineTo(labelRight ? lx - 4 : lx + 82, ly + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(234, 249, 245, 0.88)";
    ctx.beginPath();
    ctx.roundRect(lx - 6, ly - 8, 92, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#001947";
    ctx.font = '900 12.5px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("视觉焦点", lx, ly + 5);
    ctx.fillStyle = "#04686F";
    ctx.font = '700 10px "Syne", sans-serif';
    ctx.fillText("FOCAL POINT", lx, ly + 19);
    ctx.restore();
  }

  // 11. 左上角轻量实况角签（高对比白底深海蓝字，绝不遮挡画面中心）
  ctx.save();
  const hudText = `${ev.metrics.cycles.toFixed(1)} 波 · 波幅 ${ev.metrics.amplitudePct}% · 转向 ${ev.metrics.maxTurnDeg}°`;
  const hudFont = '600 11.5px "JetBrains Mono", "Noto Sans SC", monospace';
  const hw = measureCached(ctx, hudFont, hudText) + 20;
  ctx.font = hudFont;
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.beginPath();
  ctx.roundRect(14, 12, hw, 26, 13);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 25, 71, 0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#001947";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(hudText, 24, 25.5);
  ctx.restore();

  // 12. 错态就地红色可点浮标（最多展示 2 枚，避开画布中心点让 perf 横拖顺畅）
  if (ev.faults.length > 0) {
    const f0 = ev.faults[0];
    if (f0.id === "sharp" || f0.id === "ampSteep" || f0.id === "ampFlat") {
      drawDiagPin(ctx, w * 0.24, h * 0.28, `× ${f0.badge} · 点此抚平`, f0.id, w);
    } else if (f0.id === "freqHigh" || f0.id === "freqLow") {
      drawDiagPin(ctx, w * 0.25, h * 0.28, `× ${f0.badge} · 点此调拍`, f0.id, w);
    } else if (f0.id === "stations") {
      drawDiagPin(ctx, clamp(ev.stations[1].u * w, 90, w - 90), h * 0.52, `× ${f0.badge} · 点此落峰`, f0.id, w);
    } else if (f0.id === "phase") {
      drawDiagPin(ctx, w * 0.26, h * 0.45, `× ${f0.badge} · 点此同频`, f0.id, w);
    }

    const focalFault = ev.faults.find((f) => f.id === "focal");
    if (focalFault) {
      drawDiagPin(ctx, clamp(fx, 86, w - 86), Math.max(24, fy - fRad - 16), `× ${focalFault.badge} · 点此乘峰`, "focal", w);
    } else if (ev.faults.length > 1 && ev.faults[1].id === "stations") {
      const sMid = ev.stations[0].u * w;
      drawDiagPin(ctx, clamp(sMid, 92, w - 92), Math.max(28, frontY(ev.stations[0].u, state) * h - stR - 22), "× 站点脱峰 · 点此落峰", "stations", w);
    }
  }

  ctx.restore();
});

// ==================== 画布指针、触控与键盘交互 ====================
function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width || 1, h: rect.height || 1 };
}

canvas.addEventListener("pointerdown", (e) => {
  const { x, y, w } = canvasPos(e);

  // 1. 优先命中红色纠错浮标
  for (const hp of redHotspots) {
    if (x >= hp.x && x <= hp.x + hp.w && y >= hp.y && y <= hp.y + hp.h) {
      const fault = evalCache.faults.find((f) => f.id === hp.faultId);
      if (fault) setState(fault.fix(state));
      return;
    }
  }

  // 2. 命中三枚白色波峰站点圆徽
  for (const st of stationHits) {
    if (Math.hypot(x - st.x, y - st.y) <= st.r) {
      dragMode = { kind: "station", idx: st.idx };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }

  // 3. 命中金色太阳主焦点
  if (Math.hypot(x - focalHit.x, y - focalHit.y) <= focalHit.r + 6) {
    dragMode = { kind: "focal" };
    canvas.setPointerCapture(e.pointerId);
    return;
  }

  // 4. 其余海面空白处：左右横拖直接拉伸/压缩波长周期（也是 perf.mjs data-perf-drag 测量的主交互）
  dragMode = { kind: "wave", startX: x, startCycles: state.cycles, width: w };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  const { x, y, w } = canvasPos(e);
  if (!dragMode) {
    let hit = null;
    for (const st of stationHits) {
      if (Math.hypot(x - st.x, y - st.y) <= st.r) hit = `st-${st.idx}`;
    }
    if (!hit && Math.hypot(x - focalHit.x, y - focalHit.y) <= focalHit.r + 6) hit = "focal";
    if (hit !== hoverTarget) {
      hoverTarget = hit;
      heroLoop.draw();
    }
    return;
  }

  if (dragMode.kind === "wave") {
    const du = (x - dragMode.startX) / Math.max(200, dragMode.width);
    const nextCycles = clamp(Number((dragMode.startCycles + du * 4.2).toFixed(2)), LIMITS.cycles.min, LIMITS.cycles.max);
    if (nextCycles !== state.cycles) setState({ cycles: nextCycles }, true);
  } else if (dragMode.kind === "station") {
    let nextU = clamp(x / w, 0.08, 0.92);
    // 靠近理想波峰轻吸附，但不锁死用户探索
    for (const targetU of idealCrestStations(state.cycles)) {
      if (Math.abs(nextU - targetU) < 0.024) {
        nextU = targetU;
        break;
      }
    }
    const nextStations = [...state.stations];
    nextStations[dragMode.idx] = Number(nextU.toFixed(3));
    setState({ stations: nextStations }, true);
  } else if (dragMode.kind === "focal") {
    let nextU = clamp(x / w, 0.08, 0.92);
    const snapU = nearestUpperCrest(nextU, state.cycles);
    if (Math.abs(nextU - snapU) < 0.028) nextU = snapU;
    setState({ focalU: Number(nextU.toFixed(3)) }, true);
  }
});

const stopDrag = () => {
  dragMode = null;
};
canvas.addEventListener("pointerup", stopDrag);
canvas.addEventListener("pointercancel", stopDrag);

// 键盘操作：←/→ 调周期，↑/↓ 调波幅，Space 启停沿浪巡游
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setState({ cycles: clamp(Number((state.cycles - 0.15).toFixed(2)), LIMITS.cycles.min, LIMITS.cycles.max) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setState({ cycles: clamp(Number((state.cycles + 0.15).toFixed(2)), LIMITS.cycles.min, LIMITS.cycles.max) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setState({ amplitude: clamp(Number((state.amplitude + 0.015).toFixed(3)), LIMITS.amplitude.min, LIMITS.amplitude.max) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setState({ amplitude: clamp(Number((state.amplitude - 0.015).toFixed(3)), LIMITS.amplitude.min, LIMITS.amplitude.max) });
  } else if (e.key === " ") {
    e.preventDefault();
    setState({ pulseActive: !state.pulseActive });
  }
});

// 控件事件绑定
slCycles.addEventListener("input", () => setState({ cycles: Number(slCycles.value) }));
slAmp.addEventListener("input", () => setState({ amplitude: Number(slAmp.value) }));
slSharp.addEventListener("input", () => setState({ sharpness: Number(slSharp.value) }));
slPhase.addEventListener("input", () => setState({ phaseShift: Number(slPhase.value) }));

themeBtns.forEach((b) => b.addEventListener("click", () => setState({ theme: b.dataset.theme })));
pulseBtn.addEventListener("click", () => setState({ pulseActive: !state.pulseActive }));

btnFixStep.addEventListener("click", () => {
  const first = evalCache.faults[0];
  if (first) setState(first.fix(state));
});

// 点击三大原海报黄金支柱胶囊：若该项未过关则单项校准，已过关则轻触巡游
pillarSoft.addEventListener("click", () => {
  if (!evalCache.checks.softOk) setState({ amplitude: 0.145, sharpness: 0.04 });
  else setState({ pulseActive: true });
});
pillarRhythm.addEventListener("click", () => {
  if (!evalCache.checks.rhythmOk || state.phaseShift > LIMITS.phaseShift.sweetMax) {
    setState({ cycles: 2.85, phaseShift: 0.06 });
  } else setState({ pulseActive: true });
});
pillarGuidance.addEventListener("click", () => {
  if (!evalCache.checks.continuityOk || !evalCache.checks.guidanceOk) {
    setState({
      stations: idealCrestStations(state.cycles),
      focalU: nearestUpperCrest(0.72, state.cycles),
      phaseShift: Math.min(state.phaseShift, 0.08),
    });
  } else setState({ pulseActive: true });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    setState({ ...p.values, stations: [...p.values.stations] });
  });
});

// 初始化首屏与全部 7 个章节模块
syncUI();
heroLoop.draw();
initAnatomy();
initSpectrum();
initAssociationLab();
initLineage();
initUseAvoid();
initPractice();
initPosterLightbox();
