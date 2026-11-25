// 111 交替节奏组织 · 全页交互控制器
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  clamp,
  diagnose,
  diagnoseChannels,
  DIMENSIONS,
  INITIAL_STATE,
  METERS,
  POSTER_SOLUTION,
  PRESET_PATTERNS,
  QUIZ_OPTIONS,
  snapPhase,
} from "./model.js";
import {
  hitTestHeroCanvas,
  renderChannelMatrix,
  renderHeroLoom,
  renderQuizCanvas,
} from "./artwork.js";

// ==================== 工具：HiDPI 2D 画布自适应（缓存尺寸，帧内零回流） ====================
const canvasDims = new WeakMap();
const isNarrow = () => window.innerWidth <= 640;

function measureCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dims = { w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) };
  canvasDims.set(canvas, dims);
  return dims;
}

function sizeCanvas(canvas) {
  const dpr = pixelRatio(isNarrow() ? 1.5 : 2);
  const dims = canvasDims.get(canvas) || measureCanvas(canvas);
  const { w, h } = dims;
  const targetW = Math.round(w * dpr);
  const targetH = Math.round(h * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function setAttr(el, name, val) {
  const s = String(val);
  if (el.getAttribute(name) !== s) el.setAttribute(name, s);
}

// ==================== HERO：四轨活体交替编排台 ====================
const state = {
  ...INITIAL_STATE,
  beats: [...INITIAL_STATE.beats],
};

const heroCanvas = document.getElementById("hero-canvas");
const phaseRail = document.getElementById("phase-rail");
const railThumb = document.getElementById("rail-thumb");
const railThumbVal = document.getElementById("rail-thumb-val");
const phaseReadout = document.getElementById("phase-readout");
const beatStrip = document.getElementById("beat-strip");
const slContrast = document.getElementById("sl-contrast");
const slContrastVal = document.getElementById("sl-contrast-val");
const slDuty = document.getElementById("sl-duty");
const slDutyVal = document.getElementById("sl-duty-val");
const topStatus = document.getElementById("top-status");
const diagPane = document.getElementById("diag-pane");
const diagBadge = document.getElementById("diag-badge");
const diagHead = document.getElementById("diag-head");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const mPeriod = document.getElementById("m-period");
const mContrast = document.getElementById("m-contrast");
const mPhase = document.getElementById("m-phase");
const mDuty = document.getElementById("m-duty");
const swBPreview = document.getElementById("sw-b-preview");
const btnScan = document.getElementById("btn-scan");
const demoTitleCells = [...document.querySelectorAll(".dt-cell")];

const chipMap = {
  alternation: { chip: document.querySelector('[data-pillar="alternation"]'), val: document.getElementById("chip-alt") },
  contrast: { chip: document.querySelector('[data-pillar="contrast"]'), val: document.getElementById("chip-con") },
  phase: { chip: document.querySelector('[data-pillar="phase"]'), val: document.getElementById("chip-pha") },
  order: { chip: document.querySelector('[data-pillar="order"]'), val: document.getElementById("chip-ord") },
};

// 初始化 8 拍按钮
const beatButtons = [];
for (let i = 0; i < 8; i++) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "beat-btn";
  btn.dataset.index = String(i);
  btn.innerHTML = `<span class="beat-idx">${i + 1}</span><span class="beat-char">A</span>`;
  btn.addEventListener("click", () => {
    flipBeat(i);
  });
  beatStrip.append(btn);
  beatButtons.push(btn);
}

let currentDiag = diagnose(state);
let scanPhase = 0.16;
let railWidth = 0;
let thumbWidth = 56;
let heroDirty = true;

function measureRail() {
  const r = phaseRail.getBoundingClientRect();
  railWidth = Math.max(1, r.width);
  thumbWidth = Math.max(48, railThumb.offsetWidth || 56);
}

function requestHeroRedraw() {
  heroDirty = true;
  if (!state.scanner || reducedMotion.matches) {
    heroLoop.draw();
  }
}

function syncHeroUI() {
  currentDiag = diagnose(state);
  const { passedCount, allPass, pillars, primary, metrics } = currentDiag;

  // 顶眉状态（仅值变化时写 DOM，拖动零冗余重排）
  setText(topStatus, allPass ? "4 / 4 节拍成立" : `${passedCount} / 4 待调拍`);
  if (topStatus.dataset.state !== (allPass ? "pass" : "fault")) {
    topStatus.dataset.state = allPass ? "pass" : "fault";
  }

  // 示范大标逐字随前 6 拍 A/B 实时黑白交替
  demoTitleCells.forEach((el, idx) => {
    const inv = state.beats[idx] === "B";
    if (el.classList.contains("is-inv") !== inv) el.classList.toggle("is-inv", inv);
  });

  // 四枚关键词实况徽
  for (const [key, ref] of Object.entries(chipMap)) {
    const p = pillars[key];
    const okStr = String(p.ok);
    if (ref.chip.dataset.ok !== okStr) ref.chip.dataset.ok = okStr;
    setText(ref.val, p.tag);
  }

  // 主诊断区
  if (diagPane.dataset.status !== primary.status) diagPane.dataset.status = primary.status;
  setText(diagBadge, primary.badge);
  setText(diagHead, primary.headline);
  setText(diagBody, primary.body);
  setText(diagAction, primary.action);

  setText(mPeriod, metrics.periodLabel);
  setText(mContrast, metrics.lumRatioText);
  setText(mPhase, metrics.phaseLabel);
  setText(mDuty, metrics.dutyLabel);

  // 相位轨读数与滑块位置（纯 GPU transform，零 layout 回流）
  if (!railWidth) measureRail();
  const frac = clamp(state.phaseDeg, 0, 180) / 180;
  const maxTravel = Math.max(0, railWidth - thumbWidth - 6);
  const tx = Math.round(3 + frac * maxTravel);
  railThumb.style.transform = `translate3d(${tx}px, 0, 0)`;
  setText(railThumbVal, `${metrics.phase}°`);
  const phaseStateText =
    metrics.phase >= 156 ? "原海报反相咬合" : metrics.phase <= 24 ? "同相齐列" : "层间错牙";
  setText(phaseReadout, `${metrics.phase}° · ${phaseStateText}`);
  const phOkStr = String(pillars.phase.ok);
  if (phaseReadout.dataset.ok !== phOkStr) phaseReadout.dataset.ok = phOkStr;
  setAttr(phaseRail, "aria-valuenow", metrics.phase);
  setAttr(phaseRail, "aria-valuetext", `${metrics.phase}度 ${phaseStateText}`);

  // 8 拍按钮带
  if (swBPreview.dataset.bg !== metrics.colorB) {
    swBPreview.dataset.bg = metrics.colorB;
    swBPreview.style.backgroundColor = metrics.colorB;
  }
  beatButtons.forEach((btn, i) => {
    const t = state.beats[i];
    if (btn.dataset.type !== t) {
      btn.dataset.type = t;
      btn.querySelector(".beat-char").textContent = t;
      btn.setAttribute("aria-label", `第 ${i + 1} 拍，当前 ${t === "A" ? "墨黑 A" : "米白 B"}，点按翻转`);
      btn.setAttribute("aria-pressed", String(t === "B"));
    }
    const sel = i === state.selectedBeat;
    if (btn.classList.contains("is-selected") !== sel) btn.classList.toggle("is-selected", sel);
  });

  // 滑杆读数
  if (parseFloat(slContrast.value) !== state.contrast) slContrast.value = String(state.contrast);
  setText(slContrastVal, metrics.lumRatioText);
  if (parseFloat(slDuty.value) !== state.dutyA) slDuty.value = String(state.dutyA);
  setText(slDutyVal, metrics.dutyLabel);

  // 模式按钮与扫拍开关
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    setAttr(btn, "aria-pressed", btn.dataset.mode === state.mode);
  });
  setAttr(btnScan, "aria-pressed", state.scanner);
  setText(btnScan, state.scanner ? "扫拍: 开" : "扫拍: 停");
}

function flipBeat(index) {
  state.mode = "normal";
  state.selectedBeat = index;
  state.beats[index] = state.beats[index] === "A" ? "B" : "A";
  syncHeroUI();
  requestHeroRedraw();
}

let cachedRailRect = null;
function setPhaseFromClientX(clientX, doSnap = false) {
  const rect = cachedRailRect || phaseRail.getBoundingClientRect();
  const frac = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  const raw = frac * 180;
  const next = doSnap ? snapPhase(raw) : Math.round(raw);
  if (next === state.phaseDeg && !doSnap) return;
  state.phaseDeg = next;
  syncHeroUI();
  requestHeroRedraw();
}

// 1) 相位滑移轨（data-perf-drag）：同时支持指针拖动、触屏拖动与键盘左右键
let railDragging = false;
phaseRail.addEventListener("pointerdown", (e) => {
  railDragging = true;
  cachedRailRect = phaseRail.getBoundingClientRect();
  railWidth = Math.max(1, cachedRailRect.width);
  if (phaseRail.setPointerCapture) {
    try { phaseRail.setPointerCapture(e.pointerId); } catch {}
  }
  setPhaseFromClientX(e.clientX, false);
});
phaseRail.addEventListener("pointermove", (e) => {
  if (!railDragging) return;
  setPhaseFromClientX(e.clientX, false);
});
const endRailDrag = (e) => {
  if (!railDragging) return;
  railDragging = false;
  if (e && typeof e.clientX === "number") setPhaseFromClientX(e.clientX, true);
  cachedRailRect = null;
};
phaseRail.addEventListener("pointerup", endRailDrag);
phaseRail.addEventListener("pointercancel", () => { railDragging = false; cachedRailRect = null; });

phaseRail.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 18 : 6;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.phaseDeg = clamp(state.phaseDeg - step, 0, 180);
    syncHeroUI();
    requestHeroRedraw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.phaseDeg = clamp(state.phaseDeg + step, 0, 180);
    syncHeroUI();
    requestHeroRedraw();
  }
});

// 2) 画布直点翻拍 + 横向直拖调相位 + 键盘切拍/翻转
let canvasDrag = null;
heroCanvas.addEventListener("pointerdown", (e) => {
  const rect = heroCanvas.getBoundingClientRect();
  canvasDrag = {
    id: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    startPhase: state.phaseDeg,
    px: e.clientX - rect.left,
    py: e.clientY - rect.top,
    moved: false,
    w: rect.width,
    h: rect.height,
  };
  if (heroCanvas.setPointerCapture) {
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!canvasDrag) return;
  const dx = e.clientX - canvasDrag.startX;
  const dy = e.clientY - canvasDrag.startY;
  if (!canvasDrag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
    canvasDrag.moved = true;
  }
  if (canvasDrag.moved) {
    const deltaDeg = (dx / Math.max(120, canvasDrag.w * 0.55)) * 180;
    const next = clamp(Math.round(canvasDrag.startPhase + deltaDeg), 0, 180);
    if (next !== state.phaseDeg) {
      state.phaseDeg = next;
      syncHeroUI();
      requestHeroRedraw();
    }
  }
});

heroCanvas.addEventListener("pointerup", (e) => {
  if (!canvasDrag) return;
  const info = canvasDrag;
  canvasDrag = null;
  if (info.moved) {
    state.phaseDeg = snapPhase(state.phaseDeg);
    syncHeroUI();
    requestHeroRedraw();
  } else {
    const rect = heroCanvas.getBoundingClientRect();
    const hit = hitTestHeroCanvas(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, state);
    flipBeat(hit.beatIndex);
  }
});
heroCanvas.addEventListener("pointercancel", () => { canvasDrag = null; });

heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.selectedBeat = (state.selectedBeat + 7) % 8;
    syncHeroUI();
    requestHeroRedraw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.selectedBeat = (state.selectedBeat + 1) % 8;
    syncHeroUI();
    requestHeroRedraw();
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    flipBeat(state.selectedBeat);
  }
});

// 3) 滑杆、模式按钮与快捷预设
slContrast.addEventListener("input", () => {
  state.contrast = parseFloat(slContrast.value);
  syncHeroUI();
  requestHeroRedraw();
});

slDuty.addEventListener("input", () => {
  state.dutyA = parseFloat(slDuty.value);
  syncHeroUI();
  requestHeroRedraw();
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    if (state.mode === "glare") {
      state.contrast = 1.0;
    }
    syncHeroUI();
    requestHeroRedraw();
  });
});

btnScan.addEventListener("click", () => {
  state.scanner = !state.scanner;
  syncHeroUI();
  heroLoop.draw();
});

document.getElementById("btn-solution").addEventListener("click", () => {
  Object.assign(state, POSTER_SOLUTION, { beats: [...POSTER_SOLUTION.beats] });
  syncHeroUI();
  requestHeroRedraw();
});

document.getElementById("btn-reset").addEventListener("click", () => {
  Object.assign(state, INITIAL_STATE, { beats: [...INITIAL_STATE.beats] });
  syncHeroUI();
  requestHeroRedraw();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESET_PATTERNS[btn.dataset.preset];
    if (!preset) return;
    state.mode = "normal";
    state.beats = [...preset.beats];
    syncHeroUI();
    requestHeroRedraw();
  });
});

const heroLoop = loop(heroCanvas, (_t, dt, { still }) => {
  const animateScan = !still && state.scanner;
  if (animateScan) {
    scanPhase = (scanPhase + dt * 0.28) % 1;
    heroDirty = true;
  }
  if (!heroDirty && !still) return;
  heroDirty = false;
  const { ctx, w, h } = sizeCanvas(heroCanvas);
  renderHeroLoom(ctx, w, h, state, currentDiag, scanPhase, { still });
});

measureCanvas(heroCanvas);
measureRail();
syncHeroUI();
heroLoop.draw();

// ==================== 01 节：三态节拍显微镜 ====================
const MICRO_DATA = {
  rep: {
    title: "AAAA 纯重复：视线匀速滑过，3 格之后开始视觉钝化",
    desc: "每一拍形状与明暗完全一致，零对比、零起伏。虽然最整齐，却最容易失去节奏张力——它更接近 107 重复原则，而非交替节奏。",
    seq: ["A", "A", "A", "A", "A", "A", "A", "A"],
    arcMode: "flat",
  },
  alt: {
    title: "ABAB 周期交替：视线弹跳、大脑自动预判下一拍",
    desc: "每跨越一拍，明暗和形态同步翻转一次，眼睛像踩着等距节拍器前进：第 1–2 拍建立预期，第 3–8 拍零成本顺读，既稳又有弹力。",
    seq: ["A", "B", "A", "B", "A", "B", "A", "B"],
    arcMode: "bounce",
  },
  rnd: {
    title: "AABA 乱跳：连拍长短毫无规律，视线反复急刹重算",
    desc: "A 与 B 虽然都出现了，但没有稳定周期。大脑刚以为下一个该换 B，结果又撞上连 A，预期落空导致视觉游移和认知疲惫。",
    seq: ["A", "A", "B", "A", "B", "B", "B", "A"],
    arcMode: "jagged",
  },
};

const microTitle = document.getElementById("micro-title");
const microDesc = document.getElementById("micro-desc");
const microSvgWrap = document.getElementById("micro-svg-wrap");

function renderMicroscope(key) {
  const item = MICRO_DATA[key] || MICRO_DATA.alt;
  microTitle.textContent = item.title;
  microDesc.textContent = item.desc;

  const W = 760;
  const H = 132;
  const step = 88;
  const startX = 68;
  const cy = 84;

  let shapes = "";
  let pathD = "";
  item.seq.forEach((t, i) => {
    const x = startX + i * step;
    if (t === "A") {
      shapes += `<rect x="${x - 22}" y="${cy - 22}" width="44" height="44" fill="#070706"/>`;
    } else {
      shapes += `<circle cx="${x}" cy="${cy}" r="22" fill="#FC4E0B" stroke="#070706" stroke-width="2"/>`;
    }
    shapes += `<text x="${x}" y="124" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" fill="#524B43">${t}</text>`;

    if (i < item.seq.length - 1) {
      const nx = x + step;
      if (item.arcMode === "flat") {
        pathD += `<line x1="${x + 24}" y1="34" x2="${nx - 24}" y2="34" stroke="#524B43" stroke-width="2" stroke-dasharray="4 4"/>`;
      } else if (item.arcMode === "bounce") {
        const mx = (x + nx) * 0.5;
        pathD += `<path d="M${x} 52 Q${mx} 12 ${nx} 52" fill="none" stroke="#A82900" stroke-width="2.4"/>`;
      } else {
        const same = item.seq[i] === item.seq[i + 1];
        const mx = (x + nx) * 0.5;
        const peak = same ? 46 : 12;
        const col = same ? "#524B43" : "#A82900";
        pathD += `<path d="M${x} 52 L${mx} ${peak} L${nx} 52" fill="none" stroke="${col}" stroke-width="2.2" ${same ? 'stroke-dasharray="3 3"' : ""}/>`;
      }
    }
  });

  microSvgWrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${item.title}">${pathD}${shapes}</svg>`;
}

document.getElementById("micro-tabs").addEventListener("change", (e) => {
  if (e.target && e.target.name === "micro") renderMicroscope(e.target.value);
});
renderMicroscope("alt");

// ==================== 02 节：五维度通道叠加 ====================
const activeChannels = new Set(["value", "shape"]);
const chContainer = document.getElementById("channel-checks");
const sec2Canvas = document.getElementById("sec2-canvas");
const chReadout = document.getElementById("channel-readout");
const crTag = document.getElementById("cr-tag");
const crMeter = document.getElementById("cr-meter");
const crTitle = document.getElementById("cr-title");
const crText = document.getElementById("cr-text");

function syncChannels() {
  const res = diagnoseChannels(activeChannels);
  chReadout.dataset.level = res.level;
  crTag.textContent = res.tag;
  crMeter.textContent = `已开 ${activeChannels.size} / 5 维`;
  crTitle.textContent = res.title;
  crText.textContent = res.text;
  chContainer.querySelectorAll(".ch-item").forEach((lbl) => {
    const id = lbl.dataset.id;
    lbl.classList.toggle("is-on", activeChannels.has(id));
  });
  const { ctx, w, h } = sizeCanvas(sec2Canvas);
  renderChannelMatrix(ctx, w, h, activeChannels);
}

DIMENSIONS.forEach((dim) => {
  const lbl = document.createElement("label");
  lbl.className = "ch-item";
  lbl.dataset.id = dim.id;
  lbl.innerHTML = `
    <input type="checkbox" ${activeChannels.has(dim.id) ? "checked" : ""}>
    <span class="ch-text">
      <span class="ch-head">${dim.name}<span class="ch-en" lang="en">${dim.en}</span></span>
      <span class="ch-desc">${dim.desc}</span>
    </span>
  `;
  const input = lbl.querySelector("input");
  input.addEventListener("change", () => {
    if (input.checked) activeChannels.add(dim.id);
    else activeChannels.delete(dim.id);
    syncChannels();
  });
  chContainer.append(lbl);
});
syncChannels();

// ==================== 03 节：拍型与错相织机 ====================
let curMeter = "ab";
let counterPhase03 = true;

const loom03Svg = document.getElementById("loom03-svg");
const lnCode = document.getElementById("ln-code");
const lnDesc = document.getElementById("ln-desc");
const phaseLever = document.getElementById("phase-lever");
const leverLabel = document.getElementById("lever-label");

function renderLoom03() {
  const m = METERS[curMeter];
  const topRow = m.seq;
  const botRow = counterPhase03 ? topRow.map((t) => (t === "A" ? "B" : "A")) : [...topRow];

  const W = 540;
  const H = 200;
  const padX = 24;
  const cellW = (W - padX * 2) / 6;
  let body = "";

  // 180° 反相时画出柔和斜向导流虚线，直观展示二次斜向韵律
  if (counterPhase03) {
    for (let i = 0; i < 5; i++) {
      if (topRow[i] === botRow[i + 1]) {
        const x1 = padX + (i + 0.5) * cellW;
        const x2 = padX + (i + 1.5) * cellW;
        body += `<line x1="${x1}" y1="54" x2="${x2}" y2="146" stroke="#070706" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.55"/>`;
      }
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const x = padX + (i + 0.5) * cellW;
      body += `<line x1="${x}" y1="54" x2="${x}" y2="146" stroke="#070706" stroke-width="1.4" stroke-dasharray="3 4" opacity="0.4"/>`;
    }
  }

  topRow.forEach((t, i) => {
    const cx = padX + (i + 0.5) * cellW;
    const fill = t === "A" ? "#070706" : "#F5E4CC";
    body += `<circle cx="${cx}" cy="54" r="28" fill="${fill}"/>`;
  });

  botRow.forEach((t, i) => {
    const cx = padX + (i + 0.5) * cellW;
    const fill = t === "A" ? "#070706" : "#F5E4CC";
    body += `<polygon points="${cx},116 ${cx + 30},176 ${cx - 30},176" fill="${fill}"/>`;
  });

  loom03Svg.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${m.name} 双轨排布">${body}</svg>`;

  phaseLever.setAttribute("aria-pressed", String(counterPhase03));
  leverLabel.textContent = counterPhase03
    ? "下轨相位：180° 反相咬合（点按切 0° 同相）"
    : "下轨相位：0° 同相齐列（点按切 180° 反相）";

  lnCode.textContent = `上轨 ${topRow.join("-")} · 下轨 ${botRow.join("-")}（${counterPhase03 ? "180° 反相" : "0° 同相"}）`;
  lnDesc.textContent =
    m.feel +
    (counterPhase03
      ? "下轨翻转反相后，上下异极互锁，斜向动势随之浮现。"
      : "上下轨同极对齐时，画面变成稳固的竖向列阵，克制庄重但斜向流动感收敛。");
}

document.getElementById("meter-picker").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-meter]");
  if (!btn) return;
  curMeter = btn.dataset.meter;
  document.querySelectorAll("[data-meter]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b === btn));
  });
  renderLoom03();
});

phaseLever.addEventListener("click", () => {
  counterPhase03 = !counterPhase03;
  renderLoom03();
});
renderLoom03();

// ==================== 04 节：历史标本抽屉 ====================
const HISTORY_DATA = {
  "1093": {
    meta: "1093 · 诺曼罗马式建筑 · UNESCO No. 370",
    title: "达勒姆大教堂：一重一轻的双跨交替柱式",
    text: "始建于 1093 年的英国达勒姆大教堂（Durham Cathedral），中殿拱廊没有把一模一样的石柱一路排到底，而是采用「交替支撑体系（alternating system）」——粗壮的复合柱墩与刻满菱纹、人字纹的巨大圆柱一重一轻轮流承重。它既分担了早期石造肋拱的推力，也让步入中殿的人在长廊里读出清晰的双跨行进节拍。",
    takeaway: "给版面的启发：结构交替可以同时承担功能分级——重拍扛骨架，轻拍给呼吸。",
    svg: `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#F5E4CC"/>
      <path d="M16 156H264" stroke="#070706" stroke-width="3"/>
      <path d="M36 90 A36 36 0 0 1 108 90 M108 90 A36 36 0 0 1 180 90 M180 90 A36 36 0 0 1 252 90" fill="none" stroke="#070706" stroke-width="3"/>
      <rect x="26" y="74" width="22" height="82" fill="#070706"/>
      <rect x="98" y="88" width="20" height="68" fill="#FC4E0B" stroke="#070706" stroke-width="2"/>
      <path d="M98 102l20 12m-20 4l20 12m-20 4l20 12" stroke="#070706" stroke-width="1.5"/>
      <rect x="170" y="74" width="22" height="82" fill="#070706"/>
      <rect x="242" y="88" width="20" height="68" fill="#FC4E0B" stroke="#070706" stroke-width="2"/>
      <path d="M242 102l20 12m-20 4l20 12m-20 4l20 12" stroke="#070706" stroke-width="1.5"/>
      <text x="37" y="42" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" fill="#070706">A 墩</text>
      <text x="108" y="42" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" fill="#A82900">B 柱</text>
      <text x="181" y="42" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" fill="#070706">A 墩</text>
      <text x="252" y="42" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" fill="#A82900">B 柱</text>
    </svg>`,
  },
  "1907": {
    meta: "1907 · Houghton, Mifflin and Company · 现代设计理论",
    title: "登曼·罗斯：把节奏与交替写进形式法则",
    text: "哈佛艺术理论家登曼·罗斯（Denman Waldo Ross）在 1907 年出版《纯粹设计理论》（A Theory of Pure Design: Harmony, Balance, Rhythm），将和谐、平衡、节奏定为视觉秩序的三根支柱。他用几何序列图证明：当两个相异单元按固定步距轮替出现，眼睛会沿着周期自动产生连贯运动。",
    takeaway: "给版面的启发：节奏不是装饰灵感，而是可推导的序列数学。",
    svg: `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#F5E4CC"/>
      <line x1="20" y1="90" x2="260" y2="90" stroke="#070706" stroke-width="1.5" stroke-dasharray="4 4"/>
      <rect x="24" y="46" width="28" height="88" fill="#070706"/>
      <circle cx="80" cy="90" r="18" fill="#FC4E0B" stroke="#070706" stroke-width="2"/>
      <rect x="112" y="46" width="28" height="88" fill="#070706"/>
      <circle cx="168" cy="90" r="18" fill="#FC4E0B" stroke="#070706" stroke-width="2"/>
      <rect x="200" y="46" width="28" height="88" fill="#070706"/>
      <circle cx="252" cy="90" r="14" fill="#FC4E0B" stroke="#070706" stroke-width="2"/>
      <path d="M38 30 Q59 10 80 30 T126 30 T168 30 T214 30" fill="none" stroke="#A82900" stroke-width="2.2"/>
    </svg>`,
  },
  "1964": {
    meta: "1964 · MoMA 藏品 576.1964 · 148.1 × 149.3 cm",
    title: "布里奇特·莱利《涌流》：静止波纹的光学脉动",
    text: "英国光效应艺术代表人物布里奇特·莱利（Bridget Riley）于 1964 年创作板画《涌流》（Current），并于次年登上纽约现代艺术博物馆里程碑展览「响应式之眼」（The Responsive Eye, 1965）画册封面。整幅画只靠密集的黑白交替波浪线，就让静止平面涌出强烈的震颤与流动幻觉——同时也揭示了高反差密排交替的感知极限。",
    takeaway: "给版面的启发：黑白波纹交替能量极强，海报吸睛好用，长文底纹慎用。",
    svg: `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#F5E4CC"/>
      ${Array.from({ length: 11 }, (_, i) => {
        const y = 16 + i * 15;
        const amp = i >= 3 && i <= 7 ? 10 : 5;
        return `<path d="M12 ${y} Q56 ${y - amp} 100 ${y} T188 ${y} T268 ${y}" fill="none" stroke="${i % 2 === 0 ? "#070706" : "#FC4E0B"}" stroke-width="5"/>`;
      }).join("")}
    </svg>`,
  },
  "1965": {
    meta: "1965 · Wesleyan University Press · 包豪斯织造谱",
    title: "安妮·阿尔伯斯《论编织》：经纬上下的二元母体",
    text: "出身包豪斯的织物大师安妮·阿尔伯斯（Anni Albers）在 1965 年出版《论编织》（On Weaving）。无论是最朴素的平纹（1 上 1 下）还是复杂的斜纹与提花，纺织机的本质就是经线与纬线在 0 与 1 之间的严格交替——两根丝线一压一挑，才撑得起一整张柔软却坚固的布面。",
    takeaway: "给版面的启发：把页面看成织物网格，黑白与留白一挑一压才能互相托住。",
    svg: `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#F5E4CC"/>
      ${Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => {
          const isA = (r + c) % 2 === 0;
          return `<rect x="${22 + c * 26}" y="${18 + r * 24}" width="22" height="20" fill="${isA ? "#070706" : "#FC4E0B"}" opacity="${isA ? 1 : 0.85}"/>`;
        }).join("")
      ).join("")}
    </svg>`,
  },
  "1972": {
    meta: "1972 & 1979 · 平面与建筑基础教科书标准",
    title: "王无邪与程大锦：把交替节奏编入现代教学体系",
    text: "王无邪（Wucius Wong）在 1972 年《平面设计原理》（Principles of Two-Dimensional Design）里拆解了重复格网中通过形、色、向翻转形成的交替律动；程大锦（Francis D. K. Ching）在 1979 年首版《建筑：形式、空间和秩序》（Architecture: Form, Space, and Order）中把「规则交替」与重复并列为空间组织的核心韵律手法，奠定了今天排版教学的通用语言。",
    takeaway: "给版面的启发：把交替和模数网格叠加，能同时拿到建筑般的秩序与版画般的活力。",
    svg: `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#F5E4CC"/>
      <rect x="20" y="24" width="240" height="40" fill="none" stroke="#070706" stroke-width="1.5"/>
      <rect x="20" y="24" width="60" height="40" fill="#070706"/>
      <rect x="80" y="24" width="60" height="40" fill="#FC4E0B"/>
      <rect x="140" y="24" width="60" height="40" fill="#070706"/>
      <rect x="200" y="24" width="60" height="40" fill="#FC4E0B"/>
      <rect x="20" y="80" width="240" height="76" fill="none" stroke="#070706" stroke-width="1.5"/>
      <line x1="80" y1="80" x2="80" y2="156" stroke="#070706" stroke-dasharray="3 3"/>
      <line x1="140" y1="80" x2="140" y2="156" stroke="#070706" stroke-dasharray="3 3"/>
      <line x1="200" y1="80" x2="200" y2="156" stroke="#070706" stroke-dasharray="3 3"/>
      <circle cx="50" cy="118" r="18" fill="#FC4E0B"/><rect x="94" y="100" width="32" height="36" fill="#070706"/>
      <circle cx="170" cy="118" r="18" fill="#FC4E0B"/><rect x="214" y="100" width="32" height="36" fill="#070706"/>
    </svg>`,
  },
};

const histFig = document.getElementById("hist-fig");
const histMeta = document.getElementById("hist-meta");
const histTitle = document.getElementById("hist-title");
const histText = document.getElementById("hist-text");
const histTakeaway = document.getElementById("hist-takeaway");

function renderHistory(era) {
  const h = HISTORY_DATA[era] || HISTORY_DATA["1093"];
  histFig.innerHTML = h.svg;
  histMeta.textContent = h.meta;
  histTitle.textContent = h.title;
  histText.textContent = h.text;
  histTakeaway.innerHTML = `<strong>给版面的启发：</strong>${h.takeaway.replace(/^给版面的启发：/, "")}`;
}

document.getElementById("history-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-era]");
  if (!btn) return;
  document.querySelectorAll("[data-era]").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
  renderHistory(btn.dataset.era);
});
renderHistory("1093");

// ==================== 05 节：真实版面标本 ====================
let realScene = "zigzag";
let realLevel = "good";

const REAL_CAPTIONS = {
  zigzag: {
    off: "关闭交替：三行清一色左图右文、同色块，长页面扫到第 3 行就像读一条停不下来的流水账。",
    good: "恰当交替：左右交替让 3 条卖点自然走出 Z 字浏览轨，配图与文字在视线折返点无缝衔接。",
    over: "过度交替：同时切底色、切倾斜角度又切对齐，用户每读一行都要重新适应一套视觉风格，可信度直线下降。",
  },
  zebra: {
    off: "关闭交替：全白底宽表格缺乏横向导轨，眼睛从左侧编号追到最右侧载体列时极易串行。",
    good: "恰当交替：偶数行只加约 4%–6% 的极浅暖灰米底，既稳稳托住宽行视线，又不抢文字对比。",
    over: "过度交替：黑白极高反差斑马纹把每行切成互不相干的孤条，表格读起来像在盯条形码，极易眼花。",
  },
  spread: {
    off: "关闭交替：连排四页同密度白底文稿，读者翻到第三页就出现审美疲劳，缺少章节呼吸点。",
    good: "恰当交替：浅米细读页与深黑满幅图版页一松一紧交替，每翻一页都重新唤醒注意力。",
    over: "过度交替：四页用了四种截然不同的底色与条纹，连基本画册统一感都丢掉了。",
  },
};

const realFrame = document.getElementById("real-frame");
const realCaption = document.getElementById("real-caption");

function syncRealLayout() {
  realFrame.dataset.scene = realScene;
  realFrame.dataset.level = realLevel;
  realFrame.querySelectorAll("[data-specimen]").forEach((el) => {
    el.hidden = el.dataset.specimen !== realScene;
  });
  realCaption.textContent = REAL_CAPTIONS[realScene][realLevel];
}

document.getElementById("real-scene-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-scene]");
  if (!btn) return;
  realScene = btn.dataset.scene;
  document.querySelectorAll("[data-scene]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  syncRealLayout();
});

document.getElementById("real-level-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-level]");
  if (!btn) return;
  realLevel = btn.dataset.level;
  document.querySelectorAll("[data-level]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  syncRealLayout();
});
syncRealLayout();

// ==================== 06 节：背景眩光压测 ====================
const glareFreq = document.getElementById("glare-freq");
const glareAmp = document.getElementById("glare-amp");
const glareFreqVal = document.getElementById("glare-freq-val");
const glareAmpVal = document.getElementById("glare-amp-val");
const glarePreview = document.getElementById("glare-preview");
const glareVerdict = document.getElementById("glare-verdict");

function syncGlare() {
  const f = Number(glareFreq.value);
  const a = Number(glareAmp.value);
  glarePreview.style.setProperty("--g-freq", String(f));
  glarePreview.style.setProperty("--g-alpha", (a / 100).toFixed(2));

  const fDesc = f <= 10 ? "舒朗" : f <= 18 ? "偏密" : "高频刺眼";
  const aDesc = a <= 24 ? "温和" : a <= 52 ? "较强" : "强反差";
  glareFreqVal.textContent = `${f} 条 · ${fDesc}`;
  glareAmpVal.textContent = `${a}% · ${aDesc}`;

  if (f >= 18 && a >= 48) {
    glareVerdict.textContent = `进入高危眩光带（${f} 条 × ${a}% 反差）：边缘与背景条纹剧烈互抢，正文变得费眼——高密度装饰底纹必须大幅压低对比度。`;
  } else if (f >= 16 || a >= 56) {
    glareVerdict.textContent = `临界预警（${f} 条 × ${a}% 反差）：背景已经开始分走注意力，长文阅读区建议把反差压到 20% 以下或改用纯底。`;
  } else {
    glareVerdict.textContent = `安全舒朗区（${f} 条 × ${a}% 反差）：条纹宽疏且反差克制，作为章节背景不会干扰汉字阅读。`;
  }
}

glareFreq.addEventListener("input", syncGlare);
glareAmp.addEventListener("input", syncGlare);
syncGlare();

// ==================== 07 节：练一练（单一变量四选一） ====================
const quizGrid = document.getElementById("quiz-grid");
const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");
const btnQuizReset = document.getElementById("btn-quiz-reset");

const quizItems = [];

QUIZ_OPTIONS.forEach((opt) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "quiz-card";
  btn.dataset.opt = opt.id;
  btn.setAttribute("aria-pressed", "false");
  btn.innerHTML = `
    <canvas class="quiz-canvas" aria-hidden="true"></canvas>
    <div class="quiz-foot">
      <span>${opt.label}</span>
      <span class="quiz-tag" hidden>${opt.tag}</span>
    </div>
  `;
  btn.addEventListener("click", () => selectQuiz(opt.id));
  quizGrid.append(btn);
  quizItems.push({ opt, btn, canvas: btn.querySelector("canvas"), tag: btn.querySelector(".quiz-tag") });
});

function drawQuizCanvases() {
  quizItems.forEach(({ opt, canvas }) => {
    const { ctx, w, h } = sizeCanvas(canvas);
    renderQuizCanvas(ctx, w, h, opt.state);
  });
}

function selectQuiz(chosenId) {
  const chosen = QUIZ_OPTIONS.find((o) => o.id === chosenId);
  if (!chosen) return;

  quizItems.forEach(({ opt, btn, tag }) => {
    btn.setAttribute("aria-pressed", String(opt.id === chosenId));
    tag.hidden = false;
    btn.dataset.result = opt.correct ? "correct" : opt.id === chosenId ? "wrong" : "";
  });

  quizVerdict.dataset.state = chosen.correct ? "correct" : "wrong";
  qvTitle.textContent = chosen.correct
    ? `选对了：${chosen.label} 四项交替规律同时成立`
    : `选的是 ${chosen.label}（${chosen.tag}）——再看一眼 ${QUIZ_OPTIONS.find((o) => o.correct).label}`;
  qvBody.textContent = chosen.reason;
  btnQuizReset.hidden = false;
}

btnQuizReset.addEventListener("click", () => {
  quizItems.forEach(({ btn, tag }) => {
    btn.setAttribute("aria-pressed", "false");
    btn.dataset.result = "";
    tag.hidden = true;
  });
  quizVerdict.dataset.state = "idle";
  qvTitle.textContent = "先凭眼睛选一份。";
  qvBody.textContent = "提示：用开场学过的四把尺子——周期、对比、层间相位与拍宽比例——逐一扫过四张图。";
  btnQuizReset.hidden = true;
});

drawQuizCanvases();

// ==================== 08 节：原海报放大弹窗（单次内联复用 + 拖拽平移 + Esc） ====================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const posterDialog = document.getElementById("poster-dialog");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbPct = document.getElementById("lb-pct");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbPct.textContent = `${Math.round(lbScale * 100)}%`;
}

function resetLightbox() {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
}

posterTrigger.addEventListener("click", () => {
  if (!lbImg.src) lbImg.src = posterImg.src;
  resetLightbox();
  if (typeof posterDialog.showModal === "function") posterDialog.showModal();
  else posterDialog.setAttribute("open", "");
});

document.getElementById("lb-close").addEventListener("click", () => {
  if (typeof posterDialog.close === "function") posterDialog.close();
  else posterDialog.removeAttribute("open");
});

document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 1, 3.2);
  applyLightboxTransform();
});

document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 1, 3.2);
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  applyLightboxTransform();
});

document.getElementById("lb-reset").addEventListener("click", resetLightbox);

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  applyLightboxTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { x: e.clientX - lbTx, y: e.clientY - lbTy };
  if (lbStage.setPointerCapture) {
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  }
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbDrag.x;
  lbTy = e.clientY - lbDrag.y;
  applyLightboxTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

posterDialog.addEventListener("click", (e) => {
  if (e.target === posterDialog) posterDialog.close();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && posterDialog.open) {
    e.preventDefault();
    posterDialog.close();
  }
});

// ==================== 窗口尺寸变化重绘所有 2D 画布 ====================
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measureCanvas(heroCanvas);
    measureCanvas(sec2Canvas);
    quizItems.forEach(({ canvas }) => measureCanvas(canvas));
    measureRail();
    syncHeroUI();
    heroDirty = true;
    heroLoop.draw();
    syncChannels();
    drawQuizCanvases();
  }, 80);
});

reducedMotion.addEventListener("change", () => {
  heroDirty = true;
  heroLoop.draw();
});
