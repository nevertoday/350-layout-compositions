import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SCENES,
  JOINTS,
  CLUTTERS,
  PRESETS,
  QUIZ_ITEMS,
  createInitialState,
  clamp,
  normalizeDeg,
  setThetaOnState,
  clipLineToRect,
  analyzeComposition,
  computePoggendorff,
} from "./model.js";

const PALETTE = {
  paper: "#F5E9DA",
  paperLight: "#FBF5EC",
  paperWarm: "#EBE0CE",
  ink: "#111313",
  inkSoft: "#343736",
  red: "#DE451D",
  redText: "#B22E0D",
  redBright: "#FF8560",
  teal: "#3E7375",
  tealDeep: "#225659",
  tealLight: "#86D9D6",
  muddy: "#47251A",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// 统一的 DPR 缩放工具（最大 2 防止慢手机高 DPR 掉帧）
function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, aspect: w / h };
}

// =========================================================================
// 通用核心绘制函数：把 model.js 的单真源分析直接画成 026 建构主义构图
// （Hero 主舞台和 07 节盲测缩图共用，保证零误差）
// =========================================================================
function drawBeamPolygon(ctx, seg, widthPx, color, alpha = 1) {
  if (!seg) return;
  const [p0, p1] = seg;
  const dx = p1.px - p0.px;
  const dy = p1.py - p0.py;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  // 延伸出框外 120px，确保斜切干净利落不露缺角
  const ext = 120;
  const ax = p0.px - ux * ext;
  const ay = p0.py - uy * ext;
  const bx = p1.px + ux * ext;
  const by = p1.py + uy * ext;
  const nx = (-uy * widthPx) / 2;
  const ny = (ux * widthPx) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ax + nx, ay + ny);
  ctx.lineTo(bx + nx, by + ny);
  ctx.lineTo(bx - nx, by - ny);
  ctx.lineTo(ax - nx, ay - ny);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function computeIntersectionDiamond(cx, cy, lineA, lineB, wA, wB) {
  // 两条平行带交汇形成的平行四边形（菱形窗）的四个精确角点
  // 直线 A: a1*x + b1*y = ±wA/2（相对 (cx,cy) 局部坐标）
  // 直线 B: a2*x + b2*y = ±wB/2
  const a1 = lineA.a;
  const b1 = lineA.b;
  const a2 = lineB.a;
  const b2 = lineB.b;
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 0.08) return null;
  const solve = (c1, c2) => ({
    x: cx + (c1 * b2 - c2 * b1) / det,
    y: cy + (a1 * c2 - a2 * c1) / det,
  });
  const hA = wA * 0.5;
  const hB = wB * 0.5;
  return [solve(hA, hB), solve(hA, -hB), solve(-hA, -hB), solve(-hA, hB)];
}

function renderComposition(ctx, w, h, state, info, opts = {}) {
  const {
    progress = 1,
    showHandles = true,
    showQuads = true,
    compact = false,
    hoverPart = null,
    activeDrag = null,
    revealQuiz = false,
  } = opts;

  const scene = state.scene || "construct";
  // 1. 背景纸面
  if (scene === "arch") {
    ctx.fillStyle = "#EDE6DA";
    ctx.fillRect(0, 0, w, h);
    // 建筑玻璃中庭淡青天光斜切
    ctx.fillStyle = "rgba(62, 115, 117, 0.14)";
    ctx.beginPath();
    ctx.moveTo(w * 0.18, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.65);
    ctx.lineTo(w * 0.42, h * 0.45);
    ctx.closePath();
    ctx.fill();
    // 采光玻璃顶轻格网
    ctx.strokeStyle = "rgba(17, 19, 19, 0.08)";
    ctx.lineWidth = 1;
    const step = Math.max(24, Math.round(w / 14));
    for (let x = step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);
  }

  const cx = info.u * w;
  const cy = info.v * h;
  const wA = info.widthA * h;
  const wB = info.widthB * h;

  // 2. 负空间四象限轻标（仅展示大块的留白呼吸，不抢眼）
  if (showQuads && !compact) {
    info.quadrants.forEach((q, idx) => {
      if (q.areaFrac < 0.03 || !q.poly.length) return;
      if (q.id === info.largestQuad?.id && scene !== "arch") {
        ctx.save();
        ctx.fillStyle = "rgba(251, 245, 236, 0.48)";
        ctx.beginPath();
        q.poly.forEach((p, i) => {
          const px = (p.x / info.aspect) * w;
          const py = p.y * h;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      const qx = q.cu * w;
      const qy = q.cv * h;
      if (qx > 40 && qx < w - 40 && qy > 42 && qy < h - 34) {
        const txt = `Q${idx + 1} ${Math.round(q.areaFrac * 100)}%`;
        ctx.save();
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = "rgba(251, 245, 236, 0.88)";
        ctx.fillRect(qx - tw / 2 - 4, qy - 8, tw + 8, 16);
        ctx.fillStyle = PALETTE.inkSoft;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(txt, qx, qy + 0.5);
        ctx.restore();
      }
    });
  }

  // 3. 原海报几何配重元素（松青圆 + 朱红圆 + 虚线构造弧）
  if (scene === "construct") {
    const radA = info.lineA.rad;
    const radB = info.lineB.rad;
    // 跟随交汇中心与倾角偏移的松青圆（位于黑梁左上侧）和朱红圆（位于红梁右上/右中侧）
    const rTeal = h * (compact ? 0.14 : 0.155) * progress;
    const rRed = h * (compact ? 0.15 : 0.175) * progress;
    const tx = cx - Math.cos(radA) * (h * 0.08) - Math.sin(radA) * (h * 0.12);
    const ty = cy - Math.sin(radA) * (h * 0.08) + Math.cos(radA) * (h * 0.12);
    // 让松青圆落在交点左上方，朱红圆落在交点右下方呼应原海报
    const tealX = cx - h * 0.095;
    const tealY = cy - h * 0.115;
    const redX = cx + h * 0.175;
    const redY = cy + h * 0.03;

    // 极细虚线大圆弧（原海报核心视觉母题）
    if (!compact) {
      ctx.save();
      ctx.strokeStyle = "rgba(17, 19, 19, 0.36)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx + h * 0.04, cy + h * 0.05, h * 0.36 * progress, -Math.PI * 0.85, Math.PI * 0.68);
      ctx.stroke();
      ctx.setLineDash([]);
      // 另一段细实线松青弧
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx - h * 0.02, cy + h * 0.12, h * 0.24 * progress, Math.PI * 0.55, Math.PI * 1.05);
      ctx.stroke();
      ctx.restore();
    }

    // 松青大圆（被黑主梁部分遮切，完全复刻原海报）
    ctx.save();
    ctx.fillStyle = PALETTE.teal;
    ctx.beginPath();
    ctx.arc(tealX, tealY, rTeal, 0, Math.PI * 2);
    ctx.fill();
    // 朱红大圆
    ctx.fillStyle = PALETTE.red;
    ctx.beginPath();
    ctx.arc(redX, redY, rRed, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    void tx;
    void ty;
    void radB;
  }

  // 4. 辅助线或干扰杂线
  for (const ax of info.auxLines) {
    const seg = clipLineToRect(ax.line, info.aspect);
    if (!seg) continue;
    const p0 = { px: seg[0].u * w, py: seg[0].v * h };
    const p1 = { px: seg[1].u * w, py: seg[1].v * h };
    if (ax.kind === "guide") {
      ctx.save();
      ctx.strokeStyle = ax.color === "red" ? "rgba(222, 69, 29, 0.72)" : "rgba(17, 19, 19, 0.62)";
      ctx.lineWidth = compact ? 0.9 : 1.15;
      if (ax.color === "red") ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(p0.px, p0.py);
      ctx.lineTo(p1.px, p1.py);
      ctx.stroke();
      ctx.restore();
    } else {
      // 等粗杂线（错误状态铁丝网）
      const col = ax.color === "red" ? PALETTE.red : ax.color === "teal" ? PALETTE.teal : PALETTE.ink;
      drawBeamPolygon(ctx, [p0, p1], ax.widthFrac * h * progress, col, 0.88);
    }
  }

  // 5. 画黑主梁 A 与红次梁 B（带丝滑开场入场动画，每帧完整清晰）
  const toPxSeg = (seg) => {
    if (!seg) return null;
    const p0 = { px: seg[0].u * w, py: seg[0].v * h };
    const p1 = { px: seg[1].u * w, py: seg[1].v * h };
    if (progress >= 0.999) return [p0, p1];
    // 从交汇中心向两端迅速伸展
    const ease = 1 - Math.pow(1 - progress, 3);
    const lerp = (a, b) => a + (b - a) * (0.28 + 0.72 * ease);
    return [
      { px: lerp(cx, p0.px), py: lerp(cy, p0.py) },
      { px: lerp(cx, p1.px), py: lerp(cy, p1.py) },
    ];
  };

  const segAPx = toPxSeg(info.segA);
  const segBPx = toPxSeg(info.segB);

  const colorA = scene === "arch" ? "#1C2426" : PALETTE.ink;
  const colorB = scene === "arch" ? "#C84B24" : PALETTE.red;

  if (state.joint === "muddy") {
    // 先画红梁、再画黑梁、中间叠一层暗褐泥浊块
    drawBeamPolygon(ctx, segBPx, wB, colorB, 0.96);
    drawBeamPolygon(ctx, segAPx, wA, colorA, 0.92);
    const diamond = computeIntersectionDiamond(cx, cy, info.lineA, info.lineB, wA * 1.12, wB * 1.12);
    if (diamond) {
      ctx.save();
      ctx.fillStyle = PALETTE.muddy;
      ctx.beginPath();
      diamond.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (state.joint === "over") {
    // 清晰主压次 T 型遮挡：红梁在下，黑主梁加极细透气边压在上
    drawBeamPolygon(ctx, segBPx, wB, colorB, 1);
    drawBeamPolygon(ctx, segAPx, wA + (compact ? 2 : 3.5), PALETTE.paper, 0.92);
    drawBeamPolygon(ctx, segAPx, wA, colorA, 1);
  } else {
    // 026 原海报招牌工艺：反白镂空菱形光窗（Knockout）
    drawBeamPolygon(ctx, segBPx, wB, colorB, 1);
    drawBeamPolygon(ctx, segAPx, wA, colorA, 1);
    const diamond = computeIntersectionDiamond(cx, cy, info.lineA, info.lineB, wA, wB);
    if (diamond) {
      ctx.save();
      ctx.fillStyle = PALETTE.paperLight;
      ctx.beginPath();
      diamond.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 建筑模式桁架内斜撑细节
  if (scene === "arch" && segAPx && !compact) {
    ctx.save();
    ctx.strokeStyle = "rgba(251, 245, 236, 0.42)";
    ctx.lineWidth = 1.2;
    const dx = segAPx[1].px - segAPx[0].px;
    const dy = segAPx[1].py - segAPx[0].py;
    const len = Math.hypot(dx, dy);
    const steps = Math.max(6, Math.floor(len / 28));
    const ux = dx / len;
    const uy = dy / len;
    const nx = (-uy * wA) * 0.36;
    const ny = (ux * wA) * 0.36;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      const x0 = segAPx[0].px + dx * t0;
      const y0 = segAPx[0].py + dy * t0;
      const x1 = segAPx[0].px + dx * t1;
      const y1 = segAPx[0].py + dy * t1;
      if (i % 2 === 0) {
        ctx.moveTo(x0 + nx, y0 + ny);
        ctx.lineTo(x1 - nx, y1 - ny);
      } else {
        ctx.moveTo(x0 - nx, y0 - ny);
        ctx.lineTo(x1 + nx, y1 + ny);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // 书展封面模式：把真实标题字块自动安放到面积最大的负空间象限
  if (scene === "editorial" && info.largestQuad && !compact) {
    const q = info.largestQuad;
    const bx = clamp(q.cu * w, 72, w - 72);
    const by = clamp(q.cv * h, 52, h - 54);
    ctx.save();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '900 22px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("建构与空间", bx, by - 11);
    ctx.fillStyle = PALETTE.redText;
    ctx.font = '700 11px "Syne", sans-serif';
    ctx.fillText("AUTUMN EXHIBITION · 026", bx, by + 11);
    ctx.fillStyle = PALETTE.tealText;
    ctx.font = '500 10.5px "IBM Plex Mono", monospace';
    ctx.fillText(`主留白区 ${Math.round(q.areaFrac * 100)}%`, bx, by + 27);
    ctx.restore();
  }

  // 6. 原海报特征细纹：三道短斜杠记号 + 交角弧线标注
  if (scene === "construct" && !compact) {
    ctx.save();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.6;
    const gx = clamp(cx - h * 0.24, 24, w - 44);
    const gy = clamp(cy + h * 0.28, 30, h - 34);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(gx + i * 7, gy + 16);
      ctx.lineTo(gx + i * 7 + 14, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 7. 杂线过多时，高亮多出的冲突交点（让用户一眼看见「铁丝网」错在哪）
  if (state.clutter === "web" && !compact) {
    ctx.save();
    info.heavyPoints.forEach((pt) => {
      if (pt.isMain) return;
      const px = pt.u * w;
      const py = pt.v * h;
      ctx.fillStyle = PALETTE.paperLight;
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  // 8. 交角量角弧线
  if (!compact || revealQuiz) {
    ctx.save();
    const arcR = compact ? Math.min(w, h) * 0.14 : Math.min(w, h) * 0.125;
    let a1 = info.lineA.rad;
    let a2 = info.lineB.rad;
    // 取锐角扇区
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (Math.abs(diff) > Math.PI / 2) {
      a2 = a2 + (diff > 0 ? -Math.PI : Math.PI);
      diff = a2 - a1;
    }
    ctx.strokeStyle = info.checks.tension ? PALETTE.tealDeep : PALETTE.redText;
    ctx.lineWidth = compact ? 1.5 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, Math.min(a1, a2), Math.max(a1, a2));
    ctx.stroke();
    const mid = (a1 + a2) / 2;
    if (!compact) {
      const degTxt = `${Math.round(info.theta)}°`;
      const lx = clamp(cx + Math.cos(mid) * (arcR + 20), 26, w - 26);
      const ly = clamp(cy + Math.sin(mid) * (arcR + 20), 36, h - 22);
      ctx.font = '600 11.5px "IBM Plex Mono", monospace';
      const tw = ctx.measureText(degTxt).width;
      ctx.fillStyle = "rgba(251, 245, 236, 0.92)";
      ctx.fillRect(lx - tw / 2 - 4, ly - 8.5, tw + 8, 17);
      ctx.fillStyle = info.checks.tension ? PALETTE.tealDeep : PALETTE.redText;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(degTxt, lx, ly + 0.5);
    }
    ctx.restore();
  }

  // 9. 交互手柄（中心交汇环 + 黑/红双梁旋转环），采用原海报空心几何环！
  if (showHandles && !compact) {
    const drawRingHandle = (x, y, fill, stroke, r, isHot, label) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, isHot ? r + 2.5 : r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      if (label) {
        ctx.font = '700 10.5px "Inter", sans-serif';
        ctx.fillStyle = stroke;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, y + 0.5);
      }
      ctx.restore();
    };

    // 交汇中心拖拽环
    drawRingHandle(
      cx,
      cy,
      activeDrag === "node" || hoverPart === "node" ? PALETTE.red : PALETTE.paperLight,
      PALETTE.ink,
      10,
      activeDrag === "node" || hoverPart === "node",
      ""
    );

    // 计算两个梁的旋转握把位置（距交点一定半径，自动夹在画布内侧不越界）
    const handles = getBeamHandlesPx(info, w, h);
    drawRingHandle(
      handles.a.x,
      handles.a.y,
      PALETTE.paperLight,
      PALETTE.ink,
      11,
      activeDrag === "rotA" || hoverPart === "rotA",
      "A"
    );
    drawRingHandle(
      handles.b.x,
      handles.b.y,
      PALETTE.red,
      PALETTE.paperLight,
      11,
      activeDrag === "rotB" || hoverPart === "rotB",
      "B"
    );
  }
}

function getBeamHandlesPx(info, w, h) {
  const cx = info.u * w;
  const cy = info.v * h;
  const place = (line, prefSign) => {
    const r = Math.min(w, h) * 0.3;
    let x = cx + line.dx * r * prefSign;
    let y = cy + line.dy * r * prefSign;
    if (x < 26 || x > w - 26 || y < 34 || y > h - 26) {
      x = cx - line.dx * r * prefSign;
      y = cy - line.dy * r * prefSign;
    }
    return { x: clamp(x, 26, w - 26), y: clamp(y, 34, h - 26) };
  };
  return {
    a: place(info.lineA, 1),
    b: place(info.lineB, 1),
  };
}

// =========================================================================
// HERO 主舞台控制器
// =========================================================================
function initHero() {
  const state = createInitialState();
  const canvas = $("#heroCanvas");
  const shearTrack = $("#shearTrack");
  const shearThumb = $("#shearThumb");
  const ratioSlider = $("#ratioSlider");

  let introDone = reducedMotion.matches;
  let introT = introDone ? 1 : 0;
  let dirty = true;
  let hoverPart = null;
  let activeDrag = null;
  let lastInfo = null;

  function syncUI(info) {
    lastInfo = info;
    // 顶部状态胶囊
    const topChip = $("#topScoreChip");
    topChip.textContent = info.score === 4 ? "4 / 4 成立" : `${info.score} / 4 待调校`;
    topChip.className = `score-chip ${info.score === 4 ? "is-ok" : info.diag.level === "warn" ? "is-warn" : "is-err"}`;

    // 标题实时示范交叉图形联动
    const radA = (state.angleA * Math.PI) / 180;
    const radB = (state.angleB * Math.PI) / 180;
    const setSvgLine = (id, rad, len, sw) => {
      const el = $(id);
      if (!el) return;
      el.setAttribute("x1", (32 - Math.cos(rad) * len).toFixed(1));
      el.setAttribute("y1", (21 - Math.sin(rad) * len).toFixed(1));
      el.setAttribute("x2", (32 + Math.cos(rad) * len).toFixed(1));
      el.setAttribute("y2", (21 + Math.sin(rad) * len).toFixed(1));
      el.setAttribute("stroke-width", sw.toFixed(1));
    };
    setSvgLine("#titleBeamA", radA, 28, 7.2);
    setSvgLine("#titleBeamB", radB, 25, clamp(7.2 / state.ratio, 2.2, 7.2));

    // 四枚原海报彩色圆章灯
    for (const key of ["intersection", "structure", "contrast", "tension"]) {
      const li = $(`#medal-${key}`);
      const val = $(`#mval-${key}`);
      if (li) li.dataset.ok = String(info.checks[key]);
      if (val) val.textContent = info.badges[key];
    }

    // HUD
    $("#hudAngle").textContent = `夹角 ${Math.round(info.theta)}°`;
    $("#hudRatio").textContent = `宽比 ${info.ratio.toFixed(2)}×`;
    $("#hudQuads").textContent = `四区比 ${info.quadRatio > 20 ? ">20×" : info.quadRatio.toFixed(1) + "×"}`;

    // 交角绞剪尺同步（映射到 0°–90°）
    const pct = clamp((info.theta / 90) * 100, 5, 95);
    shearThumb.style.left = `${pct.toFixed(1)}%`;
    shearTrack.setAttribute("aria-valuenow", String(Math.round(info.theta)));
    const sr = $("#shearReadout");
    sr.textContent = `${Math.round(info.theta)}° · ${info.theta < 24 ? "过锐粘连" : info.theta > 84 ? "趋近正交" : "经验动势带"}`;
    sr.classList.toggle("is-ok", info.checks.tension);

    // 折线控台读数与控件态
    $("#valAngles").textContent = `${Math.round(state.angleA)}° / ${Math.round(state.angleB)}°`;
    $("#valCoord").textContent = `X ${Math.round(info.u * 100)}% · Y ${Math.round(info.v * 100)}%`;
    $("#valRatio").textContent = `${info.ratio.toFixed(2)}×`;
    ratioSlider.value = state.ratio.toFixed(2);
    $("#valJoint").textContent = JOINTS[state.joint].short;
    $("#valSpace").textContent = `净留白 ${info.whitespacePct}%`;

    $$("[data-scene]").forEach((b) => {
      const on = b.dataset.scene === state.scene;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $$("[data-joint]").forEach((b) => b.classList.toggle("is-active", b.dataset.joint === state.joint));
    $$("[data-clutter]").forEach((b) => b.classList.toggle("is-active", b.dataset.clutter === state.clutter));

    // 底部深松青 TIP 底座诊断
    const dock = $("#tipDock");
    dock.dataset.level = info.diag.level;
    $("#diagTag").textContent = info.diag.tag;
    $("#diagHeadline").textContent = info.diag.headline;
    $("#diagReason").textContent = info.diag.reason;
    $("#diagAction").textContent = info.diag.action;
    $("#metTheta").textContent = `${Math.round(info.theta)}°`;
    $("#metRatio").textContent = `${info.ratio.toFixed(2)}×`;
    $("#metCross").textContent = `${info.heavyPoints.length} 处`;
    $("#metSpace").textContent = `${info.whitespacePct}%`;

    // 右下迷你白线交叉方框实时同步
    const nx = 4 + info.u * 104;
    const ny = 4 + info.v * 70;
    const setMini = (id, rad) => {
      const el = $(id);
      if (!el) return;
      el.setAttribute("x1", (nx - Math.cos(rad) * 70).toFixed(1));
      el.setAttribute("y1", (ny - Math.sin(rad) * 70).toFixed(1));
      el.setAttribute("x2", (nx + Math.cos(rad) * 70).toFixed(1));
      el.setAttribute("y2", (ny + Math.sin(rad) * 70).toFixed(1));
    };
    setMini("#miniBeamA", radA);
    setMini("#miniBeamB", radB);
    $("#miniNode").setAttribute("cx", nx.toFixed(1));
    $("#miniNode").setAttribute("cy", ny.toFixed(1));
  }

  function renderHero(progress) {
    const { ctx, w, h, aspect } = fitCanvas(canvas);
    const info = analyzeComposition(state, aspect);
    renderComposition(ctx, w, h, state, info, {
      progress,
      showHandles: true,
      showQuads: true,
      hoverPart,
      activeDrag,
    });
    syncUI(info);
  }

  const heroLoop = loop(canvas, (t, dt, { still }) => {
    if (still) {
      introDone = true;
      introT = 1;
      if (dirty) {
        dirty = false;
        renderHero(1);
      }
      return;
    }
    if (!introDone) {
      introT = Math.min(1, introT + Math.max(dt, 0.016) / 0.72);
      renderHero(introT);
      if (introT >= 1) {
        introDone = true;
        dirty = false;
      }
      return;
    }
    if (dirty) {
      dirty = false;
      renderHero(1);
    }
  });

  const markDirty = () => {
    dirty = true;
    heroLoop.draw();
  };

  // --- 交角绞剪尺（data-perf-drag）同时完美响应鼠标、指针与触控事件 ---
  let shearDragging = false;
  function updateThetaFromClientX(clientX) {
    const rect = shearTrack.getBoundingClientRect();
    if (rect.width < 1) return;
    const frac = clamp((clientX - rect.left) / rect.width, 0.06, 1);
    let deg = Math.round(frac * 90);
    // 靠近 68°（经典斜交）或 90° 时极轻吸附
    if (Math.abs(deg - 68) <= 1.5) deg = 68;
    const next = setThetaOnState(state, clamp(deg, 6, 90));
    state.angleB = next.angleB;
    markDirty();
  }

  shearTrack.addEventListener("pointerdown", (e) => {
    shearDragging = true;
    shearTrack.setPointerCapture?.(e.pointerId);
    updateThetaFromClientX(e.clientX);
  });
  shearTrack.addEventListener("pointermove", (e) => {
    if (!shearDragging) return;
    updateThetaFromClientX(e.clientX);
  });
  const endShear = () => {
    shearDragging = false;
  };
  shearTrack.addEventListener("pointerup", endShear);
  shearTrack.addEventListener("pointercancel", endShear);

  // 额外监听原生 touch 事件，确保 CDP Input.dispatchTouchEvent 100% 每帧驱动重画
  shearTrack.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      shearDragging = true;
      updateThetaFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  shearTrack.addEventListener(
    "touchmove",
    (e) => {
      if (!shearDragging || !e.touches.length) return;
      updateThetaFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  shearTrack.addEventListener("touchend", endShear, { passive: true });

  shearTrack.addEventListener("keydown", (e) => {
    const cur = lastInfo ? lastInfo.theta : 14;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.angleB = setThetaOnState(state, cur + (e.shiftKey ? 8 : 3)).angleB;
      markDirty();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.angleB = setThetaOnState(state, cur - (e.shiftKey ? 8 : 3)).angleB;
      markDirty();
    }
  });

  // --- 画布内直接拖交汇点与旋转双梁 ---
  function hitTestCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const aspect = rect.width / Math.max(1, rect.height);
    const info = analyzeComposition(state, aspect);
    const cx = info.u * rect.width;
    const cy = info.v * rect.height;
    const handles = getBeamHandlesPx(info, rect.width, rect.height);
    if (Math.hypot(x - cx, y - cy) <= 24) return { part: "node", x, y, rect };
    if (Math.hypot(x - handles.a.x, y - handles.a.y) <= 24) return { part: "rotA", x, y, rect };
    if (Math.hypot(x - handles.b.x, y - handles.b.y) <= 24) return { part: "rotB", x, y, rect };
    return { part: null, x, y, rect };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const hit = hitTestCanvas(e.clientX, e.clientY);
    if (hit.part) {
      activeDrag = hit.part;
      canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
      markDirty();
    } else if (e.pointerType === "mouse") {
      // 桌面端点击画布空白处可直接把交点挪过去
      activeDrag = "node";
      state.u = clamp(hit.x / hit.rect.width, 0.1, 0.9);
      state.v = clamp(hit.y / hit.rect.height, 0.1, 0.9);
      canvas.setPointerCapture?.(e.pointerId);
      markDirty();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!activeDrag) {
      const hit = hitTestCanvas(e.clientX, e.clientY);
      if (hit.part !== hoverPart) {
        hoverPart = hit.part;
        canvas.style.cursor = hoverPart ? "grab" : "crosshair";
        markDirty();
      }
      return;
    }
    canvas.style.cursor = "grabbing";
    if (activeDrag === "node") {
      let u = clamp(x / rect.width, 0.1, 0.9);
      let v = clamp(y / rect.height, 0.1, 0.9);
      // 轻吸到原海报偏心点附近
      if (Math.hypot(u - 0.48, v - 0.43) < 0.022) {
        u = 0.48;
        v = 0.43;
      }
      state.u = u;
      state.v = v;
      markDirty();
    } else if (activeDrag === "rotA" || activeDrag === "rotB") {
      const cx = state.u * rect.width;
      const cy = state.v * rect.height;
      const deg = normalizeDeg((Math.atan2(y - cy, x - cx) * 180) / Math.PI);
      if (activeDrag === "rotA") state.angleA = deg;
      else state.angleB = deg;
      markDirty();
    }
  });

  const endCanvasDrag = () => {
    if (!activeDrag) return;
    activeDrag = null;
    canvas.style.cursor = hoverPart ? "grab" : "default";
    markDirty();
  };
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);

  // --- 右侧折线控台按钮与滑块 ---
  $$("[data-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.scene = btn.dataset.scene;
      markDirty();
    });
  });

  ratioSlider.addEventListener("input", () => {
    state.ratio = parseFloat(ratioSlider.value);
    markDirty();
  });

  $$("[data-joint]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.joint = btn.dataset.joint;
      markDirty();
    });
  });

  $$("[data-clutter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.clutter = btn.dataset.clutter;
      markDirty();
    });
  });

  $$("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      Object.assign(state, {
        u: p.u,
        v: p.v,
        angleA: p.angleA,
        angleB: p.angleB,
        ratio: p.ratio,
        joint: p.joint,
        clutter: p.clutter,
      });
      markDirty();
    });
  });

  $$("[data-nudge]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [du, dv] = btn.dataset.nudge.split(",").map(Number);
      state.u = clamp(state.u + du, 0.1, 0.9);
      state.v = clamp(state.v + dv, 0.1, 0.9);
      markDirty();
    });
  });

  window.addEventListener("resize", markDirty);
  // 首帧强制同步（保证 reducedMotion 与 check 0.9s 截图立见完整）
  renderHero(introDone ? 1 : 0.35);
}

// =========================================================================
// 01 节：四构图视线脉冲对比板（单斜线 / 平行线 / 汇聚线 / 交叉线）
// =========================================================================
function initSection01() {
  const canvas = $("#flowCanvas");
  const capEl = $("#flowCaption");
  let mode = "intersect";

  const CAPTIONS = {
    single: "<strong>单斜线（023 对角线）</strong>：视线从一端高速滑向另一端，动感强，但若没有拦截物，眼睛容易直接滑出画框。",
    parallel: "<strong>平行线（024 平行线）</strong>：方向完全一致、互不相交，眼睛平稳滑过整组韵律，传递宁静与秩序，不制造碰撞。",
    converge: "<strong>汇聚线（025 汇聚线）</strong>：多束射线朝远方同一个消失点收拢，核心作用是拉出强烈的三维纵深透视。",
    intersect: "<strong>交叉线（本页 026）</strong>：两股方向相异的力量在画内相遇，视线在交汇处急刹停驻，同时切出四块负空间骨架。",
  };

  const flowLoop = loop(canvas, (t, _dt, { still }) => {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, w, h);

    const phase = still ? 0.55 : (t * 0.42) % 1;
    const drawDot = (x, y, r, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    if (mode === "single") {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.86);
      ctx.lineTo(w * 0.9, h * 0.14);
      ctx.stroke();
      const px = w * (0.1 + 0.8 * phase);
      const py = h * (0.86 - 0.72 * phase);
      drawDot(px, py, 8, PALETTE.red);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = '600 12px "IBM Plex Mono", monospace';
      ctx.fillText("单向高速滑出 →", w * 0.62, h * 0.84);
    } else if (mode === "parallel") {
      for (let i = 0; i < 6; i++) {
        const y = h * (0.16 + i * 0.135);
        ctx.strokeStyle = i % 2 === 0 ? PALETTE.ink : PALETTE.teal;
        ctx.lineWidth = i === 2 ? 5 : 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.08, y);
        ctx.lineTo(w * 0.92, y);
        ctx.stroke();
        const px = w * (0.08 + ((phase + i * 0.13) % 1) * 0.84);
        drawDot(px, y, 4.5, PALETTE.red);
      }
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = '600 12px "IBM Plex Mono", monospace';
      ctx.fillText("互不相交 · 匀速韵律", w * 0.08, h * 0.93);
    } else if (mode === "converge") {
      const vx = w * 0.54;
      const vy = h * 0.36;
      const starts = [
        [0, h * 0.1],
        [0, h * 0.95],
        [w * 0.3, h],
        [w * 0.78, h],
        [w, h * 0.82],
        [w, h * 0.12],
      ];
      starts.forEach(([sx, sy], i) => {
        ctx.strokeStyle = i % 2 === 0 ? PALETTE.ink : PALETTE.teal;
        ctx.lineWidth = i === 1 || i === 4 ? 4.5 : 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(vx, vy);
        ctx.stroke();
        const px = sx + (vx - sx) * phase;
        const py = sy + (vy - sy) * phase;
        drawDot(px, py, 4.5, PALETTE.red);
      });
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vx, vy, 10 + (still ? 4 : Math.sin(t * 4) * 3), 0, Math.PI * 2);
      ctx.stroke();
      drawDot(vx, vy, 5, PALETTE.red);
    } else {
      // 交叉线：四块负空间 + 双梁 + 交汇急刹涟漪
      const ix = w * 0.45;
      const iy = h * 0.46;
      ctx.fillStyle = "rgba(62, 115, 117, 0.12)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.86, 0);
      ctx.lineTo(ix, iy);
      ctx.lineTo(0, h * 0.06);
      ctx.closePath();
      ctx.fill();

      // 黑主梁
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.94);
      ctx.lineTo(w * 0.84, h * 0.04);
      ctx.stroke();

      // 红次梁
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.16);
      ctx.lineTo(w * 0.86, h * 0.84);
      ctx.stroke();

      // 反白小菱窗
      ctx.fillStyle = PALETTE.paperLight;
      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(-0.18);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();

      // 双路视线脉冲在交汇处急刹停留
      const p1 = phase < 0.48 ? phase / 0.48 : phase < 0.7 ? 1 : 1 - (phase - 0.7) / 0.3;
      const ax = w * 0.14 + (ix - w * 0.14) * p1;
      const ay = h * 0.94 + (iy - h * 0.94) * p1;
      drawDot(ax, ay, 5.5, PALETTE.tealLight);

      const bx = w * 0.12 + (ix - w * 0.12) * p1;
      const by = h * 0.16 + (iy - h * 0.16) * p1;
      drawDot(bx, by, 5.5, PALETTE.ink);

      // 交汇驻留环
      const ringR = 13 + (still ? 5 : ((t * 18) % 16));
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.globalAlpha = still ? 0.8 : clamp(1 - (ringR - 13) / 16, 0.2, 0.9);
      ctx.beginPath();
      ctx.arc(ix, iy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const lbl = "视线急刹 · 焦距锁死";
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      const lw = ctx.measureText(lbl).width;
      const lx = clamp(ix - lw / 2, 12, w - lw - 24);
      const ly = iy + 28;
      ctx.fillStyle = "rgba(251, 245, 236, 0.94)";
      ctx.fillRect(lx - 6, ly - 11, lw + 12, 22);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - 6, ly - 11, lw + 12, 22);
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText(lbl, lx, ly + 4);
    }
  });

  $$("[data-flow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.flow;
      $$("[data-flow]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      capEl.innerHTML = CAPTIONS[mode];
      flowLoop.draw();
    });
  });
}

// =========================================================================
// 02 节：波根多夫（Poggendorff, 1860）交叉错觉实测台
// =========================================================================
function initSection02() {
  const canvas = $("#poggCanvas");
  const offsetSlider = $("#poggOffset");
  const angleSlider = $("#poggAngle");
  const widthSlider = $("#poggWidth");
  const revealBtn = $("#poggRevealBtn");
  const resetBtn = $("#poggResetBtn");
  const fbEl = $("#poggFeedback");

  const st = {
    offset: -26,
    angle: 36,
    barW: 94,
    revealed: false,
  };

  function drawPogg() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 淡参考格
    ctx.strokeStyle = "rgba(17, 19, 19, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const scale = w / 520;
    const g = computePoggendorff({
      barW: st.barW * scale,
      angleDeg: st.angle,
      userOffsetPx: st.offset * scale,
      W: w,
      H: h,
    });

    // 左侧固定朱红斜线
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(g.xL - g.dx, g.yL - g.dy);
    ctx.lineTo(g.xL, g.yL);
    ctx.stroke();

    // 右侧用户拖动朱红斜线
    ctx.beginPath();
    ctx.moveTo(g.xR, g.yUser);
    ctx.lineTo(g.xR + g.dx, g.yUser + g.dy);
    ctx.stroke();

    // 遮挡竖梁（验真时变半透明松青，露出真实延伸虚线！）
    ctx.fillStyle = st.revealed ? "rgba(17, 19, 19, 0.2)" : PALETTE.ink;
    ctx.fillRect(g.xL, 14, g.barW, h - 28);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(g.xL, 14, g.barW, h - 28);

    // 验真线：显示数学真实连线与用户偏移 Δpx
    if (st.revealed) {
      ctx.save();
      ctx.strokeStyle = PALETTE.tealDeep;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(g.xL - g.dx * 0.4, g.yL - g.dy * 0.4);
      ctx.lineTo(g.xR + g.dx * 0.65, g.yTrue + g.dy * 0.65);
      ctx.stroke();
      ctx.setLineDash([]);
      // 偏移垂直括号
      ctx.strokeStyle = PALETTE.redText;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(g.xR + 10, g.yTrue);
      ctx.lineTo(g.xR + 10, g.yUser);
      ctx.stroke();
      ctx.fillStyle = PALETTE.tealDeep;
      ctx.beginPath();
      ctx.arc(g.xR, g.yTrue, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 12px "IBM Plex Mono", monospace';
      ctx.fillStyle = PALETTE.redText;
      ctx.fillText(`Δ ${Math.round(st.offset)}px`, g.xR + 18, (g.yTrue + g.yUser) / 2 + 4);
      ctx.restore();
    }

    // 右侧出口拖柄（画成双箭头圆柄，清晰可拖）
    ctx.fillStyle = PALETTE.paperLight;
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(g.xR, g.yUser, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 11px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("↕", g.xR, g.yUser + 4);
    ctx.textAlign = "left";

    // 更新读数
    $("#poggAngleVal").textContent = `${st.angle}°（锐角 ${90 - st.angle}°）`;
    $("#poggWidthVal").textContent = `${st.barW} px`;
    $("#poggOffsetVal").textContent = st.revealed ? `偏 ${st.offset > 0 ? "+" : ""}${st.offset} px` : "待验真";

    if (st.revealed) {
      const absOff = Math.abs(st.offset);
      if (absOff <= 3) {
        fbEl.innerHTML = `<strong>验真结果：误差仅 ${absOff} px！</strong>你顶住了波根多夫错觉；多数人会把右端接得偏高 12–28 px，因为大脑自动扩张了相交处的 ${90 - st.angle}° 锐角。`;
      } else if (st.offset < 0) {
        fbEl.innerHTML = `<strong>验真结果：你的眼睛把右端接高了 ${absOff} px！</strong>这正是 1860 年波根多夫记录的经典方向——黑梁把斜线拦腰遮断后，锐角在知觉中被撑大，大脑以为直线应该从更高的位置出来。`;
      } else {
        fbEl.innerHTML = `<strong>验真结果：右端偏低了 ${absOff} px。</strong>试着加宽黑梁或把倾角调小到 26°–34°（更尖锐的交角），看看遮挡造成的视觉错位如何骤增。`;
      }
    } else {
      fbEl.textContent = "上下拖动右侧红线圆柄（或下方滑条），凭肉眼把它与左侧红线接成「一条笔直斜线」，再点「掀开遮挡验真」。";
    }
  }

  let draggingPogg = false;
  canvas.addEventListener("pointerdown", (e) => {
    draggingPogg = true;
    canvas.setPointerCapture?.(e.pointerId);
    updateFromY(e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!draggingPogg) return;
    updateFromY(e.clientY);
  });
  const endPogg = () => (draggingPogg = false);
  canvas.addEventListener("pointerup", endPogg);
  canvas.addEventListener("pointercancel", endPogg);

  function updateFromY(clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / 520;
    const g = computePoggendorff({
      barW: st.barW * scale,
      angleDeg: st.angle,
      userOffsetPx: 0,
      W: rect.width,
      H: rect.height,
    });
    const y = clientY - rect.top;
    st.offset = clamp(Math.round((y - g.yTrue) / scale), -56, 56);
    offsetSlider.value = String(st.offset);
    drawPogg();
  }

  offsetSlider.addEventListener("input", () => {
    st.offset = Number(offsetSlider.value);
    drawPogg();
  });
  angleSlider.addEventListener("input", () => {
    st.angle = Number(angleSlider.value);
    drawPogg();
  });
  widthSlider.addEventListener("input", () => {
    st.barW = Number(widthSlider.value);
    drawPogg();
  });
  revealBtn.addEventListener("click", () => {
    st.revealed = !st.revealed;
    revealBtn.setAttribute("aria-pressed", String(st.revealed));
    revealBtn.textContent = st.revealed ? "盖回黑梁盲调" : "掀开遮挡验真";
    drawPogg();
  });
  resetBtn.addEventListener("click", () => {
    st.offset = -26;
    st.angle = 36;
    st.barW = 94;
    st.revealed = false;
    offsetSlider.value = "-26";
    angleSlider.value = "36";
    widthSlider.value = "94";
    revealBtn.setAttribute("aria-pressed", "false");
    revealBtn.textContent = "掀开遮挡验真";
    drawPogg();
  });

  window.addEventListener("resize", drawPogg);
  drawPogg();
}

// =========================================================================
// 03 节：真实版样层级对照（海报 / 书封 / 产品展板 / 建筑摄影）
// =========================================================================
function initSection03() {
  const canvas = $("#specCanvas");
  const capEl = $("#specCaption");
  const st = { spec: "poster", ratioMode: "hier", joint: "knockout" };

  function drawSpec() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    const wA = h * 0.088;
    const wB = st.ratioMode === "equal" ? wA : wA / 2.4;
    const cx = w * 0.44;
    const cy = h * 0.48;
    const aspect = w / h;
    const tmpState = {
      scene: st.spec === "photo" ? "arch" : "construct",
      u: 0.44,
      v: 0.48,
      angleA: -46,
      angleB: 52,
      ratio: st.ratioMode === "equal" ? 1.0 : 2.4,
      joint: st.joint,
      clutter: "guide",
    };
    const info = analyzeComposition(tmpState, aspect);

    // 底层题材氛围
    if (st.spec === "book") {
      // 精装书脊阴影与封面边框
      ctx.fillStyle = PALETTE.paperWarm;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(w * 0.16, h * 0.06, w * 0.68, h * 0.88);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * 0.16, h * 0.06, w * 0.68, h * 0.88);
      ctx.save();
      ctx.beginPath();
      ctx.rect(w * 0.16, h * 0.06, w * 0.68, h * 0.88);
      ctx.clip();
      renderComposition(ctx, w, h, tmpState, info, { showHandles: false, showQuads: false, compact: true });
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '900 20px "Noto Sans SC", sans-serif';
      ctx.fillText("现代构成导论", w * 0.2, h * 0.22);
      ctx.fillStyle = PALETTE.tealText;
      ctx.font = '700 10.5px "Inter", sans-serif';
      ctx.fillText("BAUHAUS ARCHIVE SERIES", w * 0.2, h * 0.29);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText("VOL. 026", w * 0.2, h * 0.86);
      ctx.restore();
    } else if (st.spec === "product") {
      renderComposition(ctx, w, h, tmpState, info, { showHandles: false, showQuads: false, compact: true });
      // 极简工业手表/音箱剪影置于交汇光窗旁
      ctx.fillStyle = PALETTE.paperLight;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.tealDeep;
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '800 16px "Noto Sans SC", sans-serif';
      ctx.fillText("声学结构 026", w * 0.64, h * 0.22);
      ctx.font = '500 11.5px "IBM Plex Mono", monospace';
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText("DUAL-AXIS CHASSIS", w * 0.64, h * 0.3);
    } else if (st.spec === "photo") {
      renderComposition(ctx, w, h, tmpState, info, { showHandles: false, showQuads: false, compact: true });
      ctx.fillStyle = "rgba(17, 19, 19, 0.82)";
      ctx.fillRect(14, h - 38, 178, 24);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText("24mm · f/8 · 钢构中庭", 22, h - 22);
    } else {
      // 展览海报
      renderComposition(ctx, w, h, tmpState, info, { showHandles: false, showQuads: false, compact: true });
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '900 22px "Noto Sans SC", sans-serif';
      ctx.fillText("力量与交汇", 22, 42);
      ctx.fillStyle = PALETTE.redText;
      ctx.font = '700 11px "Syne", sans-serif';
      ctx.fillText("CONSTRUCTIVISM 2026", 22, 62);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText("11.25 — 12.30 / HALL B", w - 18, h - 18);
      ctx.textAlign = "left";
    }

    const rText = st.ratioMode === "equal" ? "1.0× 等粗（双梁平权互抢，字区也被压缩）" : "2.4× 主次分明（黑梁定骨架，红梁做穿刺）";
    const jText =
      st.joint === "muddy"
        ? "实压混色会在画面中心积出一团暗褐污斑"
        : st.joint === "over"
          ? "黑压红 T 型遮挡立刻拉出前后空间深度"
          : "反白镂空菱窗让最拥挤的交点瞬间透气发光";
    capEl.innerHTML = `<strong>${rText}</strong>；${jText}。`;
    void wB;
  }

  $$("[data-spec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      st.spec = btn.dataset.spec;
      $$("[data-spec]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      drawSpec();
    });
  });
  $$("[data-spec-ratio]").forEach((btn) => {
    btn.addEventListener("click", () => {
      st.ratioMode = btn.dataset.specRatio;
      $$("[data-spec-ratio]").forEach((b) => b.classList.toggle("is-active", b === btn));
      drawSpec();
    });
  });
  $$("[data-spec-joint]").forEach((btn) => {
    btn.addEventListener("click", () => {
      st.joint = btn.dataset.specJoint;
      $$("[data-spec-joint]").forEach((b) => b.classList.toggle("is-active", b === btn));
      drawSpec();
    });
  });

  window.addEventListener("resize", drawSpec);
  drawSpec();
}

// =========================================================================
// 04 节：原海报四种应用示例 1:1 活体分层解剖
// =========================================================================
function initSection04() {
  const layers = { beams: true, nodes: true, space: true, flow: false };
  const canvases = $$(".ex-canvas");

  function drawOne(canvas) {
    const type = canvas.dataset.ex;
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, w, h);

    if (type === "central") {
      if (layers.space) {
        ctx.fillStyle = "rgba(62, 115, 117, 0.1)";
        ctx.beginPath();
        ctx.moveTo(w * 0.14, h * 0.12);
        ctx.lineTo(w * 0.86, h * 0.12);
        ctx.lineTo(w * 0.5, h * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      if (layers.beams) {
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.14, h * 0.14);
        ctx.lineTo(w * 0.5, h * 0.5);
        ctx.lineTo(w * 0.86, h * 0.14);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.14, h * 0.86);
        ctx.lineTo(w * 0.5, h * 0.5);
        ctx.lineTo(w * 0.86, h * 0.86);
        ctx.stroke();
      }
      if (layers.nodes) {
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      if (layers.flow) drawFlowNum(ctx, [
        [w * 0.5, h * 0.5, "1"],
        [w * 0.5, h * 0.24, "2"],
        [w * 0.5, h * 0.78, "3"],
      ]);
    } else if (type === "multiple") {
      if (layers.space) {
        ctx.fillStyle = "rgba(222, 69, 29, 0.1)";
        ctx.beginPath();
        ctx.moveTo(w * 0.45, h * 0.42);
        ctx.lineTo(w * 0.75, h * 0.24);
        ctx.lineTo(w * 0.65, h * 0.65);
        ctx.closePath();
        ctx.fill();
      }
      if (layers.beams) {
        // 1 组主交叉 + 多条细辅线，忠实还原原海报第二格
        const segs = [
          [0.08, 0.72, 0.9, 0.24, PALETTE.ink, 4],
          [0.24, 0.12, 0.68, 0.9, PALETTE.ink, 3.2],
          [0.08, 0.34, 0.82, 0.88, PALETTE.ink, 1.8],
          [0.18, 0.88, 0.76, 0.12, PALETTE.red, 2.2],
          [0.44, 0.1, 0.92, 0.62, PALETTE.teal, 1.6],
        ];
        segs.forEach(([x1, y1, x2, y2, c, lw]) => {
          ctx.strokeStyle = c;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(w * x1, h * y1);
          ctx.lineTo(w * x2, h * y2);
          ctx.stroke();
        });
      }
      if (layers.nodes) {
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.arc(w * 0.49, h * 0.48, 7.5, 0, Math.PI * 2);
        ctx.fill();
        [[0.36, 0.55], [0.58, 0.35], [0.46, 0.68]].forEach(([u, v]) => {
          ctx.fillStyle = PALETTE.paperLight;
          ctx.strokeStyle = PALETTE.ink;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(w * u, h * v, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
      if (layers.flow) drawFlowNum(ctx, [
        [w * 0.49, h * 0.48, "1"],
        [w * 0.58, h * 0.35, "2"],
        [w * 0.36, h * 0.55, "3"],
      ]);
    } else if (type === "diagonal") {
      if (layers.space) {
        ctx.fillStyle = PALETTE.teal;
        ctx.beginPath();
        ctx.arc(w * 0.37, h * 0.78, h * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.42, h * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.16, h * 0.46, h * 0.055, 0, Math.PI * 2);
        ctx.fill();
      }
      if (layers.beams) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, h * 0.92);
        ctx.lineTo(w * 0.68, h * 0.08);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(w * 0.18, h * 0.08);
        ctx.lineTo(w * 0.62, h * 0.92);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(w * 0.14, h * 0.46);
        ctx.lineTo(w * 0.88, h * 0.88);
        ctx.stroke();
      }
      if (layers.nodes) {
        ctx.fillStyle = PALETTE.paperLight;
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w * 0.39, h * 0.51, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (layers.flow) drawFlowNum(ctx, [
        [w * 0.39, h * 0.51, "1"],
        [w * 0.78, h * 0.42, "2"],
        [w * 0.37, h * 0.78, "3"],
      ]);
    } else {
      // grid：正交黑网 + 一道朱红斜线 + 一块松青负空间（原海报第四格）
      if (layers.space) {
        ctx.fillStyle = PALETTE.teal;
        ctx.fillRect(w * 0.58, h * 0.34, w * 0.21, h * 0.46);
      }
      if (layers.beams) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2;
        [0.2, 0.58].forEach((u) => {
          ctx.beginPath();
          ctx.moveTo(w * u, h * 0.1);
          ctx.lineTo(w * u, h * 0.9);
          ctx.stroke();
        });
        [0.34, 0.8].forEach((v) => {
          ctx.beginPath();
          ctx.moveTo(w * 0.1, h * v);
          ctx.lineTo(w * 0.9, h * v);
          ctx.stroke();
        });
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, h * 0.9);
        ctx.lineTo(w * 0.72, h * 0.1);
        ctx.stroke();
      }
      if (layers.nodes) {
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.arc(w * 0.58, h * 0.29, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (layers.flow) drawFlowNum(ctx, [
        [w * 0.58, h * 0.29, "1"],
        [w * 0.68, h * 0.57, "2"],
        [w * 0.2, h * 0.8, "3"],
      ]);
    }
  }

  function drawFlowNum(ctx, pts) {
    ctx.save();
    ctx.strokeStyle = PALETTE.redText;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
    pts.forEach(([x, y, label]) => {
      ctx.fillStyle = PALETTE.redText;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.paperLight;
      ctx.font = '700 11px "IBM Plex Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, y + 0.5);
    });
    ctx.restore();
  }

  const drawAll = () => canvases.forEach(drawOne);
  $$("[data-layer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.layer;
      layers[k] = !layers[k];
      btn.classList.toggle("is-active", layers[k]);
      btn.setAttribute("aria-pressed", String(layers[k]));
      drawAll();
    });
  });

  window.addEventListener("resize", drawAll);
  drawAll();
}

// =========================================================================
// 05 节：历史溯源年代切片（严格核实：1860 / 1919–1920 / 1926 / 1954–1974）
// =========================================================================
function initSection05() {
  const canvas = $("#eraCanvas");
  const detailEl = $("#eraDetail");
  const ERAS = [
    {
      kicker: "1860 · 视知觉几何实验",
      title: "约翰·克里斯蒂安·波根多夫（Johann Christian Poggendorff）",
      body: "德国物理学家、《物理学与化学年鉴》主编波根多夫在审阅天体物理学家策尔纳（J. K. F. Zöllner）寄来的手稿时，发现被竖直粗带遮挡的斜线会产生显著错位感。它用实验证明：线条相交与遮挡不是冷冰冰的几何叠加，人脑会自动放大锐角并推断前后遮挡层级。",
      note: "核实来源：Michael Bach 视觉现象库（michaelbach.de）与格拉斯哥大学 The Illusions Index。",
    },
    {
      kicker: "1919–1920 · 俄国建构主义海报",
      title: "埃尔·利西茨基《以红楔攻打白军》",
      body: "波士顿美术馆（MFA，藏品号 2000.1069）藏有其 1920 年石版画印本。利西茨基用一枚锐利的朱红三角斜刺破白圆与黑块，确立了「红、黑、暖米白 + 强斜角穿刺 + 几何负空间」的冲突视觉语言——026 原海报的色板与斜梁构成，正直接继承了这一平面现代主义传统。",
      note: "核实来源：Museum of Fine Arts Boston 藏品档案（2000.1069）与维基百科条目标注。",
    },
    {
      kicker: "1926 · 包豪斯丛书第 9 卷",
      title: "瓦西里·康定斯基《点与线到面》",
      body: "1926 年慕尼黑首版（Punkt und Linie zu Fläche，由格罗皮乌斯与莫霍利-纳吉主编；1947 年由古根海姆基金会推出英译本）。康定斯基系统剖析了水平、垂直与斜线在基本平面上的心理温差与角张力（Spannungen），把「线的斜交如何激发平面能量」升格为可教可练的基础构成语法。",
      note: "核实来源：Bauhausbücher 9（1926）及古根海姆 1947 英译本书目。",
    },
    {
      kicker: "1954 首版 / 1974 修订 · 格式塔视觉心理学",
      title: "鲁道夫·阿恩海姆《艺术与视知觉》",
      body: "加州大学出版社出版的经典著作（Art and Visual Perception）。阿恩海姆从格式塔心理学出发指出：横竖轴对应重力与地平线的稳态，斜线因为偏离参考系而带有「亟待归位」的心理矢量；两条斜线交汇时会生成强诱导结构点，让静止画面活起来。",
      note: "核实来源：University of California Press 书目页（ucpress.edu）。",
    },
  ];

  let cur = 0;

  function drawEra() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    if (cur === 0) {
      // 1860 波根多夫错觉图式
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.84);
      ctx.lineTo(w * 0.86, h * 0.18);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(w * 0.4, h * 0.12, w * 0.2, h * 0.76);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.font = '600 12px "IBM Plex Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("1860", w * 0.5, h * 0.52);
      ctx.textAlign = "left";
    } else if (cur === 1) {
      // 1919-1920 利西茨基红楔构成致敬抽象图式
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(0, 0, w * 0.46, h);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.beginPath();
      ctx.arc(w * 0.66, h * 0.52, h * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.red;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.18);
      ctx.lineTo(w * 0.64, h * 0.54);
      ctx.lineTo(w * 0.24, h * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(w * 0.72, h * 0.18, 22, 22);
    } else if (cur === 2) {
      // 1926 康定斯基 点、线、锐角张力图式
      ctx.strokeStyle = "rgba(17,19,19,0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.14, h * 0.14, w * 0.72, h * 0.72);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.8);
      ctx.lineTo(w * 0.78, h * 0.22);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.22);
      ctx.lineTo(w * 0.76, h * 0.78);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.52, h * 0.48, h * 0.26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(w * 0.52, h * 0.48, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 1954/1974 阿恩海姆结构骨架与矢量张力场
      ctx.strokeStyle = "rgba(17,19,19,0.2)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 16);
      ctx.lineTo(w * 0.5, h - 16);
      ctx.moveTo(16, h * 0.5);
      ctx.lineTo(w - 16, h * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = PALETTE.tealDeep;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.84);
      ctx.lineTo(w * 0.82, h * 0.16);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.2);
      ctx.lineTo(w * 0.76, h * 0.84);
      ctx.stroke();
      // 矢量圆场
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 1.5;
      for (const r of [16, 30, 44]) {
        ctx.beginPath();
        ctx.arc(w * 0.47, h * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const e = ERAS[cur];
    detailEl.innerHTML = `
      <span class="era-kicker">${e.kicker}</span>
      <h3>${e.title}</h3>
      <p>${e.body}</p>
      <p class="era-note">${e.note}</p>
    `;
  }

  $$("[data-era]").forEach((btn) => {
    btn.addEventListener("click", () => {
      cur = Number(btn.dataset.era);
      $$("[data-era]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      drawEra();
    });
  });

  window.addEventListener("resize", drawEra);
  drawEra();
}

// =========================================================================
// 06 节：三联反例体检台（开/关交叉骨架，人像严格采用极简剪影无五官！）
// =========================================================================
function initSection06() {
  const btn = $("#avoidToggleBtn");
  const cArch = $("#avoidArchCanvas");
  const cPort = $("#avoidPortraitCanvas");
  const cArt = $("#avoidArticleCanvas");
  let withCross = true;

  function drawAll() {
    // 1. 建筑中庭正例
    {
      const { ctx, w, h } = fitCanvas(cArch);
      ctx.fillStyle = "#E8EFEF";
      ctx.fillRect(0, 0, w, h);
      // 天光窗
      ctx.fillStyle = "#FAF5EB";
      ctx.fillRect(w * 0.24, h * 0.14, w * 0.52, h * 0.64);
      if (withCross) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.92);
        ctx.lineTo(w * 0.88, 0);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, 0);
        ctx.lineTo(w * 0.92, h * 0.94);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(17,19,19,0.22)";
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.24, h * 0.14, w * 0.52, h * 0.64);
      }
      $("#avoidArchText").textContent = withCross
        ? "钢桁架斜交把视线精准收束到中庭光束上，结构与张力双赢。"
        : "移开斜交桁架后，方正天窗虽平静，却失去了纵深与力量感。";
    }

    // 2. 人像特写切颈反例（严格极简剪影侧影，绝不画五官！）
    {
      const { ctx, w, h } = fitCanvas(cPort);
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(0, 0, w, h);
      // 极简柔和圆形背景光斑
      ctx.fillStyle = PALETTE.paperWarm;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.44, h * 0.34, 0, Math.PI * 2);
      ctx.fill();
      // 极简人物头肩剪影（纯色无五官）
      ctx.fillStyle = "#2A3638";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, h * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.5 - h * 0.055, h * 0.49, h * 0.11, h * 0.1);
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.82, w * 0.26, h * 0.24, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.24, h * 0.82, w * 0.52, h * 0.18);

      if (withCross) {
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(w * 0.08, h * 0.22);
        ctx.lineTo(w * 0.92, h * 0.78);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, h * 0.82);
        ctx.lineTo(w * 0.88, h * 0.24);
        ctx.stroke();
      }
      $("#avoidPortraitText").textContent = withCross
        ? "粗斜梁正好在人物剪影的咽喉处打叉，像刀口一样制造强烈不适感。"
        : "移开交叉干扰后，纯色背景托住人像剪影，气质瞬间舒展干净。";
    }

    // 3. 长文阅读断行反例
    {
      const { ctx, w, h } = fitCanvas(cArt);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(0, 0, w, h);
      // 模拟干净段落文本行
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(w * 0.12, h * 0.14, w * 0.44, 7);
      ctx.fillStyle = "rgba(52,55,54,0.55)";
      for (let i = 0; i < 8; i++) {
        const y = h * (0.28 + i * 0.08);
        const shift = withCross ? (i % 3) * 18 : 0;
        ctx.fillRect(w * 0.12 + shift, y, w * 0.72 - shift, 3.5);
      }
      if (withCross) {
        ctx.strokeStyle = "rgba(222, 69, 29, 0.82)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(w * 0.06, h * 0.12);
        ctx.lineTo(w * 0.94, h * 0.88);
        ctx.stroke();
        ctx.strokeStyle = "rgba(17, 19, 19, 0.78)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.9);
        ctx.lineTo(w * 0.9, h * 0.12);
        ctx.stroke();
      }
      $("#avoidArticleText").textContent = withCross
        ? "粗斜线斜穿段落正文，强迫视线不断跳过障碍与阶梯行首，读两行就累。"
        : "撤掉交叉线后，左对齐横行恢复平稳节律，适合长时间沉浸阅读。";
    }
  }

  btn.addEventListener("click", () => {
    withCross = !withCross;
    btn.setAttribute("aria-pressed", String(withCross));
    btn.textContent = withCross ? "当前：叠入交叉线（点此移开）" : "当前：已移开交叉线（点此叠回）";
    drawAll();
  });

  window.addEventListener("resize", drawAll);
  drawAll();
}

// =========================================================================
// 07 节：两道单变量 4 选 1 盲测题（共用 model.js 同一渲染真源）
// =========================================================================
function initSection07() {
  let qIdx = 0;
  let picked = null;
  const promptEl = $("#quizPrompt");
  const resultEl = $("#quizResult");
  const cards = $$(".quiz-card");

  function renderQuiz() {
    const item = QUIZ_ITEMS[qIdx];
    promptEl.textContent = item.prompt;
    cards.forEach((card, i) => {
      const opt = item.options[i];
      card.classList.remove("is-right", "is-wrong");
      if (picked !== null) {
        if (i === item.correct) card.classList.add("is-right");
        else if (i === picked) card.classList.add("is-wrong");
      }
      const lbl = $(".quiz-lbl", card);
      lbl.textContent = picked !== null ? `${opt.label}（${opt.meta}）` : opt.label;

      const c = $(`#qCanvas${i}`);
      const { ctx, w, h, aspect } = fitCanvas(c);
      const st = { scene: "construct", ...opt.cfg };
      if (opt.cfg.outside) {
        // 交点落出框外的特殊选项
        ctx.fillStyle = PALETTE.paper;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = h * 0.08;
        ctx.beginPath();
        ctx.moveTo(w * 0.65, h * 0.98);
        ctx.lineTo(w * 1.04, h * 0.38);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = (h * 0.08) / 2.3;
        ctx.beginPath();
        ctx.moveTo(w * 0.04, h * 0.02);
        ctx.lineTo(w * 0.56, h * 0.14);
        ctx.stroke();
      } else {
        const info = analyzeComposition(st, aspect);
        renderComposition(ctx, w, h, st, info, {
          showHandles: false,
          showQuads: false,
          compact: true,
          revealQuiz: picked !== null,
        });
      }
      // 四个选项完全一致的文字骨架占位条（确保单变量！）
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(w * 0.1, h * 0.09, w * 0.34, 6);
      ctx.fillStyle = PALETTE.redText;
      ctx.fillRect(w * 0.1, h * 0.14, w * 0.22, 3);
      ctx.fillStyle = "rgba(17,19,19,0.45)";
      ctx.fillRect(w * 0.1, h * 0.88, w * 0.42, 3);
    });

    if (picked === null) {
      resultEl.className = "quiz-result";
      resultEl.textContent = "先仔细观察四版的交叉角、主次粗细差与负空间分块，点选你认为最成立的一版。";
    } else {
      const ok = picked === item.correct;
      const chosen = item.options[picked];
      const right = item.options[item.correct];
      resultEl.className = `quiz-result ${ok ? "is-right" : "is-wrong"}`;
      resultEl.innerHTML = ok
        ? `<strong>选择正确（${right.label}）：</strong>${right.why}`
        : `<strong>你选了 ${chosen.label}：</strong>${chosen.why}<br><strong>最佳解是 ${right.label}：</strong>${right.why}`;
    }
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      picked = Number(card.dataset.opt);
      renderQuiz();
    });
  });

  $$("[data-quiz]").forEach((btn) => {
    btn.addEventListener("click", () => {
      qIdx = Number(btn.dataset.quiz);
      picked = null;
      $$("[data-quiz]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      renderQuiz();
    });
  });

  $("#quizResetBtn").addEventListener("click", () => {
    picked = null;
    renderQuiz();
  });

  window.addEventListener("resize", renderQuiz);
  renderQuiz();
}

// =========================================================================
// 08 节：原海报全屏灯箱（仅复用 #poster.src，不重复内联图片！支持拖拽、缩放、Esc）
// =========================================================================
function initPosterLightbox() {
  const poster = $("#poster");
  const openBtn = $("#posterOpenBtn");
  const lb = $("#lightbox");
  const lbStage = $("#lbStage");
  const lbImg = $("#lbImg");
  const scaleText = $("#lbScaleText");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  const apply = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleText.textContent = `${Math.round(scale * 100)}%`;
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  };

  const open = () => {
    if (!lbImg.src) lbImg.src = poster.src;
    reset();
    lb.hidden = false;
    $("#lbClose").focus();
  };

  const close = () => {
    lb.hidden = true;
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  $("#lbClose").addEventListener("click", close);
  $("#lbReset").addEventListener("click", reset);
  $("#lbZoomIn").addEventListener("click", () => {
    scale = clamp(scale + 0.35, 1, 3.5);
    apply();
  });
  $("#lbZoomOut").addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3.5);
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.5);
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.setPointerCapture?.(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  const endDrag = () => (dragging = false);
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// =========================================================================
// 启动全部模块
// =========================================================================
initHero();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initSection07();
initPosterLightbox();
