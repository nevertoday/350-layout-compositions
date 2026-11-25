import { loop, pixelRatio } from "../../lib/stage.js";
import {
  VIRTUAL_W,
  VIRTUAL_H,
  SCENES,
  PRESETS,
  ZONE_BLUEPRINT,
  HISTORY_ERAS,
  QUIZ_OPTIONS,
  clamp,
  cloneShapes,
  createInitialState,
  normalizeRightRatio,
  evaluateWorkspace,
  computeViewportStrategy,
  computeFitts,
} from "./model.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ============ 主工作台状态与单真源驱动 ============
const state = createInitialState("poster");
let heroDirty = true;
let heroIntro = 0;
let dragShape = null;
let dragPan = null;
let snapGuides = { x: null, y: null };
let lastCanvasBox = { w: 0, h: 0, dpr: 1 };
let lastEvaluated = null;

// DOM 引用
const shell = $("#studio-shell");
const wsBody = $("#ws-body");
const wsCanvasCol = $("#ws-canvas-col");
const wsCanvas = $("#ws-canvas");
const wsCtx = wsCanvas.getContext("2d");
const splitter = $("#ws-splitter");
const wsRight = $("#ws-right");
const wsRightInner = $("#ws-right-inner");
const wsRightSliver = $("#ws-right-sliver");
const floatCard = $("#ws-float-card");
const layerListEl = $("#layer-list");

const ui = {
  topScore: $("#top-score"),
  titleFrame: $("#title-frame"),
  tfBadge: $("#tf-badge"),
  btnTopRulers: $("#btn-top-rulers"),
  btnZoomStep: $("#btn-zoom-step"),
  btnZen: $("#btn-zen"),
  btnZenExit: $("#btn-zen-exit"),
  wsCanvasTag: $("#ws-canvas-tag"),
  layersBadge: $("#layers-zone-badge"),
  propsBadge: $("#props-ctx-badge"),
  propsStatic: $("#props-static"),
  propsLive: $("#props-live"),
  pvX: $("#pv-x"),
  pvY: $("#pv-y"),
  pvW: $("#pv-w"),
  pvH: $("#pv-h"),
  pvScale: $("#pv-scale"),
  pvAlpha: $("#pv-alpha"),
  inSize: $("#in-size"),
  inAlpha: $("#in-alpha"),
  infoCanvas: $("#info-canvas"),
  infoSel: $("#info-sel"),
  infoCoords: $("#info-coords"),
  infoTravel: $("#info-travel"),
  diagCard: $("#diag-card"),
  diagBadge: $("#diag-badge"),
  diagTitle: $("#diag-title"),
  diagBody: $("#diag-body"),
  diagAction: $("#diag-action"),
  mNet: $("#m-net"),
  mChrome: $("#m-chrome"),
  mFloat: $("#m-float"),
  mTravel: $("#m-travel"),
  btnToggleCtx: $("#btn-toggle-ctx"),
  btnToggleFloat: $("#btn-toggle-float"),
  btnToggleRulers: $("#btn-toggle-rulers"),
  pCards: {
    canvas: { card: $("#pc-canvas"), status: $("#ps-canvas") },
    zones: { card: $("#pc-zones"), status: $("#ps-zones") },
    flex: { card: $("#pc-flex"), status: $("#ps-flex") },
    context: { card: $("#pc-context"), status: $("#ps-context") },
  },
};

function getSelectedShape() {
  return state.shapes.find((s) => s.id === state.selectedId) || state.shapes[0];
}

// 渲染图层列表（仅在结构/选中/显隐/锁定变化时更新，避免拖动分隔条时重建 DOM）
function renderLayerList() {
  layerListEl.innerHTML = "";
  const list = [...state.shapes].reverse();
  for (const s of list) {
    const li = document.createElement("li");
    li.className = "layer-row" + (s.id === state.selectedId ? " selected" : "");
    li.dataset.id = s.id;

    const selBtn = document.createElement("button");
    selBtn.type = "button";
    selBtn.className = "lr-sel";
    selBtn.innerHTML = `<span class="lr-dot ${s.kind === "circle" ? "circle" : ""}" style="background:${s.fill}"></span><span class="lr-name">${s.name}</span>`;
    selBtn.addEventListener("click", () => {
      state.selectedId = s.id;
      syncUI({ rebuildLayers: true });
    });

    const eyeBtn = document.createElement("button");
    eyeBtn.type = "button";
    eyeBtn.className = "lr-act";
    eyeBtn.setAttribute("aria-label", `${s.visible ? "隐藏" : "显示"}${s.name}`);
    eyeBtn.setAttribute("aria-pressed", String(s.visible));
    eyeBtn.textContent = s.visible ? "显" : "隐";
    eyeBtn.addEventListener("click", () => {
      s.visible = !s.visible;
      syncUI({ rebuildLayers: true });
    });

    const lockBtn = document.createElement("button");
    lockBtn.type = "button";
    lockBtn.className = "lr-act";
    lockBtn.setAttribute("aria-label", `${s.locked ? "解锁" : "锁定"}${s.name}`);
    lockBtn.setAttribute("aria-pressed", String(s.locked));
    lockBtn.textContent = s.locked ? "锁" : "开";
    lockBtn.addEventListener("click", () => {
      s.locked = !s.locked;
      syncUI({ rebuildLayers: true });
    });

    li.append(selBtn, eyeBtn, lockBtn);
    layerListEl.append(li);
  }
}

// 轻量同步所有单真源数值与样式（拖动分隔条热路径零 DOM 重建）
function syncUI({ rebuildLayers = false, fastDrag = false } = {}) {
  const ev = evaluateWorkspace(state);
  lastEvaluated = ev;
  const sel = getSelectedShape();
  const netInt = Math.round(ev.netCanvasPct);
  const chromeInt = Math.round(ev.chromePct);
  const floatInt = Math.round(ev.obstructedPct);

  // 工作台 CSS 比例直接来自 model.js 的单真源
  shell.style.setProperty("--left-pct", `${(ev.leftFrac * 100).toFixed(2)}%`);
  shell.style.setProperty("--right-pct", `${(ev.rightFrac * 100).toFixed(2)}%`);
  shell.dataset.zen = String(ev.zen);
  shell.dataset.top = state.topBar;
  shell.dataset.left = state.leftRail;
  shell.dataset.zones = state.zoneOrder;

  const isCollapsedRight = ev.rightFrac === 0;
  const isSliverRight = ev.rightFrac > 0 && ev.rightFrac < 0.145;
  wsRight.dataset.collapsed = String(isCollapsedRight);
  wsRightSliver.hidden = !isSliverRight;
  wsRightInner.hidden = isCollapsedRight || isSliverRight;
  floatCard.hidden = ev.zen || !state.floatingClutter;
  ui.btnZenExit.hidden = !ev.zen;

  splitter.setAttribute("aria-valuenow", String(Math.round(state.rightDockRatio * 100)));

  // 顶部与自示范刊头边框
  ui.topScore.textContent = ev.zen ? "专注预览 100%" : `${ev.score} / 4 ${ev.score === 4 ? "达标" : "待整理"}`;
  ui.topScore.dataset.ok = String(!ev.zen && ev.score === 4);
  ui.topScore.dataset.zen = String(ev.zen);

  ui.titleFrame.dataset.state = ev.zen ? "zen" : ev.score === 4 ? "ok" : "bad";
  ui.tfBadge.textContent = `CANVAS ${netInt}%`;
  ui.wsCanvasTag.textContent = `画布 ${netInt}%`;

  // 右侧面板状态徽与属性读数
  ui.layersBadge.textContent = state.zoneOrder === "clear" ? "清晰" : "混排";
  ui.layersBadge.dataset.ok = String(state.zoneOrder === "clear");
  ui.propsBadge.textContent = state.contextBind === "context" ? sel.name : "断联";
  ui.propsBadge.dataset.ok = String(state.contextBind === "context");
  ui.propsStatic.hidden = state.contextBind === "context";
  ui.propsLive.hidden = state.contextBind !== "context";

  ui.pvX.textContent = String(Math.round(sel.x));
  ui.pvY.textContent = String(Math.round(sel.y));
  ui.pvW.textContent = String(Math.round(sel.w));
  ui.pvH.textContent = String(Math.round(sel.h));
  const baseShape = SCENES[state.scene].shapes.find((b) => b.id === sel.id) || sel;
  const scalePct = Math.round((sel.w / baseShape.w) * 100);
  ui.pvScale.textContent = `${scalePct}%`;
  ui.inSize.value = String(clamp(scalePct, 60, 150));
  ui.pvAlpha.textContent = `${Math.round(sel.alpha)}%`;
  ui.inAlpha.value = String(Math.round(sel.alpha));

  // 底沿辅助信息条
  ui.infoCanvas.textContent = `画布净占 ${netInt}%`;
  ui.infoCanvas.dataset.ok = String(ev.principles.canvas.ok || ev.zen);
  ui.infoSel.textContent = `选中：${sel.name}`;
  ui.infoCoords.textContent = `X ${Math.round(sel.x)} · Y ${Math.round(sel.y)} · ${Math.round(sel.w)}×${Math.round(sel.h)}`;
  ui.infoTravel.textContent = `往返：${ev.travelBand}（示意）`;

  // 诊单读数
  ui.diagCard.dataset.level = ev.issue.level;
  ui.diagBadge.textContent = ev.issue.badge;
  ui.diagTitle.textContent = ev.issue.title;
  ui.diagBody.textContent = ev.issue.body;
  ui.diagAction.textContent = ev.issue.action;
  ui.mNet.textContent = `${netInt}%`;
  ui.mChrome.textContent = `${chromeInt}%`;
  ui.mFloat.textContent = `${floatInt}%`;
  ui.mTravel.textContent = `${ev.travelPxEst}px`;

  // 四原则卡
  for (const key of ["canvas", "zones", "flex", "context"]) {
    const p = ev.principles[key];
    ui.pCards[key].card.dataset.ok = String(p.ok);
    ui.pCards[key].status.textContent = p.tag;
  }

  if (!fastDrag) {
    ui.btnTopRulers.setAttribute("aria-pressed", String(state.rulers));
    ui.btnZoomStep.textContent = `${state.zoom}%`;
    ui.btnZen.setAttribute("aria-pressed", String(state.zenMode));
    ui.btnToggleCtx.textContent = `属性联动：${state.contextBind === "context" ? "开" : "关"}`;
    ui.btnToggleCtx.classList.toggle("active", state.contextBind === "context");
    ui.btnToggleCtx.classList.toggle("warn-on", state.contextBind !== "context");

    ui.btnToggleFloat.textContent = `挡画布浮窗：${state.floatingClutter ? "开" : "关"}`;
    ui.btnToggleFloat.classList.toggle("warn-on", state.floatingClutter);
    ui.btnToggleFloat.classList.toggle("active", !state.floatingClutter);

    ui.btnToggleRulers.textContent = `标尺辅助线：${state.rulers ? "开" : "关"}`;
    ui.btnToggleRulers.classList.toggle("active", state.rulers);

    $$("button[data-top]").forEach((b) => b.classList.toggle("active", b.dataset.top === state.topBar));
    $$("button[data-left]").forEach((b) => b.classList.toggle("active", b.dataset.left === state.leftRail));
    $$("button[data-zones]").forEach((b) => b.classList.toggle("active", b.dataset.zones === state.zoneOrder));
    $$("[data-tool]").forEach((b) => {
      const on = b.dataset.tool === state.activeTool;
      b.classList.toggle("active", on);
      if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", String(on));
    });
    $$(".sw-btn").forEach((b) => b.classList.toggle("active", b.dataset.fill.toLowerCase() === sel.fill.toLowerCase()));
  }

  if (rebuildLayers) renderLayerList();
  heroDirty = true;
}

// ============ 2D 画布坐标映射与绘图（60 FPS 轻量化管线） ============
function getCanvasTransform(w, h) {
  const ruler = state.rulers ? 22 : 0;
  const availW = Math.max(40, w - ruler);
  const availH = Math.max(40, h - ruler);
  const zoomMul = state.zoom / 100;
  const baseScale = Math.min((availW - 24) / VIRTUAL_W, (availH - 24) / VIRTUAL_H);
  const scale = Math.max(0.12, baseScale * zoomMul);
  const ox = ruler + (availW - VIRTUAL_W * scale) / 2 + state.pan.x;
  const oy = ruler + (availH - VIRTUAL_H * scale) / 2 + state.pan.y;
  return { ruler, scale, ox, oy, availW, availH };
}

function drawShapePath(ctx, s, scale) {
  const hw = (s.w * scale) / 2;
  const hh = (s.h * scale) / 2;
  ctx.beginPath();
  if (s.kind === "circle") {
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  } else if (s.kind === "rrect") {
    const r = Math.min(18 * scale, hw * 0.35, hh * 0.35);
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, r);
  } else if (s.kind === "rect") {
    ctx.rect(-hw, -hh, hw * 2, hh * 2);
  } else if (s.kind === "triangle") {
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, hh);
    ctx.lineTo(-hw, hh);
    ctx.closePath();
  } else if (s.kind === "arch") {
    const r = Math.min(hw * 1.15, hh * 0.72);
    ctx.moveTo(-hw + r, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, hh);
    ctx.lineTo(-hw, hh);
    ctx.lineTo(-hw, -hh + r);
    ctx.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    ctx.closePath();
  }
}

function drawWorkspaceCanvas(t, { still = false } = {}) {
  const rect = wsCanvasCol.getBoundingClientRect();
  const cssW = Math.max(60, Math.round(rect.width));
  const cssH = Math.max(60, Math.round(rect.height));
  const dpr = pixelRatio(window.innerWidth < 640 ? 1.5 : 2);
  if (lastCanvasBox.w !== cssW || lastCanvasBox.h !== cssH || lastCanvasBox.dpr !== dpr) {
    wsCanvas.width = Math.round(cssW * dpr);
    wsCanvas.height = Math.round(cssH * dpr);
    lastCanvasBox = { w: cssW, h: cssH, dpr };
  }

  const ctx = wsCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const scene = SCENES[state.scene];
  const tr = getCanvasTransform(cssW, cssH);
  const intro = still ? 1 : clamp(heroIntro / 0.65, 0, 1);

  // 1. 画布亮暖纸底
  ctx.fillStyle = scene.canvasBg;
  ctx.fillRect(0, 0, cssW, cssH);

  // 2. 细腻工程方格网
  const gridStep = Math.max(14, Math.round(50 * tr.scale));
  ctx.strokeStyle = scene.gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = ((tr.ox % gridStep) + gridStep) % gridStep; gx < cssW; gx += gridStep) {
    const x = Math.round(gx) + 0.5;
    if (x >= tr.ruler) { ctx.moveTo(x, tr.ruler); ctx.lineTo(x, cssH); }
  }
  for (let gy = ((tr.oy % gridStep) + gridStep) % gridStep; gy < cssH; gy += gridStep) {
    const y = Math.round(gy) + 0.5;
    if (y >= tr.ruler) { ctx.moveTo(tr.ruler, y); ctx.lineTo(cssW, y); }
  }
  ctx.stroke();

  // 3. 画板安全外框与原海报参考虚线
  const artW = VIRTUAL_W * tr.scale;
  const artH = VIRTUAL_H * tr.scale;
  ctx.strokeStyle = "rgba(21, 35, 49, 0.16)";
  ctx.strokeRect(tr.ox + 0.5, tr.oy + 0.5, artW, artH);

  if (state.rulers) {
    ctx.save();
    ctx.strokeStyle = "rgba(40, 185, 216, 0.65)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const midX = tr.ox + artW * 0.5;
    const midY = tr.oy + artH * 0.48;
    ctx.beginPath();
    ctx.moveTo(midX, tr.ruler);
    ctx.lineTo(midX, cssH);
    ctx.moveTo(tr.ruler, midY);
    ctx.lineTo(cssW, midY);
    ctx.stroke();
    ctx.restore();
  }

  // 4. 绘制五枚几何图形（严格按图层顺序）
  for (let i = 0; i < state.shapes.length; i++) {
    const s = state.shapes[i];
    if (!s.visible) continue;
    const sx = tr.ox + s.x * tr.scale;
    const sy = tr.oy + s.y * tr.scale;
    const pop = still ? 1 : clamp((intro - i * 0.08) / 0.55, 0.25, 1);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate((s.rot * Math.PI) / 180);
    ctx.scale(pop, pop);
    ctx.globalAlpha = s.alpha / 100;
    ctx.fillStyle = s.fill;
    drawShapePath(ctx, s, tr.scale);
    ctx.fill();
    ctx.restore();
  }

  // 5. 拖动吸附参考线（标尺开启时出现青柠/青色精准吸附线）
  if (state.rulers && (snapGuides.x !== null || snapGuides.y !== null)) {
    ctx.save();
    ctx.strokeStyle = "#1FB2C5";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (snapGuides.x !== null) {
      const gx = tr.ox + snapGuides.x * tr.scale;
      ctx.moveTo(gx, tr.ruler);
      ctx.lineTo(gx, cssH);
    }
    if (snapGuides.y !== null) {
      const gy = tr.oy + snapGuides.y * tr.scale;
      ctx.moveTo(tr.ruler, gy);
      ctx.lineTo(cssW, gy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 6. 当前选中对象的矢量包围框 + 八角控制点 + 原海报暗色参数浮标
  const sel = getSelectedShape();
  if (sel && sel.visible) {
    const sx = tr.ox + sel.x * tr.scale;
    const sy = tr.oy + sel.y * tr.scale;
    const sw = sel.w * tr.scale;
    const sh = sel.h * tr.scale;
    const bx = sx - sw / 2;
    const by = sy - sh / 2;

    ctx.save();
    ctx.strokeStyle = "#2870E3";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(bx, by, sw, sh);
    ctx.setLineDash([]);

    // 旋转顶杆（还原 283 原海报蓝圆顶部旋转小圆）
    ctx.beginPath();
    ctx.moveTo(sx, by);
    ctx.lineTo(sx, by - 14);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(sx, by - 17, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 四角与中点方节点
    const pts = [
      [bx, by], [bx + sw, by], [bx, by + sh], [bx + sw, by + sh],
      [sx, by], [sx, by + sh], [bx, sy], [bx + sw, sy],
    ];
    for (const [px, py] of pts) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(px - 3, py - 3, 6, 6);
      ctx.strokeRect(px - 3, py - 3, 6, 6);
    }

    // 仅在上下文联动开启时，在图形旁展示 283 原海报同款暗色参数浮标（W/H/X/Y）
    if (state.contextBind === "context" && cssW >= 150) {
      const bw = 92;
      const bh = 54;
      const tx = clamp(sx + 10, tr.ruler + 6, cssW - bw - 8);
      const ty = clamp(sy + 10, tr.ruler + 6, cssH - bh - 28);
      ctx.fillStyle = "rgba(26, 31, 36, 0.94)";
      ctx.beginPath();
      ctx.roundRect(tx, ty, bw, bh, 5);
      ctx.fill();
      ctx.strokeStyle = "#3E4A56";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#C8E03B";
      ctx.font = '700 10.5px "Space Mono", monospace';
      ctx.fillText(`W ${Math.round(sel.w)}`, tx + 8, ty + 15);
      ctx.fillText(`H ${Math.round(sel.h)}`, tx + 8, ty + 28);
      ctx.fillStyle = "#D5DCE3";
      ctx.fillText(`X ${Math.round(sel.x)}`, tx + 8, ty + 41);
      ctx.fillText(`Y ${Math.round(sel.y)}`, tx + 50, ty + 41);
    }
    ctx.restore();
  }

  // 7. 0..1000 顶部与左侧标尺（打开标尺时渲染）
  if (state.rulers) {
    ctx.fillStyle = "#192026";
    ctx.fillRect(0, 0, cssW, tr.ruler);
    ctx.fillRect(0, 0, tr.ruler, cssH);
    ctx.fillStyle = "#13181C";
    ctx.fillRect(0, 0, tr.ruler, tr.ruler);
    ctx.strokeStyle = "#313B45";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, tr.ruler - 0.5); ctx.lineTo(cssW, tr.ruler - 0.5);
    ctx.moveTo(tr.ruler - 0.5, 0); ctx.lineTo(tr.ruler - 0.5, cssH);
    ctx.stroke();

    ctx.fillStyle = "#A4B0BA";
    ctx.strokeStyle = "#5B6874";
    ctx.font = '400 9.5px "Space Mono", monospace';
    const step = tr.scale < 0.35 ? 200 : 100;
    for (let v = 0; v <= 1000; v += step) {
      const px = tr.ox + v * tr.scale;
      if (px >= tr.ruler + 2 && px <= cssW - 6) {
        ctx.beginPath();
        ctx.moveTo(px, tr.ruler - 6);
        ctx.lineTo(px, tr.ruler);
        ctx.stroke();
        ctx.fillText(String(v), px + 3, 13);
      }
    }
    for (let v = 0; v <= 800; v += step) {
      const py = tr.oy + v * tr.scale;
      if (py >= tr.ruler + 10 && py <= cssH - 4) {
        ctx.beginPath();
        ctx.moveTo(tr.ruler - 6, py);
        ctx.lineTo(tr.ruler, py);
        ctx.stroke();
        ctx.save();
        ctx.translate(12, py - 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(v), 0, 0);
        ctx.restore();
      }
    }
  }
}

// 启动主画布循环（利用 lib/stage.js 自动可见性暂停 + 减少动态支持）
const heroLoop = loop(wsCanvas, (t, dt, { still }) => {
  if (!still && heroIntro < 0.72) {
    heroIntro += dt || 0.016;
    heroDirty = true;
  }
  if (heroDirty || still) {
    drawWorkspaceCanvas(t, { still });
    heroDirty = false;
  }
});

// ============ 青柠分隔条拖拽（鼠标 / 触屏 / 键盘） ============
let splitDragging = false;
let splitRaf = 0;
let pendingRatio = null;

function applySplitRatio(ratio) {
  state.rightDockRatio = normalizeRightRatio(ratio);
  syncUI({ fastDrag: true });
}

function scheduleSplit(clientX) {
  const rect = wsBody.getBoundingClientRect();
  if (rect.width <= 0) return;
  const raw = (rect.right - clientX) / rect.width;
  pendingRatio = raw;
  if (!splitRaf) {
    splitRaf = requestAnimationFrame(() => {
      splitRaf = 0;
      if (pendingRatio !== null) {
        applySplitRatio(pendingRatio);
        pendingRatio = null;
      }
    });
  }
}

splitter.addEventListener("pointerdown", (e) => {
  splitDragging = true;
  splitter.classList.add("dragging");
  try { splitter.setPointerCapture(e.pointerId); } catch {}
  scheduleSplit(e.clientX);
  e.preventDefault();
});

window.addEventListener("pointermove", (e) => {
  if (!splitDragging) return;
  scheduleSplit(e.clientX);
});

const endSplit = () => {
  if (!splitDragging) return;
  splitDragging = false;
  splitter.classList.remove("dragging");
  if (pendingRatio !== null) {
    applySplitRatio(pendingRatio);
    pendingRatio = null;
  }
  syncUI({ fastDrag: false });
};
window.addEventListener("pointerup", endSplit);
window.addEventListener("pointercancel", endSplit);

// 兼容 CDP 原始 touch 事件（确保 perf.mjs 触屏拖动 100% 触发并每帧重绘）
splitter.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  splitDragging = true;
  splitter.classList.add("dragging");
  scheduleSplit(e.touches[0].clientX);
  e.preventDefault();
}, { passive: false });

window.addEventListener("touchmove", (e) => {
  if (!splitDragging || !e.touches.length) return;
  scheduleSplit(e.touches[0].clientX);
  e.preventDefault();
}, { passive: false });

window.addEventListener("touchend", endSplit);
window.addEventListener("touchcancel", endSplit);

splitter.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const delta = e.key === "ArrowLeft" ? 0.03 : -0.03;
    const next = state.rightDockRatio === 0 && delta > 0 ? 0.16 : state.rightDockRatio + delta;
    state.rightDockRatio = normalizeRightRatio(next);
    syncUI();
  }
});

// ============ 画布内直接点选与拖动五枚几何图形 ============
function hitTestShape(localX, localY) {
  const rect = wsCanvasCol.getBoundingClientRect();
  const tr = getCanvasTransform(rect.width, rect.height);
  for (let i = state.shapes.length - 1; i >= 0; i--) {
    const s = state.shapes[i];
    if (!s.visible) continue;
    const sx = tr.ox + s.x * tr.scale;
    const sy = tr.oy + s.y * tr.scale;
    const hw = (s.w * tr.scale) / 2 + 6;
    const hh = (s.h * tr.scale) / 2 + 6;
    if (Math.abs(localX - sx) <= hw && Math.abs(localY - sy) <= hh) {
      return { shape: s, tr };
    }
  }
  return { shape: null, tr };
}

wsCanvas.addEventListener("pointerdown", (e) => {
  const rect = wsCanvas.getBoundingClientRect();
  const lx = e.clientX - rect.left;
  const ly = e.clientY - rect.top;

  if (state.activeTool === "zoom") {
    const steps = [75, 100, 125, 150];
    state.zoom = steps[(steps.indexOf(state.zoom) + 1) % steps.length];
    syncUI();
    return;
  }

  if (state.activeTool === "hand") {
    dragPan = { startX: e.clientX, startY: e.clientY, ox: state.pan.x, oy: state.pan.y };
    try { wsCanvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }

  const { shape, tr } = hitTestShape(lx, ly);
  if (shape) {
    state.selectedId = shape.id;
    syncUI({ rebuildLayers: true });
    if (!shape.locked) {
      dragShape = {
        shape,
        scale: tr.scale,
        startX: e.clientX,
        startY: e.clientY,
        origX: shape.x,
        origY: shape.y,
      };
      try { wsCanvas.setPointerCapture(e.pointerId); } catch {}
    }
  }
});

window.addEventListener("pointermove", (e) => {
  if (dragPan) {
    state.pan.x = clamp(dragPan.ox + (e.clientX - dragPan.startX), -160, 160);
    state.pan.y = clamp(dragPan.oy + (e.clientY - dragPan.startY), -120, 120);
    heroDirty = true;
    return;
  }
  if (!dragShape) return;
  const dx = (e.clientX - dragShape.startX) / dragShape.scale;
  const dy = (e.clientY - dragShape.startY) / dragShape.scale;
  let nx = clamp(dragShape.origX + dx, 80, VIRTUAL_W - 80);
  let ny = clamp(dragShape.origY + dy, 80, VIRTUAL_H - 80);

  snapGuides = { x: null, y: null };
  if (state.rulers) {
    // 磁吸中轴与整百刻度
    const snapX = [520, ...state.shapes.filter((s) => s.id !== dragShape.shape.id).map((s) => s.x)];
    const snapY = [430, ...state.shapes.filter((s) => s.id !== dragShape.shape.id).map((s) => s.y)];
    for (const tx of snapX) {
      if (Math.abs(nx - tx) < 16) { nx = tx; snapGuides.x = tx; break; }
    }
    for (const ty of snapY) {
      if (Math.abs(ny - ty) < 16) { ny = ty; snapGuides.y = ty; break; }
    }
  }
  dragShape.shape.x = Math.round(nx);
  dragShape.shape.y = Math.round(ny);
  syncUI({ fastDrag: true });
});

const endCanvasDrag = () => {
  if (dragShape || dragPan) {
    dragShape = null;
    dragPan = null;
    snapGuides = { x: null, y: null };
    syncUI();
  }
};
window.addEventListener("pointerup", endCanvasDrag);
window.addEventListener("pointercancel", endCanvasDrag);

// ============ 控件事件绑定 ============
$$(".scene-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.scene;
    if (!SCENES[next]) return;
    state.scene = next;
    state.shapes = cloneShapes(next);
    state.selectedId = state.shapes[2]?.id || state.shapes[0].id;
    state.pan = { x: 0, y: 0 };
    $$(".scene-tab").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    syncUI({ rebuildLayers: true });
  });
});

$$("button[data-top]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.topBar = btn.dataset.top;
    state.zenMode = false;
    syncUI();
  });
});

$$("button[data-left]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.leftRail = btn.dataset.left;
    state.zenMode = false;
    syncUI();
  });
});

$$("button[data-zones]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.zoneOrder = btn.dataset.zones;
    syncUI();
  });
});

$$("[data-tool]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeTool = btn.dataset.tool;
    wsCanvas.style.cursor =
      state.activeTool === "hand" ? "grab" : state.activeTool === "zoom" ? "zoom-in" : "default";
    syncUI();
  });
});

$("#btn-fix-top").addEventListener("click", () => {
  state.topBar = "compact";
  syncUI();
});

$("#btn-left-cycle").addEventListener("click", () => {
  state.leftRail = state.leftRail === "wide" ? "slim" : "collapsed";
  syncUI();
});

$("#btn-dismiss-float").addEventListener("click", () => {
  state.floatingClutter = false;
  syncUI();
});

$("#btn-sliver-fix").addEventListener("click", () => {
  state.rightDockRatio = 0.22;
  syncUI();
});

$("#btn-enable-ctx").addEventListener("click", () => {
  state.contextBind = "context";
  syncUI();
});

ui.btnToggleCtx.addEventListener("click", () => {
  state.contextBind = state.contextBind === "context" ? "static" : "context";
  syncUI();
});

ui.btnToggleFloat.addEventListener("click", () => {
  state.floatingClutter = !state.floatingClutter;
  state.zenMode = false;
  syncUI();
});

const toggleRulers = () => {
  state.rulers = !state.rulers;
  syncUI();
};
ui.btnToggleRulers.addEventListener("click", toggleRulers);
ui.btnTopRulers.addEventListener("click", toggleRulers);

ui.btnZoomStep.addEventListener("click", () => {
  const steps = [75, 100, 125, 150];
  state.zoom = steps[(steps.indexOf(state.zoom) + 1) % steps.length];
  syncUI();
});

const toggleZen = () => {
  state.zenMode = !state.zenMode;
  syncUI();
};
ui.btnZen.addEventListener("click", toggleZen);
ui.btnZenExit.addEventListener("click", toggleZen);

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const fn = PRESETS[btn.dataset.preset];
    if (!fn) return;
    const next = fn(state.scene);
    Object.assign(state, next);
    syncUI({ rebuildLayers: true });
  });
});

// 属性面板实时交互
ui.inSize.addEventListener("input", () => {
  const sel = getSelectedShape();
  if (sel.locked) return;
  const base = SCENES[state.scene].shapes.find((b) => b.id === sel.id) || sel;
  const ratio = Number(ui.inSize.value) / 100;
  sel.w = Math.round(base.w * ratio);
  sel.h = Math.round(base.h * ratio);
  syncUI({ fastDrag: true });
});

ui.inAlpha.addEventListener("input", () => {
  const sel = getSelectedShape();
  sel.alpha = Number(ui.inAlpha.value);
  syncUI({ fastDrag: true });
});

$$(".sw-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sel = getSelectedShape();
    sel.fill = btn.dataset.fill;
    syncUI({ rebuildLayers: true });
  });
});

$$(".pa-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sel = getSelectedShape();
    if (sel.locked) return;
    const mode = btn.dataset.align;
    if (mode === "left") sel.x = Math.round(sel.w / 2 + 80);
    if (mode === "cx") sel.x = Math.round(VIRTUAL_W / 2);
    if (mode === "right") sel.x = Math.round(VIRTUAL_W - sel.w / 2 - 80);
    if (mode === "cy") sel.y = Math.round(VIRTUAL_H / 2);
    syncUI();
  });
});

// 快捷键：仅当不在输入框或灯箱里时响应 Tab（专注预览）与单键工具切换
window.addEventListener("keydown", (e) => {
  if (!$("#lightbox").hidden) return;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    // 仅在光标位于主工作台内时截获 Tab，保留全页正常键盘焦点遍历
    if (shell.contains(document.activeElement)) {
      e.preventDefault();
      toggleZen();
    }
  }
});

// 窗口尺寸变化重绘
new ResizeObserver(() => {
  heroDirty = true;
  heroLoop.draw();
}).observe(wsCanvasCol);

// ============ 01 节：四区蓝图探针 ============
$$(".bp-zone").forEach((btn) => {
  btn.addEventListener("click", () => {
    const z = ZONE_BLUEPRINT[btn.dataset.zone];
    if (!z) return;
    $$(".bp-zone").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $("#bpd-dot").style.background = z.color;
    $("#bpd-name").textContent = z.name;
    $("#bpd-en").textContent = z.en;
    $("#bpd-share").textContent = z.share;
    $("#bpd-role").textContent = z.role;
    $("#bpd-why").textContent = z.why;
    $("#bpd-mistake").textContent = z.mistake;
  });
});

// ============ 02 节：响应式面板停靠对照 ============
const vpState = { vp: "laptop13", strat: "adaptive" };
function renderVpLab() {
  const res = computeViewportStrategy(vpState.vp, vpState.strat);
  const preview = $("#vp-preview");
  preview.style.maxWidth = vpState.vp === "tablet" ? "340px" : vpState.vp === "laptop13" ? "520px" : "100%";

  const pct = (px) => `${((px / res.vp.w) * 100).toFixed(1)}%`;
  const leftEl = $("#vpp-left");
  const layersEl = $("#vpp-layers");
  const propsEl = $("#vpp-props");

  leftEl.style.flex = `0 0 ${pct(res.leftW)}`;
  layersEl.style.display = res.layersW > 0 ? "grid" : "none";
  layersEl.style.flex = `0 0 ${pct(res.layersW)}`;
  propsEl.style.display = res.propsW > 0 ? "grid" : "none";
  propsEl.style.flex = `0 0 ${pct(res.propsW)}`;
  propsEl.textContent = res.layersW > 0 ? "属性" : "图层+属性";

  $("#vpp-f1").hidden = res.floatCoverPct === 0;
  $("#vpp-f2").hidden = res.floatCoverPct === 0;
  $("#vpp-pct").textContent = `${res.canvasPct}%`;
  $("#vpp-px").textContent = `${res.canvasW} × ${res.canvasH}`;
  $("#vpp-top").textContent = `${res.vp.label}（${res.vp.w}×${res.vp.h}）顶栏 ${res.topH}px`;

  const tag = $("#vpr-tag");
  tag.textContent = `${res.ok ? "舒展可用" : "画布受挤"} · 净占 ${res.canvasPct}%${res.floatCoverPct ? `（浮窗遮挡 ${res.floatCoverPct}%）` : ""}`;
  tag.dataset.ok = String(res.ok);
  $("#vpr-note").textContent = res.note;
}

$$("[data-vp]").forEach((btn) => {
  btn.addEventListener("click", () => {
    vpState.vp = btn.dataset.vp;
    $$("[data-vp]").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    renderVpLab();
  });
});

$$("[data-strat]").forEach((btn) => {
  btn.addEventListener("click", () => {
    vpState.strat = btn.dataset.strat;
    $$("[data-strat]").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    renderVpLab();
  });
});

// ============ 03 节：菲茨定律与视线往返 2D Canvas 实验台 ============
const fittsState = { mode: "context", task: "size" };
const fittsCanvas = $("#fitts-canvas");
const fittsCtx = fittsCanvas.getContext("2d");
let fittsBox = { w: 0, h: 0, dpr: 1 };

function syncFittsReadout() {
  const f = computeFitts(fittsState.mode, fittsState.task);
  $("#fr-dist").textContent = `${f.distPx} px`;
  $("#fr-width").textContent = `${f.widthPx} px`;
  $("#fr-clicks").textContent = `${f.clicks} 次`;
  $("#fr-bits").textContent = `${f.totalBits} bit`;
  $("#fr-desc").textContent = `${f.task.desc}——${f.mode.desc}`;
}

function drawFitts(t, { still = false } = {}) {
  const rect = fittsCanvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(200, Math.round(rect.height));
  const dpr = pixelRatio(window.innerWidth < 640 ? 1.5 : 2);
  if (fittsBox.w !== w || fittsBox.h !== h || fittsBox.dpr !== dpr) {
    fittsCanvas.width = Math.round(w * dpr);
    fittsCanvas.height = Math.round(h * dpr);
    fittsBox = { w, h, dpr };
  }

  const ctx = fittsCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const f = computeFitts(fittsState.mode, fittsState.task);

  ctx.fillStyle = "#161C21";
  ctx.fillRect(0, 0, w, h);

  // 简化工作区轮廓（顶栏、左轨、亮纸画布、右侧属性栏）
  const pad = 16;
  const fw = w - pad * 2;
  const fh = h - pad * 2;
  const topH = Math.round(fh * 0.13);
  const leftW = Math.round(fw * 0.08);
  const rightW = fittsState.mode === "topmenu" ? 0 : Math.round(fw * 0.24);
  const canvasX = pad + leftW;
  const canvasY = pad + topH;
  const canvasW = fw - leftW - rightW;
  const canvasH = fh - topH;

  ctx.fillStyle = "#1F272E";
  ctx.fillRect(pad, pad, fw, topH);
  // 顶栏微缩按钮
  ctx.fillStyle = "#2870E3";
  ctx.fillRect(pad + 10, pad + topH * 0.26, 20, topH * 0.48);
  ctx.fillStyle = "#3A4550";
  for (let i = 1; i <= 4; i++) ctx.fillRect(pad + 12 + i * 26, pad + topH * 0.3, 18, topH * 0.4);

  ctx.fillStyle = "#1A2229";
  ctx.fillRect(pad, canvasY, leftW, canvasH);
  ctx.fillStyle = "#485664";
  for (let i = 0; i < 6; i++) ctx.fillRect(pad + leftW * 0.32, canvasY + 14 + i * 26, leftW * 0.36, 10);

  if (rightW > 0) {
    const rx = pad + fw - rightW;
    ctx.fillStyle = "#222532";
    ctx.fillRect(rx, canvasY, rightW, canvasH);
    ctx.strokeStyle = "rgba(155, 112, 214, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 4, canvasY + 6, rightW - 8, canvasH * 0.36);
    ctx.strokeRect(rx + 4, canvasY + canvasH * 0.45, rightW - 8, canvasH * 0.5);
  }

  ctx.fillStyle = "#EDEBE7";
  ctx.fillRect(canvasX, canvasY, canvasW, canvasH);

  // 亮纸画布底衬微缩原海报三图形（建立真实画布语境）
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#3B5FC0";
  ctx.beginPath();
  ctx.arc(canvasX + canvasW * 0.28, canvasY + canvasH * 0.34, Math.min(canvasW, canvasH) * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#F3B721";
  ctx.fillRect(canvasX + canvasW * 0.64, canvasY + canvasH * 0.18, canvasW * 0.18, canvasH * 0.3);
  ctx.fillStyle = "#57AE6F";
  ctx.beginPath();
  ctx.moveTo(canvasX + canvasW * 0.48, canvasY + canvasH * 0.36);
  ctx.lineTo(canvasX + canvasW * 0.68, canvasY + canvasH * 0.78);
  ctx.lineTo(canvasX + canvasW * 0.28, canvasY + canvasH * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 画布内微缩几何起终点
  const ox = pad + f.task.origin.x * fw;
  const oy = pad + f.task.origin.y * fh;
  ctx.font = '700 11px "Noto Sans SC", sans-serif';
  const labelW = ctx.measureText(f.mode.label).width;
  const tw = Math.max(f.mode.target.w * fw, labelW + 22);
  const tx = clamp(pad + f.mode.target.x * fw, pad + tw / 2 + 6, pad + fw - tw / 2 - 6);
  const ty = clamp(pad + f.mode.target.y * fh, pad + 18, pad + fh - 18);

  // 弧线止于目标盒近侧边缘，绝不穿过按钮文字
  const endX = tx > ox ? tx - tw / 2 - 2 : tx + tw / 2 + 2;
  const endY = ty;
  const mx = (ox + endX) / 2;
  const my = Math.max(pad + 26, Math.min(oy, endY) - 34);

  // 二次贝塞尔往返弧线
  ctx.save();
  ctx.strokeStyle = f.mode.color;
  ctx.lineWidth = 2.4;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.quadraticCurveTo(mx, my, endX, endY);
  ctx.stroke();
  ctx.restore();

  // 目标按钮高亮框（后画保证文字绝对锐利无遮挡）
  ctx.fillStyle = "#101417";
  ctx.strokeStyle = f.mode.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(tx - tw / 2, ty - 14, tw, 28, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = f.mode.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(f.mode.label, tx, ty);

  // 起点对象节点
  ctx.fillStyle = "#57AE6F";
  ctx.beginPath();
  ctx.arc(ox, oy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#14191D";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 往返光标动画点（减少动态效果时停在弧线中点）
  const phase = still ? 0.55 : ((t * 0.55) % 1);
  const u = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
  const px = (1 - u) * (1 - u) * ox + 2 * (1 - u) * u * mx + u * u * endX;
  const py = (1 - u) * (1 - u) * oy + 2 * (1 - u) * u * my + u * u * endY;

  ctx.fillStyle = "#101417";
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = f.mode.color;
  ctx.beginPath();
  ctx.arc(px, py, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // 距离标注胶囊
  const badgeX = clamp(mx, pad + 50, pad + fw - 50);
  const badgeY = clamp(my - 14, pad + 14, pad + fh - 26);
  ctx.fillStyle = "#101417";
  ctx.beginPath();
  ctx.roundRect(badgeX - 44, badgeY - 11, 88, 22, 4);
  ctx.fill();
  ctx.fillStyle = "#EEECE8";
  ctx.font = '700 11px "Space Mono", monospace';
  ctx.fillText(`D ≈ ${f.distPx}px`, badgeX, badgeY);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

const fittsLoop = loop(fittsCanvas, (t, _dt, opts) => {
  drawFitts(t, opts);
});

$$("[data-fmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    fittsState.mode = btn.dataset.fmode;
    $$("[data-fmode]").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    syncFittsReadout();
    fittsLoop.draw();
  });
});

$$("[data-ftask]").forEach((btn) => {
  btn.addEventListener("click", () => {
    fittsState.task = btn.dataset.ftask;
    $$("[data-ftask]").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    syncFittsReadout();
    fittsLoop.draw();
  });
});

// ============ 04 节：历史时代切换 ============
function renderEra(id) {
  const era = HISTORY_ERAS.find((e) => e.id === id) || HISTORY_ERAS[0];
  $("#era-year").textContent = era.year;
  $("#era-who").textContent = era.who;
  $("#era-title").textContent = era.title;
  $("#era-summary").textContent = era.summary;
  $("#era-chrome").textContent = era.chrome;
  $("#era-share").textContent = `约 ${era.canvasShare}%（示意）`;

  $("#ew-top").style.flexBasis = `${era.layout.top * 100}%`;
  $("#ew-left").style.flexBasis = `${era.layout.left * 100}%`;
  $("#ew-right").style.flexBasis = `${era.layout.right * 100}%`;
  $("#ew-bot").style.flexBasis = `${era.layout.bottom * 100}%`;
  $("#ew-label").textContent = era.layout.canvasLabel;
}

$$(".era-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".era-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderEra(btn.dataset.era);
  });
});

// ============ 06 节：单变量练习 ============
$$(".quiz-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const picked = QUIZ_OPTIONS[btn.dataset.quiz];
    if (!picked) return;
    $$(".quiz-card").forEach((b) => {
      const opt = QUIZ_OPTIONS[b.dataset.quiz];
      b.setAttribute("aria-pressed", String(b === btn));
      b.dataset.result = b === btn ? (opt.correct ? "right" : "wrong") : opt.correct ? "right" : "";
    });
    const verdict = $("#quiz-verdict");
    verdict.dataset.ok = String(picked.correct);
    $("#qv-title").textContent = `${picked.headline}（画布净占 ${picked.canvasPct}%）`;
    $("#qv-text").textContent = picked.reason;
  });
});

// ============ 07 节：原海报放大与拖拽灯箱 ============
const posterImg = $("#poster");
const posterBtn = $("#poster-btn");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbClose = $("#lb-close");
let lbState = { scale: 1.35, tx: 0, ty: 0, drag: null };

function updateLbTransform() {
  lbImg.style.transform = `translate(${lbState.tx}px, ${lbState.ty}px) scale(${lbState.scale})`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbState = { scale: 1.35, tx: 0, ty: 0, drag: null };
  updateLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target === lbStage) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

lbStage.addEventListener("pointerdown", (e) => {
  lbState.drag = { x: e.clientX, y: e.clientY, tx: lbState.tx, ty: lbState.ty };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
window.addEventListener("pointermove", (e) => {
  if (!lbState.drag) return;
  lbState.tx = clamp(lbState.drag.tx + (e.clientX - lbState.drag.x), -480, 480);
  lbState.ty = clamp(lbState.drag.ty + (e.clientY - lbState.drag.y), -620, 620);
  updateLbTransform();
});
window.addEventListener("pointerup", () => { lbState.drag = null; });
window.addEventListener("pointercancel", () => { lbState.drag = null; });

// ============ 首次初始化 ============
syncUI({ rebuildLayers: true });
renderVpLab();
syncFittsReadout();
renderEra("1963");
heroLoop.draw();
fittsLoop.draw();
