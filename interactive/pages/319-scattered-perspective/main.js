// 319 散点透视 · 总控入口（main.js）
// 状态与读数唯一来源：model.js

import { THEMES, TIERS, ANGLES, clampNodePos, clonePreset, evaluate } from "./model.js";
import { createHeroStage } from "./stage.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

const state = clonePreset("broken", "poster");
let evalCache = evaluate(state);

const els = {
  canvas: document.getElementById("stageCanvas"),
  topStamp: document.getElementById("topStamp"),
  heroTitleChars: [...document.querySelectorAll(".hero-title .ch")],
  // 左侧三枚原海报圆环实时状态
  ringViews: document.getElementById("ringViews"),
  ringViewsTag: document.getElementById("ringViewsTag"),
  ringDist: document.getElementById("ringDist"),
  ringDistTag: document.getElementById("ringDistTag"),
  ringRhythm: document.getElementById("ringRhythm"),
  ringRhythmTag: document.getElementById("ringRhythmTag"),
  // 白话诊单匣
  diagBox: document.getElementById("diagBox"),
  diagBadge: document.getElementById("diagBadge"),
  diagHeadline: document.getElementById("diagHeadline"),
  diagWhy: document.getElementById("diagWhy"),
  diagAction: document.getElementById("diagAction"),
  // 4 项单真源读数
  mSpread: document.getElementById("mSpread"),
  mRhythm: document.getElementById("mRhythm"),
  mRatio: document.getElementById("mRatio"),
  mCentroid: document.getElementById("mCentroid"),
  // 选中视点提示
  selLabel: document.getElementById("selLabel"),
  // 控件组
  themeBtns: [...document.querySelectorAll("[data-theme]")],
  perspBtns: [...document.querySelectorAll("[data-persp]")],
  guideBtn: document.getElementById("guideToggleBtn"),
  nodeBtns: [...document.querySelectorAll("[data-node-pick]")],
  tierBtns: [...document.querySelectorAll("[data-tier]")],
  angleBtns: [...document.querySelectorAll("[data-angle]")],
  linkBtns: [...document.querySelectorAll("[data-link]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
};

function getSelectedNode() {
  return state.nodes.find((n) => n.id === state.selected) || state.nodes[0];
}

let stage;

function syncUI() {
  evalCache = evaluate(state);
  const ev = evalCache;
  const sel = getSelectedNode();
  const themeMeta = THEMES[state.theme] || THEMES.poster;

  // 顶部状态方章
  els.topStamp.textContent = ev.diag.ok ? "4 / 4 已成脉" : `${ev.passed} / 4 待统筹`;
  els.topStamp.classList.toggle("is-ok", ev.diag.ok);

  // 活体示范大标「散点透视」：错态时四字挤拢偏斜，达标后错落舒展归衡
  const offsets = ev.diag.ok
    ? [
        { x: 0, y: -3 },
        { x: 4, y: 4 },
        { x: 2, y: -2 },
        { x: 6, y: 2 },
      ]
    : [
        { x: 3, y: 0 },
        { x: -4, y: 1 },
        { x: -8, y: -1 },
        { x: -11, y: 2 },
      ];
  els.heroTitleChars.forEach((ch, idx) => {
    const o = offsets[idx] || { x: 0, y: 0 };
    ch.style.transform = `translate(${o.x}px, ${o.y}px)`;
  });

  // 左侧三枚原海报圆环状态同步
  const updateRing = (wrap, tagEl, info) => {
    if (!wrap || !tagEl) return;
    wrap.classList.toggle("is-ok", info.ok);
    wrap.classList.toggle("is-bad", !info.ok);
    tagEl.textContent = info.tag;
  };
  updateRing(els.ringViews, els.ringViewsTag, ev.rings.views);
  updateRing(els.ringDist, els.ringDistTag, ev.rings.dist);
  updateRing(els.ringRhythm, els.ringRhythmTag, ev.rings.rhythm);

  // 白话诊单匣
  els.diagBox.classList.toggle("is-ok", ev.diag.ok);
  els.diagBadge.textContent = `${ev.diag.badge}（${ev.passed}/${ev.total}）`;
  els.diagHeadline.textContent = ev.diag.headline;
  els.diagWhy.textContent = ev.diag.why;
  els.diagAction.textContent = ev.diag.action;

  // 单真源 4 格实时读数
  els.mSpread.textContent = `${Math.round(ev.spreadArea * 100)}%`;
  els.mSpread.classList.toggle("is-alert", ev.clumped || ev.edgeClip);

  els.mRhythm.textContent = `CV ${ev.rhythmCV.toFixed(2)}`;
  els.mRhythm.classList.toggle("is-alert", ev.gridRigid || ev.clumped);

  els.mRatio.textContent = `${ev.weightRatio.toFixed(1)}×`;
  els.mRatio.classList.toggle("is-alert", ev.flatWeights || ev.monopoly);

  els.mCentroid.textContent = `偏 ${Math.round(ev.balanceOffset * 100)}%`;
  els.mCentroid.classList.toggle("is-alert", ev.lopsided);

  // 当前选中节点说明与按钮状态
  els.selLabel.textContent = `${themeMeta.names[sel.id]} · ${TIERS[sel.tier].label} · ${ANGLES[sel.angle].label}`;

  els.themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.perspBtns.forEach((b) => {
    const on = b.dataset.persp === state.perspective;
    b.classList.toggle("is-active", on);
    b.classList.toggle("is-danger", on && state.perspective === "single");
    b.setAttribute("aria-pressed", String(on));
  });
  if (els.guideBtn) {
    els.guideBtn.textContent = state.guides ? "标尺: 开" : "标尺: 关";
    els.guideBtn.setAttribute("aria-pressed", String(state.guides));
  }
  els.nodeBtns.forEach((b) => {
    const id = b.dataset.nodePick;
    const on = id === state.selected;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.tierBtns.forEach((b) => {
    const on = b.dataset.tier === sel.tier;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.angleBtns.forEach((b) => {
    const on = b.dataset.angle === sel.angle;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.linkBtns.forEach((b) => {
    const on = b.dataset.link === state.linkMode;
    b.classList.toggle("is-active", on);
    b.classList.toggle("is-danger", on && (state.linkMode === "none" || state.linkMode === "chaos"));
    b.setAttribute("aria-pressed", String(on));
  });

  stage?.draw();
}

// 启动开场星图画布
stage = createHeroStage(
  els.canvas,
  () => state,
  () => evalCache,
  {
    onSelect(id) {
      state.selected = id;
      syncUI();
    },
    onMove(id, u, v) {
      const target = state.nodes.find((n) => n.id === id);
      if (!target) return;
      target.u = u;
      target.v = v;
      syncUI();
    },
  }
);

// 键盘方向键微调当前选中视点（焦点在画布或节点选择器上时可用）
els.canvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.05 : 0.02;
  const sel = getSelectedNode();
  let du = 0;
  let dv = 0;
  if (e.key === "ArrowLeft") du = -step;
  else if (e.key === "ArrowRight") du = step;
  else if (e.key === "ArrowUp") dv = -step;
  else if (e.key === "ArrowDown") dv = step;
  else if (e.key === "Tab") return;
  else return;

  e.preventDefault();
  const next = clampNodePos(sel.u + du, sel.v + dv);
  sel.u = next.u;
  sel.v = next.v;
  syncUI();
});

// 绑定所有开场操控按钮
els.themeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    syncUI();
  });
});

els.perspBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.perspective = b.dataset.persp;
    syncUI();
  });
});

els.guideBtn?.addEventListener("click", () => {
  state.guides = !state.guides;
  syncUI();
});

els.nodeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.selected = b.dataset.nodePick;
    syncUI();
  });
});

els.tierBtns.forEach((b) => {
  b.addEventListener("click", () => {
    getSelectedNode().tier = b.dataset.tier;
    syncUI();
  });
});

els.angleBtns.forEach((b) => {
  b.addEventListener("click", () => {
    getSelectedNode().angle = b.dataset.angle;
    syncUI();
  });
});

els.linkBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.linkMode = b.dataset.link;
    syncUI();
  });
});

els.presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const next = clonePreset(b.dataset.preset, state.theme);
    state.perspective = next.perspective;
    state.linkMode = next.linkMode;
    state.selected = next.selected;
    state.nodes = next.nodes;
    syncUI();
  });
});

// 初始同步与正文各节初始化
syncUI();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
