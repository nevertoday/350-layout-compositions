// 305 过肩构图 · 主交互编排（Hero 双机位切镜台 + 01–07 全节互动 + 原海报灯箱）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ANGLE_PRESETS,
  BAD_START,
  CLASSIC_GOOD,
  POSTER_POINTS,
  clamp,
  lerp,
  matchPresetId,
} from "./model.js";
import {
  renderFloorplan,
  renderOTSFrame,
  renderWipeCompare,
} from "./renderer.js";

// ==================== 工具：安全缩放高清 2D Canvas（手机端按 GUIDE 上限 1.5 控像素量） ====================
function sizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const maxDpr = window.innerWidth <= 680 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ==================== 1. HERO 双机位过肩取景与正反打切镜台 ====================
const heroCanvas = document.getElementById("hero-canvas");
const slOffset = document.getElementById("sl-offset");
const slElev = document.getElementById("sl-elev");
const slFstop = document.getElementById("sl-fstop");
const slFocal = document.getElementById("sl-focal");

const targetState = { ...BAD_START };
const liveState = { ...BAD_START };
const activeLayers = { frame: true, depth: false, axis: false, gaze: true, corners: true };
let cutFlash = 0;
let dirtyHero = true;
let lastEvalKey = "";

// 复用单块离屏画布渲染静态缩略图，省下 10 块独立 GPU 后备缓存并加速整页性能测试
const thumbScratch = document.createElement("canvas");
function renderThumbUrl(state, opts, w = 360, h = 270) {
  if (thumbScratch.width !== w || thumbScratch.height !== h) {
    thumbScratch.width = w;
    thumbScratch.height = h;
  }
  const ctx = thumbScratch.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  renderOTSFrame(ctx, w, h, state, opts);
  return thumbScratch.toDataURL("image/png");
}

// 生成原海报 6 格「过肩角度参考」与 5 枚青柠圆环探针
const angleStripEl = document.getElementById("angle-strip");
const angleCards = [];
for (const preset of ANGLE_PRESETS) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "angle-card";
  btn.dataset.preset = preset.id;
  btn.title = preset.note;
  btn.innerHTML = `<img class="angle-thumb" alt="" draggable="false"><span class="angle-card-zh">${preset.zh}</span><span class="angle-card-en" lang="en">${preset.en}</span>`;
  angleStripEl.append(btn);
  angleCards.push({ preset, btn, img: btn.querySelector("img") });
}

const PROBE_ICONS = {
  frame: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`,
  depth: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 21 8.5 12 14 3 8.5"/><polyline points="3 13.5 12 19 21 13.5"/></svg>`,
  conversation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  gaze: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="18" x2="18" y2="6"/><polyline points="9 6 18 6 18 15"/></svg>`,
  immersion: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>`,
};

const probesStripEl = document.getElementById("probes-strip");
const probeRefs = {};
for (const p of POSTER_POINTS) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "probe-btn";
  btn.dataset.layer = p.layer;
  btn.setAttribute("aria-pressed", String(Boolean(activeLayers[p.layer])));
  if (activeLayers[p.layer]) btn.classList.add("is-layer-on");
  btn.innerHTML = `
    <span class="probe-ring" aria-hidden="true">${PROBE_ICONS[p.id]}</span>
    <span class="probe-info">
      <span class="probe-top">
        <span class="probe-name">${p.title}</span>
        <span class="probe-status" id="probe-st-${p.id}">—</span>
      </span>
      <span class="probe-en" lang="en">${p.en}</span>
    </span>`;
  btn.addEventListener("click", () => {
    activeLayers[p.layer] = !activeLayers[p.layer];
    btn.classList.toggle("is-layer-on", activeLayers[p.layer]);
    btn.setAttribute("aria-pressed", String(activeLayers[p.layer]));
    dirtyHero = true;
    heroLoop.draw();
  });
  probesStripEl.append(btn);
  probeRefs[p.id] = { btn, statusEl: btn.querySelector(`#probe-st-${p.id}`) };
}

function renderAngleThumbs() {
  for (const item of angleCards) {
    item.img.src = renderThumbUrl(
      { ...item.preset.params, scene: targetState.scene },
      { compact: true, clean: true, still: true },
      320,
      240
    );
  }
}

function syncHeroUI(evalData) {
  // 滑块与标签数值同步
  slOffset.value = String(targetState.offset.toFixed(2));
  slElev.value = String(targetState.elev.toFixed(2));
  slFstop.value = String(targetState.fStop.toFixed(1));
  slFocal.value = String(Math.round(targetState.focalMm));

  document.getElementById("lbl-offset").textContent =
    evalData.faceOverlapPct > 1
      ? `遮脸 ${evalData.faceOverlapPct}%`
      : evalData.shoulderPct < 10
      ? `脱框 ${evalData.shoulderPct}%`
      : `肩占 ${evalData.shoulderPct}%`;
  document.getElementById("lbl-elev").textContent =
    targetState.elev > 0.18
      ? `高位 +${Math.round(targetState.elev * 45)}°`
      : targetState.elev < -0.18
      ? `低位 ${Math.round(targetState.elev * 45)}°`
      : "平视 0°";
  document.getElementById("lbl-fstop").textContent = `f/${targetState.fStop.toFixed(1)}`;
  document.getElementById("lbl-focal").textContent = `${Math.round(targetState.focalMm)}mm`;

  // 顶部与画布底栏读数
  const camStr = targetState.cam === "A" ? "CAM A (左肩)" : (targetState.axisValid ? "CAM B (右肩)" : "CAM B (越轴!)");
  document.getElementById("vf-cam-readout").textContent = `${camStr} · ${Math.round(targetState.focalMm)}MM · f/${targetState.fStop.toFixed(1)}`;
  document.getElementById("cut-label").textContent = targetState.cam === "A" ? "当前正打 A · 切反打 B" : "当前反打 B · 切正打 A";
  document.getElementById("btn-cut-inline").textContent = targetState.cam === "A" ? "切到反打 B 验轴" : "切回正打 A 验轴";

  const tally = document.getElementById("hero-tally");
  tally.textContent = evalData.badge;
  tally.classList.toggle("is-ok", evalData.tone === "ok");
  tally.classList.toggle("is-bad", evalData.tone !== "ok");

  // 仅在状态文本真正变化时更新诊断卡 DOM，避免拖动时无意义 DOM 抖动
  const evalKey = `${evalData.badge}|${evalData.shoulderPct}|${evalData.faceOverlapPct}|${evalData.checks.depthOk}|${evalData.checks.axisOk}|${targetState.cam}|${targetState.axisValid}`;
  if (evalKey !== lastEvalKey) {
    lastEvalKey = evalKey;
    const card = document.getElementById("verdict-card");
    card.classList.toggle("is-ok", evalData.tone === "ok");
    card.classList.toggle("is-bad", evalData.tone !== "ok");
    document.getElementById("verdict-tag").textContent = evalData.badge;
    document.getElementById("verdict-title").textContent = evalData.headline;
    document.getElementById("verdict-reason").textContent = evalData.reason;
    document.getElementById("verdict-action").textContent = evalData.action;

    const elSh = document.getElementById("val-shoulder");
    elSh.textContent = `${evalData.shoulderPct}%`;
    elSh.className = `mono ${evalData.checks.frameOk ? "is-ok" : "is-bad"}`;

    const elOv = document.getElementById("val-overlap");
    elOv.textContent = evalData.faceOverlapPct > 1 ? `遮挡 ${evalData.faceOverlapPct}%` : `零遮挡 · 净空 ${Math.max(0, evalData.lookGapPct)}%`;
    elOv.className = `mono ${evalData.checks.clearanceOk ? "is-ok" : "is-bad"}`;

    const elBl = document.getElementById("val-blur");
    elBl.textContent = evalData.checks.depthOk
      ? `f/${targetState.fStop.toFixed(1)} · 柔焦`
      : `f/${targetState.fStop.toFixed(1)} · 过锐`;
    elBl.className = `mono ${evalData.checks.depthOk ? "is-ok" : "is-bad"}`;

    const elAx = document.getElementById("val-axis");
    elAx.textContent = targetState.axisValid ? "180° 同侧守轴" : "反打已越轴";
    elAx.className = `mono ${targetState.axisValid ? "is-ok" : "is-bad"}`;

    // 轴线按钮高亮
    document.getElementById("btn-axis-ok").classList.toggle("is-ok-on", targetState.axisValid);
    document.getElementById("btn-axis-cross").classList.toggle("is-bad-on", !targetState.axisValid);

    // 5 枚原则探针同步
    for (const [id, data] of Object.entries(evalData.probes)) {
      const ref = probeRefs[id];
      if (!ref) continue;
      ref.statusEl.textContent = data.tag;
      ref.btn.classList.toggle("is-bad", !data.ok);
    }

    // 6 格角度条选中态同步
    const matched = matchPresetId(targetState);
    for (const item of angleCards) {
      item.btn.classList.toggle("is-active", item.preset.id === matched);
    }
  }
}

function applyTarget(patch, { instant = false, flash = false, defer = false } = {}) {
  Object.assign(targetState, patch);
  if (instant || reducedMotion.matches) {
    Object.assign(liveState, targetState);
  }
  if (flash && !reducedMotion.matches) cutFlash = 0.9;
  dirtyHero = true;
  if (!defer || reducedMotion.matches) heroLoop.draw();
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const ease = still || dt === 0 ? 1 : 1 - Math.exp(-dt * 12);
  let moving = false;

  for (const k of ["offset", "elev", "focalMm", "fStop"]) {
    const diff = targetState[k] - liveState[k];
    if (Math.abs(diff) > 0.0008) {
      liveState[k] = still ? targetState[k] : lerp(liveState[k], targetState[k], ease);
      moving = true;
    } else {
      liveState[k] = targetState[k];
    }
  }
  liveState.cam = targetState.cam;
  liveState.axisValid = targetState.axisValid;
  liveState.scene = targetState.scene;

  if (cutFlash > 0.01) {
    cutFlash = still ? 0 : Math.max(0, cutFlash - dt * 6.5);
    moving = true;
  }

  // 为了性能与清晰度，只在参数变化、切镜闪烁或初次帧时重绘（拖动时每帧都会设置 dirtyHero）
  if (!dirtyHero && !moving && dt > 0) return;
  dirtyHero = false;

  const { ctx, w, h } = sizeCanvas(heroCanvas);
  const evalData = renderOTSFrame(ctx, w, h, liveState, {
    layers: activeLayers,
    showGuideLabels: activeLayers.depth,
    showHud: true,
    cutFlash,
    pulse: still ? 0 : t,
    still,
  });
  syncHeroUI(evalData);
});

// Hero 指针拖动交互（触摸只拦横向拖动保证页面上下顺滑滚动；鼠标支持横纵双向拖机位）
let dragInfo = null;
heroCanvas.addEventListener("pointerdown", (e) => {
  dragInfo = {
    id: e.pointerId,
    type: e.pointerType,
    startX: e.clientX,
    startY: e.clientY,
    startOffset: targetState.offset,
    startElev: targetState.elev,
    locked: e.pointerType !== "touch",
  };
  if (dragInfo.locked) heroCanvas.setPointerCapture(e.pointerId);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || e.pointerId !== dragInfo.id) return;
  const dx = e.clientX - dragInfo.startX;
  const dy = e.clientY - dragInfo.startY;
  if (!dragInfo.locked) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    if (Math.abs(dy) > Math.abs(dx) * 1.15) {
      dragInfo = null; // 交给浏览器竖向滚动
      return;
    }
    dragInfo.locked = true;
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  }
  const rect = heroCanvas.getBoundingClientRect();
  const sideSign = targetState.cam === "B" && targetState.axisValid ? -1 : 1;
  const nextOffset = clamp(dragInfo.startOffset + (dx / Math.max(180, rect.width)) * 1.15 * sideSign, -0.22, 0.94);
  const patch = { offset: nextOffset };
  if (dragInfo.type !== "touch") {
    patch.elev = clamp(dragInfo.startElev - (dy / Math.max(160, rect.height)) * 0.95, -0.44, 0.48);
  }
  applyTarget(patch, { instant: true, defer: true });
});

const endDrag = (e) => {
  if (dragInfo && e.pointerId === dragInfo.id) dragInfo = null;
};
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

  // 兼容纯 Touch 事件（包括 perf.mjs 派发的原生 touchStart/touchMove，交由 rAF 合并为每帧一次重绘）
let touchDrag = null;
heroCanvas.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  const t0 = e.touches[0];
  touchDrag = { startX: t0.clientX, startOffset: targetState.offset };
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!touchDrag || !e.touches.length) return;
  const t0 = e.touches[0];
  const dx = t0.clientX - touchDrag.startX;
  const rect = heroCanvas.getBoundingClientRect();
  const sideSign = targetState.cam === "B" && targetState.axisValid ? -1 : 1;
  const nextOffset = clamp(touchDrag.startOffset + (dx / Math.max(180, rect.width)) * 1.15 * sideSign, -0.22, 0.94);
  applyTarget({ offset: nextOffset }, { instant: true, defer: true });
}, { passive: true });

heroCanvas.addEventListener("touchend", () => { touchDrag = null; }, { passive: true });

// 滑块事件
slOffset.addEventListener("input", () => applyTarget({ offset: parseFloat(slOffset.value) }, { instant: true }));
slElev.addEventListener("input", () => applyTarget({ elev: parseFloat(slElev.value) }, { instant: true }));
slFstop.addEventListener("input", () => applyTarget({ fStop: parseFloat(slFstop.value) }, { instant: true }));
slFocal.addEventListener("input", () => applyTarget({ focalMm: parseFloat(slFocal.value) }, { instant: true }));

// 切镜 A ⇄ B
function toggleCut() {
  const nextCam = targetState.cam === "A" ? "B" : "A";
  applyTarget({ cam: nextCam }, { instant: true, flash: true });
}
document.getElementById("btn-cut").addEventListener("click", toggleCut);
document.getElementById("btn-cut-inline").addEventListener("click", toggleCut);

// 一键摆正 / 复原错态 / 轴线开关 / 双向试错
document.getElementById("btn-fix").addEventListener("click", () => applyTarget({ ...CLASSIC_GOOD }));
document.getElementById("btn-reset").addEventListener("click", () => applyTarget({ ...BAD_START, scene: targetState.scene }));
document.getElementById("btn-axis-ok").addEventListener("click", () => applyTarget({ axisValid: true }, { instant: true }));
document.getElementById("btn-axis-cross").addEventListener("click", () => applyTarget({ axisValid: false }, { instant: true }));

document.querySelectorAll("[data-test]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.test === "missing") {
      applyTarget({ cam: "A", offset: 0.84, elev: 0.02, focalMm: 54, fStop: 2.0, axisValid: true });
    } else if (btn.dataset.test === "sharp") {
      applyTarget({ cam: "A", offset: 0.35, elev: 0.02, focalMm: 46, fStop: 14, axisValid: true });
    }
  });
});

// 场景切换（同步更新主画布 + 6 格胶片缩略图）
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-scene]").forEach((b) => b.classList.toggle("is-active", b === btn));
    applyTarget({ scene: btn.dataset.scene }, { instant: true });
    renderAngleThumbs();
  });
});

// 6 格角度预设点击
for (const item of angleCards) {
  item.btn.addEventListener("click", () => {
    applyTarget({ ...item.preset.params, scene: targetState.scene }, { flash: item.preset.params.cam !== targetState.cam });
  });
}

// 键盘操作：方向键调机位、空格切镜 A⇄B（输入焦点不在按钮或灯箱内时生效）
window.addEventListener("keydown", (e) => {
  if (!document.getElementById("lightbox").hidden) return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.code === "Space" && tag !== "BUTTON") {
    e.preventDefault();
    toggleCut();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    applyTarget({ offset: clamp(targetState.offset + 0.04, -0.22, 0.94) }, { instant: true });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    applyTarget({ offset: clamp(targetState.offset - 0.04, -0.22, 0.94) }, { instant: true });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    applyTarget({ elev: clamp(targetState.elev + 0.05, -0.44, 0.48) }, { instant: true });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    applyTarget({ elev: clamp(targetState.elev - 0.05, -0.44, 0.48) }, { instant: true });
  }
});

// ==================== 2. SECTION 01 · 横向对比刮板 ====================
const wipeCanvas = document.getElementById("wipe-canvas");
const slWipe = document.getElementById("sl-wipe");
const lblWipe = document.getElementById("lbl-wipe");
const wipeCaption = document.getElementById("wipe-caption");
let wipeMode = "single-vs-ots";
let wipePos = 0.5;

const WIPE_MODES = {
  "single-vs-ots": {
    left: { cam: "A", offset: 0.94, elev: 0.02, focalMm: 56, fStop: 2.0, axisValid: true, scene: "cafe" },
    right: { cam: "A", offset: 0.36, elev: 0.02, focalMm: 56, fStop: 2.0, axisValid: true, scene: "cafe" },
    leftTag: "无肩 · 净单人",
    rightTag: "305 · 标准过肩",
    caption: `同样一张咖啡馆人物特写，加上左侧虚化肩影后，观众不再是真空里的旁观者，而是立刻站进听话者身后的真实空间；如果彻底去掉前景肩，则属于 <a href="https://layout.xiaoxiaodong.ai/308/play/">308 净单人镜头</a> 的孤立表达。`,
  },
  "ots-vs-blocked": {
    left: { cam: "A", offset: 0.36, elev: 0.02, focalMm: 56, fStop: 2.0, axisValid: true, scene: "cafe" },
    right: { cam: "A", offset: -0.14, elev: 0.02, focalMm: 56, fStop: 11, axisValid: true, scene: "cafe" },
    leftTag: "305 · 避脸柔焦",
    rightTag: "错态 · 遮脸过锐",
    caption: `对比左右两侧可以立刻看见：前景肩只要多往里切几寸、光圈再收小几档，就会把说话者表情盖住，并让前景硬边与主体抢焦点。`,
  },
};

function drawWipe() {
  const cfg = WIPE_MODES[wipeMode];
  const { ctx, w, h } = sizeCanvas(wipeCanvas);
  renderWipeCompare(ctx, w, h, wipePos, cfg.left, cfg.right, cfg.leftTag, cfg.rightTag);
  lblWipe.textContent = `${Math.round(wipePos * 100)}%`;
}

document.querySelectorAll("[data-wipe]").forEach((btn) => {
  btn.addEventListener("click", () => {
    wipeMode = btn.dataset.wipe;
    document.querySelectorAll("[data-wipe]").forEach((b) => b.classList.toggle("is-active", b === btn));
    wipeCaption.innerHTML = WIPE_MODES[wipeMode].caption;
    drawWipe();
  });
});

slWipe.addEventListener("input", () => {
  wipePos = parseFloat(slWipe.value) / 100;
  drawWipe();
});

let wipeDrag = false;
const setWipeFromClientX = (clientX) => {
  const r = wipeCanvas.getBoundingClientRect();
  wipePos = clamp((clientX - r.left) / Math.max(1, r.width), 0.1, 0.9);
  slWipe.value = String(Math.round(wipePos * 100));
  drawWipe();
};
wipeCanvas.addEventListener("pointerdown", (e) => {
  wipeDrag = true;
  wipeCanvas.setPointerCapture(e.pointerId);
  setWipeFromClientX(e.clientX);
});
wipeCanvas.addEventListener("pointermove", (e) => { if (wipeDrag) setWipeFromClientX(e.clientX); });
wipeCanvas.addEventListener("pointerup", () => { wipeDrag = false; });
wipeCanvas.addEventListener("pointercancel", () => { wipeDrag = false; });

// ==================== 3. SECTION 02 · 历史四阶段节点卡 ====================
const ERAS = [
  {
    kicker: "1911–1917 · CONTINUITY SYSTEM",
    heading: "从「舞台正面拍全员」走向「180° 轴线与正反打」",
    body: "电影史学者 Barry Salt 在 1983 年的《Film Style and Technology》中，以及 David Bordwell、Janet Staiger 与 Kristin Thompson 在 1985 年的《The Classical Hollywood Cinema》里共同考证：1911 年的西部短片《The Loafer》等早期默片开始用双视线匹配与反打拆分对话；到约 1917 年，包括过肩取景与 180° 轴线在内的经典好莱坞连贯剪辑体系已在主流叙事片中固定下来。",
    cite: "出处核实：Barry Salt (1983)《Film Style and Technology》；David Bordwell, Janet Staiger & Kristin Thompson (1985)《The Classical Hollywood Cinema》。",
    svg: `<svg viewBox="0 0 280 150" fill="none"><rect width="280" height="150" fill="#141511"/><line x1="24" y1="68" x2="256" y2="68" stroke="#B0D229" stroke-dasharray="5 4" stroke-width="1.5"/><circle cx="88" cy="68" r="11" fill="#EFE2C5"/><circle cx="192" cy="68" r="11" fill="#EFE2C5"/><path d="M52 122 L192 68" stroke="#B0D229" stroke-width="1.5"/><path d="M228 122 L88 68" stroke="#B0D229" stroke-width="1.5"/><rect x="40" y="114" width="22" height="14" fill="#B0D229"/><rect x="218" y="114" width="22" height="14" fill="#B0D229"/><text x="140" y="24" text-anchor="middle" fill="#BDB39B" font-size="11" font-family="Space Mono, monospace">180° AXIS · SHOT / REVERSE</text><text x="51" y="142" text-anchor="middle" fill="#EFE2C5" font-size="10" font-family="Space Mono, monospace">CAM A</text><text x="229" y="142" text-anchor="middle" fill="#EFE2C5" font-size="10" font-family="Space Mono, monospace">CAM B</text></svg>`,
  },
  {
    kicker: "1930s–1950s · CLASSICAL SOUND DIALOGUE",
    heading: "有声片对话暴增：让背影留在框内稳住地理关系",
    body: "有声片普及后，大段室内台词取代了默片字幕卡。导演不再需要频繁切回全景提醒观众谁坐在哪边——把听话者暗部肩头留在前景，就能在紧密对话正反打里持续维持双人空间关系，同时把视觉焦点稳稳送给说话者。",
    cite: "出处核实：David Bordwell & Kristin Thompson (1979)《Film Art: An Introduction》连续性剪辑章节。",
    svg: `<svg viewBox="0 0 280 150" fill="none"><rect width="280" height="150" fill="#141511"/><rect x="26" y="20" width="228" height="110" stroke="#4A5231" stroke-width="1.5"/><path d="M26 130 L26 42 Q76 34 86 78 Q128 96 146 130 Z" fill="#0A0B09" stroke="#B0D229" stroke-width="2"/><circle cx="192" cy="64" r="16" fill="#EFE2C5"/><path d="M164 130 Q168 88 192 88 Q216 88 220 130 Z" fill="#EFE2C5"/><line x1="94" y1="66" x2="176" y2="64" stroke="#B0D229" stroke-dasharray="4 4" stroke-width="1.5"/><circle cx="186" cy="64" r="3.5" fill="#B0D229"/></svg>`,
  },
  {
    kicker: "1991–1998 · DIRECTORIAL GRAMMAR",
    heading: "A/B/C 三角机位图：把过肩写进片场教材文法",
    body: "Steven D. Katz 在 1991 年出版的《Film Directing Shot by Shot》里用经典的三角机位系统，把过肩镜头拆解为串联双人全景与单人特写的标准桥梁；Roy Thompson 在 1998 年首版的《Grammar of the Shot》（后续版本与 Christopher J. Bowen 合著）中则将过肩明确归入双人构图语法，归纳其前景遮挡与视线引导作用。",
    cite: "出处核实：Steven D. Katz (1991)《Film Directing Shot by Shot》；Roy Thompson (1998)《Grammar of the Shot》。",
    svg: `<svg viewBox="0 0 280 150" fill="none"><rect width="280" height="150" fill="#141511"/><polygon points="140,126 56,82 224,82" stroke="#B0D229" stroke-width="1.5" fill="rgba(176,210,41,0.08)"/><circle cx="96" cy="52" r="10" fill="#EFE2C5"/><circle cx="184" cy="52" r="10" fill="#EFE2C5"/><circle cx="140" cy="126" r="6" fill="#EFE2C5"/><circle cx="56" cy="82" r="6" fill="#B0D229"/><circle cx="224" cy="82" r="6" fill="#B0D229"/><text x="140" y="143" text-anchor="middle" fill="#BDB39B" font-size="10" font-family="Space Mono, monospace">MASTER</text><text x="44" y="72" text-anchor="middle" fill="#B0D229" font-size="10" font-family="Space Mono, monospace">OTS A</text><text x="236" y="72" text-anchor="middle" fill="#B0D229" font-size="10" font-family="Space Mono, monospace">OTS B</text></svg>`,
  },
  {
    kicker: "2010–PRESENT · LENS & BREAKING RULES",
    heading: "强化连贯性：在宽松过肩与紧逼单人间切换心理距",
    body: "Gustavo Mercado 在 2010/2011 年《The Filmmaker's Eye》中指出，当代影视很少只靠单一过肩拍完整场戏，而是常以较宽松的过肩确立二人位置，再随情绪升温把机位越过肩线推成紧逼单人，或反过来用长焦压缩拉近前景肩与主体的心理压迫感。",
    cite: "出处核实：Gustavo Mercado (2010/2011)《The Filmmaker's Eye》；David Bordwell 关于「强化连贯性」的系列论述。",
    svg: `<svg viewBox="0 0 280 150" fill="none"><rect width="280" height="150" fill="#141511"/><rect x="20" y="28" width="110" height="94" stroke="#4A5231"/><path d="M20 122 L20 62 Q48 64 60 122 Z" fill="#2A2E20" stroke="#B0D229"/><circle cx="96" cy="68" r="11" fill="#EFE2C5"/><text x="75" y="138" text-anchor="middle" fill="#BDB39B" font-size="10" font-family="Space Mono, monospace">35MM · 松</text><rect x="150" y="28" width="110" height="94" stroke="#B0D229"/><path d="M150 122 L150 48 Q186 58 198 122 Z" fill="#2A2E20" stroke="#B0D229" stroke-width="2"/><circle cx="222" cy="66" r="16" fill="#EFE2C5"/><text x="205" y="138" text-anchor="middle" fill="#B0D229" font-size="10" font-family="Space Mono, monospace">85MM · 贴</text></svg>`,
  },
];

function renderEra(idx) {
  const era = ERAS[idx];
  document.getElementById("era-kicker").textContent = era.kicker;
  document.getElementById("era-heading").textContent = era.heading;
  document.getElementById("era-body").textContent = era.body;
  document.getElementById("era-cite").textContent = era.cite;
  document.getElementById("era-diagram").innerHTML = era.svg;
}

document.querySelectorAll("[data-era]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.era);
    document.querySelectorAll("[data-era]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderEra(idx);
  });
});
renderEra(0);

// ==================== 4. SECTION 03 · 180° 轴线俯拍台 × 成对切镜 ====================
const fpCanvas = document.getElementById("floorplan-canvas");
const pairACanvas = document.getElementById("pair-a-canvas");
const pairBCanvas = document.getElementById("pair-b-canvas");
let labCamB = "matched";
let labFocal = 50;

const LAB_NOTES = {
  matched: {
    ok: true,
    note: "机位 A 与机位 B 对称落在 180° 轴线同一侧：A 镜人物在右朝左看，B 镜人物在左朝右看，切镜时两道视线隔着银幕正好迎面相接。",
    verdict: "✓ 视线对撞接通：A 镜左肩看右、B 镜右肩看左，景别尺度匹配，是最稳健的经典对话正反打。",
  },
  tight: {
    ok: true,
    note: "机位 B 仍在合法 180° 半区，但明显比机位 A 更靠近说话者——这种「不对称过肩」常用来暗示一方情绪占压倒优势或步步紧逼。",
    verdict: "✓ 守轴但尺度刻意不对称：观众仍清楚二人方位，但切到 B 镜时心理逼迫感会明显强于 A 镜。",
  },
  wide: {
    ok: true,
    note: "机位 B 退远并略微打开角度，带入更多桌面与房间留白，常用于在紧张对话里给某一方制造疏离或防备距离。",
    verdict: "✓ 守轴且拉开疏离感：方向完全连续，切到 B 镜时能明显感到对方在往后退让。",
  },
  crossed: {
    ok: false,
    note: "警报：机位 B 翻到了 180° 虚线上方的越轴禁区！两台摄影机从相反两侧拍同一张桌，前景肩在正反打里竟然都留在画面左侧。",
    verdict: "× 正反打越轴跳戏：切镜后角色 B 和角色 A 竟然都站在画面右侧朝左边说话，仿佛两人并排看窗外而不是在面对面交流！",
  },
};

function drawAxisLab() {
  const { ctx: fpCtx, w: fpW, h: fpH } = sizeCanvas(fpCanvas);
  renderFloorplan(fpCtx, fpW, fpH, { camBMode: labCamB, focalMm: labFocal });

  const fStop = labFocal <= 30 ? 1.8 : 2.2;
  const stateA = { cam: "A", offset: 0.35, elev: 0.02, focalMm: labFocal, fStop, axisValid: true, scene: "cafe" };
  const stateB = {
    cam: "B",
    offset: labCamB === "tight" ? 0.32 : labCamB === "wide" ? 0.42 : 0.35,
    elev: 0.02,
    focalMm: labCamB === "tight" ? clamp(labFocal + 20, 42, 92) : labCamB === "wide" ? clamp(labFocal - 12, 28, 72) : labFocal,
    fStop,
    axisValid: labCamB !== "crossed",
    scene: "cafe",
  };

  const aBox = sizeCanvas(pairACanvas);
  renderOTSFrame(aBox.ctx, aBox.w, aBox.h, stateA, { clean: true, still: true, layers: { corners: true, gaze: true } });

  const bBox = sizeCanvas(pairBCanvas);
  renderOTSFrame(bBox.ctx, bBox.w, bBox.h, stateB, { clean: true, still: true, layers: { corners: true, gaze: true } });

  const info = LAB_NOTES[labCamB];
  document.getElementById("axis-lab-note").textContent = `${info.note}（当前双机基准焦段 ${labFocal}mm）`;
  document.getElementById("pair-a-cap").textContent = `SHOT A · ${labFocal}mm · 左肩框定（角色 B 在右朝左看）`;
  document.getElementById("pair-b-cap").textContent =
    labCamB === "crossed"
      ? `SHOT B · ${Math.round(stateB.focalMm)}mm · 越轴左肩！（角色 A 也跑到右侧朝左看）`
      : `SHOT B · ${Math.round(stateB.focalMm)}mm · 右肩框定（角色 A 在左朝右看）`;

  const strip = document.getElementById("axis-verdict-strip");
  strip.textContent = info.verdict;
  strip.classList.toggle("is-bad", !info.ok);
}

document.querySelectorAll("[data-camb]").forEach((btn) => {
  btn.addEventListener("click", () => {
    labCamB = btn.dataset.camb;
    document.querySelectorAll("[data-camb]").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawAxisLab();
  });
});

document.querySelectorAll("[data-lens]").forEach((btn) => {
  btn.addEventListener("click", () => {
    labFocal = Number(btn.dataset.lens);
    document.querySelectorAll("[data-lens]").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawAxisLab();
  });
});

// ==================== 5. SECTION 04 · 高低机位与景别权力矩阵 ====================
const matrixCanvas = document.getElementById("matrix-canvas");
const MATRIX_STATES = {
  "high-close": {
    tags: "高位俯看 · 近景 74mm · f/2.0",
    title: "压迫审视：逼近面部的心理下压",
    desc: "摄影机架在前景肩上方俯冲逼近，对方被压到画幅下半部，常用于审讯、追责或上位者当面施压。",
    state: { cam: "A", offset: 0.34, elev: 0.42, focalMm: 74, fStop: 2.0, axisValid: true, scene: "interrogation" },
  },
  "high-med": {
    tags: "高位俯看 · 中景 46mm · f/2.4",
    title: "居高施压：露出宽大桌面与弱势体态",
    desc: "呼应原海报「高位过肩」，镜头高抬带出大面积桌面与环境，让坐着的说话者显得孤单渺小。",
    state: { cam: "A", offset: 0.36, elev: 0.42, focalMm: 46, fStop: 2.4, axisValid: true, scene: "cafe" },
  },
  "eye-close": {
    tags: "平视对等 · 近景 72mm · f/2.0",
    title: "私密耳语：平等视线加长焦压缩",
    desc: "呼应原海报「左肩近景」，视线完全齐平、长焦拉近前后景距离，适合吐露秘密、表白或轻声试探。",
    state: { cam: "A", offset: 0.34, elev: 0.0, focalMm: 72, fStop: 2.0, axisValid: true, scene: "cafe" },
  },
  "eye-med": {
    tags: "平视对等 · 中景 46mm · f/2.4",
    title: "理性谈判：交代肢体与礼貌社交距",
    desc: "呼应原海报「左肩中景」，保留桌面、咖啡杯与上半身肢体语言，给双方留下克制而体面的安全距离。",
    state: { cam: "A", offset: 0.36, elev: 0.04, focalMm: 46, fStop: 2.4, axisValid: true, scene: "cafe" },
  },
  "low-close": {
    tags: "低位仰看 · 近景 72mm · f/2.0",
    title: "威严逼视：放大对方压场与不容置疑感",
    desc: "机位压低贴着前景肩沿仰看，对方头部高高升进画幅上方，常用于反派宣告、强硬表态或压迫独白。",
    state: { cam: "B", offset: 0.34, elev: -0.36, focalMm: 72, fStop: 2.0, axisValid: true, scene: "interrogation" },
  },
  "low-med": {
    tags: "低位仰看 · 中景 48mm · f/2.4",
    title: "仰望敬畏：借背景空间托举主体体量",
    desc: "呼应原海报「低位过肩」，机位下沉拉低地平线，既留住听者的卑微背影，又让远端说话者挺拔立住。",
    state: { cam: "B", offset: 0.36, elev: -0.36, focalMm: 48, fStop: 2.4, axisValid: true, scene: "rooftop" },
  },
};
let activeMatrix = "eye-close";

function drawMatrix() {
  const m = MATRIX_STATES[activeMatrix];
  const { ctx, w, h } = sizeCanvas(matrixCanvas);
  renderOTSFrame(ctx, w, h, m.state, { clean: true, still: true, layers: { corners: true, gaze: true } });
  document.getElementById("matrix-tags").textContent = m.tags;
  document.getElementById("matrix-title").textContent = m.title;
  document.getElementById("matrix-desc").textContent = m.desc;
}

document.querySelectorAll("[data-mat]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeMatrix = btn.dataset.mat;
    document.querySelectorAll("[data-mat]").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawMatrix();
  });
});

// ==================== 6. SECTION 05 · 反例现场对照 ====================
const avoidCanvas = document.getElementById("avoid-canvas");
let avoidMode = "ots";

function drawAvoidDemo() {
  const { ctx, w, h } = sizeCanvas(avoidCanvas);
  const st =
    avoidMode === "ots"
      ? { cam: "A", offset: 0.34, elev: 0.02, focalMm: 56, fStop: 2.0, axisValid: true, scene: "rooftop" }
      : { cam: "A", offset: 0.94, elev: 0.02, focalMm: 56, fStop: 2.0, axisValid: true, scene: "rooftop" };
  renderOTSFrame(ctx, w, h, st, { clean: true, still: true, layers: { corners: true, gaze: avoidMode === "ots" } });
  document.getElementById("avoid-demo-title").textContent =
    avoidMode === "ots"
      ? "残留过肩：前景肩影仍在把两人拴在同一段关系里"
      : "撤掉前景肩（净单人）：孤立与抽离感瞬间成立";
  document.getElementById("avoid-demo-desc").textContent =
    avoidMode === "ots"
      ? "只要暗色肩头还占着左缘，观众潜意识就觉得对方就在眼前、关系仍有回旋余地。"
      : "把前景肩完全移出画框后，说话者独自面对空旷暮色天台，真正切进「没人能接住她」的孤立情绪。";
}

document.querySelectorAll("[data-avoid]").forEach((btn) => {
  btn.addEventListener("click", () => {
    avoidMode = btn.dataset.avoid;
    document.querySelectorAll("[data-avoid]").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawAvoidDemo();
  });
});

// ==================== 7. SECTION 06 · 两轮单变量导演试镜小练习 ====================
const QUIZ_ROUNDS = [
  {
    prompt: "同一场百叶窗咖啡馆对谈，机位高度、焦段（50mm）与光圈（f/2.0）完全相同，四个方案<strong>仅改变机位横向移位量</strong>。请观察画面选出最成立的标准过肩构图：",
    answer: 2,
    options: [
      {
        label: "方案 A",
        meta: "候选机位 01",
        state: { cam: "A", offset: -0.14, elev: 0.02, focalMm: 50, fStop: 2.0, axisValid: true, scene: "cafe" },
        explain: "方案 A 机位太偏内侧，前景肩与后脑直接切进说话者面部，遮挡了关键表情与视线起点。",
      },
      {
        label: "方案 B",
        meta: "候选机位 02",
        state: { cam: "A", offset: 0.72, elev: 0.02, focalMm: 50, fStop: 2.0, axisValid: true, scene: "cafe" },
        explain: "方案 B 机位甩得太开，前景肩几乎掉出画框外只剩边角细条，画面失去了过肩构图的双人空间锚点。",
      },
      {
        label: "方案 C",
        meta: "候选机位 03",
        state: { cam: "A", offset: 0.36, elev: 0.02, focalMm: 50, fStop: 2.0, axisValid: true, scene: "cafe" },
        explain: "答对了！方案 C 的前景肩虚化柔和地占据画幅约 1/4，既自然框住左缘建立对话现场感，又让对方整张侧脸与视线净空毫无遮挡。",
      },
      {
        label: "方案 D",
        meta: "候选机位 04",
        state: { cam: "A", offset: 0.02, elev: 0.02, focalMm: 50, fStop: 2.0, axisValid: true, scene: "cafe" },
        explain: "方案 D 虽然勉强擦着脸沿没完全盖住眼睛，但前景黑影已占去近四成画幅，暗块体量压过远端说话者。",
      },
    ],
  },
  {
    prompt: "前一个镜头（正打 A）已确立「男肩在左、看向右边的女主体」。现在切到反打 B（看男主体），四个方案<strong>仅改变反打机位与光圈</strong>，哪一帧能无缝接戏？",
    answer: 1,
    options: [
      {
        label: "方案 A",
        meta: "反打候选 01 · f/2.0",
        state: { cam: "B", offset: 0.36, elev: 0.02, focalMm: 52, fStop: 2.0, axisValid: false, scene: "cafe" },
        explain: "方案 A 跨过了 180° 轴线！前景女肩仍然留在左侧、男主体也站到右边朝左看，和上一镜人物朝向撞车，剪接瞬间跳戏。",
      },
      {
        label: "方案 B",
        meta: "反打候选 02 · f/2.0",
        state: { cam: "B", offset: 0.36, elev: 0.02, focalMm: 52, fStop: 2.0, axisValid: true, scene: "cafe" },
        explain: "答对了！方案 B 守在 180° 轴线同侧，女肩稳稳落在右缘并以 f/2.0 柔焦虚化，男主体在左侧朝右望去，与上一镜视线正好隔屏对接。",
      },
      {
        label: "方案 C",
        meta: "反打候选 03 · f/14",
        state: { cam: "B", offset: 0.36, elev: 0.02, focalMm: 52, fStop: 14, axisValid: true, scene: "cafe" },
        explain: "方案 C 轴线位置对了，但光圈收死到 f/14，前景女肩边缘过于锐利，与后方的男主体抢夺焦点，削弱了空间分层。",
      },
      {
        label: "方案 D",
        meta: "反打候选 04 · f/14",
        state: { cam: "B", offset: 0.36, elev: 0.02, focalMm: 52, fStop: 14, axisValid: false, scene: "cafe" },
        explain: "方案 D 同时踩中「反打越轴」与「f/14 前景过锐」两个坑，既断掉对话方向又拉平了景深。",
      },
    ],
  },
];

let currentQRound = 0;
let quizCanvases = [];

function renderQuizRound(idx) {
  currentQRound = idx;
  const q = QUIZ_ROUNDS[idx];
  document.getElementById("quiz-prompt").innerHTML = q.prompt;
  const grid = document.getElementById("quiz-grid");
  grid.innerHTML = "";
  quizCanvases = [];

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    btn.dataset.opt = String(i);
    btn.innerHTML = `
      <img class="quiz-thumb" alt="" draggable="false">
      <div class="quiz-opt-head">
        <span class="quiz-opt-label">${opt.label}</span>
        <span class="quiz-opt-meta">${opt.meta}</span>
      </div>`;
    btn.addEventListener("click", () => handleQuizPick(i));
    grid.append(btn);
    quizCanvases.push({ img: btn.querySelector("img"), state: opt.state, btn });
  });

  const fb = document.getElementById("quiz-feedback");
  fb.className = "quiz-feedback";
  fb.innerHTML = `<span class="mono">第 ${idx + 1} 题 · 等待试镜选择</span><p>点选上方方案 A / B / C / D 任意一帧，查看导演单真源拆解。</p>`;

  drawQuizCanvases();
}

function drawQuizCanvases() {
  for (const item of quizCanvases) {
    item.img.src = renderThumbUrl(
      item.state,
      { clean: true, still: true, layers: { corners: true, gaze: false, depth: false } },
      400,
      300
    );
  }
}

function handleQuizPick(pickedIdx) {
  const q = QUIZ_ROUNDS[currentQRound];
  const isCorrect = pickedIdx === q.answer;
  quizCanvases.forEach((item, i) => {
    item.btn.classList.remove("is-picked", "is-correct", "is-wrong");
    if (i === pickedIdx) item.btn.classList.add("is-picked", isCorrect ? "is-correct" : "is-wrong");
    if (i === q.answer) item.btn.classList.add("is-correct");
  });

  const pickedOpt = q.options[pickedIdx];
  const fb = document.getElementById("quiz-feedback");
  fb.className = `quiz-feedback ${isCorrect ? "" : "is-wrong"}`;
  const tag = isCorrect ? `✓ 试镜通过 · ${pickedOpt.label} 正确` : `× 尚未成立 · 你选了 ${pickedOpt.label}（正确答案是 ${q.options[q.answer].label}）`;
  const extra = isCorrect ? "" : ` ${q.options[q.answer].explain}`;
  fb.innerHTML = `<span class="mono">${tag}</span><p>${pickedOpt.explain}${extra}</p>`;
}

document.querySelectorAll("[data-qround]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.qround);
    document.querySelectorAll("[data-qround]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderQuizRound(idx);
  });
});

// ==================== 8. SECTION 07 · 原海报灯箱（复用 #poster.src） ====================
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbScale = document.getElementById("lb-scale");
const posterOpenBtn = document.getElementById("poster-open");

let lbZoom = 1, lbX = 0, lbY = 0, lbDragging = false, lbStartX = 0, lbStartY = 0;

function updateLightboxTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbZoom})`;
  lbScale.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = document.getElementById("poster").src;
  lbZoom = 1; lbX = 0; lbY = 0;
  updateLightboxTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => { lbZoom = clamp(lbZoom + 0.35, 1, 4); updateLightboxTransform(); });
document.getElementById("lb-out").addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.35, 1, 4);
  if (lbZoom === 1) { lbX = 0; lbY = 0; }
  updateLightboxTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => { lbZoom = 1; lbX = 0; lbY = 0; updateLightboxTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.25 : -0.25), 1, 4);
  if (lbZoom === 1) { lbX = 0; lbY = 0; }
  updateLightboxTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbZoom === 1) { closeLightbox(); return; }
  lbDragging = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  updateLightboxTransform();
});
lbStage.addEventListener("pointerup", () => { lbDragging = false; });
lbStage.addEventListener("pointercancel", () => { lbDragging = false; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 9. 初始首帧绘制与窗口尺寸自适应 ====================
function renderAllStaticCanvases() {
  dirtyHero = true;
  heroLoop.draw();
  renderAngleThumbs();
  drawWipe();
  drawAxisLab();
  drawMatrix();
  drawAvoidDemo();
  drawQuizCanvases();
}

renderQuizRound(0);
renderAllStaticCanvases();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderAllStaticCanvases, 80);
});
