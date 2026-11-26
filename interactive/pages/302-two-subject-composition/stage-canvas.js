// 302 双人构图 · 2D Canvas 绘图引擎
// 1. 主舞台画布（1:1 承袭 302 原海报暖杏纸底、柔白穹顶、陶橙梯形地板、无五官深褐剪影、虚线对话轴与 + 重心）
// 2. 俯视 180° 轴线机位盘（与主舞台双向联动，可直拖副机位 B 与主机位 A）
// 3. 03 节 360° 轴线沙盘与正反打切镜双画幅监视器

import { evaluate, evaluateCutLab } from "./model.js";

const PALETTE = {
  paper: "#F7E5D0",
  paperEdge: "#EFE0CA",
  arch: "#FBF1E3",
  terracotta: "#D56535",
  terracottaDark: "#9E3E16",
  terracottaSoft: "rgba(213, 101, 53, 0.22)",
  espresso: "#33241A",
  espressoMid: "#4C372B",
  espressoSoft: "rgba(51, 36, 26, 0.14)",
  espressoDark: "#241913",
  cream: "#F8ECDC",
  pass: "#1E6044",
  passLight: "#76D6A3",
  err: "#B02318",
  errLight: "#FF8570",
  errTint: "rgba(176, 35, 24, 0.14)",
};

// 绘制无五官雕塑感人物剪影（严守规范：绝不画眼睛、嘴巴等五官细节）
// type: "woman" | "man", style: "bench" | "table" | "standing", facing: +1(右) | -1(左)
function drawSilhouette(ctx, x, bottomY, w, h, { type, style, facing, alpha = 1, tint = PALETTE.espresso, highlight = false, selected = false }) {
  ctx.save();
  ctx.translate(x, bottomY);
  ctx.scale(facing, 1); // 本地坐标系一律默认朝右 (+x)
  ctx.globalAlpha = alpha;
  ctx.fillStyle = tint;

  const s = h / 240; // 以 240px 为标准造型高度缩放

  if (style === "standing") {
    // 站姿剪影（站台并肩情景）
    ctx.beginPath();
    if (type === "woman") {
      // 柔和齐肩波浪轮廓与大衣剪影（无五官侧影）
      ctx.moveTo(-12 * s, -226 * s);
      ctx.bezierCurveTo(6 * s, -234 * s, 18 * s, -220 * s, 16 * s, -206 * s);
      ctx.lineTo(19 * s, -198 * s); // 鼻尖侧影
      ctx.lineTo(14 * s, -193 * s);
      ctx.quadraticCurveTo(15 * s, -187 * s, 9 * s, -184 * s); // 下颌
      ctx.lineTo(7 * s, -174 * s);
      ctx.bezierCurveTo(20 * s, -166 * s, 26 * s, -142 * s, 24 * s, -104 * s);
      ctx.lineTo(31 * s, -48 * s); // 大衣下摆
      ctx.lineTo(14 * s, -48 * s);
      ctx.lineTo(15 * s, -6 * s);
      ctx.lineTo(24 * s, 0);
      ctx.lineTo(4 * s, 0);
      ctx.lineTo(2 * s, -48 * s);
      ctx.lineTo(-4 * s, -48 * s);
      ctx.lineTo(-6 * s, -6 * s);
      ctx.lineTo(2 * s, 0);
      ctx.lineTo(-17 * s, 0);
      ctx.lineTo(-16 * s, -48 * s);
      ctx.lineTo(-27 * s, -48 * s);
      ctx.bezierCurveTo(-28 * s, -105 * s, -25 * s, -158 * s, -11 * s, -175 * s);
      ctx.bezierCurveTo(-24 * s, -184 * s, -26 * s, -214 * s, -12 * s, -226 * s);
    } else {
      // 利落风衣男士站姿侧影（无五官）
      ctx.moveTo(-10 * s, -230 * s);
      ctx.bezierCurveTo(8 * s, -236 * s, 18 * s, -223 * s, 17 * s, -209 * s);
      ctx.lineTo(21 * s, -201 * s);
      ctx.lineTo(16 * s, -196 * s);
      ctx.quadraticCurveTo(16 * s, -189 * s, 10 * s, -186 * s);
      ctx.lineTo(8 * s, -175 * s);
      ctx.bezierCurveTo(23 * s, -168 * s, 28 * s, -142 * s, 26 * s, -98 * s);
      ctx.lineTo(23 * s, -72 * s);
      ctx.lineTo(18 * s, -6 * s);
      ctx.lineTo(29 * s, 0);
      ctx.lineTo(6 * s, 0);
      ctx.lineTo(4 * s, -74 * s);
      ctx.lineTo(-3 * s, -74 * s);
      ctx.lineTo(-6 * s, -6 * s);
      ctx.lineTo(4 * s, 0);
      ctx.lineTo(-18 * s, 0);
      ctx.lineTo(-21 * s, -88 * s);
      ctx.bezierCurveTo(-26 * s, -128 * s, -25 * s, -162 * s, -11 * s, -177 * s);
      ctx.bezierCurveTo(-19 * s, -188 * s, -21 * s, -218 * s, -10 * s, -230 * s);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  // 坐姿剪影（1:1 致敬 302 原海报：左女坐姿优雅倾听，右男西装坐姿前倾对话）
  ctx.beginPath();
  if (type === "woman") {
    // 头部与齐肩秀发轮廓（纯侧影无五官）
    ctx.moveTo(-14 * s, -212 * s);
    ctx.bezierCurveTo(4 * s, -222 * s, 19 * s, -208 * s, 17 * s, -192 * s);
    ctx.lineTo(21 * s, -185 * s); // 鼻尖
    ctx.lineTo(16 * s, -180 * s);
    ctx.quadraticCurveTo(17 * s, -173 * s, 9 * s, -170 * s); // 下颌
    ctx.lineTo(7 * s, -158 * s);
    // 颈胸与坐姿裙摆
    ctx.bezierCurveTo(22 * s, -145 * s, 27 * s, -120 * s, 24 * s, -96 * s);
    ctx.lineTo(54 * s, -92 * s); // 膝盖前探
    ctx.bezierCurveTo(64 * s, -90 * s, 66 * s, -80 * s, 60 * s, -68 * s);
    // 优雅交叠小腿与尖头鞋
    ctx.lineTo(74 * s, -22 * s);
    ctx.lineTo(92 * s, -14 * s);
    ctx.quadraticCurveTo(88 * s, -6 * s, 70 * s, -10 * s);
    ctx.lineTo(52 * s, -46 * s);
    ctx.lineTo(56 * s, -6 * s);
    ctx.lineTo(72 * s, 0);
    ctx.lineTo(44 * s, 0);
    ctx.lineTo(36 * s, -64 * s);
    ctx.lineTo(-26 * s, -62 * s);
    // 背部与后发弧线
    ctx.bezierCurveTo(-30 * s, -102 * s, -24 * s, -144 * s, -14 * s, -162 * s);
    ctx.bezierCurveTo(-28 * s, -172 * s, -28 * s, -202 * s, -14 * s, -212 * s);
  } else {
    // 男士侧影坐姿（干练短发、西装肩背、长裤双脚着地）
    ctx.moveTo(-12 * s, -218 * s);
    ctx.bezierCurveTo(6 * s, -225 * s, 19 * s, -213 * s, 18 * s, -196 * s);
    ctx.lineTo(22 * s, -188 * s);
    ctx.lineTo(17 * s, -183 * s);
    ctx.quadraticCurveTo(17 * s, -176 * s, 10 * s, -173 * s);
    ctx.lineTo(8 * s, -160 * s);
    ctx.bezierCurveTo(24 * s, -148 * s, 30 * s, -118 * s, 28 * s, -94 * s);
    ctx.lineTo(62 * s, -90 * s);
    ctx.bezierCurveTo(72 * s, -88 * s, 72 * s, -74 * s, 66 * s, -54 * s);
    ctx.lineTo(78 * s, -10 * s);
    ctx.lineTo(94 * s, -2 * s);
    ctx.lineTo(92 * s, 3 * s);
    ctx.lineTo(66 * s, 2 * s);
    ctx.lineTo(52 * s, -52 * s);
    ctx.lineTo(48 * s, -8 * s);
    ctx.lineTo(64 * s, 2 * s);
    ctx.lineTo(36 * s, 2 * s);
    ctx.lineTo(30 * s, -62 * s);
    ctx.lineTo(-28 * s, -60 * s);
    ctx.bezierCurveTo(-32 * s, -104 * s, -28 * s, -148 * s, -14 * s, -165 * s);
    ctx.bezierCurveTo(-22 * s, -176 * s, -23 * s, -208 * s, -12 * s, -218 * s);
  }
  ctx.closePath();
  ctx.fill();
  if (selected || highlight) {
    ctx.strokeStyle = selected ? PALETTE.terracotta : "rgba(213, 101, 53, 0.55)";
    ctx.lineWidth = selected ? 2.2 : 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

// 绘制低矮建筑块沙发 / 咖啡桌 / 站台标线
function drawStageProps(ctx, W, H, evalRes, state) {
  const { scene, a, b, renderAngle } = evalRes;
  const rad = (renderAngle * Math.PI) / 180;
  const shiftX = Math.sin(rad) * W * 0.08;

  // 1. 原海报招牌：柔白暖光穹顶圆弧
  ctx.save();
  const archR = Math.min(W * 0.41, H * 0.62);
  const archCX = W * 0.52 - shiftX * 0.65;
  const archCY = H * 0.56;
  ctx.fillStyle = PALETTE.arch;
  ctx.beginPath();
  ctx.arc(archCX, archCY, archR, Math.PI, 0, false);
  ctx.lineTo(archCX + archR, H * 0.85);
  ctx.lineTo(archCX - archR, H * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. 原海报招牌：透视陶橙梯形地板（随相机绕角真实倾斜）
  const horizonY = H * 0.82;
  const topLeftX = W * 0.22 - shiftX * 0.7;
  const topRightX = W * 0.78 - shiftX * 0.7;
  const botLeftX = -W * 0.08 - shiftX * 1.3;
  const botRightX = W * 1.08 - shiftX * 1.3;

  ctx.save();
  ctx.fillStyle = PALETTE.terracotta;
  ctx.beginPath();
  ctx.moveTo(topLeftX, horizonY);
  ctx.lineTo(topRightX, horizonY);
  ctx.lineTo(botRightX, H);
  ctx.lineTo(botLeftX, H);
  ctx.closePath();
  ctx.fill();

  // 地板细微建筑透视线
  ctx.strokeStyle = "rgba(251, 241, 227, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(topLeftX, horizonY);
  ctx.lineTo(topRightX, horizonY);
  ctx.stroke();
  ctx.restore();

  // 3. 场景家具（沙发坐墩 / 咖啡桌 / 站台安全线）
  if (scene.seatStyle === "bench") {
    // 为 A 和 B 各自绘制紧跟投影位置的极简深褐方块坐墩，还原 302 原海报造型
    const drawBench = (p) => {
      const bw = Math.max(W * 0.14, p.w * W * 1.15);
      const bh = p.h * H * 0.29;
      const topY = p.bottom * H - bh;
      const bx = p.u * W - bw * 0.5 - p.facing * bw * 0.16;
      ctx.fillStyle = PALETTE.espresso;
      ctx.fillRect(bx, topY, bw, bh + H * 0.04);
      // 顶面轻微暖边
      ctx.fillStyle = "rgba(251, 241, 227, 0.09)";
      ctx.fillRect(bx, topY, bw, 2);
    };
    drawBench(a);
    drawBench(b);
  } else if (scene.seatStyle === "table") {
    // 咖啡馆博弈：两人之间一张极简深褐小圆桌与高脚凳
    const drawStool = (p) => {
      const sw = p.w * W * 0.72;
      const sh = p.h * H * 0.28;
      const sx = p.u * W - sw * 0.5 - p.facing * sw * 0.14;
      const sy = p.bottom * H - sh;
      ctx.fillStyle = PALETTE.espressoMid;
      ctx.fillRect(sx, sy, sw, 6);
      ctx.fillStyle = PALETTE.espresso;
      ctx.fillRect(sx + sw * 0.16, sy + 6, 4, sh);
      ctx.fillRect(sx + sw * 0.84 - 4, sy + 6, 4, sh);
    };
    drawStool(a);
    drawStool(b);
    const tx = ((a.u + b.u) * 0.5) * W;
    const ty = Math.min(a.bottom, b.bottom) * H - H * 0.14;
    ctx.fillStyle = PALETTE.espresso;
    ctx.fillRect(tx - W * 0.07, ty, W * 0.14, 5);
    ctx.fillRect(tx - 3, ty + 5, 6, H * 0.16);
    ctx.fillRect(tx - W * 0.04, ty + H * 0.16 + 3, W * 0.08, 4);
    // 桌上两只小咖啡杯剪影
    ctx.fillRect(tx - W * 0.042, ty - 7, 10, 7);
    ctx.fillRect(tx + W * 0.028, ty - 7, 10, 7);
  } else {
    // 站台并肩：站台黄色/米白安全线与远景雨棚柱
    ctx.save();
    ctx.strokeStyle = "rgba(251, 241, 227, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(W * 0.04, H * 0.89);
    ctx.lineTo(W * 0.96, H * 0.89);
    ctx.stroke();
    ctx.setLineDash([]);
    // 远景极简站台立柱（淡棕线条，绝不抢人物主戏）
    ctx.fillStyle = "rgba(51, 36, 26, 0.10)";
    ctx.fillRect(W * 0.16 - shiftX * 0.4, H * 0.14, 6, H * 0.68);
    ctx.fillRect(W * 0.82 - shiftX * 0.4, H * 0.14, 6, H * 0.68);
    ctx.fillRect(W * 0.08 - shiftX * 0.4, H * 0.14, W * 0.84, 5);
    ctx.restore();
  }
}

function drawArrowHead(ctx, x, y, angle, size = 7, color = PALETTE.terracotta) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.56);
  ctx.lineTo(-size, size * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 渲染主舞台画布（返回实测命中盒供指针拖拽使用）
const canvasDpr = () => Math.min(window.devicePixelRatio || 1, window.innerWidth <= 640 ? 1.5 : 2);

export function renderHeroStage(canvas, state, evalRes, ui = {}) {
  const ctx = canvas.getContext("2d");
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return null;
  const dpr = canvasDpr();
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. 暖杏原海报底纸
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);

  // 2. 柔白穹顶 + 陶橙透视地板 + 家具道具
  drawStageProps(ctx, W, H, evalRes, state);

  const { a, b, metrics, principles, isMutualFacing, isSameDir, axisCrossed } = evalRes;
  const ov = state.overlay || "all";
  const showAll = ov === "all";

  // 3. 负空间 / 呼吸区可视化叠层（在人物后面画底带，干净不挡脸）
  if (showAll || ov === "breathing") {
    const lx = evalRes.leftP.right * W;
    const rx = evalRes.rightP.left * W;
    if (rx > lx + 4 && !isSameDir) {
      ctx.save();
      ctx.fillStyle = principles.breathing.ok ? "rgba(30, 96, 68, 0.06)" : "rgba(176, 35, 24, 0.10)";
      ctx.fillRect(lx, H * 0.20, rx - lx, H * 0.62);
      // 复刻 302 原海报两位人物身前的两条垂直虚线界尺
      ctx.strokeStyle = principles.breathing.ok ? PALETTE.terracotta : PALETTE.err;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lx, H * 0.22);
      ctx.lineTo(lx, H * 0.66);
      ctx.moveTo(rx, H * 0.22);
      ctx.lineTo(rx, H * 0.66);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (rx <= lx + 4) {
      // 重叠/挤压红警示条
      ctx.save();
      ctx.fillStyle = "rgba(176, 35, 24, 0.16)";
      ctx.fillRect(Math.min(lx, rx) - 6, H * 0.20, Math.abs(rx - lx) + 12, H * 0.62);
      ctx.restore();
    }
  }

  // 4. 按纵深排序绘制人物（远处先画，近处后画）
  const order = a.cz > b.cz
    ? [
        { id: "A", p: a, type: "woman" },
        { id: "B", p: b, type: "man" },
      ]
    : [
        { id: "B", p: b, type: "man" },
        { id: "A", p: a, type: "woman" },
      ];

  const hitBoxes = {};
  for (const item of order) {
    const p = item.p;
    const px = p.u * W;
    const py = p.bottom * H;
    const pw = p.w * W;
    const ph = p.h * H;
    // 远景人物略柔暖褐，近景深咖，自然呈现空气与主次层次
    const isFar = p.cz > 0.16;
    const tint = isFar ? "#4C382D" : PALETTE.espresso;
    drawSilhouette(ctx, px, py, pw, ph, {
      type: item.type,
      style: evalRes.scene.seatStyle,
      facing: p.facing,
      tint,
      selected: ui.selectedActor === item.id || ui.dragging === item.id,
      highlight: ui.hoveredActor === item.id,
    });
    hitBoxes[item.id] = {
      x: px - pw * 0.56,
      y: p.top * H - 10,
      w: pw * 1.12,
      h: ph + 16,
      cx: px,
      cy: (p.top + p.bottom) * 0.5 * H,
    };

    // 脚下或头顶极简角色标签 A / B（清晰标示身份，尤其在越轴切镜时立见左右翻转）
    ctx.save();
    const tagY = Math.max(22, p.top * H - 12);
    const badgeColor = item.id === "A" ? PALETTE.espresso : PALETTE.terracottaDark;
    ctx.font = '600 11px "IBM Plex Sans", sans-serif';
    const labelTxt = item.id === "A" ? "A" : "B";
    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.arc(px, tagY, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelTxt, px, tagY + 0.5);

    // 主次面积叠层圈标
    if (ov === "hierarchy") {
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(p.left * W, p.top * H, pw, ph);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 5. 对话轴线 & 视线匹配叠层（1:1 复刻原海报橙色虚线双箭或失误警示红箭）
  if (showAll || ov === "axis" || ov === "eyeline") {
    const axE = a.eyeU * W;
    const ayE = a.eyeV * H;
    const bxE = b.eyeU * W;
    const byE = b.eyeV * H;

    ctx.save();
    if (isMutualFacing && !evalRes.principles.eyeline.ok === false) {
      // 成立的对望虚线双箭头（1:1 原海报视觉符号）
      const lineColor = principles.axis.ok && principles.eyeline.ok ? PALETTE.terracotta : PALETTE.err;
      const dx = bxE - axE;
      const dy = byE - ayE;
      const len = Math.hypot(dx, dy) || 1;
      const pad = Math.min(24, len * 0.16);
      const sx = axE + (dx / len) * pad;
      const sy = ayE + (dy / len) * pad;
      const ex = bxE - (dx / len) * pad;
      const ey = byE - (dy / len) * pad;
      const ang = Math.atan2(ey - sy, ex - sx);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
      if (len > 42) {
        drawArrowHead(ctx, sx, sy, ang + Math.PI, 7, lineColor);
        drawArrowHead(ctx, ex, ey, ang, 7, lineColor);
      }
    } else if (isSameDir) {
      // 同向观看：从靠前一方眼睛向右/左射出引导视线虚线箭（致敬原海报缩略图 #4）
      const lead = a.facing > 0 ? (a.eyeU > b.eyeU ? a : b) : (a.eyeU < b.eyeU ? a : b);
      const lineColor = principles.eyeline.ok ? PALETTE.terracotta : PALETTE.err;
      const sx = lead.eyeU * W + lead.facing * 18;
      const sy = lead.eyeV * H;
      const span = Math.max(42, Math.min(W * 0.28, (lead.facing > 0 ? W - sx : sx) - 20));
      const ex = sx + lead.facing * span;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrowHead(ctx, ex, sy, lead.facing > 0 ? 0 : Math.PI, 7, lineColor);
    } else {
      // 视线背离或俯仰错高：画出两道各自偏飞的红色警示视线
      const drawErrGaze = (p) => {
        const sx = p.eyeU * W + p.facing * 10;
        const sy = p.eyeV * H;
        const len = Math.min(W * 0.22, 110);
        const ex = sx + p.facing * len;
        const ey = sy - p.pitch * H * 1.4;
        const ang = Math.atan2(ey - sy, ex - sx);
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);
        drawArrowHead(ctx, ex, ey, ang, 7, PALETTE.err);
      };
      drawErrGaze(a);
      drawErrGaze(b);
    }
    ctx.restore();
  }

  // 6. 原海报招牌：中央呼吸空间「+」平衡符 & 实际视觉重心偏移提示
  if (showAll || ov === "balance") {
    const cx = W * 0.5;
    const cy = H * 0.64;
    const comX = metrics.comU * W;
    ctx.save();
    // 理想中轴微淡 +
    ctx.strokeStyle = "rgba(51, 36, 26, 0.28)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy);
    ctx.lineTo(cx + 7, cy);
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx, cy + 7);
    ctx.stroke();

    // 实际视觉重心 +（偏移大时连虚线并亮朱红）
    const balCol = principles.balance.ok ? PALETTE.terracotta : PALETTE.err;
    if (Math.abs(comX - cx) > 6) {
      ctx.strokeStyle = balCol;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(comX, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = balCol;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(comX - 8, cy);
    ctx.lineTo(comX + 8, cy);
    ctx.moveTo(comX, cy - 8);
    ctx.lineTo(comX, cy + 8);
    ctx.stroke();
    ctx.restore();
  }

  // 7. 画面右上角 / 左上角极简电影机位角标（克制、不挡主体、对比清晰）
  ctx.save();
  const isB = state.activeCam === "B";
  const topTag = isB
    ? `CAM B · 正反打视角 ${Math.round(state.camBAngle)}°${axisCrossed ? " · 越轴!" : ""}`
    : `CAM A · 主机位 ${state.camOrbit >= 0 ? "+" : ""}${Math.round(state.camOrbit)}°`;
  ctx.font = '600 11px "IBM Plex Sans", "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(topTag).width + 18;
  ctx.fillStyle = isB && axisCrossed ? PALETTE.err : "rgba(51, 36, 26, 0.88)";
  ctx.fillRect(12, 12, tw, 24);
  ctx.fillStyle = PALETTE.cream;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(topTag, 21, 24);

  // 右上角间距/平衡速读小签
  const rightTag = evalRes.score === 5 ? `5/5 · ${evalRes.recognized}` : `${evalRes.score}/5 · 净距 ${metrics.gapPct}%`;
  const rw = ctx.measureText(rightTag).width + 18;
  ctx.fillStyle = evalRes.score === 5 ? PALETTE.pass : PALETTE.err;
  ctx.fillRect(W - rw - 12, 12, rw, 24);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(rightTag, W - rw - 3, 24);

  // 越轴切镜强警示框边
  if (isB && axisCrossed) {
    ctx.strokeStyle = PALETTE.err;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
  }
  ctx.restore();

  ctx.restore();
  return hitBoxes;
}

// 渲染「俯视 180° 轴线机位雷达」（右侧上半，与主银幕严格双向耦合）
export function renderFloorRadar(canvas, state, evalRes) {
  const ctx = canvas.getContext("2d");
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return null;
  const dpr = canvasDpr();
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  ctx.save();
  ctx.scale(dpr, dpr);

  // 柔暖纸底 + 建筑细格
  ctx.fillStyle = "#FBF3E7";
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.5;
  const cy = H * 0.51;
  const R = Math.min(W * 0.37, H * 0.39);

  // 180° 轴线角度（按两人世界位置连线，默认接近水平）
  const dx = state.bx - state.ax;
  const dz = state.bz - state.az;
  const axisAng = Math.atan2(dz, dx || 0.001);

  // 1. 下半圆 = 180° 安全机位区（温润松青淡底）；上半圆 = 越轴禁区（浅朱红斜纹提示）
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(axisAng);

  // 安全半圆（+Y 南侧）
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = "rgba(30, 96, 68, 0.10)";
  ctx.fill();

  // 越轴半圆（-Y 北侧）
  ctx.beginPath();
  ctx.arc(0, 0, R, Math.PI, Math.PI * 2, false);
  ctx.closePath();
  ctx.fillStyle = evalRes.axisCrossed ? "rgba(176, 35, 24, 0.14)" : "rgba(176, 35, 24, 0.06)";
  ctx.fill();

  // 轨道外圆环
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(51, 36, 26, 0.24)";
  ctx.lineWidth = 1.25;
  ctx.stroke();

  // 180° 对话轴线贯穿虚线
  ctx.strokeStyle = PALETTE.terracotta;
  ctx.lineWidth = 1.75;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(-R - 14, 0);
  ctx.lineTo(R + 14, 0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 区域小字标签（收在内圈居中，绝不与外圈轨道上的机位圆点 1/2 重叠）
  ctx.save();
  ctx.font = '600 10px "IBM Plex Sans", "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.fillStyle = PALETTE.err;
  ctx.fillText("越轴禁区", cx, cy - R * 0.48);
  ctx.fillStyle = PALETTE.pass;
  ctx.fillText("180° 安全区", cx, cy + R * 0.54);
  ctx.restore();

  // 2. 两人俯视头肩节点（按世界坐标缩放映射）
  const scaleW = R * 0.92;
  const axP = cx + state.ax * scaleW;
  const ayP = cy - state.az * scaleW; // 世界 +z（远方）在俯视图上方
  const bxP = cx + state.bx * scaleW;
  const byP = cy - state.bz * scaleW;

  const drawTopPerson = (px, py, label, col) => {
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '700 10px "IBM Plex Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, px, py + 0.5);
    ctx.restore();
  };
  drawTopPerson(axP, ayP, "A", PALETTE.espresso);
  drawTopPerson(bxP, byP, "B", PALETTE.terracottaDark);

  // 3. 机位节点计算（0° = 正南，即 cy + R；+90° = 东，±180° = 正北越轴）
  const camScreen = (deg) => {
    const r = (deg * Math.PI) / 180;
    return {
      x: cx + Math.sin(r) * R,
      y: cy + Math.cos(r) * R,
    };
  };
  const pCamA = camScreen(state.camOrbit);
  const pCamB = camScreen(state.camBAngle);

  // 画机位视锥扇形
  const drawCam = (pos, tag, isActive, isErr) => {
    const ang = Math.atan2(cy - pos.y, cx - pos.x);
    ctx.save();
    // 视锥
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(pos.x, pos.y, R * 0.52, ang - 0.34, ang + 0.34);
    ctx.closePath();
    ctx.fillStyle = isErr
      ? "rgba(176, 35, 24, 0.22)"
      : isActive
      ? "rgba(213, 101, 53, 0.24)"
      : "rgba(51, 36, 26, 0.10)";
    ctx.fill();

    // 机位圆点把手
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isActive ? 11.5 : 10, 0, Math.PI * 2);
    ctx.fillStyle = isErr ? PALETTE.err : isActive ? PALETTE.espresso : PALETTE.terracotta;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = PALETTE.cream;
    ctx.stroke();

    ctx.fillStyle = PALETTE.cream;
    ctx.font = '700 10px "IBM Plex Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, pos.x, pos.y + 0.5);
    ctx.restore();
  };

  drawCam(pCamA, "1", state.activeCam === "A", false);
  drawCam(pCamB, "2", state.activeCam === "B", evalRes.axisCrossed);

  ctx.restore();
  return { cx, cy, R, pCamA, pCamB };
}

// 03 节深褐暗房：360° 轴线沙盘 + 实时 A/B 正反打监视器（2D Canvas）
export function renderCutLab(canvas, cutState) {
  const ctx = canvas.getContext("2d");
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return null;
  const dpr = canvasDpr();
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  ctx.save();
  ctx.scale(dpr, dpr);

  const res = evaluateCutLab(cutState);
  const stacked = W < 560;

  ctx.fillStyle = "#1E140F";
  ctx.fillRect(0, 0, W, H);

  // 区域切分：宽屏左 42% 为 360° 俯视沙盘，右 58% 为双分镜切镜监视器；窄屏上下排布
  const mapBox = stacked
    ? { x: 12, y: 12, w: W - 24, h: H * 0.48 - 16 }
    : { x: 14, y: 14, w: W * 0.41 - 18, h: H - 28 };
  const monBox = stacked
    ? { x: 12, y: H * 0.48 + 4, w: W - 24, h: H * 0.52 - 16 }
    : { x: W * 0.41 + 8, y: 14, w: W * 0.59 - 22, h: H - 28 };

  // === 左/上：360° 俯视轴线沙盘 ===
  ctx.fillStyle = "#291C15";
  ctx.fillRect(mapBox.x, mapBox.y, mapBox.w, mapBox.h);
  ctx.strokeStyle = "rgba(247, 229, 208, 0.14)";
  ctx.strokeRect(mapBox.x + 0.5, mapBox.y + 0.5, mapBox.w - 1, mapBox.h - 1);

  const cx = mapBox.x + mapBox.w * 0.5;
  const cy = mapBox.y + mapBox.h * 0.53;
  const R = Math.min(mapBox.w * 0.36, mapBox.h * 0.37);

  // 安全南半圆 / 越轴北半圆
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = "rgba(118, 214, 163, 0.12)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, R, Math.PI, Math.PI * 2, false);
  ctx.closePath();
  ctx.fillStyle = res.crossed ? "rgba(255, 133, 112, 0.24)" : "rgba(255, 133, 112, 0.09)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(247, 229, 208, 0.25)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 180° 轴线
  ctx.strokeStyle = "#F08556";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(cx - R - 14, cy);
  ctx.lineTo(cx + R + 14, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // 文字标示
  ctx.font = '600 10px "IBM Plex Sans", "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.fillStyle = "#FF9987";
  ctx.fillText("越轴禁区（跳轴）", cx, cy - R * 0.56);
  ctx.fillStyle = "#8BE3B3";
  ctx.fillText("180° 安全区", cx, cy + R * 0.68);
  ctx.fillStyle = "rgba(247, 229, 208, 0.72)";
  ctx.textAlign = "left";
  ctx.fillText("拖橙圆 2 绕圈测试越轴", mapBox.x + 10, mapBox.y + 18);

  // A / B 两人点
  const aPt = { x: cx - R * 0.44, y: cy };
  const bPt = { x: cx + R * 0.44, y: cy };
  for (const [pt, txt, col] of [[aPt, "A", "#F7E5D0"], [bPt, "B", "#F08556"]]) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.fillStyle = "#241913";
    ctx.font = '700 10px "IBM Plex Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, pt.x, pt.y + 0.5);
  }

  // 固定机位 1（-38°）与可拖机位 2
  const camCoord = (deg) => {
    const r = (deg * Math.PI) / 180;
    return { x: cx + Math.sin(r) * R, y: cy + Math.cos(r) * R };
  };
  const c1 = camCoord(-38);
  const c2 = camCoord(cutState.angleB);

  const drawLabCam = (pt, target, label, active, col) => {
    const ang = Math.atan2(target.y - pt.y, target.x - pt.x);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.arc(pt.x, pt.y, R * 0.56, ang - 0.30, ang + 0.30);
    ctx.closePath();
    ctx.fillStyle = active ? "rgba(240, 133, 86, 0.28)" : "rgba(247, 229, 208, 0.10)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.strokeStyle = "#FBF1E3";
    ctx.stroke();

    ctx.fillStyle = "#1E140F";
    ctx.font = '700 11px "IBM Plex Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, pt.x, pt.y + 0.5);
    ctx.restore();
  };

  drawLabCam(c1, bPt, "1", cutState.activeShot === 1, "#8BE3B3");
  drawLabCam(c2, aPt, "2", cutState.activeShot === 2, res.crossed ? "#FF7B66" : "#F08556");

  // === 右/下：镜头 1 vs 镜头 2 正反打监视器 ===
  const gap = 10;
  const shotW = (monBox.w - gap) * 0.5;
  const shotH = monBox.h;

  const drawShot = (x, y, w, h, shotNum) => {
    const isActive = cutState.activeShot === shotNum;
    const isErrShot = shotNum === 2 && (res.crossed || res.pitchDiff !== 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.fillStyle = "#F7E5D0";
    ctx.fillRect(x, y, w, h);

    // 淡穹顶底饰
    ctx.fillStyle = "#FBF1E3";
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.68, Math.min(w, h) * 0.44, Math.PI, 0);
    ctx.fill();

    // 陶橙底边
    ctx.fillStyle = "#D56535";
    ctx.fillRect(x, y + h * 0.80, w, h * 0.20);

    // 剪影位置与朝向（中近景正反打，严格裁在监视框内不外溢）
    const isShot1 = shotNum === 1;
    const facing = isShot1 ? 1 : res.cut2BFacing;
    const personX = isShot1 ? x + w * 0.34 : res.cut2BOnRight ? x + w * 0.66 : x + w * 0.34;
    const eyeY = y + h * 0.38 + (isShot1 ? 0 : res.pitchDiff * h * 0.07);

    // 画半身剪影（无五官）
    drawSilhouette(ctx, personX, y + h * 1.18, w * 0.42, h * 0.96, {
      type: isShot1 ? "woman" : "man",
      style: "bench",
      facing,
      tint: PALETTE.espresso,
    });

    // 视线方向虚线箭
    const arrowCol = isErrShot ? PALETTE.err : PALETTE.terracotta;
    const sx = personX + facing * w * 0.13;
    const ex = sx + facing * w * 0.32;
    const ey = eyeY - (isShot1 ? 0 : res.pitchDiff * h * 0.12);
    ctx.strokeStyle = arrowCol;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, eyeY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrowHead(ctx, ex, ey, Math.atan2(ey - eyeY, ex - sx), 7, arrowCol);

    // 顶栏镜头编号
    ctx.fillStyle = isErrShot ? PALETTE.err : isActive ? PALETTE.espresso : "rgba(51, 36, 26, 0.78)";
    ctx.fillRect(x, y, w, 24);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '600 11px "IBM Plex Sans", "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const dirTxt = facing > 0 ? "朝右看 →" : "← 朝左看";
    ctx.fillText(isShot1 ? `CUT 01 · A ${dirTxt}` : `CUT 02 · B ${dirTxt}`, x + 8, y + 12);

    // 当前播放的高亮框
    ctx.strokeStyle = isErrShot ? "#FF7B66" : isActive ? "#F08556" : "rgba(247, 229, 208, 0.22)";
    ctx.lineWidth = isActive ? 3 : 1;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.restore();
  };

  drawShot(monBox.x, monBox.y, shotW, shotH, 1);
  drawShot(monBox.x + shotW + gap, monBox.y, shotW, shotH, 2);

  // 中间剪辑切换标签
  ctx.save();
  const midX = monBox.x + shotW + gap * 0.5;
  const midY = monBox.y + shotH * 0.5;
  ctx.fillStyle = res.verdict === "pass" ? PALETTE.pass : res.verdict === "warn" ? PALETTE.terracotta : PALETTE.err;
  ctx.beginPath();
  ctx.arc(midX, midY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 10px "IBM Plex Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CUT", midX, midY + 0.5);
  ctx.restore();

  ctx.restore();
  return { cx, cy, R, c2 };
}
