// 109 节奏组织 — 主入口：串联单一真源模型、全幅斜轴乐谱、原海报双钴蓝框活体图示与 01–08 节交互
import {
  ACCENT_PATTERNS,
  BEAT_COUNT,
  CURVES,
  HERO_TRYOUTS,
  LEVEL_META,
  createInitialState,
} from "./model.js";
import { createHeroStage } from "./hero-stage.js";
import {
  initAccentSection,
  initCompareSection,
  initDontUseSection,
  initGapBoardSection,
  initHistorySection,
  initLayoutSandbox,
  initPosterModal,
  initQuizSection,
} from "./sections.js";

const state = createInitialState();

const dom = {
  heroCanvas: document.getElementById("hero-canvas"),
  railEl: document.getElementById("tension-rail"),
  thumbEl: document.getElementById("tension-thumb"),
  railFillEl: document.getElementById("tension-fill"),
  railReadoutEl: document.getElementById("tension-readout"),
  topScore: document.getElementById("top-score"),
  heroTitle: document.getElementById("hero-title"),
  titleBars: [...document.querySelectorAll("[data-title-bar]")],

  // 四词实况带
  pillarStatus: {
    interval: document.getElementById("pillar-interval"),
    accent: document.getElementById("pillar-accent"),
    tempo: document.getElementById("pillar-tempo"),
    continuity: document.getElementById("pillar-continuity"),
  },
  pillarCards: {
    interval: document.querySelector('[data-pillar="interval"]'),
    accent: document.querySelector('[data-pillar="accent"]'),
    tempo: document.querySelector('[data-pillar="tempo"]'),
    continuity: document.querySelector('[data-pillar="continuity"]'),
  },

  // 原海报双钴蓝框活体微缩 SVG
  iconAccent: document.getElementById("poster-icon-accent"),
  iconInterval: document.getElementById("poster-icon-interval"),

  // 白话诊单与 4 项单源读数
  diagBox: document.getElementById("diag-box"),
  diagBadge: document.getElementById("diag-badge"),
  diagHead: document.getElementById("diag-head"),
  diagBody: document.getElementById("diag-body"),
  diagHint: document.getElementById("diag-hint"),
  mInterval: document.getElementById("m-interval"),
  mAccent: document.getElementById("m-accent"),
  mTempo: document.getElementById("m-tempo"),
  mBreak: document.getElementById("m-break"),

  // 拍位微操与波形控制
  selIndexLabel: document.getElementById("sel-beat-label"),
  btnPrevBeat: document.getElementById("beat-prev"),
  btnNextBeat: document.getElementById("beat-next"),
  levelBtns: [...document.querySelectorAll("[data-set-level]")],
  patternBtns: [...document.querySelectorAll("[data-accent-pattern]")],
  curveBtns: [...document.querySelectorAll("[data-curve]")],
  tryoutBtns: [...document.querySelectorAll("[data-tryout]")],
  btnPlay: document.getElementById("btn-play"),
};

// 实时重绘原海报两枚标志性方框微缩图（只读 model.js 单源状态）
function syncPosterIcons(ev) {
  if (dom.iconAccent) {
    // 采样 7 拍，呼应原海报「重音塑造层次」方框：蓝/冰青柱 + 细线 + 底部脉冲点
    const sampleIdx = [0, 2, 3, 6, 7, 11, 15];
    const xs = [9, 17, 25, 34, 43, 51, 59];
    const over = ev.flags.isAccentOverload;
    const parts = [`<line x1="6" y1="45" x2="62" y2="45" stroke="#314ea8" stroke-width="1"/>`];
    sampleIdx.forEach((bi, k) => {
      const lv = state.beats[bi];
      const h = lv === 3 ? 31 : lv === 2 ? 17 : lv === 1 ? 10 : 3;
      const w = lv === 3 ? 5.2 : 3.6;
      const fill =
        lv === 3 ? (over ? "#FF6B5B" : k % 2 === 0 ? "#6DE1FE" : "#2558FF") : lv === 0 ? "#1D2C5C" : "#284FD6";
      parts.push(`<rect x="${(xs[k] - w / 2).toFixed(1)}" y="${45 - h}" width="${w}" height="${h}" fill="${fill}"/>`);
      const dr = lv === 3 ? 3.5 : lv === 0 ? 1.1 : 1.7;
      parts.push(`<circle cx="${xs[k]}" cy="55" r="${dr}" fill="${lv === 3 ? (over ? "#FF6B5B" : "#6DE1FE") : "#365AE0"}"/>`);
    });
    dom.iconAccent.innerHTML = parts.join("");
  }

  if (dom.iconInterval) {
    // 采样 5 个圆点按真实疏密与断层拉伸，配原海报冰青速度箭头
    const xs = [10, 22, 34, 46, 58];
    const t = Math.min(1, Math.max(0, state.tension));
    const isFlat = ev.flags.isFlatInterval;
    const isFrac = ev.flags.isFractured;
    const pts = isFlat
      ? xs
      : isFrac
        ? [9, 16, 23, 50, 58]
        : [9, 17 + (1 - t) * 4, 27 + (1 - t) * 3, 40 - t * 2, 55];
    const radii = isFlat ? [3.4, 3.4, 3.4, 3.4, 3.4] : [2.0, 2.7, 3.6, 4.6, 5.8];
    const dotColor = isFrac ? "#FF6B5B" : isFlat ? "#4A6BD6" : "#6DE1FE";
    const arrowColor = isFrac ? "#FF6B5B" : ev.pillars.interval.ok ? "#99FEFF" : "#5B7CE6";
    const parts = [];
    pts.forEach((cx, k) => {
      parts.push(`<circle cx="${cx.toFixed(1)}" cy="28" r="${radii[k]}" fill="${dotColor}"/>`);
    });
    parts.push(
      `<line x1="10" y1="50" x2="56" y2="50" stroke="${arrowColor}" stroke-width="1.6"/>`,
      `<polyline points="50,45 56,50 50,55" fill="none" stroke="${arrowColor}" stroke-width="1.6"/>`
    );
    dom.iconInterval.innerHTML = parts.join("");
  }
}

function syncHeroUI(ev) {
  const scoreText = `${ev.passedCount} / 4 · ${ev.passedCount === 4 ? "节奏成立" : "待调律"}`;
  if (dom.topScore) {
    dom.topScore.textContent = scoreText;
    dom.topScore.dataset.tone = ev.diagnosis.tone;
  }

  if (dom.heroTitle) {
    dom.heroTitle.dataset.rhythm = ev.passedCount === 4 ? "ok" : ev.flags.isAccentOverload ? "overload" : "flat";
  }
  dom.titleBars.forEach((bar, i) => {
    const slice = state.beats.slice(i * 4, i * 4 + 4);
    const hasAccent = slice.includes(3);
    const allRest = slice.every((v) => v === 0);
    bar.dataset.state = allRest ? "rest" : hasAccent ? (ev.flags.isAccentOverload ? "over" : "accent") : "base";
  });

  for (const key of ["interval", "accent", "tempo", "continuity"]) {
    const info = ev.pillars[key];
    if (dom.pillarStatus[key]) dom.pillarStatus[key].textContent = info.status;
    if (dom.pillarCards[key]) dom.pillarCards[key].dataset.ok = info.ok ? "true" : "false";
  }

  syncPosterIcons(ev);

  if (dom.diagBox) dom.diagBox.dataset.tone = ev.diagnosis.tone;
  if (dom.diagBadge) dom.diagBadge.textContent = ev.diagnosis.badge;
  if (dom.diagHead) dom.diagHead.textContent = ev.diagnosis.headline;
  if (dom.diagBody) dom.diagBody.textContent = ev.diagnosis.body;
  if (dom.diagHint) dom.diagHint.textContent = ev.diagnosis.hint;

  if (dom.mInterval) dom.mInterval.textContent = `${ev.intervalRatio.toFixed(2)}×`;
  if (dom.mAccent) dom.mAccent.textContent = `${ev.accentCount} 处 (${Math.round(ev.accentShare * 100)}%)`;
  if (dom.mTempo) dom.mTempo.textContent = `${ev.tempoSpread.toFixed(2)}×`;
  if (dom.mBreak) dom.mBreak.textContent = `${Math.max(ev.breakRatio, ev.visualBreakRatio).toFixed(2)}×`;

  const curLv = state.beats[state.selected];
  if (dom.selIndexLabel) {
    dom.selIndexLabel.textContent = `拍 #${String(state.selected + 1).padStart(2, "0")} · ${LEVEL_META[curLv].label}`;
  }
  dom.levelBtns.forEach((b) => {
    const on = Number(b.dataset.setLevel) === curLv;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  dom.curveBtns.forEach((b) => {
    const on = b.dataset.curve === state.curve;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (dom.btnPlay) {
    dom.btnPlay.textContent = state.playing ? "视线扫拍：开" : "视线扫拍：停";
    dom.btnPlay.setAttribute("aria-pressed", String(state.playing));
    dom.btnPlay.classList.toggle("is-active", state.playing);
  }
}

const heroStage = createHeroStage({
  canvas: dom.heroCanvas,
  railEl: dom.railEl,
  thumbEl: dom.thumbEl,
  railFillEl: dom.railFillEl,
  railReadoutEl: dom.railReadoutEl,
  state,
  onChange: syncHeroUI,
});

function refreshAll() {
  heroStage.refresh();
  syncHeroUI(heroStage.getEvaluation());
}

if (dom.btnPrevBeat) {
  dom.btnPrevBeat.addEventListener("click", () => {
    state.selected = (state.selected - 1 + BEAT_COUNT) % BEAT_COUNT;
    refreshAll();
  });
}
if (dom.btnNextBeat) {
  dom.btnNextBeat.addEventListener("click", () => {
    state.selected = (state.selected + 1) % BEAT_COUNT;
    refreshAll();
  });
}

dom.levelBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.beats[state.selected] = Number(b.dataset.setLevel);
    refreshAll();
  });
});

dom.patternBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const pat = ACCENT_PATTERNS[b.dataset.accentPattern];
    if (!pat) return;
    state.beats = [...pat.beats];
    refreshAll();
  });
});

dom.curveBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const key = b.dataset.curve;
    if (!CURVES[key]) return;
    state.curve = key;
    refreshAll();
  });
});

dom.tryoutBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const t = HERO_TRYOUTS[b.dataset.tryout];
    if (!t) return;
    state.beats = [...t.beats];
    state.curve = t.curve;
    state.tension = t.tension;
    refreshAll();
  });
});

if (dom.btnPlay) {
  dom.btnPlay.addEventListener("click", () => {
    state.playing = !state.playing;
    refreshAll();
  });
}

syncHeroUI(heroStage.getEvaluation());
initCompareSection();
initGapBoardSection();
initAccentSection();
initHistorySection();
initLayoutSandbox();
initDontUseSection();
initQuizSection();
initPosterModal();
