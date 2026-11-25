import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  LOGICAL_W,
  LOGICAL_H,
  BLOCK_SPECS,
  createBrokenState,
  createPosterSolution,
  evaluateState,
  evalInsetBox,
  evalStacking,
} from "./model.js";

// ==================== HERO：活体 800×600 坐标排布台 ====================
const state = createBrokenState();
let heroIntroT = reducedMotion.matches ? 1 : 0;
let dragActive = false;
let needsRedraw = true;

const elViewport = document.getElementById("stage-viewport");
const elParent = document.getElementById("stage-parent");
const elCanvas = document.getElementById("stage-canvas");
const ctx = elCanvas.getContext("2d");

const elBlocks = {
  top: document.getElementById("blk-top"),
  left: document.getElementById("blk-left"),
  right: document.getElementById("blk-right"),
  cover: document.getElementById("blk-cover"),
  center: document.getElementById("blk-center"),
  bottom: document.getElementById("blk-bottom"),
};

const elScorePill = document.getElementById("hero-score-pill");
const elTitleFloat = document.getElementById("title-float-char");
const elTitleCoord = document.getElementById("title-coord-tag");
const elParentPosLabel = document.getElementById("parent-pos-label");
const elParentSizeLabel = document.getElementById("parent-size-label");
const elBlkCenterCode = document.getElementById("blk-center-code");
const elBlkRightCode = document.getElementById("blk-right-code");
const elBlkCoverCode = document.getElementById("blk-cover-code");
const elHeroDiag = document.getElementById("hero-diag");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagMetric = document.getElementById("diag-metric");
const elDiagTitle = document.getElementById("diag-title");
const elDiagWhy = document.getElementById("diag-why");
const elDiagAction = document.getElementById("diag-action");
const elHeroCode = document.getElementById("hero-code");
const elMiniSvg = document.getElementById("mini-preview-svg");
const elBtnNarrow = document.getElementById("btn-toggle-narrow");

const cornerEls = {
  tlDot: elParent.querySelector(".c-tl"),
  trDot: elParent.querySelector(".c-tr"),
  blDot: elParent.querySelector(".c-bl"),
  brDot: elParent.querySelector(".c-br"),
  tlTxt: document.getElementById("cc-tl"),
  trTxt: document.getElementById("cc-tr"),
  blTxt: document.getElementById("cc-bl"),
  brTxt: document.getElementById("cc-br"),
};

// 将 CSS 源码高亮为安全 DOM 片段
function renderHighlightedCSS(el, raw) {
  el.textContent = "";
  const lines = raw.split("\n");
  lines.forEach((line, idx) => {
    const frag = document.createDocumentFragment();
    const cmtIdx = line.indexOf("/*");
    const codePart = cmtIdx >= 0 ? line.slice(0, cmtIdx) : line;
    const cmtPart = cmtIdx >= 0 ? line.slice(cmtIdx) : "";

    if (codePart.trim().startsWith(".") || codePart.trim() === "}") {
      const sp = document.createElement("span");
      sp.className = "tok-sel";
      sp.textContent = codePart;
      frag.appendChild(sp);
    } else if (codePart.includes(":")) {
      const colon = codePart.indexOf(":");
      const spP = document.createElement("span");
      spP.className = "tok-prop";
      spP.textContent = codePart.slice(0, colon + 1);
      const spV = document.createElement("span");
      spV.className = "tok-val";
      spV.textContent = codePart.slice(colon + 1);
      frag.appendChild(spP);
      frag.appendChild(spV);
    } else {
      frag.appendChild(document.createTextNode(codePart));
    }
    if (cmtPart) {
      const spC = document.createElement("span");
      spC.className = cmtPart.includes("[!]") ? "tok-warn" : "tok-cmt";
      spC.textContent = cmtPart;
      frag.appendChild(spC);
    }
    if (idx < lines.length - 1) frag.appendChild(document.createTextNode("\n"));
    el.appendChild(frag);
  });
}

// 绘制右侧原海报同款「效果示意」迷你 SVG（从同一份 evaluation 几何实绘）
function renderMiniSvg(ev) {
  const { geo } = ev;
  const ns = "http://www.w3.org/2000/svg";
  elMiniSvg.textContent = "";
  const sx = 200 / geo.vpW;
  const sy = 150 / geo.vpH;
  const scale = Math.min(sx, sy);
  const ox = (200 - geo.vpW * scale) / 2;
  const oy = (150 - geo.vpH * scale) / 2;
  const X = (v) => (ox + v * scale).toFixed(1);
  const Y = (v) => (oy + v * scale).toFixed(1);
  const S = (v) => Math.max(2, v * scale).toFixed(1);

  const mk = (tag, attrs) => {
    const n = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    elMiniSvg.appendChild(n);
    return n;
  };

  // 外层视口底
  mk("rect", { x: X(0), y: Y(0), width: S(geo.vpW), height: S(geo.vpH), fill: "#EAF25A", stroke: "#090A08", "stroke-width": 1 });
  // 父容器 .parent
  mk("rect", {
    x: X(geo.parentRect.x),
    y: Y(geo.parentRect.y),
    width: S(geo.parentRect.w),
    height: S(geo.parentRect.h),
    fill: "#F9EECD",
    stroke: state.parentPos === "relative" ? "#090A08" : "#B43700",
    "stroke-width": 1.4,
    ...(state.parentPos === "static" ? { "stroke-dasharray": "4 3" } : {}),
  });

  const drawOrder = [
    { key: "top", shape: "rect", fill: "#04412C", z: 2 },
    { key: "bottom", shape: "rect", fill: "#04412C", z: 2 },
    { key: "left", shape: "circle", fill: "#04412C", z: 2 },
    { key: "right", shape: "circle", fill: "#E04B06", z: 4 },
    { key: "cover", shape: "rect", fill: "#063825", z: state.coverZ },
    { key: "center", shape: "rect", fill: "#E04B06", z: state.centerZ },
  ].sort((a, b) => a.z - b.z);

  for (const item of drawOrder) {
    const r = geo.rects[item.key];
    if (item.shape === "circle") {
      const rad = (Math.min(r.w, r.h) / 2) * scale;
      mk("circle", {
        cx: (ox + (r.x + r.w / 2) * scale).toFixed(1),
        cy: (oy + (r.y + r.h / 2) * scale).toFixed(1),
        r: Math.max(3, rad).toFixed(1),
        fill: item.fill,
      });
    } else {
      mk("rect", {
        x: X(r.x),
        y: Y(r.y),
        width: S(r.w),
        height: S(r.h),
        fill: item.fill,
        stroke: item.key === "center" ? "#090A08" : "none",
        "stroke-width": item.key === "center" ? 1 : 0,
      });
    }
  }
}

// 缓存当前舞台的像素缩放映射，供拖拽和 Canvas 标尺共用
let stageMetrics = { scale: 0.5, ox: 0, oy: 0, vpRect: null, ev: null };

function syncHeroDOM() {
  const ev = evaluateState(state);
  const { geo, checks, score, diag } = ev;

  const vw = elViewport.clientWidth || 800;
  const vh = elViewport.clientHeight || 392;
  const padX = vw < 520 ? 10 : 20;
  const padY = vw < 520 ? 22 : 24;
  const scale = Math.min((vw - padX * 2) / geo.vpW, (vh - padY * 2) / geo.vpH);
  const ox = (vw - geo.vpW * scale) / 2;
  const oy = (vh - geo.vpH * scale) / 2;

  stageMetrics = { scale, ox, oy, ev };

  // 真实切换 .parent 的 CSS position（static vs relative）
  elViewport.classList.toggle("is-anchored", state.parentPos === "relative");
  elViewport.classList.toggle("skin-ui", state.skin === "ui");
  elParent.classList.toggle("is-static", state.parentPos === "static");
  elParent.classList.toggle("is-relative", state.parentPos === "relative");

  // 设置 .parent 的实际像素宽高，居中放在外层视口壳中
  const parentPxW = Math.round(geo.parentRect.w * scale);
  const parentPxH = Math.round(geo.parentRect.h * scale);
  elParent.style.width = `${parentPxW}px`;
  elParent.style.height = `${parentPxH}px`;

  // 四角坐标圆点与标签始终挂在 .parent 真实边界上
  const pLeft = Math.round(ox + geo.parentRect.x * scale);
  const pTop = Math.round(oy + geo.parentRect.y * scale);
  const placeCorner = (dot, txt, x, y, dx, dy, text) => {
    if (state.parentPos === "relative") {
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      txt.style.left = `${x + dx}px`;
      txt.style.top = `${y + dy}px`;
    } else {
      dot.style.left = `${pLeft + x}px`;
      dot.style.top = `${pTop + y}px`;
      txt.style.left = `${pLeft + x + dx}px`;
      txt.style.top = `${pTop + y + dy}px`;
    }
    txt.textContent = text;
  };
  const labelShift = vw < 520 ? 4 : 6;
  placeCorner(cornerEls.tlDot, cornerEls.tlTxt, 0, 0, labelShift, -20, "(0, 0)");
  placeCorner(cornerEls.trDot, cornerEls.trTxt, parentPxW, 0, -64, -20, `(${geo.pw}, 0)`);
  placeCorner(cornerEls.blDot, cornerEls.blTxt, 0, parentPxH, labelShift, 5, `(0, ${geo.ph})`);
  placeCorner(cornerEls.brDot, cornerEls.brTxt, parentPxW, parentPxH, -76, 5, `(${geo.pw}, ${geo.ph})`);

  elParentPosLabel.textContent = state.parentPos === "relative"
    ? "父容器 .parent（position: relative）"
    : "父容器 .parent（static 未立锚）";
  elParentSizeLabel.textContent = `${geo.pw}px × ${geo.ph}px`;

  // 用真实 CSS position: absolute 坐标放置全部 6 枚块！
  // 注意：当 .parent 为 relative 时，坐标原点是 .parent 左上角；
  // 当 .parent 为 static 时，浏览器自动以 .stage-viewport 左上角为包含块！
  const setBlockBox = (el, r, isCircle = false) => {
    const pxW = Math.round(r.w * scale);
    const pxH = Math.round(r.h * scale);
    const d = isCircle ? Math.max(54, Math.min(pxW, pxH)) : null;
    const w = isCircle ? d : Math.max(76, pxW);
    const h = isCircle ? d : Math.max(44, pxH);
    const cx = ox + (r.x + r.w / 2) * scale;
    const cy = oy + (r.y + r.h / 2) * scale;
    // 换算到当前真实包含块坐标
    const refX = state.parentPos === "relative" ? pLeft : 0;
    const refY = state.parentPos === "relative" ? pTop : 0;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.left = `${Math.round(cx - w / 2 - refX)}px`;
    el.style.top = `${Math.round(cy - h / 2 - refY)}px`;
  };

  setBlockBox(elBlocks.top, geo.rects.top);
  setBlockBox(elBlocks.bottom, geo.rects.bottom);
  setBlockBox(elBlocks.left, geo.rects.left, true);
  setBlockBox(elBlocks.right, geo.rects.right, true);
  setBlockBox(elBlocks.cover, geo.rects.cover);
  setBlockBox(elBlocks.center, geo.rects.center);

  // 真实 CSS z-index（舞台测绘 Canvas 在 z-index: 2；普通块 4+；若 centerZ < 0 则降到 1 真实沉到中轴线下方！）
  elBlocks.center.style.zIndex = state.centerZ < 0 ? "1" : String(state.centerZ + 4);
  elBlocks.cover.style.zIndex = String(state.coverZ + 4);
  elBlocks.center.style.opacity = state.centerZ < 0 ? "0.52" : "1";

  // 同步皮肤文案
  document.querySelectorAll(".abs-block .blk-title").forEach((sp) => {
    sp.textContent = sp.dataset[state.skin] || sp.textContent;
  });

  // 同步块内实时 CSS 标注（换行简洁，绝不撑出彩色块）
  elBlkRightCode.innerHTML = state.rightMode === "right-px"
    ? `top: ${state.parentPos === "static" ? 10 : BLOCK_SPECS.right.top}px;<br>right: 30px;`
    : `top: ${state.parentPos === "static" ? 10 : BLOCK_SPECS.right.top}px;<br>left: 668px;`;
  elBlkCoverCode.textContent = `z-index: ${state.coverZ};`;
  elBlkCenterCode.innerHTML = state.translateCenter
    ? (ev.centerDist <= 6 ? "50%, 50%<br>translate(-50%)" : `left:${ev.relLeft}px<br>top:${ev.relTop}px`)
    : `left:${ev.relLeft}px top:${ev.relTop}px`;

  // 高亮关键词对应块
  Object.entries(elBlocks).forEach(([k, el]) => {
    const hi =
      (state.highlightKey === "anchor" && (k === "right" || k === "top")) ||
      (state.highlightKey === "center" && k === "center") ||
      (state.highlightKey === "stack" && (k === "center" || k === "cover")) ||
      (state.highlightKey === "edge" && k === "right") ||
      (state.highlightKey === "flow");
    el.classList.toggle("is-hi", !!hi);
  });

  // 标题示范联动：「位」字随中心偏移轻微浮动，附实时逻辑坐标
  const charDx = Math.max(-10, Math.min(10, Math.round(ev.dx / 24)));
  const charDy = Math.max(-6, Math.min(6, Math.round(ev.dy / 24)));
  elTitleFloat.style.setProperty("--char-dx", `${charDx}px`);
  elTitleFloat.style.setProperty("--char-dy", `${charDy}px`);
  elTitleCoord.textContent = `${Math.round(ev.relLeft)},${Math.round(ev.relTop)}`;

  // 更新顶栏得分与 5 关键词实时状态灯
  elScorePill.textContent = score === 4 ? "4 / 4 已校准" : `${score} / 4 待校准`;
  elScorePill.classList.toggle("is-ok", score === 4);
  elScorePill.classList.toggle("is-err", score < 4);

  for (const key of ["anchor", "center", "stack", "edge"]) {
    const item = document.getElementById(`kw-${key}`);
    const stat = document.getElementById(`kw-stat-${key}`);
    item.classList.toggle("is-ok", checks[key].ok);
    item.classList.toggle("is-err", !checks[key].ok);
    stat.textContent = checks[key].short;
  }

  // 更新按钮激活状态
  document.querySelectorAll("[data-skin]").forEach((b) => {
    const on = b.dataset.skin === state.skin;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-parent-pos]").forEach((b) => {
    const on = b.dataset.parentPos === state.parentPos;
    b.classList.toggle("is-active", on && state.parentPos === "relative");
    b.classList.toggle("is-warn", on && state.parentPos === "static");
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-trans]").forEach((b) => {
    const on = (b.dataset.trans === "on") === state.translateCenter;
    b.classList.toggle("is-active", on && state.translateCenter);
    b.classList.toggle("is-warn", on && !state.translateCenter);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-cz]").forEach((b) => {
    const val = Number(b.dataset.cz);
    const on = val === state.centerZ;
    b.classList.toggle("is-active", on && val > state.coverZ);
    b.classList.toggle("is-warn", on && val <= state.coverZ);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-rmode]").forEach((b) => {
    const on = b.dataset.rmode === state.rightMode;
    b.classList.toggle("is-active", on && state.rightMode === "right-px");
    b.classList.toggle("is-warn", on && state.rightMode === "left-px");
    b.setAttribute("aria-pressed", String(on));
  });
  elBtnNarrow.classList.toggle("is-active", state.parentNarrow);
  elBtnNarrow.setAttribute("aria-pressed", String(state.parentNarrow));
  elBtnNarrow.textContent = state.parentNarrow ? "恢复 800px" : "窄框 540px";

  // 更新白话诊单
  elHeroDiag.classList.toggle("is-ok", diag.tone === "ok");
  elHeroDiag.classList.toggle("is-err", diag.tone !== "ok");
  elDiagBadge.textContent = diag.badge;
  elDiagMetric.textContent = `中心偏差 Δ(${ev.dx >= 0 ? "+" : ""}${ev.dx}, ${ev.dy >= 0 ? "+" : ""}${ev.dy})px`;
  elDiagTitle.textContent = diag.title;
  elDiagWhy.textContent = diag.why;
  elDiagAction.textContent = diag.action;

  // 更新 ARIA slider
  elBlocks.center.setAttribute("aria-valuenow", String(Math.round(state.centerX)));

  // 更新实时纯黑 CSS 终端与迷你效果示意
  renderHighlightedCSS(elHeroCode, ev.cssText);
  renderMiniSvg(ev);

  needsRedraw = true;
}

// 2D Canvas 测绘标尺：50% 虚线中轴、实时坐标引线、父框逃逸红线
function drawHeroCanvas(t, dt, { still }) {
  if (!still && heroIntroT < 1) {
    heroIntroT = Math.min(1, heroIntroT + dt * 1.45);
    needsRedraw = true;
  } else if (still) {
    heroIntroT = 1;
  }
  if (!needsRedraw) return;
  needsRedraw = false;

  const vw = elViewport.clientWidth || 800;
  const vh = elViewport.clientHeight || 392;
  const dpr = pixelRatio(2);
  const bw = Math.round(vw * dpr);
  const bh = Math.round(vh * dpr);
  if (elCanvas.width !== bw || elCanvas.height !== bh) {
    elCanvas.width = bw;
    elCanvas.height = bh;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, vw, vh);

  const { scale, ox, oy, ev } = stageMetrics;
  if (!ev) return;
  const { geo } = ev;
  const tx = (x) => ox + x * scale;
  const ty = (y) => oy + y * scale;

  const ease = 1 - Math.pow(1 - heroIntroT, 3);
  const p = geo.parentRect;
  const px0 = tx(p.x), py0 = ty(p.y), px1 = tx(p.x + p.w), py1 = ty(p.y + p.h);
  const pmx = (px0 + px1) / 2;
  const pmy = (py0 + py1) / 2;

  // 1. 原海报 50% 虚线中轴（仅在 .parent 内部画，带开场生长动效）
  ctx.save();
  ctx.strokeStyle = "rgba(9, 10, 8, 0.52)";
  ctx.lineWidth = 1.25;
  ctx.setLineDash([5, 4]);
  // 水平中轴
  ctx.beginPath();
  ctx.moveTo(px0, pmy);
  ctx.lineTo(px0 + (px1 - px0) * ease, pmy);
  ctx.stroke();
  // 垂直中轴
  ctx.beginPath();
  ctx.moveTo(pmx, py0);
  ctx.lineTo(pmx, py0 + (py1 - py0) * ease);
  ctx.stroke();
  ctx.restore();

  // 中心基准小十字记号
  ctx.save();
  ctx.strokeStyle = "#04412C";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pmx - 7, pmy); ctx.lineTo(pmx + 7, pmy);
  ctx.moveTo(pmx, pmy - 7); ctx.lineTo(pmx, pmy + 7);
  ctx.stroke();
  ctx.restore();

  // 2. 实时坐标测绘线：从当前参照容器 .cb 的左/顶边连向朱红居中块
  const cb = geo.cb;
  const c = geo.rects.center;
  const cbX = tx(cb.x);
  const cbY = ty(cb.y);
  const cL = tx(c.x);
  const cT = ty(c.y);
  const cMidX = tx(c.x + c.w / 2);
  const cMidY = ty(c.y + c.h / 2);

  ctx.save();
  ctx.strokeStyle = state.parentPos === "static" ? "#B43700" : "#04412C";
  ctx.fillStyle = state.parentPos === "static" ? "#B43700" : "#04412C";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);

  // 左侧距离线
  ctx.beginPath();
  ctx.moveTo(cbX, cT + 10);
  ctx.lineTo(cL, cT + 10);
  ctx.stroke();

  // 顶部距离线
  ctx.beginPath();
  ctx.moveTo(cL + 10, cbY);
  ctx.lineTo(cL + 10, cT);
  ctx.stroke();
  ctx.setLineDash([]);

  // 标注左/顶坐标胶囊
  const drawPill = (x, y, text, bg, fg) => {
    ctx.font = '500 10.5px "DM Mono", monospace';
    const tw = ctx.measureText(text).width + 10;
    const th = 18;
    const rx = Math.max(4, Math.min(vw - tw - 4, x - tw / 2));
    const ry = Math.max(4, Math.min(vh - th - 4, y - th / 2));
    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, tw, th);
    ctx.strokeStyle = "#090A08";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, tw, th);
    ctx.fillStyle = fg;
    ctx.textBaseline = "middle";
    ctx.fillText(text, rx + 5, ry + th / 2 + 0.5);
  };

  if (vw >= 460) {
    drawPill((cbX + cL) / 2, cT + 10, `left: ${ev.relLeft}px`, "#F1FB2F", "#090A08");
    drawPill(cL + 10, (cbY + cT) / 2, `top: ${ev.relTop}px`, "#F1FB2F", "#090A08");
  }

  // 3. 当 .parent 为 static 时，画一条醒目逃逸轨迹箭头，标签放在「靠右」圆正下方避开 (800, 0)
  if (state.parentPos === "static") {
    const r = geo.rects.right;
    const rCx = tx(r.x + r.w / 2);
    const rCy = ty(r.y + r.h / 2);
    const rBot = ty(r.y + r.h);
    ctx.strokeStyle = "#B43700";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(px1 - 24, py0 + 36);
    ctx.lineTo(rCx, rCy);
    ctx.stroke();
    ctx.setLineDash([]);
    drawPill(Math.min(vw - 56, rCx - 8), rBot + 14, "脱离父框逃逸", "#B43700", "#FFFDF5");
  } else if (ev.rightOverflowParent > 0) {
    const r = geo.rects.right;
    drawPill(px1 - 52, ty(r.y + r.h) + 14, `溢出 +${ev.rightOverflowParent}px`, "#B43700", "#FFFDF5");
  }

  // 4. 若居中块偏离中心，画一条细连线标示几何中心到中轴交点的偏差
  if (state.parentPos === "relative" && ev.centerDist > 4) {
    ctx.strokeStyle = "#B43700";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(pmx, pmy);
    ctx.lineTo(cMidX, cMidY);
    ctx.stroke();
    ctx.fillStyle = "#B43700";
    ctx.beginPath();
    ctx.arc(pmx, pmy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const heroLoop = loop(elViewport, drawHeroCanvas);

// 拖拽朱红居中块（鼠标 + 触摸 Pointer Events，支持靠近正中轻轻吸附）
function initHeroDrag() {
  const handle = elBlocks.center;
  let startPtrX = 0, startPtrY = 0;
  let startCenterX = 0, startCenterY = 0;

  const onDown = (e) => {
    dragActive = true;
    handle.classList.add("is-dragging");
    if (e.pointerId != null && handle.setPointerCapture) {
      try { handle.setPointerCapture(e.pointerId); } catch {}
    }
    const pt = e.touches ? e.touches[0] : e;
    startPtrX = pt.clientX;
    startPtrY = pt.clientY;
    startCenterX = state.centerX;
    startCenterY = state.centerY;
  };

  const onMove = (e) => {
    if (!dragActive) return;
    if (e.cancelable) e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const s = Math.max(0.25, stageMetrics.scale);
    const dx = (pt.clientX - startPtrX) / s;
    const dy = (pt.clientY - startPtrY) / s;

    let nx = Math.max(20, Math.min(LOGICAL_W - 40, startCenterX + dx));
    let ny = Math.max(20, Math.min(LOGICAL_H - 40, startCenterY + dy));

    // 当拖动使实际中心靠近 (400, 300) 时轻轻吸附
    const halfW = state.translateCenter ? 0 : BLOCK_SPECS.center.w / 2;
    const halfH = state.translateCenter ? 0 : BLOCK_SPECS.center.h / 2;
    const targetAnchorX = 400 - halfW;
    const targetAnchorY = 300 - halfH;
    if (Math.hypot(nx - targetAnchorX, ny - targetAnchorY) < 18) {
      nx = targetAnchorX;
      ny = targetAnchorY;
    }

    state.centerX = Math.round(nx);
    state.centerY = Math.round(ny);
    syncHeroDOM();
    heroLoop.draw();
  };

  const onUp = () => {
    if (!dragActive) return;
    dragActive = false;
    handle.classList.remove("is-dragging");
  };

  // 同时支持 Pointer 与 Touch（确保 CDP Input.dispatchTouchEvent 在所有模式下都能丝滑驱动）
  handle.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  handle.addEventListener("touchstart", onDown, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onUp);

  // 键盘方向键微调（Shift 加速）
  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 24 : 8;
    let moved = true;
    if (e.key === "ArrowLeft") state.centerX = Math.max(20, state.centerX - step);
    else if (e.key === "ArrowRight") state.centerX = Math.min(LOGICAL_W - 40, state.centerX + step);
    else if (e.key === "ArrowUp") state.centerY = Math.max(20, state.centerY - step);
    else if (e.key === "ArrowDown") state.centerY = Math.min(LOGICAL_H - 40, state.centerY + step);
    else moved = false;
    if (moved) {
      e.preventDefault();
      syncHeroDOM();
      heroLoop.draw();
    }
  });
}

// 绑定 Hero 控件事件
function initHeroControls() {
  document.querySelectorAll("[data-skin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.skin = btn.dataset.skin;
      syncHeroDOM();
      heroLoop.draw();
    });
  });

  document.querySelectorAll("[data-parent-pos]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.parentPos = btn.dataset.parentPos;
      syncHeroDOM();
      heroLoop.draw();
    });
  });

  document.querySelectorAll("[data-trans]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.translateCenter = btn.dataset.trans === "on";
      if (state.translateCenter) {
        state.centerX = 400;
        state.centerY = 300;
      } else {
        state.centerX = 400;
        state.centerY = 300;
      }
      syncHeroDOM();
      heroLoop.draw();
    });
  });

  document.querySelectorAll("[data-cz]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.centerZ = Number(btn.dataset.cz);
      state.coverZ = state.centerZ === 3 ? 1 : 6;
      syncHeroDOM();
      heroLoop.draw();
    });
  });

  document.querySelectorAll("[data-rmode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.rightMode = btn.dataset.rmode;
      syncHeroDOM();
      heroLoop.draw();
    });
  });

  elBtnNarrow.addEventListener("click", () => {
    state.parentNarrow = !state.parentNarrow;
    syncHeroDOM();
    heroLoop.draw();
  });

  document.getElementById("btn-reset-broken").addEventListener("click", () => {
    Object.assign(state, createBrokenState());
    syncHeroDOM();
    heroLoop.draw();
  });

  document.getElementById("btn-apply-solution").addEventListener("click", () => {
    Object.assign(state, createPosterSolution());
    syncHeroDOM();
    heroLoop.draw();
  });

  document.querySelectorAll("[data-kw]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.kw;
      state.highlightKey = state.highlightKey === k ? null : k;
      document.querySelectorAll("[data-kw]").forEach((b) => {
        b.classList.toggle("is-selected", b.dataset.kw === state.highlightKey);
      });
      syncHeroDOM();
      heroLoop.draw();
    });
  });

  new ResizeObserver(() => {
    syncHeroDOM();
    heroLoop.draw();
  }).observe(elViewport);
}

// ==================== 01 脱离文档流实验 ====================
function initSec01Flow() {
  const parentA = document.getElementById("flow-parent-a");
  const ghost = document.getElementById("flow-ghost");
  const soloParent = document.getElementById("flow-solo-parent");
  const readout = document.getElementById("flow-readout");
  const itemC = document.getElementById("flow-c");
  const btns = document.querySelectorAll("[data-flow-mode]");

  const render = (mode) => {
    parentA.classList.remove("mode-relative", "mode-absolute");
    if (mode === "relative") parentA.classList.add("mode-relative");
    if (mode === "absolute") parentA.classList.add("mode-absolute");
    ghost.hidden = mode !== "relative";
    soloParent.classList.toggle("is-collapsed", mode === "absolute");

    btns.forEach((b) => {
      const on = b.dataset.flowMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    // 读取真实渲染高度与 C 块位置
    requestAnimationFrame(() => {
      const soloH = Math.round(soloParent.getBoundingClientRect().height);
      const cTop = Math.round(itemC.offsetTop);
      if (mode === "static") {
        readout.innerHTML = `<strong>static 普通流：</strong>B 块老老实实排在 A 和 C 中间，C 块距顶 <code>${cTop}px</code>；旁边仅含 B 块的父容器被 B 撑出 <code>${soloH}px</code> 高度。`;
      } else if (mode === "relative") {
        readout.innerHTML = `<strong>relative 留原坑：</strong>B 块往右上方挪开了，但虚线原坑仍然占着流内高度，C 块寸步未移（距顶仍为 <code>${cTop}px</code>），旁边父容器高度也纹丝不动（<code>${soloH}px</code>）。`;
      } else {
        readout.innerHTML = `<strong>absolute 彻底脱流：</strong>B 块被提离文档流，C 块立刻上移补位（距顶缩到 <code>${cTop}px</code>）！旁边没有其他流内撑持的父容器当场塌陷到 <code>${soloH}px</code>（只剩上下边框），外部段落直接顶了上来。`;
      }
    });
  };

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.flowMode)));
  render("static");
}

// ==================== 02 包含块嵌套树 ====================
function initSec02ContainingBlock() {
  const cbState = { mid: "static", inner: "static" };
  const midStage = document.getElementById("cb-stage-mid");
  const innerStage = document.getElementById("cb-stage-inner");
  const midTxt = document.getElementById("cb-mid-state");
  const innerTxt = document.getElementById("cb-inner-state");
  const readout = document.getElementById("cb-readout");

  const applyProps = (el, val) => {
    el.style.position = val === "relative" ? "relative" : "static";
    el.style.transform = val === "transform" ? "scale(1)" : "none";
    el.style.filter = val === "filter" ? "blur(0px)" : "none";
    el.style.contain = val === "contain" ? "layout" : "none";
  };

  const render = () => {
    applyProps(midStage, cbState.mid);
    applyProps(innerStage, cbState.inner);
    midTxt.textContent = cbState.mid;
    innerTxt.textContent = cbState.inner;

    const innerCaptures = cbState.inner !== "static";
    const midCaptures = !innerCaptures && cbState.mid !== "static";
    innerStage.classList.toggle("is-cb", innerCaptures);
    midStage.classList.toggle("is-cb", midCaptures);

    document.querySelectorAll("[data-cb-mid]").forEach((b) => {
      const on = b.dataset.cbMid === cbState.mid;
      b.classList.toggle("is-active", on && cbState.mid !== "transform");
      b.classList.toggle("is-trap-on", on && cbState.mid === "transform");
      b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-cb-inner]").forEach((b) => {
      const on = b.dataset.cbInner === cbState.inner;
      const isTrap = cbState.inner === "filter" || cbState.inner === "contain";
      b.classList.toggle("is-active", on && !isTrap);
      b.classList.toggle("is-trap-on", on && isTrap);
      b.setAttribute("aria-pressed", String(on));
    });

    if (innerCaptures) {
      const why = cbState.inner === "relative"
        ? "因为卡片设置了 <code>position: relative</code>，它是距徽标最近的已定位祖先。"
        : `注意隐藏陷阱！卡片依然是 <code>position: static</code>，但挂了 <code>${cbState.inner === "filter" ? "filter: blur(0)" : "contain: layout"}</code>，浏览器依然把它升格为包含块！`;
      readout.innerHTML = `<strong>当前认主：内层卡片 .card</strong>（padding 盒右上角 10px）。${why}`;
    } else if (midCaptures) {
      const why = cbState.mid === "relative"
        ? "卡片仍是 static，浏览器向上一层找到 <code>.sidebar { position: relative }</code> 才停下。"
        : "卡片和侧栏都是 <code>position: static</code>，但侧栏挂了 <code>transform: scale(1)</code>，直接截胡成了包含块！";
      readout.innerHTML = `<strong>当前认主：中层侧栏 .sidebar</strong>（徽标越出卡片、停在侧栏右上角）。${why}`;
    } else {
      readout.innerHTML = `<strong>当前认主：最外层 .page 初始包含块</strong>。卡片和侧栏都没立锚，徽标一路穿过两层边框飞到页面最外角。`;
    }
  };

  document.querySelectorAll("[data-cb-mid]").forEach((b) => b.addEventListener("click", () => {
    cbState.mid = b.dataset.cbMid;
    render();
  }));
  document.querySelectorAll("[data-cb-inner]").forEach((b) => b.addEventListener("click", () => {
    cbState.inner = b.dataset.cbInner;
    render();
  }));
  render();
}

// ==================== 03 四边坐标与自动拉伸 ====================
function initSec03Inset() {
  const st = {
    containerW: 440,
    containerH: 260,
    useTop: true,
    useRight: true,
    useBottom: false,
    useLeft: false,
    top: 24,
    right: 24,
    bottom: 24,
    left: 24,
    explicitSize: false,
  };

  const elBox = document.getElementById("inset-parent");
  const elTarget = document.getElementById("inset-target");
  const elSize = document.getElementById("inset-target-size");
  const elMode = document.getElementById("inset-target-mode");
  const elCode = document.getElementById("inset-code");
  const elReadout = document.getElementById("inset-readout");
  const elSlider = document.getElementById("inset-width-slider");
  const elWVal = document.getElementById("inset-w-val");
  const elBr = document.getElementById("inset-br-label");

  const chks = {
    top: document.getElementById("chk-top"),
    right: document.getElementById("chk-right"),
    bottom: document.getElementById("chk-bottom"),
    left: document.getElementById("chk-left"),
    size: document.getElementById("chk-explicit-size"),
  };

  const cords = {
    top: document.getElementById("cord-top"),
    right: document.getElementById("cord-right"),
    bottom: document.getElementById("cord-bottom"),
    left: document.getElementById("cord-left"),
  };

  const render = () => {
    const shellInnerW = Math.max(220, (elBox.parentElement.clientWidth || 440) - 32);
    const cappedW = Math.min(st.containerW, shellInnerW);
    elBox.style.setProperty("--inset-w", `${cappedW}px`);
    elWVal.textContent = `${Math.round(cappedW)}px`;
    const actualW = cappedW;
    elBr.textContent = `(${Math.round(actualW)}, ${st.containerH})`;

    const res = evalInsetBox({ ...st, containerW: actualW });
    elTarget.style.left = `${Math.round(res.x)}px`;
    elTarget.style.top = `${Math.round(res.y)}px`;
    elTarget.style.width = `${Math.round(res.w)}px`;
    elTarget.style.height = `${Math.round(res.h)}px`;

    elSize.textContent = `${Math.round(res.w)} × ${Math.round(res.h)}px`;
    elMode.textContent = res.overConstrainedX || res.overConstrainedY
      ? "过约束（固定尺寸优先）"
      : res.stretchX && res.stretchY
        ? "四边全拉 inset"
        : res.stretchX
          ? "横向自动拉伸"
          : res.stretchY
            ? "纵向自动拉伸"
            : "单边锚定";

    // 四根可视化绳索
    cords.top.classList.toggle("is-on", st.useTop);
    cords.top.classList.remove("is-ignored");
    cords.top.style.left = `${Math.round(res.x + res.w / 2)}px`;
    cords.top.style.top = "0px";
    cords.top.style.height = `${Math.max(0, Math.round(res.y))}px`;

    cords.bottom.classList.toggle("is-on", st.useBottom);
    cords.bottom.classList.toggle("is-ignored", res.overConstrainedY);
    cords.bottom.style.left = `${Math.round(res.x + res.w / 2)}px`;
    cords.bottom.style.top = `${Math.round(res.y + res.h)}px`;
    cords.bottom.style.height = `${Math.max(0, Math.round(st.containerH - (res.y + res.h)))}px`;

    cords.left.classList.toggle("is-on", st.useLeft);
    cords.left.classList.remove("is-ignored");
    cords.left.style.top = `${Math.round(res.y + res.h / 2)}px`;
    cords.left.style.left = "0px";
    cords.left.style.width = `${Math.max(0, Math.round(res.x))}px`;

    cords.right.classList.toggle("is-on", st.useRight);
    cords.right.classList.toggle("is-ignored", res.overConstrainedX);
    cords.right.style.top = `${Math.round(res.y + res.h / 2)}px`;
    cords.right.style.left = `${Math.round(res.x + res.w)}px`;
    cords.right.style.width = `${Math.max(0, Math.round(actualW - (res.x + res.w)))}px`;

    chks.top.checked = st.useTop;
    chks.right.checked = st.useRight;
    chks.bottom.checked = st.useBottom;
    chks.left.checked = st.useLeft;
    chks.size.checked = st.explicitSize;

    renderHighlightedCSS(elCode, res.css);
    elReadout.textContent = res.explanation;
  };

  elSlider.addEventListener("input", () => { st.containerW = Number(elSlider.value); render(); });
  chks.top.addEventListener("change", () => { st.useTop = chks.top.checked; render(); });
  chks.right.addEventListener("change", () => { st.useRight = chks.right.checked; render(); });
  chks.bottom.addEventListener("change", () => { st.useBottom = chks.bottom.checked; render(); });
  chks.left.addEventListener("change", () => { st.useLeft = chks.left.checked; render(); });
  chks.size.addEventListener("change", () => { st.explicitSize = chks.size.checked; render(); });

  document.querySelectorAll("[data-inset-preset]").forEach((b) => {
    b.addEventListener("click", () => {
      const p = b.dataset.insetPreset;
      if (p === "corner") Object.assign(st, { useTop: true, useRight: true, useBottom: false, useLeft: false, explicitSize: false });
      else if (p === "bar") Object.assign(st, { useTop: false, useRight: true, useBottom: true, useLeft: true, explicitSize: false });
      else if (p === "veil") Object.assign(st, { useTop: true, useRight: true, useBottom: true, useLeft: true, explicitSize: false });
      else if (p === "conflict") Object.assign(st, { useTop: true, useRight: true, useBottom: true, useLeft: true, explicitSize: true });
      render();
    });
  });

  new ResizeObserver(render).observe(elBox.parentElement);
  render();
}

// ==================== 04 层叠上下文 3D 等轴测剖面 ====================
function initSec04Stacking() {
  const st = { parentATrap: "z1", parentAZ: 1, childAZ: 9999, parentBZ: 2 };
  const canvas = document.getElementById("stack-canvas");
  const sctx = canvas.getContext("2d");
  const elVerdict = document.getElementById("stack-verdict");
  const elReadout = document.getElementById("stack-readout");
  const outChild = document.getElementById("out-child-z");
  const outB = document.getElementById("out-b-z");

  let animZ = 0;
  let dirty = true;

  const drawPlane = (cx, cy, w, h, fill, stroke, label, sub, dashed = false) => {
    const skX = 28;
    const skY = 14;
    sctx.save();
    sctx.beginPath();
    sctx.moveTo(cx - w / 2 + skX, cy - h / 2 - skY);
    sctx.lineTo(cx + w / 2 + skX, cy - h / 2 - skY);
    sctx.lineTo(cx + w / 2 - skX, cy + h / 2 + skY);
    sctx.lineTo(cx - w / 2 - skX, cy + h / 2 + skY);
    sctx.closePath();
    sctx.fillStyle = fill;
    sctx.fill();
    sctx.lineWidth = 2;
    sctx.strokeStyle = stroke;
    if (dashed) sctx.setLineDash([6, 4]);
    sctx.stroke();
    sctx.setLineDash([]);

    sctx.fillStyle = fill === "#04412C" || fill === "#E04B06" || fill === "#B43700" ? "#FFFDF5" : "#090A08";
    sctx.font = '800 14px "Noto Sans SC", sans-serif';
    sctx.textBaseline = "middle";
    sctx.fillText(label, cx - w / 2 + 12, cy - 6);
    if (sub) {
      sctx.font = '500 12px "DM Mono", monospace';
      sctx.fillText(sub, cx - w / 2 + 12, cy + 14);
    }
    sctx.restore();
  };

  const renderFrame = (_t, dt, { still }) => {
    const res = evalStacking(st);
    const targetLift = res.childWins ? 1 : 0;
    if (still) {
      animZ = targetLift;
    } else if (Math.abs(animZ - targetLift) > 0.005) {
      animZ += (targetLift - animZ) * Math.min(1, dt * 9);
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    const dpr = pixelRatio(2);
    const cssW = canvas.clientWidth || 640;
    const cssH = Math.round((cssW * 9) / 16);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    sctx.setTransform(dpr * (cssW / 640), 0, 0, dpr * (cssH / 360), 0, 0);
    sctx.clearRect(0, 0, 640, 360);

    // 淡网格底
    sctx.fillStyle = "#F9EECD";
    sctx.fillRect(0, 0, 640, 360);
    sctx.strokeStyle = "rgba(9,10,8,0.08)";
    sctx.lineWidth = 1;
    for (let x = 40; x < 640; x += 40) { sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, 360); sctx.stroke(); }

    // 左侧 Z 轴标尺箭头
    sctx.strokeStyle = "#090A08";
    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(46, 326);
    sctx.lineTo(46, 38);
    sctx.stroke();
    sctx.fillStyle = "#090A08";
    sctx.beginPath();
    sctx.moveTo(46, 26); sctx.lineTo(40, 40); sctx.lineTo(52, 40); sctx.closePath();
    sctx.fill();
    sctx.font = '500 12px "DM Mono", monospace';
    sctx.fillText("Z 轴", 28, 18);
    sctx.fillText("前景", 16, 56);
    sctx.fillText("底层", 16, 322);

    // 底层：根页面平面
    drawPlane(340, 300, 440, 56, "#FDFBF2", "#090A08", "根文档 Root", "z: 0");

    // 父容器 A 底座
    const aBaseY = 236;
    drawPlane(215, aBaseY, 224, 54, "#F1FB2F", "#090A08", "父容器 A", st.parentATrap === "none" ? "z-index: auto" : `${st.parentATrap === "z1" ? `z-index: ${st.parentAZ}` : st.parentATrap} (独立屋)`);

    // 弹窗 A（受 animZ 抬升，若被封屋则顶在天花板下方）
    const bY = 142;
    const childY = 236 - 40 - animZ * 104;

    // 绘制顺序决定遮挡关系！
    const drawChild = () => drawPlane(318, childY, 198, 50, "#E04B06", "#090A08", "弹窗 A（在 A 内）", `z-index: ${st.childAZ}`);
    const drawB = () => drawPlane(430, bY, 224, 56, "#04412C", "#090A08", "邻居容器 B", `z-index: ${st.parentBZ}`);

    if (animZ < 0.5) {
      drawChild();
      // 层叠天花板虚线盖子与独立白底标注牌
      if (res.aCreatesContext) {
        sctx.save();
        sctx.strokeStyle = "#B43700";
        sctx.lineWidth = 2.2;
        sctx.setLineDash([7, 4]);
        sctx.beginPath();
        sctx.moveTo(86, bY + 26);
        sctx.lineTo(418, bY + 26);
        sctx.stroke();
        sctx.setLineDash([]);
        sctx.fillStyle = "#FDFBF2";
        sctx.fillRect(86, bY - 2, 196, 22);
        sctx.strokeStyle = "#B43700";
        sctx.lineWidth = 1.4;
        sctx.strokeRect(86, bY - 2, 196, 22);
        sctx.fillStyle = "#B43700";
        sctx.font = '800 12px "Noto Sans SC", sans-serif';
        sctx.textBaseline = "middle";
        sctx.fillText("父 A 层叠天花板（冲不破）", 94, bY + 9);
        sctx.restore();
      }
      drawB();
    } else {
      drawB();
      drawChild();
    }
  };

  const stackLoop = loop(canvas, renderFrame);

  const sync = () => {
    const res = evalStacking(st);
    outChild.textContent = String(st.childAZ);
    outB.textContent = String(st.parentBZ);
    elVerdict.textContent = res.childWins ? "弹窗 A 稳压最前" : "弹窗 A 被 B 截断";
    elVerdict.classList.toggle("is-win", res.childWins);
    elReadout.textContent = res.reason;

    document.querySelectorAll("[data-trap]").forEach((b) => {
      const on = b.dataset.trap === st.parentATrap;
      b.classList.toggle("is-active", on && st.parentATrap === "none");
      b.classList.toggle("is-warn", on && st.parentATrap !== "none");
      b.setAttribute("aria-pressed", String(on));
    });
    dirty = true;
    stackLoop.draw();
  };

  document.querySelectorAll("[data-trap]").forEach((b) => b.addEventListener("click", () => {
    st.parentATrap = b.dataset.trap;
    sync();
  }));
  const steps = [1, 5, 10, 99, 9999];
  document.getElementById("btn-cz-dec").addEventListener("click", () => {
    const idx = steps.indexOf(st.childAZ);
    st.childAZ = idx > 0 ? steps[idx - 1] : 1;
    sync();
  });
  document.getElementById("btn-cz-inc").addEventListener("click", () => {
    const idx = steps.indexOf(st.childAZ);
    st.childAZ = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : 9999;
    sync();
  });
  document.getElementById("btn-bz-dec").addEventListener("click", () => {
    st.parentBZ = Math.max(0, st.parentBZ - 1);
    sync();
  });
  document.getElementById("btn-bz-inc").addEventListener("click", () => {
    st.parentBZ = Math.min(20, st.parentBZ + 1);
    sync();
  });

  sync();
}

// ==================== 05 历史年代卡（全部查核自 W3C / MDN 原始规范） ====================
const ERAS = {
  "1997": {
    spec: "W3C WD-positioning-970131 · 1997-01-31（8 月修订）",
    heading: "浏览器大战中的妥协：CSS-P 草案诞生",
    desc: "1997 年初，网景（Netscape）刚推出私有的 <layer> 标签，微软（Microsoft）则力推基于样式表的定位方案。为避免网页定位彻底分裂，W3C 召集双方合写了《Positioning HTML Elements with Cascading Style Sheets》（简称 CSS-P），由惠普的 Robert Stevahn 任主编，网景的 Scott Furman 等与微软的 Scott Isaacs 等共同执笔，首次把 position: absolute / relative、top / left 与 z-index 写进开放标准草案。",
    factTitle: "1997 草案奠定的四根支柱",
    factHtml: "<code>position: absolute | relative</code> · <code>top / left</code> 坐标 · <code>z-index</code> 层叠序 · <code>visibility</code> 显隐控制。",
  },
  "1998": {
    spec: "W3C REC-CSS2-19980512 · 1998-05-12",
    heading: "CSS2 正式推荐标准：包含块与层叠上下文定型",
    desc: "1998 年 5 月 12 日，Bert Bos、Håkon Wium Lie、Chris Lilley 与 Ian Jacobs 主编的 CSS2 正式发布，正式吸收了 CSS-P 草案。CSS2 明确写定：绝对定位元素脱离常规流，以「最近已定位祖先的包含块（containing block）」为坐标原点，并确立了 z-index 只作用于已定位元素与局部层叠上下文（stacking context）模型。",
    factTitle: "关键跃迁",
    factHtml: "网页第一次在开放标准下摆脱单一线性文档流，拥有了二维精确坐标与三维图层叠放能力。",
  },
  "2011": {
    spec: "W3C CSS 2.1 Recommendation · 2011-06-07",
    heading: "CSS 2.1：补全四边约束方程与自适应尺寸",
    desc: "早期浏览器对「同时写 left 和 right 却不写 width」实现各异。2011 年定稿的 CSS 2.1 规范逐条敲定了绝对定位的几何求解方程：何时按内容收缩（shrink-to-fit）、何时由对侧双边自动拉伸、以及过约束时在从左到右（LTR）排版下忽略 right 的统一规则。",
    factTitle: "工程意义",
    factHtml: "<code>top: 0; right: 0; bottom: 0; left: 0;</code> 跨浏览器一致铺满父框成为可靠范式。",
  },
  "now": {
    spec: "CSS Positioned Layout 3 & CSS Anchor Positioning 1",
    heading: "现代演进：inset 简写与跨祖先「锚点定位」",
    desc: "今天的 CSS Positioned Layout Level 3 引入了逻辑属性与简写 inset（一行替代四边），同时明确了 transform / filter / contain 等属性也会形成包含块。更前沿的 CSS Anchor Positioning Level 1 则直击绝对定位二十多年的老大难：无需把提示气泡硬塞进触发按钮的 DOM 里面，也能声明式地锚定到页面任意元素并自动避让视口边缘。",
    factTitle: "现代写法速览",
    factHtml: "<code>inset: 0;</code> 替代四边归零；新标准 <code>anchor-name</code> + <code>position-anchor</code> 让气泡浮层彻底解绑父子嵌套与 overflow 裁切。",
  },
};

function initSec05Timeline() {
  const tabs = document.querySelectorAll("[data-era]");
  const elSpec = document.getElementById("era-spec-id");
  const elHead = document.getElementById("era-heading");
  const elDesc = document.getElementById("era-desc");
  const elFact = document.getElementById("era-fact-card");

  const show = (key) => {
    const d = ERAS[key];
    elSpec.textContent = d.spec;
    elHead.textContent = d.heading;
    elDesc.textContent = d.desc;
    elFact.innerHTML = `<strong>${d.factTitle}</strong>${d.factHtml}`;
    tabs.forEach((t) => {
      const on = t.dataset.era === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  };

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.era)));
  show("1997");
}

// ==================== 06 场景决策卡 ====================
function initSec06Decisions() {
  document.querySelectorAll("[data-dec]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const open = card.classList.toggle("is-open");
      card.setAttribute("aria-expanded", String(open));
    });
  });
}

// ==================== 07 实战排错选择题（真实渲染预览） ====================
const QUIZ_ANS = {
  A: {
    ok: false,
    status: "A · 逃出卡片",
    text: "只差一个变量：父级 .card 是 position: static。徽标一路越过卡片边框，直接飞到外层页面容器的右上角（距外框 12px），和卡片彻底脱钩。",
  },
  B: {
    ok: false,
    status: "B · 缩窄越界",
    text: "只差一个变量：用固定 left: 286px 锁死左侧距离。卡片宽 340px 时看似正常，缩窄到 220px 后徽标直接冲出右墙，悬在卡片外面。",
  },
  C: {
    ok: true,
    status: "C · 正确稳贴",
    text: "正确！.card 设 position: relative 确立包含块，.badge 设 position: absolute 脱离文档流不挤标题，再以 top: 12px; right: 12px; 紧咬右上内沿——缩到 220px 或标题折行都纹丝不动。",
  },
  D: {
    ok: false,
    status: "D · 留坑顶行",
    text: "只差一个变量：把徽标写成了 position: relative。它没脱离文档流，还在图片上方占着一整行把内容往下顶，而且 right: 12px 是相对自身原位往左推 12px，直接顶出左边框！",
  },
};

function initSec07Quiz() {
  const opts = document.querySelectorAll("[data-opt]");
  const cardBox = document.getElementById("quiz-card-box");
  const badge = document.getElementById("quiz-badge");
  const targetGhost = document.getElementById("quiz-target-ghost");
  const status = document.getElementById("quiz-status");
  const fb = document.getElementById("quiz-feedback");

  const pick = (key) => {
    const info = QUIZ_ANS[key];
    badge.hidden = false;
    targetGhost.classList.toggle("is-hit", key === "C");
    cardBox.classList.toggle("sim-static", key === "A");
    badge.classList.toggle("sim-b", key === "B");
    badge.classList.toggle("sim-d", key === "D");

    status.textContent = info.status;
    status.classList.toggle("is-ok", info.ok);
    status.classList.toggle("is-err", !info.ok);
    fb.textContent = info.text;

    opts.forEach((btn) => {
      const isMe = btn.dataset.opt === key;
      btn.setAttribute("aria-pressed", String(isMe));
      btn.classList.toggle("is-picked-ok", isMe && info.ok);
      btn.classList.toggle("is-picked-err", isMe && !info.ok);
    });
  };

  opts.forEach((b) => b.addEventListener("click", () => pick(b.dataset.opt)));
}

// ==================== 08 原海报放大灯箱（只复用 #poster.src） ====================
function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open-btn");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbVp = document.getElementById("lb-viewport");
  const lbScale = document.getElementById("lb-scale");

  let zoom = 1, panX = 0, panY = 0, dragging = false, sx = 0, sy = 0, px0 = 0, py0 = 0;

  const applyTransform = () => {
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    lbScale.textContent = `${Math.round(zoom * 100)}%`;
  };

  const open = () => {
    if (!lbImg.src) lbImg.src = posterImg.src;
    zoom = 1; panX = 0; panY = 0;
    applyTransform();
    lb.hidden = false;
    document.getElementById("lb-close").focus();
  };

  const close = () => {
    lb.hidden = true;
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-zoom-in").addEventListener("click", () => { zoom = Math.min(3.5, +(zoom + 0.35).toFixed(2)); applyTransform(); });
  document.getElementById("lb-zoom-out").addEventListener("click", () => { zoom = Math.max(0.6, +(zoom - 0.35).toFixed(2)); applyTransform(); });
  document.getElementById("lb-reset").addEventListener("click", () => { zoom = 1; panX = 0; panY = 0; applyTransform(); });

  lbVp.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = Math.max(0.6, Math.min(3.5, +(zoom + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbVp.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX; sy = e.clientY; px0 = panX; py0 = panY;
    if (lbVp.setPointerCapture) { try { lbVp.setPointerCapture(e.pointerId); } catch {} }
  });
  lbVp.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    panX = px0 + (e.clientX - sx);
    panY = py0 + (e.clientY - sy);
    applyTransform();
  });
  lbVp.addEventListener("pointerup", () => { dragging = false; });
  lbVp.addEventListener("pointercancel", () => { dragging = false; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// ==================== 初始化 ====================
initHeroDrag();
initHeroControls();
syncHeroDOM();
heroLoop.draw();
initSec01Flow();
initSec02ContainingBlock();
initSec03Inset();
initSec04Stacking();
initSec05Timeline();
initSec06Decisions();
initSec07Quiz();
initPosterLightbox();
