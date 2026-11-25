// 069 线性透视 · 正文 01–07 节互动引擎与 08 节原海报灯箱
import { pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

const CYAN = "#04A5D5";
const CYAN_DEEP = "#066E8E";
const CYAN_DARK_UI = "#38C9F2";
const ERR = "#B82A1E";
const ERR_DARK = "#FF7C6E";
const OK = "#0C7054";
const OK_DARK = "#4CE0B3";
const INK = "#141C20";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(120, Math.round(rect.width));
  const h = Math.max(100, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W: w, H: h };
}

// 简洁无五官建筑背影剪影（严格遵守不画五官规则）
function drawSilhouette(ctx, cx, footY, height, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const headR = height * 0.088;
  const headCy = footY - height + headR;
  // 头
  ctx.beginPath();
  ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();
  // 肩与大衣躯干（建筑插图极简廓形）
  const shoulderY = footY - height * 0.80;
  const waistY = footY - height * 0.36;
  const sw = height * 0.145;
  const bw = height * 0.115;
  ctx.beginPath();
  ctx.moveTo(cx - sw, shoulderY + height * 0.05);
  ctx.quadraticCurveTo(cx, shoulderY - height * 0.03, cx + sw, shoulderY + height * 0.05);
  ctx.lineTo(cx + bw, waistY);
  ctx.lineTo(cx + bw * 0.68, footY);
  ctx.lineTo(cx + bw * 0.16, footY);
  ctx.lineTo(cx + bw * 0.08, waistY + height * 0.04);
  ctx.lineTo(cx - bw * 0.08, waistY + height * 0.04);
  ctx.lineTo(cx - bw * 0.16, footY);
  ctx.lineTo(cx - bw * 0.68, footY);
  ctx.lineTo(cx - bw, waistY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// =========================================================================
// 01 节：四层透视剥离检视台（含「哪些线会汇聚、哪些保持平行」验证开关）
// =========================================================================
export function initSec01() {
  const canvas = document.getElementById("sec01-canvas");
  if (!canvas) return () => {};
  const readout = document.getElementById("sec01-readout");
  const layers = {
    horizon: true,
    rays: true,
    scale: true,
    aerial: true,
    parallelCheck: false,
  };

  const buttons = [...document.querySelectorAll("[data-s1-layer]")];
  function syncButtons() {
    buttons.forEach((btn) => {
      const k = btn.dataset.s1Layer;
      const on = !!layers[k];
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-on", on);
    });
  }

  function draw() {
    const { ctx, W, H } = fitCanvas(canvas);
    const vpX = W * 0.54;
    const vpY = H * 0.48;

    ctx.fillStyle = "#EFF2F5";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#D6DDE2";
    ctx.fillRect(0, vpY, W, H - vpY);

    // 纵深射线网
    if (layers.rays) {
      ctx.strokeStyle = "rgba(4, 165, 213, 0.34)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const frac of [-0.4, 0, 0.25, 0.5, 0.75, 1.0, 1.35]) {
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(W * frac, H);
      }
      for (const frac of [0.05, 0.28, 0.78, 0.98]) {
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(W * frac, 0);
      }
      ctx.stroke();

      // 中轴青道
      ctx.fillStyle = "rgba(36, 155, 185, 0.45)";
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(vpX - W * 0.09, H);
      ctx.lineTo(vpX + W * 0.09, H);
      ctx.closePath();
      ctx.fill();
    }

    // 4 座展墙体块
    const zList = [1.3, 2.2, 3.4, 5.1];
    for (let i = zList.length - 1; i >= 0; i--) {
      const z = zList[i];
      const inv = layers.scale ? 1.3 / z : 0.72;
      const xIn = layers.scale ? vpX - W * 0.32 * inv : W * (0.12 + i * 0.11);
      const bw = layers.scale ? W * 0.11 * inv : W * 0.075;
      const topY = layers.scale ? vpY - H * 0.34 * inv : vpY - H * 0.24;
      const botY = layers.scale ? vpY + H * 0.34 * inv : vpY + H * 0.24;
      const sideW = layers.scale ? Math.max(8, (vpX - xIn) * 0.28) : W * 0.055;
      const sideTop = layers.scale ? topY + (vpY - topY) * 0.28 : topY;
      const sideBot = layers.scale ? botY + (vpY - botY) * 0.28 : botY;

      const gray = layers.aerial ? Math.round(24 + i * 52) : 64;
      const graySide = layers.aerial ? Math.round(44 + i * 50) : 88;

      ctx.fillStyle = `rgb(${gray},${gray + 6},${gray + 10})`;
      ctx.fillRect(xIn - bw, topY, bw, botY - topY);

      ctx.fillStyle = `rgb(${graySide},${graySide + 7},${graySide + 11})`;
      ctx.beginPath();
      ctx.moveTo(xIn, topY);
      ctx.lineTo(xIn + sideW, sideTop);
      ctx.lineTo(xIn + sideW, sideBot);
      ctx.lineTo(xIn, botY);
      ctx.closePath();
      ctx.fill();

      // 若开启「平行线对照」，高亮保持平行的横/竖边（绿）vs 收束的纵深边（青）
      if (layers.parallelCheck) {
        // 严格竖直 & 水平边（不汇聚！）
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(xIn - bw, topY); ctx.lineTo(xIn - bw, botY);
        ctx.moveTo(xIn, topY); ctx.lineTo(xIn, botY);
        ctx.moveTo(xIn - bw, topY); ctx.lineTo(xIn, topY);
        ctx.moveTo(xIn - bw, botY); ctx.lineTo(xIn, botY);
        ctx.stroke();

        // 真正向灭点汇聚的纵深边（青）
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(xIn, topY); ctx.lineTo(xIn + sideW, sideTop);
        ctx.moveTo(xIn, botY); ctx.lineTo(xIn + sideW, sideBot);
        ctx.stroke();
      }
    }

    // 视平线与灭点
    if (layers.horizon) {
      ctx.strokeStyle = CYAN_DEEP;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(12, vpY);
      ctx.lineTo(W - 12, vpY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(vpX, vpY, 5, 0, Math.PI * 2);
      ctx.fillStyle = CYAN;
      ctx.fill();
    }

    // 图例说明条
    if (layers.parallelCheck) {
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(246,247,250,0.94)";
      ctx.fillRect(12, 12, Math.min(W - 24, 332), 26);
      ctx.strokeStyle = "#C9D4DC";
      ctx.strokeRect(12, 12, Math.min(W - 24, 332), 26);
      ctx.fillStyle = OK;
      ctx.fillText("■ 绿线：平行于画面的横竖棱（永不汇聚）", 20, 29);
    }

    // 单真源文字反馈
    const offList = [];
    if (!layers.horizon) offList.push("视平线与灭点");
    if (!layers.rays) offList.push("收束射线网");
    if (!layers.scale) offList.push("近大远小");
    if (!layers.aerial) offList.push("近实远虚");

    if (readout) {
      if (layers.parallelCheck) {
        readout.textContent = "绿色标出的是平行于画面的水平边和垂直边——它们彼此严格平行、永不交汇；只有蓝色标出的「朝画面纵深退去」的平行线，才会汇聚到消失点。";
      } else if (offList.length === 0) {
        readout.textContent = "四层线索齐备：视平线定出眼高，青色射线牵引方向，1/z 尺度给出距离，近重远轻补上空气厚薄。试着逐个关掉其中一层，看空间怎样变平。";
      } else if (!layers.scale) {
        readout.textContent = `已剥离「${offList.join("、")}」：失去近大远小后，四座体块退化成一排贴平的矩形色块，哪怕留着射线也救不回立体感。`;
      } else if (!layers.aerial) {
        readout.textContent = `已剥离「${offList.join("、")}」：几何线框依然成立，但远近体块涂成同一深灰，空气感立刻消失，画面变像建筑白模。`;
      } else {
        readout.textContent = `已剥离「${offList.join("、")}」：主体虽仍按透视缩小，但少了外显的视平线与引导通道，眼睛需要更久才能锁定空间去向。`;
      }
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.s1Layer;
      layers[k] = !layers[k];
      syncButtons();
      draw();
    });
  });

  syncButtons();
  draw();
  return draw;
}

// =========================================================================
// 02 节：视平线定律（眼高升降台 · 3 位 1.7 m 同高剪影）
// =========================================================================
export function initSec02() {
  const canvas = document.getElementById("sec02-canvas");
  const slider = document.getElementById("sec02-eye");
  const valEl = document.getElementById("sec02-eye-val");
  const readout = document.getElementById("sec02-readout");
  if (!canvas || !slider) return () => {};

  const PERSON_H = 1.7; // 三位同高人物均为 1.70 米
  const PEOPLE = [
    { name: "近 · 3.8 m", xWorld: -1.45, z: 3.8 },
    { name: "中 · 8.5 m", xWorld: 1.05, z: 8.5 },
    { name: "远 · 17 m", xWorld: -0.55, z: 17.0 },
  ];

  function draw() {
    const { ctx, W, H } = fitCanvas(canvas);
    const eyeM = parseFloat(slider.value); // 0.4 .. 5.2 m
    if (valEl) valEl.textContent = `${eyeM.toFixed(1)} m`;

    // 眼高映射到视平线在画面中的高度（眼高越高，视平线越靠上，地坪露得越多）
    const horizonFrac = clamp(0.70 - ((eyeM - 0.4) / 4.8) * 0.48, 0.20, 0.72);
    const vpX = W * 0.52;
    const vpY = H * horizonFrac;

    // 针孔投影（确保近景人物完整落脚在画布内部，不截断双腿）
    const focalPx = Math.min(W * 0.48, H * 0.72);
    const proj = (x, yWorld, z) => ({
      x: vpX + (x * focalPx) / z,
      y: vpY - ((yWorld - eyeM) * focalPx) / z,
    });

    // 背景与地坪
    ctx.fillStyle = "#F0F3F6";
    ctx.fillRect(0, 0, W, vpY);
    ctx.fillStyle = "#D4DCE1";
    ctx.fillRect(0, vpY, W, H - vpY);

    // 地板退行线与横缝（真实 3D 投影）
    ctx.strokeStyle = "rgba(6, 110, 142, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -3.6; x <= 3.6; x += 0.9) {
      const pNear = proj(x, 0, 2.2);
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(pNear.x, pNear.y);
    }
    for (let z = 3.0; z <= 22; z += 2.4) {
      const pL = proj(-5, 0, z);
      const pR = proj(5, 0, z);
      if (pL.y > vpY + 2 && pL.y < H) {
        ctx.moveTo(0, pL.y);
        ctx.lineTo(W, pR.y);
      }
    }
    ctx.stroke();

    // 画 3 位严格等高 1.7 m 的极简背影剪影（由远及近），标牌统一放第二遍绘制免被近景遮挡
    const labelQueue = [];
    for (let i = PEOPLE.length - 1; i >= 0; i--) {
      const p = PEOPLE[i];
      const foot = proj(p.xWorld, 0, p.z);
      const head = proj(p.xWorld, PERSON_H, p.z);
      const hPx = Math.max(18, foot.y - head.y);
      const shade = i === 0 ? "#121C22" : i === 1 ? "#354752" : "#647784";

      // 脚下浅影
      ctx.fillStyle = "rgba(18,28,34,0.16)";
      ctx.beginPath();
      ctx.ellipse(foot.x, foot.y, hPx * 0.16, Math.max(2, hPx * 0.03), 0, 0, Math.PI * 2);
      ctx.fill();

      drawSilhouette(ctx, foot.x, foot.y, hPx, shade, 1);
      labelQueue.push({ name: p.name, footX: foot.x, footY: foot.y, index: i });
    }

    ctx.font = `600 10.5px "JetBrains Mono", "Noto Sans SC", sans-serif`;
    for (const item of labelQueue) {
      const lw = ctx.measureText(item.name).width + 10;
      const shift = item.index === 2 && W < 500 ? -12 : 0;
      const lx = clamp(item.footX - lw / 2 + shift, 6, W - lw - 6);
      const ly = clamp(item.footY + 4, vpY + 8, H - 20);
      ctx.fillStyle = "rgba(246, 248, 250, 0.94)";
      ctx.fillRect(lx, ly, lw, 16);
      ctx.strokeStyle = "rgba(143, 159, 169, 0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, ly, lw, 16);
      ctx.fillStyle = "#18242B";
      ctx.fillText(item.name, lx + 5, ly + 11.5);
    }

    // 贯穿全宽的青色虚线「视平线 = 相机眼高」
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(0, vpY);
    ctx.lineTo(W, vpY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 灭点
    ctx.beginPath();
    ctx.arc(vpX, vpY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = CYAN_DEEP;
    ctx.fill();

    // 标尺标签
    const tag = `视平线 = 眼高 ${eyeM.toFixed(1)} m`;
    ctx.font = `700 11px "JetBrains Mono", "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(tag).width + 14;
    ctx.fillStyle = "#040F12";
    ctx.fillRect(12, Math.max(10, vpY - 26), tw, 20);
    ctx.fillStyle = CYAN_DARK_UI;
    ctx.fillText(tag, 19, Math.max(24, vpY - 12));

    // 白话实测诊断（所有距离数字直接取自 PEOPLE 单真源数组）
    if (readout) {
      if (Math.abs(eyeM - PERSON_H) <= 0.16) {
        readout.textContent = `眼高 ${eyeM.toFixed(1)} m ≈ 人物身高 ${PERSON_H.toFixed(1)} m：请看青色虚线——无论站在 ${PEOPLE[0].z} m 还是 ${PEOPLE[2].z} m 外，视平线精准穿过三个人的头眼位置，只差脚底越远越抬高。这就是平视构图里判断远近身高的铁尺。`;
      } else if (eyeM < 1.0) {
        readout.textContent = `低机位 ${eyeM.toFixed(1)} m（约膝盖高）：视平线同时切过所有人的小腿，上半身集体高耸到天幕里，立刻产生仰视纪念碑般的压迫与敬畏感。`;
      } else if (eyeM < PERSON_H) {
        readout.textContent = `半蹲视角 ${eyeM.toFixed(1)} m：视平线统一穿过三人的胸腰位置，人物头顶仍略高于地平线，空间稳重而亲近。`;
      } else if (eyeM > 3.2) {
        readout.textContent = `高处俯瞰 ${eyeM.toFixed(1)} m（约二楼阳台）：三个人全都落到视平线下方，地面网格铺展成大片地图，个体显得渺小而环境格局尽收眼底。`;
      } else {
        readout.textContent = `微俯视角 ${eyeM.toFixed(1)} m：相机比人物略高，所有人的头顶都压在视平线下面一点点，地坪走线开始舒展。`;
      }
    }
  }

  slider.addEventListener("input", draw);
  document.querySelectorAll("[data-s2-eye]").forEach((btn) => {
    btn.addEventListener("click", () => {
      slider.value = btn.dataset.s2Eye;
      draw();
    });
  });

  draw();
  return draw;
}

// =========================================================================
// 03 节（深黑暗室）：阿尔贝蒂「对角线定距法」与 1/z 压缩推演
// =========================================================================
export function initSec03() {
  const canvas = document.getElementById("sec03-canvas");
  const distSlider = document.getElementById("sec03-dist");
  const distVal = document.getElementById("sec03-dist-val");
  const readout = document.getElementById("sec03-readout");
  if (!canvas || !distSlider) return () => {};

  let step = 4; // 1..4 步分步构建
  let mode = "true"; // "true" | "linear"

  const stepBtns = [...document.querySelectorAll("[data-s3-step]")];
  const modeBtns = [...document.querySelectorAll("[data-s3-mode]")];

  function syncUi() {
    stepBtns.forEach((b) => {
      const active = Number(b.dataset.s3Step) === step;
      b.classList.toggle("is-on", active);
      b.setAttribute("aria-pressed", String(active));
    });
    modeBtns.forEach((b) => {
      const active = b.dataset.s3Mode === mode;
      b.classList.toggle("is-on", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  function draw() {
    const { ctx, W, H } = fitCanvas(canvas);
    const dFactor = parseFloat(distSlider.value); // 0.35 .. 1.35（距点到主灭点的相对距离）
    if (distVal) distVal.textContent = `${dFactor.toFixed(2)}× 画宽`;

    // 深黑建筑暗室底
    ctx.fillStyle = "#061116";
    ctx.fillRect(0, 0, W, H);

    // 淡蓝图暗格
    ctx.strokeStyle = "rgba(56, 201, 242, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 24; x < W; x += 28) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 24; y < H; y += 28) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    const horizonY = H * 0.24;
    const baseY = H * 0.88;
    const leftX = W * 0.14;
    const rightX = W * 0.66;
    const vpX = (leftX + rightX) * 0.5;
    const spanW = rightX - leftX;
    const cols = 6;
    const distPtX = clamp(vpX + spanW * dFactor, vpX + 46, W - 26);

    // 视平线
    ctx.strokeStyle = "rgba(56, 201, 242, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(14, horizonY);
    ctx.lineTo(W - 14, horizonY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 主灭点 VP 与 距点 D
    ctx.fillStyle = CYAN_DARK_UI;
    ctx.beginPath(); ctx.arc(vpX, horizonY, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = `600 11px "JetBrains Mono", "Noto Sans SC", sans-serif`;
    ctx.fillText("主灭点 VP", vpX - 28, horizonY - 10);

    if (step >= 3 && mode === "true") {
      ctx.fillStyle = OK_DARK;
      ctx.beginPath(); ctx.arc(distPtX, horizonY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText("距点 D（45°）", Math.min(W - 96, distPtX - 34), horizonY - 10);
    }

    // 第 1 步：底边等分点
    ctx.strokeStyle = "#E8F4F8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, baseY);
    ctx.lineTo(rightX, baseY);
    ctx.stroke();

    const basePts = [];
    for (let i = 0; i <= cols; i++) {
      const px = leftX + (spanW * i) / cols;
      basePts.push(px);
      ctx.fillStyle = "#F0F8FA";
      ctx.beginPath();
      ctx.arc(px, baseY, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 第 2 步：底边各等分点向主灭点引纵线
    if (step >= 2) {
      ctx.strokeStyle = "rgba(56, 201, 242, 0.62)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const px of basePts) {
        ctx.moveTo(px, baseY);
        ctx.lineTo(vpX, horizonY);
      }
      ctx.stroke();
    }

    // 第 3 步：从底边左端向距点 D 拉 45° 对角线（求出交点 Y）
    const crossYs = [baseY];
    if (mode === "true") {
      for (let i = 1; i <= cols; i++) {
        // 第 i 条纵线：从 (basePts[i], baseY) 到 (vpX, horizonY)
        // 对角线：从 (leftX, baseY) 到 (distPtX, horizonY)
        // 求交点纵坐标 t ∈ (0, 1)：
        // leftX + t*(distPtX - leftX) = basePts[i] + t*(vpX - basePts[i])
        // => t * ((distPtX - leftX) - (vpX - basePts[i])) = basePts[i] - leftX
        const denom = (distPtX - vpX) + (basePts[i] - leftX);
        const t = (basePts[i] - leftX) / Math.max(1, denom);
        crossYs.push(baseY + (horizonY - baseY) * t);
      }
    } else {
      for (let i = 1; i <= cols; i++) {
        crossYs.push(baseY - (baseY - horizonY) * (i / (cols + 1.2)));
      }
    }

    // 第 4 步：过每个交点画平行横缝，生成真正按 1/z 递减的透视格网
    if (step >= 4) {
      for (let r = 1; r < crossYs.length; r++) {
        const y = crossYs[r];
        const t = (y - baseY) / (horizonY - baseY);
        const lx = leftX + (vpX - leftX) * t;
        const rx = rightX + (vpX - rightX) * t;

        // 交替铺设棋盘浅亮块（增强可读性）
        const yPrev = crossYs[r - 1];
        const tPrev = (yPrev - baseY) / (horizonY - baseY);
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 !== 0) continue;
          const x0a = basePts[c] + (vpX - basePts[c]) * tPrev;
          const x1a = basePts[c + 1] + (vpX - basePts[c + 1]) * tPrev;
          const x1b = basePts[c + 1] + (vpX - basePts[c + 1]) * t;
          const x0b = basePts[c] + (vpX - basePts[c]) * t;
          ctx.fillStyle = mode === "true" ? "rgba(56, 201, 242, 0.14)" : "rgba(255, 124, 110, 0.14)";
          ctx.beginPath();
          ctx.moveTo(x0a, yPrev);
          ctx.lineTo(x1a, yPrev);
          ctx.lineTo(x1b, y);
          ctx.lineTo(x0b, y);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = mode === "true" ? "#8EE4FC" : ERR_DARK;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(rx, y);
        ctx.stroke();
      }
    }

    // 绘制 45° 对角线和红/绿交点（置顶保证清晰）
    if (step >= 3 && mode === "true") {
      ctx.strokeStyle = OK_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX, baseY);
      ctx.lineTo(distPtX, horizonY);
      ctx.stroke();

      for (let i = 1; i <= cols; i++) {
        const y = crossYs[i];
        const t = (y - baseY) / (horizonY - baseY);
        const ix = leftX + (distPtX - leftX) * t;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(ix, y, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = OK_DARK;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    const g1 = Math.max(1, crossYs[0] - crossYs[1]);
    const gLast = Math.max(1, crossYs[cols - 1] - crossYs[cols]);
    const ratio = g1 / gLast;

    // 右下角实时比例说明
    ctx.font = `500 11px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = mode === "true" ? OK_DARK : ERR_DARK;
    ctx.fillText(
      `首排 / 末排缝距：${ratio.toFixed(2)}×`,
      Math.max(14, W - 186),
      H - 14
    );

    if (readout) {
      if (mode === "linear") {
        readout.textContent = `错误等差模式：首排与末排横缝间距比仅 ${ratio.toFixed(2)}×，远处的地砖被硬拉成细长竖条，地板看起来像贴着墙面竖起来。`;
      } else {
        const stepDesc = [
          "",
          "第 1 步：先在画幅底边标出等距的 6 个刻度点，它们代表离你最近的 6 块正方形地砖前缘。",
          "第 2 步：把每个刻度点连向视平线上的主灭点 VP，得到全部向远方延伸的纵向瓷砖缝。",
          `第 3 步：在视平线旁选定距点 D（当前 ${dFactor.toFixed(2)}× 画宽），从左下角拉一条 45° 对角线直抵 D——它依次穿破每一条纵线。`,
          `第 4 步：过每个交点画水平横线，不必任何估算就能得到严格 1/z 收紧的正方形地砖（当前首末排压比 ${ratio.toFixed(2)}×）。拖动距点看视距如何改变纵深感！`,
        ][step];
        readout.textContent = stepDesc;
      }
    }
  }

  stepBtns.forEach((b) => {
    b.addEventListener("click", () => {
      step = Number(b.dataset.s3Step);
      mode = "true";
      syncUi();
      draw();
    });
  });
  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.s3Mode;
      if (mode === "linear") step = 4;
      syncUi();
      draw();
    });
  });
  distSlider.addEventListener("input", () => {
    mode = "true";
    syncUi();
    draw();
  });

  syncUi();
  draw();
  return draw;
}

// =========================================================================
// 04 节：一点、两点、三点同源姿态台（真实 3D 旋转盒 + 实时灭点计数）
// =========================================================================
export function initSec04() {
  const canvas = document.getElementById("sec04-canvas");
  const yawInput = document.getElementById("sec04-yaw");
  const pitchInput = document.getElementById("sec04-pitch");
  const readout = document.getElementById("sec04-readout");
  const countBadge = document.getElementById("sec04-count");
  if (!canvas || !yawInput || !pitchInput) return () => {};

  const presets = [...document.querySelectorAll("[data-s4-preset]")];

  function draw() {
    const { ctx, W, H } = fitCanvas(canvas);
    const yawDeg = parseFloat(yawInput.value);     // 0 .. 45°
    const pitchDeg = parseFloat(pitchInput.value); // -28 .. 28°

    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;

    ctx.fillStyle = "#EDF3F7";
    ctx.fillRect(0, 0, W, H);

    // 3D 旋转函数（先绕 Y 轴偏航，再绕 X 轴俯仰）
    const rot = ([x, y, z]) => {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      return [x1, y2, z2];
    };

    const camZ = 4.4;
    const f = Math.min(W, H) * 0.92;
    const cx = W * 0.56;
    const cy = H * 0.48;

    // 偏置方盒坐标（即使一点透视 Yaw=0° 也能清楚看到退行侧面与屋顶，并让 VP1 清晰露在右侧空处）
    const offX = -0.68 * (1 - yawDeg / 55);
    const offY = -0.22;

    const proj = (pt) => {
      const [x, y, z] = rot(pt);
      const depth = camZ + z;
      return { x: cx + ((x + offX) * f) / depth, y: cy - ((y + offY) * f) / depth, z: depth };
    };

    // 求某轴方向的屏幕消失点（若与画面平行则返 null）
    const vanishOf = (dir) => {
      const [x, y, z] = rot(dir);
      if (Math.abs(z) < 0.04) return null;
      const sign = z > 0 ? 1 : -1;
      return { x: cx + (x * sign * f) / (z * sign), y: cy - (y * sign * f) / (z * sign) };
    };

    const vpZ = vanishOf([0, 0, 1]);
    const vpX = vanishOf([1, 0, 0]);
    const vpY = vanishOf([0, 1, 0]);

    const tiltedAxes = [vpZ, vpX, vpY].filter(Boolean).length;
    const vpCountLabel = tiltedAxes === 1 ? "一点透视（1 组棱倾斜）" : tiltedAxes === 2 ? "两点透视（2 组棱倾斜）" : "三点透视（3 组棱全倾斜）";
    if (countBadge) countBadge.textContent = vpCountLabel;

    // 视平线（过 vpZ 与 vpX 或水平线）
    const hY = vpZ ? vpZ.y : cy;
    ctx.strokeStyle = "rgba(6, 110, 142, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(10, clamp(hY, 16, H - 16));
    ctx.lineTo(W - 10, clamp(hY, 16, H - 16));
    ctx.stroke();
    ctx.setLineDash([]);

    // 建筑体块 8 顶点（长宽略错落更有展馆感）
    const sx = 0.72, sy = 0.78, sz = 0.92;
    const V = [
      [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
      [-sx, -sy, sz],  [sx, -sy, sz],  [sx, sy, sz],  [-sx, sy, sz],
    ];
    const P = V.map(proj);

    // 延射线到落在画幅内外附近的可视方向
    const drawRayToward = (a, vp, color) => {
      if (!vp) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(vp.x, vp.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // 绘制延射线（Z轴青，X轴靛蓝，Y轴朱红）
    if (vpZ) [0, 1, 2, 3].forEach((i) => drawRayToward(P[i], vpZ, "rgba(4, 165, 213, 0.52)"));
    if (vpX) [0, 3, 4, 7].forEach((i) => drawRayToward(P[i], vpX, "rgba(18, 92, 132, 0.40)"));
    if (vpY) [0, 1, 4, 5].forEach((i) => drawRayToward(P[i], vpY, "rgba(184, 42, 30, 0.40)"));

    // 半透建筑混凝土体块面片（可见内部结构与三组棱线）
    const faces = [
      { idx: [0, 1, 2, 3], col: "rgba(24, 34, 40, 0.76)" },
      { idx: [4, 5, 6, 7], col: "rgba(140, 156, 166, 0.38)" },
      { idx: [0, 4, 7, 3], col: "rgba(70, 90, 102, 0.62)" },
      { idx: [1, 5, 6, 2], col: "rgba(165, 184, 196, 0.76)" },
      { idx: [3, 2, 6, 7], col: "rgba(218, 228, 234, 0.88)" },
      { idx: [0, 1, 5, 4], col: "rgba(45, 60, 68, 0.55)" },
    ].map((fc) => ({
      ...fc,
      avgZ: fc.idx.reduce((acc, k) => acc + P[k].z, 0) / 4,
    })).sort((a, b) => b.avgZ - a.avgZ);

    for (const fc of faces) {
      ctx.fillStyle = fc.col;
      ctx.beginPath();
      fc.idx.forEach((k, idx) => (idx === 0 ? ctx.moveTo(P[k].x, P[k].y) : ctx.lineTo(P[k].x, P[k].y)));
      ctx.closePath();
      ctx.fill();
    }

    // 按三组棱着不同色（Z青、X深青、Y黑/红）
    const edgeGroups = [
      { edges: [[0, 4], [1, 5], [2, 6], [3, 7]], color: CYAN },
      { edges: [[0, 1], [3, 2], [4, 5], [7, 6]], color: vpX ? "#0B5F7C" : "#0C7054" },
      { edges: [[0, 3], [1, 2], [4, 7], [5, 6]], color: vpY ? ERR : "#0C7054" },
    ];
    for (const g of edgeGroups) {
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [a, b] of g.edges) {
        ctx.moveTo(P[a].x, P[a].y);
        ctx.lineTo(P[b].x, P[b].y);
      }
      ctx.stroke();
    }

    // 标出消失点圆点与清晰高对比底牌
    const markVp = (vp, label, color) => {
      if (!vp) return;
      const inView = vp.x > 16 && vp.x < W - 16 && vp.y > 16 && vp.y < H - 16;
      const x = clamp(vp.x, 18, W - 54);
      const y = clamp(vp.y, 18, H - 18);
      ctx.beginPath();
      ctx.arc(x, y, inView ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      const txt = inView ? label : `${label} →`;
      ctx.font = `700 10.5px "JetBrains Mono", sans-serif`;
      const tw = ctx.measureText(txt).width + 8;
      ctx.fillStyle = "rgba(246, 248, 250, 0.94)";
      ctx.fillRect(x + 7, y - 9, tw, 17);
      ctx.fillStyle = color;
      ctx.fillText(txt, x + 11, y + 3.5);
    };
    markVp(vpZ, "VP1", CYAN_DEEP);
    markVp(vpX, "VP2", "#0B5F7C");
    markVp(vpY, "VP3", ERR);

    // 读数说明
    if (readout) {
      const yTxt = `偏航 ${Math.round(yawDeg)}° · 俯仰 ${pitchDeg > 0 ? "+" : ""}${Math.round(pitchDeg)}°`;
      if (tiltedAxes === 1) {
        readout.textContent = `${yTxt}｜正对方盒：横向棱与竖向棱都平行于画面（绿色保持平行），只有朝远方延伸的 1 组纵棱汇聚到 VP1。`;
      } else if (tiltedAxes === 2) {
        readout.textContent = `${yTxt}｜水平转开墙角：前后与左右 2 组水平棱都不再平行于画面，分别在视平线左右汇成 VP1 与 VP2，竖棱仍保持垂直平行。`;
      } else {
        readout.textContent = `${yTxt}｜再抬/压机位产生俯仰：连原本垂直的竖棱也斜向画面，在上方或下方生出第 3 个灭点 VP3——本质仍是同一条平行线投影法则。`;
      }
    }
  }

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const [y, p] = btn.dataset.s4Preset.split(",");
      yawInput.value = y;
      pitchInput.value = p;
      presets.forEach((x) => {
        const on = x === btn;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  });

  const onInput = () => {
    presets.forEach((x) => { x.classList.remove("is-on"); x.setAttribute("aria-pressed", "false"); });
    draw();
  };
  yawInput.addEventListener("input", onInput);
  pitchInput.addEventListener("input", onInput);

  draw();
  return draw;
}

// =========================================================================
// 05 节：布鲁内莱斯基约 1415 年洗礼堂「小孔与铜镜」互动复现
// =========================================================================
export function initSec05() {
  const canvas = document.getElementById("sec05-canvas");
  const mirrorSlider = document.getElementById("sec05-mirror");
  const offsetBtn = document.getElementById("sec05-offset");
  const readout = document.getElementById("sec05-readout");
  if (!canvas || !mirrorSlider) return () => {};

  let offEye = false;

  function drawBaptistery(ctx, W, H, shiftX, isPainted) {
    const cx = W * 0.5 + shiftX;
    const hY = H * 0.64;
    const bw = Math.min(W * 0.42, 220);
    const bh = Math.min(H * 0.48, 150);

    // 八角形佛罗伦萨圣乔瓦尼洗礼堂立面轮廓（中正面 + 左右斜翼 + 锥顶）
    const midW = bw * 0.46;
    const wingW = bw * 0.27;
    const wingDrop = bh * 0.08;

    ctx.save();
    // 天空（实景冷灰蓝 vs 画板抛光银箔反射流云）
    if (isPainted) {
      const silver = ctx.createLinearGradient(0, 0, W, hY);
      silver.addColorStop(0, "#D6E3EA");
      silver.addColorStop(0.5, "#EEF4F7");
      silver.addColorStop(1, "#C9D9E2");
      ctx.fillStyle = silver;
    } else {
      ctx.fillStyle = "#E5EAEE";
    }
    ctx.fillRect(0, 0, W, hY);
    ctx.fillStyle = isPainted ? "#C6D3DA" : "#CCD2D6";
    ctx.fillRect(0, hY, W, H - hY);

    // 广场地砖射线
    ctx.strokeStyle = isPainted ? "rgba(4,165,213,0.48)" : "rgba(40,52,60,0.18)";
    ctx.lineWidth = isPainted ? 1.1 : 1;
    ctx.beginPath();
    for (let k = -3; k <= 3; k++) {
      ctx.moveTo(cx, hY);
      ctx.lineTo(cx + k * bw * 0.58, H);
    }
    ctx.stroke();

    // 八角锥顶
    ctx.fillStyle = isPainted ? "#274350" : "#5D6970";
    ctx.beginPath();
    ctx.moveTo(cx - midW * 0.5 - wingW * 0.92, hY - bh + wingDrop);
    ctx.lineTo(cx, hY - bh * 1.24);
    ctx.lineTo(cx + midW * 0.5 + wingW * 0.92, hY - bh + wingDrop);
    ctx.closePath();
    ctx.fill();

    // 正立面 + 双斜翼（大理石条纹极简表达）
    const fillMain = isPainted ? "#F4F8FA" : "#EAECEB";
    const fillWing = isPainted ? "#D5E4EB" : "#D3D8DC";
    const strokeMain = isPainted ? CYAN_DEEP : "#243038";

    ctx.fillStyle = fillMain;
    ctx.strokeStyle = strokeMain;
    ctx.lineWidth = isPainted ? 1.5 : 1.2;
    ctx.fillRect(cx - midW / 2, hY - bh, midW, bh);
    ctx.strokeRect(cx - midW / 2, hY - bh, midW, bh);

    // 左斜翼
    ctx.fillStyle = fillWing;
    ctx.beginPath();
    ctx.moveTo(cx - midW / 2, hY - bh);
    ctx.lineTo(cx - midW / 2 - wingW, hY - bh + wingDrop);
    ctx.lineTo(cx - midW / 2 - wingW, hY - wingDrop * 0.6);
    ctx.lineTo(cx - midW / 2, hY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右斜翼
    ctx.beginPath();
    ctx.moveTo(cx + midW / 2, hY - bh);
    ctx.lineTo(cx + midW / 2 + wingW, hY - bh + wingDrop);
    ctx.lineTo(cx + midW / 2 + wingW, hY - wingDrop * 0.6);
    ctx.lineTo(cx + midW / 2, hY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 三道立面拱券门洞（含中门）
    for (let a = -1; a <= 1; a++) {
      const ax = cx + a * (midW * 0.28);
      const aw = midW * 0.2;
      const ah = bh * (a === 0 ? 0.36 : 0.28);
      ctx.fillStyle = isPainted ? "#0D242E" : "#303A40";
      ctx.fillRect(ax - aw / 2, hY - ah, aw, ah);
    }

    // 画出画板中央的「小孔（消失点）」与青色构造线
    if (isPainted) {
      ctx.strokeStyle = "rgba(4, 165, 213, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - bw * 0.8, hY);
      ctx.lineTo(cx + bw * 0.8, hY);
      ctx.moveTo(cx - midW / 2 - wingW, hY - bh + wingDrop);
      ctx.lineTo(cx, hY);
      ctx.moveTo(cx + midW / 2 + wingW, hY - bh + wingDrop);
      ctx.lineTo(cx, hY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 窥视小孔
      ctx.beginPath();
      ctx.arc(cx, hY - bh * 0.16, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#040F12";
      ctx.fill();
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    const { ctx, W, H } = fitCanvas(canvas);
    const mirrorPct = parseFloat(mirrorSlider.value); // 0 .. 100
    const splitX = (mirrorPct / 100) * W;

    // 底层：佛罗伦萨大教堂门廊望见的真实洗礼堂
    drawBaptistery(ctx, W, H, 0, false);

    // 铜镜层：从左侧滑入画板镜像（偏离小孔时产生 15° 视差错位！）
    if (splitX > 2) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, H);
      ctx.clip();
      drawBaptistery(ctx, W, H, offEye ? 34 : 0, true);
      ctx.restore();

      // 铜镜边框竖切线
      ctx.strokeStyle = offEye ? ERR : CYAN;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, H);
      ctx.stroke();
    }

    // 两侧标签
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    if (splitX > 95) {
      ctx.fillStyle = "rgba(4,15,18,0.85)";
      ctx.fillRect(10, 10, 128, 22);
      ctx.fillStyle = CYAN_DARK_UI;
      ctx.fillText("铜镜中：透视画板", 18, 25);
    }
    if (W - splitX > 110) {
      ctx.fillStyle = "rgba(246,247,250,0.92)";
      ctx.fillRect(W - 134, 10, 124, 22);
      ctx.fillStyle = INK;
      ctx.fillText("真实圣乔瓦尼洗礼堂", W - 126, 25);
    }

    if (readout) {
      if (offEye) {
        readout.textContent = "眼睛离开小孔偏开 15°：铜镜里的透视屋檐与真实洗礼堂立刻错位！线性透视严格绑定「单一固定视点」，艾姆斯变形屋也是利用同一个原理骗过单眼。";
      } else if (mirrorPct < 15) {
        readout.textContent = "目前只看到佛罗伦萨圣乔瓦尼洗礼堂实景。向右推移「铜镜」，把布鲁内莱斯基的透视画板叠到实景上。";
      } else if (mirrorPct > 85) {
        readout.textContent = "铜镜已覆盖全幅：小孔正好钻在洗礼堂中门的灭点处，上方抛光银箔反射真实云影，画板与实景严丝合缝。";
      } else {
        readout.textContent = `铜镜推至 ${Math.round(mirrorPct)}%：沿着分界线看屋檐斜率与地砖方向——透视画板与真实建筑无缝衔接。按下「偏离小孔」看视点一挪动会发生什么。`;
      }
    }
  }

  mirrorSlider.addEventListener("input", draw);
  if (offsetBtn) {
    offsetBtn.addEventListener("click", () => {
      offEye = !offEye;
      offsetBtn.setAttribute("aria-pressed", String(offEye));
      offsetBtn.classList.toggle("is-on", offEye);
      offsetBtn.textContent = offEye ? "复位：贴紧小孔观看" : "偏离小孔 15° 试错";
      draw();
    });
  }

  draw();
  return draw;
}

// =========================================================================
// 06 节：何时该用 vs 何时该停（透视 / 等距平行投影对照切刀）
// =========================================================================
export function initSec06() {
  const canvas = document.getElementById("sec06-canvas");
  const slider = document.getElementById("sec06-split");
  const readout = document.getElementById("sec06-readout");
  if (!canvas || !slider) return () => {};

  function drawScene(ctx, W, H, isIso) {
    ctx.fillStyle = isIso ? "#F5F8FA" : "#E8EEF2";
    ctx.fillRect(0, 0, W, H);

    const isNarrow = W < 520;

    if (!isIso) {
      // 线性透视全幅：把三座同宽 1m 展台排布在左中走廊，使默认 52% 切刀下完整清晰、绝不切字
      const vpX = W * (isNarrow ? 0.34 : 0.28);
      const vpY = H * 0.28;
      ctx.strokeStyle = "rgba(4, 165, 213, 0.26)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const k of [-0.6, -0.35, -0.15, 0.15, 0.35, 0.65, 0.95]) {
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(vpX + k * W * 0.85, H);
      }
      ctx.stroke();

      // 视平线
      ctx.strokeStyle = "rgba(6, 110, 142, 0.38)";
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(0, vpY); ctx.lineTo(W, vpY); ctx.stroke();
      ctx.setLineDash([]);

      const zs = [1.2, 2.05, 3.25];
      for (let i = zs.length - 1; i >= 0; i--) {
        const s = 1.2 / zs[i];
        const w = Math.min(W * 0.22, 185) * s;
        const h = H * 0.28 * s;
        const yBot = vpY + H * 0.59 * s;
        const yTop = yBot - h;
        const bx = vpX - w / 2;

        // 顶面透视梯形
        const topBack = 0.72;
        const yBack = yTop + (vpY - yTop) * 0.26;
        const wBack = w * topBack;
        ctx.fillStyle = i === 0 ? "#4C6470" : i === 1 ? "#8AA0AD" : "#BCC9D1";
        ctx.beginPath();
        ctx.moveTo(bx, yTop);
        ctx.lineTo(vpX - wBack / 2, yBack);
        ctx.lineTo(vpX + wBack / 2, yBack);
        ctx.lineTo(bx + w, yTop);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = i === 0 ? "#162228" : i === 1 ? "#536773" : "#8FA1AC";
        ctx.fillRect(bx, yTop, w, h);
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bx, yTop, w, h);

        if (i === 0 || i === 2) {
          const txt = i === 0 ? "实宽 1m → 图宽 100%" : "实宽 1m → 图宽 37%";
          ctx.font = `600 10.5px "JetBrains Mono", "Noto Sans SC", monospace`;
          const tw = ctx.measureText(txt).width + 10;
          const tx = clamp(bx + w + 10, 10, W - tw - 10);
          const ty = yTop + h * 0.5 - 9;
          ctx.fillStyle = "rgba(4, 15, 18, 0.88)";
          ctx.fillRect(tx, ty, tw, 18);
          ctx.fillStyle = CYAN_DARK_UI;
          ctx.fillText(txt, tx + 5, ty + 12.5);
        }
      }
      ctx.beginPath();
      ctx.arc(vpX, vpY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = CYAN;
      ctx.fill();
    } else {
      // 无灭点平行/等距投影全幅：把三座同宽 1m 展台排在右半区域，前后严格 1:1 等宽可直量
      ctx.strokeStyle = "rgba(12, 112, 84, 0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -H; x < W + H; x += 40) {
        ctx.moveTo(x, H);
        ctx.lineTo(x + H * 0.72, 0);
      }
      ctx.stroke();

      const anchorX = W * (isNarrow ? 0.62 : 0.72);
      const anchorY = H * 0.66;
      const bw = Math.min(W * 0.14, 118);
      const bh = Math.min(H * 0.20, 56);
      for (let i = 2; i >= 0; i--) {
        const bx = anchorX - bw * 0.6 + (i - 1) * (bw * 0.42);
        const by = anchorY - i * (bh * 0.88);
        // 顶面（等距平行四边形，永不收缩）
        ctx.fillStyle = "#D4E6EC";
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + bw * 0.34, by - bh * 0.34);
        ctx.lineTo(bx + bw * 1.34, by - bh * 0.34);
        ctx.lineTo(bx + bw, by);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = OK;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 正面（近远严格 1:1 等宽等高！）
        ctx.fillStyle = "#1E313B";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = OK;
        ctx.strokeRect(bx, by, bw, bh);

        if (i === 0 || i === 2) {
          const txt = "实宽 1m → 图宽 100%";
          ctx.font = `600 10.5px "JetBrains Mono", "Noto Sans SC", monospace`;
          const tw = ctx.measureText(txt).width + 10;
          const tx = clamp(bx - tw - 10, 10, W - tw - 10);
          const ty = by + bh * 0.5 - 9;
          ctx.fillStyle = OK;
          ctx.fillRect(tx, ty, tw, 18);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(txt, tx + 5, ty + 12.5);
        }
      }
    }
  }

  function draw() {
    const { ctx, W, H } = fitCanvas(canvas);
    const pct = parseFloat(slider.value);
    const sx = (pct / 100) * W;

    drawScene(ctx, W, H, true);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, sx, H);
    ctx.clip();
    drawScene(ctx, W, H, false);
    ctx.restore();

    ctx.strokeStyle = "#040F12";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, H);
    ctx.stroke();

    // 标签
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    if (sx > 110) {
      ctx.fillStyle = "#040F12";
      ctx.fillRect(10, 10, 134, 22);
      ctx.fillStyle = CYAN_DARK_UI;
      ctx.fillText("线性透视 · 临场纵深", 18, 25);
    }
    if (W - sx > 125) {
      ctx.fillStyle = OK;
      ctx.fillRect(W - 144, 10, 134, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("平行投影 · 尺寸可量", W - 136, 25);
    }

    if (readout) {
      readout.textContent =
        pct > 65
          ? "当前偏向线性透视：纵深与代入感极强，但同一块 1 m 宽的展台在远处缩成 38%，无法在图上直接量出工程尺寸。"
          : pct < 35
          ? "当前偏向平行/等距投影：没有消失点，前后三块 1 m 展台在图面上严格 1:1 等宽，适合零件装配图、施工图与建筑总平。"
          : "拖动对照切刀：左半用线性透视表达「站在现场看」的纵深情绪，右半用平行投影保住「直接量尺」的客观比例。";
    }
  }

  slider.addEventListener("input", draw);
  draw();
  return draw;
}

// =========================================================================
// 07 节：小练习（四张只差一个变量的走廊建筑图 + 答题后青色 X 光检核线）
// =========================================================================
export function initSec07() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("quiz-feedback");
  if (!cards.length) return () => {};

  let picked = null;
  const CORRECT = "C";

  const EXPLANATIONS = {
    A: "选 A 不对：只坏了一个变量——「灭点分叉」。请看 A 图上叠出的红色虚线：地砖中轴汇聚在中心视平线，但左侧三座展墙的顶边却指向偏高 18% 的第二灭点，墙体像翘起贴在地板上。正确答案是 C。",
    B: "选 B 不对：只坏了一个变量——「未按 1/z 压缩」。B 图纵线共灭点、人物也按视平线等高过眼，但地砖横缝和墙块间距被硬排成等差间距，地板看起来发平、发陡。正确答案是 C。",
    C: "答对了！C 图同时守住四条底层规矩：左侧展墙与地面中轴汇聚视平线同一点、地砖横缝按 1/z 越远越密、视平线穿过近远两位 1.7 m 观众的同一眼位，且远端明度温和减弱。",
    D: "选 D 不对：只坏了一个变量——「违反视平线等高律」。D 图的建筑纵线和 1/z 地砖全部正确，但远处那位同高观众的头顶竟然高出视平线一大截，视觉上立刻变成站在远处的巨人。正确答案是 C。",
  };

  function drawOption(canvas, opt, revealProof) {
    const { ctx, W, H } = fitCanvas(canvas);
    const vpX = W * 0.54;
    const vpY = H * 0.48;

    ctx.fillStyle = "#EFF3F6";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#D4DCE1";
    ctx.fillRect(0, vpY, W, H - vpY);

    // 地面中轴与横缝
    ctx.fillStyle = "rgba(36, 155, 185, 0.36)";
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(vpX - W * 0.11, H);
    ctx.lineTo(vpX + W * 0.11, H);
    ctx.closePath();
    ctx.fill();

    const linearTile = opt === "B";
    for (let k = 1; k <= 6; k++) {
      const y = linearTile
        ? H - (k / 7) * (H - vpY) * 0.88
        : vpY + (H - vpY) * (1 / (1 + k * 0.48));
      ctx.strokeStyle = revealProof && linearTile ? ERR : "rgba(6, 110, 142, 0.34)";
      ctx.lineWidth = revealProof && linearTile ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 左侧 3 座展墙（A 选项仅墙顶灭点偏高 -18%！）
    const wallVpY = opt === "A" ? vpY - H * 0.18 : vpY;
    const zNearList = [1.3, 2.35, 3.8];
    for (let i = 2; i >= 0; i--) {
      const t = linearTile ? i * 0.26 : 1 - 1.3 / zNearList[i];
      const tFar = linearTile ? t + 0.16 : 1 - 1.3 / (zNearList[i] + 0.62);

      const x0 = W * 0.24;
      const yBot0 = H * 0.84;
      const yTop0 = H * 0.22;

      const xIn = x0 + (vpX - x0) * t;
      const xFar = x0 + (vpX - x0) * tFar;
      const yBot = yBot0 + (vpY - yBot0) * t;
      const yBotF = yBot0 + (vpY - yBot0) * tFar;
      const yTop = yTop0 + (wallVpY - yTop0) * t;
      const yTopF = yTop0 + (wallVpY - yTop0) * tFar;
      const bw = Math.max(8, W * 0.11 * (1 - t * 0.72));

      const g = Math.round(28 + i * 56);
      ctx.fillStyle = `rgb(${g},${g + 6},${g + 10})`;
      ctx.fillRect(xIn - bw, yTop, bw, yBot - yTop);
      ctx.fillStyle = `rgb(${g + 20},${g + 26},${g + 30})`;
      ctx.beginPath();
      ctx.moveTo(xIn, yTop);
      ctx.lineTo(xFar, yTopF);
      ctx.lineTo(xFar, yBotF);
      ctx.lineTo(xIn, yBot);
      ctx.closePath();
      ctx.fill();
    }

    // 两位 1.7 m 观众背影（D 选项仅把远端人物放大并越过视平线！）
    // 近处观众：眼部对齐 vpY
    const nearFootY = H * 0.88;
    const nearHeadY = vpY - 4;
    drawSilhouette(ctx, W * 0.66, nearFootY, nearFootY - nearHeadY, "#152026", 1);

    // 远处观众
    const farFootY = vpY + (H - vpY) * 0.34;
    const farHeadY = opt === "D" ? vpY - H * 0.16 : vpY - 2;
    drawSilhouette(ctx, W * 0.47, farFootY, farFootY - farHeadY, opt === "D" && revealProof ? ERR : "#4E606B", 1);

    // 答题后叠加青/红 X 光检核线
    if (revealProof) {
      ctx.strokeStyle = opt === "C" ? OK : CYAN_DEEP;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, vpY);
      ctx.lineTo(W, vpY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (opt === "A") {
        ctx.strokeStyle = ERR;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(W * 0.24, H * 0.22);
        ctx.lineTo(vpX, wallVpY);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(vpX, wallVpY, 4, 0, Math.PI * 2); ctx.fillStyle = ERR; ctx.fill();
      }
      if (opt === "D") {
        ctx.strokeStyle = ERR;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(W * 0.42, farHeadY - 4, W * 0.10, vpY - farHeadY + 6);
      }
      ctx.beginPath();
      ctx.arc(vpX, vpY, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = opt === "C" ? OK : CYAN;
      ctx.fill();
    }
  }

  function redrawAll() {
    cards.forEach((btn) => {
      const opt = btn.dataset.quizOpt;
      const cv = btn.querySelector("canvas");
      if (cv) drawOption(cv, opt, picked !== null);
    });
  }

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      picked = btn.dataset.quizOpt;
      cards.forEach((c) => {
        const o = c.dataset.quizOpt;
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", String(o === picked));
        if (o === CORRECT) c.classList.add("is-correct");
        if (o === picked) c.classList.add("is-picked");
        if (o === picked && o !== CORRECT) c.classList.add("is-wrong");
      });
      if (feedback) {
        feedback.textContent = EXPLANATIONS[picked];
        feedback.dataset.state = picked === CORRECT ? "ok" : "err";
      }
      redrawAll();
    });
  });

  redrawAll();
  return redrawAll;
}

// =========================================================================
// 08 节：原海报灯箱（放大、拖拽平移、Esc 关闭，draggable="false"）
// =========================================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("lightbox");
  const stage = document.getElementById("lightbox-stage");
  const img = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-in");
  const zoomOutBtn = document.getElementById("lightbox-out");
  const zoomResetBtn = document.getElementById("lightbox-reset");
  if (!trigger || !posterImg || !modal || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  const apply = () => {
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  };

  const open = () => {
    if (!img.src) img.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  };

  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  };

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });

  zoomInBtn?.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3.2); apply(); });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3.2);
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  });
  zoomResetBtn?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  stage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.22 : -0.22), 1, 3.2);
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  img.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    img.setPointerCapture(e.pointerId);
  });
  img.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  const endDrag = () => { dragging = false; };
  img.addEventListener("pointerup", endDrag);
  img.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
