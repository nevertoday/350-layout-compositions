// 03 节深森林暗室：Cowan (2001) 工作记忆 4 组块与 5 秒扫读留存画布（示意）
// 拖动步骤数量滑块（2–9 步），实时观察听众 5 秒内能记住哪些阶段，以及把 8 步打包成 4 步后的视觉落差

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./model.js";

const RAW_STEPS = [
  "拉表",
  "访谈",
  "定位",
  "拆因",
  "排期",
  "开发",
  "联调",
  "发布",
  "复盘",
];

const CHUNK_GROUPS = [
  { name: "发现", range: [0, 2] },
  { name: "分析", range: [3, 4] },
  { name: "执行", range: [5, 6] },
  { name: "输出", range: [7, 8] },
];

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function mountChunkStage(canvas, getStepCount) {
  const ctx = canvas.getContext("2d");
  let cssW = 720;
  let cssH = 260;
  let dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(r.width));
    cssH = Math.max(210, Math.round(r.height));
    dpr = pixelRatio(cssW < 500 ? 1.5 : 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  resize();
  new ResizeObserver(() => {
    resize();
    ctl.draw();
  }).observe(canvas);

  const ctl = loop(canvas, (t, _dt, { still }) => {
    const count = getStepCount();
    const compact = cssW < 520;
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#04251A";
    ctx.fillRect(0, 0, cssW, cssH);

    // 顶部状态标尺
    const padX = compact ? 14 : 26;
    const isSweet = count >= 3 && count <= 5;
    const isOver = count >= 6;
    ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = PALETTE.mintBright;
    ctx.fillText(`CHUNKS: ${count}  ·  COWAN (2001) FOCUS WINDOW: ~4`, padX, 20);

    ctx.textAlign = "right";
    ctx.fillStyle = isSweet ? PALETTE.mintBright : isOver ? PALETTE.coral : PALETTE.amber;
    ctx.fillText(
      isSweet ? "甜点区间（3–5 步）" : isOver ? "超出记忆焦窗（示意）" : "步数偏少（示意）",
      cssW - padX,
      20
    );

    // 工作记忆焦点括号（框住前 4 个节点，直观演示 Cowan 4 组块注意力焦点）
    const gap = compact ? 8 : 16;
    const availW = cssW - padX * 2;
    const nodeW = Math.min(compact ? 72 : 120, (availW - gap * (count - 1)) / count);
    const totalW = nodeW * count + gap * (count - 1);
    const startX = (cssW - totalW) / 2;
    const nodeH = compact ? 74 : 92;
    const nodeY = compact ? 62 : 70;

    // 4 组块注意力窗口罩
    const focusN = Math.min(count, 4);
    const focusW = nodeW * focusN + gap * (focusN - 1) + 14;
    roundRect(ctx, startX - 7, nodeY - 22, focusW, nodeH + 34, 10);
    ctx.fillStyle = "rgba(138, 221, 186, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(138, 221, 186, 0.50)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `700 ${compact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.mint;
    ctx.textAlign = "left";
    ctx.fillText("工作记忆焦点约 4 组块", startX, nodeY - 10);

    // 扫描光波（示意 5 秒内视线能扫完哪几个节点）
    const scanPos = still ? Math.min(count - 1, 3.4) : ((t * 0.7) % (count + 1.2));

    for (let i = 0; i < count; i++) {
      const x = startX + i * (nodeW + gap);
      const inFocus = i < 4;
      const faded = i >= 5;
      const isLit = Math.abs(scanPos - i) < 0.7;

      // 卡片间小箭
      if (i < count - 1) {
        const ax1 = x + nodeW + 2;
        const ax2 = x + nodeW + gap - 2;
        const ay = nodeY + nodeH / 2;
        ctx.strokeStyle = faded ? "rgba(255,123,102,0.55)" : PALETTE.mint;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax1, ay);
        ctx.lineTo(ax2 - 3, ay);
        ctx.stroke();
        ctx.fillStyle = faded ? PALETTE.coral : PALETTE.mint;
        ctx.beginPath();
        ctx.moveTo(ax2, ay);
        ctx.lineTo(ax2 - 5, ay - 4);
        ctx.lineTo(ax2 - 5, ay + 4);
        ctx.closePath();
        ctx.fill();
      }

      // 卡片本体
      roundRect(ctx, x, nodeY, nodeW, nodeH, 8);
      if (faded) {
        ctx.fillStyle = "rgba(75, 27, 23, 0.75)";
        ctx.fill();
        ctx.strokeStyle = PALETTE.coral;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else {
        ctx.fillStyle = isLit ? "#FEF9EF" : PALETTE.ivory;
        ctx.fill();
        if (isLit) {
          ctx.strokeStyle = PALETTE.mintBright;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
      }

      // 编号与文字
      ctx.font = `700 ${compact ? 9 : 10.5}px "Space Mono", monospace`;
      ctx.fillStyle = faded ? PALETTE.coralInk : PALETTE.emerald;
      ctx.textAlign = "center";
      ctx.fillText(`0${i + 1}`, x + nodeW / 2, nodeY + 18);

      ctx.font = `700 ${compact ? (nodeW < 42 ? 10 : 12) : (nodeW < 64 ? 12 : 15)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = faded ? "#FFD7D0" : PALETTE.ivoryInk;
      const label = count <= 4 ? CHUNK_GROUPS[i].name : RAW_STEPS[i];
      ctx.fillText(label, x + nodeW / 2, nodeY + nodeH * 0.54);

      ctx.font = `500 ${compact ? 8.5 : 10}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = faded ? PALETTE.coral : inFocus ? PALETTE.emeraldMid : "#6E5A28";
      ctx.fillText(faded ? "易遗忘" : inFocus ? "记得住" : "临界", x + nodeW / 2, nodeY + nodeH - 14);
    }

    // 底部归并提示带（当 count >= 6 时，画虚线归并括号示意怎么合并回 4 大阶段）
    const footY = nodeY + nodeH + (compact ? 26 : 34);
    ctx.textAlign = "center";
    ctx.font = `500 ${compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
    if (count >= 6) {
      ctx.fillStyle = PALETTE.coralInk;
      ctx.fillText(
        `把 ${count} 个细碎动作按「发现 → 分析 → 执行 → 输出」打包成 4 个阶段，听众瞬间就能记住整条主线。`,
        cssW / 2,
        footY
      );
    } else if (count <= 2) {
      ctx.fillStyle = PALETTE.amber;
      ctx.fillText(
        `只有 ${count} 步时更像因果对照而非流程，换双栏对比或标题说明页会更直接。`,
        cssW / 2,
        footY
      );
    } else {
      ctx.fillStyle = PALETTE.mintBright;
      ctx.fillText(
        `${count} 个阶段恰好落在工作记忆焦点内，每步留足空间写清 2–3 条关键转化动作。`,
        cssW / 2,
        footY
      );
    }

    ctx.restore();
  });

  return { draw: () => ctl.draw() };
}
