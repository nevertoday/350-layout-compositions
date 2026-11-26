// 333 藏露关系构图 · 2D 矢量/光照拱窗画布引擎
// 1:1 承袭 333 原海报黑曜石底、电光钴蓝天际、拱形漏窗与前景扫弧暗幕，
// 零 blur 滤镜重开销，保证慢手机与软件渲染也能稳跑 50–60fps。

import { archBoundsAt, getMistBand, getOccluderGeom } from "./model.js";

// 沿 model.js 统一拱窗边界构建顺滑 Clip 路径（顶部用参数化圆弧，零多边形折角）
export function traceArchPath(ctx, rx, ry, rw, rh) {
  const archTop = 0.03;
  const archSplit = 0.34;
  const rightWall = 0.89;
  const leftAtSplit = 0.16;
  const leftAtBottom = 0.05;
  const cx = (leftAtSplit + rightWall) * 0.5;
  const rxNorm = (rightWall - leftAtSplit) * 0.5;
  const ryNorm = archSplit - archTop;

  ctx.beginPath();
  ctx.moveTo(rx + leftAtBottom * rw, ry + 0.99 * rh);
  ctx.lineTo(rx + leftAtSplit * rw, ry + archSplit * rh);
  // 顶部光滑拱弧：角度从 π 扫到 0
  const segs = 48;
  for (let i = 1; i <= segs; i++) {
    const theta = Math.PI - (Math.PI * i) / segs;
    const u = cx + Math.cos(theta) * rxNorm;
    const v = archSplit - Math.sin(theta) * ryNorm;
    ctx.lineTo(rx + u * rw, ry + v * rh);
  }
  ctx.lineTo(rx + rightWall * rw, ry + 0.99 * rh);
  ctx.closePath();
}

// 场景 1：原海报雪峰云海（钴蓝苍穹 + 棱面雪峰 + 底部杂乱碎石坡）
function drawMountainScene(ctx, rx, ry, rw, rh, t, wireframe) {
  const px = (u) => rx + u * rw;
  const py = (v) => ry + v * rh;

  if (!wireframe) {
    // 实采原海报电光钴蓝深空渐变
    const sky = ctx.createLinearGradient(rx, ry, rx + rw * 0.25, ry + rh);
    sky.addColorStop(0, "#0A1E56");
    sky.addColorStop(0.36, "#173EA8");
    sky.addColorStop(0.72, "#2457DB");
    sky.addColorStop(1, "#3A62B8");
    ctx.fillStyle = sky;
    ctx.fillRect(rx, ry, rw, rh);

    // 远山薄雾轮廓（营造远景层次）
    ctx.fillStyle = "rgba(18, 43, 108, 0.55)";
    ctx.beginPath();
    ctx.moveTo(px(0), py(0.72));
    ctx.lineTo(px(0.24), py(0.50));
    ctx.lineTo(px(0.46), py(0.62));
    ctx.lineTo(px(0.78), py(0.46));
    ctx.lineTo(px(1.0), py(0.60));
    ctx.lineTo(px(1.0), py(1.0));
    ctx.lineTo(px(0), py(1.0));
    ctx.closePath();
    ctx.fill();

    // 主雪峰阴面（深钴炭蓝，棱角分明）
    ctx.fillStyle = "#102145";
    ctx.beginPath();
    ctx.moveTo(px(0.56), py(0.18)); // 峰尖
    ctx.lineTo(px(0.41), py(0.31));
    ctx.lineTo(px(0.28), py(0.47));
    ctx.lineTo(px(0.06), py(0.76));
    ctx.lineTo(px(0.04), py(1.0));
    ctx.lineTo(px(0.55), py(1.0));
    ctx.lineTo(px(0.58), py(0.48));
    ctx.closePath();
    ctx.fill();

    // 阴面锐利雪脊与浅冰沟（自然高山棱面而非块状贴片）
    ctx.fillStyle = "rgba(182, 200, 232, 0.30)";
    const darkRibs = [
      [[0.56, 0.19], [0.43, 0.34], [0.47, 0.35], [0.55, 0.25]],
      [[0.44, 0.35], [0.27, 0.54], [0.33, 0.53], [0.48, 0.37]],
      [[0.53, 0.30], [0.39, 0.55], [0.44, 0.55], [0.55, 0.36]],
      [[0.34, 0.52], [0.16, 0.72], [0.24, 0.71], [0.39, 0.55]],
      [[0.51, 0.45], [0.38, 0.71], [0.45, 0.70], [0.54, 0.50]],
    ];
    for (const poly of darkRibs) {
      ctx.beginPath();
      ctx.moveTo(px(poly[0][0]), py(poly[0][1]));
      for (let i = 1; i < poly.length; i++) ctx.lineTo(px(poly[i][0]), py(poly[i][1]));
      ctx.closePath();
      ctx.fill();
    }

    // 主雪峰阳面（冷白积雪照亮右侧山体）
    const litGrad = ctx.createLinearGradient(px(0.55), py(0.18), px(0.92), py(0.78));
    litGrad.addColorStop(0, "#FAFCFF");
    litGrad.addColorStop(0.45, "#DEE6F5");
    litGrad.addColorStop(1, "#8EA5D0");
    ctx.fillStyle = litGrad;
    ctx.beginPath();
    ctx.moveTo(px(0.56), py(0.18));
    ctx.lineTo(px(0.71), py(0.32));
    ctx.lineTo(px(0.86), py(0.50));
    ctx.lineTo(px(0.96), py(0.68));
    ctx.lineTo(px(0.96), py(1.0));
    ctx.lineTo(px(0.49), py(1.0));
    ctx.lineTo(px(0.56), py(0.50));
    ctx.lineTo(px(0.59), py(0.33));
    ctx.closePath();
    ctx.fill();

    // 阳面细峻暗岩裂隙（刀锋般尖锐的山谷沟壑，还原原海报阿尔卑斯雪峰肌理）
    ctx.fillStyle = "#192D5A";
    const rockCuts = [
      [[0.57, 0.21], [0.65, 0.35], [0.60, 0.33], [0.56, 0.24]],
      [[0.61, 0.32], [0.75, 0.49], [0.68, 0.46], [0.58, 0.35]],
      [[0.58, 0.41], [0.71, 0.62], [0.63, 0.58], [0.56, 0.45]],
      [[0.71, 0.45], [0.87, 0.64], [0.80, 0.61], [0.68, 0.48]],
      [[0.55, 0.56], [0.64, 0.72], [0.57, 0.70], [0.53, 0.59]],
    ];
    for (const poly of rockCuts) {
      ctx.beginPath();
      ctx.moveTo(px(poly[0][0]), py(poly[0][1]));
      for (let i = 1; i < poly.length; i++) ctx.lineTo(px(poly[i][0]), py(poly[i][1]));
      ctx.closePath();
      ctx.fill();
    }
    // 主棱脊细高光线
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(px(0.56), py(0.18));
    ctx.lineTo(px(0.59), py(0.33));
    ctx.lineTo(px(0.56), py(0.50));
    ctx.stroke();

    // 下段杂乱山脚与碎石（全盘直露时一览无余，被暗幕遮去后画面立刻变高级！）
    ctx.fillStyle = "#1A2542";
    ctx.beginPath();
    ctx.moveTo(px(0.04), py(0.75));
    ctx.lineTo(px(0.24), py(0.70));
    ctx.lineTo(px(0.48), py(0.76));
    ctx.lineTo(px(0.76), py(0.69));
    ctx.lineTo(px(0.96), py(0.77));
    ctx.lineTo(px(0.96), py(1.0));
    ctx.lineTo(px(0.04), py(1.0));
    ctx.closePath();
    ctx.fill();

    // 杂乱碎石/灌木斑点（直观呈现“次要干扰信息”）
    const scree = [
      [0.18, 0.80, 0.08, 0.04],
      [0.34, 0.84, 0.11, 0.05],
      [0.54, 0.81, 0.09, 0.04],
      [0.72, 0.86, 0.12, 0.05],
      [0.25, 0.91, 0.13, 0.045],
      [0.62, 0.92, 0.14, 0.05],
      [0.44, 0.74, 0.07, 0.03],
    ];
    for (let i = 0; i < scree.length; i++) {
      const [su, sv, sw, sh] = scree[i];
      ctx.fillStyle = i % 2 === 0 ? "#2E3F66" : "#445882";
      ctx.beginPath();
      ctx.moveTo(px(su), py(sv));
      ctx.lineTo(px(su + sw * 0.5), py(sv - sh));
      ctx.lineTo(px(su + sw), py(sv + sh * 0.2));
      ctx.closePath();
      ctx.fill();
    }
    // 细密微弱坡脚横纹
    ctx.strokeStyle = "rgba(130, 156, 204, 0.25)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      const yv = 0.78 + k * 0.042;
      ctx.beginPath();
      ctx.moveTo(px(0.10 + k * 0.03), py(yv));
      ctx.lineTo(px(0.86 - k * 0.02), py(yv + 0.012));
      ctx.stroke();
    }
  } else {
    // X-Ray 蓝图线框：显示被黑幕藏住的整座山体与碎石脚
    ctx.strokeStyle = "rgba(104, 158, 255, 0.72)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px(0.06), py(0.76));
    ctx.lineTo(px(0.56), py(0.18));
    ctx.lineTo(px(0.95), py(0.68));
    ctx.moveTo(px(0.56), py(0.18));
    ctx.lineTo(px(0.55), py(0.96));
    ctx.moveTo(px(0.08), py(0.76));
    ctx.lineTo(px(0.90), py(0.76));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(116, 163, 255, 0.85)";
    ctx.font = `600 ${Math.max(10, Math.round(rw * 0.034))}px "Space Mono", monospace`;
    ctx.fillText("HIDDEN BASE · 山脚杂景已被藏去", px(0.22), py(0.86));
  }
}

// 场景 2：自然风光海报（寒月弧坡 · 复刻原海报应用示例 1）
function drawMoonScene(ctx, rx, ry, rw, rh, t, wireframe) {
  const px = (u) => rx + u * rw;
  const py = (v) => ry + v * rh;

  if (!wireframe) {
    const sky = ctx.createRadialGradient(px(0.66), py(0.34), rw * 0.05, px(0.52), py(0.45), rh * 0.78);
    sky.addColorStop(0, "#245BFF");
    sky.addColorStop(0.52, "#1335A8");
    sky.addColorStop(1, "#061138");
    ctx.fillStyle = sky;
    ctx.fillRect(rx, ry, rw, rh);

    // 寒夜星点
    const stars = [[0.26, 0.22], [0.38, 0.16], [0.76, 0.19], [0.82, 0.38], [0.34, 0.38], [0.50, 0.14]];
    ctx.fillStyle = "rgba(235, 242, 255, 0.75)";
    for (const [su, sv] of stars) {
      ctx.beginPath();
      ctx.arc(px(su), py(sv), 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 亮白月牙（核心焦点）
    const mx = px(0.65);
    const my = py(0.35);
    const mr = Math.min(rw, rh) * 0.095;
    // 月晕微光（纯渐变无 blur）
    const glow = ctx.createRadialGradient(mx, my, mr * 0.3, mx, my, mr * 2.4);
    glow.addColorStop(0, "rgba(220, 236, 255, 0.35)");
    glow.addColorStop(1, "rgba(36, 91, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // 绘弯月（干净双弧裁剪，零额外混合开销）
    ctx.fillStyle = "#F5F8FF";
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0.45, Math.PI * 2 - 0.85, false);
    ctx.arc(mx + mr * 0.34, my - mr * 0.16, mr * 0.82, Math.PI * 2 - 0.95, 0.55, true);
    ctx.closePath();
    ctx.fill();

    // 下方杂乱屋脊与电线杆剪影（全盘露出时分心杂乱）
    ctx.fillStyle = "#172552";
    const roofs = [
      [0.06, 0.72, 0.16, 0.28],
      [0.20, 0.67, 0.14, 0.33],
      [0.36, 0.74, 0.18, 0.26],
      [0.52, 0.69, 0.15, 0.31],
      [0.68, 0.75, 0.22, 0.25],
    ];
    for (const [u, v, w, h] of roofs) {
      ctx.fillRect(px(u), py(v), w * rw, h * rh);
      ctx.fillStyle = "rgba(120, 152, 232, 0.35)";
      ctx.fillRect(px(u + 0.03), py(v + 0.04), w * rw * 0.22, rh * 0.028);
      ctx.fillRect(px(u + 0.08), py(v + 0.04), w * rw * 0.22, rh * 0.028);
      ctx.fillStyle = "#172552";
    }
  } else {
    ctx.strokeStyle = "rgba(104, 158, 255, 0.72)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(px(0.10), py(0.68), rw * 0.76, rh * 0.26);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(116, 163, 255, 0.85)";
    ctx.font = `600 ${Math.max(10, Math.round(rw * 0.034))}px "Space Mono", monospace`;
    ctx.fillText("HIDDEN ROOFLINE · 杂乱地景", px(0.22), py(0.84));
  }
}

// 场景 3：字体设计（截切字母 A · 复刻原海报应用示例 2）
function drawLetterScene(ctx, rx, ry, rw, rh, t, wireframe) {
  const px = (u) => rx + u * rw;
  const py = (v) => ry + v * rh;

  if (!wireframe) {
    // 强烈电光蓝背光场
    const bg = ctx.createRadialGradient(px(0.51), py(0.42), rw * 0.06, px(0.51), py(0.50), rh * 0.62);
    bg.addColorStop(0, "#3872FF");
    bg.addColorStop(0.58, "#1A47D4");
    bg.addColorStop(1, "#091848");
    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, rw, rh);

    // 底部杂乱辅助排版网格与小字（未遮挡时破坏巨字纯净冲击力）
    ctx.strokeStyle = "rgba(195, 214, 255, 0.28)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(px(0.12), py(0.72 + k * 0.055));
      ctx.lineTo(px(0.86), py(0.72 + k * 0.055));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(216, 229, 255, 0.52)";
    ctx.font = `500 ${Math.max(9, Math.round(rw * 0.028))}px "Space Mono", monospace`;
    ctx.fillText("BASELINE 01 / FOOTNOTE / EXTRA META", px(0.14), py(0.85));
    ctx.fillText("SPECIMEN GRID 333 · UNMASKED", px(0.14), py(0.91));

    // 巨型纯黑剪影字母 A（顶角 + 横梁在焦点区）
    ctx.fillStyle = "#06080E";
    ctx.beginPath();
    // 外轮廓
    ctx.moveTo(px(0.45), py(0.19));
    ctx.lineTo(px(0.59), py(0.19));
    ctx.lineTo(px(0.83), py(0.88));
    ctx.lineTo(px(0.67), py(0.88));
    ctx.lineTo(px(0.61), py(0.67));
    ctx.lineTo(px(0.42), py(0.67));
    ctx.lineTo(px(0.36), py(0.88));
    ctx.lineTo(px(0.20), py(0.88));
    ctx.closePath();
    // 内部三角形镂空（evenodd 挖空，透出亮电光蓝）
    ctx.moveTo(px(0.52), py(0.33));
    ctx.lineTo(px(0.45), py(0.55));
    ctx.lineTo(px(0.58), py(0.55));
    ctx.closePath();
    ctx.fill("evenodd");

    // A 字边缘一丝冷蓝逆光轮廓
    ctx.strokeStyle = "rgba(146, 188, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px(0.45), py(0.19));
    ctx.lineTo(px(0.59), py(0.19));
    ctx.lineTo(px(0.83), py(0.88));
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(104, 158, 255, 0.78)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px(0.20), py(0.88));
    ctx.lineTo(px(0.45), py(0.19));
    ctx.lineTo(px(0.59), py(0.19));
    ctx.lineTo(px(0.83), py(0.88));
    ctx.moveTo(px(0.42), py(0.67));
    ctx.lineTo(px(0.61), py(0.67));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(116, 163, 255, 0.85)";
    ctx.font = `600 ${Math.max(10, Math.round(rw * 0.034))}px "Space Mono", monospace`;
    ctx.fillText("AMODAL LETTERFORM · A", px(0.22), py(0.86));
  }
}

// 场景 4：产品展示（暗影瓶身 · 复刻原海报应用示例 4）
function drawBottleScene(ctx, rx, ry, rw, rh, t, wireframe) {
  const px = (u) => rx + u * rw;
  const py = (v) => ry + v * rh;

  if (!wireframe) {
    // 暗室背光渐变
    const bg = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
    bg.addColorStop(0, "#0A1024");
    bg.addColorStop(0.45, "#112255");
    bg.addColorStop(1, "#0B0E18");
    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, rw, rh);

    // 瓶右肩电光蓝高光背光光柱（核心焦点）
    const rimGlow = ctx.createRadialGradient(px(0.62), py(0.36), rw * 0.02, px(0.60), py(0.40), rw * 0.34);
    rimGlow.addColorStop(0, "rgba(52, 114, 255, 0.92)");
    rimGlow.addColorStop(0.55, "rgba(28, 76, 224, 0.45)");
    rimGlow.addColorStop(1, "rgba(10, 16, 36, 0)");
    ctx.fillStyle = rimGlow;
    ctx.fillRect(rx, ry, rw, rh);

    // 桌面杂乱反光条与多余标签（全露时削弱极简高级感）
    ctx.fillStyle = "#19223B";
    ctx.fillRect(px(0.05), py(0.82), rw * 0.90, rh * 0.18);
    ctx.strokeStyle = "rgba(134, 162, 224, 0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(0.06), py(0.82));
    ctx.lineTo(px(0.92), py(0.82));
    ctx.stroke();

    // 磨砂黑曜石瓶身剪影
    ctx.fillStyle = "#080A10";
    ctx.beginPath();
    // 瓶盖
    ctx.moveTo(px(0.45), py(0.18));
    ctx.lineTo(px(0.57), py(0.18));
    ctx.lineTo(px(0.57), py(0.25));
    // 瓶颈
    ctx.lineTo(px(0.555), py(0.25));
    ctx.lineTo(px(0.555), py(0.31));
    // 右肩弧
    ctx.quadraticCurveTo(px(0.66), py(0.33), px(0.67), py(0.43));
    ctx.lineTo(px(0.67), py(0.86));
    ctx.lineTo(px(0.35), py(0.86));
    ctx.lineTo(px(0.35), py(0.43));
    // 左肩弧
    ctx.quadraticCurveTo(px(0.36), py(0.33), px(0.465), py(0.31));
    ctx.lineTo(px(0.465), py(0.25));
    ctx.lineTo(px(0.45), py(0.25));
    ctx.closePath();
    ctx.fill();

    // 瓶身下段冗余说明标（藏掉后更显克制神秘）
    ctx.fillStyle = "rgba(164, 184, 224, 0.22)";
    ctx.fillRect(px(0.39), py(0.64), rw * 0.24, rh * 0.14);
    ctx.fillStyle = "rgba(216, 229, 255, 0.42)";
    ctx.fillRect(px(0.42), py(0.68), rw * 0.18, 2);
    ctx.fillRect(px(0.42), py(0.72), rw * 0.14, 2);

    // 右肩锐利电光蓝轮廓光（关键辨识焦点）
    ctx.strokeStyle = "#4F89FF";
    ctx.lineWidth = Math.max(2.2, rw * 0.011);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px(0.562), py(0.25));
    ctx.lineTo(px(0.562), py(0.31));
    ctx.quadraticCurveTo(px(0.662), py(0.335), px(0.672), py(0.43));
    ctx.lineTo(px(0.672), py(0.54));
    ctx.stroke();

    // 右肩亮白极细反光点
    ctx.strokeStyle = "#DCEAFF";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px(0.60), py(0.328));
    ctx.quadraticCurveTo(px(0.652), py(0.352), px(0.664), py(0.425));
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(104, 158, 255, 0.78)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(px(0.35), py(0.43), rw * 0.32, rh * 0.43);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(116, 163, 255, 0.85)";
    ctx.font = `600 ${Math.max(10, Math.round(rw * 0.034))}px "Space Mono", monospace`;
    ctx.fillText("HIDDEN BODY · 瓶身下段", px(0.24), py(0.86));
  }
}

function drawSceneContent(ctx, sceneId, rx, ry, rw, rh, t, wireframe) {
  if (sceneId === "moon") drawMoonScene(ctx, rx, ry, rw, rh, t, wireframe);
  else if (sceneId === "letter") drawLetterScene(ctx, rx, ry, rw, rh, t, wireframe);
  else if (sceneId === "bottle") drawBottleScene(ctx, rx, ry, rw, rh, t, wireframe);
  else drawMountainScene(ctx, rx, ry, rw, rh, t, wireframe);
}

// 绘制柔白云岚腰带（烟霞锁腰，纯多层渐变椭圆，软件渲染 < 0.3ms）
function drawMistVeil(ctx, rx, ry, rw, rh, mist, t, xrayAlpha) {
  if (!mist) return;
  const alpha = mist.strength * (1 - xrayAlpha * 0.65);
  if (alpha <= 0.01) return;
  const drift = Math.sin(t * 0.45) * rw * 0.025;
  const puffs = [
    [0.18, mist.centerV + 0.04, 0.36, mist.halfH * 1.1],
    [0.44, mist.centerV - 0.01, 0.42, mist.halfH * 1.15],
    [0.72, mist.centerV + 0.02, 0.38, mist.halfH * 1.05],
    [0.32, mist.centerV + 0.09, 0.46, mist.halfH * 1.2],
  ];
  for (let i = 0; i < puffs.length; i++) {
    const [pu, pv, prx, pry] = puffs[i];
    const cx = rx + pu * rw + drift * (i % 2 === 0 ? 1 : -0.7);
    const cy = ry + pv * rh;
    const rad = Math.max(prx * rw, pry * rh);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale((prx * rw) / rad, (pry * rh) / rad);
    const g = ctx.createRadialGradient(0, 0, rad * 0.08, 0, 0, rad);
    g.addColorStop(0, `rgba(222, 232, 248, ${(alpha * 0.86).toFixed(3)})`);
    g.addColorStop(0.55, `rgba(182, 198, 228, ${(alpha * 0.46).toFixed(3)})`);
    g.addColorStop(1, "rgba(182, 198, 228, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 绘制前景暗幕遮片（完全使用 model.js 的 getOccluderGeom 解析参数）
function drawOccluder(ctx, rx, ry, rw, rh, geom, xrayAlpha, isBad) {
  const px = (u) => rx + u * rw;
  const py = (v) => ry + v * rh;
  const fillAlpha = 1 - xrayAlpha * 0.72;
  const fillCol = `rgba(7, 8, 12, ${fillAlpha.toFixed(3)})`;
  const edgeCol = xrayAlpha > 0.1
    ? "rgba(84, 146, 255, 0.95)"
    : isBad
      ? "rgba(255, 116, 97, 0.78)"
      : "rgba(42, 92, 235, 0.55)";

  ctx.save();
  ctx.fillStyle = fillCol;
  ctx.strokeStyle = edgeCol;
  ctx.lineWidth = xrayAlpha > 0.1 ? 2 : 1.5;

  if (geom.kind === "arc") {
    const cx = px(geom.cx);
    const cy = py(geom.cy);
    const radX = geom.r * rw;
    const radY = (geom.r * rh) / 1.18;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (geom.kind === "slash") {
    // 沿直线 nx*u + ny*v = threshold 构多边形
    // 找到半平面多边形：先取四个大角点裁剪
    const big = [
      [-0.5, -0.5],
      [1.5, -0.5],
      [1.5, 1.5],
      [-0.5, 1.5],
    ];
    const poly = [];
    const evalSide = (pt) => geom.nx * pt[0] + geom.ny * pt[1] - geom.threshold;
    for (let i = 0; i < big.length; i++) {
      const a = big[i];
      const b = big[(i + 1) % big.length];
      const da = evalSide(a);
      const db = evalSide(b);
      if (da >= 0) poly.push(a);
      if ((da >= 0 && db < 0) || (da < 0 && db >= 0)) {
        const s = da / (da - db);
        poly.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]);
      }
    }
    if (poly.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(px(poly[0][0]), py(poly[0][1]));
      for (let i = 1; i < poly.length; i++) ctx.lineTo(px(poly[i][0]), py(poly[i][1]));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (geom.kind === "bisect") {
    const xCut = px(geom.xLine);
    ctx.fillRect(rx - 4, ry - 4, xCut - (rx - 4), rh + 8);
    ctx.strokeStyle = "#FF7461";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(xCut, ry);
    ctx.lineTo(xCut, ry + rh);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (geom.kind === "aperture") {
    const cx = px(geom.cx);
    const cy = py(geom.cy);
    const radX = geom.r * rw;
    const radY = (geom.r * rh) / 1.16;
    ctx.beginPath();
    ctx.rect(rx - 4, ry - 4, rw + 8, rh + 8);
    ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.beginPath();
    ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 渲染主拱窗画布（供开场交互台调用）
export function renderHeroStage(canvas, state, evalRes, anim) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const dpr = anim.dpr || 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  const w = W / dpr;
  const h = H / dpr;

  // 纯黑曜石展面背景
  ctx.fillStyle = "#07080B";
  ctx.fillRect(0, 0, w, h);

  // 微微斜切的暗影层次面（呼应原海报左上斜影）
  ctx.fillStyle = "#0B0D14";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.24, 0);
  ctx.lineTo(w * 0.08, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 右上角 1:1 复刻原海报 4×6 电光蓝点阵
  const cols = 4;
  const rows = 6;
  const dotStep = Math.max(9, Math.min(13, w * 0.022));
  const dotStartX = w - 16 - (cols - 1) * dotStep;
  const dotStartY = 18;
  ctx.fillStyle = "#2254E8";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.arc(dotStartX + c * dotStep, dotStartY + r * dotStep, 1.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 计算拱窗居中无变形区域（严守纵横比，手机绝不压扁）
  const padTop = 10;
  const padBot = 28;
  const availH = Math.max(120, h - padTop - padBot);
  const availW = Math.max(120, w - 32);
  const archAspect = 0.78; // 宽/高比，忠实原海报竖拱
  let rw = availW;
  let rh = rw / archAspect;
  if (rh > availH) {
    rh = availH;
    rw = rh * archAspect;
  }
  const rx = (w - rw) * 0.5 - (w > 460 ? 12 : 0);
  const ry = padTop + (availH - rh) * 0.5;

  // 开场平滑过渡参数（still=true 时直接落终点）
  const intro = anim.intro;
  const effState = {
    ...state,
    cover: anim.displayCover * intro,
    mist: anim.displayMist * intro,
  };
  const geom = getOccluderGeom(effState);
  const mist = getMistBand(effState);
  const xrayAlpha = anim.xrayAlpha;

  // 1. 裁剪拱形画窗并绘制底景 + 云岚 + 前景暗幕
  ctx.save();
  traceArchPath(ctx, rx, ry, rw, rh);
  ctx.clip();

  drawSceneContent(ctx, state.scene, rx, ry, rw, rh, anim.t, false);
  drawMistVeil(ctx, rx, ry, rw, rh, mist, anim.t, xrayAlpha);

  // 绘制前景暗幕
  drawOccluder(ctx, rx, ry, rw, rh, geom, xrayAlpha, evalRes.status === "error");

  // 如果开启 X-Ray 透视，把被藏掉的轮廓蓝图叠印在半透明黑幕上
  if (xrayAlpha > 0.04) {
    ctx.save();
    ctx.globalAlpha = xrayAlpha;
    drawSceneContent(ctx, state.scene, rx, ry, rw, rh, anim.t, true);
    ctx.restore();
  }

  // 若处于「遮错要害」错态，用克制珊瑚虚框标出被压住的核心焦点区
  if (evalRes.code === "wrong_spot" && xrayAlpha < 0.5) {
    const fb = evalRes.scene.focalBox;
    ctx.strokeStyle = "#FF7461";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(rx + fb.u0 * rw, ry + fb.v0 * rh, (fb.u1 - fb.u0) * rw, (fb.v1 - fb.v0) * rh);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(18, 8, 10, 0.86)";
    const tagW = Math.min(rw * 0.66, 146);
    const tagX = rx + (fb.u0 + fb.u1) * 0.5 * rw - tagW * 0.5;
    const tagY = ry + fb.v0 * rh + 6;
    ctx.fillRect(tagX, tagY, tagW, 20);
    ctx.fillStyle = "#FF9384";
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("× 核心焦点被盖住", tagX + tagW * 0.5, tagY + 14);
    ctx.textAlign = "left";
  }

  ctx.restore();

  // 2. 拱形窗外极细轮廓线（呼应原海报黑底中隐现的拱窗边）
  ctx.save();
  traceArchPath(ctx, rx, ry, rw, rh);
  ctx.strokeStyle = evalRes.status === "pass" ? "rgba(74, 134, 255, 0.52)" : "rgba(130, 150, 192, 0.28)";
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();

  // 3. 在右下拖幕边沿绘制贴合暗幕弧边的极简推拉引导标
  const isOverExposed = evalRes.code === "over_expose";
  const handleU = state.maskShape === "aperture" ? 0.53 : state.placement === "bisect" ? geom.xLine : 0.78 - effState.cover * 0.36;
  const handleV = state.placement === "crush" ? 0.24 : 0.76 - effState.cover * 0.14;
  const hx = rx + Math.max(0.18, Math.min(0.84, handleU)) * rw;
  const hy = ry + Math.max(0.20, Math.min(0.84, handleV)) * rh;

  ctx.save();
  // 细短双向拖幕指示弧标
  const pillText = isOverExposed ? "← 左拖推入暗幕" : `藏 ${evalRes.concealPct}% · 露 ${evalRes.revealPct}%`;
  ctx.font = `600 11px "Space Mono", "Noto Sans SC", monospace`;
  const tw = ctx.measureText(pillText).width + 22;
  const pxPill = Math.max(10, Math.min(w - tw - 10, hx - tw * 0.5));
  const pyPill = Math.max(14, Math.min(h - 38, hy - 13));
  ctx.fillStyle = evalRes.status === "pass" ? "rgba(14, 34, 86, 0.92)" : "rgba(24, 12, 16, 0.92)";
  ctx.strokeStyle = evalRes.status === "pass" ? "#4E8CFF" : "#FF7461";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(pxPill, pyPill, tw, 24, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = evalRes.status === "pass" ? "#DCEBFF" : "#FFB4A8";
  ctx.textAlign = "center";
  ctx.fillText(pillText, pxPill + tw * 0.5, pyPill + 15.5);
  ctx.textAlign = "left";
  ctx.restore();

  // 4. 底部极简画布角标遥测（与单真源完全同步）
  ctx.fillStyle = "#8D99B5";
  ctx.font = `400 11px "Space Mono", monospace`;
  ctx.fillText(`REVEAL ${String(evalRes.revealPct).padStart(2, "0")}%  /  CONCEAL ${String(evalRes.concealPct).padStart(2, "0")}%`, 12, h - 10);
  ctx.textAlign = "right";
  ctx.fillStyle = evalRes.status === "pass" ? "#4CE0C6" : "#FF7461";
  ctx.fillText(evalRes.badge, w - 12, h - 10);
  ctx.textAlign = "left";

  ctx.restore();
}

// 辅助绘制：第 03 节「四类应用示例」前/后拉帘对照图（包含原海报第 3 例纯侧影逆光人像，严守无五官原则）
export function renderAppCompare(canvas, kind, split) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 240;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.save();
  ctx.scale(dpr, dpr);

  const splitX = Math.round(w * split);

  // 左侧：未遮挡「全盘裸景」
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, h);
  ctx.clip();
  drawApplicationFrame(ctx, kind, 0, 0, w, h, false);
  ctx.restore();

  // 右侧：应用「藏露构图」成品
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, 0, w - splitX, h);
  ctx.clip();
  drawApplicationFrame(ctx, kind, 0, 0, w, h, true);
  ctx.restore();

  // 拉帘分割线与极简把手
  ctx.strokeStyle = "#4E8CFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, h);
  ctx.stroke();

  ctx.fillStyle = "#1E4EE0";
  ctx.beginPath();
  ctx.arc(splitX, h * 0.5, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#F2F5FC";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // 左右小箭
  ctx.beginPath();
  ctx.moveTo(splitX - 5, h * 0.5);
  ctx.lineTo(splitX - 2, h * 0.5 - 3);
  ctx.moveTo(splitX - 5, h * 0.5);
  ctx.lineTo(splitX - 2, h * 0.5 + 3);
  ctx.moveTo(splitX + 5, h * 0.5);
  ctx.lineTo(splitX + 2, h * 0.5 - 3);
  ctx.moveTo(splitX + 5, h * 0.5);
  ctx.lineTo(splitX + 2, h * 0.5 + 3);
  ctx.stroke();

  // 左右角标
  ctx.font = `600 11px "Noto Sans SC", sans-serif`;
  if (splitX > 76) {
    ctx.fillStyle = "rgba(8, 10, 16, 0.82)";
    ctx.fillRect(10, 10, 72, 22);
    ctx.fillStyle = "#C6D0E4";
    ctx.fillText("未遮裸景", 20, 25);
  }
  if (w - splitX > 76) {
    ctx.fillStyle = "rgba(18, 48, 132, 0.90)";
    ctx.fillRect(w - 82, 10, 72, 22);
    ctx.fillStyle = "#F1F5FF";
    ctx.fillText("藏露成品", w - 72, 25);
  }

  ctx.restore();
}

function drawApplicationFrame(ctx, kind, rx, ry, rw, rh, masked) {
  if (kind === "landscape") {
    drawMoonScene(ctx, rx, ry, rw, rh, 0, false);
    if (masked) {
      // 前景大黑弧坡从左下拱起扫向右下，完整吞掉低处杂乱屋脊，只把电光蓝夜空与右上白月托出来
      ctx.fillStyle = "#06070A";
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh * 0.42);
      ctx.quadraticCurveTo(rx + rw * 0.48, ry + rh * 0.44, rx + rw, ry + rh * 0.84);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.lineTo(rx, ry + rh);
      ctx.closePath();
      ctx.fill();
      // 右上侧一道极轻远山弧影增加层次，留足蓝空托起月牙
      ctx.strokeStyle = "rgba(62, 123, 255, 0.38)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh * 0.42);
      ctx.quadraticCurveTo(rx + rw * 0.48, ry + rh * 0.44, rx + rw, ry + rh * 0.84);
      ctx.stroke();
    }
    return;
  }

  if (kind === "type") {
    drawLetterScene(ctx, rx, ry, rw, rh, 0, false);
    if (masked) {
      // 截切底部，让巨字 A 从暗黑台面升起
      ctx.fillStyle = "#06070A";
      ctx.fillRect(rx, ry + rh * 0.72, rw, rh * 0.28);
      ctx.fillRect(rx, ry, rw * 0.12, rh);
      ctx.fillRect(rx + rw * 0.88, ry, rw * 0.12, rh);
    }
    return;
  }

  if (kind === "portrait") {
    // 严格遵守 BRIEF：纯侧影剪影 + 逆光钴蓝轮廓线，绝不画任何眼睛/嘴唇五官！
    const px = (u) => rx + u * rw;
    const py = (v) => ry + v * rh;
    if (!masked) {
      // 平光全露：灰平底色 + 简单半身剪影，毫无情绪张力
      ctx.fillStyle = "#26365E";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = "#16203C";
      ctx.fillRect(rx, ry + rh * 0.76, rw, rh * 0.24);
      ctx.fillStyle = "#3E5280";
      traceSideSilhouette(ctx, px, py);
      ctx.fill();
    } else {
      // 藏露成品：纯黑暗房 + 仅靠一线电光蓝轮廓光勾出侧脸剪影（1:1 复刻原海报）
      ctx.fillStyle = "#050609";
      ctx.fillRect(rx, ry, rw, rh);
      const glow = ctx.createRadialGradient(px(0.56), py(0.45), rw * 0.04, px(0.54), py(0.46), rw * 0.42);
      glow.addColorStop(0, "rgba(38, 92, 255, 0.48)");
      glow.addColorStop(1, "rgba(5, 6, 9, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(rx, ry, rw, rh);

      ctx.fillStyle = "#050609";
      traceSideSilhouette(ctx, px, py);
      ctx.fill();

      // 仅在面向光源一侧勾一道细锐电光蓝轮廓光
      ctx.strokeStyle = "#3E7BFF";
      ctx.lineWidth = Math.max(2.2, rw * 0.012);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px(0.50), py(0.16));
      ctx.quadraticCurveTo(px(0.58), py(0.24), px(0.56), py(0.35));
      ctx.lineTo(px(0.61), py(0.44)); // 鼻梁极简剪影转折
      ctx.lineTo(px(0.56), py(0.48));
      ctx.quadraticCurveTo(px(0.58), py(0.56), px(0.52), py(0.62)); // 下颌轮廓
      ctx.quadraticCurveTo(px(0.45), py(0.66), px(0.43), py(0.75)); // 颈部
      ctx.lineTo(px(0.50), py(0.92));
      ctx.stroke();

      // 右侧前景斜暗幕遮去背景杂光
      ctx.fillStyle = "#050609";
      ctx.beginPath();
      ctx.moveTo(px(0.72), py(0));
      ctx.lineTo(px(1), py(0));
      ctx.lineTo(px(1), py(1));
      ctx.lineTo(px(0.58), py(1));
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  // product
  drawBottleScene(ctx, rx, ry, rw, rh, 0, false);
  if (masked) {
    // 1:1 复刻原海报斜切暗幕遮去瓶身右下与底座
    ctx.fillStyle = "#06070A";
    ctx.beginPath();
    ctx.moveTo(rx + rw * 0.34, ry + rh);
    ctx.lineTo(rx + rw, ry + rh * 0.24);
    ctx.lineTo(rx + rw, ry + rh);
    ctx.closePath();
    ctx.fill();
  }
}

function traceSideSilhouette(ctx, px, py) {
  ctx.beginPath();
  ctx.moveTo(px(0.26), py(1.0));
  ctx.lineTo(px(0.28), py(0.68));
  ctx.quadraticCurveTo(px(0.24), py(0.42), px(0.32), py(0.24));
  ctx.quadraticCurveTo(px(0.42), py(0.12), px(0.52), py(0.18));
  ctx.quadraticCurveTo(px(0.58), py(0.24), px(0.56), py(0.35));
  ctx.lineTo(px(0.61), py(0.44));
  ctx.lineTo(px(0.56), py(0.48));
  ctx.quadraticCurveTo(px(0.58), py(0.56), px(0.52), py(0.62));
  ctx.quadraticCurveTo(px(0.45), py(0.66), px(0.43), py(0.75));
  ctx.lineTo(px(0.56), py(1.0));
  ctx.closePath();
}

// 辅助绘制：第 06 节眼力练习的四版单变量缩略图（直接调用同一套几何与遮片函数）
export function renderQuizOption(canvas, optState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 220;
  const h = canvas.clientHeight || 220;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#080A0F";
  ctx.fillRect(0, 0, w, h);

  const pad = 12;
  const availH = h - pad * 2;
  const availW = w - pad * 2;
  let rw = availW;
  let rh = rw / 0.78;
  if (rh > availH) {
    rh = availH;
    rw = rh * 0.78;
  }
  const rx = (w - rw) * 0.5;
  const ry = (h - rh) * 0.5;

  const geom = getOccluderGeom(optState);
  const mist = getMistBand(optState);

  ctx.save();
  traceArchPath(ctx, rx, ry, rw, rh);
  ctx.clip();
  drawSceneContent(ctx, optState.scene, rx, ry, rw, rh, 0, false);
  drawMistVeil(ctx, rx, ry, rw, rh, mist, 0, 0);
  drawOccluder(ctx, rx, ry, rw, rh, geom, 0, false);
  ctx.restore();

  traceArchPath(ctx, rx, ry, rw, rh);
  ctx.strokeStyle = "rgba(92, 128, 212, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
