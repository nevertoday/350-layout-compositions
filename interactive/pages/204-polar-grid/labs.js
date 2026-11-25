// 204 极坐标网格 · 正文各节独立交互实验室渲染引擎（02 面积对照、03 直角↔极坐标卷绕、04 四应用仪器、05 历史微图）
import { pixelRatio } from "../../lib/stage.js";
import { evaluateAreaLab, morphPoint } from "./model.js";

function prepCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(200, Math.round(rect.width));
  const h = Math.max(150, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ==================== 02 节：双盘面积诚实度对照画布 ====================
export function renderAreaLabCanvas(canvas, valueRatio, highlightMode) {
  const { ctx, w, h } = prepCanvas(canvas);
  ctx.fillStyle = "#F4F9FD";
  ctx.fillRect(0, 0, w, h);

  const isNarrow = w < 560;
  const linear = evaluateAreaLab(valueRatio, "linear");
  const sqrt = evaluateAreaLab(valueRatio, "sqrt");

  const panels = isNarrow
    ? [
        { cx: w * 0.5, cy: h * 0.27, R: Math.min(w * 0.32, h * 0.19), mode: "linear", data: linear, title: "误用：线性半径 r ∝ v" },
        { cx: w * 0.5, cy: h * 0.74, R: Math.min(w * 0.32, h * 0.19), mode: "sqrt", data: sqrt, title: "诚实：面积守恒 r ∝ √v" },
      ]
    : [
        { cx: w * 0.27, cy: h * 0.53, R: Math.min(w * 0.20, h * 0.36), mode: "linear", data: linear, title: "误用：线性半径 r ∝ v" },
        { cx: w * 0.73, cy: h * 0.53, R: Math.min(w * 0.20, h * 0.36), mode: "sqrt", data: sqrt, title: "诚实：面积守恒 r ∝ √v" },
      ];

  // 分隔线
  ctx.strokeStyle = "#C9DAE8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (isNarrow) {
    ctx.moveTo(16, h * 0.5);
    ctx.lineTo(w - 16, h * 0.5);
  } else {
    ctx.moveTo(w * 0.5, 16);
    ctx.lineTo(w * 0.5, h - 16);
  }
  ctx.stroke();

  const span = (Math.PI / 180) * 45; // 45° 等宽扇区

  for (const p of panels) {
    const active = highlightMode === p.mode || highlightMode === "both";
    const isErr = p.mode === "linear";
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.48;

    // 4 道同心参考环
    for (let k = 1; k <= 4; k++) {
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, (p.R * k) / 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#CADAE8";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // 十字基准
    ctx.strokeStyle = "#95B4CC";
    ctx.beginPath();
    ctx.moveTo(p.cx - p.R - 6, p.cy);
    ctx.lineTo(p.cx + p.R + 6, p.cy);
    ctx.moveTo(p.cx, p.cy - p.R - 6);
    ctx.lineTo(p.cx, p.cy + p.R + 6);
    ctx.stroke();

    // 扇区 A（右上 45°）：目标大值 vA
    const rA = p.data.rA * p.R;
    ctx.beginPath();
    ctx.moveTo(p.cx, p.cy);
    ctx.arc(p.cx, p.cy, rA, -Math.PI * 0.42, -Math.PI * 0.42 + span);
    ctx.closePath();
    ctx.fillStyle = isErr ? "rgba(181, 18, 83, 0.34)" : "rgba(0, 94, 128, 0.30)";
    ctx.fill();
    ctx.strokeStyle = isErr ? "#B51253" : "#005E80";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 扇区 B（左下 225°）：基准值 vB = 1.0
    const rB = p.data.rB * p.R;
    ctx.beginPath();
    ctx.moveTo(p.cx, p.cy);
    ctx.arc(p.cx, p.cy, rB, Math.PI * 0.58, Math.PI * 0.58 + span);
    ctx.closePath();
    ctx.fillStyle = "rgba(7, 24, 43, 0.24)";
    ctx.fill();
    ctx.strokeStyle = "#07182B";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 标题与实算倍比读数
    ctx.font = '700 13px "Noto Sans SC", sans-serif';
    ctx.fillStyle = isErr ? "#A5104B" : "#005372";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(p.title, p.cx, p.cy - p.R - 14);

    ctx.font = '600 11.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#07182B";
    ctx.textBaseline = "top";
    const stat = `半径 ${p.data.radiusRatio.toFixed(2)}× · 面积 ${p.data.areaRatio.toFixed(2)}×`;
    ctx.fillText(stat, p.cx, p.cy + p.R + 10);

    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = isErr && p.data.errorPct > 2 ? "#B51253" : "#0D6B48";
    const verdict =
      isErr && p.data.errorPct > 2
        ? `视觉面积夸大 +${Math.round(p.data.errorPct)}%`
        : "面积严格等于数据倍比（0% 误差）";
    ctx.fillText(verdict, p.cx, p.cy + p.R + 27);

    // 圆心点
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#07182B";
    ctx.fill();
    ctx.restore();
  }
}

// ==================== 03 节：直角 ↔ 极坐标连续拓扑卷绕暗室画布 ====================
export function createMorphLab(canvas, onPinChange) {
  let lastMeta = { cx: 200, cy: 200, R: 120, rectW: 260, rectH: 140, morph: 0.65 };

  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    // 在 13×6 网格交点里寻找最近的交点并钉住
    let best = { u: 0.25, v: 0.6, d: 9999 };
    for (let iu = 0; iu <= 12; iu++) {
      for (let iv = 1; iv <= 5; iv++) {
        const u = iu / 12;
        const v = iv / 5;
        const pt = morphPoint(u, v, lastMeta.morph, lastMeta.cx, lastMeta.cy, lastMeta.R, lastMeta.rectW, lastMeta.rectH);
        const d = Math.hypot(pt.x - mx, pt.y - my);
        if (d < best.d) best = { u, v, d };
      }
    }
    if (best.d < 44) onPinChange(best.u, best.v);
  });

  function render(morph, traceKind, pin) {
    const { ctx, w, h } = prepCanvas(canvas);
    ctx.fillStyle = "#000B19";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w * 0.37, h * 0.41);
    const rectW = Math.min(w * 0.78, R * 2.4);
    const rectH = Math.min(h * 0.64, R * 1.35);
    lastMeta = { cx, cy, R, rectW, rectH, morph };

    // 1. 画常半径线 v = const（直角是水平线，极坐标卷成同心圆）
    for (let iv = 1; iv <= 5; iv++) {
      const v = iv / 5;
      ctx.beginPath();
      for (let s = 0; s <= 72; s++) {
        const u = s / 72;
        const pt = morphPoint(u, v, morph, cx, cy, R, rectW, rectH);
        if (s === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = iv === 4 ? "rgba(27, 203, 255, 0.72)" : "rgba(92, 134, 178, 0.36)";
      ctx.lineWidth = iv === 4 ? 1.5 : 1;
      ctx.stroke();
    }

    // 2. 画常角度线 u = const（直角是竖直线，极坐标收束成角射线）
    for (let iu = 0; iu <= 12; iu++) {
      const u = iu / 12;
      const isCard = iu % 3 === 0;
      ctx.save();
      ctx.beginPath();
      for (let s = 0; s <= 24; s++) {
        const v = s / 24;
        const pt = morphPoint(u, v, morph, cx, cy, R, rectW, rectH);
        if (s === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      if (!isCard) ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isCard ? "rgba(27, 203, 255, 0.78)" : "rgba(244, 246, 248, 0.32)";
      ctx.lineWidth = isCard ? 1.4 : 1;
      ctx.stroke();
      ctx.restore();
    }

    // 3. 高亮追踪曲线（三种数学母题）
    ctx.save();
    ctx.beginPath();
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      let v = 0.6;
      if (traceKind === "wave") {
        // 周期温度/潮汐波：0° 与 360° 无缝闭合！
        v = 0.56 + 0.32 * Math.sin(u * Math.PI * 2 - Math.PI / 4);
      } else if (traceKind === "spiral") {
        // 阿基米德螺线：直角是一条斜直线，极坐标卷成等距螺线！
        v = 0.1 + 0.85 * u;
      } else {
        // 恒定半径线：直角是水平直线 y = 3.0，极坐标卷成正圆 r = 3.0
        v = 0.6;
      }
      const pt = morphPoint(u, v, morph, cx, cy, R, rectW, rectH);
      if (s === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = "#FC3782";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();

    // 4. 钉住的追踪点 P
    const pPt = morphPoint(pin.u, pin.v, morph, cx, cy, R, rectW, rectH);
    ctx.beginPath();
    ctx.arc(pPt.x, pPt.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(252, 55, 130, 0.28)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pPt.x, pPt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#FC3782";
    ctx.fill();
    ctx.strokeStyle = "#F4F6F8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 0° 与 360° 端点徽标（直观展示卷绕时两端如何首尾咬合）
    const pStart = morphPoint(0, 1, morph, cx, cy, R, rectW, rectH);
    const pEnd = morphPoint(1, 1, morph, cx, cy, R, rectW, rectH);
    ctx.font = '600 11px "IBM Plex Mono", "IBM Plex Sans", "Noto Sans SC", monospace';
    ctx.fillStyle = "#1BCBFF";
    ctx.textAlign = "center";
    ctx.textBaseline = morph > 0.85 ? "top" : "bottom";
    const yOff = morph > 0.85 ? 10 : -8;
    ctx.fillText(morph > 0.94 ? "0° = 360° 闭合" : "0°", pStart.x, pStart.y + yOff);
    if (morph <= 0.94) {
      ctx.fillStyle = "#FF86B4";
      ctx.fillText("360°", pEnd.x, pEnd.y + yOff);
    }
  }

  return { render };
}

// ==================== 04 节：原海报四类应用场景实时仪器画布 ====================
export function renderAppInstrument(canvas, appId, subMode, t) {
  const { ctx, w, h } = prepCanvas(canvas);
  ctx.fillStyle = "#000B19";
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.32;

  // 共享精细极坐标底格
  for (let k = 1; k <= 4; k++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (R * k) / 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(92, 134, 178, 0.34)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const rays = appId === "clock" ? 12 : 8;
  for (let i = 0; i < rays; i++) {
    const a = (i * Math.PI * 2) / rays - Math.PI / 2;
    ctx.save();
    if (i % (rays / 4) !== 0) ctx.setLineDash([4, 4]);
    ctx.strokeStyle = i % (rays / 4) === 0 ? "rgba(27, 203, 255, 0.62)" : "rgba(244, 246, 248, 0.28)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
    ctx.restore();
  }

  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.fillStyle = "#B9CCE0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (appId === "radar") {
    // 雷达 PPI：北向 0° 顺时针扫描 + 真实距离目标
    const labels = ["000° N", "090° E", "180° S", "270° W"];
    labels.forEach((lb, i) => {
      const a = (i * Math.PI) / 2 - Math.PI / 2;
      ctx.fillText(lb, cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 18));
    });
    const sweep = ((t * 0.9) % (Math.PI * 2)) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sweep - 0.55, sweep);
    ctx.closePath();
    ctx.fillStyle = "rgba(27, 203, 255, 0.2)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
    ctx.strokeStyle = "#1BCBFF";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const blips = subMode === "alt"
      ? [
          { deg: 28, r: 0.78, tag: "A-12" },
          { deg: 145, r: 0.52, tag: "B-04" },
          { deg: 215, r: 0.86, tag: "C-19" },
          { deg: 312, r: 0.36, tag: "D-07" },
        ]
      : [
          { deg: 52, r: 0.68, tag: "F-01" },
          { deg: 118, r: 0.44, tag: "F-02" },
          { deg: 260, r: 0.82, tag: "F-03" },
        ];
    for (const b of blips) {
      const a = ((b.deg - 90) * Math.PI) / 180;
      const bx = cx + Math.cos(a) * b.r * R;
      const by = cy + Math.sin(a) * b.r * R;
      ctx.beginPath();
      ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FC3782";
      ctx.fill();
      ctx.fillStyle = "#F4F6F8";
      ctx.textAlign = "left";
      ctx.fillText(b.tag, bx + 8, by);
    }
  } else if (appId === "wind") {
    // 风玫瑰：冬季西北季风 vs 夏季东南季风，严格使用 √v 面积缩放
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const vals =
      subMode === "alt"
        ? [22, 34, 54, 88, 66, 32, 18, 20] // 夏季东南季风
        : [58, 26, 18, 20, 22, 34, 62, 92]; // 冬季西北季风
    const span = (Math.PI * 2) / 8;
    dirs.forEach((d, i) => {
      const a = (i * Math.PI * 2) / 8 - Math.PI / 2;
      const rr = Math.sqrt(vals[i] / 100) * R;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rr, a - span * 0.38, a + span * 0.38);
      ctx.closePath();
      ctx.fillStyle = vals[i] > 70 ? "rgba(252, 55, 130, 0.46)" : "rgba(27, 203, 255, 0.26)";
      ctx.fill();
      ctx.strokeStyle = vals[i] > 70 ? "#FC3782" : "#1BCBFF";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = "#B9CCE0";
      ctx.textAlign = "center";
      ctx.fillText(d, cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16));
    });
  } else if (appId === "clock") {
    // 24h 节律数据盘：0 点与 24 点无缝闭合
    const hrs = ["00h", "06h", "12h", "18h"];
    hrs.forEach((lb, i) => {
      const a = (i * Math.PI) / 2 - Math.PI / 2;
      ctx.fillText(lb, cx + Math.cos(a) * (R + 18), cy + Math.sin(a) * (R + 18));
    });
    const series =
      subMode === "alt"
        ? [18, 14, 12, 16, 30, 62, 84, 72, 58, 52, 64, 88] // 通勤双峰
        : [26, 18, 12, 10, 14, 24, 48, 72, 86, 94, 78, 52]; // 夜间阅读单峰
    const span = (Math.PI * 2) / 12;
    series.forEach((v, i) => {
      const a = (i * Math.PI * 2) / 12 - Math.PI / 2 + span / 2;
      const rr = Math.sqrt(v / 100) * R;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rr, a - span * 0.42, a + span * 0.42);
      ctx.closePath();
      ctx.fillStyle = v > 75 ? "rgba(252, 55, 130, 0.42)" : "rgba(27, 203, 255, 0.25)";
      ctx.fill();
      ctx.strokeStyle = v > 75 ? "#FC3782" : "#1BCBFF";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  } else {
    // 声学/天线指向性极坐标图 r(θ)（心形指向 vs 8 字双指向）
    ["0° 正前", "90° 侧", "180° 背", "270° 侧"].forEach((lb, i) => {
      const a = (i * Math.PI) / 2 - Math.PI / 2;
      ctx.fillText(lb, cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 17));
    });
    ctx.beginPath();
    for (let s = 0; s <= 180; s++) {
      const theta = (s / 180) * Math.PI * 2;
      // 心形 r = 0.5 + 0.5 cos(theta)，8 字形 r = |cos(theta)|
      const gain = subMode === "alt" ? Math.abs(Math.cos(theta)) : 0.5 + 0.5 * Math.cos(theta);
      const a = theta - Math.PI / 2;
      const x = cx + Math.cos(a) * gain * R * 0.92;
      const y = cy + Math.sin(a) * gain * R * 0.92;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(252, 55, 130, 0.26)";
    ctx.fill();
    ctx.strokeStyle = "#FC3782";
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#F4F6F8";
  ctx.fill();
}

// ==================== 05 节：历史演进档案微图 ====================
export function renderHistorySketch(canvas, eraId) {
  const { ctx, w, h } = prepCanvas(canvas);
  ctx.fillStyle = "#041224";
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.38;

  if (eraId === "bernoulli") {
    // 1691 伯努利对数螺线 r = a * e^(bθ)
    for (let k = 1; k <= 4; k++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * k) / 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(92, 134, 178, 0.28)";
      ctx.stroke();
    }
    ctx.beginPath();
    for (let s = 0; s <= 240; s++) {
      const th = (s / 240) * Math.PI * 5.2;
      const rr = R * 0.04 * Math.exp(0.195 * th);
      if (rr > R * 1.05) break;
      const x = cx + Math.cos(th) * rr;
      const y = cy - Math.sin(th) * rr;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#1BCBFF";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#FF86B4";
    ctx.textAlign = "left";
    ctx.fillText("r = a · e^(bθ)", 14, 22);
  } else if (eraId === "nightingale") {
    // 1858 南丁格尔极区面积图示意（蓝疫病远超红战伤，严格 √v）
    const disease = [18, 22, 34, 62, 74, 80, 95, 100, 82, 54, 38, 26];
    const wounds = [4, 6, 8, 12, 18, 22, 26, 20, 14, 10, 6, 4];
    const span = (Math.PI * 2) / 12;
    for (let i = 0; i < 12; i++) {
      const a0 = i * span - Math.PI / 2;
      const rD = Math.sqrt(disease[i] / 100) * R;
      const rW = Math.sqrt(wounds[i] / 100) * R;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rD, a0, a0 + span);
      ctx.closePath();
      ctx.fillStyle = "rgba(27, 203, 255, 0.34)";
      ctx.fill();
      ctx.strokeStyle = "#1BCBFF";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rW, a0, a0 + span);
      ctx.closePath();
      ctx.fillStyle = "rgba(252, 55, 130, 0.65)";
      ctx.fill();
    }
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#1BCBFF";
    ctx.textAlign = "left";
    ctx.fillText("AREA ∝ DEATHS (r ∝ √v)", 14, 22);
  } else if (eraId === "ppi") {
    // 1940–1941 PPI 雷达平面位置显示器
    for (let k = 1; k <= 4; k++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * k) / 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(70, 224, 160, 0.36)";
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, -1.2, -0.55);
    ctx.closePath();
    ctx.fillStyle = "rgba(70, 224, 160, 0.24)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(-0.55) * R, cy + Math.sin(-0.55) * R);
    ctx.strokeStyle = "#46E0A0";
    ctx.lineWidth = 2;
    ctx.stroke();
    [
      [0.45, -0.7],
      [0.72, -0.95],
      [0.82, 0.8],
    ].forEach(([rr, aa]) => {
      ctx.beginPath();
      ctx.arc(cx + Math.cos(aa) * rr * R, cy + Math.sin(aa) * rr * R, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#FC3782";
      ctx.fill();
    });
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#46E0A0";
    ctx.textAlign = "left";
    ctx.fillText("PPI · RANGE r × AZIMUTH θ", 14, 22);
  } else {
    // 1984 & 2010 视觉感知排序对比条（公共基线 > 长度/角度 > 面积）
    const bars = [
      { label: "1. 公共基线位置（直角）", w: 0.92, col: "#1BCBFF" },
      { label: "2. 长度与角度（极轴）", w: 0.64, col: "#7CCDF2" },
      { label: "3. 二维面积（扇区）", w: 0.44, col: "#FC3782" },
      { label: "4. 色彩深浅（热图）", w: 0.26, col: "#7D95B0" },
    ];
    const startX = 18;
    const maxW = w - 36;
    ctx.font = '500 11.5px "Noto Sans SC", sans-serif';
    bars.forEach((b, i) => {
      const y = 30 + i * ((h - 46) / 4);
      ctx.fillStyle = "#DCE9F7";
      ctx.textAlign = "left";
      ctx.fillText(b.label, startX, y);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(startX, y + 6, maxW, 10);
      ctx.fillStyle = b.col;
      ctx.fillRect(startX, y + 6, maxW * b.w, 10);
    });
  }
}
