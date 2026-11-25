import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  EMPIRICAL,
  IDEAL_ORDER,
  LAYER_META,
  STAGE,
  clamp,
  createInitialState,
  evaluate,
  getLayerVisualStyle,
} from "./model.js";

// =========================================================================
// 1. 开场主角玩具：四层纸雕叠层景箱 × Z1–Z4 层片轨 × 咬合游标 × 38° 侧剖
// =========================================================================
const state = createInitialState();
let selectedSlot = -1; // 点击两槽互换时的选中槽位
let introProgress = reducedMotion.matches ? 1 : 0;
let currentTilt = 0;   // 0 = 正面构图；1 = 38° 侧剖透视
let hoverLayerId = null;
let dragLayer = null;  // { id, startClientX, startDx, scaleX }
let dirty = true;

const stageEl = document.getElementById("diorama-stage");
const canvas = document.getElementById("diorama-canvas");
const ctx = canvas.getContext("2d");

const scoreBadge = document.getElementById("score-badge");
const diagCard = document.getElementById("diag-card");
const diagTag = document.getElementById("diag-tag");
const diagTitle = document.getElementById("diag-title");
const diagReason = document.getElementById("diag-reason");
const mOverlap = document.getElementById("m-overlap");
const mVisible = document.getElementById("m-visible");
const mTj = document.getElementById("m-tj");
const zRack = document.getElementById("z-rack");
const rackHint = document.getElementById("rack-hint");
const overlapTrack = document.getElementById("overlap-track");
const overlapFill = document.getElementById("overlap-fill");
const overlapThumb = document.getElementById("overlap-thumb");
const overlapRead = document.getElementById("overlap-read");
const toneSeg = document.getElementById("tone-seg");
const btnCutaway = document.getElementById("btn-cutaway");
const btnReset = document.getElementById("btn-reset");
const sealEls = [...document.querySelectorAll(".poster-seals .seal")];

const LAYER_SWATCH = {
  sky: "#F4E4D8",
  ridge: "#BF9087",
  gate: "#3A2827",
  disc: "#BB664E",
};

// 同步将 1000×455 逻辑坐标映射到当前画布（保持等比居中，不拉扁！）
function getStageViewport(cw, ch) {
  const padX = cw * 0.025;
  const padY = ch * 0.035;
  const availW = Math.max(10, cw - padX * 2);
  const availH = Math.max(10, ch - padY * 2);
  const scale = Math.min(availW / STAGE.w, availH / STAGE.h);
  const ox = (cw - STAGE.w * scale) / 2;
  const oy = (ch - STAGE.h * scale) / 2;
  return { scale, ox, oy };
}

// 3D 轻斜剖投影：tilt=0 为 0° 正面平面；tilt=1 为 38° 景箱侧剖
// 每层纸片沿 Z 槽位（0..3）在深度轴上均匀拉开，并做水平压缩与斜向错位
function projectLayerTransform(slot, tilt, vp, introP) {
  const zIndex = slot - 1.5; // -1.5, -0.5, +0.5, +1.5
  const cosT = 1 - tilt * 0.24; // 约 cos(38°) 视觉收窄
  const skewY = tilt * 0.14;    // 轻微透视斜度
  const depthDx = zIndex * tilt * 72 * vp.scale;
  const depthDy = zIndex * tilt * 24 * vp.scale;
  // 开场柔和纸片落位动画（即使在 0.9s 截图也已落定 >92%）
  const ease = 1 - Math.pow(1 - clamp(introP, 0, 1), 3);
  const dropY = (1 - ease) * (18 + slot * 9) * vp.scale;
  return { cosT, skewY, depthDx, depthDy: depthDy + dropY };
}

// 在给定本地坐标系 (0..r.w, 0..r.h) 里绘制四片忠实于 059 原海报的剪纸艺术片
function drawPaperCutout(c, id, r, style, tilt) {
  const { w, h } = r;
  const pal = style.palette;

  c.save();
  // 纸片浮起软影（同频平贴模式下为 0）
  if (style.shadowAlpha > 0.01) {
    c.shadowColor = `rgba(34, 15, 16, ${style.shadowAlpha.toFixed(3)})`;
    c.shadowBlur = style.shadowBlur * (1 + tilt * 0.5);
    c.shadowOffsetX = style.shadowOffsetX - tilt * 8;
    c.shadowOffsetY = style.shadowOffsetY + tilt * 6;
  }

  if (id === "sky") {
    // 远山暖日：暖宣奶白纸 + 暖陶太阳 + 柔和玫瑰雾远山
    c.fillStyle = pal.skyBg;
    c.fillRect(0, 0, w, h);
    c.shadowColor = "transparent";

    // 微点阵装饰（原海报纸卡右上/右中特征）
    c.fillStyle = "rgba(58, 40, 39, 0.22)";
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        c.beginPath();
        c.arc(w - 38 + gx * 9, 26 + gy * 9, 1.3, 0, Math.PI * 2);
        c.fill();
      }
    }

    // 暖陶太阳
    c.fillStyle = pal.skySun;
    c.beginPath();
    c.arc(w * 0.34, h * 0.28, w * 0.135, 0, Math.PI * 2);
    c.fill();

    // 远山剪影（柔雾渐变）
    const grad = c.createLinearGradient(0, h * 0.52, 0, h);
    grad.addColorStop(0, pal.skyHill);
    grad.addColorStop(1, pal.ridgeHillFar);
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, h * 0.72);
    c.quadraticCurveTo(w * 0.18, h * 0.52, w * 0.36, h * 0.68);
    c.quadraticCurveTo(w * 0.58, h * 0.48, w * 0.78, h * 0.66);
    c.quadraticCurveTo(w * 0.90, h * 0.58, w, h * 0.64);
    c.lineTo(w, h);
    c.closePath();
    c.fill();

    // 纸边细高光
    c.strokeStyle = "rgba(255, 250, 244, 0.55)";
    c.lineWidth = 1.2;
    c.strokeRect(0.6, 0.6, w - 1.2, h - 1.2);
  } else if (id === "ridge") {
    // 叠扇中峰：右侧同心奶白/玫瑰半圆扇 + 双层玫瑰起伏山脊
    // 先绘右侧双层半圆叠扇（对应原海报右侧叠扇）
    c.fillStyle = pal.ridgeFanOuter;
    c.beginPath();
    c.arc(w * 0.68, h * 0.45, w * 0.32, -Math.PI / 2, Math.PI / 2);
    c.closePath();
    c.fill();
    c.shadowColor = "transparent";

    c.fillStyle = pal.ridgeFanInner;
    c.beginPath();
    c.arc(w * 0.68, h * 0.51, w * 0.21, -Math.PI / 2, Math.PI / 2);
    c.closePath();
    c.fill();

    // 远中脊
    c.fillStyle = pal.ridgeHillFar;
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, h * 0.56);
    c.quadraticCurveTo(w * 0.22, h * 0.30, w * 0.44, h * 0.46);
    c.quadraticCurveTo(w * 0.64, h * 0.24, w * 0.88, h * 0.52);
    c.lineTo(w * 0.94, h);
    c.closePath();
    c.fill();

    // 近中脊（更实）
    c.fillStyle = pal.ridgeHillNear;
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, h * 0.72);
    c.quadraticCurveTo(w * 0.28, h * 0.48, w * 0.54, h * 0.68);
    c.quadraticCurveTo(w * 0.76, h * 0.52, w * 0.94, h * 0.70);
    c.lineTo(w * 0.94, h);
    c.closePath();
    c.fill();
  } else if (id === "gate") {
    // 深咖拱门：左侧半透玫瑰雾片 + 主深焙咖斜顶建筑竖板
    c.fillStyle = pal.gateVellum;
    c.fillRect(0, h * 0.14, w * 0.28, h * 0.86);

    c.fillStyle = pal.gateBody;
    c.beginPath();
    c.moveTo(w * 0.18, h * 0.08);
    c.lineTo(w, h * 0.01);
    c.lineTo(w, h);
    c.lineTo(w * 0.18, h);
    c.closePath();
    c.fill();
    c.shadowColor = "transparent";

    // 门板左侧细亮边（体现建筑纸片厚度）
    c.strokeStyle = "rgba(244, 228, 216, 0.34)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(w * 0.185, h * 0.08);
    c.lineTo(w * 0.185, h);
    c.stroke();
  } else if (id === "disc") {
    // 焦糖主盘：前景大圆盘 + 右下叠压奶白小型应用角卡
    const cx = w * 0.48, cy = h * 0.44, rad = w * 0.45;
    const dg = c.createRadialGradient(cx - rad * 0.25, cy - rad * 0.25, rad * 0.1, cx, cy, rad);
    dg.addColorStop(0, style.contrastBoost < 0 ? pal.discFill : "#DA7D62");
    dg.addColorStop(1, pal.discFill);
    c.fillStyle = dg;
    c.beginPath();
    c.arc(cx, cy, rad, 0, Math.PI * 2);
    c.fill();

    // 叠在圆盘右下角的奶白小纸卡
    c.fillStyle = pal.cardBg;
    c.fillRect(w * 0.34, h * 0.56, w * 0.66, h * 0.44);
    c.shadowColor = "transparent";

    // 小卡上的暖橘小标条与两条示意细线（纯几何无缩微文字）
    c.fillStyle = pal.discFill;
    c.fillRect(w * 0.44, h * 0.66, w * 0.28, 10);
    c.fillStyle = "rgba(58, 40, 39, 0.58)";
    c.fillRect(w * 0.44, h * 0.78, w * 0.44, 4);
    c.fillStyle = "rgba(58, 40, 39, 0.32)";
    c.fillRect(w * 0.44, h * 0.86, w * 0.34, 3.5);
  }

  // 侧剖时给每张纸片右侧画出 3px 白色纸芯厚度边
  if (tilt > 0.08) {
    c.shadowColor = "transparent";
    c.strokeStyle = `rgba(255, 245, 236, ${(0.45 * tilt).toFixed(2)})`;
    c.lineWidth = 2.2;
    c.strokeRect(0, 0, w, h);
  }
  c.restore();
}

function drawDiorama(ev) {
  const rect = stageEl.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const dpr = pixelRatio(2);
  const cw = Math.round(rect.width * dpr);
  const ch = Math.round(rect.height * dpr);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  const vp = getStageViewport(W, H);
  const tilt = currentTilt;

  // 背景景箱细框与地平标尺线
  ctx.strokeStyle = "rgba(244, 228, 216, 0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(vp.ox + 4, vp.oy + 4, STAGE.w * vp.scale - 8, STAGE.h * vp.scale - 8);

  // 侧剖时绘出底面 Z1→Z4 景箱轨道虚线，让纸片浮在实体槽轨上
  if (tilt > 0.05) {
    ctx.save();
    ctx.strokeStyle = `rgba(244, 228, 216, ${(0.34 * tilt).toFixed(2)})`;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.2;
    for (let slot = 0; slot < 4; slot++) {
      const tr = projectLayerTransform(slot, tilt, vp, 1);
      const yBase = vp.oy + 416 * vp.scale + tr.depthDy;
      ctx.beginPath();
      ctx.moveTo(vp.ox + 50 * vp.scale + tr.depthDx, yBase);
      ctx.lineTo(vp.ox + 950 * vp.scale + tr.depthDx, yBase);
      ctx.stroke();
      ctx.fillStyle = `rgba(242, 173, 145, ${(0.88 * tilt).toFixed(2)})`;
      ctx.font = `500 11px "DM Mono", monospace`;
      ctx.fillText(`Z${slot + 1}`, vp.ox + 20 * vp.scale + tr.depthDx, yBase + 4);
    }
    ctx.restore();
  }

  // 按 Z1 → Z4 从后向前绘出四片剪纸
  for (const r of ev.rects) {
    const tr = projectLayerTransform(r.slot, tilt, vp, introProgress);
    const style = getLayerVisualStyle(r.id, r.slot, state.toneMode);
    const screenX = vp.ox + (r.x - STAGE.w / 2) * vp.scale * tr.cosT + (STAGE.w / 2) * vp.scale + tr.depthDx;
    const screenY = vp.oy + r.y * vp.scale + tr.depthDy;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.transform(vp.scale * tr.cosT, tr.skewY * vp.scale, 0, vp.scale, 0, 0);
    drawPaperCutout(ctx, r.id, r, style, tilt);

    // 悬停或正在拖动的层给一圈轻巧暖白描边提示可拖
    if (hoverLayerId === r.id || dragLayer?.id === r.id) {
      ctx.strokeStyle = "#FFF7EE";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-2, -2, r.w + 4, r.h + 4);
      ctx.setLineDash([]);
    }

    // 纸片顶沿小型 Z 槽号角标（避开下方切边提示）
    const tagText = `Z${r.slot + 1} ${LAYER_META[r.id].short}`;
    const tagW = 72;
    const tagH = 24;
    const tagX = r.id === "disc" ? r.w * 0.14 : r.id === "ridge" ? r.w * 0.16 : 8;
    const tagY = r.id === "ridge" ? r.h * 0.24 : 8;
    ctx.fillStyle = "rgba(38, 24, 23, 0.88)";
    ctx.fillRect(tagX, tagY, tagW, tagH);
    ctx.fillStyle = "#F4E4D8";
    ctx.font = `500 13px "DM Mono", "Noto Sans SC", sans-serif`;
    ctx.fillText(tagText, tagX + 7, tagY + 16);

    ctx.restore();
  }

  // 在正面视图（tilt < 0.25）下叠加真实算出的 T 形交点（绿/金）或切边警报（暖红虚线）
  if (tilt < 0.25) {
    const markerAlpha = 1 - tilt * 4;
    const uiScale = clamp(vp.scale, 0.56, 1.0);
    ctx.save();
    ctx.globalAlpha = markerAlpha;

    for (const tj of ev.tJunctions) {
      const px = vp.ox + tj.x * vp.scale;
      const py = vp.oy + tj.y * vp.scale;
      const rad = 6.5 * uiScale;
      ctx.fillStyle = ev.passCount === 4 ? "#A6DFB4" : "#F5C78E";
      ctx.strokeStyle = "#261817";
      ctx.lineWidth = 1.8 * uiScale;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 3.2 * uiScale, py - 1.8 * uiScale);
      ctx.lineTo(px + 3.2 * uiScale, py - 1.8 * uiScale);
      ctx.moveTo(px, py - 1.8 * uiScale);
      ctx.lineTo(px, py + 3.2 * uiScale);
      ctx.stroke();
    }

    for (const tp of ev.tangentPairs) {
      const px = vp.ox + tp.x * vp.scale;
      const py = vp.oy + (tp.y + 42) * vp.scale;
      const bw = 40 * uiScale;
      const bh = 20 * uiScale;
      ctx.strokeStyle = "#FFF4EA";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py - 58 * vp.scale);
      ctx.lineTo(px, py + 44 * vp.scale);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#261817";
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = "#F6A28B";
      ctx.font = `700 ${Math.max(10, Math.round(11 * uiScale))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("切边", px, py + 3.8 * uiScale);
      ctx.textAlign = "start";
    }
    ctx.restore();
  }

  ctx.restore();
}

// 渲染 Z1–Z4 层片插槽 UI 与全部实时读数
function syncUI(ev) {
  // 1. 顶部 4 枚原海报圆徽
  for (const el of sealEls) {
    const key = el.dataset.check;
    const pass = !!ev.checks[key];
    el.dataset.pass = String(pass);
    const st = el.querySelector(".seal-state");
    if (st) st.textContent = pass ? "成立 ✓" : "待调";
  }

  // 2. 舞台顶栏达标计分
  scoreBadge.textContent = `${ev.passCount} / 4 ${ev.passCount === 4 ? "四层成立" : "成立"}`;
  scoreBadge.classList.toggle("is-solved", ev.passCount === 4);

  // 3. 左下深焙咖诊断卡
  diagCard.dataset.severity = ev.diagnosis.severity;
  diagTag.textContent = ev.diagnosis.tag;
  diagTitle.textContent = ev.diagnosis.title;
  diagReason.textContent = ev.diagnosis.reason;
  mOverlap.textContent = `${ev.avgOverlap}%`;
  mVisible.textContent = `${ev.minVisible}%`;
  mTj.textContent = `${ev.tJunctions.length} 处`;

  // 4. 右下 Z1–Z4 槽位轨（仅重建最小节点或就地更新，保持焦点不丢）
  if (zRack.children.length !== 4) {
    zRack.innerHTML = "";
    for (let slot = 0; slot < 4; slot++) {
      const wrap = document.createElement("div");
      wrap.className = "z-slot-wrap";
      wrap.innerHTML = `
        <button type="button" class="z-slot" data-slot="${slot}">
          <span class="z-slot-top"><span class="z-num">Z${slot + 1}</span><span class="z-vis"></span></span>
          <span class="z-name"><i class="z-swatch" aria-hidden="true"></i><span class="z-label"></span></span>
        </button>
        <div class="z-nudges">
          <button type="button" class="z-nudge" data-move="${slot}" data-dir="-1" aria-label="移往更远一层">←</button>
          <button type="button" class="z-nudge" data-move="${slot}" data-dir="1" aria-label="移往更近一层">→</button>
        </div>`;
      zRack.append(wrap);
    }
  }
  for (let slot = 0; slot < 4; slot++) {
    const id = state.order[slot];
    const meta = LAYER_META[id];
    const wrap = zRack.children[slot];
    const btn = wrap.querySelector(".z-slot");
    btn.dataset.selected = String(selectedSlot === slot);
    btn.dataset.ok = String(meta.idealSlot === slot);
    btn.setAttribute("aria-label", `Z${slot + 1} 槽：${meta.name}，当前可见 ${ev.visibleMap[id]}%，点击选中与其他槽互换`);
    wrap.querySelector(".z-vis").textContent = `${ev.visibleMap[id]}%`;
    wrap.querySelector(".z-label").textContent = meta.short;
    wrap.querySelector(".z-swatch").style.background = LAYER_SWATCH[id];
    const leftBtn = wrap.querySelector('[data-dir="-1"]');
    const rightBtn = wrap.querySelector('[data-dir="1"]');
    leftBtn.disabled = slot === 0;
    rightBtn.disabled = slot === 3;
  }
  rackHint.textContent =
    selectedSlot >= 0
      ? `已选 Z${selectedSlot + 1}（${LAYER_META[state.order[selectedSlot]].short}），再点任意槽互换`
      : "点两槽互换，或点 ← → 挪层";

  // 5. 咬合游标位置（把 0..1 映射到 14%..88% 轨道范围，确保手机端左右拖动空间充裕）
  const pctTrack = 14 + clamp(state.stagger, 0, 1) * 74;
  overlapThumb.style.left = `${pctTrack.toFixed(2)}%`;
  overlapFill.style.width = `${pctTrack.toFixed(2)}%`;
  overlapThumb.setAttribute("aria-valuenow", String(Math.round(state.stagger * 100)));
  overlapRead.textContent = `咬合 ${ev.avgOverlap}%（经验甜区 ${EMPIRICAL.overlapMin}%–${EMPIRICAL.overlapMax}%）`;

  // 6. 虚实按钮状态
  for (const btn of toneSeg.querySelectorAll(".tone-btn")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.tone === state.toneMode));
  }
  btnCutaway.setAttribute("aria-pressed", String(state.cutaway));
  btnCutaway.textContent = state.cutaway ? "切回正面 0°" : "掀开侧剖 38°";
}

function updateAndRender() {
  const ev = evaluate(state);
  syncUI(ev);
  drawDiorama(ev);
  dirty = false;
  return ev;
}

// 槽位交互：点击两槽互换 + ←/→ 按钮挪层 + 键盘方向键
function swapSlots(a, b) {
  if (a === b || a < 0 || b < 0 || a > 3 || b > 3) return;
  const next = [...state.order];
  [next[a], next[b]] = [next[b], next[a]];
  state.order = next;
  selectedSlot = -1;
  dirty = true;
  heroLoop.draw();
}

zRack.addEventListener("click", (e) => {
  const moveBtn = e.target.closest(".z-nudge");
  if (moveBtn) {
    const slot = Number(moveBtn.dataset.move);
    const dir = Number(moveBtn.dataset.dir);
    swapSlots(slot, slot + dir);
    return;
  }
  const slotBtn = e.target.closest(".z-slot");
  if (!slotBtn) return;
  const slot = Number(slotBtn.dataset.slot);
  if (selectedSlot < 0) {
    selectedSlot = slot;
    dirty = true;
    heroLoop.draw();
  } else if (selectedSlot === slot) {
    selectedSlot = -1;
    dirty = true;
    heroLoop.draw();
  } else {
    swapSlots(selectedSlot, slot);
  }
});

zRack.addEventListener("keydown", (e) => {
  const slotBtn = e.target.closest(".z-slot");
  if (!slotBtn) return;
  const slot = Number(slotBtn.dataset.slot);
  if (e.key === "ArrowLeft" && slot > 0) {
    e.preventDefault();
    swapSlots(slot, slot - 1);
    zRack.children[slot - 1].querySelector(".z-slot").focus();
  } else if (e.key === "ArrowRight" && slot < 3) {
    e.preventDefault();
    swapSlots(slot, slot + 1);
    zRack.children[slot + 1].querySelector(".z-slot").focus();
  }
});

// 咬合游标拖动（支持鼠标、触摸与 perf.mjs 触屏滑动 + 键盘微调）
let draggingTrack = false;
function setStaggerFromClientX(clientX) {
  const r = overlapTrack.getBoundingClientRect();
  if (r.width < 10) return;
  const norm = (clientX - r.left) / r.width;
  const s = clamp((norm - 0.14) / 0.74, 0, 1);
  state.stagger = s;
  // 推全局游标时温和归零单层手偏，避免用户搞混
  state.manualDx = { sky: 0, ridge: 0, gate: 0, disc: 0 };
  dirty = true;
  heroLoop.draw();
}

overlapTrack.addEventListener("pointerdown", (e) => {
  draggingTrack = true;
  if (overlapTrack.setPointerCapture) {
    try { overlapTrack.setPointerCapture(e.pointerId); } catch {}
  }
  setStaggerFromClientX(e.clientX);
});
overlapTrack.addEventListener("pointermove", (e) => {
  if (!draggingTrack) return;
  setStaggerFromClientX(e.clientX);
});
const endTrackDrag = () => { draggingTrack = false; };
overlapTrack.addEventListener("pointerup", endTrackDrag);
overlapTrack.addEventListener("pointercancel", endTrackDrag);

// 兼容原生 touch 事件（perf.mjs 使用 Input.dispatchTouchEvent）
overlapTrack.addEventListener("touchstart", (e) => {
  if (e.touches[0]) {
    draggingTrack = true;
    setStaggerFromClientX(e.touches[0].clientX);
  }
}, { passive: true });
overlapTrack.addEventListener("touchmove", (e) => {
  if (draggingTrack && e.touches[0]) setStaggerFromClientX(e.touches[0].clientX);
}, { passive: true });
overlapTrack.addEventListener("touchend", endTrackDrag, { passive: true });

overlapThumb.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.1 : 0.04;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.stagger = clamp(state.stagger + step, 0, 1);
    state.manualDx = { sky: 0, ridge: 0, gate: 0, disc: 0 };
    dirty = true;
    heroLoop.draw();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.stagger = clamp(state.stagger - step, 0, 1);
    state.manualDx = { sky: 0, ridge: 0, gate: 0, disc: 0 };
    dirty = true;
    heroLoop.draw();
  }
});

// 画布直拖任意一片剪纸（只水平移动，不锁手机纵向滚动）
function hitCanvasLayer(clientX, clientY) {
  const rect = stageEl.getBoundingClientRect();
  const vp = getStageViewport(rect.width, rect.height);
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const ev = evaluate(state);
  // 从最上层 Z4 往 Z1 命中测试
  for (let i = ev.rects.length - 1; i >= 0; i--) {
    const r = ev.rects[i];
    const tr = projectLayerTransform(r.slot, currentTilt, vp, 1);
    const sx = vp.ox + (r.x - STAGE.w / 2) * vp.scale * tr.cosT + (STAGE.w / 2) * vp.scale + tr.depthDx;
    const sy = vp.oy + r.y * vp.scale + tr.depthDy;
    const sw = r.w * vp.scale * tr.cosT;
    const sh = r.h * vp.scale;
    if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
      return { id: r.id, scaleX: vp.scale * tr.cosT };
    }
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  const hit = hitCanvasLayer(e.clientX, e.clientY);
  if (!hit) return;
  dragLayer = {
    id: hit.id,
    startClientX: e.clientX,
    startDx: state.manualDx[hit.id] || 0,
    scaleX: hit.scaleX,
  };
  canvas.classList.add("is-dragging");
  try { canvas.setPointerCapture(e.pointerId); } catch {}
});
canvas.addEventListener("pointermove", (e) => {
  if (dragLayer) {
    const delta = (e.clientX - dragLayer.startClientX) / Math.max(0.2, dragLayer.scaleX);
    state.manualDx[dragLayer.id] = clamp(dragLayer.startDx + delta, -260, 260);
    dirty = true;
    heroLoop.draw();
    return;
  }
  if (e.pointerType === "mouse") {
    const hit = hitCanvasLayer(e.clientX, e.clientY);
    const nextHover = hit ? hit.id : null;
    if (nextHover !== hoverLayerId) {
      hoverLayerId = nextHover;
      dirty = true;
      heroLoop.draw();
    }
  }
});
const endLayerDrag = () => {
  if (!dragLayer) return;
  dragLayer = null;
  canvas.classList.remove("is-dragging");
  dirty = true;
  heroLoop.draw();
};
canvas.addEventListener("pointerup", endLayerDrag);
canvas.addEventListener("pointercancel", endLayerDrag);
canvas.addEventListener("pointerleave", () => {
  if (hoverLayerId) {
    hoverLayerId = null;
    dirty = true;
    heroLoop.draw();
  }
});

// 虚实三态切换 & 侧剖切换 & 复原错态
toneSeg.addEventListener("click", (e) => {
  const btn = e.target.closest(".tone-btn");
  if (!btn) return;
  state.toneMode = btn.dataset.tone;
  dirty = true;
  heroLoop.draw();
});
btnCutaway.addEventListener("click", () => {
  state.cutaway = !state.cutaway;
  dirty = true;
  heroLoop.draw();
});
btnReset.addEventListener("click", () => {
  Object.assign(state, createInitialState());
  selectedSlot = -1;
  dirty = true;
  heroLoop.draw();
});

const heroLoop = loop(stageEl, (_t, dt, { still }) => {
  const targetTilt = state.cutaway ? 1 : 0;
  if (still) {
    introProgress = 1;
    currentTilt = targetTilt;
    updateAndRender();
    return;
  }
  let moving = false;
  if (introProgress < 1) {
    introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.45);
    moving = true;
  }
  const tiltDiff = targetTilt - currentTilt;
  if (Math.abs(tiltDiff) > 0.002) {
    currentTilt += tiltDiff * Math.min(1, Math.max(dt, 0.016) * 10);
    moving = true;
  } else if (currentTilt !== targetTilt) {
    currentTilt = targetTilt;
    moving = true;
  }
  if (dirty || moving) updateAndRender();
});

new ResizeObserver(() => {
  dirty = true;
  heroLoop.draw();
}).observe(stageEl);

// =========================================================================
// 2. 第 01 节：T 形交点边界放大镜
// =========================================================================
const TJ_MODES = {
  apart: {
    discCx: 274,
    lensX: 208,
    lFrontX: 112,
    cap: "分离 · 24px 空隙",
    text: "两片之间留着空隙，各自都是闭合轮廓——眼睛把它们读成并排贴在同一面墙上的两块色纸，没有前后空间。",
    mark: `<line x1="0" y1="-44" x2="0" y2="44" stroke="#3A2827" stroke-width="2" stroke-dasharray="4 3"/>
           <line x1="24" y1="-44" x2="24" y2="44" stroke="#3A2827" stroke-width="2" stroke-dasharray="4 3"/>
           <rect x="-4" y="-11" width="32" height="22" fill="#261817"/>
           <text x="12" y="4" text-anchor="middle" fill="#F4E4D8" font-size="12" font-weight="700">空隙</text>`,
  },
  tangent: {
    discCx: 258,
    lensX: 200,
    lFrontX: 88,
    cap: "危险切边 · 0px 相切",
    text: "两片边缘正好相切在一条线上，谁也没打断谁的轮廓——大脑一时判不出谁前谁后，视觉像被卡住。",
    mark: `<line x1="0" y1="-64" x2="0" y2="64" stroke="#FFF4EA" stroke-width="2.5" stroke-dasharray="5 4"/>
           <circle cx="0" cy="0" r="14" fill="none" stroke="#F6A28B" stroke-width="3"/>
           <rect x="-32" y="21" width="64" height="20" fill="#261817"/>
           <text x="0" y="35" text-anchor="middle" fill="#F6A28B" font-size="11.5" font-weight="700">切边粘连</text>`,
  },
  overlap: {
    discCx: 222,
    lensX: 184,
    lFrontX: 46,
    cap: "清晰 T 形交点",
    text: "焦糖圆盘干脆压过暗门竖边，在交界处切出清晰的 T 形交点：连续圆弧立刻被认作前景，被截断的门板自然退到后方。",
    mark: `<circle cx="0" cy="-64" r="9" fill="#A6DFB4" stroke="#261817" stroke-width="2"/>
           <circle cx="0" cy="64" r="9" fill="#A6DFB4" stroke="#261817" stroke-width="2"/>
           <path d="M-24 -64 H10 M0 -64 V-32" stroke="#A6DFB4" stroke-width="3" fill="none"/>
           <rect x="-56" y="-8" width="52" height="20" fill="#261817"/>
           <text x="-30" y="6" text-anchor="middle" fill="#A6DFB4" font-size="11.5" font-weight="700">被截断</text>`,
  },
};

const tjLab = document.getElementById("tj-lab");
const tjDisc = document.getElementById("tj-disc");
const tjLens = document.getElementById("tj-lens-ring");
const tjLink = document.getElementById("tj-link");
const tjLFront = document.getElementById("tj-l-front");
const tjLMark = document.getElementById("tj-l-mark");
const tjLoupeCap = document.getElementById("tj-loupe-cap");
const tjCaption = document.getElementById("tj-caption");

function setTjMode(mode) {
  const m = TJ_MODES[mode];
  if (!m) return;
  tjDisc.setAttribute("cx", String(m.discCx));
  tjLens.setAttribute("cx", String(m.lensX));
  tjLink.setAttribute("x1", String(m.lensX + 24));
  tjLFront.setAttribute("cx", String(m.lFrontX));
  tjLMark.innerHTML = m.mark;
  tjLoupeCap.textContent = m.cap;
  tjCaption.textContent = m.text;
  for (const b of tjLab.querySelectorAll(".chip-btn")) {
    b.setAttribute("aria-pressed", String(b.dataset.tj === mode));
  }
}
tjLab.addEventListener("click", (e) => {
  const b = e.target.closest(".chip-btn");
  if (b) setTjMode(b.dataset.tj);
});
setTjMode("tangent");

// =========================================================================
// 3. 第 02 节：五把尺子 · 五维深度开关画布
// =========================================================================
const cuesCanvas = document.getElementById("cues-canvas");
const cuesCtx = cuesCanvas.getContext("2d");
const cuesTier = document.getElementById("cues-tier");
const cuesNote = document.getElementById("cues-note");
const cueSwitchWrap = document.getElementById("cue-switches");
const cuesState = { overlap: true, scale: false, haze: false, shadow: false, sharpness: false };

function drawCuesScene() {
  const rect = cuesCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const dpr = pixelRatio(2);
  const cw = Math.round(rect.width * dpr);
  const ch = Math.round(rect.height * dpr);
  if (cuesCanvas.width !== cw || cuesCanvas.height !== ch) {
    cuesCanvas.width = cw;
    cuesCanvas.height = ch;
  }
  const c = cuesCtx;
  c.save();
  c.scale(dpr, dpr);
  const W = rect.width, H = rect.height;

  // 背景底面（开空气透视时出现由暖奶白到淡雾玫瑰的纵深天光）
  if (cuesState.haze) {
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#F5E7DC");
    bg.addColorStop(0.55, "#E8CDC1");
    bg.addColorStop(1, "#9A5B5F");
    c.fillStyle = bg;
  } else {
    c.fillStyle = "#C99890";
  }
  c.fillRect(0, 0, W, H);

  const overlapOn = cuesState.overlap;
  const scaleOn = cuesState.scale;
  const hazeOn = cuesState.haze;
  const shadowOn = cuesState.shadow;
  const sharpOn = cuesState.sharpness;

  // 四层坐标：overlap=false 时四片横向摊开互不遮挡；overlap=true 时层层咬合
  const xs = overlapOn ? [0.14, 0.36, 0.56, 0.72] : [0.13, 0.38, 0.62, 0.86];
  const scales = scaleOn ? [0.74, 0.88, 1.04, 1.2] : [0.96, 0.96, 0.96, 0.96];
  const colors = hazeOn
    ? ["#E5C3B6", "#BA8780", "#593B3A", "#B85C45"]
    : ["#9B6864", "#915E5A", "#865451", "#9C6155"];

  for (let i = 0; i < 4; i++) {
    const cx = W * xs[i];
    const baseW = W * 0.22 * scales[i];
    const baseH = H * 0.54 * scales[i];
    const topY = H * (0.28 + i * 0.04) - (scales[i] - 1) * H * 0.14;

    c.save();
    if (shadowOn) {
      c.shadowColor = `rgba(34, 15, 16, ${(0.12 + i * 0.09).toFixed(2)})`;
      c.shadowBlur = 4 + i * 7;
      c.shadowOffsetX = -(2 + i * 3);
      c.shadowOffsetY = 3 + i * 4;
    }
    if (sharpOn && i === 0) c.globalAlpha = 0.78;
    c.fillStyle = colors[i];

    if (i === 0) {
      // 远山与暖日
      c.beginPath();
      c.arc(cx, topY + baseH * 0.22, baseW * 0.26, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(cx - baseW * 0.65, H);
      c.quadraticCurveTo(cx, topY + baseH * 0.26, cx + baseW * 0.75, H);
      c.closePath();
      c.fill();
    } else if (i === 1) {
      // 中远叠扇山丘
      c.beginPath();
      c.moveTo(cx - baseW * 0.6, H);
      c.lineTo(cx - baseW * 0.6, topY + baseH * 0.35);
      c.quadraticCurveTo(cx, topY, cx + baseW * 0.6, topY + baseH * 0.42);
      c.lineTo(cx + baseW * 0.6, H);
      c.closePath();
      c.fill();
    } else if (i === 2) {
      // 中近建筑拱门板
      c.fillRect(cx - baseW * 0.42, topY, baseW * 0.84, H - topY);
      if (sharpOn) {
        c.shadowColor = "transparent";
        c.strokeStyle = "rgba(244, 228, 216, 0.45)";
        c.lineWidth = 1.5;
        c.strokeRect(cx - baseW * 0.42, topY, baseW * 0.84, H - topY);
      }
    } else {
      // 前景主盘与微点
      const rad = Math.min(baseW, baseH) * 0.44;
      c.beginPath();
      c.arc(cx, topY + baseH * 0.56, rad, 0, Math.PI * 2);
      c.fill();
      if (sharpOn) {
        c.shadowColor = "transparent";
        c.strokeStyle = "#F4E4D8";
        c.lineWidth = 2;
        c.stroke();
        // 前景专属清晰纹理点阵
        c.fillStyle = "#F4E4D8";
        for (let r = -1; r <= 1; r++) {
          for (let k = -1; k <= 1; k++) {
            c.beginPath();
            c.arc(cx + k * 9, topY + baseH * 0.56 + r * 9, 1.6, 0, Math.PI * 2);
            c.fill();
          }
        }
      }
    }
    c.restore();
  }
  c.restore();
}

function syncCuesUI() {
  const count = Object.values(cuesState).filter(Boolean).length;
  for (const btn of cueSwitchWrap.querySelectorAll(".cue-sw")) {
    const on = cuesState[btn.dataset.cue];
    btn.setAttribute("aria-pressed", String(on));
    btn.querySelector(".sw-pill").textContent = on ? "已开" : "已关";
  }
  let tier, note;
  if (count === 0) {
    tier = "纵深档位 · 完全平贴（0 / 5）";
    note = "五条线索全部关闭：四个色块并排贴在同一明度平面上，空间感归零。";
  } else if (count === 1) {
    tier = "纵深档位 · 单薄起步（1 / 5）";
    note = cuesState.overlap
      ? "此刻只有遮挡在工作：能分清谁压着谁，但四层像贴在一起的纸片，拉不开距离。"
      : "仅靠一条辅线索而没有遮挡咬合，前后归属仍容易摇摆。";
  } else if (count <= 3) {
    tier = `纵深档位 · 层次初显（${count} / 5）`;
    note = cuesState.overlap
      ? "遮挡叠加明暗或体量后，前中远三段已经松开，再补投影与锐度会更扎实。"
      : "虽然有明暗或体量差，但打开「01 遮挡咬合」才是锁定前后关系的关键一击。";
  } else if (count === 4) {
    tier = "纵深档位 · 立体通透（4 / 5）";
    note = "空间关系已经非常明确，补齐最后一条细节线索即可形成完整呼吸感。";
  } else {
    tier = "纵深档位 · 五线索共振（5 / 5）";
    note = "遮挡定先后、比例定远近、雾化推远景、投影托厚度、锐度锁焦点——平面彻底有了空气与纵深。";
  }
  cuesTier.textContent = tier;
  cuesNote.textContent = note;
  drawCuesScene();
}

cueSwitchWrap.addEventListener("click", (e) => {
  const btn = e.target.closest(".cue-sw");
  if (!btn) return;
  const k = btn.dataset.cue;
  cuesState[k] = !cuesState[k];
  syncCuesUI();
});
document.getElementById("cues-all-on").addEventListener("click", () => {
  for (const k of Object.keys(cuesState)) cuesState[k] = true;
  syncCuesUI();
});
document.getElementById("cues-all-off").addEventListener("click", () => {
  for (const k of Object.keys(cuesState)) cuesState[k] = false;
  syncCuesUI();
});
new ResizeObserver(drawCuesScene).observe(cuesCanvas);
syncCuesUI();

// =========================================================================
// 4. 第 03 节：1937 多平面摄影机玻璃视差台
// =========================================================================
const mpPan = document.getElementById("mp-pan");
const mpPanVal = document.getElementById("mp-pan-val");
const mpLayers = [
  { el: document.getElementById("mp-l1"), rig: document.getElementById("mp-p1"), rate: 0.1 },
  { el: document.getElementById("mp-l2"), rig: document.getElementById("mp-p2"), rate: 0.3 },
  { el: document.getElementById("mp-l3"), rig: document.getElementById("mp-p3"), rate: 0.62 },
  { el: document.getElementById("mp-l4"), rig: document.getElementById("mp-p4"), rate: 1.0 },
];
const mpCam = document.getElementById("mp-rig-cam");

function updateMultiplane() {
  const v = Number(mpPan.value); // -100..100
  mpPanVal.textContent = `${v > 0 ? "+" : ""}${v}%`;
  for (const item of mpLayers) {
    const dx = -v * 0.56 * item.rate;
    item.el.setAttribute("transform", `translate(${dx.toFixed(1)} 0)`);
    const rigDx = v * 0.44 * item.rate;
    item.rig.setAttribute("transform", `translate(${rigDx.toFixed(1)} 0)`);
  }
  mpCam.setAttribute("transform", `translate(${(v * 0.48).toFixed(1)} 0)`);
}
mpPan.addEventListener("input", updateMultiplane);
updateMultiplane();

// =========================================================================
// 5. 第 04 节：四种应用场景抽屉剥层台
// =========================================================================
const SCENES = {
  poster: {
    layers: [
      { tag: "L1 底幕", name: "烟梅红展墙", desc: "定下整张海报的色温基调，留出四周呼吸边距。", html: `<div style="position:absolute;inset:0;background:#8E4F53"></div>` },
      { tag: "L2 烘托", name: "暖宣底纸与暗衬卡", desc: "两张偏移 12px 的矩形纸片先铺出平面节奏与标题舞台。", html: `<div style="position:absolute;left:14%;top:10%;width:64%;height:66%;background:#3A2827"></div><div style="position:absolute;left:9%;top:14%;width:64%;height:66%;background:#F4E4D8;box-shadow:-6px 8px 16px rgba(34,16,17,.26)"></div>` },
      { tag: "L3 主体", name: "焦糖几何主盘", desc: "压过奶白纸右缘与深咖边角，制造第一视觉落点。", html: `<div style="position:absolute;right:16%;bottom:20%;width:128px;height:128px;border-radius:50%;background:#BB664E;box-shadow:-8px 10px 18px rgba(34,16,17,.3)"></div>` },
      { tag: "L4 浮层标注", name: "标题与展期签", desc: "最前层的粗黑标题与小卡片压在主体斜对角，完成视觉导读。", html: `<div style="position:absolute;left:12%;top:17%;background:#F4E4D8;padding:2px 6px;color:#261817;font-weight:900;font-size:clamp(18px,3.8vw,24px);letter-spacing:.04em">秋日纸艺展</div><div style="position:absolute;right:10%;bottom:10%;background:#3A2827;color:#F4E4D8;padding:7px 11px;font-size:12px;box-shadow:-5px 7px 14px rgba(34,16,17,.35)">10.14 — 11.20 · 三号馆</div>` },
    ],
  },
  illustration: {
    layers: [
      { tag: "L1 底幕", name: "晨雾天光与暖日", desc: "低反差暖奶白与小圆日建立最远处的天空参照。", html: `<div style="position:absolute;inset:0;background:linear-gradient(#F5E8DE,#E7CFC2)"></div><div style="position:absolute;left:22%;top:16%;width:44px;height:44px;border-radius:50%;background:#D87C65"></div>` },
      { tag: "L2 烘托", name: "淡玫瑰远山群", desc: "退淡的山脊与雾气把天空和前景隔出第一段纵深。", html: `<svg viewBox="0 0 400 300" style="width:100%;height:100%"><path d="M0 300V178Q95 110 190 165T400 148V300Z" fill="#CFA197"/></svg>` },
      { tag: "L3 主体", name: "深焙咖中景屋檐", desc: "高反差深色剪影压过山腰，成为画面中段的叙事中心。", html: `<svg viewBox="0 0 400 300" style="width:100%;height:100%"><path d="M120 300V160L210 112L300 160V300Z" fill="#593836"/><rect x="192" y="196" width="36" height="104" fill="#F2AD91"/></svg>` },
      { tag: "L4 浮层标注", name: "前景暗影枝框", desc: "贴近镜头的暗色前景只占边角，顺势把观众推进画中。", html: `<svg viewBox="0 0 400 300" style="width:100%;height:100%"><path d="M0 300V80Q56 120 74 300Z" fill="#261817"/><path d="M400 300V130Q345 162 320 300Z" fill="#261817"/></svg>` },
    ],
  },
  product: {
    layers: [
      { tag: "L1 底幕", name: "柔光陶红展台背板", desc: "单色哑光背景干净承托，不与器物抢质感。", html: `<div style="position:absolute;inset:0;background:#8A4D51"></div>` },
      { tag: "L2 烘托", name: "拱形光环与暖白石台", desc: "背后的柔和半圆衬片替商品圈出视觉光晕。", html: `<div style="position:absolute;left:24%;top:14%;width:52%;height:68%;border-radius:140px 140px 0 0;background:#EAD4C4"></div><div style="position:absolute;left:0;right:0;bottom:0;height:28%;background:#6C373B"></div>` },
      { tag: "L3 主体", name: "焦糖陶瓶主体", desc: "高饱和主体压在拱门前方并投出清晰地面软影。", html: `<div style="position:absolute;left:50%;bottom:20%;width:84px;height:128px;transform:translateX(-50%);background:linear-gradient(125deg,#D87C65,#9C4834);border-radius:18px 18px 8px 8px;box-shadow:-12px 14px 20px rgba(34,16,17,.36)"></div><div style="position:absolute;left:50%;bottom:calc(20% + 128px);width:34px;height:22px;transform:translateX(-50%);background:#3A2827"></div>` },
      { tag: "L4 浮层标注", name: "材质与规格浮签", desc: "轻盈奶白信息签轻轻压过瓶身右下角，避免说明文字飘走。", html: `<div style="position:absolute;right:11%;bottom:13%;background:#F4E4D8;color:#261817;padding:8px 12px;font-size:12px;font-weight:700;box-shadow:-6px 8px 14px rgba(34,16,17,.3)">粗陶手拉胚 · 320 ml</div>` },
    ],
  },
  ui: {
    layers: [
      { tag: "L1 底幕", name: "基础内容页（0 dp）", desc: "承载日常列表与正文，是用户随时返回的工作平面。", html: `<div style="position:absolute;inset:0;background:#F4E4D8;padding:16px"><div style="height:18px;width:45%;background:#D4BCB0;margin-bottom:12px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="height:76px;background:#E6D2C5"></div><div style="height:76px;background:#E6D2C5"></div><div style="height:76px;background:#E6D2C5"></div><div style="height:76px;background:#E6D2C5"></div></div></div>` },
      { tag: "L2 烘托", name: "半透明遮罩幕（Scrim）", desc: "压暗底层并降低对比，明确告诉用户底层此刻暂停交互。", html: `<div style="position:absolute;inset:0;background:rgba(38,24,23,0.48)"></div>` },
      { tag: "L3 主体", name: "浮起确认弹窗（12 dp）", desc: "高反差亮卡搭配柔和扩散投影，把当前决策稳稳托到最前。", html: `<div style="position:absolute;left:16%;right:16%;top:22%;background:#FBF4EE;color:#261817;padding:16px;box-shadow:0 16px 30px rgba(24,10,11,.42);border-top:3px solid #BB664E"><div style="font-weight:800;font-size:14px;margin-bottom:6px">导出当前图层配置？</div><div style="font-size:12px;color:#5C4340;margin-bottom:12px">将保留 Z1–Z4 顺序与投影参数。</div><div style="display:flex;gap:8px;justify-content:flex-end"><span style="padding:4px 10px;border:1px solid #3A2827;font-size:12px">取消</span><span style="padding:4px 10px;background:#3A2827;color:#F4E4D8;font-size:12px">确认导出</span></div></div>` },
      { tag: "L4 浮层标注", name: "顶层状态提示（24 dp）", desc: "最高海拔的轻量反馈条，短暂覆盖右上角而不打断主面板。", html: `<div style="position:absolute;right:14px;top:14px;background:#256442;color:#FFF8F2;padding:6px 12px;font-size:12px;font-weight:700;box-shadow:0 8px 18px rgba(0,0,0,.32)">✓ 自动草稿已保存</div>` },
    ],
  },
};

let activeScene = "poster";
let activeDepth = 4;
const sceneTabs = document.getElementById("scene-tabs");
const peelPreview = document.getElementById("peel-preview");
const peelSteps = document.getElementById("peel-steps");
const peelLayers = document.getElementById("peel-layers");

function renderScenePeel() {
  const sc = SCENES[activeScene];
  for (const t of sceneTabs.querySelectorAll(".scene-tab")) {
    t.setAttribute("aria-selected", String(t.dataset.scene === activeScene));
  }
  for (const p of peelSteps.querySelectorAll(".step-pill")) {
    p.setAttribute("aria-pressed", String(Number(p.dataset.depth) === activeDepth));
  }
  peelPreview.innerHTML = `<div class="peel-canvas-box">${sc.layers
    .map((l, i) => `<div class="peel-layer${i + 1 > activeDepth ? " is-hidden" : ""}">${l.html}</div>`)
    .join("")}</div>`;
  peelLayers.innerHTML = sc.layers
    .map(
      (l, i) => `<li class="${i + 1 > activeDepth ? "is-off" : ""}"><h3><span class="l-tag">${l.tag}</span>${l.name}</h3><p>${l.desc}</p></li>`
    )
    .join("");
}

sceneTabs.addEventListener("click", (e) => {
  const t = e.target.closest(".scene-tab");
  if (!t) return;
  activeScene = t.dataset.scene;
  activeDepth = 4;
  renderScenePeel();
});
peelSteps.addEventListener("click", (e) => {
  const p = e.target.closest(".step-pill");
  if (!p) return;
  activeDepth = Number(p.dataset.depth);
  renderScenePeel();
});
renderScenePeel();

// =========================================================================
// 6. 第 05 节：七位邻居坐标联动高亮
// =========================================================================
const sibList = document.getElementById("sib-list");
const sibMap = document.getElementById("sib-map");
function highlightSibling(id) {
  for (const li of sibList.querySelectorAll("li")) {
    li.classList.toggle("is-active", li.dataset.id === id);
  }
  for (const node of sibMap.querySelectorAll(".map-node")) {
    node.classList.toggle("is-active", node.dataset.id === id);
  }
}
sibList.addEventListener("click", (e) => {
  const btn = e.target.closest(".sib-focus");
  if (btn) highlightSibling(btn.dataset.focus);
});
highlightSibling("058");

// =========================================================================
// 7. 第 06 节：什么时候别用层叠（三场景正反切换）
// =========================================================================
const ANTI_CASES = {
  table: {
    badHtml: `<div class="demo-table-bad">
      <div class="tb-card"><strong>一季度营收</strong> · ¥ 1,284,600（环比 +6.2%）</div>
      <div class="tb-card c2"><strong>二季度营收</strong> · ¥ 1,192,400（环比 -7.1%）</div>
      <div class="tb-card c3"><strong>三季度营收</strong> · ¥ 1,410,900（环比 +18.3%）</div>
    </div>`,
    goodHtml: `<table class="demo-table-good">
      <thead><tr><th>季度</th><th style="text-align:right">营收</th><th style="text-align:right">环比</th></tr></thead>
      <tbody>
        <tr><td>一季度</td><td class="num">¥ 1,284,600</td><td class="num">+6.2%</td></tr>
        <tr><td>二季度</td><td class="num">¥ 1,192,400</td><td class="num">-7.1%</td></tr>
        <tr><td>三季度</td><td class="num">¥ 1,410,900</td><td class="num">+18.3%</td></tr>
      </tbody>
    </table>`,
    badText: "翻车原因：错位压边和重投影把三行数字拆成不在同一垂线的悬浮卡，核对位数时视线被迫左右跳，越看越容易看错行。",
    goodText: "单平面正解：拿掉所有遮挡与投影，让数字按统一列宽与右对齐垂线排开，一眼扫完三个季度差值。",
  },
  alert: {
    badHtml: `<div class="demo-alert-bad">
      <span class="deco-blob" aria-hidden="true"></span>
      <span class="deco-slab" aria-hidden="true"></span>
      <div class="al-copy">紧急提醒：本剂不可与含酒精饮品同服；若出现皮疹或呼吸不畅请立即停用并就医。</div>
    </div>`,
    goodHtml: `<div class="demo-alert-good">
      <h3>用药安全提醒</h3>
      <p>本剂不可与含酒精饮品同服；若出现皮疹或呼吸不畅，请立即停用并前往急诊。</p>
    </div>`,
    badText: "翻车原因：装饰圆盘和暗色块直接叠在安全说明后面，字与底的明暗对比被切得支离破碎，紧急时刻多花两秒都可能误读。",
    goodText: "单平面正解：纯白干净底面配高对比粗左栏与明确警示标题，零遮挡、零花活，半秒读完核心禁令。",
  },
  reading: {
    badHtml: `<div class="demo-read-bad">
      <div class="rd-box">长篇文字需要稳定、安静的视平线。如果在斜纹底图上再叠半透明卡片、重阴影和浮动推荐条，每一行扫读都在和背景噪声对抗。</div>
      <div class="rd-float">猜你想看：另外 12 篇相关专栏 →</div>
    </div>`,
    goodHtml: `<div class="demo-read-good">
      <p>长篇文字需要稳定、安静的视平线。把装饰层和悬浮推荐全部请出视野，只留一张低反光暖纸与克制行距，读者的注意力才会真正留在句子上。</p>
    </div>`,
    badText: "翻车原因：花纹底、半透浮卡和压在段尾的暗色推荐盒互相争抢焦点，读三段就会眼酸。",
    goodText: "单平面正解：退回单一安静平面，让内容本身而不是层叠特效占据舞台。",
  },
};

let antiCase = "table";
let antiMode = "bad";
const antiLab = document.getElementById("anti-lab");
const antiStage = document.getElementById("anti-stage");
const antiVerdict = document.getElementById("anti-verdict");

function renderAnti() {
  const c = ANTI_CASES[antiCase];
  for (const b of antiLab.querySelectorAll(".anti-tab")) {
    b.setAttribute("aria-pressed", String(b.dataset.case === antiCase));
  }
  for (const b of antiLab.querySelectorAll(".mode-btn")) {
    b.setAttribute("aria-pressed", String(b.dataset.mode === antiMode));
  }
  antiStage.innerHTML = antiMode === "bad" ? c.badHtml : c.goodHtml;
  antiVerdict.textContent = antiMode === "bad" ? c.badText : c.goodText;
}
antiLab.addEventListener("click", (e) => {
  const tab = e.target.closest(".anti-tab");
  if (tab) { antiCase = tab.dataset.case; renderAnti(); return; }
  const mode = e.target.closest(".mode-btn");
  if (mode) { antiMode = mode.dataset.mode; renderAnti(); }
});
renderAnti();

// =========================================================================
// 8. 第 07 节：小练习（A/B/C/D 单变量四选一）
// =========================================================================
const QUIZ_VERDICTS = {
  A: {
    ok: false,
    title: "选了 A：差点意思——问题出在「三处切边碰线」",
    text: "A 版的层序和明暗其实都对，但奶白底纸、中峰、暗门和焦糖圆盘的边缘正好零间隙相切，没有一片真正压过另一片，T 形交点全灭，空间感立刻发僵。B 版把相邻边缘推进约三成咬合，前后立刻松开。",
  },
  B: {
    ok: true,
    title: "答对了，选 B：四层顺序、T 形咬合与近实远虚完全同向",
    text: "B 版同时避开了三个坑：相邻层干脆压边形成清晰 T 形交点（无 A 的切边）、前景沉实带轻影而远山退淡（无 C 的线索倒挂）、后层山脊与暖日都保有清晰可辨的轮廓（无 D 的过度压死）。",
  },
  C: {
    ok: false,
    title: "选了 C：遮挡和明暗在「对着干」",
    text: "C 版的几何位置和 B 一模一样，唯独把最远的太阳与山脉刷成浓重深黑、却把前景焦糖圆盘退成浅肉粉。遮挡说圆盘在最前，空气透视却把远山拉到眼前，两组深度线索互相拆台。B 版保持近实远虚，视觉才顺畅。",
  },
  D: {
    ok: false,
    title: "选了 D：挤得太死，后层造型被前片吞没",
    text: "D 版的顺序和色调都没错，但四层被硬推到画面正中叠死，前景圆盘与暗门吞掉了大半个中峰与暖日轮廓，眼睛认不出后面有什么，纵深节奏塌成一块。B 版留出充足露面比例，层层都读得出。",
  },
};

const quizGrid = document.getElementById("quiz-grid");
const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvText = document.getElementById("qv-text");

quizGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".quiz-card");
  if (!card) return;
  const pick = card.dataset.choice;
  const v = QUIZ_VERDICTS[pick];
  quizGrid.classList.add("is-revealed");
  for (const c of quizGrid.querySelectorAll(".quiz-card")) {
    const ch = c.dataset.choice;
    c.setAttribute("aria-pressed", String(ch === pick));
    c.classList.toggle("is-picked", ch === pick);
    c.classList.toggle("is-right", ch === "B");
  }
  quizVerdict.classList.toggle("is-ok", v.ok);
  qvTitle.textContent = v.title;
  qvText.textContent = v.text;
});

// =========================================================================
// 9. 第 08 节：原海报放大灯箱（复用 #poster.src，绝不二次内联；支持缩放、拖拽、Esc 关闭）
// =========================================================================
const posterImg = document.getElementById("poster");
const posterBtn = document.getElementById("poster-btn");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbZoom = document.getElementById("lb-zoom");
const lbClose = document.getElementById("lb-close");

let lbScale = 1, lbTx = 0, lbTy = 0, lbDrag = null;
function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoom.textContent = lbScale > 1.1 ? "还原 1×" : "放大 1.8×";
}
function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1; lbTx = 0; lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}
function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}
posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoom.addEventListener("click", () => {
  lbScale = lbScale > 1.1 ? 1 : 1.8;
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
});
lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  if (lbScale <= 1.05) return;
  lbDrag = { x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy };
  lbStage.classList.add("is-dragging");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = clamp(lbDrag.tx + (e.clientX - lbDrag.x), -420, 420);
  lbTy = clamp(lbDrag.ty + (e.clientY - lbDrag.y), -520, 520);
  applyLbTransform();
});
const endLbDrag = () => { lbDrag = null; lbStage.classList.remove("is-dragging"); };
lbStage.addEventListener("pointerup", endLbDrag);
lbStage.addEventListener("pointercancel", endLbDrag);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
