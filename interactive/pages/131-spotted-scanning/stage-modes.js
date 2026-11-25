// 03 节「斑点与另四种扫读」：同一专题页在四种读者心智下的真实眼动落点对照画布
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./model.js";

export const SCAN_MODES = {
  spotted: {
    id: "spotted",
    label: "斑点扫描 · 131",
    task: "读者带着具体目标：「票价多少钱？周六有没有直播？」",
    note: "视线直接跳过连篇介绍文字，在「¥199 早鸟」「周六 20:00 直播」「32 位讲者」「报名入口」四处孤立高对比热点间非线性跳跃。",
    // 归一化落点序列 (x, y, weight)
    points: [
      { x: 0.24, y: 0.28, r: 16, tag: "¥199 早鸟" },
      { x: 0.74, y: 0.34, r: 19, tag: "周六 20:00 直播" },
      { x: 0.64, y: 0.68, r: 14, tag: "32 位讲者" },
      { x: 0.29, y: 0.78, r: 17, tag: "立即领票" },
    ],
    color: PALETTE.cyan,
    dashed: true,
  },
  layercake: {
    id: "layercake",
    label: "层蛋糕扫描 · 130",
    task: "读者想先摸清整页目录：「这活动分哪几个板块？」",
    note: "眼睛逐条横扫加粗小标题，完全跳过每段灰字正文，只在感兴趣的那一层停下细读（详看 130 页）。",
    points: [
      { x: 0.14, y: 0.22, r: 13 }, { x: 0.62, y: 0.22, r: 12 },
      { x: 0.14, y: 0.45, r: 13 }, { x: 0.56, y: 0.45, r: 12 },
      { x: 0.14, y: 0.68, r: 13 }, { x: 0.52, y: 0.68, r: 12 },
    ],
    color: "#F98F6F",
    dashed: false,
  },
  fpattern: {
    id: "fpattern",
    label: "F 型扫描 · 127",
    task: "遇到没有分层的密排说明段落，读者急着找重点：",
    note: "视线只在开头两行横向扫读，随后贴着左边界一路垂直滑落，右半区大段正文几乎落入盲区（详看 127 页）。",
    points: [
      { x: 0.14, y: 0.20, r: 16 }, { x: 0.78, y: 0.20, r: 13 },
      { x: 0.14, y: 0.37, r: 15 }, { x: 0.48, y: 0.37, r: 12 },
      { x: 0.14, y: 0.56, r: 12 }, { x: 0.14, y: 0.78, r: 11 },
    ],
    color: PALETTE.warn,
    dashed: false,
  },
  commitment: {
    id: "commitment",
    label: "承诺细读",
    task: "决定下单后，读者仔细核对退票与发票细则：",
    note: "进入高投入阅读状态，眼睛几乎逐行匀速扫完每个词——这时候花哨的斑点高亮反而会打断沉浸理解。",
    points: [
      { x: 0.14, y: 0.22, r: 10 }, { x: 0.84, y: 0.22, r: 10 },
      { x: 0.14, y: 0.36, r: 10 }, { x: 0.84, y: 0.36, r: 10 },
      { x: 0.14, y: 0.50, r: 10 }, { x: 0.84, y: 0.50, r: 10 },
      { x: 0.14, y: 0.64, r: 10 }, { x: 0.84, y: 0.64, r: 10 },
      { x: 0.14, y: 0.78, r: 10 }, { x: 0.74, y: 0.78, r: 10 },
    ],
    color: PALETTE.violetSoft,
    dashed: false,
  },
};

export function mountModesStage(canvas, getMode) {
  const ctx = canvas.getContext("2d");
  let w = 640, h = 340, dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(280, Math.round(r.width));
    h = Math.max(220, Math.round(r.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  resize();
  new ResizeObserver(() => { resize(); ctl.draw(); }).observe(canvas);

  function drawWireframe() {
    ctx.fillStyle = "#0C1118";
    ctx.fillRect(0, 0, w, h);

    // 模拟同一张活动专题页底图
    const pad = 24;
    const pw = w - pad * 2;
    const ph = h - pad * 2;
    ctx.fillStyle = "#121822";
    ctx.strokeStyle = "#242E3D";
    ctx.lineWidth = 1;
    ctx.fillRect(pad, pad, pw, ph);
    ctx.strokeRect(pad, pad, pw, ph);

    // 三层标题行 + 灰字正文占位
    const bands = [0.22, 0.45, 0.68];
    bands.forEach((by, idx) => {
      const y = h * by;
      ctx.fillStyle = "#3A4658";
      ctx.fillRect(pad + 18, y - 6, pw * (0.44 - idx * 0.05), 8);
      ctx.fillStyle = "#222B37";
      ctx.fillRect(pad + 18, y + 10, pw * 0.78, 5);
      ctx.fillRect(pad + 18, y + 21, pw * 0.66, 5);
    });

    // 四枚嵌在版面里的真实高对比信息斑点
    const spots = [
      { x: 0.24, y: 0.28, label: "¥199", bg: "rgba(56,218,245,0.22)", stroke: PALETTE.cyan },
      { x: 0.74, y: 0.34, label: "20:00", bg: "rgba(132,73,239,0.28)", stroke: PALETTE.violetSoft },
      { x: 0.64, y: 0.68, label: "32 讲者", bg: "rgba(13,60,251,0.3)", stroke: PALETTE.blueSoft },
      { x: 0.29, y: 0.78, label: "立即领票", bg: "rgba(56,218,245,0.22)", stroke: PALETTE.cyan },
    ];
    ctx.font = `600 10.5px "DM Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const sp of spots) {
      const sx = w * sp.x, sy = h * sp.y;
      const bw = ctx.measureText(sp.label).width + 16;
      ctx.fillStyle = sp.bg;
      ctx.strokeStyle = sp.stroke;
      ctx.lineWidth = 1;
      ctx.fillRect(sx - bw / 2, sy - 10, bw, 20);
      ctx.strokeRect(sx - bw / 2, sy - 10, bw, 20);
      ctx.fillStyle = PALETTE.white;
      ctx.fillText(sp.label, sx, sy + 0.5);
    }
  }

  function frame(t, _dt, { still }) {
    const mode = SCAN_MODES[getMode()] || SCAN_MODES.spotted;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWireframe();

    const pts = mode.points.map((p) => ({ x: p.x * w, y: p.y * h, r: p.r }));
    const progress = still ? 1 : Math.min(1, ((t * 0.32) % 1.25));
    const totalSeg = pts.length - 1;
    const drawSegs = progress * totalSeg;

    // 轨迹线
    ctx.strokeStyle = mode.color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    if (mode.dashed) ctx.setLineDash([5, 6]);
    for (let i = 0; i < totalSeg; i++) {
      const segP = Math.max(0, Math.min(1, drawSegs - i));
      if (segP <= 0) break;
      const a = pts[i], b = pts[i + 1];
      const ex = a.x + (b.x - a.x) * segP;
      const ey = a.y + (b.y - a.y) * segP;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 凝视注视点（圆越大代表停留越久）
    pts.forEach((p, i) => {
      if (i > drawSegs + 0.05) return;
      ctx.fillStyle = mode.color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `600 10px "DM Mono", monospace`;
      ctx.fillStyle = "#06080B";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (p.r >= 13) {
        ctx.fillStyle = PALETTE.white;
        ctx.fillText(String(i + 1), p.x + p.r * 0.78, p.y - p.r * 0.72);
      }
    });

    ctx.restore();
  }

  const ctl = loop(canvas, frame);
  return { draw: () => ctl.draw() };
}
