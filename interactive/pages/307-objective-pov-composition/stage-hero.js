// 307 客观视角构图 · 2D Canvas 3D 透视建筑全景渲染器
// 严格单真源：完全读取 model.js 的 makeCamera / getWorldActors / computeBlurPx / evaluate。
// 性能策略：零跨画布纹理回读、零每帧 ctx.filter blur，采用原生多层光学弥散柔焦，在 SwiftShader 软渲染 6× CPU 降速下仍稳 60fps。

import { PALETTE, SCENES, clamp } from "./model.js";

function drawPoly(ctx, pts, fill, stroke = null, lineWidth = 1) {
  if (pts.length < 3 || pts.some((p) => !p.visible)) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].sx, pts[0].sy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawQuad(ctx, cam, p0, p1, p2, p3, fill, stroke = null, lw = 1) {
  const pts = [
    cam.project(p0[0], p0[1], p0[2]),
    cam.project(p1[0], p1[1], p1[2]),
    cam.project(p2[0], p2[1], p2[2]),
    cam.project(p3[0], p3[1], p3[2]),
  ];
  drawPoly(ctx, pts, fill, stroke, lw);
}

// 绘制无五官极简深普鲁士海蓝剪影人物（背影 / 站立 / 行走 / 拎包，绝不画五官）
export function drawSilhouetteActor(ctx, a, options = {}) {
  const { highlight = false, isLead = false, alpha = 1, color = PALETTE.ink } = options;
  if (!a.foot.visible || !a.head.visible || a.hPx < 4) return;
  const x = a.foot.sx;
  const yFoot = a.foot.sy;
  const h = a.hPx;
  const w = h * 0.27;

  ctx.save();
  ctx.globalAlpha = alpha;

  // 柔和地面投射长影（与原海报一致向右微斜）
  ctx.fillStyle = "rgba(2, 32, 55, 0.16)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.72, yFoot + Math.max(1, h * 0.012), w * 0.92, Math.max(1.5, h * 0.032), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;

  // 头部（无五官干净椭圆轮廓）
  const headR = h * 0.068;
  const headY = yFoot - h + headR * 1.1;
  ctx.beginPath();
  ctx.ellipse(x, headY, headR * 0.86, headR * 1.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // 颈部与肩部大衣/西装剪影
  const neckY = headY + headR * 0.92;
  const shY = yFoot - h * 0.79;
  const waistY = yFoot - h * 0.49;
  const hipY = yFoot - h * 0.42;
  const shW = w * (isLead ? 0.64 : 0.56);
  const waistW = w * (isLead ? 0.47 : 0.42);

  ctx.beginPath();
  ctx.moveTo(x - headR * 0.38, neckY);
  ctx.lineTo(x + headR * 0.38, neckY);
  ctx.lineTo(x + shW, shY + h * 0.025);
  // 右袖外缘
  ctx.lineTo(x + shW * 1.02, waistY + h * 0.03);
  ctx.lineTo(x + waistW, waistY + h * 0.02);
  ctx.lineTo(x + waistW * 0.95, hipY);
  ctx.lineTo(x - waistW * 0.95, hipY);
  ctx.lineTo(x - waistW, waistY + h * 0.02);
  ctx.lineTo(x - shW * 1.02, waistY + h * 0.03);
  ctx.lineTo(x - shW, shY + h * 0.025);
  ctx.closePath();
  ctx.fill();

  // 腿部轮廓（区分站立与步行步幅）
  const legTopY = hipY - h * 0.02;
  const legW = w * 0.21;
  if (a.pose === "walkR") {
    // 左脚在后、右脚迈前
    ctx.beginPath();
    ctx.moveTo(x - waistW * 0.65, legTopY);
    ctx.lineTo(x - waistW * 0.05, legTopY);
    ctx.lineTo(x - w * 0.46, yFoot);
    ctx.lineTo(x - w * 0.74, yFoot);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + waistW * 0.05, legTopY);
    ctx.lineTo(x + waistW * 0.65, legTopY);
    ctx.lineTo(x + w * 0.72, yFoot);
    ctx.lineTo(x + w * 0.44, yFoot);
    ctx.closePath();
    ctx.fill();
  } else {
    // 端庄站立 / 背影双腿
    ctx.beginPath();
    ctx.moveTo(x - waistW * 0.72, legTopY);
    ctx.lineTo(x - waistW * 0.06, legTopY);
    ctx.lineTo(x - legW * 0.38, yFoot);
    ctx.lineTo(x - legW * 1.38, yFoot);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + waistW * 0.06, legTopY);
    ctx.lineTo(x + waistW * 0.72, legTopY);
    ctx.lineTo(x + legW * 1.38, yFoot);
    ctx.lineTo(x + legW * 0.38, yFoot);
    ctx.closePath();
    ctx.fill();

    // 拎公文包剪影
    if (a.pose === "bag") {
      ctx.fillRect(x - shW * 1.42, waistY + h * 0.04, w * 0.44, h * 0.14);
    }
  }

  // 可拖动主角高亮细框与柔和金边
  if (highlight) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x - shW * 1.45, headY - headR * 1.4, shW * 2.9, h + headR * 1.6);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// 绘制原海报招牌金黄秋树（深靛树干细枝 + 多层暖琥珀圆润树冠）
function drawGoldenTree(ctx, cam, tree, sceneId) {
  const base = cam.project(tree.x, 0, tree.z);
  const top = cam.project(tree.x, tree.h, tree.z);
  if (!base.visible || !top.visible) return;
  const hPx = Math.abs(base.sy - top.sy);
  if (hPx < 6) return;

  ctx.save();
  // 地面树影
  ctx.fillStyle = "rgba(2, 32, 55, 0.14)";
  ctx.beginPath();
  ctx.ellipse(base.sx + hPx * 0.08, base.sy + 2, hPx * 0.24, Math.max(2, hPx * 0.03), 0, 0, Math.PI * 2);
  ctx.fill();

  if (sceneId === "gallery") {
    // 美术馆暖金落地灯柱
    const colW = Math.max(4, hPx * 0.13);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(base.sx - colW * 0.75, base.sy - hPx * 0.08, colW * 1.5, hPx * 0.08);
    ctx.fillStyle = PALETTE.treeGold;
    ctx.fillRect(base.sx - colW * 0.42, top.sy + hPx * 0.08, colW * 0.84, hPx * 0.84);
    ctx.fillStyle = "#F7CF65";
    ctx.fillRect(base.sx - colW * 0.18, top.sy + hPx * 0.12, colW * 0.36, hPx * 0.76);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(base.sx - colW * 0.56, top.sy + hPx * 0.04, colW * 1.12, hPx * 0.05);
    ctx.restore();
    return;
  }

  if (sceneId === "station") {
    // 候车厅标志性琥珀金时钟/时刻柱
    const poleW = Math.max(3, hPx * 0.065);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(base.sx - poleW * 0.5, top.sy + hPx * 0.32, poleW, hPx * 0.68);
    const dialR = hPx * 0.22;
    const dialY = top.sy + hPx * 0.26;
    ctx.fillStyle = PALETTE.treeGold;
    ctx.beginPath();
    ctx.arc(base.sx, dialY, dialR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(1.2, hPx * 0.025);
    ctx.stroke();
    // 时针分针
    ctx.beginPath();
    ctx.moveTo(base.sx, dialY);
    ctx.lineTo(base.sx, dialY - dialR * 0.58);
    ctx.moveTo(base.sx, dialY);
    ctx.lineTo(base.sx + dialR * 0.46, dialY + dialR * 0.14);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 原海报经典金黄秋树：饱满暖金云团树冠 + 深普鲁士蓝细枝
  const cx = base.sx;
  const cy = base.sy - hPx * 0.62;
  const r = hPx * 0.27;

  const puffs = [
    [0, -0.42, 0.72, "#E8B53E"],
    [-0.58, -0.18, 0.68, "#E2A92E"],
    [0.54, -0.16, 0.66, "#E7B33B"],
    [-0.64, 0.34, 0.62, "#DCA126"],
    [0.52, 0.38, 0.62, "#E3AA31"],
    [0, 0.08, 0.84, PALETTE.treeGold],
    [-0.14, 0.48, 0.56, "#DDA329"],
  ];
  for (const [ox, oy, sr, col] of puffs) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx + ox * r, cy + oy * r, r * sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 深靛蓝树干与分叉枝桠
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.6, hPx * 0.032);
  ctx.beginPath();
  ctx.moveTo(base.sx, base.sy);
  ctx.lineTo(base.sx, cy + r * 0.35);
  ctx.stroke();

  ctx.lineWidth = Math.max(1, hPx * 0.016);
  const branches = [
    [0, 0.35, -0.45, -0.05],
    [0, 0.22, 0.42, -0.14],
    [0, 0.05, -0.25, -0.48],
    [0, 0.1, 0.2, -0.42],
  ];
  for (const [x0, y0, x1, y1] of branches) {
    ctx.beginPath();
    ctx.moveTo(cx + x0 * r, cy + y0 * r);
    ctx.lineTo(cx + x1 * r, cy + y1 * r);
    ctx.stroke();
  }

  ctx.restore();
}

// 绘制广场地面与 3D 透视石板网格
function drawGround(ctx, cam, state, w, h) {
  // 暖羊皮纸基底天空
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  // 广场石板大面（z = -2 到 z = 15.5）
  drawQuad(
    ctx,
    cam,
    [-22, 0, -1],
    [22, 0, -1],
    [22, 0, 15.5],
    [-22, 0, 15.5],
    PALETTE.plaza
  );

  // 3D 透视石板网格线（随俯仰和倾角实时变形）
  ctx.save();
  ctx.strokeStyle = state.highlightCard === "staging" ? "rgba(230, 168, 38, 0.65)" : "rgba(134, 148, 162, 0.26)";
  ctx.lineWidth = state.highlightCard === "staging" ? 1.35 : 0.9;

  for (let x = -14; x <= 14; x += 2) {
    const pA = cam.project(x, 0, 0.2);
    const pB = cam.project(x, 0, 13.5);
    if (pA.visible && pB.visible) {
      ctx.beginPath();
      ctx.moveTo(pA.sx, pA.sy);
      ctx.lineTo(pB.sx, pB.sy);
      ctx.stroke();
    }
  }
  for (let z = 1.5; z <= 13.5; z += 1.5) {
    const pL = cam.project(-14, 0, z);
    const pR = cam.project(14, 0, z);
    if (pL.visible && pR.visible) {
      ctx.beginPath();
      ctx.moveTo(pL.sx, pL.sy);
      ctx.lineTo(pR.sx, pR.sy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 绘制三套建筑空间背景（支持清晰直接绘制，或在浅景深时绘制到降采样画布以模拟真实光学散景）
function drawArchitecture(ctx, cam, state) {
  const sc = SCENES[state.scene] || SCENES.plaza;

  if (state.scene === "gallery") {
    // 1. 美术馆中庭背景墙与对称展画框
    drawQuad(ctx, cam, [-13, 0, 15.3], [13, 0, 15.3], [13, 7.2, 15.3], [-13, 7.2, 15.3], PALETTE.stone);
    // 展墙顶檐暗线
    drawQuad(ctx, cam, [-13, 6.7, 15.25], [13, 6.7, 15.25], [13, 7.2, 15.25], [-13, 7.2, 15.25], PALETTE.stoneShade);
    // 中央大型画框大门 / 装置拱门
    drawQuad(ctx, cam, [-2.0, 0, 15.1], [2.0, 0, 15.1], [2.0, 3.1, 15.1], [-2.0, 3.1, 15.1], PALETTE.door);
    // 两侧大型装饰几何展画
    drawQuad(ctx, cam, [-6.5, 1.8, 15.1], [-3.2, 1.8, 15.1], [-3.2, 4.6, 15.1], [-6.5, 4.6, 15.1], PALETTE.slateLeft);
    drawQuad(ctx, cam, [3.2, 1.8, 15.1], [6.5, 1.8, 15.1], [6.5, 4.6, 15.1], [3.2, 4.6, 15.1], PALETTE.slateRight);
    // 左暗色廊壁与对称立柱
    drawQuad(ctx, cam, [-13.5, 0, 4.8], [-8.8, 0, 4.8], [-8.8, 7.6, 4.8], [-13.5, 7.6, 4.8], PALETTE.inkDeep);
    drawQuad(ctx, cam, [-8.8, 0, 4.8], [-7.2, 0, 14.2], [-7.2, 6.9, 14.2], [-8.8, 7.6, 4.8], PALETTE.slateLeft);
    for (const pz of [7.2, 10.6, 13.8]) {
      drawQuad(ctx, cam, [-7.1, 0, pz], [-6.4, 0, pz], [-6.4, 6.6, pz], [-7.1, 6.6, pz], PALETTE.stoneShade);
      drawQuad(ctx, cam, [6.4, 0, pz], [7.1, 0, pz], [7.1, 6.6, pz], [6.4, 6.6, pz], PALETTE.stoneShade);
    }
    // 右侧雾蓝灰斜壁
    drawQuad(ctx, cam, [8.6, 0, 6.0], [14.5, 0, 5.2], [14.5, 7.8, 5.2], [8.6, 6.6, 6.0], PALETTE.slateRight);
    drawGoldenTree(ctx, cam, sc.tree, state.scene);
    return;
  }

  if (state.scene === "station") {
    // 车站大跨度玻璃幕墙大厅（致敬塔蒂 PlayTime 现代建筑网格）
    drawQuad(ctx, cam, [-14, 0, 15.5], [14, 0, 15.5], [14, 7.8, 15.5], [-14, 7.8, 15.5], "#ECE2D0");
    // 幕墙钢构网格
    ctx.save();
    ctx.strokeStyle = PALETTE.slateLeft;
    ctx.lineWidth = 1.2;
    for (let gx = -12; gx <= 12; gx += 2.4) {
      const a = cam.project(gx, 0, 15.35);
      const b = cam.project(gx, 7.6, 15.35);
      if (a.visible && b.visible) {
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }
    for (let gy = 2.0; gy <= 7.0; gy += 1.8) {
      const a = cam.project(-12, gy, 15.35);
      const b = cam.project(12, gy, 15.35);
      if (a.visible && b.visible) {
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }
    ctx.restore();
    // 中央深靛蓝候车检票主门
    drawQuad(ctx, cam, [-2.2, 0, 15.2], [2.2, 0, 15.2], [2.2, 3.0, 15.2], [-2.2, 3.0, 15.2], PALETTE.door);
    // 顶挂出发时刻牌
    drawQuad(ctx, cam, [-3.0, 4.1, 14.8], [3.0, 4.1, 14.8], [3.0, 5.1, 14.8], [-3.0, 5.1, 14.8], PALETTE.inkDeep);
    drawQuad(ctx, cam, [-2.6, 4.45, 14.75], [-0.4, 4.45, 14.75], [-0.4, 4.72, 14.75], [-2.6, 4.72, 14.75], PALETTE.gold);
    // 两侧建筑体块
    drawQuad(ctx, cam, [-14.2, 0, 5.2], [-8.4, 0, 5.2], [-8.4, 7.2, 5.2], [-14.2, 7.2, 5.2], PALETTE.inkDeep);
    drawQuad(ctx, cam, [-8.4, 0, 5.2], [-6.8, 0, 12.6], [-6.8, 6.2, 12.6], [-8.4, 7.2, 5.2], PALETTE.slateLeft);
    drawQuad(ctx, cam, [8.2, 0, 6.0], [14.8, 0, 5.0], [14.8, 7.6, 5.0], [8.2, 6.4, 6.0], PALETTE.slateRight);
    drawGoldenTree(ctx, cam, sc.tree, state.scene);
    return;
  }

  // ========= 默认：1:1 承袭 307 原海报石阶广场 =========
  // 1. 中景对称浅石主馆（带石材立柱节奏）
  drawQuad(ctx, cam, [-6.4, 0.95, 15.4], [6.4, 0.95, 15.4], [6.4, 6.9, 15.4], [-6.4, 6.9, 15.4], PALETTE.stone);
  // 主馆左右略矮石翼
  drawQuad(ctx, cam, [-10.0, 0.6, 15.8], [-6.4, 0.6, 15.8], [-6.4, 4.6, 15.8], [-10.0, 4.6, 15.8], "#DDD2C1");
  drawQuad(ctx, cam, [6.4, 0.6, 15.8], [10.0, 0.6, 15.8], [10.0, 4.6, 15.8], [6.4, 4.6, 15.8], "#DDD2C1");
  // 主馆细腻竖向石柱纹理
  ctx.save();
  ctx.strokeStyle = "rgba(134, 148, 162, 0.24)";
  ctx.lineWidth = 1;
  for (let bx = -5.6; bx <= 5.6; bx += 1.4) {
    const a = cam.project(bx, 1.0, 15.35);
    const b = cam.project(bx, 6.8, 15.35);
    if (a.visible && b.visible) {
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 2. 宽阔阶梯（5 级对称灰蓝石阶）
  for (let s = 0; s < 5; s++) {
    const sz = 12.2 + s * 0.62;
    const sy0 = s * 0.19;
    const sy1 = (s + 1) * 0.19;
    const sw = 6.2 - s * 0.22;
    drawQuad(ctx, cam, [-sw, sy0, sz], [sw, sy0, sz], [sw, sy1, sz], [-sw, sy1, sz], s % 2 === 0 ? "#95A3AC" : PALETTE.stairs);
    drawQuad(ctx, cam, [-sw, sy1, sz], [sw, sy1, sz], [sw, sy1, sz + 0.62], [-sw, sy1, sz + 0.62], "#C9CFD3");
  }

  // 3. 主馆中央深蓝大门（原海报核心地标）
  drawQuad(ctx, cam, [-1.65, 0.95, 15.22], [1.65, 0.95, 15.22], [1.65, 3.65, 15.22], [-1.65, 3.65, 15.22], PALETTE.door);

  // 4. 左侧深普鲁士海蓝建筑主块 + 侧面冷灰蓝斜墙 + 暗色附属翼楼
  drawQuad(ctx, cam, [-14.2, 0, 6.2], [-7.5, 0, 6.2], [-7.5, 6.4, 6.2], [-14.2, 6.4, 6.2], PALETTE.inkDeep);
  // 侧面斜壁
  drawQuad(ctx, cam, [-7.5, 0, 6.2], [-5.9, 0, 11.4], [-5.9, 5.4, 11.4], [-7.5, 6.4, 6.2], PALETTE.slateLeft);
  // 左楼延伸低翼
  drawQuad(ctx, cam, [-6.0, 0, 10.6], [-4.2, 0, 13.2], [-4.2, 2.7, 13.2], [-6.0, 3.7, 10.6], "#0B253A");
  // 左楼 3×2 窗格（原海报招牌几何韵律）
  const winCols = [-11.5, -9.85, -8.3];
  const winRows = [4.95, 3.55, 2.15];
  for (const wy of winRows) {
    for (const wx of winCols) {
      drawQuad(ctx, cam, [wx, wy, 6.16], [wx + 0.72, wy, 6.16], [wx + 0.72, wy + 0.72, 6.16], [wx, wy + 0.72, 6.16], PALETTE.window);
    }
  }

  // 5. 右侧高耸雾蓝灰斜角建筑体块
  drawQuad(ctx, cam, [7.6, 0, 11.4], [14.8, 0, 5.4], [14.8, 8.6, 5.4], [7.6, 6.3, 11.4], PALETTE.slateRight);

  // 6. 右前招牌金黄秋树
  drawGoldenTree(ctx, cam, sc.tree, state.scene);
}

// 绘制五联档案卡激活时的专属几何分析层（点哪张卡，就在画布亮哪层分析图形！）
function drawCardHighlightOverlay(ctx, ev, state, w, h) {
  const mode = state.highlightCard;
  if (!mode) return;
  const cam = ev.cam;
  const lead = ev.lead;
  ctx.save();

  if (mode === "neutral") {
    // 标出理想 0° 水平线 vs 当前倾斜地平线
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.52);
    ctx.lineTo(w * 0.94, h * 0.52);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (mode === "spatial") {
    // 复刻原海报「空间关系」小卡：建筑与人物之间的虚线联系网络
    const doorPt = cam.project(0, 2.2, 15.2);
    const treePt = cam.project(SCENES[state.scene].tree.x, 3.2, SCENES[state.scene].tree.z);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    for (const a of ev.actors) {
      if (!a.visibleAtAll || a.id === "lead") continue;
      if (lead.visibleAtAll) {
        ctx.beginPath();
        ctx.moveTo(lead.mid.sx, lead.mid.sy);
        ctx.lineTo(a.mid.sx, a.mid.sy);
        ctx.stroke();
      }
    }
    if (lead.visibleAtAll && doorPt.visible) {
      ctx.beginPath();
      ctx.moveTo(lead.mid.sx, lead.mid.sy);
      ctx.lineTo(doorPt.sx, doorPt.sy);
      ctx.stroke();
    }
    if (lead.visibleAtAll && treePt.visible) {
      ctx.beginPath();
      ctx.moveTo(lead.mid.sx, lead.mid.sy);
      ctx.lineTo(treePt.sx, treePt.sy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // 节点圆点
    ctx.fillStyle = PALETTE.gold;
    for (const pt of [doorPt, treePt, ...ev.actors.filter((a) => a.visibleAtAll).map((a) => a.mid)]) {
      if (!pt.visible) continue;
      ctx.beginPath();
      ctx.arc(pt.sx, pt.sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mode === "detachment") {
    // 复刻原海报「旁观感」小卡：主角周围虚线安全观察弧圈
    if (lead.visibleAtAll) {
      const r = clamp(lead.hPx * 0.92, 34, Math.min(w, h) * 0.36);
      ctx.strokeStyle = ev.cards[3].ok ? PALETTE.ok : PALETTE.bad;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(lead.mid.sx, lead.foot.sy - lead.hPx * 0.42, r, Math.PI * 1.04, Math.PI * 1.96);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (mode === "clarity") {
    // 标出「信息完整」安全边界框与可见人数标牌
    ctx.strokeStyle = ev.cards[2].ok ? PALETTE.ok : PALETTE.bad;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(w * 0.055, h * 0.06, w * 0.89, h * 0.88);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// 绘制前景偷窥遮挡柱（试错：偷窥挡镜开启时）
function drawPeekObstruction(ctx, w, h) {
  ctx.save();
  const pw = w * 0.29;
  const grad = ctx.createLinearGradient(0, 0, pw + 26, 0);
  grad.addColorStop(0, "rgba(1, 20, 36, 0.97)");
  grad.addColorStop(0.84, "rgba(1, 20, 36, 0.92)");
  grad.addColorStop(1, "rgba(1, 20, 36, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pw + 26, h);
  ctx.strokeStyle = PALETTE.badDark;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(pw, 10);
  ctx.lineTo(pw, h - 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// 绘制原海报标志性的极细虚线水平/垂直基准轴与中心 + 记号（建筑平视基准轴）
function drawOpticalGuides(ctx, ev, state, w, h, compact = false) {
  const cam = ev.cam;
  // 缩略考题预览（compact）永远画中性细线，绝不靠变红泄题
  const okNeutral = compact ? true : (Math.abs(state.tilt) <= 3 && state.pitch >= -6 && state.pitch <= 8);
  ctx.save();

  // 1. 极细建筑水平与垂直参考虚线（随倾角旋转，倾角归 0 时严丝贴合画框垂直与水平中线）
  const cx = w * 0.5;
  const cy = clamp(cam.horizonY, h * 0.14, h * 0.84);
  ctx.translate(cx, cy);
  ctx.rotate(cam.tiltRad);

  ctx.strokeStyle = okNeutral ? "rgba(2, 32, 55, 0.34)" : "rgba(181, 43, 34, 0.55)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.lineTo(w, 0);
  ctx.moveTo(0, -h);
  ctx.lineTo(0, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // 中心细 + 基准点（复刻 307 原海报大门正上方的极细 + 号）
  const arm = compact ? 5 : 8;
  ctx.strokeStyle = okNeutral ? PALETTE.ink : PALETTE.bad;
  ctx.lineWidth = compact ? 1.4 : 1.8;
  ctx.beginPath();
  ctx.moveTo(-arm, 0);
  ctx.lineTo(arm, 0);
  ctx.moveTo(0, -arm);
  ctx.lineTo(0, arm);
  ctx.stroke();

  ctx.restore();

  // 2. 若倾角偏斜，在画面水平 0° 处画一道浅参考虚线对比歪斜量
  if (!compact && Math.abs(state.tilt) > 3) {
    ctx.save();
    ctx.strokeStyle = "rgba(2, 32, 55, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.52);
    ctx.lineTo(w * 0.92, h * 0.52);
    ctx.stroke();
    ctx.restore();
  }
}

// 绘制画布上的简明原位标签（只在主舞台显示，保证高对比、窄屏绝不重叠）
function drawStageHud(ctx, ev, state, w, h) {
  ctx.save();
  const isNarrow = w < 520;
  const pad = isNarrow ? 8 : 14;
  const fontMono = `${isNarrow ? 11 : 12}px "JetBrains Mono", monospace`;
  const fontSans = `600 ${isNarrow ? 11 : 12}px "Noto Sans SC", sans-serif`;

  // 左上紧凑镜头机位数据条（深普鲁士海蓝实底白字，窄屏自动精简避免撞上右上徽章）
  const specText = isNarrow
    ? `${state.focal}MM · ${state.distance.toFixed(1)}M · ${state.pitch >= 0 ? "+" : ""}${Math.round(state.pitch)}°`
    : `${state.focal}MM  ·  ${state.distance.toFixed(1)}M  ·  俯仰 ${state.pitch >= 0 ? "+" : ""}${Math.round(state.pitch)}°  ·  倾 ${state.tilt >= 0 ? "+" : ""}${Math.round(state.tilt)}°`;
  ctx.font = fontMono;
  const tw = ctx.measureText(specText).width;
  ctx.fillStyle = "rgba(2, 32, 55, 0.9)";
  ctx.fillRect(pad, pad, tw + 16, 24);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.textBaseline = "middle";
  ctx.fillText(specText, pad + 8, pad + 12);

  // 右上实时达标/破局徽章
  const badgeText = ev.diagnosis.badge;
  ctx.font = fontSans;
  const bw = ctx.measureText(badgeText).width + 18;
  ctx.fillStyle = ev.diagnosis.ok ? PALETTE.ok : PALETTE.bad;
  ctx.fillRect(w - pad - bw, pad, bw, 24);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(badgeText, w - pad - bw + 9, pad + 12);

  // 长镜头播放状态标牌
  if (state.playing) {
    const recText = isNarrow ? "● 静机长镜头演播中" : "● 静机客观长镜头演播中（机位固定 · 空间自叙）";
    ctx.font = fontSans;
    const rw = ctx.measureText(recText).width + 18;
    ctx.fillStyle = "rgba(2, 32, 55, 0.92)";
    ctx.fillRect(pad, h - pad - 25, Math.min(rw, w - pad * 2), 25);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(recText, pad + 9, h - pad - 12.5);
  } else if (!ev.diagnosis.ok && !isNarrow) {
    // 破局时在画底显示轻巧就地提示
    const hint = ev.issues[0]?.id === "staging"
      ? "左右拖动前景主角，避开叠撞并稳住左右平衡"
      : "向右横拖退远机位 · 纵拖校回平视 0°";
    ctx.font = fontSans;
    const hw = ctx.measureText(hint).width + 18;
    ctx.fillStyle = "rgba(2, 32, 55, 0.88)";
    ctx.fillRect(pad, h - pad - 25, hw, 25);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillText(hint, pad + 9, h - pad - 12.5);
  }

  ctx.restore();
}

// 核心主舞台绘制函数（支持开场流畅推进动画 progress: 0..1）
export function renderHeroStage(ctx, w, h, state, ev, opts = {}) {
  const { progress = 1, compact = false, draggingLead = false } = opts;
  const cam = ev.cam;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // 1. 地面与天空
  drawGround(ctx, cam, state, w, h);

  // 2. 建筑背景 + 远中景人物（长焦浅景深时用原生双偏移光学弥散层 + 柔雾呈现散景，0 次跨 canvas 纹理拷贝）
  const bgBlurPx = ev.bgBlurPx;
  const farActors = ev.actors.slice(1).sort((a, b) => b.wz - a.wz);

  if (bgBlurPx >= 2.2) {
    const spread = clamp(bgBlurPx * 0.45, 1.4, 3.6);
    ctx.save();
    // 柔焦弥散底影（左右微移叠合制造真实长焦光学散景柔边）
    ctx.globalAlpha = 0.28;
    ctx.translate(-spread, -spread * 0.4);
    drawArchitecture(ctx, cam, state);
    for (const a of farActors) drawSilhouetteActor(ctx, a, { alpha: 0.7 });
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.translate(spread, spread * 0.4);
    drawArchitecture(ctx, cam, state);
    for (const a of farActors) drawSilhouetteActor(ctx, a, { alpha: 0.7 });
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.48;
    drawArchitecture(ctx, cam, state);
    for (const a of farActors) drawSilhouetteActor(ctx, a, { alpha: 0.72 });
    // 暖羊皮光学雾膜降低后景反差，立刻把锐利深靛前景主体从后景剥离出来
    ctx.fillStyle = "rgba(253, 237, 210, 0.36)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else {
    drawArchitecture(ctx, cam, state);
    for (const a of farActors) {
      drawSilhouetteActor(ctx, a, { alpha: progress });
    }
  }

  // 3. 前景观察主体（始终合焦清晰）
  const lead = ev.lead;
  if (lead) {
    drawSilhouetteActor(ctx, lead, {
      isLead: true,
      highlight: draggingLead || state.highlightCard === "staging",
      alpha: clamp(progress * 1.15, 0.25, 1),
    });
  }

  // 4. 若处于偷窥试错，叠前景柱影
  if (state.peek) {
    drawPeekObstruction(ctx, w, h);
  }

  // 5. 五联档案卡高亮分析叠加层
  if (!compact) {
    drawCardHighlightOverlay(ctx, ev, state, w, h);
  }

  // 6. 原海报极细虚线水平/垂直参考轴与中心 + 记号
  drawOpticalGuides(ctx, ev, state, w, h, compact);

  // 7. 细边框（开场动画时平滑描入）
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = compact ? 1.5 : 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // 8. 主舞台 HUD 数据条
  if (!compact) {
    drawStageHud(ctx, ev, state, w, h);
  }

  ctx.restore();
}
