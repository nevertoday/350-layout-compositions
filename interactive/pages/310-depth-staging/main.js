// 310 深度调度 DEPTH STAGING — 主入口
import { webgl } from "../../lib/stage.js";
import { createStore, SCRIPTS } from "./model.js";
import { mountScene3D } from "./scene-3d.js";
import { mountSceneFlat } from "./scene-flat.js";
import { mountDepthRail } from "./depth-rail.js";
import { initPoster } from "./poster.js";
import {
  initLayerStack,
  initLensLab,
  initNarrativeLab,
  initSightlineLab,
  initHistoryLab,
  initCounterLab,
  initPractice,
} from "./labs.js";

const store = createStore();
const stageHost = document.getElementById("stage-host");
const railHost = document.getElementById("depth-rail");

// 1. 挂载开场主角舞台（支持 WebGL 时用 Three.js 3D 水桥片场，关闭 WebGL 自动降级为同源 2D 透视画布）
if (stageHost) {
  if (webgl()) {
    mountScene3D(stageHost, store);
    stageHost.dataset.renderer = "3d";
  } else {
    mountSceneFlat(stageHost, store);
    stageHost.dataset.renderer = "2d";
  }
}

// 2. 挂载纵深剖面景片滑轨（原海报左下 DEPTH LAYERS DIAGRAM 活体化）
if (railHost) {
  mountDepthRail(railHost, store);
}

// 3. 绑定导演控制条与实时诊断单（全部读数直接源自 model.js 唯一评估结果）
const scriptBtns = [...document.querySelectorAll("[data-script]")];
const focalBtns = [...document.querySelectorAll("[data-focal]")];
const guideBtn = document.getElementById("btn-guides");
const resetBtn = document.getElementById("btn-reset");
const refBtn = document.getElementById("btn-ref");
const laneLeftBtn = document.getElementById("btn-lane-left");
const laneRightBtn = document.getElementById("btn-lane-right");
const laneTargetEl = document.getElementById("lane-target");

const briefEl = document.getElementById("script-brief");
const badgeEl = document.getElementById("diag-badge");
const headEl = document.getElementById("diag-head");
const reasonEl = document.getElementById("diag-reason");
const hintEl = document.getElementById("diag-hint");
const diagBox = document.getElementById("diag-box");

const metricRatio = document.getElementById("m-ratio");
const metricSpan = document.getElementById("m-span");
const metricOverlap = document.getElementById("m-overlap");

const calloutBg = document.getElementById("co-bg");
const calloutMg = document.getElementById("co-mg");
const calloutFg = document.getElementById("co-fg");

const chkLayers = document.getElementById("chk-layers");
const chkPersp = document.getElementById("chk-persp");
const chkSight = document.getElementById("chk-sight");

scriptBtns.forEach((btn) => {
  btn.addEventListener("click", () => store.setScript(btn.dataset.script));
});

focalBtns.forEach((btn) => {
  btn.addEventListener("click", () => store.setFocal(Number(btn.dataset.focal)));
});

guideBtn?.addEventListener("click", () => store.toggleGuides());
resetBtn?.addEventListener("click", () => store.resetInitial());
refBtn?.addEventListener("click", () => store.applyReference());

laneLeftBtn?.addEventListener("click", () => {
  const id = store.state.selected;
  store.setActorLane(id, store.state.actors[id].lane - 0.16);
});
laneRightBtn?.addEventListener("click", () => {
  const id = store.state.selected;
  store.setActorLane(id, store.state.actors[id].lane + 0.16);
});

function syncHeroUI(state, snap) {
  const sc = SCRIPTS[state.script];
  if (briefEl) briefEl.textContent = sc.brief;
  if (diagBox) diagBox.dataset.status = snap.status;
  if (badgeEl) badgeEl.textContent = snap.badge;
  if (headEl) headEl.textContent = snap.headline;
  if (reasonEl) reasonEl.textContent = snap.reason;
  if (hintEl) hintEl.textContent = snap.hint;

  if (metricRatio) metricRatio.textContent = `${snap.heightRatio.toFixed(1)}×`;
  if (metricSpan) metricSpan.textContent = `${snap.depthSpan.toFixed(1)}m`;
  if (metricOverlap) metricOverlap.textContent = `${snap.overlapPct}%`;

  const setCallout = (el, val) => {
    if (!el) return;
    el.textContent = val;
    el.closest(".co-item")?.classList.toggle("is-filled", val !== "空缺");
  };
  setCallout(calloutBg, snap.layerMap.bg);
  setCallout(calloutMg, snap.layerMap.mg);
  setCallout(calloutFg, snap.layerMap.fg);

  chkLayers?.classList.toggle("is-pass", snap.checks.layers);
  chkPersp?.classList.toggle("is-pass", snap.checks.perspective);
  chkSight?.classList.toggle("is-pass", snap.checks.sightline);

  scriptBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.script === state.script)));
  focalBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.focal) === state.focal)));
  if (guideBtn) {
    guideBtn.setAttribute("aria-pressed", String(state.showGuides));
    guideBtn.textContent = state.showGuides ? "透视线：开" : "透视线：关";
  }

  const selActor = snap.projected.find((a) => a.id === state.selected);
  if (laneTargetEl && selActor) {
    laneTargetEl.textContent = `${selActor.id} · ${selActor.z.toFixed(1)}m`;
  }
}

store.subscribe(syncHeroUI);
syncHeroUI(store.state, store.eval());

// 4. 初始化正文各节交互与原海报放大灯箱
initLayerStack();
initLensLab();
initNarrativeLab();
initSightlineLab();
initHistoryLab();
initCounterLab();
initPractice();
initPoster();
