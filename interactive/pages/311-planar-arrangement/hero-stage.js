// 311 平面调度 · 主舞台 2D Canvas 渲染与拖拽控制器
// 支持「海报构成」与「电影立面」双壳同构，共享同一 model.js 坐标与透视压平投影，严格保持正圆不压扁。
// 性能策略：开场入场动画与交互变更时按需重画（dirty 标记），静置 0 浪费；合并点阵/网格单次批绘；手机端像素比上限 1.5。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ASPECT,
  FIELD,
  LOGICAL_H,
  LOGICAL_W,
  PALETTE,
  PIECE_DEFS,
  PRESETS,
  clampPiecePos,
  findSnapPosition,
  pieceBounds,
} from "./model.js";

function projectPoint(u, v, z, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = u - 0.5;
  const cy = v - 0.5;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const x3 = cx * cos + z * sin;
  const z3 = -cx * sin + z * cos;
  const camDist = 2.05;
  const scale = camDist / (camDist + z3);
  return {
    x: (0.5 + x3 * scale) * LOGICAL_W,
    y: (0.5 + cy * scale) * LOGICAL_H,
    scale,
  };
}

function unprojectPoint(normX, normY, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const camDist = 2.05;
  const sx = normX - 0.5;
  const sy = normY - 0.5;
  const denom = cos + (sx * sin) / camDist;
  if (Math.abs(denom) < 0.15) return { u: normX, v: normY };
  const uLocal = sx / denom;
  const z3 = -uLocal * sin;
  const scale = camDist / (camDist + z3);
  const vLocal = sy / scale;
  return { u: 0.5 + uLocal, v: 0.5 + vLocal };
}

function drawProjectedRect(ctx, x, y, w, h, z, angleDeg) {
  const p1 = projectPoint(x, y, z, angleDeg);
  const p2 = projectPoint(x + w, y, z, angleDeg);
  const p3 = projectPoint(x + w, y + h, z, angleDeg);
  const p4 = projectPoint(x, y + h, z, angleDeg);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
}

function drawProjectedCircle(ctx, cu, cv, r, z, angleDeg, steps = 32) {
  const rx = r / ASPECT;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const pt = projectPoint(cu + Math.cos(a) * rx, cv + Math.sin(a) * r, z, angleDeg);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();
}

function drawSilhouetteFigure(ctx, cu, cv, hNorm, color, pose, z, angleDeg) {
  const headR = hNorm * 0.15;
  const headCenterV = cv - hNorm * 0.34;
  drawProjectedCircle(ctx, cu, headCenterV, headR, z, angleDeg, 20);
  ctx.fillStyle = color;
  ctx.fill();

  const shW = (hNorm * 0.36) / ASPECT;
  const hemW = (hNorm * (pose === "coat" ? 0.52 : 0.34)) / ASPECT;
  const neckY = headCenterV + headR * 1.05;
  const hemY = cv + hNorm * 0.32;
  const pts = [
    [cu - shW * 0.5, neckY],
    [cu + shW * 0.5, neckY],
    [cu + hemW * 0.5, hemY],
    [cu - hemW * 0.5, hemY],
  ];
  ctx.beginPath();
  pts.forEach(([u, v], idx) => {
    const p = projectPoint(u, v, z, angleDeg);
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();

  const legW = (hNorm * 0.09) / ASPECT;
  const legGap = (hNorm * 0.08) / ASPECT;
  const footY = cv + hNorm * 0.5;
  for (const dir of [-1, 1]) {
    const lx = cu + dir * legGap - legW / 2;
    drawProjectedRect(ctx, lx, hemY - 0.01, legW, footY - hemY + 0.01, z, angleDeg);
    ctx.fill();
  }
}

// 批绘 7×7 点阵：49 颗圆点合并为 1 次 path + 1 次 fill，极大幅度降低慢手机软件渲染开销
function drawDotMatrix(ctx, startU, startV, cols, rows, stepU, stepV, dotR, color, z, angleDeg) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = projectPoint(startU + c * stepU, startV + r * stepV, z, angleDeg);
      const rad = Math.max(1.1, dotR * p.scale);
      ctx.moveTo(p.x + rad, p.y);
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

export function createHeroStage(canvas, { getState, getEval, onPieceMove, onSelectPiece }) {
  const ctx = canvas.getContext("2d");
  let draggingId = null;
  let dragOffset = { du: 0, dv: 0 };
  let hoverId = null;
  let intro = reducedMotion.matches ? 1 : 0;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;
    const maxDpr = window.innerWidth <= 640 ? 1.5 : 2;
    const dpr = pixelRatio(maxDpr);
    const tw = Math.round(rect.width * dpr);
    const th = Math.round(rect.height * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      return true;
    }
    return false;
  }

  function clientToNorm(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function hitTest(clientX, clientY) {
    const st = getState();
    const { x, y } = clientToNorm(clientX, clientY);
    const { u, v } = unprojectPoint(x, y, st.cameraAngle);
    const order = ["warmBar", "accentCircle", "cutoutCircle", "darkBar"];
    for (const id of order) {
      const def = PIECE_DEFS[id];
      const pos = st.pieces[id];
      const pad = 0.025;
      if (def.kind === "circle") {
        const d = Math.hypot((u - pos.u) * ASPECT, v - pos.v);
        if (d <= def.r + pad) return { id, u, v };
      } else {
        const b = pieceBounds(id, pos);
        if (u >= b.left - pad / ASPECT && u <= b.right + pad / ASPECT && v >= b.top - pad && v <= b.bottom + pad) {
          return { id, u, v };
        }
      }
    }
    return null;
  }

  function drawScene(_t, dt, { still }) {
    const resized = resize();
    const animatingIntro = !still && intro < 1;
    if (still && intro < 1) {
      intro = 1;
      dirty = true;
    } else if (animatingIntro) {
      intro = Math.min(1, intro + (dt || 0.016) * 1.45);
      dirty = true;
    }
    if (!dirty && !resized) return;
    dirty = false;

    const ease = 1 - (1 - intro) ** 3;
    const st = getState();
    const ev = getEval();
    const angle = st.cameraAngle;
    const isCinema = st.mode === "cinema";

    const scaleX = canvas.width / LOGICAL_W;
    const scaleY = canvas.height / LOGICAL_H;
    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 1) 暖亚麻纸底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // 合并背景建筑测绘网格为单次 stroke
    ctx.strokeStyle = "rgba(15, 31, 24, 0.065)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const u = i / 8;
      const pTop = projectPoint(u, 0.04, 0.02, angle);
      const pBot = projectPoint(u, 0.96, 0.02, angle);
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pBot.x, pBot.y);
    }
    for (let j = 1; j < 5; j++) {
      const v = j / 5;
      const pL = projectPoint(0.03, v, 0.02, angle);
      const pR = projectPoint(0.97, v, 0.02, angle);
      ctx.moveTo(pL.x, pL.y);
      ctx.lineTo(pR.x, pR.y);
    }
    ctx.stroke();

    // 斜角透视收束提示线
    if (Math.abs(angle) > 2) {
      ctx.save();
      ctx.strokeStyle = "rgba(184, 59, 30, 0.34)";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      const topL = projectPoint(0.05, FIELD.y, 0, angle);
      const topR = projectPoint(0.95, FIELD.y, 0, angle);
      const botL = projectPoint(0.05, FIELD.y + FIELD.h, 0, angle);
      const botR = projectPoint(0.95, FIELD.y + FIELD.h, 0, angle);
      ctx.beginPath();
      ctx.moveTo(topL.x, topL.y);
      ctx.lineTo(topR.x, topR.y);
      ctx.moveTo(botL.x, botL.y);
      ctx.lineTo(botR.x, botR.y);
      ctx.stroke();

      ctx.strokeStyle = "rgba(30, 59, 47, 0.22)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(24, FIELD.y * LOGICAL_H);
      ctx.lineTo(LOGICAL_W - 24, FIELD.y * LOGICAL_H);
      ctx.stroke();
      ctx.restore();
    }

    // 2) 伴生原海报笔触
    const slideIn = (1 - ease) * 0.04;
    if (!isCinema) {
      drawDotMatrix(ctx, 0.095 - slideIn, 0.595, 7, 7, 0.022, 0.036, 1.9, PALETTE.pine, 0.01, angle);
      drawProjectedRect(ctx, 0.725, 0.802, 0.175, 0.036, 0.005, angle);
      ctx.fillStyle = PALETTE.pine;
      ctx.fill();
    } else {
      drawProjectedRect(ctx, 0.04, 0.84, 0.92, 0.024, 0.005, angle);
      ctx.fillStyle = "rgba(30, 59, 47, 0.18)";
      ctx.fill();
      drawProjectedRect(ctx, 0.04, 0.84, 0.92, 0.005, 0.004, angle);
      ctx.fillStyle = PALETTE.pine;
      ctx.fill();
    }

    // 3) 固定深松绿主场域
    drawProjectedRect(ctx, FIELD.x, FIELD.y, FIELD.w, FIELD.h, 0.0, angle);
    ctx.fillStyle = PALETTE.pine;
    ctx.fill();

    if (isCinema) {
      ctx.strokeStyle = "rgba(229, 221, 210, 0.20)";
      ctx.lineWidth = 1.2;
      drawProjectedRect(ctx, FIELD.x + 0.02, FIELD.y + 0.03, FIELD.w - 0.04, FIELD.h - 0.06, -0.002, angle);
      ctx.stroke();
      const wl = projectPoint(FIELD.x, FIELD.y + FIELD.h * 0.68, -0.002, angle);
      const wr = projectPoint(FIELD.x + FIELD.w, FIELD.y + FIELD.h * 0.68, -0.002, angle);
      ctx.beginPath();
      ctx.moveTo(wl.x, wl.y);
      ctx.lineTo(wr.x, wr.y);
      ctx.stroke();
    } else {
      drawProjectedRect(ctx, 0.215, 0.51, 0.195, 0.125, -0.004, angle);
      ctx.fillStyle = PALETTE.paper;
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      drawProjectedRect(ctx, 0.615, 0.105, 0.19, 0.205, -0.004, angle);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }

    // 4) 通关叠看原海报轮廓
    if (st.showRefOverlay && ev.allOk) {
      ctx.save();
      ctx.strokeStyle = "rgba(217, 92, 61, 0.55)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      const ref = PRESETS.reference.pieces;
      drawProjectedCircle(ctx, ref.accentCircle.u, ref.accentCircle.v, PIECE_DEFS.accentCircle.r, -0.01, angle);
      ctx.stroke();
      drawProjectedCircle(ctx, ref.cutoutCircle.u, ref.cutoutCircle.v, PIECE_DEFS.cutoutCircle.r, -0.01, angle);
      ctx.stroke();
      const rwb = pieceBounds("warmBar", ref.warmBar);
      drawProjectedRect(ctx, rwb.left, rwb.top, rwb.w, rwb.h, -0.01, angle);
      ctx.stroke();
      const rdb = pieceBounds("darkBar", ref.darkBar);
      drawProjectedRect(ctx, rdb.left, rdb.top, rdb.w, rdb.h, -0.01, angle);
      ctx.stroke();
      ctx.restore();
    }

    // 5) 四个可拖动构件
    const drawOrder = ["darkBar", "cutoutCircle", "accentCircle", "warmBar"];
    for (const id of drawOrder) {
      const def = PIECE_DEFS[id];
      const raw = st.pieces[id];
      const offsetSign = id === "warmBar" ? -1 : 1;
      const u = raw.u + (1 - ease) * 0.03 * offsetSign;
      const v = raw.v + (1 - ease) * 0.018;
      const b = pieceBounds(id, { u, v });
      const isSelected = st.selectedId === id;
      const isHover = hoverId === id || draggingId === id;
      const zLayer = id === "warmBar" ? -0.018 : id === "accentCircle" ? -0.014 : -0.008;

      if (!isCinema) {
        if (def.kind === "circle") {
          drawProjectedCircle(ctx, u, v, def.r, zLayer, angle);
          ctx.fillStyle = def.color;
          ctx.fill();
          if (id === "cutoutCircle") {
            ctx.strokeStyle = ev.cutoutInside < 0.72 ? PALETTE.warn : "rgba(15, 31, 24, 0.22)";
            ctx.lineWidth = ev.cutoutInside < 0.72 ? 1.8 : 1;
            if (ev.cutoutInside < 0.72) ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else {
          drawProjectedRect(ctx, b.left, b.top, b.w, b.h, zLayer, angle);
          ctx.fillStyle = def.color;
          ctx.fill();
        }
      } else {
        if (id === "cutoutCircle") {
          drawProjectedCircle(ctx, u, v, def.r, zLayer, angle);
          ctx.fillStyle = PALETTE.paperLight;
          ctx.fill();
          ctx.strokeStyle = PALETTE.pineDark;
          ctx.lineWidth = 2;
          ctx.stroke();
          const rx = def.r / ASPECT;
          const pL = projectPoint(u - rx, v, zLayer, angle);
          const pR = projectPoint(u + rx, v, zLayer, angle);
          const pT = projectPoint(u, v - def.r, zLayer, angle);
          const pB = projectPoint(u, v + def.r, zLayer, angle);
          ctx.strokeStyle = "rgba(30, 59, 47, 0.35)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(pL.x, pL.y);
          ctx.lineTo(pR.x, pR.y);
          ctx.moveTo(pT.x, pT.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.stroke();
        } else if (id === "accentCircle") {
          drawProjectedCircle(ctx, u, v, def.r, zLayer, angle);
          ctx.fillStyle = "rgba(217, 92, 61, 0.22)";
          ctx.fill();
          ctx.strokeStyle = PALETTE.terracotta;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          drawSilhouetteFigure(ctx, u, v + 0.005, def.r * 1.65, PALETTE.terracotta, "coat", zLayer - 0.002, angle);
        } else if (id === "warmBar") {
          drawProjectedRect(ctx, b.left, b.top, b.w, b.h, zLayer, angle);
          ctx.fillStyle = PALETTE.terracotta;
          ctx.fill();
          drawProjectedRect(ctx, b.left + 0.008, b.top + 0.009, b.w - 0.016, b.h - 0.018, zLayer - 0.001, angle);
          ctx.strokeStyle = "rgba(243, 238, 229, 0.55)";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (id === "darkBar") {
          drawProjectedRect(ctx, b.left, b.top, b.w * 0.55, b.h, zLayer, angle);
          ctx.fillStyle = PALETTE.pine;
          ctx.fill();
          drawSilhouetteFigure(ctx, u + 0.014, v + 0.03, b.h * 0.78, PALETTE.ink, "slim", zLayer - 0.002, angle);
        }
      }

      if (isSelected || isHover) {
        const padX = 0.010;
        const padY = 0.016;
        const c1 = projectPoint(b.left - padX, b.top - padY, zLayer - 0.004, angle);
        const c2 = projectPoint(b.right + padX, b.top - padY, zLayer - 0.004, angle);
        const c3 = projectPoint(b.right + padX, b.bottom + padY, zLayer - 0.004, angle);
        const c4 = projectPoint(b.left - padX, b.bottom + padY, zLayer - 0.004, angle);

        ctx.save();
        ctx.strokeStyle = isSelected ? PALETTE.ink : "rgba(15, 31, 24, 0.45)";
        ctx.lineWidth = isSelected ? 1.8 : 1.2;
        if (!isSelected) ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.lineTo(c4.x, c4.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        const topMid = projectPoint(u, b.top - padY - 0.012, zLayer - 0.004, angle);
        const label = isCinema ? def.cinemaLabel : def.label;
        ctx.save();
        ctx.font = '600 11px "Noto Sans SC", sans-serif';
        const tw = ctx.measureText(label).width + 14;
        const bx = Math.max(8, Math.min(LOGICAL_W - tw - 8, topMid.x - tw / 2));
        const by = Math.max(8, topMid.y - 20);
        ctx.fillStyle = PALETTE.ink;
        ctx.fillRect(bx, by, tw, 18);
        ctx.fillStyle = PALETTE.paperLight;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx + tw / 2, by + 9.5);
        ctx.restore();
      }
    }

    // 6) 合并共享对齐虚线批绘
    if (ev.planeOk && ev.alignLines.length) {
      ctx.save();
      ctx.strokeStyle = "rgba(30, 91, 67, 0.72)";
      ctx.fillStyle = PALETTE.ok;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (const ln of ev.alignLines.slice(0, 5)) {
        if (ln.axis === "x") {
          const x = ln.val * LOGICAL_W;
          ctx.moveTo(x, 22);
          ctx.lineTo(x, LOGICAL_H - 22);
        } else {
          const y = ln.val * LOGICAL_H;
          ctx.moveTo(24, y);
          ctx.lineTo(LOGICAL_W - 24, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      for (const ln of ev.alignLines.slice(0, 5)) {
        const dx = ln.axis === "x" ? ln.val * LOGICAL_W : 24;
        const dy = ln.axis === "x" ? 22 : ln.val * LOGICAL_H;
        ctx.moveTo(dx + 3.2, dy);
        ctx.arc(dx, dy, 3.2, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }

    // 7) 阿恩海姆视觉重心标记
    const idealX = 0.5 * LOGICAL_W;
    const cogX = ev.cx * LOGICAL_W;
    const cogY = ev.cy * LOGICAL_H;
    ctx.save();
    ctx.strokeStyle = "rgba(15, 31, 24, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(idealX, LOGICAL_H - 26);
    ctx.lineTo(idealX, LOGICAL_H - 8);
    ctx.stroke();

    const bandW = 0.055 * 2 * LOGICAL_W;
    ctx.fillStyle = ev.balanceOk ? "rgba(30, 91, 67, 0.2)" : "rgba(184, 59, 30, 0.14)";
    ctx.fillRect(idealX - bandW / 2, LOGICAL_H - 18, bandW, 6);

    ctx.strokeStyle = ev.balanceOk ? PALETTE.ok : PALETTE.warn;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(cogX, cogY);
    ctx.lineTo(cogX, LOGICAL_H - 16);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = ev.balanceOk ? PALETTE.ok : PALETTE.warn;
    ctx.beginPath();
    ctx.moveTo(cogX, cogY - 5.5);
    ctx.lineTo(cogX + 5.5, cogY);
    ctx.lineTo(cogX, cogY + 5.5);
    ctx.lineTo(cogX - 5.5, cogY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.paperLight;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = ev.balanceOk ? PALETTE.ok : PALETTE.warn;
    ctx.beginPath();
    ctx.moveTo(cogX, LOGICAL_H - 17);
    ctx.lineTo(cogX - 5, LOGICAL_H - 8);
    ctx.lineTo(cogX + 5, LOGICAL_H - 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 8) 左上角轻量机位状态角标
    ctx.save();
    const badge = `${isCinema ? "电影立面" : "海报构成"} · 机位 ${angle > 0 ? "+" : ""}${angle.toFixed(0)}°`;
    ctx.font = '600 11px "Space Grotesk", "Noto Sans SC", sans-serif';
    const bw = ctx.measureText(badge).width + 18;
    ctx.fillStyle = ev.planeOk ? PALETTE.pine : PALETTE.warn;
    ctx.fillRect(14, 12, bw, 22);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(badge, 23, 23.5);
    ctx.restore();

    ctx.restore();
  }

  const ctrl = loop(canvas, drawScene);

  // 正常模式下交由下一帧 rAF 合并绘制（防止慢 CPU 一帧内多次 touchmove 重复同步重画）
  const requestRedraw = () => {
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  };
  // 首帧确保立即可见（适配静态快照）
  ctrl.draw();

  canvas.addEventListener("pointerdown", (e) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) return;
    e.preventDefault();
    draggingId = hit.id;
    const pos = getState().pieces[hit.id];
    dragOffset = { du: pos.u - hit.u, dv: pos.v - hit.v };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    onSelectPiece(hit.id);
    requestRedraw();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (draggingId) {
      e.preventDefault();
      const st = getState();
      const { x, y } = clientToNorm(e.clientX, e.clientY);
      const { u, v } = unprojectPoint(x, y, st.cameraAngle);
      const rawU = u + dragOffset.du;
      const rawV = v + dragOffset.dv;
      const snapped = e.shiftKey ? clampPiecePos(draggingId, rawU, rawV) : findSnapPosition(draggingId, rawU, rawV, st.pieces);
      onPieceMove(draggingId, snapped.u, snapped.v);
      requestRedraw();
      return;
    }
    if (e.pointerType === "mouse") {
      const hit = hitTest(e.clientX, e.clientY);
      const nextHover = hit ? hit.id : null;
      if (nextHover !== hoverId) {
        hoverId = nextHover;
        canvas.style.cursor = hoverId ? "grab" : "default";
        requestRedraw();
      }
    }
  });

  const endDrag = (e) => {
    if (!draggingId) return;
    draggingId = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    canvas.style.cursor = hoverId ? "grab" : "default";
    requestRedraw();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  window.addEventListener("resize", requestRedraw);

  return {
    draw: requestRedraw,
  };
}
