// 350 全图页主控入口：全幅满屏暗房导演台（2D Canvas 标 data-perf-drag）+ 各章交互初始化
// 单真源驱动：画布绘制、真像素测光、三枚原海报折线引注、底部四支柱与白话诊单全部由 model.js 计算

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  SCENES,
  BAD_INITIAL,
  SOLUTIONS,
  WRONG_PRESETS,
  clamp,
  evaluateSlide,
} from "./model.js";
import { getScenePlate, drawCroppedPlate } from "./scenes.js";
import {
  initCurtainLab,
  initScrimLab,
  initCropLab,
  initAvoidCards,
  initQuiz,
  initLightbox,
} from "./labs.js";

const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");

const ui = {
  topPill: document.getElementById("top-pill"),
  diagScore: document.getElementById("diag-score"),
  diagWcag: document.getElementById("diag-wcag"),
  diagBleed: document.getElementById("diag-bleed"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagNext: document.getElementById("diag-next"),
  bleedRange: document.getElementById("bleed-range"),
  bleedVal: document.getElementById("bleed-val"),
  stFullbleed: document.getElementById("st-fullbleed"),
  stOverlay: document.getElementById("st-overlay"),
  stFocal: document.getElementById("st-focal"),
  stImmersion: document.getElementById("st-immersion"),
  pillarItems: document.querySelectorAll(".pillar-item"),
};

// 当前实时状态（开场刻意停在 0/4 缩框+密字+无遮罩压焦点坏态）
const state = { ...BAD_INITIAL };

// 影院翻页状态（按 Space 或按钮触发：先闪播 0.78s 传统项目符号旧页，再切入本全图页 1.7s 静场验真）
const cinema = {
  active: false,
  elapsed: 0,
  cutAt: 0.78,
  total: 2.55,
};

// 可点击的三枚原海报折线引注命中区域（每帧随真实坐标刷新）
let hitCallouts = [];
let lastEval = null;
let lastTextPx = { x: 0, y: 0, w: 0, h: 0 };

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function syncControls() {
  document.querySelectorAll("[data-scene]").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-copy]").forEach((b) => {
    const on = b.dataset.copy === state.copyMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-scrim]").forEach((b) => {
    const on = b.dataset.scrim === state.scrim;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-light]").forEach((b) => {
    const on = b.dataset.light === state.lighting;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (ui.bleedRange) ui.bleedRange.value = String(Math.round(state.bleedZoom * 100));
}

function updateReadouts(ev) {
  const pass = ev.score === 4;
  if (ui.topPill) {
    ui.topPill.textContent = ev.chipLabel;
    ui.topPill.classList.toggle("is-pass", pass);
  }
  if (ui.diagScore) {
    ui.diagScore.textContent = ev.chipLabel;
    ui.diagScore.classList.toggle("is-pass", pass);
  }
  if (ui.diagWcag) {
    ui.diagWcag.textContent = `实测 WCAG ${ev.contrastWorst.toFixed(1)}:1`;
  }
  if (ui.diagBleed) {
    ui.diagBleed.textContent = ev.geom.isFullBleed
      ? `满幅裁切 ${Math.round(ev.geom.z * 100)}%`
      : `画面仅占 ${ev.geom.coveragePct}%`;
  }
  if (ui.bleedVal) {
    const zPct = Math.round(ev.geom.z * 100);
    ui.bleedVal.textContent = !ev.geom.isFullBleed
      ? `${zPct}% · 白框缩图`
      : ev.geom.clutterVisible
      ? `${zPct}% · 边角留杂`
      : ev.geom.isOverCropped
      ? `${zPct}% · 裁切过头`
      : `${zPct}% · 满幅净裁`;
  }
  if (ui.diagTitle) ui.diagTitle.textContent = ev.headline;
  if (ui.diagBody) ui.diagBody.textContent = ev.explanation;
  if (ui.diagNext) {
    ui.diagNext.innerHTML = pass
      ? `<strong>验真建议：</strong>${ev.nextStep}`
      : `<strong>下一步：</strong>${ev.nextStep}`;
  }

  // 更新原海报底部「教学要点」四栏探针
  const map = {
    fullbleed: ui.stFullbleed,
    overlay: ui.stOverlay,
    focal: ui.stFocal,
    immersion: ui.stImmersion,
  };
  for (const key of Object.keys(map)) {
    if (map[key]) map[key].textContent = ev.pillars[key].status;
  }
  ui.pillarItems.forEach((li) => {
    const k = li.dataset.pillar;
    if (k && ev.pillars[k]) li.classList.toggle("is-ok", ev.pillars[k].ok);
  });
}

// 绘制传统密字旧页（影院翻页前 0.78 秒闪播，凸显切入全图页的冲击力）
function drawPrevBulletSlide(w, h) {
  ctx.fillStyle = "#EDF1F6";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1F3654";
  ctx.fillRect(0, 0, w, h * 0.13);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${clamp(Math.round(h * 0.044), 14, 26)}px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("上一页：常规项目符号汇总页（0.8 秒后切入你的全图页…）", w * 0.06, h * 0.065, w * 0.88);

  ctx.fillStyle = "#2C3E55";
  const lf = clamp(Math.round(h * 0.032), 12, 19);
  ctx.font = `400 ${lf}px "Noto Sans SC", sans-serif`;
  const bullets = [
    "• 第一季度各业务线基础指标延续平稳增长趋势，渠道投放结构保持不变",
    "• 跨部门例会同步更新了 14 项排期节点与 6 项常规运维审批流程说明",
    "• 常规文档型幻灯片信息密度高，连续翻看五页后听众容易出现视觉疲劳",
    "• 现在准备切换至 350 全图页：感受银幕边界消失与情绪接管的瞬间",
  ];
  bullets.forEach((line, i) => {
    ctx.fillText(line, w * 0.08, h * (0.28 + i * 0.145), w * 0.84);
  });
}

// 绘制 350 原海报风格折线引注（圆点 → 斜折线 → 水平线 → 双语标签与实时状态）
function drawCallout(anchorX, anchorY, elbowX, elbowY, endX, alignRight, color, data, isNarrow) {
  const padX = 8;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(endX, elbowY);
  ctx.stroke();

  // 起点小圆点 + 终点圆点
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(anchorX, anchorY, 3.2, 0, Math.PI * 2);
  ctx.arc(endX, elbowY, 4.2, 0, Math.PI * 2);
  ctx.fill();

  const titleF = isNarrow ? 12 : 14;
  const subF = isNarrow ? 10.5 : 11.5;
  ctx.font = `700 ${titleF}px "Noto Sans SC", sans-serif`;
  const wTitle = ctx.measureText(data.label).width;
  ctx.font = `600 ${subF}px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
  const wStatus = ctx.measureText(data.status).width;
  const boxW = Math.max(wTitle + (isNarrow ? 10 : 54), wStatus + 16) + padX * 2;
  const boxH = isNarrow ? 40 : 46;
  const bx = alignRight ? endX - boxW - 8 : endX + 8;
  const by = elbowY - boxH / 2;

  roundRect(bx, by, boxW, boxH, 7);
  ctx.fillStyle = "rgba(1, 10, 25, 0.86)";
  ctx.fill();
  ctx.strokeStyle = data.ok ? "rgba(94, 229, 184, 0.58)" : "rgba(255, 120, 137, 0.72)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textBaseline = "top";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${titleF}px "Noto Sans SC", sans-serif`;
  ctx.fillText(data.label, bx + padX, by + 6);

  if (!isNarrow) {
    ctx.fillStyle = color;
    ctx.font = `400 12px "Bebas Neue", sans-serif`;
    ctx.fillText(data.en, bx + padX + wTitle + 7, by + 8);
  }

  ctx.fillStyle = data.ok ? "#8EF2D0" : "#FFABB8";
  ctx.font = `600 ${subF}px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
  ctx.fillText(data.status, bx + padX, by + (isNarrow ? 22 : 25));

  ctx.restore();
  return { x: bx, y: by, w: boxW, h: boxH };
}

function drawHeroFrame(t, dt, { still }) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const dpr = pixelRatio(w <= 500 ? 1.5 : 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const isNarrow = w < 560;
  const canvasAR = w / Math.max(1, h);
  const plate = getScenePlate(state.scene, state.lighting);
  const ev = evaluateSlide(state, plate.sampleRGB, isNarrow, canvasAR);
  lastEval = ev;

  // 影院翻页播放驱动
  if (cinema.active) {
    if (still) {
      cinema.active = false;
    } else {
      cinema.elapsed += dt;
      if (cinema.elapsed < cinema.cutAt) {
        drawPrevBulletSlide(w, h);
        return;
      }
      if (cinema.elapsed >= cinema.total) {
        cinema.active = false;
      }
    }
  }

  const { geom, textBox } = ev;
  const sc = SCENES[state.scene];

  // 1. 底层背景：满幅时为深空黑，缩框坏态时露出企业套壳灰白模板底板
  if (!geom.isFullBleed) {
    ctx.fillStyle = "#EDF2F8";
    ctx.fillRect(0, 0, w, h);
    // 丑陋企业模板页眉条
    const topBarH = Math.max(24, h * geom.imgRect.y * 0.68);
    ctx.fillStyle = "#1D3557";
    ctx.fillRect(0, 0, w, topBarH);
    ctx.fillStyle = "#E8F0F8";
    ctx.font = `600 ${clamp(Math.round(topBarH * 0.42), 11, 15)}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("企业标准汇报模板 · 内部评审版 · Q4", w * 0.03, topBarH * 0.52, w * 0.65);
    ctx.fillStyle = "#9FB4CE";
    ctx.font = `400 ${clamp(Math.round(topBarH * 0.36), 10, 13)}px "IBM Plex Sans", sans-serif`;
    ctx.fillText("TEMPLATE 16:9", w * 0.84, topBarH * 0.52);

    // 底部企业模板页码栏
    const botY = h * (geom.imgRect.y + geom.imgRect.h);
    ctx.fillStyle = "#7D8FA6";
    ctx.font = `400 ${clamp(Math.round(h * 0.026), 10, 13)}px "IBM Plex Sans", sans-serif`;
    ctx.fillText("SLIDE 14 / 32 · CONFIDENTIAL", w * 0.03, botY + (h - botY) * 0.52);
  } else {
    ctx.fillStyle = "#00040A";
    ctx.fillRect(0, 0, w, h);
  }

  // 2. 绘制全幅/缩框主图（严格同源于 geom.win）
  const dst = {
    x: geom.imgRect.x * w,
    y: geom.imgRect.y * h,
    w: geom.imgRect.w * w,
    h: geom.imgRect.h * h,
  };
  drawCroppedPlate(ctx, plate, dst, geom.win);

  // 若裁切过头 (> 156%)，轻微模拟放大发虚提示膜
  if (geom.isOverCropped) {
    ctx.fillStyle = "rgba(18, 24, 38, 0.16)";
    ctx.fillRect(dst.x, dst.y, dst.w, dst.h);
  }

  // 未满幅时的生硬灰边框线
  if (!geom.isFullBleed) {
    ctx.strokeStyle = "#B4C2D4";
    ctx.lineWidth = 2;
    ctx.strokeRect(dst.x, dst.y, dst.w, dst.h);
  }

  // 3. 细微环境呼吸光感（极轻量矢量单圆，帧耗 < 0.1ms；静帧跳过动画）
  if (!still && state.lighting === "guided") {
    const breathe = 0.03 + 0.025 * Math.sin(t * 1.35);
    ctx.fillStyle = `rgba(254, 141, 163, ${breathe.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(geom.focalX * w, geom.focalY * h, Math.min(w, h) * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 绘制遮罩层（与 model.js applyScrimRGB 完全同源！）
  const tx = textBox.x * w;
  const ty = textBox.y * h;
  const tw = textBox.w * w;
  const th = textBox.h * h;
  lastTextPx = { x: tx, y: ty, w: tw, h: th };

  if (state.scrim === "heavy") {
    ctx.fillStyle = "rgba(0, 4, 10, 0.80)";
    ctx.fillRect(dst.x, dst.y, dst.w, dst.h);
  } else if (state.scrim === "gradient") {
    const onRight = textBox.cx > 0.56;
    const onBottom = textBox.cy > 0.60;
    let g;
    if (onBottom) {
      g = ctx.createLinearGradient(0, h * 0.34, 0, h * 0.92);
      g.addColorStop(0, "rgba(1, 10, 25, 0)");
      g.addColorStop(1, "rgba(1, 10, 25, 0.78)");
    } else if (onRight) {
      g = ctx.createLinearGradient(w * 0.36, 0, w * 0.94, 0);
      g.addColorStop(0, "rgba(1, 10, 25, 0)");
      g.addColorStop(1, "rgba(1, 10, 25, 0.78)");
    } else {
      g = ctx.createLinearGradient(w * 0.64, 0, w * 0.06, 0);
      g.addColorStop(0, "rgba(1, 10, 25, 0)");
      g.addColorStop(1, "rgba(1, 10, 25, 0.78)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(dst.x, dst.y, dst.w, dst.h);
  } else if (state.scrim === "glass") {
    roundRect(tx, ty, tw, th, 12);
    ctx.fillStyle = "rgba(1, 12, 29, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // 5. 绘制可拖动覆盖文字内容
  ctx.save();
  // 若正在交互或处于错态，加极轻虚线拖框提示文字卡可直接拖动
  if (!cinema.active) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle =
      ev.overlayOk && !ev.textHitsFocal
        ? "rgba(109, 210, 242, 0.38)"
        : "rgba(255, 118, 138, 0.78)";
    ctx.lineWidth = 1.3;
    roundRect(tx, ty, tw, th, 12);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const pad = isNarrow ? 12 : 18;
  const copy = sc.copy[state.copyMode];
  ctx.textBaseline = "top";

  if (state.copyMode === "bullets") {
    const tf = clamp(Math.round(h * 0.038), 13, 21);
    const lf = clamp(Math.round(h * 0.027), 11, 14.5);
    ctx.fillStyle = "#F8FBFF";
    ctx.font = `700 ${tf}px "Noto Sans SC", sans-serif`;
    ctx.fillText(copy.title, tx + pad, ty + pad, tw - pad * 2);

    ctx.font = `400 ${lf}px "Noto Sans SC", sans-serif`;
    copy.lines.forEach((line, i) => {
      const ly = ty + pad + tf * 1.55 + i * (lf * 1.75);
      if (ly + lf < ty + th - 6) {
        ctx.fillText(line, tx + pad, ly, tw - pad * 2);
      }
    });
  } else if (state.copyMode === "concise") {
    const tf = clamp(Math.round(h * (isNarrow ? 0.056 : 0.068)), 17, 38);
    const sf = clamp(Math.round(h * (isNarrow ? 0.032 : 0.034)), 12, 18);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${tf}px "Noto Sans SC", sans-serif`;
    ctx.fillText(copy.title, tx + pad, ty + pad, tw - pad * 2);

    ctx.fillStyle = "#E658A8";
    ctx.fillRect(tx + pad, ty + pad + tf * 1.28, isNarrow ? 28 : 38, 4);

    ctx.fillStyle = "#E4EFFA";
    ctx.font = `400 ${sf}px "Noto Sans SC", sans-serif`;
    ctx.fillText(copy.sub, tx + pad, ty + pad + tf * 1.55, tw - pad * 2);
  } else {
    const tf = clamp(Math.round(h * (isNarrow ? 0.072 : 0.090)), 22, 48);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${tf}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(copy.title, tx + pad, ty + th * 0.52, tw - pad * 2);
  }

  // 底右角轻巧拖动把手提示（影院播放时隐藏，绝不遮挡标题或右上折线引注）
  if (!cinema.active) {
    const tag = "拖文字盒";
    ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
    const tagW = ctx.measureText(tag).width + 12;
    roundRect(tx + tw - tagW - 8, ty + th - 23, tagW, 17, 4);
    ctx.fillStyle = "rgba(1, 12, 29, 0.80)";
    ctx.fill();
    ctx.fillStyle = "#AEE3F8";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, tx + tw - tagW - 2, ty + th - 14.5);
  }
  ctx.restore();

  // 6. 影院翻页切入过场光幕与 1.5 秒读秒提示
  if (cinema.active) {
    const after = cinema.elapsed - cinema.cutAt;
    const flash = clamp(1 - after / 0.24, 0, 1);
    if (flash > 0) {
      ctx.fillStyle = `rgba(0, 4, 10, ${flash.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    const label =
      ev.score === 4
        ? `影院切屏 ${after.toFixed(1)}s · 情绪与短标 1.5 秒内直达`
        : `影院切屏 ${after.toFixed(1)}s · 当前仍有 ${4 - ev.score} 项干扰，沉浸感被打断`;
    ctx.font = `700 ${isNarrow ? 12 : 14}px "Noto Sans SC", sans-serif`;
    const lw = ctx.measureText(label).width + 26;
    roundRect((w - lw) / 2, 16, lw, 32, 999);
    ctx.fillStyle = ev.score === 4 ? "rgba(6, 40, 36, 0.90)" : "rgba(56, 12, 30, 0.92)";
    ctx.fill();
    ctx.fillStyle = ev.score === 4 ? "#97F6D5" : "#FFB4C7";
    ctx.textBaseline = "middle";
    ctx.fillText(label, (w - lw) / 2 + 13, 32);
    hitCallouts = [];
    return;
  }

  // 7. 复刻 350 原海报三枚折线引注（裁切 / 焦点 / 覆盖文字）——点一下直接定位修复！
  hitCallouts = [];
  const fPxX = clamp(geom.focalX * w, 24, w - 24);
  const fPxY = clamp(geom.focalY * h, 24, h - 24);

  // 主焦点细腻同心圆环
  ctx.save();
  ctx.strokeStyle = ev.pillars.focal.ok ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 120, 137, 0.9)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(fPxX, fPxY, isNarrow ? 11 : 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ev.pillars.focal.ok ? "#FFFFFF" : "#FF6E86";
  ctx.beginPath();
  ctx.arc(fPxX, fPxY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (!isNarrow) {
    // 桌面与平板：完整三枚原海报折线引注（精算避让文字盒）
    // ① 右上「裁切 CROP」
    const cAx = Math.min(w - 220, dst.x + dst.w * 0.78);
    const cAy = Math.max(48, dst.y + dst.h * 0.19);
    const cEx = Math.min(w - 190, cAx + 32);
    const cEy = Math.max(36, cAy - 22);
    const cBox = drawCallout(cAx, cAy, cEx, cEy, cEx + 22, false, "#E658A8", ev.callouts.crop, false);
    hitCallouts.push({ id: "crop", ...cBox });

    // ② 右中「焦点 FOCAL AREA」
    const fAlignRight = fPxX > w * 0.74;
    const fEx = fAlignRight ? fPxX - 30 : Math.min(w - 185, fPxX + 34);
    const fEy = clamp(fPxY + 26, 98, h - 54);
    const fEnd = fAlignRight ? fEx - 22 : fEx + 22;
    const fBox = drawCallout(fPxX, fPxY, fEx, fEy, fEnd, fAlignRight, "#FFFFFF", ev.callouts.focal, false);
    hitCallouts.push({ id: "focal", ...fBox });

    // ③ 下方「覆盖文字 OVERLAY」（锚在文字盒底边，自动避开左右边沿）
    const oLeftSide = textBox.cx < 0.55;
    const oAx = oLeftSide ? tx + tw * 0.25 : tx + tw * 0.75;
    const oAy = ty + th;
    const oEy = clamp(oAy + 34, 56, h - 52);
    const oEx = clamp(oAx + (oLeftSide ? -16 : 16), 170, w - 170);
    const oBox = drawCallout(
      oAx,
      Math.min(h - 32, oAy),
      oEx,
      oEy,
      oLeftSide ? oEx + 20 : oEx - 20,
      !oLeftSide,
      "#4AB5D9",
      ev.callouts.overlay,
      false
    );
    hitCallouts.push({ id: "overlay", ...oBox });
  } else {
    // 手机竖屏与横屏：把双快速修复徽章放在主图框内部顶沿下方，绝不压挡企业模板页眉
    const topY = Math.round(Math.max(10, dst.y + 8));
    const leftX = Math.round(Math.max(10, dst.x + 8));
    const rightX = Math.round(Math.min(w - 118, dst.x + dst.w - 118));
    const badges = [
      { id: "crop", x: leftX, y: topY, color: "#E658A8", data: ev.callouts.crop },
      { id: "overlay", x: rightX, y: topY, color: "#4AB5D9", data: ev.callouts.overlay },
    ];
    for (const b of badges) {
      roundRect(b.x, b.y, 110, 34, 6);
      ctx.fillStyle = "rgba(1, 10, 25, 0.88)";
      ctx.fill();
      ctx.strokeStyle = b.data.ok ? "rgba(94, 229, 184, 0.62)" : "rgba(255, 120, 137, 0.78)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(b.data.label, b.x + 8, b.y + 4);
      ctx.fillStyle = b.data.ok ? "#8EF2D0" : "#FFABB8";
      ctx.font = `600 10.5px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
      ctx.fillText(b.data.status, b.x + 8, b.y + 18);
      hitCallouts.push({ id: b.id, x: b.x, y: b.y, w: 110, h: 34 });
    }
  }
}

const heroLoop = loop(canvas, drawHeroFrame);

function refreshAll() {
  syncControls();
  const rect = canvas.getBoundingClientRect();
  const isNarrow = rect.width < 560;
  const canvasAR = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 16 / 9;
  const plate = getScenePlate(state.scene, state.lighting);
  const ev = evaluateSlide(state, plate.sampleRGB, isNarrow, canvasAR);
  updateReadouts(ev);
  heroLoop.draw();
}

// =========================================================================
// 画布直接交互：拖文字盒挪位 / 拖底图移景 / 点击三枚折线引注就地修 / 方向键微调
// =========================================================================
let dragMode = null; // "text" | "pan" | null
let dragStart = { x: 0, y: 0, textX: 0, textY: 0, panX: 0, panY: 0, moved: false };

function pointerToLocal(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, w: Math.max(1, r.width), h: Math.max(1, r.height) };
}

function hitTest(pt, box) {
  return pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
}

canvas.addEventListener("pointerdown", (e) => {
  const pt = pointerToLocal(e);
  // 优先检查是否点中三枚原海报折线引注
  const hitC = hitCallouts.find((c) => hitTest(pt, c));
  if (hitC) {
    handleCalloutClick(hitC.id);
    return;
  }

  dragMode = hitTest(pt, lastTextPx) ? "text" : "pan";
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    textX: state.textX,
    textY: state.textY,
    panX: state.panX,
    panY: state.panY,
    moved: false,
  };
  canvas.classList.add("is-dragging");
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragMode) return;
  const r = canvas.getBoundingClientRect();
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (Math.hypot(dx, dy) > 3) dragStart.moved = true;

  if (dragMode === "text") {
    state.textX = clamp(dragStart.textX + dx / Math.max(1, r.width), 0.14, 0.86);
    state.textY = clamp(dragStart.textY + dy / Math.max(1, r.height), 0.16, 0.84);
  } else {
    state.panX = clamp(dragStart.panX + (dx / Math.max(1, r.width)) * 0.48, -0.32, 0.32);
    state.panY = clamp(dragStart.panY + (dy / Math.max(1, r.height)) * 0.42, -0.24, 0.24);
  }
  refreshAll();
});

function endDrag() {
  if (!dragMode) return;
  dragMode = null;
  canvas.classList.remove("is-dragging");
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

// 触屏左右拖动阻止默认滚动，保留纵向滚页顺畅
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const pt = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    dragMode = hitTest(pt, lastTextPx) ? "text" : "pan";
    dragStart = {
      x: t0.clientX,
      y: t0.clientY,
      textX: state.textX,
      textY: state.textY,
      panX: state.panX,
      panY: state.panY,
      moved: false,
    };
  },
  { passive: true }
);

canvas.addEventListener(
  "touchmove",
  (e) => {
    if (!dragMode || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - dragStart.x;
    const dy = t0.clientY - dragStart.y;
    if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      if (dragMode === "text") {
        state.textX = clamp(dragStart.textX + dx / Math.max(1, r.width), 0.14, 0.86);
        state.textY = clamp(dragStart.textY + dy / Math.max(1, r.height), 0.16, 0.84);
      } else {
        state.panX = clamp(dragStart.panX + (dx / Math.max(1, r.width)) * 0.48, -0.32, 0.32);
        state.panY = clamp(dragStart.panY + (dy / Math.max(1, r.height)) * 0.42, -0.24, 0.24);
      }
      refreshAll();
    }
  },
  { passive: false }
);
canvas.addEventListener("touchend", endDrag, { passive: true });
canvas.addEventListener("touchcancel", endDrag, { passive: true });

function handleCalloutClick(id) {
  if (id === "crop") {
    if (!lastEval?.pillars.fullbleed.ok) {
      state.bleedZoom = 1.18;
      state.panX = 0.04;
      state.panY = 0;
    } else {
      state.bleedZoom = 1.70;
    }
  } else if (id === "focal") {
    state.lighting = "guided";
    state.panX = 0.04;
    state.panY = 0;
    if (lastEval?.textHitsFocal) {
      state.textX = 0.25;
      state.textY = 0.34;
    }
  } else if (id === "overlay") {
    if (state.copyMode === "bullets") {
      state.copyMode = "concise";
    } else if (!lastEval?.contrastOk || state.scrim === "heavy") {
      state.scrim = "glass";
    } else {
      const order = ["glass", "gradient", "none"];
      state.scrim = order[(order.indexOf(state.scrim) + 1) % order.length];
    }
  }
  refreshAll();
}

// 键盘操控画布（方向键微调文字/移景，Space 影院翻页）
canvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.08 : 0.04;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.textX = clamp(state.textX - step, 0.14, 0.86);
    refreshAll();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.textX = clamp(state.textX + step, 0.14, 0.86);
    refreshAll();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.textY = clamp(state.textY - step, 0.16, 0.84);
    refreshAll();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.textY = clamp(state.textY + step, 0.16, 0.84);
    refreshAll();
  }
});

function triggerCinemaCut() {
  cinema.active = true;
  cinema.elapsed = 0;
  heroLoop.draw();
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName || "")) {
    e.preventDefault();
    triggerCinemaCut();
  }
});

// =========================================================================
// 绑定导演坞按钮与滑轨
// =========================================================================
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    refreshAll();
  });
});

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.copyMode = btn.dataset.copy;
    refreshAll();
  });
});

document.querySelectorAll("[data-scrim]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scrim = btn.dataset.scrim;
    refreshAll();
  });
});

document.querySelectorAll("[data-light]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.lighting = btn.dataset.light;
    refreshAll();
  });
});

ui.bleedRange?.addEventListener("input", () => {
  state.bleedZoom = Number(ui.bleedRange.value) / 100;
  refreshAll();
});

document.getElementById("btn-fix")?.addEventListener("click", () => {
  Object.assign(state, SOLUTIONS.poster.patch);
  refreshAll();
});

document.getElementById("btn-reset")?.addEventListener("click", () => {
  Object.assign(state, BAD_INITIAL, { scene: state.scene });
  refreshAll();
});

document.getElementById("btn-cinema")?.addEventListener("click", triggerCinemaCut);
document.getElementById("btn-cinema-top")?.addEventListener("click", triggerCinemaCut);

document.querySelectorAll("[data-sol]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = SOLUTIONS[btn.dataset.sol];
    if (item) {
      Object.assign(state, item.patch);
      refreshAll();
    }
  });
});

document.querySelectorAll("[data-wrong]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = WRONG_PRESETS[btn.dataset.wrong];
    if (item) {
      Object.assign(state, item.patch);
      refreshAll();
    }
  });
});

new ResizeObserver(() => refreshAll()).observe(document.getElementById("stage-bleed"));

// 初始化开场与全部章节交互
refreshAll();
initCurtainLab();
initScrimLab();
initCropLab();
initAvoidCards();
initQuiz();
initLightbox();
