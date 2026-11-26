// 169 放射系统 · 开场极坐标排印轮盘（2D Canvas）
// 1:1 承袭原海报午夜深蓝底、双层虚线点环、三色放射脉冲针与 8 条可交互极坐标排字臂
// 高帧率架构：背景星尘缓存 + 中心圆核/弧形字/脉冲环离屏缓存 + 拖拽期间单一 rAF 重绘（绝不单帧重绘多次），SwiftShader 6× 下依然满帧。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, anglesFromSpread, clamp, evaluate, normDeg } from "./model.js";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// 绕圆弧排布中文/西文小字（预渲染至 hubCache，零逐帧开销）
function drawArcText(ctx, text, cx, cy, r, centerAngle, letterStep, isBottom) {
  if (!text) return;
  const chars = [...text];
  const total = (chars.length - 1) * letterStep;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const offset = i * letterStep - total / 2;
    const angle = isBottom ? centerAngle - offset : centerAngle + offset;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.rotate(isBottom ? angle - Math.PI / 2 : angle + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// 离屏缓存 1：午夜深蓝径向晕 + 极坐标参考环 + 确定性远景星尘
function makeBackdropCache(w, h, dpr) {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(w * dpr));
  off.height = Math.max(1, Math.round(h * dpr));
  const c = off.getContext("2d");
  c.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.46;

  const bgGrad = c.createRadialGradient(cx, cy, R * 0.08, cx, cy, Math.max(w, h) * 0.65);
  bgGrad.addColorStop(0, "#081C3A");
  bgGrad.addColorStop(0.42, "#031029");
  bgGrad.addColorStop(1, PALETTE.bg);
  c.fillStyle = bgGrad;
  c.fillRect(0, 0, w, h);

  c.strokeStyle = "rgba(37, 207, 232, 0.085)";
  c.lineWidth = 1;
  for (const frac of [0.55, 0.78, 1.0]) {
    c.beginPath();
    c.arc(cx, cy, R * frac, 0, TAU);
    c.stroke();
  }

  c.strokeStyle = "rgba(37, 207, 232, 0.06)";
  c.setLineDash([2, 6]);
  for (let d = 0; d < 360; d += 30) {
    const a = d * DEG;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * R * 0.24, cy + Math.sin(a) * R * 0.24);
    c.lineTo(cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 1.02);
    c.stroke();
  }
  c.setLineDash([]);

  const paletteDots = [
    "rgba(37, 207, 232, 0.42)",
    "rgba(240, 100, 160, 0.36)",
    "rgba(241, 221, 180, 0.34)",
  ];
  for (let i = 0; i < 38; i++) {
    const a = ((i * 137.508) % 360) * DEG;
    const rad = R * (0.48 + ((i * 29) % 58) / 100);
    c.fillStyle = paletteDots[i % 3];
    c.beginPath();
    c.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, i % 4 === 0 ? 1.8 : 1.1, 0, TAU);
    c.fill();
  }
  return off;
}

// 离屏缓存 2：28 道原海报细脉冲针 + 三层点环 + 弧形小字 + 中央自示范标题核（仅在核径/题材/节奏变化时重建）
function makeHubCache(w, h, dpr, ev, hubPx, rhythmMode) {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(w * dpr));
  off.height = Math.max(1, Math.round(h * dpr));
  const c = off.getContext("2d");
  c.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.46;
  const compact = w < 380;
  const ringDanger = ev.flags.choked || ev.flags.hollow;

  // 28 根原海报细密辅助放射脉冲针
  const pulseCount = 28;
  const rhythmScale = rhythmMode === "uniform" ? 0.55 : 1;
  const subColors = [PALETTE.cyan, PALETTE.rose, PALETTE.gold];
  for (let j = 0; j < pulseCount; j++) {
    const rad = (j * (360 / pulseCount)) * DEG;
    const col = subColors[j % 3];
    const lenFrac = rhythmMode === "uniform" ? 0.22 : 0.14 + ((j * 17) % 10) * 0.026 * rhythmScale;
    const r0 = hubPx * 1.07;
    const r1 = r0 + R * lenFrac;
    c.strokeStyle = col;
    c.globalAlpha = j % 3 === 0 ? 0.42 : 0.24;
    c.lineWidth = j % 4 === 0 ? 2 : 1;
    if (j % 5 === 2) c.setLineDash([2, 4]);
    c.beginPath();
    c.moveTo(cx + Math.cos(rad) * r0, cy + Math.sin(rad) * r0);
    c.lineTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
    c.stroke();
    c.setLineDash([]);
    if (j % 4 === 0) {
      c.fillStyle = col;
      c.globalAlpha = 0.65;
      c.beginPath();
      c.arc(cx + Math.cos(rad) * (r1 + 4), cy + Math.sin(rad) * (r1 + 4), 1.8, 0, TAU);
      c.fill();
    }
  }
  c.globalAlpha = 1;

  // 中央三层精致同心点环（外青虚环 + 中玫点环 + 香槟金细内环）
  if (ringDanger) {
    c.strokeStyle = "rgba(255, 107, 123, 0.55)";
    c.lineWidth = 1.5;
    c.setLineDash([5, 4]);
    c.beginPath();
    c.arc(cx, cy, hubPx * 1.09, 0, TAU);
    c.stroke();
  }
  c.strokeStyle = ringDanger ? PALETTE.err : PALETTE.cyan;
  c.globalAlpha = 0.85;
  c.lineWidth = 1.5;
  c.setLineDash([2.5, 4.5]);
  c.beginPath();
  c.arc(cx, cy, hubPx * 1.04, 0, TAU);
  c.stroke();

  c.strokeStyle = PALETTE.rose;
  c.globalAlpha = 0.72;
  c.lineWidth = 1.2;
  c.setLineDash([1.5, 5.5]);
  c.beginPath();
  c.arc(cx, cy, hubPx * 0.96, 0, TAU);
  c.stroke();

  c.setLineDash([]);
  c.strokeStyle = PALETTE.gold;
  c.globalAlpha = 0.55;
  c.lineWidth = 1;
  c.beginPath();
  c.arc(cx, cy, hubPx * 0.83, 0, TAU);
  c.stroke();
  c.globalAlpha = 1;

  // 中央深海核盘
  c.fillStyle = "rgba(2, 12, 34, 0.88)";
  c.beginPath();
  c.arc(cx, cy, hubPx * 0.86, 0, TAU);
  c.fill();

  // 弧形总述
  if (hubPx >= (compact ? 42 : 52)) {
    c.fillStyle = "rgba(241, 221, 180, 0.82)";
    c.font = `500 ${compact ? 9 : 10}px "Noto Sans SC", sans-serif`;
    const topR = hubPx * 0.72;
    const topStep = clamp(12.5 / Math.max(36, topR), 0.11, 0.22);
    const arcStr = ev.theme.id === "infographic" ? "以中心为起点，向外有序展开" : ev.theme.arcTop.slice(0, 14);
    drawArcText(c, arcStr, cx, cy, topR, -Math.PI / 2, topStep, false);

    c.fillStyle = "rgba(196, 214, 232, 0.76)";
    c.font = `600 ${compact ? 8 : 9}px "IBM Plex Sans", sans-serif`;
    const botStep = clamp(7.2 / Math.max(36, topR), 0.065, 0.13);
    drawArcText(c, ev.theme.arcBot, cx, cy, topR * 0.99, Math.PI / 2, botStep, true);
  }

  // 中央自示范标题 + 英文副标 + 玫红焦点圆
  const titlePx = clamp(hubPx * 0.37, compact ? 15 : 18, compact ? 24 : 31);
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = PALETTE.gold;
  c.font = `900 ${Math.round(titlePx)}px "Noto Sans SC", sans-serif`;
  c.fillText(ev.theme.coreZh, cx, cy - titlePx * 0.16);

  const subPx = clamp(titlePx * 0.36, 9.5, 12);
  c.fillStyle = PALETTE.cyan;
  c.font = `700 ${Math.round(subPx)}px "Syne", "IBM Plex Sans", sans-serif`;
  c.fillText(ev.theme.coreEn, cx, cy + titlePx * 0.56);

  const dotY = cy + titlePx * 1.15;
  if (dotY + 10 < cy + hubPx * 0.72) {
    c.strokeStyle = PALETTE.cyan;
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(cx, dotY, 8.5, 0, TAU);
    c.stroke();
    c.fillStyle = PALETTE.rose;
    c.beginPath();
    c.arc(cx, dotY, 3.6, 0, TAU);
    c.fill();
  }

  return off;
}

export function createHeroDial({ canvas, getState, setState, onDragState, onRenderMeta }) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let width = 560;
  let height = 460;
  let dpr = 1;
  let bgCache = null;
  let hubCache = null;
  let hubCacheKey = "";

  const init = getState();
  let disp = {
    angles: [...init.spokeAngles],
    reaches: [...init.spokeReaches],
    hubR: init.hubRatio,
    intro: 0,
  };

  let drag = null;
  let hoverSpoke = -1;
  let lastEval = evaluate(init);
  let lastMetaNotify = 0;

  const geom = () => {
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.46;
    return { cx, cy, R };
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    // 移动端 DPR 限 1.25（SwiftShader 软渲染每帧像素量减少 30%，依然锐利清晰）
    const targetDpr = window.innerWidth < 600 ? pixelRatio(1.25) : pixelRatio(2);
    if (w === width && h === height && targetDpr === dpr && bgCache) return;
    width = w;
    height = h;
    dpr = targetDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    bgCache = makeBackdropCache(width, height, dpr);
    hubCache = null;
    hubCacheKey = "";
  }

  function lerpAngle(a, b, f) {
    let diff = ((b - a + 540) % 360) - 180;
    return normDeg(a + diff * f);
  }

  function drawFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const ev = evaluate(state);
    lastEval = ev;

    if (still) {
      disp.intro = 1;
      disp.hubR = ev.hubR;
      for (let i = 0; i < 8; i++) {
        disp.angles[i] = ev.spokes[i].angleDeg;
        disp.reaches[i] = ev.spokes[i].outerR;
      }
    } else {
      const k = dt > 0 ? Math.min(1, dt * 14) : 0.4;
      disp.intro = Math.min(1, disp.intro + (dt > 0 ? dt * 1.5 : 0.14));
      disp.hubR += (ev.hubR - disp.hubR) * k;
      for (let i = 0; i < 8; i++) {
        disp.angles[i] = lerpAngle(disp.angles[i], ev.spokes[i].angleDeg, drag ? 0.65 : k);
        disp.reaches[i] += (ev.spokes[i].outerR - disp.reaches[i]) * (drag ? 0.65 : k);
      }
    }

    const easeIntro = 1 - Math.pow(1 - disp.intro, 3);
    const { cx, cy, R } = geom();
    const hubPx = R * disp.hubR;
    const compact = width < 380;

    // 仅当核径(精度2px)/题材/节奏/警示态变化时刷新中心离屏缓存，常态与横拖期间 0 重建！
    const hKey = `${width}x${height}:${ev.theme.id}:${state.rhythmMode}:${Math.round(hubPx / 2)}:${ev.flags.choked ? 1 : 0}${ev.flags.hollow ? 1 : 0}`;
    if (!hubCache || hubCacheKey !== hKey) {
      hubCache = makeHubCache(width, height, dpr, ev, hubPx, state.rhythmMode);
      hubCacheKey = hKey;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 一笔贴背景缓存（1 次 drawImage）
    ctx.drawImage(bgCache, 0, 0, width, height);

    // 2. 极坐标合力重心漂移矢
    if (ev.comDriftPct >= 6) {
      const vecLen = Math.min(R * 0.36, ev.comDrift * R * 0.92);
      const vx = cx + Math.cos(ev.comAngleDeg * DEG) * vecLen;
      const vy = cy + Math.sin(ev.comAngleDeg * DEG) * vecLen;
      const isBad = ev.flags.clumped;
      ctx.strokeStyle = isBad ? PALETTE.err : PALETTE.ok;
      ctx.lineWidth = isBad ? 2.2 : 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(vx, vy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isBad ? PALETTE.err : PALETTE.ok;
      ctx.beginPath();
      ctx.arc(vx, vy, isBad ? 4.6 : 3.4, 0, TAU);
      ctx.fill();
    }

    // 3. 8 条主射线 + 节点 + 流动光珠 + 文字臂
    const scanPhase = still ? 0.5 : (t * 0.55) % 1;
    const startR = hubPx * 1.04;
    const spokeCoords = [];

    for (let i = 0; i < 8; i++) {
      const sp = ev.spokes[i];
      const deg = disp.angles[i];
      const rad = deg * DEG;
      const reachPx = R * disp.reaches[i] * (0.35 + 0.65 * easeIntro);
      const tanX = -Math.sin(rad);
      const tanY = Math.cos(rad);
      const offsetPx = sp.offCenter ? Math.sin(sp.aimOffsetDeg * DEG) * R * 0.46 : 0;
      const x0 = cx + Math.cos(rad) * startR + tanX * offsetPx * 0.48;
      const y0 = cy + Math.sin(rad) * startR + tanY * offsetPx * 0.48;
      const x1 = cx + Math.cos(rad) * reachPx + tanX * offsetPx * 0.12;
      const y1 = cy + Math.sin(rad) * reachPx + tanY * offsetPx * 0.12;
      const isSelected = state.selectedSpoke === i || hoverSpoke === i;
      const isErr = sp.inverted || sp.offCenter || ev.crowdedPairs.some((p) => p[0] === i || p[1] === i);
      const col = isErr ? PALETTE.err : sp.color;
      spokeCoords.push({ sp, deg, rad, reachPx, tanX, tanY, offsetPx, x0, y0, x1, y1, isSelected, isErr, col });

      // 脱心延长虚线
      if (sp.offCenter) {
        const dirRad = rad + sp.aimOffsetDeg * DEG * 0.65;
        ctx.strokeStyle = "rgba(255, 107, 123, 0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - Math.cos(dirRad) * R * 1.15, y1 - Math.sin(dirRad) * R * 1.15);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 主射线（选中或主级轻叠柔晕）
      const tierAlpha = sp.tier === 2 ? 1 : sp.tier === 1 ? 0.85 : 0.48;
      if (isSelected) {
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = col;
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = tierAlpha;
      ctx.strokeStyle = col;
      ctx.lineWidth = sp.tier === 2 ? 2.4 : sp.tier === 1 ? 1.5 : 1.05;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // 环根小圆 + 外端可拖圆环
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x0, y0, sp.tier === 2 ? 3.6 : 2.6, 0, TAU);
      ctx.fill();

      const nodeR = isSelected ? 8.5 : sp.tier === 2 ? 6.2 : 4.8;
      ctx.fillStyle = PALETTE.bg;
      ctx.beginPath();
      ctx.arc(x1, y1, nodeR, 0, TAU);
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.4 : 1.7;
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x1, y1, nodeR * 0.42, 0, TAU);
      ctx.fill();
    }

    // 批量绘制 8 颗流动光珠（单次 fill）
    if (!still) {
      ctx.fillStyle = PALETTE.goldHi;
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const sc = spokeCoords[i];
        if (sc.sp.tier < 1) continue;
        const p = (scanPhase + i * 0.125) % 1;
        const bx = sc.x0 + (sc.x1 - sc.x0) * p;
        const by = sc.y0 + (sc.y1 - sc.y0) * p;
        ctx.moveTo(bx + 2.2, by);
        ctx.arc(bx, by, 2.2, 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 4. 一笔贴中心标题/点环/脉冲缓存（盖在射线根部之上，视觉最利落！）
    ctx.drawImage(hubCache, 0, 0, width, height);

    // 5. 射线排字臂（集中绘制减少状态切换）
    const baseSize = compact ? 11.5 : 13;
    ctx.font = `700 ${baseSize}px "Noto Sans SC", sans-serif`;
    for (let i = 0; i < 8; i++) {
      const { sp, rad, reachPx, tanX, tanY, offsetPx, isErr } = spokeCoords[i];
      ctx.save();
      ctx.globalAlpha = sp.tier === 0 ? 0.58 : 0.96;
      ctx.fillStyle = isErr ? "#FF9AA5" : sp.tier === 2 ? PALETTE.goldHi : "#D7E6F4";

      if (state.baselineMode === "horizontal") {
        const labelDist = reachPx + (compact ? 12 : 15);
        ctx.translate(cx + Math.cos(rad) * labelDist, cy + Math.sin(rad) * labelDist);
        const onLeft = Math.cos(rad) < -0.15;
        const onRight = Math.cos(rad) > 0.15;
        ctx.textAlign = onLeft ? "right" : onRight ? "left" : "center";
        ctx.textBaseline = Math.sin(rad) < -0.7 ? "bottom" : Math.sin(rad) > 0.7 ? "top" : "middle";
        ctx.fillText(sp.zh, 0, 0);
      } else {
        const midR = startR + (reachPx - startR) * 0.53;
        ctx.translate(cx + Math.cos(rad) * midR + tanX * offsetPx * 0.25, cy + Math.sin(rad) * midR + tanY * offsetPx * 0.25);
        const flip = state.baselineMode === "autoFlip" && Math.cos(rad) < -0.06;
        ctx.rotate(flip ? rad + Math.PI : rad);
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(sp.zh, 0, -6);

        if (sp.inverted || sp.offCenter) {
          ctx.fillStyle = PALETTE.err;
          ctx.textBaseline = "top";
          ctx.fillText(sp.inverted ? "×倒立" : "×脱心", 0, 6);
        }
      }
      ctx.restore();
    }

    // 6. 顶角与右下极简 HUD（纯坐标 + 重心角标，绝不压射线字）
    ctx.font = `600 ${compact ? 10 : 11}px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "rgba(159, 180, 201, 0.88)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`SPAN ${ev.spanDeg}° · HUB ${Math.round(ev.hubR * 100)}% · G ${ev.comDriftPct}%`, 12, 10);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.verdict.ok ? PALETTE.ok : PALETTE.err;
    ctx.fillText(ev.verdict.badge, width - 12, 10);

    if (ev.comDriftPct >= 6) {
      const tagText = `重心偏移 ${ev.comDriftPct}%`;
      const isBad = ev.flags.clumped;
      const tw = compact ? 84 : 92;
      const bx = width - 12 - tw;
      const by = height - 28;
      ctx.fillStyle = "rgba(1, 10, 30, 0.88)";
      ctx.strokeStyle = isBad ? "rgba(255, 107, 123, 0.7)" : "rgba(59, 224, 168, 0.65)";
      ctx.lineWidth = 1;
      ctx.fillRect(bx, by, tw, 20);
      ctx.strokeRect(bx, by, tw, 20);
      ctx.fillStyle = isBad ? "#FFB3BC" : "#B9FCE5";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, bx + tw / 2, by + 10);
    }

    ctx.restore();

    if (onRenderMeta && !drag && performance.now() - lastMetaNotify > 140) {
      lastMetaNotify = performance.now();
      onRenderMeta(ev);
    }
  }

  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { cx, cy, R } = geom();
    const state = getState();
    const hubPx = R * state.hubRatio;

    let bestIdx = -1;
    let bestD = 26;
    for (let i = 0; i < 8; i++) {
      const rad = state.spokeAngles[i] * DEG;
      const reachPx = R * state.spokeReaches[i];
      const d = Math.hypot(x - (cx + Math.cos(rad) * reachPx), y - (cy + Math.sin(rad) * reachPx));
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) return { kind: "spoke", index: bestIdx, x, y };
    if (Math.abs(Math.hypot(x - cx, y - cy) - hubPx) < 14) return { kind: "hub", x, y };
    return { kind: "pan", x, y };
  }

  function startDrag(clientX, clientY, id) {
    const hit = hitTest(clientX, clientY);
    const s = getState();
    drag = {
      mode: hit.kind,
      spokeIdx: hit.index ?? -1,
      id,
      startX: clientX,
      startY: clientY,
      startSpread: s.spread,
      startRot: s.rotationDeg,
      moved: false,
      lockedH: hit.kind !== "pan",
    };
    onDragState?.(true);
  }

  function moveDrag(clientX, clientY) {
    if (!drag) return false;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;

    if (drag.mode === "pan" && !drag.lockedH) {
      if (Math.abs(dy) > Math.abs(dx) + 6 && Math.abs(dy) > 10) {
        drag = null;
        onDragState?.(false);
        return false;
      }
      if (Math.abs(dx) > 4) drag.lockedH = true;
    }

    const rect = canvas.getBoundingClientRect();
    const { cx, cy, R } = geom();
    const s = getState();

    if (drag.mode === "spoke" && drag.spokeIdx >= 0) {
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      let deg = normDeg((Math.atan2(py - cy, px - cx) * 180) / Math.PI);
      const snap = Math.round(deg / 45) * 45;
      if (Math.abs(deg - snap) < 3.5) deg = normDeg(snap);
      const rNorm = clamp(Math.hypot(px - cx, py - cy) / R, Math.max(0.52, s.hubRatio + 0.16), 0.95);
      const nextAngles = [...s.spokeAngles];
      const nextReaches = [...s.spokeReaches];
      nextAngles[drag.spokeIdx] = deg;
      nextReaches[drag.spokeIdx] = rNorm;
      setState({ ...s, spokeAngles: nextAngles, spokeReaches: nextReaches, selectedSpoke: drag.spokeIdx }, { dragging: true });
      return true;
    }

    if (drag.mode === "hub") {
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const nextHub = clamp(Math.hypot(px - cx, py - cy) / R, 0.16, 0.48);
      setState({ ...s, hubRatio: Number(nextHub.toFixed(2)) }, { dragging: true });
      return true;
    }

    if (drag.mode === "pan") {
      const deltaNorm = dx / Math.max(160, rect.width * 0.52);
      const nextSpread = clamp(drag.startSpread + deltaNorm * 0.72, 0.24, 1);
      const nextRot = drag.startRot + deltaNorm * 34;
      setState(
        {
          ...s,
          pattern: "full",
          spread: Number(nextSpread.toFixed(3)),
          rotationDeg: Number(nextRot.toFixed(1)),
          spokeAngles: anglesFromSpread(nextSpread, nextRot, "full"),
        },
        { dragging: true }
      );
      return true;
    }
    return false;
  }

  function endDrag() {
    if (!drag) return;
    const wasClickSpoke = !drag.moved && drag.mode === "spoke" && drag.spokeIdx >= 0;
    const idx = drag.spokeIdx;
    drag = null;
    onDragState?.(false);
    if (wasClickSpoke) {
      const s = getState();
      const tiers = [...s.spokeTiers];
      tiers[idx] = (tiers[idx] + 2) % 3;
      const reaches = [...s.spokeReaches];
      reaches[idx] = tiers[idx] === 2 ? 0.91 : tiers[idx] === 1 ? 0.73 : 0.58;
      setState({ ...s, spokeTiers: tiers, spokeReaches: reaches, selectedSpoke: idx });
    } else {
      // 拖完立刻同步一次完整 DOM 读数
      setState(getState());
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    canvas.setPointerCapture?.(e.pointerId);
    startDrag(e.clientX, e.clientY, e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (drag && drag.id === e.pointerId) {
      moveDrag(e.clientX, e.clientY);
      if (reducedMotion.matches) ctl.draw();
    } else {
      const hit = hitTest(e.clientX, e.clientY);
      const nextHover = hit.kind === "spoke" ? hit.index : -1;
      if (nextHover !== hoverSpoke) {
        hoverSpoke = nextHover;
        canvas.style.cursor = hit.kind === "spoke" ? "grab" : "ew-resize";
        if (reducedMotion.matches) ctl.draw();
      }
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointercancel", () => { drag = null; onDragState?.(false); });

  canvas.addEventListener("touchstart", (e) => {
    const t0 = e.touches[0];
    if (t0) startDrag(t0.clientX, t0.clientY, t0.identifier);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    const t0 = e.touches[0];
    if (!t0 || !drag) return;
    const consumed = moveDrag(t0.clientX, t0.clientY);
    if (consumed) {
      e.preventDefault();
      if (reducedMotion.matches) ctl.draw();
    }
  }, { passive: false });
  canvas.addEventListener("touchend", () => endDrag(), { passive: true });
  canvas.addEventListener("touchcancel", () => { drag = null; onDragState?.(false); }, { passive: true });

  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextSpread = clamp(s.spread + dir * 0.08, 0.24, 1);
      const nextRot = s.rotationDeg + dir * 6;
      setState({ ...s, spread: Number(nextSpread.toFixed(3)), rotationDeg: nextRot, spokeAngles: anglesFromSpread(nextSpread, nextRot, "full") });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? 1 : -1;
      setState({ ...s, hubRatio: Number(clamp(s.hubRatio + dir * 0.02, 0.16, 0.48).toFixed(2)) });
    } else if (e.key === " ") {
      e.preventDefault();
      const order = ["continuous", "autoFlip", "horizontal"];
      setState({ ...s, baselineMode: order[(order.indexOf(s.baselineMode) + 1) % order.length] });
    }
  });

  const ctl = loop(canvas, drawFrame);
  window.addEventListener("resize", () => {
    bgCache = null;
    hubCache = null;
    if (reducedMotion.matches) ctl.draw();
  });

  return {
    draw: () => ctl.draw(),
    getLastEval: () => lastEval,
  };
}
