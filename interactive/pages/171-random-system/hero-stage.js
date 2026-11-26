// 171 开场主角玩具：随机排字与落点概率台 (2D Canvas)
// 1:1 承袭 171 原海报「输入 INPUT → 虚线随机过程盒 → 输出 OUTPUT」、彩点/十字散点、胶带白卡与折角酸柠便签质感，
// 叠加实时 X/Y 边际概率密度曲线、水平拖拽调节扰动度 (data-perf-drag) 与单字片拖拽「辅助偶发」胶带锁定。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, computeLayout, evaluateLayout } from "./model.js";

const FONT_ZH = '"Noto Sans SC", system-ui, sans-serif';
const FONT_EN = '"Bricolage Grotesque", "Manrope", sans-serif';
const FONT_MONO = '"Space Mono", monospace';

export function createHeroBench(canvas, getState, onStateChange) {
  const ctx = canvas.getContext("2d");
  let W = 680;
  let H = 440;
  let dpr = 1;
  let stageBox = { x: 66, y: 50, w: 530, h: 356, aspect: 1.49 };

  // 轻盈过渡插值：种子切换时只做 240ms 平滑落位，落定后零空转抖动
  let prevSlips = null;
  let animProg = 1;
  let animStart = 0;
  let lastSeed = getState().seed;
  let lastBrief = getState().briefId;
  let currentLayout = null;
  let currentEval = null;

  // 交互状态
  let activeDrag = null; // { mode: "disorder" | "slip", slipId?, startX, startY, startDisorder, slipStartX, slipStartY, moved }
  let hoverSlipId = null;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    W = rect.width;
    H = rect.height;

    const compact = W < 440;
    const padL = compact ? 34 : 68;
    const padR = compact ? 42 : 78;
    const padT = compact ? 42 : 54;
    const padB = compact ? 22 : 28;
    stageBox = {
      x: padL,
      y: padT,
      w: Math.max(160, W - padL - padR),
      h: Math.max(160, H - padT - padB),
      aspect: Math.max(0.75, (W - padL - padR) / Math.max(160, H - padT - padB)),
    };
    dirty = true;
  }

  function toPx(nx, ny) {
    return {
      x: stageBox.x + nx * stageBox.w,
      y: stageBox.y + ny * stageBox.h,
    };
  }

  function hitSlip(px, py) {
    if (!currentLayout) return null;
    for (let i = currentLayout.slips.length - 1; i >= 0; i--) {
      const s = currentLayout.slips[i];
      const cx = stageBox.x + s.x * stageBox.w;
      const cy = stageBox.y + s.y * stageBox.h;
      const dx = px - cx;
      const dy = py - cy;
      const rad = (-s.angle * Math.PI) / 180;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      const hw = (s.w * stageBox.w) * 0.5 + 6;
      const hh = (s.h * stageBox.h) * 0.5 + 6;
      if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) return s;
    }
    return null;
  }

  function drawMaskingTape(x, y, w, h, color, tiltRad) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tiltRad);
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    // 锯齿胶带纸微边
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
    ctx.restore();
  }

  function drawParticle(p) {
    const pos = toPx(p.x, p.y);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.4;
    if (p.kind === "dot") {
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "plus") {
      const s = p.r + 1.8;
      ctx.beginPath();
      ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
      ctx.moveTo(0, -s); ctx.lineTo(0, s);
      ctx.stroke();
    } else if (p.kind === "cross") {
      const s = p.r + 1.4;
      ctx.beginPath();
      ctx.moveTo(-s, -s); ctx.lineTo(s, s);
      ctx.moveTo(s, -s); ctx.lineTo(-s, s);
      ctx.stroke();
    } else {
      const s = p.r + 2;
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(-Math.cos(a) * s, -Math.sin(a) * s);
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawSlip(s, isColliding, isClipped, isHovered, isCompact) {
    const cx = stageBox.x + s.x * stageBox.w;
    const cy = stageBox.y + s.y * stageBox.h;
    const bw = s.w * stageBox.w;
    const bh = s.h * stageBox.h;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((s.angle * Math.PI) / 180);

    // 1. 纸片/标签背景（复刻 171 白便签、折角酸柠绿便签、墨黑条与线框标）
    if (s.kind === "card") {
      ctx.save();
      ctx.shadowColor = "rgba(11,12,14,0.10)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = PALETTE.card;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.restore();
      ctx.strokeStyle = isColliding ? PALETTE.red : isHovered ? PALETTE.cobalt : "#2B2E35";
      ctx.lineWidth = isColliding || isHovered ? 1.8 : 1;
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);

      // 卡片左侧原海报同款彩条
      const barColor = s.accent === "lime" ? PALETTE.lime : s.accent === "red" ? PALETTE.red : PALETTE.cobalt;
      ctx.fillStyle = barColor;
      ctx.fillRect(-bw / 2, -bh / 2, 4.5, bh);

      // 顶部半透明胶带（若未锁定则轻淡，手动锁定时加浓）
      if (s.tape === "cobalt" || s.tape === "red") {
        const tCol = s.tape === "cobalt" ? PALETTE.cobaltTape : PALETTE.redTape;
        drawMaskingTape(0, -bh / 2, Math.min(44, bw * 0.36), 10, tCol, -0.06);
      }
    } else if (s.kind === "sticky") {
      // 171 招牌酸柠便签 + 右下黑折角
      const fold = Math.min(14, bh * 0.24);
      ctx.save();
      ctx.shadowColor = "rgba(11,12,14,0.12)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.moveTo(-bw / 2, -bh / 2);
      ctx.lineTo(bw / 2, -bh / 2);
      ctx.lineTo(bw / 2, bh / 2 - fold);
      ctx.lineTo(bw / 2 - fold, bh / 2);
      ctx.lineTo(-bw / 2, bh / 2);
      ctx.closePath();
      ctx.fillStyle = PALETTE.limeSticky;
      ctx.fill();
      ctx.restore();

      // 折叠黑三角
      ctx.beginPath();
      ctx.moveTo(bw / 2 - fold, bh / 2);
      ctx.lineTo(bw / 2 - fold, bh / 2 - fold);
      ctx.lineTo(bw / 2, bh / 2 - fold);
      ctx.closePath();
      ctx.fillStyle = PALETTE.ink;
      ctx.fill();

      if (isColliding || isHovered) {
        ctx.strokeStyle = isColliding ? PALETTE.red : PALETTE.cobalt;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
      }
    } else if (s.kind === "pill") {
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      if (isColliding) {
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
      }
    } else if (s.kind === "tag") {
      ctx.fillStyle = s.bg === "tintLime" ? "#E7F0B8" : PALETTE.card;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      const borderCol = isColliding ? PALETTE.red : s.accent === "cobalt" ? PALETTE.cobalt : s.accent === "red" ? PALETTE.red : "#2B2E35";
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = isColliding ? 1.7 : 1.1;
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    } else if (s.kind === "glyph") {
      // 大字主视觉：透明底 + 轻微点状界框（悬停或冲突时显示）
      if (isHovered || isColliding || isClipped) {
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = isColliding || isClipped ? PALETTE.red : PALETTE.cobalt;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        ctx.restore();
      }
    }

    // 2. 手动锁定（阿尔普辅助偶发）胶带标
    if (s.pinned) {
      drawMaskingTape(-bw * 0.22, -bh / 2, 34, 9.5, PALETTE.cobaltTape, -0.18);
      ctx.fillStyle = PALETTE.cobalt;
      ctx.beginPath();
      ctx.arc(bw / 2 - 5, -bh / 2 + 5, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 绘制真实文字（随画布尺寸自适配，避免溢出卡片）
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (s.kind === "glyph") {
      const fSize = clampFont(Math.min(bw * 0.84, bh * 0.72), 20, 82);
      ctx.font = `900 ${fSize}px ${FONT_ZH}`;
      ctx.fillStyle = s.accent === "cobalt" ? PALETTE.cobalt : s.accent === "red" ? PALETTE.red : PALETTE.ink;
      ctx.fillText(s.text, 0, -bh * 0.06);

      // 原海报同款装饰：主字下方一条短彩杠 + 英文副标
      const barW = bw * 0.56;
      ctx.fillStyle = s.accent === "cobalt" ? PALETTE.lime : PALETTE.cobalt;
      ctx.fillRect(-barW / 2, bh * 0.30, barW, Math.max(3, bh * 0.045));

      const subSize = clampFont(bh * 0.13, 8.5, 12);
      ctx.font = `700 ${subSize}px ${FONT_EN}`;
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.fillText(s.sub, 0, bh * 0.44);
    } else if (s.kind === "card" || s.kind === "sticky") {
      const mainSize = clampFont(Math.min(bw / (s.text.length * 0.78), bh * 0.32), 9.5, isCompact ? 12.5 : 15);
      ctx.font = `700 ${mainSize}px ${FONT_ZH}`;
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText(s.text, 2, -bh * 0.14, bw - 12);

      if (s.sub) {
        const subSize = clampFont(mainSize * 0.78, 8.5, 11.5);
        ctx.font = `500 ${subSize}px ${FONT_ZH}`;
        ctx.fillStyle = s.kind === "sticky" ? "#1E2600" : PALETTE.inkMuted;
        ctx.fillText(s.sub, 2, bh * 0.21, bw - 14);
      }
    } else if (s.kind === "pill") {
      const sz = clampFont(Math.min(bw / (s.text.length * 0.62), bh * 0.44), 8.5, 12);
      ctx.font = `700 ${sz}px ${FONT_MONO}`;
      ctx.fillStyle = PALETTE.card;
      ctx.fillText(s.text, 0, 0.5, bw - 10);
    } else {
      const sz = clampFont(Math.min(bw / (s.text.length * 0.85), bh * 0.46), 8.5, 12);
      ctx.font = `700 ${sz}px ${FONT_ZH}`;
      ctx.fillStyle = s.accent === "cobalt" ? PALETTE.cobaltText : s.accent === "red" ? PALETTE.redText : s.accent === "lime" ? PALETTE.limeSafeText : PALETTE.ink;
      ctx.fillText(s.text, 0, 0.5, bw - 10);
    }

    // 4. 越界警示角标
    if (isClipped) {
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.strokeRect(-bw / 2 - 2, -bh / 2 - 2, bw + 4, bh + 4);
    }
    ctx.restore();
  }

  function clampFont(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function render(t, dt, { still }) {
    const state = getState();
    const seedChanged = state.seed !== lastSeed || state.briefId !== lastBrief;
    if (seedChanged) {
      if (currentLayout && !still) {
        prevSlips = currentLayout.slips.map((s) => ({ x: s.x, y: s.y, angle: s.angle }));
        animProg = 0;
        animStart = t;
      } else {
        prevSlips = null;
        animProg = 1;
      }
      lastSeed = state.seed;
      lastBrief = state.briefId;
      dirty = true;
    }

    if (animProg < 1 && !still) {
      animProg = Math.min(1, (t - animStart) / 0.26);
      dirty = true;
    } else if (still) {
      animProg = 1;
    }

    if (!dirty && animProg >= 1) return;
    dirty = false;

    const layout = computeLayout(state, stageBox.aspect);
    const ev = evaluateLayout(layout);
    currentLayout = layout;
    currentEval = ev;

    // 缓动插值坐标（仅在撒新种子时 260ms 内柔和飘落）
    const ease = 1 - Math.pow(1 - animProg, 3);
    const drawSlips = layout.slips.map((s, i) => {
      if (!prevSlips || !prevSlips[i] || animProg >= 1) return s;
      const p = prevSlips[i];
      return {
        ...s,
        x: p.x + (s.x - p.x) * ease,
        y: p.y + (s.y - p.y) * ease,
        angle: p.angle + (s.angle - p.angle) * ease,
      };
    });

    const isCompact = W < 440;
    ctx.save();
    ctx.scale(dpr, dpr);

    // A. 背景纸面 + 细微实验室点格
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    // 虚线盒内纸底（微亮棉纸）
    ctx.fillStyle = "#F8F6F0";
    ctx.fillRect(stageBox.x, stageBox.y, stageBox.w, stageBox.h);

    // 淡灰草图点阵（只在莫尔纳微扰或极低扰动时隐约可见结构参考，高扰动时淡出）
    const gridAlpha = state.disorder < 0.35 ? 0.26 : 0.10;
    ctx.fillStyle = `rgba(11,12,14,${gridAlpha})`;
    const gx = 8, gy = 6;
    for (let i = 1; i < gx; i++) {
      for (let j = 1; j < gy; j++) {
        ctx.fillRect(stageBox.x + (stageBox.w * i) / gx - 0.8, stageBox.y + (stageBox.h * j) / gy - 0.8, 1.6, 1.6);
      }
    }

    // B. 顶部 X 边际概率密度曲线 + 右侧 Y 边际概率密度曲线（让「关注分布」肉眼可见）
    const curveColor = state.dist === "normal" ? PALETTE.cobalt : state.dist === "exponential" ? PALETTE.red : state.dist === "diagonal" ? PALETTE.ink : PALETTE.limeSafeText;
    // 顶部 X 分布山峰
    const topBase = stageBox.y - 4;
    const topMaxH = isCompact ? 24 : 32;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(stageBox.x, topBase);
    layout.densityX.forEach((v, idx) => {
      const px = stageBox.x + ((idx + 0.5) / layout.densityX.length) * stageBox.w;
      const py = topBase - v * topMaxH;
      ctx.lineTo(px, py);
    });
    ctx.lineTo(stageBox.x + stageBox.w, topBase);
    ctx.closePath();
    ctx.fillStyle = state.dist === "normal" ? "rgba(22,59,238,0.14)" : state.dist === "exponential" ? "rgba(237,59,33,0.14)" : "rgba(181,215,23,0.28)";
    ctx.fill();
    ctx.beginPath();
    layout.densityX.forEach((v, idx) => {
      const px = stageBox.x + ((idx + 0.5) / layout.densityX.length) * stageBox.w;
      const py = topBase - v * topMaxH;
      if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 顶部标签
    ctx.font = `700 ${isCompact ? 9.5 : 10.5}px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`P(X) · ${state.dist.toUpperCase()}`, stageBox.x + 2, 6);
    ctx.textAlign = "right";
    ctx.fillStyle = ev.statusKind === "ok" ? PALETTE.ok : ev.statusKind === "bad" ? PALETTE.redText : PALETTE.cobaltText;
    ctx.fillText(`DISORDER ${Math.round(state.disorder * 100)}% · SEED #${state.seed}`, stageBox.x + stageBox.w, 6);
    ctx.restore();

    // 右侧 Y 边际密度曲线（在输出节点外侧，宽屏画）
    if (!isCompact) {
      const rxBase = stageBox.x + stageBox.w + 34;
      const rMaxW = 30;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rxBase, stageBox.y);
      layout.densityY.forEach((v, idx) => {
        const py = stageBox.y + ((idx + 0.5) / layout.densityY.length) * stageBox.h;
        const px = rxBase + v * rMaxW;
        ctx.lineTo(px, py);
      });
      ctx.lineTo(rxBase, stageBox.y + stageBox.h);
      ctx.closePath();
      ctx.fillStyle = "rgba(11,12,14,0.08)";
      ctx.fill();
      ctx.beginPath();
      layout.densityY.forEach((v, idx) => {
        const py = stageBox.y + ((idx + 0.5) / layout.densityY.length) * stageBox.h;
        const px = rxBase + v * rMaxW;
        if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = PALETTE.inkMuted;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.restore();
    }

    // C. 安全留白参考框（外 4.2% 安全区，出现擦边时变红警示）
    const smX = stageBox.w * 0.042;
    const smY = stageBox.h * 0.042;
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = ev.edgeClips.length > 0 ? "rgba(237,59,33,0.65)" : "rgba(11,12,14,0.16)";
    ctx.lineWidth = ev.edgeClips.length > 0 ? 1.4 : 1;
    ctx.strokeRect(stageBox.x + smX, stageBox.y + smY, stageBox.w - smX * 2, stageBox.h - smY * 2);
    ctx.restore();

    // D. 原海报「随机过程示意」：左侧 4 枚输入黑点 → 虚线曲线 → 右侧 4 枚输出彩点
    ctx.save();
    const inX = isCompact ? 16 : 32;
    const outX = stageBox.x + stageBox.w + (isCompact ? 18 : 18);
    ctx.font = `700 ${isCompact ? 9 : 10}px ${FONT_ZH}`;
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("输入", inX, stageBox.y + 10);
    ctx.fillText("输出", outX, stageBox.y + 10);
    if (!isCompact) {
      ctx.font = `700 8.5px ${FONT_MONO}`;
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.fillText("INPUT", inX, stageBox.y + 21);
      ctx.fillText("OUTPUT", outX, stageBox.y + 21);
    }

    for (const path of layout.paths) {
      const sy = stageBox.y + path.startY * stageBox.h;
      const ey = stageBox.y + path.endY * stageBox.h;
      // 输入黑点
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(inX, sy, isCompact ? 4 : 5, 0, Math.PI * 2);
      ctx.fill();

      // 虚线穿越随机过程盒
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(11,12,14,0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(inX + 8, sy);
      ctx.bezierCurveTo(
        stageBox.x + path.c1x * stageBox.w,
        stageBox.y + path.c1y * stageBox.h,
        stageBox.x + path.c2x * stageBox.w,
        stageBox.y + path.c2y * stageBox.h,
        outX - 10,
        ey
      );
      ctx.stroke();
      ctx.restore();

      // 右侧箭头 + 输出彩点
      ctx.fillStyle = path.color;
      ctx.beginPath();
      ctx.arc(outX, ey, isCompact ? 4 : 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // E. 散点/十字/星号粒子（呼应原海报过程盒内元素）
    for (const p of layout.particles) drawParticle(p);

    // F. 视觉重心标记（平衡圆环 vs 偏移警示虚线）
    const cPos = toPx(ev.cx, ev.cy);
    const centerPos = toPx(0.5, 0.5);
    ctx.save();
    // 理想平衡圈（13.5% 半径）
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = ev.offsetPct > 13.5 ? "rgba(237,59,33,0.45)" : "rgba(22,59,238,0.26)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(centerPos.x, centerPos.y, stageBox.w * 0.135, stageBox.h * 0.135, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 质心连线
    if (ev.offsetPct > 5) {
      ctx.setLineDash([]);
      ctx.strokeStyle = ev.offsetPct > 13.5 ? PALETTE.red : PALETTE.cobalt;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(centerPos.x, centerPos.y);
      ctx.lineTo(cPos.x, cPos.y);
      ctx.stroke();
    }
    ctx.fillStyle = ev.offsetPct > 13.5 ? PALETTE.red : PALETTE.cobalt;
    ctx.beginPath();
    ctx.arc(cPos.x, cPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // G. 绘制 10 枚真实排印字片
    const collideSet = new Set();
    for (const c of ev.collisions) {
      collideSet.add(c.a.id);
      collideSet.add(c.b.id);
    }
    const clipSet = new Set(ev.edgeClips.map((s) => s.id));
    for (const s of drawSlips) {
      drawSlip(s, collideSet.has(s.id), clipSet.has(s.id), hoverSlipId === s.id, isCompact);
    }

    // H. 真实 OBB 撞字重叠区域标红斜纹（单真源可视化证据）
    if (ev.collisions.length > 0 && animProg >= 0.9) {
      ctx.save();
      for (const c of ev.collisions) {
        if (c.poly.length < 3) continue;
        ctx.beginPath();
        c.poly.forEach((pt, idx) => {
          const px = stageBox.x + (pt.x / stageBox.aspect) * stageBox.w;
          const py = stageBox.y + pt.y * stageBox.h;
          if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(237, 59, 33, 0.34)";
        ctx.fill();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      // 在最重撞击处标一枚小提示签
      const worst = ev.collisions.reduce((a, b) => (b.area > a.area ? b : a), ev.collisions[0]);
      const wx = worst.poly.reduce((s, p) => s + p.x, 0) / worst.poly.length;
      const wy = worst.poly.reduce((s, p) => s + p.y, 0) / worst.poly.length;
      const lx = Math.max(stageBox.x + 48, Math.min(stageBox.x + stageBox.w - 48, stageBox.x + (wx / stageBox.aspect) * stageBox.w));
      const ly = Math.max(stageBox.y + 18, Math.min(stageBox.y + stageBox.h - 18, stageBox.y + wy * stageBox.h - 16));
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(lx - 42, ly - 10, 84, 20);
      ctx.font = `700 10.5px ${FONT_ZH}`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`× 撞字 ${ev.collisions.length} 处`, lx, ly + 0.5);
      ctx.restore();
    }

    // I. 外围 171 原海报招牌虚线过程盒框
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#3E424A";
    ctx.lineWidth = 1.25;
    ctx.strokeRect(stageBox.x, stageBox.y, stageBox.w, stageBox.h);
    ctx.restore();

    // 底沿操作微提示（画布内不遮主内容）
    ctx.save();
    ctx.font = `500 ${isCompact ? 9.5 : 10.5}px ${FONT_ZH}`;
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hint = isCompact
      ? "左右横拖调扰动度 · 拖字片贴胶带微调"
      : "空白处左右横拖连续调扰动度 · 拖移任意字片贴胶带锁定（双击解钉）· 空格键再撒一版";
    ctx.fillText(hint, W / 2, H - (isCompact ? 10 : 13));
    ctx.restore();

    ctx.restore();
  }

  // ---------- 指针与触摸交互（保证竖滑滚屏不被拦截，横向拖动驱动扰动度，精准点中字片可自由挪位钉锁） ----------
  let touchLock = null; // null | "horiz" | "vert" | "slip"

  function getPoint(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function onStart(e) {
    const isTouch = e.type === "touchstart";
    const pt = getPoint(e);
    const hit = hitSlip(pt.x, pt.y);
    const st = getState();
    touchLock = null;

    if (hit && !isTouch) {
      activeDrag = {
        mode: "slip",
        slipId: hit.id,
        startX: pt.x,
        startY: pt.y,
        slipStartX: hit.x,
        slipStartY: hit.y,
        slipAngle: hit.angle,
        moved: false,
      };
      canvas.style.cursor = "grabbing";
    } else {
      // 触屏上默认准备检测横向拖动（既保证 data-perf-drag 水平拖动 100% 驱动扰动度，又允许用户竖向正常滚屏！）
      activeDrag = {
        mode: "disorder",
        hitSlip: hit,
        startX: pt.x,
        startY: pt.y,
        startDisorder: st.disorder,
        moved: false,
        isTouch,
      };
      if (!isTouch) canvas.style.cursor = "ew-resize";
    }
  }

  function onMove(e) {
    const pt = getPoint(e);
    if (!activeDrag) {
      if (!e.touches) {
        const hit = hitSlip(pt.x, pt.y);
        const nextHover = hit ? hit.id : null;
        if (nextHover !== hoverSlipId) {
          hoverSlipId = nextHover;
          canvas.style.cursor = hit ? "grab" : "ew-resize";
          dirty = true;
          runner.draw();
        }
      }
      return;
    }

    const dx = pt.x - activeDrag.startX;
    const dy = pt.y - activeDrag.startY;
    if (activeDrag.isTouch && !touchLock) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        // 竖向滚动页面，交还给浏览器
        touchLock = "vert";
        activeDrag = null;
        return;
      }
      touchLock = "horiz";
    }
    if (e.cancelable && (touchLock === "horiz" || activeDrag.mode === "slip" || !activeDrag.isTouch)) {
      e.preventDefault();
    }

    if (activeDrag.mode === "slip") {
      if (Math.hypot(dx, dy) > 4) activeDrag.moved = true;
      const nx = Math.max(0.06, Math.min(0.94, activeDrag.slipStartX + dx / stageBox.w));
      const ny = Math.max(0.07, Math.min(0.93, activeDrag.slipStartY + dy / stageBox.h));
      const st = getState();
      const nextPins = { ...(st.pins || {}), [activeDrag.slipId]: { x: nx, y: ny, angle: Math.max(-22, Math.min(22, activeDrag.slipAngle)) } };
      onStateChange({ pins: nextPins });
      dirty = true;
      runner.draw();
    } else {
      if (Math.abs(dx) > 3) activeDrag.moved = true;
      const delta = dx / Math.max(180, stageBox.w * 0.72);
      const nextDisorder = Math.max(0, Math.min(1, activeDrag.startDisorder + delta));
      onStateChange({ disorder: +nextDisorder.toFixed(3) });
      dirty = true;
      runner.draw();
    }
  }

  function onEnd() {
    if (!activeDrag) return;
    // 点按单字片未拖动：切换胶带锁定/解钉
    if (activeDrag.mode === "slip" && !activeDrag.moved) {
      const st = getState();
      const nextPins = { ...(st.pins || {}) };
      if (nextPins[activeDrag.slipId]) {
        delete nextPins[activeDrag.slipId];
      } else {
        nextPins[activeDrag.slipId] = {
          x: activeDrag.slipStartX,
          y: activeDrag.slipStartY,
          angle: Math.max(-18, Math.min(18, activeDrag.slipAngle)),
        };
      }
      onStateChange({ pins: nextPins });
    }
    activeDrag = null;
    touchLock = null;
    canvas.style.cursor = hoverSlipId ? "grab" : "ew-resize";
    dirty = true;
    runner.draw();
  }

  canvas.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);
  canvas.addEventListener("touchstart", onStart, { passive: true });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onEnd);
  canvas.addEventListener("touchcancel", onEnd);

  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onStateChange({ disorder: Math.max(0, +(st.disorder - 0.05).toFixed(2)) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onStateChange({ disorder: Math.min(1, +(st.disorder + 0.05).toFixed(2)) });
    } else if (e.key === " ") {
      e.preventDefault();
      onStateChange({ seed: st.seed + 1 });
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(canvas);

  const runner = loop(canvas, render);
  resize();
  runner.draw();

  return {
    refresh() {
      dirty = true;
      runner.draw();
    },
    getMetrics() {
      const layout = computeLayout(getState(), stageBox.aspect);
      return { layout, ev: evaluateLayout(layout) };
    },
  };
}
