import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ANTI_CASES,
  HISTORY_CARDS,
  INITIAL_STATE,
  PRESETS,
  QUIZ_DATA,
  READING_FAMILY,
  STAGE_H,
  STAGE_W,
  TOTAL_SECONDS,
  evaluateLayout,
  evaluateSurgery,
  mirrorX,
  sampleHeat,
} from "./model.js";

// ==================== 状态与单真源 ====================
const state = { ...INITIAL_STATE };
let autoPlay = true; // 开场自动演示一遍 6 秒眼动扫读（0 -> 1）
let animProgress = 0.08; // 开场动画进度
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragLockedAxis = null; // "x" | "y" | null
let dragStartProgress = 1;
let hitRects = []; // 当帧绘制到画布的四区点击命中区（屏幕坐标）

// 离线热力场缓存：只在布局结构或方向改变时重算，渲染每帧零开销
let heatCacheKey = "";
const heatCanvas = document.createElement("canvas");
heatCanvas.width = 100;
heatCanvas.height = 74;
const heatCtx = heatCanvas.getContext("2d");

function rebuildHeatCache(st) {
  const key = `${st.headline}|${st.skim}|${st.anchor}|${st.cta}|${st.rtl ? 1 : 0}`;
  if (key === heatCacheKey) return;
  heatCacheKey = key;
  const W = heatCanvas.width;
  const H = heatCanvas.height;
  const img = heatCtx.createImageData(W, H);
  const d = img.data;
  for (let py = 0; py < H; py++) {
    const wy = ((py + 0.5) / H) * STAGE_H;
    for (let px = 0; px < W; px++) {
      const wx = ((px + 0.5) / W) * STAGE_W;
      const v = sampleHeat(wx, wy, st);
      const idx = (py * W + px) * 4;
      if (v < 0.14) {
        d[idx + 3] = 0;
        continue;
      }
      // 经典红外眼动热力色阶：黄绿 -> 暖橘 -> 朱红
      let r, g, b, a;
      if (v < 0.45) {
        const u = (v - 0.14) / 0.31;
        r = Math.round(236 + 18 * u);
        g = Math.round(205 - 35 * u);
        b = Math.round(72 - 34 * u);
        a = Math.round(32 + 78 * u);
      } else if (v < 0.72) {
        const u = (v - 0.45) / 0.27;
        r = Math.round(252 - 12 * u);
        g = Math.round(170 - 95 * u);
        b = Math.round(38 - 18 * u);
        a = Math.round(110 + 70 * u);
      } else {
        const u = Math.min(1, (v - 0.72) / 0.28);
        r = Math.round(240 - 8 * u);
        g = Math.round(75 - 38 * u);
        b = Math.round(20 - 6 * u);
        a = Math.round(180 + 48 * u);
      }
      d[idx] = r;
      d[idx + 1] = g;
      d[idx + 2] = b;
      d[idx + 3] = a;
    }
  }
  heatCtx.putImageData(img, 0, 0);
}

// 离线静态网页底板缓存：把高开销的文字测宽、中文字光栅化与热力图合成只算一次
// 拖拽时间轴或播放眼动动画时，每帧只需 1 次 drawImage + 轨迹线 + 扫描圈（软渲染也能 60fps）
let baseCacheKey = "";
const baseCanvas = document.createElement("canvas");
const baseCtx = baseCanvas.getContext("2d");
let lastEvalCache = null;
let stageNeedsPaint = true;
let lastUiClockKey = "";

// ==================== 画布绘制工具（等比坐标，绝不拉扁圆） ====================
const canvas = document.getElementById("f-stage");
const ctx = canvas.getContext("2d");

function drawEyeIcon(c, cx, cy, r, strokeColor, fillColor) {
  c.save();
  c.beginPath();
  c.moveTo(cx - r * 1.45, cy);
  c.quadraticCurveTo(cx, cy - r * 1.15, cx + r * 1.45, cy);
  c.quadraticCurveTo(cx, cy + r * 1.15, cx - r * 1.45, cy);
  c.closePath();
  if (fillColor) {
    c.fillStyle = fillColor;
    c.fill();
  }
  c.strokeStyle = strokeColor;
  c.lineWidth = Math.max(1.8, r * 0.2);
  c.stroke();
  c.beginPath();
  c.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
  c.fillStyle = strokeColor;
  c.fill();
  c.restore();
}

function drawBadgeCircle(c, cx, cy, r, num, bg, fg) {
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fillStyle = bg;
  c.fill();
  c.fillStyle = fg;
  c.font = `800 ${Math.round(r * 1.12)}px "Chivo", "Noto Sans SC", sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(String(num), cx, cy + 1);
  c.restore();
}

function drawArrowLine(c, x1, y1, x2, y2, color, lw, headLen, dashed = false) {
  c.save();
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = lw;
  c.lineCap = "round";
  if (dashed) c.setLineDash([6, 6]);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - headLen * Math.cos(ang - 0.46), y2 - headLen * Math.sin(ang - 0.46));
  c.lineTo(x2 - headLen * Math.cos(ang + 0.46), y2 - headLen * Math.sin(ang + 0.46));
  c.closePath();
  c.fill();
  c.restore();
}

function clipText(c, text, maxW) {
  if (c.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 2 && c.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}

function drawStage() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const cw = rect.width;
  const ch = rect.height;
  // 手机窄屏按 GUIDE.md 建议限制像素比 ≤ 1.5，兼顾清晰度与软渲染 60fps
  const dpr = cw < 500 ? pixelRatio(1.5) : pixelRatio(2);
  const pw = Math.round(cw * dpr);
  const ph = Math.round(ch * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
    baseCacheKey = "";
  }

  const evalRes = evaluateLayout(state);
  lastEvalCache = evalRes;
  const { scene, anchors, gaze, targets } = evalRes;
  const rtl = !!state.rtl;
  const isPoster = state.overlay === "poster";
  const isHeat = state.overlay === "heat";
  const isClean = state.overlay === "clean";

  const barH = 34;
  const padX = Math.max(12, cw * 0.03);
  const trackX = padX;
  const trackW = cw - padX * 2;
  const trackY = 18;

  // 等比映射逻辑舞台 STAGE_W × STAGE_H 到下方可用画布（绝不拉伸变形！）
  const isTall = (ch - barH) / cw > 0.85;
  const bottomStripH = isTall ? 72 : 0;
  const availW = cw - (cw < 440 ? 10 : 16);
  const availH = ch - barH - bottomStripH - 12;
  const scale = Math.min(availW / STAGE_W, availH / STAGE_H);
  const ox = (cw - STAGE_W * scale) / 2;
  const oy = barH + 6 + (availH - STAGE_H * scale) / 2;

  const sx = (x) => ox + x * scale;
  const sy = (y) => oy + y * scale;
  const sw = (w) => w * scale;
  const sh = (h) => h * scale;
  const fs = (px) => Math.max(10, Math.round(px * scale));

  // 记录 4 个可点交互区域（CSS 像素，供点击改稿用）
  hitRects = [
    { zone: 1, x: sx(anchors.bar1.x), y: sy(anchors.bar1.y), w: sw(anchors.bar1.w), h: sh(anchors.bar1.h) },
    { zone: 2, x: sx(anchors.bar2.x), y: sy(anchors.bar2.y), w: sw(anchors.bar2.w), h: sh(anchors.bar2.h) },
    { zone: 3, x: sx(Math.min(anchors.bar3.x, anchors.bodyBox.x)), y: sy(anchors.bodyBox.y), w: sw(834), h: sh(anchors.bodyBox.h) },
    { zone: 4, x: sx(anchors.ctaLeftBox.x), y: sy(anchors.ctaLeftBox.y), w: sw(anchors.ctaLeftBox.w), h: sh(anchors.ctaLeftBox.h) },
  ];

  // ---------- 1. 静态底板缓存（仅结构/阶段命中变化时重绘文字与网页底图） ----------
  const hitMask = targets.map((t) => (t.hitNow ? 2 : t.fullHit ? 1 : 0)).join("");
  const curBaseKey = `${pw}x${ph}|${state.scene}|${state.headline}|${state.skim}|${state.anchor}|${state.cta}|${state.overlay}|${rtl ? 1 : 0}|${hitMask}|${isTall ? gaze.stage : 0}`;

  if (curBaseKey !== baseCacheKey) {
    baseCacheKey = curBaseKey;
    if (baseCanvas.width !== pw || baseCanvas.height !== ph) {
      baseCanvas.width = pw;
      baseCanvas.height = ph;
    }
    const bc = baseCtx;
    bc.save();
    bc.scale(dpr, dpr);

    // 纸面底
    bc.fillStyle = "#FAF3EA";
    bc.fillRect(0, 0, cw, ch);

    // 顶部进度条静态槽与刻度字
    bc.fillStyle = "#F2E9DD";
    bc.fillRect(0, 0, cw, barH);
    bc.strokeStyle = "#D6CBC0";
    bc.lineWidth = 1;
    bc.beginPath();
    bc.moveTo(0, barH);
    bc.lineTo(cw, barH);
    bc.stroke();

    bc.fillStyle = "#DFD4C7";
    bc.fillRect(trackX, trackY - 3, trackW, 6);

    const stageMarks = [
      { p: 0.0, t: "0s ①" },
      { p: 0.30, t: "1.8s ②" },
      { p: 0.54, t: "3.2s ③" },
      { p: 0.84, t: "5.0s ④" },
      { p: 1.0, t: "6.0s" },
    ];
    bc.font = `700 ${cw < 420 ? 10 : 11}px "Chivo", "Noto Sans SC", sans-serif`;
    bc.textBaseline = "top";
    stageMarks.forEach((m, idx) => {
      const mx = trackX + trackW * m.p;
      bc.fillStyle = "#5C534A";
      bc.textAlign = idx === 0 ? "left" : idx === stageMarks.length - 1 ? "right" : "center";
      bc.fillText(m.t, mx, 3);
    });

    // 网页外线框（复刻 127 原海报细框）
    const frameX = sx(26);
    const frameY = sy(20);
    const frameW = sw(948);
    const frameH = sh(700);
    bc.fillStyle = "#FCF8F2";
    bc.fillRect(frameX, frameY, frameW, frameH);
    bc.strokeStyle = "#CFC4B8";
    bc.lineWidth = 1.4;
    bc.strokeRect(frameX, frameY, frameW, frameH);

    // 1) 主图占位山月图
    const hm = anchors.heroMedia;
    bc.fillStyle = "#DBD6D1";
    bc.fillRect(sx(hm.x), sy(hm.y), sw(hm.w), sh(hm.h));
    bc.fillStyle = "#EFECE8";
    bc.beginPath();
    const peakBaseX = rtl ? hm.x + hm.w * 0.26 : hm.x + hm.w * 0.56;
    bc.moveTo(sx(peakBaseX), sy(hm.y + hm.h));
    bc.lineTo(sx(peakBaseX + 95), sy(hm.y + 18));
    bc.lineTo(sx(peakBaseX + 190), sy(hm.y + hm.h));
    bc.closePath();
    bc.fill();
    bc.beginPath();
    bc.arc(sx(rtl ? hm.x + hm.w * 0.18 : hm.x + hm.w * 0.84), sy(hm.y + 30), 15 * scale, 0, Math.PI * 2);
    bc.fill();
    bc.fillStyle = "#6F6861";
    bc.font = `700 ${fs(13)}px "Chivo", "Noto Sans SC", sans-serif`;
    bc.textAlign = rtl ? "right" : "left";
    bc.textBaseline = "middle";
    bc.fillText(scene.name, sx(rtl ? hm.x + hm.w - 18 : hm.x + 18), sy(hm.y + hm.h / 2));

    // 2) ① 首行标题
    const b1 = anchors.bar1;
    bc.fillStyle = isPoster ? "#E83412" : "#F3ECE3";
    bc.fillRect(sx(b1.x), sy(b1.y), sw(b1.w), sh(b1.h));
    if (!isPoster) {
      bc.strokeStyle = "#D6CBC0";
      bc.lineWidth = 1;
      bc.strokeRect(sx(b1.x), sy(b1.y), sw(b1.w), sh(b1.h));
    }
    if (isPoster) {
      const c1x = rtl ? b1.x + b1.w - 46 : b1.x + 46;
      drawBadgeCircle(bc, sx(c1x), sy(b1.y + 28), 18 * scale, 1, "#FFFFFF", "#D62B0C");
      const eye1x = rtl ? b1.x + 56 : b1.x + b1.w - 56;
      drawEyeIcon(bc, sx(eye1x), sy(b1.y + 26), 13 * scale, "#FFFFFF", null);
      bc.fillStyle = "#FFFFFF";
      bc.font = `700 ${fs(12)}px "Chivo", sans-serif`;
      bc.textAlign = "center";
      bc.textBaseline = "top";
      bc.fillText("skim", sx(eye1x), sy(b1.y + 42));
      const a1Start = rtl ? c1x - 30 : c1x + 30;
      const a1End = rtl ? eye1x + 36 : eye1x - 36;
      drawArrowLine(bc, sx(a1Start), sy(b1.y + 28), sx(a1End), sy(b1.y + 28), "rgba(255,255,255,0.92)", Math.max(2, 3 * scale), 9 * scale);
    }

    const hObj = scene.headline[state.headline];
    const hPadL = isPoster ? 82 : 24;
    const hMaxW = state.cta === "topSpam" ? b1.w - hPadL - 390 : b1.w - hPadL - 108;
    bc.fillStyle = isPoster ? "#FFFFFF" : "#11100F";
    bc.font = `900 ${fs(22)}px "Noto Sans SC", sans-serif`;
    bc.textAlign = rtl ? "right" : "left";
    bc.textBaseline = "middle";
    const hTextX = rtl ? b1.x + b1.w - hPadL : b1.x + hPadL;
    const hTextY = isPoster ? b1.y + 66 : b1.y + 46;
    bc.fillText(clipText(bc, hObj.text, sw(Math.max(180, hMaxW))), sx(hTextX), sy(hTextY));

    if (state.cta === "topSpam") {
      const sb = anchors.ctaSpamBox;
      const bw = (sb.w - 16) / 3;
      scene.cta.spamLabels.forEach((lbl, i) => {
        const bx = sb.x + i * (bw + 8);
        bc.fillStyle = isPoster ? "#11100F" : "#D62B0C";
        bc.fillRect(sx(bx), sy(sb.y + 10), sw(bw), sh(40));
        bc.strokeStyle = "#FFFFFF";
        bc.lineWidth = 1.4;
        bc.strokeRect(sx(bx), sy(sb.y + 10), sw(bw), sh(40));
        bc.fillStyle = "#FFFFFF";
        bc.font = `800 ${fs(14)}px "Noto Sans SC", sans-serif`;
        bc.textAlign = "center";
        bc.textBaseline = "middle";
        bc.fillText(lbl, sx(bx + bw / 2), sy(sb.y + 30));
      });
    }

    // 3) ② 次级横扫区
    const b2 = anchors.bar2;
    bc.fillStyle = isPoster ? "#E83412" : "#F5EFE6";
    bc.fillRect(sx(b2.x), sy(b2.y), sw(b2.w), sh(b2.h));
    if (!isPoster) {
      bc.strokeStyle = "#DCD2C7";
      bc.lineWidth = 1;
      bc.strokeRect(sx(b2.x), sy(b2.y), sw(b2.w), sh(b2.h));
    }
    if (isPoster) {
      const c2x = rtl ? b2.x + b2.w - 34 : b2.x + 34;
      drawBadgeCircle(bc, sx(c2x), sy(b2.y + 22), 15 * scale, 2, "#FFFFFF", "#D62B0C");
      const turnX = rtl ? b2.x + b2.w * 0.34 : b2.x + b2.w * 0.66;
      drawEyeIcon(bc, sx(turnX), sy(b2.y + 22), 11.5 * scale, "#FFFFFF", null);
      const a2Start = rtl ? c2x - 24 : c2x + 24;
      const a2End = rtl ? turnX + 28 : turnX - 28;
      drawArrowLine(bc, sx(a2Start), sy(b2.y + 22), sx(a2End), sy(b2.y + 22), "rgba(255,255,255,0.92)", Math.max(1.8, 2.6 * scale), 8 * scale);

      const dimX = rtl ? b2.x : turnX + 24;
      const dimW = rtl ? turnX - 24 - b2.x : b2.x + b2.w - (turnX + 24);
      if (dimW > 20) {
        bc.fillStyle = "rgba(17, 16, 15, 0.24)";
        bc.fillRect(sx(dimX), sy(b2.y), sw(dimW), sh(b2.h));
        bc.strokeStyle = "rgba(255,255,255,0.75)";
        bc.setLineDash([4, 4]);
        bc.beginPath();
        bc.moveTo(sx(rtl ? turnX - 24 : turnX + 24), sy(b2.y));
        bc.lineTo(sx(rtl ? turnX - 24 : turnX + 24), sy(b2.y + b2.h));
        bc.stroke();
        bc.setLineDash([]);
      }
    }

    const sObj = scene.skim[state.skim];
    bc.fillStyle = isPoster ? "#FFFFFF" : "#11100F";
    bc.font = `700 ${fs(17)}px "Noto Sans SC", sans-serif`;
    bc.textAlign = rtl ? "right" : "left";
    bc.textBaseline = "middle";
    const sPad = isPoster ? 20 : 18;
    const sTextX = rtl ? b2.x + b2.w - sPad : b2.x + sPad;
    const sTextY = isPoster ? b2.y + 52 : b2.y + 36;
    bc.fillText(clipText(bc, sObj.text, sw(b2.w - 36)), sx(sTextX), sy(sTextY));

    // 4) ③ 左侧垂直锚带
    const b3 = anchors.bar3;
    if (isPoster) {
      bc.fillStyle = "#E83412";
      bc.fillRect(sx(b3.x), sy(b3.y), sw(b3.w), sh(b3.h));
      const cx3 = b3.x + b3.w / 2;
      drawBadgeCircle(bc, sx(cx3), sy(b3.y + 74), 22 * scale, 3, "#FFFFFF", "#D62B0C");
      drawArrowLine(bc, sx(cx3), sy(b3.y + 116), sx(cx3), sy(b3.y + b3.h - 102), "rgba(255,255,255,0.92)", Math.max(2, 3.2 * scale), 10 * scale);
      drawEyeIcon(bc, sx(cx3), sy(b3.y + b3.h - 62), 16 * scale, "#FFFFFF", null);
      bc.fillStyle = "#FFFFFF";
      bc.font = `700 ${fs(14)}px "Chivo", sans-serif`;
      bc.textAlign = "center";
      bc.textBaseline = "top";
      bc.fillText("scan", sx(cx3), sy(b3.y + b3.h - 38));
    } else {
      bc.fillStyle = "#F1E9DF";
      bc.fillRect(sx(b3.x), sy(b3.y), sw(b3.w), sh(b3.h));
      bc.fillStyle = "#776D63";
      bc.font = `700 ${fs(12)}px "Chivo", "Noto Sans SC", sans-serif`;
      bc.textAlign = "center";
      bc.textBaseline = "middle";
      bc.fillText(rtl ? "右锚带" : "左锚带", sx(b3.x + b3.w / 2), sy(b3.y + b3.h / 2));
    }

    // 5) ③ 正文区域
    const bb = anchors.bodyBox;
    bc.fillStyle = "#FFFFFF";
    bc.fillRect(sx(bb.x), sy(bb.y), sw(bb.w), sh(bb.h));
    bc.strokeStyle = "#E4DBD0";
    bc.lineWidth = 1;
    bc.strokeRect(sx(bb.x), sy(bb.y), sw(bb.w), sh(bb.h));

    if (state.anchor === "wall") {
      bc.fillStyle = "#4A433C";
      bc.font = `400 ${fs(15.5)}px "Noto Sans SC", sans-serif`;
      bc.textAlign = rtl ? "right" : "left";
      bc.textBaseline = "middle";
      scene.anchor.wallLines.forEach((line, i) => {
        const lx = rtl ? bb.x + bb.w - 16 : bb.x + 16;
        const ly = bb.y + 24 + i * 35;
        bc.fillText(clipText(bc, line, sw(bb.w - 32)), sx(lx), sy(ly));
      });
    } else {
      const centerOffsets = [125, 180, 102];
      const rowH = 56;
      if (state.anchor === "bullets" || state.anchor === "center") {
        bc.save();
        bc.strokeStyle = state.anchor === "bullets" ? "rgba(21, 97, 66, 0.45)" : "rgba(201, 38, 10, 0.55)";
        bc.lineWidth = 1.6;
        bc.setLineDash([4, 4]);
        bc.beginPath();
        scene.anchor.bullets.forEach((_, i) => {
          const bx = state.anchor === "center" ? bb.x + centerOffsets[i] : bb.x + 22;
          const px = sx(mirrorX(bx, 0, rtl));
          const py = sy(bb.y + 34 + i * rowH);
          if (i === 0) bc.moveTo(px, py);
          else bc.lineTo(px, py);
        });
        bc.stroke();
        bc.restore();
      }

      scene.anchor.bullets.forEach((item, i) => {
        const ry = bb.y + 34 + i * rowH;
        const isCenter = state.anchor === "center";
        const isAllBold = state.anchor === "allbold";

        if (!isCenter) {
          const dotX = rtl ? bb.x + bb.w - 22 : bb.x + 22;
          bc.beginPath();
          bc.arc(sx(dotX), sy(ry), 5.5 * scale, 0, Math.PI * 2);
          bc.fillStyle = isAllBold ? "#C9260A" : "#E83412";
          bc.fill();
        }

        const tx = isCenter ? bb.x + bb.w / 2 : rtl ? bb.x + bb.w - 40 : bb.x + 40;
        bc.textBaseline = "middle";
        if (isCenter) {
          bc.textAlign = "center";
          bc.font = `700 ${fs(16.5)}px "Noto Sans SC", sans-serif`;
          bc.fillStyle = "#11100F";
          bc.fillText(clipText(bc, `${item.lead}${item.rest}`, sw(bb.w - 40)), sx(tx), sy(ry));
        } else if (isAllBold) {
          bc.textAlign = rtl ? "right" : "left";
          bc.font = `900 ${fs(17)}px "Noto Sans SC", sans-serif`;
          bc.fillStyle = "#C9260A";
          bc.fillText(clipText(bc, `${item.lead}${item.rest}`, sw(bb.w - 58)), sx(tx), sy(ry));
        } else {
          bc.textAlign = rtl ? "right" : "left";
          bc.font = `900 ${fs(17)}px "Noto Sans SC", sans-serif`;
          bc.fillStyle = "#B32007";
          bc.fillText(item.lead, sx(tx), sy(ry));
          const leadW = bc.measureText(item.lead).width;
          bc.font = `400 ${fs(15.5)}px "Noto Sans SC", sans-serif`;
          bc.fillStyle = "#4A433C";
          const restX = rtl ? sx(tx) - leadW - 2 : sx(tx) + leadW + 2;
          const maxRest = Math.max(40, sw(bb.w - 64) - leadW);
          bc.fillText(clipText(bc, item.rest, maxRest), restX, sy(ry));
        }
      });
    }

    // 6) ④ 底部行动位置
    if (state.cta === "bottomLeft") {
      const cb = anchors.ctaLeftBox;
      bc.fillStyle = "#F8D5CA";
      bc.fillRect(sx(cb.x), sy(cb.y), sw(cb.w), sh(cb.h));
      bc.strokeStyle = "#E83412";
      bc.lineWidth = 2;
      bc.strokeRect(sx(cb.x), sy(cb.y), sw(cb.w), sh(cb.h));
      const c4x = rtl ? cb.x + cb.w - 46 : cb.x + 46;
      drawBadgeCircle(bc, sx(c4x), sy(cb.y + cb.h / 2), 20 * scale, 4, "#E83412", "#FFFFFF");
      bc.fillStyle = "#A31D06";
      bc.font = `900 ${fs(24)}px "Noto Sans SC", sans-serif`;
      bc.textAlign = "center";
      bc.textBaseline = "middle";
      bc.fillText(scene.cta.label, sx(cb.x + cb.w / 2), sy(cb.y + cb.h / 2));
      const arrEnd = rtl ? cb.x + 42 : cb.x + cb.w - 42;
      const arrStart = rtl ? cb.x + 86 : cb.x + cb.w - 86;
      drawArrowLine(bc, sx(arrStart), sy(cb.y + cb.h / 2), sx(arrEnd), sy(cb.y + cb.h / 2), "#B32007", Math.max(1.8, 2.6 * scale), 8 * scale);
    } else if (state.cta === "bottomRight") {
      const cb = anchors.ctaLeftBox;
      bc.strokeStyle = "#E2D8CC";
      bc.setLineDash([5, 5]);
      bc.lineWidth = 1.2;
      bc.strokeRect(sx(cb.x), sy(cb.y), sw(cb.w), sh(cb.h));
      bc.setLineDash([]);
      const rb = anchors.ctaRightBox;
      bc.fillStyle = "#91887E";
      bc.font = `500 ${fs(14)}px "Noto Sans SC", sans-serif`;
      bc.textAlign = rtl ? "left" : "right";
      bc.textBaseline = "middle";
      bc.fillText(scene.cta.weakLabel, sx(rtl ? rb.x + 8 : rb.x + rb.w - 8), sy(rb.y + rb.h / 2));
    } else {
      const cb = anchors.ctaLeftBox;
      bc.strokeStyle = "#E2D8CC";
      bc.setLineDash([5, 5]);
      bc.lineWidth = 1.2;
      bc.strokeRect(sx(cb.x), sy(cb.y), sw(cb.w), sh(cb.h));
      bc.setLineDash([]);
      bc.fillStyle = "#7D7368";
      bc.font = `600 ${fs(14)}px "Noto Sans SC", sans-serif`;
      bc.textAlign = "center";
      bc.textBaseline = "middle";
      bc.fillText("底部行动区空置（按钮全堆到了第一行）", sx(cb.x + cb.w / 2), sy(cb.y + cb.h / 2));
    }

    // 热力雾层
    if (isHeat) {
      rebuildHeatCache(state);
      bc.save();
      bc.globalAlpha = 0.86;
      bc.drawImage(heatCanvas, ox, oy, STAGE_W * scale, STAGE_H * scale);
      bc.restore();
    }

    // 实绘目标关键词命中 / 盲区标记
    if (!isClean) {
      const zoneTagPos = {
        1: { x: rtl ? b1.x + 12 : b1.x + b1.w - 108, y: b1.y + 4 },
        2: { x: rtl ? b2.x + 10 : b2.x + b2.w - 10, y: b2.y + 4, alignRight: !rtl },
        3: { x: rtl ? bb.x + 10 : bb.x + bb.w - 10, y: bb.y + 5, alignRight: !rtl },
        4: { x: rtl ? anchors.ctaLeftBox.x + 10 : anchors.ctaLeftBox.x + anchors.ctaLeftBox.w - 10, y: anchors.ctaLeftBox.y + 5, alignRight: !rtl },
      };
      targets.forEach((t) => {
        const isOk = t.hitNow;
        const isFutureHit = t.fullHit && !t.hitNow;
        const pillText = isOk
          ? "✓ 已扫中"
          : isFutureHit
            ? "… 待扫至"
            : t.zone === 3 && state.anchor === "allbold"
              ? "× 全粗过载"
              : t.zone === 3 && state.anchor === "center"
                ? "× 居中失锚"
                : "× 落入盲区";

        if (t.zone === 3 && t.items && state.anchor === "wall") {
          t.items.forEach((it) => {
            bc.save();
            bc.strokeStyle = "#C9260A";
            bc.lineWidth = 1.4;
            bc.setLineDash([4, 3]);
            bc.strokeRect(sx(it.rect.x), sy(it.rect.y), sw(it.rect.w), sh(it.rect.h));
            bc.restore();
          });
        }

        const tagFont = Math.max(10, Math.round(11.5 * scale));
        bc.font = `700 ${tagFont}px "Noto Sans SC", sans-serif`;
        const textW = bc.measureText(pillText).width;
        const tagW = Math.ceil(textW + 12);
        const tagH = Math.max(18, Math.round(22 * scale));
        const pos = zoneTagPos[t.zone];
        let tagX = pos.alignRight ? sx(pos.x) - tagW : sx(pos.x);
        if (t.zone === 1) {
          tagX = rtl ? sx(b1.x + 108) : sx(b1.x + b1.w - 108) - tagW;
        }
        tagX = Math.min(ox + STAGE_W * scale - tagW - 6, Math.max(ox + 6, tagX));
        const tagY = sy(pos.y);

        bc.fillStyle = isOk ? "#156142" : isFutureHit ? "#5C534A" : "#11100F";
        bc.fillRect(tagX, tagY, tagW, tagH);
        bc.fillStyle = "#FFFFFF";
        bc.textAlign = "center";
        bc.textBaseline = "middle";
        bc.fillText(pillText, tagX + tagW / 2, tagY + tagH / 2 + 0.5);
      });
    }

    // 手机竖屏原生内嵌底沿四阶段实况脉冲条
    if (isTall) {
      const stripY = oy + STAGE_H * scale + 8;
      const stripX = ox + 4;
      const stripW = STAGE_W * scale - 8;
      const stripH = Math.max(54, ch - stripY - 6);
      const gap = 6;
      const cellW = (stripW - gap * 3) / 4;
      const stages = [
        { n: 1, name: "① 首行横扫", t: targets[0] },
        { n: 2, name: "② 次行短扫", t: targets[1] },
        { n: 3, name: "③ 左侧纵扫", t: targets[2] },
        { n: 4, name: "④ 行动落点", t: targets[3] },
      ];
      stages.forEach((st, idx) => {
        const cx = stripX + idx * (cellW + gap);
        const active = gaze.stage === st.n;
        bc.fillStyle = st.t.hitNow ? "#E0F1E8" : active ? "#F8D5CA" : "#F3ECE3";
        bc.fillRect(cx, stripY, cellW, stripH);
        bc.strokeStyle = st.t.hitNow ? "#156142" : active ? "#E83412" : "#D6CBC0";
        bc.lineWidth = active ? 1.8 : 1;
        bc.strokeRect(cx, stripY, cellW, stripH);

        bc.fillStyle = "#11100F";
        bc.font = `800 11px "Noto Sans SC", sans-serif`;
        bc.textAlign = "center";
        bc.textBaseline = "middle";
        bc.fillText(st.name, cx + cellW / 2, stripY + stripH * 0.34);

        bc.fillStyle = st.t.hitNow ? "#156142" : "#B32007";
        bc.font = `700 10.5px "Noto Sans SC", sans-serif`;
        bc.fillText(st.t.hitNow ? "✓ 已命中" : st.t.fullHit ? "… 待扫" : "× 易漏", cx + cellW / 2, stripY + stripH * 0.7);
      });
    }

    bc.restore();
  }

  // ---------- 2. 每帧超轻动态层（1 次 blit + 进度红条游标 + 眼动轨 + 2° 扫描圈） ----------
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(baseCanvas, 0, 0);
  ctx.scale(dpr, dpr);

  // 顶部红色实时进度条 + 游标正圆
  ctx.fillStyle = "#E83412";
  ctx.fillRect(trackX, trackY - 3, trackW * state.progress, 6);
  const knobX = trackX + trackW * state.progress;
  ctx.beginPath();
  ctx.arc(knobX, trackY, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#E83412";
  ctx.stroke();

  // 实时眼动轨迹与 2° 中央凹扫描光圈
  if (!isClean) {
    const pts = anchors.waypoints;
    ctx.strokeStyle = isPoster ? "rgba(17, 16, 15, 0.65)" : "rgba(201, 38, 10, 0.85)";
    ctx.lineWidth = Math.max(2, 2.8 * scale);
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      if (pt.p <= state.progress) {
        if (!started) {
          ctx.moveTo(sx(pt.x), sy(pt.y));
          started = true;
        } else {
          ctx.lineTo(sx(pt.x), sy(pt.y));
        }
      } else {
        break;
      }
    }
    if (started) ctx.lineTo(sx(gaze.x), sy(gaze.y));
    ctx.stroke();
    ctx.setLineDash([]);

    const gx = sx(gaze.x);
    const gy = sy(gaze.y);
    const gr = Math.max(18, 34 * scale);
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(232, 52, 18, 0.14)";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "#E83412";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(gx, gy, Math.max(4, 6 * scale), 0, Math.PI * 2);
    ctx.fillStyle = "#11100F";
    ctx.fill();
  }

  ctx.restore();
}

// ==================== DOM 同步（全部从同一份 evaluateLayout 单真源更新） ====================
const CHECK_ICONS = {
  H: `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M7 5v18M21 5v18M7 14h14" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="square"/></svg>`,
  key: `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="19" cy="9" r="5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 13L6 22M10 18l3 3M7 21l2.5 2.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  list: `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="6" cy="7" r="2.2" fill="currentColor"/><circle cx="6" cy="14" r="2.2" fill="currentColor"/><circle cx="6" cy="21" r="2.2" fill="currentColor"/><path d="M12 7h12M12 14h12M12 21h12" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`,
  eye: `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 14Q14 4 25 14Q14 24 3 14Z" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="14" cy="14" r="3.6" fill="currentColor"/></svg>`,
  bar: `<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="10" y="4" width="7" height="20" fill="currentColor"/></svg>`,
  cursor: `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M6 4l15 10-7 2 4 7-3 1.5-4-7-5 4.5Z" fill="currentColor"/></svg>`,
};

let lastQuickPatch = null;

function syncUI() {
  const res = evaluateLayout(state);

  // 顶栏状态徽章
  const statusPill = document.getElementById("hero-status-pill");
  statusPill.textContent = res.diagnosis.badge;
  statusPill.classList.toggle("is-ok", res.diagnosis.ok);

  // 画布底沿实时时钟与扫中数
  document.getElementById("canvas-clock").textContent =
    `${res.timeSec.toFixed(1)}s / ${TOTAL_SECONDS.toFixed(1)}s · 扫中 ${res.currentHits}/4`;

  // 书写方向按钮文案
  const rtlBtn = document.getElementById("btn-rtl");
  rtlBtn.setAttribute("aria-pressed", String(state.rtl));
  rtlBtn.classList.toggle("is-active", state.rtl);
  rtlBtn.textContent = state.rtl ? "书写方向：RTL 右→左（反 F）" : "书写方向：LTR 左→右";

  // 场景任务说明
  document.getElementById("scene-task-note").textContent = `${res.scene.taskPrompt} 点击下方任意格可定位对应改稿区。`;

  // 四条边注状态与选中态同步
  res.targets.forEach((t) => {
    const el = document.getElementById(`zone-state-${t.zone}`);
    if (el) {
      el.textContent = t.fullHit ? "已落热区" : t.zone === 3 && state.anchor === "center" ? "失锚" : t.zone === 3 && state.anchor === "allbold" ? "过载" : "易漏读";
      el.classList.toggle("is-ok", t.fullHit);
    }
  });

  document.querySelectorAll(".pill-btn[data-field]").forEach((btn) => {
    const active = state[btn.dataset.field] === btn.dataset.val;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll(".scene-tab").forEach((tab) => {
    const active = tab.dataset.scene === state.scene;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll("[data-overlay]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.overlay === state.overlay);
  });

  // 左下图例随当前眼动阶段高亮
  document.querySelectorAll("#legend-list .legend-row").forEach((li) => {
    li.classList.toggle("is-active", Number(li.dataset.stage) === res.gaze.stage);
  });

  // 实测指标与白话诊单
  document.getElementById("diag-metrics-tag").textContent =
    `${state.rtl ? "右" : "左"}半注视 ${res.anchorSidePct}%（示意）`;

  const diagBadge = document.getElementById("diag-badge");
  diagBadge.textContent = res.diagnosis.badge;
  diagBadge.classList.toggle("is-ok", res.diagnosis.ok);
  document.getElementById("diag-title").textContent = res.diagnosis.title;
  document.getElementById("diag-why").textContent = res.diagnosis.why;
  document.getElementById("diag-fix").textContent = res.diagnosis.fix;

  const actionRow = document.querySelector(".diag-action-row");
  actionRow.classList.toggle("is-ok", res.diagnosis.ok);

  const quickFix = document.getElementById("btn-quick-fix");
  const mQuickFix = document.getElementById("m-quick-fix");
  lastQuickPatch = res.diagnosis.fixPatch;
  if (lastQuickPatch) {
    quickFix.hidden = false;
    quickFix.textContent = res.diagnosis.fixLabel;
    mQuickFix.hidden = false;
    mQuickFix.textContent = res.diagnosis.fixLabel;
  } else {
    quickFix.hidden = true;
    mQuickFix.hidden = true;
  }

  // 手机首屏摘要条同步
  const mPeek = document.getElementById("mobile-diag-peek");
  mPeek.classList.toggle("is-ok", res.diagnosis.ok);
  const mBadge = document.getElementById("m-diag-badge");
  mBadge.textContent = res.diagnosis.badge;
  mBadge.classList.toggle("is-ok", res.diagnosis.ok);
  document.getElementById("m-diag-title").textContent = res.diagnosis.title;

  // 2×3 最佳实践清单实时体检格
  document.getElementById("checklist-count").textContent = `已达标 ${res.checklistPass} / 6`;
  const grid = document.getElementById("checklist-grid");
  grid.innerHTML = res.checklist
    .map(
      (c) => `
      <button type="button" class="ck-cell ${c.ok ? "is-ok" : ""}" data-focus-zone="${c.focusZone}">
        <span class="ck-icon">${CHECK_ICONS[c.icon]}</span>
        <span class="ck-body">
          <span class="ck-top">
            <span class="ck-title">${c.title}</span>
            <span class="ck-state">${c.ok ? "✓ " : "× "}${c.statusText}</span>
          </span>
          <span class="ck-sub">${c.posterSub}</span>
        </span>
      </button>`
    )
    .join("");
}

function flashZone(zone) {
  const el = document.querySelector(`.callout-item[data-zone="${zone}"]`);
  if (!el) return;
  el.classList.add("is-flash");
  setTimeout(() => el.classList.remove("is-flash"), 650);
}

// 渲染预设按钮
const presetStrip = document.getElementById("preset-strip");
presetStrip.innerHTML = PRESETS.map(
  (p) => `<button type="button" class="preset-btn ${p.kind === "warn" ? "is-warn" : p.kind === "good" ? "is-good" : ""}" data-preset="${p.id}">${p.label}</button>`
).join("");

// ==================== 舞台渲染循环（lib/stage.js 省电 + 丝滑横拖） ====================
let heroLoop;
function requestHeroDraw() {
  stageNeedsPaint = true;
  syncUI();
  if (heroLoop) heroLoop.draw();
  else drawStage();
}

function updateClockLightweight(res) {
  const clockStr = `${res.timeSec.toFixed(1)}s / ${TOTAL_SECONDS.toFixed(1)}s · 扫中 ${res.currentHits}/4`;
  const key = `${clockStr}|${res.gaze.stage}`;
  if (key === lastUiClockKey) return;
  lastUiClockKey = key;
  document.getElementById("canvas-clock").textContent = clockStr;
  document.querySelectorAll("#legend-list .legend-row").forEach((li) => {
    li.classList.toggle("is-active", Number(li.dataset.stage) === res.gaze.stage);
  });
}

heroLoop = loop(canvas, (_t, dt, { still }) => {
  if (still) {
    autoPlay = false;
    state.progress = 1.0;
    syncUI();
    drawStage();
    stageNeedsPaint = false;
    return;
  }
  if (autoPlay && !dragging) {
    animProgress += dt * 0.42; // 约 2.2 秒走完一遍 6 秒眼动，0.9s 截图正处于中段热扫！
    if (animProgress >= 1.0) {
      animProgress = 1.0;
      autoPlay = false;
    }
    state.progress = animProgress;
    stageNeedsPaint = true;
  }
  if (stageNeedsPaint) {
    drawStage();
    if (lastEvalCache) updateClockLightweight(lastEvalCache);
    stageNeedsPaint = false;
  }
});

// ==================== 舞台手势：横拖推进眼动时间轴 + 点击四区原地改稿 ====================
const ZONE_CYCLES = {
  1: { field: "headline", order: ["vague", "front", "tail"] },
  2: { field: "skim", order: ["right", "front", "empty"] },
  3: { field: "anchor", order: ["wall", "bullets", "center", "allbold"] },
  4: { field: "cta", order: ["bottomRight", "bottomLeft", "topSpam"] },
};

function startDrag(clientX, clientY) {
  dragging = true;
  autoPlay = false;
  dragStartX = clientX;
  dragStartY = clientY;
  dragLockedAxis = null;
  dragStartProgress = state.progress;
}

function moveDrag(clientX, clientY, ev) {
  if (!dragging) return;
  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  if (!dragLockedAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    dragLockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  }
  if (dragLockedAxis === "y") return; // 放行页面上下滚
  if (ev && ev.cancelable) ev.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const deltaP = dx / Math.max(160, rect.width * 0.72);
  state.progress = Math.max(0, Math.min(1, dragStartProgress + deltaP));
  stageNeedsPaint = true;
}

function endDrag(clientX, clientY) {
  if (!dragging) return;
  const moved = Math.hypot(clientX - dragStartX, clientY - dragStartY);
  dragging = false;
  if (moved < 9) {
    // 短点画布：如果点在顶部时间条，跳到该时间；若点在四区之一，原地循环改稿！
    const rect = canvas.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    if (ly <= 36) {
      const padX = Math.max(12, rect.width * 0.03);
      state.progress = Math.max(0, Math.min(1, (lx - padX) / Math.max(1, rect.width - padX * 2)));
      requestHeroDraw();
      return;
    }
    const hit = hitRects.find((r) => lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h);
    if (hit) {
      const cyc = ZONE_CYCLES[hit.zone];
      const idx = cyc.order.indexOf(state[cyc.field]);
      state[cyc.field] = cyc.order[(idx + 1) % cyc.order.length];
      state.progress = 1.0;
      flashZone(hit.zone);
      requestHeroDraw();
    }
  } else {
    syncUI();
  }
}

// 同时兼容指针与原始 Touch 事件（确保 CDP dispatchTouchEvent / 真实手机都丝滑）
let activeTouchId = null;
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  activeTouchId = t.identifier;
  startDrag(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  const t = [...e.touches].find((x) => x.identifier === activeTouchId);
  if (!t) return;
  moveDrag(t.clientX, t.clientY, e);
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  const t = [...e.changedTouches].find((x) => x.identifier === activeTouchId);
  if (!t) return;
  activeTouchId = null;
  endDrag(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return;
  canvas.setPointerCapture(e.pointerId);
  startDrag(e.clientX, e.clientY);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  moveDrag(e.clientX, e.clientY, e);
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  endDrag(e.clientX, e.clientY);
});

canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    autoPlay = false;
    state.progress = Math.min(1, +(state.progress + 0.05).toFixed(2));
    requestHeroDraw();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    autoPlay = false;
    state.progress = Math.max(0, +(state.progress - 0.05).toFixed(2));
    requestHeroDraw();
  }
});

// ==================== 按钮与清单事件绑定 ====================
document.querySelectorAll(".scene-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    state.progress = 1.0;
    autoPlay = false;
    requestHeroDraw();
  });
});

document.querySelectorAll("[data-overlay]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.overlay = btn.dataset.overlay;
    requestHeroDraw();
  });
});

document.getElementById("btn-rtl").addEventListener("click", () => {
  state.rtl = !state.rtl;
  state.progress = 1.0;
  autoPlay = false;
  requestHeroDraw();
});

document.getElementById("btn-replay").addEventListener("click", () => {
  if (reducedMotion.matches) {
    state.progress = 1.0;
    requestHeroDraw();
    return;
  }
  animProgress = 0.02;
  state.progress = 0.02;
  autoPlay = true;
  requestHeroDraw();
});

document.querySelectorAll(".pill-btn[data-field]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state[btn.dataset.field] = btn.dataset.val;
    state.progress = 1.0;
    autoPlay = false;
    requestHeroDraw();
  });
});

function applyQuickFix() {
  if (!lastQuickPatch) return;
  Object.assign(state, lastQuickPatch);
  state.progress = 1.0;
  autoPlay = false;
  requestHeroDraw();
}
document.getElementById("btn-quick-fix").addEventListener("click", applyQuickFix);
document.getElementById("m-quick-fix").addEventListener("click", applyQuickFix);

presetStrip.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-preset]");
  if (!btn) return;
  const p = PRESETS.find((x) => x.id === btn.dataset.preset);
  if (!p) return;
  Object.assign(state, p.patch);
  state.progress = 1.0;
  autoPlay = false;
  requestHeroDraw();
});

document.getElementById("checklist-grid").addEventListener("click", (e) => {
  const cell = e.target.closest("[data-focus-zone]");
  if (!cell) return;
  const zone = Number(cell.dataset.focusZone);
  flashZone(zone);
  const targetEl = document.querySelector(`.callout-item[data-zone="${zone}"]`);
  if (targetEl && window.innerWidth < 1120) {
    targetEl.scrollIntoView({ block: "nearest" });
  }
});

// ==================== 01 节：2° 中央凹视野锥探照灯 ====================
const foveaCard = document.getElementById("fovea-card");
const foveaNote = document.getElementById("fovea-note");

function setFoveaPos(fxPct, fyPct, noteText) {
  foveaCard.style.setProperty("--fx", `${fxPct}%`);
  foveaCard.style.setProperty("--fy", `${fyPct}%`);
  if (noteText) foveaNote.textContent = noteText;
}

foveaCard.addEventListener("pointermove", (e) => {
  if (foveaCard.classList.contains("is-clear")) return;
  const r = foveaCard.getBoundingClientRect();
  const x = Math.max(6, Math.min(94, ((e.clientX - r.left) / r.width) * 100));
  const y = Math.max(10, Math.min(90, ((e.clientY - r.top) / r.height) * 100));
  const zoneHint =
    y < 32
      ? "① 首行区域：横向视野充裕，品名与 48dB 降噪最先进入大脑。"
      : y < 56
        ? x > 62
          ? "② 次行右侧：第二横扫往往在此之前折返，行尾信息极易漏读。"
          : "② 次行左段：快速扫出双设备切换与快充参数。"
        : x < 38
          ? "③ 正文左缘：垂直略读只能瞥见最左 4–5 个字。"
          : "× 中右下盲区：「两年只换不修」极具吸引力，但埋在这里几乎不被扫到。";
  setFoveaPos(x.toFixed(1), y.toFixed(1), zoneHint);
});

document.querySelectorAll(".stop-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".stop-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    foveaCard.classList.remove("is-clear");
    document.querySelectorAll("[data-fovea]").forEach((b) => b.classList.toggle("is-active", b.dataset.fovea === "fovea"));
    setFoveaPos(btn.dataset.fx, btn.dataset.fy, btn.dataset.note);
  });
});

document.querySelectorAll("[data-fovea]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const clear = btn.dataset.fovea === "clear";
    foveaCard.classList.toggle("is-clear", clear);
    document.querySelectorAll("[data-fovea]").forEach((b) => b.classList.toggle("is-active", b === btn));
    foveaNote.textContent = clear
      ? "全文展开后，你才发现右下角其实藏着「两年官方只换不修」这项重要承诺——但在 2° 扫读里它最容易被跳过。"
      : "已切回 2° 中央凹视窗：在上方卡片移动光标或点四个视点按钮，直观感受右侧盲区。";
  });
});

// ==================== 02 节：4 把排版手术刀 ====================
const surgeryInputs = {
  pyramid: document.getElementById("k-pyramid"),
  frontload: document.getElementById("k-frontload"),
  chunk: document.getElementById("k-chunk"),
  bullets: document.getElementById("k-bullets"),
  overbold: document.getElementById("k-overbold"),
};

function renderSurgery() {
  const k = {
    pyramid: surgeryInputs.pyramid.checked,
    frontload: surgeryInputs.frontload.checked,
    chunk: surgeryInputs.chunk.checked,
    bullets: surgeryInputs.bullets.checked,
    overbold: surgeryInputs.overbold.checked,
  };
  const res = evaluateSurgery(k);

  const scoreEl = document.getElementById("surg-score");
  scoreEl.textContent = `${res.hitCount} / 4`;
  scoreEl.classList.toggle("is-ok", res.hitCount === 4);

  const gradeEl = document.getElementById("surg-grade");
  gradeEl.textContent = res.grade;
  gradeEl.classList.toggle("is-ok", res.hitCount === 4);

  const doc = document.getElementById("surg-doc");
  doc.classList.toggle("is-overbold", k.overbold);

  let html = "";
  if (k.pyramid) {
    html += `<h4>12 月 1 日将自动续费 298 元/年，扣款前 24 小时可随时关闭</h4>`;
  } else {
    html += `<p>尊敬的云笔记年度会员您好，感谢您过去一年持续使用我们的多端同步与云空间服务。</p>`;
  }

  if (k.bullets) {
    if (k.chunk) html += `<h5>续订与取消细则</h5>`;
    const items = k.frontload
      ? [
          `<span class="kw-lead">12 月 1 日自动扣费</span>：年度订阅到期当日从原支付方式扣除 <span class="kw-lead">298 元/年</span>。`,
          `<span class="kw-lead">提前 24 小时可取消</span>：在扣款时间前任意时刻退订均不产生任何费用。`,
          `<span class="kw-lead">设置 → 订阅管理</span>：点击「关闭自动续订」即可立即生效，已购权益照常保留至期满。`,
        ]
      : [
          `按照您去年开通时勾选的连续包年协议，系统会在 12 月 1 日自动划扣 298 元/年。`,
          `如果您下一年度暂不需要云端高级功能，请务必在扣款前 24 小时完成取消操作。`,
          `如需手动关闭本次续订，打开客户端依次进入设置 → 订阅管理即可停用。`,
        ];
    html += `<ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  } else if (k.chunk) {
    html += `<h5>扣费时间与金额</h5>`;
    html += k.frontload
      ? `<p><span class="kw-lead">12 月 1 日扣费 298 元/年</span>，系统将按原支付渠道自动续订下一年度会员权益。</p>`
      : `<p>为保障您的云端文件同步不中断，系统将在订阅周期届满当日（12 月 1 日）自动为您延续一年并扣款 298 元/年。</p>`;
    html += `<h5>如何提前取消</h5>`;
    html += k.frontload
      ? `<p><span class="kw-lead">提前 24 小时关闭免费</span>，前往「设置 → 订阅管理」即可一键取消自动续订。</p>`
      : `<p>若您计划调整方案，可在扣款前 24 小时内打开客户端底部菜单，进入设置 → 订阅管理手动关闭自动续费。</p>`;
  } else {
    html += k.frontload
      ? `<p><span class="kw-lead">12 月 1 日自动扣费 298 元/年</span>，延续您当前的高级同步与存储方案。如不需要续订，请于扣款前 24 小时进入设置 → 订阅管理手动关闭，关闭后不影响本期剩余权益使用。</p>`
      : `<p>为保障您的日常文档写作与多设备历史版本同步不会因会员到期而意外中断，依据您首次订阅时确认的连续包年服务条款，系统预计将于 12 月 1 日按 298 元/年的标准从默认支付渠道自动续费。若您暂不计划续订，请最迟于扣款前 24 小时打开账户中心，在设置 → 订阅管理中手动关闭自动续费开关。</p>`;
  }
  doc.innerHTML = html;

  document.getElementById("surg-facts").innerHTML = res.facts
    .map(
      (f) => `
      <div class="surg-fact ${f.hit ? "is-hit" : ""}">
        <div class="surg-fact-head">
          <span>${f.label}</span>
          <span class="surg-fact-badge">${f.hit ? "✓ 扫中" : "× 易漏"}</span>
        </div>
        <p class="surg-fact-why">${f.why}</p>
      </div>`
    )
    .join("");
  document.getElementById("surg-note").textContent = res.note;
}

Object.values(surgeryInputs).forEach((el) => el.addEventListener("change", renderSurgery));
renderSurgery();

// ==================== 03 节：实证年代胶片切卡 + LTR/RTL 镜像 ====================
const filmStrip = document.getElementById("film-strip");
const filmDetail = document.getElementById("film-detail");
let activeHistIdx = 2; // 默认停在 2006 定名 F 型，也可任选 1997–2020

function renderHistory() {
  filmStrip.innerHTML = HISTORY_CARDS.map(
    (h, i) => `
    <button type="button" class="film-card ${i === activeHistIdx ? "is-active" : ""}" role="tab" aria-selected="${i === activeHistIdx}" data-hist="${i}">
      <span class="film-year">${h.year}</span>
      <span class="film-short">${h.title}</span>
    </button>`
  ).join("");
  const cur = HISTORY_CARDS[activeHistIdx];
  filmDetail.innerHTML = `
    <div>
      <p class="film-who">${cur.year} · ${cur.who}</p>
      <h3>${cur.title}</h3>
      <p class="film-summary">${cur.summary}</p>
    </div>
    <div class="film-metric-box">
      <span class="film-metric-val">${cur.metric}</span>
      <span class="film-metric-note">${cur.metricNote}</span>
    </div>`;
}

filmStrip.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-hist]");
  if (!btn) return;
  activeHistIdx = Number(btn.dataset.hist);
  renderHistory();
});
renderHistory();

const rtlBoard = document.getElementById("rtl-board");
const rtlCopy = document.getElementById("rtl-copy-lines");
const rtlStat = document.getElementById("rtl-stat-card");

function renderRtlDemo(dir) {
  rtlBoard.dataset.dir = dir;
  document.querySelectorAll("[data-mirror]").forEach((b) => b.classList.toggle("is-active", b.dataset.mirror === dir));
  if (dir === "ltr") {
    rtlCopy.innerHTML = `
      <div class="rtl-copy-line"><strong>左侧锚点对齐：</strong>从左向右书写时，每一行的起始信息气味集中在左侧</div>
      <div class="rtl-copy-line"><strong>右下成为盲区：</strong>视线第二横提前折返，右下角注视密度最低</div>`;
    rtlStat.innerHTML = `
      <h4>LTR 左→右页面（正 F）</h4>
      <p>NN/g 2017 年宽屏眼动研究测得：在从左向右的网页中，约 <strong>80%</strong> 的注视时间集中在屏幕左半侧，右半侧仅约 <strong>20%</strong>。</p>
      <p>因此中文、英文、法文等横排网页把核心词和主按钮锚在左缘最省眼力。</p>`;
  } else {
    rtlCopy.innerHTML = `
      <div class="rtl-copy-line"><strong>右侧成为锚线：</strong>阿拉伯语、希伯来语从右向左阅读，眼动水平翻转为「反 F」</div>
      <div class="rtl-copy-line"><strong>左下变成盲区：</strong>两次横扫都从右侧出发向左推进，左下角最容易被跳过</div>`;
    rtlStat.innerHTML = `
      <h4>RTL 右→左页面（镜像反 F）</h4>
      <p>Kara Pernice (2017) 实测阿拉伯语网站发现，热力图完整水平镜像：视线从右上起步向左扫，垂直纵扫锚在右侧边沿。</p>
      <p>做多语言本地化时，不只是把文字右对齐，连导航锚点、关键词前置与主行动位都要一起镜像翻转。</p>`;
  }
}

document.querySelectorAll("[data-mirror]").forEach((btn) => {
  btn.addEventListener("click", () => renderRtlDemo(btn.dataset.mirror));
});
renderRtlDemo("ltr");

// ==================== 04 节：同族五式分工 ====================
const FAMILY_SVGS = {
  "127": `<svg viewBox="0 0 280 200" aria-hidden="true">
    <rect x="8" y="8" width="264" height="184" fill="#FCF9F4" stroke="#BDB0A2" stroke-width="1.5"/>
    <rect x="26" y="24" width="228" height="28" fill="#E83412"/>
    <rect x="64" y="66" width="142" height="24" fill="#E83412"/>
    <rect x="26" y="66" width="28" height="110" fill="#E83412"/>
    <rect x="64" y="104" width="186" height="12" fill="#D8D4D1"/>
    <rect x="64" y="124" width="160" height="12" fill="#D8D4D1"/>
    <rect x="64" y="148" width="128" height="26" fill="#F8D5CA" stroke="#E83412" stroke-width="1.5"/>
  </svg>`,
  "128": `<svg viewBox="0 0 280 200" aria-hidden="true">
    <rect x="8" y="8" width="264" height="184" fill="#FCF9F4" stroke="#BDB0A2" stroke-width="1.5"/>
    <polyline points="38,38 242,38 38,162 242,162" fill="none" stroke="#E83412" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="38" cy="38" r="9" fill="#11100F"/><circle cx="242" cy="38" r="9" fill="#11100F"/>
    <circle cx="38" cy="162" r="9" fill="#11100F"/><circle cx="242" cy="162" r="11" fill="#E83412"/>
  </svg>`,
  "129": `<svg viewBox="0 0 280 200" aria-hidden="true">
    <rect x="8" y="8" width="264" height="184" fill="#FCF9F4" stroke="#BDB0A2" stroke-width="1.5"/>
    <rect x="20" y="20" width="114" height="74" fill="#F8D5CA"/><rect x="146" y="20" width="114" height="74" fill="#EFE6DA"/>
    <rect x="20" y="106" width="114" height="74" fill="#E8E4DF"/><rect x="146" y="106" width="114" height="74" fill="#F8D5CA"/>
    <line x1="36" y1="36" x2="244" y2="164" stroke="#E83412" stroke-width="4" stroke-dasharray="7 5"/>
    <circle cx="36" cy="36" r="8" fill="#11100F"/><circle cx="244" cy="164" r="9" fill="#E83412"/>
  </svg>`,
  "130": `<svg viewBox="0 0 280 200" aria-hidden="true">
    <rect x="8" y="8" width="264" height="184" fill="#FCF9F4" stroke="#BDB0A2" stroke-width="1.5"/>
    <rect x="26" y="24" width="210" height="16" fill="#E83412"/>
    <rect x="26" y="48" width="224" height="16" fill="#E4DDD4"/>
    <rect x="26" y="82" width="186" height="16" fill="#E83412"/>
    <rect x="26" y="106" width="224" height="16" fill="#E4DDD4"/>
    <rect x="26" y="140" width="196" height="16" fill="#E83412"/>
    <rect x="26" y="164" width="204" height="16" fill="#E4DDD4"/>
  </svg>`,
  "131": `<svg viewBox="0 0 280 200" aria-hidden="true">
    <rect x="8" y="8" width="264" height="184" fill="#FCF9F4" stroke="#BDB0A2" stroke-width="1.5"/>
    <rect x="26" y="28" width="228" height="10" fill="#E4DDD4"/><rect x="26" y="54" width="228" height="10" fill="#E4DDD4"/>
    <rect x="26" y="86" width="228" height="10" fill="#E4DDD4"/><rect x="26" y="118" width="228" height="10" fill="#E4DDD4"/>
    <rect x="26" y="150" width="228" height="10" fill="#E4DDD4"/>
    <circle cx="72" cy="33" r="12" fill="#E83412"/><circle cx="196" cy="59" r="10" fill="#E83412"/>
    <circle cx="118" cy="91" r="13" fill="#E83412"/><circle cx="212" cy="123" r="11" fill="#E83412"/>
    <circle cx="88" cy="155" r="11" fill="#E83412"/>
  </svg>`,
};

const familyTabs = document.getElementById("family-tabs");
const familySvgWrap = document.getElementById("family-svg-wrap");
const familyInfo = document.getElementById("family-info");
let activeFamId = "127";

function renderFamily() {
  familyTabs.innerHTML = READING_FAMILY.map(
    (f) => `
    <button type="button" class="fam-tab ${f.id === activeFamId ? "is-active" : ""}" role="tab" aria-selected="${f.id === activeFamId}" data-fam="${f.id}">
      <span class="fam-tab-no">NO. ${f.id}</span>
      <span class="fam-tab-name">${f.name}</span>
    </button>`
  ).join("");
  const cur = READING_FAMILY.find((x) => x.id === activeFamId);
  familySvgWrap.innerHTML = FAMILY_SVGS[cur.id];
  familyInfo.innerHTML = `
    <h3>${cur.id} · ${cur.name}</h3>
    <p class="family-en">${cur.en}</p>
    <p class="family-trigger"><strong>典型页面形态：</strong>${cur.trigger}</p>
    <p class="family-oneline">${cur.oneLine}</p>
    ${cur.current
      ? `<span class="family-here">当前正在阅读本页</span>`
      : `<a class="family-link" href="${cur.url}" target="_blank" rel="noopener">前往 ${cur.id}「${cur.name}」互动页 →</a>`}`;
}

familyTabs.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-fam]");
  if (!btn) return;
  activeFamId = btn.dataset.fam;
  renderFamily();
});
renderFamily();

// ==================== 05 节：什么时候别用（误用诊疗抽屉卡） ====================
const antiList = document.getElementById("anti-list");
const openAnti = new Set([ANTI_CASES[0].id, ANTI_CASES[1].id]); // 默认展开前两张保持双列视觉平衡，其余自由开关

function renderAnti() {
  antiList.innerHTML = ANTI_CASES.map((a) => {
    const isOpen = openAnti.has(a.id);
    return `
      <article class="anti-card">
        <button type="button" class="anti-trigger" aria-expanded="${isOpen}" data-anti="${a.id}">
          <span class="anti-trigger-main">
            <span class="anti-tag">${a.tag}</span>
            <span class="anti-title">${a.title}</span>
          </span>
          <span class="anti-chevron" aria-hidden="true">${isOpen ? "−" : "+"}</span>
        </button>
        <div class="anti-body" ${isOpen ? "" : "hidden"}>
          <div class="anti-row"><strong>表面像 F：</strong>${a.surface}</div>
          <div class="anti-row"><strong>实际翻车：</strong>${a.failure}</div>
          <div class="anti-row is-instead"><strong>正确换法：</strong>${a.instead}</div>
        </div>
      </article>`;
  }).join("");
}

antiList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-anti]");
  if (!btn) return;
  const id = btn.dataset.anti;
  if (openAnti.has(id)) openAnti.delete(id);
  else openAnti.add(id);
  renderAnti();
});
renderAnti();

// ==================== 06 节：单变量小练习（机场快线退票规则） ====================
document.getElementById("quiz-prompt").textContent = QUIZ_DATA.prompt;
const quizGrid = document.getElementById("quiz-grid");
const quizFeedback = document.getElementById("quiz-feedback");
let pickedQuiz = null;

const QUIZ_WIRES = {
  A: `<div class="mini-wire">
        <div class="mw-h1">根据机场快线运营管理规定，旅客购票后可按标准办理退票</div>
        <div class="mw-h2">为维护站内秩序，距起飞超过 2 小时申请将免收手续费，若在 2 小时内则扣 20%</div>
        <div class="mw-body">退票款项按原路径返还至支付账户，银行卡通道到账时效以发卡行通知为准。</div>
        <div class="mw-cta-right">如需办理退票请点此提交 →</div>
        <svg class="mw-f-trace" viewBox="0 0 200 180" preserveAspectRatio="none"><path d="M12 20H168M12 58H116M16 20V146" stroke="rgba(232,52,18,0.65)" stroke-width="9" fill="none" stroke-linecap="round"/></svg>
      </div>`,
  B: `<div class="mini-wire">
        <div class="mw-h1"><span class="mw-kw">起飞前 2 小时内退票扣 20%</span>，提前 2 小时以上全额退</div>
        <ul class="mw-ul">
          <li><span class="mw-kw">2 小时内</span>：按票面价扣 20% 手续费</li>
          <li><span class="mw-kw">2 小时外</span>：免费全额退票，不扣费</li>
          <li><span class="mw-kw">原路到账</span>：提交后即时原路退回</li>
        </ul>
        <div class="mw-cta-left">提交退票 →</div>
        <svg class="mw-f-trace" viewBox="0 0 200 180" preserveAspectRatio="none"><path d="M12 20H178M12 62H128M16 20V152H92" stroke="rgba(21,97,66,0.58)" stroke-width="9" fill="none" stroke-linecap="round"/></svg>
      </div>`,
  C: `<div class="mini-wire mw-center mw-allbold">
        <div class="mw-h1">起飞前 2 小时内退票扣 20% 手续费</div>
        <div class="mw-h2">提前 2 小时以上免费全额退票不扣费</div>
        <div class="mw-body">提交申请后款项原路返还支付账户</div>
        <div class="mw-cta-center">提交退票 →</div>
        <svg class="mw-f-trace" viewBox="0 0 200 180" preserveAspectRatio="none"><path d="M24 20H176M54 60L148 60M42 100L160 100" stroke="rgba(232,52,18,0.55)" stroke-width="6" stroke-dasharray="5 5" fill="none"/></svg>
      </div>`,
  D: `<div class="mini-wire">
        <div class="mw-h1">欢迎乘坐机场快线，祝您每一程出行平安顺心</div>
        <div class="mw-body">本快线全年全天候运营，服务覆盖两座航站楼。若行程临时调整需要变更车票，电子客票在线上即可处理，退票款原路返还，起飞前 2 小时以上免费退，若在起飞前 2 小时内申请需扣 20% 手续费。</div>
        <div class="mw-cta-left">提交退票 →</div>
        <svg class="mw-f-trace" viewBox="0 0 200 180" preserveAspectRatio="none"><path d="M12 20H168M12 66H112M16 20V152" stroke="rgba(232,52,18,0.65)" stroke-width="9" fill="none" stroke-linecap="round"/></svg>
      </div>`,
};

function renderQuiz() {
  quizGrid.innerHTML = QUIZ_DATA.options
    .map((opt) => {
      const picked = pickedQuiz === opt.id;
      const revealed = pickedQuiz !== null;
      const isRight = revealed && opt.id === QUIZ_DATA.answer;
      const isWrong = revealed && picked && opt.id !== QUIZ_DATA.answer;
      return `
        <button type="button" class="quiz-card ${picked ? "is-picked" : ""} ${revealed ? "is-revealed" : ""} ${isRight ? "is-right" : ""} ${isWrong ? "is-wrong" : ""}" role="radio" aria-checked="${picked}" data-quiz="${opt.id}">
          <span class="quiz-card-head">
            <span class="quiz-letter">${opt.label}</span>
            <span class="quiz-meta">${revealed ? opt.meta : opt.neutralTag}</span>
          </span>
          ${QUIZ_WIRES[opt.id]}
        </button>`;
    })
    .join("");

  if (!pickedQuiz) {
    quizFeedback.hidden = true;
    return;
  }
  const hit = pickedQuiz === QUIZ_DATA.answer;
  const chosen = QUIZ_DATA.options.find((o) => o.id === pickedQuiz);
  quizFeedback.hidden = false;
  quizFeedback.className = `quiz-feedback ${hit ? "is-right" : "is-wrong"}`;
  quizFeedback.innerHTML = `
    <h3>${hit ? "选对了！方案 B 四秒即可扫齐核心费率与退票入口" : `你选了 ${chosen.label}（${chosen.verdict}），最抗漏读的是方案 B`}</h3>
    <p>${chosen.reason}</p>
    <div class="quiz-breakdown">
      ${QUIZ_DATA.options
        .map(
          (o) => `
          <div class="qb-item ${o.id === QUIZ_DATA.answer ? "is-ans" : ""}">
            <strong>${o.label} · ${o.verdict}</strong>
            <span>${o.reason}</span>
          </div>`
        )
        .join("")}
    </div>`;
}

quizGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-quiz]");
  if (!btn) return;
  pickedQuiz = btn.dataset.quiz;
  renderQuiz();
});
renderQuiz();

// ==================== 07 节：原海报放大灯箱（拖拽、缩放、Esc 关） ====================
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = false;
let lbSx = 0;
let lbSy = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  document.getElementById("lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = document.getElementById("poster").src;
  lbScale = 1.15;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport) {
    closeLightbox();
    return;
  }
  lbDrag = true;
  lbSx = e.clientX - lbTx;
  lbSy = e.clientY - lbTy;
  lbViewport.setPointerCapture(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbSx;
  lbTy = e.clientY - lbSy;
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => {
  lbDrag = false;
});
lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.7, Math.min(3, lbScale + (e.deltaY < 0 ? 0.15 : -0.15)));
  applyLbTransform();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化与自适应重绘 ====================
syncUI();
window.addEventListener("resize", () => {
  baseCacheKey = "";
  stageNeedsPaint = true;
  drawStage();
});
