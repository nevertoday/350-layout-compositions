// 110 渐变组织 · 主交互入口：开场活体梯度坡面 + 锚点/曲线/错阶直操 + 01–07 节交互 + 08 原海报灯箱

import { loop, pixelRatio } from "../../lib/stage.js";
import { rgbToCss, interpolateColor } from "./color.js";
import { createBrokenState, createPosterSolution, evaluate, clamp } from "./model.js";
import { drawMorphPolygon, initSec01, initSec02, initSec03, initSec04, initSec05, initSec06, initSec07 } from "./figures.js";

const state = createBrokenState();
let lastEval = null;
let selectedAnchor = "end"; // 键盘方向键微调的当前锚点：start | end
let dragAnchor = null;      // 正在画布中拖拽的锚点
let activeHover = null;

// ---------------- DOM 引用 ----------------
const canvas = document.getElementById("hero-canvas");
const rampTrack = document.getElementById("ramp-track");
const rampThumb = document.getElementById("ramp-thumb");
const rampPath = document.getElementById("ramp-path");
const rampReadout = document.getElementById("ramp-readout");
const compassSeal = document.getElementById("compass-seal");
const compassArrow = document.getElementById("compass-arrow");
const topScore = document.getElementById("top-score");
const mobileScore = document.getElementById("mobile-score");
const dockDiag = document.getElementById("dock-diag");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagNext = document.getElementById("diag-next");
const mSteps = document.getElementById("m-steps");
const mSize = document.getElementById("m-size");
const mSpan = document.getElementById("m-span");
const mChroma = document.getElementById("m-chroma");
const anchorHint = document.getElementById("anchor-hint");
const btnFixOrder = document.getElementById("btn-fix-order");
const railBars = [...document.querySelectorAll("#rail-step-demo .rsd-bar")];

const pillarEls = {
  transition: { li: document.getElementById("p-transition"), tag: document.getElementById("pt-transition") },
  layering: { li: document.getElementById("p-layering"), tag: document.getElementById("pt-layering") },
  direction: { li: document.getElementById("p-direction"), tag: document.getElementById("pt-direction") },
  change: { li: document.getElementById("p-change"), tag: document.getElementById("pt-change") },
};

const motifBtns = [...document.querySelectorAll("[data-motif]")];
const stepPresetBtns = [...document.querySelectorAll("[data-steps]")];
const depthBtns = [...document.querySelectorAll("[data-depth]")];
const colorBtns = [...document.querySelectorAll("[data-color]")];

// 文本去重写入（避免拖拽时每帧无谓触发 DOM mutation）
const setText = (el, val) => {
  if (el && el.textContent !== val) el.textContent = val;
};

function fitHeroCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(180, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// 绘制单枚几何图形（供原海报多排阵复刻：圆、方、三角、菱形、圆环）
function drawShape(ctx, kind, cx, cy, r, fillCss, strokeCss) {
  ctx.save();
  ctx.beginPath();
  if (kind === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fillCss;
    ctx.fill();
  } else if (kind === "ring") {
    ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
    ctx.strokeStyle = strokeCss || fillCss;
    ctx.lineWidth = Math.max(2, r * 0.28);
    ctx.stroke();
  } else if (kind === "square") {
    const s = r * 1.66;
    ctx.rect(cx - s / 2, cy - s / 2, s, s);
    ctx.fillStyle = fillCss;
    ctx.fill();
  } else if (kind === "diamond") {
    ctx.moveTo(cx, cy - r * 1.18);
    ctx.lineTo(cx + r * 1.18, cy);
    ctx.lineTo(cx, cy + r * 1.18);
    ctx.lineTo(cx - r * 1.18, cy);
    ctx.closePath();
    ctx.fillStyle = fillCss;
    ctx.fill();
  } else if (kind === "triangle") {
    const h = r * 1.25;
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + h * 0.96, cy + h * 0.72);
    ctx.lineTo(cx - h * 0.96, cy + h * 0.72);
    ctx.closePath();
    ctx.fillStyle = fillCss;
    ctx.fill();
  }
  ctx.restore();
}

// 绘制 110 原海报同款外缘导向细长箭
function drawGuideArrow(ctx, x1, y1, x2, y2, color, width = 2.2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 11;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2 - head * Math.cos(angle - 0.45), y2 - head * Math.sin(angle - 0.45));
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle + 0.45), y2 - head * Math.sin(angle + 0.45));
  ctx.stroke();
  ctx.restore();
}

// ---------------- 同步全部 DOM 读数与书脊指标 ----------------
function syncUI(ev) {
  // 顶眉与手机评分
  const scoreTxt = ev.score === 4 ? "4 / 4 已成坡" : `${ev.score} / 4 待调坡`;
  setText(topScore, scoreTxt);
  topScore.dataset.state = ev.score === 4 ? "ok" : "err";
  setText(mobileScore, `${ev.score} / 4`);
  mobileScore.dataset.state = ev.score === 4 ? "ok" : "err";

  // 右上原海报黑圆白箭罗盘同步旋转
  compassSeal.dataset.state = ev.pillars.direction.ok ? "ok" : "err";
  const rotDeg = Math.round(ev.angleDeg);
  const tr = `rotate(${rotDeg} 18 18)`;
  if (compassArrow.getAttribute("transform") !== tr) compassArrow.setAttribute("transform", tr);

  // 左侧书脊 4 项关键词实况同步
  for (const key of ["transition", "layering", "direction", "change"]) {
    const p = ev.pillars[key];
    pillarEls[key].li.dataset.ok = String(p.ok);
    setText(pillarEls[key].tag, p.tag);
  }

  // 左侧大标旁的 4 枚微缩渐变阶标实时随当前色域与跨比联动
  for (let i = 0; i < railBars.length; i++) {
    const u = i / (railBars.length - 1);
    const eased = u ** ev.curveExp;
    const rgb = interpolateColor(ev.palette.startHex, ev.palette.endHex, eased, ev.palette.space);
    railBars[i].style.backgroundColor = rgbToCss(rgb, 0.35 + 0.65 * eased);
  }

  // 变化率弧轨（data-perf-drag）滑钮与实时幂函数曲线
  const expPct = clamp((ev.curveExp - 0.3) / (3.2 - 0.3), 0, 1);
  rampThumb.style.left = `${(4 + expPct * 92).toFixed(1)}%`;
  const curveOk = ev.curveExp >= 1.05 && ev.curveExp <= 2.15;
  rampThumb.dataset.ok = String(curveOk);
  rampReadout.dataset.ok = String(curveOk);
  const curveWord = ev.curveExp < 1.05 ? "前段断崖" : ev.curveExp > 2.15 ? "尾端爆冲" : "等比顺滑";
  setText(rampReadout, `p = ${ev.curveExp.toFixed(2)} · ${curveWord}`);
  rampTrack.setAttribute("aria-valuenow", ev.curveExp.toFixed(2));

  // 画实时幂曲线 y = x^p 在 240×44 轨迹窗里
  let d = "";
  for (let k = 0; k <= 24; k++) {
    const u = k / 24;
    const y = 39 - u ** ev.curveExp * 33;
    const x = 4 + u * 232;
    d += (k === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  if (rampPath.getAttribute("d") !== d) rampPath.setAttribute("d", d);

  // 白话诊单与 4 项单真源指标
  dockDiag.dataset.kind = ev.diag.kind;
  setText(diagBadge, ev.diag.badge);
  setText(diagTitle, ev.diag.title);
  setText(diagWhy, ev.diag.why);
  setText(diagNext, ev.diag.next);
  setText(mSteps, `${ev.steps} 阶`);
  setText(mSize, `${ev.sizeRatio.toFixed(1)}×`);
  setText(mSpan, `${ev.spanPct}%`);
  setText(mChroma, `${ev.chromaPct}%`);

  // 按钮激活态
  motifBtns.forEach((b) => {
    const on = b.dataset.motif === state.motif;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  stepPresetBtns.forEach((b) => b.classList.toggle("is-on", Number(b.dataset.steps) === state.steps));
  depthBtns.forEach((b) => {
    const on =
      (b.dataset.depth === "flat" && state.sizeRatio < 2.0) ||
      (b.dataset.depth === "balanced" && state.sizeRatio >= 2.0 && state.sizeRatio <= 5.8) ||
      (b.dataset.depth === "extreme" && state.sizeRatio > 5.8);
    b.classList.toggle("is-on", on);
  });
  colorBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.color === state.colorMode));

  setText(btnFixOrder, state.disordered ? "理顺错序（有倒挂）" : "顺序已单调");
  btnFixOrder.classList.toggle("is-clean", !state.disordered);
  setText(anchorHint, `方向键微调${selectedAnchor === "end" ? "终点锚 ◉" : "起点锚 ○"} · Tab 切换锚点`);
}

// ---------------- 绘制活体梯度坡面 Canvas ----------------
function drawHero(t, _dt, { still }) {
  const { ctx, w, h } = fitHeroCanvas();
  const ev = evaluate(state, w, h);
  lastEval = ev;
  syncUI(ev);

  ctx.clearRect(0, 0, w, h);

  // 开场 0.65 秒柔和逐阶展开（保证第 0.05s 就完整可见，0.65s 定格于完整状态，reduced-motion 直接 = 1）
  const intro = still ? 1 : Math.min(1, 0.25 + t * 1.25);

  // 1. 淡淡的几何构造网格线（低对比纯辅助线）
  ctx.strokeStyle = "rgba(20, 18, 24, 0.07)";
  ctx.lineWidth = 1;
  const gx = Math.max(48, Math.round(w / 10));
  for (let x = gx; x < w; x += gx) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  const gy = Math.max(44, Math.round(h / 6));
  for (let y = gy; y < h; y += gy) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 2. 绘制贯穿起止锚的细虚渐变主轴
  ctx.save();
  ctx.strokeStyle = ev.pillars.direction.ok ? "rgba(20, 18, 24, 0.34)" : "rgba(181, 38, 26, 0.52)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(ev.sx, ev.sy);
  ctx.lineTo(ev.ex, ev.ey);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. 逐阶绘制渐进几何阵列（忠实化用 110 原海报的多层几何扇阵）
  const pulsePos = still ? -1 : (t * 0.42) % 1.35; // 沿轴滑过的柔和方向微光脉冲
  const posterMidShapes = ["circle", "square", "triangle", "diamond", "ring", "circle", "square"];

  for (const it of ev.items) {
    const appear = clamp((intro - it.u * 0.22) / 0.78, 0.25, 1);
    const pulseBoost = pulsePos >= 0 ? Math.max(0, 1 - Math.abs(it.posT - pulsePos) * 5.2) : 0;
    const r = it.radius * appear * (1 + pulseBoost * 0.08);
    const fillCss = rgbToCss(it.rgb, clamp(it.alpha + pulseBoost * 0.12, 0.15, 1));

    if (state.motif === "poster") {
      // 上翼圆点列、中轴主几何变奏列、下翼方块/菱形列（三排扇形铺展，保持清晰呼吸缝不糊叠）
      const spread = Math.max(r * 1.92 + 6, it.fanSpread * appear);
      const topX = it.cx + ev.px * spread;
      const topY = it.cy + ev.py * spread;
      const botX = it.cx - ev.px * spread;
      const botY = it.cy - ev.py * spread;

      const subAlpha = clamp(it.alpha * 0.88, 0.14, 0.96);
      const topCss = rgbToCss(it.rgb, subAlpha);
      const botCss = rgbToCss(it.rgb, clamp(it.alpha * 0.94, 0.16, 0.98));

      // 上翼：原海报同款递增圆点
      drawShape(ctx, "circle", topX, topY, r * 0.68, topCss);
      // 中轴：随阶序呈现原海报多形体语言（圆 / 三角 / 菱形 / 圆环 / 实圆）
      const midKind = posterMidShapes[it.index % posterMidShapes.length];
      drawShape(ctx, midKind, it.cx, it.cy, r, fillCss, fillCss);
      // 下翼：原海报底排递增方块
      drawShape(ctx, "square", botX, botY, r * 0.64, botCss);
    } else if (state.motif === "circles") {
      // 纯圆纵深列 + 两侧微缩伴圆
      const spread = Math.max(r * 1.85 + 6, it.fanSpread * 0.86 * appear);
      drawShape(ctx, "circle", it.cx + ev.px * spread, it.cy + ev.py * spread, r * 0.54, rgbToCss(it.rgb, it.alpha * 0.68));
      drawShape(ctx, "circle", it.cx, it.cy, r * 1.08, fillCss);
      drawShape(ctx, "circle", it.cx - ev.px * spread, it.cy - ev.py * spread, r * 0.54, rgbToCss(it.rgb, it.alpha * 0.68));
    } else {
      // 形态演进阵：方 -> 圆 -> 三角平滑形变
      ctx.save();
      drawMorphPolygon(ctx, it.cx, it.cy, r * 1.18, it.val, it.val * 0.45);
      ctx.fillStyle = fillCss;
      ctx.fill();
      ctx.restore();
    }

    // 错序阶梯：醒目赤红虚环 + 可点击提示标
    if (it.isDisorderedNode) {
      ctx.save();
      ctx.strokeStyle = "#B5261A";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(it.cx, it.cy, Math.max(22, r + 10), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#B5261A";
      const pillW = 72;
      const pillH = 22;
      const px = clamp(it.cx - pillW / 2, 8, w - pillW - 8);
      const py = clamp(it.cy - Math.max(22, r + 10) - 26, 8, h - pillH - 8);
      ctx.fillRect(px, py, pillW, pillH);
      ctx.fillStyle = "#FAF6EE";
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("点此理顺", px + pillW / 2, py + pillH / 2);
      ctx.restore();
    }
  }

  // 4. 标注相邻重叠加碰警示环
  if (ev.overlapPairs.length > 0) {
    ctx.save();
    ctx.strokeStyle = "#B5261A";
    ctx.lineWidth = 2;
    for (const [i, j] of ev.overlapPairs.slice(0, 6)) {
      const a = ev.items[i];
      const b = ev.items[j];
      ctx.beginPath();
      ctx.arc((a.cx + b.cx) / 2, (a.cy + b.cy) / 2, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. 110 原海报标志性外缘导向长白箭（随渐变轴方向同步延伸在末端外侧）
  if (ev.axisLen > 30) {
    const offset = Math.min(w, h) * 0.16;
    const arrowLen = Math.min(96, ev.axisLen * 0.32);
    const ax2 = clamp(ev.ex - ev.px * offset + ev.ux * 22, 22, w - 18);
    const ay2 = clamp(ev.ey - ev.py * offset + ev.uy * 22, 22, h - 18);
    const ax1 = clamp(ax2 - ev.ux * arrowLen, 16, w - 16);
    const ay1 = clamp(ay2 - ev.uy * arrowLen, 16, h - 16);
    drawGuideArrow(ctx, ax1, ay1, ax2, ay2, ev.pillars.direction.ok ? "#FAF6EE" : "#B5261A", 2.8);
  }

  // 6. 中段彩度实时色标浮签（帮助直观看见 sRGB 发灰 vs Oklch 透亮）
  const midItem = ev.items[Math.floor(ev.items.length / 2)];
  if (midItem && w >= 480) {
    const boxW = 176;
    const bx = w - boxW - 12;
    const by = 12;
    ctx.save();
    ctx.fillStyle = "rgba(250, 246, 238, 0.94)";
    ctx.strokeStyle = "rgba(20, 18, 24, 0.22)";
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, boxW, 44);
    ctx.strokeRect(bx, by, boxW, 44);

    ctx.fillStyle = rgbToCss(midItem.rgb, 1);
    ctx.fillRect(bx + 8, by + 9, 26, 26);
    ctx.strokeStyle = "rgba(20, 18, 24, 0.25)";
    ctx.strokeRect(bx + 8, by + 9, 26, 26);

    ctx.fillStyle = "#141218";
    ctx.font = '700 11px "Noto Sans SC", "IBM Plex Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`中段实采 · ${ev.palette.label}`, bx + 42, by + 8);
    ctx.fillStyle = ev.pillars.change.ok ? "#116A58" : "#B5261A";
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    ctx.fillText(`彩度留存 ${ev.chromaPct}%`, bx + 42, by + 24);
    ctx.restore();
  }

  // 7. 可直接拖拽的起点轻锚（○）与终点重锚（◉）
  const drawAnchor = (x, y, kind, label) => {
    const isSel = selectedAnchor === kind;
    const isHot = dragAnchor === kind || activeHover === kind;
    ctx.save();
    // 外柔光环
    ctx.beginPath();
    ctx.arc(x, y, isHot ? 18 : 14, 0, Math.PI * 2);
    ctx.fillStyle = kind === "start" ? "rgba(86, 48, 143, 0.16)" : "rgba(245, 91, 30, 0.22)";
    ctx.fill();

    // 锚芯
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = kind === "start" ? "#FAF6EE" : "#141218";
    ctx.fill();
    ctx.strokeStyle = isSel ? "#141218" : "#56308F";
    ctx.lineWidth = isSel ? 2.6 : 2;
    ctx.stroke();

    if (kind === "end") {
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FAF6EE";
      ctx.fill();
    }

    // 锚点中文短标
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(label).width + 12;
    const lx = clamp(x - tw / 2, 6, w - tw - 6);
    const ly = kind === "start" ? clamp(y - 32, 6, h - 26) : clamp(y + 16, 6, h - 24);
    ctx.fillStyle = "rgba(250, 246, 238, 0.94)";
    ctx.fillRect(lx, ly, tw, 20);
    ctx.strokeStyle = "rgba(20, 18, 24, 0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, tw, 20);
    ctx.fillStyle = "#141218";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + tw / 2, ly + 10);
    ctx.restore();
  };

  drawAnchor(ev.sx, ev.sy, "start", "拖起端 ○");
  drawAnchor(ev.ex, ev.ey, "end", "拖终端 ◉");
}

const heroLoop = loop(canvas, drawHero);
const redraw = () => heroLoop.draw();

// ---------------- 画布交互：直拖起/终锚点 + 直点错序阶归位 + 方向键微调 ----------------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
}

function hitTestCanvas(px, py) {
  if (!lastEval) return null;
  if (Math.hypot(px - lastEval.ex, py - lastEval.ey) <= 28) return "end";
  if (Math.hypot(px - lastEval.sx, py - lastEval.sy) <= 28) return "start";
  if (state.disordered && lastEval.disorderedIdx >= 0) {
    const bad = lastEval.items[lastEval.disorderedIdx];
    if (bad && Math.hypot(px - bad.cx, py - bad.cy) <= Math.max(30, bad.radius + 16)) return "disordered";
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  const pt = canvasPoint(e);
  const hit = hitTestCanvas(pt.x, pt.y);
  if (hit === "disordered") {
    state.disordered = false;
    redraw();
    return;
  }
  if (hit === "start" || hit === "end") {
    dragAnchor = hit;
    selectedAnchor = hit;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    redraw();
  }
});

canvas.addEventListener("pointermove", (e) => {
  const pt = canvasPoint(e);
  if (dragAnchor) {
    const nx = clamp(pt.x / pt.w, 0.07, 0.93);
    const ny = clamp(pt.y / pt.h, 0.09, 0.91);
    state[dragAnchor] = { x: nx, y: ny };
    redraw();
  } else {
    const hit = hitTestCanvas(pt.x, pt.y);
    if (hit !== activeHover) {
      activeHover = hit;
      canvas.style.cursor = hit === "disordered" ? "pointer" : hit ? "grab" : "default";
      redraw();
    }
  }
});

const stopCanvasDrag = (e) => {
  if (!dragAnchor) return;
  dragAnchor = null;
  canvas.classList.remove("is-dragging");
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
  redraw();
};
canvas.addEventListener("pointerup", stopCanvasDrag);
canvas.addEventListener("pointercancel", stopCanvasDrag);

canvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.05 : 0.02;
  if (e.key === "Tab" && !e.ctrlKey && !e.metaKey) {
    // 仅当在 start 时切到 end 并阻止跳出，end 时正常交回焦点流
    if (selectedAnchor === "start") {
      e.preventDefault();
      selectedAnchor = "end";
      redraw();
    }
    return;
  }
  if (e.key === "ArrowLeft") { state[selectedAnchor].x = clamp(state[selectedAnchor].x - step, 0.07, 0.93); e.preventDefault(); redraw(); }
  else if (e.key === "ArrowRight") { state[selectedAnchor].x = clamp(state[selectedAnchor].x + step, 0.07, 0.93); e.preventDefault(); redraw(); }
  else if (e.key === "ArrowUp") { state[selectedAnchor].y = clamp(state[selectedAnchor].y - step, 0.09, 0.91); e.preventDefault(); redraw(); }
  else if (e.key === "ArrowDown") { state[selectedAnchor].y = clamp(state[selectedAnchor].y + step, 0.09, 0.91); e.preventDefault(); redraw(); }
  else if ((e.key === "Enter" || e.key === " ") && state.disordered) { state.disordered = false; e.preventDefault(); redraw(); }
});

// ---------------- 底沿变化率弧轨交互（data-perf-drag，支持鼠标、触屏与键盘） ----------------
let draggingRamp = false;

function updateRampFromClientX(clientX) {
  const r = rampTrack.getBoundingClientRect();
  const frac = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
  let next = 0.3 + frac * (3.2 - 0.3);
  // 靠近原海报自然等比参考值 1.48 时轻轻吸附
  if (Math.abs(next - 1.48) < 0.04) next = 1.48;
  state.curveExp = +next.toFixed(2);
  redraw();
}

rampTrack.addEventListener("pointerdown", (e) => {
  draggingRamp = true;
  rampTrack.setPointerCapture(e.pointerId);
  updateRampFromClientX(e.clientX);
  e.preventDefault();
});
rampTrack.addEventListener("pointermove", (e) => {
  if (!draggingRamp) return;
  updateRampFromClientX(e.clientX);
  e.preventDefault();
});
const stopRamp = (e) => {
  if (!draggingRamp) return;
  draggingRamp = false;
  try { rampTrack.releasePointerCapture(e.pointerId); } catch {}
};
rampTrack.addEventListener("pointerup", stopRamp);
rampTrack.addEventListener("pointercancel", stopRamp);

// 兼容 CDP 原始 touch 事件（确保 perf.mjs 派发 touchMove 时百分百连续重绘）
rampTrack.addEventListener("touchstart", (e) => {
  if (e.touches[0]) {
    draggingRamp = true;
    updateRampFromClientX(e.touches[0].clientX);
  }
}, { passive: true });
rampTrack.addEventListener("touchmove", (e) => {
  if (e.touches[0]) updateRampFromClientX(e.touches[0].clientX);
}, { passive: true });
rampTrack.addEventListener("touchend", () => { draggingRamp = false; });

rampTrack.addEventListener("keydown", (e) => {
  const d = e.shiftKey ? 0.2 : 0.08;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    state.curveExp = +clamp(state.curveExp - d, 0.3, 3.2).toFixed(2);
    e.preventDefault();
    redraw();
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    state.curveExp = +clamp(state.curveExp + d, 0.3, 3.2).toFixed(2);
    e.preventDefault();
    redraw();
  }
});

// ---------------- 控件钮事件 ----------------
motifBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.motif = b.dataset.motif;
    redraw();
  })
);
stepPresetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.steps = Number(b.dataset.steps);
    redraw();
  })
);
document.getElementById("step-dec").addEventListener("click", () => {
  state.steps = clamp(state.steps - 1, 3, 14);
  redraw();
});
document.getElementById("step-inc").addEventListener("click", () => {
  state.steps = clamp(state.steps + 1, 3, 14);
  redraw();
});
depthBtns.forEach((b) =>
  b.addEventListener("click", () => {
    if (b.dataset.depth === "flat") { state.sizeRatio = 1.1; state.alphaSpan = 0.06; }
    else if (b.dataset.depth === "balanced") { state.sizeRatio = 3.4; state.alphaSpan = 0.64; }
    else { state.sizeRatio = 8.0; state.alphaSpan = 0.76; }
    redraw();
  })
);
colorBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.colorMode = b.dataset.color;
    redraw();
  })
);
btnFixOrder.addEventListener("click", () => {
  state.disordered = !state.disordered;
  redraw();
});
document.getElementById("btn-solution").addEventListener("click", () => {
  Object.assign(state, createPosterSolution());
  redraw();
});
document.getElementById("btn-reset").addEventListener("click", () => {
  Object.assign(state, createBrokenState());
  redraw();
});

window.addEventListener("resize", redraw);

// ---------------- 正文 01–07 节交互挂载 ----------------
initSec01(document.getElementById("sec-01"));
initSec02(document.getElementById("sec-02"));
initSec03(document.getElementById("sec-03"));
initSec04(document.getElementById("sec-04"));
initSec05(document.getElementById("sec-05"));
initSec06(document.getElementById("sec-06"));
initSec07(document.getElementById("sec-07"));

// ---------------- 08 节原海报灯箱（复用 #poster.src，缩放、拖动、Esc 关） ----------------
(function initLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const vp = document.getElementById("lb-viewport");
  const lbImg = document.getElementById("lb-img");
  const scaleEl = document.getElementById("lb-scale");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleEl.textContent = `${Math.round(scale * 100)}%`;
  }
  function openBox() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    document.getElementById("lb-close").focus();
  }
  function closeBox() {
    box.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", openBox);
  document.getElementById("lb-close").addEventListener("click", closeBox);
  document.getElementById("lb-zoom-in").addEventListener("click", () => { scale = clamp(scale + 0.35, 0.7, 3.5); applyTransform(); });
  document.getElementById("lb-zoom-out").addEventListener("click", () => { scale = clamp(scale - 0.35, 0.7, 3.5); applyTransform(); });
  document.getElementById("lb-reset").addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 3.5);
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp && scale <= 1.01) { closeBox(); return; }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    vp.classList.add("is-panning");
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const stopPan = (e) => {
    if (!panning) return;
    panning = false;
    vp.classList.remove("is-panning");
    try { vp.releasePointerCapture(e.pointerId); } catch {}
  };
  vp.addEventListener("pointerup", stopPan);
  vp.addEventListener("pointercancel", stopPan);

  document.addEventListener("keydown", (e) => {
    if (!box.hidden && e.key === "Escape") closeBox();
  });
})();

redraw();
