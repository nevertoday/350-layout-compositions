// 正文全部互动实验（每节只讲一个开场没讲过的独立原理，零重复）：
// 01 位置钉死 · 只改主体大小与对比（证明「过不过偏」不只看圆心偏移距）
// 02 视觉杠杆 · 主圆固定，只滑配重力臂与配重策略（阿恩海姆力臂换重量，用抵消百分比表达）
// 04 内向 vs 外向方向空间实验（Palmer, Gardner & Wickens 2008 实证）
// 05 文案块放哪才算配重（主图固定右上，对比 4 种真实排字落位）
// 06 观察与练习四选一（点击叠出虚线轴与诊断）
// 07 原海报灯箱（放大、拖动、滚轮缩放、Esc 关闭）

import { reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

const $ = (id) => document.getElementById(id);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// ---------- 01 位置钉死：体量 × 对比 ----------
function initWeightContrastLab() {
  const radiusRange = $("wt-radius");
  const contrastRadios = document.querySelectorAll('input[name="wt-contrast"]');
  const orb = $("wt-orb");
  const gapLine = $("wt-gap-line");
  const topGapLine = $("wt-top-gap-line");
  const gapLabel = $("wt-gap-label");
  const stateEl = $("wt-state");
  const valEl = $("wt-radius-val");
  const descEl = $("wt-desc");
  if (!radiusRange || !orb) return;

  const CONTRAST = {
    low: { fill: "#431a8a", factor: 0.42, name: "低对比暗紫" },
    mid: { fill: "#b56995", factor: 0.72, name: "中对比淡粉" },
    high: { fill: PALETTE.coral, factor: 1.0, name: "高对比珊瑚红" },
  };

  let contrastKey = "high";

  const update = () => {
    const r = Number(radiusRange.value); // 14 .. 74 (圆心钉死在 x=282, y=86；右边框在 x=368，上边框在 y=12)
    const c = CONTRAST[contrastKey] || CONTRAST.high;
    const rightGap = Math.max(0, 368 - (282 + r));
    const topGap = Math.max(0, 86 - r - 12);
    const minGap = Math.min(rightGap, topGap);

    orb.setAttribute("r", String(r));
    orb.setAttribute("fill", c.fill);

    // 同时标出上缘与右缘的呼吸余量，画面标尺与下方文字读数完全一致
    gapLine.setAttribute("x1", String(Math.min(368, 282 + r)));
    gapLine.setAttribute("stroke", rightGap < 22 ? PALETTE.amber : PALETTE.mint);
    if (topGapLine) {
      topGapLine.setAttribute("y2", String(Math.max(12, 86 - r)));
      topGapLine.setAttribute("stroke", topGap < 18 ? PALETTE.amber : PALETTE.mint);
      topGapLine.setAttribute("visibility", topGap <= 1 ? "hidden" : "visible");
    }
    gapLabel.textContent =
      topGap <= 1
        ? `已顶上边框 · 右缘 ${rightGap} px`
        : `上缘 ${topGap} px · 右缘 ${rightGap} px`;

    const sizeTag = r <= 22 ? "小号" : r >= 54 ? "特大" : "中号";
    valEl.textContent = `${sizeTag} · ${r} px`;

    // 感知视觉份量（经验类比：面积 × 明暗对比）
    const perceivedMass = Math.pow(r / 34, 1.75) * c.factor;

    let zone = "sweet";
    let tag = "偏心张力成立";
    let desc = "";

    if (perceivedMass < 0.42) {
      zone = "center";
      tag = "拉不动视线";
      desc = `圆心一样右偏 24%，但${sizeTag}体量配${c.name}的视觉份量太轻——眼睛扫过去几乎停不住，偏心感落不下来。`;
    } else if (minGap < 18 || perceivedMass > 1.78) {
      zone = "over";
      tag = "位置未变，却已过偏";
      desc =
        minGap < 18
          ? `圆心一毫米都没挪，但半径涨到 ${r} px 后${topGap <= 1 ? "已顶上画框上边框" : `上缘仅余 ${topGap} px`}（右缘 ${rightGap} px），画框右上明显发堵——过不过偏，要连体量与边距一起看。`
          : `虽然圆心仍停在 24%，但特大面积叠加${c.name}的视觉分量压垮了左侧暗弧，画面开始向右倾倒。`;
    } else {
      zone = "sweet";
      tag = "偏心张力成立";
      desc = `同样停在右偏 24%：${sizeTag}圆盘搭配${c.name}，既足以把目光从画心拉过来，外缘又保留了上缘 ${topGap} px、右缘 ${rightGap} px 的呼吸余量。`;
    }

    stateEl.textContent = tag;
    stateEl.dataset.zone = zone;
    descEl.textContent = desc;
    radiusRange.setAttribute("aria-valuetext", `${sizeTag}半径 ${r} 像素，${c.name}，上缘 ${topGap} 像素，右缘 ${rightGap} 像素，${tag}`);
  };

  radiusRange.addEventListener("input", update);
  contrastRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      contrastKey = radio.value;
      update();
    });
  });
  update();
}

// ---------- 02 视觉杠杆：主圆固定，只滑配重力臂与策略 ----------
function initLeverLab() {
  const cwDistRange = $("lv-cw-dist");
  const cwTypeRadios = document.querySelectorAll('input[name="lv-cw-type"]');
  const cwGroup = $("lv-cw-group");
  const cwArc = $("lv-cw-arc");
  const cwStamp = $("lv-cw-stamp");
  const cwRule = $("lv-cw-rule");
  const armLine = $("lv-arm-line");
  const beam = $("lv-beam");
  const cwArm = $("lv-cw-arm");
  const verdict = $("lv-verdict");
  const badge = $("lv-badge");
  const pctEl = $("lv-pct");
  const armRead = $("lv-arm-read");
  const outCw = $("lv-cw-val");
  if (!cwDistRange || !beam) return;

  // 主圆固定在右侧 26%，固定主侧拉力基准 = 62
  const MAIN_PULL = 62;
  const CW_PROFILES = {
    arc: { mass: 1.85, r: 13, name: "大块低对比暗弧" },
    stamp: { mass: 1.42, r: 8, name: "远角小亮印" },
    rule: { mass: 1.15, r: 6.5, name: "细标尺短线" },
  };

  let cwType = "arc";

  const update = () => {
    const cwDist = Number(cwDistRange.value); // 0 .. 44 (%)
    const prof = CW_PROFILES[cwType] || CW_PROFILES.arc;

    const cwPull = cwDist === 0 ? 0 : prof.mass * cwDist;
    const cancelPct = Math.round((cwPull / MAIN_PULL) * 100);
    const diff = MAIN_PULL - cwPull; // >0 右沉；<0 左沉
    const tiltDeg = clamp(diff * 0.22, -13, 13);

    // 上方画框坐标（560 × 264，画心 280, 132）
    const cx = 280 - (cwDist / 44) * 218;
    const cy = 132 + (cwDist / 44) * 68;
    cwGroup.setAttribute("visibility", cwDist === 0 ? "hidden" : "visible");
    cwArc.setAttribute("visibility", cwType === "arc" ? "visible" : "hidden");
    cwStamp.setAttribute("visibility", cwType === "stamp" ? "visible" : "hidden");
    cwRule.setAttribute("visibility", cwType === "rule" ? "visible" : "hidden");
    cwGroup.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);

    armLine.setAttribute("visibility", cwDist === 0 ? "hidden" : "visible");
    armLine.setAttribute("x2", cx.toFixed(1));
    armLine.setAttribute("y2", cy.toFixed(1));

    // 下方天平（支点 280, 58）
    beam.setAttribute("transform", `rotate(${tiltDeg.toFixed(2)} 280 58)`);
    cwArm.setAttribute("cx", (280 - (cwDist / 44) * 204).toFixed(1));
    cwArm.setAttribute("r", String(prof.r));
    cwArm.setAttribute("visibility", cwDist === 0 ? "hidden" : "visible");

    outCw.textContent = cwDist === 0 ? "已移除" : `${cwDist}%`;
    armRead.textContent = cwDist === 0 ? "0%" : `${cwDist}%`;
    pctEl.textContent = `${cancelPct}%`;

    if (cwDist === 0) {
      badge.textContent = "单侧下沉";
      badge.dataset.state = "tilt";
      verdict.textContent = "撤掉配重后，抵消比例降为 0%，右侧主圆把整张版面拉沉。把滑块往右拖（把配重推向远角），看力臂怎样起作用。";
    } else if (cancelPct >= 82 && cancelPct <= 116) {
      badge.textContent = "动态平衡";
      badge.dataset.state = "ok";
      verdict.textContent = `杠杆回平！「${prof.name}」退到距画心 ${cwDist}% 的远角，抵消了主圆 ${cancelPct}% 的拉力——不必做成和主圆一样大，照样稳得住。`;
    } else if (cancelPct < 82) {
      badge.textContent = "主侧偏沉";
      badge.dataset.state = "tilt";
      verdict.textContent = `目前只抵消了主圆拉力的 ${cancelPct}%：配重离画心还太近（力臂短），继续把它往左下远角推远，或换体量更足的暗弧。`;
    } else {
      badge.textContent = "配重反客为主";
      badge.dataset.state = "tilt";
      verdict.textContent = `左侧已反超至 ${cancelPct}%：把大块暗弧推到最远角落时，配重反而抢走了主圆的风头。往画心收回几格即可恢复主次。`;
    }
  };

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

  let side = "left";
  let face = "right";
  let showCopy = true;

  const update = () => {
    const x = side === "left" ? 132 : 428;
    const scaleX = face === "right" ? 1 : -1;
    figure.setAttribute("transform", `translate(${x} 168) scale(${scaleX} 1)`);

    const openLeft = side === "right";
    roomRect.setAttribute("x", openLeft ? "22" : "216");
    roomRect.setAttribute("width", "322");

    const inward = (side === "left" && face === "right") || (side === "right" && face === "left");
    if (face === "right") {
      gazeArrow.setAttribute(
        "d",
        side === "left"
          ? "M 184 126 H 474 M 462 117 L 476 126 L 462 135"
          : "M 476 126 H 536 M 526 118 L 538 126 L 526 134"
      );
    } else {
      gazeArrow.setAttribute(
        "d",
        side === "right"
          ? "M 376 126 H 86 M 98 117 L 84 126 L 98 135"
          : "M 84 126 H 24 M 34 118 L 22 126 L 34 134"
      );
    }
    gazeArrow.setAttribute("stroke", inward ? PALETTE.coralHot : PALETTE.amber);

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

// ---------- 05 文案块放哪才算配重（主图固定右上） ----------
function initCopyCounterweightLab() {
  const stage = $("copy-stage");
  const copyG = $("cp-copy");
  const titleT = $("cp-h");
  const subT = $("cp-s");
  const ruleR = $("cp-rule");
  const flowP = $("cp-flow");
  const cogOuter = $("cp-cog");
  const cogInner = $("cp-cog-in");
  const metaT = $("cp-meta");
  const badge = $("cp-badge");
  const metric = $("cp-metric");
  const caption = $("cp-caption");
  const radios = document.querySelectorAll('input[name="cp-place"]');
  if (!stage || !copyG) return;

  const PLACES = {
    diag: {
      tx: 26,
      ty: 192,
      anchor: "start",
      ruleX: 0,
      metaX: 26,
      metaY: 34,
      flow: "M 276 82 L 98 186",
      flowColor: PALETTE.mint,
      cog: [218, 122],
      ok: "good",
      badge: "对角配重成立",
      metric: "左半文案抵消右图拉力 62% · 视线顺畅",
      cap: "最稳妥的实操做法：主圆压右上，文字块坐左下，视线从图形斜穿到标题，文字本身就是配重，不需要额外堆装饰。",
    },
    across: {
      tx: 26,
      ty: 82,
      anchor: "start",
      ruleX: 0,
      metaX: 26,
      metaY: 238,
      flow: "M 276 82 L 154 82",
      flowColor: PALETTE.mint,
      cog: [212, 92],
      ok: "good",
      badge: "横向拉平成立",
      metric: "左上标题抵消右图拉力 58% · 下半区通透",
      cap: "类似原海报 017 的排法：标题和主圆分居左右上角形成横向对拉，把整个下半幅腾成大块呼吸空间，再在底角轻落展期。",
    },
    under: {
      tx: 204,
      ty: 186,
      anchor: "start",
      ruleX: 0,
      metaX: 204,
      metaY: 240,
      flow: "M 276 82 L 276 176",
      flowColor: PALETTE.amber,
      cog: [272, 126],
      ok: "bad",
      badge: "同侧叠加塌空",
      metric: "左侧抵消仅 0% · 重心全压右半幅",
      cap: "把标题硬叠在主图正下方后，左半张海报彻底成了无理由的死空，合成重心全部滚向右半幅，整张版面像往右栽倒。",
    },
    center: {
      tx: 190,
      ty: 204,
      anchor: "middle",
      ruleX: -22,
      metaX: 26,
      metaY: 34,
      flow: "M 190 144 L 190 250 M 276 82 L 190 198",
      flowColor: PALETTE.amber,
      cog: [248, 128],
      ok: "bad",
      badge: "上偏下正 · 语法打架",
      metric: "居中文字几乎不产生左向配重 · 轴线冲突",
      cap: "主图是果断的右上偏心，底下标语却摆回中轴对称——上半张在拉动视线，下半张在锁死中轴，两种构图语言互相拆台。",
    },
  };

  const apply = (key) => {
    const p = PLACES[key] || PLACES.diag;
    stage.dataset.place = key;
    copyG.setAttribute("transform", `translate(${p.tx} ${p.ty})`);
    titleT.setAttribute("text-anchor", p.anchor);
    subT.setAttribute("text-anchor", p.anchor);
    ruleR.setAttribute("x", String(p.ruleX));
    metaT.setAttribute("x", String(p.metaX));
    metaT.setAttribute("y", String(p.metaY));
    flowP.setAttribute("d", p.flow);
    flowP.setAttribute("stroke", p.flowColor);
    cogOuter.setAttribute("cx", String(p.cog[0]));
    cogOuter.setAttribute("cy", String(p.cog[1]));
    cogOuter.setAttribute("stroke", p.flowColor);
    cogInner.setAttribute("cx", String(p.cog[0]));
    cogInner.setAttribute("cy", String(p.cog[1]));
    cogInner.setAttribute("fill", p.flowColor);

    badge.textContent = p.badge;
    badge.dataset.ok = p.ok;
    metric.textContent = p.metric;
    caption.textContent = p.cap;
  };

  radios.forEach((r) => r.addEventListener("change", () => r.checked && apply(r.value)));
  apply("diag");
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
      body: "主圆只离画心错开一点点，标题又居中悬在下面——既丢掉了居中的端正，又拉不出偏心的果断张力。对照 C：主圆明确推向右上，左下用标题与暗弧对角接住，节奏立刻清晰。",
    },
    B: {
      ok: false,
      title: "B · 过偏失衡，整张图往右上倒",
      body: "主圆被挤进右上角裁掉近半，文字又全部叠在右侧同侧，左下角彻底塌空——这是海报右下第三格警示的「过偏（失衡）」。对照 C：给主圆留出边缘呼吸，并把标题放到斜对角拉住它。",
    },
    C: {
      ok: true,
      title: "选对了！C · 有控制的失衡",
      body: "最重的珊瑚主圆果断推向右上方且与边框保留呼吸，左下角用暗弧、粗体标题与珊瑚波浪线做斜对角配重，整张画面既有明显视线流动，合成重心也稳稳托得住。",
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
  initWeightContrastLab();
  initLeverLab();
  initDirectionLab();
  initCopyCounterweightLab();
  initQuiz();
  initLightbox();
  initReveals();
}
