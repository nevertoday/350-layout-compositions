// 288 媒体对象布局 · 暗黑放映室 2D Canvas 活体渲染与直接操纵引擎
// 1:1 承袭 288 原海报的青→珊瑚渐变播放器框、阿尔卑斯晨光山影、上指尖角珊瑚说明配对卡与动态眼跳诊线。

import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp, evaluate, formatTime } from "./model.js";

const PALETTE = {
  bg: "#130D17",
  bgDeep: "#0D0911",
  card: "#191221",
  cream: "#F5DFC9",
  creamSoft: "#D5C6D2",
  muted: "#A396A8",
  coral: "#EF5337",
  coralBright: "#FF7252",
  cyan: "#43CFD4",
  cyanBright: "#58E1E6",
  ok: "#5CE0B8",
  err: "#FF6875",
  errBg: "rgba(184, 29, 43, 0.92)",
};

const FONT_ZH = '"Noto Sans SC", sans-serif';
const FONT_DISP = '"Space Grotesk", "Noto Sans SC", sans-serif';
const FONT_SERIF = '"Young Serif", Georgia, serif';
const FONT_MONO = '"IBM Plex Mono", monospace';

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

function wrapText(ctx, text, maxW, maxLines = 3) {
  const lines = [];
  let line = "";
  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxW && line.length > 0) {
      lines.push(line);
      line = ch;
      if (lines.length >= maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && text.length > lines.join("").length) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…";
  }
  return lines;
}

function drawMetaIcon(ctx, kind, x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === "user") {
    ctx.beginPath();
    ctx.arc(x, y - 2.6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + 4.8, 4.4, Math.PI * 1.15, Math.PI * 1.85);
    ctx.fill();
  } else if (kind === "pin") {
    ctx.beginPath();
    ctx.arc(x, y - 1.5, 3.2, Math.PI, 0);
    ctx.lineTo(x, y + 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.card;
    ctx.beginPath();
    ctx.arc(x, y - 1.5, 1.15, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "cal") {
    roundRectPath(ctx, x - 4, y - 3.6, 8, 7.6, 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 1);
    ctx.lineTo(x + 4, y - 1);
    ctx.moveTo(x - 1.8, y - 5);
    ctx.lineTo(x - 1.8, y - 2.6);
    ctx.moveTo(x + 1.8, y - 5);
    ctx.lineTo(x + 1.8, y - 2.6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - 3.6, y - 3.6);
    ctx.lineTo(x + 0.8, y - 3.6);
    ctx.lineTo(x + 4.4, y + 0.1);
    ctx.lineTo(x + 0.5, y + 4);
    ctx.lineTo(x - 3.6, y - 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.card;
    ctx.beginPath();
    ctx.arc(x - 1.4, y - 1.4, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 绘制 3 种真实媒体对象画面（均无五官人脸）
function drawMediaVisual(ctx, box, state, animT, sceneData) {
  const { x, y, w, h } = box;
  const p = state.progress;

  ctx.save();
  roundRectPath(ctx, x, y, w, h, 14);
  ctx.clip();

  if (state.scene === "alpine") {
    // 1:1 承袭 288 原海报的阿尔卑斯山脉晨光：清冷青灰天幕 + 渐升珊瑚红日 + 暖橘山脊受光面
    const sky = ctx.createLinearGradient(x, y, x, y + h);
    sky.addColorStop(0, "#3D6A74");
    sky.addColorStop(0.46, "#88A09E");
    sky.addColorStop(0.72, "#E49B7A");
    sky.addColorStop(1, "#182433");
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);

    // 随播放进度缓缓升起的珊瑚红日
    const sunX = x + w * (0.34 + p * 0.16);
    const sunY = y + h * (0.38 - Math.sin(p * Math.PI * 0.85) * 0.17);
    const sunR = Math.min(w, h) * 0.125;

    const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 2.4);
    halo.addColorStop(0, "rgba(255, 134, 96, 0.52)");
    halo.addColorStop(1, "rgba(255, 134, 96, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F07759";
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // 远山薄雾层
    ctx.fillStyle = "rgba(242, 168, 138, 0.36)";
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.72);
    ctx.lineTo(x + w * 0.18, y + h * 0.53);
    ctx.lineTo(x + w * 0.42, y + h * 0.63);
    ctx.lineTo(x + w * 0.78, y + h * 0.48);
    ctx.lineTo(x + w, y + h * 0.62);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    // 主峰暗影面（深青蓝）
    const peaks = [
      [0.0, 0.78],
      [0.14, 0.56],
      [0.28, 0.42],
      [0.41, 0.58],
      [0.64, 0.25],
      [0.82, 0.49],
      [0.93, 0.56],
      [1.0, 0.68],
    ];
    ctx.fillStyle = "#162535";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    for (const [px, py] of peaks) ctx.lineTo(x + w * px, y + h * py);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // 山脊晨光受光面（珊瑚橘金 + 浅雪蓝）
    ctx.fillStyle = "#EC8E6D";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.64, y + h * 0.25);
    ctx.lineTo(x + w * 0.56, y + h * 0.48);
    ctx.lineTo(x + w * 0.46, y + h * 0.61);
    ctx.lineTo(x + w * 0.60, y + h * 0.52);
    ctx.lineTo(x + w * 0.63, y + h * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(247, 206, 179, 0.55)";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.28, y + h * 0.42);
    ctx.lineTo(x + w * 0.22, y + h * 0.60);
    ctx.lineTo(x + w * 0.30, y + h * 0.55);
    ctx.closePath();
    ctx.fill();

    // 暗部山谷层次
    ctx.fillStyle = "#0F1A28";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.22, y + h * 0.72);
    ctx.lineTo(x + w * 0.46, y + h * 0.80);
    ctx.lineTo(x + w * 0.68, y + h * 0.66);
    ctx.lineTo(x + w, y + h * 0.82);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  } else if (state.scene === "sonar") {
    // 深海声呐纪实：幽深海渊 + 同心青色声呐扫波 + 珊瑚热液羽流
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, "#0A1B24");
    bg.addColorStop(0.65, "#102836");
    bg.addColorStop(1, "#09131C");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    const cx = x + w * 0.52;
    const cy = y + h * 0.52;
    const maxR = Math.min(w, h) * 0.56;
    ctx.strokeStyle = "rgba(67, 207, 212, 0.26)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (maxR * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 动态扫描扇叶
    const ang = (p * Math.PI * 2 + animT * (state.playing ? 1.1 : 0)) % (Math.PI * 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    const cone = ctx.createLinearGradient(0, 0, maxR, 0);
    cone.addColorStop(0, "rgba(67, 207, 212, 0.45)");
    cone.addColorStop(1, "rgba(67, 207, 212, 0)");
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxR, -0.35, 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 热液烟囱剪影 + 暖珊瑚热晕
    const ventX = x + w * 0.34;
    const ventY = y + h * 0.68;
    const glow = ctx.createRadialGradient(ventX, ventY - h * 0.12, 4, ventX, ventY - h * 0.12, h * 0.36);
    glow.addColorStop(0, "rgba(239, 83, 55, 0.62)");
    glow.addColorStop(1, "rgba(239, 83, 55, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "#0A141E";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.24, y + h * 0.72);
    ctx.lineTo(ventX - 10, y + h * 0.52);
    ctx.lineTo(ventX + 12, y + h * 0.54);
    ctx.lineTo(x + w * 0.48, y + h * 0.78);
    ctx.lineTo(x + w * 0.76, y + h * 0.64);
    ctx.lineTo(x + w, y + h * 0.76);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // 标尺网格线
    ctx.strokeStyle = "rgba(67, 207, 212, 0.16)";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h * 0.3);
    ctx.lineTo(x + w * 0.9, y + h * 0.3);
    ctx.moveTo(x + w * 0.1, y + h * 0.6);
    ctx.lineTo(x + w * 0.9, y + h * 0.6);
    ctx.stroke();
  } else {
    // 社区讨论流几何徽标（绝不画人脸五官）：建筑格栅 + 珊瑚与青色叠加几何纹章
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, "#1D1628");
    bg.addColorStop(1, "#12242C");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // 细网格线
    ctx.strokeStyle = "rgba(245, 223, 201, 0.08)";
    ctx.lineWidth = 1;
    const step = Math.max(16, Math.round(Math.min(w, h) / 6));
    for (let gx = x + step; gx < x + w; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y + step; gy < y + h; gy += step) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }

    const cx = x + w * 0.5;
    const cy = y + h * 0.46;
    const r = Math.min(w, h) * 0.24;
    ctx.fillStyle = "#EF5337";
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy, r * 0.86, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#43CFD4";
    ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.beginPath();
    ctx.arc(cx + r * 0.38, cy, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = PALETTE.cream;
    ctx.font = `700 ${Math.max(11, Math.round(r * 0.56))}px ${FONT_DISP}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ZM", cx, cy + 1);
  }

  // 底部影院控制遮罩层 + 播放键 + 02:45 / HD + 珊瑚进度条（1:1 呼应原海报）
  const ctrlShade = ctx.createLinearGradient(x, y + h - 48, x, y + h);
  ctrlShade.addColorStop(0, "rgba(13, 9, 17, 0)");
  ctrlShade.addColorStop(1, "rgba(13, 9, 17, 0.78)");
  ctx.fillStyle = ctrlShade;
  ctx.fillRect(x, y + h - 48, w, 48);

  // 中央暖奶白圆形播放键
  const playR = clamp(Math.min(w, h) * 0.13, 14, 28);
  const playX = x + w * 0.5;
  const playY = y + h * 0.48;
  ctx.fillStyle = "rgba(245, 223, 201, 0.94)";
  ctx.beginPath();
  ctx.arc(playX, playY, playR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.bg;
  if (state.playing) {
    const bw = Math.max(3, playR * 0.22);
    const bh = playR * 0.78;
    ctx.fillRect(playX - bw * 1.45, playY - bh / 2, bw, bh);
    ctx.fillRect(playX + bw * 0.45, playY - bh / 2, bw, bh);
  } else {
    ctx.beginPath();
    ctx.moveTo(playX - playR * 0.24, playY - playR * 0.38);
    ctx.lineTo(playX + playR * 0.42, playY);
    ctx.lineTo(playX - playR * 0.24, playY + playR * 0.38);
    ctx.closePath();
    ctx.fill();
  }

  // 足够宽时显示 02:45、HD 与珊瑚进度条
  if (w >= 148 && h >= 88) {
    const timeText = state.scene === "comment" ? sceneData.badgeLeft : formatTime(sceneData.durationSec * p);
    const barY = y + h - 13;
    const barX = x + 14;
    const barW = w - 28;

    // 左下时码胶囊 & 右下 HD 胶囊
    const pillY = barY - 26;
    ctx.font = `500 10.5px ${FONT_MONO}`;
    const leftW = Math.max(44, ctx.measureText(timeText).width + 14);
    ctx.fillStyle = "rgba(19, 13, 23, 0.72)";
    ctx.strokeStyle = "rgba(245, 223, 201, 0.26)";
    ctx.lineWidth = 1;
    roundRectPath(ctx, barX, pillY, leftW, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.cream;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timeText, barX + leftW / 2, pillY + 9.5);

    const rightW = Math.max(30, ctx.measureText(sceneData.badgeRight).width + 12);
    ctx.fillStyle = "rgba(19, 13, 23, 0.72)";
    ctx.strokeStyle = "rgba(245, 223, 201, 0.26)";
    roundRectPath(ctx, barX + barW - rightW, pillY, rightW, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(sceneData.badgeRight, barX + barW - rightW / 2, pillY + 9.5);

    // 珊瑚进度条
    ctx.fillStyle = "rgba(245, 223, 201, 0.36)";
    roundRectPath(ctx, barX, barY - 2, barW, 4, 2);
    ctx.fill();
    const progW = Math.max(8, barW * p);
    ctx.fillStyle = PALETTE.coral;
    roundRectPath(ctx, barX, barY - 2, progW, 4, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(barX + progW, barY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // 1:1 原海报标志：上青→下珊瑚渐变圆角描边
  const strokeGrad = ctx.createLinearGradient(x, y, x, y + h);
  strokeGrad.addColorStop(0, PALETTE.cyan);
  strokeGrad.addColorStop(0.55, "#839A9E");
  strokeGrad.addColorStop(1, PALETTE.coral);
  ctx.strokeStyle = strokeGrad;
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 14);
  ctx.stroke();

  return { playX, playY, playR };
}

function drawCaptionCard(ctx, ev, state) {
  const { mediaBox, captionBox, caretAttached, scene, checks } = ev;
  const { x, y, w, h } = captionBox;
  const isStacked = state.arrangement === "stacked";
  const borderColor = checks.proximity.ok && checks.hierarchy.ok && checks.context.ok
    ? PALETTE.coral
    : !checks.proximity.ok
      ? PALETTE.err
      : "rgba(239, 83, 55, 0.72)";

  // 卡底与描边（带原海报招牌上指珊瑚尖角 ^）
  ctx.save();
  ctx.fillStyle = PALETTE.card;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.8;

  if (isStacked && caretAttached) {
    const cx = clamp(mediaBox.x + mediaBox.w * 0.5, x + 28, x + w - 28);
    const tipH = Math.min(11, Math.max(7, ev.actualGap * 0.72));
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(cx - 11, y);
    ctx.lineTo(cx, y - tipH);
    ctx.lineTo(cx + 11, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    roundRectPath(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
  }

  // 经典 2010 float 漏气绕排试错：在横排模式把多出来的正文绕到媒体框底下
  const hasWrapOverflow = !isStacked && state.wrapUnder;
  const pad = Math.min(16, Math.max(10, Math.round(w * 0.03)));
  const showSideMeta = isStacked && w >= 320;
  const splitX = showSideMeta
    ? x + Math.round(w * (state.contextMode === "overload" ? 0.48 : 0.64))
    : x + w;

  // 左侧（或上部）主说明区
  const leftW = Math.max(72, splitX - x - pad * 2);
  let curY = y + pad + 4;

  // 原海报标志珊瑚双引号
  const showQuote = leftW > 130 && state.hierarchy === "clear";
  const textX = showQuote ? x + pad + 20 : x + pad;
  const textMaxW = Math.max(60, leftW - (showQuote ? 22 : 0));

  if (showQuote) {
    ctx.fillStyle = PALETTE.coral;
    ctx.font = `700 28px ${FONT_SERIF}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("“", x + pad - 2, y + pad - 6);
  }

  // 按层级状态决定字号、字重与颜色（真正反映 flat / inverted / clear）
  const titleFont =
    state.hierarchy === "clear"
      ? `700 ${w < 240 ? 12.5 : 14.5}px ${FONT_ZH}`
      : state.hierarchy === "flat"
        ? `400 12.5px ${FONT_ZH}`
        : `400 11.5px ${FONT_ZH}`;
  const titleColor =
    state.hierarchy === "clear"
      ? PALETTE.cream
      : state.hierarchy === "flat"
        ? "#A399A8"
        : "#8F8496";

  ctx.fillStyle = titleColor;
  ctx.font = titleFont;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const titleLines = wrapText(ctx, scene.title + (state.hierarchy === "flat" ? "，" + scene.caption : ""), textMaxW, w < 220 ? 3 : 2);
  const titleLH = state.hierarchy === "clear" ? 21 : 18;
  for (const l of titleLines) {
    ctx.fillText(l, textX, curY);
    curY += titleLH;
  }

  if (state.hierarchy !== "flat" && curY + 18 < y + h - 8) {
    curY += 3;
    ctx.fillStyle = state.hierarchy === "clear" ? PALETTE.creamSoft : "#857A8D";
    ctx.font = `400 11.5px ${FONT_ZH}`;
    const capLines = wrapText(ctx, scene.caption, textMaxW, 2);
    for (const l of capLines) {
      if (curY + 14 > y + h - 8) break;
      ctx.fillText(l, textX, curY);
      curY += 16;
    }
  }

  // 英文编辑衬线小字（空间够时显出）
  if (state.hierarchy === "clear" && curY + 18 < y + h - 10 && textMaxW > 140) {
    curY += 3;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 10.5px ${FONT_SERIF}`;
    const enLines = wrapText(ctx, scene.en, textMaxW, 2);
    for (const l of enLines) {
      if (curY + 13 > y + h - 6) break;
      ctx.fillText(l, textX, curY);
      curY += 14;
    }
  }

  // 上下文区（右侧分栏或底部紧凑行）
  if (showSideMeta) {
    // 竖向细分隔线
    ctx.strokeStyle = "rgba(245, 223, 201, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, y + pad);
    ctx.lineTo(splitX, y + h - pad);
    ctx.stroke();

    const mx = splitX + 14;
    const mw = x + w - mx - pad;
    if (state.contextMode === "missing") {
      // 空缺虚线槽（自适应窄卡自动换行，绝不溢出虚线框）
      ctx.strokeStyle = "rgba(255, 104, 117, 0.58)";
      ctx.setLineDash([4, 4]);
      roundRectPath(ctx, mx, y + pad + 2, mw, h - pad * 2 - 4, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FF99A2";
      ctx.font = `500 ${mw < 130 ? 10.5 : 11.5}px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const missingCopy = mw < 155 ? ["上下文空缺", "无来源/地点"] : ["上下文空缺（无来源 / 地点 / 时间）"];
      const baseMid = y + h / 2 - (missingCopy.length > 1 ? 8 : 4);
      missingCopy.forEach((line, idx) => {
        ctx.fillText(line, mx + mw / 2, baseMid + idx * 15);
      });
    } else if (state.contextMode === "balanced") {
      const rowH = Math.min(24, (h - pad * 2) / 4);
      const metaColor = state.hierarchy === "inverted" ? PALETTE.coralBright : state.hierarchy === "flat" ? "#A399A8" : PALETTE.creamSoft;
      const iconColor = state.hierarchy === "flat" ? "#8D8394" : PALETTE.coral;
      const metaFont = state.hierarchy === "inverted" ? `700 13.5px ${FONT_ZH}` : `400 11.5px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      scene.meta.forEach((m, idx) => {
        const ry = y + pad + 11 + idx * rowH;
        drawMetaIcon(ctx, m.icon, mx + 6, ry, iconColor);
        ctx.fillStyle = metaColor;
        ctx.font = metaFont;
        const label = wrapText(ctx, m.label, mw - 20, 1)[0];
        ctx.fillText(label, mx + 18, ry + 0.5);
      });
    } else {
      // overload: 11 枚堆砌标签
      const allTags = [...scene.meta.map((m) => m.label.split(" / ").pop()), ...scene.overloadTags];
      let tx = mx;
      let ty = y + pad;
      ctx.font = state.hierarchy === "inverted" ? `700 11px ${FONT_MONO}` : `500 10px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (const t of allTags) {
        const tw = Math.min(mw, ctx.measureText(t).width + 12);
        if (tx + tw > mx + mw) {
          tx = mx;
          ty += 21;
        }
        if (ty + 17 > y + h - pad + 4) break;
        ctx.fillStyle = state.hierarchy === "inverted" ? "rgba(239, 83, 55, 0.34)" : "rgba(255, 104, 117, 0.18)";
        ctx.strokeStyle = state.hierarchy === "inverted" ? PALETTE.coralBright : "rgba(255, 104, 117, 0.5)";
        ctx.lineWidth = 1;
        roundRectPath(ctx, tx, ty, tw, 17, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = state.hierarchy === "inverted" ? "#FFE3D8" : "#FFB2BA";
        ctx.fillText(t, tx + 6, ty + 8.8);
        tx += tw + 5;
      }
    }
  } else {
    // 横排或窄卡时的底部紧凑上下文行
    const metaY = Math.min(y + h - 34, curY + 10);
    if (state.contextMode === "missing") {
      ctx.fillStyle = "#FF99A2";
      ctx.font = `500 11px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("⚠ 缺少作者、时间与地点上下文", textX, metaY);
    } else if (state.contextMode === "balanced") {
      ctx.fillStyle = state.hierarchy === "inverted" ? PALETTE.coralBright : PALETTE.cyanBright;
      ctx.font = state.hierarchy === "inverted" ? `700 12.5px ${FONT_ZH}` : `500 11px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const line = scene.meta.map((m) => m.label).join(" · ");
      ctx.fillText(wrapText(ctx, line, textMaxW, 1)[0], textX, metaY);
    } else {
      ctx.fillStyle = "#FF9FA8";
      ctx.font = `600 10.5px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const spam = [...scene.meta.map((m) => m.label), ...scene.overloadTags].join("  ");
      const lines = wrapText(ctx, spam, textMaxW, 2);
      lines.forEach((l, i) => ctx.fillText(l, textX, metaY + i * 14));
    }
  }

  // 如果横排开启了「浮动绕排试错」，真实画出钻到图片底端的 L 形漏气文字带！
  if (hasWrapOverflow) {
    const wrapY = mediaBox.y + mediaBox.h + 8;
    const wrapH = Math.max(30, captionBox.y + captionBox.h - wrapY);
    if (wrapH >= 24) {
      ctx.fillStyle = "rgba(184, 29, 43, 0.22)";
      ctx.strokeStyle = PALETTE.err;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.4;
      roundRectPath(ctx, mediaBox.x, wrapY, mediaBox.w + ev.actualGap + 12, wrapH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFC2C8";
      ctx.font = `500 11px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(wrapText(ctx, "…float 漏气：正文钻到图片下面折成 L 形，左轴断裂", mediaBox.w + ev.actualGap, 1)[0], mediaBox.x + 8, wrapY + wrapH / 2);
    }
  }

  ctx.restore();
}

function drawPillButton(ctx, cx, cy, text, bg, border, fg = "#FFFDF9") {
  ctx.save();
  ctx.font = `600 11.5px ${FONT_ZH}`;
  const tw = ctx.measureText(text).width;
  const w = tw + 20;
  const h = 24;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.3;
  roundRectPath(ctx, x, y, w, h, 999);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
  return { x, y, w, h };
}

export function mountHeroStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let w = 720;
  let h = 480;
  let cachedDpr = 1;
  let hitTargets = [];
  let dragMode = null; // "share" | "gap"
  let dragStart = null;
  let hoverCursor = "ew-resize";
  let dirty = true;

  // 离屏预渲染 28×28 电影格点平铺图案，每帧 1 次 fillRect 替代 180 次循环绘制
  let dotPattern = null;
  function getDotPattern() {
    if (dotPattern) return dotPattern;
    const tile = document.createElement("canvas");
    tile.width = 28;
    tile.height = 28;
    const tctx = tile.getContext("2d");
    tctx.fillStyle = PALETTE.bgDeep;
    tctx.fillRect(0, 0, 28, 28);
    tctx.fillStyle = "rgba(245, 223, 201, 0.05)";
    tctx.fillRect(14, 14, 1.5, 1.5);
    dotPattern = ctx.createPattern(tile, "repeat");
    return dotPattern;
  }

  function measureCanvas() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(260, Math.round(rect.width || 720));
    const nh = Math.max(240, Math.round(rect.height || 416));
    const maxDpr = window.innerWidth <= 520 ? 1.5 : 2;
    const dpr = pixelRatio(maxDpr);
    if (nw !== w || nh !== h || dpr !== cachedDpr || canvas.width !== Math.round(nw * dpr) || canvas.height !== Math.round(nh * dpr)) {
      w = nw;
      h = nh;
      cachedDpr = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }
  measureCanvas();

  function render(t, dt, { still }) {
    const state = getState();
    if (state.playing && !still && dt > 0) {
      state.progress = (state.progress + dt / 18) % 1;
      dirty = true;
    }
    if (!dirty && !still) return;
    dirty = false;

    ctx.setTransform(cachedDpr, 0, 0, cachedDpr, 0, 0);
    const ev = evaluate(state, w, h);
    hitTargets = [];

    // 1. 暗黑放映室底板 + 预渲染电影格点（单次调用）
    ctx.fillStyle = getDotPattern() || PALETTE.bgDeep;
    ctx.fillRect(0, 0, w, h);

    // 2. 右边沿三条青/珊瑚连接锚点预览（暗示连接到右侧三条原海报要点）
    const anchorNodes = [
      { y: ev.mediaBox.y + ev.mediaBox.h * 0.22, color: ev.checks.visual.ok ? PALETTE.cyan : PALETTE.err },
      { y: ev.mediaBox.y + ev.mediaBox.h * 0.62, color: ev.checks.proximity.ok ? PALETTE.coral : PALETTE.err },
      { y: ev.captionBox.y + ev.captionBox.h * 0.5, color: ev.checks.context.ok ? PALETTE.cyan : PALETTE.err },
    ];
    for (const node of anchorNodes) {
      const startX = Math.max(ev.mediaBox.x + ev.mediaBox.w, ev.captionBox.x + ev.captionBox.w);
      if (w - startX > 8) {
        ctx.strokeStyle = node.color;
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(startX + 4, node.y);
        ctx.lineTo(w - 2, node.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(startX + 2, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. 绘制媒体播放器主体 + 记录播放键命中区
    const playHit = drawMediaVisual(ctx, ev.mediaBox, state, t, ev.scene);
    hitTargets.push({
      kind: "play",
      x: playHit.playX - playHit.playR - 6,
      y: playHit.playY - playHit.playR - 6,
      w: (playHit.playR + 6) * 2,
      h: (playHit.playR + 6) * 2,
      cursor: "pointer",
    });

    // 4. 绘制配对说明卡
    drawCaptionCard(ctx, ev, state);

    // 5. 绘制空间邻近标尺与眼跳折线（可视化 Mayer 空间邻近原则）
    const isStacked = state.arrangement === "stacked";
    if (isStacked) {
      const y1 = ev.mediaBox.y + ev.mediaBox.h;
      const y2 = ev.captionBox.y;
      const midX = w * 0.5;
      const gapOk = ev.checks.proximity.ok;
      if (y2 - y1 >= 6) {
        ctx.save();
        ctx.strokeStyle = gapOk ? PALETTE.cyan : PALETTE.err;
        ctx.lineWidth = gapOk ? 1.5 : 2;
        ctx.setLineDash(gapOk ? [3, 3] : [6, 4]);
        ctx.beginPath();
        ctx.moveTo(midX, y1 + 2);
        ctx.lineTo(midX, y2 - 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 当间距拉断时画出动态眼跳提示箭头
        if (ev.gap > 24) {
          const midY = (y1 + y2) / 2;
          const rect = drawPillButton(
            ctx,
            midX,
            midY,
            `× 断联 ${ev.gap}px · 点拉近锁扣`,
            PALETTE.errBg,
            "#FF9FA8"
          );
          hitTargets.push({ kind: "fix-gap", ...rect, cursor: "pointer" });
        } else if (ev.gap < 8) {
          const rect = drawPillButton(
            ctx,
            midX,
            y1,
            `× 撞边 ${ev.gap}px · 点留呼吸缝`,
            PALETTE.errBg,
            "#FF9FA8"
          );
          hitTargets.push({ kind: "fix-gap", ...rect, cursor: "pointer" });
        }
        ctx.restore();
      } else if (ev.gap < 8) {
        const rect = drawPillButton(
          ctx,
          midX,
          y1,
          `× 撞边 ${ev.gap}px · 点留呼吸缝`,
          PALETTE.errBg,
          "#FF9FA8"
        );
        hitTargets.push({ kind: "fix-gap", ...rect, cursor: "pointer" });
      }
    } else {
      // 横排模式绘制竖向间距标尺与可拖分界柄
      const x1 = state.arrangement === "media-left" ? ev.mediaBox.x + ev.mediaBox.w : ev.captionBox.x + ev.captionBox.w;
      const x2 = state.arrangement === "media-left" ? ev.captionBox.x : ev.mediaBox.x;
      const midX = (x1 + x2) / 2;
      const midY = ev.mediaBox.y + ev.mediaBox.h * 0.5;
      const gapOk = ev.checks.proximity.ok;

      ctx.save();
      ctx.strokeStyle = gapOk ? PALETTE.cyan : PALETTE.err;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x1 + 2, midY);
      ctx.lineTo(x2 - 2, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 分界拖拽圆柄
      ctx.fillStyle = gapOk ? PALETTE.cyan : PALETTE.coral;
      roundRectPath(ctx, midX - 5, midY - 18, 10, 36, 5);
      ctx.fill();
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(midX - 1.5, midY - 7, 1, 14);
      ctx.fillRect(midX + 1, midY - 7, 1, 14);
      ctx.restore();

      if (ev.gap > 24 || ev.gap < 8) {
        const rect = drawPillButton(
          ctx,
          clamp(midX, 95, w - 95),
          ev.mediaBox.y - 14,
          ev.gap > 24 ? `× 断联 ${ev.gap}px · 点拉近` : `× 撞边 ${ev.gap}px · 点留缝`,
          PALETTE.errBg,
          "#FF9FA8"
        );
        hitTargets.push({ kind: "fix-gap", ...rect, cursor: "pointer" });
      }
    }

    // 6. 画布内就地可点纠错标签（不挡核心画面，直指错因；窄画布自动缩短文案防碰撞）
    const compactChips = w < 440;
    if (!ev.checks.visual.ok) {
      const label =
        ev.sharePct < ev.visualBand[0]
          ? compactChips ? `× 画面 ${ev.sharePct}% · 点扩宽` : `× 画面仅 ${ev.sharePct}% · 点扩至主导`
          : compactChips ? `× 画面 ${ev.sharePct}% · 点收回` : `× 画面 ${ev.sharePct}% 过胀 · 点收回`;
      const cx = clamp(ev.mediaBox.x + ev.mediaBox.w / 2, 96, w - 96);
      const cy = clamp(ev.mediaBox.y + 18, 48, h - 22);
      const rect = drawPillButton(ctx, cx, cy, label, PALETTE.errBg, "#FF9FA8");
      hitTargets.push({ kind: "fix-visual", ...rect, cursor: "pointer" });
    }

    if (!ev.checks.hierarchy.ok) {
      const label = state.hierarchy === "flat"
        ? compactChips ? "× 层级平灰 · 点改" : "× 层级平灰 · 点分阶"
        : compactChips ? "× 标签喧宾 · 点改" : "× 标签喧宾 · 点归位";
      const cx = clamp(ev.captionBox.x + (compactChips ? 78 : Math.min(125, ev.captionBox.w * 0.32)), 76, w - 76);
      const cy = clamp(ev.captionBox.y + ev.captionBox.h - 16, 28, h - 18);
      const rect = drawPillButton(ctx, cx, cy, label, PALETTE.errBg, "#FF9FA8");
      hitTargets.push({ kind: "fix-hierarchy", ...rect, cursor: "pointer" });
    }

    if (!ev.checks.context.ok && ev.captionBox.w >= 280) {
      const label = state.contextMode === "missing"
        ? compactChips ? "× 缺上下文 · 补全" : "× 缺上下文 · 点补全"
        : compactChips ? "× 标签过载 · 精简" : "× 标签过载 · 点精简";
      const cx = clamp(ev.captionBox.x + ev.captionBox.w - (compactChips ? 74 : 86), 74, w - 74);
      const cy = clamp(ev.captionBox.y + ev.captionBox.h - 16, 28, h - 18);
      const rect = drawPillButton(ctx, cx, cy, label, PALETTE.errBg, "#FF9FA8");
      hitTargets.push({ kind: "fix-context", ...rect, cursor: "pointer" });
    }

    // 7. 顶角轻量实时实测徽标（同源数）
    const hudText = `画面 ${ev.sharePct}% · 间距 ${ev.gap}px · ${ev.passedCount}/4`;
    ctx.font = `500 11px ${FONT_MONO}`;
    const hudW = ctx.measureText(hudText).width + 20;
    const hudX = w - hudW - 12;
    const hudY = 10;
    ctx.fillStyle = "rgba(19, 13, 23, 0.84)";
    ctx.strokeStyle = ev.allGood ? PALETTE.ok : "rgba(245, 223, 201, 0.24)";
    ctx.lineWidth = 1;
    roundRectPath(ctx, hudX, hudY, hudW, 22, 999);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ev.allGood ? PALETTE.ok : PALETTE.cream;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, hudX + hudW / 2, hudY + 11.5);
  }

  const ctrl = loop(canvas, render);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      measureCanvas();
      ctrl.draw();
    }).observe(canvas);
  }

  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function findHit(pt) {
    for (let i = hitTargets.length - 1; i >= 0; i--) {
      const ht = hitTargets[i];
      if (pt.x >= ht.x && pt.x <= ht.x + ht.w && pt.y >= ht.y && pt.y <= ht.y + ht.h) return ht;
    }
    return null;
  }

  let moved = false;
  let activePointerId = null;

  function applyClickTarget(hit) {
    const s = getState();
    const isStacked = s.arrangement === "stacked";
    if (hit.kind === "play") {
      onMutate({ playing: !s.playing });
    } else if (hit.kind === "fix-visual") {
      onMutate({ mediaShare: isStacked ? 0.64 : 0.40 });
    } else if (hit.kind === "fix-gap") {
      onMutate({ gapPx: isStacked ? 14 : 18, wrapUnder: false });
    } else if (hit.kind === "fix-hierarchy") {
      onMutate({ hierarchy: "clear" });
    } else if (hit.kind === "fix-context") {
      onMutate({ contextMode: "balanced" });
    }
  }

  // Pointer + Touch 双轨支持（保证触屏横向拖动畅通，竖向页面滚动不卡顿，且兼容 perf.mjs 触控拖动）
  canvas.addEventListener("pointerdown", (e) => {
    const pt = toLocal(e.clientX, e.clientY);
    const s = getState();
    const ev = evaluate(s, w, h);
    activePointerId = e.pointerId;
    moved = false;
    const hit = findHit(pt);
    // 竖排时如果按在说明卡区域内，纵向拖间距；否则横向拖画面占比
    const inCaption = s.arrangement === "stacked" && pt.y >= ev.captionBox.y - 10;
    dragMode = hit ? `hit:${hit.kind}` : inCaption ? "both" : "share";
    dragStart = { x: pt.x, y: pt.y, share: s.mediaShare, gap: s.gapPx, hit };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = toLocal(e.clientX, e.clientY);
    if (!dragStart) {
      const hit = findHit(pt);
      hoverCursor = hit ? hit.cursor : "ew-resize";
      canvas.style.cursor = hoverCursor;
      return;
    }
    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;
    if (Math.hypot(dx, dy) > 5) moved = true;
    if (!moved) return;

    if (dragMode === "both" && Math.abs(dy) > Math.abs(dx) * 1.15) {
      const nextGap = Math.round(clamp(dragStart.gap + dy * 0.9, 0, 84));
      const snappedGap = Math.abs(nextGap - 14) <= 2 ? 14 : nextGap;
      onMutate({ gapPx: snappedGap });
    } else {
      const nextShare = clamp(dragStart.share + (dx / Math.max(180, w * 0.65)) * 0.68, 0.16, 0.84);
      const sweet = getState().arrangement === "stacked" ? 0.64 : 0.40;
      const snapped = Math.abs(nextShare - sweet) < 0.015 ? sweet : +nextShare.toFixed(3);
      onMutate({ mediaShare: snapped });
    }
  });

  function endDrag(e) {
    if (!dragStart) return;
    if (!moved && dragStart.hit) {
      applyClickTarget(dragStart.hit);
    }
    if (activePointerId != null) {
      try { canvas.releasePointerCapture(activePointerId); } catch {}
    }
    dragStart = null;
    dragMode = null;
    activePointerId = null;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 显式 touch 监听：确保 CDP dispatchTouchEvent（perf.mjs）在移动端横向来回拖时零丢帧
  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const tc = e.touches[0];
      const pt = toLocal(tc.clientX, tc.clientY);
      const s = getState();
      touchStart = { x: pt.x, y: pt.y, share: s.mediaShare, lockedH: false };
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchStart || e.touches.length !== 1) return;
      const tc = e.touches[0];
      const pt = toLocal(tc.clientX, tc.clientY);
      const dx = pt.x - touchStart.x;
      const dy = pt.y - touchStart.y;
      if (!touchStart.lockedH && Math.abs(dx) > Math.abs(dy) + 3) touchStart.lockedH = true;
      if (touchStart.lockedH) {
        if (e.cancelable) e.preventDefault();
        const nextShare = clamp(touchStart.share + (dx / Math.max(160, w * 0.6)) * 0.68, 0.16, 0.84);
        onMutate({ mediaShare: +nextShare.toFixed(3) });
      }
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => { touchStart = null; }, { passive: true });

  // 键盘无障碍操作
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onMutate({ mediaShare: +clamp(s.mediaShare + 0.04, 0.16, 0.84).toFixed(3) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onMutate({ mediaShare: +clamp(s.mediaShare - 0.04, 0.16, 0.84).toFixed(3) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onMutate({ gapPx: clamp(s.gapPx - 4, 0, 84) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onMutate({ gapPx: clamp(s.gapPx + 4, 0, 84) });
    } else if (e.key === " ") {
      e.preventDefault();
      onMutate({ playing: !s.playing });
    }
  });

  window.addEventListener("resize", () => {
    measureCanvas();
    ctrl.draw();
  });

  return {
    draw: () => {
      dirty = true;
      ctrl.draw();
    },
    markDirty: () => {
      dirty = true;
    },
    getSize: () => ({ w, h }),
  };
}
