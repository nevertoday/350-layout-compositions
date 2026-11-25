// 122 简化构图原则 · 开场双联解剖台（2D Canvas）
// 左室（视觉输入：可点剥杂件、可拖三基本形、空白/中桥横拖 data-perf-drag 调轮廓规整度）
// → 中央原海报松绿转换箭
// → 右室（大脑实时简化解读：随左室单真源分析结果收敛、重影或失义预警）

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  REGULARITY_BAND,
  analyze,
  buildCoreLocalPoints,
  clamp,
  clutterHitTest,
  coreWorldPoly,
} from "./model.js";

export function mountHeroStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");

  // 动画平滑态（只用于视觉过渡，绝不污染单真源 model.js）
  const anim = {
    intro: 0,
    arrowPulse: 0,
    smoothReg: getState().regularity,
    smoothClutter: { fork: 1, arc: 1, chips: 1 },
    smoothCores: {
      circle: { u: 0.5, v: 0.22, a: 1 },
      square: { u: 0.5, v: 0.50, a: 1 },
      triangle: { u: 0.5, v: 0.78, a: 1 },
    },
    popEffects: [], // { u, v, color, life }
    hoverTarget: null, // { type: 'clutter'|'core'|'fix', id }
  };

  let layout = null; // { w, h, vertical, leftBox, rightBox, bridgeBox, fixBtn }
  let dragMode = null; // { type: 'scrub'|'core', coreKey?, startX, startY, moved, startReg, offsetU, offsetV }

  function computeLayout(w, h) {
    const vertical = w < 560 && h >= w * 0.82;
    const pad = vertical ? 10 : Math.max(14, Math.round(w * 0.016));
    const headH = vertical ? 24 : 30;
    const footH = vertical ? 22 : 24;

    if (!vertical) {
      const bridgeW = clamp(Math.round(w * 0.092), 64, 112);
      const chamberW = (w - pad * 2 - bridgeW) / 2;
      const chamberH = h - pad * 2 - headH - footH;
      const topY = pad + headH;
      return {
        w,
        h,
        vertical: false,
        leftBox: { x: pad, y: topY, w: chamberW, h: chamberH },
        bridgeBox: { x: pad + chamberW, y: topY, w: bridgeW, h: chamberH },
        rightBox: { x: pad + chamberW + bridgeW, y: topY, w: chamberW, h: chamberH },
        headH,
        footH,
        pad,
        fixBtn: null,
      };
    }

    const bridgeH = 38;
    const chamberW = w - pad * 2;
    const chamberH = (h - pad * 2 - headH - footH - bridgeH) / 2;
    const topY = pad + headH;
    return {
      w,
      h,
      vertical: true,
      leftBox: { x: pad, y: topY, w: chamberW, h: chamberH },
      bridgeBox: { x: pad, y: topY + chamberH, w: chamberW, h: bridgeH },
      rightBox: { x: pad, y: topY + chamberH + bridgeH, w: chamberW, h: chamberH },
      headH,
      footH,
      pad,
      fixBtn: null,
    };
  }

  // 在腔室内保持 1:1 等比正方形工作区，确保圆永远是真圆（绝不拉扁！）
  function squareIn(box) {
    const s = Math.min(box.w * 0.92, box.h * 0.90);
    return {
      x: box.x + (box.w - s) / 2,
      y: box.y + (box.h - s) / 2,
      s,
    };
  }

  function toPixel(sq, u, v) {
    return [sq.x + u * sq.s, sq.y + v * sq.s];
  }

  function fromPixel(sq, px, py) {
    return [(px - sq.x) / sq.s, (py - sq.y) / sq.s];
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    layout = computeLayout(w, h);
    return dpr;
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function drawPoly(sq, poly, fill, stroke, lineWidth = 0) {
    if (!poly.length) return;
    ctx.beginPath();
    const [x0, y0] = toPixel(sq, poly[0][0], poly[0][1]);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < poly.length; i++) {
      const [xi, yi] = toPixel(sq, poly[i][0], poly[i][1]);
      ctx.lineTo(xi, yi);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke && lineWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function drawDraftingGrid(box, tint = "rgba(14, 17, 16, 0.055)") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    const step = 24;
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = Math.floor(box.x / step) * step; gx <= box.x + box.w; gx += step) {
      ctx.moveTo(gx + 0.5, box.y);
      ctx.lineTo(gx + 0.5, box.y + box.h);
    }
    for (let gy = Math.floor(box.y / step) * step; gy <= box.y + box.h; gy += step) {
      ctx.moveTo(box.x, gy + 0.5);
      ctx.lineTo(box.x + box.w, gy + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 绘制原海报风格的白边黑点虚线引注
  function drawLeader(x1, y1, mx, my, x2, y2, text, alignRight, accent = PALETTE.ink) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(mx, my);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 原海报标志：白环黑芯点
    ctx.fillStyle = PALETTE.paperLight;
    ctx.beginPath();
    ctx.arc(x1, y1, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x1, y1, 3.1, 0, Math.PI * 2);
    ctx.fill();

    if (text) {
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = accent;
      ctx.textAlign = alignRight ? "right" : "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, alignRight ? x2 - 4 : x2 + 4, y2);
    }
    ctx.restore();
  }

  // 绘制左室 3 枚干扰杂件（1:1 化用 122 原海报深靛蓝斜叉三横杠、暖灰底弧与角噪）
  function drawClutterLayer(sq, state, alphaMap, isBehind) {
    const subj = state.subject;
    // 1. 暖灰底弧（位于核心图形后方，复刻 122 原海报右下四分之一暖灰圆块）
    if (isBehind && alphaMap.arc > 0.02) {
      ctx.save();
      ctx.globalAlpha = alphaMap.arc;
      const [cx, cy] = toPixel(sq, 0.56, 0.67);
      const rad = sq.s * 0.205;
      ctx.fillStyle = PALETTE.stone;
      ctx.beginPath();
      if (subj === "logo") {
        // 外衬冗圈
        ctx.strokeStyle = PALETTE.stone;
        ctx.lineWidth = Math.max(8, sq.s * 0.042);
        ctx.arc(sq.x + sq.s * 0.50, sq.y + sq.s * 0.52, sq.s * 0.36, -0.35, Math.PI * 1.45);
        ctx.stroke();
      } else if (subj === "card") {
        // 花哨背景角块
        ctx.fillRect(sq.x + sq.s * 0.44, sq.y + sq.s * 0.48, sq.s * 0.38, sq.s * 0.32);
      } else {
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rad, -0.15, Math.PI * 0.55);
        ctx.closePath();
        ctx.fill();
      }
      if (anim.hoverTarget?.type === "clutter" && anim.hoverTarget.id === "arc") {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (isBehind) return;

    // 2. 深靛蓝斜叉条 + 左侧三横杠（复刻 122 原海报最醒目的深蓝斜杠干扰体！）
    if (alphaMap.fork > 0.02) {
      ctx.save();
      ctx.globalAlpha = alphaMap.fork;
      ctx.fillStyle = PALETTE.navy;
      // 主斜杠
      const [fx, fy] = toPixel(sq, 0.47, 0.50);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(-0.74);
      const bw = sq.s * 0.52;
      const bh = sq.s * 0.095;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      if (subj === "card") {
        // 促销斜带上的小斜纹提示
        ctx.fillStyle = PALETTE.paperLight;
        ctx.font = '700 10px "DM Mono", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("HOT -50% NEW", 0, 0.5);
      }
      ctx.restore();

      // 左侧三道平行深蓝横杠（原海报 122 标志性三齿）
      const barX = sq.x + sq.s * 0.16;
      const barW = sq.s * 0.21;
      const barH = Math.max(5, sq.s * 0.028);
      for (let i = 0; i < 3; i++) {
        const by = sq.y + sq.s * (0.57 + i * 0.056);
        ctx.fillRect(barX, by, barW + (i === 0 ? sq.s * 0.03 : 0), barH);
      }
      if (anim.hoverTarget?.type === "clutter" && anim.hoverTarget.id === "fork") {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(barX - 4, sq.y + sq.s * 0.28, sq.s * 0.62, sq.s * 0.48);
      }
      ctx.restore();
    }

    // 3. 三处角部零碎噪块（修饰角标 / 锯齿饰钉 / 漂浮彩屑）
    if (alphaMap.chips > 0.02) {
      ctx.save();
      ctx.globalAlpha = alphaMap.chips;
      const spots = [
        { u: 0.20, v: 0.24, c: PALETTE.navy, kind: "zig" },
        { u: 0.81, v: 0.24, c: PALETTE.orange, kind: "dots" },
        { u: 0.80, v: 0.78, c: PALETTE.pink, kind: "cross" },
      ];
      for (const s of spots) {
        const [px, py] = toPixel(sq, s.u, s.v);
        const sz = sq.s * 0.042;
        ctx.strokeStyle = s.c;
        ctx.fillStyle = s.c;
        ctx.lineWidth = 2.4;
        if (s.kind === "zig") {
          ctx.beginPath();
          ctx.moveTo(px - sz, py);
          ctx.lineTo(px - sz * 0.3, py - sz * 0.7);
          ctx.lineTo(px + sz * 0.3, py + sz * 0.6);
          ctx.lineTo(px + sz, py - sz * 0.3);
          ctx.stroke();
        } else if (s.kind === "dots") {
          for (let k = -1; k <= 1; k++) {
            ctx.beginPath();
            ctx.arc(px + k * sz * 0.7, py + (k % 2 ? -sz * 0.35 : sz * 0.35), sz * 0.26, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(px - sz * 0.7, py - sz * 0.7);
          ctx.lineTo(px + sz * 0.7, py + sz * 0.7);
          ctx.moveTo(px + sz * 0.7, py - sz * 0.7);
          ctx.lineTo(px - sz * 0.7, py + sz * 0.7);
          ctx.stroke();
        }
      }
      if (anim.hoverTarget?.type === "clutter" && anim.hoverTarget.id === "chips") {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 3]);
        for (const s of spots) {
          const [px, py] = toPixel(sq, s.u, s.v);
          ctx.beginPath();
          ctx.arc(px, py, sq.s * 0.075, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // 绘制单个核心图形（兼顾三种题材的微妙装饰提示，始终以圆/方/三角为几何主角）
  function drawCoreShape(sq, kind, core, regularity, subject, opts = {}) {
    const { ghost = false, highlight = false, alpha = 1, forceClean = false, overridePos = null } = opts;
    const c = overridePos ? { ...core, ...overridePos } : core;
    const reg = forceClean ? 76 : regularity;
    const poly = coreWorldPoly(kind, c, reg, subject);
    const fillMap = {
      circle: PALETTE.orange,
      square: PALETTE.green,
      triangle: PALETTE.pink,
    };
    ctx.save();
    ctx.globalAlpha = alpha;
    if (ghost) {
      drawPoly(sq, poly, "rgba(180, 28, 36, 0.06)", PALETTE.danger, 1.8);
      ctx.setLineDash([5, 4]);
      drawPoly(sq, poly, null, PALETTE.danger, 1.8);
      ctx.setLineDash([]);
      const [cx, cy] = toPixel(sq, c.u, c.v);
      ctx.fillStyle = PALETTE.danger;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("已误删·点补回", cx, cy);
    } else {
      drawPoly(sq, poly, fillMap[kind], highlight ? PALETTE.ink : null, highlight ? 2.2 : 0);
      // 卡片题材下在绿色方块内画两条极简文本横杠，让卡片隐喻更直观
      if (subject === "card" && kind === "square" && !forceClean) {
        const [cx, cy] = toPixel(sq, c.u, c.v);
        const bw = c.r * sq.s * 1.1;
        ctx.fillStyle = "rgba(252, 248, 242, 0.88)";
        ctx.fillRect(cx - bw / 2, cy - bw * 0.22, bw, Math.max(3, bw * 0.14));
        ctx.fillStyle = "rgba(252, 248, 242, 0.55)";
        ctx.fillRect(cx - bw / 2, cy + bw * 0.08, bw * 0.72, Math.max(2.5, bw * 0.11));
      }
      // 中心微妙抓握圆点（仅左室悬停或拖动时出现）
      if (highlight) {
        const [cx, cy] = toPixel(sq, c.u, c.v);
        ctx.fillStyle = PALETTE.paperLight;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 绘制中央原海报标志松绿转换箭（随简化达标程度变饱满、居中对齐）
  function drawCenterBridge(box, info, vertical, t) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const isErr = info.status === "missing_core" || info.status === "homogenized";
    const color = info.isOptimal ? PALETTE.green : isErr ? PALETTE.danger : PALETTE.navy;

    ctx.save();
    // 淡淡中轴刻度
    ctx.strokeStyle = "rgba(14, 17, 16, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    if (!vertical) {
      ctx.moveTo(cx, box.y + 8);
      ctx.lineTo(cx, box.y + box.h - 8);
    } else {
      ctx.moveTo(box.x + 12, cy);
      ctx.lineTo(box.x + box.w - 12, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 箭头主体（1:1 复刻原海报厚实几何松绿箭）
    const pulse = info.isOptimal ? Math.sin(t * 2.4) * 2.5 : 0;
    ctx.save();
    ctx.translate(cx + (vertical ? 0 : pulse), cy + (vertical ? pulse * 0.7 : 0));
    if (vertical) ctx.rotate(Math.PI / 2);
    const aw = vertical ? 24 : clamp(box.w * 0.54, 34, 52);
    const shaftH = aw * 0.32;
    const headW = aw * 0.44;
    const headH = aw * 0.82;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-aw / 2, -shaftH / 2);
    ctx.lineTo(aw / 2 - headW, -shaftH / 2);
    ctx.lineTo(aw / 2 - headW, -headH / 2);
    ctx.lineTo(aw / 2, 0);
    ctx.lineTo(aw / 2 - headW, headH / 2);
    ctx.lineTo(aw / 2 - headW, shaftH / 2);
    ctx.lineTo(-aw / 2, shaftH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 箭下/箭旁简短实测读数（规整度 + 折点数）
    if (!vertical) {
      ctx.fillStyle = color;
      ctx.font = '600 11px "DM Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${Math.round(anim.smoothReg)}%`, cx, cy + 28);
      ctx.fillStyle = PALETTE.inkMid;
      ctx.font = '500 10px "Noto Sans SC", sans-serif';
      ctx.fillText(info.isOptimal ? "最简解码" : isErr ? "过简失义" : "脑内简译", cx, cy + 44);
    } else {
      ctx.fillStyle = color;
      ctx.font = '600 11px "DM Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`规整 ${Math.round(anim.smoothReg)}%`, cx + 22, cy);
      ctx.fillStyle = PALETTE.inkMid;
      ctx.textAlign = "right";
      ctx.font = '500 10px "Noto Sans SC", sans-serif';
      ctx.fillText(info.loadTier, cx - 22, cy);
    }
    ctx.restore();
  }

  // 绘制右室「大脑的简化解读」（实时响应左室几何状态！）
  function drawRightDecodeChamber(box, state, info, t) {
    const sq = squareIn(box);
    const subj = info.subject;
    const keys = ["circle", "square", "triangle"];

    // 1. 当左室存在杂件或重度遮挡/锯齿时：在右室底层画「大脑拆解冲突重影」，让认知成本可视化
    const stress =
      (info.activeClutterCount * 0.25) +
      (info.jagged * 0.45) +
      (Math.max(0, info.coreOverlapPct - 12) / 60);

    if (stress > 0.06 && info.activeCoreCount === 3 && info.homogenize === 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(180, 28, 36, 0.28)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      const jitter = Math.min(1, stress) * 0.042;
      const offsets = [
        [Math.cos(t * 1.4) * jitter, Math.sin(t * 1.1) * jitter],
        [-Math.sin(t * 1.2) * jitter * 0.8, Math.cos(t * 1.5) * jitter * 0.8],
      ];
      for (const [ou, ov] of offsets) {
        for (const k of keys) {
          const sc = anim.smoothCores[k];
          const ghostCore = { u: sc.u + ou, v: sc.v + ov, r: 0.132, rot: 0 };
          const poly = coreWorldPoly(k, ghostCore, 76, state.subject);
          drawPoly(sq, poly, null, "rgba(180, 28, 36, 0.24)", 1.2);
        }
      }
      ctx.restore();
    }

    // 2. 达标时绘制淡淡的秩序对齐轴线
    if (info.axisAligned && info.activeCoreCount === 3) {
      ctx.save();
      ctx.strokeStyle = "rgba(19, 89, 54, 0.24)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      const cs = keys.map((k) => anim.smoothCores[k]);
      const isVert = info.layoutPattern === "原海报竖塔解";
      const isHoriz = info.layoutPattern === "横向等距解";
      ctx.beginPath();
      if (isVert) {
        const [x] = toPixel(sq, cs[0].u, 0.06);
        ctx.moveTo(x, sq.y + sq.s * 0.05);
        ctx.lineTo(x, sq.y + sq.s * 0.95);
      } else if (isHoriz) {
        const [, y] = toPixel(sq, 0.06, cs[0].v);
        ctx.moveTo(sq.x + sq.s * 0.05, y);
        ctx.lineTo(sq.x + sq.s * 0.95, y);
      } else {
        const [x0, y0] = toPixel(sq, cs[0].u, cs[0].v);
        const [x1, y1] = toPixel(sq, cs[1].u, cs[1].v);
        const [x2, y2] = toPixel(sq, cs[2].u, cs[2].v);
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. 绘制大脑解码后的核心基本形
    const decodeAlpha = info.isOptimal ? 1 : info.homogenize > 0 ? 0.85 : clamp(0.95 - stress * 0.34, 0.45, 0.95);
    const decodeReg = info.homogenize > 0 ? state.regularity : 76; // 过度均质化会直接连大脑读到的辨识轮廓一起磨平！

    for (const k of keys) {
      const sc = anim.smoothCores[k];
      const active = state.cores[k].active;
      const targetCore = { u: sc.u, v: sc.v, r: 0.132, rot: 0, active };
      if (!active) {
        // 误删核心后，右室呈现空缺虚线框提示「语义残缺」
        drawCoreShape(sq, k, targetCore, 76, state.subject, { ghost: true, alpha: 0.92, forceClean: true });
      } else if (info.homogenize > 0) {
        // 过度均质化：三形都被磨成无差别单调圆块，且带问号警示
        const poly = coreWorldPoly(k, targetCore, decodeReg, state.subject);
        const col = k === "circle" ? PALETTE.orange : k === "square" ? PALETTE.green : PALETTE.pink;
        drawPoly(sq, poly, col, PALETTE.danger, 2);
        const [cx, cy] = toPixel(sq, sc.u, sc.v);
        ctx.fillStyle = PALETTE.paperLight;
        ctx.font = '700 13px "DM Mono", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", cx, cy);
      } else {
        drawCoreShape(sq, k, targetCore, decodeReg, state.subject, {
          alpha: decodeAlpha,
          forceClean: true,
        });
      }
    }

    // 4. 原海报标志性右侧引注（桌面宽屏下完整展示，避免窄屏挤字）
    if (!layout.vertical && box.w >= 340) {
      const cPos = anim.smoothCores.circle;
      const sPos = anim.smoothCores.square;
      const [cx, cy] = toPixel(sq, cPos.u, cPos.v);
      const [sx, sy] = toPixel(sq, sPos.u, sPos.v);
      const noteX = box.x + box.w - 14;
      const accentTop = info.isOptimal ? PALETTE.green : info.status === "missing_core" || info.status === "homogenized" ? PALETTE.danger : PALETTE.inkMid;
      const topLabel = info.isOptimal
        ? "最简三原形"
        : info.status === "missing_core"
          ? "骨架残缺"
          : info.status === "homogenized"
            ? "形态撞脸"
            : `待减负·${info.contourBends}折`;
      if (state.cores.circle.active && cx < noteX - 88) {
        drawLeader(cx + 12, cy - 8, Math.min(noteX - 78, cx + 48), Math.max(box.y + 24, cy - 28), noteX - 66, Math.max(box.y + 24, cy - 28), topLabel, false, accentTop);
      }
      if (state.cores.square.active && sx < noteX - 88) {
        const subLabel = `${subj.coreNames.circle}·${subj.coreNames.square}·${subj.coreNames.triangle}`;
        drawLeader(sx + 16, sy + 6, Math.min(noteX - 96, sx + 54), Math.min(box.y + box.h - 24, sy + 20), noteX - 88, Math.min(box.y + box.h - 24, sy + 20), info.isOptimal ? subLabel.slice(0, 7) : `遮挡 ${info.coreOverlapPct}%`, false, PALETTE.inkMid);
      }
    }
  }

  // 绘制画布上的交互状态角标与一键纠错红签
  function drawChamberChrome(state, info) {
    const { leftBox, rightBox, vertical, headH, footH, pad, w, h } = layout;

    // 顶栏室名（左侧输入室 / 右侧简译室）
    ctx.save();
    const compact = w < 860;
    ctx.font = compact ? '700 11px "Noto Sans SC", sans-serif' : '700 12px "Noto Sans SC", sans-serif';
    ctx.textBaseline = "middle";

    // 左室标题
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "left";
    ctx.fillText(
      compact ? "01 视觉输入" : `01 输入 · ${info.subject.leftTitle}`,
      leftBox.x + 2,
      pad + headH * 0.48
    );

    if (!vertical) {
      // 右室标题
      ctx.fillStyle = info.isOptimal ? PALETTE.green : PALETTE.ink;
      ctx.fillText(
        compact ? "02 大脑简译" : `02 解读 · ${info.subject.rightTitle}`,
        rightBox.x + 2,
        pad + headH * 0.48
      );
    } else {
      // 竖屏下右室标题压在桥下方小标签内
      ctx.fillStyle = info.isOptimal ? PALETTE.green : PALETTE.ink;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillText(
        `02 解读 · ${info.subject.rightTitle}`,
        rightBox.x + 8,
        rightBox.y + 13
      );
    }

    // 顶部右侧实测芯片（折点数 · 遮挡率 · 达标度）
    const chipText = compact
      ? `${info.contourBends}折 · 叠${info.coreOverlapPct}% · ${info.passCount}/4`
      : `${info.contourBends} 折点 · 遮挡 ${info.coreOverlapPct}% · ${info.passCount}/4`;
    ctx.font = compact ? '500 10.5px "DM Mono", monospace' : '500 11px "DM Mono", monospace';
    const cw = ctx.measureText(chipText).width + (compact ? 14 : 18);
    const ch = 22;
    const cx = w - pad - cw;
    const cy = pad + (headH - ch) / 2;
    ctx.fillStyle = info.isOptimal ? PALETTE.green : PALETTE.ink;
    drawRoundedRect(cx, cy, cw, ch, 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.paperLight;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(chipText, cx + cw / 2, cy + ch / 2 + 0.5);

    // 左室内嵌一键纠错红签（仅错态时显示，点即修复当前首要阻塞）
    layout.fixBtn = null;
    if (info.canvasFix) {
      const label = info.canvasFix.label;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      const fw = Math.min(leftBox.w - 16, ctx.measureText(label).width + 20);
      const fh = 26;
      const fx = leftBox.x + 10;
      const fy = leftBox.y + 10;
      layout.fixBtn = { x: fx, y: fy, w: fw, h: fh, id: info.canvasFix.id };
      const hovered = anim.hoverTarget?.type === "fix";
      ctx.fillStyle = hovered ? PALETTE.danger : PALETTE.paperLight;
      drawRoundedRect(fx, fy, fw, fh, 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = hovered ? PALETTE.paperLight : PALETTE.danger;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, fx + 10, fy + fh / 2 + 0.5);
    } else {
      // 4/4 达标绿印章
      const okText = `✓ 4/4 · ${info.layoutPattern}`;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      const fw = ctx.measureText(okText).width + 20;
      const fh = 25;
      const fx = leftBox.x + 10;
      const fy = leftBox.y + 10;
      ctx.fillStyle = PALETTE.green;
      drawRoundedRect(fx, fy, fw, fh, 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.paperLight;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(okText, fx + 10, fy + fh / 2 + 0.5);
    }

    // 底部极简操作提示（单行不溢）
    ctx.fillStyle = PALETTE.inkMid;
    ctx.font = w < 680 ? '500 10.5px "Noto Sans SC", sans-serif' : '500 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const hint = (vertical || w < 680)
      ? "↔ 横拖调规整度 · 点蓝叉/灰弧剥离 · 拖圆方三角排秩序"
      : "↔ 画布空白或绿箭处左右横拖调规整度 · 直接点蓝叉/灰弧/角噪剥离 · 拖拽橘圆/绿方/粉三角调整秩序 · 方向键微调";
    ctx.fillText(hint, pad + 2, h - pad - footH * 0.42);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    const dpr = resize();
    const state = getState();
    const info = analyze(state);

    // 动画插值（still 为 true 时立刻落定终点，满足 prefers-reduced-motion）
    const ease = still ? 1 : clamp(dt * 11, 0.08, 1);
    anim.intro = still ? 1 : clamp(anim.intro + dt * 2.2, 0, 1);
    anim.smoothReg += (state.regularity - anim.smoothReg) * ease;
    for (const k of ["fork", "arc", "chips"]) {
      const target = state.clutter[k] ? 1 : 0;
      anim.smoothClutter[k] += (target - anim.smoothClutter[k]) * ease;
    }

    // 计算右室大脑解码目标位：若左室已形成合理秩序则镜像该秩序，否则收敛向最简标准竖塔
    const rightTargets = info.axisAligned
      ? {
          circle: state.cores.circle,
          square: state.cores.square,
          triangle: state.cores.triangle,
        }
      : {
          circle: { u: 0.5, v: 0.23 },
          square: { u: 0.5, v: 0.50 },
          triangle: { u: 0.5, v: 0.77 },
        };

    for (const k of ["circle", "square", "triangle"]) {
      const sc = anim.smoothCores[k];
      const tgt = rightTargets[k];
      if (still) {
        sc.u = tgt.u;
        sc.v = tgt.v;
      } else {
        sc.u += (tgt.u - sc.u) * clamp(dt * 8, 0.06, 1);
        sc.v += (tgt.v - sc.v) * clamp(dt * 8, 0.06, 1);
      }
    }

    // 更新剥离瞬态特效
    for (let i = anim.popEffects.length - 1; i >= 0; i--) {
      anim.popEffects[i].life -= still ? 1 : dt * 2.4;
      if (anim.popEffects[i].life <= 0) anim.popEffects.splice(i, 1);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 画布纸底
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, layout.w, layout.h);

    // 2. 绘制左室框与制图底格
    const { leftBox, bridgeBox, rightBox, vertical } = layout;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(leftBox.x, leftBox.y, leftBox.w, leftBox.h);
    drawDraftingGrid(leftBox);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(leftBox.x + 0.5, leftBox.y + 0.5, leftBox.w - 1, leftBox.h - 1);

    // 3. 绘制右室框（略亮纸面，强调解码后的净度）
    ctx.fillStyle = info.isOptimal ? "#F5FAF7" : PALETTE.paperLight;
    ctx.fillRect(rightBox.x, rightBox.y, rightBox.w, rightBox.h);
    drawDraftingGrid(rightBox, info.isOptimal ? "rgba(19, 89, 54, 0.06)" : "rgba(26, 41, 98, 0.045)");
    ctx.strokeStyle = info.isOptimal ? PALETTE.green : PALETTE.ink;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(rightBox.x + 0.5, rightBox.y + 0.5, rightBox.w - 1, rightBox.h - 1);

    // 4. 绘制左室「视觉输入」层：暖灰后底弧 → 辅助对齐线 → 三核心基本形 → 深蓝斜叉与角噪
    const leftSq = squareIn(leftBox);
    drawClutterLayer(leftSq, state, anim.smoothClutter, true);

    // 拖拽中线吸附辅助线（当核心形靠近 0.50 中轴时显示松绿细准线）
    if (dragMode?.type === "core") {
      const c = state.cores[dragMode.coreKey];
      ctx.save();
      ctx.strokeStyle = "rgba(19, 89, 54, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      if (Math.abs(c.u - 0.5) < 0.035) {
        const [mx] = toPixel(leftSq, 0.5, 0);
        ctx.beginPath();
        ctx.moveTo(mx, leftBox.y + 6);
        ctx.lineTo(mx, leftBox.y + leftBox.h - 6);
        ctx.stroke();
      }
      if (Math.abs(c.v - 0.51) < 0.035) {
        const [, my] = toPixel(leftSq, 0, 0.51);
        ctx.beginPath();
        ctx.moveTo(leftBox.x + 6, my);
        ctx.lineTo(leftBox.x + leftBox.w - 6, my);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 核心三形：按原海报叠层顺序（绿方 → 橘圆 → 粉三角）
    for (const k of ["square", "circle", "triangle"]) {
      const c = state.cores[k];
      const hl =
        (dragMode?.type === "core" && dragMode.coreKey === k) ||
        (anim.hoverTarget?.type === "core" && anim.hoverTarget.id === k);
      drawCoreShape(leftSq, k, c, anim.smoothReg, state.subject, {
        ghost: !c.active,
        highlight: hl,
      });
    }

    drawClutterLayer(leftSq, state, anim.smoothClutter, false);

    // 剥离瞬态扩散环
    for (const fx of anim.popEffects) {
      const [px, py] = toPixel(leftSq, fx.u, fx.v);
      ctx.save();
      ctx.globalAlpha = clamp(fx.life, 0, 1);
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, (1.1 - fx.life) * leftSq.s * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. 中央松绿转换箭桥
    drawCenterBridge(bridgeBox, info, vertical, t);

    // 6. 右室「大脑的简化解读」
    drawRightDecodeChamber(rightBox, state, info, t);

    // 7. 顶栏室名、一键红警签与操作提示
    drawChamberChrome(state, info);

    ctx.restore();
  }

  // 指针命中检测
  function hitTest(px, py) {
    if (!layout) return null;
    // 1. 画布一键纠错红签
    const fb = layout.fixBtn;
    if (fb && px >= fb.x && px <= fb.x + fb.w && py >= fb.y && py <= fb.y + fb.h) {
      return { type: "fix", id: fb.id };
    }
    // 2. 左室图形命中
    const lb = layout.leftBox;
    if (px >= lb.x && px <= lb.x + lb.w && py >= lb.y && py <= lb.y + lb.h) {
      const sq = squareIn(lb);
      const [u, v] = fromPixel(sq, px, py);
      const state = getState();
      // 优先命中上方干扰杂件（斜叉、角噪）
      for (const ck of ["fork", "chips"]) {
        if (state.clutter[ck] && clutterHitTest(ck, u, v)) {
          return { type: "clutter", id: ck, u, v };
        }
      }
      // 再命中三核心图形（顶部绘制的优先：三角 → 圆 → 方）
      for (const k of ["triangle", "circle", "square"]) {
        const c = state.cores[k];
        if (Math.hypot(u - c.u, v - c.v) <= c.r * 1.08) {
          return { type: "core", id: k, u, v };
        }
      }
      // 最后命中后方暖灰底弧
      if (state.clutter.arc && clutterHitTest("arc", u, v)) {
        return { type: "clutter", id: "arc", u, v };
      }
    }
    return null;
  }

  function clientToCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function applyQuickFix(id) {
    onMutate((st) => {
      if (id === "restore_cores") {
        st.cores.circle.active = true;
        st.cores.square.active = true;
        st.cores.triangle.active = true;
      } else if (id === "fix_homogenize" || id === "fix_jagged") {
        st.regularity = 76;
      } else if (id === "strip_clutter") {
        st.clutter.fork = false;
        st.clutter.arc = false;
        st.clutter.chips = false;
      } else if (id === "fix_order") {
        st.cores.circle = { ...st.cores.circle, u: 0.50, v: 0.22, r: 0.135, rot: 0, active: true };
        st.cores.square = { ...st.cores.square, u: 0.50, v: 0.50, r: 0.132, rot: 0, active: true };
        st.cores.triangle = { ...st.cores.triangle, u: 0.50, v: 0.78, r: 0.140, rot: 0, active: true };
      }
    });
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const [px, py] = clientToCanvas(e);
    const hit = hitTest(px, py);

    if (hit?.type === "fix") {
      applyQuickFix(hit.id);
      return;
    }

    if (hit?.type === "clutter") {
      onMutate((st) => {
        st.clutter[hit.id] = false;
      });
      anim.popEffects.push({
        u: hit.u,
        v: hit.v,
        color: hit.id === "fork" ? PALETTE.navy : PALETTE.orange,
        life: 1,
      });
      return;
    }

    if (hit?.type === "core") {
      const state = getState();
      const c = state.cores[hit.id];
      if (!c.active) {
        onMutate((st) => {
          st.cores[hit.id].active = true;
        });
        return;
      }
      canvas.setPointerCapture(e.pointerId);
      dragMode = {
        type: "core",
        coreKey: hit.id,
        startX: px,
        startY: py,
        moved: false,
        offsetU: c.u - hit.u,
        offsetV: c.v - hit.v,
      };
      return;
    }

    // 空白区域或中央转换箭桥：左右横拖连续调节「轮廓规整度」（兼容 data-perf-drag 中心水平扫拖！）
    canvas.setPointerCapture(e.pointerId);
    dragMode = {
      type: "scrub",
      startX: px,
      startY: py,
      moved: false,
      startReg: getState().regularity,
    };
  });

  canvas.addEventListener("pointermove", (e) => {
    const [px, py] = clientToCanvas(e);
    if (!dragMode) {
      const hit = hitTest(px, py);
      anim.hoverTarget = hit;
      canvas.style.cursor =
        hit?.type === "fix" || hit?.type === "clutter"
          ? "pointer"
          : hit?.type === "core"
            ? "grab"
            : "ew-resize";
      return;
    }

    const dx = px - dragMode.startX;
    const dy = py - dragMode.startY;
    if (Math.hypot(dx, dy) > 4) dragMode.moved = true;

    if (dragMode.type === "core") {
      canvas.style.cursor = "grabbing";
      const sq = squareIn(layout.leftBox);
      const [u, v] = fromPixel(sq, px, py);
      let nu = clamp(u + dragMode.offsetU, 0.14, 0.86);
      let nv = clamp(v + dragMode.offsetV, 0.15, 0.85);
      // 柔和吸附到中心竖轴 / 中心横轴
      if (Math.abs(nu - 0.5) < 0.028) nu = 0.5;
      if (Math.abs(nv - 0.51) < 0.028) nv = 0.51;
      onMutate((st) => {
        st.cores[dragMode.coreKey].u = +nu.toFixed(3);
        st.cores[dragMode.coreKey].v = +nv.toFixed(3);
        st.cores[dragMode.coreKey].rot = 0;
      });
    } else if (dragMode.type === "scrub") {
      const span = Math.max(180, layout.w * 0.42);
      const nextReg = Math.round(clamp(dragMode.startReg + (dx / span) * 100, 0, 100));
      onMutate((st) => {
        st.regularity = nextReg;
      });
    }
  });

  function endDrag(e) {
    if (!dragMode) return;
    try {
      if (e && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    } catch {}
    dragMode = null;
    canvas.style.cursor = "ew-resize";
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (!dragMode) anim.hoverTarget = null;
  });

  // 键盘可访问性：左右键调规整度，1/2/3 开关三杂件，R 复原
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onMutate((st) => {
        st.regularity = clamp(st.regularity + 5, 0, 100);
      });
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onMutate((st) => {
        st.regularity = clamp(st.regularity - 5, 0, 100);
      });
    } else if (e.key === "1") {
      onMutate((st) => { st.clutter.fork = !st.clutter.fork; });
    } else if (e.key === "2") {
      onMutate((st) => { st.clutter.arc = !st.clutter.arc; });
    } else if (e.key === "3") {
      onMutate((st) => { st.clutter.chips = !st.clutter.chips; });
    }
  });

  // 也监听 touch 事件兜底（确保 CDP dispatchTouchEvent 触发顺滑重绘）
  let touchScrub = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const px = t0.clientX - r.left;
    const py = t0.clientY - r.top;
    const hit = hitTest(px, py);
    if (!hit) {
      touchScrub = { startX: px, startY: py, startReg: getState().regularity, locked: false };
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (dragMode || !touchScrub || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const dx = (t0.clientX - r.left) - touchScrub.startX;
    const dy = (t0.clientY - r.top) - touchScrub.startY;
    if (!touchScrub.locked) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
        touchScrub.locked = true;
      } else if (Math.abs(dy) > 10) {
        touchScrub = null;
        return;
      }
    }
    if (touchScrub.locked) {
      const span = Math.max(150, (layout?.w || 360) * 0.5);
      const nextReg = Math.round(clamp(touchScrub.startReg + (dx / span) * 100, 0, 100));
      onMutate((st) => {
        st.regularity = nextReg;
      });
    }
  }, { passive: true });

  canvas.addEventListener("touchend", () => { touchScrub = null; }, { passive: true });
  canvas.addEventListener("touchcancel", () => { touchScrub = null; }, { passive: true });

  const ctl = loop(canvas, render);
  window.addEventListener("resize", () => ctl.draw());

  return {
    draw: ctl.draw,
    // 提供对外测试/渲染检查接口
    getLayout: () => layout,
    getSamplePolys: () => ({
      circle: buildCoreLocalPoints("circle", getState().regularity, getState().subject).length,
    }),
  };
}
