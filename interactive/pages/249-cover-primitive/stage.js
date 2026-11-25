// 249 封面原语 · 2D 活体封面构造台画布渲染器
// 1:1 承袭原海报暖米封面内页 (#EFE2D0)、1.5px 纯黑框 (#050604)、底部 90° 切角大黑圆与镉黄标尺 (#FCC810)
import { loop, pixelRatio } from "../../lib/stage.js";
import { THEMES, clamp, solveCover } from "./model.js";

const COLORS = {
  yellow: "#FCC810",
  yellowDeep: "#B88A00",
  yellowSoft: "rgba(252, 200, 16, 0.28)",
  yellowHatch: "rgba(218, 164, 0, 0.42)",
  cream: "#EFE2D0",
  creamLight: "#FAF5EC",
  draftBg: "#E6D8C2",
  draftGrid: "rgba(5, 6, 4, 0.06)",
  ink: "#050604",
  inkMuted: "#47453D",
  inkSoft: "rgba(5, 6, 4, 0.22)",
  red: "#B52417",
  redDark: "#8F180E",
  redFill: "rgba(181, 36, 23, 0.13)",
  green: "#0E6240",
  greenFill: "rgba(14, 98, 64, 0.12)",
  white: "#FFFDF8",
};

const FONT_SC = '"Noto Sans SC", sans-serif';
const FONT_EN = '"Chivo", "Noto Sans SC", sans-serif';
const FONT_MONO = '"IBM Plex Mono", monospace';

export function mountCoverStage({ canvas, getState, onPatch, onSyncLeaders }) {
  const ctx = canvas.getContext("2d");
  let w = 640;
  let h = 440;
  let dpr = 1;

  // 平滑插值态（确保横拖与切换顺滑 60fps，still 模式下直接到位）
  let animIntro = 0;
  let smoothH = getState().containerH;
  let smoothPad = getState().padding;
  let smoothRatio = getState().titleRatio;
  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartH = 340;
  let touchAxis = null; // "x" | "y" | null
  let hitZones = [];
  let hoverId = null;
  let dirty = true;
  let lastSolved = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    // 移动端限 1.5 DPR 保软件渲染高帧率，桌面限 2 DPR
    dpr = pixelRatio(w < 500 ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    dirty = true;
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function drawHatch(x, y, rw, rh, stroke, step = 10) {
    if (rw <= 2 || rh <= 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, rw, rh);
    ctx.clip();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let d = -rh; d < rw + rh; d += step) {
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d - rh, y + rh);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawNotchedBlackCircle(cx, cy, radius, bgColor, alpha = 1) {
    if (radius < 12) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    // 严格正圆（等比半径，绝不在任何屏宽压成椭圆）
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 1:1 复刻原海报底部 90° 向上切角（顶点精确落在圆心 cx, cy）
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - radius * 1.04, cy + radius * 1.04);
    ctx.lineTo(cx + radius * 1.04, cy + radius * 1.04);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSpringArrow(x, y0, y1, label, color) {
    const span = y1 - y0;
    if (span < 10) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x, y0 + 3);
    ctx.lineTo(x, y1 - 3);
    ctx.stroke();

    // 顶部小三角与底部小三角
    const a = 4;
    ctx.beginPath();
    ctx.moveTo(x, y0 + 2);
    ctx.lineTo(x - a, y0 + 2 + a * 1.3);
    ctx.lineTo(x + a, y0 + 2 + a * 1.3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y1 - 2);
    ctx.lineTo(x - a, y1 - 2 - a * 1.3);
    ctx.lineTo(x + a, y1 - 2 - a * 1.3);
    ctx.closePath();
    ctx.fill();

    if (span >= 22 && label) {
      const mid = (y0 + y1) / 2;
      ctx.font = `600 10px ${FONT_MONO}`;
      const tw = ctx.measureText(label).width + 10;
      ctx.fillStyle = COLORS.creamLight;
      ctx.fillRect(x - tw / 2, mid - 8, tw, 16);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - tw / 2, mid - 8, tw, 16);
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, mid + 0.5);
    }
    ctx.restore();
  }

  function render(t, dt, { still }) {
    const state = getState();
    const theme = THEMES[state.theme] || THEMES.poster;

    // 优雅开场过渡（0.62s 走完，确保 0.9s 截图清晰稳定且不篡改初始错态）
    if (still) {
      animIntro = 1;
      smoothH = state.containerH;
      smoothPad = state.padding;
      smoothRatio = state.titleRatio;
    } else {
      const prevIntro = animIntro;
      animIntro = Math.min(1, animIntro + (dt > 0 ? dt / 0.62 : 0.04));
      const k = dt > 0 ? 1 - Math.exp(-dt * 16) : 1;
      const dh = state.containerH - smoothH;
      const dp = state.padding - smoothPad;
      const dr = state.titleRatio - smoothRatio;
      smoothH += Math.abs(dh) < 0.4 ? dh : dh * k;
      smoothPad += Math.abs(dp) < 0.25 ? dp : dp * k;
      smoothRatio += Math.abs(dr) < 0.01 ? dr : dr * k;

      const moving =
        dragging ||
        prevIntro < 1 ||
        Math.abs(dh) >= 0.4 ||
        Math.abs(dp) >= 0.25 ||
        Math.abs(dr) >= 0.01;

      if (!dirty && !moving) return;
      dirty = false;
    }

    const introEase = 1 - Math.pow(1 - animIntro, 3);
    const liveState = {
      ...state,
      containerH: smoothH,
      padding: smoothPad,
      titleRatio: smoothRatio,
    };
    const m = solveCover(liveState);
    lastSolved = m;
    hitZones = [];

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 绘图舱暖底 + 细工程网格
    ctx.fillStyle = COLORS.draftBg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = COLORS.draftGrid;
    ctx.lineWidth = 1;
    const gridStep = w < 440 ? 20 : 24;
    ctx.beginPath();
    for (let gx = gridStep; gx < w; gx += gridStep) {
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, h);
    }
    for (let gy = gridStep; gy < h; gy += gridStep) {
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(w, gy + 0.5);
    }
    ctx.stroke();

    // 2. 计算模拟 Cover 容器在画布里的真实几何框
    const compact = w < 440;
    const topMargin = compact ? 26 : 30;
    const bottomRailH = compact ? 38 : 42;
    const sidePadL = compact ? 14 : 22;
    const rulerW = compact ? 42 : 52;
    const availW = Math.max(180, w - sidePadL - rulerW - 10);
    const availH = Math.max(160, h - topMargin - bottomRailH - 12);

    // 把逻辑高度 260..760 映射到画布可用纵深（等比缩放系数 scaleY，保证容器伸缩肉眼直觉明显）
    const maxLogicalH = Math.max(760, m.renderedH + 20);
    const scaleY = availH / maxLogicalH;
    const boxH = clamp(Math.round(m.renderedH * scaleY), 118, availH);
    const boxW = availW;
    const boxX = sidePadL;
    const boxY = Math.round(topMargin + (availH - boxH) * 0.48);

    // 顶部标头：显示当前模拟规则摘要
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 ${compact ? 10 : 11}px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const modeTag = state.heightMode === "fixed"
      ? `height: ${m.containerH}px`
      : `min-block-size: ${m.containerH}px${m.expandedPx > 0 ? ` → ${m.renderedH}px` : ""}`;
    ctx.fillText(modeTag, boxX, topMargin * 0.52);

    ctx.textAlign = "right";
    ctx.fillStyle = m.score === 4 ? COLORS.green : COLORS.redDark;
    const topRightStat = m.overflowPx > 0
      ? `裁切 -${m.overflowPx}px`
      : `${m.totalElements} 项 · 字比 ${m.titleRatio.toFixed(1)}×`;
    ctx.fillText(topRightStat, boxX + boxW, topMargin * 0.52);

    // 3. 绘制 Cover 容器外框（暖米原纸 #EFE2D0 + 1.5px 纯黑框）
    ctx.save();
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // 如果有高度扩张（min-block-size 保护），用极细虚线标出原始 min-block-size 位置
    if (m.expandedPx > 0) {
      const minLineY = boxY + Math.round(m.containerH * scaleY);
      if (minLineY < boxY + boxH - 4) {
        ctx.save();
        ctx.strokeStyle = COLORS.green;
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boxX, minLineY + 0.5);
        ctx.lineTo(boxX + boxW, minLineY + 0.5);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 裁切容器内部绘制
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxW, boxH);
    ctx.clip();

    const pPx = Math.round(m.padding * scaleY);
    const innerX = boxX + Math.round(clamp(m.padding * 0.72, 0, boxW * 0.16));
    const innerW = Math.max(120, boxW - 2 * (innerX - boxX));

    // 3a. 内边距护边 X 光带
    if (state.xray && pPx >= 2) {
      const padWarn = m.padRatio > 0.34;
      const padColor = padWarn ? "rgba(181, 36, 23, 0.14)" : "rgba(5, 6, 4, 0.05)";
      ctx.fillStyle = padColor;
      ctx.fillRect(boxX, boxY, boxW, pPx);
      ctx.fillRect(boxX, boxY + boxH - pPx, boxW, pPx);
      ctx.fillRect(boxX, boxY + pPx, innerX - boxX, Math.max(0, boxH - 2 * pPx));
      ctx.fillRect(innerX + innerW, boxY + pPx, boxX + boxW - (innerX + innerW), Math.max(0, boxH - 2 * pPx));

      ctx.strokeStyle = padWarn ? COLORS.red : "rgba(5, 6, 4, 0.18)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeRect(innerX + 0.5, boxY + pPx + 0.5, innerW - 1, Math.max(0, boxH - 2 * pPx - 1));
      ctx.setLineDash([]);
    }

    // 3b. 标志性底部 90° 切角大黑圆（严格正圆！居右侧绝不被文字背板咬缺）
    let circleLeftEdge = innerX + innerW;
    if (m.hasHero) {
      const heroR = m.rects.hero;
      const heroTopPx = boxY + heroR.y * scaleY;
      const heroBotPx = boxY + (heroR.y + heroR.h) * scaleY;
      const heroMidPx = (heroTopPx + heroBotPx) / 2;

      const maxRByH = Math.max(20, (boxH - 2 * pPx) * (state.theme === "poster" ? 0.36 : 0.28));
      const maxRByW = boxW * (compact ? 0.18 : state.theme === "poster" ? 0.215 : 0.175);
      const circleR = Math.min(maxRByW, maxRByH) * (0.86 + 0.14 * introEase);

      const circleCx = boxX + boxW - Math.max(pPx, 10) - circleR - (compact ? 4 : 10);
      const circleCy = clamp(
        heroMidPx - (state.theme === "poster" ? circleR * 0.04 : 0),
        boxY + pPx + circleR + (m.hasTop ? 20 : 4),
        boxY + boxH - pPx - circleR * 0.68
      );
      circleLeftEdge = circleCx - circleR - 10;

      // 根据题材微调几何标识（全部以原海报切角黑圆为视觉母题）
      const emblemAlpha = state.theme === "poster" ? 1 : 0.92;
      drawNotchedBlackCircle(circleCx, circleCy, circleR, COLORS.cream, emblemAlpha);

      if (state.theme === "web") {
        // 专题入口：在黑圆外加一道细黄工程环，强调屏幕取景
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(circleCx, circleCy, circleR * 0.62, -Math.PI * 0.85, Math.PI * 0.15);
        ctx.stroke();
      } else if (state.theme === "card") {
        // 卡片封面：中心落一枚镉黄小三角
        ctx.fillStyle = COLORS.yellow;
        const tr = circleR * 0.24;
        ctx.beginPath();
        ctx.moveTo(circleCx, circleCy - tr * 1.45);
        ctx.lineTo(circleCx - tr * 0.9, circleCy - tr * 0.25);
        ctx.lineTo(circleCx + tr * 0.9, circleCy - tr * 0.25);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 3c. Flexbox 自由空间 X 光带（margin-block: auto 黄金弹簧 vs 顶堆死空）
    if (state.xray && m.hasHero) {
      const heroR = m.rects.hero;
      const heroTopPx = boxY + heroR.y * scaleY;
      const heroBotPx = boxY + (heroR.y + heroR.h) * scaleY;

      if (state.centerMode === "auto") {
        const spTopPx = Math.round(m.springTop * scaleY);
        const spBotPx = Math.round(m.springBottom * scaleY);
        if (spTopPx >= 8) {
          const sy = heroTopPx - spTopPx;
          ctx.fillStyle = COLORS.yellowSoft;
          ctx.fillRect(innerX, sy, innerW, spTopPx);
          drawHatch(innerX, sy, innerW, spTopPx, COLORS.yellowHatch, 11);
          drawSpringArrow(
            innerX + innerW * 0.28,
            sy,
            heroTopPx,
            `auto ${m.springTop}px`,
            COLORS.yellowDeep
          );
        }
        if (spBotPx >= 8) {
          ctx.fillStyle = COLORS.yellowSoft;
          ctx.fillRect(innerX, heroBotPx, innerW, spBotPx);
          drawHatch(innerX, heroBotPx, innerW, spBotPx, COLORS.yellowHatch, 11);
          drawSpringArrow(
            innerX + innerW * 0.28,
            heroBotPx,
            heroBotPx + spBotPx,
            `auto ${m.springBottom}px`,
            COLORS.yellowDeep
          );
        }
      } else if (state.centerMode === "start" && m.deadBottomVoid >= 24) {
        const voidPx = Math.round(m.deadBottomVoid * scaleY);
        const vy = boxY + boxH - pPx - voidPx;
        if (voidPx >= 14) {
          ctx.fillStyle = "rgba(181, 36, 23, 0.08)";
          ctx.fillRect(innerX, vy, innerW, voidPx);
          drawHatch(innerX, vy, innerW, voidPx, "rgba(181, 36, 23, 0.28)", 12);
          ctx.fillStyle = COLORS.redDark;
          ctx.font = `600 10px ${FONT_MONO}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`未分配死空 · ${m.deadBottomVoid}px`, innerX + innerW / 2, vy + voidPx / 2);
        }
      }
    }

    // 3d. 绘制真实内容槽：Top / Hero / Bottom
    const hl = state.focusPillar;

    // 顶部入口槽 (Top / ENTRY)
    if (m.rects.top) {
      const ty = boxY + m.rects.top.y * scaleY;
      const th = Math.max(18, m.rects.top.h * scaleY);
      if (hl === "entry") {
        ctx.fillStyle = "rgba(252, 200, 16, 0.35)";
        ctx.fillRect(innerX - 4, ty - 2, innerW + 8, th + 4);
      }
      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${compact ? 9.5 : 10.5}px ${FONT_EN}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(theme.topLeft, innerX, ty + th * 0.5);

      if (!state.clutter.badge) {
        ctx.textAlign = "right";
        ctx.font = `600 ${compact ? 9.5 : 10}px ${FONT_MONO}`;
        ctx.fillStyle = COLORS.inkMuted;
        ctx.fillText(theme.topRight, innerX + innerW, ty + th * 0.5);
      }

      ctx.strokeStyle = "rgba(5, 6, 4, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(innerX, ty + th - 1);
      ctx.lineTo(innerX + innerW, ty + th - 1);
      ctx.stroke();
    }

    // 核心主元素槽 (Principal / HERO)
    if (m.rects.hero) {
      const hy = boxY + m.rects.hero.y * scaleY;
      const hh = Math.max(26, m.rects.hero.h * scaleY);
      const slideX = (1 - introEase) * -10;

      if (hl === "hero") {
        ctx.fillStyle = "rgba(252, 200, 16, 0.32)";
        ctx.fillRect(innerX - 4, hy - 3, innerW * 0.68, hh + 6);
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(innerX - 4, hy - 3, innerW * 0.68, hh + 6);
      }

      // 缩放后的视觉字号（精确反映 titleRatio 变化，并严格限制在 hero 槽高内不与下方杂件重叠）
      const slotScale = clamp(hh / 76, 0.72, 1.15);
      const visualBody = Math.max(9.5, Math.round((compact ? 10 : 11) * Math.min(1, slotScale)));
      const visualTitle = clamp(
        Math.round(visualBody * m.titleRatio * (compact ? 0.84 : 0.92)),
        11.5,
        compact ? 26 : 36
      );
      const maxStepBySlot = Math.max(12, Math.floor((hh - visualBody - 14) / m.titleLines));
      const lineStep = Math.min(Math.round(visualTitle * 1.14), maxStepBySlot);

      ctx.save();
      ctx.beginPath();
      ctx.rect(innerX - 2, hy - 2, innerW + 4, hh + 4);
      ctx.clip();
      ctx.translate(slideX, 0);

      // 文本区宽度严格停在黑圆左侧之前（巨字爆框试错时才允许横扫全宽）
      const cleanColW = Math.max(118, circleLeftEdge - innerX);
      const textColW = m.titleRatio > 3.8 ? innerW * 0.92 : Math.min(innerW * 0.62, cleanColW);

      ctx.fillStyle = COLORS.ink;
      ctx.font = `900 ${visualTitle}px ${FONT_SC}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const headlineLines =
        m.titleLines >= 4
          ? ["封面不是", "装饰，而是", "整个结构的", "核心起点。"]
          : m.titleLines === 3
            ? ["封面不是装饰，", "而是结构的", "清晰起点。"]
            : theme.headline;

      let textY = hy + 2;
      headlineLines.forEach((ln) => {
        ctx.fillText(ln, innerX, textY, textColW);
        textY += lineStep;
      });

      // 原海报标志性短镉黄横杠
      const barY = Math.min(textY + 2, hy + hh - visualBody - 7);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(innerX, barY, 26, 3);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 0.6;
      ctx.strokeRect(innerX, barY, 26, 3);

      // 副标说明行
      const subY = barY + 6;
      if (subY + visualBody <= hy + hh + 2) {
        ctx.fillStyle = COLORS.inkMuted;
        ctx.font = `500 ${visualBody}px ${FONT_SC}`;
        ctx.fillText(theme.subline, innerX, subY, textColW);
      }
      ctx.restore();
    } else {
      // 误删主标题空壳警示
      const midY = boxY + boxH * 0.5;
      ctx.strokeStyle = COLORS.red;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(innerX + 10, midY - 24, innerW - 20, 48);
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.redDark;
      ctx.font = `700 12px ${FONT_SC}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 主标题已被删除 · 封面失去主题主角", innerX + innerW / 2, midY);
    }

    // 底部信息预告槽 (Bottom / HIERARCHY)
    if (m.rects.bottom) {
      const by = boxY + m.rects.bottom.y * scaleY;
      const bh = Math.max(20, m.rects.bottom.h * scaleY);
      if (hl === "hierarchy") {
        ctx.fillStyle = "rgba(252, 200, 16, 0.38)";
        ctx.fillRect(innerX - 4, by - 2, innerW + 8, bh + 4);
      }
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(innerX, by + 1);
      ctx.lineTo(innerX + innerW, by + 1);
      ctx.stroke();

      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${compact ? 10 : 11.5}px ${FONT_SC}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(theme.bottomText, innerX, by + bh * 0.56, innerW - 28);

      ctx.font = `700 14px ${FONT_EN}`;
      ctx.textAlign = "right";
      ctx.fillText(theme.bottomCue, innerX + innerW, by + bh * 0.56);
    }

    // 3e. 绘制可直接点击剥离的 3 处红色冗余杂件（Clutter Chips）
    if (state.clutter.badge) {
      const bw = compact ? 106 : 124;
      const bh = 24;
      const bx = boxX + boxW - bw - Math.max(6, innerX - boxX);
      const by = boxY + Math.max(6, pPx);
      const isHover = hoverId === "clutter-badge";
      ctx.fillStyle = isHover ? COLORS.redDark : COLORS.red;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = COLORS.white;
      ctx.font = `700 10px ${FONT_SC}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`× ${theme.clutterBadge}`, bx + bw / 2, by + bh / 2 + 0.5, bw - 8);
      hitZones.push({ id: "clutter-badge", x: bx, y: by, w: bw, h: bh, action: "strip-badge" });
    }

    if (state.clutter.card && m.rects["clutter-card"]) {
      const cy = boxY + m.rects["clutter-card"].y * scaleY;
      const ch = Math.max(24, m.rects["clutter-card"].h * scaleY);
      const isHover = hoverId === "clutter-card";
      ctx.fillStyle = isHover ? "rgba(181, 36, 23, 0.22)" : COLORS.redFill;
      ctx.fillRect(innerX, cy, innerW, ch);
      ctx.strokeStyle = COLORS.red;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(innerX + 0.5, cy + 0.5, innerW - 1, ch - 1);
      ctx.setLineDash([]);

      ctx.fillStyle = COLORS.redDark;
      ctx.font = `700 ${compact ? 10 : 11}px ${FONT_SC}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`× ${theme.clutterCard}`, innerX + 8, cy + ch / 2, innerW - 64);

      // 右侧小点剥标签
      const pillW = 48;
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(innerX + innerW - pillW - 4, cy + (ch - 18) / 2, pillW, 18);
      ctx.fillStyle = COLORS.white;
      ctx.font = `700 10px ${FONT_SC}`;
      ctx.textAlign = "center";
      ctx.fillText("点剥离", innerX + innerW - pillW / 2 - 4, cy + ch / 2 + 0.5);

      hitZones.push({ id: "clutter-card", x: innerX, y: cy, w: innerW, h: ch, action: "strip-card" });
    }

    if (state.clutter.actions && m.rects["clutter-actions"]) {
      const ay = boxY + m.rects["clutter-actions"].y * scaleY;
      const ah = Math.max(22, m.rects["clutter-actions"].h * scaleY);
      const isHover = hoverId === "clutter-actions";
      ctx.fillStyle = isHover ? "rgba(181, 36, 23, 0.22)" : COLORS.redFill;
      ctx.fillRect(innerX, ay, innerW, ah);
      ctx.strokeStyle = COLORS.red;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(innerX + 0.5, ay + 0.5, innerW - 1, ah - 1);
      ctx.setLineDash([]);

      const btnW = Math.min(72, (innerW - 76) / 3);
      theme.clutterActions.forEach((lbl, i) => {
        const bx = innerX + 6 + i * (btnW + 6);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(bx, ay + 3, btnW, ah - 6);
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, ay + 3, btnW, ah - 6);
        ctx.fillStyle = COLORS.redDark;
        ctx.font = `700 9.5px ${FONT_SC}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, bx + btnW / 2, ay + ah / 2 + 0.5, btnW - 4);
      });

      const pillW = 48;
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(innerX + innerW - pillW - 4, ay + (ah - 18) / 2, pillW, 18);
      ctx.fillStyle = COLORS.white;
      ctx.font = `700 10px ${FONT_SC}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("点剥离", innerX + innerW - pillW / 2 - 4, ay + ah / 2 + 0.5);

      hitZones.push({ id: "clutter-actions", x: innerX, y: ay, w: innerW, h: ah, action: "strip-actions" });
    }

    ctx.restore(); // 结束容器裁切

    // 3f. 1.5px 纯黑封面边框（若零边距或裁切，底/四周叠加醒目预警线）
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    // 零边距贴框提示
    if (m.padding < 14) {
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(boxX + 1.5, boxY + 1.5, boxW - 3, boxH - 3);
      ctx.setLineDash([]);
    }

    // 固定高度截断警示带（画在容器底沿外侧，点击即修复为 min-block-size）
    if (m.overflowPx > 0) {
      const barH = 22;
      const barY = Math.min(boxY + boxH - 4, h - bottomRailH - barH - 4);
      const isHover = hoverId === "fix-clip";
      ctx.fillStyle = isHover ? COLORS.redDark : COLORS.red;
      ctx.fillRect(boxX, barY, boxW, barH);
      ctx.fillStyle = COLORS.white;
      ctx.font = `700 ${compact ? 10 : 11}px ${FONT_SC}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `× 固定 height 裁掉底沿 ${m.overflowPx}px · 点此切换 min-block-size`,
        boxX + boxW / 2,
        barY + barH / 2 + 0.5,
        boxW - 12
      );
      hitZones.push({ id: "fix-clip", x: boxX, y: barY, w: boxW, h: barH, action: "fix-min" });
    }

    // 4. 右侧垂直高度标尺（直观反映容器当前高度像素）
    const rx = boxX + boxW + 10;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(rx, boxY);
    ctx.lineTo(rx + 8, boxY);
    ctx.moveTo(rx + 4, boxY);
    ctx.lineTo(rx + 4, boxY + boxH);
    ctx.moveTo(rx, boxY + boxH);
    ctx.lineTo(rx + 8, boxY + boxH);
    ctx.stroke();

    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 10px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${m.renderedH}`, rx + 11, boxY + boxH / 2 - 5);
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = `500 9.5px ${FONT_MONO}`;
    ctx.fillText("px", rx + 11, boxY + boxH / 2 + 7);

    // 5. 底部横拖高度游标尺（直接横拖整个画布或游标均可丝滑改变容器高度！）
    const railY = h - bottomRailH + 14;
    const railX0 = boxX;
    const railX1 = boxX + boxW;
    const railW = railX1 - railX0;
    const norm = (m.containerH - 260) / (760 - 260);
    const thumbX = railX0 + clamp(norm, 0, 1) * railW;

    ctx.strokeStyle = COLORS.inkSoft;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(railX0, railY);
    ctx.lineTo(railX1, railY);
    ctx.stroke();

    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(railX0, railY);
    ctx.lineTo(thumbX, railY);
    ctx.stroke();

    // 刻度记号（260 / 380 卡片 / 520 标准 / 760 竖屏）
    [260, 380, 520, 760].forEach((val) => {
      const tx = railX0 + ((val - 260) / 500) * railW;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(tx - 0.5, railY - 4, 1, 8);
    });

    // 镉黄黑框直角滑块
    const tw = compact ? 52 : 62;
    const th = 20;
    ctx.fillStyle = dragging ? COLORS.ink : COLORS.yellow;
    ctx.fillRect(clamp(thumbX - tw / 2, railX0, railX1 - tw), railY - th / 2, tw, th);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(clamp(thumbX - tw / 2, railX0, railX1 - tw), railY - th / 2, tw, th);

    ctx.fillStyle = dragging ? COLORS.yellow : COLORS.ink;
    ctx.font = `700 10px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const clampedCenter = clamp(thumbX, railX0 + tw / 2, railX1 - tw / 2);
    ctx.fillText(`↔ ${m.containerH}`, clampedCenter, railY + 0.5);

    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = `500 ${compact ? 9.5 : 10.5}px ${FONT_SC}`;
    ctx.textAlign = "left";
    ctx.fillText("左右横拖画布伸缩封面高度 · 点红标剥离冗余 · 方向键微调", railX0, h - 8, railW);

    ctx.restore();
    ctx.restore();

    // 同步左侧 3 道原海报水平引线的真实目标 Y 比例
    if (onSyncLeaders) {
      const toPct = (logicalY) => clamp((boxY + logicalY * scaleY) / h, 0.14, 0.86);
      const topMid = m.rects.top ? m.rects.top.y + m.rects.top.h / 2 : m.padding + 18;
      const heroMid = m.rects.hero ? m.rects.hero.y + m.rects.hero.h / 2 : m.renderedH * 0.5;
      const botMid = m.rects.bottom
        ? m.rects.bottom.y + m.rects.bottom.h / 2
        : m.renderedH - m.padding - 18;
      onSyncLeaders({
        entry: toPct(topMid),
        hero: toPct(heroMid),
        hierarchy: toPct(botMid),
        boxLeftPx: boxX,
      });
    }
  }

  function canvasPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function findHit(pt) {
    for (let i = hitZones.length - 1; i >= 0; i--) {
      const z = hitZones[i];
      if (pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) {
        return z;
      }
    }
    return null;
  }

  function triggerHit(hit) {
    const s = getState();
    if (hit.action === "strip-badge") {
      onPatch({ clutter: { ...s.clutter, badge: false } });
    } else if (hit.action === "strip-card") {
      onPatch({ clutter: { ...s.clutter, card: false } });
    } else if (hit.action === "strip-actions") {
      onPatch({ clutter: { ...s.clutter, actions: false } });
    } else if (hit.action === "fix-min") {
      onPatch({ heightMode: "min" });
    }
  }

  // 统一处理鼠标与触摸横拖（触屏竖向划动放行滚屏，横向拖动丝滑调高）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏走 touch 事件保证 perf.mjs dispatchTouchEvent 100% 命中
    dragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartH = getState().containerH;
    canvas.setPointerCapture?.(e.pointerId);
    dirty = true;
    ctrl.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = canvasPoint(e.clientX, e.clientY);
    if (!dragging) {
      const hit = findHit(pt);
      const nextHover = hit ? hit.id : null;
      canvas.style.cursor = hit ? "pointer" : "ew-resize";
      if (nextHover !== hoverId) {
        hoverId = nextHover;
        dirty = true;
        ctrl.draw();
      }
      return;
    }
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 5) dragMoved = true;
    if (dragMoved) {
      const nextH = Math.round(clamp(dragStartH + dx * 1.45, 260, 760));
      if (nextH !== getState().containerH) {
        onPatch({ containerH: nextH }, { silentLive: true });
      }
      dirty = true;
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (dragging && !dragMoved) {
      const hit = findHit(canvasPoint(e.clientX, e.clientY));
      if (hit) triggerHit(hit);
    }
    dragging = false;
    dirty = true;
    ctrl.draw();
  });

  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    dirty = true;
    ctrl.draw();
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t0 = e.touches[0];
      dragging = true;
      dragMoved = false;
      touchAxis = null;
      dragStartX = t0.clientX;
      dragStartY = t0.clientY;
      dragStartH = getState().containerH;
      dirty = true;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || e.touches.length !== 1) return;
      const t0 = e.touches[0];
      const dx = t0.clientX - dragStartX;
      const dy = t0.clientY - dragStartY;
      if (!touchAxis && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchAxis === "x") {
        e.preventDefault();
        dragMoved = true;
        const nextH = Math.round(clamp(dragStartH + dx * 1.8, 260, 760));
        onPatch({ containerH: nextH }, { silentLive: true });
        dirty = true;
        ctrl.draw();
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      if (dragging && !dragMoved && e.changedTouches.length) {
        const t0 = e.changedTouches[0];
        const hit = findHit(canvasPoint(t0.clientX, t0.clientY));
        if (hit) triggerHit(hit);
      }
      dragging = false;
      touchAxis = null;
      dirty = true;
      ctrl.draw();
    },
    { passive: true }
  );

  // 键盘操作：方向键调节封面高度与护边，空格/回车剥离冗余
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPatch({ containerH: clamp(s.containerH - 20, 260, 760) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onPatch({ containerH: clamp(s.containerH + 20, 260, 760) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPatch({ padding: clamp(s.padding + 4, 0, 96) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onPatch({ padding: clamp(s.padding - 4, 0, 96) });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (s.clutter.badge) onPatch({ clutter: { ...s.clutter, badge: false } });
      else if (s.clutter.card) onPatch({ clutter: { ...s.clutter, card: false } });
      else if (s.clutter.actions) onPatch({ clutter: { ...s.clutter, actions: false } });
      else if (s.heightMode === "fixed") onPatch({ heightMode: "min" });
    }
  });

  const ctrl = loop(canvas, render);

  return {
    notify() {
      dirty = true;
      ctrl.draw();
    },
    getHitZones() {
      return hitZones;
    },
    getLastSolved() {
      return lastSolved;
    },
    destroy() {
      ro.disconnect();
    },
  };
}
