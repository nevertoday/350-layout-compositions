// 293 布局切换模式 — 开场双态重组蓝图台（2D Canvas）
// 宽屏（>=640px）：1:1 承袭 293 原海报「左暖米 切换前线性 | 中缝切换拉帘与 FLIP 弧线 | 右柔樱粉 切换后模块重组」
// 窄屏（<640px）：自动切换为等比单镜连续帘幕变形台，横拖即看线性流与模块网无缝重组，绝不压扁。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  SUBJECTS,
  TEMPLATES,
  LINEAR_SLOTS,
  VIEW_MIN,
  VIEW_MAX,
  evaluate,
} from "./model.js";

const SCRAMBLED_COLORS = ["#64748B", "#C084FC", "#94A3B8", "#334155"];
const SCRAMBLED_SHAPES = ["triangle", "hexagon", "circle", "square"];

function easeOutCubic(x) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawShape(ctx, shape, cx, cy, r, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    const s = r * 1.75;
    ctx.rect(cx - s / 2, cy - s / 2, s, s);
  } else if (shape === "triangle") {
    ctx.moveTo(cx, cy - r * 1.1);
    ctx.lineTo(cx + r * 1.1, cy + r * 0.9);
    ctx.lineTo(cx - r * 1.1, cy + r * 0.9);
    ctx.closePath();
  } else {
    // hexagon
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + Math.cos(a) * r * 1.08;
      const py = cy + Math.sin(a) * r * 1.08;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

function drawPill(ctx, x, y, w, h, fill, text, textColor, fontSize = 11) {
  ctx.save();
  const r = h / 2;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.font = `700 ${fontSize}px "Archivo", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
  ctx.restore();
}

function drawTextLines(ctx, x, y, w, count, color, gap = 7, thick = 2) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const lw = i === count - 1 ? w * 0.62 : i === count - 2 ? w * 0.86 : w;
    ctx.fillRect(x, y + i * gap, Math.max(8, lw), thick);
  }
  ctx.restore();
}

// 渲染单个模块卡片（支持线性态、原海报模块重组态、及换壳失锚错态）
function drawModuleCard(ctx, rect, mod, opts) {
  const {
    mode, // "linear" | "modular"
    role, // "hero" | "accent" | "support" | "footer" | "linear"
    keepIdentity,
    selected,
    crushed,
    compact,
  } = opts;

  const { x, y, w, h } = rect;
  const shape = keepIdentity || mode === "linear" ? mod.shape : SCRAMBLED_SHAPES[mod.id];
  const codeText = keepIdentity || mode === "linear" ? mod.code : "??";

  ctx.save();
  if (mode === "linear") {
    // 原海报左侧线性样式：左侧玫粉 01–04 索引块 + 右侧暖米卡体与几何形 + 横线
    const tabW = Math.min(48, Math.max(30, w * 0.21));
    ctx.fillStyle = PALETTE.creamCard;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = PALETTE.roseTab;
    ctx.fillRect(x, y, tabW, h);

    ctx.strokeStyle = "#DED4C9";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // 编号
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${compact ? 14 : 16}px "Archivo", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mod.code, x + tabW / 2, y + h / 2 + 0.5);

    // 几何图标
    const iconX = x + tabW + Math.min(28, (w - tabW) * 0.22);
    const iconR = Math.min(h * 0.27, 11);
    const shapeFill = mod.id === 0 || mod.id === 3 ? PALETTE.ink : PALETTE.rose;
    drawShape(ctx, shape, iconX, y + h / 2, iconR, shapeFill);

    // 标题 + 文本条
    const tx = iconX + iconR + 12;
    const tw = Math.max(20, x + w - tx - 12);
    if (h >= 44 && tw >= 56) {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(mod.title, tx, y + Math.max(6, h * 0.17));
      drawTextLines(ctx, tx, y + Math.max(23, h * 0.52), tw, 2, "#4B4347", 6, 1.8);
    } else {
      drawTextLines(ctx, tx, y + h / 2 - 7, tw, 3, "#2A2428", 6, 1.8);
    }
  } else {
    // 切换后模块重组样式：严格承袭 293 原海报黑/玫粉/暖米视觉权重
    const brokenSkin = !keepIdentity;
    if (role === "hero" && w > 120) {
      // 原海报 01 标志性黑白对分主模块（左黑方格配白字白图 + 右暖米大画幅）
      const splitW = Math.min(h * 0.92, w * 0.36);
      ctx.fillStyle = brokenSkin ? "#2E2C36" : PALETTE.ink;
      ctx.fillRect(x, y, splitW, h);
      ctx.fillStyle = brokenSkin ? "#E6E4EC" : PALETTE.creamCard;
      ctx.fillRect(x + splitW, y, w - splitW, h);

      ctx.fillStyle = brokenSkin ? "#A5A3B5" : "#FFFFFF";
      ctx.font = `800 ${compact ? 15 : 19}px "Archivo", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(codeText, x + 10, y + 8);

      const r = Math.min(splitW * 0.24, h * 0.2, 16);
      drawShape(ctx, shape, x + splitW / 2, y + h * 0.62, r, brokenSkin ? "#94A3B8" : "#FAF2E9");

      // 右侧内容区
      const rx = x + splitW + 12;
      const rw = Math.max(24, w - splitW - 22);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${compact ? 12 : 14}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(brokenSkin ? "未标模块" : mod.title, rx, y + Math.min(18, h * 0.16));
      if (h > 70 && rw > 60) {
        ctx.fillStyle = PALETTE.roseDeep;
        ctx.font = `600 10px "Archivo", sans-serif`;
        ctx.fillText(brokenSkin ? "UNTRACKED" : mod.sub, rx, y + Math.min(37, h * 0.33));
        drawTextLines(ctx, rx, y + Math.min(56, h * 0.52), rw, h > 105 ? 4 : 3, "#2A2428", 8, 2);
      } else {
        drawTextLines(ctx, rx, y + h * 0.48, rw, 3, "#2A2428", 6, 1.8);
      }
    } else if (role === "accent") {
      // 原海报 02 玫粉大块
      ctx.fillStyle = brokenSkin ? SCRAMBLED_COLORS[mod.id] : PALETTE.rose;
      ctx.fillRect(x, y, w, h);

      const fg = brokenSkin ? "#F8FAFC" : PALETTE.ink;
      ctx.fillStyle = fg;
      ctx.font = `800 ${compact ? 15 : 18}px "Archivo", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(codeText, x + 10, y + 8);

      const r = Math.min(h * 0.16, w * 0.12, 13);
      drawShape(ctx, shape, x + 10 + r, y + h * 0.62, r, brokenSkin ? "#CBD5E1" : PALETTE.creamCard);

      const tx = x + 18 + r * 2;
      const tw = Math.max(16, x + w - tx - 10);
      if (tw > 46) {
        ctx.fillStyle = fg;
        ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
        ctx.fillText(brokenSkin ? "未标" : mod.title, tx, y + Math.max(10, h * 0.2));
        drawTextLines(ctx, tx, y + h * 0.52, tw, 3, brokenSkin ? "#E2E8F0" : "#1E171B", 6.5, 1.8);
      }
    } else if (role === "support") {
      // 原海报 03 暖米副卡
      ctx.fillStyle = brokenSkin ? "#E5E7EB" : PALETTE.creamCard;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `800 ${compact ? 14 : 17}px "Archivo", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(codeText, x + 9, y + 8);

      if (w > 92) {
        ctx.fillStyle = PALETTE.inkSoft;
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(brokenSkin ? "未标" : mod.title, x + 36, y + 11);
      }

      const r = Math.min(h * 0.16, w * 0.15, 11);
      const shapeColor = brokenSkin ? "#64748B" : PALETTE.rose;
      drawShape(ctx, shape, x + 10 + r, y + h * 0.68, r, shapeColor);

      const tx = x + 16 + r * 2;
      const tw = Math.max(12, x + w - tx - 8);
      if (tw > 34) {
        drawTextLines(ctx, tx, y + h * 0.56, tw, 3, "#2A2428", 5.5, 1.8);
      }
    } else {
      // footer 或宽屏线性块
      ctx.fillStyle = brokenSkin ? "#E2E8F0" : PALETTE.creamCard;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `800 ${compact ? 14 : 16}px "Archivo", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(codeText, x + 10, y + h / 2 + 0.5);

      const r = Math.min(h * 0.28, 11);
      const sx = x + 46;
      drawShape(ctx, shape, sx, y + h / 2, r, brokenSkin ? "#64748B" : PALETTE.ink);

      const tx = sx + r + 12;
      const tw = Math.max(16, x + w - tx - 12);
      if (tw > 60 && h >= 38) {
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(brokenSkin ? "未标模块" : mod.title, tx, y + Math.max(5, h * 0.16));
        drawTextLines(ctx, tx, y + Math.max(22, h * 0.56), tw, 2, "#2A2428", 6, 1.8);
      } else {
        drawTextLines(ctx, tx, y + h / 2 - 5, tw, 2, "#2A2428", 6, 1.8);
      }
    }

    // 卡片边框与状态描边
    ctx.strokeStyle = crushed ? PALETTE.err : selected ? PALETTE.roseBanner : "rgba(13,11,13,0.16)";
    ctx.lineWidth = selected ? 2.5 : crushed ? 2 : 1;
    if (selected) ctx.setLineDash([5, 3]);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.setLineDash([]);

    // 若被选中用于槽位互换，浮出轻巧提示签
    if (selected) {
      drawPill(ctx, x + w - 76, y + 6, 70, 18, PALETTE.roseBanner, "点别块互换", "#FFFFFF", 10);
    }
  }
  ctx.restore();
}

export function initHeroCanvas(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let dpr = 1;

  // 用于平滑 FLIP 过渡的模块当前渲染矩形缓存（归一化坐标）
  let animRight = null;
  let animCompact = null;
  let introProgress = 0;
  let rightHitBoxes = []; // [{ id, x, y, w, h }]
  let curtainX = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 手机上最高 DPR 1.5 保证软件渲染 60fps
    dpr = pixelRatio(rect.width < 640 ? 1.5 : 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function getTargetRightNorm(state) {
    const tpl = TEMPLATES[state.template];
    const out = new Array(4);
    for (let s = 0; s < 4; s++) {
      const id = state.slotOrder[s];
      out[id] = { ...tpl.slots[s], slotIndex: s };
    }
    return out;
  }

  function stepLerp(prev, target, rate, still) {
    if (!prev || still) return target.map((r) => ({ ...r }));
    const k = Math.min(1, rate);
    return target.map((t, i) => ({
      ...t,
      x: lerp(prev[i].x, t.x, k),
      y: lerp(prev[i].y, t.y, k),
      w: lerp(prev[i].w, t.w, k),
      h: lerp(prev[i].h, t.h, k),
    }));
  }

  // 绘制顶部连续视口标尺（360px ↔ 1200px），清晰标出当前视口与切换断点 BP
  function drawTopRuler(ctx, state, ev, rx, ry, rw, rh) {
    const prog = (state.viewportW - VIEW_MIN) / (VIEW_MAX - VIEW_MIN);
    const bpProg = Math.max(0, Math.min(1, (state.breakpoint - VIEW_MIN) / (VIEW_MAX - VIEW_MIN)));
    const curX = rx + prog * rw;
    const bpX = rx + bpProg * rw;

    ctx.save();
    // 轨道底线
    ctx.fillStyle = "rgba(13,11,13,0.10)";
    ctx.fillRect(rx, ry + rh / 2 - 2, rw, 4);

    // 线性区间（左侧暖米深线）vs 重组区间（右侧玫粉线）
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(rx, ry + rh / 2 - 2, Math.max(0, bpX - rx), 4);
    ctx.fillStyle = PALETTE.roseBanner;
    ctx.fillRect(bpX, ry + rh / 2 - 2, Math.max(0, rx + rw - bpX), 4);

    // 刻度数字
    const ticks = W < 520 ? [360, 720, 1200] : [360, 560, 768, 960, 1200];
    ctx.font = `500 10px "JetBrains Mono", monospace`;
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const tk of ticks) {
      const tx = rx + ((tk - VIEW_MIN) / (VIEW_MAX - VIEW_MIN)) * rw;
      ctx.fillRect(tx - 0.5, ry + rh / 2 + 4, 1, 5);
      ctx.fillText(`${tk}`, tx, ry + rh / 2 + 12);
    }

    // 断点菱形标记 BP
    ctx.fillStyle = ev.stepSwitch ? PALETTE.pass : PALETTE.err;
    ctx.beginPath();
    ctx.moveTo(bpX, ry + rh / 2 - 7);
    ctx.lineTo(bpX + 5.5, ry + rh / 2);
    ctx.lineTo(bpX, ry + rh / 2 + 7);
    ctx.lineTo(bpX - 5.5, ry + rh / 2);
    ctx.closePath();
    ctx.fill();

    ctx.font = `600 10px "JetBrains Mono", monospace`;
    ctx.textAlign = bpProg > 0.85 ? "right" : bpProg < 0.15 ? "left" : "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`BP ${state.breakpoint}px`, bpX, ry + rh / 2 - 9);

    // 当前视口游标胶囊（略上提，避免与下方刻度文字碰头）
    const pillW = W < 520 ? 72 : 80;
    const clampedX = Math.max(rx + pillW / 2, Math.min(rx + rw - pillW / 2, curX));
    const isSwitched = state.viewportW >= state.breakpoint;
    drawPill(
      ctx,
      clampedX - pillW / 2,
      ry + rh / 2 - 14,
      pillW,
      20,
      isSwitched ? PALETTE.roseBanner : PALETTE.ink,
      `${Math.round(state.viewportW)}px`,
      "#FFFFFF",
      11
    );
    ctx.restore();
  }

  // 绘制 Tab 焦点路径叠加层（检视视觉序 vs DOM 序 01->02->03->04）
  function drawFocusOverlay(ctx, rectsById, inversions) {
    ctx.save();
    const pts = [0, 1, 2, 3].map((id) => {
      const r = rectsById[id];
      const fx = r.role === "hero" ? 0.64 : r.role === "support" ? 0.56 : 0.52;
      const fy = r.role === "hero" ? 0.64 : r.role === "support" ? 0.68 : 0.54;
      return { x: r.x + r.w * fx, y: r.y + r.h * fy, id };
    });

    for (let i = 0; i < 3; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const backwards = b.y < a.y - 16 || (Math.abs(b.y - a.y) <= 16 && b.x < a.x - 16);
      ctx.strokeStyle = backwards ? PALETTE.err : PALETTE.pass;
      ctx.lineWidth = backwards ? 2.4 : 1.8;
      ctx.setLineDash(backwards ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // 箭头头
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const mx = lerp(a.x, b.x, 0.55);
      const my = lerp(a.y, b.y, 0.55);
      ctx.setLineDash([]);
      ctx.fillStyle = backwards ? PALETTE.err : PALETTE.pass;
      ctx.beginPath();
      ctx.moveTo(mx + Math.cos(ang) * 7, my + Math.sin(ang) * 7);
      ctx.lineTo(mx + Math.cos(ang + 2.5) * 6, my + Math.sin(ang + 2.5) * 6);
      ctx.lineTo(mx + Math.cos(ang - 2.5) * 6, my + Math.sin(ang - 2.5) * 6);
      ctx.closePath();
      ctx.fill();
    }

    // 焦点圆点 T1..T4
    for (let i = 0; i < 4; i++) {
      const p = pts[i];
      ctx.fillStyle = inversions > 0 ? PALETTE.err : PALETTE.pass;
      ctx.beginPath();
      ctx.roundRect(p.x - 17, p.y - 10, 34, 20, 10);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 10px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`T${i + 1}`, p.x, p.y + 0.5);
    }
    ctx.restore();
  }

  function frame(t, dt, { still }) {
    if (!W || !H) resize();
    if (!W || !H) return;

    const state = getState();
    const ev = evaluate(state);
    const mods = SUBJECTS[state.subject].modules;
    introProgress = still ? 1 : Math.min(1, introProgress + (dt ? dt * 2.2 : 0.08));
    const intro = easeOutCubic(introProgress);

    ctx.save();
    ctx.scale(dpr, dpr);

    const compact = W < 640;
    rightHitBoxes = [];

    if (!compact) {
      // ================= 宽屏模式：50% 暖米 BEFORE ｜ 中缝 SWITCH 拉帘 ｜ 50% 柔樱粉 AFTER =================
      const midX = W * 0.5;
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(0, 0, midX, H);
      ctx.fillStyle = PALETTE.blush;
      ctx.fillRect(midX, 0, W - midX, H);

      // 顶部交互标尺（360px ↔ 1200px）
      const rulerPad = Math.max(24, W * 0.045);
      drawTopRuler(ctx, state, ev, rulerPad, 16, W - rulerPad * 2, 34);

      const topY = 66;
      const spineW = Math.min(148, Math.max(104, W * 0.14));
      const sidePad = Math.max(20, W * 0.032);
      const leftBoxX = sidePad;
      const leftBoxW = midX - spineW / 2 - sidePad;
      const rightBoxX = midX + spineW / 2;
      const rightBoxW = W - sidePad - rightBoxX;

      // 左侧顶标：切换前 / BEFORE
      drawPill(ctx, leftBoxX + leftBoxW / 2 - 74, topY, 148, 24, PALETTE.ink, "切换前 / BEFORE", "#FFFFFF", 11.5);
      ctx.fillStyle = ev.mobile.switched ? PALETTE.err : PALETTE.ink;
      ctx.font = `700 12.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        ev.mobile.switched ? `375px 手机（过早切进多列 · 最窄 ${ev.mobileMinW}px）` : "线性顺序布局 · 375px",
        leftBoxX + leftBoxW / 2,
        topY + 29
      );

      // 右侧顶标：切换后 / AFTER
      drawPill(ctx, rightBoxX + rightBoxW / 2 - 72, topY, 144, 24, PALETTE.ink, "切换后 / AFTER", "#FFFFFF", 11.5);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 12.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const tplLabel = TEMPLATES[state.template].label;
      ctx.fillText(`模块重组布局 · ${tplLabel}`, rightBoxX + rightBoxW / 2, topY + 29);

      const stageY = topY + 54;
      const stageH = H - stageY - 18;

      // 计算左侧 4 模块实绘矩形（模拟 375px 手机真实表现：若断点设得过低，左侧也会被硬挤！）
      const leftSlots = ev.mobile.switched ? getTargetRightNorm(state) : LINEAR_SLOTS.map((s, i) => ({ ...s, slotIndex: i }));
      const leftRects = new Array(4);
      const phoneW = Math.min(leftBoxW, Math.max(220, leftBoxW * 0.90));
      const phoneX = leftBoxX + (leftBoxW - phoneW) / 2;

      // 左侧外框
      ctx.save();
      ctx.strokeStyle = ev.mobile.switched ? PALETTE.err : "rgba(13,11,13,0.18)";
      ctx.lineWidth = ev.mobile.switched ? 2 : 1;
      if (ev.mobile.switched) ctx.setLineDash([6, 4]);
      ctx.strokeRect(phoneX - 7, stageY - 7, phoneW + 14, stageH + 14);
      ctx.setLineDash([]);
      ctx.restore();

      for (let id = 0; id < 4; id++) {
        const s = leftSlots[id];
        const r = {
          id,
          x: phoneX + s.x * phoneW,
          y: stageY + s.y * stageH,
          w: s.w * phoneW,
          h: s.h * stageH,
          role: s.role,
        };
        leftRects[id] = r;
        drawModuleCard(ctx, r, mods[id], {
          mode: ev.mobile.switched ? "modular" : "linear",
          role: ev.mobile.switched ? s.role : "linear",
          keepIdentity: true,
          selected: false,
          crushed: ev.mobile.switched && ev.mobileMinW < 220,
          compact: true,
        });
      }

      // 警示胶囊放在四张卡之后绘制，永不被遮挡
      if (ev.mobile.switched) {
        drawPill(ctx, phoneX + phoneW - 144, stageY + stageH - 25, 138, 20, PALETTE.err, `手机仅 ${ev.mobileMinW}px 被挤碎`, "#FFFFFF", 10);
      }

      // 计算右侧 4 模块目标与 FLIP 动画矩形
      const targetRight = ev.wide.switched
        ? getTargetRightNorm(state)
        : LINEAR_SLOTS.map((s, i) => ({ ...s, slotIndex: i }));
      animRight = stepLerp(animRight, targetRight, dt ? Math.min(1, dt * 11) : 0.25, still);

      const rightRects = new Array(4);
      // 右侧外框
      ctx.save();
      const activeRight = state.viewportW >= state.breakpoint;
      ctx.strokeStyle = activeRight ? PALETTE.ink : "rgba(13,11,13,0.22)";
      ctx.lineWidth = activeRight ? 1.5 : 1;
      ctx.strokeRect(rightBoxX - 8, stageY - 8, rightBoxW + 16, stageH + 16);
      ctx.restore();

      for (let id = 0; id < 4; id++) {
        const s = animRight[id];
        const r = {
          id,
          x: rightBoxX + s.x * rightBoxW,
          y: stageY + s.y * stageH,
          w: s.w * rightBoxW,
          h: s.h * stageH,
          role: s.role,
        };
        rightRects[id] = r;
        rightHitBoxes.push(r);
        drawModuleCard(ctx, r, mods[id], {
          mode: ev.wide.switched ? "modular" : "linear",
          role: ev.wide.switched ? s.role : "linear",
          keepIdentity: state.keepIdentity,
          selected: state.selectedModule === id,
          crushed: false,
          compact: false,
        });
      }

      // 中缝：FLIP 迁徙弧线 + 293 原海报「切换 → / 重组 / 响应」虚线脊
      const scrubNorm = (state.viewportW - VIEW_MIN) / (VIEW_MAX - VIEW_MIN);
      const isSwitchedNow = state.viewportW >= state.breakpoint;

      // 1) 四条实时 FLIP 弧线（连接左侧每个模块到右侧同一模块）
      ctx.save();
      for (let id = 0; id < 4; id++) {
        const L = leftRects[id];
        const R = rightRects[id];
        const x0 = L.x + L.w + 4;
        const y0 = L.y + L.h * 0.5;
        const x1 = R.x - 4;
        const y1 = R.y + R.h * 0.5;
        const c1x = lerp(x0, x1, 0.42);
        const c2x = lerp(x0, x1, 0.58);
        const displaced = Math.abs(y1 - y0) > stageH * 0.34;
        const isConflict = ev.inversions > 0 && displaced;

        ctx.strokeStyle = isConflict
          ? "rgba(173, 26, 53, 0.62)"
          : id === 0
            ? "rgba(13, 11, 13, 0.45)"
            : "rgba(207, 47, 112, 0.42)";
        ctx.lineWidth = isConflict ? 2.2 : 1.5;
        if (isConflict) ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(c1x, y0, c2x, y1, x1, y1);
        ctx.stroke();
        ctx.setLineDash([]);

        // 沿弧线滑动的实况模块游标（随横拖 viewportW 实时移动！）
        const u = Math.max(0.06, Math.min(0.94, scrubNorm * intro));
        const mu = 1 - u;
        const bx = mu ** 3 * x0 + 3 * mu ** 2 * u * c1x + 3 * mu * u ** 2 * c2x + u ** 3 * x1;
        const by = mu ** 3 * y0 + 3 * mu ** 2 * u * y0 + 3 * mu * u ** 2 * y1 + u ** 3 * y1;
        ctx.fillStyle = isConflict ? PALETTE.err : id === 0 ? PALETTE.ink : PALETTE.roseBanner;
        ctx.beginPath();
        ctx.arc(bx, by, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2) 原海报中央玫粉渐变切换箭与「切换 / 重组 / 响应」虚线脊
      ctx.save();
      const arrowY = stageY + stageH * 0.27;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 13px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("切换", midX, arrowY - 22);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = `600 10px "Archivo", sans-serif`;
      ctx.fillText("SWITCH", midX, arrowY - 9);

      const aw = Math.min(82, spineW * 0.72);
      const ax0 = midX - aw / 2;
      const grad = ctx.createLinearGradient(ax0, 0, ax0 + aw, 0);
      grad.addColorStop(0, "rgba(239, 100, 154, 0.25)");
      grad.addColorStop(1, isSwitchedNow ? PALETTE.roseBanner : PALETTE.ink);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(ax0, arrowY - 8);
      ctx.lineTo(ax0 + aw - 18, arrowY - 8);
      ctx.lineTo(ax0 + aw - 18, arrowY - 17);
      ctx.lineTo(ax0 + aw, arrowY);
      ctx.lineTo(ax0 + aw - 18, arrowY + 17);
      ctx.lineTo(ax0 + aw - 18, arrowY + 8);
      ctx.lineTo(ax0, arrowY + 8);
      ctx.closePath();
      ctx.fill();

      // 垂直虚线脊 + 重组 / 响应
      const spineTop = arrowY + 26;
      const spineBot = stageY + stageH - 12;
      ctx.strokeStyle = PALETTE.rose;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(midX, spineTop);
      ctx.lineTo(midX, spineBot);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const py of [spineTop, lerp(spineTop, spineBot, 0.5), spineBot]) {
        ctx.fillStyle = PALETTE.roseBanner;
        ctx.beginPath();
        ctx.arc(midX, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      const midA = lerp(spineTop, spineBot, 0.26);
      const midB = lerp(spineTop, spineBot, 0.74);
      // 给文字一点纸底遮罩保证清晰
      for (const [yy, zh, en] of [
        [midA, "重组", "ADAPT"],
        [midB, "响应", "REFRAME"],
      ]) {
        ctx.fillStyle = "rgba(250, 242, 233, 0.92)";
        ctx.beginPath();
        ctx.roundRect(midX - 30, yy - 16, 60, 32, 6);
        ctx.fill();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(zh, midX, yy - 5);
        ctx.fillStyle = PALETTE.roseDeep;
        ctx.font = `600 9.5px "Archivo", sans-serif`;
        ctx.fillText(en, midX, yy + 9);
      }
      ctx.restore();

      // 可选：右侧叠加 Tab 焦点路径
      if (state.showFocusPath) {
        drawFocusOverlay(ctx, rightRects, ev.inversions);
      }
    } else {
      // ================= 窄屏模式（手机 390×844）：单镜连续帘幕变形台 =================
      const scrubNorm = (state.viewportW - VIEW_MIN) / (VIEW_MAX - VIEW_MIN);
      curtainX = Math.max(18, Math.min(W - 18, scrubNorm * W));

      // 暖米 | 柔樱粉 随横拖实时推开的背景帘幕！
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(0, 0, curtainX, H);
      ctx.fillStyle = PALETTE.blush;
      ctx.fillRect(curtainX, 0, W - curtainX, H);

      // 帘幕中缝细线
      ctx.strokeStyle = PALETTE.roseBanner;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(curtainX, 50);
      ctx.lineTo(curtainX, H - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // 顶部标尺
      drawTopRuler(ctx, state, ev, 16, 12, W - 32, 34);

      const isSwitchedNow = state.viewportW >= state.breakpoint;
      const topY = 58;
      drawPill(
        ctx,
        W / 2 - 96,
        topY,
        192,
        24,
        isSwitchedNow ? PALETTE.roseBanner : PALETTE.ink,
        isSwitchedNow ? `切换后 · ${TEMPLATES[state.template].label}` : "切换前 · 线性顺序",
        "#FFFFFF",
        11
      );

      const stageX = 16;
      const stageY = topY + 34;
      const stageW = W - 32;
      const stageH = H - stageY - 16;

      const targetCompact = isSwitchedNow
        ? getTargetRightNorm(state)
        : LINEAR_SLOTS.map((s, i) => ({ ...s, slotIndex: i }));
      animCompact = stepLerp(animCompact, targetCompact, dt ? Math.min(1, dt * 11) : 0.25, still);

      const liveRects = new Array(4);
      ctx.strokeStyle = isSwitchedNow ? PALETTE.ink : "rgba(13,11,13,0.22)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(stageX - 4, stageY - 4, stageW + 8, stageH + 8);

      for (let id = 0; id < 4; id++) {
        const s = animCompact[id];
        const r = {
          id,
          x: stageX + s.x * stageW,
          y: stageY + s.y * stageH,
          w: s.w * stageW,
          h: s.h * stageH,
          role: s.role,
        };
        liveRects[id] = r;
        rightHitBoxes.push(r);
        drawModuleCard(ctx, r, mods[id], {
          mode: isSwitchedNow ? "modular" : "linear",
          role: isSwitchedNow ? s.role : "linear",
          keepIdentity: state.keepIdentity,
          selected: state.selectedModule === id,
          crushed: ev.mobile.switched && state.viewportW <= 420 && ev.mobileMinW < 220,
          compact: true,
        });
      }

      if (state.showFocusPath && isSwitchedNow) {
        drawFocusOverlay(ctx, liveRects, ev.inversions);
      }
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, frame);

  // ================= 鼠标与触摸交互（横向拖拽调视口，轻点右侧模块互换槽位） =================
  let pointerDown = false;
  let startX = 0;
  let startY = 0;
  let startVw = 960;
  let dragged = false;
  let axisLocked = null; // "h" | "v" | null

  function getCanvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width };
  }

  function handleTap(x, y) {
    const state = getState();
    const hit = rightHitBoxes.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (!hit) {
      if (state.selectedModule !== -1) onMutate({ selectedModule: -1 });
      return;
    }
    if (state.selectedModule === -1) {
      onMutate({ selectedModule: hit.id });
    } else if (state.selectedModule === hit.id) {
      onMutate({ selectedModule: -1 });
    } else {
      // 互换两个模块在 slotOrder 里的槽位
      const nextOrder = [...state.slotOrder];
      const idxA = nextOrder.indexOf(state.selectedModule);
      const idxB = nextOrder.indexOf(hit.id);
      if (idxA >= 0 && idxB >= 0) {
        [nextOrder[idxA], nextOrder[idxB]] = [nextOrder[idxB], nextOrder[idxA]];
        onMutate({ slotOrder: nextOrder, selectedModule: -1 });
      }
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pointerDown = true;
    dragged = false;
    axisLocked = null;
    startX = e.clientX;
    startY = e.clientY;
    startVw = getState().viewportW;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!pointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!axisLocked && Math.hypot(dx, dy) > 6) {
      axisLocked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }
    if (axisLocked === "h") {
      dragged = true;
      const rect = canvas.getBoundingClientRect();
      const span = Math.max(240, rect.width * 0.72);
      const nextVw = Math.round(
        Math.max(VIEW_MIN, Math.min(VIEW_MAX, startVw + (dx / span) * (VIEW_MAX - VIEW_MIN)))
      );
      if (nextVw !== getState().viewportW) {
        onMutate({ viewportW: nextVw });
      }
    }
  });

  function endPointer(e) {
    if (!pointerDown) return;
    pointerDown = false;
    if (!dragged) {
      const p = getCanvasPos(e);
      handleTap(p.x, p.y);
    }
    axisLocked = null;
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", () => {
    pointerDown = false;
    axisLocked = null;
  });

  // 键盘支持：← / → 调视口宽，Space / Enter 在选中焦点上快速交换 01/04
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 40 : -40;
      const nextVw = Math.max(VIEW_MIN, Math.min(VIEW_MAX, state.viewportW + delta));
      onMutate({ viewportW: nextVw });
    }
  });

  return {
    draw: () => ctrl.draw(),
  };
}
