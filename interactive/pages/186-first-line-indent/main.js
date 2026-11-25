import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  MAX_QUADS,
  INITIAL_QUADS,
  GALLEY_PARAGRAPHS,
  ERAS,
  LANG_SPECS,
  SCENARIOS,
  QUIZ_ITEMS,
  layoutGalley,
  diffDroppedChars,
  diagnoseGalley
} from "./model.js";

// ============================================================
// 1. 开场核心玩具：活字排字手盘（拖起原海报钴蓝全角铅空，放进任意段首）
// ============================================================
const state = {
  quads: [...INITIAL_QUADS],
  animIndents: [...INITIAL_QUADS],
  introT: reducedMotion.matches ? 1 : 0,
  introDone: reducedMotion.matches,
  drag: {
    active: false,
    size: 1,         // 1 或 2 字铅空
    fromPara: -1,    // -1 来自上方铅空字盘，0..3 来自已嵌段落
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    canvasX: 0,
    canvasY: 0,
    hoverPara: -1,
    stableBoxes: null
  },
  cascadePara: -1,
  cascadeChars: new Set(),
  cascadeTimer: 0,
  lastEvent: null,
  dirty: true
};

const heroWrap = document.getElementById("hero-stage-wrap");
const heroCanvas = document.getElementById("hero-canvas");
const ctx = heroCanvas.getContext("2d");
const btnQuad1 = document.getElementById("quad-1em");
const btnQuad2 = document.getElementById("quad-2em");
const btnGalleyClear = document.getElementById("btn-galley-clear");
const paraSlotBtns = [...document.querySelectorAll(".para-slot-btn")];

const elBadge = document.getElementById("diag-badge");
const elStatQuads = document.getElementById("stat-quads");
const elStatFused = document.getElementById("stat-fused");
const elStatLines = document.getElementById("stat-lines");
const elDiagTitle = document.getElementById("diag-title");
const elDiagBody = document.getElementById("diag-body");

let geom = {
  w: 640,
  h: 446,
  cols: 30,
  textLeft: 56,
  colW: 540,
  emW: 18,
  fontSize: 18,
  lineHeight: 30,
  padTop: 48,
  mainZoneW: 640,
  paraBoxes: [], // { top, bottom, firstLineY, quadRect: { x, y, w, h } | null }
  layout: null
};

let lastUiKey = "";
function syncHeroUI(layout) {
  const d = diagnoseGalley(state.quads, layout, state.lastEvent);
  const uiKey = `${d.badge}|${d.metrics.quadsStr}|${d.metrics.fusedStr}|${d.metrics.linesStr}|${d.headline}`;
  if (uiKey === lastUiKey) return;
  lastUiKey = uiKey;

  elBadge.textContent = d.badge;
  elBadge.dataset.tone = d.tone;
  elStatQuads.textContent = d.metrics.quadsStr;
  elStatFused.textContent = d.metrics.fusedStr;
  elStatFused.dataset.alert = String(d.metrics.fusedCount > 0);
  elStatFused.dataset.ok = String(d.metrics.fusedCount === 0);
  elStatLines.textContent = d.metrics.linesStr;
  elDiagTitle.textContent = d.headline;
  elDiagBody.textContent = d.body;

  paraSlotBtns.forEach((btn, idx) => {
    const q = state.quads[idx];
    btn.setAttribute(
      "aria-label",
      `第 ${idx + 1} 段段首铅空，当前 ${q} 字，点击或按右方向键加 1 字，左方向键减 1 字`
    );
  });
}

function setParaQuads(paraIdx, nextVal, { recordCascade = true } = {}) {
  const clamped = Math.max(0, Math.min(MAX_QUADS, Math.round(nextVal)));
  const prevVal = state.quads[paraIdx];
  if (clamped === prevVal) return false;

  const prevLayout = geom.layout;
  const prevLines = prevLayout ? prevLayout.paragraphs[paraIdx]?.lines : null;
  state.quads[paraIdx] = clamped;
  state.introDone = true;
  if (reducedMotion.matches) state.animIndents[paraIdx] = clamped;

  const nextLayout = layoutGalley(GALLEY_PARAGRAPHS, state.quads, geom.cols);
  const nextLines = nextLayout.paragraphs[paraIdx].lines;

  if (recordCascade && clamped > prevVal && prevLines) {
    const dropped = diffDroppedChars(prevLines, nextLines);
    state.cascadePara = paraIdx;
    state.cascadeChars = dropped;
    state.cascadeTimer = reducedMotion.matches ? 0 : 1.0;
    state.lastEvent = { para: paraIdx, delta: clamped - prevVal, droppedCount: dropped.size };
  } else {
    state.lastEvent = { para: paraIdx, delta: clamped - prevVal, droppedCount: 0 };
  }

  state.dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
  return true;
}

function measureAndResizeHero() {
  const rect = heroCanvas.getBoundingClientRect();
  const w = Math.max(280, Math.round(rect.width));
  const h = Math.max(210, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (heroCanvas.width !== Math.round(w * dpr) || heroCanvas.height !== Math.round(h * dpr)) {
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}

// 绘制右侧原海报同款「缩进示意」实时结构透视（1:1 映射各段实际铅空与断行；蓝虚线分段仅落缺口，绝不压线）
function drawPosterSchematic(ctx, box, layout, cols) {
  const { x, w, h } = box;
  ctx.save();
  ctx.fillStyle = "#faf3e6";
  ctx.fillRect(x, 0, w + 24, h + 24);

  // 原海报标志性垂直细黑分界线
  ctx.strokeStyle = "#191815";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 0.5, 16);
  ctx.lineTo(x + 0.5, h - 16);
  ctx.stroke();

  const innerX = x + 26;
  const innerW = Math.max(120, w - 42);
  const sqColW = 18;
  const barLeft = innerX + sqColW;
  const barMaxW = Math.max(96, innerW - sqColW);

  ctx.fillStyle = "#0d0e0b";
  ctx.font = `900 13px "Noto Serif SC", serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("缩进示意 · 实时结构", innerX, 24);

  ctx.fillStyle = "#565147";
  ctx.font = `400 11px "Noto Serif SC", serif`;
  ctx.fillText("1:1 同步各段铅空与满行边界", innerX, 42);

  // 顶部「▶ --- 缩进基准」标尺
  const refQuads = layout.paragraphs.find((p) => p.quads > 0)?.quads || 2;
  const refX = barLeft + (refQuads / cols) * barMaxW;
  const triY = 66;

  ctx.fillStyle = "#1c54f0";
  ctx.beginPath();
  ctx.moveTo(refX, triY - 4.5);
  ctx.lineTo(refX + 7.5, triY);
  ctx.lineTo(refX, triY + 4.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#1c54f0";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(refX + 9, triY);
  ctx.lineTo(refX + 28, triY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `600 11px "JetBrains Mono", "Noto Serif SC", monospace`;
  ctx.fillStyle = "#1c54f0";
  const topLabel = layout.totalQuads === 0 ? "目标 2字" : `当前 ${layout.paragraphs.map((p) => p.quads).join("·")}字`;
  const lw = ctx.measureText(topLabel).width;
  ctx.fillText(topLabel, Math.min(barLeft + barMaxW - lw, refX + 32), triY);

  const totalLines = layout.totalLines;
  const pCount = layout.paragraphs.length;
  const availH = h - 140;
  const unitLine = Math.min(24, Math.max(10, availH / Math.max(1, totalLines + Math.max(0, pCount - 1) * 0.45)));
  const paraGap = unitLine * 0.45;
  let cy = 92;

  layout.paragraphs.forEach((p, pIdx) => {
    const pTop = cy;
    const indW = (p.visualIndent / cols) * barMaxW;

    // 左侧原海报同款蓝色小方点（0 铅空描空心蓝框，放入铅空后实心）
    if (p.quads > 0) {
      ctx.fillStyle = "#1c54f0";
      ctx.fillRect(innerX, pTop - 3.5, 6.5, 6.5);
    } else {
      ctx.strokeStyle = "#1c54f0";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(innerX + 0.5, pTop - 3, 5.5, 5.5);
    }

    // 首行钴蓝铅空块 + 仅落首行缺口高度的蓝虚线（绝不穿过后续行横条）
    if (indW > 1) {
      ctx.fillStyle = "rgba(28, 84, 240, 0.24)";
      ctx.fillRect(barLeft, pTop - 4, Math.max(0, indW - 1.5), 8);

      ctx.strokeStyle = "#1c54f0";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(barLeft + indW - 0.5, pTop - 8);
      ctx.lineTo(barLeft + indW - 0.5, pTop + 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    p.lines.forEach((ln, lIdx) => {
      const lx = barLeft + ((lIdx === 0 ? p.visualIndent : 0) / cols) * barMaxW;
      const lwBar = Math.max(6, Math.min(barLeft + barMaxW - lx, (ln.charCount / cols) * barMaxW));
      ctx.fillStyle = lIdx === 0 ? "#191815" : "#6f6a60";
      ctx.fillRect(lx, cy - 1, lwBar, lIdx === 0 ? 2.4 : 1.7);
      cy += unitLine;
    });

    // 若此处存在真实满行粘连，在横条外侧右端标朱红竖扣（精准扣住本段末行与下段首行）
    if (layout.fusedPairs.includes(pIdx)) {
      const lastBarY = cy - unitLine;
      const nextBarY = cy + paraGap;
      ctx.strokeStyle = "#b63416";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(barLeft + barMaxW + 4, lastBarY);
      ctx.lineTo(barLeft + barMaxW + 8, lastBarY);
      ctx.lineTo(barLeft + barMaxW + 8, nextBarY);
      ctx.lineTo(barLeft + barMaxW + 4, nextBarY);
      ctx.stroke();
    }

    if (pIdx < pCount - 1) cy += paraGap;
  });

  // 底部图例
  ctx.fillStyle = "#1c54f0";
  ctx.fillRect(innerX, h - 38, 6, 6);
  ctx.fillStyle = "#565147";
  ctx.font = `400 11px "Noto Serif SC", serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("实心=已放铅空   ┆ 仅标首行缺口", innerX + 11, h - 35);

  ctx.fillStyle = layout.fusedCount > 0 ? "#b63416" : "#135e3b";
  ctx.font = `600 11px "JetBrains Mono", "Noto Serif SC", monospace`;
  ctx.textBaseline = "bottom";
  ctx.fillText(
    layout.fusedCount > 0 ? `右缘朱红扣 = ${layout.fusedCount} 处满行粘连` : `0 处满行粘连 · ${cols} 字/栏`,
    innerX,
    h - 12
  );
  ctx.restore();
}

function getPreviewQuads() {
  if (!state.drag.active || state.drag.hoverPara < 0) return state.quads;
  const p = state.drag.hoverPara;
  if (state.drag.fromPara === p) return state.quads;
  const copy = [...state.quads];
  if (state.drag.fromPara >= 0) {
    copy[state.drag.fromPara] = Math.max(0, copy[state.drag.fromPara] - state.drag.size);
  }
  copy[p] = Math.min(MAX_QUADS, copy[p] + state.drag.size);
  return copy;
}

function renderHero(t, dt, { still }) {
  // 开场 0.65 秒平稳显现书页，绝不自动填入答案（四段保持 0 铅空待排）
  if (!state.introDone) {
    if (still || t >= 0.65) {
      state.introT = 1;
      state.introDone = true;
    } else {
      state.introT = Math.max(0, Math.min(1, t / 0.65));
    }
    state.dirty = true;
  }

  // 平滑过渡每段铅空滑移
  const previewQuads = getPreviewQuads();
  for (let i = 0; i < state.animIndents.length; i++) {
    const target = previewQuads[i];
    if (Math.abs(state.animIndents[i] - target) > 0.008) {
      if (still) {
        state.animIndents[i] = target;
      } else {
        const k = Math.min(1, Math.max(0.18, dt * 18));
        state.animIndents[i] += (target - state.animIndents[i]) * k;
        if (Math.abs(state.animIndents[i] - target) <= 0.01) state.animIndents[i] = target;
      }
      state.dirty = true;
    }
  }

  // 行尾掉字高亮渐退
  if (state.cascadeTimer > 0) {
    if (still) {
      state.cascadeTimer = 0;
    } else {
      state.cascadeTimer = Math.max(0, state.cascadeTimer - dt * 1.15);
      state.dirty = true;
    }
  }

  if (!state.dirty) return;
  state.dirty = false;

  const { w, h, dpr } = measureAndResizeHero();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const showSchematic = w >= 860;
  const isNarrowScreen = w < 460;
  const isShortLandscape = h < 270;
  const mainZoneW = showSchematic ? Math.round(w * 0.68) : w;
  const cols = mainZoneW >= 540 ? 30 : 20;

  const leftGutter = isNarrowScreen ? 32 : 48;
  const rightGutter = isNarrowScreen ? 18 : 54;
  const availColW = Math.max(200, mainZoneW - leftGutter - rightGutter);
  const padTop = isShortLandscape ? 38 : isNarrowScreen ? 44 : 52;
  const padBottom = isShortLandscape ? 12 : 34;

  // 严格按整字格 cols 计算字号：每字宽度恰好 1.0 emW，确保 60 字自然排满 2 行（30字）或 3 行（20字）
  const maxFsByW = Math.floor((availColW / cols) * 10) / 10;
  const capFs = w >= 1350 ? 22 : isShortLandscape ? 13.8 : isNarrowScreen ? 15.6 : 19.5;
  let fontSize = Math.min(capFs, maxFsByW);

  const makeFont = (fs) => `400 ${fs}px "Noto Serif SC", serif`;
  // 预留最大总行数高度（全部 2 字时共 10~15 行），确保拖入铅空换行时始终完整落进画布不裁底
  const maxExpectedLines = cols === 30 ? 11 : 15;
  const lhRatio = isShortLandscape ? 1.44 : cols === 20 ? 1.56 : 1.68;
  while (maxExpectedLines * fontSize * lhRatio > h - padTop - padBottom && fontSize > 11.2) {
    fontSize -= 0.4;
  }
  fontSize = Math.floor(fontSize * 10) / 10;

  ctx.font = makeFont(fontSize);
  const emW = ctx.measureText("汉").width || fontSize;
  const colW = cols * emW;
  const lineHeight = fontSize * lhRatio;
  const textLeft = Math.max(leftGutter, Math.round((mainZoneW - colW - (isNarrowScreen ? 0 : 12)) * 0.5) + 6);

  const layout = layoutGalley(GALLEY_PARAGRAPHS, previewQuads, cols, state.animIndents);
  // 底部读数始终反映真实已落盘的 state.quads（预览仅作用在画布上，避免拖动悬停抖动读数）
  const committedLayout = state.drag.active && state.drag.hoverPara >= 0
    ? layoutGalley(GALLEY_PARAGRAPHS, state.quads, cols)
    : layout;

  // 1. 清纸底
  ctx.fillStyle = "#fffcf5";
  ctx.fillRect(0, 0, w, h);

  // 2. 顶部手盘字格标尺（远离文字，清晰标出 0..4 字位置与整栏字数）
  const rulerY = isShortLandscape ? 14 : 21;
  ctx.save();
  ctx.fillStyle = "#565147";
  ctx.font = `600 11px "JetBrains Mono", "Noto Serif SC", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(`活字手盘 · 每行 ${cols} 字`, textLeft - (isNarrowScreen ? 16 : 24), rulerY);

  // 右端提示当前满行粘连计数
  const statusTag = committedLayout.fusedCount > 0 ? `满行粘连 ${committedLayout.fusedCount} 处` : "满行粘连 0 处";
  const stW = ctx.measureText(statusTag).width;
  ctx.fillStyle = committedLayout.fusedCount > 0 ? "#b63416" : "#135e3b";
  ctx.fillText(statusTag, textLeft + colW - stW, rulerY);

  // 0..4 em 轻刻度（置于文字上方 padTop - 10，绝不碰字）
  const tickY = padTop - 10;
  ctx.strokeStyle = "#dcd3c1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textLeft, tickY);
  ctx.lineTo(textLeft + colW, tickY);
  ctx.stroke();

  for (let emTick = 0; emTick <= MAX_QUADS; emTick++) {
    const tx = textLeft + emTick * emW;
    ctx.fillStyle = emTick === 2 ? "#1c54f0" : "#9c9484";
    ctx.fillRect(tx - 0.5, tickY - (emTick === 2 ? 5 : 3), 1.5, emTick === 2 ? 6 : 4);
  }

  // 左缘 & 右缘版心参考线：严格放到文字外侧 6.5px，绝不压字！
  const leftRuleX = textLeft - 6.5;
  const rightRuleX = textLeft + colW + 6.5;
  const contentBottom = Math.min(h - 10, padTop + layout.totalLines * lineHeight + 4);
  ctx.strokeStyle = "#d8cebc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftRuleX, padTop - 4);
  ctx.lineTo(leftRuleX, contentBottom);
  ctx.moveTo(rightRuleX, padTop - 4);
  ctx.lineTo(rightRuleX, contentBottom);
  ctx.stroke();
  ctx.restore();

  // 3. 逐段绘制：左缘蓝方点 + 首行钴蓝铅空块 + 仅落首行缺口的蓝虚线 + 1:1 整字格排字
  ctx.font = makeFont(fontSize);
  ctx.textBaseline = "top";

  let cursorY = padTop;
  const paraBoxes = [];
  const introAlpha = 0.25 + 0.75 * state.introT;

  layout.paragraphs.forEach((p, pIdx) => {
    const paraTop = cursorY;
    const paraH = p.lines.length * lineHeight;
    const isHoverTarget = state.drag.active && state.drag.hoverPara === pIdx && state.drag.fromPara !== pIdx;

    // 悬停放块目标段轻淡底色高亮
    if (isHoverTarget) {
      ctx.fillStyle = "rgba(28, 84, 240, 0.06)";
      ctx.fillRect(textLeft - 4, paraTop - 2, colW + 8, paraH + 2);
    }

    // 左侧原海报钴蓝小方点（严格位于左参考线更左侧，绝不碰字）
    const sqSize = isNarrowScreen ? 9 : 10;
    const sqX = textLeft - (isNarrowScreen ? 21 : 26);
    const sqY = paraTop + fontSize * 0.2;
    if (p.quads > 0) {
      ctx.fillStyle = "#1c54f0";
      ctx.fillRect(sqX, sqY, sqSize, sqSize);
    } else {
      ctx.strokeStyle = "#1c54f0";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(sqX + 0.7, sqY + 0.7, sqSize - 1.4, sqSize - 1.4);
      // 空方点内微型 "+" 暗示可点/可放
      ctx.beginPath();
      ctx.moveTo(sqX + sqSize / 2, sqY + 2.5);
      ctx.lineTo(sqX + sqSize / 2, sqY + sqSize - 2.5);
      ctx.moveTo(sqX + 2.5, sqY + sqSize / 2);
      ctx.lineTo(sqX + sqSize - 2.5, sqY + sqSize / 2);
      ctx.stroke();
    }

    // 首行已嵌钴蓝全角铅空块（Em-Quad）与首行专属垂直蓝虚线
    let quadRect = null;
    const indPx = p.visualIndent * emW;
    if (indPx > 2) {
      const qy = paraTop + 1;
      const qh = fontSize * 1.06;
      const qw = Math.max(0, indPx - 2.5); // 与首字留 2.5px 净空，绝不压首字！
      quadRect = { x: textLeft, y: qy, w: qw, h: qh };

      ctx.fillStyle = isHoverTarget ? "rgba(28, 84, 240, 0.28)" : "rgba(28, 84, 240, 0.17)";
      ctx.fillRect(textLeft, qy, qw, qh);
      ctx.strokeStyle = "#1c54f0";
      ctx.lineWidth = 1.3;
      ctx.strokeRect(textLeft + 0.5, qy + 0.5, Math.max(0, qw - 1), qh - 1);

      // 每 1 em 的金属铅空拼接缝
      const wholeBlocks = Math.floor(p.visualIndent + 0.05);
      ctx.strokeStyle = "rgba(28, 84, 240, 0.45)";
      ctx.lineWidth = 1;
      for (let k = 1; k < wholeBlocks; k++) {
        const kx = textLeft + k * emW;
        if (kx < textLeft + qw - 2) {
          ctx.beginPath();
          ctx.moveTo(kx + 0.5, qy + 2);
          ctx.lineTo(kx + 0.5, qy + qh - 2);
          ctx.stroke();
        }
      }

      // 垂直蓝虚线：严格只画在本段首行缺口高度（从 paraTop - 2 到 paraTop + qh + 2），绝不穿过第 2、3 行文字！
      ctx.save();
      ctx.strokeStyle = "#1c54f0";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(textLeft + indPx - 1.5, paraTop - 2);
      ctx.lineTo(textLeft + indPx - 1.5, paraTop + qh + 2);
      ctx.stroke();
      ctx.restore();
    } else if (isHoverTarget) {
      // 0 铅空悬停提示虚框
      ctx.save();
      ctx.strokeStyle = "#1c54f0";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(textLeft + 0.5, paraTop + 1.5, state.drag.size * emW - 3, fontSize * 1.06 - 1);
      ctx.restore();
    }

    // 逐行逐字按精确 emW 网格落字，并高亮刚被推落至下一行的字
    ctx.save();
    ctx.globalAlpha = introAlpha;
    p.lines.forEach((ln, lIdx) => {
      const startX = textLeft + (lIdx === 0 ? p.visualIndent * emW : 0);
      const chars = [...ln.text];
      for (let cIdx = 0; cIdx < chars.length; cIdx++) {
        const cx = startX + cIdx * emW;
        // 刚刚被铅空挤落到下一行行首的字，亮一抹柔和钴蓝底与底线
        if (state.cascadeTimer > 0 && state.cascadePara === pIdx && state.cascadeChars.has(`${lIdx}:${cIdx}`)) {
          ctx.fillStyle = `rgba(28, 84, 240, ${(0.22 * state.cascadeTimer).toFixed(3)})`;
          ctx.fillRect(cx, cursorY + 1, emW, fontSize * 1.06);
          ctx.fillStyle = `rgba(28, 84, 240, ${(0.85 * state.cascadeTimer).toFixed(3)})`;
          ctx.fillRect(cx + 1, cursorY + fontSize * 1.08, emW - 2, 1.8);
        }
        ctx.fillStyle = "#141411";
        ctx.fillText(chars[cIdx], cx, cursorY);
      }

      // 若本行末刚推落字到下一行，在右参考线外侧画一个轻巧矢量折返箭头（避免依赖字体缺字）
      if (
        !isNarrowScreen &&
        state.cascadeTimer > 0 &&
        state.cascadePara === pIdx &&
        lIdx < p.lines.length - 1 &&
        state.cascadeChars.has(`${lIdx + 1}:0`)
      ) {
        ctx.save();
        const ax = rightRuleX + 12;
        const ay = cursorY + fontSize * 0.3;
        ctx.strokeStyle = `rgba(28, 84, 240, ${(0.9 * state.cascadeTimer).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, ay + 6);
        ctx.lineTo(ax - 6, ay + 6);
        ctx.moveTo(ax - 3.5, ay + 3.5);
        ctx.lineTo(ax - 6, ay + 6);
        ctx.lineTo(ax - 3.5, ay + 8.5);
        ctx.stroke();
        ctx.restore();
      }

      cursorY += lineHeight;
    });
    ctx.restore();

    // 真实满行粘连警示：只画在版心右参考线外侧（绝不画穿任何字符！）
    if (layout.fusedPairs.includes(pIdx)) {
      const seamY = cursorY - 2;
      ctx.save();
      ctx.strokeStyle = "#b63416";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rightRuleX + 2, seamY - lineHeight * 0.42);
      ctx.lineTo(rightRuleX + 7, seamY - lineHeight * 0.42);
      ctx.lineTo(rightRuleX + 7, seamY + lineHeight * 0.48);
      ctx.lineTo(rightRuleX + 2, seamY + lineHeight * 0.48);
      ctx.stroke();

      if (!isNarrowScreen) {
        ctx.fillStyle = "#b63416";
        ctx.font = `700 11px "Noto Serif SC", serif`;
        ctx.textBaseline = "middle";
        ctx.fillText("粘连", rightRuleX + 11, seamY + 1);
      } else {
        // 手机窄屏在左参考线外侧点一枚醒目朱红短杠
        ctx.fillStyle = "#b63416";
        ctx.fillRect(leftRuleX - 3, seamY - 1.5, 6, 3);
      }
      ctx.restore();
      ctx.font = makeFont(fontSize);
      ctx.textBaseline = "top";
    }

    paraBoxes.push({
      index: pIdx,
      top: paraTop,
      bottom: cursorY,
      sqX: sqX + sqSize / 2,
      sqY: sqY + sqSize / 2,
      quadRect
    });
  });

  // 3b. 排字盘底沿轻巧动作提示（竖屏与宽屏均稳住盘底，不留突兀大白底）
  if (!isShortLandscape) {
    ctx.save();
    ctx.font = `400 11px "Noto Serif SC", serif`;
    ctx.fillStyle = "#565147";
    ctx.textBaseline = "bottom";
    const footTip = committedLayout.totalQuads === 0
      ? "拖上方蓝色铅空进任意段首，或点左缘 [+] 方点排字"
      : `已嵌 ${committedLayout.totalQuads} 块铅空（较 0 字多排 ${committedLayout.extraLines} 行）· 点已嵌蓝块可取出`;
    ctx.fillText(footTip, textLeft - (isNarrowScreen ? 16 : 24), h - 11);
    ctx.restore();
  }

  // 4. 宽屏右侧绘制与手盘 1:1 联动的原海报「缩进示意」结构透视图
  if (showSchematic) {
    drawPosterSchematic(ctx, { x: mainZoneW, y: 0, w: w - mainZoneW, h }, layout, cols);
  }

  // 5. 拖动中：直接在画布上绘出拎在手中的钴蓝金属铅空块与铅垂标线
  if (state.drag.active) {
    const bw = state.drag.size * emW;
    const bh = Math.max(18, fontSize * 1.15);
    const fx = Math.max(8, Math.min(mainZoneW - bw - 8, state.drag.canvasX - bw * 0.5));
    const fy = Math.max(8, Math.min(h - bh - 8, state.drag.canvasY - bh * 0.5));

    ctx.save();
    // 若在顶部标尺带横向拖曳，画一条轻柔钴蓝铅垂提示线（绝不压字，止于 tickY）
    if (state.drag.hoverPara < 0) {
      const cx = fx + bw * 0.5;
      ctx.strokeStyle = "rgba(28, 84, 240, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, fy + bh);
      ctx.lineTo(cx, Math.min(padTop - 2, fy + bh + 18));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 实体钴蓝金属块 + 微阴影
    ctx.fillStyle = "rgba(13, 14, 11, 0.2)";
    ctx.fillRect(fx + 3, fy + 4, bw, bh);
    ctx.fillStyle = "#1c54f0";
    ctx.fillRect(fx, fy, bw, bh);
    ctx.strokeStyle = "#fffcf5";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx + 0.75, fy + 0.75, bw - 1.5, bh - 1.5);
    if (state.drag.size === 2) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx + bw * 0.5, fy + 2);
      ctx.lineTo(fx + bw * 0.5, fy + bh - 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = `600 11px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    const stamp = `${state.drag.size}em`;
    const sw = ctx.measureText(stamp).width;
    ctx.fillText(stamp, fx + (bw - sw) * 0.5, fy + bh * 0.5 + 0.5);
    ctx.restore();
  }

  // 同步四枚左缘键盘可聚焦按钮位置到对应蓝方点
  paraSlotBtns.forEach((btn, idx) => {
    const pb = paraBoxes[idx];
    if (!pb) return;
    btn.style.left = `${pb.sqX}px`;
    btn.style.top = `${pb.sqY}px`;
  });

  geom = {
    w,
    h,
    cols,
    textLeft,
    colW,
    emW,
    fontSize,
    lineHeight,
    padTop,
    mainZoneW,
    paraBoxes,
    layout: committedLayout
  };

  syncHeroUI(committedLayout);
}

const heroLoop = loop(heroWrap, renderHero);

// ---- 坐标命中与拖拽处理 ----
function clientToCanvas(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function hitParaAt(cx, cy, useStable = false) {
  if (cx < 0 || cx > geom.mainZoneW) return -1;
  const boxes = useStable && state.drag.stableBoxes ? state.drag.stableBoxes : geom.paraBoxes;
  for (const pb of boxes) {
    if (cy >= pb.top - 4 && cy <= pb.bottom + 2) return pb.index;
  }
  return -1;
}

function hitQuadAt(cx, cy) {
  for (const pb of geom.paraBoxes) {
    const qr = pb.quadRect;
    if (qr && cx >= qr.x - 4 && cx <= qr.x + qr.w + 4 && cy >= qr.y - 4 && cy <= qr.y + qr.h + 4) {
      return pb.index;
    }
  }
  return -1;
}

function beginQuadDrag(size, fromPara, clientX, clientY, pickupBtn = null) {
  const pt = clientToCanvas(clientX, clientY);
  state.drag.active = true;
  state.drag.size = size;
  state.drag.fromPara = fromPara;
  state.drag.clientX = clientX;
  state.drag.clientY = clientY;
  state.drag.startX = clientX;
  state.drag.startY = clientY;
  state.drag.moved = false;
  state.drag.canvasX = pt.x;
  state.drag.canvasY = pt.y;
  // 冻结起拖瞬间各段的纵坐标带，避免经过上方段落触发换行预览时把目标段落挤跑
  state.drag.stableBoxes = geom.paraBoxes.map((b) => ({ index: b.index, top: b.top, bottom: b.bottom }));
  state.drag.hoverPara = hitParaAt(pt.x, pt.y, true);
  state.introDone = true;
  heroCanvas.classList.add("is-dragging");
  if (pickupBtn) pickupBtn.classList.add("is-lifted");
  state.dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
}

function updateQuadDrag(clientX, clientY) {
  if (!state.drag.active) return;
  if (Math.hypot(clientX - state.drag.startX, clientY - state.drag.startY) > 6) {
    state.drag.moved = true;
  }
  const pt = clientToCanvas(clientX, clientY);
  state.drag.clientX = clientX;
  state.drag.clientY = clientY;
  state.drag.canvasX = pt.x;
  state.drag.canvasY = pt.y;
  state.drag.hoverPara = hitParaAt(pt.x, pt.y, true);
  state.dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
}

function finishQuadDrag() {
  if (!state.drag.active) return;
  const { size, fromPara, moved, hoverPara } = state.drag;
  state.drag.active = false;
  state.drag.hoverPara = -1;
  state.drag.stableBoxes = null;
  heroCanvas.classList.remove("is-dragging");
  btnQuad1.classList.remove("is-lifted");
  btnQuad2.classList.remove("is-lifted");

  if (fromPara === -1) {
    if (hoverPara >= 0) {
      // 拖到指定段首：放入 size 块铅空
      setParaQuads(hoverPara, state.quads[hoverPara] + size);
    } else if (!moved) {
      // 轻点铅空字盘块：自动放入最先还没到 2 字的段首（若全 >= 2，则依次微加）
      let target = state.quads.findIndex((q) => q === 0);
      if (target < 0) target = state.quads.findIndex((q) => q < 2);
      if (target < 0) target = state.quads.findIndex((q) => q < MAX_QUADS);
      if (target >= 0) setParaQuads(target, state.quads[target] + size);
    }
  } else {
    // 原本抓的是某段里已嵌的铅空
    if (!moved) {
      // 轻点已嵌蓝块：取出 1 字铅空
      setParaQuads(fromPara, state.quads[fromPara] - 1, { recordCascade: false });
    } else if (hoverPara >= 0 && hoverPara !== fromPara) {
      // 拖到另一段：从原段搬 1 字到目标段
      setParaQuads(fromPara, state.quads[fromPara] - 1, { recordCascade: false });
      setParaQuads(hoverPara, state.quads[hoverPara] + 1, { recordCascade: true });
    } else if (hoverPara < 0) {
      // 拖出书页外：取出 1 字铅空
      setParaQuads(fromPara, state.quads[fromPara] - 1, { recordCascade: false });
    }
  }

  state.dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
}

// 为两枚铅空拾取钮绑定鼠标指针与触屏（兼容 perf.mjs 的直接 TouchEvent）
[btnQuad1, btnQuad2].forEach((btn) => {
  const size = Number(btn.dataset.quadSize);
  btn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏由 touchstart 统一接管，避免双触发
    e.preventDefault();
    beginQuadDrag(size, -1, e.clientX, e.clientY, btn);
  });
  btn.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    e.preventDefault();
    const t = e.touches[0];
    beginQuadDrag(size, -1, t.clientX, t.clientY, btn);
  }, { passive: false });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      let target = state.quads.findIndex((q) => q === 0);
      if (target < 0) target = state.quads.findIndex((q) => q < 2);
      if (target < 0) target = state.quads.findIndex((q) => q < MAX_QUADS);
      if (target >= 0) setParaQuads(target, state.quads[target] + size);
    }
  });
});

// 画布内直接点击/抓取：抓已嵌铅空可拖走或轻点取出；点段落空白/文字则放入 1 字铅空
heroCanvas.addEventListener("pointerdown", (e) => {
  if (state.drag.active) return;
  const pt = clientToCanvas(e.clientX, e.clientY);
  const qPara = hitQuadAt(pt.x, pt.y);
  if (qPara >= 0) {
    e.preventDefault();
    beginQuadDrag(1, qPara, e.clientX, e.clientY);
    return;
  }
  const pIdx = hitParaAt(pt.x, pt.y);
  if (pIdx >= 0 && e.pointerType === "mouse") {
    setParaQuads(pIdx, state.quads[pIdx] < MAX_QUADS ? state.quads[pIdx] + 1 : 0);
  }
});

// 触屏轻点画布内段落或已嵌铅空（不抢页面纵向滚动）
let tapStart = null;
heroCanvas.addEventListener("touchstart", (e) => {
  if (state.drag.active || !e.touches.length) return;
  const t = e.touches[0];
  tapStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
heroCanvas.addEventListener("touchend", (e) => {
  if (!tapStart || state.drag.active) {
    tapStart = null;
    return;
  }
  const t = e.changedTouches[0];
  const dist = Math.hypot(t.clientX - tapStart.x, t.clientY - tapStart.y);
  tapStart = null;
  if (dist > 10) return;
  const pt = clientToCanvas(t.clientX, t.clientY);
  const qPara = hitQuadAt(pt.x, pt.y);
  if (qPara >= 0) {
    setParaQuads(qPara, state.quads[qPara] - 1, { recordCascade: false });
    return;
  }
  const pIdx = hitParaAt(pt.x, pt.y);
  if (pIdx >= 0) {
    setParaQuads(pIdx, state.quads[pIdx] < MAX_QUADS ? state.quads[pIdx] + 1 : 0);
  }
});

window.addEventListener("pointermove", (e) => {
  if (!state.drag.active || e.pointerType === "touch") return;
  updateQuadDrag(e.clientX, e.clientY);
});
window.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  finishQuadDrag();
});
window.addEventListener("pointercancel", finishQuadDrag);

window.addEventListener("touchmove", (e) => {
  if (!state.drag.active || !e.touches.length) return;
  e.preventDefault();
  updateQuadDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
window.addEventListener("touchend", finishQuadDrag);
window.addEventListener("touchcancel", finishQuadDrag);

// 四枚左缘蓝方点键盘/点击槽
paraSlotBtns.forEach((btn) => {
  const pIdx = Number(btn.dataset.para);
  btn.addEventListener("click", () => {
    const next = state.quads[pIdx] < MAX_QUADS ? state.quads[pIdx] + 1 : 0;
    setParaQuads(pIdx, next);
  });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "+") {
      e.preventDefault();
      setParaQuads(pIdx, state.quads[pIdx] + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "Backspace" || e.key === "-") {
      e.preventDefault();
      setParaQuads(pIdx, state.quads[pIdx] - 1, { recordCascade: false });
    } else if (/^[0-4]$/.test(e.key)) {
      e.preventDefault();
      setParaQuads(pIdx, Number(e.key));
    }
  });
});

btnGalleyClear.addEventListener("click", () => {
  state.quads = [0, 0, 0, 0];
  state.cascadeTimer = 0;
  state.lastEvent = null;
  state.introDone = true;
  if (reducedMotion.matches) state.animIndents = [0, 0, 0, 0];
  state.dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
});

// 初始立即绘出一帧
heroLoop.draw();

// ============================================================
// 2. 第 01 节：整字宽自然齐尾满行两轮找段计时实验
// ============================================================
const spotPageShell = document.getElementById("spot-page-shell");
const spotPage = document.getElementById("spot-page");
const spotGridTag = document.getElementById("spot-grid-tag");
const spotTarget = document.getElementById("spot-target");
const spotStartBtn = document.getElementById("spot-start");
const spotReadout = document.getElementById("spot-readout");
const spotViewBtns = [...document.querySelectorAll("[data-spot-view]")];

const spotState = {
  view: "wall",
  round: 0,
  t0: 0,
  wallMs: 0,
  indentMs: 0
};

const SPOT_COPY = {
  wall: "当前视图：<strong>0 缩进 + 0 段距</strong>——第 2 段恰好自然排满整行、句号贴齐右缘，试着一眼找出第 3 段从哪两个字开始，或点上方按钮亲自计时。",
  gap: "当前视图：<strong>空行法（0 缩进 + 1 行段距）</strong>——段落同样清晰，但整块版面明显变高，长篇书页会多占不少篇幅。",
  indent: "当前视图：<strong>首行缩进 2 字（0 段距）</strong>——左缘豁开清晰缺口，不用插空行也能一秒定位第 3 段「此刻」。"
};

// 按容器实际内宽把 .spot-page 锁定为精确整数全角字宽（36 / 24 / 18 字），
// 既撑满实验框，又让 72 字的第 2 段在各屏宽下自然齐尾排满整行，绝无拉字距假象。
function fitSpotPage() {
  if (!spotPageShell || !spotPage) return;
  const cs = getComputedStyle(spotPageShell);
  const padH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const innerW = Math.max(220, spotPageShell.clientWidth - padH - 22);
  let cols = 36;
  if (innerW < 420) cols = 18;
  else if (innerW < 580) cols = 24;
  const rawFs = innerW / cols;
  const fs = Math.max(12.5, Math.min(20.5, Math.floor(rawFs * 10) / 10));
  spotPage.style.fontSize = `${fs.toFixed(1)}px`;
  spotPage.style.width = `${cols}em`;
  if (spotGridTag) {
    spotGridTag.textContent = `第 2 段 72 字 · ${cols} 字/行自然排满 ${72 / cols} 行`;
  }
}

function setSpotView(v) {
  spotState.view = v;
  spotPage.classList.remove("view-wall", "view-gap", "view-indent", "is-found");
  spotPage.classList.add(`view-${v}`);
  spotViewBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.spotView === v));
  if (spotState.round === 0) {
    spotReadout.innerHTML = SPOT_COPY[v];
  }
}

spotViewBtns.forEach((b) => {
  b.addEventListener("click", () => {
    spotState.round = 0;
    spotPage.classList.remove("is-testing");
    spotStartBtn.textContent = "开始两轮实测（先字墙，后缩进）";
    setSpotView(b.dataset.spotView);
  });
});

spotStartBtn.addEventListener("click", () => {
  spotState.round = 1;
  spotState.wallMs = 0;
  spotState.indentMs = 0;
  setSpotView("wall");
  spotPage.classList.add("is-testing");
  spotState.t0 = performance.now();
  spotStartBtn.textContent = "第 1 轮计时中… 请点第 3 段开头的两个字";
  spotReadout.innerHTML = "第 1 轮（无缩进字墙）：<strong>计时开始！</strong>请尽快点出文中第 3 段起首的两个字。";
});

spotTarget.addEventListener("click", () => {
  if (spotState.round === 1) {
    spotState.wallMs = Math.max(100, Math.round(performance.now() - spotState.t0));
    spotState.round = 2;
    setSpotView("indent");
    spotPage.classList.add("is-testing");
    spotState.t0 = performance.now();
    spotStartBtn.textContent = "第 2 轮计时中… 再点第 3 段开头的两个字";
    spotReadout.innerHTML = `第 1 轮（字墙）用时 <strong>${(spotState.wallMs / 1000).toFixed(2)} 秒</strong>。已切到 2 字首行缩进——第 2 轮开始，请马上再点第 3 段首字！`;
  } else if (spotState.round === 2) {
    spotState.indentMs = Math.max(80, Math.round(performance.now() - spotState.t0));
    spotState.round = 0;
    spotPage.classList.remove("is-testing");
    spotPage.classList.add("is-found");
    const wSec = (spotState.wallMs / 1000).toFixed(2);
    const iSec = (spotState.indentMs / 1000).toFixed(2);
    spotStartBtn.textContent = "再测一次";
    spotReadout.innerHTML = `实测完成：无缩进字墙 <strong>${wSec} 秒</strong> vs 首行缩进 2 字 <strong>${iSec} 秒</strong>——少了两个字占宽，眼睛反倒有了立等可辨的起跳锚点。`;
  } else {
    spotPage.classList.toggle("is-found");
  }
});

fitSpotPage();

// ============================================================
// 3. 第 02 节：四时代演化标本器
// ============================================================
const eraTabs = [...document.querySelectorAll(".era-tab")];
const eraSpecimen = document.getElementById("era-specimen");
const eraYearTag = document.getElementById("era-year-tag");
const eraTitle = document.getElementById("era-title");
const eraCaption = document.getElementById("era-caption");
const eraNote = document.getElementById("era-note");

function renderEra(idx) {
  const era = ERAS[idx] || ERAS[0];
  eraTabs.forEach((t, i) => {
    const on = i === idx;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
  eraYearTag.textContent = `${era.year} · ${era.en}`;
  eraTitle.textContent = era.name;
  eraCaption.textContent = era.caption;
  eraNote.textContent = era.note;

  if (era.mode === "inline-pilcrow") {
    eraSpecimen.innerHTML = `
      <div class="sp-manuscript" lang="en">
        In medieval manuscripts, lines ran solid across the parchment so no expensive vellum went to waste.<span class="sp-pilcrow" aria-label="段落符">¶</span>Where a new thought began, the rubricator painted a bright red pilcrow directly inside the line.<span class="sp-pilcrow" aria-label="段落符">¶</span>No line break, no indent—only a scarlet mark glowing in black ink.
      </div>`;
  } else if (era.mode === "latin-flush-first") {
    eraSpecimen.innerHTML = `
      <div class="sp-print" lang="en">
        <p>When movable type sped up bookmaking in the 15th century, printers left a blank pocket for the rubricator to add red pilcrows by hand.</p>
        <p><span class="sp-quad-ghost" aria-hidden="true"></span>Hand painters soon fell behind the press. The empty pocket stayed blank—and readers discovered the white gap alone marked a new paragraph cleanly.</p>
      </div>`;
  } else if (era.mode === "vertical-cn") {
    eraSpecimen.innerHTML = `
      <div class="sp-vertical-wrap" aria-label="1920年竖排每段低两格标本">
        <div class="sp-vcol v-drop">每段开端，必须低两格。竖排自上而下，空出两字方格。</div>
        <div class="sp-vcol v-drop">回行则自顶格起写，眉目清晰，一改旧籍连篇无断之困。</div>
        <div class="sp-vcol v-drop">此例载于民国九年教育部颁行之新式标点符号议案附则。</div>
      </div>`;
  } else {
    eraSpecimen.innerHTML = `
      <div class="sp-modern">
        <p>现代中文横排延续「空二字」传统，国家标准公文格式记为「每个自然段左空二字，回行顶格」。</p>
        <p>进入屏幕排版时代，浏览器不再摆放金属铅块，而用相对字号自动缩放的样式属性完成同样的工作。</p>
        <code>p { text-indent: 2em; margin: 0; }</code>
      </div>`;
  }
}

eraTabs.forEach((tab) => {
  tab.addEventListener("click", () => renderEra(Number(tab.dataset.era)));
});
renderEra(0);

// ============================================================
// 4. 第 03 节：栏宽 × 语种 × 缩进比例尺（每段蓝虚线仅落首行缺口，绝不压后续行）
// ============================================================
const mLangBtns = [...document.querySelectorAll("[data-lang]")];
const mColRange = document.getElementById("m-col-range");
const mIndRange = document.getElementById("m-ind-range");
const mColVal = document.getElementById("m-col-val");
const mIndVal = document.getElementById("m-ind-val");
const mRatioVal = document.getElementById("m-ratio-val");
const mPin = document.getElementById("m-pin");
const mVerdict = document.getElementById("m-verdict");
const mColumn = document.getElementById("m-column");
const mText = document.getElementById("m-text");
const mCaption = document.getElementById("m-caption");
const mRulerFill = document.getElementById("m-ruler-fill");
const mRulerTag = document.getElementById("m-ruler-tag");

let measureLang = "zh";

function updateMeasureLab() {
  const spec = LANG_SPECS[measureLang];
  const cols = Number(mColRange.value);
  const ind = Number(mIndRange.value);
  const ratio = (ind / cols) * 100;

  mColVal.textContent = `${cols} em`;
  mIndVal.textContent = `${ind.toFixed(2).replace(/\.00$/, ".0")} em`;
  mRatioVal.textContent = `${ratio.toFixed(1)}%`;

  const pinPct = Math.max(2, Math.min(98, (ratio / 30) * 100));
  mPin.style.left = `${pinPct}%`;

  if (ratio < 5) {
    mVerdict.textContent = "偏浅（< 5% 行宽）：宽栏里容易看漏起段缺口";
    mVerdict.dataset.tone = "warn";
  } else if (ratio > 14) {
    mVerdict.textContent = "过深（> 14% 行宽）：窄栏首行被吃掉太多，发虚失衡";
    mVerdict.dataset.tone = "warn";
  } else {
    mVerdict.textContent = "落入经验参考区（5%–14% 行宽）：起段利落、版心匀称";
    mVerdict.dataset.tone = "ok";
  }

  mColumn.setAttribute("lang", measureLang === "zh" ? "zh-CN" : measureLang);
  const shell = mColumn.parentElement;
  const shellCs = shell ? getComputedStyle(shell) : null;
  const shellPad = shellCs ? parseFloat(shellCs.paddingLeft) + parseFloat(shellCs.paddingRight) : 40;
  const shellInnerW = Math.max(220, (shell?.clientWidth || 600) - shellPad - 2);
  const colCs = getComputedStyle(mColumn);
  const colPadL = parseFloat(colCs.paddingLeft) || 18;
  const colPadR = parseFloat(colCs.paddingRight) || 18;
  const colChrome = colPadL + colPadR + 4;
  const baseFs = measureLang === "en" ? 19 : 16;
  const rawFit = Math.min(baseFs, (shellInnerW - colChrome) / cols);
  const fitFs = Math.max(10.5, Math.floor(rawFit * 10) / 10);
  mColumn.style.fontSize = `${fitFs.toFixed(1)}px`;
  mColumn.style.width = `${Math.floor(cols * fitFs + colChrome)}px`;

  if (mRulerFill && mRulerTag) {
    const colFrac = Math.min(100, Math.round((cols / 40) * 100));
    mRulerFill.style.width = `${colFrac}%`;
    mRulerTag.textContent = `${cols} / 40 em`;
  }

  // 每段首行放一块独立 .m-indent-mark（宽度缩进 - 3px，高度仅占首行），绝不穿过后续行字符
  mText.innerHTML = spec.text
    .map((line, i) => {
      const useInd = measureLang === "en" && i === 0 ? 0 : ind;
      const mark = useInd > 0.1
        ? `<span class="m-indent-mark" style="width:max(0px, calc(${useInd}em - 3px))" aria-hidden="true"></span>`
        : "";
      return `<p style="text-indent:${useInd}em">${mark}${line}</p>`;
    })
    .join("");
  mCaption.textContent = `${spec.standardText}（5%–14% 为通用行宽占比经验参考值，实际以阅读距离与字重微调）`;
}

mLangBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    measureLang = btn.dataset.lang;
    mLangBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    mIndRange.value = String(LANG_SPECS[measureLang].defaultIndent);
    updateMeasureLab();
  });
});
mColRange.addEventListener("input", updateMeasureLab);
mIndRange.addEventListener("input", updateMeasureLab);
updateMeasureLab();

window.addEventListener("resize", () => {
  state.dirty = true;
  heroLoop.draw();
  fitSpotPage();
  updateMeasureLab();
});

// ============================================================
// 5. 第 04 节：深靛蓝三大陷阱纠错台
// ============================================================
const trapTabs = [...document.querySelectorAll(".trap-tab")];
const trapPanels = {
  belt: document.getElementById("trap-belt"),
  quote: document.getElementById("trap-quote"),
  spaces: document.getElementById("trap-spaces")
};

trapTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.trap;
    trapTabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    Object.entries(trapPanels).forEach(([k, panel]) => {
      const show = k === key;
      panel.hidden = !show;
      panel.classList.toggle("is-active", show);
    });
  });
});

// Trap A: 皮带加背带
const beltBtns = [...document.querySelectorAll("[data-belt-mode]")];
const beltDemo = document.getElementById("belt-demo");
const beltReadout = document.getElementById("belt-readout");
const BELT_NOTES = {
  both: "当前叠用了 2 字缩进与 1 行段距：段落像飘在纸上的孤岛，版心连续感被切碎。",
  indent: "已关闭多余段距：只留 2 字首行缩进，三段立刻贴合成紧实耐读的书页肌理。",
  gap: "已去掉首行缩进：只留 0.9 行段距，左缘笔直利落，适合网页文章与屏幕扫读。"
};
beltBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const m = btn.dataset.beltMode;
    beltBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    beltDemo.className = `trap-demo-sheet belt-${m}`;
    beltReadout.textContent = BELT_NOTES[m];
  });
});

// Trap B: 首段顶格 & 段首开引号挤压
const btnOptFirst = document.getElementById("btn-opt-first");
const btnOptQuote = document.getElementById("btn-opt-quote");
const quoteDemo = document.getElementById("quote-demo");
const quoteReadout = document.getElementById("quote-readout");

function updateQuoteReadout() {
  const f = quoteDemo.classList.contains("opt-first");
  const q = quoteDemo.classList.contains("opt-quote");
  if (f && q) {
    quoteReadout.textContent = "首段顶格稳住起篇，第二段开引号左收半格后，「排」字与第三段「等」字严格落在同一条蓝色虚线上！";
  } else if (q) {
    quoteReadout.textContent = "开引号往左推回半格：现在三段的首个汉字全部严丝合缝贴齐蓝色虚线，光学塌陷消失了。";
  } else if (f) {
    quoteReadout.textContent = "首段改成了西式顶格；再看看第二段开引号，没有挤压半格时「排」字仍比第三段凹进半格。";
  } else {
    quoteReadout.textContent = "注意第二段开头的「排」字：全角开引号左半留白，让文字显得比上段多退了半格。";
  }
}

btnOptFirst.addEventListener("click", () => {
  const on = quoteDemo.classList.toggle("opt-first");
  btnOptFirst.setAttribute("aria-pressed", String(on));
  updateQuoteReadout();
});
btnOptQuote.addEventListener("click", () => {
  const on = quoteDemo.classList.toggle("opt-quote");
  btnOptQuote.setAttribute("aria-pressed", String(on));
  updateQuoteReadout();
});

// Trap C: 空格键 vs text-indent
const spaceFontBtns = [...document.querySelectorAll("[data-space-font]")];
const btnShowInvis = document.getElementById("btn-show-invisibles");
const spaceDemo = document.getElementById("space-demo");
const spaceReadout = document.getElementById("space-readout");

spaceFontBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const narrow = btn.dataset.spaceFont === "narrow";
    spaceFontBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    spaceDemo.classList.toggle("font-narrow", narrow);
    spaceReadout.textContent = narrow
      ? "换到 20px 比例字体后，「误排」里的 4 个半角空格更明显地缩水成不到 1 个字宽；「正排」的 text-indent: 2em 自动同比放大到两字。"
      : "「误排」里的 4 个半角空格被比例字体压得只剩约 1 个汉字宽，还混进纯文本；「正排」的 text-indent: 2em 始终严丝合缝。";
  });
});

btnShowInvis.addEventListener("click", () => {
  const on = spaceDemo.classList.toggle("show-invis");
  btnShowInvis.setAttribute("aria-pressed", String(on));
});

// ============================================================
// 6. 第 05 节：何时用 / 何时别用 场景体检台
// ============================================================
const scItems = [...document.querySelectorAll(".sc-item")];
const scTag = document.getElementById("sc-tag");
const scTitle = document.getElementById("sc-title");
const scSummary = document.getElementById("sc-summary");
const scMockup = document.getElementById("sc-mockup");
const scVerdict = document.getElementById("sc-verdict");
const scToggle = document.getElementById("sc-toggle");
const scToggleLabel = document.getElementById("sc-toggle-label");

let activeScenario = SCENARIOS[0];
let scIndentOn = activeScenario.defaultOn;

function buildScenarioHTML(sc, on) {
  const cls = on ? "has-ind" : "";
  if (sc.id === "novel") {
    return `<div class="mk-book ${cls}">
      <p>雨后的旧书店弥漫着纸浆与樟脑的微香，柜台上的台灯只照亮半张木桌，其余书架全退进柔和的影子里。</p>
      <p>他翻开那本铅印旧版散文，每一段开头稳稳空出两字，整页密实却并不闷人，视线一口气滑过三页也没觉得累。</p>
    </div>`;
  }
  if (sc.id === "official") {
    return `<div class="mk-official ${cls}">
      <h4>关于印发公共图书馆阅览室排印参考的通知</h4>
      <p>各区县文化馆、公共图书馆：为提升纸质文献与电子告示的可读性，现将本年度通用正文排版要点印发如下。</p>
      <p>长篇正文每个自然段左空二字、回行顶格，力求脉络清晰、便于基层读者逐条查阅落实。</p>
    </div>`;
  }
  if (sc.id === "magazine") {
    return `<div class="mk-mag ${cls}">
      <div>
        <p>晨雾还没散尽，码头的渡轮已经拉响第一声汽笛。站在甲板栏杆旁的通勤客，大多顺手把早报折成一栏宽。</p>
        <p>窄栏每行只有十几个字，段首只需微缩一字半，便足以在摇晃的车厢里守住分段节奏。</p>
      </div>
      <div>
        <p>报馆老美编常说，多栏版面最怕各栏段距不一。用首行缩进替代整行空隙，才能让栏脚齐齐落在同一条底线上。</p>
      </div>
    </div>`;
  }
  if (sc.id === "ppt") {
    return `<div class="mk-ppt ${cls}">
      <h4>季度产品复盘 · 三项关键动作</h4>
      <div class="mk-ppt-cards">
        <div class="mk-ppt-card"><p>简化注册首屏，去掉三项非必填字段，新客完成步数减半。</p></div>
        <div class="mk-ppt-card"><p>重写帮助文档目录，将高频问题置顶，客服工单明显回落。</p></div>
        <div class="mk-ppt-card"><p>统一移动端字号与行距，弱光环境下的读屏清晰度提升。</p></div>
      </div>
    </div>`;
  }
  if (sc.id === "webcard") {
    return `<div class="mk-web ${cls}">
      <p>刚试了楼下新开的烘焙店，酸面包外皮很脆，切片烤两分钟香气就出来了。</p>
      <p>唯一要注意的是下午四点后基本卖空，想买全麦吐司最好中午路过顺手带。</p>
    </div>`;
  }
  return `<div class="mk-center ${cls}">
    <p>致每一位认真排字的同行</p>
    <p>字里行间留白处，皆是读者的呼吸</p>
  </div>`;
}

function renderScenario() {
  scTag.textContent = activeScenario.tag;
  scTitle.textContent = activeScenario.title;
  scSummary.textContent = activeScenario.summary;
  scMockup.innerHTML = buildScenarioHTML(activeScenario, scIndentOn);
  scToggle.classList.toggle("is-on", scIndentOn);
  scToggle.setAttribute("aria-pressed", String(scIndentOn));
  scToggleLabel.textContent = scIndentOn ? "已开启" : "已关闭";

  const isBadChoice = (activeScenario.verdict === "use" && !scIndentOn) || (activeScenario.verdict === "skip" && scIndentOn);
  scVerdict.textContent = scIndentOn ? activeScenario.onNote : activeScenario.offNote;
  scVerdict.dataset.bad = String(isBadChoice);
}

scItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    const found = SCENARIOS.find((s) => s.id === btn.dataset.sc);
    if (!found) return;
    activeScenario = found;
    scIndentOn = found.defaultOn;
    scItems.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderScenario();
  });
});

scToggle.addEventListener("click", () => {
  scIndentOn = !scIndentOn;
  renderScenario();
});
renderScenario();

// ============================================================
// 7. 第 06 节：三道盲测眼力练习（4 选 1 中性标签）
// ============================================================
const quizList = document.getElementById("quiz-list");
const quizDoneEl = document.getElementById("quiz-done");
const quizScoreEl = document.getElementById("quiz-score");
const quizResetBtn = document.getElementById("quiz-reset");
const quizAnswers = new Map();

function renderQuiz() {
  quizList.innerHTML = "";
  QUIZ_ITEMS.forEach((item) => {
    const pickedKey = quizAnswers.get(item.id);
    const card = document.createElement("article");
    card.className = "quiz-card";
    card.innerHTML = `<h3 class="quiz-prompt">${item.prompt}</h3><div class="quiz-opts"></div>`;
    const optsWrap = card.querySelector(".quiz-opts");

    item.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      btn.dataset.quiz = item.id;
      btn.dataset.key = opt.key;
      if (pickedKey === opt.key) {
        btn.classList.add(opt.ok ? "is-picked-ok" : "is-picked-bad");
      }
      const headHtml = opt.heading ? `<h4 class="qz-head" lang="en">${opt.heading}</h4>` : "";
      btn.innerHTML = `
        <span class="quiz-opt-head"><span class="opt-key" lang="en">${opt.key}</span><span>${opt.label}</span></span>
        <div class="quiz-mini ${opt.previewClass}">${headHtml}${opt.lines.map((l) => `<p>${l}</p>`).join("")}</div>
      `;
      btn.addEventListener("click", () => {
        quizAnswers.set(item.id, opt.key);
        renderQuiz();
      });
      optsWrap.append(btn);
    });

    if (pickedKey) {
      const chosen = item.options.find((o) => o.key === pickedKey);
      const fb = document.createElement("p");
      fb.className = `quiz-fb ${chosen.ok ? "is-ok" : "is-bad"}`;
      fb.textContent = `${chosen.ok ? "答对了 · " : "再看看 · "}${chosen.feedback}`;
      card.append(fb);
    }
    quizList.append(card);
  });

  let score = 0;
  for (const item of QUIZ_ITEMS) {
    const pk = quizAnswers.get(item.id);
    if (pk && item.options.find((o) => o.key === pk)?.ok) score++;
  }
  quizDoneEl.textContent = String(quizAnswers.size);
  quizScoreEl.textContent = String(score);
}

quizResetBtn.addEventListener("click", () => {
  quizAnswers.clear();
  renderQuiz();
});
renderQuiz();

// ============================================================
// 8. 第 08 节：原海报灯箱（复用 #poster src，支持缩放、拖动、Esc 关）
// ============================================================
const posterImg = document.getElementById("poster");
const posterOpenBtn = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbScaleEl = document.getElementById("lb-scale");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

const lbState = { scale: 1, tx: 0, ty: 0, panning: false, sx: 0, sy: 0, stx: 0, sty: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.tx}px, ${lbState.ty}px) scale(${lbState.scale})`;
  lbScaleEl.textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbState.scale = 1;
  lbState.tx = 0;
  lbState.ty = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  document.body.style.overflow = "";
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => {
  lbState.scale = Math.min(3.5, +(lbState.scale + 0.35).toFixed(2));
  applyLbTransform();
});
lbZoomOut.addEventListener("click", () => {
  lbState.scale = Math.max(0.7, +(lbState.scale - 0.35).toFixed(2));
  applyLbTransform();
});
lbReset.addEventListener("click", () => {
  lbState.scale = 1;
  lbState.tx = 0;
  lbState.ty = 0;
  applyLbTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.18 : -0.18;
  lbState.scale = Math.max(0.7, Math.min(3.5, +(lbState.scale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbState.scale <= 1.05) {
    closeLightbox();
    return;
  }
  lbState.panning = true;
  lbState.sx = e.clientX;
  lbState.sy = e.clientY;
  lbState.stx = lbState.tx;
  lbState.sty = lbState.ty;
  lbViewport.classList.add("is-panning");
  lbViewport.setPointerCapture?.(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbState.panning) return;
  lbState.tx = lbState.stx + (e.clientX - lbState.sx);
  lbState.ty = lbState.sty + (e.clientY - lbState.sy);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => {
  lbState.panning = false;
  lbViewport.classList.remove("is-panning");
});
lbViewport.addEventListener("pointercancel", () => {
  lbState.panning = false;
  lbViewport.classList.remove("is-panning");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});
