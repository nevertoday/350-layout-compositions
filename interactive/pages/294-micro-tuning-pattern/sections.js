// 294 微调模式 · 正文 01–07 节独立交互实验模块
// 原则：相邻两节绝不用同一种控件做同一件事，每个读数从真实几何单真源算出。

import { loop, pixelRatio } from "../../lib/stage.js";

const crisp = (v) => Math.round(v) + 0.5;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ============================================================
// 01 基线与光学补偿：三态剖面切签 + 选中单元素重心透视
// ============================================================
export function initOpticalLab() {
  const canvas = document.getElementById("optical-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const modeBtns = [...document.querySelectorAll("[data-opt-mode]")];
  const focusBtns = [...document.querySelectorAll("[data-opt-focus]")];
  const noteEl = document.getElementById("optical-note");
  const metricEl = document.getElementById("optical-metric");

  const st = {
    mode: "math", // "math" | "optical" | "grid4"
    focus: "circle", // "circle" | "play" | "cjk"
  };

  const NOTES = {
    math: {
      circle: "几何齐平时，圆字「O」与方字「H」上下顶线完全同高（0% 过冲）。但圆形只在上下极点触线，两肩大面积内收，眼睛会觉得「O」比「H」矮了一截。",
      play: "几何居中时，播放三角「▶」的包围盒中点落在圆心（0px 偏移）。但三角形面积集中在左侧底边，视觉重心明显偏向圆心左边，看起来像要掉出圆外。",
      cjk: "汉字「设」与西文「H」共排一行时，若只按外框底边对齐，汉字重心往往偏低或偏高，需以视觉基线微调 1–2px 才能压住同一水平势。",
    },
    optical: {
      circle: "开启光学补偿后，圆形「O」上下各自微微冲出基线与顶线约 2%（字型学称「过冲 Overshoot」），两肩的视觉体量立刻与方字「H」站成同一排。",
      play: "把播放三角向右微移 +2px（约占圆径 6%），让三角形的视觉质心而非几何外框落在圆心上，图标瞬间稳住——这就是为什么海报说「对齐」，实战里还要靠眼睛验收。",
      cjk: "汉字基线微抬 +1.5px 贴合西文视觉底势，整行混排在扫读时不再忽高忽低，既守住了基线纪律又照顾了字形体量差异。",
    },
    grid4: {
      circle: "叠上原海报 05 模块的 4px 基线网格（0 / 4 / 8 / 12 / 16 / 20 / 24 / 28）：正文字行高定为 20px（4px × 5），每行字底都钉死在 4px 节拍线上。",
      play: "按钮图标高度取 4px 倍数（如 24px / 32px），外部容器严格扣在 4px 网格上，内部三角形仍保留 +1.5px 光学微调——「外框守网格，内芯顺人眼」。",
      cjk: "4px 网格不是拿来卡死视觉补偿的牢笼：容器与行高守住 4 的倍数建立跨栏对齐，字形与图标内部允许 1px–2px 的光学过冲。",
    },
  };

  function updateCopy() {
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.optMode === st.mode)));
    focusBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.optFocus === st.focus)));
    if (noteEl) noteEl.textContent = NOTES[st.mode][st.focus];
    if (metricEl) {
      metricEl.textContent =
        st.mode === "math"
          ? "O 过冲 0% · ▶ 偏移 0px · 行高 未锁网"
          : st.mode === "optical"
          ? "O 过冲 +2.5% · ▶ 视觉右移 +2px · 汉字基线 +1.5px"
          : "基线格 4px · 行高 20px (5格) · 外守网内顺眼";
    }
  }

  function draw() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(r.width * dpr);
    const ph = Math.round(r.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = r.width;
    const H = r.height;
    const compact = W < 500;
    const padX = compact ? 16 : 32;

    ctx.fillStyle = "#FBF9F7";
    ctx.fillRect(0, 0, W, H);

    // 4px 基线网格模式背景
    if (st.mode === "grid4") {
      const step = compact ? 10 : 12; // 视觉放大 4px 网格（1格代表 4px）
      const labels = [0, 4, 8, 12, 16, 20, 24, 28];
      const topY = Math.round(H * 0.14);
      labels.forEach((val, idx) => {
        const y = topY + idx * step * 2.1;
        if (y > H - 18) return;
        const isBase = val === 20;
        ctx.strokeStyle = isBase ? "#0025D3" : "rgba(0, 37, 211, 0.18)";
        ctx.lineWidth = isBase ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(padX + 24, crisp(y));
        ctx.lineTo(W - padX, crisp(y));
        ctx.stroke();

        ctx.fillStyle = isBase ? "#0025D3" : "#5A5650";
        ctx.font = `700 10px "Space Mono", monospace`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(String(val), padX + 18, y);
      });
      ctx.textAlign = "left";
    }

    // 基准线与顶线
    const capH = compact ? 64 : 92;
    const baseY = Math.round(H * 0.72);
    const capY = baseY - capH;
    const isOpt = st.mode === "optical" || st.mode === "grid4";

    ctx.strokeStyle = "#0025D3";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padX, crisp(baseY));
    ctx.lineTo(W - padX, crisp(baseY));
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 37, 211, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, crisp(capY));
    ctx.lineTo(W - padX, crisp(capY));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#0025D3";
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.textBaseline = "top";
    ctx.fillText("BASELINE 0pt", padX, baseY + 6);
    ctx.textBaseline = "bottom";
    ctx.fillText("CAP HEIGHT", padX, capY - 5);

    // 四枚几何/字形对照标本：H（参照方字） · O（圆过冲） · 设（汉字混排） · ▶（圆钮光学居中）
    const cols = 4;
    const usableW = W - padX * 2 - (st.mode === "grid4" ? 20 : 0);
    const leftStart = padX + (st.mode === "grid4" ? 20 : 0);
    const slotW = usableW / cols;

    // 1. 参照字母 H（精确贴死 capY 与 baseY）
    const hx = leftStart + slotW * 0.5;
    const hw = capH * 0.66;
    const strokeW = Math.round(capH * 0.16);
    ctx.fillStyle = "#070706";
    ctx.fillRect(Math.round(hx - hw / 2), capY, strokeW, capH);
    ctx.fillRect(Math.round(hx + hw / 2 - strokeW), capY, strokeW, capH);
    ctx.fillRect(Math.round(hx - hw / 2), Math.round(capY + capH * 0.44), Math.round(hw), strokeW);

    // 2. 圆形字母 O（几何 vs 光学过冲）
    const ox = leftStart + slotW * 1.5;
    const overshoot = isOpt ? Math.round(capH * 0.055) : 0; // 放大呈现 2-3% 过冲使肉眼立判
    const oR = (capH + overshoot * 2 - strokeW) / 2;
    const oCy = (capY + baseY) / 2;
    if (st.focus === "circle") {
      ctx.fillStyle = isOpt ? "rgba(0, 37, 211, 0.07)" : "rgba(238, 55, 1, 0.08)";
      ctx.fillRect(Math.round(ox - slotW * 0.42), capY - 14, Math.round(slotW * 0.84), capH + 34);
    }
    ctx.strokeStyle = "#070706";
    ctx.lineWidth = strokeW;
    ctx.beginPath();
    ctx.arc(ox, oCy, oR, 0, Math.PI * 2);
    ctx.stroke();

    // 过冲红/蓝放大标线
    if (isOpt) {
      ctx.strokeStyle = "#0025D3";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ox - 20, crisp(capY - overshoot));
      ctx.lineTo(ox + 20, crisp(capY - overshoot));
      ctx.moveTo(ox - 20, crisp(baseY + overshoot));
      ctx.lineTo(ox + 20, crisp(baseY + overshoot));
      ctx.stroke();
      ctx.fillStyle = "#0025D3";
      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("+过冲补偿", ox, capY - overshoot - 3);
    } else {
      ctx.fillStyle = "#B82800";
      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("视觉显矮", ox, capY - 4);
    }

    // 3. 汉字「设」
    const cx = leftStart + slotW * 2.5;
    const cjkShift = isOpt ? -2.5 : 3.5;
    if (st.focus === "cjk") {
      ctx.fillStyle = isOpt ? "rgba(0, 37, 211, 0.07)" : "rgba(238, 55, 1, 0.08)";
      ctx.fillRect(Math.round(cx - slotW * 0.42), capY - 14, Math.round(slotW * 0.84), capH + 34);
    }
    ctx.fillStyle = "#070706";
    ctx.font = `900 ${Math.round(capH * 0.94)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("设", cx, baseY + cjkShift);
    ctx.fillStyle = isOpt ? "#0025D3" : "#B82800";
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.textBaseline = "bottom";
    ctx.fillText(isOpt ? "视觉齐平" : "底框偏沉", cx, capY - 4);

    // 4. 圆形播放按钮 ▶（几何居中 vs 光学右移）
    const px = leftStart + slotW * 3.5;
    const pR = Math.round(capH * 0.48);
    const pCy = Math.round((capY + baseY) / 2);
    if (st.focus === "play") {
      ctx.fillStyle = isOpt ? "rgba(0, 37, 211, 0.07)" : "rgba(238, 55, 1, 0.08)";
      ctx.fillRect(Math.round(px - slotW * 0.42), capY - 14, Math.round(slotW * 0.84), capH + 34);
    }
    ctx.fillStyle = "#070706";
    ctx.beginPath();
    ctx.arc(px, pCy, pR, 0, Math.PI * 2);
    ctx.fill();

    // 圆心竖辅助线
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(crisp(px), pCy - pR + 4);
    ctx.lineTo(crisp(px), pCy + pR - 4);
    ctx.stroke();

    // 播放三角（光学右移 +pR*0.14）
    const triShift = isOpt ? pR * 0.14 : 0;
    const triR = pR * 0.46;
    const tx0 = px - triR * 0.72 + triShift;
    const tx1 = px + triR * 0.95 + triShift;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(tx0, pCy - triR * 0.86);
    ctx.lineTo(tx1, pCy);
    ctx.lineTo(tx0, pCy + triR * 0.86);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isOpt ? "#0025D3" : "#B82800";
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(isOpt ? "+2px 光学居中" : "0px 视觉偏左", px, capY - 4);
    ctx.textAlign = "left";
  }

  const ctl = loop(canvas, () => draw());
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.mode = b.dataset.optMode;
      updateCopy();
      ctl.draw();
    })
  );
  focusBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.focus = b.dataset.optFocus;
      updateCopy();
      ctl.draw();
    })
  );
  window.addEventListener("resize", () => ctl.draw());
  updateCopy();
}

// ============================================================
// 02 4px 模数与间距节拍：DPR 倍率切钮 + 实尺刻度点击 + 格式塔亲疏预览
// ============================================================
export function initSpacingLab() {
  const rulerEl = document.getElementById("modulus-ruler");
  if (!rulerEl) return;
  const dprBtns = [...document.querySelectorAll("[data-dpr]")];
  const tickBtns = [...rulerEl.querySelectorAll("[data-gap-px]")];
  const calcEl = document.getElementById("spacing-calc");
  const verdictEl = document.getElementById("spacing-verdict");
  const explainEl = document.getElementById("spacing-explain");
  const demoCard = document.getElementById("proximity-demo");
  const innerTag = document.getElementById("prox-inner-val");
  const outerTag = document.getElementById("prox-outer-val");

  const st = { dpr: 1.5, px: 13 }; // 开场停在 13px × @1.5x = 19.5 物理像素（真实反例！）

  function render() {
    dprBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.dpr) === st.dpr)));
    tickBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.gapPx) === st.px)));

    const phys = Math.round(st.px * st.dpr * 100) / 100;
    const isIntPhys = Math.abs(phys - Math.round(phys)) < 0.001;
    const is4n = st.px % 4 === 0;
    const is8n = st.px % 8 === 0;

    if (calcEl) {
      calcEl.textContent = `${st.px}px × @${st.dpr}x = ${phys} 物理像素`;
    }
    if (verdictEl) {
      if (!isIntPhys) {
        verdictEl.textContent = "落到半像素 · 折算失整";
        verdictEl.dataset.state = "err";
      } else if (!is4n) {
        verdictEl.textContent = "非 4px 模数 · 节拍零碎";
        verdictEl.dataset.state = "err";
      } else if (is8n) {
        verdictEl.textContent = "8px 主模数 · 全倍率落整";
        verdictEl.dataset.state = "ok";
      } else {
        verdictEl.textContent = "4px 子模数 · 紧凑落整";
        verdictEl.dataset.state = "ok";
      }
    }
    if (explainEl) {
      if (!isIntPhys) {
        explainEl.textContent = `${st.px}px 在 @${st.dpr}x 屏上折算出 ${phys} 个物理像素，多出 0.5 颗像素的零头；浏览器只能靠抗锯齿或四舍五入硬凑，相邻两道缝宽会差出 1px。换成 4 或 8 的倍数立刻落整。`;
      } else if (!is4n) {
        explainEl.textContent = `虽然 ${st.px}px 在 @${st.dpr}x 下刚好是整数，但切到 @1.5x 就会裂出半像素；更重要的是 10px、13px、15px 这类随手数字无法和 4 / 8 / 16 / 24px 的字号与行高形成倍比节奏。`;
      } else {
        explainEl.textContent = `${st.px}px 是标准 ${is8n ? "8px 基准" : "4px 子网格"}倍数（Material Design 文档中的 8dp / 4dp 同源逻辑）：在 @1x、@1.5x、@2x、@3x 屏幕下都稳稳落到整数物理像素，组件之间天然对齐。`;
      }
    }

    // 同步亲疏对比卡片：内部标题副标间距 vs 卡片间外部间距
    if (demoCard) {
      const outer = is4n ? Math.max(16, st.px * 2) : st.px;
      demoCard.style.setProperty("--inner-gap", `${st.px}px`);
      demoCard.style.setProperty("--outer-gap", `${Math.min(40, outer)}px`);
      if (innerTag) innerTag.textContent = `组内 ${st.px}px`;
      if (outerTag) outerTag.textContent = `组外 ${Math.min(40, outer)}px${outer <= st.px ? "（内外同距，分层模糊）" : "（组内紧、组外松）"}`;
    }
  }

  dprBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.dpr = Number(b.dataset.dpr);
      render();
    })
  );
  tickBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.px = Number(b.dataset.gapPx);
      render();
    })
  );
  render();
}

// ============================================================
// 03 亚像素暗室与描边居中：双联光学显微镜 Canvas（深钴暗室）
// ============================================================
export function initSubpixelLab() {
  const canvas = document.getElementById("subpixel-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const rangeEl = document.getElementById("subpixel-range");
  const rangeValEl = document.getElementById("subpixel-val");
  const strokeBtns = [...document.querySelectorAll("[data-stroke-pos]")];
  const widthBtns = [...document.querySelectorAll("[data-stroke-w]")];
  const readoutEl = document.getElementById("subpixel-readout");

  const st = {
    offset: 0.3, // 开场刻意停在原海报 04 的「0.3px 偏移 模糊」
    strokePos: "center", // "inside" | "center" | "outside"
    strokeW: 1, // 1 | 2
  };

  function updateReadout() {
    if (rangeValEl) rangeValEl.textContent = `${st.offset.toFixed(1)}px`;
    strokeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.strokePos === st.strokePos)));
    widthBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.strokeW) === st.strokeW)));

    if (!readoutEl) return;
    const leftText =
      st.offset < 0.05
        ? "镜 A（像素对齐）：0.0px 整像素落点，实心边缘全部落进整颗像素格，1px 边界如刀锋锐利。"
        : `镜 A（像素对齐）：${st.offset.toFixed(1)}px 亚像素偏移把 1px 边缘拆给相邻两列（占比 ${Math.round((1 - st.offset) * 100)}% 与 ${Math.round(st.offset * 100)}%），肉眼立刻感到发灰发虚。`;
    const rightText =
      st.strokePos === "center" && st.strokeW === 1
        ? "镜 B（描边切面）：1px 居中描边落在整数边界线上时，左右各占 0.5px，两条边同时灰化；要么改为内/外描边，要么像 Canvas 规范那样平移 0.5px，或改用 2px 偶宽描边。"
        : st.strokePos === "inside"
        ? `镜 B（描边切面）：${st.strokeW}px 内描边严格收进整数外框之内，盒模型尺寸不变且边缘落整。`
        : st.strokePos === "outside"
        ? `镜 B（描边切面）：${st.strokeW}px 外描边向外长出整数像素，内芯面积不被挤压且像素全亮。`
        : "镜 B（描边切面）：2px 偶宽居中描边在整数边界左右各占整整 1 颗像素，不裂半像素。";
    readoutEl.textContent = `${leftText} ${rightText}`;
  }

  function draw() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(r.width * dpr);
    const ph = Math.round(r.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = r.width;
    const H = r.height;
    const stacked = W < 560;
    const pad = stacked ? 14 : 24;

    // 深钴光学暗室底
    ctx.fillStyle = "#07113A";
    ctx.fillRect(0, 0, W, H);

    const boxW = stacked ? W - pad * 2 : (W - pad * 3) / 2;
    const boxH = stacked ? (H - pad * 3) / 2 : H - pad * 2;

    // 左镜（或上镜）：像素对齐检查 0.3px 偏移
    drawLensPixel(ctx, pad, pad, boxW, boxH, st.offset);

    // 右镜（或下镜）：描边定位（内/中/外）
    const rx = stacked ? pad : pad * 2 + boxW;
    const ry = stacked ? pad * 2 + boxH : pad;
    drawLensStroke(ctx, rx, ry, boxW, boxH, st.strokePos, st.strokeW);
  }

  function drawLensPixel(ctx, x, y, w, h, offset) {
    ctx.fillStyle = "#0C1A52";
    ctx.fillRect(x, y, w, h);
    const sharp = offset < 0.05;
    ctx.strokeStyle = sharp ? "#82A6FF" : "#FF8057";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(crisp(x), crisp(y), Math.round(w) - 1, Math.round(h) - 1);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("镜 A · 像素对齐显微镜", x + 12, y + 10);

    ctx.fillStyle = sharp ? "#82A6FF" : "#FF8057";
    ctx.font = `700 11px "Space Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(sharp ? "0.0px SHARP" : `+${offset.toFixed(1)}px BLUR`, x + w - 12, y + 11);
    ctx.textAlign = "left";

    // 绘制 12×7 放大像素矩阵：左侧一根 1px 细竖线 + 右侧一块 4×5 实方块
    const cols = 12;
    const rows = 7;
    const maxW = w - 28;
    const maxH = h - 56;
    const cell = Math.floor(Math.min(maxW / cols, maxH / rows));
    const gw = cell * cols;
    const gh = cell * rows;
    const gx = Math.round(x + (w - gw) / 2);
    const gy = Math.round(y + 36 + (maxH - gh) / 2);

    const spans = [
      [2 + offset, 3 + offset], // 1px 细线
      [6 + offset, 10 + offset], // 实心方块
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cov = 0;
        if (r >= 1 && r < 6) {
          for (const [s0, s1] of spans) {
            cov = Math.max(cov, clamp(Math.min(c + 1, s1) - Math.max(c, s0), 0, 1));
          }
        }
        // 在深钴底上以纯白像素展示亮度覆盖率
        const bgR = 12, bgG = 26, bgB = 82;
        const fgR = 248, fgG = 250, fgB = 255;
        const rr = Math.round(bgR + (fgR - bgR) * cov);
        const gg = Math.round(bgG + (fgG - bgG) * cov);
        const bb = Math.round(bgB + (fgB - bgB) * cov);
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell);

        if (cov > 0.03 && cov < 0.97) {
          ctx.strokeStyle = "#FF8057";
          ctx.lineWidth = 1.4;
          ctx.strokeRect(gx + c * cell + 1, gy + r * cell + 1, cell - 2, cell - 2);
        }
      }
    }

    ctx.strokeStyle = "rgba(130, 166, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      ctx.moveTo(crisp(gx + i * cell), gy);
      ctx.lineTo(crisp(gx + i * cell), gy + gh);
    }
    for (let j = 0; j <= rows; j++) {
      ctx.moveTo(gx, crisp(gy + j * cell));
      ctx.lineTo(gx + gw, crisp(gy + j * cell));
    }
    ctx.stroke();
  }

  function drawLensStroke(ctx, x, y, w, h, pos, sw) {
    ctx.fillStyle = "#0C1A52";
    ctx.fillRect(x, y, w, h);
    const blurry = pos === "center" && sw === 1;
    ctx.strokeStyle = blurry ? "#FF8057" : "#82A6FF";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(crisp(x), crisp(y), Math.round(w) - 1, Math.round(h) - 1);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("镜 B · 描边边界切面", x + 12, y + 10);

    const posLabel = pos === "inside" ? "内描边" : pos === "outside" ? "外描边" : "居中描边";
    ctx.fillStyle = blurry ? "#FF8057" : "#82A6FF";
    ctx.font = `700 11px "Space Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(`${posLabel} · ${sw}px`, x + w - 12, y + 11);
    ctx.textAlign = "left";

    // 放大绘制组件左边界像素列（第 5 列为几何框线 x = 5.0）
    const cols = 10;
    const rows = 7;
    const maxW = w - 28;
    const maxH = h - 56;
    const cell = Math.floor(Math.min(maxW / cols, maxH / rows));
    const gw = cell * cols;
    const gh = cell * rows;
    const gx = Math.round(x + (w - gw) / 2);
    const gy = Math.round(y + 36 + (maxH - gh) / 2);

    const edge = 4; // 盒模型左外边线在 c = 4 整数格线
    let s0 = edge;
    let s1 = edge + sw;
    if (pos === "center") {
      s0 = edge - sw / 2;
      s1 = edge + sw / 2;
    } else if (pos === "outside") {
      s0 = edge - sw;
      s1 = edge;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 盒内背景（c >= edge && r >= 1 && r < 6）用浅钴底
        const inside = c >= edge && c < 9 && r >= 1 && r < 6;
        let bgR = inside ? 28 : 12;
        let bgG = inside ? 52 : 26;
        let bgB = inside ? 132 : 82;

        let cov = 0;
        if (r >= 1 && r < 6) {
          cov = clamp(Math.min(c + 1, s1) - Math.max(c, s0), 0, 1);
        }
        const fgR = 248, fgG = 250, fgB = 255;
        const rr = Math.round(bgR + (fgR - bgR) * cov);
        const gg = Math.round(bgG + (fgG - bgG) * cov);
        const bb = Math.round(bgB + (fgB - bgB) * cov);
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell);

        if (cov > 0.03 && cov < 0.97) {
          ctx.strokeStyle = "#FF8057";
          ctx.lineWidth = 1.4;
          ctx.strokeRect(gx + c * cell + 1, gy + r * cell + 1, cell - 2, cell - 2);
        }
      }
    }

    ctx.strokeStyle = "rgba(130, 166, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      ctx.moveTo(crisp(gx + i * cell), gy);
      ctx.lineTo(crisp(gx + i * cell), gy + gh);
    }
    for (let j = 0; j <= rows; j++) {
      ctx.moveTo(gx, crisp(gy + j * cell));
      ctx.lineTo(gx + gw, crisp(gy + j * cell));
    }
    ctx.stroke();

    // 标出整数外框线位置（朱红虚线）
    ctx.strokeStyle = "#FF8057";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(crisp(gx + edge * cell), gy - 4);
    ctx.lineTo(crisp(gx + edge * cell), gy + gh + 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const ctl = loop(canvas, () => draw());

  if (rangeEl) {
    rangeEl.addEventListener("input", () => {
      st.offset = Number(rangeEl.value);
      updateReadout();
      ctl.draw();
    });
  }
  strokeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.strokePos = b.dataset.strokePos;
      updateReadout();
      ctl.draw();
    })
  );
  widthBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.strokeW = Number(b.dataset.strokeW);
      updateReadout();
      ctl.draw();
    })
  );
  window.addEventListener("resize", () => ctl.draw());
  updateReadout();
}

// ============================================================
// 04 从纸媒网格到跨屏微调：时间轴切卡 + Tiny Tweaks 三屏单栏实景
// ============================================================
export function initOriginLab() {
  const eraBtns = [...document.querySelectorAll("[data-era]")];
  const eraPanels = [...document.querySelectorAll("[data-era-panel]")];
  eraBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const target = btn.dataset.era;
      eraBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === target)));
      eraPanels.forEach((p) => {
        p.hidden = p.dataset.eraPanel !== target;
      });
    })
  );

  // Tiny Tweaks 单栏跨屏微调演示
  const vpBtns = [...document.querySelectorAll("[data-tt-vp]")];
  const preview = document.getElementById("tt-preview");
  const diffEl = document.getElementById("tt-diff");
  if (!preview || !vpBtns.length) return;

  const SPECS = {
    "375": {
      cls: "vp-375",
      diff: "375px 手机 · 1 栏骨架不变 · 标题 20px / 正文 14px / 行高 24px / 内距 16px",
    },
    "768": {
      cls: "vp-768",
      diff: "768px 平板 · 1 栏骨架不变 · 标题 +4px (24px) / 正文 +2px (16px) / 行高 28px / 内距 24px",
    },
    "1280": {
      cls: "vp-1280",
      diff: "1280px 桌面 · 1 栏骨架不变 · 标题 +8px (28px) / 正文 16px 限宽 60ch / 内距 32px",
    },
  };

  function setVp(vp) {
    const s = SPECS[vp] || SPECS["375"];
    vpBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ttVp === vp)));
    preview.className = `tt-frame ${s.cls}`;
    if (diffEl) diffEl.textContent = s.diff;
  }

  vpBtns.forEach((b) => b.addEventListener("click", () => setVp(b.dataset.ttVp)));
  setVp("768");
}

// ============================================================
// 05 什么时候用与什么时候别用：4 张工作情境判别翻卡
// ============================================================
export function initScenarioCards() {
  const btns = [...document.querySelectorAll("[data-scenario-toggle]")];
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".scenario-card");
      const ans = card?.querySelector(".scenario-answer");
      if (!ans) return;
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      ans.hidden = open;
      btn.textContent = open ? "查看工程判断" : "收起判断";
    });
  });
}

// ============================================================
// 06 眼力校对小练习：四张只差 1 个变量的等大 UI 标本 + X 光标尺透视揭晓
// ============================================================
export function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  if (!grid) return;
  const opts = [...grid.querySelectorAll("[data-quiz-opt]")];
  const resultEl = document.getElementById("quiz-result");
  const resetBtn = document.getElementById("quiz-reset");

  const FEEDBACK = {
    A: "选了 A：它的基线和 8px/16px 间距都对，但左侧圆形按钮里的播放三角用了严格数学居中（0px），由于三角形左重右轻，肉眼看明显偏左。看叠加出的红线就能发现重心没落到圆心。",
    B: "选了 B：它的播放三角做了光学右移、文字基线也齐平，但标题下与副标下的两道缝都是 10px——既不是 4px 模数，又让「主副信息组」和「辅助元信息」亲疏不分。",
    C: "答对了，就是 C！四处细节同时过关：左侧徽标与标题底脚齐平 0px、组内 8px 与组外 16px 守住 4px 亲疏倍比、1px 边框落整像素、播放三角右移 +1.8px 达到视觉居中。",
    D: "选了 D：它的间距和播放三角都很稳，但左侧「专题」小标签与右侧主标题的基线错开了 +2px，视线横向滑过去时会出现轻微下坠感。",
  };

  function choose(letter) {
    grid.classList.add("revealed");
    opts.forEach((btn) => {
      const id = btn.dataset.quizOpt;
      btn.setAttribute("aria-pressed", String(id === letter));
      btn.dataset.mark = id === "C" ? "correct" : id === letter ? "wrong" : "neutral";
    });
    if (resultEl) {
      resultEl.hidden = false;
      resultEl.dataset.state = letter === "C" ? "ok" : "err";
      resultEl.textContent = FEEDBACK[letter];
    }
    if (resetBtn) resetBtn.hidden = false;
  }

  opts.forEach((btn) => btn.addEventListener("click", () => choose(btn.dataset.quizOpt)));

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      grid.classList.remove("revealed");
      opts.forEach((btn) => {
        btn.setAttribute("aria-pressed", "false");
        delete btn.dataset.mark;
      });
      if (resultEl) resultEl.hidden = true;
      resetBtn.hidden = true;
    });
  }
}

// ============================================================
// 07 原海报灯箱：单源复用 #poster.src，支持放大、拖拽、Esc 关闭
// ============================================================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const stage = document.getElementById("poster-modal-stage");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  if (!poster || !modal || !modalImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    if (!modalImg.src) modalImg.src = poster.src;
    reset();
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

  openBtn?.addEventListener("click", open);
  poster.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });
  zoomIn?.addEventListener("click", () => {
    scale = clamp(scale * 1.28, 0.8, 4);
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    scale = clamp(scale / 1.28, 0.8, 4);
    if (scale <= 1.01) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn?.addEventListener("click", reset);

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale * (e.deltaY < 0 ? 1.12 : 0.89), 0.8, 4);
    if (scale <= 1.01) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  modalImg.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    try { modalImg.setPointerCapture(e.pointerId); } catch {}
    pan = { x: e.clientX - tx, y: e.clientY - ty };
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => { pan = null; });
  modalImg.addEventListener("pointercancel", () => { pan = null; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
