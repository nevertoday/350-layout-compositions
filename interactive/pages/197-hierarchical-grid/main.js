import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  INITIAL_STATE,
  SCENE_PRESETS,
  TYPE_CONFIG,
  CLAMP,
  clamp,
  evaluate,
  PATH_TOPOLOGIES,
  evaluateLevers,
  ANTI_CASES,
  QUIZ_OPTIONS,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// =============================================================================
// 全局单真源状态（开场玩具）
// =============================================================================
let state = { ...INITIAL_STATE };
let report = evaluate(state);
let dirtyHero = true;
let dragState = null; // { handle, startClientX, startClientY, startVal, pointerId, isTouch, moved }
let hoverHandle = null;
let pulseHandle = null;
let pulseTimer = 0;

// 工具：在 2D Canvas 内画安全换行文本（带中文标点避头尾与宽桶缓存，避免拖动期反复 measureText）
const NO_START_PUNCT = new Set(["。", "，", "、", "；", "：", "！", "？", "）", "》", "」", "”", "."]);
const wrapCache = new Map();
function computeWrappedLines(ctx, text, maxW, maxLines) {
  const bucket = Math.max(20, Math.round(maxW / 6) * 6);
  const key = `${ctx.font}|${bucket}|${maxLines}|${text}`;
  const hit = wrapCache.get(key);
  if (hit) return hit;

  const out = [];
  let line = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const test = line + ch;
    if (ctx.measureText(test).width > bucket && line) {
      if (NO_START_PUNCT.has(ch) && ctx.measureText(test).width <= bucket + 10) {
        line = test;
        continue;
      }
      if (out.length + 1 >= maxLines) {
        out.push(line.slice(0, Math.max(1, line.length - 1)) + "…");
        line = "";
        break;
      }
      out.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line && out.length < maxLines) out.push(line);
  if (wrapCache.size > 400) wrapCache.clear();
  wrapCache.set(key, out);
  return out;
}

function drawWrapped(ctx, text, x, y, maxW, lineH, maxLines = 3) {
  if (!text || maxW < 18 || maxLines <= 0) return y;
  const lines = computeWrappedLines(ctx, text, maxW, maxLines);
  let cy = y;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, cy);
    cy += lineH;
  }
  return cy;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// =============================================================================
// 同步 DOM（差量更新，避免拖动期间高频全页 Reflow）
// =============================================================================
const domCache = new Map();
const setCachedText = (el, txt) => {
  if (!el || domCache.get(el) === txt) return;
  domCache.set(el, txt);
  el.textContent = txt;
};
const domEls = {
  topStatus: $("#top-status"),
  titleBar: $("#title-ratio-bar"),
  ptags: [0, 1, 2, 3, 4].map((i) => $(`#ptag-${i}`)),
  sceneTabs: $$(".scene-tab"),
  handleBtns: $$("[data-handle]"),
  handleVal: $("#handle-val"),
  typeBtns: $$("[data-type]"),
  gapBtns: $$("[data-gap]"),
  swapBtn: $("#btn-swap-ac"),
  banner: $("#diag-banner"),
  diagBadge: $("#diag-badge"),
  diagTitle: $("#diag-title"),
  diagWhy: $("#diag-why"),
  diagAction: $("#diag-action"),
  mAreaA: $("#m-area-a"),
  mRatio: $("#m-ratio"),
  mAreaD: $("#m-area-d"),
  mOrder: $("#m-order"),
};
let lastStaticSig = "";

function syncHeroDOM(dragging = false) {
  report = evaluate(state);
  const { pct, actualOrder, heroRatio, passedCount, diag, principles } = report;
  const isOk = passedCount === 4;

  // 顶栏状态徽
  if (domEls.topStatus) {
    setCachedText(domEls.topStatus, isOk ? "4 / 4 层级成立" : `${passedCount} / 4 待立序`);
    domEls.topStatus.classList.toggle("is-ok", isOk);
    domEls.topStatus.classList.toggle("is-err", !isOk);
  }

  // 底部数字读数始终实时更新
  setCachedText(domEls.mAreaA, `${pct.A}%`);
  setCachedText(domEls.mRatio, `${heroRatio.toFixed(2)}×`);
  setCachedText(domEls.mAreaD, `${pct.D}%`);
  setCachedText(domEls.mOrder, actualOrder.join(">"));

  // 界墙当前值读数
  if (domEls.handleVal) {
    const v = state.activeHandle === "splitD"
      ? Math.round((1 - state.splitD) * 100)
      : Math.round(state[state.activeHandle] * 100);
    setCachedText(domEls.handleVal, state.activeHandle === "splitD" ? `D ${v}%` : `${v}%`);
  }

  // 底部诊单带（仅在内容变化时写 DOM）
  if (domEls.banner) {
    domEls.banner.classList.toggle("is-ok", isOk);
    domEls.banner.classList.toggle("is-err", !isOk);
  }
  setCachedText(domEls.diagBadge, diag.badge);
  setCachedText(domEls.diagTitle, diag.title);
  setCachedText(domEls.diagWhy, diag.why);
  setCachedText(domEls.diagAction, diag.action);

  // 01-05 原则核验小签
  principles.forEach((p, idx) => {
    const el = domEls.ptags[idx];
    if (!el) return;
    setCachedText(el, p.tag);
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-err", !p.ok);
  });

  // 标题示范条在拖动结束后或百分比变化时更新，减少连续 flex 回流
  if (!dragging && domEls.titleBar) {
    const spans = domEls.titleBar.children;
    if (spans.length === 4) {
      const barSig = `${pct.A},${pct.B},${pct.C},${pct.D}`;
      if (domCache.get(domEls.titleBar) !== barSig) {
        domCache.set(domEls.titleBar, barSig);
        spans[0].style.flexGrow = String(Math.max(4, pct.A));
        spans[1].style.flexGrow = String(Math.max(4, pct.B));
        spans[2].style.flexGrow = String(Math.max(4, pct.C));
        spans[3].style.flexGrow = String(Math.max(4, pct.D));
      }
    }
  }

  // 按钮选中态只在离散选项变动时更新
  const staticSig = `${state.scene}|${state.activeHandle}|${state.typeMode}|${state.gapMode}|${state.swapAC}`;
  if (staticSig !== lastStaticSig) {
    lastStaticSig = staticSig;
    domEls.sceneTabs.forEach((btn) => {
      const active = btn.dataset.scene === state.scene;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    domEls.handleBtns.forEach((btn) => {
      const active = btn.dataset.handle === state.activeHandle;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    domEls.typeBtns.forEach((btn) => {
      const active = btn.dataset.type === state.typeMode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    domEls.gapBtns.forEach((btn) => {
      const active = btn.dataset.gap === state.gapMode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    if (domEls.swapBtn) {
      domEls.swapBtn.setAttribute("aria-pressed", String(state.swapAC));
      setCachedText(domEls.swapBtn, state.swapAC ? "归位 A/C 角色" : "对调 A/C 角色试错");
    }
  }

  dirtyHero = true;
}

// =============================================================================
// 2D Canvas 主画布绘制（左侧 A/B/C/D 活体虚线切割框 + 右侧重要性竖向重力标尺）
// =============================================================================
function initHeroCanvas() {
  const canvas = $("#hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let cssW = 720;
  let cssH = 480;

  let cachedRect = null;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    cachedRect = rect;
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    // 手机小屏上限 1.5 像素比（省 44% 软渲染像素开销且依然锐利），桌面维持最多 2
    const dpr = pixelRatio(window.innerWidth <= 680 ? 1.5 : 2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirtyHero = true;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // 计算画布内部「暖燕麦外框内区」与「右侧重要性竖轴」的像素几何
  function getGeometry() {
    const narrow = cssW < 420;
    const axisW = narrow ? 62 : Math.round(clamp(cssW * 0.16, 94, 134));
    const padOuter = narrow ? 8 : 11;
    const boxX = 0;
    const boxY = 0;
    const boxW = cssW - axisW - (narrow ? 6 : 12);
    const boxH = cssH;
    const inX = boxX + padOuter;
    const inY = boxY + padOuter;
    const inW = Math.max(120, boxW - padOuter * 2);
    const inH = Math.max(120, boxH - padOuter * 2);
    const axisX = boxW + Math.round(axisW * 0.62);
    return { narrow, axisW, padOuter, boxX, boxY, boxW, boxH, inX, inY, inW, inH, axisX };
  }

  // 在单个分区内按当前 scene 皮肤与 typeMode 实排内容
  function drawZoneContent(g, k, rx, ry, rw, rh, pctVal, warnTag) {
    const preset = SCENE_PRESETS[state.scene];
    const info = preset.content[k];
    const isDark = k === "D";
    const fillMap = {
      A: state.scene === "editorial" ? "#6c7869" : PALETTE.coral,
      B: PALETTE.oatmeal,
      C: PALETTE.ochre,
      D: PALETTE.forestDeep,
    };
    const inkMap = {
      A: state.scene === "editorial" ? PALETTE.oatmealBright : PALETTE.forestInk,
      B: PALETTE.forestInk,
      C: PALETTE.forestInk,
      D: PALETTE.oatmeal,
    };
    const subInkMap = {
      A: state.scene === "editorial" ? "#e4ebe0" : "#1e3a2f",
      B: "#2d453b",
      C: "#2a2719",
      D: "#c6d3ca",
    };

    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();

    // 分区底色
    ctx.fillStyle = fillMap[k];
    ctx.fillRect(rx, ry, rw, rh);

    // 针对场景绘制原海报特征矢量图形（无人物五官，纯建筑几何与自然剪影）
    if (state.scene === "cover" && k === "A" && rw > 80 && rh > 80) {
      // 原海报案例一：底部深墨绿拱门 + 古铜金平衡圆
      const archW = Math.min(rw * 0.62, rh * 0.72);
      const archH = Math.min(rh * 0.48, archW * 0.92);
      const ax = rx + (rw - archW) * 0.5;
      const ay = ry + rh - archH;
      ctx.fillStyle = PALETTE.forestDeep;
      ctx.beginPath();
      ctx.moveTo(ax, ry + rh);
      ctx.lineTo(ax, ay + archW * 0.5);
      ctx.arc(ax + archW * 0.5, ay + archW * 0.5, archW * 0.5, Math.PI, 0, false);
      ctx.lineTo(ax + archW, ry + rh);
      ctx.closePath();
      ctx.fill();

      const dr = clamp(archW * 0.16, 10, 26);
      ctx.fillStyle = PALETTE.ochre;
      ctx.beginPath();
      ctx.arc(ax + archW - dr * 0.35, ry + rh - dr * 1.4, dr, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.scene === "editorial" && k === "A" && rw > 70 && rh > 70) {
      // 原海报案例二：满月 + 双层深松绿山峦
      ctx.fillStyle = PALETTE.oatmealBright;
      ctx.beginPath();
      ctx.arc(rx + rw * 0.78, ry + rh * 0.24, clamp(Math.min(rw, rh) * 0.085, 8, 20), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#113328";
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh);
      ctx.lineTo(rx + rw * 0.34, ry + rh * 0.52);
      ctx.lineTo(rx + rw * 0.66, ry + rh * 0.74);
      ctx.lineTo(rx + rw * 0.92, ry + rh * 0.46);
      ctx.lineTo(rx + rw, ry + rh * 0.56);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#082219";
      ctx.beginPath();
      ctx.moveTo(rx + rw * 0.2, ry + rh);
      ctx.lineTo(rx + rw * 0.58, ry + rh * 0.64);
      ctx.lineTo(rx + rw, ry + rh * 0.86);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.closePath();
      ctx.fill();
    } else if (state.scene === "data" && k === "B" && rw > 70 && rh > 62) {
      // 案例三趋势柱图区：精致 6 根绿金柱
      const bars = [0.32, 0.58, 0.42, 0.74, 0.62, 0.92];
      const padB = 12;
      const bw = Math.min(18, (rw - padB * 2 - (bars.length - 1) * 5) / bars.length);
      const maxBh = Math.min(rh * 0.42, 56);
      const baseY = ry + rh - 10;
      const startX = rx + padB;
      bars.forEach((hFrac, idx) => {
        ctx.fillStyle = idx >= 4 ? PALETTE.ochreDeep : PALETTE.forestInk;
        const bh = Math.max(6, maxBh * hFrac);
        ctx.fillRect(startX + idx * (bw + 5), baseY - bh, bw, bh);
      });
    } else if (state.scene === "article" && k === "A" && rw > 95 && rh > 110) {
      // 案例四长文页：简洁排文节奏线
      ctx.fillStyle = "rgba(7, 32, 23, 0.16)";
      const lx = rx + 16;
      const lw = Math.min(rw - 32, 280);
      const startY = ry + rh - 52;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(lx, startY + i * 10, i === 3 ? lw * 0.62 : lw, 3.5);
      }
    }

    // 分区细虚线内边
    ctx.strokeStyle = isDark ? "rgba(239, 229, 214, 0.25)" : "rgba(7, 32, 23, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
    ctx.setLineDash([]);

    // 根据字阶模式计算各区字号（同号 1.0× vs 清晰阶梯 vs 强对比）
    const scaleCfg = TYPE_CONFIG[state.typeMode];
    const basePx = clamp(Math.min(rw, rh) * 0.13, 12, 16);
    const multMap = scaleCfg.id === "flat"
      ? { A: 1.0, B: 1.0, C: 1.0, D: 1.0 }
      : scaleCfg.id === "clear"
        ? { A: 2.8, B: 1.5, C: 1.3, D: 1.0 }
        : { A: 3.6, B: 1.65, C: 1.35, D: 0.95 };

    const pad = clamp(Math.min(rw, rh) * 0.08, 8, 18);
    // 右侧列（B/C，或互换后的 A）左侧留出安全距，避免紧贴主纵墙 ↔ 拉柄
    const isRightCol = rx > (g.inX + 12);
    const padL = isRightCol ? Math.max(pad, 20) : pad;
    const innerW = Math.max(20, rw - padL - pad);

    // 顶沿右侧面积百分比胶囊（固定估算宽避免反复 measureText）
    const pctText = `${k} ${pctVal}%`;
    ctx.font = `600 11px "IBM Plex Mono", monospace`;
    const badgeW = pctText.length * 7 + 12;
    const badgeH = 19;
    const bx = rx + rw - badgeW - 6;
    const by = ry + 6;
    ctx.fillStyle = warnTag
      ? PALETTE.errLight
      : isDark
        ? "rgba(239, 229, 214, 0.16)"
        : "rgba(2, 26, 17, 0.14)";
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.fillStyle = warnTag ? "#FFFFFF" : inkMap[k];
    ctx.textBaseline = "middle";
    ctx.fillText(pctText, bx + 6, by + badgeH * 0.52);

    // 底部 D 矮条用横向排布，其余竖向排布
    if (k === "D" && rh < 76) {
      const dSize = clamp(basePx * multMap.D * (scaleCfg.id === "flat" ? 1.15 : 1.55), 14, Math.min(30, rh * 0.58));
      ctx.font = `700 ${Math.round(dSize)}px "Fraunces", "Noto Sans SC", serif`;
      ctx.fillStyle = inkMap.D;
      ctx.textBaseline = "middle";
      const cy = ry + rh * 0.52;
      const head = state.scene === "anatomy" ? "D" : info.title;
      ctx.fillText(head, rx + pad, cy);
      const headW = ctx.measureText(head).width;
      const avail = rw - pad * 2 - headW - badgeW - 18;
      if (avail > 42) {
        ctx.font = `400 ${scaleCfg.id === "flat" ? 13 : 11.5}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = subInkMap.D;
        drawWrapped(ctx, `${info.tag} · ${info.sub}`, rx + pad + headW + 12, cy, avail, 15, 1);
      }
    } else {
      // 常规分区纵向排布
      const titleSize = state.scene === "anatomy" || (state.scene === "data" && k === "A")
        ? clamp(
            scaleCfg.id === "flat" ? 20 : Math.min(rw * 0.34, rh * 0.34) * (multMap[k] / 2.2),
            16,
            k === "A" ? 76 : 42
          )
        : clamp(
            scaleCfg.id === "flat" ? 15 : 13.5 * multMap[k],
            13,
            k === "A" ? Math.min(34, rw * 0.14) : 21
          );

      const isSerifHero = state.scene === "anatomy" || (state.scene === "data" && k === "A");
      ctx.font = isSerifHero
        ? `700 ${Math.round(titleSize)}px "Fraunces", "Noto Sans SC", serif`
        : `900 ${Math.round(titleSize)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = inkMap[k];
      ctx.textBaseline = "top";

      const titleY = ry + pad + (rh > 140 && k === "A" && state.scene === "anatomy" ? rh * 0.14 : 2);
      ctx.fillText(info.title, rx + padL, titleY);

      const nextY = titleY + titleSize + 8;
      if (nextY + 14 < ry + rh - 6) {
        const tagSize = scaleCfg.id === "flat" ? 13.5 : clamp(11 + multMap[k] * 1.1, 11.5, 15);
        ctx.font = `700 ${Math.round(tagSize)}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = inkMap[k];
        const afterTag = drawWrapped(ctx, info.tag, rx + padL, nextY, innerW, tagSize + 4, 1);

        if (afterTag + 14 < ry + rh - 8 && !(state.scene === "data" && k === "B" && rh < 110)) {
          const subSize = scaleCfg.id === "flat" ? 13 : 11.5;
          ctx.font = `400 ${subSize}px "Noto Sans SC", sans-serif`;
          ctx.fillStyle = subInkMap[k];
          const maxLines = rh > 180 ? 3 : rh > 110 ? 2 : 1;
          drawWrapped(ctx, info.sub, rx + padL, afterTag + 3, innerW, subSize + 4.5, maxLines);
        }
      }
    }

    // 异常警告小红标（如「权重倒挂」「主区气短」「挤扁」「喧宾」）
    if (warnTag && rw > 54 && rh > 36) {
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = warnTag.length * 11 + 12;
      const tx = rx + 6;
      const ty = ry + rh - 24;
      ctx.fillStyle = PALETTE.errLight;
      ctx.fillRect(tx, ty, Math.min(tw, rw - 12), 19);
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(warnTag, tx + 6, ty + 10);
    }

    ctx.restore();
  }

  // 绘制三道活体虚线界墙与圆角双箭头拉柄
  function drawHandles(g, introP) {
    const { inX, inY, inW, inH } = g;
    const h = report.handles;
    const xSplit = inX + h.splitX.x * inW;
    const yD = inY + h.splitD.y * inH;
    const yBC = inY + h.splitBC.y * inH;

    const drawRail = (id, x1, y1, x2, y2, isVert) => {
      const active = dragState?.handle === id || hoverHandle === id || state.activeHandle === id || pulseHandle === id;
      const isFocusedDrag = dragState?.handle === id || hoverHandle === id;
      ctx.save();
      ctx.strokeStyle = isFocusedDrag ? "#FFFFFF" : active ? PALETTE.ochreBright : "rgba(2, 26, 17, 0.72)";
      ctx.lineWidth = isFocusedDrag ? 2.6 : active ? 2.1 : 1.5;
      ctx.setLineDash(active ? [] : [5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * introP, y1 + (y2 - y1) * introP);
      ctx.stroke();
      ctx.setLineDash([]);

      // 界墙拉柄胶囊
      const mx = (x1 + x2) * 0.5;
      const my = (y1 + y2) * 0.5;
      const pw = isVert ? 24 : 34;
      const ph = isVert ? 34 : 22;
      ctx.fillStyle = isFocusedDrag ? PALETTE.coral : active ? PALETTE.forestDeep : "#0d2b20";
      ctx.strokeStyle = active ? PALETTE.ochreBright : PALETTE.oatmealFrame;
      ctx.lineWidth = 1.6;
      roundRectPath(ctx, mx - pw * 0.5, my - ph * 0.5, pw, ph, 11);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isFocusedDrag ? PALETTE.forestDeep : PALETTE.oatmealBright;
      ctx.font = `700 12px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isVert ? "↔" : "↕", mx, my + 0.5);
      ctx.restore();
    };

    drawRail("splitX", xSplit, inY, xSplit, yD, true);
    drawRail("splitBC", xSplit, yBC, inX + inW, yBC, false);
    drawRail("splitD", inX, yD, inX + inW, yD, false);
  }

  // 右侧：原海报标志「重要性 高 ↑ ↓ 低」竖向重力标尺与四根实时连线
  function drawImportanceAxis(g, introP) {
    const { narrow, boxW, boxH, inX, inY, inW, inH, axisX } = g;
    const topY = 26;
    const botY = boxH - 28;
    const spanY = botY - topY;

    ctx.save();
    // 顶部「高」与底部「↓ 低」
    ctx.font = `700 ${narrow ? 12 : 13}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.ochreBright;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("高", axisX, 13);
    ctx.fillText("↓", axisX, boxH - 26);
    ctx.fillText("低", axisX, boxH - 11);

    // 竖轴主干
    ctx.strokeStyle = "rgba(223, 184, 120, 0.55)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(axisX, topY);
    ctx.lineTo(axisX, topY + spanY * introP);
    ctx.stroke();

    // 四个理想槽位高度（高 -> 低）
    const slotYs = [
      topY + spanY * 0.08,
      topY + spanY * 0.36,
      topY + spanY * 0.64,
      topY + spanY * 0.90,
    ];

    const dotColor = {
      A: PALETTE.coral,
      B: PALETTE.oatmealBright,
      C: PALETTE.ochre,
      D: "#9eb5a8",
    };

    // 每个区在画布中的出发锚点（靠画布右沿）
    const anchors = {};
    for (const k of ["A", "B", "C", "D"]) {
      const r = report.rects[k];
      const ay = inY + (r.y + r.h * 0.5) * inH;
      anchors[k] = { x: inX + (r.x + r.w) * inW, y: ay };
    }

    // 查哪些角色卷入了倒挂
    const badSet = new Set();
    for (const [hi, lo] of report.inversions) {
      badSet.add(hi);
      badSet.add(lo);
    }

    // 按实测面积顺位把四个圆点排到竖轴上！
    // 若无倒挂：A 落 slotYs[0]、B 落 slotYs[1]、C 落 slotYs[2]、D 落 slotYs[3]，与画布连线整齐平行
    // 若发生倒挂：圆点按实测面积高低落位，连线交叉变朱赤虚线并在折点报警
    const idealIdx = { A: 0, B: 1, C: 2, D: 3 };
    const exitX = boxW + 4;

    ["D", "C", "B", "A"].forEach((k) => {
      const actualIdx = report.rankOf[k];
      const targetY = slotYs[actualIdx];
      const srcY = clamp(anchors[k].y, topY + 6, botY - 8);
      const isInverted = actualIdx !== idealIdx[k] && badSet.has(k);
      const col = isInverted ? PALETTE.errDark : dotColor[k];

      // 画布右框边出线 → 折向竖轴圆点
      ctx.strokeStyle = col;
      ctx.lineWidth = isInverted ? 2.0 : 1.5;
      ctx.setLineDash(isInverted ? [4, 3] : []);
      ctx.beginPath();
      ctx.moveTo(boxW - 4, srcY);
      ctx.lineTo(exitX + (axisX - exitX) * 0.25, srcY);
      ctx.lineTo(axisX, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 左端小锚点
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(boxW - 4, srcY, 3, 0, Math.PI * 2);
      ctx.fill();

      // 竖轴大圆点
      const rDot = k === "A" ? (narrow ? 7.5 : 9) : (narrow ? 6 : 7);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(axisX, targetY, rDot, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.forestDeep;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 圆点内字母
      ctx.fillStyle = PALETTE.forestDeep;
      ctx.font = `700 ${narrow ? 9.5 : 10.5}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(k, axisX, targetY + 0.5);

      // 右侧小字标实测名次（宽屏或倒挂时标）
      if (!narrow || isInverted) {
        ctx.fillStyle = isInverted ? PALETTE.errDark : PALETTE.darkMuted || "#c6d3ca";
        ctx.font = `600 10.5px "IBM Plex Mono", monospace`;
        ctx.textAlign = "left";
        ctx.fillText(isInverted ? `#${actualIdx + 1}!` : `${report.pct[k]}%`, axisX + rDot + 4, targetY + 0.5);
      }
    });

    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (pulseTimer > 0) {
      pulseTimer = Math.max(0, pulseTimer - (dt || 0.016));
      if (pulseTimer === 0) pulseHandle = null;
      dirtyHero = true;
    }

    const introP = still ? 1 : clamp(t / 0.65, 0.2, 1);
    const inIntro = !still && t < 0.72;
    if (!dirtyHero && !inIntro) return;
    dirtyHero = false;

    const g = getGeometry();
    ctx.clearRect(0, 0, cssW, cssH);

    // 深森墨绿画布底
    ctx.fillStyle = PALETTE.forestDeep;
    ctx.fillRect(0, 0, cssW, cssH);

    // 197 原海报标志性暖燕麦厚边框
    ctx.fillStyle = PALETTE.oatmealFrame;
    ctx.fillRect(g.boxX, g.boxY, g.boxW, g.boxH);

    // 内槽深绿底（区缝留白时露出建筑缝）
    ctx.fillStyle = "#162d23";
    ctx.fillRect(g.inX, g.inY, g.inW, g.inH);

    // 计算每个区是否需要打异常小签
    const { areas, pct, inversions } = report;
    const invKeys = new Set(inversions.flat());
    const warnFor = {
      A: invKeys.has("A") ? "权重倒挂" : areas.A < 0.44 ? "主区气短" : areas.A > 0.68 ? "吞并过宽" : "",
      B: areas.B < 0.095 ? "挤扁" : invKeys.has("B") && !invKeys.has("A") ? "顺位错" : "",
      C: areas.C < 0.095 ? "挤扁" : "",
      D: areas.D > 0.175 ? "脚注喧宾" : areas.D < 0.07 ? "底栏挤扁" : "",
    };

    // 绘制四个分区
    for (const k of ["A", "B", "C", "D"]) {
      const r = report.rects[k];
      const rx = g.inX + r.x * g.inW;
      const ry = g.inY + r.y * g.inH;
      const rw = r.w * g.inW;
      const rh = r.h * g.inH;
      drawZoneContent(g, k, rx, ry, rw, rh, pct[k], warnFor[k]);
    }

    // 绘制三道活体虚线界墙与拉柄
    drawHandles(g, introP);

    // 绘制右侧「重要性 高→低」竖向重力标尺
    drawImportanceAxis(g, introP);
  }

  const { draw } = loop(canvas, render);

  // 坐标命中检测：优先匹配三道界墙，距离阈值 26px
  function hitTestHandle(px, py) {
    const g = getGeometry();
    const h = report.handles;
    const xSplit = g.inX + h.splitX.x * g.inW;
    const yD = g.inY + h.splitD.y * g.inH;
    const yBC = g.inY + h.splitBC.y * g.inH;
    const tol = 26;

    const dX = (py >= g.inY - 8 && py <= yD + 8) ? Math.abs(px - xSplit) : 999;
    const dBC = (px >= xSplit - 8 && px <= g.inX + g.inW + 8) ? Math.abs(py - yBC) : 999;
    const dD = (px >= g.inX - 8 && px <= g.inX + g.inW + 8) ? Math.abs(py - yD) : 999;

    const minD = Math.min(dX, dBC, dD);
    if (minD > tol) return null;
    if (minD === dX) return "splitX";
    if (minD === dD) return "splitD";
    return "splitBC";
  }

  function applyDragCoord(handle, px, py) {
    const g = getGeometry();
    const snap = (val, target) => (Math.abs(val - target) < 0.012 ? target : val);
    if (handle === "splitX") {
      let nx = clamp((px - g.inX) / g.inW, CLAMP.splitX[0], CLAMP.splitX[1]);
      nx = snap(nx, SCENE_PRESETS[state.scene].solution.splitX);
      state.splitX = nx;
    } else if (handle === "splitD") {
      let ny = clamp((py - g.inY) / g.inH, CLAMP.splitD[0], CLAMP.splitD[1]);
      ny = snap(ny, SCENE_PRESETS[state.scene].solution.splitD);
      state.splitD = ny;
    } else if (handle === "splitBC") {
      const topPx = Math.max(40, state.splitD * g.inH);
      let nbc = clamp((py - g.inY) / topPx, CLAMP.splitBC[0], CLAMP.splitBC[1]);
      nbc = snap(nbc, SCENE_PRESETS[state.scene].solution.splitBC);
      state.splitBC = nbc;
    }
    state.activeHandle = handle;
    // 拖动过程仅标脏、交由 rAF loop 每帧合并绘制一次；减少动态效果下手动 draw()
    syncHeroDOM(true);
    if (reducedMotion.matches) draw();
  }

  function localPoint(clientX, clientY) {
    const rect = dragState?.rect || canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  // Pointer 事件（鼠标 + 触控统一）
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const hit = hitTestHandle(pt.x, pt.y);
    dragState = {
      handle: hit || "splitX",
      directHit: Boolean(hit),
      startClientX: e.clientX,
      startClientY: e.clientY,
      startSplitX: state.splitX,
      pointerId: e.pointerId,
      isTouch: e.pointerType === "touch",
      locked: Boolean(hit) || e.pointerType !== "touch",
      rect,
    };
    if (dragState.locked) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      if (hit) {
        state.activeHandle = hit;
        syncHeroDOM(true);
        if (reducedMotion.matches) draw();
      }
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = localPoint(e.clientX, e.clientY);
    if (!dragState) {
      const hit = hitTestHandle(pt.x, pt.y);
      if (hit !== hoverHandle) {
        hoverHandle = hit;
        canvas.style.cursor = hit === "splitX" ? "ew-resize" : hit ? "ns-resize" : "ew-resize";
        dirtyHero = true;
        if (reducedMotion.matches) draw();
      }
      return;
    }
    if (e.pointerId !== dragState.pointerId) return;

    const dx = e.clientX - dragState.startClientX;
    const dy = e.clientY - dragState.startClientY;

    if (!dragState.locked) {
      if (Math.hypot(dx, dy) < 4) return;
      if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
        dragState.locked = true;
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      } else {
        dragState = null;
        return;
      }
    }

    if (dragState.directHit) {
      applyDragCoord(dragState.handle, pt.x, pt.y);
    } else {
      const g = getGeometry();
      const nx = clamp(dragState.startSplitX + dx / g.inW, CLAMP.splitX[0], CLAMP.splitX[1]);
      state.splitX = nx;
      state.activeHandle = "splitX";
      syncHeroDOM(true);
      if (reducedMotion.matches) draw();
    }
  });

  const endDrag = (e) => {
    if (!dragState) return;
    if (e && e.pointerId != null && e.pointerId !== dragState.pointerId) return;
    dragState = null;
    syncHeroDOM(false);
    if (reducedMotion.matches) draw();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘无障碍操作（焦点在画布时方向键直接微调界墙）
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.01 : 0.03;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      state.splitX = clamp(state.splitX + step, CLAMP.splitX[0], CLAMP.splitX[1]);
      state.activeHandle = "splitX";
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.splitX = clamp(state.splitX - step, CLAMP.splitX[0], CLAMP.splitX[1]);
      state.activeHandle = "splitX";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const target = state.activeHandle === "splitBC" ? "splitBC" : "splitD";
      state[target] = clamp(state[target] + step, CLAMP[target][0], CLAMP[target][1]);
      state.activeHandle = target;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const target = state.activeHandle === "splitBC" ? "splitBC" : "splitD";
      state[target] = clamp(state[target] - step, CLAMP[target][0], CLAMP[target][1]);
      state.activeHandle = target;
    } else {
      return;
    }
    syncHeroDOM();
    draw();
  });

  return { draw };
}

// =============================================================================
// 绑定 Hero 外围按钮与原则点击联动
// =============================================================================
function bindHeroControls(heroCanvasCtl) {
  const redraw = () => {
    syncHeroDOM();
    heroCanvasCtl?.draw();
  };

  $$(".scene-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.scene = btn.dataset.scene;
      redraw();
    });
  });

  $("#btn-solution")?.addEventListener("click", () => {
    const sol = SCENE_PRESETS[state.scene].solution;
    state = { ...state, ...sol };
    redraw();
  });

  $("#btn-reset")?.addEventListener("click", () => {
    state = { ...INITIAL_STATE, scene: state.scene };
    redraw();
  });

  $$("[data-handle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeHandle = btn.dataset.handle;
      pulseHandle = state.activeHandle;
      pulseTimer = 0.6;
      redraw();
    });
  });

  const nudge = (dir) => {
    const h = state.activeHandle;
    // splitD 控制的是 D 的高度（1 - splitD），按 + 让 D 变高（splitD 减小）更符合直觉
    const delta = h === "splitD" ? -dir * 0.03 : dir * 0.03;
    state[h] = clamp(state[h] + delta, CLAMP[h][0], CLAMP[h][1]);
    redraw();
  };
  $("#btn-step-minus")?.addEventListener("click", () => nudge(-1));
  $("#btn-step-plus")?.addEventListener("click", () => nudge(1));

  $$("[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.typeMode = btn.dataset.type;
      redraw();
    });
  });

  $$("[data-gap]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.gapMode = btn.dataset.gap;
      redraw();
    });
  });

  $("#btn-swap-ac")?.addEventListener("click", () => {
    state.swapAC = !state.swapAC;
    redraw();
  });

  // 左翼 01-05 原则点按高亮对应界墙
  $$(".p-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.focus || "splitX";
      state.activeHandle = f;
      pulseHandle = f;
      pulseTimer = 0.8;
      redraw();
    });
  });

  // 04 节四案例卡片「载入顶部实验台试调」
  $$("[data-load-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sc = btn.dataset.loadScene;
      if (!SCENE_PRESETS[sc]) return;
      state = { ...state, scene: sc, ...SCENE_PRESETS[sc].solution };
      redraw();
      window.scrollTo(0, 0);
    });
  });
}

// =============================================================================
// 01 节：眯眼模糊测试滑杆
// =============================================================================
function initSquintLab() {
  const slider = $("#squint-slider");
  const valEl = $("#squint-val");
  const eqBoard = $("#squint-equal");
  const hiBoard = $("#squint-hier");
  const eqRead = $("#squint-eq-read");
  const hiRead = $("#squint-hi-read");
  if (!slider || !eqBoard || !hiBoard) return;

  function update() {
    const px = Number(slider.value);
    eqBoard.style.filter = px > 0 ? `blur(${px}px)` : "none";
    hiBoard.style.filter = px > 0 ? `blur(${px}px)` : "none";

    const stage = px === 0 ? "清晰" : px < 6 ? "轻眯眼" : px < 10 ? "文字失焦" : "只剩面积骨架";
    if (valEl) valEl.textContent = `${px} px · ${stage}`;

    if (eqRead && hiRead) {
      if (px < 4) {
        eqRead.textContent = "清晰时靠逐字阅读还能勉强分辨，四块面积平分秋色。";
        hiRead.textContent = "清晰时主次立现，大陶粉主区和右下阶梯构成稳固结构。";
      } else if (px < 9) {
        eqRead.textContent = "文字开始糊掉，四坨色块一样大，眼神在中间左右摇摆。";
        hiRead.textContent = "即便字迹模糊，左侧 57% 的色块依然把视觉重心死死拉住。";
      } else {
        eqRead.textContent = "彻底退化成四宫格平权糊团——离开文字后，均分版面完全失序。";
        hiRead.textContent = "强模糊下层级骨架纹丝不动：先看大块，再扫右两格，最后掠过底条。";
      }
    }
  }

  slider.addEventListener("input", update);
  update();
}

// =============================================================================
// 02 节：视线阶梯 2D Canvas 眼动路径动画
// =============================================================================
function initPathLab() {
  const canvas = $("#path-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let activeId = "classic";
  let animStart = 0;
  let lastT = 0;
  let dirty = true;
  let cssW = 640;
  let cssH = 400;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width));
    cssH = Math.max(180, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function syncText() {
    const topo = PATH_TOPOLOGIES[activeId];
    $$(".path-tab").forEach((btn) => {
      const act = btn.dataset.topo === activeId;
      btn.classList.toggle("is-active", act);
      btn.setAttribute("aria-selected", String(act));
    });
    const badge = $("#path-badge");
    if (badge) {
      badge.textContent = topo.good ? "顺流路径" : "折返错例";
      badge.classList.toggle("is-ok", topo.good);
      badge.classList.toggle("is-err", !topo.good);
    }
    const set = (s, v) => { const n = $(s); if (n) n.textContent = v; };
    set("#path-title", topo.label);
    set("#path-desc", topo.desc);
    set("#path-hops", topo.hopsLabel);
    set("#path-speed", topo.speedLabel);
  }

  function render(t, _dt, { still }) {
    lastT = t;
    const elapsed = still ? 3.0 : t - animStart;
    const dur = 1.6;
    const progress = still ? 1 : clamp(elapsed / dur, 0, 1);
    if (!dirty && progress >= 1 && !still) return;
    dirty = false;

    const topo = PATH_TOPOLOGIES[activeId];
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = PALETTE.forestDeep;
    ctx.fillRect(0, 0, cssW, cssH);

    // 绘制四块区域
    topo.zones.forEach((z) => {
      const zx = z.x * cssW;
      const zy = z.y * cssH;
      const zw = z.w * cssW;
      const zh = z.h * cssH;
      ctx.fillStyle = z.color;
      ctx.fillRect(zx, zy, zw, zh);
      ctx.strokeStyle = z.color === PALETTE.forestDeep ? "rgba(239, 229, 214, 0.35)" : "rgba(2, 26, 17, 0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(zx + 0.5, zy + 0.5, zw - 1, zh - 1);

      ctx.fillStyle = z.ink;
      ctx.font = `700 ${cssW < 420 ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(z.label, zx + 10, zy + 9);
    });

    // 路径连线：先画全段浅引导底轨，确保动画每一刻都完整可读；再画已走过的亮实线
    const pts = topo.path.map((p) => ({ ...p, px: p.x * cssW, py: p.y * cssH }));
    const segCount = pts.length - 1;
    const exactSeg = progress * segCount;

    ctx.save();
    ctx.strokeStyle = topo.good ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 138, 122, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(pts[0].px, pts[0].py);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].px, pts[i].py);
    ctx.stroke();

    ctx.strokeStyle = topo.good ? "#FFFFFF" : PALETTE.errDark;
    ctx.lineWidth = 2.8;
    ctx.setLineDash(topo.good ? [] : [7, 5]);
    ctx.beginPath();
    ctx.moveTo(pts[0].px, pts[0].py);
    for (let i = 0; i < segCount; i++) {
      const frac = clamp(exactSeg - i, 0, 1);
      if (frac <= 0) break;
      const nx = pts[i].px + (pts[i + 1].px - pts[i].px) * frac;
      const ny = pts[i].py + (pts[i + 1].py - pts[i].py) * frac;
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 全部 4 站停留节点始终可见；巡到后外圈提亮
    pts.forEach((p, idx) => {
      const reached = exactSeg >= idx - 0.02 || still;
      const r = idx === 0 ? 16 : 13.5;
      ctx.fillStyle = topo.good
        ? (reached ? "rgba(2, 26, 17, 0.90)" : "rgba(2, 26, 17, 0.65)")
        : "rgba(181, 43, 34, 0.92)";
      ctx.strokeStyle = topo.good
        ? (reached ? PALETTE.ochreBright : "rgba(239, 229, 214, 0.65)")
        : "#FFFFFF";
      ctx.lineWidth = reached ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 12.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.step, p.px, p.py + 0.5);

      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(p.tag).width + 12;
      const tx = clamp(p.px - tw * 0.5, 8, cssW - tw - 8);
      const ty = p.py + r + 18 < cssH ? p.py + r + 5 : p.py - r - 23;
      ctx.fillStyle = "rgba(2, 26, 17, 0.88)";
      roundRectPath(ctx, tx, ty, tw, 18, 3);
      ctx.fill();
      ctx.fillStyle = topo.good ? PALETTE.oatmealBright : PALETTE.errDark;
      ctx.textAlign = "left";
      ctx.fillText(p.tag, tx + 6, ty + 9.5);
    });

    // 移动中的模拟眼动焦点球
    if (!still && progress < 1) {
      const segIdx = Math.min(segCount - 1, Math.floor(exactSeg));
      const f = exactSeg - segIdx;
      const gx = pts[segIdx].px + (pts[segIdx + 1].px - pts[segIdx].px) * f;
      const gy = pts[segIdx].py + (pts[segIdx + 1].py - pts[segIdx].py) * f;
      ctx.fillStyle = topo.good ? PALETTE.ochreBright : "#FFFFFF";
      ctx.beginPath();
      ctx.arc(gx, gy, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const { draw } = loop(canvas, render);

  const triggerReplay = () => {
    animStart = lastT;
    dirty = true;
    draw();
  };

  $$(".path-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeId = btn.dataset.topo;
      syncText();
      triggerReplay();
    });
  });

  $("#btn-replay-path")?.addEventListener("click", triggerReplay);
  syncText();
  draw();
}

// =============================================================================
// 03 节：五把尺通道开关
// =============================================================================
function initLeversLab() {
  const specimen = $("#lever-specimen");
  const diagBox = $("#lever-diag");
  if (!specimen || !diagBox) return;

  const active = new Set();

  function render() {
    $$(".lever-switch").forEach((btn) => {
      const id = btn.dataset.lever;
      const on = active.has(id);
      btn.setAttribute("aria-pressed", String(on));
      const pill = $(".lv-pill", btn);
      if (pill) pill.textContent = on ? "开" : "关";
      specimen.dataset[id] = on ? "1" : "0";
    });

    const res = evaluateLevers(active);
    diagBox.className = `lever-diagnosis is-${res.status}`;
    const set = (s, v) => { const n = $(s); if (n) n.textContent = v; };
    set("#ld-badge", res.badge);
    set("#ld-title", res.title);
    set("#ld-detail", res.detail);
  }

  $$(".lever-switch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.lever;
      if (active.has(id)) active.delete(id);
      else active.add(id);
      render();
    });
  });

  $("#lever-preset-0")?.addEventListener("click", () => {
    active.clear();
    render();
  });
  $("#lever-preset-3")?.addEventListener("click", () => {
    active.clear();
    ["area", "scale", "color"].forEach((k) => active.add(k));
    render();
  });
  $("#lever-preset-5")?.addEventListener("click", () => {
    ["area", "scale", "space", "color", "pos"].forEach((k) => active.add(k));
    render();
  });

  render();
}

// =============================================================================
// 04 节：原海报四类应用骨架透视切换
// =============================================================================
function initArchetypes() {
  const grid = $("#archetype-grid");
  if (!grid) return;

  $$(".xray-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.xray;
      grid.dataset.view = v;
      $$(".xray-btn").forEach((b) => {
        const on = b.dataset.xray === v;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
    });
  });
}

// =============================================================================
// 06 节：什么时候别用层级网格（4 组反例 SVG 对照）
// =============================================================================
function initAntiCases() {
  const badWrap = $("#anti-svg-bad");
  const goodWrap = $("#anti-svg-good");
  if (!badWrap || !goodWrap) return;

  function buildSvg(blocks, isBad) {
    const rects = blocks.map((b) => {
      const fill = isBad
        ? (b.accent ? PALETTE.coral : "#1a3b2e")
        : "#214b3b";
      const stroke = isBad && b.accent ? "#FFFFFF" : "rgba(239, 229, 214, 0.45)";
      const textCol = isBad && b.accent ? PALETTE.forestDeep : PALETTE.oatmealBright;
      return `
        <g>
          <rect x="${b.x}%" y="${b.y}%" width="${b.w}%" height="${b.h}%" fill="${fill}" stroke="${stroke}" stroke-width="1.2" rx="2"/>
          <text x="${b.x + b.w / 2}%" y="${b.y + b.h / 2}%" fill="${textCol}" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="middle" font-family="Noto Sans SC, sans-serif">${b.label}</text>
        </g>`;
    }).join("");
    return `<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">${rects}</svg>`;
  }

  function show(id) {
    const item = ANTI_CASES.find((c) => c.id === id) || ANTI_CASES[0];
    $$(".anti-tab").forEach((btn) => {
      const act = btn.dataset.anti === item.id;
      btn.classList.toggle("is-active", act);
      btn.setAttribute("aria-selected", String(act));
    });
    badWrap.innerHTML = buildSvg(item.badBlocks, true);
    goodWrap.innerHTML = buildSvg(item.goodBlocks, false);
    $("#anti-bad-title").textContent = item.badTitle;
    $("#anti-bad-desc").textContent = item.badDesc;
    const link = $("#anti-better-link");
    if (link) {
      link.textContent = item.betterName;
      link.href = item.betterUrl;
    }
    $("#anti-good-title").textContent = `改用「${item.betterName}」`;
    $("#anti-good-desc").textContent = item.betterDesc;
  }

  $$(".anti-tab").forEach((btn) => {
    btn.addEventListener("click", () => show(btn.dataset.anti));
  });
  show("catalog");
}

// =============================================================================
// 07 节：挑一挑小练习（四选项同色同字族，仅变面积比例；选中前隐去百分比避免泄题）
// =============================================================================
function initQuiz() {
  const grid = $("#quiz-grid");
  const fb = $("#quiz-feedback");
  if (!grid || !fb) return;

  let pickedId = null;

  const fillByK = {
    A: PALETTE.coral,
    B: PALETTE.oatmealFrame,
    C: PALETTE.ochre,
    D: "#0b2a1f",
  };
  const inkByK = {
    A: PALETTE.forestDeep,
    B: PALETTE.forestDeep,
    C: PALETTE.forestDeep,
    D: PALETTE.oatmeal,
  };

  function render() {
    grid.innerHTML = "";
    QUIZ_OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.opt = opt.id;
      if (pickedId === opt.id) {
        btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-err");
      }
      btn.setAttribute("aria-pressed", String(pickedId === opt.id));

      const revealed = pickedId !== null;
      const svgRects = opt.rects.map((r) => {
        const x = (r.x * 200).toFixed(1);
        const y = (r.y * 175).toFixed(1);
        const w = (r.w * 200).toFixed(1);
        const h = (r.h * 175).toFixed(1);
        const cx = ((r.x + r.w / 2) * 200).toFixed(1);
        const cy = ((r.y + r.h / 2) * 175).toFixed(1);
        const showSub = r.w * 200 > 46 && r.h * 175 > 24;
        const inlineSub = !showSub && r.w * 200 > 110 && r.h * 175 >= 9.5;
        const txt = revealed ? `${r.k} ${r.pct}` : r.k;
        const fullInline = inlineSub ? `${txt} · ${r.name}` : txt;
        return `
          <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fillByK[r.k]}" stroke="rgba(2,26,17,0.35)" stroke-width="0.9"/>
          <text x="${cx}" y="${showSub ? Number(cy) - 5 : cy}" fill="${inkByK[r.k]}" font-size="${inlineSub ? 8.5 : r.k === "A" ? 13 : 11}" font-weight="700" text-anchor="middle" dominant-baseline="middle" font-family="IBM Plex Mono, Noto Sans SC, monospace">${fullInline}</text>
          ${showSub ? `<text x="${cx}" y="${Number(cy) + 8}" fill="${inkByK[r.k]}" font-size="9" font-weight="600" text-anchor="middle" dominant-baseline="middle" font-family="Noto Sans SC, sans-serif">${r.name}</text>` : ""}
        `;
      }).join("");

      btn.innerHTML = `
        <div class="quiz-mini">
          <svg viewBox="0 0 200 175" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${svgRects}</svg>
        </div>
        <div class="quiz-card-foot">
          <span class="quiz-opt-name">${opt.label}</span>
          <span class="quiz-opt-pct">${revealed ? opt.pctText : "点击检验"}</span>
        </div>
      `;

      btn.addEventListener("click", () => {
        pickedId = opt.id;
        fb.textContent = `${opt.label}（${opt.pctText}）— ${opt.feedback}`;
        fb.className = `quiz-feedback ${opt.correct ? "is-ok" : "is-err"}`;
        render();
      });

      grid.appendChild(btn);
    });
  }

  render();
}

// =============================================================================
// 原海报放大灯箱（复用 #poster.src，支持拖动平移、滚轮/按钮缩放、Esc 关闭）
// =============================================================================
function initPosterLightbox() {
  const trigger = $("#poster-trigger");
  const posterImg = $("#poster");
  const lb = $("#lightbox");
  const lbImg = $("#lb-img");
  const stage = $("#lb-stage");
  const scaleEl = $("#lb-scale");
  if (!trigger || !posterImg || !lb || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (scaleEl) scaleEl.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    $("#lb-close")?.focus();
  }

  function close() {
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  $("#lb-close")?.addEventListener("click", close);
  $("#lb-reset")?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });
  $("#lb-zoom-in")?.addEventListener("click", () => { scale = clamp(scale + 0.25, 0.6, 3.2); applyTransform(); });
  $("#lb-zoom-out")?.addEventListener("click", () => { scale = clamp(scale - 0.25, 0.6, 3.2); applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 0.16 : -0.16;
    scale = clamp(scale + dir, 0.6, 3.2);
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage && scale <= 1.02) {
      close();
      return;
    }
    drag = { x: e.clientX - tx, y: e.clientY - ty, id: e.pointerId };
    stage.classList.add("is-dragging");
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  const endPan = () => {
    drag = null;
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// =============================================================================
// 启动全部模块
// =============================================================================
syncHeroDOM();
const heroCanvasCtl = initHeroCanvas();
bindHeroControls(heroCanvasCtl);
initSquintLab();
initPathLab();
initLeversLab();
initArchetypes();
initAntiCases();
initQuiz();
initPosterLightbox();
