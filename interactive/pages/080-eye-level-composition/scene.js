// 080 原海报全景平视街景剧场（纯 2D Canvas 针孔三维投影渲染）
// 1:1 承袭 080 原海报配色与母题：晴空蓝灰、白云、米白砖红拱门、黑圆树、街灯、铁艺长椅、雾蓝远山、石板广场、贯穿砖红眼平线
// 所有人物严格采用无五官极简剪影，符合可读与审美规范。

import { projectPoint, LIMITS, clamp } from "./model.js";

const PAL = {
  skyTop: "#CFE0EB",
  skyMid: "#D7E4EB",
  skyLow: "#E4EDF1",
  cloud: "#F3F0E8",
  hillFar: "#597586",
  hillNear: "#415A68",
  lowWall: "#A54329",
  lowWallDark: "#89341F",
  pavement: "#EFE8DD",
  paveGrid: "#DDD4C6",
  paveFar: "#E8E0D3",
  wallCream: "#F1ECE2",
  wallSide: "#E5DDD0",
  wallTrim: "#DDD5C7",
  archRed: "#973524",
  archInner: "#7D291A",
  ink: "#0E1011",
  branch: "#5E7686",
  terracotta: "#A3432B",
  terracottaBright: "#C94E32",
  okGreen: "#236951",
  silhouette: "#1A232B",
  silhouetteFar: "#384854",
};

function poly(ctx, pts, fill, stroke, lineWidth = 1) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
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

// 绘制一朵平底软云（原海报同款）
function drawCloud(ctx, cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = PAL.cloud;
  ctx.beginPath();
  ctx.moveTo(-78, 0);
  ctx.bezierCurveTo(-76, -18, -52, -24, -40, -14);
  ctx.bezierCurveTo(-30, -38, 6, -42, 22, -20);
  ctx.bezierCurveTo(38, -26, 62, -16, 66, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 绘制极简无五官站立行人剪影（真实 3D 高度：脚 0 到头顶 height）
function drawStandingPerson(ctx, x, z, height, state, w, h, color, facing = 1) {
  const foot = projectPoint(x, 0, z, state, w, h);
  const headTop = projectPoint(x, height, z, state, w, h);
  const eyePt = projectPoint(x, height - 0.12, z, state, w, h);
  if (!foot.visible || !headTop.visible) return null;

  const pxH = Math.hypot(foot.x - headTop.x, foot.y - headTop.y);
  if (pxH < 8) return { foot, headTop, eyePt, pxH };

  // 根据 3D 投影方向对齐人物竖轴（确保俯仰/横滚时人物跟着真实 3D 视角倾斜！）
  const angle = Math.atan2(foot.x - headTop.x, foot.y - headTop.y);
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(-angle);
  const s = pxH / 100;

  // 柔和脚下投影
  ctx.fillStyle = "rgba(14, 16, 17, 0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 1.5 * s, 12 * s, 3.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  // 双腿
  ctx.beginPath();
  ctx.moveTo(-5.2 * s, -44 * s);
  ctx.lineTo(-7.2 * s, 0);
  ctx.lineTo(-2.4 * s, 0);
  ctx.lineTo(-0.4 * s, -38 * s);
  ctx.lineTo(1.2 * s, -38 * s);
  ctx.lineTo(4.6 * s, 0);
  ctx.lineTo(9.0 * s, 0);
  ctx.lineTo(5.8 * s, -44 * s);
  ctx.closePath();
  ctx.fill();

  // 风衣/大衣上身轮廓
  ctx.beginPath();
  ctx.moveTo(-8.5 * s, -42 * s);
  ctx.quadraticCurveTo(-11.5 * s, -62 * s, -8.5 * s, -79 * s);
  ctx.quadraticCurveTo(0, -83 * s, 8.5 * s, -79 * s);
  ctx.quadraticCurveTo(11.5 * s, -62 * s, 9.2 * s, -42 * s);
  ctx.closePath();
  ctx.fill();

  // 颈与无五官头部剪影（略微侧身，绝无五官）
  ctx.fillRect(-2.4 * s, -85 * s, 4.8 * s, 7 * s);
  ctx.beginPath();
  ctx.ellipse(facing * 0.8 * s, -92.2 * s, 6.2 * s, 7.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return { foot, headTop, eyePt, pxH };
}

// 绘制极简无五官坐姿人物剪影（坐高 eyeY ≈ 1.12m）
function drawSeatedPerson(ctx, x, z, eyeY, state, w, h, color, facing = 1) {
  const foot = projectPoint(x, 0, z, state, w, h);
  const headTop = projectPoint(x, eyeY + 0.11, z, state, w, h);
  const eyePt = projectPoint(x, eyeY, z, state, w, h);
  if (!foot.visible || !headTop.visible) return null;

  const pxH = Math.hypot(foot.x - headTop.x, foot.y - headTop.y);
  const angle = Math.atan2(foot.x - headTop.x, foot.y - headTop.y);
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(-angle);
  const s = pxH / 100;
  const dir = facing >= 0 ? 1 : -1;

  // 座凳剪影
  ctx.fillStyle = "rgba(14, 16, 17, 0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 1.5 * s, 20 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#47352E";
  ctx.fillRect(-16 * s, -38 * s, 32 * s, 4.5 * s);
  ctx.fillRect(-13 * s, -34 * s, 3.2 * s, 34 * s);
  ctx.fillRect(9.8 * s, -34 * s, 3.2 * s, 34 * s);

  // 人物坐姿（无五官）
  ctx.fillStyle = color;
  // 屈膝腿部
  ctx.beginPath();
  ctx.moveTo(-7 * s * dir, -38 * s);
  ctx.lineTo(14 * s * dir, -38 * s);
  ctx.lineTo(19 * s * dir, -31 * s);
  ctx.lineTo(16 * s * dir, 0);
  ctx.lineTo(10 * s * dir, 0);
  ctx.lineTo(11 * s * dir, -28 * s);
  ctx.lineTo(-9 * s * dir, -29 * s);
  ctx.closePath();
  ctx.fill();

  // 微微前倾的上身
  ctx.beginPath();
  ctx.moveTo(-10 * s * dir, -37 * s);
  ctx.quadraticCurveTo(-13 * s * dir, -62 * s, -5 * s * dir, -79 * s);
  ctx.quadraticCurveTo(3 * s * dir, -83 * s, 10 * s * dir, -76 * s);
  ctx.quadraticCurveTo(12 * s * dir, -58 * s, 7 * s * dir, -37 * s);
  ctx.closePath();
  ctx.fill();

  // 头颈剪影（完全无五官）
  ctx.beginPath();
  ctx.ellipse(2.5 * s * dir, -91 * s, 8.2 * s, 9.6 * s, dir * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return { foot, headTop, eyePt, pxH };
}

// 绘制孩童与小狗剪影（无五官）
function drawChildAndDog(ctx, x, z, eyeY, state, w, h) {
  const foot = projectPoint(x, 0, z, state, w, h);
  const headTop = projectPoint(x, eyeY + 0.11, z, state, w, h);
  const eyePt = projectPoint(x, eyeY, z, state, w, h);
  if (!foot.visible || !headTop.visible) return null;

  const pxH = Math.hypot(foot.x - headTop.x, foot.y - headTop.y);
  const angle = Math.atan2(foot.x - headTop.x, foot.y - headTop.y);
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(-angle);
  const s = pxH / 100;

  ctx.fillStyle = "rgba(14, 16, 17, 0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 1.5 * s, 14 * s, 3.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAL.silhouette;
  // 孩童双腿
  ctx.fillRect(-7.5 * s, -36 * s, 5.2 * s, 36 * s);
  ctx.fillRect(2.3 * s, -36 * s, 5.2 * s, 36 * s);
  // 背带裙/短外套躯干
  ctx.beginPath();
  ctx.moveTo(-12 * s, -34 * s);
  ctx.lineTo(-9.5 * s, -73 * s);
  ctx.quadraticCurveTo(0, -77 * s, 9.5 * s, -73 * s);
  ctx.lineTo(12 * s, -34 * s);
  ctx.closePath();
  ctx.fill();
  // 头部圆润剪影（儿童头身比略大，无五官）
  ctx.beginPath();
  ctx.ellipse(0, -88 * s, 10.5 * s, 11.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 身旁小狗剪影
  const dogFoot = projectPoint(x + 0.92, 0, z + 0.15, state, w, h);
  const dogTop = projectPoint(x + 0.92, 0.46, z + 0.15, state, w, h);
  if (dogFoot.visible && dogTop.visible) {
    const dH = Math.hypot(dogFoot.x - dogTop.x, dogFoot.y - dogTop.y);
    const dA = Math.atan2(dogFoot.x - dogTop.x, dogFoot.y - dogTop.y);
    ctx.save();
    ctx.translate(dogFoot.x, dogFoot.y);
    ctx.rotate(-dA);
    const ds = dH / 46;
    ctx.fillStyle = "rgba(14, 16, 17, 0.14)";
    ctx.beginPath();
    ctx.ellipse(0, 1 * ds, 18 * ds, 3.5 * ds, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3B2823";
    // 躯干与四肢
    ctx.beginPath();
    ctx.roundRect(-14 * ds, -28 * ds, 26 * ds, 14 * ds, 6 * ds);
    ctx.fill();
    ctx.fillRect(-12 * ds, -16 * ds, 4 * ds, 16 * ds);
    ctx.fillRect(6 * ds, -16 * ds, 4 * ds, 16 * ds);
    // 竖耳与头剪影（无五官）
    ctx.beginPath();
    ctx.ellipse(-14 * ds, -34 * ds, 8 * ds, 7.5 * ds, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12 * ds, -40 * ds);
    ctx.lineTo(-9 * ds, -48 * ds);
    ctx.lineTo(-5 * ds, -38 * ds);
    ctx.closePath();
    ctx.fill();
    // 翘尾
    ctx.strokeStyle = "#3B2823";
    ctx.lineWidth = 3.2 * ds;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(11 * ds, -25 * ds);
    ctx.quadraticCurveTo(20 * ds, -34 * ds, 17 * ds, -42 * ds);
    ctx.stroke();
    ctx.restore();
  }

  return { foot, headTop, eyePt, pxH };
}

export function renderHeroScene(ctx, state, ev, w, h, animT = 1) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  const horiz = ev.horiz;

  // 1. 晴空背景（与顶栏蓝灰无缝融合）
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, PAL.skyTop);
  skyGrad.addColorStop(0.55, PAL.skyMid);
  skyGrad.addColorStop(1, PAL.skyLow);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. 两朵原海报白云（挂在 3D 远空坐标，随俯仰和焦段真实升降）
  const cloudL = projectPoint(-8.5, 5.2, 24, state, w, h);
  const cloudR = projectPoint(9.2, 6.0, 26, state, w, h);
  const cloudScale = (state.focal / 50) * (Math.min(w, h * 1.9) / 760);
  if (cloudL.visible) drawCloud(ctx, cloudL.x, cloudL.y, cloudScale * 1.05);
  if (cloudR.visible) drawCloud(ctx, cloudR.x, cloudR.y, cloudScale * 1.18);

  // 3. 远山层（原海报右侧连绵雾蓝灰丘陵，真实 3D 轮廓投影）
  const drawHillRidge = (pts3d, color) => {
    const pts = [];
    for (const [x, y, z] of pts3d) pts.push(projectPoint(x, y, z, state, w, h));
    const baseR = projectPoint(pts3d[pts3d.length - 1][0], 0, pts3d[pts3d.length - 1][2], state, w, h);
    const baseL = projectPoint(pts3d[0][0], 0, pts3d[0][2], state, w, h);
    poly(ctx, [...pts, baseR, baseL], color);
  };

  drawHillRidge(
    [
      [-26, 0.2, 24], [-18, 1.35, 24], [-11, 0.9, 24], [-4, 1.5, 24],
      [3, 1.85, 24], [8.5, 2.75, 24], [14.5, 2.05, 24], [20, 2.95, 24], [28, 1.3, 24],
    ],
    PAL.hillFar
  );
  drawHillRidge(
    [
      [-24, 0.1, 20], [-14, 0.85, 20], [-6, 0.65, 20], [2.5, 1.25, 20],
      [7.2, 1.95, 20], [11.5, 1.55, 20], [16.5, 2.15, 20], [24, 0.9, 20],
    ],
    PAL.hillNear
  );

  // 4. 地面石板广场（真实 3D 地坪 z = 2.0m .. 22m，覆盖至画布底沿）
  const gFarL = projectPoint(-28, 0, 20, state, w, h);
  const gFarR = projectPoint(28, 0, 20, state, w, h);
  const gNearR = projectPoint(28, 0, 1.4, state, w, h);
  const gNearL = projectPoint(-28, 0, 1.4, state, w, h);
  // 向下延伸兜底，防止极端俯拍时露天空底色
  const padY = h + 260;
  poly(
    ctx,
    [
      gFarL,
      gFarR,
      { x: gNearR.x + 260, y: Math.max(gNearR.y, padY) },
      { x: gNearL.x - 260, y: Math.max(gNearL.y, padY) },
    ],
    PAL.pavement
  );

  // 石板透视网格线（向灭点自然汇聚，原海报同款浅灰缝）
  ctx.save();
  ctx.strokeStyle = PAL.paveGrid;
  ctx.lineWidth = 1;
  // 横向石板缝
  for (let z = 3.0; z <= 13.5; z += 1.75) {
    const a = projectPoint(-18, 0, z, state, w, h);
    const b = projectPoint(18, 0, z, state, w, h);
    if (a.visible && b.visible) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  // 纵向收敛石板缝
  for (let x = -12; x <= 12; x += 2.0) {
    const a = projectPoint(x, 0, 1.8, state, w, h);
    const b = projectPoint(x, 0, 13.5, state, w, h);
    if (a.visible && b.visible) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 5. 原海报左右贯通砖红矮墙（z = 12.6m，高 0.72m）
  const wallH = 0.72;
  const wallZ = 12.6;
  poly(
    ctx,
    [
      projectPoint(-24, wallH, wallZ, state, w, h),
      projectPoint(24, wallH, wallZ, state, w, h),
      projectPoint(24, 0, wallZ, state, w, h),
      projectPoint(-24, 0, wallZ, state, w, h),
    ],
    PAL.lowWall
  );
  // 矮墙顶面（俯拍时才露出厚度，增强真实三维空间感知！）
  if (state.camY > wallH) {
    poly(
      ctx,
      [
        projectPoint(-24, wallH, wallZ + 0.45, state, w, h),
        projectPoint(24, wallH, wallZ + 0.45, state, w, h),
        projectPoint(24, wallH, wallZ, state, w, h),
        projectPoint(-24, wallH, wallZ, state, w, h),
      ],
      PAL.lowWallDark
    );
  }

  // 6. 原海报左灌木丛（z = 11.9m，位于矮墙上沿后侧，浓墨圆弧）
  const bushPts = [
    [-7.6, 0.72], [-7.1, 1.32], [-6.2, 1.56], [-5.3, 1.38],
    [-4.8, 1.65], [-3.8, 1.48], [-3.3, 1.12], [-2.9, 0.72],
  ].map(([bx, by]) => projectPoint(bx, by, 12.0, state, w, h));
  poly(ctx, bushPts, PAL.ink);

  // 7. 原海报核心建筑：米白砖红拱门（3D 立体：宽 4.1m，高 4.15m，厚 1.6m，前立面 z = 11.5m）
  const ax = 2.05;
  const ah = 4.15;
  const az = 11.5;
  const ad = 1.65;

  // 屋顶面（高于拱门或俯拍时自然露出深炭屋顶）
  const roofBackL = projectPoint(-ax * 0.92, ah + 0.52, az + ad * 0.65, state, w, h);
  const roofBackR = projectPoint(ax * 0.92, ah + 0.52, az + ad * 0.65, state, w, h);
  const roofFrontR = projectPoint(ax * 1.04, ah + 0.14, az - 0.1, state, w, h);
  const roofFrontL = projectPoint(-ax * 1.04, ah + 0.14, az - 0.1, state, w, h);
  poly(ctx, [roofBackL, roofBackR, roofFrontR, roofFrontL], PAL.ink);

  // 主立面米白墙体
  const fTL = projectPoint(-ax, ah, az, state, w, h);
  const fTR = projectPoint(ax, ah, az, state, w, h);
  const fBR = projectPoint(ax, 0, az, state, w, h);
  const fBL = projectPoint(-ax, 0, az, state, w, h);
  poly(ctx, [fTL, fTR, fBR, fBL], PAL.wallCream);

  // 檐口下沿浓墨细线与两侧立柱浅影（还原原海报建筑细部）
  const corniceL = projectPoint(-ax * 1.05, ah + 0.08, az - 0.05, state, w, h);
  const corniceR = projectPoint(ax * 1.05, ah + 0.08, az - 0.05, state, w, h);
  const corniceBL = projectPoint(-ax * 1.05, ah - 0.06, az - 0.05, state, w, h);
  const corniceBR = projectPoint(ax * 1.05, ah - 0.06, az - 0.05, state, w, h);
  poly(ctx, [corniceL, corniceR, corniceBR, corniceBL], PAL.ink);

  // 左右壁柱微阴线条
  for (const px of [-1.42, 1.42]) {
    const p1 = projectPoint(px, ah - 0.06, az, state, w, h);
    const p2 = projectPoint(px, 0, az, state, w, h);
    ctx.strokeStyle = PAL.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // 门洞上方砖红实心圆徽（3D 坐标 0, 3.38, az）
  const dotC = projectPoint(0, 3.38, az, state, w, h);
  const dotR = Math.hypot(
    projectPoint(0.26, 3.38, az, state, w, h).x - dotC.x,
    projectPoint(0.26, 3.38, az, state, w, h).y - dotC.y
  );
  ctx.fillStyle = PAL.terracotta;
  ctx.beginPath();
  ctx.arc(dotC.x, dotC.y, Math.max(2, dotR), 0, Math.PI * 2);
  ctx.fill();

  // 中央半圆拱门洞（3D 多点采样，完整保留真实透视弯曲）
  const archW = 1.04;
  const archSpring = 1.78;
  const archPts = [projectPoint(-archW, 0, az, state, w, h)];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const ang = Math.PI - (i / steps) * Math.PI;
    const ux = Math.cos(ang) * archW;
    const uy = archSpring + Math.sin(ang) * archW;
    archPts.push(projectPoint(ux, uy, az, state, w, h));
  }
  archPts.push(projectPoint(archW, 0, az, state, w, h));
  poly(ctx, archPts, PAL.archRed);

  // 拱门浓墨粗描边（原海报标志黑框）
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = Math.max(2, dotR * 0.28);
  ctx.beginPath();
  ctx.moveTo(archPts[0].x, archPts[0].y);
  for (let i = 1; i < archPts.length; i++) ctx.lineTo(archPts[i].x, archPts[i].y);
  ctx.stroke();

  // 8. 原海报左侧黑圆树（z = 9.0m, x = -3.45m）
  const treeBase = projectPoint(-3.45, 0, 9.0, state, w, h);
  const treeCrown = projectPoint(-3.45, 2.18, 9.0, state, w, h);
  const treeEdge = projectPoint(-3.45 + 0.78, 2.18, 9.0, state, w, h);
  const treeR = Math.hypot(treeEdge.x - treeCrown.x, treeEdge.y - treeCrown.y);
  if (treeBase.visible && treeCrown.visible) {
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = Math.max(2.5, treeR * 0.11);
    ctx.beginPath();
    ctx.moveTo(treeBase.x, treeBase.y);
    ctx.lineTo(treeCrown.x, treeCrown.y);
    ctx.stroke();

    ctx.fillStyle = PAL.ink;
    ctx.beginPath();
    ctx.arc(treeCrown.x, treeCrown.y, Math.max(6, treeR), 0, Math.PI * 2);
    ctx.fill();

    // 原海报树冠内极细灰蓝枝杈
    const bMid = projectPoint(-3.45, 1.98, 9.0, state, w, h);
    const bTop = projectPoint(-3.45, 2.66, 9.0, state, w, h);
    const bL = projectPoint(-3.88, 2.38, 9.0, state, w, h);
    const bR = projectPoint(-3.02, 2.42, 9.0, state, w, h);
    ctx.strokeStyle = PAL.branch;
    ctx.lineWidth = Math.max(1.2, treeR * 0.045);
    ctx.beginPath();
    ctx.moveTo(treeBase.x + (treeCrown.x - treeBase.x) * 0.68, treeBase.y + (treeCrown.y - treeBase.y) * 0.68);
    ctx.lineTo(bTop.x, bTop.y);
    ctx.moveTo(bMid.x, bMid.y);
    ctx.lineTo(bL.x, bL.y);
    ctx.moveTo(bMid.x, bMid.y);
    ctx.lineTo(bR.x, bR.y);
    ctx.stroke();
  }

  // 9. 原海报右侧经典街灯（z = 8.4m, x = +2.85m）
  const lampB = projectPoint(2.85, 0, 8.4, state, w, h);
  const lampT = projectPoint(2.85, 3.25, 8.4, state, w, h);
  const lampPed = projectPoint(2.85, 0.72, 8.4, state, w, h);
  const lampHpx = Math.hypot(lampB.x - lampT.x, lampB.y - lampT.y);
  if (lampB.visible && lampT.visible) {
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = Math.max(2, lampHpx * 0.022);
    ctx.beginPath();
    ctx.moveTo(lampB.x, lampB.y);
    ctx.lineTo(lampT.x, lampT.y);
    ctx.stroke();

    // 底座加粗
    ctx.lineWidth = Math.max(4, lampHpx * 0.055);
    ctx.beginPath();
    ctx.moveTo(lampB.x, lampB.y);
    ctx.lineTo(lampPed.x, lampPed.y);
    ctx.stroke();

    // 欧式暖白灯笼与黑帽
    const lAngle = Math.atan2(lampB.x - lampT.x, lampB.y - lampT.y);
    ctx.save();
    ctx.translate(lampT.x, lampT.y);
    ctx.rotate(-lAngle);
    const ls = lampHpx / 180;
    ctx.fillStyle = PAL.wallCream;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = Math.max(1.2, 1.5 * ls);
    ctx.beginPath();
    ctx.moveTo(-7 * ls, 0);
    ctx.lineTo(-10 * ls, -18 * ls);
    ctx.lineTo(10 * ls, -18 * ls);
    ctx.lineTo(7 * ls, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = PAL.ink;
    ctx.beginPath();
    ctx.moveTo(-13 * ls, -18 * ls);
    ctx.quadraticCurveTo(0, -32 * ls, 13 * ls, -18 * ls);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 10. 原海报右侧铁艺长椅（z = 9.3m, x = 3.75..5.65m）
  const benchBars = [0.46, 0.68, 0.88];
  ctx.strokeStyle = PAL.ink;
  for (const by of benchBars) {
    const p1 = projectPoint(3.75, by, 9.3, state, w, h);
    const p2 = projectPoint(5.65, by, 9.3, state, w, h);
    ctx.lineWidth = Math.max(2.2, lampHpx * 0.025);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (const bx of [3.95, 5.45]) {
    const legB = projectPoint(bx, 0, 9.3, state, w, h);
    const legT = projectPoint(bx, 0.94, 9.3, state, w, h);
    ctx.lineWidth = Math.max(2, lampHpx * 0.02);
    ctx.beginPath();
    ctx.moveTo(legB.x, legB.y);
    ctx.lineTo(legT.x, legT.y);
    ctx.stroke();
  }

  // 11. 题材剪影主体（全部无五官，远景先画、近景后画）
  let mainSub = null;
  if (state.sceneId === "plaza") {
    // 远景同身高行人（眼高 1.62m，用来直观印证阿尔伯蒂等高齐眼定律！）
    drawStandingPerson(ctx, 1.38, 10.6, 1.74, state, w, h, PAL.silhouetteFar, -1);
    mainSub = drawStandingPerson(ctx, -1.18, 6.2, 1.74, state, w, h, PAL.silhouette, 1);
  } else if (state.sceneId === "bench") {
    drawSeatedPerson(ctx, -1.25, 5.8, 1.12, state, w, h, PAL.silhouetteFar, 1);
    mainSub = drawSeatedPerson(ctx, 1.05, 5.5, 1.12, state, w, h, PAL.silhouette, -1);
  } else {
    // 远景站立成人对照 + 近景孩童与小狗
    drawStandingPerson(ctx, 1.55, 10.2, 1.74, state, w, h, PAL.silhouetteFar, -1);
    mainSub = drawChildAndDog(ctx, -0.78, 5.0, 0.85, state, w, h);
  }

  // 12. 透视垂直参考线（可选开关）：紧贴拱门左右外缘画绝对竖直虚线 vs 实际墙柱倾角
  if (state.showGuides) {
    ctx.save();
    const tilted = ev.wallTiltMax > 1.8;
    ctx.strokeStyle = tilted ? "rgba(163, 67, 43, 0.72)" : "rgba(35, 105, 81, 0.6)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);

    // 绝对垂直参照线（对比拱门左右墙是否倾倒）
    for (const [bot, top] of [
      [ev.leftBot, ev.leftTop],
      [ev.rightBot, ev.rightTop],
    ]) {
      ctx.beginPath();
      ctx.moveTo(bot.x, bot.y + 8);
      ctx.lineTo(bot.x, top.y - 14);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 在拱门顶部正中晴空处显示实测倾角微标（彻底远离左侧眼平线标与右侧身高标尺，全尺寸零碰擦）
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    const tiltTxt = tilted ? `墙柱倾 ${ev.wallTiltMax.toFixed(1)}°` : `垂直 ${ev.wallTiltMax.toFixed(1)}°`;
    const tw = ctx.measureText(tiltTxt).width + 12;
    const archMidX = (ev.leftTop.x + ev.rightTop.x) * 0.5;
    const archTopY = Math.min(ev.leftTop.y, ev.rightTop.y);
    const tagX = clamp(archMidX - tw * 0.5, 98, w - tw - 102);
    const tagY = clamp(archTopY - 12, 20, h - 28);
    ctx.fillStyle = tilted ? "rgba(151, 53, 36, 0.92)" : "rgba(35, 105, 81, 0.92)";
    ctx.fillRect(tagX, tagY - 12, tw, 18);
    ctx.fillStyle = "#FAF8F3";
    ctx.fillText(tiltTxt, tagX + 6, tagY + 1);

    // 主体眼高水平短标（无五官剪影外侧的一根极细齐眼标）
    if (mainSub && mainSub.eyePt) {
      const ex = mainSub.eyePt.x;
      const ey = mainSub.eyePt.y;
      const aligned = Math.abs(ev.heightDiff) <= 0.22 && Math.abs(state.pitch) <= 2.5;
      ctx.strokeStyle = aligned ? PAL.okGreen : PAL.terracotta;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex - 26, ey);
      ctx.lineTo(ex - 10, ey);
      ctx.moveTo(ex + 10, ey);
      ctx.lineTo(ex + 26, ey);
      ctx.stroke();

      // 眼平偏差竖连线（当主体眼位偏离眼平线超过 10px 时显示垂直偏差）
      const hY = horiz.yAt(ex);
      if (Math.abs(ey - hY) > 10) {
        ctx.strokeStyle = "rgba(163, 67, 43, 0.78)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex, hY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  // 13. 标志贯穿全幅砖红「眼平线 EYE LEVEL」（1:1 复刻原海报左实右虚）
  const lineProg = clamp(animT, 0, 1);
  ctx.save();
  const isLevel = Math.abs(state.pitch) <= 2.5 && Math.abs(state.roll) <= 1.2;
  ctx.strokeStyle = isLevel && ev.ok ? PAL.terracotta : PAL.terracottaBright;
  ctx.lineWidth = isLevel ? 2.2 : 2.0;

  // 在可见区域内从左画到 82% 为实线，82% 到右缘为虚线（忠实复刻 080 原海报）
  const splitX = w * 0.82 * lineProg;
  const endX = w * lineProg;
  ctx.beginPath();
  ctx.moveTo(0, horiz.yAt(0));
  ctx.lineTo(splitX, horiz.yAt(splitX));
  ctx.stroke();

  if (endX > splitX) {
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(splitX, horiz.yAt(splitX));
    ctx.lineTo(endX, horiz.yAt(endX));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 原海报左侧「眼平线 / EYE LEVEL」双语标签（随线上下移动，靠顶时自动翻至线下防裁切）
  const lineLeftY = horiz.yAt(22);
  const putBelow = lineLeftY < 46;
  const boxY = clamp(putBelow ? lineLeftY + 6 : lineLeftY - 34, 8, h - 38);
  ctx.fillStyle = "rgba(215, 228, 235, 0.88)";
  ctx.fillRect(10, boxY, 82, 30);
  ctx.fillStyle = "#8C2E1E";
  ctx.font = '700 13px "Noto Sans SC", sans-serif';
  ctx.fillText("眼平线", 14, boxY + 13);
  ctx.font = '600 10px "IBM Plex Sans", sans-serif';
  ctx.fillText("EYE LEVEL", 14, boxY + 26);
  ctx.restore();

  // 14. 右缘实体「机位身高海拔尺」（直观显示当前相机高度 vs 主体眼高）
  const railX = w - 24;
  const railTop = 22;
  const railBot = h - 22;
  const railH = railBot - railTop;
  const yToPx = (m) => {
    const t = (m - LIMITS.camY[0]) / (LIMITS.camY[1] - LIMITS.camY[0]);
    return railBot - clamp(t, 0, 1) * railH;
  };

  ctx.save();
  ctx.fillStyle = "rgba(241, 236, 226, 0.88)";
  ctx.strokeStyle = "rgba(14, 16, 17, 0.22)";
  ctx.lineWidth = 1;
  ctx.fillRect(railX - 16, railTop - 10, 32, railH + 20);
  ctx.strokeRect(railX - 16, railTop - 10, 32, railH + 20);

  // 标尺主干
  ctx.strokeStyle = "rgba(14, 16, 17, 0.35)";
  ctx.beginPath();
  ctx.moveTo(railX, railTop);
  ctx.lineTo(railX, railBot);
  ctx.stroke();

  // 刻度点 0.5 / 1.0 / 1.5 / 2.0 / 2.5m
  for (const m of [0.5, 1.0, 1.5, 2.0, 2.5]) {
    const py = yToPx(m);
    ctx.beginPath();
    ctx.moveTo(railX - 4, py);
    ctx.lineTo(railX + 4, py);
    ctx.stroke();
  }

  // 目标主体眼高绿标三角
  const targetPy = yToPx(ev.scene.targetEyeY);
  ctx.fillStyle = PAL.okGreen;
  ctx.beginPath();
  ctx.moveTo(railX - 14, targetPy);
  ctx.lineTo(railX - 5, targetPy - 4.5);
  ctx.lineTo(railX - 5, targetPy + 4.5);
  ctx.closePath();
  ctx.fill();

  // 当前相机高度砖红实心游标
  const camPy = yToPx(state.camY);
  ctx.fillStyle = ev.ok ? PAL.okGreen : PAL.terracotta;
  ctx.beginPath();
  ctx.arc(railX, camPy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FAF8F3";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 标尺旁数值标签
  ctx.font = '600 10px "IBM Plex Mono", monospace';
  const hTxt = `${state.camY.toFixed(2)}m`;
  const htw = ctx.measureText(hTxt).width;
  const tagTop = clamp(camPy - 10, 8, h - 26);
  ctx.fillStyle = "rgba(241, 236, 226, 0.95)";
  ctx.fillRect(railX - htw - 24, tagTop, htw + 8, 19);
  ctx.strokeStyle = "rgba(14, 16, 17, 0.22)";
  ctx.strokeRect(railX - htw - 24, tagTop, htw + 8, 19);
  ctx.fillStyle = PAL.ink;
  ctx.fillText(hTxt, railX - htw - 20, tagTop + 13);
  ctx.restore();

  ctx.restore();
}

// 辅助判断指针是否落在右侧机位身高标尺区域内
export function hitHeightRail(localX, w) {
  return localX >= w - 52;
}

export function railPxToCamY(localY, h) {
  const railTop = 26;
  const railBot = h - 26;
  const t = clamp((railBot - localY) / (railBot - railTop), 0, 1);
  return LIMITS.camY[0] + t * (LIMITS.camY[1] - LIMITS.camY[0]);
}
