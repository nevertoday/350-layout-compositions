// 120 共同区域原则 · 开场围栏分组实验台（2D Canvas）
// 1:1 承袭 120 原海报三道粉彩圆角胶囊底框 × 3×3 圆点 × 跨区红 × 双箭头距差尺
// 支持：画布横拖（data-perf-drag）拉展组内/跨区距比、直拖任意圆点制造/修复骑墙与串门、直点画布红签纠错、键盘微调

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, computeGeometry, diagnose, clamp } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function mountHeroCanvas(canvas, getState, mutateState, onSync) {
  const ctx = canvas.getContext("2d");
  let geom = null;
  let diag = null;
  let dpr = 1;
  let cssW = 640;
  let cssH = 380;

  // 交互态
  let dragMode = null; // null | "ratio" | "item"
  let dragItemIdx = -1;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startRatio = 1.8;
  let startOff = { dx: 0, dy: 0 };
  let touchLock = null; // null | "h" | "v"
  let hoverItemIdx = -1;
  let hoverHotspot = null;
  let hotspots = []; // 画布内可点纠错胶囊 [{ id, x, y, w, h, action }]

  // 优雅入场进度（0→1，0.82s 完成；reducedMotion 下 still:true 直接 1）
  let intro = 0;
  let smoothRatio = getState().intraRatio;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function drawRegionBoxes(st, g, d, pIntro) {
    const mode = st.regionMode;
    if (mode === "none") {
      // 极淡参考定位点，提示原有三排基线而不构成共同区域
      ctx.save();
      ctx.fillStyle = "rgba(12, 14, 20, 0.14)";
      for (const reg of g.regions) {
        ctx.beginPath();
        ctx.arc(reg.x + 4, reg.cy, 2, 0, Math.PI * 2);
        ctx.arc(reg.x + reg.w - 4, reg.cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (mode === "cage") {
      // 逐点黑牢笼：给 9 枚元素各套 2px 实黑框
      ctx.save();
      const pad = g.compact ? 6 : 9;
      for (const it of g.items) {
        const bw = it.w + pad * 2;
        const bh = it.h + pad * 2;
        roundRectPath(ctx, it.x - bw * 0.5, it.y - bh * 0.5, bw, bh, 6);
        ctx.fillStyle = "#FFFDF9";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = PALETTE.ink;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 3 条共同区域底框（120 原海报圆角胶囊）
    for (let i = 0; i < g.regions.length; i++) {
      const reg = g.regions[i];
      const stagger = clamp((pIntro - i * 0.12) / 0.65, 0, 1);
      const ease = 1 - (1 - stagger) ** 3;
      const drawW = reg.w * (0.86 + 0.14 * ease);
      const drawX = reg.x + (reg.w - drawW) * 0.5;

      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * ease;
      roundRectPath(ctx, drawX, reg.y, drawW, reg.h, reg.r);

      if (mode === "pastel") {
        ctx.fillStyle = reg.palette.fill;
        ctx.fill();
      } else if (mode === "ghost") {
        ctx.fillStyle = reg.palette.ghost;
        ctx.fill();
        // 极其微弱的轮廓提示（肉眼几乎消失，但让人知道这儿有个弱底）
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(184, 29, 36, 0.28)";
        ctx.stroke();
      } else if (mode === "dashed") {
        ctx.fillStyle = "rgba(255, 253, 249, 0.7)";
        ctx.fill();
        ctx.setLineDash([7, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = PALETTE.navy;
        ctx.stroke();
      } else if (mode === "solid") {
        ctx.fillStyle = "rgba(255, 253, 249, 0.85)";
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "#3F3B37";
        ctx.stroke();
      }
      ctx.restore();
    }

    // 如果框间粘连，在缝隙处画红警条提示
    if (d.code === "merge") {
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      for (let i = 0; i < 2; i++) {
        const midY = g.regions[i].y + g.regions[i].h + g.boxGapPx * 0.5;
        ctx.beginPath();
        ctx.moveTo(g.boxX + 10, midY);
        ctx.lineTo(g.boxX + g.boxW - 10, midY);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawPerceivedBrackets(st, g, d) {
    // 当视觉被邻近性反客为主（看成 3 竖列）时，用清晰的竖向红色虚线括号标出大脑此刻的误判！
    if (d.perceivedType !== "cols") return;
    ctx.save();
    ctx.strokeStyle = "rgba(184, 29, 36, 0.72)";
    ctx.fillStyle = "rgba(184, 29, 36, 0.055)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    const topY = g.regions[0].y - 5;
    const botY = g.regions[2].y + g.regions[2].h + 5;
    const colW = Math.min(g.itemW + 18, g.intraDistPx - 10);

    for (let c = 0; c < 3; c++) {
      const colCenterX = g.items[c].baseX;
      roundRectPath(ctx, colCenterX - colW * 0.5, topY, colW, botY - topY, 12);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawItems(st, g, pIntro) {
    const isPoster = st.theme === "poster";

    for (let i = 0; i < g.items.length; i++) {
      const it = g.items[i];
      const stagger = clamp((pIntro - (it.row * 0.08 + it.col * 0.05)) / 0.55, 0, 1);
      const scale = 0.72 + 0.28 * (1 - (1 - stagger) ** 3);
      const isBad = it.status === "straddle" || it.status === "wrong" || it.status === "outside";
      const isActive = dragMode === "item" && dragItemIdx === i;
      const isHover = hoverItemIdx === i;

      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.scale(scale, scale);

      if (isPoster) {
        // 120 原海报实心圆点（严格正圆）
        if (isActive || isHover) {
          ctx.beginPath();
          ctx.arc(0, 0, it.r + 5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(12, 14, 20, 0.1)";
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, it.r, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();

        // 若该点骑墙/串门，加外圈警示红环和拖拽暗示
        if (isBad && st.regionMode !== "none" && st.regionMode !== "cage") {
          ctx.beginPath();
          ctx.arc(0, 0, it.r + 4.5, 0, Math.PI * 2);
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = PALETTE.err;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        // 界面题材（套餐卡 / 表单项）：真实感清晰模块，字号可读、无截断
        const hw = it.w * 0.5;
        const hh = it.h * 0.5;
        roundRectPath(ctx, -hw, -hh, it.w, it.h, 8);
        if (it.meta.cta) {
          ctx.fillStyle = it.color;
          ctx.fill();
        } else {
          ctx.fillStyle = "#FFFDF9";
          ctx.fill();
          ctx.lineWidth = isActive ? 2 : 1.2;
          ctx.strokeStyle = isBad && st.regionMode !== "none" ? PALETTE.err : "rgba(12, 14, 20, 0.22)";
          ctx.stroke();
        }

        // 左侧色标条
        if (!it.meta.cta) {
          roundRectPath(ctx, -hw + 4, -hh + 5, 4, it.h - 10, 2);
          ctx.fillStyle = it.color;
          ctx.fill();
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fMain = g.compact ? 11 : 12.5;
        const fSub = g.compact ? 9.5 : 10.5;
        ctx.fillStyle = it.meta.cta ? "#FFFDF9" : PALETTE.ink;
        ctx.font = `700 ${fMain}px "Noto Sans SC", sans-serif`;
        ctx.fillText(it.meta.title, it.meta.cta ? 0 : 3, it.h >= 38 ? -6 : 0);

        if (it.h >= 38) {
          ctx.fillStyle = it.meta.cta ? "rgba(255,253,249,0.88)" : PALETTE.inkSoft;
          ctx.font = `500 ${fSub}px "Manrope", "Noto Sans SC", sans-serif`;
          ctx.fillText(it.meta.sub, it.meta.cta ? 0 : 3, 9);
        }

        if (isBad && st.regionMode !== "none" && st.regionMode !== "cage") {
          roundRectPath(ctx, -hw - 3, -hh - 3, it.w + 6, it.h + 6, 10);
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = PALETTE.err;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.restore();
    }
  }

  function drawRulers(st, g, d) {
    ctx.save();
    // 1. 顶部组内水平距 d_in 标尺（位于第一排底框正上方、与顶排左右胶囊错开）
    const p0 = g.items[0];
    const p1 = g.items[1];
    const ry = Math.max(40, g.regions[0].y - 14);
    const x1 = p0.baseX;
    const x2 = p1.baseX;
    const midX = (x1 + x2) * 0.5;

    ctx.strokeStyle = PALETTE.inkSoft;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, ry);
    ctx.lineTo(x2, ry);
    ctx.moveTo(x1, ry - 4);
    ctx.lineTo(x1, ry + 4);
    ctx.moveTo(x2, ry - 4);
    ctx.lineTo(x2, ry + 4);
    ctx.stroke();

    const topLabel = `组内 ${g.intraDistPx}px`;
    ctx.font = `700 ${g.compact ? 10.5 : 11.5}px "Space Mono", "Noto Sans SC", monospace`;
    const tw = ctx.measureText(topLabel).width + 12;
    roundRectPath(ctx, midX - tw * 0.5, ry - 9, tw, 18, 4);
    ctx.fillStyle = PALETTE.paper;
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(topLabel, midX, ry);

    // 右上角实时比值徽标
    const ratioTag = `组内/跨区 ${g.actualRatio.toFixed(2)}×`;
    ctx.font = `700 ${g.compact ? 10.5 : 11.5}px "Space Mono", "Noto Sans SC", monospace`;
    const rtw = ctx.measureText(ratioTag).width + 16;
    roundRectPath(ctx, g.W - rtw - 10, 8, rtw, 24, 12);
    ctx.fillStyle = d.isOk ? PALETTE.green : PALETTE.ink;
    ctx.fill();
    ctx.fillStyle = "#FFFDF9";
    ctx.fillText(ratioTag, g.W - rtw * 0.5 - 10, 20);

    // 2. 右侧原海报招牌：第 2 与第 3 底框之间的「垂直双箭虚线 + 朱橘红 ×」跨区阻断尺！
    const rx = Math.min(g.W - (g.compact ? 24 : 36), g.boxX + g.boxW + (g.compact ? 22 : 30));
    const yA = g.regions[1].cy;
    const yB = g.regions[2].cy;
    const yMid = (yA + yB) * 0.5;
    const blocked = d.checks.boundary.ok && d.code !== "merge";

    ctx.strokeStyle = blocked ? PALETTE.ink : PALETTE.err;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(rx, yA + 6);
    ctx.lineTo(rx, yB - 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // 上下箭头
    ctx.fillStyle = blocked ? PALETTE.ink : PALETTE.err;
    ctx.beginPath();
    ctx.moveTo(rx, yA + 2); ctx.lineTo(rx - 4, yA + 9); ctx.lineTo(rx + 4, yA + 9); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx, yB - 2); ctx.lineTo(rx - 4, yB - 9); ctx.lineTo(rx + 4, yB - 9); ctx.closePath();
    ctx.fill();

    // 正中图标：原海报朱橘红 ×（阻断跨区归组）或红色「黏」点
    ctx.beginPath();
    ctx.arc(rx, yMid, 10, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.paper;
    ctx.fill();

    if (blocked) {
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rx - 5, yMid - 5); ctx.lineTo(rx + 5, yMid + 5);
      ctx.moveTo(rx + 5, yMid - 5); ctx.lineTo(rx - 5, yMid + 5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(rx, yMid, 5, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.err;
      ctx.fill();
    }

    // 跨区垂直距标注（放在第 1 与第 2 框右侧）
    const y01 = (g.regions[0].cy + g.regions[1].cy) * 0.5;
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `700 ${g.compact ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`跨区`, rx, y01 - 7);
    ctx.fillText(`${g.interDistPx}px`, rx, y01 + 7);

    // 底沿操作提示语
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `500 ${g.compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const footText = g.compact
      ? "↔ 横拖改距比 · 拖圆点试跨界 · 点红签纠错"
      : "↔ 横拖画布拉展组内/跨区距比 · 直拖任意元素测试骑墙与串门 · 方向键微调";
    ctx.fillText(footText, Math.max(14, g.boxX), g.H - 6);

    ctx.restore();
  }

  function drawHotspots(st, g, d) {
    hotspots = [];
    const pills = [];

    // 1. 边界错态红签置顶左上角（与右上角距比黑胶囊对称，绝不遮挡任何圆点）
    if (d.code === "ghost" || d.code === "none" || d.code === "color_crutch" || d.code === "cage") {
      const label = d.code === "cage"
        ? (g.compact ? "× 逐点黑框 · 点改粉彩" : "× 逐点黑牢笼 · 点改粉彩底")
        : d.code === "ghost"
          ? (g.compact ? `× 弱底 ${g.lumaDiffPct}% · 点显框` : `× 弱底仅差 ${g.lumaDiffPct}% · 点显底框`)
          : (g.compact ? "× 无框成竖列 · 点加框" : "× 邻近看成 3 竖列 · 点加底框");
      pills.push({
        id: "fix-region",
        alignLeft: true,
        x: 10,
        y: 20,
        label,
        action: () => mutateState((s) => { s.regionMode = "pastel"; }),
      });
    }

    // 2. 骑墙/串门红签：优先放在该元素正上方（刚好落在原位空档里），彻底避开相邻行圆点
    if (d.misplaced.length > 0 && st.regionMode !== "none" && st.regionMode !== "cage") {
      const target = d.misplaced[0];
      const label = target.status === "wrong"
        ? `× 串门错归 · 点此归位`
        : `× 压线骑墙 · 点此归位`;
      const aboveY = target.y - target.h * 0.5 - 19;
      const belowY = target.y + target.h * 0.5 + 19;
      const py = aboveY >= g.regions[0].y + 8 ? aboveY : belowY;
      pills.push({
        id: "fix-item",
        alignLeft: false,
        x: clamp(target.x, g.boxX + 78, g.boxX + g.boxW - 78),
        y: clamp(py, 44, g.H - 36),
        label,
        action: () => mutateState((s) => {
          s.offsets[target.index] = { dx: 0, dy: 0 };
        }),
      });
    }

    ctx.save();
    ctx.font = `700 ${g.compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of pills) {
      const tw = ctx.measureText(p.label).width + 18;
      const th = 24;
      const rx = p.alignLeft ? p.x : clamp(p.x - tw * 0.5, 10, g.W - tw - 10);
      const ry = p.alignLeft ? p.y - th * 0.5 : clamp(p.y - th * 0.5, 36, g.H - th - 24);
      const isHov = hoverHotspot === p.id;

      roundRectPath(ctx, rx, ry, tw, th, 12);
      ctx.fillStyle = isHov ? PALETTE.err : "#FFFDF9";
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = PALETTE.err;
      ctx.stroke();

      ctx.fillStyle = isHov ? "#FFFDF9" : PALETTE.err;
      ctx.fillText(p.label, rx + tw * 0.5, ry + th * 0.5 + 0.5);

      hotspots.push({ id: p.id, x: rx, y: ry, w: tw, h: th, action: p.action });
    }
    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const st = getState();

    // 入场与平滑跟随
    if (still) {
      intro = 1;
      smoothRatio = st.intraRatio;
    } else {
      intro = Math.min(1, intro + (dt > 0 ? dt / 0.82 : 0.08));
      const k = dt > 0 ? 1 - Math.exp(-dt * 18) : 1;
      smoothRatio += (st.intraRatio - smoothRatio) * (dragMode === "ratio" ? 1 : k);
    }

    const renderState = { ...st, intraRatio: smoothRatio };
    geom = computeGeometry(renderState, cssW, cssH);
    diag = diagnose(renderState, geom);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    // 暖象牙画布背景
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    drawPerceivedBrackets(renderState, geom, diag);
    drawRegionBoxes(renderState, geom, diag, intro);
    drawItems(renderState, geom, intro);
    drawRulers(renderState, geom, diag);
    drawHotspots(renderState, geom, diag);

    ctx.restore();
    onSync(geom, diag);
  }

  const controller = loop(canvas, renderFrame);

  // 坐标命中检测
  function getCanvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitHotspot(x, y) {
    return hotspots.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || null;
  }

  function hitItem(x, y) {
    if (!geom) return -1;
    // 优先检测错位圆点（最方便用户拖回）
    const order = [...geom.items].sort((a, b) => (b.status !== "inside") - (a.status !== "inside"));
    for (const it of order) {
      const hw = Math.max(it.w * 0.5 + 4, 20);
      const hh = Math.max(it.h * 0.5 + 4, 20);
      if (Math.abs(x - it.x) <= hw && Math.abs(y - it.y) <= hh) return it.index;
    }
    return -1;
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const { x, y } = getCanvasPos(e);

    const hs = hitHotspot(x, y);
    if (hs) {
      hs.action();
      controller.draw();
      return;
    }

    pointerId = e.pointerId;
    startX = x;
    startY = y;
    touchLock = e.pointerType === "touch" ? null : "h";

    const idx = hitItem(x, y);
    const st = getState();
    if (idx >= 0 && e.pointerType !== "touch") {
      dragMode = "item";
      dragItemIdx = idx;
      startOff = { ...st.offsets[idx] };
    } else if (idx >= 0 && geom && geom.items[idx].status !== "inside") {
      // 触屏下点中错位圆点可直接拖回
      dragMode = "item";
      dragItemIdx = idx;
      startOff = { ...st.offsets[idx] };
      touchLock = "h";
    } else {
      dragMode = "ratio";
      startRatio = st.intraRatio;
    }

    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }

  function onPointerMove(e) {
    const { x, y } = getCanvasPos(e);

    if (pointerId === null || e.pointerId !== pointerId) {
      // 仅悬停高亮
      const hs = hitHotspot(x, y);
      const newHovHot = hs ? hs.id : null;
      const newHovItem = hs ? -1 : hitItem(x, y);
      if (newHovHot !== hoverHotspot || newHovItem !== hoverItemIdx) {
        hoverHotspot = newHovHot;
        hoverItemIdx = newHovItem;
        canvas.style.cursor = newHovHot ? "pointer" : newHovItem >= 0 ? "grab" : "ew-resize";
        controller.draw();
      }
      return;
    }

    const dx = x - startX;
    const dy = y - startY;

    // 触屏方向判定：竖划让页面滚动，横划接管拔河
    if (touchLock === null) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && dragMode === "ratio") {
        touchLock = "v";
        pointerId = null;
        dragMode = null;
        return;
      }
      touchLock = "h";
    }

    if (dragMode === "ratio") {
      const span = Math.max(160, cssW * 0.45);
      const nextRatio = clamp(startRatio + (dx / span) * 1.35, 0.65, 2.4);
      mutateState((s) => { s.intraRatio = +nextRatio.toFixed(2); }, { silent: false });
      controller.draw();
    } else if (dragMode === "item" && dragItemIdx >= 0 && geom) {
      const nDx = startOff.dx + dx / Math.max(40, geom.intraDistPx);
      const nDy = startOff.dy + dy / Math.max(40, geom.interDistPx);
      // 靠近归位原心时轻微吸附
      const snapX = Math.abs(nDx) < 0.08 ? 0 : clamp(nDx, -0.8, 0.8);
      const snapY = Math.abs(nDy) < 0.11 ? 0 : clamp(nDy, -1.25, 1.25);
      mutateState((s) => {
        s.offsets[dragItemIdx] = { dx: +snapX.toFixed(3), dy: +snapY.toFixed(3) };
      }, { silent: false });
      canvas.style.cursor = "grabbing";
      controller.draw();
    }
  }

  function onPointerUp(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    dragMode = null;
    dragItemIdx = -1;
    touchLock = null;
    canvas.style.cursor = "ew-resize";
    controller.draw();
  }

  // 同时兼容 CDP perf.mjs 派发的原生 touchstart/touchmove（防止部分环境只发 touch 不合成 pointer）
  let touchActive = false;
  let tStartX = 0;
  let tStartY = 0;
  let tStartRatio = 1.8;
  let tDir = null;

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    tStartX = t0.clientX - r.left;
    tStartY = t0.clientY - r.top;
    tStartRatio = getState().intraRatio;
    tDir = null;
    touchActive = true;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchActive || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const dx = (t0.clientX - r.left) - tStartX;
    const dy = (t0.clientY - r.top) - tStartY;
    if (tDir === null) {
      if (Math.hypot(dx, dy) < 4) return;
      tDir = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }
    if (tDir === "h") {
      if (e.cancelable) e.preventDefault();
      const span = Math.max(140, cssW * 0.42);
      const next = clamp(tStartRatio + (dx / span) * 1.35, 0.65, 2.4);
      mutateState((s) => { s.intraRatio = +next.toFixed(2); }, { silent: false });
      controller.draw();
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => { touchActive = false; tDir = null; }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // 键盘可访问操作
  canvas.addEventListener("keydown", (e) => {
    const modes = ["none", "ghost", "pastel", "dashed", "solid", "cage"];
    if (e.key === "ArrowRight") {
      e.preventDefault();
      mutateState((s) => { s.intraRatio = +clamp(s.intraRatio + 0.1, 0.65, 2.4).toFixed(2); });
      controller.draw();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      mutateState((s) => { s.intraRatio = +clamp(s.intraRatio - 0.1, 0.65, 2.4).toFixed(2); });
      controller.draw();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      mutateState((s) => {
        const idx = modes.indexOf(s.regionMode);
        const step = e.key === "ArrowUp" ? 1 : -1;
        s.regionMode = modes[(idx + step + modes.length) % modes.length];
      });
      controller.draw();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      mutateState((s) => { s.offsets = s.offsets.map(() => ({ dx: 0, dy: 0 })); });
      controller.draw();
    }
  });

  window.addEventListener("resize", () => controller.draw(), { passive: true });

  return {
    draw: () => controller.draw(),
    getLatest: () => ({ geom, diag }),
  };
}
