// 224 行内布局 — 主交互逻辑：活体行内流道 + 2D Canvas X-Ray + 01–07 全部互动
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SCENES,
  BASELINE_SPECIMENS,
  QUIZ_OPTIONS,
  createSceneState,
  applyTrap,
  evaluateInlineFlow,
} from "./model.js";

// ==================== 工具：原海报极简无五官小图标 ====================
function iconSvg(kind) {
  if (kind === "arrow") {
    return `<svg class="rf-icon-svg" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h11m0 0-4-4m4 4-4 4" stroke="#B3300A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (kind === "person") {
    // 无五官极简轮廓圆头+肩弧
    return `<svg class="rf-icon-svg" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="5.5" r="2.8" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 15c.7-2.8 2.8-4.2 5.5-4.2s4.8 1.4 5.5 4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  }
  if (kind === "clock") {
    return `<svg class="rf-icon-svg" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="M9 5.5V9l2.6 1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  if (kind === "bookmark") {
    return `<svg class="rf-icon-svg" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4.5 3.2h9v12L9 12.2l-4.5 3v-12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  }
  if (kind === "check") {
    return `<svg class="rf-icon-svg" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6.8" stroke="#13614B" stroke-width="1.7"/><path d="M6 9.2l2 2.1 4-4.3" stroke="#13614B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (kind === "share") {
    return `<svg class="rf-icon-svg" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="13.2" cy="4.3" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4.8" cy="9" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="13.2" cy="13.7" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M6.6 8l4.8-2.7M6.6 10l4.8 2.7" stroke="currentColor" stroke-width="1.5"/></svg>`;
  }
  return "";
}

// ==================== HERO：活体行内流道实验台 ====================
const sceneStates = {
  promo: createSceneState("promo", "broken"),
  meta: createSceneState("meta", "broken"),
  status: createSceneState("status", "broken"),
};
let activeSceneId = "promo";
const getState = () => sceneStates[activeSceneId];

const railStageWrap = document.getElementById("rail-stage-wrap");
const railTrackOuter = document.getElementById("rail-track-outer");
const railContainer = document.getElementById("rail-container");
const railFlow = document.getElementById("rail-flow");
const railXray = document.getElementById("rail-xray");
const railHandle = document.getElementById("rail-resize-handle");
const railWidthBadge = document.getElementById("rail-width-badge");
const railPosterNote = document.getElementById("rail-poster-note");
const wbSceneTitle = document.getElementById("wb-scene-title");
const wbMetrics = document.getElementById("wb-metrics");
const topStatusChip = document.getElementById("top-status-chip");
const diagCard = document.getElementById("diag-card");
const diagChip = document.getElementById("diag-chip");
const diagTier = document.getElementById("diag-tier");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const selNameEl = document.getElementById("sel-name");
const selCssEl = document.getElementById("sel-css");
const rngGap = document.getElementById("rng-gap");
const valGap = document.getElementById("val-gap");
const rngWidth = document.getElementById("rng-width");
const valWidth = document.getElementById("val-width");
const btnHierarchy = document.getElementById("btn-hierarchy");
const btnXray = document.getElementById("btn-xray");
const btnScan = document.getElementById("btn-scan");

const probeEls = {
  inline: { wrap: document.getElementById("probe-inline"), val: document.getElementById("probe-inline-val") },
  baseline: { wrap: document.getElementById("probe-baseline"), val: document.getElementById("probe-baseline-val") },
  flow: { wrap: document.getElementById("probe-flow"), val: document.getElementById("probe-flow-val") },
};

let latestMeasured = { items: [], rows: [], baseFontPx: 16, stageWidth: 800 };
let latestEval = null;
let xrayDirty = true;
let introProgress = 0;
let scanBeam = { active: false, t: 0, dur: 1.55 };

// 同步右上奶白正圆标本镜五符号的实时落位
const discOffsets = [-8, 6, -7, 8, -6];
function syncDiscMirrors(chaos) {
  for (const svgId of ["hero-disc-svg", "mini-disc-svg"]) {
    const svg = document.getElementById(svgId);
    if (!svg) continue;
    svg.querySelectorAll(".disc-sym").forEach((g) => {
      const idx = Number(g.dataset.i || 0);
      const dy = +(discOffsets[idx] * chaos).toFixed(1);
      g.setAttribute("transform", `translate(0, ${dy})`);
    });
  }
}

function buildFlowDom() {
  const st = getState();
  const sc = SCENES[st.sceneId];
  railFlow.innerHTML = "";
  for (const item of sc.items) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `rf-item rf-role-${item.role}`;
    el.dataset.itemId = item.id;
    el.dataset.kind = item.kind;
    el.setAttribute("aria-label", `选中行内元素：${item.label}`);
    if (item.kind === "icon") {
      el.innerHTML = iconSvg(item.icon);
    } else if (item.kind === "icon-text") {
      el.innerHTML = `<span class="rf-icon-wrap">${iconSvg(item.icon)}<span>${item.text}</span></span>`;
    } else if (item.kind === "avatars") {
      el.innerHTML = `<span class="rf-avatars"><span>${item.text}</span><span class="av-stack" aria-hidden="true"><span class="av-dot av-dot-1"></span><span class="av-dot av-dot-2"></span><span class="av-dot av-dot-3"></span></span><span class="mono">${item.extra}</span></span>`;
    } else {
      el.textContent = item.text;
    }
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      st.selectedId = item.id;
      applyStateToDom();
    });
    railFlow.appendChild(el);
  }
}

function measureFlowDom() {
  const contRect = railContainer.getBoundingClientRect();
  const baseFontPx = parseFloat(getComputedStyle(railFlow).fontSize) || 16;
  const nodes = [...railFlow.querySelectorAll(".rf-item")];
  const raw = nodes.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      id: el.dataset.itemId,
      kind: el.dataset.kind,
      x: r.left - contRect.left,
      y: r.top - contRect.top,
      w: r.width,
      h: r.height,
      cx: r.left - contRect.left + r.width / 2,
      cy: r.top - contRect.top + r.height / 2,
      bottom: r.bottom - contRect.top,
    };
  });

  // 按真实纵坐标把元素聚类到浏览器实际生成的每一条行盒（Line Box）
  const rows = [];
  for (const it of raw) {
    let row = rows.find((rw) => {
      // 同一行内元素的纵向区间必须重叠，或中心非常接近
      const overlap = Math.min(rw.bottom, it.bottom) - Math.max(rw.top, it.y);
      return overlap > 4 || Math.abs(it.cy - (rw.top + rw.bottom) / 2) < baseFontPx * 0.85;
    });
    if (!row) {
      row = { idx: rows.length, top: it.y, bottom: it.bottom, items: [] };
      rows.push(row);
    }
    row.top = Math.min(row.top, it.y);
    row.bottom = Math.max(row.bottom, it.bottom);
    row.items.push(it);
    it.rowIdx = row.idx;
  }

  for (const rw of rows) {
    rw.height = rw.bottom - rw.top;
    // 用该行内文本元素的底偏上 22% 作为实测拉丁/视觉基线坐标
    const anchors = rw.items.filter((x) => x.kind === "title" || x.kind === "meta" || x.kind === "accent");
    if (anchors.length) {
      rw.baselineY = anchors.reduce((s, a) => s + (a.y + a.h * 0.78), 0) / anchors.length;
      rw.midY = anchors.reduce((s, a) => s + a.cy, 0) / anchors.length;
    } else {
      rw.baselineY = rw.top + rw.height * 0.74;
      rw.midY = rw.top + rw.height * 0.5;
    }
  }

  latestMeasured = {
    items: raw,
    rows,
    baseFontPx,
    stageWidth: contRect.width,
    stageHeight: contRect.height,
  };
  return latestMeasured;
}

function applyStateToDom({ widthOnly = false } = {}) {
  const st = getState();
  const sc = SCENES[st.sceneId];

  railContainer.style.width = `${st.widthPct}%`;
  railHandle.style.left = `${st.widthPct}%`;
  railWidthBadge.textContent = `↔ ${st.widthPct}%`;
  rngWidth.value = String(st.widthPct);
  valWidth.textContent = `${st.widthPct}%`;

  if (!widthOnly) {
    railFlow.style.setProperty("--flow-gap", `${st.gapPx}px`);
    railFlow.classList.toggle("is-hierarchy", st.hierarchyOn);
    railFlow.classList.toggle("is-flat", !st.hierarchyOn);

    rngGap.value = String(st.gapPx);
    valGap.textContent = `${st.gapPx}px`;
    btnHierarchy.setAttribute("aria-pressed", String(st.hierarchyOn));
    btnHierarchy.textContent = st.hierarchyOn ? "主次权重：开" : "主次权重：关";
    btnXray.setAttribute("aria-pressed", String(st.xrayOn));
    btnXray.textContent = st.xrayOn ? "基线透视：开" : "基线透视：关";

    wbSceneTitle.textContent = `${sc.name} · 真实 CSS 行内格式化上下文`;
    railPosterNote.textContent = sc.posterHint;

    // 写入每个真实 DOM 元素的行内 CSS
    for (const item of sc.items) {
      const el = railFlow.querySelector(`[data-item-id="${item.id}"]`);
      const ist = st.items[item.id];
      if (!el || !ist) continue;
      el.style.display = ist.display;
      el.style.verticalAlign = ist.valign;
      if (item.isBox) {
        if (ist.display === "inline") {
          el.style.height = "";
          el.style.paddingTop = ist.heightScale > 1.2 ? "12px" : "2px";
          el.style.paddingBottom = ist.heightScale > 1.2 ? "12px" : "2px";
        } else {
          const px = Math.round(28 * ist.heightScale);
          el.style.height = `${px}px`;
          el.style.paddingTop = "0";
          el.style.paddingBottom = "0";
        }
      } else {
        el.style.height = "";
        el.style.fontSize = ist.heightScale > 1.3 ? "1.65em" : ist.heightScale < 0.9 ? "0.86em" : "";
      }
      const isFault = ist.display === "block" || ist.valign === "top" || ist.valign === "bottom" || ist.heightScale > 1.35;
      el.classList.toggle("is-selected", st.selectedId === item.id);
      el.classList.toggle("is-fault", isFault);
    }

    // 同步选中元素控制坞
    const selMeta = sc.items.find((i) => i.id === st.selectedId) || sc.items[0];
    const selSt = st.items[selMeta.id];
    selNameEl.textContent = selMeta.label;
    selCssEl.textContent = `display: ${selSt.display}; vertical-align: ${selSt.valign}`;
    document.querySelectorAll(".seg-btn[data-prop]").forEach((btn) => {
      const prop = btn.dataset.prop;
      const val = btn.dataset.val;
      const cur = String(selSt[prop]);
      btn.classList.toggle("is-active", cur === val);
    });
  }

  // 实测 DOM 并同步单真源评估
  const measured = measureFlowDom();
  const ev = evaluateInlineFlow(st, measured);
  latestEval = ev;

  railContainer.classList.toggle("is-ok", ev.ok);
  topStatusChip.textContent = ev.badge;
  topStatusChip.classList.toggle("is-ok", ev.ok);
  diagChip.textContent = ev.badge;
  diagChip.classList.toggle("is-ok", ev.ok);
  diagCard.classList.toggle("is-ok", ev.ok);
  diagTier.textContent = ev.tier;
  diagTitle.textContent = ev.headline;
  diagBody.textContent = ev.body;
  diagAction.textContent = ev.action;
  wbMetrics.textContent = `行宽 ${st.widthPct}% · ${ev.rowCount} 条行盒 · 基线偏 ±${ev.maxDriftPx}px · 高差 ${ev.heightRatio}×`;

  for (const key of ["inline", "baseline", "flow"]) {
    const p = ev.probes[key];
    probeEls[key].wrap.classList.toggle("is-bad", !p.ok);
    probeEls[key].val.textContent = p.tag;
  }
  syncDiscMirrors(ev.discChaos);
  xrayDirty = true;
}

// 绘制 2D Canvas X-Ray：基线、行盒上下包络、偏离红尺与 Space 扫视光束
function drawXrayCanvas(t, dt, { still }) {
  const st = getState();
  const w = railContainer.clientWidth;
  const h = railContainer.clientHeight;
  if (w < 10 || h < 10) return;

  // 开场 0.9s 内基线向右舒展画入
  if (still) {
    introProgress = 1;
  } else if (introProgress < 1) {
    introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.35);
    xrayDirty = true;
  }

  if (scanBeam.active) {
    if (still) {
      scanBeam.active = false;
    } else {
      scanBeam.t += dt;
      if (scanBeam.t >= scanBeam.dur) {
        scanBeam.active = false;
        scanBeam.t = 0;
      }
      xrayDirty = true;
    }
  }

  const dpr = pixelRatio(2);
  const cw = Math.round(w * dpr);
  const ch = Math.round(h * dpr);
  if (railXray.width !== cw || railXray.height !== ch) {
    railXray.width = cw;
    railXray.height = ch;
    xrayDirty = true;
  }

  if (!xrayDirty) return;
  xrayDirty = false;

  const ctx = railXray.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const { items, rows } = latestMeasured;
  const drawW = w * introProgress;

  if (st.xrayOn) {
    for (const rw of rows) {
      // 行盒淡薄荷包络带
      ctx.fillStyle = latestEval?.ok ? "rgba(44, 160, 128, 0.07)" : "rgba(251, 82, 34, 0.055)";
      ctx.fillRect(6, rw.top - 2, Math.max(0, drawW - 12), rw.height + 4);

      // 行盒顶沿 / 底沿极细标尺
      ctx.strokeStyle = "rgba(44, 160, 128, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(8, rw.top - 1);
      ctx.lineTo(Math.max(8, drawW - 8), rw.top - 1);
      ctx.moveTo(8, rw.bottom + 1);
      ctx.lineTo(Math.max(8, drawW - 8), rw.bottom + 1);
      ctx.stroke();

      // 招牌信号朱橙基线虚线
      ctx.strokeStyle = latestEval?.ok ? "#2CA080" : "#FB5222";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(8, rw.baselineY);
      ctx.lineTo(Math.max(8, drawW - 10), rw.baselineY);
      ctx.stroke();

      // 左侧行号与基线小圆点
      ctx.setLineDash([]);
      ctx.fillStyle = latestEval?.ok ? "#1B7A5E" : "#C8360B";
      ctx.beginPath();
      ctx.arc(10, rw.baselineY, 3, 0, Math.PI * 2);
      ctx.fill();

      // 行高标签带奶白底牌：宽屏放右侧安全区，超窄屏放行盒顶沿偏右防碰箭头
      const tagTxt = w < 380 ? `L${rw.idx + 1}` : `L${rw.idx + 1} · ${Math.round(rw.height)}px`;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      const tw = ctx.measureText(tagTxt).width + 8;
      const tx = Math.max(18, w - tw - 6);
      const ty = w < 380 ? Math.max(2, rw.top - 12) : Math.max(4, rw.top - 1);
      ctx.fillStyle = "rgba(255, 255, 252, 0.94)";
      ctx.fillRect(tx, ty, tw, 13);
      ctx.fillStyle = latestEval?.ok ? "#13614B" : "#AE2E09";
      ctx.fillText(tagTxt, tx + 4, ty + 10);
    }

    // 标出每个偏离视觉中轴的病灶元素垂直跳动标尺
    for (const it of items) {
      if (it.kind === "sep") continue;
      const rw = rows[it.rowIdx];
      if (!rw) continue;
      const ist = st.items[it.id];
      const drift = it.cy - rw.midY;
      const isBad = Math.abs(drift) > 4.5 || ist?.display === "block" || ist?.valign === "top" || ist?.valign === "bottom" || ist?.heightScale > 1.35;
      if (isBad) {
        ctx.strokeStyle = "#C8360B";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(it.cx, rw.midY);
        ctx.lineTo(it.cx, it.cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#C8360B";
        ctx.beginPath();
        ctx.arc(it.cx, it.cy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Space 放飞眼动扫视轨迹光束
  if (scanBeam.active && items.length > 1) {
    const pts = items.filter((it) => it.kind !== "sep");
    if (pts.length > 1) {
      const prog = Math.min(1, scanBeam.t / scanBeam.dur);
      const totalSegs = pts.length - 1;
      const f = prog * totalSegs;
      const idx = Math.min(totalSegs - 1, Math.floor(f));
      const frac = f - idx;

      ctx.save();
      ctx.lineWidth = 2.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = latestEval?.ok ? "#1B7A5E" : "#FB5222";
      ctx.beginPath();
      ctx.moveTo(pts[0].cx, pts[0].cy);
      for (let i = 1; i <= idx; i++) {
        ctx.lineTo(pts[i].cx, pts[i].cy);
      }
      const headX = pts[idx].cx + (pts[idx + 1].cx - pts[idx].cx) * frac;
      const headY = pts[idx].cy + (pts[idx + 1].cy - pts[idx].cy) * frac;
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // 光珠头
      ctx.fillStyle = latestEval?.ok ? "#2CA080" : "#FB5222";
      ctx.beginPath();
      ctx.arc(headX, headY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(headX, headY, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

const heroLoop = loop(railStageWrap, drawXrayCanvas);

function triggerScan() {
  if (reducedMotion.matches) {
    // 减少动态下闪一下提示态
    xrayDirty = true;
    heroLoop.draw();
    return;
  }
  scanBeam.active = true;
  scanBeam.t = 0;
  xrayDirty = true;
  heroLoop.draw();
}

// ==================== 横拖推拉行宽（鼠标 + 触摸，rAF 节流保 60fps） ====================
let dragState = { active: false, startX: 0, startPct: 96, pendingPct: null, raf: 0 };

function scheduleWidthUpdate(nextPct) {
  const clamped = Math.max(44, Math.min(100, Math.round(nextPct)));
  dragState.pendingPct = clamped;
  if (dragState.raf) return;
  dragState.raf = requestAnimationFrame(() => {
    dragState.raf = 0;
    if (dragState.pendingPct === null) return;
    const st = getState();
    if (st.widthPct !== dragState.pendingPct) {
      st.widthPct = dragState.pendingPct;
      applyStateToDom({ widthOnly: true });
      heroLoop.draw();
    } else {
      // 即使数值边界相同也保持视觉响应重绘一帧
      xrayDirty = true;
      heroLoop.draw();
    }
    dragState.pendingPct = null;
  });
}

function beginDrag(clientX, fromHandle = false) {
  const trackW = Math.max(200, railTrackOuter.getBoundingClientRect().width);
  dragState.active = true;
  dragState.startX = clientX;
  dragState.startPct = getState().widthPct;
  dragState.trackW = trackW;
  dragState.fromHandle = fromHandle;
}

function moveDrag(clientX) {
  if (!dragState.active) return;
  const dx = clientX - dragState.startX;
  const deltaPct = (dx / dragState.trackW) * 100;
  scheduleWidthUpdate(dragState.startPct + deltaPct);
}

function endDrag() {
  dragState.active = false;
}

// 绑定手柄 + 流道空白区横拖（同时监听 window pointermove/mousemove 与 touch，确保真鼠/触屏/CDP 100% 流畅）
railHandle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  beginDrag(e.clientX, true);
});
railHandle.addEventListener("mousedown", (e) => {
  if (!dragState.active) beginDrag(e.clientX, true);
});

let stageTouch = { active: false, x0: 0, y0: 0, locked: null };
railStageWrap.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  stageTouch = { active: true, x0: t.clientX, y0: t.clientY, locked: null };
  beginDrag(t.clientX, false);
}, { passive: true });

railStageWrap.addEventListener("touchmove", (e) => {
  if (!stageTouch.active || e.touches.length !== 1) return;
  const t = e.touches[0];
  const dx = t.clientX - stageTouch.x0;
  const dy = t.clientY - stageTouch.y0;
  if (!stageTouch.locked && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
    stageTouch.locked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  }
  if (stageTouch.locked === "x") {
    moveDrag(t.clientX);
  }
}, { passive: true });

railStageWrap.addEventListener("touchend", () => {
  stageTouch.active = false;
  endDrag();
}, { passive: true });

railStageWrap.addEventListener("mousedown", (e) => {
  if (e.target.closest(".rf-item, button")) return;
  beginDrag(e.clientX, false);
});
window.addEventListener("pointermove", (e) => moveDrag(e.clientX));
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
window.addEventListener("mousemove", (e) => moveDrag(e.clientX));
window.addEventListener("mouseup", endDrag);

// 键盘方向键调宽度、Space 扫视验流
railHandle.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.shiftKey ? 5 : 2;
    scheduleWidthUpdate(getState().widthPct + (e.key === "ArrowRight" ? step : -step));
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.target.closest("button, input, a, textarea")) {
    e.preventDefault();
    triggerScan();
  }
});

// 绑定场景切换与所有控制坞事件
document.querySelectorAll(".scene-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeSceneId = btn.dataset.scene;
    document.querySelectorAll(".scene-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    buildFlowDom();
    applyStateToDom();
    heroLoop.draw();
  });
});

document.querySelectorAll(".seg-btn[data-prop]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const st = getState();
    const ist = st.items[st.selectedId];
    if (!ist) return;
    const prop = btn.dataset.prop;
    const rawVal = btn.dataset.val;
    ist[prop] = prop === "heightScale" ? Number(rawVal) : rawVal;
    applyStateToDom();
    heroLoop.draw();
  });
});

rngGap.addEventListener("input", () => {
  getState().gapPx = Number(rngGap.value);
  applyStateToDom();
  heroLoop.draw();
});

rngWidth.addEventListener("input", () => {
  getState().widthPct = Number(rngWidth.value);
  applyStateToDom({ widthOnly: true });
  heroLoop.draw();
});

btnHierarchy.addEventListener("click", () => {
  const st = getState();
  st.hierarchyOn = !st.hierarchyOn;
  applyStateToDom();
  heroLoop.draw();
});

btnXray.addEventListener("click", () => {
  const st = getState();
  st.xrayOn = !st.xrayOn;
  applyStateToDom();
  heroLoop.draw();
});

btnScan.addEventListener("click", triggerScan);

document.getElementById("btn-fix-std").addEventListener("click", () => {
  const prevXray = getState().xrayOn;
  sceneStates[activeSceneId] = { ...createSceneState(activeSceneId, "standard"), xrayOn: prevXray };
  applyStateToDom();
  triggerScan();
});

document.getElementById("btn-reset-bad").addEventListener("click", () => {
  const prevXray = getState().xrayOn;
  sceneStates[activeSceneId] = { ...createSceneState(activeSceneId, "broken"), xrayOn: prevXray };
  applyStateToDom();
  heroLoop.draw();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prevXray = getState().xrayOn;
    sceneStates[activeSceneId] = { ...createSceneState(activeSceneId, btn.dataset.preset), xrayOn: prevXray };
    applyStateToDom();
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-trap]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sceneStates[activeSceneId] = applyTrap(getState(), btn.dataset.trap);
    applyStateToDom();
    heroLoop.draw();
  });
});

// ==================== 01 节：原海报 10 枚基线标本交互轨 ====================
const anatomyWrap = document.getElementById("anatomy-line-wrap");
const spTitle = document.getElementById("sp-detail-title");
const spTruth = document.getElementById("sp-detail-truth");
const spMetric = document.getElementById("sp-detail-metric");
const spCss = document.getElementById("sp-detail-css");
const anatomyHint = document.getElementById("anatomy-mode-hint");

const anatomyModeHints = {
  optical: "光学视觉校准：汉字与数字踏实踩线，芯片与图标微调至视觉重心平稳",
  "css-default": "CSS 默认 baseline：注意「对齐」「Icon」「♡」「★」被拉丁基线顶高上翘",
  middle: "全员 vertical-align: middle：靠父元素 x-height 中线对齐，大字反而微偏上",
  trim: "现代 text-box-trim：裁掉字体上下多余领空，按钮与文字边界严丝齐平",
};

let activeSpecimenId = BASELINE_SPECIMENS[0].id;

function renderAnatomySpecimens() {
  BASELINE_SPECIMENS.forEach((sp) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sp-btn";
    btn.dataset.spId = sp.id;
    btn.dataset.kind = sp.kind;
    if (sp.kind === "svg-heart") {
      btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="心形图标"><path d="M12 20.2S4 14.8 4 9.2A4.5 4.5 0 0 1 12 6.4a4.5 4.5 0 0 1 8 2.8c0 5.6-8 11-8 11Z" stroke="#080B09" stroke-width="2" stroke-linejoin="round"/></svg>`;
    } else if (sp.kind === "svg-star") {
      btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" aria-label="星形图标"><polygon points="12,2.5 14.8,8.5 21.4,9.3 16.5,13.8 17.8,20.4 12,17.1 6.2,20.4 7.5,13.8 2.6,9.3 9.2,8.5" fill="#080B09"/></svg>`;
    } else if (sp.kind === "dot-orange") {
      btn.innerHTML = `<span class="sp-dot-orange" aria-label="朱橙分隔圆点"></span>`;
    } else {
      btn.innerHTML = `<span class="sp-${sp.kind}">${sp.text}</span>`;
    }
    btn.addEventListener("click", () => selectSpecimen(sp.id));
    anatomyWrap.appendChild(btn);
  });
  selectSpecimen(activeSpecimenId);
}

function selectSpecimen(id) {
  activeSpecimenId = id;
  const sp = BASELINE_SPECIMENS.find((x) => x.id === id) || BASELINE_SPECIMENS[0];
  anatomyWrap.querySelectorAll(".sp-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.spId === id));
  spTitle.textContent = `${sp.text} · 原海报标注「${sp.posterNote}」`;
  spTruth.textContent = sp.truth;
  spMetric.textContent = sp.metric;
  spCss.textContent = sp.valignCss;
}

document.querySelectorAll(".mode-btn[data-amode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.amode;
    anatomyWrap.dataset.mode = mode;
    anatomyHint.textContent = anatomyModeHints[mode] || "";
    document.querySelectorAll(".mode-btn[data-amode]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  });
});

// ==================== 02 节：隐形支柱与行盒 2D Canvas 剖面图 ====================
const strutCanvas = document.getElementById("strut-canvas");
const strutLh = document.getElementById("strut-lh");
const strutLhVal = document.getElementById("strut-lh-val");
const strutImgH = document.getElementById("strut-imgh");
const strutImgHVal = document.getElementById("strut-imgh-val");
const strutReadout = document.getElementById("strut-readout");

const strutState = {
  layers: { content: true, leading: true, strut: true, linebox: true },
  lineHeight: 1.6,
  imgH: 68,
  imgAlign: "baseline",
  reveal: 0,
  dirty: true,
};

function updateStrutReadout() {
  const fontPx = 58;
  const descender = Math.round(fontPx * 0.22);
  const halfLead = Math.round(((strutState.lineHeight - 1) * fontPx) / 2);
  const gapUnderImg = strutState.imgAlign === "baseline" ? descender + halfLead : strutState.imgAlign === "middle" ? Math.max(0, Math.round(descender * 0.5)) : 0;
  strutReadout.textContent =
    strutState.imgAlign === "baseline"
      ? `实算：基线以下留出 ${descender}px 下伸区 + ${halfLead}px 下半行距 = 底部产生约 ${gapUnderImg}px 神秘空缝（由隐形支柱撑出）。`
      : strutState.imgAlign === "bottom"
        ? `实算：图片底边紧贴行盒底沿，底部空缝降为 0px，不再为不存在的 g/p 尾巴留空间。`
        : `实算：图片中心对准 x-height 中线，和旁边文字视觉高度平衡，适合小图标与头像。`;
}

function drawStrutCanvas(t, dt, { still }) {
  const wrap = strutCanvas.parentElement;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (w < 20 || h < 20) return;

  if (still) {
    strutState.reveal = 1;
  } else if (strutState.reveal < 1) {
    strutState.reveal = Math.min(1, strutState.reveal + Math.max(dt, 0.016) * 1.4);
    strutState.dirty = true;
  }

  const dpr = pixelRatio(2);
  const cw = Math.round(w * dpr);
  const ch = Math.round(h * dpr);
  if (strutCanvas.width !== cw || strutCanvas.height !== ch) {
    strutCanvas.width = cw;
    strutCanvas.height = ch;
    strutState.dirty = true;
  }
  if (!strutState.dirty) return;
  strutState.dirty = false;

  const ctx = strutCanvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // 缩放坐标系保证各种屏宽清晰不挤
  const scale = Math.min(w / 620, h / 348);
  const ox = (w - 620 * scale) / 2;
  const oy = (h - 348 * scale) / 2;
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  const fontPx = 68;
  const ascent = fontPx * 0.78;
  const descent = fontPx * 0.22;
  const halfLead = ((strutState.lineHeight - 1) * fontPx) / 2;
  const baseY = 212;
  const contentTop = baseY - ascent;
  const contentBot = baseY + descent;
  const strutTop = contentTop - halfLead;
  const strutBot = contentBot + halfLead;

  // 右侧图片位置计算（为右侧 BASELINE 与「← 底部白缝」留足清晰标尺位）
  const imgW = 84;
  const imgH = strutState.imgH * 1.2;
  const imgX = 414;
  let imgY = baseY - imgH;
  if (strutState.imgAlign === "bottom") {
    imgY = strutBot - imgH;
  } else if (strutState.imgAlign === "middle") {
    const xMidY = baseY - fontPx * 0.28;
    imgY = xMidY - imgH / 2;
  }

  const lbTop = Math.min(strutTop, imgY);
  const lbBot = Math.max(strutBot, imgY + imgH);
  const drawW = 556 * strutState.reveal;

  // 1. 半行距层
  if (strutState.layers.leading && halfLead > 1) {
    ctx.fillStyle = "rgba(156, 216, 194, 0.36)";
    ctx.fillRect(36, strutTop, drawW, halfLead);
    ctx.fillRect(36, contentBot, drawW, halfLead);
    ctx.fillStyle = "#13614B";
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(`+半行距 ${Math.round(halfLead)}px`, 104, strutTop + Math.min(13, halfLead / 2 + 4));
  }

  // 2. 内容区 em-box 层
  if (strutState.layers.content) {
    ctx.fillStyle = "rgba(44, 160, 128, 0.14)";
    ctx.fillRect(102, contentTop, 296 * strutState.reveal, fontPx);
    ctx.strokeStyle = "rgba(44, 160, 128, 0.7)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(102, contentTop, 296 * strutState.reveal, fontPx);
  }

  // 3. 最终行盒外框
  if (strutState.layers.linebox) {
    ctx.strokeStyle = "#080B09";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(32, lbTop, 562, lbBot - lbTop);
    ctx.setLineDash([]);
    ctx.fillStyle = "#080B09";
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText(`LINE BOX = ${Math.round(lbBot - lbTop)}px`, 34, Math.max(20, lbTop - 8));
  }

  // 4. 隐形支柱 Strut（行首零宽竖梁）
  if (strutState.layers.strut) {
    ctx.strokeStyle = "#FB5222";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(74, strutTop);
    ctx.lineTo(74, strutBot);
    ctx.stroke();
    // 顶部、基线、底部三铆钉
    for (const py of [strutTop, baseY, strutBot]) {
      ctx.fillStyle = "#FB5222";
      ctx.beginPath();
      ctx.arc(74, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#AE2E09";
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText("STRUT", 54, strutBot + 18);
  }

  // 朱橙基线虚线
  ctx.strokeStyle = "#FB5222";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(28, baseY);
  ctx.lineTo(596, baseY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#AE2E09";
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText("BASELINE", 516, baseY - 7);

  // 绘制衬线样本 Agyp（展示清晰的下伸部）与汉字「行内」
  ctx.fillStyle = "#080B09";
  ctx.font = `400 ${fontPx}px "DM Serif Display", Georgia, serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Agyp", 112, baseY);

  ctx.font = `700 ${Math.round(fontPx * 0.84)}px "Noto Sans SC", sans-serif`;
  ctx.fillText("行内", 276, baseY);

  // 绘制右侧行内图片替换盒
  ctx.fillStyle = "#2CA080";
  ctx.fillRect(imgX, imgY, imgW, imgH);
  ctx.strokeStyle = "#080B09";
  ctx.lineWidth = 1.6;
  ctx.strokeRect(imgX, imgY, imgW, imgH);
  // 简易几何山峰日轮（无人物）
  ctx.fillStyle = "#FCFBF4";
  ctx.beginPath();
  ctx.arc(imgX + imgW * 0.72, imgY + imgH * 0.28, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#13614B";
  ctx.beginPath();
  ctx.moveTo(imgX + 6, imgY + imgH - 6);
  ctx.lineTo(imgX + imgW * 0.42, imgY + imgH * 0.46);
  ctx.lineTo(imgX + imgW - 6, imgY + imgH - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText("<img>", imgX + 8, imgY + 18);

  // 当 baseline 模式留出底缝时，把那条白缝涂橙色标出并在右侧清晰引注
  if (strutState.imgAlign === "baseline" && lbBot - (imgY + imgH) > 2) {
    const gapH = lbBot - (imgY + imgH);
    ctx.fillStyle = "rgba(251, 82, 34, 0.24)";
    ctx.fillRect(imgX, imgY + imgH, imgW, gapH);
    ctx.strokeStyle = "#C8360B";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(imgX, imgY + imgH, imgW, gapH);
    ctx.fillStyle = "#AE2E09";
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    ctx.fillText("← 底部白缝", imgX + imgW + 10, imgY + imgH + Math.min(gapH / 2 + 4, gapH - 2));
  }

  ctx.restore();
}

const strutLoop = loop(strutCanvas, drawStrutCanvas);

document.querySelectorAll(".layer-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    strutState.layers[k] = !strutState.layers[k];
    btn.setAttribute("aria-pressed", String(strutState.layers[k]));
    strutState.dirty = true;
    strutLoop.draw();
  });
});

strutLh.addEventListener("input", () => {
  strutState.lineHeight = Number(strutLh.value);
  strutLhVal.textContent = strutState.lineHeight.toFixed(1);
  strutState.dirty = true;
  updateStrutReadout();
  strutLoop.draw();
});

strutImgH.addEventListener("input", () => {
  strutState.imgH = Number(strutImgH.value);
  strutImgHVal.textContent = `${strutState.imgH}px`;
  strutState.dirty = true;
  updateStrutReadout();
  strutLoop.draw();
});

document.querySelectorAll("#strut-img-align .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    strutState.imgAlign = btn.dataset.imgAlign;
    document.querySelectorAll("#strut-img-align .seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    strutState.dirty = true;
    updateStrutReadout();
    strutLoop.draw();
  });
});

// ==================== 03 节：四个行内盒暗礁（真 DOM 实况槽） ====================
const trapLiveBox = document.getElementById("trap-live-box");
const trapMeasureBadge = document.getElementById("trap-measure-badge");
const trapExpTitle = document.getElementById("trap-exp-title");
const trapExpBody = document.getElementById("trap-exp-body");
const trapCode = document.getElementById("trap-code");

let activeTrapTab = "size";
let activeTrapMode = "bad";

const TRAP_DATA = {
  size: {
    badTitle: "inline 直接忽略 width: 180px 与 height: 52px",
    midTitle: "inline-block 保留同行流，同时听从宽高尺寸",
    flexTitle: "inline-flex 既保行内流，又能内部垂直居中",
    badBody: "对纯 inline 元素写 width 和 height，浏览器按 CSS 规范直接无视——盒子的尺寸只取决于内部文字多宽、行高多高。看下方实测像素就知道 180×52 根本没生效。",
    midBody: "换成 display: inline-block 后，元素对外仍是行内成员、继续跟文字排在同一行，对内建立独立块格式化区域，width: 180px 和 height: 52px 立刻生效。",
    flexBody: "现代 UI 胶囊芯片更常用 display: inline-flex 配合 align-items: center，既听从外盒高宽，又自动把内部图标和文字居中。",
    code: {
      bad: `.tag {\n  display: inline;\n  width: 180px;   /* 被浏览器忽略 */\n  height: 52px;   /* 被浏览器忽略 */\n}`,
      mid: `.tag {\n  display: inline-block;\n  width: 180px;   /* 生效 */\n  height: 52px;   /* 生效 */\n  vertical-align: middle;\n}`,
      flex: `.tag {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 180px; height: 42px;\n}`,
    },
  },
  margin: {
    badTitle: "inline 只认左右 margin，上下 margin: 28px 完全无效",
    midTitle: "inline-block 让上下外边距真正推开整条行盒",
    flexTitle: "inline-flex 同样属于原子行内盒，上下 margin 生效",
    badBody: "把标签设成 margin: 28px 14px，左右 14px 立刻把邻居推开，但上下 28px 对前后两行文字纹丝不动——这是行内流保护正文行距不被某个链接撑散的机制。",
    midBody: "切为 inline-block 后，整个元素变成不可拆分的原子行内盒，margin-top 和 margin-bottom 会把整条行盒撑高，把上下相邻文字推开。",
    flexBody: "inline-flex 与 inline-block 同样按原子行内盒计算外边距，常用于需要额外呼吸空间的独立行内徽章。",
    code: {
      bad: `.tag {\n  display: inline;\n  margin: 28px 14px; /* 上下 28px 无效 */\n}`,
      mid: `.tag {\n  display: inline-block;\n  margin: 18px 14px; /* 四向均生效 */\n}`,
      flex: `.tag {\n  display: inline-flex;\n  align-items: center;\n  margin: 18px 14px; /* 推开上下行 */\n}`,
    },
  },
  padding: {
    badTitle: "inline 上下 padding 会画出背景，却不推开上下行文字！",
    midTitle: "inline-block 把上下 padding 算进外盒，不再压字",
    flexTitle: "inline-flex 撑开安全边界，边框与邻行互不打架",
    badBody: "最隐蔽的坑：给 inline 标签加 padding: 16px 10px，橙色底框确实变高了，但它不参与行盒高度计算，于是直接盖住上一行和下一行的文字！",
    midBody: "改成 inline-block 后，16px 的上下内边距被完整计入行盒边界，上下两行文字自动让位，不再被彩色底块糊住。",
    flexBody: "如果芯片带图标与文字，inline-flex 加 padding: 8px 14px 既能安全撑开行盒，又能保持内部整齐对齐。",
    code: {
      bad: `.tag {\n  display: inline;\n  padding: 18px 12px; /* 视觉扩张但压住邻行 */\n}`,
      mid: `.tag {\n  display: inline-block;\n  padding: 12px 14px; /* 真正推开上下行 */\n}`,
      flex: `.tag {\n  display: inline-flex;\n  align-items: center;\n  padding: 8px 14px;\n}`,
    },
  },
  space: {
    badTitle: "源码里的换行和缩进，会被折叠成约 4–6px 幽灵空格",
    midTitle: "紧贴标签无换行虽然消掉空格，但代码难读",
    flexTitle: "父容器用 display: flex + gap 彻底根治幽灵缝",
    badBody: "HTML 里把三个 inline-block 按钮分行写，浏览器把标签之间的换行符按行内空白规则折叠成一个空格，于是即使 margin: 0 按钮之间仍卡着一条讨厌的缝。",
    midBody: "在源码里删掉标签间的回车与空格确实能让按钮严丝无缝贴紧，但模板可读性变差，不适合多人维护。",
    flexBody: "当一行全是独立芯片或按钮时，给父容器设 display: flex; gap: 10px（参见 226 弹性盒布局），空白文本节点不再占位，间距精确到 1px。",
    code: {
      bad: `<!-- 源码换行产生幽灵空格 -->\n<span class="chip">标签 A</span>\n<span class="chip">标签 B</span>\n<span class="chip">标签 C</span>`,
      mid: `<!-- 删除源码空白：有效但难维护 -->\n<span class="chip">标签 A</span><span class="chip">标签 B</span><span class="chip">标签 C</span>`,
      flex: `.bar {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px; /* 精确控制，零幽灵缝 */\n}`,
    },
  },
};

function renderTrapLab() {
  const td = TRAP_DATA[activeTrapTab];
  trapExpTitle.textContent = activeTrapMode === "bad" ? td.badTitle : activeTrapMode === "mid" ? td.midTitle : td.flexTitle;
  trapExpBody.textContent = activeTrapMode === "bad" ? td.badBody : activeTrapMode === "mid" ? td.midBody : td.flexBody;
  trapCode.textContent = td.code[activeTrapMode];

  const disp = activeTrapMode === "bad" ? "inline" : activeTrapMode === "mid" ? "inline-block" : "inline-flex";

  if (activeTrapTab === "size") {
    trapLiveBox.innerHTML = `前段正文先铺开，中间插一枚 <span class="trap-target" id="trap-probe" style="display:${disp};width:180px;height:${activeTrapMode === "flex" ? 42 : 52}px;${activeTrapMode === "flex" ? "align-items:center;justify-content:center;" : ""}vertical-align:middle;padding:2px 8px;">目标芯片</span> 后面接着继续流式阅读。`;
  } else if (activeTrapTab === "margin") {
    trapLiveBox.innerHTML = `<div>第一行普通正文：注意观察我与下方橙色目标的距离有没有拉开。</div><div>第二行中间夹着 <span class="trap-target" id="trap-probe" style="display:${disp};margin:${activeTrapMode === "bad" ? "28px 14px" : "16px 14px"};padding:2px 8px;${activeTrapMode === "flex" ? "align-items:center;" : ""}">margin 目标</span> 左右永远生效。</div><div>第三行普通正文：对比 inline 与 inline-block 是否推开我。</div>`;
  } else if (activeTrapTab === "padding") {
    trapLiveBox.innerHTML = `<div>第一行正文文字：看看下方橙色内边距有没有直接盖到这行字上面。</div><div>第二行混入 <span class="trap-target" id="trap-probe" style="display:${disp};padding:${activeTrapMode === "bad" ? "18px 12px" : activeTrapMode === "mid" ? "12px 14px" : "8px 14px"};${activeTrapMode === "flex" ? "align-items:center;" : ""}">padding 芯片</span> 后面的文字继续走。</div><div>第三行正文文字：注意下方是否被橙底遮住。</div>`;
  } else {
    if (activeTrapMode === "bad") {
      trapLiveBox.innerHTML = `<div style="font-size:16px;"><span class="trap-chip-ghost" id="trap-g1" style="display:inline-block">按钮 A</span> \n <span class="trap-chip-ghost" id="trap-g2" style="display:inline-block">按钮 B</span> \n <span class="trap-chip-ghost" style="display:inline-block">按钮 C</span></div><p style="margin:12px 0 0;font-size:13px;color:#3A4E42;">以上三枚按钮都设了 margin: 0，中间白缝全是 HTML 换行空格。</p>`;
    } else if (activeTrapMode === "mid") {
      trapLiveBox.innerHTML = `<div style="font-size:16px;"><span class="trap-chip-ghost" id="trap-g1" style="display:inline-block">按钮 A</span><span class="trap-chip-ghost" id="trap-g2" style="display:inline-block">按钮 B</span><span class="trap-chip-ghost" style="display:inline-block">按钮 C</span></div><p style="margin:12px 0 0;font-size:13px;color:#3A4E42;">删去源码回车后三枚紧贴为 0px，但模板换行被破坏。</p>`;
    } else {
      trapLiveBox.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;"><span class="trap-chip-ghost" id="trap-g1">按钮 A</span><span class="trap-chip-ghost" id="trap-g2">按钮 B</span><span class="trap-chip-ghost">按钮 C</span></div><p style="margin:12px 0 0;font-size:13px;color:#3A4E42;">父容器用 flex + gap: 10px，幽灵空格彻底消失，间距精确可控。</p>`;
    }
  }

  requestAnimationFrame(() => {
    if (activeTrapTab === "space") {
      const g1 = document.getElementById("trap-g1");
      const g2 = document.getElementById("trap-g2");
      if (g1 && g2) {
        const gap = Math.round(g2.getBoundingClientRect().left - g1.getBoundingClientRect().right);
        trapMeasureBadge.textContent = `DOM 实测 A→B 间距：${gap}px（${activeTrapMode === "bad" ? "未写 margin 却多出幽灵空格" : activeTrapMode === "mid" ? "贴紧 0px" : "精确 gap 10px"}）`;
      }
    } else {
      const p = document.getElementById("trap-probe");
      if (p) {
        const r = p.getBoundingClientRect();
        trapMeasureBadge.textContent = `DOM 实测盒尺寸：${Math.round(r.width)}px × ${Math.round(r.height)}px（当前 display: ${disp}）`;
      }
    }
  });
}

document.querySelectorAll(".trap-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTrapTab = btn.dataset.trapTab;
    activeTrapMode = "bad";
    document.querySelectorAll(".trap-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll(".trap-mode-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tmode === "bad"));
    renderTrapLab();
  });
});

document.querySelectorAll(".trap-mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTrapMode = btn.dataset.tmode;
    document.querySelectorAll(".trap-mode-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderTrapLab();
  });
});

// ==================== 04 节：历史源流时间轴 + 原海报对照 ====================
const TIMELINE_DATA = [
  {
    title: "1984 · Donald E. Knuth《The TeXbook》确立水平盒与隐形支柱",
    body: "计算机科学家 Donald E. Knuth 在 1984 年出版的《The TeXbook》（Addison-Wesley）中，把文字排版抽象为水平盒（\\hbox）与垂直盒的嵌套，并引入了「隐形支柱（strut）」——一根零宽但拥有标准字高与下伸深度的虚拟标尺，用来保证同一排或多行基线间距稳定。后来 W3C 编写 CSS 行盒算法时，直接沿用了这一思想。",
    src: "来源核实：Donald E. Knuth, The TeXbook (Addison-Wesley, 1984)",
  },
  {
    title: "1996 · W3C CSS1 正式推荐标准划分块级与行内元素",
    body: "1996 年 12 月 17 日，由 Håkon Wium Lie 与 Bert Bos 主编的 W3C CSS1 正式发布。第 4 节格式化模型首次在网页标准中把元素明确分为块级（block-level）、行内（inline）、列表项与浮动四类，让 <em>、<a>、<strong> 等标记能够沿着文本行连续流动而不打断段落。",
    src: "来源核实：W3C CSS1 Recommendation (1996-12-17), w3.org/TR/REC-CSS1/",
  },
  {
    title: "2000 · Eric A. Meyer《Inline Formatting Model》拆解四层盒算式",
    body: "CSS2 引入了行高与垂直对齐后，连早期浏览器工程师都常算错行盒高度。2000 年，网页排版先驱 Eric A. Meyer 发表《Inline Formatting Model》，清晰区分了内容区（content-area）、半行距（half-leading）、行内盒（inline box）与行盒（line box）四层概念，解释了非替换行内元素为何忽略上下外边距。",
    src: "来源核实：Eric A. Meyer, Inline Formatting Model (2000), meyerweb.com/eric/css/inline-format.html",
  },
  {
    title: "2011 · W3C CSS 2.1 正式定型 IFC（§9.4.2）与行高支柱（§10.8）",
    body: "2011 年 6 月 7 日成为 W3C 正式推荐标准的 CSS 2.1，把行内格式化上下文（Inline Formatting Context）写成了今天全部主流浏览器共同遵守的黄金规则：行盒宽度受包含块与浮动影响、高度由行内最高顶沿与最低底沿决定、每行默认自带隐形支柱。",
    src: "来源核实：W3C CSS 2.1 Recommendation (2011-06-07), w3.org/TR/CSS21/visuren.html#inline-formatting",
  },
  {
    title: "CSS Inline Layout Level 3 · 多文字基线与 text-box-trim 裁边",
    body: "针对中西文混排和按钮里字框上下多余领空的老问题，W3C CSS 工作组（含 Elika J. Etemad / fantasai 等编辑）在《CSS Inline Layout Module Level 3》中完善了 dominant-baseline（容器主基线）、alignment-baseline（子元素挂接基线）以及 text-box-trim / text-box-edge，让开发者可以直接按大写字母顶沿与拉丁基线精确裁切行内边界。",
    src: "来源核实：W3C CSS Inline Layout Module Level 3, w3.org/TR/css-inline-3/",
  },
];

const tlTitle = document.getElementById("tl-detail-title");
const tlBody = document.getElementById("tl-detail-body");
const tlSrc = document.getElementById("tl-detail-src");

function selectTimeline(idx) {
  const item = TIMELINE_DATA[idx] || TIMELINE_DATA[0];
  tlTitle.textContent = item.title;
  tlBody.textContent = item.body;
  tlSrc.textContent = item.src;
  document.querySelectorAll(".tl-node").forEach((n) => {
    const on = Number(n.dataset.tl) === idx;
    n.classList.toggle("is-active", on);
    n.setAttribute("aria-selected", String(on));
  });
}

document.querySelectorAll(".tl-node").forEach((btn) => {
  btn.addEventListener("click", () => selectTimeline(Number(btn.dataset.tl)));
});

const btnCmpHl = document.getElementById("btn-cmp-highlight");
btnCmpHl.addEventListener("click", () => {
  const next = btnCmpHl.getAttribute("aria-pressed") !== "true";
  btnCmpHl.setAttribute("aria-pressed", String(next));
  btnCmpHl.textContent = next ? "已高亮扫视折返（再点复原）" : "高亮扫视路径差异";
  document.querySelectorAll("#compare-split .cmp-sample-inline").forEach((el) => {
    el.style.background = next ? "rgba(44, 160, 128, 0.14)" : "";
  });
  document.querySelectorAll("#compare-split .cmp-sample-stack div").forEach((el) => {
    el.style.background = next ? "rgba(251, 82, 34, 0.12)" : "";
  });
});

// ==================== 05 节：什么时候别用（4 张反转诊断卡） ====================
const ANTI_HTML = {
  table: {
    bad: `<div class="anti-demo-table-bad"><div>商品：手冲滤杯 · 库存 18 · ¥128</div><div>商品：双层玻璃杯套装 · 库存 4 · ¥260</div><div>商品：磨豆机 · 库存 312 · ¥890</div></div>`,
    good: `<div class="anti-demo-table-good"><strong>商品名称</strong><strong>库存</strong><strong>单价</strong><span>手冲滤杯</span><span>18</span><span>¥128</span><span>双层玻璃杯套装</span><span>4</span><span>¥260</span><span>磨豆机</span><span>312</span><span>¥890</span></div>`,
  },
  nav: {
    bad: `<div class="anti-demo-nav-bad"><strong>LOGO</strong> <span style="margin-left:8px">文档</span> <span style="margin-left:8px">定价</span> <span style="margin-left:8px">登录</span> <span style="margin-left:8px">注册</span></div>`,
    good: `<div class="anti-demo-nav-good"><strong>LOGO</strong><span style="display:inline-flex;gap:14px;"><span>文档</span><span>定价</span></span><span style="display:inline-flex;gap:8px;"><span class="anti-pill">登录</span><span class="anti-pill" style="background:var(--orange-btn);color:#fff;">注册</span></span></div>`,
  },
  block: {
    bad: `<div><span style="background:var(--orange-soft);padding:2px 4px;">摘要段 1：如果把整张内容卡强行排进纯行内流，外框无法稳定撑住高度和上下间距。</span> <span style="background:var(--green-pill);padding:2px 4px;">摘要段 2：两段紧粘在一起，无法独立成块。</span></div>`,
    good: `<div style="display:flex;flex-direction:column;gap:8px;"><div style="background:var(--mint-soft);border-left:3px solid var(--green-btn);padding:6px 10px;border-radius:6px;">独立块 1：有稳定宽度、内边距与清晰边界。</div><div style="background:var(--mint-soft);border-left:3px solid var(--orange-btn);padding:6px 10px;border-radius:6px;">独立块 2：纵向自然让位，互不串行。</div></div>`,
  },
  overload: {
    bad: `<div><span class="anti-pill">已认证</span><span class="anti-pill">北京</span><span class="anti-pill">12 年经验</span><span class="anti-pill">可远程</span><span class="anti-pill">全职</span><span class="anti-pill">周三入职</span><span class="anti-pill">开源维护者</span><span class="anti-pill">双语</span><span class="anti-pill">可出差</span></div>`,
    good: `<div style="display:flex;flex-direction:column;gap:6px;"><div><strong>北京 · 12 年经验 · 全职</strong></div><div><span class="anti-pill">已认证</span><span class="anti-pill">可远程</span><span class="anti-pill" style="background:var(--mint-mist);color:var(--ink-body);">+5 项折叠详情</span></div></div>`,
  },
};

document.querySelectorAll(".anti-card").forEach((card) => {
  const key = card.dataset.anti;
  const btn = card.querySelector(".anti-toggle");
  const box = card.querySelector(".anti-demo");
  btn.addEventListener("click", () => {
    const fixed = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(fixed));
    btn.textContent = fixed ? "恢复行内反例" : "切换正确解法";
    box.innerHTML = fixed ? ANTI_HTML[key].good : ANTI_HTML[key].bad;
  });
});

// ==================== 06 节：单变量实战练习 ====================
const quizGrid = document.getElementById("quiz-grid");
const quizFeedback = document.getElementById("quiz-feedback");
const quizFbTitle = document.getElementById("quiz-fb-title");
const quizFbLead = document.getElementById("quiz-fb-lead");
const quizFbList = document.getElementById("quiz-fb-list");

function renderQuiz() {
  quizGrid.innerHTML = "";
  for (const opt of QUIZ_OPTIONS) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "quiz-card";
    card.role = "radio";
    card.setAttribute("aria-checked", "false");
    card.dataset.optId = opt.id;
    card.innerHTML = `
      <div class="quiz-card-head">
        <span class="quiz-opt-title">${opt.title}</span>
        <span class="quiz-opt-spec" lang="en">${opt.spec}</span>
      </div>
      <div class="quiz-preview qp-${opt.id}">
        <span class="qp-author">${iconSvg("person")}<strong>设计师</strong></span>
        <span class="mono">2024.05.18</span>
        <span>阅读 3 分钟</span>
        <span class="qp-chip">教程</span>
        <span class="qp-btn">收藏</span>
      </div>
    `;
    card.addEventListener("click", () => pickQuizOption(opt.id));
    quizGrid.appendChild(card);
  }
}

function pickQuizOption(id) {
  const picked = QUIZ_OPTIONS.find((o) => o.id === id);
  if (!picked) return;
  quizGrid.classList.add("is-answered");
  quizGrid.querySelectorAll(".quiz-card").forEach((c) => {
    const cid = c.dataset.optId;
    const isThis = cid === id;
    const opt = QUIZ_OPTIONS.find((o) => o.id === cid);
    c.setAttribute("aria-checked", String(isThis));
    c.classList.toggle("is-picked-ok", Boolean(opt?.correct));
    c.classList.toggle("is-picked-bad", isThis && !opt?.correct);
  });

  quizFeedback.classList.add("is-show");
  quizFeedback.classList.toggle("is-wrong", !picked.correct);
  quizFbTitle.textContent = picked.correct
    ? `答对了：${picked.title} 正是基线与高差最稳当的解法`
    : `你选了 ${picked.title}，它踩中了行内常见坑——正确答案是方案 B`;
  quizFbLead.textContent = picked.reason;
  quizFbList.innerHTML = QUIZ_OPTIONS.map(
    (o) => `<li><strong>${o.title}（${o.correct ? "正解" : "偏差"}）：</strong>${o.reason}</li>`
  ).join("");
}

// ==================== 07 节：原海报放大灯箱（缩放 + 拖拽 + Esc） ====================
const posterImg = document.getElementById("poster");
const posterOpenBtn = document.getElementById("poster-open-btn");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbZoomReset = document.getElementById("lb-zoom-reset");
const lbClose = document.getElementById("lb-close");

let lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.x}px, ${lbState.y}px) scale(${lbState.scale})`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };
  applyLbTransform();
  lightbox.hidden = false;
  lightbox.classList.add("is-open");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.hidden = true;
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => { lbState.scale = Math.min(3.5, +(lbState.scale + 0.35).toFixed(2)); applyLbTransform(); });
lbZoomOut.addEventListener("click", () => { lbState.scale = Math.max(0.7, +(lbState.scale - 0.35).toFixed(2)); applyLbTransform(); });
lbZoomReset.addEventListener("click", () => { lbState.scale = 1; lbState.x = 0; lbState.y = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbState.scale = Math.max(0.7, Math.min(3.5, +(lbState.scale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbState.dragging = true;
  lbState.sx = e.clientX;
  lbState.sy = e.clientY;
  lbState.ox = lbState.x;
  lbState.oy = lbState.y;
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture?.(e.pointerId);
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbState.dragging) return;
  lbState.x = lbState.ox + (e.clientX - lbState.sx);
  lbState.y = lbState.oy + (e.clientY - lbState.sy);
  applyLbTransform();
});

lbStage.addEventListener("pointerup", () => {
  lbState.dragging = false;
  lbStage.classList.remove("is-dragging");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
    closeLightbox();
  }
});

// ==================== 初始化与 Resize 监听 ====================
buildFlowDom();
renderAnatomySpecimens();
renderTrapLab();
selectTimeline(0);
renderQuiz();
updateStrutReadout();

const syncAll = () => {
  applyStateToDom();
  heroLoop.draw();
  strutState.dirty = true;
  strutLoop.draw();
};

if (document.fonts?.ready) {
  document.fonts.ready.then(syncAll);
}
syncAll();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncAll, 60);
});
