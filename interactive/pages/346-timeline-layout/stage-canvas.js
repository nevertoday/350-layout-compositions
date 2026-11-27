// 首屏活体时间轴编排演播台 2D Canvas 渲染与直接交互引擎
// 1:1 承袭 346 原海报手账米杏纸 × 深孔雀松青斜坡曲线 × 空心节点环 × 胶囊标签 × 暖沙图标徽 × 右下结论卡

import { loop, pixelRatio } from "../../lib/stage.js";
import { axisPoint, projectToAxis, clamp } from "./model.js";

const COL = {
  paper: "#F4E7D3",
  paperBright: "#FBF4E8",
  sand: "#E6DAC4",
  lineWarm: "#D5C5AC",
  teal: "#155D56",
  tealDeep: "#0D4A44",
  tealSoft: "#D9EAE4",
  red: "#E1613E",
  redBtn: "#BA4222",
  redInk: "#A33114",
  redSoft: "#FBE9E2",
  ink: "#1A110A",
  inkSoft: "#4A3F35",
  white: "#FFF9F0",
};

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

function wrapText(ctx, text, maxW, maxLines = 2) {
  const chars = [...text];
  const lines = [];
  let cur = "";
  for (const ch of chars) {
    if (ctx.measureText(cur + ch).width > maxW && cur.length > 0) {
      lines.push(cur);
      cur = ch;
      if (lines.length >= maxLines) break;
    } else {
      cur += ch;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && lines.join("").length < text.length) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…";
  }
  return lines;
}

// 绘制原海报波谷处暖沙小圆图标（清单板 / 放大镜 / 纸飞机）
function drawSandGlyph(ctx, x, y, r, kind) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = COL.sand;
  ctx.fill();
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = r * 0.52;
  if (kind === "clipboard") {
    ctx.strokeRect(x - s * 0.72, y - s * 0.78, s * 1.44, s * 1.65);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.35, y - s * 0.78);
    ctx.lineTo(x + s * 0.35, y - s * 0.78);
    ctx.moveTo(x - s * 0.4, y - s * 0.15);
    ctx.lineTo(x + s * 0.4, y - s * 0.15);
    ctx.moveTo(x - s * 0.4, y + s * 0.32);
    ctx.lineTo(x + s * 0.25, y + s * 0.32);
    ctx.stroke();
  } else if (kind === "search") {
    ctx.beginPath();
    ctx.arc(x - s * 0.18, y - s * 0.18, s * 0.58, 0, Math.PI * 2);
    ctx.moveTo(x + s * 0.25, y + s * 0.25);
    ctx.lineTo(x + s * 0.78, y + s * 0.78);
    ctx.stroke();
  } else {
    // plane 纸飞机
    ctx.beginPath();
    ctx.moveTo(x - s * 0.8, y + s * 0.1);
    ctx.lineTo(x + s * 0.85, y - s * 0.7);
    ctx.lineTo(x + s * 0.2, y + s * 0.8);
    ctx.lineTo(x - s * 0.1, y + s * 0.22);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.72, -size * 0.62);
  ctx.lineTo(-size * 0.72, size * 0.62);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function createTimelineStage(canvas, hooks) {
  const ctx = canvas.getContext("2d");
  let w = 800;
  let h = 450;
  let dpr = 1;
  let intro = 0;
  let dirty = true;
  let focusPillar = "";
  let pulseTimer = 0;

  // 当前帧算出的交互热区，用于点击和拖拽拾取
  let hitNodes = [];
  let hitButtons = [];

  // 拖拽状态
  let dragMode = null; // null | "node" | "scrub"
  let dragNodeId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartPlayhead = 0;
  let dragBasePositions = null;
  let pointerMoved = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    w = rect.width;
    h = rect.height;
    dpr = pixelRatio(2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    dirty = true;
  }

  new ResizeObserver(() => {
    resize();
    runner.draw();
  }).observe(canvas);
  resize();

  function markDirty() {
    dirty = true;
    runner.draw();
  }

  function highlightPillar(key) {
    focusPillar = key || "";
    pulseTimer = 1.6;
    markDirty();
  }

  // 把归一化坐标 (u, v) 映射到真实画布内工作矩形（移动端与桌面均保持等比真圆不压扁）
  function getStageBox() {
    const isPortrait = w / h < 1.25;
    if (isPortrait) {
      return {
        isPortrait: true,
        sx: 12,
        sy: 12,
        sw: w - 24,
        sh: h * 0.72,
        footerY: h * 0.755,
        footerH: h * 0.22,
      };
    }
    return {
      isPortrait: false,
      sx: 18,
      sy: 14,
      sw: w - 36,
      sh: h - 28,
      footerY: h - 140,
      footerH: 122,
    };
  }

  function mapPt(box, pt) {
    return {
      x: box.sx + pt.u * box.sw,
      y: box.sy + pt.v * box.sh,
    };
  }

  function drawScene(t, dt, { still }) {
    const state = hooks.getState();
    const ev = hooks.getEval();

    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + (dt > 0 ? dt * 1.45 : 0.08));
      dirty = true;
    }
    if (pulseTimer > 0 && !still) {
      pulseTimer = Math.max(0, pulseTimer - dt);
      dirty = true;
    }
    if (state.playing && !still) {
      const speed = ev.score === 5 ? 0.19 : 0.14;
      let next = state.playhead + dt * speed;
      if (next >= 1) {
        next = 1;
        hooks.onPlayhead(next, false);
      } else {
        hooks.onPlayhead(next, true);
      }
      dirty = true;
    }
    if (!dirty && !state.playing && intro >= 1 && pulseTimer <= 0) return;
    dirty = false;

    hitNodes = [];
    hitButtons = [];

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 米杏手账底纸 + 极细背景点纹
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, w, h);

    // 柔和极淡坐标点纹（手账网格韵味）
    ctx.fillStyle = "rgba(21, 93, 86, 0.07)";
    const step = w < 500 ? 22 : 26;
    for (let gx = 16; gx < w - 10; gx += step) {
      for (let gy = 16; gy < h - 10; gy += step) {
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
    }

    const box = getStageBox();
    const easeIntro = 1 - Math.pow(1 - intro, 3);
    const axis = state.axis;

    // 2. 绘制深孔雀松青主时间轴曲线 + 末端箭头
    const samples = 84;
    const drawLimit = Math.max(12, Math.floor(samples * easeIntro));
    ctx.beginPath();
    for (let i = 0; i <= drawLimit; i++) {
      const s = i / samples;
      const p = mapPt(box, axisPoint(axis, s));
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = COL.teal;
    ctx.lineWidth = box.isPortrait ? 4.2 : 5.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 若正在演播或游标 > 0，用亮朱砂柿红覆盖已走过的推进段
    if (state.playhead > 0.01) {
      const pLim = Math.max(2, Math.floor(samples * clamp(state.playhead, 0, 1) * easeIntro));
      ctx.beginPath();
      for (let i = 0; i <= pLim; i++) {
        const s = i / samples;
        const p = mapPt(box, axisPoint(axis, s));
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = ev.inversions > 0 ? COL.redBtn : COL.red;
      ctx.lineWidth = box.isPortrait ? 4.4 : 5.4;
      ctx.stroke();
    }

    // 终点实心箭头
    const pEnd = mapPt(box, axisPoint(axis, Math.min(1, easeIntro)));
    const pPrev = mapPt(box, axisPoint(axis, Math.max(0, Math.min(1, easeIntro) - 0.03)));
    const endAngle = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);
    drawArrowHead(ctx, pEnd.x, pEnd.y, endAngle, box.isPortrait ? 10 : 12, COL.teal);

    // 3. 原海报独有母题：斜坡轴波谷处的三枚暖沙小圆图标徽（清单 / 放大镜 / 纸飞机）
    if (axis === "slope" && !box.isPortrait) {
      const deco = [
        { s: 0.25, dx: -44, dy: -6, kind: "clipboard" },
        { s: 0.52, dx: -48, dy: -8, kind: "search" },
        { s: 0.77, dx: -46, dy: -6, kind: "plane" },
      ];
      for (const d of deco) {
        const dp = mapPt(box, axisPoint("slope", d.s));
        drawSandGlyph(ctx, dp.x + d.dx, dp.y + d.dy, 16, d.kind);
      }
    }

    // 4. 起点背景锚点（左下/起端，可原地点击补全或关闭）
    const pStart = mapPt(box, axisPoint(axis, 0.02));
    const startBoxW = box.isPortrait ? 148 : 206;
    const startBoxH = box.isPortrait ? 34 : 38;
    const startX = clamp(axis === "vertical" ? pStart.x - startBoxW - 14 : box.sx + 4, 8, w - startBoxW - 8);
    const startY = axis === "slope"
      ? clamp(box.sy + box.sh - startBoxH - 2, 8, h - startBoxH - 8)
      : axis === "horizontal"
        ? clamp(pStart.y - 78, 8, h - startBoxH - 8)
        : clamp(box.sy + 4, 8, h - startBoxH - 8);

    ctx.save();
    roundRect(ctx, startX, startY, startBoxW, startBoxH, 8);
    if (state.hasStartAnchor) {
      ctx.fillStyle = COL.tealSoft;
      ctx.fill();
      ctx.strokeStyle = focusPillar === "start" ? COL.red : COL.teal;
      ctx.lineWidth = focusPillar === "start" ? 2.4 : 1.4;
      ctx.stroke();
      ctx.fillStyle = COL.tealDeep;
      ctx.font = `700 ${box.isPortrait ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.fillText("起点背景", startX + 10, startY + 14);
      ctx.fillStyle = COL.ink;
      ctx.font = `500 ${box.isPortrait ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      const sLine = wrapText(ctx, ev.scenario.startContext, startBoxW - 18, 1)[0];
      ctx.fillText(sLine, startX + 10, startY + 29);
    } else {
      ctx.fillStyle = COL.redSoft;
      ctx.fill();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = COL.redBtn;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.redInk;
      ctx.font = `700 ${box.isPortrait ? 11.5 : 12.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText("+ 缺起点背景 · 点此补全", startX + 10, startY + startBoxH / 2 + 4);
    }
    ctx.restore();
    hitButtons.push({ id: "toggle-start", x: startX, y: startY, w: startBoxW, h: startBoxH });

    // 5. 段距碰撞提示（逆序红弧与对调红胶囊延后到节点卡片之后绘制，保证绝对最顶层不被遮挡）
    const nodes = ev.activeNodes;
    const pendingSwaps = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const pa = mapPt(box, a.pt);
      const pb = mapPt(box, b.pt);
      const gap = b.pos - a.pos;

      if (a.order > b.order) {
        pendingSwaps.push({ a, b, pa, pb });
      } else if (gap < (nodes.length >= 6 ? 0.105 : 0.13)) {
        // 节奏挤团提示弧
        const mx = (pa.x + pb.x) / 2;
        const my = (pa.y + pb.y) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(mx, my, 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(186, 66, 34, 0.18)";
        ctx.fill();
        ctx.strokeStyle = COL.redBtn;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 6. 绘制每一个激活里程碑节点（空心白芯粗环 + 阶段大标 + 深松青圆角胶囊 + 文案）
    const ringR = box.isPortrait ? 10 : 12;
    nodes.forEach((n, idx) => {
      const p = mapPt(box, n.pt);
      const isSelected = state.selectedId === n.id;
      const isNoise = !n.isCore;
      const isReached = state.playhead > 0.01 && state.playhead >= n.pos - 0.03;
      const isBadOrder = ev.reversedPairs.some((rp) => rp.from.id === n.id || rp.to.id === n.id);
      const ringColor = isNoise || isBadOrder ? COL.redBtn : isReached ? COL.red : COL.teal;

      // 选中外圈光晕 / 聚焦五要素外环
      if (isSelected || (focusPillar === "nodes" && isNoise) || (focusPillar === "order" && isBadOrder)) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, ringR + 7, 0, Math.PI * 2);
        ctx.fillStyle = isNoise || isBadOrder ? "rgba(225, 97, 62, 0.22)" : "rgba(21, 93, 86, 0.18)";
        ctx.fill();
        ctx.restore();
      }

      // 空心白芯粗环（346 原海报招牌节点造型）
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
      ctx.fillStyle = COL.paperBright;
      ctx.fill();
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = isNoise ? 3.2 : 4.2;
      if (isNoise) ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 演播点亮芯
      if (isReached) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, ringR * 0.44, 0, Math.PI * 2);
        ctx.fillStyle = ringColor;
        ctx.fill();
      }
      ctx.restore();

      hitNodes.push({ id: n.id, x: p.x, y: p.y, r: Math.max(26, ringR + 16), isNoise });

      // 计算节点说明卡位置
      const dense = state.copyMode === "dense";
      const empty = state.copyMode === "empty";
      const compactH = h < 280;
      const cardW = box.isPortrait
        ? (axis === "horizontal" ? 96 : 152)
        : (axis === "horizontal" ? clamp((box.sw / Math.max(3, nodes.length)) - 12, 118, 178) : compactH ? 176 : 210);
      const cardH = empty ? 34 : dense ? (box.isPortrait ? 62 : compactH ? 58 : 76) : (box.isPortrait ? 46 : compactH ? 44 : 56);

      let cx = p.x + ringR + 12;
      let cy = p.y - cardH * 0.48;

      if (axis === "slope") {
        // 原海报：里程碑卡片沿斜坡右侧排开；支线放到左侧形成明显杂乱干扰且不完全遮死核心节点
        if (isNoise) {
          cx = p.x - cardW - ringR - (box.isPortrait ? 6 : 12);
          cy = p.y - cardH * 0.55;
        }
        cx = clamp(cx, 8, w - cardW - 8);
        cy = clamp(cy, 10, box.sy + box.sh - cardH - 6);
      } else if (axis === "horizontal") {
        const above = idx % 2 === 0;
        cx = clamp(p.x - cardW / 2, 10, w - cardW - 10);
        cy = above ? clamp(p.y - ringR - cardH - 12, 10, h - cardH - 10) : clamp(p.y + ringR + 12, 10, box.sy + box.sh - cardH - 6);
        // 垂直细连线
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.x, above ? p.y - ringR : p.y + ringR);
        ctx.lineTo(p.x, above ? cy + cardH : cy);
        ctx.strokeStyle = isNoise ? COL.redBtn : COL.lineWarm;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      } else {
        // vertical
        cx = clamp(p.x + ringR + 16, 10, w - cardW - 10);
        cy = clamp(p.y - cardH / 2, 10, box.sy + box.sh - cardH - 6);
      }

      // 卡片容器
      ctx.save();
      roundRect(ctx, cx, cy, cardW, cardH, 8);
      ctx.fillStyle = isNoise ? COL.redSoft : isSelected ? "#FFFDF8" : "rgba(251, 244, 232, 0.94)";
      ctx.fill();
      ctx.strokeStyle = isNoise || isBadOrder ? COL.redBtn : isSelected ? COL.teal : COL.lineWarm;
      ctx.lineWidth = isSelected || isNoise ? 1.7 : 1.1;
      if (isNoise) ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 阶段大标 + 深松青/赤红胶囊标签
      if (empty) {
        ctx.fillStyle = COL.inkSoft;
        ctx.font = `700 ${box.isPortrait ? 12 : 13}px "IBM Plex Mono", monospace`;
        ctx.fillText(`${n.code} · ???`, cx + 10, cy + 21);
      } else {
        ctx.fillStyle = isNoise ? COL.redInk : COL.ink;
        ctx.font = `700 ${box.isPortrait ? 12 : 13.5}px "Noto Sans SC", sans-serif`;
        const headTxt = `${n.time} ${n.title}`;
        ctx.fillText(wrapText(ctx, headTxt, cardW - 64, 1)[0], cx + 9, cy + 16);

        // 右上角原海报胶囊标签（支线标红并提示「× 裁」）
        const pillText = isNoise ? "× 裁支线" : n.pill;
        ctx.font = `600 ${box.isPortrait ? 10 : 10.5}px "Noto Sans SC", sans-serif`;
        const pw = ctx.measureText(pillText).width + 10;
        const px = cx + cardW - pw - 6;
        const py = cy + 5;
        roundRect(ctx, px, py, pw, 16, 8);
        ctx.fillStyle = isNoise ? COL.redBtn : COL.teal;
        ctx.fill();
        ctx.fillStyle = COL.white;
        ctx.fillText(pillText, px + 5, py + 11.5);

        if (isNoise) {
          hitButtons.push({ id: "trim-noise", nodeId: n.id, x: cx, y: cy, w: cardW, h: cardH });
        }

        // 正文摘要（密字态真实渲染 3 行拥挤小字，直观感受密字墙！）
        ctx.fillStyle = dense ? COL.redInk : COL.inkSoft;
        ctx.font = `400 ${dense ? 10 : box.isPortrait ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
        const lines = wrapText(ctx, n.copy, cardW - 18, dense ? 3 : 2);
        const lh = dense ? 13 : 14.5;
        lines.forEach((line, li) => {
          ctx.fillText(line, cx + 9, cy + 32 + li * lh);
        });
      }
      ctx.restore();
    });

    // 6.5 最顶层绘制逆序赤红折返弧与可点击对调红胶囊（确保永远浮在所有卡片之上、一眼可见、一点即修）
    for (const swp of pendingSwaps) {
      const { a, b, pa, pb } = swp;
      const mx = (pa.x + pb.x) / 2;
      const my = (pa.y + pb.y) / 2;
      const cx = mx - (box.isPortrait ? 38 : 66);
      const cy = my - (box.isPortrait ? 52 : 68);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(cx, cy, pb.x, pb.y);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = COL.redBtn;
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.setLineDash([]);

      const lbl = "× 逆序折返 · 点此对调";
      ctx.font = `700 ${box.isPortrait ? 11.5 : 12.5}px "Noto Sans SC", sans-serif`;
      const bw = ctx.measureText(lbl).width + 20;
      const bh = 28;
      const bx = clamp(cx - bw * 0.35, 10, w - bw - 10);
      const by = clamp(cy - 22, 10, box.sy + box.sh - bh - 6);
      roundRect(ctx, bx, by, bw, bh, 14);
      ctx.fillStyle = COL.redBtn;
      ctx.fill();
      ctx.strokeStyle = COL.white;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = COL.white;
      ctx.fillText(lbl, bx + 10, by + 18.5);
      ctx.restore();
      hitButtons.push({ id: "swap-pair", aId: a.id, bId: b.id, x: bx, y: by, w: bw, h: bh });
    }

    // 7. 1:1 复刻原海报右下角青绿细框「结论卡」（可原地点击点亮或关闭）
    const compactH = h < 280;
    const concW = box.isPortrait ? w - 24 : compactH ? 186 : 226;
    const concH = box.isPortrait ? box.footerH : compactH ? 82 : 124;
    const concX = box.isPortrait ? 12 : w - concW - 16;
    const concY = box.isPortrait ? box.footerY : h - concH - (compactH ? 8 : 14);

    ctx.save();
    roundRect(ctx, concX, concY, concW, concH, 10);
    if (state.hasConclusion) {
      ctx.fillStyle = COL.paperBright;
      ctx.fill();
      ctx.strokeStyle = focusPillar === "conclusion" ? COL.red : COL.teal;
      ctx.lineWidth = focusPillar === "conclusion" ? 2.4 : 1.7;
      ctx.stroke();

      // 朱红五角星小徽
      const sx = concX + 22;
      const sy = concY + 21;
      ctx.beginPath();
      ctx.arc(sx, sy, 11, 0, Math.PI * 2);
      ctx.fillStyle = COL.red;
      ctx.fill();
      ctx.fillStyle = COL.white;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillText("★", sx - 6, sy + 4.5);

      ctx.fillStyle = COL.ink;
      ctx.font = `700 14px "Noto Sans SC", sans-serif`;
      ctx.fillText("结论", sx + 17, sy + 5);

      ctx.fillStyle = COL.inkSoft;
      ctx.font = `500 ${box.isPortrait ? 11.5 : 11.5}px "Noto Sans SC", sans-serif`;
      const cLines = wrapText(ctx, ev.scenario.conclusionValue, concW - 24, 2);
      cLines.forEach((ln, i) => ctx.fillText(ln, concX + 12, concY + 48 + i * 16));

      // 原海报招牌朱红分割短线 + 三个关键词
      if (!box.isPortrait && !compactH) {
        ctx.beginPath();
        ctx.moveTo(concX + 12, concY + 86);
        ctx.lineTo(concX + concW - 12, concY + 86);
        ctx.strokeStyle = COL.red;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.fillStyle = COL.tealDeep;
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        const kws = ev.scenario.keywords;
        const colW = (concW - 24) / 3;
        kws.forEach((kw, ki) => {
          ctx.fillText(kw, concX + 12 + ki * colW, concY + 107);
        });
      }
    } else {
      ctx.fillStyle = COL.redSoft;
      ctx.fill();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = COL.redBtn;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.redInk;
      ctx.font = `700 ${box.isPortrait || compactH ? 12 : 13}px "Noto Sans SC", sans-serif`;
      ctx.fillText("+ 缺少终点结论卡", concX + 12, concY + (box.isPortrait || compactH ? 24 : 42));
      ctx.fillStyle = COL.inkSoft;
      ctx.font = `400 ${box.isPortrait || compactH ? 11 : 12}px "Noto Sans SC", sans-serif`;
      const tip = wrapText(ctx, "观众看完全部过程还差一句价值收束，点此补上原海报结论框。", concW - 24, 2);
      tip.forEach((ln, i) => ctx.fillText(ln, concX + 12, concY + (box.isPortrait || compactH ? 44 : 66) + i * 16));
    }
    ctx.restore();
    hitButtons.push({ id: "toggle-conclusion", x: concX, y: concY, w: concW, h: concH });

    // 8. 演播推进光点（沿轴行驶；遇逆序时闪赤红波纹提示倒流）
    if (state.playhead > 0.005) {
      const pp = mapPt(box, axisPoint(axis, clamp(state.playhead, 0, 1)));
      ctx.save();
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = ev.inversions > 0 ? "rgba(186, 66, 34, 0.25)" : "rgba(225, 97, 62, 0.25)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = COL.red;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = COL.white;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // ---------- 指针与触屏交互（兼容鼠标 + 触屏 + perf.mjs 横拖测帧率） ----------
  function getCanvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDrag(x, y) {
    pointerMoved = false;
    dragStartX = x;
    dragStartY = y;
    const state = hooks.getState();
    dragStartPlayhead = state.playhead;

    // 优先检测是否按中了节点圆环（支持直接沿轴拖拽换序与改距）
    for (const hn of hitNodes) {
      if (Math.hypot(x - hn.x, y - hn.y) <= hn.r) {
        dragMode = "node";
        dragNodeId = hn.id;
        hooks.onSelectNode(hn.id);
        canvas.classList.add("is-dragging");
        return;
      }
    }

    // 检查是否按中可点手术按钮（留待抬手时若未拖动则触发点击）
    for (const hb of hitButtons) {
      if (x >= hb.x && x <= hb.x + hb.w && y >= hb.y && y <= hb.y + hb.h) {
        dragMode = "button";
        dragNodeId = hb;
        return;
      }
    }

    // 否则在空白处横拖：推拉节奏均匀张力与演播游标，并联动右上朱红时钟！
    dragMode = "scrub";
    dragBasePositions = state.nodes.map((n) => ({ id: n.id, active: n.active, pos: n.pos }));
    canvas.classList.add("is-dragging");
  }

  function moveDrag(x, y) {
    if (!dragMode) return;
    const dx = x - dragStartX;
    const dy = y - dragStartY;
    if (Math.hypot(dx, dy) > 4) pointerMoved = true;

    const state = hooks.getState();
    const box = getStageBox();

    if (dragMode === "node" && dragNodeId) {
      const u = clamp((x - box.sx) / box.sw, 0.02, 0.98);
      const v = clamp((y - box.sy) / box.sh, 0.02, 0.98);
      const nextT = projectToAxis(state.axis, u, v);
      hooks.onMoveNode(dragNodeId, nextT);
      markDirty();
    } else if (dragMode === "scrub" && pointerMoved) {
      const delta = dx / Math.max(160, w * 0.72);
      const nextPlayhead = clamp(dragStartPlayhead + delta, 0, 1);
      // 同步按横向位移弹性拉展或收紧节点步幅（向右拉趋向匀称，向左压加剧挤团，双向真实生效！）
      if (dragBasePositions) {
        const active = dragBasePositions.filter((n) => n.active).sort((a, b) => a.pos - b.pos);
        const k = active.length;
        if (k >= 2) {
          const factor = clamp(delta * 1.15, -0.55, 0.95);
          const updates = new Map();
          active.forEach((n, idx) => {
            const evenP = 0.10 + (0.80 * idx) / (k - 1);
            const target = factor >= 0
              ? n.pos + (evenP - n.pos) * factor
              : n.pos + (0.50 - n.pos) * (-factor * 0.65);
            updates.set(n.id, clamp(target, 0.06, 0.94));
          });
          hooks.onBatchPositions(updates, nextPlayhead);
          markDirty();
          return;
        }
      }
      hooks.onPlayhead(nextPlayhead, false);
      markDirty();
    }
  }

  function endDrag() {
    if (!dragMode) return;
    if (dragMode === "button" && !pointerMoved && dragNodeId) {
      hooks.onHitButton(dragNodeId);
      markDirty();
    }
    dragMode = null;
    dragNodeId = null;
    dragBasePositions = null;
    canvas.classList.remove("is-dragging");
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const p = getCanvasPos(e.clientX, e.clientY);
    startDrag(p.x, p.y);
    if (dragMode === "node" || dragMode === "scrub") {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragMode) return;
    const p = getCanvasPos(e.clientX, e.clientY);
    moveDrag(p.x, p.y);
  });
  canvas.addEventListener("pointerup", () => endDrag());
  canvas.addEventListener("pointercancel", () => endDrag());

  // 显式兼容 touch 事件（确保 perf.mjs 的 Input.dispatchTouchEvent 100% 驱动每一帧）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length || dragMode) return;
    const p = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    startDrag(p.x, p.y);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length || !dragMode) return;
    const p = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    if (Math.abs(p.x - dragStartX) > Math.abs(p.y - dragStartY) || dragMode === "node") {
      if (e.cancelable) e.preventDefault();
    }
    moveDrag(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener("touchend", () => endDrag(), { passive: true });

  const runner = loop(canvas, drawScene);
  return {
    draw: markDirty,
    highlightPillar,
  };
}
