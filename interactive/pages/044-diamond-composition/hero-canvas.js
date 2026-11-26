// 044 菱形构图 · 主舞台 2D Canvas 渲染与直操引擎
// 1:1 承袭 044 原海报浅薰衣草底、深靛紫四圆锚虚线菱、暮紫雪山/宝石/舞台/穹顶菱窗、
// 四向玫红内指箭、对角虚线、中央玫红核心标与光学分度环。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, evaluate } from "./model.js";

const PAL = {
  bg: "#EDE7F4",
  ink: "#180850",
  violet: "#483494",
  violetFaint: "rgba(72, 52, 148, 0.16)",
  rose: "#F24380",
  roseDeep: "#A8174E",
  ok: "#0E6E54",
};

const CORNER_BADGES = [
  { x: -0.78, y: -0.76, tag: "HOT" },
  { x: 0.78, y: -0.76, tag: "NEW" },
  { x: -0.78, y: 0.76, tag: "SALE" },
  { x: 0.78, y: 0.76, tag: "99+" },
];

export function mountHeroStage(canvas, store) {
  const ctx = canvas.getContext("2d");
  let w = 520;
  let h = 520;
  let dpr = 1.5;

  let intro = 0;
  let activeDrag = null;
  let hoverTarget = null;
  let lastEval = evaluate(store.get());

  // 20 枚轻量化汇聚流光粒子（合批为单次路径填充，极低绘制开销）
  const particles = Array.from({ length: 20 }, (_, i) => ({
    edge: i % 4,
    phase: (i * 0.37) % 1,
    speed: 0.25 + (i % 4) * 0.05,
    lane: ((i % 3) - 1) * 0.055,
  }));

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 手机窄屏像素比上限 1.5（遵循 GUIDE.md 性能守则），桌面保持最高 2
    dpr = pixelRatio(rect.width <= 460 ? 1.5 : 2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    const tw = Math.round(w * dpr);
    const th = Math.round(h * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const half = () => Math.min(w, h) * 0.46;
  const toPx = (nx, ny) => ({ x: w * 0.5 + nx * half(), y: h * 0.5 + ny * half() });
  const toNorm = (px, py) => ({ x: (px - w * 0.5) / half(), y: (py - h * 0.5) / half() });

  // ---------- 菱窗内四大题材（精简路径、合并绘制，零冗余渐变） ----------
  function drawSceneContent(c, sceneId, fx, fy, r, t) {
    c.save();
    const ox = fx * r * 1.05;
    const oy = fy * r * 1.05;

    if (sceneId === "mountain") {
      const sky = c.createLinearGradient(0, -r, 0, r);
      sky.addColorStop(0, "#6E6BB8");
      sky.addColorStop(0.42, "#A898D6");
      sky.addColorStop(0.58, "#E8BDD8");
      sky.addColorStop(0.76, "#58528F");
      sky.addColorStop(1, "#232250");
      c.fillStyle = sky;
      c.fillRect(-r * 1.25, -r * 1.25, r * 2.5, r * 2.5);

      // 远景左右副峰
      c.fillStyle = "#48457D";
      c.beginPath();
      c.moveTo(-r * 1.15, r * 0.46);
      c.lineTo(ox - r * 0.48, oy - r * 0.04);
      c.lineTo(ox - r * 0.12, oy + r * 0.16);
      c.lineTo(ox + r * 0.38, oy - r * 0.11);
      c.lineTo(r * 1.15, r * 0.46);
      c.closePath();
      c.fill();

      // 主峰暗面（左）
      c.fillStyle = "#2A2E5E";
      c.beginPath();
      c.moveTo(ox - r * 0.78, oy + r * 0.46);
      c.lineTo(ox - r * 0.24, oy - r * 0.16);
      c.lineTo(ox, oy - r * 0.50);
      c.lineTo(ox + r * 0.08, oy + r * 0.46);
      c.closePath();
      c.fill();

      // 主峰雪坡亮面（右）
      c.fillStyle = "#E8D5E8";
      c.beginPath();
      c.moveTo(ox, oy - r * 0.50);
      c.lineTo(ox + r * 0.26, oy - r * 0.10);
      c.lineTo(ox + r * 0.68, oy + r * 0.36);
      c.lineTo(ox + r * 0.08, oy + r * 0.46);
      c.lineTo(ox - r * 0.03, oy - r * 0.08);
      c.closePath();
      c.fill();

      // 峰脊阴影与粉雪高光
      c.fillStyle = "#5B5D95";
      c.beginPath();
      c.moveTo(ox, oy - r * 0.50);
      c.lineTo(ox + r * 0.14, oy - r * 0.18);
      c.lineTo(ox + r * 0.02, oy + r * 0.12);
      c.lineTo(ox - r * 0.10, oy - r * 0.05);
      c.closePath();
      c.fill();

      // 暮紫云海（两层合批绘制）
      const drift = Math.sin(t * 0.45) * r * 0.014;
      c.fillStyle = "rgba(176, 142, 204, 0.56)";
      c.beginPath();
      c.ellipse(ox * 0.4 - r * 0.44 + drift, oy * 0.3 + r * 0.34, r * 0.46, r * 0.22, 0, 0, Math.PI * 2);
      c.ellipse(ox * 0.4 + r * 0.42 + drift, oy * 0.3 + r * 0.32, r * 0.48, r * 0.24, 0, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = "rgba(56, 48, 108, 0.88)";
      c.beginPath();
      c.ellipse(ox * 0.4 + drift, oy * 0.3 + r * 0.54, r * 0.68, r * 0.30, 0, 0, Math.PI * 2);
      c.ellipse(ox * 0.4 + r * 0.18 + drift, oy * 0.3 + r * 0.72, r * 0.62, r * 0.30, 0, 0, Math.PI * 2);
      c.fill();
    } else if (sceneId === "gem") {
      c.fillStyle = "#1E0F4F";
      c.fillRect(-r * 1.25, -r * 1.25, r * 2.5, r * 2.5);
      const facets = [
        [[0, -0.56], [0.40, 0], [0, 0], "#B89AF0"],
        [[0, -0.56], [0, 0], [-0.40, 0], "#7959C9"],
        [[0.40, 0], [0, 0.56], [0, 0], "#5335A1"],
        [[-0.40, 0], [0, 0.56], [0, 0], "#321C73"],
        [[0, -0.32], [0.22, 0], [0, 0.32], "rgba(255, 134, 184, 0.58)"],
        [[0, -0.32], [-0.22, 0], [0, 0.32], "rgba(225, 198, 255, 0.48)"],
      ];
      for (const [a, b, d, col] of facets) {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(ox + a[0] * r, oy + a[1] * r);
        c.lineTo(ox + b[0] * r, oy + b[1] * r);
        c.lineTo(ox + d[0] * r, oy + d[1] * r);
        c.closePath();
        c.fill();
      }
      c.strokeStyle = "rgba(255, 240, 252, 0.65)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(ox, oy - 0.56 * r);
      c.lineTo(ox + 0.40 * r, oy);
      c.lineTo(ox, oy + 0.56 * r);
      c.lineTo(ox - 0.40 * r, oy);
      c.closePath();
      c.stroke();
    } else if (sceneId === "stage") {
      const bg = c.createLinearGradient(0, -r, 0, r);
      bg.addColorStop(0, "#1D114D");
      bg.addColorStop(0.55, "#4A3188");
      bg.addColorStop(1, "#140A38");
      c.fillStyle = bg;
      c.fillRect(-r * 1.25, -r * 1.25, r * 2.5, r * 2.5);

      c.fillStyle = "rgba(255, 150, 196, 0.34)";
      c.beginPath();
      c.moveTo(ox, oy - r * 0.95);
      c.lineTo(ox + r * 0.56, oy + r * 0.26);
      c.lineTo(ox - r * 0.56, oy + r * 0.26);
      c.closePath();
      c.fill();

      // 纯剪影独舞者（零五官）
      c.fillStyle = "#15093D";
      c.beginPath();
      c.arc(ox, oy - r * 0.22, r * 0.068, 0, Math.PI * 2);
      c.moveTo(ox, oy - r * 0.48);
      c.quadraticCurveTo(ox + r * 0.14, oy - r * 0.30, ox + r * 0.08, oy - r * 0.14);
      c.lineTo(ox + r * 0.28, oy + r * 0.16);
      c.lineTo(ox + r * 0.05, oy + r * 0.44);
      c.lineTo(ox - r * 0.05, oy + r * 0.44);
      c.lineTo(ox - r * 0.28, oy + r * 0.16);
      c.lineTo(ox - r * 0.08, oy - r * 0.14);
      c.quadraticCurveTo(ox - r * 0.14, oy - r * 0.30, ox, oy - r * 0.48);
      c.closePath();
      c.fill();
    } else {
      const bg = c.createLinearGradient(0, -r, 0, r);
      bg.addColorStop(0, "#3E347C");
      bg.addColorStop(0.5, "#C7A7DC");
      bg.addColorStop(1, "#1C124A");
      c.fillStyle = bg;
      c.fillRect(-r * 1.25, -r * 1.25, r * 2.5, r * 2.5);

      c.strokeStyle = "rgba(24, 8, 80, 0.58)";
      c.lineWidth = 1.4;
      c.beginPath();
      for (let k = 1; k <= 5; k++) {
        const s = (k / 5) * r * 1.05;
        c.moveTo(ox, oy - s * 1.15);
        c.lineTo(ox + s * 0.92, oy);
        c.lineTo(ox, oy + s * 1.15);
        c.lineTo(ox - s * 0.92, oy);
        c.closePath();
      }
      c.stroke();

      c.strokeStyle = "rgba(255, 255, 255, 0.36)";
      c.lineWidth = 1.1;
      c.beginPath();
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        c.moveTo(ox, oy);
        c.lineTo(ox + Math.cos(ang) * r * 1.2, oy + Math.sin(ang) * r * 1.2);
      }
      c.stroke();
    }
    c.restore();
  }

  function render(t, dt, { still }) {
    if (!w || !h) return;
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.4);
    }

    const ev = evaluate(store.get());
    lastEval = ev;
    const { geom, pillars, passed } = ev;
    const { state } = geom;

    const rad = half();
    const cx = w * 0.5;
    const cy = h * 0.5;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1. 安全画幅参考线
    const safeHalf = 0.875 * rad;
    ctx.strokeStyle = geom.clipped ? "rgba(196, 35, 78, 0.45)" : "rgba(72, 52, 148, 0.12)";
    ctx.lineWidth = geom.clipped ? 1.5 : 1;
    ctx.setLineDash([4, 5]);
    ctx.strokeRect(cx - safeHalf, cy - safeHalf, safeHalf * 2, safeHalf * 2);
    ctx.setLineDash([]);

    // 2. 光学分度刻度环（全部合批为 2 次 stroke，极低开销）
    const ringR = rad * 0.94;
    ctx.strokeStyle = PAL.violetFaint;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    for (let deg = 0; deg < 360; deg += 15) {
      if (deg % 90 === 0) continue;
      const a = ((deg - 90) * Math.PI) / 180;
      const len = deg % 90 === 45 ? 7 : 4;
      ctx.moveTo(cx + Math.cos(a) * (ringR - len), cy + Math.sin(a) * (ringR - len));
      ctx.lineTo(cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR);
    }
    ctx.stroke();

    ctx.strokeStyle = geom.axisAngleErr <= 7.5 ? PAL.rose : "rgba(72, 52, 148, 0.45)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let deg = 0; deg < 360; deg += 90) {
      const a = ((deg - 90) * Math.PI) / 180;
      ctx.moveTo(cx + Math.cos(a) * (ringR - 10), cy + Math.sin(a) * (ringR - 10));
      ctx.lineTo(cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR);
    }
    ctx.stroke();

    // 当前角度指示珠
    const dialAng = ((state.rot - 45 - 90) * Math.PI) / 180;
    ctx.fillStyle = geom.axisAngleErr <= 7.5 ? PAL.ok : PAL.rose;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(dialAng) * ringR, cy + Math.sin(dialAng) * ringR, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. 实绘四顶点像素坐标
    const ease = 1 - Math.pow(1 - intro, 3);
    const k = 0.94 + 0.06 * ease;
    const outerPts = geom.verts.map((v) => toPx(v.x * k, v.y * k));
    const innerPts = geom.verts.map((v) => toPx(v.x * 0.915 * k, v.y * 0.915 * k));
    const diagPx = toPx(geom.diagCenter.x, geom.diagCenter.y);
    const focusPx = toPx(geom.focus.x, geom.focus.y);

    // 4. 菱窗裁剪：内部画面 + 对角虚线 + 四向内指箭 + 合批粒子
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(innerPts[0].x, innerPts[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(innerPts[i].x, innerPts[i].y);
    ctx.closePath();
    ctx.clip();

    ctx.save();
    ctx.translate(cx, cy);
    drawSceneContent(ctx, state.scene, geom.focus.x, geom.focus.y, rad, still ? 0 : t);
    ctx.restore();

    // 对角虚线
    const span = rad * 1.1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.56)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(diagPx.x - span, diagPx.y - span);
    ctx.lineTo(diagPx.x + span, diagPx.y + span);
    ctx.moveTo(diagPx.x + span, diagPx.y - span);
    ctx.lineTo(diagPx.x - span, diagPx.y + span);
    ctx.stroke();
    ctx.setLineDash([]);

    // 四支内指玫红箭（单次 beginPath + stroke）
    ctx.strokeStyle = pillars.diagonal.ok ? "#FF5B96" : "#FF87B0";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const vp = innerPts[i];
      const vx = diagPx.x - vp.x;
      const vy = diagPx.y - vp.y;
      const len = Math.hypot(vx, vy) || 1;
      const ux = vx / len, uy = vy / len;
      const aLen = clamp(len * 0.20, 14, 34);
      const sx = vp.x + ux * 10, sy = vp.y + uy * 10;
      const tx = sx + ux * aLen, ty = sy + uy * aLen;
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      const wing = 6.5, px = -uy, py = ux;
      ctx.moveTo(tx - ux * wing + px * wing * 0.8, ty - uy * wing + py * wing * 0.8);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx - ux * wing - px * wing * 0.8, ty - uy * wing - py * wing * 0.8);
    }
    ctx.stroke();

    // 实时视线流光粒子（合批 1 次 fill）
    if (state.showFlow) {
      ctx.fillStyle = passed === 4 ? "rgba(255, 138, 184, 0.82)" : "rgba(255, 195, 218, 0.62)";
      ctx.beginPath();
      const pr = passed === 4 ? 2.6 : 2.1;
      for (const p of particles) {
        const phase = still ? p.phase : (p.phase + t * p.speed) % 1;
        const a = innerPts[p.edge];
        const b = innerPts[(p.edge + 1) % 4];
        const sx = (a.x + b.x) * 0.5 + (b.x - a.x) * p.lane;
        const sy = (a.y + b.y) * 0.5 + (b.y - a.y) * p.lane;
        let tx, ty;
        if (!state.clutter && geom.axisAngleErr <= 10) {
          tx = diagPx.x;
          ty = diagPx.y;
        } else if (state.clutter) {
          const cb = CORNER_BADGES[p.edge];
          const cpx = toPx(cb.x * 0.6, cb.y * 0.6);
          tx = diagPx.x * 0.35 + cpx.x * 0.65;
          ty = diagPx.y * 0.35 + cpx.y * 0.65;
        } else {
          tx = sx + (b.x - a.x) * 0.36;
          ty = sy + (b.y - a.y) * 0.36;
        }
        const x = sx + (tx - sx) * phase;
        const y = sy + (ty - sy) * phase;
        ctx.moveTo(x + pr, y);
        ctx.arc(x, y, pr, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.restore();

    // 5. 外层紫虚线菱框
    const borderWarn = !pillars.balance.ok || !pillars.diagonal.ok;
    ctx.strokeStyle = borderWarn ? PAL.roseDeep : PAL.violet;
    ctx.lineWidth = borderWarn ? 2.0 : 1.8;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(outerPts[0].x, outerPts[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(outerPts[i].x, outerPts[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. 四角干扰标（合批连线 + 4 块标牌）
    if (state.clutter) {
      ctx.strokeStyle = "rgba(196, 35, 78, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      const cpts = CORNER_BADGES.map((cb) => toPx(cb.x, cb.y));
      for (const pt of cpts) {
        ctx.moveTo(cx + (pt.x - cx) * 0.48, cy + (pt.y - cy) * 0.48);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const bw = clamp(w * 0.115, 44, 62);
      const bh = clamp(w * 0.068, 28, 36);
      ctx.font = `700 ${Math.round(clamp(w * 0.022, 10, 12))}px "Chivo", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < 4; i++) {
        const pt = cpts[i];
        ctx.fillStyle = "#C4234E";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        roundRect(ctx, pt.x - bw / 2, pt.y - bh / 2, bw, bh, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`× ${CORNER_BADGES[i].tag}`, pt.x, pt.y + 0.5);
      }
    }

    // 7. 焦点偏差连线
    if (geom.focusDist > 0.05) {
      ctx.strokeStyle = "#FF84B0";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(diagPx.x, diagPx.y);
      ctx.lineTo(focusPx.x, focusPx.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.beginPath();
      ctx.arc(diagPx.x, diagPx.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. 中央「视觉核心 FOCUS」玫红内菱框
    const coreR = clamp(rad * 0.255, 42, 74);
    ctx.save();
    ctx.translate(focusPx.x, focusPx.y);
    ctx.fillStyle = "rgba(38, 28, 86, 0.72)";
    ctx.beginPath();
    ctx.moveTo(0, -coreR);
    ctx.lineTo(coreR * 0.88, 0);
    ctx.lineTo(0, coreR);
    ctx.lineTo(-coreR * 0.88, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = activeDrag === "focus" || hoverTarget === "focus" ? "#FF84B5" : PAL.rose;
    ctx.lineWidth = activeDrag === "focus" ? 2.8 : 2.1;
    ctx.stroke();

    const tr = coreR * 0.72;
    ctx.strokeStyle = "rgba(255, 130, 178, 0.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-5, -tr + 6); ctx.lineTo(0, -tr); ctx.lineTo(5, -tr + 6);
    ctx.moveTo(-5, tr - 6); ctx.lineTo(0, tr); ctx.lineTo(5, tr - 6);
    ctx.stroke();

    const fsZh = Math.round(clamp(w * 0.030, 12, 17));
    const fsEn = Math.round(clamp(w * 0.020, 10, 12));
    ctx.fillStyle = "#FF99BE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${fsZh}px "Noto Sans SC", sans-serif`;
    ctx.fillText("视觉核心", 0, -fsEn * 0.65);
    ctx.font = `700 ${fsEn}px "Syne", "Chivo", sans-serif`;
    ctx.fillText("FOCUS", 0, fsZh * 0.62);
    ctx.restore();

    // 9. 四枚可拖深靛紫顶点圆锚（合批白芯）
    const nodeR = clamp(w * 0.020, 7.5, 11.5);
    for (let i = 0; i < 4; i++) {
      const pt = outerPts[i];
      const id = `V:${geom.verts[i].id}`;
      const isHot = activeDrag === id || hoverTarget === id;
      ctx.fillStyle = isHot ? PAL.rose : PAL.violet;
      ctx.strokeStyle = PAL.bg;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, nodeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(outerPts[i].x + 2.2, outerPts[i].y);
      ctx.arc(outerPts[i].x, outerPts[i].y, 2.2, 0, Math.PI * 2);
    }
    ctx.fill();

    // 10. 顶部极简光学读数条
    ctx.font = `600 ${Math.round(clamp(w * 0.021, 10, 12))}px "Chivo", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `旋角 ${Math.round(state.rot)}° · 轴比 ${state.aspect.toFixed(2)}:1 · 边差 ${Math.round(geom.edgeSpreadPct)}%`,
      8,
      6
    );
    ctx.textAlign = "right";
    ctx.fillStyle = passed === 4 ? PAL.ok : PAL.roseDeep;
    ctx.fillText(ev.diagnosis.statusBadge, w - 8, 6);

    ctx.restore();
  }

  function hitTest(px, py) {
    const { geom } = lastEval;
    const rad = half();
    const outerPts = geom.verts.map((v) => toPx(v.x, v.y));

    if (geom.state.clutter) {
      for (const cb of CORNER_BADGES) {
        const pt = toPx(cb.x, cb.y);
        if (Math.hypot(px - pt.x, py - pt.y) < clamp(w * 0.09, 34, 48)) return "clutter";
      }
    }
    for (let i = 0; i < 4; i++) {
      if (Math.hypot(px - outerPts[i].x, py - outerPts[i].y) < 24) return `V:${geom.verts[i].id}`;
    }
    const focusPx = toPx(geom.focus.x, geom.focus.y);
    if (Math.hypot(px - focusPx.x, py - focusPx.y) < clamp(rad * 0.21, 32, 56)) return "focus";
    return "bezel";
  }

  // ---------- 指针交互（单通道零重复触发，touch-action: pan-y 保证触屏顺滑） ----------
  let dragStart = null;
  let touchLocked = null;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const pt = getPos(e);
    const target = hitTest(pt.x, pt.y);
    if (target === "clutter") {
      store.patch({ clutter: false });
      return;
    }
    const s = store.get();
    activeDrag = target;
    touchLocked = null;
    dragStart = {
      x: pt.x,
      y: pt.y,
      rot: s.rot,
      aspect: s.aspect,
      skew: s.skew,
      scale: s.scale,
      focusX: s.focusX,
      focusY: s.focusY,
      pointerType: e.pointerType,
    };
    if (e.pointerType !== "touch") canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = getPos(e);
    if (!activeDrag || !dragStart) {
      const hTarget = hitTest(pt.x, pt.y);
      if (hTarget !== hoverTarget) {
        hoverTarget = hTarget;
        canvas.style.cursor = hTarget === "clutter" ? "pointer" : "grab";
        if (reducedMotion.matches) ctl.draw();
      }
      return;
    }

    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;
    const rad = half();

    if (dragStart.pointerType === "touch" && activeDrag === "bezel" && !touchLocked) {
      if (Math.hypot(dx, dy) < 5) return;
      touchLocked = Math.abs(dx) >= Math.abs(dy) * 0.8 ? "h" : "v";
      if (touchLocked === "v") {
        activeDrag = null;
        return;
      }
    }

    if (activeDrag === "bezel") {
      let nextRot = clamp(dragStart.rot + (dx / Math.max(rad, 120)) * 52, 0, 90);
      if (Math.abs(nextRot - 45) < 2.2) nextRot = 45;
      store.patch({ rot: Math.round(nextRot * 10) / 10 });
    } else if (activeDrag === "focus") {
      const nx = clamp(dragStart.focusX + dx / rad, -0.34, 0.34);
      const ny = clamp(dragStart.focusY + dy / rad, -0.34, 0.34);
      const snap = Math.hypot(nx, ny) < 0.045;
      store.patch({
        focusX: snap ? 0 : Math.round(nx * 100) / 100,
        focusY: snap ? 0 : Math.round(ny * 100) / 100,
      });
    } else if (activeDrag.startsWith("V:")) {
      const id = activeDrag.slice(2);
      const n = toNorm(pt.x, pt.y);
      const deltaRad = (-(store.get().rot - 45) * Math.PI) / 180;
      const lx = n.x * Math.cos(deltaRad) - n.y * Math.sin(deltaRad);
      const ly = n.x * Math.sin(deltaRad) + n.y * Math.cos(deltaRad);

      if (id === "T" || id === "B") {
        const wantRy = clamp(Math.abs(ly), 0.32, 0.96);
        const curRx = clamp(lastEval.geom.rx, 0.36, 0.88);
        const nextAspect = clamp(wantRy / curRx, 0.48, 1.76);
        const nextScale = clamp(Math.sqrt(wantRy * curRx) / 0.77, 0.44, 1.04);
        let nextSkew = clamp(((id === "T" ? lx : -lx) / Math.max(curRx, 0.35)) * 0.85, -0.36, 0.36);
        if (Math.abs(nextSkew) < 0.035) nextSkew = 0;
        store.patch({
          aspect: Math.round(nextAspect * 100) / 100,
          scale: Math.round(nextScale * 100) / 100,
          skew: Math.round(nextSkew * 100) / 100,
        });
      } else {
        const wantRx = clamp(Math.abs(lx), 0.32, 0.96);
        const curRy = clamp(lastEval.geom.ry, 0.36, 0.88);
        const nextAspect = clamp(curRy / wantRx, 0.48, 1.76);
        const nextScale = clamp(Math.sqrt(curRy * wantRx) / 0.77, 0.44, 1.04);
        store.patch({
          aspect: Math.round(nextAspect * 100) / 100,
          scale: Math.round(nextScale * 100) / 100,
        });
      }
    }
  });

  const endDrag = () => {
    activeDrag = null;
    dragStart = null;
    touchLocked = null;
    canvas.style.cursor = "grab";
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("keydown", (e) => {
    const s = store.get();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      store.patch({ rot: clamp(Math.round(s.rot - 3), 0, 90) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      store.patch({ rot: clamp(Math.round(s.rot + 3), 0, 90) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      store.patch({ aspect: clamp(Math.round((s.aspect + 0.06) * 100) / 100, 0.48, 1.76) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      store.patch({ aspect: clamp(Math.round((s.aspect - 0.06) * 100) / 100, 0.48, 1.76) });
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      store.patch({ clutter: !s.clutter });
    }
  });

  const ctl = loop(canvas, (t, dt, opts) => {
    render(t, dt, opts);
  });

  // loop 正在运行时不额外同步重绘，避免单帧内画两遍拖慢软件渲染；静止/减动效时立即重绘
  store.subscribe(() => {
    if (reducedMotion.matches || document.hidden) ctl.draw();
  });

  return { draw: () => ctl.draw(), destroy: () => ro.disconnect() };
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
