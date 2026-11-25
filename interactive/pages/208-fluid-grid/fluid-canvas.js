// 208 流体网格 · 开场「弹性流体水槽」2D Canvas 渲染与直接交互模块
// 支持：1) 横拖弹性右壁 / 画布空白区伸缩视口宽（data-perf-drag）
//       2) 直拖列间竖缝实时重分相邻两列比例权重
//       3) 点击画布内红标一键修复、点击底栏三端缩略轨瞬切 1440 / 960 / 390px

import { pixelRatio } from "../../lib/stage.js";
import { VIEW_MIN, VIEW_MAX, clampWidth, adjustSeam } from "./model.js";

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, Math.max(0, w / 2), Math.max(0, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function createFluidStage(canvas, getState, getEval, callbacks) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgCacheKey = "";
  let cssW = 800;
  let cssH = 380;
  let dpr = 1;
  let bgGrad = null;
  let dirty = true;

  // 缓动视觉宽（拖动手感跟手且点击三端预设时顺滑过渡）
  let displayWidth = getState().width;
  let openAnim = 0; // 开场流道展开动画（0..1）

  // 实时命中热区（每帧绘制时写入，保证点击/拖拽与实绘像素 100% 对齐）
  let hitZones = {
    rulerRect: null,
    rightWallX: 0,
    tankTop: 0,
    tankBottom: 0,
    seams: [],     // { index, x, y0, y1 }
    tierCards: [], // { width, x, y, w, h }
    fixPill: null, // { action, x, y, w, h }
    scaleX0: 0,
    scaleW: 1,
  };

  let hoverKind = ""; // "", "wall", "seam:N", "tier", "fix"
  let dragMode = null; // null | { type: "width", startX, startW } | { type: "seam", index, startX, startWeights, boxPx }
  let activePointerId = null;

  function pxToStageX(viewPx) {
    const ratio = (viewPx - VIEW_MIN) / (VIEW_MAX - VIEW_MIN);
    return hitZones.scaleX0 + Math.max(0, Math.min(1, ratio)) * hitZones.scaleW;
  }

  function stageXToViewPx(sx) {
    const ratio = (sx - hitZones.scaleX0) / Math.max(1, hitZones.scaleW);
    return clampWidth(VIEW_MIN + ratio * (VIEW_MAX - VIEW_MIN));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nextDpr = rect.width < 640 ? pixelRatio(1.5) : pixelRatio(2);
    if (rect.width === cssW && rect.height === cssH && nextDpr === dpr && bgGrad) return;
    dpr = nextDpr;
    cssW = rect.width;
    cssH = rect.height;
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      bgCanvas.width = targetW;
      bgCanvas.height = targetH;
    }
    bgGrad = bgCtx.createLinearGradient(0, 0, cssW, cssH);
    bgGrad.addColorStop(0, "#130B44");
    bgGrad.addColorStop(0.55, "#1C1156");
    bgGrad.addColorStop(1, "#160D4A");
    bgCacheKey = "";
    dirty = true;
  }

  function drawColumnContent(x, y, w, h, col, scene, isNarrow, isCompact) {
    if (w < 18) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
    ctx.clip();

    const textAlpha = col.isFocal ? 1 : 0.96;
    const subAlpha = col.isFocal ? 0.92 : 0.78;
    const fg = col.isFocal ? "#190C46" : "#FFFFFF";
    const fgSoft = col.isFocal ? "rgba(25, 12, 70, 0.78)" : "rgba(232, 226, 255, 0.80)";
    const lineInk = col.isFocal ? "rgba(25, 12, 70, 0.24)" : "rgba(255, 255, 255, 0.20)";

    if (scene === "poster") {
      // 1:1 呼应 208 原海报：居中的大百分比 + 下方分数 + 底部实时像素宽
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const pctStr = `${col.weight}%`;
      const bigSize = Math.max(11, Math.min(isCompact ? 17 : 22, w * 0.27));
      if (w >= 34) {
        ctx.font = `700 ${bigSize.toFixed(0)}px "Sora", "Noto Sans SC", sans-serif`;
        ctx.fillStyle = fg;
        ctx.globalAlpha = textAlpha;
        ctx.fillText(pctStr, x + w / 2, y + h * (h > 85 ? 0.36 : 0.44));
      }
      if (w >= 40 && h > 64) {
        const subSize = Math.max(10, Math.min(13, w * 0.16));
        ctx.font = `500 ${subSize.toFixed(0)}px "IBM Plex Mono", monospace`;
        ctx.fillStyle = fgSoft;
        ctx.globalAlpha = subAlpha;
        ctx.fillText(col.fraction, x + w / 2, y + h * 0.59);
      }
      if (w >= 46 && h > 92) {
        ctx.font = `500 11px "IBM Plex Mono", monospace`;
        ctx.fillStyle = fgSoft;
        ctx.globalAlpha = 0.88;
        ctx.fillText(`${Math.round(col.px)}px`, x + w / 2, y + h * 0.80);
      }
    } else if (scene === "editorial") {
      // 编辑图文：顶标签 + 随列宽伸缩的活体文本行（超宽时显露长行压力）
      const pad = Math.min(12, Math.max(5, w * 0.08));
      const innerW = w - pad * 2;
      if (innerW > 14) {
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = `600 10px "Sora", "Noto Sans SC", sans-serif`;
        ctx.fillStyle = fgSoft;
        ctx.fillText(w >= 54 ? `${col.name} ${col.weight}%` : `${col.weight}%`, x + pad, y + 9);

        if (col.isFocal && h > 70) {
          // 焦点正文栏：模拟标题 + 多行随宽度变化的排字条
          ctx.fillStyle = fg;
          ctx.globalAlpha = 0.88;
          roundRect(ctx, x + pad, y + 27, Math.min(innerW * 0.82, innerW), 8, 2);
          ctx.fill();
          const rows = Math.min(5, Math.max(2, Math.floor((h - 48) / 13)));
          ctx.fillStyle = lineInk;
          ctx.globalAlpha = 1;
          for (let r = 0; r < rows; r++) {
            const rw = r === rows - 1 ? innerW * 0.62 : innerW * (0.94 - (r % 2) * 0.05);
            roundRect(ctx, x + pad, y + 43 + r * 12, Math.max(6, rw), 4.5, 2);
            ctx.fill();
          }
          if (w >= 96 && h > 95) {
            ctx.font = `500 10px "IBM Plex Mono", monospace`;
            ctx.fillStyle = fg;
            ctx.globalAlpha = 0.85;
            ctx.fillText(`${Math.round(col.px)}px · 约${Math.round(col.px / 16.5)}字/行`, x + pad, y + h - 18);
          }
        } else {
          // 边栏 / 配图栏
          ctx.fillStyle = lineInk;
          if (col.index % 2 === 0 && h > 68) {
            roundRect(ctx, x + pad, y + 28, innerW, Math.max(18, h * 0.34), 4);
            ctx.fill();
            roundRect(ctx, x + pad, y + 34 + Math.max(18, h * 0.34), innerW * 0.78, 4, 2);
            ctx.fill();
          } else {
            const rows = Math.min(4, Math.max(2, Math.floor((h - 38) / 14)));
            for (let r = 0; r < rows; r++) {
              roundRect(ctx, x + pad, y + 30 + r * 12, innerW * (r === rows - 1 ? 0.55 : 0.88), 4, 2);
              ctx.fill();
            }
          }
        }
      }
    } else {
      // 数据看板：趋势折线主图 + 指标柱图
      const pad = Math.min(12, Math.max(5, w * 0.08));
      const innerW = w - pad * 2;
      if (innerW > 14) {
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = `600 10px "Sora", "Noto Sans SC", sans-serif`;
        ctx.fillStyle = fgSoft;
        ctx.fillText(w >= 54 ? `${col.name} ${col.weight}%` : `${col.weight}%`, x + pad, y + 9);

        if (col.isFocal && h > 72) {
          // 折线趋势面积图
          const pts = [0.72, 0.56, 0.62, 0.34, 0.42, 0.22, 0.30];
          const gx0 = x + pad;
          const gy0 = y + 30;
          const gh = Math.max(24, h - 54);
          ctx.beginPath();
          pts.forEach((v, idx) => {
            const px = gx0 + (innerW * idx) / (pts.length - 1);
            const py = gy0 + gh * v;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = fg;
          ctx.lineWidth = 2.2;
          ctx.stroke();
          ctx.lineTo(gx0 + innerW, gy0 + gh);
          ctx.lineTo(gx0, gy0 + gh);
          ctx.closePath();
          ctx.fillStyle = "rgba(25, 12, 70, 0.14)";
          ctx.fill();
          if (w >= 86) {
            ctx.font = `600 10px "IBM Plex Mono", monospace`;
            ctx.fillStyle = fg;
            ctx.fillText(`${Math.round(col.px)}px`, x + pad, y + h - 18);
          }
        } else {
          // 柱状微图表
          const bars = Math.max(2, Math.min(5, Math.floor(innerW / 12)));
          const bw = Math.max(4, (innerW - (bars - 1) * 4) / bars);
          const baseY = y + h - 16;
          const maxH = Math.max(16, h - 46);
          ctx.fillStyle = lineInk;
          for (let b = 0; b < bars; b++) {
            const bh = maxH * (0.35 + ((b * 37 + col.index * 23) % 60) / 100);
            roundRect(ctx, x + pad + b * (bw + 4), baseY - bh, bw, bh, 2);
            ctx.fill();
          }
        }
      }
    }
    ctx.restore();
  }

  function drawFrame(t, dt, { still }) {
    resize();
    if (!cssW || !cssH) return;

    const state = getState();
    const evalRes = getEval();
    const live = evalRes.live;

    const animatingOpen = !still && openAnim < 1;
    const animatingWidth = !still && dragMode?.type !== "width" && Math.abs(displayWidth - state.width) >= 0.6;
    const animatingWave = !still && evalRes.healthy;

    if (!dirty && !animatingOpen && !animatingWidth && !animatingWave) {
      return;
    }
    dirty = false;

    // 开场丝滑展开（reducedMotion 下直接到位）
    if (still) {
      openAnim = 1;
      displayWidth = state.width;
    } else {
      if (openAnim < 1) openAnim = Math.min(1, openAnim + (dt ? dt * 2.1 : 0.05));
      if (dragMode?.type === "width") {
        displayWidth = state.width;
      } else if (Math.abs(displayWidth - state.width) >= 0.6) {
        displayWidth += (state.width - displayWidth) * Math.min(1, (dt || 0.016) * 14);
        if (Math.abs(displayWidth - state.width) < 0.6) displayWidth = state.width;
      }
    }

    const easeOpen = 1 - Math.pow(1 - openAnim, 3);
    const isNarrow = cssW < 520;
    const isCompact = cssH < 300;

    // 布局纵向坐标分配（顶部胶囊与刻度数严格分层，杜绝任何重叠）
    const padX = isNarrow ? 16 : 24;
    const pillTop = isCompact ? 11 : 13;
    const rulerLineY = isCompact ? 41 : 46;
    const footerH = isCompact ? 48 : isNarrow ? 62 : 58;
    const waveSpace = isCompact ? 22 : 28;
    const tankTop = rulerLineY + (isCompact ? 17 : 19);
    const tankBottom = cssH - footerH - waveSpace - 8;
    const tankH = Math.max(72, tankBottom - tankTop);

    // 标尺横向区间（留出右端显示溢出破框区）
    const scaleX0 = padX;
    const scaleW = Math.max(120, cssW - padX * 2 - (isNarrow ? 12 : 24));
    hitZones.scaleX0 = scaleX0;
    hitZones.scaleW = scaleW;
    hitZones.tankTop = tankTop;
    hitZones.tankBottom = tankBottom;
    hitZones.rulerRect = { x: scaleX0 - 8, y: pillTop - 4, w: scaleW + 16, h: tankTop - pillTop };
    hitZones.seams = [];
    hitZones.tierCards = [];
    hitZones.fixPill = null;

    const footTop = cssH - footerH - 4;
    const footGap = isNarrow ? 6 : 10;
    const cardW = (cssW - padX * 2 - footGap * 2) / 3;
    const cardH = footerH - 8;
    const tiers = [
      { key: "desktop", label: isNarrow ? "桌面 1440" : "宽屏桌面 1440px", targetW: 1440, item: evalRes.tiers.desktop },
      { key: "tablet", label: isNarrow ? "平板 960" : "平板横屏 960px", targetW: 960, item: evalRes.tiers.tablet },
      { key: "mobile", label: isNarrow ? "手机 390" : "手机竖屏 390px", targetW: 390, item: evalRes.tiers.mobile },
    ];
    tiers.forEach((tr, idx) => {
      const cx = padX + idx * (cardW + footGap);
      hitZones.tierCards.push({ width: tr.targetW, x: cx, y: footTop, w: cardW, h: cardH });
    });

    // 静态底图 + 标尺刻度 + 底部三端映射带离屏缓存（仅在参数/档位/尺寸改变时重绘，拖拽宽度零重复光栅化）
    const nextCacheKey = `${cssW}|${cssH}|${dpr}|${state.unit}|${state.gap}|${state.reflow}|${state.clampGuard}|${state.weights.join(",")}|${live.tier.id}`;
    if (nextCacheKey !== bgCacheKey) {
      bgCacheKey = nextCacheKey;
      bgCtx.save();
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgCtx.fillStyle = "#1C1156";
      bgCtx.fillRect(0, 0, cssW, cssH);
      bgCtx.fillStyle = bgGrad;
      roundRect(bgCtx, 0, 0, cssW, cssH, 14);
      bgCtx.fill();

      // 208 原海报标志虚线圆角内框
      bgCtx.save();
      bgCtx.strokeStyle = "rgba(155, 140, 232, 0.34)";
      bgCtx.lineWidth = 1.25;
      bgCtx.setLineDash([4, 4]);
      roundRect(bgCtx, 7, 7, cssW - 14, cssH - 14, 10);
      bgCtx.stroke();
      bgCtx.restore();

      // 标尺底线与断点虚线
      const tickValues = isNarrow ? [320, 768, 1280, 1600] : [320, 560, 768, 960, 1120, 1280, 1440, 1600];
      bgCtx.strokeStyle = "rgba(167, 154, 236, 0.28)";
      bgCtx.lineWidth = 1;
      bgCtx.beginPath();
      bgCtx.moveTo(scaleX0, rulerLineY);
      bgCtx.lineTo(scaleX0 + scaleW, rulerLineY);
      bgCtx.stroke();

      [768, 1280].forEach((bp) => {
        const bx = pxToStageX(bp);
        bgCtx.save();
        bgCtx.strokeStyle = "rgba(232, 104, 158, 0.24)";
        bgCtx.setLineDash([3, 4]);
        bgCtx.beginPath();
        bgCtx.moveTo(bx, rulerLineY + 13);
        bgCtx.lineTo(bx, tankBottom + 4);
        bgCtx.stroke();
        bgCtx.restore();
      });

      bgCtx.font = `500 10px "IBM Plex Mono", monospace`;
      bgCtx.textBaseline = "top";
      tickValues.forEach((v) => {
        const tx = pxToStageX(v);
        const isBp = v === 768 || v === 1280;
        bgCtx.strokeStyle = isBp ? "rgba(240, 122, 174, 0.78)" : "rgba(182, 171, 240, 0.4)";
        bgCtx.beginPath();
        bgCtx.moveTo(tx, rulerLineY - (isBp ? 5 : 4));
        bgCtx.lineTo(tx, rulerLineY + 3);
        bgCtx.stroke();
        bgCtx.fillStyle = isBp ? "#F49EC4" : "rgba(210, 202, 248, 0.78)";
        bgCtx.textAlign = v === VIEW_MIN ? "left" : v === VIEW_MAX ? "right" : "center";
        bgCtx.fillText(`${v}`, tx, rulerLineY + 4);
      });

      // 底部三端同步映射带
      tiers.forEach((tr, idx) => {
        const cx = padX + idx * (cardW + footGap);
        const cy = footTop;
        const isActiveTier = live.tier.id === tr.key;
        const ok = tr.item.status.ok;

        bgCtx.save();
        roundRect(bgCtx, cx, cy, cardW, cardH, 7);
        bgCtx.fillStyle = isActiveTier ? "rgba(69, 49, 152, 0.54)" : "rgba(21, 13, 68, 0.72)";
        bgCtx.fill();
        bgCtx.strokeStyle = isActiveTier
          ? "#E8689E"
          : ok
            ? "rgba(106, 235, 193, 0.36)"
            : "rgba(255, 122, 150, 0.42)";
        bgCtx.lineWidth = isActiveTier ? 1.5 : 1;
        bgCtx.stroke();

        bgCtx.textBaseline = "top";
        bgCtx.font = `600 ${isNarrow ? 10 : 11}px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
        bgCtx.fillStyle = "#EAE4FF";
        bgCtx.textAlign = "left";
        bgCtx.fillText(tr.label, cx + 8, cy + 7);

        bgCtx.textAlign = "right";
        bgCtx.fillStyle = ok ? "#6EEEC5" : "#FF96AE";
        bgCtx.font = `600 10px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
        bgCtx.fillText(tr.item.status.tag, cx + cardW - 8, cy + 7);

        const miniX = cx + 8;
        const miniY = cy + (isCompact ? 23 : 26);
        const miniW = cardW - 16;
        const miniH = Math.max(12, cardH - (isCompact ? 30 : 34));
        const td = tr.item.data;
        if (td.stacked) {
          const rh = (miniH - 4) / 3;
          td.cols.forEach((r, ri) => {
            roundRect(bgCtx, miniX, miniY + ri * (rh + 2), miniW, Math.max(2, rh), 1.5);
            bgCtx.fillStyle = r.color;
            bgCtx.fill();
          });
        } else {
          const scale = miniW / Math.max(td.viewWidth, td.usedW);
          let mx = miniX;
          const mg = Math.max(1, td.gap * scale);
          td.cols.forEach((c) => {
            const mw = Math.max(2, c.px * scale);
            roundRect(bgCtx, mx, miniY, mw, miniH, 2);
            bgCtx.fillStyle = c.color;
            bgCtx.fill();
            mx += mw + mg;
          });
          if (td.overflowPx > 0) {
            const wallX = miniX + td.viewWidth * scale;
            bgCtx.strokeStyle = "#FF6B8B";
            bgCtx.lineWidth = 1.5;
            bgCtx.beginPath();
            bgCtx.moveTo(wallX, miniY - 2);
            bgCtx.lineTo(wallX, miniY + miniH + 2);
            bgCtx.stroke();
          }
        }
        bgCtx.restore();
      });

      bgCtx.restore();
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.scale(dpr, dpr);

    // 2. 当前标尺激活进度条与游标胶囊
    const curRightX = pxToStageX(displayWidth);
    ctx.save();
    const activeLineColor = evalRes.healthy ? "#E8689E" : "#FF7393";
    ctx.strokeStyle = activeLineColor;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(scaleX0, rulerLineY);
    ctx.lineTo(curRightX, rulerLineY);
    ctx.stroke();

    const pillText = `${Math.round(displayWidth)}px · ${live.tier.zh}`;
    ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    const pillW = Math.min(cssW - 36, ctx.measureText(pillText).width + 18);
    const pillH = 20;
    const pillX = Math.max(scaleX0, Math.min(scaleX0 + scaleW - pillW, curRightX - pillW / 2));
    const pillColor = evalRes.healthy ? "#E8689E" : "#B82246";
    roundRect(ctx, pillX, pillTop, pillW, pillH, 10);
    ctx.fillStyle = pillColor;
    ctx.fill();
    const tipX = Math.max(pillX + 10, Math.min(pillX + pillW - 10, curRightX));
    ctx.beginPath();
    ctx.moveTo(tipX - 5, pillTop + pillH - 1);
    ctx.lineTo(tipX + 5, pillTop + pillH - 1);
    ctx.lineTo(tipX, pillTop + pillH + 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = evalRes.healthy ? "#180B44" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + pillW / 2, pillTop + pillH / 2 + 0.5);
    ctx.restore();

    // 3. 活体视口容器外框（左壁固定在 scaleX0，右壁随 displayWidth 伸缩）
    const viewportW = Math.max(68, curRightX - scaleX0);
    const pxPerLogical = viewportW / Math.max(1, displayWidth);
    hitZones.rightWallX = curRightX;

    // 视口底舱
    ctx.save();
    roundRect(ctx, scaleX0, tankTop, viewportW, tankH, 8);
    ctx.fillStyle = "rgba(13, 7, 46, 0.72)";
    ctx.fill();
    ctx.strokeStyle = evalRes.healthy ? "rgba(232, 104, 158, 0.52)" : "rgba(255, 115, 147, 0.56)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 若开启行宽护栏且超宽 (>1440px)，标出左右柔和居中安全留白
    if (live.clamped && live.safeMarginX > 0) {
      const mPx = live.safeMarginX * pxPerLogical;
      ctx.save();
      ctx.fillStyle = "rgba(106, 235, 193, 0.08)";
      ctx.fillRect(scaleX0 + 1, tankTop + 1, mPx, tankH - 2);
      ctx.fillRect(curRightX - mPx - 1, tankTop + 1, mPx, tankH - 2);
      if (mPx > 20) {
        ctx.font = `500 10px "IBM Plex Mono", sans-serif`;
        ctx.fillStyle = "#79ECC7";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("护栏", scaleX0 + mPx / 2, tankTop + tankH / 2);
      }
      ctx.restore();
    }

    // 4. 绘制实算流体列带（或手机 100% 堆叠三行）
    const innerPadY = 7;
    const colAreaY = tankTop + innerPadY;
    const colAreaH = tankH - innerPadY * 2;
    const colStartX = scaleX0 + 6 + live.safeMarginX * pxPerLogical;
    const colInnerScale = (viewportW - 12) / Math.max(1, displayWidth);

    if (live.stacked) {
      // 1:1 呼应原海报手机竖屏：三层 100% 满宽水平堆叠
      const rowGap = 5;
      const rowH = (colAreaH - rowGap * (live.cols.length - 1)) / live.cols.length;
      const fullW = Math.max(40, (viewportW - 12) * easeOpen);
      live.cols.forEach((row, idx) => {
        const ry = colAreaY + idx * (rowH + rowGap);
        roundRect(ctx, scaleX0 + 6, ry, fullW, rowH, 4);
        ctx.fillStyle = row.color;
        ctx.fill();
        ctx.fillStyle = idx === 0 ? "#180B44" : "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${isCompact ? 12 : 13}px "Sora", "Noto Sans SC", sans-serif`;
        const label = fullW > 150 ? `100% · ${row.name}` : "100% (1/1)";
        ctx.fillText(label, scaleX0 + 6 + fullW / 2, ry + rowH / 2);
      });
    } else {
      // 多列横向流体带
      let drawX = colStartX;
      const renderedGap = live.gap * colInnerScale;

      live.cols.forEach((col, i) => {
        const cw = Math.max(3, col.px * colInnerScale * easeOpen);
        const rx = drawX;
        const spillsRight = rx + cw > curRightX - 2;

        // 列矩形本体
        roundRect(ctx, rx, colAreaY, cw, colAreaH, 4);
        ctx.fillStyle = col.color;
        ctx.fill();

        // 若单列塌缩成针眼，给警示红虚线框
        if (col.isNeedle) {
          ctx.save();
          ctx.strokeStyle = "#FF8CA6";
          ctx.lineWidth = 1.6;
          ctx.setLineDash([3, 3]);
          roundRect(ctx, rx + 0.8, colAreaY + 0.8, Math.max(2, cw - 1.6), colAreaH - 1.6, 3.5);
          ctx.stroke();
          ctx.restore();
        }

        // 列内实时比例/排版/看板内容
        drawColumnContent(rx, colAreaY, cw, colAreaH, col, state.scene, isNarrow, isCompact);

        // 记录列间可拖拽分界缝热区（未堆叠且非最后列）
        if (i < live.cols.length - 1 && !live.reflowedTablet) {
          const seamX = rx + cw + renderedGap / 2;
          hitZones.seams.push({
            index: i,
            x: seamX,
            y0: colAreaY,
            y1: colAreaY + colAreaH,
            boxPx: Math.max(60, live.boxW * colInnerScale),
          });
          // 轻微可拖分隔点
          const isHoverSeam = hoverKind === `seam:${i}` || (dragMode?.type === "seam" && dragMode.index === i);
          ctx.save();
          ctx.fillStyle = isHoverSeam ? "#FFFFFF" : "rgba(255, 255, 255, 0.42)";
          const dotR = isHoverSeam ? 2.6 : 1.7;
          const cy = colAreaY + colAreaH / 2;
          [-7, 0, 7].forEach((dy) => {
            ctx.beginPath();
            ctx.arc(seamX, cy + dy, dotR, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }

        // 溢出部分叠画红色斜纹警示（单路径合批绘制，软件渲染满帧）
        if (spillsRight) {
          const overStart = Math.max(rx, curRightX);
          const overW = Math.min(rx + cw - overStart, cssW - overStart - 10);
          if (overW > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(overStart, colAreaY, overW, colAreaH);
            ctx.clip();
            ctx.fillStyle = "rgba(184, 29, 56, 0.52)";
            ctx.fillRect(overStart, colAreaY, overW, colAreaH);
            ctx.strokeStyle = "rgba(255, 168, 188, 0.55)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            for (let s = -colAreaH; s < overW + colAreaH; s += 11) {
              ctx.moveTo(overStart + s, colAreaY);
              ctx.lineTo(overStart + s + colAreaH, colAreaY + colAreaH);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        drawX += cw + renderedGap;
      });

      // 若是固定 px 宽屏留出闲置死白，标注闲置空洞区
      if (live.voidPx > 80) {
        const usedEndX = colStartX + live.usedW * colInnerScale;
        const voidW = curRightX - 6 - usedEndX;
        if (voidW > 22) {
          ctx.save();
          ctx.fillStyle = "rgba(255, 122, 150, 0.12)";
          ctx.strokeStyle = "rgba(255, 138, 165, 0.52)";
          ctx.setLineDash([4, 4]);
          roundRect(ctx, usedEndX + 4, colAreaY, voidW - 4, colAreaH, 5);
          ctx.fill();
          ctx.stroke();
          ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
          ctx.fillStyle = "#FF9DB2";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(voidW > 84 ? `闲置死白 ${live.voidPx}px` : `+${live.voidPx}`, usedEndX + voidW / 2 + 2, colAreaY + colAreaH / 2);
          ctx.restore();
        }
      }
    }

    // 5. 容器右壁可拖珊瑚粉弹性柄（高对比、一眼即懂“往左右扯”）
    const wallHover = hoverKind === "wall" || dragMode?.type === "width";
    ctx.save();
    ctx.strokeStyle = evalRes.healthy ? "#F37EB0" : "#FF7393";
    ctx.lineWidth = wallHover ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(curRightX, tankTop - 2);
    ctx.lineTo(curRightX, tankBottom + 2);
    ctx.stroke();

    // 弹性抓手胶囊
    const gripW = wallHover ? 16 : 13;
    const gripH = 38;
    const gripY = tankTop + (tankH - gripH) / 2;
    roundRect(ctx, curRightX - gripW / 2, gripY, gripW, gripH, 7);
    ctx.fillStyle = evalRes.healthy ? "#E8689E" : "#FF6386";
    ctx.fill();
    ctx.strokeStyle = "#160D48";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 抓手内两条竖纹
    ctx.strokeStyle = "#180B44";
    ctx.lineWidth = 1.5;
    [-2.2, 2.2].forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(curRightX + dx, gripY + 11);
      ctx.lineTo(curRightX + dx, gripY + gripH - 11);
      ctx.stroke();
    });
    ctx.restore();

    // 6. 画布内红标就地修错胶囊（有错态时显示，点击直接修复头号问题）
    if (!evalRes.healthy && evalRes.fixAction) {
      const topIssue = evalRes.issues[0];
      const tag = `× ${topIssue.badge} · 点此修复`;
      ctx.save();
      ctx.font = `600 11px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
      const tw = ctx.measureText(tag).width + 20;
      const th = 24;
      const tx = Math.max(scaleX0 + 8, Math.min(cssW - tw - 18, curRightX - tw - 14));
      const ty = tankTop + 10;
      roundRect(ctx, tx, ty, tw, th, 12);
      ctx.fillStyle = hoverKind === "fix" ? "#D42A50" : "#A81B3C";
      ctx.fill();
      ctx.strokeStyle = "#FFC2D1";
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, tx + tw / 2, ty + th / 2 + 0.5);
      ctx.restore();
      hitZones.fixPill = { action: evalRes.fixAction, x: tx, y: ty, w: tw, h: th };
    }

    // 7. 208 原海报标志珊瑚粉波浪导流箭头（通流时柔顺连续，错态时折角虚线断流示警）
    const waveY = tankBottom + waveSpace * 0.54;
    const waveX0 = scaleX0 + 6;
    const waveX1 = Math.max(waveX0 + 40, curRightX - 10);
    const waveLen = waveX1 - waveX0;
    const phase = still ? 0 : t * 1.4;
    ctx.save();
    ctx.beginPath();
    if (evalRes.healthy) {
      const steps = 64;
      const cycles = Math.max(2.5, waveLen / 115);
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const wx = waveX0 + u * waveLen;
        const wy = waveY + Math.sin(u * Math.PI * 2 * cycles - phase) * 4.5;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = "#E8689E";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    } else {
      const kinks = Math.max(10, Math.min(24, Math.round(waveLen / 28)));
      for (let s = 0; s <= kinks; s++) {
        const u = s / kinks;
        const wx = waveX0 + u * waveLen;
        const wy = waveY + (s % 2 === 0 ? -3.6 : 3.6);
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = "#FF6E8F";
      ctx.lineWidth = 1.9;
      ctx.setLineDash([7, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // 箭头尖端
    ctx.beginPath();
    ctx.moveTo(waveX1 - 7, waveY - 5);
    ctx.lineTo(waveX1 + 1, waveY);
    ctx.lineTo(waveX1 - 7, waveY + 5);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // ---------- 指针与触屏交互（绝不劫持手机竖向滚屏！） ----------
  function getLocalPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  function hitTest(pt) {
    if (
      hitZones.fixPill &&
      pt.x >= hitZones.fixPill.x - 4 &&
      pt.x <= hitZones.fixPill.x + hitZones.fixPill.w + 4 &&
      pt.y >= hitZones.fixPill.y - 4 &&
      pt.y <= hitZones.fixPill.y + hitZones.fixPill.h + 4
    ) {
      return { kind: "fix", action: hitZones.fixPill.action };
    }
    for (const tc of hitZones.tierCards) {
      if (pt.x >= tc.x && pt.x <= tc.x + tc.w && pt.y >= tc.y && pt.y <= tc.y + tc.h) {
        return { kind: "tier", width: tc.width };
      }
    }
    if (
      Math.abs(pt.x - hitZones.rightWallX) <= 18 &&
      pt.y >= hitZones.tankTop - 16 &&
      pt.y <= hitZones.tankBottom + 16
    ) {
      return { kind: "wall" };
    }
    for (const s of hitZones.seams) {
      if (Math.abs(pt.x - s.x) <= 11 && pt.y >= s.y0 && pt.y <= s.y1) {
        return { kind: "seam", index: s.index, boxPx: s.boxPx };
      }
    }
    if (pt.y <= hitZones.tankBottom + 24) {
      return { kind: "stage" };
    }
    return { kind: "" };
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button && ev.button !== 0) return;
    const pt = getLocalPoint(ev);
    const hit = hitTest(pt);

    if (hit.kind === "fix") {
      callbacks.onQuickFix(hit.action);
      return;
    }
    if (hit.kind === "tier") {
      callbacks.onWidthChange(hit.width);
      return;
    }

    activePointerId = ev.pointerId;
    canvas.setPointerCapture?.(ev.pointerId);

    if (hit.kind === "seam") {
      dragMode = {
        type: "seam",
        index: hit.index,
        startX: pt.x,
        startWeights: [...getState().weights],
        boxPx: hit.boxPx,
      };
    } else if (hit.kind === "wall" || hit.kind === "stage") {
      // 点击顶部标尺直接跳到该宽；横拖容器任意区直接顺滑推拉视口宽（让 perf drag 和手指横拖自然灵敏）
      const onRuler =
        hitZones.rulerRect &&
        pt.y >= hitZones.rulerRect.y &&
        pt.y <= hitZones.rulerRect.y + hitZones.rulerRect.h;
      if (onRuler) {
        const nextW = stageXToViewPx(pt.x);
        displayWidth = nextW;
        callbacks.onWidthChange(nextW);
        dragMode = { type: "width", startX: pt.x, startW: nextW, direct: true };
      } else {
        dragMode = { type: "width", startX: pt.x, startW: getState().width, direct: hit.kind === "wall" };
      }
    }
  });

  canvas.addEventListener("pointermove", (ev) => {
    const pt = getLocalPoint(ev);
    if (!dragMode) {
      const hit = hitTest(pt);
      const nextHover = hit.kind === "seam" ? `seam:${hit.index}` : hit.kind;
      if (nextHover !== hoverKind) {
        hoverKind = nextHover;
        dirty = true;
      }
      canvas.style.cursor =
        hit.kind === "fix" || hit.kind === "tier"
          ? "pointer"
          : hit.kind === "wall" || hit.kind === "seam" || hit.kind === "stage"
            ? "ew-resize"
            : "default";
      return;
    }
    if (activePointerId !== null && ev.pointerId !== activePointerId) return;

    if (dragMode.type === "width") {
      const nextW = dragMode.direct
        ? stageXToViewPx(pt.x)
        : clampWidth(dragMode.startW + ((pt.x - dragMode.startX) / Math.max(80, hitZones.scaleW)) * (VIEW_MAX - VIEW_MIN));
      displayWidth = nextW;
      callbacks.onWidthChange(nextW, true);
    } else if (dragMode.type === "seam") {
      const dx = pt.x - dragMode.startX;
      const deltaPct = (dx / Math.max(80, dragMode.boxPx)) * 100;
      const updated = adjustSeam(dragMode.startWeights, dragMode.index, deltaPct);
      callbacks.onWeightsChange(updated, true);
    }
  });

  function endDrag(ev) {
    if (activePointerId !== null && ev.pointerId !== undefined && ev.pointerId !== activePointerId) return;
    if (dragMode) callbacks.onDragEnd?.();
    dragMode = null;
    activePointerId = null;
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (!dragMode && hoverKind) {
      hoverKind = "";
      dirty = true;
      canvas.style.cursor = "default";
    }
  });

  // 触屏兜底：保证工具 perf.mjs 派发的原始 touchStart/touchMove 也能 1:1 驱动重绘！
  // CSS 上用 touch-action: pan-y，横拖实时改变视口宽，竖划仍把滚屏权还给浏览器。
  let touchDrag = null;
  canvas.addEventListener(
    "touchstart",
    (ev) => {
      if (dragMode || !ev.touches.length) return;
      const t0 = ev.touches[0];
      const rect = canvas.getBoundingClientRect();
      const pt = { x: t0.clientX - rect.left, y: t0.clientY - rect.top };
      const hit = hitTest(pt);
      if (hit.kind === "fix" || hit.kind === "tier" || hit.kind === "seam") return;
      touchDrag = {
        startX: pt.x,
        startY: pt.y,
        startW: getState().width,
        locked: null,
      };
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (ev) => {
      if (dragMode || !touchDrag || !ev.touches.length) return;
      const t0 = ev.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = t0.clientX - rect.left;
      const y = t0.clientY - rect.top;
      const dx = x - touchDrag.startX;
      const dy = y - touchDrag.startY;
      if (!touchDrag.locked && Math.hypot(dx, dy) > 4) {
        touchDrag.locked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchDrag.locked === "x") {
        const nextW = clampWidth(
          touchDrag.startW + (dx / Math.max(80, hitZones.scaleW)) * (VIEW_MAX - VIEW_MIN)
        );
        displayWidth = nextW;
        callbacks.onWidthChange(nextW, true);
      }
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      if (touchDrag?.locked === "x") callbacks.onDragEnd?.();
      touchDrag = null;
    },
    { passive: true }
  );

  return {
    drawFrame,
    markDirty() {
      dirty = true;
    },
    snapWidth(w) {
      displayWidth = w;
      dirty = true;
    },
  };
}
