// 245 居中器 CENTERER · 活体居中器视口伸缩台 (2D Canvas)
// 1:1 承袭原海报腮红暖纸、深松翠绿方框、柔粉圆心、白刻线、X/Y 珊瑚虚线标尺与四组珊瑚点阵。
// 交互：横向直拖画布平滑伸缩模拟视口宽度（320–1320px），纵拖底沿调视口高度，直点红标快捷修复。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  VIEWPORT_MIN_W,
  VIEWPORT_MAX_W,
  VIEWPORT_MIN_H,
  VIEWPORT_MAX_H,
  clamp,
  viewportTag,
} from "./model.js";

const COL = {
  bg: "#FEECE7",
  paperLight: "#FFF8F5",
  forest: "#00452B",
  forestDot: "#034C33",
  forestSoft: "rgba(0, 69, 43, 0.08)",
  sageGutter: "rgba(0, 69, 43, 0.13)",
  coral: "#EE6367",
  coralInk: "#B52A30",
  coralWing: "rgba(238, 99, 103, 0.11)",
  salmon: "#F89194",
  peach: "#F69998",
  axis: "#DF8B8E",
  ink: "#0B120F",
  muted: "#574744",
  rule: "#D1CAC6",
  err: "#B81D24",
  errFill: "rgba(184, 29, 36, 0.13)",
  white: "#FFFDFC",
};

const ARTICLE_LINES_TEXT =
  "居中器不是把整段文字都强行居中，而是给长文定出舒适的行宽上限，再让左右自动余白把版心稳稳托在视觉焦点上。无论屏幕拉到一千四百像素还是缩到三百六十像素手机，左侧阅读锚线始终笔直清晰，内护边则牢牢守住屏壁呼吸感，不会贴边窒息。";

export function createAxialStage(canvas, { getModel, onMutate }) {
  const ctx = canvas.getContext("2d");
  let w = 960;
  let h = 420;
  let dpr = pixelRatio(2);

  // 平滑视觉插值（减少动态效果 still 时一步到位）
  let animIntro = 0;
  let dispVpW = null;
  let dispVpH = null;
  let dispOuterW = null;
  let dispContentW = null;
  let dispBoxTop = null;

  // 供点击命中的热区
  let hotspots = [];
  let vpRect = { x: 0, y: 0, w: 0, h: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(2);
    w = rect.width;
    h = rect.height;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function drawHatch(x, y, rw, rh, color, step = 9) {
    if (rw <= 1 || rh <= 1) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, rw, rh);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    for (let d = -rh; d < rw + rh; d += step) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d - rh, y + rh);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDotGrid(cx, cy, cols, rows, gap, radius, color) {
    const totalW = (cols - 1) * gap;
    const totalH = (rows - 1) * gap;
    const sx = cx - totalW / 2;
    const sy = cy - totalH / 2;
    ctx.fillStyle = color;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.arc(sx + c * gap, sy + r * gap, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawArrowHead(x, y, dir, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (dir === "left") {
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y - size * 0.62);
      ctx.lineTo(x + size, y + size * 0.62);
    } else if (dir === "right") {
      ctx.moveTo(x, y);
      ctx.lineTo(x - size, y - size * 0.62);
      ctx.lineTo(x - size, y + size * 0.62);
    } else if (dir === "down") {
      ctx.moveTo(x, y);
      ctx.lineTo(x - size * 0.62, y - size);
      ctx.lineTo(x + size * 0.62, y - size);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawPill(x, y, text, { bg, fg, border, fontSize = 11.5, align = "center" }) {
    ctx.font = `700 ${fontSize}px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
    const padX = 9;
    const bh = fontSize + 10;
    const bw = ctx.measureText(text).width + padX * 2;
    const bx = align === "center" ? x - bw / 2 : align === "right" ? x - bw : x;
    const by = y - bh / 2;
    ctx.fillStyle = bg;
    ctx.fillRect(bx, by, bw, bh);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.25;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
    return { x: bx, y: by, w: bw, h: bh };
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const m = getModel();
    const compact = w < 560;

    if (still) {
      animIntro = 1;
      dispVpW = m.state.viewportW;
      dispVpH = m.state.viewportH;
      dispOuterW = m.cur.outerW;
      dispContentW = m.cur.contentW;
      dispBoxTop = m.boxTop;
    } else {
      animIntro = Math.min(1, animIntro + (dt || 0.016) * 2.2);
      const ease = 1 - Math.exp(-(dt || 0.016) * 16);
      dispVpW = dispVpW == null ? m.state.viewportW : dispVpW + (m.state.viewportW - dispVpW) * ease;
      dispVpH = dispVpH == null ? m.state.viewportH : dispVpH + (m.state.viewportH - dispVpH) * ease;
      dispOuterW = dispOuterW == null ? m.cur.outerW : dispOuterW + (m.cur.outerW - dispOuterW) * ease;
      dispContentW = dispContentW == null ? m.cur.contentW : dispContentW + (m.cur.contentW - dispContentW) * ease;
      dispBoxTop = dispBoxTop == null ? m.boxTop : dispBoxTop + (m.boxTop - dispBoxTop) * ease;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1. 原海报腮红暖纸底色
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const topBand = compact ? 36 : 40;
    const botBand = compact ? 34 : 38;
    const sidePad = compact ? 22 : 76;
    const availW = Math.max(220, w - sidePad * 2);
    const availH = Math.max(150, h - topBand - botBand);

    // 视口映射比例：1320px -> availW
    const scaleX = availW / VIEWPORT_MAX_W;
    const scaleY = Math.min(scaleX * 1.15, (availH - 20) / VIEWPORT_MAX_H);
    const vpDrawW = clamp(dispVpW * scaleX, 110, availW);
    const vpDrawH = clamp(dispVpH * scaleY, 108, availH - 16);
    const vpX = cx - vpDrawW / 2;
    const vpY = topBand + (availH - vpDrawH) / 2 + 2;
    const cy = vpY + vpDrawH / 2;
    vpRect = { x: vpX, y: vpY, w: vpDrawW, h: vpDrawH };

    // 2. 原海报签名 X 轴 & Y 轴虚线标尺 + 外向三角箭头 + 珊瑚圆点
    const introEase = 1 - Math.pow(1 - animIntro, 3);
    ctx.save();
    ctx.strokeStyle = COL.axis;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 5]);
    // X轴横贯全幅
    const xLineHalf = (w / 2 - 14) * introEase;
    ctx.beginPath();
    ctx.moveTo(cx - xLineHalf, cy);
    ctx.lineTo(cx + xLineHalf, cy);
    ctx.stroke();
    // Y轴纵贯全幅
    const yTopEnd = 10;
    const yBotEnd = h - 12;
    ctx.beginPath();
    ctx.moveTo(cx, yTopEnd);
    ctx.lineTo(cx, yTopEnd + (yBotEnd - yTopEnd) * introEase);
    ctx.stroke();
    ctx.setLineDash([]);

    // 外向箭头与原海报轴上珊瑚圆点（每个圆点独立 beginPath 防止连线填充）
    drawArrowHead(10, cy, "left", 7, COL.coral);
    drawArrowHead(w - 10, cy, "right", 7, COL.coral);
    drawArrowHead(cx, h - 8, "down", 7, COL.coral);

    const drawCoralDot = (dx, dy, r = 4.5) => {
      ctx.fillStyle = COL.coral;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    if (!compact) {
      const leftDotX = Math.max(28, vpX * 0.45);
      const rightDotX = Math.min(w - 28, vpX + vpDrawW + (w - (vpX + vpDrawW)) * 0.55);
      drawCoralDot(leftDotX, cy, 4.5);
      drawCoralDot(rightDotX, cy, 4.5);
      drawCoralDot(cx, 17, 4.5);
      drawCoralDot(cx, h - 19, 4.5);

      ctx.fillStyle = COL.coralInk;
      ctx.font = `700 11px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Y轴", cx + 10, 17);
      ctx.fillText("中心点", cx + 10, h - 19);
      ctx.textAlign = "center";
      ctx.fillText("X轴", leftDotX, cy - 14);

      // 四组原海报标志性珊瑚点阵（视口外侧足够空时显出）
      if (vpX > 66) {
        drawDotGrid(vpX - 28, cy, 4, 4, 8, 1.8, COL.coral);
        drawDotGrid(vpX + vpDrawW + 28, cy, 4, 4, 8, 1.8, COL.coral);
      }
      if (vpY > 44) {
        drawDotGrid(cx, vpY - 18, 4, 2, 10, 1.7, COL.coral);
      }
    } else {
      drawCoralDot(cx, 13, 3.5);
      drawCoralDot(cx, h - 14, 3.5);
    }
    ctx.restore();

    // 3. 模拟浏览器视口外框（洁亮暖纸底，代表真实屏幕窗口）
    ctx.fillStyle = COL.paperLight;
    ctx.fillRect(vpX, vpY, vpDrawW, vpDrawH);

    // 4. 计算居中器盒子在模拟视口内的真实坐标
    const boxScaleX = vpDrawW / dispVpW;
    const boxScaleY = vpDrawH / dispVpH;
    const outerDrawW = clamp(dispOuterW * boxScaleX, 46, vpDrawW);
    const gutterDraw = m.state.gutter * boxScaleX;
    const contentDrawW = Math.max(24, outerDrawW - gutterDraw * 2);
    const outerX = cx - outerDrawW / 2;
    const contentX = outerX + gutterDraw;
    const contentDrawH = m.contentH * boxScaleY;
    const boxY = vpY + dispBoxTop * boxScaleY;

    // 4a. 左右自动余白带（margin-inline: auto）或定边距撞车红纹
    const wingW = Math.max(0, outerX - vpX);
    if (m.state.xMode === "fixed-margin" && m.cur.overflowPx > 0) {
      ctx.fillStyle = COL.errFill;
      ctx.fillRect(vpX, vpY, vpDrawW, vpDrawH);
      drawHatch(vpX, vpY, vpDrawW, vpDrawH, "rgba(184,29,36,0.22)", 10);
    } else if (wingW > 2) {
      ctx.fillStyle = COL.coralWing;
      ctx.fillRect(vpX, vpY, wingW, vpDrawH);
      ctx.fillRect(outerX + outerDrawW, vpY, wingW, vpDrawH);
      // 水平标尺箭头与 auto px 读数
      if (wingW > 42) {
        const ly = vpY + 18;
        ctx.strokeStyle = COL.coralInk;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vpX + 4, ly);
        ctx.lineTo(outerX - 4, ly);
        ctx.moveTo(outerX + outerDrawW + 4, ly);
        ctx.lineTo(vpX + vpDrawW - 4, ly);
        ctx.stroke();

        ctx.fillStyle = COL.coralInk;
        ctx.font = `700 10.5px "Space Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const mLabel = m.state.xMode === "fixed-margin" ? `固定 ${Math.round(m.cur.marginEach)}` : `auto ${Math.round(m.cur.marginEach)}`;
        ctx.fillText(mLabel, vpX + wingW / 2, ly - 3);
        ctx.fillText(mLabel, outerX + outerDrawW + wingW / 2, ly - 3);
      }
    }

    // 4b. 内护边 padding-inline 安全带（在居中器外框内侧）
    if (gutterDraw > 1.5) {
      ctx.fillStyle = COL.sageGutter;
      ctx.fillRect(outerX, vpY, gutterDraw, vpDrawH);
      ctx.fillRect(outerX + outerDrawW - gutterDraw, vpY, gutterDraw, vpDrawH);
    } else if (m.state.gutter < 12 && wingW < 6) {
      // 窄屏贴壁红警边
      ctx.fillStyle = "rgba(184, 29, 36, 0.28)";
      ctx.fillRect(vpX, vpY, 5, vpDrawH);
      ctx.fillRect(vpX + vpDrawW - 5, vpY, 5, vpDrawH);
    }

    // 5. 剪裁至视口内部绘制居中器实体 + 视口上方若发生 unsafe 溢出则用透视警示层露出被吞掉的顶边！
    const drawCentererSubject = (clipToViewport) => {
      ctx.save();
      if (clipToViewport) {
        ctx.beginPath();
        ctx.rect(vpX, vpY, vpDrawW, vpDrawH);
        ctx.clip();
      }

      const frameStroke = compact ? 3.5 : 4.5;
      const boxFill = m.state.scene === "poster" ? "#FFFDFB" : "#FFFFFF";

      // 深松翠绿外框（原海报标志）
      ctx.fillStyle = boxFill;
      ctx.fillRect(contentX, boxY, contentDrawW, contentDrawH);
      ctx.strokeStyle = m.diagnosis.ok ? COL.forest : m.faults.some((f) => f.id === "fixed_margin" || f.id === "no_max") ? COL.err : COL.forest;
      ctx.lineWidth = frameStroke;
      ctx.strokeRect(contentX + frameStroke / 2, boxY + frameStroke / 2, Math.max(8, contentDrawW - frameStroke), Math.max(8, contentDrawH - frameStroke));

      // 场景内容绘制
      const innerPad = Math.min(18, contentDrawW * 0.08);
      const ix = contentX + innerPad;
      const iy = boxY + innerPad;
      const iw = Math.max(12, contentDrawW - innerPad * 2);
      const ih = Math.max(12, contentDrawH - innerPad * 2);
      const midX = contentX + contentDrawW / 2;
      const midY = boxY + contentDrawH / 2;

      if (m.state.scene === "poster") {
        // 1:1 复刻 245 原海报核心图形：柔粉圆 + 4道白刻线 + 深松绿中心点
        const rad = Math.max(16, Math.min(iw, ih) * 0.44);
        ctx.fillStyle = COL.salmon;
        ctx.beginPath();
        ctx.arc(midX, midY, rad, 0, Math.PI * 2);
        ctx.fill();

        // 若未设最大宽造成横向过度拉伸，给出淡虚线提示“原本应被框住的方形焦点”
        if (contentDrawW > contentDrawH * 1.48) {
          ctx.save();
          ctx.strokeStyle = "rgba(184, 29, 36, 0.38)";
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.2;
          const idealSide = Math.min(contentDrawH, contentDrawW * 0.6);
          ctx.strokeRect(midX - idealSide / 2, boxY + 6, idealSide, contentDrawH - 12);
          ctx.restore();
        }

        // 四道锐利白刻线（忠实还原 245 原海报图形语言）
        const gapR = Math.max(8, rad * 0.24);
        const tickLen = Math.max(10, rad * 0.34);
        ctx.strokeStyle = COL.white;
        ctx.lineWidth = Math.max(2.5, rad * 0.06);
        ctx.beginPath();
        ctx.moveTo(midX, midY - gapR - tickLen);
        ctx.lineTo(midX, midY - gapR);
        ctx.moveTo(midX, midY + gapR);
        ctx.lineTo(midX, midY + gapR + tickLen);
        ctx.moveTo(midX - gapR - tickLen, midY);
        ctx.lineTo(midX - gapR, midY);
        ctx.moveTo(midX + gapR, midY);
        ctx.lineTo(midX + gapR + tickLen, midY);
        ctx.stroke();

        // 深松翠绿实心圆核
        ctx.fillStyle = COL.forestDot;
        ctx.beginPath();
        ctx.arc(midX, midY, Math.max(6, rad * 0.19), 0, Math.PI * 2);
        ctx.fill();

        // 若误开正文居中，底部用 3 条参差短条示意左缘失齐
        const barY = boxY + contentDrawH - 16;
        if (m.state.xMode === "auto-text-center" && iw > 80) {
          const widths = [iw * 0.72, iw * 0.44, iw * 0.58];
          ctx.fillStyle = "rgba(184, 29, 36, 0.42)";
          widths.forEach((bw, idx) => {
            ctx.fillRect(midX - bw / 2, barY - 12 + idx * 5, bw, 2.5);
          });
        }
      } else if (m.state.scene === "article") {
        // 真实排字长文专栏
        const fs = clamp(Math.round(13.5 * Math.min(1.05, boxScaleX * 1.35)), 10.5, 13.5);
        const lh = fs * 1.55;
        const isCenteredText = m.state.xMode === "auto-text-center";

        // 标题行
        ctx.fillStyle = COL.forest;
        ctx.font = `800 ${Math.round(fs * 1.25)}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = isCenteredText ? "center" : "left";
        ctx.textBaseline = "top";
        ctx.fillText("排版里的行宽与呼吸", isCenteredText ? midX : ix, iy + 2);

        // 真实逐字折行
        ctx.font = `400 ${fs}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = COL.ink;
        const lines = [];
        let buf = "";
        for (const ch of ARTICLE_LINES_TEXT) {
          if (ctx.measureText(buf + ch).width > iw - 4 && buf.length > 0) {
            lines.push(buf);
            buf = ch;
          } else {
            buf += ch;
          }
        }
        if (buf) lines.push(buf);

        const textStartY = iy + fs * 1.85;
        const leftStarts = [];
        lines.forEach((ln, idx) => {
          const ly = textStartY + idx * lh;
          if (ly + lh > boxY + contentDrawH - 8) return;
          const lw = ctx.measureText(ln).width;
          const lx = isCenteredText ? midX - lw / 2 : ix;
          leftStarts.push({ x: lx, y: ly + fs * 0.5 });
          ctx.textAlign = isCenteredText ? "center" : "left";
          ctx.fillText(ln, isCenteredText ? midX : ix, ly);
        });

        // 左缘锚线可视化：左对齐时为笔直深松绿竖轨；误居中时连出珊瑚红锯齿折线！
        if (leftStarts.length >= 2) {
          ctx.save();
          ctx.strokeStyle = isCenteredText ? COL.err : COL.forest;
          ctx.lineWidth = isCenteredText ? 1.6 : 2;
          ctx.beginPath();
          leftStarts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x - 4, pt.y);
            else ctx.lineTo(pt.x - 4, pt.y);
          });
          ctx.stroke();
          if (isCenteredText) {
            ctx.fillStyle = COL.err;
            leftStarts.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x - 4, pt.y, 2.5, 0, Math.PI * 2);
              ctx.fill();
            });
          }
          ctx.restore();
        }
      } else {
        // 居中弹窗卡（重点演示矮窗吞顶与安全回退）
        const headH = Math.max(28, contentDrawH * 0.24);
        ctx.fillStyle = m.verticalClipTop > 0 ? "#FCE4E5" : "#EEF6F2";
        ctx.fillRect(contentX + frameStroke, boxY + frameStroke, Math.max(0, contentDrawW - frameStroke * 2), headH);

        ctx.fillStyle = COL.ink;
        ctx.font = `700 13px "Noto Sans SC", sans-serif`;
        ctx.textAlign = m.state.xMode === "auto-text-center" ? "center" : "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "确认发布本次改动？",
          m.state.xMode === "auto-text-center" ? midX : ix,
          boxY + frameStroke + headH / 2
        );

        // 右上关闭钮
        ctx.fillStyle = COL.coralInk;
        ctx.font = `700 13px "Space Mono", monospace`;
        ctx.textAlign = "right";
        ctx.fillText("×", contentX + contentDrawW - 12, boxY + frameStroke + headH / 2);

        // 弹窗说明文字
        ctx.fillStyle = COL.muted;
        ctx.font = `400 11.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = m.state.xMode === "auto-text-center" ? "center" : "left";
        ctx.textBaseline = "top";
        const bodyY = boxY + frameStroke + headH + 12;
        const msg1 = contentDrawW < 180 ? "窄屏请保住顶栏可滚" : "更新后将同步写入线上版本，建议先确认关键字段。";
        ctx.fillText(msg1, m.state.xMode === "auto-text-center" ? midX : ix, bodyY, iw);

        // 底部操作条
        const btnH = 26;
        const btnY = boxY + contentDrawH - btnH - 14;
        const btnW = Math.min(92, (iw - 8) / 2);
        if (btnY > bodyY + 18) {
          ctx.fillStyle = COL.forest;
          ctx.fillRect(contentX + contentDrawW - innerPad - btnW, btnY, btnW, btnH);
          ctx.fillStyle = COL.white;
          ctx.font = `700 11px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("确认发布", contentX + contentDrawW - innerPad - btnW / 2, btnY + btnH / 2);

          ctx.strokeStyle = COL.rule;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(contentX + contentDrawW - innerPad - btnW * 2 - 8, btnY, btnW, btnH);
          ctx.fillStyle = COL.ink;
          ctx.fillText("取消", contentX + contentDrawW - innerPad - btnW * 1.5 - 8, btnY + btnH / 2);
        }
      }

      ctx.restore();
    };

    // 先画视口内正常可见部分
    drawCentererSubject(true);

    // 若发生 unsafe center 顶边溢出，在视口上沿外侧用透视红斜线标出「被吞入负坐标、滚动条永远够不到的那截」
    if (boxY < vpY - 1) {
      const clipH = Math.min(vpY - boxY, vpY - 6);
      ctx.save();
      ctx.fillStyle = "rgba(184, 29, 36, 0.14)";
      ctx.fillRect(contentX, vpY - clipH, contentDrawW, clipH);
      drawHatch(contentX, vpY - clipH, contentDrawW, clipH, "rgba(184, 29, 36, 0.35)", 7);
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(contentX, vpY - clipH, contentDrawW, clipH);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 6. 模拟视口外框线与顶底状态尺
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 1.75;
    ctx.strokeRect(vpX, vpY, vpDrawW, vpDrawH);

    // 光学微抬参考虚线（仅在 optical-lift 启用时显示 50% vs 46% 差）
    if (m.state.yMode === "optical-lift" && m.state.viewportH > m.contentH + 24) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 69, 43, 0.32)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vpX + 8, vpY + vpDrawH * 0.46);
      ctx.lineTo(vpX + vpDrawW - 8, vpY + vpDrawH * 0.46);
      ctx.stroke();
      ctx.restore();
    }

    // 7. 视口左右边墙拖拽把手（珊瑚胶囊滑块）
    const gripH = 38;
    const gripW = 12;
    [vpX, vpX + vpDrawW].forEach((gx) => {
      ctx.fillStyle = COL.coral;
      ctx.fillRect(gx - gripW / 2, cy - gripH / 2, gripW, gripH);
      ctx.strokeStyle = COL.white;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx - 2, cy - 8);
      ctx.lineTo(gx - 2, cy + 8);
      ctx.moveTo(gx + 2, cy - 8);
      ctx.lineTo(gx + 2, cy + 8);
      ctx.stroke();
    });

    // 视口底沿拖拽把手（调高）
    const bGripW = 42;
    const bGripH = 9;
    ctx.fillStyle = COL.forest;
    ctx.fillRect(cx - bGripW / 2, vpY + vpDrawH - bGripH / 2, bGripW, bGripH);
    ctx.strokeStyle = COL.white;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - 10, vpY + vpDrawH);
    ctx.lineTo(cx + 10, vpY + vpDrawH);
    ctx.stroke();

    // 8. 顶栏与底栏实算读数签（单一真源）
    const topLabel = `视口 ${m.state.viewportW}×${m.state.viewportH}px（${viewportTag(m.state.viewportW)}）· 芯宽 ${Math.round(m.cur.contentW)}px（≈${m.icCur}字/行）`;
    drawPill(cx, Math.max(15, vpY - 15), compact ? `${m.state.viewportW}×${m.state.viewportH} · 芯 ${Math.round(m.cur.contentW)}px` : topLabel, {
      bg: COL.ink,
      fg: COL.white,
      fontSize: compact ? 10.5 : 11,
    });

    // 9. 可直点的画布诊断热区（仅当存在错态时，最多展示 2 枚不遮挡主体的快捷纠错签）
    hotspots = [];
    if (!m.diagnosis.ok) {
      const f0 = m.faults[0];
      let fixText = "";
      let fixAction = null;
      if (f0.id === "no_max" || f0.id === "too_wide" || f0.id === "too_narrow") {
        fixText = "点此封顶 max-inline-size: 608px";
        fixAction = () => onMutate({ maxInline: 608 });
      } else if (f0.id === "fixed_margin") {
        fixText = "点此改用 margin-inline: auto";
        fixAction = () => onMutate({ xMode: "auto-left" });
      } else if (f0.id === "gutter_zero" || f0.id === "gutter_huge") {
        fixText = "点此设护边 padding-inline: 24px";
        fixAction = () => onMutate({ gutter: 24 });
      } else if (f0.id === "unsafe_y") {
        fixText = "点此切 safe center 保顶";
        fixAction = () => onMutate({ yMode: "safe-center" });
      } else if (f0.id === "ragged_text") {
        fixText = "点此切正文左对齐";
        fixAction = () => onMutate({ xMode: "auto-left" });
      }
      if (fixText && fixAction) {
        const rect = drawPill(cx, vpY + vpDrawH + (compact ? 17 : 20), `× ${fixText}`, {
          bg: COL.white,
          fg: COL.err,
          border: COL.err,
          fontSize: compact ? 10.5 : 11.5,
        });
        hotspots.push({ ...rect, action: fixAction });
      }
    } else {
      drawPill(cx, vpY + vpDrawH + (compact ? 17 : 21), compact ? "✓ 4/4 已校准 · 拖边墙验窄屏" : "✓ 4/4 已校准 · 横拖珊瑚边墙检验 320–1320px 响应式表现", {
        bg: COL.forest,
        fg: COL.white,
        fontSize: compact ? 10.5 : 11.5,
      });
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  // 指针与触摸交互：横拖调视口宽度（支持在画布任意处横拖，确保 perf data-perf-drag 满帧重绘），
  // 若点中底沿绿柄则纵拖调高；轻点命中红签则一键纠错。
  let dragMode = null; // "width" | "height" | null
  let startX = 0;
  let startY = 0;
  let startVpW = 0;
  let startVpH = 0;
  let dragDirSign = 1;
  let moved = false;

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const p = toLocal(e);
    const m = getModel();
    startX = p.x;
    startY = p.y;
    startVpW = m.state.viewportW;
    startVpH = m.state.viewportH;
    moved = false;

    // 检查是否按在底沿高度把手附近
    const nearBottomGrip =
      Math.abs(p.x - w / 2) < 44 && Math.abs(p.y - (vpRect.y + vpRect.h)) < 18;
    // 若按在左半壁附近，向右拖收窄、向左拖变宽；其余区域默认向右拖变宽、向左拖变窄，手感自然
    const nearLeftWall = Math.abs(p.x - vpRect.x) < 22 && p.y > vpRect.y && p.y < vpRect.y + vpRect.h;
    dragDirSign = nearLeftWall ? -1 : 1;
    dragMode = nearBottomGrip ? "height" : "width";

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = toLocal(e);
    if (!dragMode) {
      // 更新指针样式
      const overHot = hotspots.some((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
      const nearBottom = Math.abs(p.x - w / 2) < 44 && Math.abs(p.y - (vpRect.y + vpRect.h)) < 18;
      canvas.style.cursor = overHot ? "pointer" : nearBottom ? "ns-resize" : "ew-resize";
      return;
    }

    const dx = p.x - startX;
    const dy = p.y - startY;
    if (Math.hypot(dx, dy) > 4) moved = true;

    if (dragMode === "height") {
      const nextH = clamp(startVpH + dy * 1.45, VIEWPORT_MIN_H, VIEWPORT_MAX_H);
      onMutate({ viewportH: Math.round(nextH) });
      ctrl.draw();
    } else if (dragMode === "width") {
      // 横向拖动映射：灵敏度使拖过 1/3 画布即可横跨桌面到手机
      const pxPerDrag = (VIEWPORT_MAX_W - VIEWPORT_MIN_W) / Math.max(180, w * 0.55);
      const nextW = clamp(startVpW + dx * dragDirSign * pxPerDrag, VIEWPORT_MIN_W, VIEWPORT_MAX_W);
      onMutate({ viewportW: Math.round(nextW) });
      ctrl.draw();
    }
  });

  function finishPointer(e) {
    if (!dragMode) return;
    const p = toLocal(e);
    if (!moved) {
      const hit = hotspots.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
      if (hit) {
        hit.action();
        ctrl.draw();
      }
    }
    dragMode = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => {
    dragMode = null;
  });

  // 键盘操作支持（←/→ 调视口宽，↑/↓ 调视口高）
  canvas.addEventListener("keydown", (e) => {
    const m = getModel();
    const step = e.shiftKey ? 80 : 32;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onMutate({ viewportW: clamp(m.state.viewportW - step, VIEWPORT_MIN_W, VIEWPORT_MAX_W) });
      ctrl.draw();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onMutate({ viewportW: clamp(m.state.viewportW + step, VIEWPORT_MIN_W, VIEWPORT_MAX_W) });
      ctrl.draw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onMutate({ viewportH: clamp(m.state.viewportH - 20, VIEWPORT_MIN_H, VIEWPORT_MAX_H) });
      ctrl.draw();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onMutate({ viewportH: clamp(m.state.viewportH + 20, VIEWPORT_MIN_H, VIEWPORT_MAX_H) });
      ctrl.draw();
    }
  });

  window.addEventListener("resize", () => {
    resize();
    ctrl.draw();
  });

  return {
    draw: () => ctrl.draw(),
  };
}
