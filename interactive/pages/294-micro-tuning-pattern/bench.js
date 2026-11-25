// 294 微调模式 · 主舞台 2D Canvas 活体微距校对台 + 8× 物理像素放大镜
// 严格单真源：所有坐标、间距、亚像素灰阶覆盖率和交互命中区均直接读自 model.js 状态。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  MODES,
  evaluate,
  formatNum,
  formatSigned,
  fracPart,
  getLoupeData,
  isMult4,
} from "./model.js";

const COL = {
  paper: "#FBF9F7",
  paperDim: "#F5F1EE",
  grid: "#E4DDD6",
  gridStrong: "#CFC7BE",
  ink: "#070706",
  inkMuted: "#4A4640",
  blue: "#0025D3",
  blueSoft: "rgba(0, 37, 211, 0.10)",
  blueLine: "rgba(0, 37, 211, 0.45)",
  red: "#EE3701",
  redText: "#B82800",
  redSoft: "rgba(238, 55, 1, 0.11)",
  redLine: "rgba(238, 55, 1, 0.55)",
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeOutCubic = (x) => 1 - (1 - x) ** 3;
const crisp = (v) => Math.round(v) + 0.5;

export function mountBench(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 440;
  let hitZones = [];
  let intro = 0;
  let dragInfo = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 根据视口宽自适应紧凑度（保证 390 手机不挤、1440/2560 宽舒清晰）
  function drawFrame(t, dt, { still }) {
    resize();
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + (dt > 0 ? dt / 0.72 : 0.06));
    }
    const p = easeOutCubic(intro);
    const ev = evaluate(state);
    const loupe = getLoupeData(state);
    const compact = cssW < 520;
    const W = cssW;
    const H = cssH;

    hitZones = [];

    // 1. 工程图纸底面 + 4px/16px 精细网格
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, W, H);

    if (state.showGrid) {
      const step = compact ? 16 : 20;
      ctx.strokeStyle = COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = step; x < W; x += step) {
        const cx = crisp(x);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, H);
      }
      for (let y = step; y < H; y += step) {
        const cy = crisp(y);
        ctx.moveTo(0, cy);
        ctx.lineTo(W, cy);
      }
      ctx.stroke();
    }

    // 2. 顶部微距标尺条与模式标签
    const padX = compact ? 14 : 24;
    const topBarH = compact ? 28 : 32;
    ctx.fillStyle = COL.paperDim;
    ctx.fillRect(0, 0, W, topBarH);
    ctx.strokeStyle = COL.gridStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, crisp(topBarH));
    ctx.lineTo(W, crisp(topBarH));
    ctx.stroke();

    // 左侧 01 蓝底白字签（忠实复刻 294 原海报）
    const tagW = compact ? 112 : 148;
    ctx.fillStyle = ev.allPass ? COL.blue : COL.ink;
    ctx.fillRect(padX, 5, tagW, topBarH - 10);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(
      `01 ${MODES[state.mode].label}`,
      padX + 8,
      topBarH / 2 + 0.5
    );

    // 顶条右侧实时焦距状态
    ctx.fillStyle = loupe.isSharp ? COL.blue : COL.redText;
    ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(
      `${loupe.targetLabel} · ${loupe.metricText}`,
      W - padX,
      topBarH / 2 + 0.5
    );
    ctx.textAlign = "left";

    // 计算三大活体分区高度（宽屏右侧放 8× 放大镜；窄高屏放底栏条；窄矮横屏放右下角不遮挡任何字形）
    const tallCompact = compact && H >= 325;
    const loupeBottomH = tallCompact ? 86 : 0;
    const loupeW = compact ? 0 : Math.min(168, W * 0.24);
    const workRight = compact ? W - padX : W - padX - loupeW - 18;
    const workW = Math.max(180, workRight - padX);
    const usableH = H - loupeBottomH;

    // ========== ZONE A: 01 基线对齐微调区 ==========
    const zoneATop = topBarH + (compact ? 12 : 16);
    const zoneAH = compact ? (usableH - topBarH) * 0.44 : (usableH - topBarH) * 0.41;
    const baseY = Math.round(zoneATop + zoneAH * 0.74);
    const capH = compact ? Math.min(44, zoneAH * 0.5) : Math.min(58, zoneAH * 0.52);
    const capY = Math.round(baseY - capH);

    // 绘基线与顶线（动画沿 p 展开）
    const lineEndX = padX + workW * p;
    ctx.save();
    // 顶高参考细线
    ctx.strokeStyle = "rgba(0, 37, 211, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padX, crisp(capY));
    ctx.lineTo(lineEndX, crisp(capY));
    ctx.stroke();
    ctx.setLineDash([]);

    // 主基线（全对齐变深钴蓝，有偏移带朱红警告感）
    ctx.strokeStyle = ev.pillars.align.ok ? COL.blue : COL.blueLine;
    ctx.lineWidth = ev.pillars.align.ok ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(padX, crisp(baseY));
    ctx.lineTo(lineEndX, crisp(baseY));
    ctx.stroke();
    ctx.restore();

    // 基线左角标
    ctx.fillStyle = COL.blue;
    ctx.font = `700 ${compact ? 10 : 10.5}px "Space Mono", monospace`;
    ctx.textBaseline = "top";
    ctx.fillText("0pt BASELINE", padX, baseY + 5);

    // 绘制 6 个可点选微调的字形/导航项
    const items = state.items;
    const count = items.length;
    const slotW = workW / count;
    // 放大视觉偏移比例，使 1.5pt 清晰可见又忠于微调克制感
    const visualScaleY = compact ? 5.2 : 6.4;
    const visualScaleX = compact ? 4.5 : 5.5;

    let focusAnchor = { x: padX + workW * 0.5, y: baseY - capH * 0.5 };

    items.forEach((it, idx) => {
      const cx = padX + slotW * (idx + 0.5);
      const bx = cx + it.dx * visualScaleX;
      const by = baseY + it.dy * visualScaleY;
      const isFocus = state.focus === it.id;
      const offAlign = Math.abs(it.dy) > 0.25;
      const offSub = fracPart(it.dx) > 0.05 || fracPart(it.dy) > 0.05;
      const hasErr = offAlign || offSub;

      const boxW = Math.min(slotW - 6, compact ? 46 : 74);
      const boxH = capH + 14;
      const rx = cx - boxW / 2;
      const ry = capY - 8;

      hitZones.push({
        id: it.id,
        kind: "item",
        x: rx,
        y: ry,
        w: boxW,
        h: boxH + 14,
      });

      if (isFocus) {
        focusAnchor = { x: bx, y: by - capH * 0.45 };
        ctx.fillStyle = hasErr ? COL.redSoft : COL.blueSoft;
        ctx.fillRect(Math.round(rx), Math.round(ry), Math.round(boxW), Math.round(boxH));
        ctx.strokeStyle = hasErr ? COL.red : COL.blue;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(crisp(rx), crisp(ry), Math.round(boxW) - 1, Math.round(boxH) - 1);
      } else if (hasErr) {
        ctx.strokeStyle = "rgba(238, 55, 1, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(crisp(rx), crisp(ry), Math.round(boxW) - 1, Math.round(boxH) - 1);
        ctx.setLineDash([]);
      }

      // 字符底脚偏移误差线（红线实标 +1.5pt / -1.0pt）
      if (offAlign) {
        ctx.strokeStyle = COL.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(crisp(cx - boxW * 0.38), crisp(by));
        ctx.lineTo(crisp(cx + boxW * 0.38), crisp(by));
        ctx.stroke();

        // 垂直连线回基线
        ctx.beginPath();
        ctx.moveTo(crisp(cx + boxW * 0.38), crisp(by));
        ctx.lineTo(crisp(cx + boxW * 0.38), crisp(baseY));
        ctx.stroke();
      }

      // 根据模式绘出真实字形或 UI 按钮组件
      ctx.save();
      if (offSub) {
        // 亚像素偏移在主画布也给出轻微双影提示，放大镜看更彻底
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = COL.ink;
        drawSpecimenItem(ctx, it, bx + 1.5, by, capH, compact);
        ctx.globalAlpha = 0.88;
      }
      ctx.fillStyle = it.kind === "cta" ? COL.blue : COL.ink;
      drawSpecimenItem(ctx, it, bx, by, capH, compact);
      ctx.restore();

      // 单项顶部或底部偏差标尺读数
      ctx.font = `700 ${compact ? 10 : 10.5}px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      if (offAlign) {
        ctx.fillStyle = COL.redText;
        ctx.fillText(formatSigned(-it.dy, "pt"), cx, ry - 2);
      } else if (offSub) {
        ctx.fillStyle = COL.redText;
        ctx.fillText(`${formatNum(fracPart(it.dx))}px虚`, cx, ry - 2);
      } else if (isFocus) {
        ctx.fillStyle = COL.blue;
        ctx.fillText("0pt ✓", cx, ry - 2);
      }
    });
    ctx.textAlign = "left";

    // ========== ZONE B: 02 间距微调卡尺 + 0–64px 标尺 + 04 描边居中环 ==========
    const zoneBTop = Math.round(baseY + (compact ? 22 : 24));
    const zoneBH = usableH - zoneBTop - (compact ? 8 : 16);

    // 中缝浅隔线
    ctx.strokeStyle = COL.gridStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, crisp(zoneBTop));
    ctx.lineTo(workRight, crisp(zoneBTop));
    ctx.stroke();

    // 区域小标：02 间距微调 & 04 描边居中（紧凑横屏右侧另留 miniLoupe 位，绝不压字）
    const landscapeMiniLoupe = compact && !tallCompact;
    const miniW = landscapeMiniLoupe ? 64 : 0;
    const strokeZoneW = compact
      ? Math.min(104, (workW - miniW) * 0.34)
      : Math.min(164, workW * 0.27);
    const gapZoneW = workW - strokeZoneW - miniW - (compact ? 12 : 18) - (landscapeMiniLoupe ? 10 : 0);

    ctx.fillStyle = ev.pillars.spacing.ok ? COL.blue : COL.red;
    ctx.fillRect(padX, zoneBTop + 7, compact ? 74 : 92, 17);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("02 间距卡尺", padX + 6, zoneBTop + 15.5);

    // 绘制三块几何元素与两道活体间距卡尺（给上方卡尺数字留足干净空隙，永不撞标题）
    const [g1, g2] = state.gaps;
    const blockSize = compact ? Math.min(26, zoneBH * 0.24) : Math.min(34, zoneBH * 0.26);
    const barW = blockSize * 1.4;
    const pxScale = compact ? 1.05 : 1.65;
    const totalBlocksW = blockSize + g1 * pxScale + blockSize + g2 * pxScale + barW;
    const startX = Math.round(padX + Math.max(4, (gapZoneW - totalBlocksW) * 0.42));
    const blockMidY = Math.round(zoneBTop + (compact ? 62 : 70));

    const b0x = startX;
    const b1x = b0x + blockSize + g1 * pxScale;
    const b2x = b1x + blockSize + g2 * pxScale;

    // 三个模块按题材绘制（原海报为实心黑方、黑圆、黑条）
    const blocks = MODES[state.mode].blocks;
    drawGapBlock(ctx, blocks[0].shape, b0x, blockMidY - blockSize / 2, blockSize, blockSize, COL.ink);
    drawGapBlock(ctx, blocks[1].shape, b1x, blockMidY - blockSize / 2, blockSize, blockSize, COL.ink);
    drawGapBlock(ctx, blocks[2].shape, b2x, blockMidY - blockSize / 2, barW, blockSize, state.mode === "nav" ? COL.blue : COL.ink);

    // 两段间距标尺卡尺（可点选 & 横拖！）
    const gapSpecs = [
      { id: "gap1", x0: b0x + blockSize, x1: b1x, val: g1 },
      { id: "gap2", x0: b1x + blockSize, x1: b2x, val: g2 },
    ];
    for (const gs of gapSpecs) {
      const isF = state.focus === gs.id;
      const gOk = isMult4(gs.val) && gs.val >= 8 && gs.val <= 32 && Math.abs(g1 - g2) <= 0.5;
      const color = gOk ? COL.blue : COL.red;
      const colorText = gOk ? COL.blue : COL.redText;
      const calY = blockMidY - blockSize / 2 - 10;

      hitZones.push({
        id: gs.id,
        kind: "gap",
        x: gs.x0 - 10,
        y: blockMidY - blockSize / 2 - 22,
        w: Math.max(30, gs.x1 - gs.x0 + 20),
        h: blockSize + 36,
      });

      if (isF) {
        focusAnchor = { x: (gs.x0 + gs.x1) / 2, y: blockMidY };
        ctx.fillStyle = gOk ? COL.blueSoft : COL.redSoft;
        ctx.fillRect(gs.x0, blockMidY - blockSize / 2 - 4, gs.x1 - gs.x0, blockSize + 8);
      }

      // 虚线引脚 + 横卡尺
      ctx.strokeStyle = color;
      ctx.lineWidth = isF ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.moveTo(crisp(gs.x0), crisp(calY - 3));
      ctx.lineTo(crisp(gs.x0), crisp(blockMidY + blockSize / 2 + 4));
      ctx.moveTo(crisp(gs.x1), crisp(calY - 3));
      ctx.lineTo(crisp(gs.x1), crisp(blockMidY + blockSize / 2 + 4));
      ctx.moveTo(crisp(gs.x0), crisp(calY));
      ctx.lineTo(crisp(gs.x1), crisp(calY));
      ctx.stroke();

      ctx.fillStyle = colorText;
      ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${formatNum(gs.val)}px`, (gs.x0 + gs.x1) / 2, calY - 3);
    }
    ctx.textAlign = "left";

    // 原海报 0–64(px) 标尺刻度条
    const rulerY = Math.round(blockMidY + blockSize / 2 + (compact ? 16 : 20));
    const rulerW = Math.min(gapZoneW - 6, compact ? 220 : 420);
    if (rulerY + 16 < usableH) {
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, crisp(rulerY));
      ctx.lineTo(padX + rulerW * p, crisp(rulerY));
      ctx.stroke();

      const maxTick = 64;
      for (let tk = 0; tk <= maxTick; tk += 2) {
        const tx = padX + (tk / maxTick) * rulerW;
        if (tx > padX + rulerW * p) break;
        const isMajor = tk % 8 === 0;
        const isMid = tk % 4 === 0;
        const th = isMajor ? 8 : isMid ? 5 : 3;
        ctx.strokeStyle = isMajor ? COL.ink : COL.inkMuted;
        ctx.beginPath();
        ctx.moveTo(crisp(tx), crisp(rulerY));
        ctx.lineTo(crisp(tx), crisp(rulerY + th));
        ctx.stroke();
        if (isMajor && (!compact || tk % 16 === 0)) {
          ctx.fillStyle = COL.inkMuted;
          ctx.font = `400 10px "Space Mono", monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(tk === 64 ? "64px" : String(tk), tx, rulerY + 9);
        }
      }

      // 在标尺上标出当前 G1 的指针三角
      const g1x = padX + (clamp(g1, 0, 64) / 64) * rulerW;
      ctx.fillStyle = ev.pillars.spacing.ok ? COL.blue : COL.red;
      ctx.beginPath();
      ctx.moveTo(g1x, rulerY - 1);
      ctx.lineTo(g1x - 4, rulerY - 7);
      ctx.lineTo(g1x + 4, rulerY - 7);
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = "left";
    }

    // ========== ZONE C: 04 描边居中校对环 ==========
    const strokeX = padX + gapZoneW + (compact ? 10 : 18);
    const strokeCenterX = Math.round(strokeX + strokeZoneW / 2);
    const strokeCenterY = Math.round(blockMidY + 2);
    const ringR = compact ? 18 : 26;
    const strokeOk = ev.pillars.tune.strokeOk;
    const isStrokeFocus = state.focus === "stroke";

    // 左竖隔线
    ctx.strokeStyle = COL.gridStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(crisp(strokeX - (compact ? 5 : 9)), zoneBTop + 8);
    ctx.lineTo(crisp(strokeX - (compact ? 5 : 9)), usableH - 10);
    ctx.stroke();

    ctx.fillStyle = strokeOk ? COL.blue : COL.red;
    ctx.fillRect(strokeX, zoneBTop + 7, compact ? 74 : 92, 17);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("04 描边居中", strokeX + 6, zoneBTop + 15.5);

    hitZones.push({
      id: "stroke",
      kind: "stroke",
      x: strokeX,
      y: zoneBTop + 6,
      w: strokeZoneW,
      h: zoneBH - 8,
    });

    if (isStrokeFocus) {
      focusAnchor = { x: strokeCenterX + state.strokeOffset * 4, y: strokeCenterY };
      ctx.fillStyle = strokeOk ? COL.blueSoft : COL.redSoft;
      ctx.fillRect(strokeX, zoneBTop + 30, strokeZoneW, Math.max(62, zoneBH - 36));
      ctx.strokeStyle = strokeOk ? COL.blue : COL.red;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(crisp(strokeX), crisp(zoneBTop + 30), Math.round(strokeZoneW) - 1, Math.round(Math.max(62, zoneBH - 36)) - 1);
    }

    // 基准框线与中心轴
    ctx.strokeStyle = COL.gridStrong;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(crisp(strokeCenterX), strokeCenterY - ringR - 9);
    ctx.lineTo(crisp(strokeCenterX), strokeCenterY + ringR + 9);
    ctx.moveTo(strokeCenterX - ringR - 9, crisp(strokeCenterY));
    ctx.lineTo(strokeCenterX + ringR + 9, crisp(strokeCenterY));
    ctx.stroke();
    ctx.setLineDash([]);

    // 外参考方框（固定）+ 内部圆环（随 strokeOffset 偏心移动）
    ctx.strokeStyle = "rgba(0,37,211,0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      crisp(strokeCenterX - ringR - 4),
      crisp(strokeCenterY - ringR - 4),
      (ringR + 4) * 2,
      (ringR + 4) * 2
    );

    const offVis = state.strokeOffset * (compact ? 2.4 : 3.2);
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = compact ? 2.5 : 3;
    ctx.beginPath();
    ctx.arc(strokeCenterX + offVis, strokeCenterY, ringR - 3, 0, Math.PI * 2);
    ctx.stroke();

    // 中心偏移点
    ctx.fillStyle = strokeOk ? COL.blue : COL.red;
    ctx.beginPath();
    ctx.arc(strokeCenterX + offVis, strokeCenterY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = strokeOk ? COL.blue : COL.redText;
    ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      strokeOk ? "居中 0px ✓" : `偏心 ${formatSigned(state.strokeOffset)}`,
      strokeCenterX,
      strokeCenterY + ringR + 7
    );
    ctx.textAlign = "left";

    // ========== ZONE D: 嵌入式 8× 物理像素放大镜（全尺寸零遮挡布局） ==========
    if (!compact) {
      drawPixelLoupe(ctx, workRight + 14, topBarH + 12, loupeW, H - topBarH - 24, loupe, ev);
    } else if (tallCompact) {
      // 390×844 竖屏：放底部通栏 8× 像素放大条，填满下方留白且绝不遮挡任何字形
      drawCompactLoupeStrip(ctx, padX, usableH + 4, W - padX * 2, loupeBottomH - 12, loupe, ev);
    } else {
      // 844×390 横屏：放在右下角描边环旁，绝不压住「知」字
      const mx = strokeX + strokeZoneW + 10;
      drawMiniLoupe(ctx, mx, zoneBTop + 26, Math.min(58, W - padX - mx), loupe);
    }

    // 底部极细操作提示线（宽屏）
    if (!compact) {
      ctx.fillStyle = COL.inkMuted;
      ctx.font = `400 11px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.fillText(
        "点选任意字形/间距/圆环 · 画布横拖微调并观察 8× 像素镜 · 方向键每次 1px（Shift 4px）",
        padX,
        H - 4
      );
    }

    void focusAnchor;
  }

  function drawSpecimenItem(ctx, it, bx, by, capH, compact) {
    if (it.kind === "badge") {
      const s = compact ? 22 : 30;
      ctx.fillStyle = COL.blue;
      ctx.fillRect(Math.round(bx - s / 2), Math.round(by - s), s, s);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 ${Math.round(s * 0.56)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, bx, by - s / 2 + 1);
      return;
    }
    if (it.kind === "cta") {
      const bw = compact ? 42 : 66;
      const bh = compact ? 24 : 32;
      ctx.fillStyle = COL.blue;
      ctx.fillRect(Math.round(bx - bw / 2), Math.round(by - bh), bw, bh);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${compact ? 11 : 13}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, bx, by - bh / 2 + 0.5);
      return;
    }
    if (it.kind === "nav" || it.kind === "eyebrow") {
      const fs = compact ? 15 : 22;
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(it.label, bx, by - 3);
      return;
    }
    const fs = Math.round(capH * (compact ? 0.88 : 0.92));
    ctx.font = `900 ${fs}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(it.label, bx, by - 2);
  }

  function drawGapBlock(ctx, shape, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "bar") {
      const bh = Math.round(h * 0.42);
      ctx.fillRect(Math.round(x), Math.round(y + (h - bh) / 2), Math.round(w), bh);
    } else if (shape === "pill") {
      const bh = Math.round(h * 0.68);
      ctx.fillRect(Math.round(x), Math.round(y + (h - bh) / 2), Math.round(w), bh);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(Math.round(x + 6), Math.round(y + h / 2 - 2), Math.max(8, Math.round(w - 12)), 4);
    } else if (shape === "card") {
      ctx.strokeStyle = fill;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(x) + 1, Math.round(y) + 1, Math.round(w) - 2, Math.round(h) - 2);
      ctx.fillStyle = fill;
      ctx.fillRect(Math.round(x + 5), Math.round(y + 6), Math.round(w - 10), 4);
      ctx.fillStyle = COL.gridStrong;
      ctx.fillRect(Math.round(x + 5), Math.round(y + 14), Math.round(w - 14), 3);
      ctx.fillRect(Math.round(x + 5), Math.round(y + 20), Math.round(w - 10), 3);
    } else {
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
  }

  // 右侧 8× 物理像素放大镜：真实按亚像素覆盖率逐格上色，0.3px 立刻发灰、0px 立刻刀锋锐利
  function drawPixelLoupe(ctx, x, y, w, h, loupe, ev) {
    ctx.save();
    ctx.fillStyle = COL.paperDim;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.strokeStyle = loupe.isSharp ? COL.blue : COL.red;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crisp(x), crisp(y), Math.round(w) - 1, Math.round(h) - 1);

    // 顶签
    ctx.fillStyle = loupe.isSharp ? COL.blue : COL.red;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 22);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 10.5px "Space Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("8× PIXEL LOUPE", x + 8, y + 11);

    // 像素网格区（9×9 物理像素格）
    const pad = 12;
    const gridN = 9;
    const gridSize = Math.min(w - pad * 2, h - 106);
    const cell = Math.floor(gridSize / gridN);
    const realGrid = cell * gridN;
    const gx = Math.round(x + (w - realGrid) / 2);
    const gy = Math.round(y + 34);

    // 计算真实亚像素边界：按 axis (x 或 y) 真实呈现横向或纵向亚像素灰化
    const frac = loupe.subpixel;
    const isY = loupe.axis === "y";
    const blockStart = 2 + (isY ? 0 : frac);
    const blockEnd = 6 + (isY ? 0 : frac);
    const rowStart = 2 + (isY ? frac : 0);
    const rowEnd = 7 + (isY ? frac : 0);

    for (let r = 0; r < gridN; r++) {
      for (let c = 0; c < gridN; c++) {
        const ox = clamp(Math.min(c + 1, blockEnd) - Math.max(c, blockStart), 0, 1);
        const oy = clamp(Math.min(r + 1, rowEnd) - Math.max(r, rowStart), 0, 1);
        const cov = ox * oy;
        const baseR = 251, baseG = 249, baseB = 247;
        const inkR = 7, inkG = 7, inkB = 6;
        const rr = Math.round(baseR + (inkR - baseR) * cov);
        const gg = Math.round(baseG + (inkG - baseG) * cov);
        const bb = Math.round(baseB + (inkB - baseB) * cov);
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell);

        if (cov > 0.03 && cov < 0.97) {
          ctx.strokeStyle = "rgba(238, 55, 1, 0.85)";
          ctx.lineWidth = 1;
          ctx.strokeRect(gx + c * cell + 0.5, gy + r * cell + 0.5, cell - 1, cell - 1);
        }
      }
    }

    // 像素格细线
    ctx.strokeStyle = "rgba(0, 37, 211, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= gridN; i++) {
      ctx.moveTo(crisp(gx + i * cell), gy);
      ctx.lineTo(crisp(gx + i * cell), gy + realGrid);
      ctx.moveTo(gx, crisp(gy + i * cell));
      ctx.lineTo(gx + realGrid, crisp(gy + i * cell));
    }
    ctx.stroke();

    // 底部结论标签（忠实复刻原海报 04 像素对齐检查）
    const infoY = gy + realGrid + 10;
    ctx.fillStyle = loupe.isSharp ? COL.blue : COL.redText;
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "top";
    ctx.fillText(
      loupe.isSharp ? "0.0px 对齐" : `${isY ? "Y" : "X"} ${formatNum(frac)}px 偏移`,
      x + 10,
      infoY
    );

    ctx.fillStyle = COL.ink;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.fillText(
      loupe.isSharp ? "边缘锐利清晰" : "抗锯齿灰化模糊",
      x + 10,
      infoY + 16
    );

    ctx.fillStyle = COL.inkMuted;
    ctx.font = `400 10.5px "Noto Sans SC", sans-serif`;
    ctx.fillText(
      ev.allPass ? "三项校准全部通过" : `尚有 ${ev.issueCount} 处待校准`,
      x + 10,
      infoY + 35
    );
    ctx.restore();
  }

  function drawCompactLoupeStrip(ctx, x, y, w, h, loupe, ev) {
    ctx.save();
    ctx.fillStyle = COL.paperDim;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.strokeStyle = loupe.isSharp ? COL.blue : COL.red;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crisp(x), crisp(y), Math.round(w) - 1, Math.round(h) - 1);

    const gridN = 6;
    const cell = Math.floor((h - 14) / gridN);
    const real = cell * gridN;
    const gx = Math.round(x + 8);
    const gy = Math.round(y + (h - real) / 2);
    const frac = loupe.subpixel;
    const isY = loupe.axis === "y";

    for (let r = 0; r < gridN; r++) {
      for (let c = 0; c < gridN; c++) {
        const ox = clamp(Math.min(c + 1, 4 + (isY ? 0 : frac)) - Math.max(c, 1 + (isY ? 0 : frac)), 0, 1);
        const oy = clamp(Math.min(r + 1, 5 + (isY ? frac : 0)) - Math.max(r, 1 + (isY ? frac : 0)), 0, 1);
        const cov = ox * oy;
        const v = Math.round(251 + (7 - 251) * cov);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell);
        if (cov > 0.03 && cov < 0.97) {
          ctx.strokeStyle = "rgba(238, 55, 1, 0.85)";
          ctx.lineWidth = 1;
          ctx.strokeRect(gx + c * cell + 0.5, gy + r * cell + 0.5, cell - 1, cell - 1);
        }
      }
    }
    ctx.strokeStyle = "rgba(0, 37, 211, 0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(crisp(gx), crisp(gy), real - 1, real - 1);

    const tx = gx + real + 12;
    ctx.fillStyle = loupe.isSharp ? COL.blue : COL.red;
    ctx.fillRect(tx, y + 8, 96, 16);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.fillText("8× PIXEL LOUPE", tx + 5, y + 16);

    ctx.fillStyle = loupe.isSharp ? COL.blue : COL.redText;
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "top";
    ctx.fillText(
      loupe.isSharp ? "0.0px 对齐 · 边缘锐利" : `${isY ? "Y" : "X"} ${formatNum(frac)}px 偏移 · 抗锯齿发虚`,
      tx,
      y + 30
    );

    ctx.fillStyle = COL.inkMuted;
    ctx.font = `400 10.5px "Noto Sans SC", sans-serif`;
    ctx.fillText(
      ev.allPass ? "三项校准全部通过 · 可换标本再测" : "点选上方元件 · 左右横拖即可微调",
      tx,
      y + 49
    );
    ctx.restore();
  }

  function drawMiniLoupe(ctx, x, y, size, loupe) {
    const gridN = 6;
    const cell = Math.max(6, Math.floor(size / gridN));
    const real = cell * gridN;
    const frac = loupe.subpixel;
    const isY = loupe.axis === "y";
    ctx.save();
    for (let r = 0; r < gridN; r++) {
      for (let c = 0; c < gridN; c++) {
        const ox = clamp(Math.min(c + 1, 4 + (isY ? 0 : frac)) - Math.max(c, 1 + (isY ? 0 : frac)), 0, 1);
        const oy = clamp(Math.min(r + 1, 5 + (isY ? frac : 0)) - Math.max(r, 1 + (isY ? frac : 0)), 0, 1);
        const cov = ox * oy;
        const v = Math.round(251 + (7 - 251) * cov);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
      }
    }
    ctx.strokeStyle = loupe.isSharp ? COL.blue : COL.red;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crisp(x), crisp(y), real - 1, real - 1);
    ctx.fillStyle = loupe.isSharp ? COL.blue : COL.red;
    ctx.fillRect(x, y + real, real, 14);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 9.5px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(loupe.isSharp ? "8× 0px" : `8× .${Math.round(frac * 10)}`, x + real / 2, y + real + 7);
    ctx.restore();
  }

  const ctl = loop(canvas, drawFrame);

  // ---------- 指针与触屏交互（严格支持 perf.mjs 水平拖拽 + 触屏竖滚 pan-y） ----------
  function pointInCanvas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTest(pt) {
    for (let i = hitZones.length - 1; i >= 0; i--) {
      const z = hitZones[i];
      if (pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) {
        return z;
      }
    }
    return null;
  }

  function startDrag(clientX, clientY, isTouch) {
    const pt = pointInCanvas(clientX, clientY);
    const hit = hitTest(pt);
    if (hit) {
      state.focus = hit.id;
    } else if (pt.y > cssH * 0.48) {
      state.focus = pt.x > cssW * 0.62 ? "stroke" : "gap1";
    }
    const f = state.focus;
    const isGlyph = /^g\d+$/.test(f);
    const item = isGlyph ? state.items.find((it) => it.id === f) : null;
    dragInfo = {
      startX: clientX,
      startY: clientY,
      isTouch,
      focus: f,
      initDx: item ? item.dx : 0,
      initDy: item ? item.dy : 0,
      initGap0: state.gaps[0],
      initGap1: state.gaps[1],
      initStroke: state.strokeOffset,
    };
    onChange();
    ctl.draw();
  }

  function moveDrag(clientX, clientY) {
    if (!dragInfo) return;
    const dxPx = clientX - dragInfo.startX;
    const dyPx = clientY - dragInfo.startY;
    const step = state.step;
    const snap = (v) => (step >= 1 ? Math.round(v / step) * step : Math.round(v * 10) / 10);

    const f = dragInfo.focus;
    if (/^g\d+$/.test(f)) {
      const item = state.items.find((it) => it.id === f);
      if (!item) return;
      // 横拖调亚像素/水平偏差（触屏和 perf.mjs 横拖都直接驱动重绘）
      const ndx = clamp(snap(dragInfo.initDx + dxPx / 28), -4, 4);
      item.dx = Math.round(ndx * 10) / 10;
      // 鼠标模式同时支持纵拖直接校准基线；触屏用 pan-y 保留顺畅滚页
      if (!dragInfo.isTouch) {
        const ndy = clamp(snap(dragInfo.initDy + dyPx / 18), -4, 4);
        item.dy = Math.abs(ndy) < 0.15 ? 0 : Math.round(ndy * 10) / 10;
      }
    } else if (f === "gap1" || f === "gap2") {
      const idx = f === "gap1" ? 0 : 1;
      const base = idx === 0 ? dragInfo.initGap0 : dragInfo.initGap1;
      const nv = clamp(snap(base + dxPx / 6), 4, 44);
      state.gaps[idx] = Math.round(nv * 10) / 10;
      if (state.linkGaps) state.gaps[1 - idx] = state.gaps[idx];
    } else if (f === "stroke") {
      const nv = clamp(snap(dragInfo.initStroke + dxPx / 26), -3, 3);
      state.strokeOffset = Math.abs(nv) < 0.15 ? 0 : Math.round(nv * 10) / 10;
    }
    onChange();
    ctl.draw();
  }

  function endDrag() {
    dragInfo = null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    startDrag(e.clientX, e.clientY, false);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || !dragInfo) return;
    moveDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", (e) => { if (e.pointerType !== "touch") endDrag(); });
  canvas.addEventListener("pointercancel", (e) => { if (e.pointerType !== "touch") endDrag(); });

  // 兼容直接派发 TouchEvent 的工具（例如 tools/perf.mjs 的 Input.dispatchTouchEvent）
  canvas.addEventListener("touchstart", (e) => {
    const t0 = e.touches[0];
    if (!t0) return;
    startDrag(t0.clientX, t0.clientY, true);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    const t0 = e.touches[0];
    if (!t0 || !dragInfo) return;
    moveDrag(t0.clientX, t0.clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", endDrag, { passive: true });
  canvas.addEventListener("touchcancel", endDrag, { passive: true });

  window.addEventListener("resize", () => ctl.draw());

  return {
    draw: () => ctl.draw(),
  };
}
