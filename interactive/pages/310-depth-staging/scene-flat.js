// 2D Canvas 午夜水桥透视舞台（WebGL 关闭时的完整同源降级，几何与 model.js 100% 同步）

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  Z_MIN,
  Z_MAX,
  LANE_MIN,
  LANE_MAX,
  PERSON_H,
  projectPoint,
  clamp,
} from "./model.js";

function drawSilhouette2D(ctx, a, w, h, selected, blocked) {
  const cx = a.u * w;
  const bot = a.vFoot * h;
  const top = a.vHead * h;
  const ph = Math.max(14, bot - top);
  const pw = ph * 0.28;

  ctx.save();
  ctx.translate(cx, bot);

  // 脚底定位椭圆环
  ctx.beginPath();
  ctx.ellipse(0, 0, pw * 0.72, Math.max(2.5, ph * 0.032), 0, 0, Math.PI * 2);
  ctx.strokeStyle = blocked ? "#F08A6C" : a.color;
  ctx.lineWidth = selected ? 2.2 : 1.2;
  ctx.globalAlpha = selected ? 0.95 : 0.45;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 极简长风衣剪影（零五官）
  const depthT = clamp((a.z - Z_MIN) / (Z_MAX - Z_MIN), 0, 1);
  const r = Math.round(6 + depthT * 36);
  const g = Math.round(9 + depthT * 24);
  const b = Math.round(25 + depthT * 54);
  ctx.fillStyle = `rgb(${r},${g},${b})`;

  ctx.beginPath();
  ctx.moveTo(-pw * 0.26, 0);
  ctx.lineTo(-pw * 0.14, 0);
  ctx.lineTo(-pw * 0.05, -ph * 0.24);
  ctx.lineTo(pw * 0.05, -ph * 0.24);
  ctx.lineTo(pw * 0.14, 0);
  ctx.lineTo(pw * 0.26, 0);
  ctx.lineTo(pw * 0.34, -ph * 0.26);
  ctx.lineTo(pw * 0.48, -ph * 0.34);
  ctx.lineTo(pw * 0.50, -ph * 0.74);
  ctx.quadraticCurveTo(pw * 0.48, -ph * 0.83, pw * 0.20, -ph * 0.84);
  ctx.lineTo(pw * 0.14, -ph * 0.86);
  ctx.quadraticCurveTo(pw * 0.22, -ph * 0.93, pw * 0.16, -ph * 0.98);
  ctx.quadraticCurveTo(0, -ph * 1.01, -pw * 0.16, -ph * 0.98);
  ctx.quadraticCurveTo(-pw * 0.22, -ph * 0.93, -pw * 0.14, -ph * 0.86);
  ctx.lineTo(-pw * 0.20, -ph * 0.84);
  ctx.quadraticCurveTo(-pw * 0.48, -ph * 0.83, -pw * 0.50, -ph * 0.74);
  ctx.lineTo(-pw * 0.48, -ph * 0.34);
  ctx.lineTo(-pw * 0.34, -ph * 0.26);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = blocked ? "#F08A6C" : a.color;
  ctx.lineWidth = selected || blocked ? 1.8 : 1;
  ctx.globalAlpha = selected || blocked ? 0.9 : 0.45;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 道具轮廓（公文盒 / 帽檐）
  if (a.prop === "briefcase") {
    ctx.fillStyle = "#091830";
    ctx.strokeStyle = "#8AD6CB";
    ctx.lineWidth = 1.2;
    ctx.fillRect(pw * 0.48, -ph * 0.42, pw * 0.46, ph * 0.11);
    ctx.strokeRect(pw * 0.48, -ph * 0.42, pw * 0.46, ph * 0.11);
  } else if (a.prop === "hat") {
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(-pw * 0.32, -ph * 0.98, pw * 0.64, Math.max(2, ph * 0.022));
  }

  // 遮挡警戒虚线框
  if (blocked) {
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#F08A6C";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-pw * 0.66, -ph * 1.04, pw * 1.32, ph * 1.08);
    ctx.setLineDash([]);
  }

  // 头顶 A / B / C 铭牌
  const tw = 24, th = 16;
  const ty = -ph - 22;
  ctx.fillStyle = "rgba(18, 12, 47, 0.88)";
  ctx.fillRect(-tw / 2, ty, tw, th);
  ctx.strokeStyle = blocked ? "#F08A6C" : a.color;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-tw / 2, ty, tw, th);
  ctx.fillStyle = "#F5ECE0";
  ctx.font = '600 11px "DM Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(a.id, 0, ty + th / 2 + 0.5);

  ctx.restore();
}

export function mountSceneFlat(host, store) {
  const canvas = document.createElement("canvas");
  canvas.className = "stage-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let w = 640, h = 400;
  const resize = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(240, Math.round(r.width));
    h = Math.max(150, Math.round(r.height));
    const dpr = pixelRatio(2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // 与 3D 一致的画布内直接拖拽人物
  let draggingId = null;
  let dragStart = null;
  const pickActor = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const u = (clientX - r.left) / r.width;
    const v = (clientY - r.top) / r.height;
    const snap = store.eval();
    for (const a of snap.byDepth) {
      const padU = Math.max(0.055, a.wFrac * 0.72);
      if (u >= a.u - padU && u <= a.u + padU && v >= a.vHead - 0.06 && v <= a.vFoot + 0.04) return a;
    }
    return null;
  };
  canvas.addEventListener("pointerdown", (e) => {
    const hit = pickActor(e.clientX, e.clientY);
    if (!hit) return;
    draggingId = hit.id;
    store.selectActor(hit.id);
    dragStart = { x: e.clientX, y: e.clientY, z: hit.z, lane: hit.lane };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!draggingId || !dragStart) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / Math.max(200, r.width);
    const dy = (e.clientY - dragStart.y) / Math.max(140, r.height);
    store.setActorPos(
      draggingId,
      clamp(dragStart.z - dy * 20.0, Z_MIN, Z_MAX),
      clamp(dragStart.lane + dx * 2.1, LANE_MIN, LANE_MAX)
    );
  });
  const endDrag = () => { draggingId = null; dragStart = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const renderFrame = () => {
    const snap = store.eval();
    const f = snap.focal;
    const p = (wx, wy, wz) => {
      const pt = projectPoint(wx, wy, wz, f);
      return [pt.u * w, pt.v * h];
    };

    // 1. 暮紫天空梯度
    const skyG = ctx.createLinearGradient(0, 0, 0, h * 0.56);
    skyG.addColorStop(0, "#241653");
    skyG.addColorStop(0.55, "#6F5D99");
    skyG.addColorStop(1, "#B09EC4");
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, h * 0.54);

    // 暖米圆月（严格正圆）
    const moonR = Math.min(w, h) * 0.062;
    ctx.fillStyle = "#EDDACD";
    ctx.beginPath();
    ctx.arc(w * 0.34, h * 0.25, moonR, 0, Math.PI * 2);
    ctx.fill();

    // 远山
    ctx.fillStyle = "#7D6A9F";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.52);
    ctx.lineTo(w * 0.2, h * 0.41);
    ctx.lineTo(w * 0.46, h * 0.46);
    ctx.lineTo(w * 0.72, h * 0.39);
    ctx.lineTo(w, h * 0.45);
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(0, h * 0.55);
    ctx.closePath();
    ctx.fill();

    // 水面
    const waterG = ctx.createLinearGradient(0, h * 0.5, 0, h);
    waterG.addColorStop(0, "#3D346C");
    waterG.addColorStop(0.5, "#1E2852");
    waterG.addColorStop(1, "#0B1633");
    ctx.fillStyle = waterG;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // 2. 透视三景层桥面色带
    const drawStrip = (z0, z1, w0, w1, color) => {
      const a = p(-w0, 0, z0);
      const b = p(w0, 0, z0);
      const c = p(w1, 0, z1);
      const d = p(-w1, 0, z1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.closePath();
      ctx.fill();
    };
    drawStrip(16.2, 26.8, 6.2, 9.6, "#5C4786");
    drawStrip(6.6, 14.8, 3.3, 5.9, "#174864");
    drawStrip(1.5, 5.6, 2.2, 3.1, "#2A8496");

    // 3. 海报立牌文字
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(h * 0.085)}px "Bebas Neue", sans-serif`;
    ctx.fillStyle = snap.layerMap.bg !== "空缺" ? "rgba(87,67,126,0.9)" : "rgba(87,67,126,0.45)";
    ctx.fillText("BACKGROUND", w * 0.45, h * 0.44);

    ctx.font = `700 ${Math.round(h * 0.072)}px "Bebas Neue", sans-serif`;
    ctx.fillStyle = snap.layerMap.mg !== "空缺" ? "rgba(41,116,141,0.9)" : "rgba(41,116,141,0.45)";
    ctx.fillText("MIDDLE GROUND", w * 0.21, h * 0.59);

    ctx.font = `700 ${Math.round(h * 0.095)}px "Bebas Neue", sans-serif`;
    ctx.fillStyle = snap.layerMap.fg !== "空缺" ? "rgba(113,177,188,0.85)" : "rgba(113,177,188,0.4)";
    ctx.fillText("FOREGROUND", w * 0.48, h * 0.91);
    ctx.restore();

    // 4. 透视辅助线
    if (store.state.showGuides) {
      ctx.save();
      ctx.strokeStyle = "rgba(138, 214, 203, 0.42)";
      ctx.lineWidth = 1;
      for (const side of [-1, 1]) {
        const p0 = p(side * 2.0, 0, 2.2);
        const p1 = p(side * 9.0, 0, 26.2);
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
      }
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(236, 221, 203, 0.36)";
      for (const zb of [5.6, 14.8, 16.2]) {
        const bw = zb * 0.38 + 1.1;
        const l = p(-bw, 0, zb);
        const rPt = p(bw, 0, zb);
        ctx.beginPath();
        ctx.moveTo(l[0], l[1]);
        ctx.lineTo(rPt[0], rPt[1]);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 由远到近画三名人物剪影（天然遮挡次序）
    const blockedIds = new Set();
    if (snap.status === "blocked" && snap.blockerPair) {
      blockedIds.add(snap.blockerPair.front.id);
      blockedIds.add(snap.blockerPair.back.id);
    }
    const farToNear = [...snap.byDepth].reverse();
    for (const a of farToNear) {
      drawSilhouette2D(ctx, a, w, h, store.state.selected === a.id, blockedIds.has(a.id));
    }
  };

  const { draw } = loop(host, () => renderFrame());
  store.subscribe(() => draw());
  draw();

  return {
    draw,
    destroy() {
      ro.disconnect();
    },
  };
}
