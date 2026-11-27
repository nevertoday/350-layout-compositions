// 098 比例 PROPORTION — 开场「活体比例卡尺盘」2D Canvas 渲染与直接操控
// 1:1 承袭 098 原海报暖象牙制图纸、青绿三阶色块、2:3 琥珀金焦点与 T 端虚线工程卡尺。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { computeGeometry, evaluate, clamp, PHI } from "./model.js";

const PAL = {
  paper: "#FBF2E3",
  paperBright: "#FFF9EF",
  grid: "rgba(38, 125, 123, 0.08)",
  tealDeep: "#267D7B",
  tealDeepDark: "#195A58",
  tealMid: "#6EA19C",
  tealSage: "#95BBB3",
  tealPale: "#C9D7D0",
  tealPaleAlt: "#DCE6E0",
  amber: "#F0A63D",
  amberDeep: "#A6630C",
  ink: "#222423",
  inkSoft: "#4B524F",
  err: "#B9382C",
  errSoft: "rgba(185, 56, 44, 0.14)",
  ok: "#156E52",
  okSoft: "rgba(21, 110, 82, 0.14)",
  caliper: "#3E4745",
};

const FONT_NUM = '"Manrope", "Noto Sans SC", sans-serif';
const FONT_ZH = '"Noto Sans SC", sans-serif';

// 绘制原海报同款 T 端虚线工程卡尺
function drawCaliper(ctx, x1, y1, x2, y2, label, color, vertical = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.15;

  // 两端 T 杠
  const cap = 5;
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(x1 - cap, y1);
    ctx.lineTo(x1 + cap, y1);
    ctx.moveTo(x2 - cap, y2);
    ctx.lineTo(x2 + cap, y2);
  } else {
    ctx.moveTo(x1, y1 - cap);
    ctx.lineTo(x1, y1 + cap);
    ctx.moveTo(x2, y2 - cap);
    ctx.lineTo(x2, y2 + cap);
  }
  ctx.stroke();

  // 中段虚线
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 居中标注底纸 + 文字（保证不被虚线穿过）
  if (label) {
    ctx.font = `700 11.5px ${FONT_NUM}`;
    const tw = ctx.measureText(label).width;
    const mx = (x1 + x2) * 0.5;
    const my = (y1 + y2) * 0.5;
    if (vertical) {
      ctx.fillStyle = PAL.paperBright;
      ctx.fillRect(mx - tw * 0.5 - 4, my - 8, tw + 8, 16);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my);
    } else {
      ctx.fillStyle = PAL.paperBright;
      ctx.fillRect(mx - tw * 0.5 - 5, my - 8, tw + 10, 16);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my);
    }
  }
  ctx.restore();
}

function drawBadge(ctx, x, y, text, bg, fg = "#FFF9EF", align = "center") {
  ctx.save();
  ctx.font = `700 11px ${FONT_ZH}`;
  const padX = 7;
  const h = 21;
  const w = ctx.measureText(text).width + padX * 2;
  let rx = x - w * 0.5;
  if (align === "left") rx = x;
  else if (align === "right") rx = x - w;
  ctx.fillStyle = bg;
  ctx.fillRect(rx, y - h * 0.5, w, h);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, rx + w * 0.5, y + 0.5);
  ctx.restore();
  return { x: rx, y: y - h * 0.5, w, h };
}

export function mountHeroStage(canvas, getState, setState, onChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 860;
  let cssH = 440;
  let animIntro = 0; // 开场平滑入场，0..1
  let checkAnim = 0; // 对角相似检尺展开进度 0..1
  let hitZones = {};
  let hoverTarget = "";
  let dragMode = null; // "split" | "corner" | null
  let dragStart = null;
  let pointerId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = pixelRatio(window.innerWidth < 768 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const audit = evaluate(state);
    const geo = computeGeometry(state, cssW, cssH);

    // 开场入场动画（still 为 true 时直达终点）
    if (still) {
      animIntro = 1;
      checkAnim = state.showCheck ? 1 : 0;
    } else {
      animIntro = Math.min(1, animIntro + (dt || 0.016) * 2.2);
      const targetCheck = state.showCheck ? 1 : 0;
      checkAnim += (targetCheck - checkAnim) * Math.min(1, (dt || 0.016) * 9);
      if (Math.abs(targetCheck - checkAnim) < 0.005) checkAnim = targetCheck;
    }

    const dpr = canvas.width / Math.max(1, cssW);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 制图纸底色 + 细腻建筑网格
    ctx.fillStyle = PAL.paperBright;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = PAL.grid;
    ctx.lineWidth = 1;
    const step = 24;
    ctx.beginPath();
    for (let x = 0.5; x < cssW; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
    }
    for (let y = 0.5; y < cssH; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
    }
    ctx.stroke();

    // 顶部细微工程状态标头（单真源数字）
    const { frame, inner, major, minor, circle, accent, sub, panel, bars, metrics } = geo;
    const hl = state.highlightProbe;

    ctx.fillStyle = PAL.inkSoft;
    ctx.font = `700 11px ${FONT_NUM}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudLeft = `FRAME ${metrics.frameAspect.toFixed(2)}:1  ·  SPLIT ${metrics.partRatio.toFixed(2)}:1  ·  STEP ${metrics.rhythmStep.toFixed(2)}×`;
    ctx.fillText(hudLeft, 14, 11);

    // 右上单真源通过/错态印章
    const tagBg = audit.verdict.ok ? PAL.ok : PAL.err;
    drawBadge(ctx, cssW - 14, 18, audit.verdict.tag, tagBg, "#FFF9EF", "right");

    // 2. 外框制图纸座（带呼吸留白区提示）
    const ease = 1 - Math.pow(1 - animIntro, 3);
    // 外框底色（原海报暖纸内框）
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

    // 留白呼吸区域状态高亮（若边距窒息或选中尺寸探针）
    const marginBad = metrics.marginRatio < 0.052;
    if (marginBad || hl === "size") {
      ctx.fillStyle = marginBad ? PAL.errSoft : "rgba(38, 125, 123, 0.14)";
      ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
      ctx.fillStyle = PAL.paper;
      ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    }

    // 外框描边
    const frameBad = !audit.probes.harmony.ok;
    ctx.strokeStyle = frameBad ? PAL.err : (hl === "harmony" ? PAL.amber : PAL.ink);
    ctx.lineWidth = frameBad || hl === "harmony" ? 2 : 1.25;
    if (frameBad) ctx.setLineDash([6, 4]);
    ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
    ctx.setLineDash([]);

    // 3. 主区与次区内容（随三套语境绘制，但几何完全复用同一套 major/minor/accent）
    const drawMajorW = major.w * (0.35 + 0.65 * ease);
    if (state.context === "poster") {
      // 原海报几何构成：深青主块 + 淡青次区 + 灰青内切圆 + 琥珀金锚点
      ctx.fillStyle = PAL.tealDeep;
      ctx.fillRect(major.x, major.y, drawMajorW, major.h);

      // 主块内原海报比例角线与微标
      ctx.fillStyle = "rgba(251, 242, 227, 0.88)";
      ctx.font = `700 12px ${FONT_NUM}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`MAJOR  ${Math.round(metrics.majorShare * 100)}%`, major.x + 12, major.y + 12);
      ctx.font = `400 11px ${FONT_ZH}`;
      ctx.fillStyle = "rgba(251, 242, 227, 0.78)";
      ctx.fillText(`长 : 宽 ≈ ${metrics.frameAspect.toFixed(2)} : 1`, major.x + 12, major.y + 30);

      // 主块内弧线（致敬原海报螺旋弧）
      ctx.save();
      ctx.beginPath();
      ctx.rect(major.x, major.y, drawMajorW, major.h);
      ctx.clip();
      ctx.strokeStyle = "rgba(251, 242, 227, 0.32)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(major.x + major.w, major.y + major.h, Math.min(major.w, major.h) * 0.96, Math.PI, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();

      // 次区淡青底 + 原海报同款灰青内切圆
      ctx.fillStyle = PAL.tealPale;
      ctx.fillRect(minor.x, minor.y, minor.w, minor.h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(minor.x, minor.y, minor.w, minor.h);
      ctx.clip();
      ctx.fillStyle = PAL.tealSage;
      ctx.beginPath();
      ctx.arc(circle.cx, circle.cy, Math.max(4, circle.r), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PAL.tealDeep;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    } else if (state.context === "book") {
      // 书籍跨页语境：左页大画幅版心 + 右页排版文字栏与书眉
      ctx.fillStyle = PAL.tealMid;
      ctx.fillRect(major.x, major.y, drawMajorW, major.h);

      // 书页装订中缝阴影
      ctx.fillStyle = "rgba(34, 36, 35, 0.14)";
      ctx.fillRect(major.x + drawMajorW - 8, major.y, 8, major.h);

      // 左页插图建筑拱门几何（致敬帕拉第奥）
      ctx.save();
      ctx.beginPath();
      ctx.rect(major.x, major.y, drawMajorW, major.h);
      ctx.clip();
      const pad = Math.min(major.w, major.h) * 0.12;
      ctx.fillStyle = PAL.tealDeep;
      ctx.fillRect(major.x + pad, major.y + pad, Math.max(8, major.w - pad * 2), Math.max(8, major.h - pad * 2));
      ctx.fillStyle = PAL.paper;
      ctx.font = `700 11px ${FONT_NUM}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`FOLIO · ${metrics.frameAspect.toFixed(2)}:1`, major.x + pad + 10, major.y + pad + 10);
      ctx.restore();

      // 右页纸面 + 按 rhythm 排布的章节标题与正文行
      ctx.fillStyle = "#FDF8EE";
      ctx.fillRect(minor.x, minor.y, minor.w, minor.h);
      ctx.strokeStyle = "rgba(38, 125, 123, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(minor.x, minor.y, minor.w, minor.h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(minor.x + 8, minor.y + 8, Math.max(4, minor.w - 16), Math.max(4, minor.h - 16));
      ctx.clip();
      const lh = Math.max(5, Math.min(11, minor.h * 0.055));
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(minor.x + 12, minor.y + 14, Math.max(12, minor.w * 0.56), lh * Math.min(2.1, metrics.rhythmStep));
      ctx.fillStyle = PAL.tealDeep;
      ctx.fillRect(minor.x + 12, minor.y + 14 + lh * 2.4, Math.max(10, minor.w * 0.36), Math.max(3, lh * 0.65));
      ctx.fillStyle = "rgba(52, 56, 54, 0.36)";
      for (let i = 0; i < 6; i++) {
        const y = minor.y + 18 + lh * 3.8 + i * (lh * 1.45);
        if (y > minor.y + minor.h - 24) break;
        const lw = i === 5 ? 0.45 : (0.72 + (i % 2) * 0.12);
        ctx.fillRect(minor.x + 12, y, Math.max(8, (minor.w - 24) * lw), Math.max(2.5, lh * 0.48));
      }
      ctx.restore();
    } else {
      // 界面卡片语境：左侧头图主视觉 + 右侧标题、摘要与琥珀主按钮
      ctx.fillStyle = PAL.tealDeep;
      ctx.fillRect(major.x, major.y, drawMajorW, major.h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(major.x, major.y, drawMajorW, major.h);
      ctx.clip();
      // 几何山形预览
      ctx.fillStyle = PAL.tealMid;
      ctx.beginPath();
      ctx.moveTo(major.x, major.y + major.h);
      ctx.lineTo(major.x + major.w * 0.38, major.y + major.h * 0.42);
      ctx.lineTo(major.x + major.w * 0.72, major.y + major.h * 0.76);
      ctx.lineTo(major.x + major.w, major.y + major.h * 0.5);
      ctx.lineTo(major.x + major.w, major.y + major.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PAL.paperBright;
      ctx.font = `700 11px ${FONT_NUM}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`MEDIA ${Math.round(metrics.majorShare * 100)}%`, major.x + 12, major.y + 12);
      ctx.restore();

      // 右侧 UI 信息区
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(minor.x, minor.y, minor.w, minor.h);
      ctx.strokeStyle = "rgba(34, 36, 35, 0.16)";
      ctx.strokeRect(minor.x, minor.y, minor.w, minor.h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(minor.x + 8, minor.y + 8, Math.max(4, minor.w - 16), Math.max(4, minor.h - 16));
      ctx.clip();
      ctx.fillStyle = PAL.tealDeep;
      ctx.fillRect(minor.x + 12, minor.y + 14, Math.min(48, minor.w * 0.35), 6);
      ctx.fillStyle = PAL.ink;
      const headH = clamp(9 * metrics.rhythmStep, 9, 20);
      ctx.fillRect(minor.x + 12, minor.y + 28, Math.max(12, minor.w * 0.68), headH);
      ctx.fillStyle = "rgba(52, 56, 54, 0.34)";
      ctx.fillRect(minor.x + 12, minor.y + 36 + headH, Math.max(10, minor.w * 0.78), 5);
      ctx.fillRect(minor.x + 12, minor.y + 46 + headH, Math.max(10, minor.w * 0.58), 5);
      ctx.restore();
    }

    // 4. 主块右下角嵌套子模块（检验「局部与整体统一」）
    const sysOk = audit.probes.unity.ok;
    ctx.save();
    ctx.fillStyle = sysOk ? PAL.tealSage : "rgba(185, 56, 44, 0.22)";
    ctx.fillRect(sub.x, sub.y, sub.w, sub.h);
    ctx.strokeStyle = sysOk ? PAL.paperBright : PAL.err;
    ctx.lineWidth = sysOk ? 1.5 : 1.8;
    if (!sysOk) ctx.setLineDash([4, 3]);
    ctx.strokeRect(sub.x, sub.y, sub.w, sub.h);
    ctx.setLineDash([]);
    if (sub.w > 44 && sub.h > 26) {
      if (sysOk) {
        ctx.fillStyle = PAL.ink;
        ctx.font = `700 10.5px ${FONT_ZH}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("同尺嵌套", sub.x + sub.w * 0.5, sub.y + sub.h * 0.5);
      } else {
        drawBadge(ctx, sub.x + sub.w * 0.5, sub.y + sub.h * 0.5, "点锁统一", PAL.err, "#FFF9EF", "center");
      }
    }
    ctx.restore();
    hitZones.sub = { x: sub.x, y: sub.y, w: sub.w, h: sub.h };

    // 5. 次区唯一暖点睛：原海报 2:3 琥珀金焦点（可直点校准尺度）
    const accentBad = metrics.accentFill > 0.68 || metrics.accentFill < 0.16;
    ctx.save();
    ctx.beginPath();
    ctx.rect(minor.x, minor.y, minor.w, minor.h);
    ctx.clip();
    const acCy = state.context === "poster" ? minor.y + minor.h * 0.5 : minor.y + minor.h - Math.max(accent.r + 10, minor.h * 0.24);
    const acR = Math.max(6, accent.r * (state.context === "poster" ? 0.92 : 0.72));
    ctx.fillStyle = PAL.amber;
    ctx.beginPath();
    ctx.arc(accent.cx, acCy, acR, 0, Math.PI * 2);
    ctx.fill();
    if (accentBad || hl === "size") {
      ctx.strokeStyle = accentBad ? PAL.err : PAL.ink;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(accent.cx, acCy, acR + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    hitZones.accent = { cx: accent.cx, cy: acCy, r: Math.max(20, acR + 8) };

    // 6. 竖向活动卡尺刀刃（可直接左右拖）
    const relOk = audit.probes.relationship.ok;
    const bladeColor = !relOk ? PAL.err : (hoverTarget === "split" || dragMode === "split" ? PAL.amber : PAL.ink);
    ctx.save();
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = dragMode === "split" || hoverTarget === "split" ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.moveTo(geo.bladeX, frame.y - 6);
    ctx.lineTo(geo.bladeX, frame.y + frame.h + 6);
    ctx.stroke();

    // 卡尺中间抓握块（建筑工程游标）
    const gripW = 18;
    const gripH = 32;
    const gx = geo.bladeX - gripW * 0.5;
    const gy = inner.y + inner.h * 0.5 - gripH * 0.5;
    ctx.fillStyle = bladeColor;
    ctx.fillRect(gx, gy, gripW, gripH);
    ctx.strokeStyle = PAL.paperBright;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(geo.bladeX - 3, gy + 9);
    ctx.lineTo(geo.bladeX - 3, gy + gripH - 9);
    ctx.moveTo(geo.bladeX + 3, gy + 9);
    ctx.lineTo(geo.bladeX + 3, gy + gripH - 9);
    ctx.stroke();
    ctx.restore();
    hitZones.blade = { x: geo.bladeX - 24, y: frame.y - 10, w: 48, h: frame.h + 20 };

    // 右下角画幅角柄（拖拉改外框比例）
    const ch = geo.handles.corner;
    const cColor = frameBad ? PAL.err : (hoverTarget === "corner" || dragMode === "corner" ? PAL.amber : PAL.tealDeep);
    ctx.save();
    ctx.strokeStyle = cColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ch.x - 14, ch.y + 4);
    ctx.lineTo(ch.x + 4, ch.y + 4);
    ctx.lineTo(ch.x + 4, ch.y - 14);
    ctx.stroke();
    ctx.fillStyle = cColor;
    ctx.fillRect(ch.x - 3, ch.y - 3, 9, 9);
    ctx.restore();
    hitZones.corner = { x: ch.x - 22, y: ch.y - 22, w: 44, h: 44 };

    // 7. 原海报同款 T 端虚线卡尺（顶部标主:次比，左侧标单位 1）
    const topCalY = frame.y - 16;
    const majorRatioNum = metrics.partRatio.toFixed(metrics.partRatio >= 10 ? 1 : 2);
    drawCaliper(ctx, major.x, topCalY, major.x + major.w, topCalY, majorRatioNum, !relOk ? PAL.err : PAL.tealDeepDark, false);
    drawCaliper(ctx, minor.x, topCalY, minor.x + minor.w, topCalY, "1", PAL.caliper, false);
    drawCaliper(ctx, frame.x - 16, frame.y, frame.x - 16, frame.y + frame.h, "1", PAL.caliper, true);

    // 8. Space 展开的「对角线相似检尺」（验证局部是否与整体共享斜率）
    if (checkAnim > 0.01) {
      ctx.save();
      ctx.globalAlpha = checkAnim;
      // 外框主对角线
      ctx.strokeStyle = PAL.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(frame.x, frame.y + frame.h);
      ctx.lineTo(frame.x + frame.w * checkAnim, frame.y + frame.h * (1 - checkAnim));
      ctx.stroke();

      // 主块与子块对角线对比
      ctx.strokeStyle = sysOk ? PAL.ok : PAL.err;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(sub.x, sub.y + sub.h);
      ctx.lineTo(sub.x + sub.w * checkAnim, sub.y + sub.h * (1 - checkAnim));
      ctx.stroke();
      ctx.setLineDash([]);

      // 黄金/相似垂线参考
      const rx = frame.x + frame.w;
      const ry = frame.y + frame.h;
      const perpLen = Math.min(frame.w, frame.h) * 0.55 * checkAnim;
      const ang = Math.atan2(-frame.h, frame.w) - Math.PI * 0.5;
      ctx.strokeStyle = "rgba(240, 166, 61, 0.72)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(frame.x + frame.w * (1 - state.split), frame.y);
      ctx.lineTo(frame.x + frame.w * (1 - state.split) + Math.cos(ang) * perpLen, frame.y + Math.sin(ang) * perpLen);
      ctx.stroke();

      drawBadge(
        ctx,
        frame.x + frame.w * 0.5,
        frame.y + 16,
        sysOk ? "对角检尺：局部与整体共享比例家族 ✓" : "对角检尺：局部斜率与外框脱节 ×",
        sysOk ? PAL.ok : PAL.err
      );
      ctx.restore();
    }

    // 9. 右侧（或底部）三级节奏阶梯与统一比对板（点击可步进节奏级差）
    const rOk = audit.probes.rhythm.ok;
    ctx.save();
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = !rOk ? PAL.err : (hl === "rhythm" ? PAL.amber : "rgba(38, 125, 123, 0.32)");
    ctx.lineWidth = !rOk || hl === "rhythm" ? 1.8 : 1;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    const pPad = geo.compact ? 8 : 12;
    ctx.fillStyle = !rOk ? PAL.err : PAL.tealDeepDark;
    ctx.font = `700 11px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `三级节奏 · ${metrics.rhythmStep.toFixed(2)}×${!rOk ? "（点此调拍）" : ""}`,
      panel.x + pPad,
      panel.y + (geo.compact ? 7 : 10)
    );

    const labels = ["主阶 1", "次阶 2", "辅阶 3"];
    const barColors = [PAL.ink, PAL.tealDeep, PAL.tealSage];
    if (geo.compact) {
      // 手机端：横向紧凑三阶比例条
      const rowY = panel.y + 26;
      const maxBarW = panel.w - pPad * 2 - 54;
      for (let i = 0; i < 3; i++) {
        const y = rowY + i * 16;
        const bw = Math.max(14, maxBarW * bars[i]);
        ctx.fillStyle = barColors[i];
        ctx.fillRect(panel.x + pPad + 48, y + 2, bw, 10);
        ctx.fillStyle = PAL.inkSoft;
        ctx.font = `600 10.5px ${FONT_ZH}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(labels[i], panel.x + pPad, y + 1);
      }
    } else {
      // 桌面端：致敬原海报「节奏」图标的竖排比例叠块 + 实时比值说明
      const areaTop = panel.y + 34;
      const areaH = panel.h - 86;
      const maxW = panel.w - pPad * 2;
      const sum = bars[0] + bars[1] + bars[2];
      let cy = areaTop;
      for (let i = 0; i < 3; i++) {
        const bh = Math.max(14, (bars[i] / sum) * (areaH - 18));
        const bw = Math.max(26, maxW * bars[i]);
        ctx.fillStyle = barColors[i];
        ctx.fillRect(panel.x + pPad, cy, bw, bh);
        ctx.fillStyle = i < 2 ? "#FFF9EF" : PAL.ink;
        ctx.font = `700 10.5px ${FONT_NUM}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        if (bw > 56) {
          ctx.fillText(`${labels[i]} · ${(bars[i] * 100).toFixed(0)}%`, panel.x + pPad + 8, cy + bh * 0.5);
        }
        cy += bh + 8;
      }

      // 底部统一比对摘要
      const footY = panel.y + panel.h - 40;
      ctx.strokeStyle = "rgba(38, 125, 123, 0.2)";
      ctx.beginPath();
      ctx.moveTo(panel.x + pPad, footY - 4);
      ctx.lineTo(panel.x + panel.w - pPad, footY - 4);
      ctx.stroke();

      ctx.fillStyle = sysOk ? PAL.tealDeepDark : PAL.err;
      ctx.font = `700 11px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(sysOk ? "系统统一 · 共用尺标" : `系统偏离 ${audit.unityDriftPct}%`, panel.x + pPad, footY + 2);
      ctx.fillStyle = PAL.inkSoft;
      ctx.font = `400 10.5px ${FONT_NUM}`;
      ctx.fillText(`PHI ${PHI.toFixed(3)} · NOW ${metrics.frameAspect.toFixed(2)}`, panel.x + pPad, footY + 18);
    }
    ctx.restore();
    hitZones.rhythm = { x: panel.x, y: panel.y, w: panel.w, h: panel.h };

    // 10. 画布内直接纠错提示签（仅在失序且空间足够时浮现，避免画面拥挤）
    if (!relOk && !geo.compact) {
      drawBadge(ctx, geo.bladeX, frame.y + frame.h + 15, "← 横拖卡尺拉开主次 →", PAL.err);
    } else if (accentBad && frame.w >= 210) {
      drawBadge(ctx, accent.cx, Math.max(minor.y + 18, acCy - acR - 14), "点此调琥珀焦点", PAL.err);
    }
  }

  const ctrl = loop(canvas, renderFrame);

  // 命中检测辅助
  function getPt(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  const inRect = (p, box) => box && p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
  const inCirc = (p, c) => c && Math.hypot(p.x - c.cx, p.y - c.cy) <= c.r;

  function beginDrag(pt) {
    const state = getState();
    const geo = computeGeometry(state, cssW, cssH);
    if (inRect(pt, hitZones.corner)) {
      dragMode = "corner";
      dragStart = { pt, aspect: state.frameAspect, split: state.split, geo, moved: false };
    } else {
      dragMode = "split";
      dragStart = { pt, aspect: state.frameAspect, split: state.split, geo, moved: false };
    }
  }

  function moveDrag(pt) {
    if (!dragMode || !dragStart) return;
    const dx = pt.x - dragStart.pt.x;
    const dy = pt.y - dragStart.pt.y;
    if (Math.hypot(dx, dy) > 4) dragStart.moved = true;
    const state = getState();
    if (dragMode === "corner") {
      const nextAspect = clamp(dragStart.aspect + dx / 220 - dy / 340, 0.85, 2.5);
      // 轻吸附经典比例（方便手感停在 1.00 / 1.333 / 1.50 / 1.618）
      let snapped = nextAspect;
      for (const target of [1.0, 1.25, 4 / 3, Math.SQRT2, 1.5, 1.6, PHI]) {
        if (Math.abs(nextAspect - target) < 0.022) {
          snapped = target;
          break;
        }
      }
      setState({ frameAspect: snapped });
    } else {
      const innerW = Math.max(120, dragStart.geo.inner.w);
      const nextSplit = clamp(dragStart.split + dx / innerW, 0.34, 0.88);
      // 靠近 0.618 (φ) 或 0.60 (3:2) 或 0.667 (2:1) 轻柔吸附
      let snapped = nextSplit;
      for (const target of [0.571, 0.6, 1 / PHI, 0.667]) {
        if (Math.abs(nextSplit - target) < 0.008) {
          snapped = target;
          break;
        }
      }
      setState({ split: snapped });
    }
    if (reducedMotion.matches) ctrl.draw();
    onChange();
  }

  function endDrag(pt) {
    if (dragStart && !dragStart.moved && pt) {
      // 短按直点交互：点琥珀焦点、点嵌套子块、点节奏阶梯
      const state = getState();
      if (inCirc(pt, hitZones.accent)) {
        const nextScale = state.accentScale > 0.62 || state.accentScale < 0.2 ? 0.42 : (state.accentScale < 0.45 ? 0.52 : 0.34);
        setState({ accentScale: nextScale, marginPct: Math.max(state.marginPct, 0.085) });
        ctrl.draw();
        onChange();
      } else if (inRect(pt, hitZones.sub)) {
        setState({ unified: !state.unified });
        ctrl.draw();
        onChange();
      } else if (inRect(pt, hitZones.rhythm)) {
        const ladder = [1.25, 1.333, 1.414, 1.5, PHI];
        const cur = state.rhythm;
        const next = ladder.find((v) => v > cur + 0.04) || ladder[0];
        setState({ rhythm: next });
        ctrl.draw();
        onChange();
      }
    }
    dragMode = null;
    dragStart = null;
  }

  // Pointer events（支持鼠标与笔）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch 走下方专用逻辑以兼容 perf.mjs 的 dispatchTouchEvent
    pointerId = e.pointerId;
    canvas.setPointerCapture(pointerId);
    beginDrag(getPt(e));
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = getPt(e);
    if (dragMode) {
      moveDrag(pt);
    } else {
      if (inRect(pt, hitZones.corner)) {
        hoverTarget = "corner";
        canvas.style.cursor = "nwse-resize";
      } else if (inRect(pt, hitZones.blade)) {
        hoverTarget = "split";
        canvas.style.cursor = "ew-resize";
      } else if (inCirc(pt, hitZones.accent) || inRect(pt, hitZones.sub) || inRect(pt, hitZones.rhythm)) {
        hoverTarget = "click";
        canvas.style.cursor = "pointer";
      } else {
        hoverTarget = "";
        canvas.style.cursor = "ew-resize";
      }
    }
  });

  const stopPointer = (e) => {
    if (e.pointerType === "touch") return;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
    pointerId = null;
    endDrag(getPt(e));
  };
  canvas.addEventListener("pointerup", stopPointer);
  canvas.addEventListener("pointercancel", stopPointer);

  // Touch events：明确只锁定横向拖动（纵向自然滚页），同时完全响应 perf.mjs 的 touchStart/touchMove
  let touchAxis = null;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    touchAxis = null;
    beginDrag(getPt(e));
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length || !dragStart) return;
    const pt = getPt(e);
    if (!touchAxis) {
      const dx = Math.abs(pt.x - dragStart.pt.x);
      const dy = Math.abs(pt.y - dragStart.pt.y);
      if (dx > 4 || dy > 4) touchAxis = dx >= dy ? "x" : "y";
    }
    if (touchAxis === "x") {
      e.preventDefault();
      moveDrag(pt);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    endDrag(dragStart ? dragStart.pt : null);
    touchAxis = null;
  }, { passive: true });

  // 键盘精细操控
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    let handled = true;
    if (e.key === "ArrowRight" && !e.shiftKey) {
      setState({ split: clamp(state.split + 0.02, 0.34, 0.88) });
    } else if (e.key === "ArrowLeft" && !e.shiftKey) {
      setState({ split: clamp(state.split - 0.02, 0.34, 0.88) });
    } else if (e.key === "ArrowUp") {
      setState({ frameAspect: clamp(state.frameAspect + 0.05, 0.85, 2.5) });
    } else if (e.key === "ArrowDown") {
      setState({ frameAspect: clamp(state.frameAspect - 0.05, 0.85, 2.5) });
    } else if (e.key === "ArrowRight" && e.shiftKey) {
      setState({ rhythm: clamp(state.rhythm + 0.08, 1.02, 3.1) });
    } else if (e.key === "ArrowLeft" && e.shiftKey) {
      setState({ rhythm: clamp(state.rhythm - 0.08, 1.02, 3.1) });
    } else if (e.key === " " || e.code === "Space") {
      setState({ showCheck: !state.showCheck });
    } else if (e.key === "u" || e.key === "U") {
      setState({ unified: !state.unified });
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      ctrl.draw();
      onChange();
    }
  });

  window.addEventListener("resize", () => ctrl.draw());

  return {
    draw: () => ctrl.draw(),
  };
}
