// 198 基线网格 · 开场主角舞台（2D Canvas 双栏排印对行台 + 右沿精密纵尺 + 顶沿活体五线解剖）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { BODY_SIZE, PARTS, evaluate, fmtMult, fmtPt, fmtSigned, snapMultiple } from "./model.js";

const COLORS = {
  paper: "#F8F7F6",
  cardBg: "#FFFFFF",
  leftColBg: "#F6F5F3",
  rightColBg: "#FAF9FD",
  ink: "#0D0E12",
  body: "#23252F",
  muted: "#616370",
  border: "#D4D2CF",
  indigo: "#5127C9",
  indigoSoft: "rgba(81, 39, 201, 0.14)",
  indigoLine: "rgba(81, 39, 201, 0.28)",
  indigoStrong: "#5127C9",
  lime: "#C4E52B",
  limeText: "#3C4E00",
  limeFill: "#E0EAA9",
  lavenderFill: "#E2DAEA",
  err: "#C2273B",
  errFill: "rgba(194, 39, 59, 0.10)",
  errStrong: "rgba(194, 39, 59, 0.88)",
  ok: "#5127C9",
};

const FONT_CN = '"Noto Sans SC", sans-serif';
const FONT_EN = '"Chivo", "Noto Sans SC", sans-serif';
const FONT_SERIF = '"EB Garamond", "Noto Sans SC", serif';
const FONT_NUM = '"IBM Plex Sans", "Noto Sans SC", sans-serif';

export function mountHeroStage({ canvas, onStateChange, getState, setState }) {
  const ctx = canvas.getContext("2d");
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgKey = "";
  let width = 760;
  let height = 520;
  let dpr = pixelRatio(2);
  let introProgress = 0; // 开场平滑进场：每一刻都完整好看
  let pulse = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartVal = 0;
  let pointerXNorm = 0.5;
  let hitZones = [];
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    dpr = width < 520 ? pixelRatio(1.5) : pixelRatio(2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgKey = "";
    dirty = true;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function roundRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  // 把不随单次拖动变化的静态层（外框、双色顶栏、基线格网、左栏固定正文、0-240pt 精密刻度尺）缓存到离屏画布
  function ensureStaticLayer(state, res, geom) {
    const { layout } = res;
    const { compact, padL, padT, cardW, cardH, headerH, bodyTop, bodyH, midX, leftW, rightW, colPadX, leftX, leftInnerW, headPx, subPx, bodyPx, scaleY, y0, rulerX } = geom;
    const key = [
      width, height, dpr,
      state.scene, state.grid, state.showLines,
      res.tone, res.passed, layout.rulerMax,
      Math.round(introProgress * 20),
    ].join("|");
    if (key === bgKey) return;
    bgKey = key;

    const g = layout.g;
    const sc = layout.scene;
    const toY = (pt) => y0 + pt * scaleY;

    bgCtx.save();
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.scale(dpr, dpr);

    // 1. 外框
    roundRectPath(bgCtx, padL, padT, cardW, cardH, compact ? 9 : 12);
    bgCtx.fillStyle = COLORS.cardBg;
    bgCtx.fill();
    bgCtx.strokeStyle = COLORS.border;
    bgCtx.lineWidth = 1.25;
    bgCtx.stroke();

    // 2. 卡片左右分色 + 顶栏 + 基线网 + 左栏参照文本
    bgCtx.save();
    roundRectPath(bgCtx, padL, padT, cardW, cardH, compact ? 9 : 12);
    bgCtx.clip();

    bgCtx.fillStyle = COLORS.leftColBg;
    bgCtx.fillRect(padL, bodyTop, leftW, bodyH);
    bgCtx.fillStyle = COLORS.rightColBg;
    bgCtx.fillRect(midX, bodyTop, rightW, bodyH);

    bgCtx.fillStyle = "#2A2B32";
    bgCtx.fillRect(padL, padT, leftW, headerH);
    bgCtx.fillStyle = res.tone === "ok" ? COLORS.indigo : "#5331CA";
    bgCtx.fillRect(midX, padT, rightW, headerH);

    const iconR = compact ? 8 : 10;
    const cyH = padT + headerH / 2;

    bgCtx.beginPath();
    bgCtx.arc(padL + (compact ? 16 : 22), cyH, iconR, 0, Math.PI * 2);
    bgCtx.fillStyle = COLORS.lime;
    bgCtx.fill();
    bgCtx.fillStyle = COLORS.ink;
    bgCtx.font = `700 ${compact ? 10 : 12}px ${FONT_NUM}`;
    bgCtx.textAlign = "center";
    bgCtx.textBaseline = "middle";
    bgCtx.fillText("1×", padL + (compact ? 16 : 22), cyH + 0.5);

    bgCtx.fillStyle = "#F5F4F2";
    bgCtx.font = `700 ${compact ? 11 : 13}px ${FONT_CN}`;
    bgCtx.textAlign = "left";
    bgCtx.fillText(
      compact ? `左栏参照 (${g}pt)` : `左栏 · 基准参照 (${g}pt)`,
      padL + (compact ? 30 : 38),
      cyH + 0.5
    );

    bgCtx.beginPath();
    bgCtx.arc(midX + (compact ? 16 : 22), cyH, iconR, 0, Math.PI * 2);
    bgCtx.fillStyle = res.tone === "ok" ? COLORS.lime : "#FFFFFF";
    bgCtx.fill();
    bgCtx.fillStyle = res.tone === "ok" ? COLORS.ink : COLORS.err;
    bgCtx.font = `700 ${compact ? 11 : 13}px ${FONT_NUM}`;
    bgCtx.textAlign = "center";
    bgCtx.fillText(res.tone === "ok" ? "✓" : "!", midX + (compact ? 16 : 22), cyH + 0.5);

    bgCtx.fillStyle = "#FFFFFF";
    bgCtx.font = `700 ${compact ? 11 : 13}px ${FONT_CN}`;
    bgCtx.textAlign = "left";
    bgCtx.fillText(
      compact
        ? (res.tone === "ok" ? "右栏已齐平" : `右栏调校 (${res.passed}/4)`)
        : (res.tone === "ok" ? "右栏 · 全部踩回基线" : `右栏 · 调校区（已对齐 ${res.passed}/4）`),
      midX + (compact ? 30 : 38),
      cyH + 0.5
    );

    // 贯通双栏基线网格（合并为一次 beginPath/stroke）
    const revealW = cardW * (0.35 + 0.65 * introProgress);
    if (state.showLines) {
      bgCtx.beginPath();
      bgCtx.moveTo(padL, Math.round(toY(0)) + 0.5);
      bgCtx.lineTo(padL + revealW, Math.round(toY(0)) + 0.5);
      bgCtx.strokeStyle = "rgba(81, 39, 201, 0.36)";
      bgCtx.lineWidth = 1;
      bgCtx.stroke();

      bgCtx.beginPath();
      for (let pt = g; pt <= layout.rulerMax; pt += g) {
        const y = Math.round(toY(pt)) + 0.5;
        bgCtx.moveTo(padL, y);
        bgCtx.lineTo(padL + revealW, y);
      }
      bgCtx.strokeStyle = COLORS.indigoLine;
      bgCtx.lineWidth = 0.85;
      bgCtx.setLineDash([3, 3]);
      bgCtx.stroke();
      bgCtx.setLineDash([]);
    }

    // 中缝细线
    bgCtx.beginPath();
    bgCtx.moveTo(midX + 0.5, bodyTop);
    bgCtx.lineTo(midX + 0.5, padT + cardH);
    bgCtx.strokeStyle = COLORS.border;
    bgCtx.lineWidth = 1;
    bgCtx.stroke();

    // 左栏参照标题与第一段正文
    const isLatinHead = state.scene !== "poster";
    bgCtx.textAlign = "left";
    bgCtx.textBaseline = "alphabetic";
    bgCtx.fillStyle = COLORS.ink;
    bgCtx.font = `900 ${headPx}px ${isLatinHead ? FONT_EN : FONT_CN}`;
    bgCtx.fillText(sc.leftHead, leftX, toY(layout.left.headY), leftInnerW);

    bgCtx.fillStyle = COLORS.muted;
    bgCtx.font = `600 ${subPx}px ${isLatinHead ? FONT_SERIF : FONT_CN}`;
    bgCtx.fillText(sc.leftSub, leftX, toY(layout.left.subY), leftInnerW);

    bgCtx.font = `400 ${bodyPx}px ${FONT_CN}`;
    for (const ln of layout.left.p1) {
      const ly = toY(ln.y);
      bgCtx.fillStyle = COLORS.body;
      bgCtx.fillText(ln.text, leftX, ly, leftInnerW);
      bgCtx.beginPath();
      bgCtx.arc(leftX - (compact ? 5 : 8), ly - 2, 2.2, 0, Math.PI * 2);
      bgCtx.fillStyle = COLORS.indigo;
      bgCtx.fill();
    }
    bgCtx.restore(); // 结束 clip

    // 右侧精密 0..240pt 纵尺（合批路径）
    bgCtx.save();
    bgCtx.beginPath();
    bgCtx.moveTo(rulerX + 0.5, toY(0));
    bgCtx.lineTo(rulerX + 0.5, toY(layout.rulerMax));
    const minorStep = Math.max(4, Math.round(g / 6));
    for (let pt = 0; pt <= layout.rulerMax; pt += minorStep) {
      if (pt % g === 0) continue;
      const y = Math.round(toY(pt)) + 0.5;
      const tickLen = pt % (minorStep * 2) === 0 ? 7 : 4;
      bgCtx.moveTo(rulerX, y);
      bgCtx.lineTo(rulerX + tickLen, y);
    }
    bgCtx.strokeStyle = "#B5A8E0";
    bgCtx.lineWidth = 0.85;
    bgCtx.stroke();

    bgCtx.beginPath();
    const majorLen = compact ? 11 : 16;
    bgCtx.fillStyle = COLORS.indigo;
    bgCtx.font = `600 ${compact ? 10 : 11}px ${FONT_NUM}`;
    bgCtx.textAlign = "left";
    bgCtx.textBaseline = "middle";
    for (let pt = 0; pt <= layout.rulerMax; pt += g) {
      const y = Math.round(toY(pt)) + 0.5;
      bgCtx.moveTo(rulerX, y);
      bgCtx.lineTo(rulerX + majorLen, y);
      bgCtx.fillText(String(pt), rulerX + majorLen + 4, y);
    }
    bgCtx.strokeStyle = COLORS.indigo;
    bgCtx.lineWidth = 1.25;
    bgCtx.stroke();

    bgCtx.font = `700 ${compact ? 10 : 11}px ${FONT_CN}`;
    bgCtx.fillText(compact ? "pt" : "单位: pt", rulerX, padT + headerH / 2);
    bgCtx.restore();

    bgCtx.restore();
  }

  function draw(t, dt, { still }) {
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + (dt || 0.016) * 2.2);
      dirty = true;
    }
    if (pulse > 0 && !still) {
      pulse = Math.max(0, pulse - (dt || 0.016) * 2.5);
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    const state = getState();
    const res = evaluate(state);
    const { layout, checks } = res;
    const g = layout.g;

    const compact = width < 520;
    const padL = compact ? 10 : 18;
    const padT = compact ? 8 : 12;
    const padB = compact ? 10 : 14;
    const rulerW = compact ? 44 : 62;
    const cardW = width - padL - rulerW - (compact ? 6 : 12);
    const cardH = height - padT - padB;
    const headerH = compact ? 32 : 38;
    const bodyTop = padT + headerH;
    const bodyH = cardH - headerH;
    const midX = padL + Math.round(cardW * 0.485);
    const leftW = midX - padL;
    const rightW = padL + cardW - midX;
    const scaleY = (bodyH - (compact ? 22 : 28)) / layout.rulerMax;
    const y0 = bodyTop + (compact ? 10 : 14);
    const colPadX = compact ? 10 : 20;
    const leftX = padL + colPadX;
    const leftInnerW = leftW - colPadX * 2;
    const rightX = midX + colPadX;
    const rightInnerW = rightW - colPadX * 2;
    const headPx = Math.max(12, Math.min(compact ? 15 : 20, g * scaleY * 0.76));
    const subPx = Math.max(10, Math.min(compact ? 11 : 13, g * scaleY * 0.48));
    const bodyPx = Math.max(10, Math.min(compact ? 11 : 13.5, BODY_SIZE * scaleY * 0.96));
    const rulerX = padL + cardW + (compact ? 6 : 12);
    const toY = (pt) => y0 + pt * scaleY;

    ensureStaticLayer(state, res, {
      compact, padL, padT, cardW, cardH, headerH, bodyTop, bodyH, midX, leftW, rightW,
      colPadX, leftX, leftInnerW, headPx, subPx, bodyPx, scaleY, y0, rulerX,
    });

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 1 次 drawImage 贴完所有静态底图、格网、左栏和 0-240pt 纵尺！
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.scale(dpr, dpr);

    // 动态层（只绘制可拖拽变化的 4 个排印构件 + 校验线）
    hitZones = [];
    const sc = layout.scene;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 构件 4：左栏配图/引文框（boxHeight）
    const boxTopPx = toY(layout.left.boxTopAnchor) + 6;
    const boxBotPx = toY(layout.left.boxBottomY);
    const boxHpx = Math.max(24, boxBotPx - boxTopPx);
    const boxSelected = state.activePart === "boxHeight";
    const boxOk = checks.boxOk;

    hitZones.push({
      part: "boxHeight",
      x: leftX - 4,
      y: boxTopPx - 4,
      w: leftInnerW + 8,
      h: boxHpx + 18,
    });

    ctx.save();
    roundRectPath(ctx, leftX, boxTopPx, leftInnerW, boxHpx, 5);
    ctx.fillStyle = state.scene === "poster"
      ? (boxOk ? "#EBE7F7" : "#F5ECE8")
      : (state.scene === "magazine" ? "#D8D9DE" : "#CFD1D7");
    ctx.fill();

    if (state.scene !== "poster") {
      ctx.save();
      roundRectPath(ctx, leftX, boxTopPx, leftInnerW, boxHpx, 5);
      ctx.clip();
      ctx.fillStyle = "#B7BAC4";
      ctx.beginPath();
      ctx.moveTo(leftX + leftInnerW * 0.35, boxBotPx);
      ctx.lineTo(leftX + leftInnerW * 0.72, boxTopPx + 8);
      ctx.lineTo(leftX + leftInnerW, boxTopPx + boxHpx * 0.35);
      ctx.lineTo(leftX + leftInnerW, boxBotPx);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2E303A";
      ctx.beginPath();
      ctx.moveTo(leftX + leftInnerW * 0.62, boxBotPx);
      ctx.lineTo(leftX + leftInnerW * 0.88, boxTopPx + boxHpx * 0.25);
      ctx.lineTo(leftX + leftInnerW, boxBotPx);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.lime;
      ctx.fillRect(leftX + 10, boxTopPx + 10, Math.min(44, leftInnerW * 0.3), 5);
      ctx.restore();
    } else {
      ctx.fillStyle = boxOk ? COLORS.indigo : COLORS.err;
      ctx.fillRect(leftX, boxTopPx, 4, boxHpx);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${Math.max(10, bodyPx - 1)}px ${FONT_CN}`;
      ctx.textBaseline = "top";
      ctx.fillText(sc.leftBoxTitle, leftX + 10, boxTopPx + 7, leftInnerW - 16);
      if (boxHpx > 36) {
        ctx.fillStyle = COLORS.muted;
        ctx.font = `400 ${Math.max(10, bodyPx - 2)}px ${FONT_CN}`;
        ctx.fillText(sc.leftBoxQuote.slice(0, compact ? 13 : 19), leftX + 10, boxTopPx + 24, leftInnerW - 16);
      }
      ctx.textBaseline = "alphabetic";
    }

    ctx.strokeStyle = boxSelected
      ? (boxOk ? COLORS.indigo : COLORS.err)
      : (boxOk ? "rgba(81,39,201,0.45)" : COLORS.err);
    ctx.lineWidth = boxSelected ? 2 : 1.25;
    if (!boxOk) ctx.setLineDash([4, 3]);
    roundRectPath(ctx, leftX, boxTopPx, leftInnerW, boxHpx, 5);
    ctx.stroke();
    ctx.setLineDash([]);

    drawTag(
      ctx,
      leftX + leftInnerW - 2,
      boxBotPx,
      compact
        ? (boxOk ? `图框 ${fmtMult(state.boxHeight, g)}✓` : `图框 ${state.boxHeight}(${fmtSigned(layout.left.boxErr)})`)
        : (boxOk ? `图框 ${fmtMult(state.boxHeight, g)} ✓` : `图框 ${state.boxHeight}pt (${fmtSigned(layout.left.boxErr)})`),
      boxOk ? COLORS.indigo : COLORS.err,
      "#FFFFFF",
      "right",
      compact
    );
    ctx.restore();

    const capY = toY(layout.left.captionY);
    ctx.fillStyle = checks.boxOk ? COLORS.muted : COLORS.err;
    ctx.font = `500 ${Math.max(10, bodyPx - 1.5)}px ${FONT_CN}`;
    ctx.fillText(sc.leftCaption, leftX, capY, leftInnerW);
    if (!checks.boxOk) {
      drawDriftTick(ctx, leftX - 4, capY, toY(Math.round(layout.left.captionY / g) * g));
    }

    // 构件 2：标题总高区（0 .. titleBlock）
    const titleTopPx = toY(0) + 2;
    const titleBotPx = toY(layout.right.titleEnd);
    const titleSelected = state.activePart === "titleBlock";
    const titleOk = checks.titleOk;
    hitZones.push({
      part: "titleBlock",
      x: rightX - 6,
      y: titleTopPx,
      w: rightInnerW + 12,
      h: Math.max(28, titleBotPx - titleTopPx),
    });

    ctx.save();
    ctx.fillStyle = titleSelected
      ? (titleOk ? "rgba(81,39,201,0.08)" : "rgba(194,39,59,0.09)")
      : (titleOk ? "rgba(81,39,201,0.03)" : "rgba(194,39,59,0.05)");
    roundRectPath(ctx, rightX - 5, titleTopPx, rightInnerW + 10, Math.max(20, titleBotPx - titleTopPx - 3), 5);
    ctx.fill();
    ctx.strokeStyle = titleSelected ? (titleOk ? COLORS.indigo : COLORS.err) : (titleOk ? "rgba(81,39,201,0.28)" : COLORS.err);
    ctx.lineWidth = titleSelected ? 2 : 1;
    if (!titleOk) ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.ink;
    ctx.font = `900 ${headPx}px ${FONT_CN}`;
    const rHeadPx = Math.max(titleTopPx + (compact ? 22 : 24), toY(layout.right.headY));
    const rSubPx = Math.max(rHeadPx + (compact ? 14 : 17), toY(layout.right.subY));
    ctx.fillText(sc.rightHead, rightX, rHeadPx, rightInnerW);

    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 ${subPx}px ${state.scene === "poster" ? FONT_CN : FONT_EN}`;
    ctx.fillText(sc.rightSub, rightX, Math.min(titleBotPx - 6, rSubPx), rightInnerW);

    drawTag(
      ctx,
      rightX + rightInnerW + 3,
      titleTopPx + 1,
      compact
        ? (titleOk ? `标题 ${fmtMult(state.titleBlock, g)}✓` : `标题 ${state.titleBlock}(${fmtSigned(layout.right.titleErr)})`)
        : (titleOk ? `标题 ${fmtMult(state.titleBlock, g)} ✓` : `标题 ${state.titleBlock}pt (${fmtSigned(layout.right.titleErr)})`),
      titleOk ? COLORS.indigo : COLORS.err,
      "#FFFFFF",
      "right",
      compact
    );
    ctx.restore();

    // 构件 1：右栏第一段正文（行距 rightLead）
    const p1TopPx = toY(layout.right.p1[0].y) - bodyPx - 2;
    const p1BotPx = toY(layout.right.p1[layout.right.p1.length - 1].y) + 6;
    const leadSelected = state.activePart === "rightLead";
    const leadOk = checks.leadOk;

    hitZones.push({
      part: "rightLead",
      x: rightX - 6,
      y: p1TopPx,
      w: rightInnerW + 12,
      h: Math.max(36, p1BotPx - p1TopPx),
    });

    if (leadSelected || !leadOk) {
      ctx.save();
      ctx.fillStyle = leadSelected
        ? (leadOk ? "rgba(81,39,201,0.07)" : "rgba(194,39,59,0.08)")
        : "rgba(194,39,59,0.04)";
      roundRectPath(ctx, rightX - 5, p1TopPx, rightInnerW + 10, p1BotPx - p1TopPx, 5);
      ctx.fill();
      ctx.strokeStyle = leadSelected ? (leadOk ? COLORS.indigo : COLORS.err) : "rgba(194,39,59,0.55)";
      ctx.lineWidth = leadSelected ? 2 : 1;
      if (!leadOk) ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    for (const ln of layout.right.p1) {
      drawAlignedLine(ctx, ln, rightX, rightInnerW, bodyPx, toY, g, midX, compact);
    }

    drawTag(
      ctx,
      rightX + rightInnerW + 3,
      p1TopPx - (compact ? 6 : 2),
      compact
        ? (leadOk ? `行距 ${state.rightLead}✓` : `行距 ${state.rightLead}≠${g}`)
        : (leadOk ? `行距 ${state.rightLead}pt ✓` : `行距 ${state.rightLead}pt (≠${g}pt)`),
      leadOk ? COLORS.indigo : COLORS.err,
      "#FFFFFF",
      "right",
      compact
    );

    // 构件 3：段间留白区
    const gapTopPx = toY(layout.right.p1[layout.right.p1.length - 1].y) + 4;
    const gapBotPx = toY(layout.right.p2StartY) - bodyPx - 2;
    const gapZoneH = Math.max(16, gapBotPx - gapTopPx);
    const gapSelected = state.activePart === "paraGap";
    const gapOk = checks.gapOk;

    hitZones.push({
      part: "paraGap",
      x: rightX - 6,
      y: gapTopPx - 2,
      w: rightInnerW + 12,
      h: gapZoneH + 6,
    });

    ctx.save();
    ctx.fillStyle = gapOk
      ? (gapSelected ? "rgba(196,229,43,0.34)" : "rgba(196,229,43,0.18)")
      : (gapSelected ? "rgba(194,39,59,0.16)" : "rgba(194,39,59,0.09)");
    ctx.fillRect(rightX - 4, gapTopPx, rightInnerW + 8, gapZoneH);
    ctx.strokeStyle = gapSelected ? (gapOk ? COLORS.indigo : COLORS.err) : (gapOk ? "rgba(81,39,201,0.35)" : COLORS.err);
    ctx.lineWidth = gapSelected ? 1.8 : 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(rightX - 4, gapTopPx, rightInnerW + 8, gapZoneH);
    ctx.setLineDash([]);

    drawTag(
      ctx,
      rightX + rightInnerW + 3,
      gapTopPx + gapZoneH / 2,
      compact
        ? (gapOk ? `段距 ${fmtMult(state.paraGap, g)}✓` : `段距 ${state.paraGap}(${fmtSigned(res.layout.metrics.gapErr)})`)
        : (gapOk ? `段距 ${fmtMult(state.paraGap, g)} ✓` : `段距 ${state.paraGap}pt (${fmtSigned(res.layout.metrics.gapErr)})`),
      gapOk ? COLORS.lime : COLORS.err,
      gapOk ? COLORS.ink : "#FFFFFF",
      "right",
      compact
    );
    ctx.restore();

    for (const ln of layout.right.p2) {
      drawAlignedLine(ctx, ln, rightX, rightInnerW, bodyPx, toY, g, midX, compact);
    }

    if (state.lockSmallNote) {
      const noteTop = toY(layout.right.smallNotes[0].y) - 11;
      const noteBot = toY(layout.right.smallNotes[1].y) + 8;
      ctx.save();
      ctx.fillStyle = "rgba(224, 234, 169, 0.58)";
      roundRectPath(ctx, rightX - 4, noteTop, rightInnerW + 8, noteBot - noteTop, 4);
      ctx.fill();
      ctx.strokeStyle = COLORS.limeText;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `400 10px ${FONT_CN}`;
      for (const sn of layout.right.smallNotes) {
        ctx.fillText(sn.text, rightX + 2, toY(sn.y), rightInnerW - 4);
      }
      ctx.restore();
    }

    // 跨栏检校激光游标
    const scanPx = padL + cardW * pointerXNorm;
    ctx.beginPath();
    ctx.moveTo(scanPx, bodyTop);
    ctx.lineTo(scanPx, padT + cardH);
    ctx.strokeStyle = dragging
      ? (res.tone === "ok" ? "rgba(81,39,201,0.55)" : "rgba(194,39,59,0.55)")
      : "rgba(81,39,201,0.18)";
    ctx.lineWidth = dragging ? 1.8 : 1;
    ctx.stroke();

    if (dragging || pulse > 0.05) {
      const partMeta = PARTS[state.activePart] || PARTS.rightLead;
      const curVal = state[state.activePart];
      const txt = `${partMeta.label} ${fmtPt(curVal)} (${fmtMult(curVal, g)})`;
      drawTag(
        ctx,
        Math.max(padL + 64, Math.min(padL + cardW - 64, scanPx)),
        bodyTop + 14,
        txt,
        COLORS.ink,
        COLORS.lime,
        "center",
        compact
      );
    }

    ctx.restore();
  }

  function drawAlignedLine(ctx, ln, x, maxW, bodyPx, toY, g, midX, compact) {
    const ly = toY(ln.y);
    const ok = Math.abs(ln.err) < 0.4;

    // 若对齐，向中缝延伸一条极细电光靛紫贯通实线；若错位，画红色垂直误差箭头 + 小数字
    if (ok) {
      ctx.beginPath();
      ctx.moveTo(midX - 6, Math.round(ly) + 0.5);
      ctx.lineTo(x + maxW, Math.round(ly) + 0.5);
      ctx.strokeStyle = "rgba(81, 39, 201, 0.42)";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      const targetY = toY(Math.round(ln.y / g) * g);
      drawDriftTick(ctx, x - (compact ? 4 : 8), ly, targetY);
      // 行底红色错位虚线
      ctx.beginPath();
      ctx.moveTo(x, Math.round(ly) + 0.5);
      ctx.lineTo(x + maxW, Math.round(ly) + 0.5);
      ctx.strokeStyle = "rgba(194, 39, 59, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = ok ? COLORS.body : "#3D1820";
    ctx.font = `400 ${bodyPx}px ${FONT_CN}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(ln.text, x, ly, maxW);
  }

  function drawDriftTick(ctx, x, actualY, gridY) {
    ctx.save();
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x, actualY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, actualY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.err;
    ctx.fill();
    ctx.restore();
  }

  function drawTag(ctx, x, y, text, bg, fg, align = "right", compact = false) {
    ctx.save();
    ctx.font = `600 ${compact ? 10 : 10.5}px ${FONT_NUM}`;
    const tw = ctx.measureText(text).width;
    const pw = compact ? 6 : 8;
    const w = tw + pw * 2;
    const h = compact ? 16 : 18;
    const bx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
    const by = y - h / 2;
    roundRectPath(ctx, bx, by, w, h, 4);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
    ctx.restore();
  }

  // -------- 鼠标与触屏直拖交互（横向拨调当前选中排印项 + 靠近整倍轻吸附） --------
  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top, w: r.width };
  }

  function pickPartAt(x, y) {
    for (let i = hitZones.length - 1; i >= 0; i--) {
      const z = hitZones[i];
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z.part;
    }
    return null;
  }

  function applyHorizontalDelta(dx, startVal, state) {
    const part = state.activePart;
    const meta = PARTS[part] || PARTS.rightLead;
    // 横拖 140px 约变化 24pt（既细腻又适合手机短幅来回拖）
    const sensitivity = Math.max(120, width * 0.24);
    const raw = startVal + (dx / sensitivity) * 24;
    let next = Math.max(meta.min, Math.min(meta.max, Math.round(raw)));

    // 靠近基线整倍数 ±1.5pt 内轻吸附
    const g = state.grid;
    if (part === "rightLead") {
      if (Math.abs(raw - g) <= 1.4) next = g;
    } else if (part === "titleBlock" || part === "boxHeight") {
      const nearest = snapMultiple(raw, g, 2, 4);
      if (Math.abs(raw - nearest) <= 1.6) next = nearest;
    } else if (part === "paraGap") {
      const nearest = snapMultiple(raw, g, 1, 2);
      if (Math.abs(raw - nearest) <= 1.6) next = nearest;
    }

    if (next !== state[part]) {
      setState({ [part]: next });
      pulse = 1;
      dirty = true;
      onStateChange();
    }
  }

  // 同时支持 Pointer Events 和 Touch Events（兼容 perf.mjs 的 touchStart/touchMove 派发！）
  let activeTouchId = null;
  let touchStartY = 0;
  let touchAxis = null; // "x" | "y" | null

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由下方 touch 监听器以保页面竖滑顺畅
    const p = localPos(e.clientX, e.clientY);
    const picked = pickPartAt(p.x, p.y);
    const st = getState();
    if (picked && picked !== st.activePart) {
      setState({ activePart: picked });
      onStateChange();
    }
    dragging = true;
    dragStartX = e.clientX;
    dragStartVal = getState()[getState().activePart];
    pointerXNorm = Math.max(0.06, Math.min(0.94, p.x / Math.max(1, p.w)));
    canvas.setPointerCapture?.(e.pointerId);
    dirty = true;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const p = localPos(e.clientX, e.clientY);
    if (!dragging) {
      const picked = pickPartAt(p.x, p.y);
      canvas.style.cursor = picked ? "ew-resize" : "grab";
      return;
    }
    pointerXNorm = Math.max(0.06, Math.min(0.94, p.x / Math.max(1, p.w)));
    applyHorizontalDelta(e.clientX - dragStartX, dragStartVal, getState());
    dirty = true;
    if (reducedMotion.matches) ctl.draw();
  });

  const endPointer = () => {
    if (!dragging) return;
    dragging = false;
    dirty = true;
    if (reducedMotion.matches) ctl.draw();
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    activeTouchId = t0.identifier;
    touchAxis = null;
    const p = localPos(t0.clientX, t0.clientY);
    const picked = pickPartAt(p.x, p.y);
    const st = getState();
    if (picked && picked !== st.activePart) {
      setState({ activePart: picked });
      onStateChange();
    }
    dragStartX = t0.clientX;
    touchStartY = t0.clientY;
    dragStartVal = getState()[getState().activePart];
    pointerXNorm = Math.max(0.06, Math.min(0.94, p.x / Math.max(1, p.w)));
    dragging = true;
    dirty = true;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    const t0 = [...e.touches].find((t) => t.identifier === activeTouchId) || e.touches[0];
    if (!t0) return;
    const dx = t0.clientX - dragStartX;
    const dy = t0.clientY - touchStartY;
    if (!touchAxis && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (touchAxis === "y") {
      dragging = false;
      return; // 把竖向滑动还给页面滚动
    }
    if (e.cancelable) e.preventDefault();
    const p = localPos(t0.clientX, t0.clientY);
    pointerXNorm = Math.max(0.06, Math.min(0.94, p.x / Math.max(1, p.w)));
    applyHorizontalDelta(dx, dragStartVal, getState());
    dirty = true;
    if (reducedMotion.matches) ctl.draw();
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    activeTouchId = null;
    touchAxis = null;
    dragging = false;
    dirty = true;
    if (reducedMotion.matches) ctl.draw();
  }, { passive: true });

  // 键盘支持（Tab 聚焦画布后，左右方向键微调选中项，上下方向键切构件）
  canvas.addEventListener("keydown", (e) => {
    const keys = ["rightLead", "titleBlock", "paraGap", "boxHeight"];
    const st = getState();
    const part = st.activePart;
    const meta = PARTS[part] || PARTS.rightLead;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 4 : 1);
      const next = Math.max(meta.min, Math.min(meta.max, st[part] + delta));
      setState({ [part]: next });
      pulse = 1;
      dirty = true;
      onStateChange();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const idx = keys.indexOf(part);
      const nextPart = keys[(idx + (e.key === "ArrowDown" ? 1 : keys.length - 1)) % keys.length];
      setState({ activePart: nextPart });
      pulse = 0.8;
      dirty = true;
      onStateChange();
    }
  });

  const ctl = loop(canvas, draw);
  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
    destroy() {
      ro.disconnect();
    },
  };
}

// 顶沿活体「设计的秩序 / 源于看不见的线」五线解剖示范（随主步长实时伸缩行距）
export function updateAnatomyBanner(el, gridPt) {
  if (!el) return;
  // 线性映射 16..36pt -> 视觉行高 42..64px，保持紧凑且对比鲜明
  const ratio = (gridPt - 16) / 20;
  const lineGap = Math.round(40 + ratio * 22); // px between baseline 1 and baseline 2
  el.style.setProperty("--an-gap", `${lineGap}px`);
  const read = el.querySelector("[data-an-lead]");
  if (read) read.textContent = `行距 ${gridPt}pt`;
}
