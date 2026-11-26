// 086 深空间构图 · 主控脚本（开场 3D 推拉台 + Z 轴纵剖标尺 + 原海报四圆徽探针 + 切角五策略条）
import { createCorridorStage } from "./corridor.js";
import { INITIAL_STATE, PRESETS, SCENES, auditState, clamp } from "./model.js";
import {
  initPosterLightbox,
  initSection01Peel,
  initSection02History,
  initSection03DollyZoom,
  initSection04Wipe,
  initSection05Avoid,
  initSection06Quiz,
} from "./sections.js";

const state = { ...INITIAL_STATE };
let latestAudit = auditState(state);

const stageHost = document.getElementById("corridor-stage");
const overlayCanvas = document.getElementById("corridor-overlay");
const heroSun = document.getElementById("hero-sun");

// HUD & 控件引用
const hudDepth = document.getElementById("hud-depth");
const hudEngine = document.getElementById("hud-engine");
const headerBadge = document.getElementById("header-audit-badge");
const diagBadge = document.getElementById("diag-badge");
const diagGrade = document.getElementById("diag-grade");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const diagFixBtn = document.getElementById("diag-fix-btn");
const diagPulseBtn = document.getElementById("diag-pulse-btn");
const cutawayBtn = document.getElementById("cutaway-btn");
const rulerBtn = document.getElementById("ruler-btn");

const metricSpan = document.getElementById("m-span");
const metricFg = document.getElementById("m-fg");
const metricScale = document.getElementById("m-scale");
const metricFov = document.getElementById("m-fov");

const spreadRange = document.getElementById("ctrl-spread");
const spreadVal = document.getElementById("ctrl-spread-val");
const fgRange = document.getElementById("ctrl-fg");
const fgVal = document.getElementById("ctrl-fg-val");
const figRange = document.getElementById("ctrl-fig");
const figVal = document.getElementById("ctrl-fig-val");
const fovRange = document.getElementById("ctrl-fov");
const fovVal = document.getElementById("ctrl-fov-val");
const guideToggle = document.getElementById("ctrl-guide");
const portalBtns = [...document.querySelectorAll("[data-portals]")];
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const cueCards = [...document.querySelectorAll("[data-cue-card]")];
const stratCards = [...document.querySelectorAll("[data-strategy]")];
const railSvg = document.getElementById("z-rail-svg");

// 创建 3D 走廊舞台（Three.js / 2D 降级自动衔接）
let dragSyncRaf = 0;
const stage = createCorridorStage(
  stageHost,
  overlayCanvas,
  () => state,
  (action) => {
    if (action.type === "getAudit") return latestAudit;
    if (action.type === "set") {
      if (action.fromDrag) {
        Object.assign(state, action.patch);
        latestAudit = auditState(state);
        stage.markDirty();
        if (!dragSyncRaf) {
          dragSyncRaf = requestAnimationFrame(() => {
            dragSyncRaf = 0;
            syncUI();
          });
        }
      } else {
        applyPatch(action.patch);
      }
    }
    return latestAudit;
  }
);

if (hudEngine) {
  hudEngine.textContent = stage.isWebGL ? "3D WEBGL" : "2D 透视降级";
}

// 绘制紧贴舞台下方的「Z 轴建筑纵剖标尺条」（可直拖红人节点深入走廊！）
let lastRailHtml = "";
let lastRailTs = 0;
function renderElevationRail(audit, force = false) {
  if (!railSvg) return;
  const now = performance.now();
  if (!force && now - lastRailTs < 65) return;
  lastRailTs = now;
  const layout = audit.layout;
  const maxM = 36;
  const W = 720;
  const H = 76;
  const x0 = 56;
  const x1 = W - 26;
  const zToX = (zNeg) => x0 + (clamp(Math.abs(zNeg), 0, maxM) / maxM) * (x1 - x0);

  const fgX = zToX(layout.fg.z);
  const figX = zToX(layout.figure.z);
  const endX = zToX(layout.floorEndZ);

  const ticks = [0, 5, 10, 15, 20, 25, 30, 35]
    .map((m) => {
      const x = zToX(m);
      return `<line x1="${x}" y1="54" x2="${x}" y2="62" stroke="#7A8D84" stroke-width="1"/><text x="${x}" y="73" text-anchor="middle" font-family="DM Mono, monospace" font-size="10" fill="#3C4B48">${m}m</text>`;
    })
    .join("");

  const portalBars = layout.portals
    .map((p, idx) => {
      const x = zToX(p.z);
      const h = 24 - idx * 1.5;
      const fill = idx === 0 ? "#1B4949" : idx === 1 ? "#325955" : "#6B827B";
      return `<rect x="${x - 3}" y="${52 - h}" width="6" height="${h}" fill="${fill}"/><text x="${x}" y="64" text-anchor="middle" font-family="DM Mono, monospace" font-size="9" fill="#1B4949">P${idx + 1}</text>`;
    })
    .join("");

  const fgH = Math.round(state.fgOverlap * 42);
  const fgColor = !audit.cues.overlap.ok ? "#B82A12" : "#1B4949";
  const figDistM = Math.abs(layout.figure.z - layout.zFirst + 3.6).toFixed(1);

  const html = `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#FAF4E8"/>
    <line x1="${x0}" y1="52" x2="${x1}" y2="52" stroke="#1B4949" stroke-width="1.5"/>
    <!-- 走廊有效跨度高亮槽 -->
    <rect x="${zToX(layout.zFirst)}" y="48" width="${Math.max(4, endX - zToX(layout.zFirst))}" height="4" fill="#325955" opacity="0.35"/>
    <!-- 相机机位 -->
    <circle cx="${x0}" cy="34" r="5" fill="#111817"/>
    <line x1="${x0}" y1="34" x2="${x0}" y2="52" stroke="#111817" stroke-width="1.2"/>
    <text x="12" y="38" font-family="Noto Serif SC, serif" font-size="11" fill="#111817">机位</text>
    <!-- 前景叶影标 -->
    <rect x="${fgX - 3}" y="${52 - Math.max(6, fgH)}" width="6" height="${Math.max(6, fgH)}" fill="${fgColor}" opacity="${state.fgOverlap > 0.01 ? 0.9 : 0.22}"/>
    <!-- 嵌套门框剖面柱 -->
    ${portalBars}
    <!-- 引导线示意 -->
    ${state.guideLine ? `<line x1="${zToX(2.4)}" y1="49" x2="${figX}" y2="49" stroke="#D24322" stroke-width="2" stroke-dasharray="5 3"/>` : ""}
    <!-- 可拖拽红人节点（顶部独立浮签，绝不与底部 P1 撞字） -->
    <g id="rail-figure-handle" class="rail-handle" transform="translate(${figX}, 0)">
      <line x1="0" y1="22" x2="0" y2="52" stroke="#D24322" stroke-width="2"/>
      <circle cx="0" cy="23" r="7" fill="#D24322"/>
      <circle cx="0" cy="23" r="2.6" fill="#FAF4E8"/>
      <rect x="-32" y="1" width="64" height="14" rx="2" fill="#FAF4E8" stroke="#D24322" stroke-width="1"/>
      <text x="0" y="11.5" text-anchor="middle" font-family="Noto Serif SC, serif" font-size="9.5" font-weight="600" fill="#A62C11">红人 ${figDistM}m</text>
    </g>
    ${ticks}
  `;
  if (html !== lastRailHtml) {
    lastRailHtml = html;
    railSvg.innerHTML = html;
  }
}

// 剖面标尺条直接拖拽红人 Z 深度
if (railSvg) {
  let draggingFig = false;
  const updateFigFromEvent = (clientX) => {
    const rect = railSvg.getBoundingClientRect();
    const xSvg = ((clientX - rect.left) / Math.max(1, rect.width)) * 720;
    const zTargetM = clamp(((xSvg - 56) / (720 - 26 - 56)) * 36, 4.8, 34);
    const layout = latestAudit.layout;
    const minM = Math.abs(layout.zFirst + 0.35);
    const maxM = Math.abs(layout.floorEndZ + 0.9);
    const nextDepth = clamp((zTargetM - minM) / Math.max(1.5, maxM - minM), 0.12, 0.95);
    applyPatch({ figureDepth: +nextDepth.toFixed(2) });
  };
  railSvg.addEventListener("pointerdown", (e) => {
    draggingFig = true;
    railSvg.setPointerCapture(e.pointerId);
    updateFigFromEvent(e.clientX);
  });
  railSvg.addEventListener("pointermove", (e) => {
    if (!draggingFig) return;
    updateFigFromEvent(e.clientX);
  });
  railSvg.addEventListener("pointerup", () => { draggingFig = false; });
  railSvg.addEventListener("pointercancel", () => { draggingFig = false; });
}

function syncUI() {
  latestAudit = auditState(state);
  const a = latestAudit;
  const d = a.diagnosis;

  // 刊头朱红圆日随 Z 轴拉展微动，自示范叠压层次
  if (heroSun) {
    const shift = Math.round((state.depthSpread - 0.08) * 16);
    heroSun.style.transform = `translate3d(${shift}px, 0, 0)`;
  }

  // 顶栏与舞台 HUD
  if (headerBadge) {
    headerBadge.textContent = d.badge;
    headerBadge.classList.toggle("is-pass", a.passed === 4);
  }
  if (hudDepth) {
    hudDepth.textContent = `Z跨度 ${a.spanM}m · ${state.portalCount}重门 · ${a.passed}/4`;
  }

  // 单真源深松青诊单铭牌
  if (diagBadge) {
    diagBadge.textContent = d.badge;
    diagBadge.classList.toggle("is-pass", a.passed === 4);
  }
  if (diagGrade) diagGrade.textContent = a.gradeLabel;
  if (diagTitle) diagTitle.textContent = d.headline;
  if (diagWhy) diagWhy.textContent = d.why;
  if (diagAction) diagAction.textContent = d.action;
  if (diagFixBtn) {
    diagFixBtn.textContent = d.fixLabel;
    diagFixBtn.dataset.hasPatch = d.fixPatch ? "1" : "0";
  }

  // 四项单真源实测数值
  if (metricSpan) metricSpan.textContent = `${a.spanM}m`;
  if (metricFg) metricFg.textContent = `${a.fgCoveragePct}%`;
  if (metricScale) metricScale.textContent = `1 : ${a.scaleRatio}`;
  if (metricFov) metricFov.textContent = `${state.fov}°`;

  // 同步原海报左侧四枚圆徽实时探针
  cueCards.forEach((card) => {
    const key = card.dataset.cueCard;
    const c = a.cues[key];
    if (!c) return;
    card.classList.toggle("is-ok", c.ok);
    card.classList.toggle("is-err", !c.ok);
    card.classList.toggle("is-focus", state.highlightCue === key);
    const pill = card.querySelector("[data-cue-pill]");
    if (pill) pill.textContent = c.tag;
  });

  // 同步滑轨与按钮
  if (spreadRange) spreadRange.value = String(Math.round(state.depthSpread * 100));
  if (spreadVal) spreadVal.textContent = `${a.spanM}m`;
  if (fgRange) fgRange.value = String(Math.round(state.fgOverlap * 100));
  if (fgVal) fgVal.textContent = `${a.fgCoveragePct}%`;
  if (figRange) figRange.value = String(Math.round(state.figureDepth * 100));
  if (figVal) figVal.textContent = `1 : ${a.scaleRatio}`;
  if (fovRange) fovRange.value = String(state.fov);
  if (fovVal) fovVal.textContent = `${state.fov}°`;

  if (guideToggle) {
    guideToggle.textContent = state.guideLine ? "朱红引导线：开" : "朱红引导线：关";
    guideToggle.classList.toggle("is-active", state.guideLine);
    guideToggle.setAttribute("aria-pressed", String(state.guideLine));
  }
  if (cutawayBtn) {
    cutawayBtn.textContent = state.cutaway ? "回到正面透视" : "切 3D 侧剖 X-Ray";
    cutawayBtn.classList.toggle("is-active", state.cutaway);
    cutawayBtn.setAttribute("aria-pressed", String(state.cutaway));
  }
  if (rulerBtn) {
    rulerBtn.textContent = state.showRuler ? "标尺：开" : "标尺：关";
    rulerBtn.classList.toggle("is-active", state.showRuler);
    rulerBtn.setAttribute("aria-pressed", String(state.showRuler));
  }

  portalBtns.forEach((b) => {
    const on = Number(b.dataset.portals) === state.portalCount;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  renderElevationRail(a);
  stage.markDirty();
}

function applyPatch(patch) {
  Object.assign(state, patch);
  syncUI();
}

// 控件事件绑定
spreadRange?.addEventListener("input", () => {
  applyPatch({ depthSpread: clamp(Number(spreadRange.value) / 100, 0, 1) });
});
fgRange?.addEventListener("input", () => {
  applyPatch({ fgOverlap: clamp(Number(fgRange.value) / 100, 0, 0.56) });
});
figRange?.addEventListener("input", () => {
  applyPatch({ figureDepth: clamp(Number(figRange.value) / 100, 0.12, 0.95) });
});
fovRange?.addEventListener("input", () => {
  applyPatch({ fov: clamp(Number(fovRange.value), 22, 76) });
});
guideToggle?.addEventListener("click", () => {
  const next = !state.guideLine;
  applyPatch({ guideLine: next });
  if (next) stage.triggerPulse();
});
cutawayBtn?.addEventListener("click", () => {
  applyPatch({ cutaway: !state.cutaway });
});
rulerBtn?.addEventListener("click", () => {
  applyPatch({ showRuler: !state.showRuler });
});
diagPulseBtn?.addEventListener("click", () => {
  stage.triggerPulse();
});
diagFixBtn?.addEventListener("click", () => {
  const patch = latestAudit.diagnosis.fixPatch;
  if (patch) {
    applyPatch(patch);
  } else {
    stage.triggerPulse();
  }
});

portalBtns.forEach((b) => {
  b.addEventListener("click", () => applyPatch({ portalCount: Number(b.dataset.portals) }));
});
sceneBtns.forEach((b) => {
  b.addEventListener("click", () => applyPatch({ scene: b.dataset.scene }));
});
presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) applyPatch(p.patch);
  });
});

// 左侧四枚圆徽探针：点击聚焦该维度并在舞台触发温和提示
cueCards.forEach((card) => {
  card.addEventListener("click", () => {
    const k = card.dataset.cueCard;
    applyPatch({ highlightCue: state.highlightCue === k ? null : k });
  });
});

// 底部切角五策略条：点击即时在上方 3D 走廊里示范该策略
const STRATEGY_DEMOS = {
  frames: () => applyPatch({ portalCount: 4, depthSpread: Math.max(state.depthSpread, 0.72), highlightCue: "layering" }),
  overlap: () => applyPatch({ fgOverlap: 0.22, highlightCue: "overlap" }),
  guide: () => { applyPatch({ guideLine: true, fov: Math.max(state.fov, 48), highlightCue: "depth" }); stage.triggerPulse(); },
  scale: () => applyPatch({ figureDepth: 0.78, depthSpread: Math.max(state.depthSpread, 0.70), highlightCue: "scale" }),
  multi: () => applyPatch({ ...PRESETS.posterClassic.patch, cutaway: true, highlightCue: null }),
};
stratCards.forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.strategy;
    stratCards.forEach((c) => c.classList.toggle("is-active", c === card));
    STRATEGY_DEMOS[key]?.();
  });
});

// 键盘操作（←/→ 推拉 Z 纵深，↑/↓ 调整红人深浅，X 切 3D 侧剖，Space 播视线穿透）
document.addEventListener("keydown", (e) => {
  const tag = (e.target?.tagName || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (!document.getElementById("poster-lightbox")?.hidden) return;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    applyPatch({ depthSpread: clamp(+(state.depthSpread + 0.08).toFixed(2), 0, 1) });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    applyPatch({ depthSpread: clamp(+(state.depthSpread - 0.08).toFixed(2), 0, 1) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    applyPatch({ figureDepth: clamp(+(state.figureDepth + 0.08).toFixed(2), 0.12, 0.95) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    applyPatch({ figureDepth: clamp(+(state.figureDepth - 0.08).toFixed(2), 0.12, 0.95) });
  } else if (e.key === "x" || e.key === "X") {
    applyPatch({ cutaway: !state.cutaway });
  } else if (e.key === " ") {
    if (tag === "BUTTON") return;
    e.preventDefault();
    stage.triggerPulse();
  }
});

// 初始化开场与七个正文模块
syncUI();
initSection01Peel();
initSection02History();
initSection03DollyZoom();
initSection04Wipe();
initSection05Avoid();
initSection06Quiz();
initPosterLightbox();
