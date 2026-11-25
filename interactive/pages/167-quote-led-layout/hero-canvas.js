// 167 原海报活体 2D Canvas 排印台（1:1 承袭炭墨宣黑底、斜角酸黄绿巨引号、干笔荧光笔刷线与点击气口刀）
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, SPECIMENS, computeLayout, evaluateLayout } from "./model.js";

// 预烘焙一次细微炭墨宣纸微粒纹理，绝不在每帧跑像素循环（保障慢手机软件渲染 60fps）
let grainPatternCanvas = null;
function getGrainCanvas() {
  if (grainPatternCanvas) return grainPatternCanvas;
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = PALETTE.bg;
  g.fillRect(0, 0, 96, 96);
  let seed = 16701;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 420; i++) {
    const x = Math.floor(rand() * 96);
    const y = Math.floor(rand() * 96);
    const v = rand() > 0.5 ? "rgba(239,230,210,0.032)" : "rgba(0,0,0,0.16)";
    g.fillStyle = v;
    g.fillRect(x, y, 1, 1);
  }
  grainPatternCanvas = c;
  return c;
}

// 1:1 复刻 167 原海报建筑几何双引号（切角锐利、粗腿圆弧）
function drawGeometricQuotes(ctx, rect, isClose, color, alpha = 1) {
  if (!rect) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const { x, y, w, h } = rect;
  const gap = w * 0.14;
  const singleW = (w - gap) * 0.5;

  const drawSingle = (ox) => {
    ctx.beginPath();
    if (!isClose) {
      // 前引号 “ ：底部厚方块 + 上方斜弯弧钩（与原海报左上巨引号一致）
      ctx.moveTo(ox, y + h);
      ctx.lineTo(ox + singleW, y + h);
      ctx.lineTo(ox + singleW, y + h * 0.44);
      ctx.lineTo(ox + singleW * 0.52, y + h * 0.44);
      ctx.quadraticCurveTo(ox + singleW * 0.52, y + h * 0.18, ox + singleW * 0.96, y + h * 0.08);
      ctx.lineTo(ox + singleW * 0.96, y);
      ctx.quadraticCurveTo(ox + singleW * 0.02, y + h * 0.04, ox, y + h * 0.52);
      ctx.closePath();
    } else {
      // 后引号 ” ：顶部厚方块 + 下方斜弯弧钩（与原海报右下巨引号一致）
      ctx.moveTo(ox, y);
      ctx.lineTo(ox + singleW, y);
      ctx.lineTo(ox + singleW, y + h * 0.48);
      ctx.quadraticCurveTo(ox + singleW * 0.98, y + h * 0.96, ox + singleW * 0.04, y + h);
      ctx.lineTo(ox + singleW * 0.04, y + h * 0.92);
      ctx.quadraticCurveTo(ox + singleW * 0.48, y + h * 0.82, ox + singleW * 0.48, y + h * 0.56);
      ctx.lineTo(ox, y + h * 0.56);
      ctx.closePath();
    }
    ctx.fill();
  };

  drawSingle(x);
  drawSingle(x + singleW + gap);
  ctx.restore();
}

// 1:1 复刻 167 原海报酸黄绿手刷干笔荧光划痕（纯轻量矢量多笔，无昂贵滤镜）
function drawDryBrushStroke(ctx, rect, progress = 1) {
  if (!rect || progress <= 0.01) return;
  ctx.save();
  const { x, y, w, h } = rect;
  const drawW = w * Math.min(1, progress);

  // 主干干笔锥形带（左厚右尖、微弧上扬，还原海报笔触）
  ctx.fillStyle = PALETTE.lime;
  ctx.beginPath();
  ctx.moveTo(x + h * 0.25, y + h * 0.18);
  ctx.quadraticCurveTo(x + drawW * 0.46, y - h * 0.08, x + drawW, y + h * 0.34);
  ctx.lineTo(x + drawW * 0.94, y + h * 0.52);
  ctx.quadraticCurveTo(x + drawW * 0.44, y + h * 0.88, x + h * 0.12, y + h * 0.96);
  ctx.quadraticCurveTo(x - h * 0.08, y + h * 0.58, x + h * 0.25, y + h * 0.18);
  ctx.closePath();
  ctx.fill();

  // 右侧飞白丝笔触（多道细拉丝，增强印刷丝网/刷笔质感）
  ctx.strokeStyle = PALETTE.limeBright;
  ctx.lineCap = "round";
  const strands = [
    { sy: 0.28, ey: 0.30, s: 0.52, e: 1.03, lw: 0.14 },
    { sy: 0.52, ey: 0.44, s: 0.44, e: 0.98, lw: 0.11 },
    { sy: 0.72, ey: 0.56, s: 0.28, e: 0.84, lw: 0.09 },
  ];
  for (const st of strands) {
    if (progress < st.s) continue;
    const tEnd = Math.min(st.e, progress);
    ctx.lineWidth = Math.max(1, h * st.lw);
    ctx.beginPath();
    ctx.moveTo(x + w * st.s, y + h * st.sy);
    ctx.lineTo(x + w * tEnd, y + h * st.ey);
    ctx.stroke();
  }
  ctx.restore();
}

export function createHeroCanvas(canvas, { getState, onScaleChange, onToggleBreak, onQuickFix }) {
  const ctx = canvas.getContext("2d");
  let pattern = null;
  let logicalW = 900;
  let logicalH = 580;
  let lastLayout = null;
  let lastEval = null;
  let lastTagRect = null;
  let hoverCutIdx = -1;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScale = 1.18;
  let dragMoved = false;
  let beatClock = -1; // >= 0 时播放阅读节拍光束
  let revealT = 0; // 开场温和入场动画（0..1）

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    logicalW = w;
    logicalH = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function startBeatPlayback() {
    beatClock = 0;
  }

  function stopBeatPlayback() {
    beatClock = -1;
  }

  function isBeatPlaying() {
    return beatClock >= 0;
  }

  function render(t, dt, { still = false } = {}) {
    resize();
    const state = getState();
    const sp = SPECIMENS[state.specimen] || SPECIMENS.poster;

    if (still) {
      revealT = 1;
    } else if (revealT < 1) {
      revealT = Math.min(1, revealT + (dt > 0 ? dt * 1.45 : 0.04));
    }

    const layout = computeLayout(state, logicalW, logicalH);
    const ev = evaluateLayout(state, layout);
    lastLayout = layout;
    lastEval = ev;

    if (beatClock >= 0) {
      if (still) {
        beatClock = -1;
      } else {
        beatClock += dt > 0 ? dt : 0.016;
        if (beatClock > layout.totalBeatSec + 0.35) {
          beatClock = -1;
        }
      }
    }

    const W = logicalW;
    const H = logicalH;
    const s = layout.scaleNorm;

    // 1. 炭墨宣黑原纸底 + 微粒肌理
    if (!pattern) pattern = ctx.createPattern(getGrainCanvas(), "repeat");
    ctx.fillStyle = pattern || PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    // 2. 极轻出版裁切角标 + 安全版心参照线 + 随尺度淡出的「灰字正文语境线」
    const sr = layout.safeRect;
    ctx.save();
    // 出版裁切角标
    const cm = Math.round(10 * s);
    ctx.strokeStyle = "rgba(190, 200, 25, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14 * s, 14 * s + cm); ctx.lineTo(14 * s, 14 * s); ctx.lineTo(14 * s + cm, 14 * s);
    ctx.moveTo(W - 14 * s - cm, 14 * s); ctx.lineTo(W - 14 * s, 14 * s); ctx.lineTo(W - 14 * s, 14 * s + cm);
    ctx.moveTo(14 * s, H - 14 * s - cm); ctx.lineTo(14 * s, H - 14 * s); ctx.lineTo(14 * s + cm, H - 14 * s);
    ctx.moveTo(W - 14 * s - cm, H - 14 * s); ctx.lineTo(W - 14 * s, H - 14 * s); ctx.lineTo(W - 14 * s, H - 14 * s - cm);
    ctx.stroke();

    // 当引语字号还小时（< 1.72×），上下呈现柔和的「周围正文灰字条」，随向右横拖放大平滑隐退
    const contextFade = Math.max(0, Math.min(1, (1.72 - state.scale) / 0.52));
    if (contextFade > 0.02 && layout.lines.length > 0) {
      const topY0 = sr.y + 18 * s;
      const topLimit = layout.lines[0].rect.y - 26 * s;
      const barH = Math.max(5, Math.round(6.5 * s));
      const barStep = Math.max(14, Math.round(16 * s));
      const topWidths = [0.92, 0.96, 0.88, 0.94, 0.62];
      ctx.fillStyle = `rgba(239, 230, 210, ${(0.12 * contextFade).toFixed(3)})`;
      for (let i = 0; i < topWidths.length; i++) {
        const y = topY0 + i * barStep;
        if (y + barH > topLimit) break;
        ctx.fillRect(sr.x, y, sr.w * topWidths[i], barH);
      }
      if (topLimit - topY0 > 24 * s) {
        ctx.font = `500 ${Math.max(10, Math.round(10.5 * s))}px "DM Mono", monospace`;
        ctx.fillStyle = `rgba(196, 189, 169, ${(0.55 * contextFade).toFixed(3)})`;
        ctx.fillText("BODY PARAGRAPH CONTEXT · 正文灰字海（放大引语即退场）", sr.x, topY0 - 6 * s);
      }
      const botStart = (layout.attrRect ? layout.attrRect.y + layout.attrRect.h : layout.lines[layout.lines.length - 1].rect.y + layout.lines[layout.lines.length - 1].rect.h) + 22 * s;
      const botLimit = H - 52 * s;
      const botWidths = [0.95, 0.90, 0.93, 0.71];
      ctx.fillStyle = `rgba(239, 230, 210, ${(0.12 * contextFade).toFixed(3)})`;
      for (let i = 0; i < botWidths.length; i++) {
        const y = botStart + i * barStep;
        if (y + barH > botLimit) break;
        ctx.fillRect(sr.x, y, sr.w * botWidths[i], barH);
      }
    }

    ctx.strokeStyle = "rgba(190, 200, 25, 0.16)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    // 左侧光学基线（贯通文字区，一眼看出直引号啃凹了多少像素！）
    ctx.beginPath();
    ctx.moveTo(sr.x, sr.y - 6 * s);
    ctx.lineTo(sr.x, H - 18 * s);
    ctx.stroke();
    // 右侧测度安全边界线
    ctx.strokeStyle = layout.overflowRightPx > 6 ? "rgba(255, 122, 92, 0.55)" : "rgba(239, 230, 210, 0.11)";
    ctx.beginPath();
    ctx.moveTo(sr.x + sr.w, sr.y - 6 * s);
    ctx.lineTo(sr.x + sr.w, H - 18 * s);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 3. 顶沿极细测度与尺度标尺（原海报炭黑工业感）
    const rulerY = Math.round(16 * s);
    ctx.save();
    ctx.strokeStyle = "rgba(239, 230, 210, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sr.x, rulerY + 10 * s);
    ctx.lineTo(sr.x + sr.w, rulerY + 10 * s);
    ctx.stroke();

    // 标尺刻度与当前测度条
    const fillRatio = Math.min(1.06, layout.maxLineW / Math.max(1, sr.w));
    ctx.strokeStyle = layout.overflowRightPx > 6 ? PALETTE.warn : ev.allOk ? PALETTE.lime : "rgba(239,230,210,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sr.x, rulerY + 10 * s);
    ctx.lineTo(sr.x + sr.w * Math.min(1, fillRatio), rulerY + 10 * s);
    ctx.stroke();

    ctx.font = `500 ${Math.max(10, Math.round(11 * s))}px "DM Mono", monospace`;
    ctx.fillStyle = PALETTE.creamDim;
    ctx.textBaseline = "middle";
    ctx.fillText(
      `SCALE ${state.scale.toFixed(2)}×  ·  LINES ${layout.lineCount}  ·  SPACE ${layout.whitespacePct}%`,
      sr.x,
      rulerY - 1 * s
    );

    const statusStr = ev.allOk ? "4/4 节拍成立" : `${ev.passedCount}/4 待校`;
    ctx.textAlign = "right";
    ctx.fillStyle = ev.allOk ? PALETTE.limeBright : PALETTE.warn;
    ctx.fillText(statusStr, sr.x + sr.w, rulerY - 1 * s);
    ctx.textAlign = "left";
    ctx.restore();

    // 4. 引号（hanging 在文字前后斜角；giant 在文字底下/叠压制造真遮挡感）
    if (state.quoteMark === "hanging") {
      const qAlpha = Math.min(1, revealT * 1.4);
      drawGeometricQuotes(ctx, layout.openQuoteRect, false, PALETTE.lime, qAlpha);
      drawGeometricQuotes(ctx, layout.closeQuoteRect, true, PALETTE.lime, qAlpha);
    }

    // 5. 若强调模式为 flood（满涂失焦），在文字背后全幅涂满刺眼黄条
    if (state.emphasis === "flood") {
      ctx.save();
      ctx.fillStyle = "rgba(190, 200, 25, 0.86)";
      for (const ln of layout.lines) {
        ctx.fillRect(ln.rect.x - 4 * s, ln.rect.y - 2 * s, ln.rect.w + 8 * s, ln.rect.h + 4 * s);
      }
      ctx.restore();
    }

    // 6. 若为机械直引号内缩错态，高亮标出左沿被啃凹的红色缩进块！
    if (state.quoteMark === "straight" && layout.lines.length > 0) {
      const l0 = layout.lines[0];
      ctx.save();
      ctx.fillStyle = "rgba(255, 122, 92, 0.18)";
      ctx.fillRect(sr.x, l0.rect.y, layout.opticalIndentPx, l0.rect.h);
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1;
      ctx.strokeRect(sr.x + 0.5, l0.rect.y + 0.5, layout.opticalIndentPx - 1, l0.rect.h - 1);
      ctx.restore();
    }

    // 7. 绘制核心引语大字（逐字精确落位，支持关键词亮色、全涂深字、阅读节拍高亮）
    ctx.save();
    ctx.font = `900 ${layout.fontSize.toFixed(1)}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "alphabetic";

    // 若为直引号内缩，先在行首画清晰笔直的机械直引号 "（DM Mono）
    if (state.quoteMark === "straight" && layout.lines.length > 0) {
      const l0 = layout.lines[0];
      ctx.save();
      ctx.font = `500 ${layout.fontSize.toFixed(1)}px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.warn;
      ctx.fillText('"', sr.x + 3 * s, l0.baselineY);
      ctx.restore();
    }

    for (const ln of layout.lines) {
      // 检查节拍光束是否扫到本行
      const beat = layout.beats[ln.index];
      let beatActive = false;
      let beatProgress = 0;
      if (beatClock >= 0 && beat) {
        if (beatClock >= beat.startT && beatClock <= beat.pauseEndT) {
          beatActive = true;
          beatProgress = Math.min(1, (beatClock - beat.startT) / Math.max(0.05, beat.endT - beat.startT));
        }
      }

      if (beatActive) {
        // 节拍扫描底层柔光轨
        ctx.save();
        ctx.fillStyle = beat.isStutter ? "rgba(255, 122, 92, 0.22)" : "rgba(190, 200, 25, 0.14)";
        ctx.fillRect(ln.rect.x - 4 * s, ln.rect.y - 2 * s, ln.rect.w * beatProgress + 8 * s, ln.rect.h + 4 * s);
        // 扫描游标竖光丝
        const beamX = ln.rect.x + ln.rect.w * beatProgress;
        ctx.fillStyle = beat.isStutter ? PALETTE.warn : PALETTE.limeBright;
        ctx.fillRect(beamX, ln.rect.y - 4 * s, Math.max(2, 2.5 * s), ln.rect.h + 8 * s);
        ctx.restore();
      }

      for (const chObj of ln.chars) {
        let color = PALETTE.cream;
        if (state.emphasis === "flood") {
          color = "#10100F";
        } else if (state.emphasis === "keyword" && chObj.isKeyword) {
          color = PALETTE.limeBright;
        }
        ctx.fillStyle = color;
        ctx.fillText(chObj.ch, chObj.x, ln.baselineY);
      }

      // 标出劈词行尾/行首或孤字行警示细框
      if (ln.startsWithPunct || (layout.hasOrphanTail && ln.index === layout.lines.length - 1)) {
        ctx.save();
        ctx.strokeStyle = PALETTE.warn;
        ctx.lineWidth = 1.25;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(ln.rect.x - 4 * s, ln.rect.y - 3 * s, ln.rect.w + 8 * s, ln.rect.h + 6 * s);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // 直引号尾标（DM Mono 机械直杠）
    if (state.quoteMark === "straight" && layout.lines.length > 0) {
      const last = layout.lines[layout.lines.length - 1];
      ctx.save();
      ctx.font = `500 ${layout.fontSize.toFixed(1)}px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.warn;
      ctx.fillText('"', last.rect.x + last.rect.w + 3 * s, last.baselineY);
      ctx.restore();
    }
    ctx.restore();

    // 8. 干笔荧光笔刷线（原海报标志母题）
    if (layout.brushRect) {
      drawDryBrushStroke(ctx, layout.brushRect, Math.min(1, revealT * 1.15));
    }

    // 9. 若为 giant 压字试错态，半透明重绘在文字之上，视觉直观展示“压字抢戏”！
    if (state.quoteMark === "giant") {
      drawGeometricQuotes(ctx, layout.openQuoteRect, false, PALETTE.lime, 0.78);
      drawGeometricQuotes(ctx, layout.closeQuoteRect, true, PALETTE.lime, 0.78);
    }

    // 10. 绘制字间气口刀（轻盈隐约的交互标点：已落刀显示明晰标记，劈词刀标赤珊瑚警示）
    ctx.save();
    for (const cut of layout.cuts) {
      const isHover = cut.cutIndex === hoverCutIdx;
      const hTick = Math.max(10 * s, layout.fontSize * 0.24);
      if (cut.active) {
        const col = cut.isBad ? PALETTE.warn : PALETTE.lime;
        ctx.strokeStyle = col;
        ctx.lineWidth = isHover ? 2.5 : 1.8;
        ctx.beginPath();
        ctx.moveTo(cut.x, cut.y - hTick * 0.85);
        ctx.lineTo(cut.x, cut.y + hTick * 0.85);
        ctx.stroke();
        // 小回行三角箭头
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(cut.x, cut.y + hTick * 0.85, Math.max(2.6, 3 * s), 0, Math.PI * 2);
        ctx.fill();
      } else if (isHover || (cut.isGood && !ev.pillars.rhythm.ok)) {
        // 仅在悬停或节奏有错时，温和提示自然气口位
        ctx.strokeStyle = isHover
          ? cut.isBad
            ? PALETTE.warn
            : PALETTE.limeBright
          : "rgba(190, 200, 25, 0.34)";
        ctx.lineWidth = isHover ? 2 : 1;
        ctx.setLineDash(isHover ? [] : [3, 3]);
        ctx.beginPath();
        ctx.moveTo(cut.x, cut.y - hTick * 0.7);
        ctx.lineTo(cut.x, cut.y + hTick * 0.7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();

    // 11. 出处署名区（严格按四种落款态实绘）
    if (layout.attrRect) {
      const ar = layout.attrRect;
      ctx.save();
      if (state.attribution === "quiet") {
        // 1:1 复刻原海报：酸黄绿破折号 + 名字 + 奶白大写英名 + 暖灰身份
        const fz = ar.fontPx;
        ctx.fillStyle = PALETTE.lime;
        ctx.font = `600 ${fz.toFixed(1)}px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(`——  ${sp.author}`, ar.x, ar.y);

        const enFz = Math.max(10, Math.round(fz * 0.68));
        ctx.fillStyle = PALETTE.cream;
        ctx.font = `500 ${enFz}px "Space Grotesk", sans-serif`;
        ctx.fillText(sp.authorEn, ar.x + fz * 2.1, ar.y + fz * 1.38);

        const roleFz = Math.max(10, Math.round(fz * 0.62));
        ctx.fillStyle = PALETTE.creamDim;
        ctx.font = `400 ${roleFz}px "Noto Sans SC", sans-serif`;
        ctx.fillText(sp.role, ar.x + fz * 2.1, ar.y + fz * 1.38 + enFz * 1.42);
      } else if (state.attribution === "rival") {
        // 抢主错态：同号粗奶白字直接争眼
        const fz = ar.fontPx;
        ctx.fillStyle = PALETTE.cream;
        ctx.font = `900 ${fz.toFixed(1)}px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(`—— ${sp.author}`, ar.x, ar.y);
        // 细红标框示意抢主
        ctx.strokeStyle = "rgba(255, 122, 92, 0.7)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(ar.x - 4 * s, ar.y - 3 * s, Math.min(sr.w, fz * (sp.author.length + 2.4)), fz * 1.18);
        ctx.setLineDash([]);
      } else if (state.attribution === "bio") {
        // 过长履历错态：大段文字塞满版底
        const fz = ar.fontPx;
        ctx.fillStyle = PALETTE.creamDim;
        ctx.font = `400 ${fz.toFixed(1)}px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "top";
        const maxW = ar.w;
        let line = "";
        let yy = ar.y;
        for (const ch of sp.longBio) {
          const test = line + ch;
          if (ctx.measureText(test).width > maxW) {
            ctx.fillText(line, ar.x, yy);
            line = ch;
            yy += fz * 1.5;
          } else {
            line = test;
          }
        }
        if (line) ctx.fillText(line, ar.x, yy);
        ctx.strokeStyle = "rgba(255, 122, 92, 0.55)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(ar.x - 4 * s, ar.y - 3 * s, maxW + 8 * s, yy - ar.y + fz * 1.5);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // 12. 画布底沿交互式单步校准浮签（仅在有错态时显示，点按即一步修掉当前头号错态）
    lastTagRect = null;
    if (ev.primary) {
      ctx.save();
      const tagText = ev.primary.canvasTag;
      const tagFz = Math.max(11, Math.round(12 * s));
      ctx.font = `600 ${tagFz}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tagText).width;
      const padX = Math.round(12 * s);
      const boxW = Math.min(W - 24 * s, tw + padX * 2);
      const boxH = Math.max(26, Math.round(28 * s));
      const bx = Math.round((W - boxW) * 0.5);
      const by = Math.round(H - boxH - 12 * s);
      ctx.fillStyle = "#2A1511";
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.25;
      ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);
      ctx.fillStyle = "#FFD7CC";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, bx + boxW * 0.5, by + boxH * 0.5 + 0.5, boxW - 12);
      ctx.restore();
      lastTagRect = { x: bx, y: by, w: boxW, h: boxH, patch: ev.primary.fixPatch };
    }

    return { layout, ev };
  }

  // 坐标映射工具
  function pointInCanvas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitCut(pt) {
    if (!lastLayout) return -1;
    let best = -1;
    let bestDist = Infinity;
    for (const c of lastLayout.cuts) {
      const dx = pt.x - c.x;
      const dy = pt.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d <= c.hitR && d < bestDist) {
        bestDist = d;
        best = c.cutIndex;
      }
    }
    return best;
  }

  function hitTag(pt) {
    if (!lastTagRect) return false;
    return (
      pt.x >= lastTagRect.x &&
      pt.x <= lastTagRect.x + lastTagRect.w &&
      pt.y >= lastTagRect.y &&
      pt.y <= lastTagRect.y + lastTagRect.h
    );
  }

  // 指针交互（横拖连续推拉字号尺度；轻点气口刀或纠偏红签）
  // 兼容触屏竖滑页面：touch-action: pan-y，只有明显横向拖动才改 scale
  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = pointInCanvas(e.clientX, e.clientY);
    isDragging = true;
    dragMoved = false;
    dragStartX = pt.x;
    dragStartY = pt.y;
    dragStartScale = getState().scale;
    if (canvas.setPointerCapture && e.pointerId !== undefined) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // 忽略合成事件无活跃 pointerId
      }
    }
  }

  function onPointerMove(e) {
    const pt = pointInCanvas(e.clientX, e.clientY);
    if (!isDragging) {
      const c = hitCut(pt);
      const onT = hitTag(pt);
      if (c !== hoverCutIdx) {
        hoverCutIdx = c;
      }
      canvas.style.cursor = onT || c >= 0 ? "pointer" : "ew-resize";
      return;
    }
    const dx = pt.x - dragStartX;
    const dy = pt.y - dragStartY;
    if (!dragMoved && Math.abs(dx) > 5 && Math.abs(dx) >= Math.abs(dy) * 0.8) {
      dragMoved = true;
    }
    if (dragMoved) {
      const delta = (dx / Math.max(220, logicalW * 0.55)) * 1.45;
      const next = Math.max(1.0, Math.min(3.0, +(dragStartScale + delta).toFixed(2)));
      onScaleChange(next);
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    const pt = pointInCanvas(e.clientX, e.clientY);
    if (!dragMoved) {
      if (hitTag(pt) && lastTagRect?.patch) {
        onQuickFix(lastTagRect.patch);
      } else {
        const cut = hitCut(pt);
        if (cut >= 0) onToggleBreak(cut);
      }
    }
  }

  // 同时兼容 CDP touch 事件（perf.mjs 用 Input.dispatchTouchEvent 左右拖）
  let touchStartX = 0;
  let touchStartScale = 1.18;
  let touchDragging = false;
  function onTouchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    const t0 = e.touches[0];
    const pt = pointInCanvas(t0.clientX, t0.clientY);
    touchStartX = pt.x;
    touchStartScale = getState().scale;
    touchDragging = true;
  }
  function onTouchMove(e) {
    if (!touchDragging || !e.touches || !e.touches[0]) return;
    const t0 = e.touches[0];
    const pt = pointInCanvas(t0.clientX, t0.clientY);
    const dx = pt.x - touchStartX;
    const delta = (dx / Math.max(180, logicalW * 0.5)) * 1.35;
    const next = Math.max(1.0, Math.min(3.0, +(touchStartScale + delta).toFixed(2)));
    onScaleChange(next);
  }
  function onTouchEnd() {
    touchDragging = false;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => {
    isDragging = false;
  });
  canvas.addEventListener("pointerleave", () => {
    hoverCutIdx = -1;
  });
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  return {
    render,
    startBeatPlayback,
    stopBeatPlayback,
    isBeatPlaying,
    getLast: () => ({ layout: lastLayout, ev: lastEval }),
  };
}
