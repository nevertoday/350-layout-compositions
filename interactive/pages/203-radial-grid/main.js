import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { THEMES, PRESETS, createInitialState, clamp, computeModel } from "./model.js";

// ==================== 全局状态与 DOM 句柄 ====================
const state = createInitialState();
let model = computeModel(state);

const canvas = document.getElementById("astrolabe");
const ctx = canvas.getContext("2d");

const ui = {
  statusPill: document.getElementById("status-pill"),
  archSvg: document.getElementById("arch-svg"),
  diagBox: document.getElementById("diag-box"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagNext: document.getElementById("diag-next"),
  coreRange: document.getElementById("core-range"),
  coreVal: document.getElementById("core-val"),
  spokeVal: document.getElementById("spoke-val"),
  rgCore: document.getElementById("rg-core"),
  rgMod: document.getElementById("rg-mod"),
  rgVal: document.getElementById("rg-val"),
  rgSub: document.getElementById("rg-sub"),
  pts: {
    hierarchy: document.getElementById("pt-hierarchy"),
    direction: document.getElementById("pt-direction"),
    motion: document.getElementById("pt-motion"),
    center: document.getElementById("pt-center"),
    radiation: document.getElementById("pt-radiation"),
    modules: document.getElementById("pt-modules"),
  },
};

// ==================== 星盘 2D 绘制引擎（零 shadowBlur，60 FPS） ====================
let cw = 500;
let ch = 500;
let cRadius = 210;
let cx = 250;
let cy = 250;
let hitTargets = [];
let chordPillRect = null;
let needsRedraw = true;
let animCoreR = state.coreR;
let dragging = false;

function resizeAstrolabe() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = pixelRatio(2);
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  cw = w;
  ch = h;
  cx = w / 2;
  cy = h / 2;
  // 留出外环漂移模块、警示标牌与用户图谱外围标签的充裕气口，永不裁切、永不压扁成椭圆
  cRadius = Math.min(w, h) * 0.405;
  needsRedraw = true;
}

// 复刻 203 原海报中心四角星
function drawFourStar(g, x, y, rOut, rIn, color) {
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fillStyle = color;
  g.fill();
}

// 复刻 203 原海报 8 枚金色徽章及扩展图标（绝不画人脸五官）
function drawNodeIcon(g, icon, x, y, r, fg) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = fg;
  g.fillStyle = fg;
  g.lineWidth = Math.max(1.5, r * 0.13);
  g.lineCap = "round";
  g.lineJoin = "round";
  const s = r * 0.56;

  switch (icon) {
    case "asterisk":
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 4;
        g.beginPath();
        g.moveTo(-Math.cos(a) * s, -Math.sin(a) * s);
        g.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        g.stroke();
      }
      break;
    case "bars":
      for (let i = -1; i <= 1; i++) {
        const len = i === 0 ? s * 0.72 : s * 0.95;
        g.beginPath();
        g.moveTo(-s * 0.85, i * s * 0.52);
        g.lineTo(-s * 0.85 + len * 1.75, i * s * 0.52);
        g.stroke();
      }
      break;
    case "frame":
      g.strokeRect(-s * 0.78, -s * 0.65, s * 1.56, s * 1.3);
      g.strokeRect(-s * 0.36, -s * 0.3, s * 0.72, s * 0.6);
      break;
    case "triangle":
      g.beginPath();
      g.moveTo(0, -s * 0.82);
      g.lineTo(s * 0.84, s * 0.66);
      g.lineTo(-s * 0.84, s * 0.66);
      g.closePath();
      g.stroke();
      break;
    case "chevron":
      g.beginPath();
      g.moveTo(-s * 0.68, -s * 0.25);
      g.lineTo(0, s * 0.45);
      g.lineTo(s * 0.68, -s * 0.25);
      g.stroke();
      break;
    case "dots9": {
      const step = s * 0.58;
      const dotR = Math.max(1.5, r * 0.11);
      for (let ry = -1; ry <= 1; ry++) {
        for (let rx = -1; rx <= 1; rx++) {
          g.beginPath();
          g.arc(rx * step, ry * step, dotR, 0, Math.PI * 2);
          g.fill();
        }
      }
      break;
    }
    case "half":
      g.beginPath();
      g.arc(0, 0, s * 0.82, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(0, 0, s * 0.82, Math.PI / 2, (Math.PI * 3) / 2);
      g.closePath();
      g.fill();
      break;
    case "typeT":
      g.beginPath();
      g.moveTo(-s * 0.72, -s * 0.72);
      g.lineTo(s * 0.72, -s * 0.72);
      g.moveTo(0, -s * 0.72);
      g.lineTo(0, s * 0.8);
      g.moveTo(-s * 0.34, s * 0.8);
      g.lineTo(s * 0.34, s * 0.8);
      g.stroke();
      break;
    case "heart":
      g.beginPath();
      g.moveTo(0, s * 0.72);
      g.bezierCurveTo(-s * 1.1, s * 0.1, -s * 0.95, -s * 0.82, 0, -s * 0.25);
      g.bezierCurveTo(s * 0.95, -s * 0.82, s * 1.1, s * 0.1, 0, s * 0.72);
      g.stroke();
      break;
    case "check":
      g.beginPath();
      g.moveTo(-s * 0.68, s * 0.05);
      g.lineTo(-s * 0.15, s * 0.58);
      g.lineTo(s * 0.75, -s * 0.55);
      g.stroke();
      break;
    case "list":
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.arc(-s * 0.65, i * s * 0.55, Math.max(1.5, r * 0.09), 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(-s * 0.28, i * s * 0.55);
        g.lineTo(s * 0.75, i * s * 0.55);
        g.stroke();
      }
      break;
    case "bulb":
      g.beginPath();
      g.arc(0, -s * 0.18, s * 0.55, Math.PI * 0.75, Math.PI * 2.25);
      g.stroke();
      g.beginPath();
      g.moveTo(-s * 0.3, s * 0.52);
      g.lineTo(s * 0.3, s * 0.52);
      g.moveTo(-s * 0.2, s * 0.82);
      g.lineTo(s * 0.2, s * 0.82);
      g.stroke();
      break;
    case "spark":
      drawFourStar(g, 0, 0, s * 0.9, s * 0.28, fg);
      break;
    case "diamond":
      g.beginPath();
      g.moveTo(0, -s * 0.85);
      g.lineTo(s * 0.72, 0);
      g.lineTo(0, s * 0.85);
      g.lineTo(-s * 0.72, 0);
      g.closePath();
      g.stroke();
      break;
    case "ring":
      g.beginPath();
      g.arc(0, 0, s * 0.76, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(0, 0, s * 0.26, 0, Math.PI * 2);
      g.fill();
      break;
    case "cross":
      g.beginPath();
      g.moveTo(-s * 0.72, 0);
      g.lineTo(s * 0.72, 0);
      g.moveTo(0, -s * 0.72);
      g.lineTo(0, s * 0.72);
      g.stroke();
      break;
    case "grid4":
      g.strokeRect(-s * 0.72, -s * 0.72, s * 0.56, s * 0.56);
      g.strokeRect(s * 0.16, -s * 0.72, s * 0.56, s * 0.56);
      g.strokeRect(-s * 0.72, s * 0.16, s * 0.56, s * 0.56);
      g.strokeRect(s * 0.16, s * 0.16, s * 0.56, s * 0.56);
      break;
    default:
      g.beginPath();
      g.arc(0, 0, s * 0.55, 0, Math.PI * 2);
      g.stroke();
      break;
  }
  g.restore();
}

// 极简人物剪影（纯头圆+肩弧，绝无五官）
function drawUserSilhouette(g, x, y, r, color) {
  g.save();
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y - r * 0.22, r * 0.24, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(x, y + r * 0.52, r * 0.44, Math.PI * 1.12, Math.PI * 1.88);
  g.closePath();
  g.fill();
  g.restore();
}

function drawPill(g, text, x, y, bg, border, fg, fontSize = 11.5) {
  g.save();
  g.font = `600 ${fontSize}px "Noto Sans SC", sans-serif`;
  const tw = g.measureText(text).width;
  const pw = tw + 16;
  const ph = fontSize + 10;
  const safeX = clamp(x, pw / 2 + 6, cw - pw / 2 - 6);
  const safeY = clamp(y, ph / 2 + 6, ch - ph / 2 - 6);
  const rx = safeX - pw / 2;
  const ry = safeY - ph / 2;
  const rad = ph / 2;
  g.beginPath();
  g.roundRect(rx, ry, pw, ph, rad);
  g.fillStyle = bg;
  g.fill();
  g.strokeStyle = border;
  g.lineWidth = 1.25;
  g.stroke();
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, safeX, safeY + 0.5);
  g.restore();
  return { x: rx, y: ry, w: pw, h: ph };
}

function renderAstrolabe(t, dt, { still }) {
  const dpr = pixelRatio(2);
  // 0.72s 内完成优雅开场放射显影，确保 0.9s 截图完整清晰
  const reveal = still ? 1 : clamp(t / 0.72, 0, 1);
  const easedReveal = 1 - Math.pow(1 - reveal, 3);

  // 核心半径顺滑跟随（拖拽中 1:1 零延迟）
  if (dragging || still) {
    animCoreR = model.coreR;
  } else {
    const diff = model.coreR - animCoreR;
    if (Math.abs(diff) > 0.0005) {
      animCoreR += diff * Math.min(1, dt * 14);
      needsRedraw = true;
    } else {
      animCoreR = model.coreR;
    }
  }

  const g = ctx;
  g.save();
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, cw, ch);

  const R = model.theme === "userhub" ? cRadius * 0.89 : cRadius;
  const corePx = animCoreR * R * (0.4 + 0.6 * easedReveal);
  const outerPx = model.outerRingR * R;
  const midPx = model.midRingR * R;
  const innerPx = model.innerRingR * R;

  // 1. 深松石绿星盘底盘与细刻度圈
  g.beginPath();
  g.arc(cx, cy, R * 1.07, 0, Math.PI * 2);
  g.fillStyle = "#01352E";
  g.fill();
  g.strokeStyle = "rgba(88, 143, 120, 0.42)";
  g.lineWidth = 1;
  g.stroke();

  // 外缘 72 格天文刻度
  g.strokeStyle = "rgba(238, 183, 61, 0.22)";
  g.lineWidth = 1;
  for (let i = 0; i < 72; i++) {
    const a = (i * Math.PI * 2) / 72;
    const tickIn = i % 6 === 0 ? R * 1.01 : R * 1.035;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * tickIn, cy + Math.sin(a) * tickIn);
    g.lineTo(cx + Math.cos(a) * R * 1.065, cy + Math.sin(a) * R * 1.065);
    g.stroke();
  }

  // 2. 环形快捷轮盘题材：先铺扇区切片底色
  if (model.theme === "piemenu") {
    const n = model.nodes.length;
    for (let i = 0; i < n; i++) {
      const curr = model.nodes[i].baseAngle;
      const prev = model.nodes[(i - 1 + n) % n].baseAngle;
      const next = model.nodes[(i + 1) % n].baseAngle;
      const dPrev = ((curr - prev + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const dNext = ((next - curr + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const a0 = curr - Math.abs(dPrev) * 0.46;
      const a1 = curr + Math.abs(dNext) * 0.46;
      const active = state.activeNode === i;
      const crowded = Math.abs(dPrev) < 0.32 || Math.abs(dNext) < 0.32;
      g.beginPath();
      g.arc(cx, cy, outerPx + 8, a0, a1);
      g.arc(cx, cy, Math.max(corePx + 6, innerPx * 0.65), a1, a0, true);
      g.closePath();
      g.fillStyle = active
        ? "rgba(236, 173, 32, 0.32)"
        : crowded
          ? "rgba(255, 130, 112, 0.16)"
          : i % 2 === 0
            ? "rgba(7, 75, 65, 0.62)"
            : "rgba(3, 56, 48, 0.52)";
      g.fill();
      g.strokeStyle = active ? "#ECAD20" : "rgba(88, 143, 120, 0.4)";
      g.lineWidth = active ? 1.8 : 1;
      g.stroke();
    }
  }

  // 3. 三道同心环（实绘标尺）
  const showRings = model.flow === "spokes-rings" || model.flow === "chords" || model.distribution === "rhythm";
  const ringSpecs = [
    { r: outerPx, stroke: "rgba(236, 173, 32, 0.72)", dash: [], w: 1.25 },
    { r: midPx, stroke: "rgba(236, 173, 32, 0.42)", dash: model.distribution === "rhythm" ? [] : [4, 4], w: 1.05 },
    { r: innerPx, stroke: model.innerClearance < 0.08 ? "rgba(255, 148, 133, 0.85)" : "rgba(236, 173, 32, 0.68)", dash: [], w: 1.15 },
  ];
  for (const rs of ringSpecs) {
    if (!showRings && rs.r === midPx) continue;
    g.save();
    g.beginPath();
    g.arc(cx, cy, rs.r * easedReveal, 0, Math.PI * 2);
    g.strokeStyle = rs.stroke;
    g.lineWidth = rs.w;
    if (rs.dash.length) g.setLineDash(rs.dash);
    g.stroke();
    g.restore();
  }

  // 偏聚错态：在左侧塌空扇区标出赤红提醒弧
  if (model.distribution === "skewed") {
    g.save();
    g.beginPath();
    g.arc(cx, cy, outerPx, Math.PI * 0.68, Math.PI * 1.44);
    g.strokeStyle = "rgba(255, 148, 133, 0.75)";
    g.lineWidth = 3;
    g.setLineDash([6, 6]);
    g.stroke();
    g.restore();
    drawPill(
      g,
      `左侧塌空 ${Math.round(model.sectors.maxDeg)}°`,
      cx - outerPx * 0.66,
      cy + outerPx * 0.08,
      "rgba(42, 16, 15, 0.9)",
      "#FF9485",
      "#FFD5CE",
      11
    );
  }

  // 4. 射线 / 弦线连线层
  chordPillRect = null;
  if (model.flow === "chords") {
    // 跨心乱弦错态
    g.save();
    g.strokeStyle = "rgba(255, 148, 133, 0.62)";
    g.lineWidth = 1.35;
    for (const [i, j] of model.chords) {
      const a = model.nodes[i];
      const b = model.nodes[j];
      g.beginPath();
      g.moveTo(cx + a.x * R * easedReveal, cy + a.y * R * easedReveal);
      g.lineTo(cx + b.x * R * easedReveal, cy + b.y * R * easedReveal);
      g.stroke();
    }
    g.restore();
  } else {
    // 原海报副射线（spokes-rings 模式下在相邻主射线间补细金副射线与内环金点）
    if (model.flow === "spokes-rings" && model.distribution !== "skewed") {
      const n = model.nodes.length;
      g.save();
      g.strokeStyle = "rgba(236, 173, 32, 0.44)";
      g.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const a1 = model.nodes[i].baseAngle;
        const a2 = model.nodes[(i + 1) % n].baseAngle;
        let diff = ((a2 - a1 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        if (diff < 0) diff += Math.PI * 2;
        const midA = a1 + diff / 2;
        const rStart = Math.max(corePx + 4, corePx * 1.06);
        const rEnd = outerPx * easedReveal;
        g.beginPath();
        g.moveTo(cx + Math.cos(midA) * rStart, cy + Math.sin(midA) * rStart);
        g.lineTo(cx + Math.cos(midA) * rEnd, cy + Math.sin(midA) * rEnd);
        g.stroke();
        // 内环交点小金点
        g.beginPath();
        g.arc(cx + Math.cos(midA) * innerPx * easedReveal, cy + Math.sin(midA) * innerPx * easedReveal, 3.2, 0, Math.PI * 2);
        g.fillStyle = "#ECAD20";
        g.fill();
      }
      g.restore();
    }

    // 乳白主射线（原海报标志 #EEF1E0）
    g.save();
    for (const node of model.nodes) {
      const a = node.baseAngle;
      const rStart = Math.max(corePx + 3, corePx * 1.04);
      const rEnd = node.baseRingR * R * easedReveal;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * rStart, cy + Math.sin(a) * rStart);
      g.lineTo(cx + Math.cos(a) * rEnd, cy + Math.sin(a) * rEnd);
      g.strokeStyle = node.drifted ? "rgba(255, 148, 133, 0.55)" : "rgba(238, 241, 224, 0.88)";
      g.lineWidth = node.tier === 1 ? 1.5 : 1.9;
      g.stroke();

      // 内环交点金珠
      g.beginPath();
      g.arc(cx + Math.cos(a) * innerPx * easedReveal, cy + Math.sin(a) * innerPx * easedReveal, 3.6, 0, Math.PI * 2);
      g.fillStyle = "#ECAD20";
      g.fill();
    }
    g.restore();
  }

  // 5. 核心金日圆盘（可横拖缩放）
  const coreBad = !model.pillars.core;
  const pulse = still ? 0 : Math.sin(t * 2.4) * 1.8;

  // 外圈呼吸光环（纯描边，无 shadowBlur）
  g.beginPath();
  g.arc(cx, cy, corePx + 6 + pulse * 0.5, 0, Math.PI * 2);
  g.strokeStyle = coreBad ? "rgba(255, 148, 133, 0.72)" : "rgba(236, 173, 32, 0.36)";
  g.lineWidth = coreBad ? 1.8 : 1.4;
  if (coreBad) g.setLineDash([5, 4]);
  g.stroke();
  g.setLineDash([]);

  // 金日本体
  g.beginPath();
  g.arc(cx, cy, corePx, 0, Math.PI * 2);
  g.fillStyle = coreBad ? "#D9951F" : "#ECAD20";
  g.fill();
  g.strokeStyle = coreBad ? "#FF9485" : "#F2DDB2";
  g.lineWidth = coreBad ? 2.2 : 1.5;
  g.stroke();

  // 圆心题材图形
  if (model.theme === "poster") {
    drawFourStar(g, cx, cy, corePx * 0.54, corePx * 0.14, "#063D30");
  } else if (model.theme === "userhub") {
    drawUserSilhouette(g, cx, cy - corePx * 0.08, corePx * 0.74, "#063D30");
    if (corePx >= 26) {
      g.fillStyle = "#063D30";
      g.font = `700 ${Math.round(clamp(corePx * 0.25, 10, 14))}px "Noto Sans SC", sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("用户", cx, cy + corePx * 0.58);
    }
  } else {
    g.beginPath();
    g.arc(cx, cy, corePx * 0.42, 0, Math.PI * 2);
    g.strokeStyle = "#063D30";
    g.lineWidth = 2;
    g.stroke();
    g.beginPath();
    g.arc(cx, cy, Math.max(3, corePx * 0.12), 0, Math.PI * 2);
    g.fillStyle = "#063D30";
    g.fill();
    if (corePx >= 26) {
      g.fillStyle = "#063D30";
      g.font = `700 ${Math.round(clamp(corePx * 0.24, 10, 13))}px "Noto Sans SC", sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("起点", cx, cy + corePx * 0.65);
    }
  }

  // 圆心边缘双侧横拖微标
  const gripY = cy;
  g.fillStyle = "#063D30";
  for (const dir of [-1, 1]) {
    const gx = cx + dir * (corePx - 6);
    if (corePx > 22) {
      g.beginPath();
      g.moveTo(gx, gripY - 3.5);
      g.lineTo(gx + dir * 4, gripY);
      g.lineTo(gx, gripY + 3.5);
      g.closePath();
      g.fill();
    }
  }

  // 6. 外环与中环模块节点
  hitTargets = [];
  for (const node of model.nodes) {
    const nx = cx + node.x * R * easedReveal;
    const ny = cy + node.y * R * easedReveal;
    const nr = Math.max(12, node.nodeR * R);
    hitTargets.push({ index: node.index, x: nx, y: ny, r: nr + 8, drifted: node.drifted });

    // 若偏轨：画出目标归位幽灵环与引导虚线
    if (node.drifted) {
      const tx = cx + Math.cos(node.baseAngle) * node.baseRingR * R * easedReveal;
      const ty = cy + Math.sin(node.baseAngle) * node.baseRingR * R * easedReveal;
      g.save();
      g.beginPath();
      g.setLineDash([4, 4]);
      g.moveTo(nx, ny);
      g.lineTo(tx, ty);
      g.strokeStyle = "#FF9485";
      g.lineWidth = 1.5;
      g.stroke();
      g.beginPath();
      g.arc(tx, ty, nr * 0.85, 0, Math.PI * 2);
      g.strokeStyle = "rgba(116, 232, 186, 0.72)";
      g.stroke();
      g.restore();
    }

    const isColliding = model.minEdgeGap < 0.035 && (node.index === model.minPair[0] || node.index === model.minPair[1]);

    // 节点圆徽
    g.beginPath();
    g.arc(nx, ny, nr, 0, Math.PI * 2);
    if (model.theme === "userhub") {
      g.fillStyle = node.drifted ? "#3B1615" : "#05332C";
      g.fill();
      g.strokeStyle = node.drifted || isColliding ? "#FF9485" : "#EEB73D";
      g.lineWidth = node.drifted ? 2.2 : 1.6;
      g.stroke();
      drawNodeIcon(g, node.icon, nx, ny, nr * 0.9, node.drifted ? "#FF9485" : "#EEB73D");
    } else if (model.theme === "piemenu") {
      g.fillStyle = state.activeNode === node.index ? "#F2DDB2" : node.drifted ? "#3B1615" : "#074B41";
      g.fill();
      g.strokeStyle = node.drifted || isColliding ? "#FF9485" : "#ECAD20";
      g.lineWidth = 1.6;
      g.stroke();
      g.fillStyle = state.activeNode === node.index ? "#01322B" : "#F2DDB2";
      g.font = `700 ${Math.round(clamp(nr * 0.52, 10, 13))}px "Noto Sans SC", sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(node.label, nx, ny + 0.5);
    } else {
      g.fillStyle = node.drifted ? "#D9755A" : "#EEB73D";
      g.fill();
      g.strokeStyle = node.drifted || isColliding ? "#FF9485" : "#013D35";
      g.lineWidth = node.drifted || isColliding ? 2.2 : 1.4;
      g.stroke();
      drawNodeIcon(g, node.icon, nx, ny, nr, "#063D30");
    }

    // 偏轨赤红警示标
    if (node.drifted) {
      drawPill(g, "偏轨·点归位", nx, ny - nr - 13, "rgba(42, 16, 15, 0.92)", "#FF9485", "#FFD5CE", 10.5);
    } else if (model.theme === "userhub" && model.spokes <= 12) {
      // 用户图谱：外围水平直排中文标签（按左右方位对齐，绝不压圆、绝不倒立）
      const cosA = Math.cos(node.angle);
      const sinA = Math.sin(node.angle);
      let align = "center";
      let lx = nx + cosA * (nr + 12);
      let ly = ny + sinA * (nr + 14);
      if (Math.abs(cosA) > 0.35) {
        align = cosA > 0 ? "left" : "right";
        lx = nx + (cosA > 0 ? nr + 7 : -(nr + 7));
        ly = ny + sinA * 4;
      }
      g.fillStyle = "#F2DDB2";
      g.font = `600 11.5px "Noto Sans SC", sans-serif`;
      g.textAlign = align;
      g.textBaseline = "middle";
      g.fillText(node.label, clamp(lx, 6, cw - 6), clamp(ly, 12, ch - 12));
    }
  }

  // 7. 跨心弦线可点修复标牌 / 核心缩放轻提示（达标态保持纯粹星盘零遮挡）
  if (model.flow === "chords") {
    chordPillRect = drawPill(
      g,
      `交叉弦线 ${model.crossings} 处 · 点改径向`,
      cx,
      cy + corePx + 24,
      "rgba(42, 16, 15, 0.95)",
      "#FF9485",
      "#FFE0DA",
      11.5
    );
  } else if (coreBad) {
    drawPill(
      g,
      model.coreR < 0.2 ? "↔ 横拖放大圆心" : "↔ 横拖收小圆心",
      cx,
      cy + corePx + 20,
      "rgba(1, 50, 43, 0.92)",
      "#FF9485",
      "#FFD5CE",
      11
    );
  }

  g.restore();
  if (reveal >= 1 && Math.abs(model.coreR - animCoreR) <= 0.0005 && !dragging) {
    needsRedraw = false;
  }
}

// ==================== 同步全部 DOM 读数与控件 ====================
function syncUI() {
  model = computeModel(state);

  // 顶栏状态
  ui.statusPill.textContent = model.allOk ? "4 / 4 秩序成立" : `${model.passedCount} / 4 待校准`;
  ui.statusPill.classList.toggle("is-ok", model.allOk);
  ui.statusPill.classList.toggle("is-err", !model.allOk);

  // 自示范拱形大标呼应当前平衡状态
  if (!reducedMotion.matches) {
    const sy = 0.88 + model.archLift * 0.14;
    ui.archSvg.style.transform = `rotate(${model.archTiltDeg}deg) scaleY(${sy.toFixed(3)})`;
  } else {
    ui.archSvg.style.transform = "none";
  }

  // 六大要点实时标签
  for (const [k, el] of Object.entries(ui.pts)) {
    const info = model.sixPoints[k];
    if (!el || !info) continue;
    el.textContent = info.tag;
    el.classList.toggle("is-ok", info.ok);
    el.classList.toggle("is-err", !info.ok);
  }

  // 左侧面积比微图（完全由 model 实算）
  const rCoreSvg = clamp(model.coreR * 74, 8, 30);
  const outerModR = model.nodes.length ? model.nodes[0].nodeR : 0.1;
  const rModSvg = clamp(outerModR * 74, 6, 16);
  ui.rgCore.setAttribute("r", rCoreSvg.toFixed(1));
  ui.rgMod.setAttribute("r", rModSvg.toFixed(1));
  ui.rgVal.textContent = `${model.areaRatio.toFixed(1)}×`;
  ui.rgSub.textContent = `半径 ${Math.round(model.coreR * 100)}% · ${model.spokes} 路`;

  // 右翼单真源诊单
  ui.diagBox.classList.toggle("is-ok", model.allOk);
  ui.diagBox.classList.toggle("is-err", !model.allOk);
  if (model.allOk) {
    ui.diagBadge.textContent = `达标 · ${model.solutionName}`;
    ui.diagTitle.textContent = `中心占 ${model.areaRatio.toFixed(1)} 倍面积，${model.spokes} 路放射秩序成立`;
    ui.diagWhy.textContent = `当前圆心半径 ${Math.round(model.coreR * 100)}%、相邻扇角均匀清晰、所有模块稳落同心环交点，视线会自然先锚定圆心，再沿径向轻松扫读每一层模块。`;
    ui.diagNext.textContent = "可以继续尝试点击任意模块制造偏轨，或切换不同题材与「十二射线韵律解」观察多组正当解。";
  } else {
    const err = model.primaryError;
    ui.diagBadge.textContent = `错态 (${model.passedCount}/4) · ${err.badge}`;
    ui.diagTitle.textContent = err.title;
    ui.diagWhy.textContent = err.why;
    ui.diagNext.textContent = `下一步：${err.next}`;
  }

  // 同步下方控槽
  ui.coreRange.value = String(Math.round(state.coreR * 100));
  ui.coreVal.textContent = `${Math.round(state.coreR * 100)}%`;
  ui.spokeVal.textContent = `${state.spokes} 路`;

  document.querySelectorAll(".theme-btn").forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-spokes]").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.spokes) === state.spokes);
  });
  document.querySelectorAll("[data-dist]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.dist === state.distribution);
  });
  document.querySelectorAll("[data-decay]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.decay === state.decay);
  });
  document.querySelectorAll("[data-flow]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.flow === state.flow);
  });

  needsRedraw = true;
}

// ==================== 星盘画布直接交互（Pointer + Touch + Keyboard） ====================
const astrolabeLoop = loop(canvas, (t, dt, { still }) => {
  renderAstrolabe(t, dt, { still });
});

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

let dragStartX = 0;
let dragStartY = 0;
let dragStartCore = 0.25;
let dragMoved = false;

canvas.addEventListener("pointerdown", (e) => {
  const p = canvasPoint(e);
  dragStartX = p.x;
  dragStartY = p.y;
  dragStartCore = state.coreR;
  dragMoved = false;
  dragging = true;
  if (canvas.setPointerCapture) {
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const dx = p.x - dragStartX;
  const dy = p.y - dragStartY;
  if (Math.hypot(dx, dy) > 4) dragMoved = true;
  if (Math.abs(dx) >= 2) {
    // 左右横拖连续调节核心半径（全幅 0.10..0.42）
    const nextCore = Math.round(clamp(dragStartCore + (dx / Math.max(140, cRadius * 1.1)) * 0.24, 0.1, 0.42) * 100) / 100;
    if (nextCore !== state.coreR) {
      state.coreR = nextCore;
      syncUI();
      if (reducedMotion.matches) astrolabeLoop.draw();
    }
  }
});

function endDrag(e) {
  if (!dragging) return;
  dragging = false;
  if (!dragMoved && e) {
    const p = canvasPoint(e);
    // 1. 优先命中交叉弦线修复标牌
    if (
      chordPillRect &&
      p.x >= chordPillRect.x &&
      p.x <= chordPillRect.x + chordPillRect.w &&
      p.y >= chordPillRect.y &&
      p.y <= chordPillRect.y + chordPillRect.h
    ) {
      state.flow = "spokes-rings";
      syncUI();
      astrolabeLoop.draw();
      return;
    }
    // 2. 命中任意模块节点：若偏轨则归环；若已规整则点选/切偏轨试错
    for (const hit of hitTargets) {
      if (Math.hypot(p.x - hit.x, p.y - hit.y) <= hit.r) {
        if (hit.drifted) {
          state.driftIds = state.driftIds.filter((id) => id !== hit.index);
        } else if (state.theme === "piemenu") {
          state.activeNode = state.activeNode === hit.index ? -1 : hit.index;
        } else {
          state.driftIds = [...state.driftIds, hit.index];
        }
        syncUI();
        astrolabeLoop.draw();
        return;
      }
    }
  } else {
    // 结束横拖时在 0.25 附近轻吸附（误差 < 0.008）
    if (Math.abs(state.coreR - 0.25) < 0.008) {
      state.coreR = 0.25;
      syncUI();
    }
    astrolabeLoop.draw();
  }
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { dragging = false; });

canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.coreR = clamp(Math.round((state.coreR + 0.02) * 100) / 100, 0.1, 0.42);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.coreR = clamp(Math.round((state.coreR - 0.02) * 100) / 100, 0.1, 0.42);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.spokes = clamp(state.spokes + 1, 3, 16);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.spokes = clamp(state.spokes - 1, 3, 16);
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (state.driftIds.length > 0) state.driftIds = state.driftIds.slice(1);
    else if (state.flow === "chords") state.flow = "spokes-rings";
    else state.distribution = state.distribution === "equal" ? "rhythm" : "equal";
  } else {
    return;
  }
  syncUI();
  astrolabeLoop.draw();
});

// 控槽事件绑定
ui.coreRange.addEventListener("input", () => {
  state.coreR = clamp(Number(ui.coreRange.value) / 100, 0.1, 0.42);
  syncUI();
  astrolabeLoop.draw();
});

document.querySelectorAll(".theme-btn").forEach((b) => {
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    state.activeNode = -1;
    syncUI();
    astrolabeLoop.draw();
  });
});

document.querySelectorAll("[data-spokes]").forEach((b) => {
  b.addEventListener("click", () => {
    state.spokes = Number(b.dataset.spokes);
    state.driftIds = state.driftIds.filter((id) => id < state.spokes);
    syncUI();
    astrolabeLoop.draw();
  });
});

document.querySelectorAll("[data-dist]").forEach((b) => {
  b.addEventListener("click", () => {
    state.distribution = b.dataset.dist;
    syncUI();
    astrolabeLoop.draw();
  });
});

document.querySelectorAll("[data-decay]").forEach((b) => {
  b.addEventListener("click", () => {
    state.decay = b.dataset.decay;
    syncUI();
    astrolabeLoop.draw();
  });
});

document.querySelectorAll("[data-flow]").forEach((b) => {
  b.addEventListener("click", () => {
    state.flow = b.dataset.flow;
    syncUI();
    astrolabeLoop.draw();
  });
});

document.querySelectorAll("[data-preset]").forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    state.coreR = p.coreR;
    state.spokes = p.spokes;
    state.distribution = p.distribution;
    state.decay = p.decay;
    state.flow = p.flow;
    state.driftIds = [...p.driftIds];
    state.activeNode = -1;
    syncUI();
    astrolabeLoop.draw();
  });
});

// ==================== 01 节交互：等距直达 vs 线性栈路径对比 ====================
const fittsRadialSvg = document.getElementById("fitts-radial-svg");
const fittsLinearSvg = document.getElementById("fitts-linear-svg");
const fittsRDist = document.getElementById("fitts-r-dist");
const fittsLDist = document.getElementById("fitts-l-dist");
const fittsLIdx = document.getElementById("fitts-l-idx");
const fittsReadout = document.getElementById("fitts-readout");

function renderFitts(targetIdx) {
  const radR = 76;
  const rcx = 160;
  const rcy = 115;
  const ang = -Math.PI / 2 + ((targetIdx - 1) * Math.PI * 2) / 8;
  const tx = rcx + Math.cos(ang) * radR;
  const ty = rcy + Math.sin(ang) * radR;

  let rSvg = `<circle cx="${rcx}" cy="${rcy}" r="${radR}" fill="none" stroke="#588F78" stroke-dasharray="4 4" stroke-width="1.2"/>`;
  for (let i = 1; i <= 8; i++) {
    const a = -Math.PI / 2 + ((i - 1) * Math.PI * 2) / 8;
    const x = rcx + Math.cos(a) * radR;
    const y = rcy + Math.sin(a) * radR;
    const hit = i === targetIdx;
    rSvg += `<line x1="${rcx}" y1="${rcy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${hit ? "#ECAD20" : "rgba(238,241,224,0.28)"}" stroke-width="${hit ? 2.6 : 1}"/>`;
    rSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${hit ? 16 : 13}" fill="${hit ? "#ECAD20" : "#074B41"}" stroke="${hit ? "#F2DDB2" : "#588F78"}" stroke-width="1.4"/>`;
    rSvg += `<text x="${x.toFixed(1)}" y="${(y + 4.5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" fill="${hit ? "#01322B" : "#F2DDB2"}">${i}</text>`;
  }
  rSvg += `<circle cx="${rcx}" cy="${rcy}" r="18" fill="#F2DDB2" stroke="#01322B" stroke-width="2"/>`;
  rSvg += `<text x="${rcx}" y="${rcy + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#01322B">起点</text>`;
  rSvg += `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="21" fill="none" stroke="#74E8BA" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  fittsRadialSvg.innerHTML = rSvg;

  // 右侧线性竖排 8 项
  const startY = 20;
  const rowStep = 24;
  const rowX = 112;
  const targetY = startY + targetIdx * rowStep;
  const linDist = targetIdx * 24 + 14;
  let lSvg = `<rect x="${rowX}" y="8" width="144" height="22" rx="4" fill="#F2DDB2"/>`;
  lSvg += `<text x="${rowX + 72}" y="23" text-anchor="middle" font-size="11" font-weight="700" fill="#01322B">起点（顶部入口）</text>`;
  for (let i = 1; i <= 8; i++) {
    const y = startY + i * rowStep - 10;
    const hit = i === targetIdx;
    lSvg += `<rect x="${rowX}" y="${y}" width="144" height="20" rx="4" fill="${hit ? "#ECAD20" : "#074B41"}" stroke="${hit ? "#F2DDB2" : "#588F78"}" stroke-width="1.2"/>`;
    lSvg += `<text x="${rowX + 18}" y="${y + 14}" font-family="JetBrains Mono, monospace" font-size="11.5" font-weight="600" fill="${hit ? "#01322B" : "#F2DDB2"}">#${i}</text>`;
    lSvg += `<text x="${rowX + 82}" y="${y + 14}" text-anchor="middle" font-size="11" fill="${hit ? "#01322B" : "#D6E1D9"}">列表项 ${i}</text>`;
  }
  lSvg += `<line x1="76" y1="19" x2="76" y2="${targetY}" stroke="#FF9485" stroke-width="2.5"/>`;
  lSvg += `<circle cx="76" cy="19" r="4" fill="#F2DDB2"/>`;
  lSvg += `<circle cx="76" cy="${targetY}" r="5" fill="#FF9485"/>`;
  lSvg += `<text x="64" y="${(19 + targetY) / 2 + 4}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#FF9485">${linDist}</text>`;
  fittsLinearSvg.innerHTML = lSvg;

  fittsRDist.textContent = `${radR} 单位`;
  fittsLDist.textContent = `${linDist} 单位`;
  fittsLIdx.textContent = String(targetIdx);
  const ratio = (linDist / radR).toFixed(2);
  if (targetIdx <= 2) {
    fittsReadout.textContent = `选中第 ${targetIdx} 项时，因为目标紧挨顶部入口，线性列表行程较短（${linDist} vs ${radR}）；但只要往下点到第 4 项之后，线性列表的行程就会迅速超过放射布局。`;
  } else {
    fittsReadout.textContent = `选中第 ${targetIdx} 项时，线性竖排的行程已是放射环形方案的 ${ratio} 倍（${linDist} vs ${radR}）。1988 年 ACM CHI 实验正因此证明：8 项环形菜单比线性下拉菜单快约 15% 且误触更少。`;
  }

  document.querySelectorAll(".num-btn").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.target) === targetIdx);
  });
}

document.querySelectorAll(".num-btn").forEach((b) => {
  b.addEventListener("click", () => renderFitts(Number(b.dataset.target)));
});

// ==================== 02 节交互：点阵星芒节奏合成仪（2D Canvas） ====================
const sbCanvas = document.getElementById("starburst");
const sbCtx = sbCanvas.getContext("2d");
const sbState = { mode: "even", count: 24, innerPct: 26 };

const sbUI = {
  countVal: document.getElementById("sb-count-val"),
  innerVal: document.getElementById("sb-inner-val"),
  innerRange: document.getElementById("sb-inner"),
  badge: document.getElementById("sb-badge"),
  text: document.getElementById("sb-text"),
};

function renderStarburst(t, _dt, { still }) {
  const rect = sbCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = pixelRatio(2);
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (sbCanvas.width !== Math.round(w * dpr) || sbCanvas.height !== Math.round(h * dpr)) {
    sbCanvas.width = Math.round(w * dpr);
    sbCanvas.height = Math.round(h * dpr);
  }
  const g = sbCtx;
  g.save();
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);

  const sx = w / 2;
  const sy = h / 2;
  const maxR = Math.min(w, h) * 0.46;
  const innerR = (sbState.innerPct / 100) * maxR;
  const rings = 9;
  const phase = still ? 0 : t * 0.14;

  // 实算内环相邻射线起点弧距 vs 点直径
  const innerArc = (2 * Math.PI * innerR) / sbState.count;
  const innerDotDia = 7.4;
  const crowded = innerArc < innerDotDia * 1.15;

  // 若拥挤，画出内环赤红打结警示圈
  if (crowded) {
    g.beginPath();
    g.arc(sx, sy, innerR + 4, 0, Math.PI * 2);
    g.strokeStyle = "rgba(255, 148, 133, 0.85)";
    g.lineWidth = 1.6;
    g.setLineDash([4, 3]);
    g.stroke();
    g.setLineDash([]);
  } else {
    g.beginPath();
    g.arc(sx, sy, innerR - 4, 0, Math.PI * 2);
    g.strokeStyle = "rgba(116, 232, 186, 0.45)";
    g.lineWidth = 1;
    g.stroke();
  }

  for (let i = 0; i < sbState.count; i++) {
    const baseA = (i * Math.PI * 2) / sbState.count - Math.PI / 2;
    const isMajor = i % 2 === 0;
    const ringCount = sbState.mode === "alternate" && !isMajor ? rings - 2 : rings;

    for (let k = 0; k < ringCount; k++) {
      const u = k / (rings - 1);
      const r = innerR + u * (maxR - innerR);
      const twist = sbState.mode === "spiral" ? u * 0.45 + phase * 0.35 : 0;
      const a = baseA + twist;
      const dotR = (1 - u * 0.68) * (sbState.mode === "alternate" && !isMajor ? 2.6 : 3.7);
      const alpha = 1 - u * 0.42;
      g.beginPath();
      g.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, Math.max(1.1, dotR), 0, Math.PI * 2);
      g.fillStyle = crowded && k < 2
        ? `rgba(255, 148, 133, ${alpha.toFixed(2)})`
        : `rgba(236, 173, 32, ${alpha.toFixed(2)})`;
      g.fill();
    }
  }
  g.restore();
}

function updateStarburstUI() {
  sbUI.countVal.textContent = `${sbState.count} 束`;
  sbUI.innerVal.textContent = `${sbState.innerPct}%`;
  sbUI.innerRange.value = String(sbState.innerPct);
  document.querySelectorAll("[data-sb-mode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.sbMode === sbState.mode);
  });

  // 与画布同公式核算内环弧距比（以基准半径 140px 等价比）
  const innerArc = (2 * Math.PI * (sbState.innerPct / 100) * 140) / sbState.count;
  const gapRatio = innerArc / 7.4;
  const crowded = gapRatio < 1.15;
  sbUI.badge.classList.toggle("is-err", crowded);
  sbUI.badge.classList.toggle("is-ok", !crowded);
  if (crowded) {
    sbUI.badge.textContent = `圆心打结 · 内环弧距比 ${gapRatio.toFixed(2)}×`;
    sbUI.text.textContent = `${sbState.count} 束射线汇到仅 ${sbState.innerPct}% 的内环上，起点间距已小于安全间隙，中心糊成红圈警示带。拉大「内环留白半径」或减少束数即可解开。`;
  } else {
    sbUI.badge.textContent = `圆心疏朗 · 内环弧距比 ${gapRatio.toFixed(2)}×`;
    sbUI.text.textContent = `${sbState.count} 束星芒在内环 ${sbState.innerPct}% 处起笔，既保留清晰中心呼吸区，又以点径由内向外衰减呈现原海报式放射节奏。`;
  }
  sbLoop.draw();
}

const sbLoop = loop(sbCanvas, renderStarburst);

document.querySelectorAll("[data-sb-mode]").forEach((b) => {
  b.addEventListener("click", () => {
    sbState.mode = b.dataset.sbMode;
    updateStarburstUI();
  });
});
document.getElementById("sb-dec").addEventListener("click", () => {
  sbState.count = clamp(sbState.count - 4, 8, 40);
  updateStarburstUI();
});
document.getElementById("sb-inc").addEventListener("click", () => {
  sbState.count = clamp(sbState.count + 4, 8, 40);
  updateStarburstUI();
});
sbUI.innerRange.addEventListener("input", () => {
  sbState.innerPct = Number(sbUI.innerRange.value);
  updateStarburstUI();
});

// ==================== 03 节交互：暗室四案错例/修正 ====================
const CASES = {
  donut: {
    badTag: "错例诊断 · 无核平权",
    okTag: "修正结果 · 强核定锚",
    badTitle: "中心放空，外圈六个同大圆彼此抢戏",
    okTitle: "确立大号中心圆盘，外圈降级归环",
    badDesc: "把 6 个章节围成一圈却忘了在圆心放主标题或核心图形，读者视线会顺着圆环无休止打转，分不清从哪一条开始读、也看不出它们围绕什么主题展开。",
    okDesc: "圆心体量扩至外环模块的 2.2 倍直径，视线一进画框立刻落锚圆心，再沿径向短线轻松扫读 6 项二级模块，主次一目了然。",
    fixRule: "在圆心立住体量最大、对比最强的总标题或核心标识，外圈模块降一级缩小，并标出 12 点钟起始锚点。",
  },
  jam: {
    badTag: "错例诊断 · 辐条挤心",
    okTag: "修正结果 · 减路留白双环错层",
    badTitle: "16 条直线硬插圆心，中央糊成蜘蛛网",
    okTitle: "删减冗余细线 + 内环留呼吸死区",
    badDesc: "把 16 项内容全部拉直线直插圆心一点，中心附近线条互相吞没，视觉噪音极重，反而把最该清晰的圆心淹没。",
    okDesc: "收束为 8 路主射线并在中心外围留出清晰呼吸环带，射线从内环外缘起笔，圆心干净透亮，每条支路清晰可追。",
    fixRule: "主内容单环控制在 4–8 路（经验值）；超过 8 路时改用内外双环交错，并让射线在核心留白环外缘起笔。",
  },
  upside: {
    badTag: "错例诊断 · 下半圆倒字",
    okTag: "修正结果 · 水平直排或底弧翻转",
    badTitle: "文字死板沿圆周旋转，下半圈全员头朝下",
    okTitle: "外围模块改水平直排，全盘零歪头阅读",
    badDesc: "照着几何角度把每个标签顺时针旋一圈，结果 4 点到 8 点钟方向的中文全部倒立，观众得歪着脖子才能勉强辨认。",
    okDesc: "射线定方向，文字保水平：除极短装饰英文弧标外，功能性中文标签一律保持水平正向排版，兼顾放射美感与阅读效率。",
    fixRule: "放射网格里「位置走极坐标，文字走水平直排」；若必须排弧形字，下半圆必须逆向翻正基线。",
  },
  wedge: {
    badTag: "错例诊断 · 扇区硬塞长文",
    okTag: "修正结果 · 扇区留关键词，长文回直角栏",
    badTitle: "把多行段落硬塞进上窄下宽的扇形格子",
    okTitle: "圆盘只放短词索引，详细正文走独立说明栏",
    badDesc: "扇形靠圆心处极窄、靠外缘极宽，硬排整段文字会导致第一行挤成 2 个字、最后一行拉成 18 个字，断行支离破碎。",
    okDesc: "就像 203 原海报的做法：星盘里只放 2–4 字短标与图形徽章，较长的解释文字整齐排在星盘两侧的水平文本框中。",
    fixRule: "放射模块只承载短词、图标与数值；超过两行的说明交给水平文本框，长文直接改用 194 手稿或 195 分栏网格。",
  },
};

const caseState = { id: "donut", fixed: false, guides: true };
const caseSvg = document.getElementById("case-svg");
const caseFixBtn = document.getElementById("case-fix-btn");
const caseGuideBtn = document.getElementById("case-guide-btn");

function renderCase() {
  const c = CASES[caseState.id];
  const fixed = caseState.fixed;
  const gOn = caseState.guides;

  document.getElementById("case-tag").textContent = fixed ? c.okTag : c.badTag;
  document.getElementById("case-tag").classList.toggle("is-ok", fixed);
  document.getElementById("case-title").textContent = fixed ? c.okTitle : c.badTitle;
  document.getElementById("case-desc").textContent = fixed ? c.okDesc : c.badDesc;
  document.getElementById("case-fix").innerHTML = `<strong>修正原则：</strong>${c.fixRule}`;

  caseFixBtn.textContent = fixed ? "当前：已修正 · 点回错例" : "当前：错例 · 点看修正";
  caseFixBtn.classList.toggle("is-ok", fixed);
  caseFixBtn.classList.toggle("is-err", !fixed);
  caseFixBtn.setAttribute("aria-pressed", String(fixed));

  caseGuideBtn.textContent = gOn ? "标尺透视：开" : "标尺透视：关";
  caseGuideBtn.classList.toggle("is-active", gOn);
  caseGuideBtn.setAttribute("aria-pressed", String(gOn));

  document.querySelectorAll(".case-tab").forEach((b) => {
    const on = b.dataset.case === caseState.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  const cx0 = 270;
  const cy0 = 170;
  let s = "";

  if (caseState.id === "donut") {
    s += `<circle cx="${cx0}" cy="${cy0}" r="112" fill="none" stroke="#588F78" stroke-dasharray="4 4"/>`;
    if (fixed) {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
        const x = cx0 + Math.cos(a) * 112;
        const y = cy0 + Math.sin(a) * 112;
        s += `<line x1="${cx0 + Math.cos(a) * 52}" y1="${cy0 + Math.sin(a) * 52}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#EEF1E0" stroke-width="1.6"/>`;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="#074B41" stroke="#EEB73D" stroke-width="1.6"/>`;
        s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="11.5" fill="#F2DDB2">0${i + 1}</text>`;
      }
      s += `<circle cx="${cx0}" cy="${cy0}" r="48" fill="#ECAD20" stroke="#F2DDB2" stroke-width="2"/>`;
      s += `<text x="${cx0}" y="${cy0 + 5}" text-anchor="middle" font-size="15" font-weight="800" fill="#01322B">核心主题</text>`;
      if (gOn) s += `<text x="18" y="28" font-family="JetBrains Mono, monospace" font-size="12" fill="#74E8BA">核心直径 2.2× · 锚点明确</text>`;
    } else {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
        const x = cx0 + Math.cos(a) * 112;
        const y = cy0 + Math.sin(a) * 112;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="30" fill="#EEB73D" stroke="#01322B" stroke-width="1.5"/>`;
        s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#01322B">模块 ${i + 1}</text>`;
      }
      if (gOn) {
        s += `<circle cx="${cx0}" cy="${cy0}" r="36" fill="none" stroke="#FF9485" stroke-width="2" stroke-dasharray="5 4"/>`;
        s += `<text x="${cx0}" y="${cy0 + 4}" text-anchor="middle" font-size="12" fill="#FF9485">圆心空缺</text>`;
        s += `<text x="18" y="28" font-family="JetBrains Mono, monospace" font-size="12" fill="#FF9485">6 块同大平权 · 视线循环打转</text>`;
      }
    }
  } else if (caseState.id === "jam") {
    if (fixed) {
      s += `<circle cx="${cx0}" cy="${cy0}" r="118" fill="none" stroke="#588F78"/>`;
      s += `<circle cx="${cx0}" cy="${cy0}" r="60" fill="none" stroke="#74E8BA" stroke-dasharray="4 4"/>`;
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 8;
        s += `<line x1="${(cx0 + Math.cos(a) * 58).toFixed(1)}" y1="${(cy0 + Math.sin(a) * 58).toFixed(1)}" x2="${(cx0 + Math.cos(a) * 118).toFixed(1)}" y2="${(cy0 + Math.sin(a) * 118).toFixed(1)}" stroke="#EEF1E0" stroke-width="1.8"/>`;
        s += `<circle cx="${(cx0 + Math.cos(a) * 118).toFixed(1)}" cy="${(cy0 + Math.sin(a) * 118).toFixed(1)}" r="16" fill="#EEB73D"/>`;
      }
      s += `<circle cx="${cx0}" cy="${cy0}" r="42" fill="#ECAD20"/>`;
      s += `<text x="${cx0}" y="${cy0 + 4}" text-anchor="middle" font-size="13" font-weight="800" fill="#01322B">呼吸环带</text>`;
      if (gOn) s += `<text x="18" y="28" font-family="JetBrains Mono, monospace" font-size="12" fill="#74E8BA">8 路主射线 · 留 18px 呼吸死区</text>`;
    } else {
      for (let i = 0; i < 20; i++) {
        const a = (i * Math.PI * 2) / 20;
        s += `<line x1="${cx0}" y1="${cy0}" x2="${(cx0 + Math.cos(a) * 124).toFixed(1)}" y2="${(cy0 + Math.sin(a) * 124).toFixed(1)}" stroke="#FF9485" stroke-width="2.1" opacity="0.82"/>`;
        s += `<circle cx="${(cx0 + Math.cos(a) * 124).toFixed(1)}" cy="${(cy0 + Math.sin(a) * 124).toFixed(1)}" r="12" fill="#D9951F"/>`;
      }
      s += `<circle cx="${cx0}" cy="${cy0}" r="20" fill="#2A100F" stroke="#FF9485" stroke-width="2"/>`;
      if (gOn) {
        s += `<circle cx="${cx0}" cy="${cy0}" r="48" fill="rgba(255,148,133,0.18)" stroke="#FF9485" stroke-dasharray="4 4"/>`;
        s += `<text x="18" y="28" font-family="JetBrains Mono, monospace" font-size="12" fill="#FF9485">20 路直插圆心 · 中心挤成墨团</text>`;
      }
    }
  } else if (caseState.id === "upside") {
    const labels = ["核心主题", "关键数据", "用户需求", "解决方案", "执行步骤", "相关概念"];
    s += `<circle cx="${cx0}" cy="${cy0}" r="102" fill="none" stroke="#588F78" stroke-dasharray="4 4"/>`;
    s += `<circle cx="${cx0}" cy="${cy0}" r="36" fill="#ECAD20"/>`;
    s += `<text x="${cx0}" y="${cy0 + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#01322B">原点</text>`;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
      const x = cx0 + Math.cos(a) * 102;
      const y = cy0 + Math.sin(a) * 102;
      s += `<line x1="${(cx0 + Math.cos(a) * 40).toFixed(1)}" y1="${(cy0 + Math.sin(a) * 40).toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#EEF1E0" stroke-width="1.4"/>`;
      if (fixed) {
        s += `<rect x="${(x - 36).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="72" height="28" rx="6" fill="#074B41" stroke="#74E8BA" stroke-width="1.4"/>`;
        s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="12" fill="#F2DDB2">${labels[i]}</text>`;
      } else {
        const deg = (a * 180) / Math.PI + 90;
        const bad = deg > 95 && deg < 265;
        s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})">`;
        s += `<rect x="-36" y="-14" width="72" height="28" rx="6" fill="${bad ? "#3B1615" : "#074B41"}" stroke="${bad ? "#FF9485" : "#EEB73D"}" stroke-width="1.4"/>`;
        s += `<text x="0" y="4" text-anchor="middle" font-size="12" fill="${bad ? "#FFD5CE" : "#F2DDB2"}">${labels[i]}</text></g>`;
      }
    }
    if (gOn) {
      s += `<text x="18" y="28" font-family="JetBrains Mono, monospace" font-size="12" fill="${fixed ? "#74E8BA" : "#FF9485"}">${fixed ? "全部 0° 水平直排 · 零倒字" : "底部 3 项旋转 120°–240° 倒立难读"}</text>`;
    }
  } else {
    // wedge
    if (fixed) {
      s += `<circle cx="170" cy="${cy0}" r="88" fill="none" stroke="#588F78" stroke-dasharray="4 4"/>`;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
        const x = 170 + Math.cos(a) * 88;
        const y = cy0 + Math.sin(a) * 88;
        s += `<line x1="${(170 + Math.cos(a) * 38).toFixed(1)}" y1="${(cy0 + Math.sin(a) * 38).toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#EEF1E0" stroke-width="1.4"/>`;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" fill="#EEB73D"/>`;
      }
      s += `<circle cx="170" cy="${cy0}" r="34" fill="#ECAD20"/>`;
      s += `<text x="170" y="${cy0 + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#01322B">短词盘</text>`;
      s += `<rect x="305" y="76" width="208" height="188" rx="8" fill="#074B41" stroke="#74E8BA" stroke-width="1.4"/>`;
      s += `<text x="322" y="106" font-size="13" font-weight="700" fill="#F2DDB2">侧栏水平正文区</text>`;
      s += `<rect x="322" y="122" width="170" height="8" rx="2" fill="#D6E1D9" opacity="0.7"/>`;
      s += `<rect x="322" y="140" width="156" height="8" rx="2" fill="#D6E1D9" opacity="0.7"/>`;
      s += `<rect x="322" y="158" width="164" height="8" rx="2" fill="#D6E1D9" opacity="0.7"/>`;
      s += `<rect x="322" y="184" width="170" height="8" rx="2" fill="#D6E1D9" opacity="0.55"/>`;
      s += `<rect x="322" y="202" width="134" height="8" rx="2" fill="#D6E1D9" opacity="0.55"/>`;
      if (gOn) s += `<text x="18" y="28" font-family="JetBrains Mono, monospace" font-size="12" fill="#74E8BA">星盘定关系 · 矩形栏排长句</text>`;
    } else {
      // 大扇区强塞长文本
      s += `<path d="M ${cx0} ${cy0} L ${cx0 - 110} ${cy0 - 120} A 162 162 0 0 1 ${cx0 + 110} ${cy0 - 120} Z" fill="#3B1615" stroke="#FF9485" stroke-width="1.8"/>`;
      s += `<text x="${cx0}" y="${cy0 - 94}" text-anchor="middle" font-size="12" fill="#FFD5CE">这一整段说明文字被迫顺着扇形</text>`;
      s += `<text x="${cx0}" y="${cy0 - 74}" text-anchor="middle" font-size="12" fill="#FFD5CE">越往下越收窄，行宽从 15 字</text>`;
      s += `<text x="${cx0}" y="${cy0 - 54}" text-anchor="middle" font-size="12" fill="#FFD5CE">急缩到只剩 5 个字</text>`;
      s += `<text x="${cx0}" y="${cy0 - 34}" text-anchor="middle" font-size="12" fill="#FF9485">断行彻底</text>`;
      s += `<text x="${cx0}" y="${cy0 - 14}" text-anchor="middle" font-size="12" fill="#FF9485">碎掉</text>`;
      s += `<circle cx="${cx0}" cy="${cy0 + 18}" r="28" fill="#ECAD20"/>`;
      if (gOn) s += `<text x="18" y="28" font-family="JetBrains Mono, monospace" font-size="12" fill="#FF9485">扇区行宽呈锥形急缩 · 长文断行崩溃</text>`;
    }
  }

  caseSvg.innerHTML = s;
}

document.querySelectorAll(".case-tab").forEach((b) => {
  b.addEventListener("click", () => {
    caseState.id = b.dataset.case;
    renderCase();
  });
});
caseFixBtn.addEventListener("click", () => {
  caseState.fixed = !caseState.fixed;
  renderCase();
});
caseGuideBtn.addEventListener("click", () => {
  caseState.guides = !caseState.guides;
  renderCase();
});

// ==================== 04 节交互：历史星图蓝本切换 ====================
const ERAS = {
  palmanova: {
    title: "从维特鲁威风玫瑰到帕尔马诺瓦（1593）",
    text: "古罗马建筑师维特鲁威在《建筑十书》第一卷第六章里，已用八向风玫瑰把城市街道按放射方位错开季风。1593 年威尼斯共和国在意大利东北部营建九角星城帕尔马诺瓦（2017 年列入 UNESCO 世界遗产名录），城心六边形广场向外射出六条主街，与三道同心环路交织，让援军、视野与防御都从同一原点高效调度。",
    src: "查证来源：UNESCO 世界遗产名录 No. 1533（Venetian Works of Defence，2017）。",
  },
  howard: {
    title: "埃比尼泽·霍华德《明日的田园城市》（1898 / 1902）",
    text: "针对工业城市拥挤与污染，英国社会改革家霍华德在 1898 年出版《To-morrow: A Peaceful Path to Real Reform》（1902 年修订再版为《Garden Cities of To-morrow》）。书中著名的同心放射规划图把中央公园、市政大厅、住宅环道、工业带与外围农田绿带分层编码到六条林荫射线和同心圆环上，让普通市民一眼读懂城乡融合方案。",
    src: "查证来源：Internet Archive 1898 首版与 1902 修订版扫描原书。",
  },
  elam: {
    title: "现代放射海报与金伯利·伊拉姆排印体系（1955–2007）",
    text: "1955 年约瑟夫·米勒-布罗克曼为苏黎世音乐厅创作的贝多芬音乐会海报，用纯几何同心圆弧和径向节奏转译交响乐张力。2002 年蒂莫西·萨马拉《Making and Breaking the Grid》探讨了旋转与放射结构；2007 年金伯利·伊拉姆在《Typographic Systems》（Princeton Architectural Press）中更将「放射系统（Radial System）」确立为超越正交网格的八大排印结构之一。",
    src: "查证来源：Princeton Architectural Press (2007, ISBN 978-1-56898-687-6)；Rockport (2002)。",
  },
  pie: {
    title: "ACM CHI '88 环形轮盘菜单实证实验（1988）",
    text: "Jack Callahan、Don Hopkins、Mark Weiser 与 Ben Shneiderman 在 1988 年 ACM CHI 大会发表论文《An Empirical Comparison of Pie vs. Linear Menus》，用费茨定律验证以光标为圆心的 8 项环形菜单：因为所有选项离圆心等距且扇面更宽，受试者操作速度比传统线性菜单快约 15%，错误率显著更低。这套放射逻辑今天遍布三维建模软件、游戏轮盘与智能手表。",
    src: "查证来源：ACM Digital Library，DOI 10.1145/57167.57182（CHI '88, pp. 95–100）。",
  },
};

const eraSvg = document.getElementById("era-svg");

function renderEra(id) {
  const e = ERAS[id];
  document.getElementById("era-title").textContent = e.title;
  document.getElementById("era-text").textContent = e.text;
  document.getElementById("era-src").textContent = e.src;
  document.querySelectorAll(".era-btn").forEach((b) => {
    const on = b.dataset.era === id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  const cx0 = 210;
  const cy0 = 130;
  let s = "";
  if (id === "palmanova") {
    // 9角星城外廓 + 3同心环 + 6主放射街 + 中央六边形广场
    let pts = [];
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 18;
      const r = i % 2 === 0 ? 106 : 82;
      pts.push(`${(cx0 + Math.cos(a) * r).toFixed(1)},${(cy0 + Math.sin(a) * r).toFixed(1)}`);
    }
    s += `<polygon points="${pts.join(" ")}" fill="#074B41" stroke="#ECAD20" stroke-width="1.8"/>`;
    for (const r of [68, 46]) {
      s += `<circle cx="${cx0}" cy="${cy0}" r="${r}" fill="none" stroke="#588F78" stroke-dasharray="3 3"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
      s += `<line x1="${cx0}" y1="${cy0}" x2="${(cx0 + Math.cos(a) * 90).toFixed(1)}" y2="${(cy0 + Math.sin(a) * 90).toFixed(1)}" stroke="#EEF1E0" stroke-width="1.5"/>`;
    }
    let hex = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
      hex.push(`${(cx0 + Math.cos(a) * 20).toFixed(1)},${(cy0 + Math.sin(a) * 20).toFixed(1)}`);
    }
    s += `<polygon points="${hex.join(" ")}" fill="#ECAD20" stroke="#F2DDB2" stroke-width="1.2"/>`;
    s += `<text x="16" y="242" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#F2DDB2">PALMANOVA 1593 · 9 BASTIONS · 6 AVENUES</text>`;
  } else if (id === "howard") {
    const rings = [
      { r: 102, fill: "#074B41", stroke: "#74E8BA", lbl: "外围农田绿带" },
      { r: 78, fill: "#053A32", stroke: "#ECAD20", lbl: "林荫环道" },
      { r: 50, fill: "#095448", stroke: "#EEF1E0", lbl: "住宅与水晶宫" },
      { r: 22, fill: "#ECAD20", stroke: "#F2DDB2", lbl: "公园" },
    ];
    for (const r of rings) {
      s += `<circle cx="${cx0}" cy="${cy0}" r="${r.r}" fill="${r.fill}" stroke="${r.stroke}" stroke-width="1.4"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      s += `<line x1="${(cx0 + Math.cos(a) * 22).toFixed(1)}" y1="${(cy0 + Math.sin(a) * 22).toFixed(1)}" x2="${(cx0 + Math.cos(a) * 102).toFixed(1)}" y2="${(cy0 + Math.sin(a) * 102).toFixed(1)}" stroke="#F2DDB2" stroke-width="1.3" opacity="0.8"/>`;
    }
    s += `<text x="16" y="242" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#F2DDB2">GARDEN CITY 1898 · CONCENTRIC ZONES</text>`;
  } else if (id === "elam") {
    const ox = 156;
    const oy = 148;
    const arcs = [
      { r: 34, a0: -1.1, a1: 0.7, w: 12, c: "#ECAD20" },
      { r: 58, a0: -1.35, a1: 0.25, w: 16, c: "#F2DDB2" },
      { r: 86, a0: -0.95, a1: 0.55, w: 18, c: "#EEB73D" },
      { r: 118, a0: -1.25, a1: 0.12, w: 10, c: "#74E8BA" },
    ];
    for (const arc of arcs) {
      const x0 = ox + Math.cos(arc.a0) * arc.r;
      const y0 = oy + Math.sin(arc.a0) * arc.r;
      const x1 = ox + Math.cos(arc.a1) * arc.r;
      const y1 = oy + Math.sin(arc.a1) * arc.r;
      s += `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${arc.r} ${arc.r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${arc.c}" stroke-width="${arc.w}" stroke-linecap="butt"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const a = -1.4 + i * 0.42;
      s += `<line x1="${ox}" y1="${oy}" x2="${(ox + Math.cos(a) * 138).toFixed(1)}" y2="${(oy + Math.sin(a) * 138).toFixed(1)}" stroke="rgba(238,241,224,0.38)" stroke-dasharray="3 3"/>`;
    }
    s += `<circle cx="${ox}" cy="${oy}" r="7" fill="#ECAD20"/>`;
    s += `<text x="16" y="242" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#F2DDB2">RADIAL TYPOGRAPHY · 1955–2007</text>`;
  } else {
    for (let i = 0; i < 8; i++) {
      const a0 = -Math.PI / 2 + (i * Math.PI * 2) / 8 - Math.PI / 8;
      const a1 = a0 + Math.PI / 4;
      const x0 = cx0 + Math.cos(a0) * 98;
      const y0 = cy0 + Math.sin(a0) * 98;
      const x1 = cx0 + Math.cos(a1) * 98;
      const y1 = cy0 + Math.sin(a1) * 98;
      const hi = i === 1;
      s += `<path d="M ${cx0} ${cy0} L ${x0.toFixed(1)} ${y0.toFixed(1)} A 98 98 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${hi ? "#ECAD20" : "#074B41"}" stroke="#588F78" stroke-width="1.3"/>`;
    }
    s += `<circle cx="${cx0}" cy="${cy0}" r="22" fill="#01322B" stroke="#F2DDB2" stroke-width="2"/>`;
    s += `<circle cx="${cx0}" cy="${cy0}" r="4.5" fill="#ECAD20"/>`;
    s += `<text x="16" y="242" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#F2DDB2">CHI '88 PIE MENU · ~15% FASTER</text>`;
  }
  eraSvg.innerHTML = s;
}

document.querySelectorAll(".era-btn").forEach((b) => {
  b.addEventListener("click", () => renderEra(b.dataset.era));
});

// ==================== 05 节交互：真实项目三问适配判别台 ====================
const BRIEFS = {
  user: {
    yes: true,
    name: "以用户为中心的 6 维能力图",
    q1: "有明确原点：「用户」是所有维度的共同发散源。",
    q2: "6 项短词模块，落在单环 4–8 路最佳呼吸带内。",
    q3: "先看圆心再做环状扫视与两两归类，无需长句换行。",
    advice: "直接沿用原海报左下「应用示例」骨架：中心放大用户图形，外环按 60° 等分放 6 枚水平文字卡片。",
  },
  watch: {
    yes: true,
    name: "智能手表 6 项快捷表盘",
    q1: "屏幕本身就是圆形，表盘中央时间或状态即天然焦点。",
    q2: "6 项高频动作绕表缘排开，手指沿固定方向角即可盲选。",
    q3: "单次定向点按，完美契合费茨定律等距扇区优势。",
    advice: "推荐放射网格：把核心时间/健康环置于中心，6 项快捷功能按 60° 对称落环，留足防误触弧距。",
  },
  festival: {
    yes: true,
    name: "音乐节主视觉单页海报",
    q1: "需要一眼抓住主标题或主舞台视觉核，极具仪式感与声浪张力。",
    q2: "演出日期、场地、阵容分区等 6–8 组短信息沿射线展开。",
    q3: "海报讲究瞬时冲击与由内向外的视觉动势，不是逐段深读。",
    advice: "适合放射网格：用大号拱形或圆心主标锁焦，副信息沿主次交替射线展开，长段购票说明放底部独立栏。",
  },
  docs: {
    yes: false,
    name: "三万字技术文档手册",
    q1: "内容是线性递进的章节与代码示例，没有单一视觉原点。",
    q2: "数百段文字与多级标题，完全超出同心环容量上限。",
    q3: "读者依赖稳定的左对齐起眼点、固定行宽和统一基线。",
    advice: "不要用放射网格！改用 <a href='https://layout.xiaoxiaodong.ai/194/play/' target='_blank' rel='noopener'>194 手稿网格</a> 或 <a href='https://layout.xiaoxiaodong.ai/195/play/' target='_blank' rel='noopener'>195 分栏网格</a> 配合 <a href='https://layout.xiaoxiaodong.ai/198/play/' target='_blank' rel='noopener'>198 基线网格</a>。",
  },
  shop: {
    yes: false,
    name: "120 款电商商品筛选页",
    q1: "商品之间是平行对比关系，不存在谁该霸占正中央。",
    q2: "条目数随筛选动态增减，圆环无法优雅承接不定长瀑布流。",
    q3: "用户需要上下快速扫读价格与缩略图并随时按列对齐比较。",
    advice: "不要用放射网格！改用 <a href='https://layout.xiaoxiaodong.ai/202/play/' target='_blank' rel='noopener'>202 等距网格</a>、<a href='https://layout.xiaoxiaodong.ai/196/play/' target='_blank' rel='noopener'>196 模块化网格</a> 与 <a href='https://layout.xiaoxiaodong.ai/209/play/' target='_blank' rel='noopener'>209 响应式网格</a>。",
  },
  wind: {
    yes: false,
    name: "360° 气象风向定量数据图",
    q1: "虽以圆心为极点，但核心任务是精确读取角度 θ 与风速半径 r。",
    q2: "需要严谨刻度线、量纲比例与定量面积/长度映射，而非信息版面分组。",
    q3: "读者要查表读数而非浏览概念关系。",
    advice: "这类严格定量坐标是邻居 <a href='https://layout.xiaoxiaodong.ai/204/play/' target='_blank' rel='noopener'>204 极坐标网格</a> 的专场，不必套用偏版式层级的放射网格。",
  },
};

function renderBrief(id) {
  const b = BRIEFS[id];
  const v = document.getElementById("fit-verdict");
  v.textContent = b.yes ? "适合放射网格" : "建议换用其他网格";
  v.classList.toggle("is-yes", b.yes);
  v.classList.toggle("is-no", !b.yes);
  document.getElementById("fit-name").textContent = b.name;
  document.getElementById("fit-q1").textContent = b.q1;
  document.getElementById("fit-q2").textContent = b.q2;
  document.getElementById("fit-q3").textContent = b.q3;
  document.getElementById("fit-advice").innerHTML = b.advice;
  document.querySelectorAll(".brief-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.brief === id);
  });
}

document.querySelectorAll(".brief-btn").forEach((b) => {
  b.addEventListener("click", () => renderBrief(b.dataset.brief));
});

// ==================== 06 节交互：四选一单变量眼力测试 ====================
const QUIZ_META = {
  A: {
    correct: false,
    title: "方案 A：圆心体量过弱，和外环节点平权抢戏",
    body: "虽然 6 节点按 60° 均匀分布且射线清楚，但中心圆直径只比外环大 1.05×。7 个圆几乎一样大，违反「中心最为突出，越向外层级越弱」，视觉第一眼抓不到主角。正确答案是方案 B。",
  },
  B: {
    correct: true,
    title: "答对了！方案 B 四项放射秩序全部成立",
    body: "中心圆直径是外环节点的 2.1×（面积 4.4×），第一眼立住核心；6 个节点沿 60° 等分射线稳落同一同心环，径向连线清晰不打结，层级、中心、方向与模块节奏一次到位。",
  },
  C: {
    correct: false,
    title: "方案 C：6 个节点挤向右半圆，左侧整片塌空",
    body: "圆心够大、模块缩放也合理，但所有外环模块都压进右侧 150° 扇区里，左侧空出 210° 大洞，整盘重心朝右倾倒，失去了绕圆心均衡扩散的稳定感。正确答案是方案 B。",
  },
  D: {
    correct: false,
    title: "方案 D：跨心网状弦线互相打结，放射流向消失",
    body: "圆心体量与外环等分原本都对，但放弃了从圆心发出的径向射线，改成节点之间横穿中央的交叉弦线，视线被乱网缠死在中间。正确答案是方案 B。",
  },
};

function drawQuizOption(opt, reveal) {
  const svg = document.getElementById(`quiz-svg-${opt}`);
  const cx0 = 120;
  const cy0 = 100;
  const ringR = 66;
  const coreR = opt === "A" ? 17 : 31;
  const nodeR = 15;
  const angles = [];
  if (opt === "C") {
    const start = -Math.PI / 2 + 0.15;
    const span = (150 * Math.PI) / 180;
    for (let i = 0; i < 6; i++) angles.push(start + (i / 5) * span);
  } else {
    for (let i = 0; i < 6; i++) angles.push(-Math.PI / 2 + (i * Math.PI * 2) / 6);
  }
  const pts = angles.map((a) => ({ x: cx0 + Math.cos(a) * ringR, y: cy0 + Math.sin(a) * ringR, a }));

  let s = `<circle cx="${cx0}" cy="${cy0}" r="${ringR}" fill="none" stroke="rgba(88,143,120,0.6)" stroke-dasharray="3 3"/>`;

  if (opt === "D") {
    const pairs = [[0, 2], [0, 3], [1, 4], [1, 5], [2, 5], [3, 5], [2, 4]];
    for (const [i, j] of pairs) {
      s += `<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pts[j].x.toFixed(1)}" y2="${pts[j].y.toFixed(1)}" stroke="${reveal ? "#FF9485" : "#EEF1E0"}" stroke-width="1.35" opacity="0.8"/>`;
    }
  } else {
    for (const p of pts) {
      s += `<line x1="${(cx0 + Math.cos(p.a) * (coreR + 3)).toFixed(1)}" y1="${(cy0 + Math.sin(p.a) * (coreR + 3)).toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#EEF1E0" stroke-width="1.45"/>`;
    }
  }

  // 核心圆盘 + 极简人物剪影（无五官）
  s += `<circle cx="${cx0}" cy="${cy0}" r="${coreR}" fill="#ECAD20" stroke="${reveal && opt === "A" ? "#FF9485" : "#F2DDB2"}" stroke-width="${reveal && opt === "A" ? 2.4 : 1.4}"/>`;
  s += `<circle cx="${cx0}" cy="${cy0 - coreR * 0.2}" r="${(coreR * 0.22).toFixed(1)}" fill="#063D30"/>`;
  s += `<path d="M ${(cx0 - coreR * 0.36).toFixed(1)} ${(cy0 + coreR * 0.45).toFixed(1)} A ${(coreR * 0.4).toFixed(1)} ${(coreR * 0.4).toFixed(1)} 0 0 1 ${(cx0 + coreR * 0.36).toFixed(1)} ${(cy0 + coreR * 0.45).toFixed(1)} Z" fill="#063D30"/>`;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${nodeR}" fill="#074B41" stroke="#EEB73D" stroke-width="1.5"/>`;
    s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#EEB73D"/>`;
  }

  // 揭晓核验叠层
  if (reveal) {
    if (opt === "A") {
      s += `<text x="120" y="190" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#FF9485">心径 1.1× · 弱核</text>`;
    } else if (opt === "B") {
      s += `<text x="120" y="190" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#74E8BA">2.1× · 60° 等分 ✓</text>`;
    } else if (opt === "C") {
      s += `<path d="M ${cx0 - 66} ${cy0} A 66 66 0 0 1 ${cx0 - 14} ${cy0 - 64}" fill="none" stroke="#FF9485" stroke-width="2.5" stroke-dasharray="4 3"/>`;
      s += `<text x="120" y="190" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#FF9485">左侧空弧 210°</text>`;
    } else {
      s += `<text x="120" y="190" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11.5" fill="#FF9485">跨心弦线交叉</text>`;
    }
  }
  svg.innerHTML = s;
}

document.querySelectorAll(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.opt;
    const info = QUIZ_META[pick];
    ["A", "B", "C", "D"].forEach((k) => drawQuizOption(k, true));
    document.querySelectorAll(".quiz-opt").forEach((b) => {
      const k = b.dataset.opt;
      b.setAttribute("aria-pressed", String(k === pick));
      b.classList.toggle("is-picked", k === pick);
      b.classList.toggle("is-correct", k === "B");
      b.classList.toggle("is-wrong", k === pick && k !== "B");
    });
    const box = document.getElementById("quiz-verdict");
    box.classList.toggle("is-ok", info.correct);
    box.classList.toggle("is-err", !info.correct);
    document.getElementById("qv-title").textContent = info.title;
    document.getElementById("qv-body").textContent = info.body;
  });
});

// ==================== 07 节交互：原海报放大查看层 ====================
const posterBtn = document.getElementById("poster-btn");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.x}px, ${lbState.y}px) scale(${lbState.scale})`;
  document.getElementById("lb-reset").textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbState.scale = 1;
  lbState.x = 0;
  lbState.y = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbState.scale = clamp(lbState.scale + 0.35, 1, 3.2);
  applyLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbState.scale = clamp(lbState.scale - 0.35, 1, 3.2);
  if (lbState.scale === 1) { lbState.x = 0; lbState.y = 0; }
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbState.scale = 1; lbState.x = 0; lbState.y = 0;
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbState.dragging = true;
  lbState.sx = e.clientX;
  lbState.sy = e.clientY;
  lbState.ox = lbState.x;
  lbState.oy = lbState.y;
});
window.addEventListener("pointermove", (e) => {
  if (!lbState.dragging) return;
  lbState.x = lbState.ox + (e.clientX - lbState.sx);
  lbState.y = lbState.oy + (e.clientY - lbState.sy);
  applyLbTransform();
});
window.addEventListener("pointerup", () => { lbState.dragging = false; });
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbState.scale = clamp(lbState.scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
  if (lbState.scale === 1) { lbState.x = 0; lbState.y = 0; }
  applyLbTransform();
}, { passive: false });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化与尺寸监听 ====================
const ro = new ResizeObserver(() => {
  resizeAstrolabe();
  astrolabeLoop.draw();
  sbLoop.draw();
});
ro.observe(canvas);
ro.observe(sbCanvas);

resizeAstrolabe();
syncUI();
astrolabeLoop.draw();
renderFitts(6);
updateStarburstUI();
renderCase();
renderEra("palmanova");
renderBrief("user");
["A", "B", "C", "D"].forEach((k) => drawQuizOption(k, false));
