// 066 前景框架构图 — 高清 2D Canvas 绘制引擎（开场穿框舞台 & 缩略标本共用单真源几何）
import { PALETTE } from "./palette.js";
import { apertureGeometry, parallaxLayers, subjectBlueprint } from "./model.js";

// 将归一化坐标转像素坐标
const px = (u, w) => u * w;
const py = (v, h) => v * h;

// 缓存高反差雕花菱格图案（单次 fillRect 渲染，避免每帧数百次路径绘制，确保软件渲染 60fps）
let busyTileCache = { size: 0, pattern: null, canvas: null };
function getBusyPattern(ctx, w) {
  const cell = Math.max(24, Math.round(w * 0.052));
  if (busyTileCache.size !== cell || !busyTileCache.canvas) {
    const tile = document.createElement("canvas");
    tile.width = cell;
    tile.height = cell;
    const tctx = tile.getContext("2d");
    tctx.fillStyle = "#F5CEC2";
    tctx.fillRect(0, 0, cell, cell);

    // 对角菱格斜线
    tctx.strokeStyle = "#8C2634";
    tctx.lineWidth = Math.max(2, w * 0.005);
    tctx.beginPath();
    tctx.moveTo(0, 0);
    tctx.lineTo(cell, cell);
    tctx.moveTo(cell, 0);
    tctx.lineTo(0, cell);
    tctx.stroke();

    // 中心亮米雕花菱片
    const mid = cell * 0.5;
    const s = cell * 0.24;
    tctx.fillStyle = "#FFF7EE";
    tctx.strokeStyle = "#531A26";
    tctx.lineWidth = 1.4;
    tctx.beginPath();
    tctx.moveTo(mid, mid - s);
    tctx.lineTo(mid + s, mid);
    tctx.lineTo(mid, mid + s);
    tctx.lineTo(mid - s, mid);
    tctx.closePath();
    tctx.fill();
    tctx.stroke();

    busyTileCache = { size: cell, canvas: tile, pattern: ctx.createPattern(tile, "repeat") };
  }
  return ctx.createPattern(busyTileCache.canvas, "repeat");
}

// 绘制三种远中景题材（始终使用真实视差位移）
export function drawSceneContent(ctx, w, h, state, time = 0) {
  const aspect = w / Math.max(h, 1);
  const { midShiftX, subjectShiftX } = parallaxLayers(state.stanceX);
  const subj = subjectBlueprint(state, aspect);

  if (state.scene === "poster") {
    // 1:1 化用 066 原海报：暖米天空、浅粉日轮、深酒红主峰、左右梅红与粉玫丘陵、桃粉水波
    ctx.fillStyle = PALETTE.archInner;
    ctx.fillRect(0, 0, w, h);

    // 浅粉日轮（微呼吸光晕，reducedMotion 时静止）
    const sunX = px(subj.sun.u, w);
    const sunY = py(subj.sun.v, h);
    const sunR = subj.sun.rY * h;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.sunBlush;
    ctx.fill();

    // 远方主体：深酒红三角孤峰
    ctx.beginPath();
    ctx.moveTo(px(subj.peak.tip.u, w), py(subj.peak.tip.v, h));
    ctx.lineTo(px(subj.peak.right.u, w), py(subj.peak.right.v, h));
    ctx.lineTo(px(subj.peak.left.u, w), py(subj.peak.left.v, h));
    ctx.closePath();
    ctx.fillStyle = PALETTE.peakMaroon;
    ctx.fill();

    // 中景左丘陵（梅红，受中景视差驱动）
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, h * 0.65);
    ctx.quadraticCurveTo(w * (0.28 + midShiftX), h * 0.54, w * (0.64 + midShiftX), h * 0.64);
    ctx.lineTo(w * 1.2, h * 0.64);
    ctx.lineTo(w * 1.2, h);
    ctx.lineTo(-w * 0.2, h);
    ctx.closePath();
    ctx.fillStyle = PALETTE.midHillPlum;
    ctx.fill();

    // 中景右柔坡（粉玫瑰）
    ctx.beginPath();
    ctx.moveTo(w * (0.48 + midShiftX), h * 0.64);
    ctx.quadraticCurveTo(w * (0.76 + midShiftX), h * 0.545, w * 1.25, h * 0.625);
    ctx.lineTo(w * 1.25, h * 0.66);
    ctx.lineTo(w * (0.45 + midShiftX), h * 0.66);
    ctx.closePath();
    ctx.fillStyle = PALETTE.rightHillRose;
    ctx.fill();

    // 桃粉湖面与水平细波光（完全复刻原海报）
    ctx.fillStyle = PALETTE.waterPeach;
    ctx.fillRect(0, h * 0.632, w, h * 0.37);

    // 水面顶部微阴影带
    ctx.fillStyle = "rgba(175, 90, 98, 0.18)";
    ctx.fillRect(0, h * 0.632, w, h * 0.016);

    // 柔和水平水波短线
    const waveDrift = Math.sin(time * 0.9) * w * 0.004;
    const ripples = [
      [0.24, 0.675, 0.16], [0.54, 0.675, 0.22],
      [0.36, 0.708, 0.18], [0.65, 0.708, 0.11],
      [0.29, 0.742, 0.13], [0.47, 0.742, 0.21],
      [0.38, 0.778, 0.19], [0.63, 0.778, 0.12],
      [0.33, 0.815, 0.24],
    ];
    ctx.strokeStyle = PALETTE.waterShimmer;
    ctx.lineWidth = Math.max(1.5, h * 0.0055);
    ctx.lineCap = "round";
    for (let i = 0; i < ripples.length; i++) {
      const [ru, rv, rlen] = ripples[i];
      const off = (i % 2 === 0 ? 1 : -1) * waveDrift;
      ctx.beginPath();
      ctx.moveTo(px(ru + midShiftX * 0.7, w) + off, py(rv, h));
      ctx.lineTo(px(ru + rlen + midShiftX * 0.7, w) + off, py(rv, h));
      ctx.stroke();
    }
    return;
  }

  if (state.scene === "garden") {
    // 江南园林：暖宣天光、浅月、远黛、水榭亭影与石拱桥
    ctx.fillStyle = "#F7EDE0";
    ctx.fillRect(0, 0, w, h);

    // 淡月
    ctx.beginPath();
    ctx.arc(px(subj.moon.u, w), py(subj.moon.v, h), subj.moon.rY * h, 0, Math.PI * 2);
    ctx.fillStyle = "#E8A7A1";
    ctx.fill();

    // 远山薄雾
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, h * 0.62);
    ctx.quadraticCurveTo(w * (0.34 + subjectShiftX), h * 0.45, w * (0.68 + subjectShiftX), h * 0.56);
    ctx.quadraticCurveTo(w * (0.9 + subjectShiftX), h * 0.49, w * 1.2, h * 0.62);
    ctx.lineTo(w * 1.2, h);
    ctx.lineTo(-w * 0.2, h);
    ctx.closePath();
    ctx.fillStyle = "#E2ABA7";
    ctx.fill();

    // 主体：深酒红江南飞檐水榭
    const px0 = px(subj.pavilion.u, w);
    const py0 = py(subj.pavilion.v, h);
    const pw = subj.pavilion.w * w;
    const ph = subj.pavilion.h * h;
    ctx.fillStyle = "#4A1822";
    // 上翘飞檐顶
    ctx.beginPath();
    ctx.moveTo(px0, py0 - ph * 0.58);
    ctx.quadraticCurveTo(px0 + pw * 0.28, py0 - ph * 0.26, px0 + pw * 0.62, py0 - ph * 0.28);
    ctx.lineTo(px0 + pw * 0.45, py0 - ph * 0.14);
    ctx.lineTo(px0 - pw * 0.45, py0 - ph * 0.14);
    ctx.lineTo(px0 - pw * 0.62, py0 - ph * 0.28);
    ctx.quadraticCurveTo(px0 - pw * 0.28, py0 - ph * 0.26, px0, py0 - ph * 0.58);
    ctx.closePath();
    ctx.fill();
    // 亭柱与底座
    const colW = Math.max(2.5, pw * 0.065);
    ctx.fillRect(px0 - pw * 0.34, py0 - ph * 0.14, colW, ph * 0.46);
    ctx.fillRect(px0 + pw * 0.34 - colW, py0 - ph * 0.14, colW, ph * 0.46);
    ctx.fillRect(px0 - pw * 0.08, py0 - ph * 0.14, colW * 0.8, ph * 0.46);
    ctx.fillRect(px0 - pw * 0.46, py0 + ph * 0.30, pw * 0.92, ph * 0.12);

    // 湖水与石桥弧
    ctx.fillStyle = "#F0C3B8";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.beginPath();
    ctx.moveTo(w * (0.14 + midShiftX), h * 0.66);
    ctx.quadraticCurveTo(w * (0.50 + midShiftX), h * 0.57, w * (0.88 + midShiftX), h * 0.66);
    ctx.lineTo(w * (0.88 + midShiftX), h * 0.70);
    ctx.quadraticCurveTo(w * (0.50 + midShiftX), h * 0.625, w * (0.14 + midShiftX), h * 0.70);
    ctx.closePath();
    ctx.fillStyle = "#9D4E58";
    ctx.fill();
    return;
  }

  // corridor：暗室门廊尽头的明亮拱窗与静立人物背影（纯几何剪影，零五官）
  ctx.fillStyle = "#EAD1C5";
  ctx.fillRect(0, 0, w, h);

  // 两侧纵深廊壁
  const wx = px(subj.windowBox.u, w);
  const wy = py(subj.windowBox.v, h);
  const ww = subj.windowBox.w * w;
  const wh = subj.windowBox.h * h;

  ctx.fillStyle = "#CFA29B";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(wx - ww * 0.85, wy - wh * 0.62);
  ctx.lineTo(wx - ww * 0.85, wy + wh * 0.62);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(wx + ww * 0.85, wy - wh * 0.62);
  ctx.lineTo(wx + ww * 0.85, wy + wh * 0.62);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // 明亮远窗
  ctx.fillStyle = "#FFF7EE";
  ctx.fillRect(wx - ww * 0.56, wy - wh * 0.52, ww * 1.12, wh * 1.04);

  // 地面反光梯形光毯
  ctx.fillStyle = "rgba(255, 245, 232, 0.72)";
  ctx.beginPath();
  ctx.moveTo(wx - ww * 0.56, wy + wh * 0.52);
  ctx.lineTo(wx + ww * 0.56, wy + wh * 0.52);
  ctx.lineTo(wx + ww * 1.35 + midShiftX * w * 0.4, h);
  ctx.lineTo(wx - ww * 1.35 + midShiftX * w * 0.4, h);
  ctx.closePath();
  ctx.fill();

  // 静立窗前的简洁人物背影（仅头肩大衣纯色剪影，绝不画五官）
  const fx = px(subj.figure.u, w);
  const fy = py(subj.figure.v, h);
  const fh = subj.figure.h * h;
  const fw = subj.figure.w * w;
  ctx.fillStyle = "#3C0D17";
  // 头
  ctx.beginPath();
  ctx.arc(fx, fy - fh * 0.34, fh * 0.145, 0, Math.PI * 2);
  ctx.fill();
  // 肩与长风衣轮廓
  ctx.beginPath();
  ctx.moveTo(fx - fw * 0.48, fy - fh * 0.14);
  ctx.quadraticCurveTo(fx, fy - fh * 0.24, fx + fw * 0.48, fy - fh * 0.14);
  ctx.lineTo(fx + fw * 0.56, fy + fh * 0.52);
  ctx.lineTo(fx - fw * 0.56, fy + fh * 0.52);
  ctx.closePath();
  ctx.fill();
}

// 构造前景框口路径（供 even-odd 挖空绘制使用，与 model.js 数学定义 100% 同步）
export function traceAperturePath(ctx, w, h, geom) {
  if (geom.kind === "arch") {
    const cx = px(geom.cx, w);
    const cy = py(geom.cy, h);
    const r = geom.rY * h;
    const floorY = cy + r * 0.92;
    const dy = floorY - cy;
    const dx = Math.sqrt(Math.max(0, r * r - dy * dy));
    const startAng = Math.atan2(dy, dx);
    const endAng = Math.PI - startAng;
    // 必须先 moveTo 到弧起点，否则 even-odd 前的 rect 子路径会把 (0,0) 连进框口
    ctx.moveTo(cx + Math.cos(startAng) * r, cy + Math.sin(startAng) * r);
    ctx.arc(cx, cy, r, startAng, endAng, true);
    ctx.closePath();
    return;
  }

  if (geom.kind === "natural") {
    const cx = px(geom.cx, w);
    const cy = py(geom.cy, h);
    const steps = 96;
    for (let i = 0; i <= steps; i++) {
      const ang = (i / steps) * Math.PI * 2;
      const wobble = 1 + 0.085 * Math.cos(ang * 3 + 0.5) + 0.055 * Math.sin(ang * 5 - 0.8);
      const r = geom.rY * h * wobble;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    return;
  }

  if (geom.kind === "geometric") {
    const cx = px(geom.cx, w);
    const cy = py(geom.cy, h);
    const rx = geom.halfX * w;
    const ry = geom.halfY * h;
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx - rx, cy);
    ctx.closePath();
    return;
  }

  // occlude：带右下角斜切墙面的建筑半围合框口
  const l = px(geom.left, w);
  const r = px(geom.right, w);
  const t = py(geom.top, h);
  const b = py(geom.bottom, h);
  const cut = Math.min((r - l) * 0.42, (b - t) * 0.38) * (1.15 - geom.s * 0.35);
  ctx.moveTo(l, t);
  ctx.lineTo(r, t);
  ctx.lineTo(r, b - cut);
  ctx.lineTo(r - cut * 1.35, b);
  ctx.lineTo(l, b);
  ctx.closePath();
}

// 绘制框内杂枝干扰（开场错态：探入框口抢占留白）
function drawInnerClutter(ctx, w, h, geom) {
  const cx = px(geom.cx, w);
  const cy = py(geom.cy, h);
  const span = Math.min(w, h) * 0.24;

  ctx.save();
  ctx.strokeStyle = "#45131E";
  ctx.fillStyle = "#591E2A";
  ctx.lineWidth = Math.max(2.2, w * 0.0075);
  ctx.lineCap = "round";

  // 左侧探入的杂乱枯枝与碎叶团
  ctx.beginPath();
  ctx.moveTo(cx - span * 0.95, cy - span * 0.55);
  ctx.quadraticCurveTo(cx - span * 0.32, cy - span * 0.14, cx + span * 0.24, cy + span * 0.05);
  ctx.moveTo(cx - span * 0.55, cy - span * 0.32);
  ctx.lineTo(cx - span * 0.08, cy - span * 0.58);
  ctx.moveTo(cx - span * 0.28, cy - span * 0.16);
  ctx.lineTo(cx + span * 0.12, cy - span * 0.36);
  ctx.stroke();

  const blobs = [
    [-0.22, -0.34, 0.12, 0.055, -0.5],
    [0.08, -0.18, 0.13, 0.055, 0.35],
    [0.18, 0.06, 0.14, 0.052, -0.2],
    [-0.08, -0.02, 0.11, 0.05, 0.7],
  ];
  for (const [bx, by, rx, ry, rot] of blobs) {
    ctx.beginPath();
    ctx.ellipse(cx + bx * span, cy + by * span, rx * span, ry * span, rot, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 绘制前景框架实体（使用 even-odd 挖出框口，并附加各原型细节与明暗/噪声模式）
export function drawForegroundFrame(ctx, w, h, state, geom) {
  const isBusy = state.toneMode === "busy";
  const isDark = state.toneMode === "dark";
  const isGhost = state.toneMode === "ghost";

  ctx.save();
  // 构造外框减内洞的复合裁剪区
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  traceAperturePath(ctx, w, h, geom);
  ctx.clip("evenodd");

  // 1. 基底填充
  if (isDark) {
    ctx.fillStyle = PALETTE.pillarBurgundy;
    ctx.fillRect(0, 0, w, h);
    // 微弱内檐层次阴影
    ctx.fillStyle = "#3A0B14";
    ctx.fillRect(0, h * 0.76, w, h * 0.24);
  } else if (isGhost) {
    ctx.fillStyle = "rgba(235, 218, 207, 0.78)";
    ctx.fillRect(0, 0, w, h);
  } else if (isBusy) {
    // 翻车错态：过度繁复的高反差建筑雕花菱格亮框（预烘瓦片单次平铺，极速渲染）
    ctx.fillStyle = getBusyPattern(ctx, w);
    ctx.fillRect(0, 0, w, h);
  } else {
    // 合法纯平玫瑰框：忠实还原 066 原海报结构——玫瑰珊瑚主拱 + 左下深酒红体块阴影 + 外沿暖米切角呼吸
    ctx.fillStyle = PALETTE.archCoral;
    ctx.fillRect(0, 0, w, h);

    // 复刻 066 原海报左下方深酒红斜切暗面（增强前景厚度与层次）
    ctx.fillStyle = PALETTE.pillarBurgundy;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.44);
    ctx.quadraticCurveTo(w * 0.14, h * 0.78, w * 0.52, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 复刻 066 原海报拱框最外缘微露的暖杏米纸拱弧（仅在 arch 模式下更贴合原海报标志造型）
    if (geom.kind === "arch") {
      const cx = px(geom.cx, w);
      const cy = py(geom.cy, h);
      const outerR = Math.max(geom.rY * h + Math.min(w, h) * 0.11, Math.min(w, h) * 0.54);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.moveTo(cx + outerR, cy);
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      ctx.fillStyle = PALETTE.paperCream;
      ctx.fillRect(0, 0, w, h * 0.66);
      ctx.restore();
    }
  }

  // 2. 按不同原型添上标志性极简几何/自然收边细节（非幽灵态下可见）
  if (!isGhost && !isBusy) {
    if (geom.kind === "natural") {
      // 柔和的枝叶剪影沿框缘微探（留出干净画心）
      const cx = px(geom.cx, w);
      const cy = py(geom.cy, h);
      const r = geom.rY * h;
      ctx.fillStyle = isDark ? "#2D0710" : PALETTE.plumCard;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.28;
        const lx = cx + Math.cos(a) * (r * 1.12);
        const ly = cy + Math.sin(a) * (r * 1.12);
        ctx.beginPath();
        ctx.ellipse(lx, ly, r * 0.22, r * 0.085, a + 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (geom.kind === "geometric") {
      // 内檐细线双框，强化建筑几何感
      ctx.strokeStyle = isDark ? "rgba(238,170,166,0.45)" : "rgba(58,11,20,0.22)";
      ctx.lineWidth = Math.max(1.2, w * 0.003);
      ctx.beginPath();
      traceAperturePath(ctx, w, h, { ...geom, halfX: geom.halfX * 1.07, halfY: geom.halfY * 1.07 });
      ctx.stroke();
    } else if (geom.kind === "occlude") {
      // 右下斜墙加深分层，还原 066 原海报第 4 张「遮挡框架」的双面明暗
      const r = px(geom.right, w);
      const b = py(geom.bottom, h);
      ctx.fillStyle = isDark ? "#2A060E" : PALETTE.peakMaroon;
      ctx.beginPath();
      ctx.moveTo(r * 0.72, h);
      ctx.lineTo(w, b * 0.62);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // 框口边缘细描边（幽灵态用极淡虚线提示它快融进背景）
  ctx.save();
  ctx.beginPath();
  traceAperturePath(ctx, w, h, geom);
  if (isGhost) {
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(140, 50, 59, 0.35)";
    ctx.lineWidth = 1.25;
  } else {
    ctx.strokeStyle = isBusy ? "#3A0B14" : isDark ? "rgba(248, 234, 220, 0.35)" : "rgba(58, 11, 20, 0.28)";
    ctx.lineWidth = Math.max(1.2, w * 0.0028);
  }
  ctx.stroke();
  ctx.restore();
}

// 绘制单真源测量导视线与原海报风格圆点虚线引注（以及框口边缘拉环坐标）
export function drawGuidesAndHandle(ctx, w, h, state, evalRes, time = 0) {
  const { geom, subj, apertureCentroid, isPass, pillars } = evalRes;
  const acX = px(apertureCentroid.u, w);
  const acY = py(apertureCentroid.v, h);
  const scX = px(subj.cx, w);
  const scY = py(subj.cy, h);

  // 计算可拖拽的框口边缘拉环坐标（右侧框口内沿中点）
  let rimX = px(geom.cx, w);
  let rimY = py(geom.cy, h);
  if (geom.kind === "arch" || geom.kind === "natural") {
    const r = geom.rY * h * (geom.kind === "natural" ? 1.04 : 1);
    rimX = clampPx(px(geom.cx, w) + r, 24, w - 24);
    rimY = py(geom.cy, h);
  } else if (geom.kind === "geometric") {
    rimX = clampPx(px(geom.cx + geom.halfX, w), 24, w - 24);
    rimY = py(geom.cy, h);
  } else {
    rimX = clampPx(px(geom.right, w), 24, w - 24);
    rimY = py((geom.top + geom.bottom) * 0.45, h);
  }

  if (state.showGuides || state.highlightPart) {
    ctx.save();
    const hl = state.highlightPart;
    const accent = isPass ? PALETTE.okLight : PALETTE.errLight;

    // 1. 框口边界高亮（点击左栏「框口」或存在框口问题时强调）
    if (hl === "frame" || !pillars.okFrame) {
      ctx.save();
      ctx.beginPath();
      traceAperturePath(ctx, w, h, geom);
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = pillars.okFrame ? PALETTE.okLight : PALETTE.errLight;
      ctx.lineWidth = hl === "frame" ? 2.6 : 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // 2. 主体落位与被裁切警示框（点击左栏「主体」或主体被切时显示）
    if (hl === "enclose" || evalRes.clipRatio > 0.05) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = pillars.okEnclose ? PALETTE.okLight : PALETTE.errLight;
      ctx.lineWidth = hl === "enclose" ? 2.2 : 1.5;
      const rad = subj.radiusY * h * 0.92;
      ctx.beginPath();
      ctx.arc(scX, scY, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. 视线导向虚线与收敛光点（从框口四周汇向主体或暴露偏移差）
    const showRay = state.showGuides || hl === "guide";
    if (showRay) {
      ctx.save();
      // 四向边框导引短箭（沿框口内壁指向框心）
      const rayColor = pillars.okGuide ? "rgba(30, 96, 84, 0.72)" : "rgba(181, 35, 40, 0.76)";
      ctx.strokeStyle = rayColor;
      ctx.fillStyle = rayColor;
      ctx.lineWidth = hl === "guide" ? 2 : 1.35;
      ctx.setLineDash([3, 4]);

      // 连线：框口几何中心 → 主体实际重心
      if (evalRes.gazeOffset > 0.04) {
        ctx.beginPath();
        ctx.moveTo(acX, acY);
        ctx.lineTo(scX, scY);
        ctx.stroke();
      }

      // 原海报标志圆点锚标：框口中心空心圆 + 主体重心实心圆
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(acX, acY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.paperCream;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(scX, scY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();

      // 动态微光视线粒子沿框缘向画心汇流（开场和调优时清晰演示视线导向）
      const pulse = (time * 0.55) % 1;
      const dirs = [
        [-1, -0.6], [1, -0.6], [-1, 0.65], [1, 0.65],
      ];
      const baseR = Math.min(w, h) * (0.14 + state.apertureSize * 0.24);
      for (const [dx, dy] of dirs) {
        const len = Math.hypot(dx, dy);
        const nx = dx / len;
        const ny = dy / len;
        const startX = acX + nx * baseR;
        const startY = acY + ny * baseR;
        const endX = acX + nx * (baseR * 0.42);
        const endY = acY + ny * (baseR * 0.42);
        const pxCur = startX + (endX - startX) * pulse;
        const pyCur = startY + (endY - startY) * pulse;
        ctx.beginPath();
        ctx.arc(pxCur, pyCur, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pillars.okGuide ? "rgba(30, 96, 84, 0.55)" : "rgba(181, 35, 40, 0.45)";
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // 绘制可抓握的框口开合拉环（嵌在框口内壁上的弧形开合扣）
  ctx.save();
  ctx.beginPath();
  ctx.arc(rimX, rimY, 11, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.inkMaroon;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.paperCream;
  ctx.stroke();

  // 拉环内双向小箭头 ‹ ›
  ctx.strokeStyle = PALETTE.paperCream;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(rimX - 4.5, rimY);
  ctx.lineTo(rimX - 2, rimY - 2.8);
  ctx.moveTo(rimX - 4.5, rimY);
  ctx.lineTo(rimX - 2, rimY + 2.8);
  ctx.moveTo(rimX + 4.5, rimY);
  ctx.lineTo(rimX + 2, rimY - 2.8);
  ctx.moveTo(rimX + 4.5, rimY);
  ctx.lineTo(rimX + 2, rimY + 2.8);
  ctx.stroke();
  ctx.restore();

  return { rimX, rimY, acX, acY, scX, scY };
}

function clampPx(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// 顶层完整渲染函数（开场主舞台使用）
export function renderHeroStage(ctx, w, h, state, evalRes, time = 0) {
  ctx.clearRect(0, 0, w, h);
  drawSceneContent(ctx, w, h, state, time);
  if (state.clutter) {
    drawInnerClutter(ctx, w, h, evalRes.geom);
  }
  drawForegroundFrame(ctx, w, h, state, evalRes.geom);
  const handles = drawGuidesAndHandle(ctx, w, h, state, evalRes, time);
  return handles;
}
