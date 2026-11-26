// 174 过渡系统 · 页面主入口：联动 Hero 单真源诊断、三色线探针、左下活体圆徽与 01–07 节
import { PAL, clamp, lerp } from "./palette.js";
import { MORPH_NAMES, PRESETS, SPECIMENS, computeGeometry, createState, evaluate } from "./model.js";
import { mountWorkbench } from "./workbench.js";
import {
  mountPosterLightbox,
  mountSection01,
  mountSection02,
  mountSection03,
  mountSection04,
  mountSection05,
  mountSection06,
} from "./sections.js";

const state = createState();
const canvas = document.getElementById("hero-canvas");

// UI 节点引用
const topBadge = document.getElementById("hero-status-badge");
const cohesionSlider = document.getElementById("ctrl-cohesion");
const cohesionVal = document.getElementById("ctrl-cohesion-val");
const scaleSlider = document.getElementById("ctrl-stage-scale");
const scaleVal = document.getElementById("ctrl-stage-scale-val");
const stageNameEl = document.getElementById("ctrl-stage-label");
const guidesBtn = document.getElementById("ctrl-guides");
const pulseBtn = document.getElementById("ctrl-pulse");
const fixBtn = document.getElementById("diag-fix");
const diagBadge = document.getElementById("diag-badge");
const diagHead = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const diagSummary = document.getElementById("diag-summary-tag");
const mTotal = document.getElementById("m-total-ratio");
const mStep = document.getElementById("m-step-range");
const mBridge = document.getElementById("m-bridge");
const mFocus = document.getElementById("m-focus-share");
const emblemSvg = document.getElementById("emblem-live-svg");
const emblemLadder = document.getElementById("emblem-ladder");

const probeRefs = {
  connection: {
    bar: document.getElementById("probe-conn-fill"),
    tag: document.getElementById("probe-conn-tag"),
    row: document.getElementById("probe-conn"),
  },
  progression: {
    bar: document.getElementById("probe-prog-fill"),
    tag: document.getElementById("probe-prog-tag"),
    row: document.getElementById("probe-prog"),
  },
  flow: {
    bar: document.getElementById("probe-flow-fill"),
    tag: document.getElementById("probe-flow-tag"),
    row: document.getElementById("probe-flow"),
  },
};

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const stageBtns = [...document.querySelectorAll("[data-stage-pick]")];
const colorBtns = [...document.querySelectorAll("[data-color-mode]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

// 同步左下原海报同款细黑圆环徽标 □·○◯→（随画布四阶实绘形态与尺度活体变形！）
function renderEmblem(geom, ev) {
  if (!emblemSvg) return;
  const xs = [20, 35, 52, 74];
  const maxR = Math.max(...geom.radii, 1);
  const shapes = geom.radii.map((r, i) => {
    const nr = clamp((r / maxR) * 12.5, 3.2, 13.5);
    const m = state.morphs[i];
    const rx = (nr * m).toFixed(1);
    const x = xs[i];
    const y = 46;
    const stroke = ev.isSolved ? PAL.ink : ev.defects.some((d) => d.stage === i) ? PAL.errLight : PAL.ink;
    return `<rect x="${(x - nr).toFixed(1)}" y="${(y - nr).toFixed(1)}" width="${(nr * 2).toFixed(1)}" height="${(nr * 2).toFixed(1)}" rx="${rx}" fill="none" stroke="${stroke}" stroke-width="1.35"/>`;
  }).join("");

  emblemSvg.innerHTML = `
    <circle cx="48" cy="48" r="44" fill="none" stroke="${PAL.ink}" stroke-width="1.45"/>
    ${shapes}
    <path d="M 67 68 L 79 68 M 75 64 L 79 68 L 75 72" fill="none" stroke="${ev.isSolved ? PAL.okLight : PAL.ink}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  // 四阶实测柱梯（直观映照当前比例曲线）
  if (emblemLadder) {
    emblemLadder.innerHTML = geom.radii.map((r, i) => {
      const pct = Math.round(clamp((r / maxR) * 100, 14, 100));
      const rel = i === 0 ? "1.0×" : `${(r / Math.max(1, geom.radii[0])).toFixed(1)}×`;
      const mSym = (MORPH_NAMES[state.morphs[i]] || MORPH_NAMES[1]).sym;
      return `
        <div class="ladder-col ${state.selectedStage === i ? "is-sel" : ""}">
          <span class="ladder-val">${rel}</span>
          <div class="ladder-track"><span class="ladder-bar ladder-c${i}" style="height:${pct}%"></span></div>
          <span class="ladder-idx">0${i + 1}${mSym}</span>
        </div>
      `;
    }).join("");
  }
}

function syncUI() {
  const rect = canvas.getBoundingClientRect();
  const geom = computeGeometry(state, Math.max(300, rect.width || 900), Math.max(220, rect.height || 380));
  const ev = evaluate(state, geom);

  // 顶部状态章
  topBadge.textContent = ev.badge;
  topBadge.dataset.ok = String(ev.isSolved);

  // 原海报右上三阶彩色细线探针
  for (const key of ["connection", "progression", "flow"]) {
    const p = ev.probes[key];
    const ref = probeRefs[key];
    if (!ref || !ref.bar) continue;
    ref.bar.style.width = `${Math.round(clamp(p.fill, 0.14, 1) * 100)}%`;
    ref.tag.textContent = p.tag;
    ref.row.dataset.ok = String(p.ok);
  }

  // 滑块与阶段选择器同步
  const pct = Math.round(state.cohesion * 100);
  cohesionSlider.value = String(pct);
  cohesionVal.textContent = `${pct}%`;

  const idx = state.selectedStage;
  const specStage = SPECIMENS[state.specimen].stages[idx];
  stageNameEl.textContent = `0${idx + 1} ${specStage.name}尺度`;
  scaleSlider.value = String(Math.round(state.scales[idx] * 100));
  scaleVal.textContent = `${state.scales[idx].toFixed(2)}×`;

  stageBtns.forEach((b) => {
    const on = Number(b.dataset.stagePick) === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  colorBtns.forEach((b) => {
    const on = b.dataset.colorMode === state.colorMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  specimenBtns.forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  guidesBtn.textContent = state.showGuides ? "标尺: 开" : "标尺: 关";
  guidesBtn.setAttribute("aria-pressed", String(state.showGuides));

  // 深曜石单真源诊单舱
  diagBadge.textContent = ev.badge;
  diagBadge.dataset.ok = String(ev.isSolved);
  diagHead.textContent = ev.headline;
  diagBody.textContent = ev.body;
  diagHint.textContent = ev.hint;
  diagSummary.textContent = ev.isSolved ? `${ev.solveTag}（示意）` : `存在 ${ev.defects.length} 处断层（示意）`;
  fixBtn.textContent = ev.fixLabel;
  fixBtn.dataset.ok = String(ev.isSolved);

  mTotal.textContent = ev.metrics.totalRatioText;
  mStep.textContent = ev.metrics.stepRangeText;
  mBridge.textContent = ev.metrics.bridgeText;
  mFocus.textContent = ev.metrics.focusShareText;

  // 活体圆环徽标
  renderEmblem(geom, ev);
}

let syncRaf = 0;
function scheduleSync() {
  if (syncRaf) return;
  syncRaf = requestAnimationFrame(() => {
    syncRaf = 0;
    syncUI();
  });
}

const bench = mountWorkbench(canvas, state, (reason) => {
  if (reason === "cohesion" || reason === "scale") scheduleSync();
  else syncUI();
});

// 绑定所有控件
specimenBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.specimen = b.dataset.specimen;
    syncUI();
    bench.draw();
  });
});

cohesionSlider.addEventListener("input", () => {
  state.cohesion = Number(cohesionSlider.value) / 100;
  syncUI();
  bench.draw();
});

scaleSlider.addEventListener("input", () => {
  state.scales[state.selectedStage] = Number((Number(scaleSlider.value) / 100).toFixed(2));
  syncUI();
  bench.draw();
});

stageBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.selectedStage = Number(b.dataset.stagePick);
    syncUI();
    bench.draw();
  });
});

colorBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.colorMode = b.dataset.colorMode;
    syncUI();
    bench.draw();
  });
});

guidesBtn.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI();
  bench.draw();
});

pulseBtn.addEventListener("click", () => {
  bench.firePulse();
});

fixBtn.addEventListener("click", () => {
  const snap = bench.getSnapshot();
  if (snap.ev && snap.ev.isSolved) {
    bench.firePulse();
    return;
  }
  const patch = PRESETS.classic.patch;
  state.cohesion = patch.cohesion;
  state.scales = [...patch.scales];
  state.morphs = [...patch.morphs];
  state.colorMode = patch.colorMode;
  syncUI();
  bench.draw();
  bench.firePulse();
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    state.cohesion = p.patch.cohesion;
    state.scales = [...p.patch.scales];
    state.morphs = [...p.patch.morphs];
    state.colorMode = p.patch.colorMode;
    syncUI();
    bench.draw();
  });
});

// 窗口尺寸变化时重同步画布与单真源读数
window.addEventListener("resize", () => {
  syncUI();
  bench.draw();
});

// 挂载正文 01–07 互动模块
syncUI();
mountSection01();
mountSection02();
mountSection03();
mountSection04();
mountSection05();
mountSection06();
mountPosterLightbox();
