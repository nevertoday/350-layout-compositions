// 264 底部导航布局 — 活体天蓝框手持手机 + 解剖拇指热区 2D Canvas 引擎
// 严格从 model.js 的 evaluateState() 单真源绘制，保证每条读数与画面像素完全一致。

import { PALETTE, evaluateState } from "./model.js";

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

// 简洁清晰的自定义几何 UI 图标（与 264 原海报完全统一）
function drawNavIcon(ctx, name, cx, cy, size, color, filled) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size * 0.5;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.11);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (name === "home") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.92, -s * 0.05);
    ctx.lineTo(0, -s * 0.9);
    ctx.lineTo(s * 0.92, -s * 0.05);
    ctx.lineTo(s * 0.72, -s * 0.05);
    ctx.lineTo(s * 0.72, s * 0.85);
    ctx.lineTo(s * 0.24, s * 0.85);
    ctx.lineTo(s * 0.24, s * 0.25);
    ctx.lineTo(-s * 0.24, s * 0.25);
    ctx.lineTo(-s * 0.24, s * 0.85);
    ctx.lineTo(-s * 0.72, s * 0.85);
    ctx.lineTo(-s * 0.72, -s * 0.05);
    ctx.closePath();
    if (filled) ctx.fill();
    else ctx.stroke();
  } else if (name === "grid") {
    const g = s * 0.44;
    const gap = s * 0.16;
    const coords = [
      [-g * 2 - gap / 2 + g, -g * 2 - gap / 2 + g],
      [gap / 2 + g, -g * 2 - gap / 2 + g],
      [-g * 2 - gap / 2 + g, gap / 2 + g],
      [gap / 2 + g, gap / 2 + g],
    ];
    for (const [ox, oy] of coords) {
      roundRect(ctx, ox - g * 0.78, oy - g * 0.78, g * 1.56, g * 1.56, s * 0.16);
      if (filled) ctx.fill();
      else ctx.stroke();
    }
  } else if (name === "bell") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, s * 0.42);
    ctx.lineTo(s * 0.75, s * 0.42);
    ctx.quadraticCurveTo(s * 0.56, s * 0.18, s * 0.52, -s * 0.2);
    ctx.arc(0, -s * 0.2, s * 0.52, 0, Math.PI, true);
    ctx.quadraticCurveTo(-s * 0.56, s * 0.18, -s * 0.75, s * 0.42);
    ctx.closePath();
    if (filled) ctx.fill();
    else ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, s * 0.68, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === "user") {
    ctx.beginPath();
    ctx.arc(0, -s * 0.42, s * 0.36, 0, Math.PI * 2);
    if (filled) ctx.fill();
    else ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, s * 0.92, s * 0.76, Math.PI * 1.12, Math.PI * 1.88);
    ctx.closePath();
    if (filled) ctx.fill();
    else ctx.stroke();
  } else if (name === "heart") {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.8);
    ctx.bezierCurveTo(-s * 1.05, s * 0.12, -s * 0.98, -s * 0.82, 0, -s * 0.32);
    ctx.bezierCurveTo(s * 0.98, -s * 0.82, s * 1.05, s * 0.12, 0, s * 0.8);
    ctx.closePath();
    if (filled) ctx.fill();
    else ctx.stroke();
  } else if (name === "compass") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.82, 0, Math.PI * 2);
    if (filled) {
      ctx.fill();
      ctx.fillStyle = PALETTE.skyMid;
    } else {
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(s * 0.36, -s * 0.36);
    ctx.lineTo(s * 0.12, s * 0.12);
    ctx.lineTo(-s * 0.36, s * 0.36);
    ctx.lineTo(-s * 0.12, -s * 0.12);
    ctx.closePath();
    ctx.fill();
  } else if (name === "check") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.82, 0, Math.PI * 2);
    if (filled) ctx.fill();
    else ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = filled ? PALETTE.skyMid : color;
    ctx.moveTo(-s * 0.36, 0.02 * s);
    ctx.lineTo(-s * 0.08, s * 0.32);
    ctx.lineTo(s * 0.42, -s * 0.28);
    ctx.stroke();
  } else if (name === "list") {
    for (const dy of [-0.48, 0, 0.48]) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.72, dy * s);
      ctx.lineTo(s * 0.72, dy * s);
      ctx.stroke();
    }
  } else if (name === "cal") {
    roundRect(ctx, -s * 0.76, -s * 0.62, s * 1.52, s * 1.38, s * 0.22);
    if (filled) ctx.fill();
    else ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, -s * 0.86);
    ctx.lineTo(-s * 0.36, -s * 0.44);
    ctx.moveTo(s * 0.36, -s * 0.86);
    ctx.lineTo(s * 0.36, -s * 0.44);
    ctx.stroke();
  } else if (name === "plus") {
    ctx.lineWidth = Math.max(2.2, size * 0.15);
    ctx.beginPath();
    ctx.moveTo(-s * 0.56, 0);
    ctx.lineTo(s * 0.56, 0);
    ctx.moveTo(0, -s * 0.56);
    ctx.lineTo(0, s * 0.56);
    ctx.stroke();
  } else if (name === "gear") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55);
      ctx.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85);
      ctx.stroke();
    }
  } else if (name === "help") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `700 ${Math.round(size * 0.6)}px Archivo, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, s * 0.06);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.08);
    ctx.lineTo(0, s * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.42, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 绘制手机屏幕内部活体应用界面（忠实复刻 264 原海报三套主视觉 + 切页响应）
function drawAppContent(ctx, state, ev, sx, sy, sw, sh, scale) {
  const pad = 16 * scale;
  const scrollPx = state.scrollOffset * scale;
  const topOffset = (state.placement === "top" && state.pinned ? ev.barH : 0) * scale;
  const startY = sy + ev.statusBarH * scale + topOffset + 12 * scale - scrollPx;
  const activeItem = ev.items.find((it) => it.id === state.activeId) || ev.items[0];
  const innerW = sw - pad * 2;

  ctx.save();
  // 裁剪到屏幕内容区
  roundRect(ctx, sx, sy + ev.statusBarH * scale, sw, sh - ev.statusBarH * scale, 18 * scale);
  ctx.clip();

  // 背景纸
  ctx.fillStyle = PALETTE.creamLight;
  ctx.fillRect(sx, sy, sw, sh);

  // 如果是桌面误用模式，绘制宽屏顶栏与多栏网格暗示「这里应该用顶部/侧边导航」
  if (ev.isDesktop) {
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(sx, sy + ev.statusBarH * scale, sw, 42 * scale);
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = `600 ${Math.max(10, 12 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("桌面浏览器视口 · 1080 × 620（鼠标视线集中在上方与左侧）", sx + pad, sy + ev.statusBarH * scale + 21 * scale);

    const cardY = sy + ev.statusBarH * scale + 58 * scale;
    const cols = 3;
    const gap = 16 * scale;
    const cw = (innerW - gap * (cols - 1)) / cols;
    for (let c = 0; c < cols; c++) {
      roundRect(ctx, sx + pad + c * (cw + gap), cardY, cw, 220 * scale, 12 * scale);
      ctx.fillStyle = c === 0 ? PALETTE.sky : c === 1 ? PALETTE.sand : PALETTE.skyMist;
      ctx.fill();
      if (c === 0) {
        ctx.beginPath();
        ctx.arc(sx + pad + cw * 0.55, cardY + 75 * scale, 34 * scale, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.cream;
        ctx.fill();
      }
      ctx.fillStyle = c === 0 ? PALETTE.white : PALETTE.ink;
      ctx.font = `700 ${Math.max(11, 14 * scale)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(c === 0 ? activeItem.screenTitle : c === 1 ? "侧边筛选区" : "详情扩展栏", sx + pad + c * (cw + gap) + 14 * scale, cardY + 178 * scale);
    }
    // 醒目的红色距离警示箭头（从上栏到超远底栏）
    ctx.strokeStyle = PALETTE.bad;
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.setLineDash([6 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx + sw * 0.5, cardY + 238 * scale);
    ctx.lineTo(sx + sw * 0.5, sy + ev.barY * scale - 14 * scale);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.bad;
    ctx.textAlign = "center";
    ctx.font = `700 ${Math.max(10, 12 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.fillText("桌面宽屏下，指针来回跨越底部距离过长且易与系统任务栏冲突", sx + sw * 0.5, cardY + 266 * scale);
    ctx.restore();
    return;
  }

  // 根据当前切到的板块绘制真实对应页面内容
  const archId = state.archetype;
  const isHomeLike = activeItem && (activeItem.id === "home" || activeItem.id === "check");

  // 1) 主视觉海报画框（高度随原型变化）
  const heroH = 204 * scale;
  const heroX = sx + pad;
  const heroY = startY;
  roundRect(ctx, heroX, heroY, innerW, heroH, 14 * scale);
  ctx.save();
  ctx.clip();

  if (!activeItem.core) {
    // 切进低频杂项时，给出提示卡片
    ctx.fillStyle = PALETTE.badSoft;
    ctx.fillRect(heroX, heroY, innerW, heroH);
    ctx.fillStyle = PALETTE.bad;
    ctx.font = `700 ${Math.max(12, 16 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`低频页 · ${activeItem.label}`, heroX + 18 * scale, heroY + 26 * scale);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `500 ${Math.max(10, 12 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.fillText(activeItem.screenSub, heroX + 18 * scale, heroY + 56 * scale);
    // 线框设置列表
    for (let r = 0; r < 3; r++) {
      roundRect(ctx, heroX + 18 * scale, heroY + (92 + r * 32) * scale, innerW - 36 * scale, 22 * scale, 5 * scale);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fill();
    }
  } else if (archId === "browse" && isHomeLike) {
    // 1:1 复刻 264 原海报标志性「晴空蓝天 + 暖奶圆日 + 陶橙起伏山丘」
    ctx.fillStyle = PALETTE.sky;
    ctx.fillRect(heroX, heroY, innerW, heroH);
    // 右下暖白斜坡
    ctx.beginPath();
    ctx.moveTo(heroX + innerW * 0.48, heroY + heroH);
    ctx.quadraticCurveTo(heroX + innerW * 0.78, heroY + heroH * 0.72, heroX + innerW, heroY + heroH * 0.34);
    ctx.lineTo(heroX + innerW, heroY + heroH);
    ctx.closePath();
    ctx.fillStyle = PALETTE.cream;
    ctx.fill();
    // 左侧陶橙丘陵
    ctx.beginPath();
    ctx.moveTo(heroX, heroY + heroH * 0.68);
    ctx.bezierCurveTo(
      heroX + innerW * 0.25,
      heroY + heroH * 0.56,
      heroX + innerW * 0.55,
      heroY + heroH * 0.88,
      heroX + innerW * 0.92,
      heroY + heroH
    );
    ctx.lineTo(heroX, heroY + heroH);
    ctx.closePath();
    ctx.fillStyle = PALETTE.terra;
    ctx.fill();
    // 暖奶圆日
    ctx.beginPath();
    ctx.arc(heroX + innerW * 0.48, heroY + heroH * 0.42, 40 * scale, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.cream;
    ctx.fill();
  } else if (archId === "tasks" && isHomeLike) {
    // 1:1 复刻 264 原海报「任务管理类」：暖砂底 + 晴蓝勾选圆 + 陶橙任务方
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(heroX, heroY, innerW, heroH);
    ctx.beginPath();
    ctx.arc(heroX + innerW * 0.5, heroY + heroH * 0.36, 42 * scale, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.sky;
    ctx.fill();
    ctx.strokeStyle = PALETTE.creamLight;
    ctx.lineWidth = 4.5 * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(heroX + innerW * 0.5 - 16 * scale, heroY + heroH * 0.36 + 2 * scale);
    ctx.lineTo(heroX + innerW * 0.5 - 4 * scale, heroY + heroH * 0.36 + 14 * scale);
    ctx.lineTo(heroX + innerW * 0.5 + 18 * scale, heroY + heroH * 0.36 - 12 * scale);
    ctx.stroke();
    roundRect(ctx, heroX + innerW * 0.5 - 22 * scale, heroY + heroH * 0.66, 44 * scale, 44 * scale, 6 * scale);
    ctx.fillStyle = PALETTE.terra;
    ctx.fill();
  } else if (archId === "explore" && (activeItem.id === "home" || activeItem.id === "compass")) {
    // 1:1 复刻 264 原海报「探索发现类」：暖砂斜切晴蓝 + 陶橙圆日与小三角
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(heroX, heroY, innerW, heroH);
    ctx.beginPath();
    ctx.moveTo(heroX, heroY + heroH * 0.72);
    ctx.lineTo(heroX + innerW, heroY + heroH * 0.28);
    ctx.lineTo(heroX + innerW, heroY + heroH);
    ctx.lineTo(heroX, heroY + heroH);
    ctx.closePath();
    ctx.fillStyle = PALETTE.sky;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(heroX + innerW * 0.68, heroY + heroH * 0.28, 34 * scale, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.terra;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(heroX + innerW * 0.24, heroY + heroH * 0.44);
    ctx.lineTo(heroX + innerW * 0.35, heroY + heroH * 0.58);
    ctx.lineTo(heroX + innerW * 0.13, heroY + heroH * 0.58);
    ctx.closePath();
    ctx.fillStyle = PALETTE.terra;
    ctx.fill();
  } else if (activeItem.id === "grid" || activeItem.id === "list" || activeItem.id === "cal") {
    // 分类 / 计划 / 日历 2×2 卡片网格
    ctx.fillStyle = PALETTE.skyMist;
    ctx.fillRect(heroX, heroY, innerW, heroH);
    const tileGap = 10 * scale;
    const tw = (innerW - tileGap * 3) / 2;
    const th = (heroH - tileGap * 3) / 2;
    const labels =
      activeItem.id === "grid"
        ? ["网格系统", "移动交互", "视觉层级", "字体节奏"]
        : activeItem.id === "list"
          ? ["周一冲刺", "周三评审", "周五发布", "复盘清单"]
          : ["11月27", "11月28", "11月29", "11月30"];
    const fills = [PALETTE.sky, PALETTE.terra, PALETTE.sandDeep, PALETTE.skyMid];
    for (let idx = 0; idx < 4; idx++) {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const tx = heroX + tileGap + col * (tw + tileGap);
      const ty = heroY + tileGap + row * (th + tileGap);
      roundRect(ctx, tx, ty, tw, th, 9 * scale);
      ctx.fillStyle = fills[idx];
      ctx.fill();
      ctx.fillStyle = idx === 2 ? PALETTE.ink : PALETTE.white;
      ctx.font = `700 ${Math.max(10, 12.5 * scale)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(labels[idx], tx + 10 * scale, ty + th - 10 * scale);
    }
  } else if (activeItem.id === "bell") {
    // 消息通知列表
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(heroX, heroY, innerW, heroH);
    const notes = [
      ["版式评审已通过", "2 分钟前", PALETTE.terra],
      ["收到 3 条热区标注", "18 分钟前", PALETTE.skyMid],
      ["底栏规格更新至 60pt", "1 小时前", PALETTE.ok],
    ];
    notes.forEach(([title, time, dot], i) => {
      const ry = heroY + 14 * scale + i * 62 * scale;
      roundRect(ctx, heroX + 10 * scale, ry, innerW - 20 * scale, 52 * scale, 10 * scale);
      ctx.fillStyle = PALETTE.white;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(heroX + 28 * scale, ry + 26 * scale, 7 * scale, 0, Math.PI * 2);
      ctx.fillStyle = dot;
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.max(10, 12 * scale)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(title, heroX + 44 * scale, ry + 11 * scale);
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `500 ${Math.max(9, 10 * scale)}px Archivo, "Noto Sans SC", sans-serif`;
      ctx.fillText(time, heroX + 44 * scale, ry + 30 * scale);
    });
  } else {
    // 我的 / 收藏 卡片
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(heroX, heroY, innerW, heroH);
    ctx.beginPath();
    ctx.arc(heroX + 48 * scale, heroY + 62 * scale, 26 * scale, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.terra;
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${Math.max(11, 14 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(activeItem.screenTitle, heroX + 86 * scale, heroY + 42 * scale);
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = `500 ${Math.max(9.5, 11 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.fillText(activeItem.screenSub, heroX + 86 * scale, heroY + 66 * scale);
    for (let k = 0; k < 2; k++) {
      roundRect(ctx, heroX + 18 * scale + k * (innerW * 0.48), heroY + 118 * scale, innerW * 0.44, 64 * scale, 10 * scale);
      ctx.fillStyle = PALETTE.creamLight;
      ctx.fill();
      ctx.fillStyle = k === 0 ? PALETTE.skyDeep : PALETTE.terraDark;
      ctx.font = `700 ${Math.max(13, 18 * scale)}px Archivo, sans-serif`;
      ctx.fillText(k === 0 ? "28" : "14", heroX + 32 * scale + k * (innerW * 0.48), heroY + 132 * scale);
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `500 ${Math.max(9, 10.5 * scale)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(k === 0 ? "收藏板式" : "本周完成", heroX + 32 * scale + k * (innerW * 0.48), heroY + 157 * scale);
    }
  }
  ctx.restore();

  // 2) 承袭原海报的「蓝条标题 + 三行浅灰正文条 + 暖砂圆点卡」与更多可滚列表项
  const titleY = heroY + heroH + 18 * scale;
  roundRect(ctx, heroX, titleY, innerW * 0.46, 12 * scale, 3 * scale);
  ctx.fillStyle = PALETTE.sky;
  ctx.fill();

  // 当前页小标签（清晰告知切页确实生效，极小横屏自动精简防溢框）
  const compact = scale < 0.48;
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.font = `600 ${Math.max(7, 11 * scale)}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(
    compact ? activeItem.label : `当前页：${activeItem.label} · ${activeItem.screenTitle}`,
    heroX + innerW,
    titleY + 6 * scale
  );

  for (let l = 0; l < 3; l++) {
    const lw = l === 2 ? innerW * 0.72 : innerW;
    roundRect(ctx, heroX, titleY + (24 + l * 18) * scale, lw, 9 * scale, 2.5 * scale);
    ctx.fillStyle = PALETTE.skel;
    ctx.fill();
  }

  // 原海报标志性暖砂大卡片（左陶橙圆 + 右双天蓝条 + 三蓝点）
  const card1Y = titleY + 86 * scale;
  roundRect(ctx, heroX, card1Y, innerW, 82 * scale, 12 * scale);
  ctx.fillStyle = PALETTE.sand;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(heroX + 42 * scale, card1Y + 41 * scale, 24 * scale, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.terra;
  ctx.fill();
  roundRect(ctx, heroX + 82 * scale, card1Y + 26 * scale, innerW * 0.46, 9 * scale, 3 * scale);
  ctx.fillStyle = PALETTE.sky;
  ctx.fill();
  roundRect(ctx, heroX + 82 * scale, card1Y + 45 * scale, innerW * 0.34, 9 * scale, 3 * scale);
  ctx.fillStyle = PALETTE.sky;
  ctx.fill();
  for (let d = 0; d < 3; d++) {
    ctx.beginPath();
    ctx.arc(heroX + innerW - (34 - d * 10) * scale, card1Y + 65 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.sky;
    ctx.fill();
  }

  // 下方第 2、3 张延伸卡片（用于模拟下滚内容时验证底栏固定/失锚）
  for (let m = 0; m < 2; m++) {
    const cy2 = card1Y + (96 + m * 86) * scale;
    roundRect(ctx, heroX, cy2, innerW, 74 * scale, 12 * scale);
    ctx.fillStyle = m === 0 ? PALETTE.skyMist : PALETTE.sand;
    ctx.fill();
    roundRect(ctx, heroX + 16 * scale, cy2 + 18 * scale, innerW * 0.42, 10 * scale, 3 * scale);
    ctx.fillStyle = m === 0 ? PALETTE.skyMid : PALETTE.terra;
    ctx.fill();
    roundRect(ctx, heroX + 16 * scale, cy2 + 38 * scale, innerW * 0.78, 8 * scale, 3 * scale);
    ctx.fillStyle = PALETTE.skel;
    ctx.fill();
    roundRect(ctx, heroX + 16 * scale, cy2 + 53 * scale, innerW * 0.56, 8 * scale, 3 * scale);
    ctx.fillStyle = PALETTE.skel;
    ctx.fill();
  }

  // 若开场是顶置错态，在底部空荡处标出虚线「单手拇指黄金停靠区」引导拖拽
  if (state.placement === "top") {
    const dockH = 58 * scale;
    const dockY = sy + sh - dockH - 6 * scale;
    ctx.save();
    roundRect(ctx, sx + 10 * scale, dockY, sw - 20 * scale, dockH, 12 * scale);
    ctx.fillStyle = "rgba(98, 161, 214, 0.14)";
    ctx.fill();
    ctx.strokeStyle = PALETTE.skyDeep;
    ctx.lineWidth = Math.max(1.5, 1.8 * scale);
    ctx.setLineDash([6 * scale, 5 * scale]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.skyDeep;
    ctx.font = `700 ${Math.max(7, 12 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(compact ? "↓ 点此贴底停靠 ↓" : "↓ 拇指热区空着：拖顶栏下来停靠 ↓", sx + sw / 2, dockY + dockH / 2);
    ctx.restore();
  }

  ctx.restore();
}

// 绘制导航栏本体（贴底或错放顶部，严格按 ev.slots 坐标画）
function drawNavBar(ctx, state, ev, sx, sy, sw, sh, scale, pulsePhase) {
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, 24 * scale);
  ctx.clip();

  const by = sy + ev.barY * scale;
  const bh = ev.barH * scale;
  const barColor = ev.arch.barColor;

  // 若未固定且滚出视口，顶部给一条醒目失锚提示
  if (ev.scrolledOut) {
    const warnY = state.placement === "top" ? sy + ev.statusBarH * scale + 8 * scale : sy + sh - 42 * scale;
    roundRect(ctx, sx + 18 * scale, warnY, sw - 36 * scale, 32 * scale, 8 * scale);
    ctx.fillStyle = PALETTE.bad;
    ctx.fill();
    ctx.fillStyle = PALETTE.white;
    ctx.font = `700 ${Math.max(10, 11.5 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("× 未固定：导航栏已随滚动漂走失锚", sx + sw / 2, warnY + 16 * scale);
  }

  // 底栏背景体（注意：fillRect 不重置 clip 路径，绝不能在 fillRect 后再调 ctx.fill()）
  ctx.fillStyle = barColor;
  if (state.placement === "bottom") {
    roundRect(ctx, sx, by, sw, bh + 18 * scale, 16 * scale);
    ctx.fill();
  } else {
    ctx.fillRect(sx, by, sw, bh);
  }

  // 如果顶置，画一条明显的红色错误提示边与可下拖提示条
  if (state.placement === "top") {
    ctx.strokeStyle = PALETTE.bad;
    ctx.lineWidth = Math.max(2, 2.2 * scale);
    ctx.strokeRect(sx + 1, by + 1, sw - 2, bh - 2);
  }

  // 绘制每个导航槽
  for (const s of ev.slots) {
    const rx = sx + s.x * scale;
    const ry = sy + s.y * scale;
    const rw = s.w * scale;
    const rh = s.h * scale;
    const rcx = sx + s.cx * scale;
    const rcy = sy + s.cy * scale;

    if (s.isFab) {
      // 1:1 复刻原海报任务管理类居中陶橙 `+` 浮钮
      const fabR = Math.min(24, ev.barH * 0.42) * scale;
      ctx.beginPath();
      ctx.arc(rcx, ry + rh * 0.46, fabR + 3 * scale, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.creamLight;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rcx, ry + rh * 0.46, fabR, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.terra;
      ctx.fill();
      drawNavIcon(ctx, "plus", rcx, ry + rh * 0.46, fabR * 1.15, PALETTE.white, true);
      continue;
    }

    const isActive = state.showActive && s.id === state.activeId;
    const isClutter = !s.core;

    // 低频杂项标红虚线框（支持直接点击移出）
    if (isClutter) {
      ctx.save();
      roundRect(ctx, rx + 2 * scale, ry + 3 * scale, rw - 4 * scale, rh - 6 * scale, 6 * scale);
      ctx.fillStyle = "rgba(185, 43, 39, 0.34)";
      ctx.fill();
      ctx.strokeStyle = "#FFE5E2";
      ctx.lineWidth = Math.max(1.2, 1.5 * scale);
      ctx.setLineDash([4 * scale, 3 * scale]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 选中态样式（原海报下划线 / M3 胶囊 / 实心反色）
    if (isActive && state.activeStyle === "pill") {
      const pw = Math.min(rw - 8 * scale, 54 * scale);
      const ph = Math.min(rh * 0.48, 28 * scale);
      roundRect(ctx, rcx - pw / 2, ry + (state.showLabels ? rh * 0.12 : (rh - ph) / 2), pw, ph, ph / 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.fill();
    } else if (isActive && state.activeStyle === "filled") {
      roundRect(ctx, rx + 4 * scale, ry + 4 * scale, rw - 8 * scale, rh - 8 * scale, 10 * scale);
      ctx.fillStyle = PALETTE.creamLight;
      ctx.fill();
    }

    const fgColor =
      isActive && state.activeStyle === "filled"
        ? barColor
        : isActive || !state.showActive
          ? PALETTE.white
          : "rgba(255, 255, 255, 0.72)";

    const iconSize = Math.max(13, Math.min(22, ev.barH * (state.showLabels ? 0.36 : 0.48))) * scale;
    const iconY = state.showLabels ? ry + rh * 0.36 : rcy;
    drawNavIcon(ctx, s.icon, rcx, iconY, iconSize, fgColor, isActive || !state.showActive);

    // 文字标签
    if (state.showLabels) {
      const fontSize = Math.max(9.5, Math.min(12, rw * 0.21)) * scale;
      ctx.fillStyle = fgColor;
      ctx.font = `${isActive ? 700 : 500} ${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.label, rcx, ry + rh * 0.72);
    }

    // 1:1 复刻原海报底部白色选中短横线
    if (isActive && state.activeStyle === "underline") {
      const uw = Math.min(28 * scale, rw * 0.48);
      roundRect(ctx, rcx - uw / 2, ry + rh - 6.5 * scale, uw, 3.2 * scale, 1.6 * scale);
      ctx.fillStyle = PALETTE.white;
      ctx.fill();
    }

    // 红点徽标（正常只给消息/待办轻点；开启 badgeFlood 时全员泛滥）
    const showBadge = state.badgeFlood || (s.badge && s.core && ev.score >= 3);
    if (showBadge) {
      const bx = rcx + iconSize * 0.48;
      const by2 = iconY - iconSize * 0.44;
      const br = (state.badgeFlood ? 7 : 5.2) * scale;
      ctx.beginPath();
      ctx.arc(bx, by2, br + 1.4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = barColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by2, br, 0, Math.PI * 2);
      ctx.fillStyle = "#FF3B30";
      ctx.fill();
      if (state.badgeFlood) {
        ctx.fillStyle = PALETTE.white;
        ctx.font = `700 ${Math.max(8, 9 * scale)}px Archivo, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("99", bx, by2 + 0.5 * scale);
      }
    }

    // 标红杂项右上小 × 暗示可点删
    if (isClutter) {
      const cx2 = rx + rw - 8 * scale;
      const cy2 = ry + 9 * scale;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 6.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.bad;
      ctx.fill();
      ctx.fillStyle = PALETTE.white;
      ctx.font = `700 ${Math.max(8, 9.5 * scale)}px Archivo, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×", cx2, cy2 + 0.5 * scale);
    }
  }

  // 若开启单格过窄（指肚碰撞），在底栏槽位缝隙画 44pt 碰撞红圈警示
  if (ev.padOverlap && !ev.isDesktop && !ev.scrolledOut) {
    const midSlot = ev.slots[Math.min(2, ev.slots.length - 1)];
    if (midSlot) {
      const rPad = 22 * scale; // 44pt 直径指肚
      const rcx = sx + midSlot.cx * scale;
      const rcy = sy + midSlot.cy * scale;
      ctx.strokeStyle = `rgba(255, 240, 120, ${0.7 + 0.25 * Math.sin(pulsePhase * 4)})`;
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.beginPath();
      ctx.arc(rcx, rcy, rPad, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// 绘制解剖拇指热区扇弧与实时可拖拇指触点
function drawThumbOverlay(ctx, state, ev, sx, sy, sw, sh, scale, benchState) {
  if (!state.showThumbMap || ev.isDesktop) return;

  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, 24 * scale);
  ctx.clip();

  const ox = sx + ev.origin.x * scale;
  const oy = sy + ev.origin.y * scale;
  const rNat = ev.origin.rNatural * scale;
  const rStr = ev.origin.rStretch * scale;

  // 够不着区轻红雾（屏幕顶部）
  ctx.fillStyle = "rgba(185, 43, 39, 0.08)";
  ctx.fillRect(sx, sy, sw, sh);

  // 伸展区（淡暖金）
  ctx.beginPath();
  ctx.arc(ox, oy, rStr, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(209, 93, 57, 0.07)";
  ctx.fill();

  // 自然舒适热区（清新晴空绿青）
  ctx.beginPath();
  ctx.arc(ox, oy, rNat, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(31, 122, 90, 0.14)";
  ctx.fill();

  // 清晰弧界虚线
  ctx.lineWidth = Math.max(1.3, 1.6 * scale);
  ctx.setLineDash([6 * scale, 5 * scale]);
  ctx.strokeStyle = "rgba(31, 122, 90, 0.62)";
  ctx.beginPath();
  ctx.arc(ox, oy, rNat, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(185, 43, 39, 0.45)";
  ctx.beginPath();
  ctx.arc(ox, oy, rStr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 弧线内侧区标小字（不遮挡核心按钮）
  const compact = scale < 0.48;
  ctx.font = `700 ${Math.max(7, 10.5 * scale)}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = state.hand === "right" ? "left" : "right";
  const labelX = state.hand === "right" ? sx + 14 * scale : sx + sw - 14 * scale;
  ctx.fillStyle = "rgba(160, 32, 28, 0.85)";
  ctx.fillText("够不着区", labelX, sy + ev.statusBarH * scale + (state.placement === "top" ? ev.barH + 16 : 16) * scale);
  if (!compact) {
    ctx.fillStyle = "rgba(21, 92, 67, 0.9)";
    ctx.fillText("自然拇指热区", labelX, sy + sh - (state.placement === "bottom" ? ev.barH + 16 : 74) * scale);
  }

  // 当前可拖拇指触点（或 Space 自动实测时的扫弧指针）
  const tx = sx + (benchState.active ? benchState.tx : ev.thumbX) * scale;
  const ty = sy + (benchState.active ? benchState.ty : ev.thumbY) * scale;
  const tReach = benchState.active ? benchState.reach : ev.thumbReach;
  const padColor =
    tReach.zone === "natural" ? PALETTE.ok : tReach.zone === "stretch" ? PALETTE.warn : PALETTE.bad;

  // 从手掌根部引出的拇指力臂线
  ctx.strokeStyle = padColor;
  ctx.globalAlpha = 0.48;
  ctx.lineWidth = Math.max(2, 2.4 * scale);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 真实 44pt 直径指肚触控圆
  const fingerR = 22 * scale;
  ctx.beginPath();
  ctx.arc(tx, ty, fingerR, 0, Math.PI * 2);
  ctx.fillStyle =
    tReach.zone === "natural"
      ? "rgba(31, 122, 90, 0.22)"
      : tReach.zone === "stretch"
        ? "rgba(180, 83, 9, 0.22)"
        : "rgba(185, 43, 39, 0.24)";
  ctx.fill();
  ctx.strokeStyle = padColor;
  ctx.lineWidth = Math.max(2, 2.2 * scale);
  ctx.stroke();

  // 指尖圆心
  ctx.beginPath();
  ctx.arc(tx, ty, 5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = padColor;
  ctx.fill();

  // 紧凑浮签：只显示实时区位与 44pt 指肚标记
  const pillText = benchState.active
    ? `实测 ${benchState.stepLabel} · ${tReach.label}`
    : compact
      ? tReach.label
      : `${state.hand === "right" ? "右" : "左"}拇指 · ${tReach.label}`;
  ctx.font = `700 ${Math.max(7, 10.5 * scale)}px "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(pillText).width + 14 * scale;
  const th = Math.max(14, 22 * scale);
  const px = Math.max(sx + 8 * scale, Math.min(sx + sw - tw - 8 * scale, tx - tw / 2));
  const py = ty - fingerR - th - 6 * scale < sy + 36 * scale ? ty + fingerR + 6 * scale : ty - fingerR - th - 6 * scale;
  roundRect(ctx, px, py, tw, th, th / 2);
  ctx.fillStyle = padColor;
  ctx.fill();
  ctx.fillStyle = PALETTE.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, px + tw / 2, py + th / 2 + 0.5);

  ctx.restore();
}

export function createHeroRenderer(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let layoutGeom = null;
  let dragging = null; // "thumb" | "dock" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let pointerMoved = false;

  // Space 自动三步拇指切页实测动画状态
  const bench = {
    active: false,
    t: 0,
    tx: 270,
    ty: 580,
    reach: { zone: "natural", label: "自然热区" },
    stepLabel: "",
    targets: [],
  };

  function startBench() {
    const state = getState();
    const ev = evaluateState(state);
    if (ev.isDesktop) return;
    const pick = [0, Math.floor(ev.slots.length / 2), ev.slots.length - 1]
      .filter((v, i, a) => a.indexOf(v) === i && ev.slots[v])
      .map((i) => ev.slots[i]);
    bench.active = true;
    bench.t = 0;
    bench.targets = pick;
    bench.tx = ev.thumbX;
    bench.ty = ev.thumbY;
  }

  function computeFrameGeom(cw, ch, ev) {
    const padX = ev.isDesktop ? 14 : 18;
    const padTop = 14;
    const padBottom = 14;
    const bezel = ev.isDesktop ? 10 : 12;
    const availW = Math.max(120, cw - padX * 2 - bezel * 2);
    const availH = Math.max(180, ch - padTop - padBottom - bezel * 2);
    const scale = Math.min(availW / ev.screenW, availH / ev.screenH);
    const sw = ev.screenW * scale;
    const sh = ev.screenH * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;
    return { sx, sy, sw, sh, scale, bezel };
  }

  function draw(time = 0, dt = 0, opts = {}) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.round(rect.width));
    const ch = Math.max(1, Math.round(rect.height));
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    const state = getState();
    const ev = evaluateState(state);
    const g = computeFrameGeom(cw, ch, ev);
    layoutGeom = { ...g, ev };

    // 推进 Space 自动实测动画
    if (bench.active) {
      if (opts.still) {
        bench.active = false;
      } else {
        bench.t += Math.max(dt, 0.016);
        const stepDur = 0.85;
        const idx = Math.floor(bench.t / stepDur);
        if (idx >= bench.targets.length) {
          bench.active = false;
        } else {
          const tgt = bench.targets[idx];
          const prev = idx === 0 ? { cx: ev.thumbX, cy: ev.thumbY } : bench.targets[idx - 1];
          const p = Math.min(1, (bench.t - idx * stepDur) / (stepDur * 0.65));
          const ease = 1 - Math.pow(1 - p, 3);
          bench.tx = prev.cx + (tgt.cx - prev.cx) * ease;
          bench.ty = prev.cy + (tgt.cy - prev.cy) * ease;
          bench.reach = tgt.reach;
          bench.stepLabel = tgt.label;
          if (p > 0.85 && !tgt.isFab && state.activeId !== tgt.id) {
            onMutate({ activeId: tgt.id }, { silent: true });
          }
        }
      }
    }

    // 衬底柔和天蓝波纹装饰（与原海报左下方天蓝弧浪呼应）
    ctx.beginPath();
    ctx.moveTo(0, ch * 0.78);
    ctx.quadraticCurveTo(cw * 0.5, ch * 0.68, cw, ch * 0.82);
    ctx.lineTo(cw, ch);
    ctx.lineTo(0, ch);
    ctx.closePath();
    ctx.fillStyle = "rgba(98, 161, 214, 0.14)";
    ctx.fill();

    // 手机机身软阴影
    ctx.save();
    ctx.shadowColor = "rgba(20, 36, 56, 0.14)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    roundRect(
      ctx,
      g.sx - g.bezel,
      g.sy - g.bezel,
      g.sw + g.bezel * 2,
      g.sh + g.bezel * 2,
      ev.isDesktop ? 16 : 34 * g.scale
    );
    ctx.fillStyle = ev.isDesktop ? PALETTE.navy : ev.arch.bezelColor;
    ctx.fill();
    ctx.restore();

    // 内部屏幕圆角白底
    roundRect(ctx, g.sx, g.sy, g.sw, g.sh, ev.isDesktop ? 10 : 24 * g.scale);
    ctx.fillStyle = PALETTE.creamLight;
    ctx.fill();

    // 状态栏（时间 + 信号小点，桌面则是三色圆点窗口条）
    ctx.save();
    roundRect(ctx, g.sx, g.sy, g.sw, g.sh, ev.isDesktop ? 10 : 24 * g.scale);
    ctx.clip();
    ctx.fillStyle = ev.isDesktop ? "#1E344C" : PALETTE.cream;
    ctx.fillRect(g.sx, g.sy, g.sw, ev.statusBarH * g.scale);
    if (ev.isDesktop) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(g.sx + (16 + i * 14) * g.scale, g.sy + 18 * g.scale, 4.5 * g.scale, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? PALETTE.terra : i === 1 ? "#E9B44C" : PALETTE.sky;
        ctx.fill();
      }
    } else {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.max(9.5, 11 * g.scale)}px Archivo, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("9:41", g.sx + 18 * g.scale, g.sy + (ev.statusBarH / 2) * g.scale);
      // 听筒胶囊
      roundRect(ctx, g.sx + g.sw / 2 - 26 * g.scale, g.sy + 9 * g.scale, 52 * g.scale, 10 * g.scale, 5 * g.scale);
      ctx.fillStyle = "rgba(20, 20, 19, 0.14)";
      ctx.fill();
      // 右上电池图标
      roundRect(ctx, g.sx + g.sw - 36 * g.scale, g.sy + 10 * g.scale, 18 * g.scale, 9 * g.scale, 2.5 * g.scale);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = Math.max(1.2, 1.3 * g.scale);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(g.sx + g.sw - 34 * g.scale, g.sy + 12 * g.scale, 12 * g.scale, 5 * g.scale);
    }
    ctx.restore();

    // 1. 活体应用内容区
    drawAppContent(ctx, state, ev, g.sx, g.sy, g.sw, g.sh, g.scale);
    // 2. 导航栏本体
    drawNavBar(ctx, state, ev, g.sx, g.sy, g.sw, g.sh, g.scale, time);
    // 3. 拇指人体工学热区与可拖触点
    drawThumbOverlay(ctx, state, ev, g.sx, g.sy, g.sw, g.sh, g.scale, bench);

    ctx.restore();
  }

  // 把鼠标/触摸点转成手机逻辑坐标
  function clientToLogical(clientX, clientY) {
    if (!layoutGeom) return null;
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const lx = (x - layoutGeom.sx) / layoutGeom.scale;
    const ly = (y - layoutGeom.sy) / layoutGeom.scale;
    return { lx, ly, ev: layoutGeom.ev };
  }

  function handlePointerDown(clientX, clientY) {
    const pt = clientToLogical(clientX, clientY);
    if (!pt) return false;
    bench.active = false;
    pointerMoved = false;
    dragStartX = pt.lx;
    dragStartY = pt.ly;

    const { lx, ly, ev } = pt;
    // 判断是否按在顶置导航栏上（允许直接往下拉到底部停靠）
    const inBar = lx >= 0 && lx <= ev.screenW && ly >= ev.barY - 6 && ly <= ev.barY + ev.barH + 6;
    dragging = inBar && getState().placement === "top" ? "dock" : "thumb";
    return true;
  }

  function handlePointerMove(clientX, clientY) {
    if (!dragging) return;
    const pt = clientToLogical(clientX, clientY);
    if (!pt) return;
    const { lx, ly, ev } = pt;
    if (!pointerMoved && Math.hypot(lx - dragStartX, ly - dragStartY) < 6) return;
    const u = Math.max(0.04, Math.min(0.96, lx / ev.screenW));
    const v = Math.max(0.08, Math.min(0.96, ly / ev.screenH));
    pointerMoved = true;

    if (dragging === "dock" && ly - dragStartY > 70) {
      dragging = "thumb";
      onMutate({ placement: "bottom", pinned: true, scrollOffset: 0, thumbU: u, thumbV: 0.9 });
      return;
    }

    // 横拖时让拇指自然顺着解剖弧微弯，移动丝滑且实时刷新读数
    onMutate({ thumbU: u, thumbV: v });
  }

  function handlePointerUp(clientX, clientY) {
    if (!dragging) return;
    const wasDragging = dragging;
    dragging = null;
    if (pointerMoved) return;

    // 视为精准点击：点底栏槽位 → 杂项则原地移出，核心项则真实切页！
    const pt = clientToLogical(clientX, clientY);
    if (!pt) return;
    const { lx, ly, ev } = pt;
    const state = getState();

    // 点到底部虚线停靠提示框 → 直接把顶栏拉回底部
    if (state.placement === "top" && ly > ev.screenH - 96 && lx >= 0 && lx <= ev.screenW) {
      onMutate({ placement: "bottom", pinned: true, scrollOffset: 0, thumbV: 0.91 });
      return;
    }

    for (const s of ev.slots) {
      if (lx >= s.x && lx <= s.x + s.w && ly >= s.y - 6 && ly <= s.y + s.h + 6) {
        if (s.isFab) {
          onMutate({ thumbU: s.cx / ev.screenW, thumbV: s.cy / ev.screenH });
          return;
        }
        if (!s.core) {
          // 直接点标红的低频杂项将其移出底栏
          const nextIds = state.itemIds.filter((id) => id !== s.id);
          const nextActive = state.activeId === s.id ? nextIds[0] : state.activeId;
          onMutate({ itemIds: nextIds, activeId: nextActive, thumbU: s.cx / ev.screenW, thumbV: s.cy / ev.screenH });
          return;
        }
        onMutate({ activeId: s.id, thumbU: s.cx / ev.screenW, thumbV: s.cy / ev.screenH });
        return;
      }
    }

    // 点击屏幕其他位置：更新拇指测试点
    if (wasDragging && lx >= 0 && lx <= ev.screenW && ly >= 0 && ly <= ev.screenH) {
      onMutate({ thumbU: lx / ev.screenW, thumbV: ly / ev.screenH });
    }
  }

  // 同时兼容桌面鼠标与触屏（tools/perf.mjs 发 TouchEvent）
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLocked = false;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由下方 touch 事件，避免双触发且保证页面可竖滚
    canvas.setPointerCapture(e.pointerId);
    handlePointerDown(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    handlePointerMove(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    handlePointerUp(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointercancel", () => {
    dragging = null;
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchLocked = false;
      handlePointerDown(t.clientX, t.clientY);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !dragging) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      if (!touchLocked && dx + dy > 6) {
        // 横拖归玩具（同时完美适配 perf.mjs 左右拖），明显竖滑放行让页面能滚
        touchLocked = dx >= dy * 0.85 || dragging === "dock";
        if (!touchLocked) {
          dragging = null;
          return;
        }
      }
      if (touchLocked) {
        e.preventDefault();
        handlePointerMove(t.clientX, t.clientY);
      }
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches[0];
      if (t) handlePointerUp(t.clientX, t.clientY);
      else dragging = null;
      touchLocked = false;
    },
    { passive: true }
  );

  return {
    draw,
    startBench,
    isBenchmarking: () => bench.active,
  };
}
