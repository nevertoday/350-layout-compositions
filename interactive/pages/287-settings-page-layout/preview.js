// 287 设置页面布局 · 高清 2D Canvas 渲染引擎（preview.js）
// 1. 开场右侧「实时预览与分栏直拖画布」（data-perf-drag，60fps 响应左右拖动与状态脉冲）
// 2. 03 节「生效模型与反馈时序波」2D 画布
// 3. 04 节「双滑杆留白蓝图与 44px 触控热区」2D 画布

import { loop, pixelRatio } from "../../lib/stage.js";
import { getWidthStatus } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(120, Math.round(rect.width));
  const h = Math.max(100, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// =========================================================================
// 1. HERO LIVE PREVIEW CANVAS (1:1 化用 287 原海报右侧预览卡 + 可拖拽分界线)
// =========================================================================
export function createHeroPreview(canvas, getState, onDragMainWidth) {
  let dragging = false;
  let hoverHandle = false;
  let pulseAt = -10;
  let introProgress = 0;

  // 把画布 x 坐标映射为主区宽度 mainWidth (50..88)
  function xToMainWidth(clientX) {
    const r = canvas.getBoundingClientRect();
    const padX = 14;
    const innerW = Math.max(80, r.width - padX * 2);
    const rel = Math.max(0, Math.min(1, (clientX - r.left - padX) / innerW));
    // 左侧为侧边栏，向右拖变宽(sidePct 增大 → mainWidth 减小)
    const sidePct = Math.round(Math.max(12, Math.min(50, rel * 100)));
    return 100 - sidePct;
  }

  let dragStartX = 0;
  let dragStartY = 0;
  let dragLocked = false;
  let activePointerId = null;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    dragging = true;
    dragLocked = false;
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    const mw = xToMainWidth(e.clientX);
    pulseAt = performance.now() / 1000;
    onDragMainWidth(mw, true);
    ctrl.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) {
      const r = canvas.getBoundingClientRect();
      const st = getState();
      const wi = getWidthStatus(st);
      const padX = 14;
      const innerW = r.width - padX * 2;
      const divX = padX + innerW * (wi.sideActive ? wi.sidePct / 100 : 0.28);
      const near = Math.abs(e.clientX - r.left - divX) < 18;
      if (near !== hoverHandle) {
        hoverHandle = near;
        canvas.style.cursor = near ? "ew-resize" : "grab";
        ctrl.draw();
      }
      return;
    }
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    if (!dragLocked) {
      const dx = Math.abs(e.clientX - dragStartX);
      const dy = Math.abs(e.clientY - dragStartY);
      if (dx > 3 || dy > 3) dragLocked = true;
    }
    const mw = xToMainWidth(e.clientX);
    pulseAt = performance.now() / 1000;
    onDragMainWidth(mw, false);
    ctrl.draw();
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    activePointerId = null;
    canvas.style.cursor = hoverHandle ? "ew-resize" : "grab";
    ctrl.draw();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (!dragging && hoverHandle) {
      hoverHandle = false;
      canvas.style.cursor = "grab";
      ctrl.draw();
    }
  });

  // 键盘支持（左右方向键微调侧栏比例）
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    const step = e.shiftKey ? 5 : 2;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      pulseAt = performance.now() / 1000;
      onDragMainWidth(Math.max(50, st.values.mainWidth - step), true);
      ctrl.draw();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      pulseAt = performance.now() / 1000;
      onDragMainWidth(Math.min(88, st.values.mainWidth + step), true);
      ctrl.draw();
    }
  });

  function render(t, dt, { still }) {
    const { ctx, w, h } = fitCanvas(canvas);
    const state = getState();
    const vals = state.values;
    const wi = getWidthStatus(state);

    if (still) introProgress = 1;
    else introProgress = Math.min(1, introProgress + Math.max(0.03, dt * 2.2));
    const ease = 1 - (1 - introProgress) ** 3;

    // 外底纸（冷白）
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#F4F6F7";
    roundRectPath(ctx, 0, 0, w, h, 8);
    ctx.fill();

    // 内框模拟网页视口（忠实还原 287 原海报右上预览窗！）
    const padX = 12;
    const padTop = 10;
    const padBot = 26;
    const vw = w - padX * 2;
    const vh = h - padTop - padBot;

    ctx.save();
    roundRectPath(ctx, padX, padTop, vw, vh, 6);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = wi.status === "ok" || wi.status === "hidden" ? "#D5DDE1" : "#D88A00";
    ctx.lineWidth = wi.status === "ok" || wi.status === "hidden" ? 1 : 1.5;
    ctx.stroke();
    ctx.clip();

    // 页眉（原海报标志翠青 #057E7A）
    const headerH = vals.showHeader ? Math.round(vh * 0.145) : 0;
    if (headerH > 0) {
      ctx.fillStyle = state.scenario === "privacy" ? "#283238" : "#057E7A";
      ctx.fillRect(padX, padTop, vw, headerH);
      // 左侧小圆点与标题条
      ctx.fillStyle = "#FFFFFF";
      roundRectPath(ctx, padX + 9, padTop + headerH * 0.36, 16, Math.max(4, headerH * 0.28), 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      roundRectPath(ctx, padX + vw - 38, padTop + headerH * 0.36, 28, Math.max(4, headerH * 0.28), 2);
      ctx.fill();
    }

    // 页脚
    const footerH = vals.showFooter ? Math.round(vh * 0.11) : 0;
    if (footerH > 0) {
      ctx.fillStyle = "#8C959C";
      ctx.fillRect(padX, padTop + vh - footerH, vw, footerH);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      roundRectPath(ctx, padX + vw * 0.34, padTop + vh - footerH * 0.62, vw * 0.32, 3.5, 1.5);
      ctx.fill();
    }

    const bodyY = padTop + headerH;
    const bodyH = vh - headerH - footerH;

    // 根据不同场景渲染定制的实时内容（但保持一致的可拖分界线物理交互！）
    const sideFraction = wi.sideActive ? (wi.sidePct / 100) * ease : 0;
    const sideW = Math.round(vw * sideFraction);
    const isTriple = vals.layoutMode === "triple" && wi.sideActive;
    const rightAuxW = isTriple ? Math.round(vw * 0.17) : 0;

    // 侧边栏（原海报浅灰侧条带 6 条导航线）
    if (sideW > 0) {
      const badSide = wi.status === "narrow" || wi.status === "wide";
      ctx.fillStyle = badSide ? (state.feedback === "silent" ? "#DCE1E5" : "#FBF0D9") : "#D9E0E3";
      ctx.fillRect(padX, bodyY, sideW, bodyH);

      // 侧边栏内部模拟导航条（过窄时明显挤成短点！）
      const navCount = 6;
      const barPad = Math.max(3, Math.min(8, sideW * 0.14));
      const barW = Math.max(5, sideW - barPad * 2);
      for (let i = 0; i < navCount; i++) {
        const ny = bodyY + 11 + i * Math.min(16, (bodyH - 22) / navCount);
        if (ny + 5 > bodyY + bodyH - 6) break;
        ctx.fillStyle = i === 1 ? "#098781" : badSide && state.feedback !== "silent" ? "#B88424" : "#F8FAFA";
        roundRectPath(ctx, padX + barPad, ny, i === 1 ? barW : barW * (0.68 + (i % 3) * 0.1), 4.5, 2);
        ctx.fill();
      }
    }

    // 三栏右辅栏
    if (rightAuxW > 0) {
      ctx.fillStyle = "#EDF1F3";
      ctx.fillRect(padX + vw - rightAuxW, bodyY, rightAuxW, bodyH);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "#C7D0D5";
        roundRectPath(ctx, padX + vw - rightAuxW + 5, bodyY + 12 + i * 16, rightAuxW - 10, 5, 2);
        ctx.fill();
      }
    }

    // 主内容区（受密度、对齐与圆角样式真实影响）
    const mainX = padX + sideW;
    const mainW = Math.max(32, vw - sideW - rightAuxW);
    const padScale = state.density === "cramped" ? 5 : state.density === "compact" ? 8 : state.density === "loose" ? 14 : 11;
    const innerPad = Math.min(padScale, mainW * 0.12);
    const cardRadius = vals.containerStyle === "直角线框" ? 0 : vals.containerStyle === "柔和浮层" ? 8 : 4;

    // 对齐偏移
    const availW = Math.max(24, mainW - innerPad * 2);
    const contentW = Math.round(availW * (vals.layoutMode === "free" ? 0.88 : 0.94));
    const offsetX =
      vals.align === "left"
        ? mainX + innerPad
        : vals.align === "right"
          ? mainX + mainW - innerPad - contentW
          : mainX + Math.round((mainW - contentW) / 2);

    let cy = bodyY + innerPad;

    // 面包屑小条
    if (vals.showBreadcrumb) {
      ctx.fillStyle = "#9BA8B0";
      roundRectPath(ctx, offsetX, cy, Math.min(contentW * 0.48, 56), 3.5, 1.5);
      ctx.fill();
      cy += 9;
    }

    if (state.scenario === "notify") {
      // 通知场景：模拟推送横幅与免打扰时间带
      const cardH = Math.max(28, bodyH * 0.28);
      ctx.fillStyle = "#E4F2EC";
      roundRectPath(ctx, offsetX, cy, contentW, cardH, cardRadius);
      ctx.fill();
      ctx.fillStyle = "#098781";
      ctx.beginPath();
      ctx.arc(offsetX + 12, cy + cardH / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1C3B38";
      roundRectPath(ctx, offsetX + 24, cy + cardH * 0.28, contentW * 0.52, 4.5, 2);
      ctx.fill();
      ctx.fillStyle = "#5B7B78";
      roundRectPath(ctx, offsetX + 24, cy + cardH * 0.58, contentW * 0.36, 3.5, 1.5);
      ctx.fill();
      cy += cardH + 9;
    } else if (state.scenario === "privacy") {
      // 隐私场景：模拟锁盾牌与可见度条
      const cardH = Math.max(34, bodyH * 0.34);
      ctx.fillStyle = "#E8EFF5";
      roundRectPath(ctx, offsetX, cy, contentW, cardH, cardRadius);
      ctx.fill();
      ctx.fillStyle = "#283238";
      roundRectPath(ctx, offsetX + 10, cy + 8, 16, 16, 3);
      ctx.fill();
      ctx.fillStyle = "#098781";
      roundRectPath(ctx, offsetX + 32, cy + 9, contentW * 0.45, 5, 2);
      ctx.fill();
      ctx.fillStyle = "#7D8B94";
      roundRectPath(ctx, offsetX + 32, cy + 19, contentW * 0.34, 3.5, 1.5);
      ctx.fill();
      cy += cardH + 9;
    } else {
      // 287 原海报经典预览图：上 3 行浅灰文 + 中央薄荷绿山峰太阳图 + 下 2 行浅灰文！
      const lineGap = state.density === "cramped" ? 5 : state.density === "loose" ? 9 : 7;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 0 ? "#BFC8CD" : "#DCE2E6";
        roundRectPath(ctx, offsetX, cy, contentW * (i === 0 ? 0.72 : i === 2 ? 0.8 : 0.94), 4, 2);
        ctx.fill();
        cy += lineGap;
      }
      cy += 3;

      // 薄荷绿配翠青山影插画框（1:1 呼应原海报！）
      const imgH = Math.max(30, Math.min(54, bodyH * 0.34));
      const imgW = vals.layoutMode === "free" ? contentW * 0.78 : contentW;
      ctx.save();
      roundRectPath(ctx, offsetX, cy, imgW, imgH, cardRadius);
      ctx.fillStyle = "#8FC6C4";
      ctx.fill();
      ctx.clip();
      // 太阳圆
      ctx.fillStyle = "#E8F5F4";
      ctx.beginPath();
      ctx.arc(offsetX + imgW * 0.72, cy + imgH * 0.28, Math.max(4, imgH * 0.13), 0, Math.PI * 2);
      ctx.fill();
      // 远山
      ctx.fillStyle = "#48ABA4";
      ctx.beginPath();
      ctx.moveTo(offsetX, cy + imgH);
      ctx.lineTo(offsetX + imgW * 0.36, cy + imgH * 0.42);
      ctx.lineTo(offsetX + imgW * 0.68, cy + imgH);
      ctx.closePath();
      ctx.fill();
      // 近山
      ctx.fillStyle = "#187E78";
      ctx.beginPath();
      ctx.moveTo(offsetX + imgW * 0.34, cy + imgH);
      ctx.lineTo(offsetX + imgW * 0.68, cy + imgH * 0.48);
      ctx.lineTo(offsetX + imgW, cy + imgH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      cy += imgH + lineGap + 2;
    }

    // 底部正文骨架线
    const remGap = state.density === "cramped" ? 5 : state.density === "loose" ? 9 : 7;
    for (let i = 0; i < 3 && cy + 4 < bodyY + bodyH - 8; i++) {
      ctx.fillStyle = "#DCE2E6";
      roundRectPath(ctx, offsetX, cy, contentW * (i === 2 ? 0.58 : 0.9), 3.8, 1.5);
      ctx.fill();
      cy += remGap;
    }

    // 返回顶部与页码微标
    if (vals.showBackTop) {
      ctx.fillStyle = "#098781";
      ctx.beginPath();
      ctx.arc(mainX + mainW - 10, bodyY + bodyH - 10, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (vals.showPageNum) {
      ctx.fillStyle = "#8C98A0";
      roundRectPath(ctx, mainX + mainW / 2 - 12, bodyY + bodyH - 12, 24, 4, 2);
      ctx.fill();
    }

    // 可拖拽分界线 + 实时手柄（侧栏可见时）
    if (wi.sideActive) {
      const divX = padX + sideW;
      const bad = wi.status === "narrow" || wi.status === "wide";
      const lineColor = bad && state.feedback !== "silent" ? "#D88A00" : "#098781";

      // 拖拽脉冲波
      const sincePulse = performance.now() / 1000 - pulseAt;
      if (sincePulse >= 0 && sincePulse < 0.6 && !still) {
        ctx.fillStyle = bad ? `rgba(216, 138, 0, ${(0.18 * (1 - sincePulse / 0.6)).toFixed(3)})` : `rgba(9, 135, 129, ${(0.16 * (1 - sincePulse / 0.6)).toFixed(3)})`;
        ctx.fillRect(divX - 10, bodyY, 20, bodyH);
      }

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = dragging || hoverHandle ? 2.5 : 1.8;
      ctx.beginPath();
      ctx.moveTo(divX, bodyY);
      ctx.lineTo(divX, bodyY + bodyH);
      ctx.stroke();

      // 药丸形拖动手柄
      const pillH = 26;
      const pillW = 12;
      const pillY = bodyY + bodyH * 0.5 - pillH / 2;
      roundRectPath(ctx, divX - pillW / 2, pillY, pillW, pillH, 6);
      ctx.fillStyle = dragging ? "#0A0D10" : lineColor;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 手柄双竖纹
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(divX - 1.8, pillY + 8);
      ctx.lineTo(divX - 1.8, pillY + pillH - 8);
      ctx.moveTo(divX + 1.8, pillY + 8);
      ctx.lineTo(divX + 1.8, pillY + pillH - 8);
      ctx.stroke();
    }
    ctx.restore();

    // 底部实时标尺读数（在画布底带，绝不挡内容）
    const footY = padTop + vh + 16;
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textBaseline = "middle";
    const statusColor =
      wi.status === "narrow" || wi.status === "wide"
        ? state.feedback === "silent"
          ? "#525E66"
          : "#8A5E00"
        : "#066E69";
    ctx.fillStyle = statusColor;
    ctx.textAlign = "left";
    const leftTxt = wi.sideActive ? `SIDE ${wi.sidePct}%` : "SINGLE 100%";
    ctx.fillText(leftTxt, padX, footY);

    ctx.textAlign = "right";
    ctx.fillStyle = "#525E66";
    const rightTxt = wi.sideActive ? `MAIN ${wi.mainPct}% ↔` : "无侧栏";
    ctx.fillText(rightTxt, w - padX, footY);
  }

  const ctrl = loop(canvas, render);
  return {
    draw: () => {
      pulseAt = performance.now() / 1000;
      ctrl.draw();
    },
  };
}

// =========================================================================
// 2. SECTION 03 · 生效模型与反馈时序波 2D 画布（深青灰暗室风格）
// =========================================================================
export function createCommitTimeline(canvas, getSimState) {
  let simT = 2.2;

  function render(t, dt, { still }) {
    const { ctx, w, h } = fitCanvas(canvas);
    const sim = getSimState();
    if (!still) simT = Math.min(3.0, simT + dt);
    const elapsed = still ? 2.2 : Math.min(3.0, simT - sim.triggeredAt);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#161E23";
    roundRectPath(ctx, 0, 0, w, h, 8);
    ctx.fill();

    const padL = 56;
    const padR = 20;
    const padT = 26;
    const padB = 30;
    const pw = Math.max(100, w - padL - padR);
    const ph = Math.max(60, h - padT - padB);

    // 网格水平线（高确信 / 犹豫 / 焦虑）
    const levels = [
      { y: 0.14, label: "安心可控", color: "#4CD4CB" },
      { y: 0.52, label: "等待观望", color: "#9FB2BC" },
      { y: 0.88, label: "怀疑失效", color: "#FF8A8A" },
    ];
    ctx.font = '500 11px "Noto Sans SC", sans-serif';
    ctx.textBaseline = "middle";
    for (const lv of levels) {
      const y = padT + lv.y * ph;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + pw, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = lv.color;
      ctx.textAlign = "right";
      ctx.fillText(lv.label, padL - 8, y);
    }

    // 根据生效模式计算用户确信度曲线（0 = 底部怀疑，1 = 顶部安心，明确标示意）
    const latency = sim.slowNet ? 0.42 : 0.12;
    const hasConflict = sim.conflict;

    function curveY(u) {
      // u in [0, 1] 对应点击后 0s–2.4s
      if (sim.mode === "instant") {
        if (u < 0.08) return 0.72;
        if (hasConflict && u > 0.36) {
          // 冲突时立刻提示并回滚，确信度先跌后因清晰纠错而回升
          return u < 0.52 ? 0.58 : 0.84;
        }
        if (u < 0.08 + latency) return 0.66 - (u - 0.08) * 0.25;
        return 0.92;
      }
      if (sim.mode === "explicit") {
        // 显式保存：改完出现「未保存提示」停在中间等待，点保存后升到顶部
        if (u < 0.1) return 0.72;
        if (!sim.savedClicked) return 0.56;
        if (u < 0.52) return 0.56;
        if (hasConflict && u >= 0.52) return u < 0.68 ? 0.45 : 0.8;
        return 0.9;
      }
      // silent 混用陷阱：改完无提示，确信度随时间一路下滑
      if (u < 0.08) return 0.7;
      return Math.max(0.14, 0.66 - (u - 0.08) * 0.58);
    }

    const progress = Math.max(0.25, Math.min(1, elapsed / 0.72));
    const steps = 64;
    const lineColor = sim.mode === "silent" ? "#FF8A8A" : sim.mode === "explicit" ? "#FFD147" : "#4CD4CB";

    // 填充柔和渐变
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * progress;
      const x = padL + u * pw;
      const y = padT + (1 - curveY(u)) * ph;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(padL + progress * pw, padT + ph);
    ctx.lineTo(padL, padT + ph);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, padT + ph);
    grad.addColorStop(0, sim.mode === "silent" ? "rgba(255,138,138,0.22)" : sim.mode === "explicit" ? "rgba(255,209,71,0.22)" : "rgba(76,212,203,0.24)");
    grad.addColorStop(1, "rgba(22,30,35,0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // 曲线主描边
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * progress;
      const x = padL + u * pw;
      const y = padT + (1 - curveY(u)) * ph;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // 事件标记点
    const markers = [{ u: 0.08, label: "拨动控件", color: "#FFFFFF" }];
    if (sim.mode === "instant") {
      markers.push({
        u: Math.min(0.85, 0.08 + latency + (hasConflict ? 0.25 : 0.04)),
        label: hasConflict ? "回滚+纠错提示" : sim.slowNet ? "600ms 轻态已保存" : "100ms 即时生效",
        color: hasConflict ? "#FFD147" : "#4CD4CB",
      });
    } else if (sim.mode === "explicit") {
      markers.push({ u: 0.24, label: "亮起未保存条", color: "#FFD147" });
      if (sim.savedClicked) markers.push({ u: 0.62, label: hasConflict ? "行内标错待修" : "点击保存→已存", color: "#4CD4CB" });
    } else {
      markers.push({ u: 0.56, label: "无任何反馈 → 用户怀疑卡死", color: "#FF8A8A" });
    }

    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    for (const m of markers) {
      if (m.u > progress) continue;
      const mx = padL + m.u * pw;
      const my = padT + (1 - curveY(m.u)) * ph;
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.fillStyle = m.color;
      ctx.textAlign = m.u > 0.68 ? "right" : "left";
      ctx.fillText(m.label, m.u > 0.68 ? mx - 8 : mx + 8, Math.max(padT + 10, my - 12));
    }

    // 底部时间轴说明
    ctx.fillStyle = "#9FB2BC";
    ctx.font = '400 10px "Space Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText("T = 0.0s", padL, h - 10);
    ctx.textAlign = "right";
    ctx.fillText(w < 380 ? "确信度示意 · T=2.4s" : "用户心理确信度变化（示意） · T = 2.4s", w - padR, h - 10);
  }

  const ctrl = loop(canvas, render);
  return {
    trigger(instantDraw = false) {
      simT = instantDraw ? 2.2 : 0;
      ctrl.draw();
    },
    draw: () => ctrl.draw(),
  };
}

// =========================================================================
// 3. SECTION 04 · 双滑杆留白蓝图与 44px 触控靶区画布
// =========================================================================
export function createSpacingBlueprint(canvas, getGapState) {
  function render() {
    const { ctx, w, h } = fitCanvas(canvas);
    const { innerGap, outerGap, showTouch } = getGapState();
    const ratio = outerGap / Math.max(1, innerGap);
    const inverted = ratio < 1.05;
    const tight = !inverted && ratio < 1.55;
    const healthy = ratio >= 1.55;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    roundRectPath(ctx, 0, 0, w, h, 10);
    ctx.fill();

    // 画布分 3 组设置行，精准按 innerGap / outerGap 实绘
    const padX = 24;
    const usableW = Math.max(160, w - padX * 2 - 76);
    const rowH = Math.max(20, Math.min(34, 18 + innerGap * 0.72));
    const groups = [
      { title: "GROUP A · 显示", rows: ["页眉区域", "侧边栏"] },
      { title: "GROUP B · 排版", rows: ["内容对齐", "模块间距"] },
    ];

    // 纵向居中排布
    const titleH = 16;
    const groupH = titleH + 8 + rowH * 2 + innerGap;
    const totalH = groupH * 2 + outerGap;
    let y = Math.max(16, Math.round((h - totalH) / 2));

    const centers = [];

    groups.forEach((g, gi) => {
      const gx = padX;
      // 组底色（仅在健康比例下给极淡底，凸显留白本身形成的边界）
      ctx.fillStyle = "#F7F9FA";
      roundRectPath(ctx, gx - 8, y - 6, usableW + 16, groupH + 12, 8);
      ctx.fill();
      ctx.strokeStyle = healthy ? "#D7E0E4" : "#E5C7C7";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 组标题
      ctx.font = '700 11px "IBM Plex Sans", "Noto Sans SC", sans-serif';
      ctx.fillStyle = "#066E69";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(g.title, gx, y);

      let ry = y + titleH + 6;
      g.rows.forEach((label, ri) => {
        ctx.fillStyle = "#FFFFFF";
        roundRectPath(ctx, gx, ry, usableW, rowH, 5);
        ctx.fill();
        ctx.strokeStyle = "#DCE2E6";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 左侧文字条
        ctx.fillStyle = "#242B30";
        ctx.font = '500 11px "Noto Sans SC", sans-serif';
        ctx.textBaseline = "middle";
        ctx.fillText(label, gx + 10, ry + rowH / 2);

        // 右侧模拟开关胶囊
        const sw = 28;
        const sh = Math.min(16, rowH - 6);
        const sx = gx + usableW - sw - 10;
        const sy = ry + (rowH - sh) / 2;
        roundRectPath(ctx, sx, sy, sw, sh, sh / 2);
        ctx.fillStyle = ri === 0 ? "#098781" : "#CBD3D8";
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(ri === 0 ? sx + sw - sh / 2 : sx + sh / 2, sy + sh / 2, sh * 0.36, 0, Math.PI * 2);
        ctx.fill();

        centers.push({ x: sx + sw / 2, y: ry + rowH / 2, group: gi });

        // 标出组内间距（仅第一组两行之间）
        if (gi === 0 && ri === 0) {
          const gapY = ry + rowH;
          ctx.fillStyle = inverted ? "rgba(166,29,36,0.16)" : "rgba(9,135,129,0.14)";
          ctx.fillRect(gx + 4, gapY, usableW - 8, innerGap);
          // 右侧标尺箭头（带工程端帽）
          const rx = gx + usableW + 18;
          ctx.strokeStyle = inverted ? "#A61D24" : "#066E69";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(rx - 3, gapY);
          ctx.lineTo(rx + 3, gapY);
          ctx.moveTo(rx, gapY);
          ctx.lineTo(rx, gapY + innerGap);
          ctx.moveTo(rx - 3, gapY + innerGap);
          ctx.lineTo(rx + 3, gapY + innerGap);
          ctx.stroke();
          ctx.fillStyle = inverted ? "#A61D24" : "#066E69";
          ctx.font = '700 11px "Space Mono", monospace';
          ctx.textBaseline = "middle";
          ctx.fillText(`内 ${innerGap}px`, rx + 6, gapY + innerGap / 2);
        }

        ry += rowH + innerGap;
      });

      // 标出组间外距（两组之间）
      if (gi === 0) {
        const outY = y + groupH + 6;
        const gapSpan = Math.max(4, outerGap - 12);
        ctx.fillStyle = healthy ? "rgba(253,190,2,0.22)" : "rgba(166,29,36,0.18)";
        ctx.fillRect(gx - 8, outY, usableW + 16, gapSpan);
        const rx = gx + usableW + 18;
        ctx.strokeStyle = healthy ? "#8A5E00" : "#A61D24";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(rx - 3, outY);
        ctx.lineTo(rx + 3, outY);
        ctx.moveTo(rx, outY);
        ctx.lineTo(rx, outY + gapSpan);
        ctx.moveTo(rx - 3, outY + gapSpan);
        ctx.lineTo(rx + 3, outY + gapSpan);
        ctx.stroke();
        ctx.fillStyle = healthy ? "#8A5E00" : "#A61D24";
        ctx.font = '700 11px "Space Mono", monospace';
        ctx.textBaseline = "middle";
        ctx.fillText(`外 ${outerGap}px`, rx + 6, outY + gapSpan / 2);
      }

      y += groupH + outerGap;
    });

    // 44px 触屏靶区碰撞检视（当相邻行中心距 < 44px，两圆重叠爆红！）
    if (showTouch) {
      const rTouch = 22; // 直径 44px
      for (let i = 0; i < centers.length; i++) {
        const c = centers[i];
        let collide = false;
        for (let j = 0; j < centers.length; j++) {
          if (i !== j && Math.abs(centers[i].y - centers[j].y) < rTouch * 2 - 1) {
            collide = true;
            break;
          }
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, rTouch, 0, Math.PI * 2);
        ctx.fillStyle = collide ? "rgba(166,29,36,0.18)" : "rgba(9,135,129,0.14)";
        ctx.fill();
        ctx.strokeStyle = collide ? "#A61D24" : "#066E69";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  const ctrl = loop(canvas, render);
  return { draw: () => ctrl.draw() };
}
