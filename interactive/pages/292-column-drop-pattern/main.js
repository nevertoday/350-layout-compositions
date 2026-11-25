import { loop, pixelRatio } from "../../lib/stage.js";
import {
  SCENARIOS,
  RIGHT_SPINE_LABELS,
  PRESETS,
  VIEWPORT_MIN,
  VIEWPORT_MAX,
  COMFORT_MIN_W,
  createInitialState,
  evaluate,
  applyFix,
  clamp,
} from "./model.js";

const state = createInitialState();
let ev = evaluate(state);

// 平滑动画插值状态（单真源只读 state/ev，anim 仅负责视觉缓动）
const anim = {
  viewportW: state.viewportW,
  cols: [0, 1, 2, 3].map((i) => ({
    x: 0,
    y: 0,
    w: 0,
    h: state.heights[i],
    init: false,
  })),
  intro: 0,
  hitBoxes: {
    caps: [],
    ranks: [],
    faultBtns: [],
    corridor: { left: 0, right: 0, top: 0, bottom: 0 },
  },
};

// ==================== DOM 引用 ====================
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const dom = {
  statusPill: document.getElementById("hero-status-pill"),
  conceptText: document.getElementById("hero-concept-text"),
  bpMeta: document.getElementById("stage-bp-meta"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagDetail: document.getElementById("diag-detail"),
  diagActionRow: document.getElementById("diag-action-row"),
  diagActionText: document.getElementById("diag-action-text"),
  diagFixBtn: document.getElementById("diag-fix-btn"),
  mColW: document.getElementById("m-colw"),
  mDrop: document.getElementById("m-drop"),
  mSlope: document.getElementById("m-slope"),
  mTier: document.getElementById("m-tier"),
  ctrlVp: document.getElementById("ctrl-viewport"),
  valVp: document.getElementById("val-viewport"),
  ctrlMinW: document.getElementById("ctrl-minw"),
  valMinW: document.getElementById("val-minw"),
  ctrlOrderFlip: document.getElementById("ctrl-order-flip"),
  ctrlPrimaryTop: document.getElementById("ctrl-primary-top"),
  dotMatrix: document.getElementById("kp-dotmatrix"),
  kpPills: {
    column: document.getElementById("kp-pill-column"),
    drop: document.getElementById("kp-pill-drop"),
    rhythm: document.getElementById("kp-pill-rhythm"),
    pattern: document.getElementById("kp-pill-pattern"),
  },
  scBtns: [...document.querySelectorAll(".sc-btn")],
  vpChips: [...document.querySelectorAll(".vp-chip")],
  presetBtns: [...document.querySelectorAll(".preset-btn")],
};

// 构建 7×4 原海报酸柠点阵 SVG（只建一次，按通关项点亮）
const dotNodes = [];
if (dom.dotMatrix) {
  const ns = "http://www.w3.org/2000/svg";
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 7; c++) {
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(5 + c * 14));
      circle.setAttribute("cy", String(6 + r * 14));
      circle.setAttribute("r", "2.4");
      dom.dotMatrix.appendChild(circle);
      dotNodes.push({ el: circle, row: r });
    }
  }
}

// 差量更新 DOM，避免拖动时无谓重排
const lastDom = {};
function setText(el, key, text) {
  if (!el || lastDom[key] === text) return;
  lastDom[key] = text;
  el.textContent = text;
}

function syncUI() {
  ev = evaluate(state);
  const okAll = ev.passed === 4;

  setText(dom.statusPill, "pill", ev.badge);
  dom.statusPill.classList.toggle("is-ok", okAll);
  dom.statusPill.classList.toggle("is-fault", !okAll);

  setText(dom.conceptText, "concept", ev.scenario.summary);
  setText(
    dom.bpMeta,
    "bpMeta",
    `BP 4→3: ${ev.breakpoints.bp4to3}px · 3→2: ${ev.breakpoints.bp3to2}px · 2→1: ${ev.breakpoints.bp2to1}px`
  );

  dom.diagCard.classList.toggle("is-ok", okAll);
  dom.diagCard.classList.toggle("is-fault", !okAll);
  setText(dom.diagBadge, "dbadge", ev.badge);
  setText(dom.diagHeadline, "dhead", ev.headline);
  setText(dom.diagDetail, "ddet", ev.detail);
  setText(dom.diagActionText, "dact", ev.action);

  if (ev.fixKind) {
    dom.diagFixBtn.hidden = false;
    setText(dom.diagFixBtn, "dfix", ev.fixLabel);
  } else {
    dom.diagFixBtn.hidden = true;
  }

  setText(dom.mColW, "mColW", `${ev.layout.minColActualW}px`);
  setText(dom.mDrop, "mDrop", `${ev.layout.topCols}列/落${ev.layout.droppedCount}`);
  setText(dom.mSlope, "mSlope", `${ev.totalDropPct >= 0 ? "+" : ""}${ev.totalDropPct}%`);
  setText(dom.mTier, "mTier", ev.tierLabel);

  const vpStr = String(Math.round(state.viewportW));
  if (dom.ctrlVp.value !== vpStr) dom.ctrlVp.value = vpStr;
  setText(dom.valVp, "valVp", `${vpStr}px`);

  const mwStr = String(Math.round(state.minColW));
  if (dom.ctrlMinW.value !== mwStr) dom.ctrlMinW.value = mwStr;
  setText(dom.valMinW, "valMinW", `${mwStr}px`);

  dom.vpChips.forEach((btn) => {
    const v = Number(btn.dataset.vp);
    btn.classList.toggle("is-active", Math.abs(state.viewportW - v) < 12);
  });

  dom.scBtns.forEach((btn) => {
    const active = btn.dataset.scenario === state.scenario;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  if (state.cssOrderFlip) {
    setText(dom.ctrlOrderFlip, "ordFlip", `CSS order：错序（逆跳 ${ev.tabJumps}）`);
    dom.ctrlOrderFlip.classList.add("is-warn");
    dom.ctrlOrderFlip.classList.remove("is-safe");
    dom.ctrlOrderFlip.setAttribute("aria-pressed", "true");
  } else {
    setText(dom.ctrlOrderFlip, "ordFlip", "HTML 源序：已同步 ✓");
    dom.ctrlOrderFlip.classList.remove("is-warn");
    dom.ctrlOrderFlip.classList.add("is-safe");
    dom.ctrlOrderFlip.setAttribute("aria-pressed", "false");
  }

  dom.ctrlPrimaryTop.disabled = ev.checks.priorityOk;
  setText(
    dom.ctrlPrimaryTop,
    "priBtn",
    ev.checks.priorityOk ? "主栏已居 #1 ✓" : "主栏归位 #1"
  );

  for (const kp of ev.keyPoints) {
    const pill = dom.kpPills[kp.id];
    setText(pill, `kp_${kp.id}`, kp.status);
    pill.classList.toggle("is-ok", kp.ok);
    pill.classList.toggle("is-fault", !kp.ok);
  }

  // 点亮 7×4 酸柠点阵：4 行对应 4 项要点
  const rowStates = [
    ev.checks.priorityOk,
    ev.checks.slopeOk,
    ev.checks.measureOk,
    ev.checks.a11yOk,
  ];
  for (const d of dotNodes) {
    const col = rowStates[d.row] ? "#C4D226" : "#49504A";
    if (d.el.getAttribute("fill") !== col) d.el.setAttribute("fill", col);
  }
}

// ==================== HERO 2D CANVAS 绘制 ====================
function sizeCanvas(canvas) {
  const dpr = pixelRatio(2);
  const cw = Math.max(260, Math.round(canvas.clientWidth));
  const ch = Math.max(200, Math.round(canvas.clientHeight));
  const bw = Math.round(cw * dpr);
  const bh = Math.round(ch * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  return { cw, ch, dpr };
}

function drawHero(t, dt, { still }) {
  const { cw, ch, dpr } = sizeCanvas(heroCanvas);
  const ctx = heroCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  // 进场动效（0.55 秒内稳妥落位，保证 0.9s 截图清晰饱满）
  if (still) {
    anim.intro = 1;
    anim.viewportW = state.viewportW;
  } else {
    anim.intro = Math.min(1, anim.intro + Math.max(dt, 0.016) * 2.1);
    const k = dt > 0 ? 1 - Math.exp(-dt * 14) : 0.35;
    anim.viewportW += (state.viewportW - anim.viewportW) * k;
  }

  const compact = cw < 520;
  const shortH = ch < 300;
  const spineW = compact ? 0 : 128;
  const topRulerH = compact ? 52 : 54;
  const padX = compact ? 12 : 20;
  const padB = compact ? 14 : 18;

  // 哑光炭黑建筑背景
  ctx.fillStyle = "#161918";
  ctx.fillRect(0, 0, cw, ch);

  const stageW = cw - spineW - padX * 2;
  const stageLeft = padX;
  const stageTop = topRulerH;
  const stageH = ch - topRulerH - padB;

  // 顶部标尺底带（双轨分排：上轨视口徽 + 下轨刻度线，零重叠）
  ctx.fillStyle = "#1E2220";
  ctx.fillRect(0, 0, cw, topRulerH);
  ctx.strokeStyle = "#313734";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, topRulerH - 0.5);
  ctx.lineTo(cw, topRulerH - 0.5);
  ctx.stroke();

  // 计算通道实际像素宽（映射到 stageW）
  const vpFrac = clamp((anim.viewportW - VIEWPORT_MIN) / (VIEWPORT_MAX - VIEWPORT_MIN), 0, 1);
  const minCorridorW = Math.min(stageW * 0.48, compact ? 204 : 260);
  const corridorW = minCorridorW + (stageW - minCorridorW) * vpFrac;
  const corridorX = stageLeft + (stageW - corridorW) * 0.5;
  const corridorRight = corridorX + corridorW;
  anim.hitBoxes.corridor = {
    left: corridorX,
    right: corridorRight,
    top: stageTop,
    bottom: stageTop + stageH,
  };

  // 上轨：居中视口读数徽
  const vpText = `视口 ${Math.round(state.viewportW)}px · ${ev.layout.topCols}列并排 · 落${ev.layout.droppedCount}列`;
  ctx.font = '600 12px "IBM Plex Mono", "Noto Sans SC", sans-serif';
  const pillW = Math.min(stageW, ctx.measureText(vpText).width + 24);
  const pillX = stageLeft + (stageW - pillW) * 0.5;
  ctx.fillStyle = ev.checks.measureOk ? "#C4D226" : "#F0761F";
  ctx.fillRect(pillX, 7, pillW, 21);
  ctx.fillStyle = "#161918";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(vpText, pillX + pillW * 0.5, 18);

  // 下轨：清晰视口刻度尺（绝不撞徽章）
  ctx.strokeStyle = "#3E4642";
  ctx.lineWidth = 1;
  const ticks = compact ? [375, 768, 1200] : [375, 600, 768, 960, 1200];
  ctx.font = '500 10px "IBM Plex Mono", monospace';
  ctx.textBaseline = "middle";
  for (const tv of ticks) {
    const f = clamp((tv - VIEWPORT_MIN) / (VIEWPORT_MAX - VIEWPORT_MIN), 0, 1);
    const wAt = minCorridorW + (stageW - minCorridorW) * f;
    const xR = stageLeft + (stageW + wAt) * 0.5;
    if (xR < stageLeft + stageW - 8) {
      ctx.beginPath();
      ctx.moveTo(Math.round(xR) + 0.5, topRulerH - 6);
      ctx.lineTo(Math.round(xR) + 0.5, topRulerH);
      ctx.stroke();
      ctx.fillStyle = "#8C938D";
      ctx.textAlign = "center";
      ctx.fillText(String(tv), xR, 38);
    }
  }

  // 视口通道暗框与双侧拉缩壁
  ctx.fillStyle = "#1B1F1D";
  ctx.fillRect(corridorX, stageTop + 8, corridorW, stageH - 10);
  ctx.strokeStyle = "#3E4642";
  ctx.lineWidth = 1;
  ctx.strokeRect(corridorX + 0.5, stageTop + 8.5, corridorW - 1, stageH - 11);

  // 双侧拉缩壁粗条（烈焰橘/酸柠提示可横拖）
  const wallColor = ev.checks.measureOk ? "#C4D226" : "#F0761F";
  ctx.fillStyle = wallColor;
  const gripH = shortH ? 34 : 46;
  const gripY = stageTop + stageH * 0.46 - gripH * 0.5;
  ctx.fillRect(corridorX - 3, gripY, 6, gripH);
  ctx.fillRect(corridorRight - 3, gripY, 6, gripH);

  // 为底沿修复按钮预留独立安全槽（零遮挡立柱文字！）
  const faultDockH = ev.fixKind ? (shortH ? 30 : 36) : 6;

  // 计算每根立柱在画布内的目标矩形
  const rowCount = ev.layout.rowCount;
  const innerPadX = compact ? 10 : 16;
  const innerGapX = compact ? 7 : 12;
  const innerGapY = rowCount === 4 ? (shortH ? 6 : 9) : 14;
  const usableW = corridorW - innerPadX * 2;
  const usableTop = stageTop + 20;
  const usableH = stageH - 28 - faultDockH;

  // 行高度分配：1 行时用原海报全立面高；多行时按行数合理分给各层并保留阶梯高差！
  const rowRects = [];
  if (rowCount === 1) {
    rowRects.push({ top: usableTop, h: usableH - 22 });
  } else if (rowCount === 2) {
    const h0 = usableH * 0.56;
    const h1 = usableH - h0 - innerGapY - 14;
    rowRects.push({ top: usableTop, h: h0 }, { top: usableTop + h0 + innerGapY, h: h1 });
  } else {
    const each = (usableH - innerGapY * (rowCount - 1) - 8) / rowCount;
    for (let r = 0; r < rowCount; r++) {
      rowRects.push({ top: usableTop + r * (each + innerGapY), h: each });
    }
  }

  anim.hitBoxes.caps = [];
  anim.hitBoxes.ranks = [];
  anim.hitBoxes.faultBtns = [];

  const lerpK = still ? 1 : dt > 0 ? 1 - Math.exp(-dt * 14) : 0.35;
  const drawnSlots = [];

  ev.renderedColumns.forEach((col, slotIdx) => {
    const c = col.cell;
    const rr = rowRects[c.row];
    const colW = (usableW - innerGapX * (c.colsInRow - 1)) / c.colsInRow;
    const targetX = corridorX + innerPadX + c.colInRow * (colW + innerGapX);

    // 单行或双行时真实反映原海报的「高差阶梯」；4 行单列时按轻阶梯比例显出主次厚薄
    let targetH;
    let targetY;
    if (rowCount === 1) {
      targetH = Math.max(76, rr.h * col.heightRatio);
      // 底部稍微阶梯下错（像原海报那样：底边也略微逐级下探！）
      const baseDrop = slotIdx * 7;
      targetY = rr.top + (rr.h - targetH) + baseDrop * 0.35;
    } else if (rowCount === 2) {
      const ratioScaled = c.row === 0 ? 0.62 + col.heightRatio * 0.38 : 0.66 + col.heightRatio * 0.34;
      targetH = Math.max(66, rr.h * clamp(ratioScaled, 0.58, 1));
      targetY = rr.top + (rr.h - targetH);
    } else {
      targetH = Math.max(50, rr.h);
      targetY = rr.top;
    }

    const a = anim.cols[slotIdx];
    if (!a.init || still) {
      a.x = targetX;
      a.y = targetY;
      a.w = colW;
      a.h = targetH;
      a.init = true;
    } else {
      a.x += (targetX - a.x) * lerpK;
      a.y += (targetY - a.y) * lerpK;
      a.w += (colW - a.w) * lerpK;
      a.h += (targetH - a.h) * lerpK;
    }

    // 进场轻微自上而下落定
    const enterEase = 1 - Math.pow(1 - anim.intro, 3);
    const drawY = a.y - (1 - enterEase) * (16 + slotIdx * 8);

    drawnSlots.push({
      col,
      slotIdx,
      x: a.x,
      y: drawY,
      w: a.w,
      h: a.h,
      dropped: c.dropped,
    });
  });

  // 先绘「下落抛物轨 ↘」（烈焰橘虚线弧，标记从顶排落到下层的列）
  if (ev.layout.droppedCount > 0 && rowCount <= 2) {
    ctx.save();
    ctx.strokeStyle = "#F0761F";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    const topRightX = corridorX + innerPadX + usableW - 14;
    const topMidY = rowRects[0].top + rowRects[0].h * 0.42;
    drawnSlots
      .filter((s) => s.dropped)
      .forEach((s) => {
        const tx = s.x + s.w * 0.5;
        const ty = s.y - 6;
        ctx.beginPath();
        ctx.moveTo(topRightX, topMidY);
        ctx.quadraticCurveTo(topRightX + 10, ty - 10, tx, ty);
        ctx.stroke();
        // 小箭头
        ctx.setLineDash([]);
        ctx.fillStyle = "#F0761F";
        ctx.beginPath();
        ctx.moveTo(tx, ty + 2);
        ctx.lineTo(tx - 4, ty - 5);
        ctx.lineTo(tx + 4, ty - 5);
        ctx.closePath();
        ctx.fill();
        ctx.setLineDash([4, 4]);
      });
    ctx.restore();
  }

  // 逐根绘 292 原海报立柱（悬浮双线顶帽 + 顺位勋章 + 实宽 + 巨字 + 垂坠虚线空心圆）
  for (const s of drawnSlots) {
    const { col, slotIdx, x, y, w, h } = s;
    const isSwapSrc = state.swapSource === slotIdx;
    const isSel = state.selectedSlot === slotIdx;

    // 1. 悬浮顶帽条（1:1 原海报母题！可纵向拖拽调整列高）
    const capH = 5;
    const capGap = 5;
    const capY = y - capH - capGap;
    ctx.fillStyle = col.cap;
    ctx.fillRect(x, capY, w, capH);

    // 顶帽中心小把手指示（提示可上下拖调列高）
    ctx.fillStyle = "#161918";
    const handleW = Math.min(24, w * 0.3);
    ctx.fillRect(x + (w - handleW) * 0.5, capY + 1.5, handleW, 2);

    anim.hitBoxes.caps.push({
      slotIdx,
      x: x - 2,
      y: capY - 12,
      w: w + 4,
      h: capH + capGap + 24,
    });

    // 2. 立柱主体
    ctx.fillStyle = col.fill;
    ctx.fillRect(x, y, w, h);

    // 若为交换待选列或当前错态列，描出清晰外框
    if (isSwapSrc) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    } else if (col.isFaultCol && !ev.checks.priorityOk && col.id === 0) {
      ctx.strokeStyle = "#FF6E66";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    } else if (isSel) {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }

    // 3. 左上可点顺位勋章 (#1 / #2 / #3 / #4)
    const badgeW = col.isPrimary && w > 76 ? 44 : 28;
    const badgeH = 20;
    const bx = x + 6;
    const by = y + 6;
    ctx.fillStyle = isSwapSrc ? "#FFFFFF" : "#1A1D1C";
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.fillStyle = isSwapSrc ? "#1A1D1C" : col.isPrimary ? "#D4E23B" : "#EAE6E0";
    ctx.font = '700 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const rankLabel = col.isPrimary && w > 76 ? `#${slotIdx + 1}主` : `#${slotIdx + 1}`;
    ctx.fillText(rankLabel, bx + badgeW * 0.5, by + badgeH * 0.5 + 0.5);

    anim.hitBoxes.ranks.push({
      slotIdx,
      x: bx - 4,
      y: by - 4,
      w: badgeW + 8,
      h: badgeH + 8,
    });

    // 4. 右上实绘像素宽（单真源！）
    if (w >= 84) {
      ctx.fillStyle = col.muted;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(col.cell.wPx)}px`, x + w - 7, by + badgeH * 0.5 + 0.5);
    }

    // 5. 原海报大字标（列 / 下 / 落 / 模式）+ 说明文案
    const innerH = h - 30;
    if (rowCount === 4) {
      // 手机单列堆叠形态：左大字 + 中英文标题 + 右宽标，干净利落
      ctx.fillStyle = col.ink;
      ctx.font = '900 22px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(col.glyph, x + 58, y + h * 0.5 + 2);

      ctx.font = '700 13px "Noto Sans SC", sans-serif';
      ctx.fillText(col.zh, x + 106, y + h * 0.38);
      ctx.fillStyle = col.muted;
      ctx.font = '500 11px "Space Grotesk", "Noto Sans SC", sans-serif';
      ctx.fillText(`${col.en} · 高 ${Math.round(col.heightRatio * 100)}%`, x + 106, y + h * 0.68);
    } else {
      const isDouble = col.glyph.length > 1;
      const maxByW = isDouble ? w * 0.36 : w * 0.46;
      const glyphSize = clamp(Math.min(maxByW, innerH * 0.4), isDouble ? 16 : 20, isDouble ? 34 : 56);
      ctx.fillStyle = col.ink;
      ctx.font = `900 ${Math.round(glyphSize)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const glyphY = y + (innerH > 125 ? 36 : 29);
      ctx.fillText(col.glyph, x + w * 0.5, glyphY);

      if (h > 106 && w > 54 && !shortH) {
        const metaY = y + h - (h > 168 ? 58 : 34);
        ctx.textAlign = "left";
        ctx.fillStyle = col.muted;
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.fillText(col.en, x + 9, metaY);

        ctx.fillStyle = col.ink;
        ctx.font = '700 13px "Noto Sans SC", sans-serif';
        ctx.fillText(col.zh, x + 9, metaY + 13);

        if (h > 180 && w > 92) {
          ctx.fillStyle = col.ink;
          ctx.fillRect(x + 9, metaY + 32, 16, 1.5);
          ctx.fillStyle = col.muted;
          ctx.font = '400 11px "Noto Sans SC", sans-serif';
          const shortBody = col.body.slice(0, Math.max(6, Math.floor((w - 18) / 11)));
          ctx.fillText(shortBody, x + 9, metaY + 39);
        }
      }
    }

    // 6. 原海报柱底虚线垂坠空心圆（单行 / 双行底排展示）
    if (rowCount === 1 || (rowCount === 2 && s.dropped)) {
      const cx = x + w * 0.5;
      const lineTop = y + h + 2;
      const maxCircleY = stageTop + stageH - faultDockH - 5;
      const circleY = Math.min(maxCircleY, y + h + 15);
      if (circleY - lineTop > 5) {
        ctx.save();
        ctx.strokeStyle = "#BDBAB0";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, lineTop);
        ctx.lineTo(cx, circleY - 4);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, circleY, 3.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // 绘视觉动线折线（连接四根立柱顶帽中心，直示高→低坡度或逆坡！）
  if (rowCount === 1) {
    ctx.save();
    ctx.strokeStyle = ev.checks.slopeOk ? "#C4D226" : "#FF6E66";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    drawnSlots.forEach((s, i) => {
      const px = s.x + s.w * 0.5;
      const py = s.y - 16;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
  }

  // 若开启 CSS order 错序，在柱面上绘出 WCAG 1.3.2 焦点逆跳红线（避开大字位置）
  if (state.cssOrderFlip) {
    const seq = [2, 0, 3, 1];
    const tabYFrac = shortH ? 0.76 : 0.58;
    const tagHalfW = shortH || compact ? 15 : 21;
    const tagH = shortH ? 16 : 19;
    ctx.save();
    ctx.strokeStyle = "#FF6E66";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    seq.forEach((slotIdx, idx) => {
      const s = drawnSlots[slotIdx];
      const cx = s.x + s.w * 0.5;
      const cy = s.y + s.h * tabYFrac;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    seq.forEach((slotIdx, idx) => {
      const s = drawnSlots[slotIdx];
      const cx = s.x + s.w * 0.5;
      const cy = s.y + s.h * tabYFrac;
      ctx.fillStyle = "#A81E18";
      ctx.fillRect(cx - tagHalfW, cy - tagH * 0.5, tagHalfW * 2, tagH);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${shortH ? 9 : 10}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(shortH || compact ? `T${idx + 1}` : `TAB ${idx + 1}`, cx, cy + 0.5);
    });
    ctx.restore();
  }

  // 独立底部修错操作槽（零遮挡任何立柱文字！）
  if (ev.fixKind && drawnSlots.length) {
    const tagText = `× ${ev.badge.split("·")[1]?.trim() || "待校准"} · 点此一步修复`;
    ctx.font = `700 ${shortH ? 11 : 12}px "Noto Sans SC", sans-serif`;
    const tw = Math.min(corridorW - 16, ctx.measureText(tagText).width + 22);
    const th = shortH ? 22 : 26;
    const tx = corridorX + (corridorW - tw) * 0.5;
    const ty = stageTop + stageH - th - 6;
    ctx.fillStyle = "#A81E18";
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = "#FF9E96";
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, tx + tw * 0.5, ty + th * 0.5 + 0.5);

    anim.hitBoxes.faultBtns.push({ x: tx, y: ty, w: tw, h: th, fixKind: ev.fixKind });
  }

  // 右侧 1:1 原海报垂直虚线视流动线脊（高位启动 → 低位收束 ↓）
  if (!compact) {
    const sx = cw - spineW + 18;
    const spineTop = stageTop + 18;
    const spineBottom = stageTop + stageH - 12;

    ctx.save();
    ctx.strokeStyle = "#48504B";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, spineTop);
    ctx.lineTo(sx, spineBottom - 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // 底部酸柠下箭头
    const arrowCol = ev.checks.slopeOk ? "#C4D226" : "#F0761F";
    ctx.strokeStyle = arrowCol;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx - 5, spineBottom - 10);
    ctx.lineTo(sx, spineBottom - 2);
    ctx.lineTo(sx + 5, spineBottom - 10);
    ctx.stroke();

    // 四阶停靠点与双行原海报文案
    RIGHT_SPINE_LABELS.forEach((lbl, i) => {
      const py = spineTop + 14 + (i / 3) * (spineBottom - spineTop - 52);
      const isActiveDot =
        (i === 0 && ev.checks.priorityOk) ||
        (i === 1 && ev.checks.slopeOk) ||
        (i === 2 && ev.checks.measureOk) ||
        (i === 3 && ev.checks.a11yOk);
      ctx.fillStyle = isActiveDot ? "#C4D226" : "#7D837D";
      ctx.beginPath();
      ctx.arc(sx, py, 3.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = isActiveDot ? "#EAE6E0" : "#979B94";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      ctx.fillText(lbl.top, sx + 12, py - 6);
      ctx.fillStyle = isActiveDot ? "#C4D226" : "#787D77";
      ctx.font = '400 11px "Noto Sans SC", sans-serif';
      ctx.fillText(lbl.sub, sx + 12, py + 9);
    });
    ctx.restore();
  }

  ctx.restore();
}

const heroLoop = loop(heroCanvas, drawHero);

// ==================== HERO 交互（鼠标、触屏、键盘） ====================
let dragMode = null; // null | "viewport" | "cap"
let dragSlot = -1;
let dragStartX = 0;
let dragStartY = 0;
let dragStartVp = 0;
let dragStartH = 0;
let dragMoved = false;

function canvasCoords(clientX, clientY) {
  const r = heroCanvas.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
}

function hitTestRect(pt, box) {
  return pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
}

function handleCanvasTap(pt) {
  // 1. 点中画布红标：一步修复当前首要错态
  for (const fb of anim.hitBoxes.faultBtns) {
    if (hitTestRect(pt, fb)) {
      applyFix(state, fb.fixKind);
      state.swapSource = null;
      syncUI();
      heroLoop.draw();
      return true;
    }
  }
  // 2. 点中列顺位勋章 (#1-#4)：两次点击互换两列下落顺位
  for (const rb of anim.hitBoxes.ranks) {
    if (hitTestRect(pt, rb)) {
      if (state.swapSource === null) {
        state.swapSource = rb.slotIdx;
        state.selectedSlot = rb.slotIdx;
      } else if (state.swapSource === rb.slotIdx) {
        state.swapSource = null;
      } else {
        const a = state.swapSource;
        const b = rb.slotIdx;
        const tmp = state.order[a];
        state.order[a] = state.order[b];
        state.order[b] = tmp;
        state.swapSource = null;
        state.selectedSlot = b;
      }
      syncUI();
      heroLoop.draw();
      return true;
    }
  }
  return false;
}

function startDrag(clientX, clientY) {
  const pt = canvasCoords(clientX, clientY);
  dragStartX = clientX;
  dragStartY = clientY;
  dragStartVp = state.viewportW;
  dragMoved = false;

  // 检查是否按在某根立柱顶帽上（上下拖调高差）
  for (const cap of anim.hitBoxes.caps) {
    if (hitTestRect(pt, cap)) {
      dragMode = "cap";
      dragSlot = cap.slotIdx;
      dragStartH = state.heights[dragSlot];
      state.selectedSlot = dragSlot;
      return;
    }
  }
  dragMode = "viewport";
  dragSlot = -1;
}

function moveDrag(clientX, clientY, isTouch) {
  if (!dragMode) return false;
  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  if (Math.hypot(dx, dy) > 4) dragMoved = true;

  if (dragMode === "cap") {
    // 手机竖滑让页面滚动，除非明确按住顶帽纵向微调
    const scaleH = Math.max(180, heroCanvas.clientHeight * 0.65);
    const nextH = clamp(dragStartH - dy / scaleH, 0.28, 0.96);
    if (Math.abs(nextH - state.heights[dragSlot]) > 0.002) {
      state.heights[dragSlot] = nextH;
      syncUI();
      heroLoop.draw();
    }
    return true;
  }

  if (dragMode === "viewport") {
    // 触屏时若主要是竖向滑屏，放行给页面滚动
    if (isTouch && Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dx) < 12) return false;
    const widthSpan = Math.max(220, heroCanvas.clientWidth * 0.55);
    const deltaVp = (dx / widthSpan) * (VIEWPORT_MAX - VIEWPORT_MIN);
    const nextVp = clamp(Math.round(dragStartVp + deltaVp), VIEWPORT_MIN, VIEWPORT_MAX);
    if (nextVp !== state.viewportW) {
      state.viewportW = nextVp;
      syncUI();
      heroLoop.draw();
    }
    return true;
  }
  return false;
}

function endDrag(clientX, clientY) {
  if (!dragMode) return;
  const wasMoved = dragMoved;
  dragMode = null;
  if (!wasMoved) {
    handleCanvasTap(canvasCoords(clientX, clientY));
  }
}

// 同时兼容 Pointer（鼠标）与原生 Touch（供移动端真触屏及 perf.mjs 压测！）
heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // 触屏交由下方 touch 处理器统一接管
  heroCanvas.setPointerCapture(e.pointerId);
  startDrag(e.clientX, e.clientY);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  if (dragMode) {
    moveDrag(e.clientX, e.clientY, false);
    return;
  }
  // 悬停光标反馈
  const pt = canvasCoords(e.clientX, e.clientY);
  if (anim.hitBoxes.faultBtns.some((b) => hitTestRect(pt, b)) || anim.hitBoxes.ranks.some((b) => hitTestRect(pt, b))) {
    heroCanvas.style.cursor = "pointer";
  } else if (anim.hitBoxes.caps.some((b) => hitTestRect(pt, b))) {
    heroCanvas.style.cursor = "ns-resize";
  } else {
    heroCanvas.style.cursor = "ew-resize";
  }
});

heroCanvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  endDrag(e.clientX, e.clientY);
});

heroCanvas.addEventListener("pointercancel", () => {
  dragMode = null;
});

heroCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    startDrag(t0.clientX, t0.clientY);
  },
  { passive: true }
);

heroCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!dragMode || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const consumed = moveDrag(t0.clientX, t0.clientY, true);
    if (consumed && e.cancelable) e.preventDefault();
  },
  { passive: false }
);

heroCanvas.addEventListener("touchend", (e) => {
  const t0 = e.changedTouches[0];
  if (t0) endDrag(t0.clientX, t0.clientY);
  else dragMode = null;
});

// 键盘操作：←/→ 调视口宽，↑/↓ 调当前选中列高度，1–4 选列
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.shiftKey ? 60 : 24;
    state.viewportW = clamp(state.viewportW + (e.key === "ArrowRight" ? step : -step), VIEWPORT_MIN, VIEWPORT_MAX);
    syncUI();
    heroLoop.draw();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const delta = e.key === "ArrowUp" ? 0.05 : -0.05;
    state.heights[state.selectedSlot] = clamp(state.heights[state.selectedSlot] + delta, 0.28, 0.96);
    syncUI();
    heroLoop.draw();
  } else if (["1", "2", "3", "4"].includes(e.key)) {
    state.selectedSlot = Number(e.key) - 1;
    heroLoop.draw();
  }
});

// 控件绑定
dom.scBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scenario = btn.dataset.scenario;
    state.swapSource = null;
    syncUI();
    heroLoop.draw();
  });
});

dom.ctrlVp.addEventListener("input", () => {
  state.viewportW = Number(dom.ctrlVp.value);
  syncUI();
  heroLoop.draw();
});

dom.ctrlMinW.addEventListener("input", () => {
  state.minColW = Number(dom.ctrlMinW.value);
  syncUI();
  heroLoop.draw();
});

dom.vpChips.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.viewportW = Number(btn.dataset.vp);
    syncUI();
    heroLoop.draw();
  });
});

dom.ctrlOrderFlip.addEventListener("click", () => {
  state.cssOrderFlip = !state.cssOrderFlip;
  syncUI();
  heroLoop.draw();
});

dom.ctrlPrimaryTop.addEventListener("click", () => {
  applyFix(state, "fixPriority");
  state.swapSource = null;
  syncUI();
  heroLoop.draw();
});

dom.diagFixBtn.addEventListener("click", () => {
  if (!ev.fixKind) return;
  applyFix(state, ev.fixKind);
  state.swapSource = null;
  syncUI();
  heroLoop.draw();
});

dom.presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state.viewportW = p.patch.viewportW;
    state.minColW = p.patch.minColW;
    state.order = [...p.patch.order];
    state.heights = [...p.patch.heights];
    state.cssOrderFlip = p.patch.cssOrderFlip;
    state.swapSource = null;
    syncUI();
    heroLoop.draw();
  });
});

// ==================== 01 节：双视角剥层对照 ====================
const lensSvg = document.getElementById("lens-svg");
const lensCaption = document.getElementById("lens-caption");
const lensBtns = [...document.querySelectorAll("[data-lens]")];

function renderLens(mode) {
  if (!lensSvg) return;
  if (mode === "poster") {
    lensSvg.innerHTML = `
      <rect width="540" height="330" fill="#1A1D1C"/>
      <rect x="20" y="24" width="72" height="6" fill="#C4D226"/>
      <rect x="20" y="36" width="72" height="238" fill="#C4D226"/>
      <text x="56" y="102" text-anchor="middle" fill="#1A1D1C" font-size="34" font-weight="900">列</text>
      <text x="56" y="250" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">第 1 顺位</text>

      <rect x="104" y="68" width="72" height="6" fill="#EAE6E0"/>
      <rect x="104" y="80" width="72" height="202" fill="#EAE6E0"/>
      <text x="140" y="142" text-anchor="middle" fill="#1A1D1C" font-size="34" font-weight="900">下</text>
      <text x="140" y="260" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">第 2 顺位</text>

      <rect x="188" y="114" width="72" height="6" fill="#C4D226"/>
      <rect x="188" y="126" width="72" height="164" fill="#C4D226"/>
      <text x="224" y="182" text-anchor="middle" fill="#1A1D1C" font-size="34" font-weight="900">落</text>
      <text x="224" y="270" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">第 3 顺位</text>

      <rect x="272" y="160" width="72" height="6" fill="#F0761F"/>
      <rect x="272" y="172" width="72" height="128" fill="#F0761F"/>
      <text x="308" y="220" text-anchor="middle" fill="#1A1D1C" font-size="24" font-weight="900">模式</text>
      <text x="308" y="280" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">第 4 顺位</text>

      <path d="M56 18 L308 152" stroke="#F0761F" stroke-width="2" stroke-dasharray="5 4"/>
      <line x1="378" y1="30" x2="378" y2="296" stroke="#535A55" stroke-dasharray="3 4"/>
      <circle cx="378" cy="48" r="4" fill="#C4D226"/><text x="390" y="52" fill="#EAE6E0" font-size="12">高位启动 · 吸引注意</text>
      <circle cx="378" cy="118" r="4" fill="#C4D226"/><text x="390" y="122" fill="#EAE6E0" font-size="12">信息逐级 · 向下流动</text>
      <circle cx="378" cy="192" r="4" fill="#C4D226"/><text x="390" y="196" fill="#EAE6E0" font-size="12">节奏递进 · 层级清晰</text>
      <circle cx="378" cy="268" r="4" fill="#F0761F"/><text x="390" y="272" fill="#EAE6E0" font-size="12">低位收束 · 形成记忆点</text>
    `;
    lensCaption.textContent =
      "在海报平面里，四根列块自左向右高度递减，配合右缘四阶标注「高位启动 → 信息逐级向下 → 节奏递进 → 低位收束」，直接把阅读先后刻进视觉高度差。";
  } else {
    lensSvg.innerHTML = `
      <rect width="540" height="330" fill="#1A1D1C"/>
      <text x="24" y="28" fill="#D4E23B" font-size="12" font-weight="700">DESKTOP 1280px · 四列全展</text>
      <rect x="24" y="38" width="114" height="46" fill="#C4D226"/><text x="81" y="65" text-anchor="middle" fill="#1A1D1C" font-size="13" font-weight="700">#1 主栏</text>
      <rect x="144" y="38" width="114" height="46" fill="#EAE6E0"/><text x="201" y="65" text-anchor="middle" fill="#1A1D1C" font-size="13" font-weight="700">#2 目录</text>
      <rect x="264" y="38" width="114" height="46" fill="#C4D226"/><text x="321" y="65" text-anchor="middle" fill="#1A1D1C" font-size="13" font-weight="700">#3 短评</text>
      <rect x="384" y="38" width="114" height="46" fill="#F0761F"/><text x="441" y="65" text-anchor="middle" fill="#1A1D1C" font-size="13" font-weight="700">#4 推荐</text>

      <text x="24" y="114" fill="#D4E23B" font-size="12" font-weight="700">TABLET 768px · 末两列逐级下落</text>
      <rect x="24" y="124" width="150" height="36" fill="#C4D226"/><text x="99" y="146" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">#1 主栏（稳守高位）</text>
      <rect x="180" y="124" width="150" height="36" fill="#EAE6E0"/><text x="255" y="146" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">#2 目录</text>
      <rect x="24" y="166" width="150" height="30" fill="#C4D226"/><text x="99" y="185" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">#3 短评 ↓ 已下落</text>
      <rect x="180" y="166" width="150" height="30" fill="#F0761F"/><text x="255" y="185" text-anchor="middle" fill="#1A1D1C" font-size="12" font-weight="700">#4 推荐 ↓ 已下落</text>
      <path d="M441 88 Q436 168 338 180" fill="none" stroke="#F0761F" stroke-width="2" stroke-dasharray="4 4"/>

      <text x="24" y="226" fill="#D4E23B" font-size="12" font-weight="700">MOBILE 375px · 单列依次收束</text>
      <rect x="24" y="236" width="180" height="19" fill="#C4D226"/><text x="114" y="250" text-anchor="middle" fill="#1A1D1C" font-size="11" font-weight="700">#1 主栏（首屏直达）</text>
      <rect x="24" y="259" width="180" height="19" fill="#EAE6E0"/><text x="114" y="273" text-anchor="middle" fill="#1A1D1C" font-size="11" font-weight="700">#2 目录 ↓</text>
      <rect x="24" y="282" width="180" height="19" fill="#C4D226"/><text x="114" y="296" text-anchor="middle" fill="#1A1D1C" font-size="11" font-weight="700">#3 短评 ↓</text>
      <rect x="24" y="305" width="180" height="19" fill="#F0761F"/><text x="114" y="319" text-anchor="middle" fill="#1A1D1C" font-size="11" font-weight="700">#4 推荐 ↓ 低位收束</text>

      <text x="234" y="264" fill="#EAE6E0" font-size="12">屏宽越窄，低顺位列越早下落</text>
      <text x="234" y="286" fill="#BDBAB0" font-size="12">但每一列的实际文字行宽都</text>
      <text x="234" y="306" fill="#BDBAB0" font-size="12">稳稳保持在舒适可读区间内。</text>
    `;
    lensCaption.textContent =
      "回到网页 UI 实作：原海报的「高柱→低柱」直接对应「主栏先读→次栏先落」。桌面全展、平板落掉低优先列、手机收束成单列，但主栏从头到尾稳居首屏高位。";
  }
}

lensBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    lensBtns.forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    renderLens(btn.dataset.lens);
  });
});
renderLens("poster");

// ==================== 02 节：三端并行实时落列矩阵 ====================
const BP_MODES = {
  holy: {
    meta: "CSS Grid + 两道断点（1024px / 640px）",
    desktop: {
      note: "三栏按 25% / 50% / 25% 并排，主正文居中 608px，左右导航与推荐各守 304px。",
      rows: [
        { cols: "1fr 2fr 1fr", items: [{ n: "目录", w: "304px", c: "b-chalk" }, { n: "核心主栏", w: "608px", c: "b-lime" }, { n: "关联推荐", w: "304px", c: "b-orange" }] },
      ],
    },
    tablet: {
      note: "跨过 1024px 后，关联推荐先落至底行通栏，主栏（492px）与目录（228px）继续并肩。",
      rows: [
        { cols: "2.15fr 1fr", items: [{ n: "核心主栏", w: "492px", c: "b-lime" }, { n: "目录", w: "228px", c: "b-chalk" }] },
        { cols: "1fr", items: [{ n: "关联推荐 ↓ 已下落", w: "728px", c: "b-orange" }] },
      ],
    },
    mobile: {
      note: "640px 以下三栏依次落成单列，正文稳守首屏 347px 全宽，阅读行长零挤压。",
      rows: [
        { cols: "1fr", items: [{ n: "核心主栏", w: "347px", c: "b-lime" }] },
        { cols: "1fr", items: [{ n: "目录 ↓", w: "347px", c: "b-chalk" }] },
        { cols: "1fr", items: [{ n: "关联推荐 ↓", w: "347px", c: "b-orange" }] },
      ],
    },
    code: `.layout {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr; /* 手机：单列按 DOM 源序堆叠 */
}
@media (min-width: 640px) {
  .layout { grid-template-columns: minmax(0, 2.2fr) minmax(220px, 1fr); }
  .aside  { grid-column: 1 / -1; } /* 平板：仅末列下落占满底行 */
}
@media (min-width: 1024px) {
  .layout { grid-template-columns: 1fr 2fr 1fr; }
  .aside  { grid-column: auto; }   /* 桌面：三栏回升并排 */
}`,
  },
  asym: {
    meta: "CSS Grid + 单道断点（720px）",
    desktop: {
      note: "经典 65 / 35 双栏：主文占 796px，侧栏占 428px，留出充足图表与注释空间。",
      rows: [
        { cols: "1.85fr 1fr", items: [{ n: "深度主栏", w: "796px", c: "b-lime" }, { n: "侧栏摘要", w: "428px", c: "b-orange" }] },
      ],
    },
    tablet: {
      note: "768px 仍在断点之上，双栏收窄至 472px / 254px，双双稳过 220px 舒适底线。",
      rows: [
        { cols: "1.85fr 1fr", items: [{ n: "深度主栏", w: "472px", c: "b-lime" }, { n: "侧栏摘要", w: "254px", c: "b-orange" }] },
      ],
    },
    mobile: {
      note: "低于 720px 后侧栏干脆落到正文下方，避免出现 120px 的残缺窄侧栏。",
      rows: [
        { cols: "1fr", items: [{ n: "深度主栏", w: "347px", c: "b-lime" }] },
        { cols: "1fr", items: [{ n: "侧栏摘要 ↓ 已下落", w: "347px", c: "b-orange" }] },
      ],
    },
    code: `.split {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr; /* 720px 以下：副栏下落到底部 */
}
@media (min-width: 720px) {
  .split {
    grid-template-columns: minmax(0, 1.85fr) minmax(240px, 1fr);
  }
}`,
  },
  quad: {
    meta: "CSS Grid 内在响应（0 行 @media）",
    desktop: {
      note: "1280px 刚好容纳四列 296px，每列宽度整齐且不超出视觉扫视区。",
      rows: [
        { cols: "repeat(4, 1fr)", items: [{ n: "列序", w: "296px", c: "b-lime" }, { n: "落差", w: "296px", c: "b-chalk" }, { n: "节奏", w: "296px", c: "b-lime" }, { n: "模式", w: "296px", c: "b-orange" }] },
      ],
    },
    tablet: {
      note: "768px 放不下四列 260px，浏览器自动放落两列形成匀称 2×2，每列回弹到 356px。",
      rows: [
        { cols: "repeat(2, 1fr)", items: [{ n: "列序", w: "356px", c: "b-lime" }, { n: "落差", w: "356px", c: "b-chalk" }] },
        { cols: "repeat(2, 1fr)", items: [{ n: "节奏 ↓", w: "356px", c: "b-lime" }, { n: "模式 ↓", w: "356px", c: "b-orange" }] },
      ],
    },
    mobile: {
      note: "375px 自动收敛成单列四阶，不写一行媒体查询也能守住 260px 下限。",
      rows: [
        { cols: "1fr", items: [{ n: "列序", w: "347px", c: "b-lime" }] },
        { cols: "1fr", items: [{ n: "落差 ↓", w: "347px", c: "b-chalk" }] },
        { cols: "1fr", items: [{ n: "节奏 ↓", w: "347px", c: "b-lime" }] },
        { cols: "1fr", items: [{ n: "模式 ↓", w: "347px", c: "b-orange" }] },
      ],
    },
    code: `.column-drop-auto {
  display: grid;
  gap: 16px;
  /* 低于 260px 自动放落到下一行，零 @media 声明 */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
}`,
  },
};

function fillDevice(el, noteEl, spec) {
  el.innerHTML = spec.rows
    .map(
      (r) =>
        `<div class="dev-row" style="grid-template-columns:${r.cols}">${r.items
          .map(
            (it) =>
              `<div class="dev-blk ${it.c}"><span class="dev-blk-name">${it.n}</span><span class="dev-blk-w" lang="en">${it.w}</span></div>`
          )
          .join("")}</div>`
    )
    .join("");
  noteEl.textContent = spec.note;
}

const bpBtns = [...document.querySelectorAll("[data-bp-mode]")];
function renderBpMode(key) {
  const m = BP_MODES[key];
  if (!m) return;
  fillDevice(document.getElementById("dev-desktop"), document.getElementById("dev-desktop-note"), m.desktop);
  fillDevice(document.getElementById("dev-tablet"), document.getElementById("dev-tablet-note"), m.tablet);
  fillDevice(document.getElementById("dev-mobile"), document.getElementById("dev-mobile-note"), m.mobile);
  document.getElementById("bp-css-meta").textContent = m.meta;
  document.querySelector("#bp-code code").textContent = m.code;
}
bpBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    bpBtns.forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderBpMode(btn.dataset.bpMode);
  });
});
renderBpMode("holy");

// ==================== 03 节：四模式同步缩屏对比 Canvas ====================
const cmpCanvas = document.getElementById("compare-canvas");
const cmpCtx = cmpCanvas.getContext("2d");
const cmpPlayBtn = document.getElementById("cmp-play");
const cmpReadout = document.getElementById("cmp-readout");
const cmpPresetBtns = [...document.querySelectorAll("[data-cmp-w]")];

const cmpState = { playing: true, phase: 0.22, fixedW: null };

function drawCompare(t, dt, { still }) {
  const { cw, ch, dpr } = sizeCanvas(cmpCanvas);
  const ctx = cmpCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  if (still) {
    cmpState.fixedW = cmpState.fixedW ?? 760;
  } else if (cmpState.playing && cmpState.fixedW === null) {
    cmpState.phase += dt * 0.22;
  }

  const simW =
    cmpState.fixedW !== null
      ? cmpState.fixedW
      : Math.round(380 + (1220 - 380) * (0.5 + 0.5 * Math.cos(cmpState.phase * Math.PI * 2)));

  setText(cmpReadout, "cmpW", `VIEWPORT ${simW}px`);

  ctx.fillStyle = "#131615";
  ctx.fillRect(0, 0, cw, ch);

  const cols = cw < 680 ? 2 : 4;
  const rows = cw < 680 ? 2 : 1;
  const pad = 14;
  const gap = 12;
  const cardW = (cw - pad * 2 - gap * (cols - 1)) / cols;
  const cardH = (ch - pad * 2 - gap * (rows - 1)) / rows;
  const frac = clamp((simW - 360) / (1220 - 360), 0, 1);

  const modes = [
    { id: "drop", title: "292 列下落", sub: "满幅逐级放落", accent: "#C4D226" },
    { id: "fluid", title: "291 大体流动", sub: "大屏扩外边距", accent: "#EAE6E0" },
    { id: "shift", title: "293 布局切换", sub: "跨断点重组结构", accent: "#F0761F" },
    { id: "off", title: "295 画布外", sub: "次栏藏入抽屉", accent: "#9CA49E" },
  ];

  modes.forEach((m, idx) => {
    const c = idx % cols;
    const r = Math.floor(idx / cols);
    const x = pad + c * (cardW + gap);
    const y = pad + r * (cardH + gap);

    ctx.fillStyle = idx === 0 ? "#1F241C" : "#1B1F1D";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = idx === 0 ? "#C4D226" : "#323835";
    ctx.lineWidth = idx === 0 ? 1.5 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cardW - 1, cardH - 1);

    ctx.fillStyle = m.accent;
    ctx.font = '700 13px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(m.title, x + 10, y + 9);
    ctx.fillStyle = "#A2A8A3";
    ctx.font = '400 11px "Noto Sans SC", sans-serif';
    ctx.fillText(m.sub, x + 10, y + 26);

    // 内部模拟视口框
    const boxTop = y + 46;
    const boxMaxW = cardW - 20;
    const boxH = cardH - 58;
    const vw = boxMaxW * (0.42 + 0.58 * frac);
    const vx = x + (cardW - vw) * 0.5;

    ctx.fillStyle = "#121514";
    ctx.fillRect(vx, boxTop, vw, boxH);
    ctx.strokeStyle = "#48504B";
    ctx.strokeRect(vx + 0.5, boxTop + 0.5, vw - 1, boxH - 1);

    const p = 5;
    const g = 4;
    const iw = vw - p * 2;
    const ih = boxH - p * 2;
    const bx = vx + p;
    const by = boxTop + p;

    if (m.id === "drop") {
      // 3 → 2+1 → 1
      if (simW >= 920) {
        const w1 = (iw - g * 2) * 0.5;
        const w2 = (iw - g * 2) * 0.25;
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx, by, w1, ih);
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx + w1 + g, by, w2, ih);
        ctx.fillStyle = "#F0761F"; ctx.fillRect(bx + w1 + w2 + g * 2, by, w2, ih);
      } else if (simW >= 620) {
        const h1 = ih * 0.64;
        const w1 = (iw - g) * 0.65;
        const w2 = (iw - g) * 0.35;
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx, by, w1, h1);
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx + w1 + g, by, w2, h1);
        ctx.fillStyle = "#F0761F"; ctx.fillRect(bx, by + h1 + g, iw, ih - h1 - g);
      } else {
        const h1 = (ih - g * 2) * 0.42;
        const h2 = (ih - g * 2) * 0.29;
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx, by, iw, h1);
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx, by + h1 + g, iw, h2);
        ctx.fillStyle = "#F0761F"; ctx.fillRect(bx, by + h1 + h2 + g * 2, iw, h2);
      }
    } else if (m.id === "fluid") {
      // 大屏两边扩张留白，容器居中锁宽；小屏直接堆叠
      const maxInner = Math.min(iw, boxMaxW * 0.66);
      const mx = vx + (vw - maxInner) * 0.5;
      if (simW >= 640) {
        const h1 = ih * 0.56;
        const cw2 = (maxInner - g) * 0.5;
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(mx, by, maxInner, h1);
        ctx.fillStyle = "#C4D226"; ctx.fillRect(mx, by + h1 + g, cw2, ih - h1 - g);
        ctx.fillStyle = "#F0761F"; ctx.fillRect(mx + cw2 + g, by + h1 + g, cw2, ih - h1 - g);
      } else {
        const h1 = (ih - g * 2) / 3;
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx, by, iw, h1);
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx, by + h1 + g, iw, h1);
        ctx.fillStyle = "#F0761F"; ctx.fillRect(bx, by + (h1 + g) * 2, iw, h1);
      }
    } else if (m.id === "shift") {
      // 不同断点彻底改变左右/上下结构
      if (simW >= 920) {
        const lw = iw * 0.28;
        const rw = iw - lw - g;
        const rh = (ih - g) * 0.5;
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx, by, lw, ih);
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx + lw + g, by, rw, rh);
        ctx.fillStyle = "#F0761F"; ctx.fillRect(bx + lw + g, by + rh + g, rw, rh);
      } else if (simW >= 620) {
        const topH = ih * 0.24;
        const botH = ih - topH - g;
        const hw = (iw - g) * 0.5;
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx, by, iw, topH);
        ctx.fillStyle = "#F0761F"; ctx.fillRect(bx, by + topH + g, hw, botH);
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx + hw + g, by + topH + g, hw, botH);
      } else {
        const h1 = (ih - g * 2) * 0.22;
        const h2 = (ih - g * 2) * 0.48;
        const h3 = (ih - g * 2) * 0.30;
        ctx.fillStyle = "#F0761F"; ctx.fillRect(bx, by, iw, h1);
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx, by + h1 + g, iw, h2);
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx, by + h1 + h2 + g * 2, iw, h3);
      }
    } else {
      // 画布外：窄屏次栏滑出框外
      if (simW >= 820) {
        const lw = iw * 0.26;
        const rw = iw - lw - g;
        ctx.fillStyle = "#EAE6E0"; ctx.fillRect(bx, by, lw, ih);
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx + lw + g, by, rw, ih);
      } else {
        ctx.fillStyle = "#C4D226"; ctx.fillRect(bx, by, iw, ih);
        // 框外半透明幽灵抽屉
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#F0761F";
        ctx.fillRect(Math.max(x + 4, vx - 18), by, 14, ih);
        ctx.restore();
      }
    }
  });

  ctx.restore();
}

const cmpLoop = loop(cmpCanvas, drawCompare);

cmpPlayBtn.addEventListener("click", () => {
  if (cmpState.fixedW !== null) {
    cmpState.fixedW = null;
    cmpState.playing = true;
  } else {
    cmpState.playing = !cmpState.playing;
  }
  cmpPlayBtn.textContent = cmpState.playing ? "暂停缩屏演示" : "继续缩屏演示";
  cmpPlayBtn.setAttribute("aria-pressed", String(cmpState.playing));
  cmpLoop.draw();
});

cmpPresetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    cmpState.fixedW = Number(btn.dataset.cmpW);
    cmpState.playing = false;
    cmpPlayBtn.textContent = "继续缩屏演示";
    cmpPlayBtn.setAttribute("aria-pressed", "false");
    cmpLoop.draw();
  });
});

// ==================== 04 节：键盘 Tab 聚焦步进追踪器 ====================
const a11yState = { mode: "sync", step: 0 };
const a11yModeBtns = [...document.querySelectorAll("[data-a11y]")];
const a11yBlocks = [...document.querySelectorAll(".a11y-block")];
const a11yArrows = document.getElementById("a11y-arrows");
const a11yReadout = document.getElementById("a11y-readout");
const a11yBoard = document.getElementById("a11y-board");

function renderA11y() {
  const isFlip = a11yState.mode === "flip";
  // sync: 视觉槽位 [0主栏, 1目录, 2底部推荐] -> Tab 顺序 0 -> 1 -> 2
  // flip: HTML 源序先写 2(推荐) -> 0(主栏) -> 1(目录)，靠 CSS order 视觉排成 主栏|目录 / 推荐
  const seq = isFlip ? [2, 0, 1] : [0, 1, 2];
  const labels = isFlip
    ? ["DOM #2 · Tab 2（被 CSS order 拉到顶部）", "DOM #3 · Tab 3", "DOM #1 · Tab 1（实际在底行！）"]
    : ["DOM #1 · Tab 1", "DOM #2 · Tab 2", "DOM #3 · Tab 3"];

  labels.forEach((txt, i) => {
    const el = document.getElementById(`ab-dom-${i}`);
    if (el) el.textContent = txt;
  });

  const activeSlot = seq[a11yState.step];
  a11yBlocks.forEach((blk, idx) => {
    blk.classList.toggle("is-focused", idx === activeSlot);
    blk.classList.toggle("is-jump-warn", isFlip && idx === activeSlot);
  });

  // 画箭头标示 Tab 路径
  const br = a11yBoard.getBoundingClientRect();
  const pts = seq.map((slotIdx) => {
    const r = a11yBlocks[slotIdx].getBoundingClientRect();
    return {
      x: ((r.left + r.width * 0.5 - br.left) / Math.max(1, br.width)) * 520,
      y: ((r.top + r.height * 0.5 - br.top) / Math.max(1, br.height)) * 236,
    };
  });

  const strokeCol = isFlip ? "#FF7B72" : "#D4E23B";
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const active = i < a11yState.step;
    segs.push(
      `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke="${strokeCol}" stroke-opacity="${active ? "1" : "0.42"}" stroke-width="${active ? "3.2" : "2"}" stroke-dasharray="6 4"/>`
    );
  }
  a11yArrows.innerHTML = segs.join("");

  const names = ["核心主栏（左上）", "章节目录（右上）", "延伸推荐（底部通栏）"];
  if (!isFlip) {
    a11yReadout.textContent = `Tab ${a11yState.step + 1} 落在「${names[activeSlot]}」：键盘焦点与视觉阅读方向完全一致（左上 → 右上 → 底部），满足 WCAG 1.3.2。`;
  } else {
    const warn =
      a11yState.step === 0
        ? "刚按第 1 次 Tab，焦点竟然直接掉到页面底部的「延伸推荐」！"
        : a11yState.step === 1
          ? "第 2 次 Tab 突然从屏幕最底端倒跳回左上的「核心主栏」，焦点逆跳！"
          : "第 3 次 Tab 才走到右上的「章节目录」。视觉和 DOM 源序打架，键盘与读屏用户完全迷失。";
    a11yReadout.textContent = `CSS order 错序警报 · Tab ${a11yState.step + 1}：${warn}`;
  }
}

a11yModeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    a11yState.mode = btn.dataset.a11y;
    a11yState.step = 0;
    a11yModeBtns.forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderA11y();
  });
});

document.getElementById("a11y-next-tab").addEventListener("click", () => {
  a11yState.step = (a11yState.step + 1) % 3;
  renderA11y();
});

document.getElementById("a11y-reset-tab").addEventListener("click", () => {
  a11yState.step = 0;
  renderA11y();
});
requestAnimationFrame(renderA11y);

// ==================== 05 节：三代 CSS 实现演进切片 ====================
const ERAS = {
  2012: {
    code: `/* 2012 · Float 浮动与清除浮动 */
.col { width: 100%; float: none; }
@media (min-width: 600px) {
  .col-main { width: 65%; float: left; }
  .col-nav  { width: 35%; float: left; }
  .col-sub  { width: 100%; clear: both; }
}
@media (min-width: 960px) {
  .col-main { width: 50%; }
  .col-nav,
  .col-sub  { width: 25%; clear: none; }
}`,
    title: "浮动时代：能下落，但高度不等就会卡住",
    desc: "早期实现列下落全靠 float: left 加百分比宽度，还要时刻提防清除浮动（clearfix）。只要相邻两列高度差了几像素，下落的那一列就会被挂在半空形成难看的错位阶梯。",
  },
  2015: {
    code: `/* 2015 · Flexbox flex-wrap + 断点调宽 */
.row { display: flex; flex-wrap: wrap; gap: 16px; }
.col { flex: 1 1 100%; }
@media (min-width: 640px) {
  .col-main { flex: 2 1 60%; }
  .col-nav  { flex: 1 1 32%; }
}
@media (min-width: 1024px) {
  .col-main { flex: 2 1 48%; }
  .col-nav, .col-sub { flex: 1 1 22%; }
}`,
    title: "弹性盒时代：自动等高，但要管紧 order 诱惑",
    desc: "Flexbox 让同行各列自动拉齐底边、彻底告别浮动塌陷；但也因为顺手带出了 CSS order 属性，导致无数团队在重排三栏时无意间破坏了键盘与屏幕阅读器顺序。",
  },
  modern: {
    code: `/* 今日 · CSS Grid 内在尺寸（零或极少媒体查询） */
.grid-drop {
  display: grid;
  gap: 16px;
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, 260px), 1fr));
}`,
    title: "内在网格时代：把「最低可读宽」直接写进规则",
    desc: "CSS Grid 的 auto-fit 与 minmax() 让浏览器直接替你算每一列够不够 260px——够就并排，不够就干净放落；而对有固定主次比例的文档页，配合两段简洁 @media 即可精确掌控每一级下落。",
  },
};

const eraBtns = [...document.querySelectorAll("[data-era]")];
function renderEra(key) {
  const e = ERAS[key];
  if (!e) return;
  document.querySelector("#era-code code").textContent = e.code;
  document.getElementById("era-explain").innerHTML = `<strong>${e.title}</strong><p>${e.desc}</p>`;
}
eraBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    eraBtns.forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderEra(btn.dataset.era);
  });
});
renderEra("2012");

// ==================== 06 节：单变量平板断点小练习 ====================
const QUIZ_ANSWERS = {
  A: {
    right: false,
    text: "再想一步（选了方案 A）：768px 下仍硬塞三栏并排，目录被挤成 160px、相关示例只剩 132px，一行只能放下六七个字，折行碎裂。这正好违背了列下落「宁可落列、不挤碎行长」的第一条底线。",
  },
  B: {
    right: true,
    text: "判断准确（方案 B 正确）：列下落的核心是按屏宽逐级放落低优先级列。768px 平板足够让主正文（530px）和目录（206px）舒展并排，只把最低优先级的相关示例先放落到底部通栏，同时保持 HTML 源序正文在前——阅读舒适、导航直达、无障碍零冲突。",
  },
  C: {
    right: false,
    text: "略微过早（选了方案 C）：768px 平板宽明明能轻松容下正文和目录两列，一口气全塌成单列堆叠不仅把目录推到了屏幕外，还白白浪费了平板横向空间，失去了「逐级下落」的节奏梯度。",
  },
  D: {
    right: false,
    text: "踩中双坑（选了方案 D）：第一，把最核心的正文先踢到底层，让配角占据首屏高位，主次彻底倒挂；第二，用 CSS order 硬调顺序会让键盘 Tab 与屏幕阅读器焦点上下逆跳，违反 WCAG 1.3.2。",
  },
};

const quizBtns = [...document.querySelectorAll(".quiz-opt")];
const quizFeedback = document.getElementById("quiz-feedback");
quizBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.opt;
    const ans = QUIZ_ANSWERS[pick];
    quizBtns.forEach((b) => {
      const isMe = b === btn;
      b.setAttribute("aria-pressed", String(isMe));
      b.classList.remove("is-picked-right", "is-picked-wrong");
      if (isMe) b.classList.add(ans.right ? "is-picked-right" : "is-picked-wrong");
    });
    quizFeedback.textContent = ans.text;
    quizFeedback.classList.toggle("is-right", ans.right);
    quizFeedback.classList.toggle("is-wrong", !ans.right);
  });
});

// ==================== 07 节：原海报放大灯箱（拖动 / 缩放 / Esc 关闭） ====================
const posterImg = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbScaleEl = document.getElementById("lb-scale");

const lb = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function updateLbTransform() {
  lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
  lbScaleEl.textContent = `${Math.round(lb.scale * 100)}%`;
}

function openLightbox() {
  // 只复用页内已内联的 #poster.src，绝不重复内联海报文件
  if (!lbImg.src) lbImg.src = posterImg.src;
  lb.scale = 1;
  lb.x = 0;
  lb.y = 0;
  updateLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lb.scale = clamp(lb.scale + 0.3, 0.7, 3.4);
  updateLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lb.scale = clamp(lb.scale - 0.3, 0.7, 3.4);
  updateLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lb.scale = 1;
  lb.x = 0;
  lb.y = 0;
  updateLbTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lb.scale = clamp(lb.scale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.4);
  updateLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport) {
    closeLightbox();
    return;
  }
  lb.dragging = true;
  lb.sx = e.clientX;
  lb.sy = e.clientY;
  lb.ox = lb.x;
  lb.oy = lb.y;
  lbViewport.setPointerCapture(e.pointerId);
  lbViewport.classList.add("is-dragging");
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lb.dragging) return;
  lb.x = lb.ox + (e.clientX - lb.sx);
  lb.y = lb.oy + (e.clientY - lb.sy);
  updateLbTransform();
});

lbViewport.addEventListener("pointerup", () => {
  lb.dragging = false;
  lbViewport.classList.remove("is-dragging");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

window.addEventListener("resize", () => {
  heroLoop.draw();
  cmpLoop.draw();
  renderA11y();
});

// 初始同步并绘出第一帧
syncUI();
heroLoop.draw();
cmpLoop.draw();
