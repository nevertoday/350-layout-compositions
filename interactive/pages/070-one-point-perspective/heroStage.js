// 070 一点透视 · 活体包豪斯建筑长廊主舞台（2D Canvas 高清矢量透视渲染）
// 1:1 化用原海报朱赤红斜墙、黑框壁龛、落地长凳、黑格天窗、1/z 网格地砖与朱红高门
// 全程使用 model.js 同源 3D 针孔投影，支持点击选构件、横向拖拽掰正射线、拖动消失点改视高与站位。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { CORRIDOR, SCENES, TOL, clamp, makeCamera, diagnose } from "./model.js";

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fillPoly(ctx, pts, fill, stroke = null, lw = 1) {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function drawRay(ctx, p1, p2, color, lw = 1.4, dash = [6, 5]) {
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.restore();
}

function drawMissCross(ctx, pt, color, size = 6) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(pt.x - size, pt.y - size);
  ctx.lineTo(pt.x + size, pt.y + size);
  ctx.moveTo(pt.x + size, pt.y - size);
  ctx.lineTo(pt.x - size, pt.y + size);
  ctx.stroke();
  ctx.restore();
}

const textWCache = new Map();
function measureCached(ctx, font, text) {
  const key = font + "|" + text;
  let v = textWCache.get(key);
  if (v === undefined) {
    ctx.font = font;
    v = ctx.measureText(text).width;
    if (textWCache.size > 128) textWCache.clear();
    textWCache.set(key, v);
  }
  return v;
}

function drawBadgePill(ctx, x, y, text, bg, fg, borderColor = null) {
  ctx.save();
  const font = '700 11.5px "Noto Sans SC", "Big Shoulders", sans-serif';
  ctx.font = font;
  const padX = 8;
  const tw = measureCached(ctx, font, text);
  const bw = tw + padX * 2;
  const bh = 22;
  const bx = clamp(x - bw / 2, 8, ctx.canvas._cssW - bw - 8);
  const by = clamp(y - bh / 2, 8, ctx.canvas._cssH - bh - 8);
  ctx.fillStyle = bg;
  ctx.fillRect(bx, by, bw, bh);
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(bx, by, bw, bh);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
  ctx.restore();
}

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 800;
  let h = 520;
  let dpr = 1;
  let needsResize = true;
  let dirty = true;
  let lastCam = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(240, Math.round(rect.width));
    h = Math.max(200, Math.round(rect.height));
    dpr = pixelRatio(window.innerWidth <= 600 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    canvas._cssW = w;
    canvas._cssH = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    needsResize = false;
    dirty = true;
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => { needsResize = true; dirty = true; }).observe(canvas);
  }
  window.addEventListener("resize", () => { needsResize = true; dirty = true; });

  function drawScene(t, dt, { still }) {
    if (needsResize) resize();
    // 丝滑开场入画：从 0.35 起步，确保 0.9s 截图与第一帧均饱满清晰且动态流畅
    if (still) {
      state.introProgress = 1;
      dirty = true;
    } else if (state.introProgress < 1) {
      state.introProgress = Math.min(1, state.introProgress + Math.max(0.03, dt * 1.45));
      dirty = true;
    }
    // 静置且开场动画完成后跳过冗余整帧光栅化，省电且大幅提升慢手机软件渲染余量；拖动或任何状态改动必重画
    if (!dirty) return;
    dirty = false;

    const sc = SCENES[state.scene] || SCENES.poster;
    const cam = makeCamera(state, w, h);
    lastCam = cam;
    const diag = diagnose(state);
    const { corridor, vpPx, project } = cam;
    const { halfW, halfH, zNear, zFar, tileCount, colCount } = CORRIDOR;
    const hl = state.highlightLayer;
    const pulse = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 3.2);

    ctx.clearRect(0, 0, w, h);

    // 0) 外底暖米纸（防止边界露出空白）
    ctx.fillStyle = sc.bgWall;
    ctx.fillRect(0, 0, w, h);

    // 1) 四壁大面（左墙、右墙、天花、地板、尽头端面）
    // 尽头端面
    fillPoly(ctx, [corridor.backTL, corridor.backTR, corridor.backBR, corridor.backBL], sc.bgWall);

    // 天花板（从顶部画框到远端顶边）
    fillPoly(ctx, [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      corridor.backTR,
      corridor.backTL,
    ], sc.bgWall);

    // 地板（从远端底边到画框底部）
    fillPoly(ctx, [
      corridor.backBL,
      corridor.backBR,
      { x: w, y: h },
      { x: 0, y: h },
    ], sc.floorBg);

    // 左墙（原海报朱赤红斜切面！）
    fillPoly(ctx, [
      { x: 0, y: 0 },
      corridor.backTL,
      corridor.backBL,
      { x: 0, y: h },
    ], sc.leftWall);

    // 右墙（原海报暖米白壁面）
    fillPoly(ctx, [
      corridor.backTR,
      { x: w, y: 0 },
      { x: w, y: h },
      corridor.backBR,
    ], sc.rightWall);

    // 2) 地面网格地砖（真实 1/z 透视 vs 压测伪等距/反透视）
    ctx.save();
    ctx.strokeStyle = !diag.checks.floorOk
      ? "rgba(168, 25, 16, 0.52)"
      : hl === "depth"
        ? "rgba(229, 70, 22, 0.72)"
        : "rgba(38, 34, 30, 0.34)";
    ctx.lineWidth = hl === "depth" || !diag.checks.floorOk ? 1.45 : 1;

    // 纵向地砖线（汇聚消失点）
    for (let c = 1; c < colCount; c++) {
      const gx = -halfW + (2 * halfW * c) / colCount;
      const pN = project(gx, -halfH, 0.65);
      const pF = project(gx, -halfH, zFar);
      ctx.beginPath();
      ctx.moveTo(pN.x, pN.y);
      ctx.lineTo(pF.x, pF.y);
      ctx.stroke();
    }
    // 横向地砖线（严格保持水平！）
    for (let i = 0; i <= tileCount; i++) {
      const z = cam.tileZ(i);
      const pL = project(-halfW, -halfH, z);
      const pR = project(halfW, -halfH, z);
      ctx.beginPath();
      ctx.moveTo(pL.x, pL.y);
      ctx.lineTo(pR.x, pR.y);
      ctx.stroke();
    }
    ctx.restore();

    // 3) 场景定制建筑细节：天花板黑格天窗 / 教堂藻井 / 地铁条形灯带
    const ceilSegs = state.scene === "supper"
      ? [[1.35, 2.0], [2.3, 3.1], [3.5, 4.4], [4.9, 6.0]]
      : [[1.32, 1.98], [2.42, 3.22], [3.85, 4.95]];
    for (const [z1, z2] of ceilSegs) {
      const xHalf = state.scene === "metro" ? 0.24 : 0.44;
      const p1 = project(-xHalf, halfH, z1);
      const p2 = project(xHalf, halfH, z1);
      const p3 = project(xHalf, halfH, z2);
      const p4 = project(-xHalf, halfH, z2);
      fillPoly(
        ctx,
        [p1, p2, p3, p4],
        state.scene === "metro" ? "#FAF6F0" : sc.ceilingTiles,
        sc.ink,
        state.scene === "metro" ? 2.2 : 1
      );
    }

    // 尽头细节（原海报极简留白 / 教堂三扇拱窗 / 地铁屏蔽门洞）
    if (state.scene === "supper") {
      // 达·芬奇《最后的晚餐》标志尽头三扇采光窗
      for (const [wx1, wx2, wy1, wy2] of [
        [-0.78, -0.34, -0.18, 0.36],
        [-0.24, 0.24, -0.18, 0.44],
        [0.34, 0.78, -0.18, 0.36],
      ]) {
        fillPoly(ctx, [
          project(wx1, wy2, zFar),
          project(wx2, wy2, zFar),
          project(wx2, wy1, zFar),
          project(wx1, wy1, zFar),
        ], "#FAF6F0", sc.ink, 1.6);
      }
    } else if (state.scene === "metro") {
      // 尽头地铁站台盲道与指示灯牌
      const sign = [
        project(-0.46, 0.56, zFar),
        project(0.46, 0.56, zFar),
        project(0.46, 0.32, zFar),
        project(-0.46, 0.32, zFar),
      ];
      fillPoly(ctx, sign, "#0F0F0F");
      const m1 = project(-0.08, -halfH, 0.85);
      const m2 = project(0.08, -halfH, 0.85);
      const m3 = project(0.08, -halfH, zFar);
      const m4 = project(-0.08, -halfH, zFar);
      fillPoly(ctx, [m1, m2, m3, m4], "rgba(229, 70, 22, 0.22)");
    }

    // 4) 左墙上部黑粗框壁龛窗（严格服从原海报固定建筑框架，做对齐参照）
    const winPts = [
      project(-halfW, 0.42, 1.68),
      project(-halfW, 0.42, 2.95),
      project(-halfW, -0.22, 2.95),
      project(-halfW, -0.22, 1.68),
    ];
    fillPoly(ctx, winPts, "#F2EBE2", sc.ink, Math.max(5, w * 0.011));
    // 右墙远端纯黑深门洞（原海报特征）
    const farDoorPts = [
      project(halfW, 0.38, 3.45),
      project(halfW, 0.38, 4.95),
      project(halfW, -halfH, 4.95),
      project(halfW, -halfH, 3.45),
    ];
    fillPoly(ctx, farDoorPts, sc.ink);

    // 5) 走廊四大建筑折角主骨线（原海报粗黑斜顶梁 + 踢脚线）
    ctx.save();
    ctx.strokeStyle = sc.ink;
    ctx.lineCap = "butt";
    // 上方两条粗黑斜梁（原海报最抓眼的结构黑边！）
    ctx.lineWidth = Math.max(5.5, w * 0.011);
    ctx.beginPath();
    ctx.moveTo(corridor.nearTL.x - (corridor.backTL.x - corridor.nearTL.x) * 0.4, corridor.nearTL.y - (corridor.backTL.y - corridor.nearTL.y) * 0.4);
    ctx.lineTo(corridor.backTL.x, corridor.backTL.y);
    ctx.moveTo(corridor.nearTR.x - (corridor.backTR.x - corridor.nearTR.x) * 0.4, corridor.nearTR.y - (corridor.backTR.y - corridor.nearTR.y) * 0.4);
    ctx.lineTo(corridor.backTR.x, corridor.backTR.y);
    ctx.stroke();

    // 下方两条踢脚线
    ctx.lineWidth = Math.max(2.6, w * 0.0045);
    ctx.beginPath();
    ctx.moveTo(corridor.nearBL.x - (corridor.backBL.x - corridor.nearBL.x) * 0.4, corridor.nearBL.y - (corridor.backBL.y - corridor.nearBL.y) * 0.4);
    ctx.lineTo(corridor.backBL.x, corridor.backBL.y);
    ctx.moveTo(corridor.nearBR.x - (corridor.backBR.x - corridor.nearBR.x) * 0.4, corridor.nearBR.y - (corridor.backBR.y - corridor.nearBR.y) * 0.4);
    ctx.lineTo(corridor.backBR.x, corridor.backBR.y);
    ctx.stroke();

    // 尽头内壁立面竖线（强化一点透视竖线垂直）
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = "rgba(15, 15, 15, 0.35)";
    ctx.beginPath();
    ctx.moveTo(corridor.backTL.x, corridor.backTL.y);
    ctx.lineTo(corridor.backBL.x, corridor.backBL.y);
    ctx.moveTo(corridor.backTR.x, corridor.backTR.y);
    ctx.lineTo(corridor.backBR.x, corridor.backBR.y);
    ctx.stroke();
    ctx.restore();

    // 6) 三大可校准建筑构件！
    // ---- 构件 A：左墙落地长凳 ----
    const benchSel = state.activeTarget === "bench";
    const benchBad = !diag.checks.benchOk;
    const bStroke = benchBad ? "#A81910" : benchSel ? "#146B48" : sc.ink;
    fillPoly(ctx, cam.bench.side, "#FAF6F0", sc.ink, 1.8);
    fillPoly(ctx, cam.bench.top, sc.ink, bStroke, benchBad || benchSel ? 2.4 : 1.4);
    fillPoly(ctx, cam.bench.front, sc.accent, sc.ink, 2.2);
    if (benchBad || benchSel) {
      ctx.save();
      ctx.strokeStyle = benchBad ? "#A81910" : "#146B48";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      fillPoly(ctx, cam.bench.top, null, benchBad ? "#A81910" : "#146B48", 2.2);
      ctx.restore();
    }

    // ---- 构件 B：右墙朱红高门 ----
    const doorSel = state.activeTarget === "door";
    const doorBad = !diag.checks.doorOk;
    fillPoly(ctx, cam.door.poly, sc.doorFill, sc.ink, Math.max(5.5, w * 0.01));
    if (doorBad || doorSel) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      fillPoly(ctx, cam.door.poly, null, doorBad ? "#FFD54F" : "#5CE0A8", 2.4);
      ctx.restore();
    }

    // ---- 构件 C：前景展台/立柱墩 ----
    const pedSel = state.activeTarget === "pedestal";
    const pedBad = !diag.checks.pedOk;
    const p = cam.pedestal;
    // 先画顶面与可见侧面，再画前脸（严格按偏航方向决定左右哪一侧面可见）
    if (p.bTL.x < p.fTL.x) {
      fillPoly(ctx, [p.fTL, p.bTL, p.bBL, p.fBL], "#DDD9D3", sc.ink, 1.8);
    }
    if (p.bTR.x > p.fTR.x) {
      fillPoly(ctx, [p.fTR, p.bTR, p.bBR, p.fBR], "#D0CBC3", sc.ink, 1.8);
    }
    fillPoly(ctx, [p.fTL, p.fTR, p.bTR, p.bTL], "#FAF6F0", sc.ink, 1.8);
    fillPoly(
      ctx,
      [p.fTL, p.fTR, p.fBR, p.fBL],
      pedBad ? "#221D1B" : "#141413",
      pedBad ? "#E54616" : pedSel ? "#146B48" : sc.ink,
      pedBad || pedSel ? 2.4 : 1.6
    );
    // 展台前脸标色条（呼应包豪斯红白黑）
    const barL = { x: p.fTL.x + (p.fBL.x - p.fTL.x) * 0.22, y: p.fTL.y + (p.fBL.y - p.fTL.y) * 0.22 };
    const barR = { x: p.fTR.x + (p.fBR.x - p.fTR.x) * 0.22, y: p.fTR.y + (p.fBR.y - p.fTR.y) * 0.22 };
    ctx.save();
    ctx.strokeStyle = pedBad ? "#FF6B3D" : "#E54616";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(barL.x, barL.y);
    ctx.lineTo(barR.x, barR.y);
    ctx.stroke();
    ctx.restore();

    // 7) 原海报标志透视辅助射线、视平线与脱靶红叉检定层
    const prog = state.introProgress;
    if (state.showGuides || hl) {
      // 7.1 水平视平线（红色细虚线贯穿全宽）
      const hAlpha = hl === "focus" || hl === "vp" ? 0.95 : 0.65;
      drawRay(
        ctx,
        { x: 0, y: vpPx.y },
        { x: w * prog, y: vpPx.y },
        `rgba(224, 64, 15, ${hAlpha})`,
        hl === "focus" ? 2.0 : 1.25,
        [6, 5]
      );

      // 7.2 原海报四条对角穿心引导线
      const diagAlpha = hl === "convergence" || hl === "vp" ? 0.85 : 0.42;
      const corners = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
      for (const c of corners) {
        const end = {
          x: vpPx.x + (c.x - vpPx.x) * prog,
          y: vpPx.y + (c.y - vpPx.y) * prog,
        };
        drawRay(ctx, vpPx, end, `rgba(224, 64, 15, ${diagAlpha})`, hl === "convergence" ? 1.8 : 1.1, [5, 5]);
      }

      // 7.3 三件构件的实时延伸检验线（歪就射偏画红叉，正就稳稳汇入主消失点变深松绿！）
      // 长凳检验线
      const bRayColor = benchBad ? "#B81D13" : "#146B48";
      drawRay(ctx, cam.bench.top[1], cam.bench.vp, bRayColor, benchSel || benchBad ? 2.1 : 1.3, benchBad ? [7, 4] : [4, 4]);
      drawRay(ctx, cam.bench.side[3], cam.bench.vp, bRayColor, benchSel || benchBad ? 1.6 : 1.0, [5, 5]);
      if (benchBad) {
        drawMissCross(ctx, cam.bench.vp, "#B81D13", 6.5);
      }

      // 右门检验线
      const dRayColor = doorBad ? "#B81D13" : "#146B48";
      drawRay(ctx, cam.door.poly[0], cam.door.vp, dRayColor, doorSel || doorBad ? 2.1 : 1.3, doorBad ? [7, 4] : [4, 4]);
      drawRay(ctx, cam.door.poly[3], cam.door.vp, dRayColor, doorSel || doorBad ? 1.6 : 1.0, [5, 5]);
      if (doorBad) {
        // 标出分裂出来的错视平线
        drawRay(ctx, { x: vpPx.x - 90, y: cam.door.vp.y }, { x: w, y: cam.door.vp.y }, "rgba(184, 29, 19, 0.72)", 1.5, [3, 4]);
        drawMissCross(ctx, cam.door.vp, "#B81D13", 6.5);
      }

      // 前景展台检验线
      const pRayColor = pedBad ? "#B81D13" : "#146B48";
      const pTarget = pedBad ? { x: clamp(p.sideVp.x, 14, w - 14), y: p.sideVp.y } : vpPx;
      drawRay(ctx, p.fTL, pTarget, pRayColor, pedSel || pedBad ? 2.1 : 1.3, pedBad ? [7, 4] : [4, 4]);
      drawRay(ctx, p.fTR, pTarget, pRayColor, pedSel || pedBad ? 1.7 : 1.0, [5, 5]);
      if (pedBad) {
        drawMissCross(ctx, pTarget, "#B81D13", 6.5);
      }
    }

    // 8) 主消失点朱红实心圆点（带脉动聚焦外环 + 原海报中英标注）
    ctx.save();
    const ringR = hl === "vp" || hl === "focus" ? 18 + pulse * 5 : 13 + pulse * 3;
    ctx.beginPath();
    ctx.arc(vpPx.x, vpPx.y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = diag.allOk ? "rgba(20, 107, 72, 0.45)" : "rgba(224, 64, 15, 0.42)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(vpPx.x, vpPx.y, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = diag.allOk ? "#146B48" : "#E0400F";
    ctx.fill();
    ctx.strokeStyle = "#FAF6F0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 原海报标字：「消失点 ONE POINT」与右侧「视平线 HORIZON LINE」（加浅暖纸垫底防碰远天花或黑框）
    ctx.textAlign = "center";
    const labelY = vpPx.y > 76 ? vpPx.y - 34 : vpPx.y + 28;
    ctx.fillStyle = "rgba(242, 235, 226, 0.92)";
    ctx.fillRect(vpPx.x - 38, labelY - 12, 76, 30);
    ctx.fillStyle = "#141413";
    ctx.font = '700 12px "Noto Sans SC", sans-serif';
    ctx.fillText("消失点", vpPx.x, labelY);
    ctx.font = '700 11px "Big Shoulders", sans-serif';
    ctx.fillStyle = "#4A453F";
    ctx.fillText("ONE POINT", vpPx.x, labelY + 13);

    // 视平线右侧标字（加暖米底框，不与右门粗黑框叠字）
    if (w >= 440) {
      const hy = clamp(vpPx.y - 10, 22, h - 26);
      ctx.fillStyle = "rgba(242, 235, 226, 0.94)";
      ctx.fillRect(w - 94, hy - 13, 86, 30);
      ctx.strokeStyle = "rgba(20, 20, 19, 0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(w - 94, hy - 13, 86, 30);
      ctx.textAlign = "right";
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = "#141413";
      ctx.fillText(`视平线 ${Math.round(state.vpY * 100)}%`, w - 13, hy - 1);
      ctx.font = '700 9.5px "Space Mono", monospace';
      ctx.fillStyle = "#4A453F";
      ctx.fillText("HORIZON LINE", w - 13, hy + 11);
    }
    ctx.restore();

    // 9) 画布上直观的错位/选中浮标（不挡画面主体，窄屏精简）
    const compact = w < 460;
    if (benchBad) {
      drawBadgePill(
        ctx,
        cam.bench.center.x,
        cam.bench.center.y - 20,
        compact ? `① 偏 ${state.benchAngleDeg > 0 ? "+" : ""}${Math.round(state.benchAngleDeg)}°` : `① ${sc.benchLabel} 偏 ${state.benchAngleDeg > 0 ? "+" : ""}${state.benchAngleDeg.toFixed(0)}° · 横拖扳正`,
        benchSel ? "#A81910" : "#141413",
        "#FAF6F0",
        benchSel ? "#FAF6F0" : "#E54616"
      );
    } else if (benchSel) {
      drawBadgePill(ctx, cam.bench.center.x, cam.bench.center.y - 18, `① ${sc.benchLabel} 已齐`, "#146B48", "#FAF6F0");
    }

    if (doorBad) {
      drawBadgePill(
        ctx,
        cam.door.center.x - (compact ? 18 : 26),
        cam.door.poly[0].y + 18,
        compact ? `② 视平 ${state.doorHorizonOffset > 0 ? "低" : "高"}${Math.abs(Math.round(state.doorHorizonOffset))}%` : `② ${sc.doorLabel} 视平差 ${Math.abs(state.doorHorizonOffset).toFixed(0)}% · 拖齐`,
        doorSel ? "#A81910" : "#141413",
        "#FAF6F0",
        doorSel ? "#FAF6F0" : "#E54616"
      );
    } else if (doorSel) {
      drawBadgePill(ctx, cam.door.center.x - 16, cam.door.poly[0].y + 18, `② ${sc.doorLabel} 已齐`, "#146B48", "#FAF6F0");
    }

    if (pedBad) {
      drawBadgePill(
        ctx,
        cam.pedestal.center.x,
        cam.pedestal.fTL.y - 16,
        compact ? `③ 偏航 ${Math.round(state.pedestalYawDeg)}°` : `③ ${sc.pedestalLabel} 偏航 ${state.pedestalYawDeg.toFixed(0)}° · 掰正`,
        pedSel ? "#A81910" : "#141413",
        "#FAF6F0",
        pedSel ? "#FAF6F0" : "#E54616"
      );
    } else if (pedSel) {
      drawBadgePill(ctx, cam.pedestal.center.x, cam.pedestal.fTL.y - 16, `③ ${sc.pedestalLabel} 已齐`, "#146B48", "#FAF6F0");
    }

    // 10) 左上极轻状态水印标尺（单真源）
    ctx.save();
    ctx.fillStyle = "rgba(15, 15, 15, 0.86)";
    const statusStr = `${diag.alignedCount}/3 构件对齐 · 纵深 ${diag.metrics.depthRatio}× · 天/地 ${diag.metrics.ceilingShare}/${diag.metrics.floorShare}`;
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", sans-serif';
    const sw = ctx.measureText(statusStr).width + 16;
    ctx.fillRect(10, 10, sw, 24);
    ctx.fillStyle = diag.allOk ? "#5CE0A8" : "#FAF6F0";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(statusStr, 18, 22);
    ctx.restore();
  }

  const runner = loop(canvas, drawScene);

  // ---- 统一指针与触屏交互：既支持点击切换构件，也支持顺手横向直拖扳正与拖移消失点 ----
  let dragMode = null; // "bench" | "door" | "pedestal" | "vp"
  let startX = 0;
  let startY = 0;
  let startVal = 0;
  let startVpX = 0;
  let startVpY = 0;
  let gestureLocked = null; // null | "h" | "v"

  function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  }

  function pickTarget(pt) {
    if (!lastCam) return state.activeTarget;
    // 1. 精确命中主消失点朱红圆靶（收紧半径到 18px，不误抢长廊中段横拖校准）
    if (dist(pt, lastCam.vpPx) <= 18) return "vp";
    // 2. 命中三件建筑构件热区
    const dBench = Math.min(dist(pt, lastCam.bench.center), dist(pt, lastCam.bench.handle));
    const dDoor = Math.min(dist(pt, lastCam.door.center), dist(pt, lastCam.door.handle));
    const dPed = Math.min(dist(pt, lastCam.pedestal.center), dist(pt, lastCam.pedestal.handle));
    const hits = [
      { key: "bench", d: dBench, r: 78 },
      { key: "door", d: dDoor, r: 84 },
      { key: "pedestal", d: dPed, r: 68 },
    ].filter((x) => x.d <= x.r).sort((a, b) => a.d - b.d);
    if (hits.length) return hits[0].key;

    // 3. 若点在空廊道区：优先操控当前选中且尚未对齐的构件，如果全对齐则操控消失点（保证 perf 中心横拖永远真实驱动画布！）
    const diag = diagnose(state);
    if (state.activeTarget === "bench" && !diag.checks.benchOk) return "bench";
    if (state.activeTarget === "door" && !diag.checks.doorOk) return "door";
    if (state.activeTarget === "pedestal" && !diag.checks.pedestalOk) return "pedestal";
    if (!diag.checks.benchOk) return "bench";
    if (!diag.checks.doorOk) return "door";
    if (!diag.checks.pedestalOk) return "pedestal";
    return "vp";
  }

  let uiPending = false;
  function scheduleUI() {
    dirty = true;
    if (reducedMotion.matches) {
      onChange();
      runner.draw();
      return;
    }
    if (!uiPending) {
      uiPending = true;
      requestAnimationFrame(() => {
        uiPending = false;
        onChange();
      });
    }
  }

  function beginDrag(pt) {
    const picked = pickTarget(pt);
    dragMode = picked;
    state.activeTarget = picked;
    startX = pt.x;
    startY = pt.y;
    startVpX = state.vpX;
    startVpY = state.vpY;
    gestureLocked = null;
    if (picked === "bench") startVal = state.benchAngleDeg;
    else if (picked === "door") startVal = state.doorHorizonOffset;
    else if (picked === "pedestal") startVal = state.pedestalYawDeg;
    scheduleUI();
  }

  function applyDrag(pt) {
    const dx = pt.x - startX;
    const dy = pt.y - startY;
    if (dragMode === "vp") {
      state.vpX = clamp(startVpX + dx / Math.max(220, w), 0.16, 0.84);
      state.vpY = clamp(startVpY + dy / Math.max(180, h), 0.16, 0.84);
    } else if (dragMode === "bench") {
      // 向右横拖顺势把正漂移扳回 0°，靠近 0° 时轻吸附
      let next = clamp(startVal - (dx / Math.max(180, w)) * 38, -28, 28);
      if (Math.abs(next) < 1.5) next = 0;
      state.benchAngleDeg = +next.toFixed(1);
    } else if (dragMode === "door") {
      let next = clamp(startVal - (dx / Math.max(180, w)) * 52, -32, 32);
      if (Math.abs(next) < 1.8) next = 0;
      state.doorHorizonOffset = +next.toFixed(1);
    } else if (dragMode === "pedestal") {
      let next = clamp(startVal - (dx / Math.max(180, w)) * 50, -32, 32);
      if (Math.abs(next) < 1.8) next = 0;
      state.pedestalYawDeg = +next.toFixed(1);
    }
    scheduleUI();
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    beginDrag(getPoint(e));
    const onMove = (ev) => applyDrag(getPoint(ev));
    const onUp = () => {
      dragMode = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  // 触屏事件（严守 GUIDE.md：只接管横向拖动或直接拖红点，竖向滑屏不拦截页面滚动！）
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    beginDrag(getPoint(e));
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragMode || e.touches.length !== 1) return;
    const pt = getPoint(e);
    const dx = Math.abs(pt.x - startX);
    const dy = Math.abs(pt.y - startY);
    if (!gestureLocked && (dx > 5 || dy > 5)) {
      gestureLocked = dragMode === "vp" ? "h" : dx >= dy * 0.85 ? "h" : "v";
    }
    if (gestureLocked === "v") return; // 放行页面纵向滚屏
    if (e.cancelable) e.preventDefault();
    applyDrag(pt);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    dragMode = null;
    gestureLocked = null;
  }, { passive: true });

  // 键盘支持：焦点落在画布上时，←/→ 微调当前构件或消失点 X，↑/↓ 调消失点高度，Tab 之外按 1/2/3/4 切目标
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 4 : 2;
    let handled = true;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const sign = e.key === "ArrowRight" ? 1 : -1;
      if (state.activeTarget === "bench") {
        state.benchAngleDeg = clamp(+(state.benchAngleDeg - sign * step).toFixed(1), -28, 28);
        if (Math.abs(state.benchAngleDeg) < 1.2) state.benchAngleDeg = 0;
      } else if (state.activeTarget === "door") {
        state.doorHorizonOffset = clamp(+(state.doorHorizonOffset - sign * step).toFixed(1), -32, 32);
        if (Math.abs(state.doorHorizonOffset) < 1.5) state.doorHorizonOffset = 0;
      } else if (state.activeTarget === "pedestal") {
        state.pedestalYawDeg = clamp(+(state.pedestalYawDeg - sign * step).toFixed(1), -32, 32);
        if (Math.abs(state.pedestalYawDeg) < 1.5) state.pedestalYawDeg = 0;
      } else {
        state.vpX = clamp(+(state.vpX + sign * 0.03).toFixed(2), 0.16, 0.84);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const sign = e.key === "ArrowUp" ? -1 : 1;
      state.vpY = clamp(+(state.vpY + sign * 0.03).toFixed(2), 0.16, 0.84);
    } else if (e.key === "1") {
      state.activeTarget = "bench";
    } else if (e.key === "2") {
      state.activeTarget = "door";
    } else if (e.key === "3") {
      state.activeTarget = "pedestal";
    } else if (e.key === "4") {
      state.activeTarget = "vp";
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      dirty = true;
      onChange();
      runner.draw();
    }
  });

  window.addEventListener("resize", () => { needsResize = true; dirty = true; runner.draw(); });

  return {
    draw: () => { dirty = true; runner.draw(); },
  };
}
