// 091 开放式构图 · 入口模块（单真源串联 Hero、探针、诊单、操轨与正文 7 节）

import { createState, evaluate, PRESETS, SCENARIOS } from "./model.js";
import { createHeroCanvas } from "./canvas-hero.js";
import { initSections } from "./sections.js";

let state = createState();

const getState = () => state;
const setState = (patch) => {
  state = {
    ...state,
    ...patch,
    clutters: patch.clutters ? [...patch.clutters] : state.clutters,
  };
};

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const statusPills = [...document.querySelectorAll("[data-hero-status]")];
const diagBox = document.getElementById("hero-diag");
const diagTag = document.getElementById("diag-tag");
const diagTier = document.getElementById("diag-tier");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");

const expSlider = document.getElementById("ctrl-expansion");
const expVal = document.getElementById("val-expansion");
const sunSlider = document.getElementById("ctrl-sun");
const sunVal = document.getElementById("val-sun");
const btnEnclosure = document.getElementById("btn-enclosure");
const btnArrow = document.getElementById("btn-arrow");
const btnXrayList = [...document.querySelectorAll("[data-action-xray]")];
const btnSolveList = [...document.querySelectorAll("[data-action-solve]")];
const btnResetList = [...document.querySelectorAll("[data-action-reset]")];
const scenarioBtns = [...document.querySelectorAll("[data-scenario]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const probeBtns = [...document.querySelectorAll("[data-probe]")];
const captionEl = document.getElementById("hero-scenario-caption");

const setText = (el, val) => {
  if (el && el.textContent !== val) el.textContent = val;
};
const setAttr = (el, k, val) => {
  if (el && el.getAttribute(k) !== val) el.setAttribute(k, val);
};
const setData = (el, k, val) => {
  if (el && el.dataset[k] !== val) el.dataset[k] = val;
};

function syncUI(preEvaluated) {
  const res = preEvaluated || evaluate(state);
  const isOk = res.score === 4;
  const stStr = isOk ? "ok" : "bad";

  // 状态徽标（增量更新，避免拖拽期无谓 DOM 重排）
  statusPills.forEach((el) => {
    setText(el, res.diag.shortTag);
    setData(el, "state", stStr);
  });

  // 诊单卡
  setData(diagBox, "state", stStr);
  setText(diagTag, res.diag.shortTag);
  setText(diagTier, `空间感：${res.tier}`);
  setText(diagHeadline, res.diag.headline);
  setText(diagWhy, res.diag.why);
  setText(diagAction, res.diag.action);

  // 滑轨与读数同步
  const expStr = String(res.expansionPct);
  if (expSlider.value !== expStr) expSlider.value = expStr;
  setText(expVal, `${res.expansionPct}%`);
  const sunPct = Math.round(state.sunShift * 100);
  const sunStr = String(sunPct);
  if (sunSlider.value !== sunStr) sunSlider.value = sunStr;
  setText(sunVal, `${sunPct > 0 ? "+" : ""}${sunPct}%`);

  // 开关按钮同步
  setAttr(btnEnclosure, "aria-pressed", String(state.enclosure));
  setText(btnEnclosure, state.enclosure ? "拆封闭围栏" : "加回围栏");
  setData(btnEnclosure, "alert", state.enclosure ? "true" : "false");

  setAttr(btnArrow, "aria-pressed", String(state.arrowOut));
  setText(btnArrow, state.arrowOut ? "弧箭：外延" : "扳向外延");
  setData(btnArrow, "alert", !state.arrowOut ? "true" : "false");

  btnXrayList.forEach((b) => {
    setAttr(b, "aria-pressed", String(state.xray));
    b.classList.toggle("is-active", state.xray);
  });

  // 场景切换按钮与副注
  scenarioBtns.forEach((b) => {
    const on = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", on);
    setAttr(b, "aria-pressed", String(on));
  });
  setText(captionEl, SCENARIOS[state.scenario].caption);

  // 4 枚原海报圆环水平虚线实时探针
  probeBtns.forEach((btn) => {
    const key = btn.dataset.probe;
    const p = res.pillars[key];
    setData(btn, "state", p.ok ? "ok" : "bad");
    btn.classList.toggle("is-highlight", state.highlight === key);
    setAttr(btn, "aria-pressed", String(state.highlight === key));
    const badge = btn.querySelector(".probe-badge");
    setText(badge, p.tag);
  });
}

const hero = createHeroCanvas(heroCanvas, {
  getState,
  setState,
  onStateChange: syncUI,
});

// 绑定场景切换
scenarioBtns.forEach((b) => {
  b.addEventListener("click", () => {
    setState({ scenario: b.dataset.scenario, highlight: null });
    hero.draw();
    syncUI();
  });
});

// 绑定破框延展度与日轮切口滑轨
expSlider.addEventListener("input", () => {
  setState({ expansion: +(Number(expSlider.value) / 100).toFixed(3), highlight: null });
  hero.draw();
  syncUI();
});

sunSlider.addEventListener("input", () => {
  setState({ sunShift: +(Number(sunSlider.value) / 100).toFixed(3), highlight: null });
  hero.draw();
  syncUI();
});

// 拆装围栏与弧箭翻转
btnEnclosure.addEventListener("click", () => {
  setState({ enclosure: !state.enclosure, highlight: null });
  hero.draw();
  syncUI();
});

btnArrow.addEventListener("click", () => {
  setState({ arrowOut: !state.arrowOut, highlight: null });
  hero.draw();
  syncUI();
});

// 画外透视 + 流光巡航
btnXrayList.forEach((b) => {
  b.addEventListener("click", () => {
    hero.triggerXrayPulse();
  });
});

// 一键校准至原海报海天解 & 复原开场错态
btnSolveList.forEach((b) => {
  b.addEventListener("click", () => {
    setState({ ...PRESETS.poster.patch, highlight: null });
    hero.draw();
    syncUI();
  });
});

btnResetList.forEach((b) => {
  b.addEventListener("click", () => {
    setState({ ...PRESETS.canned.patch, xray: false, highlight: null });
    hero.draw();
    syncUI();
  });
});

// 多组合法解与双向试错按钮
presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    setState({ ...p.patch, highlight: null });
    hero.draw();
    syncUI();
  });
});

// 点击 4 枚原海报圆环探针高亮画布对应维度
probeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const key = b.dataset.probe;
    setState({ highlight: state.highlight === key ? null : key });
    hero.draw();
    syncUI();
  });
});

// 全局 Space 快捷键（仅当焦距不在输入按钮上、且灯箱未打开时）
document.addEventListener("keydown", (ev) => {
  if (ev.code !== "Space") return;
  const modal = document.getElementById("poster-modal");
  if (modal && !modal.hidden) return;
  const tag = document.activeElement?.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "A" || document.activeElement === heroCanvas) return;
  ev.preventDefault();
  hero.triggerXrayPulse();
});

syncUI();
initSections();
