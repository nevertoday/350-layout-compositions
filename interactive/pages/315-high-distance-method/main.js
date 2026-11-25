import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ASPECTS,
  FAMILY_METHODS,
  HISTORY_ITEMS,
  IDEAL_STATE,
  INITIAL_STATE,
  QUIZ_OPTIONS,
  clamp,
  evaluateLayers,
  evaluateRatio,
  evaluateScroll,
  horizonToPitch,
  peakTopToScale,
} from "./model.js";
import {
  drawElevationProfile,
  drawFamilyCompass,
  drawHighDistanceScroll,
  drawHistoryDiagram,
} from "./render.js";

// ---------- 工具：高清画布自适应 ----------
function fitCanvas(canvas, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const dpr = pixelRatio(window.innerWidth <= 520 ? Math.min(maxDpr, 1.5) : maxDpr);
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

// =====================================================================
// 开场主角玩具：宋画立轴造势台
// =====================================================================
const state = { ...INITIAL_STATE };
let heroHandles = null;
let draggingHandle = null;
let activeHandle = null;
let heroDirty = true;
let profileDirty = true;

const heroCanvas = document.getElementById("hero-canvas");
const profileCanvas = document.getElementById("profile-canvas");
const pitchTrack = document.getElementById("pitch-track");
const pitchThumb = document.getElementById("pitch-thumb");
const pitchReadout = document.getElementById("pitch-readout");
const peakSlider = document.getElementById("peak-slider");
const peakOut = document.getElementById("peak-out");
const mistSlider = document.getElementById("mist-slider");
const mistOut = document.getElementById("mist-out");

const diagCard = document.getElementById("diag-card");
const diagTag = document.getElementById("diag-tag");
const diagHead = document.getElementById("diag-head");
const diagDetail = document.getElementById("diag-detail");
const diagAction = document.getElementById("diag-action");
const sealStamp = document.getElementById("seal-stamp");
const sealNum = document.getElementById("seal-num");
const sealWord = document.getElementById("seal-word");
const mobileSeal = document.getElementById("mobile-seal");
const auraVal = document.getElementById("aura-val");

const mHorizon = document.getElementById("m-horizon");
const mSpan = document.getElementById("m-span");
const mHeadroom = document.getElementById("m-headroom");
const mMist = document.getElementById("m-mist");

const medLookup = document.getElementById("med-lookup");
const medVertical = document.getElementById("med-vertical");
const medMajesty = document.getElementById("med-majesty");

function pitchToPercent(pitch) {
  return ((clamp(pitch, -18, 58) + 18) / 76) * 100;
}

function syncHeroUI() {
  const ev = evaluateScroll(state);

  // 卷轴推尺位置与读数
  const pct = pitchToPercent(ev.pitch);
  pitchThumb.style.left = `${clamp(pct, 5, 95)}%`;
  pitchThumb.setAttribute("aria-valuenow", String(Math.round(ev.pitch)));
  const sign = ev.pitch > 0 ? "+" : "";
  const pitchMode = ev.pitch < -2 ? "俯视" : ev.pitch < 18 ? "平视" : "仰视";
  pitchReadout.textContent = `${sign}${Math.round(ev.pitch)}° ${pitchMode} · 基线 ${Math.round(ev.horizonY * 100)}%`;

  // 滑块与按钮状态
  peakSlider.value = String(Math.round(state.peakScale * 100));
  peakOut.textContent = `升程 ${Math.round(ev.spanRatio * 100)}%`;
  mistSlider.value = String(Math.round(state.mist * 100));
  mistOut.textContent = `${Math.round(state.mist * 100)}%`;

  document.querySelectorAll("[data-scene]").forEach((btn) => {
    const on = btn.dataset.scene === state.scene;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-baseref]").forEach((btn) => {
    const on = btn.dataset.baseref === state.baseRef;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  const guidesBtn = document.getElementById("btn-guides");
  if (guidesBtn) {
    guidesBtn.classList.toggle("is-on", state.showGuides);
    guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
    guidesBtn.textContent = state.showGuides ? "导视线：开" : "导视线：关";
  }

  // 印章与手机首屏状态
  const allOk = ev.passCount === 4;
  sealStamp.dataset.ok = String(allOk);
  sealNum.textContent = `${ev.passCount} / 4`;
  sealWord.textContent = allOk ? "高远成势" : "待造势";
  mobileSeal.dataset.ok = String(allOk);
  mobileSeal.textContent = `${ev.passCount} / 4 · ${allOk ? "高远成势" : "待造势"}`;
  auraVal.textContent = `${ev.auraTier}（示意）`;

  // 三枚左翼原海报实检徽标
  medLookup.dataset.ok = String(ev.medallions.lookup);
  medLookup.querySelector(".med-pill").textContent = ev.checks.base.stateText;

  medVertical.dataset.ok = String(ev.medallions.vertical);
  medVertical.querySelector(".med-pill").textContent = ev.checks.ascent.stateText;

  medMajesty.dataset.ok = String(ev.medallions.majesty);
  medMajesty.querySelector(".med-pill").textContent =
    ev.medallions.majesty
      ? "烟锁·尺明"
      : !ev.checks.mist.ok
        ? ev.checks.mist.stateText
        : ev.checks.scale.stateText;

  // 诊单与四项实测读数
  diagCard.dataset.severity = ev.severity;
  diagTag.textContent = ev.tag;
  diagHead.textContent = ev.headline;
  diagDetail.textContent = ev.detail;
  diagAction.textContent = ev.action;

  mHorizon.textContent = `${Math.round(ev.horizonY * 100)}%`;
  mSpan.textContent = `${Math.round(ev.spanRatio * 100)}%`;
  mHeadroom.textContent = `${Math.round(ev.headroom * 100)}%`;
  mMist.textContent = `${Math.round(ev.mist * 100)}%`;

  heroDirty = true;
  profileDirty = true;
}

// 渲染主循环（入场 1.0 秒丝滑展开，随后在拖动/改动或柔和云流时高效重画）
let lastCloudBucket = -1;
const heroLoop = loop(heroCanvas, (t, _dt, { still }) => {
  const intro = still ? 1 : clamp(t / 0.95, 0.08, 1);
  // 云烟每 ~50ms 微微推进一格；入场期间与状态改动时逐帧重绘，保证低耗又流畅
  const cloudBucket = still ? 0 : Math.floor(t * 18);
  const needHero = heroDirty || intro < 1 || (state.mist > 0.02 && cloudBucket !== lastCloudBucket);
  if (needHero) {
    lastCloudBucket = cloudBucket;
    heroDirty = false;
    const { ctx, w, h } = fitCanvas(heroCanvas, 2);
    const ev = evaluateScroll(state);
    const res = drawHighDistanceScroll(ctx, w, h, state, {
      evalRes: ev,
      time: still ? 0 : t,
      intro,
      showRuler: w >= 310,
      showHandles: true,
      activeHandle: draggingHandle || activeHandle,
    });
    heroHandles = res.handles;
  }

  if (profileDirty && profileCanvas.offsetParent !== null) {
    profileDirty = false;
    const { ctx, w, h } = fitCanvas(profileCanvas, 2);
    drawElevationProfile(ctx, w, h, state, evaluateScroll(state));
  }
});

// 仰角卷轴横推尺交互（支持鼠标、触摸、以及 tools/perf.mjs 的横向 touchMove）
function setPitchFromClientX(clientX) {
  const rect = pitchTrack.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  let nextPitch = -18 + ratio * 76;
  // 靠近黄金高远仰角 +34° 时轻柔吸附
  if (Math.abs(nextPitch - 34) < 1.2) nextPitch = 34;
  state.pitch = Math.round(nextPitch * 2) / 2;
  syncHeroUI();
  heroLoop.draw();
}

let trackPointerDown = false;
pitchTrack.addEventListener("pointerdown", (e) => {
  trackPointerDown = true;
  if (pitchTrack.setPointerCapture) {
    try { pitchTrack.setPointerCapture(e.pointerId); } catch {}
  }
  setPitchFromClientX(e.clientX);
});

pitchTrack.addEventListener("pointermove", (e) => {
  if (!trackPointerDown) return;
  setPitchFromClientX(e.clientX);
});

const stopTrackDrag = () => { trackPointerDown = false; };
pitchTrack.addEventListener("pointerup", stopTrackDrag);
pitchTrack.addEventListener("pointercancel", stopTrackDrag);

// 兼容纯 Touch 事件（确保 CDP Input.dispatchTouchEvent 在各版本下 100% 流畅触发）
pitchTrack.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  setPitchFromClientX(e.touches[0].clientX);
}, { passive: true });

pitchTrack.addEventListener("touchmove", (e) => {
  if (!e.touches.length) return;
  e.preventDefault();
  setPitchFromClientX(e.touches[0].clientX);
}, { passive: false });

pitchThumb.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 5 : 2;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.pitch = clamp(state.pitch + step, -18, 58);
    syncHeroUI();
    heroLoop.draw();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.pitch = clamp(state.pitch - step, -18, 58);
    syncHeroUI();
    heroLoop.draw();
  }
});

// 画心内直接拖拽「峰顶 / 烟腰 / 山脚」三节点
function canvasCoords(e) {
  const rect = heroCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };
}

function findNearestHandle(x, y) {
  if (!heroHandles) return null;
  let best = null;
  let bestD = 32;
  for (const [k, pt] of Object.entries(heroHandles)) {
    const d = Math.hypot(pt.x - x, pt.y - y);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const pt = canvasCoords(e);
  const hit = findNearestHandle(pt.x, pt.y);
  if (!hit) return;
  draggingHandle = hit;
  activeHandle = hit;
  heroCanvas.classList.add("is-dragging");
  try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  heroDirty = true;
  heroLoop.draw();
});

heroCanvas.addEventListener("pointermove", (e) => {
  const pt = canvasCoords(e);
  if (!draggingHandle) {
    const hover = findNearestHandle(pt.x, pt.y);
    if (hover !== activeHandle) {
      activeHandle = hover;
      heroDirty = true;
      heroLoop.draw();
    }
    return;
  }
  const ny = clamp(pt.y / Math.max(1, pt.h), 0.03, 0.94);
  if (draggingHandle === "horizon") {
    state.pitch = Math.round(horizonToPitch(ny));
  } else if (draggingHandle === "peak") {
    state.peakScale = peakTopToScale(ny, state.pitch);
  } else if (draggingHandle === "mist") {
    const nx = clamp(pt.x / Math.max(1, pt.w), 0.05, 0.85);
    // 左右或上下拖动烟腰节点均可改变烟霞浓度，越靠中轴或越往下越清润
    const targetMist = clamp((0.68 - nx) * 1.45, 0, 0.9);
    state.mist = Math.round(targetMist * 100) / 100;
  }
  syncHeroUI();
  heroLoop.draw();
});

const stopCanvasDrag = () => {
  if (!draggingHandle) return;
  draggingHandle = null;
  heroCanvas.classList.remove("is-dragging");
  heroDirty = true;
  heroLoop.draw();
};
heroCanvas.addEventListener("pointerup", stopCanvasDrag);
heroCanvas.addEventListener("pointercancel", stopCanvasDrag);

// 滑块、题材与参数按钮绑定
peakSlider.addEventListener("input", () => {
  state.peakScale = Number(peakSlider.value) / 100;
  syncHeroUI();
  heroLoop.draw();
});

mistSlider.addEventListener("input", () => {
  state.mist = Number(mistSlider.value) / 100;
  syncHeroUI();
  heroLoop.draw();
});

document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    syncHeroUI();
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-baseref]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.baseRef = btn.dataset.baseref;
    syncHeroUI();
    heroLoop.draw();
  });
});

document.getElementById("btn-guides")?.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncHeroUI();
  heroLoop.draw();
});

document.getElementById("btn-reset")?.addEventListener("click", () => {
  Object.assign(state, INITIAL_STATE);
  syncHeroUI();
  heroLoop.draw();
});

// =====================================================================
// 01 节：双画幅直拖分屏对比幕帘（误解版高地平线 vs 真高远低地平线）
// =====================================================================
const curtainStage = document.getElementById("curtain-stage");
const curtainCanvas = document.getElementById("curtain-canvas");
const curtainHandle = document.getElementById("curtain-handle");
const curtainKnob = document.getElementById("curtain-knob");
const curtainNote = document.getElementById("curtain-note");

let curtainPos = 0.5;
const CURTAIN_WRONG = { scene: "poster", pitch: -12, peakScale: 0.42, mist: 0.42, baseRef: "humble", showGuides: true };
const CURTAIN_RIGHT = { ...IDEAL_STATE };

function renderCurtain() {
  const { ctx, w, h } = fitCanvas(curtainCanvas, 2);
  const splitX = Math.round(w * curtainPos);

  // 右侧：真高远低地平线
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, 0, w - splitX, h);
  ctx.clip();
  drawHighDistanceScroll(ctx, w, h, CURTAIN_RIGHT, { showRuler: false, compact: true });
  ctx.restore();

  // 左侧：地平线抬高成俯视
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, h);
  ctx.clip();
  drawHighDistanceScroll(ctx, w, h, CURTAIN_WRONG, { showRuler: false, compact: true });
  ctx.restore();

  // 角标（动态测量字宽，避免窄屏或字距差异造成裁字）
  ctx.font = `500 11.5px "LXGW WenKai", serif`;
  const leftLbl = "地平线抬高 37%（俯视）";
  const leftW = Math.ceil(ctx.measureText(leftLbl).width) + 14;
  if (splitX > leftW + 12) {
    ctx.fillStyle = "rgba(158, 46, 30, 0.92)";
    ctx.fillRect(10, 10, leftW, 22);
    ctx.fillStyle = "#FAF6F0";
    ctx.fillText(leftLbl, 17, 25);
  }
  const rightLbl = "地平线压低 78%（高远）";
  const rightW = Math.ceil(ctx.measureText(rightLbl).width) + 14;
  if (w - splitX > rightW + 12) {
    ctx.fillStyle = "rgba(25, 89, 62, 0.92)";
    ctx.fillRect(w - rightW - 10, 10, rightW, 22);
    ctx.fillStyle = "#FAF6F0";
    ctx.fillText(rightLbl, w - rightW - 3, 25);
  }

  curtainHandle.style.left = `${curtainPos * 100}%`;
  curtainKnob.setAttribute("aria-valuenow", String(Math.round(curtainPos * 100)));
  if (curtainPos > 0.65) {
    curtainNote.textContent = "现在画面多半露着「抬高地平线」版：山脚升到半空、坡地占满下半幅，观者其实在低头俯瞰。";
  } else if (curtainPos < 0.35) {
    curtainNote.textContent = "现在画面多半露着「真高远」版：压低山脚、把 78% 的纵高让给峭峰与苍穹，目光自然仰起。";
  } else {
    curtainNote.textContent = "左右拖动金色拉柄，对比同一座山体在地平线 37%（左）与 78%（右）时的仰俯剧变。";
  }
}

let curtainDrag = false;
function updateCurtain(clientX) {
  const r = curtainStage.getBoundingClientRect();
  curtainPos = clamp((clientX - r.left) / Math.max(1, r.width), 0.08, 0.92);
  renderCurtain();
}

curtainStage.addEventListener("pointerdown", (e) => {
  curtainDrag = true;
  try { curtainStage.setPointerCapture(e.pointerId); } catch {}
  updateCurtain(e.clientX);
});
curtainStage.addEventListener("pointermove", (e) => {
  if (!curtainDrag) return;
  updateCurtain(e.clientX);
});
curtainStage.addEventListener("pointerup", () => { curtainDrag = false; });
curtainStage.addEventListener("pointercancel", () => { curtainDrag = false; });
curtainKnob.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); curtainPos = clamp(curtainPos - 0.06, 0.08, 0.92); renderCurtain(); }
  if (e.key === "ArrowRight") { e.preventDefault(); curtainPos = clamp(curtainPos + 0.06, 0.08, 0.92); renderCurtain(); }
});

// =====================================================================
// 02 节：烟霞锁腰 · 四层山景复选分解
// =====================================================================
const layerCanvas = document.getElementById("layer-canvas");
const layerTierEl = document.getElementById("layer-tier");
const layerNoteEl = document.getElementById("layer-note");
const layerState = { base: true, mist: true, peak: true, guide: true };

function renderLayers() {
  const { ctx, w, h } = fitCanvas(layerCanvas, 2);
  drawHighDistanceScroll(ctx, w, h, IDEAL_STATE, {
    showRuler: false,
    compact: true,
    layers: layerState,
  });
  const res = evaluateLayers(layerState);
  layerTierEl.textContent = `已开启 ${res.count} / 4 层 · 视高感受：${res.tier}（示意）`;
  layerNoteEl.textContent = res.note;
}

document.querySelectorAll("[data-layer]").forEach((cb) => {
  cb.addEventListener("change", () => {
    layerState[cb.dataset.layer] = cb.checked;
    renderLayers();
  });
});

// =====================================================================
// 03 节：画幅比例 × 天头留白
// =====================================================================
const ratioCanvas = document.getElementById("ratio-canvas");
const headroomSlider = document.getElementById("headroom-slider");
const headroomOut = document.getElementById("headroom-out");
const ratioVerdictEl = document.getElementById("ratio-verdict");
const ratioTitleEl = document.getElementById("ratio-title");
const ratioDescEl = document.getElementById("ratio-desc");

let currentAspect = "3:4";
let currentHeadroom = 18;

function renderRatioDemo() {
  const res = evaluateRatio(currentAspect, currentHeadroom);
  const host = ratioCanvas.parentElement;
  const maxW = Math.max(120, host.clientWidth - 28);
  const maxH = Math.max(120, host.clientHeight - 28);
  let cw = maxH * res.aspect.ratio;
  let ch = maxH;
  if (cw > maxW) {
    cw = maxW;
    ch = cw / res.aspect.ratio;
  }
  ratioCanvas.style.width = `${Math.round(cw)}px`;
  ratioCanvas.style.height = `${Math.round(ch)}px`;

  const { ctx, w, h } = fitCanvas(ratioCanvas, 2);
  const pitch = 34;
  const scale = peakTopToScale(res.headroom, pitch);
  drawHighDistanceScroll(
    ctx,
    w,
    h,
    { scene: "poster", pitch, peakScale: scale, mist: 0.44, baseRef: "humble", showGuides: true },
    { showRuler: false, compact: true }
  );

  // 标注天头高度线
  const hrPx = Math.max(6, res.headroom * h);
  ctx.save();
  ctx.strokeStyle = res.severity === "err" ? "#9E2E1E" : "#735512";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(0, hrPx);
  ctx.lineTo(w, hrPx);
  ctx.stroke();
  ctx.restore();

  headroomOut.textContent = `${res.hr}%`;
  ratioVerdictEl.dataset.severity = res.severity;
  ratioTitleEl.textContent = res.verdict;
  ratioDescEl.textContent = res.text;

  document.querySelectorAll("[data-aspect]").forEach((b) => {
    const on = b.dataset.aspect === currentAspect;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

document.querySelectorAll("[data-aspect]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAspect = btn.dataset.aspect;
    renderRatioDemo();
  });
});

headroomSlider.addEventListener("input", () => {
  currentHeadroom = Number(headroomSlider.value);
  renderRatioDemo();
});

// =====================================================================
// 04 节：从北宋巨碑到当代竖屏
// =====================================================================
const histCanvas = document.getElementById("history-canvas");
const histMeta = document.getElementById("hist-meta");
const histWork = document.getElementById("hist-work");
const histSummary = document.getElementById("hist-summary");
const histStruct = document.getElementById("hist-struct");
let activeHist = HISTORY_ITEMS[0].id;

function renderHistory() {
  const item = HISTORY_ITEMS.find((x) => x.id === activeHist) || HISTORY_ITEMS[0];
  histMeta.textContent = `${item.era} · ${item.year} · ${item.museum} · ${item.spec}`;
  histWork.textContent = item.work;
  histSummary.textContent = item.summary;
  histStruct.textContent = item.structure;

  document.querySelectorAll("[data-hist]").forEach((b) => {
    const on = b.dataset.hist === item.id;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });

  const { ctx, w, h } = fitCanvas(histCanvas, 2);
  drawHistoryDiagram(ctx, w, h, item);
}

document.querySelectorAll("[data-hist]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeHist = btn.dataset.hist;
    renderHistory();
  });
});

// =====================================================================
// 05 节：三远与游观六法罗盘
// =====================================================================
const famCanvas = document.getElementById("family-canvas");
const famQuote = document.getElementById("fam-quote");
const famDetail = document.getElementById("fam-detail");
let activeFamily = "315";

function renderFamily() {
  const m = FAMILY_METHODS.find((x) => x.id === activeFamily) || FAMILY_METHODS[0];
  famQuote.textContent = `${m.id} ${m.name}：「${m.quote}」`;
  famDetail.textContent = m.role;
  document.querySelectorAll("[data-fam]").forEach((b) => {
    const on = b.dataset.fam === m.id;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  const { ctx, w, h } = fitCanvas(famCanvas, 2);
  drawFamilyCompass(ctx, w, h, m);
}

document.querySelectorAll("[data-fam]").forEach((card) => {
  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    activeFamily = card.dataset.fam;
    renderFamily();
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      if (e.target.closest("a")) return;
      e.preventDefault();
      activeFamily = card.dataset.fam;
      renderFamily();
    }
  });
});

// =====================================================================
// 06 节：什么时候别用（四张独立翻转对照卡）
// =====================================================================
document.querySelectorAll(".avoid-card").forEach((card) => {
  const btn = card.querySelector(".avoid-toggle");
  const tag = card.querySelector(".avoid-state-tag");
  const text = card.querySelector(".avoid-text");
  const badSvg = card.querySelector(".svg-bad");
  const goodSvg = card.querySelector(".svg-good");

  btn.addEventListener("click", () => {
    const toBetter = card.dataset.mode !== "better";
    card.dataset.mode = toBetter ? "better" : "bad";
    btn.setAttribute("aria-pressed", String(toBetter));
    btn.textContent = toBetter ? "切回硬套高远" : "看看换回平视";
    tag.textContent = toBetter ? card.dataset.goodTag : card.dataset.badTag;
    text.textContent = toBetter ? card.dataset.goodText : card.dataset.badText;
    badSvg.hidden = toBetter;
    goodSvg.hidden = !toBetter;
  });
});

// =====================================================================
// 07 节：小练习（单变量四选一）
// =====================================================================
const quizResult = document.getElementById("quiz-result");
const quizResHead = document.getElementById("quiz-res-head");
const quizResBody = document.getElementById("quiz-res-body");
const quizRetryBtn = document.getElementById("quiz-retry");
let pickedKey = null;

function renderQuizCanvases() {
  QUIZ_OPTIONS.forEach((opt) => {
    const c = document.getElementById(`quiz-canvas-${opt.key}`);
    if (!c) return;
    const { ctx, w, h } = fitCanvas(c, 2);
    const showAnnot = pickedKey !== null;
    const ev = evaluateScroll(opt.state);
    drawHighDistanceScroll(ctx, w, h, { ...opt.state, showGuides: showAnnot }, {
      evalRes: ev,
      showRuler: false,
      showWarnings: showAnnot,
      compact: true,
    });
    if (showAnnot) {
      ctx.save();
      ctx.fillStyle = opt.correct ? "rgba(25, 89, 62, 0.90)" : "rgba(158, 46, 30, 0.90)";
      ctx.fillRect(6, h - 26, w - 12, 20);
      ctx.fillStyle = "#FAF6F0";
      ctx.font = `500 11px "LXGW WenKai", serif`;
      ctx.textAlign = "center";
      ctx.fillText(opt.variable, w * 0.5, h - 12);
      ctx.restore();
    }
  });
}

function updateQuizUI() {
  document.querySelectorAll(".quiz-opt").forEach((btn) => {
    const key = btn.dataset.quiz;
    const opt = QUIZ_OPTIONS.find((o) => o.key === key);
    const badge = btn.querySelector(".quiz-badge");
    btn.classList.remove("is-picked", "is-right", "is-wrong");
    if (pickedKey === null) {
      badge.textContent = "点击选择";
    } else if (key === pickedKey) {
      btn.classList.add("is-picked", opt.correct ? "is-right" : "is-wrong");
      badge.textContent = opt.correct ? "正确" : "已选";
    } else if (opt.correct) {
      btn.classList.add("is-right");
      badge.textContent = "参考解";
    } else {
      badge.textContent = opt.variable;
    }
  });

  if (pickedKey === null) {
    quizResult.hidden = true;
  } else {
    const chosen = QUIZ_OPTIONS.find((o) => o.key === pickedKey);
    quizResult.hidden = false;
    quizResult.dataset.state = chosen.correct ? "right" : "wrong";
    quizResHead.textContent = chosen.correct
      ? `${chosen.label} · 判断准确（四要素齐备）`
      : `${chosen.label} 差在「${chosen.variable}」`;
    quizResBody.textContent = chosen.feedback;
  }
  renderQuizCanvases();
}

document.querySelectorAll(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    pickedKey = btn.dataset.quiz;
    updateQuizUI();
  });
});

quizRetryBtn?.addEventListener("click", () => {
  pickedKey = null;
  updateQuizUI();
});

// =====================================================================
// 08 节：原海报放大、拖动、Esc 关闭灯箱
// =====================================================================
const posterImg = document.getElementById("poster");
const openPosterBtn = document.getElementById("open-poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbPan = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  openPosterBtn.focus();
}

openPosterBtn?.addEventListener("click", openLightbox);
lbClose?.addEventListener("click", closeLightbox);
lbZoomIn?.addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 0.8, 3.2); applyLightboxTransform(); });
lbZoomOut?.addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 0.8, 3.2); applyLightboxTransform(); });
lbReset?.addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLightboxTransform(); });

lbStage?.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.18 : -0.18), 0.8, 3.2);
  applyLightboxTransform();
}, { passive: false });

lbStage?.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbPan = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbStage.classList.add("is-pan");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});

lbStage?.addEventListener("pointermove", (e) => {
  if (!lbPan) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLightboxTransform();
});

const stopLbPan = () => {
  lbPan = false;
  lbStage?.classList.remove("is-pan");
};
lbStage?.addEventListener("pointerup", stopLbPan);
lbStage?.addEventListener("pointercancel", stopLbPan);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});

// =====================================================================
// 初始化与窗口缩放联动
// =====================================================================
function redrawAllStatic() {
  heroDirty = true;
  profileDirty = true;
  heroLoop.draw();
  renderCurtain();
  renderLayers();
  renderRatioDemo();
  renderHistory();
  renderFamily();
  renderQuizCanvases();
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(redrawAllStatic, 80);
});

// 字体就绪后重画一帧，确保 Canvas 内标签使用最终加载的字体
syncHeroUI();
redrawAllStatic();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    if (!reducedMotion.matches) redrawAllStatic();
    else {
      heroDirty = true;
      profileDirty = true;
      heroLoop.draw();
      renderCurtain();
      renderLayers();
      renderRatioDemo();
      renderHistory();
      renderFamily();
      renderQuizCanvases();
    }
  });
}
