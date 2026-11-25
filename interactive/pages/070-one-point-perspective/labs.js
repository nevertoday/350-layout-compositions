// 070 一点透视 · 01–07 节专属互动实验与原海报灯箱
// 相邻两节互不复用同一种控件，全部矢量几何与数据单真源计算。

import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, parent = null) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}

/* =====================================================================
   01 节：三组建筑线（X 横 / Y 竖 / Z 纵深）独立点亮 + 偏转 22° 对照
   ===================================================================== */
export function initSec01() {
  const svg = document.getElementById("s1-svg");
  const modeTag = document.getElementById("s1-mode-tag");
  const note = document.getElementById("s1-note");
  const yawBtn = document.getElementById("btn-s1-yaw");
  const axisBtns = [...document.querySelectorAll(".line-toggle[data-axis]")];

  const st = { x: true, y: true, z: true, yawed: false };

  function render() {
    svg.innerHTML = "";
    const w = 600;
    const h = 340;
    const hy = 165;

    // 淡背景与视平线
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#F2EBE2" }, svg);
    el("line", {
      x1: 0, y1: hy, x2: w, y2: hy,
      stroke: "#8C8277", "stroke-width": 1.1, "stroke-dasharray": "5 5",
    }, svg);

    if (!st.yawed) {
      // 标准一点透视房间（正对端墙）
      const vp = { x: 300, y: hy };
      const near = { x1: 72, y1: 32, x2: 528, y2: 306 };
      const far = { x1: 214, y1: 112, x2: 386, y2: 224 };

      // 端面底色
      el("rect", {
        x: far.x1, y: far.y1, width: far.x2 - far.x1, height: far.y2 - far.y1,
        fill: "#FAF6F0",
      }, svg);

      // Z 纵深正交线（汇聚于唯一消失点）
      const zGroup = el("g", { opacity: st.z ? 1 : 0.14 }, svg);
      const zPairs = [
        [near.x1, near.y1, far.x1, far.y1],
        [near.x2, near.y1, far.x2, far.y1],
        [near.x1, near.y2, far.x1, far.y2],
        [near.x2, near.y2, far.x2, far.y2],
        [185, near.y2, 256, far.y2],
        [415, near.y2, 344, far.y2],
      ];
      for (const [x1, y1, x2, y2] of zPairs) {
        el("line", { x1, y1, x2, y2, stroke: "#E54616", "stroke-width": st.z ? 2.6 : 1.2 }, zGroup);
        el("line", {
          x1: x2, y1: y2, x2: vp.x, y2: vp.y,
          stroke: "#E54616", "stroke-width": 1.2, "stroke-dasharray": "4 4",
        }, zGroup);
      }

      // X 横线（严格水平平行，永不汇聚！）
      const xGroup = el("g", { opacity: st.x ? 1 : 0.14 }, svg);
      const xLines = [
        [near.x1, near.y1, near.x2, near.y1],
        [near.x1, near.y2, near.x2, near.y2],
        [far.x1, far.y1, far.x2, far.y1],
        [far.x1, far.y2, far.x2, far.y2],
        [135, 270, 465, 270],
        [182, 242, 418, 242],
      ];
      for (const [x1, y1, x2, y2] of xLines) {
        el("line", { x1, y1, x2, y2, stroke: "#1B5E7A", "stroke-width": st.x ? 2.6 : 1.2 }, xGroup);
      }

      // Y 竖线（严格垂直平行！）
      const yGroup = el("g", { opacity: st.y ? 1 : 0.14 }, svg);
      const yLines = [
        [near.x1, near.y1, near.x1, near.y2],
        [near.x2, near.y1, near.x2, near.y2],
        [far.x1, far.y1, far.x1, far.y2],
        [far.x2, far.y1, far.x2, far.y2],
        [135, 68, 135, 270],
        [465, 68, 465, 270],
      ];
      for (const [x1, y1, x2, y2] of yLines) {
        el("line", { x1, y1, x2, y2, stroke: "#141413", "stroke-width": st.y ? 2.6 : 1.2 }, yGroup);
      }

      // 唯一消失点
      el("circle", { cx: vp.x, cy: vp.y, r: 7, fill: "#E54616", stroke: "#FAF6F0", "stroke-width": 2 }, svg);
      const t = el("text", { x: vp.x, y: vp.y - 14, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#141413" }, svg);
      t.textContent = "唯一消失点 VP";

      modeTag.textContent = "正对 0° · 一点透视";
      const onList = [st.x && "蓝灰横线保水平", st.y && "炭黑竖线保垂直", st.z && "朱红纵深线聚一点"].filter(Boolean);
      note.textContent = onList.length
        ? `正对端墙（0°）：${onList.join("、")}。注意蓝色横线与视平线平行，但它们彼此平行永不相交。`
        : "至少点亮一组线，观察横、竖、纵深三种方向的不同几何命运。";
    } else {
      // 房间偏转 22°：正面不再平行画框 → 原本水平的横线也倾斜并分裂出 VP1 & VP2！
      const vp1 = { x: 86, y: hy };
      const vp2 = { x: 526, y: hy };
      // 建筑外角中棱
      const cx = 316;
      const topC = 64;
      const botC = 286;
      const lx = 186;
      const rx = 434;
      const lTop = hy + ((topC - hy) * (lx - vp1.x)) / (cx - vp1.x);
      const lBot = hy + ((botC - hy) * (lx - vp1.x)) / (cx - vp1.x);
      const rTop = hy + ((topC - hy) * (vp2.x - rx)) / (vp2.x - cx);
      const rBot = hy + ((botC - hy) * (vp2.x - rx)) / (vp2.x - cx);

      el("polygon", { points: `${lx},${lTop} ${cx},${topC} ${cx},${botC} ${lx},${lBot}`, fill: "#E54616", opacity: 0.14 }, svg);
      el("polygon", { points: `${cx},${topC} ${rx},${rTop} ${rx},${rBot} ${cx},${botC}`, fill: "#1B5E7A", opacity: 0.14 }, svg);

      // 原 X 线不再水平，朝 VP2 汇聚
      const xG = el("g", { opacity: st.x ? 1 : 0.14 }, svg);
      el("line", { x1: cx, y1: topC, x2: vp2.x, y2: vp2.y, stroke: "#1B5E7A", "stroke-width": 1.3, "stroke-dasharray": "4 4" }, xG);
      el("line", { x1: cx, y1: botC, x2: vp2.x, y2: vp2.y, stroke: "#1B5E7A", "stroke-width": 1.3, "stroke-dasharray": "4 4" }, xG);
      el("line", { x1: cx, y1: topC, x2: rx, y2: rTop, stroke: "#1B5E7A", "stroke-width": 2.8 }, xG);
      el("line", { x1: cx, y1: botC, x2: rx, y2: rBot, stroke: "#1B5E7A", "stroke-width": 2.8 }, xG);

      // 原 Z 线朝 VP1 汇聚
      const zG = el("g", { opacity: st.z ? 1 : 0.14 }, svg);
      el("line", { x1: cx, y1: topC, x2: vp1.x, y2: vp1.y, stroke: "#E54616", "stroke-width": 1.3, "stroke-dasharray": "4 4" }, zG);
      el("line", { x1: cx, y1: botC, x2: vp1.x, y2: vp1.y, stroke: "#E54616", "stroke-width": 1.3, "stroke-dasharray": "4 4" }, zG);
      el("line", { x1: cx, y1: topC, x2: lx, y2: lTop, stroke: "#E54616", "stroke-width": 2.8 }, zG);
      el("line", { x1: cx, y1: botC, x2: lx, y2: lBot, stroke: "#E54616", "stroke-width": 2.8 }, zG);

      // Y 竖线仍然垂直
      const yG = el("g", { opacity: st.y ? 1 : 0.14 }, svg);
      el("line", { x1: lx, y1: lTop, x2: lx, y2: lBot, stroke: "#141413", "stroke-width": 2.6 }, yG);
      el("line", { x1: cx, y1: topC, x2: cx, y2: botC, stroke: "#141413", "stroke-width": 3 }, yG);
      el("line", { x1: rx, y1: rTop, x2: rx, y2: rBot, stroke: "#141413", "stroke-width": 2.6 }, yG);

      el("circle", { cx: vp1.x, cy: vp1.y, r: 6.5, fill: "#E54616", stroke: "#FAF6F0", "stroke-width": 2 }, svg);
      el("circle", { cx: vp2.x, cy: vp2.y, r: 6.5, fill: "#1B5E7A", stroke: "#FAF6F0", "stroke-width": 2 }, svg);
      const t1 = el("text", { x: vp1.x, y: vp1.y - 14, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#B82E08" }, svg);
      t1.textContent = "消失点 1";
      const t2 = el("text", { x: vp2.x, y: vp2.y - 14, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#1B5E7A" }, svg);
      t2.textContent = "消失点 2";

      modeTag.textContent = "转斜 22° · 分裂为两点透视";
      note.textContent = "一旦房子转斜 22°，正面不再平行画框：原先水平的蓝线开始向右倾斜并收进第二消失点，此时已脱离一点透视，进入两点透视范畴。";
    }
  }

  for (const btn of axisBtns) {
    btn.addEventListener("click", () => {
      const k = btn.dataset.axis;
      st[k] = !st[k];
      btn.classList.toggle("is-active", st[k]);
      btn.setAttribute("aria-pressed", String(st[k]));
      render();
    });
  }

  yawBtn.addEventListener("click", () => {
    st.yawed = !st.yawed;
    yawBtn.classList.toggle("is-active", st.yawed);
    yawBtn.setAttribute("aria-pressed", String(st.yawed));
    yawBtn.textContent = st.yawed ? "转回正对 0°" : "试把房间转斜 22°";
    render();
  });

  render();
}

/* =====================================================================
   02 节：五步起一座廊道（原海报构成步骤步进绘图仪 + 距点定砖法）
   ===================================================================== */
const STEP_COPY = [
  {
    kicker: "STEP 01 / 05",
    title: "确定视平线与消失点",
    body: "先画一条贯穿画框的水平视平线，再在视平线上点下一枚朱红消失点。它决定了观者眼高与视线汇聚中心——所有纵深线都必须听它指挥。",
    lock: "锁死全图的眼高与主轴中心。跳过这一步直接画墙，左右壁面几乎必然各奔东西。",
  },
  {
    kicker: "STEP 02 / 05",
    title: "从消失点向画面四周延伸引导线",
    body: "以消失点为圆心，向四角及关键墙面转折处放射出几条极细的红色引导射线，先在空白画纸上搭出看不见的立体漏斗。",
    lock: "锁死顶、地、左墙、右墙四个面的倾斜边界，保证整条走廊的坡度严密自洽。",
  },
  {
    kicker: "STEP 03 / 05",
    title: "建立空间框架（墙面 / 地面 / 天花）",
    body: "用垂直线和水平线截出尽头端墙，再铺开地面与天花网格。开启「距点定砖对角线」可见经典画法：从左下角引一条对角线穿过纵向格线，交点处落横缝，地砖自动严密遵循近宽远密。",
    lock: "锁死三维空间盒子与真实 1/z 地砖节拍，避免把地板画成等距竖格。",
  },
  {
    kicker: "STEP 04 / 05",
    title: "添加物体沿引导线对齐",
    body: "把左墙壁龛、落地长凳、天窗灯板与右墙高门逐一放进框架——每件物体的横边保水平、竖边保垂直、纵深边必须踩在通往消失点的射线上。",
    lock: "锁死「家具属于同一个空间」的说服力，杜绝孤立物体飘浮或歪斜。",
  },
  {
    kicker: "STEP 05 / 05",
    title: "调整明暗与细节完成画面",
    body: "最后填入朱赤红左墙与高门、纯黑粗框与天窗暗面，压住近景轮廓对比，整张原海报式的硬朗包豪斯长廊便一气呵成。",
    lock: "用大色块与明暗层次强化纵深焦点，而不是靠堆满杂乱线条撑场面。",
  },
];

export function initSec02() {
  const canvas = document.getElementById("s2-canvas");
  const ctx = canvas.getContext("2d");
  const cards = [...document.querySelectorAll(".step-card")];
  const prevBtn = document.getElementById("btn-s2-prev");
  const nextBtn = document.getElementById("btn-s2-next");
  const playBtn = document.getElementById("btn-s2-play");
  const diagBtn = document.getElementById("btn-s2-diag");

  const elKicker = document.getElementById("s2-kicker");
  const elTitle = document.getElementById("s2-title");
  const elBody = document.getElementById("s2-body");
  const elLock = document.getElementById("s2-lock");
  const chkItems = [...document.querySelectorAll("#s2-checklist li")];

  let step = 3;
  let showDiag = false;
  let playing = false;
  let playTimer = 0;

  function syncText() {
    const c = STEP_COPY[step - 1];
    elKicker.textContent = c.kicker;
    elTitle.textContent = c.title;
    elBody.textContent = c.body;
    elLock.textContent = c.lock;
    cards.forEach((b, i) => {
      const active = i + 1 === step;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    });
    chkItems.forEach((li, i) => {
      const done = i + 1 <= step;
      li.classList.toggle("is-done", done);
      const m = li.querySelector(".chk-mark");
      if (m) m.textContent = done ? `[✓]` : `[0${i + 1}]`;
    });
    playBtn.textContent = playing ? "暂停演示" : "自动演示 1 → 5";
    playBtn.classList.toggle("is-active", playing);
  }

  let s2W = 560, s2H = 350, s2NeedResize = true, s2Dirty = true;
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => { s2NeedResize = true; s2Dirty = true; }).observe(canvas);
  }
  window.addEventListener("resize", () => { s2NeedResize = true; s2Dirty = true; });

  function draw(t, dt, { still }) {
    if (playing && !still) {
      playTimer += dt;
      if (playTimer >= 1.35) {
        playTimer = 0;
        step = step >= 5 ? 1 : step + 1;
        syncText();
        s2Dirty = true;
      }
    }
    if (still) s2Dirty = true;
    if (!s2Dirty && !s2NeedResize) return;
    s2Dirty = false;

    if (s2NeedResize) {
      const rect = canvas.getBoundingClientRect();
      s2W = Math.max(240, Math.round(rect.width));
      s2H = Math.max(160, Math.round(rect.height));
      const dpr = pixelRatio(window.innerWidth <= 600 ? 1.5 : 2);
      const pw = Math.round(s2W * dpr);
      const ph = Math.round(s2H * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s2NeedResize = false;
    }
    const w = s2W;
    const h = s2H;

    const vp = { x: w * 0.54, y: h * 0.50 };
    const bL = w * 0.42;
    const bR = w * 0.66;
    const bT = h * 0.36;
    const bB = h * 0.64;

    ctx.fillStyle = "#F2EBE2";
    ctx.fillRect(0, 0, w, h);

    // Step 5 底层色块铺色（朱红左墙、右红门、黑天窗）
    if (step >= 5) {
      ctx.fillStyle = "#E54616";
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(bL, bT); ctx.lineTo(bL, bB); ctx.lineTo(0, h);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = "#FAF6F0";
      ctx.fillRect(bL, bT, bR - bL, bB - bT);
    }

    // Step 1: 视平线
    ctx.save();
    ctx.strokeStyle = "rgba(224, 64, 15, 0.72)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(0, vp.y); ctx.lineTo(w, vp.y);
    ctx.stroke();
    ctx.restore();

    // Step 2: 四角辐射引导线
    if (step >= 2) {
      ctx.save();
      ctx.strokeStyle = "rgba(224, 64, 15, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      for (const [cx, cy] of [[0, 0], [w, 0], [w, h], [0, h]]) {
        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Step 3: 空间框架 + 1/z 地砖网格（通过真实截距生成）
    if (step >= 3) {
      ctx.strokeStyle = "#141413";
      ctx.lineWidth = step >= 5 ? 3.2 : 1.8;
      // 四条走廊大棱
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(bL, bT);
      ctx.moveTo(w, 0); ctx.lineTo(bR, bT);
      ctx.moveTo(w, h); ctx.lineTo(bR, bB);
      ctx.moveTo(0, h); ctx.lineTo(bL, bB);
      ctx.stroke();
      // 端墙方框
      ctx.lineWidth = 1.4;
      ctx.strokeRect(bL, bT, bR - bL, bB - bT);

      // 地面纵向格线与严格 1/z 横向地砖
      const cols = 4;
      const rows = 6;
      ctx.strokeStyle = "rgba(20, 20, 19, 0.35)";
      ctx.lineWidth = 1;
      for (let c = 1; c < cols; c++) {
        const bx = (w * c) / cols;
        const fx = bL + ((bR - bL) * c) / cols;
        ctx.beginPath();
        ctx.moveTo(bx, h); ctx.lineTo(fx, bB);
        ctx.stroke();
      }
      // 用真实的对角线与纵线交点求出地砖横缝 y（真正的阿尔贝蒂/距点构造法！）
      const diagY = [];
      for (let r = 0; r <= rows; r++) {
        const z = 1.0 + (r / rows) * 4.5;
        const tInv = (1 / z - 1 / 5.5) / (1 - 1 / 5.5);
        const y = bB + (h - bB) * tInv;
        diagY.push(y);
        const xL = bL - (bL * (y - bB)) / (h - bB);
        const xR = bR + ((w - bR) * (y - bB)) / (h - bB);
        ctx.beginPath();
        ctx.moveTo(xL, y); ctx.lineTo(xR, y);
        ctx.stroke();
      }

      if (showDiag) {
        // 绘出距点构造对角线，展示横缝并非手猜
        ctx.save();
        ctx.strokeStyle = "#146B48";
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(bR, bB);
        ctx.stroke();
        ctx.fillStyle = "#146B48";
        for (let r = 1; r < rows; r++) {
          const y = diagY[r];
          const ratio = (h - y) / (h - bB);
          const ix = bR * ratio;
          ctx.beginPath();
          ctx.arc(ix, y, 3.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.font = '700 11.5px "Noto Sans SC", sans-serif';
        ctx.fillText("对角交点自动锁定 1/z 横缝", 14, h - 14);
        ctx.restore();
      }
    }

    // Step 4: 沿引导线添置壁龛、长凳、天窗与右门
    if (step >= 4) {
      const lerpP = (p1, p2, s) => ({ x: p1.x + (p2.x - p1.x) * s, y: p1.y + (p2.y - p1.y) * s });
      // 左墙壁龛
      const wTL = lerpP({ x: 0, y: h * 0.22 }, { x: bL, y: bT + (bB - bT) * 0.22 }, 0.28);
      const wTR = lerpP({ x: 0, y: h * 0.22 }, { x: bL, y: bT + (bB - bT) * 0.22 }, 0.62);
      const wBR = lerpP({ x: 0, y: h * 0.68 }, { x: bL, y: bT + (bB - bT) * 0.68 }, 0.62);
      const wBL = lerpP({ x: 0, y: h * 0.68 }, { x: bL, y: bT + (bB - bT) * 0.68 }, 0.28);
      ctx.beginPath();
      ctx.moveTo(wTL.x, wTL.y); ctx.lineTo(wTR.x, wTR.y); ctx.lineTo(wBR.x, wBR.y); ctx.lineTo(wBL.x, wBL.y);
      ctx.closePath();
      if (step >= 5) { ctx.fillStyle = "#F2EBE2"; ctx.fill(); }
      ctx.strokeStyle = "#0F0F0F";
      ctx.lineWidth = step >= 5 ? 5 : 2;
      ctx.stroke();

      // 左墙落地长凳
      const b1 = lerpP({ x: 0, y: h * 0.80 }, { x: bL, y: bB - (bB - bT) * 0.16 }, 0.16);
      const b2 = lerpP({ x: 0, y: h * 0.80 }, { x: bL, y: bB - (bB - bT) * 0.16 }, 0.68);
      const b3 = lerpP({ x: 0, y: h }, { x: bL, y: bB }, 0.68);
      const b4 = lerpP({ x: 0, y: h }, { x: bL, y: bB }, 0.16);
      ctx.beginPath();
      ctx.moveTo(b1.x + 26, b1.y); ctx.lineTo(b2.x + 12, b2.y); ctx.lineTo(b3.x + 12, b3.y); ctx.lineTo(b4.x + 26, b4.y);
      ctx.closePath();
      if (step >= 5) { ctx.fillStyle = "#FAF6F0"; ctx.fill(); }
      ctx.lineWidth = 2;
      ctx.stroke();

      // 天花三块天窗
      for (const [s1, s2] of [[0.14, 0.34], [0.44, 0.62], [0.70, 0.84]]) {
        const c1 = lerpP({ x: w * 0.34, y: 0 }, { x: bL + (bR - bL) * 0.34, y: bT }, s1);
        const c2 = lerpP({ x: w * 0.68, y: 0 }, { x: bL + (bR - bL) * 0.68, y: bT }, s1);
        const c3 = lerpP({ x: w * 0.68, y: 0 }, { x: bL + (bR - bL) * 0.68, y: bT }, s2);
        const c4 = lerpP({ x: w * 0.34, y: 0 }, { x: bL + (bR - bL) * 0.34, y: bT }, s2);
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.lineTo(c4.x, c4.y);
        ctx.closePath();
        if (step >= 5) { ctx.fillStyle = "#0F0F0F"; ctx.fill(); }
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // 右墙朱红高门
      const dTL = lerpP({ x: w, y: h * 0.14 }, { x: bR, y: bT + (bB - bT) * 0.14 }, 0.20);
      const dTR = lerpP({ x: w, y: h * 0.14 }, { x: bR, y: bT + (bB - bT) * 0.14 }, 0.56);
      const dBR = lerpP({ x: w, y: h }, { x: bR, y: bB }, 0.56);
      const dBL = lerpP({ x: w, y: h }, { x: bR, y: bB }, 0.20);
      ctx.beginPath();
      ctx.moveTo(dTL.x, dTL.y); ctx.lineTo(dTR.x, dTR.y); ctx.lineTo(dBR.x, dBR.y); ctx.lineTo(dBL.x, dBL.y);
      ctx.closePath();
      if (step >= 5) { ctx.fillStyle = "#E74513"; ctx.fill(); }
      ctx.lineWidth = step >= 5 ? 5 : 2;
      ctx.stroke();
    }

    // 消失点红圆
    ctx.beginPath();
    ctx.arc(vp.x, vp.y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#E0400F";
    ctx.fill();
    ctx.strokeStyle = "#FAF6F0";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const runner = loop(canvas, draw);

  function setStep(n) {
    step = clamp(n, 1, 5);
    playTimer = 0;
    s2Dirty = true;
    syncText();
    runner.draw();
  }

  cards.forEach((b) => b.addEventListener("click", () => {
    playing = false;
    setStep(Number(b.dataset.step));
  }));
  prevBtn.addEventListener("click", () => { playing = false; setStep(step === 1 ? 5 : step - 1); });
  nextBtn.addEventListener("click", () => { playing = false; setStep(step === 5 ? 1 : step + 1); });
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playTimer = 0;
    s2Dirty = true;
    syncText();
    runner.draw();
  });
  diagBtn.addEventListener("click", () => {
    showDiag = !showDiag;
    diagBtn.classList.toggle("is-active", showDiag);
    diagBtn.setAttribute("aria-pressed", String(showDiag));
    s2Dirty = true;
    if (showDiag && step < 3) setStep(3);
    else runner.draw();
  });

  syncText();
  runner.draw();
}

/* =====================================================================
   03 节（纯黑暗室）：二维观者走廊截面站位板 + 前景框尺度 + 人物背影剪影
   ===================================================================== */
export function initSec03() {
  const pad = document.getElementById("s3-pad");
  const dot = document.getElementById("s3-dot");
  const coord = document.getElementById("s3-coord");
  const svg = document.getElementById("s3-svg");
  const mCeil = document.getElementById("m-ceil");
  const mFloor = document.getElementById("m-floor");
  const mCeilV = document.getElementById("m-ceil-v");
  const mFloorV = document.getElementById("m-floor-v");
  const note = document.getElementById("s3-note");
  const presetBtns = [...document.querySelectorAll("[data-s3]")];
  const fgBtns = [...document.querySelectorAll("[data-s3fg]")];

  const st = { x: 0.50, y: 0.50, fg: "mid" };

  function render() {
    dot.style.left = `${(st.x * 100).toFixed(1)}%`;
    dot.style.top = `${((1 - st.y) * 100).toFixed(1)}%`; // y=1 在顶部高眼位，y=0 在底部蹲地仰望
    coord.textContent = `站位 ${Math.round(st.x * 100)}% · 眼高 ${Math.round(st.y * 100)}%`;

    const w = 640;
    const h = 380;
    const vpX = (0.20 + st.x * 0.60) * w;
    // 眼高 y 越高（俯视），视平线在画面越靠上（即 screenY 越小）
    const vpY = (0.80 - st.y * 0.60) * h;

    const bw = 136;
    const bh = 104;
    const bx1 = vpX - bw * 0.5;
    const bx2 = vpX + bw * 0.5;
    const by1 = vpY - bh * (0.24 + (1 - st.y) * 0.52);
    const by2 = by1 + bh;

    const ceilShare = Math.round((Math.max(10, by1) / (Math.max(10, by1) + Math.max(10, h - by2))) * 100);
    const floorShare = 100 - ceilShare;
    mCeil.style.width = `${ceilShare}%`;
    mFloor.style.width = `${floorShare}%`;
    mCeilV.textContent = `${ceilShare}%`;
    mFloorV.textContent = `${floorShare}%`;

    svg.innerHTML = "";
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#F2EBE2" }, svg);
    // 左朱红墙
    el("polygon", { points: `0,0 ${bx1},${by1} ${bx1},${by2} 0,${h}`, fill: "#E54616" }, svg);
    // 右米白墙
    el("polygon", { points: `${bx2},${by1} ${w},0 ${w},${h} ${bx2},${by2}`, fill: "#FAF6F0" }, svg);
    // 天花
    el("polygon", { points: `0,0 ${w},0 ${bx2},${by1} ${bx1},${by1}`, fill: "#ECE3D6" }, svg);
    // 地板
    el("polygon", { points: `${bx1},${by2} ${bx2},${by2} ${w},${h} 0,${h}`, fill: "#E6DDD0" }, svg);
    // 尽头开口
    el("rect", { x: bx1, y: by1, width: bw, height: bh, fill: "#FAF6F0", stroke: "#141413", "stroke-width": 1.6 }, svg);

    // 地面横缝与纵线
    for (let c = 1; c <= 3; c++) {
      const fx = bx1 + (bw * c) / 4;
      const nx = (w * c) / 4;
      el("line", { x1: fx, y1: by2, x2: nx, y2: h, stroke: "#8A8075", "stroke-width": 1 }, svg);
    }
    for (let r = 1; r <= 5; r++) {
      const t = Math.pow(r / 6, 1.85);
      const y = by2 + (h - by2) * t;
      const lx = bx1 * (1 - t);
      const rx = bx2 + (w - bx2) * t;
      el("line", { x1: lx, y1: y, x2: rx, y2: y, stroke: "#8A8075", "stroke-width": 1 }, svg);
    }

    // 四条粗黑主骨线
    for (const [x1, y1, x2, y2] of [
      [0, 0, bx1, by1], [w, 0, bx2, by1], [w, h, bx2, by2], [0, h, bx1, by2],
    ]) {
      el("line", { x1, y1, x2, y2, stroke: "#0F0F0F", "stroke-width": 3.5 }, svg);
    }

    // 干净几何人物背影剪影（严格无五官！始终脚踩地砖、头顶贴近视平线，呈现真实等高人眼透视法则）
    const figH = bh * 0.62;
    const figX = vpX;
    const figFootY = by2;
    const headR = figH * 0.13;
    const figG = el("g", { fill: "#141413" }, svg);
    // 头部剪影（纯圆，零五官）
    el("circle", { cx: figX, cy: figFootY - figH + headR, r: headR }, figG);
    // 躯干与双腿背影
    el("path", {
      d: `M ${figX - headR * 1.45} ${figFootY - figH + headR * 2.3}
          Q ${figX} ${figFootY - figH + headR * 1.7} ${figX + headR * 1.45} ${figFootY - figH + headR * 2.3}
          L ${figX + headR * 1.15} ${figFootY - figH * 0.42}
          L ${figX + headR * 0.85} ${figFootY}
          L ${figX + headR * 0.22} ${figFootY}
          L ${figX} ${figFootY - figH * 0.34}
          L ${figX - headR * 0.22} ${figFootY}
          L ${figX - headR * 0.85} ${figFootY}
          L ${figX - headR * 1.15} ${figFootY - figH * 0.42} Z`,
    }, figG);

    // 视平线虚线与消失点
    el("line", { x1: 0, y1: vpY, x2: w, y2: vpY, stroke: "#E0400F", "stroke-width": 1.4, "stroke-dasharray": "6 5" }, svg);
    el("circle", { cx: vpX, cy: vpY, r: 6, fill: "#E0400F", stroke: "#FAF6F0", "stroke-width": 2 }, svg);

    // 前景门框尺子（对应原海报小贴士 3：前景物体越大，越能强化空间的深度感）
    if (st.fg === "mid" || st.fg === "heavy") {
      const fw = st.fg === "heavy" ? 86 : 42;
      const fh = st.fg === "heavy" ? 44 : 20;
      el("rect", { x: 0, y: 0, width: fw, height: h, fill: "#0F0F0F" }, svg);
      el("rect", { x: w - fw, y: 0, width: fw, height: h, fill: "#0F0F0F" }, svg);
      el("rect", { x: 0, y: 0, width: w, height: fh, fill: "#0F0F0F" }, svg);
      if (st.fg === "heavy") {
        // 前景内沿朱红镶边，极强纵深压缩对比
        el("line", { x1: fw, y1: fh, x2: fw, y2: h, stroke: "#E54616", "stroke-width": 4 }, svg);
        el("line", { x1: w - fw, y1: fh, x2: w - fw, y2: h, stroke: "#E54616", "stroke-width": 4 }, svg);
      }
    }

    // 实时文字诊断
    const eyeTxt = st.y > 0.65
      ? `眼高抬到 ${Math.round(st.y * 100)}%（高机位俯视）：地板铺开至 ${floorShare}%，路径与地砖一览无余。`
      : st.y < 0.35
        ? `眼高压到 ${Math.round(st.y * 100)}%（低机位仰视）：天花占满 ${ceilShare}%，建筑穹顶气势压顶。`
        : `眼高在 ${Math.round(st.y * 100)}%（平视）：天花 ${ceilShare}% / 地面 ${floorShare}%，视线平直切入尽头。`;
    const posTxt = Math.abs(st.x - 0.5) > 0.16
      ? (st.x < 0.5 ? "观者贴近左墙，右侧留出大片展陈墙面。" : "观者贴近右墙，左侧朱红斜壁成为视觉主角。")
      : "居中对称站位，仪式感与稳定性最强。";
    const fgTxt = st.fg === "heavy"
      ? "前景巨幅黑门框把远处缩成深邃舞台，纵深感骤增。"
      : st.fg === "none"
        ? "拿掉前景遮挡后，近远尺差变弱，画面更开放但也偏平。"
        : "中景门柱提供清晰近景参照。";

    note.innerHTML = `${eyeTxt}${posTxt}${fgTxt} 想深入前景遮框与比例递减，可看 <a class="dark-link" href="https://layout.xiaoxiaodong.ai/066/play/">066 前景框架构图</a> 与 <a class="dark-link" href="https://layout.xiaoxiaodong.ai/068/play/">068 尺度递减构图</a>。`;
  }

  function updateFromEvent(e) {
    const r = pad.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    st.x = clamp((src.clientX - r.left) / r.width, 0.08, 0.92);
    st.y = clamp(1 - (src.clientY - r.top) / r.height, 0.08, 0.92);
    presetBtns.forEach((b) => b.classList.remove("is-active"));
    render();
  }

  pad.addEventListener("mousedown", (e) => {
    e.preventDefault();
    updateFromEvent(e);
    const mv = (ev) => updateFromEvent(ev);
    const up = () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  });

  pad.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { e.preventDefault(); updateFromEvent(e); } }, { passive: false });
  pad.addEventListener("touchmove", (e) => { if (e.touches.length === 1) { e.preventDefault(); updateFromEvent(e); } }, { passive: false });

  pad.addEventListener("keydown", (e) => {
    let ok = true;
    if (e.key === "ArrowLeft") st.x = clamp(st.x - 0.06, 0.08, 0.92);
    else if (e.key === "ArrowRight") st.x = clamp(st.x + 0.06, 0.08, 0.92);
    else if (e.key === "ArrowUp") st.y = clamp(st.y + 0.06, 0.08, 0.92);
    else if (e.key === "ArrowDown") st.y = clamp(st.y - 0.06, 0.08, 0.92);
    else ok = false;
    if (ok) { e.preventDefault(); presetBtns.forEach((b) => b.classList.remove("is-active")); render(); }
  });

  const PRESET_MAP = {
    center: { x: 0.50, y: 0.50 },
    bird: { x: 0.50, y: 0.84 },
    worm: { x: 0.50, y: 0.16 },
    side: { x: 0.20, y: 0.48 },
  };
  presetBtns.forEach((b) => b.addEventListener("click", () => {
    const p = PRESET_MAP[b.dataset.s3];
    st.x = p.x; st.y = p.y;
    presetBtns.forEach((x) => x.classList.toggle("is-active", x === b));
    render();
  }));

  fgBtns.forEach((b) => b.addEventListener("click", () => {
    st.fg = b.dataset.s3fg;
    fgBtns.forEach((x) => x.classList.toggle("is-active", x === b));
    render();
  }));

  render();
}

/* =====================================================================
   04 节：三种常见错法 X 光红线照妖镜
   ===================================================================== */
export function initSec04() {
  const cards = [...document.querySelectorAll(".err-card")];

  function drawCard(card, xray, fixed) {
    const type = card.dataset.err;
    const svg = card.querySelector(".err-svg");
    const desc = card.querySelector(".err-desc");
    svg.innerHTML = "";
    const w = 360;
    const h = 220;
    const vp = { x: 180, y: 110 };

    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#FAF6F0" }, svg);

    if (type === "multi") {
      const vpA = fixed ? vp : { x: 148, y: 84 };
      const vpB = fixed ? vp : { x: 224, y: 136 };
      const bL = 132, bR = 228, bT = 76, bB = 144;
      // 端墙
      el("rect", { x: bL, y: bT, width: bR - bL, height: bB - bT, fill: "#F2EBE2", stroke: "#141413", "stroke-width": 1.4 }, svg);
      // 左上棱指向 vpA，右下棱指向 vpB
      const tlEnd = { x: vpA.x + (0 - vpA.x) * 0.72, y: vpA.y + (0 - vpA.y) * 0.72 };
      const brEnd = { x: vpB.x + (w - vpB.x) * 0.72, y: vpB.y + (h - vpB.y) * 0.72 };
      el("line", { x1: 0, y1: 0, x2: bL, y2: bT, stroke: "#141413", "stroke-width": 2.4 }, svg);
      el("line", { x1: w, y1: 0, x2: bR, y2: bT, stroke: "#141413", "stroke-width": 2.4 }, svg);
      el("line", { x1: 0, y1: h, x2: bL, y2: bB, stroke: "#141413", "stroke-width": 2.4 }, svg);
      el("line", { x1: w, y1: h, x2: bR, y2: bB, stroke: "#141413", "stroke-width": 2.4 }, svg);
      // 左墙装饰条（错向 vpA）
      const s1 = { x: 32, y: 66 };
      const s2 = { x: s1.x + (vpA.x - s1.x) * 0.56, y: s1.y + (vpA.y - s1.y) * 0.56 };
      const s3 = { x: 32, y: 158 };
      const s4 = { x: s3.x + (vpB.x - s3.x) * 0.56, y: s3.y + (vpB.y - s3.y) * 0.56 };
      el("polygon", { points: `${s1.x},${s1.y} ${s2.x},${s2.y} ${s4.x},${s4.y} ${s3.x},${s3.y}`, fill: "#E54616", opacity: 0.85, stroke: "#141413", "stroke-width": 1.8 }, svg);

      if (xray) {
        const col = fixed ? "#146B48" : "#A81910";
        el("line", { x1: s1.x, y1: s1.y, x2: vpA.x, y2: vpA.y, stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
        el("line", { x1: s3.x, y1: s3.y, x2: vpB.x, y2: vpB.y, stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
        el("line", { x1: 0, y1: 0, x2: vp.x, y2: vp.y, stroke: "#4A453F", "stroke-width": 1.1, "stroke-dasharray": "4 4" }, svg);
        el("circle", { cx: vp.x, cy: vp.y, r: 5, fill: fixed ? "#146B48" : "#E54616" }, svg);
        if (!fixed) {
          for (const p of [vpA, vpB]) {
            el("path", { d: `M${p.x - 5},${p.y - 5} L${p.x + 5},${p.y + 5} M${p.x + 5},${p.y - 5} L${p.x - 5},${p.y + 5}`, stroke: "#A81910", "stroke-width": 2.2 }, svg);
          }
        }
      }
      desc.textContent = fixed
        ? "已校直：上下墙棱与红窗边框全部落进同一枚消失点，墙面立刻绷平。"
        : "不拉辅助线时似乎只是轻微歪斜；一旦延长各条墙棱，红叉散落多处，屋子像揉皱的纸盒。";
    } else if (type === "horizon") {
      const bL = 132, bR = 228, bT = 76, bB = 144;
      const vpR = fixed ? vp : { x: 180, y: 152 };
      el("rect", { x: bL, y: bT, width: bR - bL, height: bB - bT, fill: "#F2EBE2", stroke: "#141413", "stroke-width": 1.4 }, svg);
      for (const [x1, y1, x2, y2] of [[0, 0, bL, bT], [w, 0, bR, bT], [0, h, bL, bB], [w, h, bR, bB]]) {
        el("line", { x1, y1, x2, y2, stroke: "#141413", "stroke-width": 2 }, svg);
      }
      // 左窗对准主视平线
      const l1 = { x: 34, y: 58 }, l2 = { x: 34 + (vp.x - 34) * 0.48, y: 58 + (vp.y - 58) * 0.48 };
      const l3 = { x: 34, y: 162 }, l4 = { x: 34 + (vp.x - 34) * 0.48, y: 162 + (vp.y - 162) * 0.48 };
      el("polygon", { points: `${l1.x},${l1.y} ${l2.x},${l2.y} ${l4.x},${l4.y} ${l3.x},${l3.y}`, fill: "#141413" }, svg);
      // 右门对准偏低视平线 vpR
      const r1 = { x: 326, y: 46 }, r2 = { x: 326 + (vpR.x - 326) * 0.48, y: 46 + (vpR.y - 46) * 0.48 };
      const r3 = { x: 326, y: 196 }, r4 = { x: 326 + (vpR.x - 326) * 0.48, y: 196 + (vpR.y - 196) * 0.48 };
      el("polygon", { points: `${r1.x},${r1.y} ${r2.x},${r2.y} ${r4.x},${r4.y} ${r3.x},${r3.y}`, fill: "#E54616", stroke: "#141413", "stroke-width": 2 }, svg);

      if (xray) {
        el("line", { x1: 0, y1: vp.y, x2: w, y2: vp.y, stroke: "#146B48", "stroke-width": 1.4, "stroke-dasharray": "5 4" }, svg);
        el("line", { x1: l1.x, y1: l1.y, x2: vp.x, y2: vp.y, stroke: "#146B48", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
        const col = fixed ? "#146B48" : "#A81910";
        el("line", { x1: r1.x, y1: r1.y, x2: vpR.x, y2: vpR.y, stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
        el("line", { x1: r3.x, y1: r3.y, x2: vpR.x, y2: vpR.y, stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
        if (!fixed) {
          el("line", { x1: 0, y1: vpR.y, x2: w, y2: vpR.y, stroke: "#A81910", "stroke-width": 1.4, "stroke-dasharray": "3 3" }, svg);
          el("path", { d: `M${vpR.x - 5},${vpR.y - 5} L${vpR.x + 5},${vpR.y + 5} M${vpR.x + 5},${vpR.y - 5} L${vpR.x - 5},${vpR.y + 5}`, stroke: "#A81910", "stroke-width": 2.2 }, svg);
        }
        el("circle", { cx: vp.x, cy: vp.y, r: 5, fill: "#146B48" }, svg);
      }
      desc.textContent = fixed
        ? "已校直：左右门窗共同锚定唯一水平视平线，红门立刻在右墙站稳。"
        : "一张单镜头画里，人的眼高只能有一条水平线。右门灭点低了一截，门框就像失去重力正在墙上滑坠。";
    } else {
      const bL = 132, bR = 228, bT = 76, bB = 144;
      el("rect", { x: bL, y: bT, width: bR - bL, height: bB - bT, fill: "#F2EBE2", stroke: "#141413", "stroke-width": 1.4 }, svg);
      for (const [x1, y1, x2, y2] of [[0, 0, bL, bT], [w, 0, bR, bT], [0, h, bL, bB], [w, h, bR, bB]]) {
        el("line", { x1, y1, x2, y2, stroke: "#141413", "stroke-width": 2 }, svg);
      }
      // 走廊中右方独立展柜
      const bx = 212, by = 144, bw = 54, bh = 44;
      const vpObj = fixed ? vp : { x: 88, y: 110 };
      const t = 0.28;
      const bTL = { x: bx + (vpObj.x - bx) * t, y: by + (vpObj.y - by) * t };
      const bTR = { x: bx + bw + (vpObj.x - (bx + bw)) * t, y: by + (vpObj.y - by) * t };
      const bBL = { x: bx + (vpObj.x - bx) * t, y: by + bh + (vpObj.y - (by + bh)) * t };
      el("polygon", { points: `${bx},${by} ${bTL.x},${bTL.y} ${bBL.x},${bBL.y} ${bx},${by + bh}`, fill: "#CFC6BA", stroke: "#141413", "stroke-width": 1.6 }, svg);
      el("polygon", { points: `${bx},${by} ${bx + bw},${by} ${bTR.x},${bTR.y} ${bTL.x},${bTL.y}`, fill: "#E54616", stroke: "#141413", "stroke-width": 1.6 }, svg);
      el("rect", { x: bx, y: by, width: bw, height: bh, fill: "#141413", stroke: "#141413", "stroke-width": 1.6 }, svg);

      if (xray) {
        const col = fixed ? "#146B48" : "#A81910";
        el("line", { x1: bx, y1: by, x2: vpObj.x, y2: vpObj.y, stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
        el("line", { x1: bx + bw, y1: by, x2: vpObj.x, y2: vpObj.y, stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
        el("circle", { cx: vp.x, cy: vp.y, r: 5, fill: "#146B48" }, svg);
        if (!fixed) {
          el("path", { d: `M${vpObj.x - 5},${vpObj.y - 5} L${vpObj.x + 5},${vpObj.y + 5} M${vpObj.x + 5},${vpObj.y - 5} L${vpObj.x - 5},${vpObj.y + 5}`, stroke: "#A81910", "stroke-width": 2.2 }, svg);
        }
      }
      desc.textContent = fixed
        ? "已校直：展柜纵深棱线与整座走廊汇入同一消失点，稳稳落在地砖网格上。"
        : "即使墙面完全严密，只要室内桌柜违背同一套透视方向，人眼立刻会把它认作硬贴上去的异物。";
    }
  }

  cards.forEach((card) => {
    let xray = false;
    let fixed = false;
    const btnX = card.querySelector('[data-act="xray"]');
    const btnF = card.querySelector('[data-act="fix"]');

    btnX.addEventListener("click", () => {
      xray = !xray;
      btnX.classList.toggle("is-active", xray);
      btnX.setAttribute("aria-pressed", String(xray));
      btnX.textContent = xray ? "关红线照妖镜" : "开红线照妖镜";
      drawCard(card, xray, fixed);
    });

    btnF.addEventListener("click", () => {
      fixed = !fixed;
      if (fixed) {
        xray = true;
        btnX.classList.add("is-active");
        btnX.setAttribute("aria-pressed", "true");
        btnX.textContent = "关红线照妖镜";
      }
      btnF.classList.toggle("is-active", fixed);
      btnF.setAttribute("aria-pressed", String(fixed));
      btnF.textContent = fixed ? "还原错态" : "一键校直";
      drawCard(card, xray, fixed);
    });

    drawCard(card, xray, fixed);
  });
}

/* =====================================================================
   05 节：从礼拜堂到走廊镜头（经核实的 7 处历史里程碑骨架图解）
   ===================================================================== */
const HISTORY_DATA = [
  {
    year: "c. 1415–1420",
    place: "佛罗伦萨圣乔凡尼洗礼堂",
    title: "布鲁内莱斯基的镜孔实验",
    latin: "Filippo Brunelleschi · Recorded by Antonio Manetti",
    body: "建筑师菲利波·布鲁内莱斯基站在佛罗伦萨大教堂门廊内，把圣乔凡尼洗礼堂画在约半臂见方的木板上，天际贴上抛光银箔映照真云，并在消失点位置钻出锥形小孔。观者从板背透过小孔举镜对照实景，轮廓严丝合缝，开启了数学化一点透视的先河。",
    vpNote: "小孔直穿洗礼堂正门中轴的观者眼高处，强迫单眼定点取景，把实景精确折叠到平面上。",
    vp: { x: 280, y: 175 },
    motif: "baptistery",
  },
  {
    year: "c. 1427",
    place: "佛罗伦萨新圣母大殿",
    title: "马萨乔《圣三位一体》",
    latin: "Masaccio · Holy Trinity (Santa Maria Novella)",
    body: "现存最早系统运用一点透视的大型湿壁画。马萨乔没有把消失点放在高耸的穹顶里，而是压低到壁画下方石阶边缘——正好与站在教堂地面抬头仰望的观众眼睛等高。",
    vpNote: "低视平线仰视（约画面下沿 24%），令上方藻井桶形拱顶仿佛真凿进了厚重的教堂砖墙。",
    vp: { x: 280, y: 244 },
    motif: "trinity",
  },
  {
    year: "1435 / 1436",
    place: "佛罗伦萨（献给布鲁内莱斯基）",
    title: "阿尔贝蒂《论绘画》提出「中心点」",
    latin: "Leon Battista Alberti · De pictura (1435) / Della pittura (1436)",
    body: "人文主义学者莱昂·巴蒂斯塔·阿尔贝蒂把布鲁内莱斯基的实验写成可复现的几何步法，将画框比作「一扇敞开的窗」，并把唯一消失点命名为「中心点（punto centrico）」，同时给出地砖网格的截距作图法。",
    vpNote: "把绘画从经验直觉转为可重复的尺规网格，确立了地砖进深递减的数学依据。",
    vp: { x: 280, y: 162 },
    motif: "alberti",
  },
  {
    year: "1481–1482",
    place: "梵蒂冈西斯廷礼拜堂",
    title: "佩鲁吉诺《交付钥匙》",
    latin: "Pietro Perugino · Christ Giving the Keys to St. Peter",
    body: "前景人物水平一字排开，中景铺开极度规整的大理石方格广场，所有纵深石缝毫无分叉地穿过人群空隙，直指背景八角形神殿敞开的正门。",
    vpNote: "消失点钉在广场中轴神殿大门中心，用极强纵深秩序把画面前后两层空间缝成一体。",
    vp: { x: 280, y: 138 },
    motif: "keys",
  },
  {
    year: "1495–1498",
    place: "米兰圣玛利亚感恩教堂餐室",
    title: "达·芬奇《最后的晚餐》",
    latin: "Leonardo da Vinci · The Last Supper",
    body: "据现存墙面考古与文献研究，达·芬奇直接在灰泥壁面中心钉入小铁钉拉绳定位——天花木梁、两侧挂毯与长桌透视的延长线，全部丝毫不差地汇聚在基督右太阳穴处。",
    vpNote: "当十二门徒左右激辩骚动时，全室的几何射线都死死锁住静坐中央的唯一主角，戏剧张力瞬间拉满。",
    vp: { x: 280, y: 150 },
    motif: "supper",
  },
  {
    year: "1508–1511",
    place: "梵蒂冈宫签字厅",
    title: "拉斐尔《雅典学院》",
    latin: "Raphael · The School of Athens",
    body: "拉斐尔借布拉曼特式宏伟拱廊搭建起哲学家的理想殿堂，层层退进的半圆桶形穹顶、壁柱与地砖将视线层层推向中央并肩步出的柏拉图与亚里士多德。",
    vpNote: "消失点落在两位先哲手势之间，既稳住了数十位人物的大群像，又确立了整幅壁画的思想中心。",
    vp: { x: 280, y: 166 },
    motif: "athens",
  },
  {
    year: "1968 / 1980",
    place: "现代电影构图语言",
    title: "库布里克的走廊一点透视",
    latin: "Stanley Kubrick · 2001: A Space Odyssey & The Shining",
    body: "从《2001太空漫游》冷峻对称的飞船舱道，到《闪灵》全景酒店里斯坦尼康贴地跟拍的无尽地毯长廊，斯坦利·库布里克用近乎严苛的正中一点透视，把对称秩序翻转成疏离、孤立与未知等待的心理压迫。",
    vpNote: "极工整的对称通道会封死观众向左右逃逸的视线，逼人不得不盯住通道尽头即将出现的东西。",
    vp: { x: 280, y: 170 },
    motif: "kubrick",
  },
];

export function initSec05() {
  const tabs = [...document.querySelectorAll(".hist-tab")];
  const svg = document.getElementById("s5-svg");
  const elYear = document.getElementById("h-year");
  const elPlace = document.getElementById("h-place");
  const elTitle = document.getElementById("h-title");
  const elLatin = document.getElementById("h-latin");
  const elBody = document.getElementById("h-body");
  const elVpNote = document.getElementById("h-vp-note");

  function render(idx) {
    const item = HISTORY_DATA[idx];
    elYear.textContent = item.year;
    elPlace.textContent = item.place;
    elTitle.textContent = item.title;
    elLatin.textContent = item.latin;
    elBody.textContent = item.body;
    elVpNote.textContent = item.vpNote;

    svg.innerHTML = "";
    const w = 560, h = 320;
    const vp = item.vp;
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#F2EBE2" }, svg);
    // 视平线
    el("line", { x1: 0, y1: vp.y, x2: w, y2: vp.y, stroke: "#B82E08", "stroke-width": 1.2, "stroke-dasharray": "5 5" }, svg);

    // 辐射射线底网
    for (const [cx, cy] of [[0, 0], [w, 0], [w, h], [0, h], [w * 0.25, 0], [w * 0.75, 0], [w * 0.25, h], [w * 0.75, h]]) {
      el("line", { x1: vp.x, y1: vp.y, x2: cx, y2: cy, stroke: "rgba(229, 70, 22, 0.34)", "stroke-width": 1.1, "stroke-dasharray": "4 4" }, svg);
    }

    // 依每件作品特征绘制克制的建筑骨架（纯几何线条，人物仅极简剪影，零五官）
    if (item.motif === "baptistery") {
      // 八角洗礼堂正面 + 两侧斜立面 + 镜孔环
      el("rect", { x: 210, y: 86, width: 140, height: 164, fill: "#FAF6F0", stroke: "#141413", "stroke-width": 2 }, svg);
      el("polygon", { points: "134,116 210,86 210,250 134,230", fill: "#E8DFD3", stroke: "#141413", "stroke-width": 1.6 }, svg);
      el("polygon", { points: "350,86 426,116 426,230 350,250", fill: "#E8DFD3", stroke: "#141413", "stroke-width": 1.6 }, svg);
      el("polygon", { points: "184,86 280,44 376,86", fill: "#141413" }, svg);
      el("rect", { x: 258, y: 175, width: 44, height: 75, fill: "#141413" }, svg);
      el("circle", { cx: vp.x, cy: vp.y, r: 22, fill: "none", stroke: "#141413", "stroke-width": 1.6, "stroke-dasharray": "3 3" }, svg);
    } else if (item.motif === "trinity") {
      // 桶形拱顶高立面 + 低视平线石阶
      el("path", { d: "M 130 278 L 130 102 A 150 92 0 0 1 430 102 L 430 278", fill: "#FAF6F0", stroke: "#141413", "stroke-width": 2.4 }, svg);
      for (const s of [0.82, 0.64, 0.48]) {
        const rx = 150 * s, ry = 92 * s;
        el("path", { d: `M ${280 - rx} ${102 + (1 - s) * 90} A ${rx} ${ry} 0 0 1 ${280 + rx} ${102 + (1 - s) * 90}`, fill: "none", stroke: "#141413", "stroke-width": 1.3 }, svg);
      }
      el("rect", { x: 96, y: 244, width: 368, height: 42, fill: "#DDD9D3", stroke: "#141413", "stroke-width": 1.8 }, svg);
    } else if (item.motif === "alberti") {
      // 阿尔贝蒂敞开之窗与网格地面
      el("rect", { x: 86, y: 34, width: 388, height: 252, fill: "none", stroke: "#141413", "stroke-width": 3 }, svg);
      for (let i = 0; i <= 6; i++) {
        const bx = 86 + (388 * i) / 6;
        el("line", { x1: bx, y1: 286, x2: vp.x, y2: vp.y, stroke: "#141413", "stroke-width": 1.2 }, svg);
      }
      for (const t of [0.16, 0.34, 0.56, 0.80]) {
        const y = vp.y + (286 - vp.y) * t;
        el("line", { x1: 86, y1: y, x2: 474, y2: y, stroke: "#141413", "stroke-width": 1.2 }, svg);
      }
    } else if (item.motif === "keys") {
      // 大理石方格广场 + 中央八角神殿
      for (let i = 0; i <= 8; i++) {
        el("line", { x1: i * 70, y1: h, x2: vp.x, y2: vp.y, stroke: "#4A453F", "stroke-width": 1.2 }, svg);
      }
      for (const y of [176, 198, 226, 264, 306]) {
        el("line", { x1: 0, y1: y, x2: w, y2: y, stroke: "#4A453F", "stroke-width": 1.1 }, svg);
      }
      el("rect", { x: 224, y: 66, width: 112, height: 96, fill: "#FAF6F0", stroke: "#141413", "stroke-width": 2 }, svg);
      el("path", { d: "M 232 66 Q 280 24 328 66 Z", fill: "#141413" }, svg);
      el("rect", { x: 264, y: 114, width: 32, height: 48, fill: "#E54616" }, svg);
    } else if (item.motif === "supper") {
      // 餐室天花木梁 + 两侧挂毯 + 中央长桌 + 三窗
      const bL = 160, bR = 400, bT = 92, bB = 224;
      el("rect", { x: bL, y: bT, width: bR - bL, height: bB - bT, fill: "#FAF6F0", stroke: "#141413", "stroke-width": 1.8 }, svg);
      for (const [x1, y1, x2, y2] of [[0, 0, bL, bT], [w, 0, bR, bT], [0, h, bL, bB], [w, h, bR, bB]]) {
        el("line", { x1, y1, x2, y2, stroke: "#141413", "stroke-width": 2.4 }, svg);
      }
      // 三扇后窗
      for (const [wx, ww] of [[182, 46], [248, 64], [332, 46]]) {
        el("rect", { x: wx, y: 116, width: ww, height: 74, fill: "#E8DFD3", stroke: "#141413", "stroke-width": 1.5 }, svg);
      }
      // 水平长桌
      el("rect", { x: 74, y: 218, width: 412, height: 52, fill: "#FAF6F0", stroke: "#141413", "stroke-width": 2.2 }, svg);
      // 中央静坐人物极简三角剪影（零五官）
      el("polygon", { points: "280,144 252,218 308,218", fill: "#141413" }, svg);
      el("circle", { cx: 280, cy: 146, r: 9, fill: "#141413" }, svg);
    } else if (item.motif === "athens") {
      // 三重层叠拱廊 + 中央双剪影
      for (const [rx, ry, cy] of [[240, 128, 178], [164, 90, 174], [96, 56, 170]]) {
        el("path", { d: `M ${280 - rx} ${cy + 90} L ${280 - rx} ${cy} A ${rx} ${ry} 0 0 1 ${280 + rx} ${cy} L ${280 + rx} ${cy + 90}`, fill: "none", stroke: "#141413", "stroke-width": 2.2 }, svg);
      }
      el("rect", { x: 80, y: 242, width: 400, height: 22, fill: "#DDD9D3", stroke: "#141413", "stroke-width": 1.5 }, svg);
      el("rect", { x: 256, y: 158, width: 16, height: 54, fill: "#141413" }, svg);
      el("rect", { x: 288, y: 158, width: 16, height: 54, fill: "#141413" }, svg);
    } else {
      // 库布里克深邃对称长廊
      const bL = 228, bR = 332, bT = 128, bB = 212;
      el("polygon", { points: `0,0 ${bL},${bT} ${bL},${bB} 0,${h}`, fill: "#E54616", opacity: 0.22 }, svg);
      el("polygon", { points: `${bR},${bT} ${w},0 ${w},${h} ${bR},${bB}`, fill: "#E54616", opacity: 0.22 }, svg);
      for (const s of [0.22, 0.44, 0.66, 0.84, 1.0]) {
        const x1 = bL * s, x2 = w - (w - bR) * s;
        const y1 = bT * s, y2 = h - (h - bB) * s;
        el("rect", { x: x1, y: y1, width: x2 - x1, height: y2 - y1, fill: "none", stroke: "#141413", "stroke-width": s === 1 ? 2.6 : 1.5 }, svg);
      }
    }

    // 主消失点醒目朱红标记
    el("circle", { cx: vp.x, cy: vp.y, r: 12, fill: "none", stroke: "#E54616", "stroke-width": 1.8 }, svg);
    el("circle", { cx: vp.x, cy: vp.y, r: 5.5, fill: "#E54616", stroke: "#FAF6F0", "stroke-width": 2 }, svg);
  }

  tabs.forEach((b, i) => b.addEventListener("click", () => {
    tabs.forEach((x, j) => {
      x.classList.toggle("is-active", j === i);
      x.setAttribute("aria-selected", String(j === i));
    });
    render(i);
  }));

  render(0);
}

/* =====================================================================
   06 节：设计任务选型决策矩阵
   ===================================================================== */
const DECISIONS = {
  tunnel: {
    yes: true,
    verdict: "强烈推荐 · 一点透视",
    html: "长廊天然拥有两组平行侧墙与顶底面，用一点透视把展览主题海报钉在消失点正中央，左右灯箱自然成为引导纵深的视线扶手，且海报文字正面平行画框不歪斜。",
  },
  corner: {
    yes: false,
    verdict: "建议换法 · 071 两点透视",
    html: "街角建筑的核心魅力在于相邻两条街道交汇的立面转角。硬用一点透视只能直怼其中一面墙，另一面会缩成窄缝；改用 <a class=\"inline-link\" href=\"https://layout.xiaoxiaodong.ai/071/play/\">071 两点透视</a> 才能把两翼街景与转角体积一起摊开。",
  },
  map: {
    yes: false,
    verdict: "建议换法 · 075 等距 / 076 轴测",
    html: "策略游戏全景图要求近处和远处的建筑同样清晰、格子等大可点击。一点透视会让屏幕上方单位急剧缩成噪点；改用 <a class=\"inline-link\" href=\"https://layout.xiaoxiaodong.ai/075/play/\">075 等距构图</a> 或 <a class=\"inline-link\" href=\"https://layout.xiaoxiaodong.ai/076/play/\">076 轴测构图</a> 才保得住等尺可读性。",
  },
  multi: {
    yes: false,
    verdict: "建议换法 · 065 前中后景 / 067 重叠空间",
    html: "多商品首屏需要让用户平权对比三四个主推单品，而一点透视自带极强的向心黑洞效应，会把画心之外的商品挤压成配角。改用 <a class=\"inline-link\" href=\"https://layout.xiaoxiaodong.ai/065/play/\">065 前中后景构图</a> 或 <a class=\"inline-link\" href=\"https://layout.xiaoxiaodong.ai/067/play/\">067 重叠空间构图</a> 分层展示更稳妥。",
  },
};

export function initSec06() {
  const btns = [...document.querySelectorAll(".dec-btn")];
  const out = document.getElementById("s6-out");
  const verdict = document.getElementById("s6-verdict");
  const reason = document.getElementById("s6-reason");

  function select(key) {
    const d = DECISIONS[key];
    out.classList.toggle("is-swap", !d.yes);
    verdict.classList.toggle("is-yes", d.yes);
    verdict.classList.toggle("is-swap", !d.yes);
    verdict.textContent = d.verdict;
    reason.innerHTML = d.html;
  }

  btns.forEach((b) => b.addEventListener("click", () => {
    btns.forEach((x) => {
      const a = x === b;
      x.classList.toggle("is-active", a);
      x.setAttribute("aria-selected", String(a));
    });
    select(b.dataset.dec);
  }));
}

/* =====================================================================
   07 节：四选一隐蔽单变量透视找错练习 + 原海报放大拖拽灯箱
   ===================================================================== */
const QUIZ_REASONS = {
  A: {
    ok: false,
    title: "选了方案 A：差在左侧壁挂画框上沿偏离了消失点",
    body: "看图中刚刚亮起的红色延长线：方案 A 的墙面、地砖和右展柜都严密收束进唯一消失点，但左墙画框的上沿纵深线偏高了 +6°，没有落回中心红点。正确方案是「方案 B」。",
  },
  B: {
    ok: true,
    title: "答对了！方案 B 是唯一严格成立的一点透视",
    body: "墙棱、左侧壁挂框、右侧展柜的每一条纵深线都毫无分叉地汇入同一消失点，正面横竖边保持水平垂直，且地砖横缝遵循近宽远密的真实 1/z 透视压缩。",
  },
  C: {
    ok: false,
    title: "选了方案 C：差在地砖横缝被画成了均匀等距",
    body: "方案 C 的四壁与展品方向全都对准了消失点，但仔细看地板：5 条横缝在竖直方向等宽平分，违背了针孔投影的近宽远密压缩律，地面像竖立的梯子。正确方案是「方案 B」。",
  },
  D: {
    ok: false,
    title: "选了方案 D：差在右侧独立展柜偏航违背正交方向",
    body: "方案 D 的走廊与地砖都无懈可击，但靠右摆放的展柜顶面棱线偏向了画布左侧另一个错交点（与走廊正交方向不一致），显得像从别的视角抠贴进来的。正确方案是「方案 B」。",
  },
};

export function initSec07() {
  const opts = [...document.querySelectorAll(".quiz-opt")];
  const fb = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("qf-title");
  const fbBody = document.getElementById("qf-body");
  const resetBtn = document.getElementById("btn-quiz-reset");

  function drawOption(letter, reveal) {
    const svg = document.getElementById(`quiz-svg-${letter}`);
    svg.innerHTML = "";
    const w = 280, h = 190;
    const vp = { x: 140, y: 92 };
    const bL = 94, bR = 186, bT = 58, bB = 124;

    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#FAF6F0" }, svg);
    // 左淡红壁 + 端墙
    el("polygon", { points: `0,0 ${bL},${bT} ${bL},${bB} 0,${h}`, fill: "#E54616", opacity: 0.16 }, svg);
    el("rect", { x: bL, y: bT, width: bR - bL, height: bB - bT, fill: "#F2EBE2", stroke: "#141413", "stroke-width": 1.3 }, svg);
    // 主廊棱
    for (const [x1, y1, x2, y2] of [[0, 0, bL, bT], [w, 0, bR, bT], [0, h, bL, bB], [w, h, bR, bB]]) {
      el("line", { x1, y1, x2, y2, stroke: "#141413", "stroke-width": 1.8 }, svg);
    }

    // 地砖纵线与横线（方案 C 故意等距！）
    for (const r of [0.33, 0.67]) {
      el("line", { x1: w * r, y1: h, x2: bL + (bR - bL) * r, y2: bB, stroke: "#7C7368", "stroke-width": 0.9 }, svg);
    }
    const rowTs = letter === "C"
      ? [0.20, 0.40, 0.60, 0.80]          // 破绽：屏幕等距！
      : [0.11, 0.27, 0.49, 0.76];         // 真实 1/z 近疏远密
    for (const t of rowTs) {
      const y = bB + (h - bB) * t;
      const xl = bL * (1 - t);
      const xr = bR + (w - bR) * t;
      el("line", {
        x1: xl, y1: y, x2: xr, y2: y,
        stroke: reveal && letter === "C" ? "#A81910" : "#7C7368",
        "stroke-width": reveal && letter === "C" ? 1.7 : 0.9,
      }, svg);
    }

    // 左侧壁挂画框（方案 A 上沿纵深线偏高脱靶！）
    const fNearX = 24;
    const fFarX = 64;
    const fTopNearY = 54;
    const fBotNearY = 132;
    const vpFrameTop = letter === "A" ? { x: vp.x, y: vp.y - 24 } : vp;
    const fTopFarY = fTopNearY + ((vpFrameTop.y - fTopNearY) * (fFarX - fNearX)) / (vpFrameTop.x - fNearX);
    const fBotFarY = fBotNearY + ((vp.y - fBotNearY) * (fFarX - fNearX)) / (vp.x - fNearX);
    el("polygon", {
      points: `${fNearX},${fTopNearY} ${fFarX},${fTopFarY} ${fFarX},${fBotFarY} ${fNearX},${fBotNearY}`,
      fill: "#E54616", stroke: "#141413", "stroke-width": 1.6,
    }, svg);

    // 右侧独立展柜（方案 D 顶面纵深方向偏航向左！）
    const cx = 196, cy = 132, cw = 42, ch = 32;
    const vpCab = letter === "D" ? { x: 68, y: vp.y } : vp;
    const k = 0.25;
    const cTL = { x: cx + (vpCab.x - cx) * k, y: cy + (vpCab.y - cy) * k };
    const cTR = { x: cx + cw + (vpCab.x - (cx + cw)) * k, y: cy + (vpCab.y - cy) * k };
    const cBL = { x: cx + (vpCab.x - cx) * k, y: cy + ch + (vpCab.y - (cy + ch)) * k };
    el("polygon", { points: `${cx},${cy} ${cTL.x},${cTL.y} ${cBL.x},${cBL.y} ${cx},${cy + ch}`, fill: "#CFC6BA", stroke: "#141413", "stroke-width": 1.3 }, svg);
    el("polygon", { points: `${cx},${cy} ${cx + cw},${cy} ${cTR.x},${cTR.y} ${cTL.x},${cTL.y}`, fill: "#DDD9D3", stroke: "#141413", "stroke-width": 1.3 }, svg);
    el("rect", { x: cx, y: cy, width: cw, height: ch, fill: "#141413" }, svg);

    // 揭晓检验线
    if (reveal) {
      el("line", { x1: 0, y1: vp.y, x2: w, y2: vp.y, stroke: "rgba(20, 107, 72, 0.45)", "stroke-width": 1, "stroke-dasharray": "4 3" }, svg);
      const colA = letter === "A" ? "#A81910" : "#146B48";
      el("line", { x1: fNearX, y1: fTopNearY, x2: vpFrameTop.x, y2: vpFrameTop.y, stroke: colA, "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
      const colD = letter === "D" ? "#A81910" : "#146B48";
      el("line", { x1: cx, y1: cy, x2: vpCab.x, y2: vpCab.y, stroke: colD, "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
      el("circle", { cx: vp.x, cy: vp.y, r: 4, fill: "#146B48" }, svg);
      if (letter === "A") el("circle", { cx: vpFrameTop.x, cy: vpFrameTop.y, r: 4, fill: "#A81910" }, svg);
      if (letter === "D") el("circle", { cx: vpCab.x, cy: vpCab.y, r: 4, fill: "#A81910" }, svg);
    }
  }

  function renderAll(reveal) {
    ["A", "B", "C", "D"].forEach((l) => drawOption(l, reveal));
  }

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.opt;
      const res = QUIZ_REASONS[pick];
      opts.forEach((o) => {
        o.classList.remove("is-correct", "is-wrong");
        if (o.dataset.opt === "B") o.classList.add("is-correct");
        else if (o === btn) o.classList.add("is-wrong");
      });
      fb.hidden = false;
      fb.classList.toggle("is-ok", res.ok);
      fb.classList.toggle("is-err", !res.ok);
      fbTitle.textContent = res.title;
      fbBody.textContent = res.body;
      resetBtn.hidden = false;
      renderAll(true);
    });
  });

  resetBtn.addEventListener("click", () => {
    opts.forEach((o) => o.classList.remove("is-correct", "is-wrong"));
    fb.hidden = true;
    resetBtn.hidden = true;
    renderAll(false);
  });

  renderAll(false);

  // ---- 原海报放大拖拽灯箱（海报只内联一次，从 #poster.src 复用） ----
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbScale = document.getElementById("lb-scale");
  const openBtn = document.getElementById("btn-open-poster");
  const posterImg = document.getElementById("poster");
  const closeBtn = document.getElementById("lb-close");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const lbReset = document.getElementById("lb-reset");

  let sc = 1, tx = 0, ty = 0;

  function applyLb() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
    lbScale.textContent = `${Math.round(sc * 100)}%`;
  }

  function openLb() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    sc = 1.15; tx = 0; ty = 0;
    applyLb();
    lb.hidden = false;
    closeBtn.focus();
  }

  function closeLb() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", openLb);
  closeBtn.addEventListener("click", closeLb);
  zoomIn.addEventListener("click", () => { sc = clamp(+(sc + 0.35).toFixed(2), 0.7, 3.0); applyLb(); });
  zoomOut.addEventListener("click", () => { sc = clamp(+(sc - 0.35).toFixed(2), 0.7, 3.0); applyLb(); });
  lbReset.addEventListener("click", () => { sc = 1; tx = 0; ty = 0; applyLb(); });

  lbStage.addEventListener("click", (e) => {
    if (e.target === lbStage) closeLb();
  });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    sc = clamp(+(sc + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2), 0.7, 3.0);
    applyLb();
  }, { passive: false });

  let drag = null;
  function startPan(cx, cy) { drag = { x: cx, y: cy, tx, ty }; }
  function movePan(cx, cy) {
    if (!drag) return;
    tx = drag.tx + (cx - drag.x);
    ty = drag.ty + (cy - drag.y);
    applyLb();
  }

  lbStage.addEventListener("mousedown", (e) => {
    if (e.target !== lbImg) return;
    e.preventDefault();
    startPan(e.clientX, e.clientY);
    const mv = (ev) => movePan(ev.clientX, ev.clientY);
    const up = () => { drag = null; window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  });

  lbStage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) startPan(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  lbStage.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && drag) {
      e.preventDefault();
      movePan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });
  lbStage.addEventListener("touchend", () => { drag = null; }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLb();
  });
}
