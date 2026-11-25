// 110 渐变组织 · 正文 01–07 节专属交互与 2D Canvas 可视化组件
// 每节使用截然不同的控件机制，相邻两节绝不重复同一交互。

import { loop, pixelRatio } from "../../lib/stage.js";
import { interpolateColor, midChromaRetention, oklabToOklch, rgbToOklab, rgbToCss, rgbToHex, contrastRatio } from "./color.js";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(100, Math.round(rect.width));
  const h = Math.max(80, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// 绘制正多边形 / 圆 / 菱形 / 圆角方块过渡形
export function drawMorphPolygon(ctx, cx, cy, r, morphT, rot = 0) {
  // morphT: 0=方 -> 0.5=圆 -> 1=三角（平滑形变）
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  if (morphT <= 0.5) {
    // 圆角方形 -> 正圆
    const k = morphT * 2; // 0..1
    const rad = r * k;
    const s = r;
    if (k > 0.96) {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else {
      ctx.moveTo(-s + rad, -s);
      ctx.lineTo(s - rad, -s);
      ctx.quadraticCurveTo(s, -s, s, -s + rad);
      ctx.lineTo(s, s - rad);
      ctx.quadraticCurveTo(s, s, s - rad, s);
      ctx.lineTo(-s + rad, s);
      ctx.quadraticCurveTo(-s, s, -s, s - rad);
      ctx.lineTo(-s, -s + rad);
      ctx.quadraticCurveTo(-s, -s, -s + rad, -s);
      ctx.closePath();
    }
  } else {
    // 正圆 -> 正三角形（通过 36 点极坐标插值确保丝滑变形）
    const k = (morphT - 0.5) * 2;
    const pts = 48;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
      // 三角形极坐标半径 r_tri(a) = (r * 0.62) / cos(((a + pi/2) mod 2pi/3) - pi/3)
      const sector = ((a + Math.PI / 2) % ((Math.PI * 2) / 3) + (Math.PI * 2) / 3) % ((Math.PI * 2) / 3);
      const triR = (r * 0.62) / Math.max(0.48, Math.cos(sector - Math.PI / 3));
      const rad = r * (1 - k) + triR * k;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.restore();
}

// =========================================================================
// 01 节：六维梯度叠层实验室（6 枚独立复选叠层开关，单维对比多维协同与过载）
// =========================================================================
export function initSec01(root) {
  const canvas = root.querySelector("#s01-canvas");
  const buttons = [...root.querySelectorAll("[data-dim]")];
  const readoutTitle = root.querySelector("#s01-title");
  const readoutText = root.querySelector("#s01-desc");
  const readoutBadge = root.querySelector("#s01-badge");
  const active = new Set(["size", "color"]);

  function updateUI() {
    buttons.forEach((b) => {
      const on = active.has(b.dataset.dim);
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    const n = active.size;
    if (n === 0) {
      readoutBadge.textContent = "0 维 · 纯重复";
      readoutBadge.dataset.state = "warn";
      readoutTitle.textContent = "全部关闭：退化为等权机械重复";
      readoutText.textContent = "当尺寸、色相、明透、旋转、间距与形态全部锁死，8 枚方块只剩下静态重复（见 107 重复原则），没有起点也没有终点。";
    } else if (n === 1) {
      const only = buttons.find((b) => active.has(b.dataset.dim))?.dataset.label || "单维";
      readoutBadge.textContent = `1 维 · ${only}渐变`;
      readoutBadge.dataset.state = "ok";
      readoutTitle.textContent = `单维克制：只靠「${only}」就已显出方向`;
      readoutText.textContent = "哪怕一滴渐变色都不沾，单改尺寸、疏密或形态一样构成标准的渐变组织——克制、冷静，适合极简编辑版式与数据图表。";
    } else if (n <= 3) {
      readoutBadge.textContent = `${n} 维 · 黄金协同`;
      readoutBadge.dataset.state = "ok";
      readoutTitle.textContent = `${n} 维同向协同：过渡最稳、层次最透`;
      readoutText.textContent = "110 原海报常用的正是 2–3 维协同（尺寸放大 + 明透加深 + 色相由紫入橙）：每个维度互相印证同一个方向，眼睛零负担读懂纵深。";
    } else if (n <= 4) {
      readoutBadge.textContent = `${n} 维 · 强表现力`;
      readoutBadge.dataset.state = "mid";
      readoutTitle.textContent = "4 维并进：动态充沛，适合海报主视觉";
      readoutText.textContent = "四个属性一起推进，视觉张力已经拉满，适合作为大画幅主视觉，但要留出大面积纯色留白兜底，别再叠放繁杂正文。";
    } else {
      readoutBadge.textContent = `${n} 维 · 信息过载`;
      readoutBadge.dataset.state = "warn";
      readoutTitle.textContent = "五六维全开：变化太杂，反而抓不住主轴";
      readoutText.textContent = "王无邪在构成教学中提醒过：一次同时扭动过多属性时，眼睛忙于追逐旋转、变身、疏密和变色，渐变的「可预期秩序」反而被噪点稀释。";
    }
    draw();
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    // 暖宣底
    ctx.fillStyle = "#FAF6EE";
    ctx.fillRect(0, 0, w, h);
    // 细微辅助基线
    ctx.strokeStyle = "rgba(90, 62, 130, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, h * 0.52);
    ctx.lineTo(w - 24, h * 0.52);
    ctx.stroke();

    const N = 8;
    const padX = Math.min(48, w * 0.08);
    const span = w - padX * 2;
    const baseR = Math.min(28, Math.max(12, span / (N * 2.7)));

    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const eased = u ** 1.45;
      // 疏密：从宽到密或从密到宽的非线性推进
      const posU = active.has("spacing") ? u ** 1.42 : u;
      const cx = padX + posU * span;
      const cy = h * 0.52;
      const r = active.has("size") ? baseR * (0.38 + 0.92 * eased) : baseR * 0.78;
      const alpha = active.has("opacity") ? 0.24 + 0.74 * eased : 0.92;
      const rot = active.has("rotation") ? u * (Math.PI * 0.75) : 0;
      const morphT = active.has("shape") ? u : 0; // 0=方 -> 0.5=圆 -> 1=三角
      const rgb = active.has("color")
        ? interpolateColor("#8D62C8", "#F55B1E", eased, "oklch")
        : { r: 108, g: 82, b: 148 };

      ctx.save();
      drawMorphPolygon(ctx, cx, cy, r, morphT, rot);
      ctx.fillStyle = rgbToCss(rgb, alpha);
      ctx.fill();
      ctx.restore();

      // 步序刻标
      ctx.fillStyle = "#5B5166";
      ctx.font = '600 11px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(`0${i + 1}`, cx, h - 14);
    }

    // 右上标注活跃维度数
    ctx.fillStyle = "#56308F";
    ctx.font = '600 11px "IBM Plex Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("LEFT → RIGHT GRADATION", 24, 24);
  }

  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      const d = b.dataset.dim;
      if (active.has(d)) active.delete(d);
      else active.add(d);
      updateUI();
    });
  });

  window.addEventListener("resize", draw);
  updateUI();
}

// =========================================================================
// 02 节：Gibson 纹理梯度斜坡纵深画板（倾角滑杆 + 步进规律切换 + 纯平面网格验真）
// =========================================================================
export function initSec02(root) {
  const canvas = root.querySelector("#s02-canvas");
  const tiltInput = root.querySelector("#s02-tilt");
  const tiltVal = root.querySelector("#s02-tilt-val");
  const modeBtns = [...root.querySelectorAll("[data-s02-mode]")];
  const flatBtn = root.querySelector("#s02-flat-toggle");
  const diagBox = root.querySelector("#s02-diag");

  let tilt = 62; // 0 = 纯正面平铺，82 = 强烈躺倒纵深走廊
  let mode = "geometric"; // geometric | linear | flat
  let showGrid = false;

  function updateReadout() {
    tiltVal.textContent = `${tilt}°`;
    modeBtns.forEach((b) => {
      const on = b.dataset.s02Mode === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    flatBtn.classList.toggle("is-on", showGrid);
    flatBtn.setAttribute("aria-pressed", String(showGrid));

    if (mode === "flat" || tilt < 15) {
      diagBox.textContent = "当前几乎没有纵向尺度和间距梯度：所有圆点等大等距，大脑立刻把它读回一张平整的二维墙纸。";
    } else if (mode === "linear") {
      diagBox.textContent = `当前倾角 ${tilt}° 但采用「等差线性压缩」：前排缩太慢、远端突然塌陷成一条线，斜坡像弯折的弧面而不是笔直远去的地面。`;
    } else {
      diagBox.textContent = `当前倾角 ${tilt}° + 近等比压缩（Gibson 纹理梯度）：越往远处圆点同步变小、行距同步收紧、明度淡入雾紫，平面纸面瞬间「躺倒」出一条伸向地平线的纵深长廊。`;
    }
    draw();
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    // 霞光地平背景
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#DFC8F3");
    bg.addColorStop(0.45, "#F5DAE4");
    bg.addColorStop(1, "#FDE3C2");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const rows = 9;
    const cols = 9;
    const tNorm = mode === "flat" ? 0 : tilt / 88; // 0..0.93
    const horizonY = h * (0.12 + 0.14 * tNorm);
    const bottomY = h * 0.91;

    // 绘制远方地平微线
    if (tNorm > 0.15) {
      ctx.strokeStyle = "rgba(86, 48, 143, 0.28)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(16, horizonY);
      ctx.lineTo(w - 16, horizonY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#56308F";
      ctx.font = '600 11px "Space Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText("HORIZON · 纹理收敛线", w - 18, horizonY - 6);
    }

    // 透视行位置（真实透视 1/z vs 线性等差）
    for (let r = 0; r < rows; r++) {
      const u = r / (rows - 1); // 0=最远, 1=最近
      let depthScale;
      let yFrac;
      if (tNorm < 0.02) {
        depthScale = 1;
        yFrac = u;
      } else if (mode === "linear") {
        // 等差步进：故意呈现前慢后挤的非自然透视感
        depthScale = 1 - tNorm * 0.78 * (1 - u);
        yFrac = u;
      } else {
        // 近等比透视纹理梯度（Gibson）：1 / (1 + k*(1-u))
        const k = tNorm * 3.8;
        const invZ = 1 / (1 + k * (1 - u));
        const invZ0 = 1 / (1 + k);
        yFrac = (invZ - invZ0) / (1 - invZ0);
        depthScale = 0.22 + 0.78 * yFrac;
      }

      const y = horizonY + (bottomY - horizonY) * yFrac;
      const spreadX = w * (0.34 + 0.56 * depthScale);
      const leftX = (w - spreadX) / 2;
      const rx = Math.max(2.5, Math.min(18, (w / 34) * depthScale));
      const ry = rx * (1 - tNorm * 0.42 * (1 - 0.35 * yFrac)); // 躺倒地面上的圆在视网膜压成扁圆
      const colRgb = interpolateColor("#8D62C8", "#F55B1E", yFrac, "oklch");
      const alpha = 0.26 + 0.72 * yFrac;

      if (showGrid) {
        ctx.strokeStyle = "rgba(20, 18, 24, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(leftX + spreadX, y);
        ctx.stroke();
      }

      for (let c = 0; c < cols; c++) {
        const cu = c / (cols - 1);
        const x = leftX + spreadX * cu;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, Math.max(1.8, ry), 0, 0, Math.PI * 2);
        ctx.fillStyle = rgbToCss(colRgb, alpha);
        ctx.fill();
      }
    }

    if (showGrid) {
      ctx.fillStyle = "#141218";
      ctx.font = '600 11px "IBM Plex Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("纯平面网格验真：无任何 3D 引擎，全靠尺寸与行距梯度欺骗双眼", 18, 22);
    }
  }

  tiltInput.addEventListener("input", () => {
    tilt = Number(tiltInput.value);
    if (mode === "flat" && tilt >= 15) mode = "geometric";
    updateReadout();
  });
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.s02Mode;
      if (mode === "flat") {
        tilt = 0;
        tiltInput.value = "0";
      } else if (tilt < 30) {
        tilt = 62;
        tiltInput.value = "62";
      }
      updateReadout();
    })
  );
  flatBtn.addEventListener("click", () => {
    showGrid = !showGrid;
    updateReadout();
  });
  window.addEventListener("resize", draw);
  updateReadout();
}

// =========================================================================
// 03 节：sRGB vs Oklab / Oklch 实测光谱解剖台（点选色对 + 点击任意阶梯放大取样）
// =========================================================================
const COLOR_PAIRS = [
  { id: "poster", name: "原海报 · 丁香紫→炽橙", a: "#7E67D6", b: "#F55B1E" },
  { id: "blue-yellow", name: "经典坑 · 钴蓝→暖黄", a: "#2358D8", b: "#F4C22B" },
  { id: "teal-coral", name: "青碧→珊瑚红", a: "#169B94", b: "#F0564A" },
];

export function initSec03(root) {
  const pairBtns = [...root.querySelectorAll("[data-pair]")];
  const stepBtns = [...root.querySelectorAll("[data-s03-steps]")];
  const srgbStrip = root.querySelector("#s03-srgb");
  const oklchStrip = root.querySelector("#s03-oklch");
  const chartCanvas = root.querySelector("#s03-chart");
  const inspectBox = root.querySelector("#s03-inspect");

  let pair = COLOR_PAIRS[0];
  let steps = 9;
  let pickedIdx = 4; // 默认取样正中间最易发灰的阶梯

  function renderStrips() {
    pickedIdx = Math.min(pickedIdx, steps - 1);
    const build = (container, space) => {
      container.innerHTML = "";
      for (let i = 0; i < steps; i++) {
        const u = steps === 1 ? 0.5 : i / (steps - 1);
        const rgb = interpolateColor(pair.a, pair.b, u, space);
        const hex = rgbToHex(rgb);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "s03-swatch" + (i === pickedIdx ? " is-picked" : "");
        btn.style.backgroundColor = hex;
        btn.setAttribute("aria-label", `${space.toUpperCase()} 第 ${i + 1} 阶 ${hex}`);
        btn.dataset.idx = String(i);
        btn.addEventListener("click", () => {
          pickedIdx = i;
          renderAll();
        });
        container.appendChild(btn);
      }
    };
    build(srgbStrip, "srgb");
    build(oklchStrip, "oklch");
  }

  function drawChart() {
    const { ctx, w, h } = fitCanvas(chartCanvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1E152A";
    ctx.fillRect(0, 0, w, h);

    const padL = 42;
    const padR = 18;
    const padT = 26;
    const padB = 26;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // 水平参考格线
    ctx.strokeStyle = "rgba(235, 203, 228, 0.14)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const y = padT + (plotH * g) / 3;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#CBBED9";
    ctx.font = '600 11px "Space Mono", monospace';
    ctx.textAlign = "right";
    ctx.fillText("高彩", padL - 6, padT + 4);
    ctx.fillText("灰泥", padL - 6, padT + plotH + 4);

    const samples = 48;
    const maxC = 0.26;
    const drawCurve = (space, strokeColor, dashed = false) => {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = dashed ? 2.2 : 2.6;
      if (dashed) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const rgb = interpolateColor(pair.a, pair.b, u, space);
        const C = oklabToOklch(rgbToOklab(rgb)).C;
        const x = padL + u * plotW;
        const y = padT + plotH * (1 - Math.min(1, C / maxC));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    drawCurve("srgb", "#FF8A75", true);
    drawCurve("oklch", "#6EE0C5", false);

    // 标记当前选中取样阶梯的竖向探针
    const uPick = steps === 1 ? 0.5 : pickedIdx / (steps - 1);
    const xPick = padL + uPick * plotW;
    ctx.strokeStyle = "rgba(253, 206, 135, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xPick, padT - 4);
    ctx.lineTo(xPick, padT + plotH + 4);
    ctx.stroke();

    for (const [space, color] of [
      ["srgb", "#FF8A75"],
      ["oklch", "#6EE0C5"],
    ]) {
      const rgb = interpolateColor(pair.a, pair.b, uPick, space);
      const C = oklabToOklch(rgbToOklab(rgb)).C;
      const y = padT + plotH * (1 - Math.min(1, C / maxC));
      ctx.beginPath();
      ctx.arc(xPick, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#1B1326";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = "#F6EFE3";
    ctx.font = '600 11px "IBM Plex Sans", "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(w < 460 ? "实线 Oklch · 虚线 sRGB 彩度" : "实线 Oklch 彩度 · 虚线 sRGB 彩度（中段下凹 = 发灰发泥）", padL, 16);
  }

  function updateInspect() {
    const u = steps === 1 ? 0.5 : pickedIdx / (steps - 1);
    const rgbS = interpolateColor(pair.a, pair.b, u, "srgb");
    const rgbO = interpolateColor(pair.a, pair.b, u, "oklch");
    const lchS = oklabToOklch(rgbToOklab(rgbS));
    const lchO = oklabToOklch(rgbToOklab(rgbO));
    const retS = Math.round(midChromaRetention(pair.a, pair.b, "srgb") * 100);
    const retO = Math.round(midChromaRetention(pair.a, pair.b, "oklch") * 100);
    const diffPct = Math.round(((lchO.C - lchS.C) / Math.max(0.001, lchO.C)) * 100);

    inspectBox.innerHTML = `
      <div class="s03-pick-head">取样第 <strong>${pickedIdx + 1} / ${steps}</strong> 阶（位置 ${Math.round(u * 100)}%）</div>
      <div class="s03-pick-grid">
        <div class="s03-chip-row">
          <span class="s03-dot" style="background:${rgbToHex(rgbS)}"></span>
          <span>sRGB <code>${rgbToHex(rgbS)}</code> · 彩度 C=${lchS.C.toFixed(3)} · 中点留存 ${retS}%</span>
        </div>
        <div class="s03-chip-row">
          <span class="s03-dot" style="background:${rgbToHex(rgbO)}"></span>
          <span>Oklch <code>${rgbToHex(rgbO)}</code> · 彩度 C=${lchO.C.toFixed(3)} · 中点留存 ${retO}%</span>
        </div>
      </div>
      <p class="s03-pick-why">${
        diffPct > 12
          ? `在这一阶，sRGB 的真实感知彩度比 Oklch 掉了 ${diffPct}%——这就是为什么直接按 RGB 数值平均，紫到橙、蓝到黄中间总会冒出一块灰褐泥带。`
          : "接近两端端点时两个空间基本重合；点中间几阶，就能立刻看到 sRGB 彩度曲线往下塌出深坑。"
      }</p>
    `;
  }

  function renderAll() {
    pairBtns.forEach((b) => {
      const on = b.dataset.pair === pair.id;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stepBtns.forEach((b) => {
      const on = Number(b.dataset.s03Steps) === steps;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderStrips();
    drawChart();
    updateInspect();
  }

  pairBtns.forEach((b) =>
    b.addEventListener("click", () => {
      pair = COLOR_PAIRS.find((p) => p.id === b.dataset.pair) || COLOR_PAIRS[0];
      pickedIdx = Math.floor(steps / 2);
      renderAll();
    })
  );
  stepBtns.forEach((b) =>
    b.addEventListener("click", () => {
      steps = Number(b.dataset.s03Steps);
      pickedIdx = Math.floor(steps / 2);
      renderAll();
    })
  );
  window.addEventListener("resize", drawChart);
  renderAll();
}

// =========================================================================
// 04 节：四类渐变路径拓扑与动态视线光珠模拟
// =========================================================================
const TOPOLOGIES = {
  diagonal: {
    title: "斜向单流（110 原海报母式）",
    desc: "由左上微紫单向滑向右下炽橙，起点轻、终点重，视线像坐上一条笔直滑梯直抵版面核心信息。",
  },
  radial: {
    title: "聚心放射（Vasarely 球面鼓胀感）",
    desc: "由边缘冷紫层层收缩或鼓胀向画心暖橙，所有梯度向量指向同一点，在纯平面上拱出强烈的向心焦点。",
  },
  clash: {
    title: "双向对冲（常见失控错态）",
    desc: "左半向右推、右半向左挤，两条渐变轴在中央迎面相撞；视线光珠反复卡在中间打转，版面失去清晰出口。",
  },
  morph: {
    title: "形态演进（Escher 式连续变形）",
    desc: "不仅靠大小和色彩，更让轮廓从严谨方块逐步圆化为圆、再收束为锐角三角，用「形变梯度」牵引阅读顺序。",
  },
};

export function initSec04(root) {
  const canvas = root.querySelector("#s04-canvas");
  const cards = [...root.querySelectorAll("[data-topo]")];
  const titleEl = root.querySelector("#s04-title");
  const descEl = root.querySelector("#s04-desc");
  let current = "diagonal";

  function select(id) {
    current = id;
    cards.forEach((c) => {
      const on = c.dataset.topo === id;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-pressed", String(on));
    });
    titleEl.textContent = TOPOLOGIES[id].title;
    descEl.textContent = TOPOLOGIES[id].desc;
    ctl.draw();
  }

  const ctl = loop(canvas, (t, _dt, { still }) => {
    const { ctx, w, h } = fitCanvas(canvas);
    const phase = still ? 0.62 : (t * 0.34) % 1;

    // 淡霞光底
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#EFE6FA");
    bg.addColorStop(0.55, "#F9E9E8");
    bg.addColorStop(1, "#FCE9CD");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const cols = 9;
    const rows = 5;
    const padX = Math.min(54, w * 0.08);
    const padY = Math.min(44, h * 0.14);
    const cellW = (w - padX * 2) / (cols - 1);
    const cellH = (h - padY * 2) / (rows - 1);
    const maxR = Math.min(cellW, cellH) * 0.42;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);
        const x = padX + c * cellW;
        const y = padY + r * cellH;
        let g = 0;
        if (current === "diagonal") g = (u * 0.65 + v * 0.35) ** 1.35;
        else if (current === "radial") {
          const d = Math.hypot((u - 0.5) * 1.4, (v - 0.5) * 1.15);
          g = Math.max(0, 1 - d * 1.25) ** 1.25;
        } else if (current === "clash") {
          g = (1 - Math.abs(u - 0.5) * 2) ** 1.35;
        } else {
          g = u ** 1.3;
        }

        const rad = maxR * (0.26 + 0.74 * g);
        const rgb = interpolateColor("#8D62C8", "#F55B1E", g, "oklch");
        const alpha = 0.25 + 0.72 * g;

        ctx.save();
        if (current === "morph") {
          drawMorphPolygon(ctx, x, y, rad, u, 0);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
        }
        ctx.fillStyle = rgbToCss(rgb, alpha);
        ctx.fill();
        ctx.restore();
      }
    }

    // 绘制视线引导路径与滑动光珠
    const drawOrb = (x, y, warn = false) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = warn ? "rgba(181, 38, 26, 0.22)" : "rgba(20, 18, 24, 0.18)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = warn ? "#B5261A" : "#141218";
      ctx.fill();
      ctx.strokeStyle = "#FAF6EE";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    ctx.save();
    ctx.strokeStyle = current === "clash" ? "rgba(181, 38, 26, 0.72)" : "rgba(20, 18, 24, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    if (current === "diagonal") {
      ctx.beginPath();
      ctx.moveTo(padX, padY);
      ctx.lineTo(w - padX, h - padY);
      ctx.stroke();
      drawOrb(padX + (w - padX * 2) * phase, padY + (h - padY * 2) * phase);
    } else if (current === "radial") {
      for (const [ax, ay] of [
        [padX, padY],
        [w - padX, padY],
        [padX, h - padY],
        [w - padX, h - padY],
      ]) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(w / 2, h / 2);
        ctx.stroke();
        drawOrb(ax + (w / 2 - ax) * phase, ay + (h / 2 - ay) * phase);
      }
    } else if (current === "clash") {
      ctx.beginPath();
      ctx.moveTo(padX, h / 2);
      ctx.lineTo(w / 2 - 14, h / 2);
      ctx.moveTo(w - padX, h / 2);
      ctx.lineTo(w / 2 + 14, h / 2);
      ctx.stroke();
      const bounce = Math.sin(phase * Math.PI);
      drawOrb(padX + (w / 2 - padX - 18) * bounce, h / 2, true);
      drawOrb(w - padX - (w / 2 - padX - 18) * bounce, h / 2, true);
    } else {
      ctx.beginPath();
      ctx.moveTo(padX, h / 2);
      ctx.lineTo(w - padX, h / 2);
      ctx.stroke();
      drawOrb(padX + (w - padX * 2) * phase, h / 2);
    }
    ctx.restore();
  });

  cards.forEach((c) => c.addEventListener("click", () => select(c.dataset.topo)));
  select("diagonal");
}

// =========================================================================
// 05 节：编年史主题筛选器（筛选视角并高亮史料卡片）
// =========================================================================
export function initSec05(root) {
  const filterBtns = [...root.querySelectorAll("[data-era]")];
  const cards = [...root.querySelectorAll("[data-era-tag]")];
  const summary = root.querySelector("#s05-summary");

  const notes = {
    all: "共收录 6 个可核实的历史里程碑：从版画形态演进、知觉心理学、色彩教学与欧普艺术，一路走到现代感知均匀色彩标准。",
    form: "形态与构成脉络：Escher 用版画证明形体可以连续过渡，Vasarely 与王无邪把它推进成可教学、可复用的现代平面体系。",
    perception: "知觉科学脉络：Gibson 解释了渐变为何产生空间纵深，Albers 揭示了相邻色阶的视觉相对性。",
    color: "色彩工程脉络：从 1963 年 Albers 的手工丝网色卡到 2020 年 Ottosson 的 Oklab 数学模型，核心都在让渐变贴合人眼而不是机器。",
  };

  function apply(era) {
    filterBtns.forEach((b) => {
      const on = b.dataset.era === era;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    cards.forEach((c) => {
      const hit = era === "all" || c.dataset.eraTag === era;
      c.classList.toggle("is-dim", !hit);
      c.classList.toggle("is-hi", era !== "all" && hit);
    });
    summary.textContent = notes[era] || notes.all;
  }

  filterBtns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.era)));
  apply("all");
}

// =========================================================================
// 06 节：什么时候用 / 什么时候别用 · 实战体检对照机（实算 WCAG 对比度）
// =========================================================================
const CASES_06 = {
  article: {
    verdict: "别用在大段正文背景上",
    badBgLeft: "#C89AEF",
    badBgRight: "#F66D2E",
    badText: "#FAF6EE",
    goodBg: "#FAF6EE",
    goodText: "#141218",
    badLabel: "全页铺强渐变底 + 白字正文",
    goodLabel: "纯暖米纸底 + 深墨正文（仅顶眉用细渐变饰线）",
    explain: "渐变背景两端的亮度不同：左端浅紫处白字对比度瞬间崩到不合格，读者读完两行眼睛就发酸；长文底纸必须守住纯色稳态。",
    sample: "正文需要在十几分钟里保持恒定对比度，任何横跨明暗的背景渐变都会打断行间扫读。",
  },
  table: {
    verdict: "别用在需要等权对比的价格表 / 导航栏",
    badBgLeft: "#D0B1EE",
    badBgRight: "#F55B1E",
    badText: "#141218",
    goodBg: "#FAF6EE",
    goodText: "#141218",
    badLabel: "三档套餐横贯色阶渐变，强行暗示右边更重",
    goodLabel: "等权留白卡片 + 单枚清晰推荐徽章",
    explain: "渐变天生带「由轻到重」的价值偏向。用在需要客观等权并列的表单或数据列上，会无端制造视觉偏袒，误导读者判断。",
    sample: "基础版 ¥49  ·  专业版 ¥99  ·  团队版 ¥199（需要平权细读，而非被斜坡推着走）",
  },
  poster: {
    verdict: "最适合：大画幅海报视觉主轴",
    badBgLeft: "#9B72CF",
    badBgRight: "#F55B1E",
    badText: "#2A1F38",
    goodBg: "#F6EFE3",
    goodText: "#141218",
    badLabel: "渐变铺满每个角落，连标题和说明都在变色",
    goodLabel: "原海报式分区：左暖米静区排字 × 右霞光动区铺渐变阵",
    explain: "渐变最出彩的用法永远是「一静配一动」：把 110 原海报左侧留成纯净暖米纸放文字，右侧才能放肆挥洒紫到橙的几何渐进坡面。",
    sample: "主视觉靠渐进几何把视线引向核心日期与口号，所有细节信息退回纯净底纸保持锐利可读。",
  },
  heatmap: {
    verdict: "最适合：连续数值热力与进度层级",
    badBgLeft: "#31B89E",
    badBgRight: "#F24438",
    badText: "#FAF6EE",
    goodBg: "#F5ECE2",
    goodText: "#141218",
    badLabel: "彩虹/红绿硬撞色阶，中段发灰且色盲无法分辨",
    goodLabel: "单调亮度递增（浅紫雾→玫瑰→深炽橘），去色也分清高低",
    explain: "数据可视化里，优秀的连续色阶必须保证「亮度单调递进」：即便打印成黑白灰阶，数值从低到高的坡度依然一目了然。",
    sample: "0% 极轻浅雾 → 50% 中玫瑰 → 100% 深炽橘：亮度与饱和度同向推进，零歧义读数。",
  },
};

export function initSec06(root) {
  const tabs = [...root.querySelectorAll("[data-case]")];
  const verdictEl = root.querySelector("#s06-verdict");
  const badCard = root.querySelector("#s06-bad");
  const goodCard = root.querySelector("#s06-good");
  const badMeta = root.querySelector("#s06-bad-meta");
  const goodMeta = root.querySelector("#s06-good-meta");
  const explainEl = root.querySelector("#s06-explain");

  function render(key) {
    const c = CASES_06[key] || CASES_06.article;
    tabs.forEach((t) => {
      const on = t.dataset.case === key;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    verdictEl.textContent = c.verdict;

    const minBadCR = Math.min(contrastRatio(c.badText, c.badBgLeft), contrastRatio(c.badText, c.badBgRight));
    const goodCR = contrastRatio(c.goodText, c.goodBg);

    badCard.style.background = `linear-gradient(110deg, ${c.badBgLeft}, ${c.badBgRight})`;
    badCard.style.color = c.badText;
    badCard.querySelector(".s06-card-head").textContent = c.badLabel;
    badCard.querySelector(".s06-card-sample").textContent = c.sample;
    badMeta.textContent = `最弱端实测对比度 ${minBadCR.toFixed(1)}:1${minBadCR < 4.5 ? "（低于正文 4.5:1 门槛）" : "（视觉重心失衡）"}`;

    goodCard.style.background = c.goodBg;
    goodCard.style.color = c.goodText;
    goodCard.querySelector(".s06-card-head").textContent = c.goodLabel;
    goodCard.querySelector(".s06-card-sample").textContent = c.sample;
    goodMeta.textContent = `实测稳定对比度 ${goodCR.toFixed(1)}:1（全段清晰无偏色）`;

    explainEl.textContent = c.explain;
  }

  tabs.forEach((t) => t.addEventListener("click", () => render(t.dataset.case)));
  render("article");
}

// =========================================================================
// 07 节：眼力小练习（单变量：仅改变 7 阶尺寸步进曲线，标签仅写方案 A/B/C/D）
// =========================================================================
const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    radii: (i, n) => {
      const u = i / (n - 1); // 线性等差 p=1.00，前跳猛、后显平
      return 0.25 + 0.75 * u;
    },
    correct: false,
    reason: "方案 A 是纯算术等差（p=1.00）：第 1 阶到第 2 阶直径几乎翻倍，看起来猛地一跳；到了第 5、6、7 阶增量占比越来越小，后半段反而停滞显平。",
  },
  {
    id: "B",
    label: "方案 B",
    radii: (i, n) => {
      const u = i / (n - 1); // 过陡尾爆 p=2.85
      return 0.25 + 0.75 * u ** 2.85;
    },
    correct: false,
    reason: "方案 B 的幂指数过高（p=2.85）：前 4 颗圆几乎卡在同样细小的尺寸上原地踏步，直到最后两阶才突然暴涨，整条阶梯变成后段悬崖。",
  },
  {
    id: "C",
    label: "方案 C",
    radii: (i, n) => {
      const u = i / (n - 1); // 均匀等比感 p=1.48（每步接近同倍率放大）
      return 0.25 + 0.75 * u ** 1.48;
    },
    correct: true,
    reason: "答对了！方案 C 落在近等比步进带（p=1.48）：每一阶相对前一阶按相近倍率舒展放大，既没有方案 A 的前段突跳，也没有方案 B 的尾端爆冲或方案 D 的中段卡壳，人眼扫过去最匀速流畅。",
  },
  {
    id: "D",
    label: "方案 D",
    radii: (i, n) => {
      // 中段平台（3-5 阶停滞相同）
      const vals = [0.25, 0.44, 0.56, 0.56, 0.56, 0.78, 1.0];
      return vals[i] ?? 1;
    },
    correct: false,
    reason: "方案 D 在第 3、4、5 阶卡成了一模一样大的平段：虽然整体是从小到大，但中间三步突然停止成长，视线过渡在半路明显顿了一下。",
  },
];

export function initSec07(root) {
  const buttons = [...root.querySelectorAll("[data-quiz]")];
  const feedback = root.querySelector("#s07-feedback");

  function drawOptionCanvas(btn, opt) {
    const canvas = btn.querySelector("canvas");
    if (!canvas) return;
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#EFE7FA");
    bg.addColorStop(1, "#FDE6CA");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const n = 7;
    const padX = Math.min(28, w * 0.1);
    const maxR = Math.min(h * 0.34, (w - padX * 2) / (n * 2.15));
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const scale = opt.radii(i, n);
      const r = maxR * scale;
      const cx = padX + u * (w - padX * 2);
      const cy = h * 0.52;
      const rgb = interpolateColor("#8D62C8", "#F55B1E", u, "oklch");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = rgbToCss(rgb, 0.34 + 0.64 * u);
      ctx.fill();
    }
  }

  function redrawAll() {
    buttons.forEach((btn) => {
      const opt = QUIZ_OPTIONS.find((o) => o.id === btn.dataset.quiz);
      if (opt) drawOptionCanvas(btn, opt);
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const opt = QUIZ_OPTIONS.find((o) => o.id === btn.dataset.quiz);
      if (!opt) return;
      buttons.forEach((b) => {
        const o = QUIZ_OPTIONS.find((x) => x.id === b.dataset.quiz);
        b.classList.remove("is-selected", "is-right", "is-wrong");
        b.setAttribute("aria-pressed", String(b === btn));
        if (b === btn) b.classList.add("is-selected", opt.correct ? "is-right" : "is-wrong");
        else if (o?.correct) b.classList.add("is-right");
      });
      feedback.hidden = false;
      feedback.dataset.state = opt.correct ? "ok" : "warn";
      feedback.innerHTML = `<strong>${opt.correct ? "判断准确 · 方案 C" : `你选了 ${opt.label}（最佳为方案 C）`}</strong><p>${opt.reason}</p>`;
    });
  });

  window.addEventListener("resize", redrawAll);
  requestAnimationFrame(redrawAll);
}
