// 311 平面调度 · 正文 01–07 节差异化互动实验
// 全部按需脏标渲染（静置 0 空转）+ 合并点阵批绘 + 手机像素比上限 1.5，确保慢手机与软件渲染全段满帧。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  FIELD,
  PALETTE,
  PIECE_DEFS,
  QUIZ_OPTIONS,
  evaluatePlanar,
  pieceBounds,
} from "./model.js";

function fitCanvas(canvas, logW, logH) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return null;
  const maxDpr = window.innerWidth <= 640 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const tw = Math.round(rect.width * dpr);
  const th = Math.round(rect.height * dpr);
  let resized = false;
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
    resized = true;
  }
  return { sx: canvas.width / logW, sy: canvas.height / logH, resized };
}

function drawFlatPerson(ctx, cx, footY, h, color) {
  const headR = h * 0.135;
  const headY = footY - h + headR;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  const neckY = headY + headR * 1.1;
  const hemY = footY - h * 0.24;
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.17, neckY);
  ctx.lineTo(cx + h * 0.17, neckY);
  ctx.lineTo(cx + h * 0.22, hemY);
  ctx.lineTo(cx - h * 0.22, hemY);
  ctx.closePath();
  ctx.fill();
  const legW = h * 0.085;
  ctx.fillRect(cx - h * 0.11, hemY - 1, legW, footY - hemY + 1);
  ctx.fillRect(cx + h * 0.025, hemY - 1, legW, footY - hemY + 1);
}

// ---------- 01 节：压扁空间，换来秩序（俯拍机位 × 银幕成片双视窗） ----------
export function initLensLab() {
  const canvas = document.getElementById("lab01-canvas");
  const btns = [...document.querySelectorAll("[data-lens-preset]")];
  const readout = document.getElementById("lab01-readout");
  const metricAngle = document.getElementById("lab01-angle");
  const metricRatio = document.getElementById("lab01-ratio");
  const metricFlat = document.getElementById("lab01-flat");
  if (!canvas || !btns.length) return;

  const PRESETS_LENS = {
    wide24: {
      mm: 24,
      yaw: 32,
      dist: 3.4,
      ratio: "1.68×",
      flatness: "强斜角纵深",
      text: "24mm 广角斜拍（偏角 32°）：背景墙剧烈斜收，近处红衣人比远处同伴高出近七成——眼睛立刻按远近强弱读层次，这是典型的斜角纵深逻辑，而非平面调度。",
    },
    std50: {
      mm: 50,
      yaw: 16,
      dist: 6.2,
      ratio: "1.28×",
      flatness: "半斜过渡态",
      text: "50mm 标准镜半斜拍（偏角 16°）：透视收敛减弱，但背景墙线依然斜切画框；此时既不够纵深震撼，又不够平面纯粹，秩序显得摇摆。",
    },
    tele85: {
      mm: 85,
      yaw: 0,
      dist: 10.5,
      ratio: "1.08×",
      flatness: "垂直立面成立",
      text: "85mm 中长焦正对立面（偏角 0°）：机位严格垂直墙面，门窗与水平线恢复平行；前后两人身高差缩到 1.08×，开始像一张建筑立面图，由左右站位与留白决定主次。",
    },
    tele135: {
      mm: 135,
      yaw: 0,
      dist: 15.8,
      ratio: "1.04×",
      flatness: "纯二维压平",
      text: "135mm 长焦远距正对（偏角 0°）：波德维尔指出，1960 年代长焦普及正是现代电影平面调度大兴的催化剂——远近体积几乎被完全压进同一平面，人物变成画布上的几何色块。",
    },
  };

  let active = "wide24";
  let curYaw = PRESETS_LENS[active].yaw;
  let curDist = PRESETS_LENS[active].dist;
  let curMm = PRESETS_LENS[active].mm;
  let dirty = true;

  const ctx = canvas.getContext("2d");
  const W = 720;
  const H = 430;

  function syncUI() {
    const p = PRESETS_LENS[active];
    btns.forEach((b) => {
      const on = b.dataset.lensPreset === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (metricAngle) metricAngle.textContent = `${p.yaw}°`;
    if (metricRatio) metricRatio.textContent = p.ratio;
    if (metricFlat) metricFlat.textContent = p.flatness;
    if (readout) readout.textContent = p.text;
  }

  const ctrl = loop(canvas, (_t, dt, { still }) => {
    const target = PRESETS_LENS[active];
    const moving =
      Math.abs(target.yaw - curYaw) > 0.05 ||
      Math.abs(target.dist - curDist) > 0.02 ||
      Math.abs(target.mm - curMm) > 0.1;

    if (still || !moving) {
      curYaw = target.yaw;
      curDist = target.dist;
      curMm = target.mm;
    } else {
      const k = Math.min(1, (dt || 0.016) * 8.5);
      curYaw += (target.yaw - curYaw) * k;
      curDist += (target.dist - curDist) * k;
      curMm += (target.mm - curMm) * k;
      dirty = true;
    }

    const sc = fitCanvas(canvas, W, H);
    if (!sc) return;
    if (!dirty && !sc.resized) return;
    dirty = false;

    ctx.save();
    ctx.scale(sc.sx, sc.sy);

    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    const topH = 156;
    ctx.fillStyle = "#EAE3D8";
    ctx.fillRect(0, 0, W, topH);
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, topH);
    ctx.lineTo(W, topH);
    ctx.stroke();

    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = '600 11px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.fillText("俯拍片场 · 机位与背景墙夹角", 18, 22);

    const wallY = 44;
    ctx.strokeStyle = PALETTE.pine;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(110, wallY);
    ctx.lineTo(610, wallY);
    ctx.stroke();

    const pAX = 300;
    const pAY = 76;
    const pBX = 450;
    const pBY = 58;

    const yawRad = (curYaw * Math.PI) / 180;
    const normD = 42 + ((curDist - 3.4) / (15.8 - 3.4)) * 54;
    const camX = 360 - Math.sin(yawRad) * normD * 1.45;
    const camY = 58 + Math.cos(yawRad) * normD;

    const aimAngle = Math.atan2(58 - camY, 360 - camX);
    const halfFov = ((16 + (135 - curMm) * 0.25) * Math.PI) / 180;
    ctx.fillStyle = "rgba(30, 59, 47, 0.12)";
    ctx.beginPath();
    ctx.moveTo(camX, camY);
    ctx.lineTo(camX + Math.cos(aimAngle - halfFov) * 200, camY + Math.sin(aimAngle - halfFov) * 200);
    ctx.lineTo(camX + Math.cos(aimAngle + halfFov) * 200, camY + Math.sin(aimAngle + halfFov) * 200);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = curYaw <= 2 ? PALETTE.ok : PALETTE.warn;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(camX, camY);
    ctx.lineTo(360, wallY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (curYaw <= 2.5) {
      ctx.strokeStyle = PALETTE.ok;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(360, wallY + 3, 12, 12);
    }

    ctx.fillStyle = PALETTE.terracotta;
    ctx.beginPath();
    ctx.arc(pAX, pAY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    ctx.arc(pBX, pBY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(camX, camY);
    ctx.rotate(aimAngle + Math.PI / 2);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(-10, -7, 20, 14);
    ctx.fillStyle = curYaw <= 2 ? PALETTE.ok : PALETTE.terracotta;
    ctx.fillRect(-4, -11, 8, 4);
    ctx.restore();

    ctx.fillStyle = PALETTE.ink;
    ctx.font = '600 11px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(curMm)}mm · 偏角 ${Math.round(curYaw)}°`, W - 18, 22);
    ctx.textAlign = "left";

    const botY = topH + 16;
    const frameX = 48;
    const frameW = W - 96;
    const frameH = H - botY - 16;
    ctx.save();
    ctx.beginPath();
    ctx.rect(frameX, botY, frameW, frameH);
    ctx.clip();

    ctx.fillStyle = "#EFEAE0";
    ctx.fillRect(frameX, botY, frameW, frameH);

    const tilt = (curYaw / 32) * 46;
    const wallTopL = botY + 18 - tilt * 0.25;
    const wallTopR = botY + 18 + tilt * 0.85;
    const floorL = botY + frameH - 34 + tilt * 0.2;
    const floorR = botY + frameH - 34 - tilt * 0.72;

    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    ctx.moveTo(frameX, wallTopL);
    ctx.lineTo(frameX + frameW, wallTopR);
    ctx.lineTo(frameX + frameW, floorR);
    ctx.lineTo(frameX, floorL);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const u0 = 0.14 + i * 0.27;
      const u1 = u0 + 0.17;
      const interp = (a, b, u) => a + (b - a) * u;
      const x0 = frameX + frameW * u0;
      const x1 = frameX + frameW * u1;
      const t0 = interp(wallTopL, wallTopR, u0) + 28;
      const t1 = interp(wallTopL, wallTopR, u1) + 28;
      const b0 = interp(floorL, floorR, u0) - 58;
      const b1 = interp(floorL, floorR, u1) - 58;
      ctx.moveTo(x0, t0);
      ctx.lineTo(x1, t1);
      ctx.lineTo(x1, b1);
      ctx.lineTo(x0, b0);
      ctx.closePath();
    }
    ctx.fill();

    const ratioNum = 1.04 + ((135 - curMm) / (135 - 24)) ** 1.4 * 0.64;
    const baseH = 98;
    const hA = baseH * Math.min(1.52, 0.88 + (ratioNum - 1) * 0.75);
    const hB = hA / ratioNum;
    const footA = floorL + (floorR - floorL) * 0.34 + (curYaw / 32) * 14;
    const footB = floorL + (floorR - floorL) * 0.68 - (curYaw / 32) * 8;

    drawFlatPerson(ctx, frameX + frameW * 0.34, footA, hA, PALETTE.terracotta);
    drawFlatPerson(ctx, frameX + frameW * 0.68, footB, hB, PALETTE.ink);

    ctx.strokeStyle = curYaw <= 2 ? "rgba(243, 238, 229, 0.7)" : "rgba(240, 122, 91, 0.85)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(frameX + frameW * 0.34, footA - hA);
    ctx.lineTo(frameX + frameW * 0.68, footB - hB);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frameX, botY, frameW, frameH);
    ctx.restore();
  });

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.lensPreset;
      dirty = true;
      syncUI();
      ctrl.draw();
    })
  );
  syncUI();
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
}

// ---------- 02 节：四维法则，一图同生（按需绘制 + 批绘点阵） ----------
export function initAnatomyLab() {
  const canvas = document.getElementById("lab02-canvas");
  const btns = [...document.querySelectorAll("[data-anatomy-layer]")];
  const titleEl = document.getElementById("lab02-title");
  const bodyEl = document.getElementById("lab02-body");
  if (!canvas || !btns.length) return;

  const LAYERS = {
    all: {
      title: "四维叠加 · 原海报完整秩序",
      body: "311 原海报把对齐、平衡、对比、节奏四套秩序同时压缩在一块深松绿场域与周边几何形中：没有一条孤立存在，删掉任何一层，整幅构成的紧凑感都会松动。",
    },
    align: {
      title: "对齐 ALIGN · 隐形骨架轴线",
      body: "米白穿孔圆与朱红大圆共享纵轴走势，左侧米白方框与深绿主块咬合出水平腰线，底部短横条与主块底沿严丝合缝地踩在同一基线上。",
    },
    balance: {
      title: "平衡 BALANCE · 非对称杠杆支点",
      body: "朱红大圆把沉重热力压在右下方，但左上伸出的朱红横条、左下 7×7 点阵与浅米白方框一起向左延展力臂，把视觉重心稳稳拽回主块中心附近。",
    },
    contrast: {
      title: "对比 CONTRAST · 实空、冷暖、方圆",
      body: "深松绿大正方形冷而稳、朱红大圆暖而跳、米白穿孔圆以负形挖透沉重底面、右上细线框轻盈如空气——四种质地互补，谁也不盖过谁。",
    },
    rhythm: {
      title: "节奏 RHYTHM · 大块、细条与 7×7 点阵",
      body: "从大面积深绿块，过渡到中等圆、窄竖条，再收束到左下密集的 7×7 细圆点阵——视觉密度按「重—中—轻—密」起伏，眼睛像读乐谱一样有快慢停顿。",
    },
  };

  let layer = "all";
  let dirty = true;
  const ctx = canvas.getContext("2d");
  const W = 680;
  const H = 440;

  function syncUI() {
    btns.forEach((b) => {
      const on = b.dataset.anatomyLayer === layer;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (titleEl) titleEl.textContent = LAYERS[layer].title;
    if (bodyEl) bodyEl.textContent = LAYERS[layer].body;
  }

  const ctrl = loop(canvas, () => {
    const sc = fitCanvas(canvas, W, H);
    if (!sc) return;
    if (!dirty && !sc.resized) return;
    dirty = false;

    ctx.save();
    ctx.scale(sc.sx, sc.sy);

    ctx.fillStyle = "#11221A";
    ctx.fillRect(0, 0, W, H);

    const px = 66;
    const py = 36;
    const pw = W - 132;
    const ph = H - 72;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(px, py, pw, ph);

    const ux = (u) => px + u * pw;
    const vy = (v) => py + v * ph;

    ctx.save();
    ctx.globalAlpha = layer === "rhythm" ? 0.45 : 1;
    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(ux(0.30), vy(0.16), pw * 0.40, ph * 0.68);
    ctx.restore();

    // 批绘左下 7×7 点阵（1 次 fill）
    ctx.save();
    ctx.globalAlpha = layer === "all" || layer === "rhythm" || layer === "balance" ? 1 : 0.22;
    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const dx = ux(0.11 + c * 0.023);
        const dy = vy(0.58 + r * 0.04);
        ctx.moveTo(dx + 2.1, dy);
        ctx.arc(dx, dy, 2.1, 0, Math.PI * 2);
      }
    }
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = layer === "all" || layer === "align" || layer === "contrast" ? 1 : 0.28;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(ux(0.22), vy(0.50), pw * 0.19, ph * 0.12);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(ux(0.22), vy(0.50), pw * 0.19, ph * 0.12);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = layer === "all" || layer === "contrast" || layer === "align" ? 1 : 0.25;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(ux(0.61), vy(0.10), pw * 0.19, ph * 0.20);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = layer === "all" || layer === "contrast" || layer === "align" ? 1 : 0.25;
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(ux(0.53), vy(0.32), ph * 0.115, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = layer === "all" || layer === "balance" || layer === "rhythm" ? 1 : 0.25;
    ctx.fillStyle = PALETTE.terracotta;
    ctx.fillRect(ux(0.12), vy(0.22), pw * 0.27, ph * 0.055);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = layer === "all" || layer === "balance" || layer === "contrast" ? 1 : 0.3;
    ctx.fillStyle = PALETTE.terracotta;
    ctx.beginPath();
    ctx.arc(ux(0.61), vy(0.65), ph * 0.165, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = layer === "all" || layer === "rhythm" || layer === "align" ? 1 : 0.25;
    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(ux(0.755), vy(0.35), pw * 0.05, ph * 0.34);
    ctx.fillRect(ux(0.715), vy(0.805), pw * 0.175, ph * 0.035);
    ctx.restore();

    if (layer === "align" || layer === "all") {
      ctx.save();
      ctx.strokeStyle = PALETTE.terracottaText;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ux(0.53), vy(0.03));
      ctx.lineTo(ux(0.53), vy(0.45));
      ctx.moveTo(ux(0.08), vy(0.84));
      ctx.lineTo(ux(0.92), vy(0.84));
      ctx.moveTo(ux(0.30), vy(0.06));
      ctx.lineTo(ux(0.30), vy(0.90));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.terracottaText;
      ctx.beginPath();
      for (const [u, v] of [
        [0.53, 0.03],
        [0.30, 0.06],
        [0.92, 0.84],
      ]) {
        const dx = ux(u);
        const dy = vy(v);
        ctx.moveTo(dx + 3.5, dy);
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }

    if (layer === "balance" || layer === "all") {
      ctx.save();
      ctx.strokeStyle = "#1E5B43";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ux(0.255), vy(0.248));
      ctx.lineTo(ux(0.61), vy(0.65));
      ctx.stroke();
      const fx = ux(0.50);
      const fy = vy(0.52);
      ctx.fillStyle = "#1E5B43";
      ctx.beginPath();
      ctx.arc(fx, fy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.paperLight;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    if (layer === "contrast") {
      ctx.save();
      ctx.font = '700 11px "Space Grotesk", "Noto Sans SC", sans-serif';
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText("实心重面", ux(0.32), vy(0.205));
      ctx.fillText("负形穿孔", ux(0.49), vy(0.325));
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillText("热色焦点", ux(0.565), vy(0.66));
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText("线框轻空", ux(0.635), vy(0.14));
      ctx.restore();
    }

    if (layer === "rhythm") {
      ctx.save();
      ctx.strokeStyle = PALETTE.terracottaText;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ux(0.18), vy(0.71));
      ctx.quadraticCurveTo(ux(0.38), vy(0.92), ux(0.61), vy(0.78));
      ctx.quadraticCurveTo(ux(0.76), vy(0.78), ux(0.78), vy(0.52));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '700 11px "Space Grotesk", "Noto Sans SC", sans-serif';
      ctx.fillText("密 · 7×7 点阵", ux(0.08), vy(0.91));
      ctx.fillText("重 · 焦点圆", ux(0.55), vy(0.91));
      ctx.fillText("轻 · 窄竖条", ux(0.74), vy(0.31));
      ctx.restore();
    }

    ctx.restore();
  });

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      layer = b.dataset.anatomyLayer;
      dirty = true;
      syncUI();
      ctrl.draw();
    })
  );
  syncUI();
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
}

// ---------- 03 节：视觉重量，不是面积（阿恩海姆物理天平，停稳即零空转） ----------
export function initLeverLab() {
  const canvas = document.getElementById("lab03-canvas");
  const shapeBtns = [...document.querySelectorAll("[data-lever-shape]")];
  const colorBtns = [...document.querySelectorAll("[data-lever-color]")];
  const armBtns = [...document.querySelectorAll("[data-lever-arm]")];
  const ratioEl = document.getElementById("lab03-ratio");
  const verdictEl = document.getElementById("lab03-verdict");
  const descEl = document.getElementById("lab03-desc");
  if (!canvas || !shapeBtns.length) return;

  const LEFT_TORQUE = 3.6;
  const SHAPES = {
    circle: { label: "实心大圆", factor: 1.5 },
    bar: { label: "细长横条", factor: 0.72 },
    frame: { label: "空心线框", factor: 0.42 },
  };
  const COLORS = {
    terracotta: { label: "陶橘红", hex: PALETTE.terracotta, factor: 1.65 },
    pine: { label: "深松绿", hex: PALETTE.pine, factor: 1.15 },
    stone: { label: "浅暖灰", hex: "#BDB3A4", factor: 0.62 },
  };
  const ARMS = {
    near: { label: "近端 1×", mult: 1.0 },
    mid: { label: "中段 2×", mult: 2.0 },
    far: { label: "远端 3×", mult: 3.0 },
  };

  let shape = "bar";
  let color = "stone";
  let arm = "near";
  let curTilt = -15.3;
  let dirty = true;

  const ctx = canvas.getContext("2d");
  const W = 700;
  const H = 310;

  function compute() {
    const rightWeight = SHAPES[shape].factor * COLORS[color].factor;
    const rightTorque = rightWeight * ARMS[arm].mult;
    const ratio = rightTorque / LEFT_TORQUE;
    const diff = ratio - 1;
    const ok = Math.abs(diff) <= 0.16;
    const targetTilt = Math.max(-16, Math.min(16, diff * 18));
    return { rightWeight, rightTorque, ratio, diff, ok, targetTilt };
  }

  function syncUI() {
    shapeBtns.forEach((b) => {
      const on = b.dataset.leverShape === shape;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    colorBtns.forEach((b) => {
      const on = b.dataset.leverColor === color;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    armBtns.forEach((b) => {
      const on = b.dataset.leverArm === arm;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const m = compute();
    if (ratioEl) ratioEl.textContent = `右 : 左 ≈ ${m.ratio.toFixed(2)} : 1（示意）`;
    if (verdictEl) {
      verdictEl.textContent = m.ok ? "非对称均衡成立" : m.diff < 0 ? "左侧下沉 · 右翼偏轻" : "右侧压翻 · 力矩过载";
      verdictEl.dataset.state = m.ok ? "ok" : "warn";
    }
    if (descEl) {
      if (m.ok) {
        descEl.textContent = `面积并不相等，但「${COLORS[color].label}${SHAPES[shape].label}」放在${ARMS[arm].label}时，色彩张力与力臂乘积恰好托住了左侧近中轴的深绿大块——这正是 311 原海报「左小暖条配平右大色块」的秘密。`;
      } else if (m.diff < 0) {
        descEl.textContent = `「${COLORS[color].label}${SHAPES[shape].label}」放在${ARMS[arm].label}的经验视觉力矩只有左侧的 ${Math.round(
          m.ratio * 100
        )}%，撑不起深绿大块。试试换高饱和陶橘红，或者直接把砝码往远端挪长力臂。`;
      } else {
        descEl.textContent = `「${COLORS[color].label}${SHAPES[shape].label}」加${ARMS[arm].label}力臂后，右侧力矩反超左侧 ${Math.round(
          (m.ratio - 1) * 100
        )}%，把天平压向右边。往回缩近一格力臂，或换成更轻的细条/空心框试试。`;
      }
    }
  }

  const ctrl = loop(canvas, (_t, dt, { still }) => {
    const m = compute();
    const moving = Math.abs(m.targetTilt - curTilt) > 0.04;
    if (still || !moving) {
      curTilt = m.targetTilt;
    } else {
      const k = Math.min(1, (dt || 0.016) * 8);
      curTilt += (m.targetTilt - curTilt) * k;
      dirty = true;
    }

    const sc = fitCanvas(canvas, W, H);
    if (!sc) return;
    if (!dirty && !sc.resized) return;
    dirty = false;

    ctx.save();
    ctx.scale(sc.sx, sc.sy);

    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, W, H);

    const pivotX = W * 0.44;
    const pivotY = 222;
    ctx.strokeStyle = "rgba(15, 31, 24, 0.16)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(46, pivotY);
    ctx.lineTo(W - 46, pivotY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = m.ok ? PALETTE.ok : PALETTE.pine;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY + 2);
    ctx.lineTo(pivotX - 18, pivotY + 38);
    ctx.lineTo(pivotX + 18, pivotY + 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX - 58, pivotY + 38);
    ctx.lineTo(pivotX + 58, pivotY + 38);
    ctx.stroke();

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate((curTilt * Math.PI) / 180);

    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(-170, -3, 470, 6);

    const armX = { near: 82, mid: 168, far: 256 };
    for (const [kArm, xPos] of Object.entries(armX)) {
      ctx.fillStyle = kArm === arm ? PALETTE.terracotta : PALETTE.ink;
      ctx.fillRect(xPos - 2, -10, 4, 14);
      ctx.font = '600 10px "Space Grotesk", "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = kArm === arm ? PALETTE.terracottaText : PALETTE.inkMuted;
      ctx.fillText(ARMS[kArm].label, xPos, 24);
    }

    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(-142, -105, 94, 102);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("固定主块", -95, -52);

    const rx = armX[arm];
    const colHex = COLORS[color].hex;
    if (shape === "circle") {
      ctx.fillStyle = colHex;
      ctx.beginPath();
      ctx.arc(rx, -43, 40, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "bar") {
      ctx.fillStyle = colHex;
      ctx.fillRect(rx - 44, -29, 88, 26);
    } else {
      ctx.strokeStyle = colHex;
      ctx.lineWidth = 4;
      ctx.strokeRect(rx - 36, -75, 72, 70);
    }

    ctx.fillStyle = PALETTE.paperLight;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = m.ok ? PALETTE.ok : PALETTE.warn;
    ctx.font = '700 12px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(
      m.ok ? "倾角 ≈ 0° · 平衡带内" : `杠杆倾角 ${curTilt > 0 ? "+" : ""}${curTilt.toFixed(1)}°`,
      20,
      28
    );

    ctx.restore();
  });

  const trigger = () => {
    dirty = true;
    syncUI();
    ctrl.draw();
  };
  shapeBtns.forEach((b) => b.addEventListener("click", () => { shape = b.dataset.leverShape; trigger(); }));
  colorBtns.forEach((b) => b.addEventListener("click", () => { color = b.dataset.leverColor; trigger(); }));
  armBtns.forEach((b) => b.addEventListener("click", () => { arm = b.dataset.leverArm; trigger(); }));
  syncUI();
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
}

// ---------- 04 节：疏密有喘息，才成节奏（按需重画 + 批绘点阵） ----------
export function initRhythmLab() {
  const canvas = document.getElementById("lab04-canvas");
  const slotBtns = [...document.querySelectorAll("[data-beat-slot]")];
  const presetBtns = [...document.querySelectorAll("[data-beat-preset]")];
  const verdictEl = document.getElementById("lab04-verdict");
  const descEl = document.getElementById("lab04-desc");
  if (!canvas || !slotBtns.length) return;

  const CYCLE = ["block", "bar", "dots", "void"];
  const META = {
    block: { label: "大块", density: 1.0 },
    bar: { label: "细条", density: 0.55 },
    dots: { label: "点阵", density: 0.35 },
    void: { label: "留白", density: 0.0 },
  };
  const PRESETS_BEAT = {
    flat: ["block", "block", "block", "block", "block", "block", "block", "block"],
    gradual: ["block", "block", "bar", "bar", "dots", "void", "void", "bar"],
    cluster: ["dots", "block", "void", "void", "bar", "block", "void", "bar"],
  };

  let slots = [...PRESETS_BEAT.flat];
  let dirty = true;
  const ctx = canvas.getContext("2d");
  const W = 720;
  const H = 260;

  function analyze() {
    const vals = slots.map((s) => META[s].density);
    const voids = slots.filter((s) => s === "void").length;
    const kinds = new Set(slots).size;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
    let changes = 0;
    for (let i = 1; i < slots.length; i++) if (slots[i] !== slots[i - 1]) changes++;

    if (voids === 0 && std < 0.15) {
      return {
        state: "warn",
        title: "机械铺满 · 零呼吸感（经验判定）",
        text: "8 个槽位塞满同等重量的块，视觉密度像一条平直的墙砖线——整齐却沉闷，视线没有停顿点。点按中间一两格切成「留白」或「点阵」试试。",
      };
    }
    if (voids >= 6) {
      return {
        state: "warn",
        title: "过度空散 · 撑不起节奏（经验判定）",
        text: "留白超过了七成，只剩零星孤点，平面组织松垮断节。补回 2–3 格「大块」或「细条」，先建立主群落再留空。",
      };
    }
    if (std < 0.22 || kinds < 2) {
      return {
        state: "warn",
        title: "反差偏弱 · 节拍平淡（经验判定）",
        text: "相邻槽位的轻重变化太接近，眼睛扫过像匀速节拍器。把大块、细条、点阵与留白混搭出明显起伏，节奏才会立起来。",
      };
    }
    if (voids === 0) {
      return {
        state: "warn",
        title: "有变化但缺休止符（经验判定）",
        text: "虽然混用了不同形态，但一格留白都没有，整排元素从头堵到尾。给画面加 1–3 格「留白」当音乐里的休止符，立刻透气。",
      };
    }
    return {
      state: "ok",
      title: `疏密成立 · ${kinds} 种密度 / ${voids} 格休止（经验判定）`,
      text: `密度曲线出现了清晰的峰谷起伏（换拍 ${changes} 次，含 ${voids} 格留白喘息）：密处形成视觉群落，疏处让目光减速呼吸，既有秩序又不呆板。`,
    };
  }

  function syncUI() {
    slotBtns.forEach((b, i) => {
      const k = slots[i];
      b.dataset.kind = k;
      b.textContent = `${i + 1} ${META[k].label}`;
      b.setAttribute("aria-label", `第 ${i + 1} 格：${META[k].label}，点击切换`);
    });
    const res = analyze();
    if (verdictEl) {
      verdictEl.textContent = res.title;
      verdictEl.dataset.state = res.state;
    }
    if (descEl) descEl.textContent = res.text;
  }

  const ctrl = loop(canvas, () => {
    const sc = fitCanvas(canvas, W, H);
    if (!sc) return;
    if (!dirty && !sc.resized) return;
    dirty = false;

    ctx.save();
    ctx.scale(sc.sx, sc.sy);

    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, W, H);

    const padX = 28;
    const innerW = W - padX * 2;
    const cellW = innerW / 8;
    const bandY = 26;
    const bandH = 122;

    ctx.strokeStyle = "rgba(15, 31, 24, 0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padX, bandY, innerW, bandH);

    // 合并网格分隔虚线
    ctx.strokeStyle = "rgba(15, 31, 24, 0.1)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const x = padX + i * cellW;
      ctx.moveTo(x, bandY);
      ctx.lineTo(x, bandY + bandH);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    slots.forEach((k, i) => {
      const x = padX + i * cellW;
      if (k === "block") {
        ctx.fillStyle = i % 3 === 1 ? PALETTE.terracotta : PALETTE.pine;
        ctx.fillRect(x + 9, bandY + 14, cellW - 18, bandH - 28);
      } else if (k === "bar") {
        ctx.fillStyle = PALETTE.pine;
        ctx.fillRect(x + cellW * 0.32, bandY + 14, cellW * 0.14, bandH - 28);
        ctx.fillStyle = PALETTE.terracotta;
        ctx.fillRect(x + cellW * 0.56, bandY + 34, cellW * 0.12, bandH - 48);
      } else if (k === "dots") {
        ctx.fillStyle = PALETTE.pine;
        ctx.beginPath();
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 4; c++) {
            const dx = x + 18 + c * 15;
            const dy = bandY + 26 + r * 17;
            ctx.moveTo(dx + 2.2, dy);
            ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(15, 31, 24, 0.18)";
        ctx.setLineDash([2, 4]);
        ctx.strokeRect(x + 18, bandY + 38, cellW - 36, bandH - 76);
        ctx.setLineDash([]);
      }
    });

    const waveTop = 172;
    const waveBot = 236;
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = '600 10px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.fillText("视觉密度起伏（高=重聚 · 低=留白休止）", padX, waveTop - 6);

    ctx.strokeStyle = "rgba(15, 31, 24, 0.15)";
    ctx.beginPath();
    ctx.moveTo(padX, waveBot);
    ctx.lineTo(padX + innerW, waveBot);
    ctx.stroke();

    const pts = slots.map((k, i) => ({
      x: padX + (i + 0.5) * cellW,
      y: waveBot - META[k].density * (waveBot - waveTop - 6),
    }));

    ctx.beginPath();
    ctx.moveTo(pts[0].x, waveBot);
    pts.forEach((p, idx) => {
      if (idx === 0) ctx.lineTo(p.x, p.y);
      else {
        const prev = pts[idx - 1];
        const mx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(mx, prev.y, mx, p.y, p.x, p.y);
      }
    });
    ctx.lineTo(pts[pts.length - 1].x, waveBot);
    ctx.closePath();
    ctx.fillStyle = "rgba(30, 59, 47, 0.14)";
    ctx.fill();

    ctx.beginPath();
    pts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = pts[idx - 1];
        const mx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(mx, prev.y, mx, p.y, p.x, p.y);
      }
    });
    ctx.strokeStyle = PALETTE.pine;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    pts.forEach((p, i) => {
      ctx.fillStyle = slots[i] === "void" ? PALETTE.paperLight : PALETTE.terracotta;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    ctx.restore();
  });

  slotBtns.forEach((b, i) =>
    b.addEventListener("click", () => {
      const idx = CYCLE.indexOf(slots[i]);
      slots[i] = CYCLE[(idx + 1) % CYCLE.length];
      dirty = true;
      syncUI();
      ctrl.draw();
    })
  );
  presetBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const p = PRESETS_BEAT[b.dataset.beatPreset];
      if (!p) return;
      slots = [...p];
      dirty = true;
      syncUI();
      ctrl.draw();
    })
  );
  syncUI();
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
}

// ---------- 05 节：从画框到银幕的脉络（按需绘制） ----------
export function initHistoryLab() {
  const canvas = document.getElementById("lab05-canvas");
  const btns = [...document.querySelectorAll("[data-era]")];
  const yearEl = document.getElementById("lab05-year");
  const titleEl = document.getElementById("lab05-title");
  const bodyEl = document.getElementById("lab05-body");
  if (!canvas || !btns.length) return;

  const ERAS = {
    "1915": {
      year: "1915 · 沃尔夫林《艺术史的基本概念》",
      title: "平面（Plane）与纵深（Recession）之分",
      body: "瑞士艺术史家海因里希·沃尔夫林在 1915 年德文初版《艺术史的基本概念》（Kunstgeschichtliche Grundbegriffe）中，把「平面与纵深」列为五对核心形式范畴之一：古典文艺复兴绘画常把人物按平行于画面的薄层有序排开，而巴洛克则改用斜向穿入画面的纵深退缩。",
    },
    "1926": {
      year: "1926 · 康定斯基《点、线、面》（包豪斯丛书 9）",
      title: "把二维基础平面当作带张力的力场",
      body: "瓦西里·康定斯基 1926 年在包豪斯丛书第 9 卷《点、线、面》（Punkt und Linie zu Fläche）中指出，画布（Basic Plane）绝不是一块中性的空板——上方轻盈自由、下方沉重稳固、左右阻力不同，点、线、面落在不同位置就会激发截然不同的心理张力。",
    },
    "1954": {
      year: "1954 / 1974 · 阿恩海姆《艺术与视知觉》",
      title: "格式塔视觉重量与杠杆平衡定律",
      body: "鲁道夫·阿恩海姆在 1954 年初版、1974 年修订扩展的《艺术与视知觉》第一章「平衡」中，借助物理杠杆来解释人眼对画面的平衡判断：大小、高饱和色彩、形状复杂度与远离中心轴的距离都会增大「视觉重量」，因此非对称排布照样能达到严谨均衡。",
    },
    "2005": {
      year: "1997 / 2005 · 波德维尔《光影塑形》与银幕立面",
      title: "Planimetric Staging：把电影镜头摆正成画布",
      body: "电影学者大卫·波德维尔在《电影风格史》（1997）与《光影塑形：论电影场面调度》（2005）中借用沃尔夫林的平面概念，梳理了电影史上的平面调度（Planimetric Staging）：从巴斯特·基顿的静默喜剧几何走位、1960 年代戈达尔的正面墙面构图、长焦普及后侯孝贤与安哲罗普洛斯的远距扁平调度，一直到韦斯·安德森垂直立面的绘本式舞台。",
    },
  };

  let active = "1915";
  let dirty = true;
  const ctx = canvas.getContext("2d");
  const W = 560;
  const H = 320;

  function syncUI() {
    btns.forEach((b) => {
      const on = b.dataset.era === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const e = ERAS[active];
    if (yearEl) yearEl.textContent = e.year;
    if (titleEl) titleEl.textContent = e.title;
    if (bodyEl) bodyEl.textContent = e.body;
  }

  const ctrl = loop(canvas, () => {
    const sc = fitCanvas(canvas, W, H);
    if (!sc) return;
    if (!dirty && !sc.resized) return;
    dirty = false;

    ctx.save();
    ctx.scale(sc.sx, sc.sy);

    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    if (active === "1915") {
      const layers = [
        { y: 78, h: 48, col: "rgba(30, 59, 47, 0.2)", label: "后平面层" },
        { y: 138, h: 56, col: "rgba(30, 59, 47, 0.48)", label: "中平面层" },
        { y: 206, h: 62, col: PALETTE.pine, label: "前平面层" },
      ];
      layers.forEach((ly, i) => {
        ctx.fillStyle = ly.col;
        ctx.fillRect(58, ly.y, W - 116, ly.h);
        ctx.fillStyle = i === 2 ? PALETTE.paperLight : PALETTE.ink;
        ctx.font = '600 12px "Noto Sans SC", sans-serif';
        ctx.fillText(ly.label, 74, ly.y + ly.h / 2 + 4);
      });
      drawFlatPerson(ctx, 240, 266, 78, PALETTE.terracotta);
      drawFlatPerson(ctx, 355, 266, 78, PALETTE.paper);
      drawFlatPerson(ctx, 450, 266, 78, PALETTE.terracotta);
    } else if (active === "1926") {
      ctx.strokeStyle = "rgba(15, 31, 24, 0.2)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 26);
      ctx.lineTo(W / 2, H - 26);
      ctx.moveTo(26, H / 2);
      ctx.lineTo(W - 26, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.fillText("上：轻盈 · 开放", 34, 42);
      ctx.fillText("下：沉稳 · 凝重", 34, H - 30);
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(108, 134, 150, 120);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(92, 92);
      ctx.lineTo(448, 224);
      ctx.stroke();
      ctx.fillStyle = PALETTE.terracotta;
      ctx.beginPath();
      ctx.arc(386, 108, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(185, 86, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (active === "1954") {
      ctx.strokeStyle = "rgba(30, 59, 47, 0.35)";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.lineTo(W - 40, H - 40);
      ctx.moveTo(W - 40, 40);
      ctx.lineTo(40, H - 40);
      ctx.moveTo(W / 2, 40);
      ctx.lineTo(W / 2, H - 40);
      ctx.moveTo(40, H / 2);
      ctx.lineTo(W - 40, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = PALETTE.pine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(W / 2 - 96, H / 2 - 22, 74, 86);
      ctx.fillStyle = PALETTE.terracotta;
      ctx.beginPath();
      ctx.arc(W - 118, 92, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.terracottaText;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 59, H / 2 + 20);
      ctx.lineTo(W - 118, 92);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.fillText("近中轴大块", W / 2 - 118, H / 2 + 84);
      ctx.fillText("远端高饱和小圆", W - 186, 56);
    } else {
      const fx = 96;
      const fy = 40;
      const fw = W - 192;
      const fh = H - 80;
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = PALETTE.paper;
      for (let i = 0; i < 3; i++) {
        const ax = fx + 24 + i * 118;
        ctx.fillRect(ax, fy + 26, 84, 134);
        ctx.beginPath();
        ctx.arc(ax + 42, fy + 26, 42, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = "#D4C9B8";
      ctx.fillRect(fx, fy + fh - 38, fw, 38);
      ctx.fillStyle = PALETTE.terracotta;
      ctx.fillRect(fx + 104, fy + fh - 118, 160, 18);
      drawFlatPerson(ctx, fx + 66, fy + fh - 30, 82, PALETTE.ink);
      drawFlatPerson(ctx, fx + fw / 2, fy + fh - 30, 86, PALETTE.terracotta);
      drawFlatPerson(ctx, fx + fw - 66, fy + fh - 30, 82, PALETTE.ink);
    }

    ctx.restore();
  });

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.era;
      dirty = true;
      syncUI();
      ctrl.draw();
    })
  );
  syncUI();
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
}

// ---------- 06 节：什么时候别用平面调度（按需绘制） ----------
export function initAvoidLab() {
  const canvas = document.getElementById("lab06-canvas");
  const btns = [...document.querySelectorAll("[data-avoid-case]")];
  const badEl = document.getElementById("lab06-bad");
  const goodEl = document.getElementById("lab06-good");
  if (!canvas || !btns.length) return;

  const CASES = {
    chase: {
      badTitle: "硬套平面：变成冷静的滑稽横版过关",
      badDesc: "正对平行墙面会立刻拉出「剧场第四堵墙」的抽离感，追逐压迫力荡然无存，反倒像冷面喜剧。",
      goodTitle: "改用纵深斜角：迫近压迫感立刻回来",
      goodDesc: "压低并斜置机位、把追兵推近前景，用 310 深度调度或 314 多层前景调度拉出压迫走廊。",
    },
    narrow: {
      badTitle: "硬套平面：狭室退不开，广角把边上人拉胖",
      badDesc: "平面调度常依赖后退加中长焦消除透视；在窄走廊贴墙用广角硬摆平，边缘人物会被桶形畸变拽歪。",
      goodTitle: "改顺走廊纵深：借墙壁自然引导视线",
      goodDesc: "顺着狭小空间本身的纵深轴拍，让墙面与门框充当框架引导，不再和物理条件硬碰硬。",
    },
    apex: {
      badTitle: "硬套平面：平权分布削弱唯一最高焦点",
      badDesc: "海报或海报式镜头需要把所有视线强行吸向唯一的顶点主角时，均匀讲究均衡的平面调度会让目光分散。",
      goodTitle: "改用三角汇聚：底宽顶窄直锁唯一主角",
      goodDesc: "用 312 三角调度把两侧陪衬压低成底托，让斜线与高低差把视线一口气送到顶点。",
    },
    clutter: {
      badTitle: "硬套平面：杂乱背景与主体压死成一团噪点",
      badDesc: "平面调度把所有景层贴在同一焦平面上——背景架子、招牌和电线会直接长在人物脑袋后面。",
      goodTitle: "先净化立面，或改用大光圈拉开景深",
      goodDesc: "要么退回干净色块墙面，要么放弃平面压平，改用虚化与纵深把杂乱背景彻底甩到后面。",
    },
  };

  let active = "chase";
  let dirty = true;
  const ctx = canvas.getContext("2d");
  const W = 720;
  const H = 290;

  function syncUI() {
    btns.forEach((b) => {
      const on = b.dataset.avoidCase === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const c = CASES[active];
    if (badEl) badEl.innerHTML = `<strong>${c.badTitle}</strong><span>${c.badDesc}</span>`;
    if (goodEl) goodEl.innerHTML = `<strong>${c.goodTitle}</strong><span>${c.goodDesc}</span>`;
  }

  const ctrl = loop(canvas, () => {
    const sc = fitCanvas(canvas, W, H);
    if (!sc) return;
    if (!dirty && !sc.resized) return;
    dirty = false;

    ctx.save();
    ctx.scale(sc.sx, sc.sy);

    ctx.fillStyle = "#11221A";
    ctx.fillRect(0, 0, W, H);

    const pad = 20;
    const gap = 24;
    const fw = (W - pad * 2 - gap) / 2;
    const fh = H - 56;
    const fy = 40;

    ctx.font = '700 12px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.fillStyle = PALETTE.terracottaBright;
    ctx.fillText("× 硬套平面调度", pad, 26);
    ctx.fillStyle = "#8FD6B5";
    ctx.fillText("✓ 换用合适调度", pad + fw + gap, 26);

    const lx = pad;
    const rx = pad + fw + gap;

    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(lx, fy, fw, fh);
    ctx.fillRect(rx, fy, fw, fh);

    if (active === "chase") {
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(lx, fy + 28, fw, fh - 68);
      ctx.fillStyle = PALETTE.paper;
      for (let i = 0; i < 4; i++) ctx.fillRect(lx + 24 + i * 76, fy + 48, 42, 66);
      drawFlatPerson(ctx, lx + 115, fy + fh - 26, 62, PALETTE.ink);
      drawFlatPerson(ctx, lx + 225, fy + fh - 26, 62, PALETTE.terracotta);

      ctx.fillStyle = PALETTE.pine;
      ctx.beginPath();
      ctx.moveTo(rx, fy);
      ctx.lineTo(rx + fw, fy + 68);
      ctx.lineTo(rx + fw, fy + fh - 54);
      ctx.lineTo(rx, fy + fh);
      ctx.closePath();
      ctx.fill();
      drawFlatPerson(ctx, rx + 252, fy + fh - 62, 50, PALETTE.terracotta);
      drawFlatPerson(ctx, rx + 96, fy + fh - 10, 146, PALETTE.ink);
    } else if (active === "narrow") {
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(lx + 16, fy + 18, fw - 32, fh - 48);
      ctx.save();
      ctx.translate(lx + 68, fy + fh - 24);
      ctx.scale(1.55, 0.96);
      drawFlatPerson(ctx, 0, 0, 96, PALETTE.terracotta);
      ctx.restore();
      drawFlatPerson(ctx, lx + fw / 2, fy + fh - 24, 96, PALETTE.paper);
      ctx.save();
      ctx.translate(lx + fw - 68, fy + fh - 24);
      ctx.scale(1.55, 0.96);
      drawFlatPerson(ctx, 0, 0, 96, PALETTE.terracotta);
      ctx.restore();

      ctx.fillStyle = PALETTE.pine;
      ctx.beginPath();
      ctx.moveTo(rx, fy);
      ctx.lineTo(rx + fw * 0.34, fy + fh * 0.28);
      ctx.lineTo(rx + fw * 0.34, fy + fh * 0.72);
      ctx.lineTo(rx, fy + fh);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rx + fw, fy);
      ctx.lineTo(rx + fw * 0.66, fy + fh * 0.28);
      ctx.lineTo(rx + fw * 0.66, fy + fh * 0.72);
      ctx.lineTo(rx + fw, fy + fh);
      ctx.closePath();
      ctx.fill();
      drawFlatPerson(ctx, rx + fw * 0.5, fy + fh * 0.74, 68, PALETTE.terracotta);
    } else if (active === "apex") {
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(lx + 26, fy + 82, 74, 98);
      ctx.fillStyle = PALETTE.terracotta;
      ctx.fillRect(lx + 124, fy + 82, 74, 98);
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(lx + 222, fy + 82, 74, 98);

      ctx.strokeStyle = "rgba(30, 59, 47, 0.45)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx + fw / 2, fy + 26);
      ctx.lineTo(rx + 46, fy + fh - 26);
      ctx.lineTo(rx + fw - 46, fy + fh - 26);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(rx + 48, fy + fh - 74, 72, 48);
      ctx.fillRect(rx + fw - 120, fy + fh - 74, 72, 48);
      ctx.fillStyle = PALETTE.terracotta;
      ctx.beginPath();
      ctx.arc(rx + fw / 2, fy + 66, 36, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = i % 2 === 0 ? PALETTE.pine : PALETTE.ink;
        ctx.fillRect(lx + 12 + (i % 6) * 52, fy + 16 + Math.floor(i / 6) * 68, 38, 46);
      }
      drawFlatPerson(ctx, lx + fw / 2, fy + fh - 20, 118, PALETTE.terracotta);

      ctx.fillStyle = PALETTE.pine;
      ctx.fillRect(rx + 28, fy + 24, fw - 56, fh - 48);
      ctx.fillStyle = PALETTE.paper;
      ctx.beginPath();
      ctx.arc(rx + fw * 0.34, fy + 74, 24, 0, Math.PI * 2);
      ctx.fill();
      drawFlatPerson(ctx, rx + fw * 0.56, fy + fh - 26, 118, PALETTE.terracotta);
    }

    ctx.strokeStyle = PALETTE.terracottaBright;
    ctx.lineWidth = 2;
    ctx.strokeRect(lx, fy, fw, fh);
    ctx.strokeStyle = "#8FD6B5";
    ctx.strokeRect(rx, fy, fw, fh);

    ctx.restore();
  });

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.avoidCase;
      dirty = true;
      syncUI();
      ctrl.draw();
    })
  );
  syncUI();
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
}

// ---------- 07 节：小练习 ----------
export function initQuizLab() {
  const cards = [...document.querySelectorAll("[data-quiz-option]")];
  const resultBox = document.getElementById("quiz-result");
  const resultTitle = document.getElementById("quiz-result-title");
  const resultBody = document.getElementById("quiz-result-body");
  if (!cards.length) return;

  let answered = null;
  const W = 320;
  const H = 200;

  function drawOption(canvas, opt, reveal) {
    const sc = fitCanvas(canvas, W, H);
    if (!sc) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.scale(sc.sx, sc.sy);

    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(FIELD.x * W, FIELD.y * H, FIELD.w * W, FIELD.h * H);

    const drawOrder = ["darkBar", "cutoutCircle", "accentCircle", "warmBar"];
    for (const id of drawOrder) {
      const def = PIECE_DEFS[id];
      const pos = opt.state.pieces[id];
      if (def.kind === "circle") {
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.arc(pos.u * W, pos.v * H, def.r * H, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const b = pieceBounds(id, pos);
        ctx.fillStyle = def.color;
        ctx.fillRect(b.left * W, b.top * H, b.w * W, b.h * H);
      }
    }

    if (reveal) {
      const ev = evaluatePlanar(opt.state);
      ctx.strokeStyle = ev.alignOk ? "rgba(30, 91, 67, 0.72)" : "rgba(184, 59, 30, 0.45)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const ln of ev.alignLines.slice(0, 3)) {
        if (ln.axis === "x") {
          ctx.moveTo(ln.val * W, 6);
          ctx.lineTo(ln.val * W, H - 6);
        } else {
          ctx.moveTo(6, ln.val * H);
          ctx.lineTo(W - 6, ln.val * H);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(15, 31, 24, 0.35)";
      ctx.beginPath();
      ctx.moveTo(W / 2, H - 14);
      ctx.lineTo(W / 2, H - 2);
      ctx.stroke();

      const gx = ev.cx * W;
      const gy = ev.cy * H;
      ctx.fillStyle = opt.correct ? PALETTE.ok : PALETTE.warn;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 5);
      ctx.lineTo(gx + 5, gy);
      ctx.lineTo(gx, gy + 5);
      ctx.lineTo(gx - 5, gy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PALETTE.paperLight;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderAll() {
    cards.forEach((card) => {
      const key = card.dataset.quizOption;
      const opt = QUIZ_OPTIONS.find((o) => o.key === key);
      const canvas = card.querySelector("canvas");
      if (opt && canvas) drawOption(canvas, opt, answered !== null);
      const isPicked = answered === key;
      card.classList.toggle("is-picked", isPicked);
      card.classList.toggle("is-correct", answered !== null && opt.correct);
      card.classList.toggle("is-wrong", answered !== null && isPicked && !opt.correct);
      card.setAttribute("aria-pressed", String(isPicked));
    });
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.dataset.quizOption;
      const opt = QUIZ_OPTIONS.find((o) => o.key === key);
      if (!opt) return;
      answered = key;
      renderAll();
      if (resultBox && resultTitle && resultBody) {
        resultBox.hidden = false;
        resultBox.dataset.state = opt.correct ? "ok" : "warn";
        const ev = evaluatePlanar(opt.state);
        resultTitle.textContent = opt.correct
          ? `判断准确：${opt.title}（重心 ${ev.dxPct >= 0 ? "+" : ""}${ev.dxPct}% · ${ev.alignCount} 组对齐）`
          : `再看一眼：你选了 ${opt.title}（实测重心 ${ev.dxPct >= 0 ? "+" : ""}${ev.dxPct}%）`;
        resultBody.textContent = opt.explain;
      }
    });
  });

  requestAnimationFrame(renderAll);
  window.addEventListener("resize", renderAll);
}
