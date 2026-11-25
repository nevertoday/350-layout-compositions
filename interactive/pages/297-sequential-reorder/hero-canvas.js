// 297 顺序重排 — 深蓝工程蓝图活体优先级阶梯与序列直拖台（2D Canvas）
// 1:1 承袭 297 原海报 #011A8C 深蓝底、四阶上升象牙白阶梯、黄绿几何标（●■▲≡）、弯箭与斜向虚线矢量，
// 下半部承袭原海报「应用示例」横向阅读序列轨，全画布支持直接拖拽卡片跨位换序 + 双点互换 + Tab 焦点错位轨迹显影。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, SHAPES, SLOT_CIRCLES } from "./model.js";

/** 绘制原海报同款 4 种几何图形（纯矢量，绝不依赖系统符号字体） */
export function drawShapeIcon(ctx, id, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  if (id === "focus") {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "support") {
    const s = r * 1.82;
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
  } else if (id === "supplement") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 1.06);
    ctx.lineTo(cx + r * 1.12, cy + r * 0.88);
    ctx.lineTo(cx - r * 1.12, cy + r * 0.88);
    ctx.closePath();
    ctx.fill();
  } else {
    // extend: 三条粗横杠 ≡（原海报左下角图标）
    const w = r * 2.04;
    const h = Math.max(2.5, r * 0.34);
    const gap = r * 0.62;
    ctx.fillRect(cx - w / 2, cy - gap - h / 2, w, h);
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.fillRect(cx - w / 2, cy + gap - h / 2, w, h);
  }
  ctx.restore();
}

/** 绘制箭头头部 */
function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.56);
  ctx.lineTo(-size * 0.72, 0);
  ctx.lineTo(-size, size * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createHeroCanvas(canvas, { getEval, getSelectedId, onSelect, onReorder }) {
  const ctx = canvas.getContext("2d");
  let cw = 800;
  let ch = 460;
  let dpr = 1;

  // 平滑动画插值状态：每个模块 ID 当前在水平序列轨和阶梯里的连续槽位值（0..3）
  const animSlot = { focus: 1, support: 2, supplement: 0, extend: 3 };
  let introProgress = 0; // 0 → 1 开场阶梯描绘动画
  let flowPhase = 0; // 流动光点相位

  // 拖拽状态
  const drag = {
    active: false,
    pointerId: -1,
    modId: null,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
    moved: false,
    zone: "rail", // "rail" | "stairs"
    originSlot: 0,
    grabOffsetX: 0,
  };

  // 点击交互缓存几何框（每次 layout 计算，保证 hit-test 与绘制完全同源）
  let geom = {
    compact: false,
    railCards: [], // [{ x, y, w, h, slot }]
    stairBoxes: [], // [{ x, y, w, h, slot }]  slot 0 = 顶部①, slot 3 = 左下④
    railRect: { x: 0, y: 0, w: 0, h: 0 },
  };

  function syncAnimImmediate() {
    const ev = getEval();
    ev.order.forEach((id, i) => {
      animSlot[id] = i;
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    dpr = pixelRatio(2);
    cw = rect.width;
    ch = rect.height;
    const tw = Math.round(cw * dpr);
    const th = Math.round(ch * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    computeGeom();
  }

  function computeGeom() {
    const compact = cw < 520;
    const shortH = ch < 320;
    const padX = compact ? 14 : 24;
    const padTop = shortH ? 18 : compact ? 22 : 24;
    const padBot = shortH ? 10 : compact ? 14 : 18;
    const usableW = cw - padX * 2;
    const usableH = ch - padTop - padBot;

    // 上区：四阶上升优先级阶梯；下区：原海报底部横向阅读序列轨
    const stairZoneH = usableH * (shortH ? 0.54 : compact ? 0.56 : 0.61);
    const dividerY = padTop + stairZoneH + (shortH ? 6 : compact ? 10 : 14);
    const railTop = dividerY + (shortH ? 18 : compact ? 22 : 24);
    const railH = Math.max(shortH ? 68 : 86, ch - padBot - railTop);

    // 阶梯 4 格：忠实承袭原海报「左下 ④ → ③ → ② → 右上 ①」对角上升
    const boxW = Math.min(compact ? usableW * 0.23 : 138, (usableW - (compact ? 18 : 42)) / 4);
    const boxH = Math.min(shortH ? 54 : compact ? 70 : 96, stairZoneH * (shortH ? 0.46 : 0.43));
    const spanX = usableW - boxW;
    const spanY = Math.max(shortH ? 24 : 36, stairZoneH - boxH - (shortH ? 18 : compact ? 24 : 30));

    // slot 0 = 优先级 ①（最右上）；slot 3 = 优先级 ④（最左下）
    const stairBoxes = [0, 1, 2, 3].map((slot) => {
      const k = (3 - slot) / 3; // slot 3 → 0 (左下), slot 0 → 1 (右上)
      const x = padX + k * spanX;
      const y = padTop + (shortH ? 14 : compact ? 18 : 22) + (1 - k) * spanY;
      return { slot, x, y, w: boxW, h: boxH, cx: x + boxW / 2, cy: y + boxH / 2 };
    });

    // 底部横向序列轨：左到右 第 1 读位 → 第 4 读位
    const railGap = compact ? 8 : 14;
    const cardW = (usableW - railGap * 3) / 4;
    const cardH = Math.min(shortH ? 72 : compact ? 88 : 102, railH);
    const railCards = [0, 1, 2, 3].map((slot) => {
      const x = padX + slot * (cardW + railGap);
      const y = railTop;
      return { slot, x, y, w: cardW, h: cardH, cx: x + cardW / 2, cy: y + cardH / 2 };
    });

    geom = {
      compact,
      shortH,
      padX,
      padTop,
      usableW,
      dividerY,
      railTop,
      railH: cardH,
      stairBoxes,
      railCards,
      railRect: { x: padX, y: railTop, w: usableW, h: cardH },
    };
  }

  /** 根据画布坐标命中最合适的卡片（包含上下两区；若拖空白区则就近吸附最接近的一张卡） */
  function hitCard(px, py) {
    const ev = getEval();
    for (let i = 0; i < 4; i++) {
      const r = geom.railCards[i];
      if (px >= r.x - 4 && px <= r.x + r.w + 4 && py >= r.y - 12 && py <= r.y + r.h + 8) {
        return { slot: i, modId: ev.order[i], zone: "rail", rect: r };
      }
    }
    for (let i = 0; i < 4; i++) {
      const b = geom.stairBoxes[i];
      if (px >= b.x - 4 && px <= b.x + b.w + 4 && py >= b.y - 18 && py <= b.y + b.h + 6) {
        return { slot: i, modId: ev.order[i], zone: "stairs", rect: b };
      }
    }
    return null;
  }

  /** 将指针 X 映射到 0..3 的槽位索引 */
  function xToSlot(px, zone) {
    if (zone === "stairs") {
      // 阶梯从左下(slot 3)升至右上(slot 0)：向右移意味着优先级更高(slot 数字变小)
      const leftCx = geom.stairBoxes[3].cx;
      const rightCx = geom.stairBoxes[0].cx;
      const t = (px - leftCx) / Math.max(1, rightCx - leftCx);
      return Math.max(0, Math.min(3, Math.round((1 - t) * 3)));
    }
    const leftCx = geom.railCards[0].cx;
    const rightCx = geom.railCards[3].cx;
    const t = (px - leftCx) / Math.max(1, rightCx - leftCx);
    return Math.max(0, Math.min(3, Math.round(t * 3)));
  }

  function localXY(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    computeGeom();
    const { x, y } = localXY(e);
    const ev = getEval();
    let hit = hitCard(x, y);
    if (!hit) {
      // 如果在画布中间或空白带起拖（含 perf.mjs 触屏横拖），就近拾取离手指 X 最近的序列卡片
      const nearZone = y >= geom.dividerY - 14 ? "rail" : "stairs";
      const slot = xToSlot(x, nearZone);
      const rect = nearZone === "rail" ? geom.railCards[slot] : geom.stairBoxes[slot];
      hit = { slot, modId: ev.order[slot], zone: nearZone, rect };
    }
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.modId = hit.modId;
    drag.startX = x;
    drag.startY = y;
    drag.currX = x;
    drag.currY = y;
    drag.moved = false;
    drag.zone = hit.zone;
    drag.originSlot = hit.slot;
    drag.grabOffsetX = x - hit.rect.cx;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    canvas.style.cursor = "grabbing";
    ctrl.draw();
  }

  function onPointerMove(e) {
    if (!drag.active || e.pointerId !== drag.pointerId) {
      // 悬停手势提示
      if (e.pointerType === "mouse") {
        const { x, y } = localXY(e);
        canvas.style.cursor = hitCard(x, y) ? "grab" : "ew-resize";
      }
      return;
    }
    const { x, y } = localXY(e);
    drag.currX = x;
    drag.currY = y;
    if (Math.abs(x - drag.startX) > 6 || Math.abs(y - drag.startY) > 6) {
      drag.moved = true;
    }
    if (drag.moved) {
      const ev = getEval();
      const targetSlot = xToSlot(x - drag.grabOffsetX, drag.zone);
      const curSlot = ev.order.indexOf(drag.modId);
      if (curSlot !== -1 && targetSlot !== curSlot) {
        const next = [...ev.order];
        next.splice(curSlot, 1);
        next.splice(targetSlot, 0, drag.modId);
        onReorder(next, drag.modId, "drag");
      }
    }
    ctrl.draw();
  }

  function onPointerUp(e) {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    const wasMoved = drag.moved;
    const clickedId = drag.modId;
    drag.active = false;
    drag.modId = null;
    canvas.style.cursor = "grab";

    if (!wasMoved && clickedId) {
      // 双点互换：若已选中另一张卡，则直接互换两卡位次；否则选中当前卡
      const prevSel = getSelectedId();
      if (prevSel && prevSel !== clickedId) {
        const ev = getEval();
        const next = [...ev.order];
        const a = next.indexOf(prevSel);
        const b = next.indexOf(clickedId);
        if (a !== -1 && b !== -1) {
          [next[a], next[b]] = [next[b], next[a]];
          onReorder(next, clickedId, "swap");
        }
      } else {
        onSelect(clickedId);
      }
    } else if (clickedId) {
      onSelect(clickedId);
    }
    ctrl.draw();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // ---------- 绘图 ----------
  function drawFrame(t, dt, { still }) {
    if (cw < 20 || ch < 20) resize();
    const ev = getEval();
    const selectedId = getSelectedId();
    const sc = ev.scenario;

    if (still) {
      introProgress = 1;
      syncAnimImmediate();
    } else {
      introProgress = Math.min(1, introProgress + (dt > 0 ? dt * 1.45 : 0.04));
      flowPhase = (flowPhase + (dt > 0 ? dt * 0.65 : 0)) % 1;
      const k = dt > 0 ? Math.min(1, dt * 15) : 0.25;
      ev.order.forEach((id, slot) => {
        if (drag.active && drag.moved && drag.modId === id) {
          // 被拖拽中的卡片跟手平滑滑动
          const rawX = drag.currX - drag.grabOffsetX;
          let fracSlot;
          if (drag.zone === "stairs") {
            const leftCx = geom.stairBoxes[3].cx;
            const rightCx = geom.stairBoxes[0].cx;
            const u = (rawX - leftCx) / Math.max(1, rightCx - leftCx);
            fracSlot = Math.max(-0.18, Math.min(3.18, (1 - u) * 3));
          } else {
            const leftCx = geom.railCards[0].cx;
            const rightCx = geom.railCards[3].cx;
            const u = (rawX - leftCx) / Math.max(1, rightCx - leftCx);
            fracSlot = Math.max(-0.18, Math.min(3.18, u * 3));
          }
          animSlot[id] = fracSlot;
        } else {
          animSlot[id] += (slot - animSlot[id]) * k;
        }
      });
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深蓝蓝图底 + 建筑精细坐标网格
    ctx.fillStyle = PALETTE.cobalt;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.strokeStyle = "rgba(253, 255, 243, 0.065)";
    ctx.lineWidth = 1;
    const gridStep = geom.compact ? 26 : 34;
    ctx.beginPath();
    for (let x = gridStep; x < cw; x += gridStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, ch);
    }
    for (let y = gridStep; y < ch; y += gridStep) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(cw, y + 0.5);
    }
    ctx.stroke();

    // 蓝图四角定位角标
    ctx.strokeStyle = "rgba(253, 255, 243, 0.34)";
    ctx.lineWidth = 1.25;
    const mk = 10;
    const inset = 6;
    [
      [inset, inset, 1, 1],
      [cw - inset, inset, -1, 1],
      [inset, ch - inset, 1, -1],
      [cw - inset, ch - inset, -1, -1],
    ].forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * mk);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * mk, cy);
      ctx.stroke();
    });
    ctx.restore();

    // 顶沿极简蓝图状态标尺
    ctx.save();
    ctx.font = `500 ${geom.compact ? 10.5 : 11.5}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "rgba(198, 212, 255, 0.9)";
    ctx.textBaseline = "top";
    ctx.fillText("STAIRCASE · 优先级阶梯（④→①）", geom.padX, 8);
    const statusTxt = ev.isSequenceValid
      ? (ev.hasCssTrap ? "[!] 焦点错跳" : "✓ 顺次成立")
      : `× 逆序 ${ev.inversions} 处`;
    ctx.textAlign = "right";
    ctx.fillStyle = ev.isSequenceValid
      ? (ev.hasCssTrap ? PALETTE.coralDark : PALETTE.mintDark)
      : PALETTE.coralDark;
    ctx.fillText(statusTxt, cw - geom.padX, 8);
    ctx.restore();

    // 2. 绘制原海报标志性白色直角阶梯线（随 introProgress 从左下绘制到右上）
    drawStaircaseGeometry(ctx, ev, introProgress);

    // 3. 绘制阶梯上的 4 张模块框（非拖拽项先画，拖拽项置顶）
    const drawOrder = [...ev.order].sort((a, b) => (drag.active && drag.modId === a ? 1 : drag.active && drag.modId === b ? -1 : 0));
    for (const modId of drawOrder) {
      drawStairModule(ctx, modId, ev, sc, selectedId);
    }

    // 4. 绘制阶梯间跃迁弧箭（顺向为原海报黄绿弯箭，逆序为珊瑚红折返警报箭）
    drawStairTransitions(ctx, ev, introProgress, flowPhase, still);

    // 5. 中分隔细线与「横向阅读序列轨」标头（呼应原海报「应用示例」）
    ctx.save();
    ctx.strokeStyle = "rgba(253, 255, 243, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(geom.padX, geom.dividerY + 0.5);
    ctx.lineTo(cw - geom.padX, geom.dividerY + 0.5);
    ctx.stroke();

    ctx.font = `600 ${geom.compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.chartreuse;
    ctx.textBaseline = "top";
    ctx.fillText(
      geom.compact ? "阅读序列轨（横拖换序 / 双点互换）" : "阅读序列轨 · 第 1 读位 → 第 4 读位（直接横拖任意卡片跨位换序）",
      geom.padX,
      geom.dividerY + 6
    );
    ctx.restore();

    // 6. 底部序列轨槽位底框（虚线占位槽）
    for (let s = 0; s < 4; s++) {
      const r = geom.railCards[s];
      ctx.save();
      ctx.strokeStyle = "rgba(253, 255, 243, 0.16)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.restore();

      // 槽位之间的小推进箭（纯矢量，避免缺字）
      if (s < 3) {
        const nextR = geom.railCards[s + 1];
        const midX = (r.x + r.w + nextR.x) / 2;
        const midY = r.y + r.h / 2;
        const isBacktrack = ev.adjacentBacktracks.some(([a]) => a === s);
        ctx.save();
        ctx.strokeStyle = isBacktrack ? PALETTE.coralDark : PALETTE.chartreuse;
        ctx.lineWidth = 1.6;
        const hw = geom.compact ? 3 : 4.5;
        ctx.beginPath();
        ctx.moveTo(midX - hw, midY);
        ctx.lineTo(midX + hw, midY);
        ctx.stroke();
        drawArrowHead(ctx, midX + hw + 1, midY, 0, geom.compact ? 4.2 : 5.2, isBacktrack ? PALETTE.coralDark : PALETTE.chartreuse);
        if (isBacktrack) {
          drawArrowHead(ctx, midX - hw - 1, midY, Math.PI, geom.compact ? 4.2 : 5.2, PALETTE.coralDark);
        }
        ctx.restore();
      }
    }

    // 7. 底部序列轨 4 张实体可拖卡片
    for (const modId of drawOrder) {
      drawRailCard(ctx, modId, ev, sc, selectedId);
    }

    // 8. 若开启「仅 CSS order」，在底部序列轨上叠加珊瑚红 Tab 键盘焦点错跳轨迹！
    if (ev.mode === "css-order") {
      drawFocusOverlay(ctx, ev, flowPhase, still);
    }

    ctx.restore();
  }

  function drawStaircaseGeometry(ctx, ev, progress) {
    const boxes = geom.stairBoxes; // [0: 右上①, 1: ②, 2: ③, 3: 左下④]
    // 阶梯折线点：从左下 ④ 右侧起步，逐级抬升至右上 ① 底部再右延（完全复刻原海报白线阶梯！）
    const pts = [];
    const drop = geom.compact ? 8 : 11;
    const x0 = boxes[3].x + boxes[3].w + (geom.compact ? 5 : 10);
    const yBase = boxes[3].y + boxes[3].h;
    pts.push([x0, yBase]);

    for (let s = 3; s >= 0; s--) {
      const b = boxes[s];
      const stepY = b.y + b.h + drop;
      const rightEdge = s > 0 ? boxes[s - 1].x + (geom.compact ? 4 : 8) : Math.min(cw - geom.padX, b.x + b.w + 14);
      if (s === 3) {
        pts.push([x0, boxes[2].y + boxes[2].h + drop]);
        pts.push([boxes[2].x + boxes[2].w + (geom.compact ? 5 : 10), boxes[2].y + boxes[2].h + drop]);
      } else if (s === 2) {
        pts.push([boxes[2].x + boxes[2].w + (geom.compact ? 5 : 10), boxes[1].y + boxes[1].h + drop]);
        pts.push([boxes[1].x + boxes[1].w + (geom.compact ? 5 : 10), boxes[1].y + boxes[1].h + drop]);
      } else if (s === 1) {
        pts.push([boxes[1].x + boxes[1].w + (geom.compact ? 5 : 10), boxes[0].y + boxes[0].h + drop]);
        pts.push([rightEdge, boxes[0].y + boxes[0].h + drop]);
      } else {
        // 顶部平延伸
        pts[pts.length - 1] = [Math.min(cw - geom.padX, b.x + b.w + 12), stepY];
      }
    }

    // 计算总路径长按 progress 截取
    let totalLen = 0;
    const segLens = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segLens.push(len);
      totalLen += len;
    }
    let remain = totalLen * progress;

    ctx.save();
    ctx.strokeStyle = PALETTE.ivory;
    ctx.lineWidth = geom.compact ? 2.4 : 3.2;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < segLens.length && remain > 0; i++) {
      const len = segLens[i];
      const frac = Math.min(1, remain / Math.max(0.001, len));
      const nx = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * frac;
      const ny = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * frac;
      ctx.lineTo(nx, ny);
      remain -= len;
    }
    ctx.stroke();

    // 原海报右侧斜向白色虚线矢量 ↗（顺态亮象牙白，错态淡化为引导基准线）
    const diagX1 = x0 + (geom.compact ? 14 : 26);
    const diagY1 = yBase - 2;
    const diagX2 = Math.min(cw - geom.padX - 6, boxes[0].x + boxes[0].w + 6);
    const diagY2 = boxes[0].y + boxes[0].h + drop + (geom.compact ? 16 : 22);
    if (diagX2 > diagX1 + 20 && diagY1 > diagY2 + 10) {
      const ex = diagX1 + (diagX2 - diagX1) * progress;
      const ey = diagY1 + (diagY2 - diagY1) * progress;
      ctx.strokeStyle = ev.isSequenceValid ? "rgba(253, 255, 243, 0.85)" : "rgba(253, 255, 243, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(diagX1, diagY1);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
      if (progress > 0.7) {
        const ang = Math.atan2(diagY2 - diagY1, diagX2 - diagX1);
        drawArrowHead(ctx, ex, ey, ang, 8, ev.isSequenceValid ? PALETTE.ivory : "rgba(253, 255, 243, 0.45)");
      }
    }
    ctx.restore();
  }

  function interpStairRect(slotFloat) {
    const clamped = Math.max(0, Math.min(3, slotFloat));
    const lo = Math.floor(clamped);
    const hi = Math.min(3, lo + 1);
    const f = clamped - lo;
    const a = geom.stairBoxes[lo];
    const b = geom.stairBoxes[hi];
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      w: a.w,
      h: a.h,
    };
  }

  function drawStairModule(ctx, modId, ev, sc, selectedId) {
    const slotIdx = ev.order.indexOf(modId);
    const sFloat = animSlot[modId] ?? slotIdx;
    const rect = interpStairRect(sFloat);
    const isDrag = drag.active && drag.moved && drag.modId === modId;
    const isSel = selectedId === modId;
    const isMatch = ev.slotMatches[slotIdx];
    const mod = sc.modules[modId];

    const lift = isDrag ? -5 : 0;
    const rx = rect.x;
    const ry = rect.y + lift;

    ctx.save();
    // 上方优先级徽标（原海报「优先级 ① →」样式）
    ctx.font = `700 ${geom.compact ? 10.5 : 12}px "Noto Sans SC", "Chivo", sans-serif`;
    ctx.fillStyle = isMatch ? PALETTE.chartreuse : PALETTE.coralDark;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const rankLabel = geom.compact ? `位次 ${SLOT_CIRCLES[slotIdx]}` : `优先级 ${SLOT_CIRCLES[slotIdx]}`;
    ctx.fillText(rankLabel, rx, ry - 4);
    if (slotIdx === 0 && !geom.compact) {
      // 原海报右上角 ① 旁的黄绿小直箭
      const arrowY = ry - 10;
      const ax1 = rx + 62;
      const ax2 = Math.min(rx + rect.w - 4, ax1 + 26);
      if (ax2 > ax1 + 10) {
        ctx.strokeStyle = isMatch ? PALETTE.chartreuse : PALETTE.coralDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax1, arrowY);
        ctx.lineTo(ax2 - 4, arrowY);
        ctx.stroke();
        drawArrowHead(ctx, ax2, arrowY, 0, 6.5, isMatch ? PALETTE.chartreuse : PALETTE.coralDark);
      }
    }

    // 模块蓝图箱体（0px 锐利直角：顺态实线象牙白，错态虚线框）
    ctx.fillStyle = isDrag
      ? "#0A2CC2"
      : isSel
        ? "#0725AA"
        : isMatch
          ? PALETTE.cobaltWell
          : "rgba(3, 21, 108, 0.92)";
    ctx.fillRect(rx, ry, rect.w, rect.h);

    ctx.strokeStyle = isDrag
      ? PALETTE.chartreuse
      : isSel
        ? PALETTE.chartreuse
        : isMatch
          ? PALETTE.ivory
          : PALETTE.coralDark;
    ctx.lineWidth = isDrag || isSel ? 2.2 : 1.4;
    if (!isMatch && !isDrag) ctx.setLineDash([5, 4]);
    ctx.strokeRect(rx + 0.5, ry + 0.5, rect.w - 1, rect.h - 1);
    ctx.setLineDash([]);

    // 几何图标
    const iconR = geom.shortH ? 8.5 : geom.compact ? 10 : 14;
    const iconCy = ry + (geom.shortH ? 18 : geom.compact ? 22 : 30);
    drawShapeIcon(ctx, modId, rx + rect.w / 2, iconCy, iconR, PALETTE.chartreuse);

    // 中文模块名
    ctx.fillStyle = PALETTE.ivory;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `700 ${geom.shortH ? 10.5 : geom.compact ? 11 : 13.5}px "Noto Sans SC", sans-serif`;
    ctx.fillText(mod.name, rx + rect.w / 2, iconCy + iconR + (geom.shortH ? 5 : geom.compact ? 6 : 9), rect.w - 8);

    // 副标签（桌面端）
    if (!geom.compact && !geom.shortH) {
      ctx.fillStyle = PALETTE.ice;
      ctx.font = `400 10.5px "Noto Sans SC", sans-serif`;
      ctx.fillText(mod.sub, rx + rect.w / 2, iconCy + iconR + 28, rect.w - 10);
    }

    // 错位角标
    if (!isMatch) {
      const tagW = geom.compact ? 28 : 34;
      const tagH = 15;
      ctx.fillStyle = PALETTE.coralFill;
      ctx.fillRect(rx + rect.w - tagW, ry, tagW, tagH);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 9.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("错位", rx + rect.w - tagW / 2, ry + tagH / 2 + 0.5);
    }

    ctx.restore();
  }

  function drawStairTransitions(ctx, ev, progress, phase, still) {
    if (progress < 0.35) return;
    const boxes = geom.stairBoxes;
    ctx.save();
    for (let s = 3; s >= 1; s--) {
      // 从低阶 s (左下) 弯向高阶 s-1 (右上)，与原海报一致
      const from = boxes[s];
      const to = boxes[s - 1];
      const isBacktrack = ev.adjacentBacktracks.some(([a, b]) => a === s - 1 && b === s);

      const x1 = from.x + from.w * 0.72;
      const y1 = from.y - (geom.compact ? 14 : 18);
      const x2 = to.x - (geom.compact ? 4 : 7);
      const y2 = to.y + to.h * 0.42;
      const cx = (x1 + x2) / 2 - (geom.compact ? 8 : 14);
      const cy = Math.min(y1, y2) - (geom.compact ? 12 : 18);

      ctx.strokeStyle = isBacktrack ? PALETTE.coralDark : PALETTE.chartreuse;
      ctx.lineWidth = isBacktrack ? 2.2 : 2;
      if (isBacktrack) ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      const ang = Math.atan2(y2 - cy, x2 - cx);
      drawArrowHead(ctx, x2, y2, ang, geom.compact ? 6.5 : 8, isBacktrack ? PALETTE.coralDark : PALETTE.chartreuse);

      // 顺流状态下的微弱流动光点（只作路径方向提示，不喧宾夺主）
      if (!still && !isBacktrack && ev.isSequenceValid) {
        const u = (phase + (3 - s) * 0.25) % 1;
        const inv = 1 - u;
        const px = inv * inv * x1 + 2 * inv * u * cx + u * u * x2;
        const py = inv * inv * y1 + 2 * inv * u * cy + u * u * y2;
        ctx.fillStyle = PALETTE.ivory;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function interpRailRect(slotFloat) {
    const clamped = Math.max(-0.18, Math.min(3.18, slotFloat));
    const base = geom.railCards[0];
    const step = geom.railCards[1].x - geom.railCards[0].x;
    return {
      x: base.x + clamped * step,
      y: base.y,
      w: base.w,
      h: base.h,
    };
  }

  function drawRailCard(ctx, modId, ev, sc, selectedId) {
    const slotIdx = ev.order.indexOf(modId);
    const sFloat = animSlot[modId] ?? slotIdx;
    const r = interpRailRect(sFloat);
    const isDrag = drag.active && drag.moved && drag.modId === modId;
    const isSel = selectedId === modId;
    const isMatch = ev.slotMatches[slotIdx];
    const mod = sc.modules[modId];
    const lift = isDrag ? -6 : 0;

    ctx.save();
    if (isDrag) {
      ctx.shadowColor = "rgba(0, 8, 45, 0.55)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
    }

    ctx.fillStyle = isDrag
      ? "#0B30CC"
      : isSel
        ? "#0726B0"
        : isMatch
          ? "#041E96"
          : "rgba(1, 22, 118, 0.94)";
    ctx.fillRect(r.x, r.y + lift, r.w, r.h);

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = isDrag || isSel
      ? PALETTE.chartreuse
      : isMatch
        ? PALETTE.ivory
        : PALETTE.coralDark;
    ctx.lineWidth = isDrag || isSel ? 2.2 : 1.4;
    if (!isMatch && !isDrag) ctx.setLineDash([5, 4]);
    ctx.strokeRect(r.x + 0.5, r.y + lift + 0.5, r.w - 1, r.h - 1);
    ctx.setLineDash([]);

    // 左上角位次标签 01 / 02 / 03 / 04
    ctx.fillStyle = isSel || isDrag ? PALETTE.chartreuse : PALETTE.ice;
    ctx.font = `600 10.5px "IBM Plex Mono", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`0${slotIdx + 1}`, r.x + 7, r.y + lift + 6);

    // 右上角微拖动手柄纹（≡ 小点，暗示可左右拖动）
    ctx.fillStyle = "rgba(253, 255, 243, 0.42)";
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        ctx.fillRect(r.x + r.w - 12 + dx * 4, r.y + lift + 7 + dy * 3.5, 2, 2);
      }
    }

    // 几何图符
    const iconR = geom.shortH ? 8 : geom.compact ? 9.5 : 12;
    const iconCy = r.y + lift + (geom.shortH ? 24 : geom.compact ? 31 : 36);
    drawShapeIcon(ctx, modId, r.x + r.w / 2, iconCy, iconR, PALETTE.chartreuse);

    // 卡片名称
    ctx.fillStyle = PALETTE.ivory;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `700 ${geom.shortH ? 10.5 : geom.compact ? 11 : 13}px "Noto Sans SC", sans-serif`;
    ctx.fillText(mod.name, r.x + r.w / 2, iconCy + iconR + (geom.shortH ? 5 : geom.compact ? 6 : 8), r.w - 10);

    // 副标题
    if (!geom.shortH) {
      ctx.fillStyle = PALETTE.ice;
      ctx.font = `400 ${geom.compact ? 10 : 10.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText(mod.sub, r.x + r.w / 2, iconCy + iconR + (geom.compact ? 22 : 26), r.w - 10);
    }

    ctx.restore();
  }

  /** 绘制「仅 CSS order」模式下的 Tab 键盘焦点错跳折线 */
  function drawFocusOverlay(ctx, ev, phase, still) {
    const trail = ev.focusCheck.trail; // 依次落到的视觉槽位索引
    const cards = geom.railCards;
    ctx.save();
    for (let i = 0; i < trail.length - 1; i++) {
      const a = cards[trail[i]];
      const b = cards[trail[i + 1]];
      const isJump = trail[i + 1] < trail[i] || trail[i + 1] - trail[i] > 1;
      const yBase = a.y + a.h - 14;
      const arcH = isJump ? (i % 2 === 0 ? -38 : -54) : -14;
      const midX = (a.cx + b.cx) / 2;
      const midY = yBase + arcH;

      ctx.strokeStyle = isJump ? PALETTE.coralDark : PALETTE.mintDark;
      ctx.lineWidth = isJump ? 2.4 : 1.6;
      if (isJump) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(a.cx, yBase);
      ctx.quadraticCurveTo(midX, midY, b.cx, yBase);
      ctx.stroke();
      ctx.setLineDash([]);

      const ang = Math.atan2(yBase - midY, b.cx - midX);
      drawArrowHead(ctx, b.cx, yBase, ang, 7.5, isJump ? PALETTE.coralDark : PALETTE.mintDark);

      if (!still && isJump) {
        const u = (phase + i * 0.3) % 1;
        const inv = 1 - u;
        const px = inv * inv * a.cx + 2 * inv * u * midX + u * u * b.cx;
        const py = inv * inv * yBase + 2 * inv * u * midY + u * u * yBase;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 标出 TAB 1 / 2 / 3 / 4 圆徽
    trail.forEach((visSlot, tabIdx) => {
      const c = cards[visSlot];
      const bx = c.cx;
      const by = c.y + c.h - 14;
      ctx.fillStyle = PALETTE.coralFill;
      ctx.fillRect(bx - 21, by - 9, 42, 18);
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 20.5, by - 8.5, 41, 17);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 10px "IBM Plex Mono", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`TAB ${tabIdx + 1}`, bx, by + 0.5);
    });
    ctx.restore();
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();
  syncAnimImmediate();

  const ctrl = loop(canvas, drawFrame);
  return {
    draw: () => ctrl.draw(),
    snap: () => {
      syncAnimImmediate();
      ctrl.draw();
    },
  };
}
