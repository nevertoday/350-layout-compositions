// 正文全部互动实验：
// 01 三态临界滑条（居中 → 微偏犹疑 → 偏心甜区 → 过偏失衡）
// 02 视觉杠杆实验室（力臂 × 重量 = 偏而不倒）
// 04 内向 vs 外向方向空间实验（Palmer et al. 2008 实证）
// 05 同题换构图对比（居中 / 偏心配重 / 失衡偏心）
// 06 观察与练习四选一（点击叠出虚线轴与力矩诊断）
// 07 原海报灯箱（放大、鼠标/触控拖动、滚轮缩放、Esc 关）

import { reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

const $ = (id) => document.getElementById(id);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// ---------- 01 三态临界滑条 ----------
function initContinuumLab() {
  const range = $("cont-range");
  const orb = $("cont-orb");
  const pull = $("cont-pull");
  const stateEl = $("cont-state");
  const pctEl = $("cont-pct");
  const descEl = $("cont-desc");
  const marker = $("cont-marker");
  if (!range || !orb) return;

  const update = () => {
    const p = Number(range.value); // 0 .. 46 (%)
    // 画框宽 360 高 220，中心在 (180, 110)，向右上 30° 方向推进
    const rad = (-28 * Math.PI) / 180;
    const dist = (p / 46) * 158;
    const x = 180 + Math.cos(rad) * dist;
    const y = 110 + Math.sin(rad) * dist;

    orb.setAttribute("cx", x.toFixed(1));
    orb.setAttribute("cy", y.toFixed(1));
    orb.setAttribute("fill", p < 4 ? PALETTE.ink : PALETTE.coral);
    pull.setAttribute("x2", x.toFixed(1));
    pull.setAttribute("y2", y.toFixed(1));
    pull.setAttribute("opacity", p < 4 ? "0" : "0.75");
    if (marker) marker.setAttribute("cx", (20 + (p / 46) * 320).toFixed(1));

    pctEl.textContent = `偏移 ${p}%`;
    let zone = "sweet";
    let tag = "偏心（动态）";
    let desc = "经验甜区（离中心约 16%–34%）：既摆脱了居中的呆板，又保留了足够边缘呼吸空间，是现代海报最常用的偏心区间。";

    if (p < 4) {
      zone = "center";
      tag = "居中（静态）";
      desc = "圆心紧扣十字交点：四边距离均等，静止、安定，但也几乎没有视线流动与悬念。";
    } else if (p < 14) {
      zone = "awkward";
      tag = "轻偏（犹疑区）";
      desc = "经验盲区（4%–13%）：离正中只错开一点点，人眼难以判断你是刻意偏心还是排版手滑没对齐。";
    } else if (p > 35) {
      zone = "over";
      tag = "过偏（失衡）";
      desc = "超过约 35% 且缺少对侧强配重时，主体贴近甚至被画框裁切——张力滑向坠落与不适感。";
    }
    stateEl.textContent = tag;
    stateEl.dataset.zone = zone;
    descEl.textContent = desc;
    range.setAttribute("aria-valuetext", `${tag}，偏离中心 ${p}%`);
  };

  range.addEventListener("input", update);
  document.querySelectorAll("[data-cont-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      range.value = btn.dataset.contPreset;
      update();
    });
  });
  update();
}

// ---------- 02 视觉杠杆实验室 ----------
function initLeverLab() {
  const offRange = $("lv-offset");
  const cwDistRange = $("lv-cw-dist");
  const cwTypeRadios = document.querySelectorAll('input[name="lv-cw-type"]');
  const mainOrb = $("lv-main-orb");
  const cwGroup = $("lv-cw-group");
  const cwArc = $("lv-cw-arc");
  const cwStamp = $("lv-cw-stamp");
  const cwTypeBlock = $("lv-cw-typeblock");
  const beam = $("lv-beam");
  const mainArm = $("lv-main-arm");
  const cwArm = $("lv-cw-arm");
  const verdict = $("lv-verdict");
  const badge = $("lv-badge");
  const metricMain = $("lv-m-main");
  const metricCw = $("lv-m-cw");
  const outOff = $("lv-off-val");
  const outCw = $("lv-cw-val");
  if (!offRange || !beam) return;

  const CW_PROFILES = {
    arc: { mass: 0.78, name: "大面积低对比暗弧" },
    stamp: { mass: 0.52, name: "远端高对比小印章" },
    copy: { mass: 0.66, name: "对侧短标题与导语块" },
  };

  let cwType = "arc";

  const update = () => {
    const mainDist = Number(offRange.value); // 12..38 (%)
    const cwDist = Number(cwDistRange.value); // 0..42 (%)
    const prof = CW_PROFILES[cwType];

    // 体验类比：力矩 ≈ 视觉重量 × 离中心距（明确标注为感知类比而非刚体公式）
    const mainMoment = Math.round(1.0 * mainDist * 2.2);
    const cwMoment = cwDist === 0 ? 0 : Math.round(prof.mass * cwDist * 2.55);
    const diff = mainMoment - cwMoment; // >0 右倾；<0 左倾；接近 0 平衡
    const tiltDeg = clamp(diff * 0.24, -14, 14);

    // 上方画框坐标（560 × 270，中心 280, 135）
    const mx = 280 + (mainDist / 42) * 205;
    const my = 135 - (mainDist / 42) * 52;
    mainOrb.setAttribute("cx", mx.toFixed(1));
    mainOrb.setAttribute("cy", my.toFixed(1));

    const cx = 280 - (cwDist / 42) * 214;
    const cy = 135 + (cwDist / 42) * 68;
    cwGroup.setAttribute("visibility", cwDist === 0 ? "hidden" : "visible");
    cwArc.setAttribute("visibility", cwType === "arc" ? "visible" : "hidden");
    cwStamp.setAttribute("visibility", cwType === "stamp" ? "visible" : "hidden");
    cwTypeBlock.setAttribute("visibility", cwType === "copy" ? "visible" : "hidden");
    cwGroup.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);

    // 下方杠杆图（支点在 280, 62）
    beam.setAttribute("transform", `rotate(${tiltDeg.toFixed(2)} 280 62)`);
    mainArm.setAttribute("cx", (280 + (mainDist / 42) * 195).toFixed(1));
    cwArm.setAttribute("cx", (280 - (cwDist / 42) * 195).toFixed(1));
    cwArm.setAttribute("r", cwType === "arc" ? "13" : cwType === "copy" ? "10" : "7");
    cwArm.setAttribute("visibility", cwDist === 0 ? "hidden" : "visible");

    outOff.textContent = `${mainDist}%`;
    outCw.textContent = cwDist === 0 ? "关闭" : `${cwDist}%`;
    metricMain.textContent = `${mainMoment}`;
    metricCw.textContent = `${cwMoment}`;

    if (cwDist === 0) {
      badge.textContent = "单侧下沉";
      badge.dataset.state = "tilt";
      verdict.textContent = "对侧没有配重，整个画面被右上方重圆单向拉沉；把配重往远处推开，杠杆立刻开始回平。";
    } else if (Math.abs(diff) <= 10) {
      badge.textContent = "动态平衡";
      badge.dataset.state = "ok";
      verdict.textContent = `平衡成立！主圆偏离 ${mainDist}%，但「${prof.name}」凭借 ${cwDist}% 的长力臂稳稳拉住了右端——小配重一样能压住大主角。`;
    } else if (diff > 10) {
      badge.textContent = "主侧偏沉";
      badge.dataset.state = "tilt";
      verdict.textContent = `右端主圆仍重出 ${diff} 单位：试着把「${prof.name}」往远角再推远一点（加长力臂），或换更有分量的配重形式。`;
    } else {
      badge.textContent = "配重反客为主";
      badge.dataset.state = "tilt";
      verdict.textContent = `配重拉过了头（左端多出 ${Math.abs(diff)} 单位）：配重应该稳住画面，不能抢走主圆的焦点。把配重往内收一点试试。`;
    }
  };

  offRange.addEventListener("input", update);
  cwDistRange.addEventListener("input", update);
  cwTypeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      if (!r.checked) return;
      cwType = r.value;
      update();
    });
  });
  update();
}

// ---------- 04 内向 vs 外向方向空间实验 ----------
function initDirectionLab() {
  const posRadios = document.querySelectorAll('input[name="dir-pos"]');
  const faceRadios = document.querySelectorAll('input[name="dir-face"]');
  const copyToggle = $("dir-copy-toggle");
  const figure = $("dir-figure");
  const roomRect = $("dir-room");
  const gazeArrow = $("dir-arrow");
  const copyGroup = $("dir-copy-block");
  const statusEl = $("dir-status");
  const textEl = $("dir-text");
  if (!figure) return;

  let side = "left"; // left | right
  let face = "right"; // right | left
  let showCopy = true;

  const update = () => {
    // SVG 560 × 300
    const x = side === "left" ? 132 : 428;
    const scaleX = face === "right" ? 1 : -1;
    figure.setAttribute("transform", `translate(${x} 168) scale(${scaleX} 1)`);

    // 留白区在主体对面
    const openLeft = side === "right";
    roomRect.setAttribute("x", openLeft ? "22" : "216");
    roomRect.setAttribute("width", "322");

    // 视线方向箭头
    const inward = (side === "left" && face === "right") || (side === "right" && face === "left");
    if (face === "right") {
      gazeArrow.setAttribute("d", side === "left" ? "M 184 126 H 474 M 462 117 L 476 126 L 462 135" : "M 476 126 H 536 M 526 118 L 538 126 L 526 134");
    } else {
      gazeArrow.setAttribute("d", side === "right" ? "M 376 126 H 86 M 98 117 L 84 126 L 98 135" : "M 84 126 H 24 M 34 118 L 22 126 L 34 134");
    }
    gazeArrow.setAttribute("stroke", inward ? PALETTE.coralHot : "#f5a962");

    // 留白处排文案
    copyGroup.setAttribute("visibility", showCopy ? "visible" : "hidden");
    copyGroup.setAttribute("transform", openLeft ? "translate(46 0)" : "translate(256 0)");

    statusEl.dataset.good = String(inward);
    if (inward) {
      statusEl.textContent = "内向偏心 · 视线畅通";
      textEl.textContent = showCopy
        ? "主体偏居一侧并面朝画框内侧：视线自然扫过大片留白，顺手把观者带进对侧文字块——这正是帕尔默等人（2008）验证的「内向偏置」。"
        : "主体偏居一侧并面向画心留白：前方开阔，运动和目光都有去处，画面既有方向又有呼吸感。";
    } else {
      statusEl.textContent = "外向贴边 · 前方受阻";
      textEl.textContent =
        "主体紧贴边缘却背对整片留白：目光刚出框就被边框截断，身后一大片空白失去理由。除非刻意表现压迫、疏离或「即将离开」，否则应让朝向对准留白。";
    }
  };

  posRadios.forEach((r) => r.addEventListener("change", () => r.checked && ((side = r.value), update())));
  faceRadios.forEach((r) => r.addEventListener("change", () => r.checked && ((face = r.value), update())));
  copyToggle?.addEventListener("click", () => {
    showCopy = !showCopy;
    copyToggle.setAttribute("aria-pressed", String(showCopy));
    copyToggle.textContent = showCopy ? "留白文案：已开" : "留白文案：已关";
    update();
  });
  update();
}

// ---------- 05 同题换构图对比 ----------
function initCompareLab() {
  const stage = $("cmp-stage");
  const caption = $("cmp-caption");
  const radios = document.querySelectorAll('input[name="cmp-mode"]');
  if (!stage) return;

  const TEXT = {
    offcenter: "偏心摆法：硕大珊瑚主圆推向右上，左下用标题块与暗弧收住——视觉路径从右上斜穿到左下，现代、利落，文案也有整片呼吸空间。",
    center: "居中摆法：元素全部锁在中轴线上，庄重端正，但画面安静得像纪念碑；如果展览主打先锋实验或动感，就会显得偏稳、偏平。",
    unbalanced: "失衡偏心：主圆和标题一起挤到右侧，左半边彻底空置且无配重——重心全压在一边，画面像向右翻倒。",
  };

  const apply = (mode) => {
    stage.dataset.mode = mode;
    caption.textContent = TEXT[mode] || TEXT.offcenter;
  };

  radios.forEach((r) => r.addEventListener("change", () => r.checked && apply(r.value)));
  apply("offcenter");
}

// ---------- 06 观察与练习四选一 ----------
function initQuiz() {
  const grid = $("quiz-grid");
  const vTitle = $("quiz-title");
  const vBody = $("quiz-body");
  const verdict = $("quiz-verdict");
  if (!grid) return;

  const VERDICTS = {
    A: {
      ok: false,
      title: "A · 偏得太少，像没对齐",
      body: "主圆只离中心偏了不到 7%，标题也半悬在中间——既没有居中的仪式感，又没有偏心的果断张力。对照 C：主圆明确推到右上约 27% 处，左下用标题与波浪线对角配重，节奏一下子就清晰了。",
    },
    B: {
      ok: false,
      title: "B · 过偏失衡，整张图往右上倒",
      body: "主圆被挤进右上角裁掉近半，且文字也堆在右上，左下角彻底空荡无配重——这是海报右下第三格警示的「过偏（失衡）」。对照 C：让主圆留出边缘呼吸，并把标题放到斜对角拉住它。",
    },
    C: {
      ok: true,
      title: "选对了！C · 有控制的失衡",
      body: "最重的珊瑚主圆稳稳推到右上偏心区（距中心约 27%，离边留有呼吸），左下角用粗体标题块与细波浪线做斜对角配重，整张画面既有明显视线流动，又丝毫不晃。",
    },
    D: {
      ok: false,
      title: "D · 方向顶墙，身后空白浪费",
      body: "带明确朝向的声波喇叭被推到最右侧，开口却继续朝右撞向画框边缘，左边大半留白被晾在背后。对照 C（或把喇叭换到左侧朝右发声），空白才真正参与叙事。",
    },
  };

  const buttons = [...grid.querySelectorAll(".q-card")];
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.opt;
      const info = VERDICTS[pick];
      grid.classList.add("answered");
      buttons.forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.toggle("is-picked", b === btn);
        b.classList.toggle("is-best", b.dataset.opt === "C");
      });
      vTitle.textContent = info.title;
      vBody.textContent = info.body;
      verdict.dataset.state = info.ok ? "right" : "wrong";
    });
  });
}

// ---------- 07 原海报灯箱（放大 + 拖动 + 滚轮缩放 + Esc 关闭） ----------
function initLightbox() {
  const openBtn = $("poster-btn");
  const posterImg = $("poster");
  const box = $("lightbox");
  const closeBtn = $("lb-close");
  const zoomInBtn = $("lb-in");
  const zoomOutBtn = $("lb-out");
  const zoomResetBtn = $("lb-reset");
  const stage = $("lb-stage");
  const img = $("lb-img");
  if (!openBtn || !box || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  const applyTransform = () => {
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    stage.classList.toggle("is-zoomed", scale > 1.02);
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  };

  const open = () => {
    if (!img.getAttribute("src")) img.src = posterImg.src;
    reset();
    box.hidden = false;
    document.documentElement.classList.add("noscroll");
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  };

  const close = () => {
    if (box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove("noscroll");
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(+(scale + 0.35).toFixed(2), 1, 3.2);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(+(scale - 0.35).toFixed(2), 1, 3.2);
    if (scale === 1) tx = ty = 0;
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", reset);

  box.addEventListener("click", (e) => {
    if (e.target === box || e.target === stage) close();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      scale = clamp(+(scale + delta).toFixed(2), 1, 3.2);
      if (scale === 1) tx = ty = 0;
      applyTransform();
    },
    { passive: false }
  );

  img.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pan = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = tx;
    oy = ty;
    img.setPointerCapture(e.pointerId);
    stage.classList.add("is-panning");
  });
  img.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    applyTransform();
  });
  const stopPan = () => {
    if (!pan) return;
    pan = false;
    stage.classList.remove("is-panning");
  };
  img.addEventListener("pointerup", stopPan);
  img.addEventListener("pointercancel", stopPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

// ---------- 滚屏显隐（尊重 prefers-reduced-motion） ----------
function initReveals() {
  const els = [...document.querySelectorAll(".reveal")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
  );
  els.forEach((el) => io.observe(el));
}

export function initLabs() {
  initContinuumLab();
  initLeverLab();
  initDirectionLab();
  initCompareLab();
  initQuiz();
  initLightbox();
  initReveals();
}
