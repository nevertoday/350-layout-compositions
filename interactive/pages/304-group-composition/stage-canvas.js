// 304 原海报风格多层剪纸景深群像画布渲染 + 真实交互控制器
import { PALETTE, ROLE_META } from "./palette.js";
import { evaluateEnsemble } from "./model.js";
import { loop, pixelRatio } from "../../lib/stage.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 绘制 304 原海报标志性「无五官、带白边剪纸轮廓」的饱满现代人物剪影
export function drawCutoutSilhouette(ctx, p, opts = {}) {
  const {
    rimColor = PALETTE.cutoutRim,
    rimWidth = 4.2,
    isLead = false,
    isSelected = false,
    isDimmed = false,
    isColliding = false,
    highlightProbe = null,
    t = 0,
    still = false,
  } = opts;

  const fill = ROLE_META[p.role]?.fill || PALETTE.ink;
  const sw = p.shoulderW;
  const x0 = p.cx - sw / 2;
  const y0 = p.torsoTop;
  const h = p.torsoH;
  const rad = Math.min(sw * 0.44, h * 0.42, 36);

  ctx.save();
  if (isDimmed) ctx.globalAlpha = 0.28;

  // 轻微剪纸落影（仅在非暗房时呈现暖纸浮雕层次）
  if (!opts.darkBg) {
    ctx.save();
    ctx.fillStyle = "rgba(14, 16, 15, 0.08)";
    ctx.beginPath();
    ctx.ellipse(p.cx + 2, p.baseY + 2, sw * 0.46, Math.max(4, sw * 0.07), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 构建躯干路径（平底圆肩，1:1 承袭 304 原海报圆润现代人物块）
  const traceTorso = () => {
    ctx.beginPath();
    ctx.moveTo(x0, p.baseY);
    ctx.lineTo(x0, y0 + rad);
    ctx.quadraticCurveTo(x0, y0, x0 + rad, y0);
    ctx.lineTo(x0 + sw - rad, y0);
    ctx.quadraticCurveTo(x0 + sw, y0, x0 + sw, y0 + rad);
    ctx.lineTo(x0 + sw, p.baseY);
    ctx.closePath();
  };

  // 构建头部（含可选发髻剪影，对应原海报左后与右中的圆髻人物，绝无五官！）
  const hasBun = p.variant === "bun";
  const bunR = p.headR * 0.44;
  const bunCx = p.headCx + (p.effX < 0.5 ? -p.headR * 0.06 : p.headR * 0.42);
  const bunCy = p.headCy - (p.effX < 0.5 ? p.headR * 1.12 : -p.headR * 0.12);

  // 先画白边剪纸描边（先描躯干和头，再填实色，确保重叠时前后轮廓绝对清晰！）
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = rimWidth * 2;

  traceTorso();
  ctx.stroke();

  if (hasBun) {
    ctx.beginPath();
    ctx.arc(bunCx, bunCy, bunR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(p.headCx, p.headCy, p.headR, 0, Math.PI * 2);
  ctx.stroke();

  // 实色填充
  ctx.fillStyle = fill;
  traceTorso();
  ctx.fill();

  if (hasBun) {
    ctx.beginPath();
    ctx.arc(bunCx, bunCy, bunR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(p.headCx, p.headCy, p.headR, 0, Math.PI * 2);
  ctx.fill();

  // 选中态虚线外框提示
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = p.role === "red" ? PALETTE.ink : PALETTE.red;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.roundRect(x0 - 5, p.topY - 5, sw + 10, p.pxH + 9, 10);
    ctx.stroke();
    ctx.restore();
  }

  // 叠头告警红虚环
  if (isColliding) {
    ctx.save();
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(p.headCx, p.headCy, p.headR + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 304 原海报标志：唯一红主角头顶三条信号朱红放射线 \ | /
  if (isLead && p.role === "red") {
    const pulse = still ? 0 : Math.sin(t * 2.8) * 2.2;
    const rays = [
      { ang: -Math.PI / 2 - 0.56, len: 22 },
      { ang: -Math.PI / 2, len: 26 },
      { ang: -Math.PI / 2 + 0.56, len: 22 },
    ];
    ctx.save();
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = Math.max(3.2, p.headR * 0.16);
    ctx.lineCap = "round";
    for (const r of rays) {
      const r0 = p.headR + 13 + pulse * 0.4;
      const r1 = r0 + r.len + pulse * 0.6;
      ctx.beginPath();
      ctx.moveTo(p.headCx + Math.cos(r.ang) * r0, p.headCy + Math.sin(r.ang) * r0);
      ctx.lineTo(p.headCx + Math.cos(r.ang) * r1, p.headCy + Math.sin(r.ang) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 原则探针高亮小标（如层级模式下在头顶轻标高程）
  if (highlightProbe === "hierarchy") {
    ctx.save();
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.fillStyle = p.role === "grey" ? PALETTE.inkMuted : fill;
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(p.effH * 100)}`, p.headCx, p.topY - 6);
    ctx.restore();
  }

  ctx.restore();
}

export function mountHeroStage(canvas, getState, onMutate, onRenderEval) {
  const ctx = canvas.getContext("2d");
  let cssW = 860;
  let cssH = 440;
  let sizeReady = false;
  let dirty = true;
  let domDirty = true;
  let lastEval = null;
  let introT = 0;
  let gazeAnim = 0; // 0..1 动势演播进度
  let dragging = null;

  function triggerGazePulse() {
    gazeAnim = 0.001;
    dirty = true;
  }

  function measureSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(window.innerWidth <= 680 ? 1.5 : 2);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (!sizeReady || cssW !== w || cssH !== h || canvas.width !== bw || canvas.height !== bh) {
      cssW = w;
      cssH = h;
      canvas.width = bw;
      canvas.height = bh;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeReady = true;
      dirty = true;
      domDirty = true;
    }
  }

  // 按场景画轻微建筑语境底图（纯矢量平涂，软件渲染下也极速稳定 60fps）
  function drawBackdrop(state, w, h) {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    if (state.scenario === "banquet") {
      ctx.save();
      ctx.strokeStyle = "rgba(14, 16, 15, 0.10)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const x = (w / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, h * 0.14);
        ctx.lineTo(x, h * 0.72);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(184, 182, 177, 0.24)";
      ctx.fillRect(w * 0.06, h * 0.72, w * 0.88, h * 0.05);
      ctx.strokeStyle = "rgba(14, 16, 15, 0.18)";
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.72);
      ctx.lineTo(w * 0.94, h * 0.72);
      ctx.stroke();
      ctx.restore();
    } else if (state.scenario === "street") {
      ctx.save();
      ctx.strokeStyle = "rgba(13, 65, 204, 0.11)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      const vy = h * 0.42;
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.lineTo(w, vy);
      ctx.stroke();
      for (const bx of [0.05, 0.28, 0.72, 0.95]) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, vy);
        ctx.lineTo(w * bx, h);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.36)";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.52, w * 0.40, h * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(14, 16, 15, 0.045)";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.93, w * 0.38, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 绘制群落呼吸走廊与原则诊断几何叠层
  function drawDiagnosticOverlays(state, ev, w, h, t) {
    const probe = state.activeProbe;
    const { metrics, checks, primaryLead } = ev;

    // 1. 群落走廊与分组包络（当高亮 grouping 或分散式成立时展示淡蓝呼吸走廊）
    if (probe === "grouping" || (ev.polarity === "dispersed" && state.showCallouts)) {
      ctx.save();
      for (const cor of metrics.corridors) {
        const x0 = cor.x0 * w;
        const x1 = cor.x1 * w;
        ctx.fillStyle = "rgba(13, 65, 204, 0.06)";
        ctx.fillRect(x0, h * 0.14, x1 - x0, h * 0.80);
        ctx.strokeStyle = "rgba(13, 65, 204, 0.34)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo((x0 + x1) / 2, h * 0.16);
        ctx.lineTo((x0 + x1) / 2, h * 0.92);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. 层级头顶线（当处于等高坏态或点亮 hierarchy 探针时，直接画出水平头高参考线揭露「一字齐头」！）
    if (probe === "hierarchy" || checks.hierarchy.fault === "flatHeights") {
      const headYs = ev.projected.map((p) => p.headCy);
      const minY = Math.min(...headYs);
      const maxY = Math.max(...headYs);
      ctx.save();
      ctx.strokeStyle = checks.hierarchy.ok ? "rgba(14, 107, 66, 0.45)" : "rgba(235, 51, 20, 0.65)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.06, minY);
      ctx.lineTo(w * 0.94, minY);
      ctx.moveTo(w * 0.06, maxY);
      ctx.lineTo(w * 0.94, maxY);
      ctx.stroke();

      // 左侧落差标尺（白底高对比标签，绝不压在红头上）
      const rx = w * 0.06;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(rx, minY);
      ctx.lineTo(rx, maxY);
      ctx.stroke();
      if (w >= 460) {
        const lbl = checks.hierarchy.ok ? `高差 ${metrics.heightRatio.toFixed(2)}×` : `等高拉平 ${metrics.heightRatio.toFixed(2)}×`;
        ctx.font = `500 11px "DM Mono", "Noto Sans SC", monospace`;
        const lw = ctx.measureText(lbl).width + 14;
        const ly = Math.max(44, minY - 30);
        ctx.fillStyle = "rgba(250, 248, 244, 0.94)";
        ctx.fillRect(rx, ly - 11, lw, 20);
        ctx.strokeStyle = checks.hierarchy.ok ? PALETTE.okLight : PALETTE.red;
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, ly - 11, lw, 20);
        ctx.fillStyle = checks.hierarchy.ok ? PALETTE.okLight : PALETTE.redTextLight;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, rx + 7, ly - 1);
      }
      ctx.restore();
    }

    // 3. 密度网格外框指示（高亮 density 或过满/过空时显示真实覆盖率标尺）
    if (probe === "density" || !checks.density.ok) {
      ctx.save();
      ctx.strokeStyle = checks.density.ok ? "rgba(14, 107, 66, 0.35)" : "rgba(235, 51, 20, 0.50)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.restore();
    }

    // 4. 视觉重心标点（底部细滑轨标示实绘重量中心 vs 50% 中轴）
    ctx.save();
    const railY = h - 10;
    const midX = w * 0.5;
    const comPx = clamp(metrics.comX * w, 24, w - 24);
    ctx.strokeStyle = "rgba(14, 16, 15, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, railY);
    ctx.lineTo(w * 0.86, railY);
    ctx.moveTo(midX, railY - 4);
    ctx.lineTo(midX, railY + 4);
    ctx.stroke();
    ctx.fillStyle = Math.abs(metrics.comOffset) > 0.15 ? PALETTE.red : PALETTE.ink;
    ctx.beginPath();
    ctx.arc(comPx, railY, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. 视线与动势演播线（按空格或点击按钮时流光扫过，或在坏态外逃时指示发散方向）
    if (gazeAnim > 0 || probe === "focal") {
      const prog = gazeAnim > 0 ? gazeAnim : 0.78;
      ctx.save();
      for (const p of ev.projected) {
        if (p.index === primaryLead.index) continue;
        const sx = p.headCx;
        const sy = p.headCy;
        let tx, ty;
        let isEscaping = false;
        if (p.gaze === "out") {
          isEscaping = true;
          const dir = p.effX < 0.5 ? -1 : 1;
          tx = sx + dir * Math.min(90, w * 0.13);
          ty = sy - 16;
        } else {
          tx = primaryLead.headCx;
          ty = primaryLead.headCy + primaryLead.headR * 0.3;
        }
        const cx = sx + (tx - sx) * prog;
        const cy = sy + (ty - sy) * prog;

        ctx.strokeStyle = isEscaping ? "rgba(235, 51, 20, 0.72)" : "rgba(13, 65, 204, 0.52)";
        ctx.lineWidth = isEscaping ? 1.8 : 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // 流动光点
        ctx.setLineDash([]);
        ctx.fillStyle = isEscaping ? PALETTE.red : PALETTE.blue;
        ctx.beginPath();
        ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. 1:1 复刻 304 原海报右上/右中/底部的虚线引出标注（宽屏 w >= 560 时显示，绝不裁切或压住人物）
    if (state.showCallouts && w >= 560) {
      drawPosterCallouts(ev, w, h);
    }

    // 7. 顶部极简实测读数角签（保证在任何宽度清晰可读，不与顶栏得分章重复）
    ctx.save();
    ctx.font = `500 11px "DM Mono", "Noto Sans SC", monospace`;
    const leftText = `${metrics.count}人 · 覆盖 ${coverageLabel(metrics.coveragePct)} · 主次 ${metrics.weightRatio.toFixed(2)}×`;
    ctx.fillStyle = "rgba(250, 248, 244, 0.92)";
    const lw = ctx.measureText(leftText).width + 16;
    ctx.fillRect(14, 12, lw, 24);
    ctx.strokeStyle = "rgba(14, 16, 15, 0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 12, lw, 24);
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(leftText, 22, 24);

    // 右上阵型极性标签（窄屏省去以免压迫画布顶边，宽屏与顶栏得分章互补不重复）
    if (w >= 440) {
      const modeText =
        ev.polarity === "concentrated"
          ? "阵型 · 集中凝聚"
          : ev.polarity === "dispersed"
          ? `阵型 · 分散 ${metrics.clustersCount} 组`
          : "阵型 · 散乱未成型";
      const sw = ctx.measureText(modeText).width + 18;
      const sx = w - sw - 14;
      ctx.fillStyle = ev.score === 5 ? PALETTE.okLight : "rgba(14, 16, 15, 0.84)";
      ctx.fillRect(sx, 12, sw, 24);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(modeText, sx + 9, 24);
    }
    ctx.restore();
  }

  function coverageLabel(pct) {
    return `${pct}%`;
  }

  // 复刻 304 原海报动态虚线引出标注（视觉中心 / 队形组织 / 聚散节奏）
  function drawPosterCallouts(ev, w, h) {
    const { primaryLead, checks, metrics } = ev;
    ctx.save();
    ctx.textBaseline = "middle";

    // (1) 视觉中心（右上引线指向红主角头顶）
    const leadX = primaryLead.headCx;
    const leadY = Math.max(44, primaryLead.topY - 22);
    const lx = w - 122;
    const ly = 64;
    if (leadX < lx - 36) {
      ctx.strokeStyle = checks.focal.ok ? PALETTE.red : PALETTE.redTextLight;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(leadX + 26, leadY + 6);
      ctx.lineTo(lx - 24, ly);
      ctx.lineTo(lx - 6, ly);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PALETTE.redTextLight;
      ctx.textAlign = "left";
      ctx.fillText("视觉中心", lx, ly - 7);
      ctx.font = `500 10px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.fillText(checks.focal.tag, lx, ly + 8);
    }

    // (2) 队形组织（右中蓝虚线指向最右端阵营人物）
    const rightMost = [...ev.projected].sort((a, b) => b.cx - a.cx)[0];
    const gx = w - 122;
    const gy = h * 0.44;
    if (rightMost && rightMost.cx < gx - 24) {
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rightMost.headCx + rightMost.headR + 6, rightMost.headCy);
      ctx.lineTo(gx - 22, gy);
      ctx.lineTo(gx - 6, gy);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PALETTE.blueTextLight;
      ctx.textAlign = "left";
      ctx.fillText("队形组织", gx, gy - 7);
      ctx.font = `500 10px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.fillText(checks.grouping.tag, gx, gy + 8);
    }

    // (3) 聚散节奏（右下炭黑虚线）
    const ry = h * 0.78;
    const rx = w - 122;
    if (rightMost && rightMost.cx < rx - 24) {
      ctx.strokeStyle = PALETTE.inkLine;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(Math.min(rx - 44, rightMost.cx + rightMost.shoulderW * 0.55), ry);
      ctx.lineTo(rx - 8, ry);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PALETTE.ink;
      ctx.textAlign = "left";
      ctx.fillText("聚散节奏", rx, ry - 7);
      ctx.font = `500 10px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.fillText(checks.rhythm.tag, rx, ry + 8);
    }

    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    if (!sizeReady) measureSize();
    const animating = !still && (introT < 1 || gazeAnim > 0);
    if (!dirty && !animating && !still) return;

    const state = getState();
    if (still) {
      introT = 1;
      if (gazeAnim > 0) gazeAnim = 1;
    } else {
      if (introT < 1) introT = Math.min(1, introT + (dt || 0.016) * 2.2);
      if (gazeAnim > 0) {
        gazeAnim += (dt || 0.016) * 0.85;
        if (gazeAnim >= 1.35) gazeAnim = 0;
      }
    }

    if (dirty || !lastEval) {
      lastEval = evaluateEnsemble(state, cssW, cssH);
    }
    const ev = lastEval;

    drawBackdrop(state, cssW, cssH);

    // 开场柔和缓入（任何一帧都清晰完整，0.9s 截图绝不残缺）
    const ease = 1 - Math.pow(1 - introT, 3);
    const collideSet = new Set(ev.metrics.headCollisionPairs.flatMap(([a, b]) => [a, b]));
    const probe = state.activeProbe;

    // 景深由后往前逐层绘制剪纸剪影（仅在视觉中心未分裂抢戏时才在主角头顶戴上原海报三条朱红放射线）
    const showHeroCrown = ev.checks.focal.fault !== "multiRed";
    for (const p of ev.drawOrder) {
      const yLift = still ? 0 : (1 - ease) * (14 + p.zIndex * 2.5);
      const shifted = yLift > 0.1
        ? { ...p, topY: p.topY + yLift, headCy: p.headCy + yLift, torsoTop: p.torsoTop + yLift, baseY: p.baseY + yLift }
        : p;
      const isLead = showHeroCrown && p.index === ev.primaryLead.index;
      const isDimmed = probe === "focal" && p.index !== ev.primaryLead.index && p.role !== "red";

      drawCutoutSilhouette(ctx, shifted, {
        rimColor: PALETTE.cutoutRim,
        rimWidth: cssW < 460 ? 3.0 : 4.0,
        isLead,
        isSelected: p.index === state.selectedId,
        isDimmed,
        isColliding: collideSet.has(p.index),
        highlightProbe: probe,
        t,
        still,
      });
    }

    drawDiagnosticOverlays(state, ev, cssW, cssH, t);

    dirty = false;
    if (domDirty && onRenderEval) {
      domDirty = false;
      onRenderEval(ev);
    }
  }

  // 命中检测：从最前景往后景查点到了哪一位剪影
  function hitActor(px, py) {
    if (!lastEval) return null;
    for (let z = lastEval.drawOrder.length - 1; z >= 0; z--) {
      const p = lastEval.drawOrder[z];
      const inHead = Math.hypot(px - p.headCx, py - p.headCy) <= p.headR + 8;
      const inTorso =
        px >= p.cx - p.shoulderW * 0.54 &&
        px <= p.cx + p.shoulderW * 0.54 &&
        py >= p.torsoTop - 4 &&
        py <= p.baseY + 6;
      if (inHead || inTorso) return p;
    }
    return null;
  }

  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function beginDrag(px, py, pointerId) {
    const state = getState();
    const hit = hitActor(px, py);
    if (hit) {
      dragging = {
        kind: "actor",
        actorIndex: hit.index,
        startX: px,
        startY: py,
        origX: hit.effX,
        origY: state.actors[hit.index].y,
        origH: state.actors[hit.index].h,
        origSpread: state.spread,
        moved: false,
        pointerId,
      };
      // 把所有激活人物的当前聚散有效坐标烘焙到基准点，防止拖动单人时其余人物跳位
      const snapshot = lastEval ? lastEval.projected.map((p) => ({ index: p.index, effX: p.effX })) : [];
      onMutate((s) => {
        for (const item of snapshot) {
          if (s.actors[item.index]) s.actors[item.index].x = item.effX;
        }
        s.baseSpread = s.spread;
        s.selectedId = hit.index;
      }, false);
    } else {
      dragging = {
        kind: "spread",
        startX: px,
        startY: py,
        origSpread: state.spread,
        moved: false,
        pointerId,
      };
    }
  }

  function moveDrag(px, py) {
    if (!dragging) return;
    const dx = px - dragging.startX;
    const dy = py - dragging.startY;
    if (Math.hypot(dx, dy) > 5) dragging.moved = true;
    if (!dragging.moved) return;

    if (dragging.kind === "actor") {
      onMutate((s) => {
        // 先同步当前 spread 基准，再直接改被拖人物的 x/y/h
        const a = s.actors[dragging.actorIndex];
        if (!a) return;
        const newX = clamp(dragging.origX + dx / cssW, 0.09, 0.91);
        const newY = clamp(dragging.origY + dy / cssH, 0.58, 0.94);
        // 向下拖进前景略微调大，或向上拖主角提拔高位
        const dH = dragging.actorIndex === 0 ? -dy / cssH * 0.35 : dy / cssH * 0.16;
        a.x = newX;
        a.y = newY;
        a.h = clamp(dragging.origH + dH, 0.24, 0.64);
        s.baseSpread = s.spread;
        s.presetId = "custom";
      }, false);
    } else {
      onMutate((s) => {
        s.spread = Math.round(clamp(dragging.origSpread + (dx / cssW) * 145, 0, 100));
        s.presetId = "custom";
      }, false);
    }
  }

  function endDrag() {
    if (!dragging) return;
    const wasTap = !dragging.moved && dragging.kind === "actor";
    const wasMoved = dragging.moved;
    const tappedIdx = dragging.actorIndex;
    dragging = null;

    if (wasMoved) {
      onMutate(() => {}, true);
    }

    // 轻点人物：切换其色层角色（红主/蓝阵/黑支/灰退），直观感受角色权重如何瞬间改写焦点！
    if (wasTap) {
      const order = ["red", "blue", "black", "grey"];
      onMutate((s) => {
        const a = s.actors[tappedIdx];
        if (!a) return;
        s.selectedId = tappedIdx;
        if (s.brush && s.brush !== "cycle") {
          a.role = s.brush;
        } else {
          a.role = order[(order.indexOf(a.role) + 1) % order.length];
        }
        s.presetId = "custom";
      }, true);
    }
  }

  // 仅标记脏位交由 rAF 合批重绘，避免拖动时同帧双画（拖结束或减少动态效果下再同步刷一次）
  function markDirty(syncDom = true) {
    dirty = true;
    if (syncDom) domDirty = true;
  }

  // 同时支持 Pointer Events（鼠标/触控板）与 Touch Events（兼容 perf.mjs dispatchTouchEvent）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    const pt = toLocal(e.clientX, e.clientY);
    beginDrag(pt.x, pt.y, e.pointerId);
    markDirty(false);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (dragging && dragging.pointerId === e.pointerId) {
      const pt = toLocal(e.clientX, e.clientY);
      moveDrag(pt.x, pt.y);
      markDirty(true);
    } else {
      const pt = toLocal(e.clientX, e.clientY);
      canvas.style.cursor = hitActor(pt.x, pt.y) ? "grab" : "ew-resize";
    }
  });
  const finishPointer = (e) => {
    if (e.pointerType === "touch") return;
    if (dragging && dragging.pointerId === e.pointerId) {
      endDrag();
      markDirty(true);
      ctrl.draw();
    }
  };
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);

  // 触屏监听：横向拖动画布（不阻止竖向滑动滚屏！）
  let touchAxis = null;
  let touchDomTick = 0;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const pt = toLocal(t0.clientX, t0.clientY);
    touchAxis = null;
    touchDomTick = 0;
    beginDrag(pt.x, pt.y, "touch");
    markDirty(false);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragging || dragging.pointerId !== "touch" || !e.touches.length) return;
    const t0 = e.touches[0];
    const pt = toLocal(t0.clientX, t0.clientY);
    const adx = Math.abs(pt.x - dragging.startX);
    const ady = Math.abs(pt.y - dragging.startY);
    if (!touchAxis && (adx > 4 || ady > 4)) {
      touchAxis = adx >= ady * 0.85 ? "x" : "y";
    }
    if (touchAxis === "x") {
      e.preventDefault();
      moveDrag(pt.x, pt.y);
      // 触屏连续拖动时每帧画画布，DOM 读数每 6 帧节流同步一次，彻底杜绝软件渲染下的整页重排掉帧
      markDirty((++touchDomTick % 6) === 0);
    } else if (touchAxis === "y" && dragging.kind === "spread") {
      dragging = null;
    } else if (touchAxis === "y" && dragging.kind === "actor") {
      e.preventDefault();
      moveDrag(pt.x, pt.y);
      markDirty((++touchDomTick % 6) === 0);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    if (dragging && dragging.pointerId === "touch") {
      endDrag();
      markDirty(true);
      ctrl.draw();
    }
    touchAxis = null;
  }, { passive: true });

  canvas.addEventListener("touchcancel", () => {
    dragging = null;
    touchAxis = null;
  }, { passive: true });

  const ctrl = loop(canvas, renderFrame);

  // 窗口变化时测量尺寸并重绘
  const ro = new ResizeObserver(() => {
    measureSize();
    ctrl.draw();
  });
  ro.observe(canvas);

  return {
    draw: () => {
      markDirty(true);
      ctrl.draw();
    },
    triggerGazePulse,
    getLastEval: () => lastEval,
  };
}
