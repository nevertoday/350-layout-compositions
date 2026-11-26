// 052 放射式构图 — 正文各节独立交互实验模块
// 严格遵循：相邻节零控件重复、零五官人物、全量尊重 prefers-reduced-motion、单真源实时读数。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, clamp } from "./model.js";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(200, Math.round(rect.width));
  const h = Math.max(160, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}

function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.52);
  ctx.lineTo(-size * 0.74, 0);
  ctx.lineTo(-size, size * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// =========================================================================
// 01 矢量流向四联对照仪（放射 052 / 向心 053 / 离心 054 / 同心 055）
// =========================================================================
export function mountPolarityDemo() {
  const canvas = document.getElementById("polarityCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const buttons = [...document.querySelectorAll("[data-polarity]")];
  const toggleBtn = document.getElementById("polarityPlayBtn");
  const titleEl = document.getElementById("polarityTitle");
  const bodyEl = document.getElementById("polarityBody");
  const metaFlow = document.getElementById("polarityFlowMeta");
  const metaCore = document.getElementById("polarityCoreMeta");
  const linkEl = document.getElementById("polaritySiblingLink");

  const MODES = {
    radiating: {
      title: "052 放射式构图 · 单核高能向外爆开",
      flow: "由核向外（兼锁中心）",
      core: "实心强主核（文字/主体落核）",
      body: "核心是高能起点，参差射线把注意力既锚在中心，又同步向四面八方释放爆发势能。它是「聚焦」与「扩张」的复合体。",
      linkText: "当前本页主角：052 放射式构图",
      linkHref: "",
    },
    centripetal: {
      title: "053 向心式构图 · 四周元素向内挤压聚拢",
      flow: "由边向心（强力吸聚）",
      core: "被围攻/被托举的终点靶核",
      body: "能量方向与放射式正好相反：所有外围形体、箭头或视线从画框四周朝中心压迫汇合，强调「收敛、聚焦与向内牵引」。",
      linkText: "去看 053 向心式构图在线互动版 →",
      linkHref: "https://layout.xiaoxiaodong.ai/053/play/",
    },
    centrifugal: {
      title: "054 离心式构图 · 抛离中心、冲破画框",
      flow: "甩离中心（外逃出界）",
      core: "中心退空或失锚",
      body: "元素被甩向画幅边缘甚至冲出裁切线，中心往往留空或不再做主要落脚点，用来表达飞散、失控、解脱或极速外溢。",
      linkText: "去看 054 离心式构图在线互动版 →",
      linkHref: "https://layout.xiaoxiaodong.ai/054/play/",
    },
    concentric: {
      title: "055 同心式构图 · 层层圆环平静荡开",
      flow: "环向包裹（无尖锐刺射）",
      core: "套叠圆心（层层递进）",
      body: "同样共享圆心，但以一圈套一圈的闭合环带向外扩散，情绪从「尖锐爆发」转为「声波、年轮与递进层级」。",
      linkText: "去看 055 同心式构图在线互动版 →",
      linkHref: "https://layout.xiaoxiaodong.ai/055/play/",
    },
  };

  let mode = "radiating";
  let playing = true;
  let phase = 0.35;

  function syncText() {
    const m = MODES[mode];
    if (titleEl) titleEl.textContent = m.title;
    if (bodyEl) bodyEl.textContent = m.body;
    if (metaFlow) metaFlow.textContent = m.flow;
    if (metaCore) metaCore.textContent = m.core;
    if (linkEl) {
      if (m.linkHref) {
        linkEl.href = m.linkHref;
        linkEl.textContent = m.linkText;
        linkEl.hidden = false;
      } else {
        linkEl.hidden = true;
      }
    }
    buttons.forEach((b) => {
      const active = b.dataset.polarity === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  function draw(t, dt, { still }) {
    const { w, h, dpr } = fitCanvas(canvas);
    if (!still && playing) phase = (phase + (dt || 0.016) * 0.42) % 1;
    const p = still ? 0.52 : phase;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.42;

    // 淡参考圆
    ctx.strokeStyle = "rgba(239, 229, 205, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (mode === "radiating") {
      // 发光核心 + 参差向外射线 + 外冲粒子
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, R * 0.44);
      g.addColorStop(0, PALETTE.coreBright);
      g.addColorStop(0.52, "rgba(240, 198, 50, 0.55)");
      g.addColorStop(1, "rgba(25, 13, 44, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.44, 0, Math.PI * 2);
      ctx.fill();

      const n = 20;
      for (let i = 0; i < n; i++) {
        if (i % 5 === 2) continue; // 暗空呼吸隙
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const isThick = i % 3 === 0;
        const r0 = R * 0.28;
        const r1 = R * (isThick ? 1.02 : i % 2 === 0 ? 0.86 : 0.72);
        ctx.strokeStyle = isThick ? PALETTE.gold : PALETTE.cream;
        ctx.lineWidth = isThick ? 4.4 : 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();

        // 外冲脉冲箭头
        const u = (p + (i % 4) * 0.25) % 1;
        const px = cx + Math.cos(a) * (r0 + u * (r1 - r0));
        const py = cy + Math.sin(a) * (r0 + u * (r1 - r0));
        drawArrowHead(ctx, px, py, a, isThick ? 8.5 : 5.5, isThick ? PALETTE.coreBright : PALETTE.cream);
      }

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${Math.round(clamp(R * 0.17, 13, 20))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("强核", cx, cy);
    } else if (mode === "centripetal") {
      // 四周向内指向的压缩箭头
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const rOut = R * 1.02;
        const rIn = R * 0.30;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(239, 229, 205, 0.72)" : "rgba(240, 198, 50, 0.56)";
        ctx.lineWidth = i % 2 === 0 ? 2.4 : 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
        ctx.lineTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn);
        ctx.stroke();

        const u = (p + (i % 3) * 0.33) % 1;
        const dist = rOut - u * (rOut - rIn);
        drawArrowHead(ctx, cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, a + Math.PI, 8, PALETTE.coreBright);
      }
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `700 ${Math.round(clamp(R * 0.15, 12, 18))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("汇点", cx, cy);
    } else if (mode === "centrifugal") {
      // 中心空洞 + 外围碎片被甩向四边
      ctx.strokeStyle = "rgba(239, 229, 205, 0.28)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(239, 229, 205, 0.65)";
      ctx.font = `500 ${Math.round(clamp(R * 0.13, 11, 15))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("空心", cx, cy);

      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.18;
        const u = (p + (i % 5) * 0.2) % 1;
        const rStart = R * (0.58 + u * 0.34);
        const sz = 7 + (i % 3) * 4;
        const px = cx + Math.cos(a) * rStart;
        const py = cy + Math.sin(a) * rStart;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a);
        ctx.fillStyle = i % 2 === 0 ? PALETTE.gold : PALETTE.cream;
        ctx.fillRect(-sz * 0.7, -sz * 0.36, sz * 1.4, sz * 0.72);
        ctx.restore();
        drawArrowHead(ctx, cx + Math.cos(a) * (rStart + sz + 6), cy + Math.sin(a) * (rStart + sz + 6), a, 6.5, PALETTE.err);
      }
    } else {
      // 同心式：四道柔和闭合环
      for (let k = 1; k <= 4; k++) {
        const ringR = R * (0.22 * k + p * 0.08);
        if (ringR > R * 1.05) continue;
        ctx.strokeStyle = k === 1 ? PALETTE.coreBright : k % 2 === 0 ? PALETTE.gold : PALETTE.cream;
        ctx.lineWidth = k === 1 ? 3.2 : 2;
        ctx.globalAlpha = 1 - k * 0.16;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, draw);
  syncText();
  ctrl.draw();

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.polarity;
      syncText();
      ctrl.draw();
    });
  });

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      playing = !playing;
      toggleBtn.textContent = playing ? "暂停流向" : "恢复流向";
      toggleBtn.setAttribute("aria-pressed", String(!playing));
      ctrl.draw();
    });
  }
}

// =========================================================================
// 02 纹眩拆解与三层开关实验台（Wilkins 1984 纹眩效应实证）
// =========================================================================
export function mountGlareDemo() {
  const canvas = document.getElementById("glareCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const swWidth = document.getElementById("glareWidth");
  const swLen = document.getElementById("glareLength");
  const swGap = document.getElementById("glareGap");
  const tierEl = document.getElementById("glareTier");
  const noteEl = document.getElementById("glareNote");

  const state = { widthVar: false, lenVar: false, sparkGap: false };

  function syncText() {
    const count = [state.widthVar, state.lenVar, state.sparkGap].filter(Boolean).length;
    if (count === 0) {
      tierEl.textContent = "高纹眩 · 电风扇条纹（示意）";
      tierEl.dataset.tone = "err";
      noteEl.textContent = "36 根完全等宽等长的高对比硬条，把空间频率死锁在单一周期上。按 Wilkins（1984）对条纹纹眩的研究，这类周期性高频强对比最容易让视线发晃疲劳。";
    } else if (count === 1) {
      tierEl.textContent = "刚破僵局 · 仍有机械感（示意）";
      tierEl.dataset.tone = "warn";
      noteEl.textContent = "打开一层变化后，单调的周期性已经松动，但画面仍像工业刻度盘；再叠一层对比才能出现真正的爆发层次。";
    } else if (count === 2) {
      tierEl.textContent = "层次已显 · 呼吸待开（示意）";
      tierEl.dataset.tone = "warn";
      noteEl.textContent = "主次射线已经拉开，只要再把第三层打开，就能兼顾清晰焦点、视觉舒适度与 052 原海报般的爆发张力。";
    } else {
      tierEl.textContent = "张力饱满 · 三阶有机星爆（示意）";
      tierEl.dataset.tone = "ok";
      noteEl.textContent = "粗金束立势、细白针拉速、星尘点轨收尾、深蓝暗空喘气——三层齐开，视觉眩晕消失，能量感反而翻倍。";
    }
  }

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.bgDeep;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.44;

    const g = ctx.createRadialGradient(cx, cy, R * 0.06, cx, cy, R * 0.42);
    g.addColorStop(0, PALETTE.coreBright);
    g.addColorStop(0.55, "rgba(240, 198, 50, 0.48)");
    g.addColorStop(1, "rgba(19, 9, 34, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
    ctx.fill();

    const N = 36;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const isVoid = state.sparkGap && (i % 6 === 2);
      if (isVoid) continue;
      const isSpark = state.sparkGap && (i % 3 === 1);
      const isThick = state.widthVar ? i % 4 === 0 : true;

      const r0 = R * 0.27;
      const r1 = state.lenVar
        ? R * (i % 4 === 0 ? 1.04 : i % 3 === 0 ? 0.90 : i % 2 === 0 ? 0.74 : 0.62)
        : R * 0.92;

      const lw = state.widthVar ? (isThick ? 8.2 : 1.7) : 5.4;
      const col = isThick ? PALETTE.gold : PALETTE.cream;

      if (isSpark) {
        ctx.fillStyle = col;
        for (let k = 0; k < 10; k++) {
          const u = k / 9;
          const d = r0 + u * (r1 - r0);
          ctx.globalAlpha = 0.92 - u * 0.55;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }
    }

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `900 ${Math.round(clamp(R * 0.16, 13, 19))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("焦点", cx, cy);
    ctx.restore();
  }

  const bind = (el, key) => {
    if (!el) return;
    el.addEventListener("change", () => {
      state[key] = el.checked;
      syncText();
      draw();
    });
  };
  bind(swWidth, "widthVar");
  bind(swLen, "lenVar");
  bind(swGap, "sparkGap");

  syncText();
  draw();
  window.addEventListener("resize", draw);
}

// =========================================================================
// 03 偏心引爆与画框角线场（Arnheim 1982《中心的力量》实操）
// =========================================================================
export function mountOriginDemo() {
  const canvas = document.getElementById("originCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const presets = [...document.querySelectorAll("[data-origin-preset]")];
  const coordEl = document.getElementById("originCoord");
  const diagEl = document.getElementById("originLongest");
  const pocketEl = document.getElementById("originPocket");
  const verdictEl = document.getElementById("originVerdict");

  const PRESETS = {
    center:  { x: 0.50, y: 0.48, split: false, label: "正中定爆" },
    golden:  { x: 0.34, y: 0.38, split: false, label: "左上发令" },
    lowleft: { x: 0.28, y: 0.72, split: false, label: "左下破空" },
    zenith:  { x: 0.50, y: 0.26, split: false, label: "高空落光" },
    dual:    { x: 0.30, y: 0.35, split: true,  label: "双核撕裂（反例）" },
  };

  let cur = { x: 0.34, y: 0.38, split: false };

  function rayToRectDist(ox, oy, ang, w, h) {
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    let tMin = Infinity;
    if (dx > 1e-4) tMin = Math.min(tMin, (w - ox) / dx);
    if (dx < -1e-4) tMin = Math.min(tMin, (0 - ox) / dx);
    if (dy > 1e-4) tMin = Math.min(tMin, (h - oy) / dy);
    if (dy < -1e-4) tMin = Math.min(tMin, (0 - oy) / dy);
    return Math.max(0, tMin);
  }

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    // 柔和笛卡尔参考线（呼应 Arnheim：中心系统与矩形网格的对抗）
    ctx.strokeStyle = "rgba(239, 229, 205, 0.10)";
    ctx.lineWidth = 1;
    for (const f of [0.333, 0.5, 0.667]) {
      ctx.beginPath(); ctx.moveTo(w * f, 0); ctx.lineTo(w * f, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h * f); ctx.lineTo(w, h * f); ctx.stroke();
    }

    const ox = w * cur.x;
    const oy = h * cur.y;

    const drawHub = (hx, hy, isSecond) => {
      const g = ctx.createRadialGradient(hx, hy, 4, hx, hy, Math.min(w, h) * 0.24);
      g.addColorStop(0, isSecond ? PALETTE.err : PALETTE.coreBright);
      g.addColorStop(0.55, isSecond ? "rgba(255,122,112,0.35)" : "rgba(240,198,50,0.42)");
      g.addColorStop(1, "rgba(25,13,44,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, hy, Math.min(w, h) * 0.24, 0, Math.PI * 2);
      ctx.fill();

      const N = 24;
      for (let i = 0; i < N; i++) {
        if (i % 5 === 1) continue;
        const a = (i / N) * Math.PI * 2;
        const maxD = rayToRectDist(hx, hy, a, w, h);
        const r0 = Math.min(w, h) * 0.11;
        const r1 = Math.max(r0 + 8, maxD * (i % 3 === 0 ? 0.94 : 0.74));
        ctx.strokeStyle = isSecond
          ? "rgba(255, 122, 112, 0.72)"
          : i % 3 === 0 ? PALETTE.gold : PALETTE.cream;
        ctx.lineWidth = i % 3 === 0 ? 3.8 : 1.3;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0);
        ctx.lineTo(hx + Math.cos(a) * r1, hy + Math.sin(a) * r1);
        ctx.stroke();
      }

      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(hx, hy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isSecond ? PALETTE.err : PALETTE.coreBright;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawHub(ox, oy, false);
    if (cur.split) drawHub(w * 0.72, h * 0.66, true);

    // 找出四个画框角里距离源心最远的那一角（最舒展的长束能量走廊）
    const corners = [
      { name: "左上角", x: 0, y: 0 },
      { name: "右上角", x: w, y: 0 },
      { name: "左下角", x: 0, y: h },
      { name: "右下角", x: w, y: h },
    ];
    let farCorner = corners[0];
    let farDist = -1;
    for (const c of corners) {
      const d = Math.hypot(c.x - ox, c.y - oy);
      if (d > farDist) { farDist = d; farCorner = c; }
    }

    // 标示对角长尾能量方向与文案落位安全区
    if (!cur.split) {
      ctx.save();
      ctx.strokeStyle = PALETTE.ok;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(farCorner.x * 0.86 + ox * 0.14, farCorner.y * 0.86 + oy * 0.14);
      ctx.stroke();
      ctx.setLineDash([]);

      // 在最远象限展示建议副文案口袋
      const px = farCorner.x === 0 ? 18 : w - 118;
      const py = farCorner.y === 0 ? 18 : h - 48;
      ctx.fillStyle = "rgba(25, 13, 44, 0.86)";
      ctx.strokeStyle = "rgba(88, 224, 168, 0.72)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px, py, 100, 30, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.ok;
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("副文案安全口袋", px + 50, py + 15);
      ctx.restore();
    }

    ctx.restore();

    // 同步读数
    const xp = Math.round(cur.x * 100);
    const yp = Math.round(cur.y * 100);
    const marginPct = Math.round(Math.min(cur.x, 1 - cur.x, cur.y, 1 - cur.y) * 100);
    const diagShare = Math.round((farDist / Math.hypot(w, h)) * 100);
    if (coordEl) coordEl.textContent = cur.split ? "双源（30%,35% / 72%,66%）" : `X ${xp}% · Y ${yp}%`;
    if (diagEl) diagEl.textContent = cur.split ? "互撞抵消" : `指向${farCorner.name}（跨幅 ${diagShare}%）`;
    if (pocketEl) pocketEl.textContent = cur.split ? "无安全口袋" : `${farCorner.name}留气区`;
    if (verdictEl) {
      if (cur.split) {
        verdictEl.textContent = "两个放射核同时抢权，射线在画幅中央对撞，原本的副文案口袋被吞掉——这是放射式构图最忌讳的多核内耗。";
      } else if (marginPct < 16) {
        verdictEl.textContent = `核芯逼近边缘（余量仅 ${marginPct}%），半侧射线被边框直接截断，能量虽然单向猛烈，但核芯主标容易显得局促。`;
      } else if (Math.hypot(cur.x - 0.5, cur.y - 0.5) < 0.08) {
        verdictEl.textContent = "正中定爆：四周射线行程接近，仪式感与宣言感最强（与 052 原海报一致），最适合把主标直接嵌在发光核心内。";
      } else {
        verdictEl.textContent = `偏心定向：核芯挪至 (${xp}%, ${yp}%) 后，射线朝${farCorner.name}拉出最长能量尾迹，天然把画面分成「爆发源区」与「副文案落位区」。`;
      }
    }
  }

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.originPreset];
      if (!p) return;
      cur = { x: p.x, y: p.y, split: p.split };
      presets.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    cur = {
      x: clamp((e.clientX - rect.left) / rect.width, 0.12, 0.88),
      y: clamp((e.clientY - rect.top) / rect.height, 0.12, 0.88),
      split: false,
    };
    presets.forEach((b) => b.classList.remove("is-active"));
    render();
  });

  render();
  window.addEventListener("resize", render);
}

// =========================================================================
// 04 真实成品 X-Ray 透视拉帘（音乐节海报 / 科技发布 / 漫画分镜 / 信息图）
// =========================================================================
export function mountXrayDemo() {
  const canvas = document.getElementById("xrayCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const tabs = [...document.querySelectorAll("[data-xray-scene]")];
  const slider = document.getElementById("xraySlider");
  const pctEl = document.getElementById("xrayPct");
  const capEl = document.getElementById("xrayCaption");

  const SCENES = {
    festival: {
      title: "SOLAR PULSE 2026",
      sub: "独立电子音乐节 · 10.24",
      cx: 0.5, cy: 0.46,
      caption: "活动海报：大标题落进暖金核心，粗束顺着演出日期与主舞台方位拉出动势，底部保留暗空给主办信息。",
    },
    product: {
      title: "NOVA ACOUSTIC",
      sub: "声场旗舰 · 秋季发布",
      cx: 0.38, cy: 0.48,
      caption: "科技新品发布：偏心光核托起极简球体剪影，长尾光束把视线一路推向旁侧型号与核心卖点。",
    },
    manga: {
      title: "一击决胜",
      sub: "动作漫画 · 关键停格",
      cx: 0.54, cy: 0.48,
      caption: "漫画冲击分镜：四边密疏交替的集中线抹平琐碎背景，中央大片高反差留白让关键道具剪影瞬间弹眼。",
    },
    infographic: {
      title: "核心驱动",
      sub: "中心议题 → 四向议程",
      cx: 0.5, cy: 0.5,
      caption: "放射信息图：主概念居中，仅用 6 条主射线连接外围节点卡片，克制密度避免变成一团乱麻。",
    },
  };

  let sceneId = "festival";
  let split = 0.52;

  function drawSceneDesign(w, h, s) {
    const cx = w * s.cx;
    const cy = h * s.cy;
    const R = Math.min(w, h) * 0.48;

    ctx.fillStyle = sceneId === "manga" ? "#FAF6EC" : PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    if (sceneId === "festival") {
      const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, R * 0.68);
      g.addColorStop(0, PALETTE.coreBright);
      g.addColorStop(0.55, PALETTE.coreMid);
      g.addColorStop(0.76, "rgba(240,198,50,0.42)");
      g.addColorStop(1, "rgba(25,13,44,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.68, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 24; i++) {
        if (i % 5 === 2) continue;
        const a = (i / 24) * Math.PI * 2;
        ctx.strokeStyle = i % 3 === 0 ? PALETTE.gold : PALETTE.cream;
        ctx.lineWidth = i % 3 === 0 ? 5.5 : 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.44, cy + Math.sin(a) * R * 0.44);
        ctx.lineTo(cx + Math.cos(a) * R * (i % 3 === 0 ? 1.24 : 0.96), cy + Math.sin(a) * R * (i % 3 === 0 ? 1.24 : 0.96));
        ctx.stroke();
      }
      ctx.fillStyle = PALETTE.ink;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const fs = Math.round(clamp(R * 0.145, 14, 21));
      ctx.font = `800 ${fs}px "Unbounded", sans-serif`;
      ctx.fillText("SOLAR", cx, cy - fs * 0.92);
      ctx.fillText("PULSE", cx, cy + fs * 0.12);
      ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
      ctx.fillText("独立电音节 · 10.24", cx, cy + fs * 1.15);
    } else if (sceneId === "product") {
      // 舞台偏心金光柱 + 极简音箱剪影 + 右侧参数
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(240,198,50,0.52)" : "rgba(239,229,205,0.22)";
        ctx.lineWidth = i % 3 === 0 ? 6 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.25, cy + Math.sin(a) * R * 0.25);
        ctx.lineTo(cx + Math.cos(a) * R * 1.45, cy + Math.sin(a) * R * 1.45);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, R * 0.4);
      g.addColorStop(0, PALETTE.coreBright);
      g.addColorStop(1, "rgba(25,13,44,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.21, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = PALETTE.gold; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.13, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = PALETTE.cream;
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.round(clamp(w * 0.038, 14, 21))}px "Unbounded", sans-serif`;
      ctx.fillText(s.title, w * 0.62, cy - 14);
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `500 12px "Noto Sans SC", sans-serif`;
      ctx.fillText(s.sub, w * 0.62, cy + 12);
    } else if (sceneId === "manga") {
      // 经典黑白集中线（无五官：纯菱形能量冲击图标 + 漫画喊字）
      const N = 44;
      for (let i = 0; i < N; i++) {
        if (i % 7 === 0) continue;
        const a = (i / N) * Math.PI * 2;
        const r0 = R * (0.38 + (i % 3) * 0.08);
        const r1 = Math.hypot(w, h) * 0.85;
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = i % 4 === 0 ? 3.2 : 1.1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.fillStyle = "#FAF6EC";
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `900 ${Math.round(clamp(w * 0.056, 18, 28))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(s.title, cx, cy - 6);
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillText(s.sub, cx, cy + 20);
    } else {
      // 放射信息图：中心核 + 6 条主连线 + 6 个简洁卡片节点
      const labels = ["洞察", "定位", "动势", "节奏", "对比", "留白"];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const nx = cx + Math.cos(a) * R * 0.78;
        const ny = cy + Math.sin(a) * R * 0.72;
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();

        ctx.fillStyle = PALETTE.bgCard;
        ctx.strokeStyle = PALETTE.goldLine;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(nx - 28, ny - 14, 56, 28, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = PALETTE.cream;
        ctx.font = `500 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(labels[i], nx, ny + 0.5);
      }
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 14px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(s.title, cx, cy);
    }
  }

  function drawXrayOverlay(w, h, s) {
    const cx = w * s.cx;
    const cy = h * s.cy;
    const R = Math.min(w, h) * 0.48;

    ctx.fillStyle = "rgba(14, 7, 27, 0.88)";
    ctx.fillRect(0, 0, w, h);

    // 放射骨架矢量线 + 呼吸扇区标注
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const isPrimary = i % 4 === 0;
      ctx.strokeStyle = isPrimary ? PALETTE.coreBright : "rgba(88, 224, 168, 0.42)";
      ctx.lineWidth = isPrimary ? 2.2 : 1;
      ctx.setLineDash(isPrimary ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * Math.hypot(w, h), cy + Math.sin(a) * Math.hypot(w, h));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 核心安全区圆与外扩散环
    ctx.strokeStyle = PALETTE.ok;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = "rgba(240, 198, 50, 0.55)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = PALETTE.coreBright;
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = PALETTE.ok;
    ctx.font = `500 11.5px "DM Mono", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "right"; ctx.textBaseline = "top";
    ctx.fillText("X-RAY · 单源骨架与核安全圈", w - 14, 12);
  }

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    const s = SCENES[sceneId];
    const cutX = w * split;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 底层成品
    drawSceneDesign(w, h, s);

    // 右侧拉帘区叠画 X-Ray 透视骨架
    ctx.save();
    ctx.beginPath();
    ctx.rect(cutX, 0, w - cutX, h);
    ctx.clip();
    drawXrayOverlay(w, h, s);
    ctx.restore();

    // 金色透视分割线 + 纯矢量双向三角手柄（不依赖缺字字符）
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cutX, 0); ctx.lineTo(cutX, h); ctx.stroke();
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath(); ctx.arc(cutX, h * 0.5, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(cutX - 6, h * 0.5);
    ctx.lineTo(cutX - 2, h * 0.5 - 3.5);
    ctx.lineTo(cutX - 2, h * 0.5 + 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cutX + 6, h * 0.5);
    ctx.lineTo(cutX + 2, h * 0.5 - 3.5);
    ctx.lineTo(cutX + 2, h * 0.5 + 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    if (pctEl) pctEl.textContent = `${Math.round((1 - split) * 100)}% 透视`;
    if (capEl) capEl.textContent = s.caption;
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      sceneId = btn.dataset.xrayScene;
      tabs.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });

  if (slider) {
    slider.addEventListener("input", () => {
      split = 1 - Number(slider.value) / 100;
      render();
    });
  }

  render();
  window.addEventListener("resize", render);
}

// =========================================================================
// 06 什么时候别用：四张反例翻改卡（点击切换「失效放射」↔「克制替代」）
// =========================================================================
export function mountAvoidDemo() {
  const cards = [...document.querySelectorAll("[data-avoid-card]")];
  if (!cards.length) return;

  function drawCard(canvas, kind, fixed) {
    const { w, h, dpr } = fitCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!fixed) {
      // 失效放射态
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.55;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.strokeStyle = kind === "sticker" ? PALETTE.gold : "rgba(240, 198, 50, 0.45)";
        ctx.lineWidth = kind === "sticker" ? 5 : 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R * 1.4, cy + Math.sin(a) * R * 1.4);
        ctx.stroke();
      }
      if (kind === "longtext") {
        // 射线切割横排正文
        ctx.fillStyle = "rgba(25, 13, 44, 0.45)";
        ctx.fillRect(16, 18, w - 32, h - 36);
        for (let y = 30; y < h - 24; y += 14) {
          ctx.fillStyle = PALETTE.cream;
          ctx.fillRect(24, y, w - 48 - (y % 28), 4.5);
        }
      } else if (kind === "compare") {
        // 三个并列卡片被中心放射撕扯
        for (let k = 0; k < 3; k++) {
          const x = 14 + k * ((w - 36) / 3 + 4);
          ctx.fillStyle = "rgba(34, 20, 59, 0.85)";
          ctx.strokeStyle = PALETTE.err;
          ctx.lineWidth = 1.4;
          ctx.fillRect(x, h * 0.24, (w - 36) / 3, h * 0.52);
          ctx.strokeRect(x, h * 0.24, (w - 36) / 3, h * 0.52);
        }
      } else if (kind === "calm") {
        // 金融/医疗数字框下强射线闪烁
        ctx.fillStyle = "rgba(25, 13, 44, 0.72)";
        ctx.fillRect(20, 22, w - 40, h - 44);
        ctx.fillStyle = PALETTE.err;
        ctx.font = `700 16px "DM Mono", sans-serif`;
        ctx.fillText("98.6 BPM · 视觉干扰", 30, h * 0.54);
      } else {
        // 廉价等宽促销贴纸
        ctx.fillStyle = PALETTE.err;
        ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `900 13px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("5折!", cx, cy);
      }
    } else {
      // 克制替代方案
      ctx.fillStyle = "#F8F4EA";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(25, 13, 44, 0.14)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

      if (kind === "longtext") {
        ctx.fillStyle = PALETTE.ink;
        ctx.fillRect(22, 22, w * 0.42, 7);
        ctx.fillStyle = "#473D5C";
        for (let y = 40; y < h - 22; y += 13) {
          ctx.fillRect(22, y, w - 44 - (y % 26), 4);
        }
      } else if (kind === "compare") {
        for (let k = 0; k < 3; k++) {
          const cw = (w - 40) / 3;
          const x = 14 + k * (cw + 6);
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = "rgba(25, 13, 44, 0.22)";
          ctx.fillRect(x, 20, cw, h - 40);
          ctx.strokeRect(x, 20, cw, h - 40);
          ctx.fillStyle = k === 1 ? "#7A5600" : PALETTE.ink;
          ctx.fillRect(x + 8, 30, cw - 16, 6);
          ctx.fillStyle = "#8C82A0";
          ctx.fillRect(x + 8, 46, cw - 20, 4);
          ctx.fillRect(x + 8, 56, cw - 16, 4);
        }
      } else if (kind === "calm") {
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "rgba(20, 107, 72, 0.35)";
        ctx.fillRect(20, 20, w - 40, h - 40);
        ctx.strokeRect(20, 20, w - 40, h - 40);
        ctx.fillStyle = PALETTE.okPaper;
        ctx.font = `700 17px "DM Mono", sans-serif`;
        ctx.fillText("98.6 BPM", 32, h * 0.48);
        ctx.fillStyle = PALETTE.inkSub;
        ctx.font = `400 11px "Noto Sans SC", sans-serif`;
        ctx.fillText("零底纹干扰 · 适合长期注视", 32, h * 0.68);
      } else {
        // 克制有呼吸的现代星爆
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, w, h);
        const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.46;
        for (let i = 0; i < 16; i++) {
          if (i % 4 === 1) continue;
          const a = (i / 16) * Math.PI * 2;
          ctx.strokeStyle = i % 3 === 0 ? PALETTE.gold : PALETTE.cream;
          ctx.lineWidth = i % 3 === 0 ? 4 : 1.1;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * R * 0.38, cy + Math.sin(a) * R * 0.38);
          ctx.lineTo(cx + Math.cos(a) * R * (i % 3 === 0 ? 1.12 : 0.85), cy + Math.sin(a) * R * (i % 3 === 0 ? 1.12 : 0.85));
          ctx.stroke();
        }
        ctx.fillStyle = PALETTE.coreBright;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `900 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("焦点", cx, cy);
      }
    }
    ctx.restore();
  }

  cards.forEach((card) => {
    const kind = card.dataset.avoidCard;
    const canvas = card.querySelector("canvas");
    const btn = card.querySelector("[data-avoid-toggle]");
    const badge = card.querySelector("[data-avoid-badge]");
    let fixed = false;

    const refresh = () => {
      drawCard(canvas, kind, fixed);
      card.classList.toggle("is-fixed", fixed);
      if (btn) btn.textContent = fixed ? "切回失效放射" : "切为克制方案";
      if (badge) badge.textContent = fixed ? "克制替代" : "容易翻车";
    };
    if (btn) {
      btn.addEventListener("click", () => {
        fixed = !fixed;
        refresh();
      });
    }
    refresh();
    window.addEventListener("resize", refresh);
  });
}

// =========================================================================
// 07 挑一挑：单一变量视觉判断小练习（A/B/C/D 全中性标签）
// =========================================================================
export function mountQuizDemo() {
  const options = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("quizFeedback");
  const resetBtn = document.getElementById("quizResetBtn");
  if (!options.length) return;

  const SPECS = {
    A: {
      ok: false,
      uniform: true, coreR: 0.28,
      explain: "方案 A 看起来最「整齐」，但 32 根等宽等长硬条把空间频率锁成单一周期，产生明显电风扇式的纹眩感，缺乏 052 海报的粗细长短层次与暗空呼吸。",
    },
    B: {
      ok: false,
      uniform: false, coreR: 0.06,
      explain: "方案 B 的三阶射线层次做对了，但核心留白压缩到 6%，尖锐的高亮金束直接刺穿「星穹 01」笔画，牺牲了第一眼的可读性。",
    },
    C: {
      ok: true,
      uniform: false, coreR: 0.34,
      explain: "选对了！方案 C 同时满足放射式构图最关键的两道门槛：约 34% 的点阵流光核心稳稳托住主标不刺字，外圈用粗金束、细白针、星尘点轨与暗空呼吸隙拉开节奏，既有爆发力又耐看。",
    },
    D: {
      ok: false,
      uniform: false, coreR: 0.58,
      explain: "方案 D 画面虽然干净，但核心黄盘膨胀到 58%，把外圈射线挤成一圈短毛刺，向四周扩散的能量感大幅流失，已经退化成静态圆形构图（047）。",
    },
  };

  function drawOption(canvas, spec) {
    const { w, h, dpr } = fitCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.46;

    // 核心点阵流光
    const haloR = Math.max(R * 0.32, R * spec.coreR * 1.56);
    const g = ctx.createRadialGradient(cx, cy, R * 0.05, cx, cy, haloR);
    g.addColorStop(0, PALETTE.coreBright);
    g.addColorStop(0.56, PALETTE.coreMid);
    g.addColorStop(0.80, "rgba(240, 198, 50, 0.28)");
    g.addColorStop(1, "rgba(25, 13, 44, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
    ctx.fill();

    const drawRays = (overText) => {
      const N = 32;
      for (let i = 0; i < N; i++) {
        if (!spec.uniform && i % 6 === 2) continue; // 暗空呼吸隙
        const isPierce = spec.coreR < 0.14;
        if (overText && !isPierce) continue;
        if (!overText && isPierce) continue;

        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const r0 = R * spec.coreR;
        const r1 = spec.uniform
          ? R * 0.94
          : R * (i % 4 === 0 ? 1.05 : i % 3 === 0 ? 0.90 : 0.78);
        const isSpark = !spec.uniform && i % 4 === 3;
        const col = spec.uniform ? PALETTE.gold : (i % 3 === 0 ? PALETTE.cream : PALETTE.gold);

        if (isSpark) {
          ctx.fillStyle = col;
          for (let k = 0; k < 7; k++) {
            const u = k / 6;
            const d = r0 + u * Math.max(8, r1 - r0);
            ctx.globalAlpha = 0.9 - u * 0.45;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = col;
          ctx.lineWidth = spec.uniform ? 3.8 : (i % 4 === 0 ? 5.2 : 1.3);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a) * Math.max(r0 + 6, r1), cy + Math.sin(a) * Math.max(r0 + 6, r1));
          ctx.stroke();
        }
      }
    };

    drawRays(false);

    // 同一组新品文案，完全一致
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.round(clamp(R * 0.20, 13, 18))}px "Noto Sans SC", sans-serif`;
    ctx.fillText("星穹 01", cx, cy - 6);
    ctx.font = `700 ${Math.round(clamp(R * 0.085, 8.5, 10))}px "Unbounded", sans-serif`;
    ctx.fillText("NOVA LAUNCH", cx, cy + 12);

    ctx.save();
    ctx.globalAlpha = 0.78;
    drawRays(true);
    ctx.restore();
    ctx.restore();
  }

  function redrawAll() {
    options.forEach((btn) => {
      const c = btn.querySelector("canvas");
      if (c) drawOption(c, SPECS[btn.dataset.quizOpt]);
    });
  }

  options.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.quizOpt;
      const info = SPECS[pick];
      options.forEach((b) => {
        const key = b.dataset.quizOpt;
        b.classList.remove("is-picked", "is-correct", "is-wrong");
        b.setAttribute("aria-pressed", String(b === btn));
        if (b === btn) b.classList.add("is-picked", info.ok ? "is-correct" : "is-wrong");
        else if (SPECS[key].ok) b.classList.add("is-correct");
      });
      if (feedback) {
        feedback.hidden = false;
        feedback.dataset.tone = info.ok ? "ok" : "err";
        feedback.innerHTML = `<strong>${info.ok ? "判断正确 · 方案 C" : `你选了方案 ${pick} · 正解是方案 C`}</strong><p>${info.explain}</p>`;
      }
      if (resetBtn) resetBtn.hidden = false;
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      options.forEach((b) => {
        b.classList.remove("is-picked", "is-correct", "is-wrong");
        b.setAttribute("aria-pressed", "false");
      });
      if (feedback) feedback.hidden = true;
      resetBtn.hidden = true;
    });
  }

  redrawAll();
  window.addEventListener("resize", redrawAll);
}
