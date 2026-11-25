// 开场活体分叉嫁接台：2D Canvas 高清绘制 + 点击嫁接 + 延伸拉尺（data-perf-drag）+ 视线脉冲流
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import {
  computeModel,
  reparentNode,
  samplePolyline,
} from "./model.js";

export function mountHeroStage({
  canvas,
  stageWrap,
  spanRail,
  spanThumb,
  state,
  onChange,
}) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 400;
  let dpr = pixelRatio(2);
  let model = computeModel(state, cssW, cssH);
  let introProgress = 0; // 0 -> 1 枝干生长开场动效（0.75 秒走完，任意帧都完整好看）
  let pointerPt = null;  // 嫁接预览时的光标位置

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(210, Math.round(rect.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    model = computeModel(state, cssW, cssH);
  }

  function recompute(notify = true) {
    model = computeModel(state, cssW, cssH);
    syncRailUI();
    if (notify) onChange(model);
  }

  function syncRailUI() {
    if (!spanRail || !spanThumb) return;
    const min = 0.28, max = 0.96;
    const pct = Math.max(0, Math.min(1, (state.span - min) / (max - min)));
    spanThumb.style.left = `${(pct * 100).toFixed(2)}%`;
    spanThumb.setAttribute("aria-valuenow", String(model.actualSpanPct));
    spanThumb.setAttribute("aria-valuetext", `当前展幅 ${model.actualSpanPct}%`);
  }

  // 绘制圆角或锐利原海报几何节点
  function drawNode(n, isSelected, isHover, isGraftTarget, growAlpha) {
    ctx.save();
    ctx.globalAlpha = growAlpha;

    // 孤岛警报虚线外环
    if (n.isOrphan) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 选中 / 悬停 / 嫁接目标环
    if (isSelected || isHover || isGraftTarget) {
      ctx.save();
      ctx.strokeStyle = isSelected
        ? PALETTE.ink
        : isGraftTarget
          ? PALETTE.trunkGreen
          : PALETTE.orangeText;
      ctx.lineWidth = isSelected ? 2.6 : 2;
      if (isGraftTarget) ctx.setLineDash([5, 3]);
      ctx.beginPath();
      if (n.shape === "circle") {
        ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
      } else {
        const s = n.r * 2 + 10;
        ctx.rect(n.x - s / 2, n.y - s / 2, s, s);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 主形（原海报：圆 -> 方 -> 圆 -> 方，零多余渐变阴影）
    ctx.fillStyle = n.fill;
    ctx.beginPath();
    if (n.shape === "circle") {
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    } else {
      ctx.rect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    }
    ctx.fill();

    // 轻微内白边确保密集时节点边界依然锐利
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 节点标签（题材为真实内容时显示语义词；抽象模式时显示清晰编号或仅在宽画布/选中时显注）
    const showText = state.theme !== "abstract" || isSelected || isHover || n.isOrphan;
    if (showText) {
      const fontSize = model.compact ? 11 : 12;
      ctx.font = `600 ${fontSize}px "Noto Sans SC", sans-serif`;
      const text = n.isOrphan ? `${n.label}·孤岛` : n.label;
      const tw = ctx.measureText(text).width;
      const padX = 5;
      const boxH = fontSize + 6;
      const onRight = n.nominalLevel === 3 && n.x + n.r + tw + 18 < cssW;
      const tx = onRight
        ? n.x + n.r + 7
        : Math.max(6, Math.min(cssW - tw - padX * 2 - 6, n.x - tw / 2 - padX));
      const ty = onRight
        ? n.y - boxH / 2
        : n.y + n.r + 5 + boxH > cssH - 4
          ? n.y - n.r - boxH - 4
          : n.y + n.r + 4;

      ctx.fillStyle = n.isOrphan ? PALETTE.errBg : "rgba(254, 249, 243, 0.94)";
      ctx.strokeStyle = n.isOrphan ? PALETTE.err : "rgba(11, 13, 12, 0.16)";
      ctx.lineWidth = 1;
      ctx.fillRect(tx, ty, tw + padX * 2, boxH);
      ctx.strokeRect(tx, ty, tw + padX * 2, boxH);

      ctx.fillStyle = n.isOrphan ? PALETTE.err : PALETTE.ink;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(text, tx + padX, ty + boxH / 2 + 0.5);
    } else if (n.r >= 13) {
      // 抽象模式下在节点正中印极简层级短码（对比度严格达标）
      ctx.font = `700 ${Math.max(10, Math.min(12, Math.round(n.r * 0.52)))}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = n.nominalLevel === 2 ? PALETTE.ink : "#FEF9F3";
      ctx.fillText(n.id, n.x, n.y + 0.5);
    }

    ctx.restore();
  }

  // 绘制原海报标志性的黑色短虚线直角引注（仅桌面及足够留白处显示，绝不撞节点）
  function drawPosterCallouts(alpha) {
    if (model.compact || cssW < 640 || !state.showGuides) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const root = model.nodeById.R;
    const b1 = model.nodeById.B1;
    const c3 = model.nodeById.C3;

    // 1. 顶部四列细虚线级标（L1 主干 / L2 二级 / L3 三级 / L4 末端）
    const colLabels = ["L1 主干", "L2 二级", "L3 三级", "L4 末端"];
    ctx.font = `600 11px "Space Grotesk", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < 4; i++) {
      const cx = model.colX[i];
      ctx.save();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = "rgba(8, 97, 66, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 24);
      ctx.lineTo(cx, cssH - 14);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = PALETTE.inkSub;
      ctx.fillText(colLabels[i], cx, 8);
    }

    // 2. 左下「视线从主干向外延伸」小虚线引注（只在左侧有余量时绘）
    if (root.x > 74 && cssH >= 310) {
      const ax = Math.max(18, root.x - root.r - 12);
      const ay = Math.min(cssH - 22, root.y + root.r + 42);
      ctx.strokeStyle = PALETTE.inkLine;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ax, ay - 16);
      ctx.lineTo(root.x - root.r * 0.45, root.y + root.r + 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.inkSub;
      ctx.textAlign = "left";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.fillText("视线起点", Math.max(12, ax - 10), ay - 12);
    }

    // 3. 当右侧展幅留有空白时标注原海报「逐级分叉」直角虚线引注
    if (b1 && c3 && cssW - (model.colX[3] + 32) > 125) {
      const rx = Math.min(cssW - 110, model.colX[3] + 56);
      const ry = cssH * 0.47;
      ctx.strokeStyle = PALETTE.inkLine;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(rx - 10, ry);
      ctx.lineTo(rx - 26, ry);
      ctx.lineTo(rx - 26, ry + 26);
      ctx.lineTo(model.colX[3] + 22, ry + 26);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.ink;
      ctx.textAlign = "left";
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillText("逐级分叉", rx - 4, ry - 6);
      ctx.font = `500 10.5px "Space Grotesk", sans-serif`;
      ctx.fillStyle = PALETTE.inkSub;
      ctx.fillText("STEP BY STEP", rx - 4, ry + 11);
    }

    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(0.016, dt || 0.016) / 0.72);
    }
    const ease = 1 - Math.pow(1 - introProgress, 3);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 暖宣纸画布底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 极细腻的横纵制图角标点阵，绝不抢枝干的戏
    ctx.fillStyle = "rgba(11, 13, 12, 0.06)";
    const step = model.compact ? 28 : 34;
    for (let x = step; x < cssW; x += step) {
      for (let y = step; y < cssH; y += step) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    drawPosterCallouts(ease);

    // 绘制枝干（按层级从左到右在开场动画中顺滑生长）
    const lineW = model.compact ? 3.5 : Math.max(4, Math.min(7, cssW * 0.0055));
    for (const edge of model.edges) {
      const fromNode = model.nodeById[edge.from];
      const levelDelay = fromNode.nominalLevel * 0.16;
      const segP = Math.max(0, Math.min(1, (ease - levelDelay) / 0.52));
      if (segP <= 0.01) continue;

      const isErrEdge = edge.isSkip || !edge.reachable;
      ctx.save();
      ctx.strokeStyle = isErrEdge ? PALETTE.err : PALETTE.trunkGreen;
      ctx.lineWidth = isErrEdge ? lineW * 0.72 : lineW;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (isErrEdge) ctx.setLineDash([7, 5]);

      ctx.beginPath();
      const pts = edge.pts;
      ctx.moveTo(pts[0].x, pts[0].y);
      if (segP >= 0.99) {
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      } else {
        const endPt = samplePolyline(pts, segP);
        // 绘到 segP 所在段
        let total = 0;
        const lens = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
          lens.push(l);
          total += l;
        }
        let targetD = total * segP;
        for (let i = 0; i < lens.length; i++) {
          if (targetD >= lens[i]) {
            ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
            targetD -= lens[i];
          } else {
            ctx.lineTo(endPt.x, endPt.y);
            break;
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 绘制额外回环网边（朱赤弧线 + 箭头，一眼识别已越界成网）
    for (const ex of model.extraEdges) {
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(ex.a.x, ex.a.y);
      ctx.quadraticCurveTo(ex.ctrl.x, ex.ctrl.y, ex.b.x, ex.b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // 箭头标出回头方向
      const dx = ex.b.x - ex.ctrl.x;
      const dy = ex.b.y - ex.ctrl.y;
      const ang = Math.atan2(dy, dx);
      const ax = ex.b.x - Math.cos(ang) * (ex.b.r + 5);
      const ay = ex.b.y - Math.sin(ang) * (ex.b.r + 5);
      ctx.fillStyle = PALETTE.err;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - Math.cos(ang - 0.45) * 10, ay - Math.sin(ang - 0.45) * 10);
      ctx.lineTo(ax - Math.cos(ang + 0.45) * 10, ay - Math.sin(ang + 0.45) * 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 真实视线脉冲流（沿可达枝干从根流向末端；开减少动态效果时画静态方向小三角）
    if (state.showPulse && ease > 0.85) {
      const cycleSec = 2.6;
      const phase = still ? 0.55 : (t % cycleSec) / cycleSec;
      for (const edge of model.edges) {
        if (!edge.reachable) continue;
        const fromN = model.nodeById[edge.from];
        const levelOffset = fromN.nominalLevel * 0.28;
        const localP = still
          ? 0.52
          : (phase - levelOffset + 1) % 1;
        if (!still && (localP < 0.02 || localP > 0.94)) continue;
        const p = samplePolyline(edge.pts, localP);
        ctx.save();
        ctx.fillStyle = edge.isSkip ? PALETTE.err : PALETTE.barOrange;
        ctx.beginPath();
        ctx.arc(p.x, p.y, model.compact ? 3.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.paper;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 嫁接预览虚线（当已选中一个非根节点，且指针正悬停在另一节点或画布上时）
    if (state.selectedId && state.selectedId !== "R" && pointerPt) {
      const sel = model.nodeById[state.selectedId];
      if (sel) {
        ctx.save();
        ctx.strokeStyle = PALETTE.orangeText;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sel.x, sel.y);
        ctx.lineTo(pointerPt.x, pointerPt.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 绘制全部 16 枚几何节点
    for (const n of model.nodes) {
      const nAlpha = Math.max(0.15, Math.min(1, (ease - n.nominalLevel * 0.12) / 0.45));
      const isSelected = state.selectedId === n.id;
      const isHover = state.hoverId === n.id;
      const isGraftTarget = Boolean(state.selectedId && state.selectedId !== "R" && state.hoverId === n.id && n.id !== state.selectedId);
      drawNode(n, isSelected, isHover, isGraftTarget, nAlpha);
    }

    // 绘制真实线段相交警报点（朱红圆叉）
    if (ease > 0.7) {
      for (const c of model.crossings) {
        ctx.save();
        ctx.fillStyle = PALETTE.err;
        ctx.beginPath();
        ctx.arc(c.x, c.y, model.compact ? 7.5 : 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.paper;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        // 内部白叉
        const d = model.compact ? 3 : 3.6;
        ctx.beginPath();
        ctx.moveTo(c.x - d, c.y - d);
        ctx.lineTo(c.x + d, c.y + d);
        ctx.moveTo(c.x + d, c.y - d);
        ctx.lineTo(c.x - d, c.y + d);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // 坐标命中检测（给手指足够宽容的命中半径）
  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = null;
    let bestD = Infinity;
    for (const n of model.nodes) {
      const hitR = Math.max(22, n.r + 10);
      const d = Math.hypot(x - n.x, y - n.y);
      if (d <= hitR && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return { node: best, x, y };
  }

  // 点击节点：先选子枝，再点另一节点完成嫁接改挂！
  canvas.addEventListener("pointermove", (e) => {
    const { node, x, y } = hitTest(e.clientX, e.clientY);
    pointerPt = { x, y };
    const nextHover = node ? node.id : null;
    if (nextHover !== state.hoverId) {
      state.hoverId = nextHover;
      canvas.style.cursor = node ? "pointer" : "default";
      ctrl.draw();
    } else if (state.selectedId && state.selectedId !== "R") {
      ctrl.draw();
    }
  });

  canvas.addEventListener("pointerleave", () => {
    pointerPt = null;
    if (state.hoverId) {
      state.hoverId = null;
      ctrl.draw();
    }
  });

  canvas.addEventListener("click", (e) => {
    const { node } = hitTest(e.clientX, e.clientY);
    if (!node) {
      if (state.selectedId) {
        state.selectedId = null;
        recompute(true);
        ctrl.draw();
      }
      return;
    }
    if (!state.selectedId) {
      // 第一次点选：选中该节点
      state.selectedId = node.id;
      recompute(true);
      ctrl.draw();
      return;
    }
    if (state.selectedId === node.id) {
      // 再次点自己取消选中
      state.selectedId = null;
      recompute(true);
      ctrl.draw();
      return;
    }
    // 如果先前选中的是主干 R，改为新选中目标节点
    if (state.selectedId === "R") {
      state.selectedId = node.id;
      recompute(true);
      ctrl.draw();
      return;
    }
    // 已选中非根节点，点另一个节点 => 嫁接改挂！
    reparentNode(state, state.selectedId, node.id);
    state.selectedId = null;
    recompute(true);
    ctrl.draw();
  });

  // 绑定横向延伸拉尺（data-perf-drag，支持鼠标 + 触摸 + 键盘左右微调！）
  if (spanRail && spanThumb) {
    let dragging = false;
    const updateFromClientX = (clientX) => {
      const rect = spanRail.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
      const nextSpan = 0.28 + pct * (0.96 - 0.28);
      if (Math.abs(nextSpan - state.span) > 0.001) {
        state.span = nextSpan;
        state.preset = "custom";
        recompute(true);
        ctrl.draw();
      }
    };

    const onDown = (e) => {
      dragging = true;
      spanThumb.classList.add("is-dragging");
      if (e.setPointerCapture && e.pointerId !== undefined) {
        try { spanRail.setPointerCapture(e.pointerId); } catch {}
      }
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      updateFromClientX(cx);
    };
    const onMove = (e) => {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      updateFromClientX(cx);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      spanThumb.classList.remove("is-dragging");
    };

    // 同时支持 Pointer Events 与 Touch Events（兼容 perf.mjs 的 Input.dispatchTouchEvent！）
    spanRail.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    spanRail.addEventListener("touchstart", onDown, { passive: false });
    spanRail.addEventListener("touchmove", onMove, { passive: false });
    spanRail.addEventListener("touchend", onUp);
    spanRail.addEventListener("touchcancel", onUp);

    // 键盘左右微调延伸拉尺
    spanThumb.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.06 : 0.025;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        state.span = Math.min(0.96, state.span + step);
        state.preset = "custom";
        recompute(true);
        ctrl.draw();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        state.span = Math.max(0.28, state.span - step);
        state.preset = "custom";
        recompute(true);
        ctrl.draw();
      }
    });
  }

  resize();
  const ctrl = loop(stageWrap, render);
  const ro = new ResizeObserver(() => {
    resize();
    syncRailUI();
    onChange(model);
    ctrl.draw();
  });
  ro.observe(stageWrap);
  syncRailUI();
  onChange(model);
  ctrl.draw();

  return {
    refresh(notify = true) {
      recompute(notify);
      ctrl.draw();
    },
    getModel() {
      return model;
    },
  };
}
