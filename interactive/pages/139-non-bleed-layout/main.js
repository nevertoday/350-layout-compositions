import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BINDINGS,
  DRIFT_PRESETS,
  FAILURE_CASES,
  OPEN_BAD_STATE,
  PRESSES,
  RECIPES,
  SHEET,
  SOLUTIONS,
  SPECIMENS,
  calcRecipe,
  clamp,
  evaluate,
  round1,
  round2,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ============================================================================
// 1. 开场互动：印品安全边距 · 进纸实印检验台（Single Source of Truth）
// ============================================================================
const state = { ...OPEN_BAD_STATE };
let heroMetrics = evaluate(state);
let heroDirty = true;
let passAnim = 0; // >0 时播放扫印检验光带（1 -> 0）
let introDone = false;
let heroGeom = null; // 记录画布上实绘纸张坐标，用于精准命中拖拽边线

const heroCanvas = $("#hero-canvas");
const hctx = heroCanvas.getContext("2d");

// DOM 引用缓存
const ui = {
  statusPill: $("#hero-status-pill"),
  stageSpec: $("#stage-spec"),
  stageReadout: $("#stage-readout"),
  pressNote: $("#press-hardware-note"),
  sealBand: $("#seal-band"),
  sealMetricPill: $("#seal-metric-pill"),
  diagHeadline: $("#diag-headline"),
  diagReason: $("#diag-reason"),
  diagAction: $("#diag-action"),
  valSide: $("#val-side"),
  valTop: $("#val-top"),
  valBottom: $("#val-bottom"),
  valInner: $("#val-inner"),
  rangeSide: $("#range-side"),
  rangeTop: $("#range-top"),
  rangeBottom: $("#range-bottom"),
  rangeInner: $("#range-inner"),
  probes: {
    margin: $("#probe-margin"),
    safe: $("#probe-safe"),
    print: $("#probe-print"),
    control: $("#probe-control"),
  },
  foot: {
    margin: $("#foot-margin"),
    safe: $("#foot-safe"),
    print: $("#foot-print"),
  },
};

const specimenBtns = $$("[data-specimen]");
const pressBtns = $$("[data-press]");
const driftBtns = $$("[data-drift]");
const probeBtns = $$("[data-probe]");

const setText = (el, txt) => {
  if (el && el.textContent !== txt) el.textContent = txt;
};

let uiSyncPending = false;

function syncHeroUI() {
  uiSyncPending = false;
  heroMetrics = evaluate(state);
  const m = heroMetrics;
  const spec = SPECIMENS[state.specimen];

  setText(ui.statusPill, m.statusBadge);
  if (ui.statusPill.dataset.state !== (m.allPass ? "ok" : "bad")) {
    ui.statusPill.dataset.state = m.allPass ? "ok" : "bad";
  }

  setText(ui.stageSpec, `ISO A4 · 210×297 mm · ${spec.short} · ${m.press.label}`);
  setText(ui.stageReadout, `左右 ${m.sideMm.toFixed(1)} · 顶 ${m.topMm.toFixed(1)} · 底 ${m.bottomMm.toFixed(1)} · 内 ${m.innerPadMm.toFixed(1)} mm`);
  setText(ui.pressNote, m.press.summary);

  setText(ui.valSide, `${m.sideMm.toFixed(1)} mm`);
  setText(ui.valTop, `${m.topMm.toFixed(1)} mm`);
  setText(ui.valBottom, `${m.bottomMm.toFixed(1)} mm`);
  setText(ui.valInner, `${m.innerPadMm.toFixed(1)} mm`);

  if (ui.rangeSide.value !== String(m.sideMm)) ui.rangeSide.value = String(m.sideMm);
  if (ui.rangeTop.value !== String(m.topMm)) ui.rangeTop.value = String(m.topMm);
  if (ui.rangeBottom.value !== String(m.bottomMm)) ui.rangeBottom.value = String(m.bottomMm);
  if (ui.rangeInner.value !== String(m.innerPadMm)) ui.rangeInner.value = String(m.innerPadMm);

  // 顶部四关键词与底沿三展签同步单真源
  for (const key of ["margin", "safe", "print", "control"]) {
    const chk = m.checks[key];
    if (ui.probes[key]) {
      setText(ui.probes[key], chk.tag);
      const btn = ui.probes[key].closest(".kw-probe");
      if (btn && btn.dataset.ok !== String(chk.ok)) btn.dataset.ok = String(chk.ok);
    }
    if (ui.foot[key]) {
      setText(ui.foot[key], chk.tag);
      const btn = ui.foot[key].closest(".spec-item");
      if (btn && btn.dataset.ok !== String(chk.ok)) btn.dataset.ok = String(chk.ok);
    }
  }

  if (ui.sealBand.dataset.state !== (m.allPass ? "ok" : "bad")) {
    ui.sealBand.dataset.state = m.allPass ? "ok" : "bad";
  }
  const clearTxt = m.minClearance >= 0 ? `+${m.minClearance.toFixed(1)}` : m.minClearance.toFixed(1);
  setText(ui.sealMetricPill, `死区余量 ${clearTxt} mm · 走偏比 ${m.skewRatio.toFixed(2)}× · 版心 ${m.frameAreaPct}%`);
  setText(ui.diagHeadline, m.headline);
  setText(ui.diagReason, m.reason);
  setText(ui.diagAction, m.action);

  // 同步按钮高亮态
  specimenBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.specimen === state.specimen));
  pressBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.press === state.press));
  driftBtns.forEach((b) => b.classList.toggle("is-active", Math.abs(Number(b.dataset.drift) - state.driftMm) < 0.05));
  probeBtns.forEach((b) => b.setAttribute("aria-pressed", String(state.highlight === b.dataset.probe)));

  heroDirty = true;
}

function resizeCanvas(canvas) {
  const maxDpr = window.innerWidth <= 600 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = Math.max(100, Math.round(canvas.clientWidth));
  const h = Math.max(100, Math.round(canvas.clientHeight));
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
    return { w, h, dpr, resized: true };
  }
  return { w, h, dpr, resized: false };
}

// 缓存静态底座（制图台点格 + 游标刻度 + 成品 A4 纸 + 硬件死区斜纹），仅尺寸或机台变化时重建
let baseCache = null;
let baseKey = "";
function getBaseLayer(w, h, dpr, sx, sy, sw, sh, scale, press) {
  const key = `${w}x${h}@${dpr}|${press.id}|${sx},${sy},${sw.toFixed(1)},${sh.toFixed(1)}`;
  if (baseCache && baseKey === key) return baseCache;
  const c = document.createElement("canvas");
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mm = (val) => val * scale;
  const dead = press.dead;

  // 制图台底垫与点格
  g.fillStyle = "#EAE5DB";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(47, 78, 56, 0.14)";
  g.beginPath();
  for (let gx = 10; gx < w; gx += 20) {
    for (let gy = 10; gy < h; gy += 20) {
      g.rect(gx, gy, 1.2, 1.2);
    }
  }
  g.fill();

  // 顶、左毫米游标刻度
  g.strokeStyle = "rgba(47, 78, 56, 0.45)";
  g.fillStyle = "#49524B";
  g.font = '500 9.5px "IBM Plex Mono", monospace';
  g.lineWidth = 1;
  g.textAlign = "center";
  g.textBaseline = "bottom";
  for (let k = 0; k <= SHEET.w; k += 30) {
    const tx = sx + mm(k);
    g.beginPath();
    g.moveTo(tx, sy - 3);
    g.lineTo(tx, sy - 8);
    g.stroke();
    if (k === 0 || k === 90 || k === 210) g.fillText(`${k}`, tx, sy - 9);
  }
  g.textAlign = "right";
  g.textBaseline = "middle";
  for (let k = 0; k <= SHEET.h; k += 50) {
    const ty = sy + mm(k);
    g.beginPath();
    g.moveTo(sx - 3, ty);
    g.lineTo(sx - 8, ty);
    g.stroke();
    if (k === 0 || k === 150 || k === 250) g.fillText(`${k}`, sx - 10, ty);
  }

  // 成品 A4 纸影与纸面
  g.fillStyle = "rgba(47, 78, 56, 0.14)";
  g.fillRect(sx + 5, sy + 5, sw, sh);
  g.fillStyle = "#FCF8F5";
  g.fillRect(sx, sy, sw, sh);

  // 硬件死区斜纹
  const pLeft = sx + mm(dead.left);
  const pTop = sy + mm(dead.top);
  const pW = sw - mm(dead.left + dead.right);
  const pH = sh - mm(dead.top + dead.bottom);
  g.fillStyle = "rgba(168,42,36,0.12)";
  g.fillRect(sx, sy, sw, mm(dead.top));
  g.fillRect(sx, sy + sh - mm(dead.bottom), sw, mm(dead.bottom));
  g.fillRect(sx, pTop, mm(dead.left), pH);
  g.fillRect(sx + sw - mm(dead.right), pTop, mm(dead.right), pH);

  const hatchCol = "rgba(168,42,36,0.34)";
  drawHatchRect(g, sx, sy, sw, mm(dead.top), 7, hatchCol);
  drawHatchRect(g, sx, sy + sh - mm(dead.bottom), sw, mm(dead.bottom), 7, hatchCol);
  drawHatchRect(g, sx, pTop, mm(dead.left), pH, 7, hatchCol);
  drawHatchRect(g, sx + sw - mm(dead.right), pTop, mm(dead.right), pH, 7, hatchCol);

  g.save();
  g.strokeStyle = "rgba(168,42,36,0.68)";
  g.lineWidth = 1;
  g.setLineDash([4, 3]);
  g.strokeRect(pLeft, pTop, pW, pH);
  g.restore();

  if (press.id === "offset") {
    g.fillStyle = "#A82A24";
    g.font = '600 9.5px "IBM Plex Mono", monospace';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("GRIPPER · 10mm 机械咬口不可落墨", sx + sw / 2, sy + mm(dead.top) / 2);
  }

  baseCache = c;
  baseKey = key;
  return c;
}

// 绘制斜线阴影（轻量快速，不创建离屏 pattern 避免软件渲染开销）
function drawHatchRect(ctx, x, y, w, h, step, color) {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let d = -h; d < w + h; d += step) {
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d - h, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

// 在安全内区绘制三种真实印品标本（1:1 跟随 innerBox 实时缩放）
function drawSpecimenContent(ctx, bx, by, bw, bh, scale, specimen, m) {
  if (bw < 14 || bh < 18) return;

  if (specimen === "poster") {
    // 1:1 承袭 139 原海报构图（按宽高联合尺度缩放，宽屏与横屏紧凑态均绝不碰线）
    const cx = bx + bw / 2;
    const unit = Math.min(bw, bh * 0.7);
    const titleY = by + bh * 0.115;
    const titleSize = clamp(unit * 0.145, 9, 25);
    ctx.fillStyle = "#222522";
    ctx.font = `900 ${titleSize.toFixed(1)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("无出血版式", cx, titleY);

    const subSize = clamp(unit * 0.046, 5.8, 10.5);
    const subY = titleY + titleSize * 0.72;
    ctx.fillStyle = "#2F4E38";
    ctx.font = `700 ${subSize.toFixed(1)}px "Chivo", sans-serif`;
    ctx.fillText("NON-BLEED LAYOUT", cx, subY);

    // 居中菱形分隔线
    const ry = subY + Math.max(6, bh * 0.036);
    ctx.strokeStyle = "#2F4E38";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.18, ry);
    ctx.lineTo(cx - 5, ry);
    ctx.moveTo(cx + 5, ry);
    ctx.lineTo(cx + bw * 0.18, ry);
    ctx.stroke();
    ctx.fillStyle = "#2F4E38";
    ctx.save();
    ctx.translate(cx, ry);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
    ctx.restore();

    // 4 枚微缩关键词条
    const kwy = by + bh * 0.285;
    const kws = ["边距", "安全区", "印刷", "克制"];
    ctx.font = `600 ${clamp(unit * 0.044, 6, 9.5).toFixed(1)}px "Noto Serif SC", serif`;
    for (let i = 0; i < 4; i++) {
      const kx = bx + bw * (0.14 + i * 0.24);
      ctx.fillStyle = "#222522";
      ctx.fillText(kws[i], kx, kwy);
      if (i < 3) {
        const lx = bx + bw * (0.26 + i * 0.24);
        ctx.strokeStyle = "#D4B77A";
        ctx.beginPath();
        ctx.moveTo(lx, kwy - 4.5);
        ctx.lineTo(lx, kwy + 4.5);
        ctx.stroke();
      }
    }

    // 中部山日画框 + 两侧 5×5 点阵与暖金立柱
    const artY = by + bh * 0.345;
    const artH = bh * 0.375;
    const flankW = bw * 0.075;
    const artX = bx + bw * 0.14;
    const artW = bw * 0.72;

    // 两侧 5×5 绿点与暖金柱（合并为单次 path fill，减少 50 次绘制调用）
    const drawSideMotif = (mx) => {
      ctx.fillStyle = "#2F4E38";
      const dStep = Math.max(2.2, flankW * 0.24);
      ctx.beginPath();
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          ctx.rect(mx + c * dStep, artY + 3 + r * dStep, 1.3, 1.3);
        }
      }
      ctx.fill();
      ctx.fillStyle = "#E1C487";
      const barTop = artY + dStep * 5 + 7;
      ctx.fillRect(mx, barTop, flankW * 0.92, Math.max(8, artY + artH - barTop - 4));
    };
    drawSideMotif(bx + bw * 0.025);
    drawSideMotif(bx + bw - bw * 0.025 - flankW);

    // 静雅山日画框
    ctx.fillStyle = "#EAE5DB";
    ctx.fillRect(artX, artY, artW, artH);
    ctx.strokeStyle = "#2F4E38";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(artX, artY, artW, artH);

    // 暖金太阳与两座浅石山峦
    ctx.fillStyle = "#E0CBA3";
    ctx.beginPath();
    ctx.arc(artX + artW * 0.38, artY + artH * 0.28, Math.min(artW, artH) * 0.115, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#E2DDD1";
    ctx.beginPath();
    ctx.moveTo(artX, artY + artH);
    ctx.lineTo(artX + artW * 0.27, artY + artH * 0.56);
    ctx.lineTo(artX + artW * 0.56, artY + artH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#DBD6CA";
    ctx.beginPath();
    ctx.moveTo(artX + artW * 0.24, artY + artH);
    ctx.lineTo(artX + artW * 0.64, artY + artH * 0.37);
    ctx.lineTo(artX + artW, artY + artH * 0.86);
    ctx.lineTo(artX + artW, artY + artH);
    ctx.closePath();
    ctx.fill();

    // 画框四角白 L 标
    const ins = Math.max(4, artW * 0.045);
    const arm = Math.max(5, artW * 0.065);
    ctx.strokeStyle = "#FCF8F5";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(artX + ins, artY + ins + arm); ctx.lineTo(artX + ins, artY + ins); ctx.lineTo(artX + ins + arm, artY + ins);
    ctx.moveTo(artX + artW - ins - arm, artY + ins); ctx.lineTo(artX + artW - ins, artY + ins); ctx.lineTo(artX + artW - ins, artY + ins + arm);
    ctx.moveTo(artX + ins, artY + artH - ins - arm); ctx.lineTo(artX + ins, artY + artH - ins); ctx.lineTo(artX + ins + arm, artY + artH - ins);
    ctx.moveTo(artX + artW - ins - arm, artY + artH - ins); ctx.lineTo(artX + artW - ins, artY + artH - ins); ctx.lineTo(artX + artW - ins, artY + artH - ins - arm);
    ctx.stroke();

    // 下方绿底印检章 + 标语线
    const sy = by + bh * 0.80;
    const sr = clamp(bw * 0.055, 5, 11);
    const sx = artX + sr + 2;
    ctx.fillStyle = m.allPass ? "#2D4C36" : "#A82A24";
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#F9F6EE";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#222522";
    ctx.font = `700 ${clamp(bw * 0.055, 7, 11).toFixed(1)}px "Noto Serif SC", serif`;
    ctx.fillText("稳定 · 安全 · 专业", sx + sr + 8, sy - 3);
    ctx.fillStyle = "#4E564F";
    ctx.fillRect(sx + sr + 8, sy + 5, artW * 0.62, 2);

    // 底部色卡三圆 + 横线
    const fy = by + bh * 0.91;
    ctx.strokeStyle = "#2F4E38";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.04, by + bh * 0.865);
    ctx.lineTo(bx + bw * 0.96, by + bh * 0.865);
    ctx.stroke();

    const swR = clamp(bw * 0.028, 3, 6);
    const swCols = ["#2F4E38", "#DDBE80", "#DDD5CA"];
    swCols.forEach((col, idx) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(bx + bw * 0.08 + idx * swR * 1.45, fy, swR, 0, Math.PI * 2);
      ctx.fill();
    });
    // 右侧三枚微缩方图标
    ctx.strokeStyle = "#2F4E38";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ix = bx + bw * (0.48 + i * 0.18);
      ctx.strokeRect(ix - 5, fy - 5, 10, 10);
    }
  } else if (specimen === "memo") {
    // 办公激光公函标本
    ctx.fillStyle = "#2F4E38";
    ctx.fillRect(bx, by, bw, Math.max(4, bh * 0.025));
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#222522";
    ctx.font = `900 ${clamp(bw * 0.095, 9, 18).toFixed(1)}px "Noto Serif SC", serif`;
    ctx.fillText("年度印务交付确认函", bx, by + bh * 0.06);

    ctx.fillStyle = "#735318";
    ctx.font = `600 ${clamp(bw * 0.042, 6, 9.5).toFixed(1)}px "IBM Plex Mono", monospace`;
    ctx.fillText("DOC-2026-139 · ISO A4 LASER DIRECT", bx, by + bh * 0.145);

    ctx.strokeStyle = "#D4B77A";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + bh * 0.195);
    ctx.lineTo(bx + bw, by + bh * 0.195);
    ctx.stroke();

    // 正文排布条与数据卡片
    ctx.fillStyle = "#49524B";
    for (let i = 0; i < 5; i++) {
      const wFactor = i === 4 ? 0.62 : 0.96 - (i % 2) * 0.06;
      ctx.fillRect(bx, by + bh * (0.24 + i * 0.048), bw * wFactor, Math.max(2, bh * 0.015));
    }

    // 中部报表色块
    const cy = by + bh * 0.50;
    const ch = bh * 0.24;
    ctx.fillStyle = "#EAE5DB";
    ctx.fillRect(bx, cy, bw, ch);
    ctx.strokeStyle = "#2F4E38";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, cy, bw, ch);

    const bars = [0.46, 0.72, 0.61, 0.86, 0.78];
    const barW = (bw * 0.72) / bars.length;
    bars.forEach((v, idx) => {
      const h = ch * 0.62 * v;
      ctx.fillStyle = idx === 3 ? "#2F4E38" : "#DDBE80";
      ctx.fillRect(bx + bw * 0.1 + idx * (barW + 4), cy + ch * 0.82 - h, Math.max(4, barW - 3), h);
    });

    // 底部签章行
    ctx.fillStyle = "#49524B";
    ctx.fillRect(bx, by + bh * 0.80, bw * 0.56, 2.5);
    ctx.fillRect(bx, by + bh * 0.84, bw * 0.44, 2);
    ctx.strokeStyle = m.allPass ? "#2F4E38" : "#A82A24";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(bx + bw * 0.72, by + bh * 0.79, bw * 0.28, bh * 0.12);
    ctx.fillStyle = m.allPass ? "#2F4E38" : "#A82A24";
    ctx.font = `700 ${clamp(bw * 0.048, 6.5, 10).toFixed(1)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(m.allPass ? "准印" : "退改", bx + bw * 0.86, by + bh * 0.85);
  } else {
    // 经典书籍单页版心标本
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#735318";
    ctx.font = `italic 500 ${clamp(bw * 0.052, 7, 11).toFixed(1)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText("CHAPTER VIII · SHAPING THE PAGE", bx + bw / 2, by);

    ctx.strokeStyle = "rgba(47,78,56,0.35)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.15, by + bh * 0.065);
    ctx.lineTo(bx + bw * 0.85, by + bh * 0.065);
    ctx.stroke();

    ctx.fillStyle = "#222522";
    ctx.font = `900 ${clamp(bw * 0.09, 8.5, 17).toFixed(1)}px "Noto Serif SC", serif`;
    ctx.fillText("版心与书页留白", bx + bw / 2, by + bh * 0.11);

    // 段落行纹
    ctx.fillStyle = "#49524B";
    for (let i = 0; i < 12; i++) {
      const isParaBreak = i === 5;
      const ly = by + bh * (0.22 + i * 0.05 + (i > 5 ? 0.03 : 0));
      const indent = i === 0 || i === 6 ? bw * 0.08 : 0;
      const wF = isParaBreak || i === 11 ? 0.64 : 0.98;
      ctx.fillRect(bx + indent, ly, Math.max(8, bw * wF - indent), Math.max(1.8, bh * 0.014));
    }

    // 底部居中页码
    ctx.fillStyle = "#2F4E38";
    ctx.font = `600 ${clamp(bw * 0.052, 7, 11).toFixed(1)}px "IBM Plex Mono", monospace`;
    ctx.fillText("— 139 —", bx + bw / 2, by + bh * 0.93);
  }
}

// 绘制右侧倍镜解剖（宽画布模式）
function drawLoupePanel(ctx, x, y, w, h, m) {
  const pad = 12;
  const gap = 12;
  const boxH = (h - gap) / 2;

  // 上镜：左右白边走偏对比条
  ctx.fillStyle = "#F9F6EE";
  ctx.fillRect(x, y, w, boxH);
  ctx.strokeStyle = "#2F4E38";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, boxH);

  ctx.fillStyle = "#2F4E38";
  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("LOUPE 01 · 左右白边走偏比", x + pad, y + 9);

  const okSkew = m.checks.safe.ok;
  ctx.fillStyle = okSkew ? "#255D3A" : "#A82A24";
  ctx.textAlign = "right";
  ctx.fillText(`${m.skewRatio.toFixed(2)}×`, x + w - pad, y + 9);

  // 可视比例尺（0..36mm 映射）
  const maxRef = 32;
  const barX = x + pad;
  const barW = w - pad * 2;
  const barH = 20;
  const deadPx = Math.min(barW, (m.dead.left / maxRef) * barW);

  const drawMarginBar = (by, label, mmVal) => {
    ctx.fillStyle = "#49524B";
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText(`${label}  ${mmVal.toFixed(1)} mm`, barX, by - 13);

    // 底槽
    ctx.fillStyle = "#EFEBE1";
    ctx.fillRect(barX, by, barW, barH);
    // 死区标尺
    ctx.fillStyle = "rgba(168,42,36,0.18)";
    ctx.fillRect(barX, by, deadPx, barH);
    // 实印白边宽
    const valPx = clamp((mmVal / maxRef) * barW, 0, barW);
    const isClipped = mmVal < m.dead.left;
    ctx.fillStyle = isClipped ? "#A82A24" : okSkew ? "#2F4E38" : "#C47D2B";
    ctx.fillRect(barX, by, valPx, barH);
    // 死区竖线
    ctx.strokeStyle = "#A82A24";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(barX + deadPx, by - 2);
    ctx.lineTo(barX + deadPx, by + barH + 2);
    ctx.stroke();
  };

  drawMarginBar(y + 44, "实印左边", m.effLeft);
  drawMarginBar(y + 84, "实印右边", m.effRight);

  ctx.fillStyle = "#49524B";
  ctx.font = '400 10px "Noto Serif SC", serif';
  ctx.textAlign = "left";
  ctx.fillText(`红竖线 = ${m.press.label}死区 ${m.dead.left.toFixed(2)}mm · 阈值 ≤1.38×`, barX, y + boxH - 18);

  // 下镜：天头/地脚重心与框内气口
  const y2 = y + boxH + gap;
  ctx.fillStyle = "#F9F6EE";
  ctx.fillRect(x, y2, w, boxH);
  ctx.strokeStyle = "#2F4E38";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y2, w, boxH);

  ctx.fillStyle = "#2F4E38";
  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.textAlign = "left";
  ctx.fillText("LOUPE 02 · 重心与气口", x + pad, y2 + 9);

  const liftTxt = `${m.footLiftMm >= 0 ? "+" : ""}${m.footLiftMm.toFixed(1)}mm`;
  ctx.fillStyle = m.checks.margin.ok ? "#255D3A" : "#A82A24";
  ctx.textAlign = "right";
  ctx.fillText(`底-顶 ${liftTxt}`, x + w - pad, y2 + 9);

  // 三项横条：天头 / 地脚 / 内气口
  const rows = [
    { label: `天头 (死区 ${m.dead.top.toFixed(1)}mm)`, val: m.topMm, dead: m.dead.top, ok: m.topMm >= m.dead.top + 1.5 && m.topMm <= 35 },
    { label: `地脚 (应 ≥ 天头)`, val: m.bottomMm, dead: m.dead.bottom, ok: m.footLiftMm >= -0.5 && m.bottomMm >= 11 && m.bottomMm <= 46 },
    { label: `框内气口 (4.5–18mm)`, val: m.innerPadMm, dead: 4.5, ok: m.checks.control.ok },
  ];
  rows.forEach((row, idx) => {
    const ry = y2 + 38 + idx * 34;
    ctx.fillStyle = "#49524B";
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText(row.label, barX, ry - 12);
    ctx.textAlign = "right";
    ctx.fillStyle = row.ok ? "#255D3A" : "#A82A24";
    ctx.fillText(`${row.val.toFixed(1)} mm`, barX + barW, ry - 12);

    ctx.fillStyle = "#EFEBE1";
    ctx.fillRect(barX, ry, barW, 11);
    const vpx = clamp((row.val / 48) * barW, 0, barW);
    ctx.fillStyle = row.ok ? "#2F4E38" : "#A82A24";
    ctx.fillRect(barX, ry, vpx, 11);

    const dpx = clamp((row.dead / 48) * barW, 0, barW);
    ctx.strokeStyle = "#735318";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(barX + dpx, ry - 2);
    ctx.lineTo(barX + dpx, ry + 13);
    ctx.stroke();
  });
}

function renderHero(t, dt, { still }) {
  if (uiSyncPending) syncHeroUI();
  const { w, h, dpr, resized } = resizeCanvas(heroCanvas);
  if (resized) heroDirty = true;

  // 开场平滑入场（0..0.55s，永不跳过也永不自动给答案；t=0.9s 时已彻底定格清晰）
  let intro = still ? 1 : clamp(t / 0.55, 0, 1);
  if (!still && t < 0.65) heroDirty = true;
  else introDone = true;

  if (!still && passAnim > 0) {
    passAnim = Math.max(0, passAnim - dt * 1.4);
    heroDirty = true;
  }

  if (!heroDirty && introDone && passAnim === 0) return;
  heroDirty = false;

  const m = heroMetrics;
  hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  hctx.clearRect(0, 0, w, h);

  // 根据画布比例决定是否并排绘制右侧倍镜
  const showLoupe = w >= 540 && w / h >= 1.28;
  const loupeW = showLoupe ? Math.min(248, Math.round(w * 0.36)) : 0;
  const sheetZoneW = showLoupe ? w - loupeW - 22 : w;

  // 按严格 ISO A4（210:297）计算实绘纸张尺寸，绝不拉扁
  const padX = showLoupe ? 36 : 28;
  const padY = 28;
  const availW = Math.max(80, sheetZoneW - padX * 2);
  const availH = Math.max(100, h - padY * 2);
  const scale = Math.min(availW / SHEET.w, availH / SHEET.h);
  const sw = SHEET.w * scale;
  const sh = SHEET.h * scale;
  const sx = Math.round((sheetZoneW - sw) / 2);
  const sy = Math.round((h - sh) / 2 + (1 - intro) * 8);

  const mm = (val) => val * scale;

  heroGeom = { sx, sy, sw, sh, scale };

  // 一次 drawImage 贴出静态底垫、游标、A4 成品纸与硬件死区斜纹
  hctx.drawImage(getBaseLayer(w, h, dpr, sx, sy, sw, sh, scale, m.press), 0, 0, w, h);

  // 可印区矩形（剔除硬件死区）
  const pLeft = sx + mm(m.dead.left);
  const pTop = sy + mm(m.dead.top);
  const pW = sw - mm(m.dead.left + m.dead.right);
  const pH = sh - mm(m.dead.top + m.dead.bottom);

  // 若开启「印刷」探针高亮，叠加死区红透强调层
  if (state.highlight === "print") {
    hctx.fillStyle = "rgba(168,42,36,0.22)";
    hctx.fillRect(sx, sy, sw, mm(m.dead.top));
    hctx.fillRect(sx, sy + sh - mm(m.dead.bottom), sw, mm(m.dead.bottom));
    hctx.fillRect(sx, pTop, mm(m.dead.left), pH);
    hctx.fillRect(sx + sw - mm(m.dead.right), pTop, mm(m.dead.right), pH);
  }

  // 走偏后的双绿框坐标
  const fx = sx + mm(m.shiftedFrame.x);
  const fy = sy + mm(m.shiftedFrame.y);
  const fw = mm(m.shiftedFrame.w);
  const fh = mm(m.shiftedFrame.h);

  const ix = sx + mm(m.innerBox.x);
  const iy = sy + mm(m.innerBox.y);
  const iw = mm(m.innerBox.w);
  const ih = mm(m.innerBox.h);

  // 若开启某项关键词高亮，绘制对应的透明语义高亮带
  if (state.highlight === "margin" || state.highlight === "safe") {
    hctx.save();
    hctx.fillStyle = state.highlight === "margin" ? "rgba(225, 196, 135, 0.42)" : "rgba(47, 78, 56, 0.18)";
    hctx.beginPath();
    hctx.rect(sx, sy, sw, sh);
    hctx.rect(fx, fy, fw, fh);
    hctx.fill("evenodd");
    hctx.restore();
  }

  // ---- 真实物理裁切：仅可印区内能着墨，越入死区的绿框和画面被打印机物理裁白 ----
  hctx.save();
  hctx.beginPath();
  hctx.rect(pLeft, pTop, pW, pH);
  hctx.clip();

  // 仅在宽屏且非拖拽帧叠加轻微走纸斜角，避免软件渲染下每帧旋转 CJK 字形重光栅化
  if (showLoupe && !dragStart) {
    hctx.translate(sx + sw / 2, sy + sh / 2);
    hctx.rotate((m.tiltDeg * Math.PI) / 180);
    hctx.translate(-(sx + sw / 2), -(sy + sh / 2));
  }

  // 暖亚麻内场底色
  hctx.fillStyle = "#F9F6EE";
  hctx.fillRect(fx, fy, fw, fh);

  // 139 标志性深松绿双细框（外粗 2.6px + 间隙 + 内细 1px）
  hctx.strokeStyle = "#2F4E38";
  hctx.lineWidth = Math.max(2, mm(1.3));
  hctx.strokeRect(fx, fy, fw, fh);

  const gapPx = Math.max(2.6, mm(2.0));
  if (fw > gapPx * 3 && fh > gapPx * 3) {
    hctx.lineWidth = 1;
    hctx.strokeRect(fx + gapPx, fy + gapPx, fw - gapPx * 2, fh - gapPx * 2);
  }

  // 高亮内气口区
  if (state.highlight === "control") {
    hctx.fillStyle = "rgba(225, 196, 135, 0.45)";
    hctx.beginPath();
    hctx.rect(fx + gapPx, fy + gapPx, fw - gapPx * 2, fh - gapPx * 2);
    hctx.rect(ix, iy, iw, ih);
    hctx.fill("evenodd");
  }

  // 框内虚线安全区示意
  hctx.save();
  hctx.strokeStyle = m.checks.control.ok ? "rgba(47, 78, 56, 0.28)" : "rgba(168, 42, 36, 0.65)";
  hctx.lineWidth = 1;
  hctx.setLineDash([3, 3]);
  hctx.strokeRect(ix, iy, iw, ih);
  hctx.restore();

  // 绘制当前标本核心图文
  drawSpecimenContent(hctx, ix, iy, iw, ih, scale, state.specimen, m);

  hctx.restore();

  // 若发生死区吞边，在白纸死区上画出虚线「被吞残影」提示被机器裁缺的部分
  if (m.maxClip > 0) {
    hctx.save();
    hctx.strokeStyle = "#A82A24";
    hctx.lineWidth = 1.6;
    hctx.setLineDash([3, 2]);
    hctx.strokeRect(fx, fy, fw, fh);
    hctx.restore();
  }

  // 成品纸最外轮廓线
  hctx.strokeStyle = "#222522";
  hctx.lineWidth = 1.4;
  hctx.strokeRect(sx, sy, sw, sh);

  // 拖拽握柄标（四边绿框中点：紧凑深绿双线握柄）
  const drawGrip = (gx, gy, horiz) => {
    hctx.save();
    hctx.fillStyle = "#2F4E38";
    hctx.strokeStyle = "#FCF8F5";
    hctx.lineWidth = 1.2;
    const gw = horiz ? 10 : 24;
    const gh = horiz ? 24 : 10;
    hctx.fillRect(gx - gw / 2, gy - gh / 2, gw, gh);
    hctx.strokeRect(gx - gw / 2, gy - gh / 2, gw, gh);
    hctx.strokeStyle = "#E1C487";
    hctx.lineWidth = 1.2;
    hctx.beginPath();
    if (horiz) {
      hctx.moveTo(gx - 1.5, gy - 6); hctx.lineTo(gx - 1.5, gy + 6);
      hctx.moveTo(gx + 1.5, gy - 6); hctx.lineTo(gx + 1.5, gy + 6);
    } else {
      hctx.moveTo(gx - 6, gy - 1.5); hctx.lineTo(gx + 6, gy - 1.5);
      hctx.moveTo(gx - 6, gy + 1.5); hctx.lineTo(gx + 6, gy + 1.5);
    }
    hctx.stroke();
    hctx.restore();
  };
  drawGrip(clamp(fx, sx + 5, sx + sw - 5), fy + fh / 2, true);
  drawGrip(clamp(fx + fw, sx + 5, sx + sw - 5), fy + fh / 2, true);
  drawGrip(fx + fw / 2, clamp(fy, sy + 5, sy + sh - 5), false);
  drawGrip(fx + fw / 2, clamp(fy + fh, sy + 5, sy + sh - 5), false);

  // 实印抽检扫印光带（按 Space 或点「实印抽检」触发）
  if (passAnim > 0) {
    const p = 1 - passAnim;
    const scanY = sy + p * sh;
    const grad = hctx.createLinearGradient(0, scanY - 26, 0, scanY + 6);
    grad.addColorStop(0, "rgba(47, 78, 56, 0)");
    grad.addColorStop(0.75, "rgba(47, 78, 56, 0.24)");
    grad.addColorStop(1, "rgba(225, 196, 135, 0.55)");
    hctx.fillStyle = grad;
    hctx.fillRect(sx, Math.max(sy, scanY - 26), sw, Math.min(32, sy + sh - Math.max(sy, scanY - 26)));
    hctx.strokeStyle = "#2F4E38";
    hctx.lineWidth = 2;
    hctx.beginPath();
    hctx.moveTo(sx - 6, scanY);
    hctx.lineTo(sx + sw + 6, scanY);
    hctx.stroke();
  }

  // 左下纸外实时错态/合格浮签（简明单行，不遮挡画心）
  const tagText = m.allPass
    ? `✓ 印检通过 · 走偏比 ${m.skewRatio.toFixed(2)}× · 版心 ${m.frameAreaPct}%`
    : `× ${m.statusBadge.replace(/^\d\/4 · /, "")} · 左 ${m.effLeft.toFixed(1)} / 右 ${m.effRight.toFixed(1)} mm`;
  hctx.font = '600 10.5px "IBM Plex Mono", monospace';
  const tw = hctx.measureText(tagText).width + 16;
  const tx = clamp(sx + (sw - tw) / 2, 8, sheetZoneW - tw - 8);
  const ty = sy + sh + 5;
  if (ty + 18 <= h) {
    hctx.fillStyle = m.allPass ? "#2D4C36" : "#A82A24";
    hctx.fillRect(tx, ty, tw, 18);
    hctx.fillStyle = "#FCF8F5";
    hctx.textAlign = "center";
    hctx.textBaseline = "middle";
    hctx.fillText(tagText, tx + tw / 2, ty + 9.5);
  }

  // 右侧双倍镜面板（宽画布展示）
  if (showLoupe) {
    drawLoupePanel(hctx, sheetZoneW + 8, 18, loupeW, h - 36, m);
  }
}

const heroLoop = loop(heroCanvas, renderHero);

// 拖拽交互：支持精准抓四边绿框，也支持画布直接横拖调左右边距（触屏保留纵向滚页，兼容 perf.mjs 水平拖）
let dragMode = null; // "left" | "right" | "top" | "bottom" | "horiz"
let dragStart = null;

function hitEdge(cx, cy) {
  if (!heroGeom) return "horiz";
  const { sx, sy, scale } = heroGeom;
  const m = heroMetrics;
  const fx = sx + m.shiftedFrame.x * scale;
  const fy = sy + m.shiftedFrame.y * scale;
  const fw = m.shiftedFrame.w * scale;
  const fh = m.shiftedFrame.h * scale;
  const tol = 12;
  if (Math.abs(cy - fy) < tol && cx >= fx - tol && cx <= fx + fw + tol) return "top";
  if (Math.abs(cy - (fy + fh)) < tol && cx >= fx - tol && cx <= fx + fw + tol) return "bottom";
  if (Math.abs(cx - fx) < tol && cy >= fy - tol && cy <= fy + fh + tol) return "left";
  if (Math.abs(cx - (fx + fw)) < tol && cy >= fy - tol && cy <= fy + fh + tol) return "right";
  return "horiz";
}

function applyDragDelta(dx, dy) {
  if (!dragStart || !heroGeom) return;
  const mmPerPx = 1 / Math.max(0.6, heroGeom.scale);
  if (dragMode === "top") {
    state.topMm = round1(clamp(dragStart.topMm + dy * mmPerPx, 2, 48));
  } else if (dragMode === "bottom") {
    state.bottomMm = round1(clamp(dragStart.bottomMm - dy * mmPerPx, 2, 52));
  } else if (dragMode === "left") {
    state.sideMm = round1(clamp(dragStart.sideMm + dx * mmPerPx, 2, 44));
  } else if (dragMode === "right") {
    state.sideMm = round1(clamp(dragStart.sideMm - dx * mmPerPx, 2, 44));
  } else {
    // 任意位置横拖：向右滑增加安全边距、向左滑收窄，并顺带按安全比例微调轻吸附
    const raw = clamp(dragStart.sideMm + dx * mmPerPx * 0.72, 2, 44);
    state.sideMm = Math.abs(raw - 15) < 0.7 ? 15 : Math.abs(raw - 20) < 0.7 ? 20 : round1(raw);
  }
  uiSyncPending = true;
  heroDirty = true;
  if (reducedMotion.matches) {
    syncHeroUI();
    heroLoop.draw();
  }
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const r = heroCanvas.getBoundingClientRect();
  const cx = e.clientX - r.left;
  const cy = e.clientY - r.top;
  dragMode = hitEdge(cx, cy);
  // 触屏下保持横向拖拽模式不阻断竖向滚页
  if (e.pointerType === "touch" && (dragMode === "top" || dragMode === "bottom")) {
    dragMode = "horiz";
  }
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    sideMm: state.sideMm,
    topMm: state.topMm,
    bottomMm: state.bottomMm,
  };
  if (e.pointerType !== "touch") {
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragStart) {
    // 悬停换光标
    if (e.pointerType === "mouse") {
      const r = heroCanvas.getBoundingClientRect();
      const hit = hitEdge(e.clientX - r.left, e.clientY - r.top);
      heroCanvas.style.cursor = hit === "top" || hit === "bottom" ? "ns-resize" : "ew-resize";
    }
    return;
  }
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.25 && Math.abs(dx) < 8) {
    // 让竖向滑屏继续滚动页面
    dragStart = null;
    return;
  }
  applyDragDelta(dx, dy);
});

const endPointerDrag = () => {
  if (uiSyncPending) syncHeroUI();
  dragStart = null;
  dragMode = null;
};
heroCanvas.addEventListener("pointerup", endPointerDrag);
heroCanvas.addEventListener("pointercancel", endPointerDrag);

// 触发实印扫印检验动效
function triggerPrintPass() {
  passAnim = reducedMotion.matches ? 0 : 1;
  heroDirty = true;
  heroLoop.draw();
}

// 绑定开场全部控件
$$("[data-specimen]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    syncHeroUI();
    heroLoop.draw();
  });
});

$$("[data-press]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.press = btn.dataset.press;
    state.driftMm = PRESSES[state.press].defaultDrift;
    syncHeroUI();
    triggerPrintPass();
  });
});

$$("[data-drift]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.driftMm = Number(btn.dataset.drift);
    syncHeroUI();
    triggerPrintPass();
  });
});

ui.rangeSide.addEventListener("input", () => { state.sideMm = Number(ui.rangeSide.value); syncHeroUI(); heroLoop.draw(); });
ui.rangeTop.addEventListener("input", () => { state.topMm = Number(ui.rangeTop.value); syncHeroUI(); heroLoop.draw(); });
ui.rangeBottom.addEventListener("input", () => { state.bottomMm = Number(ui.rangeBottom.value); syncHeroUI(); heroLoop.draw(); });
ui.rangeInner.addEventListener("input", () => { state.innerPadMm = Number(ui.rangeInner.value); syncHeroUI(); heroLoop.draw(); });

$$("[data-solution]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sol = SOLUTIONS[btn.dataset.solution];
    if (!sol) return;
    Object.assign(state, {
      sideMm: sol.sideMm,
      topMm: sol.topMm,
      bottomMm: sol.bottomMm,
      innerPadMm: sol.innerPadMm,
    });
    // 若当前在胶印 10mm 咬口下，原海报解天头 16mm 本就过关
    syncHeroUI();
    triggerPrintPass();
  });
});

$$("[data-fail]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = FAILURE_CASES[btn.dataset.fail];
    if (!f) return;
    Object.assign(state, {
      press: f.press,
      driftMm: f.driftMm,
      sideMm: f.sideMm,
      topMm: f.topMm,
      bottomMm: f.bottomMm,
      innerPadMm: f.innerPadMm,
    });
    syncHeroUI();
    triggerPrintPass();
  });
});

$$("[data-probe]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.probe;
    state.highlight = state.highlight === key ? null : key;
    syncHeroUI();
    heroLoop.draw();
  });
});

$("#btn-print-pass").addEventListener("click", triggerPrintPass);
$("#btn-fix-poster").addEventListener("click", () => {
  // 根据当前机台与公差给出一套确保 4/4 的稳妥边距
  const minSide = state.driftMm >= 2.4 ? 18 : 15;
  const minTop = state.press === "offset" ? 18 : 16;
  Object.assign(state, {
    sideMm: minSide,
    topMm: minTop,
    bottomMm: minTop + 4,
    innerPadMm: 9,
  });
  syncHeroUI();
  triggerPrintPass();
});
$("#btn-reset-bad").addEventListener("click", () => {
  Object.assign(state, OPEN_BAD_STATE);
  syncHeroUI();
  heroLoop.draw();
});

// 键盘操控开场检验台
document.addEventListener("keydown", (e) => {
  if (!$("#lightbox").hidden) return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (e.code === "Space" && tag !== "BUTTON" && tag !== "A") {
    const r = heroCanvas.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) {
      e.preventDefault();
      triggerPrintPass();
    }
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.sideMm = round1(clamp(state.sideMm + 1, 2, 44));
    syncHeroUI(); heroLoop.draw();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.sideMm = round1(clamp(state.sideMm - 1, 2, 44));
    syncHeroUI(); heroLoop.draw();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (e.shiftKey) state.topMm = round1(clamp(state.topMm + 1, 2, 48));
    else state.bottomMm = round1(clamp(state.bottomMm + 1, 2, 52));
    syncHeroUI(); heroLoop.draw();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (e.shiftKey) state.topMm = round1(clamp(state.topMm - 1, 2, 48));
    else state.bottomMm = round1(clamp(state.bottomMm - 1, 2, 52));
    syncHeroUI(); heroLoop.draw();
  } else if (e.key === "]") {
    state.innerPadMm = round1(clamp(state.innerPadMm + 1, 0, 22));
    syncHeroUI(); heroLoop.draw();
  } else if (e.key === "[") {
    state.innerPadMm = round1(clamp(state.innerPadMm - 1, 0, 22));
    syncHeroUI(); heroLoop.draw();
  }
});

// ============================================================================
// 2. 第 01 节：三层印前透视叠层开关
// ============================================================================
const xrayLayers = { dead: true, drift: true, inner: true };
const xrayExplain = $("#xray-explain");

function updateXray() {
  for (const [k, on] of Object.entries(xrayLayers)) {
    const g = $(`[data-xlayer="${k}"]`);
    if (g) g.classList.toggle("is-off", !on);
    const btn = $(`[data-layer="${k}"]`);
    if (btn) {
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
    }
  }
  const active = Object.entries(xrayLayers).filter(([, v]) => v).map(([k]) => k);
  if (active.length === 3) {
    xrayExplain.textContent = "三道防线叠加：红色外环躲开打印机滚轴硬死区；暖金中环吞下 ±1.5–2.5 mm 进纸偏移并形成画框呼吸；深绿内气口防止标题与图像顶死边框。";
  } else if (active.length === 0) {
    xrayExplain.textContent = "关闭所有标尺后，你看到的正是最终拿到手里的成品白边：安静、整洁、毫无技术痕迹，却暗含三层物理保护。";
  } else {
    const notes = [];
    if (xrayLayers.dead) notes.push("① 红色死区（约 4.23 mm）：桌面激光机无法定影着墨的硬件禁区");
    if (xrayLayers.drift) notes.push("② 暖金缓冲带（14–22 mm）：吃掉双面进纸偏移并托起光学重心");
    if (xrayLayers.inner) notes.push("③ 深绿内气口（8–12 mm）：让标题与核心画面在双细框内保持克制留白");
    xrayExplain.textContent = notes.join("；") + "。";
  }
}

$$("[data-layer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    xrayLayers[k] = !xrayLayers[k];
    updateXray();
  });
});

// ============================================================================
// 3. 第 02 节：双页同步走纸偏斜对照台（2D Canvas）
// ============================================================================
const skewCanvas = $("#skew-canvas");
const sctx = skewCanvas.getContext("2d");
const skewRange = $("#skew-shift-range");
const skewValEl = $("#skew-shift-val");
const skewLeftRatio = $("#skew-left-ratio");
const skewLeftMm = $("#skew-left-mm");
const skewRightRatio = $("#skew-right-ratio");
const skewRightMm = $("#skew-right-mm");

let skewShift = 1.8;
let skewDirty = true;

function updateSkewStats() {
  const s = skewShift;
  skewValEl.textContent = `${s.toFixed(1)} mm`;
  skewRange.value = String(s);

  const lNarrow = round1(6 - s);
  const rNarrow = round1(6 + s);
  const ratioN = lNarrow <= 0.2 ? 9.9 : round2(rNarrow / lNarrow);
  const nClip = lNarrow < 4.23;
  skewLeftRatio.textContent = nClip
    ? `${ratioN.toFixed(2)}× · 且死区吞边`
    : ratioN > 1.38
    ? `${ratioN.toFixed(2)}× · 明显露歪`
    : `${ratioN.toFixed(2)}× · 尚可`;
  skewLeftMm.textContent = `左 ${lNarrow.toFixed(1)} mm / 右 ${rNarrow.toFixed(1)} mm`;

  const lWide = round1(18 - s);
  const rWide = round1(18 + s);
  const ratioW = round2(rWide / lWide);
  skewRightRatio.textContent = `${ratioW.toFixed(2)}× · 肉眼平稳`;
  skewRightMm.textContent = `左 ${lWide.toFixed(1)} mm / 右 ${rWide.toFixed(1)} mm`;

  $$("[data-skew-preset]").forEach((b) => {
    b.classList.toggle("is-active", Math.abs(Number(b.dataset.skewPreset) - s) < 0.05);
  });
  skewDirty = true;
}

function renderSkew() {
  const { w, h, dpr, resized } = resizeCanvas(skewCanvas);
  if (!skewDirty && !resized) return;
  skewDirty = false;

  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.fillStyle = "#1F3526";
  sctx.fillRect(0, 0, w, h);

  const pad = 16;
  const gap = 18;
  const colW = (w - pad * 2 - gap) / 2;
  const topLabelH = 26;
  const botLabelH = 28;
  const availH = h - topLabelH - botLabelH - 8;
  const scale = Math.min((colW - 10) / SHEET.w, availH / SHEET.h);
  const sw = SHEET.w * scale;
  const sh = SHEET.h * scale;
  const sy = topLabelH + Math.round((availH - sh) / 2);

  const drawOne = (cx, nominalMm, title) => {
    const sx = Math.round(cx - sw / 2);
    const leftEff = round1(nominalMm - skewShift);
    const rightEff = round1(nominalMm + skewShift);
    const ratio = round2(rightEff / Math.max(0.2, leftEff));
    const bad = ratio > 1.38 || leftEff < 4.23;

    // 标题
    sctx.fillStyle = bad ? "#FF8F84" : "#9CD4AD";
    sctx.font = '600 11.5px "IBM Plex Mono", monospace';
    sctx.textAlign = "center";
    sctx.textBaseline = "top";
    sctx.fillText(title, cx, 6);

    // 纸张
    sctx.fillStyle = "#FCF8F5";
    sctx.fillRect(sx, sy, sw, sh);

    // 4.23mm 硬件死区提示条
    const dPx = 4.23 * scale;
    sctx.fillStyle = "rgba(168,42,36,0.16)";
    sctx.fillRect(sx, sy, dPx, sh);
    sctx.fillRect(sx + sw - dPx, sy, dPx, sh);

    // 实际印出的双细绿框（按真实偏移绘制并物理裁切死区）
    const fx = sx + leftEff * scale;
    const fy = sy + (nominalMm + skewShift * 0.45) * scale;
    const fw = sw - nominalMm * 2 * scale;
    const fh = sh - nominalMm * 2 * scale;

    sctx.save();
    sctx.beginPath();
    sctx.rect(sx + dPx, sy + dPx, sw - dPx * 2, sh - dPx * 2);
    sctx.clip();

    sctx.fillStyle = "#F9F6EE";
    sctx.fillRect(fx, fy, fw, fh);
    sctx.strokeStyle = "#2F4E38";
    sctx.lineWidth = 2.2;
    sctx.strokeRect(fx, fy, fw, fh);
    sctx.lineWidth = 0.8;
    sctx.strokeRect(fx + 3, fy + 3, fw - 6, fh - 6);

    // 内画块示意
    const ix = fx + fw * 0.16;
    const iy = fy + fh * 0.28;
    sctx.fillStyle = "#EAE5DB";
    sctx.fillRect(ix, iy, fw * 0.68, fh * 0.36);
    sctx.fillStyle = "#E0CBA3";
    sctx.beginPath();
    sctx.arc(ix + fw * 0.24, iy + fh * 0.11, Math.max(4, fw * 0.08), 0, Math.PI * 2);
    sctx.fill();
    sctx.fillStyle = "#222522";
    sctx.fillRect(fx + fw * 0.24, fy + fh * 0.12, fw * 0.52, Math.max(3, fh * 0.032));
    sctx.fillStyle = "#49524B";
    sctx.fillRect(fx + fw * 0.2, fy + fh * 0.72, fw * 0.6, 2.5);
    sctx.fillRect(fx + fw * 0.28, fy + fh * 0.77, fw * 0.44, 2);

    sctx.restore();

    // 吞边红虚线提示
    if (leftEff < 4.23) {
      sctx.save();
      sctx.strokeStyle = "#A82A24";
      sctx.setLineDash([3, 2]);
      sctx.lineWidth = 1.4;
      sctx.strokeRect(fx, fy, fw, fh);
      sctx.restore();
    }

    // 高亮左右白边宽的实测标尺条
    const midY = sy + sh * 0.52;
    sctx.fillStyle = bad ? "rgba(168,42,36,0.34)" : "rgba(47,78,56,0.28)";
    sctx.fillRect(sx, midY - 5, Math.max(0, leftEff * scale), 10);
    sctx.fillRect(fx + fw, midY - 5, Math.max(0, rightEff * scale), 10);

    // 底部结论
    sctx.fillStyle = "#F5F1E8";
    sctx.font = '500 11px "IBM Plex Mono", monospace';
    sctx.textAlign = "center";
    sctx.textBaseline = "bottom";
    sctx.fillText(`左 ${leftEff.toFixed(1)}mm : 右 ${rightEff.toFixed(1)}mm (${ratio.toFixed(2)}×)`, cx, h - 6);
  };

  drawOne(pad + colW / 2, 6, "窄边 6 mm · 放大偏斜");
  drawOne(pad + colW + gap + colW / 2, 18, "宽边 18 mm · 吸收偏斜");
}

const skewLoop = loop(skewCanvas, renderSkew);

skewRange.addEventListener("input", () => {
  skewShift = Number(skewRange.value);
  updateSkewStats();
  skewLoop.draw();
});
$$("[data-skew-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    skewShift = Number(btn.dataset.skewPreset);
    updateSkewStats();
    skewLoop.draw();
  });
});

// ============================================================================
// 4. 第 03 节：四时代历史法典与工程标准（SVG 动态切换）
// ============================================================================
const CANONS = {
  vandegraaf: {
    year: "1946 · 1975 / 1991 · 1992",
    title: "古典书页九宫法典与拇指留白",
    body: [
      "1946 年，荷兰设计师 J. A. van de Graaf 在《Nieuwe berekening voor de vormgeving》中用对角线几何复原了中世纪抄本与早期印本的留白规律：内口与天头各占 1/9，外口与地脚各占 2/9，使版心与整页保持同一长宽比。",
      "德国排版大师 Jan Tschichold 在 1975 年德文论文集（1991 年英译《The Form of the Book》，Hartley & Marks 出版）中推广了 2:3:4:6 的古典边距递增秩序；1992 年 Robert Bringhurst 在《The Elements of Typographic Style》第 8 章总结了边距的三重职责：锁住比例、框起版心、保护正文并为读者双手拇指留出握持空位。",
    ],
    code: "内口 : 天头 : 外口 : 地脚 = 2 : 3 : 4 : 6  (2:3 古典书页)",
    source: "核实来源：Wikipedia Canons of page construction · Jan Tschichold (1975/1991) · Robert Bringhurst (1992)",
    svg: `
      <rect x="30" y="24" width="360" height="252" fill="#FCF8F5" stroke="#222522" stroke-width="1.5"/>
      <line x1="210" y1="24" x2="210" y2="276" stroke="#2F4E38" stroke-width="1.2" stroke-dasharray="4 3"/>
      <!-- Van de Graaf 对角构造线 -->
      <line x1="30" y1="276" x2="390" y2="24" stroke="#D4B77A" stroke-width="1.2"/>
      <line x1="30" y1="24" x2="390" y2="276" stroke="#D4B77A" stroke-width="1.2"/>
      <line x1="30" y1="276" x2="210" y2="24" stroke="#D4B77A" stroke-width="1.2"/>
      <line x1="210" y1="24" x2="390" y2="276" stroke="#D4B77A" stroke-width="1.2"/>
      <!-- 左右版心（1/9 内顶，2/9 外底） -->
      <rect x="70" y="52" width="120" height="168" fill="#EAE5DB" stroke="#2F4E38" stroke-width="2"/>
      <rect x="230" y="52" width="120" height="168" fill="#EAE5DB" stroke="#2F4E38" stroke-width="2"/>
      <text x="130" y="132" text-anchor="middle" font-size="11" fill="#2F4E38" font-family="Noto Serif SC, serif" font-weight="700">左页版心</text>
      <text x="130" y="150" text-anchor="middle" font-size="10" fill="#49524B" font-family="IBM Plex Mono, monospace">2/3 × 2/3</text>
      <text x="290" y="132" text-anchor="middle" font-size="11" fill="#2F4E38" font-family="Noto Serif SC, serif" font-weight="700">右页版心</text>
      <text x="290" y="150" text-anchor="middle" font-size="10" fill="#49524B" font-family="IBM Plex Mono, monospace">2:3:4:6</text>
      <text x="210" y="256" text-anchor="middle" font-size="10.5" fill="#735318" font-family="IBM Plex Mono, monospace">地脚最厚 (2/9) · 承托视觉重心与双手拇指</text>
    `,
  },
  iso216: {
    year: "1922 DIN 476 → 1975 ISO 216 / ISO 217",
    title: "成品纸（A4）与出血原纸（SRA4）的分工",
    body: [
      "1922 年德国工程师 Walter Porstmann 制定 DIN 476，确立了 1:√2 恒定长宽比的 A 系列纸张；1975 年该体系成为国际标准 ISO 216（如 A4 = 210×297 mm）。",
      "为了支持商业满出血印刷，国际标准另设 ISO 217（未裁原纸 SRA4 = 225×320 mm），靠印完后四面切掉废边得到 A4。无出血版式直接印在 ISO 216 成品纸上，省掉大纸损耗与二次裁切工序。",
    ],
    code: "ISO 217 SRA4 (225×320 mm) → 裁边 → ISO 216 A4 (210×297 mm)\n无出血版式：直接印于 A4 成品纸，零裁切废边",
    source: "核实来源：Wikipedia ISO 216 (DIN 476 / ISO 217 纸张标准)",
    svg: `
      <!-- SRA4 外框 -->
      <rect x="92" y="16" width="236" height="268" fill="#EFEBE1" stroke="#A82A24" stroke-width="1.4" stroke-dasharray="5 3"/>
      <text x="210" y="33" text-anchor="middle" font-size="10" fill="#A82A24" font-family="IBM Plex Mono, monospace">ISO 217 · SRA4 (225×320 mm 满出血需裁掉外圈)</text>
      <!-- A4 成品纸 -->
      <rect x="116" y="42" width="188" height="224" fill="#FCF8F5" stroke="#222522" stroke-width="1.6"/>
      <text x="210" y="59" text-anchor="middle" font-size="10" fill="#222522" font-family="IBM Plex Mono, monospace">ISO 216 · A4 成品纸 (210×297 mm)</text>
      <!-- 无出血安全双绿框 -->
      <rect x="136" y="70" width="148" height="172" fill="#F9F6EE" stroke="#2F4E38" stroke-width="2.2"/>
      <rect x="140" y="74" width="140" height="164" fill="none" stroke="#2F4E38" stroke-width="0.9"/>
      <text x="210" y="148" text-anchor="middle" font-size="12" fill="#2F4E38" font-family="Noto Serif SC, serif" font-weight="700">无出血版心</text>
      <text x="210" y="168" text-anchor="middle" font-size="10" fill="#49524B" font-family="IBM Plex Mono, monospace">直接入纸盒 · 免裁切</text>
      <text x="210" y="256" text-anchor="middle" font-size="10" fill="#735318" font-family="IBM Plex Mono, monospace">1 : √2 等比缩放不变形</text>
    `,
  },
  hardware: {
    year: "OFFICE LASER & SHEETFED OFFSET",
    title: "激光机 4.23 mm 硬死区与胶印 10 mm 咬口",
    body: [
      "桌面激光打印机必须靠滚轴送纸并防止碳粉污染定影器，物理上无法无边打印。例如 Brother 激光机型官方标注四周不可印边为 4.23 mm（0.16 英寸），HP LaserJet 常见硬边距约为 4 mm，且双面送纸常带 ±1–2 mm 偏斜。",
      "商业单张纸胶印机虽可满版印刷，但印张前缘同样存在 8–12 mm 的金属咬口边（Gripper Margin）与 3–5 mm 拖梢边。无出血版式把一切关键元素留在安全区，天然兼容所有办公与商业机型。",
    ],
    code: "桌面激光不可印边：~4.23 mm（四边）\n单张纸胶印咬口边：8–12 mm（前缘）+ 3–5 mm（拖梢）",
    source: "核实来源：Brother / HP 官方激光机打印区域说明 · 单张纸胶印印前规范",
    svg: `
      <!-- 左：桌面激光机 -->
      <rect x="28" y="34" width="164" height="226" fill="#FCF8F5" stroke="#222522" stroke-width="1.4"/>
      <rect x="37" y="43" width="146" height="208" fill="none" stroke="#A82A24" stroke-width="1.2" stroke-dasharray="3 3"/>
      <rect x="52" y="60" width="116" height="172" fill="#F9F6EE" stroke="#2F4E38" stroke-width="2"/>
      <text x="110" y="23" text-anchor="middle" font-size="10.5" fill="#2F4E38" font-family="Noto Serif SC, serif" font-weight="700">办公激光机</text>
      <text x="110" y="140" text-anchor="middle" font-size="10.5" fill="#222522" font-family="IBM Plex Mono, monospace">4.23 mm</text>
      <text x="110" y="156" text-anchor="middle" font-size="10" fill="#49524B" font-family="Noto Serif SC, serif">四边硬件死区</text>
      <!-- 右：胶印咬口 -->
      <rect x="228" y="34" width="164" height="226" fill="#FCF8F5" stroke="#222522" stroke-width="1.4"/>
      <rect x="228" y="34" width="164" height="26" fill="#A82A24" fill-opacity="0.22"/>
      <line x1="228" y1="60" x2="392" y2="60" stroke="#A82A24" stroke-width="1.4" stroke-dasharray="4 2"/>
      <rect x="246" y="72" width="128" height="164" fill="#F9F6EE" stroke="#2F4E38" stroke-width="2"/>
      <text x="310" y="23" text-anchor="middle" font-size="10.5" fill="#2F4E38" font-family="Noto Serif SC, serif" font-weight="700">单张纸胶印机</text>
      <text x="310" y="51" text-anchor="middle" font-size="9.5" fill="#A82A24" font-family="IBM Plex Mono, monospace">咬口 8–12 mm</text>
      <text x="310" y="148" text-anchor="middle" font-size="10.5" fill="#222522" font-family="Noto Serif SC, serif">金属咬牙叼纸区</text>
      <text x="210" y="282" text-anchor="middle" font-size="10" fill="#735318" font-family="IBM Plex Mono, monospace">远离机械禁区，才能跨设备一次印稳</text>
    `,
  },
  csspage: {
    year: "W3C CSS PAGED MEDIA LEVEL 3",
    title: "把无出血安全区写进 @page 协议",
    body: [
      "纸面无出血纪律同样进入了网页打印与 PDF 排版标准。W3C《CSS Paged Media Module Level 3》明确把每一张打印纸拆成两大块：居中的页面区（Page Area，承载正文流）与四周的 16 个页边距盒（Page-Margin Boxes，专放页眉、页脚与页码）。",
      "只要在样式表里声明 @page { size: A4; margin: 20mm 18mm 24mm 18mm; }，浏览器与排版引擎就会自动为激光打印留出安全白边，彻底告别截边与乱分页。",
    ],
    code: "@page {\n  size: A4 portrait;\n  margin: 20mm 18mm 24mm 18mm;\n  @bottom-center { content: counter(page); }\n}",
    source: "核实来源：W3C CSS Paged Media Module Level 3 (https://www.w3.org/TR/css-page-3/)",
    svg: `
      <rect x="46" y="20" width="328" height="258" fill="#FCF8F5" stroke="#222522" stroke-width="1.5"/>
      <!-- 16 页边距盒网格 -->
      <line x1="98" y1="20" x2="98" y2="278" stroke="#D4B77A" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="322" y1="20" x2="322" y2="278" stroke="#D4B77A" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="46" y1="62" x2="374" y2="62" stroke="#D4B77A" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="46" y1="230" x2="374" y2="230" stroke="#D4B77A" stroke-width="1" stroke-dasharray="3 3"/>
      <!-- 中央 Page Area -->
      <rect x="98" y="62" width="224" height="168" fill="#EAE5DB" stroke="#2F4E38" stroke-width="2"/>
      <text x="210" y="44" text-anchor="middle" font-size="10" fill="#735318" font-family="IBM Plex Mono, monospace">@top-center</text>
      <text x="210" y="138" text-anchor="middle" font-size="13" fill="#2F4E38" font-family="IBM Plex Mono, monospace" font-weight="600">PAGE AREA</text>
      <text x="210" y="158" text-anchor="middle" font-size="10.5" fill="#49524B" font-family="Noto Serif SC, serif">正文安全排布区</text>
      <text x="210" y="256" text-anchor="middle" font-size="10" fill="#735318" font-family="IBM Plex Mono, monospace">@bottom-center · counter(page)</text>
      <text x="72" y="148" text-anchor="middle" font-size="9.5" fill="#49524B" font-family="IBM Plex Mono, monospace">@left</text>
      <text x="348" y="148" text-anchor="middle" font-size="9.5" fill="#49524B" font-family="IBM Plex Mono, monospace">@right</text>
    `,
  },
};

function renderCanon(id) {
  const c = CANONS[id] || CANONS.vandegraaf;
  $("#canon-svg").innerHTML = c.svg;
  $("#canon-detail").innerHTML = `
    <span class="canon-year">${c.year}</span>
    <h3>${c.title}</h3>
    ${c.body.map((p) => `<p>${p}</p>`).join("")}
    <pre class="canon-code">${c.code}</pre>
    <p class="canon-source">${c.source}</p>
  `;
  $$(".canon-tab").forEach((tab) => {
    const active = tab.dataset.canon === id;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

$$(".canon-tab").forEach((tab) => {
  tab.addEventListener("click", () => renderCanon(tab.dataset.canon));
});

// ============================================================================
// 5. 第 04 节：场景规格 × 装订退让算尺
// ============================================================================
let activeRecipe = "office";
let activeBinding = "none";

function updateRecipe() {
  const res = calcRecipe(activeRecipe, activeBinding);
  $("#rec-top").textContent = `${res.top} mm`;
  $("#rec-bottom").textContent = `${res.bottom} mm`;
  $("#rec-inner").textContent = `${res.inner} mm`;
  $("#rec-outer").textContent = `${res.outer} mm`;
  $("#rec-area").textContent = `${res.areaPct}%`;
  $("#rec-skew").textContent = `${res.skewAt18.toFixed(2)}×`;
  $("#rec-note").textContent = `${res.r.note} ${res.b.note}`;

  // 等比例更新示意图
  const topPct = (res.top / res.r.h) * 100;
  const botPct = (res.bottom / res.r.h) * 100;
  const leftPct = (res.inner / res.r.w) * 100;
  const rightPct = (res.outer / res.r.w) * 100;
  const bindPct = (res.b.innerAdd / res.r.w) * 100;

  $("#bp-safe").style.inset = `${topPct.toFixed(1)}% ${rightPct.toFixed(1)}% ${botPct.toFixed(1)}% ${leftPct.toFixed(1)}%`;
  $("#bp-binding-strip").style.width = `${bindPct.toFixed(1)}%`;
  $("#bp-safe-dim").textContent = `${res.safeW} × ${res.safeH} mm`;
  $("#bp-safe-pct").textContent = `占整纸 ${res.areaPct}%`;
  $("#bp-top").textContent = `顶 ${res.top}mm`;
  $("#bp-bottom").textContent = `底 ${res.bottom}mm`;
  $("#bp-left").textContent = `内 ${res.inner}mm`;
  $("#bp-right").textContent = `外 ${res.outer}mm`;

  $$("[data-recipe]").forEach((b) => b.classList.toggle("is-active", b.dataset.recipe === activeRecipe));
  $$("[data-binding]").forEach((b) => b.classList.toggle("is-active", b.dataset.binding === activeBinding));
}

$$("[data-recipe]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeRecipe = btn.dataset.recipe;
    updateRecipe();
  });
});
$$("[data-binding]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeBinding = btn.dataset.binding;
    updateRecipe();
  });
});

// ============================================================================
// 6. 第 05 节：四联反例翻牌对照
// ============================================================================
const ANTI_LABELS = {
  photo: { bad: "当前：硬套无出血白边", good: "换用：138 满出血沉浸", btnBad: "切换为满出血对照", btnGood: "切回误用白边" },
  darkbrand: { bad: "当前：硬套无出血白边", good: "换用：深底满出血", btnBad: "切换为满出血对照", btnGood: "切回误用白边" },
  card: { bad: "当前：硬套宽白边框", good: "换用：满底 + 4.5mm 安全距", btnBad: "切换为满底安全距对照", btnGood: "切回误用宽框" },
  spread: { bad: "当前：白边斩断跨页", good: "换用：137 贯通跨页", btnBad: "切换为贯通跨页对照", btnGood: "切回白边斩断" },
};

$$(".anti-card").forEach((card) => {
  const key = card.dataset.anti;
  const btn = $(".anti-toggle", card);
  const badge = $(".anti-badge", card);
  btn.addEventListener("click", () => {
    const next = card.dataset.mode === "bad" ? "good" : "bad";
    card.dataset.mode = next;
    badge.textContent = ANTI_LABELS[key][next];
    btn.textContent = next === "bad" ? ANTI_LABELS[key].btnBad : ANTI_LABELS[key].btnGood;
  });
});

// ============================================================================
// 7. 第 06 节：印前小练习（四版只差边距变量，中性标签，选后真实叠偏移解析）
// ============================================================================
// 按 ISO A4 比例初始化四张小样的真实边距几何
$$(".quiz-mini").forEach((wrap) => {
  const [t, b, l, r] = wrap.dataset.m.split(",").map(Number);
  const border = $(".q-border", wrap);
  border.style.top = `${((t / SHEET.h) * 100).toFixed(1)}%`;
  border.style.bottom = `${((b / SHEET.h) * 100).toFixed(1)}%`;
  border.style.left = `${((l / SHEET.w) * 100).toFixed(1)}%`;
  border.style.right = `${((r / SHEET.w) * 100).toFixed(1)}%`;
});

const QUIZ_EXPLAIN = {
  A: "顶/底/左右各 4 mm：直接跌破激光机 4.23 mm 物理不可印死区，再叠加 ±1.5 mm 进纸偏移，四边绿框外线必然被打印机硬生生裁缺。",
  B: "顶/底/左右各 7 mm：表面躲过 4.23 mm 死区，但 ±1.5 mm 偏移会让左右白边劈成 5.5 mm 对 8.5 mm（1.55× 明显歪斜），且上下等距缺少地脚托举，视觉重心下坠。",
  C: "顶 17 mm · 底 21 mm · 左右 16 mm：远超 4.23 mm 死区，±1.5 mm 偏移下左右比压到 1.21× 肉眼难察；地脚比天头多 4 mm 稳托重心，同时保住 66% 的舒展版心。",
  D: "顶 42 mm · 底 46 mm · 左右 40 mm：虽然绝对不会裁缺，但空白吃掉超过 60% 纸面，核心版心被挤成狭小邮票，证书的端庄体量感全失。",
};

const quizGrid = $("#quiz-grid");
const quizFeedback = $("#quiz-feedback");

$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const pick = card.dataset.choice;
    const isRight = pick === "C";
    quizGrid.classList.add("is-revealed");
    $$(".quiz-card").forEach((c) => {
      c.classList.remove("is-selected", "is-right", "is-wrong");
      if (c.dataset.choice === "C") c.classList.add("is-right");
      if (c.dataset.choice === pick) {
        c.classList.add("is-selected");
        if (!isRight) c.classList.add("is-wrong");
      }
    });

    quizFeedback.innerHTML = `
      <p class="quiz-verdict ${isRight ? "" : "is-wrong"}">${
        isRight
          ? "✓ 判得准：方案 C 是唯一同时过关「硬件安全、走偏平稳、光学托举与版心体量」的一版。"
          : `× 你选了方案 ${pick}，最稳妥的是方案 C（顶 17 / 底 21 / 左右 16 mm）。`
      }</p>
      <p>上方四张小样已同步叠出红色 4.23 mm 激光死区与 ±1.5 mm 真实进纸偏移，对比四版差异：</p>
      <ul class="quiz-breakdown">
        <li><strong>方案 A（4 mm）：</strong>${QUIZ_EXPLAIN.A}</li>
        <li><strong>方案 B（7 mm）：</strong>${QUIZ_EXPLAIN.B}</li>
        <li><strong>方案 C（17/21/16 mm）：</strong>${QUIZ_EXPLAIN.C}</li>
        <li><strong>方案 D（42/46/40 mm）：</strong>${QUIZ_EXPLAIN.D}</li>
      </ul>
    `;
  });
});

// ============================================================================
// 8. 第 07 节：原海报放大灯箱（缩放、拖动 draggable="false"、Esc 关）
// ============================================================================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbViewport = $("#lb-viewport");
const lbScale = $("#lb-scale");
const posterTrigger = $("#poster-trigger");

let lbZoom = 1;
let lbPanX = 0;
let lbPanY = 0;
let lbDrag = null;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbPanX}px, ${lbPanY}px) scale(${lbZoom})`;
  lbScale.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbZoom = 1;
  lbPanX = 0;
  lbPanY = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => { lbZoom = clamp(lbZoom + 0.35, 1, 3.5); applyLightboxTransform(); });
$("#lb-zoom-out").addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.35, 1, 3.5);
  if (lbZoom <= 1.01) { lbPanX = 0; lbPanY = 0; }
  applyLightboxTransform();
});
$("#lb-reset").addEventListener("click", () => { lbZoom = 1; lbPanX = 0; lbPanY = 0; applyLightboxTransform(); });

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.5);
  if (lbZoom <= 1.01) { lbPanX = 0; lbPanY = 0; }
  applyLightboxTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbZoom <= 1.01) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX, y: e.clientY, px: lbPanX, py: lbPanY };
  lbViewport.classList.add("is-dragging");
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbPanX = lbDrag.px + (e.clientX - lbDrag.x);
  lbPanY = lbDrag.py + (e.clientY - lbDrag.y);
  applyLightboxTransform();
});
const endLbDrag = () => {
  lbDrag = null;
  lbViewport.classList.remove("is-dragging");
};
lbViewport.addEventListener("pointerup", endLbDrag);
lbViewport.addEventListener("pointercancel", endLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});

// ============================================================================
// 9. 初始化全部组件 + 窗口变化重绘
// ============================================================================
syncHeroUI();
updateXray();
updateSkewStats();
renderCanon("vandegraaf");
updateRecipe();

heroLoop.draw();
skewLoop.draw();

window.addEventListener("resize", () => {
  heroDirty = true;
  skewDirty = true;
  heroLoop.draw();
  skewLoop.draw();
});
