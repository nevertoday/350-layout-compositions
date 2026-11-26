// 053 向心式构图 · 正文 7 节独立交互组件（sections.js）
// 相邻两节绝不重复同一种控件：
//   01 矢量流场点投粒子台 · 02 四通道叠加混音开关台 · 03 三场景 X-Ray 对比拉帘
//   04 四纪元历史透视蓝图 · 05 四张反例翻改卡 · 06 单一变量四选一实绘考场 · 07 原海报灯箱拖拽缩放

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, clamp } from "./model.js";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return null;
  const dpr = pixelRatio(2);
  const nw = Math.round(rect.width * dpr);
  const nh = Math.round(rect.height * dpr);
  if (canvas.width !== nw || canvas.height !== nh) {
    canvas.width = nw;
    canvas.height = nh;
  }
  return { w: rect.width, h: rect.height, dpr };
}

/* ==========================================================================
   01 节：四态矢量流场点投粒子台（对比 053 向心 / 052 放射 / 054 离心 / 055 同心）
   ========================================================================== */
export function mountSection01() {
  const canvas = document.getElementById("s01-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const modeBtns = [...document.querySelectorAll("[data-s01-mode]")];
  const dropBtn = document.getElementById("s01-drop");
  const readoutTitle = document.getElementById("s01-readout-title");
  const readoutBody = document.getElementById("s01-readout-body");

  const MODES = {
    centripetal: {
      title: "053 向心式 · 外围势能同步向内收束",
      body: "粒子从画幅任意角落出发都会沿着径向滑入中央静谧圈并稳稳停驻；顺应人眼的中心注视偏向，把分散注意压成唯一主角。",
      color: PALETTE.teal,
    },
    radiating: {
      title: "052 放射式 · 单源核心向四周连续扩散",
      body: "能量由内向外释放，强调张力、光束与向外蔓延的爆发感；与向心式同源但流向相反，重在「散势」而非「聚势」。",
      color: PALETTE.orange,
    },
    centrifugal: {
      title: "054 离心式 · 迫力把元素推离中心甩向四边",
      body: "中央被主动腾空或炸开，外围元素被甩向画框边沿，带来挣脱、冲破与边缘张力；如果向心版面出现反向箭头就会滑入此态。",
      color: "#B8291E",
    },
    concentric: {
      title: "055 同心式 · 层层环绕，视线沿圆周稳态巡航",
      body: "矢量沿切线做等距环绕而非径向直冲，形成安静的波纹与层级递进，没有锐利的箭尖突刺感。",
      color: "#2C4954",
    },
  };

  let mode = "centripetal";
  let particles = [];
  let running = !reducedMotion.matches;

  function seedRing(count = 20) {
    particles = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = mode === "radiating" ? 0.08 + (i % 3) * 0.04 : mode === "concentric" ? 0.19 + (i % 4) * 0.075 : 0.43 - (i % 3) * 0.04;
      particles.push({
        x: 0.5 + Math.cos(a) * r,
        y: 0.5 + Math.sin(a) * r,
        life: 1,
        custom: false,
      });
    }
  }

  function updateCopy() {
    const m = MODES[mode];
    if (readoutTitle) readoutTitle.textContent = m.title;
    if (readoutBody) readoutBody.textContent = m.body;
    modeBtns.forEach((b) => {
      const active = b.dataset.s01Mode === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.s01Mode;
      seedRing(22);
      updateCopy();
      ctrl.draw();
    });
  });

  if (dropBtn) {
    dropBtn.addEventListener("click", () => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.35;
        particles.push({
          x: 0.5 + Math.cos(a) * 0.42,
          y: 0.5 + Math.sin(a) * 0.42,
          life: 1,
          custom: true,
        });
      }
      if (particles.length > 56) particles = particles.slice(-56);
      ctrl.draw();
    });
  }

  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = clamp((e.clientX - r.left) / r.width, 0.04, 0.96);
    const ny = clamp((e.clientY - r.top) / r.height, 0.04, 0.96);
    for (let k = 0; k < 5; k++) {
      const jitterA = (k / 5) * Math.PI * 2;
      particles.push({
        x: clamp(nx + Math.cos(jitterA) * 0.025, 0.03, 0.97),
        y: clamp(ny + Math.sin(jitterA) * 0.025, 0.03, 0.97),
        life: 1,
        custom: true,
      });
    }
    if (particles.length > 56) particles = particles.slice(-56);
    ctrl.draw();
  });

  seedRing(22);
  updateCopy();

  function fieldVec(nx, ny) {
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    const d = Math.hypot(dx, dy) || 0.001;
    const ux = dx / d;
    const uy = dy / d;
    if (mode === "centripetal") return { vx: -ux * 0.24, vy: -uy * 0.24, d };
    if (mode === "radiating") return { vx: ux * 0.24, vy: uy * 0.24, d };
    if (mode === "centrifugal") {
      const boost = 0.16 + d * 0.52;
      return { vx: ux * boost, vy: uy * boost, d };
    }
    // concentric: tangent orbit
    return { vx: -uy * 0.22, vy: ux * 0.22, d };
  }

  const ctrl = loop(canvas, (_t, dt, { still }) => {
    const size = fitCanvas(canvas);
    if (!size) return;
    const { w, h, dpr } = size;
    const minDim = Math.min(w, h);
    const cx = w * 0.5;
    const cy = h * 0.5;
    const mInfo = MODES[mode];

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 底层矢量场箭头网格（9×5，清晰呈现四种结构的几何差异）
    const cols = w < 440 ? 7 : 11;
    const rows = 5;
    ctx.strokeStyle = "rgba(16,32,38,0.22)";
    ctx.fillStyle = "rgba(16,32,38,0.28)";
    ctx.lineWidth = 1.1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = (c + 0.5) / cols;
        const ny = (r + 0.5) / rows;
        const px = nx * w;
        const py = ny * h;
        const { vx, vy, d } = fieldVec(nx, ny);
        if (d < 0.09) continue;
        const mag = Math.hypot(vx, vy) || 1;
        const ax = (vx / mag) * 14;
        const ay = (vy / mag) * 14;
        ctx.beginPath();
        ctx.moveTo(px - ax * 0.5, py - ay * 0.5);
        ctx.lineTo(px + ax * 0.5, py + ay * 0.5);
        ctx.stroke();
        // 小箭头
        const tx = px + ax * 0.5;
        const ty = py + ay * 0.5;
        const ux = vx / mag;
        const uy = vy / mag;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - ux * 5 - uy * 3, ty - uy * 5 + ux * 3);
        ctx.lineTo(tx - ux * 5 + uy * 3, ty - uy * 5 - ux * 3);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 中央静谧核 / 源核圆环
    ctx.beginPath();
    ctx.arc(cx, cy, minDim * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = mode === "centrifugal" ? "rgba(184,41,30,0.06)" : "rgba(246,243,238,0.92)";
    ctx.fill();
    ctx.strokeStyle = mInfo.color;
    ctx.lineWidth = 1.6;
    ctx.setLineDash(mode === "concentric" ? [] : [4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (mode === "concentric") {
      for (const mult of [0.26, 0.36]) {
        ctx.beginPath();
        ctx.arc(cx, cy, minDim * mult, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(44,73,84,0.28)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${w < 440 ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      mode === "centripetal" ? "静谧焦核" : mode === "radiating" ? "爆发源心" : mode === "centrifugal" ? "中空退离" : "同心圆心",
      cx,
      cy
    );

    // 更新并绘制粒子
    const step = still || !running ? 0 : Math.min(dt, 0.05);
    for (const p of particles) {
      const { vx, vy, d } = fieldVec(p.x, p.y);
      if (step > 0) {
        p.x += vx * step;
        p.y += vy * step;
        // 边界循环
        if (mode === "centripetal" && d < 0.095) {
          const a = Math.atan2(p.y - 0.5, p.x - 0.5) + 0.45;
          p.x = 0.5 + Math.cos(a) * 0.45;
          p.y = 0.5 + Math.sin(a) * 0.45;
        } else if ((mode === "radiating" || mode === "centrifugal") && (p.x < 0.02 || p.x > 0.98 || p.y < 0.02 || p.y > 0.98)) {
          const a = Math.atan2(p.y - 0.5, p.x - 0.5) + 0.3;
          p.x = 0.5 + Math.cos(a) * 0.09;
          p.y = 0.5 + Math.sin(a) * 0.09;
        }
      }
      const px = p.x * w;
      const py = p.y * h;
      ctx.beginPath();
      ctx.arc(px, py, p.custom ? 4.8 : 3.6, 0, Math.PI * 2);
      ctx.fillStyle = p.custom ? PALETTE.orange : mInfo.color;
      ctx.fill();
    }

    // 底部操作提示
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("点击画布任意位置投放视线粒子", 12, h - 10);

    ctx.restore();
  });
  ctrl.draw();
}

/* ==========================================================================
   02 节：四种非字面箭头向心手法 · 四通道叠层混音台
   ========================================================================== */
export function mountSection02() {
  const canvas = document.getElementById("s02-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const checks = [...document.querySelectorAll("[data-s02-ch]")];
  const readout = document.getElementById("s02-readout");
  const countBadge = document.getElementById("s02-count");

  const channels = {
    perspective: true,
    wedges: true,
    silhouettes: false,
    vignette: false,
  };

  function render() {
    const size = fitCanvas(canvas);
    if (!size) return;
    const { w, h, dpr } = size;
    const cx = w * 0.5;
    const cy = h * 0.49;
    const minDim = Math.min(w, h);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 基础亮矿石纸
    ctx.fillStyle = "#EFECE6";
    ctx.fillRect(0, 0, w, h);

    // 通道 4：明暗暗角漏斗（先画底，让四周压暗、中心透亮）
    if (channels.vignette) {
      const vg = ctx.createRadialGradient(cx, cy, minDim * 0.14, cx, cy, Math.hypot(w, h) * 0.56);
      vg.addColorStop(0, "rgba(255,253,249,0.75)");
      vg.addColorStop(0.55, "rgba(19,58,64,0.16)");
      vg.addColorStop(1, "rgba(16,32,38,0.72)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }

    // 通道 1：建筑一点透视走廊线
    if (channels.perspective) {
      ctx.save();
      ctx.strokeStyle = channels.vignette ? "rgba(246,243,238,0.45)" : "rgba(19,131,133,0.48)";
      ctx.lineWidth = 1.2;
      const edges = [
        [0, 0], [w * 0.25, 0], [w * 0.75, 0], [w, 0],
        [0, h * 0.32], [w, h * 0.32], [0, h * 0.68], [w, h * 0.68],
        [0, h], [w * 0.25, h], [w * 0.75, h], [w, h],
      ];
      for (const [ex, ey] of edges) {
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        const dx = cx - ex;
        const dy = cy - ey;
        const d = Math.hypot(dx, dy) || 1;
        const stop = Math.max(0, d - minDim * 0.21);
        ctx.lineTo(ex + (dx / d) * stop, ey + (dy / d) * stop);
        ctx.stroke();
      }
      // 透视递进矩形框
      for (const k of [0.84, 0.64, 0.46]) {
        ctx.strokeStyle = channels.vignette ? "rgba(246,243,238,0.22)" : "rgba(16,32,38,0.16)";
        ctx.strokeRect(cx - (w * k) / 2, cy - (h * k) / 2, w * k, h * k);
      }
      ctx.restore();
    }

    // 通道 2：形体收锋楔形（不画箭头，只用外宽内窄的色块收锋）
    if (channels.wedges) {
      const specs = [
        { a: -135, c: "rgba(19,131,133,0.78)" },
        { a: -42,  c: "rgba(47,53,56,0.72)" },
        { a: 38,   c: "rgba(19,131,133,0.78)" },
        { a: 145,  c: "rgba(232,93,38,0.82)" },
      ];
      for (const s of specs) {
        const rad = (s.a * Math.PI) / 180;
        const ux = Math.cos(rad);
        const uy = Math.sin(rad);
        const nx = -uy;
        const ny = ux;
        const outerR = Math.hypot(w, h) * 0.56;
        const innerR = minDim * 0.24;
        const ox = cx + ux * outerR;
        const oy = cy + uy * outerR;
        const ix = cx + ux * innerR;
        const iy = cy + uy * innerR;
        const half = minDim * 0.11;
        ctx.beginPath();
        ctx.moveTo(ox + nx * half, oy + ny * half);
        ctx.lineTo(ix, iy);
        ctx.lineTo(ox - nx * half, oy - ny * half);
        ctx.closePath();
        ctx.fillStyle = s.c;
        ctx.fill();
      }
    }

    // 通道 3：外围观者背影剪影转向（严守规范：纯背影无五官！）
    if (channels.silhouettes) {
      const viewers = [
        { x: w * 0.16, y: h * 0.84, s: 1.0, tilt: 0.24 },
        { x: w * 0.30, y: h * 0.91, s: 0.92, tilt: 0.12 },
        { x: w * 0.70, y: h * 0.91, s: 0.92, tilt: -0.12 },
        { x: w * 0.84, y: h * 0.84, s: 1.0, tilt: -0.24 },
      ];
      for (const v of viewers) {
        ctx.save();
        ctx.translate(v.x, v.y);
        ctx.rotate(v.tilt);
        ctx.fillStyle = "#162228";
        // 纯头肩背影轮廓（零五官细节）
        ctx.beginPath();
        ctx.arc(0, -34 * v.s, 13 * v.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 6 * v.s, 26 * v.s, 28 * v.s, 0, Math.PI, Math.PI * 2);
        ctx.lineTo(26 * v.s, 36 * v.s);
        ctx.lineTo(-26 * v.s, 36 * v.s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 细虚视线指向中央主体
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(v.x, v.y - 38 * v.s);
        ctx.lineTo(cx + (v.x - cx) * 0.28, cy + (v.y - cy) * 0.28);
        ctx.strokeStyle = "rgba(232,93,38,0.55)";
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 中央展台与主角圆柱体（静谧核）
    ctx.beginPath();
    ctx.arc(cx, cy, minDim * 0.20, 0, Math.PI * 2);
    ctx.fillStyle = "#F6F3EE";
    ctx.fill();
    ctx.strokeStyle = PALETTE.teal;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 展台陶瓷器皿几何剪影
    ctx.fillStyle = "#102026";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, minDim * 0.075, minDim * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.roundRect(cx - minDim * 0.045, cy - minDim * 0.085, minDim * 0.09, minDim * 0.13, 14);
    ctx.fill();
    ctx.fillStyle = "#F6F3EE";
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("HERO", cx, cy - minDim * 0.02);

    ctx.restore();

    // 更新白话读数
    const onList = Object.entries(channels)
      .filter(([, v]) => v)
      .map(([k]) => ({ perspective: "透视走廊", wedges: "收锋形体", silhouettes: "观者视线", vignette: "明暗暗角" }[k]));
    if (countBadge) countBadge.textContent = `已开 ${onList.length}/4 通道`;
    if (readout) {
      if (onList.length === 0) {
        readout.textContent = "四个通道全关：主角孤零零漂在平白纸面中央，只剩微弱的几何居中感，缺少外围把目光往里送的推力。";
      } else if (onList.length === 1) {
        readout.textContent = `仅开「${onList[0]}」：不需要一根字面箭头，视线已经开始被悄悄引向中央；试着再叠一个通道感受复合引力。`;
      } else if (onList.length === 4) {
        readout.textContent = "四通道全开：透视、收锋、观者视线与暗角叠加产生极强向心漏斗——实战中通常选 2–3 个通道组合，就能稳而不腻。";
      } else {
        readout.textContent = `当前组合（${onList.join(" + ")}）：结构与明暗彼此呼应，目光一进画框就顺势滑向中央展品，克制而有力度。`;
      }
    }
  }

  checks.forEach((btn) => {
    const key = btn.dataset.s02Ch;
    btn.classList.toggle("is-active", channels[key]);
    btn.setAttribute("aria-pressed", String(channels[key]));
    btn.addEventListener("click", () => {
      channels[key] = !channels[key];
      btn.classList.toggle("is-active", channels[key]);
      btn.setAttribute("aria-pressed", String(channels[key]));
      render();
    });
  });

  const ro = new ResizeObserver(render);
  ro.observe(canvas);
  render();
}

/* ==========================================================================
   03 节：三场景 X-Ray 对比拉帘（散乱初稿 vs 向心终稿 + 隐藏骨架开关）
   ========================================================================== */
export function mountSection03() {
  const canvas = document.getElementById("s03-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const range = document.getElementById("s03-split");
  const xrayBtn = document.getElementById("s03-xray");
  const sceneBtns = [...document.querySelectorAll("[data-s03-scene]")];
  const noteEl = document.getElementById("s03-note");

  let split = 0.36;
  let xray = true;
  let scene = "product";

  const NOTES = {
    product: "左半散稿：耳机缩在角落、卖点标签满屏飞，视线无处停脚；右半向心稿：声波弧与斜光束收束到静谧圆核，产品自然成唯一主角。",
    keynote: "左半散稿：页眉页脚与四块装饰条抢走注意，核心金句淹没在杂项里；右半向心稿：清空四角，用克制折线将目光聚回唯一主张。",
    photo: "左半散稿：平拍直框毫无纵深，走廊杂物分散视线；右半向心稿：借拱廊一点透视与暗角压边，把远端孤影锁在画面中心。",
  };

  function drawSceneHalf(w, h, good) {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const minDim = Math.min(w, h);

    if (scene === "product") {
      // 产品展示 · 声学耳机
      ctx.fillStyle = good ? "#162A32" : "#222E33";
      ctx.fillRect(0, 0, w, h);
      if (good) {
        // 向心光束斜楔
        const grad = ctx.createRadialGradient(cx, cy, minDim * 0.08, cx, cy, minDim * 0.65);
        grad.addColorStop(0, "rgba(72,214,212,0.28)");
        grad.addColorStop(1, "rgba(10,20,24,0.1)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        for (const a of [-142, -38, 38, 142]) {
          const r = (a * Math.PI) / 180;
          const ux = Math.cos(r), uy = Math.sin(r), nx = -uy, ny = ux;
          ctx.beginPath();
          ctx.moveTo(cx + ux * w * 0.72 + nx * 42, cy + uy * w * 0.72 + ny * 42);
          ctx.lineTo(cx + ux * minDim * 0.26, cy + uy * minDim * 0.26);
          ctx.lineTo(cx + ux * w * 0.72 - nx * 42, cy + uy * w * 0.72 - ny * 42);
          ctx.closePath();
          ctx.fillStyle = Math.abs(a) > 90 ? "rgba(72,214,212,0.22)" : "rgba(255,138,92,0.24)";
          ctx.fill();
        }
        // 中央极简耳机几何轮廓
        ctx.strokeStyle = "#F0ECE6";
        ctx.lineWidth = Math.max(5, minDim * 0.022);
        ctx.beginPath();
        ctx.arc(cx, cy - 4, minDim * 0.145, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = "#FF8A5C";
        ctx.beginPath();
        ctx.roundRect(cx - minDim * 0.175, cy - 8, minDim * 0.055, minDim * 0.115, 8);
        ctx.roundRect(cx + minDim * 0.12, cy - 8, minDim * 0.055, minDim * 0.115, 8);
        ctx.fill();
        ctx.fillStyle = "#F0ECE6";
        ctx.font = `700 ${w < 440 ? 12 : 14}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("声场只听中心", cx, cy + minDim * 0.22);
      } else {
        // 散乱初稿：卖点贴片到处飞、耳机挤偏
        for (const [bx, by, txt] of [
          [w * 0.14, h * 0.18, "降噪 -48dB"],
          [w * 0.82, h * 0.20, "限时立减"],
          [w * 0.18, h * 0.82, "蓝牙 5.4"],
          [w * 0.80, h * 0.78, "扫码预约"],
        ]) {
          ctx.fillStyle = "rgba(255,138,92,0.85)";
          ctx.fillRect(bx - 38, by - 12, 76, 24);
          ctx.fillStyle = "#102026";
          ctx.font = `700 10px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(txt, bx, by);
        }
        // 刺入文字的杂线
        ctx.strokeStyle = "rgba(255,123,112,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        ctx.lineTo(w, h * 0.44);
        ctx.moveTo(w * 0.3, 0);
        ctx.lineTo(w * 0.55, h);
        ctx.stroke();

        ctx.strokeStyle = "#B8C7CC";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx - 24, cy + 4, minDim * 0.10, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = "#F0ECE6";
        ctx.font = `600 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("声场只听中心", cx + 22, cy + 12);
      }
    } else if (scene === "keynote") {
      ctx.fillStyle = good ? "#EDE9E4" : "#E1DDD6";
      ctx.fillRect(0, 0, w, h);
      if (good) {
        for (const a of [-135, -45, 45, 135]) {
          const r = (a * Math.PI) / 180;
          ctx.strokeStyle = a === 135 || a === -45 ? PALETTE.orange : PALETTE.teal;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(r) * w * 0.55, cy + Math.sin(r) * h * 0.55);
          ctx.lineTo(cx + Math.cos(r) * minDim * 0.28, cy + Math.sin(r) * minDim * 0.28);
          ctx.stroke();
        }
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `900 ${w < 440 ? 18 : 24}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("做减法，才能聚力", cx, cy - 6);
        ctx.fillStyle = PALETTE.tealDeep;
        ctx.font = `600 11px "IBM Plex Sans", sans-serif`;
        ctx.fillText("ANNUAL KEYNOTE · 2026", cx, cy + 20);
      } else {
        ctx.fillStyle = "#1C2A30";
        ctx.fillRect(0, 0, w, 30);
        ctx.fillRect(0, h - 26, w, 26);
        ctx.fillStyle = "#E85D26";
        ctx.fillRect(16, 44, 78, 22);
        ctx.fillRect(w - 94, 44, 78, 22);
        ctx.fillStyle = "#49585F";
        ctx.font = `600 13px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("关于年度产品路线与增效汇报（草案）", cx, cy - 12);
        ctx.fillText("2026 Q4 · 内部评审版 · 请勿外传", cx, cy + 16);
      }
    } else {
      // 摄影后期 · 拱廊人影（纯剪影背影，零五官）
      ctx.fillStyle = good ? "#122128" : "#3A464C";
      ctx.fillRect(0, 0, w, h);
      if (good) {
        const g = ctx.createRadialGradient(cx, cy + 4, 8, cx, cy, minDim * 0.65);
        g.addColorStop(0, "#F4E5D2");
        g.addColorStop(0.26, "#4A8F92");
        g.addColorStop(0.7, "#162A32");
        g.addColorStop(1, "#0B1519");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // 递进拱门
        for (const k of [0.86, 0.62, 0.42, 0.25]) {
          ctx.strokeStyle = `rgba(246,243,238,${(0.18 + (1 - k) * 0.45).toFixed(2)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, minDim * 0.55 * k, Math.PI, 0);
          ctx.lineTo(cx + minDim * 0.55 * k, h);
          ctx.moveTo(cx - minDim * 0.55 * k, cy);
          ctx.lineTo(cx - minDim * 0.55 * k, h);
          ctx.stroke();
        }
        // 地砖汇聚线
        for (const fx of [0.1, 0.3, 0.7, 0.9]) {
          ctx.beginPath();
          ctx.moveTo(w * fx, h);
          ctx.lineTo(cx, cy + minDim * 0.14);
          ctx.strokeStyle = "rgba(246,243,238,0.3)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        // 远端剪影（无五官）
        ctx.fillStyle = "#102026";
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 7, cy + 6, 14, 24);
      } else {
        // 平淡无汇聚的横拍散景
        ctx.fillStyle = "#7D8B90";
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.fillStyle = "#5B6A70";
        ctx.fillRect(w * 0.08, h * 0.15, w * 0.18, h * 0.53);
        ctx.fillRect(w * 0.74, h * 0.15, w * 0.18, h * 0.53);
        ctx.fillStyle = "#1C2A30";
        ctx.beginPath();
        ctx.arc(w * 0.62, h * 0.54, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(w * 0.62 - 6, h * 0.54 + 8, 12, 22);
      }
    }

    // X-Ray 透视骨架层（只在右半「向心终稿」叠加隐藏汇聚线与静谧圈）
    if (good && xray) {
      ctx.save();
      ctx.strokeStyle = "#48D6D4";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, minDim * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      for (const [ex, ey] of [[0, 0], [w, 0], [0, h], [w, h]]) {
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = "rgba(255,138,92,0.75)";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function render() {
    const size = fitCanvas(canvas);
    if (!size) return;
    const { w, h, dpr } = size;
    const cutX = w * split;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 左半：散乱初稿
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cutX, h);
    ctx.clip();
    drawSceneHalf(w, h, false);
    ctx.restore();

    // 右半：向心终稿
    ctx.save();
    ctx.beginPath();
    ctx.rect(cutX, 0, w - cutX, h);
    ctx.clip();
    drawSceneHalf(w, h, true);
    ctx.restore();

    // 中央分割帘线与拖拽圆柄
    ctx.strokeStyle = "#F6F3EE";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutX, 0);
    ctx.lineTo(cutX, h);
    ctx.stroke();

    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.arc(cutX, h * 0.5, 14, 0, Math.PI * 2);
    ctx.fill();
    // 用矢量绘制左右双三角箭头（不依赖特殊字体字形，绝对居中）
    ctx.fillStyle = "#FFFFFF";
    const midY = h * 0.5;
    ctx.beginPath();
    ctx.moveTo(cutX - 7, midY);
    ctx.lineTo(cutX - 2, midY - 4);
    ctx.lineTo(cutX - 2, midY + 4);
    ctx.closePath();
    ctx.moveTo(cutX + 7, midY);
    ctx.lineTo(cutX + 2, midY - 4);
    ctx.lineTo(cutX + 2, midY + 4);
    ctx.closePath();
    ctx.fill();

    // 顶角左右标签
    ctx.fillStyle = "rgba(16,32,38,0.84)";
    ctx.fillRect(10, 10, 82, 22);
    ctx.fillStyle = "#FF8A5C";
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("散乱初稿", 51, 21.5);

    ctx.fillStyle = "rgba(16,32,38,0.84)";
    ctx.fillRect(w - 110, 10, 100, 22);
    ctx.fillStyle = "#48D6D4";
    ctx.fillText(xray ? "向心稿·透视" : "向心终稿", w - 60, 21.5);

    ctx.restore();
    if (noteEl) noteEl.textContent = NOTES[scene];
  }

  let dragging = false;
  function updateSplitFromClient(clientX) {
    const r = canvas.getBoundingClientRect();
    split = clamp((clientX - r.left) / r.width, 0.08, 0.92);
    if (range) range.value = String(Math.round(split * 100));
    render();
  }
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    updateSplitFromClient(e.clientX);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging) updateSplitFromClient(e.clientX);
  });
  window.addEventListener("pointerup", () => { dragging = false; });

  if (range) {
    range.addEventListener("input", () => {
      split = clamp(Number(range.value) / 100, 0.08, 0.92);
      render();
    });
  }
  if (xrayBtn) {
    xrayBtn.addEventListener("click", () => {
      xray = !xray;
      xrayBtn.classList.toggle("is-active", xray);
      xrayBtn.setAttribute("aria-pressed", String(xray));
      xrayBtn.textContent = xray ? "隐藏汇聚骨架" : "透视汇聚骨架";
      render();
    });
  }
  sceneBtns.forEach((b) => {
    b.addEventListener("click", () => {
      scene = b.dataset.s03Scene;
      sceneBtns.forEach((x) => {
        const a = x === b;
        x.classList.toggle("is-active", a);
        x.setAttribute("aria-pressed", String(a));
      });
      render();
    });
  });

  const ro = new ResizeObserver(render);
  ro.observe(canvas);
  render();
}

/* ==========================================================================
   04 节：四纪元历史几何演进蓝图（阿尔伯蒂 → 达·芬奇 → 拉斐尔 → 阿恩海姆/塔特勒）
   ========================================================================== */
export function mountSection04() {
  const canvas = document.getElementById("s04-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const eraBtns = [...document.querySelectorAll("[data-s04-era]")];
  const captionEl = document.getElementById("s04-caption");

  const ERAS = {
    alberti: {
      caption: "1435 · 阿尔伯蒂《论绘画》：所有正交地砖线汇向视平线上的「中心点（punto centrico）」，第一次把单眼视觉金字塔写成几何法度。",
    },
    leonardo: {
      caption: "1494–1498 · 达·芬奇《最后的晚餐》：在基督右太阳穴处钉钉拉线，藻井天花与两侧壁毯全部收束到这一单点，静稳居中与两侧波澜形成剧烈反差。",
    },
    raphael: {
      caption: "1509–1511 · 拉斐尔《雅典学院》：三层古典筒形拱券层层套叠，把透视灭点锁在柏拉图与亚里士多德之间，统领数十位先哲而井然不乱。",
    },
    arnheim: {
      caption: "1923–2007 · 韦特海默、阿恩海姆与塔特勒：从格式塔连续律到《中心的力量》向心/离心力场，再到 2007 年眼动实验证实的中心注视偏向，解释了向心构图的心理机制。",
    },
  };

  let era = "alberti";

  function render() {
    const size = fitCanvas(canvas);
    if (!size) return;
    const { w, h, dpr } = size;
    const cx = w * 0.5;
    const cy = h * 0.48;
    const minDim = Math.min(w, h);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 淡网格底
    ctx.strokeStyle = "rgba(16,32,38,0.06)";
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 28) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 24; y < h; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (era === "alberti") {
      // 阿尔伯蒂视平线 + 棋盘地砖透视网格 + 中心点
      const hy = h * 0.44;
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(20, hy); ctx.lineTo(w - 20, hy); ctx.stroke();
      ctx.setLineDash([]);

      for (let i = -5; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * (w * 0.14), h - 14);
        ctx.lineTo(cx, hy);
        ctx.strokeStyle = "rgba(19,131,133,0.52)";
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
      for (const t of [0.12, 0.28, 0.48, 0.72, 0.96]) {
        const y = hy + (h - 14 - hy) * (t * t);
        ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(w - 24, y);
        ctx.strokeStyle = "rgba(16,32,38,0.22)";
        ctx.stroke();
      }
      // 中心点标记
      ctx.beginPath(); ctx.arc(cx, hy, 7, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.orange; ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 11.5px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("PUNTO CENTRICO (1435)", cx, hy - 18);
    } else if (era === "leonardo") {
      // 达·芬奇食堂三面盒 + 藻井正交线 + 长桌 + 居中三角静稳核心
      const vpY = h * 0.44;
      // 侧墙与天花汇聚线
      for (const [x, y] of [
        [24, 20], [w * 0.25, 20], [w * 0.75, 20], [w - 24, 20],
        [24, h * 0.35], [w - 24, h * 0.35], [24, h * 0.65], [w - 24, h * 0.65],
      ]) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, vpY);
        ctx.strokeStyle = "rgba(19,131,133,0.45)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      // 后墙三扇窗（中窗自然勾出光环背景）
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - w * 0.22, vpY - h * 0.16, w * 0.44, h * 0.32);
      ctx.fillStyle = "rgba(19,131,133,0.16)";
      ctx.fillRect(cx - 26, vpY - 26, 52, 56);
      ctx.strokeRect(cx - 26, vpY - 26, 52, 56);

      // 居中稳定三角形主体示意
      ctx.beginPath();
      ctx.moveTo(cx, vpY - 12);
      ctx.lineTo(cx + 34, vpY + 42);
      ctx.lineTo(cx - 34, vpY + 42);
      ctx.closePath();
      ctx.fillStyle = "rgba(232,93,38,0.85)";
      ctx.fill();

      // 长桌水平线
      ctx.fillStyle = "#1C2A30";
      ctx.fillRect(w * 0.14, vpY + 42, w * 0.72, 10);

      // 钉孔灭点
      ctx.beginPath(); ctx.arc(cx, vpY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF"; ctx.fill();
      ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("钉孔灭点 · 单一叙事中心", cx, 22);
    } else if (era === "raphael") {
      // 拉斐尔三层嵌套拱券 + 透视地砖 + 双核心剪影（无五官）
      const vpY = h * 0.52;
      for (const [r, alpha] of [[minDim * 0.46, 0.26], [minDim * 0.34, 0.46], [minDim * 0.22, 0.8]]) {
        ctx.beginPath();
        ctx.arc(cx, vpY, r, Math.PI, 0);
        ctx.lineTo(cx + r, h - 20);
        ctx.moveTo(cx - r, vpY);
        ctx.lineTo(cx - r, h - 20);
        ctx.strokeStyle = `rgba(19,131,133,${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // 透视射线
      for (const fx of [0.08, 0.28, 0.72, 0.92]) {
        ctx.beginPath();
        ctx.moveTo(w * fx, h - 16);
        ctx.lineTo(cx, vpY);
        ctx.strokeStyle = "rgba(16,32,38,0.3)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      // 柏拉图与亚里士多德双剪影（纯圆头+长袍，无五官）
      for (const ox of [-15, 15]) {
        ctx.fillStyle = ox < 0 ? PALETTE.orange : PALETTE.ink;
        ctx.beginPath(); ctx.arc(cx + ox, vpY - 4, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(cx + ox - 7, vpY + 4, 14, 34, 4); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, vpY, 4, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.teal; ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("三层拱券收束 · 灭点落于双哲之间", cx, 22);
    } else {
      // 阿恩海姆向心力场 + 塔特勒中心注视热区示意
      const hg = ctx.createRadialGradient(cx, cy, 4, cx, cy, minDim * 0.38);
      hg.addColorStop(0, "rgba(232,93,38,0.44)");
      hg.addColorStop(0.5, "rgba(19,131,133,0.18)");
      hg.addColorStop(1, "rgba(19,131,133,0)");
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(cx, cy, minDim * 0.38, 0, Math.PI * 2); ctx.fill();

      // 8 支向心场矢量箭头
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const ux = Math.cos(a), uy = Math.sin(a);
        const r1 = minDim * 0.44;
        const r2 = minDim * 0.16;
        const x1 = cx + ux * r1, y1 = cy + uy * r1;
        const x2 = cx + ux * r2, y2 = cy + uy * r2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 2 === 0 ? PALETTE.teal : PALETTE.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        // 箭头
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + ux * 9 - uy * 5, y2 + uy * 9 + ux * 5);
        ctx.lineTo(x2 + ux * 9 + uy * 5, y2 + uy * 9 - ux * 5);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? PALETTE.teal : PALETTE.ink;
        ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, cy, minDim * 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE.orange; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("向心矢量场 × 中心注视偏向热区（示意）", cx, 22);
    }

    ctx.restore();
    if (captionEl) captionEl.textContent = ERAS[era].caption;
  }

  eraBtns.forEach((b) => {
    b.addEventListener("click", () => {
      era = b.dataset.s04Era;
      eraBtns.forEach((x) => {
        const a = x === b;
        x.classList.toggle("is-active", a);
        x.setAttribute("aria-pressed", String(a));
      });
      render();
    });
  });

  const ro = new ResizeObserver(render);
  ro.observe(canvas);
  render();
}

/* ==========================================================================
   05 节：什么时候别用 · 4 张交互式反例翻改卡
   ========================================================================== */
export function mountSection05() {
  const cards = [...document.querySelectorAll("[data-s05-card]")];
  cards.forEach((card) => {
    const btn = card.querySelector("[data-s05-toggle]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const rescued = card.classList.toggle("is-rescued");
      btn.setAttribute("aria-pressed", String(rescued));
      btn.textContent = rescued ? "切回硬套向心（看错因）" : "换对版式（看替代方案）";
    });
  });
}

/* ==========================================================================
   06 节：单变量四选一视觉考场（建筑灯光展「静默光廊 · 2026」）
   ========================================================================== */
export function mountSection06() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedbackEl = document.getElementById("quiz-feedback");
  const resetBtn = document.getElementById("quiz-reset");
  if (!cards.length) return;

  const OPTIONS = {
    A: {
      correct: false,
      sanctuary: 0.10,
      rebels: [],
      clutter: false,
      verdict: "方案 A 失守：箭尖刺核压迫主体",
      detail: "6 支楔形虽然都瞄准了中心，但静谧环被挤窄到仅 10%，锋利箭尖直接戳进「静默光廊」四字笔画里，主体可读性与庄重感立刻崩塌。",
    },
    B: {
      correct: false,
      sanctuary: 0.29,
      rebels: [0, 2, 4],
      clutter: false,
      verdict: "方案 B 失守：3 支楔形反指画外（离心叛逃）",
      detail: "中心净空和角落干净都没毛病，但有 3 支粗楔形箭尖朝画框外侧甩出，一边拉视线进去一边往外拽，向心凝聚被当场撕散。",
    },
    C: {
      correct: true,
      sanctuary: 0.29,
      rebels: [],
      clutter: false,
      verdict: "答对了 · 方案 C 四项向心条件全数成立",
      detail: "6 支粗细有致的楔形全部精准指向中央，整齐刹在 29% 静谧圈外为主标留出呼吸区，四角零杂散干扰，视线自然汇聚且稳重有力。",
    },
    D: {
      correct: false,
      sanctuary: 0.29,
      rebels: [],
      clutter: true,
      verdict: "方案 D 失守：四角堆满高饱和杂散抢戏",
      detail: "虽然 6 支楔形全部向内且净空合适，但四个角落塞满高饱和圆章、二维码与装饰条，眼睛还没走到中央就被角落截走，违背「减少分散元素」。",
    },
  };

  let picked = null;

  function drawQuizCard(card) {
    const optKey = card.dataset.quizOpt;
    const cfg = OPTIONS[optKey];
    const canvas = card.querySelector("canvas");
    if (!canvas) return;
    const size = fitCanvas(canvas);
    if (!size) return;
    const { w, h, dpr } = size;
    const ctx = canvas.getContext("2d");
    const cx = w * 0.5;
    const cy = h * 0.5;
    const minDim = Math.min(w, h);
    const ringR = cfg.sanctuary * minDim;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    const angles = [-132, -48, -4, 44, 134, 176];
    const colors = [PALETTE.teal, PALETTE.charcoal, PALETTE.orange, PALETTE.teal, PALETTE.charcoal, PALETTE.orange];

    angles.forEach((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      const ux = Math.cos(rad), uy = Math.sin(rad);
      const nx = -uy, ny = ux;
      const tx = Math.abs(ux) > 1e-4 ? (ux > 0 ? (w - cx) / ux : -cx / ux) : 1e9;
      const ty = Math.abs(uy) > 1e-4 ? (uy > 0 ? (h - cy) / uy : -cy / uy) : 1e9;
      const borderD = Math.min(tx, ty);
      const outerR = borderD + 14;
      const ox = cx + ux * outerR, oy = cy + uy * outerR;
      const ix = cx + ux * ringR, iy = cy + uy * ringR;
      const rebel = cfg.rebels.includes(idx);

      ctx.beginPath();
      if (!rebel) {
        const half = minDim * (idx % 2 === 0 ? 0.088 : 0.062);
        ctx.moveTo(ox + nx * half, oy + ny * half);
        ctx.lineTo(ix, iy);
        ctx.lineTo(ox - nx * half, oy - ny * half);
      } else {
        // 清晰落在可见画幅内的向外反指箭头（三支均完整显露箭尖）
        const tailR = ringR + 4;
        const tipR = Math.max(tailR + 28, borderD - 10);
        const neckR = tipR - Math.min(20, (tipR - tailR) * 0.42);
        const tailX = cx + ux * tailR, tailY = cy + uy * tailR;
        const tipX = cx + ux * tipR, tipY = cy + uy * tipR;
        const neckX = cx + ux * neckR, neckY = cy + uy * neckR;
        ctx.moveTo(tailX + nx * 4, tailY + ny * 4);
        ctx.lineTo(neckX + nx * 5.5, neckY + ny * 5.5);
        ctx.lineTo(neckX + nx * 13, neckY + ny * 13);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(neckX - nx * 13, neckY - ny * 13);
        ctx.lineTo(neckX - nx * 5.5, neckY - ny * 5.5);
        ctx.lineTo(tailX - nx * 4, tailY - ny * 4);
      }
      ctx.closePath();
      ctx.fillStyle = colors[idx];
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // 中央静谧圈与统一文案（四个方案字号、文案、配色完全一致！）
    if (cfg.sanctuary > 0.2) {
      ctx.beginPath();
      ctx.arc(cx, cy, ringR * 0.96, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(237,233,228,0.92)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = picked && optKey === picked && !cfg.correct && cfg.sanctuary < 0.18 ? PALETTE.danger : "rgba(19,131,133,0.55)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `900 ${clamp(Math.round(minDim * 0.115), 16, 22)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("静默光廊", cx, cy - 8);
    ctx.fillStyle = PALETTE.tealDeep;
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.fillText("2026 · LIGHT HALL", cx, cy + 12);

    // 方案 D 专属：四角高饱和杂散块
    if (cfg.clutter) {
      const blocks = [
        [24, 24, "#FC5E1F", "HOT"],
        [w - 28, 24, "#038D8E", "QR"],
        [28, h - 24, "#102026", "VIP"],
        [w - 28, h - 24, "#FC5E1F", "NEW"],
      ];
      for (const [bx, by, bg, label] of blocks) {
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect(bx - 18, by - 12, 36, 24, 3);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 10px "Space Mono", monospace`;
        ctx.fillText(label, bx, by + 0.5);
      }
    }

    // 选完后在卡片上标注 X-Ray 诊断框
    if (picked) {
      if (cfg.correct) {
        ctx.strokeStyle = PALETTE.ok;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, w - 4, h - 4);
      } else if (picked === optKey) {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, w - 4, h - 4);
      }
    }

    ctx.restore();
  }

  function redrawAll() {
    cards.forEach(drawQuizCard);
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      picked = card.dataset.quizOpt;
      const cfg = OPTIONS[picked];
      cards.forEach((c) => {
        const k = c.dataset.quizOpt;
        c.classList.toggle("is-picked", k === picked);
        c.classList.toggle("is-correct", Boolean(picked) && OPTIONS[k].correct);
        c.classList.toggle("is-wrong", k === picked && !OPTIONS[k].correct);
        c.setAttribute("aria-pressed", String(k === picked));
      });
      if (feedbackEl) {
        feedbackEl.hidden = false;
        feedbackEl.className = `quiz-feedback ${cfg.correct ? "is-ok" : "is-bad"}`;
        feedbackEl.innerHTML = `<strong>${cfg.verdict}</strong><p>${cfg.detail}</p>`;
      }
      if (resetBtn) resetBtn.hidden = false;
      redrawAll();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      picked = null;
      cards.forEach((c) => {
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", "false");
      });
      if (feedbackEl) feedbackEl.hidden = true;
      resetBtn.hidden = true;
      redrawAll();
    });
  }

  const ro = new ResizeObserver(redrawAll);
  cards.forEach((c) => {
    const cv = c.querySelector("canvas");
    if (cv) ro.observe(cv);
  });
  redrawAll();
}

/* ==========================================================================
   07 节：原海报点击放大、鼠标/触摸拖动与 Esc 关闭
   ========================================================================== */
export function mountPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const stage = document.getElementById("poster-modal-stage");
  if (!poster || !modal || !modalImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function open() {
    modalImg.src = poster.src;
    scale = 1.2;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  poster.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(scale + 0.3, 0.8, 3.2);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(scale - 0.3, 0.8, 3.2);
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.16 : -0.16), 0.8, 3.2);
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.style.cursor = "grabbing";
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
    stage.style.cursor = "grab";
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
