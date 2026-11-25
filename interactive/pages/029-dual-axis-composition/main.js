// 029 双轴构图 · 整页状态联动与全节交互
import {
  ANTI_CASES,
  AXIS_MODES,
  clamp,
  createClassicState,
  createInitialState,
  CROSSING_PRESETS,
  evaluate,
  LINEAGE_ITEMS,
  QUIZZES,
  SCENE_CASES,
  SIBLINGS,
} from "./model.js";
import { initHeroCanvas } from "./hero-canvas.js";
import { buildDualAxisSvg, buildLineageSvg, initSec1Canvas, initSec3Canvas } from "./sections-canvas.js";

const state = createInitialState();

// ---------- 顶部示范微缩双轴徽标 + 原则卡 + 皇室蓝诊单统一同步 ----------
const elTopStatus = document.getElementById("top-status");
const elMiniVx = document.getElementById("mini-vx");
const elMiniHy = document.getElementById("mini-hy");
const elMiniDot = document.getElementById("mini-dot");
const elSliderX = document.getElementById("slider-x");
const elSliderY = document.getElementById("slider-y");
const elOutX = document.getElementById("out-x");
const elOutY = document.getElementById("out-y");
const elBtnHierarchy = document.getElementById("btn-hierarchy");
const elBtnFocus = document.getElementById("btn-focus");
const elBtnSeam = document.getElementById("btn-seam");
const elBtnGuides = document.getElementById("btn-guides");
const elDiagTag = document.getElementById("diag-tag");
const elDiagHeadline = document.getElementById("diag-headline");
const elDiagWhy = document.getElementById("diag-why");
const elDiagHint = document.getElementById("diag-hint");
const elMCross = document.getElementById("m-cross");
const elMBalance = document.getElementById("m-balance");
const elMMinArea = document.getElementById("m-minarea");
const elMFocus = document.getElementById("m-focus");

const badges = {
  hierarchy: document.getElementById("badge-hierarchy"),
  balance: document.getElementById("badge-balance"),
  zoning: document.getElementById("badge-zoning"),
  focus: document.getElementById("badge-focus"),
};

const tipItems = [...document.querySelectorAll(".tip-item")];

const setText = (el, txt) => { if (el.textContent !== txt) el.textContent = txt; };
const setAttr = (el, k, v) => { if (el.getAttribute(k) !== v) el.setAttribute(k, v); };

function syncHeroUI() {
  const ev = evaluate(state);
  const xp = Math.round(ev.x * 100);
  const yp = Math.round(ev.y * 100);

  // 1. 顶栏状态胶囊
  setText(elTopStatus, ev.passed === 4 ? "4 / 4 双轴成立" : `${ev.passed} / 4 待立双轴`);
  elTopStatus.classList.toggle("is-pass", ev.passed === 4);
  elTopStatus.classList.toggle("is-warn", ev.passed < 4);

  // 2. 标题旁微缩双轴徽标实时联动
  const mx = (2 + 40 * ev.x).toFixed(1);
  const my = (2 + 40 * ev.y).toFixed(1);
  setAttr(elMiniVx, "x1", mx);
  setAttr(elMiniVx, "x2", mx);
  setAttr(elMiniHy, "y1", my);
  setAttr(elMiniHy, "y2", my);
  if (state.focusMode === "hidden") {
    setAttr(elMiniDot, "opacity", "0");
  } else {
    setAttr(elMiniDot, "opacity", "1");
    const fx = state.focusMode === "locked" ? mx : (2 + 40 * state.focusPos.u).toFixed(1);
    const fy = state.focusMode === "locked" ? my : (2 + 40 * state.focusPos.v).toFixed(1);
    setAttr(elMiniDot, "cx", fx);
    setAttr(elMiniDot, "cy", fy);
  }

  // 3. 滑杆与按钮状态
  if (elSliderX.value !== String(xp)) elSliderX.value = String(xp);
  if (elSliderY.value !== String(yp)) elSliderY.value = String(yp);
  setText(elOutX, `${xp}%`);
  setText(elOutY, `${yp}%`);

  setText(elBtnHierarchy, state.hierarchyOrder === "topdown" ? "层级：由上而下" : "层级：倒置");
  elBtnHierarchy.classList.toggle("is-alert", state.hierarchyOrder !== "topdown");
  elBtnHierarchy.classList.toggle("is-done", state.hierarchyOrder === "topdown");

  const focusBtnMap = {
    locked: { text: "焦点：稳落交点", alert: false, done: true },
    drifted: { text: "焦点：脱轴漂移", alert: true, done: false },
    hidden: { text: "焦点：已隐去", alert: true, done: false },
  };
  const fb = focusBtnMap[state.focusMode];
  setText(elBtnFocus, fb.text);
  elBtnFocus.classList.toggle("is-alert", fb.alert);
  elBtnFocus.classList.toggle("is-done", fb.done);

  setText(elBtnSeam, state.seamOverflow ? "清净轴缝（有撞叠）" : "轴缝：已清净");
  elBtnSeam.classList.toggle("is-alert", state.seamOverflow);
  elBtnSeam.classList.toggle("is-done", !state.seamOverflow);

  setText(elBtnGuides, state.showGuides ? "参考带：显" : "参考带：隐");
  setAttr(elBtnGuides, "aria-pressed", String(state.showGuides));

  // 4. 左右四枚原海报原则实况卡
  for (const key of Object.keys(badges)) {
    const chk = ev.checks[key];
    setText(badges[key], chk.short);
    badges[key].classList.toggle("is-ok", chk.ok);
    badges[key].classList.toggle("is-fail", !chk.ok);
  }

  // 5. 皇室钴蓝底沿实时白话诊单
  if (ev.passed === 4) {
    setText(elDiagTag, `${ev.solveLabel} (4 / 4)`);
    elDiagTag.classList.remove("is-warn");
    elDiagTag.classList.add("is-pass");
    setText(elDiagHeadline, "水平稳、垂直明、四区各有分工，焦点锁稳双轴交汇处");
    setText(elDiagWhy, ev.solveDetail);
    setText(elDiagHint, "可以继续点击象限试「镜像对角」，或微移双轴验证非 50% 的偏交均衡解。");
  } else {
    setText(elDiagTag, `${ev.fault.tag} (${ev.passed} / 4)`);
    elDiagTag.classList.add("is-warn");
    elDiagTag.classList.remove("is-pass");
    setText(elDiagHeadline, ev.fault.headline);
    setText(elDiagWhy, ev.fault.why);
    setText(elDiagHint, ev.fault.hint);
  }

  setText(elMCross, `${xp}% / ${yp}%`);
  setText(elMBalance, `${Math.round(ev.leftShare * 100)} : ${Math.round(ev.rightShare * 100)}`);
  setText(elMMinArea, `${Math.round(ev.minArea * 100)}%`);
  setText(elMFocus, state.focusMode === "hidden" ? "缺席" : state.focusMode === "locked" ? "0% 落交" : `${Math.round(ev.focusOffset * 100)}%`);

  // 6. 原海报四条应用建议实况点亮
  tipItems.forEach((el, idx) => {
    el.classList.toggle("is-ok", !!ev.tipsOk[idx]);
  });
}

const heroCtl = initHeroCanvas(document.getElementById("hero-canvas"), state, syncHeroUI);

// 题材切换
document.querySelectorAll(".theme-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    document.querySelectorAll(".theme-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncHeroUI();
    heroCtl.draw();
  });
});

elSliderX.addEventListener("input", () => {
  state.axisX = clamp(Number(elSliderX.value) / 100, 0.16, 0.84);
  if (state.focusMode === "locked") state.focusPos = { u: state.axisX, v: state.axisY };
  syncHeroUI();
  heroCtl.draw();
});

elSliderY.addEventListener("input", () => {
  state.axisY = clamp(Number(elSliderY.value) / 100, 0.16, 0.84);
  if (state.focusMode === "locked") state.focusPos = { u: state.axisX, v: state.axisY };
  syncHeroUI();
  heroCtl.draw();
});

elBtnHierarchy.addEventListener("click", () => {
  state.hierarchyOrder = state.hierarchyOrder === "topdown" ? "inverted" : "topdown";
  syncHeroUI();
  heroCtl.draw();
});

elBtnFocus.addEventListener("click", () => {
  // 脱轴漂移 -> 锁回交点 -> 隐去 -> 脱轴漂移
  if (state.focusMode === "drifted") {
    state.focusMode = "locked";
    state.focusPos = { u: state.axisX, v: state.axisY };
  } else if (state.focusMode === "locked") {
    state.focusMode = "hidden";
  } else {
    state.focusMode = "drifted";
    state.focusPos = { u: 0.76, v: 0.28 };
  }
  syncHeroUI();
  heroCtl.draw();
});

elBtnSeam.addEventListener("click", () => {
  state.seamOverflow = !state.seamOverflow;
  syncHeroUI();
  heroCtl.draw();
});

elBtnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncHeroUI();
  heroCtl.draw();
});

document.getElementById("btn-reset").addEventListener("click", () => {
  const curTheme = state.theme;
  Object.assign(state, createInitialState(), { theme: curTheme });
  syncHeroUI();
  heroCtl.draw();
});

document.getElementById("btn-classic").addEventListener("click", () => {
  const curTheme = state.theme;
  Object.assign(state, createClassicState(curTheme));
  syncHeroUI();
  heroCtl.draw();
});

syncHeroUI();

// ---------- 01 节：四类轴线解剖 ----------
let sec1Mode = "dual";
const sec1Ctl = initSec1Canvas(document.getElementById("sec1-canvas"), () => sec1Mode);
const elSec1En = document.getElementById("sec1-en");
const elSec1Title = document.getElementById("sec1-title");
const elSec1Body = document.getElementById("sec1-body");
const elSec1Metrics = document.getElementById("sec1-metrics");
const elSec1LinkWrap = document.getElementById("sec1-link-wrap");

function renderSec1() {
  const cfg = AXIS_MODES[sec1Mode];
  elSec1En.textContent = cfg.en;
  elSec1Title.textContent = cfg.headline;
  elSec1Body.textContent = cfg.body;
  elSec1Metrics.innerHTML = cfg.metrics.map((m) => `<li>${m}</li>`).join("");
  if (cfg.link) {
    elSec1LinkWrap.innerHTML = `这条单轴或十字做法在同组专页有独立深讲：<a href="${cfg.link.href}" target="_blank" rel="noopener">${cfg.link.label}</a>。`;
  } else {
    elSec1LinkWrap.innerHTML = `只用一条轴的细化玩法分别在同组专页展开：单论居中竖脊见 <a href="https://layout.xiaoxiaodong.ai/027/play/" target="_blank" rel="noopener">027 中轴构图</a>，单轴偏置张力见 <a href="https://layout.xiaoxiaodong.ai/028/play/" target="_blank" rel="noopener">028 偏轴构图</a>。`;
  }
  sec1Ctl.draw();
}

document.querySelectorAll("#sec-01 .seg-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    sec1Mode = btn.dataset.mode;
    document.querySelectorAll("#sec-01 .seg-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderSec1();
  });
});

// ---------- 02 节：交点挪动与非对称配重 ----------
let sec2Idx = 0;
const elSec2Presets = document.getElementById("sec2-presets");
const elSec2Svg = document.getElementById("sec2-svg");
const elSec2Verdict = document.getElementById("sec2-verdict");
const elSec2Ratio = document.getElementById("sec2-ratio");
const elSec2BarL = document.getElementById("sec2-bar-l");
const elSec2BarR = document.getElementById("sec2-bar-r");
const elSec2Note = document.getElementById("sec2-note");

elSec2Presets.innerHTML = CROSSING_PRESETS.map(
  (p, i) => `<button type="button" class="preset-btn${i === 0 ? " is-active" : ""}" data-preset="${i}" aria-pressed="${i === 0}">${p.label}</button>`
).join("");

function renderSec2() {
  const p = CROSSING_PRESETS[sec2Idx];
  const simEv = evaluate({
    ...createClassicState("poster"),
    axisX: p.axisX,
    axisY: p.axisY,
    quads: p.quads,
  });
  const lPct = Math.round(simEv.leftShare * 100);
  const rPct = Math.round(simEv.rightShare * 100);

  elSec2Svg.innerHTML = buildDualAxisSvg({ axisX: p.axisX, axisY: p.axisY, quads: p.quads });
  elSec2Verdict.textContent = p.verdict;
  elSec2Verdict.classList.toggle("is-bad", !simEv.checks.balance.ok);
  elSec2Ratio.textContent = `左 ${lPct}% : 右 ${rPct}%（示意）`;
  elSec2BarL.style.width = `${lPct}%`;
  elSec2BarR.style.width = `${rPct}%`;
  elSec2Note.textContent = p.note;

  elSec2Presets.querySelectorAll(".preset-btn").forEach((b, i) => {
    const on = i === sec2Idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

elSec2Presets.addEventListener("click", (e) => {
  const btn = e.target.closest(".preset-btn");
  if (!btn) return;
  sec2Idx = Number(btn.dataset.preset);
  renderSec2();
});

document.getElementById("sec2-apply").addEventListener("click", () => {
  const p = CROSSING_PRESETS[sec2Idx];
  state.axisX = p.axisX;
  state.axisY = p.axisY;
  state.quads = [...p.quads];
  state.hierarchyOrder = "topdown";
  state.focusMode = "locked";
  state.focusPos = { u: p.axisX, v: p.axisY };
  state.seamOverflow = false;
  syncHeroUI();
  heroCtl.draw();
  window.scrollTo(0, 0);
});

renderSec2();

// ---------- 03 节：暗室视线节律 ----------
const gazeState = { mode: "ordered", playing: true, step: -1 };
const GAZE_COPY = {
  ordered: {
    title: "焦点先定锚，再顺左上 → 右上 → 左下 → 右下完成扫描",
    desc: "蓝金圆心在双轴交汇处先接住第一眼，随后垂直轴引导先读上方主区、再落下方辅区，水平轴把左右两格并排摊开，记忆路径最短。",
  },
  hollow: {
    title: "没有交点与深浅主次，视线在四格间来回折返",
    desc: "四块浅色卡片同权平铺、交汇点留空，眼睛不得不跨区跳跃寻找起点，看完一遍也很难复述哪块是核心。",
  },
  diagonal: {
    title: "左上重块起读，借中心交点中转到右下对角收稳",
    desc: "对角深钴蓝构成隐性稳固支点，视线从左上主视觉经中心焦点滑向右下收束，再轻松扫过右上与左下暖杏辅助区。",
  },
};

const sec3Ctl = initSec3Canvas(document.getElementById("sec3-canvas"), () => gazeState);
const elGazeTitle = document.getElementById("gaze-title");
const elGazeDesc = document.getElementById("gaze-desc");
const elGazeToggle = document.getElementById("gaze-toggle");
const elGazeStep = document.getElementById("gaze-step");

function syncSec3() {
  const c = GAZE_COPY[gazeState.mode];
  elGazeTitle.textContent = c.title;
  elGazeDesc.textContent = c.desc;
  elGazeToggle.textContent = gazeState.playing ? "暂停扫读" : "继续扫读";
  elGazeStep.textContent = gazeState.step >= 0 ? `第 ${gazeState.step + 1} / 5 停点` : "单步推演";
  sec3Ctl.draw();
}

document.querySelectorAll(".dark-modes .dark-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    gazeState.mode = btn.dataset.gaze;
    gazeState.step = -1;
    document.querySelectorAll(".dark-modes .dark-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncSec3();
  });
});

elGazeToggle.addEventListener("click", () => {
  gazeState.playing = !gazeState.playing;
  if (gazeState.playing) gazeState.step = -1;
  else if (gazeState.step < 0) gazeState.step = 4;
  syncSec3();
});

elGazeStep.addEventListener("click", () => {
  gazeState.playing = false;
  gazeState.step = (gazeState.step + 1) % 5;
  syncSec3();
});

// ---------- 04 节：历史谱系 ----------
let lineageIdx = 0;
const elLineageTabs = document.getElementById("lineage-tabs");
const elLineageSvg = document.getElementById("lineage-svg");
const elLineageYear = document.getElementById("lineage-year");
const elLineageTitle = document.getElementById("lineage-title");
const elLineageWho = document.getElementById("lineage-who");
const elLineageSummary = document.getElementById("lineage-summary");
const elLineageLink = document.getElementById("lineage-link");

elLineageTabs.innerHTML = LINEAGE_ITEMS.map(
  (it, i) => `<button type="button" class="lineage-tab${i === 0 ? " is-active" : ""}" role="tab" data-lineage="${i}" aria-selected="${i === 0}">
    <span class="lineage-tab-yr">${it.year}</span>
    <span class="lineage-tab-t">${it.title}</span>
  </button>`
).join("");

function renderLineage() {
  const it = LINEAGE_ITEMS[lineageIdx];
  elLineageSvg.innerHTML = buildLineageSvg(it.diagram);
  elLineageYear.textContent = it.year;
  elLineageTitle.textContent = it.title;
  elLineageWho.textContent = it.who;
  elLineageSummary.textContent = it.summary;
  elLineageLink.textContent = it.source;
  elLineageLink.href = it.href;
  elLineageTabs.querySelectorAll(".lineage-tab").forEach((b, i) => {
    const on = i === lineageIdx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

elLineageTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".lineage-tab");
  if (!btn) return;
  lineageIdx = Number(btn.dataset.lineage);
  renderLineage();
});

renderLineage();

// ---------- 05 节：四类真实版面分工 ----------
let sceneIdx = 0;
let sceneGood = true;
const elSceneTabs = document.getElementById("scene-tabs");
const elSceneCurName = document.getElementById("scene-cur-name");
const elSceneVisual = document.getElementById("scene-visual");
const elSceneHeading = document.getElementById("scene-heading");
const elSceneNote = document.getElementById("scene-note");
const elSceneRoles = document.getElementById("scene-roles");

elSceneTabs.innerHTML = SCENE_CASES.map(
  (s, i) => `<button type="button" class="seg-tab${i === 0 ? " is-active" : ""}" role="tab" data-scene="${i}" aria-selected="${i === 0}">${s.label}</button>`
).join("");

function buildSceneSvg(sc, isGood) {
  if (!isGood) {
    return `<svg viewBox="0 0 360 240" role="img" aria-label="${sc.label}失序混排示意">
      <rect width="360" height="240" fill="#F7EDE3"/>
      <rect x="24" y="24" width="176" height="104" fill="#054BA5" opacity="0.88"/>
      <rect x="130" y="64" width="166" height="82" fill="#B82920" fill-opacity="0.22" stroke="#B82920" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="34" y="138" width="110" height="78" fill="#054BA5" opacity="0.72"/>
      <circle cx="292" cy="54" r="18" fill="#F7C104"/>
      <line x1="20" y1="158" x2="340" y2="112" stroke="#B82920" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="180" y="226" text-anchor="middle" fill="#B82920" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">重块偏堆、轴线失序、文字与图相互挤撞</text>
    </svg>`;
  }
  const labels = sc.qRoles;
  return `<svg viewBox="0 0 360 240" role="img" aria-label="${sc.label}双轴分工示意">
    <rect width="360" height="240" fill="#F7EDE3"/>
    <rect x="24" y="20" width="146" height="86" fill="#054BA5"/>
    <rect x="190" y="20" width="146" height="86" fill="#F5E3C9"/>
    <rect x="24" y="122" width="146" height="86" fill="#F5E3C9"/>
    <rect x="190" y="122" width="146" height="86" fill="#054BA5"/>
    <line x1="180" y1="8" x2="180" y2="218" stroke="#044AA2" stroke-width="2.2"/>
    <line x1="12" y1="114" x2="348" y2="114" stroke="#044AA2" stroke-width="2.2"/>
    <circle cx="180" cy="114" r="18" fill="#044AA2"/>
    <circle cx="180" cy="114" r="9" fill="#F7C104"/>
    <text x="97" y="66" text-anchor="middle" fill="#FAF5EE" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">Q1 ${labels[0]}</text>
    <text x="263" y="66" text-anchor="middle" fill="#011323" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">Q2 ${labels[1]}</text>
    <text x="97" y="168" text-anchor="middle" fill="#011323" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">Q3 ${labels[2]}</text>
    <text x="263" y="168" text-anchor="middle" fill="#FAF5EE" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">Q4 ${labels[3]}</text>
    <text x="180" y="232" text-anchor="middle" fill="#0D6B59" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">四区各司其职 · 双轴均衡收稳</text>
  </svg>`;
}

function renderScene() {
  const sc = SCENE_CASES[sceneIdx];
  elSceneCurName.textContent = sc.label;
  elSceneVisual.innerHTML = buildSceneSvg(sc, sceneGood);
  elSceneHeading.textContent = sceneGood ? sc.goodTitle : sc.badTitle;
  elSceneNote.textContent = sceneGood ? sc.goodNote : sc.badNote;
  elSceneRoles.innerHTML = sc.qRoles.map((r, i) => `<li><span>Q${i + 1}</span>${r}</li>`).join("");
  elSceneTabs.querySelectorAll(".seg-tab").forEach((b, i) => {
    const on = i === sceneIdx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".toggle-chip").forEach((b) => {
    const on = (b.dataset.sceneState === "good") === sceneGood;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

elSceneTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-tab");
  if (!btn) return;
  sceneIdx = Number(btn.dataset.scene);
  renderScene();
});

document.querySelectorAll(".toggle-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    sceneGood = btn.dataset.sceneState === "good";
    renderScene();
  });
});

renderScene();

// ---------- 06 节：什么时候别用双轴 ----------
const antiState = ANTI_CASES.map(() => false);
const elAntiGrid = document.getElementById("anti-grid");

function buildAntiSvg(kind, alt) {
  if (!alt) {
    // 每张卡片展示对应题材被强行硬切四格后的失真状态，并用干净底框托起标签不压线
    const innerMap = {
      speed: `<polygon points="18,108 194,20 204,34 42,114" fill="#054BA5" opacity="0.28"/>`,
      tiny: `<rect x="74" y="14" width="72" height="102" fill="#054BA5" opacity="0.22"/><rect x="80" y="22" width="26" height="36" fill="#F5E3C9"/><rect x="114" y="22" width="26" height="36" fill="#054BA5" opacity="0.35"/><rect x="80" y="68" width="26" height="36" fill="#054BA5" opacity="0.35"/><rect x="114" y="68" width="26" height="36" fill="#F5E3C9"/>`,
      poetic: `<rect x="16" y="14" width="88" height="46" fill="#054BA5" opacity="0.24"/><rect x="116" y="14" width="88" height="46" fill="#F5E3C9"/><rect x="16" y="70" width="88" height="46" fill="#F5E3C9"/><rect x="116" y="70" width="88" height="46" fill="#054BA5" opacity="0.24"/><rect x="46" y="56" width="12" height="38" fill="#011323" opacity="0.45"/>`,
      scroll: `<line x1="16" y1="65" x2="204" y2="65" stroke="#054BA5" stroke-width="2.5" opacity="0.35"/><circle cx="48" cy="65" r="7" fill="#054BA5" opacity="0.4"/><circle cx="172" cy="65" r="7" fill="#054BA5" opacity="0.4"/>`,
    };
    const tagMap = {
      speed: "硬切四格 · 动能卡死",
      tiny: "窄卡硬分 · 碎成四块",
      poetic: "四格塞满 · 呼吸消失",
      scroll: "竖轴拦腰 · 流程切断",
    };
    return `<svg viewBox="0 0 220 130" aria-hidden="true">
      <rect width="220" height="130" fill="#FAF5EE"/>
      ${innerMap[kind] || ""}
      <line x1="110" y1="8" x2="110" y2="122" stroke="#B82920" stroke-width="1.8" stroke-dasharray="4 3"/>
      <line x1="10" y1="65" x2="210" y2="65" stroke="#B82920" stroke-width="1.8" stroke-dasharray="4 3"/>
      <rect x="40" y="52" width="140" height="26" fill="#FAF5EE" stroke="#B82920" stroke-width="1.4"/>
      <text x="110" y="69" text-anchor="middle" fill="#B82920" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">${tagMap[kind] || "硬套双轴失当"}</text>
    </svg>`;
  }
  if (kind === "speed") {
    return `<svg viewBox="0 0 220 130" aria-hidden="true">
      <rect width="220" height="130" fill="#FAF5EE"/>
      <polygon points="14,116 186,16 206,36 46,116" fill="#054BA5"/>
      <line x1="16" y1="114" x2="204" y2="18" stroke="#F7C104" stroke-width="3.5"/>
      <circle cx="176" cy="34" r="11" fill="#F7C104"/>
    </svg>`;
  }
  if (kind === "tiny") {
    return `<svg viewBox="0 0 220 130" aria-hidden="true">
      <rect width="220" height="130" fill="#FAF5EE"/>
      <rect x="66" y="16" width="88" height="98" fill="#054BA5"/>
      <circle cx="110" cy="54" r="18" fill="#F7C104"/>
      <rect x="84" y="84" width="52" height="6" fill="#FAF5EE"/>
    </svg>`;
  }
  if (kind === "poetic") {
    return `<svg viewBox="0 0 220 130" aria-hidden="true">
      <rect width="220" height="130" fill="#FAF5EE"/>
      <rect x="14" y="88" width="192" height="28" fill="#054BA5"/>
      <rect x="44" y="42" width="14" height="46" fill="#011323"/>
      <circle cx="172" cy="38" r="10" fill="#F7C104"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 220 130" aria-hidden="true">
    <rect width="220" height="130" fill="#FAF5EE"/>
    <line x1="14" y1="65" x2="206" y2="65" stroke="#044AA2" stroke-width="3"/>
    <circle cx="42" cy="65" r="8" fill="#054BA5"/>
    <circle cx="96" cy="65" r="8" fill="#054BA5"/>
    <circle cx="150" cy="65" r="8" fill="#054BA5"/>
    <circle cx="192" cy="65" r="10" fill="#F7C104" stroke="#044AA2" stroke-width="2"/>
  </svg>`;
}

function renderAntiGrid() {
  elAntiGrid.innerHTML = ANTI_CASES.map((c, i) => {
    const alt = antiState[i];
    const linksHtml = c.links.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join(" / ");
    return `<article class="anti-card">
      <div class="anti-svg">${buildAntiSvg(c.kind, alt)}</div>
      <h3>${c.title}</h3>
      <p>${c.why}</p>
      <button type="button" class="anti-flip${alt ? " is-alt" : ""}" data-anti="${i}" aria-pressed="${alt}">
        ${alt ? "当前：更合适构图（点回看错套）" : "点看改换构图"}
      </button>
      <div class="anti-links">${c.instead}${linksHtml}</div>
    </article>`;
  }).join("");
}

elAntiGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".anti-flip");
  if (!btn) return;
  const idx = Number(btn.dataset.anti);
  antiState[idx] = !antiState[idx];
  renderAntiGrid();
});

renderAntiGrid();

// ---------- 07 节：两道严格单变量盲测 ----------
const quizAnswers = {};
const elQuizList = document.getElementById("quiz-list");

function renderQuizzes() {
  elQuizList.innerHTML = QUIZZES.map((q) => {
    const picked = quizAnswers[q.id] || null;
    const pickedOpt = picked ? q.options.find((o) => o.key === picked) : null;
    const isCorrect = picked === q.answer;
    const optsHtml = q.options.map((o) => {
      let cls = "quiz-opt";
      if (picked) {
        if (o.key === q.answer) cls += " is-correct";
        else if (o.key === picked) cls += " is-wrong";
      }
      return `<button type="button" class="${cls}" data-quiz="${q.id}" data-opt="${o.key}" aria-pressed="${picked === o.key}">
        ${buildDualAxisSvg({ axisX: o.axisX, axisY: o.axisY, quads: o.quads, focusMode: o.focusMode, focusPos: o.focusPos })}
        <span class="quiz-opt-label">方案 ${o.key}</span>
      </button>`;
    }).join("");

    const fbHtml = pickedOpt
      ? `<div class="quiz-feedback ${isCorrect ? "is-ok" : "is-bad"}" role="status">
          <span>${pickedOpt.feedback}</span>
          <button type="button" class="ctrl-btn" data-retry="${q.id}">重做本题</button>
        </div>`
      : "";

    return `<article class="quiz-card">
      <div class="quiz-meta">
        <span class="quiz-idx">${q.index}</span>
        <span class="quiz-var">${q.variable}</span>
      </div>
      <p class="quiz-prompt">${q.prompt}</p>
      <div class="quiz-options">${optsHtml}</div>
      ${fbHtml}
    </article>`;
  }).join("");
}

elQuizList.addEventListener("click", (e) => {
  const retry = e.target.closest("[data-retry]");
  if (retry) {
    delete quizAnswers[retry.dataset.retry];
    renderQuizzes();
    return;
  }
  const opt = e.target.closest(".quiz-opt");
  if (!opt) return;
  quizAnswers[opt.dataset.quiz] = opt.dataset.opt;
  renderQuizzes();
});

renderQuizzes();

// ---------- 08 节：同小类 14 篇互链 + 原海报放大拖动灯箱 ----------
document.getElementById("sibling-links").innerHTML = SIBLINGS.map(
  (s) => `<li><a href="https://layout.xiaoxiaodong.ai/${s.id}/play/" target="_blank" rel="noopener">${s.id} ${s.name}</a></li>`
).join("");

const elLightbox = document.getElementById("lightbox");
const elLbStage = document.getElementById("lb-stage");
const elLbImg = document.getElementById("lb-img");
const elPoster = document.getElementById("poster");
let lbScale = 1, lbX = 0, lbY = 0, lbDragging = false, lbStart = { x: 0, y: 0 };

function applyLbTransform() {
  elLbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLightbox() {
  if (!elLbImg.src) elLbImg.src = elPoster.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  elLightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  elLightbox.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 1, 3.2); applyLbTransform(); });
document.getElementById("lb-out").addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 1, 3.2); if (lbScale === 1) { lbX = 0; lbY = 0; } applyLbTransform(); });
document.getElementById("lb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

elLbStage.addEventListener("pointerdown", (e) => {
  if (e.target === elLbStage && lbScale === 1) { closeLightbox(); return; }
  lbDragging = true;
  elLbStage.classList.add("is-dragging");
  lbStart = { x: e.clientX - lbX, y: e.clientY - lbY };
  elLbStage.setPointerCapture(e.pointerId);
});

elLbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = e.clientX - lbStart.x;
  lbY = e.clientY - lbStart.y;
  applyLbTransform();
});

elLbStage.addEventListener("pointerup", () => {
  lbDragging = false;
  elLbStage.classList.remove("is-dragging");
});

elLbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !elLightbox.hidden) closeLightbox();
});
