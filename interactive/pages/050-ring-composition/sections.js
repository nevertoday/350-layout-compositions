// 050 环形构图 · 正文 01–08 节全部独立互动模块（每节控件各不相同）
import { pixelRatio } from "../../lib/stage.js";
import { computeRingGeometry } from "./model.js";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function fitCanvas(canvas, w, h) {
  const dpr = pixelRatio(1.5);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* ==================== 01 四态场域对比器 ==================== */
export function mountSection01() {
  const canvas = document.getElementById("s1-canvas");
  const readout = document.getElementById("s1-readout");
  const fieldBtn = document.getElementById("s1-field-toggle");
  const tabs = [...document.querySelectorAll("[data-s1]")];
  let mode = "ring";
  let showField = true;

  const COPY = {
    scatter: {
      title: "① 散点无序（无闭合边界）",
      body: "相同的 10 枚图形随机散落时，眼睛没有共同区域可依托，只能在孤立元素之间来回跳读，黄色核心很难建立统治力（示意聚焦度：弱）。",
    },
    arc: {
      title: "② 半开弧线（方向引导强，但不锁场域）",
      body: "图形排成开放弧线后产生了流畅动势（这正是 049 弧形构图的专长），但右侧敞开没有闭环，视线滑过弧尾后会继续向外溢出（示意聚焦度：中）。",
    },
    disc: {
      title: "③ 满涂实心圆（缺呼吸缝与中空环带）",
      body: "整块黑圆把主体和周边全压在同一平面里，缺少中心与环带之间的透气隔层，层次发闷，更接近实心圆形容器（示意聚焦度：中高但发紧）。",
    },
    ring: {
      title: "④ 环形构图（核—缝—环三层清晰）",
      body: "闭合环带先划定共同区域，白色呼吸缝利落托出亮黄核心；视线沿外环游走一圈后自然被向心力收进圆心（示意聚焦度：强）。",
    },
  };

  const DOTS = [
    { x: -165, y: -92, r: 16, c: "#0D0D0A" },
    { x: -72,  y: -110, r: 10, c: "#49BA8A" },
    { x: 145,  y: -85, r: 18, c: "#0D0D0A" },
    { x: 185,  y: 20,  r: 9,  c: "#49BA8A" },
    { x: 120,  y: 105, r: 15, c: "#0D0D0A" },
    { x: -15,  y: 118, r: 8,  c: "#49BA8A" },
    { x: -138, y: 88,  r: 17, c: "#0D0D0A" },
    { x: -195, y: 12,  r: 10, c: "#49BA8A" },
    { x: 64,   y: -115, r: 7, c: "#0D0D0A" },
    { x: -92,  y: 42,  r: 7,  c: "#49BA8A" },
  ];

  function draw() {
    const W = 520, H = 330, cx = W / 2, cy = H / 2;
    const ctx = fitCanvas(canvas, W, H);
    ctx.fillStyle = "#F5F2EB";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy);

    if (mode === "scatter") {
      if (showField) {
        ctx.strokeStyle = "rgba(185,43,39,0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(-165, -92);
        ctx.lineTo(145, -85);
        ctx.lineTo(-138, 88);
        ctx.lineTo(185, 20);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(16, -8, 34, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#0D0D0A"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#0D0D0A"; ctx.font = '800 13px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("焦点?", 16, -8);
      for (const d of DOTS) {
        ctx.fillStyle = d.c;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
      }
    } else if (mode === "arc") {
      if (showField) {
        ctx.strokeStyle = "#176B4B";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 122, 118 * DEG, 262 * DEG);
        ctx.stroke();
        ctx.setLineDash([]);
        // 右侧漏气箭头
        ctx.strokeStyle = "#B92B27";
        ctx.beginPath(); ctx.moveTo(40, -108); ctx.lineTo(168, -118); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40, 108); ctx.lineTo(168, 118); ctx.stroke();
      }
      ctx.strokeStyle = "#0D0D0A";
      ctx.lineWidth = 36;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, 96, 122 * DEG, 250 * DEG);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (130 + i * 22) * DEG;
        ctx.fillStyle = i % 2 === 0 ? "#F5F2EB" : "#49BA8A";
        ctx.beginPath(); ctx.arc(Math.cos(a) * 96, Math.sin(a) * 96, 7 + (i % 3) * 3.5, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(10, 0, 40, 0, TAU); ctx.fill();
      ctx.fillStyle = "#0D0D0A"; ctx.font = '800 14px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("焦点", 10, 0);
    } else if (mode === "disc") {
      ctx.fillStyle = "#0D0D0A";
      ctx.beginPath(); ctx.arc(0, 0, 122, 0, TAU); ctx.fill();
      for (let i = 0; i < 10; i++) {
        const a = (i * 36 - 90) * DEG;
        const rr = 66 + (i % 2) * 26;
        ctx.fillStyle = i % 2 === 0 ? "#49BA8A" : "#F5F2EB";
        ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 11 + (i % 3) * 4, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill();
      ctx.fillStyle = "#0D0D0A"; ctx.font = '800 14px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("贴紧无缝", 0, 0);
      if (showField) {
        ctx.strokeStyle = "#FF6B63"; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(0, 0, 45, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      // 环形构图
      if (showField) {
        ctx.strokeStyle = "#176B4B";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.arc(0, 0, 134, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
        // 向心引力短矢
        for (let i = 0; i < 8; i++) {
          const a = (i * 45) * DEG;
          ctx.strokeStyle = "rgba(23, 107, 75, 0.55)";
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 144, Math.sin(a) * 144);
          ctx.lineTo(Math.cos(a) * 124, Math.sin(a) * 124);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#0D0D0A";
      ctx.beginPath();
      ctx.arc(0, 0, 120, 0, TAU, false);
      ctx.arc(0, 0, 62, TAU, 0, true);
      ctx.fill();
      // 环内层级元素
      const ringEls = [
        [-140, 92, 14, "#F5F2EB"], [-68, 96, 16, "#49BA8A"], [-14, 88, 9, "#F0ED04"],
        [45, 92, 14, "#F5F2EB"], [108, 90, 13, "#F5F2EB"], [168, 92, 11, "#49BA8A"],
        [-102, 82, 5, "#8CD7B5"], [18, 102, 5, "#F5F2EB"], [142, 78, 5, "#F0ED04"],
      ];
      for (const [deg, rr, rad, c] of ringEls) {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(Math.cos(deg * DEG) * rr, Math.sin(deg * DEG) * rr, rad, 0, TAU); ctx.fill();
      }
      // 白色呼吸缝
      ctx.fillStyle = "#F5F2EB";
      ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill();
      // 亮黄核心
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.fill();
      ctx.fillStyle = "#0D0D0A"; ctx.font = '900 15px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("焦点", 0, -4);
      ctx.font = '700 10px "IBM Plex Sans", sans-serif';
      ctx.fillText("FOCUS", 0, 14);
    }
    ctx.restore();

    readout.innerHTML = `<strong>${COPY[mode].title}</strong><p>${COPY[mode].body}</p>`;
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.s1;
      tabs.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      draw();
    });
  });

  fieldBtn.addEventListener("click", () => {
    showField = !showField;
    fieldBtn.classList.toggle("is-on", showField);
    fieldBtn.setAttribute("aria-pressed", String(showField));
    fieldBtn.textContent = showField ? "引力路径：开" : "引力路径：关";
    draw();
  });

  draw();
}

/* ==================== 02 三步建环剧场与反序对照 ==================== */
export function mountSection02() {
  const canvas = document.getElementById("s2-canvas");
  const readout = document.getElementById("s2-readout");
  const wrongBtn = document.getElementById("s2-wrong-order");
  const pills = [...document.querySelectorAll("[data-s2]")];
  let step = 1;
  let wrongOrder = false;

  const STEP_COPY = {
    1: {
      title: "第一步：先定中心（核直径约占外径 30%–48%，经验值）",
      body: "先把主标题、主产品或核心指标放进画面中心，量出它舒适可读所需的最小圆径。只有中心尺寸定死，外环的宽度才不会反客为主。",
    },
    2: {
      title: "第二步：留出呼吸缝（6%–14%），再沿外周搭环带",
      body: "沿着定好的中心核外扩一圈洁净呼吸缝，再铺开闭合的哑黑环带与外圈引导虚线，先让「核—缝—环」的骨架立起来。",
    },
    3: {
      title: "第三步：在环带内按近大远小铺排层次与节奏",
      body: "往黑环带里放入大、中、微三档元素：大圆定锚、中块衔接、点阵与留空透气，同时严控亮色不抢中心主焦。",
    },
    wrong: {
      title: "反序惨案：先画满厚黑环，最后硬塞主标题",
      body: "为了把装饰做满，外环越画越厚，等到最后放核心标题时中间只剩芝麻大的小洞——字被逼得换行撞边、呼吸缝全无，本末倒置。",
    },
  };

  function draw() {
    const W = 520, H = 330, cx = W / 2, cy = H / 2;
    const ctx = fitCanvas(canvas, W, H);
    ctx.fillStyle = "#F5F2EB";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy);

    if (wrongOrder) {
      // 反序：先画厚重花哨外环，把中间挤成小洞
      ctx.fillStyle = "#0D0D0A";
      ctx.beginPath();
      ctx.arc(0, 0, 134, 0, TAU, false);
      ctx.arc(0, 0, 34, TAU, 0, true);
      ctx.fill();
      for (let i = 0; i < 12; i++) {
        const a = (i * 30) * DEG;
        ctx.fillStyle = i % 3 === 0 ? "#F0ED04" : i % 2 === 0 ? "#49BA8A" : "#F5F2EB";
        ctx.beginPath(); ctx.arc(Math.cos(a) * 86, Math.sin(a) * 86, 20, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#B92B27"; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#0D0D0A"; ctx.font = '800 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("字塞不", 0, -6);
      ctx.fillText("下啦!", 0, 8);
      ctx.restore();
      readout.innerHTML = `<strong>${STEP_COPY.wrong.title}</strong><p>${STEP_COPY.wrong.body}</p>`;
      return;
    }

    // 标尺淡环参考
    ctx.strokeStyle = "rgba(13,13,10,0.22)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(0, 0, 126, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);

    if (step >= 2) {
      // 外圈薄荷虚线
      ctx.strokeStyle = "#49BA8A";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(0, 0, 138, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      // 哑黑环带
      ctx.fillStyle = step === 2 ? "rgba(13, 13, 10, 0.85)" : "#0D0D0A";
      ctx.beginPath();
      ctx.arc(0, 0, 124, 0, TAU, false);
      ctx.arc(0, 0, 68, TAU, 0, true);
      ctx.fill();
      // 呼吸缝标注
      ctx.strokeStyle = "#176B4B";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(54, 0); ctx.lineTo(68, 0); ctx.stroke();
      ctx.fillStyle = "#176B4B"; ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText("呼吸缝 11%", 132, -88);
    }

    if (step === 3) {
      const els = [
        [-144, 96, 15, "#F5F2EB"], [-62, 98, 17, "#49BA8A"], [36, 94, 15, "#F5F2EB"],
        [114, 95, 13, "#F5F2EB"], [170, 96, 12, "#49BA8A"], [-14, 94, 8, "#F0ED04"],
        [-106, 86, 5, "#8CD7B5"], [72, 104, 5, "#F0ED04"], [146, 82, 5, "#F5F2EB"],
      ];
      for (const [deg, rr, rad, c] of els) {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(Math.cos(deg * DEG) * rr, Math.sin(deg * DEG) * rr, rad, 0, TAU); ctx.fill();
      }
    }

    // 第一步始终有清晰中心核
    ctx.fillStyle = "#F0ED04";
    ctx.beginPath(); ctx.arc(0, 0, 54, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#0D0D0A"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#0D0D0A";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = '900 17px "Noto Sans SC", sans-serif';
    ctx.fillText("中心核心", 0, -6);
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText("CORE 43%", 0, 14);
    ctx.restore();

    readout.innerHTML = `<strong>${STEP_COPY[step].title}</strong><p>${STEP_COPY[step].body}</p>`;
  }

  pills.forEach((p) => {
    p.addEventListener("click", () => {
      wrongOrder = false;
      wrongBtn.classList.remove("is-on");
      wrongBtn.setAttribute("aria-pressed", "false");
      step = Number(p.dataset.s2);
      pills.forEach((b) => {
        const a = b === p;
        b.classList.toggle("is-active", a);
        b.setAttribute("aria-pressed", String(a));
      });
      draw();
    });
  });

  wrongBtn.addEventListener("click", () => {
    wrongOrder = !wrongOrder;
    wrongBtn.classList.toggle("is-on", wrongOrder);
    wrongBtn.setAttribute("aria-pressed", String(wrongOrder));
    draw();
  });

  draw();
}

/* ==================== 03 暗室：12 扇区直点环形音序器 ==================== */
export function mountSection03() {
  const canvas = document.getElementById("s3-canvas");
  const statusEl = document.getElementById("s3-status");
  const headEl = document.getElementById("s3-headline");
  const descEl = document.getElementById("s3-desc");
  const shiftEl = document.getElementById("s3-shift");
  const spreadEl = document.getElementById("s3-spread");
  const filledEl = document.getElementById("s3-filled");
  const rivalsEl = document.getElementById("s3-rivals");

  // 0 空, 1 远景微点, 2 中景薄荷块, 3 前景大白圆, 4 抢戏黄块
  let slots = [3, 1, 2, 0, 3, 1, 2, 0, 3, 1, 2, 0];
  const WEIGHTS = [0, 0.35, 1.0, 2.2, 3.0];
  const RADII = [0, 6, 13, 21, 24];

  function evaluate() {
    let wx = 0, wy = 0, wSum = 0;
    const activeR = [];
    let rivals = 0;
    let filled = 0;
    slots.forEach((lvl, i) => {
      if (lvl === 0) return;
      filled++;
      if (lvl === 4) rivals++;
      activeR.push(RADII[lvl]);
      const a = (i * 30 - 90) * DEG;
      const w = WEIGHTS[lvl];
      wx += Math.cos(a) * w;
      wy += Math.sin(a) * w;
      wSum += w;
    });
    const shift = wSum ? Math.round((Math.hypot(wx, wy) / wSum) * 100) : 0;
    const minR = activeR.length ? Math.min(...activeR) : 1;
    const maxR = activeR.length ? Math.max(...activeR) : 1;
    const spread = +(maxR / Math.max(1, minR)).toFixed(1);

    shiftEl.textContent = `${shift}%`;
    spreadEl.textContent = `${spread.toFixed(1)}×`;
    filledEl.textContent = `${filled} / 12`;
    rivalsEl.textContent = `${rivals} 格`;

    let bad = false, label = "均衡有节奏", title = "", body = "";
    if (rivals > 0) {
      bad = true;
      label = "亮黄抢戏";
      title = `环带里混入了 ${rivals} 格亮黄大块，中心焦点被分权`;
      body = "环上出现与中心核心同色同亮的大块后，视线不断偏离圆心。把黄色扇区再点一次清回空槽或降为薄荷中块。";
    } else if (filled < 4) {
      bad = true;
      label = "环带过空";
      title = `只有 ${filled} 格有元素，环绕场域撑不起来`;
      body = "空白扇区过多会让圆环断成零星孤点，至少保留 6–10 格错落排布。";
    } else if (shift > 28) {
      bad = true;
      label = `重心倾倒 ${shift}%`;
      title = `重块扎堆在同一侧（偏移 ${shift}%），圆环往一边翻倒`;
      body = "环形构图的稳定感依赖对称或三角配重。在对角方位补上一两枚前景大白圆，就能立刻拉回平衡。";
    } else if (spread < 1.8) {
      bad = true;
      label = `等大机械 ${spread.toFixed(1)}×`;
      title = `所有扇区尺寸雷同（极差仅 ${spread.toFixed(1)}×），退化成死板齿轮`;
      body = "没有大小差就没有景深与韵律。点选几格切出前景大圆、远景微点与留空，层次立刻活过来。";
    } else if (filled === 12) {
      bad = true;
      label = "塞满缺呼吸";
      title = "12 个扇区全塞满，环带没有喘气留白";
      body = "腾出 2–4 个空槽，让大圆与中块之间留出黑底呼吸节奏。";
    } else {
      title = "大圆压轴、中块衔接、微点透气，重心稳在圆心";
      body = `当前 ${filled} 格有效占槽、尺度极差 ${spread.toFixed(1)}×、重心偏移仅 ${shift}%，既有近大远小的节奏变化，又稳稳托住中央焦点。`;
    }

    statusEl.textContent = label;
    statusEl.classList.toggle("is-bad", bad);
    headEl.textContent = title;
    descEl.textContent = body;
    return { shift, wx: wSum ? wx / wSum : 0, wy: wSum ? wy / wSum : 0 };
  }

  function draw() {
    const S = 440, cx = S / 2, cy = S / 2;
    const ctx = fitCanvas(canvas, S, S);
    const { wx, wy } = evaluate();

    ctx.fillStyle = "#111511";
    ctx.fillRect(0, 0, S, S);
    ctx.save();
    ctx.translate(cx, cy);

    // 12 扇区外环槽位底
    const rIn = 90, rOut = 188, rMid = (rIn + rOut) / 2;
    for (let i = 0; i < 12; i++) {
      const a0 = (i * 30 - 105) * DEG;
      const a1 = a0 + 30 * DEG;
      ctx.beginPath();
      ctx.arc(0, 0, rOut, a0, a1);
      ctx.arc(0, 0, rIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = slots[i] === 4 ? "rgba(255,120,112,0.16)" : "rgba(255,255,255,0.03)";
      ctx.fill();
      ctx.strokeStyle = "#2E372D";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const am = (i * 30 - 90) * DEG;
      const px = Math.cos(am) * rMid;
      const py = Math.sin(am) * rMid;
      const lvl = slots[i];

      if (lvl === 0) {
        ctx.strokeStyle = "#485447";
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      } else if (lvl === 1) {
        ctx.fillStyle = "#8AD7B4";
        ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
      } else if (lvl === 2) {
        ctx.fillStyle = "#49BA8A";
        ctx.fillRect(px - 11, py - 11, 22, 22);
      } else if (lvl === 3) {
        ctx.fillStyle = "#F5F2EB";
        ctx.beginPath(); ctx.arc(px, py, 21, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = "#F0ED04";
        ctx.beginPath(); ctx.arc(px, py, 24, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#FF7870";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, py, 28, 0, TAU); ctx.stroke();
      }
    }

    // 呼吸缝与亮黄核心
    ctx.strokeStyle = "#2F372E";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 74, 0, TAU); ctx.stroke();
    ctx.fillStyle = "#F0ED04";
    ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill();
    ctx.fillStyle = "#0D0D0A";
    ctx.font = '900 18px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("焦点", 0, -4);
    ctx.font = '700 10px "IBM Plex Sans", sans-serif';
    ctx.fillText("CLICK SECTORS", 0, 15);

    // 视觉重心指示点
    const gx = wx * 50, gy = wy * 50;
    ctx.strokeStyle = "#FF7870";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(gx, gy); ctx.stroke();
    ctx.fillStyle = "#0D0D0A";
    ctx.beginPath(); ctx.arc(gx, gy, 4.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#F0ED04"; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.restore();
  }

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 440 - 220;
    const y = ((e.clientY - rect.top) / rect.height) * 440 - 220;
    const d = Math.hypot(x, y);
    if (d < 78 || d > 205) return;
    let deg = Math.atan2(y, x) / DEG + 105;
    deg = ((deg % 360) + 360) % 360;
    const idx = Math.floor(deg / 30) % 12;
    slots[idx] = (slots[idx] + 1) % 5;
    draw();
  });

  document.getElementById("s3-preset-rhythm").addEventListener("click", () => {
    slots = [3, 1, 2, 0, 3, 1, 2, 0, 3, 1, 2, 0];
    draw();
  });
  document.getElementById("s3-preset-gear").addEventListener("click", () => {
    slots = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    draw();
  });
  document.getElementById("s3-preset-tilt").addEventListener("click", () => {
    slots = [3, 3, 4, 3, 2, 0, 0, 0, 0, 0, 1, 0];
    draw();
  });

  draw();
}

/* ==================== 04 四大应用场景：可拖动 Before/After 幕布 ==================== */
export function mountSection04() {
  const canvas = document.getElementById("s4-canvas");
  const range = document.getElementById("s4-range");
  const splitRead = document.getElementById("s4-split-read");
  const tabs = [...document.querySelectorAll("[data-arena]")];
  const badgeEl = document.getElementById("s4-badge");
  const titleEl = document.getElementById("s4-title");
  const bodyEl = document.getElementById("s4-body");
  const listEl = document.getElementById("s4-list");

  let arena = "poster";
  let split = 0.52;

  const ARENAS = {
    poster: {
      badge: "海报设计 · POSTER",
      title: "主视觉坐镇圆心，外环承接日期与氛围图形",
      body: "原海报左下第 1 张示例把星球主视觉放在正中，外围由几道细轨道环与错落星点围合。比起从上到下平排标题和配图，环形让观者在远距离就能先抓住唯一视觉锚点。",
      items: [
        "核定主体：星球或核心图形占圆心约 38%，四周留清透暗底呼吸圈。",
        "环带控权：轨道线细于主轮廓、小图标低饱和，不和主视觉抢光。",
        "文字避撞：辅助日期与地点沿外环停靠或置顶底空白，不切穿中心。",
      ],
    },
    product: {
      badge: "产品展示 · PRODUCT",
      title: "核心产品稳居中心，卖点标注沿外环放射排开",
      body: "原海报左下第 2 张腕表示例把表盘定在圆心，四个特性徽标沿细虚线环均匀停靠。相比把参数塞成一长串项目符号，环形结构能同时让眼睛看清产品实体与卖点归属。",
      items: [
        "主体净空：产品外轮廓与标注环之间保留清晰呼吸带，避免引线压表壳。",
        "卖点精简：环上标注控制在 3–5 个关键点，超过 6 个立刻显拥挤。",
        "主次反差：产品保持高对比质感，外环提示图标用单色薄荷或炭墨收敛。",
      ],
    },
    ui: {
      badge: "界面设计 · INTERFACE",
      title: "72% 核心指标居中直读，圆环宽度只传达完成度",
      body: "原海报左下第 3 张界面示例把大字号 72% 放在暗底圆环中央，薄荷渐变弧直观标出完成进度。相比把指标埋进平铺卡片列表，环形仪表能让用户半秒内判读「还差多少闭环」。",
      items: [
        "数字优先：中心大数字与圆环内沿保持足够边距，绝不让文字顶到弧边。",
        "语义克制：环形进度只给 1–3 项核心目标使用，多项明细仍归表格。",
        "明暗清晰：已完成弧段高饱和、未完成底轨低调收暗，闭合缺口一目了然。",
      ],
    },
    photo: {
      badge: "摄影构图 · PHOTOGRAPHY",
      title: "借拱门、圆窗或前景暗影围出天然环框",
      body: "原海报左下第 4 张雪山示例用干净圆窗收住冷蓝天空与日照主峰。在实拍中，圆形门洞、隧道口、树冠缝隙都能充当天然环带，把杂乱环境挡在画外、把远景主体托到眼前。",
      items: [
        "暗框托亮：前景环框压暗并轻微虚化，中心主峰保持锐利与高光。",
        "留出完整圆弧：尽量保留 300° 以上连续框缘，不要把环顶切平。",
        "避免居中呆板：主峰峰顶可略微偏离正中 5%–8%，保留自然呼吸感。",
      ],
    },
  };

  function drawScene(ctx, W, H, ringed) {
    const cx = W / 2, cy = H / 2;
    if (arena === "poster") {
      ctx.fillStyle = ringed ? "#0E120F" : "#1C211D";
      ctx.fillRect(0, 0, W, H);
      if (!ringed) {
        // 平铺发散
        ctx.fillStyle = "#5B9E7F";
        ctx.beginPath(); ctx.arc(105, 140, 42, 0, TAU); ctx.fill();
        ctx.fillStyle = "#F5F2EB"; ctx.font = '800 19px "Noto Sans SC", sans-serif';
        ctx.fillText("宇宙视觉艺术展", 168, 120);
        ctx.fillStyle = "#B6BCB1"; ctx.font = '500 12.5px "Noto Sans SC", sans-serif';
        ctx.fillText("2026.11 / 多媒体空间展", 168, 148);
        ctx.fillText("图形与文字各自孤立", 168, 174);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? "#F0ED04" : "#49BA8A";
          ctx.beginPath(); ctx.arc(85 + i * 90, 275, 11, 0, TAU); ctx.fill();
        }
      } else {
        ctx.strokeStyle = "rgba(102,212,163,0.45)";
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, 134, 0, TAU); ctx.stroke();
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, 102, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
        for (const [deg, rr, sz, col] of [[-140, 118, 9, "#F5F2EB"], [-45, 122, 11, "#49BA8A"], [35, 116, 7, "#F0ED04"], [138, 120, 10, "#8AD7B4"]]) {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(cx + Math.cos(deg * DEG) * rr, cy + Math.sin(deg * DEG) * rr, sz, 0, TAU); ctx.fill();
        }
        const g = ctx.createRadialGradient(cx - 16, cy - 16, 8, cx, cy, 58);
        g.addColorStop(0, "#9CE4C2"); g.addColorStop(0.6, "#3C9C74"); g.addColorStop(1, "#163A2C");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, 56, 0, TAU); ctx.fill();
        ctx.fillStyle = "#F5F2EB"; ctx.font = '700 12px "IBM Plex Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("ORBIT EXHIBITION · 2026", cx, 32);
        ctx.textAlign = "left";
      }
    } else if (arena === "product") {
      ctx.fillStyle = ringed ? "#EFECE4" : "#E5E2DA";
      ctx.fillRect(0, 0, W, H);
      if (!ringed) {
        ctx.fillStyle = "#181B18";
        ctx.fillRect(92, 70, 34, 220);
        ctx.beginPath(); ctx.arc(109, 180, 42, 0, TAU); ctx.fill();
        ctx.fillStyle = "#0D0D0A"; ctx.font = '700 15px "Noto Sans SC", sans-serif';
        ["• 蓝宝石防刮镜面", "• 72 小时自动上链机芯", "• 50 米日常防水结构", "• 轻量化钛合金表壳"].forEach((t, i) => {
          ctx.fillText(t, 205, 120 + i * 42);
        });
      } else {
        ctx.strokeStyle = "#8C9C92"; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, 124, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "#181B18";
        ctx.fillRect(cx - 18, cy - 92, 36, 184);
        ctx.beginPath(); ctx.arc(cx, cy, 46, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#49BA8A"; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = "#F0ED04"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 20, cy - 12); ctx.moveTo(cx, cy); ctx.lineTo(cx - 12, cy - 18); ctx.stroke();
        const tags = [[-145, "镜面"], [-35, "机芯"], [35, "防水"], [145, "钛壳"]];
        for (const [deg, txt] of tags) {
          const tx = cx + Math.cos(deg * DEG) * 124;
          const ty = cy + Math.sin(deg * DEG) * 124;
          ctx.fillStyle = "#0D0D0A";
          ctx.beginPath(); ctx.arc(tx, ty, 20, 0, TAU); ctx.fill();
          ctx.fillStyle = "#F0ED04"; ctx.font = '700 11px "Noto Sans SC", sans-serif';
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(txt, tx, ty);
        }
        ctx.textAlign = "left";
      }
    } else if (arena === "ui") {
      ctx.fillStyle = "#111511";
      ctx.fillRect(0, 0, W, H);
      if (!ringed) {
        ctx.fillStyle = "#222923";
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(48, 56 + i * 64, W - 96, 48);
          ctx.fillStyle = "#B6BCB1"; ctx.font = '600 13px "Noto Sans SC", sans-serif';
          ctx.fillText(["本周目标完成率", "活跃步数达成", "专注时段统计", "睡眠达标比例"][i], 68, 85 + i * 64);
          ctx.fillStyle = "#F0ED04"; ctx.font = '700 16px "JetBrains Mono", monospace';
          ctx.fillText(["72%", "64%", "81%", "78%"][i], W - 128, 85 + i * 64);
          ctx.fillStyle = "#222923";
        }
      } else {
        ctx.strokeStyle = "#253027"; ctx.lineWidth = 26;
        ctx.beginPath(); ctx.arc(cx, cy, 108, 0, TAU); ctx.stroke();
        ctx.strokeStyle = "#49BA8A"; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(cx, cy, 108, -Math.PI / 2, -Math.PI / 2 + TAU * 0.72); ctx.stroke();
        ctx.fillStyle = "#F0ED04"; ctx.font = '700 48px "JetBrains Mono", monospace';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("72%", cx, cy - 6);
        ctx.fillStyle = "#B6BCB1"; ctx.font = '600 12px "IBM Plex Sans", sans-serif';
        ctx.fillText("WEEKLY TARGET", cx, cy + 32);
        ctx.textAlign = "left";
      }
    } else {
      // 摄影构图
      ctx.fillStyle = "#EAE6DC";
      ctx.fillRect(0, 0, W, H);
      const drawMountains = () => {
        const grd = ctx.createLinearGradient(0, 20, 0, H - 20);
        grd.addColorStop(0, "#62869C"); grd.addColorStop(0.56, "#DCE5E1"); grd.addColorStop(1, "#E5C18A");
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#2B3C44";
        ctx.beginPath();
        ctx.moveTo(0, H); ctx.lineTo(130, 175); ctx.lineTo(cx, 92); ctx.lineTo(485, 195); ctx.lineTo(W, 165); ctx.lineTo(W, H);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#F5F2EB";
        ctx.beginPath(); ctx.moveTo(cx, 92); ctx.lineTo(cx + 58, 165); ctx.lineTo(cx + 8, 192); ctx.lineTo(cx - 28, 145); ctx.closePath(); ctx.fill();
      };
      if (!ringed) {
        drawMountains();
        // 四角杂乱电线杆/路牌干扰
        ctx.fillStyle = "#181B18";
        ctx.fillRect(38, 120, 12, 240);
        ctx.fillRect(W - 58, 130, 14, 230);
      } else {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, 132, 0, TAU); ctx.clip();
        drawMountains();
        ctx.restore();
        // 天然前景暗色圆洞框
        ctx.fillStyle = "#141816";
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.arc(cx, cy, 128, 0, TAU, true);
        ctx.fill("evenodd");
      }
    }
  }

  function draw() {
    const W = 640, H = 360;
    const ctx = fitCanvas(canvas, W, H);
    const cutX = Math.round(W * split);

    // 左半：未用环形
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, cutX, H); ctx.clip();
    drawScene(ctx, W, H, false);
    ctx.restore();

    // 右半：环形构图
    ctx.save();
    ctx.beginPath(); ctx.rect(cutX, 0, W - cutX, H); ctx.clip();
    drawScene(ctx, W, H, true);
    ctx.restore();

    // 分割幕布轴线与圆把手
    ctx.strokeStyle = "#F0ED04";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cutX, 0); ctx.lineTo(cutX, H); ctx.stroke();
    ctx.fillStyle = "#0D0D0A";
    ctx.beginPath(); ctx.arc(cutX, H / 2, 16, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#F0ED04"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "#F0ED04"; ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("↔", cutX, H / 2);

    splitRead.textContent = `对比幕布 ${Math.round(split * 100)}%`;
  }

  function updateNotes() {
    const a = ARENAS[arena];
    badgeEl.textContent = a.badge;
    titleEl.textContent = a.title;
    bodyEl.textContent = a.body;
    listEl.innerHTML = a.items.map((item) => {
      const [k, v] = item.split("：");
      return `<li><strong>${k}：</strong>${v}</li>`;
    }).join("");
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      arena = btn.dataset.arena;
      tabs.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      updateNotes();
      draw();
    });
  });

  range.addEventListener("input", () => {
    split = Number(range.value) / 100;
    draw();
  });

  let dragging = false;
  function setFromClientX(clientX) {
    const rect = canvas.getBoundingClientRect();
    split = Math.max(0.08, Math.min(0.92, (clientX - rect.left) / rect.width));
    range.value = String(Math.round(split * 100));
    draw();
  }
  canvas.addEventListener("pointerdown", (e) => { dragging = true; setFromClientX(e.clientX); try { canvas.setPointerCapture(e.pointerId); } catch {} });
  canvas.addEventListener("pointermove", (e) => { if (dragging) setFromClientX(e.clientX); });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  updateNotes();
  draw();
}

/* ==================== 05 历史时期几何力线叠印台 ==================== */
export function mountSection05() {
  const canvas = document.getElementById("s5-canvas");
  const nameEl = document.getElementById("s5-era-name");
  const capEl = document.getElementById("s5-caption");
  const overlayBtn = document.getElementById("s5-overlay-btn");
  const items = [...document.querySelectorAll("[data-era]")];

  let era = "rose";
  let showOverlay = true;

  const ERAS = {
    rose: {
      name: "沙特尔玫瑰窗（c. 1215–1235）· 十二瓣光核结构",
      cap: "外圈十二组辐射花窗像一堵发光的环形围墙，把大教堂高处的视线直接拽向最中心的主圆像；结构力线显示，800 年前的石雕窗格就已经遵循「核—缝—环」的层级秩序。",
    },
    tondo: {
      name: "拉斐尔《椅中圣母》（c. 1513–1514）· 圆形画环抱结构",
      cap: "直径 71 cm 的圆形木板内，人物肩背、头巾曲线与椅柱顺着画框内缘层层环抱，没有任何僵硬直角打断圆周，视线自然收回到圆心相依的母子。",
    },
    gestalt: {
      name: "韦特海默（1923）与帕尔默（1992）· 闭合与共同区域",
      cap: "帕尔默在 1992 年证明：即便两颗点物理上彼此很近，只要其中一颗被闭合边界圈进共同区域，人眼仍会优先把「圈内」认作一个独立阵营。",
    },
    arnheim: {
      name: "阿恩海姆《中心的力量》（1982）· 中心力场系统",
      cap: "阿恩海姆指出，矩形画框带来水平与垂直的笛卡尔骨架，而环形构图在其内部叠入向心引力系统——双系统交锋时，中心核会成为全画能量最密集的枢纽。",
    },
    rings: {
      name: "现代数据与健身圆环（2015–至今）· 闭环进度语言",
      cap: "当环形带用于表达完成度，人眼通过「距离闭合还差多少缺口」即可毫秒级判读进度。苹果人机界面指南提醒：这类圆环应专属于真实进度，切勿滥作纯装饰。",
    },
  };

  function draw() {
    const W = 500, H = 360, cx = W / 2, cy = H / 2;
    const ctx = fitCanvas(canvas, W, H);
    ctx.fillStyle = "#F5F2EB";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy);

    if (era === "rose") {
      ctx.fillStyle = "#161B1A";
      ctx.beginPath(); ctx.arc(0, 0, 134, 0, TAU); ctx.fill();
      for (let i = 0; i < 12; i++) {
        const a = (i * 30) * DEG;
        ctx.fillStyle = i % 2 === 0 ? "#49BA8A" : "#356B8C";
        ctx.beginPath(); ctx.arc(Math.cos(a) * 94, Math.sin(a) * 94, 21, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#0D0D0A"; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#0D0D0A"; ctx.lineWidth = 4; ctx.stroke();
    } else if (era === "tondo") {
      // 抽象无五官剪影圆框环抱示意
      ctx.fillStyle = "#E6DDD0";
      ctx.beginPath(); ctx.arc(0, 0, 134, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#0D0D0A"; ctx.lineWidth = 10; ctx.stroke();
      // 顺环弧线剪影（无五官）
      ctx.fillStyle = "#2A4740";
      ctx.beginPath(); ctx.arc(-18, 22, 74, -1.8, 1.3); ctx.fill();
      ctx.fillStyle = "#C66343";
      ctx.beginPath(); ctx.arc(24, 18, 62, 1.2, 4.4); ctx.fill();
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(0, -14, 34, 0, TAU); ctx.fill();
    } else if (era === "gestalt") {
      // 帕尔默共同区域示意：内圈点即便距外点更近仍被归为圈内一组
      ctx.fillStyle = "#0D0D0A";
      ctx.beginPath();
      ctx.arc(0, 0, 128, 0, TAU, false);
      ctx.arc(0, 0, 82, TAU, 0, true);
      ctx.fill();
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(0, 0, 52, 0, TAU); ctx.fill();
      for (const [x, y, c] of [[-18, -10, "#0D0D0A"], [18, -10, "#0D0D0A"], [0, 18, "#0D0D0A"], [-152, 0, "#49BA8A"], [152, 0, "#49BA8A"]]) {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
      }
    } else if (era === "arnheim") {
      // 笛卡尔网格 vs 中心力场
      ctx.strokeStyle = "rgba(13,13,10,0.2)";
      ctx.lineWidth = 1.2;
      for (let v = -140; v <= 140; v += 40) {
        ctx.beginPath(); ctx.moveTo(v, -140); ctx.lineTo(v, 140); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-180, v); ctx.lineTo(180, v); ctx.stroke();
      }
      ctx.fillStyle = "#0D0D0A";
      ctx.beginPath();
      ctx.arc(0, 0, 118, 0, TAU, false);
      ctx.arc(0, 0, 74, TAU, 0, true);
      ctx.fill();
      ctx.fillStyle = "#F0ED04";
      ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.fill();
    } else {
      // 现代数据进度环
      ctx.fillStyle = "#0E100D";
      ctx.beginPath(); ctx.roundRect(-142, -142, 284, 284, 34); ctx.fill();
      const rings = [
        [108, 0.84, "#49BA8A"],
        [82, 0.68, "#F0ED04"],
        [56, 0.92, "#8AD7B4"],
      ];
      for (const [rr, pct, col] of rings) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 16;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
        ctx.strokeStyle = col;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(0, 0, rr, -Math.PI / 2, -Math.PI / 2 + TAU * pct); ctx.stroke();
      }
    }

    if (showOverlay) {
      ctx.strokeStyle = "#176B4B";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(0, 0, 142, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 56, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 8; i++) {
        const a = (i * 45) * DEG;
        ctx.strokeStyle = "#B92B27";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 142, Math.sin(a) * 142);
        ctx.lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
        ctx.stroke();
      }
    }

    ctx.restore();
    nameEl.textContent = ERAS[era].name;
    capEl.textContent = ERAS[era].cap;
  }

  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      era = btn.dataset.era;
      items.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      draw();
    });
  });

  overlayBtn.addEventListener("click", () => {
    showOverlay = !showOverlay;
    overlayBtn.classList.toggle("is-on", showOverlay);
    overlayBtn.setAttribute("aria-pressed", String(showOverlay));
    overlayBtn.textContent = showOverlay ? "结构力线：开" : "结构力线：关";
    draw();
  });

  draw();
}

/* ==================== 06 什么时候别用环形：反例可视化 ==================== */
export function mountSection06() {
  const cards = [...document.querySelectorAll("[data-anti]")];
  const canvas = document.getElementById("s6-canvas");
  const titleEl = document.getElementById("s6-title");
  const descEl = document.getElementById("s6-desc");
  let active = "essay";

  const COPY = {
    essay: {
      title: "硬套环形排长文：行宽剧烈波动，阅读回行频繁迷路",
      desc: "圆内顶部和底部只能容下 3–4 个字，中段又突然拉长到 14 个字；换成清晰左对齐矩形栏后，阅读速度和舒适度立刻恢复。",
    },
    table: {
      title: "硬套环形做多指标对比：弧长难比大小，远不如同基线条形图",
      desc: "当 10 项数据挤成同心环或饼环时，人眼难以精准判断外环 68% 与内环 71% 谁大；拉直成同起点横条，高下一眼立判。",
    },
    multi: {
      title: "硬套环形排双主角：中心王座只能坐一人，另一个被迫降级",
      desc: "两项同等重要的方案硬塞进圆心会互挤，放一个进外环又会被当成配角；左右分屏或四象限才能给足平等地位。",
    },
    narrow: {
      title: "硬套环形进 5:1 细长条：不是缩成小钮扣，就是上下被削平",
      desc: "环形天然是 1:1 比例，塞进极扁横幅时上下弧顶被画框切平，闭合感荡然无存；顺着长幅走引导线或弧线才自然。",
    },
  };

  function draw() {
    const W = 240, H = 120;
    const ctx = fitCanvas(canvas, W, H);
    ctx.fillStyle = "#F5F2EB";
    ctx.fillRect(0, 0, W, H);

    // 左半：错误硬套（红框）；右半：合理替代（绿框）
    ctx.strokeStyle = "#B92B27"; ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 10, 102, 100);
    ctx.strokeStyle = "#176B4B";
    ctx.strokeRect(130, 10, 102, 100);

    if (active === "essay") {
      ctx.strokeStyle = "#0D0D0A"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(59, 60, 38, 0, TAU); ctx.stroke();
      ctx.fillStyle = "#B92B27";
      [-20, -10, 0, 10, 20].forEach((dy) => {
        const w = Math.sqrt(Math.max(0, 30 * 30 - dy * dy)) * 1.6;
        ctx.fillRect(59 - w / 2, 58 + dy, w, 3);
      });
      ctx.fillStyle = "#176B4B";
      for (let i = 0; i < 6; i++) ctx.fillRect(144, 24 + i * 13, i === 5 ? 46 : 74, 4);
    } else if (active === "table") {
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = i % 2 ? "#B92B27" : "#0D0D0A";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(59, 60, 14 + i * 8, -1.5, 1.4 + i * 0.4); ctx.stroke();
      }
      [70, 56, 82, 44].forEach((w, i) => {
        ctx.fillStyle = "#176B4B";
        ctx.fillRect(142, 24 + i * 19, w, 10);
      });
    } else if (active === "multi") {
      ctx.strokeStyle = "#0D0D0A"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(59, 60, 34, 0, TAU); ctx.stroke();
      ctx.fillStyle = "#F0ED04"; ctx.beginPath(); ctx.arc(50, 60, 14, 0, TAU); ctx.fill();
      ctx.fillStyle = "#B92B27"; ctx.beginPath(); ctx.arc(68, 60, 14, 0, TAU); ctx.fill();
      ctx.fillStyle = "#0D0D0A"; ctx.fillRect(140, 24, 38, 72);
      ctx.fillStyle = "#176B4B"; ctx.fillRect(184, 24, 38, 72);
    } else {
      ctx.fillStyle = "#0D0D0A"; ctx.fillRect(14, 44, 90, 32);
      ctx.save(); ctx.beginPath(); ctx.rect(14, 44, 90, 32); ctx.clip();
      ctx.strokeStyle = "#F0ED04"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(59, 60, 24, 0, TAU); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#176B4B"; ctx.fillRect(136, 44, 90, 32);
      ctx.strokeStyle = "#F0ED04"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(146, 66); ctx.quadraticCurveTo(181, 48, 216, 60); ctx.stroke();
    }

    titleEl.textContent = COPY[active].title;
    descEl.textContent = COPY[active].desc;
  }

  cards.forEach((card) => {
    const btn = card.querySelector(".anti-toggle");
    const activate = () => {
      active = card.dataset.anti;
      cards.forEach((c) => {
        const isOn = c === card;
        c.classList.toggle("is-active", isOn);
        c.querySelector(".anti-toggle").setAttribute("aria-pressed", String(isOn));
      });
      draw();
    };
    btn.addEventListener("click", activate);
  });

  draw();
}

/* ==================== 07 练习考场：三轮单变量 A/B/C/D ==================== */
export function mountSection07() {
  const roundBtns = [...document.querySelectorAll("[data-q]")];
  const promptEl = document.getElementById("quiz-prompt");
  const tallyEl = document.getElementById("quiz-tally");
  const feedbackEl = document.getElementById("quiz-feedback");
  const optBtns = [...document.querySelectorAll(".quiz-opt")];

  const ROUNDS = [
    {
      prompt: "下面四幅环形构图拥有完全相同的外径、360° 闭合黑环与 40% 亮黄中心核，<strong>唯一差别在「呼吸缝与环内层次」</strong>。哪一幅最成立？",
      answer: 1,
      opts: [
        { state: { closureDeg: 360, coreRatio: 0.40, gapRatio: 0.0, rivalWeight: 0.22, depthContrast: 0.80, crowdDensity: 0.62, ringRotation: 0 },
          reason: "方案 A 把内环呼吸缝压死为 0%，同时环带元素占空过挤，中心核与黑环边界黏连，画面发闷。" },
        { state: { closureDeg: 360, coreRatio: 0.40, gapRatio: 0.095, rivalWeight: 0.22, depthContrast: 0.88, crowdDensity: 0.34, ringRotation: 0 },
          reason: "答对了！方案 B 在 40% 焦点核外留出约 9.5% 呼吸缝，环内近大远小极差超过 3×、占空舒朗，完全符合环形构图的层次与呼吸法则。" },
        { state: { closureDeg: 360, coreRatio: 0.40, gapRatio: 0.24, rivalWeight: 0.22, depthContrast: 0.80, crowdDensity: 0.12, ringRotation: 0 },
          reason: "方案 C 的内环留白拉宽到 24%，黑环被推成遥远细圈且元素过疏，外环和中心核彼此脱节。" },
        { state: { closureDeg: 360, coreRatio: 0.40, gapRatio: 0.095, rivalWeight: 0.22, depthContrast: 0.03, crowdDensity: 0.34, ringRotation: 0 },
          reason: "方案 D 虽然留了呼吸缝，但环上所有元素完全等大均排（极差近 1.0×），像机械齿轮，缺少近大远小的空间层次。" },
      ],
    },
    {
      prompt: "下面四幅环形构图都保持 360° 闭合与清晰的近大远小层次，<strong>唯一差别在「中心核尺寸与环上亮黄权重」</strong>。哪一幅聚焦最清晰？",
      answer: 2,
      opts: [
        { state: { closureDeg: 360, coreRatio: 0.40, gapRatio: 0.09, rivalWeight: 0.88, depthContrast: 0.84, crowdDensity: 0.33, ringRotation: 0 },
          reason: "方案 A 在环带右上角放入了 88% 尺度的亮黄大圆，与中心核直接争权，形成双焦点打架。" },
        { state: { closureDeg: 360, coreRatio: 0.17, gapRatio: 0.09, rivalWeight: 0.22, depthContrast: 0.84, crowdDensity: 0.33, ringRotation: 0 },
          reason: "方案 B 的中心焦点缩到只剩 17%，被厚重的黑环吞没，核心信息几乎读不出来。" },
        { state: { closureDeg: 360, coreRatio: 0.42, gapRatio: 0.09, rivalWeight: 0.22, depthContrast: 0.86, crowdDensity: 0.34, ringRotation: 8 },
          reason: "答对了！方案 C 保持 42% 清晰单核，环上亮黄退居 22% 小点缀，视觉主次一眼分明。" },
        { state: { closureDeg: 360, coreRatio: 0.64, gapRatio: 0.05, rivalWeight: 0.22, depthContrast: 0.84, crowdDensity: 0.33, ringRotation: 0 },
          reason: "方案 D 的中心核撑爆到 64%，把黑环挤成发丝细边，已经退化成普通实心圆。" },
      ],
    },
    {
      prompt: "下面四幅构图保持相同的核比、呼吸缝与层次节奏，<strong>唯一差别在「环带闭合度与围合完整性」</strong>。哪一幅仍稳固维持环形场域？",
      answer: 2,
      opts: [
        { state: { closureDeg: 205, coreRatio: 0.42, gapRatio: 0.09, rivalWeight: 0.22, depthContrast: 0.84, crowdDensity: 0.34, ringRotation: 0 },
          reason: "方案 A 撕开了 155° 大缺口，环带不到三分之二圆，视线顺缺口外逃，已退化为弧形构图。" },
        { state: { closureDeg: 175, coreRatio: 0.42, gapRatio: 0.09, rivalWeight: 0.22, depthContrast: 0.84, crowdDensity: 0.34, ringRotation: 18 },
          reason: "方案 B 只剩不到半圈的开放弧（175°），完全构不成闭合的视觉场域。" },
        { state: { closureDeg: 332, coreRatio: 0.42, gapRatio: 0.09, rivalWeight: 0.22, depthContrast: 0.84, crowdDensity: 0.34, ringRotation: -6 },
          reason: "答对了！方案 C 虽在右下留出 28° 透气小口，但 332° 环带牢牢激活格式塔闭合性，视线仍自然闭环归心。" },
        { state: { closureDeg: 245, coreRatio: 0.42, gapRatio: 0.09, rivalWeight: 0.22, depthContrast: 0.84, crowdDensity: 0.34, ringRotation: 12 },
          reason: "方案 D 的缺口达 115°（近三分之一圆周缺失），围合场域明显漏气，稳固感不足。" },
      ],
    },
  ];

  let curRound = 0;
  const solved = [null, null, null];

  function drawThumb(canvas, st) {
    const S = 240, cx = S / 2, cy = S / 2, R = 94;
    const ctx = fitCanvas(canvas, S, S);
    const g = computeRingGeometry({ scenario: "poster", ...st }, R);

    ctx.fillStyle = "#F5F2EB";
    ctx.fillRect(0, 0, S, S);
    ctx.save();
    ctx.translate(cx, cy);

    // 外圈虚线
    ctx.strokeStyle = "#49BA8A";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(0, 0, g.rOut + 10, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);

    // 黑环带
    ctx.beginPath();
    if (g.closureDeg >= 359) {
      ctx.arc(0, 0, g.rOut, 0, TAU, false);
      ctx.arc(0, 0, g.rBandIn, TAU, 0, true);
    } else {
      ctx.arc(0, 0, g.rOut, g.startDeg * DEG, g.endDeg * DEG, false);
      ctx.arc(0, 0, g.rBandIn, g.endDeg * DEG, g.startDeg * DEG, true);
    }
    ctx.closePath();
    ctx.fillStyle = "#0D0D0A";
    ctx.fill();

    // 环内元素
    for (const el of g.elements) {
      if (el.inBreach) continue;
      ctx.fillStyle = el.color === "yellow" ? "#F0ED04" : el.color === "mint" ? "#49BA8A" : el.color === "mint2" ? "#8CD7B5" : "#F5F2EB";
      ctx.beginPath();
      ctx.arc(el.x, el.y, el.r, 0, TAU);
      ctx.fill();
    }

    // 呼吸缝与核心
    if (g.gapPx > 0.8) {
      ctx.fillStyle = "#F5F2EB";
      ctx.beginPath(); ctx.arc(0, 0, g.rBandIn, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "#F0ED04";
    ctx.beginPath(); ctx.arc(0, 0, g.rCore, 0, TAU); ctx.fill();
    ctx.fillStyle = "#0D0D0A";
    ctx.font = `900 ${Math.max(10, Math.round(g.rCore * 0.34))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("焦点", 0, 0);

    ctx.restore();
  }

  function renderRound() {
    const r = ROUNDS[curRound];
    promptEl.innerHTML = r.prompt;
    const picked = solved[curRound];

    optBtns.forEach((btn, idx) => {
      const cvs = btn.querySelector("canvas");
      drawThumb(cvs, r.opts[idx].state);
      btn.classList.remove("is-correct", "is-wrong");
      if (picked !== null) {
        if (idx === r.answer) btn.classList.add("is-correct");
        else if (idx === picked) btn.classList.add("is-wrong");
      }
    });

    const doneCount = solved.filter((x) => x !== null).length;
    const rightCount = solved.filter((x, i) => x === ROUNDS[i].answer).length;
    tallyEl.textContent = `已完成 ${doneCount} / 3 题（答对 ${rightCount} 题）`;

    if (picked === null) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = `<strong>点击上方任意方案作答</strong><p>四个选项只变动一个几何变量，标签不暗示好坏——凭眼睛先判断，再看每一项为什么对或错。</p>`;
    } else {
      const ok = picked === r.answer;
      const letters = ["A", "B", "C", "D"];
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-bad"}`;
      feedbackEl.innerHTML = `<strong>${ok ? `✓ 方案 ${letters[picked]} 正确` : `× 方案 ${letters[picked]} 不够成立（正确为方案 ${letters[r.answer]}）`}</strong><p>${r.opts[picked].reason}</p>`;
    }
  }

  optBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      solved[curRound] = Number(btn.dataset.opt);
      renderRound();
    });
  });

  roundBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      curRound = Number(btn.dataset.q);
      roundBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      renderRound();
    });
  });

  renderRound();
}

/* ==================== 08 原海报放大查看器（支持缩放、拖动、Esc 关） ==================== */
export function mountLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const stage = document.getElementById("lb-stage");
  const img = document.getElementById("lb-img");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const btnClose = document.getElementById("lb-close");

  let zoom = 1, tx = 0, ty = 0;
  let drag = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    btnReset.textContent = `${Math.round(zoom * 100)}%`;
  }

  function open() {
    img.src = poster.currentSrc || poster.src;
    zoom = 1; tx = 0; ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { zoom = Math.min(3.5, +(zoom + 0.35).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { zoom = Math.max(0.8, +(zoom - 0.35).toFixed(2)); applyTransform(); });
  btnReset.addEventListener("click", () => { zoom = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = Math.max(0.8, Math.min(3.5, zoom * (e.deltaY < 0 ? 1.12 : 0.9)));
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { drag = null; });
  stage.addEventListener("pointercancel", () => { drag = null; });

  lb.addEventListener("click", (e) => { if (e.target === stage) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });
}
