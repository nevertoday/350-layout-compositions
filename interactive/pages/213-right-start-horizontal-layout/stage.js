// 213 横排右起 · 开场 2D Canvas 舞台：横幅右锚与半调波点牵引编排台
// 1:1 承袭 213 原海报暖白横幅、漆黑特粗主标、向左渐散绯红波点阵与左侧三服务矢量标。
// 单真源驱动（computeLayout）；触屏友好；省电高帧率（loop + pixelRatio + dirty flag）。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeLayout } from "./model.js";

const COLORS = {
  paper: "#FAF2EE",
  paperEdge: "#D4B8BD",
  crimson: "#D54467",
  crimsonDeep: "#A61E41",
  crimsonSoft: "rgba(213, 68, 103, 0.14)",
  ink: "#120C0E",
  inkSub: "#544448",
  ok: "#136F58",
  okSoft: "rgba(19, 111, 88, 0.14)",
  warn: "#A61E41",
  warnBg: "rgba(166, 30, 65, 0.10)",
};

const FONT_ZH = '"Noto Sans SC", sans-serif';
const FONT_EN = '"Bricolage Grotesque", "Noto Sans SC", sans-serif';
const FONT_MONO = '"Space Mono", monospace';

// 极简线性矢量图标（1:1 承袭原海报左三图标气质，绝不画人脸五官）
function drawMiniIcon(ctx, type, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.3, s * 0.065);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const r = s * 0.36;

  if (type === "truck") {
    ctx.strokeRect(-r * 1.05, -r * 0.55, r * 1.25, r * 0.9);
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.25);
    ctx.lineTo(r * 0.78, -r * 0.25);
    ctx.lineTo(r * 1.02, r * 0.05);
    ctx.lineTo(r * 1.02, r * 0.35);
    ctx.lineTo(r * 0.2, r * 0.35);
    ctx.stroke();
    for (const wx of [-r * 0.58, r * 0.62]) {
      ctx.beginPath();
      ctx.arc(wx, r * 0.45, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === "shield") {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.85, -r * 0.62);
    ctx.lineTo(r * 0.85, r * 0.1);
    ctx.quadraticCurveTo(r * 0.82, r * 0.72, 0, r * 1.02);
    ctx.quadraticCurveTo(-r * 0.82, r * 0.72, -r * 0.85, r * 0.1);
    ctx.lineTo(-r * 0.85, -r * 0.62);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, r * 0.02);
    ctx.lineTo(-r * 0.06, r * 0.3);
    ctx.lineTo(r * 0.42, -r * 0.24);
    ctx.stroke();
  } else if (type === "headset") {
    ctx.beginPath();
    ctx.arc(0, -r * 0.08, r * 0.78, Math.PI, 0);
    ctx.stroke();
    ctx.strokeRect(-r * 0.96, -r * 0.08, r * 0.32, r * 0.65);
    ctx.strokeRect(r * 0.64, -r * 0.08, r * 0.32, r * 0.65);
    ctx.beginPath();
    ctx.moveTo(r * 0.64, r * 0.55);
    ctx.quadraticCurveTo(r * 0.45, r * 0.96, 0, r * 0.92);
    ctx.stroke();
  } else if (type === "calendar") {
    ctx.strokeRect(-r * 0.85, -r * 0.72, r * 1.7, r * 1.5);
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, -r * 0.2);
    ctx.lineTo(r * 0.85, -r * 0.2);
    ctx.moveTo(-r * 0.38, -r * 0.95);
    ctx.lineTo(-r * 0.38, -r * 0.52);
    ctx.moveTo(r * 0.38, -r * 0.95);
    ctx.lineTo(r * 0.38, -r * 0.52);
    ctx.stroke();
  } else if (type === "pin") {
    ctx.beginPath();
    ctx.arc(0, -r * 0.22, r * 0.56, Math.PI * 0.8, Math.PI * 2.2);
    ctx.lineTo(0, r * 0.95);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r * 0.22, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === "book") {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.62);
    ctx.quadraticCurveTo(-r * 0.48, -r * 0.82, -r * 0.92, -r * 0.62);
    ctx.lineTo(-r * 0.92, r * 0.68);
    ctx.quadraticCurveTo(-r * 0.48, r * 0.48, 0, r * 0.68);
    ctx.quadraticCurveTo(r * 0.48, r * 0.48, r * 0.92, r * 0.68);
    ctx.lineTo(r * 0.92, -r * 0.62);
    ctx.quadraticCurveTo(r * 0.48, -r * 0.82, 0, -r * 0.62);
    ctx.moveTo(0, -r * 0.62);
    ctx.lineTo(0, r * 0.68);
    ctx.stroke();
  } else if (type === "mountain") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.98, r * 0.65);
    ctx.lineTo(-r * 0.25, -r * 0.72);
    ctx.lineTo(r * 0.25, r * 0.18);
    ctx.lineTo(r * 0.52, -r * 0.26);
    ctx.lineTo(r * 0.98, r * 0.65);
    ctx.closePath();
    ctx.stroke();
  } else if (type === "leaf") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, r * 0.72);
    ctx.quadraticCurveTo(-r * 0.72, -r * 0.68, r * 0.82, -r * 0.78);
    ctx.quadraticCurveTo(r * 0.68, r * 0.62, -r * 0.75, r * 0.72);
    ctx.moveTo(-r * 0.75, r * 0.72);
    ctx.lineTo(r * 0.35, -r * 0.35);
    ctx.stroke();
  } else {
    // box
    ctx.strokeRect(-r * 0.82, -r * 0.62, r * 1.64, r * 1.32);
    ctx.beginPath();
    ctx.moveTo(-r * 0.82, -r * 0.14);
    ctx.lineTo(r * 0.82, -r * 0.14);
    ctx.moveTo(0, -r * 0.62);
    ctx.lineTo(0, r * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrowHead(ctx, x, y, angle, size) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle - 0.45) * size, y - Math.sin(angle - 0.45) * size);
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle + 0.45) * size, y - Math.sin(angle + 0.45) * size);
  ctx.stroke();
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function createBannerStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 900;
  let cssH = 320;
  let lastLayout = null;
  let intro = reducedMotion.matches ? 1 : 0;
  let playPulse = -1; // >= 0 时播放视线光珠演练（0..1）
  let dirty = true;
  let dragging = null; // { target: 'focal'|'aux'|'pullEdge'|'pan', startX, startVal, pointerId }
  let hoverTarget = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.round(rect.width));
    const h = Math.max(196, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    cssW = w;
    cssH = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function render(t, dt, { still }) {
    // 若还在开场展开或视线光珠演练中，推进缓动；否则仅在 dirty 时重绘以省电
    let animating = false;
    if (still) {
      intro = 1;
      if (playPulse >= 0) playPulse = -1;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + (dt || 0.016) * 1.15);
        dirty = true;
        animating = true;
      }
      if (playPulse >= 0) {
        playPulse += (dt || 0.016) * 0.58;
        if (playPulse >= 1) playPulse = -1;
        dirty = true;
        animating = true;
      }
    }

    if (!dirty && !animating) return;
    dirty = false;

    const state = getState();
    const L = computeLayout(state, cssW, cssH);
    lastLayout = L;
    const { W, H } = L;
    const ease = 1 - Math.pow(1 - intro, 3);

    // 1. 暖白宣纸横幅底（1:1 复刻原海报版式示例纸面）
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    // 淡樱纸内细框与四角裁剪线标
    ctx.strokeStyle = COLORS.paperEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // 轻柔的右侧原点辐射浅粉晕（表达右侧视觉磁场的空间层次）
    const glowX = W * 0.92;
    const glowY = H * 0.5;
    const radGrad = ctx.createRadialGradient(glowX, glowY, 12, glowX, glowY, W * 0.42);
    radGrad.addColorStop(0, "rgba(251, 211, 215, 0.42)");
    radGrad.addColorStop(0.55, "rgba(251, 211, 215, 0.12)");
    radGrad.addColorStop(1, "rgba(251, 211, 215, 0)");
    ctx.fillStyle = radGrad;
    ctx.fillRect(1, 1, W - 2, H - 2);

      // 顶部极细横向刻度尺（标示 0% → 50% → 100% 右原点，辅助直觉理解重心位置）
      if (state.showGuides) {
        ctx.save();
        ctx.strokeStyle = "rgba(166, 30, 65, 0.16)";
        ctx.fillStyle = "rgba(104, 62, 72, 0.72)";
        ctx.font = `400 10px ${FONT_MONO}`;
        ctx.textBaseline = "top";
        for (const pct of [10, 25, 50, 75, 90]) {
          const tx = Math.round((W * pct) / 100) + 0.5;
          ctx.beginPath();
          ctx.moveTo(tx, 1);
          ctx.lineTo(tx, pct === 90 ? 9 : 6);
          ctx.stroke();
          if (W >= 520 || pct === 10 || pct === 50 || pct === 90) {
            ctx.textAlign = pct === 90 ? "right" : pct === 10 ? "left" : "center";
            const label = pct === 90 ? (W < 420 ? "右锚 90%" : "右锚区 90%") : `${pct}%`;
            ctx.fillText(label, pct === 90 ? tx - 3 : pct === 10 ? tx + 3 : tx, 8);
          }
        }
        // 理想右侧留白警戒带（右端 4% 窄条，避免贴边窒息）
        const safeEdgeX = W * 0.964;
        ctx.fillStyle = L.metrics.rightMarginPct < 3.6 ? "rgba(166, 30, 65, 0.16)" : "rgba(213, 68, 103, 0.05)";
        ctx.fillRect(safeEdgeX, 1, W - safeEdgeX - 1, H - 2);
        ctx.restore();
      }

    // 2. 标志性中段半调波点牵引阵（1:1 复刻原海报渐散圆点，按 4 档色阶批量填绘保证极高帧率！）
    if (state.pullMode !== "none") {
      const pb = L.pullBox;
      const cols = W < 480 ? 15 : 24;
      const rows = H < 230 ? 8 : 11;
      const stepX = pb.w / (cols - 1);
      const stepY = pb.h / (rows - 1);
      const maxR = clamp(Math.min(stepX, stepY) * 0.29, 1.8, 3.8);

      // 4 档透明度桶合并绘制，总计仅 4 次 fill() 调用
      const buckets = [[], [], [], []];
      const bucketStyles = [
        "rgba(213, 68, 103, 0.16)",
        "rgba(213, 68, 103, 0.34)",
        "rgba(213, 68, 103, 0.56)",
        "rgba(213, 68, 103, 0.80)",
      ];

      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1); // 0=左, 1=右
        // 开场自右向左波纹铺展
        const reveal = clamp((ease * 1.25 - (1 - u) * 0.25), 0.15, 1);
        let density;
        if (state.pullMode === "left") density = Math.pow(u, 1.25); // 右浓左淡：向左牵引
        else if (state.pullMode === "right") density = Math.pow(1 - u, 1.25); // 左浓右淡：反向推
        else density = 0.58; // flat：无方向平铺

        const x = pb.x + c * stepX;
        for (let r = 0; r < rows; r++) {
          const v = r / (rows - 1);
          const edgeFade = 1 - Math.abs(v - 0.5) * 0.38;
          const strength = clamp(density * edgeFade * reveal, 0.06, 1);
          const radius = maxR * (0.28 + 0.72 * strength);
          const bIdx = Math.min(3, Math.floor(strength * 3.99));
          buckets[bIdx].push(x, pb.y + r * stepY, radius);
        }
      }

      for (let b = 0; b < 4; b++) {
        const arr = buckets[b];
        if (!arr.length) continue;
        ctx.fillStyle = bucketStyles[b];
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 3) {
          ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]);
          ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // 波点阵左缘可拖滑柄与流向小标（低干扰，悬停/选中时加清）
      const pullHighlight = state.selected === "pull" || hoverTarget === "pullEdge" || dragging?.target === "pullEdge";
      ctx.save();
      const handleX = Math.round(pb.x) + 0.5;
      ctx.strokeStyle = pullHighlight ? COLORS.crimsonDeep : "rgba(213, 68, 103, 0.42)";
      ctx.lineWidth = pullHighlight ? 2 : 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(handleX, pb.y - 6);
      ctx.lineTo(handleX, pb.y + pb.h + 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // 滑柄小圆钮
      ctx.fillStyle = pullHighlight ? COLORS.crimsonDeep : COLORS.paper;
      ctx.strokeStyle = COLORS.crimson;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(handleX, pb.centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 中段波点流向微标：置于波点阵下沿，与底沿重心游标保持充裕垂直间距
      const narrowPull = pb.w < 120 || W < 560;
      const dirText =
        state.pullMode === "left"
          ? (narrowPull ? "← 渐散" : "← 波点向左渐散")
          : state.pullMode === "right"
            ? (narrowPull ? "逆推 →" : "波点向右逆推 →")
            : (narrowPull ? "平铺" : "波点无向平铺");
      ctx.font = `600 10px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = state.pullMode === "left" ? COLORS.ok : COLORS.crimsonDeep;
      const pullLabelX = clamp(pb.centerX, 46, W - 46);
      const pullLabelY = Math.min(H - 36, pb.y + pb.h + 5);
      ctx.fillText(dirText, pullLabelX, pullLabelY);
      ctx.restore();
    }

    // 3. 左侧三组辅助信息块（④：图标 + 中文标题 + 英文小字）
    {
      const ab = L.auxBox;
      const auxSelected = state.selected === "aux" || dragging?.target === "aux" || hoverTarget === "aux";
      const auxBad = L.metrics.auxCenterPct > L.metrics.focalCenterPct - 3 || state.weightMode !== "strong";

      ctx.save();
      // 柔和的选中/可拖外虚线框
      roundRectPath(ctx, ab.x - 8, ab.y - 8, ab.w + 16, ab.h + 16, 10);
      if (auxSelected) {
        ctx.fillStyle = "rgba(213, 68, 103, 0.06)";
        ctx.fill();
      }
      ctx.strokeStyle = auxBad
        ? "rgba(166, 30, 65, 0.55)"
        : auxSelected
          ? COLORS.crimson
          : "rgba(180, 145, 152, 0.36)";
      ctx.lineWidth = auxSelected ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 模块角标（④ 辅助信息）：严守虚线框顶边之上且不碰顶部刻度
      const auxLabel = W < 560 ? "④ 辅助 · 可拖" : "④ 辅助信息 · 可横拖";
      const auxLabelY = Math.max(23, ab.y - 12);
      ctx.font = `700 10px ${FONT_ZH}`;
      ctx.textBaseline = "bottom";
      ctx.fillStyle = auxBad ? COLORS.crimsonDeep : COLORS.inkSub;
      if (ab.x + 104 > W - 8) {
        ctx.textAlign = "right";
        ctx.fillText(auxLabel, Math.min(W - 8, ab.right + 4), auxLabelY);
      } else {
        ctx.textAlign = "left";
        ctx.fillText(auxLabel, Math.max(8, ab.x - 4), auxLabelY);
      }

      L.scene.aux.forEach((item, idx) => {
        const rowY = ab.y + idx * (ab.rowH + ab.rowGap);
        const iconCx = ab.x + ab.iconSize * 0.5;
        const iconCy = rowY + ab.rowH * 0.5;
        drawMiniIcon(ctx, item.icon, iconCx, iconCy, ab.iconSize, COLORS.ink);

        const tx = ab.x + ab.iconSize + 10;
        ctx.fillStyle = COLORS.ink;
        ctx.font = `700 ${L.sizes.auxTitleSize}px ${FONT_ZH}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.zh, tx, iconCy - L.sizes.auxSubSize * 0.62);

        ctx.fillStyle = COLORS.inkSub;
        ctx.font = `600 ${L.sizes.auxSubSize}px ${FONT_EN}`;
        ctx.fillText(item.en, tx, iconCy + L.sizes.auxTitleSize * 0.58);
      });
      ctx.restore();
    }

    // 4. 右侧焦点主标块（① + ②：眉标 + 双行特粗主标 + 绯红短横 + 副标）
    {
      const fb = L.focalBox;
      const focalSelected = state.selected === "focal" || dragging?.target === "focal" || hoverTarget === "focal";
      const edgeOk = L.metrics.rightEdgeSpreadPx <= 6;

      ctx.save();
      // 可拖焦点卡的纤细边界框
      roundRectPath(ctx, fb.x - 10, fb.y - 10, fb.w + 20, fb.h + 20, 10);
      if (focalSelected) {
        ctx.fillStyle = "rgba(213, 68, 103, 0.055)";
        ctx.fill();
      }
      ctx.strokeStyle = focalSelected ? COLORS.crimson : "rgba(180, 145, 152, 0.34)";
      ctx.lineWidth = focalSelected ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 右缘基准垂线（单真源锚线）
      const ax = Math.round(L.anchorRightX) + 0.5;
      const dotY = Math.max(24, fb.y - 16);
      ctx.strokeStyle = edgeOk && L.metrics.focalCenterPct >= 60 && L.metrics.rightMarginPct >= 3.6 ? COLORS.ok : COLORS.crimsonDeep;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(ax, dotY);
      ctx.lineTo(ax, Math.min(H - 22, fb.y + fb.h + 14));
      ctx.stroke();
      ctx.setLineDash([]);

      // 右轴顶端的原海报同心圆原点小徽
      ctx.fillStyle = edgeOk && L.metrics.focalCenterPct >= 60 ? COLORS.crimson : COLORS.crimsonDeep;
      ctx.beginPath();
      ctx.arc(ax, dotY, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(213, 68, 103, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax, dotY, 7.5, 0, Math.PI * 2);
      ctx.stroke();

      // 模块标签（① 焦点主标）：严守虚线框顶边之上、同心圆点之左
      const focalLabel = W < 560
        ? `① 焦点 ${L.metrics.focalCenterPct}%${edgeOk ? " · 右齐" : ""}`
        : `① 焦点原点 · ${L.metrics.focalCenterPct}%${edgeOk ? " · 右齐" : ` · 散差 ${L.metrics.rightEdgeSpreadPx}px`}`;
      const focalLabelY = Math.max(23, fb.y - 13);
      ctx.font = `700 10px ${FONT_ZH}`;
      ctx.textBaseline = "bottom";
      ctx.fillStyle = L.isSolved ? COLORS.ok : COLORS.crimsonDeep;
      const estLabelW = W < 560 ? 86 : 165;
      if (ax - 12 < estLabelW) {
        ctx.textAlign = "left";
        ctx.fillText(focalLabel, Math.max(8, fb.x - 4), focalLabelY);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(focalLabel, Math.min(W - 8, ax - 12), focalLabelY);
      }

      // 如果右缘不齐，实测标出每一行到右基准线的红色差距线！
      if (!edgeOk) {
        const linesToCheck = [L.badgeRect, L.titleRects[0], L.titleRects[1], L.subRect];
        ctx.strokeStyle = "rgba(166, 30, 65, 0.72)";
        ctx.fillStyle = "rgba(166, 30, 65, 0.12)";
        ctx.lineWidth = 1.2;
        for (const r of linesToCheck) {
          const gap = L.anchorRightX - (r.x + r.w);
          if (gap > 5) {
            ctx.fillRect(r.x + r.w, r.y + 2, gap, r.h - 4);
            ctx.beginPath();
            ctx.moveTo(r.x + r.w + 2, r.y + r.h * 0.5);
            ctx.lineTo(L.anchorRightX - 2, r.y + r.h * 0.5);
            ctx.stroke();
          }
        }
      }

      // 绘制眉标（★ 新品上市）
      ctx.fillStyle = COLORS.crimsonDeep;
      ctx.font = `700 ${L.sizes.badgeSize}px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(L.badgeRect.text, L.badgeRect.x, L.badgeRect.y);

      // 绘制双行特粗漆黑主标
      ctx.fillStyle = COLORS.ink;
      ctx.font = `900 ${L.sizes.titleSize}px ${FONT_ZH}`;
      for (const tr of L.titleRects) {
        ctx.fillText(tr.text, tr.x, tr.y);
      }

      // 标志绯红短横
      ctx.fillStyle = COLORS.crimson;
      ctx.fillRect(L.barRect.x, L.barRect.y, L.barRect.w, L.barRect.h);

      // 绘制副标
      ctx.fillStyle = COLORS.inkSub;
      ctx.font = `500 ${L.sizes.subSize}px ${FONT_ZH}`;
      ctx.fillText(L.subRect.text, L.subRect.x, L.subRect.y);
      ctx.restore();
    }

    // 5. 若发生模块碰撞压叠，实绘红色冲突警示区
    if (L.overlapRect) {
      const ov = L.overlapRect;
      ctx.save();
      ctx.fillStyle = "rgba(166, 30, 65, 0.20)";
      ctx.fillRect(ov.x, ov.y, ov.w, ov.h);
      ctx.strokeStyle = COLORS.crimsonDeep;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(ov.x, ov.y, ov.w, ov.h);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 6. 视线流向曲线与可播放绯红光珠（真实反映右起左展或错态折返）
    if (state.showFlow && L.pathPoints.length >= 2) {
      ctx.save();
      const pts = L.pathPoints;
      const lineColor = L.isSolved ? "rgba(19, 111, 88, 0.72)" : "rgba(166, 30, 65, 0.74)";
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.75;
      ctx.setLineDash(L.isSolved ? [6, 4] : [3, 4]);

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const mx = (p0.x + p1.x) * 0.5;
        const bend = p1.x > p0.x + 14 ? -32 : -14; // 逆向折返时上拱弧更高，一眼看出打结
        ctx.quadraticCurveTo(mx, Math.min(p0.y, p1.y) + bend, p1.x, p1.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 在末段画方向箭头
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
      drawArrowHead(ctx, last.x, last.y, ang, 8);

      // 演练光珠：按 playPulse 沿当前视线路径扫过
      if (playPulse >= 0) {
        const segs = pts.length - 1;
        const pos = playPulse * segs;
        const idx = Math.min(segs - 1, Math.floor(pos));
        const u = pos - idx;
        const p0 = pts[idx];
        const p1 = pts[idx + 1];
        const mx = (p0.x + p1.x) * 0.5;
        const my = Math.min(p0.y, p1.y) + (p1.x > p0.x + 14 ? -32 : -14);
        const bx = (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * mx + u * u * p1.x;
        const by = (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * my + u * u * p1.y;

        ctx.fillStyle = "rgba(213, 68, 103, 0.26)";
        ctx.beginPath();
        ctx.arc(bx, by, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.crimson;
        ctx.beginPath();
        ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. 底沿重心游标（单真源可视化整张横幅的实测视觉重心落点）
    if (state.showGuides) {
      const gx = (L.metrics.gravityPct / 100) * W;
      const gy = H - 8;
      ctx.save();
      ctx.strokeStyle = "rgba(180, 145, 152, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, gy);
      ctx.lineTo(W - 16, gy);
      ctx.stroke();

      // 重心小三角标
      const gOk = L.metrics.gravityPct >= 58;
      ctx.fillStyle = gOk ? COLORS.ok : COLORS.crimsonDeep;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 7);
      ctx.lineTo(gx - 5, gy);
      ctx.lineTo(gx + 5, gy);
      ctx.closePath();
      ctx.fill();

      ctx.font = `700 10px ${FONT_MONO}`;
      ctx.textAlign = gx > W - 95 ? "right" : gx < 95 ? "left" : "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`重心 ${L.metrics.gravityPct}%`, gx, gy - 9);
      ctx.restore();
    }
  }

  // 指针命中检测
  function hitTest(px, py) {
    if (!lastLayout) return "pan";
    const { focalBox, auxBox, pullBox } = lastLayout;
    const pad = 12;
    if (px >= focalBox.x - pad && px <= focalBox.right + pad && py >= focalBox.y - pad && py <= focalBox.y + focalBox.h + pad) {
      return "focal";
    }
    if (px >= auxBox.x - pad && px <= auxBox.right + pad && py >= auxBox.y - pad && py <= auxBox.y + auxBox.h + pad) {
      return "aux";
    }
    if (getState().pullMode !== "none" && Math.abs(px - pullBox.x) <= 18 && py >= pullBox.y - 12 && py <= pullBox.y + pullBox.h + 12) {
      return "pullEdge";
    }
    return "pan"; // 空白区横拖直接推拉主视觉焦点块，确保 perf drag 与自由拖拽都立刻响应！
  }

  function pointerCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // 兼容 PointerEvent 与 TouchEvent（tools/perf.mjs 发的是底层 touchStart/touchMove/touchEnd）
  function startDrag(px, py, pointerId = null) {
    const state = getState();
    const target = hitTest(px, py);
    const startVal =
      target === "aux" ? state.auxX : target === "pullEdge" ? state.pullSpan : state.focalX;
    dragging = { target, startX: px, startY: py, startVal, pointerId, lockedX: false };
    const nextSel = target === "aux" ? "aux" : target === "pullEdge" ? "pull" : "focal";
    if (state.selected !== nextSel) onMutate({ selected: nextSel });
    dirty = true;
  }

  function moveDrag(px, py) {
    if (!dragging) return;
    const dx = px - dragging.startX;
    const frac = dx / Math.max(240, cssW);
    if (dragging.target === "aux") {
      onMutate({ auxX: clamp(dragging.startVal + frac, 0.08, 0.90), selected: "aux" });
    } else if (dragging.target === "pullEdge") {
      // 向左拖拉长波点，向右拖缩短
      onMutate({ pullSpan: clamp(dragging.startVal - frac, 0.16, 0.52), selected: "pull" });
    } else {
      // focal 或 pan（空白处横拖推拉主焦点）
      onMutate({ focalX: clamp(dragging.startVal + frac, 0.24, 0.985), selected: "focal" });
    }
    dirty = true;
  }

  function endDrag() {
    dragging = null;
    dirty = true;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const { x, y } = pointerCoords(e);
    startDrag(x, y, e.pointerId);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    runner.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const { x, y } = pointerCoords(e);
    if (dragging && (dragging.pointerId === null || dragging.pointerId === e.pointerId)) {
      moveDrag(x, y);
      runner.draw();
      return;
    }
    const h = hitTest(x, y);
    if (h !== hoverTarget) {
      hoverTarget = h;
      canvas.style.cursor = h === "pan" ? "ew-resize" : "grab";
      dirty = true;
      runner.draw();
    }
  });

  canvas.addEventListener("pointerup", () => {
    if (dragging) { endDrag(); runner.draw(); }
  });
  canvas.addEventListener("pointercancel", () => {
    if (dragging) { endDrag(); runner.draw(); }
  });

  // 触屏兜底：横向拖动手势丝滑驱动画布，纵向滚动保持顺畅
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const t0 = e.touches[0];
    startDrag(t0.clientX - rect.left, t0.clientY - rect.top, "touch");
    runner.draw();
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragging || dragging.pointerId !== "touch" || e.touches.length !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const t0 = e.touches[0];
    const px = t0.clientX - rect.left;
    const py = t0.clientY - rect.top;
    if (!dragging.lockedX) {
      if (Math.abs(px - dragging.startX) >= Math.abs(py - dragging.startY) * 0.7) {
        dragging.lockedX = true;
      } else {
        dragging = null;
        return;
      }
    }
    if (e.cancelable) e.preventDefault();
    moveDrag(px, py);
    runner.draw();
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    if (dragging?.pointerId === "touch") { endDrag(); runner.draw(); }
  }, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(canvas);
  resize();

  const runner = loop(canvas, render);

  return {
    redraw() {
      dirty = true;
      runner.draw();
    },
    playFlowPulse() {
      if (reducedMotion.matches) return;
      playPulse = 0;
      dirty = true;
      runner.draw();
    },
    getLayout() {
      return computeLayout(getState(), cssW, cssH);
    },
  };
}
