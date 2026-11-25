// 开场活体首屏剧场（2D Canvas）
// 1:1 承袭 289 原海报构图主义视觉基因：暖象牙纸、国际钴蓝斜楔、明黄聚光圆、肘形圆点引注、首屏折叠线裁切与 0.5 秒盲闪回放。

import { PALETTE, evaluateHero, clamp } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

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

function wrapText(ctx, text, maxW, maxLines) {
  const chars = [...text];
  const lines = [];
  let cur = "";
  for (let i = 0; i < chars.length; i++) {
    const next = cur + chars[i];
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = chars[i];
      if (lines.length === maxLines) {
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…";
        return lines;
      }
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// 绘制三种题材的主视觉核心图形（绝不画人脸五官，全部用干净几何/构图主义视觉语言）
function drawVisualMotif(ctx, state, rect, t, still) {
  const { x, y, w, h } = rect;
  const cx = x + w * 0.54;
  const cy = y + h * 0.48;
  const pulse = still ? 0 : Math.sin(t * 1.4) * 0.02;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (state.scenario === "poster") {
    // 289 原海报基因：钴蓝大斜楔 + 明黄聚光切角太阳圆
    if (state.archetype === "diagonal" || state.archetype === "fullbleed") {
      // 钴蓝几何斜楔从左下切向右上
      ctx.fillStyle = PALETTE.cobalt;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.08, y + h * 1.06);
      ctx.lineTo(x + w * 0.56, y - h * 0.04);
      ctx.lineTo(x + w * 1.08, y + h * 0.14);
      ctx.lineTo(x + w * 1.08, y + h * 0.88);
      ctx.lineTo(x + w * 0.34, y + h * 0.88);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = PALETTE.cobalt;
      ctx.fillRect(x, y, w, h);
      // 柔和的斜向几何衬面
      ctx.fillStyle = PALETTE.cobaltCabin;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w * 0.62, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
    }

    // 标志性明黄聚光大圆（带原海报左下三角光束切口）
    const r = Math.min(w, h) * (0.37 + pulse);
    const sunX = state.archetype === "fullbleed" ? x + w * 0.72 : cx;
    const sunY = state.archetype === "fullbleed" ? y + h * 0.45 : cy;
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.max(16, r), 0, Math.PI * 2);
    ctx.fill();

    // 左下聚光切角光束（原海报最核心的视觉通道）
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(x - w * 0.12, y + h * 1.05);
    ctx.lineTo(sunX - r * 0.28, y + h * 1.08);
    ctx.closePath();
    ctx.fill();

    // 构图主义细坐标十字点缀
    ctx.strokeStyle = "rgba(255, 251, 240, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sunX + r * 0.62, sunY - r * 0.62);
    ctx.lineTo(sunX + r * 0.96, sunY - r * 0.96);
    ctx.stroke();
  } else if (state.scenario === "audio") {
    // 声学硬件 · 极光降噪耳机（极简构图主义头梁+声波环，深钴底+明黄声光）
    ctx.fillStyle = PALETTE.cobaltDeep;
    ctx.fillRect(x, y, w, h);

    // 斜切亮钴面
    ctx.fillStyle = PALETTE.cobalt;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h);
    ctx.lineTo(x + w * 0.72, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    const ux = state.archetype === "fullbleed" ? x + w * 0.72 : x + w * 0.52;
    const uy = y + h * 0.52;
    const unit = Math.min(w, h) * 0.36;

    // 明黄声波同心光环（降噪静谧场）
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = 0.25 + (3 - i) * 0.22;
      ctx.beginPath();
      ctx.arc(ux, uy, unit * (0.45 + i * 0.28 + pulse), -Math.PI * 0.85, Math.PI * 0.35);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 极简头戴式耳机几何轮廓
    ctx.strokeStyle = PALETTE.paperLight;
    ctx.lineWidth = Math.max(4, unit * 0.14);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(ux, uy - unit * 0.05, unit * 0.72, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();

    // 左右明黄耳罩模块
    ctx.fillStyle = PALETTE.gold;
    roundRectPath(ctx, ux - unit * 0.92, uy - unit * 0.16, unit * 0.38, unit * 0.76, unit * 0.18);
    ctx.fill();
    roundRectPath(ctx, ux + unit * 0.54, uy - unit * 0.16, unit * 0.38, unit * 0.76, unit * 0.18);
    ctx.fill();

    // 内耳垫深钴高光
    ctx.fillStyle = PALETTE.cobaltDeep;
    roundRectPath(ctx, ux - unit * 0.68, uy - unit * 0.08, unit * 0.18, unit * 0.6, unit * 0.09);
    ctx.fill();
    roundRectPath(ctx, ux + unit * 0.5, uy - unit * 0.08, unit * 0.18, unit * 0.6, unit * 0.09);
    ctx.fill();

    // 规格小标
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `500 10px "DM Mono", monospace`;
    ctx.fillText("-42 dB ANC · 48H", x + 12, y + h - 12);
  } else {
    // 效率工具 · 秒记协作白板（干净产品界面结构画）
    ctx.fillStyle = PALETTE.cobalt;
    ctx.fillRect(x, y, w, h);

    // 微微点阵网
    ctx.fillStyle = "rgba(255,251,240,0.16)";
    const step = 18;
    for (let gx = x + 14; gx < x + w - 8; gx += step) {
      for (let gy = y + 14; gy < y + h - 8; gy += step) {
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
    }

    // 三张有序白板卡片 + 连接折线
    const padX = Math.max(12, w * 0.08);
    const padY = Math.max(14, h * 0.14);
    const cw = Math.max(54, (w - padX * 2 - 14) * 0.48);
    const ch = Math.max(46, (h - padY * 2 - 12) * 0.48);
    const shiftX = state.archetype === "fullbleed" ? w * 0.24 : 0;

    // 卡片 1（明黄重点卡）
    const c1x = x + padX + shiftX;
    const c1y = y + padY;
    ctx.fillStyle = PALETTE.gold;
    roundRectPath(ctx, c1x, c1y, cw, ch, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(c1x + 9, c1y + 11, cw * 0.58, 5);
    ctx.fillStyle = "rgba(27,28,25,0.45)";
    ctx.fillRect(c1x + 9, c1y + 22, cw * 0.74, 3);
    ctx.fillRect(c1x + 9, c1y + 30, cw * 0.46, 3);

    // 卡片 2（象牙白卡）
    const c2x = Math.min(x + w - cw - 8, c1x + cw + 12);
    const c2y = c1y + 10;
    ctx.fillStyle = PALETTE.paperLight;
    roundRectPath(ctx, c2x, c2y, cw, ch, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.cobalt;
    ctx.fillRect(c2x + 9, c2y + 11, cw * 0.5, 5);
    ctx.fillStyle = PALETTE.cobaltLine;
    ctx.fillRect(c2x + 9, c2y + 22, cw * 0.72, 3);
    ctx.fillRect(c2x + 9, c2y + 30, cw * 0.6, 3);

    // 卡片 3（下方汇总条）
    const c3x = c1x + 14;
    const c3y = Math.min(y + h - ch * 0.85 - 8, c1y + ch + 12);
    ctx.fillStyle = PALETTE.paper;
    roundRectPath(ctx, c3x, c3y, Math.min(w - 28, cw * 1.45), ch * 0.78, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.cobalt;
    ctx.fillRect(c3x + 10, c3y + 10, 26, 10);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(c3x + 44, c3y + 12, Math.min(90, cw * 0.7), 5);

    // 协作连接虚线
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(c1x + cw, c1y + ch * 0.45);
    ctx.lineTo(c2x, c2y + ch * 0.45);
    ctx.moveTo(c1x + cw * 0.45, c1y + ch);
    ctx.lineTo(c3x + 28, c3y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 全出血暗罩叠加层
  if (state.archetype === "fullbleed" && state.scrim) {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, "rgba(8, 29, 102, 0.88)");
    grad.addColorStop(0.55, "rgba(8, 29, 102, 0.56)");
    grad.addColorStop(1, "rgba(8, 29, 102, 0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  // 若开启「自动轮播干扰」，绘制典型横幅箭头、底部多圆点与促销角标
  if (state.carousel) {
    const slideIdx = still ? 1 : Math.floor(t * 0.85) % 4;
    // 顶部干扰红条（像广告条；窄盒自动缩短字，绝不裁切）
    ctx.fillStyle = PALETTE.fail;
    ctx.fillRect(x, y, w, 20);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.font = `600 10px "Noto Sans SC", sans-serif`;
    const adTxt = w < 140 ? `轮播 ${slideIdx + 1}/4` : `限时广告 · 自动轮播 ${slideIdx + 1}/4`;
    ctx.fillText(adTxt, x + 8, y + 14);

    // 左右翻页圆钮
    ctx.fillStyle = "rgba(27, 28, 25, 0.65)";
    ctx.beginPath();
    ctx.arc(x + 14, y + h * 0.52, 10, 0, Math.PI * 2);
    ctx.arc(x + w - 14, y + h * 0.52, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.paperLight;
    ctx.font = `700 11px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("<", x + 14, y + h * 0.52 + 4);
    ctx.fillText(">", x + w - 14, y + h * 0.52 + 4);

    // 底部 4 枚轮播点
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i === slideIdx ? PALETTE.gold : "rgba(255,251,240,0.45)";
      ctx.beginPath();
      ctx.arc(x + w / 2 - 18 + i * 12, y + h - 10, i === slideIdx ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "left";
  }

  ctx.restore();
}

export function createHeroStage(canvas, getState, onAction) {
  const ctx = canvas.getContext("2d");
  let cssW = 920;
  let cssH = 440;
  let hitZones = [];
  let flashUntil = 0;      // >0 时正在播放 0.5s 闪映动画
  let flashOverlay = false; // 闪映结束后的盲测回放幕布
  let introStart = -1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    cssW = Math.round(rect.width);
    cssH = Math.round(rect.height);
    const dpr = pixelRatio(window.devicePixelRatio >= 3 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function triggerFlash(reduced) {
    if (reduced) {
      flashUntil = 0;
      flashOverlay = !flashOverlay;
      return;
    }
    flashOverlay = false;
    flashUntil = performance.now() + 680;
  }

  function closeFlash() {
    flashUntil = 0;
    flashOverlay = false;
  }

  function render(t, _dt, { still }) {
    resize();
    const state = getState();
    const info = evaluateHero(state, cssW, cssH);
    hitZones = [];

    if (introStart < 0) introStart = t;
    const intro = still ? 1 : clamp((t - introStart) / 0.55, 0, 1);
    const now = performance.now();
    const isFlashing = flashUntil > 0 && now < flashUntil;
    if (flashUntil > 0 && now >= flashUntil) {
      flashUntil = 0;
      flashOverlay = true;
      onAction("flash-done");
    }

    // 1. 舞台底纸（暖象牙原纸）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 宽屏右侧钴蓝建筑批注边栏（复刻 289 原海报的右侧深钴区）
    const { browser, navH, contentTop, foldY, visualRect, messageRect, ctaRect, compact, railW } = info;
    if (railW > 0) {
      const rx = browser.x + browser.w + 12;
      ctx.fillStyle = PALETTE.cobalt;
      ctx.fillRect(rx, browser.y, railW, browser.h);
      // 边栏顶角细明黄条
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(rx, browser.y, railW, 4);
    }

    // 2. 活体浏览器外框
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(browser.x, browser.y, browser.w, browser.h);

    // 浏览器极简顶栏（钴蓝底线 + 三枚几何点 + 模拟域名）
    ctx.fillStyle = PALETTE.paperSand;
    ctx.fillRect(browser.x, browser.y, browser.w, navH);
    ctx.strokeStyle = PALETTE.cobalt;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(browser.x, contentTop);
    ctx.lineTo(browser.x + browser.w, contentTop);
    ctx.stroke();

    // 三枚窗口几何点
    const dotColors = [PALETTE.cobalt, PALETTE.gold, PALETTE.ink];
    dotColors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(browser.x + 14 + i * 12, browser.y + navH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 域名与当前视口尺寸标
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.fillText(info.scenario.url, browser.x + 56, browser.y + navH / 2 + 4);
    ctx.textAlign = "right";
    ctx.fillStyle = PALETTE.cobalt;
    ctx.fillText(
      `${info.foldMeta.label} · 视觉 ${info.actualVisualPct}%`,
      browser.x + browser.w - 12,
      browser.y + navH / 2 + 4
    );
    ctx.textAlign = "left";

    // 3. 裁剪到浏览器内部内容区绘制真实的 Hero 页面
    ctx.save();
    ctx.beginPath();
    ctx.rect(browser.x + 1, contentTop + 1, browser.w - 2, browser.h - navH - 2);
    ctx.clip();

    // 纸面暖底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(browser.x, contentTop, browser.w, browser.h - navH);

    // 网站轻导航条（极简）
    ctx.fillStyle = PALETTE.cobalt;
    ctx.font = `700 11px "Outfit", sans-serif`;
    ctx.fillText(info.scenario.brand, browser.x + (compact ? 16 : 26), contentTop + 16);

    // 3A. 绘制 H 主视觉层
    ctx.save();
    if (intro < 1) {
      ctx.globalAlpha = 0.25 + intro * 0.75;
    }
    drawVisualMotif(ctx, state, visualRect, t, still);
    ctx.restore();
    hitZones.push({ kind: "visual", rect: visualRect });

    // 如果不是 fullbleed，给主视觉画极细构图边界
    if (state.archetype !== "fullbleed") {
      ctx.strokeStyle = info.hPass ? "rgba(12, 50, 171, 0.28)" : PALETTE.fail;
      ctx.lineWidth = info.hPass ? 1 : 1.5;
      if (!info.hPass) ctx.setLineDash([5, 4]);
      ctx.strokeRect(visualRect.x + 0.5, visualRect.y + 0.5, visualRect.w - 1, visualRect.h - 1);
      ctx.setLineDash([]);
    }

    // 3B. 绘制 M 信息聚焦区（标签 + 主标题 + 副说明 + 289 标志性明黄下横杠）
    const isLightText = info.heroBgType !== "cream";
    const alignCenter = state.archetype === "centered";
    const textAnchorX = alignCenter ? messageRect.x + messageRect.w / 2 : messageRect.x;

    ctx.textAlign = alignCenter ? "center" : "left";

    // 小标签
    ctx.fillStyle = isLightText ? PALETTE.gold : PALETTE.cobalt;
    ctx.font = `700 10px "DM Mono", "Noto Sans SC", monospace`;
    ctx.fillText(info.scenario.tag, textAnchorX, messageRect.y + 12);

    // 主标题（海报斜切或价值主张下带 289 的粗明黄底线）
    const headSize = compact ? (state.messageMode === "fluff" ? 14 : 18) : state.messageMode === "fluff" ? 17 : 23;
    ctx.fillStyle = isLightText ? PALETTE.paperLight : PALETTE.ink;
    ctx.font = `900 ${headSize}px "Noto Sans SC", sans-serif`;
    const headLines = wrapText(ctx, info.msg.headline, messageRect.w - 4, state.messageMode === "fluff" ? 3 : 2);
    const headLH = Math.round(headSize * 1.24);
    headLines.forEach((line, idx) => {
      ctx.fillText(line, textAnchorX, messageRect.y + 16 + (idx + 1) * headLH);
    });

    // 标志性明黄横杠（像 289 海报标语下方）
    const ruleY = messageRect.y + 16 + headLines.length * headLH + 6;
    ctx.fillStyle = PALETTE.goldRule;
    const ruleW = Math.min(messageRect.w * 0.55, 128);
    ctx.fillRect(alignCenter ? textAnchorX - ruleW / 2 : messageRect.x, ruleY, ruleW, 3);

    // 副说明
    const subSize = compact ? 11 : 12;
    ctx.fillStyle = isLightText ? "rgba(255, 251, 240, 0.88)" : PALETTE.inkSoft;
    ctx.font = `400 ${subSize}px "Noto Sans SC", sans-serif`;
    const subLines = wrapText(ctx, info.msg.sub, messageRect.w - 4, state.messageMode === "fluff" ? 3 : 2);
    const subLH = Math.round(subSize * 1.45);
    subLines.forEach((line, idx) => {
      ctx.fillText(line, textAnchorX, ruleY + 14 + idx * subLH);
    });

    ctx.textAlign = "left";
    hitZones.push({ kind: "message", rect: messageRect });

    // 3C. 绘制 A 行动引导区（按钮形态根据 ctaMode 实绘）
    if (state.ctaMode === "crowded") {
      const labels = info.scenario.ctaCrowd;
      const gap = 6;
      const cols = compact ? 2 : 4;
      const bw = Math.floor((ctaRect.w - gap * (cols - 1)) / cols);
      const bh = compact ? 22 : ctaRect.h;
      labels.forEach((lbl, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = ctaRect.x + col * (bw + gap);
        const by = ctaRect.y + row * (bh + 5);
        ctx.fillStyle = "#DCE1EC";
        roundRectPath(ctx, bx, by, bw, bh, 3);
        ctx.fill();
        ctx.strokeStyle = "#8F96AB";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#3A4054";
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(lbl, bx + bw / 2, by + bh / 2 + 4);
      });
      ctx.textAlign = "left";
    } else if (state.ctaMode === "ghost") {
      ctx.fillStyle = "rgba(154, 160, 178, 0.24)";
      roundRectPath(ctx, ctaRect.x, ctaRect.y, ctaRect.w, ctaRect.h, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(122, 128, 148, 0.65)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#7A8094";
      ctx.font = `500 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(info.scenario.ctaPrimary, ctaRect.x + ctaRect.w / 2, ctaRect.y + ctaRect.h / 2 + 4);
      ctx.textAlign = "left";
    } else {
      // 主按钮（高对比实底钴蓝 / 暗底明黄）+ 轻量次级路径
      const btnBg = isLightText ? PALETTE.gold : PALETTE.cobalt;
      const btnFg = isLightText ? PALETTE.ink : PALETTE.paperLight;
      ctx.fillStyle = btnBg;
      roundRectPath(ctx, ctaRect.x, ctaRect.y, ctaRect.w, ctaRect.h, 3);
      ctx.fill();
      ctx.fillStyle = btnFg;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        `${info.scenario.ctaPrimary} →`,
        ctaRect.x + ctaRect.w / 2,
        ctaRect.y + ctaRect.h / 2 + 4
      );
      ctx.textAlign = "left";

      // 轻量次路径（空间够时并排）
      if (!compact && ctaRect.x + ctaRect.w + 96 < browser.x + browser.w - 16) {
        ctx.fillStyle = isLightText ? PALETTE.paperLight : PALETTE.cobalt;
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(
          info.scenario.ctaSecondary,
          ctaRect.x + ctaRect.w + 14,
          ctaRect.y + ctaRect.h / 2 + 4
        );
      }
    }
    hitZones.push({ kind: "cta", rect: ctaRect });

    // 3D. 首屏折叠线下方（Below the Fold）真实半透明遮幕与下节檐口提示
    const belowH = browser.y + browser.h - foldY;
    if (belowH > 2) {
      // 模拟折叠线下微露的次节眉线
      ctx.fillStyle = "rgba(12, 50, 171, 0.08)";
      ctx.fillRect(browser.x, foldY, browser.w, belowH);
      // 半透明深蓝裁切斜纹幕
      ctx.fillStyle = "rgba(8, 29, 102, 0.16)";
      ctx.fillRect(browser.x, foldY, browser.w, belowH);

      // 折叠线下微露的次节内容条（提示非假底部）
      if (info.ctaAboveFold && belowH >= 32) {
        ctx.fillStyle = PALETTE.cobalt;
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.fillText(`↓ 折叠线下：${info.scenario.belowHeading}`, browser.x + (compact ? 14 : 24), foldY + 24);
      }

      // 清晰的首屏折叠线（Above the Fold）
      ctx.strokeStyle = info.ctaAboveFold ? PALETTE.cobalt : PALETTE.fail;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(browser.x, foldY);
      ctx.lineTo(browser.x + browser.w, foldY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 折叠线标签胶囊
      const foldLabel = info.ctaAboveFold
        ? `首屏折叠线 · 按钮余量 +${info.ctaMarginPx}px`
        : `首屏折叠线 · 按钮被裁 ${info.ctaMarginPx}px`;
      ctx.font = `600 10px "DM Mono", "Noto Sans SC", monospace`;
      const flW = ctx.measureText(foldLabel).width + 16;
      const flX = browser.x + browser.w - flW - 8;
      const flY = foldY - 19;
      ctx.fillStyle = info.ctaAboveFold ? PALETTE.cobalt : PALETTE.fail;
      roundRectPath(ctx, flX, flY, flW, 18, 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillText(foldLabel, flX + 8, flY + 12.5);
    }

    // 3E. 视线扫描路径 ①→②→③（非盲闪瞬态时显示）
    if (state.showScan && !isFlashing) {
      const pts = info.scanPoints;
      ctx.strokeStyle = info.allPass ? PALETTE.gold : PALETTE.fail;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 流动光点（动效有目的：演示视线沿 ①→②→③ 走一遍）
      if (!still) {
        const prog = (t * 0.48) % 2;
        const seg = prog < 1 ? 0 : 1;
        const u = prog < 1 ? prog : prog - 1;
        const pA = pts[seg];
        const pB = pts[seg + 1];
        const lx = pA.x + (pB.x - pA.x) * u;
        const ly = pA.y + (pB.y - pA.y) * u;
        ctx.fillStyle = info.allPass ? PALETTE.gold : PALETTE.fail;
        ctx.beginPath();
        ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ① ② ③ 编号圆徽
      pts.forEach((p) => {
        ctx.fillStyle = p.ok ? PALETTE.cobalt : PALETTE.fail;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.paperLight;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = PALETTE.paperLight;
        ctx.font = `700 11px "Outfit", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(String(p.step), p.x, p.y + 4);
      });
      ctx.textAlign = "left";
    }

    // 3F. 底部轻提示条（画布手势说明）
    if (!isFlashing) {
      const hint = compact
        ? "↔ 横拖改视觉占比 · 点图/文/钮改错"
        : "↔ 在画布左右横拖调主视觉占比 · 点击画布里的图 / 文 / 钮直接调整 · 方向键微调";
      ctx.fillStyle = "rgba(249, 242, 226, 0.92)";
      ctx.fillRect(browser.x + 1, browser.y + browser.h - 22, browser.w - 2, 21);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
      ctx.fillText(hint, browser.x + 10, browser.y + browser.h - 7);
    }

    // 3G. 0.5 秒盲闪测验遮幕回放（让用户亲验第一眼到底记住了什么）
    if (flashOverlay) {
      ctx.fillStyle = "rgba(8, 29, 102, 0.94)";
      ctx.fillRect(browser.x, contentTop, browser.w, browser.h - navH);

      const padF = compact ? 16 : 28;
      const fx = browser.x + padF;
      const fw = browser.w - padF * 2;
      let fy = contentTop + (compact ? 26 : 36);

      ctx.fillStyle = PALETTE.gold;
      ctx.font = `700 11px "DM Mono", monospace`;
      ctx.fillText("0.5s FLASH RECALL · 第一眼回放结果", fx, fy);
      fy += 26;

      ctx.fillStyle = PALETTE.paperLight;
      ctx.font = `700 ${compact ? 14 : 18}px "Noto Sans SC", sans-serif`;
      const sumLines = wrapText(ctx, info.flashReport.summary, fw, 2);
      sumLines.forEach((l) => {
        ctx.fillText(l, fx, fy);
        fy += compact ? 21 : 25;
      });
      fy += 10;

      const rows = [
        { k: "① 主视觉", ok: info.hPass, text: info.flashReport.caughtVisual },
        { k: "② 信息", ok: info.mPass, text: info.flashReport.caughtMessage },
        { k: "③ 行动", ok: info.aPass, text: info.flashReport.caughtAction },
      ];
      rows.forEach((r) => {
        ctx.fillStyle = r.ok ? PALETTE.passDark : PALETTE.failDark;
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.fillText(`${r.k} · ${r.ok ? "过关" : "断裂"}`, fx, fy);
        fy += 17;
        ctx.fillStyle = "rgba(255, 251, 240, 0.9)";
        ctx.font = `400 11.5px "Noto Sans SC", sans-serif`;
        wrapText(ctx, r.text, fw, 2).forEach((l) => {
          ctx.fillText(l, fx, fy);
          fy += 16;
        });
        fy += 8;
      });

      // 点击继续按钮
      const btnW = 136;
      const btnH = 30;
      const btnY = Math.min(browser.y + browser.h - btnH - 16, fy + 6);
      ctx.fillStyle = PALETTE.gold;
      roundRectPath(ctx, fx, btnY, btnW, btnH, 3);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("返回继续编排", fx + btnW / 2, btnY + 19);
      ctx.textAlign = "left";
      hitZones = [{ kind: "close-flash", rect: browser }];
    }

    ctx.restore(); // end browser clip

    // 浏览器细钴蓝外描边
    ctx.strokeStyle = PALETTE.cobalt;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(browser.x + 0.75, browser.y + 0.75, browser.w - 1.5, browser.h - 1.5);

    // 4. 宽屏右侧钴蓝建筑批注边栏（原海报肘形圆点引注 + 实时白话结论）
    if (railW > 0) {
      const rx = browser.x + browser.w + 12;
      const innerRX = rx + 16;
      const innerRW = railW - 32;
      let ry = browser.y + 26;

      // 顶部状态徽
      ctx.fillStyle = info.allPass ? PALETTE.passDark : PALETTE.gold;
      ctx.font = `700 11px "DM Mono", monospace`;
      ctx.fillText(`${info.passCount}/3 · ${info.tier}`, innerRX, ry);
      ry += 22;

      // 核心结论句
      ctx.fillStyle = PALETTE.paperLight;
      ctx.font = `700 14px "Noto Sans SC", sans-serif`;
      const titleLines = wrapText(ctx, info.verdictTitle, innerRW, 3);
      titleLines.forEach((line) => {
        ctx.fillText(line, innerRX, ry);
        ry += 20;
      });
      ry += 6;

      // 为什么（白话解释）
      ctx.fillStyle = "rgba(255, 251, 240, 0.86)";
      ctx.font = `400 11.5px "Noto Sans SC", sans-serif`;
      const whyLines = wrapText(ctx, info.verdictWhy, innerRW, 5);
      whyLines.forEach((line) => {
        ctx.fillText(line, innerRX, ry);
        ry += 17;
      });
      ry += 10;

      // 分隔明黄细线
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(innerRX, ry, innerRW, 2);
      ry += 18;

      // 三条原海报肘形引注实况（点击可一键修该项）
      const items = [
        {
          kind: "fix-h",
          tag: "H · 主视觉",
          ok: info.hPass,
          stat: info.hPass ? `${info.actualVisualPct}% 焦点稳固` : info.hIssues[0].short,
        },
        {
          kind: "fix-m",
          tag: "M · 信息聚焦",
          ok: info.mPass,
          stat: info.mPass ? `${info.headlineChars}字 · ${info.headlineContrast}:1` : info.mIssues[0].short,
        },
        {
          kind: "fix-a",
          tag: "A · 行动引导",
          ok: info.aPass,
          stat: info.aPass ? `折线上 +${info.ctaMarginPx}px` : info.aIssues[0].short,
        },
      ];

      items.forEach((it) => {
        const boxH = 42;
        if (ry + boxH > browser.y + browser.h - 10) return;
        ctx.fillStyle = it.ok ? "rgba(108, 230, 184, 0.14)" : "rgba(255, 138, 150, 0.16)";
        roundRectPath(ctx, innerRX, ry, innerRW, boxH, 3);
        ctx.fill();
        ctx.strokeStyle = it.ok ? PALETTE.passDark : PALETTE.failDark;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 肘形圆点标
        ctx.fillStyle = it.ok ? PALETTE.passDark : PALETTE.gold;
        ctx.beginPath();
        ctx.arc(innerRX + 11, ry + 15, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = PALETTE.paperLight;
        ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
        ctx.fillText(it.tag, innerRX + 21, ry + 18);

        ctx.fillStyle = it.ok ? PALETTE.passDark : PALETTE.gold;
        ctx.font = `500 11px "DM Mono", "Noto Sans SC", monospace`;
        ctx.fillText(it.ok ? `✓ ${it.stat}` : `× ${it.stat} · 点修`, innerRX + 21, ry + 34);

        hitZones.push({
          kind: it.kind,
          rect: { x: innerRX, y: ry, w: innerRW, h: boxH },
        });
        ry += boxH + 9;
      });
    }
  }

  // ---------- 指针 + 触控交互（支持 perf.mjs 触屏横拖 + 页面纵向流畅滚动） ----------
  let dragActive = false;
  let dragMoved = false;
  let startX = 0;
  let startY = 0;
  let startShare = 22;

  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function inRect(pt, rect) {
    return pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
  }

  function handleClick(pt) {
    // 逆序匹配（后画的上层元素优先）
    for (let i = hitZones.length - 1; i >= 0; i--) {
      if (inRect(pt, hitZones[i].rect)) {
        onAction(hitZones[i].kind);
        return;
      }
    }
  }

  // Pointer events（桌面鼠标 + 现代触摸）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触摸走原生 touch 事件，避免双触发，且和 perf.mjs 100% 对齐
    dragActive = true;
    dragMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    startShare = getState().visualShare;
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragActive || e.pointerType === "touch") return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) dragMoved = true;
    if (dragMoved) {
      const next = Math.round(clamp(startShare + (dx / Math.max(240, cssW * 0.55)) * 70, 14, 84) * 10) / 10;
      onAction("drag-share", next);
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    const wasMoved = dragMoved;
    dragActive = false;
    dragMoved = false;
    if (!wasMoved) handleClick(toLocal(e.clientX, e.clientY));
  });

  // Native Touch events（专为触屏与 perf.mjs 的 Input.dispatchTouchEvent 调优，横拖改占比、竖滑滚页面）
  let touchMode = ""; // "" | "h" | "v"
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      startX = t0.clientX;
      startY = t0.clientY;
      startShare = getState().visualShare;
      touchMode = "";
      dragMoved = false;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const dx = t0.clientX - startX;
      const dy = t0.clientY - startY;
      if (!touchMode && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        touchMode = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (touchMode === "h") {
        dragMoved = true;
        e.preventDefault();
        const next = Math.round(clamp(startShare + (dx / Math.max(180, cssW * 0.6)) * 70, 14, 84) * 10) / 10;
        onAction("drag-share", next);
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", (e) => {
    if (!dragMoved && e.changedTouches.length) {
      const t0 = e.changedTouches[0];
      handleClick(toLocal(t0.clientX, t0.clientY));
    }
    touchMode = "";
    dragMoved = false;
  });

  return { render, triggerFlash, closeFlash, isFlashingOverlay: () => flashOverlay };
}
