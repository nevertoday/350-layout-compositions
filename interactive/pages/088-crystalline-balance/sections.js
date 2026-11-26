// 088 晶体式平衡 — 七大编号小节的独立交互模块（相邻两节绝不用同一种控件做同一件事）
// 01: 四层晶体剥离透视（SVG 矢量分层开关）
// 02: 晶格对称密铺拼板（D2/D4/D6/C5 切换 + 点击翻转单块晶向，Canvas 实时算缝隙率与重心矢径）
// 03: 深钴折射暗室测角仪（360° 圆弧拖柄 + 光学视图切签 + 12 晶面明度阶梯直方图）
// 04: 历史标本年代对照台（6 个核实年代切换对应几何原理图解）
// 05: 边界清单真实排版翻牌对照（3 组真实场景切「晶体式」vs「更适配构图」）
// 06: 眼力考场 2 道单变量诊断题（中性 A/B/C/D 标签，作答后叠加几何辅助线）
// 07: 原海报灯箱（复用 #poster.src，draggable="false"，拖动平移 + 缩放 + Esc 关闭）

import { pixelRatio } from "../../lib/stage.js";

// ==================== 01 四层晶体剥离透视 ====================
export function initAnatomySection() {
  const host = document.getElementById("sec01-svg");
  const noteEl = document.getElementById("sec01-note");
  const btns = [...document.querySelectorAll("[data-layer-toggle]")];
  if (!host || !btns.length) return;

  const layers = { core: true, axes: true, facets: true, buds: true };

  function describe() {
    const off = Object.entries(layers).filter(([, v]) => !v).map(([k]) => k);
    if (off.length === 0) {
      return "四层齐备：深钴六方晶核托住重心，轴网锁住 60°/90° 镜像骨架，多面切角折出冷蓝紫明暗韵律，外延晶芽按递减尺度延伸视线——这正是 088 原海报的完整结构。";
    }
    if (!layers.core) {
      return "抽掉「晶核骨架」：外围棱晶失去了相互咬合的中央支点，画面中心空虚发飘，整组图形退化成围成一圈的碎菱形。";
    }
    if (!layers.axes) {
      return "关掉「对称轴网」：虽然棱晶仍在，但缺少清晰的旋转与镜像定位线做参照，排版时一旦增删文字或辅图就极易偏载走形。";
    }
    if (!layers.facets) {
      return "压平「切面折光」：所有多面体变成均质单色剪影，理性骨架还在，但光影流转的层次感立刻消失，整块图形显得呆板沉重。";
    }
    return "收起「外延晶芽」：中心主体虽然稳固，却少了由内向外比例递增/递减的生长势头，画面边缘收得过死，缺乏延展呼吸感。";
  }

  function render() {
    host.querySelectorAll("[data-layer]").forEach((g) => {
      const k = g.getAttribute("data-layer");
      g.style.opacity = layers[k] ? "1" : "0.06";
      g.classList.toggle("is-muted", !layers[k]);
    });
    btns.forEach((b) => {
      const k = b.getAttribute("data-layer-toggle");
      b.setAttribute("aria-pressed", String(layers[k]));
      b.classList.toggle("is-active", layers[k]);
    });
    if (noteEl) noteEl.textContent = describe();
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.getAttribute("data-layer-toggle");
      const activeCount = Object.values(layers).filter(Boolean).length;
      // 允许单关 1–3 层，但不至于全空无物
      if (layers[k] && activeCount <= 1) return;
      layers[k] = !layers[k];
      render();
    });
  });

  render();
}

// ==================== 02 晶格对称密铺拼板 ====================
export function initLatticeSection() {
  const canvas = document.getElementById("sec02-canvas");
  const modeBtns = [...document.querySelectorAll("[data-lattice]")];
  const resetBtn = document.getElementById("sec02-reset");
  const readMode = document.getElementById("sec02-mode-val");
  const readGap = document.getElementById("sec02-gap-val");
  const readBias = document.getElementById("sec02-bias-val");
  const readDesc = document.getElementById("sec02-desc");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const SYSTEMS = {
    d6: {
      name: "D6 六方晶系（60°）",
      n: 6,
      gapPct: 0,
      text: "60° 正三角形与正六边形在平面上可以零缝隙密铺，每旋转 60° 骨架完全重合——这是雪花、蜂巢与 088 原海报中心晶核最稳固的几何根基。",
    },
    d4: {
      name: "D4 四方晶系（90°）",
      n: 4,
      gapPct: 0,
      text: "90° 正交四重对称与现代网格排版天然同构，水平与垂直轴力矩相等，建筑与科技品牌最常用它建立坚硬理性的秩序感。",
    },
    d2: {
      name: "D2 双轴镜像（180°）",
      n: 2,
      gapPct: 0,
      text: "仅保留水平与垂直两条镜像轴，允许左右主翼拉宽、上下收束（原海报的外延轮廓就借用了 D2 比例修饰 D6 晶核），兼顾方向张力与稳态。",
    },
    c5: {
      name: "C5 五重错缝（72°）",
      n: 5,
      gapPct: 24,
      text: "正五边形内角 108° 无法整除 360°，强行沿平面连续密铺必然在接缝处撕开楔形空洞（晶体学限制定理证实周期晶格不存在五重旋转轴）。",
    },
  };

  let curKey = "d6";
  let flipped = new Set(); // 用户点选翻转的晶块索引
  let tileHits = [];

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 淡冰纸网格底
    ctx.fillStyle = "#F7F9FC";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const sys = SYSTEMS[curKey];
    const R = Math.min(w, h) * 0.37;
    tileHits = [];

    // 辅助参考圆与对称轴
    ctx.save();
    ctx.strokeStyle = "rgba(41,99,180,0.22)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < sys.n; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / sys.n;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R * 1.15, cy + Math.sin(a) * R * 1.15);
      ctx.stroke();
    }
    ctx.restore();

    // 画晶块单元并实算翻转后的重心偏离
    let sumX = 0, sumY = 0, count = 0;
    const sectorCount = curKey === "d2" ? 4 : sys.n;
    const baseStep = (Math.PI * 2) / sectorCount;

    for (let i = 0; i < sectorCount; i++) {
      const isFlip = flipped.has(i);
      const a0 = -Math.PI / 2 + i * baseStep;
      // C5 五重密铺故意留出 36°/5 楔形撕裂空隙（真实反映 3×108°=324° 缺 36°）
      const wedgeShrink = curKey === "c5" ? 0.14 : 0.015;
      const aL = a0 + wedgeShrink;
      const aR = a0 + baseStep - wedgeShrink;
      const aMid = (aL + aR) / 2;
      const rOut = curKey === "d2" ? (i % 2 === 0 ? R * 1.06 : R * 0.78) : R;
      const shift = isFlip ? 22 : 0; // 翻转晶块向外错开并反色，模拟对称破缺
      const ox = Math.cos(aMid) * shift;
      const oy = Math.sin(aMid) * shift;

      const p0 = [cx + ox, cy + oy];
      const p1 = [cx + ox + Math.cos(aL) * rOut * 0.88, cy + oy + Math.sin(aL) * rOut * 0.88];
      const pMid = [cx + ox + Math.cos(aMid) * rOut * 1.06, cy + oy + Math.sin(aMid) * rOut * 1.06];
      const p2 = [cx + ox + Math.cos(aR) * rOut * 0.88, cy + oy + Math.sin(aR) * rOut * 0.88];

      // 两半棱面（体现立体晶体折光）
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(pMid[0], pMid[1]); ctx.closePath();
      ctx.fillStyle = isFlip ? "#D95D72" : (i % 2 === 0 ? "#436CD0" : "#6F6BC8");
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(pMid[0], pMid[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath();
      ctx.fillStyle = isFlip ? "#B8293D" : (i % 2 === 0 ? "#85A7EB" : "#9E9DE6");
      ctx.fill();

      ctx.strokeStyle = "#F7F9FC";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(pMid[0], pMid[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath();
      ctx.stroke();

      // 记录命中区（以块心为准）
      const tx = cx + ox + Math.cos(aMid) * rOut * 0.56;
      const ty = cy + oy + Math.sin(aMid) * rOut * 0.56;
      tileHits.push({ index: i, x: tx, y: ty, r: rOut * 0.34 });

      // 质量向量累加（翻转块视作反相偏载）
      const wt = isFlip ? 1.55 : 1.0;
      sumX += Math.cos(aMid) * (rOut + shift) * wt;
      sumY += Math.sin(aMid) * (rOut + shift) * wt;
      count += wt;

      // 如果是 C5，标出楔形空隙红影
      if (curKey === "c5") {
        const g1 = aR;
        const g2 = a0 + baseStep + wedgeShrink;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(g1) * R * 0.85, cy + Math.sin(g1) * R * 0.85);
        ctx.lineTo(cx + Math.cos(g2) * R * 0.85, cy + Math.sin(g2) * R * 0.85);
        ctx.closePath();
        ctx.fillStyle = "rgba(184,41,61,0.16)";
        ctx.fill();
      }
    }

    // 中央深钴核锁点
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#043793";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    const biasPct = Math.min(99, Math.round((Math.hypot(sumX, sumY) / (count * R * 0.55)) * 100));
    const effGap = sys.gapPct + flipped.size * 7;

    if (biasPct > 4) {
      const bx = cx + (sumX / count) * 1.4;
      const by = cy + (sumY / count) * 1.4;
      ctx.strokeStyle = "#B8293D";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.fillStyle = "#B8293D";
      ctx.beginPath();
      ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (readMode) readMode.textContent = sys.name;
    if (readGap) readGap.textContent = effGap === 0 ? "0% 密铺" : `${effGap}% 错缝`;
    if (readBias) readBias.textContent = biasPct <= 3 ? "ΔG 0% 归心" : `ΔG ${biasPct}% 偏载`;
    if (readDesc) {
      readDesc.textContent = flipped.size > 0
        ? `你手动翻转了 ${flipped.size} 块晶格单元，对称配平立刻被破坏（重心偏移 ${biasPct}%）。再次点击红色晶块即可归位。`
        : sys.text;
    }

    ctx.restore();
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      curKey = btn.getAttribute("data-lattice");
      flipped.clear();
      modeBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      flipped.clear();
      draw();
    });
  }

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const R = Math.min(rect.width, rect.height) * 0.37;
    const dist = Math.hypot(x - cx, y - cy);
    if (dist < 10 || dist > R * 1.28) return;
    const sectorCount = curKey === "d2" ? 4 : SYSTEMS[curKey].n;
    const baseStep = (Math.PI * 2) / sectorCount;
    let ang = Math.atan2(y - cy, x - cx) - (-Math.PI / 2);
    ang = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const best = Math.floor(ang / baseStep) % sectorCount;
    if (flipped.has(best)) flipped.delete(best); else flipped.add(best);
    draw();
  });

  new ResizeObserver(draw).observe(canvas);
  draw();
}

// ==================== 03 深钴折射暗室测角仪 ====================
export function initRefractionLab() {
  const canvas = document.getElementById("sec03-canvas");
  const angleInput = document.getElementById("sec03-angle");
  const pitchInput = document.getElementById("sec03-pitch");
  const modeBtns = [...document.querySelectorAll("[data-optics-mode]")];
  const barsHost = document.getElementById("sec03-bars");
  const readAngle = document.getElementById("sec03-angle-val");
  const readPitch = document.getElementById("sec03-pitch-val");
  const readSpan = document.getElementById("sec03-span-val");
  const readVerdict = document.getElementById("sec03-verdict");
  if (!canvas || !angleInput || !pitchInput) return;

  const ctx = canvas.getContext("2d");
  let opticsMode = "prism"; // "prism" | "diffuse" | "wire"

  // 创建 12 个切面明度阶梯条
  const barEls = [];
  if (barsHost) {
    barsHost.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const wrap = document.createElement("div");
      wrap.className = "facet-bar-item";
      const fill = document.createElement("div");
      fill.className = "facet-bar-fill";
      const lbl = document.createElement("span");
      lbl.className = "facet-bar-lbl";
      lbl.textContent = `F${String(i + 1).padStart(2, "0")}`;
      wrap.append(fill, lbl);
      barsHost.append(wrap);
      barEls.push(fill);
    }
  }

  function render() {
    const angleDeg = Number(angleInput.value);
    const bevelDeg = Number(pitchInput.value); // 切面倾角 4°..62°
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(230, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 深钴暗室背景
    ctx.fillStyle = "#0A122B";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.34;
    const lRad = (angleDeg * Math.PI) / 180;
    const bevelRad = (bevelDeg * Math.PI) / 180;

    // 入射平行光向量
    const lx = Math.cos(lRad) * 0.85;
    const ly = Math.sin(lRad) * 0.85;
    const lz = 0.52;

    // 外圈测角刻度环
    ctx.strokeStyle = "rgba(123,179,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
    ctx.stroke();

    // 平行入射光束（三条冷白冰蓝光线）
    const sx = cx + Math.cos(lRad) * R * 1.32;
    const sy = cy - Math.sin(lRad) * R * 1.32;
    ctx.save();
    for (let k = -1; k <= 1; k++) {
      const px = -Math.sin(lRad) * k * 16;
      const py = -Math.cos(lRad) * k * 16;
      const g = ctx.createLinearGradient(sx + px, sy + py, cx + px, cy + py);
      g.addColorStop(0, "rgba(155,198,255,0.85)");
      g.addColorStop(1, "rgba(155,198,255,0.08)");
      ctx.strokeStyle = g;
      ctx.lineWidth = k === 0 ? 2.2 : 1.1;
      ctx.beginPath();
      ctx.moveTo(sx + px, sy + py);
      ctx.lineTo(cx + px, cy + py);
      ctx.stroke();
    }
    ctx.fillStyle = "#95B6EF";
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 12 块切面环状多面体（内 6 块 + 外 6 块）
    const lums = [];
    for (let i = 0; i < 12; i++) {
      const ring = i < 6 ? 0 : 1;
      const idx = i % 6;
      const a0 = -Math.PI / 2 + (idx * Math.PI) / 3 + (ring ? Math.PI / 6 : 0);
      const a1 = a0 + Math.PI / 3;
      const aMid = (a0 + a1) / 2;

      // 切面法线随倾角 bevelRad 倾斜
      const tilt = ring === 0 ? bevelRad * 0.72 : bevelRad;
      const nx = Math.cos(aMid) * Math.sin(tilt);
      const ny = Math.sin(aMid) * Math.sin(tilt);
      const nz = Math.cos(tilt);

      const ndotl = Math.max(0, nx * lx + ny * ly + nz * lz);
      const spec = opticsMode === "prism" ? Math.pow(ndotl, 6) * 0.42 : 0;
      const lum = Math.min(1, Math.max(0.14, 0.24 + ndotl * 0.68 + spec));
      lums.push(lum);

      const r0 = ring === 0 ? R * 0.28 : R * 0.60;
      const r1 = ring === 0 ? R * 0.60 : R * 1.02;

      const pA = [cx + Math.cos(a0) * r0, cy - Math.sin(a0) * r0];
      const pB = [cx + Math.cos(a0) * r1, cy - Math.sin(a0) * r1];
      const pC = [cx + Math.cos(a1) * r1, cy - Math.sin(a1) * r1];
      const pD = [cx + Math.cos(a1) * r0, cy - Math.sin(a1) * r0];

      ctx.beginPath();
      ctx.moveTo(pA[0], pA[1]); ctx.lineTo(pB[0], pB[1]); ctx.lineTo(pC[0], pC[1]); ctx.lineTo(pD[0], pD[1]);
      ctx.closePath();

      if (opticsMode === "wire") {
        ctx.fillStyle = `rgba(67,108,208,${(lum * 0.35).toFixed(2)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(149,182,239,${(0.35 + lum * 0.65).toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // 画法线短箭头
        const mx = (pA[0] + pB[0] + pC[0] + pD[0]) / 4;
        const my = (pA[1] + pB[1] + pC[1] + pD[1]) / 4;
        ctx.strokeStyle = "#B4B8FF";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + nx * 24, my - ny * 24);
        ctx.stroke();
      } else {
        // 棱镜色散模式给亮背侧切面注入冷蓝→薰衣草紫微妙色相偏移
        const hueShift = opticsMode === "prism" ? (idx % 2 === 0 ? 222 : 244) : 220;
        const sat = opticsMode === "prism" ? 72 : 52;
        const lightPct = Math.round(16 + lum * 68);
        ctx.fillStyle = `hsl(${hueShift}, ${sat}%, ${lightPct}%)`;
        ctx.fill();
        ctx.strokeStyle = "rgba(235,244,255,0.68)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }

    // 折射出射冷紫细光线（仅棱镜模式且倾角够大时显现）
    if (opticsMode === "prism" && bevelDeg >= 18) {
      const outRad = lRad + Math.PI + (bevelDeg - 18) * 0.012;
      const ex = cx + Math.cos(outRad) * R * 1.26;
      const ey = cy - Math.sin(outRad) * R * 1.26;
      const og = ctx.createLinearGradient(cx, cy, ex, ey);
      og.addColorStop(0, "rgba(180,184,255,0.85)");
      og.addColorStop(1, "rgba(180,184,255,0.02)");
      ctx.strokeStyle = og;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    // 更新 12 条明度直方阶梯
    lums.forEach((l, i) => {
      if (!barEls[i]) return;
      barEls[i].style.height = `${Math.round(l * 100)}%`;
      barEls[i].style.background = l > 0.72 ? "#B4D6FF" : l > 0.45 ? "#5D8CE8" : "#26469A";
    });

    const minL = Math.min(...lums);
    const maxL = Math.max(...lums);
    const span = Math.round((maxL - minL) * 100);

    if (readAngle) readAngle.textContent = `${angleDeg}°`;
    if (readPitch) readPitch.textContent = `${bevelDeg}°`;
    if (readSpan) readSpan.textContent = `${span}%`;
    if (readVerdict) {
      if (span < 18) {
        readVerdict.textContent = "死平无折：切面倾角太小，12 个面亮度挤在同一段灰蓝里，对称图形显得像扁平印章。";
      } else if (span > 68) {
        readVerdict.textContent = "高反差锐折：迎光面极亮、背光面深潜，明暗跨度极强，适合展板主视觉但切忌直接压排细小正文。";
      } else {
        readVerdict.textContent = "韵律成立：12 块切面自然拉出高光、中钴与深靛三阶明暗梯级，对称骨架立刻有了清冽流动的节奏。";
      }
    }

    ctx.restore();
  }

  // 直接在暗室圆盘上拖动改光源角
  let dragging = false;
  function pickAngle(e) {
    const rect = canvas.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = -(e.clientY - rect.top - rect.height / 2);
    let deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (deg < 0) deg += 360;
    angleInput.value = String(deg);
    render();
  }
  canvas.addEventListener("pointerdown", (e) => { dragging = true; pickAngle(e); });
  canvas.addEventListener("pointermove", (e) => { if (dragging) pickAngle(e); });
  window.addEventListener("pointerup", () => { dragging = false; });

  angleInput.addEventListener("input", render);
  pitchInput.addEventListener("input", render);
  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      opticsMode = b.getAttribute("data-optics-mode");
      modeBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  new ResizeObserver(render).observe(canvas);
  render();
}

// ==================== 04 从哪来：历史标本切换台 ====================
export function initHistorySection() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const titleEl = document.getElementById("sec04-era-title");
  const metaEl = document.getElementById("sec04-era-meta");
  const bodyEl = document.getElementById("sec04-era-body");
  const svgEl = document.getElementById("sec04-era-svg");
  if (!btns.length || !svgEl) return;

  const ERAS = {
    "1611": {
      title: "开普勒与六角雪花",
      meta: "Johannes Kepler · 《论六角雪花》（Strena seu de Nive Sexangula）· 1611",
      body: "天文学家开普勒在布拉格大桥上接住一片雪花后发问：为什么雪花总是六角，而不是五角或七角？他用球体最密堆积的几何模型推演六重对称，成为近代晶体学与对称几何研究的开端。",
      svg: `<g stroke="#1D4F9A" fill="none" stroke-width="1.6">
        <circle cx="140" cy="95" r="24" fill="#DCE8FB"/><circle cx="140" cy="47" r="24" fill="#EEF4FD"/>
        <circle cx="182" cy="71" r="24" fill="#EEF4FD"/><circle cx="182" cy="119" r="24" fill="#EEF4FD"/>
        <circle cx="140" cy="143" r="24" fill="#EEF4FD"/><circle cx="98" cy="119" r="24" fill="#EEF4FD"/>
        <circle cx="98" cy="71" r="24" fill="#EEF4FD"/>
        <polygon points="140,47 182,71 182,119 140,143 98,119 98,71" stroke="#043793" stroke-width="2" stroke-dasharray="4 3"/>
      </g>`,
    },
    "1784": {
      title: "阿羽依的微观多面体单元",
      meta: "René-Just Haüy · 《晶体结构理论试论》· 1784",
      body: "法国矿物学家阿羽依失手摔碎一块方解石后发现，无论碎块多小，解理面的夹角始终一致。他由此提出晶体由微小而全等的多面体「基本单元」层层咬合堆叠——直接对应视觉排版里的「模块组合」。",
      svg: `<g stroke="#1D4F9A" stroke-width="1.5">
        <polygon points="140,32 188,58 140,84 92,58" fill="#DCE8FB"/>
        <polygon points="92,58 140,84 140,136 92,110" fill="#718ECD"/>
        <polygon points="188,58 140,84 140,136 188,110" fill="#3560B8"/>
        <line x1="116" y1="45" x2="164" y2="71" stroke="#F7F9FC"/><line x1="164" y1="45" x2="116" y2="71" stroke="#F7F9FC"/>
        <line x1="116" y1="71" x2="116" y2="123" stroke="#F7F9FC"/><line x1="164" y1="71" x2="164" y2="123" stroke="#F7F9FC"/>
        <line x1="92" y1="84" x2="140" y2="110" stroke="#F7F9FC"/><line x1="188" y1="84" x2="140" y2="110" stroke="#F7F9FC"/>
      </g>`,
    },
    "1850": {
      title: "布拉菲的 14 种空间晶格",
      meta: "Auguste Bravais · 空间点阵数学证明 · 1850",
      body: "法国物理学家布拉菲用群论严格证明：在三维空间中，能够无间隙周期重复的点阵只有 14 种（归入 7 大晶系）。这告诉设计师，稳定不是无穷无尽的堆砌，而是建立在少数严谨晶格骨架之上的有序生长。",
      svg: `<g>
        <g stroke="#718ECD" stroke-width="1.2" fill="none" stroke-dasharray="3 3">
          <rect x="84" y="44" width="84" height="84"/><rect x="112" y="64" width="84" height="84"/>
          <line x1="84" y1="44" x2="112" y2="64"/><line x1="168" y1="44" x2="196" y2="64"/>
          <line x1="84" y1="128" x2="112" y2="148"/><line x1="168" y1="128" x2="196" y2="148"/>
        </g>
        <g fill="#043793">
          <circle cx="84" cy="44" r="5"/><circle cx="168" cy="44" r="5"/><circle cx="84" cy="128" r="5"/><circle cx="168" cy="128" r="5"/>
          <circle cx="112" cy="64" r="5"/><circle cx="196" cy="64" r="5"/><circle cx="112" cy="148" r="5"/><circle cx="196" cy="148" r="5"/>
          <circle cx="140" cy="96" r="6" fill="#6F6BC8"/>
        </g>
      </g>`,
    },
    "1904": {
      title: "海克尔与放射虫多面骨架",
      meta: "Ernst Haeckel · 《自然界的艺术形态》（Kunstformen der Natur）· 1899–1904",
      body: "海克尔于 1899 至 1904 年分辑出版并汇成百幅全集的自然图版，把深海放射虫精密的硅质多面体骨架推到欧洲设计师眼前，直接启发了新艺术运动与装饰艺术把自然晶体几何转译为平面纹样和对称版式。",
      svg: `<g stroke="#1D4F9A" stroke-width="1.4" fill="none">
        <polygon points="140,28 196,62 196,128 140,162 84,128 84,62" fill="#EEF4FD"/>
        <polygon points="140,48 178,72 178,118 140,142 102,118 102,72" fill="#C7D7F5"/>
        <polygon points="140,28 178,72 140,142 102,72" stroke="#4B45A3"/>
        <line x1="140" y1="14" x2="140" y2="176"/><line x1="68" y1="54" x2="212" y2="136"/><line x1="212" y1="54" x2="68" y2="136"/>
        <circle cx="140" cy="95" r="14" fill="#3560B8" stroke="#F7F9FC" stroke-width="2"/>
      </g>`,
    },
    "1914": {
      title: "陶特的科隆棱面玻璃屋",
      meta: "Bruno Taut · Glashaus（科隆德意志制造联盟博览会）· 1914",
      body: "德国表现主义建筑师布鲁诺·陶特在科隆建成 14 边形底座配菱形棱面玻璃穹顶的「玻璃屋」，外覆反光玻璃、内嵌彩色棱镜，把晶体切面与折射光色从矿物标本室搬进现代视觉与空间设计。",
      svg: `<g stroke="#152049" stroke-width="1.4">
        <polygon points="140,26 176,66 104,66" fill="#B6CEFA"/>
        <polygon points="104,66 176,66 196,118 84,118" fill="#5D8CE8"/>
        <polygon points="140,26 104,66 84,118 140,118" fill="#8B8BDE" opacity="0.72"/>
        <polygon points="84,118 196,118 206,154 74,154" fill="#1D4F9A"/>
        <line x1="140" y1="26" x2="140" y2="154" stroke="#F7F9FC"/><line x1="104" y1="66" x2="176" y2="118" stroke="#F7F9FC"/>
        <line x1="176" y1="66" x2="104" y2="118" stroke="#F7F9FC"/>
      </g>`,
    },
    "1952": {
      title: "外尔的对称群与阿恩海姆力场",
      meta: "Hermann Weyl《对称》1952 · Rudolf Arnheim《艺术与视知觉》1954 / 1974",
      body: "数学家外尔在《对称》里把双侧、旋转与晶体群对称贯通于艺术和建筑史；两年后心理学家阿恩海姆提出画框内的「隐藏结构力场」，解释了为什么多轴对称与视觉重量配平能让眼睛立刻获得稳妥的秩序感。",
      svg: `<g stroke="#1D4F9A" stroke-width="1.4" fill="none">
        <rect x="74" y="30" width="132" height="130" fill="#F7F9FC"/>
        <line x1="74" y1="30" x2="206" y2="160" stroke-dasharray="4 4" stroke="#718ECD"/>
        <line x1="206" y1="30" x2="74" y2="160" stroke-dasharray="4 4" stroke="#718ECD"/>
        <line x1="140" y1="30" x2="140" y2="160" stroke="#2963B4"/>
        <line x1="74" y1="95" x2="206" y2="95" stroke="#2963B4"/>
        <polygon points="140,62 173,95 140,128 107,95" fill="#436CD0" opacity="0.28"/>
        <circle cx="140" cy="95" r="8" fill="#043793"/>
      </g>`,
    },
  };

  function show(era) {
    const d = ERAS[era];
    if (!d) return;
    if (titleEl) titleEl.textContent = d.title;
    if (metaEl) metaEl.textContent = d.meta;
    if (bodyEl) bodyEl.textContent = d.body;
    svgEl.innerHTML = d.svg;
    btns.forEach((b) => {
      const on = b.getAttribute("data-era") === era;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.getAttribute("data-era"))));
  show("1611");
}

// ==================== 05 边界清单：三组真实排版翻牌对照 ====================
export function initBoundarySection() {
  const caseBtns = [...document.querySelectorAll("[data-boundary-case]")];
  const toggleBtn = document.getElementById("sec05-toggle");
  const badgeEl = document.getElementById("sec05-badge");
  const titleEl = document.getElementById("sec05-title");
  const bodyEl = document.getElementById("sec05-body");
  const previewEl = document.getElementById("sec05-preview");
  if (!caseBtns.length || !toggleBtn || !previewEl) return;

  const CASES = {
    summit: {
      name: "光子计算峰会主视觉",
      fit: true,
      crystal: {
        badge: "契合 · 晶体式平衡",
        title: "冷冽轴线与切面光阶放大「精密与前沿」心智",
        body: "技术峰会需要一眼传达算力秩序与结构可靠。以六方晶核托住峰会年份，四隅对称折线标注议程板块，标题与多面体共轴，秩序感与未来感严丝合缝。",
        svg: `<svg viewBox="0 0 320 200" aria-hidden="true">
          <rect width="320" height="200" fill="#EAEEF2"/>
          <polygon points="160,34 214,66 214,130 160,162 106,130 106,66" fill="#043793"/>
          <polygon points="160,54 196,76 196,120 160,142 124,120 124,76" fill="#718ECD"/>
          <polygon points="160,14 176,46 160,64 144,46" fill="#8B8BDE"/>
          <polygon points="160,186 176,154 160,136 144,154" fill="#436CD0"/>
          <polygon points="62,98 108,82 124,98 108,114" fill="#95B6EF"/>
          <polygon points="258,98 212,82 196,98 212,114" fill="#436CD0"/>
          <rect x="20" y="24" width="66" height="8" fill="#152049"/><rect x="20" y="38" width="46" height="5" fill="#445175"/>
          <rect x="234" y="156" width="66" height="8" fill="#152049"/><rect x="248" y="170" width="52" height="5" fill="#445175"/>
        </svg>`,
      },
      alt: {
        badge: "对照 · 随意散拼无轴",
        title: "去掉晶格对称与咬合后，精密感瞬间瓦解",
        body: "同样的蓝紫图形，一旦打散成大小随意、互不咬合的斜块，科技峰会海报立刻显得像廉价拼贴，失去了可信赖的理性锚点。",
        svg: `<svg viewBox="0 0 320 200" aria-hidden="true">
          <rect width="320" height="200" fill="#EAEEF2"/>
          <polygon points="90,40 140,30 125,85" fill="#436CD0"/>
          <polygon points="210,55 268,90 218,124" fill="#8B8BDE"/>
          <polygon points="142,126 192,140 154,180" fill="#043793"/>
          <polygon points="48,124 88,158 38,166" fill="#95B6EF"/>
          <rect x="132" y="88" width="96" height="10" fill="#152049" transform="rotate(-11 180 93)"/>
        </svg>`,
      },
    },
    storybook: {
      name: "低龄自然绘本封面",
      fit: false,
      crystal: {
        badge: "慎用 · 硬套晶体式平衡",
        title: "冰冷棱角与严格对称让温暖故事变得拒人千里",
        body: "绘本讲究亲切呼吸感与自由生长的童趣。强行套进锐利多面体对称骨架，既压抑了角色的活泼动作，又带来实验室标本般的疏离感。",
        svg: `<svg viewBox="0 0 320 200" aria-hidden="true">
          <rect width="320" height="200" fill="#E8ECF2"/>
          <polygon points="160,30 220,100 160,170 100,100" fill="#436CD0" opacity="0.85"/>
          <line x1="160" y1="16" x2="160" y2="184" stroke="#152049" stroke-dasharray="3 3"/>
          <line x1="60" y1="100" x2="260" y2="100" stroke="#152049" stroke-dasharray="3 3"/>
          <rect x="116" y="88" width="88" height="24" fill="#152049"/>
          <rect x="128" y="96" width="64" height="7" fill="#F7F9FC"/>
        </svg>`,
      },
      alt: {
        badge: "更适配 · 开放式非对称构图",
        title: "松开僵直轴线，用温暖圆弧与大留白托住童趣",
        body: "这类强调温度与叙事张力的主题，改用开放式构图或动态构图，留出视线漫游的呼吸区，比硬锁多面体对称有效得多。",
        svg: `<svg viewBox="0 0 320 200" aria-hidden="true">
          <rect width="320" height="200" fill="#F6EFE6"/>
          <circle cx="228" cy="128" r="56" fill="#E6B28B" opacity="0.65"/>
          <path d="M20,176 Q115,112 300,158 L300,200 L20,200 Z" fill="#6E9A7E" opacity="0.72"/>
          <circle cx="236" cy="54" r="22" fill="#E68B6B"/>
          <rect x="34" y="42" width="96" height="12" rx="6" fill="#3B2E26"/>
          <rect x="34" y="64" width="66" height="7" rx="3" fill="#7D6759"/>
        </svg>`,
      },
    },
    watch: {
      name: "精密机械腕表展板",
      fit: true,
      crystal: {
        badge: "契合 · 晶体式平衡",
        title: "多面表壳切角与晶格轴线天然互证「精准工艺」",
        body: "高定机械与光学仪器本身就拥有切面表耳、对称表盘与金属折射光。晶体式平衡把产品物理语言直接外延到版式骨架上，几乎零认知摩擦。",
        svg: `<svg viewBox="0 0 320 200" aria-hidden="true">
          <rect width="320" height="200" fill="#101A3B"/>
          <polygon points="160,28 210,58 210,142 160,172 110,142 110,58" fill="#1C3473" stroke="#95B6EF" stroke-width="1.8"/>
          <circle cx="160" cy="100" r="38" fill="#0A122B" stroke="#D8E8FF" stroke-width="1.5"/>
          <line x1="160" y1="100" x2="160" y2="72" stroke="#EEF3FA" stroke-width="2.2"/>
          <line x1="160" y1="100" x2="184" y2="108" stroke="#95B6EF" stroke-width="1.8"/>
          <line x1="44" y1="100" x2="98" y2="100" stroke="#7BB3FF" stroke-dasharray="3 3"/>
          <line x1="222" y1="100" x2="276" y2="100" stroke="#7BB3FF" stroke-dasharray="3 3"/>
          <rect x="28" y="82" width="54" height="6" fill="#B9CAE8"/><rect x="238" y="82" width="54" height="6" fill="#B9CAE8"/>
        </svg>`,
      },
      alt: {
        badge: "对照 · 纯平铺表列",
        title: "抹平多面光阶后，只剩枯燥说明书感",
        body: "若把腕表展板压成无切面层次的纯平三列灰框，虽然整齐，却丢失了高定精密制品最动人的金属折光与仪式中心。",
        svg: `<svg viewBox="0 0 320 200" aria-hidden="true">
          <rect width="320" height="200" fill="#E8ECF2"/>
          <rect x="22" y="34" width="84" height="132" fill="#D5DCE6"/>
          <rect x="118" y="34" width="84" height="132" fill="#D5DCE6"/>
          <rect x="214" y="34" width="84" height="132" fill="#D5DCE6"/>
          <circle cx="160" cy="100" r="24" fill="#8C99B0"/>
        </svg>`,
      },
    },
  };

  let curCase = "summit";
  let showAlt = false;

  function render() {
    const item = CASES[curCase];
    const view = showAlt ? item.alt : item.crystal;
    badgeEl.textContent = view.badge;
    badgeEl.className = "boundary-badge " + (showAlt
      ? (item.fit ? "is-warn" : "is-good")
      : (item.fit ? "is-good" : "is-warn"));
    titleEl.textContent = view.title;
    bodyEl.textContent = view.body;
    previewEl.innerHTML = view.svg;
    toggleBtn.textContent = showAlt ? "切回「晶体式平衡」方案" : "翻看对照方案";
    caseBtns.forEach((b) => {
      const on = b.getAttribute("data-boundary-case") === curCase;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  caseBtns.forEach((b) => {
    b.addEventListener("click", () => {
      curCase = b.getAttribute("data-boundary-case");
      showAlt = false;
      render();
    });
  });
  toggleBtn.addEventListener("click", () => {
    showAlt = !showAlt;
    render();
  });

  render();
}

// ==================== 06 小练习：2 道严格单变量诊断题 ====================
export function initQuizSection() {
  const qBtns = [...document.querySelectorAll("[data-quiz-q]")];
  const promptEl = document.getElementById("sec06-prompt");
  const gridEl = document.getElementById("sec06-options");
  const feedbackEl = document.getElementById("sec06-feedback");
  if (!gridEl || !feedbackEl) return;

  // 第 1 题共享几何生成器：四幅图拥有完全一致的六方亮核、4 支双半面主棱、4 支蓝紫斜晶与 4 枚外延晶芽，严格只差唯一一个几何变量
  function makeCrystalOptSvg({ gap = 0, flat = false, budScale = 1, reveal = false, revealKind = "" }) {
    const cx = 110, cy = 90;
    const flatCol = "#5376C4";
    const c = (hex) => (flat ? flatCol : hex);
    const strokeCore = flat ? "none" : "#EEF3FA";

    // 主棱晶（上下左右 4 支双半面菱晶）
    const primaryArm = (deg, colLight, colDark) => {
      const r = (deg * Math.PI) / 180;
      const cos = Math.cos(r), sin = Math.sin(r);
      const pt = (x, y) => `${(cx + x * cos - y * sin).toFixed(1)},${(cy + x * sin + y * cos).toFixed(1)}`;
      const r0 = 24 + gap;
      const L = 38;
      const W = 11;
      const pRoot = pt(r0, 0);
      const pMidL = pt(r0 + L * 0.42, -W);
      const pMidR = pt(r0 + L * 0.42, W);
      const pTip = pt(r0 + L, 0);

      // 外延晶芽（沿主轴外延）
      const b0 = r0 + L + 5;
      const bL = 12 * budScale;
      const bW = 5 * budScale;
      const bRoot = pt(b0, 0);
      const bMidL = pt(b0 + bL * 0.5, -bW);
      const bMidR = pt(b0 + bL * 0.5, bW);
      const bTip = pt(b0 + bL, 0);

      return `
        <polygon points="${pRoot} ${pMidL} ${pTip}" fill="${c(colLight)}"/>
        <polygon points="${pRoot} ${pTip} ${pMidR}" fill="${c(colDark)}"/>
        <polygon points="${bRoot} ${bMidL} ${bTip} ${bMidR}" fill="${c(colLight)}" ${flat ? "" : 'stroke="#EEF3FA" stroke-width="0.7"'}/>
      `;
    };

    // 斜向柱晶（55° / 125° / 235° / 305° 4 支蓝紫斜切晶柱）
    const diagArm = (deg, colLight, colDark) => {
      const r = (deg * Math.PI) / 180;
      const cos = Math.cos(r), sin = Math.sin(r);
      const pt = (x, y) => `${(cx + x * cos - y * sin).toFixed(1)},${(cy + x * sin + y * cos).toFixed(1)}`;
      const r0 = 22 + gap;
      const L = 33;
      const W = 9.5;
      const pRoot = pt(r0, 0);
      const pL = pt(r0 + L * 0.54, -W);
      const pR = pt(r0 + L * 0.54, W);
      const pTip = pt(r0 + L, 0);
      return `
        <polygon points="${pRoot} ${pL} ${pTip}" fill="${c(colLight)}"/>
        <polygon points="${pRoot} ${pTip} ${pR}" fill="${c(colDark)}"/>
      `;
    };

    let overlay = "";
    if (reveal) {
      if (revealKind === "gap") {
        overlay = `<circle cx="${cx}" cy="${cy}" r="33" fill="none" stroke="#FF8C9E" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      } else if (revealKind === "ok") {
        overlay = `<line x1="${cx}" y1="6" x2="${cx}" y2="174" stroke="#5EE3B8" stroke-dasharray="3 3"/><line x1="18" y1="${cy}" x2="202" y2="${cy}" stroke="#5EE3B8" stroke-dasharray="3 3"/>`;
      } else if (revealKind === "flat") {
        overlay = `<rect x="38" y="18" width="144" height="144" fill="none" stroke="#FF8C9E" stroke-dasharray="4 3"/>`;
      } else if (revealKind === "bud") {
        overlay = `<circle cx="28" cy="${cy}" r="18" fill="none" stroke="#FF8C9E" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="192" cy="${cy}" r="18" fill="none" stroke="#FF8C9E" stroke-width="1.5" stroke-dasharray="3 3"/>`;
      }
    }

    return `<svg viewBox="0 0 220 180" aria-hidden="true">
      <rect width="220" height="180" fill="#14214A"/>
      ${diagArm(55, "#8B8BDE", "#566CC8")}
      ${diagArm(125, "#9E9DE6", "#5D8CE8")}
      ${diagArm(235, "#8B8BDE", "#4D73CF")}
      ${diagArm(305, "#95B6EF", "#6A7ED4")}
      ${primaryArm(0, "#95B6EF", "#3560B8")}
      ${primaryArm(90, "#85A7EB", "#2963B4")}
      ${primaryArm(180, "#95B6EF", "#3560B8")}
      ${primaryArm(270, "#85A7EB", "#2963B4")}
      <polygon points="110,66 131,78 131,102 110,114 89,102 89,78" fill="${c("#043793")}" stroke="${strokeCore}" stroke-width="1.3"/>
      <polygon points="110,75 123,82.5 123,97.5 110,105 97,97.5 97,82.5" fill="${c("#B4D6FF")}"/>
      ${overlay}
    </svg>`;
  }

  // 严格只差一个变量，标签只用中性方案名 A/B/C/D，绝不剧透好坏
  const QUESTIONS = [
    {
      id: "q1",
      prompt: "小练习 1：四幅同为八芒六核蓝紫晶簇，结构零件完全相同、只改变了一个几何变量。挑一挑，哪一版最完整地成立了晶体式平衡？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A",
          svg: (reveal) => makeCrystalOptSvg({ gap: 12, flat: false, budScale: 1, reveal, revealKind: "gap" }),
          explain: "方案 A 的六方亮核、明暗切面与外延晶芽比例都对，但外围 8 支棱晶全部与中心六方核脱开了明显空缝——失去「多面咬合」后，晶体退化为一盘散落的几何碎片。",
        },
        {
          id: "B",
          label: "方案 B",
          svg: (reveal) => makeCrystalOptSvg({ gap: 0, flat: false, budScale: 1, reveal, revealKind: "ok" }),
          explain: "正确！方案 B 四项条件全部落位：中心六方核与 8 支棱晶严丝咬合、双轴对称精准、每支棱晶保留冷亮与深钴明暗切面、外端四枚晶芽按递减尺度有序延展。",
        },
        {
          id: "C",
          label: "方案 C",
          svg: (reveal) => makeCrystalOptSvg({ gap: 0, flat: true, budScale: 1, reveal, revealKind: "flat" }),
          explain: "方案 C 的咬合、对称与晶芽比例和正解完全一样，但所有多面切角被压平成了均质单色色块——没了「折射韵律」，整个图案变成一块死板的剪纸印章，缺乏立体层次。",
        },
        {
          id: "D",
          label: "方案 D",
          svg: (reveal) => makeCrystalOptSvg({ gap: 0, flat: false, budScale: 2.35, reveal, revealKind: "bud" }),
          explain: "方案 D 的中心六方核、8 支咬合棱晶与折光切面全部正确，但外端 4 枚晶芽反常胀大到超过主棱晶，重心被外圈大菱形往画框边缘硬拉，破坏了由核心向外比例递减的「有序生长」。",
        },
      ],
    },
    {
      id: "q2",
      prompt: "小练习 2：要把晶体式平衡用在「光学建筑展」海报排版里，挑一挑这四个只差一处结构的草图，哪一版既保住晶体秩序又不压坏信息层级？",
      answer: "C",
      options: [
        {
          id: "A",
          label: "方案 A",
          svg: (reveal) => `<svg viewBox="0 0 220 180" aria-hidden="true">
            <rect width="220" height="180" fill="#14214A"/>
            <polygon points="110,36 158,64 158,118 110,146 62,118 62,64" fill="#2963B4" opacity="0.65"/>
            <rect x="28" y="64" width="110" height="14" fill="#EEF3FA" transform="rotate(-14 82 71)"/>
            <rect x="96" y="102" width="98" height="10" fill="#B4B8FF" transform="rotate(11 145 107)"/>
            ${reveal ? `<line x1="110" y1="12" x2="110" y2="168" stroke="#FF8C9E" stroke-dasharray="4 3"/>` : ""}
          </svg>`,
          explain: "方案 A 虽然居中放了六角晶体，但标题文字随意斜插，把原本安静的纵向对称轴切碎了，图像与字排各说各话。",
        },
        {
          id: "B",
          label: "方案 B",
          svg: (reveal) => `<svg viewBox="0 0 220 180" aria-hidden="true">
            <rect width="220" height="180" fill="#14214A"/>
            <rect x="22" y="34" width="92" height="14" fill="#EEF3FA"/>
            <rect x="22" y="58" width="108" height="7" fill="#8EA6CE"/>
            <rect x="22" y="72" width="96" height="7" fill="#8EA6CE"/>
            <rect x="22" y="86" width="84" height="7" fill="#8EA6CE"/>
            <polygon points="184,126 198,136 198,152 184,162 170,152 170,136" fill="#7BB3FF"/>
            ${reveal ? `<rect x="164" y="120" width="40" height="48" fill="none" stroke="#FF8C9E" stroke-dasharray="3 3"/>` : ""}
          </svg>`,
          explain: "方案 B 只是在普通左文右图版式的角落贴了一颗小水晶图标，整张版面的视觉重量全堆在左上，根本没有用晶体结构统筹全局平衡。",
        },
        {
          id: "C",
          label: "方案 C",
          svg: (reveal) => `<svg viewBox="0 0 220 180" aria-hidden="true">
            <rect width="220" height="180" fill="#14214A"/>
            <polygon points="110,46 146,68 146,112 110,134 74,112 74,68" fill="#1D4F9A" stroke="#D8E8FF" stroke-width="1.3"/>
            <polygon points="110,60 132,74 132,106 110,120 88,106 88,74" fill="#6F8EE2"/>
            <rect x="64" y="18" width="92" height="11" fill="#EEF3FA"/>
            <line x1="146" y1="68" x2="170" y2="54" stroke="#7BB3FF"/><rect x="172" y="48" width="32" height="6" fill="#B9CAE8"/>
            <line x1="74" y1="112" x2="50" y2="126" stroke="#7BB3FF"/><rect x="16" y="122" width="32" height="6" fill="#B9CAE8"/>
            <rect x="40" y="152" width="140" height="8" fill="#8EA6CE"/>
            ${reveal ? `<line x1="110" y1="10" x2="110" y2="170" stroke="#5EE3B8" stroke-dasharray="3 3"/>` : ""}
          </svg>`,
          explain: "正确！方案 C 用中心六方晶格对齐顶标与底注，左右用对角引线平衡辅文，切面明暗托住主视觉而不干扰文字阅读——是真正落地可用的晶体式平衡版式。",
        },
        {
          id: "D",
          label: "方案 D",
          svg: (reveal) => `<svg viewBox="0 0 220 180" aria-hidden="true">
            <rect width="220" height="180" fill="#14214A"/>
            ${[0,1,2,3].map((r) => [0,1,2,3,4].map((c) => {
              const x = 18 + c * 42 + (r % 2) * 14, y = 20 + r * 38;
              return `<polygon points="${x},${y} ${x+22},${y+12} ${x+12},${y+32} ${x-8},${y+20}" fill="${(r+c)%2 ? '#95B6EF' : '#436CD0'}" stroke="#EEF3FA" stroke-width="1"/>`;
            }).join("")).join("")}
            <rect x="60" y="80" width="100" height="16" fill="#0A122B"/>
            ${reveal ? `<rect x="12" y="12" width="196" height="156" fill="none" stroke="#FF8C9E" stroke-dasharray="4 3"/>` : ""}
          </svg>`,
          explain: "方案 D 满版铺满等大高反差碎棱，没有中心晶核、也没有留白呼吸区，文字淹没在高频噪点里——晶体平衡讲究有核有阶，不是满屏铺碎玻璃。",
        },
      ],
    },
  ];

  let curIdx = 0;
  const picked = {};

  function render() {
    const q = QUESTIONS[curIdx];
    const choice = picked[q.id] || null;
    if (promptEl) promptEl.textContent = q.prompt;

    qBtns.forEach((b, i) => {
      const on = i === curIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    gridEl.innerHTML = "";
    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.setAttribute("data-opt", opt.id);
      if (choice) {
        if (opt.id === q.answer) btn.classList.add("is-correct");
        else if (opt.id === choice) btn.classList.add("is-wrong");
      }
      btn.innerHTML = `
        <div class="quiz-thumb">${opt.svg(Boolean(choice))}</div>
        <div class="quiz-foot">
          <span class="quiz-label">${opt.label}</span>
          ${choice ? `<span class="quiz-mark">${opt.id === q.answer ? "✓ 成立" : opt.id === choice ? "× 偏差" : ""}</span>` : ""}
        </div>`;
      btn.addEventListener("click", () => {
        picked[q.id] = opt.id;
        render();
      });
      gridEl.append(btn);
    }

    if (!choice) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = `<p>挑一挑并点击任意一个方案作答，系统将在缩略图上叠加几何辅助线，并拆解每个选项究竟差在哪一个变量。</p>`;
    } else {
      const chosen = q.options.find((o) => o.id === choice);
      const isRight = choice === q.answer;
      feedbackEl.className = "quiz-feedback " + (isRight ? "is-correct" : "is-wrong");
      feedbackEl.innerHTML = `
        <p class="quiz-fb-head">${isRight ? "判断准确" : `你选了 ${chosen.label}，正确答案是方案 ${q.answer}`}</p>
        <p>${chosen.explain}</p>
        ${!isRight ? `<p class="quiz-fb-ans"><strong>为什么选方案 ${q.answer}：</strong>${q.options.find((o) => o.id === q.answer).explain}</p>` : ""}`;
    }
  }

  qBtns.forEach((b, i) => b.addEventListener("click", () => { curIdx = i; render(); }));
  render();
}

// ==================== 07 原海报灯箱（复用 #poster.src，绝不二次内联） ====================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const modal = document.getElementById("poster-modal");
  const closeBtn = document.getElementById("poster-close-btn");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const resetBtn = document.getElementById("poster-zoom-reset");
  const zoomRead = document.getElementById("poster-zoom-val");
  const stage = document.getElementById("poster-modal-stage");
  const fullImg = document.getElementById("poster-modal-img");
  if (!thumb || !modal || !fullImg || !stage) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

  function applyTransform() {
    fullImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomRead) zoomRead.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!fullImg.getAttribute("src")) fullImg.src = thumb.currentSrc || thumb.src;
    scale = 1; tx = 0; ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  thumb.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  zoomInBtn?.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn?.addEventListener("click", () => { scale = Math.max(0.7, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } applyTransform(); });
  resetBtn?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.7, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
