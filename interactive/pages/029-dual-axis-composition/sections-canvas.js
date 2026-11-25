// 029 双轴构图 · 正文各节互动画布与精准矢量图解
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

// ---------- 01 节：四类轴线解剖画布 ----------
export function initSec1Canvas(canvas, getMode) {
  const ctx = canvas.getContext("2d");
  let W = 540, H = 340, dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = pixelRatio(2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  function render(t, _dt, { still }) {
    if (!W || !H) resize();
    const mode = getMode();
    const pulse = still ? 0.65 : (t * 0.42) % 1;
    const padX = W * 0.10, padY = H * 0.12;
    const bw = W - padX * 2, bh = H - padY * 2;
    const cx = padX + bw * 0.5, cy = padY + bh * 0.5;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#F7EDE3";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(5, 75, 165, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padX, padY, bw, bh);

    if (mode === "horizontal") {
      // 仅水平轴：上下两带，横向平稳流动
      ctx.fillStyle = "#F5E3C9";
      ctx.fillRect(padX + 10, padY + 12, bw - 20, bh * 0.44 - 16);
      ctx.fillStyle = "#054BA5";
      ctx.fillRect(padX + 10, cy + 10, bw - 20, bh * 0.44 - 16);

      // 水平轴线
      ctx.strokeStyle = "#044AA2";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(padX - 16, cy);
      ctx.lineTo(padX + bw + 16, cy);
      ctx.stroke();

      // 水平横向扫读光点
      const gx = padX + 16 + (bw - 32) * pulse;
      ctx.beginPath();
      ctx.arc(gx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#F7C104";
      ctx.fill();
      ctx.strokeStyle = "#011323";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 缺少层级标注
      ctx.fillStyle = "#011323";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("横向宽阔安定，但上下两带缺少垂直层级与交点聚焦", cx, H - 14);
    } else if (mode === "vertical") {
      // 仅垂直轴：左右两列，顶部重底部轻，但右侧留白失衡
      ctx.fillStyle = "#054BA5";
      ctx.fillRect(padX + 14, padY + 14, bw * 0.42, bh * 0.34);
      ctx.fillStyle = "#F5E3C9";
      ctx.fillRect(padX + 14, padY + bh * 0.54, bw * 0.42, bh * 0.34);
      // 右侧松散失衡块
      ctx.fillStyle = "rgba(184, 41, 32, 0.16)";
      ctx.fillRect(cx + 18, padY + bh * 0.24, bw * 0.36, bh * 0.52);
      ctx.strokeStyle = "#B82920";
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(cx + 18, padY + bh * 0.24, bw * 0.36, bh * 0.52);
      ctx.setLineDash([]);

      // 垂直轴线
      ctx.strokeStyle = "#044AA2";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, padY - 14);
      ctx.lineTo(cx, padY + bh + 14);
      ctx.stroke();

      // 垂直下落光点
      const gy = padY + 14 + (bh - 28) * pulse;
      ctx.beginPath();
      ctx.arc(cx, gy, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#F7C104";
      ctx.fill();
      ctx.strokeStyle = "#011323";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#011323";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("纵向层级清晰，但右侧缺少水平轴拉平重量", cx, H - 14);
    } else if (mode === "dual") {
      const g = 14;
      const qw = bw * 0.5 - g * 0.5 - 6;
      const qh = bh * 0.5 - g * 0.5 - 6;
      const qs = [
        { x: padX + 6, y: padY + 6, c: "#054BA5", t: "Q1 主导" },
        { x: cx + g * 0.5, y: padY + 6, c: "#F5E3C9", t: "Q2 呼应" },
        { x: padX + 6, y: cy + g * 0.5, c: "#F5E3C9", t: "Q3 辅助" },
        { x: cx + g * 0.5, y: cy + g * 0.5, c: "#054BA5", t: "Q4 收束" },
      ];
      qs.forEach((q) => {
        ctx.fillStyle = q.c;
        ctx.fillRect(q.x, q.y, qw, qh);
        ctx.fillStyle = q.c === "#054BA5" ? "#FAF5EE" : "#011323";
        ctx.font = '700 12px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(q.t, q.x + qw * 0.5, q.y + qh * 0.5);
      });

      // 双轴正交线
      ctx.strokeStyle = "#044AA2";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, padY - 14);
      ctx.lineTo(cx, padY + bh + 14);
      ctx.moveTo(padX - 14, cy);
      ctx.lineTo(padX + bw + 14, cy);
      ctx.stroke();

      // 虚线焦点环 + 蓝金核心
      const hr = Math.min(bw, bh) * 0.28;
      ctx.beginPath();
      ctx.arc(cx, cy, hr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(5, 75, 165, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 沿环轻柔脉动的视觉引导点
      const ang = -Math.PI * 0.75 + pulse * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * hr, cy + Math.sin(ang) * hr, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#F7C104";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#044AA2";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#F7C104";
      ctx.fill();

      ctx.fillStyle = "#011323";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("横定均衡 × 纵定层级 × 四区分工 × 交点聚睛", cx, H - 12);
    } else {
      // 区分 030 十字构图：十字实体梁本身成为强烈主角，四角退为纯底
      ctx.fillStyle = "#EFE2D1";
      ctx.fillRect(padX, padY, bw, bh);
      const beam = Math.min(bw, bh) * 0.16;
      ctx.fillStyle = "#011323";
      ctx.fillRect(cx - beam * 0.5, padY, beam, bh);
      ctx.fillRect(padX, cy - beam * 0.5, bw, beam);
      ctx.fillStyle = "#F7C104";
      ctx.fillRect(cx - beam * 0.5, cy - beam * 0.5, beam, beam);

      ctx.fillStyle = "#3B516A";
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("退为背景角", padX + bw * 0.22, padY + bh * 0.22);
      ctx.fillText("退为背景角", padX + bw * 0.78, padY + bh * 0.78);
      ctx.fillStyle = "#011323";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      ctx.fillText("030 十字构图：实体十字形本身就是被看的主角", cx, H - 14);
    }
    ctx.restore();
  }

  const ro = new ResizeObserver(() => { resize(); ctl.draw(); });
  ro.observe(canvas);
  resize();
  const ctl = loop(canvas, render);
  ctl.draw();
  return ctl;
}

// ---------- 03 节：深靛海暗室视线节律画布 ----------
export function initSec3Canvas(canvas, getState) {
  const ctx = canvas.getContext("2d");
  let W = 680, H = 360, dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = pixelRatio(2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  const PATHS = {
    ordered: {
      pts: [
        { u: 0.50, v: 0.50, label: "1 焦点入眼" },
        { u: 0.27, v: 0.28, label: "2 左上主标" },
        { u: 0.73, v: 0.28, label: "3 右上呼应" },
        { u: 0.27, v: 0.73, label: "4 左下辅注" },
        { u: 0.73, v: 0.73, label: "5 右下收束" },
      ],
      quads: ["heavy", "light", "light", "heavy"],
      hasHub: true,
      color: "#FFD038",
    },
    hollow: {
      pts: [
        { u: 0.22, v: 0.24, label: "1 游离起看" },
        { u: 0.78, v: 0.72, label: "2 跨缝跳远" },
        { u: 0.74, v: 0.22, label: "3 折返寻找" },
        { u: 0.30, v: 0.78, label: "4 失去中枢" },
        { u: 0.65, v: 0.40, label: "5 视线发散" },
      ],
      quads: ["light", "light", "light", "light"],
      hasHub: false,
      color: "#FF8A7E",
    },
    diagonal: {
      pts: [
        { u: 0.28, v: 0.28, label: "1 左上重块" },
        { u: 0.50, v: 0.50, label: "2 经交点中转" },
        { u: 0.73, v: 0.73, label: "3 右下对角稳住" },
        { u: 0.73, v: 0.28, label: "4 轻读右上" },
        { u: 0.28, v: 0.73, label: "5 轻读左下" },
      ],
      quads: ["heavy", "light", "light", "heavy"],
      hasHub: true,
      color: "#6EE0C5",
    },
  };

  function render(t, _dt, { still }) {
    if (!W || !H) resize();
    const { mode, playing, step } = getState();
    const cfg = PATHS[mode] || PATHS.ordered;
    const padX = Math.max(26, W * 0.08);
    const padY = Math.max(24, H * 0.11);
    const bw = W - padX * 2;
    const bh = H - padY * 2;
    const cx = padX + bw * 0.5;
    const cy = padY + bh * 0.5;
    const gap = 14;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#071A38";
    ctx.fillRect(0, 0, W, H);

    // 暗室网格底纹
    ctx.strokeStyle = "rgba(130, 182, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padX, padY, bw, bh);

    const qw = bw * 0.5 - gap * 0.5 - 6;
    const qh = bh * 0.5 - gap * 0.5 - 6;
    const rects = [
      { x: padX + 6, y: padY + 6 },
      { x: cx + gap * 0.5, y: padY + 6 },
      { x: padX + 6, y: cy + gap * 0.5 },
      { x: cx + gap * 0.5, y: cy + gap * 0.5 },
    ];
    rects.forEach((r, i) => {
      ctx.fillStyle = cfg.quads[i] === "heavy" ? "#0E3C82" : "#13294E";
      ctx.fillRect(r.x, r.y, qw, qh);
      ctx.strokeStyle = cfg.quads[i] === "heavy" ? "rgba(255, 208, 56, 0.35)" : "rgba(197, 214, 238, 0.18)";
      ctx.strokeRect(r.x, r.y, qw, qh);
    });

    // 正交双轴
    ctx.strokeStyle = "rgba(130, 182, 255, 0.58)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, padY - 10);
    ctx.lineTo(cx, padY + bh + 10);
    ctx.moveTo(padX - 10, cy);
    ctx.lineTo(padX + bw + 10, cy);
    ctx.stroke();

    // 中心焦点
    if (cfg.hasHub) {
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#054BA5";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD038";
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.strokeStyle = "#FF8A7E";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 计算当前进度：开减少动画或暂停时显示选定步骤的完整轨迹
    const pts = cfg.pts.map((p) => ({ x: padX + bw * p.u, y: padY + bh * p.v, label: p.label }));
    const progress = still || !playing ? (step >= 0 ? step / (pts.length - 1) : 1) : ((t * 0.26) % 1.25);
    const clampedP = clamp(progress, 0, 1);
    const totalSegs = pts.length - 1;
    const exact = clampedP * totalSegs;

    // 底层完整虚线轨迹
    ctx.strokeStyle = "rgba(247, 237, 227, 0.24)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);

    // 已走过的高亮视线路径
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    let head = { x: pts[0].x, y: pts[0].y };
    for (let i = 0; i < totalSegs; i++) {
      if (exact >= i + 1) {
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        head = pts[i + 1];
      } else if (exact > i) {
        const f = exact - i;
        head = {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
        };
        ctx.lineTo(head.x, head.y);
        break;
      }
    }
    ctx.stroke();

    // 各停驻节点与序号
    pts.forEach((p, i) => {
      const reached = exact + 0.02 >= i;
      ctx.beginPath();
      ctx.arc(p.x, p.y, reached ? 11 : 8, 0, Math.PI * 2);
      ctx.fillStyle = reached ? cfg.color : "#17325C";
      ctx.fill();
      ctx.strokeStyle = "#071A38";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = reached ? "#071A38" : "#C5D6EE";
      ctx.font = '700 11px "IBM Plex Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), p.x, p.y + 0.5);

      if (W > 340) {
        ctx.fillStyle = reached ? "#F7EDE3" : "#9BB2D1";
        ctx.font = '600 11px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(p.label.slice(2), p.x, p.y + 22);
      }
    });

    // 游标光球
    ctx.beginPath();
    ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    ctx.restore();
  }

  const ro = new ResizeObserver(() => { resize(); ctl.draw(); });
  ro.observe(canvas);
  resize();
  const ctl = loop(canvas, render);
  ctl.draw();
  return ctl;
}

// ---------- 生成微缩双轴 SVG（用于 02 节、04 节史料、07 节盲测题选项，保证每个圆都是真圆、清晰无锯齿） ----------
export function buildDualAxisSvg({ axisX, axisY, quads, focusMode = "locked", focusPos = null, width = 220, height = 165 }) {
  const pad = 16;
  const bw = width - pad * 2;
  const bh = height - pad * 2;
  const gap = 8;
  const ix = pad + bw * axisX;
  const iy = pad + bh * axisY;
  const lw = Math.max(4, ix - pad - gap * 0.5);
  const rw = Math.max(4, pad + bw - ix - gap * 0.5);
  const th = Math.max(4, iy - pad - gap * 0.5);
  const bh2 = Math.max(4, pad + bh - iy - gap * 0.5);

  const rects = [
    { x: pad, y: pad, w: lw, h: th, tone: quads[0] },
    { x: ix + gap * 0.5, y: pad, w: rw, h: th, tone: quads[1] },
    { x: pad, y: iy + gap * 0.5, w: lw, h: bh2, tone: quads[2] },
    { x: ix + gap * 0.5, y: iy + gap * 0.5, w: rw, h: bh2, tone: quads[3] },
  ];

  const rectMarkup = rects.map((r, i) => {
    const fill = r.tone === "heavy" ? "#054BA5" : "#F5E3C9";
    const lineCol = r.tone === "heavy" ? "rgba(250,245,238,0.75)" : "rgba(1,19,35,0.45)";
    const accent = r.tone === "heavy" ? "#F7C104" : "#054BA5";
    const inner = r.w > 22 && r.h > 20
      ? `<rect x="${(r.x + 6).toFixed(1)}" y="${(r.y + 6).toFixed(1)}" width="${Math.min(10, r.w * 0.2).toFixed(1)}" height="${Math.min(10, r.h * 0.2).toFixed(1)}" fill="${accent}"/>
         <line x1="${(r.x + 6).toFixed(1)}" y1="${(r.y + r.h * 0.55).toFixed(1)}" x2="${(r.x + Math.max(10, r.w * 0.65)).toFixed(1)}" y2="${(r.y + r.h * 0.55).toFixed(1)}" stroke="${lineCol}" stroke-width="1.6"/>
         <line x1="${(r.x + 6).toFixed(1)}" y1="${(r.y + r.h * 0.72).toFixed(1)}" x2="${(r.x + Math.max(8, r.w * 0.48)).toFixed(1)}" y2="${(r.y + r.h * 0.72).toFixed(1)}" stroke="${lineCol}" stroke-width="1.2"/>`
      : "";
    return `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" fill="${fill}"/>${inner}`;
  }).join("");

  const fx = focusMode === "locked" ? ix : pad + bw * (focusPos ? focusPos.u : 0.77);
  const fy = focusMode === "locked" ? iy : pad + bh * (focusPos ? focusPos.v : 0.25);
  const hubMarkup = focusMode === "hidden"
    ? `<circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="10" fill="#F7EDE3" stroke="#044AA2" stroke-width="1.4" stroke-dasharray="3 2"/>`
    : `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="13" fill="#044AA2"/>
       <circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="6.8" fill="#F7C104"/>`;

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
    <rect width="${width}" height="${height}" fill="#FAF5EE"/>
    ${rectMarkup}
    <circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="${(Math.min(bw, bh) * 0.27).toFixed(1)}" fill="none" stroke="rgba(4,74,162,0.42)" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="${ix.toFixed(1)}" y1="6" x2="${ix.toFixed(1)}" y2="${height - 6}" stroke="#044AA2" stroke-width="1.8"/>
    <line x1="6" y1="${iy.toFixed(1)}" x2="${width - 6}" y2="${iy.toFixed(1)}" stroke="#044AA2" stroke-width="1.8"/>
    ${hubMarkup}
  </svg>`;
}

// ---------- 第 04 节：5 站历史平面几何图解 SVG ----------
export function buildLineageSvg(kind) {
  if (kind === "timgad") {
    return `<svg viewBox="0 0 320 220" role="img" aria-label="提姆加德古城纵横正交规划示意图">
      <rect width="320" height="220" fill="#F7EDE3"/>
      <rect x="64" y="18" width="192" height="184" fill="#F5E3C9" stroke="#044AA2" stroke-width="2"/>
      ${[0,1,2,3,4,5].map((i) => `<line x1="${64 + i * 32}" y1="18" x2="${64 + i * 32}" y2="202" stroke="rgba(4,74,162,0.22)" stroke-width="1"/>`).join("")}
      ${[0,1,2,3,4,5].map((i) => `<line x1="64" y1="${18 + i * 30.6}" x2="256" y2="${18 + i * 30.6}" stroke="rgba(4,74,162,0.22)" stroke-width="1"/>`).join("")}
      <line x1="160" y1="8" x2="160" y2="212" stroke="#044AA2" stroke-width="4"/>
      <line x1="48" y1="110" x2="272" y2="110" stroke="#044AA2" stroke-width="4"/>
      <rect x="144" y="94" width="32" height="32" fill="#054BA5"/>
      <circle cx="160" cy="110" r="8" fill="#F7C104"/>
      <text x="168" y="28" fill="#011323" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="600">CARDO</text>
      <text x="184" y="104" fill="#011323" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="600">DECUMANUS</text>
    </svg>`;
  }
  if (kind === "rotonda") {
    return `<svg viewBox="0 0 320 220" role="img" aria-label="帕拉第奥圆厅别墅双轴对称平面示意图">
      <rect width="320" height="220" fill="#F7EDE3"/>
      <rect x="102" y="52" width="116" height="116" fill="#054BA5" fill-opacity="0.14" stroke="#044AA2" stroke-width="2"/>
      <rect x="138" y="22" width="44" height="30" fill="#F5E3C9" stroke="#044AA2" stroke-width="1.6"/>
      <rect x="138" y="168" width="44" height="30" fill="#F5E3C9" stroke="#044AA2" stroke-width="1.6"/>
      <rect x="72" y="88" width="30" height="44" fill="#F5E3C9" stroke="#044AA2" stroke-width="1.6"/>
      <rect x="218" y="88" width="30" height="44" fill="#F5E3C9" stroke="#044AA2" stroke-width="1.6"/>
      <circle cx="160" cy="110" r="34" fill="#054BA5"/>
      <circle cx="160" cy="110" r="14" fill="#F7C104"/>
      <line x1="160" y1="10" x2="160" y2="210" stroke="#011323" stroke-width="1.6" stroke-dasharray="5 4"/>
      <line x1="50" y1="110" x2="270" y2="110" stroke="#011323" stroke-width="1.6" stroke-dasharray="5 4"/>
    </svg>`;
  }
  if (kind === "mondrian") {
    return `<svg viewBox="0 0 320 220" role="img" aria-label="蒙德里安正交轴线非镜像动态均衡示意图">
      <rect width="320" height="220" fill="#FAF5EE"/>
      <rect x="64" y="18" width="192" height="184" fill="#FAF5EE" stroke="#011323" stroke-width="3"/>
      <rect x="64" y="18" width="66" height="94" fill="#054BA5"/>
      <rect x="206" y="142" width="50" height="60" fill="#F7C104"/>
      <rect x="130" y="18" width="42" height="44" fill="#B82920"/>
      <line x1="130" y1="18" x2="130" y2="202" stroke="#011323" stroke-width="4.5"/>
      <line x1="206" y1="18" x2="206" y2="202" stroke="#011323" stroke-width="3.5"/>
      <line x1="64" y1="112" x2="256" y2="112" stroke="#011323" stroke-width="4.5"/>
      <line x1="64" y1="142" x2="256" y2="142" stroke="#011323" stroke-width="3.5"/>
    </svg>`;
  }
  if (kind === "grid") {
    return `<svg viewBox="0 0 320 220" role="img" aria-label="瑞士出版网格双向栏带系统示意图">
      <rect width="320" height="220" fill="#F7EDE3"/>
      <rect x="46" y="20" width="228" height="180" fill="#FAF5EE" stroke="#044AA2" stroke-width="1.5"/>
      ${[0,1,2,3].map((c) => [0,1,2].map((r) => `<rect x="${58 + c * 52}" y="${32 + r * 54}" width="44" height="44" fill="${(c < 2 && r === 0) ? "#054BA5" : (c >= 2 && r >= 1) ? "#F5E3C9" : "rgba(5,75,165,0.09)"}"/>`).join("")).join("")}
      <line x1="160" y1="12" x2="160" y2="208" stroke="#044AA2" stroke-width="2" stroke-dasharray="4 3"/>
      <line x1="36" y1="82" x2="284" y2="82" stroke="#044AA2" stroke-width="2" stroke-dasharray="4 3"/>
      <circle cx="160" cy="82" r="8" fill="#F7C104" stroke="#044AA2" stroke-width="2"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 320 220" role="img" aria-label="阿恩海姆中心焦点与笛卡尔正交轴网协作示意图">
    <rect width="320" height="220" fill="#F7EDE3"/>
    <rect x="64" y="22" width="192" height="176" fill="#FAF5EE" stroke="#044AA2" stroke-width="1.8"/>
    <circle cx="160" cy="110" r="68" fill="none" stroke="rgba(4,74,162,0.34)" stroke-width="1.4" stroke-dasharray="4 4"/>
    <circle cx="160" cy="110" r="40" fill="none" stroke="rgba(4,74,162,0.52)" stroke-width="1.4"/>
    <line x1="160" y1="10" x2="160" y2="210" stroke="#044AA2" stroke-width="2.2"/>
    <line x1="48" y1="110" x2="272" y2="110" stroke="#044AA2" stroke-width="2.2"/>
    <circle cx="160" cy="110" r="14" fill="#054BA5"/>
    <circle cx="160" cy="110" r="7" fill="#F7C104"/>
  </svg>`;
}
