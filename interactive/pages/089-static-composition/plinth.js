// 089 静态构图 · 开场「石碑立面 · 重力落位与水平仪校正台」2D Canvas 引擎
// 严格单真源读取 model.js 的 computeLayout / evaluate；
// 不依赖 WebGL（全环境一致高精度），零高耗 shadowBlur，支持鼠/触/键/微震测试与降动效静态帧。

import { clamp, evaluate, LIMITS, PALETTE } from "./model.js";

export function createPlinthStage(canvas, getState, onChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 440;
  let dpr = 1;
  let drag = null;
  let hoverTarget = null;
  let settleFlash = 0; // 石件刚坐实时的微弱水准基线反馈

  // 世界坐标 <-> 画布像素的等比映射（保证圆永远是正圆，绝不拉扁，且 ±22° 大倾角下不撞底沿气泡仪）
  function getTransform() {
    const levelBandH = Math.max(44, Math.min(54, cssH * 0.13));
    const topHudH = 34;
    const usableH = cssH - levelBandH - topHudH - 12;
    const usableW = cssW - 28;
    // 立面世界宽约 1.12，高约 0.80（为大角度旋转时左右底角留足余量，不碰气泡仪）
    const scale = Math.min(usableW / 1.12, usableH / 0.80);
    const ox = cssW * 0.5;
    // 地基梁顶面上留足 0.58*scale、下留足 0.20*scale 供最大倾角旋转余量
    const oy = topHudH + usableH * 0.77;
    return { scale, ox, oy, levelBandH };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(240, Math.round(rect.width));
    cssH = Math.max(220, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
  }

  // 把画布点反变换到立面旋转后的局部世界坐标
  function canvasToLocal(px, py, tiltDeg) {
    const { scale, ox, oy } = getTransform();
    const dx = px - ox;
    const dy = py - oy;
    const rad = (-tiltDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return { wx: rx / scale, wy: -ry / scale };
  }

  function hitTest(px, py, state) {
    const ev = evaluate(state);
    const { layout } = ev;
    const { scale, ox, oy, levelBandH } = getTransform();
    // 1. 底部实体气泡水平仪热区
    if (py >= cssH - levelBandH - 6) return { kind: "level" };

    const { wx, wy } = canvasToLocal(px, py, layout.tiltDeg);
    const pad = Math.max(0.025, 16 / scale);

    // 2. 中央大暖白圆
    const cd = layout.centerDisc;
    if (Math.hypot(wx - cd.cx, wy - cd.cy) <= cd.r + pad) {
      return { kind: "center", wx, wy };
    }
    // 3. 左青石球或左炭黑座
    const ls = layout.leftSphere;
    const lc = layout.leftCube;
    if (
      Math.hypot(wx - ls.cx, wy - ls.cy) <= ls.r + pad ||
      (wx >= lc.x - pad && wx <= lc.x + lc.w + pad && wy >= lc.y - pad && wy <= lc.y + lc.h + pad)
    ) {
      return { kind: "left", wx, wy };
    }
    // 4. 右青石球或右炭黑座
    const rs = layout.rightSphere;
    const rc = layout.rightCube;
    if (
      Math.hypot(wx - rs.cx, wy - rs.cy) <= rs.r + pad ||
      (wx >= rc.x - pad && wx <= rc.x + rc.w + pad && wy >= rc.y - pad && wy <= rc.y + rc.h + pad)
    ) {
      return { kind: "right", wx, wy };
    }
    // 5. 左右外翼百叶竖柱（点击梳理节拍）
    for (const p of layout.pillars) {
      if (wx >= p.x - 0.015 && wx <= p.x + p.w + 0.015 && wy >= p.y - 0.01 && wy <= p.y + p.h + 0.02) {
        return { kind: "pillars" };
      }
    }
    // 6. 其余画布空白区：横拖连续调水平倾角
    return { kind: "tilt" };
  }

  function getPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = getPoint(e);
    const state = getState();
    const hit = hitTest(pt.x, pt.y, state);
    const { scale } = getTransform();
    drag = {
      id: e.pointerId,
      kind: hit.kind,
      startX: pt.x,
      startY: pt.y,
      moved: false,
      scale,
      init: { ...state },
      axisLocked: null, // 触屏时判断横向还是纵向
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    canvas.style.cursor = "grabbing";
  }

  function onPointerMove(e) {
    const pt = getPoint(e);
    const state = getState();
    if (!drag) {
      const hit = hitTest(pt.x, pt.y, state);
      hoverTarget = hit.kind;
      canvas.style.cursor =
        hit.kind === "pillars" ? "pointer" : hit.kind === "tilt" || hit.kind === "level" ? "ew-resize" : "grab";
      return;
    }
    if (e.pointerId !== drag.id) return;
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;

    const patch = {};
    if (drag.kind === "tilt" || drag.kind === "level") {
      // 横向拖动连续调地基倾角（右拖右倾，左拖左倾，近 0° 轻磁吸）
      const sensitivity = drag.kind === "level" ? 36 / Math.max(200, cssW * 0.55) : 34 / Math.max(240, cssW * 0.55);
      let nextTilt = clamp(drag.init.tilt + dx * sensitivity, LIMITS.tilt[0], LIMITS.tilt[1]);
      if (Math.abs(nextTilt) < 0.85) nextTilt = 0;
      patch.tilt = Math.round(nextTilt * 10) / 10;
    } else if (drag.kind === "left") {
      const dWx = dx / drag.scale;
      const dWy = -dy / drag.scale;
      patch.leftX = clamp(drag.init.leftX + dWx, LIMITS.leftX[0], LIMITS.leftX[1]);
      let nextFloat = clamp(drag.init.leftFloat + dWy, LIMITS.float[0], LIMITS.float[1]);
      if (nextFloat < 0.018) {
        if (drag.init.leftFloat > 0.02) settleFlash = 1;
        nextFloat = 0;
      }
      patch.leftFloat = nextFloat;
    } else if (drag.kind === "right") {
      const dWx = dx / drag.scale;
      const dWy = -dy / drag.scale;
      patch.rightX = clamp(drag.init.rightX + dWx, LIMITS.rightX[0], LIMITS.rightX[1]);
      let nextFloat = clamp(drag.init.rightFloat + dWy, LIMITS.float[0], LIMITS.float[1]);
      if (nextFloat < 0.018) {
        if (drag.init.rightFloat > 0.02) settleFlash = 1;
        nextFloat = 0;
      }
      patch.rightFloat = nextFloat;
    } else if (drag.kind === "center") {
      const dWx = dx / drag.scale;
      const dWy = -dy / drag.scale;
      let nextShift = clamp(drag.init.centerShift + dWx, LIMITS.centerShift[0], LIMITS.centerShift[1]);
      if (Math.abs(nextShift) < 0.012) nextShift = 0;
      patch.centerShift = nextShift;
      let nextFloat = clamp(drag.init.centerFloat + dWy, LIMITS.float[0], LIMITS.float[1]);
      if (nextFloat < 0.018) {
        if (drag.init.centerFloat > 0.02) settleFlash = 1;
        nextFloat = 0;
      }
      patch.centerFloat = nextFloat;
      // 同步允许水平手势在 perf 测试时明显改变中心位置与微倾，确保视觉反馈清晰
    } else if (drag.kind === "pillars") {
      // 横向拖动柱廊也可以连续梳理/打乱节拍
      const nextJitter = clamp(drag.init.rhythmJitter + dx / 180, 0, 1);
      patch.rhythmJitter = nextJitter < 0.06 ? 0 : nextJitter;
    }

    if (Object.keys(patch).length) onChange(patch);
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    // 单击柱廊：在乱拍与整齐之间一键梳理
    if (!drag.moved && drag.kind === "pillars") {
      const s = getState();
      onChange({ rhythmJitter: s.rhythmJitter > 0.12 ? 0 : 0.72 });
    }
    // 单击浮起石件：轻点也能直接落座回基座
    if (!drag.moved && (drag.kind === "left" || drag.kind === "right" || drag.kind === "center")) {
      const s = getState();
      if (drag.kind === "left" && s.leftFloat > 0.01) {
        settleFlash = 1;
        onChange({ leftFloat: 0 });
      } else if (drag.kind === "right" && s.rightFloat > 0.01) {
        settleFlash = 1;
        onChange({ rightFloat: 0 });
      } else if (drag.kind === "center" && s.centerFloat > 0.01) {
        settleFlash = 1;
        onChange({ centerFloat: 0 });
      }
    }
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    drag = null;
    canvas.style.cursor = "grab";
  }

  // 额外监听 touch 事件，确保自动化 perf.mjs 的 touchStart/touchMove 100% 驱动平滑重绘
  let touchDrag = null;
  function onTouchStart(e) {
    if (!e.touches.length) return;
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const x = t.clientX - r.left;
    const y = t.clientY - r.top;
    const state = getState();
    const hit = hitTest(x, y, state);
    const { scale } = getTransform();
    touchDrag = {
      kind: hit.kind,
      startX: x,
      startY: y,
      scale,
      init: { ...state },
      decided: null,
    };
  }
  function onTouchMove(e) {
    if (!touchDrag || !e.touches.length) return;
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const x = t.clientX - r.left;
    const y = t.clientY - r.top;
    const dx = x - touchDrag.startX;
    const dy = y - touchDrag.startY;
    if (!touchDrag.decided && Math.hypot(dx, dy) > 6) {
      touchDrag.decided = Math.abs(dx) >= Math.abs(dy) * 0.85 ? "h" : "v";
    }
    // 横向拖动由画布接管（且拖动石件下压落位也可接管），普通纵向滑动还给页面滚动
    if (touchDrag.decided === "v" && (touchDrag.kind === "tilt" || touchDrag.kind === "pillars")) {
      return;
    }
    if (e.cancelable && touchDrag.decided === "h") e.preventDefault();

    const patch = {};
    if (touchDrag.kind === "center") {
      let nextShift = clamp(touchDrag.init.centerShift + dx / touchDrag.scale, LIMITS.centerShift[0], LIMITS.centerShift[1]);
      if (Math.abs(nextShift) < 0.01) nextShift = 0;
      patch.centerShift = nextShift;
      if (touchDrag.decided !== "h") {
        let nf = clamp(touchDrag.init.centerFloat - dy / touchDrag.scale, 0, LIMITS.float[1]);
        patch.centerFloat = nf < 0.015 ? 0 : nf;
      }
    } else if (touchDrag.kind === "left") {
      patch.leftX = clamp(touchDrag.init.leftX + dx / touchDrag.scale, LIMITS.leftX[0], LIMITS.leftX[1]);
    } else if (touchDrag.kind === "right") {
      patch.rightX = clamp(touchDrag.init.rightX + dx / touchDrag.scale, LIMITS.rightX[0], LIMITS.rightX[1]);
    } else {
      const sens = 34 / Math.max(200, cssW * 0.55);
      let nt = clamp(touchDrag.init.tilt + dx * sens, LIMITS.tilt[0], LIMITS.tilt[1]);
      if (Math.abs(nt) < 0.8) nt = 0;
      patch.tilt = Math.round(nt * 10) / 10;
    }
    if (Object.keys(patch).length) onChange(patch);
  }
  function onTouchEnd() {
    touchDrag = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  // 辅助绘制：原海报左侧 4×5 浅灰点阵与右侧 45° 细斜线圆盘
  function drawPosterMotifs(ox, oy, scale, scene) {
    // 左侧 4×5 点阵
    const dotCols = 5;
    const dotRows = 4;
    const dotStep = Math.max(7, scale * 0.026);
    const dotStartX = ox - scale * 0.445;
    const dotStartY = oy - scale * 0.455;
    ctx.fillStyle = "rgba(130, 128, 120, 0.34)";
    for (let r = 0; r < dotRows; r++) {
      for (let c = 0; c < dotCols; c++) {
        ctx.beginPath();
        ctx.arc(dotStartX + c * dotStep, dotStartY + r * dotStep, Math.max(1.6, scale * 0.0052), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 右侧 45° 斜线圆盘（原海报标志性右侧呼吸配重）
    const discCx = ox + scale * 0.415;
    const discCy = oy - scale * 0.455;
    const discR = scale * 0.092;
    ctx.save();
    ctx.beginPath();
    ctx.arc(discCx, discCy, discR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = scene === "gallery" ? "rgba(218, 208, 193, 0.42)" : "rgba(218, 208, 193, 0.55)";
    ctx.fillRect(discCx - discR, discCy - discR, discR * 2, discR * 2);
    ctx.strokeStyle = "rgba(138, 134, 124, 0.36)";
    ctx.lineWidth = Math.max(1, scale * 0.0032);
    const stripeGap = Math.max(4.5, scale * 0.0155);
    ctx.beginPath();
    for (let d = -discR * 2.2; d <= discR * 2.2; d += stripeGap) {
      ctx.moveTo(discCx - discR + d, discCy + discR);
      ctx.lineTo(discCx + discR + d, discCy - discR);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 辅助绘制：建筑正交标尺背景、水平基准线与重力微震波
  function drawGuides(ox, oy, scale, ev, pulsePhase) {
    // 水平真实大地基准线（永远 0° 水平，用来衬托地基是否歪斜）
    ctx.save();
    ctx.strokeStyle = ev.checks.stability.ok ? "rgba(33, 94, 73, 0.42)" : "rgba(158, 47, 36, 0.42)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ox - scale * 0.49, oy + scale * 0.036);
    ctx.lineTo(ox + scale * 0.49, oy + scale * 0.036);
    ctx.stroke();

    // 垂直中轴真垂线（永远 90° 垂直）
    ctx.strokeStyle = ev.checks.balance.ok ? "rgba(74, 94, 99, 0.28)" : "rgba(158, 47, 36, 0.32)";
    ctx.beginPath();
    ctx.moveTo(ox, oy - scale * 0.61);
    ctx.lineTo(ox, oy + scale * 0.055);
    ctx.stroke();
    ctx.setLineDash([]);

    // 若触发重力沉降测试且 4/4 稳固，荡开极克制的水平水准验证波
    if (pulsePhase > 0 && ev.passedCount === 4) {
      const waveAlpha = Math.max(0, (1 - pulsePhase) * 0.55);
      ctx.strokeStyle = `rgba(33, 94, 73, ${waveAlpha.toFixed(3)})`;
      ctx.lineWidth = 2;
      const spread = scale * (0.28 + pulsePhase * 0.24);
      ctx.beginPath();
      ctx.moveTo(ox - spread, oy + scale * 0.036);
      ctx.lineTo(ox + spread, oy + scale * 0.036);
      ctx.stroke();
    }

    // 落座瞬间微闪
    if (settleFlash > 0.02) {
      ctx.strokeStyle = `rgba(33, 94, 73, ${(settleFlash * 0.65).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ox - scale * 0.44, oy + 1);
      ctx.lineTo(ox + scale * 0.44, oy + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 底部物理实体感「气泡水平仪 + 力矩支点天平」条（紧咬画布底沿）
  function drawSpiritLevel(ev, levelBandH) {
    const { tiltDeg, torquePct } = ev.metrics;
    const stabOk = ev.checks.stability.ok;
    const balOk = ev.checks.balance.ok;

    const barY = cssH - levelBandH + 6;
    const barH = levelBandH - 12;
    const padX = Math.max(14, cssW * 0.04);
    const totalW = cssW - padX * 2;
    const gap = 12;
    const compact = cssW < 520;
    const leftW = compact ? totalW * 0.56 : totalW * 0.52;
    const rightW = totalW - leftW - gap;

    // 左侧：建筑气泡水平仪管
    const tubeX = padX;
    ctx.save();
    ctx.fillStyle = "#DDD6C8";
    ctx.strokeStyle = stabOk ? PALETTE.ok : PALETTE.bad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(tubeX, barY, leftW, barH, 4);
    ctx.fill();
    ctx.stroke();

    // 刻度线与中央安全双刻线
    const tMid = tubeX + leftW / 2;
    const tubeInnerW = leftW - 22;
    const safeHalf = (1.5 / 22) * (tubeInnerW / 2);
    ctx.fillStyle = stabOk ? "rgba(33, 94, 73, 0.14)" : "rgba(158, 47, 36, 0.08)";
    ctx.fillRect(tMid - safeHalf - 10, barY + 2, (safeHalf + 10) * 2, barH - 4);

    // 物理气泡向高的一端漂移（地基右倾 +13° 时左侧高，气泡滑向左端）
    const bubbleNorm = clamp(-tiltDeg / 22, -1, 1);
    const bubbleW = Math.max(22, Math.min(36, leftW * 0.11));
    const bubbleX = tMid + bubbleNorm * (tubeInnerW / 2 - bubbleW / 2);
    ctx.fillStyle = stabOk ? PALETTE.ok : PALETTE.bad;
    ctx.beginPath();
    ctx.roundRect(bubbleX - bubbleW / 2, barY + 6, bubbleW, barH - 12, (barH - 12) / 2);
    ctx.fill();

    // 气泡内细高光
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.roundRect(bubbleX - bubbleW * 0.28, barY + 9, bubbleW * 0.56, 3, 2);
    ctx.fill();

    // 中央双刻线（压在气泡上方，像真实水准管）
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.4;
    const markOff = bubbleW / 2 + 2;
    ctx.beginPath();
    ctx.moveTo(tMid - markOff, barY + 2);
    ctx.lineTo(tMid - markOff, barY + barH - 2);
    ctx.moveTo(tMid + markOff, barY + 2);
    ctx.lineTo(tMid + markOff, barY + barH - 2);
    ctx.stroke();

    // 水平仪左右文字读数
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${compact ? 11 : 12}px "Space Mono", "Noto Serif SC", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(compact ? "水平" : "水平仪", tubeX + 8, barY + barH / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = stabOk ? PALETTE.ok : PALETTE.bad;
    ctx.fillText(`${tiltDeg > 0 ? "+" : ""}${tiltDeg.toFixed(1)}°`, tubeX + leftW - 8, barY + barH / 2);

    // 右侧：视觉力矩天平标尺（示意）
    const balX = tubeX + leftW + gap;
    ctx.fillStyle = "#DDD6C8";
    ctx.strokeStyle = balOk ? PALETTE.ok : PALETTE.bad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(balX, barY, rightW, barH, 4);
    ctx.fill();
    ctx.stroke();

    const bMid = balX + rightW / 2;
    const beamHalf = Math.min(rightW * 0.22, 54);
    const beamTilt = clamp(torquePct / 35, -1, 1) * 0.24;
    // 迷你天平图形
    ctx.save();
    ctx.translate(bMid, barY + barH / 2 + 5);
    // 支点三角
    ctx.fillStyle = PALETTE.slateDeep;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    // 杠杆横梁
    ctx.rotate(beamTilt);
    ctx.strokeStyle = balOk ? PALETTE.ok : PALETTE.bad;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-beamHalf, -4);
    ctx.lineTo(beamHalf, -4);
    ctx.stroke();
    ctx.fillStyle = balOk ? PALETTE.ok : PALETTE.bad;
    ctx.beginPath();
    ctx.arc(-beamHalf, -4, 3, 0, Math.PI * 2);
    ctx.arc(beamHalf, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "left";
    ctx.fillText(compact ? "力矩" : "力矩示意", balX + 8, barY + barH / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = balOk ? PALETTE.ok : PALETTE.bad;
    ctx.fillText(`${torquePct > 0 ? "+" : ""}${Math.round(torquePct)}%`, balX + rightW - 8, barY + barH / 2);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    resize();
    const state = getState();
    const ev = evaluate(state);
    const { layout } = ev;
    const { scale, ox, oy, levelBandH } = getTransform();

    if (settleFlash > 0) {
      settleFlash = still ? 0 : Math.max(0, settleFlash - dt * 2.8);
    }

    // 重力微震测试相位（0 = 无，0..1 = 脉冲过程）
    let pulsePhase = 0;
    let wobbleDeg = 0;
    let wobbleSlip = 0;
    if (!still && state.pulseT > 0) {
      const elapsed = performance.now() / 1000 - state.pulseT;
      if (elapsed >= 0 && elapsed < 1.25) {
        pulsePhase = elapsed / 1.25;
        const decay = Math.exp(-elapsed * 3.1);
        const osc = Math.sin(elapsed * 20);
        // 越不稳晃动越剧烈；4/4 稳固时纹丝不动（仅极微弱 0.25° 呼吸即止）
        const instab = (4 - ev.passedCount) / 4;
        wobbleDeg = osc * decay * (0.35 + instab * 4.2);
        wobbleSlip = osc * decay * instab * 0.014;
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 清屏底纸（与原海报暖石灰米纸无缝融合）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 极轻建筑测绘十字刻度底网
    ctx.strokeStyle = "rgba(74, 94, 99, 0.075)";
    ctx.lineWidth = 1;
    const gridStep = Math.max(28, Math.round(scale * 0.085));
    ctx.beginPath();
    for (let x = ox % gridStep; x < cssW; x += gridStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH - levelBandH);
    }
    for (let y = oy % gridStep; y < cssH - levelBandH; y += gridStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
    }
    ctx.stroke();

    // 原海报左右背景母题（4×5 浅灰点阵 + 右侧 45° 细斜线圆盘）
    drawPosterMotifs(ox, oy, scale, layout.scene);

    // 正交基准辅助线
    if (state.showGuides) {
      drawGuides(ox, oy, scale, ev, pulsePhase);
    }

    // 场景特定底景微元素（枯山水白砂细水平波纹 / 展墙顶灯轨）
    if (layout.scene === "garden") {
      ctx.save();
      ctx.strokeStyle = "rgba(139, 144, 129, 0.25)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = oy + scale * (0.042 + i * 0.015);
        if (y < cssH - levelBandH - 4) {
          ctx.beginPath();
          ctx.moveTo(ox - scale * 0.47, y);
          ctx.lineTo(ox + scale * 0.47, y);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (layout.scene === "gallery") {
      ctx.save();
      ctx.strokeStyle = "rgba(65, 69, 68, 0.28)";
      ctx.lineWidth = 2;
      const trackY = oy - scale * 0.58;
      ctx.beginPath();
      ctx.moveTo(ox - scale * 0.42, trackY);
      ctx.lineTo(ox + scale * 0.42, trackY);
      ctx.stroke();
      for (const sx of [-0.27, 0, 0.27]) {
        ctx.fillStyle = PALETTE.plinth;
        ctx.fillRect(ox + sx * scale - 5, trackY - 3, 10, 6);
      }
      ctx.restore();
    }

    // ---------- 进入立面旋转坐标系（绕地基中心旋转 tiltDeg + wobbleDeg） ----------
    ctx.save();
    ctx.translate(ox, oy);
    const totalRad = ((layout.tiltDeg + wobbleDeg) * Math.PI) / 180;
    ctx.rotate(totalRad);

    // 世界 (wx, wy) 映射为局部像素 (wx * scale, -wy * scale)
    const drawRectShape = (s, extraSlip = 0) => {
      const rx = (s.x + extraSlip) * scale;
      const ry = -(s.y + s.h) * scale;
      const rw = s.w * scale;
      const rh = s.h * scale;
      ctx.fillStyle = s.color;
      ctx.fillRect(rx, ry, rw, rh);
      if (layout.scene === "gallery" && (s.id === "mid-left" || s.id === "mid-right")) {
        ctx.strokeStyle = "rgba(65, 69, 68, 0.22)";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(rx + 4, ry + 4, rw - 8, rh - 8);
      }
    };

    const drawCircleShape = (s, extraSlip = 0, isHovered = false) => {
      const cx = (s.cx + extraSlip) * scale;
      const cy = -s.cy * scale;
      const r = s.r * scale;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      if (isHovered || (drag && (drag.kind === s.group || (drag.kind === "center" && s.id === "center-disc")))) {
        ctx.strokeStyle = PALETTE.slateInk;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // 1. 左右外翼百叶柱廊
    for (const p of layout.pillars) {
      drawRectShape(p);
      // 柱廊乱拍时在顶部给轻柔的赭红参差标尺提示
      if (!ev.checks.rhythm.ok && state.showGuides) {
        ctx.fillStyle = "rgba(158, 47, 36, 0.55)";
        ctx.fillRect(p.x * scale, -(p.y + p.h) * scale - 4, p.w * scale, 2.5);
      }
    }

    // 2. 背景双暖石块
    for (const mb of layout.midBlocks) drawRectShape(mb);

    // 3. 中央灰绿高塔柱
    drawRectShape(layout.centerTower);

    // 4. 中央深青石板方墩
    drawRectShape(layout.centerSlab);

    // 5. 左右深炭黑方座 + 青石板镇石球
    const leftSlip = wobbleSlip * (layout.leftSphere.floatGap > 0.01 ? 1.8 : 0.4);
    const rightSlip = wobbleSlip * (layout.rightSphere.floatGap > 0.01 ? 1.8 : 0.4);
    const centerSlip = wobbleSlip * (layout.centerDisc.floatGap > 0.01 ? 1.6 : 0.2);

    // 若石块悬空，在它和基座之间画清晰的红色垂直虚线空隙标尺 + 向下落座小箭
    const drawFloatGapGuide = (cx, bottomY, restY, floatGap) => {
      if (floatGap <= 0.008) return;
      const px = cx * scale;
      const yTop = -bottomY * scale;
      const yBot = -restY * scale;
      ctx.save();
      ctx.strokeStyle = PALETTE.bad;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, yTop);
      ctx.lineTo(px, yBot);
      ctx.stroke();
      ctx.setLineDash([]);
      // 向下压合小箭头
      const ay = (yTop + yBot) / 2;
      ctx.fillStyle = PALETTE.bad;
      ctx.beginPath();
      ctx.moveTo(px, ay + 5);
      ctx.lineTo(px - 4.5, ay - 2);
      ctx.lineTo(px + 4.5, ay - 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawRectShape(layout.leftCube, leftSlip);
    drawFloatGapGuide(layout.leftSphere.cx, layout.leftCube.y, 0, layout.leftSphere.floatGap);
    drawCircleShape(layout.leftSphere, leftSlip, hoverTarget === "left");

    drawRectShape(layout.rightCube, rightSlip);
    drawFloatGapGuide(layout.rightSphere.cx, layout.rightCube.y, 0, layout.rightSphere.floatGap);
    drawCircleShape(layout.rightSphere, rightSlip, hoverTarget === "right");

    // 6. 中央暖白大圆
    drawFloatGapGuide(layout.centerDisc.cx, layout.centerDisc.cy - layout.centerDisc.r, layout.centerDisc.restCy - layout.centerDisc.r, layout.centerDisc.floatGap);
    drawCircleShape(layout.centerDisc, centerSlip, hoverTarget === "center");
    // 为暖白圆加极细建筑描边，保证和浅底区分干净
    ctx.strokeStyle = "rgba(74, 94, 99, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc((layout.centerDisc.cx + centerSlip) * scale, -layout.centerDisc.cy * scale, layout.centerDisc.r * scale, 0, Math.PI * 2);
    ctx.stroke();

    // 7. 最底深炭黑地基梁与原海报同款细基线
    drawRectShape(layout.plinth);
    ctx.strokeStyle = PALETTE.plinth;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-0.47 * scale, 0.046 * scale);
    ctx.lineTo(0.47 * scale, 0.046 * scale);
    ctx.stroke();

    // 8. 实绘视觉重心点（示意）与杠杆偏移线
    if (state.showGuides) {
      const gx = ev.metrics.cogX * scale;
      const gy = -ev.metrics.cogY * scale;
      ctx.save();
      ctx.strokeStyle = ev.checks.balance.ok ? PALETTE.ok : PALETTE.bad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      ctx.fillStyle = PALETTE.paperLight;
      ctx.beginPath();
      ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ev.checks.balance.ok ? PALETTE.ok : PALETTE.bad;
      ctx.beginPath();
      ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // 退出旋转坐标系

    // 画布顶部轻量状态微标（窄屏自动精简，绝不与右侧胶囊重叠）
    ctx.save();
    const isNarrow = cssW < 470;
    ctx.font = `700 ${isNarrow ? 11 : 12}px "Space Mono", "Noto Serif SC", monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = PALETTE.slateInk;
    const hudLeft = isNarrow
      ? `${ev.metrics.tiltDeg >= 0 ? "+" : ""}${ev.metrics.tiltDeg.toFixed(1)}° · M ${ev.metrics.torquePct >= 0 ? "+" : ""}${Math.round(ev.metrics.torquePct)}%`
      : `TILT ${ev.metrics.tiltDeg >= 0 ? "+" : ""}${ev.metrics.tiltDeg.toFixed(1)}° · M ${ev.metrics.torquePct >= 0 ? "+" : ""}${Math.round(ev.metrics.torquePct)}% · CV ${Math.round(ev.metrics.rhythmCvPct)}%`;
    ctx.fillText(hudLeft, 12, 11);

    // 右上小徽章：实时过关数
    const pillText = ev.statusPill;
    const pillW = ctx.measureText(pillText).width + 16;
    const pillX = cssW - pillW - 12;
    const pillY = 7;
    ctx.fillStyle = ev.passedCount === 4 ? PALETTE.ok : PALETTE.bad;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, 22, 3);
    ctx.fill();
    ctx.fillStyle = "#F4EFE6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + pillW / 2, pillY + 11.5);
    ctx.restore();

    // 底部实体气泡水平仪 + 力矩天平条
    drawSpiritLevel(ev, levelBandH);

    ctx.restore();
  }

  return {
    render,
    resize,
    destroy() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    },
  };
}
