import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  THEMES,
  POSTER_ACTS,
  createBrokenState,
  createPosterSolution,
  createZigzagSolution,
  computeLayout,
  sampleGaze,
  diagnose,
} from "./model.js";
import { PALETTE, renderScrollCanvas, hitTestStation } from "./scrollCanvas.js";

// ==================== 全局状态（开场停在 0/4 错态） ====================
let state = createBrokenState("poster");
let currentLayout = null;
let currentGaze = null;
let currentDiag = null;
let heroTime = 0;

// ==================== DOM 引用 ====================
const canvas = document.getElementById("scrollStage");
const ctx = canvas.getContext("2d");

const topStatusBadge = document.getElementById("topStatusBadge");
const gazePaceTag = document.getElementById("gazePaceTag");
const gazeFeelingText = document.getElementById("gazeFeelingText");
const swapHintText = document.getElementById("swapHintText");
const diagBadge = document.getElementById("diagBadge");
const diagTitle = document.getElementById("diagTitle");
const diagWhy = document.getElementById("diagWhy");
const diagAction = document.getElementById("diagAction");
const mBend = document.getElementById("mBend");
const mVariety = document.getElementById("mVariety");
const mRhythm = document.getElementById("mRhythm");
const mVeil = document.getElementById("mVeil");
const slotWeightLabel = document.getElementById("slotWeightLabel");
const btnAutoRoam = document.getElementById("btnAutoRoam");

// ==================== 1. 开场画布尺寸与绘制 ====================
function resizeCanvas(el) {
  const rect = el.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
    el.width = Math.round(w * dpr);
    el.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}

function getOrientation(w, h) {
  return w < 560 && h >= w * 0.8 ? "vertical" : "horizontal";
}

function syncHeroUI() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(240, rect.width || 900);
  const h = Math.max(200, rect.height || 368);
  const orient = getOrientation(w, h);
  currentLayout = computeLayout(state, orient, w / h);
  currentGaze = sampleGaze(currentLayout, state.roamT);
  currentDiag = diagnose(state, currentLayout);

  // 顶栏印章
  topStatusBadge.textContent = currentDiag.ok
    ? "4 / 4 游观成境"
    : `${currentDiag.score} / 4 待编景`;
  topStatusBadge.classList.toggle("is-ok", currentDiag.ok);
  topStatusBadge.classList.toggle("is-warn", !currentDiag.ok);

  // 视窗实时感受条
  gazePaceTag.textContent = `${Math.round(currentGaze.t * 100)}% · ${currentGaze.paceTier}`;
  gazePaceTag.classList.toggle("is-warn", currentGaze.inGap || currentLayout.veilPct >= 80 || (!currentDiag.dims.pathOk && currentLayout.bendRatio < 1.1));
  gazePaceTag.classList.toggle("is-ok", currentDiag.ok && !currentGaze.inGap);
  gazeFeelingText.textContent = currentGaze.feeling;

  // 选中站提示
  const activeSlot = state.selectedSlot >= 0 ? state.selectedSlot : currentGaze.nearest.slot;
  const activeSt = currentLayout.stations[activeSlot];
  slotWeightLabel.textContent = `第 ${activeSlot + 1} 站（${activeSt.scene.short}）权重：`;
  swapHintText.textContent =
    state.selectedSlot >= 0
      ? `已选第 ${state.selectedSlot + 1} 站 · 再点另一站即可对调站序`
      : "画布提示：拖视窗游观 · 点两景对调";

  // 诊单主文
  diagBadge.textContent = currentDiag.primary.badge;
  diagBadge.classList.toggle("is-ok", currentDiag.ok);
  diagTitle.textContent = currentDiag.primary.title;
  diagWhy.textContent = currentDiag.primary.why;
  diagAction.textContent = currentDiag.primary.action;

  // 四个单真源读数
  mBend.textContent = currentLayout.gapSpan ? `断脉 ${currentLayout.gapPct}%` : `${currentLayout.bendRatio.toFixed(2)}×`;
  mVariety.textContent = `${currentLayout.uniqueScenes} / 5 景`;
  mRhythm.textContent = `${currentLayout.dwellRatio.toFixed(1)}× · CV ${currentLayout.paceCV.toFixed(2)}`;
  mVeil.textContent = `${currentLayout.veilPct}%`;

  // 三枚原海报要点灯
  for (const p of currentDiag.corePillars) {
    const el = document.querySelector(`.pillar-item[data-pillar="${p.id}"]`);
    if (el) {
      el.classList.toggle("is-ok", p.ok);
      el.classList.toggle("is-warn", !p.ok);
    }
    const stEl = document.getElementById(
      p.id === "shift" ? "pillarShiftState" : p.id === "path" ? "pillarPathState" : "pillarRhythmState"
    );
    if (stEl) stEl.textContent = p.status;
  }

  // 五幕步进高亮
  document.querySelectorAll(".act-pill").forEach((btn) => {
    const idx = Number(btn.dataset.jump);
    btn.classList.toggle("is-here", currentGaze.nearest.slot === idx && !currentGaze.inGap);
  });

  // 母题高亮
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const on = btn.dataset.theme === state.theme;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  // 序列按钮高亮
  const seqKey = state.monotone
    ? "monotone"
    : state.order[0] === "beacon"
      ? "climaxFirst"
      : state.order.join(",") === "arch,peak,tower,bridge,beacon"
        ? "poster"
        : state.order.join(",") === "arch,bridge,peak,beacon,tower"
          ? "pavilionEnd"
          : "";
  document.querySelectorAll("[data-seq]").forEach((btn) => {
    const on = btn.dataset.seq === seqKey;
    btn.classList.toggle("is-active", on);
    btn.classList.toggle("is-flaw", on && (seqKey === "climaxFirst" || seqKey === "monotone"));
  });

  // 路径按钮高亮
  document.querySelectorAll("[data-path]").forEach((btn) => {
    const on = btn.dataset.path === state.pathMode;
    btn.classList.toggle("is-active", on);
    btn.classList.toggle("is-flaw", on && (state.pathMode === "straight" || state.pathMode === "broken"));
  });

  // 节奏按钮高亮
  const rhythmKey =
    state.spacingMode === "cluster"
      ? "cluster"
      : state.spacingMode === "even" && currentLayout.dwellRatio < 1.2
        ? "flat"
        : state.spacingMode === "crescendo"
          ? "crescendo"
          : state.spacingMode === "balanced" && currentLayout.dwellRatio >= 1.3
            ? "balanced"
            : "";
  document.querySelectorAll("[data-rhythm]").forEach((btn) => {
    const on = btn.dataset.rhythm === rhythmKey;
    btn.classList.toggle("is-active", on);
    btn.classList.toggle("is-flaw", on && (rhythmKey === "flat" || rhythmKey === "cluster"));
  });

  // 藏露按钮高亮
  document.querySelectorAll("[data-reveal]").forEach((btn) => {
    const on = btn.dataset.reveal === state.revealMode;
    btn.classList.toggle("is-active", on);
    btn.classList.toggle("is-flaw", on && (state.revealMode === "exposed" || state.revealMode === "blocked"));
  });

  // 单站权重按钮高亮
  const curW = state.weights[activeSlot] ?? 1.0;
  document.querySelectorAll("[data-w]").forEach((btn) => {
    const wv = Number(btn.dataset.w);
    btn.classList.toggle("is-active", Math.abs(curW - wv) < 0.08);
  });

  btnAutoRoam.setAttribute("aria-pressed", String(state.playing));
  btnAutoRoam.textContent = state.playing ? "暂停游走" : "自动游走";
}

function drawHeroFrame(t, dt, { still }) {
  const { w, h, dpr } = resizeCanvas(canvas);
  const orient = getOrientation(w, h);
  if (!currentLayout || currentLayout.orientation !== orient || Math.abs(currentLayout.aspect - w / h) > 0.05) {
    syncHeroUI();
  }
  if (state.playing && !still && dt > 0) {
    // 经过主停景点时真实减速驻足，体现游观快慢节奏
    const slowFactor = currentGaze && currentGaze.nearStation && currentGaze.nearest.weight >= 1.3 ? 0.42 : 1.0;
    state.roamT += dt * 0.13 * slowFactor;
    if (state.roamT > 1) state.roamT = 0;
    syncHeroUI();
  }
  heroTime = still ? 0.6 : t;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderScrollCanvas(ctx, w, h, state, currentLayout, currentGaze, currentDiag, heroTime);
  ctx.restore();
}

const heroLoop = loop(canvas, drawHeroFrame);

function updateAndRedraw() {
  syncHeroUI();
  heroLoop.draw();
}

// ==================== 开场交互：横向拖动游观视窗 + 点击两景对调 + 键盘 ====================
let dragState = null;

function pointerCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) / Math.max(1, rect.width),
    y: (clientY - rect.top) / Math.max(1, rect.height),
    clientX,
    clientY,
    w: rect.width,
    h: rect.height,
  };
}

function onDragStart(e) {
  const pt = pointerCoords(e);
  dragState = {
    startX: pt.clientX,
    startY: pt.clientY,
    startT: state.roamT,
    moved: false,
    normX: pt.x,
    normY: pt.y,
    aspect: pt.w / Math.max(1, pt.h),
  };
  state.playing = false;
  if (e.type === "pointerdown" && canvas.setPointerCapture) {
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }
}

function onDragMove(e) {
  if (!dragState) return;
  const pt = pointerCoords(e);
  const dx = pt.clientX - dragState.startX;
  const dy = pt.clientY - dragState.startY;
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    dragState.moved = true;
  }
  if (!dragState.moved) return;
  // 横向拖动直接平滑推进游观视窗进度（桌面和手机竖屏均适用，不干扰竖向滚屏）
  const span = Math.max(180, dragState.aspect < 1.2 ? pt.w * 0.85 : pt.w * 0.78);
  const nextT = Math.max(0, Math.min(1, dragState.startT + dx / span));
  if (Math.abs(nextT - state.roamT) > 0.001) {
    state.roamT = nextT;
    updateAndRedraw();
  }
}

function onDragEnd() {
  if (!dragState) return;
  if (!dragState.moved && currentLayout) {
    const hit = hitTestStation(dragState.normX, dragState.normY, currentLayout, dragState.aspect);
    if (hit >= 0) {
      if (state.selectedSlot < 0) {
        state.selectedSlot = hit;
        state.roamT = currentLayout.stations[hit].s;
      } else if (state.selectedSlot === hit) {
        // 再次点同一站：循环切换该站停留权重（轻掠 -> 次停 -> 主停）
        const cur = state.weights[hit];
        state.weights[hit] = cur < 0.85 ? 1.0 : cur < 1.3 ? 1.46 : 0.78;
        state.selectedSlot = -1;
      } else {
        // 点另一站：直接对调两处景致的站序！
        const a = state.selectedSlot;
        const b = hit;
        const tmp = state.order[a];
        state.order[a] = state.order[b];
        state.order[b] = tmp;
        state.monotone = false;
        state.selectedSlot = -1;
        state.roamT = currentLayout.stations[b].s;
      }
      updateAndRedraw();
    } else {
      state.selectedSlot = -1;
      state.roamT = Math.max(0, Math.min(1, dragState.normX));
      updateAndRedraw();
    }
  }
  dragState = null;
}

canvas.addEventListener("pointerdown", onDragStart);
canvas.addEventListener("pointermove", onDragMove);
canvas.addEventListener("pointerup", onDragEnd);
canvas.addEventListener("pointercancel", () => { dragState = null; });
// 额外兼容 perf.mjs 的 CDP touch 事件流
canvas.addEventListener("touchstart", (e) => { if (e.touches.length === 1) onDragStart(e); }, { passive: true });
canvas.addEventListener("touchmove", (e) => { if (e.touches.length === 1) onDragMove(e); }, { passive: true });
canvas.addEventListener("touchend", onDragEnd, { passive: true });

canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.playing = false;
    state.roamT = Math.min(1, state.roamT + (e.shiftKey ? 0.12 : 0.04));
    updateAndRedraw();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.playing = false;
    state.roamT = Math.max(0, state.roamT - (e.shiftKey ? 0.12 : 0.04));
    updateAndRedraw();
  } else if (e.key === " ") {
    e.preventDefault();
    state.playing = !state.playing;
    updateAndRedraw();
  }
});

// 题材切换
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    updateAndRedraw();
  });
});

// 五幕步进跳站
document.querySelectorAll(".act-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.jump);
    state.playing = false;
    state.selectedSlot = idx;
    if (currentLayout) state.roamT = currentLayout.stations[idx].s;
    updateAndRedraw();
  });
});

// 自动游走 & 复原错态
btnAutoRoam.addEventListener("click", () => {
  state.playing = !state.playing;
  updateAndRedraw();
});

document.getElementById("btnResetBroken").addEventListener("click", () => {
  state = createBrokenState(state.theme);
  updateAndRedraw();
});

document.getElementById("btnSolPoster").addEventListener("click", () => {
  state = createPosterSolution(state.theme);
  updateAndRedraw();
});

document.getElementById("btnSolZigzag").addEventListener("click", () => {
  state = createZigzagSolution(state.theme);
  updateAndRedraw();
});

// 四维调律按钮
document.querySelectorAll("[data-seq]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.seq;
    state.selectedSlot = -1;
    if (k === "climaxFirst") {
      state.monotone = false;
      state.order = ["beacon", "peak", "arch", "bridge", "tower"];
    } else if (k === "monotone") {
      state.monotone = true;
    } else if (k === "poster") {
      state.monotone = false;
      state.order = ["arch", "peak", "tower", "bridge", "beacon"];
    } else if (k === "pavilionEnd") {
      state.monotone = false;
      state.order = ["arch", "bridge", "peak", "beacon", "tower"];
    }
    updateAndRedraw();
  });
});

document.querySelectorAll("[data-path]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.pathMode = btn.dataset.path;
    updateAndRedraw();
  });
});

document.querySelectorAll("[data-rhythm]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.rhythm;
    if (k === "flat") {
      state.spacingMode = "even";
      state.weights = [1, 1, 1, 1, 1];
    } else if (k === "cluster") {
      state.spacingMode = "cluster";
      state.weights = [1.0, 1.0, 1.46, 0.78, 1.0];
    } else if (k === "balanced") {
      state.spacingMode = "balanced";
      state.weights = [1.0, 0.78, 1.46, 0.78, 1.46];
    } else if (k === "crescendo") {
      state.spacingMode = "crescendo";
      state.weights = [1.0, 0.78, 1.0, 0.78, 1.46];
    }
    updateAndRedraw();
  });
});

document.querySelectorAll("[data-reveal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.revealMode = btn.dataset.reveal;
    updateAndRedraw();
  });
});

document.querySelectorAll("[data-w]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetSlot = state.selectedSlot >= 0 ? state.selectedSlot : (currentGaze ? currentGaze.nearest.slot : 2);
    state.weights[targetSlot] = Number(btn.dataset.w);
    updateAndRedraw();
  });
});

// ==================== 2. 第 01 节：五幕手卷剧场与拆幕对比 ====================
const ACT_DETAILS = [
  {
    quote: "开场建立入口，用强对比吸引视线",
    explain: "原海报在左下角放了一枚极重的深靛「起点 START」圆章，紧接一座深墨蓝拱门与门内温暖珊瑚日。深色外框夹着明亮门洞，观者甚至不需要文字提示，眼睛就被自然吸进了画面的第一站。",
    keep: "保留入口时：视线在一秒内找到明确的落脚点，顺着门洞与台阶自然滑上粉红路径。",
    omit: "抽掉「01 进入」后：画面失去了明确的起眼锚点，观者会在左上文字、中间楼阁和右上灯塔之间四处乱扫，整段游观连第一步都没迈出去。",
  },
  {
    quote: "视线转向新焦点，引导至下一场景",
    explain: "走过拱门之后，画面突然切到开阔的三角山峰、暖杏圆日与粉树。建筑封闭感瞬间转为自然开阔感——这就是「移步」的意义：不只是挪动坐标，而是转换题材气质与空间开合。",
    keep: "保留移步转折：门洞的窄与山野的阔形成反差，观者的注意力在新鲜感里重新点亮。",
    omit: "抽掉「02 移步」后：观者刚进门就直接撞上最密的主景楼阁，缺少缓冲与铺垫，空间显得局促生硬。",
  },
  {
    quote: "在视觉节点停留，传递关键信息",
    explain: "整幅长图最核心的信息要放在观者已经进入状态的中段。原海报里的双拱楼阁配了粉树、飞鸟和水面细纹，细节密度最高，让视线主动放慢速度，稳稳停下来阅读重点。",
    keep: "保留停留节点：快与慢拉开落差，核心内容获得足够长的注视时间。",
    omit: "抽掉「03 停留」后：全幅只剩匆匆路过的过渡景，视线一路滑到末尾，合上画面却想不起刚才最该记住什么。",
  },
  {
    quote: "通过路径变化，调节视觉节奏",
    explain: "主景之后如果立刻冲向终点，情绪会太急。原海报在这里插进一座弯拱石桥和横向水面波纹，路径也从右弯再拐回左弯——就像乐章里的一段过门，把紧绷的注意力轻轻荡开再推向终章。",
    keep: "保留过渡换拍：中段高潮与终局之间有了呼吸空档，收尾显得从容不迫。",
    omit: "抽掉「04 过渡」后：两处重景贴身相撞、互相抢戏，画面显得拥挤喘不过气。",
  },
  {
    quote: "到达终点形成回望，留下完整印象",
    explain: "原海报在最高处立了一座向两侧发光的条纹灯塔。它不只是路径的终点箭头，更像登上山顶后的回望——灯光把前四幕串成一整段可回味的旅程，而不是一条画到边就戛然而止的线。",
    keep: "保留抵达余韵：视线停在最高地标处回头打量来路，整幅构图在脑中闭合。",
    omit: "抽掉「05 抵达」后：路径滑向画框右上边缘直接断掉，观者觉得故事没讲完就被硬生生切出了画面。",
  },
];

let activeActIdx = 0;
let omitActiveAct = false;

function renderActSection() {
  const act = POSTER_ACTS[activeActIdx];
  const info = ACT_DETAILS[activeActIdx];
  document.getElementById("actQuoteTag").textContent = `海报原话 · ${act.num} ${act.zh}（${act.en}）`;
  document.getElementById("actDetailTitle").textContent = info.quote;
  document.getElementById("actExplain").textContent = info.explain;

  const noteEl = document.getElementById("actOmitNote");
  noteEl.textContent = omitActiveAct ? info.omit : info.keep;
  noteEl.classList.toggle("is-omitted", omitActiveAct);

  const omitBtn = document.getElementById("btnToggleOmit");
  omitBtn.setAttribute("aria-pressed", String(omitActiveAct));
  omitBtn.textContent = omitActiveAct ? `恢复「${act.num} ${act.zh}」` : `试试抽掉「${act.num} ${act.zh}」`;

  document.querySelectorAll(".act-card").forEach((b) => {
    const on = Number(b.dataset.act) === activeActIdx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  // 绘制五幕迷你节奏图 SVG
  const svg = document.getElementById("actMiniSvg");
  const pts = [
    { x: 42, y: 118, r: 10 },
    { x: 104, y: 84, r: 8 },
    { x: 180, y: 56, r: 14 },
    { x: 248, y: 88, r: 8 },
    { x: 318, y: 40, r: 13 },
  ];
  let pathHtml = "";
  if (omitActiveAct) {
    // 画出断缺一段的虚线警示
    const kept = pts.filter((_, i) => i !== activeActIdx);
    const d = kept.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
    pathHtml = `<path d="${d}" fill="none" stroke="#B52626" stroke-width="3" stroke-dasharray="6 5"/>`;
  } else {
    pathHtml = `<path d="M42 118 C 74 114, 78 88, 104 84 C 138 78, 146 58, 180 56 C 216 54, 218 88, 248 88 C 282 88, 286 44, 318 40" fill="none" stroke="#E891A3" stroke-width="5" stroke-linecap="round"/>`;
  }

  const nodesHtml = pts
    .map((p, i) => {
      const isCur = i === activeActIdx;
      if (isCur && omitActiveAct) {
        return `<circle cx="${p.x}" cy="${p.y}" r="${p.r + 3}" fill="none" stroke="#B52626" stroke-width="2" stroke-dasharray="3 3"/>
                <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="11" font-family="DM Mono, monospace" fill="#B52626">缺</text>`;
      }
      const fill = isCur ? "#071B44" : "#366E5B";
      const ring = isCur ? `<circle cx="${p.x}" cy="${p.y}" r="${p.r + 5}" fill="none" stroke="#DF758C" stroke-width="2"/>` : "";
      return `${ring}<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${fill}"/>
              <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="10.5" font-family="DM Mono, monospace" fill="#FFFDF8">${POSTER_ACTS[i].num}</text>`;
    })
    .join("");

  svg.innerHTML = `<rect width="360" height="150" fill="#FBF5EA"/>${pathHtml}${nodesHtml}`;
}

document.querySelectorAll(".act-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeActIdx = Number(btn.dataset.act);
    omitActiveAct = false;
    renderActSection();
  });
});

document.getElementById("btnToggleOmit").addEventListener("click", () => {
  omitActiveAct = !omitActiveAct;
  renderActSection();
});

// ==================== 3. 第 02 节：展卷窗宽卡尺 ====================
const apertureSlider = document.getElementById("apertureSlider");
const apertureVal = document.getElementById("apertureVal");
const apertureVerdict = document.getElementById("apertureVerdict");
const unrollStats = document.getElementById("unrollStats");
const unrollCanvas = document.getElementById("unrollCanvas");
const uctx = unrollCanvas.getContext("2d");

let unrollPhase = 0;

function describeAperture(pct) {
  if (pct <= 26) {
    return {
      tag: `${pct}%（极窄窥视）`,
      stops: 6,
      suspense: "偏紧",
      text: "视窗过窄时，前后景致联系容易被切断，观者能看到细节却难以察觉整条路径的呼应。",
    };
  }
  if (pct <= 48) {
    return {
      tag: `${pct}%（手卷舒适展幅）`,
      stops: 5,
      suspense: "饱满",
      text: "每次展卷恰好容纳一至两幕景致：眼前有主景可细读，卷边又露出下一幕山影或桥角，最容易产生移步换景的持续好奇。",
    };
  }
  if (pct <= 78) {
    return {
      tag: `${pct}%（半幅敞览）`,
      stops: 3,
      suspense: "偏弱",
      text: "一次露出大半卷面，观者只需扫两三眼便大致看全，悬念明显下降。",
    };
  }
  return {
    tag: `${pct}%（整壁一眼望穿）`,
    stops: 1,
    suspense: "归零",
    text: "全幅一次摊开后，起点到终点的五幕全部并列在眼前，时间顺序消失，退化为静态全景图。",
  };
}

function drawUnrollCanvas(t, dt, { still }) {
  const { w, h, dpr } = resizeCanvas(unrollCanvas);
  const pct = Number(apertureSlider.value);
  const info = describeAperture(pct);
  apertureVal.textContent = info.tag;
  apertureVerdict.textContent = info.text;
  unrollStats.textContent = `有效发现 ${info.stops} 段 · 悬念档位：${info.suspense}`;

  if (!still && dt > 0) {
    unrollPhase = (unrollPhase + dt * 0.14) % 1;
  }
  const winFrac = pct / 100;
  const maxStart = Math.max(0, 1 - winFrac);
  const winStart = still ? maxStart * 0.35 : maxStart * (0.5 - 0.5 * Math.cos(unrollPhase * Math.PI * 2));

  uctx.save();
  uctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  uctx.fillStyle = PALETTE.paper;
  uctx.fillRect(0, 0, w, h);

  // 上半部：完整五景手卷带 + 移动展幅窗
  const pad = 18;
  const topY = 20;
  const stripH = Math.round(h * 0.50);
  const stripW = w - pad * 2;

  uctx.fillStyle = PALETTE.paperLight;
  uctx.fillRect(pad, topY, stripW, stripH);
  uctx.strokeStyle = "rgba(7, 27, 68, 0.2)";
  uctx.strokeRect(pad + 0.5, topY + 0.5, stripW - 1, stripH - 1);

  // 简约五景轮廓 + 珊瑚路径
  const nodes = [0.10, 0.30, 0.52, 0.72, 0.90];
  uctx.strokeStyle = PALETTE.rose;
  uctx.lineWidth = 4;
  uctx.beginPath();
  uctx.moveTo(pad + 12, topY + stripH * 0.78);
  uctx.bezierCurveTo(
    pad + stripW * 0.3, topY + stripH * 0.22,
    pad + stripW * 0.65, topY + stripH * 0.85,
    pad + stripW - 16, topY + stripH * 0.28
  );
  uctx.stroke();

  nodes.forEach((nx, i) => {
    const cx = pad + stripW * nx;
    const cy = topY + stripH * (i % 2 === 0 ? 0.62 : 0.42);
    uctx.fillStyle = i === 2 || i === 4 ? PALETTE.navy : PALETTE.sage;
    const rad = i === 2 || i === 4 ? 14 : 9;
    uctx.beginPath();
    uctx.arc(cx, cy, rad, 0, Math.PI * 2);
    uctx.fill();
    uctx.fillStyle = "#FFFDF8";
    uctx.font = '500 10px "DM Mono", monospace';
    uctx.textAlign = "center";
    uctx.textBaseline = "middle";
    uctx.fillText(`0${i + 1}`, cx, cy + 0.5);
  });

  // 未展开区域覆盖松灰宣纸蒙版
  const wx0 = pad + winStart * stripW;
  const ww = winFrac * stripW;
  uctx.fillStyle = "rgba(236, 242, 238, 0.76)";
  uctx.fillRect(pad, topY, Math.max(0, wx0 - pad), stripH);
  uctx.fillRect(wx0 + ww, topY, Math.max(0, pad + stripW - (wx0 + ww)), stripH);

  // 展卷视窗墨蓝边框
  uctx.strokeStyle = PALETTE.navy;
  uctx.lineWidth = 2.4;
  uctx.strokeRect(wx0 + 1, topY + 1, Math.max(4, ww - 2), stripH - 2);

  // 下半部：视觉发现与悬念起伏示意曲线
  const chartY = topY + stripH + 26;
  const chartH = h - chartY - 22;
  uctx.strokeStyle = "rgba(7, 27, 68, 0.16)";
  uctx.lineWidth = 1;
  uctx.beginPath();
  uctx.moveTo(pad, chartY + chartH);
  uctx.lineTo(pad + stripW, chartY + chartH);
  uctx.stroke();

  // 悬念波峰随视窗变宽而迅速拉平
  const peakAmp = Math.max(0.14, 1 - (winFrac - 0.22) * 1.12);
  uctx.strokeStyle = PALETTE.roseDeep;
  uctx.lineWidth = 2.6;
  uctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const px = pad + u * stripW;
    let wave = 0;
    for (const nx of nodes) {
      const dist = (u - nx) / 0.065;
      wave += Math.exp(-dist * dist) * (nx === 0.52 || nx === 0.90 ? 1.0 : 0.65);
    }
    const val = Math.min(1, 0.12 + wave * 0.78 * peakAmp);
    const py = chartY + chartH - val * (chartH - 8);
    if (i === 0) uctx.moveTo(px, py);
    else uctx.lineTo(px, py);
  }
  uctx.stroke();

  uctx.fillStyle = PALETTE.inkMuted || "#334561";
  uctx.font = '500 11px "Noto Serif SC", serif';
  uctx.textAlign = "left";
  uctx.fillText("观者新鲜感与发现波峰（示意）", pad, chartY - 6);
  uctx.restore();
}

const unrollLoop = loop(unrollCanvas, drawUnrollCanvas);
apertureSlider.addEventListener("input", () => unrollLoop.draw());

// ==================== 4. 第 03 节：深靛暗室视线路径模拟 ====================
const rayCanvas = document.getElementById("rayCanvas");
const rctx = rayCanvas.getContext("2d");

const TOPOLOGIES = {
  straight: {
    turns: "0 折",
    veil: "0%",
    risk: "高 · 过早泄底",
    explain: "直廊从入口一枪打穿到尽头：没有任何障景遮挡，视线半秒直达终点后立刻失去探索欲，中间挂再多展品也容易被匆匆掠过。",
    walls: [],
    pts: [[0.08, 0.52], [0.92, 0.52]],
    focal: [[0.32, 0.52], [0.56, 0.52], [0.84, 0.52]],
  },
  screen: {
    turns: "3 折",
    veil: "48%",
    risk: "低 · 顺势移步",
    explain: "入口立一道影壁或屏风，先挡住深处主景、留出侧边柔和光带把人请进去；每绕过一道屏风，视线转向一次、换出一幕新景，正是园林与长卷最经典的藏露结构。",
    walls: [[0.30, 0.14, 0.30, 0.62], [0.58, 0.38, 0.58, 0.88], [0.80, 0.12, 0.80, 0.56]],
    pts: [[0.08, 0.50], [0.22, 0.78], [0.44, 0.78], [0.44, 0.24], [0.70, 0.24], [0.70, 0.76], [0.92, 0.68]],
    focal: [[0.44, 0.24], [0.70, 0.76], [0.92, 0.68]],
  },
  window: {
    turns: "2 折+透窗",
    veil: "38%",
    risk: "极低 · 借景",
    explain: "在墙面开一扇漏窗或月洞门：脚下的路仍然曲折，眼睛却先透过小窗瞥见远景一角——既不把底牌全盘托出，又给了观者继续绕行一探究竟的钩子。",
    walls: [[0.38, 0.12, 0.38, 0.38], [0.38, 0.58, 0.38, 0.88], [0.68, 0.28, 0.68, 0.88]],
    pts: [[0.08, 0.72], [0.24, 0.48], [0.54, 0.48], [0.54, 0.18], [0.82, 0.18], [0.90, 0.54]],
    peek: [0.24, 0.48, 0.90, 0.54],
    focal: [[0.54, 0.18], [0.90, 0.54]],
  },
  deadend: {
    turns: "5 折反绕",
    veil: "84%",
    risk: "极高 · 迷路",
    explain: "把障景摆得密不透风、路线反复折返，观者既看不到前方的视觉引子，也不知道自己身在何处——游观变成了迷宫，耐心在第二次碰壁时就会耗尽。",
    walls: [[0.26, 0.10, 0.26, 0.76], [0.46, 0.24, 0.46, 0.90], [0.64, 0.10, 0.64, 0.78], [0.80, 0.22, 0.80, 0.88]],
    pts: [[0.08, 0.26], [0.18, 0.82], [0.36, 0.82], [0.36, 0.18], [0.55, 0.18], [0.55, 0.84], [0.72, 0.84], [0.72, 0.16], [0.90, 0.16]],
    focal: [[0.90, 0.16]],
  },
};

let activeTopo = "screen";

function updateRayText() {
  const tp = TOPOLOGIES[activeTopo];
  document.getElementById("rayTurns").textContent = tp.turns;
  document.getElementById("rayVeil").textContent = tp.veil;
  document.getElementById("rayRisk").textContent = tp.risk;
  document.getElementById("rayExplain").textContent = tp.explain;
  document.querySelectorAll(".dark-tab").forEach((b) => {
    const on = b.dataset.topo === activeTopo;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

function drawRayCanvas(t, _dt, { still }) {
  const { w, h, dpr } = resizeCanvas(rayCanvas);
  const tp = TOPOLOGIES[activeTopo];

  rctx.save();
  rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rctx.fillStyle = "#0D234D";
  rctx.fillRect(0, 0, w, h);

  // 细暗方格底图
  rctx.strokeStyle = "rgba(251, 245, 234, 0.06)";
  rctx.lineWidth = 1;
  for (let x = 28; x < w; x += 28) {
    rctx.beginPath(); rctx.moveTo(x + 0.5, 0); rctx.lineTo(x + 0.5, h); rctx.stroke();
  }
  for (let y = 28; y < h; y += 28) {
    rctx.beginPath(); rctx.moveTo(0, y + 0.5); rctx.lineTo(w, y + 0.5); rctx.stroke();
  }

  // 漏窗透视虚光
  if (tp.peek) {
    rctx.save();
    rctx.setLineDash([4, 5]);
    rctx.strokeStyle = "rgba(122, 216, 182, 0.72)";
    rctx.lineWidth = 1.6;
    rctx.beginPath();
    rctx.moveTo(tp.peek[0] * w, tp.peek[1] * h);
    rctx.lineTo(tp.peek[2] * w, tp.peek[3] * h);
    rctx.stroke();
    rctx.restore();
  }

  // 障景墙体
  rctx.strokeStyle = "#FBF5EA";
  rctx.lineWidth = 5;
  rctx.lineCap = "square";
  for (const [x1, y1, x2, y2] of tp.walls) {
    rctx.beginPath();
    rctx.moveTo(x1 * w, y1 * h);
    rctx.lineTo(x2 * w, y2 * h);
    rctx.stroke();
  }

  // 路径折线
  const bad = activeTopo === "straight" || activeTopo === "deadend";
  rctx.strokeStyle = bad ? "#FF9485" : "#F6A4B5";
  rctx.lineWidth = 3;
  rctx.lineJoin = "round";
  rctx.beginPath();
  tp.pts.forEach(([x, y], i) => {
    if (i === 0) rctx.moveTo(x * w, y * h);
    else rctx.lineTo(x * w, y * h);
  });
  rctx.stroke();

  // 景致节点
  for (const [fx, fy] of tp.focal) {
    rctx.fillStyle = "#7AD8B6";
    rctx.beginPath();
    rctx.arc(fx * w, fy * h, 6, 0, Math.PI * 2);
    rctx.fill();
  }

  // 起点标识
  const [sx, sy] = tp.pts[0];
  rctx.fillStyle = "#FBF5EA";
  rctx.beginPath();
  rctx.arc(sx * w, sy * h, 7, 0, Math.PI * 2);
  rctx.fill();

  // 移动视线光点
  const u = still ? 0.56 : (t * 0.22) % 1;
  const segCount = tp.pts.length - 1;
  const pos = u * segCount;
  const idx = Math.min(segCount - 1, Math.floor(pos));
  const f = pos - idx;
  const gx = (tp.pts[idx][0] + (tp.pts[idx + 1][0] - tp.pts[idx][0]) * f) * w;
  const gy = (tp.pts[idx][1] + (tp.pts[idx + 1][1] - tp.pts[idx][1]) * f) * h;

  rctx.fillStyle = bad ? "rgba(255, 148, 133, 0.35)" : "rgba(246, 164, 181, 0.35)";
  rctx.beginPath();
  rctx.arc(gx, gy, 14, 0, Math.PI * 2);
  rctx.fill();
  rctx.fillStyle = "#FFFDF8";
  rctx.beginPath();
  rctx.arc(gx, gy, 5, 0, Math.PI * 2);
  rctx.fill();

  rctx.restore();
}

const rayLoop = loop(rayCanvas, drawRayCanvas);
document.querySelectorAll(".dark-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTopo = btn.dataset.topo;
    updateRayText();
    rayLoop.draw();
  });
});

// ==================== 5. 第 04 节：历史脉络五节点 ====================
const ERAS = [
  {
    meta: "南朝刘宋 · 宗炳（375–443）",
    title: "《画山水序》：澄怀观道，卧以游之",
    body: "宗炳是中国现存最早的独立山水画论作者。晚年因年老多病难以再登临名山，便把平生游历过的山水绘在居室四壁，提出「老疾俱至，名山恐难遍睹，唯当澄怀观道，卧以游之」——由此确立了中国美学里把观画当作精神行旅的「卧游」传统。",
    source: "核实出处：宗炳《画山水序》（南朝刘宋），参见 ChinaKnowledge 文献志。",
  },
  {
    meta: "北宋 · 郭熙（约 1000–约 1090）著、郭思编",
    title: "《林泉高致·山水训》：可行、可望，不如可居、可游",
    body: "郭熙在《山水训》里把山水画的观看体验分成四个层次：能走进去（可行）、能远远眺望（可望）都还不够，最高妙的是让人愿意在画中漫步停留（可游）、甚至安顿下来（可居）。纽约大都会艺术博物馆所藏郭熙晚年手卷《树色平远图》（约 1080 年）便以疏朗古木与宽阔秋水，把观者一步步引向卷尾雾中凉亭。",
    source: "核实出处：郭熙《林泉高致·山水训》；纽约大都会艺术博物馆藏《树色平远图》（约 1080，35.6 × 104.4 cm）。",
  },
  {
    meta: "北宋 · 张择端 / 王希孟",
    title: "《清明上河图》与《千里江山图》：手卷里的起承转合",
    body: "故宫博物院藏张择端《清明上河图》（纵 24.8 × 横 528.7 cm）从疏林清冷的汴京郊野起卷，经船只穿梭的汴河把节奏推至喧闹高潮「虹桥」，再穿城门入街市缓缓收尾；王希孟《千里江山图》（纵 51.5 × 横 1191.5 cm）更以近十二米青绿长卷，借峰峦、长桥、村舍与阔水的反复交替，完成一场近十七次展卷的宏大游观。",
    source: "核实出处：故宫博物院藏品志《清明上河图》卷、《千里江山图》卷官方尺幅记录。",
  },
  {
    meta: "明末 · 计成（1582–约 1642）",
    title: "《园冶》（1631）：把画卷上的游观搬进真实庭院",
    body: "计成于明崇祯四年（1631 年）写成中国首部系统造园专著《园冶》，将绘画里的游观经验落入实体建筑：用曲廊、粉墙、门窗与叠石隔断直望，借「巧于因借，精在体宜」的借景手法，把园外远山、塔影与四时天光纳入步移景异的序列之中。",
    source: "核实出处：计成《园冶》（明崇祯四年 1631 年成书，全书三卷含《借景篇》）。",
  },
  {
    meta: "现代建筑与城市设计 · 戈登·卡伦（Gordon Cullen, 1914–1994）",
    title: "《城镇景观》（1961）：连续视觉（Serial Vision）",
    body: "1961 年，英国建筑师戈登·卡伦在 Architectural Press 出版《城镇景观》（Townscape），提出著名的「连续视觉」（Serial Vision）：人以步行速度穿过街巷时，大脑感知的不是一张静态平面图，而是「眼前已有景象（existing view）」与转角后「新浮现景象（emerging view）」的连续交替——这与东方游观式构图在数百年后不谋而合，并直接影响了今天的展览动线与网页叙事长卷。",
    source: "核实出处：Gordon Cullen, Townscape (Architectural Press, 1961)。",
  },
];

function renderEra(idx) {
  const e = ERAS[idx];
  document.getElementById("eraMeta").textContent = e.meta;
  document.getElementById("eraTitle").textContent = e.title;
  document.getElementById("eraBody").textContent = e.body;
  document.getElementById("eraLinkNote").textContent = e.source;
  document.querySelectorAll(".era-btn").forEach((b) => {
    const on = Number(b.dataset.era) === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

document.querySelectorAll(".era-btn").forEach((btn) => {
  btn.addEventListener("click", () => renderEra(Number(btn.dataset.era)));
});

// ==================== 6. 第 05 节：场景分诊翻转 ====================
const TRIAGE_DATA = [
  { ok: "yes", right: "判断准确：徒步导览本身就是线性空间体验，用游观式构图把起终点、节点节奏与沿途换景画在一条曲径上最贴题。", wrong: "其实这正是游观的主场：游客要跟着路线逐站走，用曲径串起入口、停留点与收尾观景台，比枯燥列表好读得多。" },
  { ok: "no",  right: "判断准确：应急疏散要求 1 秒直达核心信息，任何曲折铺垫、藏露悬念都会延误判断，必须直给高对比箭头与大字。", wrong: "千万别在这里用游观！紧急逃生没有「漫步发现」的时间，必须把出口方向和距离一眼拍在正中。" },
  { ok: "yes", right: "判断准确：工艺叙事自带时间顺序与情绪起伏，按「入山→制茶→成汤余韵」逐段展开，能让读者静心读完。", wrong: "制茶长页其实很适合游观：读者点进专题本来就带着好奇心，用节奏起伏逐幕展开比一整屏文字墙更有代入感。" },
  { ok: "no",  right: "判断准确：监控仪表盘需要同屏横向比对 12 台机器的状态，平级模块化网格才是正解，绝不能把数据藏在曲径后面。", wrong: "这里不该用游观！运维盯盘靠的是全局扫视与即时比对，如果让工程师像逛园子一样拐弯找红灯，会直接漏报故障。" },
  { ok: "no",  right: "判断准确：信息流里用户不到一秒就滑过去了，快消主图必须用强焦点直给商品与利益点，留不住人陪你走五幕。", wrong: "秒杀主图千万别绕弯子！受众没有沉浸阅读的意愿，还没走到第 2 站手指就已经划走了。" },
  { ok: "yes", right: "判断准确：文物修复的五道工序天然是一趟有起承转合的精细旅程，用游观节奏把关键修复动作做成「停留节点」极有感染力。", wrong: "其实这道题很适合游观：跨页图解面向有耐心细读的博物馆读者，顺着工序路径移步换景，故事感和专业度都能立起来。" },
];

document.querySelectorAll(".triage-card").forEach((card) => {
  const idx = Number(card.dataset.triage);
  const data = TRIAGE_DATA[idx];
  const fb = card.querySelector(".tc-feedback");
  card.querySelectorAll(".tc-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.pick;
      const isRight = pick === data.ok;
      card.classList.toggle("is-right", isRight);
      card.classList.toggle("is-wrong", !isRight);
      card.querySelectorAll(".tc-btn").forEach((b) => b.classList.toggle("is-picked", b === btn));
      fb.hidden = false;
      fb.classList.toggle("is-wrong", !isRight);
      fb.textContent = isRight ? data.right : data.wrong;
    });
  });
});

// ==================== 7. 第 06 节：四选一单变量练习 ====================
const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    html: "<strong>差在一个变量：路径拉成了死直线。</strong>方案 A 的五站顺序、主亭放大和灯塔回望其实都对了，但整条路笔直横穿画面，从山门一眼就望穿到末尾灯塔，失去了曲径转折带来的遮蔽与移步换景感。",
  },
  B: {
    ok: false,
    html: "<strong>差在一个变量：起承顺序倒置、高潮提前泄底。</strong>方案 B 的 S 形曲径和疏密节奏都不错，但它把最醒目的发光灯塔塞到了开头第 1 站、把入口山门挪去了末尾——开场就亮光底牌，后四站越看越泄气。",
  },
  C: {
    ok: true,
    html: "<strong>答对了！方案 C 四项俱全。</strong>它以强对比山门请人入画，借 S 曲径完成视角转换与藏露，把观海亭放大为中段主停留节点，以小石桥轻快过渡换拍，最后立起发光灯塔向左回望全径，完整兑现了游观式构图的五幕节奏。",
  },
  D: {
    ok: false,
    html: "<strong>差在一个变量：节奏均平、缺少重点停留。</strong>方案 D 虽然走了曲线、顺序也对，但五处景致做得几乎一样大小且均匀隔开，眼睛滑过去像数路灯，全程找不到「03 停留」的核心主景。",
  },
};

const quizFb = document.getElementById("quizFeedback");
document.querySelectorAll(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const opt = btn.dataset.opt;
    const res = QUIZ_FEEDBACK[opt];
    document.querySelectorAll(".quiz-opt").forEach((b) => {
      const me = b === btn;
      b.setAttribute("aria-pressed", String(me));
      b.classList.toggle("is-selected", me);
      b.classList.toggle("is-correct", me && res.ok);
      b.classList.toggle("is-wrong", me && !res.ok);
    });
    quizFb.hidden = false;
    quizFb.classList.toggle("is-wrong", !res.ok);
    quizFb.innerHTML = res.html;
  });
});

// ==================== 8. 第 07 节：原海报灯箱（复用 #poster.src，不重复内联） ====================
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("posterLightbox");
const lbImg = document.getElementById("lbImg");
const lbViewport = document.getElementById("lbViewport");
const lbZoomPct = document.getElementById("lbZoomPct");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomPct.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lbClose").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("openPosterBtn").focus();
}

document.getElementById("openPosterBtn").addEventListener("click", openLightbox);
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lbZoomOut").addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  lbDrag = { sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => { lbDrag = null; });
lbViewport.addEventListener("pointercancel", () => { lbDrag = null; });
lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = Math.max(0.7, Math.min(3, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化与窗口变更监听 ====================
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    updateAndRedraw();
    unrollLoop.draw();
    rayLoop.draw();
  }, 80);
});

syncHeroUI();
heroLoop.draw();
renderActSection();
unrollLoop.draw();
updateRayText();
rayLoop.draw();
renderEra(0);
if (reducedMotion.matches) {
  heroLoop.draw();
  unrollLoop.draw();
  rayLoop.draw();
}
