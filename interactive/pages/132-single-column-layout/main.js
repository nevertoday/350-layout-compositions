import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SPECIMENS, LIMITS, PRESETS, createInitialState, clampState, evaluate } from "./model.js";

// ==================== 132 原海报色板常量 ====================
const PAL = {
  paper: "#FBF3EA",
  paperBright: "#FDF9F4",
  paperLinen: "#F2E7D9",
  paperSlot: "#EAE0D2",
  rule: "#D6C9B8",
  rail: "#756F68",
  ink: "#0C0C0C",
  ink2: "#453F3A",
  inkMuted: "#5F5850",
  red: "#E0381A",
  redBtn: "#C82E12",
  redText: "#B0250C",
  redTint: "#FCEAE4",
  ok: "#1A6646",
  okTint: "#E5F3EC",
};

const F_CN = '"Noto Serif SC", "Songti SC", Georgia, serif';
const F_SANS = '"Archivo", "Noto Serif SC", sans-serif';
const F_MONO = '"Space Mono", ui-monospace, monospace';

// ==================== 工具函数 ====================
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// 缓存单字宽度，保证 4×/6× CPU 降速拖动依然 60fps
const charWidthCache = new Map();
function measureChar(ctx, font, ch) {
  let table = charWidthCache.get(font);
  if (!table) {
    table = new Map();
    charWidthCache.set(font, table);
  }
  let w = table.get(ch);
  if (w === undefined) {
    ctx.font = font;
    w = ctx.measureText(ch).width;
    table.set(ch, w);
  }
  return w;
}

// 真实逐字折行（遵循中文标点避头原则），返回每一行文本与真实像素宽
const NO_LINE_START = new Set("，。、；：！？）》」』·%°×");
function wrapText(ctx, text, maxW, font) {
  const safeMax = Math.max(24, maxW);
  const lines = [];
  let line = "";
  let lineW = 0;
  let charCount = 0;

  for (const ch of text) {
    const cw = measureChar(ctx, font, ch);
    if (line && lineW + cw > safeMax && !NO_LINE_START.has(ch)) {
      lines.push({ text: line, width: lineW, chars: charCount });
      line = ch;
      lineW = cw;
      charCount = 1;
    } else {
      line += ch;
      lineW += cw;
      charCount += 1;
    }
  }
  if (line) lines.push({ text: line, width: lineW, chars: charCount });
  return lines;
}

// ==================== 主角：活体双虚线栏轨 · 出版单栏排印台 ====================
function initHeroWorkbench() {
  const canvas = $("#hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const dom = {
    hudLine: $("#canvas-hud-line"),
    statusStamp: $("#hero-status-stamp"),
    verdictSheet: $("#verdict-sheet"),
    verdictTag: $("#verdict-tag"),
    verdictTitle: $("#verdict-title"),
    verdictBody: $("#verdict-body"),
    verdictHint: $("#verdict-hint"),
    btnStepFix: $("#btn-step-fix"),
    mChars: $("#m-chars"),
    mMargin: $("#m-margin"),
    mLeading: $("#m-leading"),
    mSweep: $("#m-sweep"),
    rangeWidth: $("#range-width"),
    outWidth: $("#out-width"),
    rangeLeading: $("#range-leading"),
    outLeading: $("#out-leading"),
    btnGaze: $("#btn-gaze"),
    btnReset: $("#btn-reset"),
    specTabs: $$(".spec-tab[data-specimen]"),
    modeBtns: $$(".seg-btn[data-mode]"),
    rhythmBtns: $$(".seg-btn[data-rhythm]"),
    presetBtns: $$(".preset-btn[data-preset]"),
    pillars: {
      vertical: { el: $("#pillar-vertical"), state: $("#state-vertical") },
      viewline: { el: $("#pillar-viewline"), state: $("#state-viewline") },
      narrative: { el: $("#pillar-narrative"), state: $("#state-narrative") },
    },
  };

  let state = createInitialState();
  let lastEval = null;
  let dirty = true;
  let introProgress = reducedMotion.matches ? 1 : 0;
  let gazeTime = 0;

  // 缓存画布命中区（用于指针直接拖拽栏轨、点击红卡清出侧栏）
  const hit = {
    W: 1200,
    H: 416,
    sheetX: 12,
    sheetW: 1176,
    leftX: 70,
    rightX: 1130,
    handleY: 208,
    sidebarRect: null,
    splitBadgeRect: null,
  };

  // 用于减少无效 DOM 写入（防止 60fps 拖动引起重排抖动）
  const prevText = new Map();
  function setText(el, val) {
    if (!el) return;
    if (prevText.get(el) !== val) {
      prevText.set(el, val);
      el.textContent = val;
    }
  }
  function setClass(el, cls) {
    if (!el) return;
    const key = { el, type: "cls" };
    if (el.className !== cls) el.className = cls;
    void key;
  }

  let canvasCssW = 0;
  let canvasCssH = 0;
  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const dpr = pixelRatio(2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph || canvasCssW !== w || canvasCssH !== h) {
      canvas.width = pw;
      canvas.height = ph;
      canvasCssW = w;
      canvasCssH = h;
      dirty = true;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W: w, H: h };
  }

  // 计算真实几何布局与折行结果（同时供渲染和 model.js 单真源评估）
  function computeLayout(W, H) {
    const compact = W < 580;
    const outerPad = compact ? 8 : 16;
    const sheetX = outerPad;
    const sheetW = W - outerPad * 2;
    const topBarH = compact ? 24 : 30;
    const bottomBarH = compact ? 22 : 26;
    const contentTop = topBarH + (compact ? 8 : 12);
    const contentBottom = H - bottomBarH - 6;

    const colW = sheetW * state.widthRatio;
    const leftX = sheetX + (sheetW - colW) / 2;
    const rightX = leftX + colW;

    // 让桌面和宽屏保持稳定的比例基准（56% ≈ 34 字，88% ≈ 54 字，25% ≈ 14 字），手机用易读 10.5px 基准
    const bodySize = compact
      ? clamp(sheetW / 34, 10.2, 11.4)
      : clamp(sheetW / 64, 11.4, 26.5);
    const titleSize = compact ? Math.round(bodySize * 1.38) : Math.round(bodySize * 1.44);
    const kickerSize = compact ? 9 : clamp(Math.round(bodySize * 0.66), 10, 12);
    const padX = compact ? 7 : Math.round(bodySize * 1.1);
    const lineHPx = bodySize * state.leading;

    const spec = SPECIMENS[state.specimen] || SPECIMENS.book;
    const isForm = state.specimen === "form";
    const bodyFont = `400 ${bodySize.toFixed(1)}px ${F_CN}`;
    const titleFont = `900 ${titleSize}px ${F_CN}`;
    const subFont = `700 ${(bodySize * 1.08).toFixed(1)}px ${F_CN}`;

    const innerLeft = leftX + padX;
    const innerW = Math.max(48, colW - padX * 2);

    // 真实逐字折行测量（单真源！）
    let lines = [];
    let charsPerLine = 28;
    let totalLines = 6;
    let sweepTargets = []; // 用于眼动回扫线和演播光珠的真实坐标

    if (!isForm) {
      if (state.layoutMode === "dual") {
        // 硬拆双栏：每栏不到原宽一半，导致频繁换行与左右分叉
        const gutter = compact ? 10 : 18;
        const halfW = Math.max(36, (innerW - gutter) / 2);
        const col1Text = `${spec.lead}${spec.body1}`;
        const col2Text = `${spec.body2}${spec.body3 || ""}`;
        const l1 = wrapText(ctx, col1Text, halfW, bodyFont);
        const l2 = wrapText(ctx, col2Text, halfW, bodyFont);
        const fullLines = l1.slice(0, Math.max(1, l1.length - 1));
        const avg = fullLines.length
          ? fullLines.reduce((s, r) => s + r.chars, 0) / fullLines.length
          : l1[0]?.chars || 12;
        charsPerLine = Math.round(avg);
        totalLines = l1.length + l2.length;
        lines = { dual: true, gutter, halfW, l1, l2 };
      } else {
        const blocks = [];
        if (state.rhythm === "wall") {
          const wallText = `${spec.lead}${spec.body1}${spec.body2}${spec.body3 || ""}`;
          const wrapped = wrapText(ctx, wallText, innerW, bodyFont);
          blocks.push({ kind: "para", lines: wrapped });
        } else {
          blocks.push({ kind: "lead", lines: wrapText(ctx, spec.lead, innerW, bodyFont) });
          blocks.push({ kind: "divider" });
          blocks.push({ kind: "subhead", text: spec.subhead });
          blocks.push({ kind: "para", lines: wrapText(ctx, spec.body1, innerW, bodyFont) });
          if (state.rhythm === "breakout") {
            const qW = Math.min(sheetW - 24, innerW + (compact ? 14 : 36));
            blocks.push({
              kind: "breakout",
              width: qW,
              lines: wrapText(ctx, spec.quote, qW - (compact ? 24 : 58), subFont),
            });
          }
          blocks.push({ kind: "para", lines: wrapText(ctx, spec.body2, innerW, bodyFont) });
          if (spec.body3) {
            blocks.push({ kind: "para", lines: wrapText(ctx, spec.body3, innerW, bodyFont) });
          }
        }

        // 用所有真实正文行（排除末行残句）计算每行实测汉字数
        const sampleLines = [];
        for (const b of blocks) {
          if (b.kind === "para" || b.kind === "lead") {
            const take = b.lines.length > 1 ? b.lines.slice(0, -1) : b.lines;
            for (const ln of take) sampleLines.push(ln);
          }
        }
        const allLinesCount = blocks.reduce((acc, b) => acc + (b.lines ? b.lines.length : 0), 0);
        charsPerLine = sampleLines.length
          ? Math.round(sampleLines.reduce((s, ln) => s + ln.chars, 0) / sampleLines.length)
          : 24;
        totalLines = allLinesCount;
        lines = { dual: false, blocks };
      }
    } else {
      // 结账表单标本：按字段估算等效阅读宽
      charsPerLine = Math.round(innerW / bodySize);
      totalLines = spec.fields.length;
    }

    const ev = evaluate(state, {
      charsPerLine,
      lineCount: totalLines,
      colPx: innerW,
      lineHPx,
      compact,
    });

    return {
      W,
      H,
      compact,
      sheetX,
      sheetW,
      topBarH,
      bottomBarH,
      contentTop,
      contentBottom,
      colW,
      leftX,
      rightX,
      innerLeft,
      innerW,
      padX,
      bodySize,
      titleSize,
      kickerSize,
      lineHPx,
      bodyFont,
      titleFont,
      subFont,
      spec,
      isForm,
      lines,
      sweepTargets,
      ev,
    };
  }

  // 把单真源评估结果同步到周围所有 DOM 读数、按钮、圆徽
  function syncDOM(ev) {
    lastEval = ev;
    const warn = !ev.ok;

    setText(dom.statusStamp, ev.statusTag);
    setClass(dom.statusStamp, `status-stamp ${warn ? "is-warn" : "is-ok"}`);

    setText(
      dom.hudLine,
      `栏宽 ${ev.widthPct}% · 留白各 ${ev.marginPct}% · ${state.specimen === "form" ? "单列字段" : `${ev.charsPerLine} 字/行`} · 行距 ${state.leading.toFixed(2)}×`
    );

    setClass(dom.verdictSheet, `verdict-sheet ${ev.ok ? "is-ok" : ""}`);
    setText(dom.verdictTag, ev.ok ? "3/3 得法" : `${ev.score}/3 待校`);
    setClass(dom.verdictTag, `verdict-tag ${warn ? "is-warn" : "is-ok"}`);
    setText(dom.verdictTitle, ev.summaryTitle);
    setText(dom.verdictBody, ev.summaryBody);
    setText(dom.verdictHint, ev.summaryHint);
    setText(dom.btnStepFix, ev.fixLabel);

    setText(dom.mChars, state.specimen === "form" ? `宽 ${ev.widthPct}%` : `${ev.charsPerLine} 字/行`);
    setText(dom.mMargin, `${ev.marginPct}%`);
    setText(dom.mLeading, `${state.leading.toFixed(2)}×`);
    setText(dom.mSweep, ev.sweepBand);

    const wVal = String(Math.round(state.widthRatio * 100));
    if (dom.rangeWidth.value !== wVal) dom.rangeWidth.value = wVal;
    setText(dom.outWidth, `${wVal}%`);

    const lVal = String(Math.round(state.leading * 100));
    if (dom.rangeLeading.value !== lVal) dom.rangeLeading.value = lVal;
    setText(dom.outLeading, `${state.leading.toFixed(2)}×`);

    for (const b of dom.specTabs) {
      const active = b.dataset.specimen === state.specimen;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    }
    for (const b of dom.modeBtns) {
      b.classList.toggle("is-active", b.dataset.mode === state.layoutMode);
    }
    for (const b of dom.rhythmBtns) {
      b.classList.toggle("is-active", b.dataset.rhythm === state.rhythm);
    }

    dom.btnGaze.setAttribute("aria-pressed", String(state.gazeActive));
    setText(dom.btnGaze, state.gazeActive ? "停止演播" : "演播视线");

    for (const key of ["vertical", "viewline", "narrative"]) {
      const p = ev.pillars[key];
      const box = dom.pillars[key];
      box.el.classList.toggle("is-ok", p.ok);
      setText(box.state, p.badge);
      setClass(box.state, `pillar-state ${p.ok ? "is-ok" : "is-warn"}`);
    }
  }

  // 画布主渲染函数（纯 2D Canvas，零 shadowBlur，高速清脆）
  function drawFrame(t, dt, { still }) {
    const { W, H } = syncCanvasSize();

    // 入场缓动（0.65 秒内虚线栏轨流畅落位，且第 0 帧即完整清晰）
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.65);
      dirty = true;
    }

    if (state.gazeActive && !still) {
      gazeTime += dt || 0.016;
      dirty = true;
    }

    if (!dirty) return;
    dirty = false;

    const L = computeLayout(W, H);
    const { ev } = L;
    syncDOM(ev);

    // 刷新命中区缓存（把手落于下三分之一开阔区，永不遮挡抢焦侧栏与护城河标签）
    hit.W = W;
    hit.H = H;
    hit.sheetX = L.sheetX;
    hit.sheetW = L.sheetW;
    hit.leftX = L.leftX;
    hit.rightX = L.rightX;
    hit.handleY = Math.round(L.contentBottom - (L.compact ? 42 : 52));
    hit.sidebarRect = null;
    hit.splitBadgeRect = null;

    // 1. 暖米书纸满幅底色
    ctx.fillStyle = PAL.paperBright;
    ctx.fillRect(0, 0, W, H);

    // 2. 两侧留白护城河（温柔暖纸底 + 斜线排印底纹）
    const moatLeftW = L.leftX - L.sheetX;
    const moatRightW = L.sheetX + L.sheetW - L.rightX;
    const moatBad = ev.issues.some((i) => i.id === "cramped-margin" || i.id === "too-wide" || i.id === "too-wide-form");

    ctx.fillStyle = moatBad ? "rgba(224, 56, 26, 0.06)" : PAL.paper;
    ctx.fillRect(L.sheetX, L.topBarH, moatLeftW, H - L.topBarH - L.bottomBarH);
    ctx.fillRect(L.rightX, L.topBarH, moatRightW, H - L.topBarH - L.bottomBarH);

    // 护城河细斜纹（低对比不抢正文）
    if (moatLeftW > 18) {
      ctx.save();
      ctx.strokeStyle = moatBad ? "rgba(176, 37, 12, 0.14)" : "rgba(117, 111, 104, 0.12)";
      ctx.lineWidth = 1;
      const step = 12;
      ctx.beginPath();
      for (let side = 0; side < 2; side++) {
        const sx = side === 0 ? L.sheetX : L.rightX;
        const sw = side === 0 ? moatLeftW : moatRightW;
        const sy = L.topBarH;
        const sh = H - L.topBarH - L.bottomBarH;
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx, sy, sw, sh);
        ctx.clip();
        ctx.beginPath();
        for (let d = -sh; d < sw + sh; d += step) {
          ctx.moveTo(sx + d, sy);
          ctx.lineTo(sx + d - sh * 0.45, sy + sh);
        }
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    // 护城河竖向安静标记（仅护城河真正宽裕时显示，绝不贴挤虚线与把手）
    if (!L.compact && moatLeftW >= 104) {
      ctx.save();
      ctx.fillStyle = moatBad ? PAL.redText : PAL.inkMuted;
      ctx.font = `700 10.5px ${F_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelY = L.contentTop + Math.round((L.contentBottom - L.contentTop) * 0.36);
      ctx.fillText(`护城河 ${ev.marginPct}%`, L.sheetX + moatLeftW / 2, labelY - 8);
      ctx.font = `400 10px ${F_SANS}`;
      ctx.fillText("QUIET MOAT", L.sheetX + moatLeftW / 2, labelY + 9);
      ctx.restore();
    }

    // 3. 顶部标尺带（标示左留白 / 中央单栏宽度与实测字数 / 右留白）
    ctx.fillStyle = PAL.paperLinen;
    ctx.fillRect(0, 0, W, L.topBarH);
    ctx.strokeStyle = PAL.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, L.topBarH + 0.5);
    ctx.lineTo(W, L.topBarH + 0.5);
    ctx.stroke();

    // 标尺色条：中央单栏段
    const colOk = ev.pillars.vertical.ok;
    ctx.fillStyle = colOk ? "rgba(26, 102, 70, 0.14)" : "rgba(224, 56, 26, 0.13)";
    ctx.fillRect(L.leftX, 0, L.colW, L.topBarH);

    // 顶部标尺文字
    ctx.save();
    ctx.font = `700 ${L.compact ? 10 : 11}px ${F_MONO}`;
    ctx.textBaseline = "middle";
    const barMidY = L.topBarH / 2 + 0.5;

    ctx.fillStyle = colOk ? PAL.ok : PAL.redText;
    ctx.textAlign = "center";
    const midLabel = L.isForm
      ? `单栏表单 ${ev.widthPct}%`
      : L.compact
        ? `${ev.widthPct}% · ${ev.charsPerLine} 字/行`
        : `单栏版心 ${ev.widthPct}% · 实测 ${ev.charsPerLine} 字/行 · 回扫角 ${ev.sweepDeg}°`;
    ctx.fillText(midLabel, (L.leftX + L.rightX) / 2, barMidY);

    if (moatLeftW >= (L.compact ? 36 : 64)) {
      ctx.fillStyle = moatBad ? PAL.redText : PAL.inkMuted;
      ctx.fillText(`${ev.marginPct}%`, L.sheetX + moatLeftW / 2, barMidY);
      ctx.fillText(`${ev.marginPct}%`, L.rightX + moatRightW / 2, barMidY);
    }
    ctx.restore();

    // 4. 底部状态细带（含原海报小黑点细线呼应）
    const botY = H - L.bottomBarH;
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, botY, W, L.bottomBarH);
    ctx.strokeStyle = PAL.rule;
    ctx.beginPath();
    ctx.moveTo(0, botY + 0.5);
    ctx.lineTo(W, botY + 0.5);
    ctx.stroke();

    // 5. 在单栏走廊内部绘制真实排版内容（裁剪在可视纸窗内）
    const gazeSegments = [];
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.sheetX + 1, L.topBarH + 1, L.sheetW - 2, botY - L.topBarH - 2);
    ctx.clip();

    // 正文区背景为最干净的亮书纸
    ctx.fillStyle = PAL.paperBright;
    ctx.fillRect(L.leftX, L.topBarH + 1, L.colW, botY - L.topBarH - 2);

    let y = L.contentTop;
    const maxY = L.contentBottom;

    // 顶部迷你朱红锚点（呼应原海报天头圆点）
    if (!L.compact) {
      ctx.fillStyle = PAL.red;
      ctx.beginPath();
      ctx.arc(L.innerLeft + 5, y + 5, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 栏目眉标
    ctx.fillStyle = PAL.redText;
    ctx.font = `700 ${L.kickerSize}px ${F_SANS}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(L.spec.kicker, L.innerLeft + (L.compact ? 0 : 16), y);
    y += L.kickerSize + (L.compact ? 5 : 8);

    // 真实文章主标题（可多行自动折行）
    const titleLines = wrapText(ctx, L.spec.title, L.innerW, L.titleFont);
    ctx.fillStyle = PAL.ink;
    ctx.font = L.titleFont;
    for (const tl of titleLines.slice(0, 2)) {
      ctx.fillText(tl.text, L.innerLeft, y);
      gazeSegments.push({ x1: L.innerLeft, x2: L.innerLeft + tl.width, y: y + L.titleSize * 0.52 });
      y += L.titleSize * 1.24;
    }
    y += L.compact ? 4 : 8;

    let clippedOverflow = false;

    if (!L.isForm) {
      if (L.lines.dual) {
        // ---- 硬拆双栏模式 ----
        const { gutter, halfW, l1, l2 } = L.lines;
        const c1X = L.innerLeft;
        const c2X = L.innerLeft + halfW + gutter;
        const splitX = L.innerLeft + halfW + gutter / 2;

        // 醒目朱红中缝劈裂线
        ctx.save();
        ctx.strokeStyle = PAL.red;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(splitX, y - 2);
        ctx.lineTo(splitX, maxY);
        ctx.stroke();
        ctx.restore();

        ctx.font = L.bodyFont;
        ctx.fillStyle = PAL.ink;
        let y1 = y;
        let y2 = y;
        const maxDualRows = Math.max(l1.length, l2.length);
        for (let i = 0; i < maxDualRows; i++) {
          if (y1 + L.bodySize > maxY) {
            clippedOverflow = true;
            break;
          }
          if (l1[i]) {
            ctx.fillText(l1[i].text, c1X, y1);
            gazeSegments.push({ x1: c1X, x2: c1X + l1[i].width, y: y1 + L.bodySize * 0.55, col: 0 });
          }
          if (l2[i]) {
            ctx.fillText(l2[i].text, c2X, y2);
            if (i < 4) gazeSegments.push({ x1: c2X, x2: c2X + l2[i].width, y: y2 + L.bodySize * 0.55, col: 1 });
          }
          y1 += L.lineHPx;
          y2 += L.lineHPx;
        }

        // 可点击的中缝修复徽章
        const bw = L.compact ? 128 : 162;
        const bh = 26;
        const bx = clamp(splitX - bw / 2, L.sheetX + 8, L.sheetX + L.sheetW - bw - 8);
        const by = clamp(y + 16, L.contentTop + 34, maxY - bh - 6);
        hit.splitBadgeRect = { x: bx, y: by, w: bw, h: bh };
        ctx.fillStyle = PAL.redBtn;
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 ${L.compact ? 10.5 : 11.5}px ${F_CN}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 视线被劈成两栏 · 点此合栏", bx + bw / 2, by + bh / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
      } else {
        // ---- 单栏连续正文（墙 / 圆点分节 / 配图破墙）----
        const bodySweepLines = [];
        for (const block of L.lines.blocks) {
          if (y > maxY - L.bodySize * 0.6) {
            clippedOverflow = true;
            break;
          }
          if (block.kind === "divider") {
            const dy = y + (L.compact ? 5 : 8);
            ctx.strokeStyle = PAL.rule;
            ctx.lineWidth = 1;
            const mid = L.leftX + L.colW / 2;
            ctx.beginPath();
            ctx.moveTo(L.innerLeft, dy);
            ctx.lineTo(mid - 10, dy);
            ctx.moveTo(mid + 10, dy);
            ctx.lineTo(L.innerLeft + L.innerW, dy);
            ctx.stroke();
            ctx.fillStyle = PAL.red;
            ctx.beginPath();
            ctx.arc(mid, dy, 3, 0, Math.PI * 2);
            ctx.fill();
            y += L.compact ? 13 : 18;
          } else if (block.kind === "subhead") {
            ctx.fillStyle = PAL.ink;
            ctx.font = L.subFont;
            ctx.fillText(block.text, L.innerLeft, y);
            y += L.bodySize * 1.55;
          } else if (block.kind === "breakout") {
            const qx = L.leftX + (L.colW - block.width) / 2;
            const qPadY = L.compact ? 7 : 10;
            const qLineH = L.bodySize * 1.48;
            const qh = block.lines.length * qLineH + qPadY * 2;
            if (y + qh > maxY + 8) {
              clippedOverflow = true;
              break;
            }
            // 破栏引语卡：故意微微跳出双虚线轨，制造纵向节奏高潮
            ctx.fillStyle = PAL.paperLinen;
            ctx.fillRect(qx, y, block.width, qh);
            ctx.fillStyle = PAL.red;
            ctx.fillRect(qx, y, 3.5, qh);

            // 右侧小装饰 4×4 黑点朱红方块（宽屏足够空间时画）
            const artW = L.compact ? 0 : 34;
            if (artW) {
              const ax = qx + block.width - artW - 10;
              const ay = y + (qh - 26) / 2;
              ctx.fillStyle = PAL.red;
              ctx.fillRect(ax, ay, 30, 26);
              ctx.fillStyle = PAL.ink;
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  ctx.beginPath();
                  ctx.arc(ax + 7 + c * 8, ay + 6 + r * 7, 1.2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }

            ctx.fillStyle = PAL.ink;
            ctx.font = L.subFont;
            let qy = y + qPadY;
            for (const ql of block.lines) {
              ctx.fillText(ql.text, qx + 12, qy);
              qy += qLineH;
            }
            y += qh + (L.compact ? 8 : 12);
          } else {
            // lead 或 para
            ctx.font = L.bodyFont;
            ctx.fillStyle = block.kind === "lead" ? PAL.ink : PAL.ink2;
            for (const ln of block.lines) {
              if (y + L.bodySize > maxY) {
                clippedOverflow = true;
                break;
              }
              ctx.fillText(ln.text, L.innerLeft, y);
              const seg = { x1: L.innerLeft, x2: L.innerLeft + ln.width, y: y + L.bodySize * 0.56 };
              gazeSegments.push(seg);
              bodySweepLines.push(seg);
              y += L.lineHPx;
            }
            if (state.rhythm !== "wall") y += Math.round(L.bodySize * 0.52);
          }
        }

        // 绘制真实回扫斜率示意线（第 1 行尾 → 第 2 行首）
        if (bodySweepLines.length >= 2) {
          const a = bodySweepLines[0];
          const b = bodySweepLines[1];
          const badWidth = ev.issues.some((i) => i.id === "too-wide" || i.id === "too-narrow" || i.id === "tight-leading");
          ctx.save();
          ctx.strokeStyle = badWidth ? "rgba(224, 56, 26, 0.52)" : "rgba(26, 102, 70, 0.36)";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(a.x2, a.y + 3);
          ctx.lineTo(b.x1 + 3, b.y - 2);
          ctx.stroke();
          // 左端小落点圆
          ctx.fillStyle = badWidth ? PAL.red : PAL.ok;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(b.x1 + 2, b.y - 2, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    } else {
      // ---- 结账表单标本 ----
      const fields = L.spec.fields;
      const dual = state.layoutMode === "dual";
      const gapY = clamp(L.bodySize * (state.leading - 0.85), 5, 22);
      const inputH = L.compact ? 22 : clamp(Math.round(L.bodySize * 1.68), 22, 30);
      const labelH = L.compact ? 13 : 16;

      if (state.rhythm !== "wall") {
        ctx.fillStyle = PAL.ink2;
        ctx.font = `700 ${L.kickerSize + 1}px ${F_CN}`;
        ctx.fillText(L.spec.subhead, L.innerLeft, y);
        y += labelH + 4;
      }

      if (dual) {
        // 多栏交错表单（Baymard 反例）
        const gutter = L.compact ? 8 : 16;
        const halfW = Math.max(48, (L.innerW - gutter) / 2);
        const splitX = L.innerLeft + halfW + gutter / 2;
        ctx.save();
        ctx.strokeStyle = PAL.red;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(splitX, y);
        ctx.lineTo(splitX, maxY - 12);
        ctx.stroke();
        ctx.restore();

        fields.forEach((f, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const fx = L.innerLeft + col * (halfW + gutter);
          const fy = y + row * (labelH + inputH + gapY + 4);
          if (fy + inputH > maxY) {
            clippedOverflow = true;
            return;
          }
          ctx.fillStyle = PAL.ink;
          ctx.font = `700 ${L.compact ? 10 : 11.5}px ${F_CN}`;
          ctx.fillText(`${idx + 1}. ${f.label}`, fx, fy);
          ctx.fillStyle = PAL.paper;
          ctx.strokeStyle = PAL.inkMuted;
          ctx.lineWidth = 1;
          ctx.fillRect(fx, fy + labelH, halfW, inputH);
          ctx.strokeRect(fx + 0.5, fy + labelH + 0.5, halfW - 1, inputH - 1);
          ctx.fillStyle = PAL.inkMuted;
          ctx.font = `400 ${L.compact ? 10 : 12}px ${F_CN}`;
          ctx.fillText(f.placeholder, fx + 8, fy + labelH + (inputH - 12) / 2);
          gazeSegments.push({ x1: fx, x2: fx + halfW, y: fy + labelH + inputH / 2, col });
        });

        const bw = L.compact ? 140 : 178;
        const bh = 26;
        const bx = clamp(splitX - bw / 2, L.sheetX + 8, L.sheetX + L.sheetW - bw - 8);
        const by = clamp(y + labelH + inputH + 10, L.contentTop + 34, maxY - bh - 6);
        hit.splitBadgeRect = { x: bx, y: by, w: bw, h: bh };
        ctx.fillStyle = PAL.redBtn;
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 ${L.compact ? 10.5 : 11.5}px ${F_CN}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 多栏顺序打结 · 点此合单列", bx + bw / 2, by + bh / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
      } else {
        for (let i = 0; i < fields.length; i++) {
          const f = fields[i];
          if (y + labelH + inputH > maxY) {
            clippedOverflow = true;
            break;
          }
          ctx.fillStyle = PAL.ink;
          ctx.font = `700 ${L.compact ? 10.5 : 12}px ${F_CN}`;
          ctx.fillText(f.label, L.innerLeft, y);

          const fw = f.group ? L.innerW : Math.min(L.innerW, Math.max(L.innerW * f.width, L.innerW * 0.72));
          ctx.fillStyle = PAL.paper;
          ctx.strokeStyle = ev.pillars.vertical.ok ? PAL.ink : PAL.redText;
          ctx.lineWidth = 1;
          ctx.fillRect(L.innerLeft, y + labelH, fw, inputH);
          ctx.strokeRect(L.innerLeft + 0.5, y + labelH + 0.5, fw - 1, inputH - 1);

          // 省/市/邮编同属短组：在单栏内用浅竖线划为 3 格
          if (f.group && state.rhythm !== "wall") {
            ctx.strokeStyle = PAL.rule;
            ctx.beginPath();
            ctx.moveTo(L.innerLeft + fw * 0.32, y + labelH + 3);
            ctx.lineTo(L.innerLeft + fw * 0.32, y + labelH + inputH - 3);
            ctx.moveTo(L.innerLeft + fw * 0.66, y + labelH + 3);
            ctx.lineTo(L.innerLeft + fw * 0.66, y + labelH + inputH - 3);
            ctx.stroke();
          }

          ctx.fillStyle = PAL.ink2;
          ctx.font = `400 ${L.compact ? 10.5 : 12.5}px ${F_CN}`;
          ctx.fillText(f.placeholder, L.innerLeft + 10, y + labelH + (inputH - (L.compact ? 11 : 13)) / 2);
          gazeSegments.push({ x1: L.innerLeft, x2: L.innerLeft + fw, y: y + labelH + inputH / 2 });
          y += labelH + inputH + gapY;
        }

        // 提交按钮（垂直终点）
        if (y + 30 <= maxY + 4) {
          const btnW = Math.min(L.innerW, L.compact ? 156 : 196);
          ctx.fillStyle = PAL.ink;
          ctx.fillRect(L.innerLeft, y + 2, btnW, 28);
          ctx.fillStyle = PAL.paperBright;
          ctx.font = `700 ${L.compact ? 11 : 12.5}px ${F_CN}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(L.spec.cta, L.innerLeft + btnW / 2, y + 16);
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
        }
      }
    }

    // 底部柔和渐隐（内容超出一屏高度时提示这是连续纵流）
    if (clippedOverflow) {
      const grad = ctx.createLinearGradient(0, maxY - 28, 0, maxY + 4);
      grad.addColorStop(0, "rgba(253, 249, 244, 0)");
      grad.addColorStop(1, "rgba(253, 249, 244, 0.96)");
      ctx.fillStyle = grad;
      ctx.fillRect(L.leftX + 1, maxY - 28, L.colW - 2, 32);
    }

    // 6. 先画 1:1 承袭 132 原海报的「贯通顶底双垂直灰色虚线栏轨」（在侧栏卡底层，不劈穿卡片文字）
    const railEndY = L.topBarH + (botY - L.topBarH) * introProgress;
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = colOk ? PAL.rail : PAL.red;
    ctx.lineWidth = colOk ? 1.5 : 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(Math.round(L.leftX) + 0.5, L.topBarH);
    ctx.lineTo(Math.round(L.leftX) + 0.5, railEndY);
    ctx.moveTo(Math.round(L.rightX) + 0.5, L.topBarH);
    ctx.lineTo(Math.round(L.rightX) + 0.5, railEndY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 栏轨顶底实心小圆端锚（致敬原海报几何点线语言）
    const anchorColor = colOk ? PAL.ink : PAL.red;
    ctx.fillStyle = anchorColor;
    for (const rx of [L.leftX, L.rightX]) {
      ctx.beginPath();
      ctx.arc(rx, L.topBarH, 3.2, 0, Math.PI * 2);
      ctx.arc(rx, botY, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 7. 抢焦侧栏浮卡（画在虚线之上，干净清晰；底部始终高于下方栏轨拉钮）
    if (state.layoutMode === "sidebar") {
      const cardW = L.compact ? clamp(Math.round(W * 0.44), 146, 178) : clamp(Math.round(W * 0.19), 190, 240);
      const cardH = L.compact ? 144 : 172;
      const cardX = L.sheetX + L.sheetW - cardW - (L.compact ? 8 : 16);
      const maxCardTop = Math.max(L.contentTop + 14, hit.handleY - 22 - cardH);
      const cardY = Math.min(L.contentTop + (L.compact ? 32 : 40), maxCardTop);
      hit.sidebarRect = { x: cardX, y: cardY, w: cardW, h: cardH };

      // 视线被侧方拉走的虚线警示弧
      ctx.save();
      ctx.strokeStyle = "rgba(224, 56, 26, 0.58)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      const fromX = Math.min(cardX - 18, L.leftX + L.colW * 0.52);
      ctx.beginPath();
      ctx.moveTo(fromX, cardY + 24);
      ctx.quadraticCurveTo((fromX + cardX) / 2, cardY - 6, cardX - 2, cardY + 22);
      ctx.stroke();
      ctx.restore();

      // 浮卡本体
      ctx.fillStyle = PAL.redTint;
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1);

      // 顶栏红色标题条
      ctx.fillStyle = PAL.redBtn;
      ctx.fillRect(cardX, cardY, cardW, 24);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${L.compact ? 10.5 : 11.5}px ${F_CN}`;
      ctx.textBaseline = "middle";
      ctx.fillText(`抢焦侧栏 · ${L.spec.sidebarTitle}`, cardX + 8, cardY + 12.5);

      // 噪点条目
      ctx.textBaseline = "top";
      ctx.fillStyle = PAL.ink;
      ctx.font = `400 ${L.compact ? 10 : 11.5}px ${F_CN}`;
      L.spec.sidebarItems.forEach((item, i) => {
        const iy = cardY + 32 + i * (L.compact ? 24 : 30);
        ctx.fillStyle = PAL.red;
        ctx.fillRect(cardX + 9, iy + 3, 5, 5);
        ctx.fillStyle = PAL.ink2;
        const shortItem = item.length > (L.compact ? 11 : 14) ? `${item.slice(0, L.compact ? 11 : 14)}…` : item;
        ctx.fillText(shortItem, cardX + 19, iy);
      });

      // 底部醒目「点击清出」操作条
      const pillY = cardY + cardH - 28;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(cardX + 8, pillY, cardW - 16, 22);
      ctx.fillStyle = PAL.paperBright;
      ctx.font = `700 ${L.compact ? 10.5 : 11}px ${F_CN}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 点此清出侧栏", cardX + cardW / 2, pillY + 11);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
    }

    // 8. 眼动视线光珠演播（按真实折行坐标逐行扫读与回扫）
    if (state.gazeActive && gazeSegments.length) {
      drawGazeReplay(ctx, gazeSegments, still, gazeTime, hit.sidebarRect, ev, L);
    }

    // 9. 两侧朱红圆形拖动手柄（始终在最顶层、位于下三分之一开阔区）
    ctx.save();
    const handleR = L.compact ? 11 : 13;
    for (const rx of [L.leftX, L.rightX]) {
      ctx.fillStyle = colOk ? PAL.ok : PAL.red;
      ctx.beginPath();
      ctx.arc(rx, hit.handleY, handleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PAL.paperBright;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 手柄内左右双小三角
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(rx - 6.5, hit.handleY);
      ctx.lineTo(rx - 2, hit.handleY - 3.6);
      ctx.lineTo(rx - 2, hit.handleY + 3.6);
      ctx.closePath();
      ctx.moveTo(rx + 6.5, hit.handleY);
      ctx.lineTo(rx + 2, hit.handleY - 3.6);
      ctx.lineTo(rx + 2, hit.handleY + 3.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 9. 底部提示栏文字
    ctx.save();
    ctx.font = `700 ${L.compact ? 10 : 11}px ${F_MONO}`;
    ctx.textBaseline = "middle";
    const footY = botY + L.bottomBarH / 2 + 0.5;
    ctx.fillStyle = ev.ok ? PAL.ok : PAL.redText;
    ctx.textAlign = "left";
    ctx.fillText(
      ev.ok ? `✓ ${ev.solutionName}` : `× ${ev.top ? ev.top.short : "待校"}`,
      L.sheetX + 4,
      footY
    );
    ctx.fillStyle = PAL.inkMuted;
    ctx.textAlign = "right";
    ctx.fillText(
      clippedOverflow ? `纵流续页 · 共 ${ev.lineCount} 行 ↓` : `共 ${ev.lineCount} 行 · 拖红钮或画布调宽`,
      L.sheetX + L.sheetW - 4,
      footY
    );
    ctx.restore();
  }

  function drawGazeReplay(ctx, segs, still, time, sidebarRect, ev, L) {
    const count = Math.min(segs.length, 6);
    const activeSegs = segs.slice(0, count);

    ctx.save();
    // 完整扫描轨迹线
    ctx.strokeStyle = ev.ok ? "rgba(26, 102, 70, 0.45)" : "rgba(224, 56, 26, 0.52)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    activeSegs.forEach((s, i) => {
      if (i === 0) ctx.moveTo(s.x1, s.y);
      else ctx.lineTo(s.x1, s.y);
      ctx.lineTo(s.x2, s.y);
    });
    ctx.stroke();

    if (still) {
      // 减少动态效果：画清晰静态序号落点
      activeSegs.slice(0, 4).forEach((s, i) => {
        ctx.fillStyle = ev.ok ? PAL.ok : PAL.red;
        ctx.beginPath();
        ctx.arc(s.x1, s.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 9.5px ${F_MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), s.x1, s.y + 0.5);
      });
      ctx.restore();
      return;
    }

    // 连续流动光珠（每行扫读 0.65s + 回扫 0.22s）
    const stepDur = 0.87;
    const totalDur = count * stepDur;
    const u = (time % totalDur) / stepDur;
    const idx = Math.floor(u);
    const local = u - idx;
    const cur = activeSegs[idx];
    const next = activeSegs[(idx + 1) % count];

    let px;
    let py;
    let sweeping = false;
    if (local < 0.74) {
      const p = local / 0.74;
      px = cur.x1 + (cur.x2 - cur.x1) * p;
      py = cur.y;
      // 侧栏抢焦时，第 2 行中途被猛地扯向侧栏卡片
      if (sidebarRect && idx === 1 && p > 0.42 && p < 0.88) {
        const pull = Math.sin(((p - 0.42) / 0.46) * Math.PI);
        px += (sidebarRect.x + 28 - px) * pull * 0.85;
        py += (sidebarRect.y + 38 - py) * pull * 0.75;
      }
    } else {
      sweeping = true;
      const p = (local - 0.74) / 0.26;
      px = cur.x2 + (next.x1 - cur.x2) * p;
      py = cur.y + (next.y - cur.y) * p;
      // 超宽回扫时轻微上下飘移，示意找下一行开头易串行
      if (ev.issues.some((i) => i.id === "too-wide")) {
        py += Math.sin(p * Math.PI) * (L.lineHPx * 0.52);
      }
    }

    // 光珠柔晕（纯同心圆，无 shadowBlur）
    const beadColor = ev.ok ? PAL.ok : PAL.red;
    ctx.fillStyle = ev.ok ? "rgba(26, 102, 70, 0.20)" : "rgba(224, 56, 26, 0.22)";
    ctx.beginPath();
    ctx.arc(px, py, sweeping ? 13 : 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = beadColor;
    ctx.beginPath();
    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---- 状态更新接口 ----
  const runner = loop(canvas, drawFrame);

  function setState(patch) {
    state = clampState({ ...state, ...patch });
    dirty = true;
    runner.draw();
  }

  // ---- 画布指针与触摸交互（左右拖栏轨/画布调宽 + 直点红卡清侧栏）----
  let drag = null;

  function canvasPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function inRect(pt, rect) {
    return rect && pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
  }

  function startDrag(pt, pointerId) {
    const nearLeft = Math.abs(pt.x - hit.leftX) <= 26;
    const nearRight = Math.abs(pt.x - hit.rightX) <= 26;
    const mode = nearLeft ? "left" : nearRight ? "right" : "pan";
    drag = {
      pointerId,
      mode,
      startX: pt.x,
      startY: pt.y,
      startRatio: state.widthRatio,
      moved: false,
      lockedAxis: mode === "pan" ? null : "x",
    };
  }

  function moveDrag(pt) {
    if (!drag) return false;
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;

    if (!drag.lockedAxis) {
      if (Math.abs(dx) >= 4 || Math.abs(dy) >= 4) {
        drag.lockedAxis = Math.abs(dx) >= Math.abs(dy) * 0.8 ? "x" : "y";
      }
    }
    if (drag.lockedAxis !== "x") return false;

    const span = Math.max(120, hit.sheetW);
    let nextRatio = drag.startRatio;
    if (drag.mode === "left") {
      nextRatio = drag.startRatio - (dx * 2) / span;
    } else if (drag.mode === "right") {
      nextRatio = drag.startRatio + (dx * 2) / span;
    } else {
      // 画布任意位置横拖：右拉放宽、左拉收窄（同时兼容 tools/perf.mjs 中央横拖）
      nextRatio = drag.startRatio + (dx * 1.45) / span;
    }
    setState({ widthRatio: nextRatio });
    return true;
  }

  function endDrag(pt) {
    if (!drag) return;
    const wasClick = !drag.moved;
    drag = null;
    if (wasClick && pt) {
      if (inRect(pt, hit.sidebarRect)) {
        setState({ layoutMode: "clean" });
      } else if (inRect(pt, hit.splitBadgeRect)) {
        setState({ layoutMode: "clean" });
      }
    }
  }

  // Pointer Events（鼠标 & 现代触屏）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由下方 touch 事件，确保 perf.mjs 和真机都顺滑
    if (e.button !== 0) return;
    const pt = canvasPoint(e.clientX, e.clientY);
    startDrag(pt, e.pointerId);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = canvasPoint(e.clientX, e.clientY);
    if (drag) {
      moveDrag(pt);
    } else {
      // 悬停光标提示
      const clickable = inRect(pt, hit.sidebarRect) || inRect(pt, hit.splitBadgeRect);
      canvas.style.cursor = clickable ? "pointer" : "ew-resize";
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag(canvasPoint(e.clientX, e.clientY));
  });
  canvas.addEventListener("pointercancel", () => { drag = null; });

  // Touch Events（显式处理，保留竖向滚动，横向稳定触发重绘）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    startDrag(canvasPoint(t0.clientX, t0.clientY), t0.identifier);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!drag || !e.touches.length) return;
    const t0 = e.touches[0];
    const consumed = moveDrag(canvasPoint(t0.clientX, t0.clientY));
    if (consumed && e.cancelable) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchend", (e) => {
    const t0 = e.changedTouches[0];
    endDrag(t0 ? canvasPoint(t0.clientX, t0.clientY) : null);
  }, { passive: true });
  canvas.addEventListener("touchcancel", () => { drag = null; }, { passive: true });

  // 键盘微调（←/→ 调栏宽，↑/↓ 调行距，Space 演播视线）
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setState({ widthRatio: state.widthRatio - 0.03 });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setState({ widthRatio: state.widthRatio + 0.03 });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setState({ leading: state.leading + 0.05 });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setState({ leading: state.leading - 0.05 });
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      gazeTime = 0;
      setState({ gazeActive: !state.gazeActive });
    }
  });

  // ---- 绑定控件事件 ----
  dom.specTabs.forEach((btn) => {
    btn.addEventListener("click", () => setState({ specimen: btn.dataset.specimen }));
  });
  dom.modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => setState({ layoutMode: btn.dataset.mode }));
  });
  dom.rhythmBtns.forEach((btn) => {
    btn.addEventListener("click", () => setState({ rhythm: btn.dataset.rhythm }));
  });
  dom.rangeWidth.addEventListener("input", () => {
    setState({ widthRatio: Number(dom.rangeWidth.value) / 100 });
  });
  dom.rangeLeading.addEventListener("input", () => {
    setState({ leading: Number(dom.rangeLeading.value) / 100 });
  });
  dom.btnGaze.addEventListener("click", () => {
    gazeTime = 0;
    setState({ gazeActive: !state.gazeActive });
  });
  dom.btnStepFix.addEventListener("click", () => {
    if (lastEval && lastEval.fixPatch) {
      setState(lastEval.fixPatch);
    } else {
      gazeTime = 0;
      setState({ gazeActive: !state.gazeActive });
    }
  });
  dom.presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (p) setState(p.patch);
    });
  });
  dom.btnReset.addEventListener("click", () => {
    const keepSpec = state.specimen;
    state = createInitialState();
    state.specimen = keepSpec;
    gazeTime = 0;
    dirty = true;
    runner.draw();
  });

  // 响应尺寸变化与字体加载完毕
  const ro = new ResizeObserver(() => {
    dirty = true;
    runner.draw();
  });
  ro.observe(canvas);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      charWidthCache.clear();
      dirty = true;
      runner.draw();
    });
  }

  // 立即画第一帧（保证 0.0s 起画面完整）
  runner.draw();
}

// ==================== 01 三屏视口 × 铺满/限宽对照机 ====================
function initViewportSim() {
  const root = $("#w-viewport");
  if (!root) return;
  const vpBtns = $$(".seg-btn[data-vp]", root);
  const stBtns = $$(".seg-btn[data-strategy]", root);
  const frame = $("#vp-frame");
  const moatL = $("#vp-moat-l");
  const moatR = $("#vp-moat-r");
  const measureOut = $("#vp-measure");
  const moatOut = $("#vp-moat-pct");
  const verdictOut = $("#vp-verdict");

  const VIEWPORTS = {
    phone: { width: 390, framePct: 38, pad: 24, name: "手机 390px" },
    laptop: { width: 1280, framePct: 76, pad: 48, name: "笔电 1280px" },
    wide: { width: 1920, framePct: 100, pad: 64, name: "宽屏 1920px" },
  };

  let curVp = "laptop";
  let curStrategy = "fluid";

  function render() {
    const v = VIEWPORTS[curVp];
    const maxCol = curStrategy === "clamped" ? 640 : v.width - v.pad * 2;
    const colPx = Math.min(v.width - v.pad * 2, maxCol);
    const moatTotalPct = Math.round(((v.width - colPx) / v.width) * 100);
    const eachMoatPct = (100 - (colPx / v.width) * 100) / 2;
    const chars = Math.round(colPx / 16);
    const bad = chars > 40;

    frame.style.width = `${v.framePct}%`;
    frame.classList.toggle("is-bad", bad);
    moatL.style.flexBasis = `${eachMoatPct.toFixed(1)}%`;
    moatR.style.flexBasis = `${eachMoatPct.toFixed(1)}%`;
    moatL.firstElementChild.textContent = eachMoatPct >= 14 ? "留白" : "";
    moatR.firstElementChild.textContent = eachMoatPct >= 14 ? "留白" : "";

    measureOut.textContent = `栏宽 ${colPx}px · 约 ${chars} 字/行`;
    moatOut.textContent = `双侧护城河 ${moatTotalPct}%`;

    if (curVp === "phone") {
      verdictOut.textContent =
        "手机物理宽度本身只有 390px，扣掉两侧安全边距后约 21 字一行，不论是否设 640px 上限都天然贴合单栏舒适区。";
    } else if (curStrategy === "fluid") {
      verdictOut.textContent =
        `${v.name}上不设最大宽度，16px 中文直接横拉到 ${chars} 字一行，远远越过 WCAG 40 字红线；眼睛扫完行尾折返极易串行。`;
    } else {
      verdictOut.textContent =
        `把主栏钉在 640px（约 40 字以内），${v.name}两侧自然腾出 ${moatTotalPct}% 的安静留白护城河——屏幕再宽，读起来依然像一本顺手的平装书。`;
    }

    vpBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.vp === curVp));
    stBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.strategy === curStrategy));
  }

  vpBtns.forEach((b) => b.addEventListener("click", () => { curVp = b.dataset.vp; render(); }));
  stBtns.forEach((b) => b.addEventListener("click", () => { curStrategy = b.dataset.strategy; render(); }));
  render();
}

// ==================== 02 真实 DOM 活字测度标尺 ====================
function initMeasureLab() {
  const root = $("#w-measure");
  if (!root) return;
  const scriptBtns = $$(".seg-btn[data-script]", root);
  const wIn = $("#m-width");
  const sIn = $("#m-size");
  const lhIn = $("#m-lh");
  const wOut = $("#m-width-out");
  const sOut = $("#m-size-out");
  const lhOut = $("#m-lh-out");
  const zoneEl = $("#ruler-zone");
  const needleEl = $("#ruler-needle");
  const ticksEl = $("#ruler-ticks");
  const specBox = $("#live-specimen");
  const specText = $("#live-specimen-text");
  const badgeEl = $("#lab-badge");
  const explainEl = $("#lab-explain");

  const SCRIPTS = {
    zh: {
      unit: "字/行",
      minGood: 22,
      maxGood: 38,
      wcagMax: 40,
      scaleMax: 60,
      ticks: ["10 字", "22 字", "30 字（中位）", "40 字（WCAG 上限）", "60 字"],
      text: "单栏排版把纸面两侧空出来，并不是为了留白而留白。文字宽度一旦收住，视线读完一行往回找下一行开头时，落点离眼角很近，不需要左右试探。字号放大时，栏宽也应该同步放宽，才能维持住每行最顺手的字数节奏。",
    },
    en: {
      unit: "字符/行",
      minGood: 45,
      maxGood: 75,
      wcagMax: 80,
      scaleMax: 115,
      ticks: ["25 ch", "45 ch", "66 ch (Bringhurst)", "80 ch (WCAG)", "115 ch"],
      text: "Anything from 45 to 75 characters is widely regarded as a satisfactory length of line for a single-column page set in a serif text face. The 66-character line (counting both letters and spaces) is widely regarded as ideal for comfortable reading.",
    },
    mix: {
      unit: "字等值/行",
      minGood: 24,
      maxGood: 40,
      wcagMax: 44,
      scaleMax: 66,
      ticks: ["12 字", "24 字", "33 字（中位）", "44 字", "66 字"],
      text: "在中文文章里穿插 CSS max-width 或 WCAG 1.4.8 这样的西文缩写时，拉丁字母比汉字窄约一半。设计单栏测度时，按实际视觉宽度而不是字符个数去量，才不会因为英文词长把页面撑偏。",
    },
  };

  let curScript = "zh";
  if (window.innerWidth <= 480) {
    sIn.value = "15";
  }

  // 从真实 DOM 文本节点计算当前第一整行的实际字符数（绝不造假）
  function measureRealLineChars(pEl, scriptKey) {
    const node = pEl.firstChild;
    if (!node || node.nodeType !== 3) return 30;
    const str = node.textContent || "";
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, 1);
    const firstTop = range.getBoundingClientRect().top;
    let count = 0;
    let cjkEquiv = 0;
    for (let i = 1; i <= str.length; i++) {
      range.setStart(node, i - 1);
      range.setEnd(node, i);
      const r = range.getBoundingClientRect();
      if (r.height > 0 && r.top > firstTop + 6) break;
      count += 1;
      const code = str.charCodeAt(i - 1);
      cjkEquiv += code > 0x2e80 ? 1 : 0.52;
    }
    return Math.max(6, Math.round(scriptKey === "mix" ? cjkEquiv : count));
  }

  function render() {
    const sc = SCRIPTS[curScript];
    const reqW = Number(wIn.value);
    const size = Number(sIn.value);
    const lh = Number(lhIn.value) / 100;

    specBox.style.width = `${reqW}px`;
    specText.style.fontSize = `${size}px`;
    specText.style.lineHeight = String(lh);
    specText.lang = curScript === "en" ? "en" : "zh-CN";
    if (specText.textContent !== sc.text) specText.textContent = sc.text;

    const actualW = Math.round(specBox.getBoundingClientRect().width);
    wOut.textContent = actualW < reqW - 4 ? `${actualW}px（受屏宽限）` : `${reqW}px`;
    sOut.textContent = `${size}px`;
    lhOut.textContent = `${lh.toFixed(2)}×`;

    const realChars = measureRealLineChars(specText, curScript);
    const mobileNarrowScreen = actualW < 340;
    const minGoodEff = mobileNarrowScreen && curScript !== "en" ? 16 : sc.minGood;
    const zLeft = (minGoodEff / sc.scaleMax) * 100;
    const zWidth = ((sc.maxGood - minGoodEff) / sc.scaleMax) * 100;
    const needlePos = clamp((realChars / sc.scaleMax) * 100, 3, 98);

    zoneEl.style.left = `${zLeft}%`;
    zoneEl.style.width = `${zWidth}%`;
    needleEl.style.left = `${needlePos}%`;
    const displayTicks = mobileNarrowScreen && curScript === "zh"
      ? ["10 字", "16 字", "30 字", "40 字（上限）", "60 字"]
      : sc.ticks;
    ticksEl.innerHTML = displayTicks.map((t) => `<span>${t}</span>`).join("");

    const lhBad = lh < 1.4 || lh > 2.05;
    const tooWide = realChars > sc.wcagMax;
    const slightWide = realChars > sc.maxGood && realChars <= sc.wcagMax;
    const tooNarrow = realChars < minGoodEff;

    let stateText = "舒适精读区";
    let warn = false;
    let explain = "";

    if (tooWide) {
      warn = true;
      stateText = "超宽易串行";
      explain = `实测第一行排了 ${realChars} ${sc.unit}，已经跨过 ${sc.wcagMax} 上限。扫到行尾回跳下一行时视角跨度过大，试着缩窄栏宽或适度加大字号。`;
    } else if (tooNarrow) {
      warn = true;
      stateText = "过窄频繁折返";
      explain = `实测每行只有 ${realChars} ${sc.unit}，完整短语不断被拦腰折断，眼球来回折腾的次数暴增，适合调宽栏宽或略微缩小字号。`;
    } else if (lhBad) {
      warn = true;
      stateText = lh < 1.4 ? "行距偏挤" : "行距过散";
      explain = lh < 1.4
        ? `每行 ${realChars} ${sc.unit} 本身不错，但行距仅 ${lh.toFixed(2)}×，低于 WCAG 1.5× 建议，上下行容易互相干扰。`
        : `每行 ${realChars} ${sc.unit} 合适，但行距拉到了 ${lh.toFixed(2)}×，段落散成一条条孤立横杠。`;
    } else if (slightWide) {
      stateText = "略宽但仍可读";
      explain = `实测约 ${realChars} ${sc.unit}，逼近 ${sc.wcagMax} 红线；配合 ${lh.toFixed(2)}× 宽松行距尚能稳住回扫，长篇阅读建议再收紧一点。`;
    } else {
      explain = `当前实绘宽 ${actualW}px 配 ${size}px 字号与 ${lh.toFixed(2)}× 行距，落在 ${minGoodEff}–${sc.maxGood} 舒适区内，回扫轻快、理解率稳固。`;
    }

    badgeEl.textContent = `实测 ${realChars} ${sc.unit} · ${stateText}`;
    badgeEl.classList.toggle("is-warn", warn);
    explainEl.textContent = explain;
    scriptBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.script === curScript));
  }

  scriptBtns.forEach((b) => b.addEventListener("click", () => { curScript = b.dataset.script; render(); }));
  [wIn, sIn, lhIn].forEach((el) => el.addEventListener("input", render));
  new ResizeObserver(render).observe(specBox);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  render();
}

// ==================== 03 暗室书房：四时代 SVG 版心构造透视台 ====================
function initEraTimeline() {
  const svg = $("#era-svg");
  const tabs = $$(".era-tab[data-era]");
  const specCode = $("#era-spec-code");
  const btnCanon = $("#btn-era-canon");
  const titleEl = $("#era-title");
  const p1El = $("#era-p1");
  const p2El = $("#era-p2");
  if (!svg || !tabs.length) return;

  const ERAS = {
    aldus: {
      code: "OCTAVO · 1501 · 便携单栏",
      title: "1501 年 4 月：单栏让古典文学走出教堂",
      p1: "早期印刷大书多为沉重的对开本，版面太宽，必须拆成双栏才读得动，只能摊在讲台上翻看。1501 年 4 月，威尼斯出版人奥尔德斯·马努提乌斯推出八开本《维吉尔》，委托刻字师弗朗切斯科·格里福刻制史上首套全书使用的斜体活字，把紧凑优美的单栏装进了旅人衣袋。",
      p2: "这一转身定下了此后五百年文学书的基本模样：纸幅收小后，单栏不再超宽，读者得以单手持书，沿着一条连续不中断的竖流沉浸阅读。",
      draw(guides) {
        // 左侧淡出巨型对开本双栏虚影，右侧突出紧凑八开单栏口袋书
        return `
          <rect x="0" y="0" width="520" height="340" fill="#100E0C"/>
          <!-- 背景对比：15世纪讲台对开本双栏虚影 -->
          <g opacity="0.34">
            <rect x="28" y="34" width="210" height="272" fill="none" stroke="#C9BEB1" stroke-dasharray="4 4"/>
            <rect x="46" y="56" width="80" height="220" fill="#292420"/>
            <rect x="138" y="56" width="80" height="220" fill="#292420"/>
            <text x="133" y="24" fill="#C9BEB1" font-size="10.5" font-family="Space Mono, monospace" text-anchor="middle">FOLIO LECTERN · 双栏巨册</text>
          </g>
          <!-- 主角：1501 八开口袋本展开单栏 -->
          <g transform="translate(268, 72)">
            <rect x="0" y="0" width="106" height="176" fill="#FBF3EA" stroke="#D6C9B8"/>
            <rect x="106" y="0" width="106" height="176" fill="#F2E7D9" stroke="#D6C9B8"/>
            <line x1="106" y1="0" x2="106" y2="176" stroke="#756F68" stroke-width="1"/>
            <!-- 左页单栏斜体活字示意 -->
            ${Array.from({ length: 11 }, (_, i) => `<line x1="22" y1="${34 + i * 10}" x2="${i === 10 ? 64 : 88}" y2="${34 + i * 10}" stroke="#0C0C0C" stroke-width="2" opacity="0.78"/>`).join("")}
            <!-- 右页单栏斜体活字示意 -->
            ${Array.from({ length: 11 }, (_, i) => `<line x1="124" y1="${34 + i * 10}" x2="${i === 6 ? 170 : 190}" y2="${34 + i * 10}" stroke="#0C0C0C" stroke-width="2" opacity="0.78"/>`).join("")}
            ${guides ? `
              <rect x="22" y="26" width="66" height="114" fill="none" stroke="#FF7457" stroke-width="1.2" stroke-dasharray="3 3"/>
              <rect x="124" y="26" width="66" height="114" fill="none" stroke="#FF7457" stroke-width="1.2" stroke-dasharray="3 3"/>
              <line x1="106" y1="-16" x2="106" y2="194" stroke="#FF7457" stroke-width="1" stroke-dasharray="2 3"/>
              <text x="106" y="-22" fill="#FF7457" font-size="10.5" font-family="Space Mono, monospace" text-anchor="middle">1501 OCTAVO · 单栏口袋本</text>
              <text x="55" y="164" fill="#B0250C" font-size="9.5" font-family="Space Mono, monospace" text-anchor="middle">拇指留白</text>
            ` : ""}
          </g>
          <path d="M236 160 L258 160" stroke="#FF7457" stroke-width="1.6" marker-end="none"/>
          <polygon points="256,155 264,160 256,165" fill="#FF7457"/>
          <text x="260" y="318" fill="#C9BEB1" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">纸幅折半三次成八开 · 单栏恰容一行诗句</text>
        `;
      },
    },
    canon: {
      code: "CANON · 2:3:4:6 · 古典单栏版心",
      title: "奇肖尔德《书的形式》：不用尺子画出和谐留白",
      p1: "扬·奇肖尔德（1975 德文汇编 / 1991 英文版，罗伯特·布林赫斯特作序）整理出中世纪手稿与早期印刷书共用的「古典版心构造」：在 2:3 比例的跨页上拉出整跨对角线与单页对角线，其交点天然切出 9×9 网格。",
      p2: "按此构造落出的单栏版心与纸页同为 2:3，四边留白比例恰为内 2 : 上 3 : 外 4 : 下 6——既保住单栏行宽克制，又给左右翻页与拇指托书留出大气的护城河。",
      draw(guides) {
        // 精确 2:3 跨页（每页 180×270，跨页 360×270，居中放于 520×340）
        const x0 = 80;
        const y0 = 32;
        const pw = 180;
        const ph = 270;
        const u = pw / 9; // 20px
        const v = ph / 9; // 30px
        // 左页版心：外(左)2u=40, 内(右)1u=20 -> x = x0 + 2u, w = 6u = 120; 上1v=30, 下2v=60 -> y = y0 + 1v, h = 6v = 180
        // 精确满足 内1(相对双页中缝2):上1.5(3):外2(4):下3(6) -> 2:3:4:6!
        const lx = x0 + 2 * u;
        const ly = y0 + v;
        const bw = 6 * u;
        const bh = 6 * v;
        const rx = x0 + pw + u;
        return `
          <rect x="0" y="0" width="520" height="340" fill="#100E0C"/>
          <!-- 2:3 对开跨页 -->
          <rect x="${x0}" y="${y0}" width="${pw}" height="${ph}" fill="#FBF3EA" stroke="#D6C9B8"/>
          <rect x="${x0 + pw}" y="${y0}" width="${pw}" height="${ph}" fill="#FBF3EA" stroke="#D6C9B8"/>
          <line x1="${x0 + pw}" y1="${y0}" x2="${x0 + pw}" y2="${y0 + ph}" stroke="#756F68" stroke-width="1.2"/>
          <!-- 左/右单栏版心（与纸面同为 2:3） -->
          <rect x="${lx}" y="${ly}" width="${bw}" height="${bh}" fill="#EAE0D2" stroke="#0C0C0C" stroke-width="1"/>
          <rect x="${rx}" y="${ly}" width="${bw}" height="${bh}" fill="#EAE0D2" stroke="#0C0C0C" stroke-width="1"/>
          ${Array.from({ length: 12 }, (_, i) => `
            <line x1="${lx + 10}" y1="${ly + 18 + i * 13}" x2="${lx + bw - (i === 11 ? 38 : 10)}" y2="${ly + 18 + i * 13}" stroke="#0C0C0C" stroke-width="2" opacity="0.65"/>
            <line x1="${rx + 10}" y1="${ly + 18 + i * 13}" x2="${rx + bw - (i === 7 ? 32 : 10)}" y2="${ly + 18 + i * 13}" stroke="#0C0C0C" stroke-width="2" opacity="0.65"/>
          `).join("")}
          ${guides ? `
            <!-- 整跨与单页对角构造线（交点严格落在版心顶角） -->
            <g stroke="#E0381A" stroke-width="1.2" opacity="0.85">
              <line x1="${x0}" y1="${y0 + ph}" x2="${x0 + pw * 2}" y2="${y0}"/>
              <line x1="${x0}" y1="${y0}" x2="${x0 + pw * 2}" y2="${y0 + ph}"/>
              <line x1="${x0}" y1="${y0 + ph}" x2="${x0 + pw}" y2="${y0}"/>
              <line x1="${x0 + pw}" y1="${y0}" x2="${x0 + pw * 2}" y2="${y0 + ph}"/>
            </g>
            <!-- 标注 2 : 3 : 4 : 6 -->
            <g font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#B0250C" text-anchor="middle">
              <text x="${x0 + pw + u / 2}" y="${ly + bh / 2}">2</text>
              <text x="${rx + bw / 2}" y="${y0 + v / 2 + 4}">3</text>
              <text x="${rx + bw + u}" y="${ly + bh / 2}">4</text>
              <text x="${rx + bw / 2}" y="${ly + bh + v + 4}">6</text>
            </g>
            <circle cx="${rx}" cy="${ly}" r="3.5" fill="#E0381A"/>
            <circle cx="${lx + bw}" cy="${ly}" r="3.5" fill="#E0381A"/>
          ` : ""}
          <text x="260" y="324" fill="#C9BEB1" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">内 2 : 上 3 : 外 4 : 下 6 · 版心与页面同比例 2:3</text>
        `;
      },
    },
    swiss: {
      code: "SWISS · 1967 · 现代主义单栏克制",
      title: "1967 年埃米尔·鲁德：空白本身就是积极元素",
      p1: "巴塞尔排印名师埃米尔·鲁德在 1967 年《排印设计》中提出，每行 50–60 字符能够让读者毫不费力地阅读；他不再迷恋死板的对称居中，而是把干净的单栏左齐排入非对称白空间里。",
      p2: "这种克制至今仍是现代技术文档与独立出版物的灵魂：与其用花哨边栏塞满空白，不如让大块留白作为呼吸场，衬托清晰的层次与行宽节奏。",
      draw(guides) {
        return `
          <rect x="0" y="0" width="520" height="340" fill="#100E0C"/>
          <rect x="112" y="24" width="296" height="280" fill="#FBF3EA" stroke="#D6C9B8"/>
          <!-- 非对称瑞士现代单栏：左侧故意空出 2 格留白，右侧落单栏左齐不齐右 -->
          <rect x="206" y="54" width="76" height="10" fill="#E0381A"/>
          <rect x="206" y="72" width="140" height="12" fill="#0C0C0C"/>
          ${[108, 122, 136, 150, 164, 186, 200, 214, 228, 242, 256].map((yy, i) => `
            <rect x="206" y="${yy}" width="${i === 4 || i === 10 ? 112 : 168 - ((i * 11) % 20)}" height="5" fill="#0C0C0C" opacity="0.78"/>
          `).join("")}
          ${guides ? `
            <g stroke="#E0381A" stroke-width="1.1" stroke-dasharray="4 3">
              <line x1="206" y1="24" x2="206" y2="304"/>
              <line x1="374" y1="24" x2="374" y2="304"/>
            </g>
            <text x="159" y="168" fill="#B0250C" font-size="10.5" font-family="Space Mono, monospace" text-anchor="middle">非对称留白</text>
            <text x="290" y="42" fill="#B0250C" font-size="10.5" font-family="Space Mono, monospace" text-anchor="middle">50–60 ch · 左齐散尾</text>
          ` : ""}
          <text x="260" y="324" fill="#C9BEB1" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">RUDER (1967) · 空白衬托秩序，而非等待被填满</text>
        `;
      },
    },
    mobile: {
      code: "RESPONSIVE · 2010s+ · 竖屏单栏回归",
      title: "智能手机时代：桌面网页反而向单栏看齐",
      p1: "2010 年代移动端流量反超桌面后，所有多栏门户在 390px 手机上都被迫折叠成单一竖流。设计师很快发现，被砍掉侧栏干扰的移动长文，读起来比杂乱的三栏桌面网页痛快得多。",
      p2: "于是桌面阅读页反向吸收了移动端的克制：用 max-width 把正文稳稳收在 600–700px 居中走廊里，把屏幕多出来的宽度还给安静的护城河。",
      draw(guides) {
        return `
          <rect x="0" y="0" width="520" height="340" fill="#100E0C"/>
          <!-- 左侧：桌面宽屏限宽单栏 -->
          <g transform="translate(26, 48)">
            <rect x="0" y="0" width="290" height="214" fill="#F2E7D9" stroke="#D6C9B8"/>
            <rect x="0" y="0" width="290" height="18" fill="#292420"/>
            <circle cx="12" cy="9" r="3" fill="#FF7457"/><circle cx="23" cy="9" r="3" fill="#C9BEB1"/>
            <rect x="78" y="18" width="134" height="196" fill="#FDF9F4"/>
            <rect x="92" y="34" width="84" height="9" fill="#0C0C0C"/>
            ${[54, 66, 78, 90, 108, 120, 132, 144, 162, 174].map((yy, i) => `
              <rect x="92" y="${yy}" width="${i === 3 || i === 7 ? 74 : 106}" height="4.5" fill="#453F3A" opacity="0.82"/>
            `).join("")}
            ${guides ? `
              <line x1="78" y1="18" x2="78" y2="214" stroke="#E0381A" stroke-width="1.3" stroke-dasharray="4 3"/>
              <line x1="212" y1="18" x2="212" y2="214" stroke="#E0381A" stroke-width="1.3" stroke-dasharray="4 3"/>
              <text x="145" y="204" fill="#B0250C" font-size="9.5" font-family="Space Mono, monospace" text-anchor="middle">max-width: 640px</text>
            ` : ""}
            <text x="145" y="236" fill="#C9BEB1" font-size="10.5" font-family="Space Mono, monospace" text-anchor="middle">DESKTOP 1440px</text>
          </g>
          <!-- 箭头 -->
          <line x1="330" y1="156" x2="358" y2="156" stroke="#FF7457" stroke-width="1.6"/>
          <polygon points="356,151 364,156 356,161" fill="#FF7457"/>
          <!-- 右侧：手机竖屏 390px -->
          <g transform="translate(378, 36)">
            <rect x="0" y="0" width="114" height="236" rx="12" fill="#FDF9F4" stroke="#C9BEB1" stroke-width="2"/>
            <rect x="38" y="8" width="38" height="4" rx="2" fill="#756F68"/>
            <rect x="14" y="28" width="66" height="9" fill="#0C0C0C"/>
            ${[48, 60, 72, 84, 102, 114, 126, 138, 156, 168, 180, 192].map((yy, i) => `
              <rect x="14" y="${yy}" width="${i % 4 === 3 ? 58 : 86}" height="4.5" fill="#453F3A" opacity="0.82"/>
            `).join("")}
            ${guides ? `
              <line x1="14" y1="20" x2="14" y2="220" stroke="#E0381A" stroke-width="1.2" stroke-dasharray="3 3"/>
              <line x1="100" y1="20" x2="100" y2="220" stroke="#E0381A" stroke-width="1.2" stroke-dasharray="3 3"/>
            ` : ""}
            <text x="57" y="256" fill="#C9BEB1" font-size="10.5" font-family="Space Mono, monospace" text-anchor="middle">MOBILE 390px</text>
          </g>
          <text x="260" y="324" fill="#C9BEB1" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">同一条阅读走廊：小屏自然贴边，大屏主动留白</text>
        `;
      },
    },
  };

  let curEra = "aldus";
  let showGuides = true;

  function render() {
    const era = ERAS[curEra];
    svg.innerHTML = era.draw(showGuides);
    specCode.textContent = era.code;
    titleEl.textContent = era.title;
    p1El.textContent = era.p1;
    p2El.textContent = era.p2;
    btnCanon.setAttribute("aria-pressed", String(showGuides));
    btnCanon.textContent = showGuides ? "隐藏几何构造线" : "显影几何构造线";
    tabs.forEach((t) => {
      const on = t.dataset.era === curEra;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => { curEra = t.dataset.era; render(); }));
  btnCanon.addEventListener("click", () => { showGuides = !showGuides; render(); });
  render();
}

// ==================== 04 文字墙 4 开关破墙器 ====================
function initWallBreaker() {
  const root = $("#w-pacing");
  if (!root) return;
  const switches = $$(".pace-switch[data-pace]", root);
  const article = $("#wp-article");
  const levelEl = $("#pace-level");
  const fillEl = $("#pace-fill");
  const noteEl = $("#pace-note");
  const meterEl = $(".breath-meter", root);

  const flags = { para: false, subhead: false, dots: false, breakout: false };

  const P1 = "很多人在做单栏长文时，以为把宽度缩到 600px 就万事大吉。可一旦整篇文章从头到尾没有段落停顿，几十行黑字压成一大块暗灰砖墙，读者的耐心在五秒内就会耗光。";
  const P2 = "单栏缺少双栏或多栏的横向变化，因此更依赖纵向的呼吸节拍。每三四行换一次气、在观点转折处落一枚简短路标，读者的视线才能像走台阶一样一级一级稳稳往下落。";
  const P3 = "必要时，还可以让一句核心论断或一张配图微微跳出虚线栏轨，像鼓点一样敲醒注意力，再把视线轻柔地交回原本安静的正文走廊。";

  function render() {
    const count = Object.values(flags).filter(Boolean).length;
    article.classList.toggle("is-wall", !flags.para);
    article.classList.toggle("has-para", flags.para);

    const parts = [];
    if (flags.subhead) {
      parts.push(`<div class="wp-kicker"><i></i><span>PACING SPECIMEN · 呼吸节拍试样</span></div>`);
    }

    if (!flags.para) {
      // 未拆段：所有文字挤成密闭砖墙，即使开了部分其他开关也先呈现砖墙压力
      parts.push(`<p>${P1}${P2}${P3}</p>`);
      if (flags.dots) {
        parts.push(`<div class="wp-dot-div" aria-hidden="true"><span></span><i></i><span></span></div>`);
      }
      if (flags.breakout) {
        parts.push(renderBreakout());
      }
    } else {
      parts.push(`<p>${P1}</p>`);
      if (flags.dots) {
        parts.push(`<div class="wp-dot-div" aria-hidden="true"><span></span><i></i><span></span></div>`);
      }
      if (flags.subhead) {
        parts.push(`<h4 class="wp-subhead">把纵读切出台阶，而不是铺平坡道</h4>`);
      }
      parts.push(`<p>${P2}</p>`);
      if (flags.breakout) {
        parts.push(renderBreakout());
      }
      parts.push(`<p>${P3}</p>`);
    }

    article.innerHTML = parts.join("");

    const labels = [
      "0 / 4 · 密闭文字墙",
      "1 / 4 · 刚透出一点气口",
      "2 / 4 · 节奏初具雏形",
      "3 / 4 · 清晰耐读专栏",
      "4 / 4 · 完整出版级节拍",
    ];
    const widths = [12, 36, 62, 84, 100];
    const notes = [
      "整段没有换气口，眼睛往下滑 5 秒就会觉得发闷，读者很容易直接关掉页面。",
      flags.para
        ? "拆成短段后压迫感立刻减半，但还缺少扫读路标，读者一眼抓不到这段在讲什么。"
        : "虽然加了一点装饰或引语，但正文还黏成一大堵灰墙——先打开 01「拆短段落」最见效。",
      "已经甩掉了文字墙的压迫感，视线能顺着空白气口往下走；再补上路标或破栏高潮会更耐读。",
      "段落呼吸、扫描锚点与层次变化齐备，连续叙事既流畅又不单调。",
      "短段换气 + 小标路标 + 原海报圆点转场 + 破栏高潮四拍合鸣：这才是单栏「连续叙事」的本来面目。",
    ];

    levelEl.textContent = labels[count];
    fillEl.style.width = `${widths[count]}%`;
    noteEl.textContent = notes[count];
    meterEl.classList.toggle("is-ok", count >= 2 && flags.para);

    switches.forEach((btn) => {
      const on = flags[btn.dataset.pace];
      btn.setAttribute("aria-pressed", String(on));
      const pill = $(".sw-pill", btn);
      if (pill) pill.textContent = on ? "开" : "关";
    });
  }

  function renderBreakout() {
    return `
      <div class="wp-breakout">
        <div class="wp-breakout-art" aria-hidden="true">
          <svg viewBox="0 0 48 36" width="44" height="32">
            <g fill="#0C0C0C">
              <circle cx="12" cy="8" r="1.8"/><circle cx="20" cy="8" r="1.8"/><circle cx="28" cy="8" r="1.8"/><circle cx="36" cy="8" r="1.8"/>
              <circle cx="12" cy="15" r="1.8"/><circle cx="20" cy="15" r="1.8"/><circle cx="28" cy="15" r="1.8"/><circle cx="36" cy="15" r="1.8"/>
              <circle cx="12" cy="22" r="1.8"/><circle cx="20" cy="22" r="1.8"/><circle cx="28" cy="22" r="1.8"/><circle cx="36" cy="22" r="1.8"/>
              <circle cx="12" cy="29" r="1.8"/><circle cx="20" cy="29" r="1.8"/><circle cx="28" cy="29" r="1.8"/><circle cx="36" cy="29" r="1.8"/>
            </g>
          </svg>
        </div>
        <blockquote>“单栏的节拍不在多加一列，而在让视线有节奏地停顿、跃起、再落回走廊。”</blockquote>
      </div>
    `;
  }

  switches.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.pace;
      flags[k] = !flags[k];
      render();
    });
  });
  render();
}

// ==================== 05 6 场景速判翻牌桌 ====================
function initScenarioDeck() {
  const grid = $("#deck-grid");
  const progress = $("#deck-progress");
  if (!grid) return;

  const ITEMS = [
    {
      type: "EDITORIAL · 长文阅读",
      title: "8000 字人物深度专访",
      brief: "桌面端独立专栏网页，读者希望按叙事顺序沉下心读完整篇访谈。",
      useSingle: true,
      pill: "推荐单栏",
      reason: "线性叙事最怕侧边栏分散注意力。把正文限宽在 600–680px 单栏居中，用小标题和破栏照片稳住纵向节奏。",
    },
    {
      type: "COMPARE · 价格方案",
      title: "SaaS 三档会员套餐对比",
      brief: "用户要在基础版、专业版、企业版之间逐项比对额度与价格差异。",
      useSingle: false,
      pill: "改用多栏",
      reason: "核心任务是横向同排比对。硬排成单栏只能上下反复滚屏靠记忆对比；桌面端请改用 134 多栏版式。",
    },
    {
      type: "CONVERSION · 结账表单",
      title: "电商收货与支付信息页",
      brief: "包含姓名、电话、省市区、街道地址、发票等 8 个顺序填写字段。",
      useSingle: true,
      pill: "推荐单栏",
      reason: "Baymard 研究所的结账测试证实，单栏顺序填写能减少漏填与顺序误判；仅「省/市/邮编」等短组合同行并排。",
    },
    {
      type: "PARALLEL · 双语对照",
      title: "中英对照学术译注",
      brief: "读者需要逐句核对左页英文原文与右页中文译文和注释。",
      useSingle: false,
      pill: "改用双栏",
      reason: "译本对照依赖视线水平来回对齐，单栏会把原文和译文拆得很远；这是 133 双栏版式的典型主场。",
    },
    {
      type: "MOBILE · 竖屏实录",
      title: "播客单集文字实录",
      brief: "通勤族主要在手机端一边听音频、一边顺着时间轴往下扫读金句。",
      useSingle: true,
      pill: "推荐单栏",
      reason: "时间轴与说话人分段天然线性，叠加单手持握的竖屏物理约束，单栏是最省力的阅读结构。",
    },
    {
      type: "DASHBOARD · 高密监控",
      title: "机房服务器状态大屏",
      brief: "值班工程师需要在 27 寸显示器上一眼扫完 12 路实时告警曲线。",
      useSingle: false,
      pill: "改用网格/多栏",
      reason: "高密度同屏巡检追求单位屏幕的信息吞吐量，强排单栏会白白浪费大片横向视野，且关键告警被挤到折线以下。",
    },
  ];

  const picked = new Map();

  function render() {
    progress.textContent = `已判断 ${picked.size} / ${ITEMS.length}`;
    grid.innerHTML = ITEMS.map((item, idx) => {
      const choice = picked.get(idx); // undefined | true | false
      const revealed = choice !== undefined;
      const right = revealed && choice === item.useSingle;
      const cls = revealed ? `sc-card is-revealed ${item.useSingle ? "is-use" : "is-skip"}` : "sc-card";
      return `
        <article class="${cls}">
          <div>
            <div class="sc-top">
              <span class="sc-type">${item.type}</span>
            </div>
            <h4>${item.title}</h4>
            <p class="sc-brief">${item.brief}</p>
          </div>
          ${revealed ? `
            <div class="sc-answer">
              <span class="sc-verdict-pill">${item.pill}</span>
              <p class="sc-call-note">${right ? "判断准确" : "换个角度看"}：</p>
              <p>${item.reason}</p>
            </div>
          ` : `
            <div class="sc-btn-row">
              <button type="button" class="sc-btn" data-sc="${idx}" data-pick="yes">用单栏</button>
              <button type="button" class="sc-btn" data-sc="${idx}" data-pick="no">换版式</button>
            </div>
          `}
        </article>
      `;
    }).join("");

    $$(".sc-btn", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        picked.set(Number(btn.dataset.sc), btn.dataset.pick === "yes");
        render();
      });
    });
  }

  render();
}

// ==================== 06 两道审图小练习（含中性 SVG 版式简图） ====================
function initQuizzes() {
  const stack = $("#quiz-stack");
  if (!stack) return;

  const QUIZZES = [
    {
      num: "EXERCISE 01 / 02",
      title: "1440px 桌面端深度长文专栏",
      stem: "同一篇 16px 中文书刊特稿，仅改变栏宽与侧栏配置。哪一版最符合单栏版式的核心原则？",
      answer: "B",
      options: [
        {
          id: "A",
          spec: "居中单栏 1240px（约 74 字/行），无侧栏",
          svg: () => miniPageSVG(`
            <line x1="16" y1="6" x2="16" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <line x1="204" y1="6" x2="204" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <rect x="24" y="20" width="96" height="8" fill="#0C0C0C"/>
            ${[38, 49, 60, 71, 82, 93, 104].map((y, i) => `<rect x="24" y="${y}" width="${i === 6 ? 120 : 172}" height="4" fill="#453F3A"/>`).join("")}
          `),
          why: "A 虽无侧栏，但 1240px 让每行拉到约 74 个汉字，远超 WCAG 40 字上限，扫完行尾回找下一行极易串行，两侧几乎没有护城河。",
        },
        {
          id: "B",
          spec: "居中单栏 600px（约 34 字/行），无侧栏",
          svg: () => miniPageSVG(`
            <line x1="62" y1="6" x2="62" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <line x1="158" y1="6" x2="158" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <rect x="70" y="20" width="62" height="8" fill="#0C0C0C"/>
            ${[38, 49, 60, 71, 86, 97, 108].map((y, i) => `<rect x="70" y="${y}" width="${i === 3 || i === 6 ? 56 : 80}" height="4" fill="#453F3A"/>`).join("")}
          `),
          why: "B 把行宽稳稳收在约 34 字/行，落在中文舒适精读区与 WCAG 40 字以内，左右留白护城河充裕且没有旁路干扰。",
        },
        {
          id: "C",
          spec: "居中单栏 230px（约 12 字/行），无侧栏",
          svg: () => miniPageSVG(`
            <line x1="90" y1="6" x2="90" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <line x1="130" y1="6" x2="130" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <rect x="95" y="18" width="28" height="7" fill="#0C0C0C"/>
            ${[32, 41, 50, 59, 68, 77, 86, 95, 104, 113].map((y) => `<rect x="95" y="${y}" width="30" height="3.8" fill="#453F3A"/>`).join("")}
          `),
          why: "C 把栏挤到仅 12 字一行，句子被劈成碎片，眼睛高频左右拉锯，连续叙事的流畅感被折断。",
        },
        {
          id: "D",
          spec: "左 600px 主栏 + 右 320px 推荐侧栏",
          svg: () => miniPageSVG(`
            <line x1="28" y1="6" x2="28" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <line x1="124" y1="6" x2="124" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <rect x="36" y="20" width="60" height="8" fill="#0C0C0C"/>
            ${[38, 49, 60, 71, 86, 97, 108].map((y, i) => `<rect x="36" y="${y}" width="${i === 3 ? 52 : 80}" height="4" fill="#453F3A"/>`).join("")}
            <rect x="138" y="20" width="56" height="88" fill="#EAE0D2" stroke="#756F68"/>
            <rect x="145" y="30" width="42" height="18" fill="#756F68" opacity="0.55"/>
            <rect x="145" y="56" width="38" height="4" fill="#5F5850"/>
            <rect x="145" y="66" width="42" height="4" fill="#5F5850"/>
            <rect x="145" y="76" width="34" height="4" fill="#5F5850"/>
          `),
          why: "D 主栏宽度虽合适，但右侧挂了一块带图卡的推荐侧栏，打破了单一视线，本质上已滑向主次双栏。",
        },
      ],
    },
    {
      num: "EXERCISE 02 / 02",
      title: "1280px 桌面端结账 6 字段表单",
      stem: "同一份包含姓名、电话、省/市/邮编、详细地址的结账表单，仅改变栏排组织。哪一版最利于顺序无误填完？",
      answer: "C",
      options: [
        {
          id: "A",
          spec: "左右双栏 3×2 交错排列，等宽占 960px",
          svg: () => miniPageSVG(`
            ${[24, 56, 88].map((y) => `
              <rect x="26" y="${y}" width="32" height="4" fill="#0C0C0C"/>
              <rect x="26" y="${y + 7}" width="76" height="14" fill="#FDF9F4" stroke="#5F5850"/>
              <rect x="118" y="${y}" width="32" height="4" fill="#0C0C0C"/>
              <rect x="118" y="${y + 7}" width="76" height="14" fill="#FDF9F4" stroke="#5F5850"/>
            `).join("")}
          `),
          why: "A 把顺序填写劈成左右两列，用户常在「先填右边还是先填下面」之间犹豫，容易漏填右侧字段。",
        },
        {
          id: "B",
          spec: "单栏全部拉满 1080px 全宽输入条",
          svg: () => miniPageSVG(`
            ${[18, 44, 70, 96].map((y) => `
              <rect x="16" y="${y}" width="34" height="4" fill="#0C0C0C"/>
              <rect x="16" y="${y + 7}" width="188" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            `).join("")}
          `),
          why: "B 虽然是单栏，但姓名与手机号被强行拉成横贯全屏的 1080px 长条，表单宽度与预期输入长度严重失配，视线左右跨度太大。",
        },
        {
          id: "C",
          spec: "单栏收束 480px，「省/市/邮编」同行短组",
          svg: () => miniPageSVG(`
            <line x1="64" y1="6" x2="64" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <line x1="156" y1="6" x2="156" y2="126" stroke="#756F68" stroke-dasharray="3 3"/>
            <rect x="72" y="16" width="28" height="4" fill="#0C0C0C"/>
            <rect x="72" y="23" width="60" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="72" y="42" width="32" height="4" fill="#0C0C0C"/>
            <rect x="72" y="49" width="68" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="72" y="68" width="42" height="4" fill="#0C0C0C"/>
            <rect x="72" y="75" width="24" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="99" y="75" width="24" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="126" y="75" width="22" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="72" y="94" width="34" height="4" fill="#0C0C0C"/>
            <rect x="72" y="101" width="76" height="12" fill="#FDF9F4" stroke="#5F5850"/>
          `),
          why: "C 将整份表单稳收在 480px 单一垂直走廊里，符合 Baymard 单栏表单建议；同时把逻辑一体的「省/市/邮编」短组同行并排，紧凑不打结。",
        },
        {
          id: "D",
          spec: "单栏 480px，但所有标签与输入框居中对齐",
          svg: () => miniPageSVG(`
            <rect x="94" y="16" width="32" height="4" fill="#0C0C0C"/>
            <rect x="82" y="23" width="56" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="90" y="42" width="40" height="4" fill="#0C0C0C"/>
            <rect x="70" y="49" width="80" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="96" y="68" width="28" height="4" fill="#0C0C0C"/>
            <rect x="86" y="75" width="48" height="12" fill="#FDF9F4" stroke="#5F5850"/>
            <rect x="88" y="94" width="44" height="4" fill="#0C0C0C"/>
            <rect x="66" y="101" width="88" height="12" fill="#FDF9F4" stroke="#5F5850"/>
          `),
          why: "D 丢掉了单栏稳定的左侧垂直起点线，每填完一格都要重新左右寻位，锯齿左缘让顺序扫描效率大打折扣。",
        },
      ],
    },
  ];

  function miniPageSVG(inner) {
    return `<svg class="quiz-svg" viewBox="0 0 220 132" aria-hidden="true"><rect x="0" y="0" width="220" height="132" fill="#FBF3EA"/>${inner}</svg>`;
  }

  const state = QUIZZES.map(() => null);

  function render() {
    stack.innerHTML = QUIZZES.map((q, qi) => {
      const pick = state[qi];
      const answered = pick !== null;
      const isRight = pick === q.answer;
      return `
        <article class="quiz-box" data-quiz="${qi}">
          <div class="quiz-header">
            <span class="quiz-num">${q.num}</span>
            ${answered ? `<button type="button" class="quiz-reset" data-reset="${qi}">重做本题</button>` : ""}
          </div>
          <h3>${q.title}</h3>
          <p class="quiz-stem">${q.stem}</p>
          <div class="quiz-options">
            ${q.options.map((opt) => {
              let cls = "quiz-opt";
              if (answered) {
                if (opt.id === q.answer) cls += pick === opt.id ? " is-picked-ok" : " is-reveal-ok";
                else if (opt.id === pick) cls += " is-picked-bad";
              }
              return `
                <button type="button" class="${cls}" data-q="${qi}" data-opt="${opt.id}" aria-pressed="${pick === opt.id}">
                  ${opt.svg()}
                  <div class="quiz-opt-head">
                    <span>方案 ${opt.id}</span>
                    ${answered && opt.id === q.answer ? "<span>✓ 推荐</span>" : ""}
                    ${answered && opt.id === pick && opt.id !== q.answer ? "<span>× 所选</span>" : ""}
                  </div>
                  <span class="quiz-opt-spec">${opt.spec}</span>
                </button>
              `;
            }).join("")}
          </div>
          ${answered ? `
            <div class="quiz-feedback ${isRight ? "" : "is-wrong"}" aria-live="polite">
              <h4>${isRight ? `选对了：方案 ${q.answer} 最稳妥` : `差一点：本题更推荐方案 ${q.answer}`}</h4>
              <p>${q.options.find((o) => o.id === q.answer).why}</p>
              <ul>
                ${q.options.filter((o) => o.id !== q.answer).map((o) => `<li>${o.why}</li>`).join("")}
              </ul>
            </div>
          ` : ""}
        </article>
      `;
    }).join("");

    $$(".quiz-opt", stack).forEach((btn) => {
      btn.addEventListener("click", () => {
        state[Number(btn.dataset.q)] = btn.dataset.opt;
        render();
      });
    });
    $$(".quiz-reset", stack).forEach((btn) => {
      btn.addEventListener("click", () => {
        state[Number(btn.dataset.reset)] = null;
        render();
      });
    });
  }

  render();
}

// ==================== 07 原海报灯箱（复用 #poster.src，可缩放/拖动/Esc 关闭） ====================
function initPosterLightbox() {
  const trigger = $("#poster-trigger");
  const posterImg = $("#poster");
  const lb = $("#lightbox");
  const lbImg = $("#lb-img");
  const lbStage = $("#lb-stage");
  const btnIn = $("#lb-in");
  const btnOut = $("#lb-out");
  const btnReset = $("#lb-reset");
  const btnClose = $("#lb-close");
  const zoomVal = $("#lb-zoom-val");
  if (!trigger || !posterImg || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = clamp(+(scale + 0.35).toFixed(2), 0.7, 3.5); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = clamp(+(scale - 0.35).toFixed(2), 0.7, 3.5); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(+(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2), 0.7, 3.5);
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1.01) {
      close();
      return;
    }
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY, tx, ty };
    lbStage.classList.add("is-panning");
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = pan.tx + (e.clientX - pan.x);
    ty = pan.ty + (e.clientY - pan.y);
    applyTransform();
  });
  const endPan = () => { pan = null; lbStage.classList.remove("is-panning"); };
  lbStage.addEventListener("pointerup", endPan);
  lbStage.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// ==================== 启动 ====================
initHeroWorkbench();
initViewportSim();
initMeasureLab();
initEraTimeline();
initWallBreaker();
initScenarioDeck();
initQuizzes();
initPosterLightbox();
