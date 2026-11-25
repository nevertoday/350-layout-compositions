// 019 非对称构图 — 开场通栏包豪斯配重画板（2D Canvas + 原海报三段诊断联动）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  SCALE_MAX,
  SCALE_MIN,
  SCENARIO_MAP,
  TRAY_MAP,
  dotsText,
  evaluateStage,
} from "./model.js";

const CLAMP_MIN_X = 0.08;
const CLAMP_MAX_X = 0.92;
const CLAMP_MIN_Y = 0.14;
const CLAMP_MAX_Y = 0.85;
const BAR_H = 38;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 统一按画板宽高联合缩放（绝不只按 minDim，保证宽屏和竖屏上视觉体量都真实可感且严格等比）
function getSizeRef(w, playH) {
  return Math.min(playH * 1.48, Math.sqrt(Math.max(1, w) * Math.max(1, playH)));
}

// 统一几何尺寸源：供画板绘制、命中检测、选中把手框和右下缩放柄共用
function getPieceBox(def, sizeRef, scale = 1) {
  const s = scale;
  const kind = def.kind;
  if (kind === "primary-circle" || kind === "giantcircle") {
    const r = def.radius * sizeRef * s;
    return { w: r * 2, h: r * 2, r };
  }
  if (kind === "primary-plate") {
    const rw = def.radius * sizeRef * 1.38 * s;
    const rh = def.radius * sizeRef * 1.72 * s;
    return { w: rw, h: rh, r: Math.max(rw, rh) * 0.52 };
  }
  if (kind === "smallcircle") {
    const r = Math.max(11, def.radius * sizeRef * s);
    return { w: r * 2, h: r * 2, r };
  }
  if (kind === "wedge") {
    const side = Math.max(46, def.radius * sizeRef * 1.85 * s);
    return { w: side * 1.08, h: side * 0.96, r: side * 0.56, side };
  }
  if (kind === "textblock") {
    const bw = Math.max(76, def.radius * sizeRef * 2.15 * s);
    const bh = Math.max(44, bw * 0.6);
    return { w: bw, h: bh, r: Math.hypot(bw, bh) * 0.45 };
  }
  if (kind === "matrix") {
    const side = Math.max(48, def.radius * sizeRef * 1.85 * s);
    return { w: side, h: side, r: side * 0.58, side };
  }
  if (kind === "points") {
    const bw = Math.max(82, def.radius * sizeRef * 2.12 * s);
    const bh = Math.max(62, bw * 0.78);
    return { w: bw, h: bh, r: Math.hypot(bw, bh) * 0.46 };
  }
  const r = (def.radius || 0.08) * sizeRef * s;
  return { w: r * 2, h: r * 2, r };
}

export function initHero() {
  const stageEl = document.getElementById("hero-stage");
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d");
  const handleEl = document.getElementById("piece-handle");
  const scaleHandleEl = document.getElementById("piece-scale-handle");
  const trayGrid = document.getElementById("tray-grid");

  // 诊断 DOM
  const elWhyBox = document.getElementById("diag-why-box");
  const elTierBadge = document.getElementById("diag-tier-badge");
  const elTitle = document.getElementById("diag-title");
  const elDesc = document.getElementById("diag-desc");
  const elMirrorLink = document.getElementById("diag-mirror-link");
  const elLeftDots = document.getElementById("diag-left-dots");
  const elRightDots = document.getElementById("diag-right-dots");
  const elOp = document.getElementById("diag-op");
  const elContrastCount = document.getElementById("diag-contrast-count");
  const elContrastList = document.getElementById("diag-contrast-list");
  const elRulesList = document.getElementById("diag-rules-list");
  const elLandTier = document.getElementById("land-tier");
  const elLandMeta = document.getElementById("land-meta");

  const scTabs = [...document.querySelectorAll(".sc-tab")];
  const btnSolution = document.getElementById("btn-solution");
  const btnReset = document.getElementById("btn-reset");
  const trayTiles = [...trayGrid.querySelectorAll(".tray-tile")];

  // 状态：只存画框内归一化位置 (0..1) 与缩放因子 (SCALE_MIN..SCALE_MAX)
  const state = {
    scenarioId: "poster",
    placed: [],
    selectedId: null,
    draggingId: null,
    dragMode: null, // "move" | "scale"
    dragOffset: { x: 0, y: 0 },
    scaleStartDist: 40,
    scaleStartVal: 1,
    intro: reducedMotion.matches ? 1 : 0,
    beamTilt: 0.7,
    flowPhase: 0,
    dirty: true,
    w: 900,
    h: 420,
    dpr: 1,
    evalResult: null,
  };

  function clonePlaced(list) {
    return list.map((p) => ({ id: p.id, x: p.x, y: p.y, scale: p.scale ?? 1 }));
  }

  function loadScenario(id, useSolution = false) {
    const sc = SCENARIO_MAP[id] || SCENARIO_MAP.poster;
    state.scenarioId = sc.id;
    state.placed = clonePlaced(useSolution ? sc.solutionPlaced : sc.initialPlaced);
    state.selectedId = state.placed.length ? state.placed[state.placed.length - 1].id : null;
    for (const tab of scTabs) {
      tab.setAttribute("aria-selected", tab.dataset.scenario === sc.id ? "true" : "false");
    }
    recompute();
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(180, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (w !== state.w || h !== state.h || dpr !== state.dpr) {
      state.w = w;
      state.h = h;
      state.dpr = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      state.dirty = true;
      syncHandlePosition();
    }
  }

  function syncHandlePosition() {
    const sel = state.placed.find((p) => p.id === state.selectedId) || state.placed[0];
    if (!sel) {
      handleEl.classList.add("is-hidden");
      handleEl.setAttribute("tabindex", "-1");
      if (scaleHandleEl) {
        scaleHandleEl.classList.add("is-hidden");
        scaleHandleEl.setAttribute("tabindex", "-1");
      }
      return;
    }
    state.selectedId = sel.id;
    handleEl.classList.remove("is-hidden");
    handleEl.setAttribute("tabindex", "0");
    if (scaleHandleEl) {
      scaleHandleEl.classList.remove("is-hidden");
      scaleHandleEl.setAttribute("tabindex", "0");
    }

    const def = TRAY_MAP[sel.id];
    const playH = Math.max(120, state.h - BAR_H);
    const sizeRef = getSizeRef(state.w, playH);
    const box = getPieceBox(def, sizeRef, sel.scale ?? 1);

    const pad = 12;
    const hw = Math.max(48, Math.min(state.w * 0.44, Math.round(box.w + pad)));
    const hh = Math.max(48, Math.min(playH * 0.68, Math.round(box.h + pad)));
    const cx = sel.x * state.w;
    const cy = sel.y * playH;

    handleEl.style.left = `${cx.toFixed(1)}px`;
    handleEl.style.top = `${cy.toFixed(1)}px`;
    handleEl.style.width = `${hw}px`;
    handleEl.style.height = `${hh}px`;
    handleEl.setAttribute(
      "aria-label",
      `当前选中零件：${def ? def.label : sel.id}（大小 ${Math.round((sel.scale ?? 1) * 100)}%）。拖动或按方向键调位置，按加减号调大小，按 Delete 撤回`
    );

    if (scaleHandleEl) {
      const sx = clamp(cx + hw / 2, 22, state.w - 14);
      const sy = clamp(cy + hh / 2, 22, playH - 14);
      scaleHandleEl.style.left = `${sx.toFixed(1)}px`;
      scaleHandleEl.style.top = `${sy.toFixed(1)}px`;
      scaleHandleEl.setAttribute(
        "aria-label",
        `缩放「${def ? def.label : sel.id}」（当前 ${Math.round((sel.scale ?? 1) * 100)}%），拖动或按方向键放大缩小`
      );
    }
  }

  function updateDomFromEval(ev) {
    elWhyBox.dataset.tone = ev.verdictTone;
    elTierBadge.textContent = ev.verdictTag;
    elTitle.textContent = ev.verdictTitle;
    elDesc.textContent = ev.verdictWhy;
    elMirrorLink.hidden = !ev.isMirrorTrap;

    elLeftDots.textContent = dotsText(ev.leftDots) || "○";
    elRightDots.textContent = dotsText(ev.rightDots) || "○";
    elLeftDots.setAttribute("aria-label", `左侧视觉重量 ${ev.leftDots} 级`);
    elRightDots.setAttribute("aria-label", `右侧视觉重量 ${ev.rightDots} 级`);
    elOp.textContent = ev.tier.side === "even" ? "≈" : ev.tier.side === "right" ? "<" : ">";

    elContrastCount.textContent = `${ev.contrastCount} / 5`;
    for (const li of elContrastList.querySelectorAll("li[data-cid]")) {
      const on = Boolean(ev.contrasts[li.dataset.cid]);
      li.dataset.on = on ? "true" : "false";
    }

    for (const li of elRulesList.querySelectorAll("li[data-rid]")) {
      const on = Boolean(ev.rules[li.dataset.rid]);
      li.dataset.on = on ? "true" : "false";
    }

    // 同步横屏紧凑底条
    elLandTier.textContent = ev.verdictTag;
    const activeNames = ev.activeContrasts.map((c) => c.short).join("·");
    elLandMeta.textContent = ev.isMirrorTrap
      ? "0 项对比 · 退回对称"
      : ev.isPass
        ? `已靠 ${activeNames} 托住右侧`
        : `对比 ${ev.contrastCount}/5 · 左${dotsText(ev.leftDots)} 右${dotsText(ev.rightDots)}`;

    // 同步料盒按钮状态
    const placedSet = new Set(state.placed.map((p) => p.id));
    for (const tile of trayTiles) {
      const on = placedSet.has(tile.dataset.piece);
      tile.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function recompute() {
    const ev = evaluateStage(state.scenarioId, state.placed);
    state.evalResult = ev;
    updateDomFromEval(ev);
    syncHandlePosition();
    state.dirty = true;
    ticker.draw();
  }

  function clientToNorm(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const playH = Math.max(120, rect.height - BAR_H);
    let nx = (clientX - rect.left) / Math.max(1, rect.width);
    let ny = (clientY - rect.top) / playH;
    nx = clamp(nx, CLAMP_MIN_X, CLAMP_MAX_X);
    ny = clamp(ny, CLAMP_MIN_Y, CLAMP_MAX_Y);
    return { x: nx, y: ny };
  }

  function clientToLocal(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function hitTestPiece(nx, ny) {
    const playH = Math.max(120, state.h - BAR_H);
    const sizeRef = getSizeRef(state.w, playH);
    const px = nx * state.w;
    const py = ny * playH;
    for (let i = state.placed.length - 1; i >= 0; i--) {
      const item = state.placed[i];
      const def = TRAY_MAP[item.id];
      const box = getPieceBox(def, sizeRef, item.scale ?? 1);
      const halfW = Math.max(26, box.w * 0.56);
      const halfH = Math.max(26, box.h * 0.56);
      const dx = Math.abs(px - item.x * state.w);
      const dy = Math.abs(py - item.y * playH);
      if (dx <= halfW && dy <= halfH) return item;
    }
    return null;
  }

  function togglePiece(pieceId, dropPos = null) {
    const idx = state.placed.findIndex((p) => p.id === pieceId);
    if (idx >= 0 && !dropPos) {
      state.placed.splice(idx, 1);
      if (state.selectedId === pieceId) {
        state.selectedId = state.placed.length ? state.placed[state.placed.length - 1].id : null;
      }
    } else if (idx >= 0 && dropPos) {
      state.placed[idx].x = dropPos.x;
      state.placed[idx].y = dropPos.y;
      state.selectedId = pieceId;
    } else {
      const def = TRAY_MAP[pieceId];
      if (!def) return;
      const pos = dropPos || { ...def.defaultPos };
      let tx = pos.x;
      let ty = pos.y;
      for (const ex of state.placed) {
        if (Math.hypot(ex.x - tx, ex.y - ty) < 0.06) {
          ty = clamp(ty + 0.09, CLAMP_MIN_Y, CLAMP_MAX_Y);
        }
      }
      state.placed.push({ id: pieceId, x: tx, y: ty, scale: 1 });
      state.selectedId = pieceId;
    }
    recompute();
  }

  // ==================== 绘制包豪斯几何件（按 sizeRef 等比绘制，视觉重量真实可感） ====================
  function drawPieceGraphic(def, cx, cy, sizeRef, isSelected, scale = 1) {
    ctx.save();
    ctx.translate(cx, cy);

    const box = getPieceBox(def, sizeRef, scale);
    const kind = def.kind;

    if (kind === "primary-circle") {
      ctx.fillStyle = PALETTE.red;
      ctx.beginPath();
      ctx.arc(0, 0, box.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "primary-plate") {
      const rw = box.w;
      const rh = box.h;
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
      ctx.fillStyle = PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(rw * 0.14, -rh * 0.16, rw * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(-rw * 0.36, rh * 0.22, rw * 0.56, Math.max(4, rh * 0.055));
      ctx.fillRect(-rw * 0.36, rh * 0.32, rw * 0.36, Math.max(3, rh * 0.036));
    } else if (kind === "giantcircle") {
      ctx.fillStyle = PALETTE.red;
      ctx.beginPath();
      ctx.arc(0, 0, box.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();
    } else if (kind === "smallcircle") {
      ctx.fillStyle = PALETTE.blue;
      ctx.beginPath();
      ctx.arc(0, 0, box.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "wedge") {
      const s = box.side;
      ctx.fillStyle = PALETTE.blue;
      ctx.beginPath();
      ctx.moveTo(-s * 0.54, s * 0.46);
      ctx.lineTo(s * 0.54, s * 0.46);
      ctx.lineTo(s * 0.54, -s * 0.48);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "textblock") {
      const bw = box.w;
      const bh = box.h;
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh * 0.36);
      ctx.fillRect(-bw / 2, -bh * 0.03, bw * 0.82, bh * 0.19);
      ctx.fillRect(-bw / 2, bh * 0.25, bw * 0.62, bh * 0.14);
      ctx.fillStyle = PALETTE.yellow;
      ctx.fillRect(-bw / 2 + Math.max(5, bw * 0.05), -bh / 2 + bh * 0.12, bw * 0.36, Math.max(2.5, bh * 0.09));
    } else if (kind === "matrix") {
      const s = box.side;
      const step = s / 3;
      const dr = Math.max(4, s * 0.088);
      ctx.fillStyle = PALETTE.ink;
      for (let gy = 0; gy < 4; gy++) {
        for (let gx = 0; gx < 4; gx++) {
          ctx.beginPath();
          ctx.arc(-s / 2 + gx * step, -s / 2 + gy * step, dr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (kind === "points") {
      const bw = box.w;
      const bh = box.h;
      const cr = Math.max(9, bh * 0.145);
      for (let i = 0; i < 3; i++) {
        const yy = -bh * 0.34 + i * bh * 0.34;
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(-bw * 0.36, yy, cr, 0, Math.PI * 2);
        ctx.fill();
        // 原海报三圆内极简黄符号：天平 / 闪电 / 斜箭头
        ctx.fillStyle = PALETTE.yellow;
        ctx.strokeStyle = PALETTE.yellow;
        if (i === 0) {
          ctx.fillRect(-bw * 0.36 - cr * 0.5, yy - 1.5, cr, 3);
          ctx.beginPath();
          ctx.moveTo(-bw * 0.36, yy + 1);
          ctx.lineTo(-bw * 0.36 - cr * 0.28, yy + cr * 0.45);
          ctx.lineTo(-bw * 0.36 + cr * 0.28, yy + cr * 0.45);
          ctx.closePath();
          ctx.fill();
        } else if (i === 1) {
          ctx.beginPath();
          ctx.moveTo(-bw * 0.36 + cr * 0.12, yy - cr * 0.52);
          ctx.lineTo(-bw * 0.36 - cr * 0.3, yy + cr * 0.05);
          ctx.lineTo(-bw * 0.36 + cr * 0.02, yy + cr * 0.05);
          ctx.lineTo(-bw * 0.36 - cr * 0.12, yy + cr * 0.52);
          ctx.lineTo(-bw * 0.36 + cr * 0.32, yy - cr * 0.06);
          ctx.lineTo(-bw * 0.36, yy - cr * 0.06);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.lineWidth = Math.max(2, cr * 0.18);
          ctx.beginPath();
          ctx.moveTo(-bw * 0.36 - cr * 0.32, yy + cr * 0.32);
          ctx.lineTo(-bw * 0.36 + cr * 0.32, yy - cr * 0.32);
          ctx.moveTo(-bw * 0.36 - cr * 0.05, yy - cr * 0.32);
          ctx.lineTo(-bw * 0.36 + cr * 0.32, yy - cr * 0.32);
          ctx.lineTo(-bw * 0.36 + cr * 0.32, yy + cr * 0.05);
          ctx.stroke();
        }
        ctx.fillStyle = PALETTE.ink;
        ctx.fillRect(-bw * 0.18, yy - cr * 0.55, bw * (0.64 - i * 0.05), Math.max(5, cr * 0.48));
        ctx.fillRect(-bw * 0.18, yy + cr * 0.1, bw * (0.52 + i * 0.04), Math.max(3.2, cr * 0.28));
        ctx.fillRect(-bw * 0.18, yy + cr * 0.52, bw * (0.38 - i * 0.03), Math.max(2.4, cr * 0.22));
      }
    }

    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    const ev = state.evalResult;
    if (!ev) return;

    const targetTilt = ev.tier.tiltSign * ev.tier.tiltLevel;
    let needsMore = false;

    if (still) {
      state.intro = 1;
      state.beamTilt = targetTilt;
      state.flowPhase = 0.42;
    } else {
      if (state.intro < 1) {
        state.intro = Math.min(1, state.intro + (dt || 0.016) * 2.2);
        needsMore = true;
      }
      const diff = targetTilt - state.beamTilt;
      if (Math.abs(diff) > 0.004) {
        state.beamTilt += diff * Math.min(1, (dt || 0.016) * 9.5);
        needsMore = true;
      } else {
        state.beamTilt = targetTilt;
      }
      if (ev.isPass) {
        state.flowPhase = (state.flowPhase + (dt || 0.016) * 0.38) % 1;
        needsMore = true;
      }
    }

    if (!state.dirty && !needsMore) return;
    state.dirty = false;

    const W = state.w;
    const H = state.h;
    const dpr = state.dpr;
    const playH = H - BAR_H;
    const sizeRef = getSizeRef(W, playH);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 纯平涂铬黄纸底
    ctx.fillStyle = PALETTE.yellow;
    ctx.fillRect(0, 0, W, H);

    // 2. 命题专属极简结构线
    ctx.save();
    ctx.strokeStyle = "rgba(11, 10, 8, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 10);
    ctx.lineTo(W * 0.5, playH - 2);
    ctx.stroke();

    if (ev.scenario.bgAccent === "magazine-fold") {
      ctx.strokeStyle = "rgba(11, 10, 8, 0.35)";
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 0);
      ctx.lineTo(W * 0.5, playH);
      ctx.stroke();
    } else if (ev.scenario.bgAccent === "exhibition-grid") {
      for (const fx of [0.25, 0.5, 0.75]) {
        ctx.beginPath();
        ctx.moveTo(W * fx, 0);
        ctx.lineTo(W * fx, playH);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 3. 原海报固定大元素：右下占近半版面的群青直角大三角（实色平涂，忠实复刻 019 母题）
    const easeIntro = 1 - Math.pow(1 - state.intro, 3);
    for (const fx of ev.fixedExtras || []) {
      if (fx.kind === "corner-triangle") {
        ctx.save();
        ctx.fillStyle = PALETTE.blue;
        const leftFoot = W * (1 - 0.46 * (0.85 + 0.15 * easeIntro));
        const topEdge = playH * (1 - 0.76 * (0.85 + 0.15 * easeIntro));
        ctx.beginPath();
        ctx.moveTo(leftFoot, playH);
        ctx.lineTo(W, playH);
        ctx.lineTo(W, topEdge);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 4. 计算主块坐标与 45° 黑色点线动线
    const ax = ev.anchor.x * W;
    const ay = ev.anchor.y * playH;
    const anchorBox = getPieceBox(ev.anchor, sizeRef, 1);

    const leftItems = ev.items.filter((it) => it.x < 0.52);
    const targetDot =
      leftItems.find((it) => it.id === "blue-dot") ||
      leftItems[0] ||
      null;

    if (ev.isMirrorTrap) {
      ctx.save();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 14);
      ctx.lineTo(W * 0.5, playH - 8);
      ctx.stroke();
      ctx.restore();
    } else if (targetDot) {
      const tx = targetDot.x * W;
      const ty = targetDot.y * playH;
      const dx = tx - ax;
      const dy = ty - ay;
      const dist = Math.hypot(dx, dy);
      if (dist > 40) {
        const ux = dx / dist;
        const uy = dy / dist;
        const targetBox = getPieceBox(targetDot, sizeRef, targetDot.scale ?? 1);
        const startPad = anchorBox.r + 12;
        const endPad = Math.max(18, targetBox.r + 10);
        const usable = Math.max(0, dist - startPad - endPad);
        const count = Math.max(5, Math.min(18, Math.floor(usable / 14)));

        ctx.save();
        for (let i = 0; i < count; i++) {
          const frac = count === 1 ? 0.5 : i / (count - 1);
          const px = ax + ux * (startPad + frac * usable);
          const py = ay + uy * (startPad + frac * usable);
          const r = (ev.isPass ? 3.3 : 2.3) * (1.15 - frac * 0.45);
          ctx.fillStyle = ev.isPass ? PALETTE.ink : "rgba(11, 10, 8, 0.44)";
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (ev.isPass && usable > 24) {
          const gx = ax + ux * (startPad + state.flowPhase * usable);
          const gy = ay + uy * (startPad + state.flowPhase * usable);
          ctx.fillStyle = PALETTE.blue;
          ctx.beginPath();
          ctx.arc(gx, gy, 5.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 5. 绘制右上锚定主块（朱红主圆 / 暖色主图版）
    drawPieceGraphic(ev.anchor, ax, ay, sizeRef, false, 0.78 + 0.22 * easeIntro);

    // 6. 绘制用户已放零件（按各自 scale 缩放）
    for (const item of ev.items) {
      const ix = item.x * W;
      const iy = item.y * playH;
      const isSel = item.id === state.selectedId;
      drawPieceGraphic(item, ix, iy, sizeRef, isSel, (item.scale ?? 1) * (0.86 + 0.14 * easeIntro));
    }

    // 7. 底沿 BAR_H：纯黑包豪斯无度数视觉支点平衡条
    ctx.save();
    ctx.fillStyle = PALETTE.yellow;
    ctx.fillRect(0, playH, W, BAR_H);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, playH);
    ctx.lineTo(W, playH);
    ctx.stroke();

    const cx = W * 0.5;
    const pivotY = playH + BAR_H * 0.52;
    const halfLen = Math.min(W * 0.34, 230);
    const maxAngle = Math.atan2(BAR_H * 0.28, halfLen);
    const tiltRad = state.beamTilt * maxAngle;

    ctx.save();
    ctx.translate(cx, pivotY);
    ctx.rotate(tiltRad);
    ctx.strokeStyle = ev.isPass ? PALETTE.blue : PALETTE.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-halfLen, 0);
    ctx.lineTo(halfLen, 0);
    ctx.stroke();
    ctx.fillStyle = PALETTE.blue;
    ctx.fillRect(-halfLen - 4, -5, 8, 10);
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(halfLen - 4, -5, 8, 10);
    ctx.restore();

    ctx.fillStyle = ev.isPass ? PALETTE.blue : PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(cx, pivotY + 2);
    ctx.lineTo(cx - 10, playH + BAR_H - 4);
    ctx.lineTo(cx + 10, playH + BAR_H - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  const ticker = loop(stageEl, renderFrame);

  // ==================== 鼠标、触摸与键盘交互（移动 + 缩放柄） ====================
  let activePointerId = null;

  function beginMove(piece, clientX, clientY, pointerId) {
    const pos = clientToNorm(clientX, clientY);
    state.draggingId = piece.id;
    state.dragMode = "move";
    state.selectedId = piece.id;
    state.dragOffset = { x: piece.x - pos.x, y: piece.y - pos.y };
    activePointerId = pointerId;
    syncHandlePosition();
    state.dirty = true;
    ticker.draw();
  }

  function beginScale(piece, clientX, clientY, pointerId) {
    const local = clientToLocal(clientX, clientY);
    const playH = Math.max(120, state.h - BAR_H);
    const cx = piece.x * state.w;
    const cy = piece.y * playH;
    state.draggingId = piece.id;
    state.dragMode = "scale";
    state.selectedId = piece.id;
    state.scaleStartDist = Math.max(24, Math.hypot(local.x - cx, local.y - cy));
    state.scaleStartVal = piece.scale ?? 1;
    activePointerId = pointerId;
    state.dirty = true;
    ticker.draw();
  }

  function moveActiveDrag(clientX, clientY) {
    if (!state.draggingId) return;
    const item = state.placed.find((p) => p.id === state.draggingId);
    if (!item) return;

    if (state.dragMode === "scale") {
      const local = clientToLocal(clientX, clientY);
      const playH = Math.max(120, state.h - BAR_H);
      const cx = item.x * state.w;
      const cy = item.y * playH;
      const curDist = Math.max(12, Math.hypot(local.x - cx, local.y - cy));
      const nextScale = clamp(state.scaleStartVal * (curDist / state.scaleStartDist), SCALE_MIN, SCALE_MAX);
      item.scale = +nextScale.toFixed(3);
      recompute();
      return;
    }

    const pos = clientToNorm(clientX, clientY);
    item.x = clamp(pos.x + state.dragOffset.x, CLAMP_MIN_X, CLAMP_MAX_X);
    item.y = clamp(pos.y + state.dragOffset.y, CLAMP_MIN_Y, CLAMP_MAX_Y);
    recompute();
  }

  function endDrag() {
    if (!state.draggingId) return;
    state.draggingId = null;
    state.dragMode = null;
    activePointerId = null;
  }

  // 把手拖动（兼容鼠标 Pointer 与 perf.mjs touch）
  handleEl.addEventListener("pointerdown", (e) => {
    const sel = state.placed.find((p) => p.id === state.selectedId);
    if (!sel) return;
    e.preventDefault();
    try { handleEl.setPointerCapture(e.pointerId); } catch {}
    beginMove(sel, e.clientX, e.clientY, e.pointerId);
  });

  // 缩放柄拖动（让「大小对比」成为真实手势）
  if (scaleHandleEl) {
    scaleHandleEl.addEventListener("pointerdown", (e) => {
      const sel = state.placed.find((p) => p.id === state.selectedId);
      if (!sel) return;
      e.preventDefault();
      e.stopPropagation();
      try { scaleHandleEl.setPointerCapture(e.pointerId); } catch {}
      beginScale(sel, e.clientX, e.clientY, e.pointerId);
    });

    scaleHandleEl.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches.length) return;
        const sel = state.placed.find((p) => p.id === state.selectedId);
        if (!sel) return;
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        beginScale(sel, touch.clientX, touch.clientY, null);
      },
      { passive: false }
    );

    scaleHandleEl.addEventListener("keydown", (e) => {
      const sel = state.placed.find((p) => p.id === state.selectedId);
      if (!sel) return;
      const step = e.shiftKey ? 0.16 : 0.08;
      if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "+" || e.key === "=") {
        e.preventDefault();
        sel.scale = +clamp((sel.scale ?? 1) + step, SCALE_MIN, SCALE_MAX).toFixed(3);
        recompute();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "-" || e.key === "_") {
        e.preventDefault();
        sel.scale = +clamp((sel.scale ?? 1) - step, SCALE_MIN, SCALE_MAX).toFixed(3);
        recompute();
      }
    });
  }

  // 画板内直接拖任意零件
  canvas.addEventListener("pointerdown", (e) => {
    const pos = clientToNorm(e.clientX, e.clientY);
    const hit = hitTestPiece(pos.x, pos.y);
    if (!hit) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    beginMove(hit, e.clientX, e.clientY, e.pointerId);
  });

  // 画板双击撤回命中零件
  canvas.addEventListener("dblclick", (e) => {
    const pos = clientToNorm(e.clientX, e.clientY);
    const hit = hitTestPiece(pos.x, pos.y);
    if (hit) togglePiece(hit.id);
  });

  window.addEventListener("pointermove", (e) => {
    if (!state.draggingId) return;
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    moveActiveDrag(e.clientX, e.clientY);
  });

  window.addEventListener("pointerup", () => endDrag());
  window.addEventListener("pointercancel", () => endDrag());

  // 显式兜底 touch 事件，保证 CDP touchStart/touchMove 100% 驱动拖动与重画
  handleEl.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const sel = state.placed.find((p) => p.id === state.selectedId);
      if (!sel) return;
      e.preventDefault();
      const touch = e.touches[0];
      beginMove(sel, touch.clientX, touch.clientY, null);
    },
    { passive: false }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!state.draggingId || !e.touches.length) return;
      const touch = e.touches[0];
      moveActiveDrag(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  window.addEventListener("touchend", () => endDrag());

  // 键盘操作：方向键微调力臂，+/- 调大小，Delete 撤回，R 重置
  handleEl.addEventListener("keydown", (e) => {
    const sel = state.placed.find((p) => p.id === state.selectedId);
    if (!sel) return;
    const step = e.shiftKey ? 0.05 : 0.025;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      sel.x = clamp(sel.x - step, CLAMP_MIN_X, CLAMP_MAX_X);
      recompute();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      sel.x = clamp(sel.x + step, CLAMP_MIN_X, CLAMP_MAX_X);
      recompute();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      sel.y = clamp(sel.y - step, CLAMP_MIN_Y, CLAMP_MAX_Y);
      recompute();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      sel.y = clamp(sel.y + step, CLAMP_MIN_Y, CLAMP_MAX_Y);
      recompute();
    } else if (e.key === "+" || e.key === "=" || e.key === "]") {
      e.preventDefault();
      sel.scale = +clamp((sel.scale ?? 1) + 0.1, SCALE_MIN, SCALE_MAX).toFixed(3);
      recompute();
    } else if (e.key === "-" || e.key === "_" || e.key === "[") {
      e.preventDefault();
      sel.scale = +clamp((sel.scale ?? 1) - 0.1, SCALE_MIN, SCALE_MAX).toFixed(3);
      recompute();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      togglePiece(sel.id);
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      loadScenario(state.scenarioId, false);
    }
  });

  // 料盒磁贴点选（投放 / 撤回）
  for (const tile of trayTiles) {
    tile.addEventListener("click", () => {
      togglePiece(tile.dataset.piece);
    });
  }

  // 命题切换、参考解、重置
  for (const tab of scTabs) {
    tab.addEventListener("click", () => {
      loadScenario(tab.dataset.scenario, false);
    });
  }

  btnSolution.addEventListener("click", () => {
    loadScenario(state.scenarioId, true);
  });

  btnReset.addEventListener("click", () => {
    loadScenario(state.scenarioId, false);
  });

  const ro = new ResizeObserver(() => {
    resize();
    ticker.draw();
  });
  ro.observe(stageEl);

  resize();
  loadScenario("poster", false);
}
