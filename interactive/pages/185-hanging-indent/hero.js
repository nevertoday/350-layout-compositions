// 开场互动舞台：Word / InDesign 式通栏双游标标尺（▽ 首行缩进 / △ 左缩进）+ 1:1 实测对齐词条版
// 2D Canvas 实时渲染：1 em 严格等于实际字号像素，按 ctx.measureText 实测「圆点/编号 + 词头 + 间隔」宽度，
// 续行与释义首字像素级对齐，虚线画在间隔里绝不压字；无 WebGL 依赖，软件渲染稳跑 60 fps。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, PRESETS, RULER_MAX_EM, RULER_MIN_EM } from "./model.js";

const COL = {
  bg: "#0e031d",
  rulerBg: "#17072e",
  marginBg: "rgba(251, 102, 91, 0.08)",
  cream: "#f4e9d4",
  creamSoft: "#d4c7b4",
  tickTxt: "#e4d7c1",
  rulerHint: "#d8cbb8",
  lime: "#c3d142",
  limeDim: "rgba(195, 209, 66, 0.42)",
  limeSoft: "rgba(195, 209, 66, 0.14)",
  coral: "#fb665b",
  coralSoft: "rgba(251, 102, 91, 0.15)",
  coralDim: "rgba(251, 102, 91, 0.55)",
};

function pushMerged(line, seg) {
  const prev = line[line.length - 1];
  if (
    prev &&
    prev.font === seg.font &&
    prev.color === seg.color &&
    prev.role === seg.role &&
    seg.role !== "marker" &&
    seg.role !== "gap"
  ) {
    prev.text += seg.text;
    prev.w += seg.w;
  } else {
    line.push(seg);
  }
}

function wrapStyledTokens(ctx, tokens, firstW, restW, measureCache) {
  const measure = (font, str) => {
    const key = font + "\0" + str;
    let w = measureCache.get(key);
    if (w === undefined) {
      ctx.font = font;
      w = ctx.measureText(str).width;
      measureCache.set(key, w);
    }
    return w;
  };

  const lines = [];
  let cur = [];
  let curW = 0;
  let maxW = Math.max(64, firstW);

  const pushLine = () => {
    lines.push(cur);
    cur = [];
    curW = 0;
    maxW = Math.max(64, restW);
  };

  for (const tok of tokens) {
    if (tok.role === "gap") {
      cur.push({ text: "", font: tok.font, color: tok.color, role: "gap", w: tok.w });
      curW += tok.w;
      continue;
    }
    const pieces = tok.atomic ? [tok.text] : tok.text.match(/[A-Za-z0-9.,:;()[\]/'-]+\s*|[^\s]/g) || [tok.text];
    for (const raw of pieces) {
      const text = cur.length === 0 ? raw.replace(/^\s+/, "") : raw;
      if (!text) continue;
      const w = tok.fixedW ?? measure(tok.font, text);
      const isClosePunct = /^[，。、；：！？）》】.,;:!?)]$/.test(text);
      if (cur.length > 0 && curW + w > maxW && !isClosePunct) {
        pushLine();
        const trimmed = text.replace(/^\s+/, "");
        if (!trimmed) continue;
        const tw = measure(tok.font, trimmed);
        pushMerged(cur, { text: trimmed, font: tok.font, color: tok.color, role: tok.role, w: tw });
        curW = tw;
      } else {
        pushMerged(cur, { text, font: tok.font, color: tok.color, role: tok.role, w });
        curW += w;
      }
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

export function createHero(canvas, stageEl, state, onLayout) {
  const ctx = canvas.getContext("2d");
  const rulerCanvas = document.createElement("canvas");
  const rulerCtx = rulerCanvas.getContext("2d");
  const measureCache = new Map();
  let cssW = 720;
  let cssH = 440;
  let dpr = 1;
  let rulerCacheKey = "";

  // 平滑动画与按需重绘状态
  let shownFirst = state.firstEm;
  let shownRest = reducedMotion.matches ? state.restEm : state.firstEm;
  let scanPhase = reducedMotion.matches ? -1 : 0;
  let introTimer = 0;
  let introDone = reducedMotion.matches;
  let dirty = true;
  let lastKey = "";
  let lastGeom = null;

  const measureText = (font, str) => {
    const key = font + "\0" + str;
    let w = measureCache.get(key);
    if (w === undefined) {
      ctx.font = font;
      w = ctx.measureText(str).width;
      measureCache.set(key, w);
    }
    return w;
  };

  function isLandscapePhone() {
    return window.innerHeight <= 460 && window.innerWidth >= 600;
  }

  function getTypography(width = cssW) {
    const landscape = isLandscapePhone();
    const compact = !landscape && width < 470;
    const baseFont = landscape ? 13.5 : compact ? 15 : width >= 720 ? 18.5 : 16.5;
    const emPx = baseFont; // 1 em 严格等于 1 × 字号像素
    const lineH = Math.round(baseFont * (landscape ? 1.5 : compact ? 1.66 : 1.62));
    const padL = compact ? 12 : landscape ? 16 : 22;
    const padR = compact ? 14 : 22;
    // 左侧留出 1.5 em 页边距灰带（对应 Word / InDesign 标尺 0 刻度左侧区域）
    const zeroX = Math.round(padL + Math.abs(RULER_MIN_EM) * emPx);
    const rightEdge = width - padR;
    const measureEm = Math.max(14, (rightEdge - zeroX) / emPx);
    const maxMarkerEm = Math.min(RULER_MAX_EM, Math.max(5.5, measureEm - 9));

    const headerH = landscape ? 22 : 26;
    const railTopY = headerH + (landscape ? 10 : 12);
    const scaleTopY = headerH + (landscape ? 22 : 24);
    const scaleBotY = scaleTopY + (landscape ? 18 : 20);
    const railBotY = scaleBotY + (landscape ? 11 : 13);
    const rulerBottom = railBotY + (landscape ? 12 : 14);
    const textTop = rulerBottom + (landscape ? 10 : compact ? 13 : 15);
    const gapAfter = landscape ? 8 : compact ? 11 : 14;
    const bottomPad = landscape ? 22 : compact ? 24 : 26;
    const maxEntries = landscape ? 2 : compact ? 3 : 99;

    return {
      landscape,
      compact,
      baseFont,
      emPx,
      lineH,
      padL,
      padR,
      zeroX,
      rightEdge,
      measureEm,
      maxMarkerEm,
      headerH,
      railTopY,
      scaleTopY,
      scaleBotY,
      railBotY,
      rulerBottom,
      textTop,
      gapAfter,
      bottomPad,
      maxEntries,
    };
  }

  // 按当前字体实测每个预设的「圆点/编号 + 词头」宽度与「释义首字」起点
  function measurePreset(presetId, typo = getTypography()) {
    const preset = PRESETS[presetId] || PRESETS.poster;
    const { baseFont, emPx, measureEm, maxMarkerEm } = typo;
    const headFont = `700 ${baseFont}px "Noto Sans SC", sans-serif`;
    const markerFont = `600 ${Math.round(baseFont * 0.9)}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    const dotR = baseFont * 0.31;
    const dotSlotW = dotR * 2 + baseFont * 0.48;
    const gapPx = preset.gapEm * emPx;

    let sumHeadEnd = 0;
    let maxHeadEnd = 0;
    for (const entry of preset.entries) {
      let w = 0;
      if (entry.marker === "●") {
        w += dotSlotW;
      } else if (entry.marker) {
        w += measureText(markerFont, entry.marker);
      }
      if (entry.head) {
        w += measureText(headFont, entry.head);
      }
      sumHeadEnd += w;
      if (w > maxHeadEnd) maxHeadEnd = w;
    }

    const headEndPx = preset.alignMode === "exact" ? maxHeadEnd : sumHeadEnd / Math.max(1, preset.entries.length);
    const bodyStartPx = headEndPx + gapPx;
    const headEndEm = Math.round((headEndPx / emPx) * 100) / 100;
    const alignEm =
      preset.alignMode === "exact"
        ? Math.round((bodyStartPx / emPx) * 10) / 10
        : preset.normHangEm;

    return {
      headEndPx,
      gapPx,
      bodyStartPx,
      headEndEm,
      alignEm: clamp(alignEm, 1.5, maxMarkerEm - 0.5),
      measureEm: Math.round(measureEm * 10) / 10,
      maxMarkerEm: Math.round(maxMarkerEm * 10) / 10,
      dotR,
      dotSlotW,
    };
  }

  function layoutEntries(typo, metrics, preset, firstX, restX) {
    const { baseFont, lineH, rightEdge, textTop, gapAfter, maxEntries } = typo;
    const bodyFont = `400 ${baseFont}px "Noto Sans SC", sans-serif`;
    const bodyLeadFont = `700 ${baseFont}px "Noto Sans SC", sans-serif`;
    const headFont = `700 ${baseFont}px "Noto Sans SC", sans-serif`;
    const markerFont = `600 ${Math.round(baseFont * 0.9)}px "IBM Plex Mono", "Noto Sans SC", monospace`;

    const firstAvailW = Math.max(96, rightEdge - firstX - 4);
    const restAvailW = Math.max(76, rightEdge - restX - 4);

    const laidOut = [];
    let curY = textTop;
    const count = Math.min(preset.entries.length, maxEntries);

    for (let idx = 0; idx < count; idx++) {
      const entry = preset.entries[idx];
      const tokens = [];
      let entryPrefixW = 0;

      if (entry.marker === "●") {
        tokens.push({
          text: "●",
          font: markerFont,
          color: COL.coral,
          role: "marker",
          atomic: true,
          fixedW: metrics.dotSlotW,
        });
        entryPrefixW += metrics.dotSlotW;
      } else if (entry.marker) {
        const mw = measureText(markerFont, entry.marker);
        tokens.push({
          text: entry.marker,
          font: markerFont,
          color: COL.coral,
          role: "marker",
          atomic: true,
          fixedW: mw,
        });
        entryPrefixW += mw;
      }

      if (entry.head) {
        const hw = measureText(headFont, entry.head);
        tokens.push({
          text: entry.head,
          font: headFont,
          color: COL.cream,
          role: "head",
          atomic: true,
          fixedW: hw,
        });
        entryPrefixW += hw;
      }

      const gapW =
        preset.alignMode === "exact"
          ? Math.max(metrics.gapPx * 0.5, metrics.bodyStartPx - entryPrefixW)
          : metrics.gapPx;
      tokens.push({ text: "", font: bodyFont, color: COL.creamSoft, role: "gap", w: gapW });

      if (entry.bodyLead) {
        tokens.push({
          text: entry.bodyLead + (entry.bodyLead.endsWith("：") ? "" : " "),
          font: bodyLeadFont,
          color: COL.cream,
          role: "lead",
          atomic: true,
        });
      }

      tokens.push({
        text: entry.body,
        font: bodyFont,
        color: COL.creamSoft,
        role: "body",
        atomic: false,
      });

      const lines = wrapStyledTokens(ctx, tokens, firstAvailW, restAvailW, measureCache);
      const blockH = lines.length * lineH;
      laidOut.push({ idx, entry, lines, y: curY, h: blockH });
      curY += blockH + gapAfter;
    }

    const contentTop = laidOut.length ? laidOut[0].y - 4 : textTop;
    const contentBottom = laidOut.length
      ? laidOut[laidOut.length - 1].y + laidOut[laidOut.length - 1].h + 3
      : textTop + 120;
    const neededH = Math.ceil(contentBottom + typo.bottomPad);

    return { laidOut, contentTop, contentBottom, neededH, firstAvailW };
  }

  let lastObservedW = 0;

  function fitHeight(force = false) {
    if (state.dragging && !force) return;
    const r = stageEl.getBoundingClientRect();
    const w = Math.max(280, Math.round(r.width));
    cssW = w;
    const typo = getTypography(w);
    const preset = PRESETS[state.preset] || PRESETS.poster;
    const metrics = measurePreset(state.preset, typo);
    const useFirst = state.userTouched ? state.firstEm : 0;
    const useRest = state.userTouched ? state.restEm : metrics.alignEm;
    const firstX = typo.zeroX + useFirst * typo.emPx;
    const restX = typo.zeroX + useRest * typo.emPx;
    const { neededH } = layoutEntries(typo, metrics, preset, firstX, restX);
    const nextH = Math.max(196, neededH);

    if (Math.abs(nextH - cssH) > 1 || Math.round(r.height) !== nextH) {
      cssH = nextH;
      stageEl.style.height = `${nextH}px`;
    }
    dpr = pixelRatio(cssW < 500 ? 1.5 : 2);
    const targetCW = Math.round(cssW * dpr);
    const targetCH = Math.round(cssH * dpr);
    if (canvas.width !== targetCW || canvas.height !== targetCH) {
      canvas.width = targetCW;
      canvas.height = targetCH;
    }
    dirty = true;
  }

  function resize() {
    const r = stageEl.getBoundingClientRect();
    const w = Math.max(280, Math.round(r.width));
    if (w !== lastObservedW) {
      lastObservedW = w;
      measureCache.clear();
      rulerCacheKey = "";
    }
    fitHeight(false);
  }

  function triggerScan() {
    dirty = true;
    if (reducedMotion.matches) {
      scanPhase = 0.45;
      ctl.draw();
      return;
    }
    scanPhase = 0.001;
    ctl.draw();
  }

  function drawFrame(_t, dt, { still }) {
    const key = `${state.preset}|${state.firstEm}|${state.restEm}|${state.showGrid}|${cssW}|${cssH}`;
    if (key !== lastKey) {
      lastKey = key;
      dirty = true;
    }

    let animating = false;
    if (still) {
      shownFirst = state.firstEm;
      shownRest = state.restEm;
      introDone = true;
    } else {
      if (!introDone) {
        animating = true;
        introTimer += dt;
        if (state.userTouched) {
          introDone = true;
        } else if (introTimer > 0.16) {
          const k = 1 - Math.exp(-dt * 9);
          shownFirst += (state.firstEm - shownFirst) * k;
          shownRest += (state.restEm - shownRest) * k;
          if (Math.abs(shownRest - state.restEm) < 0.015 && Math.abs(shownFirst - state.firstEm) < 0.015) {
            shownFirst = state.firstEm;
            shownRest = state.restEm;
            introDone = true;
            scanPhase = 0.001;
          }
        }
      }
      if (introDone) {
        const speed = state.dragging ? 36 : 16;
        const k = dt > 0 ? 1 - Math.exp(-dt * speed) : 1;
        if (Math.abs(shownFirst - state.firstEm) > 0.003) {
          animating = true;
          shownFirst += (state.firstEm - shownFirst) * k;
          if (Math.abs(shownFirst - state.firstEm) < 0.004) shownFirst = state.firstEm;
        }
        if (Math.abs(shownRest - state.restEm) > 0.003) {
          animating = true;
          shownRest += (state.restEm - shownRest) * k;
          if (Math.abs(shownRest - state.restEm) < 0.004) shownRest = state.restEm;
        }
      }
      if (scanPhase > 0) {
        animating = true;
        scanPhase += dt * 0.62;
        if (scanPhase >= 1.15) scanPhase = -1;
      }
    }

    if (!still && !animating && !dirty) return;
    dirty = false;

    const typo = getTypography(cssW);
    const {
      landscape,
      compact,
      baseFont,
      emPx,
      lineH,
      padL,
      zeroX,
      rightEdge,
      headerH,
      railTopY,
      scaleTopY,
      scaleBotY,
      railBotY,
      rulerBottom,
      gapAfter,
    } = typo;
    const preset = PRESETS[state.preset] || PRESETS.poster;
    const metrics = measurePreset(state.preset, typo);

    const emToX = (em) => zeroX + em * emPx;
    const firstX = emToX(shownFirst);
    const restX = emToX(shownRest);
    const hangEm = shownRest - shownFirst;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深紫墨底 + 静态标尺底图（缓存至离屏画布，拖动每帧仅 1 次 drawImage，软件渲染稳 60fps）
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    const rulerEndX = Math.min(cssW, rightEdge + 10);
    const rKey = `${cssW}|${rulerBottom}|${dpr}|${state.preset}|${metrics.alignEm}`;
    if (rKey !== rulerCacheKey) {
      rulerCacheKey = rKey;
      rulerCanvas.width = Math.round(cssW * dpr);
      rulerCanvas.height = Math.round(rulerBottom * dpr);
      rulerCtx.save();
      rulerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rulerCtx.clearRect(0, 0, cssW, rulerBottom);

      rulerCtx.fillStyle = COL.rulerBg;
      rulerCtx.fillRect(0, 0, rulerEndX, rulerBottom);

      rulerCtx.fillStyle = COL.marginBg;
      rulerCtx.fillRect(0, scaleTopY, zeroX, rulerBottom - scaleTopY);

      rulerCtx.fillStyle = COL.rulerHint;
      rulerCtx.font = `500 ${compact || landscape ? 12 : 12.5}px "IBM Plex Mono", "Noto Sans SC", monospace`;
      rulerCtx.textAlign = "left";
      rulerCtx.textBaseline = "middle";
      const tightBar = cssW < 640;
      const infoLeft = compact
        ? "标尺 1em=字号 · 拖 ▽ 首行 / △ 续行"
        : tightBar
          ? "标尺 1em=字号 · 拖 ▽ 首行 / △ 左缩进"
          : "排版标尺（1 em = 字号）· 分别拖 ▽ 首行缩进 与 △ 左缩进";
      rulerCtx.fillText(infoLeft, padL, headerH * 0.52);

      if (!compact) {
        rulerCtx.fillStyle = COL.lime;
        rulerCtx.textAlign = "right";
        const alignHint =
          preset.alignMode === "exact"
            ? `${tightBar ? "词头对齐" : "实测词头对齐点"} ${metrics.alignEm.toFixed(1)} em`
            : `${tightBar ? "文献规范" : "文献规范悬挂"} ${metrics.alignEm.toFixed(1)} em`;
        rulerCtx.fillText(alignHint, rightEdge, headerH * 0.52);
      }

      rulerCtx.strokeStyle = "rgba(195, 209, 66, 0.34)";
      rulerCtx.lineWidth = 1;
      rulerCtx.beginPath();
      rulerCtx.moveTo(0, scaleTopY);
      rulerCtx.lineTo(rulerEndX, scaleTopY);
      rulerCtx.moveTo(0, scaleBotY);
      rulerCtx.lineTo(rulerEndX, scaleBotY);
      rulerCtx.moveTo(0, rulerBottom);
      rulerCtx.lineTo(rulerEndX, rulerBottom);
      if (rulerEndX < cssW - 1) {
        rulerCtx.moveTo(rulerEndX, 0);
        rulerCtx.lineTo(rulerEndX, rulerBottom);
      }
      rulerCtx.stroke();

      const maxTick = Math.floor((rightEdge - zeroX) / emPx);
      const labelStep = 2;
      const scaleMidY = (scaleTopY + scaleBotY) * 0.5 + 0.5;

      rulerCtx.strokeStyle = "rgba(195, 209, 66, 0.3)";
      rulerCtx.lineWidth = 1;
      rulerCtx.beginPath();
      for (let tk = -1; tk <= maxTick; tk++) {
        if (tk === 0 || (tk >= 0 && tk % labelStep === 0)) continue;
        const tx = emToX(tk);
        if (tx < padL - 2 || tx > rightEdge + 2) continue;
        rulerCtx.moveTo(tx, scaleTopY);
        rulerCtx.lineTo(tx, scaleTopY + 3);
        rulerCtx.moveTo(tx, scaleBotY);
        rulerCtx.lineTo(tx, scaleBotY - 3);
      }
      rulerCtx.stroke();

      rulerCtx.strokeStyle = "rgba(244, 233, 212, 0.6)";
      rulerCtx.lineWidth = 1;
      rulerCtx.beginPath();
      for (let tk = labelStep; tk <= maxTick; tk += labelStep) {
        const tx = emToX(tk);
        if (tx < padL - 2 || tx > rightEdge + 2) continue;
        rulerCtx.moveTo(tx, scaleTopY);
        rulerCtx.lineTo(tx, scaleTopY + 4);
        rulerCtx.moveTo(tx, scaleBotY);
        rulerCtx.lineTo(tx, scaleBotY - 4);
      }
      rulerCtx.stroke();

      rulerCtx.strokeStyle = COL.coral;
      rulerCtx.lineWidth = 1.8;
      rulerCtx.beginPath();
      rulerCtx.moveTo(zeroX, scaleTopY);
      rulerCtx.lineTo(zeroX, scaleTopY + 5);
      rulerCtx.moveTo(zeroX, scaleBotY);
      rulerCtx.lineTo(zeroX, scaleBotY - 5);
      rulerCtx.stroke();

      rulerCtx.font = `600 12px "IBM Plex Mono", monospace`;
      rulerCtx.textAlign = "center";
      rulerCtx.textBaseline = "middle";
      rulerCtx.fillStyle = COL.coral;
      rulerCtx.fillText("0", zeroX, scaleMidY);
      rulerCtx.fillStyle = COL.tickTxt;
      for (let tk = labelStep; tk <= maxTick - 1; tk += labelStep) {
        const tx = emToX(tk);
        if (tx < padL - 2 || tx > rightEdge + 2) continue;
        rulerCtx.fillText(String(tk), tx, scaleMidY);
      }
      rulerCtx.restore();
    }

    ctx.drawImage(rulerCanvas, 0, 0, cssW, rulerBottom);

    // ▽ 与 △ 之间的高亮跨度带（悬挂为酸柠绿，首行缩进为珊瑚红）
    if (Math.abs(restX - firstX) > 1.5) {
      const spanL = Math.min(firstX, restX);
      const spanW = Math.abs(restX - firstX);
      ctx.fillStyle = hangEm >= 0 ? "rgba(195, 209, 66, 0.22)" : "rgba(251, 102, 91, 0.24)";
      ctx.fillRect(spanL, scaleTopY + 1, spanW, scaleBotY - scaleTopY - 2);
    }

    // 实测最佳对齐点标记（下刻度缘上的酸柠小菱标）
    const alignTickX = emToX(shownFirst + metrics.alignEm);
    if (alignTickX < rightEdge - 8) {
      ctx.fillStyle = COL.lime;
      ctx.beginPath();
      ctx.moveTo(alignTickX, scaleBotY - 4);
      ctx.lineTo(alignTickX + 4, scaleBotY);
      ctx.lineTo(alignTickX, scaleBotY + 4);
      ctx.lineTo(alignTickX - 4, scaleBotY);
      ctx.closePath();
      ctx.fill();
    }

    // ---------- 4. 真实排印折行（复用 layoutEntries，画布高度与实际行数严丝合缝） ----------
    const { laidOut, contentTop, contentBottom } = layoutEntries(typo, metrics, preset, firstX, restX);

    // ---------- 5. 垂直导轨与检索走廊（虚线画在间隔里，绝不压字） ----------
    const isExactAligned =
      preset.alignMode === "exact" && Math.abs(hangEm - metrics.alignEm) <= 0.18;
    const isIntruding =
      preset.alignMode === "exact" && hangEm > 0.25 && hangEm < metrics.headEndEm - 0.1;

    // 续行虚线位置：精确对齐时放在词头与释义间隔正中偏右（绝不碰词头也不碰释义首字）；自由拖动时放在续行首字左缘 3px 处
    const restGuideX = isExactAligned
      ? Math.round(firstX + metrics.headEndPx + metrics.gapPx * 0.55)
      : Math.round(restX - 3);
    const firstGuideX = Math.round(firstX - 6);

    ctx.save();
    // 走廊着色
    if (hangEm > 0.25) {
      if (isIntruding) {
        ctx.fillStyle = COL.coralSoft;
        ctx.fillRect(firstGuideX, contentTop, Math.max(0, restGuideX - firstGuideX), contentBottom - contentTop);
      } else {
        const alpha = state.showGrid ? 0.14 : 0.06;
        ctx.fillStyle = `rgba(195, 209, 66, ${alpha})`;
        ctx.fillRect(firstGuideX, contentTop, Math.max(0, restGuideX - firstGuideX), contentBottom - contentTop);
      }
    } else if (hangEm < -0.25 && state.showGrid) {
      ctx.fillStyle = COL.coralSoft;
      ctx.fillRect(restX - 5, contentTop, Math.max(0, firstX - restX + 2), contentBottom - contentTop);
    }

    // 从 0 基线垂落的淡参考线（当首行拖离 0 时能看见页边距）
    if (Math.abs(shownFirst) > 0.15) {
      ctx.strokeStyle = "rgba(251, 102, 91, 0.26)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(zeroX, rulerBottom);
      ctx.lineTo(zeroX, contentBottom + 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 首行实线基准（从标尺 ▽ 垂直贯通下来）
    ctx.strokeStyle = state.showGrid ? COL.coral : "rgba(251, 102, 91, 0.55)";
    ctx.lineWidth = state.showGrid ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(firstGuideX, rulerBottom);
    ctx.lineTo(firstGuideX, contentBottom + 10);
    ctx.stroke();

    ctx.fillStyle = COL.coral;
    ctx.beginPath();
    ctx.arc(firstGuideX, contentBottom + 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // 续行虚线基准（与 ▽ 错开时显示；精确对齐型落入空隙，参考文献型避让每条首行词头不压字）
    if (Math.abs(hangEm) >= 0.12) {
      const dashX = hangEm > 0 ? restGuideX : firstX - 3;
      const skipFirstLine = preset.alignMode !== "exact" && hangEm > 0;
      ctx.strokeStyle = hangEm > 0 && !isIntruding ? COL.lime : COL.coral;
      ctx.lineWidth = state.showGrid ? 1.5 : 1.15;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      if (skipFirstLine) {
        // 标尺底部到首条前一小段
        ctx.moveTo(dashX, rulerBottom);
        ctx.lineTo(dashX, Math.max(rulerBottom, contentTop));
        for (const item of laidOut) {
          if (item.lines.length > 1) {
            ctx.moveTo(dashX, item.y + lineH + 2);
            ctx.lineTo(dashX, item.y + item.h + 2);
          }
        }
      } else {
        ctx.moveTo(dashX, rulerBottom);
        ctx.lineTo(dashX, contentBottom + 10);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 底部尺寸标注（≥12px 亮色）
      const dimY = contentBottom + 10;
      const xA = Math.min(firstGuideX, dashX);
      const xB = Math.max(firstGuideX, dashX);
      ctx.strokeStyle = hangEm > 0 && !isIntruding ? COL.lime : COL.coral;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xA + 4, dimY);
      ctx.lineTo(xB, dimY);
      ctx.stroke();

      ctx.fillStyle = hangEm > 0 && !isIntruding ? COL.lime : COL.coral;
      ctx.font = `600 12px "IBM Plex Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let dimText = "";
      if (hangEm < 0) {
        dimText = `首行内缩 ${Math.abs(hangEm).toFixed(1)}em（反方向）`;
      } else if (isIntruding) {
        dimText = `悬挂 +${hangEm.toFixed(1)}em（小于词头 ${metrics.headEndEm.toFixed(1)}em）`;
      } else if (isExactAligned) {
        dimText = `悬挂 +${hangEm.toFixed(1)}em（对齐释义首字）`;
      } else {
        dimText = `悬挂 +${hangEm.toFixed(1)}em`;
      }
      ctx.fillText(dimText, Math.min(xB + 8, rightEdge - 195), dimY);
    } else {
      ctx.fillStyle = COL.tickTxt;
      ctx.font = `600 12px "IBM Plex Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("0.0em · 齐左无缩进", firstGuideX + 10, contentBottom + 10);
    }
    ctx.restore();

    // ---------- 6. 绘制条目正文与点状分隔线（扫描仅高亮词头格或整行柔光，缓入缓出，无硬边截断） ----------
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const smoothstep = (e0, e1, x) => {
      const t = clamp((x - e0) / (e1 - e0), 0, 1);
      return t * t * (3 - 2 * t);
    };
    const scanEnv =
      scanPhase > 0
        ? smoothstep(0, 0.12, scanPhase) * (1 - smoothstep(0.9, 1.12, scanPhase))
        : 0;
    const scanY =
      scanPhase > 0 ? contentTop + clamp(scanPhase, 0, 1) * (contentBottom - contentTop) : -999;
    const canCellHighlight =
      preset.alignMode === "exact" && hangEm >= metrics.headEndEm - 0.05 && !isIntruding;

    for (let i = 0; i < laidOut.length; i++) {
      const item = laidOut[i];
      const headMidY = item.y + lineH * 0.48;
      const rawHit = scanEnv > 0 ? clamp(1 - Math.abs(scanY - headMidY) / (lineH * 1.18), 0, 1) : 0;
      const easeHit = rawHit * rawHit * (3 - 2 * rawHit) * scanEnv;

      if (easeHit > 0.02) {
        if (canCellHighlight) {
          // 只轻亮左侧词头那一格（严格限定在走廊边界内，绝不漫入释义半截）
          const cellX = firstGuideX + 1;
          const cellW = Math.max(0, restGuideX - firstGuideX - 2);
          ctx.fillStyle = `rgba(195, 209, 66, ${(easeHit * 0.22).toFixed(3)})`;
          ctx.fillRect(cellX, item.y - 1, cellW, lineH + 1);
        } else {
          // 变长姓氏或齐左模式：整条首行缓入柔光，右侧平滑淡出，不在句中硬切
          const rowGrad = ctx.createLinearGradient(firstGuideX, 0, rightEdge, 0);
          rowGrad.addColorStop(0, `rgba(195, 209, 66, ${(easeHit * 0.16).toFixed(3)})`);
          rowGrad.addColorStop(0.78, `rgba(195, 209, 66, ${(easeHit * 0.08).toFixed(3)})`);
          rowGrad.addColorStop(1, "rgba(195, 209, 66, 0)");
          ctx.fillStyle = rowGrad;
          ctx.fillRect(firstGuideX + 1, item.y - 1, Math.max(0, rightEdge - firstGuideX - 1), lineH + 1);
        }
      }

      for (let li = 0; li < item.lines.length; li++) {
        const line = item.lines[li];
        const baselineY = item.y + (li + 1) * lineH - Math.round(lineH * 0.26);
        let penX = li === 0 ? firstX : restX;

        if (state.showGrid && li === 0 && hangEm > 0.35 && !isIntruding) {
          ctx.fillStyle = COL.lime;
          ctx.fillRect(firstGuideX - 5, item.y + 4, 3, lineH - 8);
        }

        for (const seg of line) {
          if (seg.role === "gap") {
            penX += seg.w;
          } else if (seg.role === "marker" && seg.text === "●") {
            const r = metrics.dotR;
            ctx.fillStyle = COL.coral;
            ctx.beginPath();
            ctx.arc(penX + r, baselineY - baseFont * 0.34, r, 0, Math.PI * 2);
            ctx.fill();
            penX += seg.w;
          } else {
            ctx.font = seg.font;
            ctx.fillStyle =
              easeHit > 0.3 && (seg.role === "head" || seg.role === "marker")
                ? COL.lime
                : seg.color;
            ctx.fillText(seg.text, penX, baselineY);
            penX += seg.w;
          }
        }
      }

      if (i < laidOut.length - 1) {
        const sepY = item.y + item.h + Math.round(gapAfter * 0.5);
        ctx.save();
        ctx.strokeStyle = COL.limeDim;
        ctx.lineWidth = 1;
        ctx.setLineDash([1.5, 4]);
        ctx.beginPath();
        ctx.moveTo(Math.min(firstX, restX), sepY);
        ctx.lineTo(rightEdge, sepY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 7. 视线扫描轨：严格沿左侧走廊边线（firstGuideX）竖向滑落，绝不横穿词头或正文
    if (scanEnv > 0.02) {
      const clampedScanY = clamp(scanY, contentTop, contentBottom);
      const tailTop = Math.max(contentTop, clampedScanY - 46);
      const vGrad = ctx.createLinearGradient(0, tailTop, 0, clampedScanY);
      vGrad.addColorStop(0, "rgba(195, 209, 66, 0)");
      vGrad.addColorStop(1, `rgba(195, 209, 66, ${(0.92 * scanEnv).toFixed(3)})`);
      ctx.strokeStyle = vGrad;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(firstGuideX, tailTop);
      ctx.lineTo(firstGuideX, clampedScanY);
      ctx.stroke();

      ctx.fillStyle = `rgba(195, 209, 66, ${(0.22 * scanEnv).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(firstGuideX, clampedScanY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(195, 209, 66, ${scanEnv.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(firstGuideX, clampedScanY, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const geom = {
      firstX,
      restX,
      railTopY,
      railBotY,
      scaleTopY,
      scaleBotY,
      rulerBottom,
      zeroX,
      emPx,
      maxMarkerEm: metrics.maxMarkerEm,
      metrics,
    };

    const changed =
      !lastGeom ||
      Math.abs(geom.firstX - lastGeom.firstX) > 0.25 ||
      Math.abs(geom.restX - lastGeom.restX) > 0.25 ||
      Math.abs(geom.railTopY - lastGeom.railTopY) > 0.25 ||
      Math.abs(geom.railBotY - lastGeom.railBotY) > 0.25 ||
      Math.abs(geom.metrics.alignEm - lastGeom.metrics.alignEm) > 0.02 ||
      Math.abs(geom.metrics.measureEm - lastGeom.metrics.measureEm) > 0.1;

    if (changed) {
      lastGeom = geom;
      if (onLayout) onLayout(geom);
    }
  }

  const ctl = loop(stageEl, drawFrame);
  const ro = new ResizeObserver(() => {
    const w = Math.max(280, Math.round(stageEl.getBoundingClientRect().width));
    if (w !== lastObservedW) {
      resize();
      ctl.draw();
    }
  });
  ro.observe(stageEl);
  window.addEventListener("resize", () => {
    resize();
    ctl.draw();
  });
  resize();
  ctl.draw();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measureCache.clear();
      rulerCacheKey = "";
      fitHeight(true);
      ctl.draw();
    });
  }

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    fitHeight: () => {
      fitHeight(true);
      ctl.draw();
    },
    markDirty: () => {
      dirty = true;
    },
    triggerScan,
    measurePreset: (id) => measurePreset(id),
    getGeom: () => lastGeom,
    setImmediate: (firstEm, restEm) => {
      shownFirst = firstEm;
      shownRest = restEm;
      introDone = true;
      fitHeight(true);
      dirty = true;
      ctl.draw();
    },
  };
}
