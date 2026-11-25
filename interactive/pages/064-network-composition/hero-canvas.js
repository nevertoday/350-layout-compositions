// 064 网络构图 — 开场活体环网 2D 画布与无障碍圆形触控节点引擎
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, ROLE_META } from "./palette.js";
import {
  THEMES,
  computeLayout,
  cycleEdgeKind,
  evaluateNetwork,
  toggleEdgeByBrush,
} from "./model.js";

function distPointToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-6) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function mountHeroStage({
  stageEl,
  canvas,
  coreEl,
  handlesEl,
  state,
  onChange,
}) {
  const ctx = canvas.getContext("2d");
  let width = 960;
  let height = 460;
  let dpr = pixelRatio(2);
  let hoveredEdge = -1;
  let hoveredNode = null;
  let dragging = null; // { id, pointerId, startX, startY, moved, offsetX, offsetY }
  let intro = reducedMotion.matches ? 1 : 0;
  let lastEval = null;

  // 为 7 枚外围卫星建立真实可聚焦、可键盘移动、可触控直拖的透明圆按钮覆盖层
  // 其中「信息源」节点带有 data-perf-drag，让 perf.mjs 与触屏直接抓住真圆节点横拖解结！
  const handleMap = new Map();
  const satIds = ["source", "user", "platform", "feedback", "data", "channel", "content"];
  for (const id of satIds) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "node-handle";
    btn.dataset.nodeId = id;
    if (id === "source") btn.setAttribute("data-perf-drag", "");
    handlesEl.appendChild(btn);
    handleMap.set(id, btn);
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    width = Math.max(280, Math.round(rect.width));
    height = Math.max(260, Math.round(rect.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    syncDomPositions();
  }

  function clampNorm(x, y, layout) {
    const spanX = Math.max(1, width - layout.padX * 2);
    const spanY = Math.max(1, height - layout.padY * 2);
    const u = Math.max(0.02, Math.min(0.98, (x - layout.padX) / spanX));
    const v = Math.max(0.03, Math.min(0.97, (y - layout.padY) / spanY));
    return { u, v };
  }

  function avoidCoreCenter(u, v, layout) {
    const spanX = Math.max(1, width - layout.padX * 2);
    const spanY = Math.max(1, height - layout.padY * 2);
    let px = layout.padX + u * spanX;
    let py = layout.padY + v * spanY;
    const c = layout.byId.core;
    const minD = c.r + layout.satBase * 1.1;
    const dx = px - c.x;
    const dy = py - c.y;
    const d = Math.hypot(dx, dy);
    if (d < minD) {
      const ang = d < 1 ? -Math.PI / 4 : Math.atan2(dy, dx);
      px = c.x + Math.cos(ang) * minD;
      py = c.y + Math.sin(ang) * minD;
    }
    return clampNorm(px, py, layout);
  }

  function syncDomPositions() {
    const ev = evaluateNetwork(state, width, height);
    lastEval = ev;
    const { byId } = ev.layout;
    const theme = THEMES[state.theme];

    // 同步中央深海蓝大圆 DOM（承载真正的 semantic <h1>，对比度 >14:1）
    const c = byId.core;
    coreEl.style.width = `${Math.round(c.r * 2)}px`;
    coreEl.style.height = `${Math.round(c.r * 2)}px`;
    coreEl.style.left = `${c.x.toFixed(1)}px`;
    coreEl.style.top = `${c.y.toFixed(1)}px`;
    coreEl.classList.toggle("is-outage", state.hubOutage);
    coreEl.classList.toggle("is-selected", state.selectedNode === "core");
    coreEl.classList.toggle("is-compact", c.r < 62);

    // 同步 7 枚外围圆节点按钮位置与无障碍标签
    for (const id of satIds) {
      const n = byId[id];
      const btn = handleMap.get(id);
      const hitSize = Math.max(46, Math.round(n.r * 2));
      btn.style.width = `${hitSize}px`;
      btn.style.height = `${hitSize}px`;
      btn.style.left = `${n.x.toFixed(1)}px`;
      btn.style.top = `${n.y.toFixed(1)}px`;
      const meta = theme.nodes[id];
      btn.setAttribute(
        "aria-label",
        `${meta.label}节点（${ROLE_META[n.role].zh}，已连 ${n.degree} 条线，拖动改位，回车或点击连线）`
      );
      btn.setAttribute("aria-pressed", state.selectedNode === id ? "true" : "false");
    }
    return ev;
  }

  function stageCoords(e) {
    const rect = stageEl.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return { x: pt.clientX - rect.left, y: pt.clientY - rect.top };
  }

  function findHitEdge(px, py, layout) {
    let best = -1;
    let bestDist = 13;
    const { byId } = layout;
    state.edges.forEach((edge, idx) => {
      const a = byId[edge.a];
      const b = byId[edge.b];
      const d = distPointToSeg(px, py, a.x, a.y, b.x, b.y);
      // 避开端点圆内部
      if (Math.hypot(px - a.x, py - a.y) < a.r + 6) return;
      if (Math.hypot(px - b.x, py - b.y) < b.r + 6) return;
      if (d < bestDist) {
        bestDist = d;
        best = idx;
      }
    });
    return best;
  }

  function handleNodeTap(id) {
    if (!state.selectedNode) {
      state.selectedNode = id;
    } else if (state.selectedNode === id) {
      state.selectedNode = null;
    } else {
      toggleEdgeByBrush(state, state.selectedNode, id);
      state.selectedNode = null;
      state.pulseBoost = 1;
    }
    notify();
  }

  // 绑定卫星圆节点的 Pointer + Touch + Keyboard 交互
  for (const id of satIds) {
    const btn = handleMap.get(id);

    // 兼容 perf.mjs 的原始 TouchEvent 派发（Input.dispatchTouchEvent）与现代 PointerEvent
    let touchActive = null;

    btn.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return; // touch 走下方专属 touch 事件避免双触发
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      const pt = stageCoords(e);
      const layout = computeLayout(state, width, height);
      const n = layout.byId[id];
      dragging = {
        id,
        pointerId: e.pointerId,
        startX: pt.x,
        startY: pt.y,
        offsetX: n.x - pt.x,
        offsetY: n.y - pt.y,
        moved: false,
      };
      hoveredNode = id;
    });

    btn.addEventListener("pointermove", (e) => {
      if (!dragging || dragging.id !== id || dragging.pointerId !== e.pointerId) return;
      const pt = stageCoords(e);
      if (!dragging.moved && Math.hypot(pt.x - dragging.startX, pt.y - dragging.startY) > 5) {
        dragging.moved = true;
        state.activePreset = "custom";
      }
      if (dragging.moved) {
        const layout = computeLayout(state, width, height);
        const next = avoidCoreCenter(
          clampNorm(pt.x + dragging.offsetX, pt.y + dragging.offsetY, layout).u,
          clampNorm(pt.x + dragging.offsetX, pt.y + dragging.offsetY, layout).v,
          layout
        );
        state.positions[id] = next;
        notify();
      }
    });

    const endPointer = (e) => {
      if (!dragging || dragging.id !== id || dragging.pointerId !== e.pointerId) return;
      const wasMoved = dragging.moved;
      dragging = null;
      if (!wasMoved) handleNodeTap(id);
    };
    btn.addEventListener("pointerup", endPointer);
    btn.addEventListener("pointercancel", () => { dragging = null; });
    btn.addEventListener("pointerenter", () => { hoveredNode = id; drawNow(); });
    btn.addEventListener("pointerleave", () => { if (hoveredNode === id) hoveredNode = null; drawNow(); });

    // Touch 事件（perf.mjs 与真机触屏零延迟直拖，仅在按住节点圆时拦截默认滚动）
    btn.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const pt = stageCoords(e);
      const layout = computeLayout(state, width, height);
      const n = layout.byId[id];
      touchActive = {
        id,
        startX: pt.x,
        startY: pt.y,
        offsetX: n.x - pt.x,
        offsetY: n.y - pt.y,
        moved: false,
      };
      hoveredNode = id;
    }, { passive: false });

    btn.addEventListener("touchmove", (e) => {
      if (!touchActive || e.touches.length !== 1) return;
      e.preventDefault();
      const pt = stageCoords(e);
      if (!touchActive.moved && Math.hypot(pt.x - touchActive.startX, pt.y - touchActive.startY) > 4) {
        touchActive.moved = true;
        state.activePreset = "custom";
      }
      if (touchActive.moved) {
        const layout = computeLayout(state, width, height);
        const norm = clampNorm(pt.x + touchActive.offsetX, pt.y + touchActive.offsetY, layout);
        state.positions[id] = avoidCoreCenter(norm.u, norm.v, layout);
        notify();
      }
    }, { passive: false });

    btn.addEventListener("touchend", () => {
      if (!touchActive) return;
      const wasMoved = touchActive.moved;
      touchActive = null;
      hoveredNode = null;
      if (!wasMoved) handleNodeTap(id);
    });
    btn.addEventListener("touchcancel", () => { touchActive = null; hoveredNode = null; });

    // 键盘操作：方向键微移节点、Enter/Space 选中或织入连线、Esc 取消
    btn.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.08 : 0.035;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const layout = computeLayout(state, width, height);
        const cur = state.positions[id];
        const nu = cur.u + (e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0);
        const nv = cur.v + (e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0);
        state.positions[id] = avoidCoreCenter(Math.max(0.03, Math.min(0.97, nu)), Math.max(0.04, Math.min(0.96, nv)), layout);
        state.activePreset = "custom";
        notify();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNodeTap(id);
      } else if (e.key === "Escape") {
        state.selectedNode = null;
        notify();
      }
    });
  }

  // 点击中心深海蓝大圆：若已有选中外围节点则切换与中心的连线；否则选中中心（双击或按按钮模拟中心断电）
  coreEl.addEventListener("click", () => {
    handleNodeTap("core");
  });

  // 在画布空白处点击连线：直接循环切换 实线 → 虚线 → 断开
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) return;
    const pt = stageCoords(e);
    const layout = computeLayout(state, width, height);
    const idx = findHitEdge(pt.x, pt.y, layout);
    if (idx !== hoveredEdge) {
      hoveredEdge = idx;
      canvas.style.cursor = idx >= 0 ? "pointer" : "default";
      drawNow();
    }
  });

  canvas.addEventListener("pointerleave", () => {
    if (hoveredEdge !== -1) {
      hoveredEdge = -1;
      canvas.style.cursor = "default";
      drawNow();
    }
  });

  canvas.addEventListener("click", (e) => {
    const pt = stageCoords(e);
    const layout = computeLayout(state, width, height);
    const idx = findHitEdge(pt.x, pt.y, layout);
    if (idx >= 0) {
      cycleEdgeKind(state, idx);
      state.selectedNode = null;
      state.pulseBoost = 0.8;
      notify();
    } else if (state.selectedNode) {
      state.selectedNode = null;
      notify();
    }
  });

  function drawPosterMotifs() {
    // 复刻 064 原海报四角装饰点阵、左缘浅灰半圆与右下深海蓝波浪
    const compact = width < 520;
    const m = compact ? 12 : 22;

    // 1. 左上 3×3 三色圆点阵（深蓝/暖灰/珊瑚）
    const tlColors = [
      [PALETTE.navy, PALETTE.stone, PALETTE.stone],
      [PALETTE.navy, PALETTE.coral, PALETTE.coral],
      [PALETTE.stone, PALETTE.stone, PALETTE.stone],
    ];
    const dotR = compact ? 3.2 : 4.6;
    const dotGap = compact ? 11 : 16;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = tlColors[r][c];
        ctx.beginPath();
        ctx.arc(m + c * dotGap, m + r * dotGap, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. 右上三色大圆 + 6×2 细点阵
    const trCols = [PALETTE.navy, PALETTE.coral, PALETTE.stone];
    const trR = compact ? 4 : 5.8;
    const trGap = compact ? 14 : 20;
    trCols.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(width - m - (2 - i) * trGap, m + 2, trR, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!compact) {
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 6; c++) {
          ctx.fillStyle = c < 3 ? PALETTE.coral : PALETTE.stone;
          ctx.beginPath();
          ctx.arc(width - m - (5 - c) * 10, m + 36 + r * 11, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. 左缘浅暖灰半圆 + 3×4 细点阵（紧贴 064 原海报中左下特征）
    const semiR = compact ? 28 : 54;
    ctx.fillStyle = PALETTE.paperSemi;
    ctx.beginPath();
    ctx.arc(0, height * 0.80, semiR, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    if (!compact) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = c === 2 ? (r < 2 ? PALETTE.coral : PALETTE.stone) : PALETTE.navy;
          ctx.beginPath();
          ctx.arc(16 + c * 11, height * 0.80 - 18 + r * 11, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. 右下深海蓝双峰波浪记号（呼应原海报「流动」）
    const wx = width - (compact ? 42 : 66);
    const wy = height - (compact ? 18 : 26);
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = compact ? 2 : 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.bezierCurveTo(wx + 7, wy - 7, wx + 13, wy + 7, wx + 20, wy);
    ctx.bezierCurveTo(wx + 27, wy - 7, wx + 33, wy + 7, wx + 40, wy);
    ctx.stroke();
  }

  function drawFrame(t, dt, { still }) {
    if (still) intro = 1;
    else if (intro < 1) intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.45);
    if (state.pulseBoost > 0 && !still) {
      state.pulseBoost = Math.max(0, state.pulseBoost - dt * 1.4);
    }

    const ev = lastEval || syncDomPositions();
    const { nodes, byId } = ev.layout;
    const theme = THEMES[state.theme];
    const compact = width < 520;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. 宣纸底色与极淡拓扑参考同心虚环（帮眼睛感知环网轨道，不抢戏）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, width, height);

    const cNode = byId.core;
    ctx.save();
    ctx.strokeStyle = "rgba(6, 33, 62, 0.065)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(cNode.x, cNode.y, width * 0.34, height * 0.37, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawPosterMotifs();

    // 2. 绘制所有连线（主连实线 / 次连虚线 / 断电失效边 / 悬停高亮 / 穿心预警）
    const easeIntro = 1 - Math.pow(1 - intro, 3);
    const piercedSet = new Set(ev.corePierced);

    state.edges.forEach((edge, idx) => {
      const a = byId[edge.a];
      const b = byId[edge.b];
      const involvesCore = edge.a === "core" || edge.b === "core";
      const offline = state.hubOutage && involvesCore;
      const isHovered = idx === hoveredEdge;
      const isPierced = piercedSet.has(idx);

      const ex = a.x + (b.x - a.x) * easeIntro;
      const ey = a.y + (b.y - a.y) * easeIntro;

      ctx.save();
      if (offline) {
        ctx.strokeStyle = "rgba(6, 33, 62, 0.16)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 7]);
      } else if (isPierced) {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = edge.kind === "solid" ? 2.6 : 1.8;
        if (edge.kind === "dashed") ctx.setLineDash([6, 5]);
      } else if (edge.kind === "solid") {
        ctx.strokeStyle = isHovered ? PALETTE.coralBright : PALETTE.navy;
        ctx.lineWidth = isHovered ? 3.2 : 2.15;
      } else {
        ctx.strokeStyle = isHovered ? PALETTE.coralBright : "rgba(6, 33, 62, 0.56)";
        ctx.lineWidth = isHovered ? 2.6 : 1.45;
        ctx.setLineDash([7, 6]);
      }

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();

      // 原海报特征：每条有效连接上的一枚静态中继小圆点（海军蓝或珊瑚橘）+ 动态脉流点
      if (!offline && easeIntro > 0.72) {
        const midT = 0.5;
        const mx = a.x + (b.x - a.x) * midT;
        const my = a.y + (b.y - a.y) * midT;
        const relayColor = idx % 2 === 0 ? PALETTE.coral : PALETTE.navy;

        // 当流向开启时绘制滑行脉冲点；减动效下静止停在中继位置
        if (state.flowOn) {
          const speed = edge.kind === "solid" ? 0.34 : 0.22;
          const phase = still ? 0.5 : (t * speed + idx * 0.19) % 1;
          const px = a.x + (b.x - a.x) * phase;
          const py = a.y + (b.y - a.y) * phase;
          const pr = (edge.kind === "solid" ? 4.8 : 3.8) + state.pulseBoost * 1.4;

          ctx.save();
          ctx.fillStyle = PALETTE.paper;
          ctx.beginPath();
          ctx.arc(px, py, pr + 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = ev.checks.flow ? (edge.kind === "solid" ? PALETTE.coral : PALETTE.navy) : relayColor;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = PALETTE.stone;
          ctx.beginPath();
          ctx.arc(mx, my, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    });

    // 3. 实测交叉标记（亮珊瑚红 × 徽章，直观呼应 Purchase 1997）
    if (ev.crossings.length > 0 && easeIntro > 0.8) {
      for (const hit of ev.crossings) {
        ctx.save();
        ctx.fillStyle = PALETTE.danger;
        ctx.beginPath();
        ctx.arc(hit.x, hit.y, compact ? 7.5 : 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.paper;
        ctx.lineWidth = 1.9;
        ctx.lineCap = "round";
        const s = compact ? 3 : 3.6;
        ctx.beginPath();
        ctx.moveTo(hit.x - s, hit.y - s);
        ctx.lineTo(hit.x + s, hit.y + s);
        ctx.moveTo(hit.x + s, hit.y - s);
        ctx.lineTo(hit.x - s, hit.y + s);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. 中心枢纽断电外环提示（真实 <h1> 在 DOM 圆形上，这里只画外圈状态光环）
    ctx.save();
    if (state.hubOutage) {
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(cNode.x, cNode.y, cNode.r + 7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (state.selectedNode === "core") {
      ctx.strokeStyle = PALETTE.coral;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cNode.x, cNode.y, cNode.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 5. 绘制 7 枚卫星圆形节点（完全正圆，深蓝/珊瑚/暖石灰精确复刻 064 原海报）
    for (const n of nodes) {
      if (n.fixed) continue;
      const role = ROLE_META[n.role];
      const meta = theme.nodes[n.id];
      const isSelected = state.selectedNode === n.id;
      const isHovered = hoveredNode === n.id;
      const isIsolated = ev.isolatedIds.includes(n.id);
      const isUnpowered = state.hubOutage && !ev.poweredSet.has(n.id);
      const r = n.r * (0.35 + 0.65 * easeIntro);

      ctx.save();

      // 孤岛警报虚线圈
      if (isIsolated) {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 选中或悬停圆环
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? PALETTE.coralBright : PALETTE.navy;
        ctx.lineWidth = isSelected ? 3 : 1.8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 主圆填充
      ctx.fillStyle = isUnpowered ? "#DDD7CE" : role.fill;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();

      if (isUnpowered) {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 节点标题与副标（测量文字宽度确保永不贴边或溢出圆外）
      const titleSize = compact ? Math.max(12, Math.round(r * 0.42)) : Math.max(13, Math.round(r * 0.36));
      ctx.fillStyle = isUnpowered ? PALETTE.navy : role.ink;
      ctx.font = `800 ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const showSub = !compact && r >= 36;
      ctx.fillText(meta.label, n.x, showSub ? n.y - 7 : n.y);

      if (showSub) {
        let subSize = Math.max(9, Math.min(10.5, Math.round(r * 0.22)));
        ctx.font = `400 ${subSize}px "Noto Sans SC", sans-serif`;
        const maxSubW = r * 1.68;
        while (subSize > 8 && ctx.measureText(meta.sub).width > maxSubW) {
          subSize -= 0.5;
          ctx.font = `400 ${subSize}px "Noto Sans SC", sans-serif`;
        }
        if (ctx.measureText(meta.sub).width <= r * 1.78) {
          ctx.fillStyle = isUnpowered ? PALETTE.stoneInk : role.subInk;
          ctx.fillText(meta.sub, n.x, n.y + 11);
        }
      }

      // 孤岛小角标（直接告诉用户哪枚节点脱网了）
      if (isIsolated && easeIntro > 0.85) {
        const tagText = "孤岛 · 0 线";
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tagText).width + 12;
        const tx = Math.max(8, Math.min(width - tw - 8, n.x - tw / 2));
        const ty = Math.min(height - 24, n.y + r + 10);
        ctx.fillStyle = PALETTE.danger;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, 20, 4);
        ctx.fill();
        ctx.fillStyle = PALETTE.paper;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, tx + tw / 2, ty + 10);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  const ctrl = loop(stageEl, drawFrame);
  function drawNow() {
    ctrl.draw();
  }

  function notify() {
    const ev = syncDomPositions();
    drawNow();
    onChange(ev);
  }

  const ro = new ResizeObserver(() => {
    resize();
    notify();
  });
  ro.observe(stageEl);
  resize();

  return {
    refresh: notify,
    getEval: () => lastEval || syncDomPositions(),
    destroy: () => ro.disconnect(),
  };
}
