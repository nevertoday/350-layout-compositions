import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SPECIMENS,
  PRESETS,
  DIVISIBILITY_DATA,
  createInitialState,
  remapStateCols,
  computeLayout,
  evaluateLayout,
  computeMeasureLab,
  wrapTextLines,
} from "./model.js";

// =========================================================================
// 1. 开场互动拼版台（Hero Multi-Column Editorial Desk）
// =========================================================================
let state = createInitialState("poster");
let dragState = null; // { id, mode: "resize"|"move", startX, startY, origSpan, origStart, liveSpanFloat, liveStartFloat, lockedAxis }
let introElapsed = 0;
let needsRedraw = true;
let latestLayout = null;
let latestEval = null;

const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

// DOM 引用
const elStatusPill = document.getElementById("hero-status-pill");
const elGridChip = document.getElementById("p-grid-chip");
const elModChip = document.getElementById("p-module-chip");
const elDensChip = document.getElementById("p-density-chip");
const elOrgChip = document.getElementById("p-org-chip");

const elDiagBadge = document.getElementById("diag-badge");
const elDiagTitle = document.getElementById("diag-title");
const elDiagWhy = document.getElementById("diag-why");
const elDiagAction = document.getElementById("diag-action");
const btnQuickFix = document.getElementById("btn-quick-fix");

const elMChars = document.getElementById("m-chars");
const elMRatio = document.getElementById("m-ratio");
const elMDensity = document.getElementById("m-density");
const elMRhythm = document.getElementById("m-rhythm");

const elSelectedLabel = document.getElementById("selected-mod-label");
const elSelectedSpan = document.getElementById("selected-span-val");
const btnVoid = document.getElementById("btn-void");
const btnGuides = document.getElementById("btn-guides");
const btnScan = document.getElementById("btn-scan");
const rngGutter = document.getElementById("rng-gutter");
const valGutter = document.getElementById("val-gutter");
const rngDrift = document.getElementById("rng-drift");
const valDrift = document.getElementById("val-drift");

const LOGIC_W = 720;
const LOGIC_H = 450;

let cachedRect = null;
let lastUiKey = "";

function refreshHeroRect() {
  const r = heroCanvas.getBoundingClientRect();
  if (r.width >= 10 && r.height >= 10) cachedRect = r;
  return cachedRect || { left: 0, top: 0, width: LOGIC_W, height: LOGIC_H };
}

function syncHeroCanvasSize() {
  const rect = dragState && cachedRect ? cachedRect : refreshHeroRect();
  if (rect.width < 10 || rect.height < 10) return { w: LOGIC_W, h: LOGIC_H, dpr: 1 };
  // 手机端像素比上限 1.5（遵循 GUIDE.md 省电与软件渲染帧率建议），桌面最高 2
  const dpr = pixelRatio(rect.width < 520 ? 1.5 : 2);
  const pw = Math.round(rect.width * dpr);
  const ph = Math.round(rect.height * dpr);
  if (heroCanvas.width !== pw || heroCanvas.height !== ph) {
    heroCanvas.width = pw;
    heroCanvas.height = ph;
  }
  return { w: rect.width, h: rect.height, dpr };
}

function getSelectedModule() {
  return state.modules.find((m) => m.id === state.selectedId) || state.modules[0];
}

function syncHeroUI(layout, ev) {
  const sel = getSelectedModule();
  const selPlaced = layout.placed.find((m) => m.id === sel.id) || sel;
  const uiKey = [
    ev.summaryChip,
    ev.pillars.grid.badge,
    ev.pillars.module.badge,
    ev.pillars.density.badge,
    ev.pillars.org.badge,
    ev.headlineVerdict,
    layout.avgCharsPerLine,
    layout.spanRatio,
    layout.densityPct,
    state.voidEnabled,
    state.showGuides,
    state.cols,
    layout.gutter,
    state.drift,
    sel.id,
    selPlaced.span,
  ].join("|");
  if (uiKey === lastUiKey) return;
  lastUiKey = uiKey;

  elStatusPill.textContent = ev.summaryChip;
  elStatusPill.classList.toggle("is-ok", ev.allOk);
  elStatusPill.classList.toggle("is-bad", !ev.allOk);

  const setChip = (el, p) => {
    el.textContent = p.badge;
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-bad", !p.ok);
  };
  setChip(elGridChip, ev.pillars.grid);
  setChip(elModChip, ev.pillars.module);
  setChip(elDensChip, ev.pillars.density);
  setChip(elOrgChip, ev.pillars.org);

  elDiagBadge.textContent = ev.allOk ? `4/4 · ${layout.cols} 栏秩序成立` : `${ev.passCount}/4 · ${ev.primary.short}`;
  elDiagBadge.classList.toggle("is-ok", ev.allOk);
  elDiagBadge.classList.toggle("is-bad", !ev.allOk);

  elDiagTitle.textContent = ev.headlineVerdict;
  elDiagWhy.textContent = ev.whyVerdict;
  elDiagAction.textContent = ev.actionVerdict;

  if (ev.primary) {
    btnQuickFix.disabled = false;
    btnQuickFix.textContent = ev.primary.fixLabel;
  } else {
    btnQuickFix.disabled = true;
    btnQuickFix.textContent = "4/4 全部达标 ✓";
  }

  elMChars.textContent = `约 ${layout.avgCharsPerLine} 字/行`;
  elMRatio.textContent = `${layout.spanRatio}× (${layout.maxSpan}:${layout.minSpan})`;
  elMDensity.textContent = `${layout.densityPct}%${state.voidEnabled ? " · 有透气槽" : " · 无留白"}`;
  elMRhythm.textContent = ev.rhythmGrade;

  // 选中模块读数（复用上方已算出的 sel 与 selPlaced）
  elSelectedLabel.textContent = sel.id === "side" && state.voidEnabled ? "留白透气槽" : sel.name;
  elSelectedSpan.textContent = `SPAN ${selPlaced.span}/${state.cols}`;

  // 栏数按钮高亮
  document.querySelectorAll("#cols-btns .col-btn").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.cols) === state.cols);
  });

  // 开关按钮
  btnVoid.setAttribute("aria-pressed", String(state.voidEnabled));
  btnVoid.classList.toggle("is-active", state.voidEnabled);
  btnVoid.textContent = state.voidEnabled ? "留白透气槽：开" : "留白透气槽：关";

  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  btnGuides.classList.toggle("is-active", state.showGuides);
  btnGuides.textContent = state.showGuides ? "白线栏轨：开" : "白线栏轨：关";

  // 滑轨同步
  rngGutter.value = String(state.gutter);
  valGutter.textContent = `${layout.gutter}px`;
  rngDrift.value = String(state.drift);
  valDrift.textContent = state.drift === 0 ? "0px（已踩轨）" : `+${state.drift}px`;
}

// 绘制单真源多栏拼版画布（2D Canvas，统一 720px 标准出版页幅，全屏幕读数 100% 一致）
function drawHero(progress, scanT) {
  const { w: cssW, h: cssH, dpr } = syncHeroCanvasSize();
  const ctx = heroCtx;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 固定 720px 基准出版页宽，按真实容器纵横比计算 sheetH，绝不压扁且全端读数一致
  const sheetW = 720;
  const sheetH = Math.max(430, Math.min(720, Math.round(sheetW * (cssH / Math.max(1, cssW)))));
  const scaleX = cssW / sheetW;
  const scaleY = cssH / sheetH;
  ctx.scale(scaleX, scaleY);

  // 折行直接用纯几何字宽快速测算（拖动期间避免每帧百次 ctx.measureText 导致软件渲染卡顿）
  const bodyFont = `400 12.5px "Noto Sans SC", sans-serif`;

  const dragPreview = dragState
    ? {
        id: dragState.id,
        mode: dragState.mode,
        liveSpanFloat: dragState.liveSpanFloat,
        liveStartFloat: dragState.liveStartFloat,
      }
    : null;

  const layout = computeLayout(state, sheetW, sheetH, dragPreview, null);
  const ev = evaluateLayout(state, layout);
  latestLayout = layout;
  latestEval = ev;
  syncHeroUI(layout, ev);

  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;

  // 1. 招牌翠绿展板底色
  ctx.fillStyle = "#23BA60";
  ctx.fillRect(0, 0, sheetW, sheetH);

  // 2. 顶部栏号标尺（仅放 01..NN，绝不与参数撞车）
  ctx.fillStyle = "#1CA452";
  ctx.fillRect(0, 0, sheetW, layout.padTop - 2);
  ctx.strokeStyle = "rgba(244, 255, 247, 0.85)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, layout.padTop - 2);
  ctx.lineTo(sheetW, layout.padTop - 2);
  ctx.stroke();

  // 3. 底部参数标尺带（单真源参数独占底栏）
  const footY = sheetH - layout.padBottom + 2;
  ctx.fillStyle = "#1CA452";
  ctx.fillRect(0, footY, sheetW, layout.padBottom - 2);
  ctx.beginPath();
  ctx.moveTo(0, footY);
  ctx.lineTo(sheetW, footY);
  ctx.stroke();

  // 4. 贯通全高白线栏轨（合批描边，大幅降低软件渲染绘制调用）
  const guideH = layout.innerH * Math.min(1, progress * 1.45);
  ctx.fillStyle = "#181140";
  ctx.font = `700 11.5px "DM Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < layout.tracks.length; i++) {
    const tr = layout.tracks[i];
    ctx.fillText(String(i + 1).padStart(2, "0"), tr.x + tr.w / 2, (layout.padTop - 2) / 2);
  }

  if (state.showGuides) {
    ctx.fillStyle = "rgba(244, 255, 247, 0.08)";
    ctx.beginPath();
    for (let i = 0; i < layout.tracks.length; i += 2) {
      const tr = layout.tracks[i];
      ctx.rect(tr.x, layout.padTop, tr.w, guideH);
    }
    ctx.fill();

    ctx.strokeStyle = "rgba(244, 255, 247, 0.62)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < layout.tracks.length; i++) {
      const tr = layout.tracks[i];
      ctx.moveTo(tr.x, layout.padTop);
      ctx.lineTo(tr.x, layout.padTop + guideH);
      ctx.moveTo(tr.x + tr.w, layout.padTop);
      ctx.lineTo(tr.x + tr.w, layout.padTop + guideH);
    }
    ctx.stroke();

    if (layout.gutter < 10) {
      ctx.fillStyle = "rgba(173, 26, 48, 0.5)";
      ctx.beginPath();
      for (let i = 0; i < layout.tracks.length - 1; i++) {
        const tr = layout.tracks[i];
        ctx.rect(tr.x + tr.w, layout.padTop, layout.gutter, guideH);
      }
      ctx.fill();
    } else if (layout.gutter > 34 || layout.gutter > layout.colW * 0.52) {
      ctx.fillStyle = "rgba(28, 20, 74, 0.24)";
      ctx.beginPath();
      for (let i = 0; i < layout.tracks.length - 1; i++) {
        const tr = layout.tracks[i];
        ctx.rect(tr.x + tr.w, layout.padTop, layout.gutter, guideH);
      }
      ctx.fill();
      ctx.strokeStyle = "#1C144A";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < layout.tracks.length - 1; i++) {
        const tr = layout.tracks[i];
        const mid = tr.x + tr.w + layout.gutter / 2;
        ctx.moveTo(mid, layout.padTop);
        ctx.lineTo(mid, layout.padTop + guideH);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 底栏左右参数标尺
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#140E36";
  ctx.font = `700 11px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(
    `${layout.cols} 栏底座 · 单栏 ${Math.round(layout.colW)}px · 栏距 ${layout.gutter}px`,
    layout.padX,
    footY + (layout.padBottom - 2) / 2
  );
  ctx.textAlign = "right";
  ctx.fillText(
    `占位 ${layout.densityPct}% · 跨度 ${layout.maxSpan}:${layout.minSpan} (${layout.spanRatio}×)`,
    sheetW - layout.padX,
    footY + (layout.padBottom - 2) / 2
  );
  ctx.textAlign = "left";

  const modReveal = Math.min(1, Math.max(0.18, (progress - 0.08) / 0.72));

  // 5. 未开留白透气槽时，合批绘制所有满塞补白文字块（由 150+ 次调用压为 3 次调用）
  if (layout.fillers.length) {
    ctx.fillStyle = "rgba(24, 17, 64, 0.16)";
    ctx.beginPath();
    for (const f of layout.fillers) {
      ctx.rect(f.x, f.y, f.w, f.h * (0.25 + 0.75 * modReveal));
    }
    ctx.fill();

    ctx.strokeStyle = "rgba(24, 17, 64, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "rgba(24, 17, 64, 0.55)";
    ctx.beginPath();
    for (const f of layout.fillers) {
      const fh = f.h * (0.25 + 0.75 * modReveal);
      const barW = Math.max(10, f.w - 16);
      for (let ly = f.y + 24; ly < f.y + fh - 7; ly += 9) {
        ctx.rect(f.x + 7, ly, barW, 3);
      }
    }
    ctx.fill();

    ctx.fillStyle = "#140E36";
    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    for (const f of layout.fillers) {
      if (f.w >= 46) ctx.fillText("满塞补白", f.x + 7, f.y + 7);
    }
  }

  // 6. 绘制 6 个主模块：把激活模块排到最后绘制，确保黄柄与角标永远压在最上层不被遮挡
  const drawOrder = [...layout.placed].sort((a, b) => (a.id === state.selectedId ? 1 : b.id === state.selectedId ? -1 : 0));

  for (const m of drawOrder) {
    const isSel = m.id === state.selectedId;
    const isOffGrid = Math.abs(m.driftPx) >= 2;
    const x = m.x;
    const y = m.y;
    const w = m.w;
    const h = m.h * (0.25 + 0.75 * modReveal);

    ctx.save();

    if (isOffGrid) {
      const alignedX = layout.padX + m.placedCol * layout.trackStep;
      ctx.strokeStyle = "rgba(173, 26, 48, 0.85)";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(alignedX, y, w, h);
      ctx.setLineDash([]);
    }

    if (m.isVoid) {
      ctx.fillStyle = "rgba(244, 255, 247, 0.16)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isSel ? "#F7CD18" : "rgba(244, 255, 247, 0.94)";
      ctx.lineWidth = isSel ? 2.6 : 1.6;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      ctx.fillStyle = "#181140";
      ctx.font = `900 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("透气留白", x + w / 2, y + h / 2 - 8);
      ctx.font = `500 10.5px "DM Mono", monospace`;
      ctx.fillText(`SPAN ${m.span}`, x + w / 2, y + h / 2 + 10);
      ctx.textAlign = "left";
    } else if (m.role === "headline") {
      const inverted = ev.issues.some((it) => it.code === "hierarchy_inverted");
      ctx.fillStyle = "#181140";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isSel ? "#F7CD18" : "#F4FFF7";
      ctx.lineWidth = isSel ? 2.6 : 1.8;
      ctx.strokeRect(x, y, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 6, y + 4, Math.max(4, w - 12), Math.max(4, h - 8));
      ctx.clip();

      ctx.fillStyle = "#F7CD18";
      ctx.font = `500 10px "DM Mono", monospace`;
      ctx.textBaseline = "top";
      ctx.fillText(inverted ? `× 仅占 ${m.span} 栏` : `${spec.pageSub} · SPAN ${m.span}`, x + 10, y + 7);

      const hFontSize = w > 360 ? 22 : w > 210 ? 16 : 13;
      ctx.fillStyle = "#F4FFF7";
      ctx.font = `900 ${hFontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillText(spec.headline, x + 10, y + (h > 56 ? 25 : 21));
      ctx.restore();
    } else if (m.role === "hero") {
      ctx.fillStyle = "#20AF59";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isSel ? "#F7CD18" : "#F4FFF7";
      ctx.lineWidth = isSel ? 2.8 : 1.8;
      ctx.strokeRect(x, y, w, h);

      const pad = 9;
      const topBarH = Math.min(24, h * 0.2);
      const r = Math.max(5, Math.min(9, topBarH * 0.42));
      ctx.fillStyle = "#1C144A";
      ctx.beginPath();
      ctx.arc(x + pad + r, y + pad + r, r, 0, Math.PI * 2);
      ctx.fill();

      const lx = x + pad + r * 2 + 8;
      const lw = Math.max(0, w - (lx - x) - pad);
      if (lw > 16) {
        ctx.fillRect(lx, y + pad + 3, lw * 0.85, 3);
        ctx.fillRect(lx, y + pad + 10, lw * 0.56, 2.5);
      }

      const yellowY = y + pad + r * 2 + 8;
      const yellowH = Math.max(20, h - (yellowY - y) - 26);
      ctx.fillStyle = "#F7CD18";
      ctx.fillRect(x + pad, yellowY, Math.max(10, w - pad * 2), yellowH);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + pad, yellowY, Math.max(4, w - pad * 2), yellowH);
      ctx.clip();
      ctx.strokeStyle = "rgba(28, 20, 74, 0.24)";
      ctx.lineWidth = 1;
      for (let gx = x + pad + 26; gx < x + w - pad; gx += 26) {
        ctx.beginPath();
        ctx.moveTo(gx, yellowY);
        ctx.lineTo(gx, yellowY + yellowH);
        ctx.stroke();
      }
      ctx.fillStyle = "#181140";
      ctx.font = `900 ${w > 220 ? 13.5 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.fillText(w > 135 ? spec.heroCaption : "主视觉", x + pad + 8, yellowY + yellowH - 8);
      ctx.restore();

      const barY = yellowY + yellowH + 6;
      if (barY + 10 < y + h) {
        ctx.fillStyle = "#1C144A";
        ctx.fillRect(x + pad, barY, Math.max(8, (w - pad * 2) * 0.92), 2.5);
        ctx.fillRect(x + pad, barY + 6, Math.max(8, (w - pad * 2) * 0.64), 2.5);
      }
    } else if (m.role === "body") {
      const isToothpick = layout.avgCharsPerLine < 11;
      const isOverwide = layout.avgCharsPerLine > 36;
      ctx.fillStyle = "#F4FAF6";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isSel ? "#F7CD18" : (isToothpick || isOverwide ? "#AD1A30" : "#1C144A");
      ctx.lineWidth = isSel ? 2.8 : 1.8;
      ctx.strokeRect(x, y, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 6, y + 6, Math.max(4, w - 12), Math.max(4, h - 12));
      ctx.clip();

      ctx.fillStyle = isToothpick || isOverwide ? "#AD1A30" : "#0C6631";
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(`正文 · 约 ${layout.avgCharsPerLine} 字/行`, x + 9, y + 8);

      ctx.fillStyle = "#140E36";
      ctx.font = bodyFont;
      const lh = layout.bodyLineHeight;
      let ty = y + 26;
      for (const line of layout.bodyLines) {
        if (ty + 12 > y + h - 4) break;
        ctx.fillText(line, x + 9, ty);
        ty += lh;
      }
      ctx.restore();
    } else if (m.role === "matrix") {
      ctx.fillStyle = "#1EA956";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isSel ? "#F7CD18" : "#F4FFF7";
      ctx.lineWidth = isSel ? 2.8 : 1.8;
      ctx.strokeRect(x, y, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 6, y + 6, Math.max(4, w - 12), Math.max(4, h - 12));
      ctx.clip();

      ctx.fillStyle = "#181140";
      ctx.font = `900 11.5px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(w > 110 ? spec.matrixLabel : "点阵", x + 9, y + 8);

      const colsDot = w > 120 ? 5 : 3;
      const rowsDot = 3;
      const areaW = Math.max(24, w - 22);
      const stepX = areaW / colsDot;
      for (let r = 0; r < rowsDot; r++) {
        for (let c = 0; c < colsDot; c++) {
          ctx.fillStyle = "#1C144A";
          ctx.beginPath();
          ctx.arc(x + 11 + c * stepX + stepX * 0.5, y + 34 + r * 15, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const blockY = y + 80;
      if (blockY + 26 < y + h) {
        const bCols = w > 130 ? 4 : 2;
        const gap = 5;
        const bw = Math.max(8, (w - 18 - gap * (bCols - 1)) / bCols);
        const bh = Math.min(18, Math.max(10, (y + h - blockY - 14) / 2));
        ctx.fillStyle = "#F7CD18";
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < bCols; c++) {
            ctx.fillRect(x + 9 + c * (bw + gap), blockY + r * (bh + 5), bw, bh);
          }
        }
      }
      ctx.restore();
    } else if (m.role === "brief") {
      const inverted = ev.issues.some((it) => it.code === "hierarchy_inverted") && (m.span >= layout.headSpan && layout.headSpan <= 1);
      ctx.fillStyle = inverted ? "#3D1225" : "#1FA956";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isSel ? "#F7CD18" : (inverted ? "#FF8590" : "#F4FFF7");
      ctx.lineWidth = isSel ? 2.8 : 1.8;
      ctx.strokeRect(x, y, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 6, y + 6, Math.max(4, w - 12), Math.max(4, h - 12));
      ctx.clip();

      const items = spec.briefs;
      if (w < 130) {
        // 窄栏纵向排三条快讯圆点
        for (let i = 0; i < items.length; i++) {
          const iy = y + 18 + i * 28;
          if (iy + 10 > y + h - 4) break;
          ctx.fillStyle = inverted ? "#FF8590" : "#F7CD18";
          ctx.beginPath();
          ctx.arc(x + 15, iy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = inverted ? "#F4FFF7" : "#181140";
          ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(items[i], x + 25, iy);
        }
      } else {
        const count = w > 210 ? 3 : 2;
        const cellW = (w - 16) / count;
        for (let i = 0; i < count; i++) {
          const cx = x + 8 + i * cellW;
          ctx.fillStyle = inverted ? "#FF8590" : "#F7CD18";
          ctx.beginPath();
          ctx.arc(cx + 9, y + h * 0.36, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = inverted ? "#F4FFF7" : "#181140";
          ctx.font = `700 11px "Noto Sans SC", sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(items[i], cx + 21, y + h * 0.36);

          ctx.fillStyle = inverted ? "rgba(255,133,144,0.6)" : "#1C144A";
          ctx.fillRect(cx + 3, y + h * 0.62, Math.max(12, cellW - 14), 3);
          ctx.fillRect(cx + 3, y + h * 0.74, Math.max(10, (cellW - 14) * 0.65), 2.5);
        }
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#1B9A4F";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isSel ? "#F7CD18" : "#F4FFF7";
      ctx.lineWidth = isSel ? 2.8 : 1.8;
      ctx.strokeRect(x, y, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 6, y + 6, Math.max(4, w - 12), Math.max(4, h - 12));
      ctx.clip();
      ctx.fillStyle = "#181140";
      ctx.font = `900 11px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText("补白满塞", x + 8, y + 8);
      for (let ly = y + 26; ly < y + h - 8; ly += 9) {
        ctx.fillStyle = "rgba(24, 17, 64, 0.72)";
        ctx.fillRect(x + 8, ly, Math.max(10, w - 18), 3);
      }
      ctx.restore();
    }

    // 激活模块高亮右缘拖拽黄柄 + 跨栏角标
    if (isSel) {
      const handleW = 12;
      const handleH = Math.min(48, Math.max(24, h * 0.45));
      const hx = x + w - handleW / 2;
      const hy = y + (h - handleH) / 2;

      ctx.fillStyle = "#F7CD18";
      ctx.fillRect(hx, hy, handleW, handleH);
      ctx.strokeStyle = "#181140";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(hx, hy, handleW, handleH);

      ctx.beginPath();
      ctx.moveTo(hx + 4, hy + 6);
      ctx.lineTo(hx + 4, hy + handleH - 6);
      ctx.moveTo(hx + 8, hy + 6);
      ctx.lineTo(hx + 8, hy + handleH - 6);
      ctx.stroke();

      const tagTxt = `${m.isVoid ? "透气槽" : m.name} · ${m.span}栏 ↔`;
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tagTxt).width + 12;
      const tx = Math.min(sheetW - tw - 6, Math.max(6, x));
      const ty = y > layout.padTop + 22 ? y - 19 : y + 4;
      ctx.fillStyle = "#181140";
      ctx.fillRect(tx, ty, tw, 18);
      ctx.fillStyle = "#F7CD18";
      ctx.textBaseline = "middle";
      ctx.fillText(tagTxt, tx + 6, ty + 9);
    }

    ctx.restore();
  }

  // 5. 演播视线扫读路径（点「演播视线」或按 Space 触发）
  if (scanT >= 0 && ev.scanOrder.length >= 2) {
    const pts = ev.scanOrder.map((m) => ({
      x: m.x + m.w * 0.5,
      y: m.y + m.h * 0.5,
      label: m.name,
    }));
    const segs = pts.length - 1;
    const totalP = Math.min(1, scanT / 2.2);
    const curSegF = totalP * segs;

    ctx.save();
    ctx.strokeStyle = "#F7CD18";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < segs; i++) {
      const local = Math.max(0, Math.min(1, curSegF - i));
      if (local <= 0) break;
      const nx = pts[i].x + (pts[i + 1].x - pts[i].x) * local;
      const ny = pts[i].y + (pts[i + 1].y - pts[i].y) * local;
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 序号节点
    for (let i = 0; i < pts.length; i++) {
      const reached = curSegF >= i - 0.05;
      ctx.fillStyle = reached ? "#F7CD18" : "#181140";
      ctx.strokeStyle = "#181140";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = reached ? "#181140" : "#F4FFF7";
      ctx.font = `700 11px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), pts[i].x, pts[i].y + 0.5);
    }
    ctx.restore();
  }

  ctx.restore();
}

// Canvas 坐标转换（拖动中复用 cachedRect，零同步布局回流）
function canvasPointToSheet(clientX, clientY, forceFresh = false) {
  const rect = forceFresh || !cachedRect ? refreshHeroRect() : cachedRect;
  const sheetW = 720;
  const sheetH = Math.max(430, Math.min(720, Math.round(sheetW * (rect.height / Math.max(1, rect.width)))));
  return {
    x: ((clientX - rect.left) / Math.max(1, rect.width)) * sheetW,
    y: ((clientY - rect.top) / Math.max(1, rect.height)) * sheetH,
    sheetW,
    sheetH,
  };
}

function hitModule(px, py) {
  if (!latestLayout) return null;
  // 先查激活模块右柄（便于拖拉）
  const ordered = [...latestLayout.placed].sort((a, b) => (a.id === state.selectedId ? -1 : b.id === state.selectedId ? 1 : 0));
  for (const m of ordered) {
    if (px >= m.x - 6 && px <= m.x + m.w + 14 && py >= m.y - 4 && py <= m.y + m.h + 4) {
      const onRightHandle = px >= m.x + m.w - 22;
      return { mod: m, onRightHandle };
    }
  }
  return null;
}

// 统一鼠标 & 触摸拖动：水平拖拽实时拉伸跨栏数（支持 perf.mjs 在中心直接左右拖！）
function beginDrag(clientX, clientY) {
  const pt = canvasPointToSheet(clientX, clientY, true);
  const hit = hitModule(pt.x, pt.y);
  let targetMod = hit ? hit.mod : (latestLayout && latestLayout.placed.find((m) => m.id === state.selectedId)) || latestLayout?.placed[1];
  if (!targetMod) return;

  state.selectedId = targetMod.id;
  state.scanPhase = -1;

  // 若点在模块左半区且跨度小于总栏数，也可直接拖右拉伸；默认横拖统一调整跨栏宽度（对新手最直觉，且在任意起点左右来回拖都有明显连续重绘）
  const mode = hit && !hit.onRightHandle && pt.x < targetMod.x + Math.min(28, targetMod.w * 0.25) ? "move" : "resize";

  dragState = {
    id: targetMod.id,
    mode,
    startX: pt.x,
    startY: pt.y,
    origSpan: targetMod.span,
    origStart: targetMod.placedCol,
    liveSpanFloat: targetMod.span,
    liveStartFloat: targetMod.placedCol,
    moved: false,
  };
  needsRedraw = true;
}

function updateDrag(clientX, clientY) {
  if (!dragState || !latestLayout) return false;
  const pt = canvasPointToSheet(clientX, clientY);
  const dx = pt.x - dragState.startX;
  const dy = pt.y - dragState.startY;
  if (!dragState.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return false;
  dragState.moved = true;

  const trackStep = Math.max(24, latestLayout.trackStep);
  const deltaCols = dx / trackStep;

  if (dragState.mode === "resize") {
    const maxSpan = Math.max(1, state.cols - dragState.origStart);
    let nextFloat = dragState.origSpan + deltaCols;
    // 若往左拉过 1 栏或往右拉过当前起栏上限，同时自动顺移起栏，让来回横拖空间更充裕
    if (nextFloat > maxSpan && dragState.origStart > 0) {
      const shift = Math.min(dragState.origStart, Math.ceil(nextFloat - maxSpan));
      dragState.origStart -= shift;
      state.modules = state.modules.map((m) => (m.id === dragState.id ? { ...m, colStart: dragState.origStart } : m));
    }
    const clamped = Math.max(0.85, Math.min(state.cols - dragState.origStart, nextFloat));
    dragState.liveSpanFloat = clamped;
    const snapped = Math.max(1, Math.min(state.cols - dragState.origStart, Math.round(clamped)));
    state.modules = state.modules.map((m) => (m.id === dragState.id ? { ...m, span: snapped } : m));
  } else {
    const clampedStart = Math.max(0, Math.min(state.cols - dragState.origSpan, dragState.origStart + deltaCols));
    dragState.liveStartFloat = clampedStart;
    const snappedStart = Math.max(0, Math.min(state.cols - dragState.origSpan, Math.round(clampedStart)));
    state.modules = state.modules.map((m) => (m.id === dragState.id ? { ...m, colStart: snappedStart } : m));
  }
  needsRedraw = true;
  return true;
}

function endDrag() {
  if (!dragState) return;
  dragState = null;
  needsRedraw = true;
}

// Mouse events（拖动过程交由 rAF loop 合帧绘制，不阻塞输入事件）
heroCanvas.addEventListener("mousedown", (e) => {
  beginDrag(e.clientX, e.clientY);
  if (reducedMotion.matches) heroLoop.draw();
});
window.addEventListener("mousemove", (e) => {
  if (!dragState) return;
  updateDrag(e.clientX, e.clientY);
  if (reducedMotion.matches) heroLoop.draw();
});
window.addEventListener("mouseup", () => {
  if (!dragState) return;
  endDrag();
  if (reducedMotion.matches) heroLoop.draw();
});

// Touch events（只拦截水平拖动，保留垂直滚动页面；拖动交由 rAF 合帧绘制确保慢手机 60fps）
let touchStartClient = null;
heroCanvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  touchStartClient = { x: t.clientX, y: t.clientY, locked: null };
  beginDrag(t.clientX, t.clientY);
  if (reducedMotion.matches) heroLoop.draw();
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!dragState || !touchStartClient || e.touches.length !== 1) return;
  const t = e.touches[0];
  if (!touchStartClient.locked) {
    const adx = Math.abs(t.clientX - touchStartClient.x);
    const ady = Math.abs(t.clientY - touchStartClient.y);
    if (adx + ady > 5) {
      touchStartClient.locked = adx >= ady ? "x" : "y";
    }
  }
  if (touchStartClient.locked === "y") {
    endDrag();
    return;
  }
  if (touchStartClient.locked === "x") {
    e.preventDefault();
  }
  updateDrag(t.clientX, t.clientY);
  if (reducedMotion.matches) heroLoop.draw();
}, { passive: false });

heroCanvas.addEventListener("touchend", () => {
  touchStartClient = null;
  if (dragState) {
    endDrag();
    if (reducedMotion.matches) heroLoop.draw();
  }
});

// 键盘操作画布
heroCanvas.addEventListener("keydown", (e) => {
  const sel = getSelectedModule();
  if (!sel) return;
  if (e.key === "ArrowRight") {
    e.preventDefault();
    adjustSelectedSpan(1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    adjustSelectedSpan(-1);
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const idx = state.modules.findIndex((m) => m.id === state.selectedId);
    const next = (idx + (e.key === "ArrowDown" ? 1 : -1) + state.modules.length) % state.modules.length;
    state.selectedId = state.modules[next].id;
    needsRedraw = true;
    heroLoop.draw();
  } else if (e.key === " ") {
    e.preventDefault();
    triggerScan();
  }
});

function adjustSelectedSpan(delta) {
  const sel = getSelectedModule();
  if (!sel) return;
  const nextSpan = Math.max(1, Math.min(state.cols, sel.span + delta));
  const nextStart = Math.min(sel.colStart, state.cols - nextSpan);
  state.modules = state.modules.map((m) => (m.id === sel.id ? { ...m, span: nextSpan, colStart: Math.max(0, nextStart) } : m));
  needsRedraw = true;
  heroLoop.draw();
}

function shiftSelectedCol() {
  const sel = getSelectedModule();
  if (!sel) return;
  const maxStart = Math.max(0, state.cols - sel.span);
  const nextStart = maxStart === 0 ? 0 : (sel.colStart + 1) % (maxStart + 1);
  state.modules = state.modules.map((m) => (m.id === sel.id ? { ...m, colStart: nextStart } : m));
  needsRedraw = true;
  heroLoop.draw();
}

function triggerScan() {
  if (reducedMotion.matches) {
    state.scanPhase = 2.2;
  } else {
    state.scanPhase = 0;
  }
  needsRedraw = true;
  heroLoop.draw();
}

// 绑定 Hero 控件事件
document.querySelectorAll(".specimen-tabs .tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    document.querySelectorAll(".specimen-tabs .tab-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    needsRedraw = true;
    heroLoop.draw();
  });
});

document.querySelectorAll("#cols-btns .col-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = remapStateCols(state, Number(btn.dataset.cols));
    state.scanPhase = -1;
    needsRedraw = true;
    heroLoop.draw();
  });
});

document.getElementById("btn-span-dec").addEventListener("click", () => adjustSelectedSpan(-1));
document.getElementById("btn-span-inc").addEventListener("click", () => adjustSelectedSpan(1));
document.getElementById("btn-col-shift").addEventListener("click", () => shiftSelectedCol());

btnVoid.addEventListener("click", () => {
  state.voidEnabled = !state.voidEnabled;
  needsRedraw = true;
  heroLoop.draw();
});

btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  needsRedraw = true;
  heroLoop.draw();
});

btnScan.addEventListener("click", () => triggerScan());

rngGutter.addEventListener("input", () => {
  state.gutter = Number(rngGutter.value);
  needsRedraw = true;
  heroLoop.draw();
});

rngDrift.addEventListener("input", () => {
  state.drift = Number(rngDrift.value);
  needsRedraw = true;
  heroLoop.draw();
});

btnQuickFix.addEventListener("click", () => {
  if (latestEval && latestEval.primary && latestEval.primary.fix) {
    state = latestEval.primary.fix(state);
    state.scanPhase = -1;
    needsRedraw = true;
    heroLoop.draw();
  }
});

document.querySelectorAll("#preset-btns .preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state = p.apply(state.specimen);
    needsRedraw = true;
    heroLoop.draw();
  });
});

// 点原海报四柱按钮直接选中对应受检模块并滚回画布焦点
document.querySelectorAll(".pillar-col").forEach((btn) => {
  btn.addEventListener("click", () => {
    const kind = btn.dataset.pillarFocus;
    if (kind === "grid") rngGutter.focus();
    else if (kind === "module") state.selectedId = "hero";
    else if (kind === "density") state.selectedId = "body";
    else if (kind === "org") state.selectedId = "headline";
    needsRedraw = true;
    heroLoop.draw();
  });
});

// 统一用 lib/stage.js loop 驱动：静置零空转，动画/拖动时高帧率重绘
const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  if (still) {
    introElapsed = 1;
    drawHero(1, state.scanPhase >= 0 ? 2.2 : -1);
    needsRedraw = false;
    return;
  }

  let animating = false;
  if (introElapsed < 1) {
    introElapsed = Math.min(1, introElapsed + (dt || 0.016) * 1.35);
    animating = true;
  }

  if (state.scanPhase >= 0) {
    state.scanPhase += dt || 0.016;
    if (state.scanPhase > 2.8) {
      state.scanPhase = -1;
    } else {
      animating = true;
    }
  }

  if (animating || needsRedraw) {
    drawHero(introElapsed, state.scanPhase);
    needsRedraw = false;
  }
});

// =========================================================================
// 2. Section 01：整除拆分互动矩阵
// =========================================================================
const elDivTag = document.getElementById("div-tag");
const elDivVerdict = document.getElementById("div-verdict");
const elDivBars = document.getElementById("div-bars");

function renderDivisibility(cols) {
  const data = DIVISIBILITY_DATA[cols] || DIVISIBILITY_DATA[6];
  elDivTag.textContent = `${data.cols} 栏 · ${data.tag}`;
  elDivVerdict.textContent = data.verdict;

  elDivBars.innerHTML = "";
  for (const pat of data.patterns) {
    const row = document.createElement("div");
    row.className = "div-row";

    const lbl = document.createElement("div");
    lbl.className = "div-row-label";
    lbl.textContent = pat.label;

    const track = document.createElement("div");
    track.className = "div-track";
    track.style.gridTemplateColumns = pat.spans.map((s) => `${s}fr`).join(" ");

    pat.spans.forEach((sp, idx) => {
      const seg = document.createElement("div");
      const isVoidPat = pat.label.includes("留白") && (idx === 0 || idx === pat.spans.length - 1);
      seg.className = "div-seg" + (isVoidPat ? " is-void" : idx === 0 && pat.spans.length > 1 && sp >= Math.max(...pat.spans) ? " is-accent" : "");
      seg.textContent = isVoidPat ? `留白 ${sp}` : `${sp}栏`;
      track.append(seg);
    });

    const note = document.createElement("p");
    note.className = "div-row-note";
    note.textContent = pat.note;

    row.append(lbl, track, note);
    elDivBars.append(row);
  }
}

document.querySelectorAll(".div-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".div-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderDivisibility(Number(tab.dataset.div));
  });
});
renderDivisibility(6);

// =========================================================================
// 3. Section 02：原海报四柱微型开关标本
// =========================================================================
const microState = { grid: true, module: true, density: true, org: true };

function renderMicroViz(key) {
  const on = microState[key];
  const el = document.getElementById(`viz-${key}`);
  if (!el) return;

  if (key === "grid") {
    el.innerHTML = on
      ? `<svg viewBox="0 0 220 120"><g stroke="#F4FFF7" stroke-width="1.4" fill="none"><rect x="14" y="10" width="192" height="100"/><line x1="78" y1="10" x2="78" y2="110"/><line x1="142" y1="10" x2="142" y2="110"/><line x1="14" y1="43" x2="206" y2="43"/><line x1="14" y1="76" x2="206" y2="76"/></g><rect x="14" y="10" width="128" height="33" fill="#F7CD18" stroke="#1C144A" stroke-width="1.5"/><rect x="142" y="43" width="64" height="67" fill="#1C144A"/></svg>`
      : `<svg viewBox="0 0 220 120"><g stroke="rgba(244,255,247,0.45)" stroke-dasharray="3 3" stroke-width="1.2" fill="none"><rect x="14" y="10" width="192" height="100"/><line x1="78" y1="10" x2="78" y2="110"/><line x1="142" y1="10" x2="142" y2="110"/></g><rect x="26" y="14" width="118" height="30" fill="#F7CD18" stroke="#AD1A30" stroke-width="2"/><rect x="128" y="54" width="70" height="52" fill="#1C144A" stroke="#AD1A30" stroke-width="2"/></svg>`;
  } else if (key === "module") {
    el.innerHTML = on
      ? `<svg viewBox="0 0 220 120"><rect x="10" y="10" width="200" height="24" fill="#1C144A" stroke="#F4FFF7" stroke-width="1.5"/><rect x="10" y="42" width="126" height="68" fill="#F7CD18" stroke="#F4FFF7" stroke-width="1.5"/><rect x="144" y="42" width="66" height="30" fill="#1C144A" stroke="#F4FFF7" stroke-width="1.5"/><rect x="144" y="80" width="66" height="30" fill="none" stroke="#F4FFF7" stroke-width="1.5"/><circle cx="162" cy="57" r="7" fill="#F7CD18"/><circle cx="182" cy="57" r="7" fill="#F7CD18"/></svg>`
      : `<svg viewBox="0 0 220 120"><g fill="#1C144A" stroke="#F4FFF7" stroke-width="1.4"><rect x="10" y="10" width="62" height="46"/><rect x="79" y="10" width="62" height="46"/><rect x="148" y="10" width="62" height="46"/><rect x="10" y="64" width="62" height="46"/><rect x="79" y="64" width="62" height="46"/><rect x="148" y="64" width="62" height="46"/></g></svg>`;
  } else if (key === "density") {
    el.innerHTML = on
      ? `<svg viewBox="0 0 220 120"><g fill="#1C144A"><circle cx="24" cy="22" r="3"/><circle cx="48" cy="22" r="3"/><circle cx="72" cy="22" r="3"/><circle cx="96" cy="22" r="3"/><circle cx="24" cy="40" r="3"/><circle cx="48" cy="40" r="3"/><circle cx="72" cy="40" r="3"/><circle cx="96" cy="40" r="3"/></g><rect x="118" y="12" width="92" height="96" fill="none" stroke="#F4FFF7" stroke-dasharray="4 3" stroke-width="1.5"/><rect x="14" y="58" width="92" height="50" fill="#F7CD18" stroke="#1C144A" stroke-width="1.5"/><rect x="24" y="70" width="72" height="4" fill="#1C144A"/><rect x="24" y="81" width="64" height="4" fill="#1C144A"/><rect x="24" y="92" width="52" height="4" fill="#1C144A"/></svg>`
      : `<svg viewBox="0 0 220 120"><g fill="#1C144A">${Array.from({ length: 10 }, (_, r) => `<rect x="10" y="${10 + r * 10.5}" width="96" height="5"/><rect x="114" y="${10 + r * 10.5}" width="96" height="5"/>`).join("")}</g></svg>`;
  } else if (key === "org") {
    el.innerHTML = on
      ? `<svg viewBox="0 0 220 120"><circle cx="24" cy="22" r="9" fill="#1C144A"/><rect x="42" y="15" width="166" height="5" fill="#1C144A"/><rect x="42" y="25" width="110" height="4" fill="#1C144A"/><rect x="14" y="38" width="194" height="44" fill="#F7CD18" stroke="#F4FFF7" stroke-width="1.5"/><rect x="14" y="90" width="60" height="20" fill="#1C144A"/><rect x="81" y="90" width="60" height="20" fill="#1C144A"/><rect x="148" y="90" width="60" height="20" fill="#1C144A"/></svg>`
      : `<svg viewBox="0 0 220 120"><rect x="14" y="10" width="60" height="20" fill="#1C144A"/><rect x="81" y="10" width="60" height="20" fill="#1C144A"/><rect x="148" y="10" width="60" height="20" fill="#1C144A"/><rect x="14" y="40" width="90" height="68" fill="#1C144A"/><rect x="114" y="64" width="94" height="44" fill="#F7CD18"/><circle cx="192" cy="48" r="7" fill="#1C144A"/></svg>`;
  }
}

const microLabels = {
  grid: ["状态：踩紧栏轨", "状态：脱栏偏位"],
  module: ["状态：跨栏组合", "状态：等宽豆腐块"],
  density: ["状态：疏密对比", "状态：满塞窒息"],
  org: ["状态：主次分层", "状态：无序倒挂"],
};

document.querySelectorAll(".micro-toggle").forEach((btn) => {
  const key = btn.dataset.micro;
  renderMicroViz(key);
  btn.addEventListener("click", () => {
    microState[key] = !microState[key];
    btn.setAttribute("aria-pressed", String(microState[key]));
    btn.textContent = microState[key] ? microLabels[key][0] : microLabels[key][1];
    renderMicroViz(key);
  });
});

// =========================================================================
// 4. Section 03：报刊栏宽与齐行豁口实验室 (2D Canvas)
// =========================================================================
const labCanvas = document.getElementById("lab-canvas");
const labCtx = labCanvas.getContext("2d");
const labState = { cols: 4, fontSize: 15, gutter: 18, align: "left" };

const LAB_COPY = "多栏版式把一张宽纸划出清晰纵轴，让报刊与杂志在同一屏里并行安排头条、配图、短讯与数据表。一旦把页幅切得过碎，每行只容得下七八个字，完整句子不断被折断，如果再强行套用两端对齐，标点与词距就会被拉扯成一条条刺眼的空白裂隙，让人越读越累。保持合适栏宽并留出明确栏距，眼睛就能在每栏内部安稳下行，既不会跨缝串行，也能在整张版面上迅速挑出想读的重点。";

function drawLab() {
  const rect = labCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const dpr = pixelRatio(2);
  const pw = Math.round(rect.width * dpr);
  const ph = Math.round(rect.height * dpr);
  if (labCanvas.width !== pw || labCanvas.height !== ph) {
    labCanvas.width = pw;
    labCanvas.height = ph;
  }

  const res = computeMeasureLab(labState);

  // 更新 DOM 读数（与画布 100% 同源：使用同一个 res.colW）
  const elM = document.getElementById("lab-out-measure");
  elM.textContent = `${res.colW}px · 约 ${res.cjkPerLine} 汉字/行`;
  elM.className = "lab-stat-v " + (res.measureState === "ok" ? "is-ok" : "is-bad");
  document.getElementById("lab-out-mdesc").textContent = res.measureText;

  const elG = document.getElementById("lab-out-gutter");
  elG.textContent = `${res.gutter}px（行距 ${res.gutterRatio}×）`;
  elG.className = "lab-stat-v " + (res.gutterState === "ok" ? "is-ok" : "is-bad");
  document.getElementById("lab-out-gdesc").textContent = res.gutterText;

  const elA = document.getElementById("lab-out-align");
  const badJustify = labState.align === "justify" && res.cjkPerLine < 15;
  elA.textContent = labState.align === "justify" ? (badJustify ? "两端对齐 · 白河明显" : "两端对齐") : "左齐不齐右 · 稳健";
  elA.className = "lab-stat-v " + (badJustify ? "is-bad" : "is-ok");
  document.getElementById("lab-out-adesc").textContent = res.riverRisk;

  const ctx = labCtx;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const vw = res.pageW;
  const vh = Math.max(280, Math.round(vw * (rect.height / rect.width)));
  ctx.scale(rect.width / vw, rect.height / vh);

  ctx.fillStyle = "#100B2A";
  ctx.fillRect(0, 0, vw, vh);

  const padX = res.padX;
  const padTop = 34;
  const padBot = 16;
  const gutter = res.gutter;
  const colW = res.colWExact;

  ctx.fillStyle = "#B8C4DB";
  ctx.font = `500 13px "DM Mono", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(`固定版心 ${res.usableW}px  ·  ${res.cols} 栏等分  ·  单栏 ${res.colW}px  ·  字号 ${res.fontSize}px`, padX, 17);

  const fontStr = `400 ${res.fontSize}px "Noto Sans SC", sans-serif`;
  const measure = (s) => {
    ctx.font = fontStr;
    return ctx.measureText(s).width;
  };
  const lines = wrapTextLines(LAB_COPY, colW - 14, res.fontSize, measure);

  for (let c = 0; c < res.cols; c++) {
    const cx = padX + c * (colW + gutter);
    // 纸栏背景
    ctx.fillStyle = "#F4FAF6";
    ctx.fillRect(cx, padTop, colW, vh - padTop - padBot);
    ctx.strokeStyle = res.measureState === "narrow" ? "#FF8590" : "#56E892";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(cx, padTop, colW, vh - padTop - padBot);

    // 栏间串读红带提示
    if (c < res.cols - 1 && res.gutterState === "tight") {
      ctx.fillStyle = "rgba(255, 133, 144, 0.36)";
      ctx.fillRect(cx + colW, padTop, gutter, vh - padTop - padBot);
    }

    // 栏内逐行排字（支持左对齐 vs 两端对齐白河可视化）
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 5, padTop + 5, Math.max(4, colW - 10), vh - padTop - padBot - 10);
    ctx.clip();

    ctx.fillStyle = "#181140";
    ctx.font = fontStr;
    ctx.textBaseline = "top";
    const lh = res.leading;
    let ty = padTop + 12;

    lines.forEach((line, li) => {
      if (ty + res.fontSize > vh - padBot - 6) return;
      const chars = [...line];
      const innerW = colW - 16;
      const rawW = measure(line);
      const isLast = li === lines.length - 1;

      if (labState.align === "justify" && !isLast && chars.length > 2) {
        const extra = Math.max(0, innerW - rawW);
        const gap = extra / (chars.length - 1);
        let px = cx + 8;
        for (let k = 0; k < chars.length; k++) {
          ctx.fillText(chars[k], px, ty);
          const cw = measure(chars[k]);
          if (gap > 3.2 && k < chars.length - 1) {
            // 高亮「白河豁口」
            ctx.fillStyle = "rgba(173, 26, 48, 0.25)";
            ctx.fillRect(px + cw, ty + 2, gap, res.fontSize - 2);
            ctx.fillStyle = "#181140";
          }
          px += cw + gap;
        }
      } else {
        ctx.fillText(line, cx + 8, ty);
      }
      ty += lh;
    });
    ctx.restore();
  }
  ctx.restore();
}

document.querySelectorAll("#lab-cols .lab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    labState.cols = Number(btn.dataset.lcols);
    document.querySelectorAll("#lab-cols .lab-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawLab();
  });
});

document.querySelectorAll("#lab-align .lab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    labState.align = btn.dataset.lalign;
    document.querySelectorAll("#lab-align .lab-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawLab();
  });
});

document.getElementById("lab-fs").addEventListener("input", (e) => {
  labState.fontSize = Number(e.target.value);
  document.getElementById("lab-fs-val").textContent = `${labState.fontSize}px`;
  drawLab();
});

document.getElementById("lab-gt").addEventListener("input", (e) => {
  labState.gutter = Number(e.target.value);
  document.getElementById("lab-gt-val").textContent = `${labState.gutter}px`;
  drawLab();
});

// 使用 IntersectionObserver + resize 保证 03 实验室进屏就画清且省电
let labDrawnOnce = false;
new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    drawLab();
    labDrawnOnce = true;
  }
}).observe(labCanvas);

// =========================================================================
// 5. Section 04：历史里程碑建筑图谱（全部已核实人名、书名、年份）
// =========================================================================
const HISTORY_DATA = [
  {
    meta: "MAINZ, GERMANY · c. 1455",
    title: "古腾堡 42 行圣经（Gutenberg Bible）",
    body: "约翰内斯·古腾堡在美因茨用金属活字印成 42 行圣经。面对宽大的对开本页面，他沿袭中世纪手抄本智慧，将每页一分为二、每栏排满 42 行哥特体。这一步奠定了欧洲印刷史用「分栏」收束长行、提升大开本可读性的原点（双栏专题可参见 133 双栏版式）。",
    fact: "核实来源：美国国会图书馆（Library of Congress）古腾堡圣经馆藏专题。",
    svg: `<svg viewBox="0 0 220 160"><rect x="10" y="10" width="200" height="140" fill="#F7F6EE" stroke="#1C144A" stroke-width="2"/><line x1="110" y1="10" x2="110" y2="150" stroke="#1C144A" stroke-width="1.5" stroke-dasharray="3 3"/><rect x="24" y="24" width="34" height="110" fill="none" stroke="#1C144A" stroke-width="1.2"/><rect x="64" y="24" width="34" height="110" fill="none" stroke="#1C144A" stroke-width="1.2"/><rect x="122" y="24" width="34" height="110" fill="none" stroke="#1C144A" stroke-width="1.2"/><rect x="162" y="24" width="34" height="110" fill="none" stroke="#1C144A" stroke-width="1.2"/><rect x="24" y="24" width="14" height="18" fill="#F7CD18"/><rect x="122" y="24" width="14" height="18" fill="#F7CD18"/><g fill="#1C144A" opacity="0.8">${Array.from({ length: 10 }, (_, i) => `<rect x="27" y="${48 + i * 8}" width="28" height="2.5"/><rect x="67" y="${30 + i * 9.5}" width="28" height="2.5"/><rect x="125" y="${48 + i * 8}" width="28" height="2.5"/><rect x="165" y="${30 + i * 9.5}" width="28" height="2.5"/>`).join("")}</g></svg>`,
  },
  {
    meta: "BASEL / SWITZERLAND · 1962 / 1964",
    title: "卡尔·格斯特纳《设计程序》与 58 单位活动网格",
    body: "1962 年，瑞士设计师卡尔·格斯特纳（Karl Gerstner）为德国商业周刊 Capital 设计了一套沿页宽切成 58 个基础单位、栏距固定 2 单位的「活动网格（mobile grid）」。因为 58 扣去固定栏距后能同时容纳 1、2、3、4、5、6 栏的叠加对齐，他在 1964 年由 Arthur Niggli 出版的《设计程序》（Programme entwerfen / Designing Programmes）里，正式把多栏网格写成一套可复用的设计程序。",
    fact: "核实来源：Lars Müller Publishers《Designing Programmes》复刻版出版页。",
    svg: `<svg viewBox="0 0 220 160"><rect x="10" y="10" width="200" height="140" fill="#181140" stroke="#F4FFF7" stroke-width="1.8"/><g stroke="rgba(244,255,247,0.35)" stroke-width="1">${[42, 74, 106, 138, 170].map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="150"/>`).join("")}</g><rect x="16" y="18" width="188" height="24" fill="#F7CD18"/><rect x="16" y="50" width="88" height="42" fill="#23BA60"/><rect x="112" y="50" width="92" height="42" fill="#23BA60"/><rect x="16" y="100" width="58" height="40" fill="#F4FFF7"/><rect x="81" y="100" width="58" height="40" fill="#F4FFF7"/><rect x="146" y="100" width="58" height="40" fill="#F4FFF7"/></svg>`,
  },
  {
    meta: "BASEL · 1967",
    title: "埃米尔·鲁德《字体排印》（Typographie）",
    body: "1967 年，巴塞尔设计学院教师埃米尔·鲁德（Emil Ruder）经由 Niggli 出版社出版《Typographie》。他把网格比作支撑多栏图文变奏的理性脚手架，并大力倡导窄栏采用「齐左不齐右（flush-left, ragged-right）」排法，避免强行两端对齐破坏字距均匀，同时反复强调实块与空白之间的疏密节奏。",
    fact: "核实来源：Arthur Niggli Verlag 1967 年初版《Typographie》。",
    svg: `<svg viewBox="0 0 220 160"><rect x="10" y="10" width="200" height="140" fill="#F4FAF6" stroke="#1C144A" stroke-width="2"/><g stroke="#B8D4C2" stroke-width="1"><line x1="76" y1="10" x2="76" y2="150"/><line x1="144" y1="10" x2="144" y2="150"/><line x1="10" y1="56" x2="210" y2="56"/><line x1="10" y1="104" x2="210" y2="104"/></g><rect x="18" y="18" width="118" height="32" fill="#1C144A"/><g fill="#1C144A"><rect x="18" y="64" width="48" height="4"/><rect x="18" y="74" width="40" height="4"/><rect x="18" y="84" width="46" height="4"/><rect x="18" y="94" width="32" height="4"/><rect x="84" y="64" width="50" height="4"/><rect x="84" y="74" width="42" height="4"/><rect x="84" y="84" width="48" height="4"/><rect x="84" y="94" width="36" height="4"/></g><rect x="152" y="64" width="50" height="74" fill="#F7CD18"/></svg>`,
  },
  {
    meta: "NEW YORK · SEPTEMBER 7, 1976",
    title: "《纽约时报》从八栏改为六栏",
    body: "1976 年 9 月 7 日，在艺术总监路易斯·西尔弗斯坦（Louis Silverstein）主导下，《纽约时报》在不改动纸张总宽度的前提下，正式告别沿用数代的密挤八栏，切换为更宽敞的六栏大报版式。更宽的单栏与更清晰的栏间空白显著降低了阅读压迫感，也确立了现代大报多栏网格的典范。",
    fact: "核实事实：1976 年 9 月 7 日改版兼推四叠分区架构，6 栏通栏大标此后专留给重大历史事件。",
    svg: `<svg viewBox="0 0 220 160"><rect x="10" y="10" width="94" height="140" fill="#E7F3EC" stroke="#1C144A" stroke-width="1.8"/><text x="57" y="26" font-size="9" text-anchor="middle" fill="#AD1A30" font-weight="700">OLD 8 COLS</text><g fill="#1C144A" opacity="0.65">${Array.from({ length: 8 }, (_, i) => `<rect x="${15 + i * 10.6}" y="34" width="8.2" height="108"/>`).join("")}</g><rect x="116" y="10" width="94" height="140" fill="#F4FAF6" stroke="#1C144A" stroke-width="1.8"/><text x="163" y="26" font-size="9" text-anchor="middle" fill="#0C6631" font-weight="700">1976 · 6 COLS</text><rect x="122" y="34" width="82" height="16" fill="#1C144A"/><rect x="122" y="55" width="53" height="36" fill="#F7CD18"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${122 + i * 14}" y="98" width="10.5" height="44" fill="#1C144A" opacity="0.82"/>`).join("")}</svg>`,
  },
  {
    meta: "ZÜRICH 1981 → W3C WEB STANDARD",
    title: "米勒-布罗克曼《平面设计中的网格系统》与 CSS 多栏",
    body: "1981 年，约瑟夫·米勒-布罗克曼（Josef Müller-Brockmann）经 Arthur Niggli 出版《Raster-Systeme für die visuelle Gestaltung》（英译 Grid Systems in Graphic Design），系统整理了从 8 格到 32 格的多栏模块化版面法则。进入网页时代后，W3C 制定 CSS Multi-column Layout Module Level 1（column-count、column-gap、column-span），与 CSS Grid 一道把纸媒百年多栏逻辑带入屏幕。",
    fact: "核实来源：Niggli Verlag 1981 原版目录及 W3C CSS Multi-column Layout Module Level 1 规范。",
    svg: `<svg viewBox="0 0 220 160"><rect x="10" y="10" width="200" height="140" fill="#23BA60" stroke="#F4FFF7" stroke-width="2"/><g stroke="#F4FFF7" stroke-width="1.2" fill="none">${[43, 76, 110, 143, 176].map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="150"/>`).join("")}<line x1="10" y1="46" x2="210" y2="46"/><line x1="10" y1="98" x2="210" y2="98"/></g><rect x="10" y="10" width="133" height="36" fill="#1C144A"/><rect x="10" y="46" width="100" height="52" fill="#F7CD18"/><rect x="110" y="46" width="66" height="104" fill="#F4FAF6" stroke="#1C144A" stroke-width="1.4"/></svg>`,
  },
];

function renderHistory(idx) {
  const item = HISTORY_DATA[idx] || HISTORY_DATA[0];
  document.getElementById("hist-svg").innerHTML = item.svg;
  document.getElementById("hist-meta").textContent = item.meta;
  document.getElementById("hist-title").textContent = item.title;
  document.getElementById("hist-body").textContent = item.body;
  document.getElementById("hist-fact").textContent = item.fact;
}

document.querySelectorAll(".hist-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".hist-item").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderHistory(Number(btn.dataset.hist));
  });
});
renderHistory(0);

// =========================================================================
// 6. Section 05：应用场景分诊器
// =========================================================================
const TRIAGE_DATA = {
  editorial: {
    cls: "is-yes",
    verdict: "最拿手的舞台",
    spec: "RECOMMENDED · 3 / 6 COLUMNS",
    title: "报刊头版、综合杂志与新闻门户",
    body: "同一张版面里既有要抢第一眼的头条大图，又有 2–3 条次要快讯、数据摘要与导读索引时，多栏能靠统一的隐形纵轴把不同来源的信息收拢成有主次的整体。",
    tips: [
      "优先 6 栏底座，随时在 3+3、4+2、2+2+2 间切换。",
      "头条大标与主图跨多栏，正文按舒适行宽（约 14–24 字/行）落位。",
      "每张整版至少留出半栏到一栏的呼吸留白，拒绝黄页式满铺。",
      "窄栏正文优先用「左齐不齐右」，减少两端对齐造成的空白豁口。",
    ],
  },
  catalog: {
    cls: "is-yes",
    verdict: "推荐使用多栏",
    spec: "RECOMMENDED · 4 / 12 COLUMNS",
    title: "商品图录、展会折页、年鉴与参数索引",
    body: "需要横向比较多个条目、同时突出一两件主打展品时，多栏配合标准化模块卡片能让读者极快建立扫描预期，并在大跨度主角处自然停驻。",
    tips: [
      "常规条目统一占 1 份标准模块宽，主打新品横跨 2–3 份模块宽。",
      "图片框、标题基线与参数点阵严格对齐，强化可比性。",
      "善用栏距与留白把不同品类切开，不要只靠加粗黑框硬隔。",
      "若每条内容都严格锁进横纵方格，可进一步参考模块化栅格思路。",
    ],
  },
  novel: {
    cls: "is-no",
    verdict: "这时候别用多栏",
    spec: "AVOID · SWITCH TO SINGLE COLUMN",
    title: "纯文学长篇、深度专栏与单一流程表单",
    body: "小说、散文或结账表单追求的是从上到下不被打断的单一心流。硬把长文切成三四栏，不仅频繁迫使视线回跳换栏，还会凭空制造分心干扰——这类场景请直接换用 132 单栏版式。",
    tips: [
      "单主线连续阅读优先选单栏（约 26–38 汉字/行），安静专注。",
      "若只是左右双语对照或正文配旁注，用 133 双栏版式即可，无需三栏以上。",
      "网页长文慎用 CSS 多栏，因为超出首屏高度后读者会被迫上下反复滚屏来回找下一栏。",
      "只在短篇提要、附录索引或纸媒宽幅里给连续文本分多栏。",
    ],
  },
  mobile: {
    cls: "is-warn",
    verdict: "窄屏必须自动塌缩",
    spec: "CAUTION · COLLAPSE BELOW 600px",
    title: "手机竖屏（360–430px 宽）切忌硬塞三四栏文字",
    body: "在 390px 宽的手机屏上硬拆 3–4 栏正文，每栏不到 90px，一行只能挤下五六个汉字，阅读体验瞬间崩溃。桌面端的多栏骨架到了窄屏必须果断折叠成 1 栏流（或仅保留 2 栏纯图卡）。",
    tips: [
      "文字内容在手机竖屏回到单栏流，保留视觉层级靠字号和间距而非多栏。",
      "图片或图标网格最多 2 栏，确保点击区 ≥ 40px、标题不断成竖条。",
      "设计之初就规划好「桌面 6/12 栏 → 平板 2/4 栏 → 手机 1 栏」的跨度收拢顺序。",
      "不要把纸媒多栏截图原样塞进手机屏幕让人双指放大着读。",
    ],
  },
  spread: {
    cls: "is-warn",
    verdict: "注意与跨页、出血配合",
    spec: "COORDINATE · GUTTER & BLEED",
    title: "装订跨页画册与出血海报",
    body: "多栏解决的是「单页或整张展面内部如何分轨拼块」。当版面跨越书脊中缝，或者图像要一路冲过裁切线时，必须把中缝订口留白和出血边一起算进多栏网格里。",
    tips: [
      "纸书跨页时，靠近书脊的内侧页边距要比外侧更宽，防止字掉进装订缝。",
      "标题或正文尽量不要卡在书脊折缝上，跨页大图另按 137 通版跨页处理。",
      "多栏页既可以像 134 原海报一样四周守白框（139 无出血思路），也可让主图向外满出血（138 满出血）。",
      "左右两页共用同一套 6 栏或 12 栏底格，对称或非对称跨页才不会各自为政。",
    ],
  },
};

function renderTriage(key) {
  const d = TRIAGE_DATA[key] || TRIAGE_DATA.editorial;
  const elV = document.getElementById("triage-verdict");
  elV.textContent = d.verdict;
  elV.className = "triage-verdict " + d.cls;
  document.getElementById("triage-spec").textContent = d.spec;
  document.getElementById("triage-h3").textContent = d.title;
  document.getElementById("triage-p").textContent = d.body;
  const ul = document.getElementById("triage-tips");
  ul.innerHTML = d.tips.map((t) => `<li>${t}</li>`).join("");
}

document.querySelectorAll(".triage-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".triage-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderTriage(btn.dataset.triage);
  });
});
renderTriage("editorial");

// =========================================================================
// 7. Section 06：视觉辨析小练习（2 题 × 4 中性选项，仅差单一关键变量）
// =========================================================================
const QUIZZES = [
  {
    prompt: "第 1 题：一份 6 栏建筑周刊专题页，需要放入头条标题、主视觉图、导语正文和快讯。以下四版使用完全相同的 6 栏底格与配色，仅在跨栏分配、栏轨对齐和留白上不同。哪一版最成立？",
    correct: "B",
    options: [
      {
        id: "A",
        label: "方案 A",
        svg: `<svg viewBox="0 0 220 150"><g stroke="rgba(244,255,247,0.45)" stroke-width="1">${[42, 74, 106, 138, 170].map((x) => `<line x1="${x}" y1="8" x2="${x}" y2="142"/>`).join("")}</g>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${12 + i * 33}" y="12" width="28" height="58" fill="${i === 1 ? "#F7CD18" : "#1C144A"}" stroke="#F4FFF7" stroke-width="1.2"/><rect x="${12 + i * 33}" y="78" width="28" height="58" fill="#F4FAF6" stroke="#1C144A" stroke-width="1.2"/>`).join("")}</svg>`,
        explain: "方案 A 虽踩在 6 栏线上，但所有模块都被切成完全相同的 1 栏窄豆腐块且上下塞满。没有跨栏尺度反差，正文被压成碎纸条，读者进页完全找不到主次入口。",
      },
      {
        id: "B",
        label: "方案 B",
        svg: `<svg viewBox="0 0 220 150"><g stroke="rgba(244,255,247,0.45)" stroke-width="1">${[44, 77, 110, 143, 176].map((x) => `<line x1="${x}" y1="8" x2="${x}" y2="142"/>`).join("")}</g><rect x="12" y="12" width="196" height="22" fill="#1C144A" stroke="#F4FFF7" stroke-width="1.4"/><rect x="12" y="42" width="128" height="46" fill="#F7CD18" stroke="#F4FFF7" stroke-width="1.4"/><rect x="148" y="42" width="60" height="46" fill="#F4FAF6" stroke="#1C144A" stroke-width="1.3"/><rect x="12" y="96" width="94" height="42" fill="#F4FAF6" stroke="#1C144A" stroke-width="1.3"/><rect x="114" y="96" width="60" height="42" fill="#1C144A" stroke="#F4FFF7" stroke-width="1.3"/><rect x="180" y="96" width="28" height="42" fill="none" stroke="#F4FFF7" stroke-dasharray="3 3" stroke-width="1.4"/></svg>`,
        explain: "答对了！方案 B 全部模块严密踩齐 6 栏白线，同时借跨栏拉开层次（6 栏大标 → 4 栏主图配 2 栏导语 → 下方 3 栏正文 + 2 栏快讯），还在右下刻意留出 1 栏透气留白，秩序与呼吸感兼得。",
      },
      {
        id: "C",
        label: "方案 C",
        svg: `<svg viewBox="0 0 220 150"><g stroke="rgba(244,255,247,0.45)" stroke-width="1">${[44, 77, 110, 143, 176].map((x) => `<line x1="${x}" y1="8" x2="${x}" y2="142"/>`).join("")}</g><rect x="12" y="12" width="136" height="22" fill="#1C144A" stroke="#F4FFF7" stroke-width="1.4"/><rect x="26" y="42" width="146" height="38" fill="#F7CD18" stroke="#F4FFF7" stroke-width="1.4"/><rect x="12" y="88" width="196" height="24" fill="#F4FAF6" stroke="#1C144A" stroke-width="1.3"/><rect x="22" y="118" width="84" height="20" fill="#1C144A" stroke="#F4FFF7" stroke-width="1.3"/><rect x="118" y="118" width="82" height="20" fill="#1C144A" stroke="#F4FFF7" stroke-width="1.3"/></svg>`,
        explain: "方案 C 看起来有大小变化，但细看白线栏轨就会穿帮：主图与底部快讯全都没对齐 6 栏纵线（脱轨漂移），且正文被迫拉成通栏 6 栏长条，既破坏栅格秩序又丧失多栏优势。",
      },
      {
        id: "D",
        label: "方案 D",
        svg: `<svg viewBox="0 0 220 150"><rect x="10" y="10" width="200" height="22" fill="#1C144A"/><rect x="10" y="34" width="132" height="52" fill="#F7CD18"/><rect x="144" y="34" width="66" height="52" fill="#F4FAF6"/><rect x="10" y="88" width="66" height="52" fill="#F4FAF6"/><rect x="78" y="88" width="64" height="52" fill="#1C144A"/><rect x="144" y="88" width="66" height="52" fill="#F4FAF6"/></svg>`,
        explain: "方案 D 的跨栏层级本来不错，但把栏距挤到几乎贴死、四边塞满 98% 且零留白。没有清晰栏距与透气区缓冲，相邻正文极易横向串读，整页闷得喘不过气。",
      },
    ],
  },
  {
    prompt: "第 2 题：一本设计双月刊在同一套页幅里，有时需要「等宽双栏深度访谈」，有时需要「等宽三栏展览短评」，还不希望每翻一页就重换底格。以下四种底座栏数，哪一个只凭一套网格就能无损兼顾？",
    correct: "C",
    options: [
      {
        id: "A",
        label: "方案 A · 4 栏",
        svg: `<svg viewBox="0 0 220 150">${[0, 1, 2, 3].map((i) => `<rect x="${12 + i * 50}" y="14" width="44" height="122" fill="rgba(244,255,247,0.18)" stroke="#F4FFF7" stroke-width="1.3"/>`).join("")}<rect x="12" y="24" width="94" height="36" fill="#F7CD18"/><rect x="112" y="24" width="94" height="36" fill="#1C144A"/><rect x="12" y="76" width="44" height="48" fill="#F4FAF6"/><rect x="62" y="76" width="94" height="48" fill="#F4FAF6"/><rect x="162" y="76" width="44" height="48" fill="#F4FAF6"/></svg>`,
        explain: "4 栏可以工整地排 2+2 双栏，但 4 不能被 3 整除——遇到三栏短评只能凑成 1+2+1 或拆破栏线，无法等宽三列。",
      },
      {
        id: "B",
        label: "方案 B · 5 栏",
        svg: `<svg viewBox="0 0 220 150">${[0, 1, 2, 3, 4].map((i) => `<rect x="${12 + i * 40}" y="14" width="34" height="122" fill="rgba(244,255,247,0.18)" stroke="#F4FFF7" stroke-width="1.3"/>`).join("")}<rect x="12" y="24" width="114" height="36" fill="#F7CD18"/><rect x="132" y="24" width="74" height="36" fill="#1C144A"/><rect x="12" y="76" width="74" height="48" fill="#F4FAF6"/><rect x="92" y="76" width="74" height="48" fill="#F4FAF6"/><rect x="172" y="76" width="34" height="48" fill="#F4FAF6"/></svg>`,
        explain: "5 是质数，既不能被 2 整除也不能被 3 整除。双栏只能偏成 3+2，三栏只能凑成 2+2+1，两头都落不到等宽对齐。",
      },
      {
        id: "C",
        label: "方案 C · 6 栏",
        svg: `<svg viewBox="0 0 220 150">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${12 + i * 33.5}" y="14" width="28" height="122" fill="rgba(244,255,247,0.18)" stroke="#F4FFF7" stroke-width="1.3"/>`).join("")}<rect x="12" y="24" width="95" height="36" fill="#F7CD18"/><rect x="112.5" y="24" width="95" height="36" fill="#1C144A"/><rect x="12" y="76" width="61.5" height="48" fill="#F4FAF6"/><rect x="79" y="76" width="61.5" height="48" fill="#F4FAF6"/><rect x="146" y="76" width="61.5" height="48" fill="#F4FAF6"/></svg>`,
        explain: "答对了！6 是 2 和 3 的最小公倍数：需要等宽双栏时按 3+3 拼，需要等宽三栏时按 2+2+2 拼，所有页面共用同一套垂直栏轨，既统一又灵活。",
      },
      {
        id: "D",
        label: "方案 D · 8 栏",
        svg: `<svg viewBox="0 0 220 150">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${10 + i * 25.2}" y="14" width="20.5" height="122" fill="rgba(244,255,247,0.18)" stroke="#F4FFF7" stroke-width="1.2"/>`).join("")}<rect x="10" y="24" width="96" height="36" fill="#F7CD18"/><rect x="111" y="24" width="96" height="36" fill="#1C144A"/><rect x="10" y="76" width="71" height="48" fill="#F4FAF6"/><rect x="85.5" y="76" width="71" height="48" fill="#F4FAF6"/><rect x="161" y="76" width="46" height="48" fill="#F4FAF6"/></svg>`,
        explain: "8 栏能排 4+4 双栏和 2+2+2+2 四栏，但同样不能被 3 整除，排三栏短评时只能凑出 3+3+2，最后一栏被迫变窄。",
      },
    ],
  },
];

let curQuizIdx = 0;
const elQuizPrompt = document.getElementById("quiz-prompt");
const elQuizGrid = document.getElementById("quiz-grid");
const elQuizFb = document.getElementById("quiz-feedback");
const elQfTitle = document.getElementById("qf-title");
const elQfBody = document.getElementById("qf-body");

function renderQuiz(idx) {
  curQuizIdx = idx;
  const q = QUIZZES[idx];
  elQuizPrompt.textContent = q.prompt;
  elQuizFb.className = "quiz-feedback";
  elQfTitle.textContent = "先观察四张缩略版面的白线栏轨、跨栏大小与留白，再点选一版。";
  elQfBody.textContent = "四个方案使用完全相同的内容与底色，只在多栏结构的关键变量上存在差异。";

  elQuizGrid.innerHTML = "";
  for (const opt of q.options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.dataset.opt = opt.id;
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `${opt.svg}<span class="quiz-card-label"><span>${opt.label}</span><span class="quiz-mark" lang="en"></span></span>`;
    btn.addEventListener("click", () => pickQuizOption(opt));
    elQuizGrid.append(btn);
  }
}

function pickQuizOption(opt) {
  const q = QUIZZES[curQuizIdx];
  const isRight = opt.id === q.correct;
  elQuizGrid.querySelectorAll(".quiz-card").forEach((card) => {
    const cid = card.dataset.opt;
    const picked = cid === opt.id;
    card.setAttribute("aria-pressed", String(picked));
    card.classList.remove("is-picked-right", "is-picked-wrong");
    const mark = card.querySelector(".quiz-mark");
    mark.textContent = "";
    if (picked) {
      card.classList.add(isRight ? "is-picked-right" : "is-picked-wrong");
      mark.textContent = isRight ? "✓" : "×";
    } else if (!isRight && cid === q.correct) {
      card.classList.add("is-picked-right");
      mark.textContent = "✓";
    }
  });

  elQuizFb.className = "quiz-feedback " + (isRight ? "is-right" : "is-wrong");
  elQfTitle.textContent = isRight ? `${opt.label} 正确` : `${opt.label} 差了一步（正确为方案 ${q.correct}）`;
  elQfBody.textContent = opt.explain;
}

document.querySelectorAll(".quiz-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".quiz-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderQuiz(Number(tab.dataset.q));
  });
});
renderQuiz(0);

// =========================================================================
// 8. Section 07：原海报灯箱（复用 #poster.src，不重复内联；支持缩放、拖拽、Esc）
// =========================================================================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbZoomLabel = document.getElementById("lb-zoom");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomLabel.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1.25;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterTrigger.setAttribute("aria-expanded", "true");
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.setAttribute("aria-expanded", "false");
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = Math.min(2.8, +(lbScale + 0.25).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.75, +(lbScale - 0.25).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.75, Math.min(2.8, +(lbScale + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport) {
    closeLightbox();
    return;
  }
  lbDrag = { sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  lbViewport.classList.add("is-dragging");
  lbViewport.setPointerCapture(e.pointerId);
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});

lbViewport.addEventListener("pointerup", () => {
  lbDrag = null;
  lbViewport.classList.remove("is-dragging");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});

// 窗口尺寸变化时重绘两块画布
window.addEventListener("resize", () => {
  needsRedraw = true;
  heroLoop.draw();
  if (labDrawnOnce) drawLab();
});

// 首次立即绘制，保证首帧与静态降级完整
heroLoop.draw();
drawLab();
