// 083 浅景深构图 — 高帧率 2D Canvas 光学渲染引擎
// 采用「预烘焙无滤镜多阶虚化金字塔 + 真实光圈多边形散景光斑」，
// 在 6× CPU 降速与软件渲染下依然维持流畅 60 FPS，同时精确响应 model.js 单真源弥散圆。

import { bgCompressionScale, clamp, cocToCanvasBlurPx, formatAperture, formatDof } from "./model.js";

// 逐像素采自 083 原海报的光学配色常量
export const PALETTE = {
  paper: "#F8EFE0",
  paperWarm: "#F4E8D5",
  paperCard: "#F8ECDB",
  tealDeep: "#01585F",
  tealFrame: "#1D6164",
  tealMid: "#0B7780",
  tealSoft: "#59A4A8",
  tealMuted: "#527779",
  coral: "#EF411D",
  coralSoft: "#E3552F",
  coralBright: "#F98052",
  coralDeep: "#C93919",
  coralBokeh: "#F6916D",
  ink: "#111D21",
  inkBody: "#252B30",
  olive: "#50513A",
  darkBg: "#07262B",
  darkCard: "#0D343A",
  darkCoral: "#FF845E",
  darkAqua: "#63DCE0",
};

const SPRITE_W = 420;
const SPRITE_H = 304;

// ---------- 零 ctx.filter 预烘焙多阶虚化金字塔 ----------
// 通过渐进降采样 + 5-tap 核生成 5 档平滑虚化图；运行时仅需轻量双线性 drawImage，慢手机软件渲染也可稳跑高帧率。
function buildMipPyramid(baseCanvas) {
  const levels = [baseCanvas];
  const scales = [0.52, 0.25, 0.13, 0.07]; // 对应约 0px / 3px / 8px / 18px / 34px 柔和虚化
  let prev = baseCanvas;
  for (const sc of scales) {
    const sw = Math.max(18, Math.round(SPRITE_W * sc));
    const sh = Math.max(14, Math.round(SPRITE_H * sc));
    const tiny = document.createElement("canvas");
    tiny.width = sw;
    tiny.height = sh;
    const tctx = tiny.getContext("2d");
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = "high";
    tctx.drawImage(prev, 0, 0, sw, sh);

    const blurStep = document.createElement("canvas");
    blurStep.width = sw;
    blurStep.height = sh;
    const bctx = blurStep.getContext("2d");
    bctx.imageSmoothingEnabled = true;
    bctx.imageSmoothingQuality = "high";
    const taps = [
      [0, 0, 0.34],
      [-0.9, 0, 0.165],
      [0.9, 0, 0.165],
      [0, -0.9, 0.165],
      [0, 0.9, 0.165],
    ];
    for (const [dx, dy, a] of taps) {
      bctx.globalAlpha = a;
      bctx.drawImage(tiny, dx, dy);
    }
    bctx.globalAlpha = 1;

    levels.push(blurStep);
    prev = blurStep;
  }
  return levels;
}

function makeSprite(drawFn) {
  const c = document.createElement("canvas");
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const ctx = c.getContext("2d");
  // 内部矢量坐标按 540×390 设计，缩放到 SPRITE_W×SPRITE_H 预烘焙
  ctx.scale(SPRITE_W / 540, SPRITE_H / 390);
  drawFn(ctx, 540, 390);
  return buildMipPyramid(c);
}

// 按物理弥散圆像素半径从 5 档金字塔绘出（使用中速双线性插值并合并边界档位，把软件渲染耗时降到最低）
function drawBlurredPyramid(ctx, pyramid, blurPx, x, y, w, h, alpha = 1) {
  const stops = [0, 3.2, 8.5, 18.5, 34];
  let idx = 0;
  let frac = 0;
  if (blurPx >= stops[4]) {
    idx = 4;
    frac = 0;
  } else {
    for (let i = 0; i < 4; i++) {
      if (blurPx >= stops[i] && blurPx <= stops[i + 1]) {
        idx = i;
        frac = (blurPx - stops[i]) / (stops[i + 1] - stops[i]);
        break;
      }
    }
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";
  if (frac <= 0.12 || idx === 4) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(pyramid[idx], x, y, w, h);
  } else if (frac >= 0.88) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(pyramid[idx + 1], x, y, w, h);
  } else {
    ctx.globalAlpha = alpha * (1 - frac);
    ctx.drawImage(pyramid[idx], x, y, w, h);
    ctx.globalAlpha = alpha * frac;
    ctx.drawImage(pyramid[idx + 1], x, y, w, h);
  }
  ctx.globalAlpha = 1;
}

// 预烘焙光斑印章缓存（按色值+形状缓存 64×64 离屏印章，彻底避免每帧创建 radialGradient）
const bokehStampCache = new Map();
function getBokehStamp(color, shapeKey) {
  const key = `${color}|${shapeKey}`;
  if (bokehStampCache.has(key)) return bokehStampCache.get(key);
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  const cx = s / 2;
  const cy = s / 2;
  const r = 25;
  const isPolygon = shapeKey !== "round";
  const sides = shapeKey === "hex" ? 6 : 7;

  const traceShape = (rad) => {
    ctx.beginPath();
    if (!isPolygon) {
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    } else {
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * Math.PI * 2;
        const a1 = ((i + 1) / sides) * Math.PI * 2;
        const am = (a0 + a1) * 0.5;
        const x0 = cx + Math.cos(a0) * rad;
        const y0 = cy + Math.sin(a0) * rad;
        const x1 = cx + Math.cos(a1) * rad;
        const y1 = cy + Math.sin(a1) * rad;
        const xm = cx + Math.cos(am) * rad * 1.045;
        const ym = cy + Math.sin(am) * rad * 1.045;
        if (i === 0) ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(xm, ym, x1, y1);
      }
      ctx.closePath();
    }
  };

  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.2);
  g.addColorStop(0, color);
  g.addColorStop(0.72, color);
  g.addColorStop(1, "rgba(248, 239, 224, 0)");
  ctx.fillStyle = g;
  traceShape(r * 1.2);
  ctx.fill();

  if (isPolygon) {
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#FFF8EC";
    ctx.lineWidth = 1.4;
    traceShape(r * 0.92);
    ctx.stroke();
  }
  bokehStampCache.set(key, c);
  return c;
}

// 绘制单枚具有真实光圈叶片形状与柔和边缘的光学散景圆盘（单次 drawImage 极速印章）
function drawApertureBokehDisc(ctx, cx, cy, radius, color, alpha, aperture) {
  if (radius < 1.8 || alpha <= 0.02) return;
  const shapeKey = aperture >= 5.6 ? "hex" : aperture >= 2.6 ? "hept" : "round";
  const stamp = getBokehStamp(color, shapeKey);
  const size = radius * 2.56;
  ctx.globalAlpha = alpha;
  ctx.drawImage(stamp, cx - size * 0.5, cy - size * 0.5, size, size);
  ctx.globalAlpha = 1;
}

// ---------- 三套 5 深度层矢量场景精灵预烘焙 ----------
const spriteCache = new Map();

function drawPoppyPetal(ctx, cx, cy, rx, ry, rot, cLight, cMid, cDeep) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, ry * 0.45);
  ctx.bezierCurveTo(-rx * 1.08, ry * 0.22, -rx * 0.96, -ry * 0.78, -rx * 0.16, -ry * 0.98);
  ctx.bezierCurveTo(rx * 0.02, -ry * 1.04, rx * 0.24, -ry * 0.94, rx * 0.48, -ry * 0.88);
  ctx.bezierCurveTo(rx * 1.08, -ry * 0.64, rx * 0.98, ry * 0.28, 0, ry * 0.45);
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, ry * 0.12, rx * 0.08, 0, -ry * 0.2, Math.max(rx, ry) * 1.1);
  grad.addColorStop(0, cDeep);
  grad.addColorStop(0.42, cMid);
  grad.addColorStop(0.86, cLight);
  grad.addColorStop(1, "#FBB188");
  ctx.fillStyle = grad;
  ctx.fill();

  // 虞美人标志性的绉纸般放射状细脉
  ctx.strokeStyle = "rgba(182, 46, 18, 0.22)";
  ctx.lineWidth = 0.85;
  for (let i = -5; i <= 5; i++) {
    const t = i / 5;
    ctx.beginPath();
    ctx.moveTo(t * rx * 0.14, ry * 0.28);
    ctx.quadraticCurveTo(t * rx * 0.56, -ry * 0.22, t * rx * 0.74, -ry * 0.82 + Math.abs(t) * ry * 0.14);
    ctx.stroke();
  }
  ctx.restore();
}

function buildPoppySprites() {
  // Plane 4: 远景花枝、花园远柱与高光点（清晰时杂乱，虚化后融成柔和背景）
  const farBg = makeSprite((ctx, w, h) => {
    // 远景建筑窗栏/花架线条（f/11 时形成明显背景干扰！）
    ctx.strokeStyle = "rgba(82, 119, 121, 0.42)";
    ctx.lineWidth = 2.4;
    for (const x of [0.16, 0.34, 0.64, 0.82]) {
      ctx.beginPath();
      ctx.moveTo(w * x, h * 0.06);
      ctx.lineTo(w * x, h * 0.94);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(82, 119, 121, 0.28)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.28);
    ctx.lineTo(w * 0.94, h * 0.28);
    ctx.moveTo(w * 0.06, h * 0.72);
    ctx.lineTo(w * 0.94, h * 0.72);
    ctx.stroke();

    // 远景散落的橙红与青蓝花朵
    const farFlowers = [
      { x: 0.84, y: 0.22, r: 24, col: "#EC6E48", stem: true },
      { x: 0.68, y: 0.27, r: 16, col: "#2D7B82", stem: true },
      { x: 0.19, y: 0.42, r: 20, col: "#F0704A", stem: true },
      { x: 0.74, y: 0.68, r: 15, col: "#3D888E", stem: true },
    ];
    for (const f of farFlowers) {
      if (f.stem) {
        ctx.strokeStyle = "rgba(80, 96, 82, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * f.x, h * f.y + f.r * 0.4);
        ctx.quadraticCurveTo(w * f.x - 10, h * (f.y + 0.22), w * f.x - 16, h * 0.98);
        ctx.stroke();
      }
      ctx.fillStyle = f.col;
      ctx.beginPath();
      ctx.arc(w * f.x, h * f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1B3338";
      ctx.beginPath();
      ctx.arc(w * f.x, h * f.y, f.r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Plane 3: 中后景干扰枝叶与叠枝（贴背时直接贴在虞美人身后抢戏！）
  const midBg = makeSprite((ctx, w, h) => {
    const stems = [
      [0.36, 0.98, 0.42, 0.52, 0.34, 0.24],
      [0.62, 0.98, 0.58, 0.56, 0.66, 0.29],
      [0.54, 0.98, 0.57, 0.64, 0.69, 0.42],
      [0.29, 0.98, 0.33, 0.68, 0.26, 0.49],
    ];
    for (const [x0, y0, cx, cy, x1, y1] of stems) {
      ctx.strokeStyle = "#3E5654";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(w * x0, h * y0);
      ctx.quadraticCurveTo(w * cx, h * cy, w * x1, h * y1);
      ctx.stroke();

      // 细锯齿叶片与花苞
      ctx.fillStyle = "#1E666B";
      ctx.beginPath();
      ctx.ellipse(w * x1, h * y1, 13, 18, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#D85732";
      ctx.beginPath();
      ctx.arc(w * x1 + 4, h * y1 - 3, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // 后方穿插的干扰细叶，清晰时在主体背后制造视觉噪点
    const leaves = [
      [0.41, 0.45, 22, 6, -0.5, "#2C6366"],
      [0.59, 0.48, 24, 6, 0.45, "#2C6366"],
      [0.36, 0.62, 20, 6, -0.35, "#3E6B6B"],
      [0.64, 0.60, 20, 5.5, 0.6, "#3E6B6B"],
      [0.57, 0.36, 14, 14, 0, "#E46D47"],
      [0.39, 0.34, 11, 11, 0, "#4B8C90"],
    ];
    for (const [lx, ly, rx, ry, rot, col] of leaves) {
      ctx.save();
      ctx.translate(w * lx, h * ly);
      ctx.rotate(rot);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

  // Plane 2B: 主体后瓣（用于真切演示 135mm f/1.2 景深过薄把花朵背缘削糊！）
  const subjectBack = makeSprite((ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.51;
    // 细长微弯的橄榄绿花茎
    ctx.strokeStyle = "#56593F";
    ctx.lineWidth = 4.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + 28);
    ctx.quadraticCurveTo(cx - 10, cy + 102, cx - 22, h + 6);
    ctx.stroke();

    // 茎部细绒高光
    ctx.strokeStyle = "rgba(235, 222, 195, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 32);
    ctx.quadraticCurveTo(cx - 12, cy + 102, cx - 24, h + 6);
    ctx.stroke();

    // 后排三枚大花瓣
    drawPoppyPetal(ctx, cx - 10, cy - 34, 56, 48, -0.18, "#FCA276", "#F16739", "#C63817");
    drawPoppyPetal(ctx, cx + 44, cy - 16, 52, 46, 0.88, "#FBA176", "#ED5F31", "#BE3214");
    drawPoppyPetal(ctx, cx - 50, cy - 6, 52, 44, -0.96, "#FA9D71", "#E9582C", "#B82E12");
  });

  // Plane 2A: 主体前瓣与花蕊核心（083 原海报视觉锚心！）
  const subject = makeSprite((ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.51;

    // 前排两枚丝绸褶皱大花瓣
    drawPoppyPetal(ctx, cx - 26, cy + 18, 52, 42, -2.05, "#FB9A6E", "#EB582B", "#BC2F13");
    drawPoppyPetal(ctx, cx + 30, cy + 18, 54, 42, 2.08, "#FC9D72", "#ED5B2E", "#BE3114");

    // 底部兜托花瓣高光卷边
    ctx.save();
    ctx.translate(cx, cy + 14);
    ctx.beginPath();
    ctx.ellipse(0, 14, 48, 22, 0.04, 0, Math.PI);
    const cup = ctx.createLinearGradient(0, 0, 0, 36);
    cup.addColorStop(0, "rgba(180, 42, 16, 0.82)");
    cup.addColorStop(0.65, "#EA562A");
    cup.addColorStop(1, "#FC9C70");
    ctx.fillStyle = cup;
    ctx.fill();
    ctx.restore();

    // 花心阴影窝
    const heartShadow = ctx.createRadialGradient(cx, cy + 6, 4, cx, cy + 6, 36);
    heartShadow.addColorStop(0, "rgba(16, 26, 29, 0.92)");
    heartShadow.addColorStop(0.55, "rgba(130, 32, 16, 0.45)");
    heartShadow.addColorStop(1, "rgba(235, 88, 43, 0)");
    ctx.fillStyle = heartShadow;
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 36, 0, Math.PI * 2);
    ctx.fill();

    // 放射状黑青细雄蕊与金白花药
    for (let i = 0; i < 42; i++) {
      const ang = (i / 42) * Math.PI * 2 + (i % 2) * 0.04;
      const len = 18 + (i % 3) * 5.2;
      const x1 = cx + Math.cos(ang) * 9;
      const y1 = cy + 6 + Math.sin(ang) * 7.5;
      const x2 = cx + Math.cos(ang) * len;
      const y2 = cy + 6 + Math.sin(ang) * len * 0.84;
      ctx.strokeStyle = "#101E22";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.fillStyle = i % 3 === 0 ? "#F9E7C9" : "#152D33";
      ctx.beginPath();
      ctx.ellipse(x2, y2, 2.3, 1.4, ang, 0, Math.PI * 2);
      ctx.fill();
    }

    // 中央深孔雀黑子房与星纹
    ctx.fillStyle = "#0F2428";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 11.5, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7BA8A6";
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 6);
      ctx.lineTo(cx + Math.cos(a) * 9.5, cy + 6 + Math.sin(a) * 7.5);
      ctx.stroke();
    }
  });

  // Plane 1: 近中景微斜小枝（呼应原海报左侧柔虚小茎）
  const near = makeSprite((ctx, w, h) => {
    ctx.strokeStyle = "#62644F";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * 0.98);
    ctx.quadraticCurveTo(w * 0.19, h * 0.72, w * 0.24, h * 0.54);
    ctx.stroke();
    ctx.fillStyle = "#486E6F";
    ctx.beginPath();
    ctx.ellipse(w * 0.24, h * 0.53, 8, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Plane 0: 前景大青蓝花苞（呼应原海报左下标志性深青大虚化团）
  const fg = makeSprite((ctx, w, h) => {
    ctx.strokeStyle = "#2E4A4B";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h + 10);
    ctx.quadraticCurveTo(w * 0.11, h * 0.85, w * 0.14, h * 0.74);
    ctx.stroke();

    const g = ctx.createRadialGradient(w * 0.135, h * 0.73, 4, w * 0.14, h * 0.74, 34);
    g.addColorStop(0, "#148791");
    g.addColorStop(0.7, "#0B6E77");
    g.addColorStop(1, "#064C53");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w * 0.14, h * 0.74, 32, 0, Math.PI * 2);
    ctx.fill();
  });

  // 前景遮挡陷阱（开启 fgBlocker 时在主体正前方出现巨大遮挡枝叶）
  const fgVeil = makeSprite((ctx, w, h) => {
    ctx.fillStyle = "#0A6A72";
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.52, 62, 46, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#165056";
    ctx.beginPath();
    ctx.ellipse(w * 0.56, h * 0.48, 44, 34, 0.45, 0, Math.PI * 2);
    ctx.fill();
  });

  const bokehSpots = [
    { plane: "farBg", x: 0.87, y: 0.19, r: 0.72, col: "#F68E68", a: 0.78 },
    { plane: "farBg", x: 0.71, y: 0.24, r: 0.48, col: "#4E9599", a: 0.72 },
    { plane: "farBg", x: 0.15, y: 0.41, r: 0.62, col: "#F47E56", a: 0.72 },
    { plane: "midBg", x: 0.34, y: 0.66, r: 0.46, col: "#5CA3A7", a: 0.64 },
    { plane: "midBg", x: 0.69, y: 0.62, r: 0.44, col: "#F39A78", a: 0.6 },
    { plane: "farBg", x: 0.59, y: 0.77, r: 0.38, col: "#3D888E", a: 0.66 },
    { plane: "fg", x: 0.13, y: 0.75, r: 0.92, col: "#0B7780", a: 0.78 },
  ];

  return { farBg, midBg, subjectBack, subject, near, fg, fgVeil, bokehSpots };
}

function buildPortraitSprites() {
  // 严格遵守 BRIEF：人物仅绘优雅侧影剪影，绝不画五官细节（眼、嘴）
  const farBg = makeSprite((ctx, w, h) => {
    // 咖啡馆后窗格栅
    ctx.strokeStyle = "rgba(29, 97, 100, 0.5)";
    ctx.lineWidth = 4;
    for (const x of [0.15, 0.35, 0.65, 0.85]) {
      ctx.beginPath();
      ctx.moveTo(w * x, 0);
      ctx.lineTo(w * x, h);
      ctx.stroke();
    }
    for (const y of [0.24, 0.56, 0.84]) {
      ctx.beginPath();
      ctx.moveTo(0, h * y);
      ctx.lineTo(w, h * y);
      ctx.stroke();
    }
    // 远景吊灯与暖光灯串
    const lamps = [
      [0.24, 0.22, 14, "#EF6A3D"],
      [0.77, 0.19, 16, "#F58654"],
      [0.86, 0.44, 12, "#0B7780"],
      [0.18, 0.62, 13, "#F47E56"],
    ];
    for (const [x, y, r, col] of lamps) {
      ctx.strokeStyle = "#3E585B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * x, 0);
      ctx.lineTo(w * x, h * y);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(w * x, h * y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const midBg = makeSprite((ctx, w, h) => {
    // 杂乱的书架竖脊与画框线
    ctx.strokeStyle = "#2E565A";
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.12, h * 0.34, w * 0.24, h * 0.38);
    ctx.strokeRect(w * 0.64, h * 0.28, w * 0.24, h * 0.44);
    const cols = ["#1B5F65", "#D75B38", "#4D7F82", "#344A4E"];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(w * 0.66 + i * 14, h * 0.42, 10, h * 0.26);
      ctx.fillRect(w * 0.14 + i * 14, h * 0.46, 10, h * 0.22);
    }
  });

  // 后肩与后帽檐（过薄景深时轻微失焦）
  const subjectBack = makeSprite((ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.56;
    ctx.fillStyle = "#1E3A40";
    // 后肩与背影轮廓
    ctx.beginPath();
    ctx.moveTo(cx - 88, h + 4);
    ctx.quadraticCurveTo(cx - 72, cy + 44, cx - 22, cy + 28);
    ctx.lineTo(cx + 58, cy + 36);
    ctx.quadraticCurveTo(cx + 96, cy + 62, cx + 104, h + 4);
    ctx.closePath();
    ctx.fill();

    // 宽檐帽后檐
    ctx.fillStyle = "#B83B1D";
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 66, 76, 18, -0.1, 0, Math.PI * 2);
    ctx.fill();
  });

  // 人物纯侧影（干净优雅的逆光剪影，零五官刻画）
  const subject = makeSprite((ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.56;

    // 主体侧影剪影（面向右方，极简纯色轮廓+温暖逆光边缘线）
    ctx.fillStyle = "#102227";
    ctx.beginPath();
    ctx.moveTo(cx - 56, h + 4);
    ctx.quadraticCurveTo(cx - 48, cy + 40, cx - 26, cy + 24);
    // 后颈与发髻
    ctx.quadraticCurveTo(cx - 40, cy - 6, cx - 42, cy - 42);
    ctx.quadraticCurveTo(cx - 38, cy - 92, cx + 6, cy - 92);
    // 简约平滑侧影轮廓（不画眼嘴）
    ctx.quadraticCurveTo(cx + 38, cy - 88, cx + 40, cy - 52);
    ctx.quadraticCurveTo(cx + 46, cy - 30, cx + 38, cy - 12);
    ctx.quadraticCurveTo(cx + 36, cy + 6, cx + 18, cy + 16);
    // 前领口
    ctx.quadraticCurveTo(cx + 42, cy + 38, cx + 56, h + 4);
    ctx.closePath();
    ctx.fill();

    // 帽冠（呼应原海报朱橙主题色）
    ctx.fillStyle = "#E04E28";
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy - 64);
    ctx.quadraticCurveTo(cx - 34, cy - 116, cx + 2, cy - 114);
    ctx.quadraticCurveTo(cx + 34, cy - 112, cx + 40, cy - 68);
    ctx.closePath();
    ctx.fill();

    // 温暖的逆光金橙轮廓描边（焦点锁定时的极致清晰质感！）
    ctx.strokeStyle = "#FFA175";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 92);
    ctx.quadraticCurveTo(cx + 38, cy - 88, cx + 40, cy - 52);
    ctx.quadraticCurveTo(cx + 46, cy - 30, cx + 38, cy - 12);
    ctx.quadraticCurveTo(cx + 36, cy + 6, cx + 18, cy + 16);
    ctx.stroke();

    // 深青丝带饰边
    ctx.strokeStyle = "#01585F";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 46, cy - 68);
    ctx.quadraticCurveTo(cx - 4, cy - 60, cx + 38, cy - 70);
    ctx.stroke();
  });

  const near = makeSprite((ctx, w, h) => {
    // 咖啡杯剪影轮廓在左下角
    ctx.fillStyle = "#3E6B6E";
    ctx.fillRect(w * 0.14, h * 0.78, 36, 42);
  });

  const fg = makeSprite((ctx, w, h) => {
    // 前景深青盆栽叶片
    ctx.fillStyle = "#08676F";
    ctx.beginPath();
    ctx.ellipse(w * 0.13, h * 0.8, 36, 18, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0E7F88";
    ctx.beginPath();
    ctx.ellipse(w * 0.87, h * 0.84, 34, 16, 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  const fgVeil = makeSprite((ctx, w, h) => {
    ctx.fillStyle = "#0B666E";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.45, 64, 48, 0.25, 0, Math.PI * 2);
    ctx.fill();
  });

  const bokehSpots = [
    { plane: "farBg", x: 0.24, y: 0.22, r: 0.74, col: "#F78758", a: 0.82 },
    { plane: "farBg", x: 0.77, y: 0.19, r: 0.82, col: "#FF9966", a: 0.84 },
    { plane: "farBg", x: 0.86, y: 0.44, r: 0.56, col: "#4AA0A5", a: 0.72 },
    { plane: "farBg", x: 0.18, y: 0.62, r: 0.58, col: "#F2794E", a: 0.74 },
    { plane: "midBg", x: 0.72, y: 0.52, r: 0.44, col: "#3D8A8F", a: 0.6 },
    { plane: "fg", x: 0.13, y: 0.8, r: 0.76, col: "#0A747D", a: 0.75 },
  ];

  return { farBg, midBg, subjectBack, subject, near, fg, fgVeil, bokehSpots };
}

function buildStillSprites() {
  const farBg = makeSprite((ctx, w, h) => {
    // 远景屏风格栅与圆壁灯
    ctx.strokeStyle = "rgba(29, 97, 100, 0.42)";
    ctx.lineWidth = 2.6;
    for (let x = 0.12; x <= 0.88; x += 0.19) {
      ctx.beginPath();
      ctx.moveTo(w * x, h * 0.08);
      ctx.lineTo(w * x, h * 0.78);
      ctx.stroke();
    }
    ctx.fillStyle = "#F48A5E";
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.26, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4A959A";
    ctx.beginPath();
    ctx.arc(w * 0.24, h * 0.30, 18, 0, Math.PI * 2);
    ctx.fill();
  });

  const midBg = makeSprite((ctx, w, h) => {
    // 茶桌水平线
    ctx.fillStyle = "rgba(222, 206, 184, 0.7)";
    ctx.fillRect(0, h * 0.67, w, h * 0.33);
    // 后排茶叶罐与叠碗（清晰时抢走主角视线）
    ctx.fillStyle = "#195D63";
    ctx.fillRect(w * 0.64, h * 0.42, 46, 98);
    ctx.fillStyle = "#0F3F44";
    ctx.fillRect(w * 0.62, h * 0.39, 50, 12);

    ctx.fillStyle = "#C85A36";
    ctx.fillRect(w * 0.23, h * 0.48, 38, 74);
    ctx.strokeStyle = "#1C4649";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(w * 0.23, h * 0.48, 38, 74);
  });

  const subjectBack = makeSprite((ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.62;
    // 壶把（靠后）
    ctx.strokeStyle = "#BD3A1A";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx + 46, cy - 2, 26, -1.25, 1.35);
    ctx.stroke();
  });

  const subject = makeSprite((ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.62;
    // 桌影
    ctx.fillStyle = "rgba(17, 29, 33, 0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 44, 62, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 壶嘴
    ctx.strokeStyle = "#D84822";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy + 8);
    ctx.quadraticCurveTo(cx - 72, cy - 4, cx - 76, cy - 30);
    ctx.stroke();

    // 朱泥壶身
    const g = ctx.createRadialGradient(cx - 16, cy - 14, 8, cx, cy, 62);
    g.addColorStop(0, "#FB976A");
    g.addColorStop(0.55, "#E44E26");
    g.addColorStop(1, "#A62B10");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 54, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    // 壶盖与壶钮
    ctx.fillStyle = "#C63817";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 34, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F78759";
    ctx.beginPath();
    ctx.arc(cx, cy - 46, 9, 0, Math.PI * 2);
    ctx.fill();

    // 釉面高光条
    ctx.strokeStyle = "rgba(255, 236, 214, 0.65)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(cx - 6, cy + 2, 42, -2.5, -1.85);
    ctx.stroke();
  });

  const near = makeSprite((ctx, w, h) => {
    ctx.fillStyle = "#4F7D80";
    ctx.beginPath();
    ctx.ellipse(w * 0.76, h * 0.78, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const fg = makeSprite((ctx, w, h) => {
    // 前景深青品茗杯
    ctx.fillStyle = "#01585F";
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.72);
    ctx.lineTo(w * 0.24, h * 0.72);
    ctx.lineTo(w * 0.22, h * 0.90);
    ctx.lineTo(w * 0.14, h * 0.90);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3E8B90";
    ctx.beginPath();
    ctx.ellipse(w * 0.18, h * 0.72, 32, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const fgVeil = makeSprite((ctx, w, h) => {
    ctx.fillStyle = "#065C63";
    ctx.beginPath();
    ctx.ellipse(w * 0.49, h * 0.58, 66, 46, 0.1, 0, Math.PI * 2);
    ctx.fill();
  });

  const bokehSpots = [
    { plane: "farBg", x: 0.78, y: 0.26, r: 0.76, col: "#F68E68", a: 0.8 },
    { plane: "farBg", x: 0.24, y: 0.30, r: 0.66, col: "#4E9599", a: 0.74 },
    { plane: "midBg", x: 0.68, y: 0.48, r: 0.45, col: "#1C747B", a: 0.56 },
    { plane: "midBg", x: 0.26, y: 0.54, r: 0.44, col: "#EE764E", a: 0.56 },
    { plane: "fg", x: 0.18, y: 0.8, r: 0.78, col: "#0B7780", a: 0.76 },
  ];

  return { farBg, midBg, subjectBack, subject, near, fg, fgVeil, bokehSpots };
}

function getSceneSprites(sceneId) {
  if (!spriteCache.has(sceneId)) {
    if (sceneId === "portrait") spriteCache.set(sceneId, buildPortraitSprites());
    else if (sceneId === "still") spriteCache.set(sceneId, buildStillSprites());
    else spriteCache.set(sceneId, buildPoppySprites());
  }
  return spriteCache.get(sceneId);
}

// ---------- 核心通用多深度层光学场景绘制（Hero 主取景窗 + 06 考题共用！） ----------
export function renderOpticalFrame(ctx, w, h, ev, opts = {}) {
  const { showOverlay = true, compact = false, hoverPlane = null, time = 0 } = opts;
  const sprites = getSceneSprites(ev.state.scene);
  const byId = ev.byId;
  const comp = ev.metrics.compression; // 焦段视角压缩倍率
  const scaleFactor = w / 720;

  // 1. 083 原海报暖亚麻米纸底色（纯色快涂，避开逐帧创建 radialGradient）
  ctx.fillStyle = "#F7EFE1";
  ctx.fillRect(0, 0, w, h);

  // 计算保持纵横比居中的基础绘制矩形（绝不拉伸变形！）
  const aspect = SPRITE_W / SPRITE_H;
  let drawW = w;
  let drawH = w / aspect;
  if (drawH < h) {
    drawH = h;
    drawW = h * aspect;
  }
  const ox = (w - drawW) * 0.5;
  const oy = (h - drawH) * 0.5;

  // 背景按焦段压缩倍率围绕画面中心缩放（模拟真实长焦拉近压缩背景）
  const drawScaled = (pyramid, blurPx, scale, alpha = 1) => {
    const sw = drawW * scale;
    const sh = drawH * scale;
    const sx = (w - sw) * 0.5;
    const sy = (h - sh) * 0.5;
    drawBlurredPyramid(ctx, pyramid, blurPx, sx, sy, sw, sh, alpha);
  };

  const farScale = 0.88 + (comp - 0.74) * 0.52;
  const midScale = 0.94 + (comp - 0.74) * 0.28;

  // 2. 远景层 + 远景散景光斑
  drawScaled(sprites.farBg, byId.farBg.blurPx * scaleFactor, farScale, 0.94);

  // 3. 中后景层（随 bgSep 轻微后退并按弥散圆柔化）
  const sepShrink = clamp(1.06 - (ev.state.bgSepM - 0.5) * 0.045, 0.84, 1.08);
  drawScaled(sprites.midBg, byId.midBg.blurPx * scaleFactor, midScale * sepShrink, 0.96);

  // 4. 物理散景光斑（弥散圆越大、光斑越圆润宽广；收小光圈呈六边形）
  for (const b of sprites.bokehSpots) {
    if (b.plane === "fg") continue;
    const p = byId[b.plane];
    const sc = b.plane === "farBg" ? farScale : midScale * sepShrink;
    const bx = w * 0.5 + (b.x - 0.5) * drawW * sc;
    const by = h * 0.5 + (b.y - 0.5) * drawH * sc + Math.sin(time * 0.7 + b.x * 9) * 1.4;
    const r = clamp(p.blurPx * scaleFactor * 1.45 * b.r, 2.5, Math.min(w, h) * 0.16);
    if (p.cocMm > 0.08) {
      const a = clamp((p.cocMm - 0.06) * 0.9, 0, 1) * b.a * 0.85;
      drawApertureBokehDisc(ctx, bx, by, r, b.col, a, ev.state.aperture, b.x * 2);
    }
  }

  // 5. 主体后半（独立景深面，用于体现大光圈过薄景深削糊主体背缘）
  const backMult = byId.subjectBack.cocMm > 0.055 ? 2.15 : 1.15;
  drawBlurredPyramid(ctx, sprites.subjectBack, byId.subjectBack.blurPx * scaleFactor * backMult, ox, oy, drawW, drawH, 1);

  // 6. 主体前沿核心
  drawBlurredPyramid(ctx, sprites.subject, byId.subject.blurPx * scaleFactor * 1.25, ox, oy, drawW, drawH, 1);

  // 7. 近景配枝
  drawBlurredPyramid(ctx, sprites.near, byId.near.blurPx * scaleFactor, ox, oy, drawW, drawH, 0.92);

  // 8. 前景花苞 / 前景散景光斑
  drawBlurredPyramid(ctx, sprites.fg, byId.fg.blurPx * scaleFactor, ox, oy, drawW, drawH, 0.95);
  for (const b of sprites.bokehSpots) {
    if (b.plane !== "fg") continue;
    const p = byId.fg;
    const bx = ox + b.x * drawW;
    const by = oy + b.y * drawH;
    const r = clamp(p.blurPx * scaleFactor * 1.35 * b.r, 4, Math.min(w, h) * 0.18);
    if (p.cocMm > 0.12) {
      const a = clamp((p.cocMm - 0.1) * 0.85, 0, 1) * b.a * 0.72;
      drawApertureBokehDisc(ctx, bx, by, r, b.col, a, ev.state.aperture, 0.4);
    }
  }

  // 9. 前景糊墙陷阱层（若开启）
  if (ev.state.fgBlocker) {
    drawBlurredPyramid(ctx, sprites.fgVeil, Math.max(22, byId.fg.blurPx * 1.45) * scaleFactor, ox, oy, drawW, drawH, 0.86);
  }

  if (!showOverlay) return;

  // 10. 1:1 复刻 083 原海报光学取景框四角括号（┌ ┐ └ ┘）与焦点区域标示
  const shortH = h < 270;
  const frameW = Math.min(w * (compact ? 0.54 : 0.42), h * (shortH ? 0.54 : 0.60));
  const frameH = frameW * 0.86;
  const fx = (w - frameW) * 0.5;
  const fy = (h - frameH) * 0.5 + (shortH ? h * 0.09 : h * 0.03);
  const corner = Math.max(14, Math.min(28, frameW * 0.12));

  const subjSharp = ev.byId.subject.cocMm <= 0.036;
  const frameCol = ev.diagnosis.valid ? PALETTE.tealFrame : subjSharp ? PALETTE.tealFrame : PALETTE.coral;

  ctx.save();
  ctx.strokeStyle = frameCol;
  ctx.lineWidth = Math.max(2.2, Math.min(3.2, w * 0.0042));
  ctx.lineCap = "square";
  if (!subjSharp) ctx.setLineDash([7, 5]);

  // 左上 / 右上 / 左下 / 右下四角括号
  const corners = [
    [fx, fy + corner, fx, fy, fx + corner, fy],
    [fx + frameW - corner, fy, fx + frameW, fy, fx + frameW, fy + corner],
    [fx, fy + frameH - corner, fx, fy + frameH, fx + corner, fy + frameH],
    [fx + frameW - corner, fy + frameH, fx + frameW, fy + frameH, fx + frameW, fy + frameH - corner],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 顶部「焦点区域 FOCUS AREA」+ 原海报朱橙倒三角（窄高横屏时自动下挪，避免与右上角微标碰撞）
  const labelY = shortH ? Math.max(44, fy - 18) : Math.max(24, fy - 24);
  ctx.textAlign = "center";
  ctx.fillStyle = PALETTE.coralDeep;
  ctx.font = `600 ${compact || shortH ? 10.5 : 12}px "Noto Sans SC", sans-serif`;
  ctx.fillText(subjSharp ? "焦点区域" : `失焦 · 合焦在 ${ev.state.focusM.toFixed(1)}m`, w * 0.5, labelY);
  if (!shortH) {
    ctx.font = `600 ${compact ? 9 : 10}px "Sora", sans-serif`;
    ctx.fillStyle = subjSharp ? PALETTE.tealMuted : PALETTE.coral;
    ctx.fillText("FOCUS AREA", w * 0.5, labelY + 13);
  }

  // 小倒三角
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - 5, fy - 6);
  ctx.lineTo(w * 0.5 + 5, fy - 6);
  ctx.lineTo(w * 0.5, fy + 1);
  ctx.closePath();
  ctx.fill();

  // 左下复刻原海报虚线引注：背景虚化 BLURRED BACKGROUND + 实测弥散圆
  if (!compact && !shortH) {
    const dotX = w * 0.14;
    const dotY = h * 0.78;
    const tx = w * 0.24;
    const ty = h * 0.84;
    ctx.strokeStyle = PALETTE.tealMuted;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(dotX, dotY);
    ctx.lineTo(tx - 6, ty - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.tealDeep;
    ctx.beginPath();
    ctx.arc(tx - 6, ty - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = PALETTE.tealDeep;
    ctx.font = `600 12px "Noto Sans SC", sans-serif`;
    const bgTag = ev.byId.midBg.cocMm >= 0.32 ? "背景虚化" : "背景过实";
    ctx.fillText(`${bgTag} · CoC ${ev.byId.midBg.cocMm.toFixed(2)}mm`, tx + 2, ty);
    ctx.fillStyle = PALETTE.tealMuted;
    ctx.font = `500 10px "IBM Plex Mono", monospace`;
    ctx.fillText(`BLURRED BACKGROUND · ${ev.state.bgSepM.toFixed(1)}m`, tx + 2, ty + 14);
  }

  // 右上角极简光学镜头参数微标（单真源同步）
  const pillText = shortH
    ? `${ev.state.focalMm}mm · ${formatAperture(ev.state.aperture)} · u ${ev.state.focusM.toFixed(1)}m`
    : `${ev.state.focalMm}mm · ${formatAperture(ev.state.aperture)} · u ${ev.state.focusM.toFixed(2)}m · 景深 ${formatDof(ev.dof.dofM)}`;
  ctx.font = `500 ${compact || shortH ? 10 : 11}px "IBM Plex Mono", monospace`;
  const tw = ctx.measureText(pillText).width + 16;
  const px = w - tw - 10;
  const py = 10;
  ctx.fillStyle = "rgba(248, 239, 224, 0.92)";
  ctx.strokeStyle = "rgba(1, 88, 95, 0.3)";
  ctx.lineWidth = 1;
  ctx.fillRect(px, py, tw, 22);
  ctx.strokeRect(px, py, tw, 22);
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.tealDeep;
  ctx.fillText(pillText, px + 8, py + 15);

  // 若鼠标悬停在前景/远景可点移焦区，给出轻柔热区圈提示
  if (hoverPlane && !compact) {
    const map = {
      fg: [w * 0.14, h * 0.74, "点此移焦至前景"],
      subject: [w * 0.5, h * 0.51, "点此合焦主体"],
      midBg: [w * 0.76, h * 0.34, "点此移焦至背景"],
    };
    const info = map[hoverPlane];
    if (info) {
      ctx.fillStyle = "rgba(1, 88, 95, 0.88)";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      const bw = ctx.measureText(info[2]).width + 16;
      const bx = clamp(info[0] - bw / 2, 10, w - bw - 10);
      const by = clamp(info[1] - 34, 42, h - 30);
      ctx.fillRect(bx, by, bw, 22);
      ctx.fillStyle = "#F8EFE0";
      ctx.textAlign = "center";
      ctx.fillText(info[2], bx + bw / 2, by + 15);
    }
  }
  ctx.restore();
}

// ---------- 01 节：实焦 vs 虚焦纵拉幕帘对照画布（带高频边缘干扰叠层） ----------
export function renderSplitCompare(canvas, splitRatio, showEdges, evalSharp, evalShallow) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 640;
  const h = canvas.clientHeight || 360;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  const sx = clamp(splitRatio, 0.08, 0.92) * w;

  // 左侧：f/16 全景实焦
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, sx, h);
  ctx.clip();
  renderOpticalFrame(ctx, w, h, evalSharp, { showOverlay: false, compact: true });
  if (showEdges) {
    // 标注左侧背景里仍然锐利抢戏的高频轮廓框
    ctx.strokeStyle = "rgba(239, 65, 29, 0.85)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    const clutterBoxes = [
      [0.14, 0.32, 0.14, 0.24],
      [0.28, 0.18, 0.14, 0.34],
      [0.60, 0.22, 0.14, 0.36],
      [0.78, 0.14, 0.14, 0.22],
    ];
    for (const [bx, by, bw, bh] of clutterBoxes) {
      ctx.strokeRect(bx * w, by * h, bw * w, bh * h);
    }
    ctx.setLineDash([]);
  }
  ctx.restore();

  // 右侧：f/2.0 浅景深
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, 0, w - sx, h);
  ctx.clip();
  renderOpticalFrame(ctx, w, h, evalShallow, { showOverlay: false, compact: true });
  if (showEdges) {
    // 右侧仅中央主体保留强视觉边缘信号
    ctx.strokeStyle = "rgba(1, 88, 95, 0.92)";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(w * 0.34, h * 0.26, w * 0.32, h * 0.48);
  }
  ctx.restore();

  // 分隔幕帘线与下移圆把手（避开中央花蕊核心，视觉更干净）
  const knobY = h * 0.80;
  ctx.strokeStyle = PALETTE.tealDeep;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(sx, 0);
  ctx.lineTo(sx, h);
  ctx.stroke();

  ctx.fillStyle = PALETTE.tealDeep;
  ctx.beginPath();
  ctx.arc(sx, knobY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#F8EFE0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - 6, knobY);
  ctx.lineTo(sx - 2, knobY - 4);
  ctx.moveTo(sx - 6, knobY);
  ctx.lineTo(sx - 2, knobY + 4);
  ctx.moveTo(sx + 6, knobY);
  ctx.lineTo(sx + 2, knobY - 4);
  ctx.moveTo(sx + 6, knobY);
  ctx.lineTo(sx + 2, knobY + 4);
  ctx.stroke();

  // 左右角签
  const drawTag = (text, x, align, bg) => {
    ctx.font = `600 11px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
    const tw = ctx.measureText(text).width + 16;
    const rx = align === "left" ? x : x - tw;
    ctx.fillStyle = bg;
    ctx.fillRect(rx, 12, tw, 24);
    ctx.fillStyle = "#F8EFE0";
    ctx.textAlign = "left";
    ctx.fillText(text, rx + 8, 28);
  };
  drawTag("f/16 全景实焦 · 背景抢戏", 12, "left", "rgba(176, 50, 20, 0.9)");
  drawTag("f/2.0 浅景深 · 主体独立", w - 12, "right", "rgba(1, 88, 95, 0.92)");

  ctx.restore();
}

// ---------- 02 节：侧视薄透镜光路图与传感器弥散圆 ----------
export function renderOpticalBench(canvas, data) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 680;
  const h = canvas.clientHeight || 310;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#F7FAF9";
  ctx.fillRect(0, 0, w, h);

  // 细坐标底格
  ctx.strokeStyle = "rgba(1, 88, 95, 0.08)";
  ctx.lineWidth = 1;
  for (let gx = 32; gx < w; gx += 32) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 32; gy < h; gy += 32) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  const cy = h * 0.52;
  const sensorX = w * 0.11;
  const lensX = w * 0.30;
  const maxDistM = 12;
  const distToX = (m) => lensX + clamp(Math.log1p(m) / Math.log1p(maxDistM), 0.08, 0.96) * (w - lensX - 28);

  const subjX = distToX(data.focusM);
  const bgX = distToX(data.bgM);
  const nearX = distToX(data.dof.nearM);
  const farX = Number.isFinite(data.dof.farM) ? distToX(Math.min(data.dof.farM, maxDistM)) : w - 20;

  // 光轴虚线
  ctx.strokeStyle = "rgba(17, 29, 33, 0.24)";
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(sensorX - 10, cy);
  ctx.lineTo(w - 14, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // 清晰景深带（Dn — Df）
  ctx.fillStyle = "rgba(1, 88, 95, 0.14)";
  ctx.fillRect(nearX, 42, Math.max(4, farX - nearX), h - 88);
  ctx.strokeStyle = "rgba(1, 88, 95, 0.45)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(nearX, 42);
  ctx.lineTo(nearX, h - 46);
  ctx.moveTo(farX, 42);
  ctx.lineTo(farX, h - 46);
  ctx.stroke();
  ctx.setLineDash([]);

  // 入瞳开口半高（严格与实际入瞳直径 D = f/N 联动）
  const pupilHalf = clamp((data.dof.pupilMm / 68) * 56, 7, 56);

  // 背景点光源光锥（在传感器前方汇聚，打在传感器上散开成弥散圆！）
  const bgFocusX = sensorX + clamp(data.bgCoC * 28, 2, (lensX - sensorX) * 0.44);
  const cocHalfPx = clamp(data.bgCoC * 22, 1.5, 36);

  ctx.fillStyle = "rgba(239, 65, 29, 0.14)";
  ctx.beginPath();
  ctx.moveTo(bgX, cy);
  ctx.lineTo(lensX, cy - pupilHalf);
  ctx.lineTo(bgFocusX, cy);
  ctx.lineTo(sensorX, cy + cocHalfPx);
  ctx.lineTo(sensorX, cy - cocHalfPx);
  ctx.lineTo(bgFocusX, cy);
  ctx.lineTo(lensX, cy + pupilHalf);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(215, 83, 54, 0.78)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(bgX, cy);
  ctx.lineTo(lensX, cy - pupilHalf);
  ctx.lineTo(sensorX, cy + cocHalfPx);
  ctx.moveTo(bgX, cy);
  ctx.lineTo(lensX, cy + pupilHalf);
  ctx.lineTo(sensorX, cy - cocHalfPx);
  ctx.stroke();

  // 主体点光源光锥（精准汇聚到传感器一点）
  ctx.fillStyle = "rgba(1, 88, 95, 0.12)";
  ctx.beginPath();
  ctx.moveTo(subjX, cy);
  ctx.lineTo(lensX, cy - pupilHalf);
  ctx.lineTo(sensorX, cy);
  ctx.lineTo(lensX, cy + pupilHalf);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = PALETTE.tealDeep;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(subjX, cy);
  ctx.lineTo(lensX, cy - pupilHalf);
  ctx.lineTo(sensorX, cy);
  ctx.moveTo(subjX, cy);
  ctx.lineTo(lensX, cy + pupilHalf);
  ctx.lineTo(sensorX, cy);
  ctx.stroke();

  // 传感器竖条
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(sensorX - 5, cy - 52, 5, 104);
  // 传感器上的红色弥散圆高亮段
  ctx.fillStyle = PALETTE.coral;
  ctx.fillRect(sensorX - 2, cy - cocHalfPx, 4, cocHalfPx * 2);

  // 凸透镜与物理光圈叶片挡板
  const lensTop = cy - 64;
  const lensBot = cy + 64;
  ctx.fillStyle = "rgba(89, 164, 168, 0.28)";
  ctx.strokeStyle = PALETTE.tealDeep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(lensX, cy, 11, 64, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 上下光圈挡板
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(lensX - 3, lensTop - 4, 6, Math.max(4, 64 - pupilHalf + 4));
  ctx.fillRect(lensX - 3, cy + pupilHalf, 6, Math.max(4, 64 - pupilHalf + 4));

  // 主体点与背景点标记
  ctx.fillStyle = PALETTE.tealDeep;
  ctx.beginPath();
  ctx.arc(subjX, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.arc(bgX, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // 标注文字（全部 ≥ 11px，高对比）
  ctx.font = `600 11px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText("传感器", sensorX, 26);
  ctx.fillText(`镜头 ${data.focalMm}mm`, lensX, 26);
  ctx.fillStyle = PALETTE.tealDeep;
  ctx.fillText(`主体 ${data.focusM.toFixed(2)}m`, subjX, cy - 16);
  ctx.fillStyle = PALETTE.coralDeep;
  ctx.fillText(`背景 ${data.bgM.toFixed(1)}m`, Math.min(bgX, w - 42), cy + 26);

  ctx.font = `500 ${w < 420 ? 10 : 11}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.tealDeep;
  ctx.fillText(`景深带 ${formatDof(data.dof.dofM)} · 入瞳 ${data.dof.pupilMm.toFixed(1)}mm`, w - 12, h - 14);
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.coralDeep;
  ctx.fillText(`弥散圆 ${data.bgCoC.toFixed(2)}mm`, 12, h - 14);

  ctx.restore();
}

// ---------- 03 节：深青暗室散景叶片与球差实验室 ----------
export function renderBokehLab(canvas, { blades, spherical, busyTwigs }) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 640;
  const h = canvas.clientHeight || 340;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  // 深孔雀青光学暗室底
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, w * 0.72);
  bg.addColorStop(0, "#0D383F");
  bg.addColorStop(1, "#05191D");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 二线性杂乱枝条测试：球差过矫（spherical < 0）时，虚化枝条会分裂成双线硬边（Nisen Bokeh）！
  if (busyTwigs) {
    const split = clamp(-spherical, 0, 1) * 7.5;
    ctx.save();
    ctx.lineCap = "round";
    const lines = [
      [0.08, 0.16, 0.92, 0.78],
      [0.14, 0.86, 0.86, 0.18],
      [0.06, 0.52, 0.95, 0.44],
    ];
    for (const [x1, y1, x2, y2] of lines) {
      if (split > 1.2) {
        // 明显双边重影（二线性干扰）
        ctx.strokeStyle = "rgba(182, 224, 226, 0.24)";
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(x1 * w, y1 * h - split);
        ctx.lineTo(x2 * w, y2 * h - split);
        ctx.moveTo(x1 * w, y1 * h + split);
        ctx.lineTo(x2 * w, y2 * h + split);
        ctx.stroke();
      } else {
        // 奶油柔边单一宽软带
        ctx.strokeStyle = "rgba(130, 198, 202, 0.14)";
        ctx.lineWidth = 14 + Math.max(0, spherical) * 8;
        ctx.beginPath();
        ctx.moveTo(x1 * w, y1 * h);
        ctx.lineTo(x2 * w, y2 * h);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  const discs = [
    { x: 0.18, y: 0.28, r: 36, c: "#FF875E" },
    { x: 0.34, y: 0.64, r: 44, c: "#5AD3D9" },
    { x: 0.52, y: 0.36, r: 48, c: "#FFB07A" },
    { x: 0.68, y: 0.68, r: 38, c: "#FF784E" },
    { x: 0.82, y: 0.30, r: 42, c: "#68DEE2" },
    { x: 0.25, y: 0.78, r: 26, c: "#F8D8B0" },
    { x: 0.46, y: 0.72, r: 28, c: "#3BAEB5" },
    { x: 0.74, y: 0.20, r: 24, c: "#FF9F76" },
    { x: 0.12, y: 0.56, r: 29, c: "#4AB9BF" },
    { x: 0.88, y: 0.62, r: 32, c: "#F7A67E" },
  ];

  const isCatEye = blades === "cateye";
  const sides = blades === "5" ? 5 : blades === "6" ? 6 : 9;

  for (const d of discs) {
    const cx = d.x * w;
    const cy = d.y * h;
    const r = d.r * clamp(w / 620, 0.68, 1.12);
    const dx = d.x - 0.5;
    const dy = d.y - 0.5;
    const distNorm = Math.hypot(dx, dy) * 2;
    const angleToCenter = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(cx, cy);
    if (isCatEye) {
      ctx.rotate(angleToCenter);
      const squash = clamp(1 - distNorm * 0.44, 0.52, 1);
      ctx.scale(squash, 1);
    } else {
      ctx.rotate(d.x * 2.1);
    }

    const trace = (rad) => {
      ctx.beginPath();
      if (isCatEye || sides >= 9) {
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
      } else {
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2;
          const x = Math.cos(a) * rad;
          const y = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
    };

    // 球差能量分布：
    // spherical = -1（过矫硬亮边 + 洋葱圈）
    // spherical =  0（中性平盘）
    // spherical = +1（欠矫中心亮、边缘奶油溶化）
    const grad = ctx.createRadialGradient(0, 0, r * 0.05, 0, 0, r);
    if (spherical < -0.15) {
      const k = -spherical;
      grad.addColorStop(0, "rgba(255,255,255,0.08)");
      grad.addColorStop(0.68, "rgba(255,255,255,0.16)");
      grad.addColorStop(0.92, d.c);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 0.52 + k * 0.35;
      ctx.fillStyle = grad;
      trace(r);
      ctx.fill();

      // 硬边亮环 + 微微非球面洋葱圈纹
      ctx.strokeStyle = d.c;
      ctx.lineWidth = 1.6 + k * 1.4;
      ctx.globalAlpha = 0.5 + k * 0.38;
      trace(r * 0.94);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 248, 236, 0.22)";
      ctx.lineWidth = 0.9;
      trace(r * 0.62);
      ctx.stroke();
      trace(r * 0.36);
      ctx.stroke();
    } else if (spherical > 0.15) {
      const k = spherical;
      grad.addColorStop(0, d.c);
      grad.addColorStop(0.42, d.c);
      grad.addColorStop(0.78 - k * 0.15, "rgba(255, 190, 150, 0.25)");
      grad.addColorStop(1, "rgba(7, 38, 43, 0)");
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = grad;
      trace(r * (1 + k * 0.14));
      ctx.fill();
    } else {
      grad.addColorStop(0, d.c);
      grad.addColorStop(0.84, d.c);
      grad.addColorStop(1, "rgba(7, 38, 43, 0)");
      ctx.globalAlpha = 0.58;
      ctx.fillStyle = grad;
      trace(r);
      ctx.fill();
    }
    ctx.restore();
  }

  // 前景清晰剪影枝（提示：散景只在焦外发生，主体保持锐利）
  ctx.strokeStyle = "#F8EFE0";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h);
  ctx.quadraticCurveTo(w * 0.48, h * 0.72, w * 0.51, h * 0.54);
  ctx.stroke();
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.arc(w * 0.51, h * 0.52, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111D21";
  ctx.beginPath();
  ctx.arc(w * 0.51, h * 0.52, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------- 04 节：四个历史年代光学标本画幅 ----------
export function renderEraSpecimen(canvas, eraId) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 420;
  const h = canvas.clientHeight || 280;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  if (eraId === "1840") {
    // 1840 匹兹瓦 f/3.6 旋涡散景与暗角
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 22, w * 0.5, h * 0.5, w * 0.62);
    g.addColorStop(0, "#EFE0C2");
    g.addColorStop(0.65, "#C7AD84");
    g.addColorStop(1, "#4E3A24");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 边缘切向旋涡散景弧（像场弯曲特征）
    ctx.strokeStyle = "rgba(255, 240, 212, 0.34)";
    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * Math.PI * 2;
      const rad = 72 + (i % 3) * 28;
      ctx.lineWidth = 4 + (i % 3) * 2;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, rad, ang, ang + 0.32);
      ctx.stroke();
    }
    // 中心极锐利的人物侧影剪影（无五官）
    ctx.fillStyle = "#2E2014";
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.44, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.78, 46, 36, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (eraId === "1889") {
    // 1889 埃默森微分对焦（铂金印相柔和芦苇与舟影）
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#E7E2D6");
    g.addColorStop(0.55, "#CEC8B9");
    g.addColorStop(1, "#9B9688");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 柔和远岸与雾气
    ctx.fillStyle = "rgba(110, 108, 98, 0.32)";
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.42, 120, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    // 清晰中景孤舟剪影
    ctx.fillStyle = "#2D2C28";
    ctx.beginPath();
    ctx.moveTo(w * 0.34, h * 0.58);
    ctx.lineTo(w * 0.64, h * 0.58);
    ctx.lineTo(w * 0.58, h * 0.64);
    ctx.lineTo(w * 0.39, h * 0.64);
    ctx.closePath();
    ctx.fill();
    // 划桨人剪影（无五官）
    ctx.beginPath();
    ctx.arc(w * 0.48, h * 0.47, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.45, h * 0.50, 12, 10);
    // 前景虚化芦苇团
    ctx.fillStyle = "rgba(62, 60, 52, 0.25)";
    for (let x = 20; x < w; x += 38) {
      ctx.beginPath();
      ctx.ellipse(x, h * 0.92, 14, 34, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (eraId === "1932") {
    // 1932 Group f/64：银盐黑白，从前景砾石到远峰丝毫毕现
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1E2428");
    g.addColorStop(0.5, "#6E777C");
    g.addColorStop(1, "#D8DDD9");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 极其锐利的远山棱线
    ctx.fillStyle = "#353E42";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.6);
    ctx.lineTo(w * 0.25, h * 0.24);
    ctx.lineTo(w * 0.46, h * 0.44);
    ctx.lineTo(w * 0.72, h * 0.18);
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#F4F6F5";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.24);
    ctx.lineTo(w * 0.34, h * 0.52);
    ctx.moveTo(w * 0.72, h * 0.18);
    ctx.lineTo(w * 0.80, h * 0.58);
    ctx.stroke();

    // 同样锐利的前景岩石与枝影
    ctx.fillStyle = "#111618";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.18, h * 0.74);
    ctx.lineTo(w * 0.38, h * 0.86);
    ctx.lineTo(w * 0.56, h * 0.76);
    ctx.lineTo(w * 0.86, h * 0.82);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  } else {
    // 1997 Bokeh 定名与现代大光圈审美
    ctx.fillStyle = "#F8EFE0";
    ctx.fillRect(0, 0, w, h);
    const orbs = [
      [0.18, 0.28, 34, "#F68E68"],
      [0.82, 0.26, 40, "#4E9599"],
      [0.76, 0.74, 30, "#F37B54"],
      [0.24, 0.76, 36, "#0B7780"],
    ];
    for (const [x, y, r, c] of orbs) {
      drawApertureBokehDisc(ctx, w * x, h * y, r, c, 0.74, 1.8, 0.2);
    }
    // 清晰中央主体点
    ctx.strokeStyle = PALETTE.tealDeep;
    ctx.lineWidth = 2.4;
    ctx.strokeRect(w * 0.38, h * 0.30, w * 0.24, h * 0.40);
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111D21";
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // 底部印签
  const tags = {
    "1840": "1840 · PETZVAL f/3.6 · 旋涡场曲",
    "1889": "1889 · EMERSON · 微分对焦",
    "1932": "1932 · GROUP f/64 · 通透深焦",
    "1997": "1997 · BOKEH · 散景质地审美",
  };
  ctx.fillStyle = "rgba(17, 29, 33, 0.82)";
  ctx.fillRect(10, h - 30, w - 20, 22);
  ctx.fillStyle = "#F8EFE0";
  ctx.font = `500 10.5px "IBM Plex Mono", "Noto Sans SC", monospace`;
  ctx.textAlign = "left";
  ctx.fillText(tags[eraId] || "", 18, h - 15);

  ctx.restore();
}

// ---------- SVG 真实 6 叶片机械光圈坐标生成（用于 Hero 左下深青底舱，1:1 呼应原海报光圈图标！） ----------
export function updateIrisSvg(svgEl, aperture) {
  if (!svgEl) return;
  // f/1.2 -> 极大开口 (r=33)；f/16 -> 极小针孔 (r=6.5)
  const norm = clamp((Math.log(aperture) - Math.log(1.2)) / (Math.log(16) - Math.log(1.2)), 0, 1);
  const innerR = 32 - norm * 25.5;
  const outerR = 44;
  const cx = 50;
  const cy = 50;
  const blades = 6;
  const paths = svgEl.querySelectorAll("[data-iris-blade]");
  const twist = 0.25 + norm * 0.52;

  for (let i = 0; i < blades; i++) {
    const p = paths[i];
    if (!p) continue;
    const a0 = (i / blades) * Math.PI * 2 + twist;
    const a1 = ((i + 1) / blades) * Math.PI * 2 + twist;
    const aOut0 = a0 - 0.32;
    const aOut1 = a1 + 0.12;
    const x1 = cx + Math.cos(a0) * innerR;
    const y1 = cy + Math.sin(a0) * innerR;
    const x2 = cx + Math.cos(a1) * innerR;
    const y2 = cy + Math.sin(a1) * innerR;
    const xo1 = cx + Math.cos(aOut1) * outerR;
    const yo1 = cy + Math.sin(aOut1) * outerR;
    const xo0 = cx + Math.cos(aOut0) * outerR;
    const yo0 = cy + Math.sin(aOut0) * outerR;
    p.setAttribute(
      "d",
      `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${xo1.toFixed(1)} ${yo1.toFixed(1)} A ${outerR} ${outerR} 0 0 0 ${xo0.toFixed(1)} ${yo0.toFixed(1)} Z`
    );
  }
}
