// 050 环形构图 · 开场「环带雕琢仪」2D Canvas 引擎
// 严格从 model.js 的 computeRingGeometry / auditRing 单真源渲染，支持鼠标、触屏与键盘。
import { loop, pixelRatio } from "../../lib/stage.js";
import { BREACH_CENTER_DEG, SCENARIOS, clamp, computeRingGeometry, normDeg } from "./model.js";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// 预生成固定微粒，还原原海报哑黑环带上的轻印纸微尘质感（零每帧分配）
const SPECKS = Array.from({ length: 42 }, (_, i) => {
  const a = ((i * 137.508) % 360) * DEG;
  const r = 0.08 + ((i * 29) % 84) / 100;
  const s = 0.9 + (i % 3) * 0.55;
  return { a, r, s, alpha: 0.14 + (i % 4) * 0.05 };
});

function drawFourStar(ctx, x, y, rOut, rIn, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    const px = x + Math.cos(rad) * r;
    const py = y + Math.sin(rad) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawArrowHead(ctx, x, y, angleRad, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.85, -size * 0.62);
  ctx.lineTo(-size * 0.5, 0);
  ctx.lineTo(-size * 0.85, size * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRingElement(ctx, el, scenario, highlightDepth, t) {
  ctx.save();
  ctx.translate(el.x, el.y);
  if (el.inBreach) ctx.globalAlpha = 0.22;

  const fillMap = {
    white: "#F7F5EE",
    mint: "#49BA8A",
    mint2: "#8CD7B5",
    yellow: "#F0ED04",
  };
  const col = fillMap[el.color] || "#F7F5EE";

  if (el.isRival) {
    // 抢戏黄圆：当权重大于阈值时带警示脉冲虚环
    ctx.fillStyle = "#F0ED04";
    ctx.beginPath();
    ctx.arc(0, 0, el.r, 0, TAU);
    ctx.fill();
    if (el.r > 24) {
      ctx.strokeStyle = "#FF6B63";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, el.r + 5 + Math.sin(t * 4) * 1.5, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#0D0D0A";
      ctx.font = `700 ${Math.max(10, Math.min(13, el.r * 0.34))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("点此消抢戏", 0, 0);
    }
    ctx.restore();
    return;
  }

  if (scenario === "ui" && el.tier !== "bg") {
    // 界面数据环风格：圆角刻度胶囊与薄荷微光点
    ctx.rotate(el.rad + Math.PI / 2);
    ctx.fillStyle = el.color === "white" ? "#E8F4EE" : col;
    const w = el.r * 1.45;
    const h = Math.max(4, el.r * 0.55);
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (scenario === "photo") {
    // 摄影前景枝叶/拱石剪影感（低扰动暖雾微光斑）
    ctx.fillStyle = el.color === "yellow" ? "rgba(240,237,4,0.65)" : el.color === "mint" ? "rgba(73,186,138,0.52)" : "rgba(245,242,235,0.28)";
    ctx.beginPath();
    ctx.arc(0, 0, el.r * 0.92, 0, TAU);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (el.shape === "mintorb") {
    ctx.fillStyle = "#49BA8A";
    ctx.beginPath();
    ctx.arc(0, 0, el.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#87D9B4";
    ctx.beginPath();
    ctx.arc(-el.r * 0.14, -el.r * 0.14, el.r * 0.62, 0, TAU);
    ctx.fill();
  } else if (el.shape === "square") {
    ctx.fillStyle = col;
    const s = el.r * 1.5;
    ctx.fillRect(-s / 2, -s / 2, s, s);
  } else if (el.shape === "triangle") {
    ctx.fillStyle = col;
    ctx.rotate(-0.22);
    ctx.beginPath();
    ctx.moveTo(0, -el.r * 1.15);
    ctx.lineTo(el.r * 1.05, el.r * 0.82);
    ctx.lineTo(-el.r * 1.05, el.r * 0.82);
    ctx.closePath();
    ctx.fill();
  } else if (el.shape === "dotgrid") {
    ctx.rotate(-0.55);
    ctx.fillStyle = "#F5F2EB";
    const cols = 5, rows = 4;
    const step = Math.max(4.5, el.r * 0.38);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.arc((c - (cols - 1) / 2) * step, (r - (rows - 1) / 2) * step, Math.max(1.3, step * 0.24), 0, TAU);
        ctx.fill();
      }
    }
  } else if (el.shape === "vgrid") {
    const rows = 5, cols = 3;
    const step = Math.max(4.5, el.r * 0.42);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#F0ED04" : "#49BA8A";
        ctx.beginPath();
        ctx.arc((c - 1) * step, (r - 2) * step, Math.max(1.3, step * 0.24), 0, TAU);
        ctx.fill();
      }
    }
  } else {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, el.r, 0, TAU);
    ctx.fill();
  }

  if (highlightDepth && el.tier === "fg") {
    ctx.strokeStyle = "#F0ED04";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, el.r + 4, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScenarioCore(ctx, g, state) {
  const r = g.rCore;
  const sc = state.scenario;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.clip();

  if (sc === "poster") {
    ctx.fillStyle = "#F0ED04";
    ctx.fillRect(-r, -r, r * 2, r * 2);

    const k = clamp(r / 84, 0.55, 1.25);
    drawFourStar(ctx, 0, -r * 0.44, 13 * k, 4.2 * k, "#0D0D0A");

    ctx.fillStyle = "#0D0D0A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.round(28 * k)}px "Noto Sans SC", sans-serif`;
    ctx.fillText("焦点", 0, -r * 0.06);

    ctx.font = `700 ${Math.round(12 * k)}px "IBM Plex Sans", sans-serif`;
    ctx.fillText("FOCUS", 0, r * 0.22);

    if (r >= 58) {
      ctx.font = `600 ${Math.max(10, Math.round(10.5 * k))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("中心承载核心信息", 0, r * 0.48);
      ctx.fillText("视觉停留的最终目的地", 0, r * 0.67);
    }
  } else if (sc === "product") {
    // 腕表表盘核心
    ctx.fillStyle = "#F7F5EE";
    ctx.fillRect(-r, -r, r * 2, r * 2);
    const k = r / 84;
    // 表带
    ctx.fillStyle = "#1E221D";
    ctx.fillRect(-20 * k, -r, 40 * k, r * 2);
    // 表壳
    ctx.fillStyle = "#0D0D0A";
    ctx.beginPath();
    ctx.arc(0, 0, 44 * k, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#49BA8A";
    ctx.lineWidth = 2.5 * k;
    ctx.stroke();
    // 刻度
    for (let i = 0; i < 12; i++) {
      const a = (i * 30) * DEG;
      ctx.strokeStyle = i % 3 === 0 ? "#F0ED04" : "#B6BCB1";
      ctx.lineWidth = i % 3 === 0 ? 2.4 * k : 1.2 * k;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 32 * k, Math.sin(a) * 32 * k);
      ctx.lineTo(Math.cos(a) * 38 * k, Math.sin(a) * 38 * k);
      ctx.stroke();
    }
    // 表针
    ctx.strokeStyle = "#F5F2EB";
    ctx.lineWidth = 3 * k;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14 * k, -18 * k);
    ctx.moveTo(0, 0);
    ctx.lineTo(22 * k, -10 * k);
    ctx.stroke();
    ctx.fillStyle = "#F0ED04";
    ctx.beginPath();
    ctx.arc(0, 0, 3.6 * k, 0, TAU);
    ctx.fill();
  } else if (sc === "ui") {
    // 数据进度环核心
    ctx.fillStyle = "#131713";
    ctx.fillRect(-r, -r, r * 2, r * 2);
    const k = clamp(r / 84, 0.58, 1.25);
    // 内圈进度轨
    ctx.strokeStyle = "#2A332B";
    ctx.lineWidth = 8 * k;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "#49BA8A";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, -Math.PI / 2, -Math.PI / 2 + TAU * 0.72);
    ctx.stroke();
    ctx.fillStyle = "#F0ED04";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(32 * k)}px "JetBrains Mono", monospace`;
    ctx.fillText("72%", 0, -4 * k);
    ctx.fillStyle = "#B6BCB1";
    ctx.font = `600 ${Math.max(10, Math.round(10 * k))}px "IBM Plex Sans", sans-serif`;
    ctx.fillText("GOAL RING", 0, 22 * k);
  } else {
    // 摄影峰峦环窗核心
    const grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, "#5F8396");
    grad.addColorStop(0.55, "#DDE5DF");
    grad.addColorStop(1, "#F0C589");
    ctx.fillStyle = grad;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    // 太阳微光
    ctx.fillStyle = "#F0ED04";
    ctx.beginPath();
    ctx.arc(r * 0.24, -r * 0.28, r * 0.16, 0, TAU);
    ctx.fill();
    // 远山与雪峰
    ctx.fillStyle = "#2C3D44";
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.55);
    ctx.lineTo(-r * 0.36, -r * 0.08);
    ctx.lineTo(r * 0.02, -r * 0.36);
    ctx.lineTo(r * 0.46, r * 0.06);
    ctx.lineTo(r, r * 0.45);
    ctx.lineTo(r, r);
    ctx.lineTo(-r, r);
    ctx.closePath();
    ctx.fill();
    // 亮面雪坡
    ctx.fillStyle = "#F5F2EB";
    ctx.beginPath();
    ctx.moveTo(r * 0.02, -r * 0.36);
    ctx.lineTo(r * 0.26, -r * 0.06);
    ctx.lineTo(r * 0.05, r * 0.08);
    ctx.lineTo(-r * 0.12, -r * 0.1);
    ctx.closePath();
    ctx.fill();
    // 近处暗坡
    ctx.fillStyle = "#161E1D";
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.42);
    ctx.lineTo(-r * 0.22, r * 0.24);
    ctx.lineTo(r * 0.25, r * 0.48);
    ctx.lineTo(r, r * 0.32);
    ctx.lineTo(r, r);
    ctx.lineTo(-r, r);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 核心外圈细轮廓
  ctx.strokeStyle = sc === "ui" ? "#66D4A3" : "rgba(13, 13, 10, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
}

export function mountHeroCanvas(canvas, getState, getAudit, onMutate) {
  const ctx = canvas.getContext("2d");
  const SIZE = 520;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 198;

  let introP = 0; // 开场平滑入画（0..1，确保 0.9s 时也清晰完整）
  let trace = null; // 视线光彗演播 { elapsed, duration }
  let dragMode = null; // 'closure' | 'core' | 'gap'
  let dragStart = null;
  let movedPx = 0;
  let hoverTarget = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const css = Math.max(260, Math.round(rect.width || 460));
    const dpr = pixelRatio(css < 420 ? 1.5 : 2);
    const px = Math.round(css * dpr);
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }
  }

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * SIZE - CX;
    const y = ((clientY - rect.top) / rect.height) * SIZE - CY;
    return { x, y, dist: Math.hypot(x, y), deg: normDeg(Math.atan2(y, x) / DEG) };
  }

  function hitTest(pt) {
    const state = getState();
    const g = computeRingGeometry(state, R);
    // 1. 抢戏黄圆点击区
    if (g.rivalEl && !g.rivalEl.inBreach) {
      const dr = Math.hypot(pt.x - g.rivalEl.x, pt.y - g.rivalEl.y);
      if (dr <= Math.max(22, g.rivalEl.r + 10)) return "rival";
    }
    // 2. 内环光圈柄（位于 10:30 方向 rCore 边缘）
    const coreHandleA = -135 * DEG;
    const chx = Math.cos(coreHandleA) * g.rCore;
    const chy = Math.sin(coreHandleA) * g.rCore;
    if (Math.hypot(pt.x - chx, pt.y - chy) <= 22) return "core";
    // 3. 缺口开关柄（位于 startDeg 边缘）
    if (g.breachDeg > 2) {
      const ba = g.startDeg * DEG;
      const bx = Math.cos(ba) * g.rBandMid;
      const by = Math.sin(ba) * g.rBandMid;
      if (Math.hypot(pt.x - bx, pt.y - by) <= 26) return "closure";
    }
    // 4. 内环缘附近径向拉核
    if (Math.abs(pt.dist - g.rCore) <= 12 && pt.dist > 28) return "core";
    return "closure";
  }

  function renderFrame(t, dt, { still }) {
    resize();
    if (still) introP = 1;
    else if (introP < 1) introP = Math.min(1, introP + (dt || 0.016) * 1.6);

    const state = getState();
    const audit = getAudit();
    const g = computeRingGeometry(state, R);
    const scale = canvas.width / SIZE;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.translate(CX, CY);

    const ease = 1 - Math.pow(1 - introP, 3);
    const hl = state.highlightLayer;

    // 1. 最外圈：原海报招牌薄荷虚线轨道与 3 枚顺时针实心箭
    const rOrbit = g.rOut + 22;
    ctx.save();
    ctx.strokeStyle = hl === "closure" ? "#0D0D0A" : "#49BA8A";
    ctx.lineWidth = hl === "closure" ? 2.4 : 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, rOrbit, -Math.PI / 2, -Math.PI / 2 + TAU * (0.25 + 0.75 * ease));
    ctx.stroke();
    ctx.setLineDash([]);
    // 3 枚黑色三角方向箭（与原海报一致：右上、右下、左下）
    for (const deg of [-58, 36, 128, -142]) {
      const a = deg * DEG;
      drawArrowHead(ctx, Math.cos(a) * rOrbit, Math.sin(a) * rOrbit, a + Math.PI / 2, 5.2, "#0D0D0A");
    }
    ctx.restore();

    // 2. 宽幅哑黑实体圆环（带开合缺口）
    const startRad = g.startDeg * DEG;
    const endRad = g.endDeg * DEG;
    ctx.save();
    ctx.beginPath();
    if (g.closureDeg >= 359.5) {
      ctx.arc(0, 0, g.rOut, 0, TAU, false);
      ctx.arc(0, 0, g.rBandIn, TAU, 0, true);
    } else {
      ctx.arc(0, 0, g.rOut, startRad, endRad, false);
      ctx.arc(0, 0, g.rBandIn, endRad, startRad, true);
    }
    ctx.closePath();
    ctx.fillStyle = state.scenario === "photo" ? "#151916" : "#0D0D0A";
    ctx.fill();

    // 环带内微尘质感
    ctx.save();
    ctx.clip();
    for (const sp of SPECKS) {
      const rr = g.rBandIn + sp.r * g.bandThick;
      ctx.fillStyle = `rgba(245, 242, 235, ${sp.alpha})`;
      ctx.fillRect(Math.cos(sp.a) * rr, Math.sin(sp.a) * rr, sp.s, sp.s);
    }
    // 环内原海报细弧装饰线
    ctx.strokeStyle = "rgba(245, 242, 235, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, g.rBandIn + g.bandThick * 0.28, startRad + 0.15, endRad - 0.15);
    ctx.stroke();
    ctx.restore();

    // 环带高亮描边（选中探针时）
    if (hl === "encirclement" || hl === "closure") {
      ctx.strokeStyle = audit.probes[hl].ok ? "#49BA8A" : "#FF6B63";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    // 3. 若环带断裂（breachDeg > 2）：画出红色虚线缺失扇区与「拉合」视觉提示
    if (g.breachDeg > 2) {
      ctx.save();
      const bStart = endRad;
      const bEnd = startRad + TAU;
      ctx.beginPath();
      ctx.arc(0, 0, g.rOut, bStart, bEnd, false);
      ctx.arc(0, 0, g.rBandIn, bEnd, bStart, true);
      ctx.closePath();
      ctx.fillStyle = g.closureDeg < 305 ? "rgba(185, 43, 39, 0.08)" : "rgba(73, 186, 138, 0.09)";
      ctx.fill();
      ctx.strokeStyle = g.closureDeg < 305 ? "#B92B27" : "#176B4B";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 缺口提示签
      const midA = BREACH_CENTER_DEG * DEG;
      const lx = Math.cos(midA) * g.rBandMid;
      const ly = Math.sin(midA) * g.rBandMid;
      ctx.fillStyle = g.closureDeg < 305 ? "#B92B27" : "#176B4B";
      ctx.font = `700 12px "JetBrains Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(g.closureDeg < 305 ? `缺口 ${g.breachDeg}°` : `留气 ${g.breachDeg}°`, lx, ly - 8);
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillText(g.closureDeg < 305 ? "← 横拖收合" : "闭合仍成立", lx, ly + 9);

      // 缺口拉合把手
      const hx = Math.cos(startRad) * g.rBandMid;
      const hy = Math.sin(startRad) * g.rBandMid;
      ctx.fillStyle = "#F0ED04";
      ctx.strokeStyle = "#0D0D0A";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(hx, hy, 10, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. 白色内环呼吸缝（清晰展示 gapPx 与贴死/脱节状态）
    if (g.gapPx > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, g.rBandIn, 0, TAU, false);
      ctx.arc(0, 0, g.rCore, TAU, 0, true);
      ctx.closePath();
      ctx.fillStyle = "#F5F2EB";
      ctx.fill();
      if (hl === "encirclement" || g.gapPct > 19.5) {
        ctx.strokeStyle = g.gapPct > 19.5 ? "#B92B27" : "#49BA8A";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, (g.rCore + g.rBandIn) * 0.5, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    } else {
      // 0px 贴死警示红环
      ctx.save();
      ctx.strokeStyle = "#FF6B63";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, g.rCore + 1.5, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 绘制环带内 18 枚几何元素（非抢戏元素先画，抢戏黄圆最后置顶确保「点此消抢戏」不被遮挡）
    for (const el of g.elements) {
      if (!el.isRival) drawRingElement(ctx, el, state.scenario, hl === "depth", t);
    }
    if (g.rivalEl) drawRingElement(ctx, g.rivalEl, state.scenario, hl === "depth", t);

    // 若存在抢戏黄圆，画一条红色双焦拉扯虚线连接中心与抢戏黄圆
    if (g.rivalVisualRatio > 0.42 && g.rivalEl && !g.rivalEl.inBreach) {
      ctx.save();
      ctx.strokeStyle = "#FF6B63";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(g.rCore * 0.72, -g.rCore * 0.14);
      ctx.lineTo(g.rivalEl.x - g.rivalEl.r * 0.7, g.rivalEl.y + 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 6. 中心焦点核
    drawScenarioCore(ctx, g, state);

    // 聚焦探针高亮环
    if (hl === "focus") {
      ctx.save();
      ctx.strokeStyle = audit.probes.focus.ok ? "#176B4B" : "#B92B27";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, g.rCore + 5, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // 7. 内环光圈拖柄（10:30 方位，明确可拖调核比）
    {
      const ha = -135 * DEG;
      const hx = Math.cos(ha) * g.rCore;
      const hy = Math.sin(ha) * g.rCore;
      ctx.save();
      ctx.fillStyle = hoverTarget === "core" || dragMode === "core" ? "#49BA8A" : "#F5F2EB";
      ctx.strokeStyle = "#0D0D0A";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(hx, hy, 8.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#0D0D0A";
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // 8. 视线流光彗演播（按空格或点击按钮）
    if (trace) {
      trace.elapsed += dt || 0.016;
      const p = trace.elapsed / trace.duration;
      if (p >= 1) {
        trace = null;
      } else {
        const leaksOut = g.closureDeg < 305;
        const hijacked = !leaksOut && g.rivalVisualRatio > 0.42 && g.rivalEl;
        for (let k = 0; k < 3; k++) {
          const pk = clamp((p - k * 0.12) / 0.76, 0, 1);
          if (pk <= 0) continue;
          let cx = 0, cy = 0;
          let color = "#66D4A3";

          if (leaksOut) {
            // 沿外环跑到缺口处直接切线逃逸出画
            if (pk < 0.55) {
              const a = (-120 + (pk / 0.55) * 165) * DEG;
              cx = Math.cos(a) * g.rBandMid;
              cy = Math.sin(a) * g.rBandMid;
            } else {
              const ep = (pk - 0.55) / 0.45;
              const a = BREACH_CENTER_DEG * DEG;
              const rr = g.rBandMid + ep * 120;
              cx = Math.cos(a) * rr + ep * 24;
              cy = Math.sin(a) * rr + ep * 14;
              color = "#FF6B63";
            }
          } else if (hijacked && k !== 1) {
            // 被右上抢戏黄圆吸走打转
            const a0 = (-140 + pk * 130) * DEG;
            const ox = Math.cos(a0) * g.rBandMid;
            const oy = Math.sin(a0) * g.rBandMid;
            const pull = Math.pow(pk, 1.5);
            const orbitA = pk * TAU * 1.4;
            const tx = g.rivalEl.x + Math.cos(orbitA) * (g.rivalEl.r + 8);
            const ty = g.rivalEl.y + Math.sin(orbitA) * (g.rivalEl.r + 8);
            cx = ox + (tx - ox) * pull;
            cy = oy + (ty - oy) * pull;
            color = "#FF6B63";
          } else {
            // 顺外环滑行后平滑螺旋收束到中心焦点
            const a = (-110 + pk * 330) * DEG;
            const rr = g.rBandMid * (1 - Math.pow(pk, 1.7));
            cx = Math.cos(a) * rr;
            cy = Math.sin(a) * rr;
            color = pk > 0.72 ? "#F0ED04" : "#66D4A3";
          }

          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(cx, cy, 6.2 - k * 0.6, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = "#0D0D0A";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  // Pointer & Touch 交互（横拖平滑开合黑环，拖内环口调核比，点抢戏黄圆切换权重）
  function onDown(e) {
    const pt = toLogical(e.clientX, e.clientY);
    dragMode = hitTest(pt);
    const st = getState();
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      closureDeg: st.closureDeg,
      ringRotation: st.ringRotation,
      coreRatio: st.coreRatio,
      pt,
    };
    movedPx = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }

  function onMove(e) {
    if (!dragStart) {
      const pt = toLogical(e.clientX, e.clientY);
      hoverTarget = hitTest(pt);
      canvas.style.cursor = hoverTarget === "rival" ? "pointer" : hoverTarget === "core" ? "nwse-resize" : "grab";
      return;
    }
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    movedPx = Math.max(movedPx, Math.hypot(dx, dy));

    if (dragMode === "core") {
      const pt = toLogical(e.clientX, e.clientY);
      const nextCore = clamp(pt.dist / R, 0.16, 0.68);
      onMutate({ coreRatio: +nextCore.toFixed(3) });
    } else if (dragMode === "closure" || (dragMode === "rival" && movedPx > 8)) {
      // 横拖直接推拉闭合角并微转环带，靠近 360° 轻吸
      const rect = canvas.getBoundingClientRect();
      const frac = dx / Math.max(160, rect.width * 0.55);
      let nextClosure = clamp(dragStart.closureDeg + frac * 170, 175, 360);
      if (nextClosure > 353 && frac > 0) nextClosure = 360;
      const nextRot = dragStart.ringRotation + frac * 34;
      onMutate({ closureDeg: Math.round(nextClosure), ringRotation: +nextRot.toFixed(1) });
    }
  }

  function onUp(e) {
    if (!dragStart) return;
    if (dragMode === "rival" && movedPx <= 8) {
      // 直接点击抢戏黄圆：3 档循环权重
      const cur = getState().rivalWeight;
      const next = cur > 0.68 ? 0.54 : cur > 0.40 ? 0.24 : 0.88;
      onMutate({ rivalWeight: next });
    }
    dragMode = null;
    dragStart = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // 额外兼容 perf.mjs 直接派发的 touchmove（如果浏览器不重复触发 pointermove）
  let touchStartX = null;
  let touchBaseClosure = 218;
  let touchBaseRot = 0;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const st = getState();
    touchStartX = e.touches[0].clientX;
    touchBaseClosure = st.closureDeg;
    touchBaseRot = st.ringRotation;
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (touchStartX == null || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dx) < 3) return;
    const rect = canvas.getBoundingClientRect();
    const frac = dx / Math.max(160, rect.width * 0.55);
    const nextClosure = clamp(touchBaseClosure + frac * 165, 175, 360);
    const nextRot = touchBaseRot + frac * 36;
    onMutate({ closureDeg: Math.round(nextClosure), ringRotation: +nextRot.toFixed(1) });
  }, { passive: true });
  canvas.addEventListener("touchend", () => { touchStartX = null; }, { passive: true });

  // 键盘控制
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onMutate({ closureDeg: clamp(st.closureDeg + 8, 175, 360) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onMutate({ closureDeg: clamp(st.closureDeg - 8, 175, 360) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onMutate({ coreRatio: +clamp(st.coreRatio + 0.03, 0.16, 0.68).toFixed(3) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onMutate({ coreRatio: +clamp(st.coreRatio - 0.03, 0.16, 0.68).toFixed(3) });
    } else if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      triggerTrace();
    }
  });

  function triggerTrace() {
    trace = { elapsed: 0, duration: 2.3 };
    ctrl.draw();
  }

  return {
    draw: () => ctrl.draw(),
    triggerTrace,
    scenarioInfo: (id) => SCENARIOS[id] || SCENARIOS.poster,
  };
}
