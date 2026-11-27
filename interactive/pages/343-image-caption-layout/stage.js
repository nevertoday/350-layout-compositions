// 343 图片与标题说明 幻灯片版式 · 2D Canvas 活体暗室剪辑台 + 03 节远距清晰度模拟器
// 严格遵循 lib/stage.js 省电循环、高帧率纯 2D 绘制（6× CPU + 软件渲染稳定 ≥ 55fps）

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeLayout, evaluate } from "./model.js";

const PALETTE = {
  obsidian: "#0A0E11",
  peak: "#0E1216",
  panel: "#11161B",
  frame: "#2C3339",
  cobalt: "#123FDF",
  cobaltFlat: "#334768",
  cobaltIcon: "#1845E3",
  bone: "#EFE8DB",
  boneBright: "#F8F4EC",
  boneMuted: "#C2C6CA",
  vermilion: "#F35512",
  amber: "#ED7D21",
  amberBright: "#FF8F3D",
  pass: "#22C58B",
  alert: "#F2545B",
  alertBg: "rgba(184, 29, 36, 0.92)",
};

const FONT_ZH = '"Noto Sans SC", system-ui, sans-serif';
const FONT_MONO = '"JetBrains Mono", monospace';
const FONT_DISP = '"Unbounded", "Noto Sans SC", sans-serif';

// 中文按像素宽度自动折行（返回真实渲染行数组，不截断、不溢出）
function wrapLines(ctx, text, maxWidth, maxLines = 12) {
  if (!text) return [];
  const lines = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

// 绘制原海报三大主题的高清几何主图（完全 1:1 承袭 343 克莱因蓝 + 骨白圆日 + 玄黑峰 + 朱橙方 + 3×4 白点 + 6 白杠）
function drawDeckVisual(ctx, rect, deckId, visualMode, guideMode, introT, deckFocusOffset = 0) {
  const { x, y, w, h } = rect;
  if (w < 8 || h < 8) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // 底色：克莱因蓝（若处于灰平无焦错态，则降对比度为灰雾蓝）
  ctx.fillStyle = visualMode === "flat" ? PALETTE.cobaltFlat : PALETTE.cobalt;
  ctx.fillRect(x, y, w, h);

  const s = Math.min(w, h);
  const cx = x + w * (0.56 + deckFocusOffset * 0.04);
  const cy = y + h * 0.44;
  const sunR = s * (visualMode === "flat" ? 0.23 : 0.30) * clamp(introT * 1.25, 0.72, 1);

  if (visualMode === "flat") {
    // 灰平无焦：平淡同色系雾层，缺乏主体轮廓反差
    ctx.fillStyle = "rgba(116, 138, 174, 0.55)";
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(69, 86, 114, 0.75)";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, y + h);
    ctx.lineTo(x + w * 0.54, y + h * 0.56);
    ctx.lineTo(x + w * 0.90, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(130, 146, 172, 0.52)";
    ctx.fillRect(cx + sunR * 0.25, cy - sunR * 0.52, sunR * 0.55, sunR * 0.48);
  } else if (deckId === "architecture") {
    // 建筑汇报 · 北向采光穹顶剖面（同源 343 视觉语言）
    // 顶部柔和天光晕
    const g = ctx.createRadialGradient(cx, cy - sunR * 0.2, sunR * 0.15, cx, cy, sunR * 1.45);
    g.addColorStop(0, "rgba(239, 232, 219, 0.30)");
    g.addColorStop(1, "rgba(18, 63, 223, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    // 骨白采光圆穹
    ctx.fillStyle = PALETTE.bone;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    // 穹顶内弧漫反射细线
    ctx.strokeStyle = "rgba(18, 63, 223, 0.26)";
    ctx.lineWidth = Math.max(1, s * 0.005);
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 0.78, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();

    // 玄黑屋脊锯齿建筑剖面
    ctx.fillStyle = PALETTE.peak;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.10, y + h);
    ctx.lineTo(x + w * 0.10, y + h * 0.80);
    ctx.lineTo(cx - sunR * 0.06, cy + sunR * 0.10);
    ctx.lineTo(cx + sunR * 0.92, y + h * 0.82);
    ctx.lineTo(x + w * 0.95, y + h * 0.82);
    ctx.lineTo(x + w * 0.95, y + h);
    ctx.closePath();
    ctx.fill();

    // 朱橙北向天窗开口标位块
    const sqW = sunR * 0.72;
    const sqH = sunR * 0.56;
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(cx + sunR * 0.36, cy - sunR * 0.60, sqW, sqH);
    ctx.strokeStyle = "rgba(239, 232, 219, 0.85)";
    ctx.lineWidth = Math.max(1.2, s * 0.006);
    ctx.beginPath();
    ctx.moveTo(cx + sunR * 0.36 + sqW * 0.2, cy - sunR * 0.60 + sqH * 0.8);
    ctx.lineTo(cx + sunR * 0.36 + sqW * 0.8, cy - sunR * 0.60 + sqH * 0.2);
    ctx.stroke();
  } else if (deckId === "product") {
    // 产品发布 · 声学腔体剖面（同源 343 视觉语言）
    // 骨白大口径声学振膜圆盘
    ctx.fillStyle = PALETTE.bone;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    // 振膜同心波纹悬边
    ctx.strokeStyle = "rgba(18, 63, 223, 0.22)";
    ctx.lineWidth = Math.max(1.2, s * 0.008);
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 0.36, 0, Math.PI * 2);
    ctx.stroke();

    // 玄黑楔形声学导流腔切面
    ctx.fillStyle = PALETTE.peak;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, y + h);
    ctx.lineTo(cx, cy + sunR * 0.16);
    ctx.lineTo(x + w * 0.94, y + h);
    ctx.closePath();
    ctx.fill();

    // 腔体斜向倒相风道高光线
    ctx.strokeStyle = "rgba(239, 232, 219, 0.24)";
    ctx.lineWidth = Math.max(1, s * 0.006);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.26, y + h * 0.95);
    ctx.lineTo(cx, cy + sunR * 0.38);
    ctx.stroke();

    // 朱橙独立功放核块
    const sq = sunR * 0.66;
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(cx + sunR * 0.38, cy - sunR * 0.56, sq, sq * 0.92);
  } else {
    // 原海报 · 1:1 复刻 343 经典构成（骨白圆日 + 玄黑尖峰 + 朱橙方）
    ctx.fillStyle = PALETTE.bone;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    // 玄黑尖峰：从底沿升起切入圆日下半部
    ctx.fillStyle = PALETTE.peak;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.13, y + h);
    ctx.lineTo(cx, cy + sunR * 0.12);
    ctx.lineTo(x + w * 0.95, y + h);
    ctx.closePath();
    ctx.fill();

    // 朱橙悬浮正方形：叠加在圆日右上方
    const sq = sunR * 0.72;
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(cx + sunR * 0.36, cy - sunR * 0.62, sq, sq * 0.96);
  }

  // 左上 3×4 骨白矩阵点阵（1:1 复刻原海报）
  const dotR = Math.max(1.8, s * 0.011);
  const dotGapX = s * 0.068;
  const dotGapY = s * 0.064;
  const dotStartX = x + w * 0.115;
  const dotStartY = y + h * 0.145;
  ctx.fillStyle = visualMode === "flat" ? "rgba(239,232,219,0.45)" : PALETTE.boneBright;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.beginPath();
      ctx.arc(dotStartX + col * dotGapX, dotStartY + row * dotGapY, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 右侧 6 道白色横杠（1:1 复刻原海报）
  const barW = Math.min(w * 0.15, s * 0.24);
  const barH = Math.max(1.8, s * 0.010);
  const barGap = Math.max(5, s * 0.036);
  const barX = x + w * 0.78;
  const barY0 = y + h * 0.51;
  ctx.fillStyle = visualMode === "flat" ? "rgba(239,232,219,0.45)" : PALETTE.boneBright;
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(barX, barY0 + i * barGap, barW, barH);
  }

  // 视觉引导箭头
  const drawArrow = (x1, y1, x2, y2, color, lw, dashed = false) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "square";
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const head = Math.max(7, lw * 3.8);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const lw = Math.max(2, s * 0.010);
  if (guideMode === "aligned") {
    // 原海报 45° 白色向上指向焦点的引导箭
    drawArrow(x + w * 0.065, y + h * 0.90, x + w * 0.31, y + h * 0.60, "#FFFFFF", lw);
  } else if (guideMode === "misaligned") {
    // 错态：背离焦点的红色警示错箭，指往左上角空白
    drawArrow(x + w * 0.34, y + h * 0.68, x + w * 0.11, y + h * 0.23, "#FF7A7E", lw, true);
    drawArrow(x + w * 0.64, y + h * 0.72, x + w * 0.88, y + h * 0.18, "rgba(255, 138, 61, 0.72)", lw * 0.85, true);
  } else {
    // 反向错态：5 条杂乱引导箭反客为主污染主图
    drawArrow(x + w * 0.06, y + h * 0.90, x + w * 0.33, y + h * 0.58, "#FFFFFF", lw);
    drawArrow(x + w * 0.14, y + h * 0.24, x + w * 0.48, y + h * 0.36, "#FF8F3D", lw * 0.95, true);
    drawArrow(x + w * 0.92, y + h * 0.20, x + w * 0.70, y + h * 0.36, "#FF7A7E", lw * 0.95, true);
    drawArrow(x + w * 0.88, y + h * 0.86, x + w * 0.60, y + h * 0.54, "#FFD166", lw * 0.9, true);
    drawArrow(x + w * 0.48, y + h * 0.10, x + w * 0.54, y + h * 0.30, "#FFFFFF", lw * 0.9, true);
  }

  ctx.restore();
}

// 绘制三枚原海报底栏线绘圆徽（目标 / 眼睛 / 斜箭）
function drawTriIcon(ctx, kind, cx, cy, r) {
  ctx.save();
  if (kind === "target") {
    ctx.fillStyle = PALETTE.cobaltIcon;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.2, r * 0.16);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "eye") {
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = Math.max(1.5, r * 0.18);
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.05, cy);
    ctx.quadraticCurveTo(cx, cy - r * 0.85, cx + r * 1.05, cy);
    ctx.quadraticCurveTo(cx, cy + r * 0.85, cx - r * 1.05, cy);
    ctx.stroke();
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.cobaltIcon;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.4, r * 0.18);
    const d = r * 0.38;
    ctx.beginPath();
    ctx.moveTo(cx - d, cy + d);
    ctx.lineTo(cx + d, cy - d);
    ctx.moveTo(cx - d * 0.1, cy - d);
    ctx.lineTo(cx + d, cy - d);
    ctx.lineTo(cx + d, cy + d * 0.1);
    ctx.stroke();
  }
  ctx.restore();
}

// 统一画布内交互式病灶红签（清晰不越界）
function drawCalloutChip(ctx, x, y, text, tone = "alert", maxRight = 9999) {
  ctx.save();
  ctx.font = `600 11px ${FONT_ZH}`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 16;
  const ph = 22;
  const bx = clamp(x, 6, Math.max(6, maxRight - pw - 6));
  const by = Math.max(6, y);
  ctx.fillStyle = tone === "alert" ? PALETTE.alertBg : "rgba(18, 63, 223, 0.92)";
  ctx.fillRect(bx, by, pw, ph);
  ctx.strokeStyle = tone === "alert" ? "#FF9DA2" : "#9BB7FF";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(text, bx + 8, by + ph / 2 + 0.5);
  ctx.restore();
  return { x: bx, y: by, w: pw, h: ph };
}

// ---------- 开场主画布控制器 ----------
export function createHeroStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 560;
  let dpr = 1;
  let dirty = true;
  let introDone = false;
  let hoverZone = null;

  // 3 秒暗场投屏预演状态
  const playback = {
    active: false,
    elapsed: 0,
    preFlash: 0.75, // 前 0.75s 闪播密集前页，后 2.65s 切入本页 343 放飞眼动光束
    duration: 3.4,
  };

  // 动态保存当前帧的热区矩形，保证点击命中与画面像素 100% 对齐
  let hitBoxes = {
    visual: null,
    title: null,
    caption: null,
    guide: null,
    divider: null,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    cssW = rect.width;
    cssH = rect.height;
    dirty = true;
  }

  function startPlayback() {
    if (reducedMotion.matches) {
      // 减少动态效果下直接展示完整静态眼动轨迹终点帧
      playback.active = true;
      playback.elapsed = playback.duration - 0.05;
      dirty = true;
      stageLoop.draw();
      return;
    }
    playback.active = true;
    playback.elapsed = 0;
    dirty = true;
  }

  function stopPlayback() {
    if (playback.active) {
      playback.active = false;
      playback.elapsed = 0;
      dirty = true;
    }
  }

  function drawSlide(t, dt, { still }) {
    resize();
    if (playback.active && !still) {
      playback.elapsed += dt;
      dirty = true;
      if (playback.elapsed >= playback.duration) {
        playback.active = false;
        playback.elapsed = 0;
      }
    }

    const introT = still ? 1 : clamp(t / 0.85, 0, 1);
    if (introT < 1) {
      dirty = true;
    } else if (!introDone) {
      introDone = true;
      dirty = true;
    }

    if (!dirty && !playback.active) return;
    dirty = false;

    const state = getState();
    const audit = evaluate(state);
    const layout = audit.layout;
    const W = cssW;
    const H = cssH;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 画布外框深玄底
    ctx.fillStyle = PALETTE.obsidian;
    ctx.fillRect(0, 0, W, H);

    // 如果是 3 秒投屏的前 0.75s，先闪播高密度旧式前页，制造真实翻页对比冲击！
    if (playback.active && playback.elapsed < playback.preFlash) {
      const deck = layout.deck;
      const p = playback.elapsed / playback.preFlash;
      ctx.fillStyle = "#12171D";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#2E3740";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

      const pad = Math.max(18, W * 0.055);
      ctx.fillStyle = PALETTE.amberBright;
      ctx.font = `600 ${clamp(W * 0.017, 11, 13)}px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("PREVIOUS SLIDE · 翻页前（高密度文字页）", pad, pad);

      ctx.fillStyle = PALETTE.boneBright;
      ctx.font = `800 ${clamp(W * 0.036, 17, 28)}px ${FONT_ZH}`;
      ctx.fillText(deck.prevTitle, pad, pad + 26);

      ctx.fillStyle = "#B9C0C7";
      ctx.font = `400 ${clamp(W * 0.022, 12, 16)}px ${FONT_ZH}`;
      let py = pad + 72;
      for (const b of deck.prevBullets) {
        const lines = wrapLines(ctx, `•  ${b}`, W - pad * 2, 2);
        for (const ln of lines) {
          ctx.fillText(ln, pad, py);
          py += clamp(W * 0.034, 20, 28);
        }
        py += 10;
      }

      // 翻页进度提示
      ctx.fillStyle = PALETTE.cobalt;
      ctx.fillRect(0, H - 4, W * p, 4);
      ctx.restore();
      return;
    }

    const toPx = (r) => ({
      x: Math.round(r.x * W),
      y: Math.round(r.y * H),
      w: Math.round(r.w * W),
      h: Math.round(r.h * H),
    });

    const imgBox = toPx(layout.imageRect);
    const innerBox = toPx(layout.innerVisualRect);
    const capBox = toPx(layout.captionRect);

    // 1. 绘制主图区
    if (state.visualMode === "cluttered") {
      // 杂框邮票错态背景：灰暗格子 + 无关杂框块
      ctx.fillStyle = "#161C22";
      ctx.fillRect(imgBox.x, imgBox.y, imgBox.w, imgBox.h);

      // 左侧邮票小图
      drawDeckVisual(ctx, innerBox, state.deck, "focused", state.guideMode, introT);
      ctx.strokeStyle = PALETTE.alert;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(innerBox.x + 1, innerBox.y + 1, innerBox.w - 2, innerBox.h - 2);
      ctx.setLineDash([]);

      // 右侧两块分散注意力的装饰杂框
      const clutterX = innerBox.x + innerBox.w + Math.max(8, imgBox.w * 0.035);
      const clutterW = Math.max(24, imgBox.x + imgBox.w - clutterX - imgBox.w * 0.05);
      if (clutterW > 36) {
        const ch1 = innerBox.h * 0.44;
        ctx.fillStyle = "#1E262E";
        ctx.fillRect(clutterX, innerBox.y, clutterW, ch1);
        ctx.strokeStyle = "#3A444F";
        ctx.strokeRect(clutterX + 0.5, innerBox.y + 0.5, clutterW - 1, ch1 - 1);
        ctx.fillStyle = "#8C959E";
        ctx.font = `500 ${clamp(W * 0.016, 10, 12)}px ${FONT_ZH}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("装饰图例 / 杂框 A", clutterX + 8, innerBox.y + 8);
        ctx.fillStyle = "#48535E";
        ctx.fillRect(clutterX + 8, innerBox.y + 28, clutterW * 0.72, 4);
        ctx.fillRect(clutterX + 8, innerBox.y + 38, clutterW * 0.54, 4);

        const cy2 = innerBox.y + ch1 + innerBox.h * 0.12;
        const ch2 = innerBox.h - ch1 - innerBox.h * 0.12;
        ctx.fillStyle = "#1E262E";
        ctx.fillRect(clutterX, cy2, clutterW, ch2);
        ctx.strokeStyle = "#3A444F";
        ctx.strokeRect(clutterX + 0.5, cy2 + 0.5, clutterW - 1, ch2 - 1);
        ctx.fillStyle = "#8C959E";
        ctx.fillText("无关数据角标 B", clutterX + 8, cy2 + 8);
      }
    } else {
      drawDeckVisual(ctx, imgBox, state.deck, state.visualMode, state.guideMode, introT);
    }

    // 2. 绘制说明舱（独立深玄底 或 满屏暗罩叠底）
    if (state.orientation === "full-bleed") {
      if (state.scrim) {
        const grad = ctx.createLinearGradient(0, capBox.y - H * 0.14, 0, H);
        grad.addColorStop(0, "rgba(10, 14, 17, 0)");
        grad.addColorStop(0.32, "rgba(10, 14, 17, 0.78)");
        grad.addColorStop(1, "rgba(10, 14, 17, 0.96)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, capBox.y - H * 0.14, W, capBox.h + H * 0.14);
      }
    } else {
      ctx.fillStyle = PALETTE.obsidian;
      ctx.fillRect(capBox.x, capBox.y, capBox.w, capBox.h);
    }

    // 3. 说明舱内部排版：琥珀色 ┌ ┘ 角标 + 标题 + 图注说明 + 可选三栏图标要点
    const cPadX = Math.max(14, capBox.w * 0.055);
    const cPadY = Math.max(10, Math.min(24, capBox.h * 0.095));
    const innerX = capBox.x + cPadX;
    const innerW = Math.max(40, capBox.w - cPadX * 2);
    let cursorY = capBox.y + cPadY;

    const bracketLen = clamp(Math.min(capBox.w, capBox.h) * 0.08, 10, 18);
    const bracketTopY = cursorY - 4;

    // 标题字号根据空间与标题模式真实计算
    const compact = W < 440 || capBox.h < 125;
    const baseTitleSize =
      state.titleMode === "wall"
        ? clamp(capBox.w * 0.024, 11, 15)
        : clamp(Math.min(capBox.w * 0.044, capBox.h * 0.175), 14, 29);

    // 满屏无暗罩错态：刻意让文字直撞亮色骨白圆日/亮蓝背景，肉眼可见对比度骤降
    const titleColor =
      state.orientation === "full-bleed" && !state.scrim
        ? "rgba(239, 232, 219, 0.76)"
        : state.titleMode === "empty" || state.titleMode === "describe"
          ? "#D0D4D8"
          : PALETTE.boneBright;

    ctx.fillStyle = titleColor;
    ctx.font = `800 ${baseTitleSize}px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const maxTitleLines = state.titleMode === "wall" ? 4 : state.orientation === "left-right" ? 3 : 2;
    const titleLines = wrapLines(ctx, layout.titleText, innerW - 14, maxTitleLines);
    const titleLH = baseTitleSize * 1.24;

    const titleStartY = cursorY;
    for (const ln of titleLines) {
      ctx.fillText(ln, innerX + 10, cursorY);
      cursorY += titleLH;
    }
    const titleEndY = Math.max(titleStartY + 24, cursorY);

    // 标题热区记录
    hitBoxes.title = { x: innerX, y: titleStartY - 4, w: innerW, h: titleEndY - titleStartY + 8 };

    cursorY += Math.max(5, capBox.h * 0.032);

    // 图注与说明文字
    const bodyStartY = cursorY;
    const bodySize =
      state.captionMode === "wall"
        ? clamp(capBox.w * 0.019, 10.5, 13)
        : clamp(Math.min(capBox.w * 0.023, capBox.h * 0.085), 11, 14.5);
    const bodyLH = bodySize * 1.48;
    const availableForBody = layout.showTriCards
      ? Math.max(24, capBox.y + capBox.h * 0.62 - cursorY)
      : Math.max(22, capBox.y + capBox.h - cPadY - cursorY);

    if (state.captionMode === "none") {
      ctx.strokeStyle = "rgba(242, 84, 91, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const emptyH = Math.min(46, Math.max(26, availableForBody));
      ctx.strokeRect(innerX + 10, cursorY, innerW - 20, emptyH);
      ctx.setLineDash([]);
      ctx.fillStyle = "#FF8B91";
      ctx.font = `500 12px ${FONT_ZH}`;
      ctx.fillText("（无图注与说明 · 画面多义失锚 — 点此补回）", innerX + 18, cursorY + Math.max(6, (emptyH - 14) / 2));
      cursorY += emptyH + 6;
    } else {
      const maxBodyLines = Math.max(1, Math.floor(availableForBody / bodyLH));
      ctx.font = `400 ${bodySize}px ${FONT_ZH}`;
      ctx.fillStyle =
        state.orientation === "full-bleed" && !state.scrim
          ? "rgba(239, 232, 219, 0.72)"
          : state.captionMode === "wall"
            ? "#D7B4B6"
            : PALETTE.boneMuted;
      const bodyLines = wrapLines(ctx, layout.captionText, innerW - 18, maxBodyLines);
      for (const ln of bodyLines) {
        ctx.fillText(ln, innerX + 10, cursorY);
        cursorY += bodyLH;
      }

      // 密字墙错态额外呈现「把 Word 提纲与脚注全搬上屏」的窒息文档感
      if (state.captionMode === "wall" && cursorY + 34 < capBox.y + capBox.h - cPadY) {
        const extraBullets = [
          "1. 补充背景条目：把讲者原本口述的流程细节、背景数据与会议纪要也照搬上屏。",
          "2. 附加参考条款：多列小字与无关角标挤占底部呼吸区，观众视线被迫陷入逐行扫读。",
          "3. 备注与出处：内部评审草稿 V3.2 · 密字超载导致 3 秒内无法看清主图与核心论点。",
        ];
        cursorY += 6;
        ctx.strokeStyle = "rgba(242, 84, 91, 0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerX + 10, cursorY);
        ctx.lineTo(innerX + innerW - 10, cursorY);
        ctx.stroke();
        cursorY += 8;
        ctx.fillStyle = "#B69194";
        ctx.font = `400 ${Math.max(10, bodySize - 1)}px ${FONT_ZH}`;
        const subLH = Math.max(14.5, (bodySize - 1) * 1.44);
        for (const item of extraBullets) {
          const bLines = wrapLines(ctx, item, innerW - 20, 2);
          for (const bl of bLines) {
            if (cursorY + subLH > capBox.y + capBox.h - cPadY - 6) break;
            ctx.fillText(bl, innerX + 10, cursorY);
            cursorY += subLH;
          }
          cursorY += 2;
        }
      }
    }

    // 原海报标志性琥珀色 ┌ 和 ┘ 角标（包裹标题+主说明）
    const bracketBottomY = Math.min(capBox.y + capBox.h - 10, Math.max(cursorY + 2, titleEndY + 12));
    ctx.strokeStyle = state.orientation === "full-bleed" && !state.scrim ? "rgba(237,125,33,0.4)" : PALETTE.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // ┌
    ctx.moveTo(innerX, bracketTopY + bracketLen);
    ctx.lineTo(innerX, bracketTopY);
    ctx.lineTo(innerX + bracketLen, bracketTopY);
    // ┘
    ctx.moveTo(innerX + innerW - bracketLen, bracketBottomY);
    ctx.lineTo(innerX + innerW, bracketBottomY);
    ctx.lineTo(innerX + innerW, bracketBottomY - bracketLen);
    ctx.stroke();

    // 4. 三栏蓝橙图标要点（1:1 承袭原海报下舱三列：聚焦核心 / 辅助理解 / 引导视线）
    if (layout.showTriCards && !compact) {
      const ruleY = Math.max(bracketBottomY + 10, capBox.y + capBox.h * 0.65);
      if (ruleY + 34 < capBox.y + capBox.h) {
        ctx.strokeStyle = "#293138";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerX, ruleY);
        ctx.lineTo(innerX + innerW, ruleY);
        ctx.stroke();

        const triY = ruleY + 12;
        const triH = capBox.y + capBox.h - triY - 8;
        const colW = innerW / 3;
        const iconR = clamp(colW * 0.065, 8, 12);

        layout.deck.triPoints.forEach((pt, i) => {
          const cx0 = innerX + i * colW;
          if (i > 0) {
            ctx.strokeStyle = "#262E35";
            ctx.beginPath();
            ctx.moveTo(cx0, triY);
            ctx.lineTo(cx0, triY + triH - 2);
            ctx.stroke();
          }
          const ix = cx0 + (i > 0 ? 14 : 4) + iconR;
          const iy = triY + iconR + 2;
          drawTriIcon(ctx, pt.icon, ix, iy, iconR);

          const tx = ix + iconR + 9;
          const tw = Math.max(30, cx0 + colW - tx - 8);
          ctx.fillStyle = PALETTE.boneBright;
          ctx.font = `700 ${clamp(colW * 0.072, 11.5, 14)}px ${FONT_ZH}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(pt.title, tx, triY);

          ctx.fillStyle = "#A9B0B7";
          ctx.font = `400 ${clamp(colW * 0.056, 10, 11.5)}px ${FONT_ZH}`;
          const ptLines = wrapLines(ctx, pt.body, tw, 2);
          ptLines.forEach((ln, li) => {
            ctx.fillText(ln, tx, triY + 17 + li * 14);
          });
        });
      }
    }

    hitBoxes.caption = {
      x: capBox.x,
      y: Math.max(bodyStartY - 4, capBox.y),
      w: capBox.w,
      h: Math.max(24, capBox.y + capBox.h - Math.max(bodyStartY - 4, capBox.y)),
    };
    hitBoxes.visual = { ...imgBox };
    hitBoxes.guide = {
      x: innerBox.x + innerBox.w * 0.02,
      y: innerBox.y + innerBox.h * 0.52,
      w: innerBox.w * 0.36,
      h: innerBox.h * 0.44,
    };

    // 5. 可拖动的橘红图文分界滑梁（明确物理把手！）
    const divPos = layout.divider.pos;
    if (layout.divider.axis === "x") {
      const dx = Math.round(divPos * W);
      ctx.strokeStyle = hoverZone === "divider" ? "#FF9F5A" : PALETTE.amber;
      ctx.lineWidth = hoverZone === "divider" ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(dx, 0);
      ctx.lineTo(dx, H);
      ctx.stroke();

      // 中央拉柄胶囊
      const hy = H * 0.5;
      ctx.fillStyle = PALETTE.obsidian;
      ctx.fillRect(dx - 11, hy - 22, 22, 44);
      ctx.strokeStyle = PALETTE.amberBright;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx - 11, hy - 22, 22, 44);
      ctx.fillStyle = PALETTE.amberBright;
      ctx.font = `700 11px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", dx, hy);
      hitBoxes.divider = { x: dx - 18, y: 0, w: 36, h: H };
    } else {
      const dy = Math.round(divPos * H);
      ctx.strokeStyle = hoverZone === "divider" ? "#FF9F5A" : PALETTE.amber;
      ctx.lineWidth = hoverZone === "divider" ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(0, dy);
      ctx.lineTo(W, dy);
      ctx.stroke();

      // 分界中央橘红拉柄
      const hx = W * 0.5;
      const pillW = 104;
      const pillH = 22;
      ctx.fillStyle = PALETTE.obsidian;
      ctx.fillRect(hx - pillW / 2, dy - pillH / 2, pillW, pillH);
      ctx.strokeStyle = PALETTE.amberBright;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx - pillW / 2, dy - pillH / 2, pillW, pillH);
      ctx.fillStyle = PALETTE.amberBright;
      ctx.font = `600 11px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`图 ${audit.rawPct}% · 拖分界`, hx, dy + 0.5);
      hitBoxes.divider = { x: 0, y: dy - 16, w: W, h: 32 };
    }

    // 6. 聚焦槽位高亮框（点击左侧 5 根解剖引注时高亮对应区域）
    if (state.focusSlot) {
      const mapRect = {
        hero: imgBox,
        title: hitBoxes.title,
        caption: hitBoxes.caption,
        explain: capBox,
        guide: hitBoxes.guide,
      }[state.focusSlot];
      if (mapRect) {
        ctx.save();
        ctx.strokeStyle = PALETTE.amberBright;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(mapRect.x + 2, mapRect.y + 2, Math.max(8, mapRect.w - 4), Math.max(8, mapRect.h - 4));
        ctx.restore();
      }
    }

    // 7. 病灶直点手术标签（仅在对应项未通过时轻量提示，绝不堆叠遮挡标题或主图核心）
    if (!playback.active) {
      const narrow = W < 480;
      if (!audit.checks.hero.ok) {
        const label =
          state.visualMode === "cluttered"
            ? narrow ? "× 杂框 · 点图放大" : "× 邮票杂框 · 点图放大"
            : state.visualMode === "flat"
              ? "× 灰平无焦 · 点此提对比"
              : audit.checks.hero.code === "image_crowds_caption"
                ? "× 图满挤字 · 向左拖减比"
                : "× 主图偏小 · 向右拖放大";
        drawCalloutChip(ctx, imgBox.x + 8, imgBox.y + 8, label, "alert", imgBox.x + imgBox.w);
      }
      if (!audit.checks.guide.ok && imgBox.h > 88) {
        const gl = state.guideMode === "overloaded" ? "× 多箭 · 点箭精简" : narrow ? "× 箭偏 · 点校准" : "× 箭头指偏 · 点此校准";
        drawCalloutChip(ctx, innerBox.x + 8, innerBox.y + innerBox.h - 28, gl, "alert", innerBox.x + innerBox.w);
      }
      if (!audit.checks.title.ok) {
        const tl =
          state.titleMode === "describe"
            ? narrow ? "× 复述图 · 点改" : "× 复述画面 · 点标题改观点"
            : state.titleMode === "wall"
              ? narrow ? "× 过长 · 点精炼" : "× 标题过长 · 点此精炼"
              : narrow ? "× 空洞 · 点给观点" : "× 空洞标题 · 点此给观点";
        // 检测是否与首行标题撞车；窄屏若可能碰撞则稳放说明舱右下角上方，彻底杜绝遮字
        ctx.save();
        ctx.font = `800 ${baseTitleSize}px ${FONT_ZH}`;
        const firstLineW = titleLines[0] ? ctx.measureText(titleLines[0]).width : 0;
        ctx.font = `600 11px ${FONT_ZH}`;
        const chipW = ctx.measureText(tl).width + 18;
        ctx.restore();
        const fitsRight = innerX + 12 + firstLineW + 10 + chipW < capBox.x + capBox.w - 8;
        const chipX = capBox.x + capBox.w - chipW - 10;
        const chipY = fitsRight ? Math.max(capBox.y + 8, titleStartY) : Math.max(bodyStartY, capBox.y + capBox.h - 32);
        drawCalloutChip(ctx, chipX, chipY, tl, "alert", capBox.x + capBox.w);
      } else if (!audit.checks.caption.ok && state.captionMode === "wall") {
        const cl = narrow ? "× 密字 · 点裁字" : "× 密字超载 · 点此裁字";
        drawCalloutChip(ctx, capBox.x + capBox.w - (narrow ? 116 : 152), Math.max(capBox.y + 8, capBox.y + capBox.h - 32), cl, "alert", capBox.x + capBox.w);
      } else if (!audit.checks.explain.ok && !layout.scrimReadable) {
        drawCalloutChip(ctx, capBox.x + capBox.w - 154, capBox.y + 8, "× 无暗罩失读 · 开暗罩", "alert", capBox.x + capBox.w);
      }
    }

    // 8. 3 秒眼动锚定光束回放（严格按 model.js 单真源 gazePath 渲染）
    if (playback.active && playback.elapsed >= playback.preFlash) {
      const p = clamp((playback.elapsed - playback.preFlash) / (playback.duration - playback.preFlash), 0, 1);
      const pts = layout.gazePath.map((g) => ({ x: g.x * W, y: g.y * H, t: g.t, label: g.label }));

      ctx.save();
      // 半透明暗室聚光遮罩，凸显视线动线
      ctx.fillStyle = "rgba(6, 9, 12, 0.34)";
      ctx.fillRect(0, 0, W, H);

      const ok = audit.passed === 5;
      const beamColor = ok ? "#36E0A2" : "#FF7076";

      // 绘制已走过的视线连线
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 3;
      ctx.setLineDash(ok ? [] : [6, 5]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      let curX = pts[0].x;
      let curY = pts[0].y;
      let curLabel = pts[0].label;

      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (p >= b.t) {
          ctx.lineTo(b.x, b.y);
          curX = b.x;
          curY = b.y;
          curLabel = b.label;
        } else if (p > a.t) {
          const segP = (p - a.t) / Math.max(0.001, b.t - a.t);
          curX = a.x + (b.x - a.x) * segP;
          curY = a.y + (b.y - a.y) * segP;
          curLabel = a.label;
          ctx.lineTo(curX, curY);
          break;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制已抵达的驻留节点
      pts.forEach((pt, idx) => {
        if (p >= pt.t) {
          ctx.fillStyle = beamColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0A0E11";
          ctx.font = `700 10px ${FONT_MONO}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(idx + 1), pt.x, pt.y + 0.5);
        }
      });

      // 当前眼动焦点光环
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(curX, curY, 15 + Math.sin(p * 18) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // 顶部 3 秒计时条与实时落眼标注
      const sec = (p * 3.0).toFixed(1);
      drawCalloutChip(
        ctx,
        12,
        12,
        `投屏实测 ${sec}s / 3.0s · ${curLabel}`,
        ok ? "pass" : "alert",
        W - 12
      );
      ctx.restore();
    }

    // 9. 最外层 0px 锐利暗室细框（忠实原海报）
    ctx.strokeStyle = PALETTE.frame;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    ctx.restore();
  }

  // ---------- 指针拖拽与直点交互（完美兼顾横拖 perf.mjs、竖拖分界线与移动端竖滑滚动） ----------
  let drag = null;

  function localXY(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  }

  function inBox(p, box) {
    return box && p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
  }

  canvas.addEventListener("pointerdown", (e) => {
    stopPlayback();
    const p = localXY(e);
    const st = getState();
    const onDivider = inBox(p, hitBoxes.divider);
    drag = {
      id: e.pointerId,
      startX: p.x,
      startY: p.y,
      startRatio: st.imageRatio,
      onDivider,
      moved: false,
      orientation: st.orientation,
      w: p.w,
      h: p.h,
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = localXY(e);
    if (!drag) {
      const overDiv = inBox(p, hitBoxes.divider);
      const nextHover = overDiv ? "divider" : null;
      if (nextHover !== hoverZone) {
        hoverZone = nextHover;
        canvas.style.cursor = overDiv
          ? getState().orientation === "left-right"
            ? "ew-resize"
            : "ns-resize"
          : "grab";
        dirty = true;
        stageLoop.draw();
      }
      return;
    }

    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    // 无论是横拖画布（桌面/触屏/perf.mjs）还是竖拖分界滑梁，都能丝滑重塑主图占比
    let delta;
    if (drag.onDivider && drag.orientation !== "left-right") {
      delta = dy / Math.max(120, drag.h);
    } else if (drag.orientation === "left-right") {
      delta = dx / Math.max(140, drag.w);
    } else {
      // 上图下说或满屏模式：支持水平横拖（主轴）与垂直拖动二合一
      delta = Math.abs(dx) >= Math.abs(dy) ? dx / Math.max(180, drag.w * 0.85) : dy / Math.max(140, drag.h);
    }

    const nextRatio = clamp(Number((drag.startRatio + delta).toFixed(3)), 0.24, 0.82);
    if (Math.abs(nextRatio - getState().imageRatio) >= 0.002) {
      onMutate({ imageRatio: nextRatio, focusSlot: "hero" }, { fromDrag: true });
      dirty = true;
      stageLoop.draw();
    }
  });

  function finishPointer(e, isCancel = false) {
    if (!drag) return;
    const wasMoved = drag.moved;
    const p = localXY(e);
    drag = null;

    if (isCancel || wasMoved) return;

    // 单击手术：根据实绘热区精准修复/循环对应模块
    const st = getState();
    if (inBox(p, hitBoxes.guide)) {
      const next = st.guideMode === "misaligned" ? "aligned" : st.guideMode === "aligned" ? "overloaded" : "misaligned";
      onMutate({ guideMode: next, focusSlot: "guide" });
    } else if (inBox(p, hitBoxes.title)) {
      const order = ["empty", "claim", "describe", "wall"];
      const next = order[(order.indexOf(st.titleMode) + 1) % order.length];
      onMutate({ titleMode: next, focusSlot: "title" });
    } else if (inBox(p, hitBoxes.caption)) {
      const order = ["wall", "balanced", "minimal", "none"];
      const next = order[(order.indexOf(st.captionMode) + 1) % order.length];
      onMutate({ captionMode: next, focusSlot: "caption" });
    } else if (inBox(p, hitBoxes.visual)) {
      const order = ["cluttered", "focused", "flat"];
      const next = order[(order.indexOf(st.visualMode) + 1) % order.length];
      const patch = { visualMode: next, focusSlot: "hero" };
      if (st.visualMode === "cluttered" && st.imageRatio < 0.5) patch.imageRatio = 0.63;
      onMutate(patch);
    }
  }

  canvas.addEventListener("pointerup", (e) => finishPointer(e, false));
  canvas.addEventListener("pointercancel", (e) => finishPointer(e, true));

  const stageLoop = loop(canvas, (t, dt, meta) => {
    drawSlide(t, dt, meta);
  });

  window.addEventListener("resize", () => {
    dirty = true;
    stageLoop.draw();
  });

  return {
    invalidate() {
      dirty = true;
      stageLoop.draw();
    },
    startPlayback,
    stopPlayback,
    isPlaying: () => playback.active,
  };
}

// ---------- 03 节：演讲厅 3m–15m 远距清晰度与叠字暗罩模拟画布 ----------
// 用离屏缩采样代替高耗能 CSS/Canvas blur 滤镜，在慢手机软件渲染下依旧 60fps！
export function createRoomSimulator(canvas, getRoomState) {
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");
  let dirty = true;
  let cssW = 720;
  let cssH = 420;
  let dpr = 1;

  function drawSceneTo(targetCtx, W, H, st) {
    targetCtx.save();
    targetCtx.fillStyle = PALETTE.obsidian;
    targetCtx.fillRect(0, 0, W, H);

    const ratio = clamp(st.ratio, 0.30, 0.82);
    const ori = st.layout; // "top-bottom" | "left-right" | "full-bleed"

    let imgRect;
    let capRect;
    if (ori === "left-right") {
      imgRect = { x: 0, y: 0, w: W * ratio, h: H };
      capRect = { x: W * ratio, y: 0, w: W * (1 - ratio), h: H };
    } else if (ori === "full-bleed") {
      imgRect = { x: 0, y: 0, w: W, h: H };
      capRect = { x: 0, y: H * 0.62, w: W, h: H * 0.38 };
    } else {
      imgRect = { x: 0, y: 0, w: W, h: H * ratio };
      capRect = { x: 0, y: H * ratio, w: W, h: H * (1 - ratio) };
    }

    drawDeckVisual(targetCtx, imgRect, "poster", "focused", "aligned", 1);

    // 底部说明底衬
    if (ori === "full-bleed") {
      if (st.scrim === "grad") {
        const g = targetCtx.createLinearGradient(0, capRect.y - H * 0.16, 0, H);
        g.addColorStop(0, "rgba(10,14,17,0)");
        g.addColorStop(0.4, "rgba(10,14,17,0.84)");
        g.addColorStop(1, "rgba(10,14,17,0.97)");
        targetCtx.fillStyle = g;
        targetCtx.fillRect(0, capRect.y - H * 0.16, W, capRect.h + H * 0.16);
      } else if (st.scrim === "bar") {
        targetCtx.fillStyle = "rgba(10,14,17,0.94)";
        targetCtx.fillRect(capRect.x, capRect.y, capRect.w, capRect.h);
      }
    } else {
      targetCtx.fillStyle = PALETTE.obsidian;
      targetCtx.fillRect(capRect.x, capRect.y, capRect.w, capRect.h);
    }

    const px = Math.max(14, capRect.w * 0.06);
    const py = Math.max(12, capRect.h * 0.14);
    const innerW = Math.max(50, capRect.w - px * 2);

    const tSize = clamp(Math.min(capRect.w * 0.048, capRect.h * 0.22), 14, 26);
    const bSize = clamp(Math.min(capRect.w * 0.024, capRect.h * 0.11), 11, 14);

    // 无暗罩叠在亮色圆日/蓝底上时故意暴露低反差风险
    const risky = ori === "full-bleed" && st.scrim === "none";
    targetCtx.fillStyle = risky ? "rgba(239, 232, 219, 0.72)" : PALETTE.boneBright;
    targetCtx.font = `800 ${tSize}px ${FONT_ZH}`;
    targetCtx.textAlign = "left";
    targetCtx.textBaseline = "top";
    const tLines = wrapLines(targetCtx, "以图为主，讲清一个观点", innerW, 2);
    let cy = capRect.y + py;
    for (const ln of tLines) {
      targetCtx.fillText(ln, capRect.x + px, cy);
      cy += tSize * 1.25;
    }

    targetCtx.fillStyle = risky ? "rgba(239, 232, 219, 0.65)" : PALETTE.boneMuted;
    targetCtx.font = `400 ${bSize}px ${FONT_ZH}`;
    const bLines = wrapLines(
      targetCtx,
      "大主图抓第一眼，精炼标题与短注把画面牢牢锚定到核心结论。",
      innerW,
      3
    );
    cy += 6;
    for (const ln of bLines) {
      if (cy + bSize < capRect.y + capRect.h - 6) {
        targetCtx.fillText(ln, capRect.x + px, cy);
        cy += bSize * 1.45;
      }
    }

    targetCtx.strokeStyle = PALETTE.frame;
    targetCtx.lineWidth = 1;
    targetCtx.strokeRect(0.5, 0.5, W - 1, H - 1);
    targetCtx.restore();
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(1.5);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
      dirty = true;
    }
    cssW = rect.width;
    cssH = rect.height;
    if (!dirty) return;
    dirty = false;

    const st = getRoomState();
    const dist = clamp(st.distance, 3, 15); // 3m 前排 .. 15m 后排

    ctx.save();
    ctx.scale(dpr, dpr);

    // 暗室墙面背景与银幕透视缩尺（距离越远，银幕在视网膜中占比越小，光学分辨越低）
    ctx.fillStyle = "#06080B";
    ctx.fillRect(0, 0, cssW, cssH);

    // 观众座席微弱剪影弧线（无五官纯轮廓）
    ctx.fillStyle = "#11161C";
    const seatY = cssH - 26;
    for (let i = 0; i < 9; i++) {
      const sx = (cssW / 9) * (i + 0.5);
      ctx.beginPath();
      ctx.arc(sx, seatY, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(sx - 18, seatY, 36, 26);
    }

    // 银幕缩放比例：3m 占 90% 宽，15m 缩至 52% 宽
    const scale = 0.90 - ((dist - 3) / 12) * 0.38;
    const screenW = Math.round(cssW * scale);
    const screenH = Math.round(Math.min(cssH * 0.78, screenW * 0.62));
    const sx = Math.round((cssW - screenW) / 2);
    const sy = Math.round((cssH - 28 - screenH) / 2);

    // 离屏光学分辨下降（距离越远，离屏像素越粗，极轻量 0.1ms 模拟远距糊字）
    const clarity = 1 - ((dist - 3) / 12) * 0.58; // 1.0 -> 0.42
    const ow = Math.max(120, Math.round(screenW * clarity));
    const oh = Math.max(76, Math.round(screenH * clarity));
    if (off.width !== ow || off.height !== oh) {
      off.width = ow;
      off.height = oh;
    }
    offCtx.save();
    offCtx.clearRect(0, 0, ow, oh);
    offCtx.scale(clarity, clarity);
    drawSceneTo(offCtx, screenW, screenH, st);
    offCtx.restore();

    // 银幕微光边框
    ctx.strokeStyle = "#2A323A";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 1, sy - 1, screenW + 2, screenH + 2);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, ow, oh, sx, sy, screenW, screenH);

    // 顶角距离标尺
    ctx.fillStyle = PALETTE.amberBright;
    ctx.font = `600 11px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`VIEW DISTANCE ${dist}m · ${dist <= 6 ? "前排清晰视距" : dist <= 11 ? "中排标准视距" : "后排远距压力测试"}`, 12, 10);

    ctx.restore();
  }

  const simLoop = loop(canvas, () => {
    render();
  });

  window.addEventListener("resize", () => {
    dirty = true;
    simLoop.draw();
  });

  return {
    invalidate() {
      dirty = true;
      simLoop.draw();
    },
  };
}
