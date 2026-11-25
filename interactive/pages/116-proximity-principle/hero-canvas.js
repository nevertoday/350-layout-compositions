// 116 开场主舞台（2D Canvas）
// 1:1 化用原海报 48 枚圆阵 + 中央虚线折线 + 实时测距标尺，并支持同一距离模型下的商品卡 UI 与文章段落模式。
// 遵循 GUIDE.md：基于 lib/stage.js 的 loop() 与 pixelRatio()，静止自动降频、drag 帧帧实绘、prefers-reduced-motion 完整呈现。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, GROUP_META, HIERARCHY_LEVELS, clamp } from "./model.js";

const lerp = (a, b, t) => a + (b - a) * t;

function drawArrowHead(ctx, x, y, angle, size = 6) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - 0.55), y - size * Math.sin(angle - 0.55));
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle + 0.55), y - size * Math.sin(angle + 0.55));
  ctx.stroke();
}

function drawMeasureLine(ctx, x1, y1, x2, y2, color, label, offset = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ax = x1 + nx * offset;
  const ay = y1 + ny * offset;
  const bx = x2 + nx * offset;
  const by = y2 + ny * offset;
  const ang = Math.atan2(by - ay, bx - ax);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  drawArrowHead(ctx, bx, by, ang, 6);
  drawArrowHead(ctx, ax, ay, ang + Math.PI, 6);

  if (label) {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    const tw = ctx.measureText(label).width;
    const padX = 6;
    const bh = 20;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(mx - tw / 2 - padX, my - bh / 2, tw + padX * 2, bh);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - tw / 2 - padX, my - bh / 2, tw + padX * 2, bh);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, mx, my + 0.5);
  }
  ctx.restore();
}

export function mountHeroStage(canvas, getState, getDiagnosis, callbacks) {
  const ctx = canvas.getContext("2d");
  let W = 680;
  let H = 460;
  let dpr = 1;

  // 平滑插值点位置（用于 48 枚圆的丝滑弹性移动）
  const animDots = Array.from({ length: 48 }, () => ({ x: 0, y: 0, r: 12, init: false }));
  let dirty = true;
  let hoverGroup = -1;
  let dragging = null; // null | 'field' | 'stray'
  let dragStart = { x: 0, y: 0, outer: 0, inner: 0, moved: false };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(260, Math.round(rect.width));
    const nh = Math.max(220, Math.round(rect.height));
    const ndpr = pixelRatio(2);
    if (nw !== W || nh !== H || ndpr !== dpr) {
      W = nw;
      H = nh;
      dpr = ndpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dirty = true;
      callbacks.onSizeChange?.(W, H);
    }
  }

  function renderPosterScene(state, diag, dt, still) {
    const { layout, geom } = diag;
    const { dots, groupBounds, strayDot } = layout;
    const ease = still ? 1 : 1 - Math.exp(-dt * 15);
    let moving = false;

    for (let i = 0; i < dots.length; i++) {
      const target = dots[i];
      const cur = animDots[i];
      if (!cur.init || still) {
        cur.x = target.x;
        cur.y = target.y;
        cur.r = target.r;
        cur.init = true;
      } else {
        const dx = target.x - cur.x;
        const dy = target.y - cur.y;
        const dr = target.r - cur.r;
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dr) > 0.15) {
          cur.x += dx * ease;
          cur.y += dy * ease;
          cur.r += dr * ease;
          moving = true;
        } else {
          cur.x = target.x;
          cur.y = target.y;
          cur.r = target.r;
        }
      }
    }

    // 1. 暖杏纸底 + 极轻四角测绘刻度（无重框！）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    // 极轻背景定位十字角标
    ctx.strokeStyle = "rgba(88, 79, 71, 0.22)";
    ctx.lineWidth = 1;
    const m = 10;
    const tick = 10;
    [
      [m, m, 1, 1],
      [W - m, m, -1, 1],
      [m, H - m, 1, -1],
      [W - m, H - m, -1, -1],
    ].forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + sy * tick);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + sx * tick, cy);
      ctx.stroke();
    });

    // 2. 若展开到一定程度，或用户高亮「聚合/分组」，画各组轻柔虚线围框（hover 或 inspect 时）
    const showGroupHalo = state.inspectKey === "cluster" || state.inspectKey === "grouping" || hoverGroup >= 0;
    if (showGroupHalo && state.outerGap > 0.18) {
      for (let g = 0; g < 4; g++) {
        const b = groupBounds[g];
        const isHot = hoverGroup === g || state.inspectKey === "cluster" || state.inspectKey === "grouping";
        if (!isHot) continue;
        const pad = 10;
        ctx.save();
        ctx.strokeStyle =
          hoverGroup === g
            ? PALETTE.orange
            : state.inspectKey === "cluster"
            ? PALETTE.green
            : "rgba(32, 137, 111, 0.52)";
        ctx.lineWidth = hoverGroup === g ? 1.8 : 1.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.roundRect(b.minX - pad, b.minY - pad, b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2, 10);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. 1:1 复刻原海报标志性中央虚线 L 形折线（当组间通道打开时自然浮现）
    const lineAlpha = clamp((state.outerGap - 0.25) / 0.4, 0, 1);
    if (lineAlpha > 0.04) {
      const b0 = groupBounds[0]; // 右上绿阵
      const b2 = groupBounds[2]; // 左下橘阵
      const b3 = groupBounds[3]; // 右下粉阵
      const spineX = clamp(lerp(b2.maxX, Math.min(b0.minX, b3.minX), 0.46), W * 0.32, W * 0.48);
      const yTop = clamp(b0.cy, 36, H * 0.35);
      const yMid = clamp(b2.cy, H * 0.45, H * 0.72);
      const yBot = clamp(b3.cy, H * 0.68, H - 30);

      ctx.save();
      ctx.globalAlpha = lineAlpha * 0.82;
      ctx.strokeStyle = PALETTE.rule;
      ctx.fillStyle = PALETTE.rule;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 5]);

      // 主折线：从右上阵左侧黑点出发 → 左折至中轴 → 垂直下行 → 右折带箭头指右下阵
      ctx.beginPath();
      ctx.moveTo(b0.minX - 12, yTop);
      ctx.lineTo(spineX, yTop);
      ctx.lineTo(spineX, yBot);
      ctx.lineTo(b3.minX - 14, yBot);
      ctx.stroke();

      // 左向分支：从竖轴中段向左指左下阵黑点
      ctx.beginPath();
      ctx.moveTo(spineX, yMid);
      ctx.lineTo(b2.maxX + 14, yMid);
      ctx.stroke();

      ctx.setLineDash([]);
      // 起止黑圆点 + 箭头（忠实还原原海报细节）
      ctx.beginPath();
      ctx.arc(b0.minX - 12, yTop, 3.2, 0, Math.PI * 2);
      ctx.arc(b2.maxX + 14, yMid, 3.2, 0, Math.PI * 2);
      ctx.fill();
      drawArrowHead(ctx, b3.minX - 14, yBot, 0, 6);
      ctx.restore();
    }

    // 4. 绘制 48 枚实绘真圆
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const cur = animDots[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, cur.r, 0, Math.PI * 2);
      ctx.fillStyle = d.fill;
      ctx.fill();
      if (d.stroke) {
        ctx.strokeStyle = d.stroke;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      // 组内挤撞时用轻朱橘提示环警示相碰点
      if (diag.code === "overlap" && i % 3 === 0) {
        ctx.strokeStyle = PALETTE.orange;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 每组疏密小标（当拉开或 hover 或查层级时轻标，不挡圆）
    if (state.outerGap > 0.3 || state.inspectKey === "hierarchy") {
      ctx.save();
      ctx.font = '500 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      for (let g = 0; g < 4; g++) {
        const b = groupBounds[g];
        const lvl = HIERARCHY_LEVELS[state.hierarchy[g]];
        const showLabel = state.inspectKey === "hierarchy" || hoverGroup === g;
        if (!showLabel) continue;
        const txt = `${GROUP_META[g].short} · ${lvl.label}`;
        const tw = ctx.measureText(txt).width;
        const lx = clamp(b.cx, tw / 2 + 12, W - tw / 2 - 12);
        const ly = b.minY > 28 ? b.minY - 14 : b.maxY + 18;
        ctx.fillStyle = PALETTE.paper;
        ctx.fillRect(lx - tw / 2 - 6, ly - 10, tw + 12, 20);
        ctx.strokeStyle = hoverGroup === g ? PALETTE.orange : PALETTE.green;
        ctx.lineWidth = 1;
        ctx.strokeRect(lx - tw / 2 - 6, ly - 10, tw + 12, 20);
        ctx.fillStyle = PALETTE.inkSoft;
        ctx.textBaseline = "middle";
        ctx.fillText(txt, lx, ly + 0.5);
      }
      ctx.restore();
    }

    // 6. 距离标尺叠层：在「距离检视」、拖动中、或「倒挂/均质」错态时用原海报风虚线尺标出 d_in 与 d_out
    const showRulers =
      state.inspectKey === "distance" ||
      dragging === "field" ||
      diag.code === "inverted" ||
      (state.outerGap > 0.35 && state.outerGap < 0.92 && state.inspectKey === null);

    if (showRulers && geom.sampleInPair && geom.sampleOutPair) {
      const [a1, a2, dIn] = geom.sampleInPair;
      const [b1, b2, dOut] = geom.sampleOutPair;
      // 找到插值后的位置
      const pa1 = animDots[a1.id];
      const pa2 = animDots[a2.id];
      const pb1 = animDots[b1.id];
      const pb2 = animDots[b2.id];
      const showDetail = state.inspectKey === "distance" || dragging === "field" || diag.code === "inverted";
      if (showDetail) {
        drawMeasureLine(ctx, pa1.x, pa1.y, pa2.x, pa2.y, PALETTE.greenDark, `内 ${Math.round(dIn)}`, -pa1.r - 12);
        const outColor = geom.ratio < 1.38 ? PALETTE.orangeDark : PALETTE.inkSoft;
        drawMeasureLine(ctx, pb1.x, pb1.y, pb2.x, pb2.y, outColor, `间 ${Math.round(dOut)} · ${geom.ratio.toFixed(2)}×`, 0);
      }
    }

    // 7. 游离试探点（可拖拽）
    if (strayDot && geom.strayInfo) {
      const { nearest, second, isLost } = geom.strayInfo;
      const nDot = animDots[nearest.nearestDot.id];
      const sDot = animDots[second.nearestDot.id];
      ctx.save();
      // 连向最近两组的测距虚线
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = isLost ? PALETTE.orangeDark : PALETTE.greenDark;
      ctx.beginPath();
      ctx.moveTo(strayDot.x, strayDot.y);
      ctx.lineTo(nDot.x, nDot.y);
      ctx.stroke();

      ctx.strokeStyle = "rgba(88, 79, 71, 0.45)";
      ctx.beginPath();
      ctx.moveTo(strayDot.x, strayDot.y);
      ctx.lineTo(sDot.x, sDot.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 游离点外环 + 本体
      ctx.beginPath();
      ctx.arc(strayDot.x, strayDot.y, strayDot.r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = isLost ? PALETTE.orange : PALETTE.green;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(strayDot.x, strayDot.y, strayDot.r, 0, Math.PI * 2);
      ctx.fillStyle = isLost ? PALETTE.orange : PALETTE.green;
      ctx.fill();

      // 居中提示字
      ctx.fillStyle = "#FFF9F2";
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("拖", strayDot.x, strayDot.y + 0.5);
      ctx.restore();
    }

    // 8. 均质开场时的轻提示浮标（仅在最开始尚未拉动时给一句不挡圆的导引）
    if (state.outerGap < 0.06 && !state.stray.active) {
      ctx.save();
      const txt = "← 左右横拖画布，撕开等距黑墙 →";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      const tw = ctx.measureText(txt).width;
      const bw = tw + 24;
      const bx = (W - bw) / 2;
      const by = H - 34;
      ctx.fillStyle = "rgba(252, 240, 228, 0.94)";
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 26, 99);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.orangeDark;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, W / 2, by + 13.5);
      ctx.restore();
    }

    return moving;
  }

  // ---------- 题材 2：真实商品信息卡（零边框纯靠邻近距！） ----------
  function renderCardsScene(state, diag) {
    const { geom } = diag;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    const items = [
      { title: "极简台灯 L01", sub: "哑光铝 · 2700K 暖光", price: "¥ 298", accent: PALETTE.green, shape: "lamp" },
      { title: "陶瓷手冲壶", sub: "350ml · 鹅颈控流", price: "¥ 186", accent: PALETTE.orange, shape: "pot" },
      { title: "胡桃木托盘", sub: "手工打磨 · 24cm", price: "¥ 128", accent: PALETTE.pinkDark, shape: "tray" },
    ];

    const isNarrow = W < 470;
    const inGap = geom.inPx;
    const outGap = geom.outPx;
    const padX = clamp(W * 0.06, 16, 44);
    const padY = 26;

    if (!isNarrow) {
      // 横排 3 列无框商品信息，组内图文垂直贴合、组间横向拉开
      const colGap = outGap;
      const colW = Math.min(188, (W - padX * 2 - colGap * 2) / 3);
      const totalW = colW * 3 + colGap * 2;
      const startX = (W - totalW) / 2;
      const thumbH = clamp(H * 0.34, 88, 136);
      const topY = clamp((H - (thumbH + inGap * 2 + 78)) / 2, padY, 96);

      items.forEach((it, idx) => {
        const x = startX + idx * (colW + colGap);
        const hLvl = HIERARCHY_LEVELS[state.hierarchy[idx] ?? 1];
        const localIn = Math.max(1, Math.round(inGap * hLvl.gapScale));
        const fillCol = state.colorMode === "mono" ? "#26221F" : it.accent;

        // 产品色块（无外框卡片！）
        ctx.fillStyle = state.colorMode === "mono" ? "#EAE0D3" : "#F4E5D5";
        ctx.fillRect(x, topY, colW, thumbH);
        // 极简几何器物剪影
        ctx.fillStyle = fillCol;
        if (it.shape === "lamp") {
          ctx.beginPath();
          ctx.arc(x + colW * 0.5, topY + thumbH * 0.44, thumbH * 0.22, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(x + colW * 0.48, topY + thumbH * 0.44, colW * 0.04, thumbH * 0.32);
          ctx.fillRect(x + colW * 0.34, topY + thumbH * 0.74, colW * 0.32, 6);
        } else if (it.shape === "pot") {
          ctx.beginPath();
          ctx.roundRect(x + colW * 0.32, topY + thumbH * 0.26, colW * 0.36, thumbH * 0.5, 8);
          ctx.fill();
          ctx.strokeStyle = fillCol;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x + colW * 0.68, topY + thumbH * 0.48, 12, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.roundRect(x + colW * 0.22, topY + thumbH * 0.44, colW * 0.56, thumbH * 0.16, 6);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + colW * 0.42, topY + thumbH * 0.35, 11, 0, Math.PI * 2);
          ctx.fill();
        }

        const yTitle = topY + thumbH + localIn + 14;
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 15px "Noto Sans SC", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(it.title, x, yTitle);

        const ySub = yTitle + Math.max(14, localIn * 0.75 + 14);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = '400 12px "Noto Sans SC", sans-serif';
        ctx.fillText(it.sub, x, ySub);

        const yPrice = ySub + localIn + 18;
        ctx.fillStyle = state.colorMode === "conflict" ? items[(idx + 1) % 3].accent : fillCol;
        ctx.font = '600 16px "IBM Plex Mono", monospace';
        ctx.fillText(it.price, x, yPrice);

        if (idx === 0) {
          drawMeasureLine(ctx, x + colW - 8, topY + thumbH, x + colW - 8, yTitle - 12, PALETTE.greenDark, `内 ${localIn}px`, 0);
        }
        if (idx === 0) {
          drawMeasureLine(ctx, x + colW, topY + thumbH * 0.5, x + colW + colGap, topY + thumbH * 0.5, geom.ratio < 1.35 ? PALETTE.orangeDark : PALETTE.inkSoft, `间 ${colGap}px`, 0);
        }
      });
    } else {
      // 窄屏竖排 3 条无框商品记录（垂直方向直击「价格归上面还是归下面」！）
      const rowH = 38;
      let y = 26;
      const x = 18;
      const textX = 76;
      items.forEach((it, idx) => {
        const fillCol = state.colorMode === "mono" ? "#26221F" : it.accent;
        ctx.fillStyle = fillCol;
        ctx.beginPath();
        ctx.arc(x + 20, y + 18, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = PALETTE.ink;
        ctx.font = '700 14px "Noto Sans SC", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(it.title, textX, y + 14);

        const priceY = y + 14 + inGap + 15;
        ctx.fillStyle = fillCol;
        ctx.font = '600 13px "IBM Plex Mono", monospace';
        ctx.fillText(`${it.price}  ·  ${it.sub}`, textX, priceY);

        if (idx === 0) {
          drawMeasureLine(ctx, W - 56, y + 12, W - 56, priceY - 4, PALETTE.greenDark, `内 ${inGap}`, 0);
          drawMeasureLine(ctx, W - 56, priceY + 4, W - 56, priceY + 4 + outGap, geom.ratio < 1.35 ? PALETTE.orangeDark : PALETTE.inkSoft, `间 ${outGap}`, 0);
        }
        y = priceY + outGap + 10;
        if (y > H - rowH) return;
      });
    }
    return false;
  }

  // ---------- 题材 3：文章小标题与正文（1:1 悬浮标题陷阱！） ----------
  function renderArticleScene(state, diag) {
    const { geom } = diag;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    const blocks = [
      {
        h: "01 · 为什么先看距离，再看内容",
        p1: "视线扫过版面时，大脑在识别字义之前就已完成区块切分。",
        p2: "把标题紧贴下方正文、把上一段推远，就能零成本指明从属关系。",
      },
      {
        h: "02 · 悬浮标题为何最伤阅读节奏",
        p1: "如果小标题与上下两段间隔相等，眼睛每读完一节都会停顿迟疑。",
        p2: "不需要给标题加粗红底，只要把段前距拉到段后距的两倍即可。",
      },
      {
        h: "03 · 层级藏在空白的比例里",
        p1: "行距 < 段距 < 节距，三档空白递进本身就是最耐看的视觉目录。",
        p2: "留白不是空着没画，而是替读者默默画出的透明分界墙。",
      },
    ];

    const colW = Math.min(480, W - 44);
    const x = (W - colW) / 2;
    const inPx = geom.inPx;
    const outPx = geom.outPx;
    let y = 34;

    blocks.forEach((b, idx) => {
      if (y > H - 40) return;
      const headColor = state.colorMode === "mono" ? PALETTE.ink : idx === 0 ? PALETTE.greenDark : idx === 1 ? PALETTE.orangeDark : PALETTE.ink;

      // 段前标尺（只在第 2 节显示，直击上一段与本标题的距离！）
      if (idx === 1) {
        drawMeasureLine(ctx, x + colW - 22, y - outPx, x + colW - 22, y - 4, geom.ratio < 1.35 ? PALETTE.orangeDark : PALETTE.inkSoft, `段前 ${outPx}px`, 0);
      }

      ctx.fillStyle = headColor;
      ctx.font = '700 15px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(b.h, x, y);

      const headBottom = y + 20;
      const bodyTop = headBottom + inPx;

      if (idx === 1) {
        drawMeasureLine(ctx, x + colW - 102, headBottom, x + colW - 102, bodyTop, PALETTE.greenDark, `段后 ${inPx}px`, 0);
      }

      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = '400 13px "Noto Sans SC", sans-serif';
      ctx.fillText(b.p1, x, bodyTop, colW - 8);
      ctx.fillText(b.p2, x, bodyTop + 21, colW - 8);

      y = bodyTop + 42 + outPx;
    });
    return false;
  }

  // ---------- 指针/触摸交互（支持横拖组距、桌面双轴、直点圆群与游离点拖拽） ----------
  function getLocalPt(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  }

  function hitTestGroup(pt, diag) {
    const { dots } = diag.layout;
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      if (Math.hypot(pt.x - d.x, pt.y - d.y) <= d.r + 7) return d.g;
    }
    return -1;
  }

  function hitTestStray(pt, diag) {
    const s = diag.layout.strayDot;
    return s && Math.hypot(pt.x - s.x, pt.y - s.y) <= s.r + 14;
  }

  function onStart(e) {
    const state = getState();
    const diag = getDiagnosis();
    const pt = getLocalPt(e);
    if (state.scene === "poster" && hitTestStray(pt, diag)) {
      dragging = "stray";
      if (e.cancelable) e.preventDefault();
    } else {
      dragging = "field";
    }
    dragStart = {
      x: pt.x,
      y: pt.y,
      outer: state.outerGap,
      inner: state.innerGap,
      moved: false,
      isTouch: !!e.touches,
    };
    dirty = true;
    ctl.draw();
  }

  function onMove(e) {
    const state = getState();
    const diag = getDiagnosis();
    const pt = getLocalPt(e);

    if (!dragging) {
      if (state.scene === "poster") {
        const g = hitTestGroup(pt, diag);
        const onStray = hitTestStray(pt, diag);
        canvas.style.cursor = onStray ? "grab" : g >= 0 ? "pointer" : "ew-resize";
        if (g !== hoverGroup) {
          hoverGroup = g;
          dirty = true;
          ctl.draw();
        }
      } else {
        canvas.style.cursor = "ew-resize";
      }
      return;
    }

    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;
    if (Math.hypot(dx, dy) > 4) dragStart.moved = true;

    if (dragging === "stray") {
      if (e.cancelable) e.preventDefault();
      const padX = Math.max(24, W * 0.055);
      const padY = Math.max(22, H * 0.06);
      const u = clamp((pt.x - padX) / Math.max(80, W - padX * 2), 0.04, 0.96);
      const v = clamp((pt.y - padY) / Math.max(80, H - padY * 2), 0.06, 0.94);
      callbacks.onStrayMove(u, v);
      dirty = true;
      return;
    }

    // 触屏：横向明显时接管改 outerGap，保持竖向顺滑滚页；桌面鼠标：自由双轴（横改组间、纵改组内）
    if (dragStart.isTouch) {
      if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
        if (e.cancelable) e.preventDefault();
        const nextOuter = clamp(dragStart.outer + dx / Math.max(140, W * 0.48), 0, 1);
        callbacks.onDragGaps(nextOuter, dragStart.inner);
        dirty = true;
      }
    } else {
      const nextOuter = clamp(dragStart.outer + dx / Math.max(180, W * 0.45), 0, 1);
      const nextInner = Math.abs(dy) > 14 ? clamp(dragStart.inner + dy / Math.max(180, H * 0.52), 0, 1) : dragStart.inner;
      callbacks.onDragGaps(nextOuter, nextInner);
      dirty = true;
    }
  }

  function onEnd(e) {
    if (!dragging) return;
    const wasStray = dragging === "stray";
    const moved = dragStart.moved;
    dragging = null;

    if (!moved && !wasStray && getState().scene === "poster") {
      // 点击画布里某一组圆：循环切换该组的疏密层级（紧聚 / 适中 / 疏朗）
      const rect = canvas.getBoundingClientRect();
      const touch = e.changedTouches?.[0];
      const cx = touch ? touch.clientX : e.clientX;
      const cy = touch ? touch.clientY : e.clientY;
      if (typeof cx === "number") {
        const g = hitTestGroup({ x: cx - rect.left, y: cy - rect.top }, getDiagnosis());
        if (g >= 0) callbacks.onGroupClick(g);
      }
    }
    dirty = true;
    ctl.draw();
  }

  // 兼容鼠标与真实触屏事件（同时让 tools/perf.mjs 的 dispatchTouchEvent 帧帧流畅重绘！）
  canvas.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);
  canvas.addEventListener("touchstart", onStart, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onEnd);
  canvas.addEventListener("mouseleave", () => {
    if (hoverGroup !== -1) {
      hoverGroup = -1;
      dirty = true;
      ctl.draw();
    }
  });

  // 键盘操作：左右改组间距，上下改组内距，1–4 切各组疏密
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    const step = e.shiftKey ? 0.14 : 0.07;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      callbacks.onDragGaps(clamp(s.outerGap + step, 0, 1), s.innerGap);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      callbacks.onDragGaps(clamp(s.outerGap - step, 0, 1), s.innerGap);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      callbacks.onDragGaps(s.outerGap, clamp(s.innerGap + step, 0, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      callbacks.onDragGaps(s.outerGap, clamp(s.innerGap - step, 0, 1));
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      e.preventDefault();
      callbacks.onGroupClick(Number(e.key) - 1);
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctl = loop(canvas, (_t, dt, { still }) => {
    if (!dirty && !dragging) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    const state = getState();
    const diag = getDiagnosis();
    let keepGoing = false;
    if (state.scene === "poster") keepGoing = renderPosterScene(state, diag, dt || 0.016, still);
    else if (state.scene === "cards") keepGoing = renderCardsScene(state, diag);
    else keepGoing = renderArticleScene(state, diag);
    ctx.restore();
    dirty = keepGoing;
  });

  return {
    getSize: () => ({ W, H }),
    invalidate() {
      dirty = true;
      ctl.draw();
    },
  };
}
