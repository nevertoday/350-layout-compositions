// 087 放射平衡 · 开场主角玩具：放射星盘·极坐标平衡仪 (2D Canvas)
// 高性能零回流渲染：ResizeObserver 缓存尺寸 + dirty 脏标记合并帧 + 无重渐变软光栅友好
import { PALETTE } from "./palette.js";
import { evaluate } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const VINYL_LABELS = [
  "01 SOLAR", "02 DRIFT", "03 PULSE", "04 ORBIT",
  "05 AXIS",  "06 BLOOM", "07 EQUINOX", "08 ECHO",
  "09 NOON",  "10 ARC",   "11 HALO", "12 TIDE",
  "13 MERIDIAN", "14 FLUX", "15 ZENITH", "16 CORE",
  "17 VORTEX", "18 CHORD", "19 RAYS", "20 SPIN",
  "21 PHASE", "22 WAVE", "23 RING", "24 REST",
];

export function mountAstrolabe(canvas, state, onChange) {
  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 440;
  let h = 440;
  let dpr = 1;
  let dirty = true;
  let rectCache = null;

  const anim = {
    intro: 0,
    pulseProgress: -1,
    hoverRay: -1,
    hoverHub: false,
  };

  let dragMode = null;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let dragSpan0 = 155;
  let dragRayIndex = -1;
  let dragRayAngle0 = 0;
  let dragRayOffset0 = 0;
  let lastEval = evaluate(state);

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    rectCache = rect;
    const nw = Math.max(240, Math.round(rect.width));
    const nh = Math.max(240, Math.round(rect.height));
    // 手机窄屏上限 1.5x（兼顾锐度与软件渲染帧率），桌面 2x
    const maxDpr = window.innerWidth <= 680 ? 1.5 : 2;
    const ndpr = pixelRatio(maxDpr);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      syncSize();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => { rectCache = null; syncSize(); });
  syncSize();

  function geom() {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const safeR = Math.min(w, h) * 0.445;
    return { cx, cy, safeR };
  }

  function toLocal(clientX, clientY) {
    const r = rectCache || canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTest(px, py) {
    const { cx, cy, safeR } = geom();
    const ev = lastEval;
    const hubX = cx + ev.hx * safeR;
    const hubY = cy + ev.hy * safeR;
    const hubPx = Math.max(18, ev.hubR * safeR);
    if (Math.hypot(px - hubX, py - hubY) <= hubPx + 6) {
      return { kind: "hub" };
    }
    let bestRay = -1;
    let bestDist = 20;
    for (const r of ev.rays) {
      const ang = r.angleRad;
      const x1 = cx + Math.cos(ang) * r.innerR * safeR;
      const y1 = cy + Math.sin(ang) * r.innerR * safeR;
      const x2 = cx + Math.cos(ang) * (r.active ? r.outerR : 0.72) * safeR;
      const y2 = cy + Math.sin(ang) * (r.active ? r.outerR : 0.72) * safeR;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy || 1;
      const t = clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1);
      const d = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
      const tipD = Math.hypot(px - x2, py - y2);
      const effD = Math.min(d, tipD - 6);
      if (effD < bestDist) {
        bestDist = effD;
        bestRay = r.index;
      }
    }
    if (bestRay >= 0) return { kind: "ray", index: bestRay };
    return { kind: "span" };
  }

  function markDirty() {
    dirty = true;
  }

  function startPulse() {
    anim.pulseProgress = 0.001;
    dirty = true;
  }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    rectCache = canvas.getBoundingClientRect();
    const pt = toLocal(e.clientX, e.clientY);
    const hit = hitTest(pt.x, pt.y);
    dragPointerId = e.pointerId;
    dragStartX = pt.x;
    dragStartY = pt.y;
    dragMoved = false;

    if (hit.kind === "hub") {
      dragMode = "hub";
      canvas.setPointerCapture?.(e.pointerId);
    } else if (hit.kind === "ray") {
      dragMode = "ray";
      dragRayIndex = hit.index;
      state.selectedRay = hit.index;
      const { cx, cy } = geom();
      dragRayAngle0 = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI;
      dragRayOffset0 = state.angleOffsets[hit.index] || 0;
      canvas.setPointerCapture?.(e.pointerId);
    } else {
      dragMode = "span";
      dragSpan0 = state.spanDeg;
      canvas.setPointerCapture?.(e.pointerId);
    }
    dirty = true;
    onChange("select");
  }

  function onPointerMove(e) {
    const pt = toLocal(e.clientX, e.clientY);
    if (dragMode == null || e.pointerId !== dragPointerId) {
      if (e.pointerType === "mouse") {
        const hit = hitTest(pt.x, pt.y);
        const nhub = hit.kind === "hub";
        const nray = hit.kind === "ray" ? hit.index : -1;
        if (nhub !== anim.hoverHub || nray !== anim.hoverRay) {
          anim.hoverHub = nhub;
          anim.hoverRay = nray;
          dirty = true;
        }
        canvas.style.cursor = hit.kind === "span" ? "ew-resize" : "grab";
      }
      return;
    }

    const dx = pt.x - dragStartX;
    const dy = pt.y - dragStartY;
    if (Math.hypot(dx, dy) > 5) dragMoved = true;

    const { cx, cy, safeR } = geom();
    if (dragMode === "span") {
      const deltaDeg = (dx / Math.max(140, w * 0.48)) * 220;
      let next = clamp(dragSpan0 + deltaDeg, 90, 435);
      if (Math.abs(next - 360) < 7) next = 360;
      state.spanDeg = next;
      if (Math.abs(next - 360) < 12) state.startDeg = -90;
      dirty = true;
      onChange("drag");
    } else if (dragMode === "ray" && dragMoved) {
      const curAng = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI;
      let delta = curAng - dragRayAngle0;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      let nextOff = clamp(dragRayOffset0 + delta, -150, 150);
      if (Math.abs(nextOff) < 4) nextOff = 0;
      state.angleOffsets[dragRayIndex] = nextOff;
      dirty = true;
      onChange("drag");
    } else if (dragMode === "hub" && dragMoved) {
      let nx = clamp((pt.x - cx) / safeR, -0.20, 0.20);
      let ny = clamp((pt.y - cy) / safeR, -0.20, 0.20);
      if (Math.hypot(nx, ny) < 0.032) {
        nx = 0;
        ny = 0;
      }
      state.hubOffset.x = nx;
      state.hubOffset.y = ny;
      dirty = true;
      onChange("drag");
    }
  }

  function onPointerUp(e) {
    if (e.pointerId !== dragPointerId) return;
    if (!dragMoved && dragMode === "ray" && dragRayIndex >= 0) {
      const cur = state.tiers[dragRayIndex] ?? 1;
      state.tiers[dragRayIndex] = cur === 3 ? 2 : cur === 2 ? 1 : cur === 1 ? 0 : 3;
      dirty = true;
      onChange("click-ray");
    } else if (!dragMoved && dragMode === "hub") {
      startPulse();
      onChange("pulse");
    }
    dragMode = null;
    dragPointerId = null;
    canvas.style.cursor = "ew-resize";
  }

  // 触屏单指横拖（兼容 CDP dispatchTouchEvent 基准测试）
  let touchStartX = 0;
  let touchSpan0 = 155;
  let touchActive = false;
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    rectCache = canvas.getBoundingClientRect();
    const t = e.touches[0];
    touchStartX = t.clientX - rectCache.left;
    touchSpan0 = state.spanDeg;
    touchActive = true;
  }
  function onTouchMove(e) {
    if (!touchActive || e.touches.length !== 1 || !rectCache) return;
    const t = e.touches[0];
    const dx = (t.clientX - rectCache.left) - touchStartX;
    if (Math.abs(dx) > 2) {
      const deltaDeg = (dx / Math.max(120, w * 0.45)) * 210;
      let next = clamp(touchSpan0 + deltaDeg, 90, 435);
      if (Math.abs(next - 360) < 6) next = 360;
      state.spanDeg = next;
      if (Math.abs(next - 360) < 12) state.startDeg = -90;
      dirty = true;
      onChange("drag");
    }
  }
  function onTouchEnd() {
    touchActive = false;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  function drawAstrolabeBack(cx, cy, safeR, ev, introEased) {
    // 用两层柔润半透明圆盘替代每帧大面积 RadialGradient（软件渲染快 10 倍，观感一致）
    ctx.fillStyle = "rgba(180, 127, 90, 0.055)";
    ctx.beginPath();
    ctx.arc(cx, cy, safeR * 0.66, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(228, 91, 69, 0.055)";
    ctx.beginPath();
    ctx.arc(cx, cy, safeR * 0.38, 0, TAU);
    ctx.fill();

    const guideAlpha = state.showGuides ? 0.24 : 0.10;
    ctx.lineWidth = 1;

    // 外安全圈（实线细环，避免昂贵软件虚线圆光栅）
    const extendHi = state.highlightMode === "extend" || !ev.passExtend;
    ctx.strokeStyle = !ev.passExtend && ev.clippedCount > 0
      ? "rgba(184, 42, 26, 0.62)"
      : extendHi
        ? "rgba(228, 91, 69, 0.48)"
        : `rgba(100, 23, 32, ${guideAlpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(cx, cy, safeR * 0.975, 0, TAU);
    ctx.stroke();

    // 原海报中央双层测角环
    const ringR1 = Math.max(ev.hubR * safeR + 10, safeR * 0.245) * introEased;
    const ringR2 = ringR1 + 7;
    ctx.strokeStyle = state.highlightMode === "center"
      ? "rgba(228, 91, 69, 0.68)"
      : "rgba(228, 91, 69, 0.42)";
    ctx.beginPath();
    ctx.arc(cx, cy, ringR1, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(100, 23, 32, 0.24)";
    ctx.beginPath();
    ctx.arc(cx, cy, ringR2, 0, TAU);
    ctx.stroke();

    // 批量合批绘制 24 刻度针（1 次 stroke 替代 24 次！）
    if (state.showGuides) {
      ctx.beginPath();
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * TAU - Math.PI / 2;
        const r1 = safeR * (k % 6 === 0 ? 0.935 : 0.958);
        const r2 = safeR * 0.995;
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      }
      ctx.strokeStyle = "rgba(100, 23, 32, 0.30)";
      ctx.stroke();
    }

    // 空扇区警报扇面
    if (!ev.passBalance && ev.activeCount >= 2 && ev.maxGapDeg > 72) {
      const sorted = ev.rays.filter((r) => r.active).map((r) => r.angleDeg).sort((a, b) => a - b);
      let gStart = 0;
      let gSpan = 0;
      for (let i = 0; i < sorted.length; i++) {
        const nxt = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360;
        const gap = nxt - sorted[i];
        if (gap > gSpan) {
          gSpan = gap;
          gStart = sorted[i];
        }
      }
      const a0 = ((gStart + 6) * Math.PI) / 180;
      const a1 = ((gStart + gSpan - 6) * Math.PI) / 180;
      if (a1 > a0) {
        ctx.fillStyle = "rgba(184, 42, 26, 0.08)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, safeR * 0.88, a0, a1);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(184, 42, 26, 0.52)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(cx, cy, safeR * 0.88, a0, a1);
        ctx.stroke();

        const mid = (a0 + a1) * 0.5;
        drawCanvasTag(
          ctx,
          cx + Math.cos(mid) * safeR * 0.56,
          cy + Math.sin(mid) * safeR * 0.56,
          `空扇 ${Math.round(gSpan)}°`,
          PALETTE.warn,
          "#FFF8F2"
        );
      }
    }
  }

  function drawRay(cx, cy, safeR, r, ev, introEased) {
    const ang = r.angleRad;
    const isSel = r.index === state.selectedRay;
    const isHover = r.index === anim.hoverRay;

    if (!r.active) {
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      ctx.strokeStyle = isHover ? "rgba(228, 91, 69, 0.65)" : "rgba(100, 23, 32, 0.16)";
      ctx.lineWidth = isHover ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + cos * r.innerR * safeR, cy + sin * r.innerR * safeR);
      ctx.lineTo(cx + cos * 0.72 * safeR, cy + sin * 0.72 * safeR);
      ctx.stroke();
      return;
    }

    const r0 = r.innerR * safeR;
    const r1 = r0 + (r.outerR * safeR - r0) * introEased;
    const len = Math.max(6, r1 - r0);
    const spec = state.specimen;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);

    if (isSel || isHover) {
      ctx.strokeStyle = "rgba(228, 91, 69, 0.25)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(r0, 0);
      ctx.lineTo(r1, 0);
      ctx.stroke();
    }

    if (spec === "poster") {
      ctx.strokeStyle = r.tier === 3 ? PALETTE.burgundy : r.tier === 2 ? PALETTE.ink : PALETTE.coral;
      ctx.lineWidth = r.tier === 3 ? 1.8 : r.tier === 2 ? 1.4 : 1.1;

      if (r.tier === 3) {
        ctx.beginPath();
        ctx.moveTo(r0, 0);
        ctx.lineTo(r1 - r.tipR * safeR, 0);
        ctx.stroke();

        const m1 = r0 + len * 0.44;
        const bw = Math.max(8, safeR * 0.068 * r.effThick);
        const bh = Math.max(6, safeR * 0.044 * r.effThick);
        ctx.fillStyle = PALETTE.coral;
        ctx.fillRect(m1 - bw * 0.5, -bh * 0.5, bw, bh);

        const m2 = r0 + len * 0.72;
        const sq = Math.max(5, safeR * 0.032 * r.effThick);
        ctx.fillStyle = PALETTE.burgundy;
        ctx.fillRect(m2 - sq * 0.5, -sq * 0.5, sq, sq);

        const dotR = Math.max(5.5, r.tipR * safeR * (0.7 + 0.3 * r.effThick));
        ctx.fillStyle = r.clipped ? PALETTE.warn : PALETTE.burgundy;
        ctx.beginPath();
        ctx.arc(r1, 0, dotR, 0, TAU);
        ctx.fill();
      } else if (r.tier === 2) {
        ctx.beginPath();
        ctx.moveTo(r0, 0);
        ctx.lineTo(r1, 0);
        ctx.stroke();

        const dm1 = r0 + len * 0.46;
        const ds1 = Math.max(6, safeR * 0.046 * r.effThick);
        ctx.fillStyle = PALETTE.burgundy;
        ctx.beginPath();
        ctx.moveTo(dm1, -ds1 * 0.7);
        ctx.lineTo(dm1 + ds1 * 0.7, 0);
        ctx.lineTo(dm1, ds1 * 0.7);
        ctx.lineTo(dm1 - ds1 * 0.7, 0);
        ctx.closePath();
        ctx.fill();

        const ds2 = Math.max(5, safeR * 0.036 * r.effThick);
        ctx.fillStyle = r.clipped ? PALETTE.warn : PALETTE.coral;
        ctx.beginPath();
        ctx.moveTo(r1, -ds2 * 0.7);
        ctx.lineTo(r1 + ds2 * 0.7, 0);
        ctx.lineTo(r1, ds2 * 0.7);
        ctx.lineTo(r1 - ds2 * 0.7, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        const alt = r.index % 2 === 1;
        ctx.strokeStyle = alt ? "rgba(180, 127, 90, 0.85)" : "rgba(228, 91, 69, 0.78)";
        ctx.beginPath();
        ctx.moveTo(r0, 0);
        ctx.lineTo(r1, 0);
        ctx.stroke();

        const pr = Math.max(3.8, r.tipR * safeR * (0.8 + 0.25 * r.effThick));
        ctx.fillStyle = r.clipped ? PALETTE.warn : alt ? PALETTE.tan : PALETTE.coral;
        ctx.beginPath();
        ctx.arc(r1, 0, pr, 0, TAU);
        ctx.fill();
      }
    } else if (spec === "rose") {
      const halfSpread = (r.tier === 3 ? 0.14 : r.tier === 2 ? 0.105 : 0.072) * (0.72 + 0.28 * r.effThick);
      const midR = r0 + len * 0.58;
      ctx.fillStyle = r.clipped
        ? "rgba(184, 42, 26, 0.72)"
        : r.tier === 3
          ? "rgba(100, 23, 32, 0.86)"
          : r.tier === 2
            ? "rgba(228, 91, 69, 0.78)"
            : "rgba(180, 127, 90, 0.62)";
      ctx.beginPath();
      ctx.moveTo(r0, 0);
      ctx.quadraticCurveTo(midR, -midR * halfSpread * 1.45, r1, 0);
      ctx.quadraticCurveTo(midR, midR * halfSpread * 1.45, r0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = r.tier === 3 ? 1.6 : 1.1;
      ctx.stroke();

      if (r.tier >= 2 && len > 26) {
        ctx.fillStyle = PALETTE.paperBright;
        ctx.beginPath();
        ctx.arc(r0 + len * 0.64, 0, Math.max(3, safeR * (r.tier === 3 ? 0.025 : 0.018)), 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = r.tier === 3 ? PALETTE.ink : r.tier === 2 ? PALETTE.burgundy : PALETTE.tan;
      ctx.lineWidth = r.tier === 3 ? 2.4 : r.tier === 2 ? 1.5 : 1.0;
      ctx.beginPath();
      ctx.moveTo(r0, 0);
      ctx.lineTo(r1 - 12, 0);
      ctx.stroke();

      const barW = r.tier === 3 ? 10 : r.tier === 2 ? 7 : 4;
      ctx.fillStyle = r.clipped ? PALETTE.warn : r.tier === 3 ? PALETTE.coral : PALETTE.burgundy;
      ctx.fillRect(r1 - 12, -barW * 0.5, 12, barW);

      if (safeR > 125 && r.tier >= 2) {
        const label = VINYL_LABELS[r.index % VINYL_LABELS.length];
        ctx.save();
        ctx.translate(r0 + len * 0.54, 0);
        const normDeg = ((r.angleDeg % 360) + 360) % 360;
        if (normDeg > 90 && normDeg < 270) ctx.rotate(Math.PI);
        ctx.font = `700 ${Math.max(10, Math.round(safeR * 0.046))}px "Space Mono", monospace`;
        ctx.fillStyle = PALETTE.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(label, 0, -5);
        ctx.restore();
      }
    }

    if (anim.pulseProgress > 0 && anim.pulseProgress < 1) {
      const pR = r0 + len * anim.pulseProgress;
      const pAlpha = Math.sin(anim.pulseProgress * Math.PI);
      ctx.fillStyle = `rgba(228, 91, 69, ${pAlpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(pR, 0, r.tier === 3 ? 6 : 4, 0, TAU);
      ctx.fill();
    }

    if (r.clipped) {
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(safeR * 0.975, -9);
      ctx.lineTo(safeR * 0.975, 9);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHubAndVector(cx, cy, safeR, ev, introEased) {
    const hubX = cx + ev.hx * safeR;
    const hubY = cy + ev.hy * safeR;
    const hubPx = ev.hubR * safeR * (0.4 + 0.6 * introEased);

    if (ev.hubOffsetDist > 0.015) {
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hubX, hubY);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.burgundy;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, TAU);
      ctx.stroke();
    }

    if (state.specimen === "vinyl") {
      ctx.strokeStyle = "rgba(52, 17, 20, 0.14)";
      ctx.lineWidth = 1;
      for (const frac of [0.36, 0.52, 0.68]) {
        ctx.beginPath();
        ctx.arc(cx, cy, safeR * frac, 0, TAU);
        ctx.stroke();
      }
    }

    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.arc(hubX, hubY, hubPx, 0, TAU);
    ctx.fill();

    if (state.specimen === "rose") {
      ctx.strokeStyle = PALETTE.paperBright;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(hubX, hubY, hubPx * 0.64, 0, TAU);
      ctx.stroke();
    } else if (state.specimen === "vinyl") {
      ctx.fillStyle = PALETTE.paper;
      ctx.beginPath();
      ctx.arc(hubX, hubY, Math.max(3.5, hubPx * 0.22), 0, TAU);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    if (!ev.passCenter || anim.hoverHub) {
      ctx.strokeStyle = !ev.passCenter ? PALETTE.warn : PALETTE.burgundy;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hubX, hubY, hubPx + 4, 0, TAU);
      ctx.stroke();
    }

    if (anim.pulseProgress > 0 && anim.pulseProgress < 1) {
      const pr = hubPx + (safeR * 0.94 - hubPx) * anim.pulseProgress;
      const alpha = (1 - anim.pulseProgress) * 0.55;
      ctx.strokeStyle = `rgba(228, 91, 69, ${alpha.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, TAU);
      ctx.stroke();
    }

    if (state.showGuides && ev.vectorDrift > 0.04) {
      const vx = cx + ev.vecX * safeR * 0.86;
      const vy = cy + ev.vecY * safeR * 0.86;
      const ang = Math.atan2(vy - cy, vx - cx);
      const col = ev.passBalance ? PALETTE.ok : PALETTE.warn;

      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(vx, vy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx - 10 * Math.cos(ang - 0.42), vy - 10 * Math.sin(ang - 0.42));
      ctx.lineTo(vx - 10 * Math.cos(ang + 0.42), vy - 10 * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();

      const lx = clamp(vx + Math.cos(ang) * 26, 62, w - 62);
      const ly = clamp(vy + Math.sin(ang) * 20, 22, h - 22);
      drawCanvasTag(ctx, lx, ly, `重心偏 ${ev.driftPct}%`, col, "#FFF8F2");
    } else if (state.showGuides && ev.isOk) {
      ctx.strokeStyle = "rgba(255, 248, 242, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(4, hubPx * 0.34), 0, TAU);
      ctx.stroke();
    }
  }

  function drawCanvasTag(c, x, y, text, bg, fg) {
    c.font = '700 11px "Space Mono", "Noto Sans SC", sans-serif';
    const tw = c.measureText(text).width;
    const pw = tw + 14;
    const ph = 22;
    c.fillStyle = bg;
    c.fillRect(x - pw * 0.5, y - ph * 0.5, pw, ph);
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, x, y + 0.5);
  }

  function render(t, dt, { still }) {
    let animating = false;
    if (still) {
      if (anim.intro < 1) {
        anim.intro = 1;
        dirty = true;
      }
    } else {
      if (anim.intro < 1) {
        anim.intro = Math.min(1, anim.intro + Math.max(0.016, dt) * 1.45);
        animating = true;
      }
      if (anim.pulseProgress > 0) {
        anim.pulseProgress += dt * 0.82;
        if (anim.pulseProgress >= 1) anim.pulseProgress = -1;
        animating = true;
      }
    }

    // 既无状态变更也无动画：零重绘，省电并让静置帧率直冲 60fps！
    if (!dirty && !animating) return lastEval;
    dirty = false;

    const introEased = 1 - Math.pow(1 - anim.intro, 3);
    lastEval = evaluate(state);
    const { cx, cy, safeR } = geom();

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    drawAstrolabeBack(cx, cy, safeR, lastEval, introEased);
    for (const r of lastEval.rays) {
      drawRay(cx, cy, safeR, r, lastEval, introEased);
    }
    drawHubAndVector(cx, cy, safeR, lastEval, introEased);

    ctx.font = '700 11px "Space Mono", monospace';
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`SPAN ${Math.round(state.spanDeg)}° · ${lastEval.activeCount}/${state.rayCount} RAYS`, 10, 8);

    ctx.textAlign = "right";
    ctx.fillStyle = lastEval.isOk ? PALETTE.ok : PALETTE.warn;
    ctx.fillText(lastEval.tag, w - 10, 8);

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = '400 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = PALETTE.inkMuted;
    const tip = w < 380
      ? "左右横拖展开折扇 · 点射线换层阶 · 点红核放脉冲"
      : "空场横拖开合 360° 扇面 · 拖单臂调角度 · 点射线换层阶 · 拖红核校圆心";
    ctx.fillText(tip, cx, h - 6);

    ctx.restore();
    return lastEval;
  }

  return {
    render,
    startPulse,
    markDirty,
    getEval: () => lastEval,
  };
}
