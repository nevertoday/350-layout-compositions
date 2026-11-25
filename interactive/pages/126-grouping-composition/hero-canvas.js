// 126 群组构图 · 开场 2D Canvas 活体四群拼版舞台
// 承袭 126 原海报暖象牙纸面、6/6/4/9 四色几何群组、折线白圈黑点引线与底沿虚线距尺；
// 支持：1) 中轴通道横拖拉合组间距（data-perf-drag） 2) 直拖任意元素跨组互换 3) 点击红圈串组件单枚归队 4) 键盘方向键微调

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { BASE_ITEMS, PALETTE, clamp, evaluate, slotToGroupId } from "./model.js";

export function mountHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 760;
  let cssH = 490;
  let lastEval = evaluate(state, cssW, cssH);

  // 为 25 枚元素保存平滑视觉插值坐标（按 itemId 索引，交换或切模式时丝滑飞移！）
  const animPos = new Map();
  let seeded = false;

  // 拖拽态
  let dragMode = null; // "gap" | "item"
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartInter = 0;
  let dragMoved = false;
  let draggedItemId = -1;
  let draggedSlot = -1;
  let dragPointerX = 0;
  let dragPointerY = 0;
  let hoverItemId = -1;
  let activePointerId = null;

  // 开场入场微动进度（保证 0.9 秒截图时画面已经完整清楚）
  let intro = reducedMotion.matches ? 1 : 0.25;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    cssW = rect.width;
    cssH = rect.height;
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastEval = evaluate(state, cssW, cssH);
    dirty = true;
  }

  function syncTargetPositions(still) {
    lastEval = evaluate(state, cssW, cssH);
    if (!seeded || still) {
      for (const it of lastEval.layout.items) {
        animPos.set(it.itemId, { x: it.x, y: it.y, size: it.size });
      }
      seeded = true;
    }
  }

  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function hitTestItem(px, py) {
    const items = lastEval.layout.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const p = animPos.get(it.itemId) || it;
      if (px >= p.x - 4 && px <= p.x + p.size + 4 && py >= p.y - 4 && py <= p.y + p.size + 4) {
        return it;
      }
    }
    return null;
  }

  // 把一枚串组元素直接和它原属组里的一枚非本土元素（或首个元素）互换归队
  function sortSingleItemHome(clickedItem) {
    const home = clickedItem.homeGroup;
    const currSlot = clickedItem.slot;
    const range = home === "A" ? [0, 6] : home === "B" ? [6, 12] : home === "C" ? [12, 16] : [16, 25];
    let targetSlot = -1;
    // 优先找目标组里同样走错路的串组元素对换，一箭双雕！
    for (let s = range[0]; s < range[1]; s++) {
      const occupant = BASE_ITEMS[state.assignments[s]];
      if (occupant.homeGroup !== home) {
        targetSlot = s;
        break;
      }
    }
    if (targetSlot < 0) targetSlot = range[0];
    if (targetSlot === currSlot) return false;
    const tmp = state.assignments[currSlot];
    state.assignments[currSlot] = state.assignments[targetSlot];
    state.assignments[targetSlot] = tmp;
    state.shapeRule = "mixed";
    if (state.colorRule === "sorted") state.colorRule = "mixed";
    state.activePreset = "";
    // 检查是否全部天然归位
    const allHome = state.assignments.every((id, s) => BASE_ITEMS[id].homeGroup === slotToGroupId(s));
    if (allHome) {
      state.shapeRule = "sorted";
      if (state.colorRule === "mixed") state.colorRule = "sorted";
    }
    return true;
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function renderFrame(t, dt, { still }) {
    if (!cssW || !cssH) resize();
    lastEval = evaluate(state, cssW, cssH);
    const { layout, statusCode } = lastEval;

    if (!seeded || still) {
      for (const it of layout.items) {
        animPos.set(it.itemId, { x: it.x, y: it.y, size: it.size });
      }
      seeded = true;
      intro = 1;
    }

    let moving = false;
    if (!still && intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.4);
      moving = true;
    }

    const lerpRate = still ? 1 : 1 - Math.exp(-Math.max(dt, 0.016) * 16);
    for (const it of layout.items) {
      const cur = animPos.get(it.itemId) || { x: it.x, y: it.y, size: it.size };
      if (dragMode === "item" && draggedItemId === it.itemId) {
        cur.x = dragPointerX - it.size / 2;
        cur.y = dragPointerY - it.size / 2;
        cur.size = it.size;
        moving = true;
      } else {
        const dx = it.x - cur.x;
        const dy = it.y - cur.y;
        const ds = it.size - cur.size;
        if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25 || Math.abs(ds) > 0.15) {
          cur.x += dx * lerpRate;
          cur.y += dy * lerpRate;
          cur.size += ds * lerpRate;
          moving = true;
        } else {
          cur.x = it.x;
          cur.y = it.y;
          cur.size = it.size;
        }
      }
      animPos.set(it.itemId, cur);
    }

    if (!dirty && !moving && dragMode === null) return;
    dirty = false;

    const W = cssW;
    const H = cssH;
    const compact = W < 480;

    // 1. 暖象牙原纸底面（零外框黑盒，完全融纸）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    // 极克制的四角制图裁切小标（瑞士网格纸感）
    ctx.strokeStyle = "rgba(14, 17, 20, 0.16)";
    ctx.lineWidth = 1;
    const tk = 10;
    const m = 6;
    ctx.beginPath();
    ctx.moveTo(m, m + tk); ctx.lineTo(m, m); ctx.lineTo(m + tk, m);
    ctx.moveTo(W - m - tk, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + tk);
    ctx.moveTo(m, H - m - tk); ctx.lineTo(m, H - m); ctx.lineTo(m + tk, H - m);
    ctx.moveTo(W - m - tk, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - tk);
    ctx.stroke();

    // 2. 四组模式下绘制温和的中央可拖通道提示带（视觉克制，仅在四组或二营模式显现）
    if ((state.layoutMode === "four" || state.layoutMode === "two") && layout.caliper) {
      const alleyX = state.layoutMode === "four" ? layout.caliper.alleyX : layout.caliper.x1;
      const alleyW = state.layoutMode === "four" ? layout.caliper.alleyW : layout.caliper.px;
      const isBadGap = layout.spacingRatio < 1.65 || layout.spacingRatio > 4.65;
      const bandX = alleyX;
      const bandW = Math.max(alleyW, 6);
      ctx.save();
      ctx.fillStyle = dragMode === "gap"
        ? "rgba(229, 78, 8, 0.10)"
        : isBadGap
          ? "rgba(185, 28, 28, 0.06)"
          : "rgba(2, 83, 33, 0.045)";
      ctx.fillRect(bandX, compact ? 24 : 34, bandW, H - (compact ? 58 : 78));

      // 通道中线淡虚线
      const midX = bandX + bandW / 2;
      ctx.strokeStyle = dragMode === "gap"
        ? PALETTE.orange
        : isBadGap
          ? "rgba(185, 28, 28, 0.45)"
          : "rgba(14, 17, 20, 0.18)";
      ctx.lineWidth = dragMode === "gap" ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, compact ? 26 : 36);
      ctx.lineTo(midX, H - (compact ? 36 : 46));
      ctx.stroke();
      ctx.setLineDash([]);

      // 中央极简双箭把手提示（窄通道时自动收瘦为竖条免压邻格，拉开后展开为完整 ↔ 徽）
      const handleY = H * 0.48;
      if (alleyW >= 32) {
        drawRoundedRect(midX - 14, handleY - 10, 28, 20, 10);
        ctx.fillStyle = dragMode === "gap" ? PALETTE.orange : PALETTE.paperPure;
        ctx.fill();
        ctx.strokeStyle = dragMode === "gap" ? PALETTE.orange : isBadGap ? PALETTE.bad : PALETTE.ink;
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.fillStyle = dragMode === "gap" ? "#FFFFFF" : isBadGap ? PALETTE.bad : PALETTE.ink;
        ctx.font = `600 11px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("↔", midX, handleY + 0.5);
      } else {
        const gw = Math.max(6, Math.min(10, alleyW - 2));
        drawRoundedRect(midX - gw / 2, handleY - 16, gw, 32, gw / 2);
        ctx.fillStyle = dragMode === "gap" ? PALETTE.orange : isBadGap ? PALETTE.bad : PALETTE.ink;
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. 组外隐形包络（仅当组已清晰成立且打开辅助线时，画极轻的制图虚线边界）
    if (state.showGuides && layout.spacingRatio >= 1.65 && state.layoutMode !== "one") {
      ctx.save();
      ctx.strokeStyle = "rgba(14, 17, 20, 0.11)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (const g of layout.groups) {
        const pad = compact ? 4 : 6;
        ctx.strokeRect(g.x - pad, g.y - pad, g.w + pad * 2, g.h + pad * 2);
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 4. 逐枚绘制 25 个真实图形元素（正圆绝不压扁、正方绝不拉伸）
    const scaleIn = 0.72 + 0.28 * intro;
    let draggedEntry = null;
    for (const it of layout.items) {
      if (dragMode === "item" && draggedItemId === it.itemId) {
        draggedEntry = it;
        continue;
      }
      drawSingleItem(it, scaleIn, false, compact);
    }
    // 正在拖拽的元素画在最顶层并带柔和纸面投影
    if (draggedEntry) {
      drawSingleItem(draggedEntry, 1.06, true, compact);
    }

    // 5. 1:1 复刻 126 原海报折线白圈黑点引线 + 群组标牌（A/B/C/D 或二营）
    if (state.showGuides && (state.layoutMode === "four" || state.layoutMode === "two")) {
      drawPosterCallouts(layout, compact);
    } else if (state.showGuides && state.layoutMode === "nine") {
      ctx.save();
      ctx.font = `600 ${compact ? 10 : 11}px "JetBrains Mono", monospace`;
      ctx.fillStyle = PALETTE.bad;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      for (const g of layout.groups) {
        ctx.fillText(g.id, g.x, g.y - 4);
      }
      ctx.restore();
    }

    // 6. 1:1 复刻 126 原海报底沿虚线距尺 | - - - - - |
    if (layout.caliper) {
      drawCaliper(layout, compact);
    }

    // 7. 若处于典型错态，在画布左上角留一枚克制的制图状态小戳（不挡主体）
    ctx.save();
    ctx.font = `600 ${compact ? 10 : 11}px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const statusOk = statusCode === "pass";
    ctx.fillStyle = statusOk ? PALETTE.ok : PALETTE.bad;
    const ratioTxt = state.layoutMode === "one" ? "距比 1.00×" : `距比 ${layout.spacingRatio.toFixed(2)}×`;
    ctx.fillText(
      `25件 · ${layout.perceivedGroups}组 · ${ratioTxt} · 纯度 ${layout.colorCueActive ? Math.min(layout.shapePurity, layout.colorPurity) : layout.shapePurity}%`,
      compact ? 14 : 18,
      compact ? 10 : 12
    );
    ctx.restore();
  }

  function drawSingleItem(it, scale, isLifted, compact) {
    const cur = animPos.get(it.itemId) || it;
    const s = cur.size * scale;
    const cx = cur.x + cur.size / 2;
    const cy = cur.y + cur.size / 2;
    const x = cx - s / 2;
    const y = cy - s / 2;
    const isHover = hoverItemId === it.itemId && dragMode === null;

    ctx.save();
    if (isLifted) {
      ctx.shadowColor = "rgba(14, 17, 20, 0.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
    }

    ctx.fillStyle = it.fill;
    if (it.shape === "circle") {
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, s, s);
    }
    ctx.shadowColor = "transparent";

    // 悬停轻描边
    if (isHover || isLifted) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      if (it.shape === "circle") {
        ctx.beginPath();
        ctx.arc(cx, cy, s / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x - 2, y - 2, s + 4, s + 4);
      }
    }

    // 若是「工作台」或「展陈墙」载体，在图形正中印上清晰的中文单字标签（保证对比度！）
    if (it.glyph) {
      const darkText = it.colorKey === "pink";
      ctx.fillStyle = darkText ? PALETTE.ink : "#FFFDF9";
      const fs = Math.max(11, Math.round(s * (compact ? 0.42 : 0.38)));
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.glyph, cx, cy + 0.5);
    }

    // 串组叛徒件：右上角打一枚极精炼的白底红圈「!」或虚线告警圈（绝不画大红横幅挡图形）
    if (it.isRebel && state.showGuides) {
      ctx.strokeStyle = PALETTE.bad;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 2]);
      if (it.shape === "circle") {
        ctx.beginPath();
        ctx.arc(cx, cy, s / 2 + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x - 2.5, y - 2.5, s + 5, s + 5);
      }
      ctx.setLineDash([]);

      const bx = x + s - 2;
      const by = y + 2;
      ctx.fillStyle = PALETTE.bad;
      ctx.beginPath();
      ctx.arc(bx, by, compact ? 5.5 : 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.paper;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${compact ? 8 : 9}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", bx, by + 0.5);
    }

    ctx.restore();
  }

  function drawPosterCallouts(layout, compact) {
    ctx.save();
    const minAlleyH = compact ? 26 : 32;
    const alleyH = layout.caliper && typeof layout.caliper.alleyH === "number" ? layout.caliper.alleyH : 99;
    for (const g of layout.groups) {
      // 下排 C / D 组仅在上下通道拉开、足以容下标注时浮现，避免压进上排图形！
      const isBottomGroup = g.id === "C" || g.id === "D";
      let alpha = 1;
      if (isBottomGroup) {
        if (alleyH < minAlleyH - 4) continue;
        alpha = clamp((alleyH - (minAlleyH - 4)) / 10, 0, 1);
      }

      const anchorX = g.x + Math.min(g.w * 0.24, layout.unit * 0.65);
      const anchorY = g.y + 1;
      const elbowY = g.y - (compact ? 10 : 14);
      const elbowX = anchorX + (compact ? 7 : 10);
      const tailX = elbowX + (compact ? 14 : 24);

      ctx.globalAlpha = alpha;
      // 折线引线
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(tailX, elbowY);
      ctx.stroke();

      // 原海报招牌白圈黑实心圆点
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(anchorX, anchorY, compact ? 2.8 : 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.paper;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 组标题文字
      const labelX = g.x;
      const labelY = elbowY - 3;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${compact ? 10.5 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(compact ? g.zh.replace(/：.+$/, "") : g.zh, labelX, labelY);
    }
    ctx.restore();
  }

  function drawCaliper(layout, compact) {
    const cal = layout.caliper;
    const isOk = layout.spacingRatio >= 1.65 && layout.spacingRatio <= 4.65 && state.layoutMode !== "one";
    const color = isOk ? PALETTE.ok : PALETTE.bad;
    const y = Math.min(cssH - (compact ? 14 : 18), cal.y);
    const x1 = cal.x1;
    const x2 = Math.max(cal.x2, x1 + 2);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    // 左右端竖线 |   |
    ctx.beginPath();
    ctx.moveTo(x1, y - 6); ctx.lineTo(x1, y + 6);
    ctx.moveTo(x2, y - 6); ctx.lineTo(x2, y + 6);
    ctx.stroke();

    // 中间虚线 - - - -
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 标尺读数
    const midX = (x1 + x2) / 2;
    const txt = state.layoutMode === "one"
      ? "组间通道 0px（无分隔）"
      : `组间通道 ${Math.round(layout.interPx)}px · 组内 ${Math.round(layout.intraPx)}px（${layout.spacingRatio.toFixed(2)}×）`;
    ctx.font = `600 ${compact ? 10 : 11}px "JetBrains Mono", monospace`;
    const tw = ctx.measureText(txt).width;
    const pillX = clamp(midX - tw / 2 - 8, 8, cssW - tw - 24);
    drawRoundedRect(pillX, y - 10, tw + 16, 20, 4);
    ctx.fillStyle = PALETTE.paper;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, pillX + 8, y + 0.5);
    ctx.restore();
  }

  // ---------- 指针与触控交互 ----------
  function onPointerDown(e) {
    if (e.pointerType === "touch") return; // 触控交由 touch 事件专管，避免双触发并放行页面竖滚
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pt = canvasPoint(e);
    dragStartX = pt.x;
    dragStartY = pt.y;
    dragPointerX = pt.x;
    dragPointerY = pt.y;
    dragMoved = false;
    activePointerId = e.pointerId;

    // 命中中轴通道区优先走拉间距
    const nearCenterX = Math.abs(pt.x - cssW / 2) < Math.max(36, cssW * 0.14);
    const hit = nearCenterX ? null : hitTestItem(pt.x, pt.y);

    if (hit) {
      dragMode = "item";
      draggedItemId = hit.itemId;
      draggedSlot = hit.slot;
    } else {
      dragMode = "gap";
      dragStartInter = state.interGap;
      if (state.layoutMode === "one") {
        state.layoutMode = "four";
      }
    }
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    canvas.style.cursor = "grabbing";
    dirty = true;
    ctl.draw();
  }

  function onPointerMove(e) {
    if (e.pointerType === "touch") return;
    const pt = canvasPoint(e);
    if (dragMode === null) {
      const hit = hitTestItem(pt.x, pt.y);
      const nextHover = hit ? hit.itemId : -1;
      if (nextHover !== hoverItemId) {
        hoverItemId = nextHover;
        canvas.style.cursor = hit ? "grab" : "ew-resize";
        dirty = true;
        ctl.draw();
      } else if (!hit) {
        canvas.style.cursor = "ew-resize";
      }
      return;
    }
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    const dx = pt.x - dragStartX;
    const dy = pt.y - dragStartY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;

    dragPointerX = pt.x;
    dragPointerY = pt.y;

    if (dragMode === "gap") {
      // 横向拖动直接连续调组间距（向右拉宽，向左压紧）
      const delta = dx / Math.max(180, cssW * 0.42);
      state.interGap = clamp(dragStartInter + delta, 0.02, 1.0);
      state.activePreset = "";
      dirty = true;
      onChange("drag-gap");
      ctl.draw();
    } else if (dragMode === "item") {
      dirty = true;
      ctl.draw();
    }
  }

  function onPointerUp(e) {
    if (dragMode === null) return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    const pt = canvasPoint(e);

    if (dragMode === "item") {
      const originItem = lastEval.layout.items.find((it) => it.itemId === draggedItemId);
      if (!dragMoved && originItem && originItem.isRebel) {
        // 单击串组红标元素：直接把它送回本组！
        if (sortSingleItemHome(originItem)) {
          onChange("click-sort");
        }
      } else if (dragMoved) {
        // 拖放到另一枚元素上：两者真实互换位置！
        let closest = null;
        let minD = Infinity;
        for (const it of lastEval.layout.items) {
          if (it.itemId === draggedItemId) continue;
          const d = Math.hypot(pt.x - it.cx, pt.y - it.cy);
          if (d < minD) {
            minD = d;
            closest = it;
          }
        }
        if (closest && minD < lastEval.layout.unit * 1.45) {
          const tmp = state.assignments[draggedSlot];
          state.assignments[draggedSlot] = state.assignments[closest.slot];
          state.assignments[closest.slot] = tmp;
          state.shapeRule = "mixed";
          if (state.colorRule === "sorted") state.colorRule = "mixed";
          state.activePreset = "";
          const allHome = state.assignments.every((id, s) => BASE_ITEMS[id].homeGroup === slotToGroupId(s));
          if (allHome) {
            state.shapeRule = "sorted";
            if (state.colorRule === "mixed") state.colorRule = "sorted";
          }
          onChange("swap-item");
        }
      }
    }

    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    dragMode = null;
    draggedItemId = -1;
    draggedSlot = -1;
    activePointerId = null;
    canvas.style.cursor = "ew-resize";
    dirty = true;
    ctl.draw();
  }

  // 触摸横拖（保证 touchStart/touchMove 在 mobile CDP 下也能顺滑推动组距，不阻断页面竖滚）
  let touchActive = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartInter = 0;
  let touchAxis = null; // "x" | "y" | null

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    touchActive = true;
    touchStartX = t0.clientX;
    touchStartY = t0.clientY;
    touchStartInter = state.interGap;
    touchAxis = null;
  }

  function onTouchMove(e) {
    if (!touchActive || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - touchStartX;
    const dy = t0.clientY - touchStartY;
    if (!touchAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (touchAxis === "x") {
      e.preventDefault();
      if (state.layoutMode === "one") state.layoutMode = "four";
      const delta = dx / Math.max(150, cssW * 0.45);
      state.interGap = clamp(touchStartInter + delta, 0.02, 1.0);
      state.activePreset = "";
      dirty = true;
      onChange("touch-gap");
      ctl.draw();
    }
  }

  function onTouchEnd(e) {
    if (touchActive && touchAxis === null && e.changedTouches && e.changedTouches.length === 1) {
      const t0 = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const hit = hitTestItem(t0.clientX - rect.left, t0.clientY - rect.top);
      if (hit && hit.isRebel && sortSingleItemHome(hit)) {
        dirty = true;
        onChange("touch-sort");
        ctl.draw();
      }
    }
    touchActive = false;
    touchAxis = null;
  }

  // 键盘微调（画布获得焦点后方向键调间距）
  function onKeyDown(e) {
    let handled = true;
    if (e.key === "ArrowRight") {
      if (state.layoutMode === "one") state.layoutMode = "four";
      state.interGap = clamp(state.interGap + 0.05, 0.02, 1.0);
      state.activePreset = "";
    } else if (e.key === "ArrowLeft") {
      if (state.layoutMode === "one") state.layoutMode = "four";
      state.interGap = clamp(state.interGap - 0.05, 0.02, 1.0);
      state.activePreset = "";
    } else if (e.key === "ArrowUp") {
      state.intraGap = clamp(state.intraGap - 0.05, 0.0, 1.0);
      state.activePreset = "";
    } else if (e.key === "ArrowDown") {
      state.intraGap = clamp(state.intraGap + 0.05, 0.0, 1.0);
      state.activePreset = "";
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      dirty = true;
      onChange("key");
      ctl.draw();
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  canvas.addEventListener("keydown", onKeyDown);

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);

  resize();
  syncTargetPositions(reducedMotion.matches);
  const ctl = loop(canvas, renderFrame);
  ctl.draw();

  return {
    refresh() {
      dirty = true;
      lastEval = evaluate(state, cssW, cssH);
      ctl.draw();
      return lastEval;
    },
    getEval() {
      return evaluate(state, cssW, cssH);
    },
    getSize() {
      return { width: cssW, height: cssH };
    },
  };
}
