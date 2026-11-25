// 244 盒子 BOX — 活体四层盒模型剥层解剖台 (2D / 2.5D 等轴画布)
// 严格从 model.js 的 evaluateBox() 读取唯一几何真源，实现直拖改层、立体剥层与高对比 X 光模拟

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SLOT_W, clampParam } from "./model.js";

const COL = {
  yellow: "#FCC003",
  pink: "#F47F92",
  pinkDark: "#98203A",
  cream: "#F2EBDD",
  teal: "#05796B",
  tealDeep: "#034C43",
  black: "#080A09",
  inkMuted: "#2D3330",
  danger: "#C41E22",
  dangerFill: "rgba(196, 30, 34, 0.20)",
  ok: "#046256",
  hcBg: "#060807",
  hcFg: "#FFFFFF",
  hcWarn: "#FF7878",
  hcAccent: "#FFE44D",
  hcGuard: "#6CE6D2",
};

function easeOutCubic(x) {
  const c = Math.max(0, Math.min(1, x));
  return 1 - (1 - c) ** 3;
}

// 绘制 244 原海报内容区标志白面等轴立方体
function drawPosterCube(ctx, cx, cy, r, fillColor, strokeColor, lineW = 1.8) {
  const dx = r * 0.866;
  const dy = r * 0.5;
  ctx.save();
  // 六边形外实底
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + dx, cy - dy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - dx, cy + dy);
  ctx.lineTo(cx - dx, cy - dy);
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineW;
  ctx.lineJoin = "round";
  ctx.stroke();

  // 内三条 Y 形棱线（复刻 244 原海报立方体）
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy + r);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - dx, cy - dy);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + dx, cy - dy);
  ctx.stroke();
  ctx.restore();
}

// 45° 警示斜纹填充
function drawHatchRect(ctx, x, y, w, h, strokeColor, step = 8) {
  if (w <= 1 || h <= 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let d = -h; d < w + h; d += step) {
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d - h, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

export function createBoxCanvas(canvas, { getMetrics, onChange, onSelectLayer }) {
  const ctx = canvas.getContext("2d");
  let w = 720;
  let h = 470;
  let dpr = 1;

  // 动画进度：开场剥层入场 + 2.5D 立体剥层过渡
  let intro = reducedMotion.matches ? 1 : 0;
  let explodeT = 0;
  let hitZones = null;
  let drag = null;
  let hoverCursor = "ew-resize";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    dpr = pixelRatio(window.innerWidth <= 520 ? 1.5 : 2);
    w = Math.max(260, Math.round(rect.width));
    const narrow = w < 460;
    const shortLandscape = window.innerHeight <= 440 && window.innerWidth > window.innerHeight;
    if (shortLandscape) {
      h = Math.max(220, Math.min(272, window.innerHeight - 108));
    } else {
      const ratio = narrow ? 0.88 : w < 640 ? 0.7 : 0.56;
      h = Math.max(270, Math.min(430, Math.round(w * ratio)));
    }
    canvas.style.height = `${h}px`;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  }

  // 把 2D 点按立体剥层进度 t 与层高 z 投影成 2.5D 等轴坐标
  function proj(x, y, cx, cy, z, t) {
    if (t <= 0.001) return [x, y];
    const rx = x - cx;
    const ry = y - cy;
    // 优雅的建筑轴测压扁 + 轻微斜切 + Z 轴浮升
    const px = cx + rx * (1 - 0.1 * t) + ry * (0.28 * t);
    const py = cy + ry * (1 - 0.42 * t) - z * t;
    return [px, py];
  }

  function polyRect(x, y, rw, rh, cx, cy, z, t) {
    return [
      proj(x, y, cx, cy, z, t),
      proj(x + rw, y, cx, cy, z, t),
      proj(x + rw, y + rh, cx, cy, z, t),
      proj(x, y + rh, cx, cy, z, t),
    ];
  }

  function tracePoly(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function renderFrame(dt, { still }) {
    const m = getMetrics();
    const s = m.state;
    const targetExplode = s.viewMode === "exploded" ? 1 : 0;

    if (still) {
      intro = 1;
      explodeT = targetExplode;
    } else {
      if (intro < 1) intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.45);
      const diff = targetExplode - explodeT;
      if (Math.abs(diff) > 0.004) {
        explodeT += diff * Math.min(1, Math.max(dt, 0.016) * 10);
      } else {
        explodeT = targetExplode;
      }
    }

    const introE = easeOutCubic(intro);
    const ex = easeOutCubic(explodeT);
    const hc = s.highContrast;
    const compact = w < 520;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 画布底色（原海报明黄 或 高对比黑底）
    ctx.fillStyle = hc ? COL.hcBg : COL.yellow;
    ctx.fillRect(0, 0, w, h);

    // 布局参数：左侧为同心盒主舞台，右侧保留原海报四道圆点水平引线区
    const labelColW = compact ? 92 : 138;
    const padL = compact ? 14 : 24;
    const padR = compact ? 10 : 18;
    const topBand = compact ? 42 : 48;
    const botBand = compact ? 28 : 34;

    const stageW = w - padL - labelColW - padR;
    const stageH = h - topBand - botBand;

    // 按逻辑父槽 320px 与最大溢出 420px 计算统一等比缩放（绝不等比拉伸！）
    const maxDesignW = 420;
    const maxDesignH = 310;
    const scale = Math.min(stageW / maxDesignW, stageH / maxDesignH);

    // 舞台几何中心
    const cx = padL + stageW * 0.48;
    const cy = topBand + stageH * (ex > 0.05 ? 0.56 : 0.52);

    const slotPxW = SLOT_W * scale;
    const slotPxH = 236 * scale;
    const slotX = cx - slotPxW / 2;
    const slotY = cy - slotPxH / 2;

    // 盒子各层实际缩放尺寸（严格 1:1 映射 model.js 单真源）
    const pScale = 0.72 + 0.28 * introE;
    const bW = m.borderBoxW * scale * pScale;
    const bH = m.borderBoxH * scale * pScale;
    const pW = m.paddingBoxW * scale * pScale;
    const pH = m.paddingBoxH * scale * pScale;
    const cW = m.contentW * scale * pScale;
    const cH = m.contentH * scale * pScale;
    const mW = Math.max(bW, m.outerW * scale * pScale);
    const mH = Math.max(bH, m.outerH * scale * pScale);

    const zStep = compact ? 19 : 26;
    const zSlot = -zStep * 1.1;
    const zMargin = -zStep * 0.35;
    const zBorder = zStep * 0.4;
    const zPad = zStep * 1.05;
    const zContent = zStep * 1.75;

    // 2. 顶部 320px 父槽标尺条（让「为什么撑爆」一眼看懂）
    const rulerY = compact ? 18 : 22;
    const slotLeft = cx - slotPxW / 2;
    const slotRight = cx + slotPxW / 2;
    const actualHalf = (m.outerW * scale) / 2;
    const actualLeft = cx - actualHalf;
    const actualRight = cx + actualHalf;

    ctx.save();
    // 槽宽基准线
    ctx.strokeStyle = hc ? COL.hcAccent : COL.black;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(slotLeft, rulerY);
    ctx.lineTo(slotRight, rulerY);
    ctx.moveTo(slotLeft, rulerY - 5);
    ctx.lineTo(slotLeft, rulerY + 5);
    ctx.moveTo(slotRight, rulerY - 5);
    ctx.lineTo(slotRight, rulerY + 5);
    ctx.stroke();

    // 实占宽横条
    const barColor = m.totalOverflow > 0 ? (hc ? COL.hcWarn : COL.danger) : hc ? COL.hcGuard : COL.tealDeep;
    ctx.fillStyle = barColor;
    ctx.fillRect(actualLeft, rulerY + 5, Math.max(4, actualRight - actualLeft), 4);

    // 顶部读数徽章
    ctx.font = `600 ${compact ? 10.5 : 11.5}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    const rulerText =
      m.totalOverflow > 0
        ? `父槽 ${SLOT_W}px · 实占 ${m.outerW}px（爆 +${m.totalOverflow}px）`
        : `父槽 ${SLOT_W}px · 实占 ${m.outerW}px（余 ${m.sparePx}px）`;
    const rtW = ctx.measureText(rulerText).width + 14;
    const rtX = Math.max(padL, Math.min(w - padR - rtW, cx - rtW / 2));
    ctx.fillStyle = m.totalOverflow > 0 ? (hc ? "#401012" : COL.danger) : hc ? "#0F2B26" : COL.black;
    ctx.fillRect(rtX, rulerY - 12, rtW, 18);
    ctx.fillStyle = "#FAF6EC";
    ctx.textAlign = "center";
    ctx.fillText(rulerText, rtX + rtW / 2, rulerY - 3);
    ctx.restore();

    // 3. 最外层父槽虚线框（原海报标志黑虚线框）
    const slotPts = polyRect(slotX, slotY, slotPxW, slotPxH, cx, cy, zSlot, ex);
    ctx.save();
    tracePoly(slotPts);
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = hc ? COL.hcAccent : COL.black;
    ctx.stroke();
    ctx.restore();

    // 4. 外边距层 MARGIN（玫瑰珊瑚粉，超出父槽部分叠绘警示红斜纹）
    const marginX = cx - mW / 2;
    const marginY = cy - mH / 2;
    const marginPts = polyRect(marginX, marginY, mW, mH, cx, cy, zMargin, ex);
    if (s.margin > 0) {
      ctx.save();
      tracePoly(marginPts);
      if (!hc) {
        ctx.fillStyle = COL.pink;
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
      // 选中高亮描边
      if (s.activeLayer === "margin") {
        ctx.setLineDash([]);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = hc ? COL.hcAccent : COL.pinkDark;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 溢出警示斜纹（仅平视模式清晰高亮超出 320px 槽壁的部分）
    if (m.totalOverflow > 0 && ex < 0.35) {
      const ovLeftW = Math.max(0, slotX - marginX);
      const ovRightX = slotX + slotPxW;
      const ovRightW = Math.max(0, marginX + mW - ovRightX);
      ctx.save();
      ctx.globalAlpha = 1 - ex * 2.5;
      if (ovLeftW > 1) {
        ctx.fillStyle = COL.dangerFill;
        ctx.fillRect(marginX, marginY, ovLeftW, mH);
        drawHatchRect(ctx, marginX, marginY, ovLeftW, mH, hc ? COL.hcWarn : COL.danger, 7);
      }
      if (ovRightW > 1) {
        ctx.fillStyle = COL.dangerFill;
        ctx.fillRect(ovRightX, marginY, ovRightW, mH);
        drawHatchRect(ctx, ovRightX, marginY, ovRightW, mH, hc ? COL.hcWarn : COL.danger, 7);
      }
      ctx.restore();
    }

    // 负外边距咬框红虚线提示
    if (s.margin < 0) {
      const negPx = Math.abs(s.margin) * scale;
      const bitePts = polyRect(
        cx - bW / 2 - negPx,
        cy - bH / 2 - negPx,
        bW + 2 * negPx,
        bH + 2 * negPx,
        cx,
        cy,
        zMargin,
        ex,
      );
      ctx.save();
      tracePoly(bitePts);
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = hc ? COL.hcWarn : COL.danger;
      ctx.stroke();
      ctx.restore();
    }

    // 5. 立体剥层时的四角垂直对齐基准虚线
    const borderX = cx - bW / 2;
    const borderY = cy - bH / 2;
    const padX = cx - pW / 2;
    const padY = cy - pH / 2;
    const conX = cx - cW / 2;
    const conY = cy - cH / 2;

    const borderPts = polyRect(borderX, borderY, bW, bH, cx, cy, zBorder, ex);
    const padPts = polyRect(padX, padY, pW, pH, cx, cy, zPad, ex);
    const conPts = polyRect(conX, conY, cW, cH, cx, cy, zContent, ex);

    if (ex > 0.08) {
      ctx.save();
      ctx.globalAlpha = ex * 0.55;
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = hc ? "#7A8C87" : COL.black;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(marginPts[i][0], marginPts[i][1]);
        ctx.lineTo(conPts[i][0], conPts[i][1]);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. 边框层 BORDER（实心纯黑；无框时如果开了透明 outline 护边，高对比下亮出护边！）
    ctx.save();
    tracePoly(borderPts);
    if (!hc) {
      if (s.border > 0) {
        ctx.fillStyle = COL.black;
        ctx.fill();
      } else {
        // 无实线边框：填充与内边距同色，若开了透明护边则给温和细虚线提示护边存在
        ctx.fillStyle = COL.cream;
        ctx.fill();
        if (s.transparentOutline) {
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = COL.teal;
          ctx.stroke();
        }
      }
      if (s.activeLayer === "border") {
        ctx.setLineDash([]);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = COL.yellow;
        ctx.stroke();
      }
    } else {
      // 高对比 forced-colors：剥除一切背景填充，只保留实线 border 或透明 outline！
      if (s.border > 0) {
        ctx.strokeStyle = COL.hcFg;
        ctx.lineWidth = Math.max(2, s.border * scale);
        ctx.stroke();
      } else if (s.transparentOutline) {
        ctx.strokeStyle = COL.hcGuard;
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }
      // 若 border === 0 && !transparentOutline：什么轮廓都不画！真实呈现边界失踪！
    }
    ctx.restore();

    // 7. 内边距层 PADDING（暖奶油纸 + 原海报深翠青内虚线框）
    ctx.save();
    tracePoly(padPts);
    if (!hc) {
      ctx.fillStyle = COL.cream;
      ctx.fill();
      if (s.activeLayer === "padding") {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = COL.teal;
        ctx.stroke();
      }
    } else if (s.activeLayer === "padding") {
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = COL.hcAccent;
      ctx.stroke();
    }

    // 原海报标志：内边距中间的深翠青虚线呼吸框（当 padding >= 8px 时画得非常优雅）
    if (s.padding >= 8 && !hc) {
      const midX = (padX + conX) / 2;
      const midY = (padY + conY) / 2;
      const midW = (pW + cW) / 2;
      const midH = (pH + cH) / 2;
      const guidePts = polyRect(midX, midY, midW, midH, cx, cy, zPad, ex);
      tracePoly(guidePts);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COL.teal;
      ctx.stroke();
    }
    ctx.restore();

    // 8. 内容核心层 CONTENT（深翠青 + 题材内容）
    ctx.save();
    tracePoly(conPts);
    if (!hc) {
      ctx.fillStyle = m.contentW < 150 ? "#8E2925" : COL.teal;
      ctx.fill();
      if (s.activeLayer === "content") {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = COL.yellow;
        ctx.stroke();
      }
    } else {
      // 高对比下：背景色完全剥除，若既无 border 又无 transparentOutline，盒内仅剩孤零零文字
      if (s.activeLayer === "content") {
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.stroke();
      }
    }

    // 内容区中心绘制（跟随立体剥层上浮；显式最小行距确保 390px 竖屏绝不叠字）
    const [ccx, ccy] = proj(cx, cy, cx, cy, zContent, ex);
    ctx.clip();
    if (s.theme === "poster") {
      const cubeR = Math.max(11, Math.min(24, cW * 0.13, cH * 0.21));
      const titleFs = Math.max(12, Math.min(17, cW * 0.09));
      const subFs = Math.max(9.5, Math.min(11, cW * 0.056));
      const totalBlockH = cubeR * 2 + 10 + titleFs + 6 + subFs;
      const cubeY = ccy - totalBlockH / 2 + cubeR;
      const titleY = cubeY + cubeR + 10 + titleFs * 0.45;
      const subY = titleY + titleFs * 0.55 + 9;
      drawPosterCube(
        ctx,
        ccx,
        cubeY,
        cubeR,
        hc ? null : COL.cream,
        hc ? COL.hcFg : COL.teal,
        hc ? 1.8 : 2,
      );
      ctx.fillStyle = hc ? COL.hcFg : COL.cream;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${titleFs}px "Noto Sans SC", sans-serif`;
      ctx.fillText("内容", ccx, titleY);
      ctx.font = `600 ${subFs}px "JetBrains Mono", monospace`;
      ctx.fillText(`CONTENT · ${m.contentW}px`, ccx, subY);
    } else if (s.theme === "notice") {
      ctx.fillStyle = hc ? COL.hcFg : COL.cream;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const tx = ccx - cW * 0.42;
      const ty = ccy - cH * 0.34;
      const avail = Math.max(40, cW * 0.84);
      ctx.font = `700 ${compact ? 12 : 14}px "Noto Sans SC", sans-serif`;
      ctx.fillText("导出完成", tx, ty);
      ctx.font = `400 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      const lines =
        avail < 120
          ? ["单文件已生成", "支持双击离线", "查看与分享。"]
          : ["单文件已生成，双击即可", "离线打开与分享。"];
      lines.forEach((ln, idx) => {
        ctx.fillText(ln, tx, ty + 20 + idx * 15);
      });
      ctx.font = `600 10px "JetBrains Mono", monospace`;
      ctx.fillText(`CONTENT ${m.contentW}px`, tx, ty + 20 + lines.length * 15 + 4);
    } else {
      // button theme
      ctx.fillStyle = hc ? COL.hcFg : COL.cream;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(11, Math.min(15, cW * 0.08))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(cW < 120 ? "保存" : "保存盒模型设置", ccx, ccy - 7);
      ctx.font = `600 10px "JetBrains Mono", monospace`;
      ctx.fillText(`${m.contentW}px × ${m.contentH}px`, ccx, ccy + 12);
    }
    ctx.restore();

    // 高对比模式下如果边框=0且没开护边，给出直观红字告警
    if (hc && s.border === 0 && !s.transparentOutline) {
      ctx.save();
      ctx.fillStyle = COL.hcWarn;
      ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("⚠ 系统剥离背景色后：盒子边界已完全消失", cx, slotY + slotPxH + 16);
      ctx.restore();
    }

    // 9. 直接拖拽双箭头微标（放在内容核左壁中点，避开右侧四条原海报引线）
    if (ex < 0.5) {
      const handleX = conX;
      const handleY = cy;
      ctx.save();
      ctx.fillStyle = hc ? COL.hcAccent : COL.yellow;
      ctx.strokeStyle = COL.black;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(handleX, handleY, compact ? 8.5 : 10.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COL.black;
      ctx.font = `700 ${compact ? 9.5 : 11.5}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", handleX, handleY + 0.5);
      ctx.restore();
    }

    // 10. 复刻 244 原海报右侧四道严格由上至下、互不交叉的水平引线与终端圆点
    const labelStartX = w - labelColW - padR + (compact ? 6 : 10);
    const yMargin = marginY + mH * 0.12;
    const yBorder = borderY + bH * 0.34;
    const yPad = padY + pH * 0.60;
    const yContent = conY + cH * 0.84;

    const leaderSpecs = [
      {
        id: "margin",
        zh: "外边距",
        en: "MARGIN",
        val: `${s.margin}px`,
        ok: m.pillars.margin.ok,
        anchor: proj(
          s.margin > 0 ? marginX + mW - Math.max(4, (s.margin * scale) / 2) : borderX + bW + 3,
          yMargin,
          cx,
          cy,
          zMargin,
          ex,
        ),
        rowY: topBand + stageH * 0.14,
      },
      {
        id: "border",
        zh: "边框",
        en: "BORDER",
        val: s.border === 0 && s.transparentOutline ? "护边" : `${s.border}px`,
        ok: m.pillars.border.ok,
        anchor: proj(
          borderX + bW - Math.max(1, (s.border * scale) / 2),
          yBorder,
          cx,
          cy,
          zBorder,
          ex,
        ),
        rowY: topBand + stageH * 0.38,
      },
      {
        id: "padding",
        zh: "内边距",
        en: "PADDING",
        val: `${s.padding}px`,
        ok: m.pillars.padding.ok,
        anchor: proj(
          s.padding > 0 ? padX + pW - Math.max(2, (s.padding * scale) / 2) : conX + cW,
          yPad,
          cx,
          cy,
          zPad,
          ex,
        ),
        rowY: topBand + stageH * 0.62,
      },
      {
        id: "content",
        zh: "内容",
        en: "CONTENT",
        val: `${m.contentW}px`,
        ok: m.pillars.content.ok,
        anchor: proj(conX + cW * 0.88, yContent, cx, cy, zContent, ex),
        rowY: topBand + stageH * 0.86,
      },
    ];

    const labelHitRects = [];
    const elbowBase = labelStartX - (compact ? 10 : 16);
    leaderSpecs.forEach((sp, idx) => {
      const isAct = s.activeLayer === sp.id;
      const lineCol = !sp.ok ? (hc ? COL.hcWarn : COL.danger) : hc ? COL.hcFg : COL.black;
      const ax = sp.anchor[0];
      const ay = sp.anchor[1];
      const ly = sp.rowY;

      ctx.save();
      // 阶梯错位转折点，确保四条引线从上到下永不交叉
      ctx.strokeStyle = lineCol;
      ctx.lineWidth = isAct ? 2.4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      if (Math.abs(ay - ly) < 5) {
        ctx.lineTo(labelStartX - 6, ay);
      } else {
        const elbowX = Math.max(ax + 6, elbowBase - (3 - idx) * (compact ? 2.5 : 4));
        ctx.lineTo(elbowX, ay);
        ctx.lineTo(elbowX, ly);
        ctx.lineTo(labelStartX - 6, ly);
      }
      ctx.stroke();

      // 终端实心圆点（原海报经典元素）
      ctx.fillStyle = lineCol;
      ctx.beginPath();
      ctx.arc(ax, ay, isAct ? 5 : 3.8, 0, Math.PI * 2);
      ctx.fill();
      if (!hc) {
        ctx.strokeStyle = COL.cream;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 标签底卡（选中时加反色/黑框高亮，便于点选）
      const boxW = labelColW - (compact ? 6 : 8);
      const boxH = compact ? 34 : 38;
      const bx = labelStartX - 4;
      const by = ly - boxH / 2;
      if (isAct) {
        ctx.fillStyle = hc ? COL.hcAccent : COL.black;
        ctx.fillRect(bx, by, boxW, boxH);
      } else if (!sp.ok) {
        ctx.fillStyle = hc ? "rgba(255,120,120,0.16)" : "rgba(196,30,34,0.12)";
        ctx.fillRect(bx, by, boxW, boxH);
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const textMain = isAct ? (hc ? COL.black : COL.yellow) : hc ? COL.hcFg : COL.black;
      const textSub = isAct
        ? hc
          ? COL.black
          : COL.cream
        : !sp.ok
          ? hc
            ? COL.hcWarn
            : COL.danger
          : hc
            ? "#C8D6D2"
            : COL.inkMuted;

      ctx.fillStyle = textMain;
      ctx.font = `700 ${compact ? 11.5 : 13.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText(sp.zh, labelStartX + 2, ly - 6);

      ctx.fillStyle = textSub;
      ctx.font = `600 ${compact ? 9.5 : 10.5}px "JetBrains Mono", monospace`;
      ctx.fillText(`${sp.val}`, labelStartX + (compact ? 42 : 54), ly - 6);

      ctx.font = `600 ${compact ? 8.5 : 9.5}px "Inter", sans-serif`;
      ctx.fillText(sp.en, labelStartX + 2, ly + 9);
      ctx.restore();

      labelHitRects.push({ id: sp.id, x: bx, y: by, w: boxW, h: boxH });
    });

    // 11. 底沿轻提示（不遮主体）
    ctx.save();
    ctx.fillStyle = hc ? "#B8C9C4" : COL.black;
    ctx.font = `500 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tip = compact
      ? "左右直拖画布调宽 · 点右侧选层"
      : "画布直拖内容核改声明宽 · 拖各层边墙改厚 · 点右侧标签选层并用 ←/→ 微调";
    ctx.fillText(tip, padL, h - 7);
    ctx.restore();

    ctx.restore();

    // 保存最新几何命中区用于指针交互
    hitZones = {
      cx,
      cy,
      scale,
      cRect: { x: conX, y: conY, w: cW, h: cH },
      pRect: { x: padX, y: padY, w: pW, h: pH },
      bRect: { x: borderX, y: borderY, w: bW, h: bH },
      mRect: { x: marginX, y: marginY, w: mW, h: mH },
      labels: labelHitRects,
    };

    // 返回是否还有动画在跑（静置后自动省电停止重画）
    return intro < 1 || Math.abs(targetExplode - explodeT) > 0.004;
  }

  function inRect(px, py, r, pad = 0) {
    return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
  }

  function classifyPoint(px, py) {
    if (!hitZones) return { kind: "layer", layer: "content" };
    for (const lb of hitZones.labels) {
      if (inRect(px, py, lb, 4)) return { kind: "label", layer: lb.id };
    }
    const { cRect, pRect, bRect, mRect } = hitZones;
    // 从内向外判断命中哪一层：内容核中心拖宽，奶油带拖 padding，黑框拖 border，粉带拖 margin
    if (inRect(px, py, cRect, 6)) return { kind: "layer", layer: "content" };
    if (inRect(px, py, pRect, 2)) return { kind: "layer", layer: "padding" };
    if (inRect(px, py, bRect, 5)) return { kind: "layer", layer: "border" };
    if (inRect(px, py, mRect, 12)) return { kind: "layer", layer: "margin" };
    return { kind: "layer", layer: "content" };
  }

  function localPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return [clientX - r.left, clientY - r.top];
  }

  let needsDraw = true;
  const { draw } = loop(canvas, (_t, dt, meta) => {
    if (meta.still || needsDraw) {
      needsDraw = renderFrame(dt, meta);
    }
  });

  function requestDraw() {
    needsDraw = true;
    if (reducedMotion.matches) draw();
  }

  // 指针与触摸拖拽：水平直拖顺滑重画，纵向滚动不拦截页面
  function startDrag(clientX, clientY, pointerId) {
    const [px, py] = localPoint(clientX, clientY);
    const hit = classifyPoint(px, py);
    if (hit.kind === "label") {
      onSelectLayer(hit.layer);
      requestDraw();
      return false;
    }
    const m = getMetrics();
    const layer = hit.layer;
    const param = layer === "content" ? "width" : layer;
    onSelectLayer(layer);
    drag = {
      pointerId,
      layer,
      param,
      startX: clientX,
      startY: clientY,
      startVal: m.state[param],
      lastVal: m.state[param],
      sideSign: hitZones && px < hitZones.cx - 22 ? -1 : 1,
      scale: hitZones ? hitZones.scale : 1,
      locked: false,
    };
    return true;
  }

  function moveDrag(clientX, clientY) {
    if (!drag) return;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (!drag.locked) {
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.5) {
        drag = null;
        return;
      }
      drag.locked = true;
    }
    // 拖拽换算：内容核直接按可视比例左右拉宽/收窄，每帧仅在 rAF 重绘一次，省电且流畅
    const dir = drag.param === "width" ? 1 : drag.sideSign;
    const sensitivity =
      drag.param === "border" ? 0.16 : drag.param === "width" ? 0.85 / Math.max(0.45, drag.scale) : 0.55 / Math.max(0.45, drag.scale);
    const nextVal = clampParam(drag.param, drag.startVal + dx * dir * sensitivity);
    if (nextVal !== drag.lastVal) {
      drag.lastVal = nextVal;
      onChange({ [drag.param]: nextVal });
    } else {
      needsDraw = true;
    }
  }

  function endDrag() {
    drag = null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (startDrag(e.clientX, e.clientY, e.pointerId)) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (drag && e.pointerId === drag.pointerId) {
      moveDrag(e.clientX, e.clientY);
      return;
    }
    const [px, py] = localPoint(e.clientX, e.clientY);
    const hit = classifyPoint(px, py);
    const nextCur = hit.kind === "label" ? "pointer" : "ew-resize";
    if (nextCur !== hoverCursor) {
      hoverCursor = nextCur;
      canvas.style.cursor = nextCur;
    }
  });

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 兼容 CDP dispatchTouchEvent（perf.mjs 触屏采样）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length || drag) return;
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY, "touch");
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !drag || drag.pointerId !== "touch") return;
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
      if (drag && drag.locked) e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", () => {
    if (drag && drag.pointerId === "touch") endDrag();
  });

  const ro = new ResizeObserver(() => {
    resize();
    requestDraw();
  });
  ro.observe(canvas);
  resize();
  requestDraw();

  return { redraw: requestDraw };
}
