import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { drawIcon2D, iconSvg, ICON_PALETTE } from "./icons.js";
import {
  SCENES,
  PRESETS,
  createInitialState,
  clamp,
  computeStageLayout,
  diagnose,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ═══════════════════════════════════════════════════════════════
// HERO：254 图文联组校样板（单真源 2D Canvas + 底部实黑诊单匣）
// ═══════════════════════════════════════════════════════════════
const state = createInitialState();
const anim = {
  internalGap: state.internalGap,
  iconScale: state.iconScale,
  verticalOffset: state.verticalOffset,
};

const canvas = $("#hero-canvas");
const ctx = canvas.getContext("2d");
let lastLayout = null;
let lastDiag = null;
let cssW = 1280;
let cssH = 326;
let dirty = true;

function resizeHeroCanvas() {
  const rect = canvas.getBoundingClientRect();
  cssW = Math.max(280, Math.round(rect.width));
  cssH = Math.max(220, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  dirty = true;
}

// 按原海报节奏在全角逗号处自然拆成两行平衡短句（零孤立句号、零窄屏截断）
function splitPosterLines(context, text, maxW, maxLines = 2) {
  const comma = text.indexOf("，");
  if (comma > 0 && maxLines >= 2) {
    const a = text.slice(0, comma + 1);
    const b = text.slice(comma + 1);
    if (context.measureText(a).width <= maxW + 10 && context.measureText(b).width <= maxW + 14) {
      return [a, b];
    }
  }
  const lines = [];
  let cur = "";
  for (const ch of text) {
    const next = cur + ch;
    if (cur && context.measureText(next).width > maxW) {
      lines.push(cur);
      cur = ch;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = next;
    }
  }
  if (lines.length < maxLines) {
    const rest = text.slice(lines.join("").length);
    if (rest) {
      let tail = rest;
      while (tail.length > 2 && context.measureText(tail).width > maxW) {
        tail = tail.slice(0, -1);
      }
      if (tail.length < rest.length) tail = tail.slice(0, -1) + "…";
      lines.push(tail);
    }
  }
  return lines;
}

function drawHeroFrame(t, dt, { still }) {
  // 缓动逼近目标参数；prefers-reduced-motion 或拖动中直接跟手
  if (still) {
    anim.internalGap = state.internalGap;
    anim.iconScale = state.iconScale;
    anim.verticalOffset = state.verticalOffset;
  } else {
    const k = dt > 0 ? 1 - Math.exp(-dt * 16) : 1;
    anim.internalGap += (state.internalGap - anim.internalGap) * k;
    anim.iconScale += (state.iconScale - anim.iconScale) * k;
    anim.verticalOffset += (state.verticalOffset - anim.verticalOffset) * k;
  }

  const moving =
    Math.abs(anim.internalGap - state.internalGap) > 0.05 ||
    Math.abs(anim.iconScale - state.iconScale) > 0.002 ||
    Math.abs(anim.verticalOffset - state.verticalOffset) > 0.05;

  const renderState = {
    ...state,
    internalGap: anim.internalGap,
    iconScale: anim.iconScale,
    verticalOffset: anim.verticalOffset,
  };

  const layout = computeStageLayout(renderState, cssW, cssH);
  const diag = diagnose(renderState, layout);
  const dpr = pixelRatio(2);

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 1. 原海报柿红底面
  ctx.fillStyle = ICON_PALETTE.vermilion;
  ctx.fillRect(0, 0, cssW, cssH);

  // 2. 1:1 原海报细黑横隔线 + 竖脊线 + 实心黑圆节点
  ctx.strokeStyle = ICON_PALETTE.ink;
  ctx.lineWidth = 1.4;
  const ruleLeft = layout.padX;
  const ruleRight = cssW - layout.padX;
  for (const y of layout.rowDivYs) {
    ctx.beginPath();
    ctx.moveTo(ruleLeft, y);
    ctx.lineTo(ruleRight, y);
    ctx.stroke();
  }
  for (const x of layout.spineXs) {
    ctx.beginPath();
    ctx.moveTo(x, layout.topPad + 4);
    ctx.lineTo(x, cssH - layout.bottomPad - 4);
    ctx.stroke();
    // 每行中点一枚实心黑圆（原海报标志脊点）
    for (let r = 0; r < layout.rows; r++) {
      const cy = layout.topPad + layout.rowH * (r + 0.5);
      ctx.fillStyle = ICON_PALETTE.ink;
      ctx.beginPath();
      ctx.arc(x, cy, layout.scale > 0.72 ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const isVert = state.layout === "vertical";
  const m = layout.metrics;
  const s = layout.scale;

  // 3. 逐格绘制 6 个图文单元
  for (const cell of layout.cells) {
    const { item, iconRect, textRect, cellRect, activeIconId, idx } = cell;
    const isSel = idx === state.selected;

    // 选中单元格四角细黑取景角标（承袭原海报顶部括弧语言）
    if (isSel) {
      const bx = cellRect.x + 5;
      const by = cellRect.y + 5;
      const bw = cellRect.w - 10;
      const bh = cellRect.h - 10;
      const arm = Math.min(14, bw * 0.12);
      ctx.strokeStyle = ICON_PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by + arm); ctx.lineTo(bx, by); ctx.lineTo(bx + arm, by);
      ctx.moveTo(bx + bw - arm, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + arm);
      ctx.moveTo(bx, by + bh - arm); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + arm, by + bh);
      ctx.moveTo(bx + bw - arm, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - arm);
      ctx.stroke();
    }

    // 光学中轴参照线（开启标尺线且横排时，画在首个或选中单元上清晰不乱）
    if (state.showGuides && !isVert && iconRect && textRect && (idx === state.selected || idx === 0)) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.2;
      // 文字块视觉中线
      ctx.strokeStyle = "rgba(17, 18, 13, 0.72)";
      ctx.beginPath();
      ctx.moveTo(iconRect.x - 4, textRect.cy);
      ctx.lineTo(textRect.x + textRect.w, textRect.cy);
      ctx.stroke();

      // 若纵轴偏离，画出图标偏移线与标注
      if (Math.abs(m.verticalOffset) > 3) {
        ctx.strokeStyle = ICON_PALETTE.cream;
        ctx.beginPath();
        ctx.moveTo(iconRect.x - 4, iconRect.cy);
        ctx.lineTo(iconRect.cx + iconRect.r + 12, iconRect.cy);
        ctx.stroke();

        // 竖向偏差连接线
        ctx.setLineDash([]);
        ctx.strokeStyle = ICON_PALETTE.ink;
        ctx.lineWidth = 1.8;
        const ax = iconRect.cx + iconRect.r + 6;
        ctx.beginPath();
        ctx.moveTo(ax, textRect.cy);
        ctx.lineTo(ax, iconRect.cy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 绘制暖奶油圆盘 + 双色几何图标
    if (iconRect) {
      ctx.fillStyle = ICON_PALETTE.cream;
      ctx.beginPath();
      ctx.arc(iconRect.cx, iconRect.cy, iconRect.r, 0, Math.PI * 2);
      ctx.fill();

      // 选中圆盘加一圈钴蓝细环
      if (isSel) {
        ctx.strokeStyle = ICON_PALETTE.blue;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(iconRect.cx, iconRect.cy, iconRect.r + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawIcon2D(ctx, activeIconId, iconRect.cx, iconRect.cy, iconRect.r * 0.88);
    }

    // 绘制文字块（粗黑中文标题 + 凝窄英文副标 + 短黑杠 + 2行平衡说明）
    let textBottomY = textRect ? textRect.y + textRect.h : 0;
    if (textRect) {
      const titlePx = Math.round(clamp((isVert ? 18 : 21) * s, 14, 27));
      const enPx = Math.round(clamp((isVert ? 11.5 : 13) * s, 10.5, 15.5));
      const bodyPx = Math.round(clamp((isVert ? 11 : 12.2) * s, 10.5, 14.5));

      ctx.fillStyle = ICON_PALETTE.ink;
      ctx.textBaseline = "top";
      ctx.textAlign = isVert ? "center" : "left";
      const tx = isVert ? textRect.x + textRect.w * 0.5 : textRect.x;

      if (isVert) {
        ctx.font = `900 ${titlePx}px "Noto Sans SC", sans-serif`;
        ctx.fillText(item.title, tx, textRect.y);
        ctx.font = `400 ${enPx}px "Anton", "IBM Plex Sans", sans-serif`;
        ctx.fillText(item.en, tx, textRect.y + titlePx + 2);
        if (s >= 0.72) {
          ctx.font = `500 ${bodyPx}px "Noto Sans SC", sans-serif`;
          const oneLine = splitPosterLines(ctx, item.body, textRect.w, 1)[0] || "";
          ctx.fillText(oneLine, tx, textRect.y + titlePx + enPx + 5);
        }
      } else {
        const y0 = textRect.y;
        ctx.font = `900 ${titlePx}px "Noto Sans SC", sans-serif`;
        ctx.fillText(item.title, tx, y0);

        const yEn = y0 + titlePx + 2;
        ctx.font = `400 ${enPx}px "Anton", "IBM Plex Sans", sans-serif`;
        ctx.fillText(item.en, tx, yEn);

        const yBar = yEn + enPx + 4;
        ctx.fillRect(tx, yBar, Math.round(15 * s), 2);

        ctx.font = `500 ${bodyPx}px "Noto Sans SC", sans-serif`;
        const lines = splitPosterLines(ctx, item.body, textRect.w, 2);
        const lh = bodyPx * 1.32;
        lines.forEach((ln, li) => {
          ctx.fillText(ln, tx, yBar + 5 + li * lh);
        });
        textBottomY = yBar + 5 + lines.length * lh;
      }
    }

    // 标尺叠加：图字内距卡尺落于第 0 格底缘留白区，与下方横隔线留足 7px 净空，绝不压字或碰线
    if (state.showGuides && idx === 0 && iconRect && textRect && !isVert && cellRect.h >= 104) {
      const x1 = iconRect.x + iconRect.w;
      const x2 = textRect.x;
      const rulerY = cellRect.y + cellRect.h - 26;
      ctx.save();
      ctx.strokeStyle = ICON_PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, rulerY);
      ctx.lineTo(x2, rulerY);
      ctx.moveTo(x1, rulerY - 3.5); ctx.lineTo(x1, rulerY + 3.5);
      ctx.moveTo(x2, rulerY - 3.5); ctx.lineTo(x2, rulerY + 3.5);
      ctx.stroke();

      const lbl = m.internalGap < 6 ? `撞字 ${m.internalGap}px` : `内距 ${m.internalGap}px`;
      ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
      const tw = ctx.measureText(lbl).width + 10;
      const bx = clamp((x1 + x2) * 0.5 - tw * 0.5, 6, cssW - tw - 6);
      const by = rulerY + 4;
      ctx.fillStyle = ICON_PALETTE.ink;
      ctx.fillRect(bx, by, tw, 15);
      ctx.fillStyle = m.internalGap < 6 ? "#ff8c66" : ICON_PALETTE.cream;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, bx + tw * 0.5, by + 8);
      ctx.restore();
    }
  }

  // 4. 格式塔亲密性跨组引力桥（精确连接左列文字右沿与右列图标左沿；顶标落于独立 topPad 净空带绝不遮字）
  if (state.showGuides && state.mode === "both" && !isVert && layout.cells.length >= 2) {
    const leftCell = layout.cells[0];
    const rightCell = layout.cells[1];
    if (leftCell.textRect && rightCell.iconRect) {
      const gx1 = leftCell.textRect.x + leftCell.textRect.w;
      const gx2 = rightCell.iconRect.x;
      const gy = leftCell.cellRect.cy;
      const isBad = m.ratio < 1.5;

      ctx.save();
      if (isBad) {
        ctx.strokeStyle = ICON_PALETTE.cream;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 4]);
        if (!still) ctx.lineDashOffset = -t * 18;
        const arcBaseY = Math.max(layout.topPad + 18, gy - 14);
        const arcPeakY = Math.max(layout.topPad + 4, arcBaseY - 20);
        ctx.beginPath();
        ctx.moveTo(gx1 - 2, arcBaseY);
        ctx.quadraticCurveTo((gx1 + gx2) * 0.5, arcPeakY, gx2 + 2, arcBaseY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const tag =
        m.ratio <= 1.0
          ? `× 错连 · 组距 ${m.groupGap}px < 内距 ${m.internalGap}px`
          : m.ratio < 1.5
            ? `! 边界模糊 · 外/内 ${m.ratio}×`
            : `✓ 组距 ${m.groupGap}px (${m.ratio}× 内距)`;
      ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
      const tw = ctx.measureText(tag).width + 12;
      const bx = clamp((gx1 + gx2) * 0.5 - tw * 0.5, 6, cssW - tw - 6);
      const by = 3;
      ctx.fillStyle = ICON_PALETTE.ink;
      ctx.fillRect(bx, by, tw, 18);
      ctx.fillStyle = isBad ? "#ff8c66" : "#6ce2b4";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, bx + tw * 0.5, by + 9.5);
      ctx.restore();
    }
  }

  // 5. 语义错配 / 纯图猜谜 全局角落印章
  if (state.semanticMismatch && state.mode === "both") {
    ctx.save();
    const note = "× 图意背离：图形与文字含义冲突";
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(note).width + 16;
    ctx.fillStyle = ICON_PALETTE.ink;
    ctx.fillRect(cssW - tw - 10, cssH - 26, tw, 21);
    ctx.fillStyle = "#ff8c66";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(note, cssW - tw * 0.5 - 10, cssH - 15.5);
    ctx.restore();
  } else if (state.mode === "icon-only") {
    ctx.save();
    const note = "× 纯图标猜谜：缺少文字明确语义";
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(note).width + 16;
    ctx.fillStyle = ICON_PALETTE.ink;
    ctx.fillRect(cssW - tw - 10, cssH - 26, tw, 21);
    ctx.fillStyle = "#ff8c66";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(note, cssW - tw * 0.5 - 10, cssH - 15.5);
    ctx.restore();
  }

  ctx.restore();
  lastLayout = layout;
  lastDiag = diag;
  dirty = moving || (!still && diag.issues.some((i) => i.id === "proximity-invert" || i.id === "proximity-blur"));
}

// 同步所有 DOM 读数、三段公式状态、实黑成品匣与自示范标题字距
function syncHeroUI() {
  const layout = computeStageLayout(state, cssW, cssH);
  const diag = diagnose(state, layout);
  const m = layout.metrics;
  const selCell = layout.cells[state.selected] || layout.cells[0];

  // 顶部自示范大标字距随亲密性开合（坏态微散、成立咬合）
  const titleGapEm = diag.ok ? "0.14em" : m.ratio <= 1 ? "0.42em" : "0.28em";
  document.documentElement.style.setProperty("--title-gap", titleGapEm);

  // 顶沿印章
  const statusEl = $("#hero-status");
  statusEl.textContent = diag.badgeText;
  statusEl.classList.toggle("is-ok", diag.ok);

  // 三段原海报公式实况徽章
  const setPill = (id, info) => {
    const el = $(id);
    el.textContent = info.badge;
    el.classList.toggle("is-ok", info.ok);
  };
  setPill("#pill-icon", diag.triad.icon);
  setPill("#pill-text", diag.triad.text);
  setPill("#pill-group", diag.triad.group);

  // 三个公式框数值与按钮激活态
  $("#rng-scale").value = String(state.iconScale);
  $("#out-scale").textContent = `${m.iconScale.toFixed(2)}×`;
  $("#rng-gap").value = String(Math.round(state.internalGap));
  $("#out-gap").textContent = `内 ${m.internalGap} / 外 ${m.groupGap}`;
  $("#rng-axis").value = String(Math.round(state.verticalOffset));
  $("#out-axis").textContent = `${m.verticalOffset > 0 ? "+" : ""}${m.verticalOffset}px`;
  $("#out-layout").textContent = state.layout === "vertical" ? "堆叠" : "横排";

  $("#btn-mismatch").setAttribute("aria-pressed", String(state.semanticMismatch));
  $("#btn-no-icon").setAttribute("aria-pressed", String(state.mode === "text-only"));
  $("#btn-mode-both").classList.toggle("is-on", state.mode === "both");
  $("#btn-mode-icon").classList.toggle("is-on", state.mode === "icon-only");
  $("#btn-lay-h").classList.toggle("is-on", state.layout === "horizontal");
  $("#btn-lay-v").classList.toggle("is-on", state.layout === "vertical");
  $("#btn-guides").setAttribute("aria-pressed", String(state.showGuides));
  $("#btn-guides").textContent = `标尺线：${state.showGuides ? "开" : "关"}`;

  // 实黑成品与诊断匣
  const slab = $("#result-slab");
  slab.classList.toggle("is-ok", diag.ok);
  $("#slab-icon").innerHTML =
    state.mode === "text-only"
      ? `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="#F6E0C1" stroke-dasharray="4 3" stroke-width="1.6"/></svg>`
      : iconSvg(selCell.activeIconId, { size: 40 });
  $("#slab-item-title").textContent = state.mode === "icon-only" ? "???" : selCell.item.title;
  $("#slab-item-en").textContent = state.mode === "icon-only" ? "NO LABEL" : selCell.item.en;

  $("#m-in").textContent = `${m.internalGap}px`;
  $("#m-out").textContent = `${m.groupGap}px`;
  $("#m-ratio").textContent = `${m.ratio}×`;

  const fixBtn = $("#btn-quick-fix");
  if (diag.ok) {
    $("#diag-title").textContent = `✓ ${diag.styleName} · 图文一体`;
    $("#diag-why").textContent = diag.okSummary;
    fixBtn.textContent = "试错：复原开场坏态";
    fixBtn.dataset.fixMode = "reset";
  } else {
    $("#diag-title").textContent = diag.primary.title;
    $("#diag-why").textContent = diag.primary.why;
    fixBtn.textContent = diag.primary.actionLabel;
    fixBtn.dataset.fixMode = "fix";
  }
  $("#slab-css").textContent = diag.css;

  dirty = true;
  heroLoop.draw();
}

const heroLoop = loop(canvas, (t, dt, opts) => {
  if (dirty || opts.still) drawHeroFrame(t, dt, opts);
});

// 画布直接交互（鼠标 + 触摸 + 键盘）
let dragInfo = null;

function pointerPos(ev) {
  const rect = canvas.getBoundingClientRect();
  return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
}

function hitTestCell(x, y) {
  if (!lastLayout) return { cellIdx: -1, onIcon: false };
  for (const c of lastLayout.cells) {
    const r = c.cellRect;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      const onIcon =
        c.iconRect &&
        Math.hypot(x - c.iconRect.cx, y - c.iconRect.cy) <= c.iconRect.r + 10;
      return { cellIdx: c.idx, onIcon: !!onIcon };
    }
  }
  return { cellIdx: -1, onIcon: false };
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  const p = pointerPos(e);
  const hit = hitTestCell(p.x, p.y);
  dragInfo = {
    pointerId: e.pointerId,
    startX: p.x,
    startY: p.y,
    startGap: state.internalGap,
    startAxis: state.verticalOffset,
    cellIdx: hit.cellIdx,
    onIcon: hit.onIcon,
    mode: null, // 'x' | 'y'
    moved: false,
  };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || e.pointerId !== dragInfo.pointerId) return;
  const p = pointerPos(e);
  const dx = p.x - dragInfo.startX;
  const dy = p.y - dragInfo.startY;
  if (!dragInfo.mode && Math.hypot(dx, dy) > 5) {
    dragInfo.moved = true;
    // 在圆盘上纯竖直拖才调纵轴；其余方向优先横向推拉图字内距（保证触屏体验顺手且 perf 拖测命中）
    dragInfo.mode = dragInfo.onIcon && Math.abs(dy) > Math.abs(dx) * 1.25 && state.layout === "horizontal" ? "y" : "x";
  }
  if (dragInfo.mode === "x") {
    const sensitivity = cssW < 520 ? 0.38 : 0.22;
    state.internalGap = clamp(Math.round(dragInfo.startGap + dx * sensitivity), 0, 52);
    // 靠近经典 16px 时轻微磁吸
    if (Math.abs(state.internalGap - 16) <= 1) state.internalGap = 16;
    anim.internalGap = state.internalGap;
    syncHeroUI();
  } else if (dragInfo.mode === "y") {
    state.verticalOffset = clamp(Math.round(dragInfo.startAxis + dy * 0.45), -18, 18);
    if (Math.abs(state.verticalOffset) <= 1) state.verticalOffset = 0;
    anim.verticalOffset = state.verticalOffset;
    syncHeroUI();
  }
});

function endPointer(e) {
  if (!dragInfo || e.pointerId !== dragInfo.pointerId) return;
  if (!dragInfo.moved && dragInfo.cellIdx >= 0) {
    state.selected = dragInfo.cellIdx;
    syncHeroUI();
  }
  dragInfo = null;
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// 兼容 CDP dispatchTouchEvent（tools/perf.mjs 发原生 touch 事件）
let touchDrag = null;
canvas.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  const t0 = e.touches[0];
  touchDrag = { x0: t0.clientX, y0: t0.clientY, gap0: state.internalGap, lockedX: false };
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  if (!touchDrag || !e.touches.length) return;
  const t0 = e.touches[0];
  const dx = t0.clientX - touchDrag.x0;
  const dy = t0.clientY - touchDrag.y0;
  if (!touchDrag.lockedX && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
    touchDrag.lockedX = true;
  }
  if (touchDrag.lockedX) {
    e.preventDefault();
    state.internalGap = clamp(Math.round(touchDrag.gap0 + dx * 0.35), 0, 52);
    anim.internalGap = state.internalGap;
    syncHeroUI();
  }
}, { passive: false });

canvas.addEventListener("touchend", () => { touchDrag = null; }, { passive: true });

// 键盘操控画布
canvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 6 : 2;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.internalGap = clamp(state.internalGap - step, 0, 52);
    syncHeroUI();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.internalGap = clamp(state.internalGap + step, 0, 52);
    syncHeroUI();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.verticalOffset = clamp(state.verticalOffset - step, -18, 18);
    syncHeroUI();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.verticalOffset = clamp(state.verticalOffset + step, -18, 18);
    syncHeroUI();
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    state.selected = (state.selected + 1) % 6;
    syncHeroUI();
  }
});

// 场景切换
$$(".scene-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    $$(".scene-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    syncHeroUI();
  });
});

// 底部三个公式框控件
$("#rng-scale").addEventListener("input", (e) => {
  state.iconScale = parseFloat(e.target.value);
  if (state.mode === "text-only") state.mode = "both";
  syncHeroUI();
});
$("#rng-gap").addEventListener("input", (e) => {
  state.internalGap = parseInt(e.target.value, 10);
  syncHeroUI();
});
$("#rng-axis").addEventListener("input", (e) => {
  state.verticalOffset = parseInt(e.target.value, 10);
  state.layout = "horizontal";
  syncHeroUI();
});

$("#btn-mismatch").addEventListener("click", () => {
  state.semanticMismatch = !state.semanticMismatch;
  if (state.mode !== "both") state.mode = "both";
  syncHeroUI();
});
$("#btn-no-icon").addEventListener("click", () => {
  state.mode = state.mode === "text-only" ? "both" : "text-only";
  syncHeroUI();
});
$("#btn-mode-both").addEventListener("click", () => {
  state.mode = "both";
  syncHeroUI();
});
$("#btn-mode-icon").addEventListener("click", () => {
  state.mode = "icon-only";
  syncHeroUI();
});
$("#btn-lay-h").addEventListener("click", () => {
  state.layout = "horizontal";
  syncHeroUI();
});
$("#btn-lay-v").addEventListener("click", () => {
  state.layout = "vertical";
  state.verticalOffset = 0;
  syncHeroUI();
});
$("#btn-guides").addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncHeroUI();
});

// 一键校准主错态 / 展开实时 CSS
$("#btn-quick-fix").addEventListener("click", () => {
  if ($("#btn-quick-fix").dataset.fixMode === "reset") {
    Object.assign(state, PRESETS.broken);
  } else if (lastDiag && lastDiag.primary) {
    Object.assign(state, lastDiag.primary.fix);
  }
  syncHeroUI();
});

$("#btn-toggle-css").addEventListener("click", (e) => {
  const pre = $("#slab-css");
  const open = pre.hidden;
  pre.hidden = !open;
  e.currentTarget.setAttribute("aria-expanded", String(open));
});

// 快捷预设带
$$(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    Object.assign(state, {
      internalGap: p.internalGap,
      iconScale: p.iconScale,
      verticalOffset: p.verticalOffset,
      mode: p.mode,
      layout: p.layout,
      semanticMismatch: p.semanticMismatch,
    });
    syncHeroUI();
  });
});

// ═══════════════════════════════════════════════════════════════
// 01 为什么图标需要文字：4 图标盲测 + 三模式对照
// ═══════════════════════════════════════════════════════════════
const BLIND_ITEMS = [
  {
    id: "bookmark",
    q: "这枚丝带图标在界面里代表什么？",
    options: ["收藏夹", "稍后阅读", "文档书签"],
    reveal: "三个都对！浏览器用它存书签、社交 App 当「收藏」、阅读器叫「稍后读」——离了文字标签谁都拿不准。",
  },
  {
    id: "explore",
    q: "这枚指南针图标点进去是什么？",
    options: ["发现广场", "附近地图", "新手引导"],
    reveal: "Safari 用它做图标、社区 App 叫「发现」、工具产品当「导览」。同一符号跨产品含义完全漂移。",
  },
  {
    id: "settings",
    q: "这组三杠滑块图标是干嘛的？",
    options: ["筛选条件", "系统设置", "均衡器"],
    reveal: "电商里是「筛选」，后台系统当「偏好设置」，音乐软件是「音效调节」——没有文字就只能盲点。",
  },
  {
    id: "export",
    q: "方框加向上箭头代表哪项操作？",
    options: ["导出文件", "分享链接", "上传云端"],
    reveal: "iOS 生态常作「分享」，设计工具多指「导出」，网盘则容易被误读成「上传」。补上两字动词立刻消歧。",
  },
];

const blindPicked = new Map();

function renderSection01() {
  const grid = $("#s1-grid");
  grid.innerHTML = BLIND_ITEMS.map((item, idx) => {
    const picked = blindPicked.get(idx);
    return `
      <div class="blind-card">
        <div class="blind-icon-row">
          <span class="blind-disc">${iconSvg(item.id, { size: 36, disc: false })}</span>
          <span class="blind-q">${item.q}</span>
        </div>
        <div class="blind-choices">
          ${item.options
            .map(
              (opt) =>
                `<button type="button" class="blind-choice${picked === opt ? " is-picked" : ""}" data-bidx="${idx}" data-bval="${opt}">${opt}</button>`
            )
            .join("")}
        </div>
        ${picked ? `<p class="blind-reveal">你选了「${picked}」——${item.reveal}</p>` : ""}
      </div>
    `;
  }).join("");

  $("#s1-score").textContent = `已测 ${blindPicked.size} / ${BLIND_ITEMS.length}`;
  $$(".blind-choice", grid).forEach((btn) => {
    btn.addEventListener("click", () => {
      blindPicked.set(Number(btn.dataset.bidx), btn.dataset.bval);
      renderSection01();
    });
  });
}

const S1_COMPARE = [
  { id: "bookmark", label: "收藏" },
  { id: "explore", label: "发现" },
  { id: "settings", label: "筛选" },
  { id: "export", label: "导出" },
];
const S1_NOTES = {
  icon: "纯图标模式：4 枚图形虽然省空间，但丝带、指南针、滑块、上箭在不同产品里含义漂移，初次使用时必须靠猜或试错。",
  text: "纯文字模式：含义明确了，但四个矩形按钮长得一模一样，眼睛失去了图形轮廓的预注意锚点，每次都要逐字读完才能点中。",
  both: "图标 + 文字模式：图形先用形状在余光里定位，文字在同一瞬间把含义钉死——双通道互为保险，兼顾速度与准确度。",
};

function renderS1Compare(mode) {
  const bar = $("#s1-bar");
  bar.innerHTML = S1_COMPARE.map((it) => {
    const ico = mode !== "text" ? iconSvg(it.id, { size: 22, disc: true }) : "";
    const txt = mode !== "icon" ? `<span>${it.label}</span>` : "";
    return `<span class="cmp-item">${ico}${txt}</span>`;
  }).join("");
  $("#s1-note").textContent = S1_NOTES[mode];
}

$$("[data-s1-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$("[data-s1-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderS1Compare(btn.dataset.s1Mode);
  });
});

// ═══════════════════════════════════════════════════════════════
// 02 亲密性与光学对齐：SVG 标尺显微镜（单真源 S2_EM_RATIO = 1.15）
// ═══════════════════════════════════════════════════════════════
const S2_EM_RATIO = 1.15;
const s2 = { kind: "btn", align: "center", fontSize: 18, unit: "em" };

function renderSection02() {
  const f = s2.fontSize;
  const iconSize = s2.unit === "em" ? Math.round(f * S2_EM_RATIO) : 16;
  const gap = Math.round(f * 0.52);

  // 容器文字行数与行框几何
  const lines =
    s2.kind === "btn"
      ? [{ text: "导出离线文件", size: f, weight: 800 }]
      : s2.kind === "menu"
        ? [
            { text: "同步项目档案", size: f, weight: 800 },
            { text: "自动保留最近 30 天改动", size: Math.max(12, Math.round(f * 0.72)), weight: 500 },
          ]
        : [
            { text: "灵感 IDEA", size: f, weight: 900 },
            { text: "捕捉想法，激发创造与思考。", size: Math.max(12, Math.round(f * 0.72)), weight: 500 },
            { text: "图文协同形成清晰视觉锚点", size: Math.max(12, Math.round(f * 0.72)), weight: 500 },
          ];

  const lineHeights = lines.map((l) => Math.round(l.size * 1.38));
  const blockH = lineHeights.reduce((a, b) => a + b, 0);
  const svgW = 540;
  const svgH = 200;
  const boxTop = Math.round((svgH - Math.max(blockH, iconSize)) * 0.5);
  const boxH = Math.max(blockH, iconSize);
  const textTop = boxTop + Math.round((boxH - blockH) * 0.5);

  const firstMidY = textTop + Math.round(lineHeights[0] * 0.5);
  const firstBaseY = firstMidY + Math.round(lines[0].size * 0.38);
  const blockMidY = textTop + Math.round(blockH * 0.5);

  let iconTop = boxTop;
  if (s2.align === "start") iconTop = Math.round(firstMidY - iconSize * 0.5);
  else if (s2.align === "baseline") iconTop = firstBaseY - iconSize;
  else if (s2.align === "center") iconTop = Math.round(blockMidY - iconSize * 0.5);
  else if (s2.align === "end") iconTop = textTop + blockH - iconSize;

  const iconMidY = iconTop + iconSize * 0.5;
  const iconX = 76;
  const textX = iconX + iconSize + gap;

  let curY = textTop;
  const textEls = lines
    .map((l, i) => {
      const midY = curY + Math.round(lineHeights[i] * 0.5);
      curY += lineHeights[i];
      return `<text x="${textX}" y="${midY}" dominant-baseline="central" font-size="${l.size}" font-weight="${l.weight}" font-family="Noto Sans SC, sans-serif" fill="#11120D">${l.text}</text>`;
    })
    .join("");

  const discSvg = iconSvg(s2.kind === "btn" ? "export" : s2.kind === "menu" ? "cloud" : "idea", {
    size: iconSize,
    disc: true,
  });

  const frameTop = boxTop - 16;
  const frameH = boxH + 32;
  const rulerY = frameTop - 10;
  const refTextMidY = s2.kind === "btn" ? firstMidY : blockMidY;

  $("#s2-svg-host").innerHTML = `
    <svg viewBox="0 0 ${svgW} ${svgH}" role="img" aria-label="图标与文字光学对齐标尺示意">
      <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#FAF2E4"/>
      <rect x="46" y="${frameTop}" width="${svgW - 92}" height="${frameH}" fill="#FFFBF4" stroke="#11120D" stroke-width="1.5"/>
      <!-- 首行基线（墨黑） -->
      <line x1="20" y1="${firstBaseY}" x2="${svgW - 20}" y2="${firstBaseY}" stroke="#11120D" stroke-width="1.1" stroke-dasharray="3 3" opacity="0.6"/>
      <!-- 图标中心轴（柿红） -->
      <line x1="20" y1="${iconMidY}" x2="${svgW - 20}" y2="${iconMidY}" stroke="#EC4109" stroke-width="2"/>
      <!-- 字体视觉中线（钴蓝虚线叠画，重合时蓝红交替一眼可辨） -->
      <line x1="20" y1="${refTextMidY}" x2="${svgW - 20}" y2="${refTextMidY}" stroke="#2950A5" stroke-width="2" stroke-dasharray="7 5"/>
      <!-- 内距卡尺（稳居外框上方留白，不压边线） -->
      <line x1="${iconX + iconSize}" y1="${rulerY}" x2="${textX}" y2="${rulerY}" stroke="#11120D" stroke-width="1.5"/>
      <line x1="${iconX + iconSize}" y1="${rulerY - 4}" x2="${iconX + iconSize}" y2="${rulerY + 4}" stroke="#11120D" stroke-width="1.5"/>
      <line x1="${textX}" y1="${rulerY - 4}" x2="${textX}" y2="${rulerY + 4}" stroke="#11120D" stroke-width="1.5"/>
      <text x="${iconX + iconSize + gap * 0.5}" y="${rulerY - 8}" text-anchor="middle" font-size="11" font-family="Space Mono, monospace" fill="#11120D">内距 ${gap}px</text>
      <!-- 图标 -->
      <g transform="translate(${iconX}, ${iconTop})">${discSvg}</g>
      <!-- 文字 -->
      ${textEls}
      <!-- 图标实测尺寸签（稳居外框下方留白） -->
      <text x="${iconX + iconSize * 0.5}" y="${frameTop + frameH + 17}" text-anchor="middle" font-size="11" font-family="Space Mono, monospace" fill="#B02700">图标 ${iconSize}px</text>
    </svg>
  `;

  // 实时诊断文案与 CSS
  const ratio = +(iconSize / f).toFixed(2);
  const scaleTooSmall = ratio < 0.78;
  let ok = true;
  let verdict = "✓ 光学对齐均衡";
  let head = "图标与文字权重相称，视线顺滑横扫";
  let body = "";

  if (scaleTooSmall) {
    ok = false;
    verdict = `× 固定 ${iconSize}px 掉队`;
    head = `字号放大到 ${f}px 后，固定 16px 图标明显缩水（仅 ${ratio}×）`;
    body = `把图标尺寸写死为 px 时，一旦标题放大或用户开启系统大字号，图标就缩在角落失去锚点。改用相对单位 em（如 ${S2_EM_RATIO}em）就能随字号自动同步缩放。`;
  } else if (s2.align === "baseline") {
    ok = false;
    verdict = "× 基线顶起失衡";
    head = "align-items: baseline 把图标底边硬压到字脚，整个图标往上飘";
    body = "几何圆标或方标没有西文字母的下伸部，对齐到文字基线（baseline）后，图标重心会明显高于文字中线，看起来像漂在字头顶。";
  } else if (s2.align === "end") {
    ok = false;
    verdict = "× 沉底拖拽";
    head = "图标沉到文字块最底沿，重心下坠";
    body = "眼睛习惯从左上角开始读标题。图标沉在底沿会让视线先撞空、再往下捞图，破坏「先图形定位、再读标题」的顺序。";
  } else if (s2.align === "start" && s2.kind === "btn") {
    ok = false;
    verdict = "× 单行顶齐易偏";
    head = "单行按钮用 flex-start 容易在行高增大时与文字视觉中心错开";
    body = "单行按钮与单行导航项应优先用 align-items: center，让图标和行内文字共用一条水平中轴。";
  } else if (s2.align === "start" && s2.kind !== "btn") {
    ok = true;
    verdict = "✓ 多行首行锚定";
    head = "多行列表里对准首行标题中线，眼睛第一眼先落到主题";
    body = "当右侧有 2–3 行文字甚至更长说明时，让图标对齐首行标题中线（flex-start 配微距上补）是界面工程里最稳妥的常规解。";
  } else {
    ok = true;
    verdict = s2.kind === "card" ? "✓ 卡片整块居中" : "✓ 光学居中均衡";
    head = s2.kind === "card" ? "图标对准紧凑图文块中心，贴近 254 原海报气度" : "图标与文字共享同一条光学水平中轴";
    const unitDesc = s2.unit === "em" ? `${S2_EM_RATIO}em（当前 ${iconSize}px）` : `固定 ${iconSize}px（${ratio}× 字号）`;
    body = `当前图标 ${unitDesc}、图字内距 ${gap}px。使用 inline-flex 与 ${S2_EM_RATIO}em 相对尺度，无需写死像素魔数就能跨字号保持对齐。`;
  }

  const vEl = $("#s2-verdict");
  vEl.textContent = verdict;
  vEl.classList.toggle("is-bad", !ok);
  $("#s2-head").textContent = head;
  $("#s2-body").textContent = body;
  $("#s2-font-out").textContent = `${f}px`;

  const alignCss =
    s2.align === "start"
      ? "flex-start"
      : s2.align === "baseline"
        ? "baseline"
        : s2.align === "end"
          ? "flex-end"
          : "center";
  const sizeCss = s2.unit === "em" ? `${S2_EM_RATIO}em` : "16px";
  $("#s2-css").textContent = `.icon-label {\n  display: inline-flex;\n  align-items: ${alignCss};\n  gap: 0.52em; /* 当前 ${gap}px */\n  font-size: ${f}px;\n}\n.icon-label svg {\n  width: ${sizeCss}; /* 当前 ${iconSize}px */\n  height: ${sizeCss};\n  flex: none;\n}`;
}

$$("[data-s2-kind]").forEach((b) =>
  b.addEventListener("click", () => {
    s2.kind = b.dataset.s2Kind;
    $$("[data-s2-kind]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderSection02();
  })
);
$$("[data-s2-align]").forEach((b) =>
  b.addEventListener("click", () => {
    s2.align = b.dataset.s2Align;
    $$("[data-s2-align]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderSection02();
  })
);
$$("[data-s2-unit]").forEach((b) =>
  b.addEventListener("click", () => {
    s2.unit = b.dataset.s2Unit;
    $$("[data-s2-unit]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderSection02();
  })
);
$("#s2-font-range").addEventListener("input", (e) => {
  s2.fontSize = parseInt(e.target.value, 10);
  renderSection02();
});

// ═══════════════════════════════════════════════════════════════
// 03 三类真实界面拆解（真实 DOM 微原型）
// ═══════════════════════════════════════════════════════════════
const s3a = { count: 4, labels: true, hitbox: false };
const TAB_POOL = [
  { id: "home", label: "首页" },
  { id: "explore", label: "发现" },
  { id: "bookmark", label: "收藏" },
  { id: "bell", label: "通知" },
  { id: "search", label: "搜索" },
  { id: "settings", label: "设置" },
];

function renderS3A() {
  const bar = $("#s3a-bar");
  const list = TAB_POOL.slice(0, s3a.count);
  bar.style.gridTemplateColumns = `repeat(${s3a.count}, minmax(0, 1fr))`;
  bar.classList.toggle("show-hitbox", s3a.hitbox);
  bar.classList.toggle("is-crowded", s3a.count > 5);
  bar.innerHTML = list
    .map(
      (it, idx) =>
        `<span class="mock-tab${idx === 0 ? " is-active-tab" : ""}">${iconSvg(it.id, { size: 22, disc: true })}${s3a.labels ? `<span>${it.label}</span>` : ""}</span>`
    )
    .join("");

  let msg = "4 项「上图下文」排布，每格宽度充裕、触控热区轻松超过 44×44px，图标和两字标签互不挤压。";
  if (s3a.count === 6 && !s3a.labels) {
    msg = "6 项硬塞且隐藏文字：不仅窄屏热区逼近误触边缘，后三枚图标还变成无字猜谜。";
  } else if (s3a.count === 6) {
    msg = "6 项硬塞底栏：在 390px 手机上每格只剩约 58px 宽，相邻标签几乎贴边，拇指点击极易误触邻项。";
  } else if (!s3a.labels) {
    msg = "关掉底栏文字后，新用户很难第一时间分辨「发现」和「收藏」点进去分别是什么内容。";
  }
  $("#s3a-diag").textContent = msg;
}

$$("[data-s3a-count]").forEach((b) =>
  b.addEventListener("click", () => {
    s3a.count = Number(b.dataset.s3aCount);
    $$("[data-s3a-count]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderS3A();
  })
);
$("#s3a-labels").addEventListener("click", (e) => {
  s3a.labels = !s3a.labels;
  e.currentTarget.setAttribute("aria-pressed", String(s3a.labels));
  renderS3A();
});
$("#s3a-hitbox").addEventListener("click", (e) => {
  s3a.hitbox = !s3a.hitbox;
  e.currentTarget.setAttribute("aria-pressed", String(s3a.hitbox));
  renderS3A();
});

const S3B_ITEMS = [
  { id: "export", verb: "导出", long: "立即把当前文稿导出为离线文件" },
  { id: "schedule", verb: "定时", long: "设置自动发送的时间窗口" },
  { id: "lock", verb: "加锁", long: "冻结此版本禁止他人修改" },
];

function renderS3B(style) {
  const bar = $("#s3b-bar");
  bar.innerHTML = S3B_ITEMS.map((it) => {
    const ico = iconSvg(it.id, { size: 22, disc: true });
    const txt = style === "icon" ? "" : `<span>${style === "verb" ? it.verb : it.long}</span>`;
    return `<button type="button" class="mock-act-btn" aria-label="${it.verb}">${ico}${txt}</button>`;
  }).join("");
  const diag = {
    icon: "纯图标按钮虽然最窄，但「导出 / 定时 / 加锁」脱离文字后必须悬停看提示，触屏设备甚至没有悬停；热区也缩小到单图标尺寸。",
    verb: "「图标 + 2 字动词」最利落：图形先分清方向，动词直指结果；整枚按钮天然满足 WCAG 2.2 的 24×24px 最小点击目标（移动端建议 ≥ 44px）。",
    long: "把整句说明塞进按钮后，按钮折行撑爆工具栏，图标反而淹没在冗长文案里——详细解释应移到次级说明，不要压在按钮标签上。",
  };
  $("#s3b-diag").textContent = diag[style];
}

$$("[data-s3b-style]").forEach((b) =>
  b.addEventListener("click", () => {
    $$("[data-s3b-style]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderS3B(b.dataset.s3bStyle);
  })
);

const s3c = { mode: "combo", cvd: false };
function renderS3C() {
  const host = $("#s3c-alerts");
  host.classList.toggle("is-cvd", s3c.cvd);
  const checkIcon = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#F6E0C1"/><polyline points="7,12.5 10.5,16 17,9" fill="none" stroke="#11120D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const warnIcon = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,3 22,20 2,20" fill="#F6E0C1"/><line x1="12" y1="9" x2="12" y2="14" stroke="#11120D" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.4" fill="#11120D"/></svg>`;

  if (s3c.mode === "color") {
    host.innerHTML = `
      <div class="mock-alert is-ok"><span>同步状态已更新</span></div>
      <div class="mock-alert is-err"><span>同步状态已更新</span></div>
    `;
  } else {
    host.innerHTML = `
      <div class="mock-alert is-ok">${checkIcon}<span>已保存：最新修改已同步到云端</span></div>
      <div class="mock-alert is-err">${warnIcon}<span>同步失败：请检查网络后重试</span></div>
    `;
  }
  $("#s3c-diag").innerHTML =
    s3c.mode === "color" && s3c.cvd
      ? "此刻两条提示在红绿色弱视野下几乎完全同色、字面又含糊，根本分不出哪条成功、哪条失败。切回「颜色 + 图标 + 文案」就能立刻救回可读性。"
      : "点开「红绿色弱模拟」再切「仅靠红绿底色」试试：颜色一旦失效，唯有圆形勾号 vs 三角警示的图形差异配具体文案能稳稳兜底；代码中给纯视觉强化图标标 <code>aria-hidden=\"true\"</code> 可避免读屏重复朗读。";
}

$$("[data-s3c-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    s3c.mode = b.dataset.s3cMode;
    $$("[data-s3c-mode]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderS3C();
  })
);
$("#s3c-cvd").addEventListener("click", (e) => {
  s3c.cvd = !s3c.cvd;
  e.currentTarget.setAttribute("aria-pressed", String(s3c.cvd));
  renderS3C();
});

// ═══════════════════════════════════════════════════════════════
// 04 历史年代档案抽屉
// ═══════════════════════════════════════════════════════════════
const TIMELINE = [
  {
    year: "1923 · 德国《心理学研究》",
    title: "Max Wertheimer 确立格式塔亲密性原则",
    body: "格式塔心理学创始人之一 Max Wertheimer 在 1923 年论文《Untersuchungen zur Lehre von der Gestalt II》中系统描述了亲密性法则：视网膜会把彼此靠近的图形自动编为同一组。这成了图标文字组合最底层的几何铁律——图字内距必须明显小于组间外距。",
    takeaway: "落地要点：检查任何横排导航或卡片时，先比对「图到字」和「这组到下组」的距离，确保外距明显大于内距。",
    cite: "出处：Max Wertheimer (1923), Psychologische Forschung；英译见 York University Classics。",
    svg: `<svg viewBox="0 0 220 150"><rect width="220" height="150" fill="#FAF2E4"/><g fill="#11120D"><circle cx="34" cy="46" r="10"/><rect x="52" y="40" width="38" height="12" rx="2"/><circle cx="132" cy="46" r="10" fill="#2950A5"/><rect x="150" y="40" width="38" height="12" rx="2"/></g><line x1="44" y1="74" x2="52" y2="74" stroke="#EC4109" stroke-width="2.5"/><line x1="90" y1="74" x2="122" y2="74" stroke="#11120D" stroke-width="2" stroke-dasharray="3 3"/><text x="48" y="96" text-anchor="middle" font-size="10.5" font-family="Space Mono, monospace" fill="#B02700">近=同组</text><text x="106" y="96" text-anchor="middle" font-size="10.5" font-family="Space Mono, monospace" fill="#11120D">远=分界</text><text x="110" y="132" text-anchor="middle" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif" fill="#11120D">Law of Proximity (1923)</text></svg>`,
  },
  {
    year: "1925–1936 · 维也纳社会与经济博物馆",
    title: "Otto Neurath、Marie Neurath 与 Gerd Arntz 创立 ISOTYPE",
    body: "1925 年起，哲学家 Otto Neurath 与「转译者」Marie Neurath、平面艺术家 Gerd Arntz（1928 年加入）共同打造了国际象形教育体系 ISOTYPE（1936 年出版《International Picture Language》）。他们用极简剪影图形配合严谨标题与图注，让普通市民跨语言读懂社会统计，确立了现代信息图标的图形克制法则。",
    takeaway: "落地要点：同一组图标必须共享一致的笔触粗细、圆角与视觉体量，文字负责给出清晰尺度与语境。",
    cite: "出处：Otto Neurath (1936), International Picture Language；雷丁大学 Isotype Revisited 档案。",
    svg: `<svg viewBox="0 0 220 150"><rect width="220" height="150" fill="#FAF2E4"/><text x="20" y="28" font-size="11" font-weight="700" font-family="Space Mono, monospace" fill="#11120D">ISOTYPE · 1 UNIT = 1M</text><line x1="20" y1="36" x2="200" y2="36" stroke="#11120D" stroke-width="1.5"/>${[0, 1, 2, 3].map((i) => `<g transform="translate(${34 + i * 38},54)"><circle cx="10" cy="8" r="6" fill="${i === 3 ? "#2950A5" : "#11120D"}"/><path d="M1,32 A9,9 0 0,1 19,32 Z" fill="${i === 3 ? "#2950A5" : "#11120D"}"/></g>`).join("")}<line x1="20" y1="102" x2="200" y2="102" stroke="#11120D" stroke-width="1.2" stroke-dasharray="3 3"/><text x="20" y="124" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif" fill="#B02700">图形统一重复 + 文字定标尺</text></svg>`,
  },
  {
    year: "1971 & 1986 · 认知心理学里程碑",
    title: "Allan Paivio 提出双重编码理论",
    body: "Paivio 在 1971 年《Imagery and Verbal Processes》及 1986 年《Mental Representations》中提出，人类记忆存在非语言表象（Imagen）与语言符号（Logogen）两套可相互激活的编码通道。同时调用图形与文字，比单一通道更易建立检索路径——前提是两者语义一致而非冲突。",
    takeaway: "落地要点：别拿风马牛不相及的装饰图形凑数；图标隐喻与文字概念必须指向同一件事。",
    cite: "出处：Allan Paivio (1971), Holt, Rinehart & Winston；(1986), Oxford University Press。",
    svg: `<svg viewBox="0 0 220 150"><rect width="220" height="150" fill="#FAF2E4"/><rect x="18" y="34" width="76" height="58" fill="#11120D"/><circle cx="56" cy="63" r="17" fill="#F6E0C1"/><polygon points="56,51 67,71 45,71" fill="#2950A5"/><rect x="126" y="34" width="76" height="58" fill="#FFFBF4" stroke="#11120D" stroke-width="2"/><text x="164" y="68" text-anchor="middle" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif" fill="#11120D">目标</text><line x1="94" y1="54" x2="126" y2="54" stroke="#EC4109" stroke-width="2.5"/><line x1="94" y1="72" x2="126" y2="72" stroke="#2950A5" stroke-width="2.5"/><text x="56" y="116" text-anchor="middle" font-size="11.5" font-weight="700" fill="#11120D">图形表象</text><text x="164" y="116" text-anchor="middle" font-size="11.5" font-weight="700" fill="#11120D">语言编码</text></svg>`,
  },
  {
    year: "1981–1982 · Xerox 8010 Star 桌面革命",
    title: "图形用户界面首次定型「桌面图标 + 文字标签」",
    body: "1981 年推出的 Xerox 8010 Star 将办公桌搬进屏幕。设计团队（David Canfield Smith 等人）在 1982 年 4 月《BYTE》杂志论文《Designing the Star User Interface》中明确规范：文档、文件夹、打印机等每个桌面图标都紧配文字标签，并邀请平面设计师建立网格与反白选中规则，让「看见再点」真正落地。",
    takeaway: "落地要点：从第一代桌面 GUI 诞生起，图标就是与标签捆绑成对出现的，而非取代文字。",
    cite: "出处：Smith, Irby, Kimball, Verplank & Harslem (April 1982), BYTE Vol. 7 No. 4, pp. 242–282。",
    svg: `<svg viewBox="0 0 220 150"><rect width="220" height="150" fill="#FAF2E4"/><rect x="20" y="18" width="180" height="114" fill="#FFFBF4" stroke="#11120D" stroke-width="2"/><rect x="44" y="36" width="38" height="46" fill="#FAF2E4" stroke="#11120D" stroke-width="2"/><line x1="51" y1="50" x2="74" y2="50" stroke="#11120D" stroke-width="2"/><line x1="51" y1="60" x2="70" y2="60" stroke="#11120D" stroke-width="2"/><text x="63" y="102" text-anchor="middle" font-size="10.5" font-family="Space Mono, monospace" fill="#11120D">Report</text><rect x="132" y="36" width="38" height="46" fill="#11120D"/><line x1="139" y1="50" x2="162" y2="50" stroke="#F6E0C1" stroke-width="2"/><line x1="139" y1="60" x2="158" y2="60" stroke="#F6E0C1" stroke-width="2"/><rect x="122" y="90" width="58" height="18" fill="#11120D"/><text x="151" y="102" text-anchor="middle" font-size="10.5" font-family="Space Mono, monospace" fill="#F6E0C1">Selected</text></svg>`,
  },
  {
    year: "1999 & 2014 · 可用性工程的实证纠偏",
    title: "Wiedenbeck 与 NN/g 证明：纯图标不是极简，而是负担",
    body: "界面扁平化风潮一度流行删掉所有文字只留细线图标。但 Susan Wiedenbeck (1999) 的学习与记忆实验以及 Aurora Harley (2014) 在 Nielsen Norman Group 的总结均显示：纯图标会让新手显著减速与困惑；唯有「清晰图标 + 常驻文字标签」才能兼得视觉锚点与零猜谜理解。",
    takeaway: "落地要点：主导航与关键动作永远优先常驻简短标签，不要把文字藏进悬停气泡。",
    cite: "出处：Wiedenbeck (1999), DOI 10.1080/014492999119129；Aurora Harley (2014), NN/g Icon Usability。",
    svg: `<svg viewBox="0 0 220 150"><rect width="220" height="150" fill="#FAF2E4"/><text x="18" y="32" font-size="11.5" font-weight="700" fill="#11120D">纯图标</text><rect x="78" y="20" width="54" height="16" fill="#B02700"/><text x="140" y="32" font-size="10.5" font-family="Space Mono, monospace" fill="#B02700">易猜错</text><text x="18" y="72" font-size="11.5" font-weight="700" fill="#11120D">纯文字</text><rect x="78" y="60" width="90" height="16" fill="#2950A5"/><text x="174" y="72" font-size="10.5" font-family="Space Mono, monospace" fill="#1A3C87">清晰</text><text x="18" y="112" font-size="11.5" font-weight="700" fill="#11120D">图+文</text><rect x="78" y="100" width="118" height="16" fill="#126346"/><text x="110" y="138" text-anchor="middle" font-size="11" font-family="Noto Sans SC, sans-serif" fill="#3C3730">（定性趋势示意，非单一百分比）</text></svg>`,
  },
  {
    year: "2019–2023 · 内在布局原语与无障碍底线",
    title: "Every Layout《The Icon》与 WCAG 2.2 规范落地",
    body: "Heydon Pickering 与 Andy Bell 在《Every Layout》中把「图标文字组合」抽象为独立布局原语：用 inline-flex、gap、em 相对单位与 currentColor 彻底告别手写负边距。2023 年发布的 W3C WCAG 2.2 又以 SC 2.5.8 明确 24×24 CSS 像素最小点击区，配合 SC 1.4.11（图形对比度 ≥ 3:1）与 aria-hidden=\"true\"，构成了今天的工程标准。",
    takeaway: "落地要点：工程实现交给 inline-flex + em + flex: none + aria-hidden，可跨字号与设备一次写稳。",
    cite: "出处：Every Layout (every-layout.dev/layouts/icon/)；W3C WCAG 2.2 (2023)。",
    svg: `<svg viewBox="0 0 220 150"><rect width="220" height="150" fill="#11120D"/><rect x="28" y="42" width="164" height="54" fill="#1C1C16" stroke="#6CE2B4" stroke-dasharray="4 3" stroke-width="1.6"/><circle cx="62" cy="69" r="14" fill="#F6E0C1"/><polygon points="62,60 70,76 54,76" fill="#2950A5"/><text x="88" y="74" font-size="15" font-weight="700" font-family="IBM Plex Sans, sans-serif" fill="#F6E0C1">inline-flex</text><text x="110" y="124" text-anchor="middle" font-size="10.5" font-family="Space Mono, monospace" fill="#6CE2B4">≥ 24×24px · 1em · currentColor</text></svg>`,
  },
];

function renderTimeline(idx) {
  const item = TIMELINE[idx] || TIMELINE[0];
  $("#s4-year").textContent = item.year;
  $("#s4-title").textContent = item.title;
  $("#s4-body").textContent = item.body;
  $("#s4-takeaway").textContent = item.takeaway;
  $("#s4-cite").textContent = item.cite;
  $("#s4-svg").innerHTML = item.svg;
  $$(".tl-node").forEach((n, i) => {
    const on = i === idx;
    n.classList.toggle("is-active", on);
    n.setAttribute("aria-selected", String(on));
  });
}

$$(".tl-node").forEach((btn) =>
  btn.addEventListener("click", () => renderTimeline(Number(btn.dataset.tl)))
);

// ═══════════════════════════════════════════════════════════════
// 05 什么时候用 / 什么时候别用（6 场景正反对照卡，3×2 齐整无孤卡，全 SVG 零缺字）
// ═══════════════════════════════════════════════════════════════
const miniDot = (shape, fill) =>
  shape === "tri"
    ? `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style="display:inline-block;vertical-align:-2px"><polygon points="8,2 15,14 1,14" fill="${fill}"/></svg>`
    : shape === "sq"
      ? `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style="display:inline-block;vertical-align:-2px"><rect x="2" y="2" width="12" height="12" fill="${fill}"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style="display:inline-block;vertical-align:-2px"><circle cx="8" cy="8" r="6" fill="${fill}"/></svg>`;

const TRIAGE = [
  {
    verdict: "别硬加图标",
    isUse: false,
    title: "长篇正文阅读段",
    badHtml: `<div style="display:flex;gap:6px;align-items:center">${miniDot("tri", "#B02700")}<span>第一段解释研究背景……</span></div><div style="display:flex;gap:6px;align-items:center">${miniDot("cir", "#B02700")}<span>第二段补充实验细节……</span></div>`,
    goodHtml: `<div>第一段解释研究背景……<br>第二段补充实验细节……</div>`,
    badNote: "每段正文前都挂一个装饰小图标，眼睛会不断被左缘杂形打断，连贯阅读被切碎。",
    goodNote: "长文靠段距、首行小标题和行宽建立节奏，把图标留给真正需要一眼区分的行动或警示。",
  },
  {
    verdict: "可免文字",
    isUse: false,
    title: "熟手高频密集工具条",
    badHtml: `<div style="display:flex;gap:6px;flex-wrap:wrap"><span><b>B</b> 加粗文字</span><span><i>I</i> 斜体文字</span><span><u>U</u> 下划线</span></div>`,
    goodHtml: `<div style="display:flex;gap:6px"><strong style="border:1.5px solid #111;padding:2px 8px">B</strong><strong style="border:1.5px solid #111;padding:2px 8px"><i>I</i></strong><strong style="border:1.5px solid #111;padding:2px 8px"><u>U</u></strong></div>`,
    badNote: "富文本编辑器的 B/I/U 或专业软件快捷键面板里，强行每项都带长标签会把 20 个高频命令撑成三行。",
    goodNote: "面对已形成全球肌肉记忆的极少数专业符号（B/I/U、撤销箭），纯图标配悬停提示与快捷键反而最高效。",
  },
  {
    verdict: "别硬凑隐喻",
    isUse: false,
    title: "高度抽象的业务名词",
    badHtml: `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span style="display:inline-flex;align-items:center;gap:4px">${miniDot("tri", "#B02700")}赋能增效</span><span style="display:inline-flex;align-items:center;gap:4px">${miniDot("sq", "#2950A5")}生态闭环</span><span style="display:inline-flex;align-items:center;gap:4px">${miniDot("cir", "#11120D")}战略对齐</span></div>`,
    goodHtml: `<div><strong>01</strong> 降低审核耗时 &nbsp; <strong>02</strong> 统一数据口径</div>`,
    badNote: "抽象空话找不到唯一具象物体，硬配三角形、方块或装饰图形只会分散阅读注意力。",
    goodNote: "概念抽象时，用清晰的编号（01 / 02）或直接写实短语，比牵强的装饰图标有力得多。",
  },
  {
    verdict: "别挤爆窄列",
    isUse: false,
    title: "极窄表格与紧凑筛选项",
    badHtml: `<div style="display:flex;gap:6px;align-items:center"><span style="width:24px;height:24px;border-radius:50%;background:#111;flex:none"></span><span style="line-height:1.15">已<br>完<br>成</span></div>`,
    goodHtml: `<div style="display:inline-flex;gap:6px;align-items:center;border:1.5px solid #126346;padding:2px 8px;color:#126346;font-weight:700">${miniDot("cir", "#126346")}已完成</div>`,
    badNote: "列宽只有 60px 还塞 24px 大图标，逼得汉字竖排折成糖葫芦。",
    goodNote: "空间极窄时把图标退化为 6px 语义色点或留纯文字，优先保证汉字不断行。",
  },
  {
    verdict: "推荐使用",
    isUse: true,
    title: "导航项与功能清单",
    badHtml: `<div style="display:flex;gap:10px;align-items:center"><span>仅图标：</span>${iconSvg("goal", { size: 22 })}${iconSvg("time", { size: 22 })}${iconSvg("idea", { size: 22 })}${iconSvg("learning", { size: 22 })}</div>`,
    goodHtml: `<div style="display:flex;gap:14px;flex-wrap:wrap;font-weight:800"><span style="display:inline-flex;align-items:center;gap:6px">${iconSvg("goal", { size: 22 })}目标</span><span style="display:inline-flex;align-items:center;gap:6px">${iconSvg("time", { size: 22 })}时间</span><span style="display:inline-flex;align-items:center;gap:6px">${iconSvg("idea", { size: 22 })}灵感</span></div>`,
    badNote: "少了文字，新手停在门口犹豫；少了图标，视觉扫描失去抓手。",
    goodNote: "254 原海报的主战场：每个单元既有可具象化的独立图标，又有 2–4 字简短定音标签，内紧外松一目了然。",
  },
  {
    verdict: "推荐使用",
    isUse: true,
    title: "状态提示与关键操作",
    badHtml: `<div style="display:flex;gap:8px;align-items:center"><span style="padding:2px 8px;background:#B02700;color:#fff;font-weight:700">状态变更</span><span>仅靠颜色，色弱读者难以分辨</span></div>`,
    goodHtml: `<div style="display:inline-flex;align-items:center;gap:8px;font-weight:800;color:#126346">${iconSvg("cloud", { size: 22 })}<span>已同步到云端（安全状态）</span></div>`,
    badNote: "只靠红绿背景色表达状态既违背无障碍规范，也缺少一眼可知的视觉动作提示。",
    goodNote: "用可辨图形 + 明确结果文案，即使在黑白屏幕或色觉受限环境下也能秒懂当前状态。",
  },
];

const triageBadState = TRIAGE.map(() => true);

function renderSection05() {
  const host = $("#s5-triage");
  host.innerHTML = TRIAGE.map((item, idx) => {
    const showBad = triageBadState[idx];
    return `
      <article class="triage-card">
        <div class="triage-top">
          <h3>${item.title}</h3>
          <span class="triage-verdict${item.isUse ? " is-use" : ""}">${item.verdict}</span>
        </div>
        <div class="triage-demo${showBad ? " is-bad-view" : ""}">
          <strong>${showBad ? "反例演示" : "克制取舍"}</strong>
          ${showBad ? item.badHtml : item.goodHtml}
        </div>
        <p class="triage-note">${showBad ? item.badNote : item.goodNote}</p>
        <button type="button" class="triage-toggle" data-tidx="${idx}">
          ${showBad ? "切看正确取舍 →" : "← 看回翻车反例"}
        </button>
      </article>
    `;
  }).join("");

  $$(".triage-toggle", host).forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.tidx);
      triageBadState[i] = !triageBadState[i];
      renderSection05();
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 06 单变量眼力测验（严格只差一个变量、中性 A/B/C/D 标签）
// ═══════════════════════════════════════════════════════════════
const QUIZZES = [
  {
    prompt: "题目 1 / 2：下面四条横向操作栏用了完全相同的图标、字号和文字，只改动了「图字内距与组间外距」。哪一组归属最清楚？",
    answer: 1, // B
    options: [
      { letter: "A", inGap: 2, outGap: 36, note: "内距 2px（贴撞首字） / 组距 36px" },
      { letter: "B", inGap: 10, outGap: 34, note: "内距 10px / 组距 34px（外距 3.4× 内距）" },
      { letter: "C", inGap: 24, outGap: 22, note: "内距 24px / 组距 22px（内距反超组距）" },
      { letter: "D", inGap: 30, outGap: 10, note: "内距 30px / 组距 10px（严重跨组错配）" },
    ],
    explain:
      "正确是 B。四组里 A 把内距压到 2px，圆标几乎撞进汉字左缘；C 与 D 让图字内距超过相邻两组的组距，格式塔亲密性把右侧圆标错绑到了左侧文字上；只有 B 既给图标和文字留出 10px 舒适呼吸缝，又用 34px 组距把三组操作干净分开。",
  },
  {
    prompt: "题目 2 / 2：下面四张双行功能卡片用了完全相同的 34px 圆标、字号、文案与 14px 内距，只改动了「图标的纵轴对齐位置」。哪一组视线最平稳？",
    answer: 1, // B
    options: [
      { letter: "A", offsetY: -14, note: "偏移 -14px（浮出首行上方）" },
      { letter: "B", offsetY: 0, note: "偏移 0px（光学居中对齐图文块）" },
      { letter: "C", offsetY: 11, note: "偏移 +11px（下坠偏向次行说明）" },
      { letter: "D", offsetY: 22, note: "偏移 +22px（沉底拖出末行下缘）" },
    ],
    explain:
      "正确是 B。四组图标尺寸与文字完全一致，唯一变量是纵轴位置：A 把圆标顶出标题上方，像未落地的贴纸；C 与 D 把圆标拽向次行甚至拖出文字底边，视线进卡先撞空白再往下捞图；只有 B 让圆标中心与双行文字块的视觉中线重合，横扫顺滑稳健。",
  },
];

let qIdx = 0;
let qPicked = null;

function buildQuizSvg(q, opt, reveal) {
  if (q === 0) {
    // 3 项横向工具栏：仅改 inGap / outGap
    const labels = ["目标", "时间", "灵感"];
    const icons = ["goal", "time", "idea"];
    const r = 11;
    const lblW = 36;
    const totalW = 3 * (r * 2 + opt.inGap + lblW) + 2 * opt.outGap;
    let x = Math.round((340 - totalW) * 0.5);
    const cy = 44;
    let body = "";
    for (let i = 0; i < 3; i++) {
      const cx = x + r;
      const tx = cx + r + opt.inGap;
      body += `<g transform="translate(${x}, ${cy - r})">${iconSvg(icons[i], { size: r * 2, disc: true })}</g>`;
      body += `<text x="${tx}" y="${cy + 5}" font-size="14" font-weight="800" font-family="Noto Sans SC, sans-serif" fill="#11120D">${labels[i]}</text>`;
      if (reveal && i === 0) {
        body += `<line x1="${cx + r}" y1="16" x2="${tx}" y2="16" stroke="#B02700" stroke-width="2"/><text x="${(cx + r + tx) * 0.5}" y="12" text-anchor="middle" font-size="10" font-family="Space Mono, monospace" fill="#B02700">内${opt.inGap}</text>`;
        const nx = tx + lblW;
        body += `<line x1="${nx}" y1="70" x2="${nx + opt.outGap}" y2="70" stroke="#1A3C87" stroke-width="2"/><text x="${nx + opt.outGap * 0.5}" y="82" text-anchor="middle" font-size="10" font-family="Space Mono, monospace" fill="#1A3C87">外${opt.outGap}</text>`;
      }
      x = tx + lblW + opt.outGap;
    }
    return `<svg viewBox="0 0 340 88">${body}</svg>`;
  } else {
    // 双行功能卡：严格单变量——相同 34px 圆标，仅改纵轴偏移 offsetY
    const d = 34;
    const textMidY = 47;
    const iy = Math.round(textMidY - d * 0.5 + opt.offsetY);
    const ix = 32;
    const tx = ix + d + 14;
    const guide = reveal
      ? `<line x1="10" y1="${iy + d * 0.5}" x2="330" y2="${iy + d * 0.5}" stroke="#EC4109" stroke-width="1.6"/><line x1="10" y1="${textMidY}" x2="330" y2="${textMidY}" stroke="#2950A5" stroke-width="1.6" stroke-dasharray="5 4"/>`
      : "";
    return `<svg viewBox="0 0 340 96">
      ${guide}
      <g transform="translate(${ix}, ${iy})">${iconSvg("idea", { size: d, disc: true })}</g>
      <text x="${tx}" y="37" dominant-baseline="central" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif" fill="#11120D">灵感 IDEA</text>
      <text x="${tx}" y="58" dominant-baseline="central" font-size="12.5" font-weight="500" font-family="Noto Sans SC, sans-serif" fill="#3C3730">捕捉想法，激发创造与思考。</text>
    </svg>`;
  }
}

function renderQuiz() {
  const q = QUIZZES[qIdx];
  $("#s6-prompt").textContent = q.prompt;
  const host = $("#s6-options");
  const answered = qPicked !== null;

  host.innerHTML = q.options
    .map((opt, idx) => {
      const isRight = answered && idx === q.answer;
      const isWrong = answered && idx === qPicked && idx !== q.answer;
      const cls = isRight ? " is-right" : isWrong ? " is-wrong" : "";
      const stateTxt = answered ? opt.note : "点此选择";
      return `
        <button type="button" class="quiz-opt${cls}" data-opt="${idx}">
          <div class="q-opt-head">
            <span class="q-letter">${opt.letter}</span>
            <span class="q-state">${stateTxt}</span>
          </div>
          <div class="q-svg-wrap">${buildQuizSvg(qIdx, opt, answered)}</div>
        </button>
      `;
    })
    .join("");

  $$(".quiz-opt", host).forEach((btn) => {
    btn.addEventListener("click", () => {
      qPicked = Number(btn.dataset.opt);
      renderQuiz();
    });
  });

  const fb = $("#s6-feedback");
  if (answered) {
    fb.hidden = false;
    const hit = qPicked === q.answer;
    $("#s6-result").textContent = hit
      ? `✓ 答对了！选项 ${q.options[q.answer].letter} 成立`
      : `再看一眼标尺：你选了 ${q.options[qPicked].letter}，正确应是 ${q.options[q.answer].letter}`;
    $("#s6-explain").textContent = q.explain;
  } else {
    fb.hidden = true;
  }
}

$$(".q-tab").forEach((btn) =>
  btn.addEventListener("click", () => {
    qIdx = Number(btn.dataset.q);
    qPicked = null;
    $$(".q-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderQuiz();
  })
);
$("#s6-retry").addEventListener("click", () => {
  qPicked = null;
  renderQuiz();
});

// ═══════════════════════════════════════════════════════════════
// 07 原海报缩放平移灯箱（只复用 #poster.src，不重复内联）
// ═══════════════════════════════════════════════════════════════
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbView = $("#lb-viewport");
let lbZoom = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbZoom})`;
  $("#lb-reset").textContent = `${Math.round(lbZoom * 100)}%`;
}

$("#poster-open").addEventListener("click", () => {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbZoom = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.showModal();
});
$("#lb-close").addEventListener("click", () => lightbox.close());
$("#lb-in").addEventListener("click", () => {
  lbZoom = clamp(lbZoom + 0.3, 0.6, 2.8);
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.3, 0.6, 2.8);
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbZoom = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});
lbView.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.15 : -0.15), 0.6, 2.8);
  applyLbTransform();
}, { passive: false });
lbView.addEventListener("pointerdown", (e) => {
  lbDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy };
  lbView.setPointerCapture(e.pointerId);
});
lbView.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbTx = lbDrag.tx + (e.clientX - lbDrag.x);
  lbTy = lbDrag.ty + (e.clientY - lbDrag.y);
  applyLbTransform();
});
lbView.addEventListener("pointerup", () => { lbDrag = null; });
lbView.addEventListener("pointercancel", () => { lbDrag = null; });

// ═══════════════════════════════════════════════════════════════
// 启动与监听
// ═══════════════════════════════════════════════════════════════
const ro = new ResizeObserver(() => {
  resizeHeroCanvas();
  syncHeroUI();
});
ro.observe(canvas);

resizeHeroCanvas();
syncHeroUI();
renderSection01();
renderS1Compare("icon");
renderSection02();
renderS3A();
renderS3B("verb");
renderS3C();
renderTimeline(0);
renderSection05();
renderQuiz();

if (reducedMotion.matches) {
  heroLoop.draw();
}
