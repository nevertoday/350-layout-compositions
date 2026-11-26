// 256 双列页面 · 开场双列脊线与配重排印台（2D Canvas）+ 活体二分圆徽标
// 1:1 承袭原海报暖米亚麻纸、深林松绿、灰豆青、暖琥珀日轮与拱窗山水 / 几何构形。

import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp, computeLayout, snapSplit } from "./model.js";

const PAL = {
  paper: "#FBF6EC",
  paperCard: "#F5EEE0",
  paperFrame: "#F3EFE1",
  forest: "#235436",
  forestDeep: "#1B432A",
  sage: "#B1C3A6",
  sageMid: "#95AE8F",
  sageSoft: "#DCE4D4",
  gold: "#EDB146",
  goldSun: "#F5BA53",
  ink: "#141714",
  inkSub: "#454D44",
  rule: "#ACA9A1",
  ruleSoft: "#D5D0C3",
  err: "#B63322",
  errTint: "rgba(182, 51, 34, 0.12)",
  ok: "#1E6B45",
  okTint: "rgba(30, 107, 69, 0.12)",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// 1:1 复刻原海报左栏「拱窗远径山水」
function drawArchLandscape(ctx, r, hovered) {
  const { x, y, w, h } = r;
  const archR = Math.min(w * 0.5, h * 0.44);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + archR);
  ctx.arc(x + w / 2, y + archR, w / 2, Math.PI, 0, false);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.clip();

  // 雾豆青天空
  ctx.fillStyle = PAL.sageMid;
  ctx.fillRect(x, y, w, h * 0.54);

  // 暖琥珀太阳
  ctx.fillStyle = PAL.goldSun;
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.34, Math.max(5, Math.min(w, h) * 0.095), 0, Math.PI * 2);
  ctx.fill();

  // 远山薄带
  ctx.fillStyle = "#5B7862";
  ctx.fillRect(x, y + h * 0.48, w, h * 0.09);

  // 深林坡地
  ctx.fillStyle = PAL.forestDeep;
  ctx.fillRect(x, y + h * 0.55, w, h * 0.46);

  // 柔和林丘剪影
  ctx.fillStyle = "#2A5E3E";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.62);
  ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.53, x + w * 0.55, y + h * 0.62);
  ctx.quadraticCurveTo(x + w * 0.82, y + h * 0.7, x + w, y + h * 0.58);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // 弯曲暖米远径（原海报标志母题）
  ctx.fillStyle = "#F4EEDB";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h);
  ctx.bezierCurveTo(x + w * 0.14, y + h * 0.78, x + w * 0.72, y + h * 0.72, x + w * 0.5, y + h * 0.55);
  ctx.lineTo(x + w * 0.58, y + h * 0.55);
  ctx.bezierCurveTo(x + w * 0.86, y + h * 0.73, x + w * 0.44, y + h * 0.84, x + w * 0.66, y + h);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  if (hovered) {
    ctx.save();
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + archR);
    ctx.arc(x + w / 2, y + archR, w / 2, Math.PI, 0, false);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// 1:1 复刻原海报右栏「几何日轮构形卡」
function drawGeoCard(ctx, r, hovered) {
  const { x, y, w, h } = r;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // 暖米纸底
  ctx.fillStyle = "#F3EAD6";
  ctx.fillRect(x, y, w, h);

  // 左上豆青四分之一圆弧
  ctx.fillStyle = "#A9BCA0";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.54, y);
  ctx.arc(x, y, Math.min(w * 0.54, h * 0.56), 0, Math.PI * 0.5, false);
  ctx.closePath();
  ctx.fill();

  // 下半暖琥珀色块 + 左下暖米弧切
  const midY = y + h * 0.58;
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(x, midY, w, h - (midY - y));

  ctx.fillStyle = "#EDE3CA";
  ctx.beginPath();
  ctx.moveTo(x, midY);
  ctx.lineTo(x + w * 0.4, midY);
  ctx.arc(x, midY, Math.min(w * 0.4, h * 0.42), 0, Math.PI * 0.5, false);
  ctx.closePath();
  ctx.fill();

  // 右中深松绿实心圆
  const cr = Math.max(8, Math.min(w, h) * 0.175);
  ctx.fillStyle = PAL.forest;
  ctx.beginPath();
  ctx.arc(x + w * 0.74, midY - cr * 0.92, cr, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (hovered) {
    ctx.save();
    ctx.strokeStyle = PAL.forest;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.restore();
  }
}

// 方案对比题材的价格/规格卡片
function drawPriceCard(ctx, r, isPro, hovered) {
  const { x, y, w, h } = r;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 4);
  ctx.fillStyle = isPro ? PAL.forest : "#EEF3E9";
  ctx.fill();
  ctx.strokeStyle = hovered ? PAL.gold : isPro ? PAL.forestDeep : "#BAC9B2";
  ctx.lineWidth = hovered ? 2 : 1;
  ctx.stroke();

  ctx.fillStyle = isPro ? "#F5BA53" : PAL.forest;
  ctx.font = `600 ${Math.max(10, Math.min(12, Math.round(w * 0.085)))}px "IBM Plex Mono", monospace`;
  ctx.textBaseline = "top";
  ctx.fillText(isPro ? "PRO · RECOMMENDED" : "STANDARD", x + 12, y + 11);

  ctx.fillStyle = isPro ? "#FAF5EB" : PAL.ink;
  ctx.font = `700 ${Math.max(15, Math.min(24, Math.round(w * 0.15)))}px "Sora", "Noto Sans SC", sans-serif`;
  ctx.fillText(r.label, x + 12, y + 30);

  // 底部简洁容量条
  const barY = y + h - 18;
  ctx.fillStyle = isPro ? "rgba(250,245,235,0.22)" : "rgba(35,84,54,0.14)";
  ctx.fillRect(x + 12, barY, Math.max(20, w - 24), 5);
  ctx.fillStyle = isPro ? PAL.goldSun : PAL.forest;
  ctx.fillRect(x + 12, barY, Math.max(12, (w - 24) * (isPro ? 0.86 : 0.46)), 5);
  ctx.restore();
}

// 画出模块右下角的轻巧跨栏提示徽章
function drawMovePill(ctx, r, hovered) {
  if (r.w < 78) return;
  const txt = r.side === "left" ? "点移右栏 →" : "← 点移左栏";
  ctx.save();
  ctx.font = `500 10px "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(txt).width;
  const pw = tw + 12;
  const ph = 18;
  const px = r.x + r.w - pw - 5;
  const py = r.y + r.h - ph - 5;
  roundRectPath(ctx, px, py, pw, ph, 3);
  ctx.fillStyle = hovered ? PAL.forest : "rgba(20, 23, 20, 0.72)";
  ctx.fill();
  ctx.fillStyle = "#FAF6EE";
  ctx.textBaseline = "middle";
  ctx.fillText(txt, px + 6, py + ph / 2 + 0.5);
  ctx.restore();
}

// 同步左侧原海报同款「二分圆徽标 SVG」
export function updateEmblem(svgEl, layout) {
  if (!svgEl || !layout) return;
  const { splitLeftPct, gutter, leftMassPct } = layout.metrics;
  const W = 280;
  const H = 148;
  // 留出视觉可见的真实中缝间隙（2px..34px 映射）
  const gap = clamp(Math.round((gutter / 92) * 34), 1, 34);
  const avail = W - gap;
  const leftW = Math.round((avail * splitLeftPct) / 100);
  const rightX = leftW + gap;
  const rightW = W - rightX;
  const cx = leftW + gap / 2;
  const cy = H / 2;
  // 圆心随视觉重心偏移微动，直观映射左右轻重！
  const massShift = clamp((50 - leftMassPct) * 0.45, -18, 18);
  const circleCx = clamp(cx + massShift, 54, W - 54);
  const circleR = 46;

  const leftRect = svgEl.querySelector("[data-emblem-left]");
  const rightRect = svgEl.querySelector("[data-emblem-right]");
  const circleEl = svgEl.querySelector("[data-emblem-circle]");
  const seamLine = svgEl.querySelector("[data-emblem-seam]");
  const massDot = svgEl.querySelector("[data-emblem-mass]");

  if (leftRect) leftRect.setAttribute("width", String(leftW));
  if (rightRect) {
    rightRect.setAttribute("x", String(rightX));
    rightRect.setAttribute("width", String(rightW));
  }
  if (circleEl) circleEl.setAttribute("cx", String(circleCx.toFixed(1)));
  if (seamLine) {
    seamLine.setAttribute("x1", String(cx.toFixed(1)));
    seamLine.setAttribute("x2", String(cx.toFixed(1)));
    seamLine.setAttribute("stroke", layout.rules.scan.ok ? "#1F4B2F" : "#B63322");
  }
  if (massDot) {
    massDot.setAttribute("cx", String(circleCx.toFixed(1)));
    massDot.setAttribute("fill", layout.allPass ? "#1E6B45" : "#B63322");
  }
}

export function createHeroStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 760;
  let cssH = 470;
  let dpr = 1;
  let layout = null;
  let hoveredArtId = null;
  let hoverTarget = "none"; // "spine" | "rightTop" | "art" | "none"
  let dragMode = null; // "spine" | "rightTop"
  let dragStart = null;
  let dragMoved = false;
  let activePointerId = null;
  let touchLock = null; // null | "x" | "y"
  let animSplit = getState().split;
  let animGutter = getState().gutter;
  let animOffsetY = getState().offsetY;
  let introStart = -1;
  let lastSnapLabel = null;
  let snapFlash = 0;
  let dirty = true;
  let lastDrawKey = "";
  const widthCache = new Map();

  function cachedWidth(font, text) {
    const k = font + "|" + text;
    let w = widthCache.get(k);
    if (w === undefined) {
      ctx.font = font;
      w = ctx.measureText(text).width;
      if (widthCache.size > 200) widthCache.clear();
      widthCache.set(k, w);
    }
    return w;
  }

  function measureSize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = Math.round(rect.width);
    cssH = Math.round(rect.height);
    // 手机窄屏像素比上限 1.5（遵循 GUIDE.md 性能规范），桌面端保持 2
    dpr = pixelRatio(cssW < 500 ? 1.5 : 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      dirty = true;
    }
  }

  measureSize();

  function renderFrame(t, dt, { still }) {
    if (!canvas.width || !canvas.height) measureSize();
    const st = getState();
    const prevSplit = animSplit;
    const prevGutter = animGutter;
    const prevOffset = animOffsetY;

    if (still) {
      animSplit = st.split;
      animGutter = st.gutter;
      animOffsetY = st.offsetY;
      snapFlash = 0;
    } else {
      const k = dt > 0 ? 1 - Math.exp(-dt * 18) : 1;
      animSplit += (st.split - animSplit) * k;
      animGutter += (st.gutter - animGutter) * k;
      animOffsetY += (st.offsetY - animOffsetY) * k;
      if (Math.abs(st.split - animSplit) < 0.0004) animSplit = st.split;
      if (Math.abs(st.gutter - animGutter) < 0.15) animGutter = st.gutter;
      if (Math.abs(st.offsetY - animOffsetY) < 0.15) animOffsetY = st.offsetY;
      if (snapFlash > 0) snapFlash = Math.max(0, snapFlash - dt * 2.2);
    }

    if (introStart < 0) introStart = t;
    const intro = still ? 1 : clamp((t - introStart) / 0.55, 0.25, 1);

    const hasFlowDot = !still && st.showGuides && layout && layout.rules.scan.ok && layout.rules.align.ok;
    const moving =
      dirty ||
      intro < 1 ||
      snapFlash > 0 ||
      hasFlowDot ||
      Math.abs(animSplit - prevSplit) > 0.0001 ||
      Math.abs(animGutter - prevGutter) > 0.05 ||
      Math.abs(animOffsetY - prevOffset) > 0.05;

    const stateKey = `${st.scenario}|${animSplit.toFixed(4)}|${Math.round(animGutter)}|${Math.round(animOffsetY)}|${st.hierarchy}|${st.artASide}|${st.artBSide}|${st.showGuides}|${st.focusRule}|${hoveredArtId}|${hoverTarget}|${dragMode}|${cssW}x${cssH}`;
    if (!moving && stateKey === lastDrawKey) return;
    lastDrawKey = stateKey;
    dirty = false;

    const drawState = {
      ...st,
      split: animSplit,
      gutter: Math.round(animGutter),
      offsetY: Math.round(animOffsetY),
    };
    layout = computeLayout(drawState, cssW, cssH);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖米画纸底面 + 极细网格呼吸线
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 顶沿双栏标尺槽
    const rulerH = cssW < 480 ? 28 : 32;
    ctx.fillStyle = "#F2E9D8";
    ctx.fillRect(0, 0, cssW, rulerH);
    ctx.strokeStyle = PAL.ruleSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerH + 0.5);
    ctx.lineTo(cssW, rulerH + 0.5);
    ctx.stroke();

    // 标尺上的实时左右栏宽百分比与中缝像素读数
    const { leftX, leftW, rightX, rightW, drawnGutter, dividerX, leftCol, rightCol, metrics, rules } = layout;
    const monoFont = cssW < 480 ? `600 10px "IBM Plex Mono", monospace` : `600 11px "IBM Plex Mono", monospace`;
    ctx.font = monoFont;
    ctx.textBaseline = "middle";

    // 左栏标尺文字
    const gapText = `缝 ${st.gutter}px`;
    const gw = cachedWidth(monoFont, gapText) + 12;
    const gx = clamp(dividerX - gw / 2, 6, cssW - gw - 6);
    const leftLblX = clamp(leftX + leftW / 2, 32, Math.max(32, gx - 34));
    const rightLblX = clamp(rightX + rightW / 2, Math.min(cssW - 32, gx + gw + 34), cssW - 32);

    ctx.fillStyle = !rules.balance.ok && metrics.splitLeftPct < 34 ? PAL.err : PAL.forestDeep;
    ctx.textAlign = "center";
    ctx.fillText(`左栏 ${metrics.splitLeftPct}%`, leftLblX, rulerH / 2 + 0.5);

    // 右栏标尺文字
    ctx.fillStyle = !rules.balance.ok && metrics.splitRightPct < 34 ? PAL.err : PAL.ink;
    ctx.fillText(`右栏 ${metrics.splitRightPct}%`, rightLblX, rulerH / 2 + 0.5);

    // 中缝标尺胶囊
    roundRectPath(ctx, gx, 5, gw, rulerH - 10, 3);
    ctx.fillStyle = rules.scan.ok ? PAL.forest : PAL.err;
    ctx.fill();
    ctx.fillStyle = "#FAF6EE";
    ctx.fillText(gapText, gx + gw / 2, rulerH / 2 + 0.5);
    ctx.textAlign = "left";

    // 2. 栏间中缝视觉带（过窄红晕 / 过宽虚线荒沟 / 合适极浅豆青河道）
    const seamTop = rulerH + 1;
    const seamBottom = cssH - 28;
    if (drawnGutter > 0) {
      if (!rules.scan.ok && st.gutter < 16) {
        ctx.fillStyle = PAL.errTint;
        ctx.fillRect(leftX + leftW, seamTop, drawnGutter, seamBottom - seamTop);
      } else if (!rules.scan.ok && st.gutter > 68) {
        ctx.fillStyle = "rgba(182, 51, 34, 0.08)";
        ctx.fillRect(leftX + leftW, seamTop, drawnGutter, seamBottom - seamTop);
        // 割裂斜纹提醒
        ctx.save();
        ctx.beginPath();
        ctx.rect(leftX + leftW, seamTop, drawnGutter, seamBottom - seamTop);
        ctx.clip();
        ctx.strokeStyle = "rgba(182, 51, 34, 0.16)";
        ctx.lineWidth = 1;
        for (let sx = leftX + leftW - (seamBottom - seamTop); sx < rightX + 40; sx += 14) {
          ctx.beginPath();
          ctx.moveTo(sx, seamTop);
          ctx.lineTo(sx + (seamBottom - seamTop), seamBottom);
          ctx.stroke();
        }
        ctx.restore();
      } else if (st.showGuides) {
        ctx.fillStyle = "rgba(177, 195, 166, 0.16)";
        ctx.fillRect(leftX + leftW, seamTop, drawnGutter, seamBottom - seamTop);
      }
    }

    // 中央脊线（原海报 1px 细灰竖线 + 可拖脊线把手）
    ctx.save();
    ctx.strokeStyle = dragMode === "spine" || hoverTarget === "spine" ? PAL.forest : rules.scan.ok ? PAL.rule : PAL.err;
    ctx.lineWidth = dragMode === "spine" || hoverTarget === "spine" ? 2 : 1;
    if (!rules.scan.ok) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(dividerX, seamTop + 4);
    ctx.lineTo(dividerX, seamBottom - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 3. 顶沿对齐基线辅助线
    const focusAlign = st.focusRule === "align" || dragMode === "rightTop" || hoverTarget === "rightTop" || !rules.align.ok;
    if (st.showGuides || focusAlign) {
      ctx.save();
      ctx.strokeStyle = rules.align.ok ? "rgba(30, 107, 69, 0.38)" : "rgba(182, 51, 34, 0.65)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      // 左栏顶沿基准线贯通至右栏
      ctx.beginPath();
      ctx.moveTo(leftX - 8, layout.leftTopY + 0.5);
      ctx.lineTo(rightX + rightW + 8, layout.leftTopY + 0.5);
      ctx.stroke();
      if (!rules.align.ok) {
        // 右栏当前顶沿线
        ctx.beginPath();
        ctx.moveTo(rightX - 6, layout.rightTopY + 0.5);
        ctx.lineTo(rightX + rightW + 8, layout.rightTopY + 0.5);
        ctx.stroke();
        // 右缘极简错顶垂直标尺（合并为一个清晰可拖胶囊，避免文字遮挡）
        const dimX = rightX + rightW + 3;
        ctx.setLineDash([]);
        ctx.strokeStyle = PAL.err;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(dimX, layout.leftTopY);
        ctx.lineTo(dimX, layout.rightTopY);
        ctx.moveTo(dimX - 4, layout.leftTopY);
        ctx.lineTo(dimX + 4, layout.leftTopY);
        ctx.moveTo(dimX - 4, layout.rightTopY);
        ctx.lineTo(dimX + 4, layout.rightTopY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 绘制左右两栏内容（柔和剪裁保护，不越出底部配重条）
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, rulerH + 1, cssW, Math.max(40, seamBottom - rulerH - 2));
    ctx.clip();

    const drawCol = (col, isLeft) => {
      const colAlpha = intro;
      ctx.save();
      ctx.globalAlpha = colAlpha;
      const translateY = (1 - intro) * (isLeft ? 8 : 14);
      ctx.translate(0, translateY);

      // 当栏宽被挤碎时给轻微红色边框警示
      const crushed = (isLeft && metrics.splitLeftPct < 34) || (!isLeft && metrics.splitRightPct < 34);
      if (crushed) {
        ctx.fillStyle = "rgba(182, 51, 34, 0.055)";
        ctx.fillRect(col.x - 4, col.y - 4, col.w + 8, Math.min(col.h + 8, seamBottom - col.y));
      }

      for (const item of col.items) {
        if (item.kind === "kicker") {
          ctx.font = `600 ${cssW < 480 ? 9.5 : 10.5}px "Sora", "Noto Sans SC", sans-serif`;
          ctx.fillStyle = isLeft ? PAL.forest : PAL.inkSub;
          ctx.textBaseline = "top";
          ctx.fillText(item.text, item.x, item.y);
        } else if (item.kind === "title") {
          const isEn = /^[A-Z0-9\s]+$/.test(item.lines.join(""));
          ctx.font = `${item.weight} ${item.size}px ${isEn ? '"Sora", sans-serif' : '"Noto Sans SC", sans-serif'}`;
          ctx.fillStyle = isLeft ? PAL.forest : PAL.ink;
          ctx.textBaseline = "top";
          item.lines.forEach((ln, idx) => {
            ctx.fillText(ln, item.x, item.y + idx * item.lineH);
          });
        } else if (item.kind === "bar") {
          ctx.fillStyle = PAL.forest;
          ctx.fillRect(item.x, item.y, item.w, item.h);
        } else if (item.kind === "lead") {
          ctx.font = `${item.weight} ${item.size}px "Noto Sans SC", "Sora", sans-serif`;
          ctx.fillStyle = st.hierarchy === "clash" ? PAL.ink : "#2A302A";
          ctx.textBaseline = "top";
          item.lines.forEach((ln, idx) => {
            ctx.fillText(ln, item.x, item.y + idx * item.lineH);
          });
        } else if (item.kind === "art") {
          const isHov = hoveredArtId === item.artId;
          if (item.artKind === "arch") drawArchLandscape(ctx, item, isHov);
          else if (item.artKind === "geo") drawGeoCard(ctx, item, isHov);
          else if (item.artKind === "priceA") drawPriceCard(ctx, item, false, isHov);
          else drawPriceCard(ctx, item, true, isHov);
          drawMovePill(ctx, item, isHov);
        } else if (item.kind === "bullets") {
          ctx.font = `500 ${item.size}px "Noto Sans SC", "Sora", sans-serif`;
          ctx.textBaseline = "top";
          for (const b of item.list) {
            ctx.fillStyle = PAL.forest;
            ctx.beginPath();
            ctx.arc(item.x + 4, b.y + b.lineH * 0.45, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#222922";
            b.lines.forEach((ln, idx) => {
              ctx.fillText(ln, item.x + 13, b.y + idx * b.lineH);
            });
          }
        }
      }
      ctx.restore();
    };

    drawCol(leftCol, true);
    drawCol(rightCol, false);

    // 5. 跨栏串行红虚弧 / 正常左→右扫视光迹（当开启辅助线或处于错态时）
    if (!rules.scan.ok && st.gutter < 16) {
      const leftLead = leftCol.items.find((i) => i.kind === "lead");
      const rightLead = rightCol.items.find((i) => i.kind === "lead");
      if (leftLead && rightLead) {
        ctx.save();
        ctx.strokeStyle = PAL.err;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        for (let li = 0; li < Math.min(2, leftLead.lines.length, rightLead.lines.length); li++) {
          const ly = leftLead.y + li * leftLead.lineH + leftLead.lineH * 0.5;
          const ry = rightLead.y + li * rightLead.lineH + rightLead.lineH * 0.5;
          ctx.beginPath();
          ctx.moveTo(leftX + leftW - 22, ly);
          ctx.quadraticCurveTo(dividerX, Math.min(ly, ry) - 9, rightX + 24, ry);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // 串行警示标牌放在中缝下方空白区，绝不遮盖右栏标题
        const warnTxt = "× 穿栏串行";
        const warnFont = `600 10px "Noto Sans SC", sans-serif`;
        ctx.font = warnFont;
        const ww = cachedWidth(warnFont, warnTxt) + 12;
        const wx = clamp(dividerX - ww - 10, leftX + 6, cssW - ww - 8);
        const wy = clamp(Math.max(leftLead.y, rightLead.y) + 28, rulerH + 46, seamBottom - 26);
        roundRectPath(ctx, wx, wy, ww, 18, 3);
        ctx.fillStyle = PAL.err;
        ctx.fill();
        ctx.fillStyle = "#FAF6EE";
        ctx.textBaseline = "middle";
        ctx.fillText(warnTxt, wx + 6, wy + 9.5);
        ctx.restore();
      }
    } else if (st.showGuides && rules.scan.ok && rules.align.ok) {
      // 顺畅的左→右浏览引导虚线 + 动态扫描微珠
      const ly = leftCol.titleStartY + 14;
      const ry = rightCol.titleStartY + 14;
      const lx0 = leftX + 6;
      const lx1 = leftX + Math.min(leftW - 10, 96);
      const rx0 = rightX + 6;
      const rx1 = rightX + Math.min(rightW - 10, 96);
      ctx.save();
      ctx.strokeStyle = "rgba(35, 84, 54, 0.34)";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(lx0, ly);
      ctx.lineTo(lx1, ly);
      ctx.lineTo(rx0, ry);
      ctx.lineTo(rx1, ry);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!still) {
        const phase = (t * 0.36) % 1;
        const pts = [
          [lx0, ly],
          [lx1, ly],
          [rx0, ry],
          [rx1, ry],
        ];
        const seg = phase * 3;
        const i = Math.min(2, Math.floor(seg));
        const f = seg - i;
        const px = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
        const py = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
        ctx.fillStyle = PAL.gold;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PAL.forestDeep;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore(); // end content clip

    // 6. 中央分栏可拖脊线拉钮（修长利落的植物建筑风竖向手柄，停在底缘清净处避免盖住右栏要点圆点）
    const knobW = drawnGutter < 14 ? 10 : 13;
    const knobH = cssH < 330 ? 26 : 34;
    const knobY = seamBottom - knobH / 2 - 6;
    ctx.save();
    roundRectPath(ctx, dividerX - knobW / 2, knobY - knobH / 2, knobW, knobH, knobW / 2);
    ctx.fillStyle = dragMode === "spine" || hoverTarget === "spine" ? PAL.forestDeep : PAL.forest;
    ctx.fill();
    ctx.strokeStyle = "#FBF6EC";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 两条极细竖握纹
    ctx.strokeStyle = "#FBF6EC";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(dividerX - 1.8, knobY - 5.5);
    ctx.lineTo(dividerX - 1.8, knobY + 5.5);
    ctx.moveTo(dividerX + 1.8, knobY - 5.5);
    ctx.lineTo(dividerX + 1.8, knobY + 5.5);
    ctx.stroke();
    ctx.restore();

    // 7. 右栏顶沿上下可拖对齐锚钮（单一清晰胶囊，稳停于错顶间隙中不盖字）
    const alignHandleX = clamp(rightX + rightW * 0.5, rightX + 42, cssW - 48);
    const alignHandleY = rules.align.ok
      ? clamp(layout.rightTopY - 12, rulerH + 11, seamBottom - 26)
      : st.offsetY > 0
        ? clamp(layout.leftTopY + (layout.rightTopY - layout.leftTopY) * 0.5, rulerH + 12, layout.rightTopY - 11)
        : clamp(layout.rightTopY - 12, rulerH + 11, seamBottom - 26);
    ctx.save();
    const ahText = rules.align.ok ? "↕ 顶沿齐平" : `↕ 错顶 ${st.offsetY > 0 ? "+" : ""}${st.offsetY}px`;
    const ahFont = `600 10px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.font = ahFont;
    const ahW = cachedWidth(ahFont, ahText) + 12;
    const ahH = 18;
    roundRectPath(ctx, alignHandleX - ahW / 2, alignHandleY - ahH / 2, ahW, ahH, 9);
    ctx.fillStyle = dragMode === "rightTop" || hoverTarget === "rightTop"
      ? PAL.gold
      : rules.align.ok
        ? "#E6EEE0"
        : PAL.err;
    ctx.fill();
    ctx.strokeStyle = rules.align.ok ? PAL.forest : "#FBF6EC";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = dragMode === "rightTop" || hoverTarget === "rightTop"
      ? PAL.ink
      : rules.align.ok
        ? PAL.forestDeep
        : "#FAF6EE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ahText, alignHandleX, alignHandleY + 0.5);
    ctx.textAlign = "left";
    ctx.restore();

    // 吸附成功时的轻提示（0.5s 淡出）
    if (snapFlash > 0 && lastSnapLabel) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, snapFlash);
      const stxt = `已吸附 ${lastSnapLabel}`;
      ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
      const sw = ctx.measureText(stxt).width + 16;
      const sx = clamp(dividerX - sw / 2, 10, cssW - sw - 10);
      roundRectPath(ctx, sx, knobY - knobH / 2 - 28, sw, 22, 4);
      ctx.fillStyle = PAL.forestDeep;
      ctx.fill();
      ctx.fillStyle = "#F5BA53";
      ctx.textBaseline = "middle";
      ctx.fillText(stxt, sx + 8, knobY - knobH / 2 - 17);
      ctx.restore();
    }

    // 8. 底部实测「视觉配重天平条」（原海报“平衡”天平隐喻的活体数据表达）
    const barTop = cssH - 28;
    ctx.fillStyle = "#F2E9D8";
    ctx.fillRect(0, barTop, cssW, 28);
    ctx.strokeStyle = PAL.ruleSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barTop + 0.5);
    ctx.lineTo(cssW, barTop + 0.5);
    ctx.stroke();

    const meterW = Math.min(200, Math.max(96, cssW * 0.34));
    const meterX = (cssW - meterW) / 2;
    const meterY = barTop + 14;
    // 天平轨道
    ctx.fillStyle = "#D9D2C0";
    roundRectPath(ctx, meterX, meterY - 3, meterW, 6, 3);
    ctx.fill();
    // 合理平衡区（38%–62%）
    ctx.fillStyle = "rgba(35, 84, 54, 0.28)";
    ctx.fillRect(meterX + meterW * 0.38, meterY - 3, meterW * 0.24, 6);
    // 中心刻度
    ctx.strokeStyle = PAL.forestDeep;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(meterX + meterW / 2, meterY - 6);
    ctx.lineTo(meterX + meterW / 2, meterY + 6);
    ctx.stroke();
    // 实测重心圆珠（左重→偏左，右重→偏右）
    const massRatio = (100 - metrics.leftMassPct) / 100; // leftMassPct=78 -> 0.22 (偏左)
    const dotX = meterX + clamp(massRatio, 0.06, 0.94) * meterW;
    ctx.fillStyle = rules.balance.ok ? PAL.forest : PAL.err;
    ctx.beginPath();
    ctx.arc(dotX, meterY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FBF6EC";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 左右配重数值标签
    ctx.font = `600 10.5px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = !rules.balance.ok && metrics.leftMassPct > 63 ? PAL.err : PAL.forestDeep;
    ctx.textAlign = "right";
    ctx.fillText(`左重 ${metrics.leftMassPct}%`, meterX - 10, meterY + 0.5);

    ctx.fillStyle = !rules.balance.ok && metrics.rightMassPct > 63 ? PAL.err : PAL.inkSub;
    ctx.textAlign = "left";
    ctx.fillText(`右重 ${metrics.rightMassPct}%`, meterX + meterW + 10, meterY + 0.5);

    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  // ---- 交互命中检测与事件绑定 ----
  function localPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitTest(pt) {
    if (!layout) return { kind: "none" };
    // 1. 右栏顶沿对齐把手
    const alignHandleX = clamp(layout.rightX + layout.rightW * 0.5, layout.rightX + 42, cssW - 48);
    const alignHandleY = layout.rules.align.ok
      ? clamp(layout.rightTopY - 12, 42, cssH - 54)
      : getState().offsetY > 0
        ? clamp(layout.leftTopY + (layout.rightTopY - layout.leftTopY) * 0.5, 42, layout.rightTopY - 11)
        : clamp(layout.rightTopY - 12, 42, cssH - 54);
    if (Math.abs(pt.x - alignHandleX) <= 46 && Math.abs(pt.y - alignHandleY) <= 16) {
      return { kind: "rightTop" };
    }
    // 2. 中央分栏脊线
    if (Math.abs(pt.x - layout.dividerX) <= 20) {
      return { kind: "spine" };
    }
    // 3. 画布内可跨栏调位的图块
    for (const col of [layout.leftCol, layout.rightCol]) {
      for (const ar of col.artRects) {
        if (pt.x >= ar.x && pt.x <= ar.x + ar.w && pt.y >= ar.y && pt.y <= ar.y + ar.h) {
          return { kind: "art", artId: ar.artId };
        }
      }
    }
    return { kind: "open" };
  }

  function applySpineAt(x) {
    if (!layout) return;
    const avail = Math.max(120, cssW - layout.padX * 2 - layout.drawnGutter);
    const raw = (x - layout.padX - layout.drawnGutter / 2) / avail;
    const res = snapSplit(raw, 0.018);
    if (res.snapped && res.snapped !== lastSnapLabel) {
      lastSnapLabel = res.snapped;
      snapFlash = 1.0;
    } else if (!res.snapped) {
      lastSnapLabel = null;
    }
    onMutate({ split: +res.value.toFixed(3) });
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = localPos(e);
    const hit = hitTest(pt);
    activePointerId = e.pointerId;
    dragStart = { x: pt.x, y: pt.y, offsetY: getState().offsetY, split: getState().split, hit };
    dragMoved = false;
    touchLock = null;

    if (hit.kind === "rightTop") {
      dragMode = "rightTop";
      canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    } else if (hit.kind === "spine") {
      dragMode = "spine";
      canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    } else {
      dragMode = "maybeSpine";
      if (e.pointerType !== "touch") {
        canvas.setPointerCapture?.(e.pointerId);
      }
    }
  }

  function onPointerMove(e) {
    const pt = localPos(e);
    if (activePointerId !== null && e.pointerId === activePointerId && dragStart) {
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;
      if (Math.hypot(dx, dy) > 5) dragMoved = true;

      if (dragMode === "rightTop") {
        const nextOff = clamp(Math.round(dragStart.offsetY + dy), -44, 48);
        const snapped = Math.abs(nextOff) <= 4 ? 0 : nextOff;
        onMutate({ offsetY: snapped });
        e.preventDefault();
        return;
      }

      if (dragMode === "spine") {
        applySpineAt(pt.x);
        e.preventDefault();
        return;
      }

      if (dragMode === "maybeSpine") {
        if (e.pointerType === "touch") return; // 触屏横拖由下方 touchmove 专用处理，避免重复触发
        if (dragMoved) {
          const avail = Math.max(120, cssW - (layout?.padX ?? 20) * 2 - (layout?.drawnGutter ?? 16));
          const raw = dragStart.split + dx / avail;
          const res = snapSplit(raw, 0.016);
          onMutate({ split: +res.value.toFixed(3) });
        }
        return;
      }
    }

    // 悬停光标反馈
    const hit = hitTest(pt);
    const nextHoverArt = hit.kind === "art" ? hit.artId : null;
    if (hit.kind !== hoverTarget || nextHoverArt !== hoveredArtId) {
      hoverTarget = hit.kind;
      hoveredArtId = nextHoverArt;
      canvas.style.cursor =
        hit.kind === "spine"
          ? "ew-resize"
          : hit.kind === "rightTop"
            ? "ns-resize"
            : hit.kind === "art"
              ? "pointer"
              : "ew-resize";
      dirty = true;
      ctrl.draw();
    }
  }

  function onPointerUp(e) {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    const hit = dragStart?.hit;
    if (!dragMoved && hit?.kind === "art") {
      const st = getState();
      if (hit.artId === "arch") {
        onMutate({ artASide: st.artASide === "left" ? "right" : "left" });
      } else if (hit.artId === "geo") {
        onMutate({ artBSide: st.artBSide === "left" ? "right" : "left" });
      }
    }
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch {}
    activePointerId = null;
    dragMode = null;
    dragStart = null;
    touchLock = null;
  }

  // 兼容 touch 事件（确保 perf.mjs 的 CDP Input.dispatchTouchEvent 顺滑触发重绘）
  let touchStartX = null;
  let touchStartY = null;
  let touchStartSplit = 0.5;
  let touchAxis = null;

  let touchRect = null;

  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    touchRect = canvas.getBoundingClientRect();
    touchStartX = e.touches[0].clientX - touchRect.left;
    touchStartY = e.touches[0].clientY - touchRect.top;
    touchStartSplit = getState().split;
    touchAxis = null;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length || touchStartX === null || !touchRect) return;
    const cx = e.touches[0].clientX - touchRect.left;
    const cy = e.touches[0].clientY - touchRect.top;
    const dx = cx - touchStartX;
    const dy = cy - touchStartY;
    if (!touchAxis && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (touchAxis === "x") {
      e.preventDefault();
      const avail = Math.max(120, cssW - (layout?.padX ?? 16) * 2 - (layout?.drawnGutter ?? 16));
      const raw = clamp(touchStartSplit + dx / avail, 0.22, 0.78);
      onMutate({ split: +raw.toFixed(3) }, { continuous: true });
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    touchStartX = null;
    touchAxis = null;
    touchRect = null;
    onMutate({}, { flush: true });
  }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  const ro = new ResizeObserver(() => {
    measureSize();
    dirty = true;
    ctrl.draw();
  });
  ro.observe(canvas);

  return {
    draw: () => {
      dirty = true;
      ctrl.draw();
    },
    getLayout: () => layout,
    getSize: () => ({ w: cssW, h: cssH }),
  };
}
