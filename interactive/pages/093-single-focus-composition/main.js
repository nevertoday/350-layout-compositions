// 093 单一焦点构图 · 总装配与单真源 UI 同步

import { mountDarkroom } from "./darkroom.js";
import { clamp, evaluate, INITIAL_STATE, MISTAKES, SCENES, SOLUTIONS } from "./model.js";
import {
  initBudgetLab,
  initHistoryLab,
  initPopoutLab,
  initPosterLightbox,
  initQuizLab,
  initScalpelLab,
  initTriageLab,
} from "./sections.js";

let state = {
  ...INITIAL_STATE,
  rivals: [...INITIAL_STATE.rivals],
};

const canvas = document.getElementById("hero-canvas");
const darkroom = mountDarkroom(canvas, () => state, updateState);

let lastDomSync = 0;

function updateState(patch, { skipDraw = false, throttleDom = false } = {}) {
  state = {
    ...state,
    ...patch,
    rivals: patch.rivals ? [...patch.rivals] : state.rivals,
  };
  const now = performance.now();
  if (!throttleDom || now - lastDomSync > 120) {
    lastDomSync = now;
    syncHeroUI();
  }
  if (!skipDraw) darkroom.draw();
}

let lastMiniSig = "";

// 1:1 复刻原海报底部三枚黑框微缩图解（单一焦点 / 次要弱化 / 视线聚焦），随当前 state 实绘联动
function renderPosterMiniDiagrams(ev) {
  const m1 = document.getElementById("mini-single");
  const m2 = document.getElementById("mini-sub");
  const m3 = document.getElementById("mini-gaze");
  if (!m1 || !m2 || !m3) return;

  const { activeRivalCount, heroAreaPct, flags } = ev;
  const supBucket = Math.round(state.bgSuppress / 5);
  const sig = `${state.rivals.join(",")}|${heroAreaPct}|${flags.isFaded}|${flags.isCrushed}|${supBucket}|${state.leadMode}`;

  const cap1 = document.getElementById("mini-single-val");
  const cap2 = document.getElementById("mini-sub-val");
  const cap3 = document.getElementById("mini-gaze-val");
  if (cap1) cap1.textContent = activeRivalCount > 0 ? `抢戏 ${activeRivalCount} 处` : `焦比 ${ev.dominanceRatio.toFixed(1)}×`;
  if (cap2) cap2.textContent = flags.isCrushed ? `过黑 ${state.bgSuppress}%` : `压噪 ${state.bgSuppress}%`;
  if (cap3) cap3.textContent = state.leadMode === "focus" ? "指向主角" : "逆向外拉";

  if (sig === lastMiniSig) return;
  lastMiniSig = sig;
  const heroR = clamp(7 + (heroAreaPct / 52) * 18, 7, 26);
  const heroCol = flags.isFaded ? "#7B8190" : "#0A4CF7";

  // 图解 1：单一焦点（有竞争焦时左下/右上冒出红大圆，单焦时中央独霸大蓝圆+四角淡灰点）
  const r1Dot =
    state.rivals[0] === "rival"
      ? `<circle cx="19" cy="54" r="11" fill="#E03B2A"/>`
      : state.rivals[0] === "muted"
        ? `<circle cx="18" cy="54" r="3" fill="#6F7482"/>`
        : "";
  const r2Dot =
    state.rivals[1] === "rival"
      ? `<circle cx="53" cy="18" r="10.5" fill="#EA7B24"/>`
      : state.rivals[1] === "muted"
        ? `<circle cx="54" cy="18" r="3" fill="#6F7482"/>`
        : "";
  m1.innerHTML = `
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="18" cy="18" r="3" fill="#6F7482"/>
      <circle cx="54" cy="54" r="3" fill="#6F7482"/>
      ${r1Dot}${r2Dot}
      <circle cx="36" cy="36" r="${heroR.toFixed(1)}" fill="${heroCol}"/>
    </svg>
  `;

  // 图解 2：次要弱化（背景压噪低时周围点又大又吵，压噪适中时微弱退居四周，压黑>92时整体塌暗）
  const noiseLevel = clamp(1 - state.bgSuppress / 88, 0.08, 1);
  const secR = (2.1 + noiseLevel * 4.4).toFixed(1);
  const secCol = flags.isCrushed ? "#242832" : noiseLevel > 0.45 ? "#D96645" : "#5F6575";
  m2.innerHTML = `
    <svg viewBox="0 0 72 72" aria-hidden="true">
      ${[
        [16, 18], [36, 14], [56, 20],
        [14, 38], [58, 40],
        [18, 56], [36, 58], [54, 54],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${secR}" fill="${secCol}"/>`)
        .join("")}
      <circle cx="36" cy="36" r="${flags.isCrushed ? "5" : "7.5"}" fill="${heroCol}"/>
    </svg>
  `;

  // 图解 3：视线聚焦（引导线顺势时由左下虚线箭头直指右上蓝点，逆向时箭锋外甩朝左下标红）
  const isFocus = state.leadMode === "focus";
  m3.innerHTML = isFocus
    ? `
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <line x1="14" y1="58" x2="43" y2="29" stroke="#F4ECDA" stroke-width="1.8" stroke-dasharray="3 3"/>
        <polygon points="46,26 37,28 43,34" fill="#F4ECDA"/>
        <circle cx="53" cy="20" r="8" fill="${heroCol}"/>
      </svg>
    `
    : `
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <line x1="44" y1="30" x2="15" y2="57" stroke="#FF6E5C" stroke-width="2" stroke-dasharray="3 3"/>
        <polygon points="12,60 21,58 15,52" fill="#FF6E5C"/>
        <circle cx="53" cy="20" r="8" fill="${heroCol}"/>
      </svg>
    `;
}

function syncHeroUI() {
  const ev = evaluate(state);
  const allPass = ev.passedCount === 4;

  // 顶部状态徽标
  const topPill = document.getElementById("hero-top-pill");
  if (topPill) {
    topPill.textContent = ev.diagnosis.badge;
    topPill.className = `status-pill ${allPass ? "is-pass" : "is-fail"}`;
  }

  // 语境切换状态 + 场景说明
  document.querySelectorAll("[data-scene]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.scene === state.scene));
  });
  const sceneNote = document.getElementById("hero-scene-note");
  if (sceneNote) sceneNote.textContent = SCENES[state.scene].note;

  // 左侧 4 枚原海报纯黑底钴蓝圆徽实时探针
  for (const p of ev.probes) {
    const row = document.getElementById(`probe-${p.key}`);
    const tag = document.getElementById(`probe-tag-${p.key}`);
    if (row) row.classList.toggle("is-ok", p.ok);
    if (tag) {
      tag.textContent = p.tag;
      tag.className = `probe-tag ${p.ok ? "is-ok" : "is-fail"}`;
    }
  }

  // 底部极黑剧场单真源引号诊单（桌面 & 手机折线内同步）
  const diagBadge = document.getElementById("diag-badge");
  const diagTier = document.getElementById("diag-tier");
  const diagHead = document.getElementById("diag-headline");
  const diagBody = document.getElementById("diag-body");
  const diagAction = document.getElementById("diag-action");
  if (diagBadge) {
    diagBadge.textContent = ev.diagnosis.badge;
    diagBadge.className = `diag-badge ${allPass ? "is-pass" : "is-fail"}`;
  }
  if (diagTier) diagTier.textContent = `层级：${ev.tier}（示意）· 对比 ${ev.heroContrast}:1`;
  if (diagHead) diagHead.textContent = ev.diagnosis.headline;
  if (diagBody) diagBody.textContent = ev.diagnosis.body;
  if (diagAction) diagAction.textContent = ev.diagnosis.action;

  // 手机首屏紧致诊单首句同步
  const mobHead = document.getElementById("mob-diag-headline");
  const mobSub = document.getElementById("mob-diag-sub");
  if (mobHead) mobHead.textContent = ev.diagnosis.headline;
  if (mobSub) mobSub.textContent = ev.diagnosis.action;

  // 滑轨与按键读数同步
  const supInput = document.getElementById("ctrl-suppress");
  const mobSupInput = document.getElementById("mob-ctrl-suppress");
  const supVal = document.getElementById("val-suppress");
  const mobSupVal = document.getElementById("mob-val-suppress");
  if (supInput) supInput.value = String(state.bgSuppress);
  if (mobSupInput) mobSupInput.value = String(state.bgSuppress);
  if (supVal) supVal.textContent = `${state.bgSuppress}%`;
  if (mobSupVal) mobSupVal.textContent = `${state.bgSuppress}%`;

  const chrInput = document.getElementById("ctrl-chroma");
  const chrVal = document.getElementById("val-chroma");
  if (chrInput) chrInput.value = String(state.subjectChroma);
  if (chrVal) chrVal.textContent = `${state.subjectChroma}%`;

  const sclInput = document.getElementById("ctrl-scale");
  const sclVal = document.getElementById("val-scale");
  if (sclInput) sclInput.value = String(state.subjectScale);
  if (sclVal) sclVal.textContent = `${ev.heroAreaPct}%`;

  const leadBtn = document.getElementById("ctrl-lead");
  if (leadBtn) {
    leadBtn.textContent = state.leadMode === "focus" ? "视线引导：指向主角" : "视线引导：逆向外拉";
    leadBtn.setAttribute("aria-pressed", String(state.leadMode === "focus"));
    leadBtn.classList.toggle("is-warn", state.leadMode !== "focus");
  }

  const rivalBtn = document.getElementById("ctrl-clear-rivals");
  if (rivalBtn) {
    const cnt = ev.activeRivalCount;
    rivalBtn.textContent = cnt > 0 ? `弱化竞争焦 (${cnt})` : "竞争焦已退让";
    rivalBtn.classList.toggle("is-warn", cnt > 0);
  }

  const guideBtn = document.getElementById("ctrl-guides");
  if (guideBtn) {
    guideBtn.textContent = state.showGuides ? "同心聚焦环：开" : "同心聚焦环：关";
    guideBtn.setAttribute("aria-pressed", String(state.showGuides));
  }

  // 三枚原海报底部联动微缩图解
  renderPosterMiniDiagrams(ev);
}

// ---------- 绑定开场全部控件 ----------
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({ scene: btn.dataset.scene });
  });
});

document.getElementById("ctrl-suppress")?.addEventListener("input", (e) => {
  updateState({ bgSuppress: Number(e.target.value) });
});
document.getElementById("mob-ctrl-suppress")?.addEventListener("input", (e) => {
  updateState({ bgSuppress: Number(e.target.value) });
});
document.getElementById("ctrl-chroma")?.addEventListener("input", (e) => {
  updateState({ subjectChroma: Number(e.target.value) });
});
document.getElementById("ctrl-scale")?.addEventListener("input", (e) => {
  updateState({ subjectScale: Number(e.target.value) });
});

document.getElementById("ctrl-lead")?.addEventListener("click", () => {
  updateState({ leadMode: state.leadMode === "focus" ? "away" : "focus" });
});

document.getElementById("ctrl-clear-rivals")?.addEventListener("click", () => {
  const hasActive = state.rivals.some((r) => r === "rival");
  updateState({ rivals: hasActive ? ["muted", "muted"] : ["rival", "rival"] });
});

document.getElementById("ctrl-guides")?.addEventListener("click", () => {
  updateState({ showGuides: !state.showGuides });
});

document.querySelectorAll("[data-solution]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sol = SOLUTIONS[btn.dataset.solution];
    if (sol) updateState(sol.patch);
  });
});

document.querySelectorAll("[data-mistake]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const m = MISTAKES[btn.dataset.mistake];
    if (m) updateState(m.patch);
  });
});

document.querySelectorAll("[data-action='solve-poster']").forEach((btn) => {
  btn.addEventListener("click", () => updateState(SOLUTIONS.poster.patch));
});
document.querySelectorAll("[data-action='reset-broken']").forEach((btn) => {
  btn.addEventListener("click", () =>
    updateState({
      bgSuppress: INITIAL_STATE.bgSuppress,
      subjectChroma: INITIAL_STATE.subjectChroma,
      subjectScale: INITIAL_STATE.subjectScale,
      rivals: [...INITIAL_STATE.rivals],
      leadMode: INITIAL_STATE.leadMode,
    }),
  );
});
document.querySelectorAll("[data-action='scan']").forEach((btn) => {
  btn.addEventListener("click", () => darkroom.triggerScan());
});

// 全局 Space 快捷触发 0.5s 视线热力验真（在非输入控件上）
window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  const tag = document.activeElement?.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "A") return;
  const heroRect = canvas.getBoundingClientRect();
  if (heroRect.bottom > 40 && heroRect.top < window.innerHeight - 40) {
    e.preventDefault();
    darkroom.triggerScan();
  }
});

// 初始化开场 UI 与 01–07 全部交互节
syncHeroUI();
initPopoutLab();
initBudgetLab();
initScalpelLab();
initHistoryLab();
initTriageLab();
initQuizLab();
initPosterLightbox();
