// 122 简化构图原则 · 主入口：单真源状态联动开场解剖台、报头活体徽标、四维支柱表与正文七节交互
import {
  PRESETS,
  SUBJECTS,
  analyze,
  clonePreset,
  createInitialState,
} from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

let state = createInitialState();

// DOM 句柄
const heroCanvas = document.getElementById("hero-canvas");
const heroStamp = document.getElementById("hero-stamp");
const regSlider = document.getElementById("reg-slider");
const regVal = document.getElementById("reg-val");

const emblemClutter = document.getElementById("emblem-clutter");
const emblemCircle = document.getElementById("emblem-circle");
const emblemSquare = document.getElementById("emblem-square");
const emblemTri = document.getElementById("emblem-tri");

const verdictIcon = document.getElementById("verdict-icon");
const verdictTag = document.getElementById("verdict-tag");
const verdictHeadline = document.getElementById("verdict-headline");
const verdictDetail = document.getElementById("verdict-detail");
const verdictAction = document.getElementById("verdict-action");

const mBends = document.getElementById("m-bends");
const mOverlap = document.getElementById("m-overlap");
const mDistinct = document.getElementById("m-distinct");
const mTier = document.getElementById("m-tier");

let stageApi = null;

function syncHeroUI() {
  const info = analyze(state);

  // 1. 顶部实时状态印章
  heroStamp.textContent = info.tag;
  heroStamp.classList.toggle("is-ok", info.isOptimal);
  heroStamp.classList.toggle("is-err", !info.isOptimal);

  // 2. 自示范标题活体几何徽标：随简化状态从杂乱叠压实时坍缩成清晰三原形
  emblemClutter.style.opacity = info.activeClutterCount > 0 ? String(0.35 + info.activeClutterCount * 0.22) : "0";
  if (info.isOptimal) {
    emblemCircle.setAttribute("cx", "32");
    emblemCircle.setAttribute("cy", "14");
    emblemCircle.setAttribute("r", "7.5");
    emblemSquare.setAttribute("x", "24.5");
    emblemSquare.setAttribute("y", "25");
    emblemSquare.setAttribute("width", "15");
    emblemSquare.setAttribute("height", "15");
    emblemTri.setAttribute("points", "32,43 42,57 22,57");
  } else {
    emblemCircle.setAttribute("cx", "25");
    emblemCircle.setAttribute("cy", "25");
    emblemCircle.setAttribute("r", "10");
    emblemSquare.setAttribute("x", "31");
    emblemSquare.setAttribute("y", "21");
    emblemSquare.setAttribute("width", "17");
    emblemSquare.setAttribute("height", "17");
    emblemTri.setAttribute("points", "30,30 43,53 17,53");
  }
  emblemCircle.style.opacity = state.cores.circle.active ? "1" : "0.18";
  emblemSquare.style.opacity = state.cores.square.active ? "1" : "0.18";
  emblemTri.style.opacity = state.cores.triangle.active ? "1" : "0.18";

  // 3. 四维原海报支柱实况芯片
  for (const key of ["simplicity", "rule", "order", "readability"]) {
    const el = document.getElementById(`p-${key}`);
    const p = info.pillars[key];
    el.textContent = p.badge;
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-err", !p.ok);
  }

  // 4. 滑杆与开关同步
  regSlider.value = String(state.regularity);
  regVal.textContent = `${state.regularity}%`;

  const subj = SUBJECTS[state.subject] || SUBJECTS.poster;
  document.querySelectorAll("[data-clutter]").forEach((btn) => {
    const k = btn.dataset.clutter;
    const on = Boolean(state.clutter[k]);
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("is-on-warn", on);
    btn.textContent = subj.clutterNames[k].slice(0, 4);
  });

  document.querySelectorAll("[data-core]").forEach((btn) => {
    const k = btn.dataset.core;
    const on = Boolean(state.cores[k].active);
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("is-core-on", on);
    btn.classList.toggle("is-core-off", !on);
    btn.textContent = subj.coreNames[k];
  });

  // 5. 右侧原海报圆角黑框橘勾单真源诊单
  verdictIcon.textContent = info.isOptimal ? "✓" : "!";
  verdictIcon.classList.toggle("is-ok", info.isOptimal);
  verdictIcon.classList.toggle("is-err", !info.isOptimal);

  verdictTag.textContent = info.tag;
  verdictTag.classList.toggle("is-ok", info.isOptimal);
  verdictTag.classList.toggle("is-err", !info.isOptimal);

  verdictHeadline.textContent = info.headline;
  verdictDetail.textContent = info.detail;
  verdictAction.textContent = info.action;

  mBends.textContent = `${info.contourBends} 处`;
  mOverlap.textContent = `${info.coreOverlapPct}%`;
  mDistinct.textContent = `${info.distinctiveness}% 示意`;
  mTier.textContent = info.loadTier;

  if (stageApi) stageApi.draw();
}

function mutate(fn) {
  fn(state);
  syncHeroUI();
}

// 绑定题材切签
document.querySelectorAll("[data-subject]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextSubject = btn.dataset.subject;
    document.querySelectorAll("[data-subject]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    mutate((st) => {
      st.subject = nextSubject;
    });
  });
});

// 绑定轮廓规整滑杆
regSlider.addEventListener("input", () => {
  const v = Number(regSlider.value);
  mutate((st) => {
    st.regularity = v;
  });
});

// 绑定杂件开关
document.querySelectorAll("[data-clutter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.clutter;
    mutate((st) => {
      st.clutter[k] = !st.clutter[k];
    });
  });
});

// 绑定核心骨架开关（允许测试误删骨架触发过度简化错态）
document.querySelectorAll("[data-core]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.core;
    mutate((st) => {
      st.cores[k].active = !st.cores[k].active;
    });
  });
});

// 绑定多解与错态预设
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.preset;
    if (!PRESETS[key]) return;
    const curSubj = state.subject;
    state = clonePreset(key, curSubj);
    syncHeroUI();
  });
});

// 挂载开场 2D Canvas 解剖台
stageApi = mountHeroStage(heroCanvas, () => state, mutate);
syncHeroUI();

// 初始化正文 01–07 节全部交互
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
