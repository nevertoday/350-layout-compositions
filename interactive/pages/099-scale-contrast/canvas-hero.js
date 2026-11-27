// 099 尺度对比开场 2D Canvas 巨微拉距仪与人类尺标舞台
// 1:1 承袭 099 原海报：暖炭黑夜幕、预烘焙斑驳矿物金巨球、弧形暗丘、脚下金色反照光池、纯剪影无五官微光行者
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp, computeGeometry, evaluate, hillYRatio, SCENES } from "./model.js";

// 预烘焙一次 256x256 细腻矿物金画布纹理，复刻原海报丝网纸面金粉感，零每帧像素遍历
function createMineralGoldTexture() {
  const size = 256;
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const ctx = off.getContext("2d");

  const grad = ctx.createRadialGradient(size * 0.42, size * 0.36, size * 0.06, size * 0.5, size * 0.5, size * 0.64);
  grad.addColorStop(0, "#F8C71E");
  grad.addColorStop(0.55, "#F5BF12");
  grad.addColorStop(0.88, "#E8B10E");
  grad.addColorStop(1, "#D6A20B");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 确定性伪随机柔云斑驳 + 极细矿物金粉，拒绝粗斑点
  let seed = 99099;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 48; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 16 + rand() * 28;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const bright = rand() > 0.48;
    g.addColorStop(0, bright ? "rgba(255, 236, 158, 0.075)" : "rgba(155, 108, 6, 0.065)");
    g.addColorStop(1, "rgba(245, 191, 18, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 1600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.5 + rand() * 1.3;
    ctx.fillStyle = rand() > 0.5 ? "rgba(255, 245, 200, 0.05)" : "rgba(120, 82, 4, 0.045)";
    ctx.fillRect(x, y, r, r);
  }
  return off;
}

// 绘制纯剪影、零五官的发光小人（站立背影/正影剪影，忠实还原 099 原海报）
function drawSilhouetteFigure(ctx, cx, footY, h, color, glowAlpha = 0.55) {
  if (h < 2) return;
  ctx.save();
  if (glowAlpha > 0) {
    const aura = ctx.createRadialGradient(cx, footY - h * 0.45, h * 0.05, cx, footY - h * 0.45, h * 1.15);
    aura.addColorStop(0, `rgba(248, 205, 58, ${glowAlpha * 0.42})`);
    aura.addColorStop(1, "rgba(248, 205, 58, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, footY - h * 0.45, h * 1.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = color;
  const headR = h * 0.095;
  const headY = footY - h + headR;

  // 头部纯剪影（绝不画眼耳口鼻）
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // 肩与躯干（简洁修长剪影，还原原海报人物比例）
  const shoulderY = headY + headR * 1.32;
  const waistY = footY - h * 0.44;
  const hipW = h * 0.115;
  const shoulderW = h * 0.165;
  const armW = Math.max(1.2, h * 0.052);
  const legW = Math.max(1.3, h * 0.056);

  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY + h * 0.03);
  ctx.quadraticCurveTo(cx, shoulderY - h * 0.025, cx + shoulderW, shoulderY + h * 0.03);
  ctx.lineTo(cx + shoulderW + armW * 0.35, waistY + h * 0.05);
  ctx.lineTo(cx + hipW, waistY + h * 0.05);
  ctx.lineTo(cx + hipW * 0.85, footY);
  ctx.lineTo(cx + hipW * 0.18, footY);
  ctx.lineTo(cx + hipW * 0.08, waistY + h * 0.06);
  ctx.lineTo(cx - hipW * 0.08, waistY + h * 0.06);
  ctx.lineTo(cx - hipW * 0.18, footY);
  ctx.lineTo(cx - hipW * 0.85, footY);
  ctx.lineTo(cx - hipW, waistY + h * 0.05);
  ctx.lineTo(cx - shoulderW - armW * 0.35, waistY + h * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function mountHeroCanvas(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  const goldTex = createMineralGoldTexture();

  let W = 760;
  let H = 560;
  let dpr = pixelRatio(2);
  let intro = 0; // 开场 0..1
  let verifyTimer = 0; // Space 压迫感验真 0..1.9s
  let hoverTarget = null; // 'macro-rim' | 'micro' | 'mid-0' | 'mid-1' | null
  let dragMode = null; // 'rift' | 'macro' | 'micro' | null
  let dragStart = null;
  let needsDraw = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(2);
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    const bw = Math.round(W * dpr);
    const bh = Math.round(H * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    needsDraw = true;
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function pointerXY(ev) {
    const r = canvas.getBoundingClientRect();
    const pt = ev.touches ? ev.touches[0] || ev.changedTouches[0] : ev;
    return { x: pt.clientX - r.left, y: pt.clientY - r.top };
  }

  function hitTest(x, y, state) {
    const geo = computeGeometry(state, W, H);
    // 1. 先查中号干扰块（直接点击移除）
    for (const m of geo.mids) {
      if (!m.active) continue;
      if (Math.hypot(x - m.x, y - m.y) <= m.r + 14) return `mid-${m.index}`;
    }
    // 2. 查参照人影/微注
    if (state.refVisible) {
      const pad = Math.max(18, geo.micro.h * 0.25);
      if (
        x >= geo.micro.cx - geo.micro.w * 0.6 - pad &&
        x <= geo.micro.cx + geo.micro.w * 0.6 + pad &&
        y >= geo.micro.y - pad &&
        y <= geo.micro.footY + pad
      ) {
        return "micro";
      }
    }
    // 3. 查巨球外环（拖外缘精准调主物直径）
    const dMacro = Math.hypot(x - geo.macro.cx, y - geo.macro.cy);
    if (Math.abs(dMacro - geo.macro.r) <= 18) return "macro-rim";
    return null;
  }

  function beginDrag(x, y, isTouch) {
    const state = getState();
    const hit = hitTest(x, y, state);
    dragStart = {
      x,
      y,
      isTouch,
      locked: !isTouch,
      moved: false,
      macroScale: state.macroScale,
      microScale: state.microScale,
      gapOffset: state.gapOffset,
      hit,
    };
    dragMode = hit === "micro" ? "micro" : hit === "macro-rim" ? "macro" : "rift";
    return true;
  }

  function moveDrag(x, y, ev) {
    if (!dragStart) return;
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;
    const dist = Math.hypot(dx, dy);

    // 触屏手势分流：纵向意图明显且不是拖小人时，交还给浏览器滚动页面
    if (dragStart.isTouch && !dragStart.locked) {
      if (dist < 6) return;
      if (dragMode !== "micro" && Math.abs(dy) > Math.abs(dx) * 1.25) {
        dragStart = null;
        dragMode = null;
        return;
      }
      dragStart.locked = true;
    }
    if (dist >= 7) dragStart.moved = true;
    if (!dragStart.moved && dragStart.hit && dragStart.hit.startsWith("mid-")) return;
    if (ev && ev.cancelable) ev.preventDefault();

    if (dragMode === "micro") {
      // 向上拖增大参照高度、向下拖压小参照高度，同时横拖微调净隙
      const nextMicro = clamp(dragStart.microScale - (dy / H) * 0.72, 0.015, 0.42);
      const nextGap = clamp(dragStart.gapOffset + (dx / W) * 0.85, -0.06, 0.24);
      onMutate({ microScale: +nextMicro.toFixed(3), gapOffset: +nextGap.toFixed(3) }, "drag-micro");
    } else if (dragMode === "macro") {
      const state = getState();
      const geo = computeGeometry(state, W, H);
      const d = Math.hypot(x - geo.macro.cx, y - geo.macro.cy);
      const nextMacro = clamp((d * 2) / H, 0.2, 0.96);
      onMutate({ macroScale: +nextMacro.toFixed(3) }, "drag-macro");
    } else {
      // 主舞台横拖：联动巨微拉距——右拖放大主物同时收敛过大参照，左拖退回温和态
      const ratio = dx / Math.max(220, W * 0.62);
      const nextMacro = clamp(dragStart.macroScale + ratio * 0.62, 0.2, 0.96);
      const nextMicro = clamp(dragStart.microScale - ratio * 0.24, 0.018, 0.42);
      const nextGap = clamp(dragStart.gapOffset + ratio * 0.11, -0.04, 0.22);
      onMutate(
        {
          macroScale: +nextMacro.toFixed(3),
          microScale: +nextMicro.toFixed(3),
          gapOffset: +nextGap.toFixed(3),
        },
        "drag-rift"
      );
    }
    needsDraw = true;
  }

  function endDrag() {
    if (dragStart && !dragStart.moved && dragStart.hit && dragStart.hit.startsWith("mid-")) {
      const state = getState();
      const idx = dragStart.hit === "mid-0" ? 0 : 1;
      const next = [...state.midClutter];
      next[idx] = false;
      onMutate({ midClutter: next }, "click-mid");
      needsDraw = true;
    }
    dragStart = null;
    dragMode = null;
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (ev) => {
    if (ev.button !== 0) return;
    const { x, y } = pointerXY(ev);
    beginDrag(x, y, false);
    const onMove = (e) => {
      const p = pointerXY(e);
      moveDrag(p.x, p.y, e);
    };
    const onUp = () => {
      endDrag();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  canvas.addEventListener("mousemove", (ev) => {
    if (dragStart) return;
    const { x, y } = pointerXY(ev);
    const nextHover = hitTest(x, y, getState());
    if (nextHover !== hoverTarget) {
      hoverTarget = nextHover;
      canvas.style.cursor =
        nextHover && nextHover.startsWith("mid-")
          ? "pointer"
          : nextHover === "micro"
            ? "ns-resize"
            : nextHover === "macro-rim"
              ? "ew-resize"
              : "grab";
      needsDraw = true;
      ctrl.draw();
    }
  });

  canvas.addEventListener("mouseleave", () => {
    if (hoverTarget) {
      hoverTarget = null;
      canvas.style.cursor = "grab";
      needsDraw = true;
      ctrl.draw();
    }
  });

  // 触屏事件（确保 tools/perf.mjs 的 dispatchTouchEvent 与手机真机横拖顺滑响应）
  canvas.addEventListener(
    "touchstart",
    (ev) => {
      if (!ev.touches.length) return;
      const { x, y } = pointerXY(ev);
      beginDrag(x, y, true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (ev) => {
      if (!dragStart || !ev.touches.length) return;
      const { x, y } = pointerXY(ev);
      moveDrag(x, y, ev);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", endDrag, { passive: true });
  canvas.addEventListener("touchcancel", endDrag, { passive: true });

  function drawScene(t, dt, { still }) {
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.65);
      needsDraw = true;
    }

    if (verifyTimer > 0) {
      verifyTimer = still ? 0 : Math.max(0, verifyTimer - Math.max(dt, 0.016));
      needsDraw = true;
    }

    // 静置且无动画时直接跳过重绘省电，但只要有交互/开场/验真立刻完整绘制
    if (!needsDraw && !still && intro >= 1 && verifyTimer <= 0) return;
    needsDraw = false;

    const state = getState();
    const audit = evaluate(state, W, H);
    const { geo } = audit;
    const ease = 1 - Math.pow(1 - intro, 3);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 原海报暖炭黑夜幕底场 (#090908)
    ctx.fillStyle = "#090908";
    ctx.fillRect(0, 0, W, H);

    // 极克制的深暖氛围光晕（仅衬托巨球）
    const amb = ctx.createRadialGradient(
      geo.macro.cx,
      geo.macro.cy,
      geo.macro.r * 0.2,
      geo.macro.cx,
      geo.macro.cy,
      Math.max(W, H) * 0.72
    );
    amb.addColorStop(0, "rgba(245, 191, 18, 0.075)");
    amb.addColorStop(0.55, "rgba(130, 100, 25, 0.025)");
    amb.addColorStop(1, "rgba(9, 9, 8, 0)");
    ctx.fillStyle = amb;
    ctx.fillRect(0, 0, W, H);

    // 极轻度背景刻度标尺线（提醒这是尺度实验台，极暗不抢戏）
    ctx.strokeStyle = "rgba(242, 224, 189, 0.045)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = (H / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 2. 主巨物（随场景变化，均用预烘焙矿物金纹理）
    const drawMacroR = geo.macro.r * (0.86 + 0.14 * ease);
    ctx.save();
    if (state.scene === "poster") {
      ctx.beginPath();
      ctx.arc(geo.macro.cx, geo.macro.cy, drawMacroR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        goldTex,
        geo.macro.cx - drawMacroR,
        geo.macro.cy - drawMacroR,
        drawMacroR * 2,
        drawMacroR * 2
      );
      // 柔和暗边微压，增强巨球体积感
      const rim = ctx.createRadialGradient(
        geo.macro.cx - drawMacroR * 0.12,
        geo.macro.cy - drawMacroR * 0.14,
        drawMacroR * 0.52,
        geo.macro.cx,
        geo.macro.cy,
        drawMacroR
      );
      rim.addColorStop(0, "rgba(255, 232, 130, 0.06)");
      rim.addColorStop(0.75, "rgba(0, 0, 0, 0)");
      rim.addColorStop(1, "rgba(45, 28, 0, 0.22)");
      ctx.fillStyle = rim;
      ctx.fillRect(geo.macro.cx - drawMacroR, geo.macro.cy - drawMacroR, drawMacroR * 2, drawMacroR * 2);
    } else if (state.scene === "boullee") {
      // 1784 布雷《牛顿纪念碑》：巨型纪念球穹 + 环绕经纬石阶基座
      ctx.beginPath();
      ctx.arc(geo.macro.cx, geo.macro.cy, drawMacroR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        goldTex,
        geo.macro.cx - drawMacroR,
        geo.macro.cy - drawMacroR,
        drawMacroR * 2,
        drawMacroR * 2
      );
      // 穹顶天窗星孔与建筑石弧暗影
      const shade = ctx.createLinearGradient(
        geo.macro.cx - drawMacroR,
        geo.macro.cy - drawMacroR,
        geo.macro.cx + drawMacroR,
        geo.macro.cy + drawMacroR * 0.8
      );
      shade.addColorStop(0, "rgba(255,244,198,0.12)");
      shade.addColorStop(0.62, "rgba(18,14,6,0.08)");
      shade.addColorStop(1, "rgba(9,9,8,0.52)");
      ctx.fillStyle = shade;
      ctx.fillRect(geo.macro.cx - drawMacroR, geo.macro.cy - drawMacroR, drawMacroR * 2, drawMacroR * 2);

      // 三道石台基座环带
      ctx.fillStyle = "rgba(14, 13, 10, 0.78)";
      const baseTop = geo.macro.cy + drawMacroR * 0.56;
      ctx.fillRect(geo.macro.cx - drawMacroR, baseTop, drawMacroR * 2, drawMacroR * 0.14);
      ctx.fillRect(geo.macro.cx - drawMacroR, baseTop + drawMacroR * 0.22, drawMacroR * 2, drawMacroR * 0.3);
      ctx.strokeStyle = "rgba(245, 191, 18, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(geo.macro.cx - drawMacroR, baseTop);
      ctx.lineTo(geo.macro.cx + drawMacroR, baseTop);
      ctx.stroke();
    } else {
      // 平面海报 · 巨字微注：极大体量「巨」字作为视觉巨物
      const fontSize = Math.round(drawMacroR * 1.85);
      ctx.font = `400 ${fontSize}px "ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#F5BF12";
      ctx.fillText("巨", geo.macro.cx, geo.macro.cy + fontSize * 0.04);
      // 轻度矿物边框刻度框，标明字形包围区
      ctx.strokeStyle = "rgba(245, 191, 18, 0.22)";
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        geo.macro.cx - drawMacroR * 0.88,
        geo.macro.cy - drawMacroR * 0.88,
        drawMacroR * 1.76,
        drawMacroR * 1.76
      );
      ctx.setLineDash([]);
    }
    ctx.restore();

    // 巨物拖拽外缘微环（悬停或错态时轻柔提示可拖边缘）
    const rimHighlight = hoverTarget === "macro-rim" || dragMode === "macro" || audit.code === "suffocate";
    ctx.save();
    ctx.strokeStyle =
      audit.code === "suffocate"
        ? "rgba(255, 116, 97, 0.85)"
        : rimHighlight
          ? "rgba(247, 206, 70, 0.82)"
          : "rgba(245, 191, 18, 0.2)";
    ctx.lineWidth = rimHighlight ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(geo.macro.cx, geo.macro.cy, drawMacroR + 6, -Math.PI * 0.26, Math.PI * 0.26);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 3. 原海报暗丘弧线与脚下金色反照光池（horizonOn === true 时亮起）
    if (state.horizonOn) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i <= 32; i++) {
        const u = i / 32;
        ctx.lineTo(u * W, hillYRatio(u) * H);
      }
      ctx.lineTo(W, H);
      ctx.closePath();

      // 暗丘深暖黑底
      const hillFill = ctx.createLinearGradient(0, H * 0.82, 0, H);
      hillFill.addColorStop(0, "#19150A");
      hillFill.addColorStop(0.35, "#0E0D0A");
      hillFill.addColorStop(1, "#080807");
      ctx.fillStyle = hillFill;
      ctx.fill();

      // 巨球正下方与小人脚下的金色地光池（1:1 复刻原海报）
      ctx.clip();
      const spillX = state.refVisible ? (geo.macro.cx + geo.micro.x) * 0.56 : geo.macro.cx;
      const spillY = hillYRatio(spillX / W) * H;
      const spill = ctx.createRadialGradient(spillX, spillY, 4, spillX, spillY + H * 0.02, W * 0.42);
      spill.addColorStop(0, "rgba(245, 191, 18, 0.55)");
      spill.addColorStop(0.28, "rgba(130, 100, 25, 0.34)");
      spill.addColorStop(0.68, "rgba(58, 46, 14, 0.14)");
      spill.addColorStop(1, "rgba(9, 9, 8, 0)");
      ctx.fillStyle = spill;
      ctx.fillRect(0, H * 0.75, W, H * 0.26);

      if (state.refVisible) {
        const footPool = ctx.createRadialGradient(
          geo.micro.x,
          geo.micro.footY + 1,
          2,
          geo.micro.x,
          geo.micro.footY + 4,
          Math.max(32, geo.micro.h * 1.45)
        );
        footPool.addColorStop(0, "rgba(255, 224, 102, 0.85)");
        footPool.addColorStop(0.45, "rgba(245, 191, 18, 0.28)");
        footPool.addColorStop(1, "rgba(245, 191, 18, 0)");
        ctx.fillStyle = footPool;
        ctx.fillRect(0, H * 0.78, W, H * 0.22);
      }
      ctx.restore();
    } else {
      // 未开启地平锚定时，用极细虚线标明「漂浮无锚地平」
      ctx.save();
      ctx.strokeStyle = "rgba(255, 116, 97, 0.4)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.84);
      ctx.lineTo(W * 0.92, H * 0.84);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(255, 152, 136, 0.86)";
      ctx.textAlign = "right";
      ctx.fillText("地平暗丘已关闭 · 主次漂浮无空间锚", W * 0.92, H * 0.84 - 7);
      ctx.restore();
    }

    // 4. 中号过渡干扰体（可点击移除）
    const sceneMeta = SCENES[state.scene] || SCENES.poster;
    for (const m of geo.mids) {
      if (!m.active) continue;
      const isHot = hoverTarget === `mid-${m.index}`;
      ctx.save();
      // 暗沉灰金色过渡球/块，真实破坏巨—微断崖
      ctx.fillStyle = isHot ? "rgba(196, 154, 48, 0.58)" : "rgba(164, 132, 54, 0.42)";
      ctx.beginPath();
      if (state.scene === "type" && m.index === 1) {
        ctx.rect(m.x - m.r, m.y - m.r * 0.62, m.r * 2, m.r * 1.24);
      } else {
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      }
      ctx.fill();

      // 朱砂红虚线告警圈 + 直接可点标签
      ctx.strokeStyle = isHot ? "#FF9282" : "#FF7461";
      ctx.lineWidth = isHot ? 2 : 1.5;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const tag = `× ${sceneMeta.midNames[m.index]} · 点撤`;
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tag).width + 14;
      const tx = clamp(m.x - tw * 0.5, 10, W - tw - 10);
      const aboveY = m.y - m.r - 24;
      const ty = aboveY >= 40 ? aboveY : clamp(m.y + m.r + 4, 42, H - 56);
      ctx.fillStyle = "#B52A1B";
      ctx.fillRect(tx, ty, tw, 21);
      ctx.fillStyle = "#FFF5EC";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, tx + tw * 0.5, ty + 11);
      ctx.restore();
    }

    // 5. 人类尺标 / 微小参照元素（零五官纯剪影，或排版微注脚）
    if (state.refVisible) {
      const badMicro = audit.code === "inverted" || audit.code === "vanish" || audit.code === "collide";
      const figColor = badMicro ? "#FF8B78" : "#F7CE46";
      if (state.scene === "poster") {
        drawSilhouetteFigure(ctx, geo.micro.x, geo.micro.footY, geo.micro.h * ease, figColor, state.horizonOn ? 0.72 : 0.25);
      } else if (state.scene === "boullee") {
        // 三尊微缩观者剪影（主站位 + 两侧陪衬微影），零五官
        const h = geo.micro.h * ease;
        drawSilhouetteFigure(ctx, geo.micro.x, geo.micro.footY, h, figColor, 0.65);
        drawSilhouetteFigure(ctx, geo.micro.x - h * 0.48, geo.micro.footY + 1, h * 0.88, figColor, 0.45);
        drawSilhouetteFigure(ctx, geo.micro.x + h * 0.46, geo.micro.footY + 2, h * 0.82, figColor, 0.45);
      } else {
        // 平面排版微注脚块
        ctx.save();
        const fSize = clamp(Math.round(geo.micro.h * 0.34), 9, 44);
        const bx = clamp(geo.micro.x - geo.micro.w * 0.45, W * 0.54, W - 120);
        const by = geo.micro.footY - geo.micro.h;
        ctx.fillStyle = figColor;
        ctx.fillRect(bx, by, Math.max(26, geo.micro.w * 0.32), Math.max(1.5, fSize * 0.14));
        ctx.font = `700 ${fSize}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#F4EAD6";
        ctx.fillText("秋季空间展", bx, by + Math.max(4, fSize * 0.32));
        ctx.font = `500 ${Math.max(9, Math.round(fSize * 0.62))}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "#C6B99C";
        ctx.fillText("NO.099 · SCALE", bx, by + Math.max(16, fSize * 1.48));
        ctx.restore();
      }

      // 悬停或拖动小人时画出垂直尺度卡尺线
      if (hoverTarget === "micro" || dragMode === "micro" || audit.code === "collide" || audit.code === "vanish") {
        ctx.save();
        const bx = geo.micro.x + Math.max(14, geo.micro.w * 0.72);
        ctx.strokeStyle = badMicro ? "#FF7461" : "#F7CE46";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(bx, geo.micro.y);
        ctx.lineTo(bx, geo.micro.footY);
        ctx.moveTo(bx - 4, geo.micro.y);
        ctx.lineTo(bx + 4, geo.micro.y);
        ctx.moveTo(bx - 4, geo.micro.footY);
        ctx.lineTo(bx + 4, geo.micro.footY);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // 参照物已撤走时的空位警示提示
      ctx.save();
      const fx = W * 0.74;
      const fy = hillYRatio(0.74) * H;
      ctx.strokeStyle = "rgba(255, 116, 97, 0.75)";
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(fx - 26, fy - 46, 52, 46);
      ctx.setLineDash([]);
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#FF8B78";
      ctx.textAlign = "center";
      ctx.fillText("尺标空缺", fx, fy - 54);
      ctx.restore();
    }

    // 6. 压迫感与史蒂文斯感知比验真叠层（按 Space 触发，1.9s 丝滑演播）
    if (verifyTimer > 0) {
      const p = 1 - verifyTimer / 1.9; // 0 -> 1
      ctx.save();

      // A. 第一眼巨物脉冲锁死圈
      const p1 = clamp(p / 0.55, 0, 1);
      const pulseR = geo.macro.r * (0.94 + p1 * 0.14);
      ctx.strokeStyle = `rgba(247, 206, 70, ${(1 - p1 * 0.55) * 0.9})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(geo.macro.cx, geo.macro.cy, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      // B. 史蒂文斯 A^0.7 感知等效圈 vs 物理巨圈对照（以巨球中心画出相对感知半径）
      const percScale = state.refVisible
        ? Math.min(0.95, Math.sqrt(geo.perceivedRatio / Math.max(1, geo.areaRatio)))
        : 0.5;
      ctx.strokeStyle = "rgba(242, 224, 189, 0.72)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(geo.macro.cx, geo.macro.cy, geo.macro.r * percScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // C. 原海报第 5 条「远近 DEPTH」透视虚线锥（从巨球切线指向山脊微人）
      if (state.refVisible && p > 0.25) {
        const p2 = clamp((p - 0.25) / 0.6, 0, 1);
        const topX = geo.macro.cx + geo.macro.r * 0.45;
        const topY = geo.macro.cy - geo.macro.r * 0.75;
        const botX = geo.macro.cx + geo.macro.r * 0.25;
        const botY = geo.macro.cy + geo.macro.r * 0.88;
        ctx.strokeStyle = `rgba(247, 206, 70, ${0.78 * p2})`;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.lineTo(topX + (geo.micro.x - topX) * p2, topY + (geo.micro.y - topY) * p2);
        ctx.moveTo(botX, botY);
        ctx.lineTo(botX + (geo.micro.x - botX) * p2, botY + (geo.micro.footY - botY) * p2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // D. 验真浮标读数（来自单真源）
      const label = state.refVisible
        ? `首眼锁焦 · 高差 ${geo.heightRatio.toFixed(1)}× · 物理面积 ${Math.round(geo.areaRatio)}× → 史蒂文斯感知约 ${Math.round(geo.perceivedRatio)}×（示意）`
        : "缺少参照物 · 无法建立有效尺度对比";
      ctx.font = `600 12px "Noto Sans SC", sans-serif`;
      const lw = Math.min(W - 24, ctx.measureText(label).width + 24);
      const lx = (W - lw) * 0.5;
      const ly = H - 44;
      ctx.fillStyle = "rgba(14, 13, 10, 0.92)";
      ctx.fillRect(lx, ly, lw, 28);
      ctx.strokeStyle = audit.passed ? "#6EE0A8" : "#F5BF12";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(lx, ly, lw, 28);
      ctx.fillStyle = "#F5EBD7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, W * 0.5, ly + 14.5);
      ctx.restore();
    }

    // 7. 画布顶沿极简刻度 HUD（单真源数字 + 实时状态章）
    ctx.save();
    const hudText = state.refVisible
      ? `高差 ${geo.heightRatio.toFixed(1)}× · 物理面积 ${Math.round(geo.areaRatio)}× · 感知约 ${Math.round(geo.perceivedRatio)}×(示意) · 留黑 ${Math.round(geo.darkSpacePct * 100)}%`
      : `参照已撤走 · 主物占高 ${Math.round(state.macroScale * 100)}% · 留黑 ${Math.round(geo.darkSpacePct * 100)}%`;
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    const hw = Math.min(W - 140, ctx.measureText(hudText).width + 18);
    ctx.fillStyle = "rgba(18, 17, 13, 0.84)";
    ctx.fillRect(12, 12, hw, 24);
    ctx.strokeStyle = "rgba(242, 224, 189, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, hw, 24);
    ctx.fillStyle = "#F2E0BD";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, 20, 24.5, hw - 14);

    // 右上状态徽标
    const bText = audit.badge;
    const bw = ctx.measureText(bText).width + 20;
    const bx = W - bw - 12;
    ctx.fillStyle = audit.passed ? "#164A32" : "#7F1F14";
    ctx.fillRect(bx, 12, bw, 24);
    ctx.strokeStyle = audit.passed ? "#6EE0A8" : "#FF7461";
    ctx.strokeRect(bx, 12, bw, 24);
    ctx.fillStyle = audit.passed ? "#E8FFF3" : "#FFF1ED";
    ctx.textAlign = "center";
    ctx.fillText(bText, bx + bw * 0.5, 24.5);

    // 底沿操作微提示（验真播完时显示）
    if (verifyTimer <= 0) {
      const tip = "画布内左右横拖拉巨微张力 · 上下拖小人改尺标 · 点红框撤中号干扰 · Space 验真";
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(233, 215, 178, 0.72)";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(tip, W * 0.5, H - 10, W - 24);
    }
    ctx.restore();

    ctx.restore();
  }

  const ctrl = loop(canvas, drawScene);

  return {
    redraw() {
      needsDraw = true;
      ctrl.draw();
    },
    triggerVerify() {
      verifyTimer = 1.9;
      needsDraw = true;
      ctrl.draw();
    },
    getSize() {
      return { W, H };
    },
  };
}
