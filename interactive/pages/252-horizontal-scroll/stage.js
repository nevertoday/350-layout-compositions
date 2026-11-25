// 252 横向卷轴 · 2D 物理惯性片窗台（Scrollport & Reel Deck）
// 1:1 承袭 252 原海报极夜海蓝底面、亮湖青双层可视窗口、珊瑚粉方向箭与 01–04 标志图形。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeGeometry, PALETTE } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawCardArt(ctx, art, x, y, w, h, active) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = Math.min(w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const cyan = PALETTE.cyanMid;
  const cyanBright = PALETTE.cyan;
  const coral = PALETTE.coralStrong;
  const cream = PALETTE.cream;
  const bg = active ? PALETTE.cardActive : PALETTE.card;

  if (art === "prelude") {
    // 00 序幕：呼应原海报左缘露出卡片（暖象牙半圆 + 冷蓝小圆）
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.arc(x + w * 0.28, cy - s * 0.04, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5F78A0";
    ctx.beginPath();
    ctx.arc(x + w * 0.68, cy + s * 0.24, s * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = coral;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.52, cy - s * 0.04);
    ctx.lineTo(x + w * 0.88, cy - s * 0.04);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (art === "start") {
    // 01 起点 START：1:1 原海报暖象牙双峰山 + 右上珊瑚粉日轮
    ctx.fillStyle = coral;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.28, s * 0.19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y + h * 0.88);
    ctx.lineTo(x + w * 0.44, y + h * 0.24);
    ctx.lineTo(x + w * 0.62, y + h * 0.62);
    ctx.lineTo(x + w * 0.72, y + h * 0.47);
    ctx.lineTo(x + w * 0.9, y + h * 0.88);
    ctx.closePath();
    ctx.fill();
  } else if (art === "explore") {
    // 02 探索 EXPLORE：1:1 原海报左下亮湖青弧丘 + 虚线弧轨飞向右上珊瑚粉圆点
    ctx.fillStyle = cyan;
    ctx.beginPath();
    ctx.arc(x + w * 0.04, y + h * 0.96, s * 0.68, -Math.PI * 0.52, 0.08);
    ctx.lineTo(x + w * 0.04, y + h * 0.96);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = cream;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + h * 0.62);
    ctx.bezierCurveTo(x + w * 0.56, y + h * 0.76, x + w * 0.58, y + h * 0.34, x + w * 0.77, y + h * 0.26);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = coral;
    ctx.beginPath();
    ctx.arc(x + w * 0.8, y + h * 0.24, s * 0.145, 0, Math.PI * 2);
    ctx.fill();
  } else if (art === "integrate") {
    // 03 整合 INTEGRATE：1:1 原海报暖象牙圆与亮湖青圆交叠处精确染珊瑚粉
    const r = s * 0.285;
    const c1 = { x: cx - r * 0.58, y: cy + r * 0.18 };
    const c2 = { x: cx + r * 0.58, y: cy - r * 0.14 };
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.arc(c1.x, c1.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cyan;
    ctx.beginPath();
    ctx.arc(c2.x, c2.y, r, 0, Math.PI * 2);
    ctx.fill();
    // 精确裁剪双圆交叠纺锤区为珊瑚粉
    ctx.save();
    ctx.beginPath();
    ctx.arc(c1.x, c1.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = coral;
    ctx.beginPath();
    ctx.arc(c2.x, c2.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (art === "complete") {
    // 04 完成 COMPLETE：1:1 原海报珊瑚粉方块 + 右下暖象牙圆内嵌深蓝对勾
    const sq = s * 0.44;
    ctx.fillStyle = coral;
    ctx.fillRect(cx - sq * 0.74, cy - sq * 0.56, sq, sq);
    const cr = s * 0.24;
    const rx = cx + sq * 0.34;
    const ry = cy + sq * 0.28;
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.arc(rx, ry, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.bg;
    ctx.lineWidth = Math.max(2.4, s * 0.032);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(rx - cr * 0.42, ry + cr * 0.02);
    ctx.lineTo(rx - cr * 0.1, ry + cr * 0.34);
    ctx.lineTo(rx + cr * 0.45, ry - cr * 0.3);
    ctx.stroke();
  } else if (art === "continuum") {
    // 05 余韵：三圆推进 + 虚线箭
    const yMid = cy;
    ctx.strokeStyle = coral;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, yMid);
    ctx.lineTo(x + w * 0.78, yMid);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.71, yMid - 7);
    ctx.lineTo(x + w * 0.81, yMid);
    ctx.lineTo(x + w * 0.71, yMid + 7);
    ctx.stroke();
    [0.24, 0.44, 0.62].forEach((f, idx) => {
      ctx.fillStyle = idx === 2 ? cream : cyanBright;
      ctx.beginPath();
      ctx.arc(x + w * f, yMid, s * (0.08 + idx * 0.025), 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (art === "scroll" || art === "film" || art === "coverflow" || art === "momentum" || art === "snap" || art === "reel") {
    // 影展时间轴几何图谱
    if (art === "scroll") {
      ctx.fillStyle = cream;
      ctx.fillRect(x + w * 0.18, cy - s * 0.22, w * 0.64, s * 0.44);
      ctx.fillStyle = coral;
      ctx.fillRect(x + w * 0.13, cy - s * 0.28, w * 0.07, s * 0.56);
      ctx.fillRect(x + w * 0.8, cy - s * 0.28, w * 0.07, s * 0.56);
      ctx.strokeStyle = PALETTE.bg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.28, cy + s * 0.08);
      ctx.quadraticCurveTo(cx, cy - s * 0.16, x + w * 0.72, cy + s * 0.06);
      ctx.stroke();
    } else if (art === "film") {
      ctx.strokeStyle = cyanBright;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + w * 0.12, cy - s * 0.28, w * 0.76, s * 0.56);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = cream;
        ctx.fillRect(x + w * (0.17 + i * 0.18), cy - s * 0.23, w * 0.1, s * 0.06);
        ctx.fillRect(x + w * (0.17 + i * 0.18), cy + s * 0.17, w * 0.1, s * 0.06);
      }
      ctx.fillStyle = coral;
      ctx.fillRect(cx - w * 0.16, cy - s * 0.12, w * 0.32, s * 0.24);
    } else if (art === "coverflow") {
      ctx.fillStyle = "#1B3F72";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.12, cy - s * 0.26);
      ctx.lineTo(x + w * 0.3, cy - s * 0.17);
      ctx.lineTo(x + w * 0.3, cy + s * 0.17);
      ctx.lineTo(x + w * 0.12, cy + s * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.88, cy - s * 0.26);
      ctx.lineTo(x + w * 0.7, cy - s * 0.17);
      ctx.lineTo(x + w * 0.7, cy + s * 0.17);
      ctx.lineTo(x + w * 0.88, cy + s * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = cyan;
      ctx.fillRect(cx - s * 0.2, cy - s * 0.2, s * 0.4, s * 0.4);
      ctx.fillStyle = coral;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (art === "momentum") {
      ctx.strokeStyle = cyanBright;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.14, cy + s * 0.22);
      ctx.bezierCurveTo(x + w * 0.34, cy - s * 0.3, x + w * 0.56, cy - s * 0.26, x + w * 0.86, cy - s * 0.22);
      ctx.stroke();
      [0.24, 0.46, 0.72].forEach((f, idx) => {
        ctx.fillStyle = idx === 2 ? coral : cream;
        ctx.beginPath();
        ctx.arc(x + w * f, cy + s * (0.04 - idx * 0.13), s * (0.06 + idx * 0.02), 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (art === "snap") {
      ctx.strokeStyle = "rgba(61,202,220,0.45)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, y + h * 0.14);
      ctx.lineTo(cx, y + h * 0.86);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cream;
      roundRectPath(ctx, cx - s * 0.24, cy - s * 0.18, s * 0.48, s * 0.36, 6);
      ctx.fill();
      ctx.fillStyle = coral;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 1 ? cyan : i === 2 ? coral : cream;
        roundRectPath(ctx, x + w * (0.1 + i * 0.28), cy - s * 0.22, w * 0.23, s * 0.44, 5);
        ctx.fill();
      }
    }
  } else {
    // 商城几何器物静物
    if (art === "drop") {
      ctx.fillStyle = coral;
      ctx.fillRect(cx - s * 0.26, cy - s * 0.22, s * 0.52, s * 0.44);
      ctx.fillStyle = bg;
      ctx.fillRect(cx - s * 0.12, cy - s * 0.08, s * 0.24, s * 0.16);
    } else if (art === "headphone") {
      ctx.strokeStyle = cream;
      ctx.lineWidth = Math.max(4, s * 0.055);
      ctx.beginPath();
      ctx.arc(cx, cy + s * 0.04, s * 0.26, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = cyan;
      roundRectPath(ctx, cx - s * 0.33, cy, s * 0.14, s * 0.24, 6);
      ctx.fill();
      roundRectPath(ctx, cx + s * 0.19, cy, s * 0.14, s * 0.24, 6);
      ctx.fill();
      ctx.fillStyle = coral;
      ctx.fillRect(cx - s * 0.29, cy + s * 0.06, s * 0.06, s * 0.12);
    } else if (art === "camera") {
      ctx.fillStyle = cream;
      roundRectPath(ctx, cx - s * 0.34, cy - s * 0.18, s * 0.68, s * 0.42, 7);
      ctx.fill();
      ctx.fillStyle = PALETTE.bg;
      ctx.beginPath();
      ctx.arc(cx + s * 0.04, cy + s * 0.03, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cyan;
      ctx.beginPath();
      ctx.arc(cx + s * 0.04, cy + s * 0.03, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = coral;
      ctx.fillRect(cx - s * 0.24, cy - s * 0.24, s * 0.16, s * 0.06);
    } else if (art === "kettle") {
      ctx.fillStyle = cyan;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.18, cy - s * 0.2);
      ctx.lineTo(cx + s * 0.14, cy - s * 0.2);
      ctx.lineTo(cx + s * 0.22, cy + s * 0.26);
      ctx.lineTo(cx - s * 0.24, cy + s * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = cream;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.18, cy + s * 0.12);
      ctx.bezierCurveTo(cx + s * 0.36, cy + s * 0.12, cx + s * 0.32, cy - s * 0.18, cx + s * 0.42, cy - s * 0.22);
      ctx.stroke();
      ctx.fillStyle = coral;
      ctx.beginPath();
      ctx.arc(cx - s * 0.02, cy - s * 0.26, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    } else if (art === "lamp") {
      ctx.fillStyle = coral;
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.06, s * 0.28, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = cream;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.06);
      ctx.lineTo(cx, cy + s * 0.26);
      ctx.stroke();
      ctx.fillStyle = cream;
      ctx.fillRect(cx - s * 0.2, cy + s * 0.24, s * 0.4, s * 0.07);
    } else {
      ctx.fillStyle = cream;
      roundRectPath(ctx, cx - s * 0.26, cy - s * 0.3, s * 0.52, s * 0.6, 7);
      ctx.fill();
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(cx - s * 0.19, cy - s * 0.22, s * 0.38, s * 0.42);
      ctx.fillStyle = cyan;
      ctx.fillRect(cx - s * 0.13, cy - s * 0.14, s * 0.26, s * 0.05);
      ctx.fillStyle = coral;
      ctx.fillRect(cx - s * 0.13, cy - s * 0.04, s * 0.18, s * 0.05);
    }
  }
  ctx.restore();
}

function wrapLines(ctx, text, maxW, maxLines) {
  const lines = [];
  const noLeadPunct = /^[，。、；：！？）》」]/;
  let cur = "";
  for (const ch of text) {
    const next = cur + ch;
    if (ctx.measureText(next).width > maxW && cur) {
      if (noLeadPunct.test(ch)) {
        lines.push(cur + ch);
        cur = "";
      } else {
        lines.push(cur);
        cur = ch;
      }
      if (lines.length === maxLines) return lines;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

export function createReelStage(canvas, getState, callbacks) {
  const ctx = canvas.getContext("2d");
  let width = 960;
  let height = 380;
  let dpr = pixelRatio(window.innerWidth <= 600 ? 1.5 : 2);
  let dirty = true;

  // 物理惯性状态
  let velPx = 0; // px/s（正值表示轨道向右滑即 scrollX 增大）
  let dragging = false;
  let pointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastT = 0;
  let dragAxis = ""; // "" | "x" | "y"
  let dragMovedPx = 0;
  let targetScrollX = null; // 吸附或按钮/点选目标
  let gesturePhase = "idle"; // "idle" | "hold" | "drag" | "release"
  let phaseDecay = 0;
  let introDone = reducedMotion.matches;
  let introTime = 0;

  let lastGeom = null;
  let vpBox = { x: 180, y: 26, w: 600, h: 310 };

  function computeVpBox() {
    // 桌面宽屏：居中亮湖青视窗约占宽 46%–54%，两侧展露连续轨道（1:1 呼应原海报）；
    // 手机窄屏：视窗占宽 80%–84%，让卡片面积大且清晰可见！
    const topPad = width < 520 ? 18 : 26;
    const botPad = width < 520 ? 38 : 46;
    const h = Math.max(176, height - topPad - botPad);
    let w;
    if (width < 520) {
      w = Math.round(width * 0.8);
    } else if (width < 880) {
      w = Math.round(width * 0.62);
    } else {
      // 控制在卡片舒适宽高比附近，既能展示 1 卡露边也能展示 2-3 卡
      w = Math.round(clamp(width * 0.44, 420, 620));
    }
    const x = Math.round((width - w) / 2);
    vpBox = { x, y: topPad, w, h };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    width = Math.round(r.width);
    height = Math.round(r.height);
    dpr = pixelRatio(window.innerWidth <= 600 ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    computeVpBox();
    dirty = true;
  }

  function emitTelemetry() {
    callbacks.onTelemetry?.({
      phase: gesturePhase,
      deltaPx: Math.round(dragMovedPx),
      velPx: Math.round(velPx),
    });
  }

  function stepPhysics(dt, still) {
    const st = getState();
    const geom = computeGeometry(st, vpBox.w, vpBox.h);
    let active = false;

    // 开场前 0.85s 轻滑到初始错态腰斩位（绝不自动修好成答案）
    if (!introDone && !still && !dragging && targetScrollX === null) {
      introTime += dt;
      active = true;
      if (introTime >= 0.85) {
        introDone = true;
      }
    }

    if (!dragging && !still && dt > 0) {
      if (targetScrollX !== null) {
        active = true;
        // 丝滑阻尼弹簧吸向目标槽位
        const diff = targetScrollX - geom.scrollX;
        if (Math.abs(diff) < 0.6 && Math.abs(velPx) < 12) {
          st.scrollIndex = geom.step > 0 ? targetScrollX / geom.step : 0;
          velPx = 0;
          targetScrollX = null;
          gesturePhase = "idle";
          callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), false);
          emitTelemetry();
        } else {
          const k = 1 - Math.exp(-dt * (st.physics === "step" ? 26 : 11.5));
          const nextX = geom.scrollX + diff * k;
          velPx = (nextX - geom.scrollX) / Math.max(dt, 0.008);
          st.scrollIndex = geom.step > 0 ? clamp(nextX, 0, geom.maxScroll) / geom.step : 0;
          callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), true);
          emitTelemetry();
        }
      } else if (Math.abs(velPx) > 4) {
        active = true;
        // 纯阻尼惯性滑行
        const dragCoeff = st.physics === "step" ? 18 : 4.4;
        const nextX = clamp(geom.scrollX + velPx * dt, 0, geom.maxScroll);
        velPx *= Math.exp(-dt * dragCoeff);
        if (nextX <= 0.5 || nextX >= geom.maxScroll - 0.5) velPx = 0;
        st.scrollIndex = geom.step > 0 ? nextX / geom.step : 0;
        if (Math.abs(velPx) <= 12) {
          velPx = 0;
          if (st.snap !== "off") {
            engageSnap(st, computeGeometry(st, vpBox.w, vpBox.h), 0);
          } else {
            gesturePhase = "idle";
            callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), false);
            emitTelemetry();
          }
        } else {
          callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), true);
          emitTelemetry();
        }
      } else if (phaseDecay > 0) {
        phaseDecay = Math.max(0, phaseDecay - dt);
        if (phaseDecay === 0 && gesturePhase === "release") {
          gesturePhase = "idle";
          emitTelemetry();
        }
      }
    }
    return active;
  }

  function engageSnap(st, geom, throwVelPx) {
    if (st.snap === "off" || !geom.stops.length) return;
    // 预测松手后的自然落点
    const projected = clamp(geom.scrollX + throwVelPx * (st.physics === "step" ? 0.03 : 0.19), 0, geom.maxScroll);
    let best = geom.stops[0];
    let bestD = Infinity;
    for (const s of geom.stops) {
      const d = Math.abs(projected - s);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (st.snap === "mandatory") {
      targetScrollX = best;
    } else if (st.snap === "proximity" && bestD < geom.step * 0.34) {
      targetScrollX = best;
    }
  }

  function scrollToIndex(idx, instant = false) {
    const st = getState();
    const geom = computeGeometry(st, vpBox.w, vpBox.h);
    const clamped = clamp(idx, 0, geom.maxIndex);
    introDone = true;
    velPx = 0;
    const rect = canvas.getBoundingClientRect();
    const visibleOnScreen = rect.bottom > 0 && rect.top < window.innerHeight;
    if (instant || reducedMotion.matches || !visibleOnScreen) {
      targetScrollX = null;
      st.scrollIndex = clamped;
      gesturePhase = "idle";
      callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), false);
      emitTelemetry();
    } else {
      targetScrollX = clamped * geom.step;
      gesturePhase = "release";
      phaseDecay = 0.7;
      callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), true);
      emitTelemetry();
    }
    runner.draw();
  }

  function draw(t, dt, { still }) {
    const active = stepPhysics(dt, still);
    if (!active && !dirty && !dragging) return;
    dirty = false;
    const st = getState();

    // 开场 0.85s 柔和滑向初始腰斩错位点（仅视觉偏移，状态仍真实）
    let renderState = st;
    if (!introDone && !still && !dragging && targetScrollX === null) {
      const p = clamp(introTime / 0.85, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      renderState = { ...st, scrollIndex: 0.72 + (st.scrollIndex - 0.72) * ease };
    }

    const geom = computeGeometry(renderState, vpBox.w, vpBox.h);
    lastGeom = geom;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 极夜深海背景（纯色零渐变开销，软件渲染 60fps）
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. 绘制整条连续轨道卡片（视窗外按 xray 决定透视或纯裁切）
    const cardY = vpBox.y + Math.round((vpBox.h - geom.cardH) / 2);
    const cardRadius = width < 520 ? 10 : 12;

    const drawAllCards = (inWindowPass) => {
      for (const c of geom.cards) {
        const cx = vpBox.x + c.x;
        if (cx + c.w < -16 || cx > width + 16) continue;
        // 视窗内只绘与视窗相交的卡；窗外透视跳过完全落于视窗内的卡，避免重复绘制
        if (inWindowPass && (cx + c.w <= vpBox.x || cx >= vpBox.x + vpBox.w)) continue;
        if (!inWindowPass && cx >= vpBox.x && cx + c.w <= vpBox.x + vpBox.w) continue;
        const isLead = c.index === geom.leadCard.index && inWindowPass;

        ctx.save();
        if (!inWindowPass) {
          ctx.globalAlpha = st.xray ? 0.36 : 0.0;
        }
        if (ctx.globalAlpha <= 0.01) {
          ctx.restore();
          continue;
        }

        // 卡底
        roundRectPath(ctx, cx, cardY, c.w, c.h, cardRadius);
        ctx.fillStyle = isLead ? PALETTE.cardActive : PALETTE.card;
        ctx.fill();
        ctx.strokeStyle = isLead ? PALETTE.cyan : PALETTE.cardBorder;
        ctx.lineWidth = isLead ? 1.5 : 1;
        ctx.stroke();

        const padX = Math.round(clamp(c.w * 0.095, 10, 22));
        const padTop = Math.round(clamp(c.h * 0.085, 14, 24));
        const numSize = Math.round(clamp(c.w * 0.13, 16, 30));
        const zhSize = Math.round(clamp(c.w * 0.085, 13, 19));
        const enSize = Math.round(clamp(c.w * 0.048, 10, 12));
        const bodySize = Math.round(clamp(c.w * 0.056, 11, 13.5));

        // 编号 01 / 02 / 03 / 04
        ctx.font = `700 ${numSize}px "Syne", "Manrope", sans-serif`;
        ctx.fillStyle = isLead ? PALETTE.cyan : PALETTE.ink;
        ctx.textBaseline = "top";
        ctx.fillText(c.meta.num, cx + padX, cardY + padTop);

        // 中文卡名 + 英文标
        const titleY = cardY + padTop + numSize + 6;
        ctx.font = `700 ${zhSize}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = isLead ? PALETTE.cyan : PALETTE.ink;
        ctx.fillText(c.meta.zh, cx + padX, titleY);

        ctx.font = `600 ${enSize}px "Manrope", sans-serif`;
        ctx.fillStyle = isLead ? PALETTE.cyanMid : PALETTE.inkSub;
        ctx.fillText(c.meta.en, cx + padX, titleY + zhSize + 4);

        // 标志矢量图形区
        const artTop = titleY + zhSize + enSize + 14;
        const artH = Math.max(54, Math.round(c.h * 0.37));
        drawCardArt(ctx, c.meta.art, cx + padX * 0.5, artTop, c.w - padX, artH, isLead);

        // 底部两行说明文
        const bodyY = artTop + artH + 10;
        ctx.font = `400 ${bodySize}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = PALETTE.inkSub;
        const lines = wrapLines(ctx, c.meta.body, Math.max(40, c.w - padX * 2), 2);
        lines.forEach((ln, li) => {
          ctx.fillText(ln, cx + padX, bodyY + li * (bodySize + 5));
        });

        // 原海报每卡底沿亮湖青短胶囊
        const pillW = Math.round(clamp(c.w * 0.14, 18, 32));
        const pillY = cardY + c.h - 16;
        ctx.fillStyle = isLead ? PALETTE.cyan : "rgba(43, 183, 204, 0.72)";
        ctx.fillRect(cx + padX, pillY, pillW, 4);

        ctx.restore();
      }
    };

    // Pass A：全轨道底影（仅透视模式可见）
    if (st.xray) {
      drawAllCards(false);
    }

    // Pass B：亮湖青「可视窗口 VIEWPORT」内部清晰裁剪区（矩形 clip 比曲线路径 clip 快 5×）
    ctx.save();
    ctx.beginPath();
    ctx.rect(vpBox.x, vpBox.y, vpBox.w, vpBox.h);
    ctx.clip();

    // 视窗内部略提亮深海底色，让“窗内/窗外”界限如刀切般分明
    ctx.fillStyle = "#021330";
    ctx.fillRect(vpBox.x, vpBox.y, vpBox.w, vpBox.h);

    drawAllCards(true);

    // 若处于「重遮罩劫持」试错态：在视窗左右盖上吃字的厚重黑幕
    if (st.cues === "hijack") {
      const maskW = Math.round(vpBox.w * 0.22);
      const lg = ctx.createLinearGradient(vpBox.x, 0, vpBox.x + maskW, 0);
      lg.addColorStop(0, "rgba(0, 6, 20, 0.96)");
      lg.addColorStop(1, "rgba(0, 6, 20, 0)");
      ctx.fillStyle = lg;
      ctx.fillRect(vpBox.x, vpBox.y, maskW, vpBox.h);

      const rg = ctx.createLinearGradient(vpBox.x + vpBox.w, 0, vpBox.x + vpBox.w - maskW, 0);
      rg.addColorStop(0, "rgba(0, 6, 20, 0.96)");
      rg.addColorStop(1, "rgba(0, 6, 20, 0)");
      ctx.fillStyle = rg;
      ctx.fillRect(vpBox.x + vpBox.w - maskW, vpBox.y, maskW, vpBox.h);

      // 警示斜条
      ctx.fillStyle = "rgba(255, 110, 127, 0.92)";
      ctx.fillRect(vpBox.x + 12, vpBox.y + 10, vpBox.w - 24, 24);
      ctx.fillStyle = "#000E27";
      ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText("重遮罩吃字 22% · 警告：强行劫持纵滚会困住读者", vpBox.x + vpBox.w / 2, vpBox.y + 22);
      ctx.textAlign = "left";
    }

    // 3. 视窗内实测标尺与单真源错态红/青标牌
    const isMoving = dragging || Math.abs(velPx) > 10 || targetScrollX !== null;
    if (!isMoving) {
      // 3a. 仅当主卡完整且右缘露出 8%–42% 合理邻卡切面时，绘亮湖青实测露边标尺
      if (geom.focusIntegrity >= 84 && geom.peekCard && geom.peekPct >= 8 && geom.peekPct <= 42 && st.cardRatio <= 1.01) {
        const px0 = vpBox.x + geom.peekCard.x;
        const px1 = vpBox.x + vpBox.w;
        ctx.fillStyle = "rgba(61, 202, 220, 0.14)";
        ctx.fillRect(px0, vpBox.y + 4, px1 - px0, vpBox.h - 8);
        ctx.strokeStyle = PALETTE.cyan;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px0, vpBox.y + 8);
        ctx.lineTo(px0, vpBox.y + vpBox.h - 8);
        ctx.stroke();
        ctx.setLineDash([]);

        const lbl = `露边 ${geom.peekPct}%`;
        ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", monospace`;
        const lw = ctx.measureText(lbl).width + 14;
        const bx = Math.min(px1 - lw - 6, Math.max(px0 - 4, vpBox.x + vpBox.w - lw - 6));
        roundRectPath(ctx, bx, vpBox.y + 10, lw, 22, 4);
        ctx.fillStyle = "rgba(0, 14, 39, 0.9)";
        ctx.fill();
        ctx.strokeStyle = PALETTE.cyan;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = PALETTE.cyan;
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, bx + 7, vpBox.y + 21);
      }

      // 3b. 若零露边假底边：右刀口亮珊瑚红虚线
      if (!geom.atEnd && st.cardRatio <= 1.01 && geom.peekPct < 8) {
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(vpBox.x + vpBox.w - 2, vpBox.y + 6);
        ctx.lineTo(vpBox.x + vpBox.w - 2, vpBox.y + vpBox.h - 6);
        ctx.stroke();
        ctx.setLineDash([]);

        const lbl = "假底边 · 露边 0%";
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        const lw = ctx.measureText(lbl).width + 16;
        const bx = vpBox.x + vpBox.w - lw - 10;
        roundRectPath(ctx, bx, vpBox.y + 10, lw, 24, 4);
        ctx.fillStyle = "rgba(179, 38, 62, 0.94)";
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, bx + 8, vpBox.y + 22);
      }

      // 3c. 若半卡腰斩或超宽截断：主卡顶部居右或底沿醒目警示条（不挡卡片正文）
      if (geom.focusIntegrity < 84 || st.cardRatio > 1.01) {
        const msg =
          st.cardRatio > 1.01
            ? `× 超宽 ${Math.round(st.cardRatio * 100)}% · 溢出锁死`
            : `× 半卡腰斩 · 主卡被裁 ${100 - geom.focusIntegrity}%`;
        ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
        const mw = Math.min(vpBox.w - 20, ctx.measureText(msg).width + 20);
        const mx = vpBox.x + (vpBox.w - mw) / 2;
        const my = vpBox.y + 8;
        roundRectPath(ctx, mx, my, mw, 24, 5);
        ctx.fillStyle = "rgba(179, 38, 62, 0.94)";
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(msg, mx + mw / 2, my + 12);
        ctx.textAlign = "left";
      }
    }

    ctx.restore(); // 结束视窗裁剪

    // 4. 1:1 复刻原海报「双层亮湖青可视窗口 VIEWPORT 框」
    const hasErr =
      (!isMoving && (geom.focusIntegrity < 84 || (!geom.atEnd && geom.peekPct < 8) || st.cardRatio > 1.01 || st.cues === "hijack"));
    const frameColor = hasErr ? PALETTE.coralStrong : PALETTE.cyan;

    // 外层虚/细发光框
    roundRectPath(ctx, vpBox.x - 6, vpBox.y - 6, vpBox.w + 12, vpBox.h + 12, 18);
    ctx.strokeStyle = hasErr ? "rgba(243, 129, 160, 0.45)" : "rgba(61, 202, 220, 0.42)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // 内层主视窗框
    roundRectPath(ctx, vpBox.x, vpBox.y, vpBox.w, vpBox.h, 14);
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. 视窗下方 1:1 原海报「←─── 可视窗口 VIEWPORT ───→」双向延展箭头
    const lblY = vpBox.y + vpBox.h + 16;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.cyan;
    ctx.fillText("可视窗口", width / 2, lblY - 2);
    ctx.font = `600 10px "Manrope", sans-serif`;
    ctx.fillStyle = PALETTE.cyanMid;
    ctx.fillText("VIEWPORT", width / 2, lblY + 13);
    ctx.textAlign = "left";

    // 左右双向长箭（随当前左右可滑余量动态明暗）
    const arrowY = lblY + 6;
    const gapFromCenter = width < 520 ? 54 : 78;
    const arrowSpan = Math.max(36, Math.min(210, width / 2 - gapFromCenter - 20));
    const canLeft = geom.scrollX > 3;
    const canRight = geom.maxScroll - geom.scrollX > 3;

    // 左箭
    ctx.strokeStyle = canLeft ? PALETTE.cyan : "rgba(61, 202, 220, 0.28)";
    ctx.fillStyle = canLeft ? PALETTE.cyan : "rgba(61, 202, 220, 0.28)";
    ctx.lineWidth = 1.4;
    const lx1 = width / 2 - gapFromCenter;
    const lx0 = lx1 - arrowSpan;
    ctx.beginPath();
    ctx.moveTo(lx1, arrowY);
    ctx.lineTo(lx0 + 6, arrowY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx0, arrowY);
    ctx.lineTo(lx0 + 9, arrowY - 4.5);
    ctx.lineTo(lx0 + 9, arrowY + 4.5);
    ctx.closePath();
    ctx.fill();

    // 右箭
    ctx.strokeStyle = canRight ? PALETTE.cyan : "rgba(61, 202, 220, 0.28)";
    ctx.fillStyle = canRight ? PALETTE.cyan : "rgba(61, 202, 220, 0.28)";
    const rx0 = width / 2 + gapFromCenter;
    const rx1 = rx0 + arrowSpan;
    ctx.beginPath();
    ctx.moveTo(rx0, arrowY);
    ctx.lineTo(rx1 - 6, arrowY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx1, arrowY);
    ctx.lineTo(rx1 - 9, arrowY - 4.5);
    ctx.lineTo(rx1 - 9, arrowY + 4.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ---------- 指针/触控交互（真横向拖甩，不阻断页面竖滚） ----------
  const requestPaint = () => {
    dirty = true;
    runner.draw();
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    introDone = true;
    dragging = true;
    pointerId = e.pointerId;
    dragStartX = dragLastX = e.clientX;
    dragStartY = e.clientY;
    dragLastT = performance.now();
    dragAxis = e.pointerType === "mouse" ? "x" : "";
    dragMovedPx = 0;
    velPx = 0;
    targetScrollX = null;
    gesturePhase = "hold";
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    canvas.classList.add("is-dragging");
    emitTelemetry();
    requestPaint();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const dxTotal = e.clientX - dragStartX;
    const dyTotal = e.clientY - dragStartY;
    if (!dragAxis) {
      if (Math.abs(dxTotal) < 5 && Math.abs(dyTotal) < 5) return;
      dragAxis = Math.abs(dxTotal) >= Math.abs(dyTotal) ? "x" : "y";
      if (dragAxis === "y") {
        // 让位给页面竖滚
        dragging = false;
        gesturePhase = "idle";
        canvas.classList.remove("is-dragging");
        emitTelemetry();
        return;
      }
    }
    const now = performance.now();
    const dx = e.clientX - dragLastX;
    const dtMs = Math.max(4, now - dragLastT);
    dragLastX = e.clientX;
    dragLastT = now;
    dragMovedPx = dxTotal;

    const st = getState();
    const geom = computeGeometry(st, vpBox.w, vpBox.h);
    // 手指向左拖（dx < 0），卷轴向右推进（scrollX 增大）——1:1 呼应原海报「向左拖动 DRAG LEFT」
    const nextX = clamp(geom.scrollX - dx, 0, geom.maxScroll);
    st.scrollIndex = geom.step > 0 ? nextX / geom.step : 0;
    const instVel = (-dx / dtMs) * 1000;
    velPx = velPx * 0.45 + instVel * 0.55;
    gesturePhase = "drag";
    callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), true);
    emitTelemetry();
    dirty = true;
  });

  function finishDrag(e) {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false;
    canvas.classList.remove("is-dragging");
    const st = getState();
    const geom = computeGeometry(st, vpBox.w, vpBox.h);

    // 轻点（几乎没拖动）某张露边/窗外卡时，顺滑把那张卡滑进视窗
    if (Math.abs(dragMovedPx) < 7 && e) {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (py >= vpBox.y && py <= vpBox.y + vpBox.h) {
        const hit = geom.cards.find((c) => {
          const cx = vpBox.x + c.x;
          return px >= cx && px <= cx + c.w;
        });
        if (hit) {
          scrollToIndex(hit.index);
          return;
        }
      }
    }

    // 惯性或吸附落位
    if (st.snap !== "off") {
      gesturePhase = "release";
      phaseDecay = 0.7;
      engageSnap(st, geom, velPx);
      if (targetScrollX === null && Math.abs(velPx) < 20) {
        velPx = 0;
        gesturePhase = "idle";
      }
    } else if (Math.abs(velPx) > 40) {
      gesturePhase = "release";
      phaseDecay = 0.7;
      if (st.physics === "step") velPx *= 0.25;
    } else {
      velPx = 0;
      gesturePhase = "idle";
    }
    callbacks.onStateSync?.(geom, Math.abs(velPx) > 10 || targetScrollX !== null);
    emitTelemetry();
    requestPaint();
  }

  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);

  // 支持触控板原生横滑（不劫持纯垂直滚轮！只有横向分量显著时才滑卷轴）
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.15 && !e.shiftKey) return;
      e.preventDefault();
      introDone = true;
      const delta = Math.abs(e.deltaX) > 0.5 ? e.deltaX : e.deltaY;
      const st = getState();
      const geom = computeGeometry(st, vpBox.w, vpBox.h);
      const nextX = clamp(geom.scrollX + delta, 0, geom.maxScroll);
      st.scrollIndex = geom.step > 0 ? nextX / geom.step : 0;
      targetScrollX = null;
      velPx = 0;
      gesturePhase = "drag";
      phaseDecay = 0.45;
      callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), false);
      emitTelemetry();
      requestPaint();
    },
    { passive: false }
  );

  const runner = loop(canvas, draw);
  new ResizeObserver(() => {
    resize();
    const st = getState();
    callbacks.onStateSync?.(computeGeometry(st, vpBox.w, vpBox.h), false);
    requestPaint();
  }).observe(canvas);

  resize();

  return {
    draw: requestPaint,
    scrollToIndex: (idx, instant = false) => {
      dirty = true;
      scrollToIndex(idx, instant);
    },
    nudge: (dir) => {
      const st = getState();
      const geom = computeGeometry(st, vpBox.w, vpBox.h);
      const base = Math.round(geom.scrollIndex);
      scrollToIndex(clamp(base + dir, 0, geom.maxIndex));
    },
    getGeometry: () => computeGeometry(getState(), vpBox.w, vpBox.h),
    stopMotion: () => {
      velPx = 0;
      targetScrollX = null;
      introDone = true;
    },
  };
}
