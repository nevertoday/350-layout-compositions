// 204 极坐标网格 · 开场极坐标蓝图测绘台 & 同步直角展开条（纯 2D 高清矢量画布）
import { pixelRatio } from "../../lib/stage.js";
import { normDeg } from "./model.js";

const COL = {
  bg: "#000B19",
  bgRadial: "#051933",
  grid: "rgba(92, 134, 178, 0.34)",
  gridStrong: "rgba(116, 168, 214, 0.52)",
  cyan: "#1BCBFF",
  cyanSoft: "rgba(27, 203, 255, 0.22)",
  cyanLine: "rgba(33, 212, 243, 0.88)",
  pink: "#FC3782",
  pinkFill: "rgba(252, 55, 130, 0.28)",
  pinkFillActive: "rgba(252, 55, 130, 0.48)",
  pinkWarn: "rgba(255, 90, 146, 0.85)",
  white: "#F4F6F8",
  whiteRay: "rgba(244, 246, 248, 0.56)",
  muted: "#A9C0D8",
  ok: "#46E0A0",
  okFill: "rgba(70, 224, 160, 0.16)",
  warn: "#FF6B9A",
};

function setupHiDPI(canvas, forceMeasure = false) {
  const dpr = window.innerWidth <= 640 ? pixelRatio(1.5) : pixelRatio(2);
  let w = canvas.__cssW || 0;
  let h = canvas.__cssH || 0;
  if (forceMeasure || !w || !h) {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(200, Math.round(rect.width));
    h = Math.max(100, Math.round(rect.height));
    canvas.__cssW = w;
    canvas.__cssH = h;
  }
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export function invalidateCanvasSize(canvas) {
  if (canvas) {
    canvas.__cssW = 0;
    canvas.__cssH = 0;
  }
}

function drawArrowhead(ctx, x, y, angleRad, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.48);
  ctx.lineTo(-size * 0.72, 0);
  ctx.lineTo(-size, size * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createHeroPolarRenderer(canvas, onInteract) {
  let layout = { cx: 200, cy: 200, R: 140, probeX: 280, probeY: 140, sectorHits: [] };
  let dragging = null; // "probe" | "rotate" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartZero = 0;
  let dragStartProbeDeg = 0;
  let pointerMoved = false;
  let touchMode = "pending"; // "pending" | "canvas" | "scroll"
  let activePointerId = null;

  function canvasCoords(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTestProbe(x, y) {
    return Math.hypot(x - layout.probeX, y - layout.probeY) <= 28;
  }

  function updateProbeFromXY(x, y, zeroAngle) {
    const dx = x - layout.cx;
    const dy = layout.cy - y; // 数学 y 朝上
    const rNorm = Math.max(0.1, Math.min(1, Math.hypot(dx, dy) / Math.max(20, layout.R)));
    const worldDeg = normDeg((Math.atan2(dy, dx) * 180) / Math.PI);
    const localDeg = normDeg(worldDeg - zeroAngle);
    onInteract({ type: "probe", rNorm, thetaDeg: localDeg });
  }

  function handleSectorClick(x, y) {
    const dx = x - layout.cx;
    const dy = layout.cy - y;
    const dist = Math.hypot(dx, dy);
    if (dist > layout.R * 1.06 || dist < 10) return false;
    const clickDeg = normDeg((Math.atan2(dy, dx) * 180) / Math.PI);
    let best = -1;
    let bestDiff = 999;
    for (const s of layout.sectorHits) {
      let diff = Math.abs(clickDeg - s.worldAngleDeg);
      if (diff > 180) diff = 360 - diff;
      if (diff < s.halfSpanDeg && diff < bestDiff) {
        bestDiff = diff;
        best = s.index;
      }
    }
    if (best >= 0) {
      onInteract({ type: "selectSector", index: best });
      return true;
    }
    return false;
  }

  // 鼠标 / Pointer 事件（支持桌面直拖与键盘）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏单独走 touch 事件以兼容 perf.mjs 与竖向页面滚动
    const pt = canvasCoords(e.clientX, e.clientY);
    activePointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    dragStartX = pt.x;
    dragStartY = pt.y;
    pointerMoved = false;
    const snap = onInteract({ type: "getState" });
    dragStartZero = snap.zeroAngle;
    dragStartProbeDeg = snap.probe.thetaDeg;
    if (hitTestProbe(pt.x, pt.y)) {
      dragging = "probe";
      updateProbeFromXY(pt.x, pt.y, snap.zeroAngle);
    } else {
      dragging = "rotate";
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || !dragging || e.pointerId !== activePointerId) return;
    const pt = canvasCoords(e.clientX, e.clientY);
    if (Math.hypot(pt.x - dragStartX, pt.y - dragStartY) > 4) pointerMoved = true;
    const snap = onInteract({ type: "getState" });
    if (dragging === "probe") {
      updateProbeFromXY(pt.x, pt.y, snap.zeroAngle);
    } else if (dragging === "rotate") {
      const dx = pt.x - dragStartX;
      const nextZero = normDeg(dragStartZero + dx * 0.45);
      onInteract({ type: "rotateZero", zeroAngle: nextZero, live: true });
    }
  });

  const endPointer = (e) => {
    if (e.pointerType === "touch" || !dragging) return;
    const pt = canvasCoords(e.clientX, e.clientY);
    const wasRotate = dragging === "rotate";
    dragging = null;
    activePointerId = null;
    if (!pointerMoved) {
      if (!handleSectorClick(pt.x, pt.y)) {
        const snap = onInteract({ type: "getState" });
        updateProbeFromXY(pt.x, pt.y, snap.zeroAngle);
      }
    } else if (wasRotate) {
      onInteract({ type: "snapZero" });
    }
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // 触屏专用监听：竖向划动放行滚动，横向划动与抓品红点实时重画（同时完全匹配 perf.mjs dispatchTouchEvent）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const pt = canvasCoords(t.clientX, t.clientY);
      dragStartX = pt.x;
      dragStartY = pt.y;
      pointerMoved = false;
      const snap = onInteract({ type: "getState" });
      dragStartZero = snap.zeroAngle;
      dragStartProbeDeg = snap.probe.thetaDeg;
      if (hitTestProbe(pt.x, pt.y)) {
        dragging = "probe";
        touchMode = "canvas";
      } else {
        dragging = "rotate";
        touchMode = "pending";
      }
    },
    { passive: true },
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !dragging) return;
      const t = e.touches[0];
      const pt = canvasCoords(t.clientX, t.clientY);
      const dx = pt.x - dragStartX;
      const dy = pt.y - dragStartY;
      if (touchMode === "pending") {
        if (Math.hypot(dx, dy) < 3) return;
        touchMode = Math.abs(dx) >= Math.abs(dy) * 0.85 ? "canvas" : "scroll";
      }
      if (touchMode === "scroll") return;
      e.preventDefault();
      pointerMoved = true;
      const snap = onInteract({ type: "getState" });
      if (dragging === "probe") {
        updateProbeFromXY(pt.x, pt.y, snap.zeroAngle);
      } else {
        const nextZero = normDeg(dragStartZero + dx * 0.55);
        onInteract({ type: "rotateZero", zeroAngle: nextZero, live: true });
      }
    },
    { passive: false },
  );

  canvas.addEventListener("touchend", () => {
    const wasRotate = dragging === "rotate" && touchMode === "canvas";
    if (!pointerMoved && touchMode !== "scroll") {
      if (!handleSectorClick(dragStartX, dragStartY)) {
        const snap = onInteract({ type: "getState" });
        updateProbeFromXY(dragStartX, dragStartY, snap.zeroAngle);
      }
    } else if (wasRotate) {
      onInteract({ type: "snapZero" });
    }
    dragging = null;
    touchMode = "pending";
  });

  function render(evalData, state, t, introProgress) {
    const { ctx, w, h } = setupHiDPI(canvas);
    const pad = Math.max(30, Math.min(w, h) * 0.115);
    const R = Math.max(60, Math.min(w, h) / 2 - pad);
    const cx = w / 2;
    const cy = h / 2;
    const p = Math.max(0, Math.min(1, introProgress));
    const ease = 1 - Math.pow(1 - p, 3);

    // 背景深午夜蓝 + 轻量中心微光（零全幅 RadialGradient 像素开销，软件渲染同样 60fps）
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(8, 28, 54, 0.34)";
    ctx.fill();

    // 淡十字参考地平线（仅当极轴歪斜时作为水平/竖直幽灵参考线，直观暴露歪了多少度！）
    if (!evalData.checks.axisOk) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 107, 154, 0.24)";
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - R - 18, cy);
      ctx.lineTo(cx + R + 18, cy);
      ctx.moveTo(cx, cy - R - 18);
      ctx.lineTo(cx, cy + R + 18);
      ctx.stroke();
      ctx.restore();
    }

    const zeroRad = (evalData.zero * Math.PI) / 180;
    const K = evalData.K;
    const N = evalData.N;
    const r0 = state.scaleMode === "truncated" ? 0.36 * R : 0;

    // 1. 同心圆层（CONCENTRIC CIRCLES — 合并常规环为单路径，降低软件渲染绘制调用）
    if (state.layers.circles) {
      const hlIdx = Math.max(1, K - 1);
      ctx.beginPath();
      for (let i = 1; i <= K; i++) {
        if (i === hlIdx) continue;
        const ringR = (R * i * ease) / K;
        ctx.moveTo(cx + ringR, cy);
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      }
      ctx.strokeStyle = evalData.checks.ringsOk ? COL.grid : "rgba(255, 107, 154, 0.36)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const hlR = (R * hlIdx * ease) / K;
      ctx.beginPath();
      ctx.arc(cx, cy, hlR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(45, 195, 240, 0.72)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 环阶微标（沿 270° 略偏右）
      if (K <= 6 && R >= 100) {
        ctx.font = '500 10px "IBM Plex Mono", monospace';
        ctx.fillStyle = "rgba(185, 204, 224, 0.75)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (let i = 1; i <= K; i++) {
          const rr = (R * i) / K;
          const label =
            evalData.theme.encoding === "points"
              ? `${Math.round((evalData.theme.maxVal * i) / K)}`
              : `r${i}`;
          ctx.fillText(label, cx + 5, cy + rr - 7);
        }
      }
    }

    // 截断非零底环警示区
    if (state.scaleMode === "truncated") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r0 * ease, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(252, 55, 130, 0.12)";
      ctx.fill();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COL.pink;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    // 2. 角度射线层（ANGLE — 批量绘制虚线射线与主轴，大幅减少 stroke/save 次数）
    if (state.layers.angle) {
      const stepRad = (Math.PI * 2) / N;
      const showLabels = N <= 12;
      const cardinals = [];
      const ticks = [];
      const labelsToDraw = [];

      // 批量画虚线非正交射线
      ctx.save();
      ctx.strokeStyle = evalData.checks.angleOk ? COL.whiteRay : "rgba(255, 132, 174, 0.44)";
      ctx.lineWidth = N >= 18 ? 0.85 : 1.05;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const localDeg = (i * 360) / N;
        const ang = zeroRad + i * stepRad;
        const isCardinal = Math.abs(localDeg % 90) < 0.01;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        if (isCardinal) {
          cardinals.push({ ang, cosA, sinA });
        } else {
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + cosA * R * ease, cy - sinA * R * ease);
          ticks.push({ cosA, sinA });
        }
        if (showLabels || i % 2 === 0) {
          labelsToDraw.push({
            text: `${Math.round(localDeg)}°`,
            isCardinal,
            x: cx + cosA * (isCardinal ? R + 28 : R + 19),
            y: cy - sinA * (isCardinal ? R + 28 : R + 19),
          });
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (ticks.length) {
        ctx.beginPath();
        for (const tk of ticks) {
          ctx.moveTo(cx + tk.cosA * (R - 4) * ease, cy - tk.sinA * (R - 4) * ease);
          ctx.lineTo(cx + tk.cosA * (R + 5) * ease, cy - tk.sinA * (R + 5) * ease);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 批量画正交电光青主轴 + 箭尖
      if (cardinals.length) {
        ctx.strokeStyle = evalData.checks.axisOk ? COL.cyanLine : "rgba(255, 118, 166, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const c of cardinals) {
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + c.cosA * (R + 12) * ease, cy - c.sinA * (R + 12) * ease);
        }
        ctx.stroke();
        const arrowCol = evalData.checks.axisOk ? COL.cyan : COL.warn;
        for (const c of cardinals) {
          drawArrowhead(ctx, cx + c.cosA * (R + 16) * ease, cy - c.sinA * (R + 16) * ease, -c.ang, 7.5, arrowCol);
        }
      }

      // 若角度数不能整除 4，单独画出 0° 零度参考轴
      if (N % 4 !== 0) {
        const cos0 = Math.cos(zeroRad);
        const sin0 = Math.sin(zeroRad);
        ctx.strokeStyle = COL.warn;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cos0 * (R + 12) * ease, cy - sin0 * (R + 12) * ease);
        ctx.stroke();
        drawArrowhead(ctx, cx + cos0 * (R + 16) * ease, cy - sin0 * (R + 16) * ease, -zeroRad, 7.5, COL.warn);
      }

      // 批量绘制外环角度刻度字
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const lb of labelsToDraw) {
        ctx.font = lb.isCardinal ? '600 11px "IBM Plex Mono", monospace' : '400 10.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = lb.isCardinal ? COL.white : COL.cyan;
        ctx.fillText(lb.text, lb.x, lb.y);
      }
    }

    // 3. 扇区 / 雷达回波数据层（SECTOR）
    const halfSpanDeg = Math.min(22, 180 / N);
    const halfSpanRad = (halfSpanDeg * Math.PI) / 180;
    const sectorHits = [];

    if (state.layers.sector) {
      // 雷达扫描余晖（仅在雷达主题且非静止时轻柔扫过）
      if (evalData.theme.id === "radar") {
        const sweepRad = zeroRad + ((t * 0.55) % (Math.PI * 2));
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * ease, -sweepRad, -(sweepRad - 0.35), false);
        ctx.closePath();
        ctx.fillStyle = "rgba(27, 203, 255, 0.10)";
        ctx.fill();
        ctx.restore();
      }

      for (const item of evalData.items) {
        const ang = (item.worldAngleDeg * Math.PI) / 180;
        const rDraw = item.rNorm * R * ease;
        const isSelected = item.index === state.selectedIndex;
        const isCompare = evalData.theme.comparePair.includes(item.index);
        sectorHits.push({ index: item.index, worldAngleDeg: item.worldAngleDeg, halfSpanDeg: Math.max(14, halfSpanDeg) });

        if (evalData.theme.encoding === "sectors") {
          const a1 = -(ang + halfSpanRad);
          const a2 = -(ang - halfSpanRad);
          ctx.save();
          ctx.beginPath();
          if (r0 > 0) {
            ctx.arc(cx, cy, rDraw, a1, a2, false);
            ctx.arc(cx, cy, r0 * ease, a2, a1, true);
          } else {
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, rDraw, a1, a2, false);
          }
          ctx.closePath();
          ctx.fillStyle = isSelected
            ? COL.pinkFillActive
            : isCompare
              ? "rgba(252, 55, 130, 0.30)"
              : "rgba(27, 203, 255, 0.16)";
          ctx.fill();
          ctx.strokeStyle = isSelected ? COL.pink : isCompare ? "#FF6AA4" : "rgba(27, 203, 255, 0.72)";
          ctx.lineWidth = isSelected ? 2 : 1.25;
          ctx.stroke();

          // 当线性半径导致面积夸大时，在最大对照扇区内画一条虚线表示「诚实面积应停的 √v 半径」
          if (!evalData.checks.scaleOk && state.scaleMode === "linear" && item.index === evalData.theme.comparePair[0]) {
            const honestR = Math.sqrt(item.value / evalData.theme.maxVal) * R * ease;
            ctx.beginPath();
            ctx.arc(cx, cy, honestR, a1, a2, false);
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = COL.ok;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // 雷达回波点位模式
          const bx = cx + Math.cos(ang) * rDraw;
          const by = cy - Math.sin(ang) * rDraw;
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, isSelected ? 7.5 : 5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? COL.pink : COL.cyan;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx, by, isSelected ? 13 : 9, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? "rgba(252, 55, 130, 0.65)" : "rgba(27, 203, 255, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.font = '500 10px "IBM Plex Mono", monospace';
          ctx.fillStyle = COL.white;
          ctx.textAlign = "left";
          ctx.textBaseline = "bottom";
          ctx.fillText(`${item.id} · ${item.value}km`, bx + 10, by - 4);
          ctx.restore();
        }
      }
    }

    // 4. 半径矢量与品红定位点 P(r, θ)（RADIUS — 1:1 复刻 204 原海报品红半径线 + θ 弧 + 直角虚线投影）
    const pAngWorld = (evalData.probe.worldDeg * Math.PI) / 180;
    const pR = evalData.probe.rNorm * R * ease;
    const px = cx + Math.cos(pAngWorld) * pR;
    const py = cy - Math.sin(pAngWorld) * pR;

    if (state.layers.radius) {
      // 直角坐标投影虚线 (x = r cos θ, y = r sin θ) 到旋转后的极轴
      const projX = cx + Math.cos(zeroRad) * (pR * Math.cos((evalData.probe.localDeg * Math.PI) / 180));
      const projY = cy - Math.sin(zeroRad) * (pR * Math.cos((evalData.probe.localDeg * Math.PI) / 180));
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(27, 203, 255, 0.55)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(projX, projY);
      ctx.stroke();
      ctx.restore();

      // 夹角弧 θ（原海报品红弧线）
      const arcR = Math.min(46, R * 0.28) * ease;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, -zeroRad, -pAngWorld, true);
      ctx.strokeStyle = COL.pink;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // θ 字标
      const midAng = zeroRad + ((evalData.probe.localDeg * Math.PI) / 180) * 0.5;
      ctx.font = 'italic 600 13px "IBM Plex Sans", sans-serif';
      ctx.fillStyle = COL.pink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("θ", cx + Math.cos(midAng) * (arcR + 13), cy - Math.sin(midAng) * (arcR + 13));

      // 主矢量线 O -> P(r, θ)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.strokeStyle = COL.pink;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // r 标
      const rx = cx + Math.cos(pAngWorld) * pR * 0.58 - Math.sin(pAngWorld) * 12;
      const ry = cy - Math.sin(pAngWorld) * pR * 0.58 - Math.cos(pAngWorld) * 12;
      ctx.font = 'italic 600 13px "IBM Plex Sans", sans-serif';
      ctx.fillStyle = COL.cyan;
      ctx.fillText("r", rx, ry);

      // 外光圈与实心品红圆点 P(r, θ)
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(252, 55, 130, 0.24)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = COL.pink;
      ctx.fill();
      ctx.strokeStyle = COL.white;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // P(r, θ) 标牌（自动避开边缘截断）
      const label = `P(${evalData.probe.rUnits.toFixed(1)}, ${Math.round(evalData.probe.localDeg)}°)`;
      ctx.font = '600 11.5px "IBM Plex Mono", monospace';
      const tw = ctx.measureText(label).width;
      const lx = Math.max(10, Math.min(w - tw - 14, px + (px > cx ? 12 : -tw - 16)));
      const ly = Math.max(16, Math.min(h - 14, py + (py < cy ? -14 : 18)));
      ctx.fillStyle = "rgba(0, 11, 25, 0.88)";
      ctx.fillRect(lx - 4, ly - 10, tw + 8, 19);
      ctx.strokeStyle = "rgba(252, 55, 130, 0.72)";
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - 4, ly - 10, tw + 8, 19);
      ctx.fillStyle = "#FF78AC";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx, ly);
      ctx.restore();
    }

    // 5. 圆心极点 O（原海报亮白原点）
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = COL.white;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.strokeStyle = evalData.checks.angleOk ? "rgba(27, 203, 255, 0.55)" : "rgba(252, 55, 130, 0.75)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    layout = { cx, cy, R, probeX: px, probeY: py, sectorHits };
  }

  return { render };
}

// 同步直角展开对照条（把圆形极坐标直接展开成 θ ∈ [0°, 360°) 横轴 × r 纵轴，一眼看懂映射真相）
export function renderCartesianStrip(canvas, evalData, state) {
  const { ctx, w, h } = setupHiDPI(canvas);
  ctx.fillStyle = "#041122";
  ctx.fillRect(0, 0, w, h);

  const padL = 32;
  const padR = 14;
  const padT = 18;
  const padB = 22;
  const pw = w - padL - padR;
  const ph = h - padT - padB;

  // 背景水平环线（对应同心圆 K）
  ctx.strokeStyle = "rgba(92, 134, 178, 0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= evalData.K; i++) {
    const y = padT + ph - (ph * i) / evalData.K;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + pw, y);
    ctx.stroke();
  }

  // 竖向角分线（对应射线 N）
  ctx.save();
  ctx.setLineDash([3, 4]);
  for (let i = 0; i <= evalData.N; i++) {
    const x = padL + (pw * i) / evalData.N;
    const isCard = Math.abs(((i * 360) / evalData.N) % 90) < 0.01;
    ctx.strokeStyle = isCard ? "rgba(27, 203, 255, 0.48)" : "rgba(244, 246, 248, 0.16)";
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + ph);
    ctx.stroke();
  }
  ctx.restore();

  // 绘制展开后的真实数据柱（左：诚实基准）vs 当前半径高度（品红点线）
  for (const item of evalData.items) {
    const u = normDeg(item.angleDeg) / 360;
    const x = padL + u * pw;
    const trueH = (item.value / evalData.theme.maxVal) * ph;
    const mappedH = item.rNorm * ph;
    const isSel = item.index === state.selectedIndex;
    const barW = Math.max(8, Math.min(18, pw / 16));

    // 真实值浅青底柱
    ctx.fillStyle = isSel ? "rgba(27, 203, 255, 0.34)" : "rgba(27, 203, 255, 0.18)";
    ctx.fillRect(x - barW / 2, padT + ph - trueH, barW, trueH);

    // 当前半径映射标记顶杠
    const yMapped = padT + ph - mappedH;
    ctx.strokeStyle = isSel ? COL.pink : "#FF78AC";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - barW / 2 - 2, yMapped);
    ctx.lineTo(x + barW / 2 + 2, yMapped);
    ctx.stroke();
  }

  // 实时探针 P(r, θ) 在展开条里的对应坐标点
  const px = padL + (evalData.probe.localDeg / 360) * pw;
  const py = padT + ph - evalData.probe.rNorm * ph;
  ctx.beginPath();
  ctx.arc(px, py, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = COL.pink;
  ctx.fill();
  ctx.strokeStyle = COL.white;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 坐标轴标签
  ctx.font = '500 10px "IBM Plex Mono", monospace';
  ctx.fillStyle = COL.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const deg of [0, 90, 180, 270, 360]) {
    const x = padL + (pw * deg) / 360;
    ctx.fillText(`${deg}°`, x, padT + ph + 5);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("R", padL - 6, padT + 2);
  ctx.fillText("0", padL - 6, padT + ph);
}
