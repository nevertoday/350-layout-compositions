// 113 流动节奏组织 · 主交互入口
// 全部几何与诊断出自 model.js 单真源；Canvas 循环托管给 ../../lib/stage.js

import { loop, reducedMotion } from "../../lib/stage.js";
import {
  PRESETS,
  MOON_CENTER,
  cloneState,
  clampNode,
  evaluateFlow,
} from "./model.js";
import { renderHeroCanvas, renderCurvatureLab } from "./stage.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ============================================================================
// 1. 开场：活体丝带河道雕塑台
// ============================================================================
const state = cloneState(PRESETS.broken);
let evaluation = evaluateFlow(state);

const heroCanvas = $("#heroCanvas");
const heroTitle = $("#heroTitle");
const topStatusPill = $("#topStatusPill");
const diagPanel = $("#diagPanel");
const diagBadge = $("#diagBadge");
const diagHeadline = $("#diagHeadline");
const diagWhy = $("#diagWhy");
const diagAction = $("#diagAction");
const mSinuosity = $("#mSinuosity");
const mTurn = $("#mTurn");
const mGap = $("#mGap");
const mExit = $("#mExit");
const btnCycleNode = $("#btnCycleNode");

const heroAnim = {
  t: 0,
  reveal: reducedMotion.matches ? 1 : 0.48, // 开场第一瞬即有半幅丝带舒展，0.9s 截图同样完整美观
  gazeS: 0.12,
  dragNode: -1,
  hoverOrb: -1,
  still: reducedMotion.matches,
};

function setText(el, str) {
  if (el && el.textContent !== str) el.textContent = str;
}

let uiDirty = false;
let heroRunning = false;

function syncHeroUI() {
  evaluation = evaluateFlow(state);
  uiDirty = false;
  const passAll = evaluation.passedCount === 4;

  // 顶眉状态（仅在变化时写 DOM，避免拖动期间重复回流）
  setText(topStatusPill, passAll ? "4 / 4 顺流达标" : `${evaluation.passedCount} / 4 待顺流`);
  topStatusPill.classList.toggle("is-ok", passAll);
  topStatusPill.classList.toggle("is-err", !passAll);

  // 示范大标随流势状态呼吸或折顿
  heroTitle.classList.toggle("is-flowing", evaluation.curveOk);
  heroTitle.classList.toggle("is-jagged", !evaluation.curveOk);

  // 原海报四词实时检核
  evaluation.keywords.forEach((kw, idx) => {
    const el = $(`#kwVal${idx}`);
    if (!el) return;
    setText(el, kw.tag);
    el.classList.toggle("is-ok", kw.ok);
    el.classList.toggle("is-err", !kw.ok);
  });

  // 白话单真源诊单
  diagPanel.classList.toggle("is-ok", passAll);
  diagPanel.classList.toggle("is-err", !passAll);
  setText(diagBadge, evaluation.badge);
  setText(diagHeadline, evaluation.headline);
  setText(diagWhy, evaluation.why);
  setText(diagAction, evaluation.action);

  setText(mSinuosity, `${evaluation.sinuosity.toFixed(2)}×`);
  setText(mTurn, `${Math.round(evaluation.maxTurnDeg)}°`);
  setText(mGap, `${evaluation.gapPct}%`);
  setText(mExit, `${evaluation.exitAngleDiffDeg}°`);

  // 同步按钮高亮
  $$(".scene-tab").forEach((b) => {
    const active = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $$("[data-smooth]").forEach((b) => {
    const active = b.dataset.smooth === state.smoothMode;
    b.classList.toggle("is-active", active);
    b.classList.toggle("is-bad", active && state.smoothMode === "kink");
  });
  $$("[data-gap]").forEach((b) => {
    const active = (b.dataset.gap === "open") === state.gapOpen;
    b.classList.toggle("is-active", active);
    b.classList.toggle("is-bad", active && state.gapOpen);
  });
  $$("[data-cadence]").forEach((b) => {
    const active = b.dataset.cadence === state.cadenceMode;
    b.classList.toggle("is-active", active);
    b.classList.toggle("is-bad", active && state.cadenceMode !== "breathing");
  });
  $$("[data-focus]").forEach((b) => {
    const active = b.dataset.focus === state.focusMode;
    b.classList.toggle("is-active", active);
    b.classList.toggle("is-bad", active && state.focusMode !== "moon");
  });

  setText(btnCycleNode, `切节点：${state.nodes[state.activeNode].label}`);
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  heroRunning = !still;
  heroAnim.t = t;
  heroAnim.still = still;
  if (uiDirty) syncHeroUI();
  if (still) {
    heroAnim.reveal = 1;
    heroAnim.gazeS = 0.68;
  } else {
    heroAnim.reveal = Math.min(1, heroAnim.reveal + dt * 1.15);
    const speed = evaluation.curveOk && evaluation.continuityOk ? 0.34 : 0.28;
    heroAnim.gazeS = (heroAnim.gazeS + dt * speed) % 1;
  }
  renderHeroCanvas(heroCanvas, state, evaluation, heroAnim);
});

function refreshHero(fromDrag = false) {
  if (fromDrag && heroRunning && !reducedMotion.matches) {
    // 拖动高频事件仅标脏，由 rAF 合并单次重算与单次绘制，杜绝同帧双绘与布局抖动
    uiDirty = true;
    return;
  }
  syncHeroUI();
  heroLoop.draw();
}

// 画布指针与触摸直拖（既支持精准抓节点、点击断口弥合、点击明月收束，又支持在画布任意处横拖流畅弯折中腰）
let dragInfo = null;

function canvasUV(ev) {
  const r = heroCanvas.getBoundingClientRect();
  return {
    u: (ev.clientX - r.left) / Math.max(1, r.width),
    v: (ev.clientY - r.top) / Math.max(1, r.height),
    w: r.width,
    h: r.height,
  };
}

function findHitNode(u, v) {
  let best = -1;
  let bestD = 0.085;
  state.nodes.forEach((n, i) => {
    const d = Math.hypot(n.u - u, n.v - v);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

heroCanvas.addEventListener("pointerdown", (ev) => {
  const { u, v } = canvasUV(ev);
  const hitNode = findHitNode(u, v);

  // 点击断口圆区（无拖动位移）可直接弥合
  const hitGap = state.gapOpen && Math.hypot(u - evaluation.gapCenter.u, v - evaluation.gapCenter.v) < 0.11;
  const hitMoon = Math.hypot(u - MOON_CENTER.u, v - MOON_CENTER.v) < 0.11;

  const nodeIdx = hitNode >= 0 ? hitNode : state.activeNode;
  state.activeNode = nodeIdx;
  heroAnim.dragNode = nodeIdx;

  const rect = heroCanvas.getBoundingClientRect();
  dragInfo = {
    pointerId: ev.pointerId,
    rect,
    startU: u,
    startV: v,
    origU: state.nodes[nodeIdx].u,
    origV: state.nodes[nodeIdx].v,
    nodeIdx,
    directGrab: hitNode >= 0,
    hitGap,
    hitMoon,
    moved: false,
  };
  if (heroCanvas.setPointerCapture) {
    try {
      heroCanvas.setPointerCapture(ev.pointerId);
    } catch {}
  }
  refreshHero(true);
});

heroCanvas.addEventListener("pointermove", (ev) => {
  if (!dragInfo) {
    const { u, v } = canvasUV(ev);
    // 轻触悬停检测
    let hover = -1;
    evaluation.orbs.forEach((o, i) => {
      if (Math.hypot(o.u - u, o.v - v) < 0.05) hover = i;
    });
    if (hover !== heroAnim.hoverOrb) {
      heroAnim.hoverOrb = hover;
      heroLoop.draw();
    }
    return;
  }
  const r = dragInfo.rect;
  const u = (ev.clientX - r.left) / Math.max(1, r.width);
  const v = (ev.clientY - r.top) / Math.max(1, r.height);
  const du = u - dragInfo.startU;
  const dv = v - dragInfo.startV;
  if (Math.hypot(du, dv) > 0.012) dragInfo.moved = true;

  const next = dragInfo.directGrab
    ? clampNode(dragInfo.nodeIdx, u, v)
    : clampNode(dragInfo.nodeIdx, dragInfo.origU + du, dragInfo.origV + dv * 0.45);
  state.nodes[dragInfo.nodeIdx].u = next.u;
  state.nodes[dragInfo.nodeIdx].v = next.v;
  refreshHero(true);
});

function endPointer(ev) {
  if (!dragInfo) return;
  const info = dragInfo;
  dragInfo = null;
  heroAnim.dragNode = -1;
  if (!info.moved) {
    if (info.hitGap) {
      state.gapOpen = false;
    } else if (info.hitMoon) {
      state.focusMode = state.focusMode === "moon" ? "weak" : "moon";
    }
  }
  if (ev && heroCanvas.releasePointerCapture) {
    try {
      heroCanvas.releasePointerCapture(ev.pointerId);
    } catch {}
  }
  refreshHero();
}

heroCanvas.addEventListener("pointerup", endPointer);
heroCanvas.addEventListener("pointercancel", endPointer);

// 触屏兜底（perf.mjs 派发的是原生 touchStart / touchMove / touchEnd 事件）
let touchDrag = null;
heroCanvas.addEventListener(
  "touchstart",
  (ev) => {
    const t0 = ev.touches[0];
    if (!t0) return;
    const r = heroCanvas.getBoundingClientRect();
    const u = (t0.clientX - r.left) / Math.max(1, r.width);
    const v = (t0.clientY - r.top) / Math.max(1, r.height);
    const hitNode = findHitNode(u, v);
    const nodeIdx = hitNode >= 0 ? hitNode : state.activeNode;
    state.activeNode = nodeIdx;
    heroAnim.dragNode = nodeIdx;
    touchDrag = {
      rect: r,
      startU: u,
      startV: v,
      origU: state.nodes[nodeIdx].u,
      origV: state.nodes[nodeIdx].v,
      nodeIdx,
      directGrab: hitNode >= 0,
      lockedHorizontal: false,
    };
  },
  { passive: true }
);

heroCanvas.addEventListener(
  "touchmove",
  (ev) => {
    if (!touchDrag || !ev.touches[0]) return;
    const t0 = ev.touches[0];
    const r = touchDrag.rect;
    const u = (t0.clientX - r.left) / Math.max(1, r.width);
    const v = (t0.clientY - r.top) / Math.max(1, r.height);
    const du = u - touchDrag.startU;
    const dv = v - touchDrag.startV;
    // 只有明显横向拖动或抓住节点时才阻止滚动，保证手机竖滑整页依然顺滑
    if (touchDrag.directGrab || Math.abs(du) > Math.abs(dv) * 0.85) {
      touchDrag.lockedHorizontal = true;
      ev.preventDefault();
      const next = touchDrag.directGrab
        ? clampNode(touchDrag.nodeIdx, u, v)
        : clampNode(touchDrag.nodeIdx, touchDrag.origU + du, touchDrag.origV + dv * 0.35);
      state.nodes[touchDrag.nodeIdx].u = next.u;
      state.nodes[touchDrag.nodeIdx].v = next.v;
      refreshHero(true);
    }
  },
  { passive: false }
);

heroCanvas.addEventListener(
  "touchend",
  () => {
    touchDrag = null;
    heroAnim.dragNode = -1;
    refreshHero();
  },
  { passive: true }
);

// 键盘操作画布节点
heroCanvas.addEventListener("keydown", (ev) => {
  const step = ev.shiftKey ? 0.05 : 0.025;
  const node = state.nodes[state.activeNode];
  if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    const n = clampNode(state.activeNode, node.u - step, node.v);
    node.u = n.u;
    refreshHero();
  } else if (ev.key === "ArrowRight") {
    ev.preventDefault();
    const n = clampNode(state.activeNode, node.u + step, node.v);
    node.u = n.u;
    refreshHero();
  } else if (ev.key === "ArrowUp") {
    ev.preventDefault();
    const n = clampNode(state.activeNode, node.u, node.v - step);
    node.v = n.v;
    refreshHero();
  } else if (ev.key === "ArrowDown") {
    ev.preventDefault();
    const n = clampNode(state.activeNode, node.u, node.v + step);
    node.v = n.v;
    refreshHero();
  } else if (ev.key === " " || ev.key === "Enter") {
    ev.preventDefault();
    state.activeNode = (state.activeNode + 1) % state.nodes.length;
    refreshHero();
  }
});

// 场景切换与控台绑定
$$(".scene-tab").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    refreshHero();
  })
);
$$("[data-smooth]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.smoothMode = btn.dataset.smooth;
    refreshHero();
  })
);
$$("[data-gap]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.gapOpen = btn.dataset.gap === "open";
    refreshHero();
  })
);
$$("[data-cadence]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.cadenceMode = btn.dataset.cadence;
    refreshHero();
  })
);
$$("[data-focus]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.focusMode = btn.dataset.focus;
    refreshHero();
  })
);
btnCycleNode.addEventListener("click", () => {
  state.activeNode = (state.activeNode + 1) % state.nodes.length;
  refreshHero();
});
$$("[data-preset]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const next = cloneState(PRESETS[btn.dataset.preset]);
    const currentScene = state.scene;
    Object.assign(state, next);
    state.scene = currentScene;
    refreshHero();
  })
);

syncHeroUI();

// ============================================================================
// 2. Section 01: 五段接力步进器 + 单段破坏 SVG
// ============================================================================
const RELAY_DATA = [
  {
    tag: "第 01 段 · 起点引入",
    okTitle: "起点引入：给眼睛一个明确的入口斜势",
    okBody: "海报的珊瑚粉丝带从左下边沿自然探入，而非悬空落笔。眼睛扫过画幅下缘时瞬间接住入口切线，无需在空白里盲目寻路。",
    badTitle: "破坏第 01 段：入口藏进角落，视线找不到起跑线",
    badBody: "如果起点缩成一团弱小碎点或藏在杂乱角落，读者扫视第一秒就抓不到流向，后面画得再顺滑也无人上车。",
  },
  {
    tag: "第 02 段 · 曲线引导",
    okTitle: "曲线引导：靠柔弯切线把视线自然卷向前方",
    okBody: "平滑的弯道顺应格式塔「良好延续律」，眼球像贴在缓坡滑道上一样毫不费力地滑过第一道折返。",
    badTitle: "破坏第 02 段：硬折锯齿直接把眼球顶停",
    badBody: "把曲线换成生硬直角拐弯后，眼球必须在角点急刹并重新确认方向，原本的有机流势瞬间退化成机械折线。",
  },
  {
    tag: "第 03 段 · 连绵不断",
    okTitle: "连绵不断：中段实体稳稳托住前进惯性",
    okBody: "中桥段既没有大面积断裂，也没有垂直横挡的杂物截流，视觉动势一路保持连贯不被打断。",
    badTitle: "破坏第 03 段：半路裂开大断口，动势当场腰斩",
    badBody: "中段一旦空出一截宽大缺口，前段积累的流动惯性在半空耗散，读者的视线容易从缺口溜向旁侧无关信息。",
  },
  {
    tag: "第 04 段 · 节奏渐进",
    okTitle: "节奏渐进：弯道松紧与拍点大小张弛有度",
    okBody: "原海报上五枚圆点随弯道外怀错落起伏，宽弯从容、收弯紧凑，让连续流动拥有呼吸感和音乐里的连奏韵味。",
    badTitle: "破坏第 04 段：拍点全部扎堆或锁死等距，韵律哑火",
    badBody: "拍点如果全挤在一起会显得前重后空；如果机械等距同号，则像流水线刻度，抽空了有机流动的生命感。",
  },
  {
    tag: "第 05 段 · 终点聚焦",
    okTitle: "终点聚焦：末端切线稳稳交汇象牙明月",
    okBody: "一条好河道终究要有归宿。丝带与虚线箭头在右上齐齐指向高明度象牙圆月，视线滑到尽头顺理成章地停驻收尾。",
    badTitle: "破坏第 05 段：缺少落点或切线偏靶，视线滑出画面",
    badBody: "如果终点没有明确主体承接，或者曲线收尾甩向画框外缘，精心铺设的视线就会从右上角直接逃出页面。",
  },
];

let relayIdx = 0;
let relayBroken = false;

function renderRelaySvg() {
  const svg = $("#relaySvg");
  const d = RELAY_DATA[relayIdx];
  $("#relayStageTag").textContent = relayBroken ? `${d.tag} · 破坏演示` : `${d.tag} · 完整接力`;
  $("#relayTitle").textContent = relayBroken ? d.badTitle : d.okTitle;
  $("#relayBody").textContent = relayBroken ? d.badBody : d.okBody;

  // 五段锚点坐标
  const pts = [
    [60, 215],
    [185, 175],
    [315, 130],
    [450, 95],
    [565, 68],
  ];
  const fullPath = "M 22 232 C 110 232, 130 185, 195 170 C 265 154, 285 126, 355 122 C 425 118, 455 86, 545 72";
  const kinkPath = "M 22 232 L 135 232 L 195 110 L 295 185 L 395 118 L 545 72";
  const veerPath = "M 22 232 C 110 232, 130 185, 195 170 C 265 154, 285 126, 355 122 C 425 118, 455 74, 495 16";

  let pathMarkup = `<path d="${fullPath}" fill="none" stroke="#F16393" stroke-width="14" stroke-linecap="round"/>`;
  if (relayBroken && relayIdx === 0) {
    pathMarkup = `<path d="M 160 182 C 240 162, 285 126, 355 122 C 425 118, 455 86, 545 72" fill="none" stroke="#F16393" stroke-width="14" stroke-linecap="round"/>
      <circle cx="58" cy="216" r="18" fill="none" stroke="#FF8B73" stroke-width="2" stroke-dasharray="5 5"/>
      <text x="58" y="250" text-anchor="middle" fill="#FF8B73" font-size="11" font-family="Noto Sans SC,sans-serif">入口缺失</text>`;
  } else if (relayBroken && relayIdx === 1) {
    pathMarkup = `<path d="${kinkPath}" fill="none" stroke="#FF8B73" stroke-width="12" stroke-linejoin="miter"/>
      <circle cx="195" cy="110" r="14" fill="none" stroke="#FF8B73" stroke-width="2" stroke-dasharray="4 4"/>`;
  } else if (relayBroken && relayIdx === 2) {
    pathMarkup = `<path d="M 22 232 C 110 232, 130 185, 225 162" fill="none" stroke="#F16393" stroke-width="14" stroke-linecap="round"/>
      <path d="M 410 112 C 455 96, 490 80, 545 72" fill="none" stroke="#F16393" stroke-width="14" stroke-linecap="round"/>
      <line x1="238" y1="158" x2="398" y2="115" stroke="#FF8B73" stroke-width="2" stroke-dasharray="6 6"/>
      <text x="318" y="160" text-anchor="middle" fill="#FF8B73" font-size="11" font-family="Noto Sans SC,sans-serif">中段断流</text>`;
  } else if (relayBroken && relayIdx === 4) {
    pathMarkup = `<path d="${veerPath}" fill="none" stroke="#F16393" stroke-width="14" stroke-linecap="round"/>
      <line x1="495" y1="16" x2="508" y2="4" stroke="#FF8B73" stroke-width="2.5"/>`;
  }

  const orbCoords =
    relayBroken && relayIdx === 3
      ? [
          [115, 195, 9],
          [138, 184, 9],
          [160, 173, 9],
          [182, 162, 9],
        ]
      : [
          [112, 194, 11],
          [224, 134, 9],
          [348, 94, 10],
          [464, 114, 8],
        ];
  const orbsMarkup = orbCoords
    .map(
      ([cx, cy, r]) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${relayBroken && relayIdx === 3 ? "#FF8B73" : "#F16393"}"/>`
    )
    .join("");

  const moonMarkup =
    relayBroken && relayIdx === 4
      ? `<circle cx="575" cy="70" r="14" fill="rgba(243,234,219,0.35)" stroke="#FF8B73" stroke-dasharray="4 4"/>
         <text x="575" y="106" text-anchor="middle" fill="#FF8B73" font-size="11" font-family="Noto Sans SC,sans-serif">偏靶失焦</text>`
      : `<circle cx="575" cy="70" r="30" fill="#F3EADB"/>`;

  const [hx, hy] = pts[relayIdx];
  const focusRing = `<circle cx="${hx}" cy="${hy}" r="24" fill="none" stroke="${relayBroken ? "#FF8B73" : "#6EE7C8"}" stroke-width="2" stroke-dasharray="5 4"/>`;

  svg.innerHTML = `
    <rect width="640" height="270" fill="#170627"/>
    <path d="${fullPath}" transform="translate(0,-20)" fill="none" stroke="rgba(241,99,147,0.35)" stroke-width="1.3" stroke-dasharray="5 6"/>
    ${pathMarkup}
    ${orbsMarkup}
    ${moonMarkup}
    ${focusRing}
    <text x="${Math.max(48, Math.min(585, hx))}" y="${Math.min(254, hy + 42)}" text-anchor="middle" fill="#F8F5FA" font-size="12" font-weight="700" font-family="Noto Sans SC,sans-serif">${d.tag}</text>
  `;
}

$$(".relay-item").forEach((btn) =>
  btn.addEventListener("click", () => {
    relayIdx = Number(btn.dataset.stage);
    $$(".relay-item").forEach((b, i) => {
      const a = i === relayIdx;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-selected", String(a));
    });
    renderRelaySvg();
  })
);
$$("[data-sabotage]").forEach((btn) =>
  btn.addEventListener("click", () => {
    relayBroken = btn.dataset.sabotage === "break";
    $$("[data-sabotage]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderRelaySvg();
  })
);
renderRelaySvg();

// ============================================================================
// 3. Section 02: 曲率梳与视线惯性 2D Canvas 实验室
// ============================================================================
const curvCanvas = $("#curvCanvas");
const ampRange = $("#ampRange");
const ampVal = $("#ampVal");
const curvVerdict = $("#curvVerdict");
const curvDesc = $("#curvDesc");

const curvOpts = { order: "c2", amp: 0.62 };
const curvAnim = { t: 0, still: reducedMotion.matches };

function syncCurvReadout() {
  const a = curvOpts.amp;
  // 按真实函数弧长估算弯曲比（与画布同源）
  const sinu =
    curvOpts.order === "c0"
      ? Math.hypot(1, a * 1.45)
      : curvOpts.order === "c1"
        ? 1 + a * a * 0.72
        : 1 + a * a * 0.64;

  ampVal.textContent = `${Math.round(a * 100)}%`;

  if (curvOpts.order === "c0") {
    curvVerdict.textContent = `C0 折线硬拐 · 弯曲比 ${sinu.toFixed(2)}×（顶点曲率突变）`;
    curvDesc.textContent = "在拐点处两段直线直接相撞，曲率梳瞬间爆针。视线惯性被迫归零重启，读起来生硬硌眼，不构成流动节奏。";
  } else if (curvOpts.order === "c1") {
    curvVerdict.textContent = `C1 圆弧拼接 · 弯曲比 ${sinu.toFixed(2)}×（中点曲率反号跳变）`;
    curvDesc.textContent = "切线虽然接上了，但中点处弯曲方向瞬间从正跳到负（曲率梳突然翻折），视觉上会出现细微的「卡顿感」。";
  } else if (sinu < 1.12) {
    curvVerdict.textContent = `C2 柔弯但偏平 · 弯曲比 ${sinu.toFixed(2)}×（低于 1.12× 经验带）`;
    curvDesc.textContent = "虽然曲率平滑，但振幅太浅接近直线，试着拉高弯幅，感受视线自然起伏的临界点。";
  } else if (sinu > 1.52) {
    curvVerdict.textContent = `C2 过深急弯 · 弯曲比 ${sinu.toFixed(2)}×（接近急甩边缘）`;
    curvDesc.textContent = "弯幅越深，上下摆动占用的视线行程越长，向右推进的效率开始下降。";
  } else {
    curvVerdict.textContent = `C2 曲率平滑 · 弯曲比 ${sinu.toFixed(2)}×（经验甜区）`;
    curvDesc.textContent = "画面里的淡米色竖线是「曲率梳」：梳齿在拐点处平滑归零再反向长出，视线像过缓坡弯道，不必急刹。";
  }
}

const curvLoop = loop(curvCanvas, (t, _dt, { still }) => {
  curvAnim.t = t;
  curvAnim.still = still;
  renderCurvatureLab(curvCanvas, curvOpts, curvAnim);
});

$$("[data-order]").forEach((btn) =>
  btn.addEventListener("click", () => {
    curvOpts.order = btn.dataset.order;
    $$("[data-order]").forEach((b) => b.classList.toggle("is-active", b === btn));
    syncCurvReadout();
    curvLoop.draw();
  })
);
ampRange.addEventListener("input", () => {
  curvOpts.amp = Number(ampRange.value) / 100;
  syncCurvReadout();
  curvLoop.draw();
});
syncCurvReadout();

// ============================================================================
// 4. Section 03: 四纪元流线骨架叠片
// ============================================================================
const ERA_DATA = {
  hogarth: {
    pill: "1745 / 1753 · 蛇形 S 线",
    title: "荷加斯把 S 形「美的线条」画进了自画像调色板",
    body: "1745 年，英国画家威廉·荷加斯在自画像《画家与他的巴哥犬》（现藏伦敦泰特不列颠美术馆，编号 N00112）左下角调色板上画下一条 S 形曲线，题作「The Line of Beauty」。1753 年出版的《美的分析》更并列画出七条弯曲度递增的弧线，说明太直显得僵硬、太卷显得局促，唯有居中那条适度舒展的蛇形曲线最能让视线产生愉悦的追逐感。",
    base: `<rect x="40" y="34" width="520" height="252" fill="none" stroke="rgba(243,234,219,0.16)" stroke-dasharray="4 6"/>
      <text x="80" y="64" fill="#D7CAE2" font-size="11" font-family="Space Mono,monospace">PLATE I · 7 CURVES</text>
      <path d="M 100 250 C 102 180, 98 120, 100 72" fill="none" stroke="rgba(243,234,219,0.22)" stroke-width="2"/>
      <path d="M 170 250 C 185 185, 155 125, 170 72" fill="none" stroke="rgba(243,234,219,0.26)" stroke-width="2"/>
      <path d="M 240 250 C 272 190, 208 130, 240 72" fill="none" stroke="rgba(243,234,219,0.34)" stroke-width="2.5"/>
      <path d="M 410 250 C 470 198, 350 122, 410 72" fill="none" stroke="rgba(243,234,219,0.28)" stroke-width="2"/>
      <path d="M 490 250 C 575 204, 405 118, 490 72" fill="none" stroke="rgba(243,234,219,0.22)" stroke-width="2"/>`,
    flow: `<path d="M 325 256 C 378 192, 272 128, 325 66" fill="none" stroke="#F16393" stroke-width="8" stroke-linecap="round"/>
      <circle cx="325" cy="66" r="10" fill="#F3EADB"/>
      <text x="325" y="284" text-anchor="middle" fill="#FF8FB6" font-size="12" font-family="Noto Sans SC,sans-serif">第 4 号「美的线条」：曲度居中、张弛最匀</text>`,
  },
  hokusai: {
    pill: "约 1830–1832 · 弧浪聚焦",
    title: "葛饰北斋用多重巨浪曲线把视线送向远处富士山",
    body: "约 1830–1832 年间刊行的木版画《神奈川冲浪里》（大都会艺术博物馆藏品 45434）不是靠一条单线，而是把巨浪主弧、前景小浪与三艘狭长木船的弧度层层嵌套，从左上方翻涌而下再兜回中心，稳稳框住并指向地平线上冷静的小三角——富士山。",
    base: `<rect x="40" y="34" width="520" height="252" fill="none" stroke="rgba(243,234,219,0.16)"/>
      <path d="M 340 236 L 395 162 L 450 236 Z" fill="rgba(243,234,219,0.2)" stroke="#F3EADB" stroke-width="1.5"/>
      <path d="M 60 255 Q 240 205 530 252" fill="none" stroke="rgba(243,234,219,0.22)" stroke-width="2"/>`,
    flow: `<path d="M 65 258 C 105 90, 225 46, 336 96 C 270 116, 232 162, 344 194" fill="none" stroke="#F16393" stroke-width="8" stroke-linecap="round"/>
      <path d="M 95 266 C 175 186, 265 188, 362 198" fill="none" stroke="#F95D92" stroke-width="4" stroke-dasharray="6 5"/>
      <circle cx="395" cy="188" r="18" fill="#F3EADB" fill-opacity="0.92"/>
      <text x="395" y="274" text-anchor="middle" fill="#FF8FB6" font-size="12" font-family="Noto Sans SC,sans-serif">巨浪大弧与船身副弧同指远方富士山焦点</text>`,
  },
  mucha: {
    pill: "1894–1896 · 新艺术鞭梢线",
    title: "穆夏把植物茎蔓与卷烟曲线变成了现代海报骨架",
    body: "1894 年底阿尔丰斯·穆夏为巴黎戏剧《吉斯蒙达》（Gismonda）绘制的细长石版海报，以及 1896 年的《Job》卷烟纸海报，将新艺术运动标志性的「鞭梢曲线（coup de fouet）」推向顶峰：缠绕的发丝、烟雾与花卉边框融成连续起伏的流动节奏，令整张海报无需刚性方框也能紧紧锁住街头行人的目光。",
    base: `<rect x="190" y="24" width="220" height="272" fill="none" stroke="rgba(243,234,219,0.24)" stroke-width="1.5"/>
      <circle cx="300" cy="108" r="56" fill="none" stroke="rgba(243,234,219,0.22)" stroke-width="2" stroke-dasharray="4 5"/>`,
    flow: `<path d="M 218 280 C 202 220, 382 218, 368 152 C 356 96, 236 130, 250 74 C 260 44, 326 42, 346 66" fill="none" stroke="#F16393" stroke-width="7" stroke-linecap="round"/>
      <path d="M 244 274 C 244 236, 346 230, 344 166" fill="none" stroke="#F95D92" stroke-width="2.5" stroke-dasharray="5 5"/>
      <circle cx="300" cy="88" r="14" fill="#F3EADB"/>
      <text x="300" y="310" text-anchor="middle" fill="#FF8FB6" font-size="11.5" font-family="Noto Sans SC,sans-serif">烟雾与发丝构成的连续鞭梢 S 曲线环抱核心字标</text>`,
  },
  gestalt: {
    pill: "1923–1979 · 视知觉科学化",
    title: "从格式塔良好延续到现代设计课本里的「连奏节奏」",
    body: "1923 年韦特海默通过点列与交线实验证明了「良好延续律」；鲁道夫·阿恩海姆在《艺术与视知觉》（1954 首版、1974 修订版）中系统阐释了斜势与曲线如何制造视觉张力；1979 年 David A. Lauer 在《Design Basics》中将流动节奏正式列为基本视觉节奏之一，并借音乐「连奏（legato）」将其与交替、渐进清晰区分。",
    base: `<line x1="80" y1="240" x2="520" y2="80" stroke="rgba(243,234,219,0.18)" stroke-width="2" stroke-dasharray="5 5"/>
      <path d="M 160 72 L 430 248" stroke="rgba(243,234,219,0.26)" stroke-width="2.5"/>`,
    flow: `<path d="M 80 220 C 180 240, 220 110, 310 142 C 390 170, 440 86, 520 74" fill="none" stroke="#F16393" stroke-width="7" stroke-linecap="round"/>
      <circle cx="150" cy="218" r="7" fill="#F16393"/>
      <circle cx="242" cy="146" r="7" fill="#F16393"/>
      <circle cx="350" cy="150" r="7" fill="#F16393"/>
      <circle cx="448" cy="96" r="7" fill="#F16393"/>
      <circle cx="520" cy="74" r="14" fill="#F3EADB"/>
      <text x="300" y="286" text-anchor="middle" fill="#FF8FB6" font-size="12" font-family="Noto Sans SC,sans-serif">即便有杂线穿插，人眼仍优先沿曲率平滑的连续曲线分组</text>`,
  },
};

let activeEra = "hogarth";
let eraSkeletonOnly = false;

function renderEra() {
  const e = ERA_DATA[activeEra];
  $("#eraPill").textContent = e.pill;
  $("#eraTitle").textContent = e.title;
  $("#eraBody").textContent = e.body;
  $("#eraSvg").innerHTML = `
    <rect width="600" height="320" fill="#170627"/>
    ${eraSkeletonOnly ? "" : e.base}
    ${e.flow}
  `;
}

$$(".era-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    activeEra = btn.dataset.era;
    $$(".era-btn").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-selected", String(a));
    });
    renderEra();
  })
);
$("#btnEraSkeleton").addEventListener("click", (ev) => {
  eraSkeletonOnly = !eraSkeletonOnly;
  ev.currentTarget.setAttribute("aria-pressed", String(eraSkeletonOnly));
  ev.currentTarget.textContent = eraSkeletonOnly ? "恢复历史构图底稿" : "隐去底稿，只看流线骨架";
  renderEra();
});
renderEra();

// ============================================================================
// 5. Section 04: 同素材七圆五种节奏变形对照
// ============================================================================
const FAMILY_MODES = {
  repeat: {
    note: "<strong>107 重复原则（节拍器）：</strong>7 枚圆完全等大、等距、同水平线排列。最稳、最省心，但缺少方向牵引与起伏动势。",
    draw: () => {
      const xs = [95, 190, 285, 380, 475, 570, 665];
      return `<line x1="60" y1="100" x2="700" y2="100" stroke="rgba(241,99,147,0.3)" stroke-dasharray="5 5"/>` +
        xs.map((x) => `<circle cx="${x}" cy="100" r="19" fill="#F16393"/>`).join("");
    },
  },
  alt: {
    note: "<strong>111 交替节奏组织（强弱二拍）：</strong>A/B 两态按清晰周期交替，明快、有跳动对比，节奏感落在每一次「切换」上。",
    draw: () => {
      const xs = [95, 190, 285, 380, 475, 570, 665];
      return xs
        .map((x, i) =>
          i % 2 === 0
            ? `<circle cx="${x}" cy="100" r="24" fill="#F16393"/>`
            : `<circle cx="${x}" cy="100" r="13" fill="#F3EADB"/>`
        )
        .join("");
    },
  },
  prog: {
    note: "<strong>112 渐进节奏组织（渐强梯 crescendo）：</strong>沿单一方向步步放大并拉升高度，核心是可预期的阶梯递增而非弯曲流势。",
    draw: () => {
      const xs = [85, 165, 250, 345, 445, 552, 668];
      const rs = [8, 11, 14, 18, 22, 27, 33];
      return `<line x1="85" y1="156" x2="668" y2="54" stroke="rgba(243,234,219,0.45)" stroke-width="1.5"/>` +
        xs.map((x, i) => `<circle cx="${x}" cy="${154 - i * 16}" r="${rs[i]}" fill="${i === 6 ? "#F3EADB" : "#F16393"}"/>`).join("");
    },
  },
  flow: {
    note: "<strong>113 流动节奏组织（本页 · 连奏 legato）：</strong>7 枚圆顺着连续 S 形波谷与波峰起落，大小与间距随曲率自然呼吸，视线被柔和地推向右上焦点。",
    draw: () => {
      const curve = "M 48 166 C 165 170, 190 54, 335 76 C 470 96, 515 150, 682 48";
      const pts = [
        [98, 160, 15, "#F16393"],
        [182, 118, 19, "#F16393"],
        [278, 72, 16, "#F16393"],
        [384, 88, 21, "#F16393"],
        [484, 116, 15, "#F16393"],
        [585, 96, 14, "#F16393"],
        [682, 48, 28, "#F3EADB"],
      ];
      return `<path d="${curve}" fill="none" stroke="#F16393" stroke-width="10" stroke-linecap="round" opacity="0.55"/>
        <path d="${curve}" transform="translate(0,-16)" fill="none" stroke="#F95D92" stroke-width="1.4" stroke-dasharray="5 6"/>` +
        pts.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("");
    },
  },
  rand: {
    note: "<strong>114 随机节奏组织（即兴散拍）：</strong>打破规律与连贯轨线，靠大小和疏密的不可预测性激发自由灵动，但不再提供单向引导路径。",
    draw: () => {
      const pts = [
        [92, 62, 12],
        [176, 148, 24],
        [288, 52, 16],
        [362, 124, 10],
        [478, 156, 20],
        [564, 68, 27],
        [676, 134, 14],
      ];
      return pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#F16393"/>`).join("");
    },
  },
};

function renderFamily(mode) {
  const m = FAMILY_MODES[mode];
  $("#familySvg").innerHTML = `<rect width="760" height="200" fill="#170627"/>${m.draw()}`;
  $("#familyNote").innerHTML = m.note;
}

$$(".fam-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    $$(".fam-btn").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-selected", String(a));
    });
    renderFamily(btn.dataset.rhythm);
  })
);
renderFamily("flow");

// ============================================================================
// 6. Section 05: 真实版面隐形流线 X 光显影器
// ============================================================================
const XRAY_SCENES = {
  landing: {
    caption: "<strong>品牌故事长页：</strong>首屏左上大标引出方向，中段三块图文按左—右—左交错摆开，相邻图像斜势彼此承接，把滚动的视线柔和地汇入底部单一行动按钮。",
    base: `
      <rect x="28" y="20" width="704" height="300" fill="#FAF6EE" stroke="#D7C8DF"/>
      <rect x="52" y="42" width="180" height="18" fill="#1D0B2E"/>
      <rect x="52" y="68" width="136" height="8" fill="#4B365E" opacity="0.65"/>
      <rect x="52" y="84" width="110" height="8" fill="#4B365E" opacity="0.45"/>
      <rect x="292" y="42" width="176" height="88" fill="#EFE6D8" stroke="#D7C8DF"/>
      <circle cx="380" cy="86" r="24" fill="#D7C8DF"/>
      <rect x="118" y="148" width="176" height="82" fill="#EFE6D8" stroke="#D7C8DF"/>
      <rect x="336" y="158" width="152" height="12" fill="#1D0B2E"/>
      <rect x="336" y="178" width="128" height="8" fill="#4B365E" opacity="0.6"/>
      <rect x="336" y="194" width="140" height="8" fill="#4B365E" opacity="0.45"/>
      <rect x="524" y="146" width="176" height="88" fill="#EFE6D8" stroke="#D7C8DF"/>
      <rect x="546" y="258" width="144" height="38" fill="#170627"/>
      <text x="618" y="281" text-anchor="middle" fill="#F3EADB" font-size="12" font-weight="700" font-family="Noto Sans SC,sans-serif">预约体验 →</text>
    `,
    flow: `
      <path d="M 88 70 C 210 70, 290 66, 380 96 C 455 122, 165 148, 225 196 C 288 246, 515 162, 616 266" fill="none" stroke="#F16393" stroke-width="10" stroke-linecap="round"/>
      <circle cx="88" cy="70" r="8" fill="#A81E52"/>
      <circle cx="380" cy="96" r="9" fill="#F16393"/>
      <circle cx="225" cy="196" r="9" fill="#F16393"/>
      <circle cx="618" cy="276" r="22" fill="none" stroke="#A81E52" stroke-width="3"/>
    `,
  },
  poster: {
    caption: "<strong>饮品视觉海报：</strong>不画多余辅助线，单靠上方倾倒的液柱弧势、中段悬浮水果与斜排品名，就把视线一路带到右下角品牌罐身。",
    base: `
      <rect x="210" y="18" width="340" height="304" fill="#170627"/>
      <text x="236" y="64" fill="#F8F5FA" font-size="22" font-weight="900" font-family="Noto Sans SC,sans-serif">夏夜冷萃</text>
      <text x="236" y="84" fill="#D7CAE2" font-size="11" font-family="Inter,sans-serif">BOTANICAL COLD BREW</text>
      <circle cx="352" cy="146" r="24" fill="#2A1242" stroke="#533273"/>
      <circle cx="426" cy="198" r="18" fill="#2A1242" stroke="#533273"/>
      <rect x="442" y="218" width="76" height="84" fill="#F3EADB"/>
      <text x="480" y="264" text-anchor="middle" fill="#170627" font-size="12" font-weight="900" font-family="Noto Sans SC,sans-serif">瓶身焦点</text>
    `,
    flow: `
      <path d="M 248 92 C 330 98, 305 162, 378 168 C 440 174, 412 222, 476 254" fill="none" stroke="#F16393" stroke-width="11" stroke-linecap="round"/>
      <circle cx="352" cy="146" r="10" fill="#F95D92"/>
      <circle cx="426" cy="198" r="9" fill="#F95D92"/>
      <circle cx="480" cy="260" r="30" fill="none" stroke="#6EE7C8" stroke-width="2.5" stroke-dasharray="5 4"/>
    `,
  },
  brochure: {
    caption: "<strong>文化展览折页：</strong>三折页面最怕折痕把视线砍成三块孤岛。让一道连续弧形展品剪影横跨两道折线，读者自然会一页一页把折页完全展开。",
    base: `
      <rect x="34" y="34" width="224" height="272" fill="#EFE6D8" stroke="#C5B4CF"/>
      <rect x="268" y="34" width="224" height="272" fill="#FAF6EE" stroke="#C5B4CF"/>
      <rect x="502" y="34" width="224" height="272" fill="#EFE6D8" stroke="#C5B4CF"/>
      <line x1="263" y1="24" x2="263" y2="316" stroke="#A81E52" stroke-dasharray="4 4"/>
      <line x1="497" y1="24" x2="497" y2="316" stroke="#A81E52" stroke-dasharray="4 4"/>
      <text x="58" y="74" fill="#1D0B2E" font-size="14" font-weight="900" font-family="Noto Sans SC,sans-serif">第一折 · 序言</text>
      <text x="292" y="74" fill="#1D0B2E" font-size="14" font-weight="900" font-family="Noto Sans SC,sans-serif">第二折 · 展品群</text>
      <text x="526" y="74" fill="#1D0B2E" font-size="14" font-weight="900" font-family="Noto Sans SC,sans-serif">第三折 · 导览落点</text>
      <circle cx="628" cy="164" r="34" fill="#170627"/>
      <text x="628" y="168" text-anchor="middle" fill="#F3EADB" font-size="11.5" font-weight="700" font-family="Noto Sans SC,sans-serif">展厅定位</text>
    `,
    flow: `
      <path d="M 68 232 C 168 250, 224 128, 355 148 C 468 166, 510 218, 616 172" fill="none" stroke="#F16393" stroke-width="11" stroke-linecap="round"/>
      <circle cx="176" cy="196" r="9" fill="#A81E52"/>
      <circle cx="384" cy="154" r="10" fill="#F16393"/>
      <circle cx="628" cy="164" r="40" fill="none" stroke="#A81E52" stroke-width="2.5" stroke-dasharray="5 4"/>
    `,
  },
};

let activeXray = "landing";
const xrayRange = $("#xrayRange");
const xrayVal = $("#xrayVal");

function renderXray() {
  const sc = XRAY_SCENES[activeXray];
  const op = Number(xrayRange.value) / 100;
  xrayVal.textContent = `${xrayRange.value}%`;
  $("#xrayCaption").innerHTML = sc.caption;
  $("#xraySvg").innerHTML = `
    ${sc.base}
    <g opacity="${op.toFixed(2)}">${sc.flow}</g>
  `;
}

$$("[data-xray]").forEach((btn) =>
  btn.addEventListener("click", () => {
    activeXray = btn.dataset.xray;
    $$("[data-xray]").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-selected", String(a));
    });
    renderXray();
  })
);
xrayRange.addEventListener("input", renderXray);
renderXray();

// ============================================================================
// 7. Section 06: 禁用边界实景切换
// ============================================================================
$$("[data-misuse]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const wavy = btn.dataset.misuse === "wavy";
    $$("[data-misuse]").forEach((b) => b.classList.toggle("is-active", b === btn));
    $("#misuseDemos").classList.toggle("is-wavy", wavy);
    const st = $("#misuseStatus");
    st.textContent = wavy
      ? "当前：硬套流动弯排（扫码与对比速度明显下降）"
      : "当前：切回规整对齐（列线笔直、行首稳固，扫读无阻）";
    st.classList.toggle("is-ok", !wavy);
    st.classList.toggle("is-err", wavy);
    $("#verdictA").textContent = wavy
      ? "各行左右错位成 S 波后，人眼无法沿同一条垂直列线比价格，必须逐行来回折返核对。"
      : "所有价格与起飞时间严丝合缝对齐在同一竖列，眼球一次垂直下扫即可瞬间锁出最低价。";
    $("#verdictB").textContent = wavy
      ? "左缘不断波浪摆动破坏了换行回扫锚点；流动感适合标题、导图与区块动线，绝不该拿正文行首去凑曲线。"
      : "左对齐基准线稳如标尺，换行回扫不再犹豫；正文老老实实排齐，把流动留给大图与跨区节奏。";
  })
);

// ============================================================================
// 8. Section 07: 四选一练习（中性标签、单变量区分）
// ============================================================================
function renderQuizThumbnails() {
  const baseHeader = `
    <rect width="240" height="260" fill="#170627"/>
    <text x="18" y="34" fill="#F8F5FA" font-size="14" font-weight="900" font-family="Noto Sans SC,sans-serif">夜色诗展</text>
    <text x="18" y="50" fill="#D7CAE2" font-size="9" font-family="Space Mono,monospace">OCT 18 — NOV 24</text>
    <circle cx="192" cy="56" r="24" fill="#F3EADB"/>
  `;
  // A: 折角硬拐 + 断口
  $("#quizSvgA").innerHTML = `${baseHeader}
    <path d="M 10 248 L 96 226 L 66 156" fill="none" stroke="#F16393" stroke-width="11" stroke-linejoin="miter"/>
    <path d="M 142 146 L 182 114 L 188 76" fill="none" stroke="#F16393" stroke-width="11" stroke-linejoin="miter"/>
    <circle cx="72" cy="212" r="7" fill="#F16393"/><circle cx="152" cy="120" r="7" fill="#F16393"/>`;
  // B: 过密三连急弯蛇行（平滑但往复甩动过频）
  $("#quizSvgB").innerHTML = `${baseHeader}
    <path d="M 10 248 C 90 250, 146 236, 146 218 C 146 196, 54 202, 54 176 C 54 150, 174 158, 174 128 C 174 102, 114 106, 134 86 C 148 72, 172 72, 184 70" fill="none" stroke="#F16393" stroke-width="10" stroke-linecap="round"/>
    <circle cx="118" cy="212" r="6" fill="#F16393"/><circle cx="96" cy="166" r="6" fill="#F16393"/><circle cx="144" cy="116" r="6" fill="#F16393"/>`;
  // C (正确): 顺滑大 S 曲线 + 错落拍点 + 切线入月
  $("#quizSvgC").innerHTML = `${baseHeader}
    <path d="M 8 250 C 78 228, 86 196, 86 172 C 86 140, 152 144, 174 114 C 186 96, 172 80, 186 72" fill="none" stroke="#F16393" stroke-width="11" stroke-linecap="round"/>
    <path d="M 18 232 C 74 206, 68 156, 118 128 C 164 106, 158 76, 174 62" fill="none" stroke="#F95D92" stroke-width="1.4" stroke-dasharray="4 4"/>
    <circle cx="52" cy="214" r="8" fill="#F16393"/><circle cx="114" cy="128" r="7" fill="#F16393"/><circle cx="158" cy="96" r="6" fill="#F16393"/>`;
  // D: 同样顺滑，但终点切线溜向顶边（避开左上文字），拍点扎堆起步
  $("#quizSvgD").innerHTML = `${baseHeader}
    <path d="M 8 250 C 90 232, 136 200, 128 156 C 120 112, 142 84, 132 14" fill="none" stroke="#F16393" stroke-width="11" stroke-linecap="round"/>
    <circle cx="48" cy="224" r="7" fill="#F16393"/><circle cx="68" cy="214" r="7" fill="#F16393"/><circle cx="88" cy="202" r="7" fill="#F16393"/>`;
}

const QUIZ_EXPLAIN = {
  A: {
    ok: false,
    text: "选了方案 A：它虽然大致朝向明月，但中途有生硬折角，还裂开一段明显断口。人眼碰到尖角会急刹，遇到断口容易掉线，破坏了「曲线引导」与「连绵不断」。",
  },
  B: {
    ok: false,
    text: "选了方案 B：它确实连到了明月，也很「弯」，但弯曲比远超经验甜区，连续三道急弯让视线在画面中部反复左右折返发晕，反而拖慢了抵达焦点的速度。",
  },
  C: {
    ok: true,
    text: "答对了，正是方案 C！它在弯曲适度的单大 S 弧里同时满足了四件事：曲率全程平顺无硬折、丝带连绵不断、沿途拍点错落呼应、末端切线与虚线稳稳交汇右上象牙明月。",
  },
  D: {
    ok: false,
    text: "选了方案 D：它的线条同样顺滑，很容易迷惑第一眼。但仔细看上段——曲线末尾向左溜向顶边，把右上明月彻底晾在一旁，同时拍点全挤在左下，失了张弛与收束。",
  },
};

renderQuizThumbnails();

$$(".quiz-card").forEach((card) =>
  card.addEventListener("click", () => {
    const ch = card.dataset.choice;
    const res = QUIZ_EXPLAIN[ch];
    $$(".quiz-card").forEach((c) => {
      const picked = c === card;
      c.setAttribute("aria-checked", String(picked));
      c.classList.remove("is-picked-ok", "is-picked-err");
      if (picked) c.classList.add(res.ok ? "is-picked-ok" : "is-picked-err");
    });
    const fb = $("#quizFeedback");
    fb.classList.toggle("is-ok", res.ok);
    fb.classList.toggle("is-err", !res.ok);
    fb.innerHTML = `<p><strong>${res.ok ? "判断准确" : "差了一点"}：</strong>${res.text}</p>`;
  })
);

// ============================================================================
// 9. Section 08: 原海报灯箱（复用 #poster.src、支持缩放/拖动/Esc 关闭）
// ============================================================================
const lightbox = $("#lightbox");
const lbImg = $("#lbImg");
const lbStage = $("#lbStage");
const lbScale = $("#lbScale");
let lbState = { scale: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.tx}px, ${lbState.ty}px) scale(${lbState.scale})`;
  lbScale.textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbState = { scale: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0 };
  applyLbTransform();
  lightbox.hidden = false;
  $("#lbClose").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  $("#posterOpenBtn").focus();
}

$("#posterOpenBtn").addEventListener("click", openLightbox);
$("#lbClose").addEventListener("click", closeLightbox);
$("#lbZoomIn").addEventListener("click", () => {
  lbState.scale = Math.min(3, +(lbState.scale + 0.25).toFixed(2));
  applyLbTransform();
});
$("#lbZoomOut").addEventListener("click", () => {
  lbState.scale = Math.max(0.75, +(lbState.scale - 0.25).toFixed(2));
  applyLbTransform();
});
$("#lbReset").addEventListener("click", () => {
  lbState.scale = 1;
  lbState.tx = 0;
  lbState.ty = 0;
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (ev) => {
  if (ev.target === lbStage) {
    closeLightbox();
    return;
  }
  lbState.dragging = true;
  lbState.sx = ev.clientX - lbState.tx;
  lbState.sy = ev.clientY - lbState.ty;
  if (lbStage.setPointerCapture) {
    try {
      lbStage.setPointerCapture(ev.pointerId);
    } catch {}
  }
});
lbStage.addEventListener("pointermove", (ev) => {
  if (!lbState.dragging) return;
  lbState.tx = ev.clientX - lbState.sx;
  lbState.ty = ev.clientY - lbState.sy;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbState.dragging = false;
});
lbStage.addEventListener("pointercancel", () => {
  lbState.dragging = false;
});
lbStage.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 0.15 : -0.15;
    lbState.scale = Math.max(0.75, Math.min(3, +(lbState.scale + delta).toFixed(2)));
    applyLbTransform();
  },
  { passive: false }
);

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !lightbox.hidden) {
    ev.preventDefault();
    closeLightbox();
  }
});

// 窗口尺寸变化时重绘两块画布
window.addEventListener("resize", () => {
  heroLoop.draw();
  curvLoop.draw();
});
