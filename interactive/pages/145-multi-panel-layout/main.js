import { loop, pixelRatio } from "../../lib/stage.js";
import {
  ROLES,
  createBrokenState,
  evaluate,
  setSpine,
  setLeftY,
  setRightY1,
  setRightY2,
  swapSlots,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 1. 开场玩具：5 面板活体编排板 ====================
const state = createBrokenState();

const boardEl = $("#hero-board");
const canvasEl = $("#board-canvas");
const ctx = canvasEl.getContext("2d");
const slotEls = $$(".slot", boardEl);
const seamSpine = $("#seam-spine");
const seamLeft = $("#seam-left");
const seamR1 = $("#seam-r1");
const seamR2 = $("#seam-r2");
const legendEl = $("#role-legend");
const toastEl = $("#swap-toast");

// 五个角色的精简 SVG 版面缩略图（呼应 145 原海报图形母题，自适应任意面板比例且永不裁切文字）
function roleArtworkSVG(roleId, contrastMode) {
  const isDark = contrastMode !== "flat" && roleId === 2;
  const ink = isDark ? "#FDF9F0" : "#0A0B0B";
  const soft = isDark ? "#BBE6E8" : "#6D7374";
  const coral = contrastMode === "flat" ? "#8E9394" : "#F26545";
  const cyan = contrastMode === "flat" ? "#B4B8B6" : "#37AEC5";
  const teal = contrastMode === "flat" ? "#6C7273" : "#028B93";
  const amber = contrastMode === "flat" ? "#C9CCC8" : "#FABD3B";

  switch (roleId) {
    case 0: // ① 标题主景：原海报「多面板/版式 + 珊瑚色块 + 3x6 点阵」
      return `<svg viewBox="0 0 220 136" aria-hidden="true">
        <circle cx="18" cy="18" r="5.5" fill="${teal}"/>
        <rect x="30" y="14" width="66" height="8" fill="${soft}"/>
        <rect x="14" y="34" width="132" height="24" fill="${ink}"/>
        <rect x="14" y="66" width="76" height="24" fill="${ink}"/>
        <rect x="98" y="66" width="68" height="24" fill="${coral}"/>
        <rect x="14" y="100" width="152" height="7" fill="${teal}"/>
        <rect x="14" y="114" width="38" height="4" fill="${teal}"/>
        <g fill="${coral}">
          <circle cx="18" cy="126" r="2"/><circle cx="28" cy="126" r="2"/><circle cx="38" cy="126" r="2"/><circle cx="48" cy="126" r="2"/><circle cx="58" cy="126" r="2"/><circle cx="68" cy="126" r="2"/>
        </g>
      </svg>`;
    case 1: // ② 迷你图示：原海报案例 01（天青圆 + 珊瑚半圆 + 3x3 点阵 + 色条）
      return `<svg viewBox="0 0 200 110" aria-hidden="true">
        <circle cx="44" cy="44" r="24" fill="${cyan}"/>
        <path d="M78 16 A28 28 0 0 1 78 72 Z" fill="${coral}"/>
        <g fill="${ink}">
          <circle cx="30" cy="84" r="2.6"/><circle cx="42" cy="84" r="2.6"/><circle cx="54" cy="84" r="2.6"/>
          <circle cx="30" cy="96" r="2.6"/><circle cx="42" cy="96" r="2.6"/><circle cx="54" cy="96" r="2.6"/>
        </g>
        <rect x="122" y="20" width="62" height="5" fill="${ink}"/>
        <rect x="122" y="31" width="54" height="5" fill="${ink}"/>
        <rect x="122" y="42" width="44" height="5" fill="${ink}"/>
        <rect x="122" y="58" width="48" height="9" fill="${teal}"/>
        <rect x="122" y="73" width="62" height="9" fill="${coral}"/>
      </svg>`;
    case 2: // ③ 要点说明：原海报中左深青要点板（标题线 + 虚线 + 分行说明 + 折角）
      return `<svg viewBox="0 0 200 110" aria-hidden="true">
        <rect x="14" y="14" width="94" height="11" fill="${ink}"/>
        <rect x="14" y="31" width="126" height="11" fill="${ink}"/>
        <line x1="14" y1="53" x2="178" y2="53" stroke="${soft}" stroke-width="2" stroke-dasharray="5 4"/>
        <rect x="14" y="64" width="164" height="6" fill="${soft}"/>
        <rect x="14" y="77" width="146" height="6" fill="${soft}"/>
        <rect x="14" y="90" width="108" height="6" fill="${soft}"/>
        <polygon points="178,104 194,88 194,104" fill="${isDark ? "#F7F1E5" : "#0A0B0B"}"/>
      </svg>`;
    case 3: // ④ 关键词区：原海报四枚几何关键词图标横带
      return `<svg viewBox="0 0 220 96" aria-hidden="true">
        <rect x="16" y="18" width="28" height="28" fill="none" stroke="${ink}" stroke-width="2.5" stroke-dasharray="5 3"/>
        <rect x="18" y="58" width="24" height="6" fill="${ink}"/>
        <line x1="58" y1="18" x2="58" y2="66" stroke="${soft}" stroke-width="1.5" stroke-dasharray="3 3"/>
        <g fill="none" stroke="${ink}" stroke-width="2.2">
          <rect x="70" y="18" width="12" height="12"/><rect x="86" y="18" width="12" height="12"/>
          <rect x="70" y="34" width="12" height="12"/><rect x="86" y="34" width="12" height="12"/>
        </g>
        <rect x="72" y="58" width="24" height="6" fill="${ink}"/>
        <line x1="112" y1="18" x2="112" y2="66" stroke="${soft}" stroke-width="1.5" stroke-dasharray="3 3"/>
        <path d="M126 42 L138 30 L152 21" fill="none" stroke="${ink}" stroke-width="2.5"/>
        <circle cx="126" cy="42" r="3.5" fill="${coral}"/><circle cx="138" cy="30" r="3.5" fill="${teal}"/><circle cx="152" cy="21" r="3.5" fill="${amber}"/>
        <rect x="128" y="58" width="24" height="6" fill="${ink}"/>
        <line x1="166" y1="18" x2="166" y2="66" stroke="${soft}" stroke-width="1.5" stroke-dasharray="3 3"/>
        <circle cx="192" cy="32" r="14" fill="none" stroke="${ink}" stroke-width="2.5"/>
        <path d="M192 18 A14 14 0 0 0 192 46 Z" fill="${ink}"/>
        <rect x="180" y="58" width="24" height="6" fill="${ink}"/>
      </svg>`;
    case 4: // ⑤ 案例对比：原海报案例 02 / 03（双联山景 + 四色环形图 + A/B/C）
    default:
      return `<svg viewBox="0 0 210 110" aria-hidden="true">
        <rect x="10" y="10" width="90" height="90" fill="rgba(10,11,11,0.06)" stroke="${soft}" stroke-width="1.2"/>
        <polygon points="20,66 48,30 74,66" fill="${teal}"/>
        <polygon points="50,66 70,42 90,66" fill="${cyan}"/>
        <circle cx="76" cy="26" r="7" fill="${teal}"/>
        <rect x="20" y="75" width="70" height="4" fill="${ink}"/>
        <circle cx="28" cy="88" r="4.5" fill="${teal}"/><circle cx="55" cy="88" r="4.5" fill="${teal}"/><circle cx="82" cy="88" r="4.5" fill="${teal}"/>

        <rect x="110" y="10" width="90" height="90" fill="rgba(10,11,11,0.06)" stroke="${soft}" stroke-width="1.2"/>
        <circle cx="155" cy="44" r="20" fill="none" stroke="${coral}" stroke-width="10"/>
        <circle cx="155" cy="44" r="20" fill="none" stroke="${amber}" stroke-width="10" stroke-dasharray="34 96" stroke-dashoffset="-32"/>
        <circle cx="155" cy="44" r="20" fill="none" stroke="${teal}" stroke-width="10" stroke-dasharray="28 96" stroke-dashoffset="-74"/>
        <circle cx="155" cy="44" r="9" fill="#2A3A3E"/>
        <rect x="120" y="78" width="19" height="14" fill="${teal}"/>
        <rect x="145" y="78" width="19" height="14" fill="${coral}"/>
        <rect x="170" y="78" width="19" height="14" fill="${amber}"/>
      </svg>`;
  }
}

let lastEval = null;
let canvasDirty = true;
let introDone = false;
let legendBuilt = false;

function getGutterPx() {
  if (state.gutter === "none") return 0;
  if (state.gutter === "wide") return 16;
  return 4;
}

function setText(el, val) {
  if (el.textContent !== val) el.textContent = val;
}

function renderLegend() {
  if (!legendBuilt) {
    legendBuilt = true;
    legendEl.innerHTML = ROLES.map((role) =>
      `<button type="button" class="legend-chip" data-role-pick="${role.id}" aria-pressed="false">
        <span class="legend-dot d-${role.accent}">${role.num}</span>
        <span>${role.short}</span>
      </button>`
    ).join("");
  }
  const chips = legendEl.children;
  for (let i = 0; i < ROLES.length; i++) {
    const slotIdx = state.slots.indexOf(ROLES[i].id);
    const active = String(state.selectedSlot === slotIdx);
    if (chips[i].getAttribute("aria-pressed") !== active) {
      chips[i].setAttribute("aria-pressed", active);
    }
  }
}

let boardW = 720;
let boardH = 515;

function measureBoard() {
  const r = boardEl.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) {
    boardW = Math.round(r.width);
    boardH = Math.round(r.height);
  }
}

function renderHeroDOM() {
  const bw = boardW;
  const bh = boardH;
  const ev = evaluate(state, bw / Math.max(1, bh));
  lastEval = ev;

  if (boardEl.dataset.gutter !== state.gutter) boardEl.dataset.gutter = state.gutter;
  if (boardEl.dataset.contrast !== state.contrast) boardEl.dataset.contrast = state.contrast;

  const gap = getGutterPx();
  const half = gap / 2;

  // 精确定位 5 个槽位（基于 model.js 同源矩形；拖拽时绝不重建 SVG DOM，只更新坐标与读数）
  ev.rects.forEach((r) => {
    const el = slotEls[r.slot];
    const role = ROLES[r.roleId];
    const leftPad = r.x > 0 ? half : gap === 16 ? half : 0;
    const rightPad = r.x + r.w < 0.999 ? half : gap === 16 ? half : 0;
    const topPad = r.y > 0 ? half : gap === 16 ? half : 0;
    const bottomPad = r.y + r.h < 0.999 ? half : gap === 16 ? half : 0;

    el.style.left = `calc(${(r.x * 100).toFixed(3)}% + ${leftPad}px)`;
    el.style.top = `calc(${(r.y * 100).toFixed(3)}% + ${topPad}px)`;
    el.style.width = `calc(${(r.w * 100).toFixed(3)}% - ${leftPad + rightPad}px)`;
    el.style.height = `calc(${(r.h * 100).toFixed(3)}% - ${topPad + bottomPad}px)`;

    const roleKey = `${role.id}:${state.contrast}`;
    if (el._roleKey !== roleKey) {
      el._roleKey = roleKey;
      el.dataset.role = String(role.id);
      if (!el._parts) {
        el.innerHTML = `<span class="slot-bar"><span class="slot-id"><span class="slot-badge"></span><span class="slot-name"></span></span><span class="slot-pct"></span></span><span class="slot-art"></span>`;
        el._parts = {
          badge: el.querySelector(".slot-badge"),
          name: el.querySelector(".slot-name"),
          pct: el.querySelector(".slot-pct"),
          art: el.querySelector(".slot-art"),
        };
      }
      el._parts.badge.textContent = role.num;
      el._parts.name.textContent = role.name;
      el._parts.art.innerHTML = roleArtworkSVG(role.id, state.contrast);
    }

    const pct = Math.round(r.area * 100);
    setText(el._parts.pct, `${pct}%`);

    const isSel = String(state.selectedSlot === r.slot);
    if (el.dataset.selected !== isSel) {
      el.dataset.selected = isSel;
      el.setAttribute("aria-pressed", isSel);
    }
    const isCrushed = String(ev.crushedSlots.includes(r.slot));
    if (el.dataset.crushed !== isCrushed) el.dataset.crushed = isCrushed;

    const ariaLbl = `${r.label}槽位：${role.circle} ${role.name}，面积占 ${pct}%，点选可与其他面板互换`;
    if (el._ariaLbl !== ariaLbl) {
      el._ariaLbl = ariaLbl;
      el.setAttribute("aria-label", ariaLbl);
    }
  });

  // 定位四条实体粗黑隔板把手
  seamSpine.style.left = `${(state.spine * 100).toFixed(3)}%`;
  seamSpine.setAttribute("aria-valuenow", String(Math.round(state.spine * 100)));

  seamLeft.style.left = "0";
  seamLeft.style.width = `${(state.spine * 100).toFixed(3)}%`;
  seamLeft.style.top = `${(state.leftY * 100).toFixed(3)}%`;
  seamLeft.setAttribute("aria-valuenow", String(Math.round(state.leftY * 100)));

  const rwPct = ((1 - state.spine) * 100).toFixed(3);
  const sPct = (state.spine * 100).toFixed(3);
  seamR1.style.left = `${sPct}%`;
  seamR1.style.width = `${rwPct}%`;
  seamR1.style.top = `${(state.rightY1 * 100).toFixed(3)}%`;
  seamR1.setAttribute("aria-valuenow", String(Math.round(state.rightY1 * 100)));

  seamR2.style.left = `${sPct}%`;
  seamR2.style.width = `${rwPct}%`;
  seamR2.style.top = `${(state.rightY2 * 100).toFixed(3)}%`;
  seamR2.setAttribute("aria-valuenow", String(Math.round(state.rightY2 * 100)));

  // 同步诊断与四维读数（仅变更时写 DOM）
  const scorePill = $("#hero-score-pill");
  setText(scorePill, `${ev.score} / 4`);
  scorePill.dataset.ok = String(ev.score === 4);

  const diagPanel = $("#diag-panel");
  if (diagPanel.dataset.severity !== ev.diagnosis.severity) diagPanel.dataset.severity = ev.diagnosis.severity;
  setText($("#diag-badge"), ev.diagnosis.badge);
  setText($("#diag-headline"), ev.diagnosis.headline);
  setText($("#diag-reason"), ev.diagnosis.reason);
  setText($("#diag-hint"), ev.diagnosis.hint);

  setText($("#m-ratio"), `${ev.ratio.toFixed(1)}×`);
  setText($("#m-hero"), `${ev.heroPct}%`);
  setText($("#m-min"), `${ev.minPct}%`);
  setText($("#m-path"), `${ev.path.crossings.length}交 / ${ev.path.backtracks}跳`);

  for (const key of ["zone", "module", "narrative", "contrast"]) {
    const li = $(`#chk-${key}`);
    const okStr = String(ev.checks[key].ok);
    if (li.dataset.ok !== okStr) li.dataset.ok = okStr;
    setText($(`#chk-${key}-val`), ev.checks[key].detail);
  }

  // 同步按钮状态
  $$("[data-gutter-val]").forEach((b) => {
    const v = String(b.dataset.gutterVal === state.gutter);
    if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
  });
  $$("[data-contrast-val]").forEach((b) => {
    const v = String(b.dataset.contrastVal === state.contrast);
    if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
  });
  const pathBtn = $("#btn-path");
  const pStr = String(state.showPath);
  if (pathBtn.getAttribute("aria-pressed") !== pStr) {
    pathBtn.setAttribute("aria-pressed", pStr);
    pathBtn.textContent = `路径透视: ${state.showPath ? "开" : "关"}`;
  }

  renderLegend();

  const nextToast =
    state.selectedSlot >= 0
      ? `已选中「${ROLES[state.slots[state.selectedSlot]].circle} ${ROLES[state.slots[state.selectedSlot]].name}」——再点另一块面板或下方编号即可互换槽位（按 Esc 取消）。`
      : "拖粗黑隔板改面积比例；点两块面板互换位置；聚焦隔板把手可用方向键微调。";
  setText(toastEl, nextToast);

  canvasDirty = true;
}

// 2D Canvas 视线路径与压扁斜纹透视层
function drawBoardCanvas(t, _dt, { still }) {
  const w = Math.max(1, boardW);
  const h = Math.max(1, boardH);
  const dpr = pixelRatio(w < 500 ? 1.5 : 2);

  if (canvasEl.width !== Math.round(w * dpr) || canvasEl.height !== Math.round(h * dpr)) {
    canvasEl.width = Math.round(w * dpr);
    canvasEl.height = Math.round(h * dpr);
    canvasDirty = true;
  }

  const introProgress = still ? 1 : Math.min(1, t / 0.72);
  if (!still && introProgress < 1) {
    canvasDirty = true;
  } else if (!introDone) {
    introDone = true;
    canvasDirty = true;
  }

  if (!canvasDirty) return;
  canvasDirty = false;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const ev = lastEval || evaluate(state, w / h);

  // 1. 被压扁面板绘制珊瑚红警告斜纹
  if (ev.crushedSlots.length) {
    ev.rects.forEach((r) => {
      if (!ev.crushedSlots.includes(r.slot)) return;
      const rx = r.x * w;
      const ry = r.y * h;
      const rw = r.w * w;
      const rh = r.h * h;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx + 2, ry + 2, Math.max(0, rw - 4), Math.max(0, rh - 4));
      ctx.clip();
      ctx.strokeStyle = "rgba(181, 53, 26, 0.38)";
      ctx.lineWidth = 2;
      for (let d = -rh; d < rw + rh; d += 12) {
        ctx.beginPath();
        ctx.moveTo(rx + d, ry);
        ctx.lineTo(rx + d - rh, ry + rh);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  if (!state.showPath) return;

  // 2. 绘制 ① → ② → ③ → ④ → ⑤ 几何质心阅读路径
  const ease = 1 - Math.pow(1 - introProgress, 3);
  const segCount = ev.path.segments.length;
  const totalDraw = ease * segCount;

  ev.path.segments.forEach((seg, idx) => {
    const localP = Math.max(0, Math.min(1, totalDraw - idx));
    if (localP <= 0) return;

    const x0 = seg.from.x * w;
    const y0 = seg.from.y * h;
    const x1 = seg.to.x * w;
    const y1 = seg.to.y * h;
    const ex = x0 + (x1 - x0) * localP;
    const ey = y0 + (y1 - y0) * localP;

    const bad = seg.crossed || seg.isBacktrack;
    const stroke = bad ? "#C23618" : "#026F76";

    ctx.save();
    // 浅底描边让路径在深青/米纸上都清晰可见
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = "rgba(252, 249, 242, 0.9)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    if (bad) ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 方向箭头
    if (localP > 0.35) {
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const ax = x0 + (x1 - x0) * Math.min(localP, 0.56);
      const ay = y0 + (y1 - y0) * Math.min(localP, 0.56);
      const sz = 9;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - sz * Math.cos(ang - 0.5), ay - sz * Math.sin(ang - 0.5));
      ctx.lineTo(ax - sz * Math.cos(ang + 0.5), ay - sz * Math.sin(ang + 0.5));
      ctx.closePath();
      ctx.fillStyle = stroke;
      ctx.fill();
    }
    ctx.restore();
  });

  // 3. 节点序号圆徽
  ev.path.points.forEach((pt, idx) => {
    if (idx > 0 && totalDraw < idx - 0.1) return;
    const px = pt.x * w;
    const py = pt.y * h;
    const isErrNode = (idx === 0 && !ev.path.startsTopLeft) || (idx === 4 && !ev.path.endsBottomRight);
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 13, 0, Math.PI * 2);
    ctx.fillStyle = isErrNode ? "#C23618" : ev.path.ok ? "#026F76" : "#0A0B0B";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FCF9F2";
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(idx + 1), px, py + 0.5);
    ctx.restore();
  });

  // 4. 精确交点标注「交叉」（交点打实点，标签略下移避开面板顶条字）
  if (introProgress > 0.7) {
    ev.path.crossings.forEach((hit) => {
      const hx = hit.x * w;
      const hy = hit.y * h;
      const ly = Math.min(h - 18, hy + 24);
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#C23618";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FCF9F2";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hx, hy + 5);
      ctx.lineTo(hx, ly - 10);
      ctx.strokeStyle = "#C23618";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#C23618";
      ctx.strokeStyle = "#FCF9F2";
      ctx.lineWidth = 2;
      ctx.fillRect(hx - 20, ly - 10, 40, 20);
      ctx.strokeRect(hx - 20, ly - 10, 40, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("交叉", hx, ly + 0.5);
      ctx.restore();
    });
  }
}

const heroLoop = loop(boardEl, drawBoardCanvas);

function syncHero() {
  renderHeroDOM();
  heroLoop.draw();
}

// 隔板拖拽（兼容鼠标 Pointer、触屏 Touch 与键盘方向键；缓存板框边界避免拖拽期强制回流）
function bindSeamDrag(handle, axis, applyValue, nudgeFn) {
  let dragging = false;
  let dragRect = null;

  const updateFromClient = (clientX, clientY, snap = true) => {
    const r = dragRect || boardEl.getBoundingClientRect();
    const norm = axis === "x"
      ? (clientX - r.left) / Math.max(1, r.width)
      : (clientY - r.top) / Math.max(1, r.height);
    applyValue(norm, snap);
    syncHero();
  };

  const onMove = (e) => {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    if (!pt) return;
    if (e.cancelable) e.preventDefault();
    updateFromClient(pt.clientX, pt.clientY, true);
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    dragRect = null;
    handle.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("pointercancel", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    window.removeEventListener("touchcancel", onEnd);
  };

  handle.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    dragging = true;
    dragRect = boardEl.getBoundingClientRect();
    handle.classList.add("is-dragging");
    try { handle.setPointerCapture(e.pointerId); } catch {}
    updateFromClient(e.clientX, e.clientY, true);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  });

  // 同时监听原生 touchstart，确保任何只发 TouchEvent 的设备与 perf 测帧都能丝滑跟手
  handle.addEventListener("touchstart", (e) => {
    if (dragging) return;
    const pt = e.touches[0];
    if (!pt) return;
    if (e.cancelable) e.preventDefault();
    dragging = true;
    dragRect = boardEl.getBoundingClientRect();
    handle.classList.add("is-dragging");
    updateFromClient(pt.clientX, pt.clientY, false);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
  }, { passive: false });

  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.05 : 0.02;
    if ((axis === "x" && e.key === "ArrowLeft") || (axis === "y" && e.key === "ArrowUp")) {
      e.preventDefault();
      nudgeFn(-step);
      syncHero();
    } else if ((axis === "x" && e.key === "ArrowRight") || (axis === "y" && e.key === "ArrowDown")) {
      e.preventDefault();
      nudgeFn(step);
      syncHero();
    }
  });
}

bindSeamDrag(seamSpine, "x", (v, snap) => setSpine(state, v, snap), (d) => setSpine(state, state.spine + d, false));
bindSeamDrag(seamLeft, "y", (v, snap) => setLeftY(state, v, snap), (d) => setLeftY(state, state.leftY + d, false));
bindSeamDrag(seamR1, "y", (v) => setRightY1(state, v), (d) => setRightY1(state, state.rightY1 + d));
bindSeamDrag(seamR2, "y", (v) => setRightY2(state, v), (d) => setRightY2(state, state.rightY2 + d));

// 点击面板互换槽位
function handleSlotPick(slotIdx) {
  if (state.selectedSlot === -1) {
    state.selectedSlot = slotIdx;
  } else if (state.selectedSlot === slotIdx) {
    state.selectedSlot = -1;
  } else {
    swapSlots(state, state.selectedSlot, slotIdx);
  }
  syncHero();
}

slotEls.forEach((el) => {
  el.addEventListener("click", () => handleSlotPick(Number(el.dataset.slot)));
});

legendEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-role-pick]");
  if (!btn) return;
  const roleId = Number(btn.dataset.rolePick);
  const slotIdx = state.slots.indexOf(roleId);
  if (slotIdx >= 0) handleSlotPick(slotIdx);
});

$$("[data-gutter-val]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.gutter = btn.dataset.gutterVal;
    syncHero();
  });
});

$$("[data-contrast-val]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.contrast = btn.dataset.contrastVal;
    syncHero();
  });
});

$("#btn-path").addEventListener("click", () => {
  state.showPath = !state.showPath;
  syncHero();
});

$("#btn-reset").addEventListener("click", () => {
  Object.assign(state, createBrokenState());
  syncHero();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.selectedSlot >= 0) {
    state.selectedSlot = -1;
    syncHero();
  }
});

new ResizeObserver(() => {
  measureBoard();
  renderHeroDOM();
  heroLoop.draw();
}).observe(boardEl);

measureBoard();
syncHero();

// ==================== 2. 第 01 节：四维解剖图谱 ====================
const ROLE_NOTES = {
  zone: "<strong>分区（ZONE）</strong>：先定谁是主角。左上标题面板占去近四成面积，是最小案例格的 2.8 倍，眼睛一落纸就先被稳住，再按梯度读其余四块。",
  module: "<strong>模块（MODULE）</strong>：用果断的粗黑隔板切出物理边界，每格只管一件事——图示不混进正文，关键词不挤进案例，信息不再串场。",
  narrative: "<strong>叙事（NARRATIVE）</strong>：五个角色按 ① 标题 → ② 图示 → ③ 说明 → ④ 关键词 → ⑤ 案例的 Z 字路线推进，零交叉、零回跳。",
  contrast: "<strong>对比（CONTRAST）</strong>：绝不把五块全涂满颜色。只留 ③ 核心说明做一块深青实底锚，辅以珊瑚、天青、明黄细顶条，其余留给暖米纸呼吸。",
};

$$("#lab-role .rtab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const kw = tab.dataset.kw;
    $$("#lab-role .rtab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    $$("#role-svg .rs-layer").forEach((g) => {
      g.hidden = g.id !== `rs-layer-${kw}`;
    });
    $("#role-note").innerHTML = ROLE_NOTES[kw];
  });
});

// ==================== 3. 第 02 节：隔缝闭包实验器 ====================
const STRIP_MODES = {
  step: [
    { no: "01", title: "破晓", cap: "地平线微亮，太阳刚露边缘", svg: `<rect width="160" height="120" fill="#EAE4D7"/><rect y="82" width="160" height="38" fill="#02737A"/><circle cx="42" cy="82" r="18" fill="#F26545"/>` },
    { no: "02", title: "升空", cap: "太阳离开海面，光影拉长", svg: `<rect width="160" height="120" fill="#F7F1E5"/><rect y="82" width="160" height="38" fill="#028B93"/><circle cx="72" cy="54" r="18" fill="#F26545"/>` },
    { no: "03", title: "正午", cap: "高悬画面上方，色彩最明亮", svg: `<rect width="160" height="120" fill="#FCF9F2"/><rect y="82" width="160" height="38" fill="#37AEC5"/><circle cx="104" cy="30" r="18" fill="#FABD3B"/>` },
    { no: "04", title: "归暮", cap: "低垂回落，整段故事收束", svg: `<rect width="160" height="120" fill="#E1DCD2"/><rect y="82" width="160" height="38" fill="#141A1B"/><circle cx="128" cy="76" r="18" fill="#F26545"/>` },
  ],
  parallel: [
    { no: "A", title: "方案 A · 对称", cap: "左右等重，适合庄重展陈", svg: `<rect width="160" height="120" fill="#F7F1E5"/><rect x="50" y="20" width="60" height="80" fill="#028B93"/><circle cx="80" cy="60" r="18" fill="#FABD3B"/>` },
    { no: "B", title: "方案 B · 偏左", cap: "右侧留白，适合配标题字", svg: `<rect width="160" height="120" fill="#F7F1E5"/><rect x="18" y="20" width="60" height="80" fill="#028B93"/><circle cx="116" cy="44" r="18" fill="#F26545"/>` },
    { no: "C", title: "方案 C · 压底", cap: "重心沉底，上方开阔呼吸", svg: `<rect width="160" height="120" fill="#F7F1E5"/><rect x="18" y="68" width="124" height="34" fill="#028B93"/><circle cx="80" cy="40" r="16" fill="#37AEC5"/>` },
    { no: "D", title: "方案 D · 对角", cap: "双角呼应，动感最强", svg: `<rect width="160" height="120" fill="#F7F1E5"/><rect x="16" y="16" width="54" height="44" fill="#028B93"/><circle cx="122" cy="84" r="20" fill="#F26545"/>` },
  ],
  zoom: [
    { no: "全貌", title: "建筑立面", cap: "先给整体轮廓与位置关系", svg: `<rect width="160" height="120" fill="#F7F1E5"/><rect x="34" y="22" width="92" height="78" fill="#02737A"/><rect x="52" y="38" width="22" height="22" fill="#FABD3B"/><rect x="86" y="38" width="22" height="22" fill="#F7F1E5"/><rect x="52" y="68" width="56" height="32" fill="#F26545"/>` },
    { no: "中景", title: "主入口区", cap: "视线推进到核心结构块", svg: `<rect width="160" height="120" fill="#F7F1E5"/><rect x="14" y="14" width="132" height="92" fill="#02737A"/><rect x="36" y="30" width="88" height="76" fill="#F26545"/><rect x="56" y="52" width="48" height="54" fill="#F7F1E5"/>` },
    { no: "近景", title: "角部节点", cap: "放大检视材料与线条咬合", svg: `<rect width="160" height="120" fill="#F26545"/><rect x="44" y="26" width="116" height="94" fill="#F7F1E5"/><line x1="44" y1="26" x2="160" y2="26" stroke="#0A0B0B" stroke-width="5"/><line x1="44" y1="26" x2="44" y2="120" stroke="#0A0B0B" stroke-width="5"/><circle cx="76" cy="60" r="14" fill="#37AEC5"/>` },
    { no: "细部", title: "榫卯特写", cap: "最后一格定格关键工艺细节", svg: `<rect width="160" height="120" fill="#FCF9F2"/><path d="M20 60 H74 V32 H106 V88 H140" fill="none" stroke="#0A0B0B" stroke-width="8"/><circle cx="90" cy="60" r="12" fill="#FABD3B" stroke="#0A0B0B" stroke-width="3"/>` },
  ],
};

let currentSeq = "step";
const stripStage = $("#strip-stage");
const gutterRange = $("#gutter-range");

function renderStrip() {
  const items = STRIP_MODES[currentSeq];
  stripStage.innerHTML = items
    .map(
      (it) => `<div class="strip-cell">
        <div class="strip-head"><span>${it.no}</span><span>${it.title}</span></div>
        <svg viewBox="0 0 160 120" aria-hidden="true">${it.svg}</svg>
        <p class="strip-cap">${it.cap}</p>
      </div>`
    )
    .join("");
  updateGutterReadout();
}

function updateGutterReadout() {
  const px = Number(gutterRange.value);
  stripStage.style.setProperty("--strip-gap", `${px}px`);
  stripStage.dataset.tight = String(px <= 2);
  stripStage.dataset.broken = String(px >= 24);
  $("#gutter-px").textContent = `${px} px`;

  const stateEl = $("#gutter-state");
  const descEl = $("#gutter-desc");
  const modeName = currentSeq === "step" ? "分步演进" : currentSeq === "parallel" ? "并列对照" : "总分展开";

  if (px <= 2) {
    stateEl.textContent = "极紧连拍 · 易粘连";
    stateEl.dataset.warn = "true";
    descEl.textContent = `${px}px 几乎消除了格间呼吸：四幅「${modeName}」紧紧贴死，节奏急促，但相邻边缘的色块与标注很容易互相串场。`;
  } else if (px <= 18) {
    stateEl.textContent = "清晰节拍 · 推荐区间";
    stateEl.dataset.warn = "false";
    descEl.textContent = `${px}px 隔缝（经验舒适带 4–18px）给大脑留出刚好一拍的停顿：四块「${modeName}」各自独立，又一眼能由格式塔闭合连成整体。`;
  } else {
    stateEl.textContent = "过宽断片 · 失去整体";
    stateEl.dataset.warn = "true";
    descEl.textContent = `${px}px 隔缝宽过头了：白沟比画框还抢眼，四块「${modeName}」不再像同一组叙事，而像四张散落的孤立卡片。`;
  }
}

$$("#gutter-lab .gl-mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentSeq = btn.dataset.seq;
    $$("#gutter-lab .gl-mode").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    renderStrip();
  });
});
gutterRange.addEventListener("input", updateGutterReadout);
renderStrip();

// ==================== 4. 第 03 节：三种多面板骨架同材切页 ====================
const ARCH_INFO = {
  bento: {
    title: "有明确主打项时，用不对称便当盒",
    text: "当 4 项里有 1 个核心主打（比如浅烘水洗主打款），让 01 占去近半面积，02–04 退成紧凑辅助卡。这样既展示全貌，又不怕配角抢戏。",
    rule: "<strong>核心差异：</strong>大小不均是在替读者做决定——“先看最大的，再扫其余”。",
  },
  multiples: {
    title: "四项地位完全平等时，改用均列小倍图",
    text: "如果读者要横向对比四种烘焙度的酸苦曲线，反而不该把某一款强行放大。四块面板共享相同宽窄与坐标框架，只改变图形变量，视线一扫就能精准比差异。",
    rule: "<strong>为什么这里允许均分：</strong>小倍图（Tufte, 1990）的目标是“公平对照”，而不是“主次叙事”。",
  },
  cascade: {
    title: "先总后分再收口，用宽幅 + 双卡阶梯带",
    text: "145 号原海报右侧就是这种节拍：顶上一条宽幅先定总调性，中段拆出 02 / 03 双卡对照细节，底沿再用一条通栏做总结或收尾，上下推进极稳。",
    rule: "<strong>适用场景：</strong>产品概览页、教学海报、杂志专题跨页，兼顾入口气势与细节对比。",
  },
};

$$("#morph-bench .mb-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const arch = tab.dataset.arch;
    $$("#morph-bench .mb-tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    $("#mb-canvas").dataset.arch = arch;
    $("#mbe-title").textContent = ARCH_INFO[arch].title;
    $("#mbe-text").textContent = ARCH_INFO[arch].text;
    $("#mbe-rule").innerHTML = ARCH_INFO[arch].rule;
  });
});

// ==================== 5. 第 04 节：历史形制图鉴 ====================
let wingsOpen = true;
let currentEra = "1432";

const ERAS = {
  "1432": {
    year: "1432 · GHENT ALTARPIECE",
    title: "根特祭坛画：主板立威，台座说故事",
    body: "休伯特与扬·凡·艾克（Hubert & Jan van Eyck）于 1432 年完成的《根特祭坛画》藏于比利时圣巴夫主教座堂，展开后由 12 块木板构成。正如伦敦国家美术馆对多联画（polyptych）的界定：中板稳立核心主题、侧板配人物、底部圣像台座（predella）用小格展开叙事——大小分级与功能分区一脉相承。",
    takeaway: "<strong>留给今天的设计基因：</strong>把“核心定锚”和“连续叙事”分别交给不同尺寸的面板，而不是硬塞进同一画幅。",
    hasWings: true,
    render: (open) =>
      open
        ? `<rect x="8" y="8" width="444" height="234" fill="#F7F1E5" stroke="#0A0B0B" stroke-width="3"/>
           <!-- 左右展开翼板 -->
           <rect x="26" y="26" width="76" height="142" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="3"/>
           <rect x="358" y="26" width="76" height="142" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="3"/>
           <line x1="26" y1="96" x2="102" y2="96" stroke="#0A0B0B" stroke-width="2"/>
           <line x1="358" y1="96" x2="434" y2="96" stroke="#0A0B0B" stroke-width="2"/>
           <!-- 中央主屏（3 联上层 + 宽底中板） -->
           <rect x="108" y="20" width="244" height="148" fill="#02737A" stroke="#0A0B0B" stroke-width="3"/>
           <line x1="184" y1="20" x2="184" y2="96" stroke="#0A0B0B" stroke-width="2.5"/>
           <line x1="276" y1="20" x2="276" y2="96" stroke="#0A0B0B" stroke-width="2.5"/>
           <line x1="108" y1="96" x2="352" y2="96" stroke="#0A0B0B" stroke-width="3"/>
           <circle cx="230" cy="58" r="18" fill="#FABD3B"/>
           <rect x="148" y="114" width="164" height="36" fill="#F26545"/>
           <!-- 底部 Predella 小格叙事带 -->
           <rect x="108" y="176" width="244" height="44" fill="#F7F1E5" stroke="#0A0B0B" stroke-width="3"/>
           <line x1="169" y1="176" x2="169" y2="220" stroke="#0A0B0B" stroke-width="2"/>
           <line x1="230" y1="176" x2="230" y2="220" stroke="#0A0B0B" stroke-width="2"/>
           <line x1="291" y1="176" x2="291" y2="220" stroke="#0A0B0B" stroke-width="2"/>
           <text x="230" y="238" text-anchor="middle" font-size="11" font-weight="700" fill="#0A0B0B">展开状态：中央主板 + 左右侧翼 + 底部叙事台座（Predella）</text>`
        : `<rect x="8" y="8" width="444" height="234" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="3"/>
           <rect x="130" y="22" width="200" height="184" fill="#E1DCD2" stroke="#0A0B0B" stroke-width="4"/>
           <line x1="230" y1="22" x2="230" y2="206" stroke="#0A0B0B" stroke-width="4"/>
           <line x1="130" y1="110" x2="330" y2="110" stroke="#0A0B0B" stroke-width="2.5"/>
           <rect x="148" y="42" width="64" height="50" fill="#37AEC5" opacity="0.5"/>
           <rect x="248" y="42" width="64" height="50" fill="#37AEC5" opacity="0.5"/>
           <rect x="158" y="128" width="44" height="60" fill="#2A3A3E"/>
           <rect x="258" y="128" width="44" height="60" fill="#2A3A3E"/>
           <text x="230" y="232" text-anchor="middle" font-size="11" font-weight="700" fill="#0A0B0B">闭合状态：日常素雅四格灰调，节庆日才向外展开 12 板彩绘</text>`,
  },
  byobu: {
    year: "16–17C · JAPANESE BYŌBU",
    title: "东亚六曲屏风：可分可合的连续折面",
    body: "大都会艺术博物馆所藏的江户时代六曲折屏（Byōbu）用柔韧纸铰链连接六扇窄板。和欧洲厚木框祭坛画不同，折屏不以粗框切死画面，而是利用物理折痕制造节奏——既能单扇独立成景，又能整面连成从右向左推进的长篇风物叙事。",
    takeaway: "<strong>留给今天的设计基因：</strong>隔缝不必总是厚黑墙，轻微折线与节奏断句同样能把长叙事分成可呼吸的片段。",
    hasWings: false,
    render: () =>
      `<rect x="8" y="8" width="444" height="234" fill="#F7F1E5" stroke="#0A0B0B" stroke-width="3"/>
       <polygon points="34,42 98,30 98,196 34,208" fill="#FCF9F2" stroke="#0A0B0B" stroke-width="2.5"/>
       <polygon points="98,30 162,42 162,208 98,196" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="2.5"/>
       <polygon points="162,42 226,30 226,196 162,208" fill="#FCF9F2" stroke="#0A0B0B" stroke-width="2.5"/>
       <polygon points="226,30 290,42 290,208 226,196" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="2.5"/>
       <polygon points="290,42 354,30 354,196 290,208" fill="#FCF9F2" stroke="#0A0B0B" stroke-width="2.5"/>
       <polygon points="354,30 418,42 418,208 354,196" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="2.5"/>
       <path d="M40 168 Q128 96 226 142 T410 112" fill="none" stroke="#028B93" stroke-width="10"/>
       <circle cx="378" cy="76" r="16" fill="#F26545"/>
       <path d="M402 226 H64" stroke="#B5351A" stroke-width="2.5" stroke-dasharray="6 4"/>
       <polygon points="56,226 68,220 68,232" fill="#B5351A"/>
       <text x="230" y="236" text-anchor="middle" font-size="11" font-weight="700" fill="#0A0B0B">六扇纸铰链折屏：单扇成景，合看自右向左连续叙事</text>`,
  },
  "1837": {
    year: "1837 · RODOLPHE TÖPFFER",
    title: "托普弗分格连环：图文配对推进时间",
    body: "1837 年，瑞士教师兼画家鲁道夫·托普弗（Rodolphe Töpffer）在日内瓦出版《老木头先生历险记》（Histoire de M. Vieux Bois），把带框小画按行连排，并在每格下方配手写字幕，被漫画史广泛视作现代分格叙事的起点。",
    takeaway: "<strong>留给今天的设计基因：</strong>宽格拉长停顿、窄格加快节奏，分格边框与文字协同决定读者的呼吸速度。",
    hasWings: false,
    render: () =>
      `<rect x="8" y="8" width="444" height="234" fill="#FCF9F2" stroke="#0A0B0B" stroke-width="3"/>
       <rect x="26" y="26" width="128" height="80" fill="#F7F1E5" stroke="#0A0B0B" stroke-width="2.5"/>
       <circle cx="64" cy="66" r="14" fill="#0A0B0B"/><rect x="88" y="54" width="48" height="10" fill="#37AEC5"/>
       <rect x="164" y="26" width="84" height="80" fill="#F7F1E5" stroke="#0A0B0B" stroke-width="2.5"/>
       <polygon points="184,84 206,44 228,84" fill="#F26545"/>
       <rect x="258" y="26" width="176" height="80" fill="#F7F1E5" stroke="#0A0B0B" stroke-width="2.5"/>
       <rect x="280" y="48" width="132" height="16" fill="#028B93"/><circle cx="394" cy="76" r="11" fill="#FABD3B"/>
       <rect x="26" y="114" width="128" height="8" fill="#0A0B0B"/><rect x="164" y="114" width="84" height="8" fill="#0A0B0B"/><rect x="258" y="114" width="176" height="8" fill="#0A0B0B"/>
       <rect x="26" y="140" width="212" height="72" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="2.5"/>
       <rect x="248" y="140" width="186" height="72" fill="#EAE4D7" stroke="#0A0B0B" stroke-width="2.5"/>
       <circle cx="96" cy="176" r="18" fill="#F26545"/><rect x="274" y="164" width="130" height="22" fill="#02737A"/>
       <text x="230" y="232" text-anchor="middle" font-size="11" font-weight="700" fill="#0A0B0B">连续分格 + 格下字幕：格宽不等控制时间快慢</text>`,
  },
  "1981": {
    year: "1981–1993 · GRID, CLOSURE & SMALL MULTIPLES",
    title: "瑞士网格、小倍图与当代数字便当盒",
    body: "1981 年约瑟夫·米勒-布罗克曼出版《平面设计中的网格系统》（Niggli Verlag），把出版物拆成按比例组合的模块域；随后艾斯纳（1985）、塔夫特（1990）与麦克劳德（1993）分别完善了分格时间、小倍图对比与格间闭包理论，汇流为今日的信息图、专题报版与网页 Bento 多面板界面。",
    takeaway: "<strong>留给今天的设计基因：</strong>用统一模数控制粗细与间距，让不对称的多块面板依然像同一座建筑的房间。",
    hasWings: false,
    render: () =>
      `<rect x="8" y="8" width="444" height="234" fill="#0A0B0B"/>
       <rect x="14" y="14" width="218" height="142" fill="#F7F1E5"/>
       <rect x="28" y="34" width="110" height="24" fill="#0A0B0B"/><rect x="28" y="66" width="66" height="24" fill="#0A0B0B"/><rect x="102" y="66" width="52" height="24" fill="#F26545"/>
       <rect x="28" y="102" width="128" height="8" fill="#028B93"/>
       <rect x="238" y="14" width="208" height="74" fill="#F7F1E5"/>
       <rect x="238" y="14" width="208" height="18" fill="#37AEC5"/>
       <circle cx="282" cy="58" r="16" fill="#37AEC5"/><path d="M306 42 A16 16 0 0 1 306 74 Z" fill="#F26545"/>
       <rect x="238" y="94" width="208" height="62" fill="#02737A"/>
       <rect x="254" y="112" width="110" height="8" fill="#F7F1E5"/><rect x="254" y="128" width="150" height="6" fill="#BEE4E6"/>
       <rect x="14" y="162" width="218" height="74" fill="#EAE4D7"/>
       <rect x="238" y="162" width="208" height="74" fill="#F7F1E5"/>
       <rect x="238" y="162" width="208" height="18" fill="#FABD3B"/>
       <rect x="256" y="192" width="54" height="32" fill="#028B93"/><rect x="320" y="192" width="54" height="32" fill="#F26545"/><rect x="384" y="192" width="46" height="32" fill="#FABD3B"/>`,
  },
};

function renderEra() {
  const era = ERAS[currentEra];
  $("#era-year").textContent = era.year;
  $("#era-title").textContent = era.title;
  $("#era-body").textContent = era.body;
  $("#era-takeaway").innerHTML = era.takeaway;
  $("#era-svg").innerHTML = era.render(wingsOpen);
  const wingBtn = $("#wing-toggle");
  wingBtn.hidden = !era.hasWings;
  wingBtn.setAttribute("aria-pressed", String(wingsOpen));
  wingBtn.textContent = wingsOpen ? "合上左右翼板" : "展开 12 板彩绘";
}

$$("#history-board .hb-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentEra = btn.dataset.era;
    $$("#history-board .hb-btn").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    renderEra();
  });
});
$("#wing-toggle").addEventListener("click", () => {
  wingsOpen = !wingsOpen;
  renderEra();
});
renderEra();

// ==================== 6. 第 05 节：拆墙对照实验 ====================
let rescueCase = "hero";
let rescueFixed = false;

const RESCUE_CASES = {
  hero: {
    badNote: "把一张完整日落海景强行切成四块独立面板，地平线和主体被黑缝劈碎，情绪张力立刻归零。",
    goodNote: "拆掉多余隔板，改用 140 图片主导版式：完整地平线与大日轮一击即中，文字安静退到一角。",
    badSvg: `<defs>
        <clipPath id="rc-q1"><rect x="16" y="16" width="171" height="96"/></clipPath>
        <clipPath id="rc-q2"><rect x="193" y="16" width="171" height="96"/></clipPath>
        <clipPath id="rc-q3"><rect x="16" y="118" width="171" height="96"/></clipPath>
        <clipPath id="rc-q4"><rect x="193" y="118" width="171" height="96"/></clipPath>
      </defs>
      <rect x="10" y="10" width="360" height="210" fill="#0A0B0B"/>
      <g clip-path="url(#rc-q1)"><rect x="16" y="16" width="171" height="96" fill="#F7F1E5"/><rect x="16" y="88" width="171" height="24" fill="#02737A"/></g>
      <g clip-path="url(#rc-q2)"><rect x="193" y="16" width="171" height="96" fill="#F7F1E5"/><circle cx="204" cy="106" r="32" fill="#F26545"/></g>
      <g clip-path="url(#rc-q3)"><rect x="16" y="118" width="171" height="96" fill="#02737A"/><rect x="34" y="148" width="90" height="8" fill="#F7F1E5"/></g>
      <g clip-path="url(#rc-q4)"><rect x="193" y="118" width="171" height="96" fill="#02737A"/><circle cx="204" cy="126" r="32" fill="#F26545"/></g>
      <line x1="190" y1="10" x2="190" y2="220" stroke="#F26545" stroke-width="3" stroke-dasharray="6 4"/>
      <line x1="10" y1="115" x2="370" y2="115" stroke="#F26545" stroke-width="3" stroke-dasharray="6 4"/>`,
    goodSvg: `<rect x="10" y="10" width="360" height="210" fill="#F7F1E5" stroke="#0A0B0B" stroke-width="4"/>
      <rect x="12" y="138" width="356" height="80" fill="#02737A"/>
      <circle cx="268" cy="88" r="34" fill="#F26545"/>
      <rect x="30" y="34" width="116" height="16" fill="#0A0B0B"/>
      <rect x="30" y="58" width="84" height="7" fill="#02737A"/>`,
  },
  essay: {
    badNote: "一篇连贯长文被硬拆成四块小方块，读者每读 4 行就被黑线和跳栏打断，思路碎成四截。",
    goodNote: "拆掉内部分格，改用 141 文字主导版式：单栏舒适行宽 + 清晰段距，阅读一口气走到底。",
    badSvg: `<rect x="10" y="10" width="360" height="210" fill="#0A0B0B"/>
      <rect x="16" y="16" width="171" height="96" fill="#FCF9F2"/><g fill="#0A0B0B"><rect x="28" y="30" width="136" height="6"/><rect x="28" y="44" width="144" height="5"/><rect x="28" y="56" width="128" height="5"/><rect x="28" y="68" width="140" height="5"/><rect x="28" y="80" width="90" height="5"/></g>
      <rect x="193" y="16" width="171" height="96" fill="#FCF9F2"/><g fill="#0A0B0B"><rect x="205" y="30" width="140" height="5"/><rect x="205" y="42" width="132" height="5"/><rect x="205" y="54" width="146" height="5"/><rect x="205" y="66" width="112" height="5"/></g>
      <rect x="16" y="118" width="171" height="96" fill="#FCF9F2"/><g fill="#0A0B0B"><rect x="28" y="134" width="144" height="5"/><rect x="28" y="146" width="122" height="5"/><rect x="28" y="158" width="140" height="5"/></g>
      <rect x="193" y="118" width="171" height="96" fill="#FCF9F2"/><g fill="#0A0B0B"><rect x="205" y="134" width="130" height="5"/><rect x="205" y="146" width="144" height="5"/><rect x="205" y="158" width="96" height="5"/></g>`,
    goodSvg: `<rect x="10" y="10" width="360" height="210" fill="#FCF9F2" stroke="#0A0B0B" stroke-width="4"/>
      <rect x="70" y="28" width="160" height="14" fill="#0A0B0B"/>
      <rect x="70" y="50" width="44" height="4" fill="#F26545"/>
      <g fill="#3D4344">
        <rect x="70" y="68" width="240" height="6"/><rect x="70" y="82" width="232" height="6"/><rect x="70" y="96" width="240" height="6"/><rect x="70" y="110" width="196" height="6"/>
        <rect x="70" y="134" width="240" height="6"/><rect x="70" y="148" width="228" height="6"/><rect x="70" y="162" width="240" height="6"/><rect x="70" y="176" width="172" height="6"/>
      </g>`,
  },
  mobile: {
    badNote: "在 390px 窄屏里硬保桌面三列多面板，每格只剩火柴盒宽，字行被挤成竖串，图示全变形。",
    goodNote: "窄屏按阅读顺序自动折成「全宽主板 + 双小卡」：保留多面板分工，同时每块都能痛快呼吸。",
    badSvg: `<rect x="118" y="10" width="144" height="210" fill="#0A0B0B"/>
      <rect x="124" y="16" width="41" height="198" fill="#F7F1E5"/><rect x="128" y="28" width="32" height="6" fill="#F26545"/><rect x="128" y="42" width="28" height="5" fill="#0A0B0B"/><rect x="128" y="54" width="32" height="5" fill="#0A0B0B"/><rect x="128" y="66" width="22" height="5" fill="#0A0B0B"/>
      <rect x="169" y="16" width="42" height="198" fill="#02737A"/><rect x="174" y="28" width="32" height="6" fill="#FABD3B"/><rect x="174" y="42" width="26" height="5" fill="#F7F1E5"/>
      <rect x="215" y="16" width="41" height="198" fill="#EAE4D7"/><rect x="220" y="28" width="30" height="6" fill="#37AEC5"/><rect x="220" y="42" width="24" height="5" fill="#0A0B0B"/>`,
    goodSvg: `<rect x="118" y="10" width="144" height="210" fill="#0A0B0B"/>
      <rect x="124" y="16" width="132" height="102" fill="#F7F1E5"/><rect x="124" y="16" width="132" height="18" fill="#F26545"/><rect x="134" y="48" width="84" height="14" fill="#0A0B0B"/><rect x="134" y="70" width="52" height="14" fill="#0A0B0B"/><rect x="192" y="70" width="36" height="14" fill="#F26545"/>
      <rect x="124" y="122" width="64" height="92" fill="#02737A"/><rect x="132" y="140" width="44" height="6" fill="#F7F1E5"/><rect x="132" y="154" width="48" height="5" fill="#BEE4E6"/>
      <rect x="192" y="122" width="64" height="92" fill="#EAE4D7"/><rect x="192" y="122" width="64" height="16" fill="#FABD3B"/><circle cx="224" cy="174" r="16" fill="#37AEC5"/>`,
  },
};

function renderRescue() {
  const c = RESCUE_CASES[rescueCase];
  $("#rescue-svg").innerHTML = rescueFixed ? c.goodSvg : c.badSvg;
  $("#rescue-note").textContent = rescueFixed ? c.goodNote : c.badNote;
  const tBtn = $("#rescue-toggle");
  tBtn.setAttribute("aria-pressed", String(rescueFixed));
  tBtn.textContent = rescueFixed ? "← 切回硬用多面板的错版" : "拆掉隔板，换回合适版式 →";
}

$$("#rescue-box .rb-case").forEach((btn) => {
  btn.addEventListener("click", () => {
    rescueCase = btn.dataset.case;
    rescueFixed = false;
    $$("#rescue-box .rb-case").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    renderRescue();
  });
});
$("#rescue-toggle").addEventListener("click", () => {
  rescueFixed = !rescueFixed;
  renderRescue();
});
renderRescue();

// ==================== 7. 第 06 节：四选一小练习 ====================
const QUIZ_ANSWERS = {
  A: {
    right: false,
    title: "选了 A · 错在「均分平权」",
    text: "A 版的顺序与色阶都克制，但四块面板按 2×2 各占 25% 完全均分，① 主视觉与 ④ 结论摘要一样大，视线进页缺少第一落点。正确答案是 C。",
  },
  B: {
    right: false,
    title: "选了 B · 错在「路径倒置交叉」",
    text: "B 版把最大块给了 ①，色彩也克制，却把 ① 主视觉放在右下、④ 结论放在左上，阅读路线从右下逆行回跳并斜穿画面。正确答案是 C。",
  },
  C: {
    right: true,
    title: "选对了 C · 面积、路径、色阶三项同时成立",
    text: "① 主视觉占左上 46% 稳立入口，② 结构图与 ③ 核心数据在右侧依次承接，④ 结论摘要在底带收口；路径单向无交叉，仅用一块深青底色定锚。",
  },
  D: {
    right: false,
    title: "选了 D · 错在「全员高饱和满铺」",
    text: "D 版的面积比例和阅读顺序与 C 完全相同，却给 4 块面板各自涂满珊瑚红、天青、深青、明黄四种高饱和底色，互相拉扯视线反而抹平了原本很好的大小层级。正确答案是 C。",
  },
};

const quizGrid = $("#quiz-grid");
$$(".q-card", quizGrid).forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const res = QUIZ_ANSWERS[opt];
    quizGrid.classList.add("is-revealed");
    $$(".q-card", quizGrid).forEach((c) => {
      const k = c.dataset.opt;
      c.setAttribute("aria-pressed", String(k === opt));
      if (k === "C") c.dataset.state = "right";
      else if (k === opt) c.dataset.state = "wrong";
      else delete c.dataset.state;
    });
    const v = $("#quiz-verdict");
    v.dataset.result = res.right ? "right" : "wrong";
    $("#qv-title").textContent = res.title;
    $("#qv-text").textContent = res.text;
  });
});

// ==================== 8. 第 07 节：原海报放大灯箱 ====================
const posterOpen = $("#poster-open");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbZoomBtn = $("#lb-zoom");
const lbCloseBtn = $("#lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomBtn.textContent = lbScale > 1 ? "还原 1.0×" : "放大 1.8×";
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterOpen.setAttribute("aria-expanded", "true");
  lbCloseBtn.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpen.setAttribute("aria-expanded", "false");
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbCloseBtn.addEventListener("click", closeLightbox);
lbZoomBtn.addEventListener("click", () => {
  lbScale = lbScale > 1 ? 1 : 1.8;
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
lbStage.addEventListener("click", (e) => {
  if (e.target === lbStage) closeLightbox();
});
lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDragging = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbStage.classList.add("is-panning");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbDragging = false;
  lbStage.classList.remove("is-panning");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
