// 214 直排右起 · 主入口（连接 model.js、Hero 活字理列台与 01–07 互动节）
import { SPECIMENS, PRESETS, createInitialState } from "./model.js";
import { mountLoom } from "./loom.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initLightbox,
} from "./sections.js";

let state = createInitialState();
let lastResult = null;

// Hero DOM 句柄
const canvas = document.getElementById("loom-canvas");
const diagCard = document.getElementById("diag-card");
const diagPill = document.getElementById("diag-pill");
const mobileStatus = document.getElementById("mobile-status");
const diagHeadline = document.getElementById("diag-headline");
const diagDetail = document.getElementById("diag-detail");
const diagHint = document.getElementById("diag-hint");
const diagFixBtn = document.getElementById("diag-fix-btn");
const diagCss = document.getElementById("diag-css");
const btnScan = document.getElementById("btn-scan");
const btnGuides = document.getElementById("btn-guides");

const ctrlPitch = document.getElementById("ctrl-pitch");
const outPitch = document.getElementById("out-pitch");
const ctrlChars = document.getElementById("ctrl-chars");
const outChars = document.getElementById("out-chars");

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const punctBtns = [...document.querySelectorAll("[data-punct]")];
const scaleBtns = [...document.querySelectorAll("[data-scale]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

function syncUI(result) {
  lastResult = result;

  // 1. 诊单匣与状态徽章（单真源！）
  diagCard.classList.toggle("is-good", result.allGood);
  diagPill.textContent = result.badgeText;
  mobileStatus.textContent = result.badgeText;
  mobileStatus.classList.toggle("is-good", result.allGood);
  diagCss.textContent = result.cssSnippet;

  if (result.allGood) {
    diagHeadline.textContent = `秩序成立：${result.solutionName}`;
    diagDetail.textContent = result.solutionDesc;
    diagHint.textContent = "可以继续拉宽列距、切书封/展讯标本，或点击「演练视线流」观察右起下行回跳节拍。";
    diagFixBtn.textContent = "试探复原错态";
  } else {
    const issue = result.topIssue;
    diagHeadline.textContent = issue.title;
    diagDetail.textContent = issue.detail;
    diagHint.textContent = `怎么改：${issue.hint}`;
    diagFixBtn.textContent = issue.fixLabel;
  }

  // 2. 四←三←二←一 顶带实况灯
  const fourMap = {
    order: result.fourCircles[0],
    flow: result.fourCircles[1],
    align: result.fourCircles[2],
    space: result.fourCircles[3],
  };
  for (const [k, item] of Object.entries(fourMap)) {
    const cell = document.querySelector(`.four-cell[data-pillar="${k}"]`);
    const label = document.getElementById(`four-${k}`);
    if (cell) cell.classList.toggle("is-ok", item.ok);
    if (label) label.textContent = item.readout;
  }

  // 3. 左栏原海报五项「核心原则」实况灯
  for (const p of result.principles) {
    const li = document.querySelector(`.pr-item[data-key="${p.key}"]`);
    const badge = document.getElementById(`pr-${p.key}`);
    if (li) li.classList.toggle("is-ok", p.ok);
    if (badge) badge.textContent = p.tag;
  }

  // 4. 滑轨与切签同步
  ctrlPitch.value = state.pitch.toFixed(2);
  outPitch.textContent = `${state.pitch.toFixed(2)}×`;
  ctrlChars.value = String(state.charsPerCol);
  outChars.textContent = `${state.charsPerCol} 字/列`;

  specimenBtns.forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  alignBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.align === state.align));
  punctBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.punct === state.punct));
  scaleBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.scale === state.titleScale));

  btnGuides.classList.toggle("is-on", state.showGuides);
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  btnGuides.textContent = `参考线：${state.showGuides ? "开" : "关"}`;
}

const loom = mountLoom(
  canvas,
  () => state,
  (next) => {
    state = next;
    loom.draw();
  },
  (result) => {
    syncUI(result);
  }
);

// 控件事件绑定
specimenBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.specimen;
    if (!SPECIMENS[key]) return;
    state = {
      ...state,
      specimen: key,
      charsPerCol: SPECIMENS[key].defaultChars,
    };
    loom.draw();
  });
});

ctrlPitch.addEventListener("input", () => {
  state = { ...state, pitch: Number(ctrlPitch.value) };
  loom.draw();
});

ctrlChars.addEventListener("input", () => {
  state = { ...state, charsPerCol: Number(ctrlChars.value) };
  loom.draw();
});

alignBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, align: btn.dataset.align };
    loom.draw();
  });
});

punctBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, punct: btn.dataset.punct };
    loom.draw();
  });
});

scaleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, titleScale: btn.dataset.scale };
    loom.draw();
  });
});

btnGuides.addEventListener("click", () => {
  state = { ...state, showGuides: !state.showGuides };
  loom.draw();
});

btnScan.addEventListener("click", () => {
  loom.triggerScan();
});

diagFixBtn.addEventListener("click", () => {
  if (!lastResult) return;
  if (lastResult.allGood) {
    state = PRESETS.opening.apply(state);
  } else if (lastResult.topIssue?.fix) {
    state = lastResult.topIssue.fix(state);
  }
  loom.draw();
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    state = preset.apply(state);
    loom.draw();
  });
});

// 初始化 01–07 节交互与灯箱
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initLightbox();

// 字体加载就绪后清空离屏字列缓存并补绘一次，确保中文竖排字形精准居中
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => loom.invalidateFonts());
}
