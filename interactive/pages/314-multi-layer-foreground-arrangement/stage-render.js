// 314 多层前景调度 — 高精建筑级 2D Canvas 渲染引擎（主角多平面剧场、侧剖面监视器、02/03/04 节教学画布）

import {
  PALETTE,
  PLANES,
  PALM_FRONDS,
  FOCUS_MODES,
  parallaxShift,
  layerBlurPx,
  wallTopYAt,
  getArchGeom,
  getSubjectGeom,
  getPalmAnchor,
  evaluateState,
  clamp,
} from "./model.js";

// 工具：设置 DPR 自适应画布尺寸
export function syncCanvas(canvas, dpr) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// 绘制优雅舒展的棕榈羽状叶丛（轮廓覆盖与 model.js 点采样几何 100% 对齐，叶尖弧度更接近原海报植物质感）
function drawPalmCluster(ctx, w, h, anchor, aspect, fill, alpha = 1) {
  const ax = anchor.x * w;
  const ay = anchor.y * h;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  for (let i = 0; i < PALM_FRONDS.length; i++) {
    const f = PALM_FRONDS[i];
    const ca = Math.cos(f.angle);
    const sa = Math.sin(f.angle);
    const steps = 18;
    const leftPts = [];
    const rightPts = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const u = t * f.len;
      const bend = f.curve * t * t * f.len * 3.8;
      // 细长优雅的植物刀叶弧形（中段舒展、末端微弯尖收）
      const taper = Math.sin(Math.PI * Math.pow(t, 0.65)) * (1 - 0.28 * t);
      const halfW = f.width * 0.78 * taper;
      const toXY = (v) => {
        const dxNorm = (u * ca - v * sa) / aspect;
        const dyNorm = u * sa + v * ca;
        return [ax + dxNorm * w, ay + dyNorm * h];
      };
      leftPts.push(toXY(bend - halfW));
      rightPts.push(toXY(bend + halfW));
    }
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    for (let s = 0; s < leftPts.length; s++) ctx.lineTo(leftPts[s][0], leftPts[s][1]);
    for (let s = rightPts.length - 1; s >= 0; s--) ctx.lineTo(rightPts[s][0], rightPts[s][1]);
    ctx.closePath();
    ctx.fill();
  }
  // 细雅叶柄束
  ctx.beginPath();
  ctx.ellipse(ax, ay, h * 0.032, h * 0.022, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 丝滑环形多点柔焦（8 方向微环散焦，彻底告别重影阶梯感，同时在软件渲染下仍保持 60fps）
function withSoftFocus(ctx, blurPx, drawFn) {
  if (blurPx < 0.45) {
    drawFn(1);
    return;
  }
  const r = blurPx * 0.62;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0.707, 0.707],
    [-0.707, 0.707],
    [0.707, -0.707],
    [-0.707, -0.707],
  ];
  ctx.save();
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < dirs.length; i++) {
    ctx.save();
    ctx.translate(dirs[i][0] * r, dirs[i][1] * r);
    drawFn(0.14);
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = blurPx > 2.5 ? 0.56 : 0.74;
  drawFn(blurPx > 2.5 ? 0.56 : 0.74);
  ctx.restore();
}

// 绘制 L3 陶红拱门（完整还原 314 原海报 3D 侧厚、拱顶内阴影与右侧砂褐台阶+龙舌兰叶）
function drawArchAndSteps(ctx, w, h, state, arch, aspect, sceneMode) {
  const left = arch.left * w;
  const right = arch.right * w;
  const top = arch.top * h;
  const bottom = arch.bottom * h;
  const cx = arch.cx * w;
  const openLeft = arch.openLeft * w;
  const openRight = arch.openRight * w;
  const springY = arch.openSpringY * h;
  const rx = arch.openRadius * w;
  const ry = arch.openRadius * 1.15 * h;
  const bevelW = w * 0.019;

  // 右侧附属砂褐台阶 + 深绿龙舌兰叶（跟随 L3 景片，呼应原海报右侧细节）
  const stepBaseX = right - w * 0.005;
  const stepBaseY = h * 0.66;
  const leafColor = sceneMode === "cinema" ? "#263B32" : PALETTE.agave;
  // 龙舌兰 4 片剑叶
  ctx.save();
  ctx.fillStyle = leafColor;
  const leafSpecs = [
    [-0.18, 0.135, 0.022],
    [0.12, 0.145, 0.024],
    [0.48, 0.135, 0.021],
    [0.82, 0.105, 0.018],
  ];
  for (const [ang, len, wid] of leafSpecs) {
    ctx.save();
    ctx.translate(stepBaseX + w * 0.032, stepBaseY + h * 0.045);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * wid, -h * len * 0.52, 0, -h * len);
    ctx.quadraticCurveTo(w * wid, -h * len * 0.52, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 三级暖砂建筑台阶
  for (let i = 0; i < 3; i++) {
    const sx = stepBaseX + i * w * 0.034;
    const sy = stepBaseY + i * h * 0.056;
    const sw = w * 0.13;
    const sh = h * 0.068;
    ctx.fillStyle = PALETTE.stepTop;
    ctx.fillRect(sx, sy, sw, sh * 0.36);
    ctx.fillStyle = PALETTE.stepFront;
    ctx.fillRect(sx, sy + sh * 0.36, sw, sh * 0.64);
  }

  // 拱门左外侧立体厚度（向后透视微收）
  ctx.fillStyle = sceneMode === "cinema" ? "#7C5248" : PALETTE.archSide;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left - bevelW, top + h * 0.012);
  ctx.lineTo(left - bevelW, bottom);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  ctx.fill();

  // 拱洞内部阴影厚度（右侧暗进深壁）
  ctx.fillStyle = sceneMode === "cinema" ? "#84574D" : PALETTE.archInner;
  ctx.beginPath();
  ctx.moveTo(openRight, bottom);
  ctx.lineTo(openRight, springY);
  ctx.ellipse(cx, springY, rx, ry, 0, 0, Math.PI, true);
  ctx.lineTo(openLeft, bottom);
  ctx.lineTo(openLeft + bevelW * 0.85, bottom);
  ctx.lineTo(openLeft + bevelW * 0.85, springY);
  ctx.ellipse(cx + bevelW * 0.45, springY, rx - bevelW * 0.45, ry - bevelW * 0.35, 0, Math.PI, 0, false);
  ctx.lineTo(openRight, bottom);
  ctx.closePath();
  ctx.fill();

  // 拱门正面实墙（使用 evenodd 路径挖出中央拱洞，保证深处 L4/L5 完整穿透可见！）
  ctx.fillStyle = sceneMode === "cinema" ? "#B87A70" : PALETTE.archFront;
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  // 挖洞（逆时针/evenodd）
  ctx.moveTo(openLeft, bottom);
  ctx.lineTo(openLeft, springY);
  ctx.ellipse(cx, springY, rx, ry, 0, Math.PI, 0, false);
  ctx.lineTo(openRight, bottom);
  ctx.closePath();
  ctx.fill("evenodd");

  // 顶部极细高光棱线
  ctx.strokeStyle = "rgba(255, 246, 236, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top + 0.5);
  ctx.lineTo(right, top + 0.5);
  ctx.stroke();
}

// 绘制 L4 阶台与焦点主体（原海报陶红球体 / 片场无五官剪影人物）
function drawFocalSubject(ctx, w, h, state, sub, sceneMode) {
  const sx = sub.cx * w;
  const sy = sub.cy * h;
  const r = sub.r * h;
  const pedTop = sub.pedestalTop * h;

  // 阶梯底座（原海报浅米色 3 级阶台）
  const pW1 = r * 2.35;
  const pW2 = r * 3.1;
  const pW3 = r * 3.9;
  const stepH = h * 0.044;
  ctx.fillStyle = PALETTE.pedestalSide;
  ctx.fillRect(sx - pW1 * 0.5 - r * 0.25, pedTop + 3, r * 0.25, stepH * 3.8);
  ctx.fillStyle = PALETTE.pedestalLight;
  ctx.fillRect(sx - pW1 * 0.5, pedTop, pW1, stepH * 1.15);
  ctx.fillStyle = PALETTE.pedestalMid;
  ctx.fillRect(sx - pW2 * 0.5, pedTop + stepH, pW2, stepH * 1.25);
  ctx.fillStyle = PALETTE.pedestalLight;
  ctx.fillRect(sx - pW3 * 0.5, pedTop + stepH * 2.1, pW3, stepH * 2.2);

  if (sceneMode === "cinema") {
    // 电影走廊模式：背光极简人物剪影（严守零五官规矩：仅侧/正轮廓剪影 + 暖光肩缘）
    const figH = r * 2.25;
    const headR = r * 0.34;
    const footY = pedTop + 2;
    const headY = footY - figH + headR;

    // 脚下柔和接地影
    ctx.fillStyle = "rgba(18, 36, 31, 0.22)";
    ctx.beginPath();
    ctx.ellipse(sx, footY, r * 0.72, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 背光暖晕
    const halo = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 1.55);
    halo.addColorStop(0, "rgba(235, 168, 152, 0.45)");
    halo.addColorStop(1, "rgba(235, 168, 152, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 1.55, 0, Math.PI * 2);
    ctx.fill();

    // 极简长风衣人物剪影（无眼无嘴无面具）
    ctx.fillStyle = "#2A1F1D";
    ctx.beginPath();
    ctx.arc(sx, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx - headR * 1.35, headY + headR * 1.25);
    ctx.quadraticCurveTo(sx, headY + headR * 0.92, sx + headR * 1.35, headY + headR * 1.25);
    ctx.lineTo(sx + headR * 1.65, footY);
    ctx.lineTo(sx - headR * 1.65, footY);
    ctx.closePath();
    ctx.fill();

    // 侧背光陶红轮廓细线
    ctx.strokeStyle = PALETTE.sphereLit;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(sx, headY, headR, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();
  } else {
    // 原海报建筑模式：立体陶红焦点球
    const grad = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, r * 0.1, sx, sy, r * 1.08);
    grad.addColorStop(0, "#E7A59D");
    grad.addColorStop(0.55, PALETTE.sphereBase);
    grad.addColorStop(1, PALETTE.sphereShade);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // 球底柔影
    ctx.fillStyle = "rgba(110, 56, 48, 0.24)";
    ctx.beginPath();
    ctx.ellipse(sx, pedTop + 1, r * 0.68, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 绘制 L2 深松阶墙（四级建筑折阶 + 左上微弱建筑折面线）
function drawSteppedWall(ctx, w, h, state) {
  ctx.beginPath();
  const samples = 64;
  ctx.moveTo(0, h);
  for (let i = 0; i <= samples; i++) {
    const nx = i / samples;
    const ny = wallTopYAt(nx, state.wallX, state.wallY, state.camX);
    ctx.lineTo(nx * w, ny * h);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = PALETTE.pine;
  ctx.fill();

  // 墙面极细建筑顶边反光
  ctx.strokeStyle = "rgba(237, 225, 211, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const nx = i / samples;
    const ny = wallTopYAt(nx, state.wallX, state.wallY, state.camX);
    if (i === 0) ctx.moveTo(nx * w, ny * h + 0.5);
    else ctx.lineTo(nx * w, ny * h + 0.5);
  }
  ctx.stroke();
}

// 绘制单条海报风格折线虚线引注（实心点 + 细虚线 + 小标签）
function drawCallout(ctx, fromX, fromY, midX, midY, toX, toY, label, passed, onDark) {
  const color = passed
    ? onDark
      ? PALETTE.okDark
      : PALETTE.okLight
    : onDark
      ? PALETTE.roseTextDark
      : PALETTE.ink;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  if (midX !== null) ctx.lineTo(midX, midY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 端点小圆点
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(toX, toY, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // 标牌小胶囊（无圆角建筑签）
  ctx.font = '600 11px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(label).width;
  const padX = 7;
  const bh = 20;
  const alignRight = fromX > toX;
  const bx = alignRight ? fromX - 2 : fromX - tw - padX * 2 + 2;
  const by = fromY - bh / 2;
  ctx.fillStyle = onDark ? "rgba(17, 38, 34, 0.9)" : "rgba(246, 239, 230, 0.94)";
  ctx.fillRect(bx, by, tw + padX * 2, bh);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, tw + padX * 2 - 1, bh - 1);
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + padX, fromY + 0.5);
  ctx.restore();
}

// ---------- 主角剧场画布绘制 ----------
export function renderHeroStage(canvas, state, ev, dpr, introP = 1) {
  const { ctx, w, h } = syncCanvas(canvas, dpr);
  const aspect = w / h;

  // 开场渐进（introP 0→1，保证每一帧都清晰好看，不藏主体）
  const ease = 1 - Math.pow(1 - clamp(introP, 0, 1), 3);
  const slideOffset = (1 - ease) * 0.035;

  // 背景宣纸天幕
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  if (state.sceneMode === "cinema") {
    bg.addColorStop(0, "#E7DACA");
    bg.addColorStop(1, "#D6C5B0");
  } else {
    bg.addColorStop(0, PALETTE.paperLight);
    bg.addColorStop(0.55, PALETTE.paper);
    bg.addColorStop(1, "#E5D6C4");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 原海报右上角微妙陶红点阵装饰（5×6）
  ctx.fillStyle = "rgba(212, 152, 141, 0.55)";
  const dotStartX = w - 82;
  const dotStartY = 18;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      ctx.beginPath();
      ctx.arc(dotStartX + c * 11, dotStartY + r * 11, 1.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // L5 远景暖砂日盘（14m，最慢视差）
  const sunShift = parallaxShift(14.0, state.camX);
  const sunX = (0.37 + sunShift) * w;
  const sunY = (0.34 - slideOffset * 0.2) * h;
  const sunR = h * 0.195;
  const sunBlur = layerBlurPx(14.0, state.focus);
  withSoftFocus(ctx, sunBlur, () => {
    ctx.fillStyle = state.sceneMode === "cinema" ? "#DFC8A8" : PALETTE.sunDisc;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
  });

  // L4 阶台与焦点主体（6.6m — 位于拱洞后方）
  const subBlur = layerBlurPx(6.6, state.focus);
  withSoftFocus(ctx, subBlur, () => {
    drawFocalSubject(ctx, w, h, state, ev.sub, state.sceneMode);
  });

  // L3 中层陶红拱门与右阶（4.8m）
  const archBlur = layerBlurPx(4.8, state.focus);
  withSoftFocus(ctx, archBlur, () => {
    drawArchAndSteps(ctx, w, h, state, ev.arch, aspect, state.sceneMode);
  });

  // L2 近前景深松阶墙（2.3m）
  const wallBlur = layerBlurPx(2.3, state.focus);
  withSoftFocus(ctx, wallBlur, () => {
    ctx.save();
    ctx.translate(0, slideOffset * h);
    drawSteppedWall(ctx, w, h, state);
    ctx.restore();
  });

  // L1 极前景棕榈暗叶（1.1m，最快视差）
  const palmBlur = layerBlurPx(1.1, state.focus);
  withSoftFocus(ctx, palmBlur, () => {
    const pAnchor = { x: ev.palm.x, y: ev.palm.y + slideOffset * 1.4 };
    drawPalmCluster(ctx, w, h, pAnchor, aspect, PALETTE.palm, 1);
  });

  // 可选：叠看原海报平衡结构参考线
  if (state.showGuide) {
    ctx.save();
    ctx.strokeStyle = "rgba(232, 166, 156, 0.72)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 4]);
    // 理想拱门中轴与开口轮廓
    const refCx = 0.54 * w;
    ctx.beginPath();
    ctx.moveTo(refCx, 0.14 * h);
    ctx.lineTo(refCx, 0.88 * h);
    ctx.stroke();
    ctx.strokeRect((0.54 - 0.1875) * w, 0.245 * h, 0.375 * w, 0.545 * h);
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 错态视觉警示：若焦点被前景遮挡或门柱切边相切，在画布实位高亮标出问题区域（严防与 L1/L4 锚标重叠）
  if (ev.subjectOcclusionPct >= 6) {
    ctx.save();
    ctx.strokeStyle = PALETTE.warnDark;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(ev.sub.cx * w, ev.sub.cy * h, ev.sub.r * h + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(168, 45, 36, 0.94)";
    const tag = `焦点被遮 ${ev.subjectOcclusionPct}%`;
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(tag).width;
    // 将红签置于焦点右上方净空处，绝不压住 L1 拖拽方标
    const tx = clamp(ev.sub.cx * w + ev.sub.r * h + 14, 12, w - tw - 22);
    const ty = clamp(ev.sub.cy * h - ev.sub.r * h - 22, 12, h - 34);
    ctx.fillRect(tx, ty, tw + 14, 21);
    ctx.fillStyle = "#FFF5EE";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, tx + 7, ty + 10.5);
    ctx.restore();
  } else if (ev.tangentClash || !ev.inOpening) {
    ctx.save();
    const warnX = ev.sub.cx < ev.arch.cx ? ev.arch.openLeft * w : ev.arch.openRight * w;
    ctx.strokeStyle = PALETTE.warnLight;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(warnX, ev.arch.top * h);
    ctx.lineTo(warnX, ev.arch.bottom * h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 选中景片的建筑拖拽锚标（使用建筑方括+层编号）
  const handles = getLayerHandles(state, ev, w, h);
  for (const hd of handles) {
    const active = hd.key === state.activeLayer;
    ctx.save();
    ctx.translate(hd.x, hd.y);
    const size = active ? 13 : 9;
    ctx.fillStyle = active ? PALETTE.roseTextLight : "rgba(18, 36, 31, 0.78)";
    ctx.strokeStyle = PALETTE.creamOnDark;
    ctx.lineWidth = active ? 2 : 1.3;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.fillStyle = "#FFF7F0";
    ctx.font = '700 10px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hd.id, 0, 0.5);
    ctx.restore();
  }

  // 原海报同款四条虚线标注（宽画布 >= 520px 显示完整 4 签，自动避开 L1 棕榈暗叶与遮挡红签）
  if (w >= 480) {
    // 1. 景层递进（左上）
    drawCallout(
      ctx,
      Math.max(92, ev.arch.left * w - 42),
      ev.arch.top * h + 8,
      ev.arch.left * w - 24,
      ev.arch.top * h + 8,
      ev.arch.left * w - 4,
      ev.arch.top * h + 28,
      ev.checks.depth ? "景层递进 ✓" : "景层递进",
      ev.checks.depth,
      false
    );
    // 2. 中层框架（右上角净空，避开前景棕榈叶）
    const frameFromX = clamp(Math.max(ev.arch.right * w + 56, w - 132), 140, w - 74);
    const frameY = ev.arch.top * h + 12;
    drawCallout(
      ctx,
      frameFromX,
      frameY,
      null,
      null,
      ev.arch.right * w - 6,
      frameY,
      ev.checks.overlap ? "中层框架 ✓" : "中层框架",
      ev.checks.overlap,
      false
    );
    // 3. 视觉聚焦（中右净空）
    const focusFromX = clamp(Math.max(ev.arch.right * w + 56, ev.sub.cx * w + 86), 140, w - 74);
    drawCallout(
      ctx,
      focusFromX,
      ev.sub.cy * h + 8,
      null,
      null,
      ev.sub.cx * w + ev.sub.r * h * 0.55,
      ev.sub.cy * h + 8,
      ev.checks.emphasis ? "视觉聚焦 ✓" : "视觉聚焦",
      ev.checks.emphasis,
      false
    );
    // 4. 前景遮挡（左下深松墙上）
    const wyLeft = wallTopYAt(0.14, state.wallX, state.wallY, state.camX) * h;
    const callY = clamp(wyLeft + 46, h * 0.52, h - 26);
    drawCallout(
      ctx,
      96,
      callY,
      118,
      callY,
      142,
      Math.min(h - 14, callY + 28),
      ev.checks.foreground ? "前景遮挡 ✓" : "前景遮挡",
      ev.checks.foreground,
      callY > wyLeft + 10
    );
  }

  // 右下角原海报八道陶红竖条印记（精炼呼应 314 海报右下）
  ctx.save();
  ctx.fillStyle = PALETTE.sphereBase;
  const barW = 3;
  const barGap = 4;
  const barH = 18;
  const startX = w - 14 - 8 * (barW + barGap);
  const startY = h - 14 - barH;
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(startX + i * (barW + barGap), startY, barW, barH);
  }
  ctx.restore();
}

// 计算 4 个可拖景片在画布上的拖拽锚点像素坐标（渲染与指针命中测试 100% 共用）
export function getLayerHandles(state, ev, w, h) {
  const wyWall = wallTopYAt(0.24, state.wallX, state.wallY, state.camX);
  return [
    {
      id: "L1",
      key: "palm",
      x: clamp(ev.palm.x * w, 24, w - 24),
      y: clamp(ev.palm.y * h - h * 0.08, 24, h - 24),
    },
    {
      id: "L2",
      key: "wall",
      x: clamp(0.24 * w, 24, w - 24),
      y: clamp(wyWall * h + 18, 24, h - 24),
    },
    {
      id: "L3",
      key: "arch",
      x: clamp(ev.arch.cx * w, 24, w - 24),
      y: clamp(ev.arch.top * h + 18, 24, h - 24),
    },
    {
      id: "L4",
      key: "subject",
      x: clamp(ev.sub.cx * w, 24, w - 24),
      y: clamp(ev.sub.cy * h + ev.sub.r * h + 16, 24, h - 24),
    },
  ];
}

// ---------- 右侧上方：多平面侧剖面光学监视器 ----------
export function renderCutawayMonitor(canvas, state, ev, dpr) {
  const { ctx, w, h } = syncCanvas(canvas, dpr);

  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, w, h);

  // 细工程格线
  ctx.strokeStyle = "rgba(18, 36, 31, 0.07)";
  ctx.lineWidth = 1;
  for (let x = 24; x < w; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }

  const camXPos = 28;
  const camYPos = h * 0.52 + state.camX * (h * 0.16);
  const zMin = 0.6;
  const zMax = 15.2;
  const zToX = (z) => camXPos + 22 + ((Math.log(z + 0.8) - Math.log(zMin + 0.8)) / (Math.log(zMax + 0.8) - Math.log(zMin + 0.8))) * (w - camXPos - 40);

  // 镜头视锥（随 camX 轻微上下摆动表现侧视偏移）
  ctx.fillStyle = "rgba(215, 153, 142, 0.13)";
  ctx.beginPath();
  ctx.moveTo(camXPos, camYPos);
  ctx.lineTo(w - 8, 12);
  ctx.lineTo(w - 8, h - 18);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(148, 64, 55, 0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(camXPos, camYPos);
  ctx.lineTo(w - 8, 12);
  ctx.moveTo(camXPos, camYPos);
  ctx.lineTo(w - 8, h - 18);
  ctx.stroke();
  ctx.setLineDash([]);

  // 景深清晰带（从 y=20 起绘，绝不压到顶部 L1–L5 文字标号）
  const fm = FOCUS_MODES[state.focus] || FOCUS_MODES.L4;
  if (state.focus === "deep") {
    const x1 = zToX(1.8);
    const x2 = zToX(14.5);
    ctx.fillStyle = "rgba(31, 94, 75, 0.14)";
    ctx.fillRect(x1, 20, x2 - x1, h - 42);
  } else {
    const fx = zToX(fm.targetZ);
    ctx.fillStyle = "rgba(31, 94, 75, 0.16)";
    ctx.fillRect(fx - 12, 20, 24, h - 42);
    ctx.strokeStyle = PALETTE.okLight;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fx, 20);
    ctx.lineTo(fx, h - 22);
    ctx.stroke();
  }

  // 五块玻璃景片立柱
  const planeColors = {
    L1: PALETTE.palm,
    L2: PALETTE.pine,
    L3: PALETTE.archFront,
    L4: PALETTE.roseTextLight,
    L5: PALETTE.stepTop,
  };
  for (const p of PLANES) {
    const px = zToX(p.z);
    const isActive = p.key === state.activeLayer;
    const isFocused = (state.focus === p.id) || (state.focus === "deep" && p.id !== "L1");
    ctx.strokeStyle = planeColors[p.id];
    ctx.lineWidth = isActive ? 3.5 : 2;
    ctx.beginPath();
    ctx.moveTo(px, 22);
    ctx.lineTo(px, h - 24);
    ctx.stroke();

    // 顶部景片小标
    ctx.fillStyle = isActive ? PALETTE.roseTextLight : PALETTE.ink;
    ctx.font = `${isActive ? "700" : "500"} 10px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(p.id, px, 13);

    // 底部米距
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = '400 10px "DM Mono", monospace';
    ctx.fillText(`${p.z}m`, px, h - 8);

    // 清晰实心点标记当前合焦层
    if (isFocused) {
      ctx.fillStyle = PALETTE.okLight;
      ctx.beginPath();
      ctx.arc(px, h * 0.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 相机机头符号
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(camXPos - 14, camYPos - 7, 14, 14);
  ctx.beginPath();
  ctx.moveTo(camXPos, camYPos - 4);
  ctx.lineTo(camXPos + 6, camYPos - 7);
  ctx.lineTo(camXPos + 6, camYPos + 7);
  ctx.lineTo(camXPos, camYPos + 4);
  ctx.closePath();
  ctx.fill();
}

// ---------- 第 02 节：光圈虚实 + 明度阶梯交互实验画布 ----------
export function renderScaleLab(canvas, fStop, tonalSep, dpr) {
  const { ctx, w, h } = syncCanvas(canvas, dpr);
  const t = clamp(tonalSep / 100, 0, 1);

  // 色彩插值工具：t=0 时四层趋同为灰闷中调，t=1 时拉开清晰暗→中→亮阶梯
  const lerpHex = (a, b, k) => {
    const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * k);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * k);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * k);
    return `rgb(${r},${g},${bl})`;
  };

  const bgCol = lerpHex("#8C8378", "#EDE1D3", t);
  const archCol = lerpHex("#8A7B74", "#D7998E", t);
  const subCol = lerpHex("#96807A", "#E58B80", t);
  const wallCol = lerpHex("#6E6B64", "#18322E", t);
  const palmCol = lerpHex("#63625C", "#0A2824", t);

  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, w, h);

  // 根据 fStop 计算前景离焦模糊量（f/1.4 最大约 4.5px，f/16 约 0px）
  const blurScale = clamp((16 - fStop) / 14.6, 0, 1);
  const fgBlur1 = blurScale * 4.4;
  const fgBlur2 = blurScale * 2.1;

  // 远日
  ctx.fillStyle = lerpHex("#958B80", "#E4D1B8", t);
  ctx.beginPath();
  ctx.arc(w * 0.34, h * 0.34, h * 0.21, 0, Math.PI * 2);
  ctx.fill();

  // 焦点球（始终合焦清晰）
  const sx = w * 0.56;
  const sy = h * 0.53;
  const sr = h * 0.095;
  ctx.fillStyle = subCol;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  // 中层拱门
  const aw = w * 0.42;
  const al = sx - aw / 2;
  const at = h * 0.2;
  const ab = h * 0.86;
  const ow = aw * 0.52;
  ctx.fillStyle = archCol;
  ctx.beginPath();
  ctx.rect(al, at, aw, ab - at);
  ctx.moveTo(sx - ow / 2, ab);
  ctx.lineTo(sx - ow / 2, h * 0.48);
  ctx.ellipse(sx, h * 0.48, ow / 2, ow * 0.42, 0, Math.PI, 0, false);
  ctx.lineTo(sx + ow / 2, ab);
  ctx.closePath();
  ctx.fill("evenodd");

  // L2 深松阶墙（微柔焦）
  withSoftFocus(ctx, fgBlur2, () => {
    ctx.fillStyle = wallCol;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.50);
    ctx.lineTo(w * 0.27, h * 0.53);
    ctx.lineTo(w * 0.27, h * 0.62);
    ctx.lineTo(w * 0.65, h * 0.72);
    ctx.lineTo(w * 0.65, h * 0.80);
    ctx.lineTo(w, h * 0.89);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // L1 棕榈暗叶（随光圈明显虚化）
  withSoftFocus(ctx, fgBlur1, () => {
    drawPalmCluster(ctx, w, h, { x: 0.36, y: 0.92 }, w / h, palmCol, 1);
  });

  // 右侧四段实时明度阶梯条（展示各层明度分离度）
  const bars = [
    { label: "L1", lum: Math.round(42 - 30 * t), col: palmCol },
    { label: "L2", lum: Math.round(45 - 26 * t), col: wallCol },
    { label: "L3", lum: Math.round(52 + 16 * t), col: archCol },
    { label: "L4", lum: Math.round(55 + 28 * t), col: subCol },
  ];
  const bx = w - 102;
  const by = 14;
  ctx.fillStyle = "rgba(17, 38, 34, 0.86)";
  ctx.fillRect(bx, by, 90, 92);
  ctx.fillStyle = PALETTE.creamOnDark;
  ctx.font = '500 10px "DM Mono", monospace';
  ctx.fillText("VALUE L*", bx + 8, by + 16);
  bars.forEach((b, i) => {
    const ry = by + 26 + i * 16;
    ctx.fillStyle = PALETTE.sandOnDark;
    ctx.fillText(b.label, bx + 8, ry + 8);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(bx + 26, ry, 54, 8);
    ctx.fillStyle = b.col;
    ctx.fillRect(bx + 26, ry, Math.max(6, (b.lum / 100) * 54), 8);
  });
}

// ---------- 第 03 节：中层框架四种模式对照画布 ----------
export function renderApertureCanvas(canvas, modeId, dpr) {
  const { ctx, w, h } = syncCanvas(canvas, dpr);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, w, h);

  // 远景光带
  ctx.fillStyle = PALETTE.sunDisc;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.44, h * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // 主体人物剪影（恒定在画中偏右/正中）
  const subX = modeId === "tangent" ? w * 0.57 : w * 0.5;
  const subFoot = h * 0.78;
  const figH = h * 0.34;
  ctx.fillStyle = PALETTE.roseTextLight;
  ctx.beginPath();
  ctx.arc(subX, subFoot - figH + h * 0.045, h * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(subX - h * 0.06, subFoot - figH + h * 0.1);
  ctx.lineTo(subX + h * 0.06, subFoot - figH + h * 0.1);
  ctx.lineTo(subX + h * 0.075, subFoot);
  ctx.lineTo(subX - h * 0.075, subFoot);
  ctx.closePath();
  ctx.fill();

  if (modeId === "arch" || modeId === "tangent") {
    const cx = w * 0.5;
    const ow = w * 0.30;
    ctx.fillStyle = PALETTE.archFront;
    ctx.beginPath();
    ctx.rect(w * 0.18, h * 0.12, w * 0.64, h * 0.78);
    ctx.moveTo(cx - ow / 2, h * 0.9);
    ctx.lineTo(cx - ow / 2, h * 0.42);
    ctx.ellipse(cx, h * 0.42, ow / 2, h * 0.22, 0, Math.PI, 0, false);
    ctx.lineTo(cx + ow / 2, h * 0.9);
    ctx.closePath();
    ctx.fill("evenodd");

    // 暗前景阶角
    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.62);
    ctx.lineTo(w * 0.34, h * 0.76);
    ctx.lineTo(w, h * 0.92);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    if (modeId === "tangent") {
      // 高亮切边相切碰撞线
      const clashX = cx + ow / 2;
      ctx.strokeStyle = PALETTE.warnLight;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(clashX, h * 0.24);
      ctx.lineTo(clashX, h * 0.84);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.warnLight;
      ctx.fillRect(clashX + 8, h * 0.36, 98, 22);
      ctx.fillStyle = "#FFF7F0";
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText("切边相切！", clashX + 18, h * 0.36 + 11);
    }
  } else if (modeId === "doorway") {
    // 福特《搜索者》式黑门框阈值
    ctx.fillStyle = PALETTE.pineDeep;
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(w * 0.36, h * 0.14, w * 0.28, h * 0.72);
    ctx.fill("evenodd");
    // 门檐透视线
    ctx.strokeStyle = "rgba(237, 225, 211, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(w * 0.36, h * 0.14, w * 0.28, h * 0.72);
  } else if (modeId === "double") {
    // 远层小门框
    ctx.fillStyle = PALETTE.archFront;
    ctx.beginPath();
    ctx.rect(w * 0.16, h * 0.14, w * 0.68, h * 0.74);
    ctx.rect(w * 0.37, h * 0.28, w * 0.26, h * 0.56);
    ctx.fill("evenodd");
    // 近层大黑框
    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(w * 0.18, h * 0.12, w * 0.64, h * 0.78);
    ctx.fill("evenodd");
  }

  // 视线汇聚指示虚线（仅在合理模式显示）
  if (modeId !== "tangent") {
    ctx.strokeStyle = "rgba(243, 234, 224, 0.55)";
    ctx.lineWidth = 1.1;
    ctx.setLineDash([4, 4]);
    const corners = [
      [14, 14],
      [w - 14, 14],
      [14, h - 14],
      [w - 14, h - 14],
    ];
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(subX, subFoot - figH * 0.55);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
}

// ---------- 第 04 节：历史构造动态示意图（带轻微平缓运动，reducedMotion 静止完整） ----------
export function renderHistoryCanvas(canvas, eraId, t, dpr) {
  const { ctx, w, h } = syncCanvas(canvas, dpr);
  const osc = Math.sin(t * 1.1);

  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, w, h);

  if (eraId === "vermeer") {
    // 1666 维米尔《绘画艺术》左幕压角构造
    // 远景墙面与地图
    ctx.fillStyle = "#E6D8C3";
    ctx.fillRect(w * 0.42, h * 0.16, w * 0.44, h * 0.44);
    ctx.strokeStyle = PALETTE.stepFront;
    ctx.strokeRect(w * 0.42, h * 0.16, w * 0.44, h * 0.44);
    // 远处受光模特剪影
    ctx.fillStyle = PALETTE.archFront;
    ctx.beginPath();
    ctx.arc(w * 0.56, h * 0.42, h * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.53, h * 0.48, w * 0.06, h * 0.24);
    // 中景画家背影
    ctx.fillStyle = "#3E4A42";
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.48, h * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.68, h * 0.54, w * 0.08, h * 0.30);
    // 极前景左侧深暗织锦帷幕（repoussoir）
    const drape = w * (0.29 + osc * 0.02);
    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(drape, 0);
    ctx.quadraticCurveTo(drape * 0.78, h * 0.48, drape * 0.94, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.creamOnDark;
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.fillText("极前景压角帷幕", 14, h * 0.22);
  } else if (eraId === "disney") {
    // 1937 垂直多平面摄影机玻璃层架示意
    ctx.fillStyle = PALETTE.pineDeep;
    ctx.fillRect(0, 0, w, h);
    // 顶部镜头
    ctx.fillStyle = PALETTE.creamOnDark;
    ctx.fillRect(w * 0.45, 10, w * 0.1, 18);
    ctx.fillStyle = PALETTE.roseTextDark;
    ctx.font = '500 10px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("TOP CAMERA", w * 0.5, 40);

    const layers = [
      { y: 0.28, label: "玻璃层 1 · 近前景草叶", shift: osc * 22, col: "#33493D" },
      { y: 0.46, label: "玻璃层 2 · 中前景树干", shift: osc * 13, col: "#4F6B5E" },
      { y: 0.64, label: "玻璃层 3 · 主体老磨坊", shift: osc * 6, col: PALETTE.archFront },
      { y: 0.82, label: "玻璃层 4 · 远景月夜天幕", shift: osc * 2, col: PALETTE.sunDisc },
    ];
    layers.forEach((ly) => {
      const yy = h * ly.y;
      const sx = w * 0.16 + ly.shift;
      const sw = w * 0.68;
      ctx.strokeStyle = "rgba(243, 234, 224, 0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx, yy);
      ctx.lineTo(sx + sw, yy);
      ctx.lineTo(sx + sw - 18, yy + 18);
      ctx.lineTo(sx - 18, yy + 18);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = ly.col;
      ctx.fillRect(sx + 18, yy + 4, sw * 0.32, 10);
      ctx.fillStyle = PALETTE.creamOnDark;
      ctx.font = '500 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(ly.label, sx + sw * 0.38, yy + 13);
    });
  } else if (eraId === "ford") {
    // 1956《搜索者》室内暗门框望向明亮荒原
    // 沙漠地平与孤峰
    ctx.fillStyle = "#E8C8A0";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#C9956B";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    // 远方独行者剪影（缓慢远去）
    const figS = 1 - osc * 0.08;
    ctx.fillStyle = "#2E1C14";
    ctx.fillRect(w * 0.49, h * 0.56, 8 * figS, 24 * figS);
    ctx.beginPath();
    ctx.arc(w * 0.49 + 4 * figS, h * 0.54, 4 * figS, 0, Math.PI * 2);
    ctx.fill();
    // 极暗室内门框前景
    const doorClose = Math.max(0, osc * 0.05);
    ctx.fillStyle = "#0F1E1B";
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(w * (0.35 + doorClose), h * 0.14, w * (0.30 - doorClose * 2), h * 0.76);
    ctx.fill("evenodd");
    ctx.fillStyle = PALETTE.creamOnDark;
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.fillText("极暗室内门槛前景", 16, h * 0.86);
  } else {
    // 1950–2005 叠压线索 + 孔径构图三层透视示意图
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);
    const dx = osc * 10;
    // 远层焦点圆
    ctx.fillStyle = PALETTE.sphereBase;
    ctx.beginPath();
    ctx.arc(w * 0.58, h * 0.48, h * 0.13, 0, Math.PI * 2);
    ctx.fill();
    // 中层孔径隔断
    ctx.fillStyle = PALETTE.archFront;
    ctx.beginPath();
    ctx.rect(w * 0.28 + dx * 0.5, h * 0.18, w * 0.52, h * 0.66);
    ctx.rect(w * 0.43 + dx * 0.5, h * 0.28, w * 0.28, h * 0.44);
    ctx.fill("evenodd");
    // 前景遮挡暗板
    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(w * 0.08 + dx * 1.4, h * 0.44, w * 0.30, h * 0.48);
    // 标注单眼叠压交界点（T-junction）
    const jx = w * 0.38 + dx * 1.4;
    const jy = h * 0.44;
    ctx.strokeStyle = PALETTE.roseTextDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(jx, jy, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.fillText("T 形叠压交界（Interposition）", w * 0.1, h * 0.14);
  }
}
