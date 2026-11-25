// 041 三角构图 · 开场活体三角力学画布引擎（1:1 承袭原海报暖米宣纸、深松绿雪山、三光金日与琥珀金焦点圆）
import { loop, pixelRatio } from "../../lib/stage.js";
import { ASPECT, clamp, evaluateTriangle, computeFixTarget } from "./model.js";

const COL = {
  paper: "#F5ECDD",
  paperGrid: "rgba(6, 43, 32, 0.11)",
  pine: "#062B20",
  pineDeep: "#09261D",
  pineSky: "#2D4F40",
  pineMid: "#1B3D2F",
  pineShadow: "#0B241B",
  gold: "#D2971C",
  goldDeep: "#8E6004",
  goldLight: "#E8D09B",
  goldRidge: "#DFC384",
  goldCream: "#F4E5BF",
  err: "#A62C1E",
  errBg: "#9C261A",
  ok: "#0E6345",
  white: "#FBF7EF",
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createHeroStage(canvas, initialState, callbacks) {
  const ctx = canvas.getContext("2d");
  const state = initialState;

  let width = 600;
  let height = 520;
  let boxSize = 520;
  let boxX = 40;
  let boxY = 0;
  let dpr = 1;
  let dirty = true;
  let introProgress = 0; // 开场平滑入场（0 -> 1）
  let animTarget = null; // 预设/纠偏缓动目标
  let activeDrag = null; // { kind: 'a'|'b'|'c'|'f'|'sculpt', startX, startY, startState, lockedDir }
  let hoverHandle = null;
  let badgeRect = null; // 画布内就地红标可点区域
  let lastEval = evaluateTriangle(state);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20) return;
    dpr = pixelRatio(2);
    width = Math.round(rect.width);
    // 由 CSS 决定容器理想高度；若未固定高度，则按端自适应（手机竖屏高耸 ≥46% 屏高，桌面挺拔 1.14:1）
    const cssH = Math.round(rect.height);
    if (cssH >= 220) {
      height = cssH;
    } else {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw <= 520 && vh >= 660) {
        height = Math.round(Math.max(width * 1.06, vh * 0.465));
      } else if (vh <= 460 && vw > vh) {
        height = Math.round(Math.min(300, vh * 0.72));
      } else {
        height = Math.round(clamp(width * 0.84, 420, 620));
      }
      canvas.style.height = `${height}px`;
    }
    // 等比正方逻辑框居中，确保 60° 永远是 60°、圆永远是正圆
    boxSize = Math.min(width, height);
    boxX = (width - boxSize) * 0.5;
    boxY = (height - boxSize) * 0.5;

    const bw = Math.round(width * dpr);
    const bh = Math.round(height * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      dirty = true;
    }
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  function toPx(pt) {
    return { x: boxX + pt.x * boxSize, y: boxY + pt.y * boxSize };
  }

  function fromClient(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    return {
      x: clamp((px - boxX) / Math.max(1, boxSize), 0.04, 0.96),
      y: clamp((py - boxY) / Math.max(1, boxSize), 0.06, 0.93),
      px,
      py,
    };
  }

  function notify() {
    lastEval = evaluateTriangle(state);
    dirty = true;
    if (callbacks && callbacks.onChange) callbacks.onChange(state, lastEval);
  }

  function animateTo(targetState) {
    animTarget = {
      a: { ...targetState.a },
      b: { ...targetState.b },
      c: { ...targetState.c },
      f: { ...targetState.f },
      hierarchy: targetState.hierarchy,
    };
    if (typeof targetState.showGuide === "boolean") state.showGuide = targetState.showGuide;
    dirty = true;
    ctl.draw();
  }

  function setImmediate(targetState) {
    animTarget = null;
    state.a = { ...targetState.a };
    state.b = { ...targetState.b };
    state.c = { ...targetState.c };
    state.f = { ...targetState.f };
    state.hierarchy = targetState.hierarchy;
    if (typeof targetState.showGuide === "boolean") state.showGuide = targetState.showGuide;
    notify();
    ctl.draw();
  }

  // 在开放画布上横向塑形：将横向拖动流畅映射到展宽底边、扶平倾角并拔升/微倾顶峰
  function applyHorizontalSculpt(startState, dxNorm, dyNorm) {
    // dxNorm > 0 向右拖：逐步舒展并扶正三角形、拉起顶峰并把焦点引回重心；dxNorm < 0 向左拖：压扁或偏倾
    const spread = clamp(dxNorm * 1.15, -0.45, 0.55);
    const tiltShift = clamp(dyNorm * 0.45, -0.22, 0.22);

    // 根据横向拖拽连续塑造底宽、底倾与峰高
    const targetPos = {
      a: { x: 0.50, y: 0.17 },
      b: { x: 0.14, y: 0.84 },
      c: { x: 0.86, y: 0.84 },
      f: { x: 0.50, y: 0.63 },
    };

    if (spread >= 0) {
      // 向右拖：从当前态平滑推向正峰，超过 0.32 后继续向右偏出斜冲叙事势
      const k = clamp(spread / 0.34, 0, 1);
      const extraSkew = Math.max(0, spread - 0.34) * 0.55;
      state.a.x = clamp(lerp(startState.a.x, targetPos.a.x, k) + extraSkew, 0.16, 0.84);
      state.a.y = clamp(lerp(startState.a.y, targetPos.a.y, k) + tiltShift * 0.6, 0.14, 0.84);
      state.b.x = clamp(lerp(startState.b.x, targetPos.b.x, k), 0.10, 0.42);
      state.b.y = clamp(lerp(startState.b.y, targetPos.b.y, k), 0.20, 0.88);
      state.c.x = clamp(lerp(startState.c.x, targetPos.c.x, k), 0.58, 0.90);
      state.c.y = clamp(lerp(startState.c.y, targetPos.c.y, k), 0.20, 0.88);
      state.f.x = clamp(lerp(startState.f.x, targetPos.f.x, k) + extraSkew * 0.45, 0.12, 0.88);
      state.f.y = clamp(lerp(startState.f.y, targetPos.f.y, k) + tiltShift * 0.35, 0.14, 0.86);
      state.hierarchy = clamp(lerp(startState.hierarchy, 1.95, k), 1.0, 2.5);
    } else {
      // 向左拖：向左偏倾或收窄底边，双向都可连续体验几何变化
      const m = clamp(-spread / 0.38, 0, 1);
      state.a.x = clamp(startState.a.x - m * 0.18, 0.14, 0.86);
      state.a.y = clamp(startState.a.y + m * 0.14 + tiltShift * 0.5, 0.14, 0.86);
      state.b.x = clamp(startState.b.x + m * 0.12, 0.10, 0.46);
      state.c.x = clamp(startState.c.x - m * 0.12, 0.54, 0.90);
      state.c.y = clamp(startState.c.y - m * 0.08, 0.22, 0.88);
      state.f.x = clamp(startState.f.x - m * 0.08, 0.10, 0.90);
      state.hierarchy = clamp(startState.hierarchy - m * 0.25, 1.0, 2.5);
    }
  }

  function hitTest(px, py, isTouch) {
    // 1. 先检查画布内就地红标
    if (badgeRect && px >= badgeRect.x && px <= badgeRect.x + badgeRect.w && py >= badgeRect.y && py <= badgeRect.y + badgeRect.h) {
      return "badge";
    }
    const rHandle = isTouch ? 34 : 24;
    const fRadius = Math.max(isTouch ? 36 : 28, boxSize * 0.095);
    const pA = toPx(state.a);
    const pB = toPx(state.b);
    const pC = toPx(state.c);
    const pF = toPx(state.f);

    if (Math.hypot(px - pA.x, py - pA.y) <= rHandle) return "a";
    if (Math.hypot(px - pB.x, py - pB.y) <= rHandle) return "b";
    if (Math.hypot(px - pC.x, py - pC.y) <= rHandle) return "c";
    if (Math.hypot(px - pF.x, py - pF.y) <= fRadius) return "f";
    return "sculpt";
  }

  // === 绘制三大实景（裁入当前实绘三角形内） ===
  function drawLandscapeInside(pA, pB, pC, tier) {
    // 1:1 承袭 041 原海报雪山：深松绿苍穹 + 金阳峭峰 + 幽深山影
    const minY = Math.min(pA.y, pB.y, pC.y);
    const maxY = Math.max(pA.y, pB.y, pC.y);
    const baseY = Math.max(pB.y, pC.y);
    const spanX = Math.max(40, Math.abs(pC.x - pB.x));
    const spanY = Math.max(40, maxY - minY);

    const skyGrad = ctx.createLinearGradient(pA.x, minY, pA.x, maxY);
    skyGrad.addColorStop(0, "#2E5040");
    skyGrad.addColorStop(0.55, "#1E3B2E");
    skyGrad.addColorStop(1, "#092118");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 远景右侧次峰（随层次阶差拉开远近）
    const peakY = pA.y + spanY * (0.28 + (2.0 - tier) * 0.04);
    const peakX = lerp(pA.x, (pB.x + pC.x) * 0.5, 0.25);

    // 右后翼山脉（浅松青+阳面微金）
    ctx.beginPath();
    ctx.moveTo(pB.x - spanX * 0.15, baseY + 30);
    ctx.lineTo(peakX + spanX * 0.22, peakY + spanY * 0.16);
    ctx.lineTo(pC.x + spanX * 0.18, baseY + 30);
    ctx.closePath();
    ctx.fillStyle = "#244435";
    ctx.fill();

    // 主峰暗面（右侧深松绿体块）
    ctx.beginPath();
    ctx.moveTo(pB.x - spanX * 0.12, baseY + 30);
    ctx.lineTo(peakX - spanX * 0.18, peakY + spanY * 0.22);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(peakX + spanX * 0.12, peakY + spanY * 0.26);
    ctx.lineTo(peakX + spanX * 0.28, peakY + spanY * 0.18);
    ctx.lineTo(pC.x + spanX * 0.15, baseY + 30);
    ctx.closePath();
    ctx.fillStyle = "#0F2A1F";
    ctx.fill();

    // 主峰受光阳面（暖金日照雪脊，复刻原海报金峰明暗交界！）
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(peakX - spanX * 0.07, peakY + spanY * 0.14);
    ctx.lineTo(peakX - spanX * 0.14, peakY + spanY * 0.23);
    ctx.lineTo(peakX - spanX * 0.25, peakY + spanY * 0.44);
    ctx.lineTo(peakX - spanX * 0.08, peakY + spanY * 0.36);
    ctx.lineTo(peakX + spanX * 0.03, peakY + spanY * 0.21);
    ctx.lineTo(peakX + spanX * 0.11, peakY + spanY * 0.32);
    ctx.lineTo(peakX + spanX * 0.05, peakY + spanY * 0.15);
    ctx.closePath();
    const litGrad = ctx.createLinearGradient(peakX, peakY, peakX - spanX * 0.18, baseY);
    litGrad.addColorStop(0, COL.goldCream);
    litGrad.addColorStop(0.55, COL.goldRidge);
    litGrad.addColorStop(1, "rgba(182, 148, 78, 0.25)");
    ctx.fillStyle = litGrad;
    ctx.fill();

    // 右翼山脊暖金微光
    ctx.beginPath();
    ctx.moveTo(peakX + spanX * 0.28, peakY + spanY * 0.18);
    ctx.lineTo(peakX + spanX * 0.19, peakY + spanY * 0.32);
    ctx.lineTo(peakX + spanX * 0.29, peakY + spanY * 0.38);
    ctx.lineTo(peakX + spanX * 0.35, peakY + spanY * 0.29);
    ctx.closePath();
    ctx.fillStyle = "rgba(232, 208, 155, 0.72)";
    ctx.fill();

    // 山脊岩石刻画斜线（增强立体层级）
    ctx.strokeStyle = "rgba(10, 32, 24, 0.48)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(peakX, peakY + 4);
    ctx.lineTo(peakX - spanX * 0.04, peakY + spanY * 0.24);
    ctx.lineTo(peakX + spanX * 0.05, peakY + spanY * 0.48);
    ctx.stroke();

    // 近景山脚浓墨松林压底（层次由浅到深稳住底边）
    const footH = spanY * (0.18 + (tier - 1.0) * 0.08);
    ctx.beginPath();
    ctx.moveTo(pB.x - spanX * 0.12, baseY + 30);
    ctx.lineTo(pB.x + spanX * 0.22, baseY - footH * 0.85);
    ctx.lineTo(lerp(pB.x, pC.x, 0.5), baseY - footH * 0.45);
    ctx.lineTo(pC.x - spanX * 0.18, baseY - footH * 0.95);
    ctx.lineTo(pC.x + spanX * 0.14, baseY + 30);
    ctx.closePath();
    ctx.fillStyle = "#071E16";
    ctx.fill();
  }

  function drawPortraitInside(pA, pB, pC, tier) {
    // 人物构图：文艺复兴式三人剪影群像（严守规范：纯轮廓剪影，绝不画五官！）
    const minY = Math.min(pA.y, pB.y, pC.y);
    const maxY = Math.max(pA.y, pB.y, pC.y);
    const spanX = Math.max(60, Math.abs(pC.x - pB.x));
    const spanY = Math.max(60, maxY - minY);
    const cx = lerp(pA.x, (pB.x + pC.x) * 0.5, 0.35);

    const bgGrad = ctx.createLinearGradient(pA.x, minY, pA.x, maxY);
    bgGrad.addColorStop(0, "#244336");
    bgGrad.addColorStop(0.65, "#143025");
    bgGrad.addColorStop(1, "#081F17");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 柔暖背光拱晕（呼应文艺复兴肖像氛围）
    const halo = ctx.createRadialGradient(pA.x, pA.y + spanY * 0.32, 4, pA.x, pA.y + spanY * 0.38, spanX * 0.55);
    halo.addColorStop(0, "rgba(232, 208, 155, 0.34)");
    halo.addColorStop(1, "rgba(232, 208, 155, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    const headR = clamp(spanY * (0.095 + (tier - 1) * 0.015), 11, 30);
    const sideR = clamp(headR * (0.86 - (tier - 1) * 0.12), 9, 24);

    // 绘制极简优雅的半身剪影函数（绝无眼鼻口五官）
    const drawSilhouette = (hx, hy, r, shoulderW, fill, rim) => {
      ctx.fillStyle = fill;
      // 头部椭圆
      ctx.beginPath();
      ctx.ellipse(hx, hy, r * 0.88, r * 1.04, 0, 0, Math.PI * 2);
      ctx.fill();
      // 颈部与流畅垂肩斗篷轮廓
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.38, hy + r * 0.85);
      ctx.quadraticCurveTo(hx - shoulderW * 0.52, hy + r * 1.45, hx - shoulderW * 0.65, maxY + 40);
      ctx.lineTo(hx + shoulderW * 0.65, maxY + 40);
      ctx.quadraticCurveTo(hx + shoulderW * 0.52, hy + r * 1.45, hx + r * 0.38, hy + r * 0.85);
      ctx.closePath();
      ctx.fill();
      if (rim) {
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(hx, hy, r * 0.94, -Math.PI * 0.78, -Math.PI * 0.18);
        ctx.stroke();
      }
    };

    // 左右前景人物剪影（落于两底角内侧）
    const leftX = lerp(pB.x, cx, 0.38);
    const leftY = lerp(pB.y, pA.y, 0.34);
    const rightX = lerp(pC.x, cx, 0.38);
    const rightY = lerp(pC.y, pA.y, 0.32);

    drawSilhouette(leftX, leftY, sideR, spanX * 0.44, "#153629", "rgba(232,208,155,0.45)");
    drawSilhouette(rightX, rightY, sideR * 0.95, spanX * 0.42, "#122E23", "rgba(232,208,155,0.40)");

    // 中央主人物剪影（头部直顶三角峰）
    const mainY = pA.y + spanY * 0.30;
    drawSilhouette(cx, mainY, headR, spanX * 0.52, "#071E16", COL.goldLight);

    // 隐性目光连线（微妙金色虚线表示三人呼应）
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(232, 208, 155, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(cx, mainY);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();
    ctx.restore();
  }

  function drawPosterInside(pA, pB, pC, tier) {
    // 视觉设计场景：现代博物展海报三角排版编组
    const minY = Math.min(pA.y, pB.y, pC.y);
    const maxY = Math.max(pA.y, pB.y, pC.y);
    const spanX = Math.max(60, Math.abs(pC.x - pB.x));
    const spanY = Math.max(60, maxY - minY);

    ctx.fillStyle = "#163529";
    ctx.fillRect(0, 0, width, height);

    // 极简瑞士网格纹理
    ctx.strokeStyle = "rgba(244, 229, 191, 0.08)";
    ctx.lineWidth = 1;
    const step = Math.max(22, Math.round(width / 16));
    ctx.beginPath();
    for (let x = 0; x < width; x += step) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    ctx.stroke();

    // 顶端眉标块（呼应顶点）
    const topW = clamp(spanX * 0.18, 28, 76);
    ctx.fillStyle = COL.goldLight;
    ctx.fillRect(pA.x - topW * 0.5, pA.y + spanY * 0.22, topW, 4);
    ctx.fillStyle = "rgba(244, 229, 191, 0.55)";
    ctx.fillRect(pA.x - topW * 0.35, pA.y + spanY * 0.27, topW * 0.7, 2.5);

    // 中腰大标与几何展品线条（体量随 tier 缩放）
    const barW = clamp(spanX * (0.34 + (tier - 1) * 0.1), 50, spanX * 0.62);
    const midX = (pA.x + pB.x + pC.x) / 3;
    const midY = lerp(pA.y, (pB.y + pC.y) * 0.5, 0.52);
    ctx.fillStyle = "rgba(251, 247, 239, 0.90)";
    ctx.fillRect(midX - barW * 0.5, midY - 12, barW, 8 + (tier - 1) * 3);
    ctx.fillStyle = "rgba(232, 208, 155, 0.65)";
    ctx.fillRect(midX - barW * 0.38, midY + 4, barW * 0.76, 4);

    // 左右底角排版落脚信息块
    const footW = clamp(spanX * 0.20, 32, 86);
    const drawFootLines = (fx, fy, alignRight) => {
      const sx = alignRight ? fx - footW - 14 : fx + 14;
      ctx.fillStyle = "rgba(251, 247, 239, 0.78)";
      ctx.fillRect(sx, fy - 24, footW, 4);
      ctx.fillStyle = "rgba(251, 247, 239, 0.38)";
      ctx.fillRect(sx, fy - 15, footW * 0.72, 2.5);
      ctx.fillRect(sx, fy - 9, footW * 0.54, 2.5);
    };
    drawFootLines(Math.min(pB.x, pC.x), pB.y, false);
    drawFootLines(Math.max(pB.x, pC.x), pC.y, true);
  }

  // 绘制双向虚线箭头（1:1 复刻原海报外围三条虚线视线导轨）
  function drawGuideRay(x1, y1, x2, y2, color, dashOffset, highlight) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 36) return;
    const ux = dx / len;
    const uy = dy / len;
    const trim = 22;
    const sx = x1 + ux * trim;
    const sy = y1 + uy * trim;
    const ex = x2 - ux * trim;
    const ey = y2 - uy * trim;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = highlight ? 2.2 : 1.35;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);

    // 双端实心小箭簇
    const drawHead = (tx, ty, dirX, dirY) => {
      const sz = highlight ? 7.5 : 6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - dirX * sz - dirY * sz * 0.55, ty - dirY * sz + dirX * sz * 0.55);
      ctx.lineTo(tx - dirX * sz + dirY * sz * 0.55, ty - dirY * sz - dirX * sz * 0.55);
      ctx.closePath();
      ctx.fill();
    };
    drawHead(ex, ey, ux, uy);
    drawHead(sx, sy, -ux, -uy);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    // 处理开场动画与缓动目标
    if (still) {
      introProgress = 1;
      if (animTarget) {
        state.a = { ...animTarget.a };
        state.b = { ...animTarget.b };
        state.c = { ...animTarget.c };
        state.f = { ...animTarget.f };
        state.hierarchy = animTarget.hierarchy;
        animTarget = null;
        notify();
      }
    } else {
      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 2.2);
        dirty = true;
      }
      if (animTarget) {
        const k = 1 - Math.exp(-Math.max(dt, 0.016) * 11);
        state.a.x = lerp(state.a.x, animTarget.a.x, k);
        state.a.y = lerp(state.a.y, animTarget.a.y, k);
        state.b.x = lerp(state.b.x, animTarget.b.x, k);
        state.b.y = lerp(state.b.y, animTarget.b.y, k);
        state.c.x = lerp(state.c.x, animTarget.c.x, k);
        state.c.y = lerp(state.c.y, animTarget.c.y, k);
        state.f.x = lerp(state.f.x, animTarget.f.x, k);
        state.f.y = lerp(state.f.y, animTarget.f.y, k);
        state.hierarchy = lerp(state.hierarchy, animTarget.hierarchy, k);
        const rem =
          Math.hypot(state.a.x - animTarget.a.x, state.a.y - animTarget.a.y) +
          Math.hypot(state.b.x - animTarget.b.x, state.b.y - animTarget.b.y) +
          Math.hypot(state.c.x - animTarget.c.x, state.c.y - animTarget.c.y) +
          Math.hypot(state.f.x - animTarget.f.x, state.f.y - animTarget.f.y) +
          Math.abs(state.hierarchy - animTarget.hierarchy) * 0.2;
        if (rem < 0.002) {
          state.a = { ...animTarget.a };
          state.b = { ...animTarget.b };
          state.c = { ...animTarget.c };
          state.f = { ...animTarget.f };
          state.hierarchy = animTarget.hierarchy;
          animTarget = null;
        }
        notify();
      }
    }

    // 只要不是静止模式且显示引导线，虚线保持极其克制的低开销微流（仅在 dirty 或拖动或引导线流动画时重绘）
    const dashPhase = still ? 0 : (t * 14) % 10;
    if (!dirty && !still && !state.showGuide && !activeDrag && !animTarget) return;
    dirty = false;

    const ev = lastEval;
    const ease = 1 - Math.pow(1 - introProgress, 3);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. 极淡博物测绘点阵底纹（单路径一次 fill，极大降低单帧调用开销）
    ctx.fillStyle = COL.paperGrid;
    const gridGap = Math.max(26, Math.round(width / 20));
    ctx.beginPath();
    for (let gx = gridGap * 0.5; gx < width; gx += gridGap) {
      for (let gy = gridGap * 0.5; gy < height; gy += gridGap) {
        ctx.rect(gx - 0.6, gy - 0.6, 1.2, 1.2);
      }
    }
    ctx.fill();

    // 2. 计算实绘三顶点像素（带轻柔开场舒展）
    const cRaw = toPx(ev.centroid);
    const pA0 = toPx(state.a);
    const pB0 = toPx(state.b);
    const pC0 = toPx(state.c);
    const pA = { x: lerp(cRaw.x, pA0.x, ease), y: lerp(cRaw.y, pA0.y, ease) };
    const pB = { x: lerp(cRaw.x, pB0.x, ease), y: lerp(cRaw.y, pB0.y, ease) };
    const pC = { x: lerp(cRaw.x, pC0.x, ease), y: lerp(cRaw.y, pC0.y, ease) };
    const pF = toPx(state.f);
    const pG = { x: (pA.x + pB.x + pC.x) / 3, y: (pA.y + pB.y + pC.y) / 3 };

    // 3. 三角形本体裁剪与实景绘制
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.clip();

    if (state.scene === "portrait") {
      drawPortraitInside(pA, pB, pC, state.hierarchy);
    } else if (state.scene === "poster") {
      drawPosterInside(pA, pB, pC, state.hierarchy);
    } else {
      drawLandscapeInside(pA, pB, pC, state.hierarchy);
    }
    ctx.restore();

    // 三角形清晰细轮廓
    ctx.strokeStyle = ev.isInverted ? COL.err : "rgba(6, 43, 32, 0.35)";
    ctx.lineWidth = ev.isInverted ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.stroke();

    // 4. 显性框架辅助层（1:1 原海报外围三条双向虚线引导箭 + 顶角弧 + 物理重心垂线）
    if (state.showGuide) {
      // 计算每条边向外的单位法线以平移虚线导轨
      const offsetRay = (p1, p2, opp, dist) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const l = Math.max(1, Math.hypot(dx, dy));
        let nx = -dy / l;
        let ny = dx / l;
        // 确保法线指向三角形外侧
        const mx = (p1.x + p2.x) * 0.5;
        const my = (p1.y + p2.y) * 0.5;
        if ((opp.x - mx) * nx + (opp.y - my) * ny > 0) {
          nx = -nx;
          ny = -ny;
        }
        return [p1.x + nx * dist, p1.y + ny * dist, p2.x + nx * dist, p2.y + ny * dist];
      };

      const rayDist = Math.max(12, Math.min(20, width * 0.028));
      const guideCol = !ev.checks.guidance.ok ? COL.err : COL.pine;
      const baseCol = !ev.checks.stability.ok ? COL.err : COL.pine;

      const [ax1, ay1, ax2, ay2] = offsetRay(pA, pB, pC, rayDist);
      const [bx1, by1, bx2, by2] = offsetRay(pA, pC, pB, rayDist);
      const [cx1, cy1, cx2, cy2] = offsetRay(pB, pC, pA, rayDist);

      drawGuideRay(ax1, ay1, ax2, ay2, guideCol, dashPhase, state.highlight === "guidance");
      drawGuideRay(bx1, by1, bx2, by2, guideCol, dashPhase, state.highlight === "guidance");
      drawGuideRay(cx1, cy1, cx2, cy2, baseCol, dashPhase, state.highlight === "stability");

      // 顶角弧线与度数实标
      const angB = Math.atan2(pB.y - pA.y, pB.x - pA.x);
      const angC = Math.atan2(pC.y - pA.y, pC.x - pA.x);
      let startAng = angB;
      let diff = angC - angB;
      while (diff <= -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const arcR = clamp(width * 0.062, 22, 38);
      ctx.save();
      ctx.strokeStyle = !ev.checks.guidance.ok ? COL.err : COL.goldLight;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(pA.x, pA.y, arcR, startAng, startAng + diff, diff < 0);
      ctx.stroke();

      // 顶角数值小标（沿角平分线放在顶角弧外侧；若过扁紧贴重心 G 则自动移到日轮侧上方，绝不重叠）
      const midAng = startAng + diff * 0.5;
      const labelDist = arcR + 17;
      let lx = pA.x + Math.cos(midAng) * labelDist;
      let ly = pA.y + Math.sin(midAng) * labelDist;
      const apexBadgeOffset = clamp(boxSize * 0.032, 12, 20) + 30;
      if (Math.hypot(lx - pG.x, ly - pG.y) < 25 || ev.apexDeg > 108) {
        lx = pA.x + (pA.x > width * 0.72 ? -apexBadgeOffset : apexBadgeOffset);
        ly = pA.y - 16;
      }
      ctx.font = `600 ${Math.max(11, Math.round(boxSize * 0.023))}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const angText = `${Math.round(ev.apexDeg)}°`;
      const tw = ctx.measureText(angText).width + 10;
      lx = clamp(lx, tw * 0.5 + 8, width - tw * 0.5 - 8);
      ly = clamp(ly, 16, height - 16);
      ctx.fillStyle = !ev.checks.guidance.ok ? "rgba(166,44,30,0.92)" : "rgba(6,43,32,0.86)";
      ctx.fillRect(lx - tw / 2, ly - 9, tw, 18);
      ctx.fillStyle = COL.white;
      ctx.fillText(angText, lx, ly + 0.5);
      ctx.restore();

      // 重心 G 垂直落线到支撑底边（物理安定可视化！）
      const dropY = boxY + ev.cgDropY * boxSize;
      const cgColor = ev.checks.stability.ok ? "#6FE0B2" : COL.err;
      ctx.save();
      ctx.strokeStyle = ev.checks.stability.ok ? "rgba(111, 224, 178, 0.78)" : "rgba(166, 44, 30, 0.85)";
      ctx.lineWidth = state.highlight === "stability" ? 2.2 : 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pG.x, pG.y);
      ctx.lineTo(pG.x, dropY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 底边安全支撑段微亮条
      const pL = toPx(ev.leftBase);
      const pR = toPx(ev.rightBase);
      ctx.strokeStyle = ev.checks.stability.ok ? "rgba(14, 99, 69, 0.55)" : "rgba(166, 44, 30, 0.65)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lerp(pL.x, pR.x, 0.14), lerp(pL.y, pR.y, 0.14));
      ctx.lineTo(lerp(pL.x, pR.x, 0.86), lerp(pL.y, pR.y, 0.86));
      ctx.stroke();

      // 重心菱形 G
      ctx.fillStyle = cgColor;
      ctx.beginPath();
      ctx.moveTo(pG.x, pG.y - 5.5);
      ctx.lineTo(pG.x + 5.5, pG.y);
      ctx.lineTo(pG.x, pG.y + 5.5);
      ctx.lineTo(pG.x - 5.5, pG.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COL.pineDeep;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 落脚点小实圆
      ctx.beginPath();
      ctx.arc(pG.x, dropY, 4, 0, Math.PI * 2);
      ctx.fillStyle = ev.checks.stability.ok ? COL.ok : COL.err;
      ctx.fill();
      ctx.restore();
    }

    // 5. 内嵌琥珀金「焦点 FOCUS」主圆（1:1 原海报标志性金圆，尺寸呼应层次阶差）
    const focusR = clamp(boxSize * (0.082 + (state.hierarchy - 1.0) * 0.032), 26, 62);
    ctx.save();
    // 若焦点脱框或贴边，外加警示虚线环
    if (!ev.checks.focus.ok) {
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(pF.x, pF.y, focusR + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (hoverHandle === "f" || (activeDrag && activeDrag.kind === "f") || state.highlight === "focus") {
      ctx.strokeStyle = COL.pine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pF.x, pF.y, focusR + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    ctx.arc(pF.x, pF.y, focusR, 0, Math.PI * 2);
    ctx.fill();

    // 焦点圆内文字（简洁清晰，小屏不溢）
    const titleSz = clamp(Math.round(focusR * 0.42), 12, 22);
    const subSz = clamp(Math.round(focusR * 0.21), 10, 12);
    ctx.fillStyle = COL.pineDeep;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${titleSz}px "Noto Sans SC", sans-serif`;
    ctx.fillText("焦点", pF.x, pF.y - subSz * 0.55);
    ctx.font = `700 ${subSz}px "Archivo", sans-serif`;
    ctx.fillText("FOCUS", pF.x, pF.y + titleSz * 0.52);
    ctx.restore();

    // 6. 顶端三光日轮金圆 A（1:1 原海报顶点上方日轮 + 三道金色放射短线）
    const apexDotR = clamp(boxSize * (0.030 + (state.hierarchy - 1.0) * 0.005), 11, 19);
    // 日轮位置：顶点略向外一点或直接锁定在顶点，让拖拽与视觉 100% 统一
    ctx.save();
    const rayDir = ev.isInverted ? 1 : -1;
    const rayAngles = [-0.62, 0, 0.62];
    ctx.strokeStyle = ev.isInverted ? COL.err : COL.gold;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    for (const ang of rayAngles) {
      const aRad = (rayDir < 0 ? -Math.PI / 2 : Math.PI / 2) + ang;
      const r1 = apexDotR + 6;
      const r2 = apexDotR + 18;
      ctx.beginPath();
      ctx.moveTo(pA.x + Math.cos(aRad) * r1, pA.y + Math.sin(aRad) * r1);
      ctx.lineTo(pA.x + Math.cos(aRad) * r2, pA.y + Math.sin(aRad) * r2);
      ctx.stroke();
    }
    ctx.fillStyle = ev.isInverted ? COL.err : COL.gold;
    ctx.beginPath();
    ctx.arc(pA.x, pA.y, apexDotR, 0, Math.PI * 2);
    ctx.fill();
    if (hoverHandle === "a" || (activeDrag && activeDrag.kind === "a")) {
      ctx.strokeStyle = COL.pineDeep;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(pA.x, pA.y, apexDotR + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 顶点中心小白点提示可拖
    ctx.fillStyle = COL.white;
    ctx.beginPath();
    ctx.arc(pA.x, pA.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. 底角双深松绿实心锚圆 B / C（尺寸呼应层级阶差：层级拉平则小，拉开则稳厚）
    const baseDotR = clamp(boxSize * (0.024 + (state.hierarchy - 1.0) * 0.009), 10, 18);
    const drawBaseAnchor = (pt, key) => {
      ctx.save();
      ctx.fillStyle = COL.pine;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, baseDotR, 0, Math.PI * 2);
      ctx.fill();
      if (hoverHandle === key || (activeDrag && activeDrag.kind === key)) {
        ctx.strokeStyle = COL.gold;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseDotR + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = COL.paper;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawBaseAnchor(pB, "b");
    drawBaseAnchor(pC, "c");

    // 8. 错态就地诊断红标（精准避开金日、顶角数值与重心菱形，点一下即可单步校准）
    badgeRect = null;
    if (ev.issueCode !== "ok") {
      let anchor = pA;
      let label = `× ${ev.badgeShort} · 点此校准`;
      if (ev.issueCode === "focusOut" || ev.issueCode === "focusEdge") {
        anchor = { x: pF.x, y: pF.y - focusR - 22 };
      } else if (ev.issueCode === "baseTilt" || ev.issueCode === "tooNarrow") {
        anchor = { x: (pB.x + pC.x) * 0.5, y: Math.min(height - 20, Math.max(pB.y, pC.y) + 26) };
      } else if (ev.issueCode === "inverted") {
        anchor = { x: pA.x, y: Math.min(height - 20, pA.y + apexDotR + 34) };
      } else {
        anchor = { x: pA.x, y: Math.max(24, pA.y - apexDotR - 36) };
      }

      ctx.save();
      const bFont = clamp(Math.round(width * 0.021), 11, 13);
      ctx.font = `700 ${bFont}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 18;
      const bh = 26;
      const bx = clamp(anchor.x - bw / 2, 10, width - bw - 10);
      const by = clamp(anchor.y - bh / 2, 10, height - bh - 10);
      badgeRect = { x: bx, y: by, w: bw, h: bh };

      ctx.fillStyle = COL.errBg;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = COL.paper;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = COL.white;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + bw / 2, by + bh / 2 + 0.5);
      ctx.restore();
    }

    // 9. 左上角轻量实测标尺印章（不遮挡主体）
    ctx.save();
    const hudText = `${ev.passedCount}/4 · 顶角 ${Math.round(ev.apexDeg)}° · 底倾 ${ev.baseTiltDeg.toFixed(0)}°`;
    const hFont = clamp(Math.round(width * 0.019), 11, 12);
    ctx.font = `600 ${hFont}px "JetBrains Mono", "Noto Sans SC", monospace`;
    const hw = ctx.measureText(hudText).width + 18;
    ctx.fillStyle = "rgba(245, 236, 221, 0.88)";
    ctx.fillRect(10, 10, hw, 24);
    ctx.strokeStyle = ev.passedCount === 4 ? COL.ok : "rgba(6, 43, 32, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, hw, 24);
    ctx.fillStyle = ev.passedCount === 4 ? COL.ok : COL.pine;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, 19, 22.5);
    ctx.restore();

    ctx.restore();
  }

  // === 指针 + 触摸交互（确保触屏竖向可滚动，横拖与拖点极其跟手！） ===
  let activeTouchId = null;

  function startInteraction(clientX, clientY, isTouch) {
    animTarget = null;
    const pt = fromClient(clientX, clientY);
    const kind = hitTest(pt.px, pt.py, isTouch);
    if (kind === "badge") {
      const target = computeFixTarget(state, lastEval);
      animateTo(target);
      return null;
    }
    return {
      kind,
      startClientX: clientX,
      startClientY: clientY,
      startNormX: pt.x,
      startNormY: pt.y,
      lockedDir: kind === "sculpt" && isTouch ? null : "active",
      startState: {
        a: { ...state.a },
        b: { ...state.b },
        c: { ...state.c },
        f: { ...state.f },
        hierarchy: state.hierarchy,
      },
    };
  }

  function moveInteraction(clientX, clientY) {
    if (!activeDrag) return;
    const pt = fromClient(clientX, clientY);
    const { kind, startState } = activeDrag;

    if (kind === "a" || kind === "b" || kind === "c" || kind === "f") {
      state[kind].x = clamp(pt.x, 0.06, 0.94);
      state[kind].y = clamp(pt.y, 0.08, 0.90);
      // 吸附到水平底边与正中（靠近时轻轻一吸）
      if (kind === "b" && Math.abs(state.b.y - state.c.y) < 0.018) state.b.y = state.c.y;
      if (kind === "c" && Math.abs(state.c.y - state.b.y) < 0.018) state.c.y = state.b.y;
      if (kind === "a") {
        const midX = (state.b.x + state.c.x) * 0.5;
        if (Math.abs(state.a.x - midX) < 0.016) state.a.x = midX;
      }
      if (kind === "f") {
        const evNow = evaluateTriangle(state);
        if (Math.hypot(state.f.x - evNow.incenter.x, state.f.y - evNow.incenter.y) < 0.022) {
          state.f.x = evNow.incenter.x;
          state.f.y = evNow.incenter.y;
        }
      }
    } else if (kind === "sculpt") {
      const dxNorm = pt.x - activeDrag.startNormX;
      const dyNorm = pt.y - activeDrag.startNormY;
      applyHorizontalSculpt(startState, dxNorm, dyNorm);
    }
    notify();
    ctl.draw();
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    activeDrag = startInteraction(e.clientX, e.clientY, false);
    if (activeDrag) {
      canvas.style.cursor = "grabbing";
      e.preventDefault();
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (activeDrag) {
      moveInteraction(e.clientX, e.clientY);
      return;
    }
    const r = canvas.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      const pt = fromClient(e.clientX, e.clientY);
      const hit = hitTest(pt.px, pt.py, false);
      if (hit !== hoverHandle) {
        hoverHandle = hit;
        canvas.style.cursor = hit === "badge" ? "pointer" : hit === "sculpt" ? "ew-resize" : "grab";
        dirty = true;
        ctl.draw();
      }
    }
  });

  window.addEventListener("mouseup", () => {
    if (activeDrag) {
      activeDrag = null;
      canvas.style.cursor = "ew-resize";
    }
  });

  // 原生 Touch 事件（兼顾 perf.mjs dispatchTouchEvent 与真机竖向滚动！）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.changedTouches.length) return;
    const t0 = e.changedTouches[0];
    activeTouchId = t0.identifier;
    activeDrag = startInteraction(t0.clientX, t0.clientY, true);
    if (activeDrag && activeDrag.kind !== "sculpt") {
      e.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!activeDrag) return;
    const touch = [...e.changedTouches].find((x) => x.identifier === activeTouchId) || e.touches[0];
    if (!touch) return;
    if (activeDrag.lockedDir === null) {
      const dx = Math.abs(touch.clientX - activeDrag.startClientX);
      const dy = Math.abs(touch.clientY - activeDrag.startClientY);
      if (dx < 5 && dy < 5) return;
      if (dx >= dy) {
        activeDrag.lockedDir = "active";
      } else {
        // 明显竖滑 → 让页面自由滚动
        activeDrag = null;
        return;
      }
    }
    e.preventDefault();
    moveInteraction(touch.clientX, touch.clientY);
  }, { passive: false });

  const endTouch = () => {
    activeDrag = null;
    activeTouchId = null;
  };
  canvas.addEventListener("touchend", endTouch, { passive: true });
  canvas.addEventListener("touchcancel", endTouch, { passive: true });

  // 键盘操作（画布获焦后：←/→ 偏移顶峰横位，↑/↓ 升降顶峰高度，Shift+方向键微调焦点）
  canvas.addEventListener("keydown", (e) => {
    const step = 0.025;
    let handled = true;
    animTarget = null;
    if (e.shiftKey) {
      if (e.key === "ArrowLeft") state.f.x = clamp(state.f.x - step, 0.08, 0.92);
      else if (e.key === "ArrowRight") state.f.x = clamp(state.f.x + step, 0.08, 0.92);
      else if (e.key === "ArrowUp") state.f.y = clamp(state.f.y - step, 0.10, 0.88);
      else if (e.key === "ArrowDown") state.f.y = clamp(state.f.y + step, 0.10, 0.88);
      else handled = false;
    } else {
      if (e.key === "ArrowLeft") state.a.x = clamp(state.a.x - step, 0.14, 0.86);
      else if (e.key === "ArrowRight") state.a.x = clamp(state.a.x + step, 0.14, 0.86);
      else if (e.key === "ArrowUp") state.a.y = clamp(state.a.y - step, 0.12, 0.86);
      else if (e.key === "ArrowDown") state.a.y = clamp(state.a.y + step, 0.12, 0.86);
      else handled = false;
    }
    if (handled) {
      e.preventDefault();
      notify();
      ctl.draw();
    }
  });

  const ctl = loop(canvas, render);
  notify();
  ctl.draw();

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    animateTo,
    setImmediate,
    setScene: (sceneId) => {
      state.scene = sceneId;
      notify();
      ctl.draw();
    },
    setGuide: (show) => {
      state.showGuide = show;
      notify();
      ctl.draw();
    },
    setHierarchy: (val) => {
      animTarget = null;
      state.hierarchy = clamp(val, 1.0, 2.5);
      notify();
      ctl.draw();
    },
    setHighlight: (key) => {
      state.highlight = state.highlight === key ? null : key;
      dirty = true;
      ctl.draw();
    },
    fixNext: () => {
      const target = computeFixTarget(state, lastEval);
      animateTo(target);
    },
    getEval: () => lastEval,
    getState: () => state,
  };
}
