// 064 网络构图 — 主入口：把 model.js 单真源状态同步到舞台、三栏账簿、四关键词与正文七节
import {
  THEMES,
  applyPreset,
  createInitialState,
} from "./model.js";
import { mountHeroStage } from "./hero-canvas.js";
import {
  mountAnatomyLab,
  mountBaranLab,
  mountCrossingLab,
  mountHistoryLab,
  mountPosterLightbox,
  mountQuiz,
  mountScenarioLab,
} from "./sections.js";

const state = createInitialState();

// DOM 引用
const stageEl = document.getElementById("heroStage");
const heroCanvas = document.getElementById("heroCanvas");
const coreEl = document.getElementById("heroCoreNode");
const coreLine1 = document.getElementById("coreLine1");
const coreLine2 = document.getElementById("coreLine2");
const coreEn = document.getElementById("coreEn");
const handlesEl = document.getElementById("heroHandles");
const stageCue = document.getElementById("stageCue");

const topScorePill = document.getElementById("topScorePill");
const diagBadge = document.getElementById("diagBadge");
const diagHeadline = document.getElementById("diagHeadline");
const diagBody = document.getElementById("diagBody");
const diagAction = document.getElementById("diagAction");

const mCross = document.getElementById("mCross");
const mOuter = document.getElementById("mOuter");
const mEdges = document.getElementById("mEdges");
const mSpace = document.getElementById("mSpace");

const btnFlowToggle = document.getElementById("btnFlowToggle");
const btnPulseWave = document.getElementById("btnPulseWave");
const btnOutage = document.getElementById("btnOutage");
const outageBtnText = document.getElementById("outageBtnText");

const scaleBtns = [...document.querySelectorAll("[data-scale]")];
const brushBtns = [...document.querySelectorAll("[data-brush]")];
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

function syncUI(ev) {
  const theme = THEMES[state.theme];
  coreLine1.textContent = theme.coreTitle[0];
  coreLine2.textContent = theme.coreTitle[1];
  coreEn.textContent = theme.coreEn;

  // 舞台顶部操作提示
  if (state.selectedNode) {
    const name = state.selectedNode === "core" ? "中心枢纽" : theme.nodes[state.selectedNode]?.label || state.selectedNode;
    const verb = state.brush === "cut" ? "剪断连线" : state.brush === "solid" ? "织入主连实线" : "织入次连虚线";
    stageCue.textContent = `已选「${name}」：再点另一圆${verb}，点空白取消`;
    stageCue.classList.add("is-picking");
  } else if (state.hubOutage) {
    stageCue.textContent = `中心断电测试中：外围连通 ${Math.round(ev.outerReachPct * 100)}%（再点按钮恢复）`;
    stageCue.classList.add("is-picking");
  } else {
    stageCue.textContent = "拖圆解结 · 点两圆织线 · 点线切实虚";
    stageCue.classList.remove("is-picking");
  }

  // 顶部与诊单分数
  const passed = ev.score === 4;
  topScorePill.textContent = passed ? "4 / 4 拓扑成网" : `${ev.score} / 4 待理网`;
  topScorePill.classList.toggle("is-pass", passed);
  topScorePill.classList.toggle("is-warn", !passed);

  diagBadge.textContent = ev.diagnosis.badge;
  diagBadge.classList.toggle("is-pass", passed);
  diagBadge.classList.toggle("is-warn", !passed);
  diagHeadline.textContent = ev.diagnosis.headline;
  diagBody.textContent = ev.diagnosis.body;
  diagAction.textContent = ev.diagnosis.action;

  // 单真源实测读数
  mCross.textContent = `${ev.crossings.length} 处`;
  mOuter.textContent = `${Math.round(ev.outerReachPct * 100)}%`;
  mEdges.textContent = `实 ${ev.solidCount} / 虚 ${ev.dashedCount}`;
  mSpace.textContent = `${ev.whitespacePct}%`;

  // 四枚原海报底沿关键词验收状态
  const kwMap = {
    conn: ev.checks.conn
      ? `全连通 · ${ev.edgeCount} 边`
      : ev.isolatedIds.length
        ? `孤岛 ${ev.isolatedIds.length} 枚`
        : ev.hairball
          ? `过密 ${ev.edgeCount} 边`
          : `断开 ${ev.componentCount} 片`,
    link: ev.checks.link
      ? `交叉 ${ev.crossings.length} · 分级清`
      : ev.crossings.length > 1 || ev.corePierced.length
        ? `交叉 ${ev.crossings.length} 处`
        : ev.overlaps.length
          ? `节点压叠`
          : `实 ${ev.solidCount} / 虚 ${ev.dashedCount}`,
    sys: ev.checks.sys
      ? `${ev.scaleRatio}× · 断心 ${Math.round(ev.outerReachPct * 100)}%`
      : state.scaleMode !== "tiered"
        ? state.scaleMode === "inverted" ? "体量倒挂" : `平权 ${ev.scaleRatio}×`
        : `断心 ${Math.round(ev.outerReachPct * 100)}%`,
    flow: ev.checks.flow
      ? "外环闭环畅通"
      : !state.flowOn
        ? "脉流暂停"
        : "缺外环闭环",
  };
  for (const k of ["conn", "link", "sys", "flow"]) {
    const item = document.getElementById(`kw-${k}`);
    const stEl = document.getElementById(`kwState-${k}`);
    item.classList.toggle("is-pass", ev.checks[k]);
    stEl.textContent = kwMap[k];
  }

  // 同步所有按钮高亮与 aria-pressed
  scaleBtns.forEach((b) => {
    const on = b.dataset.scale === state.scaleMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  brushBtns.forEach((b) => {
    const on = b.dataset.brush === state.brush;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  presetBtns.forEach((b) => {
    const on = b.dataset.preset === state.activePreset;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  btnFlowToggle.textContent = state.flowOn ? "脉流：开" : "脉流：关";
  btnFlowToggle.classList.toggle("is-active", state.flowOn);
  btnFlowToggle.setAttribute("aria-pressed", String(state.flowOn));

  btnOutage.setAttribute("aria-pressed", String(state.hubOutage));
  outageBtnText.textContent = state.hubOutage ? "恢复中心枢纽供电" : "模拟中心断电（检去中心化）";
}

const hero = mountHeroStage({
  stageEl,
  canvas: heroCanvas,
  coreEl,
  handlesEl,
  state,
  onChange: syncUI,
});

// 绑定图例盘与演练控件
scaleBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.scaleMode = b.dataset.scale;
    state.activePreset = "custom";
    hero.refresh();
  });
});

brushBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.brush = b.dataset.brush;
    hero.refresh();
  });
});

btnFlowToggle.addEventListener("click", () => {
  state.flowOn = !state.flowOn;
  hero.refresh();
});

btnPulseWave.addEventListener("click", () => {
  state.flowOn = true;
  state.pulseBoost = 1;
  hero.refresh();
});

btnOutage.addEventListener("click", () => {
  state.hubOutage = !state.hubOutage;
  hero.refresh();
});

themeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    hero.refresh();
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(state, b.dataset.preset);
    hero.refresh();
  });
});

// 初始同步
hero.refresh();

// 挂载正文 01–07 节独立交互
mountAnatomyLab(document.getElementById("anatomyLab"));
mountCrossingLab(document.getElementById("crossingLab"));
mountBaranLab(document.getElementById("sec-03"));
mountHistoryLab(document.getElementById("sec-04"));
mountScenarioLab(document.getElementById("scenarioLab"));
mountQuiz(document.getElementById("sec-06"));
mountPosterLightbox();
