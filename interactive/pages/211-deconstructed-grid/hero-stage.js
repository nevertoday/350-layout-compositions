// 211 解构网格 · 开场活体断层切割与语义重构画布（2D Canvas）
// 1:1 承袭 211 原海报淡青建筑描图纸、断续 5×5 网格、空心校准圆、青碧/珊瑚/纯黑建筑块、
// 虚线交叉框与中央银灰语义板。严格从 model.js computeLayout(state) 单真源绘制。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import { clamp, computeLayout } from "./model.js";

export function mountHeroStage(canvas, getState, onStateChange) {
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  let cssW = 760;
  let cssH = 490;
  let layout = computeLayout(getState());
  let dirty = true;
  let reveal = reducedMotion.matches ? 1 : 0;
  let hoverTarget = null; // "faultX" | "faultY" | "callout" | "canvas" | null
  let dragMode = null; // "slip" | "faultX" | "faultY"
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartVal = 0;
  let touchLockedAxis = null; // "x" | "y" | null
  let calloutRectPx = null;

  // 归一化 [0..1]×[0..1] 映射到画布等比居中测绘版心（顶部留 32px 测绘标头带、底留 44px 标牌带，绝不重叠、绝不变椭圆）
  function getViewport() {
    const padX = Math.max(12, cssW * 0.028);
    const padTop = 32;
    const padBottom = 46;
    const availW = cssW - padX * 2;
    const availH = Math.max(120, cssH - padTop - padBottom);
    // 制图版面采用 1.24:1 建筑比例，与 211 原海报右侧构成区一致
    const targetAspect = 1.24;
    let w = availW;
    let h = w / targetAspect;
    if (h > availH) {
      h = availH;
      w = h * targetAspect;
    }
    const ox = (cssW - w) * 0.5;
    const oy = padTop + (availH - h) * 0.5;
    return { ox, oy, w, h };
  }

  function toPxRect(r, vp) {
    return {
      x: vp.ox + r.x * vp.w,
      y: vp.oy + r.y * vp.h,
      w: r.w * vp.w,
      h: r.h * vp.h,
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(2);
    cssW = rect.width;
    cssH = rect.height;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    dirty = true;
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function drawBrokenLine(x1, y1, x2, y2, style, dash = [], lw = 1) {
    ctx.save();
    ctx.strokeStyle = style;
    ctx.lineWidth = lw;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawMeaningPlane(vp, lay, alpha) {
    const mp = lay.meaningPlane;
    const pr = toPxRect(mp.rect, vp);
    const th = lay.theme;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 破层时给极轻的建筑投影与 crisp 边缘，拍平时退化为淡线框
    if (mp.layerMode === "elevated") {
      ctx.fillStyle = "rgba(8, 11, 11, 0.06)";
      ctx.fillRect(pr.x + 6, pr.y + 6, pr.w, pr.h);
    }

    ctx.fillStyle = mp.layerMode === "flat" ? "#E8EEEC" : PALETTE.panelSilver;
    ctx.fillRect(pr.x, pr.y, pr.w, pr.h);

    ctx.strokeStyle =
      mp.layerMode === "elevated" ? "rgba(8, 11, 11, 0.16)" : PALETTE.ruleStrong;
    ctx.lineWidth = mp.layerMode === "elevated" ? 1 : 0.9;
    ctx.strokeRect(pr.x + 0.5, pr.y + 0.5, pr.w - 1, pr.h - 1);

    // 1:1 承袭原海报银灰块文字排布：前两行粗黑，后两行细黑，左下短黑杠与中文副注错开绝不碰字
    const padX = pr.w * 0.088;
    const padY = pr.h * 0.10;
    const fontSize = clamp(Math.min(pr.w * 0.114, pr.h * 0.145), 10.5, 22);
    const lineH = fontSize * 1.15;

    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    // Bold lines
    ctx.fillStyle = mp.layerMode === "flat" ? PALETTE.inkSoft : PALETTE.ink;
    ctx.font = `700 ${fontSize}px "Space Grotesk", "Noto Sans SC", sans-serif`;
    th.headlineBold.forEach((line, i) => {
      ctx.fillText(line, pr.x + padX, pr.y + padY + i * lineH, pr.w - padX * 1.8);
    });

    // Light lines
    ctx.fillStyle = mp.layerMode === "flat" ? PALETTE.inkSoft : "#222B2A";
    ctx.font = `400 ${fontSize * 0.94}px "Space Grotesk", "Noto Sans SC", sans-serif`;
    th.headlineLight.forEach((line, i) => {
      ctx.fillText(
        line,
        pr.x + padX,
        pr.y + padY + (th.headlineBold.length + i) * lineH + 1,
        pr.w - padX * 1.8
      );
    });

    // 左下原海报短横黑杠（固定在底沿上方 14px，仅当上方留有足够空间时在杠右侧补中文副注，杜绝与 IS NOT. 重叠）
    const barY = pr.y + pr.h - 14;
    const barW = Math.min(34, pr.w * 0.18);
    ctx.fillStyle = mp.layerMode === "flat" ? PALETTE.ruleStrong : PALETTE.ink;
    ctx.fillRect(pr.x + padX, barY, barW, 2.5);

    if (pr.w >= 170) {
      const noteSize = clamp(pr.w * 0.046, 10, 11.5);
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `500 ${noteSize}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(th.zhNote, pr.x + padX + barW + 8, barY + 1, pr.w - padX * 2 - barW - 24);
    }

    // 右下角原海报同款虚线方角标记 [ ]
    const bx = pr.x + pr.w - padX - 10;
    const by = barY - 5;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.6;
    const bl = 3.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + bl); ctx.lineTo(bx, by); ctx.lineTo(bx + bl, by);
    ctx.moveTo(bx + 10 - bl, by); ctx.lineTo(bx + 10, by); ctx.lineTo(bx + 10, by + bl);
    ctx.moveTo(bx + 10, by + 10 - bl); ctx.lineTo(bx + 10, by + 10); ctx.lineTo(bx + 10 - bl, by + 10);
    ctx.moveTo(bx + bl, by + 10); ctx.lineTo(bx, by + 10); ctx.lineTo(bx, by + 10 - bl);
    ctx.stroke();

    ctx.restore();
  }

  function drawBlock(b, vp, alpha) {
    const r = toPxRect(b.rect, vp);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = b.color;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // 给主青碧块加上原海报上的精细贯穿建筑参考虚线
    if (b.id === "tealMain") {
      ctx.strokeStyle = "rgba(8, 11, 11, 0.22)";
      ctx.lineWidth = 0.85;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.56, r.y - 18);
      ctx.lineTo(r.x + r.w * 0.56, r.y + r.h + 24);
      ctx.moveTo(r.x - 16, r.y + r.h * 0.28);
      ctx.lineTo(r.x + r.w + 26, r.y + r.h * 0.28);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (still) {
      reveal = 1;
    } else if (reveal < 1) {
      reveal = Math.min(1, reveal + Math.max(dt, 0.016) * 2.1);
      dirty = true;
    }

    if (!dirty) return;
    dirty = false;

    const state = getState();
    layout = computeLayout(state);
    const vp = getViewport();
    const ease = 1 - Math.pow(1 - reveal, 3);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 淡青建筑描图纸底面（与整页无缝融合，零厚重仪表盘黑框）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 轻微建筑测绘四角短裁切线（纯印刷裁切角标）
    const cornerLen = 11;
    ctx.strokeStyle = PALETTE.ruleStrong;
    ctx.lineWidth = 1;
    const m = 8;
    const corners = [
      [m, m + cornerLen, m, m, m + cornerLen, m],
      [cssW - m - cornerLen, m, cssW - m, m, cssW - m, m + cornerLen],
      [m, cssH - m - cornerLen, m, cssH - m, m + cornerLen, cssH - m],
      [cssW - m - cornerLen, cssH - m, cssW - m, cssH - m, cssW - m, cssH - m - cornerLen],
    ];
    ctx.beginPath();
    for (const [x1, y1, x2, y2, x3, y3] of corners) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
    }
    ctx.stroke();

    // 顶栏微缩测绘状态注记（IBM Plex Mono，≥ 11px）
    const topLabel = `${layout.theme.subTag}  ·  ${layout.metrics.fragments} SHARDS  ·  SLIP ${layout.metrics.slipRatioPct}%  ·  FREE ${layout.metrics.freeSpacePct}%`;
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(topLabel, 18, 12, cssW - 36);

    // 2. 原 5×5 底网残影（开 showGhosts 且处于拆解状态时显现断口来源）
    const bgPx = toPxRect(layout.baseGrid, vp);
    if (state.showGhosts) {
      ctx.save();
      ctx.strokeStyle = "rgba(149, 164, 161, 0.42)";
      ctx.lineWidth = 0.85;
      ctx.setLineDash([3, 5]);
      ctx.strokeRect(bgPx.x, bgPx.y, bgPx.w, bgPx.h);
      for (let i = 1; i < 5; i++) {
        const gx = bgPx.x + (bgPx.w * i) / 5;
        const gy = bgPx.y + (bgPx.h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(gx, bgPx.y);
        ctx.lineTo(gx, bgPx.y + bgPx.h);
        ctx.moveTo(bgPx.x, gy);
        ctx.lineTo(bgPx.x + bgPx.w, gy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. 实绘每个被劈开的网格碎片板块（含断续延伸建筑线、4×4 微点阵）
    for (let idx = 0; idx < layout.shards.length; idx++) {
      const s = layout.shards[idx];
      // 入场动画中沿位移向量滑入
      const interpRect = {
        x: s.origRect.x + s.dx * ease,
        y: s.origRect.y + s.dy * ease,
        w: s.rect.w,
        h: s.rect.h,
      };
      const sr = toPxRect(interpRect, vp);

      ctx.save();
      if (s.angle) {
        const cx = sr.x + sr.w * 0.5;
        const cy = sr.y + sr.h * 0.5;
        ctx.translate(cx, cy);
        ctx.rotate((s.angle * ease * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      // 碎片纸面微托底（突出错层关系）
      ctx.fillStyle = idx % 2 === 0 ? "rgba(255,255,255,0.46)" : "rgba(222,226,227,0.28)";
      ctx.fillRect(sr.x, sr.y, sr.w, sr.h);

      // 碎片边框（有意部分实线 + 部分虚线，1:1 承袭 211 原海报断续线美学）
      ctx.strokeStyle = PALETTE.inkMuted;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      // 上边实线
      ctx.moveTo(sr.x, sr.y);
      ctx.lineTo(sr.x + sr.w * 0.72, sr.y);
      // 左边断续
      ctx.moveTo(sr.x, sr.y + sr.h * 0.18);
      ctx.lineTo(sr.x, sr.y + sr.h);
      // 下边与右边
      ctx.moveTo(sr.x + sr.w * 0.14, sr.y + sr.h);
      ctx.lineTo(sr.x + sr.w, sr.y + sr.h);
      ctx.moveTo(sr.x + sr.w, sr.y);
      ctx.lineTo(sr.x + sr.w, sr.y + sr.h * 0.82);
      ctx.stroke();

      // 碎片内部细网格
      ctx.strokeStyle = "rgba(84, 99, 97, 0.34)";
      ctx.lineWidth = 0.75;
      ctx.setLineDash([4, 3]);
      for (let c = 1; c < s.cols; c++) {
        const x = sr.x + (sr.w * c) / s.cols;
        ctx.beginPath();
        ctx.moveTo(x, sr.y);
        ctx.lineTo(x, sr.y + sr.h);
        ctx.stroke();
      }
      for (let r = 1; r < s.rows; r++) {
        const y = sr.y + (sr.h * r) / s.rows;
        ctx.beginPath();
        ctx.moveTo(sr.x, y);
        ctx.lineTo(sr.x + sr.w, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 延伸出片外的建筑基准须线（仅在拆解状态下显现原海报特征线）
      if (state.fragments > 1 && state.slip > 0.05) {
        const ext = 14 * ease;
        ctx.strokeStyle = "rgba(35, 191, 191, 0.55)";
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(sr.x + sr.w, sr.y + sr.h * 0.25);
        ctx.lineTo(sr.x + sr.w + ext, sr.y + sr.h * 0.25);
        ctx.moveTo(sr.x + sr.w * 0.35, sr.y);
        ctx.lineTo(sr.x + sr.w * 0.35, sr.y - ext);
        ctx.stroke();
      }

      // 位移向量残影箭头（原位置中心 → 现位置中心）
      if (state.showGhosts && Math.hypot(s.dx, s.dy) > 0.015) {
        const or = toPxRect(s.origRect, vp);
        const x0 = or.x + or.w * 0.5;
        const y0 = or.y + or.h * 0.5;
        const x1 = sr.x + sr.w * 0.5;
        const y1 = sr.y + sr.h * 0.5;
        drawBrokenLine(x0, y0, x1, y1, "rgba(12, 116, 116, 0.45)", [2, 3], 1);
      }

      ctx.restore();
    }

    // 4. 211 原海报标志性右侧 4×4 测绘点阵 + 左侧三黑点 • • • + 右侧虚线交叉框
    const dotBaseX = vp.ox + vp.w * 0.87;
    const dotBaseY = vp.oy + vp.h * 0.14;
    ctx.fillStyle = PALETTE.inkSoft;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.beginPath();
        ctx.arc(dotBaseX + c * 9, dotBaseY + r * 9, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const threeX = vp.ox + vp.w * 0.095;
    const threeY = vp.oy + vp.h * 0.39;
    ctx.fillStyle = PALETTE.ink;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(threeX + i * 9, threeY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 虚线交叉占位框（1:1 原海报右沿母题）
    const cb = toPxRect(layout.crossBox, vp);
    ctx.save();
    ctx.strokeStyle = "rgba(84, 99, 97, 0.48)";
    ctx.lineWidth = 0.85;
    ctx.strokeRect(cb.x, cb.y, cb.w, cb.h);
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cb.x, cb.y);
    ctx.lineTo(cb.x + cb.w, cb.y + cb.h);
    ctx.moveTo(cb.x + cb.w, cb.y);
    ctx.lineTo(cb.x, cb.y + cb.h);
    ctx.stroke();
    ctx.restore();

    // 5. 按真实 Z-Index 顺序绘制所有色块与中央银灰语义板（保证被掩埋时真的被压住！）
    const drawables = [
      ...layout.blocks.map((b) => ({ kind: "block", z: b.zIndex, data: b })),
      { kind: "meaning", z: layout.meaningPlane.zIndex, data: layout.meaningPlane },
    ].sort((a, b) => a.z - b.z);

    for (const item of drawables) {
      if (item.kind === "block") drawBlock(item.data, vp, ease);
      else drawMeaningPlane(vp, layout, ease);
    }

    // 6. 原海报标志性薄线空心校准圆（纯正圆，取 min(w, h) 半径绝不变椭圆！）
    const ccx = vp.ox + layout.calibCircle.cx * vp.w;
    const ccy = vp.oy + layout.calibCircle.cy * vp.h;
    const ccr = layout.calibCircle.r * Math.min(vp.w, vp.h);
    ctx.save();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.arc(ccx, ccy, ccr, 0, Math.PI * 2);
    ctx.stroke();
    // 穿过圆心的原海报正交建筑线
    ctx.strokeStyle = "rgba(8, 11, 11, 0.45)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(ccx, ccy - ccr * 1.45);
    ctx.lineTo(ccx, ccy + ccr * 1.45);
    ctx.moveTo(ccx - ccr * 1.45, ccy);
    ctx.lineTo(ccx + ccr * 1.45, ccy);
    ctx.stroke();
    ctx.restore();

    // 7. 可交互横纵断层切线与手柄（仅在 fragments >= 2 时显示切刀手柄）
    if (state.fragments >= 2) {
      const fx = vp.ox + layout.faultX * vp.w;
      const fy = vp.oy + layout.faultY * vp.h;

      // 纵断层切线 V-FAULT
      const vActive = hoverTarget === "faultX" || dragMode === "faultX";
      drawBrokenLine(
        fx,
        vp.oy + 10,
        fx,
        vp.oy + vp.h - 10,
        vActive ? PALETTE.coral : PALETTE.tealText,
        [6, 4],
        vActive ? 1.8 : 1.15
      );
      // 顶部 V 切刀抓手标签
      ctx.save();
      ctx.fillStyle = vActive ? PALETTE.coral : PALETTE.tealText;
      ctx.fillRect(fx - 22, vp.oy + 4, 44, 18);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 10.5px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`V ${Math.round(state.cutX * 100)}%`, fx, vp.oy + 13.5);
      ctx.restore();

      // 横断层切线 H-FAULT（4片或9片时）
      if (state.fragments >= 4) {
        const hActive = hoverTarget === "faultY" || dragMode === "faultY";
        drawBrokenLine(
          vp.ox + 10,
          fy,
          vp.ox + vp.w - 10,
          fy,
          hActive ? PALETTE.coral : PALETTE.tealText,
          [6, 4],
          hActive ? 1.8 : 1.15
        );
        ctx.save();
        ctx.fillStyle = hActive ? PALETTE.coral : PALETTE.tealText;
        ctx.fillRect(vp.ox + 4, fy - 9, 44, 18);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 10.5px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`H ${Math.round(state.cutY * 100)}%`, vp.ox + 26, fy + 0.5);
        ctx.restore();
      }
    }

    // 8. 语义碰撞实测斜线警告框（真实相交矩形！）
    if (layout.collisions.length > 0) {
      ctx.save();
      for (const col of layout.collisions) {
        const cr = toPxRect(col.box, vp);
        ctx.fillStyle = "rgba(244, 75, 50, 0.22)";
        ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
        ctx.strokeStyle = PALETTE.coralText;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
      }
      ctx.restore();
    }

    // 9. 非线性视线路径节点 1 → 2 → 3 → 4
    if (state.showFlow) {
      const pts = layout.flowNodes.map((n) => ({
        ...n,
        px: vp.ox + n.x * vp.w,
        py: vp.oy + n.y * vp.h,
      }));
      ctx.save();
      ctx.strokeStyle = layout.ok ? "rgba(12, 116, 116, 0.72)" : "rgba(188, 42, 20, 0.72)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.px, p.py) : ctx.lineTo(p.px, p.py)));
      ctx.stroke();
      ctx.setLineDash([]);

      for (const p of pts) {
        ctx.fillStyle = layout.ok ? PALETTE.ink : PALETTE.coralText;
        ctx.beginPath();
        ctx.arc(p.px, p.py, 9.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 10.5px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(p.step), p.px, p.py + 0.5);
      }
      ctx.restore();
    }

    // 10. 视觉重心实测点（当重心偏移严重时提示重心偏离方向）
    if (layout.metrics.comOffsetPct >= 14) {
      const ocx = vp.ox + 0.5 * vp.w;
      const ocy = vp.oy + 0.49 * vp.h;
      const gcx = vp.ox + layout.metrics.comX * vp.w;
      const gcy = vp.oy + layout.metrics.comY * vp.h;
      drawBrokenLine(ocx, ocy, gcx, gcy, PALETTE.coralText, [3, 3], 1.5);
      ctx.save();
      ctx.fillStyle = PALETTE.coralText;
      ctx.beginPath();
      ctx.arc(gcx, gcy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 11. 底部嵌入式实况标牌（可点击单步纠偏，不遮盖核心语义）
    const pillText = layout.ok
      ? `✓ ${layout.solutionName} · 结构拆解且意义清晰`
      : `× ${layout.primaryIssue.badge} · 点此单步纠偏 →`;
    ctx.save();
    ctx.font = `600 12px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
    const tw = ctx.measureText(pillText).width;
    const pw = Math.min(cssW - 28, tw + 26);
    const ph = 28;
    const px = (cssW - pw) * 0.5;
    const py = cssH - ph - 12;
    calloutRectPx = { x: px, y: py, w: pw, h: ph };

    ctx.fillStyle = layout.ok ? PALETTE.ink : PALETTE.coralText;
    ctx.fillRect(px, py, pw, ph);
    if (hoverTarget === "callout" && !layout.ok) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, px + pw * 0.5, py + ph * 0.5 + 0.5, pw - 16);
    ctx.restore();

    ctx.restore();
  }

  function hitTest(x, y) {
    if (
      calloutRectPx &&
      x >= calloutRectPx.x &&
      x <= calloutRectPx.x + calloutRectPx.w &&
      y >= calloutRectPx.y &&
      y <= calloutRectPx.y + calloutRectPx.h
    ) {
      return "callout";
    }
    const state = getState();
    const vp = getViewport();
    if (state.fragments >= 2) {
      const fx = vp.ox + layout.faultX * vp.w;
      const tabY = vp.oy + 13;
      if (Math.abs(x - fx) <= 28 && Math.abs(y - tabY) <= 18) return "faultX";
    }
    if (state.fragments >= 4) {
      const fy = vp.oy + layout.faultY * vp.h;
      const tabX = vp.ox + 26;
      if (Math.abs(x - tabX) <= 28 && Math.abs(y - fy) <= 18) return "faultY";
    }
    return "canvas";
  }

  function clientToLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function startInteraction(clientX, clientY, isTouch) {
    const { x, y } = clientToLocal(clientX, clientY);
    const hit = hitTest(x, y);
    const st = getState();
    dragStartX = clientX;
    dragStartY = clientY;
    touchLockedAxis = null;

    if (hit === "callout") {
      dragMode = "callout";
      return;
    }
    if (hit === "faultX") {
      dragMode = "faultX";
      dragStartVal = st.cutX;
      return;
    }
    if (hit === "faultY" && !isTouch) {
      dragMode = "faultY";
      dragStartVal = st.cutY;
      return;
    }
    dragMode = "slip";
    dragStartVal = st.slip;
  }

  function moveInteraction(clientX, clientY) {
    if (!dragMode || dragMode === "callout") return;
    const vp = getViewport();
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;

    if (dragMode === "faultX") {
      const next = clamp(dragStartVal + dx / (vp.w * layout.baseGrid.w), 0.28, 0.72);
      onStateChange({ cutX: Number(next.toFixed(3)) });
      return;
    }
    if (dragMode === "faultY") {
      const next = clamp(dragStartVal + dy / (vp.h * layout.baseGrid.h), 0.28, 0.72);
      onStateChange({ cutY: Number(next.toFixed(3)) });
      return;
    }
    if (dragMode === "slip") {
      const st = getState();
      const delta = dx / Math.max(160, vp.w * 0.65);
      const next = clamp(dragStartVal + delta, 0, 1);
      // 如果在整网 1 片态向右横拖，自动切开为 4 片断层让手感直觉顺畅
      const patch = { slip: Number(next.toFixed(3)) };
      if (st.fragments === 1 && next > 0.08) {
        patch.fragments = 4;
        patch.cutX = 0.63;
        patch.cutY = 0.42;
      }
      onStateChange(patch);
    }
  }

  function endInteraction(clientX, clientY) {
    if (dragMode === "callout") {
      const { x, y } = clientToLocal(clientX, clientY);
      if (hitTest(x, y) === "callout" && Math.hypot(clientX - dragStartX, clientY - dragStartY) < 10) {
        if (layout.primaryIssue && layout.primaryIssue.fixPatch) {
          onStateChange(layout.primaryIssue.fixPatch);
        }
      }
    }
    dragMode = null;
    touchLockedAxis = null;
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    startInteraction(e.clientX, e.clientY, false);
    const onMove = (ev) => moveInteraction(ev.clientX, ev.clientY);
    const onUp = (ev) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      endInteraction(ev.clientX, ev.clientY);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (dragMode) return;
    const { x, y } = clientToLocal(e.clientX, e.clientY);
    const nextHover = hitTest(x, y);
    if (nextHover !== hoverTarget) {
      hoverTarget = nextHover;
      canvas.style.cursor =
        nextHover === "faultX"
          ? "ew-resize"
          : nextHover === "faultY"
          ? "ns-resize"
          : nextHover === "callout"
          ? "pointer"
          : "ew-resize";
      dirty = true;
      ctrl.draw();
    }
  });

  canvas.addEventListener("mouseleave", () => {
    if (hoverTarget) {
      hoverTarget = null;
      dirty = true;
      ctrl.draw();
    }
  });

  // 触屏事件：保留纵向滚屏，水平拖动顺畅驱动断层滑移（同步响应 perf.mjs touchmove）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      startInteraction(t0.clientX, t0.clientY, true);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !dragMode) return;
      const t0 = e.touches[0];
      const dx = Math.abs(t0.clientX - dragStartX);
      const dy = Math.abs(t0.clientY - dragStartY);
      if (!touchLockedAxis && (dx > 4 || dy > 4)) {
        touchLockedAxis = dx >= dy ? "x" : "y";
      }
      if (touchLockedAxis === "x") {
        if (e.cancelable) e.preventDefault();
        moveInteraction(t0.clientX, t0.clientY);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      const t0 = e.changedTouches[0];
      if (t0) endInteraction(t0.clientX, t0.clientY);
      else dragMode = null;
    },
    { passive: true }
  );

  const ctrl = loop(canvas, render);

  return {
    notify() {
      dirty = true;
      ctrl.draw();
    },
    destroy() {
      ro.disconnect();
    },
  };
}
