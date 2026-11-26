// 141 开场主角玩具：排印层级声谱台（2D Canvas）+ 原海报紫色节奏波浪线
// 严守：只读 model.js 单真源几何、支持鼠标/触摸横拖调字阶（放行垂直滚屏）、纵拖行距卡尺、直点层块、Space 扫读路径演播。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { CONTEXTS, RULES, clamp, computeProofLayout, evaluateProof } from "./model.js";

const COLORS = {
  paper: "#FFFFFF",
  grid: "#DCDCE4",
  gridStrong: "#C4C4D0",
  ink: "#08080A",
  bodyInk: "#16161B",
  mutedInk: "#52525E",
  violet: "#7B24DA",
  violetDeep: "#5E17AC",
  violetSoft: "rgba(123, 36, 218, 0.11)",
  violetStrip: "rgba(123, 36, 218, 0.14)",
  red: "#F22C30",
  redDeep: "#BF191D",
  redSoft: "rgba(242, 44, 48, 0.14)",
  ok: "#0F6E52",
  okSoft: "rgba(15, 110, 82, 0.12)",
  imgBg: "#EAEAEA",
  imgHill: "#FFFFFF",
};

function drawRegistrationMark(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();
  ctx.restore();
}

function drawCornerFrame(ctx, x, y, w, h, arm, color, lw = 1.4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  // 左上角 ┌
  ctx.moveTo(x, y + arm);
  ctx.lineTo(x, y);
  ctx.lineTo(x + arm, y);
  // 右下角 ┘
  ctx.moveTo(x + w - arm, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - arm);
  ctx.stroke();
  ctx.restore();
}

function drawCurvedBracket(ctx, x, y, h, side, color) {
  const bend = Math.min(11, h * 0.14) * side;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + bend, y + h * 0.5, x, y + h);
  ctx.stroke();
  ctx.restore();
}

function drawTagPill(ctx, x, y, text, bg, fg, fontPx = 10.5) {
  ctx.save();
  ctx.font = `700 ${fontPx}px "Space Mono", "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 12;
  const ph = fontPx + 8;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, pw, ph);
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(text, x + 6, y + ph * 0.5 + 0.5);
  ctx.restore();
  return pw;
}

export function createProofStage(canvas, waveCanvas, getState, onPatch, onComputed) {
  const ctx = canvas.getContext("2d");
  const wCtx = waveCanvas ? waveCanvas.getContext("2d") : null;

  let cssW = 760;
  let cssH = 540;
  let lastLayout = null;
  let lastEval = null;
  let dirty = true;
  let introDone = false;
  let introProgress = reducedMotion.matches ? 1 : 0;

  // 扫读视线演播状态
  const sweep = {
    active: false,
    progress: 0, // 0..1
    duration: 3.4,
  };

  // 右侧行距卡尺手柄矩形（命中测试）
  let caliperRect = { x: 0, y: 0, w: 0, h: 0 };

  const measureFn = (text, fontPx, weight, family) => {
    ctx.font = `${weight} ${fontPx}px "${family}", "Noto Sans SC", sans-serif`;
    return ctx.measureText(text).width;
  };

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.round(r.width));
    const h = Math.max(260, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    cssW = w;
    cssH = h;

    if (waveCanvas && wCtx) {
      const wr = waveCanvas.getBoundingClientRect();
      const ww = Math.max(160, Math.round(wr.width || 240));
      const wh = Math.max(28, Math.round(wr.height || 36));
      if (waveCanvas.width !== Math.round(ww * dpr) || waveCanvas.height !== Math.round(wh * dpr)) {
        waveCanvas.width = Math.round(ww * dpr);
        waveCanvas.height = Math.round(wh * dpr);
      }
    }
    dirty = true;
  }

  function recompute() {
    const state = getState();
    const layout = computeProofLayout(state, cssW, cssH, measureFn);
    const ev = evaluateProof(layout, state);
    lastLayout = layout;
    lastEval = ev;
    if (onComputed) onComputed(layout, ev);
    return { state, layout, ev };
  }

  function drawWave(t, waveMode, passedCount) {
    if (!waveCanvas || !wCtx) return;
    const dpr = pixelRatio(2);
    const ww = waveCanvas.width / dpr;
    const wh = waveCanvas.height / dpr;
    wCtx.save();
    wCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wCtx.clearRect(0, 0, ww, wh);

    const midY = wh * 0.54;
    const pad = 6;
    const span = ww - pad * 2;
    const phase = reducedMotion.matches ? 0 : t * (sweep.active ? 3.2 : 0.9);

    wCtx.lineWidth = 2.1;
    wCtx.lineCap = "round";
    wCtx.lineJoin = "round";
    wCtx.strokeStyle = passedCount === 4 ? COLORS.violet : waveMode === "flatline" ? COLORS.mutedInk : COLORS.redDeep;

    wCtx.beginPath();
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = pad + u * span;
      let y = midY;
      if (waveMode === "flatline") {
        y = midY + Math.sin(u * 26) * 0.9;
      } else if (waveMode === "cramped") {
        y = midY + Math.sin(u * Math.PI * 16 + phase) * (wh * 0.28);
      } else if (waveMode === "jagged") {
        const tri = ((i % 6) / 6 - 0.5) * 2;
        y = midY + tri * (wh * 0.34) * (0.65 + 0.35 * Math.sin(u * 11 + phase));
      } else if (waveMode === "broken") {
        if (i % 9 < 5) {
          y = midY + Math.sin(u * Math.PI * 6 + phase * 0.4) * (wh * 0.24);
        } else {
          wCtx.stroke();
          wCtx.beginPath();
          continue;
        }
      } else {
        // 原海报同款柔畅电光紫正弦节奏波
        y = midY + Math.sin(u * Math.PI * 7.5 - phase) * (wh * 0.26);
      }
      if (i === 0) wCtx.moveTo(x, y);
      else wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    wCtx.restore();
  }

  function render(t, dt, { still }) {
    if (still) {
      introProgress = 1;
      introDone = true;
    } else if (!introDone) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.9);
      if (introProgress >= 1) introDone = true;
      dirty = true;
    }

    if (sweep.active) {
      if (still) {
        sweep.progress = 0.72;
        sweep.active = false;
      } else {
        sweep.progress += Math.max(dt, 0.016) / sweep.duration;
        if (sweep.progress >= 1) {
          sweep.progress = 1;
          sweep.active = false;
        }
      }
      dirty = true;
    }

    if (!dirty && !sweep.active && introDone) {
      // 静置时不浪费 GPU/CPU 反复全量重绘主画布，仅维持轻量紫波呼吸（当页面可见且未降动态）
      if (!still && lastEval && lastEval.passedCount === 4) {
        drawWave(t, lastEval.waveMode, lastEval.passedCount);
      }
      return;
    }
    dirty = false;

    const { state, layout, ev } = recompute();
    const ctxData = CONTEXTS[state.context] || CONTEXTS.poster;
    const dpr = pixelRatio(2);
    const k = layout.scaleK;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 纯白印刷校样底纸
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 2. 原海报同款印刷套准细虚线网格
    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const gxL = layout.padX;
    const gxR = cssW - layout.padX;
    const gyT = layout.padTop * 0.65;
    const gyB = cssH - layout.padBot * 0.65;
    const gridProgress = 0.35 + 0.65 * introProgress;
    ctx.beginPath();
    ctx.moveTo(gxL, 0);
    ctx.lineTo(gxL, cssH * gridProgress);
    ctx.moveTo(gxR, 0);
    ctx.lineTo(gxR, cssH * gridProgress);
    ctx.moveTo(0, gyT);
    ctx.lineTo(cssW * gridProgress, gyT);
    ctx.moveTo(0, gyB);
    ctx.lineTo(cssW * gridProgress, gyB);
    ctx.stroke();

    // 若对齐错乱，画出多条红色失序垂直起线（实证「起线散乱」）
    if (state.showGuides && state.align === "mixed") {
      ctx.strokeStyle = "rgba(242, 44, 48, 0.42)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cssW * 0.5, gyT);
      ctx.lineTo(cssW * 0.5, gyB);
      ctx.moveTo(gxR - 2, gyT);
      ctx.lineTo(gxR - 2, gyB);
      ctx.stroke();
    } else if (state.showGuides && (state.align === "left" || state.align === "grid")) {
      // 紫色对齐锚轴
      ctx.strokeStyle = "rgba(123, 36, 218, 0.32)";
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(gxL, gyT);
      ctx.lineTo(gxL, gyB);
      if (state.align === "grid") {
        const midAxis = layout.padX + layout.innerW * 0.65;
        ctx.moveTo(midAxis, gyT);
        ctx.lineTo(midAxis, layout.ruleY);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 3. L0 顶部印刷眉标 + 实测比率小读数（窄屏自动精简防碰字）
    ctx.save();
    ctx.font = `700 ${Math.max(9.5, layout.metaRect.fontSize * 0.92)}px "Space Mono", sans-serif`;
    ctx.fillStyle = COLORS.mutedInk;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const kickerText = cssW < 450 ? "NO. 141 · PROOF" : ctxData.kicker;
    ctx.fillText(kickerText, layout.kickerRect.x, layout.kickerRect.y);

    const statusBadge = ev.verdict.ok
      ? `4/4 · SCALE ${layout.metrics.titleToBody}× · LEAD ${layout.metrics.leading}×`
      : `${ev.passedCount}/4 · SCALE ${layout.metrics.titleToBody}× · LEAD ${layout.metrics.leading}×`;
    ctx.textAlign = "right";
    ctx.fillStyle = ev.verdict.ok ? COLORS.ok : COLORS.redDeep;
    ctx.fillText(statusBadge, layout.padX + layout.innerW, layout.kickerRect.y);
    ctx.restore();

    // 4. L1 主标（中文大字 + 窄高 Big Shoulders 英标 + 朱砂红实心句点）
    const tr = layout.titleRect;
    ctx.save();
    if (state.selectedLayer === "title" && state.showGuides) {
      ctx.fillStyle = COLORS.violetSoft;
      ctx.fillRect(tr.x - 4, tr.y - 3, tr.w + 8, tr.h + 6);
    }
    ctx.fillStyle = COLORS.ink;
    ctx.textBaseline = "top";
    const tAlign = tr.align;
    const tAnchorX = tAlign === "center" ? tr.x + tr.w * 0.5 : tAlign === "right" ? tr.x + tr.w : tr.x;
    ctx.textAlign = tAlign;
    ctx.font = `${tr.weight} ${tr.fontSize}px "Noto Sans SC", sans-serif`;
    ctx.fillText(ctxData.titleCn, tAnchorX, tr.y);

    // 窄高压缩全大写英文 + 原海报招牌实心红句点
    const enY = tr.y + tr.fontSize * 1.07;
    ctx.font = `800 ${tr.enSize}px "Big Shoulders", "Noto Sans SC", sans-serif`;
    const enW = ctx.measureText(ctxData.titleEn).width;
    ctx.fillText(ctxData.titleEn, tAnchorX, enY);
    const dotR = Math.max(3.2, tr.enSize * 0.115);
    let dotX = tAnchorX + enW + dotR * 1.7;
    if (tAlign === "center") dotX = tAnchorX + enW * 0.5 + dotR * 1.7;
    else if (tAlign === "right") dotX = tAnchorX + dotR * 1.5;
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.arc(Math.min(cssW - 14, dotX), enY + tr.enSize * 0.78, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. L2 导语 / 金句（配原海报紫色瘦高弧括号 ( ... ) 或紫色双引号）
    const lr = layout.leadRect;
    ctx.save();
    if (state.selectedLayer === "lead" && state.showGuides) {
      ctx.fillStyle = COLORS.violetSoft;
      ctx.fillRect(lr.x - 4, lr.y - 3, lr.w + 8, lr.h + 6);
    }
    if (state.align === "grid") {
      drawCurvedBracket(ctx, lr.x + 2, lr.y + 3, lr.h - 6, -1, COLORS.violet);
      drawCurvedBracket(ctx, lr.x + lr.w - 2, lr.y + 3, lr.h - 6, 1, COLORS.violet);
    }
    const lAlign = lr.align;
    const lPad = state.align === "grid" ? 14 * k : 0;
    const lAnchorX = lAlign === "center" ? lr.x + lr.w * 0.5 : lAlign === "right" ? lr.x + lr.w - lPad : lr.x + lPad;
    ctx.textAlign = lAlign;
    ctx.textBaseline = "top";
    ctx.fillStyle = COLORS.ink;
    ctx.font = `${lr.weight} ${lr.fontSize}px "Noto Sans SC", sans-serif`;
    lr.lines.forEach((line, idx) => {
      ctx.fillText(line, lAnchorX, lr.y + 4 + idx * lr.lineH);
    });
    // 英文经典衬线副注
    ctx.font = `italic 400 ${Math.max(9.5, layout.metaRect.fontSize * 0.96)}px "Libre Baskerville", serif`;
    ctx.fillStyle = COLORS.violetDeep;
    ctx.fillText(ctxData.quoteEn, lAnchorX, lr.y + 4 + lr.lines.length * lr.lineH + 2);
    ctx.restore();

    // 6. 原海报标志性电光紫横杠
    ctx.save();
    ctx.fillStyle = COLORS.violet;
    const ruleW = layout.innerW * (0.25 + 0.75 * introProgress);
    ctx.fillRect(layout.padX, layout.ruleY, ruleW, Math.max(3, 4.2 * k));
    ctx.restore();

    // 7. 静音配图块（可直点切换 0% / 11% / 42%，喧宾夺主时直接亮红警示）
    if (layout.imgRect) {
      const ir = layout.imgRect;
      const hijack = layout.metrics.imageShare > RULES.imageShareMax;
      ctx.save();
      ctx.fillStyle = hijack ? "#E3DFEA" : COLORS.imgBg;
      ctx.fillRect(ir.x, ir.y, ir.w, ir.h);
      // 极简山日占位剪影（1:1 复刻原海报左中浅灰占位图块）
      ctx.fillStyle = COLORS.imgHill;
      ctx.beginPath();
      ctx.moveTo(ir.x + ir.w * 0.14, ir.y + ir.h * 0.84);
      ctx.lineTo(ir.x + ir.w * 0.43, ir.y + ir.h * 0.34);
      ctx.lineTo(ir.x + ir.w * 0.66, ir.y + ir.h * 0.84);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ir.x + ir.w * 0.50, ir.y + ir.h * 0.84);
      ctx.lineTo(ir.x + ir.w * 0.70, ir.y + ir.h * 0.49);
      ctx.lineTo(ir.x + ir.w * 0.88, ir.y + ir.h * 0.84);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ir.x + ir.w * 0.72, ir.y + ir.h * 0.28, Math.max(4, Math.min(ir.w, ir.h) * 0.085), 0, Math.PI * 2);
      ctx.fill();

      if (hijack) {
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(ir.x + 1, ir.y + 1, ir.w - 2, ir.h - 2);
        ctx.setLineDash([]);
        drawTagPill(ctx, ir.x + 8, ir.y + 8, `配图占 ${layout.metrics.imageShare}% 喧宾夺主 · 点此静音`, COLORS.redDeep, "#FFFFFF", Math.max(9.5, 10.5 * k));
      } else if (state.showGuides) {
        ctx.strokeStyle = "#D4D4DC";
        ctx.lineWidth = 1;
        ctx.strokeRect(ir.x + 0.5, ir.y + 0.5, ir.w - 1, ir.h - 1);
        ctx.font = `700 ${Math.max(9, 9.5 * k)}px "Space Mono", "Noto Sans SC", sans-serif`;
        ctx.fillStyle = COLORS.mutedInk;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(`配图 ${layout.metrics.imageShare}% · 静音`, ir.x + 5, ir.y + ir.h - 4);
      }
      ctx.restore();
    }

    // 8. L3 真实折行正文 + 行间空白呼吸条 + 右侧行距卡尺手柄
    const br = layout.bodyRect;
    ctx.save();
    const badLead = layout.metrics.leading < RULES.leadingMin || layout.metrics.leading > RULES.leadingMax;
    if (state.showGuides) {
      // 逐行画出真实行间白带（紫色呼吸条或红警撞行条）
      const stripH = Math.max(1.5, br.lineH - br.fontSize);
      for (let i = 0; i < br.lines.length - 1; i++) {
        const sy = br.y + i * br.lineH + br.fontSize;
        ctx.fillStyle = badLead ? COLORS.redSoft : COLORS.violetStrip;
        ctx.fillRect(br.x, sy, br.w, stripH);
      }
    }
    ctx.fillStyle = COLORS.bodyInk;
    ctx.font = `${br.weight} ${br.fontSize}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    const bAlign = br.align;
    const bAnchorX = bAlign === "center" ? br.x + br.w * 0.5 : bAlign === "right" ? br.x + br.w : br.x;
    ctx.textAlign = bAlign;
    br.lines.forEach((line, idx) => {
      ctx.fillText(line, bAnchorX, br.y + idx * br.lineH);
    });

    // 右侧行距卡尺手柄（纵拖调行距）
    const calX = cssW - layout.padX + 6;
    const calY = br.y;
    const calH = Math.max(38, Math.min(br.h, 110));
    caliperRect = { x: calX - 10, y: calY - 8, w: Math.max(26, layout.padX), h: calH + 16 };
    ctx.strokeStyle = badLead ? COLORS.redDeep : COLORS.violet;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(calX, calY);
    ctx.lineTo(calX, calY + calH);
    ctx.moveTo(calX - 4, calY);
    ctx.lineTo(calX + 4, calY);
    ctx.moveTo(calX - 4, calY + calH);
    ctx.lineTo(calX + 4, calY + calH);
    ctx.stroke();
    ctx.fillStyle = badLead ? COLORS.redDeep : COLORS.violet;
    ctx.beginPath();
    ctx.arc(calX, calY + calH * 0.5, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 9. L4 三列紫色直角取景框要点（1:1 承袭原海报下段 ┌ ┘ 结构）
    const pr = layout.pointsGroupRect;
    ctx.save();
    const arm = Math.max(7, 11 * k);
    pr.items.forEach((item) => {
      drawCornerFrame(ctx, item.x, item.y, item.w, item.h, arm, COLORS.violet, 1.4);
      const px = item.x + 8 * k;
      const py = item.y + 7 * k;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = COLORS.ink;
      ctx.font = `${pr.weight} ${pr.fontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillText(item.title, px, py);
      const tw = ctx.measureText(item.title).width;
      ctx.font = `700 ${Math.max(8.5, layout.metaRect.fontSize * 0.85)}px "Space Mono", sans-serif`;
      ctx.fillStyle = COLORS.violetDeep;
      if (px + tw + 6 < item.x + item.w - 8) {
        ctx.fillText(item.en, px + tw + 6, py + Math.max(1, (pr.fontSize - layout.metaRect.fontSize * 0.85) * 0.6));
      }
      if (!pr.compact) {
        ctx.font = `400 ${pr.descSize}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = COLORS.mutedInk;
        const dLines = item.desc.length > 10 && item.w < 165 ? [item.desc.slice(0, 9), item.desc.slice(9)] : [item.desc];
        dLines.slice(0, 2).forEach((dl, di) => {
          const ly = py + pr.fontSize * 1.25 + di * pr.descSize * 1.3;
          if (ly + pr.descSize <= item.y + item.h - 2) ctx.fillText(dl, px, ly);
        });
      }
    });
    ctx.restore();

    // 10. L5 底栏红点分隔条 + 右下角原海报黑色套准十字标
    const mr = layout.metaRect;
    ctx.save();
    ctx.font = `700 ${mr.fontSize}px "Space Mono", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    let mx = mr.align === "right" ? mr.x + mr.w * 0.36 : mr.x;
    const my = mr.y + mr.h * 0.5;
    mr.items.forEach((word) => {
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(mx + 3.5, my, 3.2 * k, 0, Math.PI * 2);
      ctx.fill();
      mx += 10 * k;
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(word, mx, my + 0.5);
      mx += ctx.measureText(word).width + 14 * k;
    });
    drawRegistrationMark(ctx, cssW - layout.padX + 4, my, Math.max(7, 9 * k), COLORS.ink);
    ctx.restore();

    // 11. 底部字阶横拖标尺条（让用户一眼看懂横拖反馈）
    ctx.save();
    const barY = cssH - 6;
    const barX = layout.padX;
    const barW = layout.innerW;
    ctx.fillStyle = "#ECECF2";
    ctx.fillRect(barX, barY, barW, 3);
    // 舒适区间（1.25..1.52）浅紫提示带
    const goodL = ((1.25 - 1.0) / 0.62) * barW;
    const goodR = ((1.52 - 1.0) / 0.62) * barW;
    ctx.fillStyle = "rgba(123, 36, 218, 0.25)";
    ctx.fillRect(barX + goodL, barY, goodR - goodL, 3);
    const curX = barX + clamp((state.scaleRatio - 1.0) / 0.62, 0, 1) * barW;
    ctx.fillStyle = ev.verdict.ok ? COLORS.ok : COLORS.violet;
    ctx.fillRect(barX, barY, curX - barX, 3);
    ctx.beginPath();
    ctx.arc(curX, barY + 1.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 12. 视线扫读路径演播（按 Space 或按钮触发，实绘 ① → ② → ③ → ④ 跳读轨迹）
    if (sweep.active || sweep.progress > 0 && sweep.progress < 1) {
      const nodes = layout.scanOrder.slice(0, 4).map((item) => ({
        ...item,
        cx: item.rect.x + Math.min(item.rect.w * 0.28, 86),
        cy: item.rect.y + item.rect.h * 0.45,
      }));
      const segs = Math.max(1, nodes.length - 1);
      const totalP = sweep.progress * segs;

      ctx.save();
      ctx.strokeStyle = ev.verdict.ok ? COLORS.violet : COLORS.red;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (let i = 0; i < nodes.length - 1; i++) {
        const segP = clamp(totalP - i, 0, 1);
        if (segP <= 0) break;
        const a = nodes[i];
        const b = nodes[i + 1];
        if (i === 0) ctx.moveTo(a.cx, a.cy);
        ctx.lineTo(a.cx + (b.cx - a.cx) * segP, a.cy + (b.cy - a.cy) * segP);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制已落点的 ① ② ③ ④ 标圈
      nodes.forEach((n, idx) => {
        if (totalP + 0.08 < idx) return;
        const wrongFirst = idx === 0 && n.id !== "title";
        const bg = wrongFirst ? COLORS.redDeep : ev.verdict.ok ? COLORS.violet : COLORS.ink;
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(n.cx, n.cy, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 12px "Space Mono", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), n.cx, n.cy + 0.5);
        if (wrongFirst) {
          drawTagPill(ctx, n.cx + 16, n.cy - 10, "首眼被抢!", COLORS.redDeep, "#FFFFFF", 10.5);
        }
      });
      ctx.restore();
    }

    ctx.restore();
    drawWave(t, ev.waveMode, ev.passedCount);
  }

  // 指针与触控交互：横拖连续调字阶（放行垂直滚动），纵拖右侧卡尺调行距，点击灰配图切换静音
  let drag = null;
  function getLocal(ev) {
    const r = canvas.getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  }
  function hitRect(p, r) {
    return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const p = getLocal(e);
    const st = getState();
    const onCaliper = hitRect(p, caliperRect);
    drag = {
      id: e.pointerId,
      startX: p.x,
      startY: p.y,
      mode: onCaliper ? "leading" : "pending",
      baseScale: st.scaleRatio,
      baseLeading: st.leading,
      moved: false,
    };
    if (onCaliper && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  }

  function onPointerMove(e) {
    if (!drag || (e.pointerId !== undefined && drag.id !== e.pointerId)) return;
    const p = getLocal(e);
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    if (drag.mode === "pending") {
      if (Math.hypot(dx, dy) < 6) return;
      // 触摸屏若明显竖向滑动，放行页面滚动
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && e.pointerType === "touch") {
        drag = null;
        return;
      }
      drag.mode = Math.abs(dy) > Math.abs(dx) * 1.35 ? "leading" : "scale";
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      }
    }
    drag.moved = true;
    if (drag.mode === "scale") {
      const next = clamp(drag.baseScale + (dx / Math.max(220, cssW * 0.62)) * 0.56, 1.0, 1.62);
      onPatch({ scaleRatio: +next.toFixed(3) });
    } else if (drag.mode === "leading") {
      const next = clamp(drag.baseLeading + (dy / Math.max(150, cssH * 0.45)) * 1.1, 0.95, 2.55);
      onPatch({ leading: +next.toFixed(2) });
    }
  }

  function onPointerUp(e) {
    if (!drag) return;
    const wasMoved = drag.moved;
    const p = getLocal(e);
    drag = null;
    if (wasMoved || !lastLayout) return;

    // 单击命中测试：点击灰配图块在 42% → 11% → 0% 之间循环静音；点击文字层切换选中高亮
    const st = getState();
    if (lastLayout.imgRect && hitRect(p, lastLayout.imgRect)) {
      const nextShare = st.imageShare > 22 ? 11 : st.imageShare > 0 ? 0 : 11;
      onPatch({ imageShare: nextShare });
      return;
    }
    if (hitRect(p, lastLayout.titleRect)) onPatch({ selectedLayer: "title" });
    else if (hitRect(p, lastLayout.leadRect)) onPatch({ selectedLayer: "lead" });
    else if (hitRect(p, lastLayout.bodyRect)) onPatch({ selectedLayer: "body" });
    else if (hitRect(p, lastLayout.pointsGroupRect)) onPatch({ selectedLayer: "points" });
  }

  // 兼容 touch 事件（确保 perf.mjs 的 Input.dispatchTouchEvent 顺滑触发重绘）
  let touchDrag = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const p = getLocal(e);
    const st = getState();
    touchDrag = { startX: p.x, startY: p.y, baseScale: st.scaleRatio, lockedX: false };
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchDrag || e.touches.length !== 1) return;
    const p = getLocal(e);
    const dx = p.x - touchDrag.startX;
    const dy = p.y - touchDrag.startY;
    if (!touchDrag.lockedX) {
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && Math.abs(dy) > 8) {
        touchDrag = null;
        return;
      }
      if (Math.abs(dx) > 4) touchDrag.lockedX = true;
    }
    if (touchDrag.lockedX) {
      const next = clamp(touchDrag.baseScale + (dx / Math.max(200, cssW * 0.65)) * 0.56, 1.0, 1.62);
      onPatch({ scaleRatio: +next.toFixed(3) });
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => { touchDrag = null; }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  resize();
  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  if (waveCanvas) ro.observe(waveCanvas);

  const ctrl = loop(canvas, render);

  return {
    markDirty() {
      dirty = true;
      ctrl.draw();
    },
    triggerSweep() {
      sweep.active = true;
      sweep.progress = 0.02;
      dirty = true;
      ctrl.draw();
    },
    getSnapshot() {
      return { layout: lastLayout, eval: lastEval };
    },
  };
}
