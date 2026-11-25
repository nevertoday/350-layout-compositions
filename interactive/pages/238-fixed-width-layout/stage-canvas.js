// 238 固定宽度布局 — 活体建筑制图台 2D Canvas 渲染器
// 上部 72%：当前视口下的原海报风格固定容器画框、橘色斜纹留白带、标尺与实时内容排版
// 下部 28%：375 / 768 / 1024 / 1440 / 1920px 五屏同步压测剖面带（可点击切屏）

import { pixelRatio } from "../../lib/stage.js";
import { WIDTH_MIN, WIDTH_MAX, VIEWPORT_PRESETS, computeViewportLayout } from "./model.js";

const COL = {
  paper: "#FAF5EA",
  cream: "#F6EFE2",
  sand: "#EFE5D3",
  navy: "#08274E",
  navySub: "#102848",
  navySoft: "rgba(8, 39, 78, 0.14)",
  navyGrid: "rgba(8, 39, 78, 0.06)",
  ink: "#0F0F0D",
  inkSoft: "#3B4656",
  orange: "#E7561C",
  orangeFill: "#C9430E",
  orangeText: "#B3380A",
  orangeHatch: "#E59D7D",
  orangeWash: "rgba(231, 86, 28, 0.11)",
  teal: "#0B6B56",
  tealWash: "rgba(11, 107, 86, 0.14)",
  crimson: "#B91C1C",
  crimsonWash: "rgba(185, 28, 28, 0.14)",
  crimsonStripe: "rgba(185, 28, 28, 0.34)",
  line: "#CFC4B1",
};

function easeOutCubic(x) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
}

function makeHatchPattern(ctx, strokeColor, bgColor, step = 10) {
  const p = document.createElement("canvas");
  p.width = step;
  p.height = step;
  const pc = p.getContext("2d");
  if (bgColor) {
    pc.fillStyle = bgColor;
    pc.fillRect(0, 0, step, step);
  }
  pc.strokeStyle = strokeColor;
  pc.lineWidth = 1;
  pc.beginPath();
  pc.moveTo(-1, step + 1);
  pc.lineTo(step + 1, -1);
  pc.moveTo(-1, 1);
  pc.lineTo(1, -1);
  pc.moveTo(step - 1, step + 1);
  pc.lineTo(step + 1, step - 1);
  pc.stroke();
  return ctx.createPattern(p, "repeat");
}

function drawDoubleArrow(ctx, x1, x2, y, color, head = 5) {
  if (x2 - x1 < 8) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x1 + 1, y);
  ctx.lineTo(x2 - 1, y);
  ctx.stroke();
  // Left head
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 + head, y - head * 0.7);
  ctx.lineTo(x1 + head, y + head * 0.7);
  ctx.closePath();
  ctx.fill();
  // Right head
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - head, y - head * 0.7);
  ctx.lineTo(x2 - head, y + head * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPill(ctx, cx, cy, w, h, bg, fg, text, font) {
  const r = h / 2;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.save();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, cy, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, cy, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

export function createHeroRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const patOrange = makeHatchPattern(ctx, COL.orangeHatch, COL.orangeWash, 9);
  const patCrimsonLight = makeHatchPattern(ctx, COL.crimsonStripe, "rgba(185, 28, 28, 0.06)", 9);
  const patCrimsonHeavy = makeHatchPattern(ctx, COL.crimsonStripe, "rgba(185, 28, 28, 0.22)", 8);

  const hitState = {
    stripTiles: [],
    stageRect: { x: 0, y: 0, w: 0, h: 0 },
    vpRect: { x: 0, y: 0, w: 0, h: 0 },
    vpScale: 1,
    boxX: 0,
    boxW: 0,
  };

  let smoothWidth = null;
  let introStart = null;
  let dirty = true;
  let lastSizeKey = "";
  let bgCache = null;

  function ensureBgCache(w, h, dpr, compact) {
    const key = `${w}x${h}@${dpr}`;
    if (key === lastSizeKey && bgCache) return;
    lastSizeKey = key;
    bgCache = document.createElement("canvas");
    bgCache.width = Math.round(w * dpr);
    bgCache.height = Math.round(h * dpr);
    const bctx = bgCache.getContext("2d");
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.fillStyle = COL.paper;
    bctx.fillRect(0, 0, w, h);
    const gridStep = compact ? 22 : 24;
    bctx.strokeStyle = COL.navyGrid;
    bctx.lineWidth = 1;
    bctx.beginPath();
    for (let gx = gridStep; gx < w; gx += gridStep) {
      bctx.moveTo(gx + 0.5, 0);
      bctx.lineTo(gx + 0.5, h);
    }
    for (let gy = gridStep; gy < h; gy += gridStep) {
      bctx.moveTo(0, gy + 0.5);
      bctx.lineTo(w, gy + 0.5);
    }
    bctx.stroke();
  }

  function resizeIfNeeded() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    // 手机窄屏限制像素比 ≤ 1.5（兼顾清晰度与低端设备软件渲染帧率）
    const dpr = pixelRatio(w < 520 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ensureBgCache(w, h, dpr, w < 520);
    return { w, h };
  }

  function markDirty() {
    dirty = true;
  }

  function render(state, report, t, dt, { still = false, dragging = false } = {}) {
    const { w, h } = resizeIfNeeded();
    const compact = w < 520;
    const landscapeShort = h < 310;

    if (introStart === null) introStart = t;
    const rawIntro = still ? 1 : (t - introStart) / 0.85;
    const introDone = rawIntro >= 1;
    const intro = introDone ? 1 : easeOutCubic(rawIntro);

    if (smoothWidth === null || still || dragging) {
      smoothWidth = state.containerWidth;
    } else if (Math.abs(smoothWidth - state.containerWidth) > 0.35) {
      const k = 1 - Math.exp(-Math.max(0.016, dt || 0.016) * 18);
      smoothWidth += (state.containerWidth - smoothWidth) * k;
      if (Math.abs(smoothWidth - state.containerWidth) <= 0.35) smoothWidth = state.containerWidth;
      dirty = true;
    }

    // 若开场已完成、宽幅已稳定且无状态变更，则跳过冗余重画以省电并保持高帧率
    if (!still && introDone && !dirty && !dragging) {
      return false;
    }
    dirty = !introDone;

    const animState = { ...state, containerWidth: Math.round(smoothWidth) };
    const cur = computeViewportLayout(animState, state.viewport);

    // Paint cached drafting paper & millimeter grid in 1 draw call
    ctx.drawImage(bgCache, 0, 0, w, h);

    // Layout geometry splits: top bar ruler + upper zoom stage + lower 5-screen cross-section strip
    const topPad = compact ? 26 : 28;
    const stripH = landscapeShort ? 74 : compact ? 90 : 90;
    const stageTop = topPad;
    const stageH = Math.max(130, h - topPad - stripH - 10);
    const sidePad = compact ? 12 : 24;
    const stageW = w - sidePad * 2;
    hitState.stageRect = { x: sidePad, y: stageTop, w: stageW, h: stageH };

    // Determine coordinate mapping for the upper simulated viewport
    // When overflowing, reserve room on the right to literally show the clipped overhang bursting out!
    const totalNeededPx = Math.max(cur.vpWidth, cur.boxW);
    const maxScale = (stageW - (compact ? 12 : 36)) / Math.max(375, totalNeededPx);
    // Keep desktop 1440 / 1920 comfortably filling the drafting board, and mobile 375 nicely readable
    const vpPixelW = Math.round(cur.vpWidth * maxScale);
    const totalDrawW = Math.round(totalNeededPx * maxScale);
    const vpX = Math.round(sidePad + (stageW - totalDrawW) / 2);
    const vpY = Math.round(stageTop + (landscapeShort ? 10 : 14));
    const vpH = Math.round(stageH - (landscapeShort ? 16 : 24));

    hitState.vpRect = { x: vpX, y: vpY, w: vpPixelW, h: vpH };
    hitState.vpScale = maxScale;

    // 1. Top scale ruler aligned with viewport coordinate system
    drawTopRuler(ctx, vpX, vpPixelW, totalDrawW, maxScale, cur.vpWidth, totalNeededPx, topPad, compact);

    // 2. Simulated viewport screen box
    ctx.save();
    ctx.fillStyle = COL.cream;
    ctx.fillRect(vpX, vpY, vpPixelW, vpH);

    // Compute box coordinates in canvas pixels
    const boxDrawW = Math.max(24, cur.boxW * maxScale);
    const leftMarginDraw = cur.leftMargin * maxScale;
    const rightMarginDraw = cur.rightMargin * maxScale;
    const boxX = vpX + leftMarginDraw;
    const boxY = vpY + (landscapeShort ? 18 : compact ? 26 : 22);
    const scrollbarReserve = cur.overflowPx > 0 ? 18 : 8;
    const boxH = Math.max(60, vpH - (landscapeShort ? 26 : compact ? 38 : 34) - scrollbarReserve);

    hitState.boxX = boxX;
    hitState.boxW = boxDrawW;

    // 2a. Left & right orange hatched margins (左右留白)
    if (cur.overflowPx === 0) {
      const skewBad = cur.skewPx > 2;
      ctx.fillStyle = skewBad ? patCrimsonLight : patOrange;
      if (leftMarginDraw > 2) {
        ctx.fillRect(vpX + 1, vpY + 1, leftMarginDraw - 1, vpH - 2);
      }
      if (rightMarginDraw > 2) {
        ctx.fillRect(boxX + boxDrawW, vpY + 1, rightMarginDraw - 1, vpH - 2);
      }

      // Vertical dashed container rails running full viewport height (238 poster motif!)
      const railH = vpH * intro;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = skewBad ? COL.crimson : COL.navySub;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(boxX + 0.5, vpY);
      ctx.lineTo(boxX + 0.5, vpY + railH);
      ctx.moveTo(boxX + boxDrawW - 0.5, vpY);
      ctx.lineTo(boxX + boxDrawW - 0.5, vpY + railH);
      ctx.stroke();
      ctx.restore();

      // Dimension arrows & pixel labels inside left/right margins
      const midY = boxY + boxH * 0.52;
      const arrowCol = skewBad ? COL.crimson : COL.orangeText;
      if (leftMarginDraw >= 26) {
        drawDoubleArrow(ctx, vpX + 4, boxX - 4, midY, arrowCol, 4.5);
        if (leftMarginDraw >= 62) {
          drawMarginChip(ctx, vpX + leftMarginDraw / 2, midY - 14, `左 ${cur.leftMargin}px`, arrowCol);
        }
      }
      if (rightMarginDraw >= 26) {
        drawDoubleArrow(ctx, boxX + boxDrawW + 4, vpX + vpPixelW - 4, midY, arrowCol, 4.5);
        if (rightMarginDraw >= 62) {
          drawMarginChip(ctx, boxX + boxDrawW + rightMarginDraw / 2, midY - 14, `右 ${cur.rightMargin}px`, arrowCol);
        }
      }
    }

    // 2b. Vertical center axis line of viewport (shows off-center skew immediately!)
    const vpCenterX = vpX + vpPixelW / 2;
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = state.align === "center" ? "rgba(11, 107, 86, 0.35)" : "rgba(185, 28, 28, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vpCenterX + 0.5, vpY + 2);
    ctx.lineTo(vpCenterX + 0.5, vpY + vpH - 2);
    ctx.stroke();
    ctx.restore();

    // 2c. Outer viewport boundary border
    ctx.strokeStyle = COL.navy;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(vpX + 0.5, vpY + 0.5, vpPixelW - 1, vpH - 1);

    // 2d. Fixed Container Browser Window (238 poster centerpiece!)
    const borderCol = cur.overflowPx > 0 ? COL.crimson : report.severity === "pass" ? COL.teal : COL.navy;
    ctx.fillStyle = COL.paper;
    ctx.fillRect(boxX, boxY, boxDrawW, boxH);

    // Inner safe padding X-ray bands (padding-inline)
    const padDraw = cur.innerPad * maxScale;
    if (padDraw >= 2) {
      const padTooBig = state.gutter > 44;
      const padFill = padTooBig ? COL.crimsonWash : COL.tealWash;
      ctx.fillStyle = padFill;
      ctx.fillRect(boxX + 1, boxY + 22, padDraw, boxH - 23);
      ctx.fillRect(boxX + boxDrawW - padDraw - 1, boxY + 22, padDraw, boxH - 23);
    } else if (state.gutter < 16 && state.lockMode !== "min") {
      // Zero-gutter crimson edge scrape warning
      ctx.fillStyle = "rgba(185, 28, 28, 0.55)";
      ctx.fillRect(boxX + 1, boxY + 22, 2.5, boxH - 23);
      ctx.fillRect(boxX + boxDrawW - 3.5, boxY + 22, 2.5, boxH - 23);
    }

    // Browser chrome header inside container (3 dots navy/orange/navy + hamburger)
    const chromeH = landscapeShort ? 18 : 22;
    ctx.fillStyle = COL.cream;
    ctx.fillRect(boxX + 1, boxY + 1, boxDrawW - 2, chromeH);
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + chromeH + 0.5);
    ctx.lineTo(boxX + boxDrawW, boxY + chromeH + 0.5);
    ctx.stroke();

    // Three signature dots
    const dotY = boxY + chromeH / 2 + 0.5;
    const dotCols = [COL.navy, COL.orange, COL.navy];
    if (boxDrawW > 70) {
      dotCols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(boxX + 12 + i * 10, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // Hamburger icon right
    if (boxDrawW > 90) {
      ctx.strokeStyle = COL.navy;
      ctx.lineWidth = 1.4;
      const hx = boxX + boxDrawW - 22;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(hx, dotY + i * 3.8);
        ctx.lineTo(hx + 12, dotY + i * 3.8);
        ctx.stroke();
      }
    }

    // Render live scenario content clipped cleanly to the container interior
    const innerX = boxX + padDraw + 6;
    const innerW = Math.max(16, boxDrawW - padDraw * 2 - 12);
    const innerY = boxY + chromeH + 6;
    const innerH = Math.max(24, boxH - chromeH - 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX + 2, boxY + chromeH + 1, boxDrawW - 4, boxH - chromeH - 2);
    ctx.clip();
    drawScenarioInterior(ctx, animState, cur, innerX, innerY, innerW, innerH, compact, landscapeShort, patOrange);
    ctx.restore();

    // If overflowing past viewport right edge, overlay unmistakable crimson shear zone!
    if (cur.overflowPx > 0) {
      const ovX = vpX + vpPixelW;
      const ovW = Math.max(6, boxX + boxDrawW - ovX);
      ctx.fillStyle = patCrimsonHeavy;
      ctx.fillRect(ovX, boxY, ovW, boxH);

      // Vertical cut line at viewport right wall
      ctx.save();
      ctx.strokeStyle = COL.crimson;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(ovX, vpY - 4);
      ctx.lineTo(ovX, vpY + vpH + 4);
      ctx.stroke();
      ctx.restore();

      // Overflow alert tag inside overhang
      if (ovW > 46) {
        const pulse = still ? 1 : 0.86 + 0.14 * Math.sin(t * 4.2);
        ctx.save();
        ctx.globalAlpha = pulse;
        drawPill(
          ctx,
          ovX + ovW / 2,
          boxY + boxH * 0.5,
          Math.min(ovW - 8, 108),
          22,
          COL.crimson,
          "#FFFFFF",
          `溢出 +${cur.overflowPx}px`,
          '600 11px "IBM Plex Mono", monospace',
        );
        ctx.restore();
      }

      // Simulated horizontal scrollbar at bottom of viewport!
      const sbY = vpY + vpH - 13;
      ctx.fillStyle = "#E5D8C7";
      ctx.fillRect(vpX + 3, sbY, vpPixelW - 6, 9);
      const thumbW = Math.max(22, (vpPixelW - 6) * (cur.vpWidth / cur.boxW));
      ctx.fillStyle = COL.crimson;
      ctx.fillRect(vpX + 3, sbY, thumbW, 9);
      ctx.fillStyle = COL.crimson;
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      if (vpPixelW > 120) {
        ctx.fillText("出现横向滚动条 ⇄", vpX + vpPixelW - 6, sbY - 2);
      }
    }

    // Crisp outer border of fixed container
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxDrawW - 1, boxH - 1);

    // Floating signature 238 navy pill straddling top border ("固定容器 · XXXpx")
    const pillText =
      cur.overflowPx > 0
        ? `硬锁 ${cur.boxW}px · 爆屏`
        : state.lockMode === "hard"
          ? `硬锁 ${cur.boxW}px`
          : `固定容器 ${cur.boxW}px`;
    const pillW = Math.min(Math.max(118, pillText.length * 9 + 18), Math.max(118, boxDrawW - 14));
    const pillCx = Math.max(vpX + pillW / 2 + 4, Math.min(vpX + totalDrawW - pillW / 2 - 4, boxX + boxDrawW / 2));
    drawPill(
      ctx,
      pillCx,
      boxY,
      pillW,
      20,
      cur.overflowPx > 0 ? COL.crimson : COL.navy,
      "#FAF5EA",
      pillText,
      '600 11px "IBM Plex Mono", "Noto Sans SC", monospace',
    );

    // Interactive tactile rail drag grips on both container walls
    drawDragGrip(ctx, boxX, boxY + boxH * 0.5, borderCol, dragging);
    drawDragGrip(ctx, boxX + boxDrawW, boxY + boxH * 0.5, borderCol, dragging);

    // Current viewport label tucked in top-left of viewport frame
    ctx.fillStyle = COL.navy;
    ctx.font = `600 ${compact ? 10 : 11}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(compact ? `${cur.vpWidth}px 视口` : `当前检视 ${cur.vpWidth}px`, vpX + 6, vpY + 4);
    ctx.restore();

    // 3. Lower Zone: Five-Screen Live Cross-Section Strip (375 / 768 / 1024 / 1440 / 1920)
    const stripTop = stageTop + stageH + 8;
    drawFiveScreenStrip(ctx, animState, sidePad, stripTop, stageW, stripH, compact, landscapeShort, hitState);
    return true;
  }

  return {
    render,
    markDirty,
    hitState,
    hitTestStrip(px, py) {
      for (const tile of hitState.stripTiles) {
        if (px >= tile.x && px <= tile.x + tile.w && py >= tile.y && py <= tile.y + tile.h) {
          return tile.width;
        }
      }
      return null;
    },
    isInUpperStage(px, py) {
      const r = hitState.stageRect;
      return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    },
    deltaPxToWidthDelta(dxCanvas) {
      const s = Math.max(0.18, hitState.vpScale || 0.5);
      return dxCanvas / s;
    },
  };
}

function drawTopRuler(ctx, vpX, vpPixelW, totalDrawW, scale, vpWidth, totalPx, topPad, compact) {
  const y = topPad - 2;
  ctx.save();
  ctx.strokeStyle = COL.navySub;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(vpX, y + 0.5);
  ctx.lineTo(vpX + totalDrawW, y + 0.5);
  ctx.stroke();

  const stepPx = vpWidth <= 480 ? 75 : vpWidth <= 1024 ? 160 : 240;
  ctx.fillStyle = COL.inkSoft;
  ctx.font = '500 10px "IBM Plex Mono", monospace';
  ctx.textBaseline = "bottom";

  for (let px = 0; px <= totalPx; px += stepPx) {
    const x = vpX + px * scale;
    const isMajor = px === 0 || px === vpWidth || px % (stepPx * 2) === 0;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, y);
    ctx.lineTo(x + 0.5, y - (isMajor ? 8 : 5));
    ctx.stroke();
    // Avoid overlapping the orange viewport right-edge label
    const nearVpRight = Math.abs(px - vpWidth) < stepPx * 0.55;
    if (!nearVpRight && (!compact || isMajor)) {
      ctx.textAlign = px === 0 ? "left" : "center";
      ctx.fillText(`${px}`, x, y - 9);
    }
  }
  // Exact viewport right tick
  const rx = vpX + vpPixelW;
  ctx.strokeStyle = COL.orange;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rx + 0.5, y + 2);
  ctx.lineTo(rx + 0.5, y - 10);
  ctx.stroke();
  ctx.fillStyle = COL.orangeText;
  ctx.textAlign = "right";
  ctx.fillText(`${vpWidth}px 屏宽`, rx - 2, y - 10);
  ctx.restore();
}

function drawMarginChip(ctx, cx, cy, label, color) {
  ctx.save();
  ctx.font = '600 10.5px "IBM Plex Mono", "Noto Sans SC", monospace';
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = COL.paper;
  ctx.fillRect(cx - tw / 2, cy - 8, tw, 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2 + 0.5, cy - 7.5, tw - 1, 15);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + 0.5);
  ctx.restore();
}

function drawDragGrip(ctx, x, cy, color, active) {
  const gw = active ? 10 : 8;
  const gh = 34;
  ctx.save();
  ctx.fillStyle = active ? COL.orange : color;
  ctx.fillRect(x - gw / 2, cy - gh / 2, gw, gh);
  ctx.strokeStyle = "#FAF5EA";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 1.5, cy - 7);
  ctx.lineTo(x - 1.5, cy + 7);
  ctx.moveTo(x + 1.5, cy - 7);
  ctx.lineTo(x + 1.5, cy + 7);
  ctx.stroke();
  ctx.restore();
}

function drawScenarioInterior(ctx, state, cur, x, y, w, h, compact, short, patOrange) {
  if (state.scenario === "article") {
    drawArticleInterior(ctx, cur, x, y, w, h, compact, short);
    return;
  }
  if (state.scenario === "landing") {
    drawLandingInterior(ctx, cur, x, y, w, h, compact, short);
    return;
  }
  // Default: 238 original poster 3-column specimen!
  const cols = cur.activeCols;
  const topH = short ? h * 0.96 : h * 0.62;
  const gap = cols > 1 ? 10 : 0;
  const colW = (w - gap * (cols - 1)) / cols;
  const titles = ["宽度恒定", "边距稳定", "内容居中"];
  const subs = ["避免阅读路径变化", "左右留白保持平衡", "提升中心阅读效率"];

  for (let i = 0; i < cols; i++) {
    const cx = x + i * (colW + gap) + colW / 2;
    if (i > 0) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 1;
      const sx = x + i * (colW + gap) - gap / 2;
      ctx.beginPath();
      ctx.moveTo(sx, y + 6);
      ctx.lineTo(sx, y + topH - 6);
      ctx.stroke();
      ctx.restore();
    }

    const r = Math.max(11, Math.min(short ? 16 : 22, colW * 0.24, topH * 0.27));
    const cy = y + r + (short ? 6 : 10);
    const fill = i === 1 ? COL.orange : COL.navy;

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Draw the 3 original poster vector icons inside circles (never called crosshair!)
    ctx.strokeStyle = "#FAF5EA";
    ctx.fillStyle = "#FAF5EA";
    ctx.lineWidth = 1.6;
    if (i === 0) {
      // Bidirectional arrow ↔
      const d = r * 0.54;
      ctx.beginPath();
      ctx.moveTo(cx - d, cy);
      ctx.lineTo(cx + d, cy);
      ctx.moveTo(cx - d + 4, cy - 3.5);
      ctx.lineTo(cx - d, cy);
      ctx.lineTo(cx - d + 4, cy + 3.5);
      ctx.moveTo(cx + d - 4, cy - 3.5);
      ctx.lineTo(cx + d, cy);
      ctx.lineTo(cx + d - 4, cy + 3.5);
      ctx.stroke();
    } else if (i === 1) {
      // Dashed outer square + solid inner square
      const s1 = r * 0.56;
      const s2 = r * 0.34;
      ctx.save();
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(cx - s1, cy - s1, s1 * 2, s1 * 2);
      ctx.restore();
      ctx.strokeRect(cx - s2, cy - s2, s2 * 2, s2 * 2);
    } else {
      // Concentric center anchor ring + four outer ticks + orange center dot
      const rr = r * 0.44;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
      const t0 = rr - 2;
      const t1 = rr + 4.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - t1); ctx.lineTo(cx, cy - t0);
      ctx.moveTo(cx, cy + t0); ctx.lineTo(cx, cy + t1);
      ctx.moveTo(cx - t1, cy); ctx.lineTo(cx - t0, cy);
      ctx.moveTo(cx + t0, cy); ctx.lineTo(cx + t1, cy);
      ctx.stroke();
      ctx.fillStyle = COL.orange;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2.5, r * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }

    // Pillar label + orange dash + simulated lines
    if (colW > 46) {
      ctx.fillStyle = COL.ink;
      ctx.font = `900 ${compact || colW < 92 ? 11 : 13}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(titles[i], cx, cy + r + 6);

      ctx.fillStyle = COL.orange;
      ctx.fillRect(cx - 12, cy + r + 24, 24, 2.5);

      if (!short && colW > 88 && topH > 102) {
        ctx.fillStyle = COL.inkSoft;
        ctx.font = '400 10.5px "Noto Sans SC", sans-serif';
        ctx.fillText(subs[i], cx, cy + r + 31);
      }
    }
  }

  // Bottom 3 mini-diagram cards directly echoing 238 poster lower half
  if (!short && h > 140) {
    const divY = y + topH + 4;
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = COL.navySoft;
    ctx.beginPath();
    ctx.moveTo(x, divY);
    ctx.lineTo(x + w, divY);
    ctx.stroke();
    ctx.restore();

    const cardY = divY + 8;
    const cardH = Math.max(36, y + h - cardY - 2);
    const cardNames = ["固定容器", "左右留白", "稳定阅读"];
    const cardCount = cols;
    const cw = (w - gap * (cardCount - 1)) / cardCount;

    for (let i = 0; i < cardCount; i++) {
      const cx0 = x + i * (cw + gap);
      ctx.fillStyle = COL.cream;
      ctx.fillRect(cx0, cardY, cw, cardH);
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx0 + 0.5, cardY + 0.5, cw - 1, cardH - 1);

      const hdrH = Math.min(18, cardH * 0.34);
      ctx.fillStyle = i === 1 ? COL.orangeFill : COL.navy;
      ctx.fillRect(cx0, cardY, cw, hdrH);
      if (cw > 52) {
        ctx.fillStyle = "#FAF5EA";
        ctx.font = '600 10px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cardNames[i], cx0 + cw / 2, cardY + hdrH / 2 + 0.5);
      }

      // Miniature schematic inside each card
      const bx = cx0 + cw * 0.22;
      const bw = cw * 0.56;
      const by = cardY + hdrH + 6;
      const bh = Math.max(10, cardH - hdrH - 12);
      if (i === 0) {
        ctx.strokeStyle = COL.navy;
        ctx.strokeRect(bx, by, bw, bh);
        drawDoubleArrow(ctx, bx + 3, bx + bw - 3, by + bh / 2, COL.navy, 3);
      } else if (i === 1) {
        ctx.fillStyle = patOrange;
        ctx.fillRect(cx0 + cw * 0.12, by, cw * 0.16, bh);
        ctx.fillRect(cx0 + cw * 0.72, by, cw * 0.16, bh);
        ctx.strokeStyle = COL.navy;
        ctx.strokeRect(cx0 + cw * 0.28, by, cw * 0.44, bh);
      } else {
        ctx.strokeStyle = COL.navy;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = COL.navy;
        ctx.fillRect(bx + 4, by + 4, Math.min(12, bw * 0.24), Math.min(10, bh * 0.44));
        ctx.fillStyle = COL.navySub;
        for (let r = 0; r < 3; r++) {
          ctx.fillRect(bx + Math.min(20, bw * 0.36), by + 4 + r * 5, Math.max(8, bw * 0.52), 2);
        }
      }
    }
  }
}

function drawArticleInterior(ctx, cur, x, y, w, h, compact, short) {
  const tooWide = cur.cjkPerLine > 44;
  const tooNarrow = cur.cjkPerLine < 22;
  const lineCol = tooWide || tooNarrow ? COL.crimson : COL.navy;

  ctx.fillStyle = COL.orangeText;
  ctx.font = '600 10.5px "IBM Plex Mono", "Noto Sans SC", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`单栏正文 · 净宽 ${cur.innerContentW}px · 约 ${cur.cjkPerLine} 字/行`, x + 4, y + 4);

  ctx.fillStyle = COL.ink;
  ctx.font = `900 ${compact ? 12.5 : 15}px "Noto Sans SC", sans-serif`;
  ctx.fillText("为什么书页从不铺满整张桌面？", x + 4, y + 22);

  // Draw crisp typographic text bars + eye return-sweep trajectory
  const lineY0 = y + (short ? 44 : 48);
  const lineGap = short ? 13 : 16;
  const rows = Math.max(3, Math.min(6, Math.floor((h - 56) / lineGap)));
  const ratios = [0.96, 0.91, 0.98, 0.85, 0.94, 0.62];

  for (let r = 0; r < rows; r++) {
    const ly = lineY0 + r * lineGap;
    const lw = Math.max(24, (w - 8) * ratios[r % ratios.length]);
    ctx.fillStyle = r === 0 ? lineCol : "rgba(15, 15, 13, 0.34)";
    ctx.fillRect(x + 4, ly, lw, 5);
  }

  // Eye return-sweep dashed diagonal from line 1 end back to line 2 start
  if (rows >= 2 && w > 60) {
    const xEnd = x + 4 + (w - 8) * ratios[0];
    const y1 = lineY0 + 3;
    const y2 = lineY0 + lineGap + 3;
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = tooWide ? COL.crimson : COL.orange;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(xEnd, y1);
    ctx.lineTo(x + 4, y2);
    ctx.stroke();
    ctx.fillStyle = tooWide ? COL.crimson : COL.orange;
    ctx.beginPath();
    ctx.arc(xEnd, y1, 3, 0, Math.PI * 2);
    ctx.arc(x + 4, y2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!short && h > 140) {
      const badgeText = tooWide
        ? `回扫跨度过大（约 ${cur.cjkPerLine} 字/行，易串行）`
        : tooNarrow
          ? `行宽碎裂（约 ${cur.cjkPerLine} 字/行，频繁折行）`
          : `舒适回扫带（约 ${cur.cjkPerLine} 字/行）`;
      ctx.fillStyle = tooWide || tooNarrow ? COL.crimson : COL.teal;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.fillText(badgeText, x + 4, lineY0 + rows * lineGap + 6);
    }
  }
}

function drawLandingInterior(ctx, cur, x, y, w, h, compact, short) {
  // Subtle 12-column architectural grid backdrop
  const cols12 = 12;
  const gStep = w / cols12;
  ctx.fillStyle = "rgba(8, 39, 78, 0.045)";
  for (let i = 0; i < cols12; i += 2) {
    ctx.fillRect(x + i * gStep, y, gStep * 0.86, h);
  }

  // Hero banner inside container
  const heroH = Math.max(44, h * (short ? 0.44 : 0.45));
  ctx.fillStyle = COL.navy;
  ctx.fillRect(x, y + 2, w, heroH);
  ctx.fillStyle = "#FAF5EA";
  ctx.font = `900 ${compact || w < 220 ? 11 : 14}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("固定容器 · 品牌官网主视觉", x + 10, y + 10);

  if (heroH > 52 && w > 120) {
    ctx.fillStyle = "#C5D7EE";
    ctx.font = '400 10.5px "Noto Sans SC", sans-serif';
    ctx.fillText(`12 列栅格内宽 ${cur.innerContentW}px`, x + 10, y + 30);
    // CTA pill
    ctx.fillStyle = COL.orange;
    ctx.fillRect(x + 10, y + heroH - 22, 64, 14);
  }

  // 3 feature cards below
  const cardY = y + heroH + 10;
  const cardH = Math.max(26, y + h - cardY - 2);
  const cCount = cur.activeCols;
  const gap = cCount > 1 ? 8 : 0;
  const cw = (w - gap * (cCount - 1)) / cCount;
  const labels = ["01 聚焦", "02 对齐", "03 护栏"];

  for (let i = 0; i < cCount; i++) {
    const cx = x + i * (cw + gap);
    ctx.fillStyle = COL.cream;
    ctx.fillRect(cx, cardY, cw, cardH);
    ctx.strokeStyle = COL.navy;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, cardY + 0.5, cw - 1, cardH - 1);
    ctx.fillStyle = i === 1 ? COL.orange : COL.navy;
    ctx.fillRect(cx, cardY, cw, 3);
    if (cw > 44) {
      ctx.fillStyle = COL.navy;
      ctx.font = '700 10.5px "IBM Plex Mono", "Noto Sans SC", monospace';
      ctx.fillText(labels[i], cx + 6, cardY + 8);
      if (cardH > 38) {
        ctx.fillStyle = "rgba(15,15,13,0.28)";
        ctx.fillRect(cx + 6, cardY + 25, Math.max(10, cw - 14), 4);
        ctx.fillRect(cx + 6, cardY + 33, Math.max(8, (cw - 14) * 0.7), 4);
      }
    }
  }
}

function drawFiveScreenStrip(ctx, state, x, y, w, h, compact, short, hitState) {
  hitState.stripTiles = [];
  ctx.save();
  ctx.fillStyle = COL.cream;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COL.navy;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  const labelH = short ? 5 : 18;
  if (!short) {
    ctx.fillStyle = COL.navy;
    ctx.font = '600 10.5px "IBM Plex Mono", "Noto Sans SC", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      compact ? "五屏同步剖面（点切检视）" : "五屏同步压测剖面 · 点击任意设备拉上主台放大检视",
      x + 8,
      y + labelH / 2 + 1,
    );
  }

  const pad = 6;
  const gap = compact ? 4 : 8;
  const n = VIEWPORT_PRESETS.length;
  const tileW = (w - pad * 2 - gap * (n - 1)) / n;
  const tileY = y + labelH + 2;
  const tileH = Math.max(36, h - labelH - pad - 2);

  VIEWPORT_PRESETS.forEach((p, idx) => {
    const tx = x + pad + idx * (tileW + gap);
    const active = state.viewport === p.width;
    const lay = computeViewportLayout(state, p.width);

    hitState.stripTiles.push({ x: tx, y: tileY, w: tileW, h: tileH, width: p.width });

    // Tile background & border
    ctx.fillStyle = active ? "#FFFFFF" : COL.paper;
    ctx.fillRect(tx, tileY, tileW, tileH);
    ctx.strokeStyle = active ? COL.navy : lay.overflowPx > 0 ? COL.crimson : COL.line;
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(tx + 0.5, tileY + 0.5, tileW - 1, tileH - 1);

    if (active) {
      ctx.fillStyle = COL.orange;
      ctx.fillRect(tx, tileY, tileW, 3);
    }

    // Device name & px
    ctx.fillStyle = active ? COL.navy : COL.inkSoft;
    ctx.font = `700 ${compact ? 9.5 : 11}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(compact ? `${p.short}` : `${p.label} ${p.short}`, tx + tileW / 2, tileY + 5);

    // Proportional miniature viewport bar inside tile
    const barW = Math.max(20, tileW - (compact ? 10 : 18));
    const barX = tx + (tileW - barW) / 2;
    const barY = tileY + (short ? 18 : 22);
    const barH = Math.max(12, tileH - (short ? 32 : 42));

    // Scale mini bar relative to max(p.width, lay.boxW)
    const refMax = Math.max(p.width, lay.boxW);
    const vpMiniW = Math.max(8, (p.width / refMax) * barW);
    const boxMiniW = Math.max(6, (lay.boxW / refMax) * barW);
    const leftMini = (lay.leftMargin / refMax) * barW;

    // Viewport base
    ctx.fillStyle = COL.sand;
    ctx.fillRect(barX, barY, vpMiniW, barH);
    // Container inside
    ctx.fillStyle = lay.overflowPx > 0 ? "rgba(185, 28, 28, 0.25)" : "rgba(8, 39, 78, 0.22)";
    ctx.fillRect(barX + leftMini, barY + 2, boxMiniW, barH - 4);
    ctx.strokeStyle = lay.overflowPx > 0 ? COL.crimson : COL.navy;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(barX + leftMini + 0.5, barY + 2.5, Math.max(2, boxMiniW - 1), barH - 5);

    // Viewport right wall marker
    ctx.strokeStyle = COL.navy;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(barX + 0.5, barY + 0.5, vpMiniW - 1, barH - 1);

    // Status line at bottom of tile
    const statusText =
      lay.overflowPx > 0
        ? compact
          ? `+${lay.overflowPx}`
          : `溢出 +${lay.overflowPx}px`
        : lay.skewPx > 2
          ? compact
            ? "偏斜"
            : `偏斜 ${lay.skewPx}px`
          : lay.minEdgeClearance < 16
            ? "贴边"
            : compact
              ? "0 溢"
              : `稳 ${lay.boxW}px`;
    ctx.fillStyle = lay.overflowPx > 0 ? COL.crimson : lay.skewPx > 2 || lay.minEdgeClearance < 16 ? COL.orangeText : COL.teal;
    ctx.font = `600 ${compact ? 9.5 : 10}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "bottom";
    ctx.fillText(statusText, tx + tileW / 2, tileY + tileH - 3);
  });

  ctx.restore();
}
