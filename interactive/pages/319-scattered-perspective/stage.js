// 319 散点透视 · 开场黑漆星图 2D Canvas 渲染与直拖交互（stage.js）
// 1:1 承袭 319 原海报纯黑曜漆底、克莱因宝蓝、松石青碧与暖象牙几何母题。

import { loop, pixelRatio } from "../../lib/stage.js";
import { ANGLES, THEMES, TIERS, clampNodePos } from "./model.js";

const COL = {
  bg: "#040507",
  blue: "#2444D4",
  blueBright: "#7898FF",
  teal: "#228C88",
  tealBright: "#4CD6CE",
  ivory: "#ECE6D8",
  ivorySoft: "rgba(236, 230, 216, 0.56)",
  grid: "rgba(120, 152, 255, 0.09)",
  alert: "#FF7A6B",
  alertFill: "rgba(255, 122, 107, 0.14)",
};

export function createHeroStage(canvas, getState, getEval, handlers) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 560;
  let dpr = 1;
  let draggingId = null;
  let dragMoved = false;
  let startX = 0;
  let startY = 0;
  let grabOffset = { du: 0, dv: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
  }

  // 把逻辑坐标 0..1 映射到实际像素；若处于单灭点锁死态，对非中心点施加真实的透视收束畸变
  function projectNode(node, state, introK) {
    const cx = cssW * 0.5;
    const cy = cssH * 0.5;
    const rawX = node.u * cssW;
    const rawY = node.v * cssH;
    // 开场前 0.9 秒从中心略微舒展到当前位置（但绝不自动摆成答案！）
    let x = cx + (rawX - cx) * (0.72 + 0.28 * introK);
    let y = cy + (rawY - cy) * (0.72 + 0.28 * introK);
    let sx = 1;
    let sy = 1;
    let skew = 0;

    if (state.perspective === "single") {
      // 唯一灭点在画布中上偏右 (0.60, 0.24)
      const vpx = cssW * 0.60;
      const vpy = cssH * 0.24;
      const dx = x - vpx;
      const dy = y - vpy;
      const dist = Math.hypot(dx, dy) / Math.max(cssW, cssH);
      // 朝唯一灭点轻度收束并施加透视压扁畸变，保持节点清晰可辨
      const pull = 0.11;
      x = x - dx * pull;
      y = y - dy * pull;
      sx = Math.max(0.62, 1 - dist * 0.45);
      sy = Math.max(0.54, 0.78 - dist * 0.24);
      skew = Math.max(-0.36, Math.min(0.36, (dx / cssW) * 0.62));
    }
    const baseR = TIERS[node.tier].radius * Math.min(cssW, cssH);
    return { x, y, r: baseR, sx, sy, skew };
  }

  function drawPlus(x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
  }

  function drawDotMatrix(x, y, cols, rows, gap, r, color) {
    ctx.fillStyle = color;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.beginPath();
        ctx.arc(x + col * gap, y + row * gap, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 绘制背景原海报几何装饰（右上青碧点阵、左下青碧大点阵、空心小方框、十字星标）
  function drawBackdrop(state, ev) {
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    // 极细腻标尺辅助线
    if (state.guides) {
      ctx.strokeStyle = COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i <= 3; i++) {
        const gx = (cssW * i) / 4;
        const gy = (cssH * i) / 4;
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, cssH);
        ctx.moveTo(0, gy);
        ctx.lineTo(cssW, gy);
      }
      ctx.stroke();

      // 10% 安全边距框
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = ev.edgeClip ? "rgba(255, 122, 107, 0.42)" : "rgba(236, 230, 216, 0.14)";
      ctx.strokeRect(cssW * 0.095, cssH * 0.105, cssW * 0.81, cssH * 0.79);
      ctx.restore();
    }

    // 单灭点锁死时的放射灭点网格（直观展示单一消失点束缚）
    if (state.perspective === "single") {
      const vpx = cssW * 0.60;
      const vpy = cssH * 0.24;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 122, 107, 0.26)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      // 视平线
      ctx.beginPath();
      ctx.moveTo(0, vpy);
      ctx.lineTo(cssW, vpy);
      // 放射灭点线
      const rays = 10;
      for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2 + 0.18;
        ctx.moveTo(vpx, vpy);
        ctx.lineTo(vpx + Math.cos(ang) * cssW * 1.1, vpy + Math.sin(ang) * cssH * 1.1);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // 唯一灭点徽记
      ctx.fillStyle = COL.alert;
      ctx.beginPath();
      ctx.arc(vpx, vpy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.alert;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(vpx, vpy, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.fillStyle = COL.alert;
      ctx.textAlign = "left";
      ctx.fillText("VP · 单一灭点锁定", vpx + 18, vpy + 4);
      ctx.restore();
    }

    // 原海报右上 5×5 松石青碧点阵
    const gap = Math.max(9, Math.min(14, cssW * 0.017));
    drawDotMatrix(cssW - gap * 5.8, gap * 2.1, 5, 5, gap, 1.7, "rgba(76, 214, 206, 0.72)");
    // 原海报左下青碧点阵（自适应窄屏缩小行列避免拥挤）
    const blCols = cssW < 440 ? 5 : 7;
    const blRows = cssW < 440 ? 6 : 8;
    drawDotMatrix(gap * 1.6, cssH - gap * (blRows + 1.1), blCols, blRows, gap * 0.88, 1.5, "rgba(76, 214, 206, 0.52)");

    // 原海报点缀空心白框、菱形与十字星标
    ctx.strokeStyle = "rgba(236, 230, 216, 0.58)";
    ctx.lineWidth = 1.2;
    const sq = Math.max(14, Math.min(22, cssW * 0.026));
    ctx.strokeRect(cssW * 0.67, cssH * 0.14, sq, sq);
    ctx.strokeRect(cssW * 0.85, cssH * 0.88, sq * 0.9, sq * 0.9);

    drawPlus(cssW * 0.62, cssH * 0.11, 5.5, COL.ivorySoft);
    drawPlus(cssW * 0.08, cssH * 0.36, 5.5, COL.ivorySoft);
    drawPlus(cssW * 0.90, cssH * 0.54, 5.5, COL.ivorySoft);
    drawPlus(cssW * 0.74, cssH * 0.86, 5.5, COL.ivorySoft);

    // 原海报右下 4 点排（青青青白—）
    const ry = cssH * 0.83;
    const rx = cssW * 0.83;
    [COL.tealBright, COL.tealBright, COL.teal, COL.ivory].forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(rx + idx * 11, ry, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 绘制视点间的虚线呼应连脉
  function drawLinks(state, ev, projMap, t) {
    const pairs = ev.pairs;
    if (!pairs.length) return;
    const isChaos = state.linkMode === "chaos";
    const isHub = state.linkMode === "hub";

    ctx.save();
    ctx.lineDashOffset = -t * 18;
    pairs.forEach(([a, b], idx) => {
      const pa = projMap[a.id];
      const pb = projMap[b.id];
      const mx = (pa.x + pb.x) * 0.5;
      const my = (pa.y + pb.y) * 0.5;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      // 柔和弯弧，模拟原海报流动虚线曲线
      const bend = isChaos ? 0.05 : isHub ? (idx % 2 ? 0.12 : -0.12) : (idx % 2 ? 0.22 : -0.18);
      const cpx = mx - dy * bend;
      const cpy = my + dx * bend;

      ctx.strokeStyle = isChaos
        ? "rgba(255, 122, 107, 0.56)"
        : state.perspective === "single"
          ? "rgba(236, 230, 216, 0.32)"
          : "rgba(236, 230, 216, 0.62)";
      ctx.lineWidth = isChaos ? 1.2 : 1.35;
      ctx.setLineDash(isChaos ? [4, 4] : [5, 6]);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(cpx, cpy, pb.x, pb.y);
      ctx.stroke();

      // 曲径中点小方向箭头（非乱网时绘制，强化呼应方向）
      if (!isChaos) {
        const qx = 0.25 * pa.x + 0.5 * cpx + 0.25 * pb.x;
        const qy = 0.25 * pa.y + 0.5 * cpy + 0.25 * pb.y;
        const tx = pb.x - pa.x;
        const ty = pb.y - pa.y;
        const ang = Math.atan2(ty, tx);
        ctx.save();
        ctx.setLineDash([]);
        ctx.translate(qx, qy);
        ctx.rotate(ang);
        ctx.fillStyle = COL.ivory;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-4, -3.5);
        ctx.lineTo(-2.5, 0);
        ctx.lineTo(-4, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
    ctx.restore();
  }

  // 绘制单个视点内部的几何题材符号（完全抽象几何，不画五官）
  function drawNodeMotif(node, r, theme) {
    // 根据独立视角姿态微调内部构图几何（平视正面、俯瞰叠面、仰观拔柱）
    const ang = node.angle;

    if (theme === "poster") {
      if (node.id === "C") {
        // 原海报核心双叠中枢：暖象牙大方块 + 宝蓝波浪方块 + 左下松石青碧 1/4 扇形 + 象牙点阵
        const s = r * 0.92;
        ctx.fillStyle = COL.ivory;
        ctx.fillRect(-s * 0.92, -s * 0.86, s * 1.15, s * 1.02);
        ctx.fillStyle = COL.blue;
        ctx.fillRect(-s * 0.24, -s * 0.36, s * 1.12, s * 1.04);
        // 宝蓝块内三道象牙细波浪线
        ctx.strokeStyle = "rgba(236, 230, 216, 0.82)";
        ctx.lineWidth = 1.25;
        for (let w = 0; w < 3; w++) {
          const wy = -s * 0.08 + w * s * 0.26;
          ctx.beginPath();
          for (let k = 0; k <= 12; k++) {
            const px = -s * 0.1 + (k / 12) * s * 0.84;
            const py = wy + Math.sin(k * 1.45) * 2.6;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        // 左下青碧四分之一扇形
        ctx.fillStyle = COL.teal;
        ctx.beginPath();
        ctx.moveTo(-s * 0.92, s * 0.96);
        ctx.arc(-s * 0.92, s * 0.96, s * 0.62, -Math.PI / 2, 0);
        ctx.closePath();
        ctx.fill();
        // 右下微点阵
        drawDotMatrix(s * 0.18, s * 0.78, 4, 3, 5.2, 1.05, "rgba(236, 230, 216, 0.76)");
      } else if (node.id === "A" || node.id === "E") {
        // 原海报视点 A / E：宝蓝靶心实圆 + 中心黑瞳（俯瞰/仰观以弧环示意）
        ctx.fillStyle = COL.blue;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COL.bg;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(236, 230, 216, 0.44)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2.5, 3.5]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (node.id === "B") {
        // 原海报视点 B：宝蓝竖矩块 + 松石青碧圆 + 暖象牙小点
        ctx.fillStyle = COL.blue;
        ctx.fillRect(-r * 0.42, -r * 0.18, r * 0.36, r * 0.78);
        ctx.fillStyle = COL.teal;
        ctx.beginPath();
        ctx.arc(r * 0.28, -r * 0.24, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COL.ivory;
        ctx.beginPath();
        ctx.arc(r * 0.52, r * 0.36, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 原海报视点 D：象牙小方嵌青碧圆点 + 外缘宝蓝点
        const sq = r * 0.76;
        ctx.fillStyle = COL.ivory;
        ctx.fillRect(-sq * 0.5, -sq * 0.5, sq, sq);
        ctx.fillStyle = COL.teal;
        ctx.beginPath();
        ctx.arc(-sq * 0.08, sq * 0.08, sq * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COL.blue;
        ctx.beginPath();
        ctx.arc(r * 0.62, r * 0.45, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === "scroll") {
      // 汴河长卷几何抽象：虹桥、渡口、城门、郊林、瓦肆
      if (node.id === "C") {
        // 虹桥中枢：青碧河带 + 象牙拱桥 + 宝蓝船帆几何
        ctx.fillStyle = COL.teal;
        ctx.fillRect(-r * 0.9, r * 0.18, r * 1.8, r * 0.42);
        ctx.strokeStyle = COL.ivory;
        ctx.lineWidth = Math.max(2.5, r * 0.14);
        ctx.beginPath();
        ctx.arc(0, r * 0.48, r * 0.72, Math.PI * 1.12, Math.PI * 1.88);
        ctx.stroke();
        ctx.fillStyle = COL.blue;
        ctx.beginPath();
        ctx.moveTo(-r * 0.55, r * 0.12);
        ctx.lineTo(-r * 0.25, -r * 0.52);
        ctx.lineTo(-r * 0.1, r * 0.12);
        ctx.closePath();
        ctx.fill();
      } else if (node.id === "D") {
        // 城门双阙
        ctx.fillStyle = COL.ivory;
        ctx.fillRect(-r * 0.58, -r * 0.3, r * 1.16, r * 0.65);
        ctx.fillStyle = COL.bg;
        ctx.beginPath();
        ctx.arc(0, r * 0.35, r * 0.26, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = COL.blue;
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.3);
        ctx.lineTo(0, -r * 0.72);
        ctx.lineTo(r * 0.7, -r * 0.3);
        ctx.closePath();
        ctx.fill();
      } else if (node.id === "A") {
        // 郊林三松几何
        ctx.fillStyle = COL.teal;
        [-0.36, 0, 0.36].forEach((ox, i) => {
          const h = i === 1 ? 0.78 : 0.54;
          ctx.beginPath();
          ctx.moveTo(ox * r, -h * r);
          ctx.lineTo((ox - 0.24) * r, 0.35 * r);
          ctx.lineTo((ox + 0.24) * r, 0.35 * r);
          ctx.closePath();
          ctx.fill();
        });
      } else if (node.id === "B") {
        // 渡口水波与孤舟
        ctx.strokeStyle = COL.tealBright;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-r * 0.65, r * 0.28);
        ctx.lineTo(r * 0.65, r * 0.28);
        ctx.stroke();
        ctx.fillStyle = COL.ivory;
        ctx.beginPath();
        ctx.moveTo(-r * 0.48, r * 0.2);
        ctx.lineTo(r * 0.48, r * 0.2);
        ctx.lineTo(r * 0.28, r * 0.42);
        ctx.lineTo(-r * 0.3, r * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = COL.blue;
        ctx.fillRect(-r * 0.08, -r * 0.45, r * 0.34, r * 0.55);
      } else {
        // 瓦肆屋顶错落群
        ctx.fillStyle = COL.blue;
        ctx.fillRect(-r * 0.55, -r * 0.15, r * 0.55, r * 0.55);
        ctx.fillStyle = COL.ivory;
        ctx.fillRect(-r * 0.08, -r * 0.42, r * 0.62, r * 0.82);
        ctx.fillStyle = COL.teal;
        ctx.fillRect(r * 0.1, -r * 0.1, r * 0.25, r * 0.25);
      }
    } else {
      // 夜宴五屏：以折屏几何分隔五个独立空间场景
      ctx.strokeStyle = COL.ivory;
      ctx.lineWidth = 1.6;
      // 四扇折屏顶边
      ctx.beginPath();
      ctx.moveTo(-r * 0.68, -r * 0.46);
      ctx.lineTo(-r * 0.22, -r * 0.62);
      ctx.lineTo(r * 0.24, -r * 0.46);
      ctx.lineTo(r * 0.68, -r * 0.60);
      ctx.lineTo(r * 0.68, r * 0.42);
      ctx.lineTo(r * 0.24, r * 0.56);
      ctx.lineTo(-r * 0.22, r * 0.42);
      ctx.lineTo(-r * 0.68, r * 0.56);
      ctx.closePath();
      ctx.stroke();
      // 屏内主题色块
      ctx.fillStyle = node.id === "C" ? COL.blue : node.id === "B" || node.id === "D" ? COL.teal : COL.ivory;
      if (node.id === "A" || node.id === "D") {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-r * 0.26, -r * 0.26, r * 0.52, r * 0.52);
      }
      ctx.fillStyle = COL.tealBright;
      ctx.beginPath();
      ctx.arc(r * 0.36, r * 0.24, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }

    // 独立视角姿态微型角标（仅当散点多视点解放时显示）
    ctx.strokeStyle = ang === "bird" ? COL.tealBright : ang === "up" ? COL.blueBright : COL.ivory;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (ang === "bird") {
      // 向下俯瞰角标
      ctx.moveTo(-6, -r - 7);
      ctx.lineTo(0, -r - 2);
      ctx.lineTo(6, -r - 7);
    } else if (ang === "up") {
      // 向上仰观角标
      ctx.moveTo(-6, -r - 2);
      ctx.lineTo(0, -r - 8);
      ctx.lineTo(6, -r - 2);
    } else {
      // 平视横杠
      ctx.moveTo(-6, -r - 5);
      ctx.lineTo(6, -r - 5);
    }
    ctx.stroke();
  }

  function render(t, _dt, { still }) {
    resize();
    const state = getState();
    const ev = getEval();
    const introK = still ? 1 : Math.min(1, t / 0.72);
    const easedIntro = 1 - (1 - introK) ** 3;

    ctx.save();
    ctx.scale(dpr, dpr);

    drawBackdrop(state, ev);

    // 投影所有视点
    const projMap = {};
    for (const n of state.nodes) {
      projMap[n.id] = projectNode(n, state, easedIntro);
    }

    // 绘制视觉重心标记（单真源实算）
    if (state.guides) {
      const gx = ev.centroid.u * cssW;
      const gy = ev.centroid.v * cssH;
      const cx = cssW * 0.5;
      const cy = cssH * 0.5;
      ctx.save();
      ctx.strokeStyle = ev.lopsided ? "rgba(255, 122, 107, 0.6)" : "rgba(76, 214, 206, 0.34)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.setLineDash([]);
      // 平衡舒适圆（半径 14.5%）
      ctx.beginPath();
      ctx.arc(cx, cy, 0.145 * Math.min(cssW, cssH), 0, Math.PI * 2);
      ctx.stroke();
      // 实算重心点
      ctx.fillStyle = ev.lopsided ? COL.alert : COL.tealBright;
      ctx.beginPath();
      ctx.arc(gx, gy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 绘制连脉曲线
    drawLinks(state, ev, projMap, still ? 0 : t);

    // 若发生团挤，在最近两点间标出朱砂警告连杠
    if (ev.clumped && state.perspective === "scattered") {
      const p0 = projMap[ev.closestPair[0].id];
      const p1 = projMap[ev.closestPair[1].id];
      ctx.save();
      ctx.strokeStyle = COL.alert;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.restore();
    }

    // 绘制五个视点环（未选中先画，选中置顶）
    const order = [...state.nodes].sort((a, b) => (a.id === state.selected ? 1 : b.id === state.selected ? -1 : 0));
    const themeMeta = THEMES[state.theme] || THEMES.poster;

    for (const node of order) {
      const p = projMap[node.id];
      const isSelected = node.id === state.selected;
      const isEdgeBad = ev.edgeNodes.some((e) => e.id === node.id);
      const isClumpBad = ev.clumped && (ev.closestPair[0].id === node.id || ev.closestPair[1].id === node.id);
      const isAlert = state.perspective === "single" || isEdgeBad || isClumpBad;

      ctx.save();
      ctx.translate(p.x, p.y);
      if (state.perspective === "single") {
        ctx.transform(p.sx, 0, p.skew, p.sy, 0, 0);
      }

      // 选中柔光脉冲外圈
      if (isSelected) {
        const pulse = still ? 0 : Math.sin(t * 3.2) * 2.5;
        ctx.strokeStyle = isAlert ? COL.alert : COL.tealBright;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, p.r + 7 + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 原海报标志性同心虚线圆环
      ctx.strokeStyle = isAlert
        ? "rgba(255, 122, 107, 0.85)"
        : isSelected
          ? COL.ivory
          : "rgba(236, 230, 216, 0.45)";
      ctx.lineWidth = isSelected ? 1.4 : 1.05;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 内部题材几何
      drawNodeMotif(node, p.r, state.theme);
      ctx.restore();

      // 视点文字标签（按节点相对群心方位智能外放 + 暗底防重叠）
      const compact = cssW < 460;
      const tierTag = TIERS[node.tier].label;
      const mainLabel = compact ? `${node.id} · ${tierTag}` : themeMeta.names[node.id];
      const subLabel = compact ? "" : `${themeMeta.subs[node.id]} · ${tierTag}`;

      const gcx = ev.centroid.u * cssW;
      const gcy = ev.centroid.v * cssH;
      const above = p.y < gcy - 8 && p.y > p.r + 42;
      const leftOut = !above && p.x < gcx - 26;
      const rightOut = !above && p.x > gcx + 26;

      let lx = p.x;
      let ly = above ? p.y - p.r - (compact ? 14 : 24) : p.y + p.r + 18;
      if (leftOut && Math.abs(p.y - gcy) < 42) {
        lx = p.x - p.r - (compact ? 26 : 38);
        ly = p.y + 4;
      } else if (rightOut && Math.abs(p.y - gcy) < 42) {
        lx = p.x + p.r + (compact ? 26 : 38);
        ly = p.y + 4;
      }

      ctx.font = compact ? '600 11px "Noto Sans SC", sans-serif' : '600 12px "Noto Sans SC", sans-serif';
      const wMain = ctx.measureText(mainLabel).width;
      ctx.font = '400 10px "Space Mono", monospace';
      const wSub = subLabel ? ctx.measureText(subLabel).width : 0;
      const boxW = Math.max(wMain, wSub) + 12;
      const boxH = subLabel ? 30 : 18;

      const labelX = Math.max(boxW / 2 + 6, Math.min(cssW - boxW / 2 - 6, lx));
      const topFloor = !ev.diag.ok && labelX < 250 ? 54 : 30;
      const labelY = Math.max(topFloor, Math.min(cssH - boxH - 6, ly));

      ctx.fillStyle = "rgba(4, 5, 7, 0.86)";
      ctx.fillRect(labelX - boxW / 2, labelY - 12, boxW, boxH);

      ctx.font = compact ? '600 11px "Noto Sans SC", sans-serif' : '600 12px "Noto Sans SC", sans-serif';
      ctx.fillStyle = isAlert ? COL.alert : isSelected ? COL.ivory : "rgba(236, 230, 216, 0.90)";
      ctx.textAlign = "center";
      ctx.fillText(mainLabel, labelX, labelY);

      if (subLabel) {
        ctx.font = '400 10px "Space Mono", monospace';
        ctx.fillStyle = isSelected ? COL.tealBright : "rgba(176, 186, 203, 0.85)";
        ctx.fillText(subLabel, labelX, labelY + 13);
      }
    }

    // 在开场错态下给出一句克制的画内交互浮标（绝不遮挡文字，自动避开）
    if (!ev.diag.ok && cssW >= 320) {
      const hint = state.perspective === "single"
        ? "当前锁死单灭点 · 拖开视点环并解除锁死"
        : ev.clumped
          ? "视点团挤中心 · 拖开视点环拉出疏密"
          : ev.diag.badge;
      ctx.save();
      ctx.font = '500 11px "Noto Sans SC", sans-serif';
      const tw = ctx.measureText(hint).width + 20;
      const bx = 12;
      const by = 12;
      ctx.fillStyle = "rgba(11, 15, 23, 0.90)";
      ctx.fillRect(bx, by, tw, 26);
      ctx.strokeStyle = COL.alert;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, tw, 26);
      ctx.fillStyle = COL.alert;
      ctx.textAlign = "left";
      ctx.fillText(hint, bx + 10, by + 17);
      ctx.restore();
    }

    ctx.restore();
  }

  // 坐标换算与节点命中检测
  function pointToNorm(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      u: (clientX - rect.left) / Math.max(1, rect.width),
      v: (clientY - rect.top) / Math.max(1, rect.height),
      px: clientX - rect.left,
      py: clientY - rect.top,
    };
  }

  function hitNode(px, py) {
    const state = getState();
    let best = null;
    let bestD = Infinity;
    for (const n of state.nodes) {
      const p = projectNode(n, state, 1);
      const d = Math.hypot(px - p.x, py - p.y);
      const hitR = Math.max(32, p.r + 14);
      if (d <= hitR && d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = pointToNorm(e.clientX, e.clientY);
    const state = getState();
    let target = hitNode(pt.px, pt.py);
    // 若用户（或 perf 测试）从画布中心起手横拖且没正中节点，自动吸附到当前选中或最近视点
    if (!target) {
      let nearest = state.nodes[0];
      let minD = Infinity;
      for (const n of state.nodes) {
        const d = Math.hypot(n.u - pt.u, n.v - pt.v);
        if (d < minD) {
          minD = d;
          nearest = n;
        }
      }
      if (minD < 0.28) target = nearest;
    }
    if (!target) return;

    draggingId = target.id;
    dragMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    grabOffset = { du: target.u - pt.u, dv: target.v - pt.v };
    canvas.setPointerCapture?.(e.pointerId);
    handlers.onSelect(target.id);
  }

  function onPointerMove(e) {
    if (!draggingId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > 3) dragMoved = true;
    const pt = pointToNorm(e.clientX, e.clientY);
    const next = clampNodePos(pt.u + grabOffset.du, pt.v + grabOffset.dv);
    handlers.onMove(draggingId, next.u, next.v);
  }

  function onPointerUp(e) {
    if (!draggingId) return;
    canvas.releasePointerCapture?.(e.pointerId);
    if (!dragMoved && handlers.onTap) handlers.onTap(draggingId);
    draggingId = null;
  }

  // 触屏单指命中视点时阻止默认竖滚，允许全向精拖；在空白处上下滑时由 CSS touch-action: pan-y 放行页面滚动
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const pt = pointToNorm(t.clientX, t.clientY);
      if (hitNode(pt.px, pt.py)) {
        // 命中了具体视点：允许任意方向拖拽
        e.preventDefault();
      }
    },
    { passive: false }
  );

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  const ctl = loop(canvas, render);
  const ro = new ResizeObserver(() => ctl.draw());
  ro.observe(canvas);

  return {
    draw: ctl.draw,
    destroy: () => ro.disconnect(),
  };
}
