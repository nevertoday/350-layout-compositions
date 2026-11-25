// 078 虫视构图 · 开场双画布引擎：
// 1) 主角画布（真三维针孔透视投影，1:1 承袭 078 原海报暗夜茄紫×霓虹玫粉×丁香紫纪念碑美学）
// 2) 左侧「侧视机位剖面仪」（同步呈现摄影机蹲降高度、仰角视锥与高楼几何，可直接拖拽相机）

import {
  analyzeView,
  clamp,
  faceNormal,
  getSceneGeometry,
  lightShade,
  makeCamera,
} from "./model.js";

// 颜色插值工具（用于 3D 立面明暗紫粉渐变）
function mixRGB(a, b, t) {
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
}

// 逐像素采自 078 原海报的建筑着色谱
const C_DARK = [46, 22, 68];      // #2E1644 暗紫基座影
const C_SHADE = [94, 56, 124];    // #5E387C 阴影靛紫
const C_LILAC = [193, 137, 186];  // #C189BA 丁香亮面
const C_PINK = [242, 144, 197];   // #F290C5 原海报炽烈玫粉高光
const C_DEEP_PINK = [223, 101, 149]; // #DF6595 侧塔强玫粉

// 原海报左右底角折纸风前景树木（随焦段与仰角发生真实视差偏移与抬头倾斜）
function drawLowPolyTrees(ctx, w, h, state, cam) {
  const lift = clamp(state.pitch / 70, 0, 1);
  const wide = clamp((55 - state.focal) / 40, 0, 1);
  const lean = (0.18 + lift * 0.48) * (0.6 + wide * 0.55);
  const litCol = state.light === "flat" ? "#5A3D6E" : state.light === "rim" ? "#C2669F" : "#DC77B4";
  const midCol = state.light === "flat" ? "#3F2654" : "#6F3E7E";
  const darkCol = "#2B1340";

  function drawTree(anchorX, anchorY, dirX, scale) {
    ctx.save();
    ctx.translate(anchorX, anchorY);
    const tipX = dirX * w * (0.14 + lean * 0.16) * scale;
    const tipY = -h * (0.34 + lift * 0.18) * scale;
    // 主枝干
    ctx.strokeStyle = darkCol;
    ctx.lineWidth = Math.max(3, w * 0.011 * scale);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tipX, tipY);
    ctx.moveTo(tipX * 0.45, tipY * 0.45);
    ctx.lineTo(tipX * 0.95 - dirX * 18 * scale, tipY * 0.62);
    ctx.stroke();

    // 低多边形折纸树冠块（复刻原海报左中与右下的晶面树叶）
    const clusters = [
      { cx: tipX, cy: tipY, r: w * 0.072 * scale },
      { cx: tipX * 0.62 - dirX * 8 * scale, cy: tipY * 0.68, r: w * 0.052 * scale },
    ];
    for (const cl of clusters) {
      const r = cl.r;
      const pts = [
        [cl.cx - r * 0.95, cl.cy - r * 0.1],
        [cl.cx - r * 0.4, cl.cy - r * 0.95],
        [cl.cx + r * 0.55, cl.cy - r * 0.8],
        [cl.cx + r * 1.0, cl.cy + r * 0.08],
        [cl.cx + r * 0.4, cl.cy + r * 0.92],
        [cl.cx - r * 0.55, cl.cy + r * 0.78],
      ];
      // 三色分组批绘折纸切面（每次仅 3 次 fill 而非 6 次，显著降低软渲染 draw calls）
      const center = [cl.cx + (dirX > 0 ? r * 0.15 : -r * 0.15), cl.cy - r * 0.1];
      const byCol = new Map([
        [litCol, [
          [pts[1], pts[2], center],
          dirX > 0 ? [pts[2], pts[3], center] : [pts[0], pts[1], center],
        ]],
        [midCol, [
          dirX > 0 ? [pts[0], pts[1], center] : [pts[2], pts[3], center],
          [pts[5], pts[0], center],
        ]],
        [darkCol, [
          [pts[3], pts[4], center],
          [pts[4], pts[5], center],
        ]],
      ]);
      for (const [col, tris] of byCol) {
        ctx.fillStyle = col;
        ctx.beginPath();
        for (const tr of tris) {
          ctx.moveTo(tr[0][0], tr[0][1]);
          ctx.lineTo(tr[1][0], tr[1][1]);
          ctx.lineTo(tr[2][0], tr[2][1]);
          ctx.closePath();
        }
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 左侧两簇高枝，右侧一簇低枝（与原海报构图呼应）
  drawTree(-w * 0.03, h * 0.72, 1, 1.05);
  drawTree(w * 1.03, h * 0.80, -1, 0.74);
}

// 英雄立像题材的无五官纯剪影雕像（谨遵规范：绝不画五官，仅用披风与轮廓）
function drawHeroFigure(ctx, cam, state, w, h) {
  const z = 0.5;
  const base = 17.4;
  // 披风背影（多边形折面）
  const cloakLeft = [
    { x: -1.6, y: base + 13.0, z: z - 0.5 },
    { x: 0.0, y: base + 13.6, z: z - 0.6 },
    { x: -0.4, y: base, z: z - 0.9 },
    { x: -3.6, y: base, z: z - 0.4 },
  ];
  const cloakRight = [
    { x: 0.0, y: base + 13.6, z: z - 0.6 },
    { x: 1.8, y: base + 12.8, z: z - 0.5 },
    { x: 3.4, y: base, z: z - 0.2 },
    { x: -0.4, y: base, z: z - 0.9 },
  ];
  // 躯干与双腿剪影
  const torso = [
    { x: -1.9, y: base + 13.2, z: z + 0.3 },
    { x: 1.9, y: base + 13.2, z: z + 0.3 },
    { x: 1.4, y: base + 6.8, z: z + 0.3 },
    { x: 2.0, y: base, z: z + 0.4 },
    { x: 0.3, y: base, z: z + 0.4 },
    { x: 0.0, y: base + 6.2, z: z + 0.4 },
    { x: -0.3, y: base, z: z + 0.4 },
    { x: -2.0, y: base, z: z + 0.4 },
    { x: -1.4, y: base + 6.8, z: z + 0.3 },
  ];

  const drawPoly = (pts3, col, strokeCol) => {
    const p = cam.clipAndProjectPoly(pts3);
    if (!p) return;
    ctx.beginPath();
    ctx.moveTo(p.pts[0].x, p.pts[0].y);
    for (let i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i].x, p.pts[i].y);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    if (strokeCol) {
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  };

  const cShade = state.light === "flat" ? "#5A3D6E" : "#381B52";
  const cLit = state.light === "flat" ? "#77558E" : state.light === "rim" ? "#D677AC" : "#E986BB";
  const rimStroke = state.light === "rim" ? "#FFB3D9" : state.light === "side" ? "#F49EC9" : null;

  drawPoly(cloakLeft, cShade);
  drawPoly(cloakRight, cLit, rimStroke);
  drawPoly(torso, state.light === "flat" ? "#66467D" : "#4E296B", rimStroke);

  // 无五官纯几何头冠轮廓（只画平滑侧影椭圆，绝不画眼鼻嘴）
  const headC = cam.project({ x: 0, y: base + 15.6, z: z + 0.35 });
  const headTop = cam.project({ x: 0, y: base + 17.5, z: z + 0.35 });
  if (!headC.behind && !headTop.behind) {
    const r = clamp(Math.abs(headC.y - headTop.y), 3, w * 0.075);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(headC.x, headC.y, r * 0.78, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = state.light === "flat" ? "#66467D" : "#44215E";
    ctx.fill();
    if (rimStroke) {
      ctx.strokeStyle = rimStroke;
      ctx.lineWidth = Math.max(1.5, r * 0.14);
      ctx.beginPath();
      ctx.arc(headC.x, headC.y, r * 0.88, -Math.PI * 0.65, Math.PI * 0.32);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// 绘制古杉针叶冠簇
function drawRedwoodCanopies(ctx, cam, geom, state, w) {
  const lit = state.light === "flat" ? "#6D4F85" : "#E582B7";
  const mid = state.light === "flat" ? "#52356B" : "#7E488F";
  const dark = "#2A123E";
  for (const pr of geom.prisms) {
    const levels = [0.64, 0.82, 0.98];
    for (let li = 0; li < levels.length; li++) {
      const y = pr.h * levels[li];
      const radW = (4.6 - li * 1.1) * (pr.hero ? 1.25 : 0.92);
      const c = cam.project({ x: pr.cx, y, z: pr.cz });
      const edge = cam.project({ x: pr.cx + radW, y, z: pr.cz });
      if (c.behind || edge.behind) continue;
      const rx = clamp(Math.abs(edge.x - c.x), 6, w * 0.36);
      const ry = rx * 0.54;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - ry * 1.25);
      ctx.lineTo(c.x + rx, c.y + ry * 0.2);
      ctx.lineTo(c.x + rx * 0.52, c.y + ry * 0.82);
      ctx.lineTo(c.x - rx * 0.55, c.y + ry * 0.78);
      ctx.lineTo(c.x - rx, c.y + ry * 0.15);
      ctx.closePath();
      const grad = ctx.createLinearGradient(c.x - rx, c.y, c.x + rx, c.y - ry);
      grad.addColorStop(0, dark);
      grad.addColorStop(0.55, mid);
      grad.addColorStop(1, lit);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }
}

// 缓存静态背景/底脚渐变，避免每帧重新分配 CanvasGradient
let _gradCache = { w: 0, h: 0, sky: null, foot: null };
function getCachedGrads(ctx, w, h) {
  if (_gradCache.w !== w || _gradCache.h !== h) {
    const sky = ctx.createLinearGradient(0, 0, w * 0.35, h);
    sky.addColorStop(0, "#150A24");
    sky.addColorStop(0.52, "#1C0E30");
    sky.addColorStop(1, "#27123E");
    const foot = ctx.createLinearGradient(0, h * 0.72, 0, h);
    foot.addColorStop(0, "rgba(26, 14, 43, 0)");
    foot.addColorStop(0.55, "rgba(26, 14, 43, 0.62)");
    foot.addColorStop(1, "rgba(26, 14, 43, 0.96)");
    _gradCache = { w, h, sky, foot };
  }
  return _gradCache;
}

// 渲染主角 2D 矢量真三维画布，并返回可点击的「杂线热区」和「光源热区」坐标
export function renderHeroCanvas(canvas, state, anim = { intro: 1, pulse: 0, fast: false }) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return { wiresRect: null, lightPos: null, analysis: analyzeView(state) };

  const dpr = w / Math.max(1, canvas.clientWidth || 680);
  const analysis = analyzeView(state, w, h, { lightweight: !!anim.fast });
  const cam = analysis.cam;
  const geom = analysis.geom;
  const grads = getCachedGrads(ctx, w, h);

  // 1) 暗夜茄紫天幕底色 + 微弱星辉光晕（强侧光/逆光时在右上方浮出紫粉辉光）
  ctx.fillStyle = grads.sky;
  ctx.fillRect(0, 0, w, h);

  // 光源方向光晕
  const lightPos = state.light === "rim"
    ? { x: w * 0.5, y: h * 0.14 }
    : state.light === "side"
      ? { x: w * 0.86, y: h * 0.24 }
      : { x: w * 0.86, y: h * 0.18 };

  if (state.light !== "flat") {
    const glow = ctx.createRadialGradient(lightPos.x, lightPos.y, 0, lightPos.x, lightPos.y, w * 0.72);
    if (state.light === "rim") {
      glow.addColorStop(0, "rgba(242, 144, 197, 0.34)");
      glow.addColorStop(0.38, "rgba(182, 95, 165, 0.14)");
      glow.addColorStop(1, "rgba(26, 14, 43, 0)");
    } else {
      glow.addColorStop(0, "rgba(235, 117, 161, 0.26)");
      glow.addColorStop(0.45, "rgba(145, 76, 158, 0.10)");
      glow.addColorStop(1, "rgba(26, 14, 43, 0)");
    }
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  // 极淡的地平线刻度（线绘在楼体背后符合空间遮挡；标签在楼体绘制后叠加于左缘，绝不被大楼裁半）
  const showHorizon = cam.horizonY > 24 * dpr && cam.horizonY < h * 0.74;
  if (cam.horizonY > -40 && cam.horizonY < h + 40) {
    ctx.save();
    ctx.strokeStyle = "rgba(215, 165, 211, 0.30)";
    ctx.setLineDash([5 * dpr, 5 * dpr]);
    ctx.lineWidth = 1.1 * dpr;
    ctx.beginPath();
    ctx.moveTo(w * 0.04, cam.horizonY);
    ctx.lineTo(w * 0.96, cam.horizonY);
    ctx.stroke();
    ctx.restore();
  }

  // 2) 收集全部 3D 立面并按深度远→近排序（画家算法）
  const drawList = [];
  for (const pr of geom.prisms) {
    for (const f of pr.faces) {
      const n = faceNormal(f.pts);
      const refP = f.pts[0];
      const vx = -refP.x, vy = cam.camY - refP.y, vz = cam.camZ - refP.z;
      if (n.x * vx + n.y * vy + n.z * vz <= 0) continue; // 背面剔除
      const projected = cam.clipAndProjectPoly(f.pts);
      if (!projected) continue;
      const shade = lightShade(n, state.light);
      drawList.push({ pr, f, n, pts: projected.pts, depth: projected.depth, shade });
    }
  }
  drawList.sort((a, b) => b.depth - a.depth);

  // 3) 绘制 3D 摩天塔群 / 古杉 / 石台立面（带竖向建筑渐亮与石材拼接缝）
  for (const item of drawList) {
    const { pts, shade, pr, f } = item;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();

    // 按立面顶底点造竖向渐变（复刻原海报「底座沉紫、向上升腾出丁香/玫粉辉光」）
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const g = ctx.createLinearGradient(0, maxY, 0, minY);
    const isLit = shade > 0.56;
    const isBrightWing = pr.role === "wing" && isLit && state.light !== "flat";
    if (state.light === "flat") {
      // 平漫光仍保留极轻微的左右面冷灰紫区别与清晰轮廓，让读者一眼看懂这是平淡灰闷的高楼群，而非一堵色条墙
      const flatHi = shade > 0.48 ? 0.80 : 0.56;
      g.addColorStop(0, mixRGB([52, 32, 74], C_SHADE, flatHi * 0.72));
      g.addColorStop(1, mixRGB(C_SHADE, C_LILAC, flatHi * 0.58));
    } else if (isBrightWing) {
      g.addColorStop(0, mixRGB(C_DARK, C_SHADE, 0.45));
      g.addColorStop(0.55, mixRGB(C_SHADE, C_DEEP_PINK, shade));
      g.addColorStop(1, mixRGB(C_DEEP_PINK, C_PINK, clamp((shade - 0.45) * 1.6, 0, 1)));
    } else if (isLit) {
      g.addColorStop(0, mixRGB(C_DARK, C_SHADE, 0.35));
      g.addColorStop(0.5, mixRGB(C_SHADE, C_LILAC, shade * 0.92));
      g.addColorStop(1, mixRGB(C_LILAC, C_PINK, clamp((shade - 0.55) * 1.4, 0, 1)));
    } else {
      g.addColorStop(0, mixRGB([26, 12, 43], C_DARK, 0.7));
      g.addColorStop(0.6, mixRGB(C_DARK, C_SHADE, shade * 1.25));
      g.addColorStop(1, mixRGB(C_SHADE, C_LILAC, shade * 0.95));
    }
    ctx.fillStyle = g;
    ctx.fill();

    // 锋利高光棱线（即使在平光态也有清晰的建筑与夜空边界轮廓，避免糊成一整片墙）
    ctx.strokeStyle = isLit && state.light !== "flat"
      ? (state.light === "rim" ? "rgba(255, 179, 217, 0.78)" : "rgba(242, 175, 218, 0.48)")
      : state.light === "flat"
        ? "rgba(215, 175, 224, 0.34)"
        : "rgba(38, 17, 60, 0.62)";
    ctx.lineWidth = (isLit && state.light === "rim" ? 1.55 : 1.05) * dpr;
    ctx.stroke();

    // 主塔/侧塔精细楼层横纹与纵向肋线（全部合并进单次 beginPath/stroke，极大降低每帧调用数！）
    if (state.scene === "towers" && (f.side === "front" || f.side === "right" || f.side === "left") && pts.length === 4) {
      ctx.strokeStyle = isLit && state.light !== "flat" ? "rgba(255, 232, 246, 0.22)" : "rgba(220, 185, 232, 0.22)";
      ctx.lineWidth = 0.85 * dpr;
      ctx.beginPath();
      const rows = pr.hero ? 7 : 5;
      for (let r = 1; r < rows; r++) {
        const t = r / rows;
        ctx.moveTo(pts[0].x + (pts[3].x - pts[0].x) * t, pts[0].y + (pts[3].y - pts[0].y) * t);
        ctx.lineTo(pts[1].x + (pts[2].x - pts[1].x) * t, pts[1].y + (pts[2].y - pts[1].y) * t);
      }
      for (const s of [0.33, 0.67]) {
        ctx.moveTo(pts[0].x + (pts[1].x - pts[0].x) * s, pts[0].y + (pts[1].y - pts[0].y) * s);
        ctx.lineTo(pts[3].x + (pts[2].x - pts[3].x) * s, pts[3].y + (pts[2].y - pts[3].y) * s);
      }
      ctx.stroke();
    }
  }

  // 在楼体之上绘制清晰的「HORIZON 视平线」角标，避免被楼体边缘裁去一半字母
  if (showHorizon) {
    ctx.save();
    const hy = cam.horizonY;
    const tagTxt = "HORIZON 视平线";
    ctx.font = `500 ${Math.round(10 * dpr)}px "DM Mono", "Noto Sans SC", monospace`;
    const tw = ctx.measureText(tagTxt).width;
    const padX = 7 * dpr;
    const tagH = 18 * dpr;
    const tx = 10 * dpr;
    const ty = Math.max(26 * dpr, hy - tagH - 4 * dpr);
    ctx.fillStyle = "rgba(18, 9, 31, 0.86)";
    ctx.strokeStyle = "rgba(215, 165, 211, 0.48)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw + padX * 2, tagH, 2 * dpr);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#E5D5EE";
    ctx.textBaseline = "middle";
    ctx.fillText(tagTxt, tx + padX, ty + tagH * 0.52);
    ctx.restore();
  }

  // 题材专属上层元素
  if (state.scene === "redwoods") {
    drawRedwoodCanopies(ctx, cam, geom, state, w);
  } else if (state.scene === "monument") {
    drawHeroFigure(ctx, cam, state, w, h);
  }

  // 4) 前景左右底角低多边形折纸树木（与原海报呼应）
  if (state.scene !== "redwoods") {
    drawLowPolyTrees(ctx, w, h, state, cam);
  }

  // 5) 1:1 复刻原海报：透视汇聚线 + 顶部实心玫粉天顶消失点（Zenith VP）箭头！
  if (state.guides) {
    const vpX = w * 0.5;
    const rawVpY = cam.zenith ? cam.zenith.y : -h * 2;
    const vpVisible = cam.zenith && rawVpY >= h * 0.04 && rawVpY <= h * 0.65;
    const targetY = clamp(rawVpY, h * 0.055, h * 0.68);
    const intro = clamp(anim.intro, 0, 1);

    ctx.save();
    // 选取主塔与左右两座副塔的真实外棱线作为透视引导射线源
    const rayOrigins = geom.prisms.slice(0, 3).flatMap((pr) => {
      const pTop = cam.project({ x: pr.cx, y: pr.h, z: pr.cz });
      const pBase = cam.project({ x: pr.cx, y: Math.max(4, state.height + 3), z: pr.cz });
      return [{ top: pTop, base: pBase, hero: pr.hero }];
    });

    for (const ray of rayOrigins) {
      if (ray.top.behind) continue;
      const sx = ray.top.x;
      const sy = ray.top.y;
      // 沿真实棱线向上延伸至天顶消失点方向
      const tx = vpVisible ? vpX : sx + (ray.top.x - ray.base.x) * 1.4;
      const ty = vpVisible ? targetY + 12 * dpr : sy - h * 0.28;
      const ex = sx + (tx - sx) * intro;
      const ey = sy + (ty - sy) * intro;

      ctx.strokeStyle = ray.hero ? "rgba(242, 144, 197, 0.82)" : "rgba(235, 117, 161, 0.58)";
      ctx.lineWidth = (ray.hero ? 1.5 : 1.15) * dpr;
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // 主塔正中向下延伸的细白虚线中轴（原海报标志细节）
      if (ray.hero && !ray.base.behind) {
        ctx.strokeStyle = "rgba(243, 236, 239, 0.52)";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ray.base.x, Math.min(h * 0.86, ray.base.y));
        ctx.stroke();
      }
    }

    // 外侧两条原海报实线斜指箭（从画面左右中段刺向天顶消失点）
    if (vpVisible && state.pitch >= 24) {
      const alpha = clamp((state.pitch - 20) / 30, 0.15, 0.92) * intro;
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(235, 117, 161, ${alpha.toFixed(2)})`;
      ctx.lineWidth = 1.4 * dpr;
      const wings = [
        { x0: w * 0.21, y0: h * 0.34, x1: vpX - 24 * dpr, y1: targetY + 26 * dpr },
        { x0: w * 0.79, y0: h * 0.34, x1: vpX + 24 * dpr, y1: targetY + 26 * dpr },
      ];
      for (const wg of wings) {
        ctx.beginPath();
        ctx.moveTo(wg.x0, wg.y0);
        ctx.lineTo(wg.x1, wg.y1);
        ctx.stroke();
        // 箭头尖角
        const ang = Math.atan2(wg.y1 - wg.y0, wg.x1 - wg.x0);
        const ah = 9 * dpr;
        ctx.beginPath();
        ctx.moveTo(wg.x1, wg.y1);
        ctx.lineTo(wg.x1 - ah * Math.cos(ang - 0.42), wg.y1 - ah * Math.sin(ang - 0.42));
        ctx.moveTo(wg.x1, wg.y1);
        ctx.lineTo(wg.x1 - ah * Math.cos(ang + 0.42), wg.y1 - ah * Math.sin(ang + 0.42));
        ctx.stroke();
      }

      // 天顶实心玫粉三角箭头（Zenith VP）
      const pulse = 1 + Math.sin(anim.pulse * 2.2) * 0.06;
      const sz = 11 * dpr * pulse;
      ctx.fillStyle = state.pitch > 75 ? "#FF7F73" : "#EB75A1";
      ctx.beginPath();
      ctx.moveTo(vpX, targetY - sz * 1.15);
      ctx.lineTo(vpX + sz * 0.92, targetY + sz * 0.72);
      ctx.lineTo(vpX, targetY + sz * 0.36);
      ctx.lineTo(vpX - sz * 0.92, targetY + sz * 0.72);
      ctx.closePath();
      ctx.fill();

      // 天顶标注
      ctx.fillStyle = state.pitch > 75 ? "#FF9E94" : "rgba(243, 212, 232, 0.86)";
      ctx.font = `500 ${Math.round(10 * dpr)}px "DM Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(
        state.pitch > 75 ? "ZENITH VP · 掉入画心" : `ZENITH VP · ${analysis.convergenceDeg.toFixed(0)}°`,
        vpX,
        Math.max(14 * dpr, targetY - sz * 1.65)
      );
      ctx.textAlign = "left";
    } else {
      // 平视时天顶消失点远在画框上方之外：在顶部显示方向提示
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 146, 134, 0.92)";
      ctx.font = `500 ${Math.round(10.5 * dpr)}px "DM Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("↑ 天顶消失点在画框外极高处（线条几乎平行）", vpX, 22 * dpr);
      ctx.textAlign = "left";
    }
    ctx.restore();
  }

  // 6) 若开启天顶杂乱电线（开场错态之一），批绘横穿天空的架空电线 + 可点清除标牌
  let wiresRect = null;
  if (state.clutter) {
    ctx.save();
    const wires = [
      [0, h * 0.14, w * 0.48, h * 0.21, w, h * 0.11],
      [0, h * 0.20, w * 0.55, h * 0.27, w, h * 0.17],
      [0, h * 0.08, w * 0.42, h * 0.15, w, h * 0.24],
      [0, h * 0.25, w * 0.36, h * 0.29, w, h * 0.20],
    ];
    ctx.beginPath();
    for (const [x0, y0, cx, cy, x1, y1] of wires) {
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
    }
    ctx.strokeStyle = "rgba(18, 9, 28, 0.88)";
    ctx.lineWidth = 2.1 * dpr;
    ctx.stroke();
    ctx.strokeStyle = "rgba(215, 195, 226, 0.36)";
    ctx.lineWidth = 0.8 * dpr;
    ctx.stroke();
    // 红色可点击排雷胶囊标牌
    const bw = Math.min(w * 0.44, 162 * dpr);
    const bh = 26 * dpr;
    const bx = w * 0.5 - bw * 0.5;
    const by = h * 0.155;
    ctx.fillStyle = "rgba(155, 28, 42, 0.94)";
    ctx.strokeStyle = "#FF9E94";
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 3 * dpr);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FFF5F6";
    ctx.font = `600 ${Math.round(11 * dpr)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("× 杂乱电线 · 点击清除", bx + bw * 0.5, by + bh * 0.5);
    ctx.restore();
    wiresRect = { x: bx / dpr, y: by / dpr, w: bw / dpr, h: bh / dpr };
  }

  // 7) 可点击光源小标（右上光轴点，点击切换 强侧光 / 顶逆光 / 平光）
  ctx.save();
  const lpX = w * 0.91;
  const lpY = h * 0.10;
  const lr = 13 * dpr;
  ctx.beginPath();
  ctx.arc(lpX, lpY, lr, 0, Math.PI * 2);
  ctx.fillStyle = state.light === "flat" ? "rgba(62, 42, 86, 0.88)" : "rgba(235, 117, 161, 0.24)";
  ctx.fill();
  ctx.strokeStyle = state.light === "flat" ? "#A68CB8" : "#F290C5";
  ctx.lineWidth = 1.3 * dpr;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(lpX, lpY, 4 * dpr, 0, Math.PI * 2);
  ctx.fillStyle = state.light === "flat" ? "#B8A3C7" : "#FFD0E6";
  ctx.fill();
  ctx.fillStyle = "#E8D9EE";
  ctx.font = `500 ${Math.round(9.5 * dpr)}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(state.light === "flat" ? "平光" : state.light === "rim" ? "逆光" : "侧光", lpX, lpY + lr + 11 * dpr);
  ctx.restore();

  // 8) 底部平滑深紫暗脚过渡，让压叠在底部的白色「虫视构图」巨标清晰如原海报！
  ctx.fillStyle = grads.foot;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  return {
    wiresRect,
    lightPos: { x: lpX / dpr, y: lpY / dpr, r: 22 },
    analysis,
  };
}

// ---------- 左侧「侧视机位剖面仪（Side-Elevation Rig Monitor）」 ----------
// 实时绘制地面、高楼立面剖面、相机脚架高度、广角视锥和视线轴，返回相机把手坐标供直接上下拖动！
export function renderSideRig(canvas, state) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return { camHandle: null };
  const dpr = w / Math.max(1, canvas.clientWidth || 240);

  ctx.fillStyle = "#140A23";
  ctx.fillRect(0, 0, w, h);

  // 细测绘格线（单次 beginPath/stroke 降调用数）
  ctx.strokeStyle = "rgba(181, 134, 194, 0.11)";
  ctx.lineWidth = 1;
  const step = 22 * dpr;
  ctx.beginPath();
  for (let x = step; x < w; x += step) {
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
  }
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, y); ctx.lineTo(w, y);
  }
  ctx.stroke();

  const groundY = h * 0.84;
  const towerX = w * 0.72;
  const towerW = w * 0.19;
  const towerH = h * 0.66;
  const camX = w * 0.23;

  // 机位高度映射到剖面（夸张展现 0.10m ~ 2.00m 以便肉眼看清「站着 vs 贴地」）
  const eyeMaxPx = h * 0.34;
  const camY = groundY - clamp(state.height / 2.0, 0.04, 1) * eyeMaxPx;

  // 地面线
  ctx.strokeStyle = "rgba(235, 117, 161, 0.55)";
  ctx.lineWidth = 1.4 * dpr;
  ctx.beginPath();
  ctx.moveTo(w * 0.06, groundY);
  ctx.lineTo(w * 0.94, groundY);
  ctx.stroke();

  // 主体剖面（塔楼/古杉/雕像台）
  const tg = ctx.createLinearGradient(towerX, groundY, towerX, groundY - towerH);
  tg.addColorStop(0, "#46225B");
  tg.addColorStop(0.6, "#965FA3");
  tg.addColorStop(1, "#EB75A1");
  ctx.fillStyle = tg;
  ctx.fillRect(towerX, groundY - towerH, towerW, towerH);
  ctx.strokeStyle = "rgba(243, 214, 234, 0.45)";
  ctx.lineWidth = 1 * dpr;
  ctx.strokeRect(towerX, groundY - towerH, towerW, towerH);

  // 相机真实仰角视锥（FOV 随焦段变化！）
  const pitchRad = (state.pitch * Math.PI) / 180;
  const halfFov = Math.atan(12 / state.focal);
  const coneLen = w * 0.78;
  const a1 = -pitchRad - halfFov;
  const a2 = -pitchRad + halfFov;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(a1) * coneLen, camY + Math.sin(a1) * coneLen);
  ctx.lineTo(camX + Math.cos(a2) * coneLen, camY + Math.sin(a2) * coneLen);
  ctx.closePath();
  const cg = ctx.createLinearGradient(camX, camY, towerX, groundY - towerH);
  cg.addColorStop(0, "rgba(242, 144, 197, 0.34)");
  cg.addColorStop(1, "rgba(235, 117, 161, 0.04)");
  ctx.fillStyle = cg;
  ctx.fill();

  // 视锥边界与中轴
  ctx.strokeStyle = "rgba(242, 144, 197, 0.62)";
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(a1) * coneLen, camY + Math.sin(a1) * coneLen);
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(a2) * coneLen, camY + Math.sin(a2) * coneLen);
  ctx.stroke();

  ctx.strokeStyle = "#F3ECEF";
  ctx.setLineDash([4 * dpr, 4 * dpr]);
  ctx.beginPath();
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(-pitchRad) * coneLen * 0.9, camY + Math.sin(-pitchRad) * coneLen * 0.9);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 竖直高度标尺虚线
  ctx.strokeStyle = "rgba(215, 165, 211, 0.45)";
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(camX, groundY);
  ctx.lineTo(camX, camY);
  ctx.stroke();

  // 可拖拽相机机身把手
  ctx.save();
  ctx.translate(camX, camY);
  ctx.rotate(-pitchRad);
  ctx.fillStyle = "#EB75A1";
  ctx.strokeStyle = "#F3ECEF";
  ctx.lineWidth = 1.4 * dpr;
  ctx.beginPath();
  ctx.roundRect(-9 * dpr, -6 * dpr, 15 * dpr, 12 * dpr, 2 * dpr);
  ctx.fill();
  ctx.stroke();
  // 镜头筒
  ctx.fillStyle = "#F3ECEF";
  ctx.fillRect(6 * dpr, -3.5 * dpr, 5 * dpr, 7 * dpr);
  ctx.restore();

  // 读数角标
  ctx.fillStyle = "#F3ECEF";
  ctx.font = `500 ${Math.round(10 * dpr)}px "DM Mono", monospace`;
  ctx.fillText(`H ${state.height.toFixed(2)}m`, 8 * dpr, 16 * dpr);
  ctx.fillStyle = "#F290C5";
  ctx.fillText(`+${Math.round(state.pitch)}° · ${Math.round(state.focal)}mm`, 8 * dpr, 30 * dpr);

  ctx.fillStyle = "rgba(217, 203, 224, 0.78)";
  ctx.font = `500 ${Math.round(9.5 * dpr)}px "Noto Sans SC", sans-serif`;
  ctx.fillText("地面 0m", 8 * dpr, groundY + 14 * dpr);
  ctx.textAlign = "right";
  ctx.fillText("上下拖相机", w - 8 * dpr, groundY + 14 * dpr);
  ctx.textAlign = "left";

  return {
    camHandle: { x: camX / dpr, y: camY / dpr, groundY: groundY / dpr, maxPx: eyeMaxPx / dpr },
  };
}
