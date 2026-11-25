// 273 仪表盘布局 · 双 2D Canvas 遥测渲染引擎
// 1) 右上角原海报同款圆形雷达扫描盘（实时映射负载百分比与信号纪律）
// 2) 中层趋势分析双折线实时游标图（实时映射 24h 时间轴拨尺、渠道筛选与警戒阈值线）

import { pixelRatio } from "../../lib/stage.js";
import { CHANNELS, INCIDENTS, getTrendSeries, sampleTelemetry } from "./model.js";

const COLORS = {
  bg: "#161918",
  bgDeep: "#0E1110",
  grid: "rgba(180, 198, 195, 0.12)",
  gridStrong: "rgba(180, 198, 195, 0.24)",
  axis: "#7E8987",
  cyan: "#3BDAED",
  cyanDim: "rgba(59, 218, 237, 0.22)",
  cyanSoft: "rgba(59, 218, 237, 0.08)",
  lime: "#ADE62D",
  limeDim: "rgba(173, 230, 45, 0.22)",
  alert: "#FF6B4A",
  alertDim: "rgba(255, 107, 74, 0.16)",
  muted: "#6F7877",
  mutedLine: "#889190",
  prevDash: "#6E7678",
  white: "#F2F5F4",
};

function syncCanvasSize(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  const maxDpr = window.innerWidth <= 500 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w: rect.width, h: rect.height, dpr };
}

export function createRadarRenderer(canvas, getState) {
  const ctx = canvas.getContext("2d");

  return function drawRadar(t = 0, still = false) {
    const dim = syncCanvasSize(canvas);
    if (!dim || !ctx) return;
    const { w, h, dpr } = dim;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const state = getState();
    const snap = sampleTelemetry(state.minute, state.selectedChannel);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.42;

    // 决定雷达扇区颜色（严格遵循当前信号纪律）
    const isCrit = snap.hasCritical;
    let sectorColor = COLORS.cyan;
    if (state.signalMode === "muted") {
      sectorColor = COLORS.mutedLine;
    } else if (state.signalMode === "anomaly" && isCrit) {
      sectorColor = COLORS.alert;
    } else if (state.signalMode === "flood") {
      sectorColor = isCrit ? COLORS.lime : COLORS.cyan;
    }

    // 4 个同心圆（最外圈实线，内三圈虚线——完全呼应 273 原海报右上角雷达）
    for (let i = 1; i <= 4; i++) {
      const r = (R * i) / 4;
      ctx.beginPath();
      ctx.setLineDash(i === 4 ? [] : [3, 4]);
      ctx.strokeStyle = i === 4 ? "rgba(180, 198, 195, 0.30)" : "rgba(180, 198, 195, 0.16)";
      ctx.lineWidth = 1;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 十字正交轴线（略微探出外环，复刻原海报的青色坐标细线）
    const ext = R * 1.16;
    ctx.beginPath();
    ctx.strokeStyle = state.signalMode === "muted" ? "rgba(136,145,144,0.35)" : "rgba(59, 218, 237, 0.48)";
    ctx.lineWidth = 1;
    ctx.moveTo(cx - ext, cy);
    ctx.lineTo(cx + ext, cy);
    ctx.moveTo(cx, cy - ext);
    ctx.lineTo(cx, cy + ext);
    ctx.stroke();

    // 负载象限实心扇区（半径直接映射当前实时系统负载 0..100%，基准落在第一象限复刻原海报）
    const loadR = R * (0.34 + 0.64 * (snap.load / 100));
    const sweepOffset = still ? 0 : (state.minute / 1440) * Math.PI * 0.5;
    const startA = -Math.PI / 2 + sweepOffset * 0.18;
    const endA = startA + Math.PI * 0.5;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, loadR, startA, endA);
    ctx.closePath();
    ctx.fillStyle = sectorColor;
    ctx.globalAlpha = state.signalMode === "muted" ? 0.55 : 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;

    // 动态微光扫描指针（仅非 reduced-motion 缓慢扫过）
    if (!still) {
      const angle = (t * 0.9 + (state.minute / 1440) * Math.PI * 2) % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx.strokeStyle = sectorColor;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 80% 警戒刻度虚线环（仅在异常聚焦模式下清晰标示参考阈值）
    const warnR = R * (0.34 + 0.64 * 0.8);
    ctx.beginPath();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle =
      state.signalMode === "anomaly" && isCrit
        ? "rgba(255, 107, 74, 0.72)"
        : "rgba(242, 245, 244, 0.16)";
    ctx.lineWidth = 1;
    ctx.arc(cx, cy, warnR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 圆心锚点（复刻原海报青色圆心）
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(3.5, R * 0.085), 0, Math.PI * 2);
    ctx.fillStyle = sectorColor;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COLORS.bgDeep;
    ctx.stroke();

    // 右下角极简读数（宽画布上叠加，窄画布由下方文字标签呈现避免叠字）
    if (w >= 96) {
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = isCrit && state.signalMode === "anomaly" ? COLORS.alert : COLORS.white;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${snap.load}%`, w - 4, h - 3);
    }

    ctx.restore();
  };
}

export function createTrendRenderer(canvas, getState) {
  const ctx = canvas.getContext("2d");
  let cachedChannel = null;
  let cachedSeries = [];

  return function drawTrend() {
    const dim = syncCanvasSize(canvas);
    if (!dim || !ctx) return;
    const { w, h, dpr } = dim;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const state = getState();
    if (cachedChannel !== state.selectedChannel) {
      cachedChannel = state.selectedChannel;
      cachedSeries = getTrendSeries(cachedChannel);
    }
    const pts = cachedSeries;
    const snap = sampleTelemetry(state.minute, state.selectedChannel);

    const compact = w < 380;
    const padL = compact ? 30 : 38;
    const padR = compact ? 10 : 14;
    const padT = 14;
    const padB = 22;
    const plotW = Math.max(40, w - padL - padR);
    const plotH = Math.max(40, h - padT - padB);

    const xOf = (m) => padL + (m / 1440) * plotW;
    const yOf = (val) => padT + plotH - (Math.max(0, Math.min(100, val)) / 100) * plotH;

    // 背景 80% 警戒带（高载阈值区间）
    if (state.signalMode === "anomaly") {
      ctx.fillStyle = "rgba(255, 107, 74, 0.065)";
      ctx.fillRect(padL, padT, plotW, yOf(80) - padT);
    }

    // 横向百分比标线（0% / 25% / 50% / 75% / 100%，与原海报完全同构）
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const tick of [0, 25, 50, 75, 100]) {
      const y = Math.round(yOf(tick)) + 0.5;
      ctx.beginPath();
      ctx.strokeStyle = tick === 0 ? COLORS.gridStrong : COLORS.grid;
      ctx.lineWidth = 1;
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillStyle = COLORS.axis;
      ctx.fillText(`${tick}%`, padL - 6, y);
    }

    // X 轴时间刻度
    const xTicks = compact ? [0, 360, 720, 1080, 1440] : [0, 240, 480, 720, 960, 1200, 1440];
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const tm of xTicks) {
      const x = xOf(tm);
      ctx.fillStyle = COLORS.axis;
      const label = tm === 1440 ? "24:00" : `${String(tm / 60).padStart(2, "0")}:00`;
      ctx.fillText(label, Math.min(w - padR - 14, Math.max(padL + 14, x)), padT + plotH + 6);
    }

    // 三处关键告警事件垂直细标记（08:07 / 10:24 / 18:40）
    for (const inc of INCIDENTS) {
      if (inc.severity !== "critical") continue;
      const ix = xOf(inc.minute);
      const active = Math.abs(state.minute - inc.minute) <= 45;
      ctx.beginPath();
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle =
        state.signalMode === "muted"
          ? "rgba(136,145,144,0.22)"
          : state.signalMode === "flood"
          ? "rgba(173,230,45,0.45)"
          : active
          ? "rgba(255,107,74,0.75)"
          : "rgba(255,107,74,0.28)";
      ctx.lineWidth = 1;
      ctx.moveTo(ix, padT);
      ctx.lineTo(ix, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 上期虚线基准（仅在 showBaseline 开启时清晰呈现；关闭时淡隐以体现无基准）
    if (state.showBaseline) {
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const x = xOf(p.m);
        const y = yOf(p.prev);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLORS.prevDash;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 主线颜色：按渠道筛选或信号纪律决定
    const chObj = CHANNELS.find((c) => c.id === state.selectedChannel);
    let mainStroke = chObj ? chObj.color : COLORS.cyan;
    if (state.signalMode === "muted") mainStroke = COLORS.mutedLine;

    // 渐变微透明面积
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    if (state.signalMode === "muted") {
      grad.addColorStop(0, "rgba(136, 145, 144, 0.16)");
      grad.addColorStop(1, "rgba(136, 145, 144, 0.0)");
    } else if (state.signalMode === "flood") {
      grad.addColorStop(0, "rgba(59, 218, 237, 0.28)");
      grad.addColorStop(1, "rgba(173, 230, 45, 0.04)");
    } else {
      grad.addColorStop(0, chObj && chObj.id === "organic" ? "rgba(173, 230, 45, 0.18)" : "rgba(59, 218, 237, 0.16)");
      grad.addColorStop(1, "rgba(59, 218, 237, 0.0)");
    }

    ctx.beginPath();
    pts.forEach((p, idx) => {
      const x = xOf(p.m);
      const y = yOf(p.cur);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(pts[pts.length - 1].m), padT + plotH);
    ctx.lineTo(xOf(pts[0].m), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 主折线
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const x = xOf(p.m);
      const y = yOf(p.cur);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = mainStroke;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // 三个锚点小圆（复刻原海报折线节点圆点）
    for (let idx = 0; idx < pts.length; idx += 6) {
      const p = pts[idx];
      ctx.beginPath();
      ctx.arc(xOf(p.m), yOf(p.cur), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = mainStroke;
      ctx.fill();
    }

    // 当前 24h 时间拨尺扫描线与实时节点
    const curX = xOf(state.minute);
    const curY = yOf(snap.cur);
    const cursorColor =
      snap.hasCritical && state.signalMode === "anomaly"
        ? COLORS.alert
        : state.signalMode === "muted"
        ? COLORS.white
        : mainStroke;

    ctx.beginPath();
    ctx.strokeStyle = cursorColor;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 1.25;
    ctx.moveTo(curX, padT);
    ctx.lineTo(curX, padT + plotH);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 实时节点外环与内点
    ctx.beginPath();
    ctx.arc(curX, curY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = cursorColor;
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(curX, curY, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = cursorColor;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COLORS.bgDeep;
    ctx.stroke();

    // 悬浮读数标牌（自动防撞左右边界）
    const tagText = `${snap.timeStr} · 活跃 ${Math.round(snap.cur)}% · 负载 ${snap.load}%`;
    ctx.font = '600 10px "JetBrains Mono", monospace';
    const tw = ctx.measureText(tagText).width + 14;
    const th = 20;
    const tx = Math.min(w - padR - tw, Math.max(padL, curX - tw / 2));
    const ty = Math.max(2, curY - th - 10);

    ctx.fillStyle = "#0C0F0E";
    ctx.strokeStyle = cursorColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tx, ty, tw, th, 4) : ctx.rect(tx, ty, tw, th);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.white;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, tx + 7, ty + th / 2 + 0.5);

    ctx.restore();
  };
}
