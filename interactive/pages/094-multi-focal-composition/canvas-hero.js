// 094 多重焦点构图 — 深空午夜蓝星图巡航编排台（2D Canvas，标 data-perf-drag）
// 1:1 承袭 094 原海报深空星场、金属月轮、6×3/3×4 紫点阵、中央同心平衡支点球、
// 原海报实裁四焦点摄影块、弯弧虚线空心箭与引注线，支持拖拽节点、拖圈调重、中心扫盘与 Space 视线巡航。

import { loop, pixelRatio } from "../../lib/stage.js";
import { getFocalCrop, onAssetsReady } from "./assets.js";
import { SCENARIOS, evaluate } from "./model.js";

function drawRegularPolygon(ctx, cx, cy, r, sides, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * Math.PI * 2) / sides;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function traceShape(ctx, shape, cx, cy, r) {
  if (shape === "hex") {
    drawRegularPolygon(ctx, cx, cy, r * 1.04, 6, 0); // 平顶六边形，1:1 还原原海报焦点 C
  } else if (shape === "square") {
    const s = r * 1.72;
    ctx.beginPath();
    ctx.roundRect(cx - s / 2, cy - s / 2, s, s, r * 0.14);
  } else if (shape === "diamond") {
    drawRegularPolygon(ctx, cx, cy, r * 1.12, 4, -Math.PI / 2);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
}

function drawFourPointStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.28;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// 渲染不同场景下的节点内部内容（海报实裁摄影 / 信息图数据 / 杂志排版）
function drawNodeArt(ctx, node, cx, cy, r, scenario, idx) {
  const c = node.contrast;
  ctx.save();
  traceShape(ctx, node.shape, cx, cy, r);
  ctx.clip();

  if (scenario === "poster") {
    const crop = getFocalCrop(node.id);
    if (crop) {
      ctx.drawImage(crop, cx - r * 1.06, cy - r * 1.06, r * 2.12, r * 2.12);
    } else {
      drawProceduralPosterNode(ctx, node.id, cx, cy, r);
    }
    // 根据用户调节的对比度实时改变压暗/提亮层次，让对比度调节肉眼可见
    if (c < 0.85) {
      const dim = (0.88 - c) * 0.88;
      ctx.fillStyle = `rgba(6, 10, 38, ${dim.toFixed(3)})`;
      ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
    } else if (c > 0.88) {
      const boost = (c - 0.85) * 0.32;
      const g = ctx.createRadialGradient(cx - r * 0.22, cy - r * 0.24, r * 0.08, cx, cy, r * 1.05);
      g.addColorStop(0, `rgba(220, 200, 255, ${boost.toFixed(3)})`);
      g.addColorStop(1, "rgba(127, 76, 248, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
    }
  } else if (scenario === "infographic") {
    drawInfographicNode(ctx, node, cx, cy, r, idx);
  } else {
    drawMagazineNode(ctx, node, cx, cy, r, idx);
  }
  ctx.restore();
}

function drawProceduralPosterNode(ctx, id, cx, cy, r) {
  const bg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  bg.addColorStop(0, "#5c3ec9");
  bg.addColorStop(0.55, "#231a66");
  bg.addColorStop(1, "#090c2e");
  ctx.fillStyle = bg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  if (id === "A") {
    ctx.fillStyle = "#c8b6ff";
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r * 0.85);
    ctx.lineTo(cx - r * 0.12, cy - r * 0.45);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.1);
    ctx.lineTo(cx + r * 0.65, cy - r * 0.2);
    ctx.lineTo(cx + r, cy + r * 0.85);
    ctx.closePath();
    ctx.fill();
  } else if (id === "B") {
    ctx.fillStyle = "#e8e3ff";
    ctx.fillRect(cx - r * 0.14, cy - r * 0.35, r * 0.28, r * 1.05);
    const beam = ctx.createRadialGradient(cx, cy - r * 0.35, 2, cx, cy - r * 0.35, r * 0.72);
    beam.addColorStop(0, "rgba(255, 244, 210, 0.95)");
    beam.addColorStop(1, "rgba(127, 76, 248, 0)");
    ctx.fillStyle = beam;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  } else if (id === "C") {
    ctx.fillStyle = "#b8a0ff";
    const bars = [-0.62, -0.34, -0.06, 0.22, 0.48];
    const hs = [0.65, 1.05, 0.8, 0.92, 0.58];
    bars.forEach((bx, i) => {
      ctx.fillRect(cx + bx * r, cy + r * 0.4 - hs[i] * r * 0.75, r * 0.2, hs[i] * r * 0.75);
    });
  } else {
    ctx.strokeStyle = "rgba(196, 174, 255, 0.7)";
    ctx.lineWidth = Math.max(2, r * 0.08);
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(cx - r, cy + k * r * 0.28);
      ctx.bezierCurveTo(cx - r * 0.3, cy + (k - 1.2) * r * 0.28, cx + r * 0.3, cy + (k + 1.2) * r * 0.28, cx + r, cy + k * r * 0.24);
      ctx.stroke();
    }
  }
}

function drawInfographicNode(ctx, node, cx, cy, r, idx) {
  const c = node.contrast;
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, `rgba(${Math.round(35 + c * 62)}, ${Math.round(28 + c * 42)}, ${Math.round(92 + c * 98)}, 1)`);
  g.addColorStop(1, "#090f35");
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);

  const fg = `rgba(242, 238, 255, ${(0.38 + c * 0.62).toFixed(2)})`;
  const hi = `rgba(164, 104, 250, ${(0.45 + c * 0.55).toFixed(2)})`;

  if (idx === 0) {
    // KPI 圆环
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = Math.max(5, r * 0.14);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = fg;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.56, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.36);
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.font = `700 ${Math.max(12, Math.round(r * 0.36))}px "Manrope", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("68%", cx, cy);
  } else if (idx === 1) {
    // 趋势曲线
    ctx.strokeStyle = hi;
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.beginPath();
    const pts = [[-0.65, 0.3], [-0.35, 0.05], [-0.08, 0.18], [0.22, -0.25], [0.58, -0.38]];
    pts.forEach(([px, py], k) => (k === 0 ? ctx.moveTo(cx + px * r, cy + py * r) : ctx.lineTo(cx + px * r, cy + py * r)));
    ctx.stroke();
    ctx.fillStyle = fg;
    pts.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(cx + px * r, cy + py * r, Math.max(2.5, r * 0.07), 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (idx === 2) {
    // 柱状矩阵
    const hs = [0.42, 0.78, 0.58, 0.92, 0.65];
    const bw = r * 0.18;
    hs.forEach((h, i) => {
      ctx.fillStyle = i === 3 ? fg : hi;
      ctx.fillRect(cx + (i - 2) * bw * 1.35 - bw / 2, cy + r * 0.42 - h * r * 0.78, bw, h * r * 0.78);
    });
  } else {
    // 微缩点阵注脚
    for (let gy = -2; gy <= 2; gy++) {
      for (let gx = -2; gx <= 2; gx++) {
        ctx.fillStyle = (gx + gy) % 2 === 0 ? fg : hi;
        ctx.beginPath();
        ctx.arc(cx + gx * r * 0.24, cy + gy * r * 0.24, Math.max(2, r * 0.06), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawMagazineNode(ctx, node, cx, cy, r, idx) {
  const c = node.contrast;
  if (idx === 0 || idx === 2) {
    const crop = getFocalCrop(idx === 0 ? "A" : "C");
    if (crop) {
      ctx.drawImage(crop, cx - r * 1.08, cy - r * 1.08, r * 2.16, r * 2.16);
    } else {
      drawProceduralPosterNode(ctx, idx === 0 ? "A" : "C", cx, cy, r);
    }
    if (c < 0.85) {
      ctx.fillStyle = `rgba(6, 10, 38, ${((0.88 - c) * 0.82).toFixed(2)})`;
      ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
    }
    // 杂志页码条
    ctx.fillStyle = "rgba(4, 8, 36, 0.72)";
    ctx.fillRect(cx - r * 0.9, cy + r * 0.42, r * 1.8, r * 0.36);
    ctx.fillStyle = "#f4f2fc";
    ctx.font = `600 ${Math.max(9, Math.round(r * 0.19))}px "Unbounded", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(idx === 0 ? "ISSUE 094" : "PLATE 03", cx, cy + r * 0.6);
  } else if (idx === 1) {
    ctx.fillStyle = `rgba(${Math.round(52 + c * 40)}, ${Math.round(38 + c * 32)}, ${Math.round(122 + c * 70)}, 1)`;
    ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
    ctx.fillStyle = `rgba(246, 244, 255, ${(0.45 + c * 0.55).toFixed(2)})`;
    ctx.font = `italic 400 ${Math.max(12, Math.round(r * 0.32))}px "Fraunces", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("“Order", cx, cy - r * 0.14);
    ctx.fillText("in motion”", cx, cy + r * 0.22);
  } else {
    ctx.fillStyle = "#171746";
    ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
    ctx.fillStyle = `rgba(181, 156, 255, ${(0.42 + c * 0.52).toFixed(2)})`;
    for (let k = 0; k < 4; k++) {
      ctx.fillRect(cx - r * 0.52, cy - r * 0.36 + k * r * 0.24, r * (k === 3 ? 0.64 : 1.04), Math.max(2, r * 0.08));
    }
  }
}

export function mountHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let W = 900;
  let H = 500;
  let dpr = 1;
  let bgCache = null;
  let dirty = true;
  let introProgress = 0;
  let evalCache = null;

  // 拖拽状态
  let dragMode = null; // "node" | "resize" | "sweep"
  let dragIdx = -1;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragSnapshot = null;

  function buildBackgroundCache() {
    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.round(W * dpr));
    off.height = Math.max(1, Math.round(H * dpr));
    const g = off.getContext("2d");
    g.scale(dpr, dpr);

    // 1:1 原海报深空午夜蓝背景 + 柔紫微光晕
    const rad = g.createRadialGradient(W * 0.54, H * 0.44, 12, W * 0.52, H * 0.48, Math.max(W, H) * 0.78);
    rad.addColorStop(0, "#0b1246");
    rad.addColorStop(0.55, "#03092e");
    rad.addColorStop(1, "#01051e");
    g.fillStyle = rad;
    g.fillRect(0, 0, W, H);

    // 细微星图底格
    g.strokeStyle = "rgba(138, 120, 232, 0.055)";
    g.lineWidth = 1;
    const step = Math.max(36, Math.round(Math.min(W, H) / 10));
    for (let x = step; x < W; x += step) {
      g.beginPath();
      g.moveTo(x + 0.5, 0);
      g.lineTo(x + 0.5, H);
      g.stroke();
    }
    for (let y = step; y < H; y += step) {
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(W, y + 0.5);
      g.stroke();
    }

    // 右上角原海报金属灰紫球体 + 细轨弧
    const mR = Math.min(W, H) * 0.082;
    const mX = W - mR * 0.62;
    const mY = mR * 1.15;
    const mg = g.createLinearGradient(mX - mR, mY - mR, mX + mR, mY + mR);
    mg.addColorStop(0, "rgba(130, 128, 168, 0.52)");
    mg.addColorStop(1, "rgba(22, 26, 58, 0.22)");
    g.fillStyle = mg;
    g.beginPath();
    g.arc(mX, mY, mR, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(164, 146, 240, 0.22)";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(mX, mY, mR * 1.24, 0, Math.PI * 2);
    g.stroke();

    // 左下角原海报紫色星弧装饰点阵（5×3 与 3×4）
    const drawDotGrid = (ox, oy, cols, rows, gap, radDot, color) => {
      g.fillStyle = color;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          g.beginPath();
          g.arc(ox + c * gap, oy + r * gap, radDot, 0, Math.PI * 2);
          g.fill();
        }
      }
    };
    if (W > 460) {
      drawDotGrid(W * 0.44, H * 0.14, 5, 3, 10, 1.8, "rgba(164, 128, 250, 0.42)");
      drawDotGrid(W * 0.54, H * 0.45, 3, 4, 11, 2.2, "rgba(148, 102, 248, 0.52)");
      drawDotGrid(W * 0.14, H * 0.64, 6, 3, 9, 1.3, "rgba(155, 138, 224, 0.30)");
    }

    // 右下角细波纹线（呼应原海报焦点 C 下方波浪）
    g.strokeStyle = "rgba(124, 104, 214, 0.18)";
    g.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      const baseY = H - 24 - k * 9;
      for (let i = 0; i <= 24; i++) {
        const px = W * 0.72 + (W * 0.24 * i) / 24;
        const py = baseY + Math.sin(i * 0.9) * 4.5;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }

    // 中央基准同心轨道（平衡安全区）
    const cx = W * 0.5;
    const cy = H * 0.5;
    const safeR = Math.min(W, H) * 0.14;
    [safeR, safeR * 1.75, safeR * 2.5].forEach((rr, idx) => {
      g.strokeStyle = idx === 0 ? "rgba(164, 132, 255, 0.22)" : "rgba(140, 122, 228, 0.09)";
      g.lineWidth = idx === 0 ? 1.15 : 1;
      g.setLineDash(idx === 0 ? [4, 5] : []);
      g.beginPath();
      g.arc(cx, cy, rr, 0, Math.PI * 2);
      g.stroke();
    });
    g.setLineDash([]);

    bgCache = off;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(280, Math.round(rect.width));
    const nh = Math.max(260, Math.round(rect.height));
    const targetDpr = nw <= 480 ? pixelRatio(1.5) : pixelRatio(2);
    if (nw === W && nh === H && targetDpr === dpr && bgCache) return;
    W = nw;
    H = nh;
    dpr = targetDpr;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    buildBackgroundCache();
    dirty = true;
  }

  function nodePixel(nd) {
    const shortSide = Math.min(W, H);
    return {
      x: nd.u * W,
      y: nd.v * H,
      r: nd.size * shortSide,
    };
  }

  // 绘制两点间的优雅弯弧虚线 + 原海报风格空心尖箭头
  function drawSightline(p1, p2, idx, isCrossed, isLoopClosing) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < p1.r + p2.r + 12) return null;

    const ux = dx / dist;
    const uy = dy / dist;
    const sx = p1.x + ux * (p1.r + 10);
    const sy = p1.y + uy * (p1.r + 10);
    const ex = p2.x - ux * (p2.r + 10);
    const ey = p2.y - uy * (p2.r + 10);

    // 垂直中点弯弧控制点，让路线像原海报一样带星轨弧度（回环末段向外缘兜回，绝不横切中腹）
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    let cpx, cpy;
    if (isLoopClosing) {
      cpx = mx >= W * 0.5 ? Math.min(W - 22, mx + W * 0.24) : Math.max(22, mx - W * 0.24);
      cpy = my >= H * 0.5 ? Math.min(H - 22, my + H * 0.22) : Math.max(22, my - H * 0.22);
    } else {
      const bendSign = idx % 2 === 0 ? -1 : 1;
      const bend = (isCrossed ? 0 : Math.min(44, dist * 0.14)) * bendSign;
      cpx = mx - uy * bend;
      cpy = my + ux * bend;
    }

    ctx.save();
    ctx.strokeStyle = isCrossed
      ? "rgba(255, 107, 123, 0.88)"
      : isLoopClosing
        ? "rgba(181, 156, 255, 0.45)"
        : "rgba(218, 208, 255, 0.72)";
    ctx.lineWidth = isCrossed ? 2.2 : isLoopClosing ? 1.35 : 1.85;
    ctx.setLineDash(isCrossed ? [7, 5] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);

    // 曲线中点绘制空心尖箭头（1:1 致敬原海报的空心三角箭）
    const t = 0.52;
    const ax = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cpx + t * t * ex;
    const ay = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cpy + t * t * ey;
    const tx = 2 * (1 - t) * (cpx - sx) + 2 * t * (ex - cpx);
    const ty = 2 * (1 - t) * (cpy - sy) + 2 * t * (ey - cpy);
    const ang = Math.atan2(ty, tx);

    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = "#03092e";
    ctx.strokeStyle = isCrossed ? "#ff6b7b" : "#e8e2ff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, -6.5);
    ctx.lineTo(-3.5, 0);
    ctx.lineTo(-7, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    return { sx, sy, cpx, cpy, ex, ey };
  }

  function render(t, dt, { still }) {
    resize();

    // 开场优雅淡入（0.9 秒截图与第一帧均好看完整；reduced-motion 直接到位）
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.9);
    }

    // 视线巡航动画推进
    if (state.scanActive) {
      if (still) {
        state.scanProgress = 0.65;
      } else {
        state.scanProgress += Math.max(dt, 0.016) * 0.24;
        if (state.scanProgress >= 1) {
          state.scanActive = false;
          state.scanProgress = 0;
        }
      }
      dirty = true;
    }

    if (!dirty && introProgress >= 1 && !state.scanActive) return;
    dirty = false;

    const ev = evaluate(state, W / H);
    evalCache = ev;
    const compact = W < 540;
    const ease = 1 - (1 - introProgress) ** 3;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 静态星场缓存
    if (bgCache) ctx.drawImage(bgCache, 0, 0, W, H);

    // 2. 中央平衡支点球与真实重心偏离矢量
    if (state.showGuides) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      const gx = ev.fulcrum.u * W;
      const gy = ev.fulcrum.v * H;
      const tilted = ev.fulcrum.offset > 0.135;

      // 细十字坐标轴（从画幅中心延展）
      ctx.strokeStyle = "rgba(154, 136, 240, 0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(cx - Math.min(W, H) * 0.26, cy);
      ctx.lineTo(cx + Math.min(W, H) * 0.26, cy);
      ctx.moveTo(cx, cy - Math.min(W, H) * 0.26);
      ctx.lineTo(cx, cy + Math.min(W, H) * 0.26);
      ctx.stroke();
      ctx.setLineDash([]);

      // 中心到真实重心的拉偏连线
      ctx.strokeStyle = tilted ? "rgba(255, 107, 123, 0.82)" : "rgba(86, 232, 184, 0.65)";
      ctx.lineWidth = tilted ? 1.8 : 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      // 真实银紫平衡支点球（致敬 094 原海报正中的立体微球）
      const orbR = compact ? 9 : 11;
      const og = ctx.createRadialGradient(gx - orbR * 0.3, gy - orbR * 0.3, 1, gx, gy, orbR);
      if (tilted) {
        og.addColorStop(0, "#ffd0d6");
        og.addColorStop(0.55, "#ff6b7b");
        og.addColorStop(1, "#5c1322");
      } else {
        og.addColorStop(0, "#ffffff");
        og.addColorStop(0.55, "#a7a4cf");
        og.addColorStop(1, "#1c1f4a");
      }
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(gx, gy, orbR, 0, Math.PI * 2);
      ctx.fill();

      // 支点标注胶囊（置底深蓝胶囊防遮挡，自动避开下方节点）
      const fLabel = tilted ? `重心${ev.fulcrum.dir} ${Math.round(ev.fulcrum.offset * 100)}%` : `平衡支点 · 偏 ${Math.round(ev.fulcrum.offset * 100)}%`;
      ctx.font = `600 ${compact ? 10 : 11}px "Manrope", "Noto Sans SC", sans-serif`;
      const fW = ctx.measureText(fLabel).width + 14;
      const fH = 19;
      const fY = gy > H * 0.52 ? gy - orbR - 14 : gy + orbR + 14;
      const fX = Math.max(fW / 2 + 8, Math.min(W - fW / 2 - 8, gx));
      ctx.save();
      ctx.fillStyle = "rgba(3, 8, 36, 0.92)";
      ctx.strokeStyle = tilted ? "rgba(255, 126, 141, 0.75)" : "rgba(86, 232, 184, 0.65)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(fX - fW / 2, fY - fH / 2, fW, fH, 99);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = tilted ? "#ffb3bc" : "#9ff5d6";
      ctx.fillText(fLabel, fX, fY + 0.5);
      ctx.restore();
    }

    // 3. 路径弯弧虚线 + 交叉红叉预警
    const pixelNodes = state.nodes.map(nodePixel);
    const drawnCurves = [];
    const crossSet = new Set();
    ev.crossings.forEach((c) => {
      crossSet.add(c.s1);
      crossSet.add(c.s2);
    });

    for (let i = 0; i < ev.segments.length; i++) {
      const seg = ev.segments[i];
      const p1 = pixelNodes[seg.from];
      const p2 = pixelNodes[seg.to];
      const isClosing = state.pathMode === "loop" && i === ev.segments.length - 1;
      const curve = drawSightline(p1, p2, i, crossSet.has(i), isClosing);
      if (curve) drawnCurves.push({ ...curve, from: seg.from, to: seg.to });
    }

    // 交叉点标注矢量红叉（不依赖特殊字体字形，全平台清晰锐利）
    for (const cr of ev.crossings) {
      const ix = cr.u * W;
      const iy = cr.v * H;
      ctx.save();
      ctx.fillStyle = "#be1e38";
      ctx.strokeStyle = "#ffd6dc";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ix, iy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ix - 4.2, iy - 4.2);
      ctx.lineTo(ix + 4.2, iy + 4.2);
      ctx.moveTo(ix + 4.2, iy - 4.2);
      ctx.lineTo(ix - 4.2, iy + 4.2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 逐枚绘制焦点节点（外虚线环 + 实裁图/情景图 + 紫色几何徽章 + 原海报折线引注）
    const overlapSet = new Set();
    ev.overlaps.forEach((o) => {
      overlapSet.add(o.a);
      overlapSet.add(o.b);
    });
    const clipSet = new Set(ev.edgeClips.map((e) => e.idx));
    const scInfo = SCENARIOS[state.scenario] || SCENARIOS.poster;

    for (let i = 0; i < state.nodes.length; i++) {
      const nd = state.nodes[i];
      const p = pixelNodes[i];
      const r = p.r * (0.86 + 0.14 * ease);
      const isSel = i === state.selected;
      const isTop = i === ev.top.idx && ev.ladderRatio >= 1.24;
      const hasWarn = overlapSet.has(i) || clipSet.has(i);
      const sharePct = Math.round(ev.shares[i] * 100);

      // 外围微弱紫辉（随对比度增强）
      if (nd.contrast > 0.72) {
        const glow = ctx.createRadialGradient(p.x, p.y, r * 0.7, p.x, p.y, r * 1.42);
        glow.addColorStop(0, `rgba(127, 76, 248, ${((nd.contrast - 0.6) * 0.42).toFixed(3)})`);
        glow.addColorStop(1, "rgba(127, 76, 248, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.42, 0, Math.PI * 2);
        ctx.fill();
      }

      // 节点主体画面
      drawNodeArt(ctx, nd, p.x, p.y, r, state.scenario, i);

      // 主体细亮内描边
      ctx.save();
      traceShape(ctx, nd.shape, p.x, p.y, r);
      ctx.strokeStyle = hasWarn
        ? "#ff6b7b"
        : isSel
          ? "#e5dcff"
          : `rgba(196, 178, 255, ${(0.35 + nd.contrast * 0.5).toFixed(2)})`;
      ctx.lineWidth = isSel ? 2.2 : 1.3;
      ctx.stroke();

      // 外层虚线轨道环（1:1 复刻原海报每枚焦点外的精细点虚环，也是缩放拖拽区）
      traceShape(ctx, nd.shape, p.x, p.y, r + (compact ? 7 : 10));
      ctx.strokeStyle = hasWarn
        ? "rgba(255, 107, 123, 0.9)"
        : isSel
          ? "rgba(181, 156, 255, 0.95)"
          : "rgba(218, 208, 255, 0.46)";
      ctx.lineWidth = isSel ? 1.7 : 1.15;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 节点专属紫色装饰徽章（A 四芒星、B 紫圆、C 紫六边形、D 紫方块）
      const badgeAngle = i % 2 === 0 ? -Math.PI * 0.22 : -Math.PI * 0.78;
      const bx = p.x + Math.cos(badgeAngle) * (r + (compact ? 6 : 9));
      const by = p.y + Math.sin(badgeAngle) * (r + (compact ? 6 : 9));
      const br = Math.max(6, Math.min(13, r * 0.2));
      ctx.save();
      ctx.fillStyle = hasWarn ? "#ff6b7b" : isTop ? "#9c6bff" : "#7141ea";
      if (nd.badge === "star") {
        drawFourPointStar(ctx, bx, by, br * 1.25);
        ctx.fill();
      } else if (nd.badge === "hex") {
        drawRegularPolygon(ctx, bx, by, br * 1.05, 6, 0);
        ctx.fill();
      } else if (nd.badge === "square") {
        ctx.fillRect(bx - br * 0.8, by - br * 0.8, br * 1.6, br * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(bx, by, br * 0.88, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 节点编号与权重占比徽标（始终清晰可读，且在桌面端附原海报风格折线引注）
      const labelBgW = compact ? 44 : 52;
      const labelBgH = compact ? 18 : 20;
      const lx = p.x;
      const ly = p.y + r + (compact ? 14 : 18);
      const clampedLy = Math.min(H - 14, ly);

      ctx.save();
      ctx.fillStyle = isSel ? "#4b37a2" : "rgba(5, 10, 42, 0.86)";
      ctx.strokeStyle = hasWarn ? "#ff6b7b" : isSel ? "#c7b2ff" : "rgba(164, 132, 255, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(lx - labelBgW / 2, clampedLy - labelBgH / 2, labelBgW, labelBgH, 99);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f4f2fc";
      ctx.font = `700 ${compact ? 10 : 11}px "Manrope", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${nd.id} ${sharePct}%`, lx, clampedLy + 0.5);
      ctx.restore();

      // 桌面宽屏绘制原海报同款细紫折线引注（自动检测空白外侧且与其它焦点/支点零碰撞才绘制）
      if (!compact && W >= 780 && i < 4) {
        const trySide = (dir) => {
          const x0 = p.x + dir * (r + 10);
          const y0 = p.y - r * 0.2;
          const x1 = x0 + dir * 18;
          const y1 = Math.max(46, Math.min(H - 42, y0 - 10));
          const x2 = x1 + dir * 24;
          const textBoxX0 = dir > 0 ? x2 + 4 : x2 - 96;
          const textBoxX1 = dir > 0 ? x2 + 96 : x2 - 4;
          if (textBoxX0 < 14 || textBoxX1 > W - 14) return null;
          const boxCx = (textBoxX0 + textBoxX1) / 2;
          const boxCy = y1 + 6;
          // 碰撞检测：绝不压在任何焦点或平衡支点上
          for (let j = 0; j < pixelNodes.length; j++) {
            const o = pixelNodes[j];
            if (Math.abs(boxCx - o.x) < o.r + 56 && Math.abs(boxCy - o.y) < o.r + 28) return null;
          }
          if (state.showGuides) {
            const gx = ev.fulcrum.u * W;
            const gy = ev.fulcrum.v * H;
            if (Math.abs(boxCx - gx) < 76 && Math.abs(boxCy - gy) < 38) return null;
          }
          return { dir, x0, y0, x1, y1, x2 };
        };

        const prefDir = p.x >= W * 0.45 ? 1 : -1;
        const placed = trySide(prefDir) || trySide(-prefDir);
        if (placed) {
          const { dir, x0, y0, x1, y1, x2 } = placed;
          const meta = scInfo.nodeNames[nd.id] || { title: `焦点 ${nd.id}`, sub: "" };

          ctx.save();
          ctx.strokeStyle = isSel ? "rgba(210, 194, 255, 0.85)" : "rgba(150, 120, 237, 0.52)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y1);
          ctx.stroke();

          ctx.fillStyle = isSel ? "#ffffff" : "#b59cff";
          ctx.beginPath();
          ctx.arc(x2, y1, 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.textAlign = dir > 0 ? "left" : "right";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isSel ? "#ffffff" : "#c6b2ff";
          ctx.font = `700 12px "Noto Sans SC", sans-serif`;
          ctx.fillText(meta.title, x2 + dir * 7, y1);
          ctx.fillStyle = "rgba(208, 203, 240, 0.82)";
          ctx.font = `400 11px "Noto Sans SC", sans-serif`;
          ctx.fillText(meta.sub, x2 + dir * 7, y1 + 16);
          ctx.restore();
        }
      }
    }

    // 5. 视线巡航流光轨迹（按 Space 触发，完全由 model.js 的 scanOrder 与权重驱动）
    if (state.scanActive && ev.scanOrder.length >= 2) {
      const seq = ev.scanOrder;
      const segTotal = seq.length - 1;
      const posF = Math.min(segTotal - 0.0001, state.scanProgress * segTotal);
      const segIdx = Math.floor(posF);
      const localT = posF - segIdx;
      const aNode = pixelNodes[seq[segIdx]];
      const bNode = pixelNodes[seq[segIdx + 1]];

      // 已经走过的注视点保留脉冲光环
      for (let k = 0; k <= segIdx; k++) {
        const pn = pixelNodes[seq[k]];
        const pulse = 1 + 0.12 * Math.sin(t * 6 + k);
        ctx.save();
        ctx.strokeStyle = ev.allPass ? "rgba(86, 232, 184, 0.85)" : "rgba(255, 204, 102, 0.85)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(pn.x, pn.y, pn.r * 0.48 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = ev.allPass ? "#56e8b8" : "#ffcc66";
        ctx.font = `700 12px "Unbounded", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(k + 1), pn.x, pn.y);
        ctx.restore();
      }

      // 当前飞驰中的视线彗星
      if (aNode && bNode) {
        const easeT = localT < 0.5 ? 2 * localT * localT : 1 - (-2 * localT + 2) ** 2 / 2;
        const gx = aNode.x + (bNode.x - aNode.x) * easeT;
        const gy = aNode.y + (bNode.y - aNode.y) * easeT;
        const comet = ctx.createRadialGradient(gx, gy, 2, gx, gy, 22);
        comet.addColorStop(0, "#ffffff");
        comet.addColorStop(0.4, ev.allPass ? "rgba(86, 232, 184, 0.9)" : "rgba(255, 107, 123, 0.9)");
        comet.addColorStop(1, "rgba(127, 76, 248, 0)");
        ctx.fillStyle = comet;
        ctx.beginPath();
        ctx.arc(gx, gy, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. 画布角落单真源紧凑标尺（右上状态徽章 + 左上操作提示）
    ctx.save();
    ctx.font = `600 ${compact ? 10 : 11}px "Manrope", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    const hudText = `主次比 ${ev.ladderRatio.toFixed(2)}× · 重心偏 ${Math.round(ev.fulcrum.offset * 100)}% · ${ev.count} 焦`;
    const hudW = ctx.measureText(hudText).width + 20;
    ctx.fillStyle = "rgba(3, 8, 36, 0.78)";
    ctx.strokeStyle = "rgba(164, 132, 255, 0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(12, 12, hudW, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d8d2f8";
    ctx.textAlign = "left";
    ctx.fillText(hudText, 22, 24);

    // 右上角通过状态胶囊
    const statusText = ev.diagnosis.badge;
    const stW = ctx.measureText(statusText).width + 20;
    ctx.fillStyle = ev.allPass ? "rgba(13, 122, 92, 0.9)" : "rgba(180, 32, 60, 0.9)";
    ctx.beginPath();
    ctx.roundRect(W - stW - 12, 12, stW, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(statusText, W - stW / 2 - 12, 24);

    // 底部极细一行交互指引
    ctx.fillStyle = "rgba(186, 178, 232, 0.78)";
    ctx.font = `400 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      compact ? "拖焦点移位 · 中央横拖扫星轨 · Space 巡航" : "直接拖拽焦点 A/B/C/D 调重心配衡 · 拖外圈调大小 · 中央星场横拖扫动星轨 · 方向键微调 · Space 视线巡航",
      W * 0.5,
      H - 12
    );
    ctx.restore();

    ctx.restore();
  }

  // 指针命中判定
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTest(x, y) {
    const pixelNodes = state.nodes.map(nodePixel);
    // 先查是否点到节点内部（从选中节点优先）
    const order = [state.selected, ...state.nodes.map((_, i) => i).filter((i) => i !== state.selected)];
    for (const i of order) {
      if (i < 0 || i >= pixelNodes.length) continue;
      const p = pixelNodes[i];
      const d = Math.hypot(x - p.x, y - p.y);
      if (d <= p.r * 0.96) return { mode: "node", idx: i };
      if (d <= p.r + 16 && d > p.r * 0.96) return { mode: "resize", idx: i };
    }
    return { mode: "sweep", idx: -1 };
  }

  // 避免鼠标/指针与原生 touch 事件在触屏仿真（如 perf.mjs）中重复触发
  let usingTouch = false;

  function onPointerDown(e) {
    if (e.pointerType === "touch" || usingTouch) return;
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    startDrag(e.clientX, e.clientY, e.pointerId);
  }

  function startDrag(clientX, clientY, pointerId) {
    const { x, y } = getCanvasCoords({ clientX, clientY });
    const hit = hitTest(x, y);
    dragMode = hit.mode;
    dragIdx = hit.idx;
    dragStartX = x;
    dragStartY = y;
    dragSnapshot = state.nodes.map((n) => ({ ...n }));
    if (hit.idx >= 0) {
      state.selected = hit.idx;
      dirty = true;
      onChange("select");
    }
    if (pointerId !== undefined && canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(pointerId);
      } catch {}
    }
    canvas.style.cursor = dragMode === "resize" ? "nwse-resize" : "grabbing";
  }

  function onPointerMove(e) {
    if (e.pointerType === "touch" || usingTouch) return;
    moveDrag(e.clientX, e.clientY);
  }

  function moveDrag(clientX, clientY) {
    const { x, y } = getCanvasCoords({ clientX, clientY });
    if (!dragMode) {
      const hit = hitTest(x, y);
      canvas.style.cursor = hit.mode === "node" ? "grab" : hit.mode === "resize" ? "nwse-resize" : "ew-resize";
      return;
    }

    if (dragMode === "node" && dragIdx >= 0) {
      const nd = state.nodes[dragIdx];
      nd.u = Math.max(0.08, Math.min(0.92, x / W));
      nd.v = Math.max(0.11, Math.min(0.89, y / H));
    } else if (dragMode === "resize" && dragIdx >= 0) {
      const nd = state.nodes[dragIdx];
      const p = nodePixel(nd);
      const shortSide = Math.min(W, H);
      const dist = Math.hypot(x - p.x, y - p.y);
      nd.size = Math.max(0.055, Math.min(0.175, dist / shortSide));
    } else if (dragMode === "sweep" && dragSnapshot) {
      // 在中央星场横拖：平滑旋转整组星图，触屏横拖与性能测试流畅响应
      const dxNorm = (x - dragStartX) / Math.max(180, W * 0.52);
      const ang = dxNorm * 1.2;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      const n = dragSnapshot.length;
      for (let i = 0; i < n; i++) {
        const base = dragSnapshot[i];
        const rx = base.u - 0.5;
        const ry = base.v - 0.5;
        const nu = 0.5 + rx * cos - ry * sin * 0.72;
        const nv = 0.5 + rx * sin * 0.72 + ry * cos;
        state.nodes[i].u = Math.max(0.09, Math.min(0.91, nu));
        state.nodes[i].v = Math.max(0.12, Math.min(0.88, nv));
      }
      state.sweepPhase = ang;
    }
    dirty = true;
    onChange("drag");
  }

  function onPointerUp(e) {
    if (e.pointerType === "touch") return;
    endDrag(e.pointerId);
  }

  function endDrag(pointerId) {
    if (!dragMode) return;
    if (pointerId !== undefined && canvas.releasePointerCapture) {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch {}
    }
    dragMode = null;
    dragIdx = -1;
    dragSnapshot = null;
    canvas.style.cursor = "grab";
  }

  // 原生 Touch 通道（兼顾真实手机触屏与 CDP dispatchTouchEvent，横拖扫盘同时保留竖滑滚页）
  function onTouchStart(e) {
    if (!e.touches.length) return;
    usingTouch = true;
    const t0 = e.touches[0];
    startDrag(t0.clientX, t0.clientY, undefined);
  }
  function onTouchMove(e) {
    if (!e.touches.length || !dragMode) return;
    const t0 = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const dx = Math.abs(t0.clientX - rect.left - dragStartX);
    const dy = Math.abs(t0.clientY - rect.top - dragStartY);
    if (dragMode !== "sweep" || dx > dy * 0.75) e.preventDefault();
    moveDrag(t0.clientX, t0.clientY);
  }
  function onTouchEnd() {
    endDrag(undefined);
    setTimeout(() => { usingTouch = false; }, 120);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  const ctrl = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  onAssetsReady(() => {
    dirty = true;
    ctrl.draw();
  });

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
    getEval() {
      return evalCache || evaluate(state, W / H);
    },
    getAspect() {
      return W / Math.max(1, H);
    },
  };
}
