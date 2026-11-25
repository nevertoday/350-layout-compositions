// 073 平行透视构图 · 页面总装配入口

import { initHeroStage } from "./heroStage.js";
import {
  initSec01Axes,
  initSec02Similar,
  initSec03Css3d,
  initSec04History,
  initSec05Focal,
  initSec06Dont,
  initSec07Quiz,
  initPosterLightbox,
} from "./labs.js";

const heroApi = initHeroStage({
  stageEl: document.getElementById("hero-stage"),
  canvas: document.getElementById("hero-canvas"),
  vpHandle: document.getElementById("vp-handle"),
  edgeLeftBtn: document.getElementById("edge-left"),
  edgeRightBtn: document.getElementById("edge-right"),
  resetBtn: document.getElementById("hero-reset"),
  readoutRatio: document.getElementById("m-ratio"),
  readoutRatioSub: document.getElementById("m-ratio-sub"),
  readoutVp2: document.getElementById("m-vp2"),
  readoutVp2Sub: document.getElementById("m-vp2-sub"),
  readoutWall: document.getElementById("m-wall"),
  readoutWallSub: document.getElementById("m-wall-sub"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  statusChip: document.getElementById("hero-status-chip"),
  keyPoints: [...document.querySelectorAll(".kp-item")],
});

// 暴露只读调试引用供交互自测核对同源数学读数（不影响生产运行）
window.__xxd073 = {
  getState: heroApi.getState,
  getProjection: heroApi.getProjection,
};

initSec01Axes(document.getElementById("sec-01"));
initSec02Similar(document.getElementById("sec-02"));
initSec03Css3d(document.getElementById("sec-03"));
const sec04Api = initSec04History(document.getElementById("sec-04"));
initSec05Focal(document.getElementById("sec-05"));
initSec06Dont(document.getElementById("sec-06"));
initSec07Quiz(document.getElementById("sec-07"));
initPosterLightbox();

for (const link of document.querySelectorAll("[data-jump-shift]")) {
  link.addEventListener("click", () => {
    if (sec04Api) sec04Api.selectEra("shift");
  });
}
