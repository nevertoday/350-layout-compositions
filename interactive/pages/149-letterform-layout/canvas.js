// 149 字母造型版式 · 2D Canvas 活体字母舞台 & 03 节深紫暗房嵌合画布
import { evaluate, STAGE_ASPECT } from "./model.js";

const PAL = {
  paper: "#EFECF2",
  paperLight: "#F7F5FA",
  purple: "#9E8BD2",
  purpleDeep: "#775EB6",
  purpleInk: "#4E3D82",
  purpleLine: "#B9ABD9",
  lime: "#B6CA3F",
  limeBright: "#E4EC58",
  limeInk: "#4A5B0B",
  ink: "#111015",
  muted: "#4A455C",
  err: "#B82946",
  errSoft: "rgba(184, 41, 70, 0.14)",
  darkBg: "#1E1636",
};

function drawDotGrid(ctx, x0, y0, cols, rows, gap, r, color) {
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.beginPath();
      ctx.arc(x0 + col * gap, y0 + row * gap, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPolygon(ctx, pts, W, H) {
  ctx.beginPath();
  pts.forEach(([u, v], i) => {
    if (i === 0) ctx.moveTo(u * W, v * H);
    else ctx.lineTo(u * W, v * H);
  });
  ctx.closePath();
}

function drawDiagonalHatch(ctx, x0, y0, x1, y1, color, step = 8) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.8, step * 0.24);
  for (let d = -(y1 - y0); d < (x1 - x0) + (y1 - y0); d += step) {
    ctx.beginPath();
    ctx.moveTo(x0 + d, y1);
    ctx.lineTo(x0 + d + (y1 - y0), y0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFootDots(ctx, x0, y0, x1, y1, color, step = 7.5) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();
  ctx.fillStyle = color;
  for (let y = y0 + step * 0.45; y < y1; y += step) {
    for (let x = x0 + step * 0.45; x < x1; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.4, step * 0.19), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawLetterBody(ctx, geom, W, H, fillColor, ornatePhase = 0) {
  ctx.save();
  ctx.fillStyle = fillColor;

  if (geom.type === "A") {
    // 左斜腿、右斜腿、横梁拼成精准几何 A
    drawPolygon(ctx, geom.leftLeg, W, H);
    ctx.fill();
    drawPolygon(ctx, geom.rightLeg, W, H);
    ctx.fill();
    drawPolygon(ctx, geom.barPoly, W, H);
    ctx.fill();
  } else if (geom.type === "H") {
    const { leftPillar: lp, rightPillar: rp, barRect: br } = geom;
    ctx.fillRect(lp.x * W, lp.y * H, lp.w * W, lp.h * H);
    ctx.fillRect(rp.x * W, rp.y * H, rp.w * W, rp.h * H);
    ctx.fillRect(br.x * W, br.y * H, br.w * W, br.h * H);
  } else {
    // 建筑几何 S（上横梁、左竖、中横脊、右竖、下横梁，带轻微圆角转折）
    const { cx, topY, botY, baseHalf, legW, barH, barYNorm } = geom;
    const xL = (cx - baseHalf) * W;
    const xR = (cx + baseHalf) * W;
    const fullW = (baseHalf * 2) * W;
    const lw = Math.min(legW, baseHalf * 0.9) * W;
    const bh = barH * H;
    const ty = topY * H;
    const by = botY * H;
    const my = barYNorm * H;
    // 顶部横臂
    ctx.fillRect(xL, ty, fullW, bh);
    // 左上竖柱
    ctx.fillRect(xL, ty, lw, Math.max(bh, my - ty + bh * 0.5));
    // 中腰横脊
    ctx.fillRect(xL, my - bh * 0.5, fullW, bh);
    // 右下竖柱
    ctx.fillRect(xR - lw, my - bh * 0.5, lw, Math.max(bh, by - (my - bh * 0.5)));
    // 底部横足
    ctx.fillRect(xL, by - bh, fullW, bh);
  }

  // 花哨失认错态：叠加破坏识别度的杂乱色块与切角碎条
  if (ornatePhase > 0.01) {
    ctx.globalAlpha = 0.85 * ornatePhase;
    const cxPx = geom.cx * W;
    const midY = (geom.topY + geom.H * 0.48) * H;
    const pieces = [
      [-0.24, -0.22, 0.22, 0.11, -0.38, "#D64E7C"],
      [0.06, -0.14, 0.24, 0.10, 0.42, "#35A4B5"],
      [-0.18, 0.04, 0.28, 0.11, 0.24, "#F2B63D"],
      [0.02, 0.16, 0.22, 0.09, -0.32, "#5F49A8"],
      [-0.22, 0.22, 0.16, 0.12, 0.52, "#B6CA3F"],
    ];
    for (const [dx, dy, pw, ph, ang, col] of pieces) {
      ctx.save();
      ctx.translate(cxPx + dx * W, midY + dy * H);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.fillRect(-pw * W * 0.5, -ph * H * 0.5, pw * W, ph * H);
      ctx.restore();
    }
  }
  ctx.restore();
}

export function drawHeroStage(ctx, W, H, state, t, reveal = 1) {
  const aspect = W / Math.max(1, H);
  const res = evaluate(state, aspect);
  const { cfg, geom, pillars, metrics, allOk } = res;

  // 1. 冷丁香纸底 + 细微建筑网格暗纹
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = "rgba(78, 61, 130, 0.045)";
  ctx.lineWidth = 1;
  const gridStep = Math.max(24, Math.round(W / 24));
  for (let x = gridStep; x < W; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = gridStep; y < H; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // 原海报标志点阵：右上 4x3 & 左下 3x6
  const dotGap = Math.max(8, W * 0.0155);
  const dotR = Math.max(1.3, W * 0.0023);
  drawDotGrid(ctx, W * 0.895, H * 0.06, 4, 3, dotGap, dotR, PAL.purpleLine);
  drawDotGrid(ctx, W * 0.035, H * 0.72, 3, 6, dotGap, dotR, PAL.purpleLine);

  // 2. 右上青柠大圆 + 偏心细紫圆弧（在字母背后 + 交叠区叠深紫）
  const lc = geom.limeCircle;
  const isFlat = state.infoMode === "flat";
  const circleX = (isFlat ? 0.14 : lc.x) * W;
  const circleY = (isFlat ? 0.16 : lc.y + Math.sin(t * 1.1) * 0.004 * (allOk ? 1 : 0)) * H;
  const circleR = lc.r * H * reveal;

  ctx.save();
  // 偏心细紫伴弧（复刻原海报）
  ctx.strokeStyle = PAL.purpleDeep;
  ctx.lineWidth = Math.max(1.1, W * 0.0018);
  ctx.beginPath();
  ctx.arc(circleX + circleR * 0.32, circleY - circleR * 0.06, circleR * 1.02, -Math.PI * 0.58, Math.PI * 0.55);
  ctx.stroke();
  // 实心青柠大圆
  ctx.fillStyle = state.infoMode === "ornate" ? "#D64E7C" : PAL.lime;
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. 绘制巨型薰衣草紫字母本体（带轻微入场缩放）
  ctx.save();
  if (reveal < 0.999) {
    const sy = 0.88 + 0.12 * reveal;
    ctx.translate(geom.cx * W, geom.botY * H);
    ctx.scale(1, sy);
    ctx.translate(-geom.cx * W, -geom.botY * H);
    ctx.globalAlpha = 0.25 + 0.75 * reveal;
  }

  const baseColor = state.infoMode === "ornate" ? "#8E7DC4" : PAL.purple;
  drawLetterBody(ctx, geom, W, H, baseColor, state.infoMode === "ornate" ? 1 : 0);

  // 原海报神韵：青柠大圆与字母顶角交叠处压出一块通透深紫交叠色
  if (!isFlat && state.infoMode !== "ornate") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.clip();
    drawLetterBody(ctx, geom, W, H, PAL.purpleDeep, 0);
    ctx.restore();
  }

  // 4. 原海报标志性「双足稳定支撑」纹样（左脚斜绿条纹 + 右脚绿圆点阵）
  const footH = Math.max(16, (geom.botY - geom.topY) * H * 0.115);
  const footY0 = geom.botY * H - footH;
  const footY1 = geom.botY * H;
  const footColor = pillars.structure.ok ? PAL.lime : PAL.err;

  ctx.save();
  // 裁剪在字母内部底部条带
  ctx.fillStyle = PAL.paper;
  // 把底足一截反白再铺斜纹/点阵，还原原海报清爽通透感！
  if (geom.type === "A") {
    const tFoot = (footY0 / H - geom.topY) / geom.H;
    const outerLF = geom.cx - (geom.topHalf + tFoot * (geom.baseHalf - geom.topHalf));
    const outerRF = geom.cx + (geom.topHalf + tFoot * (geom.baseHalf - geom.topHalf));
    // 左足梯形裁剪
    ctx.save();
    drawPolygon(ctx, [
      [outerLF, footY0 / H],
      [outerLF + geom.legW, footY0 / H],
      [geom.leftFootX1, geom.botY],
      [geom.leftFootX0, geom.botY],
    ], W, H);
    ctx.fillStyle = PAL.paper;
    ctx.fill();
    ctx.clip();
    drawDiagonalHatch(ctx, geom.leftFootX0 * W - 6, footY0, (outerLF + geom.legW) * W + 6, footY1, footColor, Math.max(6, W * 0.011));
    ctx.restore();

    // 右足梯形裁剪
    ctx.save();
    drawPolygon(ctx, [
      [outerRF - geom.legW, footY0 / H],
      [outerRF, footY0 / H],
      [geom.rightFootX1, geom.botY],
      [geom.rightFootX0, geom.botY],
    ], W, H);
    ctx.fillStyle = PAL.paper;
    ctx.fill();
    ctx.clip();
    drawFootDots(ctx, (outerRF - geom.legW) * W - 4, footY0, geom.rightFootX1 * W + 4, footY1, footColor, Math.max(6, W * 0.0105));
    ctx.restore();
  } else {
    // H / S 双足
    ctx.save();
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(geom.leftFootX0 * W, footY0, (geom.leftFootX1 - geom.leftFootX0) * W, footH);
    drawDiagonalHatch(ctx, geom.leftFootX0 * W, footY0, geom.leftFootX1 * W, footY1, footColor, Math.max(6, W * 0.011));
    ctx.fillRect(geom.rightFootX0 * W, footY0, (geom.rightFootX1 - geom.rightFootX0) * W, footH);
    drawFootDots(ctx, geom.rightFootX0 * W, footY0, geom.rightFootX1 * W, footY1, footColor, Math.max(6, W * 0.0105));
    ctx.restore();
  }
  ctx.restore();

  // 5. 结构引导标注层（原海报四处青柠虚线 / 紫箭头 / 底部支撑线）
  if (state.showGuides) {
    const focus = state.focusStep;
    const dim = (step) => (focus && focus !== step ? 0.28 : 1);

    // 5a. 字怀虚线内框（步骤 2 提取结构 / 留白空间）
    ctx.save();
    ctx.globalAlpha = dim(2);
    const cCol = pillars.form.ok ? PAL.lime : PAL.err;
    ctx.strokeStyle = cCol;
    ctx.lineWidth = Math.max(1.5, W * 0.0024);
    ctx.setLineDash([5, 4]);
    if (geom.type === "A" && geom.counterTri) {
      const [top, bl, br] = geom.counterTri;
      const pad = 0.012;
      const cxT = top[0] * W;
      const ty = Math.min(bl[1] * H - 4, top[1] * H + pad * H * 2.2);
      const by = bl[1] * H - pad * H;
      const lx = Math.min(cxT - 2, bl[0] * W + pad * W);
      const rx = Math.max(cxT + 2, br[0] * W - pad * W);
      if (by > ty + 6 && rx > lx + 8) {
        ctx.beginPath();
        ctx.moveTo(cxT, ty);
        ctx.lineTo(rx, by);
        ctx.lineTo(lx, by);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (geom.type === "H") {
      for (const box of [geom.upperCounter, geom.lowerCounter]) {
        if (!box) continue;
        const p = 6;
        if (box.w * W > p * 2 + 6 && box.h * H > p * 2 + 6) {
          ctx.strokeRect(box.x * W + p, box.y * H + p, box.w * W - p * 2, box.h * H - p * 2);
        }
      }
    } else if (geom.type === "S") {
      for (const box of [geom.upperBay, geom.lowerBay]) {
        if (!box) continue;
        const p = 6;
        if (box.w * W > p * 2 + 6 && box.h * H > p * 2 + 6) {
          ctx.strokeRect(box.x * W + p, box.y * H + p, box.w * W - p * 2, box.h * H - p * 2);
        }
      }
    }
    ctx.restore();

    // 5b. 横梁贯通虚线 + 两端青柠圆点（步骤 3 组织信息 / 横向连接）
    ctx.save();
    ctx.globalAlpha = dim(3);
    const barCol = pillars.association.ok ? PAL.lime : PAL.err;
    const byLine = (geom.barYNorm - geom.barH * 0.5) * H;
    const bx0 = (geom.barLeftX - 0.025) * W;
    const bx1 = (geom.barRightX + 0.025) * W;
    ctx.strokeStyle = barCol;
    ctx.lineWidth = Math.max(1.5, W * 0.0024);
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(bx0, byLine);
    ctx.lineTo(bx1, byLine);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = barCol;
    for (const px of [bx0, bx1]) {
      ctx.beginPath();
      ctx.arc(px, byLine, Math.max(4.5, W * 0.0075), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5c. 底部稳定支撑线 + 四枚脚端圆点 + 倒三角（步骤 2/4 稳定支撑）
    ctx.save();
    ctx.globalAlpha = dim(2);
    const sCol = pillars.structure.ok ? PAL.lime : PAL.err;
    ctx.strokeStyle = sCol;
    ctx.lineWidth = Math.max(1.3, W * 0.002);
    ctx.beginPath();
    ctx.moveTo(geom.leftFootX0 * W, footY0);
    ctx.lineTo(geom.rightFootX1 * W, footY0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(geom.leftFootX0 * W, footY1);
    ctx.lineTo(geom.leftFootX1 * W, footY1);
    ctx.moveTo(geom.rightFootX0 * W, footY1);
    ctx.lineTo(geom.rightFootX1 * W, footY1);
    ctx.stroke();
    ctx.fillStyle = sCol;
    for (const fx of [geom.leftFootX0, geom.leftFootX1, geom.rightFootX0, geom.rightFootX1]) {
      ctx.beginPath();
      ctx.arc(fx * W, footY1, Math.max(3.6, W * 0.006), 0, Math.PI * 2);
      ctx.fill();
    }
    // 底部中心小倒三角
    const triY = footY1 + Math.max(7, H * 0.02);
    const triS = Math.max(5.5, W * 0.009);
    ctx.beginPath();
    ctx.moveTo(geom.cx * W - triS, triY - triS * 0.6);
    ctx.lineTo(geom.cx * W + triS, triY - triS * 0.6);
    ctx.lineTo(geom.cx * W, triY + triS * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5d. 右侧倾斜引导斜线 + 紫虚线箭头（固定锚在画布右侧安全带，永不与中央文字撞车）
    ctx.save();
    ctx.globalAlpha = dim(1);
    const rX = Math.min(0.92, Math.max(0.865, geom.cx + geom.baseHalf + 0.085)) * W;
    const rY0 = H * 0.19;
    const rY1 = H * 0.30;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = Math.max(1.2, W * 0.002);
    ctx.beginPath();
    ctx.moveTo(rX - W * 0.032, rY1);
    ctx.lineTo(rX + W * 0.042, rY0);
    ctx.stroke();
    // 紫小三角 + 虚线箭
    ctx.fillStyle = pillars.structure.ok ? PAL.purpleInk : PAL.err;
    const tAx = Math.min(W - 34, rX + W * 0.004);
    const tAy = rY1 + H * 0.038;
    ctx.beginPath();
    ctx.moveTo(tAx, tAy - 6);
    ctx.lineTo(tAx - 7, tAy + 4);
    ctx.lineTo(tAx + 7, tAy + 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = pillars.structure.ok ? PAL.purpleInk : PAL.err;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tAx - W * 0.042, H * 0.62);
    ctx.lineTo(tAx + W * 0.024, H * 0.52);
    ctx.stroke();
    ctx.setLineDash([]);
    // 箭头尖
    ctx.beginPath();
    ctx.moveTo(tAx + W * 0.01, H * 0.52);
    ctx.lineTo(tAx + W * 0.024, H * 0.52);
    ctx.lineTo(tAx + W * 0.024, H * 0.545);
    ctx.stroke();

    // 右侧小字标：倾斜引导 / 倾角实测
    ctx.fillStyle = pillars.structure.ok ? PAL.purpleInk : PAL.err;
    ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.0165))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(cfg.flowLabel, tAx, tAy + Math.max(18, H * 0.048));
    ctx.font = `700 ${Math.max(10, Math.round(W * 0.015))}px "Space Mono", monospace`;
    ctx.fillText(cfg.id === "H" ? `${metrics.baseWidthRatioPct}%` : `${metrics.slopeDeg.toFixed(0)}°`, tAx, tAy + Math.max(33, H * 0.084));
    ctx.restore();
  }

  // 6. 海报信息模块落位渲染（区分 flat 硬压错排 / skeleton 依骨架落位 / ornate 失认）
  ctx.save();
  const titleSize = Math.max(16, Math.round(W * 0.045));
  const subSize = Math.max(11, Math.round(W * 0.021));
  const metaSize = Math.max(10, Math.round(W * 0.0155));

  if (state.infoMode === "flat") {
    // 错排：强行居中方框横压在字母腰腹，斩断字怀与斜边（位置避开顶侧横梁手柄与右侧引导标注）
    const boxW = Math.min(W * 0.54, W - 120);
    const boxH = H * 0.27;
    const bx = geom.cx * W - boxW * 0.5;
    const by = H * 0.43;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = PAL.err;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.setLineDash([]);

    // 错排警示角标（置于错排框底沿左侧，与上方横梁手柄彻底错开，动态按字宽计算永不溢出）
    const tagTxt = "压断骨架 · 点击改落位";
    ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.015))}px "Noto Sans SC", sans-serif`;
    const tagW = Math.min(boxW, Math.ceil(ctx.measureText(tagTxt).width) + 16);
    ctx.fillStyle = PAL.err;
    ctx.fillRect(bx, by + boxH - 1, tagW, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(tagTxt, bx + 8, by + boxH + 13);

    ctx.textAlign = "center";
    ctx.fillStyle = PAL.ink;
    ctx.font = `800 ${titleSize}px "Unbounded", "Noto Sans SC", sans-serif`;
    ctx.fillText(cfg.posterTitle, geom.cx * W, by + boxH * 0.37);
    ctx.font = `600 ${subSize}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.muted;
    ctx.fillText(cfg.posterSub, geom.cx * W, by + boxH * 0.63);
    const metaStr = `${cfg.posterDate} · ${cfg.posterVenue}`;
    ctx.font = `700 ${metaSize}px "Noto Sans SC", "Space Mono", sans-serif`;
    const metaScale = Math.min(1, (boxW - 18) / Math.max(1, ctx.measureText(metaStr).width));
    if (metaScale < 0.99) {
      ctx.font = `700 ${Math.max(9.5, Math.floor(metaSize * metaScale))}px "Noto Sans SC", "Space Mono", sans-serif`;
    }
    ctx.fillText(metaStr, geom.cx * W, by + boxH * 0.85);
  } else {
    // 依骨架落位（或花哨模式下也在槽位上，但背景被碎片淹没）
    // 槽位 1：左上外沿主标（沿字母外轮廓左上方呼吸区落位）
    ctx.textAlign = "left";
    ctx.fillStyle = PAL.ink;
    ctx.font = `800 ${Math.round(titleSize * 0.92)}px "Unbounded", sans-serif`;
    ctx.fillText(cfg.posterTitle, W * 0.042, H * 0.145);
    ctx.fillStyle = PAL.purpleInk;
    ctx.fillRect(W * 0.042, H * 0.172, W * 0.085, Math.max(3, H * 0.008));
    ctx.font = `700 ${metaSize}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.purpleInk;
    ctx.fillText(cfg.posterSub, W * 0.042, H * 0.228);

    // 槽位 2：字怀内部呼吸标注（仅当字怀足够宽敞时才清透展示「留白空间」，绝不硬塞满文字）
    if (metrics.counterPct >= 8) {
      let cX = geom.cx * W;
      let cY = (geom.topY + geom.H * 0.42) * H;
      if (geom.type === "A" && geom.counterTri) {
        cY = (geom.counterTri[0][1] * 0.36 + geom.counterTri[1][1] * 0.64) * H;
      } else if (geom.type === "H" && geom.upperCounter) {
        cY = (geom.upperCounter.y + geom.upperCounter.h * 0.54) * H;
      } else if (geom.type === "S" && geom.upperBay) {
        cY = (geom.upperBay.y + geom.upperBay.h * 0.56) * H;
      }
      ctx.textAlign = "center";
      ctx.fillStyle = pillars.form.ok ? PAL.limeInk : PAL.err;
      ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.0175))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("留白空间", cX, cY - 3);
      ctx.font = `700 ${Math.max(10, Math.round(W * 0.014))}px "Space Mono", monospace`;
      ctx.fillText(`${metrics.counterPct.toFixed(0)}%`, cX, cY + Math.max(12, H * 0.032));
    }

    // 槽位 3：横梁正中横向连接副标（原海报柠黄高光字坐稳紫横梁）
    ctx.textAlign = "center";
    ctx.fillStyle = pillars.association.ok ? PAL.limeBright : "#FFE6EB";
    ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.0185))}px "Noto Sans SC", sans-serif`;
    ctx.fillText(cfg.posterDate, geom.cx * W, geom.barYNorm * H + 4);

    // 槽位 4：底座双足之间稳定承托展馆信息
    ctx.textAlign = "center";
    ctx.fillStyle = pillars.structure.ok ? PAL.limeInk : PAL.err;
    ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.017))}px "Noto Sans SC", sans-serif`;
    ctx.fillText(cfg.posterVenue, geom.cx * W, footY0 + footH * 0.58);
  }
  ctx.restore();

  // 7. 当四柱全部成立时，轻柔描出沿字母骨架走一遍的青柠视线脉冲点
  if (allOk && state.showGuides) {
    const phase = (t * 0.45) % 1;
    let px = geom.cx * W;
    let py = geom.topY * H;
    if (geom.type === "A") {
      if (phase < 0.45) {
        const k = phase / 0.45;
        px = (geom.leftFootX0 + (geom.cx - geom.leftFootX0) * k) * W;
        py = (geom.botY - geom.H * k) * H;
      } else if (phase < 0.8) {
        const k = (phase - 0.45) / 0.35;
        px = (geom.cx + (geom.barRightX - geom.cx) * k) * W;
        py = (geom.topY + (geom.barYNorm - geom.topY) * k) * H;
      } else {
        const k = (phase - 0.8) / 0.2;
        px = (geom.barRightX - (geom.barRightX - geom.barLeftX) * k) * W;
        py = geom.barYNorm * H;
      }
    } else {
      px = (geom.barLeftX + (geom.barRightX - geom.barLeftX) * phase) * W;
      py = geom.barYNorm * H;
    }
    ctx.save();
    ctx.fillStyle = PAL.limeBright;
    ctx.strokeStyle = PAL.purpleInk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(5, W * 0.008), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 8. 画布内可直接拖拽的两个结构手柄：横梁升降柄 + 右足外展柄
  const drawHandle = (hx, hy, label, isErr, isBar) => {
    ctx.save();
    const r = Math.max(10, W * 0.0175);
    ctx.fillStyle = isErr ? PAL.err : PAL.ink;
    ctx.strokeStyle = PAL.paperLight;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 双向箭头（横梁上下 ↕ / 底足左右 ↔）
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${Math.round(r * 1.15)}px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isBar ? "↕" : "↔", hx, hy + 0.5);

    // 简洁外侧手柄名签（横梁柄在左侧向左排、底足柄在右侧居中上方排，绝不遮挡文字）
    ctx.font = `700 ${Math.max(10, Math.round(W * 0.0145))}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = isErr ? PAL.err : PAL.ink;
    if (isBar) {
      ctx.textAlign = "right";
      ctx.fillText(label, Math.max(44, hx - r - 6), hy + 4);
    } else {
      ctx.textAlign = "center";
      ctx.fillText(label, Math.min(W - 34, hx), hy - r - 6);
    }
    ctx.restore();
  };

  drawHandle(geom.handleBar.x * W, geom.handleBar.y * H, "拖横梁", !pillars.association.ok, true);
  drawHandle(geom.handleFoot.x * W, geom.handleFoot.y * H, "拉底座", !pillars.structure.ok, false);

  ctx.restore();
  return res;
}

// =========================================================================
// 03 节 · 深紫建筑暗房：四式图文嵌合实时对照画布
// =========================================================================
export function drawDarkroomCanvas(ctx, W, H, mode, blend, t) {
  // 深紫建筑暗室底
  ctx.fillStyle = PAL.darkBg;
  ctx.fillRect(0, 0, W, H);

  // 暗室网格
  ctx.strokeStyle = "rgba(183, 168, 223, 0.09)";
  ctx.lineWidth = 1;
  const g = Math.max(24, Math.round(W / 18));
  for (let x = g; x < W; x += g) {
    ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke();
  }
  for (let y = g; y < H; y += g) {
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
  }

  const cx = W * 0.5;
  const topY = H * 0.12;
  const botY = H * 0.86;
  const lh = botY - topY;
  const baseHalf = W * 0.25;
  const topHalf = W * 0.068;
  const legW = W * 0.088;
  const barY = topY + lh * 0.63;
  const barH = H * 0.092;

  const outerL = (y) => cx - (topHalf + ((y - topY) / lh) * (baseHalf - topHalf));
  const outerR = (y) => cx + (topHalf + ((y - topY) / lh) * (baseHalf - topHalf));

  const traceA = () => {
    ctx.beginPath();
    // 外轮廓顺时针
    ctx.moveTo(cx - topHalf, topY);
    ctx.lineTo(cx + topHalf, topY);
    ctx.lineTo(cx + baseHalf, botY);
    ctx.lineTo(cx + baseHalf - legW, botY);
    const barBot = barY + barH * 0.5;
    ctx.lineTo(outerR(barBot) - legW, barBot);
    ctx.lineTo(outerL(barBot) + legW, barBot);
    ctx.lineTo(cx - baseHalf + legW, botY);
    ctx.lineTo(cx - baseHalf, botY);
    ctx.closePath();
    // 内部字怀三角逆时针（evenodd 挖空）
    const barTop = barY - barH * 0.5;
    const apexY = topY + lh * 0.16;
    ctx.moveTo(cx, apexY);
    ctx.lineTo(outerL(barTop) + legW, barTop);
    ctx.lineTo(outerR(barTop) - legW, barTop);
    ctx.closePath();
  };

  // 画一幅建筑山海日轮几何图形（用于和字母嵌合）
  const drawSceneArt = (alpha = 1, offsetX = 0) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    // 渐变天幕
    const grad = ctx.createLinearGradient(0, topY, 0, botY);
    grad.addColorStop(0, "#4B3587");
    grad.addColorStop(0.55, "#8369C5");
    grad.addColorStop(1, "#3A276B");
    ctx.fillStyle = grad;
    ctx.fillRect(W * 0.14 + offsetX, topY, W * 0.72, lh);

    // 青柠日轮
    ctx.fillStyle = PAL.lime;
    ctx.beginPath();
    ctx.arc(cx + W * 0.05 + offsetX, topY + lh * 0.34, Math.min(W, H) * 0.115, 0, Math.PI * 2);
    ctx.fill();

    // 建筑阶梯斜坡
    ctx.fillStyle = "#160E2A";
    ctx.beginPath();
    ctx.moveTo(W * 0.14 + offsetX, botY);
    ctx.lineTo(W * 0.36 + offsetX, topY + lh * 0.54);
    ctx.lineTo(W * 0.56 + offsetX, topY + lh * 0.74);
    ctx.lineTo(W * 0.78 + offsetX, topY + lh * 0.44);
    ctx.lineTo(W * 0.86 + offsetX, botY);
    ctx.closePath();
    ctx.fill();

    // 暖丁香建筑光条
    ctx.strokeStyle = "#E4EC58";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const y = topY + lh * (0.24 + i * 0.16);
      ctx.beginPath();
      ctx.moveTo(W * 0.20 + offsetX, y);
      ctx.lineTo(W * 0.80 + offsetX, y - lh * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  };

  const b = Math.max(0, Math.min(1, blend));

  if (mode === "mask") {
    // 1. 轮廓遮罩：画面只留在字母笔画内（blend 过低=图太淡看不清，过高=外部噪点溢出来破坏字轮廓）
    if (b > 0.76) {
      drawSceneArt((b - 0.76) * 2.4);
    }
    ctx.save();
    traceA();
    ctx.clip("evenodd");
    ctx.fillStyle = "#3E2C6E";
    ctx.fillRect(0, 0, W, H);
    drawSceneArt(0.22 + b * 0.78);
    ctx.restore();

    ctx.save();
    traceA();
    ctx.strokeStyle = b > 0.76 ? PAL.err : PAL.limeBright;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  } else if (mode === "window") {
    // 2. 字怀作窗：字母实底稳重，视觉焦点精准落进中间三角字怀窗洞内
    ctx.save();
    traceA();
    ctx.fillStyle = PAL.purple;
    ctx.fill("evenodd");
    ctx.restore();

    const barTop = barY - barH * 0.5;
    const apexY = topY + lh * 0.16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, apexY);
    ctx.lineTo(outerL(barTop) + legW, barTop);
    ctx.lineTo(outerR(barTop) - legW, barTop);
    ctx.closePath();
    ctx.clip();
    drawSceneArt(0.18 + b * 0.82);
    ctx.restore();

    // 窗框青柠虚线
    ctx.save();
    ctx.strokeStyle = b < 0.25 ? PAL.err : PAL.limeBright;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, apexY + 4);
    ctx.lineTo(outerL(barTop) + legW + 5, barTop - 4);
    ctx.lineTo(outerR(barTop) - legW - 5, barTop - 4);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  } else if (mode === "weave") {
    // 3. 笔画穿插：青柠圆环/光带穿过字母的一条腿（前遮后绕，制造纵深）
    const shift = (b - 0.5) * W * 0.22;
    const bandY = topY + lh * 0.44;
    const bandH = H * 0.105;

    // 先画带子左半（压在左腿后面）
    ctx.save();
    ctx.fillStyle = PAL.lime;
    ctx.fillRect(W * 0.14 + shift, bandY, W * 0.36, bandH);
    ctx.restore();

    // 再画巨型紫 A
    ctx.save();
    traceA();
    ctx.fillStyle = PAL.purple;
    ctx.fill("evenodd");
    ctx.restore();

    // 再画带子右半（穿出并压在右腿前面，形成一后一前的真实空间穿插！）
    ctx.save();
    ctx.fillStyle = b > 0.8 ? "#FF8AA0" : PAL.lime;
    ctx.fillRect(cx + shift * 0.4, bandY, W * 0.34, bandH);
    ctx.fillStyle = PAL.darkBg;
    ctx.font = `700 ${Math.max(11, Math.round(W * 0.022))}px "Unbounded", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("DEPTH LAYER", cx + 10 + shift * 0.4, bandY + bandH * 0.64);
    ctx.restore();
  } else {
    // 4. 横梁托文：字母作信息货架，斜边与横梁承托所有文字层级
    ctx.save();
    traceA();
    ctx.fillStyle = `rgba(158, 139, 210, ${0.35 + b * 0.65})`;
    ctx.fill("evenodd");
    ctx.restore();

    // 沿横梁托主副标
    ctx.fillStyle = PAL.limeBright;
    ctx.font = `700 ${Math.max(12, Math.round(W * 0.025))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("横梁就是天然水平基准线", cx, barY + 5);

    // 沿两足托底注
    ctx.fillStyle = "#E5E0EE";
    ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.017))}px "Space Mono", monospace`;
    ctx.fillText("LEFT FOOT · DATE", cx - baseHalf * 0.55, botY + H * 0.065);
    ctx.fillText("RIGHT FOOT · HALL", cx + baseHalf * 0.55, botY + H * 0.065);

    // 若显形度过低则标红提示字母轮廓隐没
    if (b < 0.22) {
      ctx.strokeStyle = "#FF8AA0";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.6;
      traceA();
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 右下暗房读数水印（高对比浅字）
  ctx.fillStyle = "rgba(239, 236, 242, 0.78)";
  ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.016))}px "Space Mono", monospace`;
  ctx.textAlign = "right";
  ctx.fillText(`INTEGRATION ${Math.round(b * 100)}%`, W - 16, H - 14);
}
