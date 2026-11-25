// 285 分步表单 · 2D Canvas 活体任务切分与认知负荷轨（data-perf-drag）
// 与 model.js 单真源同步：支持横向直拖闸门、点击间隙增删切点、点击字段直达步骤、键盘微调。
import { loop, pixelRatio } from "../../lib/stage.js";
import { DOMAIN_META } from "./model.js";

const TOTAL = 12;

export function mountSlicerCanvas(canvas, { getState, getEval, onCutsChange, onSelectStep, onStatus }) {
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let padX = 18;
  let trackW = 100;

  // 拖动与聚焦态
  let dragging = false;
  let activePointerId = null;
  let dragKind = "move"; // "move" | "create"
  let dragIndex = -1; // 在 cuts 数组里的下标
  let dragFloatSlot = 6; // 连续平滑位置 [1, 11]，确保拖动每一帧都在重绘
  let startClientX = 0;
  let startClientY = 0;
  let movedPx = 0;
  let hoverSlot = -1;
  let hoverGate = -1;
  let focusedGate = 0;
  let introT = 0;
  let dirty = true;

  // 平滑可视化缓冲，拖起来顺滑且停住后零多余绘制
  let displayLoads = new Array(TOTAL).fill(0);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    W = Math.max(260, Math.round(rect.width));
    H = Math.max(92, Math.round(rect.height));
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    padX = W < 440 ? 12 : 20;
    trackW = Math.max(120, W - padX * 2);
    dirty = true;
  }

  function slotToX(slot) {
    return padX + (slot / TOTAL) * trackW;
  }

  function xToSlotFloat(x) {
    return Math.max(0.5, Math.min(TOTAL - 0.5, ((x - padX) / trackW) * TOTAL));
  }

  function clientToLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function pickNearestGate(x, cuts, maxDist) {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < cuts.length; i++) {
      const d = Math.abs(x - slotToX(cuts[i]));
      if (d < bestD) { bestD = d; best = i; }
    }
    return bestD <= maxDist ? best : -1;
  }

  function commitDragSlot(targetSlot) {
    const st = getState();
    const cuts = [...st.cuts];
    const clamped = Math.max(1, Math.min(TOTAL - 1, Math.round(targetSlot)));
    if (dragKind === "move" && dragIndex >= 0 && dragIndex < cuts.length) {
      // 不越过相邻切点，避免吞掉步数
      const lo = dragIndex > 0 ? cuts[dragIndex - 1] + 1 : 1;
      const hi = dragIndex < cuts.length - 1 ? cuts[dragIndex + 1] - 1 : TOTAL - 1;
      const next = Math.max(lo, Math.min(hi, clamped));
      if (cuts[dragIndex] !== next) {
        cuts[dragIndex] = next;
        onCutsChange(cuts, { fromDrag: true });
      }
    } else if (dragKind === "create") {
      if (!cuts.includes(clamped)) {
        cuts.push(clamped);
        cuts.sort((a, b) => a - b);
        dragIndex = cuts.indexOf(clamped);
        dragKind = "move";
        onCutsChange(cuts, { fromDrag: true });
      }
    }
  }

  function beginDrag(localX, localY, clientX, clientY, pointerId) {
    const st = getState();
    const cuts = st.cuts;
    startClientX = clientX;
    startClientY = clientY;
    movedPx = 0;
    activePointerId = pointerId;

    // 优先吸附就近切分闸门；触控/性能拖中心时放宽吸附半径，保证随时拖得动
    const snapRadius = Math.max(28, trackW / TOTAL * 1.45);
    const hit = pickNearestGate(localX, cuts, snapRadius);
    if (hit >= 0) {
      dragging = true;
      dragKind = "move";
      dragIndex = hit;
      focusedGate = hit;
      dragFloatSlot = cuts[hit];
    } else if (cuts.length > 0) {
      // 距离所有闸门都远，但仍记录按下，如果拖起来就抓最近闸门，如果只是轻点就触发增切/选步
      const nearest = pickNearestGate(localX, cuts, Infinity);
      dragging = true;
      dragKind = "move";
      dragIndex = nearest;
      focusedGate = nearest;
      dragFloatSlot = cuts[nearest];
    } else {
      // 1步长墙（无切点）：横拖时实时拉出新切点！
      dragging = true;
      dragKind = "create";
      dragIndex = -1;
      dragFloatSlot = Math.max(1, Math.min(TOTAL - 1, xToSlotFloat(localX)));
    }
    dirty = true;
    ctl.draw();
  }

  function moveDrag(localX, clientX, clientY) {
    if (!dragging) return;
    const dx = clientX - startClientX;
    const dy = clientY - startClientY;
    movedPx = Math.max(movedPx, Math.hypot(dx, dy));
    if (movedPx < 3) return;

    const st = getState();
    const cuts = st.cuts;
    let rawSlot = xToSlotFloat(localX);
    if (dragKind === "move" && dragIndex >= 0 && dragIndex < cuts.length) {
      const lo = (dragIndex > 0 ? cuts[dragIndex - 1] + 0.65 : 0.7);
      const hi = (dragIndex < cuts.length - 1 ? cuts[dragIndex + 1] - 0.65 : TOTAL - 0.7);
      rawSlot = Math.max(lo, Math.min(hi, rawSlot));
    } else {
      rawSlot = Math.max(0.8, Math.min(TOTAL - 0.8, rawSlot));
    }
    dragFloatSlot = rawSlot;
    commitDragSlot(rawSlot);
    dirty = true;
    ctl.draw();
  }

  function endDrag(localX, localY) {
    if (!dragging) return;
    const wasTap = movedPx < 7;
    const st = getState();
    const ev = getEval();
    dragging = false;
    activePointerId = null;

    if (wasTap) {
      // 轻点交互：点在已有闸门附近 → 移除该切点；点在两字段间隙 → 增设切点；点在字段中部 → 跳转到对应步骤
      const hitGate = pickNearestGate(localX, st.cuts, 15);
      if (hitGate >= 0 && localY <= H - 8) {
        const next = st.cuts.filter((_, i) => i !== hitGate);
        onCutsChange(next, { fromTap: true });
        if (onStatus) onStatus(`已合并第 ${hitGate + 1} 道切点，现为 ${next.length + 1} 步`);
      } else {
        const raw = xToSlotFloat(localX);
        const nearestGap = Math.round(raw);
        const distToGap = Math.abs(raw - nearestGap);
        if (nearestGap >= 1 && nearestGap <= TOTAL - 1 && distToGap < 0.28 && !st.cuts.includes(nearestGap)) {
          const next = [...st.cuts, nearestGap].sort((a, b) => a - b);
          onCutsChange(next, { fromTap: true });
          if (onStatus) onStatus(`在第 ${nearestGap} 项后增设切点，现为 ${next.length + 1} 步`);
        } else {
          // 跳转到被点中的字段所在步骤
          const fIdx = Math.max(0, Math.min(TOTAL - 1, Math.floor(raw)));
          const targetStep = ev.steps.find((s) => fIdx >= s.start && fIdx < s.end);
          if (targetStep && onSelectStep) onSelectStep(targetStep.index);
        }
      }
    }
    dirty = true;
    ctl.draw();
  }

  // Pointer events（桌面 + 现代触控）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const { x, y } = clientToLocal(e.clientX, e.clientY);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    beginDrag(x, y, e.clientX, e.clientY, e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = clientToLocal(e.clientX, e.clientY);
    if (dragging && (activePointerId === null || e.pointerId === activePointerId)) {
      moveDrag(x, e.clientX, e.clientY);
      return;
    }
    // 悬停高亮反馈
    const st = getState();
    const g = pickNearestGate(x, st.cuts, 16);
    const raw = xToSlotFloat(x);
    const gap = Math.round(raw);
    const nextHoverGap = (g < 0 && gap >= 1 && gap <= TOTAL - 1 && Math.abs(raw - gap) < 0.25) ? gap : -1;
    if (g !== hoverGate || nextHoverGap !== hoverSlot) {
      hoverGate = g;
      hoverSlot = nextHoverGap;
      canvas.style.cursor = g >= 0 ? "ew-resize" : nextHoverGap >= 0 ? "cell" : "pointer";
      dirty = true;
      ctl.draw();
    }
  });

  const finishPointer = (e) => {
    if (!dragging) return;
    const { x, y } = clientToLocal(e.clientX, e.clientY);
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    endDrag(x, y);
  };
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);
  canvas.addEventListener("pointerleave", () => {
    if (!dragging && (hoverGate !== -1 || hoverSlot !== -1)) {
      hoverGate = -1;
      hoverSlot = -1;
      dirty = true;
      ctl.draw();
    }
  });

  // Touch events 兜底（确保 CDP Input.dispatchTouchEvent 每一帧都精准触发）
  let touchActive = false;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t = e.touches[0];
    const { x, y } = clientToLocal(t.clientX, t.clientY);
    touchActive = true;
    beginDrag(x, y, t.clientX, t.clientY, null);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchActive || !e.touches.length) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - startClientX);
    const dy = Math.abs(t.clientY - startClientY);
    // 仅横向拖动时阻止默认滚动，竖向滑仍顺畅翻页
    if (dx > dy && dx > 4 && e.cancelable) e.preventDefault();
    const { x } = clientToLocal(t.clientX, t.clientY);
    moveDrag(x, t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (!touchActive) return;
    touchActive = false;
    const t = e.changedTouches[0];
    if (t) {
      const { x, y } = clientToLocal(t.clientX, t.clientY);
      endDrag(x, y);
    } else {
      dragging = false;
    }
  }, { passive: true });

  // 键盘操作：左右键挪动当前聚焦闸门，Tab/上下切换闸门
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    const cuts = [...st.cuts];
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      if (cuts.length === 0) {
        onCutsChange([delta > 0 ? 4 : 3], { fromKey: true });
        focusedGate = 0;
        return;
      }
      const idx = Math.max(0, Math.min(cuts.length - 1, focusedGate));
      const lo = idx > 0 ? cuts[idx - 1] + 1 : 1;
      const hi = idx < cuts.length - 1 ? cuts[idx + 1] - 1 : TOTAL - 1;
      const next = Math.max(lo, Math.min(hi, cuts[idx] + delta));
      if (next !== cuts[idx]) {
        cuts[idx] = next;
        onCutsChange(cuts, { fromKey: true });
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!cuts.length) return;
      e.preventDefault();
      focusedGate = (focusedGate + (e.key === "ArrowDown" ? 1 : cuts.length - 1)) % cuts.length;
      dirty = true;
      ctl.draw();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // 快速切换切点：若少于 3 个切点则补一个语义切点，否则复位
      const ideal = getEval().scenario.idealCuts;
      const missing = ideal.find((c) => !cuts.includes(c));
      if (missing !== undefined) {
        onCutsChange([...cuts, missing].sort((a, b) => a - b), { fromKey: true });
      }
    }
  });

  function roundRect(x, y, w, h, r) {
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

  function render(t, dt, { still }) {
    if (!W) resize();
    const st = getState();
    const ev = getEval();
    const isIntro = !still && introT < 1;
    if (still) introT = 1;
    else if (introT < 1) introT = Math.min(1, introT + (dt || 0.016) * 1.9);

    // 计算每个槽位对应所在步骤的认知负荷（用于柔和波形）
    let moving = isIntro || dragging;
    for (let i = 0; i < TOTAL; i++) {
      const step = ev.steps.find((s) => i >= s.start && i < s.end) || ev.steps[0];
      const target = Math.min(1, step.loadScore / 8.2);
      if (still) {
        displayLoads[i] = target;
      } else {
        const diff = target - displayLoads[i];
        if (Math.abs(diff) > 0.004) {
          displayLoads[i] += diff * Math.min(1, (dt || 0.016) * 12);
          moving = true;
        } else {
          displayLoads[i] = target;
        }
      }
    }

    if (!dirty && !moving) return;
    dirty = false;

    const ease = 1 - Math.pow(1 - introT, 3);
    const compact = W < 540;
    const waveTop = compact ? 20 : 22;
    const waveBot = compact ? 44 : 49;
    const chipTop = compact ? 52 : 58;
    const chipH = compact ? 30 : 34;
    const slotW = trackW / TOTAL;

    ctx.clearRect(0, 0, W, H);

    // 1. 轻柔暖纸底舱
    roundRect(1, 1, W - 2, H - 2, 12);
    ctx.fillStyle = "#FFFBF8";
    ctx.fill();
    ctx.strokeStyle = "#EFE0D8";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. 认知负荷舒适阈值虚线
    const safeY = waveBot - (waveBot - waveTop) * 0.62;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(94, 25, 73, 0.24)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, safeY);
    ctx.lineTo(padX + trackW, safeY);
    ctx.stroke();
    ctx.restore();

    // 3. 按步底色与顶沿波形
    for (const s of ev.steps) {
      const x1 = slotToX(s.start) + 2;
      const x2 = slotToX(s.end) - 2;
      const sw = Math.max(8, x2 - x1);
      const isActive = s.index === st.currentStep;
      const isBad = s.count >= 6 || (s.domains.length > 1 && !(s.index === ev.steps.length - 1 && s.domains[0] === 2 && s.domains[1] === 3 && s.count <= 5));

      // 步级底框（高亮当前步或错态步）
      roundRect(x1, chipTop - 5, sw, chipH + 10, 9);
      if (isActive) {
        ctx.fillStyle = isBad ? "rgba(180, 35, 44, 0.08)" : "rgba(244, 115, 65, 0.11)";
        ctx.fill();
        ctx.strokeStyle = isBad ? "rgba(180, 35, 44, 0.45)" : "rgba(244, 115, 65, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (isBad) {
        ctx.fillStyle = "rgba(180, 35, 44, 0.045)";
        ctx.fill();
      }

      // 该步的连续负荷山丘（与 displayLoads 同步）
      const avgLoad = displayLoads[s.start] * ease;
      const peakY = waveBot - Math.max(4, avgLoad * (waveBot - waveTop));
      ctx.beginPath();
      ctx.moveTo(x1 + 2, waveBot);
      const midX = (x1 + x2) / 2;
      ctx.quadraticCurveTo(x1 + sw * 0.18, peakY, midX, peakY);
      ctx.quadraticCurveTo(x2 - sw * 0.18, peakY, x2 - 2, waveBot);
      ctx.closePath();
      ctx.fillStyle = isBad
        ? "rgba(180, 35, 44, 0.22)"
        : isActive
          ? "rgba(244, 115, 65, 0.26)"
          : "rgba(94, 25, 73, 0.13)";
      ctx.fill();
      ctx.strokeStyle = isBad ? "#B4232C" : isActive ? "#D44E20" : "#5E1949";
      ctx.lineWidth = isActive ? 2 : 1.4;
      ctx.beginPath();
      ctx.moveTo(x1 + 2, waveBot - 0.5);
      ctx.quadraticCurveTo(x1 + sw * 0.18, peakY, midX, peakY);
      ctx.quadraticCurveTo(x2 - sw * 0.18, peakY, x2 - 2, waveBot - 0.5);
      ctx.stroke();

      // 步级小标签（顶沿留出完整空间，绝不裁顶）
      if (sw >= 34) {
        ctx.font = `700 ${compact ? 10 : 10.5}px "Sora", "Noto Sans SC", sans-serif`;
        ctx.fillStyle = isBad ? "#A61C24" : isActive ? "#C44518" : "#5E1949";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const tag = compact ? `S${s.index + 1}·${s.count}` : `第${s.index + 1}步 · ${s.count}项`;
        ctx.fillText(tag, midX, Math.max(15, Math.min(waveBot - 3, peakY - 3)));
      }
    }

    // 舒适线右端带暖纸底垫的小标，避免和波形重叠
    if (!compact) {
      const lbl = "舒适线";
      ctx.font = `600 10px "Sora", "Noto Sans SC", sans-serif`;
      const lw = ctx.measureText(lbl).width + 10;
      roundRect(padX + trackW - lw, safeY - 7, lw, 14, 7);
      ctx.fillStyle = "#FFFBF8";
      ctx.fill();
      ctx.fillStyle = "#704C60";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, padX + trackW - lw / 2, safeY + 0.5);
    }

    // 4. 绘制 12 个有序字段胶囊（按 4 个语义域着色）
    const fields = ev.scenario.fields;
    for (let i = 0; i < TOTAL; i++) {
      const f = fields[i];
      const dm = DOMAIN_META[f.domain];
      const gap = compact ? 2.5 : 4;
      const cx = slotToX(i) + gap;
      const cw = Math.max(10, slotW - gap * 2);
      const cy = chipTop + (1 - ease) * 6;

      roundRect(cx, cy, cw, chipH, 7);
      ctx.fillStyle = dm.tint;
      ctx.fill();
      ctx.strokeStyle = dm.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 顶部语义色标条
      roundRect(cx + 3, cy + 3, Math.max(4, cw - 6), 3, 1.5);
      ctx.fillStyle = dm.color;
      ctx.fill();

      // 字段文字（宽屏写简称，窄屏写序号+首字）
      ctx.fillStyle = "#340426";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const text = cw >= 58 ? f.label.slice(0, 4) : cw >= 36 ? f.label.slice(0, 2) : String(i + 1);
      ctx.font = `${cw >= 40 ? 600 : 700} ${compact ? 10 : 11}px "Noto Sans SC", "Sora", sans-serif`;
      ctx.fillText(text, cx + cw / 2, cy + chipH * 0.62);
    }

    // 5. 悬停空隙预览「+ 切点」
    if (hoverSlot >= 1 && hoverSlot <= TOTAL - 1 && !dragging) {
      const gx = slotToX(hoverSlot);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#D44E20";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, waveTop + 4);
      ctx.lineTo(gx, chipTop + chipH + 8);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(gx, chipTop + chipH / 2, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF0E7";
      ctx.fill();
      ctx.strokeStyle = "#D44E20";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#C44518";
      ctx.font = `700 12px "Sora", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", gx, chipTop + chipH / 2 + 0.5);
    }

    // 6. 绘制所有分步切分闸门（含拖动中连续跟手的活体闸门）
    const cuts = ev.cuts;
    for (let i = 0; i < cuts.length; i++) {
      const isThisDrag = dragging && dragKind === "move" && dragIndex === i;
      const slotPos = isThisDrag ? dragFloatSlot : cuts[i];
      const gx = slotToX(slotPos);
      const isHover = hoverGate === i || (document.activeElement === canvas && focusedGate === i);

      // 判断这道切点是否正好切在同语义域内部（错切标红）
      const leftDom = fields[Math.max(0, Math.min(TOTAL - 1, cuts[i] - 1))].domain;
      const rightDom = fields[Math.max(0, Math.min(TOTAL - 1, cuts[i]))].domain;
      const splitsSameDomain = leftDom === rightDom && ev.tornCount > 0;
      const gateColor = splitsSameDomain ? "#B4232C" : isThisDrag ? "#D44E20" : "#5E1949";

      // 竖向切分刃
      ctx.strokeStyle = gateColor;
      ctx.lineWidth = isThisDrag ? 3 : isHover ? 2.5 : 2;
      ctx.beginPath();
      ctx.moveTo(gx, waveTop + 2);
      ctx.lineTo(gx, H - 6);
      ctx.stroke();

      // 圆形手柄胶囊（明确指示可左右横拖）
      const handleY = chipTop + chipH / 2;
      const r = isThisDrag ? 13 : isHover ? 12 : 11;
      ctx.beginPath();
      ctx.arc(gx, handleY, r, 0, Math.PI * 2);
      ctx.fillStyle = gateColor;
      ctx.fill();
      ctx.strokeStyle = "#FEFEFC";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 左右双向箭头符号（带 Noto Sans SC 兜底，确保使用内嵌字形）
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${isThisDrag ? 11 : 10}px "Sora", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", gx, handleY + 0.5);
    }

    // 7. 底部操作微提示（仅当非拖动时或拖动中显示实时卡尺）
    if (dragging) {
      const gx = slotToX(dragFloatSlot);
      const snapped = Math.max(1, Math.min(TOTAL - 1, Math.round(dragFloatSlot)));
      const badgeText = `切点 ${snapped}｜前 ${snapped} 后 ${TOTAL - snapped}`;
      const bw = compact ? 104 : 116;
      const bx = Math.max(padX, Math.min(W - padX - bw, gx - bw / 2));
      const by = H - 22;
      roundRect(bx, by, bw, 18, 9);
      ctx.fillStyle = "#340426";
      ctx.fill();
      ctx.fillStyle = "#FFF3EE";
      ctx.font = `600 10px "Sora", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, bx + bw / 2, by + 9.5);
    } else if (cuts.length === 0) {
      // 1步长墙状态下的直拖提示条
      const bw = Math.min(W - 24, 210);
      const bx = (W - bw) / 2;
      const by = H - 23;
      roundRect(bx, by, bw, 19, 9.5);
      ctx.fillStyle = "#B4232C";
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 10.5px "Noto Sans SC", "Sora", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("← 横向拖动或点击间隙切出步骤 →", W / 2, by + 10);
    }
  }

  const ro = new ResizeObserver(() => { resize(); ctl.draw(); });
  ro.observe(canvas);
  const ctl = loop(canvas, render);
  resize();

  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
  };
}
