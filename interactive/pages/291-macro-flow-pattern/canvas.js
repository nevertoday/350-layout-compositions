// 291 开场活体流道视口画布（2D Canvas）与 03 节深蓝暗室断面图绘制模块
// 严格遵循 291 原海报视觉语言：暖奶油纸、皇家钴蓝(#1043C6)、信号朱橘橙(#E35C0E)、双轨 S 流带、四节点徽标。

import { STAGES, THEMES, STAGE_IDS, clamp } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

const COL = {
  paper: "#FCF4EC",
  paperCard: "#FFFBF6",
  paperSub: "#F3E7D8",
  blue: "#1043C6",
  blueDeep: "#0B35A3",
  blueTint: "#E9F0FF",
  orange: "#E35C0E",
  orangeBright: "#F35700",
  orangeDeep: "#B34100",
  orangeTint: "#FDECE1",
  ink: "#111214",
  body: "#1E2128",
  muted: "#4A505E",
  line: "#D8CFC4",
  bad: "#BD2222",
  badBg: "#FDEAEA",
  good: "#0E6E4F",
  goodBg: "#E6F5EE",
};

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

function drawStageIcon(ctx, type, cx, cy, r) {
  ctx.save();
  if (type === "arrow-solid") {
    // 引导：白边 + 皇家钴蓝实心圆 + 白色右箭
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFBF6";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = COL.blue;
    ctx.fill();
    // 箭头
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.42, cy);
    ctx.lineTo(cx + r * 0.36, cy);
    ctx.moveTo(cx + r * 0.08, cy - r * 0.32);
    ctx.lineTo(cx + r * 0.4, cy);
    ctx.lineTo(cx + r * 0.08, cy + r * 0.32);
    ctx.stroke();
  } else if (type === "orange-dot") {
    // 过渡：白环 + 朱橘橙实心圆
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFBF6";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = COL.orange;
    ctx.fill();
  } else if (type === "target") {
    // 聚焦：白边 + 蓝外环 + 白内环 + 蓝靶心
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFBF6";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = COL.blue;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFBF6";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = COL.blue;
    ctx.fill();
  } else {
    // 延展与输出：白底蓝框圆 + 蓝色右箭
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFBF6";
    ctx.fill();
    ctx.lineWidth = Math.max(1.8, r * 0.16);
    ctx.strokeStyle = COL.blue;
    ctx.stroke();
    ctx.strokeStyle = COL.blue;
    ctx.lineWidth = Math.max(1.8, r * 0.18);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.38, cy);
    ctx.lineTo(cx + r * 0.34, cy);
    ctx.moveTo(cx + r * 0.08, cy - r * 0.28);
    ctx.lineTo(cx + r * 0.38, cy);
    ctx.lineTo(cx + r * 0.08, cy + r * 0.28);
    ctx.stroke();
  }
  ctx.restore();
}

// 绘制 291 招牌：皇家蓝 → 朱橘橙双轨流动丝带（串联四块真实中心坐标）
function drawFlowRibbon(ctx, pts, orderOk, animPhase, compact) {
  if (pts.length < 4) return;
  const [p0, p1, p2, p3] = pts;
  ctx.save();

  if (!orderOk) {
    // 错态流序：绘制醒目的红色虚线逆折跳返路径，让读者一眼看清视线如何打结！
    ctx.strokeStyle = COL.bad;
    ctx.lineWidth = compact ? 2.6 : 3.2;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -animPhase * 28;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 在每段中点画方向尖角箭头标出逆流折返
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(ang);
      ctx.fillStyle = COL.bad;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-5, -4.5);
      ctx.lineTo(-5, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  // 顺畅状态：绘制 291 原海报标志性的「蓝 → 橙渐变双轨 S 形丝带 + 箭头 + 伴飞细橙弧 + 右下支流」
  // 主干弧线 p0(引导) -> p1(过渡) -> p2(聚焦)
  const grad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
  grad.addColorStop(0, "rgba(16, 67, 198, 0.24)");
  grad.addColorStop(0.55, "rgba(16, 67, 198, 0.30)");
  grad.addColorStop(1, "rgba(227, 92, 14, 0.34)");

  const strokeGrad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
  strokeGrad.addColorStop(0, COL.blue);
  strokeGrad.addColorStop(0.58, COL.blue);
  strokeGrad.addColorStop(1, COL.orange);

  const c1x = p0.x + (p1.x - p0.x) * 0.35;
  const c1y = p1.y;
  const c2x = p1.x + (p2.x - p1.x) * 0.5;
  const c2y = p1.y + (p2.y - p1.y) * 0.15;

  // 宽柔丝带底衬（保留下方文字可读）
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(c1x, c1y, p1.x, p1.y);
  ctx.quadraticCurveTo(c2x, c2y, p2.x, p2.y);
  ctx.strokeStyle = grad;
  ctx.lineWidth = compact ? 11 : 16;
  ctx.lineCap = "round";
  ctx.stroke();

  // 丝带核心实线
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(c1x, c1y, p1.x, p1.y);
  ctx.quadraticCurveTo(c2x, c2y, p2.x, p2.y);
  ctx.strokeStyle = strokeGrad;
  ctx.lineWidth = compact ? 3 : 4;
  ctx.lineCap = "round";
  ctx.stroke();

  // 双轨内部极细白线脉冲流（呼应原海报丝带中线）
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(c1x, c1y, p1.x, p1.y);
  ctx.quadraticCurveTo(c2x, c2y, p2.x, p2.y);
  ctx.strokeStyle = "rgba(255, 251, 246, 0.88)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([10, 14]);
  ctx.lineDashOffset = -animPhase * 34;
  ctx.stroke();
  ctx.setLineDash([]);

  // 从 p2(聚焦) 顺滑分出延展支流到 p3(延展与输出)
  const bCx = p2.x + (p3.x - p2.x) * 0.45;
  const bCy = p3.y;
  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.quadraticCurveTo(bCx, bCy, p3.x, p3.y);
  ctx.strokeStyle = COL.blue;
  ctx.lineWidth = compact ? 2.4 : 3;
  ctx.stroke();

  // 支流末端小箭头
  const ang3 = Math.atan2(p3.y - bCy, p3.x - bCx);
  ctx.save();
  ctx.translate(p3.x - Math.cos(ang3) * 14, p3.y - Math.sin(ang3) * 14);
  ctx.rotate(ang3);
  ctx.fillStyle = COL.orange;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-4, -4.5);
  ctx.lineTo(-4, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export class HeroCanvas {
  constructor(canvas, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onChange = onChange;
    this.hitBoxes = [];
    this.badgeHit = null;
    this.handleLeft = null;
    this.handleRight = null;
    this.displayVw = 1440;
    this.animT = 0;
    this.lastW = 0;
    this.lastH = 0;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(260, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (w !== this.lastW || h !== this.lastH || this.canvas.width !== Math.round(w * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.lastW = w;
      this.lastH = h;
    }
    return { w, h, dpr };
  }

  render(state, ev, dt, still) {
    const { w, h, dpr } = this.resize();
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 平滑插值视口显示宽度（still 模式下一步到位）
    if (still || dt === 0) {
      this.displayVw = state.viewportW;
    } else {
      const k = 1 - Math.exp(-dt * 16);
      this.displayVw += (state.viewportW - this.displayVw) * k;
      if (Math.abs(this.displayVw - state.viewportW) < 0.4) this.displayVw = state.viewportW;
      this.animT += dt;
    }

    const compact = w < 520;
    const rulerH = compact ? 34 : 38;
    const footerH = compact ? 28 : 30;
    const padX = compact ? 12 : 24;
    const stageTop = rulerH + 6;
    const stageH = h - stageTop - footerH;
    const stageMaxW = w - padX * 2;

    // 背景：暖奶油纸面 + 极淡工程标尺底格
    ctx.fillStyle = COL.paperCard;
    ctx.fillRect(0, 0, w, h);

    // 淡灰刻度网格
    ctx.strokeStyle = "rgba(16, 67, 198, 0.055)";
    ctx.lineWidth = 1;
    const gridStep = compact ? 24 : 32;
    for (let gx = padX; gx <= w - padX; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx + 0.5, stageTop);
      ctx.lineTo(gx + 0.5, stageTop + stageH);
      ctx.stroke();
    }

    // 顶沿视口宽度标尺（320px .. 1680px 对称映射）
    ctx.fillStyle = "#F5ECE0";
    ctx.fillRect(0, 0, w, rulerH);
    ctx.strokeStyle = COL.line;
    ctx.beginPath();
    ctx.moveTo(0, rulerH + 0.5);
    ctx.lineTo(w, rulerH + 0.5);
    ctx.stroke();

    // 标尺把 1680px 映射到 stageMaxW，保持对称居中展开
    const pxScale = stageMaxW / 1680;
    const vpDrawW = Math.max(compact ? 176 : 210, this.displayVw * pxScale);
    const vpLeft = Math.round((w - vpDrawW) / 2);
    const vpRight = Math.round(vpLeft + vpDrawW);

    // 中央实时视口宽读数胶囊（先算尺寸，以便避开标尺刻度防撞字）
    const pillText = `模拟视口 ${Math.round(this.displayVw)}px · ${
      ev.current.stacked
        ? "单列纵流"
        : ev.current.capped
        ? `锁宽 ${ev.current.containerW}px + 外边距 ${ev.current.outerMargin}px`
        : `${ev.current.colCount} 列弹性流排`
    }`;
    ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", Manrope, sans-serif`;
    const pillW = Math.min(w - 20, ctx.measureText(pillText).width + 22);
    const pillX = Math.round((w - pillW) / 2);

    // 标尺断点提示线（跳过落入中央胶囊投影区内的数字，彻底零撞字）
    const marks = [360, 640, 768, 1120, 1440, 1680];
    ctx.font = `600 ${compact ? 10 : 11}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const mw of marks) {
      const half = (mw * pxScale) / 2;
      const rx = w / 2 + half;
      const lx = w / 2 - half;
      if (rx < w - 18) {
        ctx.strokeStyle = "rgba(74, 80, 94, 0.25)";
        ctx.beginPath();
        ctx.moveTo(rx, rulerH - 8);
        ctx.lineTo(rx, rulerH);
        ctx.moveTo(lx, rulerH - 8);
        ctx.lineTo(lx, rulerH);
        ctx.stroke();
        const clearOfPill = rx > pillX + pillW + 22;
        if (clearOfPill && (!compact || mw === 1120 || mw === 1680)) {
          ctx.fillStyle = COL.muted;
          ctx.fillText(`${mw}`, rx, rulerH - 17);
        }
      }
    }

    roundRect(ctx, pillX, 6, pillW, rulerH - 12, 3);
    ctx.fillStyle = ev.score === 4 ? COL.blue : COL.ink;
    ctx.fill();
    ctx.fillStyle = "#FFFBF6";
    ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", Manrope, sans-serif`;
    ctx.fillText(pillText, w / 2, rulerH / 2 + 0.5);

    // 真实视口框（模拟浏览器窗口）
    const frameY = stageTop + 6;
    const frameH = stageH - 12;
    const chromeH = compact ? 22 : 24;

    // 窗口投影（极克制印刷硬边感，不糊）
    ctx.fillStyle = "rgba(17, 18, 20, 0.06)";
    ctx.fillRect(vpLeft + 4, frameY + 4, vpDrawW, frameH);

    // 视口底色
    ctx.fillStyle = COL.paper;
    ctx.fillRect(vpLeft, frameY, vpDrawW, frameH);

    // 浏览器顶栏
    ctx.fillStyle = "#111214";
    ctx.fillRect(vpLeft, frameY, vpDrawW, chromeH);

    // 顶栏三色点（呼应原海报蓝/橙/白）
    const dotY = frameY + chromeH / 2;
    [COL.blue, COL.orange, "#FFFBF6"].forEach((c, idx) => {
      ctx.beginPath();
      ctx.arc(vpLeft + 11 + idx * 10, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
    });

    // 站点名与当前视口状态
    const theme = THEMES[state.theme] || THEMES.poster;
    ctx.font = `600 ${compact ? 10 : 11}px Chivo, sans-serif`;
    ctx.fillStyle = "rgba(255, 251, 246, 0.86)";
    ctx.textAlign = "left";
    ctx.fillText(theme.siteTitle, vpLeft + 44, dotY + 0.5);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.score === 4 ? "#8EB2FF" : "#FF9A5C";
    ctx.fillText(`${state.viewportW}px`, vpRight - 10, dotY + 0.5);

    // 计算内部容器与四块映射坐标（留出底部 36px 给错态纠偏标，彻底不遮挡任何区块标题！）
    const hasAlert = Boolean(ev.fixAction && ev.score < 4);
    const alertReserve = hasAlert ? 36 : 8;
    const innerTop = frameY + chromeH + 8;
    const innerH = Math.max(120, frameH - chromeH - 10 - alertReserve);
    const layout = ev.current;
    const xRatio = vpDrawW / layout.vw;
    const yRatio = Math.min(1, innerH / Math.max(1, layout.totalH));

    // 对称外边距缓冲带（Outer Margin Bands）显影！这就是 Mostly Fluid 的视觉标志
    const drawContX = vpLeft + layout.containerX * xRatio;
    const drawContW = layout.containerW * xRatio;
    const leftMarginW = drawContX - vpLeft;
    const rightMarginX = drawContX + drawContW;
    const rightMarginW = vpRight - rightMarginX;

    if (leftMarginW > 6) {
      // 斜纹淡蓝留白缓冲带
      ctx.save();
      ctx.fillStyle = ev.marginOk ? "rgba(16, 67, 198, 0.075)" : "rgba(189, 34, 34, 0.09)";
      ctx.fillRect(vpLeft, frameY + chromeH, leftMarginW, frameH - chromeH);
      ctx.fillRect(rightMarginX, frameY + chromeH, rightMarginW, frameH - chromeH);

      // 细虚线标出 max-width 锁宽边界线
      ctx.strokeStyle = ev.marginOk ? COL.blue : COL.bad;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(drawContX, frameY + chromeH);
      ctx.lineTo(drawContX, frameY + frameH);
      ctx.moveTo(rightMarginX, frameY + chromeH);
      ctx.lineTo(rightMarginX, frameY + frameH);
      ctx.stroke();
      ctx.setLineDash([]);

      // 在足够宽的外边距中直接标注像素值
      if (leftMarginW >= 34) {
        ctx.font = `700 10px Manrope, sans-serif`;
        ctx.fillStyle = ev.marginOk ? COL.blueDeep : COL.bad;
        ctx.textAlign = "center";
        ctx.fillText(`留白`, vpLeft + leftMarginW / 2, innerTop + innerH * 0.44);
        ctx.fillText(`${layout.outerMargin}px`, vpLeft + leftMarginW / 2, innerTop + innerH * 0.44 + 14);
        ctx.fillText(`留白`, rightMarginX + rightMarginW / 2, innerTop + innerH * 0.44);
        ctx.fillText(`${layout.outerMargin}px`, rightMarginX + rightMarginW / 2, innerTop + innerH * 0.44 + 14);
      }
      ctx.restore();
    }

    // 绘制四个真实内容区块，并记录点击热区
    this.hitBoxes = [];
    const blockDrawCenters = {};

    for (const b of layout.blocks) {
      const bx = vpLeft + b.x * xRatio;
      const by = innerTop + b.y * yRatio;
      const bw = Math.max(32, b.w * xRatio);
      const bh = Math.max(30, b.h * yRatio);
      const stage = STAGES[b.id];
      const copy = theme.blocks[b.id];
      const isSelected = state.selectedSlot === b.slot;
      const isFocus = b.id === "focus";
      const isTransition = b.id === "transition";
      const isOutput = b.id === "output";

      this.hitBoxes.push({ slot: b.slot, id: b.id, x: bx, y: by, w: bw, h: bh });
      blockDrawCenters[b.id] = { x: bx + bw / 2, y: by + bh / 2 };

      // 区块底板
      ctx.save();
      roundRect(ctx, bx, by, bw, bh, 4);
      if (isFocus && state.rhythm !== "equal") {
        ctx.fillStyle = "#EEF3FF";
      } else if (isTransition && state.rhythm !== "equal") {
        ctx.fillStyle = "#FDF0E6";
      } else if (isOutput && state.rhythm !== "equal") {
        ctx.fillStyle = "#FFFBF6";
      } else {
        ctx.fillStyle = "#FFFFFF";
      }
      ctx.fill();

      // 边框：被选中换序时亮朱橘粗框，聚焦位亮皇家蓝框，其余细线
      ctx.lineWidth = isSelected ? 2.5 : isFocus && state.rhythm !== "equal" ? 2 : 1.2;
      ctx.strokeStyle = isSelected
        ? COL.orangeBright
        : !ev.stackOk && b.w < 200
        ? COL.bad
        : isFocus && state.rhythm !== "equal"
        ? COL.blue
        : isTransition && state.rhythm !== "equal"
        ? "rgba(227, 92, 14, 0.55)"
        : "rgba(17, 18, 20, 0.18)";
      ctx.stroke();

      // 左侧竖向色条（表现节奏权重）
      if (state.rhythm !== "equal") {
        ctx.fillStyle = isTransition ? COL.orange : COL.blue;
        ctx.fillRect(bx, by, isFocus || b.id === "flow" ? 4.5 : 3, bh);
      }

      // 区块内精简真实 UI 排布（裁切保护防止极窄挤爆时文本画出框外）
      ctx.beginPath();
      ctx.rect(bx + 2, by + 2, bw - 4, bh - 4);
      ctx.clip();

      const padIn = bw < 110 ? 7 : 12;
      const iconR = bw < 110 || bh < 56 ? 8 : 11;
      const iconX = bx + padIn + iconR;
      const iconY = by + Math.min(20, bh * 0.34);
      drawStageIcon(ctx, stage.icon, iconX, iconY, iconR);

      // 顺位角标 + 阶段名（极窄列时自动取 2 字短名防半截裁字）
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const labelX = iconX + iconR + 6;
      const shortZh = bw < 102 && stage.zh.length > 2 ? stage.zh.slice(0, 2) : stage.zh;
      ctx.font = `700 ${bw < 120 ? 10 : 12}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = isTransition ? COL.orangeDeep : COL.blueDeep;
      ctx.fillText(`0${b.slot + 1} ${shortZh}`, labelX, iconY);

      // 英文副标（仅在足够宽的区块才画，杜绝与中文标题撞字）
      if (bw >= 245 && bh >= 52) {
        ctx.font = `600 10px Chivo, sans-serif`;
        ctx.fillStyle = COL.muted;
        ctx.textAlign = "right";
        ctx.fillText(stage.en, bx + bw - padIn, iconY);
      }

      // 区块标题与模拟文本行（直观体现行长是否过长或挤碎！）
      ctx.textAlign = "left";
      if (bh >= 54) {
        const titleY = iconY + iconR + (bh > 86 ? 13 : 10);
        ctx.font = `700 ${bw < 130 ? 10 : 12.5}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = COL.ink;
        const maxTitleChars = Math.max(4, Math.floor((bw - padIn * 2) / 13));
        const tStr =
          copy.title.length > maxTitleChars
            ? copy.title.slice(0, maxTitleChars - 1) + "…"
            : copy.title;
        ctx.fillText(tStr, bx + padIn, titleY);

        // 模拟正文行条（直接反映实际阅读行宽！）
        if (bh >= 76) {
          const lineY = titleY + 14;
          const barW = Math.max(24, bw - padIn * 2);
          ctx.fillStyle =
            !ev.marginOk && state.viewportW >= 1200 && state.maxWidth === 0
              ? "rgba(189, 34, 34, 0.28)"
              : "rgba(30, 33, 40, 0.16)";
          roundRect(ctx, bx + padIn, lineY, barW, 5, 2);
          ctx.fill();
          if (bh >= 92) {
            roundRect(ctx, bx + padIn, lineY + 10, barW * 0.72, 5, 2);
            ctx.fill();
          }
        }
      }

      // 若是引导/输出且高度够，画一个小型行动胶囊
      if (copy.cta && bh >= 98 && bw >= 145) {
        const btnW = Math.min(bw - padIn * 2, 114);
        const btnH = 21;
        const btnX = bx + padIn;
        const btnY = by + bh - btnH - 9;
        roundRect(ctx, btnX, btnY, btnW, btnH, 3);
        ctx.fillStyle = isOutput ? COL.orange : COL.blue;
        ctx.fill();
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "#FFFBF6";
        ctx.textAlign = "center";
        ctx.fillText(copy.cta, btnX + btnW / 2, btnY + btnH / 2 + 0.5);
      }

      ctx.restore();
    }

    // 叠加绘制 291 蓝→橙 S 流带（按语义四阶段顺序串连：引导 → 过渡 → 聚焦 → 延展输出）
    const orderedPts = STAGE_IDS.map((id) => blockDrawCenters[id]).filter(Boolean);
    drawFlowRibbon(ctx, orderedPts, ev.orderOk, this.animT, compact);

    // 重画一次小节点徽标到流带顶层，防止被丝带盖住图标
    for (const id of STAGE_IDS) {
      const pt = blockDrawCenters[id];
      if (!pt) continue;
      const b = this.hitBoxes.find((hb) => hb.id === id);
      if (b && b.w >= 120 && b.h >= 64) {
        drawStageIcon(ctx, STAGES[id].icon, pt.x, pt.y, compact ? 9 : 11);
      }
    }

    // 视口外框描边
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(vpLeft, frameY, vpDrawW, frameH);

    // 左右可拖拉宽把手（紧贴视口两壁，带蓝橙双轨握感，明确提示可横拖！）
    const hW = compact ? 14 : 16;
    const hH = compact ? 54 : 68;
    const hY = Math.round(frameY + (frameH - hH) / 2);
    this.handleLeft = { x: vpLeft - hW, y: hY, w: hW + 8, h: hH };
    this.handleRight = { x: vpRight - 8, y: hY, w: hW + 8, h: hH };

    [
      { x: vpLeft - hW / 2, side: "L" },
      { x: vpRight - hW / 2, side: "R" },
    ].forEach(({ x }) => {
      roundRect(ctx, x, hY, hW, hH, 4);
      ctx.fillStyle = COL.orange;
      ctx.fill();
      ctx.strokeStyle = "#FFFBF6";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 两条白握纹
      ctx.strokeStyle = "#FFFBF6";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + hW * 0.38, hY + 16);
      ctx.lineTo(x + hW * 0.38, hY + hH - 16);
      ctx.moveTo(x + hW * 0.62, hY + 16);
      ctx.lineTo(x + hW * 0.62, hY + hH - 16);
      ctx.stroke();
    });

    // 若当前存在未解决的主要错态，在视口框底沿留白区叠加清晰可点的红色就地纠偏标（零遮挡区块内容！）
    this.badgeHit = null;
    if (ev.fixAction && ev.score < 4) {
      const bText = `× ${ev.statusTag.split("·")[1]?.trim() || "流态异常"} · 点此一步校准`;
      ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      const bw = Math.min(vpDrawW - 20, ctx.measureText(bText).width + 24);
      const bh = 26;
      const bx = Math.round(w / 2 - bw / 2);
      const by = Math.round(frameY + frameH - bh - 6);
      roundRect(ctx, bx, by, bw, bh, 4);
      ctx.fillStyle = COL.bad;
      ctx.fill();
      ctx.strokeStyle = "#FFFBF6";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bText, bx + bw / 2, by + bh / 2 + 0.5);
      this.badgeHit = { x: bx, y: by, w: bw, h: bh };
    }

    // 底部操作微提示带
    const footY = h - footerH / 2;
    ctx.fillStyle = "#F5ECE0";
    ctx.fillRect(0, h - footerH, w, footerH);
    ctx.strokeStyle = COL.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - footerH + 0.5);
    ctx.lineTo(w, h - footerH + 0.5);
    ctx.stroke();

    ctx.font = `500 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COL.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hint = compact
      ? "↔ 横拖拉宽视口 · 点两块换流序 · 点红标校准"
      : "↔ 在画布左右横拖拉阔视口（320–1680px） · 点击任意两块互换流序 · 键盘 ← / → 微调视口宽";
    ctx.fillText(hint, w / 2, footY);

    ctx.restore();
  }

  // 把画布坐标转换为交互动作（点击纠偏标 / 点击区块换序）
  hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (
      this.badgeHit &&
      x >= this.badgeHit.x &&
      x <= this.badgeHit.x + this.badgeHit.w &&
      y >= this.badgeHit.y &&
      y <= this.badgeHit.y + this.badgeHit.h
    ) {
      return { kind: "fix" };
    }
    for (const hb of this.hitBoxes) {
      if (x >= hb.x && x <= hb.x + hb.w && y >= hb.y && y <= hb.y + hb.h) {
        return { kind: "block", slot: hb.slot, id: hb.id };
      }
    }
    return { kind: "bg" };
  }
}

// 03 节深蓝暗室：外边距吞吐断面图（实时展示不同桌面屏幕下 max-width 如何稳定内容带并扩张外边距）
export function drawSection3Diagram(canvas, screenW, maxW, stackAt) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(260, Math.round(rect.width));
  const h = Math.max(170, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  // 深蓝暗舱底
  ctx.fillStyle = "#0D2468";
  ctx.fillRect(0, 0, w, h);

  // 细坐标网格
  ctx.strokeStyle = "rgba(154, 192, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let gx = 20; gx < w; gx += 28) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }

  const pad = 18;
  const maxBarW = w - pad * 2;
  const fullScale = maxBarW / 2560;
  const scrDrawW = Math.max(88, Math.round(screenW * fullScale));
  const scrX = Math.round((w - scrDrawW) / 2);
  const barY = 44;
  const barH = h - 78;

  const isStacked = screenW < stackAt;
  const contW = Math.min(screenW - 24, maxW);
  const marginPx = Math.max(12, Math.round((screenW - contW) / 2));
  const contDrawW = Math.round((contW / screenW) * scrDrawW);
  const contX = Math.round(scrX + (scrDrawW - contDrawW) / 2);

  // 顶部总标尺
  ctx.font = "700 11px Manrope, sans-serif";
  ctx.fillStyle = "#9AC0FF";
  ctx.textAlign = "center";
  ctx.fillText(`屏幕总宽 ${screenW}px`, w / 2, 20);
  ctx.strokeStyle = "rgba(154, 192, 255, 0.55)";
  ctx.beginPath();
  ctx.moveTo(scrX, 32);
  ctx.lineTo(scrX + scrDrawW, 32);
  ctx.moveTo(scrX, 28);
  ctx.lineTo(scrX, 36);
  ctx.moveTo(scrX + scrDrawW, 28);
  ctx.lineTo(scrX + scrDrawW, 36);
  ctx.stroke();

  // 整屏外框
  ctx.fillStyle = "rgba(255, 154, 92, 0.16)";
  ctx.fillRect(scrX, barY, scrDrawW, barH);
  ctx.strokeStyle = "#9AC0FF";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(scrX, barY, scrDrawW, barH);

  // 中央内容锁定区
  ctx.fillStyle = "#1649D1";
  ctx.fillRect(contX, barY + 4, contDrawW, barH - 8);
  ctx.strokeStyle = "#FCF4EC";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(contX, barY + 4, contDrawW, barH - 8);

  // 内容区内部列示意
  if (isStacked) {
    const rh = (barH - 22) / 3;
    ctx.fillStyle = "rgba(252, 244, 236, 0.22)";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(contX + 6, barY + 9 + i * (rh + 3), contDrawW - 12, rh);
    }
  } else {
    ctx.fillStyle = "rgba(252, 244, 236, 0.22)";
    ctx.fillRect(contX + 6, barY + 10, contDrawW - 12, (barH - 24) * 0.42);
    const leftCol = Math.round((contDrawW - 18) * 0.38);
    ctx.fillRect(contX + 6, barY + 14 + (barH - 24) * 0.42, leftCol, (barH - 24) * 0.52);
    ctx.fillStyle = "rgba(255, 154, 92, 0.55)";
    ctx.fillRect(
      contX + 12 + leftCol,
      barY + 14 + (barH - 24) * 0.42,
      contDrawW - 18 - leftCol,
      (barH - 24) * 0.52
    );
  }

  // 底沿读数说明
  ctx.font = "700 11px Manrope, sans-serif";
  ctx.fillStyle = "#FCF4EC";
  ctx.textAlign = "center";
  ctx.fillText(
    `内容锁宽 ${contW}px · 单侧外边距 ${marginPx}px · ${isStacked ? "单列堆叠" : "主次多列"}`,
    w / 2,
    h - 14
  );

  ctx.restore();
}
