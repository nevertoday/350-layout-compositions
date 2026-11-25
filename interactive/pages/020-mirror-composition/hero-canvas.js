// 020 镜像构图 · 精确 4:3 等比逻辑画布渲染器（开场落镜工作台 + 第 07 节盲测微缩画布共用同一绘制管线）

import {
  LOGICAL_W,
  LOGICAL_H,
  FRAME_PAD,
  PALETTE,
  SEAM_RULE,
  evaluateScene,
  getCounterpartBox,
} from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

// 追踪单一元素外廓路径（供实心填充与精确几何交集裁剪复用，保证撞镜斜纹绝不悬空外溢）
function traceElementPath(ctx, el) {
  ctx.beginPath();
  if (el.shape === "circleDot") {
    ctx.arc(el.cx, el.cy, el.r, 0, Math.PI * 2);
    ctx.moveTo(el.dotX + el.dotR, el.dotY);
    ctx.arc(el.dotX, el.dotY, el.dotR, 0, Math.PI * 2);
  } else if (el.shape === "quarterLeft") {
    ctx.moveTo(el.cornerX, el.cornerY);
    ctx.lineTo(el.cornerX - el.r, el.cornerY);
    ctx.arc(el.cornerX, el.cornerY, el.r, Math.PI, Math.PI * 1.5, false);
    ctx.closePath();
  } else if (el.shape === "bevelSemi") {
    const r = el.x1 - el.peakX;
    ctx.moveTo(el.x0, el.y1);
    ctx.lineTo(el.peakX, el.y0);
    ctx.arc(el.peakX, el.y1, r, -Math.PI / 2, 0, false);
    ctx.closePath();
  } else if (el.shape === "waterPavilion") {
    const { x0, y0, x1, y1 } = el;
    const domeCx = x0 + 146;
    const domeBase = y1 - 68;
    ctx.rect(x0, y1 - 24, x1 - x0, 24);
    ctx.moveTo(x0 + 18, y1 - 24);
    ctx.lineTo(x0 + 18, y0 + 52);
    ctx.lineTo(x0 + 38, y0);
    ctx.lineTo(x0 + 58, y0 + 52);
    ctx.lineTo(x0 + 58, y1 - 24);
    ctx.closePath();
    ctx.rect(x0 + 74, domeBase, 144, 44);
    ctx.moveTo(domeCx - 58, domeBase);
    ctx.arc(domeCx, domeBase, 58, Math.PI, 0, false);
    ctx.closePath();
    ctx.moveTo(domeCx - 5, domeBase - 56);
    ctx.lineTo(domeCx, domeBase - 78);
    ctx.lineTo(domeCx + 5, domeBase - 56);
    ctx.closePath();
  } else if (el.shape === "stepWing") {
    const { x0, y0, x1, y1 } = el;
    const w = x1 - x0;
    const h = y1 - y0;
    ctx.moveTo(x0, y1);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + w * 0.42, y0);
    ctx.lineTo(x0 + w * 0.42, y0 + h * 0.34);
    ctx.lineTo(x0 + w * 0.74, y0 + h * 0.34);
    ctx.lineTo(x0 + w * 0.74, y0 + h * 0.66);
    ctx.lineTo(x1, y0 + h * 0.66);
    ctx.lineTo(x1, y1);
    ctx.closePath();
  } else if (el.shape === "orb") {
    ctx.arc(el.cx, el.cy, el.r, 0, Math.PI * 2);
  } else if (el.shape === "wingBlade") {
    const { x0, y0, x1, y1 } = el;
    ctx.moveTo(x0, y0 + 22);
    ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.54, y0 - 8, x1, y0 + 14);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 - 54, y1);
    ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.46, y0 + 62, x0 + 24, y0 + 62);
    ctx.closePath();
  } else if (el.shape === "notchCore") {
    const { x0, y0, x1, y1 } = el;
    ctx.moveTo(x0 + 38, y0);
    ctx.lineTo(x1, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x0, y1);
    ctx.lineTo(x0, y0 + 48);
    ctx.lineTo(x0 + 38, y0 + 48);
    ctx.closePath();
  } else if (el.shape === "bevelFoot") {
    const { x0, y0, x1, y1 } = el;
    ctx.moveTo(x0 + 48, y0);
    ctx.lineTo(x1, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x0, y1);
    ctx.closePath();
  }
}

// 绘制单个逻辑元素（不含镜像变换，调用方决定正绘 / 镜像反射 / 平移复制）
function drawElementShape(ctx, el, { isCounterpart = false, dimmed = false, waterTint = false } = {}) {
  ctx.save();
  if (dimmed) ctx.globalAlpha *= 0.24;
  if (waterTint && isCounterpart) ctx.globalAlpha *= 0.62;

  ctx.fillStyle = el.color;
  traceElementPath(ctx, el);
  ctx.fill();

  if (el.shape === "waterPavilion") {
    const domeCx = el.x0 + 146;
    ctx.fillStyle = PALETTE.bg;
    ctx.beginPath();
    ctx.arc(domeCx, el.y1 - 24, 18, Math.PI, 0, false);
    ctx.fill();
  }

  ctx.restore();
}

// 绘制文字/方向签（单独处理，以便真镜像时用 ctx.scale(-1, 1) 或 (1, -1) 真实映出反字！）
function drawTextTag(ctx, box, text, { isMirroredBad = false, isUprightOk = false, isSource = false } = {}) {
  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;

  ctx.save();
  ctx.fillStyle = isMirroredBad ? "rgba(191, 44, 108, 0.24)" : isUprightOk ? "rgba(226, 226, 226, 0.1)" : "#1D1D20";
  ctx.strokeStyle = isMirroredBad ? "#FF70AB" : isUprightOk ? PALETTE.silver : PALETTE.magentaBright;
  ctx.lineWidth = isMirroredBad ? 2 : 1.5;
  if (isMirroredBad) ctx.setLineDash([5, 4]);
  ctx.fillRect(box.x0, box.y0, w, h);
  ctx.strokeRect(box.x0, box.y0, w, h);
  ctx.setLineDash([]);

  ctx.fillStyle = isMirroredBad ? "#FF92BE" : PALETTE.silver;
  ctx.font = `700 18px "Syne", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 1);

  // 源标签右上角极小角标提示可点切状态
  if (isSource && !isUprightOk) {
    ctx.fillStyle = PALETTE.magentaBright;
    ctx.fillRect(box.x1 - 7, box.y0, 7, 7);
  }
  ctx.restore();
}

// 获取文字签在「保持正向」时的居中/安全包围盒
export function getUprightTextBox(el, axis) {
  const a = el.uprightAnchor;
  const cx = a.cx === "axis" ? Math.max(88, Math.min(LOGICAL_W - 88, axis)) : a.cx;
  const cy = a.cy;
  return {
    x0: cx - a.w / 2,
    y0: cy - a.h / 2,
    x1: cx + a.w / 2,
    y1: cy + a.h / 2,
  };
}

// 绘制精确几何交集碰撞斜纹（双重 path clip 严格锁死在原形 ∩ 镜像真实重叠区，绝不悬空外溢）
function drawIntersectionHatch(ctx, el, axis, isV, color = "#FF6BA6") {
  const b = el.bbox;
  const ov = isV ? b.x1 - axis : b.y1 - axis;
  if (ov <= 0.5) return;
  const rx = isV ? axis - ov : b.x0;
  const ry = isV ? b.y0 : axis - ov;
  const rw = isV ? ov * 2 : b.x1 - b.x0;
  const rh = isV ? b.y1 - b.y0 : ov * 2;

  ctx.save();
  // 第一重裁剪：原图形轮廓
  traceElementPath(ctx, el);
  ctx.clip();

  // 第二重裁剪：镜像后轮廓（在镜像坐标系中追踪，再还原坐标系绘统一 45° 斜线）
  ctx.save();
  if (isV) {
    ctx.translate(2 * axis, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, 2 * axis);
    ctx.scale(1, -1);
  }
  traceElementPath(ctx, el);
  ctx.restore();
  ctx.clip();

  ctx.fillStyle = "rgba(191, 44, 108, 0.34)";
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;
  const step = 9;
  for (let d = -rh; d < rw + rh; d += step) {
    ctx.beginPath();
    ctx.moveTo(rx + d, ry);
    ctx.lineTo(rx + d - rh, ry + rh);
    ctx.stroke();
  }
  ctx.restore();
}

// 在平移复制模式下，于手性图形上画出极克制的同向箭头提示，一眼看穿未翻转
function drawCopyDirectionCue(ctx, box, isV, color = PALETTE.magentaBright) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  if (isV) {
    const xL = cx - 18;
    const xR = cx + 18;
    ctx.beginPath();
    ctx.moveTo(xL, cy);
    ctx.lineTo(xR, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xR, cy);
    ctx.lineTo(xR - 8, cy - 5);
    ctx.lineTo(xR - 8, cy + 5);
    ctx.closePath();
    ctx.fill();
  } else {
    const yT = cy - 16;
    const yB = cy + 16;
    ctx.beginPath();
    ctx.moveTo(cx, yB);
    ctx.lineTo(cx, yT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, yT);
    ctx.lineTo(cx - 5, yT + 8);
    ctx.lineTo(cx + 5, yT + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 绘制完整 4:3 逻辑镜像场景（支持主舞台 interactive 模式与第 07 节微缩 mini 模式）
export function renderMirrorScene(canvas, state, options = {}) {
  const {
    customSpec = null,
    mini = false,
    hoverId = null,
    selectedId = null,
    introProgress = 1,
    arcProgress = 0,
    revealMetrics = false,
  } = options;

  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(120, Math.round(rect.width));
  const cssH = Math.max(90, Math.round(rect.height));
  const dpr = pixelRatio(2);

  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  const ctx = canvas.getContext("2d");
  const ev = evaluateScene(state, customSpec);
  const { spec, axis, mode, copyShift } = ev;
  const isV = spec.orientation === "vertical";

  // 严格等比缩放至 800×600（绝不拉扁圆！）
  const scale = Math.min(cssW / LOGICAL_W, cssH / LOGICAL_H);
  const offX = (cssW - LOGICAL_W * scale) / 2;
  const offY = (cssH - LOGICAL_H * scale) / 2;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.translate(offX, offY);
  ctx.scale(scale, scale);

  // 1. 极克制的暗房光学微标尺底（非mini模式）
  if (!mini) {
    ctx.save();
    // 水平水景在镜轴下方铺极浅暗灰水幕区分上下两界
    if (!isV) {
      const grad = ctx.createLinearGradient(0, axis, 0, LOGICAL_H);
      grad.addColorStop(0, "rgba(216, 69, 130, 0.08)");
      grad.addColorStop(0.2, "rgba(255, 255, 255, 0.03)");
      grad.addColorStop(1, "rgba(13, 13, 13, 0.25)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, axis, LOGICAL_W, LOGICAL_H - axis);
    }

    // 光学标尺轨（竖轴放顶沿，横轴放左沿）
    ctx.strokeStyle = "rgba(226, 226, 226, 0.16)";
    ctx.lineWidth = 1;
    if (isV) {
      ctx.beginPath();
      ctx.moveTo(FRAME_PAD, 42);
      ctx.lineTo(LOGICAL_W - FRAME_PAD, 42);
      ctx.stroke();
      for (let pct = 10; pct <= 90; pct += 5) {
        const tx = (pct / 100) * LOGICAL_W;
        const major = pct % 10 === 0;
        ctx.beginPath();
        ctx.moveTo(tx, 42);
        ctx.lineTo(tx, major ? 32 : 37);
        ctx.stroke();
      }
      // 经验舒服带微弱区间提示（从当前标本主图形内缘实时推算）
      const innerRef = Math.max(...spec.elements.filter((e) => e.kind === "graphic").map((e) => e.bbox.x1));
      const z0 = innerRef + (SEAM_RULE.minGood * spec.layerGap) / 2;
      const z1 = innerRef + (SEAM_RULE.maxGood * spec.layerGap) / 2;
      ctx.fillStyle = "rgba(216, 69, 130, 0.28)";
      ctx.fillRect(z0, 39, z1 - z0, 5);
    } else {
      ctx.beginPath();
      ctx.moveTo(42, FRAME_PAD);
      ctx.lineTo(42, LOGICAL_H - FRAME_PAD);
      ctx.stroke();
      for (let pct = 15; pct <= 85; pct += 5) {
        const ty = (pct / 100) * LOGICAL_H;
        const major = pct % 10 === 0;
        ctx.beginPath();
        ctx.moveTo(42, ty);
        ctx.lineTo(major ? 32 : 37, ty);
        ctx.stroke();
      }
      const innerRef = Math.max(...spec.elements.filter((e) => e.kind === "graphic").map((e) => e.bbox.y1));
      const z0 = innerRef + (SEAM_RULE.minGood * spec.layerGap) / 2;
      const z1 = innerRef + (SEAM_RULE.maxGood * spec.layerGap) / 2;
      ctx.fillStyle = "rgba(216, 69, 130, 0.28)";
      ctx.fillRect(39, z0, 5, z1 - z0);
    }
    ctx.restore();
  }

  // 2. 原海报标志性「左右对称外弧 + 底角小圆点」（在呼应成立时平滑收拢合围）
  const arcAlpha = mini ? (ev.allGood && revealMetrics ? 0.55 : 0) : Math.max(0, arcProgress);
  if (spec.id === "poster" && arcAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = arcAlpha * 0.85;
    ctx.strokeStyle = PALETTE.magenta;
    ctx.fillStyle = PALETTE.magenta;
    ctx.lineWidth = 2;
    const spanR = 258;
    const cy = 320;
    // 左外弧
    ctx.beginPath();
    ctx.arc(axis, cy, spanR, Math.PI * 0.82, Math.PI * 1.38, false);
    ctx.stroke();
    // 右外弧（严格关于 axis 镜像）
    ctx.beginPath();
    ctx.arc(axis, cy, spanR, -Math.PI * 0.38, Math.PI * 0.18, false);
    ctx.stroke();
    // 两侧底角小圆点（忠实还原 020 海报）
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(axis + dir * 246, 514, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. 绘制所有元素（源形 + 对偶镜像或平移复制）
  const graphics = spec.elements.filter((e) => e.kind === "graphic");
  const texts = spec.elements.filter((e) => e.kind === "text");

  for (const el of graphics) {
    const isMirrored = !!state.mirrorFlags[el.id];
    // 源图形
    drawElementShape(ctx, el, { isCounterpart: false, dimmed: false });

    // 对偶形
    if (isMirrored) {
      ctx.save();
      if (isV) {
        if (mode === "mirror") {
          ctx.translate(2 * axis, 0);
          ctx.scale(-1, 1);
        } else {
          ctx.translate(copyShift, 0);
        }
      } else {
        if (mode === "mirror") {
          ctx.translate(0, 2 * axis);
          ctx.scale(1, -1);
        } else {
          ctx.translate(0, copyShift);
        }
      }
      drawElementShape(ctx, el, {
        isCounterpart: true,
        waterTint: !isV,
      });
      ctx.restore();

      // 水景水平波纹细线（仅真镜像或水下）
      if (!isV && !mini) {
        ctx.save();
        ctx.strokeStyle = "rgba(13, 13, 13, 0.36)";
        ctx.lineWidth = 2;
        const cb = getCounterpartBox(el, axis, spec.orientation, mode, copyShift);
        for (let wy = Math.max(axis + 12, cb.y0 + 10); wy < Math.min(LOGICAL_H - 12, cb.y1); wy += 16) {
          ctx.beginPath();
          ctx.moveTo(cb.x0 - 6, wy);
          ctx.lineTo(cb.x1 + 6, wy);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (!mini) {
      // 未开启镜像时在对偶位画极淡虚线幽灵轮廓，提醒缺席
      const cb = getCounterpartBox(el, axis, spec.orientation, "mirror", copyShift);
      ctx.save();
      ctx.strokeStyle = "rgba(232, 100, 155, 0.48)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(cb.x0, cb.y0, cb.x1 - cb.x0, cb.y1 - cb.y0);
      ctx.fillStyle = "rgba(232, 100, 155, 0.85)";
      ctx.font = `600 13px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("未镜像", (cb.x0 + cb.x1) / 2, (cb.y0 + cb.y1) / 2);
      ctx.restore();
    }

    // 悬停或选中高亮框（提示可点击切换 参与镜像 / 保持正向）
    if (!mini && (hoverId === el.id || selectedId === el.id)) {
      const b = el.bbox;
      ctx.save();
      ctx.strokeStyle = PALETTE.silver;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(b.x0 - 5, b.y0 - 5, b.x1 - b.x0 + 10, b.y1 - b.y0 + 10);
      ctx.restore();
    }

    // 平移复制模式下的手性破绽同向箭头提示
    if (!mini && mode === "copy" && el.chiral && isMirrored) {
      const cb = getCounterpartBox(el, axis, spec.orientation, "copy", copyShift);
      drawCopyDirectionCue(ctx, el.bbox, isV, "#111111");
      drawCopyDirectionCue(ctx, cb, isV, "#111111");
      ctx.save();
      ctx.strokeStyle = "#FF70AB";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(cb.x0 - 3, cb.y0 - 3, cb.x1 - cb.x0 + 6, cb.y1 - cb.y0 + 6);
      ctx.restore();
    }
  }

  // 4. 撞镜重叠区精确几何交集斜纹警示
  if (mode === "mirror") {
    for (const el of ev.collidingEls) {
      drawIntersectionHatch(ctx, el, axis, isV);
    }
  }

  // 5. 镜像出框裁切线警示
  if (!mini && ev.clippedEls.length) {
    ctx.save();
    ctx.strokeStyle = "#FF6BA6";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    if (isV) {
      ctx.beginPath();
      ctx.moveTo(LOGICAL_W - FRAME_PAD, 52);
      ctx.lineTo(LOGICAL_W - FRAME_PAD, LOGICAL_H - FRAME_PAD);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(52, LOGICAL_H - FRAME_PAD);
      ctx.lineTo(LOGICAL_W - FRAME_PAD, LOGICAL_H - FRAME_PAD);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 6. 绘制文字/方向签（参与镜像时真实翻转渲染出反字！保持正向时独立居中正向排布）
  for (const el of texts) {
    const isMirrored = !!state.mirrorFlags[el.id];
    if (isMirrored) {
      // 源侧文字签
      drawTextTag(ctx, el.bbox, el.text, { isSource: true });
      // 对偶侧反字（真实坐标翻转！）
      ctx.save();
      if (isV) {
        if (mode === "mirror") {
          ctx.translate(2 * axis, 0);
          ctx.scale(-1, 1);
        } else {
          ctx.translate(copyShift, 0);
        }
      } else {
        if (mode === "mirror") {
          ctx.translate(0, 2 * axis);
          ctx.scale(1, -1);
        } else {
          ctx.translate(0, copyShift);
        }
      }
      drawTextTag(ctx, el.bbox, el.text, { isMirroredBad: mode === "mirror" });
      ctx.restore();

      // 反字小标签（保持正向文字，清晰标出「反字」）
      if (!mini && mode === "mirror") {
        const cb = getCounterpartBox(el, axis, spec.orientation, "mirror", copyShift);
        ctx.save();
        ctx.fillStyle = "#BF2C6C";
        const tagW = 74;
        const tagH = 22;
        const tx = Math.min(LOGICAL_W - tagW - 8, Math.max(8, (cb.x0 + cb.x1) / 2 - tagW / 2));
        const ty = Math.max(54, cb.y0 - 26);
        ctx.fillRect(tx, ty, tagW, tagH);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("镜像反字", tx + tagW / 2, ty + tagH / 2 + 0.5);
        ctx.restore();
      }

      if (!mini && (hoverId === el.id || selectedId === el.id)) {
        const b = el.bbox;
        ctx.save();
        ctx.strokeStyle = PALETTE.silver;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(b.x0 - 4, b.y0 - 4, b.x1 - b.x0 + 8, b.y1 - b.y0 + 8);
        ctx.restore();
      }
    } else {
      // 保持正向：独立居中/安全位正向排布
      const ub = getUprightTextBox(el, axis);
      drawTextTag(ctx, ub, el.text, { isUprightOk: true, isSource: !mini });
      if (!mini && (hoverId === el.id || selectedId === el.id)) {
        ctx.save();
        ctx.strokeStyle = PALETTE.magentaBright;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(ub.x0 - 4, ub.y0 - 4, ub.x1 - ub.x0 + 8, ub.y1 - ub.y0 + 8);
        ctx.restore();
      }
    }
  }

  // 7. 轴缝与同侧层间距的直观双标尺（仅在未撞镜且主舞台/揭晓态显示，直接视觉证明「轴缝 / 层间距」）
  if ((!mini && !ev.collidingEls.length && ev.minSignedDist >= 0) || (mini && revealMetrics)) {
    ctx.save();
    ctx.strokeStyle = ev.allGood ? PALETTE.magentaBright : "rgba(232, 100, 155, 0.78)";
    ctx.fillStyle = ev.allGood ? PALETTE.magentaBright : "rgba(232, 100, 155, 0.92)";
    ctx.lineWidth = 1.4;
    if (isV) {
      const innerX = ev.minDistEl.bbox.x1;
      const rightX = axis + (axis - innerX);
      const yMark = mini ? 232 : 228;
      // 轴缝横标尺
      ctx.beginPath();
      ctx.moveTo(innerX, yMark - 5);
      ctx.lineTo(innerX, yMark + 5);
      ctx.moveTo(rightX, yMark - 5);
      ctx.lineTo(rightX, yMark + 5);
      ctx.moveTo(innerX, yMark);
      ctx.lineTo(rightX, yMark);
      ctx.stroke();

      // 同侧层间距竖标尺（读取当前标本精确锚点）
      if (!mini && spec.layerGapAnchor) {
        const a = spec.layerGapAnchor;
        ctx.strokeStyle = "rgba(226, 226, 226, 0.52)";
        ctx.beginPath();
        ctx.moveTo(a.x - 4, a.y0);
        ctx.lineTo(a.x + 4, a.y0);
        ctx.moveTo(a.x - 4, a.y1);
        ctx.lineTo(a.x + 4, a.y1);
        ctx.moveTo(a.x, a.y0);
        ctx.lineTo(a.x, a.y1);
        ctx.stroke();
      }
    } else {
      // 水平水景标本：绘垂直轴缝标尺 + 同侧水平间距标尺
      const innerY = ev.minDistEl.bbox.y1;
      const botY = axis + (axis - innerY);
      const xMark = 186;
      ctx.beginPath();
      ctx.moveTo(xMark - 5, innerY);
      ctx.lineTo(xMark + 5, innerY);
      ctx.moveTo(xMark - 5, botY);
      ctx.lineTo(xMark + 5, botY);
      ctx.moveTo(xMark, innerY);
      ctx.lineTo(xMark, botY);
      ctx.stroke();

      if (!mini && spec.layerGapAnchor) {
        const a = spec.layerGapAnchor;
        ctx.strokeStyle = "rgba(226, 226, 226, 0.52)";
        ctx.beginPath();
        ctx.moveTo(a.x0, a.y - 4);
        ctx.lineTo(a.x0, a.y + 4);
        ctx.moveTo(a.x1, a.y - 4);
        ctx.lineTo(a.x1, a.y + 4);
        ctx.moveTo(a.x0, a.y);
        ctx.lineTo(a.x1, a.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 8. 贯穿镜面虚线轴（开场进场动画沿镜轴平滑垂落）
  ctx.save();
  ctx.strokeStyle = PALETTE.magenta;
  ctx.lineWidth = mini ? 2.4 : 2.6;
  ctx.setLineDash(mini ? [8, 7] : [11, 8]);
  const drawFrac = Math.max(0.15, Math.min(1, introProgress));
  ctx.beginPath();
  if (isV) {
    const startY = mini ? 26 : 56;
    const endY = startY + (LOGICAL_H - 16 - startY) * drawFrac;
    ctx.moveTo(axis, startY);
    ctx.lineTo(axis, endY);
  } else {
    const startX = mini ? 26 : 56;
    const endX = startX + (LOGICAL_W - 18 - startX) * drawFrac;
    ctx.moveTo(startX, axis);
    ctx.lineTo(endX, axis);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 顶部/左侧标志性玫红三角轴尖（mini 模式直接画在 canvas 里；主舞台由真实按钮柄叠放，此处仅绘底座微尖防断层）
  ctx.fillStyle = PALETTE.magenta;
  if (mini) {
    ctx.beginPath();
    ctx.moveTo(axis, 26);
    ctx.lineTo(axis - 8, 12);
    ctx.lineTo(axis + 8, 12);
    ctx.closePath();
    ctx.fill();
  } else if (isV) {
    ctx.beginPath();
    ctx.moveTo(axis, 54);
    ctx.lineTo(axis - 9, 41);
    ctx.lineTo(axis + 9, 41);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(54, axis);
    ctx.lineTo(41, axis - 9);
    ctx.lineTo(41, axis + 9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
  return ev;
}

// 命中检测：将 Canvas 内鼠标/触控点映射到 800×600 逻辑坐标，识别点击了哪个元素或镜轴
export function hitTestMirrorScene(canvas, clientX, clientY, state) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / LOGICAL_W, rect.height / LOGICAL_H);
  const offX = (rect.width - LOGICAL_W * scale) / 2;
  const offY = (rect.height - LOGICAL_H * scale) / 2;
  const lx = (clientX - rect.left - offX) / scale;
  const ly = (clientY - rect.top - offY) / scale;

  const ev = evaluateScene(state);
  const { spec, axis } = ev;
  const isV = spec.orientation === "vertical";

  // 优先检测可点文字签（无论在源位、反字位还是正向居中位）
  for (const el of spec.elements) {
    if (el.kind !== "text") continue;
    const isMirrored = !!state.mirrorFlags[el.id];
    const pad = 8;
    if (!isMirrored) {
      const ub = getUprightTextBox(el, axis);
      if (lx >= ub.x0 - pad && lx <= ub.x1 + pad && ly >= ub.y0 - pad && ly <= ub.y1 + pad) {
        return { type: "element", id: el.id, lx, ly };
      }
    } else {
      const b = el.bbox;
      const cb = getCounterpartBox(el, axis, spec.orientation, state.mode, ev.copyShift);
      if (
        (lx >= b.x0 - pad && lx <= b.x1 + pad && ly >= b.y0 - pad && ly <= b.y1 + pad) ||
        (lx >= cb.x0 - pad && lx <= cb.x1 + pad && ly >= cb.y0 - pad && ly <= cb.y1 + pad)
      ) {
        return { type: "element", id: el.id, lx, ly };
      }
    }
  }

  // 检测是否抓住了镜轴本身（±20 逻辑单位热区）
  const axisDist = isV ? Math.abs(lx - axis) : Math.abs(ly - axis);
  if (axisDist <= 20) {
    return { type: "axis", lx, ly };
  }

  // 检测图形元素点击（源侧）
  for (const el of spec.elements) {
    if (el.kind !== "graphic") continue;
    const b = el.bbox;
    if (lx >= b.x0 - 4 && lx <= b.x1 + 4 && ly >= b.y0 - 4 && ly <= b.y1 + 4) {
      return { type: "element", id: el.id, lx, ly };
    }
  }

  return { type: "empty", lx, ly };
}

export function clientToLogicalAxis(canvas, clientX, clientY, orientation) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / LOGICAL_W, rect.height / LOGICAL_H);
  const offX = (rect.width - LOGICAL_W * scale) / 2;
  const offY = (rect.height - LOGICAL_H * scale) / 2;
  if (orientation === "vertical") {
    return (clientX - rect.left - offX) / scale;
  }
  return (clientY - rect.top - offY) / scale;
}
