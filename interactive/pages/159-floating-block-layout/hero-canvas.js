// 159 浮动块版式 · 开放 2.5D 浮动排布台 + Z 轴侧视浮升剖面槽渲染与交互
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, evaluateLayout, pointInConvexPoly } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawDotGrid(ctx, x0, y0, cols, rows, gap, r, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.beginPath();
      ctx.arc(x0 + j * gap, y0 + i * gap, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function createHeroWorkbench({ stageCanvas, profileCanvas, state, onChange }) {
  const sCtx = stageCanvas.getContext("2d");
  const pCtx = profileCanvas.getContext("2d");

  let W = 820;
  let H = 480;
  let PW = 820;
  let PH = 104;
  let dpr = 1;
  let evalCache = evaluateLayout(state, W, H);
  let dragging = null; // { mode: "card" | "rotate", id, offsetX, offsetY, startAngle, startDeg }
  let profileDragging = false;
  let hoverId = null;
  let fixHitBoxes = [];
  let rotateHandle = null;
  let cardLift = { hero: 0, quote: 0, power: 0, less: 0 };
  let dirty = true;

  function resize() {
    const sr = stageCanvas.getBoundingClientRect();
    const isNarrow = window.innerWidth <= 640;
    dpr = pixelRatio(isNarrow ? 1.5 : 2);
    if (sr.width > 40 && sr.height > 40) {
      W = sr.width;
      H = sr.height;
      const tw = Math.round(W * dpr);
      const th = Math.round(H * dpr);
      if (stageCanvas.width !== tw || stageCanvas.height !== th) {
        stageCanvas.width = tw;
        stageCanvas.height = th;
      }
    }
    const pr = profileCanvas.getBoundingClientRect();
    if (pr.width > 40 && pr.height > 30) {
      PW = pr.width;
      PH = pr.height;
      const tw = Math.round(PW * dpr);
      const th = Math.round(PH * dpr);
      if (profileCanvas.width !== tw || profileCanvas.height !== th) {
        profileCanvas.width = tw;
        profileCanvas.height = th;
      }
    }
    evalCache = evaluateLayout(state, W, H);
    dirty = true;
  }

  function syncEval() {
    evalCache = evaluateLayout(state, W, H);
    dirty = true;
    return evalCache;
  }

  // 绘制单张 159 原海报风格浮动卡（零昂贵 shadowBlur，用多层羽化圆角影实现软件渲染 60fps）
  function drawCard(ctx, rect, liftAmt, introProgress, isSelected, isHovered) {
    const { cx, cy, w, h, rad, dp, style, title, title2, body, items, order } = rect;
    const gain = state.elevationGain;
    const effDp = dp + liftAmt * 7;

    ctx.save();
    ctx.translate(cx, cy - liftAmt * 6 + (1 - introProgress) * (18 + order * 6));
    ctx.rotate(rad);
    ctx.globalAlpha = Math.min(1, introProgress * 1.15);

    const radius = Math.max(10, Math.min(18, w * 0.068));

    // 多层羽化投影（模拟本影 + 半影 + 柔和靛蓝漫射；避免 CPU 高斯模糊，SwiftShader 下依然流畅 60fps）
    const muddy = gain > 0.86;
    if (effDp > 0.4) {
      const rgb = muddy ? "16, 18, 42" : "43, 51, 141";
      const s = muddy ? 1.55 : 1;
      const layers = [
        { ox: effDp * 0.14 * s, oy: (2.5 + effDp * 0.65) * s, pad: (3 + effDp * 0.48) * s, a: muddy ? 0.16 : 0.055 },
        { ox: effDp * 0.08 * s, oy: (2 + effDp * 0.42) * s, pad: (1.5 + effDp * 0.24) * s, a: muddy ? 0.22 : 0.075 },
        { ox: 0, oy: (1.2 + effDp * 0.20) * s, pad: 0.5, a: muddy ? 0.24 : 0.085 },
      ];
      for (const L of layers) {
        roundRectPath(ctx, -w / 2 - L.pad + L.ox, -h / 2 - L.pad + L.oy, w + L.pad * 2, h + L.pad * 2, radius + L.pad * 0.5);
        ctx.fillStyle = `rgba(${rgb}, ${L.a})`;
        ctx.fill();
      }
    }

    // 淡紫卡顶部的标志性原海报小贴纸耳（绘制在卡片外缘上方）
    if (style === "lilac") {
      ctx.fillStyle = PALETTE.lavender;
      ctx.fillRect(w * 0.12, -h / 2 - Math.max(8, h * 0.07), Math.max(18, w * 0.16), Math.max(10, h * 0.085));
    }

    // 卡片本体裁剪区域
    ctx.save();
    roundRectPath(ctx, -w / 2, -h / 2, w, h, radius);
    ctx.clip();

    if (style === "indigo") {
      // 深皇家靛蓝主焦卡（原海报中卡：渐变深靛 + 柠檬太阳圆 + 流动薰衣草双波浪 + 细柠檬正弦丝线）
      const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      grad.addColorStop(0, "#242B7D");
      grad.addColorStop(0.58, "#383FA3");
      grad.addColorStop(1, "#5A4CC7");
      ctx.fillStyle = grad;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // 底部两层柔和薰衣草流动波浪
      ctx.fillStyle = PALETTE.lavenderMid;
      ctx.beginPath();
      ctx.moveTo(-w / 2, h * 0.14);
      ctx.bezierCurveTo(-w * 0.18, h * 0.02, w * 0.05, h * 0.22, w * 0.22, -h * 0.02);
      ctx.bezierCurveTo(w * 0.34, -h * 0.16, w * 0.44, -h * 0.18, w / 2, -h * 0.15);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#4F46B8";
      ctx.beginPath();
      ctx.moveTo(-w / 2, h * 0.34);
      ctx.bezierCurveTo(-w * 0.16, h * 0.18, w * 0.08, h * 0.34, w * 0.26, h * 0.12);
      ctx.bezierCurveTo(w * 0.38, h * 0.02, w * 0.45, h * 0.04, w / 2, h * 0.06);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      ctx.fill();

      // 原海报柠檬黄细波浪曲线
      ctx.strokeStyle = PALETTE.limeBright;
      ctx.lineWidth = Math.max(1.2, w * 0.008);
      ctx.beginPath();
      ctx.moveTo(-w / 2, h * 0.02);
      ctx.bezierCurveTo(-w * 0.14, -h * 0.13, w * 0.12, h * 0.25, w / 2, h * 0.19);
      ctx.stroke();

      // 右上发光柠檬青黄圆点（正圆）
      const dotR = Math.max(6, Math.min(w, h) * 0.072);
      ctx.fillStyle = PALETTE.limeBright;
      ctx.beginPath();
      ctx.arc(w * 0.30, -h * 0.33, dotR, 0, Math.PI * 2);
      ctx.fill();

      // 文字排版
      const fs = Math.max(11, Math.min(16, w * 0.074));
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(title, -w * 0.41, -h * 0.32);
      if (title2) ctx.fillText(title2, -w * 0.41, -h * 0.32 + fs * 1.45);

      // 柠檬短杠
      ctx.fillStyle = PALETTE.lime;
      ctx.fillRect(-w * 0.41, -h * 0.32 + fs * 3.1, Math.max(16, w * 0.14), 2.5);

      // 小注
      const bfs = Math.max(9.5, Math.min(11.5, w * 0.05));
      ctx.fillStyle = "#E4E6FA";
      ctx.font = `400 ${bfs}px "Noto Sans SC", sans-serif`;
      ctx.fillText(body, -w * 0.41, h * 0.34);
    } else if (style === "quote") {
      // 引言白卡（原海报右上卡：纯白底 + 右侧裁切淡紫半圆 + 引号 + 靛蓝点阵）
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // 右侧裁切淡紫半圆（正圆）
      const cr = Math.min(w, h) * 0.39;
      ctx.fillStyle = PALETTE.lavenderSoft;
      ctx.beginPath();
      ctx.arc(w * 0.46, h * 0.06, cr, 0, Math.PI * 2);
      ctx.fill();

      // 靛蓝微点阵
      drawDotGrid(ctx, w * 0.15, h * 0.18, 6, 4, Math.max(5.5, w * 0.036), 1.15, "#5A4CC7");

      // 淡紫粗引号
      ctx.fillStyle = PALETTE.lavenderMid;
      ctx.font = `700 ${Math.max(20, w * 0.14)}px "DM Serif Display", serif`;
      ctx.textBaseline = "top";
      ctx.fillText("“", -w * 0.41, -h * 0.42);

      // 正文大句
      const fs = Math.max(11, Math.min(15.5, w * 0.066));
      ctx.fillStyle = PALETTE.indigoDeep;
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.fillText(title, -w * 0.41, -h * 0.14);
      if (title2) ctx.fillText(title2, -w * 0.41, -h * 0.14 + fs * 1.42);

      ctx.fillStyle = PALETTE.lime;
      ctx.fillRect(-w * 0.41, -h * 0.14 + fs * 2.95, Math.max(16, w * 0.13), 2.5);

      const bfs = Math.max(9.5, Math.min(11.5, w * 0.045));
      ctx.fillStyle = PALETTE.mutedInk;
      ctx.font = `400 ${bfs}px "Noto Sans SC", sans-serif`;
      const half = Math.ceil(body.length / 2);
      ctx.fillText(body.slice(0, half), -w * 0.41, h * 0.21);
      ctx.fillText(body.slice(half), -w * 0.41, h * 0.21 + bfs * 1.4);
    } else if (style === "lilac") {
      // 淡紫要点卡（原海报右中卡：淡薰衣草底 + 标题 + 三枚柔紫圆徽要点）
      ctx.fillStyle = PALETTE.lilacCard;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      const fs = Math.max(11, Math.min(15.5, w * 0.08));
      ctx.fillStyle = PALETTE.indigoDeep;
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(title, -w * 0.4, -h * 0.40);

      ctx.fillStyle = PALETTE.lime;
      ctx.fillRect(-w * 0.4, -h * 0.40 + fs * 1.5, Math.max(16, w * 0.18), 2.5);

      const rowStart = -h * 0.18;
      const rowStep = h * 0.215;
      const iconR = Math.max(7.5, Math.min(12.5, w * 0.068));
      (items || []).forEach((it, idx) => {
        const ry = rowStart + idx * rowStep;
        ctx.fillStyle = "#9C92E8";
        ctx.beginPath();
        ctx.arc(-w * 0.30, ry + iconR * 0.65, iconR, 0, Math.PI * 2);
        ctx.fill();

        // 极简白色图形徽记（翼/眼/星）
        ctx.strokeStyle = "#FFFFFF";
        ctx.fillStyle = "#FFFFFF";
        ctx.lineWidth = 1.4;
        const ix = -w * 0.30;
        const iy = ry + iconR * 0.65;
        if (idx === 0) {
          ctx.beginPath();
          ctx.arc(ix - iconR * 0.22, iy, iconR * 0.32, 0, Math.PI * 2);
          ctx.arc(ix + iconR * 0.22, iy, iconR * 0.32, 0, Math.PI * 2);
          ctx.fill();
        } else if (idx === 1) {
          ctx.beginPath();
          ctx.ellipse(ix, iy, iconR * 0.52, iconR * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ix, iy, iconR * 0.16, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          for (let k = 0; k < 5; k++) {
            const ang = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
            const px = ix + Math.cos(ang) * iconR * 0.48;
            const py = iy + Math.sin(ang) * iconR * 0.48;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }

        const tfs = Math.max(10, Math.min(13, w * 0.062));
        const dfs = Math.max(9, Math.min(11, w * 0.049));
        ctx.fillStyle = PALETTE.indigoDeep;
        ctx.font = `700 ${tfs}px "Noto Sans SC", sans-serif`;
        ctx.fillText(it.t, -w * 0.14, ry - 1);
        ctx.fillStyle = PALETTE.mutedInk;
        ctx.font = `400 ${dfs}px "Noto Sans SC", sans-serif`;
        ctx.fillText(it.d, -w * 0.14, ry + tfs * 1.22);
      });
    } else {
      // 几何结语卡（原海报下白卡：纯白底 + 右侧淡紫方块/深靛四分之一圆/柠檬太阳/斜丝线/点阵）
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // 右侧几何小构图
      const gx = w * 0.04;
      const gy = -h * 0.32;
      const gSize = h * 0.78;
      ctx.fillStyle = PALETTE.lavender;
      ctx.fillRect(gx, gy, gSize * 0.72, gSize * 0.88);

      ctx.fillStyle = PALETTE.indigoDeep;
      ctx.beginPath();
      ctx.moveTo(gx, gy + gSize * 0.88);
      ctx.arc(gx, gy + gSize * 0.88, gSize * 0.68, -Math.PI / 2, 0);
      ctx.closePath();
      ctx.fill();

      drawDotGrid(ctx, gx + gSize * 0.78, gy + gSize * 0.12, 4, 5, Math.max(5.5, h * 0.085), 1.05, "#8E87D8");

      const sunR = Math.max(7, h * 0.13);
      ctx.fillStyle = PALETTE.limeBright;
      ctx.beginPath();
      ctx.arc(gx + gSize * 1.15, gy + gSize * 0.18, sunR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = PALETTE.limeBright;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(gx - 4, gy + gSize * 0.90);
      ctx.lineTo(gx + gSize * 1.15, gy + gSize * 0.18);
      ctx.stroke();

      // 左侧文字
      const fs = Math.max(11, Math.min(15.5, w * 0.056));
      ctx.fillStyle = PALETTE.indigoDeep;
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(title, -w * 0.44, -h * 0.36);
      if (title2) ctx.fillText(title2, -w * 0.44, -h * 0.36 + fs * 1.38);

      ctx.fillStyle = PALETTE.lime;
      ctx.fillRect(-w * 0.44, -h * 0.36 + fs * 2.85, Math.max(16, w * 0.10), 2.5);

      const bfs = Math.max(9.5, Math.min(11.5, w * 0.038));
      ctx.fillStyle = PALETTE.mutedInk;
      ctx.font = `400 ${bfs}px "Noto Sans SC", sans-serif`;
      const split = Math.ceil(body.length / 2);
      ctx.fillText(body.slice(0, split), -w * 0.44, h * 0.12);
      ctx.fillText(body.slice(split), -w * 0.44, h * 0.12 + bfs * 1.42);
    }

    // 淡边框保持白卡在云白底上的清晰边缘
    roundRectPath(ctx, -w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, radius);
    ctx.strokeStyle = style === "indigo" ? "rgba(255,255,255,0.16)" : "rgba(43,51,141,0.10)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore(); // end clip

    // 淡紫卡右下角的原海报手绘柠檬黄卷曲线条（超出卡片边缘增加呼吸感）
    if (style === "lilac") {
      ctx.strokeStyle = PALETTE.limeBright;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.46);
      ctx.bezierCurveTo(w * 0.56, h * 0.52, w * 0.46, h * 0.24, w * 0.54, h * 0.38);
      ctx.bezierCurveTo(w * 0.62, h * 0.54, w * 0.68, h * 0.28, w * 0.65, h * 0.46);
      ctx.stroke();
    }

    // 左上角极简序号 & Z 高程微签（高对比，不遮正文）
    const pillW = Math.max(46, Math.min(60, w * 0.32));
    const pillH = 18;
    roundRectPath(ctx, w / 2 - pillW - 8, -h / 2 + 8, pillW, pillH, 9);
    ctx.fillStyle = style === "indigo" ? "rgba(220,236,128,0.95)" : "rgba(43,51,141,0.92)";
    ctx.fill();
    ctx.fillStyle = style === "indigo" ? PALETTE.indigoInk : "#FFFFFF";
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`0${order}·L${rect.z}`, w / 2 - pillW / 2 - 8, -h / 2 + 8 + pillH / 2 + 0.5);
    ctx.textAlign = "left";

    // 选中或悬停轮廓与角部旋转耳柄
    if (isSelected || isHovered) {
      roundRectPath(ctx, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, radius + 3);
      ctx.strokeStyle = isSelected ? PALETTE.violetBadge : "rgba(90,76,199,0.45)";
      ctx.lineWidth = isSelected ? 2 : 1.2;
      ctx.setLineDash(isSelected ? [6, 4] : [4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // 记录选中卡的角部旋转把手的全局坐标并绘制（便于点击拖拽旋转）
    if (isSelected) {
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const lx = w / 2 + 12;
      const ly = -h / 2 - 12;
      const hx = cx + lx * cos - ly * sin;
      const hy = cy - liftAmt * 6 + lx * sin + ly * cos;
      rotateHandle = { id: rect.id, x: hx, y: hy, r: 13 };

      ctx.save();
      // 引线
      const cxCorner = cx + (w / 2) * cos - (-h / 2) * sin;
      const cyCorner = cy - liftAmt * 6 + (w / 2) * sin + (-h / 2) * cos;
      ctx.strokeStyle = PALETTE.violetBadge;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cxCorner, cyCorner);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      // 圆形旋转耳柄
      ctx.fillStyle = PALETTE.white;
      ctx.strokeStyle = PALETTE.violetBadge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 环形旋转小箭头
      ctx.strokeStyle = PALETTE.indigoDeep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(hx, hy, 5, -Math.PI * 0.7, Math.PI * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + 3, hy + 5.5);
      ctx.lineTo(hx + 6.5, hy + 3.2);
      ctx.lineTo(hx + 4.5, hy + 0.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawStage(t, introProgress) {
    sCtx.save();
    sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sCtx.clearRect(0, 0, W, H);

    // 1. 开放冰薰衣草云白原纸底色 + 原海报角落几何装饰母题
    const bgGrad = sCtx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#FAFBFD");
    bgGrad.addColorStop(1, "#F4F6FD");
    sCtx.fillStyle = bgGrad;
    sCtx.fillRect(0, 0, W, H);

    // 右上角深靛色块裁角（1:1 呼应 159 原海报）
    sCtx.fillStyle = PALETTE.indigoBleed;
    sCtx.fillRect(W * 0.80, 0, W * 0.20, H * 0.21);

    // 左上淡紫弧圆与极轻点阵
    sCtx.fillStyle = "rgba(210, 203, 251, 0.55)";
    sCtx.beginPath();
    sCtx.arc(W * 0.16, -H * 0.04, Math.min(W, H) * 0.18, 0, Math.PI * 2);
    sCtx.fill();
    drawDotGrid(sCtx, 14, 14, 7, 4, 10, 1.1, "rgba(90, 76, 199, 0.20)");

    // 右下淡紫压角块
    sCtx.fillStyle = "rgba(210, 203, 251, 0.52)";
    sCtx.fillRect(W * 0.78, H * 0.82, W * 0.22, H * 0.18);

    // 2. 可选「隐藏暗网参考线」（当用户打开暗网开关时显现底层 12 列与对角视觉基准）
    if (state.showGrid) {
      sCtx.save();
      sCtx.strokeStyle = "rgba(90, 76, 199, 0.14)";
      sCtx.lineWidth = 1;
      for (let i = 1; i < 12; i++) {
        const gx = (W / 12) * i;
        sCtx.beginPath();
        sCtx.moveTo(gx, 0);
        sCtx.lineTo(gx, H);
        sCtx.stroke();
      }
      for (let j = 1; j < 6; j++) {
        const gy = (H / 6) * j;
        sCtx.beginPath();
        sCtx.moveTo(0, gy);
        sCtx.lineTo(W, gy);
        sCtx.stroke();
      }
      // 黄金对角视觉引导暗线
      sCtx.strokeStyle = "rgba(90, 76, 199, 0.28)";
      sCtx.setLineDash([5, 5]);
      sCtx.beginPath();
      sCtx.moveTo(W * 0.12, H * 0.88);
      sCtx.lineTo(W * 0.88, H * 0.12);
      sCtx.stroke();
      sCtx.setLineDash([]);
      sCtx.restore();
    }

    // 3. 串联卡片的原海报柠檬青黄呼吸丝线与视线路径（1 → 2 → 3 → 4）
    const pts = evalCache.pathPts;
    if (state.showSightline && pts.length === 4) {
      sCtx.save();
      const cross = evalCache.sightlineCross;
      sCtx.strokeStyle = cross ? "rgba(184, 29, 51, 0.72)" : "#C5D94A";
      sCtx.lineWidth = cross ? 2.2 : 2;
      sCtx.setLineDash(cross ? [6, 5] : []);
      sCtx.beginPath();
      sCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i];
        const q = pts[i + 1];
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2 - (i % 2 === 0 ? 18 : -16);
        sCtx.quadraticCurveTo(mx, my, q.x, q.y);
      }
      sCtx.stroke();
      sCtx.setLineDash([]);

      // 流动光珠（缓慢沿视线路径走一遍，reduced-motion 下停在节点）
      if (introProgress >= 0.98 && !cross) {
        const u = (t * 0.22) % 3;
        const seg = Math.floor(u);
        const f = u - seg;
        const p = pts[seg];
        const q = pts[seg + 1];
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2 - (seg % 2 === 0 ? 18 : -16);
        const bx = (1 - f) * (1 - f) * p.x + 2 * (1 - f) * f * mx + f * f * q.x;
        const by = (1 - f) * (1 - f) * p.y + 2 * (1 - f) * f * my + f * f * q.y;
        sCtx.fillStyle = PALETTE.indigoDeep;
        sCtx.beginPath();
        sCtx.arc(bx, by, 4.5, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.fillStyle = PALETTE.limeBright;
        sCtx.beginPath();
        sCtx.arc(bx, by, 2.5, 0, Math.PI * 2);
        sCtx.fill();
      }
      sCtx.restore();
    }

    // 4. 按真实 Z 层级从小到大依次绘制四张浮动卡
    rotateHandle = null;
    const drawOrder = [...evalCache.rects].sort((a, b) => a.z - b.z || b.order - a.order);
    for (const r of drawOrder) {
      drawCard(
        sCtx,
        r,
        cardLift[r.id] || 0,
        introProgress,
        state.selectedId === r.id,
        hoverId === r.id
      );
    }

    // 5. 重度重叠区域绘制精准斜纹警示区与画布就地纠错红签
    fixHitBoxes = [];
    for (const ov of evalCache.overlaps) {
      if (!ov.heavy || ov.poly.length < 3) continue;
      sCtx.save();
      sCtx.beginPath();
      ov.poly.forEach((p, idx) => (idx === 0 ? sCtx.moveTo(p.x, p.y) : sCtx.lineTo(p.x, p.y)));
      sCtx.closePath();
      sCtx.fillStyle = "rgba(184, 29, 51, 0.18)";
      sCtx.fill();
      sCtx.strokeStyle = PALETTE.danger;
      sCtx.lineWidth = 1.6;
      sCtx.setLineDash([4, 3]);
      sCtx.stroke();
      sCtx.setLineDash([]);
      sCtx.restore();
    }

    // 仅放一个最核心的画布直点纠错红签（避免画布贴满杂乱气泡）
    if (evalCache.worstOverlap && evalCache.worstOverlap.heavy) {
      const ov = evalCache.worstOverlap;
      const label = `遮挡 ${Math.round(Math.max(ov.ratio, ov.textRatio) * 100)}% · 点此推开`;
      drawFixPill(sCtx, ov.cx, ov.cy, label, "separate", ov.a.id);
    } else if (evalCache.maxAbsDeg > 9) {
      const wc = evalCache.wildestCard;
      drawFixPill(sCtx, wc.cx, wc.cy + wc.h * 0.22, `过斜 ${Math.round(wc.deg)}° · 点此收稳`, "levelTilt", wc.id);
    } else if (!evalCache.heroOnTop) {
      const hero = evalCache.rects.find((r) => r.id === "hero");
      drawFixPill(sCtx, hero.cx, hero.cy, "主焦被压底 · 点提至 L3", "raiseHero", "hero");
    }

    // 右上角极简状态数字小角标
    const badgeText = `留白 ${evalCache.whitespacePct}% · 跨度 ${evalCache.dpSpan}dp · ${evalCache.passCount}/4`;
    sCtx.save();
    sCtx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    const bw = sCtx.measureText(badgeText).width + 20;
    const bx = W - bw - 12;
    const by = 10;
    roundRectPath(sCtx, bx, by, bw, 24, 12);
    sCtx.fillStyle = evalCache.primaryDiag.ok ? PALETTE.ok : PALETTE.indigoInk;
    sCtx.fill();
    sCtx.fillStyle = "#FFFFFF";
    sCtx.textAlign = "center";
    sCtx.textBaseline = "middle";
    sCtx.fillText(badgeText, bx + bw / 2, by + 12.5);
    sCtx.restore();

    sCtx.restore();
  }

  function drawFixPill(ctx, cx, cy, text, action, targetId) {
    ctx.save();
    ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(text).width + 20;
    const th = 26;
    const x = Math.max(10, Math.min(W - tw - 10, cx - tw / 2));
    const y = Math.max(38, Math.min(H - th - 10, cy - th / 2));
    roundRectPath(ctx, x, y, tw, th, 13);
    ctx.fillStyle = PALETTE.danger;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + tw / 2, y + th / 2 + 0.5);
    ctx.restore();
    fixHitBoxes.push({ x, y, w: tw, h: th, action, targetId });
  }

  // 绘制底部「Z 轴侧视浮升剖面槽」（data-perf-drag）
  function drawProfile() {
    pCtx.save();
    pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pCtx.clearRect(0, 0, PW, PH);

    // 淡紫云白剖面底
    pCtx.fillStyle = "#FFFFFF";
    pCtx.fillRect(0, 0, PW, PH);

    const padL = 16;
    const padR = 16;
    const groundY = PH - 20;
    const topY = 26;
    const trackW = PW - padL - padR;

    // 顶部左侧剖面名称与右侧实时读数
    pCtx.font = `700 11px "Noto Sans SC", sans-serif`;
    pCtx.fillStyle = PALETTE.indigoDeep;
    pCtx.textBaseline = "top";
    pCtx.fillText("Z 轴侧视浮升剖面 · 左右横拖调分层强度", padL, 7);

    const pct = Math.round(state.elevationGain * 100);
    const zoneLabel = pct < 22 ? "平贴死板" : pct > 86 ? "重影发脏" : "清透悬停带";
    pCtx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    pCtx.textAlign = "right";
    pCtx.fillStyle = pct < 22 || pct > 86 ? PALETTE.danger : PALETTE.ok;
    pCtx.fillText(`${pct}% · ${zoneLabel}`, PW - padR, 7);
    pCtx.textAlign = "left";

    // 清透经验带底色（40% ~ 78%）
    const zMinX = padL + trackW * 0.36;
    const zMaxX = padL + trackW * 0.80;
    pCtx.fillStyle = "rgba(220, 236, 128, 0.28)";
    pCtx.fillRect(zMinX, topY, zMaxX - zMinX, groundY - topY);

    // 纸面基线 z = 0dp
    pCtx.strokeStyle = "rgba(43, 51, 141, 0.32)";
    pCtx.lineWidth = 1.5;
    pCtx.beginPath();
    pCtx.moveTo(padL, groundY);
    pCtx.lineTo(PW - padR, groundY);
    pCtx.stroke();

    // 纸面基线标尺文字
    pCtx.font = `400 10px "Space Mono", monospace`;
    pCtx.fillStyle = PALETTE.mutedInk;
    pCtx.fillText("0% 平贴", padL, groundY + 4);
    pCtx.textAlign = "center";
    pCtx.fillText("经验浮升带 40%–80%", padL + trackW * 0.58, groundY + 4);
    pCtx.textAlign = "right";
    pCtx.fillText("100% 重影", PW - padR, groundY + 4);
    pCtx.textAlign = "left";

    // 绘制四张卡片在侧视剖面中的独立高程柱位（按 01..04 均分，杜绝任何宽度的标签互撞）
    const maxScaleDp = 32;
    const ordered = [...evalCache.rects].sort((a, b) => a.order - b.order);
    const slotW = trackW / ordered.length;
    ordered.forEach((r, idx) => {
      const sx = padL + slotW * (idx + 0.5);
      const sw = Math.max(38, Math.min(82, slotW * 0.58));
      const liftRatio = Math.min(1, r.dp / maxScaleDp);
      const sy = groundY - 5 - liftRatio * (groundY - topY - 14);

      // 投影光锥
      const shadowSpread = sw * (0.5 + liftRatio * 0.42);
      pCtx.fillStyle = state.elevationGain > 0.86
        ? "rgba(24, 26, 58, 0.24)"
        : "rgba(90, 76, 199, 0.14)";
      pCtx.beginPath();
      pCtx.moveTo(sx - sw / 2, sy + 4);
      pCtx.lineTo(sx + sw / 2, sy + 4);
      pCtx.lineTo(sx + shadowSpread, groundY);
      pCtx.lineTo(sx - shadowSpread, groundY);
      pCtx.closePath();
      pCtx.fill();

      // 卡片侧视切片
      roundRectPath(pCtx, sx - sw / 2, sy - 4, sw, 8, 4);
      pCtx.fillStyle = r.style === "indigo" ? PALETTE.indigoDeep : r.style === "lilac" ? "#9C92E8" : PALETTE.white;
      pCtx.fill();
      pCtx.strokeStyle = state.selectedId === r.id ? PALETTE.violetBadge : PALETTE.indigoDeep;
      pCtx.lineWidth = state.selectedId === r.id ? 2 : 1.1;
      pCtx.stroke();

      // 切片上标极简序号 + dp（各占独立槽位，零重叠）
      pCtx.font = `700 10px "Space Mono", monospace`;
      pCtx.textAlign = "center";
      pCtx.fillStyle = PALETTE.indigoInk;
      pCtx.fillText(`0${r.order}:${Math.round(r.dp)}dp`, sx, sy - 13);
      pCtx.textAlign = "left";
    });

    // 浮升强度竖向游标尺（跟随横拖滑动）
    const knobX = padL + state.elevationGain * trackW;
    pCtx.strokeStyle = PALETTE.violetBadge;
    pCtx.lineWidth = 2;
    pCtx.beginPath();
    pCtx.moveTo(knobX, topY - 2);
    pCtx.lineTo(knobX, groundY + 2);
    pCtx.stroke();

    pCtx.fillStyle = PALETTE.indigoDeep;
    pCtx.beginPath();
    pCtx.arc(knobX, groundY, 7, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.fillStyle = PALETTE.limeBright;
    pCtx.beginPath();
    pCtx.arc(knobX, groundY, 3, 0, Math.PI * 2);
    pCtx.fill();

    pCtx.restore();
  }

  // 主画布交互：支持拖移卡片、拖旋转柄、点击红签纠错
  function stagePoint(e) {
    const r = stageCanvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitCard(x, y) {
    // 从最顶层卡片开始命中检测
    const topFirst = [...evalCache.rects].sort((a, b) => b.z - a.z || a.order - b.order);
    return topFirst.find((rect) => pointInConvexPoly(x, y, rect.poly)) || null;
  }

  function applyQuickFix(action, targetId) {
    if (action === "separate") {
      // 把压住别人的卡片向最近的开阔象限移开，并适度收敛倾角
      const c = state.cards[targetId];
      const targets = {
        hero: { u: 0.29, v: 0.47 },
        quote: { u: 0.67, v: 0.24 },
        power: { u: 0.78, v: 0.62 },
        less: { u: 0.42, v: 0.81 },
      };
      const t = targets[targetId];
      c.u = t.u;
      c.v = t.v;
    } else if (action === "levelTilt") {
      const c = state.cards[targetId];
      c.deg = Math.max(-5, Math.min(5, Math.round(c.deg * 0.25)));
    } else if (action === "raiseHero") {
      state.cards.hero.z = 3;
      if (state.cards.quote.z >= 3) state.cards.quote.z = 2;
      if (state.cards.power.z >= 3) state.cards.power.z = 1;
      if (state.cards.less.z >= 3) state.cards.less.z = 2;
      if (state.elevationGain < 0.42) state.elevationGain = 0.56;
    }
    syncEval();
    onChange("fix");
  }

  stageCanvas.addEventListener("pointerdown", (e) => {
    const { x, y } = stagePoint(e);
    // 1. 先检查画布直点纠错红签
    for (const box of fixHitBoxes) {
      if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
        applyQuickFix(box.action, box.targetId);
        return;
      }
    }
    // 2. 检查选中卡的角部旋转柄
    if (rotateHandle && Math.hypot(x - rotateHandle.x, y - rotateHandle.y) <= rotateHandle.r + 6) {
      const rect = evalCache.rects.find((r) => r.id === rotateHandle.id);
      if (rect) {
        dragging = {
          mode: "rotate",
          id: rect.id,
          startAngle: Math.atan2(y - rect.cy, x - rect.cx),
          startDeg: state.cards[rect.id].deg,
        };
        stageCanvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
    }
    // 3. 命中卡片直接拖拽
    const hit = hitCard(x, y);
    if (hit) {
      state.selectedId = hit.id;
      dragging = {
        mode: "card",
        id: hit.id,
        offsetX: x - hit.cx,
        offsetY: y - hit.cy,
      };
      stageCanvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      syncEval();
      onChange("select");
    }
  });

  stageCanvas.addEventListener("pointermove", (e) => {
    const { x, y } = stagePoint(e);
    if (!dragging) {
      const overFix = fixHitBoxes.some((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      const overRot = rotateHandle && Math.hypot(x - rotateHandle.x, y - rotateHandle.y) <= rotateHandle.r + 6;
      const hit = hitCard(x, y);
      hoverId = hit ? hit.id : null;
      stageCanvas.style.cursor = overFix ? "pointer" : overRot ? "grab" : hit ? "move" : "default";
      return;
    }
    if (dragging.mode === "rotate") {
      const rect = evalCache.rects.find((r) => r.id === dragging.id);
      const ang = Math.atan2(y - rect.cy, x - rect.cx);
      let deltaDeg = ((ang - dragging.startAngle) * 180) / Math.PI;
      if (deltaDeg > 180) deltaDeg -= 360;
      if (deltaDeg < -180) deltaDeg += 360;
      let next = Math.max(-24, Math.min(24, dragging.startDeg + deltaDeg));
      if (Math.abs(next) < 1.2) next = 0; // 靠近 0° 轻吸附
      state.cards[dragging.id].deg = +next.toFixed(1);
      syncEval();
      onChange("drag");
    } else if (dragging.mode === "card") {
      const padX = Math.max(18, W * 0.045);
      const padY = Math.max(16, H * 0.045);
      const usableW = Math.max(120, W - padX * 2);
      const usableH = Math.max(120, H - padY * 2);
      const nextU = (x - dragging.offsetX - padX) / usableW;
      const nextV = (y - dragging.offsetY - padY) / usableH;
      state.cards[dragging.id].u = Math.max(0.11, Math.min(0.89, +nextU.toFixed(3)));
      state.cards[dragging.id].v = Math.max(0.12, Math.min(0.88, +nextV.toFixed(3)));
      syncEval();
      onChange("drag");
    }
  });

  const endStageDrag = () => {
    if (dragging) {
      dragging = null;
      onChange("drop");
    }
  };
  stageCanvas.addEventListener("pointerup", endStageDrag);
  stageCanvas.addEventListener("pointercancel", endStageDrag);

  // 底部 Z 轴侧视浮升剖面槽交互（支持鼠标与触屏横向拖拽，含 touch-action: pan-y）
  function updateGainFromClientX(clientX) {
    const r = profileCanvas.getBoundingClientRect();
    const pad = 16;
    const next = (clientX - r.left - pad) / Math.max(40, r.width - pad * 2);
    state.elevationGain = Math.max(0, Math.min(1, +next.toFixed(3)));
    syncEval();
    onChange("gain");
  }

  profileCanvas.addEventListener("pointerdown", (e) => {
    profileDragging = true;
    profileCanvas.setPointerCapture(e.pointerId);
    updateGainFromClientX(e.clientX);
    e.preventDefault();
  });
  profileCanvas.addEventListener("pointermove", (e) => {
    if (!profileDragging) return;
    updateGainFromClientX(e.clientX);
  });
  const endProfileDrag = () => {
    profileDragging = false;
  };
  profileCanvas.addEventListener("pointerup", endProfileDrag);
  profileCanvas.addEventListener("pointercancel", endProfileDrag);

  // 兼容 touch 事件（确保 perf.mjs 派发原生 touchStart/touchMove 时百分百实时响应）
  profileCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      profileDragging = true;
      updateGainFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  profileCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (!profileDragging || !e.touches.length) return;
      updateGainFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  profileCanvas.addEventListener("touchend", endProfileDrag, { passive: true });

  // 每帧更新与绘制（仅在入场动画、拖拽或状态改变时重画，静置零空转）
  let initialized = false;
  function render(t, dt, { still }) {
    if (!initialized) {
      resize();
      initialized = true;
    }
    let liftMoving = false;
    for (const id of Object.keys(cardLift)) {
      const target = dragging && dragging.mode === "card" && dragging.id === id ? 1 : 0;
      if (still) {
        cardLift[id] = target;
      } else {
        const diff = target - cardLift[id];
        if (Math.abs(diff) > 0.005) {
          cardLift[id] += diff * Math.min(1, (dt || 0.016) * 14);
          liftMoving = true;
        } else {
          cardLift[id] = target;
        }
      }
    }
    const introProgress = still ? 1 : Math.min(1, 0.35 + t * 1.15);
    const introMoving = !still && introProgress < 1;
    const beadMoving = !still && state.showSightline && !evalCache.sightlineCross;
    if (dirty || still || introMoving || liftMoving || beadMoving) {
      drawStage(t, introProgress);
      drawProfile();
      dirty = false;
    }
    return evalCache;
  }

  return {
    resize,
    syncEval,
    render,
    markDirty: () => { dirty = true; },
    getEval: () => evalCache,
  };
}
