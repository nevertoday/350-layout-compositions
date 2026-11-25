import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  PRESETS,
  POSTER_POINTS,
  HISTORY_ERAS,
  SIMPLIFY_LEVELS,
  SCENARIO_CARDS,
  QUIZ_ITEMS,
  LOGICAL_W,
  LOGICAL_H,
  clamp,
  evaluateLayout,
  scanlineIntervals,
} from "./model.js";

// ======================================================
// 工具函数：平滑闭合路径绘制（Catmull-Rom 转三次贝塞尔）
// ======================================================
function traceSmoothClosed(ctx, pts) {
  const n = pts.length;
  if (n < 3) return;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    if (i === 0) ctx.moveTo(p1[0], p1[1]);
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
  }
  ctx.closePath();
}

function tracePolyClosed(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawArrowhead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.7, -size * 0.62);
  ctx.lineTo(-size * 0.38, 0);
  ctx.lineTo(-size * 0.7, size * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ======================================================
// 开场主角玩具：活体有机绕排排版台
// ======================================================
const state = { ...INITIAL_STATE };
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

// 根据实际 CSS 尺寸自动匹配无变形逻辑坐标系（桌面宽幅 / 手机竖屏 / 横屏）
function getLogicalDims(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 960;
  const h = rect.height || 380;
  const ar = w / Math.max(1, h);
  if (ar < 1.15) return { w: 540, h: Math.round(540 / Math.max(0.7, ar)) };
  if (ar < 1.75) return { w: 760, h: Math.round(760 / ar) };
  return { w: LOGICAL_W, h: LOGICAL_H };
}

let cachedEval = null;
let dragMode = null; // "figure" | "margin" | null
let dragStart = null;
let pointerHover = null;
let heroDirty = true;
let needsUiSync = true;
let lastUiSyncTs = 0;

// 离屏缓存有机主体贴图：拖动平移时直接 drawImage，免去每帧 clip + 多层贝塞尔重绘
const artCache = { key: "", canvas: null, pad: 8 };

function recompute() {
  const dims = getLogicalDims(heroCanvas);
  cachedEval = evaluateLayout(state, dims);
  heroDirty = true;
  needsUiSync = true;
  return cachedEval;
}

// 绘制三种主题核心图形（严禁画人脸五官细节；1:1 承袭原海报山月波浪质感，带离屏缓存加速拖动）
function drawThemeArtwork(ctx, ev, reveal, scaleX) {
  const { cx, cy, rx, ry, shapePoly, shapeBounds } = ev.figure;
  const tId = ev.state.theme;
  const revBucket = reveal >= 0.99 ? 10 : Math.round(reveal * 10);
  const resScale = clamp(scaleX, 1, 2);
  const pad = artCache.pad;
  const key = `${tId}|${ev.state.wrapMode}|${Math.round(rx * 2)}|${Math.round(ry * 2)}|${revBucket}|${resScale.toFixed(2)}`;

  if (artCache.key !== key) {
    const w = Math.ceil((shapeBounds.w + pad * 2) * resScale);
    const h = Math.ceil((shapeBounds.h + pad * 2) * resScale);
    const off = artCache.canvas || document.createElement("canvas");
    off.width = Math.max(1, w);
    off.height = Math.max(1, h);
    const octx = off.getContext("2d");
    octx.setTransform(resScale, 0, 0, resScale, (pad - shapeBounds.minX) * resScale, (pad - shapeBounds.minY) * resScale);
    paintThemeArtworkDirect(octx, ev, revBucket / 10);
    artCache.canvas = off;
    artCache.key = key;
  }

  ctx.drawImage(
    artCache.canvas,
    shapeBounds.minX - pad,
    shapeBounds.minY - pad,
    shapeBounds.w + pad * 2,
    shapeBounds.h + pad * 2
  );
}

function paintThemeArtworkDirect(ctx, ev, reveal) {
  const { cx, cy, rx, ry, shapePoly } = ev.figure;
  const tId = ev.state.theme;

  ctx.save();
  if (ev.state.wrapMode === "concave") tracePolyClosed(ctx, shapePoly);
  else traceSmoothClosed(ctx, shapePoly);
  ctx.clip();

  if (tId === "poster") {
    // 1:1 承袭 158 原海报：深冷杉青绿天穹 + 暖砂月轮 + 深梅紫浪 + 陶土玫瑰粉浪 + 细白流线
    ctx.fillStyle = "#165156";
    ctx.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4);

    // 柔和暗影层增强质地
    ctx.fillStyle = "#114348";
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.25, cy - ry * 0.45, rx * 0.9, ry * 0.55, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // 暖砂月轮
    const moonR = Math.min(rx, ry) * 0.46 * (0.82 + 0.18 * reveal);
    const moonX = cx + rx * 0.08;
    const moonY = cy - ry * 0.08;
    ctx.fillStyle = "#DFC6AA";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#EAD6BE";
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.14, moonY - moonR * 0.14, moonR * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // 细浅青色波线
    ctx.strokeStyle = "rgba(243, 224, 201, 0.58)";
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 2; k++) {
      const dy = k * ry * 0.08;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 1.1, cy + ry * 0.12 + dy);
      ctx.bezierCurveTo(cx - rx * 0.35, cy + ry * 0.02 + dy, cx - rx * 0.05, cy + ry * 0.44 + dy, cx + rx * 0.45, cy + ry * 0.3 + dy);
      ctx.bezierCurveTo(cx + rx * 0.72, cy + ry * 0.22 + dy, cx + rx * 0.9, cy + ry * 0.2 + dy, cx + rx * 1.1, cy + ry * 0.28 + dy);
      ctx.stroke();
    }

    // 深梅紫中波
    ctx.fillStyle = "#341625";
    ctx.beginPath();
    ctx.moveTo(cx - rx * 1.15, cy + ry * 0.18);
    ctx.bezierCurveTo(cx - rx * 0.42, cy + ry * 0.14, cx - rx * 0.12, cy + ry * 0.52, cx + rx * 0.38, cy + ry * 0.38);
    ctx.bezierCurveTo(cx + rx * 0.68, cy + ry * 0.28, cx + rx * 0.88, cy + ry * 0.24, cx + rx * 1.15, cy + ry * 0.34);
    ctx.lineTo(cx + rx * 1.15, cy + ry * 1.2);
    ctx.lineTo(cx - rx * 1.15, cy + ry * 1.2);
    ctx.closePath();
    ctx.fill();

    // 深梅紫上细米白流线
    ctx.strokeStyle = "rgba(243, 224, 201, 0.42)";
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 1.05, cy + ry * 0.38);
    ctx.bezierCurveTo(cx - rx * 0.42, cy + ry * 0.32, cx - rx * 0.16, cy + ry * 0.72, cx + rx * 0.3, cy + ry * 0.56);
    ctx.stroke();

    // 陶土玫瑰粉下波
    ctx.fillStyle = "#C98C7E";
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.56, cy + ry * 0.92);
    ctx.bezierCurveTo(cx - rx * 0.18, cy + ry * 0.62, cx + rx * 0.14, cy + ry * 0.42, cx + rx * 0.58, cy + ry * 0.42);
    ctx.bezierCurveTo(cx + rx * 0.84, cy + ry * 0.42, cx + rx * 1.0, cy + ry * 0.46, cx + rx * 1.15, cy + ry * 0.5);
    ctx.lineTo(cx + rx * 1.15, cy + ry * 1.2);
    ctx.lineTo(cx - rx * 0.7, cy + ry * 1.2);
    ctx.closePath();
    ctx.fill();

    // 陶粉波细浅纹
    ctx.strokeStyle = "rgba(251, 242, 230, 0.52)";
    ctx.lineWidth = 1.05;
    for (let k = 0; k < 2; k++) {
      const off = k * ry * 0.16;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.32, cy + ry * 0.96 + off * 0.4);
      ctx.bezierCurveTo(cx + rx * 0.08, cy + ry * 0.68 + off, cx + rx * 0.46, cy + ry * 0.54 + off, cx + rx * 1.02, cy + ry * 0.6 + off);
      ctx.stroke();
    }
  } else if (tId === "vase") {
    // 器物志·青瓷梅瓶
    ctx.fillStyle = "#165156";
    ctx.fillRect(cx - rx * 1.15, cy - ry * 1.15, rx * 2.3, ry * 2.3);
    // 瓶身温润釉光
    ctx.fillStyle = "#2A6B70";
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.22, cy - ry * 0.1, rx * 0.45, ry * 0.72, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(235, 224, 201, 0.28)";
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.36, cy - ry * 0.24, rx * 0.14, ry * 0.44, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // 陶粉冰裂弦纹带
    ctx.fillStyle = "#C98C7E";
    ctx.fillRect(cx - rx * 1.1, cy - ry * 0.58, rx * 2.2, ry * 0.1);
    ctx.strokeStyle = "#FBF2E6";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 1.0, cy - ry * 0.53);
    ctx.lineTo(cx + rx * 1.0, cy - ry * 0.53);
    ctx.stroke();
    // 底部梅紫托影与开片细线
    ctx.fillStyle = "#341625";
    ctx.fillRect(cx - rx * 1.1, cy + ry * 0.68, rx * 2.2, ry * 0.45);
    ctx.strokeStyle = "rgba(223, 198, 170, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.5, cy - ry * 0.3);
    ctx.lineTo(cx - rx * 0.1, cy + ry * 0.05);
    ctx.lineTo(cx + rx * 0.35, cy - ry * 0.15);
    ctx.moveTo(cx - rx * 0.1, cy + ry * 0.05);
    ctx.lineTo(cx + rx * 0.18, cy + ry * 0.55);
    ctx.stroke();
  } else {
    // 跨页志·抽象礼帽与风衣剪影（纯几何剪影，零五官）
    ctx.fillStyle = "#341625";
    ctx.fillRect(cx - rx * 1.15, cy - ry * 1.15, rx * 2.3, ry * 2.3);
    // 背后月轮光盘
    ctx.fillStyle = "#DFC6AA";
    ctx.beginPath();
    ctx.arc(cx + rx * 0.18, cy - ry * 0.52, rx * 0.42, 0, Math.PI * 2);
    ctx.fill();
    // 冷杉青绿披风斜摆
    ctx.fillStyle = "#165156";
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.1, cy - ry * 0.46);
    ctx.lineTo(cx + rx * 0.96, cy + ry * 1.05);
    ctx.lineTo(cx - rx * 0.35, cy + ry * 1.05);
    ctx.closePath();
    ctx.fill();
    // 陶土粉围巾斜带
    ctx.fillStyle = "#C98C7E";
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.52, cy - ry * 0.48);
    ctx.lineTo(cx + rx * 0.34, cy - ry * 0.32);
    ctx.lineTo(cx + rx * 0.14, cy + ry * 0.18);
    ctx.lineTo(cx - rx * 0.42, cy - ry * 0.14);
    ctx.closePath();
    ctx.fill();
    // 简洁帽檐白线
    ctx.strokeStyle = "rgba(251, 242, 230, 0.65)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.58, cy - ry * 0.74);
    ctx.quadraticCurveTo(cx, cy - ry * 0.64, cx + rx * 0.54, cy - ry * 0.76);
    ctx.stroke();
  }

  ctx.restore();
}

// 绘制六点环绕模式的迷你矢量图标（1:1 呼应原海报 6 枚徽章）
function drawPillarGlyph(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#FBF2E6";
  ctx.fillStyle = "#FBF2E6";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = r * 0.55;
  if (id === "focal") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "wrap") {
    for (const dy of [-s * 0.45, 0, s * 0.45]) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, dy);
      ctx.quadraticCurveTo(-s * 0.3, dy - 3, 0, dy);
      ctx.quadraticCurveTo(s * 0.3, dy + 3, s * 0.85, dy);
      ctx.stroke();
    }
  } else if (id === "flow") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, s * 0.4);
    ctx.bezierCurveTo(-s * 0.2, s * 0.4, -s * 0.2, -s * 0.45, s * 0.75, -s * 0.45);
    ctx.stroke();
    drawArrowhead(ctx, s * 0.82, -s * 0.45, 0, 3.6, "#FBF2E6");
  } else if (id === "balance") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, -s * 0.3);
    ctx.lineTo(s * 0.8, -s * 0.3);
    ctx.moveTo(0, -s * 0.65);
    ctx.lineTo(0, s * 0.7);
    ctx.moveTo(-s * 0.45, s * 0.7);
    ctx.lineTo(s * 0.45, s * 0.7);
    ctx.stroke();
  } else if (id === "contour") {
    ctx.setLineDash([2.5, 2.5]);
    ctx.strokeRect(-s * 0.72, -s * 0.72, s * 1.44, s * 1.44);
    ctx.setLineDash([]);
  } else {
    for (const dy of [-s * 0.5, 0, s * 0.5]) {
      ctx.beginPath();
      ctx.arc(-s * 0.62, dy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, dy);
      ctx.lineTo(s * 0.78, dy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHero(t, dt, { still }) {
  const rect = heroCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;

  const dpr = pixelRatio(rect.width < 520 ? 1.25 : 2);
  const bw = Math.round(rect.width * dpr);
  const bh = Math.round(rect.height * dpr);
  if (heroCanvas.width !== bw || heroCanvas.height !== bh) {
    heroCanvas.width = bw;
    heroCanvas.height = bh;
    recompute();
  }
  if (!cachedEval) recompute();
  const ev = cachedEval;

  const revealing = !still && t < 0.92;
  const ringFlowing = !still && ev.state.showGuides && ev.checks.contourOk && ev.checks.marginOk;
  if (!still && !heroDirty && !revealing && !ringFlowing) {
    return;
  }
  heroDirty = false;

  const reveal = still ? 1 : clamp(t / 0.85, 0.25, 1);
  const dashOffset = still ? 0 : (t * 16) % 24;

  const ctx = heroCtx;
  ctx.save();
  ctx.setTransform(bw / ev.viewW, 0, 0, bh / ev.viewH, 0, 0);

  // 1. 亮米砂纸跨页底面
  ctx.fillStyle = "#FBF2E6";
  ctx.fillRect(0, 0, ev.viewW, ev.viewH);

  // 极淡暖砂四缘留白框架
  ctx.strokeStyle = "rgba(52, 22, 37, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(ev.spread.x - 10, ev.spread.y - 8, ev.spread.w + 20, ev.spread.h + 16);

  // 双栏中脊线（two-col 模式）
  if (ev.state.colMode === "two-col") {
    const midX = ev.spread.x + ev.spread.w * 0.5;
    ctx.save();
    ctx.strokeStyle = "rgba(52, 22, 37, 0.14)";
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, ev.spread.y + 42);
    ctx.lineTo(midX, ev.spread.y + ev.spread.h - 8);
    ctx.stroke();
    ctx.restore();
  }

  // 2. 版面眉题与文章标题（非六点模式）
  if (ev.state.colMode !== "poster-6") {
    ctx.fillStyle = "#7A362E";
    ctx.font = `700 ${ev.isCompact ? 10 : 11}px "Bricolage Grotesque", sans-serif`;
    ctx.fillText(ev.theme.kicker, ev.spread.x, ev.spread.y + 12);

    ctx.fillStyle = "#1C0D15";
    ctx.font = `900 ${ev.isCompact ? 15.5 : 18.5}px "Noto Sans SC", sans-serif`;
    ctx.fillText(ev.theme.heading, ev.spread.x, ev.spread.y + 34);

    // 标题下方细梅紫短杠
    ctx.fillStyle = "#341625";
    ctx.fillRect(ev.spread.x, ev.spread.y + 41, 44, 2);
  }

  // 3. 若为矩形死框，标出四角楔形死空洞（偶数规则挖掉有机图形，只给死角斜影）
  const { cx, cy, rx, ry, shapePoly, wrapPoly, rectBounds, handlePt } = ev.figure;
  if (ev.state.wrapMode === "rect") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rectBounds.minX, rectBounds.minY, rectBounds.w, rectBounds.h);
    // 反向挖除有机图形，突出死角空白区域
    const rev = shapePoly.slice().reverse();
    ctx.moveTo(rev[0][0], rev[0][1]);
    for (let i = 1; i < rev.length; i++) ctx.lineTo(rev[i][0], rev[i][1]);
    ctx.closePath();
    ctx.fillStyle = "rgba(166, 31, 40, 0.11)";
    ctx.fill("evenodd");
    ctx.restore();
  }

  // 4. 真实逐行正文文字 或 原海报六点卡片
  if (ev.state.colMode === "poster-6") {
    for (const card of ev.posterCards) {
      const isBad = card.crushed;
      const orbR = ev.isCompact ? 11 : 13;
      const orbX = card.x + orbR + 4;
      const orbY = card.y + orbR + 4;

      if (isBad) {
        ctx.fillStyle = "rgba(166, 31, 40, 0.11)";
        ctx.strokeStyle = "rgba(166, 31, 40, 0.72)";
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, card.x - 3, card.y - 2, card.w + 6, card.h + 2, 8);
        ctx.fill();
        ctx.stroke();
      }

      // 交替梅紫/青绿圆徽
      ctx.fillStyle = card.color === "plum" ? "#341625" : "#165156";
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      ctx.fill();
      drawPillarGlyph(ctx, card.id, orbX, orbY, orbR);

      // 要点标题与英文
      ctx.fillStyle = isBad ? "#A61F28" : "#1C0D15";
      ctx.font = `900 ${ev.isCompact ? 12 : 13.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText(card.title, orbX + orbR + 7, orbY + 1);
      ctx.fillStyle = isBad ? "#A61F28" : "#7A362E";
      ctx.font = `700 ${ev.isCompact ? 9 : 10}px "Bricolage Grotesque", sans-serif`;
      ctx.fillText(card.en, orbX + orbR + 7, orbY + 13);

      // 绕排正文
      ctx.fillStyle = isBad ? "#A61F28" : "#4A353D";
      ctx.font = `400 ${ev.isCompact ? 10.8 : 11.8}px "Noto Sans SC", sans-serif`;
      card.bodyLines.forEach((line, i) => {
        ctx.fillText(line, card.x + 4, card.y + orbR * 2 + 19 + i * 16);
      });
    }
  } else {
    const fontSize = ev.isCompact ? 12.6 : 13.4;
    ctx.font = `400 ${fontSize}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    for (const ln of ev.lines) {
      if (ln.isSliver || ln.isPocket) {
        ctx.fillStyle = "rgba(166, 31, 40, 0.14)";
        ctx.fillRect(ln.x - 2, ln.y - 1, ln.w + 4, ln.h);
        ctx.fillStyle = "#A61F28";
      } else {
        ctx.fillStyle = "#29141E";
      }
      ctx.fillText(ln.text, ln.x, ln.y + 1);
    }
    ctx.textBaseline = "alphabetic";
  }

  // 5. 单栏劈句「跨图跳读线」高亮
  if (ev.splitBridges.length) {
    ctx.save();
    ctx.strokeStyle = "rgba(166, 31, 40, 0.72)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i < ev.splitBridges.length; i += 2) {
      const b = ev.splitBridges[i];
      ctx.beginPath();
      ctx.moveTo(b.x1 + 2, b.y);
      ctx.lineTo(b.x2 - 2, b.y);
      ctx.stroke();
      drawArrowhead(ctx, b.x2 - 5, b.y, 0, 4.2, "#A61F28");
    }
    ctx.restore();
  }

  // 6. 凹坑陷字警示框
  if (ev.pocketTraps.length) {
    ctx.save();
    ctx.strokeStyle = "#A61F28";
    ctx.fillStyle = "rgba(166, 31, 40, 0.16)";
    ctx.lineWidth = 1.5;
    for (const p of ev.pocketTraps) {
      drawRoundedRect(ctx, p.x - 2, p.y - 2, p.w + 4, p.h + 4, 4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 7. 中央有机图形主体（1:1 质感绘制，离屏缓存平移）
  drawThemeArtwork(ctx, ev, reveal, bw / ev.viewW);

  // 8. 绕排边界辅助线（青绿虚线环 + 四枚顺时针流向箭头，或红色死框/凹坑线）
  if (ev.state.showGuides) {
    const isOkRing = ev.checks.contourOk && ev.checks.marginOk;
    const ringColor = isOkRing ? "#165156" : "#A61F28";

    ctx.save();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = isOkRing ? 1.8 : 2;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = isOkRing ? -dashOffset : 0;

    if (ev.state.wrapMode === "rect") {
      ctx.strokeRect(rectBounds.minX, rectBounds.minY, rectBounds.w, rectBounds.h);
    } else if (ev.state.wrapMode === "concave") {
      tracePolyClosed(ctx, wrapPoly);
      ctx.stroke();
    } else {
      traceSmoothClosed(ctx, wrapPoly);
      ctx.stroke();

      // 1:1 呼应原海报：在青绿虚线环四周画 4 枚顺时针方向箭头
      const n = wrapPoly.length;
      const picks = [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75)];
      for (const idx of picks) {
        const p1 = wrapPoly[idx];
        const p2 = wrapPoly[(idx + 1) % n];
        const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
        drawArrowhead(ctx, (p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5, ang, 5.2, ringColor);
      }
    }
    ctx.restore();

    // 贴边咬字红刻度提示（margin < 10px）
    if (ev.state.marginPx < 10) {
      ctx.save();
      ctx.strokeStyle = "#A61F28";
      ctx.lineWidth = 2;
      for (let i = 0; i < wrapPoly.length; i += 3) {
        const [wx, wy] = wrapPoly[i];
        const ang = Math.atan2(wy - cy, wx - cx);
        ctx.beginPath();
        ctx.moveTo(wx - Math.cos(ang) * 4, wy - Math.sin(ang) * 4);
        ctx.lineTo(wx + Math.cos(ang) * 5, wy + Math.sin(ang) * 5);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 绕距直接拖拽把手（青绿实心胶囊）
    const [hx, hy] = handlePt;
    const hLabel = `↔ ${ev.state.marginPx}px`;
    ctx.save();
    ctx.fillStyle = ev.checks.marginOk ? "#165156" : "#A61F28";
    drawRoundedRect(ctx, hx - 30, hy - 12, 60, 24, 12);
    ctx.fill();
    ctx.strokeStyle = "#FBF2E6";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#FBF2E6";
    ctx.font = `500 11px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hLabel, hx, hy + 0.5);
    ctx.restore();
  }

  // 9. 主体中央微弱拖移提示（仅在未达成 4/4 或悬停时轻显）
  if (ev.passedCount < 4 || pointerHover === "figure") {
    ctx.save();
    ctx.fillStyle = "rgba(52, 22, 37, 0.78)";
    drawRoundedRect(ctx, cx - 50, cy - 13, 100, 26, 13);
    ctx.fill();
    ctx.fillStyle = "#FBF2E6";
    ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔ 拖动移位", cx, cy + 0.5);
    ctx.restore();
  }

  // 10. 画布内可点击纠错红签（hotspots）
  for (const hs of ev.hotspots) {
    ctx.save();
    ctx.fillStyle = "#A61F28";
    drawRoundedRect(ctx, hs.x, hs.y, hs.w, hs.h, 14);
    ctx.fill();
    ctx.strokeStyle = "#FBF2E6";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#FBF2E6";
    ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hs.label, hs.x + hs.w * 0.5, hs.y + hs.h * 0.5 + 0.5);
    ctx.restore();
  }

  ctx.restore();

  if (needsUiSync) {
    const now = performance.now();
    if (!dragMode || now - lastUiSyncTs >= 60) {
      needsUiSync = false;
      lastUiSyncTs = now;
      syncHeroUI(ev);
    }
  }
}

// ======================================================
// 同步 Hero 全部 DOM 读数、徽标与控槽（单真源，缓存节点避免拖动抖动）
// ======================================================
const dom = {
  topStatus: document.getElementById("top-status"),
  titleBadge: document.getElementById("title-demo-badge"),
  titleText: document.getElementById("title-demo-text"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagAction: document.getElementById("diag-action"),
  mBoundary: document.getElementById("m-boundary"),
  mMargin: document.getElementById("m-margin"),
  mMinLine: document.getElementById("m-minline"),
  mArea: document.getElementById("m-area"),
  ctrlMargin: document.getElementById("ctrl-margin"),
  ctrlMarginVal: document.getElementById("ctrl-margin-val"),
  ctrlScale: document.getElementById("ctrl-scale"),
  ctrlScaleVal: document.getElementById("ctrl-scale-val"),
  toggleGuides: document.getElementById("toggle-guides"),
  themeBtns: [...document.querySelectorAll("[data-theme]")],
  wrapBtns: [...document.querySelectorAll("[data-wrap]")],
  colBtns: [...document.querySelectorAll("[data-col]")],
  pillarLiveMap: Object.fromEntries(
    [...document.querySelectorAll("[data-pillar-live]")].map((el) => [el.dataset.pillarLive, el])
  ),
};

function setTxt(el, val) {
  if (el.textContent !== val) el.textContent = val;
}
function setCls(el, val) {
  if (el.className !== val) el.className = val;
}

function syncHeroUI(ev) {
  const ok = ev.passedCount === 4;
  setTxt(dom.topStatus, `${ev.passedCount} / 4 · ${ev.statusShort}`);
  setCls(dom.topStatus, `folio-status ${ok ? "is-ok" : "is-bad"}`);

  // 自示范标题徽章：外距随绕距动态变化
  setCls(dom.titleBadge, `title-demo-badge ${ok ? "is-ok" : "is-bad"}`);
  const gapStr = `${clamp(4 + Math.round(ev.state.marginPx * 0.28), 4, 15)}px`;
  if (dom.titleBadge.style.gap !== gapStr) dom.titleBadge.style.gap = gapStr;
  setTxt(dom.titleText, `${ev.state.wrapMode === "contour" ? "顺廓" : ev.state.wrapMode === "rect" ? "矩形死框" : "凹坑"} · 绕距 ${ev.state.marginPx}px`);

  setTxt(dom.diagBadge, `${ok ? "达标" : "错态"} · ${ev.statusShort} (${ev.passedCount}/4)`);
  setCls(dom.diagBadge, `diag-badge ${ok ? "is-ok" : "is-bad"}`);
  setTxt(dom.diagHeadline, ev.headline);
  setTxt(dom.diagBody, ev.body);
  setTxt(dom.diagAction, `下一步：${ev.action}`);

  setTxt(dom.mBoundary, ev.metrics.boundaryLabel);
  setCls(dom.mBoundary, ev.checks.contourOk ? "is-ok" : "is-bad");
  setTxt(dom.mMargin, ev.metrics.marginLabel);
  setCls(dom.mMargin, ev.checks.marginOk ? "is-ok" : "is-bad");
  setTxt(dom.mMinLine, ev.metrics.minLineLabel);
  setCls(dom.mMinLine, ev.checks.flowOk ? "is-ok" : "is-bad");
  setTxt(dom.mArea, ev.metrics.areaLabel);
  setCls(dom.mArea, ev.checks.balanceOk ? "is-ok" : "is-bad");

  const mStr = String(ev.state.marginPx);
  if (dom.ctrlMargin.value !== mStr) dom.ctrlMargin.value = mStr;
  setTxt(dom.ctrlMarginVal, `${ev.state.marginPx}px`);
  const sStr = String(Math.round(ev.state.scale * 100));
  if (dom.ctrlScale.value !== sStr) dom.ctrlScale.value = sStr;
  setTxt(dom.ctrlScaleVal, `${ev.metrics.imageAreaPct}%`);

  for (const btn of dom.themeBtns) {
    const active = btn.dataset.theme === ev.state.theme;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  for (const btn of dom.wrapBtns) {
    const active = btn.dataset.wrap === ev.state.wrapMode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  for (const btn of dom.colBtns) {
    const active = btn.dataset.col === ev.state.colMode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  dom.toggleGuides.classList.toggle("is-on", ev.state.showGuides);
  setTxt(dom.toggleGuides, `辅助轮廓线：${ev.state.showGuides ? "开" : "关"}`);
  dom.toggleGuides.setAttribute("aria-pressed", String(ev.state.showGuides));

  for (const ps of ev.pillarStates) {
    const el = dom.pillarLiveMap[ps.id];
    if (el) {
      setTxt(el, ps.text);
      setCls(el, `pillar-live ${ps.ok ? "is-ok" : "is-bad"}`);
    }
  }
}

const heroLoop = loop(heroCanvas, drawHero);

function applyChange(patch, { deferDraw = false } = {}) {
  Object.assign(state, patch);
  recompute();
  // 拖动期间交由 rAF 节拍重绘避免单帧双画；离散点击与减少动态效果模式立即刷新
  if (!deferDraw || reducedMotion.matches) {
    heroLoop.draw();
    if (needsUiSync && cachedEval) {
      needsUiSync = false;
      syncHeroUI(cachedEval);
    }
  }
}

// ======================================================
// 画布直操：拖移图形 / 拖绕距光圈把手 / 点红签纠错 / 键盘方向键
// ======================================================
function clientToLogical(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  const ev = cachedEval || recompute();
  return {
    x: ((clientX - rect.left) / Math.max(1, rect.width)) * ev.viewW,
    y: ((clientY - rect.top) / Math.max(1, rect.height)) * ev.viewH,
  };
}

function hitHotspot(pt, ev) {
  for (const hs of ev.hotspots) {
    if (pt.x >= hs.x - 4 && pt.x <= hs.x + hs.w + 4 && pt.y >= hs.y - 4 && pt.y <= hs.y + hs.h + 4) {
      return hs;
    }
  }
  return null;
}

function triggerHotspot(hs) {
  if (hs.kind === "contour") {
    applyChange({ wrapMode: "contour" });
  } else if (hs.kind === "split") {
    applyChange({ colMode: "two-col", u: 0.5 });
  } else if (hs.kind === "sliver") {
    if (state.colMode === "one-col") applyChange({ u: 0.91, scale: Math.min(state.scale, 0.36) });
    else applyChange({ u: 0.5, scale: Math.min(state.scale, 0.37) });
  }
}

let activeTouchId = null;

function beginDrag(clientX, clientY, isTouch) {
  const ev = cachedEval || recompute();
  const pt = clientToLogical(clientX, clientY);

  // 先查是否点中纠错红签
  const hs = hitHotspot(pt, ev);
  if (hs) {
    triggerHotspot(hs);
    return false;
  }

  // 再查是否点中绕距光圈把手
  const [hx, hy] = ev.figure.handlePt;
  if (Math.hypot(pt.x - hx, pt.y - hy) <= 34) {
    dragMode = "margin";
    dragStart = { x: pt.x, y: pt.y, margin: state.marginPx, u: state.u, v: state.v, isTouch };
    return true;
  }

  // 其余区域横拖直接滑移图形位置（同时兼容 perf.mjs 从画布中心水平拖测帧率）
  dragMode = "figure";
  dragStart = { x: pt.x, y: pt.y, margin: state.marginPx, u: state.u, v: state.v, isTouch };
  return true;
}

function moveDrag(clientX, clientY) {
  if (!dragMode || !dragStart) return;
  const ev = cachedEval || recompute();
  const pt = clientToLogical(clientX, clientY);
  const dx = pt.x - dragStart.x;
  const dy = pt.y - dragStart.y;

  if (dragMode === "margin") {
    const nextMargin = clamp(Math.round(dragStart.margin + dx * 0.45), 0, 42);
    if (nextMargin !== state.marginPx) applyChange({ marginPx: nextMargin }, { deferDraw: true });
  } else if (dragMode === "figure") {
    let nextU = clamp(dragStart.u + dx / Math.max(1, ev.spread.w), 0.08, 0.92);
    let nextV = dragStart.isTouch
      ? dragStart.v
      : clamp(dragStart.v + dy / Math.max(1, ev.spread.h), 0.36, 0.64);
    // 靠近双栏中脊或单栏左右页边时轻度磁吸
    if (state.colMode !== "one-col" && Math.abs(nextU - 0.5) < 0.025) nextU = 0.5;
    if (state.colMode === "one-col" && nextU > 0.86) nextU = 0.91;
    if (state.colMode === "one-col" && nextU < 0.14) nextU = 0.09;
    if (Math.abs(nextU - state.u) > 0.001 || Math.abs(nextV - state.v) > 0.001) {
      applyChange({ u: nextU, v: nextV }, { deferDraw: true });
    }
  }
}

function endDrag() {
  const wasDragging = !!dragMode;
  dragMode = null;
  dragStart = null;
  activeTouchId = null;
  if (wasDragging && cachedEval) {
    needsUiSync = false;
    syncHeroUI(cachedEval);
  }
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // 触屏交由原生 touch 事件，保证垂直滚页顺滑与 perf.mjs 精准命中
  if (beginDrag(e.clientX, e.clientY, false)) {
    heroCanvas.setPointerCapture(e.pointerId);
  }
});
heroCanvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  if (dragMode) {
    moveDrag(e.clientX, e.clientY);
  } else if (cachedEval) {
    const pt = clientToLogical(e.clientX, e.clientY);
    const hs = hitHotspot(pt, cachedEval);
    const [hx, hy] = cachedEval.figure.handlePt;
    const onHandle = Math.hypot(pt.x - hx, pt.y - hy) <= 34;
    const onFig = Math.hypot(pt.x - cachedEval.figure.cx, pt.y - cachedEval.figure.cy) <= cachedEval.figure.rx;
    const nextHover = hs ? "hotspot" : onHandle ? "handle" : onFig ? "figure" : null;
    heroCanvas.style.cursor = hs ? "pointer" : onHandle ? "ew-resize" : "grab";
    if (nextHover !== pointerHover) {
      pointerHover = nextHover;
      heroDirty = true;
      heroLoop.draw();
    }
  }
});
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

// 触屏直拖（仅水平拖动锁定，竖向滑动照常滚页）
let touchOrigin = null;
heroCanvas.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  const t0 = e.touches[0];
  activeTouchId = t0.identifier;
  touchOrigin = { x: t0.clientX, y: t0.clientY, locked: false };
  beginDrag(t0.clientX, t0.clientY, true);
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!dragMode || activeTouchId === null) return;
  const t0 = [...e.touches].find((x) => x.identifier === activeTouchId);
  if (!t0) return;
  const adx = Math.abs(t0.clientX - touchOrigin.x);
  const ady = Math.abs(t0.clientY - touchOrigin.y);
  if (!touchOrigin.locked && adx + ady > 6) {
    if (ady > adx * 1.35) {
      endDrag();
      return;
    }
    touchOrigin.locked = true;
  }
  moveDrag(t0.clientX, t0.clientY);
}, { passive: true });

heroCanvas.addEventListener("touchend", endDrag, { passive: true });
heroCanvas.addEventListener("touchcancel", endDrag, { passive: true });

// 键盘方向键微调（Shift + 左右微调绕距，普通方向键微移图形）
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (e.shiftKey) applyChange({ marginPx: clamp(state.marginPx - 2, 0, 42) });
    else applyChange({ u: clamp(state.u - 0.03, 0.08, 0.92) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (e.shiftKey) applyChange({ marginPx: clamp(state.marginPx + 2, 0, 42) });
    else applyChange({ u: clamp(state.u + 0.03, 0.08, 0.92) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    applyChange({ marginPx: clamp(state.marginPx + 2, 0, 42) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    applyChange({ marginPx: clamp(state.marginPx - 2, 0, 42) });
  }
});

// Hero 控件事件绑定
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => applyChange({ theme: btn.dataset.theme }));
});
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (preset) applyChange({ ...preset, theme: state.theme });
  });
});
document.querySelectorAll("[data-wrap]").forEach((btn) => {
  btn.addEventListener("click", () => applyChange({ wrapMode: btn.dataset.wrap }));
});
document.querySelectorAll("[data-col]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextCol = btn.dataset.col;
    const patch = { colMode: nextCol };
    if (nextCol !== "one-col" && (state.u < 0.35 || state.u > 0.65)) patch.u = 0.5;
    applyChange(patch);
  });
});
dom.ctrlMargin.addEventListener("input", () => applyChange({ marginPx: Number(dom.ctrlMargin.value) }));
dom.ctrlScale.addEventListener("input", () => applyChange({ scale: Number(dom.ctrlScale.value) / 100 }));
dom.toggleGuides.addEventListener("click", () => applyChange({ showGuides: !state.showGuides }));

// 点击底部六点实况带快捷聚焦修复/示范对应维度
document.querySelectorAll("[data-focus-pillar]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.focusPillar;
    if (id === "focal") applyChange({ scale: 0.35 });
    else if (id === "wrap" || id === "contour") applyChange({ wrapMode: "contour", marginPx: 18 });
    else if (id === "flow") applyChange({ colMode: "two-col", u: 0.5 });
    else if (id === "balance") applyChange({ u: state.colMode === "one-col" ? 0.91 : 0.5, scale: 0.35 });
    else if (id === "emphasis") applyChange({ ...PRESETS.poster6, theme: state.theme });
  });
});

window.addEventListener("resize", () => {
  recompute();
  heroLoop.draw();
});

// ======================================================
// 01 节：六股视觉力量轮廓力学解剖
// ======================================================
const anatomyList = document.querySelector(".anatomy-list");
const anatomySvg = document.getElementById("anatomy-svg");
const anatomyCaption = document.getElementById("anatomy-caption");
const ORB_CHARS = { focal: "焦", wrap: "绕", flow: "流", balance: "衡", contour: "廓", emphasis: "聚" };

let activePointId = "focal";

function renderAnatomy(id) {
  activePointId = id;
  const pt = POSTER_POINTS.find((p) => p.id === id) || POSTER_POINTS[0];
  anatomyList.querySelectorAll(".anatomy-card").forEach((btn) => {
    const on = btn.dataset.pid === id;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  });
  anatomyCaption.innerHTML = `<strong>${pt.title}（${pt.en}）</strong>：${pt.anatomy}`;

  // 渲染聚焦对应力学的矢量轮廓图
  const hl = (k) => (k === id ? 1 : 0.28);
  anatomySvg.innerHTML = `
    <rect width="560" height="400" fill="#FBF2E6"/>
    <!-- 左右参考文本行 -->
    <g fill="#523A43" opacity="${id === "wrap" || id === "flow" ? 0.85 : 0.45}">
      <rect x="34" y="54" width="142" height="8" rx="4"/>
      <rect x="34" y="76" width="128" height="8" rx="4"/>
      <rect x="34" y="98" width="110" height="8" rx="4"/>
      <rect x="34" y="120" width="96" height="8" rx="4"/>
      <rect x="34" y="142" width="84" height="8" rx="4"/>
      <rect x="34" y="164" width="76" height="8" rx="4"/>
      <rect x="34" y="186" width="72" height="8" rx="4"/>
      <rect x="34" y="208" width="78" height="8" rx="4"/>
      <rect x="34" y="230" width="96" height="8" rx="4"/>
      <rect x="34" y="252" width="120" height="8" rx="4"/>
      <rect x="34" y="274" width="146" height="8" rx="4"/>
      <rect x="34" y="296" width="174" height="8" rx="4"/>

      <rect x="394" y="54" width="132" height="8" rx="4"/>
      <rect x="406" y="76" width="120" height="8" rx="4"/>
      <rect x="418" y="98" width="108" height="8" rx="4"/>
      <rect x="424" y="120" width="102" height="8" rx="4"/>
      <rect x="428" y="142" width="98" height="8" rx="4"/>
      <rect x="430" y="164" width="96" height="8" rx="4"/>
      <rect x="426" y="186" width="100" height="8" rx="4"/>
      <rect x="420" y="208" width="106" height="8" rx="4"/>
      <rect x="410" y="230" width="116" height="8" rx="4"/>
      <rect x="394" y="252" width="132" height="8" rx="4"/>
      <rect x="372" y="274" width="154" height="8" rx="4"/>
      <rect x="346" y="296" width="180" height="8" rx="4"/>
    </g>

    <!-- 158 原海报核心卵石 -->
    <g opacity="${id === "focal" || id === "emphasis" ? 1 : 0.86}">
      <path d="M294 56 C352 60 390 112 396 178 C402 246 364 316 296 326 C228 336 168 286 154 222 C142 168 188 134 226 96 C250 72 268 54 294 56 Z" fill="#165156"/>
      <circle cx="298" cy="176" r="56" fill="#DFC6AA"/>
      <path d="M156 226 C210 212 256 266 322 242 C354 230 378 236 392 248 C382 292 344 320 296 326 C228 336 170 288 156 226 Z" fill="#341625"/>
      <path d="M214 300 C264 274 318 242 386 254 C372 296 340 320 296 326 C262 330 234 318 214 300 Z" fill="#C98C7E"/>
    </g>

    <!-- 贴合轮廓外包虚线 -->
    <path d="M296 38 C366 42 408 102 414 178 C422 256 376 334 298 344 C220 356 152 298 136 224 C122 162 174 122 214 82 C240 54 264 36 296 38 Z"
      fill="none" stroke="${id === "contour" || id === "wrap" ? "#341625" : "#165156"}"
      stroke-width="${id === "contour" || id === "wrap" ? 3 : 1.6}" stroke-dasharray="7 5" opacity="${id === "contour" || id === "wrap" || id === "flow" ? 1 : 0.45}"/>

    <!-- 按当前选中的力量叠加专属力学标注 -->
    ${id === "focal" ? `
      <circle cx="294" cy="182" r="92" fill="none" stroke="#C98C7E" stroke-width="2" stroke-dasharray="5 5"/>
      <circle cx="294" cy="182" r="10" fill="#FBF2E6" stroke="#341625" stroke-width="2.5"/>
      <rect x="206" y="354" width="176" height="28" rx="14" fill="#341625"/>
      <text x="294" y="372" text-anchor="middle" fill="#FBF2E6" font-size="12" font-weight="700">核心主体锚住第一落点</text>
    ` : ""}

    ${id === "wrap" ? `
      <line x1="112" y1="186" x2="140" y2="186" stroke="#165156" stroke-width="2.5"/>
      <line x1="412" y1="168" x2="430" y2="168" stroke="#165156" stroke-width="2.5"/>
      <rect x="176" y="354" width="208" height="28" rx="14" fill="#165156"/>
      <text x="280" y="372" text-anchor="middle" fill="#FBF2E6" font-size="12" font-weight="700">10–30px 经验均匀呼吸带</text>
    ` : ""}

    ${id === "flow" ? `
      <path d="M120 130 C160 40 370 18 432 120 C474 190 434 328 310 356 C192 378 96 296 112 194" fill="none" stroke="#C98C7E" stroke-width="3" stroke-dasharray="8 4"/>
      <polygon points="436,126 424,114 438,110" fill="#341625"/>
      <polygon points="304,356 320,350 318,364" fill="#341625"/>
      <polygon points="113,186 105,202 119,202" fill="#341625"/>
      <rect x="184" y="354" width="192" height="28" rx="14" fill="#341625"/>
      <text x="280" y="372" text-anchor="middle" fill="#FBF2E6" font-size="12" font-weight="700">顺弧引导视线环游不跳读</text>
    ` : ""}

    ${id === "balance" ? `
      <line x1="60" y1="348" x2="500" y2="348" stroke="#165156" stroke-width="2.5"/>
      <polygon points="280,348 268,370 292,370" fill="#165156"/>
      <circle cx="110" cy="348" r="7" fill="#341625"/>
      <circle cx="450" cy="348" r="7" fill="#341625"/>
      <text x="110" y="336" text-anchor="middle" fill="#341625" font-size="12" font-weight="700">左栏字重</text>
      <text x="450" y="336" text-anchor="middle" fill="#341625" font-size="12" font-weight="700">右栏字重</text>
    ` : ""}

    ${id === "contour" ? `
      <g fill="#C98C7E" stroke="#341625" stroke-width="2">
        <circle cx="296" cy="38" r="5.5"/><circle cx="388" cy="84" r="5.5"/><circle cx="414" cy="178" r="5.5"/>
        <circle cx="382" cy="296" r="5.5"/><circle cx="298" cy="344" r="5.5"/><circle cx="186" cy="316" r="5.5"/>
        <circle cx="136" cy="224" r="5.5"/><circle cx="186" cy="112" r="5.5"/>
      </g>
      <rect x="166" y="354" width="228" height="28" rx="14" fill="#341625"/>
      <text x="280" y="372" text-anchor="middle" fill="#FBF2E6" font-size="12" font-weight="700">8 枚平滑外凸顶点包络曲线</text>
    ` : ""}

    ${id === "emphasis" ? `
      <g stroke="#165156" stroke-width="2">
        <line x1="90" y1="90" x2="178" y2="132"/><line x1="470" y1="90" x2="394" y2="132"/>
        <line x1="86" y1="280" x2="162" y2="256"/><line x1="474" y1="280" x2="398" y2="256"/>
      </g>
      <rect x="184" y="354" width="192" height="28" rx="14" fill="#165156"/>
      <text x="280" y="372" text-anchor="middle" fill="#FBF2E6" font-size="12" font-weight="700">四周留白聚拢核心主角</text>
    ` : ""}
    <g opacity="${hl("none")}"></g>
  `;
}

POSTER_POINTS.forEach((pt, idx) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `anatomy-card ${pt.color === "teal" ? "is-teal-card" : ""}`;
  btn.dataset.pid = pt.id;
  btn.setAttribute("role", "tab");
  btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
  btn.innerHTML = `
    <span class="anatomy-card-head">
      <span class="anatomy-badge ${pt.color === "teal" ? "is-teal" : "is-plum"}" aria-hidden="true">${ORB_CHARS[pt.id]}</span>
      <span class="anatomy-card-titles"><strong>${pt.title}</strong><span>${pt.en}</span></span>
    </span>
    <p>${pt.body}</p>
  `;
  btn.addEventListener("click", () => renderAnatomy(pt.id));
  anatomyList.appendChild(btn);
});
renderAnatomy("focal");

// ======================================================
// 02 节：真实 DOM CSS shape-outside 压力测试沙箱
// ======================================================
const cssLiveBox = document.getElementById("css-live-box");
const cssColWidth = document.getElementById("css-col-width");
const cssColWidthVal = document.getElementById("css-col-width-val");
const cssCodeOut = document.getElementById("css-code-out");
const cssVerdict = document.getElementById("css-verdict");

let cssMode = "right";

function updateCssLab() {
  const w = Number(cssColWidth.value);
  cssColWidthVal.textContent = `${w}px`;
  cssLiveBox.style.setProperty("--box-w", `${w}px`);
  cssLiveBox.className = `css-live-box mode-${cssMode}`;

  document.querySelectorAll("[data-cssmode]").forEach((btn) => {
    const active = btn.dataset.cssmode === cssMode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  // 估算当前容器宽度减去图形宽度后剩余的汉字数（正文字号 14.5px）
  const innerW = Math.max(120, w - 44);
  const figOccupy = cssMode === "tight" ? 164 : 182;
  const remW = Math.max(0, innerW - figOccupy);
  const estChars = Math.max(2, Math.floor(remW / 14.5));

  const snippets = {
    right: `.focal-shape {\n  float: right;\n  shape-outside: polygon(56% 5%, 92% 24%, 95% 50%,\n    78% 93%, 30% 93%, 4% 58%, 34% 18%);\n  shape-margin: 14px;\n}\n/* 当前容器 ${w}px → 绕排区最窄约 ${estChars} 汉字/行 */`,
    left: `.focal-shape {\n  float: left;\n  shape-outside: polygon(56% 5%, 92% 24%, ...);\n  shape-margin: 14px;\n}\n/* 左缘绕排：每行左起点随弧线漂移，回扫成本升高 */`,
    box: `.focal-shape {\n  float: right;\n  shape-outside: none; /* 退回矩形外框 */\n  margin: 2px 0 8px 14px;\n}\n/* 卵石上下收窄处被矩形死框白白切出三角空洞 */`,
    tight: `.focal-shape {\n  float: right;\n  shape-outside: polygon(...);\n  shape-margin: 0px; /* 危险：零呼吸距 */\n}\n/* 文字边缘直接咬进轮廓，版面局促压抑 */`,
  };
  cssCodeOut.textContent = snippets[cssMode];

  if (w < 430) {
    cssVerdict.className = "verdict-box is-bad";
    cssVerdict.innerHTML = `<strong>窄栏红线触发（实测 ${w}px · 仅余约 ${estChars} 字/行）</strong>：已跌破舒适绕排行宽（经验底线 ≥ 8 汉字）。此时无论多精美的轮廓都应通过 <code>@media (max-width: 680px)</code> 撤掉 <code>float</code>，降级为上下堆叠。`;
  } else if (cssMode === "box") {
    cssVerdict.className = "verdict-box is-bad";
    cssVerdict.innerHTML = `<strong>矩形死框割裂</strong>：虽然剩余行宽约 ${estChars} 字足够可读，但左侧文字被迫排成笔直垂墙，和卵石左下方的弯曲弧线之间留出大片无效白角。`;
  } else if (cssMode === "tight") {
    cssVerdict.className = "verdict-box is-bad";
    cssVerdict.innerHTML = `<strong>零绕距咬字</strong>：把 <code>shape-margin</code> 降到 0px 后，字脚直接贴在冷杉青与梅紫边界上，图文粘连。建议补回 12–20px 呼吸带。`;
  } else if (cssMode === "left") {
    cssVerdict.className = "verdict-box is-warn";
    cssVerdict.innerHTML = `<strong>贴左顺弧提醒（约 ${estChars} 字/行）</strong>：文字确实沿轮廓流动，但左行首像楼梯一样缩进又探出。短引语可用，长段落建议改用「贴右顺弧」守住左起基线。`;
  } else {
    cssVerdict.className = "verdict-box";
    cssVerdict.innerHTML = `<strong>健康绕排态（实测 ${w}px · 绕排区约 ${estChars} 字/行）</strong>：左缘保持笔直基准线供视线回扫，右侧随平滑多边形退让 14px，兼顾流畅读感与有机美感。`;
  }
}

document.querySelectorAll("[data-cssmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    cssMode = btn.dataset.cssmode;
    updateCssLab();
  });
});
cssColWidth.addEventListener("input", updateCssLab);
updateCssLab();

// ======================================================
// 03 节：历史演变 4 时代标本切换器
// ======================================================
const eraSwitcher = document.querySelector(".era-switcher");
const eraSvg = document.getElementById("era-svg");
const eraDetail = document.getElementById("era-detail");

function renderEra(id) {
  const era = HISTORY_ERAS.find((e) => e.id === id) || HISTORY_ERAS[0];
  eraSwitcher.querySelectorAll(".era-btn").forEach((b) => {
    const on = b.dataset.era === id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  eraDetail.innerHTML = `
    <h3>${era.year} · ${era.work}</h3>
    <p class="era-meta">${era.place} · ${era.person}</p>
    <p>${era.summary}</p>
    <div class="era-takeaway">${era.takeaway}</div>
  `;

  if (era.specimenKind === "aldus") {
    // 1499《寻爱绮梦》威尼斯版面微标本：细线木刻+罗马活字与倒锥/器皿造型收束
    eraSvg.innerHTML = `
      <rect width="420" height="280" fill="#F3E0C9"/>
      <rect x="28" y="18" width="364" height="244" fill="#FBF2E6" stroke="#341625" stroke-width="1.2"/>
      <!-- 细线木刻建筑门拱 -->
      <g stroke="#341625" fill="none" stroke-width="1.3">
        <rect x="148" y="34" width="124" height="82"/>
        <path d="M168 116 L168 74 A42 36 0 0 1 252 74 L252 116"/>
        <circle cx="210" cy="68" r="14"/>
        <line x1="158" y1="48" x2="262" y2="48"/>
      </g>
      <!-- 罗马活字沿器皿形态收束（仿尾跋酒杯造型排印） -->
      <g fill="#29141E">
        <rect x="74" y="132" width="272" height="6" rx="2"/>
        <rect x="86" y="146" width="248" height="6" rx="2"/>
        <rect x="102" y="160" width="216" height="6" rx="2"/>
        <rect x="124" y="174" width="172" height="6" rx="2"/>
        <rect x="148" y="188" width="124" height="6" rx="2"/>
        <rect x="170" y="202" width="80" height="6" rx="2"/>
        <rect x="186" y="216" width="48" height="6" rx="2"/>
        <circle cx="210" cy="234" r="4" fill="#165156"/>
      </g>
      <text x="210" y="254" text-anchor="middle" fill="#7A362E" font-size="10.5" font-family="JetBrains Mono, monospace">VENICE 1499 · WOODCUT &amp; SHAPED TYPE</text>
    `;
  } else if (era.specimenKind === "brodovitch") {
    // 1934–1958 Brodovitch 跨页剪刀退底与斜势绕排标本
    eraSvg.innerHTML = `
      <rect width="420" height="280" fill="#F3E0C9"/>
      <rect x="18" y="22" width="384" height="236" fill="#FBF2E6" stroke="#341625" stroke-width="1"/>
      <line x1="210" y1="22" x2="210" y2="258" stroke="#341625" stroke-opacity="0.22" stroke-dasharray="4 4"/>
      <!-- 退底斜势大衣剪影跨越中缝 -->
      <path d="M188 44 C216 40 236 58 228 78 L286 226 L168 238 L156 120 Z" fill="#341625"/>
      <path d="M196 90 L264 224 L208 230 Z" fill="#165156"/>
      <path d="M168 88 L224 102 L212 128 L162 114 Z" fill="#C98C7E"/>
      <!-- 左侧文字顺斜势退让，右侧留白呼吸 -->
      <g fill="#29141E">
        <rect x="34" y="54" width="118" height="6" rx="2"/>
        <rect x="34" y="68" width="112" height="6" rx="2"/>
        <rect x="34" y="82" width="104" height="6" rx="2"/>
        <rect x="34" y="96" width="98" height="6" rx="2"/>
        <rect x="34" y="110" width="96" height="6" rx="2"/>
        <rect x="34" y="124" width="100" height="6" rx="2"/>
        <rect x="34" y="138" width="104" height="6" rx="2"/>
        <rect x="34" y="152" width="108" height="6" rx="2"/>
      </g>
      <g fill="#523A43">
        <rect x="278" y="66" width="104" height="6" rx="2"/>
        <rect x="288" y="80" width="94" height="6" rx="2"/>
        <rect x="298" y="94" width="84" height="6" rx="2"/>
        <rect x="308" y="108" width="74" height="6" rx="2"/>
      </g>
      <text x="210" y="250" text-anchor="middle" fill="#7A362E" font-size="10.5" font-family="JetBrains Mono, monospace">HARPER'S BAZAAR 1934–1958 · CUTOUT SPREAD</text>
    `;
  } else if (era.specimenKind === "pagemaker") {
    // 1988 PageMaker 3.0 可调多边形节点绕排
    eraSvg.innerHTML = `
      <rect width="420" height="280" fill="#F3E0C9"/>
      <rect x="24" y="20" width="372" height="240" fill="#FBF2E6" stroke="#341625" stroke-width="1.2"/>
      <path d="M180 54 C228 54 258 92 258 140 C258 190 226 220 180 220 C138 220 110 188 110 144 C110 100 144 54 180 54 Z" fill="#165156" opacity="0.88"/>
      <!-- 多边形可拖节点外框 -->
      <polygon points="180,40 244,62 272,140 246,214 180,234 114,210 96,144 124,72" fill="none" stroke="#341625" stroke-width="1.8" stroke-dasharray="5 3"/>
      <g fill="#FBF2E6" stroke="#341625" stroke-width="2">
        <rect x="175" y="35" width="10" height="10"/><rect x="239" y="57" width="10" height="10"/>
        <rect x="267" y="135" width="10" height="10"/><rect x="241" y="209" width="10" height="10"/>
        <rect x="175" y="229" width="10" height="10"/><rect x="109" y="205" width="10" height="10"/>
        <rect x="91" y="139" width="10" height="10"/><rect x="119" y="67" width="10" height="10"/>
      </g>
      <g fill="#29141E">
        <rect x="282" y="54" width="96" height="6" rx="2"/>
        <rect x="292" y="72" width="86" height="6" rx="2"/>
        <rect x="296" y="90" width="82" height="6" rx="2"/>
        <rect x="298" y="108" width="80" height="6" rx="2"/>
        <rect x="298" y="126" width="80" height="6" rx="2"/>
        <rect x="296" y="144" width="82" height="6" rx="2"/>
        <rect x="290" y="162" width="88" height="6" rx="2"/>
        <rect x="282" y="180" width="96" height="6" rx="2"/>
        <rect x="270" y="198" width="108" height="6" rx="2"/>
      </g>
      <text x="210" y="252" text-anchor="middle" fill="#7A362E" font-size="10.5" font-family="JetBrains Mono, monospace">PAGEMAKER 3.0 (1988) · POLYGON HANDLES</text>
    `;
  } else {
    // 2014 W3C CSS Shapes shape-outside
    eraSvg.innerHTML = `
      <rect width="420" height="280" fill="#F3E0C9"/>
      <rect x="22" y="20" width="376" height="240" rx="8" fill="#FBF2E6" stroke="#165156" stroke-width="1.4"/>
      <rect x="22" y="20" width="376" height="24" rx="8" fill="#165156"/>
      <circle cx="38" cy="32" r="4" fill="#C98C7E"/><circle cx="52" cy="32" r="4" fill="#DFC6AA"/><circle cx="66" cy="32" r="4" fill="#6DD5D8"/>
      <text x="86" y="36" fill="#FBF2E6" font-size="10" font-family="JetBrains Mono, monospace">shape-outside: circle(50%); shape-margin: 16px;</text>
      <circle cx="304" cy="142" r="64" fill="#165156"/>
      <circle cx="304" cy="142" r="78" fill="none" stroke="#C98C7E" stroke-width="2" stroke-dasharray="6 4"/>
      <g fill="#29141E">
        <rect x="38" y="64" width="212" height="7" rx="3"/>
        <rect x="38" y="82" width="194" height="7" rx="3"/>
        <rect x="38" y="100" width="180" height="7" rx="3"/>
        <rect x="38" y="118" width="172" height="7" rx="3"/>
        <rect x="38" y="136" width="168" height="7" rx="3"/>
        <rect x="38" y="154" width="172" height="7" rx="3"/>
        <rect x="38" y="172" width="182" height="7" rx="3"/>
        <rect x="38" y="190" width="198" height="7" rx="3"/>
        <rect x="38" y="208" width="224" height="7" rx="3"/>
        <rect x="38" y="226" width="332" height="7" rx="3"/>
      </g>
      <text x="210" y="252" text-anchor="middle" fill="#165156" font-size="10.5" font-family="JetBrains Mono, monospace">W3C CSS SHAPES LEVEL 1 · 2014-03-20 CR</text>
    `;
  }
}

HISTORY_ERAS.forEach((era, idx) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "era-btn";
  btn.dataset.era = era.id;
  btn.setAttribute("role", "tab");
  btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
  btn.innerHTML = `<strong>${era.year}</strong><span>${era.place}</span>`;
  btn.addEventListener("click", () => renderEra(era.id));
  eraSwitcher.appendChild(btn);
});
renderEra("1499");

// ======================================================
// 04 节：轮廓顶点简化与退底工艺对比画布
// ======================================================
const simplifyBar = document.querySelector(".simplify-bar");
const simplifyCanvas = document.getElementById("simplify-canvas");
const simplifyCtx = simplifyCanvas.getContext("2d");
const simplifyInfo = document.getElementById("simplify-info");

let activeSimp = "smooth";

// 生成不同顶点数的花枝器物外包轮廓（坐标系 700×340，图形居中偏左 cx=178, cy=176）
// 真实还原：下方丰润陶瓶 + 上方舒展枝叶的有机剪影，突出「原始毛刺锯齿 vs 平滑外包 8 顶点」
function getSimplifyPoly(id) {
  if (id === "box") {
    return [
      [58, 30],
      [288, 30],
      [288, 306],
      [58, 306],
    ];
  }
  if (id === "smooth") {
    return [
      [196, 30],
      [268, 66],
      [286, 134],
      [268, 214],
      [234, 298],
      [130, 298],
      [74, 214],
      [82, 92],
    ];
  }
  // 真实花枝插瓶原始高噪锯齿轮廓（56 点）或 18 点中度化简轮廓
  const rawPts = [
    [164, 34], [176, 52], [198, 28], [204, 58], [228, 38], [224, 72], [258, 52],
    [240, 86], [280, 74], [248, 106], [286, 102], [244, 126], [288, 134], [240, 148],
    [282, 166], [234, 174], [274, 194], [230, 198], [254, 224], [246, 250], [236, 278],
    [224, 302], [196, 306], [166, 306], [138, 302], [126, 278], [114, 250], [108, 224],
    [122, 196], [82, 192], [116, 172], [72, 162], [112, 146], [68, 132], [110, 124],
    [72, 100], [114, 104], [84, 74], [126, 86], [104, 54], [140, 70], [134, 40],
  ];
  if (id === "raw") return rawPts;
  // 18 点细廓跟随（每 2–3 点采样，略保留枝叶起伏）
  return rawPts.filter((_, i) => i % 2 === 0 && i < 36);
}

const SIMP_SAMPLE =
  "退底图形进入排印软件之后，自动检测边缘往往会把花瓣缺口、枝叶细须甚至像素噪点全部转成折角。只要把绕排路径化简成六到十个平滑外凸折点，文字就会顺着主体大势舒展，不再因细碎毛刺剧烈抖动。这种先抓大形、后放细部的取舍，正是杂志排印里最值钱的手艺。";

function drawSimplifyCanvas() {
  const rect = simplifyCanvas.getBoundingClientRect();
  if (rect.width < 10) return;
  const dpr = pixelRatio(1.5);
  const bw = Math.round(rect.width * dpr);
  const bh = Math.round(rect.height * dpr);
  if (simplifyCanvas.width !== bw || simplifyCanvas.height !== bh) {
    simplifyCanvas.width = bw;
    simplifyCanvas.height = bh;
  }

  const W = 700, H = 340;
  const ctx = simplifyCtx;
  ctx.save();
  ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0);
  ctx.fillStyle = "#FBF2E6";
  ctx.fillRect(0, 0, W, H);

  // 绘制枝叶与陶瓶底图（始终同一艺术主体，仅切换外围绕排多边形）
  const rawArt = getSimplifyPoly("raw");
  ctx.fillStyle = "#165156";
  tracePolyClosed(ctx, rawArt);
  ctx.fill();
  // 下方陶瓶瓶身与月轮釉斑
  ctx.fillStyle = "#341625";
  ctx.beginPath();
  ctx.ellipse(180, 248, 56, 54, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#C98C7E";
  ctx.beginPath();
  ctx.ellipse(180, 224, 42, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#DFC6AA";
  ctx.beginPath();
  ctx.arc(182, 134, 34, 0, Math.PI * 2);
  ctx.fill();

  // 当前所选绕排多边形
  const wrapPoly = getSimplifyPoly(activeSimp);
  const isOk = activeSimp === "smooth";
  const isBad = activeSimp === "raw" || activeSimp === "box";
  const strokeCol = isOk ? "#135752" : isBad ? "#A61F28" : "#8A4F10";

  ctx.save();
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([6, 4]);
  tracePolyClosed(ctx, wrapPoly);
  ctx.stroke();
  ctx.restore();

  // 画出每个多边形控制顶点
  ctx.fillStyle = "#FBF2E6";
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 1.6;
  const dotR = activeSimp === "raw" ? 2.5 : 4.2;
  for (const [px, py] of wrapPoly) {
    ctx.beginPath();
    ctx.arc(px, py, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 右侧真实三射线扫描排字：在行带 [y, y+16] 取最右障碍边界 + 16px，绝不压线
  ctx.font = `400 13.5px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "top";
  let cursor = 0;
  const rightEdge = 676;
  const charW = 14.2;
  const leftStarts = [];
  for (let row = 0; row < 12; row++) {
    const y = 30 + row * 24;
    let maxR = 226;
    for (const sy of [y + 1, y + 8, y + 16]) {
      const segs = scanlineIntervals(wrapPoly, sy);
      if (segs.length) maxR = Math.max(maxR, ...segs.map((s) => s[1]));
    }
    const xStart = Math.max(242, maxR + 16);
    leftStarts.push([xStart, y + 8]);
    const cap = Math.max(6, Math.floor((rightEdge - xStart) / charW));
    let txt = SIMP_SAMPLE.slice(cursor, cursor + cap);
    if (txt.length < cap) {
      txt += SIMP_SAMPLE.slice(0, cap - txt.length);
      cursor = cap - (SIMP_SAMPLE.length - cursor);
    } else {
      cursor += cap;
    }
    ctx.fillStyle = "#29141E";
    ctx.fillText(txt, xStart, y);
  }
  ctx.textBaseline = "alphabetic";

  // 绘制行首折线，直观暴露锯齿抖动 vs 平顺弧线
  ctx.save();
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  leftStarts.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x - 6, y);
    else ctx.lineTo(x - 6, y);
  });
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

let simpDirty = true;
const simpLoop = loop(simplifyCanvas, () => {
  const rect = simplifyCanvas.getBoundingClientRect();
  if (rect.width < 10) return;
  const dpr = pixelRatio(1.5);
  const bw = Math.round(rect.width * dpr);
  const bh = Math.round(rect.height * dpr);
  if (!simpDirty && simplifyCanvas.width === bw && simplifyCanvas.height === bh) return;
  simpDirty = false;
  drawSimplifyCanvas();
});

function renderSimplify(id) {
  activeSimp = id;
  const item = SIMPLIFY_LEVELS.find((l) => l.id === id) || SIMPLIFY_LEVELS[2];
  simplifyBar.querySelectorAll(".simp-btn").forEach((b) => {
    const on = b.dataset.simp === id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  simplifyInfo.innerHTML = `
    <span class="simp-tag is-${item.verdictTone}">${item.verdict}</span>
    <h3>${item.label}</h3>
    <p>${item.desc}</p>
    <dl class="simp-kv">
      <div><dt>字缘节奏</dt><dd>${item.ragScore}</dd></div>
      <div><dt>轮廓贴合</dt><dd>${item.fitScore}</dd></div>
    </dl>
  `;
  simpDirty = true;
  simpLoop.draw();
}

SIMPLIFY_LEVELS.forEach((lv) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "simp-btn";
  btn.dataset.simp = lv.id;
  btn.textContent = lv.label;
  btn.addEventListener("click", () => renderSimplify(lv.id));
  simplifyBar.appendChild(btn);
});
renderSimplify("smooth");
window.addEventListener("resize", () => { simpDirty = true; simpLoop.draw(); });

// ======================================================
// 05 节：六类真实场景筛查卡
// ======================================================
const triageGrid = document.getElementById("triage-grid");

SCENARIO_CARDS.forEach((sc, idx) => {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `triage-card${idx < 2 ? " is-open" : ""}`;
  card.dataset.tone = sc.tone;
  card.setAttribute("aria-expanded", idx < 2 ? "true" : "false");
  card.innerHTML = `
    <span class="triage-top">
      <span class="triage-en">${sc.en}</span>
      <span class="triage-badge is-${sc.tone}">${sc.tag}</span>
    </span>
    <h3>${sc.title}</h3>
    <p class="triage-sum">${sc.summary}</p>
    <p class="triage-detail">${sc.detail}</p>
    <span class="triage-hint">${idx < 2 ? "收起理由 ▲" : "展开排印理由 ▼"}</span>
  `;
  card.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    card.setAttribute("aria-expanded", String(open));
    card.querySelector(".triage-hint").textContent = open ? "收起理由 ▲" : "展开排印理由 ▼";
  });
  triageGrid.appendChild(card);
});

document.querySelectorAll("[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((b) => {
      const on = b.dataset.filter === f;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    triageGrid.querySelectorAll(".triage-card").forEach((c) => {
      c.classList.toggle("is-hidden", f !== "all" && c.dataset.tone !== f);
    });
  });
});

// ======================================================
// 06 节：单变量控制视觉小练习（中立编号 + 精细 SVG 缩略版面）
// ======================================================
const quizList = document.getElementById("quiz-list");

function buildQuizSvg(kind) {
  const pebble = (tx, ty, sc = 1) => `
    <g transform="translate(${tx},${ty}) scale(${sc})">
      <path d="M4 -36 C24 -34 38 -14 40 10 C42 34 26 52 2 56 C-22 60 -40 42 -44 20 C-48 0 -30 -12 -18 -24 C-10 -32 -4 -36 4 -36 Z" fill="#165156"/>
      <circle cx="6" cy="4" r="18" fill="#DFC6AA"/>
      <path d="M-42 22 C-24 18 -6 36 16 28 C28 24 36 28 39 32 C34 46 20 54 2 56 C-20 58 -38 42 -42 22 Z" fill="#341625"/>
      <path d="M-18 48 C-2 38 14 28 36 33 C30 46 18 54 2 56 C-6 57 -12 53 -18 48 Z" fill="#C98C7E"/>
    </g>`;

  const bars = (rows) =>
    rows.map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="4.5" rx="2" fill="#432C35"/>`).join("");

  if (kind === "left-rag") {
    // 单栏左贴绕排：行首大幅进退
    return `<svg viewBox="0 0 220 156" aria-hidden="true">
      <rect width="220" height="156" fill="#FBF2E6"/>
      ${pebble(50, 74, 0.85)}
      ${bars([
        [16, 16, 188], [16, 26, 188],
        [88, 38, 116], [96, 48, 108], [102, 58, 102], [104, 68, 100],
        [102, 78, 102], [96, 88, 108], [88, 98, 116], [76, 108, 128],
        [16, 124, 188], [16, 134, 152],
      ])}
    </svg>`;
  }
  if (kind === "center-split") {
    // 单栏正中：每行被图劈成左右两截
    return `<svg viewBox="0 0 220 156" aria-hidden="true">
      <rect width="220" height="156" fill="#FBF2E6"/>
      ${pebble(110, 74, 0.85)}
      ${bars([
        [16, 16, 188], [16, 26, 188],
        [16, 38, 56], [150, 38, 54],
        [16, 48, 48], [156, 48, 48],
        [16, 58, 44], [158, 58, 46],
        [16, 68, 40], [160, 68, 44],
        [16, 78, 42], [158, 78, 46],
        [16, 88, 48], [154, 88, 50],
        [16, 98, 58], [148, 98, 56],
        [16, 124, 188], [16, 134, 152],
      ])}
    </svg>`;
  }
  if (kind === "right-anchor") {
    // 单栏右贴绕排：左缘笔直，右缘顺弧（正解）
    return `<svg viewBox="0 0 220 156" aria-hidden="true">
      <rect width="220" height="156" fill="#FBF2E6"/>
      ${pebble(168, 74, 0.85)}
      ${bars([
        [16, 16, 188], [16, 26, 188],
        [16, 38, 118], [16, 48, 110], [16, 58, 102], [16, 68, 96],
        [16, 78, 94], [16, 88, 100], [16, 98, 110], [16, 108, 122],
        [16, 124, 188], [16, 134, 152],
      ])}
    </svg>`;
  }
  if (kind === "right-sliver") {
    // 单栏偏右留出 3 字孤缝
    return `<svg viewBox="0 0 220 156" aria-hidden="true">
      <rect width="220" height="156" fill="#FBF2E6"/>
      ${pebble(144, 74, 0.85)}
      ${bars([
        [16, 16, 188], [16, 26, 188],
        [16, 38, 92], [186, 38, 18],
        [16, 48, 86], [190, 48, 14],
        [16, 58, 78], [190, 58, 14],
        [16, 68, 74], [190, 68, 14],
        [16, 78, 74], [188, 78, 16],
        [16, 88, 80], [186, 88, 18],
        [16, 98, 92], [182, 98, 22],
        [16, 124, 188], [16, 134, 152],
      ])}
    </svg>`;
  }
  // 题 2：双栏跨脊对比边界与呼吸距
  const divider = `<line x1="110" y1="14" x2="110" y2="142" stroke="#341625" stroke-opacity="0.16" stroke-dasharray="3 3"/>`;
  if (kind === "rect-box") {
    return `<svg viewBox="0 0 220 156" aria-hidden="true">
      <rect width="220" height="156" fill="#FBF2E6"/>${divider}
      <rect x="66" y="34" width="88" height="92" fill="none" stroke="#341625" stroke-opacity="0.35" stroke-dasharray="4 3"/>
      ${pebble(110, 76, 0.82)}
      ${bars([
        [14, 16, 88], [118, 16, 88],
        [14, 26, 88], [118, 26, 88],
        [14, 38, 46], [160, 38, 46],
        [14, 50, 46], [160, 50, 46],
        [14, 62, 46], [160, 62, 46],
        [14, 74, 46], [160, 74, 46],
        [14, 86, 46], [160, 86, 46],
        [14, 98, 46], [160, 98, 46],
        [14, 110, 46], [160, 110, 46],
        [14, 132, 88], [118, 132, 88],
      ])}
    </svg>`;
  }
  if (kind === "smooth-16") {
    return `<svg viewBox="0 0 220 156" aria-hidden="true">
      <rect width="220" height="156" fill="#FBF2E6"/>${divider}
      ${pebble(110, 76, 0.82)}
      ${bars([
        [14, 16, 88], [118, 16, 88],
        [14, 26, 88], [118, 26, 88],
        [14, 38, 72], [142, 38, 64],
        [14, 50, 64], [150, 50, 56],
        [14, 62, 56], [154, 62, 52],
        [14, 74, 50], [156, 74, 50],
        [14, 86, 52], [154, 86, 52],
        [14, 98, 62], [148, 98, 58],
        [14, 110, 74], [138, 110, 68],
        [14, 132, 88], [118, 132, 88],
      ])}
    </svg>`;
  }
  if (kind === "tight-jagged") {
    return `<svg viewBox="0 0 220 156" aria-hidden="true">
      <rect width="220" height="156" fill="#FBF2E6"/>${divider}
      ${pebble(110, 76, 0.82)}
      ${bars([
        [14, 16, 88], [118, 16, 88],
        [14, 26, 88], [118, 26, 88],
        [14, 38, 79], [134, 38, 72],
        [14, 50, 62], [146, 50, 60],
        [14, 62, 68], [139, 62, 67],
        [14, 74, 57], [147, 74, 59],
        [14, 86, 61], [142, 86, 64],
        [14, 98, 59], [145, 98, 61],
        [14, 110, 77], [130, 110, 76],
        [14, 132, 88], [118, 132, 88],
      ])}
    </svg>`;
  }
  // moat-44：过宽护城河挤扁两栏
  return `<svg viewBox="0 0 220 156" aria-hidden="true">
    <rect width="220" height="156" fill="#FBF2E6"/>${divider}
    ${pebble(110, 76, 0.82)}
    ${bars([
      [14, 16, 88], [118, 16, 88],
      [14, 38, 34], [176, 38, 30],
      [14, 50, 28], [180, 50, 26],
      [14, 62, 24], [182, 62, 24],
      [14, 74, 22], [184, 74, 22],
      [14, 86, 24], [182, 86, 24],
      [14, 98, 28], [180, 98, 26],
      [14, 110, 34], [174, 110, 32],
      [14, 136, 88], [118, 136, 88],
    ])}
  </svg>`;
}

QUIZ_ITEMS.forEach((q) => {
  const box = document.createElement("article");
  box.className = "quiz-box";
  box.innerHTML = `
    <div class="quiz-head">
      <span class="quiz-num">${q.num}</span>
      <span class="quiz-var">${q.variableNote}</span>
    </div>
    <p class="quiz-prompt">${q.prompt}</p>
    <div class="quiz-options" role="group" aria-label="${q.num} 选项"></div>
    <div class="quiz-feedback" aria-live="polite"></div>
  `;
  const optsWrap = box.querySelector(".quiz-options");
  const fb = box.querySelector(".quiz-feedback");

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    btn.dataset.q = q.id;
    btn.dataset.opt = opt.key;
    btn.innerHTML = `${buildQuizSvg(opt.kind)}<span>${opt.caption}</span>`;
    btn.addEventListener("click", () => {
      optsWrap.querySelectorAll(".quiz-opt").forEach((b) => {
        b.classList.remove("is-right", "is-wrong");
      });
      const isCorrect = opt.key === q.answer;
      btn.classList.add(isCorrect ? "is-right" : "is-wrong");
      fb.className = `quiz-feedback is-show ${isCorrect ? "is-right" : "is-wrong"}`;
      fb.textContent = opt.feedback;
    });
    optsWrap.appendChild(btn);
  });

  quizList.appendChild(box);
});

// ======================================================
// 07 节：原海报单次引用 + 可缩放拖拽灯箱
// ======================================================
const posterEl = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbZoomReset = document.getElementById("lb-zoom-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1, lbTx = 0, lbTy = 0, lbDragging = false, lbStart = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterEl.src; // 只复用已内联的一份 poster.webp
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.showModal();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", () => lightbox.close());
lbZoomIn.addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 0.7, 3.2); applyLbTransform(); });
lbZoomOut.addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 0.7, 3.2); applyLbTransform(); });
lbZoomReset.addEventListener("click", () => { lbScale = 1; lbTx = 0; lbTy = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.2);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDragging = true;
  lbStart = { x: e.clientX - lbTx, y: e.clientY - lbTy };
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging || !lbStart) return;
  lbTx = e.clientX - lbStart.x;
  lbTy = e.clientY - lbStart.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDragging = false; });
lbStage.addEventListener("pointercancel", () => { lbDragging = false; });

// 初次首帧立即计算并同步 DOM
recompute();
heroLoop.draw();
