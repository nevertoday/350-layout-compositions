// 第 01–08 节各独立互动组件：相邻两节控件类型互不重复，全部离线上色与程序纹理

import { pixelRatio } from "../../lib/stage.js";
import { MATERIALS } from "./model.js";
import { getEqualGrayTexture, getTextureSet } from "./textures.js";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(10, Math.round(rect.width));
  const h = Math.max(10, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ---------- 01 节：去色同形双面剖检仪（竖向拖动拉幕 + 底部微影剖面波） ----------
const LOUPE_PAIRS = {
  rough_smooth: {
    left: "rough",
    right: "smooth",
    leftLabel: "粗糙砂岩（等灰均值）",
    rightLabel: "光滑漆面（等灰均值）",
    waveLeft: "高频凹凸峰谷，光线散向四面",
    waveRight: "平整微面，入射光集中成镜面反射",
    summary: "两块正方形去掉色相、调成完全一致的平均灰度后，边界依旧在 0.1 秒内跳出——因为左半高频微影与右半平滑反光属于完全不同的纹理元密度。",
  },
  paper_metal: {
    left: "paper",
    right: "metal",
    leftLabel: "手工棉纸（等灰均值）",
    rightLabel: "拉丝冷钢（等灰均值）",
    waveLeft: "随机游走短纤维，柔和漫反射",
    waveRight: "定向平行细槽，产生各向异性条状光泽",
    summary: "纤维是无方向性的温和网纹，拉丝金属是强方向性的平行高光带；即使同为中灰，人眼瞬间分出温润纸面与冷硬金属。",
  },
  grainy_paper: {
    left: "grainy",
    right: "paper",
    leftLabel: "粗粒陶土（等灰均值）",
    rightLabel: "手工棉纸（等灰均值）",
    waveLeft: "密集颗粒点簇，对比振幅大",
    waveRight: "细腻纤维底，对比振幅温和",
    summary: "两者都是哑光、都不靠镜面高光，但颗粒密度与明暗振幅拉开落差——粗粒显得向前逼近，棉纸安静退后作底。",
  },
};

export function initSplitLoupe() {
  const wrap = document.getElementById("loupe-wrap");
  const canvas = document.getElementById("loupe-canvas");
  const handle = document.getElementById("loupe-handle");
  const note = document.getElementById("loupe-note");
  const pairBtns = [...document.querySelectorAll("[data-loupe-pair]")];
  if (!wrap || !canvas || !handle) return;

  let split = 0.5;
  let pairKey = "rough_smooth";
  const texSet = getTextureSet();

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    const pair = LOUPE_PAIRS[pairKey];
    const topH = Math.round(h * 0.72);
    const sx = Math.round(w * split);

    const leftImg = getEqualGrayTexture(pair.left);
    const rightImg = getEqualGrayTexture(pair.right);

    // 左侧等灰纹理
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, sx, topH);
    ctx.clip();
    const patL = ctx.createPattern(leftImg, "repeat");
    ctx.fillStyle = patL;
    ctx.fillRect(0, 0, sx, topH);
    if (pair.left === "smooth") drawGraySpecular(ctx, 0, 0, w, topH);
    if (pair.left === "metal") drawGrayBrushedSheen(ctx, 0, 0, w, topH);
    ctx.restore();

    // 右侧等灰纹理
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, 0, w - sx, topH);
    ctx.clip();
    const patR = ctx.createPattern(rightImg, "repeat");
    ctx.fillStyle = patR;
    ctx.fillRect(sx, 0, w - sx, topH);
    if (pair.right === "smooth") drawGraySpecular(ctx, 0, 0, w, topH);
    if (pair.right === "metal") drawGrayBrushedSheen(ctx, 0, 0, w, topH);
    ctx.restore();

    // 中缝边界线
    ctx.strokeStyle = "#B64E22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, h);
    ctx.stroke();

    // 上方等灰角标（带实心底板保证高对比）
    drawTag(ctx, 12, 12, pair.leftLabel, "left");
    drawTag(ctx, w - 12, 12, pair.rightLabel, "right");

    // 底部 28%：微观表面高度剖面波形（真实采样 textures.js 的 height 数组！）
    ctx.fillStyle = "#211A14";
    ctx.fillRect(0, topH, w, h - topH);

    const midY = topH + (h - topH) * 0.56;
    const amp = (h - topH) * 0.34;
    const hLeft = texSet[pair.left].height;
    const hRight = texSet[pair.right].height;

    ctx.strokeStyle = "rgba(242, 229, 212, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // 左半真实高度剖面线
    ctx.strokeStyle = "#E6B48F";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = 0; x <= sx; x += 2) {
      const idx = 128 * 256 + (Math.floor((x / w) * 256) % 256);
      const scale = pair.left === "rough" ? 1.0 : pair.left === "grainy" ? 0.95 : pair.left === "metal" ? 0.45 : pair.left === "paper" ? 0.25 : 0.03;
      const y = midY - (hLeft[idx] - 0.5) * amp * 2 * scale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 右半真实高度剖面线
    ctx.strokeStyle = "#F2E5D4";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = sx; x <= w; x += 2) {
      const idx = 128 * 256 + (Math.floor((x / w) * 256) % 256);
      const scale = pair.right === "rough" ? 1.0 : pair.right === "grainy" ? 0.95 : pair.right === "metal" ? 0.45 : pair.right === "paper" ? 0.25 : 0.03;
      const y = midY - (hRight[idx] - 0.5) * amp * 2 * scale;
      if (x === sx) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 剖面文字说明
    ctx.font = '600 11px "Chivo", "Noto Serif SC", serif';
    ctx.fillStyle = "#E8D7C3";
    ctx.textAlign = "left";
    ctx.fillText("表面微起伏剖面 · MICRO-PROFILE", 12, topH + 17);

    handle.style.left = `${(split * 100).toFixed(2)}%`;
    handle.setAttribute("aria-valuenow", String(Math.round(split * 100)));
    if (note) {
      note.textContent = `${pair.summary}（左：${pair.waveLeft}；右：${pair.waveRight}。）`;
    }
  }

  function drawGraySpecular(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "rgba(255,255,255,0.22)");
    g.addColorStop(0.45, "rgba(255,255,255,0.02)");
    g.addColorStop(0.56, "rgba(255,255,255,0.34)");
    g.addColorStop(1, "rgba(20,20,20,0.24)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }

  function drawGrayBrushedSheen(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h * 0.7);
    g.addColorStop(0, "rgba(20,20,20,0.16)");
    g.addColorStop(0.42, "rgba(255,255,255,0.32)");
    g.addColorStop(0.55, "rgba(30,30,30,0.18)");
    g.addColorStop(0.8, "rgba(255,255,255,0.22)");
    g.addColorStop(1, "rgba(20,20,20,0.2)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }

  function drawTag(ctx, x, y, text, align) {
    ctx.save();
    ctx.font = '600 12px "Noto Serif SC", serif';
    const tw = ctx.measureText(text).width;
    const padX = 10;
    const boxW = tw + padX * 2;
    const bx = align === "left" ? x : x - boxW;
    ctx.fillStyle = "rgba(31, 27, 23, 0.88)";
    ctx.fillRect(bx, y, boxW, 24);
    ctx.fillStyle = "#FAF4EB";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + padX, y + 12.5);
    ctx.restore();
  }

  let dragging = false;
  const setFromClientX = (cx) => {
    const rect = wrap.getBoundingClientRect();
    split = Math.max(0.14, Math.min(0.86, (cx - rect.left) / rect.width));
    draw();
  };

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  wrap.addEventListener("pointerdown", (e) => {
    if (e.target === handle || handle.contains(e.target)) return;
    dragging = true;
    setFromClientX(e.clientX);
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  handle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      split = Math.max(0.14, split - 0.05);
      draw();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      split = Math.min(0.86, split + 0.05);
      draw();
      e.preventDefault();
    }
  });

  pairBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      pairKey = btn.dataset.loupePair;
      pairBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      draw();
    });
  });

  new ResizeObserver(draw).observe(wrap);
  draw();
}

// ---------- 02 节：原海报五列法则 × 实景画册对照 ----------
const DIM_DATA = {
  contrast: {
    zh: "对比",
    en: "CONTRAST",
    quote: "制造视觉差异，增强画面张力",
    beforeLabel: "无质感对比（全哑光平涂）",
    afterLabel: "建立质感对比（粗岩底 × 亮漆印）",
    explain: "把高粗糙砂岩与低粗糙漆面紧贴并置，表面反射与颗粒密度瞬间拉开，画面在不动字号与颜色的前提下生出触觉张力。",
  },
  harmony: {
    zh: "协调",
    en: "HARMONY",
    quote: "平衡差异关系，保持整体统一",
    beforeLabel: "全屏粗料堆砌（噪音打架）",
    afterLabel: "棉纸休止底托住双焦（差异有归宿）",
    explain: "反差不是把五种粗材质塞满整页——用大面积柔和棉纸统一基调，让强质感只在局部发声，差异才能稳定共存。",
  },
  layer: {
    zh: "层次",
    en: "LAYER",
    quote: "通过质感变化，营造空间深度",
    beforeLabel: "三层同质（前后黏成一片）",
    afterLabel: "前景粗陶 → 中层棉纸 → 远底细雾",
    explain: "每一层叠边跨越不同的肌理粗细，无需加厚投影或画透视线，大脑就已经把粗颗粒推到近处、把细腻表面退到远处。",
  },
  focus: {
    zh: "关注",
    en: "FOCUS",
    quote: "利用质感反差，引导视觉焦点",
    beforeLabel: "焦点与背景同为纸感（隐身）",
    afterLabel: "哑光大底中亮出唯一金属徽标",
    explain: "在整片柔和哑光纸面上，只把关键徽标换成高反光拉丝金属，光线掠过时它成了全页唯一闪亮的纹理异类，视线直奔而去。",
  },
  mood: {
    zh: "情绪",
    en: "MOOD",
    quote: "不同质感传达，不同情绪氛围",
    beforeLabel: "冷硬拉丝金属基调（理性克制）",
    afterLabel: "粗粒赤陶 × 暖棉纸（手作温度）",
    explain: "同样一句展讯标题与版式，换成冷金属立刻带有工业与锋利感，换成手抄棉纸与陶土则转为温厚质朴的器物气息。",
  },
};

export function initFiveDimensions() {
  const cols = [...document.querySelectorAll("[data-dim]")];
  const canvas = document.getElementById("dim-canvas");
  const toggleBtn = document.getElementById("dim-toggle");
  const labelEl = document.getElementById("dim-state-label");
  const explainEl = document.getElementById("dim-explain");
  if (!cols.length || !canvas) return;

  let active = "contrast";
  let applied = true;
  const tex = getTextureSet();

  function fillTex(ctx, matId, x, y, w, h, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const p = ctx.createPattern(tex[matId].albedo, "repeat");
    ctx.fillStyle = p;
    ctx.fillRect(x, y, w, h);
    if (matId === "smooth") {
      const g = ctx.createRadialGradient(x + w * 0.34, y + h * 0.32, 4, x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.72);
      g.addColorStop(0, "rgba(255,244,228,0.48)");
      g.addColorStop(0.4, "rgba(180,140,105,0.12)");
      g.addColorStop(1, "rgba(20,10,4,0.34)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    } else if (matId === "metal") {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, "rgba(255,255,255,0.22)");
      g.addColorStop(0.45, "rgba(255,255,255,0.02)");
      g.addColorStop(0.58, "rgba(255,255,255,0.38)");
      g.addColorStop(1, "rgba(20,22,25,0.32)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  function drawCover(ctx, x, y, w, h, mode, isApplied) {
    // 一张比例固定的真实小型展览册封面，仅靠切换材质组合演绎五个维度
    let bg = "paper";
    let band = "paper";
    let emblem = "paper";
    let ink = "#1F1B17";
    let subInk = "#5A5045";

    if (mode === "contrast") {
      bg = isApplied ? "rough" : "paper";
      band = isApplied ? "paper" : "paper";
      emblem = isApplied ? "smooth" : "paper";
    } else if (mode === "harmony") {
      bg = isApplied ? "paper" : "rough";
      band = isApplied ? "grainy" : "grainy";
      emblem = isApplied ? "smooth" : "metal";
    } else if (mode === "layer") {
      bg = isApplied ? "paper" : "rough";
      band = isApplied ? "rough" : "rough";
      emblem = isApplied ? "grainy" : "rough";
    } else if (mode === "focus") {
      bg = "paper";
      band = "paper";
      emblem = isApplied ? "metal" : "paper";
    } else if (mode === "mood") {
      bg = isApplied ? "paper" : "metal";
      band = isApplied ? "grainy" : "smooth";
      emblem = isApplied ? "smooth" : "metal";
      if (!isApplied) {
        ink = "#FAF4EB";
        subInk = "#DDD5C9";
      }
    }

    // 1. 封面底材
    fillTex(ctx, bg, x, y, w, h);
    ctx.strokeStyle = "rgba(31,27,23,0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // 2. 中层腰封块
    const bx = x + w * 0.10;
    const by = y + h * 0.36;
    const bw = w * 0.80;
    const bh = h * 0.30;
    ctx.save();
    ctx.shadowColor = "rgba(31,22,12,0.18)";
    ctx.shadowBlur = isApplied ? 10 : 3;
    ctx.shadowOffsetY = isApplied ? 4 : 1;
    fillTex(ctx, band, bx, by, bw, bh);
    ctx.restore();
    ctx.strokeStyle = "rgba(31,27,23,0.16)";
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

    // 3. 前景焦点圆徽
    const er = Math.min(w, h) * 0.165;
    const ex = x + w * 0.66;
    const ey = y + h * 0.52;
    ctx.save();
    ctx.shadowColor = "rgba(25,16,8,0.28)";
    ctx.shadowBlur = isApplied ? 14 : 4;
    ctx.shadowOffsetY = isApplied ? 6 : 2;
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fillStyle = MATERIALS[emblem].hex;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.clip();
    fillTex(ctx, emblem, ex - er, ey - er, er * 2, er * 2);
    ctx.restore();

    // 封面排印文字（按宽高双限防任何纵横比下两行重叠）
    const titleSize = Math.max(16, Math.min(Math.round(w * 0.068), Math.round(h * 0.135)));
    const enSize = Math.max(10, Math.min(Math.round(w * 0.028), Math.round(h * 0.052)));
    const footSize = Math.max(11, Math.min(Math.round(w * 0.032), Math.round(h * 0.058)));
    const titleY = Math.round(y + h * 0.08);
    const enY = Math.round(titleY + titleSize * 1.18);

    ctx.fillStyle = ink;
    ctx.font = `900 ${titleSize}px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("物性志", x + w * 0.1, titleY);

    ctx.fillStyle = subInk;
    ctx.font = `600 ${enSize}px "Chivo", sans-serif`;
    ctx.fillText("MATTER & SURFACE · NO.103", x + w * 0.1, enY);

    ctx.fillStyle = subInk;
    ctx.font = `400 ${footSize}px "Noto Serif SC", serif`;
    ctx.fillText("秋季器物与纸材特展", x + w * 0.1, y + h * 0.80);
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const info = DIM_DATA[active];

    // 宽画布并排展示「未处理 vs 应用法则」双册对照；窄屏则根据 toggle 放大展示单册
    const wide = w >= 520;
    if (wide) {
      const gap = 22;
      const pad = 16;
      const cw = (w - pad * 2 - gap) / 2;
      const ch = h - 46;
      drawCover(ctx, pad, 34, cw, ch, active, false);
      drawCover(ctx, pad + cw + gap, 34, cw, ch, active, true);

      // 突出当前激活侧的赤陶顶框
      const hiX = applied ? pad + cw + gap : pad;
      ctx.strokeStyle = "#B64E22";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(hiX - 1, 33, cw + 2, ch + 2);

      ctx.font = '700 12px "Noto Serif SC", serif';
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = !applied ? "#963C16" : "#595046";
      ctx.fillText(`对照 · ${info.beforeLabel}`, pad, 10);
      ctx.fillStyle = applied ? "#963C16" : "#595046";
      ctx.fillText(`生效 · ${info.afterLabel}`, pad + cw + gap, 10);
    } else {
      const pad = 12;
      drawCover(ctx, pad, 32, w - pad * 2, h - 42, active, applied);
      ctx.font = '700 12px "Noto Serif SC", serif';
      ctx.fillStyle = applied ? "#963C16" : "#595046";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(applied ? `生效 · ${info.afterLabel}` : `对照 · ${info.beforeLabel}`, pad, 10);
    }

    if (labelEl) {
      labelEl.textContent = `${info.zh} ${info.en} — 「${info.quote}」`;
    }
    if (explainEl) {
      explainEl.textContent = info.explain;
    }
    if (toggleBtn) {
      toggleBtn.textContent = applied ? "切看未生效对照" : "切看生效状态";
      toggleBtn.setAttribute("aria-pressed", String(applied));
    }
  }

  cols.forEach((btn) => {
    btn.addEventListener("click", () => {
      active = btn.dataset.dim;
      applied = true;
      cols.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      draw();
    });
  });

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      applied = !applied;
      draw();
    });
  }

  new ResizeObserver(draw).observe(canvas);
  draw();
}

// ---------- 03 节：吉布森纹理梯度景深台（滑块 + 远粗近滑颠倒按钮） ----------
export function initDepthGradient() {
  const canvas = document.getElementById("depth-canvas");
  const range = document.getElementById("depth-range");
  const invertBtn = document.getElementById("depth-invert");
  const readout = document.getElementById("depth-readout");
  const ratioEl = document.getElementById("depth-ratio");
  if (!canvas || !range || !invertBtn) return;

  let grad = Number(range.value) / 100; // 0..1
  let inverted = false;
  const tex = getTextureSet();

  // 用不同缩放倍数的离屏图块模拟「粗近密远」纹理梯度（零透视线条）
  function fillScaledTex(ctx, img, x, y, w, h, scale, tintAlpha, tintColor) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const pat = ctx.createPattern(img, "repeat");
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w / scale + 2, h / scale + 2);
    ctx.setTransform(ctx.getTransform()); // keep dpr
    ctx.restore();
    if (tintAlpha > 0) {
      ctx.fillStyle = tintColor;
      ctx.globalAlpha = tintAlpha;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    // 三层水平景深带（完全没有斜线/消失点，只靠肌理颗粒尺度分前后）
    const nearScale = inverted ? 0.28 + (1 - grad) * 0.45 : 0.75 + grad * 1.15;
    const midScale = 0.62;
    const farScale = inverted ? 0.75 + grad * 1.15 : 0.65 - grad * 0.44;

    const hFar = Math.round(h * 0.34);
    const hMid = Math.round(h * 0.33);
    const hNear = h - hFar - hMid;

    // 远景带
    fillScaledTex(ctx, inverted ? tex.grainy.albedo : tex.paper.albedo, 0, 0, w, hFar, Math.max(0.18, farScale), inverted ? 0.1 : 0.26 * grad, "#E9DEC9");
    // 中景带
    fillScaledTex(ctx, tex.rough.albedo, 0, hFar, w, hMid, midScale, 0.08, "#2B1E14");
    // 近景带
    fillScaledTex(ctx, inverted ? tex.paper.albedo : tex.grainy.albedo, 0, hFar + hMid, w, hNear, Math.max(0.18, nearScale), inverted ? 0.12 : 0.04, "#3A2212");

    // 清晰分隔细线与三层标签
    ctx.strokeStyle = "rgba(31, 27, 23, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hFar + 0.5);
    ctx.lineTo(w, hFar + 0.5);
    ctx.moveTo(0, hFar + hMid + 0.5);
    ctx.lineTo(w, hFar + hMid + 0.5);
    ctx.stroke();

    const tags = [
      { y: 12, text: `远层 · 颗粒尺度 ${farScale.toFixed(2)}×` },
      { y: hFar + 12, text: `中层 · 颗粒尺度 ${midScale.toFixed(2)}×` },
      { y: hFar + hMid + 12, text: `近层 · 颗粒尺度 ${nearScale.toFixed(2)}×` },
    ];
    for (const t of tags) {
      ctx.font = '600 12px "Noto Serif SC", serif';
      const tw = ctx.measureText(t.text).width + 18;
      ctx.fillStyle = "rgba(33, 26, 20, 0.86)";
      ctx.fillRect(12, t.y, tw, 24);
      ctx.fillStyle = "#F5E9D9";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(t.text, 21, t.y + 12.5);
    }

    const ratio = +(nearScale / Math.max(0.15, farScale)).toFixed(1);
    if (ratioEl) ratioEl.textContent = inverted ? `近:远 = ${ratio}×（倒置）` : `近:远 = ${ratio}×`;
    if (readout) {
      if (inverted) {
        readout.textContent = "此刻远层比近层更粗大——大脑习惯把看得见粗粒的表面判为「离手更近」，结果远景反扑上来，空间纵深立刻崩塌倒挂。";
      } else if (grad < 0.25) {
        readout.textContent = "三层颗粒粗细几乎一致，没有纹理密度落差；画面像贴在同一堵平墙上，缺乏吉布森所说的单眼景深。";
      } else {
        readout.textContent = `近层肌理尺度已是远层的 ${ratio} 倍：即使画面里连一根透视斜线都没有，眼睛也会自然把粗砺赤陶读在身前、把细腻远纸推向纵深。`;
      }
    }
    invertBtn.setAttribute("aria-pressed", String(inverted));
    invertBtn.textContent = inverted ? "恢复「近粗远细」" : "颠倒试试「远粗近滑」";
  }

  range.addEventListener("input", () => {
    grad = Number(range.value) / 100;
    draw();
  });
  invertBtn.addEventListener("click", () => {
    inverted = !inverted;
    draw();
  });

  new ResizeObserver(draw).observe(canvas);
  draw();
}

// ---------- 04 节：同文换料 · 真实展览邀请卡配料矩阵 ----------
const MOOD_COMBOS = {
  "paper+grainy": {
    tag: "温润手作 · 器物温度",
    why: "纤维可见的手工棉纸作静底，配上粗粒赤陶印章，触觉记忆偏向泥土、窑火与手工书，克制而有亲近感。",
  },
  "paper+metal": {
    tag: "现代工艺 · 温冷张力",
    why: "暖软棉纸遇到冷硬拉丝钢，一暖一冷、一松一紧——这是建筑展与当代器物品牌最常借用的精致反差。",
  },
  "paper+smooth": {
    tag: "克制雅致 · 书卷气",
    why: "棉纸柔底衬出深咖烤漆的光洁圆印，像宣纸上落一枚温润漆章，视觉安静却层次分明。",
  },
  "paper+paper": {
    tag: "同质发平 · 焦点隐身",
    why: "底材与主印全是柔和棉纸，温润有余但反差归零——视线在卡片上滑过，找不到第一落点。",
  },
  "smooth+metal": {
    tag: "冷峻锋利 · 工业奢感",
    why: "深色光滑漆底配拉丝冷钢，双反射面都克制干净，气场严肃精准，适合腕表、音响或建筑装置。",
  },
  "smooth+grainy": {
    tag: "粗犷礼器 · 强触觉冲击",
    why: "深褐柔光底面托出粗糙赤陶颗粒，高光平滑与干涩摩擦正面对撞，戏剧张力极强。",
  },
  "smooth+paper": {
    tag: "沉静典藏 · 暗底显纸",
    why: "深漆暗底让温白棉纸纤维显得更松软透气，适合画册函套与夜间展厅请柬。",
  },
  "smooth+smooth": {
    tag: "全滑反光 · 缺乏抓地感",
    why: "整张卡片全靠光滑面支撑，少了一点粗糙摩擦作锚点，容易显得单薄发滑。",
  },
  "rough+grainy": {
    tag: "双粗堆噪 · 视觉疲惫",
    why: "粗砂底又叠粗粒赤陶，高频颗粒互相抢夺边缘，正文小字也跟着发毛——情绪没变高级，只显得糙乱。",
  },
  "rough+smooth": {
    tag: "侘寂对照 · 朴拙藏精",
    why: "粗粝砂岩墙面里嵌一枚极光滑的深漆圆印，就像粗糙夯土墙上的一枚抛光器物，反差稳重耐看。",
  },
  "rough+metal": {
    tag: "粗野建筑 · 粗硬碰撞",
    why: "砂岩的无序粗糙撞上金属的有序拉丝，粗犷与精密并存，带有强烈的空间材料实验气质。",
  },
  "rough+paper": {
    tag: "弱反差 · 略显灰蒙",
    why: "两种哑光暖色材质并置，棉纸虽比砂岩细腻，但缺少光泽差，焦点拉力较弱。",
  },
};

export function initMoodMatrix() {
  const card = document.getElementById("mood-card");
  const seal = document.getElementById("mood-seal");
  const tagEl = document.getElementById("mood-tag");
  const whyEl = document.getElementById("mood-why");
  const bgBtns = [...document.querySelectorAll("[data-mood-bg]")];
  const accentBtns = [...document.querySelectorAll("[data-mood-accent]")];
  if (!card || !seal) return;

  let bg = "paper";
  let accent = "grainy";

  const tex = getTextureSet();
  const urls = {};
  for (const id of Object.keys(tex)) {
    urls[id] = tex[id].albedo.toDataURL("image/png");
  }

  function update() {
    card.dataset.bg = bg;
    seal.dataset.accent = accent;
    card.style.backgroundImage = `url(${urls[bg]})`;
    seal.style.backgroundImage = `url(${urls[accent]})`;
    const key = `${bg}+${accent}`;
    const info = MOOD_COMBOS[key] || MOOD_COMBOS["paper+grainy"];
    if (tagEl) tagEl.textContent = info.tag;
    if (whyEl) whyEl.textContent = info.why;
    bgBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.moodBg === bg)));
    accentBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.moodAccent === accent)));
  }

  bgBtns.forEach((b) =>
    b.addEventListener("click", () => {
      bg = b.dataset.moodBg;
      update();
    })
  );
  accentBtns.forEach((b) =>
    b.addEventListener("click", () => {
      accent = b.dataset.moodAccent;
      update();
    })
  );
  update();
}

// ---------- 05 节：莫霍利-纳吉 Struktur / Textur / Faktur 三层拆解切换 ----------
const BAUHAUS_LAYERS = {
  struktur: {
    title: "Struktur · 内部结构",
    en: "INNER ARCHITECTURE",
    text: "材料看不见的内部骨架构成——金属的晶格、木材的导管纤维走向、棉纸交织的植物长纤。它决定了材料天然的受力方向与极限。",
    svgActive: "layer-struktur",
  },
  textur: {
    title: "Textur · 自然表皮",
    en: "NATURAL SURFACE",
    text: "内部结构未经人为加工、自然长到最外层的表面皮肤——原木树皮、石材天然断口、原浆纸晾干后的自然起伏。",
    svgActive: "layer-textur",
  },
  faktur: {
    title: "Faktur · 加工与光影留痕",
    en: "WORKED TRACE & LIGHT",
    text: "外部工具、工艺或光线在表面留下的可感痕迹——砂轮拉出的金属丝纹、陶土压模的颗粒、漆面抛光后的镜面高光。平面排版能调动的，大多正是 Faktur。",
    svgActive: "layer-faktur",
  },
};

export function initBauhausLayers() {
  const btns = [...document.querySelectorAll("[data-bauhaus-layer]")];
  const titleEl = document.getElementById("bauhaus-layer-title");
  const textEl = document.getElementById("bauhaus-layer-text");
  const svg = document.getElementById("bauhaus-svg");
  if (!btns.length || !svg) return;

  function select(key) {
    const item = BAUHAUS_LAYERS[key];
    if (!item) return;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bauhausLayer === key)));
    if (titleEl) titleEl.textContent = item.title;
    if (textEl) textEl.textContent = item.text;
    svg.dataset.active = key;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.bauhausLayer)));
  select("faktur");
}

// ---------- 06 节：正文小字与微图标底噪实测开关 ----------
export function initNoiseStress() {
  const box = document.getElementById("stress-box");
  const btn = document.getElementById("stress-toggle");
  const note = document.getElementById("stress-note");
  if (!box || !btn) return;

  const tex = getTextureSet();
  const roughUrl = tex.rough.albedo.toDataURL("image/png");
  const paperUrl = tex.paper.albedo.toDataURL("image/png");
  let noisy = true;

  function render() {
    box.dataset.noisy = String(noisy);
    box.style.backgroundImage = noisy ? `url(${roughUrl})` : `url(${paperUrl})`;
    btn.setAttribute("aria-pressed", String(noisy));
    btn.textContent = noisy ? "切回安静棉纸底" : "铺上重度粗砂底";
    if (note) {
      note.textContent = noisy
        ? "当前铺着粗砂底纹：13px 正文细笔画被砂岩明暗颗粒咬断，20px 小图标边缘混进底噪——在信息密集区，强质感只会拖慢阅读。"
        : "换回柔和棉纸底后，字缘与微图标立刻清透利落：把强质感留给大面积主视觉，小字阅读区保持克制。";
    }
  }

  btn.addEventListener("click", () => {
    noisy = !noisy;
    render();
  });
  render();
}

// ---------- 07 节：小练习（四版只差「材质组合」一个变量，中性标签 A/B/C/D） ----------
const QUIZ_OPTIONS = {
  A: {
    correct: false,
    bg: "paper",
    mid: "paper",
    focal: "paper",
    title: "方案 A：三层同质发平，焦点隐身",
    reason: "底面、中层色块与圆徽全用相近的高粗糙哑光棉纸，粗糙度几乎没有落差。虽然版面很干净，但主徽章融进背景里，视觉张力和引导都起不来。",
  },
  B: {
    correct: false,
    bg: "rough",
    mid: "grainy",
    focal: "metal",
    title: "方案 B：全屏强肌理堆料，破坏了协调",
    reason: "粗砂底、粗粒赤陶中块再加上重拉丝金属，三层都在高频抢戏，连正文底下都满是粗粒噪点。少了安静的休止面，对比变成了吵闹。",
  },
  C: {
    correct: true,
    bg: "paper",
    mid: "grainy",
    focal: "smooth",
    title: "选对了！方案 C 兼顾反差、协调与焦点",
    reason: "柔和棉纸大底稳住协调与正文易读性；中层粗粒赤陶拉出鲜明触觉摩擦；前景圆徽换用深咖光滑漆面，凭利落高光自然锁住视线——三层材质全不撞车，有强有静。",
  },
  D: {
    correct: false,
    bg: "metal",
    mid: "rough",
    focal: "paper",
    title: "方案 D：材质主次倒挂，背景喧宾夺主",
    reason: "反光最抢眼的拉丝金属铺满了整张背景，而本该充当焦点的圆徽反而是最暗淡发虚的棉纸。差异虽然存在，但把视觉权重给错了层。",
  },
};

export function initQuiz() {
  const btns = [...document.querySelectorAll("[data-quiz]")];
  const verdict = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("quiz-v-title");
  const vText = document.getElementById("quiz-v-text");
  if (!btns.length) return;

  const tex = getTextureSet();

  function drawMiniPoster(canvas, cfg) {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const paint = (matId, x, y, pw, ph, circle = false) => {
      ctx.save();
      ctx.beginPath();
      if (circle) ctx.arc(x + pw / 2, y + ph / 2, pw / 2, 0, Math.PI * 2);
      else ctx.rect(x, y, pw, ph);
      ctx.clip();
      ctx.fillStyle = ctx.createPattern(tex[matId].albedo, "repeat");
      ctx.fillRect(x, y, pw, ph);
      if (matId === "smooth") {
        const g = ctx.createRadialGradient(x + pw * 0.34, y + ph * 0.3, 2, x + pw * 0.5, y + ph * 0.5, pw * 0.72);
        g.addColorStop(0, "rgba(255,244,228,0.62)");
        g.addColorStop(0.38, "rgba(170,130,96,0.16)");
        g.addColorStop(1, "rgba(18,10,4,0.42)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, pw, ph);
      } else if (matId === "metal") {
        const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
        g.addColorStop(0, "rgba(255,255,255,0.28)");
        g.addColorStop(0.45, "rgba(255,255,255,0.04)");
        g.addColorStop(0.58, "rgba(255,255,255,0.42)");
        g.addColorStop(1, "rgba(20,22,25,0.34)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, pw, ph);
      }
      ctx.restore();
    };

    // 1. 整页底材
    paint(cfg.bg, 0, 0, w, h, false);

    // 2. 中层横向几何块（完全相同的坐标与尺寸）
    const mx = Math.round(w * 0.12);
    const my = Math.round(h * 0.35);
    const mw = Math.round(w * 0.62);
    const mh = Math.round(h * 0.34);
    ctx.save();
    ctx.shadowColor = "rgba(25,18,10,0.24)";
    ctx.shadowBlur = 9;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = MATERIALS[cfg.mid].hex;
    ctx.fillRect(mx, my, mw, mh);
    ctx.restore();
    paint(cfg.mid, mx, my, mw, mh, false);

    // 3. 焦点圆徽（完全相同的坐标与半径）
    const fr = Math.round(Math.min(w, h) * 0.185);
    const fx = Math.round(w * 0.67) - fr;
    const fy = Math.round(h * 0.50) - fr;
    ctx.save();
    ctx.shadowColor = "rgba(22,14,6,0.32)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(fx + fr, fy + fr, fr, 0, Math.PI * 2);
    ctx.fillStyle = MATERIALS[cfg.focal].hex;
    ctx.fill();
    ctx.restore();
    paint(cfg.focal, fx, fy, fr * 2, fr * 2, true);

    // 4. 完全一致的排印标题与小字
    const darkBg = cfg.bg === "metal";
    ctx.fillStyle = darkBg ? "#FAF4EB" : "#1F1B17";
    ctx.font = `900 ${Math.max(15, Math.round(w * 0.11))}px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("器物志", w * 0.12, h * 0.11);

    ctx.fillStyle = darkBg ? "#E4DDD3" : "#4A4138";
    ctx.font = `600 ${Math.max(10, Math.round(w * 0.044))}px "Chivo", sans-serif`;
    ctx.fillText("AUTUMN CRAFT · 103", w * 0.12, h * 0.25);

    ctx.font = `400 ${Math.max(10, Math.round(w * 0.048))}px "Noto Serif SC", serif`;
    ctx.fillText("十月手作材质巡展", w * 0.12, h * 0.80);
  }

  function redrawAll() {
    btns.forEach((btn) => {
      const c = btn.querySelector("canvas");
      const opt = QUIZ_OPTIONS[btn.dataset.quiz];
      if (c && opt) drawMiniPoster(c, opt);
    });
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.quiz;
      const opt = QUIZ_OPTIONS[key];
      btns.forEach((b) => {
        const k = b.dataset.quiz;
        b.setAttribute("aria-pressed", String(b === btn));
        b.dataset.state = b === btn ? (opt.correct ? "right" : "wrong") : QUIZ_OPTIONS[k].correct ? "hint" : "";
      });
      if (verdict) verdict.dataset.result = opt.correct ? "right" : "wrong";
      if (vTitle) vTitle.textContent = opt.title;
      if (vText) vText.textContent = opt.reason;
    });
  });

  const grid = document.getElementById("quiz-grid");
  if (grid) new ResizeObserver(redrawAll).observe(grid);
  redrawAll();
}

// ---------- 08 节：原海报点击放大、拖动平移、Esc 关闭 ----------
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const lightbox = document.getElementById("poster-lightbox");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomImg = document.getElementById("lightbox-img");
  const stage = document.getElementById("lightbox-stage");
  if (!openBtn || !posterImg || !lightbox || !zoomImg || !stage) return;

  let tx = 0;
  let ty = 0;
  let scale = 1;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    // 复用同一张内联海报的 data URI，绝不二次内联
    if (!zoomImg.src) zoomImg.src = posterImg.src;
    tx = 0;
    ty = 0;
    scale = 1.25;
    applyTransform();
    lightbox.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn?.focus();
  }

  function close() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === stage) close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) close();
  });

  zoomImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    zoomImg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  zoomImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  zoomImg.addEventListener("pointerup", () => {
    dragging = false;
  });
  zoomImg.addEventListener("dblclick", () => {
    scale = scale > 1.5 ? 1.0 : 1.9;
    tx = 0;
    ty = 0;
    applyTransform();
  });
}
