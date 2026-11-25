// 282 地图主导布局 · 主入口（联动开场活体地图与 01–07 节互动模块）

import {
  SCENARIOS,
  createInitialState,
  applyPreset,
  evaluateMap,
} from "./model.js";
import { mountHeroCanvas } from "./canvas-hero.js";
import {
  mountLayerPeel,
  mountZoomCluster,
  mountTopoMorph,
  mountLineage,
  mountNotUseTriage,
  mountQuiz,
  mountPosterLightbox,
} from "./sections.js";

let heroState = createInitialState("coastal");
let heroCanvasApi = null;

const textCache = new Map();
function setText(id, txt) {
  if (textCache.get(id) === txt) return;
  textCache.set(id, txt);
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function syncHeroUI() {
  const ev = evaluateMap(heroState);
  const sc = SCENARIOS[heroState.scenarioId] || SCENARIOS.coastal;

  // 顶栏状态章与提示徽
  const topPill = document.getElementById("topStatusPill");
  if (topPill) {
    topPill.textContent = ev.allPass ? "4 / 4 已理顺" : `${ev.passCount} / 4 待理图`;
    topPill.classList.toggle("is-pass", ev.allPass);
  }
  setText("tipsScoreVal", `${ev.passCount} / 4`);
  const tipsBadge = document.getElementById("tipsBadgeBox");
  if (tipsBadge) tipsBadge.classList.toggle("is-pass", ev.allPass);

  // 场景按钮选中态
  document.querySelectorAll("[data-scenario]").forEach((btn) => {
    const on = btn.dataset.scenario === heroState.scenarioId;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  // 左侧 4 张原海报功能卡的实时状态章
  const badgeMap = {
    anchor: ev.checks.anchor,
    region: ev.checks.region,
    route: ev.checks.route,
    proximity: ev.checks.proximity,
  };
  for (const [k, obj] of Object.entries(badgeMap)) {
    const chip = document.getElementById(`layerStatus-${k}`);
    if (chip) {
      chip.textContent = obj.badge;
      chip.classList.toggle("is-pass", obj.pass);
      chip.classList.toggle("is-err", !obj.pass);
    }
    const card = document.getElementById(`layerCard-${k}`);
    if (card) {
      card.classList.toggle("is-pass", obj.pass);
      card.classList.toggle("is-err", !obj.pass);
    }
  }

  // 四组控件选中态
  document.querySelectorAll("[data-anchor-mode]").forEach((b) => {
    const on = b.dataset.anchorMode === heroState.anchorMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-region-palette]").forEach((b) => {
    const on = b.dataset.regionPalette === heroState.regionPalette;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-route-topo]").forEach((b) => {
    const on = b.dataset.routeTopo === heroState.routeTopology;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-context-level]").forEach((b) => {
    const on = b.dataset.contextLevel === heroState.contextLevel;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 底部 5 项原海报图例实时读数
  setText("legAnchorVal", `${ev.metrics.anchorRatio} · ${ev.metrics.hubTerrain}`);
  setText("legSecondaryVal", `${sc.nodes.length} 节点 · 选 ${heroState.selectedId === "hub" ? sc.hubName : (sc.nodes.find((n) => n.id === heroState.selectedId)?.name || sc.hubName)}`);
  setText("legRouteVal", ev.metrics.crossingCount > 0 ? `交叉 ${ev.metrics.crossingCount} 处` : heroState.routeTopology === "none" ? "未连线" : "0 处交叉");
  setText("legRegionVal", `${ev.metrics.regionCount} 色区域`);
  setText("legContextVal", `${ev.metrics.contextLabel} · 最长引线 ${ev.metrics.maxLeaderPct}%`);

  // 白话单真源诊单
  const diagBox = document.getElementById("heroDiagnosis");
  if (diagBox) {
    diagBox.classList.toggle("is-pass", ev.allPass);
    diagBox.classList.toggle("is-err", !ev.allPass);
  }
  setText("diagTag", ev.diagnosis.tag);
  setText("diagHeadline", ev.diagnosis.headline);
  setText("diagWhy", ev.diagnosis.why);
  setText("diagAction", ev.diagnosis.action);

  // 原海报四条「使用要点」勾选状态实时点亮
  const tipIds = [
    ["tipCheck-anchor", ev.checks.anchor.pass],
    ["tipCheck-region", ev.checks.region.pass],
    ["tipCheck-route", ev.checks.route.pass],
    ["tipCheck-proximity", ev.checks.proximity.pass],
  ];
  for (const [id, ok] of tipIds) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("is-done", ok);
  }

  // 手机首屏紧接地图的快修胶囊状态同步
  const quickFixCards = document.getElementById("quickSnapCardsBtn");
  if (quickFixCards) {
    quickFixCards.textContent =
      ev.cardMeta.farCount > 0 || ev.cardMeta.overlapCount > 0
        ? `拉近 ${ev.cardMeta.farCount + ev.cardMeta.overlapCount} 张偏移卡`
        : "卡片已就近";
    quickFixCards.classList.toggle("is-done", ev.cardMeta.farCount === 0 && ev.cardMeta.overlapCount === 0);
  }
}

function bindHeroControls() {
  // 场景切换（保留当前各维度开关，只换场景与坐标文案）
  document.querySelectorAll("[data-scenario]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextId = btn.dataset.scenario;
      if (nextId === heroState.scenarioId) return;
      const sc = SCENARIOS[nextId];
      // 若当前处于全过态则切到新场景的干净排布，否则保持相同破损/修正状态
      const ev = evaluateMap(heroState);
      heroState = {
        ...heroState,
        scenarioId: nextId,
        cards: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...(ev.cardMeta.farCount === 0 ? n.cleanCard : n.brokenCard) }])),
        ctrls: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...(ev.crossings.length === 0 ? n.cleanCtrl : n.brokenCtrl) }])),
      };
      heroCanvasApi?.invalidate();
      syncHeroUI();
    });
  });

  // 四大图层卡按钮
  document.querySelectorAll("[data-anchor-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      heroState = { ...heroState, anchorMode: btn.dataset.anchorMode };
      heroCanvasApi?.draw();
      syncHeroUI();
    });
  });
  document.querySelectorAll("[data-region-palette]").forEach((btn) => {
    btn.addEventListener("click", () => {
      heroState = { ...heroState, regionPalette: btn.dataset.regionPalette };
      heroCanvasApi?.invalidate();
      syncHeroUI();
    });
  });
  document.querySelectorAll("[data-route-topo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const topo = btn.dataset.routeTopo;
      const sc = SCENARIOS[heroState.scenarioId];
      heroState = {
        ...heroState,
        routeTopology: topo,
        ctrls:
          topo === "custom"
            ? Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.brokenCtrl }]))
            : heroState.ctrls,
      };
      heroCanvasApi?.draw();
      syncHeroUI();
    });
  });
  document.querySelectorAll("[data-context-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      heroState = { ...heroState, contextLevel: btn.dataset.contextLevel };
      heroCanvasApi?.invalidate();
      syncHeroUI();
    });
  });

  // 卡片一键就近归位（方便不想逐个拖卡的键鼠/触屏用户）
  document.querySelectorAll("[data-snap-cards]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sc = SCENARIOS[heroState.scenarioId];
      heroState = {
        ...heroState,
        cards: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.cleanCard }])),
      };
      heroCanvasApi?.draw();
      syncHeroUI();
    });
  });

  // 预设解与复原错态
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      heroState = applyPreset(heroState, btn.dataset.preset);
      heroCanvasApi?.invalidate();
      syncHeroUI();
    });
  });
}

function init() {
  const heroCanvas = document.getElementById("heroMapCanvas");
  if (heroCanvas) {
    heroCanvasApi = mountHeroCanvas(
      heroCanvas,
      () => heroState,
      (next) => { heroState = next; },
      syncHeroUI
    );
  }
  bindHeroControls();
  syncHeroUI();

  // 第 01–07 节交互模块
  mountLayerPeel();
  mountZoomCluster();
  mountTopoMorph();
  mountLineage();
  mountNotUseTriage();
  mountQuiz();
  mountPosterLightbox();
}

init();
