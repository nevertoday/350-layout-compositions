import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  HERO_PARAS,
  NO_START,
  NO_END,
  HANG_LEFT,
  HANG_RIGHT,
  clamp,
  clearGlyphCache,
  measureGlyph,
  layoutHeroColumn,
  snapHangValue,
  analyzeGlyphAnatomy,
  computeWesternClassMetrics,
  evaluateQuizOptions,
} from "./model.js";

const COLORS = {
  bg: "#010B17",
  bgSlate: "#081628",
  paper: "#F2E6CA",
  cream: "#F2E6CA",
  ivory: "#FBF7E4",
  gold: "#F4C316",
  goldSoft: "rgba(244, 195, 22, 0.22)",
  goldDim: "rgba(244, 195, 22, 0.55)",
  muted: "#9FA4A2",
  rule: "#596472",
  alert: "#E66E3C",
  alertSoft: "rgba(230, 110, 60, 0.28)",
};

const FONT_SERIF_SC = '"Noto Serif SC", serif';
const FONT_DISPLAY = '"Noto Sans SC", sans-serif';
const FONT_BODY = '"LXGW WenKai", serif';
const FONT_LATIN = '"Fraunces", serif';

function setupCanvas(canvas) {
  const dpr = pixelRatio(2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(10, Math.round(rect.width));
  const h = Math.max(10, Math.round(rect.height));
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

function fmtSignedEm(v) {
  const r = Math.abs(v) < 0.005 ? 0 : v;
  const sign = r > 0 ? "+" : r < 0 ? "−" : "";
  return `${sign}${Math.abs(r).toFixed(2)} em`;
}

// =========================================================================
// HERO：活字边界校直台（单一《兰亭集序》真实两端齐行标本，常驻墨边剖面，长按/空格眯眼）
// =========================================================================
function initHero() {
  const wrap = document.getElementById("hero-stage-wrap");
  const canvas = document.getElementById("hero-canvas");
  const handleLeft = document.getElementById("handle-left");
  const handleRight = document.getElementById("handle-right");
  const squintPill = document.getElementById("squint-pill");
  const badgeNeedle = document.getElementById("badge-needle");
  const badgeTip = document.getElementById("badge-tip");
  const diagTier = document.getElementById("diag-tier");
  const readLeft = document.getElementById("read-left");
  const readRight = document.getElementById("read-right");
  const readReflow = document.getElementById("read-reflow");
  const diagTitle = document.getElementById("diag-title");
  const diagBody = document.getElementById("diag-body");
  const btnAlign = document.getElementById("btn-hero-align");
  const btnReset = document.getElementById("btn-hero-reset");

  const state = {
    leftHang: 0,
    rightHang: 0,
    targetLeft: 0,
    targetRight: 0,
    squint: false,
    squintAnim: 0,
    intro: reducedMotion.matches ? 1 : 0,
    draggingSide: null,
    dragPulse: 0,
    dirty: true,
    lastLayout: null,
    geom: null,
    leftBoxes: [],
    rightBoxes: [],
    lastDomSig: "",
  };

  function computeLayout(w) {
    const isLandscapeShort = window.innerHeight <= 460 && window.innerWidth > window.innerHeight;
    const isNarrow = w < 540 && !isLandscapeShort;
    const cols = isNarrow ? 10 : 14;
    const lineFactor = isNarrow ? 1.44 : isLandscapeShort ? 1.35 : 1.38;

    let fontSize;
    if (isNarrow) {
      // 窄屏（含 390×844）将栏宽提到台面约 82–84%（10 字/行约 28–29px），同时为凸排与外侧剖面留足边白
      const targetColW = w * 0.82;
      fontSize = clamp(Math.floor((targetColW / cols) * 2) / 2, 22, 34);
    } else if (isLandscapeShort) {
      // 手机横屏 844×390：14 字/行 6 行无孤行，字号兼顾横宽与 270px 内竖高
      const byWidth = (w * 0.80) / cols;
      const byHeight = (268 - 48) / (5 * lineFactor + 1.24);
      fontSize = clamp(Math.floor(Math.min(byWidth, byHeight) * 2) / 2, 18, 28);
    } else {
      // 平板竖屏（768 / 1024）与桌面（1440 / 2560）：两侧预留原海报圆点引线空间，高度按实际行数紧贴
      const maxColForCallouts = Math.max(w * 0.60, w - 276);
      const targetColW = Math.min(w * 0.62, maxColForCallouts);
      const maxDesktopFz = window.innerWidth >= 1920 ? 62 : window.innerWidth >= 1280 ? 51 : 48;
      fontSize = clamp(Math.floor((targetColW / cols) * 2) / 2, 24, maxDesktopFz);
    }

    const laid = layoutHeroColumn({
      paras: HERO_PARAS,
      cols,
      fontSize,
      leftHang: state.leftHang,
      rightHang: state.rightHang,
    });

    const colLeft = Math.round((w - laid.colWidthPx) / 2);
    const colRight = colLeft + laid.colWidthPx;
    const wideMargin = colLeft >= 132 && w - colRight >= 132;

    const lineStep = fontSize * lineFactor;
    const paraGap = fontSize * 0.24;
    const hasSecondPara = laid.lines.some((l) => l.paraIndex > 0);
    const topPad = wideMargin ? 24 : 34;
    const botPad = wideMargin ? 24 : isLandscapeShort ? 16 : 20;
    const topY = Math.round(topPad + fontSize * 0.88);
    const lastY = topY + (laid.lines.length - 1) * lineStep + (hasSecondPara ? paraGap : 0);
    const idealH = Math.ceil(lastY + fontSize * 0.22 + botPad);

    return { laid, cols, fontSize, lineStep, paraGap, colLeft, colRight, topY, idealH, wideMargin };
  }

  function updateReadouts(laid) {
    const lPct = Math.round(state.leftHang * 100);
    const rPct = Math.round(state.rightHang * 100);
    const sig = `${lPct}|${rPct}|${laid.tier}|${laid.pushedCount}|${laid.savedCount}|${laid.rHangCount}|${Math.round(laid.avgLeftDevEm * 100)}|${Math.round(laid.avgRightDevEm * 100)}`;
    if (sig === state.lastDomSig) return;
    state.lastDomSig = sig;

    readLeft.textContent = `${lPct}%`;
    readRight.textContent = `${rPct}%`;

    if (laid.pushedCount > 0) {
      readReflow.textContent = `推字拉散 ${laid.pushedCount} 行`;
    } else if (laid.savedCount > 0 && laid.maxSqueezeEm < -0.014) {
      readReflow.textContent = `已免推字 · 释挤压中`;
    } else if (laid.savedCount > 0) {
      readReflow.textContent = `免推字且免挤压`;
    } else {
      readReflow.textContent = `行排稳定`;
    }

    const tierMap = {
      raw: "框齐眼歪 · 边缘塌陷",
      partial: "半凸未齐 · 仍有微缺",
      optimal: "光学齐边 · 微微出界",
      over: "过度凸排 · 字墙外凸",
    };
    diagTier.textContent = tierMap[laid.tier];
    diagTier.dataset.tier = laid.tier;

    const optLPct = Math.round(laid.optLeft * 100);
    const optRPct = Math.round(laid.optRight * 100);
    const threshPct = Math.round(laid.reflowThreshold * 100);

    if (laid.tier === "raw") {
      diagTitle.textContent = "标点锁在框内，左缘顶角塌陷、右缘触发禁则推字";
      diagBody.textContent = `此刻左引号与右点号均留在版心框内：引语首字被顶退 ${fmtSignedEm(laid.avgLeftDevEm)}，右缘第 ${laid.cols === 10 ? "2" : "3"} 行因避头禁则被迫推字拉散。按住台面任一金黄标点向外跨线，拖过约 ${threshPct}% 点号字宽即可现场触发免推字重排。`;
    } else if (laid.tier === "partial") {
      if (laid.leftAligned && !laid.rightAligned) {
        diagTitle.textContent = "左缘字墙已绷直，右缘仍待挂出单点号";
        diagBody.textContent = `左缘首字墨边偏差已收至 ${fmtSignedEm(laid.avgLeftDevEm)}；右侧还有 ${laid.pushedCount > 0 ? `${laid.pushedCount} 行处于禁则推字` : `微缺 ${fmtSignedEm(laid.avgRightDevEm)}`}，继续向右拖动任一金黄逗号或句号至约 ${optRPct}% 自身字宽，即可免推字并释净挤压。`;
      } else if (laid.rightAligned && !laid.leftAligned) {
        diagTitle.textContent = "右缘免推字齐边，左缘开引号仍留缺口";
        diagBody.textContent = `右缘单点号已挂出并消除禁则推字，左缘开引号还停在 ${lPct}%（首字退缩 ${fmtSignedEm(laid.avgLeftDevEm)}），把任一金黄开引号向左拖近 ${optLPct}% 自身字宽即可对齐左侧字墙。`;
      } else {
        diagTitle.textContent = "边界正在收直，尚差最后半步";
        diagBody.textContent = `当前左缘偏差 ${fmtSignedEm(laid.avgLeftDevEm)}、右缘偏差 ${fmtSignedEm(laid.avgRightDevEm)}${laid.savedCount > 0 && laid.maxSqueezeEm < -0.014 ? "，被拉回的行正在逐步释放字距挤压" : ""}。长按台面空白处或按住空格眯眼看边，能直接检验缺口是否愈合。`;
      }
    } else if (laid.tier === "optimal") {
      diagTitle.textContent = "字墙一线贯通，轻标点恰如其分微微出界";
      diagBody.textContent = `左引号挂出 ${lPct}%、右单点号挂出 ${rPct}%（均按当前粗宋体实测字宽），全栏实字墨边误差收进 ±${laid.alignedTolEm.toFixed(2)} em 以内，${laid.savedCount} 处行尾禁则同时免推字且免挤压；段尾连续标点「。”」「。」依 CLREQ 仍守在框内。`;
    } else {
      diagTitle.textContent = "凸排过头：连实心汉字也被拉出了版心线";
      diagBody.textContent = `${laid.leftOver ? `左缘首字已外凸 ${fmtSignedEm(laid.avgLeftDevEm)}` : ""}${laid.leftOver && laid.rightOver ? "，" : ""}${laid.rightOver ? `右缘末字已外凸 ${fmtSignedEm(laid.avgRightDevEm)}` : ""}——超过了原海报强调的「微微」二字，字墙反倒向外鼓包。往回轻轻收回至约 ${optLPct}% / ${optRPct}% 即可重新贴直。`;
    }

    // 联动原海报动态金黄圆徽标：圆心 (44,44)，半径 36（右缘 x=80）
    const prog = (clamp(state.leftHang / laid.optLeft, 0, 1.35) + clamp(state.rightHang / laid.optRight, 0, 1.35)) / 2;
    const tipX = 44 + clamp(10 + prog * 26, 10, 41);
    const overColor = laid.tier === "over" ? COLORS.alert : COLORS.bg;
    badgeNeedle.setAttribute("x2", tipX.toFixed(1));
    badgeNeedle.setAttribute("stroke", overColor);
    badgeTip.setAttribute("cx", tipX.toFixed(1));
    badgeTip.setAttribute("fill", overColor);
  }

  function syncHandles(g) {
    if (!g) return;
    const { w, h } = g;
    const firstL = state.leftBoxes[0];
    if (firstL) {
      const lx = clamp(firstL.cx, 24, w - 24);
      const ly = clamp(firstL.cy, 24, h - 24);
      handleLeft.style.left = `${lx}px`;
      handleLeft.style.top = `${ly}px`;
    }
    const firstR = state.rightBoxes[0];
    if (firstR) {
      const rx = clamp(firstR.cx, 24, w - 24);
      const ry = clamp(firstR.cy, 24, h - 24);
      handleRight.style.left = `${rx}px`;
      handleRight.style.top = `${ry}px`;
    }
  }

  function drawHero(t, dt, { still }) {
    if (still) {
      state.intro = 1;
      state.leftHang = state.targetLeft;
      state.rightHang = state.targetRight;
      state.squintAnim = state.squint ? 1 : 0;
    } else {
      const prevIntro = state.intro;
      if (state.intro < 1) {
        state.intro = Math.min(1, state.intro + (dt || 0.016) * 1.9);
        if (state.intro !== prevIntro) state.dirty = true;
      }
      const ease = 1 - Math.exp(-(dt || 0.016) * 20);
      if (Math.abs(state.targetLeft - state.leftHang) > 0.0008) {
        state.leftHang += (state.targetLeft - state.leftHang) * ease;
        state.dirty = true;
      } else if (state.leftHang !== state.targetLeft) {
        state.leftHang = state.targetLeft;
        state.dirty = true;
      }
      if (Math.abs(state.targetRight - state.rightHang) > 0.0008) {
        state.rightHang += (state.targetRight - state.rightHang) * ease;
        state.dirty = true;
      } else if (state.rightHang !== state.targetRight) {
        state.rightHang = state.targetRight;
        state.dirty = true;
      }
      const sqTarget = state.squint ? 1 : 0;
      if (Math.abs(sqTarget - state.squintAnim) > 0.004) {
        state.squintAnim += (sqTarget - state.squintAnim) * ease;
        state.dirty = true;
      } else if (state.squintAnim !== sqTarget) {
        state.squintAnim = sqTarget;
        state.dirty = true;
      }
      if (state.dragPulse > 0.005) {
        state.dragPulse *= Math.exp(-(dt || 0.016) * 12);
        state.dirty = true;
      } else {
        state.dragPulse = 0;
      }
    }

    if (!state.dirty) return;
    state.dirty = false;

    const wrapW = Math.max(10, Math.round(wrap.getBoundingClientRect().width));
    const geom = computeLayout(wrapW);
    if (Math.abs(wrap.clientHeight - geom.idealH) > 1) {
      wrap.style.height = `${geom.idealH}px`;
    }

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    state.geom = { ...geom, w, h };
    const { laid, fontSize, lineStep, paraGap, colLeft, colRight, topY, wideMargin } = geom;
    state.lastLayout = laid;

    const introEase = 1 - Math.pow(1 - state.intro, 3);
    const hasSecondPara = laid.lines.some((l) => l.paraIndex > 0);
    const lastLineY = topY + (laid.lines.length - 1) * lineStep + (hasSecondPara ? paraGap : 0);
    const guideTop = Math.max(wideMargin ? 12 : 26, topY - fontSize * 0.96);
    const guideBot = Math.min(h - 10, lastLineY + fontSize * 0.34);
    const guideSpan = (guideBot - guideTop) * introEase;

    // 1) 左右贯穿版心虚线（复刻原海报）
    ctx.save();
    ctx.strokeStyle = COLORS.rule;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(colLeft + 0.5, guideTop);
    ctx.lineTo(colLeft + 0.5, guideTop + guideSpan);
    ctx.moveTo(colRight + 0.5, guideTop);
    ctx.lineTo(colRight + 0.5, guideTop + guideSpan);
    ctx.stroke();
    ctx.restore();

    // 2) 计算每行基线坐标与标点命中盒
    state.leftBoxes = [];
    state.rightBoxes = [];
    const lineYs = [];
    for (let i = 0; i < laid.lines.length; i++) {
      const ln = laid.lines[i];
      const y = topY + i * lineStep + (ln.paraIndex > 0 ? paraGap : 0);
      lineYs.push(y);
      for (const g of ln.glyphs) {
        if (g.isHangLeft) {
          state.leftBoxes.push({
            x: colLeft + g.x,
            y: y - fontSize * 0.85,
            w: g.metric.advPx,
            h: fontSize * 1.05,
            cx: colLeft + g.x + g.metric.advPx * 0.5,
            cy: y - fontSize * 0.34,
            advPx: g.metric.advPx,
            lineIndex: i,
          });
        }
        if (g.isHangRight) {
          state.rightBoxes.push({
            x: colLeft + g.x,
            y: y - fontSize * 0.85,
            w: g.metric.advPx,
            h: fontSize * 1.05,
            cx: colLeft + g.x + g.metric.advPx * 0.5,
            cy: y - fontSize * 0.34,
            advPx: g.metric.advPx,
            lineIndex: i,
          });
        }
      }
    }

    // 3) 外侧边白墨边剖面：仅绘于版心虚线外侧边白里（短横偏差条 + 端点 + 外侧竖连线），绝不穿过文字区；
    //    淡底条仅在拖动过程中临时出现，静止时正文区域完全净洁。
    const isDragging = state.draggingSide !== null || state.dragPulse > 0.04;
    const maxOutPx = wideMargin ? clamp(fontSize * 0.54, 18, 28) : clamp(colLeft - 16, 10, 15);
    const devScalePx = maxOutPx / 1.04;
    const leftBaseX = colLeft - 3;
    const rightBaseX = colRight + 3;

    ctx.save();
    if (isDragging) {
      const wallLeftX = colLeft + laid.wallLeftPx;
      const wallRightX = colLeft + laid.wallRightPx;
      const barHalfH = fontSize * 0.30;
      ctx.globalAlpha = state.draggingSide ? 0.9 : clamp(state.dragPulse, 0, 1) * 0.9;
      for (let i = 0; i < laid.lines.length; i++) {
        const ln = laid.lines[i];
        const cy = lineYs[i] - fontSize * 0.34;
        if (state.draggingSide === "left" && Math.abs(ln.leftDevEm) > laid.alignedTolEm) {
          const lx = colLeft + ln.inkLeftEdgePx;
          ctx.fillStyle = ln.leftDevEm < 0 ? COLORS.alertSoft : COLORS.goldSoft;
          ctx.fillRect(Math.min(wallLeftX, lx), cy - barHalfH, Math.abs(lx - wallLeftX), barHalfH * 2);
        }
        if (state.draggingSide === "right" && ln.inkRightEdgePx != null && Math.abs(ln.rightDevEm) > laid.alignedTolEm) {
          const rx = colLeft + ln.inkRightEdgePx;
          ctx.fillStyle = ln.rightDevEm < 0 ? COLORS.alertSoft : COLORS.goldSoft;
          ctx.fillRect(Math.min(wallRightX, rx), cy - barHalfH, Math.abs(rx - wallRightX), barHalfH * 2);
        }
      }
      ctx.globalAlpha = 1;
    }

    const leftOuterPts = [];
    const rightOuterPts = [];
    for (let i = 0; i < laid.lines.length; i++) {
      const ln = laid.lines[i];
      const cy = lineYs[i] - fontSize * 0.34;
      const lOk = Math.abs(ln.leftDevEm) <= laid.alignedTolEm;
      const lOut = lOk ? 0 : clamp(Math.abs(ln.leftDevEm) * devScalePx, 4, maxOutPx);
      leftOuterPts.push({ x: leftBaseX - lOut, y: cy, devEm: ln.leftDevEm, lineIndex: i });

      if (ln.inkRightEdgePx != null) {
        const rOk = Math.abs(ln.rightDevEm) <= laid.alignedTolEm;
        const rOut = rOk ? 0 : clamp(Math.abs(ln.rightDevEm) * devScalePx, 4, maxOutPx);
        rightOuterPts.push({ x: rightBaseX + rOut, y: cy, devEm: ln.rightDevEm, lineIndex: i });
      }
    }

    const drawOuterProfile = (pts, baseX, isOverAny) => {
      if (!pts.length) return;
      if (pts.length >= 2) {
        ctx.strokeStyle = isOverAny ? "rgba(230, 110, 60, 0.72)" : "rgba(244, 195, 22, 0.48)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }
      for (const p of pts) {
        const ok = Math.abs(p.devEm) <= laid.alignedTolEm;
        const over = p.devEm < -laid.alignedTolEm;
        if (!ok) {
          ctx.strokeStyle = over ? COLORS.alert : COLORS.gold;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(baseX, p.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.fillStyle = over ? COLORS.alert : ok ? COLORS.gold : COLORS.cream;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ok ? 2.3 : 3.0, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    drawOuterProfile(leftOuterPts, leftBaseX, laid.leftOver);
    drawOuterProfile(rightOuterPts, rightBaseX, laid.rightOver);
    ctx.restore();

    // 4) 推字拉散 / 释放挤压的行间微标（在文字下方轻轻画出字距拉散微刻度）
    for (let i = 0; i < laid.lines.length; i++) {
      const ln = laid.lines[i];
      const y = lineYs[i];
      if (ln.status === "pushed" && ln.glyphs.length > 2) {
        ctx.save();
        ctx.strokeStyle = "rgba(230, 110, 60, 0.72)";
        ctx.lineWidth = 1.25;
        const tickY = y + fontSize * 0.22;
        for (let k = 0; k < ln.glyphs.length - 1; k++) {
          const a = ln.glyphs[k];
          const b = ln.glyphs[k + 1];
          const gapStart = colLeft + a.x + a.metric.advPx;
          const gapEnd = colLeft + b.x;
          if (gapEnd - gapStart > 1.2) {
            ctx.beginPath();
            ctx.moveTo(gapStart, tickY);
            ctx.lineTo(gapEnd, tickY);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }

    // 5) 渲染真实粗宋体《兰亭集序》两端齐行文字（长按/空格触发眯眼低频虚化）
    ctx.save();
    if (state.squintAnim > 0.01) {
      ctx.filter = `blur(${(state.squintAnim * 3.8).toFixed(2)}px)`;
    }
    ctx.font = `600 ${fontSize}px ${FONT_SERIF_SC}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    for (let i = 0; i < laid.lines.length; i++) {
      const ln = laid.lines[i];
      const y = lineYs[i];
      for (const g of ln.glyphs) {
        const isGold = g.isHangLeft || g.isHangRight;
        if (isGold) {
          const active =
            (g.isHangLeft && state.draggingSide === "left") ||
            (g.isHangRight && state.draggingSide === "right");
          ctx.fillStyle = active ? "#FFE066" : COLORS.gold;
        } else {
          ctx.fillStyle = COLORS.ivory;
        }
        ctx.fillText(g.char, colLeft + g.x, y);
      }
    }
    ctx.restore();

    // 6) 可拖标点温和抓取导引（箭头避开外侧偏差条端点，互不压叠）
    const drawGrabCue = (box, dir, active, outerTipX) => {
      if (!box) return;
      ctx.save();
      const pad = Math.max(2.5, fontSize * 0.08);
      const bx = box.x - pad;
      const by = box.y - pad * 0.35;
      const bw = box.w + pad * 2;
      const bh = box.h + pad * 0.7;
      ctx.strokeStyle = active ? COLORS.gold : "rgba(244, 195, 22, 0.38)";
      ctx.lineWidth = active ? 1.5 : 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);
      const rawArrowX = dir < 0 ? Math.min(bx - 7, outerTipX - 8) : Math.max(bx + bw + 7, outerTipX + 8);
      const arrowX = clamp(rawArrowX, 7, w - 7);
      const arrowY = by + bh * 0.5;
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      if (dir < 0) {
        ctx.moveTo(arrowX - 5, arrowY);
        ctx.lineTo(arrowX + 1, arrowY - 4);
        ctx.lineTo(arrowX + 1, arrowY + 4);
      } else {
        ctx.moveTo(arrowX + 5, arrowY);
        ctx.lineTo(arrowX - 1, arrowY - 4);
        ctx.lineTo(arrowX - 1, arrowY + 4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    const firstLBox = state.leftBoxes[0];
    const firstRBox = state.rightBoxes[0];
    const firstLTip = firstLBox ? (leftOuterPts.find((p) => p.lineIndex === firstLBox.lineIndex)?.x ?? leftBaseX) : leftBaseX;
    const firstRTip = firstRBox ? (rightOuterPts.find((p) => p.lineIndex === firstRBox.lineIndex)?.x ?? rightBaseX) : rightBaseX;
    drawGrabCue(firstLBox, -1, state.draggingSide === "left", firstLTip);
    drawGrabCue(firstRBox, 1, state.draggingSide === "right", firstRTip);

    // 7) 复刻原海报左右外白圆点引线与实时墨边读数
    ctx.save();
    const lPct = Math.round(state.leftHang * 100);
    const rPct = Math.round(state.rightHang * 100);

    if (wideMargin) {
      const leadLen = clamp(colLeft * 0.3, 28, 56);
      // 左侧圆点引线（对齐第 4 行附近，复刻原海报）
      const lyRef = lineYs[Math.min(3, lineYs.length - 1)] - fontSize * 0.34;
      ctx.strokeStyle = COLORS.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(colLeft - leadLen, lyRef);
      ctx.lineTo(colLeft, lyRef);
      ctx.stroke();
      ctx.fillStyle = COLORS.muted;
      ctx.beginPath();
      ctx.arc(colLeft, lyRef, 3.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = `500 13px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLORS.muted;
      ctx.fillText("版心左边界", colLeft - leadLen - 8, lyRef - 10);
      ctx.font = `700 13px ${FONT_LATIN}`;
      ctx.fillStyle = laid.leftOver ? COLORS.alert : laid.leftAligned ? COLORS.gold : COLORS.cream;
      ctx.fillText(`${lPct}% · ${fmtSignedEm(laid.avgLeftDevEm)}`, colLeft - leadLen - 8, lyRef + 10);

      // 右侧圆点引线（对齐第 2 行附近，复刻原海报）
      const ryRef = lineYs[Math.min(1, lineYs.length - 1)] - fontSize * 0.34;
      ctx.strokeStyle = COLORS.muted;
      ctx.beginPath();
      ctx.moveTo(colRight, ryRef);
      ctx.lineTo(colRight + leadLen, ryRef);
      ctx.stroke();
      ctx.fillStyle = COLORS.muted;
      ctx.beginPath();
      ctx.arc(colRight, ryRef, 3.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.font = `500 13px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLORS.muted;
      const rightTag = laid.pushedCount > 0 ? "禁则推字拉散" : laid.rightOver ? "字墙外凸过头" : "标点微微超出边界";
      ctx.fillText(rightTag, colRight + leadLen + 8, ryRef - 10);
      ctx.font = `700 13px ${FONT_LATIN}`;
      ctx.fillStyle = laid.rightOver ? COLORS.alert : laid.rightAligned ? COLORS.gold : COLORS.cream;
      ctx.fillText(`${rPct}% · ${fmtSignedEm(laid.avgRightDevEm)}`, colRight + leadLen + 8, ryRef + 10);

      // 标出推字/免推字行的简洁行侧批注（避开外侧剖面短横条）
      const noteOffsetX = Math.max(fontSize * 1.15, maxOutPx + 18);
      for (let i = 0; i < laid.lines.length; i++) {
        const ln = laid.lines[i];
        if (ln.status === "pushed" || ln.status === "hung-saved") {
          const sy = lineYs[i] - fontSize * 0.32;
          if (Math.abs(sy - ryRef) > 36) {
            ctx.font = `700 11.5px ${FONT_DISPLAY}`;
            ctx.fillStyle = ln.status === "pushed" ? COLORS.alert : COLORS.gold;
            const txt = ln.status === "pushed" ? "← 禁则推字" : ln.trackingEm < -0.015 ? "← 免推字(释挤压)" : "← 免推字·齐边";
            ctx.fillText(txt, colRight + noteOffsetX, sy);
          }
        }
      }
    } else {
      // 窄屏顶部紧凑双界读数（位于 guideTop 上方独立带，绝不溢出或遮字）
      ctx.textBaseline = "top";
      ctx.font = `700 11.5px ${FONT_DISPLAY}`;
      ctx.textAlign = "left";
      ctx.fillStyle = laid.leftOver ? COLORS.alert : laid.leftAligned ? COLORS.gold : COLORS.muted;
      ctx.fillText(`左界 ${lPct}% (${fmtSignedEm(laid.avgLeftDevEm)})`, 4, 4);

      ctx.textAlign = "right";
      ctx.fillStyle = laid.rightOver ? COLORS.alert : laid.rightAligned ? COLORS.gold : COLORS.muted;
      ctx.fillText(`右界 ${rPct}% (${laid.pushedCount > 0 ? "推字" : fmtSignedEm(laid.avgRightDevEm)})`, w - 4, 4);
    }
    ctx.restore();

    syncHandles(state.geom);
    updateReadouts(laid);
  }

  const ctrl = loop(canvas, drawHero);

  // ---------- 拖拽与长按眯眼交互 ----------
  let activeDrag = null;
  let squintTimer = 0;
  let squintOrigin = null;

  function setSquint(on) {
    if (state.squint === on) return;
    state.squint = on;
    squintPill.hidden = !on;
    state.dirty = true;
    ctrl.draw();
  }

  function applyDragDelta(side, startVal, dx, advPx) {
    const dir = side === "left" ? -1 : 1;
    const raw = clamp(startVal + (dir * dx) / Math.max(14, advPx), 0, 1.4);
    const laid = state.lastLayout;
    const opt = side === "left" ? (laid ? laid.optLeft : 1) : (laid ? laid.optRight : 1);
    const tol = side === "left" ? (laid ? laid.snapTolLeft : 0.06) : (laid ? laid.snapTolRight : 0.06);
    const snapped = snapHangValue(raw, opt, tol);
    if (side === "left") {
      state.targetLeft = snapped;
      state.leftHang = snapped;
    } else {
      state.targetRight = snapped;
      state.rightHang = snapped;
    }
    state.dragPulse = 1;
    state.dirty = true;
    ctrl.draw();
  }

  function startHandleDrag(side, clientX, pointerId, captureEl) {
    const boxes = side === "left" ? state.leftBoxes : state.rightBoxes;
    const advPx = boxes[0]?.advPx || (state.geom ? state.geom.fontSize : 32);
    activeDrag = {
      side,
      startX: clientX,
      startVal: side === "left" ? state.targetLeft : state.targetRight,
      advPx,
      pointerId,
      captureEl,
    };
    state.draggingSide = side;
    canvas.classList.add("is-dragging");
    (side === "left" ? handleLeft : handleRight).classList.add("is-active");
    if (captureEl && pointerId != null && captureEl.setPointerCapture) {
      try { captureEl.setPointerCapture(pointerId); } catch {}
    }
    state.dirty = true;
    ctrl.draw();
  }

  function endDrag() {
    if (!activeDrag) return;
    activeDrag = null;
    state.draggingSide = null;
    canvas.classList.remove("is-dragging");
    handleLeft.classList.remove("is-active");
    handleRight.classList.remove("is-active");
    state.dirty = true;
    ctrl.draw();
  }

  for (const btn of [handleLeft, handleRight]) {
    const side = btn.dataset.side;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startHandleDrag(side, e.clientX, e.pointerId, btn);
    });
    btn.addEventListener("pointermove", (e) => {
      if (!activeDrag || activeDrag.captureEl !== btn) return;
      e.preventDefault();
      applyDragDelta(activeDrag.side, activeDrag.startVal, e.clientX - activeDrag.startX, activeDrag.advPx);
    });
    btn.addEventListener("pointerup", () => endDrag());
    btn.addEventListener("pointercancel", () => endDrag());

    // 键盘方向键微调（5%，Shift 1%，0 归零，Space 眯眼）
    btn.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSquint(true);
        return;
      }
      if (e.key === "0") {
        e.preventDefault();
        if (side === "left") state.targetLeft = 0;
        else state.targetRight = 0;
        state.dirty = true;
        ctrl.draw();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 0.01 : 0.05;
        const delta = (side === "left" ? (e.key === "ArrowLeft" ? 1 : -1) : (e.key === "ArrowRight" ? 1 : -1)) * step;
        if (side === "left") state.targetLeft = clamp(state.targetLeft + delta, 0, 1.4);
        else state.targetRight = clamp(state.targetRight + delta, 0, 1.4);
        state.dirty = true;
        ctrl.draw();
      }
    });
    btn.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSquint(false);
      }
    });
    btn.addEventListener("blur", () => setSquint(false));
  }

  // 直接按住画布上任一金黄标点跨线拖，或长按画布空白处眯眼看边
  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const hitPad = 14;
    const hitBox = (b) => px >= b.x - hitPad && px <= b.x + b.w + hitPad && py >= b.y - hitPad && py <= b.y + b.h + hitPad;

    if (state.leftBoxes.some(hitBox)) {
      e.preventDefault();
      startHandleDrag("left", e.clientX, e.pointerId, canvas);
      return;
    }
    if (state.rightBoxes.some(hitBox)) {
      e.preventDefault();
      startHandleDrag("right", e.clientX, e.pointerId, canvas);
      return;
    }

    // 空白区域：长按眯眼（不锁触屏竖滚）
    squintOrigin = { x: e.clientX, y: e.clientY };
    clearTimeout(squintTimer);
    squintTimer = setTimeout(() => {
      setSquint(true);
    }, e.pointerType === "mouse" ? 120 : 220);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (activeDrag && activeDrag.captureEl === canvas) {
      e.preventDefault();
      applyDragDelta(activeDrag.side, activeDrag.startVal, e.clientX - activeDrag.startX, activeDrag.advPx);
      return;
    }
    if (squintOrigin) {
      const dist = Math.hypot(e.clientX - squintOrigin.x, e.clientY - squintOrigin.y);
      if (dist > 10) {
        clearTimeout(squintTimer);
        squintOrigin = null;
        if (state.squint) setSquint(false);
      }
    }
  });

  const clearCanvasPointer = () => {
    clearTimeout(squintTimer);
    squintOrigin = null;
    if (state.squint) setSquint(false);
    endDrag();
  };
  canvas.addEventListener("pointerup", clearCanvasPointer);
  canvas.addEventListener("pointercancel", clearCanvasPointer);
  canvas.addEventListener("pointerleave", clearCanvasPointer);

  canvas.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      setSquint(true);
    } else if (e.key === "0") {
      e.preventDefault();
      state.targetLeft = 0;
      state.targetRight = 0;
      state.dirty = true;
      ctrl.draw();
    }
  });
  canvas.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      setSquint(false);
    }
  });
  canvas.addEventListener("blur", () => setSquint(false));

  // 当页面焦点不在其它按钮/输入框时，按住空格也能直接眯眼看主台
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    const tag = document.activeElement?.tagName;
    if (tag === "BUTTON" || tag === "INPUT" || tag === "A") return;
    const rect = wrap.getBoundingClientRect();
    if (rect.bottom > 80 && rect.top < window.innerHeight - 80) {
      e.preventDefault();
      setSquint(true);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" && state.squint) setSquint(false);
  });

  btnAlign.addEventListener("click", () => {
    const geom = state.geom || computeLayout(wrap.clientWidth || 800);
    // 在重排后的目标形态上由 model.js 实测出精确 optLeft / optRight
    const refLaid = layoutHeroColumn({
      paras: HERO_PARAS,
      cols: geom.cols,
      fontSize: geom.fontSize,
      leftHang: 1.0,
      rightHang: 1.0,
    });
    state.targetLeft = refLaid.optLeft;
    state.targetRight = refLaid.optRight;
    state.dirty = true;
    ctrl.draw();
  });

  btnReset.addEventListener("click", () => {
    state.targetLeft = 0;
    state.targetRight = 0;
    state.dirty = true;
    ctrl.draw();
  });

  const ro = new ResizeObserver(() => {
    state.dirty = true;
    ctrl.draw();
  });
  ro.observe(wrap);

  return {
    refresh() {
      state.dirty = true;
      ctrl.draw();
    },
  };
}

// =========================================================================
// 01 节：字形墨量显微解剖器
// =========================================================================
function initSection01() {
  const canvas = document.getElementById("anatomy-canvas");
  const chips = [...document.querySelectorAll(".glyph-chip")];
  const elAdv = document.getElementById("ana-adv");
  const elArea = document.getElementById("ana-area");
  const elMass = document.getElementById("ana-mass");
  const elCenter = document.getElementById("ana-center");
  const elNote = document.getElementById("anatomy-note");

  let activeChar = "“";
  let activeLatin = false;

  function render() {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const narrow = w < 450;
    const fz = clamp(Math.min(h * (narrow ? 0.46 : 0.54), w * (narrow ? 0.25 : 0.22)), 58, 102);
    const ana = analyzeGlyphAnatomy(activeChar, activeLatin, fz);
    const fontSpec = `${activeLatin ? 700 : 600} ${fz}px ${activeLatin ? FONT_LATIN : FONT_SERIF_SC}`;

    const cellLeft = Math.round(w * (narrow ? 0.21 : 0.23) - ana.advPx * 0.5);
    const baseY = Math.round(h * 0.65);
    const boxTop = baseY - fz * 0.88;
    const boxH = fz * 1.06;

    // 1) 字身全框（Bounding Box）
    ctx.save();
    ctx.strokeStyle = COLORS.rule;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(cellLeft, boxTop, ana.advPx, boxH);
    ctx.setLineDash([]);

    // 2) 实测墨盒（Ink Box）
    const ix = cellLeft + ana.inkLeftPx;
    const iy = baseY + ana.inkTopPx;
    ctx.fillStyle = activeChar === "山" ? "rgba(251, 247, 228, 0.14)" : COLORS.goldSoft;
    ctx.fillRect(ix, iy, ana.inkWidthPx, ana.inkHeightPx);
    ctx.strokeStyle = activeChar === "山" ? COLORS.cream : COLORS.gold;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(ix, iy, ana.inkWidthPx, ana.inkHeightPx);

    // 3) 绘制真实字形
    ctx.font = fontSpec;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = activeChar === "山" ? COLORS.ivory : COLORS.gold;
    ctx.fillText(activeChar, cellLeft, baseY);

    // 4) 水平墨重心标线
    const cx = cellLeft + ana.inkCenterRatio * ana.advPx;
    ctx.strokeStyle = COLORS.alert;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx, boxTop - 8);
    ctx.lineTo(cx, boxTop + boxH + 8);
    ctx.stroke();

    // 5) 底部字宽标尺
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 1;
    const dimY = boxTop + boxH + 16;
    ctx.beginPath();
    ctx.moveTo(cellLeft, dimY);
    ctx.lineTo(cellLeft + ana.advPx, dimY);
    ctx.stroke();
    ctx.font = `500 11.5px ${FONT_DISPLAY}`;
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "center";
    ctx.fillText(`实测字宽 ${ana.advEm.toFixed(2)} em`, cellLeft + ana.advPx / 2, dimY + 14);

    // 6) 右侧墨面积占比对比条：自动测量标签与百分比宽度，放不下时将百分比放到条形下方右对齐，绝不重叠
    const barX = Math.round(w * (narrow ? 0.45 : 0.48));
    const barW = Math.max(96, w - barX - (narrow ? 12 : 20));
    const drawBar = (y, fullLabel, shortLabel, ratio, color, pctText) => {
      ctx.font = `500 12px ${FONT_DISPLAY}`;
      const fullW = ctx.measureText(fullLabel).width;
      ctx.font = `700 12.5px ${FONT_LATIN}`;
      const pctW = ctx.measureText(pctText).width;
      const inlineFit = fullW + pctW + 14 <= barW;
      const label = inlineFit || fullW <= barW ? fullLabel : shortLabel;

      ctx.textAlign = "left";
      ctx.font = `500 12px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(label, barX, y);

      ctx.fillStyle = "rgba(159, 164, 162, 0.16)";
      ctx.fillRect(barX, y + 8, barW, 11);
      ctx.fillStyle = color;
      ctx.fillRect(barX, y + 8, barW * clamp(ratio / 0.55, 0.03, 1), 11);

      ctx.textAlign = "right";
      ctx.font = `700 12.5px ${FONT_LATIN}`;
      ctx.fillStyle = color;
      if (inlineFit) {
        ctx.fillText(pctText, barX + barW, y);
      } else {
        ctx.fillText(pctText, barX + barW, y + 34);
      }
    };
    drawBar(
      46,
      `当前字符「${activeChar}」占格墨面积`,
      `「${activeChar}」占格墨面积`,
      ana.inkAreaRatio,
      activeChar === "山" ? COLORS.ivory : COLORS.gold,
      `${(ana.inkAreaRatio * 100).toFixed(1)}%`
    );
    drawBar(
      126,
      activeLatin ? "参照直立字母「H」占格墨面积" : "参照汉字均值占格墨面积",
      activeLatin ? "参照字母「H」墨面积" : "参照汉字占格墨面积",
      ana.refInkAreaRatio,
      COLORS.cream,
      `${(ana.refInkAreaRatio * 100).toFixed(1)}%`
    );
    ctx.restore();

    // 更新数值与说明
    elAdv.textContent = `${ana.advEm.toFixed(2)} em`;
    elArea.textContent = `${(ana.inkAreaRatio * 100).toFixed(1)}%`;
    elMass.textContent = `${Math.round(ana.massRatio * 100)}%`;
    const posText = ana.inkCenterRatio < 0.38 ? "明显偏左" : ana.inkCenterRatio > 0.62 ? "明显偏右" : "居中平衡";
    elCenter.textContent = `${posText} (${Math.round(ana.inkCenterRatio * 100)}%)`;

    if (activeChar === "山") {
      elNote.textContent = "实心汉字「山」墨迹几乎撑满整个字身框、重心居中，它的外缘就是读者眼中的版心字墙基准，不需要凸排。";
    } else if (activeChar === "“" || activeChar === "「") {
      elNote.textContent = `在当前粗宋体里，「${activeChar}」的墨迹偏居右侧、墨重仅占普通汉字的 ${Math.round(ana.massRatio * 100)}%。若关在左虚线内，左半格大片空白会把首字顶退一整格，必须向左挂出约 100% 自身字宽。`;
    } else if (activeChar === "，" || activeChar === "。") {
      elNote.textContent = `简体「${activeChar}」墨迹偏坐格内左下角、右半格几乎全空，墨重仅为普通汉字的 ${Math.round(ana.massRatio * 100)}%。在齐行右壁将它微挂出界，既补齐右缘又免去禁则推字。`;
    } else {
      elNote.textContent = `Fraunces 连字符「-」实际步进字宽仅 ${ana.advEm.toFixed(2)} em（远非 1em），墨重约为直立字母 H 的 ${Math.round(ana.massRatio * 100)}%，挂出其自身字宽约 ${Math.round(ana.recHangRatio * 100)}% 就能把西文右墙绷直。`;
    }
  }

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-selected", String(on));
      });
      activeChar = chip.dataset.glyph;
      activeLatin = chip.dataset.latin === "1";
      render();
    });
  }

  new ResizeObserver(render).observe(canvas);
  return { refresh: render };
}

// =========================================================================
// 02 节：四类西文符号独立步进拨码台（Fraunces 真实像素实测微凸）
// =========================================================================
function initSection02() {
  const controlsEl = document.getElementById("west-controls");
  const canvas = document.getElementById("west-canvas");
  const readoutEl = document.getElementById("west-readout");
  const btnOptAll = document.getElementById("btn-west-optimal");

  const modes = { quote: "zero", stop: "zero", hyphen: "zero", angled: "zero" };
  let westModel = null;

  const WEST_LINES = [
    { text: "“Here, when light quotes hang,", leftType: "quote", rightType: "stop" },
    { text: "lines read straight and steady.", leftType: null, rightType: "stop" },
    { text: "When small marks reach just be-", leftType: "angled", rightType: "hyphen" },
    { text: "yond the frame, the wall holds.”", leftType: null, rightType: "quote" },
    { text: "All corners feel crisp.", leftType: "angled", rightType: null, isLast: true },
  ];

  function ratioFor(clsId, mode) {
    const info = westModel.classes[clsId];
    if (mode === "zero") return 0;
    if (mode === "opt") return info.optRatio;
    if (mode === "full") return 1.0;
    return 1.35;
  }

  function buildControls() {
    westModel = computeWesternClassMetrics(22);
    controlsEl.innerHTML = "";
    const order = ["quote", "stop", "hyphen", "angled"];
    for (const id of order) {
      const info = westModel.classes[id];
      const optPct = Math.round(info.optRatio * 100);
      const group = document.createElement("div");
      group.className = "dial-group";
      group.innerHTML = `
        <div class="dial-group-head">
          <strong>${info.label}</strong>
          <span class="dial-group-meta">实测字宽 ${info.advEm.toFixed(2)} em · 实测微凸 ${optPct}% (${info.optEm.toFixed(2)} em)</span>
        </div>
        <div class="dial-steps" role="group" aria-label="${info.label}凸排档位">
          <button type="button" class="dial-btn ${modes[id] === "zero" ? "is-active" : ""}" data-cls="${id}" data-mode="zero">0% 框内</button>
          <button type="button" class="dial-btn ${modes[id] === "opt" ? "is-active" : ""}" data-cls="${id}" data-mode="opt">实测 ${optPct}%</button>
          <button type="button" class="dial-btn ${modes[id] === "full" ? "is-active" : ""}" data-cls="${id}" data-mode="full">100% 全挂</button>
          <button type="button" class="dial-btn ${modes[id] === "over" ? "is-active" : ""}" data-cls="${id}" data-mode="over">135% 过头</button>
        </div>
      `;
      controlsEl.appendChild(group);
    }

    controlsEl.querySelectorAll(".dial-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cls = btn.dataset.cls;
        modes[cls] = btn.dataset.mode;
        controlsEl.querySelectorAll(`.dial-btn[data-cls="${cls}"]`).forEach((b) => {
          b.classList.toggle("is-active", b === btn);
        });
        render();
      });
    });
  }

  function render() {
    if (!westModel) buildControls();
    const rawW = Math.max(120, Math.round(canvas.getBoundingClientRect().width));
    const maxColW = clamp(Math.round(rawW * 0.80), 180, 520);

    // 按最宽一行放进 maxColW 实算字号，并按实测自然行宽收紧 colW，防止宽屏拉出词间河流、窄屏越界
    const probeCtx = canvas.getContext("2d");
    const refFz = 24;
    probeCtx.font = `700 ${refFz}px ${FONT_LATIN}`;
    const maxNatW = Math.max(...WEST_LINES.map((ln) => probeCtx.measureText(ln.text).width));
    const fz = clamp(Math.floor(((maxColW * 0.94) / Math.max(1, maxNatW)) * refFz * 2) / 2, 11, 25.5);
    const maxNatAtFz = (maxNatW / refFz) * fz;
    const colW = Math.min(maxColW, Math.round(maxNatAtFz * 1.07));

    const lineH = Math.round(fz * 1.72);
    const padY = 24;
    const idealH = Math.ceil(padY * 2 + (WEST_LINES.length - 1) * lineH + fz * 1.15);
    if (Math.abs(canvas.clientHeight - idealH) > 1) {
      canvas.style.height = `${idealH}px`;
    }

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const colL = Math.round((w - colW) / 2);
    const colR = colL + colW;
    const topY = Math.round(padY + fz * 0.88);

    // 双侧虚线边界
    ctx.save();
    ctx.strokeStyle = COLORS.rule;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(colL + 0.5, 14);
    ctx.lineTo(colL + 0.5, h - 14);
    ctx.moveTo(colR + 0.5, 14);
    ctx.lineTo(colR + 0.5, h - 14);
    ctx.stroke();
    ctx.restore();

    ctx.font = `700 ${fz}px ${FONT_LATIN}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const spaceW = ctx.measureText(" ").width;

    for (let i = 0; i < WEST_LINES.length; i++) {
      const ln = WEST_LINES[i];
      const y = topY + i * lineH;
      const chars = [...ln.text];
      const firstCh = chars[0];
      const lastCh = chars[chars.length - 1];

      const mFirst = measureGlyph(firstCh, FONT_LATIN, 700, fz);
      const mLast = measureGlyph(lastCh, FONT_LATIN, 700, fz);

      const lShift = ln.leftType ? ratioFor(ln.leftType, modes[ln.leftType]) * mFirst.advPx : 0;
      const rShift = ln.rightType ? ratioFor(ln.rightType, modes[ln.rightType]) * mLast.advPx : 0;

      const words = ln.text.split(" ");
      const wordWidths = words.map((wd) => ctx.measureText(wd).width);
      const sumW = wordWidths.reduce((s, v) => s + v, 0);
      // 末行左齐（自然词距，绝不强行拉出词间河流）；其余行两端齐行
      const span = colW + lShift + rShift;
      const gap = ln.isLast
        ? spaceW
        : words.length > 1
          ? Math.max(spaceW * 0.72, (span - sumW) / (words.length - 1))
          : 0;

      let cx = colL - lShift;
      for (let wi = 0; wi < words.length; wi++) {
        const wd = words[wi];
        const hasLeft = wi === 0 && ln.leftType;
        const hasRight = wi === words.length - 1 && ln.rightType;
        if (hasLeft && hasRight && wd.length >= 2) {
          const isOverL = modes[ln.leftType] === "over" || (ln.leftType === "angled" && modes.angled === "full");
          const isOverR = modes[ln.rightType] === "over";
          const mid = wd.slice(1, -1);
          const midW = ctx.measureText(mid).width;
          ctx.fillStyle = isOverL ? COLORS.alert : COLORS.gold;
          ctx.fillText(wd[0], cx, y);
          ctx.fillStyle = COLORS.ivory;
          ctx.fillText(mid, cx + mFirst.advPx, y);
          ctx.fillStyle = isOverR ? COLORS.alert : COLORS.gold;
          ctx.fillText(wd.slice(-1), cx + mFirst.advPx + midW, y);
        } else if (hasLeft) {
          const isOver = modes[ln.leftType] === "over" || (ln.leftType === "angled" && modes.angled === "full");
          ctx.fillStyle = isOver ? COLORS.alert : COLORS.gold;
          ctx.fillText(wd[0], cx, y);
          ctx.fillStyle = COLORS.ivory;
          ctx.fillText(wd.slice(1), cx + mFirst.advPx, y);
        } else if (hasRight) {
          const body = wd.slice(0, -1);
          const bodyW = ctx.measureText(body).width;
          ctx.fillStyle = COLORS.ivory;
          ctx.fillText(body, cx, y);
          const isOver = modes[ln.rightType] === "over";
          ctx.fillStyle = isOver ? COLORS.alert : COLORS.gold;
          ctx.fillText(wd.slice(-1), cx + bodyW, y);
        } else {
          ctx.fillStyle = COLORS.ivory;
          ctx.fillText(wd, cx, y);
        }
        cx += wordWidths[wi] + gap;
      }
    }

    // 说明文案
    const allOpt = Object.values(modes).every((m) => m === "opt");
    const angledTooMuch = modes.angled === "full" || modes.angled === "over";
    const anyOver = Object.values(modes).includes("over");
    if (allOpt) {
      readoutEl.textContent = `四类符号全部按 Fraunces 实测墨边微凸：引号挂 ${Math.round(westModel.classes.quote.optRatio * 100)}%、句逗 ${Math.round(westModel.classes.stop.optRatio * 100)}%、连字符 ${Math.round(westModel.classes.hyphen.optRatio * 100)}%、斜边字母仅微探 ${Math.round(westModel.classes.angled.optRatio * 100)}%（按分层边角虚空实测），左右两堵西文字墙齐得像刀切。`;
    } else if (angledTooMuch) {
      readoutEl.textContent = `把 W / A 等斜边大写字母挂到 ${modes.angled === "full" ? "100%" : "135%"} 就把整枚字母甩出了版心——这正是为什么光学边距对齐绝不能「所有字符一刀切」。`;
    } else if (anyOver) {
      readoutEl.textContent = "有字符被拨到了 135% 过头档：不仅标点脱离正文孤悬页边，相邻字母也被拽出虚线之外。";
    } else if (Object.values(modes).every((m) => m === "zero")) {
      readoutEl.textContent = "当前四类均锁在 0% 框内：左缘引号把首行顶退、W / A 边角略虚，右缘逗号、句号、连字符与闭引号处同样出现凹口。逐类拨向「实测」档或点上方一键对比。";
    } else {
      readoutEl.textContent = "已调通部分类别——注意对比已切到「实测」的行与仍留在 0% 的行，每一类的合适挂出量都取决于它自身的实测字宽与墨量。";
    }
  }

  btnOptAll.addEventListener("click", () => {
    modes.quote = "opt";
    modes.stop = "opt";
    modes.hyphen = "opt";
    modes.angled = "opt";
    buildControls();
    render();
  });

  new ResizeObserver(() => render()).observe(canvas);
  return {
    refresh() {
      buildControls();
      render();
    },
  };
}

// =========================================================================
// 03 节：五百年编年活字印章带（全部核实出处）
// =========================================================================
function initSection03() {
  const stamps = [...document.querySelectorAll(".era-stamp")];
  const canvas = document.getElementById("era-canvas");
  const elBadge = document.getElementById("era-badge");
  const elTitle = document.getElementById("era-title");
  const elDesc = document.getElementById("era-desc");
  const elCite = document.getElementById("era-cite");

  const ERAS = [
    {
      badge: "c. 1450–1455 · MAINZ",
      title: "古腾堡《四十二行圣经》的栏外连字符",
      desc: "在 Hàn Thế Thành（2000，TUGboat 第 21 卷第 4 期第 3.1 节）对美因茨《四十二行圣经》的微排版考据中，古腾堡为令双栏右缘在肉眼下显得笔直，将行尾的连字符、句号、逗号及部分窄末字微微置于栏线之外，并配合多种字宽变体保持词距均匀。",
      cite: "出处：Hàn Thế Thành, Micro-typographic extensions to the TeX typesetting system, TUGboat 21(4), 2000, §3.1（引 Martin Davies 1996 与 Adolf Wild 1995）。",
      draw(ctx, w, h) {
        // 双栏黑体圣经版面示意：右缘连字符微出虚线
        const colW = Math.min(180, w * 0.36);
        const gap = Math.min(34, w * 0.08);
        const startX = (w - colW * 2 - gap) / 2;
        for (let c = 0; c < 2; c++) {
          const x0 = startX + c * (colW + gap);
          const x1 = x0 + colW;
          ctx.strokeStyle = COLORS.rule;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x0, 28); ctx.lineTo(x0, h - 28);
          ctx.moveTo(x1, 28); ctx.lineTo(x1, h - 28);
          ctx.stroke();
          ctx.setLineDash([]);
          for (let r = 0; r < 6; r++) {
            const y = 48 + r * 28;
            ctx.fillStyle = COLORS.cream;
            ctx.fillRect(x0 + 2, y, colW - 4, 11);
            if ((c === 0 && (r === 1 || r === 4)) || (c === 1 && (r === 0 || r === 3))) {
              ctx.fillStyle = COLORS.gold;
              ctx.fillRect(x1 + 3, y + 4, 10, 3);
            }
          }
        }
        ctx.fillStyle = COLORS.gold;
        ctx.font = `700 12px ${FONT_DISPLAY}`;
        ctx.textAlign = "center";
        ctx.fillText("行尾连字符与轻标点微置栏线外，换取整页均匀灰度", w / 2, h - 10);
      },
    },
    {
      badge: "1992 · HARTLEY & MARKS",
      title: "Bringhurst《排版风格要素》写进经典手册",
      desc: "加拿大诗人兼排版学者 Robert Bringhurst 在 1992 年首版《The Elements of Typographic Style》中，于第四章 §4.1.5 讨论段首引号的页边视觉对齐，并在第五章论及将行尾连字符挂入右页边以消除锯齿感——成为当代书籍设计师反复引用的案头法则。",
      cite: "出处：Robert Bringhurst, The Elements of Typographic Style (Hartley & Marks, 1992 首版), Chapter 4 §4.1.5 & Chapter 5。",
      draw(ctx, w, h) {
        const bx = w * 0.24, bw = w * 0.52;
        ctx.strokeStyle = COLORS.rule;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(bx, 28); ctx.lineTo(bx, h - 32);
        ctx.moveTo(bx + bw, 28); ctx.lineTo(bx + bw, h - 32);
        ctx.stroke();
        ctx.setLineDash([]);
        const bfz = clamp(Math.floor(bw / 9.2), 15, 22);
        ctx.font = `700 ${Math.round(bfz * 2.25)}px ${FONT_LATIN}`;
        ctx.fillStyle = COLORS.gold;
        ctx.textAlign = "right";
        ctx.fillText("“", bx - 4, 88);
        ctx.font = `400 ${bfz}px ${FONT_LATIN}`;
        ctx.fillStyle = COLORS.ivory;
        ctx.textAlign = "left";
        ctx.fillText("Optical alignment", bx + 2, 74);
        ctx.fillText("lets the text block", bx + 2, 110);
        ctx.fillText("stand straight —", bx + 2, 146);
        ctx.fillText("quiet and crisp.", bx + 2, 182);
        ctx.fillStyle = COLORS.gold;
        ctx.font = `700 12px ${FONT_DISPLAY}`;
        ctx.textAlign = "center";
        ctx.fillText("§4.1.5 段首引号挂出 · Ch.5 行尾连字符入页边", w / 2, h - 10);
      },
    },
    {
      badge: "1993 · ELECTRONIC PUBLISHING 6(3)",
      title: "Hermann Zapf 发表 hz-program 微排版论文",
      desc: "字体大师 Hermann Zapf 于 1993 年 9 月在《Electronic Publishing》第 6 卷第 3 期（283–288 页）发表《About micro-typography and the hz-program》，系统介绍他与 Peter Karow（URW）合作开发的数字微排版体系：把光学边距凸排、字偶微调与字形微缩放写进整段算法。",
      cite: "出处：Hermann Zapf, About micro-typography and the hz-program, Electronic Publishing 6(3), Sep. 1993, pp. 283–288。",
      draw(ctx, w, h) {
        const x0 = w * 0.16, bw = w * 0.68;
        ctx.strokeStyle = COLORS.rule;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x0, 32); ctx.lineTo(x0, h - 42);
        ctx.moveTo(x0 + bw, 32); ctx.lineTo(x0 + bw, h - 42);
        ctx.stroke();
        ctx.setLineDash([]);
        const labels = ["字形微缩 −2%", "标准字宽 100%", "光学凸排 +protrusion", "字形微展 +2%"];
        labels.forEach((lb, i) => {
          const y = 52 + i * 38;
          ctx.fillStyle = i === 2 ? COLORS.goldSoft : "rgba(242, 230, 202, 0.12)";
          ctx.fillRect(x0 + 2, y, bw - 4, 24);
          if (i === 2) {
            ctx.fillStyle = COLORS.gold;
            ctx.fillRect(x0 - 12, y + 4, 10, 16);
            ctx.fillRect(x0 + bw + 2, y + 8, 12, 8);
          }
          ctx.fillStyle = i === 2 ? COLORS.gold : COLORS.cream;
          ctx.font = `700 12.5px ${FONT_DISPLAY}`;
          ctx.textAlign = "left";
          ctx.fillText(lb, x0 + 12, y + 16);
        });
        ctx.fillStyle = COLORS.muted;
        ctx.font = `500 12px ${FONT_DISPLAY}`;
        ctx.textAlign = "center";
        ctx.fillText("段落级联合优化：边缘光学补偿 + 极微幅字宽伸缩", w / 2, h - 12);
      },
    },
    {
      badge: "1999 · DESKTOP PUBLISHING",
      title: "Adobe InDesign 1.0 内置「光学边距对齐」",
      desc: "1999 年发布的 Adobe InDesign 1.0 吸收了 hz-program 的多项算法思想，在「故事（Story）」面板提供「光学边距对齐（Optical Margin Alignment）」选项，让杂志与书籍设计师按基准字号即可自动对标点、连字符及斜边字母启用微凸。",
      cite: "出处：Adobe InDesign 官方文档（Apply and manage text formatting · Optical Margin Alignment）。",
      draw(ctx, w, h) {
        const px = w * 0.14, py = 30, pw = w * 0.72, ph = h - 72;
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(px, py, pw, ph);
        ctx.fillStyle = "rgba(244, 195, 22, 0.12)";
        ctx.fillRect(px, py, pw, 30);
        ctx.fillStyle = COLORS.gold;
        ctx.font = `700 12px ${FONT_LATIN}`;
        ctx.textAlign = "left";
        ctx.fillText("STORY PANEL · OPTICAL MARGIN ALIGNMENT", px + 12, py + 20);
        // 勾选框
        ctx.fillStyle = COLORS.gold;
        ctx.fillRect(px + 18, py + 48, 16, 16);
        ctx.strokeStyle = COLORS.bg;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 21, py + 56); ctx.lineTo(px + 25, py + 60); ctx.lineTo(px + 31, py + 51);
        ctx.stroke();
        ctx.fillStyle = COLORS.ivory;
        ctx.font = `700 14px ${FONT_DISPLAY}`;
        ctx.fillText("光学边距对齐（按正文字号自动换算）", px + 44, py + 61);
        ctx.fillStyle = COLORS.muted;
        ctx.font = `500 12.5px ${FONT_DISPLAY}`;
        ctx.fillText("作用对象：标点符号 + 连字符 + A / V / W / T 边缘", px + 18, py + 96);
        ctx.fillStyle = COLORS.gold;
        ctx.font = `700 13px ${FONT_LATIN}`;
        ctx.fillText("Base Size: 12 pt   |   Protrusion: Auto", px + 18, py + 128);
        ctx.fillStyle = COLORS.muted;
        ctx.font = `500 12px ${FONT_DISPLAY}`;
        ctx.textAlign = "center";
        ctx.fillText("无需手工调负缩进，整篇故事栏自动获得光学直边", w / 2, h - 12);
      },
    },
    {
      badge: "2000 → TODAY · PDFTEX & W3C",
      title: "Hàn Thế Thành 开源 pdfTeX 与 W3C 网页规范",
      desc: "2000 年，Hàn Thế Thành 在马萨里克大学博士论文（刊于 TUGboat 21(4)）中把字符突出（character protrusion）带入开源 pdfTeX，催生学术排版标配 LaTeX microtype；随后 W3C 在 CSS Text Module Level 3、CLREQ 与 JLREQ 中分别落成网页与东亚排版标准。",
      cite: "出处：Hàn Thế Thành (2000) TUGboat 21(4)；W3C CSS Text Module Level 3；W3C CLREQ §6.1.3 & JLREQ §3.8.2。",
      draw(ctx, w, h) {
        const items = [
          { tag: "pdfTeX 2000", line: "\\rpcode\\font`,=500  \\lpcode\\font`\"=700" },
          { tag: "W3C CSS Text 3", line: "hanging-punctuation: first allow-end;" },
          { tag: "CLREQ / JLREQ", line: "行尾单点号悬挂 · 连续标点不挂" },
        ];
        items.forEach((it, idx) => {
          const y = 34 + idx * 62;
          ctx.strokeStyle = COLORS.rule;
          ctx.strokeRect(22, y, w - 44, 48);
          ctx.fillStyle = COLORS.gold;
          ctx.font = `700 11.5px ${FONT_LATIN}`;
          ctx.textAlign = "left";
          ctx.fillText(it.tag, 34, y + 18);
          ctx.fillStyle = COLORS.ivory;
          ctx.font = idx === 2 ? `500 13px ${FONT_DISPLAY}` : `400 13px ${FONT_LATIN}`;
          ctx.fillText(it.line, 34, y + 38);
        });
        ctx.fillStyle = COLORS.muted;
        ctx.font = `500 12px ${FONT_DISPLAY}`;
        ctx.textAlign = "center";
        ctx.fillText("从开源学术引擎走向跨语种网页排版规范", w / 2, h - 10);
      },
    },
  ];

  let activeIdx = 0;

  function render() {
    const era = ERAS[activeIdx];
    elBadge.textContent = era.badge;
    elTitle.textContent = era.title;
    elDesc.textContent = era.desc;
    elCite.textContent = era.cite;

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    era.draw(ctx, w, h);
  }

  stamps.forEach((st, idx) => {
    st.addEventListener("click", () => {
      activeIdx = idx;
      stamps.forEach((s, i) => {
        s.classList.toggle("is-active", i === idx);
        s.setAttribute("aria-selected", String(i === idx));
      });
      render();
    });
  });

  new ResizeObserver(render).observe(canvas);
  return { refresh: render };
}

// =========================================================================
// 04 节：中英日报刊栏同字号双栏对照台（并排/上下对照，真实禁则行排）
// =========================================================================
function initSection04() {
  const tabs = [...document.querySelectorAll(".locale-tab")];
  const canvas = document.getElementById("compare-canvas");
  const btnGuides = document.getElementById("btn-compare-guides");
  const caption = document.getElementById("compare-caption");

  let locale = "zh-cn";
  let showGuides = true;

  // 真实东亚避头禁则行排器：同一句话分别按「严守版心」与「行尾单挂」排成自然行
  function breakCjkText(text, cols, allowHangRight) {
    const chars = [...text];
    const lines = [];
    let i = 0;
    while (i < chars.length) {
      const cur = [];
      while (i < chars.length && cur.length < cols) {
        cur.push(chars[i++]);
      }
      let pushed = false;
      let hangR = false;
      if (i < chars.length && NO_START.has(chars[i])) {
        const next = chars[i];
        const nextNext = chars[i + 1];
        const prevIsPunct = NO_START.has(cur[cur.length - 1]);
        const nextIsPaired = Boolean(nextNext && NO_START.has(nextNext));
        if (allowHangRight && HANG_RIGHT.has(next) && !prevIsPunct && !nextIsPaired) {
          cur.push(chars[i++]);
          hangR = true;
        } else {
          while (cur.length > 2 && NO_START.has(cur[cur.length - 1])) {
            i--;
            cur.pop();
          }
          if (cur.length > 2) {
            i--;
            cur.pop();
            pushed = true;
          }
        }
      } else if (cur.length > 1 && NO_END.has(cur[cur.length - 1])) {
        i--;
        cur.pop();
        pushed = true;
      }
      const isLast = i >= chars.length;
      const lastCh = cur[cur.length - 1];
      const prevLast = cur[cur.length - 2];
      if (!hangR && allowHangRight && HANG_RIGHT.has(lastCh) && !NO_START.has(prevLast) && (!isLast || cur.length >= cols)) {
        hangR = true;
      }
      lines.push({
        text: cur.join(""),
        chars: cur,
        pushed,
        hangR,
        short: isLast && (hangR ? cur.length - 1 : cur.length) < cols,
      });
    }
    return lines;
  }

  const ZH_CN_TEXT = "书页密排讲究灰度均匀，行尾遇单个句逗若硬推，可见“微挂一点，整段便齐整。”";
  const JA_TEXT = "日本語の書籍組版では、行頭禁則を避けるため、句読点を行末外へ出し字間を守る。";

  const LOCALES = {
    "zh-cn": {
      leftTitle: "严守版心（避头推字）",
      rightTitle: "行尾单挂（CLREQ §6.1.3）",
      caption: "简体中文密排报栏：同一句话以相同字号与栏宽排布，左侧严守版心在第 1、3 行被迫推字拉散，右侧挂出单个逗号后字距均匀平顺，末行连续双标点「。”」依 CLREQ 仍守在版心之内。",
      cols: 10,
      font: FONT_SERIF_SC,
      leftLines: breakCjkText(ZH_CN_TEXT, 10, false),
      rightLines: breakCjkText(ZH_CN_TEXT, 10, true),
    },
    "zh-tw": {
      leftTitle: "港台横排守框（CLREQ 推荐）",
      rightTitle: "横排硬挂居中点号（突兀）",
      caption: "港台繁体横排（CLREQ §6.1.3 原文）：同一句话中，港台点号位于全角字面正中；左侧留在框内端正平稳，右侧横排强行挂出反而拖出半格空缝且拉散行内字距，故横排不做悬挂、直排方可使用。",
      cols: 10,
      font: FONT_SERIF_SC,
      leftLines: [
        { text: "「港臺繁體點號居中，", chars: [..."「港臺繁體點號居中，"], centeredPunct: true },
        { text: "橫排時留在版心框內，", chars: [..."橫排時留在版心框內，"], centeredPunct: true },
        { text: "全段字面端正而平穩，", chars: [..."全段字面端正而平穩，"], centeredPunct: true },
        { text: "直排時方宜懸掛。」", chars: [..."直排時方宜懸掛。」"], centeredPunct: true, short: true },
      ],
      rightLines: [
        { text: "「港臺繁體點號居中，", chars: [..."「港臺繁體點號居中，"], centeredPunct: true, hangL: true, hangR: true, warn: true },
        { text: "橫排時留在版心框內，", chars: [..."橫排時留在版心框內，"], centeredPunct: true, hangR: true, warn: true },
        { text: "全段字面端正而平穩，", chars: [..."全段字面端正而平穩，"], centeredPunct: true, hangR: true, warn: true },
        { text: "直排時方宜懸掛。」", chars: [..."直排時方宜懸掛。」"], centeredPunct: true, short: true },
      ],
    },
    ja: {
      leftTitle: "追い出し（行頭禁則推字）",
      rightTitle: "ぶら下げ組（JLREQ §3.8.2）",
      caption: "日文书籍排印（JLREQ §2.5.1 / §3.8.2）：同一段日文在左侧严守版心时第 1 行发生「追い出し」字距拉散，右侧将原本折入下行首的读点「、」挂于版面外缘后，通栏字距立刻稳住。",
      cols: 10,
      font: FONT_SERIF_SC,
      leftLines: breakCjkText(JA_TEXT, 10, false),
      rightLines: breakCjkText(JA_TEXT, 10, true),
    },
    en: {
      leftTitle: "Flush Box (Rigid Edge)",
      rightTitle: "Optical Margin Protrusion",
      caption: "英文齐行专栏：同字号同栏宽对照，左侧连字符与逗号锁在栏线内侧令右壁频现凹口，右侧微微挂出后右墙密实笔直；末行保持自然左齐不拉出词间河流。",
      cols: 10,
      font: FONT_LATIN,
      isLatin: true,
      leftLines: [
        { text: "“Optical margin align-" },
        { text: "ment moves light marks," },
        { text: "such as hyphens and quo-" },
        { text: "tations, cleanly out.”", short: true },
      ],
      rightLines: [
        { text: "“Optical margin align-", hangL: true, hangR: true },
        { text: "ment moves light marks,", hangR: true },
        { text: "such as hyphens and quo-", hangR: true },
        { text: "tations, cleanly out.”", short: true },
      ],
    },
  };

  function drawPanel(ctx, x0, y0, pw, ph, lines, cfg, isRight, fz, colW) {
    ctx.fillStyle = isRight ? COLORS.bgSlate : COLORS.bg;
    ctx.fillRect(x0, y0, pw, ph);

    const colL = Math.round(x0 + (pw - colW) / 2);
    const colR = colL + colW;
    const isLatin = Boolean(cfg.isLatin);
    const lineH = Math.round(fz * (isLatin ? 1.72 : 1.56));
    const headerY = y0 + 24;
    const pushedCount = lines.filter((l) => l.pushed).length;
    const warnRight = lines.some((l) => l.warn);

    // 栏眉标签
    ctx.textBaseline = "middle";
    ctx.font = `700 12.5px ${FONT_DISPLAY}`;
    ctx.textAlign = "left";
    ctx.fillStyle = isRight ? (warnRight ? COLORS.alert : COLORS.gold) : COLORS.muted;
    ctx.fillText(isRight ? cfg.rightTitle : cfg.leftTitle, x0 + 16, headerY);

    if (showGuides && pushedCount > 0) {
      ctx.textAlign = "right";
      ctx.font = `700 11.5px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLORS.alert;
      ctx.fillText(locale === "ja" ? `追い出し ${pushedCount} 行` : `推字拉散 ${pushedCount} 行`, x0 + pw - 16, headerY);
    }

    const startY = Math.round(y0 + 50 + fz * 0.88);
    const guideTop = y0 + 44;
    const guideBot = y0 + ph - 14;

    // 版心虚线边界
    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = COLORS.rule;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(colL + 0.5, guideTop); ctx.lineTo(colL + 0.5, guideBot);
      ctx.moveTo(colR + 0.5, guideTop); ctx.lineTo(colR + 0.5, guideBot);
      ctx.stroke();
      ctx.restore();
    }

    ctx.font = `${isLatin ? 700 : 600} ${fz}px ${cfg.font}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    lines.forEach((ln, idx) => {
      const y = startY + idx * lineH;
      if (isLatin) {
        const words = ln.text.split(" ");
        const firstW = ctx.measureText(ln.text[0]).width;
        const lastW = ctx.measureText(ln.text.slice(-1)).width;
        const spaceW = ctx.measureText(" ").width;
        const lOff = ln.hangL ? firstW * 0.94 : 0;
        const rOff = ln.hangR ? lastW * 0.86 : 0;
        const span = colW + lOff + rOff;
        const sum = words.reduce((s, wd) => s + ctx.measureText(wd).width, 0);
        const gap = !ln.short && words.length > 1 ? Math.max(spaceW * 0.72, (span - sum) / (words.length - 1)) : spaceW;
        let x = colL - lOff;
        words.forEach((wd, wi) => {
          if (wi === 0 && ln.hangL) {
            ctx.fillStyle = showGuides ? COLORS.gold : COLORS.ivory;
            ctx.fillText(wd[0], x, y);
            ctx.fillStyle = COLORS.ivory;
            ctx.fillText(wd.slice(1), x + firstW, y);
          } else if (wi === words.length - 1 && ln.hangR) {
            const head = wd.slice(0, -1);
            const hw = ctx.measureText(head).width;
            ctx.fillStyle = COLORS.ivory;
            ctx.fillText(head, x, y);
            ctx.fillStyle = showGuides ? COLORS.gold : COLORS.ivory;
            ctx.fillText(wd.slice(-1), x + hw, y);
          } else {
            ctx.fillStyle = COLORS.ivory;
            ctx.fillText(wd, x, y);
          }
          x += ctx.measureText(wd).width + gap;
        });
        return;
      }

      const chars = ln.chars;
      const adv = fz;
      const firstSolid = ln.hangL ? 1 : 0;
      const lastSolid = ln.hangR ? chars.length - 2 : chars.length - 1;
      const interiorCount = lastSolid - firstSolid + 1;
      const gap = !ln.short && interiorCount > 1 ? (colW - interiorCount * adv) / (interiorCount - 1) : 0;

      // 若本行因禁则推字拉散，在字缝下方绘珊瑚色刻度直观呈现字距失衡
      if (showGuides && (ln.pushed || (ln.warn && gap > 1.5))) {
        ctx.save();
        ctx.strokeStyle = "rgba(230, 110, 60, 0.78)";
        ctx.lineWidth = 1.4;
        const tickY = y + fz * 0.22;
        let gx = colL;
        for (let ci = firstSolid; ci < lastSolid; ci++) {
          if (gap > 1.2) {
            ctx.beginPath();
            ctx.moveTo(gx + adv, tickY);
            ctx.lineTo(gx + adv + gap, tickY);
            ctx.stroke();
          }
          gx += adv + gap;
        }
        ctx.restore();
      }

      if (ln.hangL) {
        ctx.fillStyle = showGuides ? (ln.warn ? COLORS.alert : COLORS.gold) : COLORS.ivory;
        ctx.fillText(chars[0], colL - adv, y);
      }
      let x = colL;
      for (let ci = firstSolid; ci <= lastSolid; ci++) {
        const ch = chars[ci];
        ctx.fillStyle = COLORS.ivory;
        const twOffset = ln.centeredPunct && (ch === "，" || ch === "。") ? adv * 0.22 : 0;
        ctx.fillText(ch, x + twOffset, y);
        x += adv + (ci < lastSolid ? gap : 0);
      }
      if (ln.hangR) {
        const ch = chars[chars.length - 1];
        ctx.fillStyle = showGuides ? (ln.warn ? COLORS.alert : COLORS.gold) : COLORS.ivory;
        const twOffset = ln.centeredPunct && (ch === "，" || ch === "。") ? adv * 0.22 : 0;
        ctx.fillText(ch, colR + twOffset, y);
      }
    });
  }

  function render() {
    const cfg = LOCALES[locale];
    const rawW = Math.max(200, Math.round(canvas.getBoundingClientRect().width));
    const stacked = rawW < 640;
    caption.textContent = stacked
      ? cfg.caption.replaceAll("左侧", "上方").replaceAll("右侧", "下方")
      : cfg.caption;
    const panelW = stacked ? rawW : Math.floor(rawW / 2);
    const isLatin = Boolean(cfg.isLatin);

    // 同字号大栏：桌面/平板每栏占舞台宽约 36–39%，手机上下两块同字号占约 76%
    let fz;
    let colW;
    if (isLatin) {
      colW = Math.round(panelW * (stacked ? 0.78 : 0.76));
      const probeCtx = canvas.getContext("2d");
      const refFz = 24;
      probeCtx.font = `700 ${refFz}px ${FONT_LATIN}`;
      const maxNat = Math.max(...cfg.leftLines.map((l) => probeCtx.measureText(l.text).width));
      fz = clamp(Math.floor(((colW * 0.96) / Math.max(1, maxNat)) * refFz * 2) / 2, 13, 27);
    } else {
      const targetW = panelW * (stacked ? 0.76 : 0.75);
      fz = clamp(Math.floor((targetW / cfg.cols) * 2) / 2, 18, 46);
      colW = Math.round(cfg.cols * fz);
    }

    const maxLines = Math.max(cfg.leftLines.length, cfg.rightLines.length);
    const lineH = Math.round(fz * (isLatin ? 1.72 : 1.56));
    const blockH = Math.ceil(50 + (maxLines - 1) * lineH + fz * 1.25 + 22);
    const idealH = stacked ? blockH * 2 + 2 : blockH;
    if (Math.abs(canvas.clientHeight - idealH) > 1) {
      canvas.style.height = `${idealH}px`;
    }

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    if (stacked) {
      drawPanel(ctx, 0, 0, w, blockH, cfg.leftLines, cfg, false, fz, colW);
      drawPanel(ctx, 0, blockH + 2, w, blockH, cfg.rightLines, cfg, true, fz, colW);
      ctx.fillStyle = "rgba(244, 195, 22, 0.45)";
      ctx.fillRect(0, blockH, w, 2);
    } else {
      const half = Math.floor(w / 2);
      drawPanel(ctx, 0, 0, half, h, cfg.leftLines, cfg, false, fz, colW);
      drawPanel(ctx, half, 0, w - half, h, cfg.rightLines, cfg, true, fz, colW);
      ctx.fillStyle = "rgba(244, 195, 22, 0.42)";
      ctx.fillRect(half - 0.5, 0, 1, h);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      locale = tab.dataset.locale;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      render();
    });
  });

  btnGuides.addEventListener("click", () => {
    showGuides = !showGuides;
    btnGuides.setAttribute("aria-pressed", String(showGuides));
    btnGuides.textContent = showGuides ? "隐藏边界批注" : "显示边界批注";
    render();
  });

  new ResizeObserver(render).observe(canvas);
  return { refresh: render };
}

// =========================================================================
// 05 节：CSS 关键字勾选器 + 浏览器内核与溢出裁切模拟器
// =========================================================================
function initSection05() {
  const checks = [...document.querySelectorAll('.kw-check input[type="checkbox"]')];
  const engBtns = [...document.querySelectorAll(".eng-btn")];
  const clipCheck = document.getElementById("css-clip-check");
  const codeEl = document.getElementById("css-code");
  const canvas = document.getElementById("css-canvas");
  const diagEl = document.getElementById("css-diag");

  let engine = "safari"; // safari | chromium | fallback

  function selectedKeywords() {
    return checks.filter((c) => c.checked).map((c) => c.value);
  }

  function render() {
    const kws = selectedKeywords();
    const valStr = kws.length ? kws.join(" ") : "none";
    const clip = clipCheck.checked;

    if (engine === "fallback") {
      codeEl.textContent =
`blockquote {
  padding-inline: ${clip ? "0 /* 风险：无外白 */" : "1.1em /* 为凸排留出外白 */"};
  text-indent: ${kws.includes("first") ? "-1em" : "0"};${clip ? "\n  overflow: hidden;" : ""}
}
@supports (hanging-punctuation: first) {
  blockquote { text-indent: 0; hanging-punctuation: ${valStr}; }
}`;
    } else {
      codeEl.textContent =
`blockquote {
  hanging-punctuation: ${valStr};
  padding-inline: ${clip ? "0" : "1.1em"};${clip ? "\n  overflow: hidden;" : ""}
}`;
    }

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const fz = clamp(Math.floor(w / 17.5), 15, 22);
    const colSpan = Math.round(10 * fz);
    const padX = clip ? 0 : Math.round(fz * 1.45);
    const boxW = colSpan + padX * 2;
    const boxL = Math.round((w - boxW) / 2);
    const colL = boxL + padX;
    const colR = colL + colSpan;

    // 顶标
    const engLabel =
      engine === "safari"
        ? "SAFARI 17.4+ · 原生完整支持"
        : engine === "chromium"
          ? "CHROME / EDGE / FIREFOX · 原生未支持"
          : "跨端负 text-indent 兜底";
    ctx.font = `700 11.5px ${FONT_DISPLAY}`;
    ctx.fillStyle = engine === "chromium" ? COLORS.alert : COLORS.gold;
    ctx.textAlign = "left";
    ctx.fillText(engLabel, 14, 24);

    // 模拟容器边界框
    ctx.strokeStyle = clip ? COLORS.alert : COLORS.rule;
    ctx.lineWidth = clip ? 1.8 : 1.1;
    ctx.strokeRect(boxL, 38, boxW, h - 56);

    // 内部文本版心虚线（无裁切时可见外白）
    if (!clip) {
      ctx.strokeStyle = "rgba(159, 164, 162, 0.45)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(colL, 42); ctx.lineTo(colL, h - 22);
      ctx.moveTo(colR, 42); ctx.lineTo(colR, h - 22);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const activeFirst = kws.includes("first") && engine !== "chromium";
    const activeEnd = (kws.includes("allow-end") || kws.includes("force-end")) && engine === "safari";
    const activeLast = kws.includes("last") && engine === "safari";

    const lines = [
      { text: "“凡网页正文欲行凸排，", hangL: activeFirst, hangR: activeEnd },
      { text: "先查内核再留容器外白，", hangR: activeEnd },
      { text: "免遭隐藏边界一刀切碎。”", hangLast: activeLast, short: true },
    ];

    ctx.save();
    if (clip) {
      ctx.beginPath();
      ctx.rect(boxL, 38, boxW, h - 56);
      ctx.clip();
    }
    ctx.font = `600 ${fz}px ${FONT_SERIF_SC}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const lineH = fz * 1.85;
    const baseY = 92;

    lines.forEach((ln, idx) => {
      const y = baseY + idx * lineH;
      const chars = [...ln.text];
      const firstSolid = ln.hangL ? 1 : 0;
      const lastSolid = ln.hangR || ln.hangLast ? chars.length - 2 : chars.length - 1;
      const count = lastSolid - firstSolid + 1;
      const gap = !ln.short && count > 1 ? (colSpan - count * fz) / (count - 1) : 0;

      if (ln.hangL) {
        ctx.fillStyle = COLORS.gold;
        ctx.fillText(chars[0], colL - fz, y);
      }
      let x = colL;
      for (let ci = firstSolid; ci <= lastSolid; ci++) {
        ctx.fillStyle = COLORS.ivory;
        ctx.fillText(chars[ci], x, y);
        x += fz + (ci < lastSolid ? gap : 0);
      }
      if (ln.hangR || ln.hangLast) {
        ctx.fillStyle = COLORS.gold;
        ctx.fillText(chars[chars.length - 1], ln.short ? x : colR, y);
      }
    });
    ctx.restore();

    if (clip && activeFirst) {
      ctx.fillStyle = COLORS.alert;
      ctx.font = `700 12px ${FONT_DISPLAY}`;
      ctx.textAlign = "right";
      ctx.fillText("⚠ 左引号已被 overflow: hidden 切掉！", boxL + boxW, h - 26);
    }

    if (engine === "chromium") {
      diagEl.textContent = "在当前版本的 Chrome、Edge 与 Firefox 中，原生 hanging-punctuation 声明会被直接忽略，标点依然锁在框内；跨端项目请改用「负缩进跨端兜底」。";
    } else if (clip && activeFirst) {
      diagEl.textContent = "翻车警告：容器未留水平外白又开了 overflow: hidden，挂出左边界的引号会被容器边框生生截断，必须配合 padding-inline 预留至少 1em 安全区。";
    } else if (engine === "fallback") {
      diagEl.textContent = "负 text-indent 兜底可覆盖全部主流浏览器处理段首开引号，再叠加 @supports 为 Safari 17.4+ 渐进增强行尾挂出，兼顾稳健与优雅。";
    } else {
      diagEl.textContent = `Safari 17.4+ 已原生解析 hanging-punctuation: ${valStr}；容器预留了外白，标点完整悬于版心虚线之外。`;
    }
  }

  checks.forEach((chk) => {
    chk.addEventListener("change", () => {
      // allow-end 与 force-end 规范互斥
      if (chk.checked && chk.value === "allow-end") {
        checks.find((c) => c.value === "force-end").checked = false;
      } else if (chk.checked && chk.value === "force-end") {
        checks.find((c) => c.value === "allow-end").checked = false;
      }
      render();
    });
  });

  engBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      engine = btn.dataset.engine;
      engBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  clipCheck.addEventListener("change", render);
  new ResizeObserver(render).observe(canvas);
  return { refresh: render };
}

// =========================================================================
// 06 节：四张微界面排雷开关卡
// =========================================================================
function initSection06() {
  const cards = [...document.querySelectorAll(".mine-card")];

  function drawCard(card) {
    const kind = card.dataset.case;
    const on = card.dataset.on === "1";
    const canvas = card.querySelector(".mine-canvas");
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    if (kind === "pullquote") {
      const colL = Math.round(w * 0.22);
      ctx.strokeStyle = COLORS.rule;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(colL, 18); ctx.lineTo(colL, h - 18); ctx.stroke();
      ctx.setLineDash([]);
      const fz = clamp(Math.floor(w / 18), 16, 21);
      ctx.font = `600 ${fz}px ${FONT_SERIF_SC}`;
      ctx.fillStyle = COLORS.gold;
      const qx = on ? colL - fz * 0.96 : colL;
      ctx.fillText("“", qx, 56);
      ctx.fillStyle = COLORS.ivory;
      ctx.fillText("好的版面先修直字墙，", on ? colL : colL + fz, 56);
      ctx.fillText("再把轻小标点微微请出界外。", colL, 92);
      ctx.fillText("读者未察其工，先觉其雅。”", colL, 128);
    } else if (kind === "narrowcard") {
      const pad = 16;
      const cardX = pad, cardW = w - pad * 2;
      ctx.strokeStyle = on ? COLORS.alert : COLORS.rule;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cardX, 20, cardW, h - 40);
      ctx.save();
      ctx.beginPath();
      ctx.rect(cardX, 20, cardW, h - 40);
      ctx.clip();
      const fz = 18;
      ctx.font = `600 ${fz}px ${FONT_SERIF_SC}`;
      ctx.fillStyle = on ? COLORS.alert : COLORS.gold;
      ctx.fillText("“", on ? cardX - fz * 0.52 : cardX + 6, 62);
      ctx.fillStyle = COLORS.ivory;
      ctx.fillText("零边距手机通知卡片上，", on ? cardX + 4 : cardX + 24, 62);
      ctx.fillText("硬挂引号会被边框直接切断。", cardX + 6, 98);
      ctx.restore();
      ctx.fillStyle = on ? COLORS.alert : COLORS.gold;
      ctx.font = `700 11.5px ${FONT_DISPLAY}`;
      ctx.fillText(on ? "⚠ 左侧引号被卡边裁去一半" : "✓ 关掉凸排：标点完整可读", cardX + 8, h - 28);
    } else if (kind === "ledger") {
      const colX = Math.round(w * 0.56);
      ctx.strokeStyle = COLORS.rule;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(colX, 18); ctx.lineTo(colX, h - 22); ctx.stroke();
      ctx.setLineDash([]);
      const rows = [
        { k: "上月结余", sign: "", num: "12,480.00" },
        { k: "纸张采购", sign: "−", num: "3,620.00" },
        { k: "版税预付", sign: "−", num: "1,850.00" },
      ];
      rows.forEach((r, i) => {
        const y = 50 + i * 36;
        ctx.font = `500 13.5px ${FONT_DISPLAY}`;
        ctx.fillStyle = COLORS.muted;
        ctx.textAlign = "left";
        ctx.fillText(r.k, 22, y);
        ctx.font = `700 16px ${FONT_LATIN}`;
        if (r.sign) {
          ctx.fillStyle = on ? COLORS.alert : COLORS.gold;
          ctx.fillText(r.sign, on ? colX - 16 : colX + 4, y);
        }
        ctx.fillStyle = COLORS.ivory;
        ctx.fillText(r.num, on ? colX + 4 : colX + 20, y);
      });
      ctx.font = `700 11.5px ${FONT_DISPLAY}`;
      ctx.fillStyle = on ? COLORS.alert : COLORS.gold;
      ctx.fillText(on ? "⚠ 负号飘出列界，扫账易漏看正负" : "✓ 关掉凸排：符号严守数据列", 22, h - 10);
    } else if (kind === "centered") {
      const mid = w / 2;
      ctx.strokeStyle = COLORS.rule;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(mid, 14); ctx.lineTo(mid, h - 18); ctx.stroke();
      ctx.setLineDash([]);
      const fz = 19;
      ctx.font = `600 ${fz}px ${FONT_SERIF_SC}`;
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.ivory;
      const title = "秋夜活字展";
      const tw = ctx.measureText(title).width;
      const offset = on ? -fz * 0.48 : 0;
      ctx.fillText(title, mid + offset, 64);
      ctx.fillStyle = on ? COLORS.alert : COLORS.gold;
      ctx.fillText("“", mid + offset - tw / 2 - fz * 0.45, 64);
      ctx.fillText("”", mid + offset + tw / 2 + fz * 0.45, 64);
      ctx.font = `500 13px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLORS.muted;
      ctx.fillText("十月二十日 · 书院展厅", mid, 102);
      ctx.font = `700 11.5px ${FONT_DISPLAY}`;
      ctx.fillStyle = on ? COLORS.alert : COLORS.gold;
      ctx.fillText(on ? "⚠ 单边强挂反而把居中标题拽偏中轴" : "✓ 居中排版无需凸排，中轴端正", mid, h - 12);
    }
  }

  cards.forEach((card) => {
    const btn = card.querySelector(".switch-btn");
    btn.addEventListener("click", () => {
      const next = card.dataset.on === "1" ? "0" : "1";
      card.dataset.on = next;
      btn.classList.toggle("is-on", next === "1");
      btn.setAttribute("aria-pressed", String(next === "1"));
      btn.textContent = next === "1" ? "凸排：开" : "凸排：关";
      drawCard(card);
    });
    new ResizeObserver(() => drawCard(card)).observe(card.querySelector(".mine-canvas"));
  });

  return {
    refresh() {
      cards.forEach(drawCard);
    },
  };
}

// =========================================================================
// 07 节：严格单变量小练习（右缘统一规则，只变左引号凸排量，model 实测揭晓）
// =========================================================================
function initSection07() {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const btnSubmit = document.getElementById("quiz-submit");
  const btnReset = document.getElementById("quiz-reset");
  const feedback = document.getElementById("quiz-feedback");

  let selected = null;
  let revealed = false;
  let quizModel = null;

  function renderAll() {
    const sampleCanvas = cards[0].querySelector(".quiz-canvas");
    const cw = Math.max(240, sampleCanvas.getBoundingClientRect().width || 360);
    const fz = clamp(Math.floor((cw * 0.72) / 13), 14, 21);
    quizModel = evaluateQuizOptions(fz, 13);

    quizModel.cards.forEach((item) => {
      const cardEl = cards.find((c) => c.dataset.opt === item.id);
      const canvas = cardEl.querySelector(".quiz-canvas");
      const statEl = cardEl.querySelector(".quiz-stat");
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      const { laid } = item;
      const colL = Math.round((w - laid.colWidthPx) / 2);
      const colR = colL + laid.colWidthPx;
      const lineStep = fz * 1.62;
      const totalH = (laid.lines.length - 1) * lineStep + fz;
      const topY = Math.round((h - totalH) / 2 + fz * 0.82);

      // 揭晓后叠加垂直虚线与外侧边白实测墨边剖面（与开场统一，绝不斜穿文字）
      if (revealed) {
        ctx.save();
        ctx.strokeStyle = COLORS.rule;
        ctx.lineWidth = 1.1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(colL + 0.5, 10); ctx.lineTo(colL + 0.5, h - 10);
        ctx.moveTo(colR + 0.5, 10); ctx.lineTo(colR + 0.5, h - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        const isWin = item.id === quizModel.winnerId;
        const baseX = colL - 3;
        const maxOut = clamp(colL - 10, 12, 22);
        const pts = laid.lines.map((ln, idx) => {
          const devEm = idx === 0 ? item.signedDevEm : 0;
          const outPx = idx === 0 && !isWin ? clamp(Math.abs(devEm) * maxOut * 1.9, 5, maxOut) : 0;
          return {
            x: baseX - outPx,
            y: topY + idx * lineStep - fz * 0.34,
            outPx,
          };
        });
        ctx.strokeStyle = isWin ? COLORS.gold : "rgba(230, 110, 60, 0.72)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        pts.forEach((p, idx) => {
          if (p.outPx > 0) {
            ctx.strokeStyle = COLORS.alert;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(baseX, p.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
          ctx.fillStyle = idx === 0 && !isWin ? COLORS.alert : COLORS.gold;
          ctx.beginPath();
          ctx.arc(p.x, p.y, idx === 0 && !isWin ? 3.0 : 2.3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // 绘制四行粗宋体文字
      ctx.font = `600 ${fz}px ${FONT_SERIF_SC}`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      laid.lines.forEach((ln, idx) => {
        const y = topY + idx * lineStep;
        ln.glyphs.forEach((g) => {
          ctx.fillStyle = g.isHangLeft || g.isHangRight ? COLORS.gold : COLORS.ivory;
          ctx.fillText(g.char, colL + g.x, y);
        });
      });

      // 揭晓数值行
      if (revealed) {
        const isWin = item.id === quizModel.winnerId;
        const dirWord = isWin ? "实测偏差最小" : item.signedDevEm > 0 ? "首字内凹" : "首字外凸";
        statEl.textContent = `左引号 ${item.ratioPct}% 实测字宽 · 首字墨边差 ${fmtSignedEm(item.signedDevEm)}（${dirWord}）`;
        statEl.hidden = false;
      } else {
        statEl.hidden = true;
      }
    });
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (revealed) return;
      selected = card.dataset.opt;
      cards.forEach((c) => {
        const on = c === card;
        c.classList.toggle("is-selected", on);
        c.setAttribute("aria-checked", String(on));
      });
      btnSubmit.disabled = false;
      feedback.textContent = `已选 ${selected}，点击按钮揭晓四张校样的实测墨边剖面。`;
    });
  });

  btnSubmit.addEventListener("click", () => {
    if (!selected || !quizModel) return;
    revealed = true;
    btnSubmit.hidden = true;
    btnReset.hidden = false;
    const win = quizModel.cards.find((c) => c.id === quizModel.winnerId);
    cards.forEach((c) => {
      c.classList.remove("is-correct", "is-wrong");
      if (c.dataset.opt === quizModel.winnerId) c.classList.add("is-correct");
      else if (c.dataset.opt === selected) c.classList.add("is-wrong");
    });
    renderAll();
    if (selected === quizModel.winnerId) {
      feedback.textContent = `判断精准！答案是 ${win.id}：左引号凸排 ${win.ratioPct}% 实际字宽时，首行「凡」字左墨边与下方三行首字偏差仅 ${fmtSignedEm(win.signedDevEm)}（四张中最小）；50% 与 75% 均内凹，125% 则把首字拽出了左界。`;
    } else {
      const picked = quizModel.cards.find((c) => c.id === selected);
      feedback.textContent = `最直的是 ${win.id}（首字墨边差仅 ${fmtSignedEm(win.signedDevEm)}）。你选的 ${picked.id} 将左引号挂出 ${picked.ratioPct}% 实际字宽，实测墨边剖面显示首字${picked.signedDevEm > 0 ? "向内退缩" : "向外凸出"} ${fmtSignedEm(picked.signedDevEm)}。`;
    }
  });

  btnReset.addEventListener("click", () => {
    selected = null;
    revealed = false;
    btnSubmit.hidden = false;
    btnSubmit.disabled = true;
    btnReset.hidden = true;
    cards.forEach((c) => {
      c.classList.remove("is-selected", "is-correct", "is-wrong");
      c.setAttribute("aria-checked", "false");
    });
    feedback.textContent = "先点选 A、B、C、D 中任意一张校样，再揭晓实测墨边剖面。";
    renderAll();
  });

  new ResizeObserver(renderAll).observe(document.getElementById("quiz-grid"));
  return { refresh: renderAll };
}

// =========================================================================
// 08 节：原海报放大拖拽灯箱（直接复用 #poster 的 src，绝不重复内联）
// =========================================================================
function initLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const zoomBtn = document.getElementById("poster-zoom-btn");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const viewport = document.getElementById("lb-viewport");
  const scaleEl = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleEl.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
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
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  if (zoomBtn) zoomBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = clamp(scale + 0.25, 0.5, 4); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = clamp(scale - 0.25, 0.5, 4); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.18 : -0.18), 0.5, 4);
    applyTransform();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    pan = { x: e.clientX, y: e.clientY, tx, ty };
    viewport.classList.add("is-panning");
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = pan.tx + (e.clientX - pan.x);
    ty = pan.ty + (e.clientY - pan.y);
    applyTransform();
  });
  const endPan = () => { pan = null; viewport.classList.remove("is-panning"); };
  viewport.addEventListener("pointerup", endPan);
  viewport.addEventListener("pointercancel", endPan);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// =========================================================================
// 启动与字体就绪后重扫实测缓存
// =========================================================================
const hero = initHero();
const s01 = initSection01();
const s02 = initSection02();
const s03 = initSection03();
const s04 = initSection04();
const s05 = initSection05();
const s06 = initSection06();
const s07 = initSection07();
initLightbox();

function refreshAll() {
  clearGlyphCache();
  hero.refresh();
  s01.refresh();
  s02.refresh();
  s03.refresh();
  s04.refresh();
  s05.refresh();
  s06.refresh();
  s07.refresh();
}

document.fonts.ready.then(() => {
  refreshAll();
  requestAnimationFrame(refreshAll);
});
