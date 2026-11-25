import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SCENES, INITIAL_STATE, PRESETS, clamp, computeLayout, evaluateState } from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// =========================================================================
// 1. 开场：全幅克莱因蓝 12 列活体轨道晒图台
// =========================================================================
const state = { ...INITIAL_STATE };
const anim = {
  intro: reducedMotion.matches ? 1 : 0,
  displayPct: 13,
  displayGap: state.parentGap,
  displayAsym: state.asymmetry,
  dirty: true,
  uiDirty: true,
  lastUiSync: 0,
  lastCssKey: "",
  lastLayout: null,
  lastEval: null,
  hotspots: [],
};

const heroCanvas = $("#hero-canvas");
const ctx = heroCanvas.getContext("2d", { alpha: false });
heroCanvas.setAttribute("tabindex", "0");

let canvasW = 760;
let canvasH = 440;
let isDragging = false;
const pillWidthCache = new Map();

function resizeHeroCanvas() {
  const wrap = heroCanvas.parentElement;
  if (!wrap) return;
  const r = wrap.getBoundingClientRect();
  const w = Math.max(280, Math.round(r.width));
  const h = Math.max(240, Math.round(r.height));
  // 手机窄屏像素比限 1.5（GUIDE.md 性能守则：软件渲染下省去 44% 像素填充量且依然清晰锐利）
  const dpr = pixelRatio(w <= 480 ? 1.5 : 2);
  if (heroCanvas.width !== Math.round(w * dpr) || heroCanvas.height !== Math.round(h * dpr)) {
    canvasW = w;
    canvasH = h;
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    anim.dirty = true;
    anim.uiDirty = true;
  }
}

resizeHeroCanvas();

function syncHeroUI(layout, ev) {
  // 顶部状态胶囊 & 12 列动态柱标
  const topPill = $("#hero-status-top");
  if (topPill.textContent !== ev.statusTag) topPill.textContent = ev.statusTag;
  const pillCls = `status-pill ${ev.severity === "ok" ? "is-ok" : "is-err"}`;
  if (topPill.className !== pillCls) topPill.className = pillCls;

  const metaTxt = `12 列 / 栏距 ${state.parentGap}px${Math.abs(state.asymmetry) >= 0.04 ? " · 非对称" : ""}`;
  const metaEl = $("#mast-grid-meta");
  if (metaEl.textContent !== metaTxt) metaEl.textContent = metaTxt;

  const barsWrap = $("#mast-parent-bars");
  barsWrap.classList.toggle("is-aligned", ev.severity === "ok");
  barsWrap.style.gap = `${Math.round(clamp(state.parentGap / 4.2, 2, 8))}px`;
  const barEls = $$("i", barsWrap);
  layout.parentCols.forEach((col, i) => {
    if (barEls[i]) barEls[i].style.opacity = (0.55 + col.weight * 0.35).toFixed(2);
  });

  // 舞台顶部实时标
  const stageBadge = `${layout.metrics.alignedAnchors}/${layout.metrics.totalAnchors} 锚点对齐 (${ev.alignedPct}%) · ${ev.severity === "ok" ? "全轴锁齐" : "横拖画布测脱轨"}`;
  const stageBadgeEl = $("#stage-live-badge");
  if (stageBadgeEl.textContent !== stageBadge) stageBadgeEl.textContent = stageBadge;

  // 场景切换按钮
  $$(".scene-btn").forEach((btn) => {
    const active = btn.dataset.scene === state.scene;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  // 四枚主开关
  const setToggle = (btnId, valId, on, labelOn, labelOff) => {
    const btn = $(btnId);
    btn.setAttribute("aria-pressed", String(on));
    $(valId).textContent = on ? labelOn : labelOff;
  };
  setToggle("#btn-col-sub", "#val-col-sub", state.colSubgrid, "columns: subgrid", "独立 1fr");
  setToggle("#btn-row-sub", "#val-row-sub", state.rowSubgrid, "rows: subgrid", "各自堆叠");
  setToggle("#btn-list-sub", "#val-list-sub", state.listSubgrid, "行列双继承", "百分比写死");
  $("#val-card-lines").textContent = `${state.card2Lines} 行${state.card2Lines === 3 ? "长文" : state.card2Lines === 2 ? "中段" : "短句"}`;

  // 行跨度 & 局部栏距分段钮
  $$("[data-span]").forEach((btn) => {
    const active = Number(btn.dataset.span) === state.rowSpan;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  $$("[data-gap-mode]").forEach((btn) => {
    const active = btn.dataset.gapMode === state.childGapMode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  // 滑杆
  const slider = $("#slider-gap");
  if (Number(slider.value) !== state.parentGap) slider.value = String(state.parentGap);
  $("#val-parent-gap").textContent = `${state.parentGap}px`;

  // 诊单卡
  const diagCard = $("#diag-card");
  diagCard.className = `diag-card ${ev.severity === "ok" ? "is-ok" : "is-err"}`;
  $("#diag-tag").textContent = ev.statusTag;
  $("#diag-headline").textContent = ev.headline;
  $("#diag-body").textContent = ev.body;
  $("#diag-hint").textContent = ev.nextAction;

  const fixBtn = $("#diag-fix-btn");
  if (ev.actionKey) {
    fixBtn.hidden = false;
    fixBtn.dataset.action = ev.actionKey;
  } else {
    fixBtn.hidden = true;
    fixBtn.dataset.action = "";
  }

  // 四格单真源实测读数
  $("#m-col-drift").textContent = `${Math.max(layout.metrics.colDriftCss, layout.metrics.rightDriftCss)}px`;
  $("#m-row-stagger").textContent = layout.metrics.rowOverflow ? `挤爆 ${layout.metrics.overlapPx}px` : `${layout.metrics.rowStaggerCss}px`;
  $("#m-list-drift").textContent = `${layout.metrics.listDriftCss}px`;
  $("#m-aligned-pct").textContent = `${ev.alignedPct}%`;

  // 四枚原海报要点状态徽
  const setKp = (id, item) => {
    const el = $(id);
    el.textContent = item.badge;
    el.className = `kp-badge ${item.ok ? "is-ok" : "is-err"}`;
  };
  setKp("#kp-inheritance", ev.checks.inheritance);
  setKp("#kp-alignment", ev.checks.alignment);
  setKp("#kp-consistency", ev.checks.consistency);
  setKp("#kp-flexibility", ev.checks.flexibility);

  $$(".kp-item").forEach((btn) => {
    btn.classList.toggle("is-focused", btn.dataset.focus === state.focusArea);
  });

  // 活体 CSS 声明匣（仅在内容改变时重写 DOM）
  const cssKey = ev.cssLines.map((l) => `${l.state}:${l.text}`).join("\n");
  if (cssKey !== anim.lastCssKey) {
    anim.lastCssKey = cssKey;
    $("#live-css-code").innerHTML = ev.cssLines
      .map((line) => `<span class="css-line is-${line.state}">${escapeHtml(line.text)}</span>`)
      .join("");
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
}

function drawBadgePill(c, cx, cy, text, bg, fg, hotspots, action) {
  c.font = '700 11px "JetBrains Mono", "Noto Sans SC", sans-serif';
  let tw = pillWidthCache.get(text);
  if (tw === undefined) {
    tw = c.measureText(text).width;
    if (pillWidthCache.size > 120) pillWidthCache.clear();
    pillWidthCache.set(text, tw);
  }
  const pw = tw + 14;
  const ph = 21;
  const x = clamp(cx - pw / 2, 8, canvasW - pw - 8);
  const y = clamp(cy - ph / 2, 8, canvasH - ph - 8);

  c.fillStyle = bg;
  c.fillRect(x, y, pw, ph);
  c.strokeStyle = "#FFFFFF";
  c.lineWidth = 1.1;
  c.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);

  c.fillStyle = fg;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, x + pw / 2, y + ph / 2 + 0.5);

  if (action) hotspots.push({ x, y, w: pw, h: ph, action });
}

function renderHeroCanvas(t, dt, { still }) {
  // 判定是否需要重画（静止已收敛时零绘制，省电且保持 60fps！）
  const gapDiff = Math.abs(anim.displayGap - state.parentGap);
  const asymDiff = Math.abs(anim.displayAsym - state.asymmetry);
  const pctTarget = anim.lastEval ? anim.lastEval.alignedPct : anim.displayPct;
  const pctDiff = Math.abs(anim.displayPct - pctTarget);
  const animating = !still && (anim.intro < 1 || gapDiff > 0.08 || asymDiff > 0.002 || pctDiff > 0.25);

  if (!anim.dirty && !animating && !still) return;

  // 开场渐显（0.65s 内完成，保证 0.9s 截图满血清晰）
  if (still) {
    anim.intro = 1;
    anim.displayGap = state.parentGap;
    anim.displayAsym = state.asymmetry;
  } else {
    if (anim.intro < 1) anim.intro = Math.min(1, anim.intro + (dt || 0.016) * 1.6);
    if (isDragging) {
      // 拖动中直接跟手零滞后，每帧仅画一次
      anim.displayGap = state.parentGap;
      anim.displayAsym = state.asymmetry;
    } else {
      const k = Math.min(1, (dt || 0.016) * 14);
      anim.displayGap = gapDiff < 0.08 ? state.parentGap : anim.displayGap + (state.parentGap - anim.displayGap) * k;
      anim.displayAsym = asymDiff < 0.002 ? state.asymmetry : anim.displayAsym + (state.asymmetry - anim.displayAsym) * k;
    }
  }

  const renderState = {
    ...state,
    parentGap: anim.displayGap,
    asymmetry: anim.displayAsym,
  };

  const exactLayout = isDragging ? computeLayout(renderState, canvasW, canvasH) : computeLayout(state, canvasW, canvasH);
  const ev = evaluateState(state, exactLayout);
  const layout = isDragging ? exactLayout : computeLayout(renderState, canvasW, canvasH);

  if (still) {
    anim.displayPct = ev.alignedPct;
  } else {
    const dPct = ev.alignedPct - anim.displayPct;
    anim.displayPct = Math.abs(dPct) < 0.25 ? ev.alignedPct : anim.displayPct + dPct * Math.min(1, (dt || 0.016) * 10);
  }

  // 拖动期间节流 DOM 更新（每 110ms 同步一次），彻底杜绝 6× CPU 降速下的样式回流卡顿
  const nowMs = performance.now();
  if (anim.uiDirty && (!isDragging || nowMs - anim.lastUiSync > 110)) {
    syncHeroUI(exactLayout, ev);
    anim.uiDirty = false;
    anim.lastUiSync = nowMs;
  }
  anim.dirty = false;
  anim.lastLayout = exactLayout;
  anim.lastEval = ev;

  const scene = SCENES[state.scene] || SCENES.poster;
  const c = ctx;
  const hotspots = [];
  const intro = anim.intro;

  // 背景底：纯正 206 克莱因蓝蓝图板
  c.fillStyle = "#002AD0";
  c.fillRect(0, 0, canvasW, canvasH);

  // 1. 12 列贯穿父网格浅蓝轨带 + 顶部数字标尺（批处理路径，大幅降低 draw calls！）
  const { outer, parentCols, heroRect, leftMod, rightMod, leftCards, ringZone, statZone, listMod, listRows } = layout;

  const colHighlight = state.focusArea === "cols" || state.focusArea === "list" || state.focusArea === "gap";
  const fullH = (outer.h + 18) * clamp(intro * 1.35, 0.35, 1);

  // 批量填充 12 条轨带
  c.fillStyle = colHighlight ? "rgba(173, 186, 245, 0.14)" : "rgba(173, 186, 245, 0.075)";
  c.beginPath();
  for (let i = 0; i < 12; i++) {
    c.rect(parentCols[i].x0, outer.y - 6, parentCols[i].w, fullH);
  }
  c.fill();

  // 批量绘制 24 条贯穿垂直父网格虚线（一次 stroke 替代 12 次！）
  c.strokeStyle = colHighlight ? "rgba(251, 210, 30, 0.58)" : "rgba(173, 186, 245, 0.36)";
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  for (let i = 0; i < 12; i++) {
    const x0 = Math.round(parentCols[i].x0) + 0.5;
    const x1 = Math.round(parentCols[i].x1) + 0.5;
    c.moveTo(x0, outer.y - 10);
    c.lineTo(x0, outer.y - 10 + fullH);
    c.moveTo(x1, outer.y - 10);
    c.lineTo(x1, outer.y - 10 + fullH);
  }
  c.stroke();
  c.setLineDash([]);

  // 顶部列号 1..12
  c.fillStyle = colHighlight ? "#FBD21E" : "#DCE6FF";
  c.font = `${layout.compact ? 600 : 700} ${layout.compact ? 10 : 11}px "JetBrains Mono", monospace`;
  c.textAlign = "center";
  c.textBaseline = "bottom";
  for (let i = 0; i < 12; i++) {
    c.fillText(String(i + 1), parentCols[i].x0 + parentCols[i].w / 2, outer.y - 7);
  }

  // 2. 外层白色细框（原海报「主内容区」）
  c.strokeStyle = "rgba(255, 255, 255, 0.84)";
  c.lineWidth = 1.5;
  c.strokeRect(Math.round(outer.x) + 0.5, Math.round(outer.y) + 0.5, Math.round(outer.w), Math.round(outer.h));

  // 3. 顶通栏亮黄块：主标题占满 12 列
  const heroW = heroRect.w * clamp(intro * 1.5, 0.25, 1);
  c.fillStyle = "#FBD21E";
  c.fillRect(heroRect.x, heroRect.y, heroW, heroRect.h);

  // 左侧蓝底小山图标（1:1 呼应 206 原海报）
  const iconPad = Math.max(6, Math.round(heroRect.h * 0.16));
  const iconH = heroRect.h - iconPad * 2;
  const iconW = Math.min(iconH * 1.12, heroRect.w * 0.16);
  const ix = heroRect.x + iconPad * 1.2;
  const iy = heroRect.y + iconPad;
  c.fillStyle = "#002ED3";
  c.fillRect(ix, iy, iconW, iconH);
  c.fillStyle = "#FFFFFF";
  c.beginPath();
  c.arc(ix + iconW * 0.3, iy + iconH * 0.32, Math.max(2.5, iconH * 0.1), 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(ix + iconW * 0.14, iy + iconH * 0.82);
  c.lineTo(ix + iconW * 0.44, iy + iconH * 0.46);
  c.lineTo(ix + iconW * 0.64, iy + iconH * 0.68);
  c.lineTo(ix + iconW * 0.78, iy + iconH * 0.52);
  c.lineTo(ix + iconW * 0.9, iy + iconH * 0.82);
  c.closePath();
  c.fill();

  const tx = ix + iconW + (layout.compact ? 10 : 18);
  c.fillStyle = "#051B78";
  c.font = `900 ${layout.compact ? 14 : 20}px "Noto Sans SC", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "top";
  c.fillText(scene.heroTitle, tx, heroRect.y + iconPad);

  c.fillStyle = "#16308D";
  c.font = `700 ${layout.compact ? 10 : 11}px "Bricolage Grotesque", sans-serif`;
  c.fillText(scene.heroSub, tx, heroRect.y + iconPad + (layout.compact ? 18 : 25));

  if (heroRect.h > 58) {
    const barY = heroRect.y + heroRect.h - 16;
    c.fillStyle = "rgba(5, 27, 120, 0.22)";
    c.fillRect(tx, barY, Math.min(220, heroRect.w - (tx - heroRect.x) - 18), 4);
    c.fillRect(tx, barY + 7, Math.min(140, heroRect.w - (tx - heroRect.x) - 18), 4);
  }

  // 4. 中排左侧模块（继承列与行轨道 · 3 张特性卡）
  const leftFocused = state.focusArea === "cols" || state.focusArea === "rows" || state.focusArea === "gap";
  c.fillStyle = "rgba(0, 22, 128, 0.34)";
  c.fillRect(leftMod.x, leftMod.y, leftMod.w, leftMod.h);
  c.strokeStyle = leftFocused ? "#FBD21E" : "rgba(255, 255, 255, 0.72)";
  c.lineWidth = leftFocused ? 2 : 1.2;
  c.strokeRect(Math.round(leftMod.x) + 0.5, Math.round(leftMod.y) + 0.5, Math.round(leftMod.w), Math.round(leftMod.h));

  c.fillStyle = "#FFFFFF";
  c.font = `700 ${layout.compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "top";
  const leftTag = layout.compact
    ? scene.leftHeading
    : `${scene.leftHeading} (${state.colSubgrid ? "列继承" : "独立列"} · ${state.rowSubgrid ? `行 span ${state.rowSpan}` : "独立行"})`;
  c.fillText(leftTag, leftMod.x + 8, leftMod.y + 7, Math.max(48, leftMod.w * 0.56));

  if (state.rowSubgrid && !layout.metrics.rowOverflow && leftCards.length === 3) {
    c.strokeStyle = "rgba(110, 242, 199, 0.85)";
    c.lineWidth = 1.2;
    c.setLineDash([4, 3]);
    const yBody = Math.round(leftCards[0].bodyY) + 0.5;
    const yFoot = Math.round(leftCards[0].footY) + 0.5;
    c.beginPath();
    c.moveTo(leftMod.x + 2, yBody);
    c.lineTo(leftMod.x + leftMod.w - 2, yBody);
    c.moveTo(leftMod.x + 2, yFoot);
    c.lineTo(leftMod.x + leftMod.w - 2, yFoot);
    c.stroke();
    c.setLineDash([]);
  }

  leftCards.forEach((card, k) => {
    const info = scene.cards[k];
    const isErrCol = !state.colSubgrid || state.childGapMode === "zero" || state.childGapMode === "oversized";
    const isErrRow = card.overflowed || (!state.rowSubgrid && k === 1 && state.card2Lines > 1);

    c.fillStyle = card.overflowed
      ? "rgba(185, 28, 28, 0.34)"
      : k === 1
        ? "rgba(255, 255, 255, 0.11)"
        : "rgba(255, 255, 255, 0.06)";
    c.fillRect(card.x, card.y, card.w, card.h);

    c.strokeStyle = card.overflowed
      ? "#FF9C94"
      : isErrCol
        ? "rgba(255, 156, 148, 0.88)"
        : "rgba(110, 242, 199, 0.85)";
    c.lineWidth = card.overflowed ? 1.8 : 1.1;
    c.strokeRect(Math.round(card.x) + 0.5, Math.round(card.y) + 0.5, Math.round(card.w), Math.round(card.h));

    if (!state.colSubgrid && card.driftL > 2) {
      c.strokeStyle = "#FF9C94";
      c.lineWidth = 1.5;
      const my = card.y + 10;
      c.beginPath();
      c.moveTo(card.targetX0, my);
      c.lineTo(card.x, my);
      c.stroke();
      c.fillStyle = "#FF9C94";
      c.fillRect(card.targetX0 - 1, my - 4, 2, 8);
    }

    const padIn = layout.compact ? 5 : 8;
    const sSize = layout.compact ? 11 : 14;
    const sx = card.x + padIn;
    const sy = card.headY + 5;
    c.fillStyle = "#FBD21E";
    if (info.shape === "circle") {
      c.beginPath();
      c.arc(sx + sSize / 2, sy + sSize / 2, sSize / 2, 0, Math.PI * 2);
      c.fill();
    } else if (info.shape === "triangle") {
      c.beginPath();
      c.moveTo(sx + sSize / 2, sy);
      c.lineTo(sx + sSize, sy + sSize);
      c.lineTo(sx, sy + sSize);
      c.closePath();
      c.fill();
    } else {
      c.fillRect(sx, sy, sSize, sSize);
    }

    c.fillStyle = "#FFFFFF";
    c.font = `700 ${layout.compact ? 10 : 12}px "Noto Sans SC", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "top";
    const titleX = sx + (card.w > 78 ? sSize + 5 : 0);
    const titleY = card.w > 78 ? sy : sy + sSize + 3;
    c.fillText(info.title, titleX, titleY, Math.max(24, card.w - padIn * 2 - (card.w > 78 ? sSize + 5 : 0)));

    const lineWMax = Math.max(16, card.w - padIn * 2);
    c.fillStyle = k === 1 ? "rgba(255, 230, 127, 0.88)" : "rgba(173, 186, 245, 0.8)";
    c.beginPath();
    for (let li = 0; li < card.lines; li++) {
      const ly = card.bodyY + 3 + li * (layout.compact ? 8.5 : 11);
      const frac = li === card.lines - 1 ? 0.68 : 0.94;
      c.rect(card.x + padIn, ly, lineWMax * frac, layout.compact ? 4 : 5);
    }
    c.fill();

    c.fillStyle = card.overflowed
      ? "rgba(220, 38, 38, 0.92)"
      : isErrRow
        ? "rgba(255, 156, 148, 0.88)"
        : "#FBD21E";
    c.fillRect(card.x + padIn, card.footY, lineWMax, Math.max(8, card.footH - 4));
    c.fillStyle = card.overflowed ? "#FFFFFF" : "#051B78";
    c.font = `700 9.5px "JetBrains Mono", monospace`;
    c.textAlign = "left";
    c.textBaseline = "middle";
    const footLabel = card.overflowed ? "OVERLAP!" : k === 1 ? `点击:${state.card2Lines}行` : `0${k + 1}`;
    c.fillText(footLabel, card.x + padIn + 4, card.footY + Math.max(4, (card.footH - 4) / 2), lineWMax - 6);

    if (k === 1) {
      hotspots.push({ x: card.x, y: card.y, w: card.w, h: card.h, action: "cycle-lines" });
    }
  });

  if (!state.rowSubgrid && layout.metrics.rowStaggerCss > 2) {
    c.strokeStyle = "#FF9C94";
    c.lineWidth = 1.6;
    c.setLineDash([4, 2]);
    c.beginPath();
    leftCards.forEach((card, i) => {
      const y = card.footY + card.footH - 2;
      if (i === 0) c.moveTo(card.x, y);
      else c.lineTo(card.x, y);
      c.lineTo(card.x + card.w, y);
    });
    c.stroke();
    c.setLineDash([]);
  }

  // 5. 中排右侧模块（原海报标志白黄双色大环 + 动态实测对齐率）
  c.fillStyle = "rgba(0, 22, 128, 0.34)";
  c.fillRect(rightMod.x, rightMod.y, rightMod.w, rightMod.h);
  c.strokeStyle = state.focusArea === "cols" ? "#FBD21E" : "rgba(255, 255, 255, 0.72)";
  c.lineWidth = state.focusArea === "cols" ? 2 : 1.2;
  c.strokeRect(Math.round(rightMod.x) + 0.5, Math.round(rightMod.y) + 0.5, Math.round(rightMod.w), Math.round(rightMod.h));

  c.fillStyle = "#FFFFFF";
  c.font = `700 ${layout.compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "top";
  const rightTag = layout.compact ? scene.rightHeading : `${scene.rightHeading} (${state.colSubgrid ? "对齐父列 7–12" : "独立缩进"})`;
  c.fillText(rightTag, rightMod.x + 8, rightMod.y + 7, Math.max(40, rightMod.w * 0.42));

  c.strokeStyle = state.colSubgrid ? "rgba(110, 242, 199, 0.75)" : "rgba(255, 156, 148, 0.75)";
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.rect(Math.round(ringZone.x) + 0.5, Math.round(ringZone.y) + 0.5, Math.round(ringZone.w), Math.round(ringZone.h));
  c.rect(Math.round(statZone.x) + 0.5, Math.round(statZone.y) + 0.5, Math.round(statZone.w), Math.round(statZone.h));
  c.stroke();
  c.setLineDash([]);

  const rcx = ringZone.x + ringZone.w / 2;
  const rcy = ringZone.y + ringZone.h / 2;
  const outerR = Math.max(18, Math.min(ringZone.w, ringZone.h) * 0.42);
  const ringW = Math.max(7, outerR * 0.34);
  const pctNorm = clamp((anim.displayPct / 100) * intro, 0.04, 1);

  c.beginPath();
  c.arc(rcx, rcy, outerR - ringW / 2, 0, Math.PI * 2);
  c.strokeStyle = "#FFFFFF";
  c.lineWidth = ringW;
  c.stroke();

  c.beginPath();
  c.arc(rcx, rcy, outerR - ringW / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pctNorm);
  c.strokeStyle = "#FBD21E";
  c.lineWidth = ringW;
  c.stroke();

  const statX = statZone.x + (layout.compact ? 4 : 8);
  const statMaxW = Math.max(40, statZone.w - (layout.compact ? 8 : 16));
  const statY = statZone.y + (layout.compact ? 6 : 14);
  c.fillStyle = ev.severity === "ok" ? "#6EF2C7" : "#FFFFFF";
  c.font = `800 ${layout.compact ? 20 : 34}px "Archivo", "JetBrains Mono", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "top";
  c.fillText(`${Math.round(anim.displayPct)}%`, statX, statY, statMaxW);

  c.fillStyle = "#FBD21E";
  c.font = `700 ${layout.compact ? 10 : 12}px "Noto Sans SC", sans-serif`;
  c.fillText("实测对齐父网格线", statX, statY + (layout.compact ? 24 : 40), statMaxW);

  c.fillStyle = "#DCE6FF";
  c.font = `600 ${layout.compact ? 9.5 : 10.5}px "JetBrains Mono", monospace`;
  c.fillText(`${layout.metrics.alignedAnchors}/${layout.metrics.totalAnchors} ANCHORS`, statX, statY + (layout.compact ? 39 : 58), statMaxW);

  if (statZone.h > 78) {
    const barW = Math.max(24, statZone.w - 16);
    c.fillStyle = "rgba(173, 186, 245, 0.36)";
    c.fillRect(statX, statZone.y + statZone.h - 18, barW, 5);
    c.fillStyle = ev.severity === "ok" ? "#6EF2C7" : "#FBD21E";
    c.fillRect(statX, statZone.y + statZone.h - 18, barW * pctNorm, 5);
  }

  // 6. 底部列表模块（01 / 02 / 03 · 检验行列双继承，合并虚线与竖线为单次路径！）
  const listFocused = state.focusArea === "list";
  c.fillStyle = "rgba(0, 22, 128, 0.34)";
  c.fillRect(listMod.x, listMod.y, listMod.w, listMod.h);
  c.strokeStyle = listFocused ? "#FBD21E" : "rgba(255, 255, 255, 0.72)";
  c.lineWidth = listFocused ? 2 : 1.2;
  c.strokeRect(Math.round(listMod.x) + 0.5, Math.round(listMod.y) + 0.5, Math.round(listMod.w), Math.round(listMod.h));

  c.fillStyle = "#FFFFFF";
  c.font = `700 ${layout.compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "top";
  const listTag = layout.compact
    ? scene.listHeading
    : `${scene.listHeading} (${state.listSubgrid ? "行列双继承 ROWS & COLUMNS" : "写死百分比 · 未对齐父列"})`;
  c.fillText(listTag, listMod.x + 8, listMod.y + 6, Math.max(60, listMod.w * 0.62));

  // 批量画列表水平虚线
  c.strokeStyle = state.listSubgrid ? "rgba(110, 242, 199, 0.48)" : "rgba(255, 156, 148, 0.45)";
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  for (let idx = 1; idx < listRows.length; idx++) {
    const ry = Math.round(listRows[idx].y) + 0.5;
    c.moveTo(listMod.x + 4, ry);
    c.lineTo(listMod.x + listMod.w - 4, ry);
  }
  c.stroke();
  c.setLineDash([]);

  // 批量画列表竖向对齐线
  c.strokeStyle = state.listSubgrid ? "rgba(110, 242, 199, 0.55)" : "rgba(255, 156, 148, 0.72)";
  c.beginPath();
  listRows.forEach((row) => {
    for (let ci = 1; ci <= 3; ci++) {
      const lx = Math.round(row.cells[ci].x) + 0.5;
      c.moveTo(lx, row.y + 3);
      c.lineTo(lx, row.y + row.h - 3);
    }
  });
  c.stroke();

  // 批量画编号黄框
  c.strokeStyle = "#FBD21E";
  c.lineWidth = 1.4;
  c.beginPath();
  listRows.forEach((row) => {
    const cNo = row.cells[0];
    const midY = row.y + row.h / 2;
    const boxW = Math.min(cNo.w, layout.compact ? 22 : 28);
    const boxH = Math.min(row.h - 6, layout.compact ? 17 : 21);
    c.rect(Math.round(cNo.x) + 0.5, Math.round(midY - boxH / 2) + 0.5, Math.round(boxW), Math.round(boxH));
  });
  c.stroke();

  listRows.forEach((row, idx) => {
    const item = scene.list[idx];
    const [cNo, cTitle, cBody, cDate] = row.cells;
    const midY = row.y + row.h / 2;
    const boxW = Math.min(cNo.w, layout.compact ? 22 : 28);

    c.fillStyle = "#FBD21E";
    c.font = `700 ${layout.compact ? 10 : 11}px "JetBrains Mono", monospace`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(item.no, cNo.x + boxW / 2, midY + 0.5);

    c.fillStyle = "#FFFFFF";
    c.font = `700 ${layout.compact ? 10.5 : 12}px "Noto Sans SC", sans-serif`;
    c.textAlign = "left";
    c.fillText(item.title, cTitle.x + 5, midY, Math.max(24, cTitle.w - 8));

    c.fillStyle = "#DCE6FF";
    c.font = `400 ${layout.compact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
    c.fillText(item.body, cBody.x + 5, midY, Math.max(32, cBody.w - 8));

    c.fillStyle = "#FFE67F";
    c.font = `600 ${layout.compact ? 9.5 : 11}px "JetBrains Mono", monospace`;
    c.fillText(item.date, cDate.x + 5, midY, Math.max(24, cDate.w - 6));
  });

  // 7. 可点击画布红标（落在标题带右端，绝不遮挡卡片图形与列表正文）
  if (ev.severity === "err") {
    if (layout.metrics.rowOverflow) {
      drawBadgePill(
        c,
        leftMod.x + leftMod.w - (layout.compact ? 58 : 88),
        leftMod.y + 13,
        `× span ${state.rowSpan} 挤爆·改3`,
        "#B91C1C",
        "#FFFFFF",
        hotspots,
        "fix-span"
      );
    } else if (!state.colSubgrid) {
      drawBadgePill(
        c,
        leftMod.x + leftMod.w - (layout.compact ? 54 : 84),
        leftMod.y + 13,
        layout.compact ? `× 列偏${Math.max(layout.metrics.colDriftCss, layout.metrics.rightDriftCss)}px·修` : `× 列偏 ${Math.max(layout.metrics.colDriftCss, layout.metrics.rightDriftCss)}px · 点开列继承`,
        "#B91C1C",
        "#FFFFFF",
        hotspots,
        "fix-col"
      );
    } else if (!state.rowSubgrid && layout.metrics.rowStaggerCss > 2) {
      drawBadgePill(
        c,
        leftMod.x + leftMod.w - (layout.compact ? 54 : 84),
        leftMod.y + 13,
        layout.compact ? `× 行差${layout.metrics.rowStaggerCss}px·拉平` : `× 行落差 ${layout.metrics.rowStaggerCss}px · 点开行继承`,
        "#B91C1C",
        "#FFFFFF",
        hotspots,
        "fix-row"
      );
    }

    if (state.childGapMode === "oversized" || state.childGapMode === "zero") {
      drawBadgePill(
        c,
        rightMod.x + rightMod.w - (layout.compact ? 50 : 78),
        rightMod.y + 13,
        state.childGapMode === "zero"
          ? "× 0px粘连·复原"
          : layout.compact
            ? `× 倒挂${layout.childGapLogical}px`
            : `× 栏距倒挂 ${layout.childGapLogical}px`,
        "#B91C1C",
        "#FFFFFF",
        hotspots,
        "fix-gap"
      );
    }

    if (!state.listSubgrid) {
      drawBadgePill(
        c,
        listMod.x + listMod.w - (layout.compact ? 56 : 92),
        listMod.y + 12,
        layout.compact ? `× 列表偏${layout.metrics.listDriftCss}px·修` : `× 列表偏 ${layout.metrics.listDriftCss}px · 点开双继承`,
        "#B91C1C",
        "#FFFFFF",
        hotspots,
        "fix-list"
      );
    }
  } else {
    drawBadgePill(
      c,
      outer.x + outer.w - 82,
      outer.y + 12,
      "✓ 12 列全轴锁齐",
      "#046C4E",
      "#FFFFFF",
      hotspots,
      null
    );
  }

  anim.hotspots = hotspots;
}

const heroLoop = loop(heroCanvas, renderHeroCanvas);

function mutateState(patch) {
  Object.assign(state, patch);
  anim.dirty = true;
  anim.uiDirty = true;
  heroLoop.draw();
}

function runAction(action) {
  if (action === "fix-col") mutateState({ colSubgrid: true, focusArea: "cols" });
  else if (action === "fix-row") mutateState({ rowSubgrid: true, rowSpan: Math.max(3, state.rowSpan), focusArea: "rows" });
  else if (action === "fix-list") mutateState({ listSubgrid: true, focusArea: "list" });
  else if (action === "fix-span") mutateState({ rowSpan: 3, focusArea: "rows" });
  else if (action === "fix-gap") mutateState({ childGapMode: "inherit", focusArea: "gap" });
  else if (action === "cycle-lines") mutateState({ card2Lines: state.card2Lines === 3 ? 1 : state.card2Lines + 1, focusArea: "rows" });
}

// 画布拖动 + 点击热区（只标记脏位让 rAF 每帧合批绘一次，彻底消灭 touchmove/pointermove 双重重画与事件风暴！）
let dragInfo = null;

function beginDrag(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  isDragging = true;
  dragInfo = {
    startX: clientX,
    startY: clientY,
    startAsym: state.asymmetry,
    startGap: state.parentGap,
    moved: false,
    localX: clientX - rect.left,
    localY: clientY - rect.top,
  };
}

function moveDrag(clientX) {
  if (!dragInfo) return;
  const dx = clientX - dragInfo.startX;
  if (Math.abs(dx) > 4) dragInfo.moved = true;
  if (!dragInfo.moved) return;
  const nextAsym = clamp(dragInfo.startAsym + dx / Math.max(240, canvasW * 0.72), -0.32, 0.32);
  const nextGap = clamp(Math.round((dragInfo.startGap + dx * 0.045) / 2) * 2, 8, 32);
  state.asymmetry = Number(nextAsym.toFixed(3));
  state.parentGap = nextGap;
  anim.dirty = true;
  anim.uiDirty = true;
  // 减少动态效果下 rAF 不跑，此时才同步补画一帧；正常模式交给 rAF 每帧只画 1 次！
  if (reducedMotion.matches) heroLoop.draw();
}

function endDrag() {
  if (!dragInfo) return;
  const wasMoved = dragInfo.moved;
  const { localX, localY } = dragInfo;
  dragInfo = null;
  isDragging = false;
  if (!wasMoved) {
    for (let i = anim.hotspots.length - 1; i >= 0; i--) {
      const h = anim.hotspots[i];
      if (localX >= h.x && localX <= h.x + h.w && localY >= h.y && localY <= h.y + h.h) {
        runAction(h.action);
        return;
      }
    }
  } else {
    anim.dirty = true;
    anim.uiDirty = true;
    heroLoop.draw();
  }
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  beginDrag(e.clientX, e.clientY);
  try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
});
heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo) return;
  moveDrag(e.clientX);
});
heroCanvas.addEventListener("pointerup", () => endDrag());
heroCanvas.addEventListener("pointercancel", () => {
  dragInfo = null;
  isDragging = false;
});

heroCanvas.addEventListener("touchstart", (e) => {
  if (dragInfo || !e.touches.length) return;
  beginDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
heroCanvas.addEventListener("touchmove", (e) => {
  if (!dragInfo || !e.touches.length) return;
  moveDrag(e.touches[0].clientX);
}, { passive: true });
heroCanvas.addEventListener("touchend", () => endDrag(), { passive: true });

heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    mutateState({ parentGap: clamp(state.parentGap + 2, 8, 32) });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutateState({ parentGap: clamp(state.parentGap - 2, 8, 32) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    mutateState({ asymmetry: Number(clamp(state.asymmetry + 0.06, -0.32, 0.32).toFixed(3)) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    mutateState({ asymmetry: Number(clamp(state.asymmetry - 0.06, -0.32, 0.32).toFixed(3)) });
  }
});

// 绑定所有开场按钮控件
$$(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ scene: btn.dataset.scene }));
});
$("#btn-col-sub").addEventListener("click", () => mutateState({ colSubgrid: !state.colSubgrid, focusArea: "cols" }));
$("#btn-row-sub").addEventListener("click", () => mutateState({ rowSubgrid: !state.rowSubgrid, focusArea: "rows" }));
$("#btn-list-sub").addEventListener("click", () => mutateState({ listSubgrid: !state.listSubgrid, focusArea: "list" }));
$("#btn-card-lines").addEventListener("click", () => runAction("cycle-lines"));

$$("[data-span]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ rowSpan: Number(btn.dataset.span), focusArea: "rows" }));
});
$$("[data-gap-mode]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ childGapMode: btn.dataset.gapMode, focusArea: "gap" }));
});
$("#slider-gap").addEventListener("input", (e) => {
  mutateState({ parentGap: Number(e.target.value) });
});
$$(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) mutateState({ ...p, scene: state.scene });
  });
});
$("#diag-fix-btn").addEventListener("click", (e) => {
  const act = e.currentTarget.dataset.action;
  if (act) runAction(act);
});
$$(".kp-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.focus;
    mutateState({ focusArea: state.focusArea === f ? null : f });
  });
});

window.addEventListener("resize", () => {
  resizeHeroCanvas();
  heroLoop.draw();
  measureS1();
  measureS2();
});

// 立即绘第一帧，避免首屏等待
heroLoop.draw();

// =========================================================================
// 2. 第 01 节：真实原生 DOM 嵌套 vs 子网格偏轨测量
// =========================================================================
let s1Pad = 0;
let s1Gap = 14;

function updateS1() {
  for (const id of ["#s1-nested-stage", "#s1-sub-stage"]) {
    const el = $(id);
    el.style.setProperty("--s1-pad", `${s1Pad}px`);
    el.style.setProperty("--s1-gap", `${s1Gap}px`);
  }
  $$("[data-s1-pad]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.s1Pad) === s1Pad));
  $$("[data-s1-gap]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.s1Gap) === s1Gap));
  requestAnimationFrame(measureS1);
}

function measureS1() {
  const nRuler3 = $("#s1-nested-stage .s1-parent-ruler span:nth-child(3)");
  const nSlotB = $("#s1-nested-box .s1-slot:nth-child(2)");
  const sRuler3 = $("#s1-sub-stage .s1-parent-ruler span:nth-child(3)");
  const sSlotB = $("#s1-sub-box .s1-slot:nth-child(2)");
  if (!nRuler3 || !nSlotB || !sRuler3 || !sSlotB) return;

  const driftNested = Math.round(Math.abs(nSlotB.getBoundingClientRect().left - nRuler3.getBoundingClientRect().left));
  const driftSub = Math.round(Math.abs(sSlotB.getBoundingClientRect().left - sRuler3.getBoundingClientRect().left));

  $("#s1-readout").textContent = `实测中缝偏轨：独立嵌套 ${driftNested}px · 子网格 ${driftSub}px`;
  $("#s1-nested-note").textContent =
    s1Pad === 0 && driftNested > 1
      ? `哪怕内边距还是 0px，写死 2fr 1fr 1fr 只有 2 条槽缝、比 4 列父网格少了 1 条栏距，B 栏左缘实测已天然偏轨 ${driftNested}px。`
      : driftNested > 1
        ? `叠加 ${s1Pad}px 卡片内边距与少算的槽缝后，独立嵌套把内框挤窄，B 栏左缘实测偏离第 3 列父标尺 ${driftNested}px。`
        : "目前偏轨接近 0px，试着点上方「卡片内边距 20px」或「父栏距 26px」立刻露出破绽。";
  $("#s1-sub-note").textContent =
    driftSub <= 1
      ? `无论内边距设为 ${s1Pad}px 还是父栏距调到 ${s1Gap}px，子网格内部中缝与第 3 父列的实测偏差始终为 ${driftSub}px。`
      : `当前浏览器未支持原生 subgrid（实测偏差 ${driftSub}px），已平滑降级显示结构。`;
}

$$("[data-s1-pad]").forEach((b) => b.addEventListener("click", () => { s1Pad = Number(b.dataset.s1Pad); updateS1(); }));
$$("[data-s1-gap]").forEach((b) => b.addEventListener("click", () => { s1Gap = Number(b.dataset.s1Gap); updateS1(); }));
updateS1();

// =========================================================================
// 3. 第 02 节：活体三卡排字台（行子网格跨卡拉齐实测）
// =========================================================================
let s2Mode = "flex";
let s2Long = true;

function updateS2() {
  const deck = $("#s2-deck");
  deck.className = `s2-deck is-mode-${s2Mode}`;
  $("#s2-mid-title").textContent = s2Long
    ? "跨层级共享轨道的弹性卡片标题示例（多行折行测试）"
    : "中等长度卡片标题";

  $$("[data-s2-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.s2Mode === s2Mode));
  $("#s2-shorten").classList.toggle("is-active", !s2Long);
  $("#s2-lengthen").classList.toggle("is-active", s2Long);

  const exp = $("#s2-explain");
  if (s2Mode === "flex") {
    exp.innerHTML =
      "<strong>当前状态（传统独立卡片）：</strong>三张卡的外壳底边齐平，但各自单独算内部行高；中间卡片折行后，三张卡的标题底线和正文起点立刻变成高低不平的锯齿。";
  } else if (s2Mode === "subgrid") {
    exp.innerHTML =
      "<strong>当前状态（行子网格 span 3）：</strong>三张卡共同继承父级 3 条共享行轨。中卡的多行标题把第 1 轨整体撑高，左右两张卡的标题底线和正文起点纹丝不动地拉成一条直线。";
  } else {
    exp.innerHTML =
      "<strong>当前状态（踩坑 span 2）：</strong>卡片有「标题、正文、底栏」3 段内容，却只跨了 2 条父行轨。子网格不会自动建第 3 条隐式行轨，红色底栏被迫倒灌回第 2 轨与正文叠车！";
  }
  requestAnimationFrame(measureS2);
}

function measureS2() {
  const titles = $$(".s2-card-title");
  if (titles.length < 3) return;
  const bottoms = titles.map((el) => el.getBoundingClientRect().bottom);
  const diff = Math.round(Math.max(...bottoms) - Math.min(...bottoms));
  const stacked = window.innerWidth <= 680;
  if (stacked) {
    $("#s2-readout").textContent =
      s2Mode === "subgrid"
        ? "窄屏单列显示 · 宽屏下三卡基线落差 0px"
        : s2Mode === "under"
          ? "警告：span 2 轨道不足（宽屏下底栏叠车）"
          : "窄屏单列显示 · 宽屏下三卡呈阶梯错位";
  } else if (s2Mode === "under") {
    $("#s2-readout").textContent = "显式轨仅 2 条 · 第 3 项底栏被挤进第 2 轨叠车";
  } else {
    $("#s2-readout").textContent = `实测三卡标题底线最大落差：${diff}px${diff <= 1 ? "（完全齐平）" : "（阶梯错位）"}`;
  }
}

$$("[data-s2-mode]").forEach((b) => b.addEventListener("click", () => { s2Mode = b.dataset.s2Mode; updateS2(); }));
$("#s2-shorten").addEventListener("click", () => { s2Long = false; updateS2(); });
$("#s2-lengthen").addEventListener("click", () => { s2Long = true; updateS2(); });
updateS2();

// =========================================================================
// 4. 第 03 节：深克莱因蓝暗室 · 四种局部自由 SVG 蓝图
// =========================================================================
const S3_MODES = {
  axis: {
    desc: "只把 <code>grid-template-columns</code> 设为 <code>subgrid</code> 时，水平列宽严守父网格，但纵向依然可以用 <code>auto 1fr</code> 自由安排内部行高——这就是原海报中「左侧模块（继承列轨道）」的做法。",
    snippet: `.module-left {\n  grid-column: 1 / span 6;\n  display: grid;\n  grid-template-columns: subgrid;\n  grid-template-rows: auto 1fr; /* 行保持自由 */\n}`,
    svg: `
      <rect width="640" height="300" fill="#001D8E"/>
      ${[0,1,2,3,4,5].map((i) => `<rect x="${40 + i*96}" y="22" width="80" height="256" fill="rgba(173,186,245,0.1)" stroke="rgba(173,186,245,0.45)" stroke-dasharray="4 4"/>
      <text x="${80 + i*96}" y="16" fill="#DCE6FF" font-size="11" font-family="JetBrains Mono" text-anchor="middle">COL ${i+1}</text>`).join("")}
      <rect x="40" y="42" width="560" height="218" fill="none" stroke="#FBD21E" stroke-width="2"/>
      <rect x="40" y="54" width="176" height="62" fill="#FBD21E"/><text x="128" y="89" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">列 1–2 · 自由高 62px</text>
      <rect x="232" y="54" width="176" height="114" fill="#FBD21E"/><text x="320" y="114" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">列 3–4 · 自由高 114px</text>
      <rect x="424" y="54" width="176" height="86" fill="#FBD21E"/><text x="512" y="100" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">列 5–6 · 自由高 86px</text>
      <text x="320" y="246" fill="#6EF2C7" font-size="12" font-family="JetBrains Mono" text-anchor="middle">X 轴严格锁进 6 条父列轨 · Y 轴行高各自独立</text>
    `,
  },
  gap: {
    desc: "子网格默认继承父网格的 <code>gap</code>，但你可以随时在子容器上单独写 <code>column-gap: 0</code>（做无缝图墙）或把行距减半收紧，而不影响外层页面的大栏距。",
    snippet: `.gallery-sub {\n  grid-column: 1 / span 6;\n  display: grid;\n  grid-template-columns: subgrid;\n  column-gap: 6px; /* 父级 24px，局部收紧 */\n}`,
    svg: `
      <rect width="640" height="300" fill="#001D8E"/>
      ${[0,1,2,3,4,5].map((i) => `<line x1="${40 + i*96}" y1="22" x2="${40 + i*96}" y2="278" stroke="rgba(173,186,245,0.4)" stroke-dasharray="4 4"/>
      <line x1="${120 + i*96}" y1="22" x2="${120 + i*96}" y2="278" stroke="rgba(173,186,245,0.4)" stroke-dasharray="4 4"/>`).join("")}
      <text x="320" y="42" fill="#DCE6FF" font-size="12" font-family="JetBrains Mono" text-anchor="middle">父网格大栏距：24px</text>
      <rect x="40" y="56" width="176" height="58" fill="rgba(173,186,245,0.3)" stroke="#FFFFFF"/>
      <rect x="232" y="56" width="176" height="58" fill="rgba(173,186,245,0.3)" stroke="#FFFFFF"/>
      <rect x="424" y="56" width="176" height="58" fill="rgba(173,186,245,0.3)" stroke="#FFFFFF"/>
      <rect x="40" y="146" width="182" height="92" fill="#FBD21E"/><text x="131" y="196" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">外缘咬住父线 1</text>
      <rect x="229" y="146" width="182" height="92" fill="#FBD21E"/><text x="320" y="196" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">内部紧槽 6px</text>
      <rect x="418" y="146" width="182" height="92" fill="#FBD21E"/><text x="509" y="196" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">外缘咬住父线 6</text>
      <text x="320" y="270" fill="#6EF2C7" font-size="12" font-family="JetBrains Mono" text-anchor="middle">外框紧贴父边界 · 内部局部微调 column-gap</text>
    `,
  },
  names: {
    desc: "如果父网格给轨道起了名字（比如 <code>[main-start]</code>），子网格自动继承这些线名，同时还能在 <code>subgrid</code> 后面追加局部别名，让孙元素用语义名称精准落位。",
    snippet: `.parent {\n  grid-template-columns: [full-s] 1fr [body-s] 2fr 2fr [body-e] 1fr [full-e];\n}\n.child {\n  grid-column: full-s / full-e;\n  grid-template-columns: subgrid [edge] [card-a] [card-b];\n}`,
    svg: `
      <rect width="640" height="300" fill="#001D8E"/>
      ${[40, 140, 320, 500, 600].map((x, idx) => {
        const pNames = ["[full-s]", "[body-s]", "", "[body-e]", "[full-e]"];
        const cNames = ["[edge]", "[card-a]", "[card-b]", "", ""];
        return `<line x1="${x}" y1="36" x2="${x}" y2="266" stroke="#FBD21E" stroke-width="${idx===1||idx===3?2:1.2}" stroke-dasharray="${idx===2?'4 4':'none'}"/>
        ${pNames[idx] ? `<rect x="${x-32}" y="12" width="64" height="20" fill="#FFFFFF"/><text x="${x}" y="26" fill="#051B78" font-size="10.5" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">${pNames[idx]}</text>` : ""}
        ${cNames[idx] ? `<rect x="${x-32}" y="268" width="64" height="20" fill="#FBD21E"/><text x="${x}" y="282" fill="#051B78" font-size="10.5" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">${cNames[idx]}</text>` : ""}`;
      }).join("")}
      <rect x="140" y="76" width="360" height="68" fill="rgba(110,242,199,0.22)" stroke="#6EF2C7" stroke-width="2"/>
      <text x="320" y="114" fill="#FFFFFF" font-size="14" font-weight="700" text-anchor="middle">孙元素直接写 grid-column: body-s / body-e</text>
      <rect x="140" y="164" width="180" height="68" fill="#FBD21E"/><text x="230" y="202" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">card-a / card-b</text>
      <rect x="320" y="164" width="180" height="68" fill="rgba(173,186,245,0.28)" stroke="#FFFFFF"/><text x="410" y="202" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">card-b / body-e</text>
    `,
  },
  span: {
    desc: "同一套 6 列子网格内部，第一行可以排成 <code>2 + 2 + 2</code> 的均分三卡，第二行可以排成 <code>1 + 3 + 2</code> 的明细列表——上下变化丰富，但每一条竖向分界线都在同一套父网格上。",
    snippet: `.row-cards > * { grid-column: span 2; } /* 2 + 2 + 2 */\n.row-list .no  { grid-column: span 1; } /* 1 + 3 + 2 */\n.row-list .txt { grid-column: span 3; }\n.row-list .tag { grid-column: span 2; }`,
    svg: `
      <rect width="640" height="300" fill="#001D8E"/>
      ${[0,1,2,3,4,5].map((i) => `<rect x="${40 + i*96}" y="24" width="80" height="252" fill="rgba(173,186,245,0.09)" stroke="rgba(173,186,245,0.42)" stroke-dasharray="4 4"/>`).join("")}
      <rect x="40" y="50" width="176" height="72" fill="#FBD21E"/><text x="128" y="90" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">span 2</text>
      <rect x="232" y="50" width="176" height="72" fill="#FBD21E"/><text x="320" y="90" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">span 2</text>
      <rect x="424" y="50" width="176" height="72" fill="#FBD21E"/><text x="512" y="90" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">span 2</text>
      <rect x="40" y="152" width="80" height="72" fill="#6EF2C7"/><text x="80" y="192" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">span 1</text>
      <rect x="136" y="152" width="272" height="72" fill="rgba(255,255,255,0.92)"/><text x="272" y="192" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">span 3（正文跨三列）</text>
      <rect x="424" y="152" width="176" height="72" fill="#6EF2C7"/><text x="512" y="192" fill="#051B78" font-size="13" font-weight="700" text-anchor="middle">span 2（尾列完全对齐）</text>
      <text x="320" y="258" fill="#FFE67F" font-size="12" font-family="JetBrains Mono" text-anchor="middle">上下两行组合完全不同，但所有边界都精准落进同一套父列线</text>
    `,
  },
};

function renderS3(key) {
  const item = S3_MODES[key] || S3_MODES.axis;
  $$(".s3-tab").forEach((b) => {
    const active = b.dataset.s3 === key;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("#s3-svg").innerHTML = item.svg;
  $("#s3-desc").innerHTML = item.desc;
  $("#s3-snippet").textContent = item.snippet;
}

$$(".s3-tab").forEach((b) => b.addEventListener("click", () => renderS3(b.dataset.s3)));
renderS3("axis");

// =========================================================================
// 5. 第 04 节：编年轨道滑步器（严格依据核实史实）
// =========================================================================
const TIMELINE = [
  {
    badge: "印刷源头 · Arthur Niggli Verlag",
    heading: "Josef Müller-Brockmann 系统确立跨层模数骨架",
    text: "在 1961 年《平面设计师的设计问题》（Gestaltungsprobleme des Grafikers）的早期探讨之上，约瑟夫·米勒-布罗克曼于 1981 年由瑞士 Arthur Niggli Verlag 出版《平面设计中的网格系统》（Grid Systems in Graphic Design），系统论述如何用 8 至 32 格统一模数同时规范整版主图、多栏正文与细小图注——这正是子网格「跨层级同轨」的美学前身。",
    svg: `<svg viewBox="0 0 320 170" width="100%"><rect width="320" height="170" fill="#002ED3"/>${[0,1,2,3].map(i=>`<rect x="${18+i*74}" y="18" width="62" height="134" fill="rgba(255,255,255,0.12)" stroke="#ADBAF5" stroke-dasharray="3 3"/>`).join("")}<rect x="18" y="26" width="210" height="44" fill="#FBD21E"/><text x="26" y="53" fill="#051B78" font-size="13" font-weight="800">8–32 格瑞士模数母版</text><rect x="18" y="84" width="136" height="58" fill="#FFFFFF"/><rect x="166" y="84" width="136" height="58" fill="rgba(255,255,255,0.22)" stroke="#FFFFFF"/><text x="86" y="117" fill="#051B78" font-size="11" font-weight="700" text-anchor="middle">整版与局部同尺</text><text x="234" y="117" fill="#FFFFFF" font-size="11" text-anchor="middle">图注齐轨</text></svg>`,
  },
  {
    badge: "W3C 规范演进 · 2017.03 & 2018.06.28",
    heading: "CSS Grid Level 1 首发落地，Subgrid 独立升入 Level 2",
    text: "2017 年 3 月 CSS Grid Layout Level 1 在主流浏览器同步上线时，CSS 工作组决定将实现复杂度极高的 subgrid 移至 Level 2，由 Tab Atkins Jr.、Elika J. Etemad（fantasai）、Rossen Atanassov 与 Oriol Brufau 编辑，并由 Rachel Andrew 等人持续推动社区用例完善。2018 年 6 月 28 日 W3C 发布 Level 2 首个公开工作草案，确立了单轴独立继承的现代设计。",
    svg: `<svg viewBox="0 0 320 170" width="100%"><rect width="320" height="170" fill="#002ED3"/><rect x="18" y="20" width="284" height="54" fill="rgba(255,255,255,0.12)" stroke="#FFFFFF"/><text x="160" y="42" fill="#FBD21E" font-size="12" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">LEVEL 1 (2017)：仅管直系子元素</text><text x="160" y="61" fill="#DCE6FF" font-size="11" text-anchor="middle">孙元素必须另建独立网格</text><rect x="18" y="92" width="284" height="58" fill="#FBD21E"/><text x="160" y="116" fill="#051B78" font-size="12" font-family="JetBrains Mono" font-weight="800" text-anchor="middle">LEVEL 2 FPWD (2018.06.28)</text><text x="160" y="136" fill="#051B78" font-size="11" font-weight="700" text-anchor="middle">单轴 / 双轴 subgrid 正式定型</text></svg>`,
  },
  {
    badge: "引擎率先实现 · 2019.12 & 2022.09",
    heading: "Firefox 71 率先发布原生支持，Safari 16 随后跟进",
    text: "2019 年 12 月，Firefox 71 成为首个默认开启 CSS Subgrid 的主流浏览器，并在开发者工具中配套上线了父/子网格双层高亮徽章，Rachel Andrew 在 Mozilla Hacks 上系统介绍了这一里程碑。2022 年 9 月，Safari 16 在 WebKit 引擎落地完整子网格支持，跨越了桌面与移动生态的关键一步。",
    svg: `<svg viewBox="0 0 320 170" width="100%"><rect width="320" height="170" fill="#002ED3"/><rect x="20" y="28" width="132" height="114" fill="rgba(255,255,255,0.14)" stroke="#FBD21E" stroke-width="2"/><text x="86" y="66" fill="#FBD21E" font-size="16" font-family="Archivo" font-weight="800" text-anchor="middle">Firefox 71</text><text x="86" y="90" fill="#FFFFFF" font-size="12" font-family="JetBrains Mono" text-anchor="middle">2019.12</text><text x="86" y="114" fill="#DCE6FF" font-size="11" text-anchor="middle">首个原生实现</text><rect x="168" y="28" width="132" height="114" fill="rgba(255,255,255,0.14)" stroke="#6EF2C7" stroke-width="2"/><text x="234" y="66" fill="#6EF2C7" font-size="16" font-family="Archivo" font-weight="800" text-anchor="middle">Safari 16</text><text x="234" y="90" fill="#FFFFFF" font-size="12" font-family="JetBrains Mono" text-anchor="middle">2022.09</text><text x="234" y="114" fill="#DCE6FF" font-size="11" text-anchor="middle">WebKit 全量跟进</text></svg>`,
  },
  {
    badge: "全引擎互通 · 2023.09 Baseline",
    heading: "Chrome 117 与 Edge 117 补齐最后一块拼图",
    text: "2023 年 9 月，Chrome 117 与 Edge 117 正式发布 CSS Subgrid，Gecko、WebKit、Blink 三大主流渲染引擎全面互通，子网格于 2023 年 9 月 15 日进入 Web Baseline，从此可以放心地在日常卡片组、表格与复杂表单的生产环境中使用。",
    svg: `<svg viewBox="0 0 320 170" width="100%"><rect width="320" height="170" fill="#002ED3"/>${["Gecko / Firefox 71+", "WebKit / Safari 16+", "Blink / Chrome 117+"].map((t,i)=>`<rect x="24" y="${22+i*44}" width="272" height="34" fill="${i===2?'#FBD21E':'rgba(110,242,199,0.22)'}" stroke="${i===2?'#FBD21E':'#6EF2C7'}"/><text x="160" y="${43+i*44}" fill="${i===2?'#051B78':'#FFFFFF'}" font-size="12" font-family="JetBrains Mono, Noto Sans SC" font-weight="700" text-anchor="middle">✓ ${t}</text>`).join("")}</svg>`,
  },
];

function renderTimeline(idx) {
  const item = TIMELINE[idx] || TIMELINE[0];
  $$(".tl-node").forEach((b) => {
    const active = Number(b.dataset.tl) === idx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("#tl-badge").textContent = item.badge;
  $("#tl-heading").textContent = item.heading;
  $("#tl-text").textContent = item.text;
  $("#tl-diagram").innerHTML = item.svg;
}

$$(".tl-node").forEach((b) => b.addEventListener("click", () => renderTimeline(Number(b.dataset.tl))));
renderTimeline(0);

// =========================================================================
// 6. 第 05 节：场景诊断决策矩阵
// =========================================================================
const DECISIONS = {
  cards: {
    use: true,
    tag: "适用理由",
    title: "为什么多栏卡片是子网格的头号主场",
    why: "每张卡片的子项数量固定且结构同构（图、标题、摘要、操作栏，共 4 行），只要卡片声明 <code>grid-row: span 4; grid-template-rows: subgrid;</code>，无论哪张卡的文案临时变长，同行所有卡片都会自动协同步调，彻底告别手写固定 <code>min-height</code>。",
    altLabel: "工程提醒",
    altText: "手机端卡片折叠成单列时，建议在窄屏断点撤掉跨多列的 grid-column 设置，或让每张卡只占 1 列并保留自然高度流，避免强套桌面 12 列跨度。",
  },
  form: {
    use: true,
    tag: "适用理由",
    title: "跨越不同分组标题，表单标签与输入框仍成一条直线",
    why: "复杂表单常按语义拆成 <code>&lt;fieldset&gt;</code> 分组。过去每组独立算列宽，导致第一组标签占 90px、第二组占 130px，整页输入框歪歪扭扭。给每个分组开启 <code>grid-template-columns: subgrid</code> 后，所有分组共享外层 <code>auto 1fr</code> 两列，最长标签会自动替全页定好基准线。",
    altLabel: "工程提醒",
    altText: "记得把分组标题（legend 或 heading）单独设成 <code>grid-column: 1 / -1</code> 通栏跨过两列，才不会把第一列标签无故撑宽。",
  },
  unknown: {
    use: false,
    tag: "避坑原因",
    title: "子项数量不确定时，子网格会发生隐式轨溢出叠车",
    why: "普通网格遇到多出来的条目会自动追加隐式行轨；但子网格被严格限制在父容器分配给它的 <code>span N</code> 轨道数里。如果评论数或标签数可能从 2 条涨到 12 条，超出 N 的条目会被全部压进第 N 条轨道重叠在一起。",
    altLabel: "推荐替代",
    altText: "改用普通独立网格（<code>grid-auto-rows: auto</code>）或弹性换行布局（Flexbox），把需要对齐的外框留在父级，动态流留在子级内部。",
  },
  unrelated: {
    use: false,
    tag: "避坑原因",
    title: "毫无对齐关系的模块强行共轨，只会互相拖累撑出空洞",
    why: "假设左侧是一篇 5 段长文，右侧是一串紧凑的日历小徽章。如果把两区硬捆成行子网格，长文第 1 段会把右侧第 1 枚日历徽章下方拉出几百像素的白洞，既浪费空间又打散右侧自身的紧凑节奏。",
    altLabel: "推荐替代",
    altText: "左右两区只在外层对齐父列轨（或使用 205 嵌套网格各自维护独立行节奏），绝不为了炫技强开行子网格。",
  },
};

function renderDecision(key) {
  const item = DECISIONS[key] || DECISIONS.cards;
  $$(".dec-card").forEach((b) => b.classList.toggle("is-active", b.dataset.dec === key));
  const tag = $("#s5-tag");
  tag.textContent = item.tag;
  tag.className = `dec-tag ${item.use ? "is-use" : "is-avoid"}`;
  $("#s5-title").textContent = item.title;
  $("#s5-why").innerHTML = item.why;
  $("#s5-alt-label").textContent = item.altLabel;
  $("#s5-alt-text").innerHTML = item.altText;
}

$$(".dec-card").forEach((b) => b.addEventListener("click", () => renderDecision(b.dataset.dec)));
renderDecision("cards");

// =========================================================================
// 7. 第 06 节：小练习四图精确绘制与单变量判定
// =========================================================================
function drawQuizMiniSvg(opt) {
  // 280 x 148，统一画 12 条父列虚线 + 3 张占 4 列的卡片，差异只在于唯一变量！
  const cols = [];
  const x0 = 14, gap = 4, colW = (280 - 28 - gap * 11) / 12;
  for (let i = 0; i < 12; i++) {
    const x = x0 + i * (colW + gap);
    cols.push({ x, w: colW });
  }
  const bgLines = cols
    .map((c) => `<line x1="${c.x.toFixed(1)}" y1="8" x2="${c.x.toFixed(1)}" y2="140" stroke="rgba(173,186,245,0.28)" stroke-dasharray="2 2"/>`)
    .join("");

  const cardSpans = [
    { x: cols[0].x, w: cols[3].x + colW - cols[0].x },
    { x: cols[4].x, w: cols[7].x + colW - cols[4].x },
    { x: cols[8].x, w: cols[11].x + colW - cols[8].x },
  ];

  let body = "";
  cardSpans.forEach((sp, k) => {
    const isMid = k === 1;
    const cx = sp.x;
    const cw = sp.w;
    body += `<rect x="${cx.toFixed(1)}" y="14" width="${cw.toFixed(1)}" height="120" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.68)" stroke-width="1"/>`;
    // 图标圆
    body += `<circle cx="${(cx + 12).toFixed(1)}" cy="26" r="5" fill="#FBD21E"/>`;

    if (opt === "A") {
      // A: 独立行轨 -> 卡二标题 3 行把自己的正文推低，三卡说明线高低不平
      const tLines = isMid ? 3 : 1;
      for (let i = 0; i < tLines; i++) {
        body += `<rect x="${(cx + 7).toFixed(1)}" y="${36 + i * 9}" width="${(cw - 14) * (i === tLines - 1 ? 0.7 : 0.95)}" height="5" fill="#FFFFFF"/>`;
      }
      const descY = 36 + tLines * 9 + 7;
      body += `<rect x="${(cx + 7).toFixed(1)}" y="${descY}" width="${(cw - 14).toFixed(1)}" height="14" fill="#ADBAF5"/>`;
      body += `<rect x="${(cx + 7).toFixed(1)}" y="116" width="${(cw - 14).toFixed(1)}" height="10" fill="#FBD21E"/>`;
    } else if (opt === "B") {
      // B: span 2 轨道不足 -> 说明与日期挤在第 2 轨叠压（保持与 A/C/D 相同配色，绝不靠红绿泄题）
      const tLines = isMid ? 3 : 1;
      for (let i = 0; i < tLines; i++) {
        body += `<rect x="${(cx + 7).toFixed(1)}" y="${36 + i * 7}" width="${(cw - 14) * (i === tLines - 1 ? 0.72 : 0.95)}" height="4.5" fill="#FFFFFF"/>`;
      }
      body += `<rect x="${(cx + 7).toFixed(1)}" y="66" width="${(cw - 14).toFixed(1)}" height="18" fill="#ADBAF5"/>`;
      body += `<rect x="${(cx + 10).toFixed(1)}" y="73" width="${(cw - 20).toFixed(1)}" height="11" fill="#FBD21E" fill-opacity="0.92" stroke="#002ED3" stroke-width="1"/>`;
    } else if (opt === "C") {
      // C: 正解 span 4 + subgrid -> 图标、标题、说明、底部日期四道水平线全排笔直对齐
      const tLines = isMid ? 3 : 1;
      for (let i = 0; i < tLines; i++) {
        body += `<rect x="${(cx + 7).toFixed(1)}" y="${36 + i * 9}" width="${(cw - 14) * (i === tLines - 1 ? 0.72 : 0.95)}" height="5" fill="#FFFFFF"/>`;
      }
      body += `<rect x="${(cx + 7).toFixed(1)}" y="72" width="${(cw - 14).toFixed(1)}" height="18" fill="#ADBAF5"/>`;
      body += `<rect x="${(cx + 7).toFixed(1)}" y="114" width="${(cw - 14).toFixed(1)}" height="11" fill="#FBD21E"/>`;
    } else if (opt === "D") {
      // D: span 4 + subgrid 但局部 row-gap 强放大 -> 中间拉出刺眼断裂大空洞且底栏顶出下框
      body += `<rect x="${(cx + 7).toFixed(1)}" y="36" width="${(cw - 14).toFixed(1)}" height="${isMid ? 18 : 5}" fill="#FFFFFF"/>`;
      body += `<rect x="${(cx + 7).toFixed(1)}" y="96" width="${(cw - 14).toFixed(1)}" height="12" fill="#ADBAF5"/>`;
      body += `<rect x="${(cx + 7).toFixed(1)}" y="130" width="${(cw - 14).toFixed(1)}" height="10" fill="#FBD21E"/>`;
    }
  });

  return bgLines + body;
}

const QUIZ_REASONS = {
  A: {
    ok: false,
    text: "差在「没有继承父行轨」：A 给每张卡片写了独立的 grid-template-rows: auto auto 1fr auto。虽然外框高度相同、底部日期能沉底，但中间卡片折成 3 行后，它的说明块明显比左右两张低了一截，三张卡的内部分界线参差错位。",
  },
  B: {
    ok: false,
    text: "差在「跨度 span 数值不够」：B 开启了行子网格，却只给了 grid-row: span 2。卡片内部有图标、标题、说明、日期共 4 段内容，而子网格不会自动长出隐式行轨，结果后面的内容全被挤进第 2 条轨道互相叠压。",
  },
  C: {
    ok: true,
    text: "答对了！C 同时满足三个条件：卡片跨 4 条父行轨（刚好容纳 4 段子项）、开启 grid-template-rows: subgrid 共享行轨，并继承父级合理的 gap。卡二的 3 行标题把全排第 2 轨一致撑高，三张卡片的说明起点与底部日期全部拉成笔直一条基准线。",
  },
  D: {
    ok: false,
    text: "差在「局部 row-gap 覆写过大」：D 虽然写对了 span 4 与 subgrid，却把局部行距强行拉成 48px，远超页面原本的垂直节奏，导致卡片内部出现大片断裂空洞，底部日期甚至贴底挤出安全区。",
  },
};

$$(".quiz-opt").forEach((btn) => {
  const opt = btn.dataset.opt;
  const svg = $(".quiz-svg", btn);
  if (svg) svg.innerHTML = drawQuizMiniSvg(opt);

  btn.addEventListener("click", () => {
    $$(".quiz-opt").forEach((other) => {
      other.classList.remove("is-correct", "is-wrong");
      other.setAttribute("aria-pressed", String(other === btn));
    });
    const info = QUIZ_REASONS[opt];
    btn.classList.add(info.ok ? "is-correct" : "is-wrong");
    if (!info.ok) {
      const rightBtn = $('.quiz-opt[data-opt="C"]');
      if (rightBtn) rightBtn.classList.add("is-correct");
    }
    const fb = $("#quiz-feedback");
    fb.className = `quiz-feedback ${info.ok ? "is-correct" : "is-wrong"}`;
    fb.innerHTML = `<p><strong>选项 ${opt}：</strong>${info.text}</p>`;
  });
});

// =========================================================================
// 8. 第 07 节：原海报全屏灯箱（缩放、拖动平移、Esc 关；只复用 #poster 的 src）
// =========================================================================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScaleEl = $("#lb-scale");
const posterOpen = $("#poster-open");

const lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.x}px, ${lbState.y}px) scale(${lbState.scale})`;
  lbScaleEl.textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbState.scale = 1;
  lbState.x = 0;
  lbState.y = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lb.hidden) return;
  lb.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbState.scale = clamp(lbState.scale + 0.3, 0.6, 3.5);
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbState.scale = clamp(lbState.scale - 0.3, 0.6, 3.5);
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbState.scale = 1;
  lbState.x = 0;
  lbState.y = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.18 : -0.18;
  lbState.scale = clamp(lbState.scale + delta, 0.6, 3.5);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbState.dragging = true;
  lbState.sx = e.clientX;
  lbState.sy = e.clientY;
  lbState.ox = lbState.x;
  lbState.oy = lbState.y;
  lbStage.classList.add("is-grabbing");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbState.dragging) return;
  lbState.x = lbState.ox + (e.clientX - lbState.sx);
  lbState.y = lbState.oy + (e.clientY - lbState.sy);
  applyLbTransform();
});
const stopLbDrag = () => {
  lbState.dragging = false;
  lbStage.classList.remove("is-grabbing");
};
lbStage.addEventListener("pointerup", stopLbDrag);
lbStage.addEventListener("pointercancel", stopLbDrag);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});
