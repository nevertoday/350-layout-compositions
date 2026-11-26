// 053 向心式构图 · 开场「向心矢量校准场」2D Canvas 引擎（hero.js）
// 1:1 承袭 053 原海报：暖矿石宣纸、孔雀青/柿子朱橙/石墨深炭颗粒渐变收锋楔形、细建筑引线、中央虚线静谧环与青橙双色短杠。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, SCENARIOS, buildGeometry, clamp, evaluate } from "./model.js";

function createGrainPattern(ctx) {
  const tile = document.createElement("canvas");
  tile.width = 96;
  tile.height = 96;
  const g = tile.getContext("2d");
  // 确定性伪随机细矿物颗粒（只烘焙一次，零运行时开销）
  let seed = 53053;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 640; i++) {
    const x = Math.floor(rand() * 96);
    const y = Math.floor(rand() * 96);
    const light = rand() > 0.48;
    const alpha = light ? 0.14 + rand() * 0.18 : 0.08 + rand() * 0.12;
    g.fillStyle = light ? `rgba(248,245,240,${alpha.toFixed(2)})` : `rgba(16,32,38,${alpha.toFixed(2)})`;
    g.fillRect(x, y, 1.5, 1.5);
  }
  return ctx.createPattern(tile, "repeat");
}

function colorStops(colorKey, dir) {
  if (dir < 0) {
    // 向外叛逃态：偏警报焦红橙，一眼分辨方向反了
    return {
      solid: "#C73424",
      mid: "#E2604C",
      fade: "rgba(226,96,76,0.16)",
      tip: "#B8291E",
      line: "rgba(184,41,30,0.68)",
    };
  }
  if (colorKey === "teal") {
    return {
      solid: "#0F7F81",
      mid: "#58A6A5",
      fade: "rgba(218,225,222,0.12)",
      tip: "#0D7B7D",
      line: "rgba(19,131,133,0.48)",
    };
  }
  if (colorKey === "orange") {
    return {
      solid: "#EA5E24",
      mid: "#EE8659",
      fade: "rgba(237,225,214,0.16)",
      tip: "#E85A20",
      line: "rgba(232,93,38,0.5)",
    };
  }
  return {
    solid: "#242A2D",
    mid: "#7D8486",
    fade: "rgba(224,221,216,0.1)",
    tip: "#1F262A",
    line: "rgba(28,42,48,0.48)",
  };
}

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const l2 = vx * vx + vy * vy || 1;
  const t = clamp(((px - x1) * vx + (py - y1) * vy) / l2, 0, 1);
  return Math.hypot(px - (x1 + vx * t), py - (y1 + vy * t));
}

export function mountHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  const grainPattern = createGrainPattern(ctx);

  let cssW = 800;
  let cssH = 460;
  let dpr = 1;
  let needsDraw = true;
  let introProgress = reducedMotion.matches ? 1 : 0;
  let introDone = reducedMotion.matches;
  let droplets = [];
  let hoverTarget = null; // { type: 'wedge'|'distractor'|'ring', idx }
  let dragMode = null; // 'aim' | 'ring'
  let dragStart = null;
  let pointerMoved = false;
  let lastClickFlash = null; // { x, y, t, color }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    cssW = rect.width;
    cssH = rect.height;
    needsDraw = true;
  }

  // 释放 24 枚视线流珠，沿 8 支实绘楔形真实方向滑行验真
  function launchDroplets() {
    const geom = buildGeometry(state, cssW, cssH);
    const activeWedges = geom.wedges.filter((w) => w.active);
    if (!activeWedges.length) return;
    droplets = [];
    for (let wave = 0; wave < 3; wave++) {
      for (const w of activeWedges) {
        const startRatio = w.dir > 0 ? 0.08 + wave * 0.08 : 0.72 - wave * 0.09;
        const sx = w.outerX + w.aimX * (w.len * startRatio);
        const sy = w.outerY + w.aimY * (w.len * startRatio);
        droplets.push({
          x: sx,
          y: sy,
          vx: w.flowX,
          vy: w.flowY,
          speed: (geom.minDim * (w.dir > 0 ? 0.56 : 0.68)) * (0.94 + wave * 0.06),
          dir: w.dir,
          color: w.dir < 0 ? PALETTE.danger : w.color === "orange" ? PALETTE.orange : w.color === "teal" ? PALETTE.teal : PALETTE.ink,
          age: -wave * 0.14,
          maxAge: 1.55,
          settled: false,
          escaped: false,
          trail: [],
        });
      }
    }
    needsDraw = true;
    ctrl.draw();
  }

  function getLocalPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTest(px, py) {
    const geom = buildGeometry(state, cssW, cssH);
    // 1. 优先命中外围杂散噪点（点一下就吸除）
    for (const d of geom.distractors) {
      if (!d.active) continue;
      if (Math.hypot(px - d.x, py - d.y) <= Math.max(26, d.r * 1.45)) {
        return { type: "distractor", idx: d.idx, x: d.x, y: d.y };
      }
    }
    // 2. 命中中央虚线静谧环边缘（拖动调净空半径）
    const distC = Math.hypot(px - geom.cx, py - geom.cy);
    if (Math.abs(distC - geom.sanctuaryR) <= Math.max(14, geom.minDim * 0.04)) {
      return { type: "ring", idx: 0, x: px, y: py };
    }
    // 3. 命中任意启用中的楔形（点击翻转向内/向外；叛逃箭头精确命中可见箭身与微标）
    let best = null;
    for (const w of geom.wedges) {
      if (!w.active) continue;
      let d;
      let hx = w.midX;
      let hy = w.midY;
      if (w.dir < 0) {
        const ux = Math.cos(w.rad);
        const uy = Math.sin(w.rad);
        const tailDist = Math.max(geom.sanctuaryR + 8, geom.minDim * 0.20);
        const headDist = Math.max(tailDist + 48, w.borderDist - 14);
        const tx = geom.cx + ux * tailDist;
        const ty = geom.cy + uy * tailDist;
        const ex = geom.cx + ux * headDist;
        const ey = geom.cy + uy * headDist;
        d = pointToSegmentDist(px, py, tx, ty, ex, ey);
        hx = (tx + ex) * 0.5;
        hy = (ty + ey) * 0.5;
      } else {
        d = pointToSegmentDist(px, py, w.outerX, w.outerY, w.innerX, w.innerY);
      }
      const hitW = Math.max(22, w.halfBase * 0.95);
      if (d <= hitW && (!best || d < best.d)) {
        best = { type: "wedge", idx: w.idx, d, x: hx, y: hy };
      }
    }
    return best;
  }

  // 指针交互：横拖拧动汇聚偏角（同时响应 perf.mjs 触摸横拖！），拖静谧环调净空，单点楔形翻转方向，单点杂散吸除
  let activePointerId = null;
  let touchStartPos = null;
  let touchGestureLocked = null; // 'horizontal' | 'ring' | 'scroll'

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    resize();
    const pos = getLocalPos(e);
    const hit = hitTest(pos.x, pos.y);
    activePointerId = e.pointerId;
    pointerMoved = false;
    touchStartPos = pos;
    touchGestureLocked = null;

    if (hit && hit.type === "ring") {
      dragMode = "ring";
      dragStart = { x: pos.x, y: pos.y, sanctuaryRatio: state.sanctuaryRatio };
      touchGestureLocked = "ring";
    } else {
      dragMode = "aim";
      dragStart = {
        x: pos.x,
        y: pos.y,
        aimSkewDeg: state.aimSkewDeg,
        sanctuaryRatio: state.sanctuaryRatio,
        hit,
      };
    }
    if (e.pointerType === "mouse") {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  }

  function onPointerMove(e) {
    const pos = getLocalPos(e);
    if (activePointerId !== e.pointerId || !dragStart) {
      if (e.pointerType === "mouse") {
        const hit = hitTest(pos.x, pos.y);
        const changed = (hit?.type !== hoverTarget?.type) || (hit?.idx !== hoverTarget?.idx);
        hoverTarget = hit;
        canvas.style.cursor =
          hit?.type === "ring"
            ? "ns-resize"
            : hit?.type === "distractor" || hit?.type === "wedge"
            ? "pointer"
            : "ew-resize";
        if (changed) {
          needsDraw = true;
          ctrl.draw();
        }
      }
      return;
    }

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    const dist = Math.hypot(dx, dy);

    // 触屏下优先保护纵向页面滚动：只有横向拖动或拉静谧环才拦截
    if (e.pointerType === "touch" && !touchGestureLocked && dist > 6) {
      if (Math.abs(dy) > Math.abs(dx) * 1.45) {
        touchGestureLocked = "scroll";
        activePointerId = null;
        dragStart = null;
        return;
      }
      touchGestureLocked = "horizontal";
    }

    if (dist > 5) pointerMoved = true;

    if (dragMode === "ring") {
      const geom = buildGeometry(state, cssW, cssH);
      const rNow = Math.hypot(pos.x - geom.cx, pos.y - geom.cy);
      let nextRatio = clamp(rNow / geom.minDim, 0.08, 0.50);
      if (Math.abs(nextRatio - 0.27) < 0.012) nextRatio = 0.27; // 轻吸附
      state.sanctuaryRatio = Number(nextRatio.toFixed(3));
      state.activePreset = "custom";
      needsDraw = true;
      onChange("drag-ring");
      ctrl.draw();
      return;
    }

    if (dragMode === "aim" && pointerMoved) {
      // 横拖连续拧动汇聚偏角（向左收准 / 向右散开或反拧），灵敏且顺滑
      const span = Math.max(180, cssW * 0.42);
      let nextSkew = clamp(dragStart.aimSkewDeg - (dx / span) * 44, -36, 36);
      // 靠近 0° 时轻微磁性吸附，有真实校准手感
      if (Math.abs(nextSkew) < 1.6) nextSkew = 0;
      state.aimSkewDeg = Math.round(nextSkew);
      state.activePreset = "custom";
      needsDraw = true;
      onChange("drag-aim");
      ctrl.draw();
    }
  }

  function onPointerUp(e) {
    if (activePointerId !== e.pointerId) return;
    const wasMoved = pointerMoved;
    const startInfo = dragStart;
    activePointerId = null;
    dragStart = null;
    dragMode = null;

    if (!wasMoved && startInfo) {
      const pos = getLocalPos(e);
      const hit = hitTest(pos.x, pos.y) || startInfo.hit;
      if (hit?.type === "distractor") {
        state.distractors[hit.idx] = 0;
        state.activePreset = "custom";
        lastClickFlash = { x: hit.x, y: hit.y, t: 0, color: PALETTE.teal };
        needsDraw = true;
        onChange("clear-distractor");
        ctrl.draw();
      } else if (hit?.type === "wedge") {
        state.directions[hit.idx] = state.directions[hit.idx] >= 0 ? -1 : 1;
        state.activePreset = "custom";
        lastClickFlash = {
          x: pos.x,
          y: pos.y,
          t: 0,
          color: state.directions[hit.idx] > 0 ? PALETTE.teal : PALETTE.danger,
        };
        needsDraw = true;
        onChange("flip-wedge");
        ctrl.draw();
      }
    }
  }

  // 同时兼容 CDP Input.dispatchTouchEvent（tools/perf.mjs 发原生 touchStart/touchMove/touchEnd）
  let rawTouchOrigin = null;
  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    const t0 = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    rawTouchOrigin = {
      x: t0.clientX - rect.left,
      y: t0.clientY - rect.top,
      aimSkewDeg: state.aimSkewDeg,
      locked: null,
    };
  }
  function onTouchMove(e) {
    if (!rawTouchOrigin || !e.touches || !e.touches.length) return;
    const t0 = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const px = t0.clientX - rect.left;
    const py = t0.clientY - rect.top;
    const dx = px - rawTouchOrigin.x;
    const dy = py - rawTouchOrigin.y;
    if (!rawTouchOrigin.locked && Math.hypot(dx, dy) > 4) {
      rawTouchOrigin.locked = Math.abs(dx) >= Math.abs(dy) * 0.75 ? "h" : "v";
    }
    if (rawTouchOrigin.locked === "h") {
      if (e.cancelable) e.preventDefault();
      const span = Math.max(150, cssW * 0.42);
      let nextSkew = clamp(rawTouchOrigin.aimSkewDeg - (dx / span) * 44, -36, 36);
      if (Math.abs(nextSkew) < 1.4) nextSkew = 0;
      const rounded = Math.round(nextSkew);
      if (rounded !== state.aimSkewDeg) {
        state.aimSkewDeg = rounded;
        state.activePreset = "custom";
        onChange("drag-aim");
      }
      needsDraw = true;
      ctrl.draw();
    }
  }
  function onTouchEnd() {
    rawTouchOrigin = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  canvas.addEventListener("touchcancel", onTouchEnd, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function drawWedge(w, geom, introEase, isHovered) {
    if (!w.active) return;
    const cols = colorStops(w.color, w.dir);

    // 开场入场动画：楔形从画框外缘丝滑推进到位
    const startX = w.outerX;
    const startY = w.outerY;
    const curLen = w.len * (0.28 + 0.72 * introEase);
    const tipX = startX + w.aimX * curLen;
    const tipY = startY + w.aimY * curLen;

    ctx.save();

    // 1. 延长建筑细引线（开启标尺或处于散焦/叛逃态时凸显方向轨迹）
    if (state.showGuides || w.dir < 0 || Math.abs(state.aimSkewDeg) > 4) {
      ctx.save();
      ctx.beginPath();
      if (w.dir > 0) {
        // 向内延伸穿过静谧圈，清楚看出是否脱靶
        const extX = startX + w.aimX * (w.len + geom.sanctuaryR * 1.15);
        const extY = startY + w.aimY * (w.len + geom.sanctuaryR * 1.15);
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(extX, extY);
        ctx.strokeStyle = Math.abs(state.aimSkewDeg) <= 8 ? "rgba(19,131,133,0.34)" : "rgba(184,41,30,0.44)";
      } else {
        // 向外叛逃的警示逃逸虚线
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(startX, startY);
        ctx.strokeStyle = "rgba(184,41,30,0.72)";
      }
      ctx.lineWidth = w.dir < 0 ? 1.6 : 1.1;
      ctx.setLineDash(w.dir < 0 ? [5, 4] : [3, 5]);
      ctx.stroke();
      ctx.restore();
    }

    // 2. 绘制楔形 / 箭头主体（1:1 复刻原海报颗粒渐变斜楔 + 边沿锐线）
    const nx = w.nx;
    const ny = w.ny;

    if (w.dir > 0) {
      // 向内汇聚：外宽内尖
      if (w.kind === "needle") {
        // 顶中细针箭头（原海报 12 点钟孔雀青细针）
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = cols.solid;
        ctx.lineWidth = Math.max(1.5, geom.minDim * 0.004);
        ctx.stroke();

        const headLen = Math.max(14, geom.minDim * 0.044);
        const headHalf = headLen * 0.44;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - w.aimX * headLen + nx * headHalf, tipY - w.aimY * headLen + ny * headHalf);
        ctx.lineTo(tipX - w.aimX * headLen - nx * headHalf, tipY - w.aimY * headLen - ny * headHalf);
        ctx.closePath();
        ctx.fillStyle = cols.solid;
        ctx.fill();
      } else if (w.kind === "arrow") {
        // 朱橙斜箭（原海报左下与右侧粗尾箭头）
        const headLen = Math.max(22, geom.minDim * 0.072);
        const headHalf = Math.max(12, geom.minDim * 0.036);
        const neckX = tipX - w.aimX * headLen * 0.72;
        const neckY = tipY - w.aimY * headLen * 0.72;
        const baseHalf = w.halfBase * 0.72;

        ctx.beginPath();
        ctx.moveTo(startX + nx * baseHalf, startY + ny * baseHalf);
        ctx.lineTo(neckX + nx * (baseHalf * 0.22), neckY + ny * (baseHalf * 0.22));
        ctx.lineTo(neckX + nx * headHalf, neckY + ny * headHalf);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(neckX - nx * headHalf, neckY - ny * headHalf);
        ctx.lineTo(neckX - nx * (baseHalf * 0.22), neckY - ny * (baseHalf * 0.22));
        ctx.lineTo(startX - nx * baseHalf, startY - ny * baseHalf);
        ctx.closePath();

        const grad = ctx.createLinearGradient(
          startX + nx * baseHalf,
          startY + ny * baseHalf,
          startX - nx * baseHalf,
          startY - ny * baseHalf
        );
        grad.addColorStop(0, cols.solid);
        grad.addColorStop(0.55, cols.mid);
        grad.addColorStop(1, cols.solid);
        ctx.fillStyle = grad;
        ctx.fill();

        if (grainPattern) {
          ctx.fillStyle = grainPattern;
          ctx.fill();
        }
      } else {
        // 招牌 053 颗粒渐变收锋大楔（孔雀青 / 石墨深炭，一侧深浓一侧化入纸面 + 伴生建筑黑细线）
        const p1x = startX + nx * w.halfBase;
        const p1y = startY + ny * w.halfBase;
        const p2x = startX - nx * w.halfBase;
        const p2y = startY - ny * w.halfBase;

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(p2x, p2y);
        ctx.closePath();

        const grad = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
        grad.addColorStop(0, cols.solid);
        grad.addColorStop(0.45, cols.mid);
        grad.addColorStop(1, cols.fade);
        ctx.fillStyle = grad;
        ctx.fill();

        if (grainPattern) {
          ctx.fillStyle = grainPattern;
          ctx.fill();
        }

        // 伴生锐利建筑细线（053 原海报点睛笔触）
        const offset = w.halfBase * 0.24;
        ctx.beginPath();
        ctx.moveTo(startX - nx * offset, startY - ny * offset);
        ctx.lineTo(tipX - nx * (offset * 0.14), tipY - ny * (offset * 0.14));
        ctx.strokeStyle = cols.line;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // 楔尖小三角锚（053 原海报楔尖叠加小实心三角）
        const capLen = Math.max(12, geom.minDim * 0.036);
        const capHalf = capLen * 0.36;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - w.aimX * capLen + nx * capHalf, tipY - w.aimY * capLen + ny * capHalf);
        ctx.lineTo(tipX - w.aimX * capLen - nx * capHalf, tipY - w.aimY * capLen - ny * capHalf);
        ctx.closePath();
        ctx.fillStyle = cols.tip;
        ctx.fill();
      }
    } else {
      // 向外离心叛逃：清晰落在可见画幅内、箭尖猛指画框外沿的红橙逃逸箭头！
      const ux = Math.cos(w.rad);
      const uy = Math.sin(w.rad);
      const pnx = -uy;
      const pny = ux;
      const tailDist = Math.max(geom.sanctuaryR + 8, geom.minDim * 0.20);
      const headDist = Math.max(tailDist + 48, (w.borderDist - 14) * (0.45 + 0.55 * introEase));
      const tailX = geom.cx + ux * tailDist;
      const tailY = geom.cy + uy * tailDist;
      const headX = geom.cx + ux * headDist;
      const headY = geom.cy + uy * headDist;

      const headLen = Math.max(20, Math.min(34, (headDist - tailDist) * 0.34));
      const headHalf = Math.max(13, geom.minDim * 0.036);
      const neckX = headX - ux * headLen;
      const neckY = headY - uy * headLen;
      const shaftHalf = Math.max(5.5, geom.minDim * 0.014);

      ctx.beginPath();
      ctx.moveTo(tailX + pnx * (shaftHalf * 0.65), tailY + pny * (shaftHalf * 0.65));
      ctx.lineTo(neckX + pnx * shaftHalf, neckY + pny * shaftHalf);
      ctx.lineTo(neckX + pnx * headHalf, neckY + pny * headHalf);
      ctx.lineTo(headX, headY);
      ctx.lineTo(neckX - pnx * headHalf, neckY - pny * headHalf);
      ctx.lineTo(neckX - pnx * shaftHalf, neckY - pny * shaftHalf);
      ctx.lineTo(tailX - pnx * (shaftHalf * 0.65), tailY - pny * (shaftHalf * 0.65));
      ctx.closePath();
      ctx.fillStyle = "rgba(199,52,36,0.9)";
      ctx.fill();
      if (grainPattern) {
        ctx.fillStyle = grainPattern;
        ctx.fill();
      }

      // 在叛逃箭头中段贴一枚清晰的微标（窄屏精简文案，并自动避开角落杂散块防重叠）
      const narrow = geom.W < 520;
      const pillText = narrow ? "点扳回" : "外逃·点扳回";
      const pillW = narrow ? 48 : 76;
      const pillH = 20;
      const dHW = narrow ? 43 : 52;
      const dHH = narrow ? 20 : 23;
      const tryRatios = [0.42, 0.28, 0.56, 0.22, 0.66];
      let bx = clamp(tailX + (headX - tailX) * 0.42, pillW / 2 + 8, geom.W - pillW / 2 - 8);
      let by = clamp(tailY + (headY - tailY) * 0.42, 22, geom.H - 44);
      for (const ratio of tryRatios) {
        const cxTry = clamp(tailX + (headX - tailX) * ratio, pillW / 2 + 8, geom.W - pillW / 2 - 8);
        const cyTry = clamp(tailY + (headY - tailY) * ratio, 26, geom.H - 46);
        const collides = geom.distractors.some(
          (d) =>
            d.active &&
            Math.abs(cxTry - d.x) < pillW / 2 + dHW + 6 &&
            Math.abs(cyTry - d.y) < pillH / 2 + dHH + 6
        );
        if (!collides) {
          bx = cxTry;
          by = cyTry;
          break;
        }
      }
      ctx.fillStyle = "#B8291E";
      ctx.beginPath();
      ctx.roundRect(bx - pillW / 2, by - pillH / 2, pillW, pillH, 3);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 ${narrow ? 10 : 11}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pillText, bx, by + 0.5);
    }

    // 悬停提示高亮
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(w.midX, w.midY, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16,32,38,0.82)";
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(w.dir > 0 ? "反" : "收", w.midX, w.midY + 0.5);
    }

    // 原海报悬浮卫星小圆点（伴随各楔形，增强矿石制图精致度）
    if (w.idx % 2 === 0) {
      const dotX = startX + w.aimX * (curLen * 0.66) + nx * (w.halfBase * 0.65);
      const dotY = startY + w.aimY * (curLen * 0.66) + ny * (w.halfBase * 0.65);
      if (dotX > 16 && dotX < geom.W - 16 && dotY > 16 && dotY < geom.H - 16) {
        ctx.beginPath();
        ctx.arc(dotX, dotY, Math.max(3.2, geom.minDim * 0.0085), 0, Math.PI * 2);
        ctx.fillStyle = w.color === "teal" ? PALETTE.teal : w.color === "orange" ? PALETTE.orange : PALETTE.ink;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawCenterSanctuary(geom, evalRes) {
    const scenario = SCENARIOS.find((s) => s.id === state.scenarioId) || SCENARIOS[0];
    const { cx, cy, sanctuaryR, minDim } = geom;
    const isStab = evalRes.sanctuaryPct < 18 || evalRes.stabCount > 0;
    const isHollow = evalRes.sanctuaryPct > 41;
    const ringOk = evalRes.checks.focus.ok;

    ctx.save();

    // 静谧核柔纸垫底（护住文字可读性，同时在刺核态下故意让楔尖叠加穿刺露出问题！）
    if (!isStab) {
      ctx.beginPath();
      ctx.arc(cx, cy, sanctuaryR * 0.96, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239,235,230,0.92)";
      ctx.fill();
    }

    // 外圈孔雀青虚线静谧环（1:1 复刻原海报双圈虚线！）
    ctx.beginPath();
    ctx.arc(cx, cy, sanctuaryR, 0, Math.PI * 2);
    ctx.strokeStyle = isStab || isHollow ? PALETTE.danger : PALETTE.teal;
    ctx.lineWidth = hoverTarget?.type === "ring" || dragMode === "ring" ? 2.4 : 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    // 内圈微细虚环（原海报双层同心虚线圆）
    ctx.beginPath();
    ctx.arc(cx, cy, sanctuaryR * 0.85, 0, Math.PI * 2);
    ctx.strokeStyle = isStab ? "rgba(184,41,30,0.38)" : "rgba(19,131,133,0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 静谧环拖拽微把手（置于 -45° 东北象限，彻底避开下方副标文案）
    const hx = cx + sanctuaryR * Math.SQRT1_2;
    const hy = cy - sanctuaryR * Math.SQRT1_2;
    ctx.beginPath();
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.paperBright;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ringOk ? PALETTE.teal : PALETTE.danger;
    ctx.stroke();

    // 三套场景的主角内容绘制（始终严格等比缩放）
    const titlePx = clamp(Math.round(minDim * 0.082), 20, 42);
    const enPx = clamp(Math.round(minDim * 0.023), 10, 13.5);
    const subPx = clamp(Math.round(minDim * 0.025), 11, 13.5);

    if (scenario.centerKind === "lens") {
      // 产品展示 · 光学镜头光环（几何矢量绘制，不画怪异拟物）
      const lr = clamp(minDim * 0.135, 34, 72);
      ctx.beginPath();
      ctx.arc(cx, cy - 12, lr, 0, Math.PI * 2);
      ctx.fillStyle = "#162228";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy - 12, lr * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = "#3A5560";
      ctx.lineWidth = 2;
      ctx.stroke();
      const lg = ctx.createRadialGradient(cx - lr * 0.22, cy - 12 - lr * 0.22, 2, cx, cy - 12, lr * 0.62);
      lg.addColorStop(0, "#7CE2DF");
      lg.addColorStop(0.42, "#138385");
      lg.addColorStop(0.85, "#0B1E26");
      lg.addColorStop(1, "#081216");
      ctx.beginPath();
      ctx.arc(cx, cy - 12, lr * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = lg;
      ctx.fill();
      // 镜片高光弧
      ctx.beginPath();
      ctx.arc(cx, cy - 12, lr * 0.44, -2.55, -1.65);
      ctx.strokeStyle = "rgba(255,255,255,0.68)";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `800 ${clamp(Math.round(titlePx * 0.56), 15, 24)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(scenario.title, cx, cy + lr + 6);

      ctx.fillStyle = PALETTE.tealDeep;
      ctx.font = `700 ${enPx}px "IBM Plex Sans", sans-serif`;
      ctx.fillText(scenario.en, cx, cy + lr + 24);
    } else if (scenario.centerKind === "keynote") {
      // 演讲封面 · 极简核心主张
      const badgeW = 98;
      const badgeH = 22;
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(cx - badgeW / 2, cy - titlePx * 1.15, badgeW, badgeH);
      ctx.fillStyle = "#F6F3EE";
      ctx.font = `700 10.5px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KEYNOTE · 01", cx, cy - titlePx * 1.15 + badgeH / 2 + 0.5);

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${Math.round(titlePx * 0.96)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(scenario.title, cx, cy - 2);

      // 招牌青橙双色短横杠
      ctx.fillStyle = PALETTE.teal;
      ctx.fillRect(cx - 22, cy + titlePx * 0.55, 22, 3.5);
      ctx.fillStyle = PALETTE.orange;
      ctx.fillRect(cx, cy + titlePx * 0.55, 22, 3.5);

      ctx.fillStyle = PALETTE.body;
      ctx.font = `500 ${subPx}px "Noto Sans SC", sans-serif`;
      ctx.fillText(scenario.sub, cx, cy + titlePx * 0.98);
    } else {
      // 原海报 · 向心宣言（1:1 致敬 053 原海报中央文字结构，拉开行距绝不碰字）
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${titlePx}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("向心式构图", cx, cy - titlePx * 0.48);

      ctx.fillStyle = PALETTE.tealDeep;
      ctx.font = `700 ${enPx}px "IBM Plex Sans", sans-serif`;
      ctx.fillText("CENTRIPETAL  COMPOSITION", cx, cy + titlePx * 0.30);

      // 053 原海报招牌：青 + 橙双色短横杠
      const barY = cy + titlePx * 0.64;
      ctx.fillStyle = PALETTE.teal;
      ctx.fillRect(cx - 20, barY, 20, 3.5);
      ctx.fillStyle = PALETTE.orange;
      ctx.fillRect(cx, barY, 20, 3.5);

      ctx.fillStyle = PALETTE.muted;
      ctx.font = `500 ${subPx}px "Noto Sans SC", sans-serif`;
      ctx.fillText(scenario.sub, cx, barY + 21);
    }

    ctx.restore();
  }

  function drawDistractors(geom) {
    const narrow = geom.W < 520;
    const hw = narrow ? 39 : 48;
    const hh = narrow ? 16 : 19;
    for (const d of geom.distractors) {
      if (!d.active) continue;
      const isHover = hoverTarget?.type === "distractor" && hoverTarget.idx === d.idx;
      ctx.save();
      const bg = d.color === "orange" ? "#E85D26" : d.color === "teal" ? "#138385" : "#1D2A30";
      ctx.translate(d.x, d.y);

      // 警示外虚框，提示它是分散视线的角落杂散
      ctx.beginPath();
      ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 4);
      ctx.fillStyle = isHover ? "#B8291E" : bg;
      ctx.fill();
      ctx.strokeStyle = "#B8291E";
      ctx.lineWidth = isHover ? 2 : 1.25;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-(hw + 4), -(hh + 4), (hw + 4) * 2, (hh + 4) * 2);
      ctx.setLineDash([]);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${narrow ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`× ${d.label}`, 0, narrow ? -3.5 : -4);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = `500 ${narrow ? 9.5 : 10}px "Noto Sans SC", sans-serif`;
      ctx.fillText("点此清除", 0, narrow ? 8 : 10);
      ctx.restore();
    }
  }

  function drawOnCanvasHud(geom, evalRes) {
    const compact = geom.W < 520;
    ctx.save();
    // 顶部极简制图坐标尺读数（带淡暖纸衬底，压在任何楔形上都清晰可读）
    ctx.font = `400 ${compact ? 10 : 11}px "Space Mono", monospace`;
    const meta = `SKEW ${evalRes.absSkew}° · RING ${evalRes.sanctuaryPct}% · INWARD ${evalRes.inwardCount}/8`;
    const metaW = Math.min(geom.W - 24, ctx.measureText(meta).width + 16);
    const metaH = 22;
    ctx.fillStyle = "rgba(246,243,238,0.9)";
    ctx.fillRect(10, 10, metaW, metaH);
    ctx.strokeStyle = "rgba(16,32,38,0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, metaW, metaH);
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(meta, 18, 10 + metaH / 2 + 0.5, metaW - 12);

    // 底部中央一条轻量态势提示胶囊（直接用真实单真源读数）
    const tagText =
      evalRes.passCount === 4
        ? `✓ 4/4 向心锁焦成立 · 按 Space 放流验真`
        : evalRes.rebelCount > 0
        ? `× ${evalRes.rebelCount} 支外逃 + 偏角 ${evalRes.absSkew}° · 横拖收准 / 点红箭扳回`
        : evalRes.absSkew > 8
        ? `× 指向偏散 ${evalRes.absSkew}° · 左右横拖画布拧准中心`
        : evalRes.sanctuaryPct < 18
        ? `× 箭尖刺核（净空 ${evalRes.sanctuaryPct}%）· 向外拖虚线环`
        : evalRes.sanctuaryPct > 41
        ? `× 空心断链（净空 ${evalRes.sanctuaryPct}%）· 向内收虚线环`
        : evalRes.distractorCount > 0
        ? `× 角落余 ${evalRes.distractorCount} 处杂散 · 点按清除`
        : `× 受力偏推 ${evalRes.imbalancePct}% · 恢复四向均衡`;

    ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(tagText).width;
    const bw = Math.min(geom.W - 24, tw + 24);
    const bh = 26;
    const bx = (geom.W - bw) / 2;
    const by = geom.H - bh - 12;

    ctx.fillStyle = evalRes.passCount === 4 ? "rgba(11,107,86,0.92)" : "rgba(16,32,38,0.88)";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 3);
    ctx.fill();

    ctx.fillStyle = "#F6F3EE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, geom.W / 2, by + bh / 2 + 0.5, bw - 12);
    ctx.restore();
  }

  function updateAndDrawDroplets(dt, geom) {
    if (!droplets.length) return false;
    let alive = false;
    for (const p of droplets) {
      p.age += dt;
      if (p.age < 0) {
        alive = true;
        continue;
      }
      if (p.age >= p.maxAge) continue;
      alive = true;

      if (!p.settled && !p.escaped) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 10) p.trail.shift();

        p.x += p.vx * p.speed * dt;
        p.y += p.vy * p.speed * dt;

        const dCenter = Math.hypot(p.x - geom.cx, p.y - geom.cy);
        if (p.dir > 0 && dCenter <= geom.sanctuaryR * 0.92) {
          p.settled = true;
        }
        if (p.x < -20 || p.x > geom.W + 20 || p.y < -20 || p.y > geom.H + 20) {
          p.escaped = true;
        }
      }

      const fade = clamp(1 - (p.age / p.maxAge) ** 2.2, 0, 1);
      ctx.save();
      // 尾巴
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = fade * 0.45;
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }
      // 流珠主体
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.settled ? 5.2 : 4.2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      if (p.settled) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9.5, 0, Math.PI * 2);
        ctx.strokeStyle = PALETTE.teal;
        ctx.globalAlpha = fade * 0.55;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (!alive) droplets = [];
    return alive;
  }

  function render(t, dt, { still }) {
    if (still) {
      introProgress = 1;
      introDone = true;
    } else if (!introDone) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) / 0.72);
      if (introProgress >= 1) introDone = true;
      needsDraw = true;
    }

    if (lastClickFlash) {
      lastClickFlash.t += dt;
      if (lastClickFlash.t > 0.36) lastClickFlash = null;
      else needsDraw = true;
    }

    const hasMotion = !introDone || droplets.length > 0 || Boolean(lastClickFlash);
    if (!needsDraw && !hasMotion) return;
    needsDraw = false;

    const evalRes = evaluate(state, cssW, cssH);
    const geom = evalRes.geom;
    const introEase = 1 - Math.pow(1 - introProgress, 3);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖矿石宣纸主底 + 极淡制图网格点
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 极淡四向参考轴线（建筑绘图板底痕）
    ctx.strokeStyle = "rgba(16,32,38,0.065)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(geom.cx, 0);
    ctx.lineTo(geom.cx, cssH);
    ctx.moveTo(0, geom.cy);
    ctx.lineTo(cssW, geom.cy);
    ctx.stroke();

    // 2. 在非刺核态下先画楔形再画静谧核；在刺核态下把静谧核放底层让尖端真刺进文字！
    const isStab = evalRes.sanctuaryPct < 18 || evalRes.stabCount > 0;
    if (isStab) {
      drawCenterSanctuary(geom, evalRes);
      for (const w of geom.wedges) {
        drawWedge(w, geom, introEase, hoverTarget?.type === "wedge" && hoverTarget.idx === w.idx);
      }
    } else {
      for (const w of geom.wedges) {
        drawWedge(w, geom, introEase, hoverTarget?.type === "wedge" && hoverTarget.idx === w.idx);
      }
      drawCenterSanctuary(geom, evalRes);
    }

    // 3. 外围角落杂散干扰块
    drawDistractors(geom);

    // 4. 视线流珠动效（放流检验）
    if (droplets.length) {
      const stillAlive = updateAndDrawDroplets(still ? 0 : Math.max(dt, 0.016), geom);
      if (stillAlive) needsDraw = true;
    }

    // 5. 点击反馈涟漪
    if (lastClickFlash) {
      const p = clamp(lastClickFlash.t / 0.36, 0, 1);
      ctx.beginPath();
      ctx.arc(lastClickFlash.x, lastClickFlash.y, 10 + p * 28, 0, Math.PI * 2);
      ctx.strokeStyle = lastClickFlash.color;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 6. 极简制图 HUD
    drawOnCanvasHud(geom, evalRes);

    ctx.restore();
  }

  const ctrl = loop(canvas, render);
  ctrl.draw();

  return {
    redraw() {
      needsDraw = true;
      ctrl.draw();
    },
    pulse: launchDroplets,
    resize,
  };
}
