// 054 离心式构图 · 开场「离心抛射实验盘」2D Canvas 渲染与手势引擎
// 严禁 shadowBlur 以保障慢手机与 SwiftShader 软件渲染高帧率；完整支持鼠标、触屏与键盘。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { buildScene, evaluateState, SCENARIOS, rayToRectDist } from "./model.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const PALETTE = {
  paper: "#FBF0DD",
  paperDot: "rgba(180, 160, 130, 0.24)",
  track: "rgba(34, 42, 52, 0.28)",
  trackBold: "rgba(19, 71, 184, 0.24)",
  red: "#E94126",
  redArrow: "#E24029",
  redDark: "#B52610",
  blue: "#1347B8",
  blueSoft: "rgba(19, 71, 184, 0.16)",
  ink: "#161A1E",
  inkSoft: "rgba(22, 26, 30, 0.65)",
  mist: "#CFC8BC",
  mistStroke: "#B5AEA2",
  pass: "#0E6B58",
  warnBg: "#B52610"
};

export function initHeroStage(canvas, getState, updateState, onPulseDone) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let cssW = 760;
  let cssH = 490;
  let dpr = 1;

  // 开场柔和展开动画（0.65s 落定到初始错态）
  let introProgress = reducedMotion.matches ? 1 : 0;
  // 离心冲量脉冲动画（Space 触发）
  let pulseTime = -1;
  const PULSE_DURATION = 1.25;
  let pulseParticles = [];

  // 指针交互状态
  let hoverTarget = null; // { type: 'axis' | 'particle' | 'core', id }
  let dragMode = null;    // null | 'axis-red' | 'axis-blue' | 'field' | 'pending-touch'
  let dragStart = null;
  let activePointerId = null;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    cssW = rect.width;
    cssH = rect.height;
    // 移动端封顶 1.5，桌面封顶 2，兼顾清晰度与软件渲染帧率
    const cap = window.innerWidth <= 860 ? 1.5 : 2;
    dpr = pixelRatio(cap);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      dirty = true;
    }
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function triggerPulse() {
    const st = getState();
    const audit = evaluateState(st, cssW, cssH);
    const { scene, isPass } = audit;
    pulseTime = 0;
    // 按实绘轨道与双主箭发射 24 枚视线粒子
    pulseParticles = [];
    for (let i = 0; i < 24; i++) {
      const onRed = i === 0 || i === 1;
      const onBlue = i === 2 || i === 3;
      let angleRad;
      let color;
      if (onRed) {
        angleRad = scene.axes[0].angleRad + (i === 0 ? 0 : 0.04);
        color = PALETTE.red;
      } else if (onBlue) {
        angleRad = scene.axes[1].angleRad + (i === 2 ? 0 : -0.04);
        color = PALETTE.blue;
      } else {
        const track = scene.tracks[(i - 4) % scene.tracks.length];
        angleRad = track.angleRad;
        color = i % 3 === 0 ? PALETTE.red : i % 3 === 1 ? PALETTE.blue : PALETTE.ink;
      }
      const edgeDist = rayToRectDist(scene.cx, scene.cy, angleRad, cssW, cssH);
      // 错态下粒子受阻：闷核停在半路，外重撞黑块回弹，达标时畅快冲破边界
      let maxTravel = edgeDist * 1.06;
      let blocked = false;
      if (!isPass) {
        if (audit.fault === "collapsed") {
          maxTravel = edgeDist * Math.max(0.28, audit.metrics.avgSpreadPct / 100);
          blocked = true;
        } else if (audit.fault === "caged_axes" && (onRed || onBlue)) {
          maxTravel = (onRed ? scene.axes[0].tipDist : scene.axes[1].tipDist) * 1.02;
          blocked = true;
        } else if (audit.metrics.heavyRebelCount > 0 && i % 4 === 0) {
          maxTravel = edgeDist * 0.62;
          blocked = true;
        }
      }
      pulseParticles.push({
        angleRad,
        color,
        delay: (i % 6) * 0.035,
        speed: onRed || onBlue ? 1.15 : 0.85 + (i % 5) * 0.07,
        maxTravel,
        blocked,
        size: onRed || onBlue ? 4.8 : 3.2
      });
    }
    dirty = true;
    ctrl.draw();
  }

  function drawTaperedArrow(x0, y0, x1, y1, color, scale, isHovered, isActive, reachRatio) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 12) return;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    const headLen = Math.min(len * 0.34, 46 * scale);
    const headHalfW = Math.min(len * 0.24, 30 * scale);
    const shaftStartW = 2.0 * scale;
    const shaftEndW = Math.min(len * 0.105, 13.5 * scale);

    const neckX = x1 - ux * headLen;
    const neckY = y1 - uy * headLen;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0 + nx * shaftStartW, y0 + ny * shaftStartW);
    ctx.lineTo(neckX + nx * shaftEndW, neckY + ny * shaftEndW);
    ctx.lineTo(neckX + nx * headHalfW, neckY + ny * headHalfW);
    ctx.lineTo(x1, y1);
    ctx.lineTo(neckX - nx * headHalfW, neckY - ny * headHalfW);
    ctx.lineTo(neckX - nx * shaftEndW, neckY - ny * shaftEndW);
    ctx.lineTo(x0 - nx * shaftStartW, y0 - ny * shaftStartW);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // 边界突破时在箭锋两侧画极细能量短线
    if (reachRatio >= 0.85) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4 * scale;
      const bDist = len * 0.78;
      for (const side of [-1, 1]) {
        const bx = x0 + ux * bDist + nx * side * (headHalfW * 0.85);
        const by = y0 + uy * bDist + ny * side * (headHalfW * 0.85);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + ux * 16 * scale, by + uy * 16 * scale);
        ctx.stroke();
      }
    }

    // 可拖手柄圈（仅细线标示，不破坏建构主义海报纯粹感）
    const hx = x0 + ux * Math.min(len - 8 * scale, len * 0.86);
    const hy = y0 + uy * Math.min(len - 8 * scale, len * 0.86);
    ctx.beginPath();
    ctx.arc(hx, hy, (isActive ? 9 : isHovered ? 8 : 5.5) * scale, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.paper;
    ctx.fill();
    ctx.lineWidth = (isHovered || isActive ? 2.4 : 1.7) * scale;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
  }

  function drawParticle(p, scale, hovered) {
    const fill =
      p.color === "red" ? PALETTE.red :
      p.color === "blue" ? PALETTE.blue :
      p.color === "mist" ? PALETTE.mist :
      PALETTE.ink;

    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.shape === "dot" || p.shape === "grayOrb") {
      ctx.beginPath();
      ctx.arc(0, 0, p.rPx, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    } else if (p.shape === "ring") {
      ctx.beginPath();
      ctx.arc(0, 0, p.rPx, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1.8, 2.3 * scale);
      ctx.strokeStyle = fill;
      ctx.stroke();
    } else if (p.shape === "rect") {
      ctx.rotate(p.angleRad + 0.35);
      const rw = p.rPx * 1.45;
      const rh = p.rPx * 1.15;
      ctx.fillStyle = fill;
      ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
    } else if (p.shape === "bar") {
      ctx.rotate(p.angleRad);
      const bw = p.rPx * 2.5;
      const bh = Math.max(2.6, 3.4 * scale);
      ctx.fillStyle = fill;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    } else if (p.shape === "tri") {
      ctx.rotate(p.angleRad);
      const s = p.rPx * 1.25;
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.72, s * 0.65);
      ctx.lineTo(-s * 0.72, -s * 0.65);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    // 若属于喧宾外圈纯黑巨块：此处仅画红虚线警戒圈，标签统一放在最后顶层绘制防遮挡
    if (p.isHeavyRebel) {
      ctx.beginPath();
      ctx.setLineDash([4 * scale, 3 * scale]);
      ctx.arc(0, 0, p.rPx + 6 * scale, 0, Math.PI * 2);
      ctx.lineWidth = (hovered ? 2.4 : 1.7) * scale;
      ctx.strokeStyle = PALETTE.red;
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (p.clickable && hovered) {
      ctx.beginPath();
      ctx.arc(0, 0, p.rPx + 5 * scale, 0, Math.PI * 2);
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeStyle = PALETTE.blue;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRebelTag(p, scale) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const label = "× 点此降重";
    ctx.font = `600 ${Math.max(10, Math.round(11 * scale))}px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(label).width;
    const pillW = tw + 12 * scale;
    const pillH = 20 * scale;
    let py = p.rPx + 10 * scale;
    if (p.y + py + pillH > cssH - 34) py = -(p.rPx + pillH + 10 * scale);
    let px = -pillW / 2;
    if (p.x + px < 8) px = 8 - p.x;
    if (p.x + px + pillW > cssW - 8) px = cssW - 8 - p.x - pillW;

    ctx.fillStyle = PALETTE.warnBg;
    ctx.fillRect(px, py, pillW, pillH);
    ctx.fillStyle = "#FFF9EE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, px + pillW / 2, py + pillH / 2 + 0.5);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + dt / 0.65);
      dirty = true;
    }

    if (pulseTime >= 0) {
      if (still) {
        pulseTime = 0.52;
      } else {
        pulseTime += dt;
        dirty = true;
        if (pulseTime >= PULSE_DURATION) {
          pulseTime = -1;
          pulseParticles = [];
          if (onPulseDone) onPulseDone();
        }
      }
    }

    // 静置且无动画时不重画，节省手机电量和 CPU
    if (!dirty && !still) return;
    dirty = false;

    const st = getState();
    const audit = evaluateState(st, cssW, cssH);
    const { scene, isPass, metrics } = audit;
    const { cx, cy, baseScale, coreR, innerRingR, outerRingR, axes, particles, tracks } = scene;
    const ease = 1 - Math.pow(1 - introProgress, 3);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 暖奶油原海报纸底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 2. 极轻建构主义边界安全框与对角参考刻度（开启 guides 时）
    if (st.guides) {
      ctx.save();
      ctx.strokeStyle = "rgba(22, 26, 30, 0.08)";
      ctx.lineWidth = 1;
      const pad = Math.round(14 * baseScale);
      ctx.strokeRect(pad, pad, cssW - pad * 2, cssH - pad * 2);

      // 外圈 80% 破边张力参考虚线环
      const maxEdge = Math.min(cx, cy) * 0.86;
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.arc(cx, cy, maxEdge, 0, Math.PI * 2);
      ctx.strokeStyle = isPass ? "rgba(14, 107, 88, 0.22)" : "rgba(19, 71, 184, 0.18)";
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. 20 条原海报细虚线放射轨道（合批为单次 stroke 提升软件渲染帧率）
    ctx.save();
    ctx.strokeStyle = PALETTE.track;
    ctx.lineWidth = 1;
    ctx.setLineDash([2.5, 4]);
    ctx.beginPath();
    for (const tr of tracks) {
      const rEnd = tr.r0 + (tr.r1 - tr.r0) * ease;
      ctx.moveTo(cx + Math.cos(tr.angleRad) * tr.r0, cy + Math.sin(tr.angleRad) * tr.r0);
      ctx.lineTo(cx + Math.cos(tr.angleRad) * rEnd, cy + Math.sin(tr.angleRad) * rEnd);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 4. 中心同心细轨道环 + 原海报标志性红/黑/蓝局部断弧
    ctx.save();
    // 细红内环
    ctx.beginPath();
    ctx.arc(cx, cy, coreR + 6 * baseScale, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(233, 65, 38, 0.42)";
    ctx.lineWidth = 1.1 * baseScale;
    ctx.stroke();

    // 灰虚线轨道环
    ctx.beginPath();
    ctx.setLineDash([2, 3]);
    ctx.arc(cx, cy, innerRingR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(22, 26, 30, 0.32)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, outerRingR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(22, 26, 30, 0.22)";
    ctx.stroke();
    ctx.setLineDash([]);

    // 原海报局部实线断弧（左上黑弧、左下蓝弧、右下红弧、外侧细黑弧）
    const arcs = [
      { r: outerRingR + 10 * baseScale, a0: -2.95, a1: -1.45, color: PALETTE.ink, w: 1.6 },
      { r: outerRingR + 24 * baseScale, a0: -3.05, a1: -2.18, color: PALETTE.blue, w: 1.4 },
      { r: outerRingR + 16 * baseScale, a0: -0.25, a1: 0.72, color: PALETTE.red, w: 1.5 },
      { r: outerRingR + 8 * baseScale, a0: 0.55, a1: 1.38, color: PALETTE.ink, w: 1.1 }
    ];
    for (const a of arcs) {
      ctx.beginPath();
      ctx.arc(cx, cy, a.r, a.a0, a.a0 + (a.a1 - a.a0) * ease);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = a.w * baseScale;
      ctx.stroke();
    }
    ctx.restore();

    // 5. 红蓝对角双主冲量箭头（先画于核外，保持清晰层次）
    for (const ax of axes) {
      const tipX = ax.sx + (ax.tx - ax.sx) * ease;
      const tipY = ax.sy + (ax.ty - ax.sy) * ease;
      const isHov = hoverTarget?.type === "axis" && hoverTarget.id === ax.id;
      const isAct = dragMode === `axis-${ax.id}`;
      drawTaperedArrow(
        ax.sx,
        ax.sy,
        tipX,
        tipY,
        ax.color === "red" ? PALETTE.redArrow : PALETTE.blue,
        baseScale,
        isHov,
        isAct,
        ax.reachRatio
      );
    }

    // 6. 18 枚离心抛射体（先常规元素，再喧宾黑块，最后顶层绘制提示签防遮挡）
    const placedParticles = particles.map((p) => ({
      ...p,
      x: cx + (p.x - cx) * ease,
      y: cy + (p.y - cy) * ease
    }));
    for (const p of placedParticles) {
      if (p.isHeavyRebel) continue;
      const isHov = hoverTarget?.type === "particle" && hoverTarget.id === p.id;
      drawParticle(p, baseScale, isHov);
    }
    for (const p of placedParticles) {
      if (!p.isHeavyRebel) continue;
      const isHov = hoverTarget?.type === "particle" && hoverTarget.id === p.id;
      drawParticle(p, baseScale, isHov);
    }
    for (const p of placedParticles) {
      if (p.isHeavyRebel) drawRebelTag(p, baseScale);
    }

    // 7. 中心朱砂红锚核（最稳视觉原点）
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * (0.35 + 0.65 * ease), 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.red;
    ctx.fill();

    // 核太小时画红虚线提示环，醒目表达「中心失锚」
    if (st.anchorSize < 11) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.arc(cx, cy, Math.max(coreR + 12 * baseScale, 28 * baseScale), 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE.redDark;
      ctx.lineWidth = 1.6 * baseScale;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 品牌发布 / 科技峰会语境下在红核内印极简白色标识字（当核够大时）
    const sc = SCENARIOS[st.scenario] || SCENARIOS.poster;
    if (st.scenario !== "poster" && coreR >= 24 * baseScale) {
      ctx.fillStyle = "#FFF9EE";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${Math.max(10, Math.round(coreR * 0.34))}px "Bricolage Grotesque", sans-serif`;
      ctx.fillText(sc.coreEn, cx, cy - coreR * 0.14);
      ctx.font = `700 ${Math.max(10, Math.round(coreR * 0.24))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(sc.coreTag, cx, cy + coreR * 0.24);
    } else if (st.anchorSize < 11) {
      const warnTxt = "核过小·失锚";
      const warnFontSize = Math.max(10, Math.round(11 * baseScale));
      ctx.font = `700 ${warnFontSize}px "Noto Sans SC", sans-serif`;
      const warnW = ctx.measureText(warnTxt).width + 12 * baseScale;
      const warnH = Math.max(18, 19 * baseScale);
      const warnY = cy + coreR + 14 * baseScale;
      ctx.fillStyle = "rgba(251, 240, 221, 0.94)";
      ctx.fillRect(cx - warnW / 2, warnY, warnW, warnH);
      ctx.strokeStyle = "rgba(181, 38, 16, 0.42)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - warnW / 2, warnY, warnW, warnH);
      ctx.fillStyle = PALETTE.redDark;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(warnTxt, cx, warnY + warnH / 2 + 0.5);
    }
    ctx.restore();

    // 8. Space 离心冲量脉冲与 24 枚视线流珠
    if (pulseTime >= 0) {
      const pNorm = clamp(pulseTime / PULSE_DURATION, 0, 1);
      // 双道扩散冲击环
      const maxRing = Math.hypot(cx, cy) * 1.05;
      const rWave = coreR + (maxRing - coreR) * (1 - Math.pow(1 - pNorm, 2));
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rWave, 0, Math.PI * 2);
      ctx.strokeStyle = isPass
        ? `rgba(14, 107, 88, ${(1 - pNorm) * 0.55})`
        : `rgba(233, 65, 38, ${(1 - pNorm) * 0.65})`;
      ctx.lineWidth = 2.2 * baseScale;
      ctx.stroke();

      for (const pp of pulseParticles) {
        const localT = clamp((pNorm - pp.delay) * pp.speed * 1.25, 0, 1);
        if (localT <= 0) continue;
        let prog = 1 - Math.pow(1 - localT, 2.2);
        // 受阻粒子在到达障碍时回弹变红
        if (pp.blocked && localT > 0.65) {
          prog = 0.92 - (localT - 0.65) * 0.45;
        }
        const d = coreR + (pp.maxTravel - coreR) * prog;
        const bx = cx + Math.cos(pp.angleRad) * d;
        const by = cy + Math.sin(pp.angleRad) * d;
        const tailD = Math.max(coreR, d - 24 * baseScale * (1 - localT * 0.5));
        const tx = cx + Math.cos(pp.angleRad) * tailD;
        const ty = cy + Math.sin(pp.angleRad) * tailD;

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = pp.blocked && localT > 0.62 ? PALETTE.red : pp.color;
        ctx.lineWidth = 2 * baseScale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx, by, pp.size * baseScale, 0, Math.PI * 2);
        ctx.fillStyle = pp.blocked && localT > 0.62 ? PALETTE.red : pp.color;
        ctx.fill();
      }
      ctx.restore();
    }

    // 9. 左上角极简仪器刻度微条（无重黑盒，直印在宣纸角）
    ctx.save();
    const hudText = `SPREAD ${metrics.avgSpreadPct}% · DECAY ${metrics.decayRatio}× · AXIS ${metrics.maxAxisReachPct}%`;
    const hudFontSize = Math.max(10, Math.round(11 * Math.min(1.05, baseScale + 0.12)));
    ctx.font = `500 ${hudFontSize}px "IBM Plex Mono", monospace`;
    const hudW = ctx.measureText(hudText).width + 18;
    ctx.fillStyle = "rgba(255, 249, 238, 0.92)";
    ctx.fillRect(14, 14, hudW, 24);
    ctx.strokeStyle = "rgba(19, 71, 184, 0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, hudW, 24);
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, 23, 26.5);

    // 右上角极简状态徽
    const chipText = audit.shortTag;
    ctx.font = `600 ${hudFontSize}px "Noto Sans SC", sans-serif`;
    const chipW = ctx.measureText(chipText).width + 18;
    ctx.fillStyle = isPass ? PALETTE.pass : PALETTE.warnBg;
    ctx.fillRect(cssW - 14 - chipW, 14, chipW, 24);
    ctx.fillStyle = "#FFF9EE";
    ctx.textAlign = "center";
    ctx.fillText(chipText, cssW - 14 - chipW / 2, 26.5);

    // 底部极细单行手势引导提示（置于右下静角，彻底避开左下钴蓝巨箭箭锋）
    if (cssW >= 540) {
      const tip = "横拖甩推力 · 纵拖调衰减 · 拖红蓝箭锋 · 点黑块降重 · Space 发射";
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      const tipW = ctx.measureText(tip).width + 18;
      const tipX = cssW - 14 - tipW;
      ctx.fillStyle = "rgba(255, 249, 238, 0.92)";
      ctx.fillRect(tipX, cssH - 30, tipW, 22);
      ctx.strokeStyle = "rgba(11, 14, 15, 0.14)";
      ctx.lineWidth = 1;
      ctx.strokeRect(tipX, cssH - 30, tipW, 22);
      ctx.fillStyle = "#474B4D";
      ctx.textAlign = "right";
      ctx.fillText(tip, cssW - 23, cssH - 18.5);
    }
    ctx.restore();

    ctx.restore();
  }

  // 指针命中检测
  function hitTest(px, py) {
    const st = getState();
    const scene = buildScene(st, cssW, cssH);
    const hitR = Math.max(22, 24 * scene.baseScale);

    // 1. 优先命中红/蓝箭锋手柄
    for (const ax of scene.axes) {
      if (Math.hypot(px - ax.hx, py - ax.hy) <= hitR || Math.hypot(px - ax.tx, py - ax.ty) <= hitR) {
        return { type: "axis", id: ax.id };
      }
    }
    // 2. 其次命中可点击的外圈元素（特别是喧宾重黑块）
    for (const p of scene.particles) {
      if (!p.clickable) continue;
      if (Math.hypot(px - p.x, py - p.y) <= Math.max(p.rPx + 14, 24)) {
        return { type: "particle", id: p.id };
      }
    }
    return null;
  }

  function getLocalPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handlePointerDown(e) {
    if (e.button && e.button !== 0) return;
    const pos = getLocalPos(e);
    const hit = hitTest(pos.x, pos.y);
    const st = getState();

    activePointerId = e.pointerId;
    dragStart = {
      x: pos.x,
      y: pos.y,
      impulse: st.impulse,
      decay: st.decay,
      redReach: st.redReach,
      blueReach: st.blueReach,
      axisSplit: st.axisSplit,
      moved: false,
      hit
    };

    if (hit && hit.type === "axis") {
      dragMode = `axis-${hit.id}`;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
    } else if (e.pointerType === "touch") {
      // 触屏先等待判断横拖还是竖滚页面
      dragMode = "pending-touch";
    } else {
      dragMode = "field";
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function handlePointerMove(e) {
    const pos = getLocalPos(e);
    if (!dragMode) {
      const nextHit = hitTest(pos.x, pos.y);
      const changed =
        (nextHit?.type || "") !== (hoverTarget?.type || "") ||
        (nextHit?.id ?? "") !== (hoverTarget?.id ?? "");
      if (changed) {
        hoverTarget = nextHit;
        canvas.style.cursor = nextHit ? (nextHit.type === "axis" ? "grab" : "pointer") : "ew-resize";
        dirty = true;
        if (reducedMotion.matches) ctrl.draw();
      }
      return;
    }

    if (e.pointerId !== activePointerId) return;
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    if (Math.hypot(dx, dy) > 5) dragStart.moved = true;

    if (dragMode === "pending-touch") {
      // 纵向滑动为主时放弃接管，让页面正常滚动
      if (Math.abs(dy) > Math.abs(dx) + 6 && Math.abs(dy) > 8) {
        dragMode = null;
        activePointerId = null;
        return;
      }
      if (Math.abs(dx) >= 4) {
        dragMode = "field";
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      } else {
        return;
      }
    }

    const st = getState();
    const scene = buildScene(st, cssW, cssH);

    if (dragMode === "axis-red" || dragMode === "axis-blue") {
      e.preventDefault();
      const vx = pos.x - scene.cx;
      const vy = pos.y - scene.cy;
      const angRad = Math.atan2(vy, vx);
      const eDist = rayToRectDist(scene.cx, scene.cy, angRad, cssW, cssH);
      const dist = Math.hypot(vx, vy);
      const reachPct = Math.round(Math.max(24, Math.min(106, (dist / eDist) * 100)));

      if (dragMode === "axis-red") {
        if (reachPct !== st.redReach) updateState({ redReach: reachPct }, { fromCanvas: true });
      } else {
        // 允许同时拖蓝色箭锋的长度与相对红箭的夹角
        let deg = (angRad * 180) / Math.PI;
        let split = ((deg - (-50)) % 360 + 360) % 360;
        if (split > 240) split = 360 - split;
        split = Math.round(Math.max(70, Math.min(185, split)));
        if (reachPct !== st.blueReach || split !== st.axisSplit) {
          updateState({ blueReach: reachPct, axisSplit: split }, { fromCanvas: true });
        }
      }
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
      return;
    }

    if (dragMode === "field") {
      e.preventDefault();
      // 横拖驱动离心推力，纵拖驱动内强外弱衰减梯度
      const impulseDelta = (dx / Math.max(180, cssW * 0.45)) * 78;
      const nextImpulse = Math.round(Math.max(6, Math.min(100, dragStart.impulse + impulseDelta)));

      const patch = { impulse: nextImpulse };
      // 鼠标或明显纵拖时同步调衰减（触屏只取横拖，防误触与抢滚屏）
      if (e.pointerType !== "touch") {
        const decayDelta = (-dy / Math.max(160, cssH * 0.55)) * 120;
        patch.decay = Math.round(Math.max(-60, Math.min(100, dragStart.decay + decayDelta)));
      }
      // 拖高推力时轻微联动双箭伸展，提供自然物理飞轮手感
      const reachSync = Math.round(Math.max(30, Math.min(100, dragStart.redReach + impulseDelta * 0.72)));
      const blueSync = Math.round(Math.max(30, Math.min(100, dragStart.blueReach + impulseDelta * 0.72)));
      patch.redReach = reachSync;
      patch.blueReach = blueSync;

      if (
        patch.impulse !== st.impulse ||
        (patch.decay !== undefined && patch.decay !== st.decay) ||
        patch.redReach !== st.redReach ||
        patch.blueReach !== st.blueReach
      ) {
        updateState(patch, { fromCanvas: true });
      }
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
    }
  }

  function handlePointerUp(e) {
    if (e.pointerId !== activePointerId) return;
    // 点击未拖动时：如果命中可点击外圈元素，直接切换喧宾重块 ↔ 透气暖灰/空心环
    if (dragStart && !dragStart.moved && dragStart.hit?.type === "particle") {
      const id = dragStart.hit.id;
      const st = getState();
      const set = new Set(st.heavyOuter || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      updateState({ heavyOuter: [...set] }, { fromCanvas: true });
    }
    dragMode = null;
    activePointerId = null;
    dragStart = null;
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  canvas.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  const ctrl = loop(canvas, render);

  return {
    markDirty() {
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
    },
    triggerPulse,
    getSize: () => ({ w: cssW, h: cssH })
  };
}
