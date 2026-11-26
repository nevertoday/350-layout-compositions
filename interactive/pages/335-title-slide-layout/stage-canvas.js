// 335 标题幻灯片版式 — 高帧率 2D 放映画布（支持桌面 16:9 舞台与手机竖屏演讲者监视器构图）
// 所有绘制坐标严格读取 model.js 的 computeGeometry / auditSlide，绝不另算第二套数。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SLIDE_H, SLIDE_W, auditSlide, clamp } from "./model.js";

const COLORS = {
  plumBg: "#260328",
  plumDeep: "#18011A",
  plumCard: "#330936",
  plumLine: "#5A245E",
  acid: "#C2D229",
  acidHi: "#D9EB3C",
  acidInk: "#140316",
  chalk: "#FEFEFE",
  lilacText: "#DDD3E0",
  lilacMuted: "#B7A8BC",
  fault: "#FF6B5B",
  faultSoft: "rgba(255, 107, 91, 0.22)",
  guide: "rgba(194, 210, 41, 0.34)",
  guideSoft: "rgba(255, 255, 255, 0.16)",
};

const FONT_ZH = '"Noto Sans SC", sans-serif';
const FONT_EN = '"Unbounded", "Sora", "Noto Sans SC", sans-serif';
const FONT_SORA = '"Sora", "Noto Sans SC", sans-serif';
const FONT_MONO = '"DM Mono", "Noto Sans SC", monospace';

// 绘制原海报同款 2×2 几何酸柠品牌徽标（左上四分圆、右上四分圆、左下带点圆、右下实方）
function drawBrandMark(ctx, x, y, size, color) {
  const half = size * 0.46;
  const gap = size - half * 2;
  ctx.save();
  ctx.fillStyle = color;
  // 左上 1/4 扇形（圆心在右下）
  ctx.beginPath();
  ctx.moveTo(x + half, y + half);
  ctx.arc(x + half, y + half, half, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
  // 右上 1/4 扇形（圆心在左下）
  ctx.beginPath();
  ctx.moveTo(x + half + gap, y + half);
  ctx.arc(x + half + gap, y + half, half, Math.PI * 1.5, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  // 左下带圆心的圆
  const r = half * 0.5;
  ctx.beginPath();
  ctx.arc(x + r, y + half + gap + r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.plumBg;
  ctx.beginPath();
  ctx.arc(x + r, y + half + gap + r, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // 右下实心方块
  ctx.fillStyle = color;
  ctx.fillRect(x + half + gap, y + half + gap, half, half);
  ctx.restore();
}

// 绘制单页 16:9 标题幻灯片（在 0..960 × 0..540 坐标系内）
function drawTitleSlide(ctx, state, audit, anim) {
  const { geom, deck, metrics, partMeta } = audit;
  const { safeRect, titleRect, subtitleRect, hero, identityRect } = geom;

  // 1. 幻灯片深茄紫底面（忠实 335 原海报纯平深茄紫，零昂贵全屏渐变重算）
  ctx.fillStyle = COLORS.plumBg;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // 2. 安全边距与底沿 12% 讲台遮挡警戒线（当参考线开启时）
  if (state.showGuides) {
    ctx.save();
    ctx.strokeStyle = COLORS.guideSoft;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(safeRect.x, safeRect.y, safeRect.w, safeRect.h);
    // 底部 7% 遮挡警戒带
    ctx.fillStyle = "rgba(255, 107, 91, 0.07)";
    ctx.fillRect(0, safeRect.y + safeRect.h, SLIDE_W, SLIDE_H - (safeRect.y + safeRect.h));
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.lilacMuted;
    ctx.font = `500 11px ${FONT_MONO}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("5% 投影安全边距", safeRect.x + safeRect.w - 4, safeRect.y - 6);
    ctx.restore();
  }

  // 3. 视觉焦点（Hero Area）— 先画，这样若碰撞会真实压在文字底下，一眼看出可读性崩坏
  const heroScale = 0.72 + 0.28 * anim;
  const hr = hero.r * heroScale;
  ctx.save();
  if (state.heroStyle === "orb") {
    // 1:1 承袭 335 原海报巨大酸柠实心圆
    ctx.fillStyle = COLORS.acid;
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr, 0, Math.PI * 2);
    ctx.fill();
    // 细微内环标尺（选中或拖移时显影）
    if (state.activePart === "hero" || state.showGuides) {
      ctx.strokeStyle = "rgba(20, 3, 22, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hero.cx, hero.cy, hr * 0.88, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = metrics.overlapPct >= 5 ? "rgba(20, 3, 22, 0.42)" : COLORS.acidInk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(11, Math.round(hr * 0.14))}px ${FONT_EN}`;
    ctx.fillText("HERO AREA", hero.cx, hero.cy + hr * 0.34);
    ctx.font = `500 ${Math.max(10, Math.round(hr * 0.11))}px ${FONT_ZH}`;
    ctx.fillText("左右拖拽调整焦点", hero.cx, hero.cy + hr * 0.54);
  } else if (state.heroStyle === "metric") {
    // 核心数据圆盘（强对比外圈 + 巨幅关键指标）
    ctx.fillStyle = "#360A3A";
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.acid;
    ctx.lineWidth = Math.max(8, hr * 0.12);
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr * 0.86, -Math.PI * 0.5, Math.PI * 1.15);
    ctx.stroke();
    ctx.strokeStyle = "rgba(194, 210, 41, 0.24)";
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr * 0.86, Math.PI * 1.15, Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = COLORS.chalk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.max(18, Math.round(hr * 0.42))}px ${FONT_EN}`;
    ctx.fillText(deck.heroMetric, hero.cx, hero.cy - hr * 0.06);
    ctx.fillStyle = COLORS.acid;
    ctx.font = `600 ${Math.max(10, Math.round(hr * 0.13))}px ${FONT_MONO}`;
    ctx.fillText(deck.heroCaption, hero.cx, hero.cy + hr * 0.28);
  } else {
    // 空间几何构图圆（酸柠半圆 + 网格刻线）
    ctx.fillStyle = "#320736";
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.acid;
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.acid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.plumBg;
    ctx.beginPath();
    ctx.arc(hero.cx + hr * 0.36, hero.cy, hr * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.acid;
    ctx.beginPath();
    ctx.arc(hero.cx - hr * 0.36, hero.cy, hr * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  // 若视觉焦点有碰撞/错态，画清晰珊瑚红虚线警戒环
  if (partMeta.hero.fault) {
    ctx.strokeStyle = COLORS.fault;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (state.activePart === "hero") {
    ctx.strokeStyle = COLORS.chalk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hero.cx, hero.cy, hr + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 4. 原海报左上酸柠直角标（跟着主标题起点呼吸！）
  ctx.save();
  const bx = titleRect.x - 18;
  const by = titleRect.y - 16;
  const bLen = Math.round(28 + titleRect.fontSize * 0.35);
  ctx.strokeStyle = partMeta.title.fault ? COLORS.fault : COLORS.acid;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(bx, by + bLen * anim);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + bLen * anim, by);
  ctx.stroke();
  ctx.restore();

  // 5. 主标题（MAIN TITLE）
  ctx.save();
  if (metrics.overlapPct >= 5) {
    ctx.fillStyle = COLORS.faultSoft;
    ctx.fillRect(titleRect.x - 6, titleRect.y - 4, titleRect.w + 12, titleRect.h + 8);
  }
  if (state.activePart === "title" && state.showGuides) {
    ctx.strokeStyle = partMeta.title.fault ? COLORS.fault : COLORS.guide;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(titleRect.x - 6, titleRect.y - 4, titleRect.w + 12, titleRect.h + 8);
  }
  ctx.fillStyle = COLORS.chalk;
  ctx.font = `900 ${titleRect.fontSize}px ${FONT_ZH}`;
  ctx.textAlign = titleRect.align;
  ctx.textBaseline = "top";
  const tx = titleRect.align === "center" ? titleRect.x + titleRect.w / 2 : titleRect.x;
  const slideOffset = (1 - anim) * 14;
  titleRect.lines.forEach((line, i) => {
    ctx.fillText(line, tx, titleRect.y + i * titleRect.lineHeight + slideOffset);
  });
  ctx.restore();

  // 6. 副标题（SUBTITLE）
  ctx.save();
  if (subtitleRect.mode === "one-line") {
    // 1:1 承袭 335 原海报酸柠实心条 + 深紫粗字
    ctx.fillStyle = COLORS.acid;
    ctx.fillRect(subtitleRect.x, subtitleRect.y, subtitleRect.w * anim, subtitleRect.h);
    ctx.fillStyle = COLORS.acidInk;
    ctx.font = `700 ${subtitleRect.fontSize}px ${FONT_ZH}`;
    ctx.textAlign = subtitleRect.align;
    ctx.textBaseline = "middle";
    const sx =
      subtitleRect.align === "center"
        ? subtitleRect.x + subtitleRect.w / 2
        : subtitleRect.x + 16;
    ctx.fillText(subtitleRect.lines[0], sx, subtitleRect.y + subtitleRect.h / 2 + 1);
  } else if (subtitleRect.mode === "bullets") {
    ctx.fillStyle = "rgba(255, 107, 91, 0.14)";
    ctx.strokeStyle = COLORS.fault;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.fillRect(subtitleRect.x - 6, subtitleRect.y - 4, subtitleRect.w + 12, subtitleRect.h + 8);
    ctx.strokeRect(subtitleRect.x - 6, subtitleRect.y - 4, subtitleRect.w + 12, subtitleRect.h + 8);
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.lilacText;
    ctx.font = `400 ${subtitleRect.fontSize}px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    subtitleRect.lines.forEach((line, i) => {
      ctx.fillText(line, subtitleRect.x + 4, subtitleRect.y + 4 + i * subtitleRect.lineHeight);
    });
  } else if (state.showGuides) {
    // 缺失语境虚线空槽
    ctx.strokeStyle = COLORS.fault;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(titleRect.x, subtitleRect.y, 260, 34);
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.fault;
    ctx.font = `500 13px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("⚠ 副标题空缺 · 缺少一句话价值主张", titleRect.x + 10, subtitleRect.y + 17);
  }
  ctx.restore();

  // 7. 品牌信息锁组（IDENTITY）
  ctx.save();
  const markSize = Math.round(34 * identityRect.scale);
  if (partMeta.identity.fault) {
    ctx.fillStyle = COLORS.faultSoft;
    ctx.strokeStyle = COLORS.fault;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.fillRect(identityRect.x - 8, identityRect.y - 6, identityRect.w + 16, identityRect.h + 12);
    ctx.strokeRect(identityRect.x - 8, identityRect.y - 6, identityRect.w + 16, identityRect.h + 12);
    ctx.setLineDash([]);
  } else if (state.activePart === "identity" && state.showGuides) {
    ctx.strokeStyle = COLORS.guide;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(identityRect.x - 6, identityRect.y - 4, identityRect.w + 12, identityRect.h + 8);
  }
  drawBrandMark(
    ctx,
    identityRect.x,
    identityRect.y + Math.round((identityRect.h - markSize) / 2),
    markSize,
    COLORS.acid
  );
  const idTextX = identityRect.x + markSize + Math.round(12 * identityRect.scale);
  ctx.fillStyle = COLORS.chalk;
  ctx.font = `600 ${Math.round(16 * identityRect.scale)}px ${FONT_ZH}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(deck.org, idTextX, identityRect.y + Math.round(3 * identityRect.scale));
  ctx.fillStyle = COLORS.acid;
  ctx.font = `500 ${Math.max(10, Math.round(11 * identityRect.scale))}px ${FONT_MONO}`;
  ctx.fillText(deck.orgEn, idTextX, identityRect.y + Math.round(25 * identityRect.scale));
  ctx.restore();

  // 8. 碰撞实测警示签（锚定在右上空区，绝不遮盖顶部品牌或文字）
  if (metrics.overlapPct >= 5) {
    ctx.save();
    const badgeW = 216;
    const badgeH = 30;
    const bx2 = SLIDE_W - badgeW - 56;
    const by2 = 42;
    ctx.fillStyle = COLORS.fault;
    ctx.fillRect(bx2, by2, badgeW, badgeH);
    ctx.fillStyle = "#18021A";
    ctx.font = `700 13px ${FONT_ZH}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`× 图文撞压 ${metrics.overlapPct}% · 拖开焦点`, bx2 + badgeW / 2, by2 + badgeH / 2 + 1);
    ctx.restore();
  }

  // 9. 原海报底沿双排微小酸柠对齐点（2 条虚线 1 次 stroke 完成，省去 76 次 fillRect）
  ctx.save();
  ctx.strokeStyle = "rgba(194, 210, 41, 0.45)";
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 22]);
  ctx.beginPath();
  ctx.moveTo(36, SLIDE_H - 17);
  ctx.lineTo(SLIDE_W - 36, SLIDE_H - 17);
  ctx.moveTo(36, SLIDE_H - 10);
  ctx.lineTo(SLIDE_W - 36, SLIDE_H - 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// 绘制第 02 页承接内容页（演示标题页定下的色板、锚线与品牌签名如何延续）
function drawFollowUpSlide(ctx, state, audit) {
  const { deck, isClean } = audit;
  ctx.fillStyle = COLORS.plumBg;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // 顶部极简页眉：直接继承封面定下的锚线与酸柠信号色
  ctx.fillStyle = COLORS.acid;
  ctx.fillRect(72, 46, 36, 5);
  ctx.fillStyle = COLORS.acid;
  ctx.font = `600 13px ${FONT_MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`SLIDE 02 / 02 · 承接自「${deck.tab}」标题页视觉契约`, 122, 49);

  // 02 页核心结论大标（比例同步反映封面层级是否立住）
  const s2TitleSize = isClean ? 42 : 24;
  ctx.fillStyle = COLORS.chalk;
  ctx.font = `900 ${s2TitleSize}px ${FONT_ZH}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(deck.slide2Title, 72, 82);

  ctx.fillStyle = COLORS.lilacText;
  ctx.font = `400 20px ${FONT_ZH}`;
  ctx.fillText(deck.slide2Lead, 72, 82 + s2TitleSize + 18);

  // 两张对照数据卡（继承 01 页的深茄紫卡片 + 酸柠重点色）
  deck.slide2Cards.forEach((card, i) => {
    const cx = 72 + i * 420;
    const cy = 224;
    const cw = 392;
    const ch = 186;
    ctx.fillStyle = COLORS.plumCard;
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = i === 1 ? COLORS.acid : COLORS.plumLine;
    ctx.lineWidth = i === 1 ? 2.5 : 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    ctx.fillStyle = i === 1 ? COLORS.acid : COLORS.lilacMuted;
    ctx.font = `600 15px ${FONT_ZH}`;
    ctx.fillText(card.label, cx + 26, cy + 28);

    ctx.fillStyle = COLORS.chalk;
    ctx.font = `800 44px ${FONT_EN}`;
    ctx.fillText(card.val, cx + 26, cy + 68);

    ctx.fillStyle = COLORS.lilacText;
    ctx.font = `400 15px ${FONT_ZH}`;
    ctx.fillText(card.note, cx + 26, cy + 136);
  });

  // 左下品牌回声（严格沿用封面左下角位置与克制尺度）
  drawBrandMark(ctx, 72, 466, 22, COLORS.acid);
  ctx.fillStyle = COLORS.lilacMuted;
  ctx.font = `500 13px ${FONT_SORA}`;
  ctx.fillText(`${deck.org}  |  ${deck.orgEn}`, 104, 470);

  // 右下返回提示
  ctx.fillStyle = COLORS.acid;
  ctx.fillRect(SLIDE_W - 224, 456, 152, 34);
  ctx.fillStyle = COLORS.acidInk;
  ctx.font = `700 13px ${FONT_ZH}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("← 翻回 01 编辑封面", SLIDE_W - 148, 473);
}

export function createHeroStage(canvas, getState, onPatch) {
  const ctx = canvas.getContext("2d");

  // 离屏小缓冲，用于高性能 15m 后排光学模糊衰减（比 ctx.filter 快 10 倍，SwiftShader 也满帧）
  const off = document.createElement("canvas");
  off.width = SLIDE_W;
  off.height = SLIDE_H;
  const offCtx = off.getContext("2d");

  const blurBuf = document.createElement("canvas");
  const blurCtx = blurBuf.getContext("2d");

  let dpr = 1;
  let cssW = 800;
  let cssH = 450;
  let isPortraitPresenter = false;
  let slideBox = { x: 0, y: 0, w: 800, h: 450 };
  let miniFlipBox = null;

  // 动画状态
  let introProgress = reducedMotion.matches ? 1 : 0;
  let slideBlend = 0; // 0 = Slide 01, 1 = Slide 02
  let glanceState = { active: false, phase: "idle", left: 0 }; // idle | show | black
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width));
    cssH = Math.max(220, Math.round(rect.height));
    dpr = pixelRatio(cssW < 520 ? 1.5 : 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    isPortraitPresenter = cssW / cssH < 1.25;
    if (isPortraitPresenter) {
      const pad = 10;
      const maxW = cssW - pad * 2;
      const w = maxW;
      const h = Math.round((w * 9) / 16);
      slideBox = { x: pad, y: 26, w, h };
    } else {
      const padX = 12;
      const padTop = 10;
      const padBot = 10;
      const availW = cssW - padX * 2;
      const availH = cssH - padTop - padBot;
      let w = availW;
      let h = (w * 9) / 16;
      if (h > availH) {
        h = availH;
        w = (h * 16) / 9;
      }
      slideBox = {
        x: Math.round((cssW - w) / 2),
        y: Math.round(padTop + (availH - h) / 2),
        w: Math.round(w),
        h: Math.round(h),
      };
    }
    dirty = true;
  }

  function renderSlideToBuffer(state, audit, anim) {
    offCtx.clearRect(0, 0, SLIDE_W, SLIDE_H);
    if (slideBlend < 0.01) {
      drawTitleSlide(offCtx, state, audit, anim);
    } else if (slideBlend > 0.99) {
      drawFollowUpSlide(offCtx, state, audit);
    } else {
      const shift = Math.round(slideBlend * SLIDE_W);
      offCtx.save();
      offCtx.translate(-shift, 0);
      drawTitleSlide(offCtx, state, audit, anim);
      offCtx.restore();
      offCtx.save();
      offCtx.translate(SLIDE_W - shift, 0);
      drawFollowUpSlide(offCtx, state, audit);
      offCtx.restore();
    }
  }

  // 手机竖屏底部：演讲者监视器（02 下一页预演 + 四支柱实时条），保证 390×844 画布 ≥ 46% 屏高且 16:9 零拉伸
  function drawPortraitPresenterDock(state, audit) {
    const dockY = slideBox.y + slideBox.h + 14;
    const dockH = cssH - dockY - 10;
    if (dockH < 90) return;

    const pad = 10;
    const gap = 10;
    const leftW = Math.round((cssW - pad * 2 - gap) * 0.44);
    const rightX = pad + leftW + gap;
    const rightW = cssW - rightX - pad;

    // 左侧：可点击的 02 承接页微缩预演框
    ctx.save();
    ctx.fillStyle = COLORS.plumCard;
    ctx.fillRect(pad, dockY, leftW, dockH);
    ctx.strokeStyle = state.slideIndex === 1 ? COLORS.acid : COLORS.plumLine;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, dockY, leftW, dockH);
    miniFlipBox = { x: pad, y: dockY, w: leftW, h: dockH };

    ctx.fillStyle = COLORS.acid;
    ctx.font = `600 10px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(state.slideIndex === 0 ? "NEXT · 02 承接页" : "BACK · 01 封面页", pad + 9, dockY + 8);

    // 微缩 16:9 示意图
    const tw = leftW - 18;
    const th = Math.min(dockH - 46, Math.round((tw * 9) / 16));
    const tx = pad + 9;
    const ty = dockY + 25;
    ctx.fillStyle = COLORS.plumBg;
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = "rgba(194, 210, 41, 0.35)";
    ctx.strokeRect(tx, ty, tw, th);
    ctx.fillStyle = COLORS.acid;
    ctx.fillRect(tx + 8, ty + 8, 22, 3);
    ctx.fillStyle = COLORS.chalk;
    ctx.fillRect(tx + 8, ty + 16, tw * 0.62, 5);
    ctx.fillStyle = COLORS.plumLine;
    ctx.fillRect(tx + 8, ty + 28, tw * 0.4, th - 36);
    ctx.fillRect(tx + 12 + tw * 0.4, ty + 28, tw * 0.4, th - 36);

    ctx.fillStyle = COLORS.lilacText;
    ctx.font = `500 11px ${FONT_ZH}`;
    ctx.fillText("点此翻页预演 →", pad + 9, dockY + dockH - 18);

    // 右侧：实时四支柱占比仪表
    ctx.fillStyle = COLORS.plumCard;
    ctx.fillRect(rightX, dockY, rightW, dockH);
    ctx.strokeStyle = COLORS.plumLine;
    ctx.strokeRect(rightX, dockY, rightW, dockH);

    ctx.fillStyle = COLORS.acid;
    ctx.font = `600 10px ${FONT_MONO}`;
    ctx.fillText(`TELEMETRY · ${audit.passedCount}/4`, rightX + 10, dockY + 8);

    const bars = [
      {
        label: `主标 ${audit.metrics.titlePt}pt`,
        pct: clamp((audit.metrics.titlePt - 20) / 52, 0.08, 1),
        ok: !audit.partMeta.title.fault,
      },
      {
        label: `留白 ${audit.metrics.whitespacePct}%`,
        pct: clamp(audit.metrics.whitespacePct / 80, 0.08, 1),
        ok: audit.metrics.whitespacePct >= 34 && audit.metrics.whitespacePct <= 72,
      },
      {
        label: `净空 ${100 - audit.metrics.overlapPct}%`,
        pct: clamp((100 - audit.metrics.overlapPct) / 100, 0.08, 1),
        ok: audit.metrics.overlapPct < 5,
      },
      {
        label: `品牌 ${state.identityScale.toFixed(1)}×`,
        pct: clamp(1 - (state.identityScale - 0.65) / 1.4, 0.12, 1),
        ok: !audit.partMeta.identity.fault,
      },
    ];
    const rowStep = Math.floor((dockH - 30) / 4);
    bars.forEach((b, idx) => {
      const y = dockY + 26 + idx * rowStep;
      ctx.fillStyle = COLORS.lilacText;
      ctx.font = `500 11px ${FONT_ZH}`;
      ctx.fillText(b.label, rightX + 10, y);
      const barY = y + 15;
      const barW = rightW - 20;
      ctx.fillStyle = COLORS.plumDeep;
      ctx.fillRect(rightX + 10, barY, barW, 5);
      ctx.fillStyle = b.ok ? COLORS.acid : COLORS.fault;
      ctx.fillRect(rightX + 10, barY, Math.round(barW * b.pct), 5);
    });
    ctx.restore();
  }

  function paint(t, dt, { still }) {
    const state = getState();
    const targetBlend = state.slideIndex === 1 ? 1 : 0;

    let animating = false;
    if (still) {
      introProgress = 1;
      slideBlend = targetBlend;
    } else {
      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) / 0.58);
        animating = true;
      }
      if (Math.abs(slideBlend - targetBlend) > 0.005) {
        slideBlend += (targetBlend - slideBlend) * Math.min(1, Math.max(dt, 0.016) * 12);
        animating = true;
      } else if (slideBlend !== targetBlend) {
        slideBlend = targetBlend;
        dirty = true;
      }
      if (glanceState.active) {
        glanceState.left = Math.max(0, glanceState.left - Math.max(dt, 0.016));
        if (glanceState.phase === "show" && glanceState.left <= 0) {
          glanceState.phase = "black";
          glanceState.left = 3.2;
        } else if (glanceState.phase === "black" && glanceState.left <= 0) {
          glanceState.active = false;
          glanceState.phase = "idle";
        }
        animating = true;
      }
    }

    if (!dirty && !animating) return;
    dirty = false;

    const ease = 1 - Math.pow(1 - introProgress, 3);
    const audit = auditSlide(state);
    const needOffscreen = state.viewMode === "backrow" || (slideBlend > 0.01 && slideBlend < 0.99);
    if (needOffscreen) {
      renderSlideToBuffer(state, audit, ease);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 舞台深茄底
    ctx.fillStyle = COLORS.plumDeep;
    ctx.fillRect(0, 0, cssW, cssH);

    // 手机竖屏顶部精简条
    if (isPortraitPresenter) {
      ctx.fillStyle = COLORS.lilacMuted;
      ctx.font = `500 10px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `SLIDE 0${state.slideIndex + 1}/02 · 16:9 · ${state.viewMode === "backrow" ? "15m 后排视距" : "横拖画布调焦点"}`,
        10,
        14
      );
      ctx.fillStyle = audit.isClean ? COLORS.acid : COLORS.fault;
      ctx.textAlign = "right";
      ctx.fillText(`${audit.passedCount}/4`, cssW - 10, 14);
    }

    // 16:9 投影画面渲染（常规态直绘免去离屏 518K 像素复制，软件渲染依然满帧）
    if (glanceState.active && glanceState.phase === "black") {
      ctx.fillStyle = "#120114";
      ctx.fillRect(slideBox.x, slideBox.y, slideBox.w, slideBox.h);
      ctx.strokeStyle = COLORS.acid;
      ctx.lineWidth = 2;
      ctx.strokeRect(slideBox.x, slideBox.y, slideBox.w, slideBox.h);
      ctx.fillStyle = COLORS.acid;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${isPortraitPresenter ? 13 : 16}px ${FONT_MONO}`;
      ctx.fillText("3.0s TIME UP · 幕布已黑屏", slideBox.x + slideBox.w / 2, slideBox.y + slideBox.h * 0.36);
      ctx.fillStyle = COLORS.chalk;
      ctx.font = `700 ${isPortraitPresenter ? 15 : 22}px ${FONT_ZH}`;
      const recall = audit.isClean
        ? `观众 3 秒记住：「${audit.deck.conciseTitle.join("")}」+ 一句话价值`
        : `观众 3 秒只看到混乱块面（${audit.primary.short}），没听见你开场白`;
      ctx.fillText(recall, slideBox.x + slideBox.w / 2, slideBox.y + slideBox.h * 0.52);
      ctx.fillStyle = COLORS.lilacMuted;
      ctx.font = `400 ${isPortraitPresenter ? 11 : 13}px ${FONT_ZH}`;
      ctx.fillText("点击画布任意处立即恢复编辑", slideBox.x + slideBox.w / 2, slideBox.y + slideBox.h * 0.67);
    } else if (state.viewMode === "backrow") {
      // 后排 15m 光学衰减：1/5 低分辨降采样 + 礼堂环境光泛雾，小字立刻糊失，大字依然清晰
      const bw = 192;
      const bh = 108;
      if (blurBuf.width !== bw) {
        blurBuf.width = bw;
        blurBuf.height = bh;
      }
      blurCtx.imageSmoothingEnabled = true;
      blurCtx.imageSmoothingQuality = "medium";
      blurCtx.clearRect(0, 0, bw, bh);
      blurCtx.drawImage(off, 0, 0, bw, bh);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(blurBuf, slideBox.x, slideBox.y, slideBox.w, slideBox.h);

      // 投影仪环境光洗白层 + 后排观众剪影
      ctx.fillStyle = "rgba(44, 18, 48, 0.24)";
      ctx.fillRect(slideBox.x, slideBox.y, slideBox.w, slideBox.h);

      // 底部极简剪影（无五官细节，仅轮廓暗示礼堂前排头顶）
      ctx.fillStyle = "#0F0111";
      const sy = slideBox.y + slideBox.h;
      [0.14, 0.31, 0.52, 0.72, 0.87].forEach((fx, i) => {
        const hx = slideBox.x + slideBox.w * fx;
        const r = slideBox.h * (0.045 + (i % 2) * 0.008);
        ctx.beginPath();
        ctx.arc(hx, sy - r * 0.35, r, Math.PI, Math.PI * 2);
        ctx.fill();
      });

      // 后排视距标尺条
      ctx.fillStyle = "rgba(18, 2, 20, 0.86)";
      ctx.fillRect(slideBox.x + 10, slideBox.y + 10, isPortraitPresenter ? 186 : 244, 26);
      ctx.fillStyle = COLORS.acid;
      ctx.font = `600 11px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `15m BACK ROW · 视角 ${audit.metrics.backRowArcmin}′ (${audit.metrics.backRowGrade})`,
        slideBox.x + 18,
        slideBox.y + 23
      );
    } else if (needOffscreen) {
      ctx.drawImage(off, slideBox.x, slideBox.y, slideBox.w, slideBox.h);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(slideBox.x, slideBox.y, slideBox.w, slideBox.h);
      ctx.clip();
      ctx.translate(slideBox.x, slideBox.y);
      ctx.scale(slideBox.w / SLIDE_W, slideBox.h / SLIDE_H);
      if (slideBlend > 0.99) drawFollowUpSlide(ctx, state, audit);
      else drawTitleSlide(ctx, state, audit, ease);
      ctx.restore();
    }

    // 3 秒快闪倒计时进度条
    if (glanceState.active && glanceState.phase === "show") {
      const pct = clamp(glanceState.left / 3.0, 0, 1);
      ctx.fillStyle = COLORS.acid;
      ctx.fillRect(slideBox.x, slideBox.y, slideBox.w * pct, 5);
      ctx.fillStyle = "rgba(18, 2, 20, 0.88)";
      ctx.fillRect(slideBox.x + slideBox.w - 128, slideBox.y + 12, 116, 26);
      ctx.fillStyle = COLORS.acid;
      ctx.font = `700 12px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`GLANCE ${glanceState.left.toFixed(1)}s`, slideBox.x + slideBox.w - 70, slideBox.y + 25);
    }

    // 投影幕布边框
    ctx.strokeStyle = audit.isClean ? COLORS.acid : COLORS.plumLine;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(slideBox.x, slideBox.y, slideBox.w, slideBox.h);

    if (isPortraitPresenter) {
      drawPortraitPresenterDock(state, audit);
    } else {
      miniFlipBox = null;
    }

    ctx.restore();
  }

  // 指针坐标转换到逻辑 960×540 幻灯片空间
  function toSlideCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      cssX: x,
      cssY: y,
      sx: ((x - slideBox.x) / slideBox.w) * SLIDE_W,
      sy: ((y - slideBox.y) / slideBox.h) * SLIDE_H,
    };
  }

  function inRect(px, py, r) {
    return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  let drag = null;

  function onPointerDown(e) {
    if (glanceState.active) {
      glanceState.active = false;
      glanceState.phase = "idle";
      dirty = true;
      ctrl.draw();
      return;
    }
    const state = getState();
    const pt = toSlideCoords(e.clientX, e.clientY);

    // 手机竖屏底部点击翻页预演框
    if (miniFlipBox && inRect(pt.cssX, pt.cssY, miniFlipBox)) {
      onPatch({ slideIndex: state.slideIndex === 0 ? 1 : 0 });
      return;
    }

    // 如果当前在第 02 页，点击直接翻回第 01 页继续编排
    if (state.slideIndex === 1) {
      onPatch({ slideIndex: 0 });
      return;
    }

    const audit = auditSlide(state);
    const { hero, titleRect, subtitleRect, identityRect } = audit.geom;
    const distHero = Math.hypot(pt.sx - hero.cx, pt.sy - hero.cy);
    const hitHero = distHero <= hero.r + 16;

    if (!hitHero) {
      if (inRect(pt.sx, pt.sy, identityRect)) onPatch({ activePart: "identity" });
      else if (inRect(pt.sx, pt.sy, subtitleRect)) onPatch({ activePart: "subtitle" });
      else if (inRect(pt.sx, pt.sy, titleRect)) onPatch({ activePart: "title" });
    } else {
      onPatch({ activePart: "hero" });
    }

    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startHeroX: state.heroX,
      startHeroY: state.heroY,
      hitHero,
      moved: false,
      pointerType: e.pointerType,
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  }

  function onPointerMove(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 3) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    const nextX = clamp(drag.startHeroX + dx / slideBox.w, 0.14, 0.86);
    // 触屏上竖向留给页面滚动，仅在直接拖中圆体或鼠标拖动时才调 Y
    const allowY = drag.pointerType !== "touch" && drag.hitHero;
    const nextY = allowY ? clamp(drag.startHeroY + dy / slideBox.h, 0.2, 0.8) : drag.startHeroY;
    onPatch({ heroX: +nextX.toFixed(3), heroY: +nextY.toFixed(3), activePart: "hero" }, true);
  }

  function onPointerUp(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const hadMove = drag.moved;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    drag = null;
    if (hadMove) onPatch({}, false);
  }

  // 键盘操作：方向键移焦点，Space 翻页，1-4 选四支柱
  function onKeyDown(e) {
    const state = getState();
    const step = e.shiftKey ? 0.06 : 0.025;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPatch({ heroX: +clamp(state.heroX - step, 0.14, 0.86).toFixed(3), activePart: "hero" });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onPatch({ heroX: +clamp(state.heroX + step, 0.14, 0.86).toFixed(3), activePart: "hero" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPatch({ heroY: +clamp(state.heroY - step, 0.2, 0.8).toFixed(3), activePart: "hero" });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onPatch({ heroY: +clamp(state.heroY + step, 0.2, 0.8).toFixed(3), activePart: "hero" });
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onPatch({ slideIndex: state.slideIndex === 0 ? 1 : 0 });
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      const parts = ["title", "subtitle", "hero", "identity"];
      onPatch({ activePart: parts[+e.key - 1] });
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("keydown", onKeyDown);

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);

  const ctrl = loop(canvas, paint);
  resize();
  ctrl.draw();

  return {
    invalidate(immediate = true) {
      dirty = true;
      if (immediate) ctrl.draw();
    },
    startGlance() {
      glanceState = { active: true, phase: "show", left: 3.0 };
      dirty = true;
      ctrl.draw();
    },
    stopGlance() {
      glanceState = { active: false, phase: "idle", left: 0 };
      dirty = true;
      ctrl.draw();
    },
  };
}
