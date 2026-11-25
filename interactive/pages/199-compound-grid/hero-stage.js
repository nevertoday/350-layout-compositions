// 199 复合网格 · 首屏 2D Canvas 复合网格透叠叠合舞台
// 1:1 化用原海报暖米纸《自然的秩序与生命力》及《城市与水》《年度增长概览》三案例
// 支持横向直拖次层模块赛璐珞描图纸、点选错配内容块归轨、键盘操控、高帧率轻量绘制

import { PALETTE, SCENES, clampOffset, evaluateLayout } from "./model.js";
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// 精绘原海报标志性热带叶片纹理（深孔雀绿卡片内）
function drawLeafMotif(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#044A4D");
  grad.addColorStop(0.45, "#0E6B69");
  grad.addColorStop(1, "#033B3F");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // 叶片主体轮廓（左半区大叶片，留出右侧标题文字区）
  const lx = x + w * 0.06;
  const ly = y + h * 0.96;
  const tipX = x + w * 0.54;
  const tipY = y + h * 0.05;

  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.bezierCurveTo(x - w * 0.04, y + h * 0.35, x + w * 0.16, y + h * 0.04, tipX, tipY);
  ctx.bezierCurveTo(x + w * 0.64, y + h * 0.36, x + w * 0.45, y + h * 0.85, lx, ly);
  ctx.closePath();
  const leafGrad = ctx.createLinearGradient(lx, ly, tipX, tipY);
  leafGrad.addColorStop(0, "#084D4F");
  leafGrad.addColorStop(0.55, "#198E86");
  leafGrad.addColorStop(1, "#2DA59C");
  ctx.fillStyle = leafGrad;
  ctx.fill();

  // 主叶脉与平行弧形侧脉
  ctx.strokeStyle = "rgba(182, 238, 230, 0.42)";
  ctx.lineWidth = Math.max(1.2, w * 0.005);
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.46, tipX, tipY);
  ctx.stroke();

  ctx.lineWidth = Math.max(0.7, w * 0.0025);
  ctx.strokeStyle = "rgba(182, 238, 230, 0.24)";
  for (let i = 1; i <= 10; i++) {
    const t = i / 11;
    const mx = (1 - t) * (1 - t) * lx + 2 * (1 - t) * t * (x + w * 0.25) + t * t * tipX;
    const my = (1 - t) * (1 - t) * ly + 2 * (1 - t) * t * (y + h * 0.46) + t * t * tipY;
    const span = Math.sin(t * Math.PI) * w * 0.22;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.quadraticCurveTo(mx - span * 0.55, my - span * 0.45, mx - span * 0.85, my - span * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.quadraticCurveTo(mx + span * 0.55, my + span * 0.12, mx + span * 0.72, my + span * 0.48);
    ctx.stroke();
  }
  ctx.restore();
}

// 精绘原海报紫雾湖山 RHYTHM 卡片
function drawLakeMountainMotif(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, "#4B3A70");
  sky.addColorStop(0.42, "#8F78B8");
  sky.addColorStop(0.54, "#B59FD3");
  sky.addColorStop(0.60, "#5E4B88");
  sky.addColorStop(1, "#291F45");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  // 远山
  ctx.fillStyle = "rgba(63, 47, 102, 0.58)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.56);
  ctx.bezierCurveTo(x + w * 0.22, y + h * 0.34, x + w * 0.44, y + h * 0.48, x + w * 0.72, y + h * 0.37);
  ctx.lineTo(x + w, y + h * 0.46);
  ctx.lineTo(x + w, y + h * 0.58);
  ctx.lineTo(x, y + h * 0.58);
  ctx.closePath();
  ctx.fill();

  // 近山（左）
  ctx.fillStyle = "rgba(35, 25, 62, 0.78)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.57);
  ctx.bezierCurveTo(x + w * 0.12, y + h * 0.22, x + w * 0.32, y + h * 0.42, x + w * 0.52, y + h * 0.57);
  ctx.closePath();
  ctx.fill();

  // 湖面涟漪倒影
  ctx.strokeStyle = "rgba(215, 200, 238, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const ry = y + h * (0.61 + i * 0.062);
    ctx.beginPath();
    ctx.moveTo(x + w * (0.1 + i * 0.04), ry);
    ctx.lineTo(x + w * (0.86 - i * 0.05), ry);
    ctx.stroke();
  }
  ctx.restore();
}

// 精绘原海报鹦鹉螺 GROWTH 对数螺线卡片
function drawNautilusMotif(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, "#095B5C");
  bg.addColorStop(1, "#043F43");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  const cx = x + w * 0.43;
  const cy = y + h * 0.47;
  const maxR = Math.min(w, h) * 0.42;

  // 外旋螺线与气室隔片
  ctx.strokeStyle = "rgba(222, 202, 160, 0.85)";
  ctx.lineWidth = Math.max(1.1, w * 0.006);
  ctx.beginPath();
  const turns = 2.6;
  const steps = 110;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = t * turns * Math.PI * 2 - 1.2;
    const r = maxR * Math.pow(0.11, 1 - t);
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 内部辅助气室弧线
  ctx.strokeStyle = "rgba(154, 215, 208, 0.36)";
  ctx.lineWidth = Math.max(0.7, w * 0.003);
  for (let k = 1; k <= 16; k++) {
    const t = k / 17;
    const ang = t * turns * Math.PI * 2 - 1.2;
    const rOuter = maxR * Math.pow(0.11, 1 - t);
    const rInner = rOuter * 0.46;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * rInner, cy + Math.sin(ang) * rInner);
    ctx.quadraticCurveTo(
      cx + Math.cos(ang + 0.32) * (rOuter * 0.78),
      cy + Math.sin(ang + 0.32) * (rOuter * 0.78),
      cx + Math.cos(ang) * rOuter,
      cy + Math.sin(ang) * rOuter
    );
    ctx.stroke();
  }
  ctx.restore();
}

// 精绘场景 2《城市与水》夜景水岸剪影（无面部人物）
function drawCityWaterMotif(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#0A3A40");
  grad.addColorStop(0.52, "#19676A");
  grad.addColorStop(0.55, "#5A9B9B");
  grad.addColorStop(1, "#07262B");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  const horizon = y + h * 0.56;
  const towers = [
    [0.06, 0.10, 0.24], [0.18, 0.08, 0.34], [0.28, 0.12, 0.18],
    [0.42, 0.09, 0.42], [0.54, 0.11, 0.29], [0.68, 0.08, 0.37], [0.79, 0.14, 0.22],
  ];
  for (const [rx, rw, rh] of towers) {
    const bx = x + rx * w;
    const bw = rw * w;
    const bh = rh * h;
    ctx.fillStyle = "rgba(8, 30, 35, 0.85)";
    ctx.fillRect(bx, horizon - bh, bw, bh);
    // 倒影
    ctx.fillStyle = "rgba(10, 38, 44, 0.42)";
    ctx.fillRect(bx, horizon + 2, bw, bh * 0.72);
  }
  ctx.strokeStyle = "rgba(180, 232, 228, 0.28)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const ry = horizon + 6 + i * (h * 0.055);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, ry);
    ctx.lineTo(x + w * 0.92, ry);
    ctx.stroke();
  }
  ctx.restore();
}

// 四张复杂插画的离屏尺寸缓存（拖动次网描纸时只做 1 次 drawImage，软件渲染也能满帧）
const motifCache = new Map();
function drawCachedMotif(ctx, key, x, y, w, h, dpr, painter) {
  const pw = Math.max(2, Math.round(w * dpr));
  const ph = Math.max(2, Math.round(h * dpr));
  let entry = motifCache.get(key);
  if (!entry || entry.pw !== pw || entry.ph !== ph) {
    const off = document.createElement("canvas");
    off.width = pw;
    off.height = ph;
    const octx = off.getContext("2d");
    octx.scale(dpr, dpr);
    painter(octx, 0, 0, pw / dpr, ph / dpr);
    entry = { pw, ph, canvas: off };
    motifCache.set(key, entry);
  }
  ctx.drawImage(entry.canvas, x, y, w, h);
}

export function mountHeroStage(canvas, getState, onAction, onResize) {
  const ctx = canvas.getContext("2d");
  let cssW = 720;
  let cssH = 540;
  let dpr = 1;

  // 平滑视觉插值（让切换与磁吸丝滑而跟手）
  let visOffset = getState().offsetRatio;
  let intro = reducedMotion.matches ? 1 : 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let dragMoved = false;
  let snapFlash = 0; // 合槽成功瞬间青紫光脉冲
  let hitZones = []; // 可点击块的热区列表（单帧重建）
  let lastFieldW = 540;
  let dirty = true;

  function computeFieldW(w, marginOn) {
    const sidePad = Math.max(8, Math.min(16, w * 0.02));
    const paperW = w - sidePad * 2;
    const mX = marginOn ? paperW * 0.068 : paperW * 0.01;
    return Math.max(120, paperW - mX * 2);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    cssW = rect.width;
    cssH = rect.height;
    // 窄屏设备像素比限制 1.5（GUIDE.md 性能守则），宽屏保留 2
    dpr = cssW <= 520 ? pixelRatio(1.5) : pixelRatio(2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    lastFieldW = computeFieldW(cssW, getState().marginOn);
    dirty = true;
    if (onResize) onResize(lastFieldW);
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  // 分层缓存：
  // 1) baseLayer：薰衣草外框 + 暖米纸 + 顶沿三引线 + 基线横线 + 主栏静态内容（不随描纸偏移变化）
  // 2) drag 拖动时直接 1 次 drawImage(baseLayer) + 轻量化移动层，零 measureText 逐字重排，软渲染 6× CPU 也可满帧！
  const baseCanvas = document.createElement("canvas");
  let baseKey = "";
  const wrapCache = new Map();
  function getWrappedLines(text, maxW, maxLines, fontStr) {
    const key = `${text}|${Math.round(maxW)}|${maxLines}|${fontStr}`;
    let lines = wrapCache.get(key);
    if (lines) return lines;
    ctx.font = fontStr;
    lines = [];
    let line = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        if (lines.length + 1 >= maxLines) {
          lines.push(line.slice(0, -1) + "…");
          line = "";
          break;
        }
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    if (wrapCache.size > 160) wrapCache.clear();
    wrapCache.set(key, lines);
    return lines;
  }

  function drawWrapped(text, x, y, maxW, lineH, maxLines = 6) {
    const lines = getWrappedLines(text, maxW, maxLines, ctx.font);
    let cy = y;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, cy);
      cy += lineH;
    }
    return cy;
  }

  function drawCallout(x, yEdge, yTarget, labelTop, labelBot, dir, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, yEdge);
    ctx.lineTo(x, yTarget);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, yTarget, 2.7, 0, Math.PI * 2);
    ctx.fill();

    const fs = Math.max(9.5, Math.min(11.5, cssW * 0.0155));
    ctx.textAlign = "center";
    if (dir === "top") {
      ctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.fillText(labelTop, x, yEdge - fs * 1.45);
      ctx.font = `600 ${fs * 0.88}px "Sora", sans-serif`;
      ctx.fillText(labelBot, x, yEdge - 3);
    } else {
      ctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.fillText(labelTop, x, yEdge + fs * 1.15);
      ctx.font = `600 ${fs * 0.86}px "Sora", sans-serif`;
      ctx.fillText(labelBot, x, yEdge + fs * 2.25);
    }
    ctx.restore();
  }

  function drawBlockOverlayTag(x, y, w, h, id, isBad, isSelected, tagText) {
    hitZones.push({ id, x, y, w, h });
    if (!isBad && !isSelected) return;

    ctx.save();
    if (isBad) {
      ctx.strokeStyle = PALETTE.errLight;
      ctx.lineWidth = isSelected ? 2.2 : 1.6;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.setLineDash([]);

      // 左上醒目纠错点击徽（保证对比度与最小尺寸）
      const fs = Math.max(10, Math.min(11.5, cssW * 0.016));
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tagText).width;
      const bw = Math.min(w - 6, tw + 14);
      const bh = fs + 8;
      const bx = x + 3;
      const by = y + 3;
      ctx.fillStyle = PALETTE.errLight;
      roundRect(ctx, bx, by, bw, bh, 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, bx + 7, by + bh / 2 + 0.5, bw - 10);
    } else if (isSelected) {
      ctx.strokeStyle = PALETTE.tealMain;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function frame(t, dt, { still }) {
    const state = getState();
    let activeAnim = false;
    if (still) {
      intro = 1;
      visOffset = state.offsetRatio;
      snapFlash = 0;
      dirty = true;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + dt * 1.9);
        activeAnim = true;
      }
      const diff = state.offsetRatio - visOffset;
      if (Math.abs(diff) > 0.0004) {
        visOffset += diff * Math.min(1, dt * 18);
        activeAnim = true;
      } else if (visOffset !== state.offsetRatio) {
        visOffset = state.offsetRatio;
        activeAnim = true;
      }
      if (snapFlash > 0) {
        snapFlash = Math.max(0, snapFlash - dt * 2.2);
        activeAnim = true;
      }
    }
    if (!dirty && !activeAnim && !isDragging) return;
    dirty = false;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    // 外层薰衣草画册底板（放顶底引线注释）
    const topBand = Math.max(34, Math.min(46, cssH * 0.088));
    const botBand = Math.max(32, Math.min(44, cssH * 0.084));
    const sidePad = Math.max(8, Math.min(16, cssW * 0.02));
    const paperX = sidePad;
    const paperY = topBand;
    const paperW = cssW - sidePad * 2;
    const paperH = cssH - topBand - botBand;

    // 外边距与内容区（CONTENT FIELD）
    const mX = state.marginOn ? paperW * 0.068 : paperW * 0.01;
    const mY = state.marginOn ? paperH * 0.062 : paperH * 0.012;
    const fx = paperX + mX;
    const fy = paperY + mY;
    const fw = paperW - mX * 2;
    const fh = paperH - mY * 2;
    lastFieldW = fw;

    const evalState = { ...state, offsetRatio: visOffset };
    const ev = evaluateLayout(evalState, fw);

    // 顶部三根原海报标志圆点引线（外边距 / 栏栅 / 内容区）+ 纸面 + 基线 + 主栏栅全部缓存于 baseCanvas
    const bKey = `${Math.round(cssW)}x${Math.round(cssH)}@${dpr}|${state.cols}|${state.modCols}|${state.baseline}|${state.marginOn}|${state.showBaselines}|${state.showColumns}|${ev.divisorOk}|${intro >= 1 ? 1 : Math.round(intro * 20)}`;
    if (bKey !== baseKey) {
      baseKey = bKey;
      baseCanvas.width = canvas.width;
      baseCanvas.height = canvas.height;
      const bctx = baseCanvas.getContext("2d");
      bctx.save();
      bctx.scale(dpr, dpr);
      bctx.fillStyle = PALETTE.lilacBg;
      bctx.fillRect(0, 0, cssW, cssH);
      bctx.fillStyle = PALETTE.creamPaper;
      bctx.fillRect(paperX, paperY, paperW, paperH);
      bctx.strokeStyle = "#8C8798";
      bctx.lineWidth = 1;
      bctx.strokeRect(paperX + 0.5, paperY + 0.5, paperW - 1, paperH - 1);

      const drawStaticCallout = (x, yEdge, yTarget, labelTop, labelBot, dir, color) => {
        bctx.save();
        bctx.strokeStyle = color;
        bctx.fillStyle = color;
        bctx.lineWidth = 1;
        bctx.beginPath();
        bctx.moveTo(x, yEdge);
        bctx.lineTo(x, yTarget);
        bctx.stroke();
        bctx.beginPath();
        bctx.arc(x, yTarget, 2.7, 0, Math.PI * 2);
        bctx.fill();
        const fs = Math.max(9.5, Math.min(11.5, cssW * 0.0155));
        bctx.textAlign = "center";
        if (dir === "top") {
          bctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
          bctx.fillText(labelTop, x, yEdge - fs * 1.45);
          bctx.font = `600 ${fs * 0.88}px "Sora", sans-serif`;
          bctx.fillText(labelBot, x, yEdge - 3);
        } else {
          bctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
          bctx.fillText(labelTop, x, yEdge + fs * 1.15);
          bctx.font = `600 ${fs * 0.86}px "Sora", sans-serif`;
          bctx.fillText(labelBot, x, yEdge + fs * 2.25);
        }
        bctx.restore();
      };

      const cInk = "#1D1C28";
      const compactLabels = cssW < 460;
      drawStaticCallout(
        paperX + mX * 0.52,
        paperY,
        paperY + mY * 0.55,
        "外边距",
        "MARGIN",
        "top",
        state.marginOn ? cInk : PALETTE.errLight
      );
      drawStaticCallout(
        fx + fw * (ev.colLines[Math.floor(ev.colLines.length / 2)] || 0.5),
        paperY,
        paperY + mY + 2,
        compactLabels ? `栏栅 (${state.cols} COLS)` : `栏栅 GRID (${state.cols} COLUMNS)`,
        compactLabels ? (ev.divisorOk ? "ALIGNED" : "DIVISOR") : (ev.divisorOk ? "ALIGNED TRACKS" : "CHECK DIVISOR"),
        "top",
        PALETTE.tealDark
      );
      drawStaticCallout(
        fx + fw * (compactLabels ? 0.87 : 0.84),
        paperY,
        fy + 8,
        "内容区",
        compactLabels ? "FIELD" : "CONTENT FIELD",
        "top",
        cInk
      );
      drawStaticCallout(
        fx + fw * 0.78,
        paperY + paperH,
        fy + fh - 6,
        state.baseline === "off" ? "基线 (脱钩)" : `基线 (${state.baseline}pt)`,
        "BASELINE GRID",
        "bottom",
        state.baseline === "off" ? PALETTE.errLight : PALETTE.goldInk
      );

      // 基线横线进静态底图
      const bRows = state.baseline === "20" ? 19 : 16;
      const bStep = fh / bRows;
      if (state.showBaselines && state.baseline !== "off") {
        bctx.strokeStyle = "rgba(162, 128, 66, 0.26)";
        bctx.lineWidth = 0.8;
        bctx.setLineDash([2, 3]);
        bctx.beginPath();
        for (let r = 0; r <= bRows; r++) {
          const by = fy + r * bStep;
          bctx.moveTo(fx, by);
          bctx.lineTo(fx + fw, by);
        }
        bctx.stroke();
        bctx.setLineDash([]);
      }
      bctx.restore();
    }

    ctx.drawImage(baseCanvas, 0, 0, cssW, cssH);

    // 底部随次模块轻微联动的唯一动态引线
    const compactLabels = cssW < 460;
    const modLabel = state.modCols > 0 ? `模块网格 (${state.modCols}×${state.modRows})` : "模块网格 (未启用)";
    drawCallout(
      fx + fw * 0.36 + visOffset * fw * 0.35,
      paperY + paperH,
      fy + fh - 10,
      modLabel,
      state.modCols > 0 ? "MODULE OVERLAY" : "SINGLE GRID ONLY",
      "bottom",
      state.modCols > 0 ? PALETTE.violetDark : PALETTE.errLight
    );

    // 内容区裁切
    ctx.save();
    ctx.beginPath();
    ctx.rect(paperX + 1, paperY + 1, paperW - 2, paperH - 2);
    ctx.clip();

    const baseRows = state.baseline === "20" ? 19 : 16;
    const baseStep = fh / baseRows;

    // 2. 绘制内容块（依据主栏、次模块与相位偏移真实渲染！）
    hitZones = [];
    const colW = fw / state.cols;
    const gap = Math.max(4, Math.min(9, fw * 0.015));
    const modCount = state.modCols > 0 ? state.modCols : 3;
    const modW = fw / modCount;
    const modOffsetPx = visOffset * fw;
    const rowH1 = fh * 0.33;
    const rowH2 = fh * 0.31;
    const rowH3 = fh - rowH1 - rowH2;
    const yRow1 = fy;
    const yRow2 = fy + rowH1;
    const yRow3 = fy + rowH1 + rowH2;

    // 文本对齐函数：统一基线时吸附到最近的基线，脱钩时左右错齿
    const snapBase = (py, drift = 0) => {
      if (state.baseline === "off") return py + drift;
      return fy + Math.round((py - fy) / baseStep) * baseStep;
    };

    // --- 计算各内容块真实几何 ---
    // 左主栏宽度（自然占左 ~1/3，紧贴最接近 1/3 的主栏边界）
    const leftCols = Math.max(1, Math.round(state.cols / 3));
    const leftX = fx + gap * 0.5;
    const leftW = leftCols * colW - gap;

    // 右区跨轨宽度（对应剩余主栏，或当大图脱锚时漂移）
    const rightStart = fx + leftCols * colW + gap * 0.5;
    const rightSpanW = fw - leftCols * colW - gap;
    const driftShift = state.heroRole === "bad_drift" ? fw * 0.055 : 0;

    if (state.scene === "nature") {
      // 【块 1】主标题：自然的秩序与生命力（始终靠左主栏，宽高双向自适应防矮画布贴边）
      const titleFs = Math.max(11, Math.min(27, fw * 0.049, fh * 0.068));
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${titleFs}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      const tLineH = state.baseline === "off"
        ? titleFs * 1.12
        : Math.max(baseStep, Math.round((titleFs * 1.14) / baseStep) * baseStep);
      const tStart = snapBase(yRow1 + titleFs * 1.05, -2);
      ctx.fillText("自然的", leftX + 2, tStart);
      ctx.fillText("秩序与", leftX + 2, tStart + tLineH);
      ctx.fillText("生命力", leftX + 2, tStart + tLineH * 2);

      const enFs = Math.max(6.8, Math.min(10.5, fw * 0.018, fh * 0.03));
      ctx.fillStyle = PALETTE.tealDark;
      ctx.font = `700 ${enFs}px "Sora", sans-serif`;
      const enMin = tStart + tLineH * 2 + enFs * 1.25;
      const enY = Math.max(enMin, Math.min(yRow2 - enFs * 1.35, snapBase(enMin + 2, 1)));
      ctx.fillText("THE ORDER AND", leftX + 2, enY);
      if (enY + enFs * 1.22 < yRow2 + 2) {
        ctx.fillText("VITALITY OF NATURE", leftX + 2, enY + enFs * 1.22);
      }

      // 【块 2】叶片结构卡（右上跨轨大图，受 heroRole 脱锚影响）
      const leafX = rightStart + driftShift;
      const leafY = yRow1 + gap * 0.6 + (state.heroRole === "bad_drift" ? 8 : 0);
      const leafW = Math.max(80, rightSpanW - driftShift * 1.25);
      const leafH = rowH1 - gap * 1.4;
      drawCachedMotif(ctx, "leaf", leafX, leafY, leafW, leafH, dpr, drawLeafMotif);

      const capFs = Math.max(10, Math.min(14, fw * 0.024));
      ctx.fillStyle = "#F4F2EC";
      ctx.textAlign = "right";
      ctx.font = `700 ${capFs}px "Noto Sans SC", sans-serif`;
      ctx.fillText("结构", leafX + leafW - 10, leafY + leafH * 0.52);
      ctx.font = `600 ${Math.max(8, capFs * 0.72)}px "Sora", sans-serif`;
      ctx.fillStyle = "rgba(232, 245, 242, 0.88)";
      ctx.fillText("STRUCTURE", leafX + leafW - 10, leafY + leafH * 0.66);
      ctx.font = `400 ${Math.max(8, capFs * 0.66)}px "Noto Sans SC", sans-serif`;
      ctx.fillText("形态秩序来自比例重复", leafX + leafW - 10, leafY + leafH * 0.84);
      ctx.textAlign = "left";
      drawBlockOverlayTag(leafX, leafY, leafW, leafH, "hero", state.heroRole === "bad_drift", state.selectedBlock === "hero", "脱锚 · 点此归轨");

      // 【块 3】导语长文（若错配到窄模块格 bad_module，会缩窄并叠入模块偏移）
      const leadIsBad = state.leadRole === "bad_module";
      const lx = leadIsBad ? fx + modOffsetPx + gap * 0.6 : leftX;
      const lw = leadIsBad ? Math.max(72, modW * 0.74) : leftW;
      const ly = yRow2 + gap * 0.6;
      const lh = rowH2 - gap * 1.4;
      if (leadIsBad) {
        ctx.fillStyle = "rgba(182, 39, 56, 0.08)";
        ctx.fillRect(lx, ly, lw, lh);
      }
      const bodyFs = Math.max(9.2, Math.min(12, fw * 0.0202));
      const bodyLineH = state.baseline === "off" ? bodyFs * 1.38 : baseStep;
      ctx.fillStyle = PALETTE.inkBody;
      ctx.font = `400 ${bodyFs}px "Noto Sans SC", sans-serif`;
      const tagSafeTop = Math.max(24, bodyFs + 18);
      const leadTextY = leadIsBad ? ly + tagSafeTop + bodyFs * 0.78 : snapBase(ly + 16, -2);
      drawWrapped(SCENES.nature.leadText, lx + 5, leadTextY, lw - 10, bodyLineH, leadIsBad ? 4 : 6);
      drawBlockOverlayTag(lx, ly, lw, lh, "lead", leadIsBad, state.selectedBlock === "lead", compactLabels ? "错格 · 点归栏" : "长文进小格 · 点归栏");

      // 【块 4】72% 数据环卡（绑定次模块第 2 格，若 bad_float 则浮在半栏夹缝）
      const dataIsBad = state.dataRole === "bad_float";
      const modColIdx1 = modCount >= 3 ? 1 : 0;
      const dx = dataIsBad
        ? fx + fw * 0.41 + modOffsetPx * 0.35
        : fx + modColIdx1 * modW + modOffsetPx + gap * 0.5;
      const dy = yRow2 + gap * 0.6 + (dataIsBad ? 5 : 0);
      const dw = dataIsBad ? modW * 0.88 : modW - gap;
      const dh = rowH2 - gap * 1.4;
      ctx.fillStyle = dataIsBad ? "rgba(251, 233, 235, 0.72)" : "rgba(246, 243, 238, 0.56)";
      ctx.fillRect(dx, dy, dw, dh);
      // 圆环图（错态时为顶部红签留出充足净空，不碰圆环）
      const ringR = Math.min(dw * 0.19, dh * (dataIsBad ? 0.19 : 0.23));
      const ringCx = dx + ringR + 10;
      const ringCy = dy + (dataIsBad ? Math.max(36, dh * 0.46) : dh * 0.35);
      ctx.lineWidth = Math.max(4.5, ringR * 0.36);
      ctx.strokeStyle = PALETTE.tealSoft;
      ctx.beginPath();
      ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.tealMain;
      ctx.beginPath();
      ctx.arc(ringCx, ringCy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.72);
      ctx.stroke();

      const pctFs = Math.max(11.5, Math.min(20, dw * 0.145));
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${pctFs}px "Sora", sans-serif`;
      ctx.fillText("72%", ringCx + ringR + 8, ringCy + pctFs * 0.34);
      if (dh >= 66) {
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.font = `400 ${Math.max(8.2, bodyFs * 0.86)}px "Noto Sans SC", sans-serif`;
        const dataNoteY = dataIsBad ? Math.max(ringCy + ringR + 12, dy + dh * 0.75) : snapBase(dy + dh * 0.73, 4);
        if (dataNoteY < dy + dh - 4) {
          drawWrapped("自然中的模式重复率远高于随机分布。", dx + 8, dataNoteY, dw - 14, bodyLineH * 0.9, dh < 86 ? 1 : 2);
        }
      }
      drawBlockOverlayTag(dx, dy, dw, dh, "data", dataIsBad, state.selectedBlock === "data", compactLabels ? "浮半栏 · 点归" : "浮跨半栏 · 点归模块");

      // 【块 5】PATTERN 砂金图式卡（次模块最右格）
      const px = fx + (modCount - 1) * modW + modOffsetPx + gap * 0.5;
      const py = yRow2 + gap * 0.6;
      const pw = modW - gap;
      const ph = rowH2 - gap * 1.4;
      ctx.fillStyle = "rgba(246, 243, 238, 0.56)";
      ctx.fillRect(px, py, pw, ph);
      const dots = [
        [0.16, 0.22, 0.076], [0.40, 0.20, 0.084], [0.27, 0.48, 0.095],
        [0.14, 0.68, 0.072], [0.29, 0.84, 0.078],
      ];
      ctx.fillStyle = PALETTE.goldMain;
      for (const [rx, ry, rr] of dots) {
        ctx.beginPath();
        ctx.arc(px + pw * rx, py + ph * ry, Math.min(pw, ph) * rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.max(8, Math.min(enFs, pw * 0.088))}px "Sora", sans-serif`;
      ctx.fillText("PATTERN", px + pw * 0.46, snapBase(py + ph * 0.46, -4), pw * 0.50);
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 ${Math.max(8, bodyFs * 0.84)}px "Noto Sans SC", sans-serif`;
      drawWrapped("点、线、面构成可识别的图式。", px + pw * 0.46, snapBase(py + ph * 0.64, 4), pw * 0.50, bodyLineH * 0.88, 3);

      // 【块 6】RHYTHM 紫湖山（底部左侧 2 个次模块宽）
      const rhySpan = Math.max(1, modCount - 1);
      const rx = fx + modOffsetPx + gap * 0.5;
      const ry = yRow3 + gap * 0.5;
      const rw = rhySpan * modW - gap;
      const rh = rowH3 - gap * 1.1;
      drawCachedMotif(ctx, "lake", rx, ry, rw, rh, dpr, drawLakeMountainMotif);
      ctx.fillStyle = "#F3EFFA";
      ctx.font = `700 ${Math.max(9.5, enFs * 1.1)}px "Sora", sans-serif`;
      ctx.fillText("RHYTHM", rx + 12, ry + rh * 0.63);
      ctx.font = `400 ${Math.max(8.5, bodyFs * 0.9)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(240, 236, 250, 0.9)";
      ctx.fillText("节律带来稳定与变化，推动生态平衡。", rx + 12, ry + rh * 0.81);

      // 【块 7】GROWTH 鹦鹉螺（底部最右次模块）
      const gx = fx + (modCount - 1) * modW + modOffsetPx + gap * 0.5;
      const gy = yRow3 + gap * 0.5;
      const gw = modW - gap;
      const gh = rowH3 - gap * 1.1;
      drawCachedMotif(ctx, "nautilus", gx, gy, gw, gh, dpr, drawNautilusMotif);
      ctx.fillStyle = "#F2F7F6";
      ctx.textAlign = "right";
      ctx.font = `700 ${Math.max(9, enFs)}px "Sora", sans-serif`;
      ctx.fillText("GROWTH", gx + gw - 9, gy + gh * 0.72);
      ctx.font = `400 ${Math.max(8, bodyFs * 0.84)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(225, 244, 240, 0.9)";
      ctx.fillText("曲线与分形轨迹", gx + gw - 9, gy + gh * 0.88);
      ctx.textAlign = "left";
    } else if (state.scene === "city") {
      // 场景 2：原海报示例 1《城市与水 WATER & CITY》
      const titleFs = Math.max(16, Math.min(28, fw * 0.052));
      ctx.fillStyle = PALETTE.tealDark;
      ctx.font = `900 ${titleFs}px "Noto Sans SC", sans-serif`;
      ctx.fillText("城市与水", leftX + 2, snapBase(yRow1 + titleFs * 1.25, -4));
      ctx.font = `700 ${Math.max(9, titleFs * 0.4)}px "Sora", sans-serif`;
      ctx.fillText("WATER & CITY", leftX + 2, snapBase(yRow1 + titleFs * 1.9, 3));

      // 导语长文（中段左栏 / 错配窄格）
      const leadIsBad = state.leadRole === "bad_module";
      const lx = leadIsBad ? fx + modOffsetPx + gap * 0.6 : leftX;
      const lw = leadIsBad ? Math.max(66, modW * 0.66) : leftW;
      const ly = yRow1 + rowH1 * 0.72;
      const lh = rowH2 * 0.96;
      if (leadIsBad) {
        ctx.fillStyle = "rgba(182, 39, 56, 0.08)";
        ctx.fillRect(lx, ly, lw, lh);
      }
      const bodyFs = Math.max(9.2, Math.min(12.2, fw * 0.021));
      const bodyLineH = state.baseline === "off" ? bodyFs * 1.45 : baseStep;
      ctx.fillStyle = PALETTE.inkBody;
      ctx.font = `400 ${bodyFs}px "Noto Sans SC", sans-serif`;
      const cityLeadY = leadIsBad ? ly + Math.max(24, bodyFs + 18) + bodyFs * 0.78 : snapBase(ly + 16, -2);
      drawWrapped(SCENES.city.leadText, lx + 5, cityLeadY, lw - 10, bodyLineH, leadIsBad ? 4 : 6);
      drawBlockOverlayTag(lx, ly, lw, lh, "lead", leadIsBad, state.selectedBlock === "lead", compactLabels ? "错格 · 点归栏" : "长文进小格 · 点归栏");

      // 右侧跨高城市水景大片（受 heroRole 影响）
      const imgX = rightStart + driftShift;
      const imgY = yRow1 + gap * 0.6 + (state.heroRole === "bad_drift" ? 8 : 0);
      const imgW = Math.max(85, rightSpanW - driftShift * 1.25);
      const imgH = rowH1 + rowH2 - gap * 1.4;
      drawCachedMotif(ctx, "city", imgX, imgY, imgW, imgH, dpr, drawCityWaterMotif);
      drawBlockOverlayTag(imgX, imgY, imgW, imgH, "hero", state.heroRole === "bad_drift", state.selectedBlock === "hero", "脱锚 · 点此归轨");

      // 底沿三项水文模块（降雨 68mm / 河流 12km / 湿地 23%）
      const dataIsBad = state.dataRole === "bad_float";
      const metrics = [
        ["降雨", "68mm", PALETTE.tealMain],
        ["河流", "12km", PALETTE.tealDark],
        ["湿地", "23%", PALETTE.violetMain],
      ];
      const by = yRow3 + gap * 0.6;
      const bh = rowH3 - gap * 1.2;
      metrics.forEach(([label, val, col], idx) => {
        const slot = Math.min(idx, modCount - 1);
        const mx = dataIsBad
          ? fx + fw * (0.06 + idx * 0.30) + modOffsetPx * 0.4
          : fx + slot * modW + modOffsetPx + gap * 0.5;
        const mw = dataIsBad ? modW * 0.78 : modW - gap;
        ctx.fillStyle = dataIsBad ? "rgba(251, 233, 235, 0.75)" : "rgba(246, 243, 238, 0.75)";
        ctx.fillRect(mx, by, mw, bh);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(mx + 22, by + bh * 0.45, Math.min(13, bh * 0.22), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 ${Math.max(12, Math.min(18, mw * 0.14))}px "Sora", sans-serif`;
        ctx.fillText(val, mx + 44, snapBase(by + bh * 0.46, idx * 4 - 4));
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.font = `500 ${Math.max(9.5, bodyFs * 0.92)}px "Noto Sans SC", sans-serif`;
        ctx.fillText(label, mx + 44, snapBase(by + bh * 0.74, idx * 3));
        if (idx === 1) {
          drawBlockOverlayTag(mx, by, mw, bh, "data", dataIsBad, state.selectedBlock === "data", "浮跨半栏 · 点归模块");
        }
      });
    } else {
      // 场景 3：原海报示例 2《年度增长概览 2021–2024》
      const mainCols = Math.max(2, state.cols - Math.max(1, Math.round(state.cols / 3)));
      const chartW = mainCols * colW - gap;
      const titleFs = Math.max(15, Math.min(24, fw * 0.044));
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${titleFs}px "Noto Sans SC", sans-serif`;
      ctx.fillText("年度增长概览", leftX + 2, snapBase(yRow1 + titleFs * 1.15, -3));
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `600 ${Math.max(9, titleFs * 0.45)}px "JetBrains Mono", monospace`;
      ctx.fillText("2021 — 2024", leftX + 2, snapBase(yRow1 + titleFs * 1.85, 3));

      // 主柱状图区（受 heroRole 影响）
      const cx = leftX + driftShift;
      const cy = yRow1 + rowH1 * 0.56;
      const cw = Math.max(120, chartW - driftShift * 1.2);
      const ch = rowH1 * 0.44 + rowH2 + rowH3 * 0.42;
      ctx.fillStyle = "rgba(246, 243, 238, 0.72)";
      ctx.fillRect(cx, cy, cw, ch);
      const bars = [
        ["2021", 23], ["2022", 37], ["2023", 54], ["2024", 79],
      ];
      const baseLineY = cy + ch - 26;
      const maxBarH = ch - 52;
      ctx.strokeStyle = "rgba(116, 89, 178, 0.25)";
      ctx.lineWidth = 1;
      for (let g = 0; g <= 3; g++) {
        const gy = baseLineY - (maxBarH * g) / 3;
        ctx.beginPath();
        ctx.moveTo(cx + 12, gy);
        ctx.lineTo(cx + cw - 12, gy);
        ctx.stroke();
      }
      bars.forEach(([yr, val], idx) => {
        const bw = Math.min(34, (cw - 48) / 6);
        const stepX = (cw - 32) / 4;
        const bx = cx + 16 + idx * stepX + (stepX - bw) * 0.5;
        const bh = (val / 85) * maxBarH;
        const bGrad = ctx.createLinearGradient(bx, baseLineY - bh, bx, baseLineY);
        bGrad.addColorStop(0, PALETTE.violetMain);
        bGrad.addColorStop(1, "#8F77CA");
        ctx.fillStyle = bGrad;
        ctx.fillRect(bx, baseLineY - bh, bw, bh);
        ctx.fillStyle = PALETTE.ink;
        ctx.textAlign = "center";
        ctx.font = `600 10px "JetBrains Mono", monospace`;
        ctx.fillText(String(val), bx + bw / 2, baseLineY - bh - 5);
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.fillText(yr, bx + bw / 2, baseLineY + 14);
      });
      ctx.textAlign = "left";
      drawBlockOverlayTag(cx, cy, cw, ch, "hero", state.heroRole === "bad_drift", state.selectedBlock === "hero", "图表脱锚 · 点归栏");

      // 底部左区说明文字（受 leadRole 影响）
      const leadIsBad = state.leadRole === "bad_module";
      const lx = leadIsBad ? fx + modOffsetPx + gap * 0.5 : leftX;
      const lw = leadIsBad ? Math.max(70, modW * 0.72) : chartW;
      const ly = cy + ch + 8;
      const lh = fy + fh - ly - 4;
      if (leadIsBad) {
        ctx.fillStyle = "rgba(182, 39, 56, 0.08)";
        ctx.fillRect(lx, ly, lw, lh);
      }
      const bodyFs = Math.max(9.2, Math.min(11.8, fw * 0.02));
      const bodyLineH = state.baseline === "off" ? bodyFs * 1.42 : baseStep;
      ctx.fillStyle = PALETTE.inkBody;
      ctx.font = `400 ${bodyFs}px "Noto Sans SC", sans-serif`;
      const repLeadY = leadIsBad ? ly + Math.max(24, bodyFs + 18) + bodyFs * 0.78 : snapBase(ly + 15, -2);
      drawWrapped(SCENES.report.leadText, lx + 5, repLeadY, lw - 10, bodyLineH, leadIsBad ? 2 : 3);
      drawBlockOverlayTag(lx, ly, lw, lh, "lead", leadIsBad, state.selectedBlock === "lead", compactLabels ? "错格 · 点归栏" : "说明进小格 · 点归栏");

      // 右侧紫雾三指标模块列（+34% / 58% / 4.2x，受 dataRole 影响）
      const dataIsBad = state.dataRole === "bad_float";
      const rx = dataIsBad
        ? fx + fw * 0.62 + modOffsetPx * 0.35
        : fx + (modCount - 1) * modW + modOffsetPx + gap * 0.5;
      const rw = dataIsBad ? modW * 0.86 : modW - gap;
      const cards = [
        ["+34%", "同比增长", "#C9C3E3"],
        ["58%", "来源占比", "#E3E0EE"],
        ["4.2x", "效率提升", "#C9C3E3"],
      ];
      const cardGap = 8;
      const cardH = (fh - cardGap * 2 - gap) / 3;
      cards.forEach(([num, sub, bg], i) => {
        const ky = fy + gap * 0.5 + i * (cardH + cardGap);
        ctx.fillStyle = dataIsBad ? "rgba(251, 233, 235, 0.85)" : bg;
        ctx.fillRect(rx, ky, rw, cardH);
        ctx.fillStyle = PALETTE.ink;
        ctx.textAlign = "center";
        ctx.font = `800 ${Math.max(15, Math.min(24, rw * 0.19))}px "Sora", sans-serif`;
        ctx.fillText(num, rx + rw / 2, snapBase(ky + cardH * 0.50, i * 4 - 4));
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.font = `500 ${Math.max(9.5, bodyFs * 0.9)}px "Noto Sans SC", sans-serif`;
        ctx.fillText(sub, rx + rw / 2, snapBase(ky + cardH * 0.78, i * 3));
        ctx.textAlign = "left";
        if (i === 1) {
          drawBlockOverlayTag(rx, ky, rw, cardH, "data", dataIsBad, state.selectedBlock === "data", "浮跨半栏 · 点归模块");
        }
      });
    }

    // 3. 叠画主栏栅层（孔雀青虚线 + 外框，单次路径合并降低绘制调用）
    if (state.showColumns) {
      ctx.save();
      ctx.strokeStyle = "rgba(10, 102, 101, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);

      ctx.strokeStyle = "rgba(10, 102, 101, 0.42)";
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (const r of ev.colLines) {
        const x = fx + r * fw;
        ctx.moveTo(x, fy);
        ctx.lineTo(x, fy + fh * intro);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 4. 叠画次模块赛璐珞描图纸（薰衣草紫虚线 + 随横向拖拽平移，单次路径合并！）
    if (state.showModules && state.modCols > 0) {
      const ox = fx + visOffset * fw;
      ctx.save();
      if (Math.abs(visOffset) > 0.004 || isDragging) {
        ctx.fillStyle = "rgba(97, 78, 173, 0.055)";
        ctx.fillRect(ox, fy, fw, fh);
      }
      ctx.strokeStyle = ev.phaseOk && ev.divisorOk ? "rgba(97, 78, 173, 0.72)" : "rgba(97, 78, 173, 0.65)";
      ctx.lineWidth = isDragging ? 1.6 : 1.15;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(ox + 0.5, fy + 0.5, fw - 1, fh - 1);

      ctx.beginPath();
      for (const m of ev.modLines) {
        const x = fx + m * fw;
        ctx.moveTo(x, fy);
        ctx.lineTo(x, fy + fh * intro);
      }
      for (let r = 1; r < state.modRows; r++) {
        const y = fy + (fh * r) / state.modRows;
        ctx.moveTo(ox, y);
        ctx.lineTo(ox + fw * intro, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 实算碎缝赤红斜纹警告区 vs 共轨青紫菱形锁定节点
    if (ev.slivers.length > 0 && state.modCols > 0) {
      ctx.save();
      for (const s of ev.slivers.slice(0, 6)) {
        const sx = fx + s.x0 * fw;
        const sw = Math.max(3, (s.x1 - s.x0) * fw);
        ctx.fillStyle = "rgba(182, 39, 56, 0.16)";
        ctx.fillRect(sx, fy, sw, fh);
        ctx.strokeStyle = "rgba(182, 39, 56, 0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, fy);
        ctx.lineTo(sx, fy + fh);
        ctx.moveTo(sx + sw, fy);
        ctx.lineTo(sx + sw, fy + fh);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (ev.sharedPositions.length > 0 && ev.divisorOk && ev.phaseOk) {
      ctx.save();
      for (const sp of ev.sharedPositions) {
        const x = fx + sp * fw;
        ctx.strokeStyle = snapFlash > 0
          ? `rgba(10, 102, 101, ${0.55 + snapFlash * 0.4})`
          : "rgba(10, 102, 101, 0.65)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, fy);
        ctx.lineTo(x, fy + fh);
        ctx.stroke();

        // 顶部与底部青紫共轨菱形锁扣
        for (const ky of [fy + 5, fy + fh - 5]) {
          ctx.fillStyle = PALETTE.violetMain;
          ctx.beginPath();
          ctx.moveTo(x, ky - 5);
          ctx.lineTo(x + 4.5, ky);
          ctx.lineTo(x, ky + 5);
          ctx.lineTo(x - 4.5, ky);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 6. 顶沿轻薄相位游标条（指示当前描纸偏移像素，直接反馈横拖动作）
    if (state.modCols > 0) {
      const pillW = Math.min(200, fw * 0.48);
      const pillH = 22;
      const pillX = fx + fw * 0.5 - pillW * 0.5 + visOffset * fw * 0.45;
      const pillY = fy + 6;
      ctx.save();
      ctx.fillStyle = ev.phaseOk && ev.divisorOk ? PALETTE.tealDark : (ev.phaseOk ? PALETTE.violetDark : PALETTE.errLight);
      roundRect(ctx, pillX, pillY, pillW, pillH, 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelFs = Math.max(10, Math.min(11, cssW * 0.015));
      ctx.font = `600 ${labelFs}px "JetBrains Mono", "Noto Sans SC", monospace`;
      const phaseTxt = ev.phaseOk
        ? (ev.divisorOk ? `↔ 描纸合槽 0px · 共轨 ${ev.sharedAxes} 线` : `↔ 描纸 0px · 互质 ${ev.slivers.length} 碎缝`)
        : `↔ 拖描纸对齐：偏 ${ev.offsetPx > 0 ? "+" : ""}${ev.offsetPx}px`;
      ctx.fillText(phaseTxt, pillX + pillW * 0.5, pillY + pillH * 0.5 + 0.5, pillW - 10);
      ctx.restore();
    }

    ctx.restore(); // clip
    ctx.restore(); // dpr
  }

  const ctrl = loop(canvas, frame);

  // 触摸 + 鼠标直拖（只拦截明显横向拖拽，保留手机纵向自然滚动！）
  let touchAxis = null;
  let touchStartY = 0;

  function onPointerDown(clientX, clientY) {
    isDragging = true;
    dragMoved = false;
    dragStartX = clientX;
    touchStartY = clientY;
    dragStartOffset = getState().offsetRatio;
    touchAxis = null;
  }

  function onPointerMove(clientX, clientY, evObj) {
    if (!isDragging) return;
    const dx = clientX - dragStartX;
    const dy = clientY - touchStartY;
    if (touchAxis === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (touchAxis === "y") return;
    if (Math.abs(dx) > 3) {
      dragMoved = true;
      if (evObj && evObj.cancelable) evObj.preventDefault();
      let next = clampOffset(dragStartOffset + dx / Math.max(220, lastFieldW));
      // 靠近 0 轻轻磁吸合槽
      if (Math.abs(next) <= 0.010) {
        if (Math.abs(getState().offsetRatio) > 0.010) snapFlash = 1;
        next = 0;
      }
      onAction({ type: "offset", value: next });
    }
  }

  function onPointerUp(clientX, clientY) {
    if (!isDragging) return;
    isDragging = false;
    if (!dragMoved) {
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      for (let i = hitZones.length - 1; i >= 0; i--) {
        const z = hitZones[i];
        if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
          onAction({ type: "toggleBlock", block: z.id });
          return;
        }
      }
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    onPointerDown(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => {
    if (isDragging) onPointerMove(e.clientX, e.clientY, e);
  });
  window.addEventListener("mouseup", (e) => {
    if (isDragging) onPointerUp(e.clientX, e.clientY);
  });

  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const tc = e.touches[0];
    onPointerDown(tc.clientX, tc.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!isDragging || !e.touches.length) return;
    const tc = e.touches[0];
    onPointerMove(tc.clientX, tc.clientY, e);
  }, { passive: false });
  canvas.addEventListener("touchend", (e) => {
    const tc = e.changedTouches[0];
    if (tc) onPointerUp(tc.clientX, tc.clientY);
    else isDragging = false;
  });

  // 键盘操作：左右调描纸偏移，上下切选中块，回车/空格归轨
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    const step = e.shiftKey ? 0.024 : 0.008;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      let next = clampOffset(st.offsetRatio - step);
      if (Math.abs(next) <= 0.007) { next = 0; snapFlash = 1; }
      onAction({ type: "offset", value: next });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      let next = clampOffset(st.offsetRatio + step);
      if (Math.abs(next) <= 0.007) { next = 0; snapFlash = 1; }
      onAction({ type: "offset", value: next });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const order = ["lead", "data", "hero"];
      const idx = order.indexOf(st.selectedBlock);
      const nextIdx = (idx + (e.key === "ArrowDown" ? 1 : -1) + order.length) % order.length;
      onAction({ type: "selectBlock", block: order[nextIdx] });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onAction({ type: "toggleBlock", block: st.selectedBlock });
    }
  });

  return {
    draw: () => { dirty = true; ctrl.draw(); },
    pulseSnap: () => { snapFlash = 1; dirty = true; ctrl.draw(); },
    getFieldWidth: () => lastFieldW,
  };
}
