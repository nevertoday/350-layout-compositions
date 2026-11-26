// 260 圣杯布局 — 开放式 2D Canvas 五区响应伸缩与等高承重台
// 1:1 承袭 260 原海报深梅紫顶底双梁、薰衣草淡紫双翼、暖象牙主区与藕荷山日封面。
// 所有几何尺寸、文字折行与红绿标注均来自 model.js 的 computeFrame(state) 单真源。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SCENES, SIM_VIEWPORT_H, COL_GAP, FRAME_PAD, clamp } from "./model.js";

const PALETTE = {
  paper: "#FAF2E9",
  frameBg: "#FAF4EC",
  headerPlum: "#4B2A4E",
  footerPlum: "#4E2A4F",
  leftLilac: "#E8DAE6",
  rightLilac: "#DFCFDB",
  mainCream: "#FBF4E8",
  mainBorder: "#D7C7D4",
  mountainBg: "#E4D5DF",
  mountainDark: "#AE91B9",
  mountainLight: "#C2A9CA",
  sunCream: "#FAF2E9",
  leftDot: "#9372A2",
  leftCard: "#AA8AB5",
  rightThumb: "#A180AD",
  cardBg: "#E4D9E3",
  textLine: "#C6B6C4",
  ink: "#171019",
  subInk: "#562A59",
  mutedInk: "#59485C",
  white: "#FAF4F6",
  ok: "#1D6B52",
  okSoft: "rgba(29, 107, 82, 0.14)",
  err: "#B52B3A",
  errSoft: "rgba(181, 43, 58, 0.14)",
  accentRail: "#6F3D75",
  overlayLine: "#4B2A4E",
};

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

function roundRectTop(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function roundRectBottom(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.closePath();
}

function wrapCJK(ctx, text, maxW, maxLines = 6) {
  if (maxW <= 12) return [text.slice(0, 2) + "…"];
  const lines = [];
  let cur = "";
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur.length > 0) {
      lines.push(cur);
      cur = ch;
      if (lines.length >= maxLines) {
        lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + "…";
        return lines;
      }
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function createHeroCanvas(canvas, getState, getFrame, onPatch, onHoverZone) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let dpr = pixelRatio(2);
  let cssW = 860;
  let cssH = 490;

  // 离屏缓存静态暖纸+网格底图与文本折行缓存（大幅提升软件渲染拖拽帧率）
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  const wrapCache = new Map();

  // 平滑插值态（仅视觉过渡，不污染单真源数据）
  let animVw = getState().viewportW;
  let animLeft = getState().leftW;
  let animRight = getState().rightW;
  let animHeaderH = getState().headerH;
  let needsRedraw = true;
  let hoverTarget = null; // null | "resize-r" | "resize-l" | "rail-l" | "rail-r" | "toggle-l" | "toggle-r"
  let dragMode = null; // null | "viewport" | "rail-l" | "rail-r"
  let dragStartX = 0;
  let dragStartVal = 0;
  let dragMoved = false;
  let lastPointerDownTime = 0;

  // 命中的实时屏幕坐标盒（每次绘制更新，用于点击与拖拽）
  const hits = {
    frameBox: { x: 0, y: 0, w: 0, h: 0 },
    scale: 1,
    railL: null,
    railR: null,
    resizeL: null,
    resizeR: null,
    toggleL: null,
    toggleR: null,
    zones: { header: null, left: null, main: null, right: null, footer: null },
  };

  function rebuildBgCache() {
    bgCanvas.width = Math.max(1, Math.round(cssW * dpr));
    bgCanvas.height = Math.max(1, Math.round(cssH * dpr));
    bgCtx.save();
    bgCtx.scale(dpr, dpr);
    bgCtx.fillStyle = PALETTE.paper;
    bgCtx.fillRect(0, 0, cssW, cssH);
    bgCtx.strokeStyle = "rgba(75, 42, 78, 0.055)";
    bgCtx.lineWidth = 1;
    const gridStep = 28;
    bgCtx.beginPath();
    for (let gx = gridStep; gx < cssW; gx += gridStep) {
      bgCtx.moveTo(gx + 0.5, 0);
      bgCtx.lineTo(gx + 0.5, cssH);
    }
    for (let gy = gridStep; gy < cssH; gy += gridStep) {
      bgCtx.moveTo(0, gy + 0.5);
      bgCtx.lineTo(cssW, gy + 0.5);
    }
    bgCtx.stroke();
    bgCtx.restore();
  }

  function wrapCached(sceneId, font, text, maxW, maxLines) {
    const qW = Math.max(16, Math.round(maxW / 4) * 4);
    const key = `${sceneId}|${font}|${qW}|${maxLines}`;
    let res = wrapCache.get(key);
    if (!res) {
      ctx.font = font;
      res = wrapCJK(ctx, text, qW, maxLines);
      if (wrapCache.size > 240) wrapCache.clear();
      wrapCache.set(key, res);
    }
    return res;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width));
    cssH = Math.max(220, Math.round(rect.height));
    // 手机窄屏限制 DPR ≤ 1.5（GUIDE.md 性能守则）
    dpr = cssW < 520 ? pixelRatio(1.5) : pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    rebuildBgCache();
    needsRedraw = true;
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function drawTopRuler(x, y, w, vw, modeLabel, passedCount) {
    // 顶部视口宽度标尺（显示 360..1360 刻度与当前模拟宽）
    const barY = y - 16;
    ctx.save();
    ctx.strokeStyle = "rgba(75, 42, 78, 0.24)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, barY);
    ctx.lineTo(x + w, barY);
    ctx.stroke();

    // 两端短竖标
    ctx.beginPath();
    ctx.moveTo(x, barY - 5);
    ctx.lineTo(x, barY + 5);
    ctx.moveTo(x + w, barY - 5);
    ctx.lineTo(x + w, barY + 5);
    ctx.stroke();

    // 居中宽幅芯片
    const label = `${vw}px · ${modeLabel}`;
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    const tw = ctx.measureText(label).width + 18;
    const cx = x + w / 2;
    roundRectPath(ctx, cx - tw / 2, barY - 10, tw, 20, 10);
    ctx.fillStyle = passedCount === 4 ? PALETTE.ok : PALETTE.headerPlum;
    ctx.fill();
    ctx.fillStyle = PALETTE.white;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, barY + 0.5);
    ctx.restore();
  }

  function drawMountainArt(x, y, w, h) {
    // 零 clip 极速纯多边形山日封面（消除软件渲染蒙版重建开销）
    roundRectPath(ctx, x, y, w, h, 4);
    ctx.fillStyle = PALETTE.mountainBg;
    ctx.fill();

    // 暖象牙太阳
    const sunR = Math.max(5, Math.min(w, h) * 0.13);
    ctx.beginPath();
    ctx.arc(x + w * 0.78, y + h * 0.28, sunR, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.sunCream;
    ctx.fill();

    // 后峰（坐标收在框内免 clip）
    ctx.beginPath();
    ctx.moveTo(x + w * 0.34, y + h);
    ctx.lineTo(x + w * 0.68, y + h * 0.36);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = PALETTE.mountainLight;
    ctx.fill();

    // 前峰（1:1 复刻原海报双峰交叠）
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.36, y + h * 0.22);
    ctx.lineTo(x + w * 0.76, y + h);
    ctx.closePath();
    ctx.fillStyle = PALETTE.mountainDark;
    ctx.fill();
  }

  function drawPillButton(x, y, w, h, text, active, isErr = false) {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, 4);
    ctx.fillStyle = isErr ? PALETTE.err : active ? PALETTE.headerPlum : "rgba(75,42,78,0.12)";
    ctx.fill();
    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = isErr || active ? PALETTE.white : PALETTE.subInk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();
  }

  function drawBadge(x, y, text, tone = "err") {
    ctx.save();
    ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(text).width + 14;
    const bh = 20;
    const bx = clamp(x - tw / 2, 6, cssW - tw - 6);
    const by = clamp(y - bh / 2, 6, cssH - bh - 6);
    roundRectPath(ctx, bx, by, tw, bh, 4);
    ctx.fillStyle = tone === "ok" ? PALETTE.ok : PALETTE.err;
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + tw / 2, by + bh / 2 + 0.5);
    ctx.restore();
  }

  function draw(t, dt, { still }) {
    const state = getState();
    const frame = getFrame();
    const scene = SCENES[state.scene] || SCENES.portal;

    // 缓动逼近目标尺寸
    const k = still || dragMode ? 1 : Math.min(1, dt * 14);
    const prevVw = animVw;
    const prevL = animLeft;
    const prevR = animRight;
    const prevH = animHeaderH;
    animVw += (frame.vw - animVw) * k;
    animLeft += (frame.effLeftW - animLeft) * k;
    animRight += (frame.effRightW - animRight) * k;
    animHeaderH += (frame.headerH - animHeaderH) * k;

    const moving =
      Math.abs(animVw - frame.vw) > 0.35 ||
      Math.abs(animLeft - frame.effLeftW) > 0.35 ||
      Math.abs(animRight - frame.effRightW) > 0.35 ||
      Math.abs(animHeaderH - frame.headerH) > 0.35;

    const animatingOverlay = state.showSourceOverlay && !still;
    const hasHighlight = Boolean(state.focusZone) && !still;

    if (!needsRedraw && !moving && !animatingOverlay && !hasHighlight && !dragMode) {
      return;
    }
    needsRedraw = false;

    ctx.save();
    ctx.scale(dpr, dpr);
    // 一次性贴入离屏缓存底纸+网格（1 次 drawImage 替代全屏几十条线）
    ctx.drawImage(bgCanvas, 0, 0, cssW, cssH);

    // 断点刻度底虚线（窄屏自适应放大基准，让模拟网页窗体在手机端也饱满清晰、绝不留大白格）
    const isNarrowCanvas = cssW < 520;
    const padX = isNarrowCanvas ? 14 : 30;
    const topMargin = 28;
    const bottomMargin = isNarrowCanvas ? 14 : 24;
    const maxDrawW = cssW - padX * 2;
    const maxDrawH = cssH - topMargin - bottomMargin;

    const refW = isNarrowCanvas ? Math.max(animVw * 1.06, 740) : 1360;
    const scaleX = maxDrawW / refW;
    const scaleY = maxDrawH / SIM_VIEWPORT_H;
    const scale = Math.min(scaleX, scaleY);
    hits.scale = scale;

    // 算出模拟窗体高度：窄屏时确保高度充分利用，绝不上下空荡
    const drawH = isNarrowCanvas ? Math.min(maxDrawH, Math.max(SIM_VIEWPORT_H * scale, maxDrawH * 0.88)) : SIM_VIEWPORT_H * scale;
    const frameY = topMargin + (maxDrawH - drawH) / 2;

    // 标出 940px（平板折右断点）与 640px（手机单列断点）参考线
    if (cssW >= 460) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(111, 61, 117, 0.2)";
      ctx.font = `400 10px "Space Mono", monospace`;
      ctx.fillStyle = "rgba(86, 42, 89, 0.52)";
      ctx.textAlign = "center";
      for (const bp of [640, 940]) {
        const bw = bp * scale;
        const lx = (cssW - bw) / 2;
        const rx = lx + bw;
        ctx.beginPath();
        ctx.moveTo(rx + 0.5, frameY - 4);
        ctx.lineTo(rx + 0.5, frameY + drawH + 10);
        ctx.stroke();
        ctx.fillText(`${bp}`, rx, frameY + drawH + 19);
      }
      ctx.restore();
    }

    // 实际模拟浏览器窗体位置（居中对称缩放）
    const drawW = Math.max(150, animVw * scale);
    const frameX = (cssW - drawW) / 2;
    hits.frameBox = { x: frameX, y: frameY, w: drawW, h: drawH };

    // 顶部标尺
    const modeNames = {
      "3col": "经典三列",
      "tablet-2col": "平板折右",
      "2col-left": "左导 + 主区",
      "2col-right": "主区 + 右辅",
      "1col-wide": "无翼单列",
      "mobile-stack": "手机单列流",
    };
    drawTopRuler(frameX, frameY, drawW, frame.vw, modeNames[frame.mode] || frame.mode, frame.passedCount);

    // 窗体轻量双层无模糊投影 + 外框（去掉昂贵 shadowBlur，软件渲染同样满帧）
    roundRectPath(ctx, frameX + 2, frameY + 5, drawW, drawH, 12);
    ctx.fillStyle = "rgba(45, 22, 48, 0.08)";
    ctx.fill();
    roundRectPath(ctx, frameX, frameY + 2, drawW, drawH, 12);
    ctx.fillStyle = "rgba(45, 22, 48, 0.06)";
    ctx.fill();
    roundRectPath(ctx, frameX, frameY, drawW, drawH, 12);
    ctx.fillStyle = PALETTE.frameBg;
    ctx.fill();

    ctx.save();

    // ---------------- 1. 深梅紫头部 HEADER ----------------
    const hdrH = Math.max(22, animHeaderH * scale);
    roundRectTop(ctx, frameX, frameY, drawW, hdrH, 12);
    ctx.fillStyle = PALETTE.headerPlum;
    ctx.fill();
    hits.zones.header = { x: frameX, y: frameY, w: drawW, h: hdrH };

    // 白圆徽 + 品牌字 + 顶栏导航
    const logoR = Math.max(5.5, Math.min(10, hdrH * 0.28));
    const logoX = frameX + 14 + logoR;
    const logoY = frameY + hdrH / 2;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.leftLilac;
    ctx.fill();

    ctx.fillStyle = PALETTE.white;
    ctx.font = `700 ${Math.max(10, Math.round(12 * Math.min(1, scale * 1.45)))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(scene.brand, logoX + logoR + 8, logoY + 0.5);

    // 右侧顶栏导航（足够宽时显示 4 项 + 放大镜，手机态显示汉堡图标）
    if (drawW > 300) {
      ctx.font = `500 ${Math.max(9.5, Math.round(11 * Math.min(1, scale * 1.4)))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "right";
      let nx = frameX + drawW - 30;
      // 放大镜
      ctx.strokeStyle = PALETTE.leftLilac;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(frameX + drawW - 18, logoY - 1, 4.5, 0, Math.PI * 2);
      ctx.moveTo(frameX + drawW - 14.5, logoY + 2.5);
      ctx.lineTo(frameX + drawW - 11.5, logoY + 5.5);
      ctx.stroke();

      for (let i = scene.navTop.length - 1; i >= 0; i--) {
        const item = scene.navTop[i];
        ctx.fillStyle = PALETTE.white;
        ctx.fillText(item, nx, logoY + 0.5);
        nx -= ctx.measureText(item).width + 16;
        if (i > 0 && nx > logoX + 100) {
          ctx.fillStyle = "rgba(232,218,230,0.45)";
          ctx.fillRect(nx + 7, logoY - 5, 1, 10);
        }
        if (nx < logoX + 115) break;
      }
    } else {
      // 手机态汉堡线
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = 1.6;
      const hx = frameX + drawW - 22;
      for (const dy of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.moveTo(hx, logoY + dy);
        ctx.lineTo(hx + 12, logoY + dy);
        ctx.stroke();
      }
    }

    // 页眉过厚警告线
    if (frame.headerH > 102 || frame.headerPct > 19) {
      ctx.strokeStyle = "#FF8A95";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(frameX + 2, frameY + 2, drawW - 4, hdrH - 4);
      ctx.setLineDash([]);
    }

    // ---------------- 2. 中部主体区 BODY ----------------
    const pad = Math.max(6, FRAME_PAD * scale);
    const gap = Math.max(5, COL_GAP * scale);
    const ftrH = Math.max(20, frame.footerH * scale);
    const bodyTop = frameY + hdrH + pad;
    const maxBodyH = drawH - hdrH - ftrH - pad * 2;
    const bodyW = drawW - pad * 2;

    // 计算当前页脚 Y：如果开启 equalSticky 贴底；否则跟内容自然底沿，下方露出悬空红斜线区
    const natMaxRatio = Math.min(1, frame.stageContentH / Math.max(1, frame.bodyBudgetH));
    const renderedBodyH = state.equalSticky ? maxBodyH : Math.max(84, maxBodyH * natMaxRatio);
    const footerY = frame.footerGap > 0 ? Math.min(frameY + drawH - ftrH, bodyTop + renderedBodyH + pad) : frameY + drawH - ftrH;

    // 悬空页脚下方空白区警报（免 clip 精准落在圆角内）
    const actualEmptyBottom = frameY + drawH - (footerY + ftrH);
    if (actualEmptyBottom > 4) {
      roundRectBottom(ctx, frameX, footerY + ftrH, drawW, actualEmptyBottom, 12);
      ctx.fillStyle = PALETTE.errSoft;
      ctx.fill();
      // 稀疏警示斜线（严格在盒内，免昂贵 clip）
      ctx.strokeStyle = "rgba(181, 43, 58, 0.24)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const topY = footerY + ftrH;
      const botY = frameY + drawH - 2;
      const hSpan = botY - topY;
      for (let sx = frameX + 10; sx < frameX + drawW - hSpan - 6; sx += 20) {
        ctx.moveTo(sx, topY);
        ctx.lineTo(sx + hSpan, botY);
      }
      ctx.stroke();
    }

    // 重置本帧轨道命中
    hits.railL = null;
    hits.railR = null;
    hits.toggleL = null;
    hits.toggleR = null;
    hits.zones.left = null;
    hits.zones.right = null;

    if (frame.stackedMobile) {
      // ======== 手机单列重排视图 ========
      const mH = renderedBodyH * 0.68;
      const auxH = Math.max(24, renderedBodyH - mH - gap);
      const mX = frameX + pad;
      const mY = bodyTop;
      hits.zones.main = { x: mX, y: mY, w: bodyW, h: mH };
      roundRectPath(ctx, mX, mY, bodyW, mH, 5);
      ctx.fillStyle = PALETTE.mainCream;
      ctx.fill();
      ctx.strokeStyle = PALETTE.mainBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `800 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(scene.mainTitle, mX + 10, mY + 8);
      drawMountainArt(mX + 10, mY + 28, bodyW - 20, Math.max(36, mH * 0.42));

      const mFont = `400 10px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PALETTE.mutedInk;
      ctx.font = mFont;
      const mLines = wrapCached(scene.id, mFont, scene.mainBody, bodyW - 20, 3);
      mLines.forEach((ln, idx) => {
        ctx.fillText(ln, mX + 10, mY + 34 + Math.max(36, mH * 0.42) + idx * 14);
      });

      // 下方双折翼胶囊：左导抽屉 + 右补模块
      const halfW = (bodyW - gap) / 2;
      const auxY = mY + mH + gap;
      hits.zones.left = { x: mX, y: auxY, w: halfW, h: auxH };
      hits.zones.right = { x: mX + halfW + gap, y: auxY, w: halfW, h: auxH };
      roundRectPath(ctx, mX, auxY, halfW, auxH, 4);
      ctx.fillStyle = PALETTE.leftLilac;
      ctx.fill();
      roundRectPath(ctx, mX + halfW + gap, auxY, halfW, auxH, 4);
      ctx.fillStyle = PALETTE.rightLilac;
      ctx.fill();
      ctx.fillStyle = PALETTE.subInk;
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("左栏已折为抽屉", mX + halfW / 2, auxY + auxH / 2);
      ctx.fillText("右栏下沉至文末", mX + halfW + gap + halfW / 2, auxY + auxH / 2);
    } else {
      // ======== 桌面 / 平板多列视图 ========
      const lW = frame.showLeftCol ? Math.max(26, animLeft * scale) : 0;
      const rW = frame.showRightCol ? Math.max(26, animRight * scale) : 0;
      const mW = Math.max(28, bodyW - lW - rW - (frame.showLeftCol ? gap : 0) - (frame.showRightCol ? gap : 0));

      const leftX = frameX + pad;
      const mainX = leftX + (frame.showLeftCol ? lW + gap : 0);
      const rightX = mainX + mW + (frame.showRightCol ? gap : 0);

      // 每列各自高度（未开等高锁时真实展现参差断层！）
      const hScale = renderedBodyH / Math.max(1, frame.stageContentH);
      const lH = frame.showLeftCol ? Math.max(54, Math.min(maxBodyH, frame.colHLeft * hScale)) : 0;
      const mH = Math.max(54, Math.min(maxBodyH, frame.colHMain * hScale));
      const rH = frame.showRightCol ? Math.max(54, Math.min(maxBodyH, frame.colHRight * hScale)) : 0;

      // ---------- 左侧栏 ----------
      if (frame.showLeftCol) {
        hits.zones.left = { x: leftX, y: bodyTop, w: lW, h: lH };
        roundRectPath(ctx, leftX, bodyTop, lW, lH, 4);
        ctx.fillStyle = PALETTE.leftLilac;
        ctx.fill();

        const leftTooThin = frame.effLeftW < 145;
        if (leftTooThin) {
          ctx.strokeStyle = PALETTE.err;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 左栏内容（安全边界绘制，免逐列 clip）
        const lp = Math.max(6, Math.min(12, lW * 0.1));
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `800 ${lW < 90 ? 10 : 12}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        if (lW >= 48) ctx.fillText(scene.leftTitle, leftX + lp, bodyTop + 10);

        if (lW >= 92) {
          ctx.fillStyle = PALETTE.mutedInk;
          ctx.font = `600 8.5px "Space Mono", monospace`;
          ctx.fillText(scene.leftSub, leftX + lp, bodyTop + 26);
        }

        // 底部紫方功能卡预留高度（防列表项擦边）
        const boxH = lH > 148 ? Math.max(24, Math.min(54, lH * 0.19)) : 0;
        const listBottomLimit = boxH > 0 ? bodyTop + lH - boxH - 22 : bodyTop + lH - 14;

        // 5 项圆点导航（1:1 承袭原海报紫圆点 + 文本/横条）
        const listY = bodyTop + 42;
        const itemStep = Math.max(15, Math.min(22, (listBottomLimit - listY) / 5));
        scene.leftItems.forEach((it, idx) => {
          const iy = listY + idx * itemStep;
          if (iy + 10 > listBottomLimit) return;
          ctx.beginPath();
          ctx.arc(leftX + lp + 4, iy + 5, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = idx === 0 ? PALETTE.headerPlum : PALETTE.leftDot;
          ctx.fill();
          if (lW >= 92) {
            ctx.fillStyle = idx === 0 ? PALETTE.ink : PALETTE.mutedInk;
            ctx.font = `${idx === 0 ? 700 : 400} 10px "Noto Sans SC", sans-serif`;
            ctx.fillText(it, leftX + lp + 13, iy);
          } else if (lW > 34) {
            ctx.fillStyle = PALETTE.textLine;
            ctx.fillRect(leftX + lp + 11, iy + 3, Math.max(8, lW - lp * 2 - 14), 4);
          }
        });

        // 底部紫方功能卡（原海报同款）
        if (boxH > 0) {
          roundRectPath(ctx, leftX + lp, bodyTop + lH - boxH - 10, lW - lp * 2, boxH, 4);
          ctx.fillStyle = PALETTE.leftCard;
          ctx.fill();
          if (lW >= 98) {
            ctx.fillStyle = "#FAF4F8";
            ctx.font = `600 9.5px "Noto Sans SC", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(scene.leftBox, leftX + lW / 2, bodyTop + lH - boxH / 2 - 10);
          }
        }

        // 顶角收起小钮
        if (lW >= 54) {
          const bw = 20;
          const bh = 18;
          const bx = leftX + lW - bw - 4;
          const by = bodyTop + 5;
          hits.toggleL = { x: bx, y: by, w: bw, h: bh };
          drawPillButton(ctx, bx, by, bw, bh, "×", hoverTarget === "toggle-l");
        }

        // 左栏右缘可拖轨
        const railX = leftX + lW + gap / 2;
        hits.railL = { x: railX - 10, y: bodyTop, w: 20, h: renderedBodyH };
        ctx.save();
        ctx.strokeStyle = dragMode === "rail-l" || hoverTarget === "rail-l" ? PALETTE.headerPlum : "rgba(75,42,78,0.28)";
        ctx.lineWidth = dragMode === "rail-l" || hoverTarget === "rail-l" ? 2.5 : 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(railX, bodyTop + 6);
        ctx.lineTo(railX, bodyTop + renderedBodyH - 6);
        ctx.stroke();
        ctx.setLineDash([]);
        // 中点胶囊把手
        roundRectPath(ctx, railX - 4, bodyTop + renderedBodyH / 2 - 14, 8, 28, 4);
        ctx.fillStyle = dragMode === "rail-l" || hoverTarget === "rail-l" ? PALETTE.headerPlum : "#B79BB8";
        ctx.fill();
        ctx.restore();
      } else {
        // 左侧栏已收起：在左沿放一个「+ 左栏」小胶囊可一键重新展开
        const bx = frameX + pad;
        const by = bodyTop + 6;
        hits.toggleL = { x: bx, y: by, w: 46, h: 19 };
        drawPillButton(ctx, bx, by, 46, 19, "+ 左栏", hoverTarget === "toggle-l");
      }

      // ---------- 中央主内容区 MAIN ----------
      hits.zones.main = { x: mainX, y: bodyTop, w: mW, h: mH };
      roundRectPath(ctx, mainX, bodyTop, mW, mH, 4);
      ctx.fillStyle = PALETTE.mainCream;
      ctx.fill();
      const mainBad = frame.issues.some((i) => i.id === "main-squeezed" || i.id === "rigid-narrow" || i.id === "main-overwide");
      ctx.strokeStyle = mainBad ? PALETTE.err : PALETTE.mainBorder;
      ctx.lineWidth = mainBad ? 1.6 : 1;
      if (mainBad) ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      const mp = Math.max(8, Math.min(18, mW * 0.055));
      const contentStartY = !frame.showLeftCol ? bodyTop + 30 : bodyTop + 10;

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `800 ${mW < 180 ? 11 : 13.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      if (mW >= 62) ctx.fillText(scene.mainTitle, mainX + mp, contentStartY);

      // 实测主区宽与字/行角标（留足安全间距绝不碰标题）
      if (mW > 248) {
        const statText = `${frame.effMainW}px · ${frame.mainPct}% · 约${frame.charsPerLine}字/行`;
        ctx.font = `700 9.5px "Space Mono", "Noto Sans SC", monospace`;
        ctx.fillStyle = mainBad ? PALETTE.err : PALETTE.ok;
        ctx.textAlign = "right";
        ctx.fillText(statText, mainX + mW - mp, contentStartY + 2);
      } else if (mW > 168) {
        ctx.font = `700 9px "Space Mono", monospace`;
        ctx.fillStyle = mainBad ? PALETTE.err : PALETTE.ok;
        ctx.textAlign = "right";
        ctx.fillText(`${frame.effMainW}px · ${frame.mainPct}%`, mainX + mW - mp, contentStartY + 2);
      }

      // 藕荷山日封面图（1:1 承袭原海报）
      const artY = contentStartY + 22;
      const artH = Math.max(36, Math.min(110, mH * 0.34));
      if (mW - mp * 2 >= 20) drawMountainArt(mainX + mp, artY, mW - mp * 2, artH);

      // 真实折行中文正文（带缓存，软件渲染 0 逐字开销）
      const textY = artY + artH + 10;
      const bodyFont = `400 ${mW < 170 ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PALETTE.mutedInk;
      ctx.font = bodyFont;
      ctx.textAlign = "left";
      const availForText = mH - (textY - bodyTop) - 46;
      const maxTextLines = Math.max(2, Math.min(6, Math.floor(availForText / 14)));
      const bodyLines = mW > 56 ? wrapCached(scene.id, bodyFont, scene.mainBody, mW - mp * 2, maxTextLines) : [];
      bodyLines.forEach((ln, idx) => {
        if (textY + idx * 14 + 12 <= bodyTop + mH - 6) {
          ctx.fillText(ln, mainX + mp, textY + idx * 14);
        }
      });

      // 底部三小卡（1:1 承袭原海报主内容区底部的三张圆点淡紫卡）
      const cardsY = bodyTop + mH - 46;
      if (cardsY > textY + bodyLines.length * 14 + 4 && mW > 130) {
        const cardGap = 6;
        const cardW = (mW - mp * 2 - cardGap * 2) / 3;
        scene.mainCards.forEach((c, idx) => {
          const cx = mainX + mp + idx * (cardW + cardGap);
          roundRectPath(ctx, cx, cardsY, cardW, 36, 3);
          ctx.fillStyle = PALETTE.cardBg;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + 8, cardsY + 10, 3, 0, Math.PI * 2);
          ctx.fillStyle = PALETTE.leftDot;
          ctx.fill();
          if (cardW > 54) {
            ctx.fillStyle = PALETTE.ink;
            ctx.font = `700 9px "Noto Sans SC", sans-serif`;
            ctx.fillText(c.title, cx + 15, cardsY + 6);
            ctx.fillStyle = PALETTE.textLine;
            ctx.fillRect(cx + 6, cardsY + 21, Math.max(8, cardW - 12), 3);
            ctx.fillRect(cx + 6, cardsY + 27, Math.max(6, (cardW - 12) * 0.68), 3);
          }
        });
      }

      // 主区未等高时下方红色断崖标注
      if (!state.equalSticky && renderedBodyH - mH > 10) {
        ctx.save();
        ctx.fillStyle = PALETTE.errSoft;
        ctx.fillRect(mainX, bodyTop + mH + 2, mW, renderedBodyH - mH - 2);
        ctx.strokeStyle = "rgba(181, 43, 58, 0.55)";
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(mainX + 0.5, bodyTop + mH + 2.5, mW - 1, renderedBodyH - mH - 3);
        ctx.restore();
      }

      // ---------- 右侧栏 ----------
      if (frame.showRightCol) {
        hits.zones.right = { x: rightX, y: bodyTop, w: rW, h: rH };
        roundRectPath(ctx, rightX, bodyTop, rW, rH, 4);
        ctx.fillStyle = PALETTE.rightLilac;
        ctx.fill();

        const rightTooThin = frame.effRightW < 145;
        if (rightTooThin) {
          ctx.strokeStyle = PALETTE.err;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const rp = Math.max(6, Math.min(12, rW * 0.1));
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `800 ${rW < 90 ? 10 : 12}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        if (rW >= 48) ctx.fillText(scene.rightTitle, rightX + rp, bodyTop + 10);

        if (rW >= 92) {
          ctx.fillStyle = PALETTE.mutedInk;
          ctx.font = `600 8.5px "Space Mono", monospace`;
          ctx.fillText(scene.rightSub, rightX + rp, bodyTop + 26);
        }

        // 三张浅米卡 + 紫方块缩略（1:1 承袭原海报右侧栏）
        const rListY = bodyTop + 42;
        const cardH = Math.max(22, Math.min(34, (rH - 102) / 3));
        scene.rightItems.forEach((it, idx) => {
          const cy = rListY + idx * (cardH + 7);
          if (cy + cardH > bodyTop + rH - 42) return;
          roundRectPath(ctx, rightX + rp, cy, rW - rp * 2, cardH, 3);
          ctx.fillStyle = PALETTE.mainCream;
          ctx.fill();
          const sq = Math.max(12, cardH - 10);
          ctx.fillStyle = PALETTE.rightThumb;
          ctx.fillRect(rightX + rp + 5, cy + 5, sq, sq);
          if (rW >= 98) {
            ctx.fillStyle = PALETTE.ink;
            ctx.font = `700 9.5px "Noto Sans SC", sans-serif`;
            ctx.fillText(it.title, rightX + rp + sq + 10, cy + 6);
            ctx.fillStyle = PALETTE.textLine;
            ctx.fillRect(rightX + rp + sq + 10, cy + 20, Math.max(8, rW - rp * 2 - sq - 16), 3);
          }
        });

        // 底部虚线提示框（原海报「提示/广告或重要补充信息」）
        const noteH = Math.max(28, Math.min(46, rH * 0.18));
        if (rH > 130) {
          const ny = bodyTop + rH - noteH - 10;
          ctx.strokeStyle = PALETTE.leftDot;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(rightX + rp + 0.5, ny + 0.5, rW - rp * 2 - 1, noteH - 1);
          ctx.setLineDash([]);
          if (rW >= 88) {
            ctx.fillStyle = PALETTE.mutedInk;
            ctx.font = `500 9px "Noto Sans SC", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("提示 / 补充信息", rightX + rW / 2, ny + noteH / 2);
          }
        }

        // 顶角收起钮
        if (rW >= 54) {
          const bw = 20;
          const bh = 18;
          const bx = rightX + rW - bw - 4;
          const by = bodyTop + 5;
          hits.toggleR = { x: bx, y: by, w: bw, h: bh };
          drawPillButton(ctx, bx, by, bw, bh, "×", hoverTarget === "toggle-r");
        }

        // 右栏左缘可拖轨
        const railX = rightX - gap / 2;
        hits.railR = { x: railX - 10, y: bodyTop, w: 20, h: renderedBodyH };
        ctx.save();
        ctx.strokeStyle = dragMode === "rail-r" || hoverTarget === "rail-r" ? PALETTE.headerPlum : "rgba(75,42,78,0.28)";
        ctx.lineWidth = dragMode === "rail-r" || hoverTarget === "rail-r" ? 2.5 : 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(railX, bodyTop + 6);
        ctx.lineTo(railX, bodyTop + renderedBodyH - 6);
        ctx.stroke();
        ctx.setLineDash([]);
        roundRectPath(ctx, railX - 4, bodyTop + renderedBodyH / 2 - 14, 8, 28, 4);
        ctx.fillStyle = dragMode === "rail-r" || hoverTarget === "rail-r" ? PALETTE.headerPlum : "#B79BB8";
        ctx.fill();
        ctx.restore();

        // 右栏参差阴影
        if (!state.equalSticky && renderedBodyH - rH > 10) {
          ctx.save();
          ctx.fillStyle = PALETTE.errSoft;
          ctx.fillRect(rightX, bodyTop + rH + 2, rW, renderedBodyH - rH - 2);
          ctx.restore();
        }
      } else {
        // 右侧栏已收起（手工隐藏或平板自动折翼）
        const bw = frame.autoFoldedRight ? 74 : 48;
        const bx = frameX + drawW - pad - bw;
        const by = bodyTop + 6;
        hits.toggleR = { x: bx, y: by, w: bw, h: 19 };
        drawPillButton(
          ctx,
          bx,
          by,
          bw,
          19,
          frame.autoFoldedRight ? "平板已折右" : "+ 右栏",
          hoverTarget === "toggle-r"
        );
      }
    }

    // ---------------- 3. 深梅紫底部 FOOTER ----------------
    const ftrRound = actualEmptyBottom > 4 ? 0 : 12;
    if (ftrRound > 0) roundRectBottom(ctx, frameX, footerY, drawW, ftrH, 12);
    else {
      ctx.beginPath();
      ctx.rect(frameX, footerY, drawW, ftrH);
    }
    ctx.fillStyle = PALETTE.footerPlum;
    ctx.fill();
    hits.zones.footer = { x: frameX, y: footerY, w: drawW, h: ftrH };

    const fy = footerY + ftrH / 2;
    ctx.beginPath();
    ctx.arc(frameX + 18, fy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.leftLilac;
    ctx.fill();

    ctx.fillStyle = PALETTE.white;
    ctx.font = `400 9.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(drawW > 320 ? scene.footerBrand : "© 品牌版权", frameX + 29, fy + 0.5);

    if (drawW > 360) {
      // 四枚圆点社媒图标（1:1 承袭原海报）
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(frameX + drawW - 18 - i * 16, fy, 5, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.leftLilac;
        ctx.fill();
      }
    }

    // ---------------- 4. 聚焦区柔和外框高亮 ----------------
    if (state.focusZone) {
      let fRect = null;
      if (state.focusZone === "body") {
        fRect = { x: frameX + pad - 2, y: bodyTop - 2, w: bodyW + 4, h: renderedBodyH + 4 };
      } else {
        fRect = hits.zones[state.focusZone];
      }
      if (fRect) {
        const pulse = still ? 1 : 0.72 + 0.28 * Math.sin(t * 5);
        ctx.save();
        ctx.strokeStyle = `rgba(111, 61, 117, ${pulse})`;
        ctx.lineWidth = 2.5;
        roundRectPath(ctx, fRect.x, fRect.y, fRect.w, fRect.h, 6);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ---------------- 5. DOM 源码读取流透视层（Space 开关） ----------------
    if (state.showSourceOverlay) {
      const pts = [];
      for (const item of frame.domSequence) {
        const z = hits.zones[item.zone];
        if (!z) continue;
        pts.push({
          step: item.step,
          name: item.name,
          x: z.x + z.w / 2,
          y: z.y + z.h / 2,
          isMain: item.zone === "main",
          isBadEarlyNav: item.zone === "left" && state.sourceOrder !== "main-first",
        });
      }
      if (pts.length >= 2) {
        ctx.save();
        // 半透明遮罩让阅读流更清晰
        ctx.fillStyle = "rgba(45, 22, 48, 0.22)";
        ctx.fillRect(frameX, frameY, drawW, drawH);

        ctx.strokeStyle = state.sourceOrder === "main-first" ? "#7FE0BE" : "#FF8A95";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = still ? 0 : -t * 36;
        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.setLineDash([]);

        // 光点顺路径巡游
        if (!still) {
          const totalSeg = pts.length - 1;
          const prog = ((t * 0.55) % 1) * totalSeg;
          const segIdx = Math.min(totalSeg - 1, Math.floor(prog));
          const segT = prog - segIdx;
          const px = pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * segT;
          const py = pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * segT;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFDF8";
          ctx.fill();
        }

        // 序号圆章
        pts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = p.isBadEarlyNav ? PALETTE.err : p.isMain ? PALETTE.ok : PALETTE.headerPlum;
          ctx.fill();
          ctx.strokeStyle = "#FFFDF8";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `700 13px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.step, p.x, p.y + 0.5);
        });
        ctx.restore();
      }
    }

    ctx.restore(); // end clip

    // 窗体深梅紫细外框线
    roundRectPath(ctx, frameX, frameY, drawW, drawH, 12);
    ctx.strokeStyle = frame.passedCount === 4 ? "rgba(29, 107, 82, 0.5)" : "rgba(75, 42, 78, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ---------------- 6. 左右视口伸缩外挂把手（拖拽即缩放 360px ↔ 1360px） ----------------
    const handleH = 44;
    const handleY = frameY + drawH / 2 - handleH / 2;
    hits.resizeL = { x: frameX - 18, y: handleY - 12, w: 28, h: handleH + 24 };
    hits.resizeR = { x: frameX + drawW - 10, y: handleY - 12, w: 28, h: handleH + 24 };

    for (const [side, hx] of [
      ["resize-l", frameX - 6],
      ["resize-r", frameX + drawW - 6],
    ]) {
      const hot = dragMode === "viewport" || hoverTarget === side;
      roundRectPath(ctx, hx, handleY, 12, handleH, 6);
      ctx.fillStyle = hot ? PALETTE.headerPlum : "#7B5380";
      ctx.fill();
      ctx.strokeStyle = "#FAF2E9";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 两条微握纹
      ctx.strokeStyle = "#FAF2E9";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx + 4.5, handleY + 14);
      ctx.lineTo(hx + 4.5, handleY + handleH - 14);
      ctx.moveTo(hx + 7.5, handleY + 14);
      ctx.lineTo(hx + 7.5, handleY + handleH - 14);
      ctx.stroke();
    }

    // ---------------- 7. 就地单真源错态浮标（直指病灶位置） ----------------
    if (!state.showSourceOverlay) {
      if (frame.footerGap > 18) {
        drawBadge(frameX + drawW / 2, footerY + ftrH + Math.max(14, actualEmptyBottom / 2), `× 页脚悬空 ${frame.footerGap}px`, "err");
      } else if (frame.heightGap > 18 && hits.zones.main) {
        drawBadge(hits.zones.main.x + hits.zones.main.w / 2, bodyTop + renderedBodyH - 14, `× 三列底沿参差 ${frame.heightGap}px`, "err");
      }
      if (frame.issues.some((i) => i.id === "rigid-narrow" || i.id === "main-squeezed") && hits.zones.main) {
        drawBadge(
          hits.zones.main.x + hits.zones.main.w / 2,
          hits.zones.main.y + Math.min(hits.zones.main.h * 0.48, 66),
          isNarrowCanvas
            ? `× 夹心 ${frame.effMainW}px`
            : `× 夹心 ${frame.effMainW}px（约${frame.charsPerLine}字/行）`,
          "err"
        );
      } else if (frame.issues.some((i) => i.id === "main-overwide") && hits.zones.main) {
        drawBadge(
          hits.zones.main.x + hits.zones.main.w / 2,
          hits.zones.main.y + Math.min(hits.zones.main.h * 0.48, 66),
          `× 无翼爆宽 ${frame.charsPerLine}字/行`,
          "err"
        );
      } else if (frame.issues.some((i) => i.id === "sidebar-crushed")) {
        const z = frame.effLeftW < 145 ? hits.zones.left : hits.zones.right;
        if (z) drawBadge(z.x + z.w / 2, z.y + z.h / 2, `× 侧栏过窄折字`, "err");
      } else if (frame.issues.some((i) => i.id === "bloated-header")) {
        drawBadge(frameX + drawW / 2, frameY + hdrH - 12, `× 页眉过厚 ${frame.headerH}px`, "err");
      }
    }

    ctx.restore();

    // 若数值仍在缓动，继续请求重绘
    if (moving && (prevVw !== animVw || prevL !== animLeft || prevR !== animRight || prevH !== animHeaderH)) {
      needsRedraw = true;
    }
  }

  const ctrl = loop(canvas, draw);

  function inBox(x, y, box) {
    return box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
  }

  function localPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function detectTarget(x, y) {
    if (inBox(x, y, hits.toggleL)) return "toggle-l";
    if (inBox(x, y, hits.toggleR)) return "toggle-r";
    if (inBox(x, y, hits.railL)) return "rail-l";
    if (inBox(x, y, hits.railR)) return "rail-r";
    if (inBox(x, y, hits.resizeR)) return "resize-r";
    if (inBox(x, y, hits.resizeL)) return "resize-l";
    return null;
  }

  function startDrag(clientX, clientY, isTouch = false) {
    const pt = localPoint(clientX, clientY);
    const hit = detectTarget(pt.x, pt.y);
    const st = getState();
    dragStartX = pt.x;
    dragMoved = false;
    lastPointerDownTime = performance.now();

    if (hit === "toggle-l" || hit === "toggle-r") {
      dragMode = hit;
      return;
    }
    if (hit === "rail-l") {
      dragMode = "rail-l";
      dragStartVal = st.leftW;
    } else if (hit === "rail-r") {
      dragMode = "rail-r";
      dragStartVal = st.rightW;
    } else if (hit === "resize-l") {
      dragMode = "viewport-l";
      dragStartVal = st.viewportW;
    } else {
      // 画布主体与右把手：横向拖动即连续伸缩模拟视口宽度（360px ↔ 1360px）
      dragMode = isTouch ? "viewport-pan" : "viewport-r";
      dragStartVal = st.viewportW;
    }
  }

  function moveDrag(clientX, clientY) {
    const pt = localPoint(clientX, clientY);
    if (!dragMode) {
      const h = detectTarget(pt.x, pt.y);
      if (h !== hoverTarget) {
        hoverTarget = h;
        canvas.style.cursor =
          h === "toggle-l" || h === "toggle-r"
            ? "pointer"
            : h === "rail-l" || h === "rail-r" || h === "resize-l" || h === "resize-r"
              ? "ew-resize"
              : "ew-resize";
        needsRedraw = true;
        ctrl.draw();
      }
      return;
    }

    const dx = pt.x - dragStartX;
    if (Math.abs(dx) > 3) dragMoved = true;
    const sc = Math.max(0.25, hits.scale);

    if (dragMode === "rail-l") {
      const next = Math.round(clamp(dragStartVal + dx / sc, 100, 340));
      onPatch({ leftW: next }, true);
    } else if (dragMode === "rail-r") {
      const next = Math.round(clamp(dragStartVal - dx / sc, 100, 340));
      onPatch({ rightW: next }, true);
    } else if (dragMode === "viewport-l") {
      const next = Math.round(clamp(dragStartVal - (dx * 2) / sc, 360, 1360));
      onPatch({ viewportW: next }, true);
    } else if (dragMode === "viewport-r" || dragMode === "viewport-pan") {
      // 灵敏而跟手的视口宽度推拉（对 perf 触屏左右拖也确保每帧有明显像素变化！）
      const mult = dragMode === "viewport-pan" ? 2.4 : 2.0;
      let next = Math.round(clamp(dragStartVal + (dx * mult) / sc, 360, 1360));
      // 靠近 1280 / 940 / 820 / 640 / 390 时轻吸附（仅非连续高速拖时）
      for (const snap of [390, 640, 820, 940, 1280]) {
        if (Math.abs(next - snap) <= 7) {
          next = snap;
          break;
        }
      }
      onPatch({ viewportW: next }, true);
    }
  }

  function endDrag(clientX, clientY) {
    const mode = dragMode;
    dragMode = null;
    if (!mode) return;
    if (dragMoved) {
      onPatch({}, false, true);
      return;
    }
    if (!dragMoved && performance.now() - lastPointerDownTime < 400) {
      const st = getState();
      const frame = getFrame();
      if (mode === "toggle-l") {
        onPatch({ leftOpen: !st.leftOpen });
        return;
      }
      if (mode === "toggle-r") {
        if (frame.autoFoldedRight) {
          onPatch({ viewportW: 1180, rightOpen: true });
        } else {
          onPatch({ rightOpen: !st.rightOpen });
        }
        return;
      }
      // 轻点五区主体，高亮对应结构层
      if (clientX != null && clientY != null) {
        const pt = localPoint(clientX, clientY);
        for (const z of ["header", "left", "main", "right", "footer"]) {
          if (inBox(pt.x, pt.y, hits.zones[z])) {
            onHoverZone?.(z === st.focusZone ? null : z);
            return;
          }
        }
      }
    }
  }

  // Pointer Events（桌面鼠标 + 现代触控）
  let activePointerId = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触控交由下方专用 touch 处理，防止双触发且保证 perf 触屏拖 100% 灵敏
    activePointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    startDrag(e.clientX, e.clientY, false);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    moveDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (activePointerId === e.pointerId) {
      activePointerId = null;
      endDrag(e.clientX, e.clientY);
    }
  });
  canvas.addEventListener("pointercancel", () => {
    activePointerId = null;
    dragMode = null;
  });

  // 专用 Touch 事件：竖向滑动放行给页面滚动，横向滑动立即接管推拉圣杯视口
  let touchStartX = 0;
  let touchStartY = 0;
  let touchAxis = null; // null | "h" | "v"

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      touchStartX = t0.clientX;
      touchStartY = t0.clientY;
      touchAxis = null;
      startDrag(t0.clientX, t0.clientY, true);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const dx = Math.abs(t0.clientX - touchStartX);
      const dy = Math.abs(t0.clientY - touchStartY);
      if (!touchAxis && (dx > 4 || dy > 4)) {
        touchAxis = dx >= dy ? "h" : "v";
      }
      if (touchAxis === "v") {
        dragMode = null;
        return; // 让浏览器正常竖向滚屏
      }
      if (touchAxis === "h") {
        if (e.cancelable) e.preventDefault();
        moveDrag(t0.clientX, t0.clientY);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      const t0 = e.changedTouches[0];
      endDrag(t0 ? t0.clientX : null, t0 ? t0.clientY : null);
      touchAxis = null;
    },
    { passive: true }
  );

  return {
    notify(immediate = false) {
      needsRedraw = true;
      if (immediate || reducedMotion.matches) ctrl.draw();
    },
    destroy() {
      ro.disconnect();
    },
  };
}
