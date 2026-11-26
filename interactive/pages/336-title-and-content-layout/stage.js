// 336 标题和内容 幻灯片版式 · 母版手术台 2D Canvas 渲染与直接交互引擎
// 1:1 承袭 336 原海报克莱因蓝 × 暖米宣纸 × 柠檬铬黄 × 建筑冷灰包豪斯测绘质感

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { audit, clamp, computeLayout } from "./model.js";

const C = {
  blue: "#0A44C6",
  blueDeep: "#07246A",
  blueSoft: "rgba(10, 68, 198, 0.10)",
  blueMid: "rgba(10, 68, 198, 0.28)",
  yellow: "#F6BC07",
  yellowInk: "#825300",
  cream: "#F3EDE3",
  paperLight: "#FAF7F0",
  grayBlock: "#DBDAD5",
  guideLine: "#A3A8B2",
  ink: "#111318",
  inkSub: "#3D4350",
  red: "#C42B1C",
  redSoft: "rgba(196, 43, 28, 0.11)",
  green: "#0C6B4B",
  greenSoft: "rgba(12, 107, 75, 0.10)",
};

const FONT_ZH = '"Noto Sans SC", sans-serif';
const FONT_EN = '"IBM Plex Sans", sans-serif';
const FONT_MONO = '"JetBrains Mono", monospace';
const FONT_DISP = '"Bricolage Grotesque", sans-serif';

export function createSlideStage({ canvas, getState, onPatch, onAfterRender }) {
  const ctx = canvas.getContext("2d");
  const W = 960;
  const H = 540;

  let intro = reducedMotion.matches ? 1 : 0;
  let hoverZone = null;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartSplit = 0.52;
  let dragMoved = false;
  let touchAxis = null; // "x" | "y" | null
  let scanActive = false;
  let scanT = 0;
  let pulseZone = null;
  let pulseT = 0;
  let dirty = true;
  let lastLayout = null;
  let lastAudit = null;

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const pw = Math.max(320, Math.round((rect.width || W) * dpr));
    const ph = Math.max(180, Math.round((rect.height || H) * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  function toLogical(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / Math.max(1, r.width)) * W,
      y: ((clientY - r.top) / Math.max(1, r.height)) * H,
    };
  }

  function hitTest(pt, layout) {
    const z = layout.hitZones;
    const inRect = (rc) => rc && pt.x >= rc.x && pt.x <= rc.x + rc.w && pt.y >= rc.y && pt.y <= rc.y + rc.h;
    if (z.alignBadge && inRect(z.alignBadge)) return "alignBadge";
    if (inRect(z.gutter)) return "gutter";
    if (inRect(z.title)) return "title";
    if (inRect(z.visual)) return "visual";
    if (inRect(z.bullets)) return "bullets";
    return null;
  }

  function drawStar(cx, cy, outerR, innerR) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawBauhausVisual(gr, p) {
    // 1:1 承袭 336 原海报右侧几何构成：建筑浅灰立柱 + 4×5 钴蓝点阵 + 钴蓝实圆 + 明黄正三角
    const pad = Math.min(gr.w, gr.h) * 0.05;
    const x = gr.x + pad;
    const y = gr.y + pad;
    const w = Math.max(40, gr.w - pad * 2);
    const h = Math.max(40, gr.h - pad * 2);

    // 浅灰矩形背景板
    const rectW = w * 0.46;
    const rectH = h * 0.88 * p;
    const rectX = x + w - rectW;
    const rectY = y + h * 0.06;
    ctx.fillStyle = C.grayBlock;
    ctx.fillRect(rectX, rectY, rectW, rectH);

    // 4×5 钴蓝小圆点阵（原海报同款）
    ctx.fillStyle = C.blue;
    const cols = 5;
    const rows = 5;
    const dotAreaW = rectW * 0.56;
    const dotAreaH = rectH * 0.34;
    const d0x = rectX + rectW * 0.32;
    const d0y = rectY + rectH * 0.24;
    const dotR = clamp(Math.min(w, h) * 0.011, 1.8, 3.2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.arc(d0x + (c / (cols - 1)) * dotAreaW, d0y + (r / (rows - 1)) * dotAreaH, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 钴蓝实心圆（保持 1:1 正圆绝不变椭圆）
    const circR = Math.min(w * 0.27, h * 0.26) * p;
    const cx = x + w * 0.34;
    const cy = y + h * 0.31;
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(cx, cy, circR, 0, Math.PI * 2);
    ctx.fill();

    // 明黄大三角
    ctx.fillStyle = C.yellow;
    const baseY = y + h * 0.94;
    const apexY = y + h * (0.94 - 0.52 * p);
    const apexX = x + w * 0.50;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.02, baseY);
    ctx.lineTo(x + w * 0.96, baseY);
    ctx.lineTo(apexX, apexY);
    ctx.closePath();
    ctx.fill();
  }

  function drawRetentionChart(gr, p) {
    // 季报复盘页：6-9月老客复购率真实折线+柱状归因证据图
    const padX = Math.max(24, gr.w * 0.11);
    const padTop = 28;
    const padBot = 30;
    const x0 = gr.x + padX;
    const y0 = gr.y + padTop;
    const cw = Math.max(40, gr.w - padX * 1.45);
    const ch = Math.max(40, gr.h - padTop - padBot);

    ctx.fillStyle = C.paperLight;
    ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
    ctx.strokeStyle = "#D4D2CA";
    ctx.lineWidth = 1;
    ctx.strokeRect(gr.x + 0.5, gr.y + 0.5, gr.w - 1, gr.h - 1);

    // 网格水平线
    const ticks = [20, 30, 40, 50];
    ctx.font = `600 10.5px ${FONT_MONO}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of ticks) {
      const ty = y0 + ch - ((v - 15) / 40) * ch;
      ctx.strokeStyle = "#E4E1D8";
      ctx.beginPath();
      ctx.moveTo(x0, ty);
      ctx.lineTo(x0 + cw, ty);
      ctx.stroke();
      ctx.fillStyle = C.inkSub;
      ctx.fillText(`${v}%`, x0 - 6, ty);
    }

    const pts = [
      { m: "6月", v: 26, hi: false },
      { m: "7月*", v: 31, hi: true },
      { m: "8月", v: 36, hi: true },
      { m: "9月", v: 40, hi: true },
    ];
    const barW = clamp(cw * 0.14, 14, 38);
    const coords = pts.map((d, i) => {
      const cx = x0 + ((i + 0.5) / pts.length) * cw;
      const val = 15 + (d.v - 15) * p;
      const cy = y0 + ch - ((val - 15) / 40) * ch;
      return { ...d, cx, cy };
    });

    // 柱子 + 7月节点黄高亮标
    for (const d of coords) {
      ctx.fillStyle = d.hi ? (d.m === "9月" ? C.blue : "rgba(10,68,198,0.22)") : C.grayBlock;
      ctx.fillRect(d.cx - barW / 2, d.cy, barW, y0 + ch - d.cy);
      ctx.fillStyle = C.ink;
      ctx.font = `600 11px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(d.m, d.cx, y0 + ch + 8);
    }

    // 趋势连线与数值标
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    coords.forEach((d, i) => (i === 0 ? ctx.moveTo(d.cx, d.cy) : ctx.lineTo(d.cx, d.cy)));
    ctx.stroke();

    for (const d of coords) {
      ctx.fillStyle = d.m === "9月" ? C.yellow : "#FFFFFF";
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(d.cx, d.cy, d.m === "9月" ? 6 : 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = d.m === "9月" ? C.blue : C.ink;
      ctx.font = `700 11.5px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${d.v}%`, d.cx, d.cy - 8);
    }

    // 右上角 +14pp 徽标
    if (gr.w > 190) {
      ctx.fillStyle = C.yellow;
      ctx.fillRect(gr.x + gr.w - 88, gr.y + 8, 78, 20);
      ctx.fillStyle = C.ink;
      ctx.font = `700 11px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+14 pp", gr.x + gr.w - 49, gr.y + 18);
    }
  }

  function drawSciCurveChart(gr, p) {
    // 科研论断页：500h 热震剥落率双曲线对照
    const padX = Math.max(26, gr.w * 0.12);
    const padTop = 30;
    const padBot = 30;
    const x0 = gr.x + padX;
    const y0 = gr.y + padTop;
    const cw = Math.max(40, gr.w - padX * 1.45);
    const ch = Math.max(40, gr.h - padTop - padBot);

    ctx.fillStyle = C.paperLight;
    ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
    ctx.strokeStyle = "#D4D2CA";
    ctx.lineWidth = 1;
    ctx.strokeRect(gr.x + 0.5, gr.y + 0.5, gr.w - 1, gr.h - 1);

    // 网格
    ctx.font = `600 10px ${FONT_MONO}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of [0, 10, 20, 30]) {
      const ty = y0 + ch - (v / 32) * ch;
      ctx.strokeStyle = "#E4E1D8";
      ctx.beginPath();
      ctx.moveTo(x0, ty);
      ctx.lineTo(x0 + cw, ty);
      ctx.stroke();
      ctx.fillStyle = C.inkSub;
      ctx.fillText(`${v}%`, x0 - 6, ty);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const hVal of [0, 180, 350, 500]) {
      const tx = x0 + (hVal / 500) * cw;
      ctx.fillStyle = C.inkSub;
      ctx.fillText(`${hVal}h`, tx, y0 + ch + 8);
    }

    // 180h 分化虚线
    const splitX = x0 + (180 / 500) * cw;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#9EA2A8";
    ctx.beginPath();
    ctx.moveTo(splitX, y0);
    ctx.lineTo(splitX, y0 + ch);
    ctx.stroke();
    ctx.restore();

    const single = [[0, 0.5], [100, 3.2], [180, 6.4], [300, 17.5], [400, 23.8], [500, 28.0]];
    const dual = [[0, 0.4], [100, 1.5], [180, 2.7], [300, 4.3], [400, 5.6], [500, 6.8]];

    const drawLine = (pts, color, dash) => {
      ctx.save();
      if (dash) ctx.setLineDash(dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      pts.forEach(([hVal, v], i) => {
        const px = x0 + (hVal / 500) * cw * p;
        const py = y0 + ch - (v / 32) * ch;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
    };
    drawLine(single, C.yellowInk, [6, 4]);
    drawLine(dual, C.blue, null);

    // 末端圆点与标注
    const lastS = single[single.length - 1];
    const lastD = dual[dual.length - 1];
    const sx = x0 + cw * p;
    const sy = y0 + ch - (lastS[1] / 32) * ch;
    const dy = y0 + ch - (lastD[1] / 32) * ch;
    ctx.fillStyle = C.yellow;
    ctx.strokeStyle = C.yellowInk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(sx, dy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `700 10.5px ${FONT_ZH}`;
    ctx.textAlign = "right";
    ctx.fillStyle = C.yellowInk;
    ctx.fillText("单层 28%", sx - 8, sy - 6);
    ctx.fillStyle = C.blue;
    ctx.fillText("双层 6.8%", sx - 8, dy - 8);
  }

  function drawVisualArea(state, layout, p) {
    const gr = layout.graphicRect;
    if (state.visualMode === "complement") {
      if (layout.scene.chartKind === "retention") drawRetentionChart(gr, p);
      else if (layout.scene.chartKind === "curve") drawSciCurveChart(gr, p);
      else drawBauhausVisual(gr, p);
      return;
    }

    if (state.visualMode === "redundant") {
      // 错态：把左列文字塞进花哨三卡片里原样复读，触发迈耶冗余告警
      ctx.fillStyle = "#EAE6DC";
      ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(gr.x + 1, gr.y + 1, gr.w - 2, gr.h - 2);
      ctx.restore();

      const cards = layout.scene.redundantCards;
      const pad = 12;
      const gap = 8;
      const topBar = 32;
      const availH = Math.max(60, gr.h - topBar - pad * 2 - gap * (cards.length - 1));
      const cardH = availH / cards.length;

      // 顶栏红色复读告警签
      ctx.fillStyle = C.red;
      ctx.fillRect(gr.x + pad, gr.y + 8, Math.min(gr.w - pad * 2, 168), 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 10.5px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("× 图文复读 · 点击换成真图", gr.x + pad + 7, gr.y + 18);

      cards.forEach((txt, i) => {
        const cy = gr.y + topBar + pad * 0.4 + i * (cardH + gap);
        ctx.fillStyle = "#FAF7F0";
        ctx.fillRect(gr.x + pad, cy, gr.w - pad * 2, cardH);
        ctx.strokeStyle = "#C7BEB0";
        ctx.lineWidth = 1;
        ctx.strokeRect(gr.x + pad, cy, gr.w - pad * 2, cardH);

        ctx.fillStyle = C.blue;
        ctx.fillRect(gr.x + pad, cy, 4, cardH);

        ctx.fillStyle = C.inkSub;
        const fz = clamp(gr.w * 0.056, 10, 13.5);
        ctx.font = `600 ${fz}px ${FONT_ZH}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const label = gr.w < 170 ? txt.slice(0, 8) + "…" : txt;
        ctx.fillText(`0${i + 1} ${label}`, gr.x + pad + 12, cy + cardH / 2);
      });
      return;
    }

    // 错态：无关装饰贴图（花哨无意义几何浮泡，不承载证据）
    ctx.fillStyle = "#EBE6DC";
    ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(gr.x + 1, gr.y + 1, gr.w - 2, gr.h - 2);
    ctx.restore();

    const cx = gr.x + gr.w * 0.5;
    const cy = gr.y + gr.h * 0.56;
    const rBase = Math.min(gr.w, gr.h) * 0.22;
    ctx.fillStyle = "rgba(10,68,198,0.16)";
    ctx.beginPath();
    ctx.arc(cx - rBase * 0.55, cy - rBase * 0.25, rBase * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(246,188,7,0.34)";
    ctx.beginPath();
    ctx.arc(cx + rBase * 0.45, cy + rBase * 0.25, rBase * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8C929E";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - rBase * 0.9, cy - rBase * 0.65, rBase * 1.8, rBase * 1.3);

    ctx.fillStyle = C.red;
    ctx.fillRect(gr.x + 10, gr.y + 8, Math.min(gr.w - 20, 168), 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 10.5px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("× 无关装饰 · 点击换证据图", gr.x + 16, gr.y + 18);
  }

  function drawScanOverlay(layout, res) {
    // 演练 Z/F 阅读动线动画：正常态顺滑流过 1标题→2左要点→3右图→4图注；错态则真实演示卡顿/折返
    const { headerRect, textCol, graphicRect, captionRect } = layout;
    const p1 = { x: headerRect.x + Math.min(headerRect.w * 0.22, 130), y: headerRect.y + headerRect.h * 0.44 };
    const p2 = { x: headerRect.x + Math.min(headerRect.w * 0.72, 460), y: headerRect.y + headerRect.h * 0.44 };
    const p3 = { x: textCol.x + textCol.w * 0.35, y: textCol.y + Math.min(textCol.h * 0.35, 110) };
    const p4 = { x: textCol.x + textCol.w * 0.42, y: textCol.y + Math.min(textCol.h * 0.72, 230) };
    const p5 = { x: graphicRect.x + graphicRect.w * 0.5, y: graphicRect.y + graphicRect.h * 0.48 };
    const p6 = { x: captionRect.x + captionRect.w * 0.45, y: captionRect.h ? captionRect.y + 22 : graphicRect.y + graphicRect.h * 0.85 };

    // 错态路径加入折返锯齿，直观体现视线被冗长/复读/串行打断
    const waypoints = res.allPass
      ? [p1, p2, p3, p4, p5, p6]
      : [
          p1,
          p3,
          { x: p5.x - 20, y: p3.y + 6 },
          { x: p3.x + 28, y: p4.y - 18 },
          p5,
          { x: p1.x + 60, y: p1.y + 12 },
          p4,
        ];

    const segs = waypoints.length - 1;
    const prog = clamp(scanT / 2.6, 0, 1);
    const exact = prog * segs;

    ctx.save();
    ctx.strokeStyle = res.allPass ? C.blue : C.red;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (!res.allPass) ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    let cur = waypoints[0];
    for (let i = 0; i < segs; i++) {
      if (exact >= i + 1) {
        ctx.lineTo(waypoints[i + 1].x, waypoints[i + 1].y);
        cur = waypoints[i + 1];
      } else if (exact > i) {
        const f = exact - i;
        cur = {
          x: waypoints[i].x + (waypoints[i + 1].x - waypoints[i].x) * f,
          y: waypoints[i].y + (waypoints[i + 1].y - waypoints[i].y) * f,
        };
        ctx.lineTo(cur.x, cur.y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 路径编号圆点
    const stops = res.allPass
      ? [
          { pt: p1, n: "1", tag: "标题结论" },
          { pt: p3, n: "2", tag: "左列要点" },
          { pt: p5, n: "3", tag: "右图作证" },
          { pt: p6, n: "4", tag: "图注落脚" },
        ]
      : [
          { pt: p1, n: "?", tag: "抓不到结论" },
          { pt: p3, n: "!", tag: "字墙卡顿" },
          { pt: p5, n: "×", tag: "折返复读" },
        ];
    stops.forEach((s) => {
      ctx.fillStyle = res.allPass ? C.blue : C.red;
      ctx.beginPath();
      ctx.arc(s.pt.x, s.pt.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 11px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.n, s.pt.x, s.pt.y + 0.5);
    });

    // 移动光点
    ctx.fillStyle = res.allPass ? C.yellow : C.red;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function render(t, dt, { still }) {
    syncCanvasSize();
    const animating = intro < 1 || scanActive || pulseT > 0;
    if (!dirty && !animating && !still) return;
    dirty = false;
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.1);
    }
    if (scanActive && !still) {
      scanT += Math.max(dt, 0.016);
      if (scanT >= 3.2) {
        scanActive = false;
        scanT = 0;
      }
    }
    if (pulseT > 0 && !still) {
      pulseT = Math.max(0, pulseT - Math.max(dt, 0.016));
      if (pulseT === 0) pulseZone = null;
    }

    const ease = 1 - Math.pow(1 - intro, 3);
    const state = getState();
    const layout = computeLayout(state, W, H);
    const res = audit(state, layout);
    lastLayout = layout;
    lastAudit = res;

    ctx.save();
    ctx.scale(canvas.width / W, canvas.height / H);

    // 1. 幻灯片暖米画纸基底（1:1 原海报 #F3EDE3）
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, H);

    // 2. 外边距（MARGIN）测绘带着色与虚线框
    const { inner, headerRect, textCol, gutterRect, visualCol, graphicRect, captionRect } = layout;
    const focusP = state.focusPrinciple;

    if (state.guides.margin || focusP === 2 || state.marginPct < 0.048 || state.marginPct > 0.135) {
      const marginBad = state.marginPct < 0.048 || state.marginPct > 0.135;
      ctx.fillStyle = marginBad ? C.redSoft : focusP === 2 ? C.blueSoft : "rgba(10, 68, 198, 0.035)";
      // 上下左右四条边距带
      ctx.fillRect(0, 0, W, inner.y);
      ctx.fillRect(0, inner.y + inner.h, W, H - (inner.y + inner.h));
      ctx.fillRect(0, inner.y, inner.x, inner.h);
      ctx.fillRect(inner.x + inner.w, inner.y, W - (inner.x + inner.w), inner.h);

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = marginBad ? C.red : C.guideLine;
      ctx.lineWidth = marginBad ? 1.5 : 1.1;
      ctx.strokeRect(inner.x + 0.5, inner.y + 0.5, inner.w - 1, inner.h - 1);
      ctx.restore();

      // 顶部外边距实测数值
      ctx.font = `600 10px ${FONT_MONO}`;
      ctx.fillStyle = marginBad ? C.red : C.inkSub;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`MARGIN ${layout.marginPctInt}%`, inner.x + inner.w, Math.max(9, inner.y / 2));
    }

    // 3. 标题区与内容区横虚线（原海报标志横虚线）
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = focusP === 1 ? C.blue : C.guideLine;
    ctx.lineWidth = focusP === 1 ? 1.6 : 1.1;
    const splitY = headerRect.y + headerRect.h + Math.round(H * 0.012);
    ctx.beginPath();
    ctx.moveTo(inner.x, splitY);
    ctx.lineTo(inner.x + inner.w, splitY);
    ctx.stroke();
    ctx.restore();

    // 4. 内容区底纹（当开启 CONTENT AREA 图例开关或聚焦时）
    if (state.guides.content) {
      ctx.fillStyle = focusP === 0 ? "rgba(10, 68, 198, 0.055)" : "rgba(219, 218, 213, 0.25)";
      ctx.fillRect(textCol.x, textCol.y, textCol.w, textCol.h);
      ctx.fillRect(visualCol.x, visualCol.y, visualCol.w, visualCol.h);
    }

    // 5. 中缝栏间距通道（GUTTER）与可拖动把手
    const gutterBad = state.gutterPct < 0.028 || state.gutterPct > 0.105;
    if (state.guides.gutter || focusP === 3 || gutterBad || hoverZone === "gutter" || dragging) {
      ctx.fillStyle = gutterBad ? C.redSoft : dragging || hoverZone === "gutter" ? "rgba(10, 68, 198, 0.16)" : "rgba(10, 68, 198, 0.06)";
      ctx.fillRect(gutterRect.x, gutterRect.y, gutterRect.w, gutterRect.h);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = gutterBad ? C.red : C.blue;
      ctx.lineWidth = dragging || hoverZone === "gutter" ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.moveTo(gutterRect.x, gutterRect.y);
      ctx.lineTo(gutterRect.x, gutterRect.y + gutterRect.h);
      ctx.moveTo(gutterRect.x + gutterRect.w, gutterRect.y);
      ctx.lineTo(gutterRect.x + gutterRect.w, gutterRect.y + gutterRect.h);
      ctx.stroke();
      ctx.restore();
    }

    // 悬停/手术反馈高亮
    const drawHoverRing = (rc, label, isBad) => {
      ctx.save();
      ctx.strokeStyle = isBad ? C.red : C.blue;
      ctx.lineWidth = 2;
      ctx.strokeRect(rc.x - 3, rc.y - 3, rc.w + 6, rc.h + 6);
      ctx.fillStyle = isBad ? C.red : C.blue;
      const bw = Math.min(rc.w, 152);
      ctx.fillRect(rc.x + rc.w - bw + 3, Math.max(4, rc.y - 22), bw, 19);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 10.5px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, rc.x + rc.w - bw / 2 + 3, Math.max(13.5, rc.y - 12.5));
      ctx.restore();
    };

    if (hoverZone === "title" || pulseZone === "title") {
      drawHoverRing(headerRect, "点击切换标题形态", state.titleMode !== "assertion");
    } else if (hoverZone === "bullets" || pulseZone === "bullets") {
      drawHoverRing(textCol, "点击精简/调整要点", state.bulletMode === "overload" || state.bulletMode === "sparse");
    } else if (hoverZone === "visual" || pulseZone === "visual") {
      drawHoverRing(visualCol, "点击切换图文关系", state.visualMode !== "complement");
    }

    // 6. 绘制顶部「标题区」文字 + 原海报招牌明黄短横杠
    const titleBad = state.titleMode !== "assertion" || state.titleRatio < 1.55 || state.titleRatio > 3.1;
    ctx.save();
    ctx.globalAlpha = ease;
    ctx.fillStyle = C.ink;
    ctx.font = `900 ${layout.titlePx.toFixed(1)}px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    layout.titleLines.forEach((line, i) => {
      ctx.fillText(line, headerRect.x, headerRect.y + i * layout.titleLineH);
    });

    // 原海报招牌黄短横线（结论标题时为锐利明黄，空洞目录题时变暗灰短虚线提示锚点失效）
    const barY = headerRect.y + layout.titleLines.length * layout.titleLineH + 6;
    if (state.titleMode === "assertion") {
      ctx.fillStyle = C.yellow;
      ctx.fillRect(headerRect.x, barY, Math.round(54 * ease), 4.5);
    } else {
      ctx.fillStyle = C.red;
      ctx.fillRect(headerRect.x, barY, 32, 3);
      // 标题角标提示错态
      const tagText = state.titleMode === "vague" ? "× 目录空题 · 点击改结论" : "× 标题过长 · 点击精简";
      ctx.fillStyle = C.red;
      ctx.fillRect(headerRect.x + 42, barY - 8, 152, 19);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 10.5px ${FONT_ZH}`;
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, headerRect.x + 49, barY + 1.5);
    }
    ctx.restore();

    // 7. 绘制左列「要点区」（原海报小标题 + 钴蓝实心圆点 + 逐字折行 + 底部蓝线与蓝圆白星 TIP）
    ctx.save();
    ctx.beginPath();
    ctx.rect(textCol.x - 4, textCol.y - 4, textCol.w + 8, textCol.h + 8);
    ctx.clip();
    ctx.globalAlpha = ease;

    let cy = textCol.y + 4;
    ctx.fillStyle = C.ink;
    ctx.font = `700 ${layout.subheadPx.toFixed(1)}px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (const sl of layout.subheadLines) {
      ctx.fillText(sl, textCol.x, cy);
      cy += layout.subheadPx * 1.28;
    }
    cy += layout.bodyPx * 0.65;

    const bulletOver = state.bulletMode === "overload";
    ctx.font = `400 ${layout.bodyPx.toFixed(1)}px ${FONT_ZH}`;
    for (const lines of layout.wrappedBullets) {
      // 钴蓝实心圆点（字墙错态时染红警示）
      ctx.fillStyle = bulletOver ? C.red : C.blue;
      ctx.beginPath();
      ctx.arc(textCol.x + 5, cy + layout.bodyPx * 0.56, bulletOver ? 3.2 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = C.inkSub;
      for (const l of lines) {
        ctx.fillText(l, textCol.x + layout.bulletIndent, cy);
        cy += layout.bulletLineH;
      }
      cy += layout.bulletGap;
    }

    // 底部 1:1 复刻原海报细蓝横线 + 蓝圆白星「提示 TIP」
    if (layout.showTipInSlide) {
      const tipTop = textCol.y + textCol.h - layout.tipH;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(textCol.x, tipTop - 8);
      ctx.lineTo(textCol.x + textCol.w - 6, tipTop - 8);
      ctx.stroke();

      const starR = 17;
      const sx = textCol.x + starR + 2;
      const sy = tipTop + layout.tipH * 0.48;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(sx, sy, starR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      drawStar(sx, sy, 9.5, 4.2);

      const tx = sx + starR + 12;
      ctx.fillStyle = C.ink;
      ctx.font = `700 12px ${FONT_ZH}`;
      ctx.textBaseline = "top";
      ctx.fillText("提示 TIP", tx, tipTop + 4);
      ctx.fillStyle = C.inkSub;
      ctx.font = `400 11.2px ${FONT_ZH}`;
      const tipMaxW = Math.max(60, textCol.w - (tx - textCol.x) - 4);
      // 手动折两行展示 TIP
      const chars = [...layout.scene.tipText];
      let l1 = "";
      let l2 = "";
      for (const ch of chars) {
        if (ctx.measureText(l1 + ch).width <= tipMaxW) l1 += ch;
        else if (ctx.measureText(l2 + ch).width <= tipMaxW - 8) l2 += ch;
      }
      ctx.fillText(l1, tx, tipTop + 21);
      if (l2) ctx.fillText(l2, tx, tipTop + 37);
    } else if (bulletOver) {
      // 字墙溢出红底警告条
      ctx.fillStyle = C.red;
      ctx.fillRect(textCol.x, textCol.y + textCol.h - 24, Math.min(textCol.w, 224), 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 11px ${FONT_ZH}`;
      ctx.textBaseline = "middle";
      ctx.fillText("× 6 条长段挤爆内容区 · 点击精简", textCol.x + 8, textCol.y + textCol.h - 13);
    }
    ctx.restore();

    // 8. 绘制右侧「图形区」与「图注 / 说明文字」
    ctx.save();
    ctx.globalAlpha = ease;
    drawVisualArea(state, layout, ease);

    if (state.captionOn) {
      ctx.fillStyle = C.ink;
      ctx.font = `700 13px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(layout.scene.captionTitle, captionRect.x, captionRect.y + 2);

      ctx.fillStyle = C.inkSub;
      ctx.font = `400 11.5px ${FONT_ZH}`;
      const capMaxW = Math.max(70, captionRect.w - 4);
      const capChars = [...layout.scene.captionBody];
      let cl1 = "";
      let cl2 = "";
      for (const ch of capChars) {
        if (ctx.measureText(cl1 + ch).width <= capMaxW) cl1 += ch;
        else if (ctx.measureText(cl2 + ch).width <= capMaxW - 8) cl2 += ch;
      }
      ctx.fillText(cl1, captionRect.x, captionRect.y + 21);
      if (cl2) ctx.fillText(cl2, captionRect.x, captionRect.y + 38);
    } else if (state.visualMode === "complement") {
      // 补注提醒虚框
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = C.yellowInk;
      ctx.strokeRect(visualCol.x + 1, visualCol.y + visualCol.h - 24, visualCol.w - 2, 22);
      ctx.restore();
      ctx.fillStyle = C.yellowInk;
      ctx.font = `600 10.5px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("缺图注槽位 · 请打开下方「图注说明」", visualCol.x + visualCol.w / 2, visualCol.y + visualCol.h - 13);
    }
    ctx.restore();

    // 9. 左缘对齐参考垂线（错牙时显出朱砂红偏差标注，可直接点击对齐！）
    if (!state.aligned || focusP === 2) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = state.aligned ? C.green : C.red;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(headerRect.x, inner.y - 6);
      ctx.lineTo(headerRect.x, inner.y + inner.h + 4);
      ctx.stroke();
      if (!state.aligned) {
        ctx.beginPath();
        ctx.moveTo(textCol.x, textCol.y - 4);
        ctx.lineTo(textCol.x, textCol.y + textCol.h);
        ctx.stroke();

        const b = layout.hitZones.alignBadge;
        ctx.setLineDash([]);
        ctx.fillStyle = C.red;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 11px ${FONT_ZH}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`× 左缘错牙 ${layout.alignDeltaPx}px · 点此齐线`, b.x + b.w / 2, b.y + b.h / 2);
      }
      ctx.restore();
    }

    // 10. 中缝可拖拉推柄（始终清晰可见，标明左右占比，不遮盖文字）
    const midX = gutterRect.x + gutterRect.w / 2;
    const midY = gutterRect.y + gutterRect.h * 0.5;
    const splitBad = state.split > 0.64 || state.split < 0.32;
    const pillColor = splitBad || gutterBad ? C.red : C.blue;

    ctx.save();
    // 顶部配比微标
    const ratioStr = `${layout.leftRatioPct} : ${layout.rightRatioPct}`;
    ctx.fillStyle = pillColor;
    ctx.fillRect(midX - 34, gutterRect.y - 10, 68, 19);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 10.5px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ratioStr, midX, gutterRect.y - 0.5);

    // 垂直中缝拖把胶囊
    const handleW = 22;
    const handleH = 54;
    ctx.fillStyle = dragging ? C.yellow : pillColor;
    ctx.fillRect(midX - handleW / 2, midY - handleH / 2, handleW, handleH);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(midX - handleW / 2, midY - handleH / 2, handleW, handleH);

    // 推柄内双竖握槽 + 左右微箭
    ctx.fillStyle = dragging ? C.ink : "#FFFFFF";
    ctx.fillRect(midX - 3.5, midY - 11, 2, 22);
    ctx.fillRect(midX + 1.5, midY - 11, 2, 22);
    ctx.restore();

    // 11. 演练阅读动线叠层
    if (scanActive) {
      drawScanOverlay(layout, res);
    }

    // 12. 幻灯片右下微印状态戳（加底衬绝不压红虚线）
    const stamp = `SLIDE 02 · ${layout.leftRatioPct}:${layout.rightRatioPct} · GAP ${layout.gutterPctInt}% · ${res.passCount}/4`;
    ctx.font = `700 10.5px ${FONT_MONO}`;
    const sw = ctx.measureText(stamp).width + 14;
    ctx.fillStyle = C.cream;
    ctx.fillRect(W - sw - 6, H - 18, sw, 15);
    ctx.fillStyle = res.allPass ? C.green : C.red;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(stamp, W - 12, H - 5);

    ctx.restore();

    if (onAfterRender) onAfterRender(layout, res);
  }

  const runner = loop(canvas, render);

  // 点击病灶就地手术
  function handleZoneClick(zone) {
    const st = getState();
    if (zone === "alignBadge") {
      pulseZone = "align";
      pulseT = 0.45;
      onPatch({ aligned: true });
      return;
    }
    if (zone === "title") {
      const order = ["vague", "assertion", "bloated"];
      const next = order[(order.indexOf(st.titleMode) + 1) % order.length];
      const patch = { titleMode: next };
      if (next === "assertion" && st.titleRatio < 1.65) patch.titleRatio = 2.05;
      pulseZone = "title";
      pulseT = 0.45;
      onPatch(patch);
      return;
    }
    if (zone === "bullets") {
      const order = ["overload", "clean", "lean", "sparse"];
      const next = order[(order.indexOf(st.bulletMode) + 1) % order.length];
      pulseZone = "bullets";
      pulseT = 0.45;
      onPatch({ bulletMode: next });
      return;
    }
    if (zone === "visual") {
      const order = ["redundant", "complement", "decorative"];
      const next = order[(order.indexOf(st.visualMode) + 1) % order.length];
      const patch = { visualMode: next };
      if (next === "complement") patch.captionOn = true;
      pulseZone = "visual";
      pulseT = 0.45;
      onPatch(patch);
    }
  }

  // 指针与触摸交互（明确区分横向拖动与页面竖向滚动）
  function startDrag(clientX, clientY) {
    const st = getState();
    dragging = true;
    dragMoved = false;
    touchAxis = null;
    dragStartX = clientX;
    dragStartY = clientY;
    dragStartSplit = st.split;
  }

  function moveDrag(clientX, clientY, isTouch, ev) {
    if (!dragging) return;
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    if (isTouch && !touchAxis) {
      if (Math.hypot(dx, dy) < 6) return;
      touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (isTouch && touchAxis === "y") {
      // 放行页面竖向滚动
      dragging = false;
      return;
    }
    if (Math.abs(dx) > 4) {
      dragMoved = true;
      if (ev && ev.cancelable) ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const deltaSplit = dx / Math.max(160, rect.width * 0.78);
      let nextSplit = clamp(dragStartSplit + deltaSplit, 0.24, 0.76);
      // 靠近 50:50 原海报经典平衡时轻吸附
      if (Math.abs(nextSplit - 0.52) < 0.012) nextSplit = 0.52;
      onPatch({ split: Number(nextSplit.toFixed(3)) }, { silentFocus: true });
    }
  }

  function endDrag(clientX, clientY) {
    if (!dragging) return;
    const wasMoved = dragMoved;
    dragging = false;
    dragMoved = false;
    touchAxis = null;
    if (!wasMoved && lastLayout) {
      const pt = toLogical(clientX, clientY);
      const zone = hitTest(pt, lastLayout);
      if (zone && zone !== "gutter") handleZoneClick(zone);
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => {
    if (dragging) {
      moveDrag(e.clientX, e.clientY, false, e);
    } else if (lastLayout) {
      const r = canvas.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        const z = hitTest(toLogical(e.clientX, e.clientY), lastLayout);
        if (z !== hoverZone) {
          hoverZone = z;
          canvas.style.cursor = z === "gutter" ? "ew-resize" : z ? "pointer" : "ew-resize";
          dirty = true;
          runner.draw();
        }
      } else if (hoverZone) {
        hoverZone = null;
        dirty = true;
        runner.draw();
      }
    }
  });
  window.addEventListener("mouseup", (e) => {
    if (dragging) endDrag(e.clientX, e.clientY);
  });

  // 触屏支持（tools/perf.mjs 也会派发真实 touchStart/touchMove/touchEnd）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!dragging || !e.touches.length) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY, true, e);
  }, { passive: false });
  canvas.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (dragging && t) endDrag(t.clientX, t.clientY);
  }, { passive: true });

  // 键盘直接控制画布
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPatch({ split: Number(clamp(st.split - 0.03, 0.24, 0.76).toFixed(3)) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onPatch({ split: Number(clamp(st.split + 0.03, 0.24, 0.76).toFixed(3)) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPatch({ gutterPct: Number(clamp(st.gutterPct + 0.008, 0.01, 0.14).toFixed(3)) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onPatch({ gutterPct: Number(clamp(st.gutterPct - 0.008, 0.01, 0.14).toFixed(3)) });
    } else if (e.key === "1") {
      e.preventDefault();
      handleZoneClick("title");
    } else if (e.key === "2") {
      e.preventDefault();
      handleZoneClick("bullets");
    } else if (e.key === "3") {
      e.preventDefault();
      handleZoneClick("visual");
    } else if (e.key === "4") {
      e.preventDefault();
      onPatch({ aligned: !st.aligned });
    } else if (e.key === " ") {
      e.preventDefault();
      playScan();
    }
  });

  function playScan() {
    scanActive = true;
    scanT = reducedMotion.matches ? 2.6 : 0;
    dirty = true;
    runner.draw();
  }

  window.addEventListener("resize", () => {
    dirty = true;
    runner.draw();
  }, { passive: true });

  return {
    draw: () => {
      dirty = true;
      runner.draw();
    },
    playScan,
    getLast: () => ({ layout: lastLayout, audit: lastAudit }),
  };
}
