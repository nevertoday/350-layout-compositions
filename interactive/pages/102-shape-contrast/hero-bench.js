// 开场主角玩具：原海报四组同台雕琢板（2D Canvas 四组同屏 + 4 枚异向几何节点手柄）
// 同时摆出 102 号海报右栏的四组形状对话，各自停在不同错法上，手势与成立区间各不相同：
//   01 圆与方（斜拖左上角）  ：开场过度倒圆撞形 → 向外拉出直角（t ≤ 0.14）成立
//   02 尖与钝（竖拖三角顶点）：开场压塌钝角低坡 → 向上拔起锐峰（顶角 ≤ 50°）成立
//   03 实与空（横拖方框内沿）：开场极细线框发虚 → 拉入中段甜区（墨量 40%–70%）成立，过细过粗皆错
//   04 规则与自由（释放有机形）：开场双侧刻板无对比 → 拖入中段甜区（0.38–0.72）成立，拉过头冲散左阵也错
// 四组全部成立（4/4）后才解锁「抽成纯黑白验证」与「0 键 / 按钮对照原海报参考态」。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  MODES,
  MODE_MAP,
  clamp,
  createInitialParams,
  createPosterParams,
  evaluateBoard,
  snapParam,
} from "./model.js";

const INK = "#131517";
const BLUE = "#1f49c1";
const ORANGE = "#e76b28";
const ORANGE_INK = "#b84a10";
const PAPER = "#f9eee0";
const SAND = "#f1e1c9";
const WHITE = "#fffbf4";

// 5×5 点阵越界散开向量（仅在 t > 0.72 时触发）
const GRID_DRIFT = Array.from({ length: 25 }, (_, i) => {
  const col = i % 5;
  const row = Math.floor(i / 5);
  const angle = (i * 2.39996 + 0.55) % (Math.PI * 2);
  const mag = 0.62 + ((i * 37) % 11) / 26;
  return { col, row, ux: Math.cos(angle) * mag, uy: Math.sin(angle) * mag };
});

function lerp(a, b, u) {
  return a + (b - a) * u;
}

function traceRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
  ctx.beginPath();
  if (rr <= 0.5) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function drawArch(ctx, x0, baseY, w, h) {
  const r = w * 0.5;
  ctx.beginPath();
  ctx.moveTo(x0, baseY);
  ctx.lineTo(x0, baseY - (h - r));
  ctx.arc(x0 + r, baseY - (h - r), r, Math.PI, 0, false);
  ctx.lineTo(x0 + w, baseY);
  ctx.closePath();
}

// 从锐利 90° 几何方块（blend=0）平滑变形为原海报有机墨团（blend=1）
function drawMorphBlob(ctx, cx, cy, s, blend, color) {
  const u = clamp(blend, 0, 1);
  // blend=0 时四条边完全平直、四角严格 90°（每个拐角控制点紧贴顶点，绝不提前发圆）
  const rectPts = [
    [-0.64, -0.66],
    [0.64, -0.66, 0.64, -0.66, 0.64, -0.66],
    [0.64, 0.66, 0.64, 0.66, 0.64, 0.66],
    [0.0, 0.66, -0.64, 0.66, -0.64, 0.66],
    [-0.64, 0.66, -0.64, 0.18, -0.64, 0.18],
  ];
  const blobPts = [
    [-0.08, -0.82],
    [0.28, -0.92, 0.45, -0.45, 0.78, -0.30],
    [1.08, -0.15, 0.96, 0.42, 0.52, 0.46],
    [0.18, 0.49, 0.08, 0.86, -0.32, 0.88],
    [-0.76, 0.90, -0.94, 0.46, -0.76, 0.14],
  ];
  const closeRect = [-0.64, -0.22, -0.64, -0.66, -0.64, -0.66];
  const closeBlob = [-0.58, -0.18, -0.44, -0.72, -0.08, -0.82];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(lerp(rectPts[0][0], blobPts[0][0], u), lerp(rectPts[0][1], blobPts[0][1], u));
  for (let i = 1; i < rectPts.length; i++) {
    const a = rectPts[i];
    const b = blobPts[i];
    ctx.bezierCurveTo(
      lerp(a[0], b[0], u),
      lerp(a[1], b[1], u),
      lerp(a[2], b[2], u),
      lerp(a[3], b[3], u),
      lerp(a[4], b[4], u),
      lerp(a[5], b[5], u)
    );
  }
  ctx.bezierCurveTo(
    lerp(closeRect[0], closeBlob[0], u),
    lerp(closeRect[1], closeBlob[1], u),
    lerp(closeRect[2], closeBlob[2], u),
    lerp(closeRect[3], closeBlob[3], u),
    lerp(closeRect[4], closeBlob[4], u),
    lerp(closeRect[5], closeBlob[5], u)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawMorphWave(ctx, x0, y0, len, maxAmp, blend, color, lw) {
  const amp = maxAmp * clamp(blend, 0, 1);
  ctx.save();
  ctx.beginPath();
  const segs = 32;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const x = x0 + u * len;
    const y = y0 - Math.sin(u * Math.PI * 3.0) * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

export function initHeroBench() {
  const stageEl = document.getElementById("bench-stage");
  const canvas = document.getElementById("bench-canvas");
  if (!stageEl || !canvas) return null;

  const ctx = canvas.getContext("2d");

  const handleEls = Object.fromEntries(
    MODES.map((m) => [m.id, document.getElementById(`handle-${m.id}`)])
  );
  const modeButtons = [...document.querySelectorAll("[data-bench-mode]")];
  const elProgressBadge = document.getElementById("bench-progress");
  const elMonoBtn = document.getElementById("bench-mono");
  const elPosterRefBtn = document.getElementById("bench-poster-ref");
  const elFootnote = document.getElementById("hero-footnote");

  const elActiveNo = document.getElementById("ro-active-no");
  const elActiveName = document.getElementById("ro-active-name");
  const elM1Label = document.getElementById("ro-m1-label");
  const elM1Val = document.getElementById("ro-m1-val");
  const elM1Sub = document.getElementById("ro-m1-sub");
  const elM2Label = document.getElementById("ro-m2-label");
  const elM2Val = document.getElementById("ro-m2-val");
  const elM2Sub = document.getElementById("ro-m2-sub");
  const elFirstTag = document.getElementById("ro-first-tag");
  const elHint = document.getElementById("ro-handle-hint");
  const elVerdict = document.getElementById("ro-verdict");
  const elDetail = document.getElementById("ro-detail");

  const state = {
    activeId: "round-square",
    params: createInitialParams(),
    display: createInitialParams(),
    mono: false,
    unlocked: false, // 4/4 全部成立后才解锁纯黑白验证与 0 键参考态
    intro: 0.45,
    draggingId: null,
  };

  let cw = 980;
  let ch = 480;
  const geomMap = {
    "round-square": { sidePx: 130 },
    "sharp-blunt": { sidePx: 120 },
    "solid-hollow": { sidePx: 118 },
    "regular-free": { stepPx: 26, dotR: 3.4, boxPx: 104 },
  };
  const dragMap = {};

  function computeCells() {
    // 窄竖屏（手机 390×844）用忠实原海报的 1×4 竖叠；桌面/平板/横屏用 2×2 四格画板
    const isStack = cw < 480;
    const cols = isStack ? 1 : 2;
    const rows = isStack ? 4 : 2;
    const cellW = cw / cols;
    const cellH = ch / rows;
    const cells = {};
    MODES.forEach((m, idx) => {
      const c = isStack ? 0 : idx % 2;
      const r = isStack ? idx : Math.floor(idx / 2);
      cells[m.id] = { x: c * cellW, y: r * cellH, w: cellW, h: cellH };
    });
    return { isStack, cols, rows, cellW, cellH, cells };
  }

  function resize() {
    const r = stageEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    cw = r.width;
    ch = r.height;
    const dpr = pixelRatio(2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function syncReadout() {
    const board = evaluateBoard(state.params, geomMap, state.mono);
    if (board.allPassed && !state.unlocked) {
      state.unlocked = true;
    }

    // 顶栏实时显示「这幅版面成立几组对话 n/4」
    if (elProgressBadge) {
      if (board.allPassed) {
        elProgressBadge.innerHTML = `<span class="bp-label">这幅版面成立</span><strong class="bp-count" lang="en">4/4</strong><span class="bp-state">全部通过 · 可抽黑白验证</span>`;
        elProgressBadge.dataset.done = "1";
      } else {
        elProgressBadge.innerHTML = `<span class="bp-label">这幅版面成立</span><strong class="bp-count" lang="en">${board.passedCount}/4</strong><span class="bp-state">组对话</span>`;
        elProgressBadge.dataset.done = "0";
      }
    }

    // 4/4 解锁后显示纯黑白验证与海报原态对照按钮（解开前隐藏，绝不剧透也不与 101 撞主玩法）
    if (elMonoBtn) {
      elMonoBtn.hidden = !state.unlocked;
      elMonoBtn.setAttribute("aria-pressed", state.mono ? "true" : "false");
      elMonoBtn.classList.toggle("is-active", state.mono);
    }
    if (elPosterRefBtn) {
      elPosterRefBtn.hidden = !state.unlocked;
    }
    if (elFootnote) {
      elFootnote.innerHTML = state.unlocked
        ? `四组对话已全部解开！现可点击上方「抽成纯黑白验证」或按 <kbd>M</kbd> 抽离色彩复检，按 <kbd>0</kbd> 对照原海报参考比例；聚焦任一节点可用方向键微调。`
        : `直接拖动四组图形上的朱橙节点，或点击四组切换聚焦；聚焦节点后可用 <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> 微调。四组全部成立（4/4）后解锁纯黑白验证。`;
    }

    // 左栏圆徽目录同步每组「已成立 / 待调」状态与聚焦高亮
    modeButtons.forEach((b) => {
      const id = b.dataset.benchMode;
      const res = board.results[id];
      const active = id === state.activeId;
      b.setAttribute("aria-pressed", active ? "true" : "false");
      b.classList.toggle("is-active", active);
      b.classList.toggle("is-passed", !!res?.passed);
      const pill = b.querySelector(".spec-status");
      if (pill && res) {
        pill.textContent = res.passed ? "✓ 成立" : "待调";
      }
    });

    // 读数槽展示当前聚焦组的真实几何量与「为什么」后果
    const mode = MODE_MAP[state.activeId];
    const info = board.results[state.activeId];
    if (elActiveNo) elActiveNo.textContent = mode.index;
    if (elActiveName) elActiveName.textContent = `${mode.zh} · ${info.passed ? "已成立" : "未成立"}`;
    if (elM1Label) elM1Label.textContent = info.m1Label;
    if (elM1Val) elM1Val.textContent = info.m1Val;
    if (elM1Sub) elM1Sub.textContent = info.m1Sub;
    if (elM2Label) elM2Label.textContent = info.m2Label;
    if (elM2Val) elM2Val.textContent = info.m2Val;
    if (elM2Sub) elM2Sub.textContent = info.m2Sub;
    if (elFirstTag) {
      elFirstTag.textContent = info.passed ? `✓ 成立 · ${info.firstTag}` : `待修 · ${info.firstTag}`;
      elFirstTag.dataset.level = info.level;
    }
    if (elHint) elHint.textContent = mode.handleHint;
    if (elVerdict) elVerdict.textContent = info.verdict;
    if (elDetail) elDetail.textContent = info.detail;

    // 同步四枚原生手柄无障碍值与高亮状态
    for (const m of MODES) {
      const el = handleEls[m.id];
      const res = board.results[m.id];
      if (!el || !res) continue;
      el.classList.toggle("is-active", m.id === state.activeId);
      el.classList.toggle("is-passed", res.passed);
      el.setAttribute("aria-valuenow", String(Math.round(state.params[m.id] * 100)));
      el.setAttribute("aria-valuetext", `${m.zh}：${res.m1Val}，${res.passed ? "已成立" : res.firstTag}`);
    }
  }

  function updateHandlePositions() {
    for (const m of MODES) {
      const el = handleEls[m.id];
      const dm = dragMap[m.id];
      if (!el || !dm) continue;
      el.style.transform = `translate(${dm.handleX.toFixed(1)}px, ${dm.handleY.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }

  function drawCellChrome(cell, mode, info, isActive, compact) {
    const { x, y, w, h } = cell;
    const hdrH = compact ? 20 : 26;
    const botH = compact ? 16 : 21;
    const padX = compact ? 9 : 14;

    // 单元纸底（聚焦格提亮暖白，未聚焦为暖米纸）
    ctx.save();
    ctx.fillStyle = isActive ? WHITE : PAPER;
    ctx.fillRect(x, y, w, h);

    // 聚焦格顶沿细蓝条（已成立为群青蓝，待修为朱橙）
    if (isActive) {
      ctx.fillStyle = info.passed ? BLUE : ORANGE;
      ctx.fillRect(x, y, w, 3);
    }

    // 单元顶标：编号 + 组名 + 状态徽标
    const titleY = y + hdrH * 0.56;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `700 ${compact ? 11.5 : 13}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = info.passed ? BLUE : INK;
    ctx.fillText(`${mode.index} ${mode.zh}`, x + padX, titleY);

    // 右上状态徽标（实时数值 + 成立与否）
    const badgeText = info.passed ? `✓ ${info.shortMetric}` : info.shortBadge;
    ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    const bw = ctx.measureText(badgeText).width + (compact ? 10 : 14);
    const bh = compact ? 16 : 19;
    const bx = x + w - padX - bw;
    const by = titleY - bh * 0.5;
    ctx.fillStyle = info.passed ? BLUE : SAND;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = info.passed ? BLUE : ORANGE_INK;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = info.passed ? WHITE : ORANGE_INK;
    ctx.textAlign = "center";
    ctx.fillText(badgeText, bx + bw * 0.5, titleY + 0.5);

    // 单元底标：随状态实时更新的左右图形称呼（绝不静态写死「黑直角方」）
    const labelY = y + h - botH * 0.52;
    ctx.font = `700 ${compact ? 10.5 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText(info.leftLabel, x + padX, labelY);
    ctx.textAlign = "right";
    ctx.fillText(info.rightLabel, x + w - padX, labelY);

    ctx.restore();

    const bodyTop = y + hdrH + 4;
    const bodyBot = y + h - botH - 4;
    return {
      padX,
      bodyTop,
      bodyBot,
      usableW: w - padX * 2,
      usableH: Math.max(54, bodyBot - bodyTop),
      midY: (bodyTop + bodyBot) * 0.5,
      midX: x + w * 0.5,
    };
  }

  function drawScene(_tSec, dt, { still }) {
    if (!cw || !ch) resize();

    if (still) {
      state.intro = 1;
      for (const m of MODES) state.display[m.id] = state.params[m.id];
    } else {
      state.intro = Math.min(1, state.intro + (dt > 0 ? dt * 2.2 : 0.1));
      for (const m of MODES) {
        if (state.draggingId === m.id) {
          state.display[m.id] = state.params[m.id];
        } else {
          const diff = state.params[m.id] - state.display[m.id];
          if (Math.abs(diff) < 0.001) state.display[m.id] = state.params[m.id];
          else state.display[m.id] += diff * Math.min(1, 0.28 * (dt ? dt * 60 : 1));
        }
      }
    }

    const easeIntro = 1 - Math.pow(1 - state.intro, 3);
    const slide = (1 - easeIntro) * 6;
    const blueCol = state.mono ? INK : BLUE;
    const orangeCol = state.mono ? INK : ORANGE;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, cw, ch);

    const grid = computeCells();
    const compact = grid.cellH < 175 || grid.cellW < 300;
    const board = evaluateBoard(state.display, geomMap, state.mono);

    // ================= 01 · 圆与方（斜向拖方块左上角） =================
    {
      const id = "round-square";
      const cell = grid.cells[id];
      const t = state.display[id];
      const info = board.results[id];
      const box = drawCellChrome(cell, MODE_MAP[id], info, state.activeId === id, compact);

      const gap = Math.max(14, box.usableW * (grid.isStack ? 0.12 : 0.09));
      const sideByW = (box.usableW * (grid.isStack ? 0.72 : 0.84) - gap) / 2.128;
      const sideByH = box.usableH * 0.80;
      const side = Math.max(46, Math.min(sideByW, sideByH, 230));
      const circleR = side / Math.sqrt(Math.PI);
      geomMap[id] = { sidePx: side };

      const totalW = circleR * 2 + gap + side;
      const startX = cell.x + (cell.w - totalW) * 0.5;
      const leftCx = startX + circleR - slide;
      const rightCx = startX + circleR * 2 + gap + side * 0.5 + slide;
      const sqLeft = rightCx - side * 0.5;
      const sqTop = box.midY - side * 0.5;
      const rPx = t * side * 0.5;

      // 原海报蓝虚弧
      ctx.save();
      ctx.strokeStyle = blueCol;
      ctx.globalAlpha = 0.82 - t * 0.42;
      ctx.lineWidth = compact ? 1.2 : 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(leftCx, box.midY - circleR - 3);
      ctx.quadraticCurveTo(box.midX, Math.max(box.bodyTop + 2, sqTop - (1 - t * 0.5) * (compact ? 12 : 20)), rightCx, sqTop - 3);
      ctx.stroke();
      ctx.restore();

      // 左侧蓝正圆
      ctx.save();
      ctx.fillStyle = blueCol;
      ctx.beginPath();
      ctx.arc(leftCx, box.midY, circleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 右侧原始直角虚线框（削角时可见面积变化）
      if (rPx > 2) {
        ctx.save();
        ctx.strokeStyle = "rgba(19, 21, 23, 0.34)";
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(sqLeft, sqTop, side, side);
        ctx.restore();
      }

      // 右侧黑方（真实圆角 rPx）
      ctx.save();
      ctx.fillStyle = INK;
      traceRoundedRect(ctx, sqLeft, sqTop, side, side, rPx);
      ctx.fill();
      ctx.restore();

      // 45° 斜向圆角手柄导轨（从直角顶角斜向内）
      const trackSpan = side * 0.44;
      const hx0 = sqLeft;
      const hy0 = sqTop;
      const hx1 = sqLeft + trackSpan;
      const hy1 = sqTop + trackSpan;
      const hx = lerp(hx0, hx1, t);
      const hy = lerp(hy0, hy1, t);

      ctx.save();
      ctx.strokeStyle = orangeCol;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx0, hy0);
      ctx.lineTo(hx1, hy1);
      ctx.stroke();
      ctx.setLineDash([]);
      if (rPx > 4) {
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sqLeft + rPx, sqTop);
        ctx.lineTo(sqLeft + rPx, sqTop + rPx);
        ctx.lineTo(sqLeft, sqTop + rPx);
        ctx.stroke();
      }
      ctx.fillStyle = orangeCol;
      ctx.beginPath();
      ctx.arc(box.midX, box.midY + circleR * 0.82, compact ? 3.4 : 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      dragMap[id] = { x0: hx0, y0: hy0, x1: hx1, y1: hy1, handleX: hx, handleY: hy, cell };
    }

    // ================= 02 · 尖与钝（竖向拔高三角顶角） =================
    {
      const id = "sharp-blunt";
      const cell = grid.cells[id];
      const t = state.display[id];
      const u = 1 - t; // 0 = 锐峰, 1 = 钝坡
      const info = board.results[id];
      const box = drawCellChrome(cell, MODE_MAP[id], info, state.activeId === id, compact);

      const gap = Math.max(14, box.usableW * (grid.isStack ? 0.12 : 0.085));
      const wByW = (box.usableW * (grid.isStack ? 0.70 : 0.80) - gap) / 2.04;
      const wByH = (box.usableH * 0.90) / 1.32;
      const w = Math.max(42, Math.min(wByW, wByH, 210));
      const aW = w * 1.04;
      const aH = aW;
      geomMap[id] = { sidePx: w };

      const totalW = w + gap + aW;
      const leftX0 = cell.x + (cell.w - totalW) * 0.5 - slide;
      const rightX0 = leftX0 + w + gap + slide * 2;
      const baseY = box.bodyBot - 2;

      // t=0 低平钝坡 -> t=1 原海报 37° 锐峰
      const ax0 = leftX0 + 0.5 * w;
      const ay0 = baseY - 0.28 * w;
      const ax1 = leftX0;
      const ay1 = baseY - 1.32 * w;
      const apexX = lerp(ax0, ax1, t);
      const apexY = lerp(ay0, ay1, t);

      // 左侧黑三角
      ctx.save();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(leftX0, baseY);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(leftX0 + w, baseY);
      ctx.closePath();
      ctx.fill();

      // 内侧白色量角弧 + 竖斜导轨
      const angA = Math.atan2(baseY - apexY, leftX0 - apexX);
      const angB = Math.atan2(baseY - apexY, leftX0 + w - apexX);
      const arcR = Math.min(24, Math.hypot(leftX0 - apexX, baseY - apexY) * 0.42);
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(apexX, apexY, arcR, angB, angA, false);
      ctx.stroke();

      ctx.strokeStyle = orangeCol;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ax0, ay0);
      ctx.lineTo(ax1, ay1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 右侧蓝圆顶拱门
      ctx.save();
      ctx.fillStyle = blueCol;
      drawArch(ctx, rightX0, baseY, aW, aH);
      ctx.fill();

      // 原海报朱橙斜切虚线与小圆点
      ctx.strokeStyle = orangeCol;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(apexX + 10, apexY);
      ctx.lineTo((leftX0 + w + rightX0) * 0.5, baseY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = orangeCol;
      ctx.beginPath();
      ctx.arc((leftX0 + w + rightX0) * 0.5, Math.max(box.bodyTop + 5, baseY - aH + 2), compact ? 3.2 : 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 保持与未使用的 u 对齐检查
      void u;
      dragMap[id] = { x0: ax0, y0: ay0, x1: ax1, y1: ay1, handleX: apexX, handleY: apexY, cell };
    }

    // ================= 03 · 实与空（中段甜区壁厚 + 无假度数天平示意） =================
    {
      const id = "solid-hollow";
      const cell = grid.cells[id];
      const t = state.display[id];
      const info = board.results[id];
      const box = drawCellChrome(cell, MODE_MAP[id], info, state.activeId === id, compact);

      const sBox = Math.max(40, Math.min(box.usableW * (grid.isStack ? 0.28 : 0.31), box.usableH * 0.64, 188));
      geomMap[id] = { sidePx: sBox };

      const fulcrumX = box.midX;
      const triS = compact ? 7.5 : 10.5;
      const halfSpan = Math.min(box.usableW * 0.41, sBox * 1.18 + (compact ? 10 : 22));
      const rad = info.visualTiltRad;
      // 为天平最大倾角预留底部净空，确保梁端永远不压到左下/右下动态标签
      const maxTiltDrop = Math.sin(0.16) * (halfSpan + 6);
      const beamY = box.bodyBot - Math.max(triS + 4, maxTiltDrop + 3);

      // 朱橙三角支点
      ctx.save();
      ctx.fillStyle = orangeCol;
      ctx.beginPath();
      ctx.moveTo(fulcrumX, beamY + 2);
      ctx.lineTo(fulcrumX - triS * 0.72, beamY + 2 + triS);
      ctx.lineTo(fulcrumX + triS * 0.72, beamY + 2 + triS);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const lxLocal = -halfSpan * 0.58 - slide * 0.3;
      const lyLocal = -sBox * 0.5 - 2;
      const rxLocal = halfSpan * 0.58 + slide * 0.3;
      const rCirc = sBox * 0.5;
      const wallPx = sBox * info.wallFrac;
      const innerSide = Math.max(0, sBox - wallPx * 2);
      const innerRightLocalX = lxLocal + innerSide * 0.5;

      ctx.save();
      ctx.translate(fulcrumX, beamY);
      ctx.rotate(rad);

      // 虚线天平梁
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.62;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(-halfSpan - 6, 0);
      ctx.lineTo(halfSpan + 6, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 左侧群青空心框
      ctx.fillStyle = blueCol;
      ctx.fillRect(lxLocal - sBox * 0.5, lyLocal - sBox * 0.5, sBox, sBox);
      if (innerSide > 1.2) {
        ctx.fillStyle = state.activeId === id ? WHITE : PAPER;
        ctx.fillRect(lxLocal - innerSide * 0.5, lyLocal - innerSide * 0.5, innerSide, innerSide);
      }

      // 壁厚水平标尺线
      ctx.strokeStyle = orangeCol;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lxLocal, lyLocal);
      ctx.lineTo(lxLocal + sBox * 0.5, lyLocal);
      ctx.stroke();

      // 右侧碳墨实心圆
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(rxLocal, -rCirc - 2, rCirc, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const toWorld = (px, py) => ({
        x: fulcrumX + px * Math.cos(rad) - py * Math.sin(rad),
        y: beamY + px * Math.sin(rad) + py * Math.cos(rad),
      });
      const pThin = toWorld(lxLocal + sBox * 0.47, lyLocal);
      const pSolid = toWorld(lxLocal, lyLocal);
      const pCur = toWorld(innerRightLocalX, lyLocal);

      dragMap[id] = { x0: pThin.x, y0: pThin.y, x1: pSolid.x, y1: pSolid.y, handleX: pCur.x, handleY: pCur.y, cell };
    }

    // ================= 04 · 规则与自由（中段甜区：太刻板或冲散左阵皆错） =================
    {
      const id = "regular-free";
      const cell = grid.cells[id];
      const t = state.display[id];
      const info = board.results[id];
      const box = drawCellChrome(cell, MODE_MAP[id], info, state.activeId === id, compact);

      const topTrackPad = compact ? 16 : 24;
      const shapeUsableH = Math.max(44, box.usableH - topTrackPad - (compact ? 7 : 10));
      const s = Math.max(42, Math.min(box.usableW * (grid.isStack ? 0.28 : 0.33), shapeUsableH * 0.92, 190));
      const step = s / 4;
      const dotR = Math.max(2.2, Math.min(4.4, s * 0.036));
      geomMap[id] = { stepPx: step, dotR, boxPx: s };

      const maxScatter = Math.max(16, Math.round(step * 0.95));
      const scatterPx = info.gridBreak * maxScatter;
      const uOrg = info.organicBlend;

      const gap = Math.max(18, box.usableW * (grid.isStack ? 0.14 : 0.11));
      const totalW = s * 2 + gap;
      const gx0 = cell.x + (cell.w - totalW) * 0.5 - slide;
      const gy0 = box.bodyTop + topTrackPad + (shapeUsableH - s) * 0.5;
      const lineY = gy0 + s + (compact ? 6 : 9);

      // 底部穿蓝圆黑线（原海报同款）
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cell.x + box.padX, lineY);
      ctx.lineTo(cell.x + cell.w - box.padX, lineY);
      ctx.stroke();
      ctx.fillStyle = blueCol;
      ctx.beginPath();
      ctx.arc(box.midX, lineY, compact ? 3.5 : 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 点阵被冲散时，在原始网格交点绘淡灰十字参照
      if (scatterPx > 1.2) {
        ctx.save();
        ctx.strokeStyle = "rgba(19, 21, 23, 0.24)";
        ctx.lineWidth = 1;
        for (const p of GRID_DRIFT) {
          const ox = gx0 + p.col * step;
          const oy = gy0 + p.row * step;
          ctx.beginPath();
          ctx.moveTo(ox - 2.5, oy);
          ctx.lineTo(ox + 2.5, oy);
          ctx.moveTo(ox, oy - 2.5);
          ctx.lineTo(ox, oy + 2.5);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 左侧 5×5 蓝点阵
      ctx.save();
      ctx.fillStyle = blueCol;
      for (const p of GRID_DRIFT) {
        const px = gx0 + p.col * step + p.ux * scatterPx;
        const py = gy0 + p.row * step + p.uy * scatterPx;
        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 右侧有机自由群（uOrg=0 刻板方正对齐，uOrg=1 原海报自由灵动，t>0.72 外扩溢出）
      const rcx = gx0 + s + gap + s * 0.5 + slide;
      const rcy = gy0 + s * 0.46;
      const spill = info.gridBreak * s * 0.12;

      // 主墨块：方块 → 有机墨团
      drawMorphBlob(ctx, rcx - s * lerp(0.18, 0.14, uOrg) - spill * 0.3, rcy - s * lerp(0.14, 0.12, uOrg), s * 0.34, uOrg, INK);

      // 右上小黑圆（刻板态时归位成对齐小方）
      ctx.save();
      ctx.fillStyle = INK;
      const smX = rcx + s * lerp(0.24, 0.34, uOrg) + spill * 0.4;
      const smY = rcy - s * lerp(0.28, 0.34, uOrg);
      const smR = s * 0.10;
      traceRoundedRect(ctx, smX - smR, smY - smR, smR * 2, smR * 2, smR * uOrg);
      ctx.fill();

      // 朱橙小点
      ctx.fillStyle = orangeCol;
      const odX = rcx + s * lerp(0.24, 0.52, uOrg) + spill * 0.5;
      const odY = rcy - s * lerp(0.02, 0.06, uOrg);
      const odR = s * 0.062;
      traceRoundedRect(ctx, odX - odR, odY - odR, odR * 2, odR * 2, odR * uOrg);
      ctx.fill();

      // 小方块：0° 直立 → 30° 倾斜
      ctx.translate(rcx + s * lerp(0.24, 0.27, uOrg), rcy + s * lerp(0.24, 0.22, uOrg));
      ctx.rotate(uOrg * 0.52 + info.gridBreak * 0.35);
      const sqs = s * 0.22;
      ctx.fillStyle = INK;
      ctx.fillRect(-sqs * 0.5, -sqs * 0.5, sqs, sqs);
      ctx.restore();

      // 下方波浪线：僵直横杠 → 自由曲线
      drawMorphWave(ctx, rcx - s * 0.46, rcy + s * 0.42, s * 0.62, s * 0.072, uOrg, INK, compact ? 2.6 : 3.6);

      // 自由度水平导轨（清爽置顶于右群上方留白带，绝不遮盖黑色墨块）
      const trackX0 = rcx - s * 0.48;
      const trackX1 = rcx + s * 0.52;
      const trackY = box.bodyTop + (compact ? 8 : 12);
      const hx = lerp(trackX0, trackX1, t);

      ctx.save();
      ctx.strokeStyle = orangeCol;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(trackX0, trackY);
      ctx.lineTo(trackX1, trackY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      dragMap[id] = { x0: trackX0, y0: trackY, x1: trackX1, y1: trackY, handleX: hx, handleY: trackY, cell };
    }

    // 四格细制图分隔线
    ctx.save();
    ctx.strokeStyle = "rgba(19, 21, 23, 0.32)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (grid.isStack) {
      for (let r = 1; r < 4; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * grid.cellH);
        ctx.lineTo(cw, r * grid.cellH);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(grid.cellW, 0);
      ctx.lineTo(grid.cellW, ch);
      ctx.moveTo(0, grid.cellH);
      ctx.lineTo(cw, grid.cellH);
      ctx.stroke();
    }
    ctx.restore();

    updateHandlePositions();
  }

  let runner = null;

  function setModeParam(modeId, rawT, snap = false) {
    if (!MODE_MAP[modeId]) return;
    const val = snap ? snapParam(modeId, rawT) : clamp(rawT, 0, 1);
    state.activeId = modeId;
    state.params[modeId] = val;
    if (state.draggingId === modeId) state.display[modeId] = val;
    syncReadout();
    runner?.draw();
  }

  function focusMode(modeId) {
    if (!MODE_MAP[modeId]) return;
    state.activeId = modeId;
    syncReadout();
    runner?.draw();
  }

  function applyPosterReference() {
    if (!state.unlocked) return;
    const ref = createPosterParams();
    for (const m of MODES) {
      state.params[m.id] = ref[m.id];
      state.display[m.id] = ref[m.id];
    }
    syncReadout();
    runner?.draw();
  }

  function toggleMono() {
    if (!state.unlocked) return;
    state.mono = !state.mono;
    syncReadout();
    runner?.draw();
  }

  function clientPointToT(modeId, clientX, clientY) {
    const dm = dragMap[modeId];
    if (!dm) return state.params[modeId];
    const r = stageEl.getBoundingClientRect();
    const lx = clientX - r.left;
    const ly = clientY - r.top;
    const vx = dm.x1 - dm.x0;
    const vy = dm.y1 - dm.y0;
    const lenSq = vx * vx + vy * vy;
    if (lenSq < 1) return state.params[modeId];
    const proj = ((lx - dm.x0) * vx + (ly - dm.y0) * vy) / lenSq;
    return clamp(proj, 0, 1);
  }

  function hitTestCell(clientX, clientY) {
    const r = stageEl.getBoundingClientRect();
    const lx = clientX - r.left;
    const ly = clientY - r.top;
    for (const m of MODES) {
      const dm = dragMap[m.id];
      if (!dm) continue;
      const c = dm.cell;
      if (lx >= c.x && lx <= c.x + c.w && ly >= c.y && ly <= c.y + c.h) return m.id;
    }
    return state.activeId;
  }

  // 绑定四枚原生手柄的鼠标、触屏与键盘交互
  let activePointerId = null;
  let touchDragMode = null;

  for (const m of MODES) {
    const el = handleEls[m.id];
    if (!el) continue;

    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      activePointerId = e.pointerId;
      state.draggingId = m.id;
      state.activeId = m.id;
      el.classList.add("is-dragging");
      el.setPointerCapture?.(e.pointerId);
      setModeParam(m.id, clientPointToT(m.id, e.clientX, e.clientY), false);
      e.preventDefault();
    });

    el.addEventListener("pointermove", (e) => {
      if (state.draggingId !== m.id || e.pointerId !== activePointerId) return;
      setModeParam(m.id, clientPointToT(m.id, e.clientX, e.clientY), false);
    });

    const endPtr = (e) => {
      if (state.draggingId !== m.id || (activePointerId !== null && e.pointerId !== activePointerId)) return;
      state.draggingId = null;
      activePointerId = null;
      el.classList.remove("is-dragging");
      setModeParam(m.id, state.params[m.id], true);
    };
    el.addEventListener("pointerup", endPtr);
    el.addEventListener("pointercancel", endPtr);

    el.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches.length) return;
        touchDragMode = m.id;
        state.draggingId = m.id;
        state.activeId = m.id;
        el.classList.add("is-dragging");
        const pt = e.touches[0];
        setModeParam(m.id, clientPointToT(m.id, pt.clientX, pt.clientY), false);
        e.preventDefault();
      },
      { passive: false }
    );

    el.addEventListener("focus", () => {
      if (state.activeId !== m.id) focusMode(m.id);
    });

    el.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.16 : 0.06;
      const invertX = m.id === "solid-hollow" || m.id === "sharp-blunt";
      const invertY = m.id === "sharp-blunt";
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setModeParam(m.id, state.params[m.id] + (invertX ? -step : step), false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setModeParam(m.id, state.params[m.id] + (invertX ? step : -step), false);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setModeParam(m.id, state.params[m.id] + (invertY ? step : -step), false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setModeParam(m.id, state.params[m.id] + (invertY ? -step : step), false);
      } else if (e.key === "0" && state.unlocked) {
        e.preventDefault();
        applyPosterReference();
      } else if ((e.key === "m" || e.key === "M") && state.unlocked) {
        e.preventDefault();
        toggleMono();
      }
    });
  }

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDragMode || !e.touches.length) return;
      const pt = e.touches[0];
      setModeParam(touchDragMode, clientPointToT(touchDragMode, pt.clientX, pt.clientY), false);
      e.preventDefault();
    },
    { passive: false }
  );
  const endTouch = () => {
    if (!touchDragMode) return;
    const id = touchDragMode;
    touchDragMode = null;
    state.draggingId = null;
    handleEls[id]?.classList.remove("is-dragging");
    setModeParam(id, state.params[id], true);
  };
  window.addEventListener("touchend", endTouch);
  window.addEventListener("touchcancel", endTouch);

  // 桌面点击任意一格即可直接拉动该格参数（触屏仅切聚焦，保证竖向滚动）
  stageEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".sculpt-handle")) return;
    const hitId = hitTestCell(e.clientX, e.clientY);
    if (e.pointerType === "touch") {
      focusMode(hitId);
      return;
    }
    activePointerId = e.pointerId;
    state.draggingId = hitId;
    state.activeId = hitId;
    stageEl.setPointerCapture?.(e.pointerId);
    setModeParam(hitId, clientPointToT(hitId, e.clientX, e.clientY), false);
  });
  stageEl.addEventListener("pointermove", (e) => {
    if (!state.draggingId || e.pointerId !== activePointerId) return;
    if (e.target.closest(".sculpt-handle")) return;
    setModeParam(state.draggingId, clientPointToT(state.draggingId, e.clientX, e.clientY), false);
  });
  const endStagePtr = (e) => {
    if (!state.draggingId || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    const id = state.draggingId;
    state.draggingId = null;
    activePointerId = null;
    setModeParam(id, state.params[id], true);
  };
  stageEl.addEventListener("pointerup", endStagePtr);
  stageEl.addEventListener("pointercancel", endStagePtr);

  modeButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.benchMode;
      focusMode(id);
    })
  );
  elMonoBtn?.addEventListener("click", toggleMono);
  elPosterRefBtn?.addEventListener("click", applyPosterReference);

  resize();
  new ResizeObserver(() => {
    resize();
    runner?.draw();
    syncReadout();
  }).observe(stageEl);

  runner = loop(stageEl, drawScene);
  runner.draw();
  syncReadout();

  return { state, focusMode, setModeParam, applyPosterReference, toggleMono };
}
