// 204 极坐标网格 · 主控脚本（连接单真源模型、英雄测绘台、正文 01–07 互动实验与原海报灯箱）
import { loop, reducedMotion } from "../../lib/stage.js";
import {
  QUIZ_OPTIONS,
  THEMES,
  createBrokenState,
  createPresetState,
  evaluateAreaLab,
  evaluateDecision,
  evaluatePolar,
  normDeg,
} from "./model.js";
import { createHeroPolarRenderer, invalidateCanvasSize, renderCartesianStrip } from "./heroCanvas.js";
import {
  createMorphLab,
  renderAppInstrument,
  renderAreaLabCanvas,
  renderHistorySketch,
} from "./labs.js";

// ==================== 1. 开场极坐标蓝图测绘台 ====================
let state = createBrokenState("poster");
let evalCache = evaluatePolar(state);
let heroIntro = 0;
let heroDirty = true;
let uiDirty = false;
let lastUnrollKey = "";

const setText = (el, txt) => {
  if (el.textContent !== txt) el.textContent = txt;
};

const polarCanvas = document.getElementById("hero-polar-canvas");
const unrollCanvas = document.getElementById("hero-unroll-canvas");
const rootStyle = document.documentElement.style;

const els = {
  statusPill: document.getElementById("hero-status-pill"),
  probeTag: document.getElementById("title-probe-tag"),
  stageAxisChip: document.getElementById("stage-axis-chip"),
  valRadius: document.getElementById("val-radius"),
  valSector: document.getElementById("val-sector"),
  valAngle: document.getElementById("val-angle"),
  valRings: document.getElementById("val-rings"),
  unrollMeta: document.getElementById("unroll-meta"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagHint: document.getElementById("diag-hint"),
  mAxis: document.getElementById("m-axis"),
  mChord: document.getElementById("m-chord"),
  mRingGap: document.getElementById("m-ringgap"),
  mScaleLbl: document.getElementById("m-scale-lbl"),
  mScale: document.getElementById("m-scale"),
  zeroRange: document.getElementById("zero-angle-range"),
  zeroOut: document.getElementById("zero-angle-out"),
  clOrigin: document.getElementById("cl-origin"),
  clAngle: document.getElementById("cl-angle"),
  clRadius: document.getElementById("cl-radius"),
  clSector: document.getElementById("cl-sector"),
  pillOrigin: document.getElementById("pill-origin"),
  pillAngle: document.getElementById("pill-angle"),
  pillRadius: document.getElementById("pill-radius"),
  pillSector: document.getElementById("pill-sector"),
  eqC2P: document.getElementById("eq-c2p"),
  eqP2C: document.getElementById("eq-p2c"),
};

function fmtSigned(v) {
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;
}

function syncHeroUI(skipUnroll = false) {
  evalCache = evaluatePolar(state);
  const ev = evalCache;
  const { checks, diagnosis, probe, compare, metrics } = ev;

  // CSS 自定义属性联动：标题下青色比例尺杠 + 右上圆形虚线印章旋转角
  rootStyle.setProperty("--r-ratio", probe.rNorm.toFixed(3));
  rootStyle.setProperty("--zero-deg", ev.zero.toFixed(1));

  // 刊头状态与实时 P(r, θ)
  setText(els.statusPill, diagnosis.badgeText);
  els.statusPill.classList.toggle("is-ok", checks.passedCount === 4);
  els.statusPill.classList.toggle("is-err", checks.passedCount < 4);
  setText(els.probeTag, `P(${probe.rUnits.toFixed(1)}, ${Math.round(probe.localDeg)}°)`);
  els.stageAxisChip.classList.toggle("is-ok", checks.axisOk);
  els.stageAxisChip.classList.toggle("is-err", !checks.axisOk);
  setText(
    els.stageAxisChip,
    checks.axisOk
      ? `极轴已对正：${checks.axisConvention} · 拖红点测绘坐标`
      : `极轴偏转 ${Math.round(ev.zero)}° · 空白处横拖归正`,
  );

  // 四隅原海报角签
  setText(els.valRadius, `r = ${probe.rUnits.toFixed(2)} / ${ev.K}`);
  setText(
    els.valSector,
    ev.theme.encoding === "sectors"
      ? `面积 ${compare.drawnAreaRatio.toFixed(1)}× (真 ${compare.trueRatio.toFixed(1)}×)`
      : `航距 ${compare.drawnRadiusRatio.toFixed(2)}× (真 ${compare.trueRatio.toFixed(1)}×)`,
  );
  setText(els.valAngle, `${ev.N} 路 · ${ev.stepDeg.toFixed(1)}°`);
  setText(els.valRings, `${ev.K} 环 · ${Math.round(metrics.ringGapPx)}px`);

  // 直角展开说明
  const sel = ev.selectedItem;
  setText(els.unrollMeta, `选中 ${sel.label} (${sel.value}${ev.theme.unit}) · 青柱 = 真值 / 红杠 = 映射`);

  // 诊单主卡
  els.diagCard.classList.toggle("is-ok", checks.passedCount === 4);
  els.diagCard.classList.toggle("is-err", checks.passedCount < 4);
  setText(els.diagBadge, diagnosis.badgeText);
  setText(els.diagHeadline, diagnosis.headline);
  setText(els.diagBody, diagnosis.body);
  setText(els.diagHint, diagnosis.nextHint);

  setText(els.mAxis, checks.axisConvention);
  setText(els.mChord, `${Math.round(metrics.innerChordPx)}px`);
  setText(els.mRingGap, `${Math.round(metrics.ringGapPx)}px`);
  setText(els.mScaleLbl, ev.theme.encoding === "sectors" ? "面积比 / 真实" : "航距比 / 真实");
  setText(
    els.mScale,
    ev.theme.encoding === "sectors"
      ? `${compare.drawnAreaRatio.toFixed(1)}× / ${compare.trueRatio.toFixed(1)}×`
      : `${compare.drawnRadiusRatio.toFixed(2)}× / ${compare.trueRatio.toFixed(1)}×`,
  );

  // 控件状态同步（连续拖拽中按钮集合未变，跳过 querySelectorAll 省掉遍历开销）
  const zStr = String(Math.round(ev.zero));
  if (els.zeroRange.value !== zStr) els.zeroRange.value = zStr;
  setText(els.zeroOut, `${zStr}°`);

  if (!skipUnroll) {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      const on = b.dataset.theme === state.theme;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll("#div-group .seg-btn").forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.div) === state.divisions);
    });
    document.querySelectorAll("#ring-group .seg-btn").forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.ring) === state.rings);
    });
    document.querySelectorAll("#scale-group .seg-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.scale === state.scaleMode);
    });
    document.querySelectorAll(".legend-btn").forEach((b) => {
      const on = !!state.layers[b.dataset.layer];
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  // 原海报 4 栏核心逻辑实况状态
  els.clOrigin.classList.toggle("is-ok", checks.axisOk && state.scaleMode !== "truncated");
  setText(
    els.pillOrigin,
    state.scaleMode === "truncated" ? "基线悬空" : checks.axisOk ? checks.axisConvention : `歪斜 ${zStr}°`,
  );

  els.clAngle.classList.toggle("is-ok", checks.angleOk);
  setText(els.pillAngle, checks.angleOk ? `${ev.N} 路正交` : ev.N >= 18 ? "圆心挤死" : `${ev.N} 路非正交`);

  els.clRadius.classList.toggle("is-ok", checks.ringsOk);
  setText(els.pillRadius, checks.ringsOk ? `${ev.K} 环清晰` : ev.K >= 8 ? `${ev.K} 环过密` : `${ev.K} 环过粗`);

  els.clSector.classList.toggle("is-ok", checks.scaleOk);
  setText(
    els.pillSector,
    checks.scaleOk
      ? "误差 0%"
      : `${compare.scaleDistortionPct >= 0 ? "+" : ""}${Math.round(compare.scaleDistortionPct)}% 偏差`,
  );

  // 原海报最底栏实时坐标换算公式
  setText(els.eqC2P, `r = √(x² + y²) = ${probe.checkR.toFixed(2)} · θ = atan2(y, x) = ${Math.round(probe.checkDeg)}°`);
  setText(els.eqP2C, `x = r cos θ = ${fmtSigned(probe.x)} · y = r sin θ = ${fmtSigned(probe.y)}`);

  const unrollKey = `${state.theme}|${state.divisions}|${state.rings}|${state.scaleMode}|${state.selectedIndex}|${Math.round(probe.localDeg)}|${probe.rNorm.toFixed(2)}`;
  if (!skipUnroll && unrollKey !== lastUnrollKey) {
    lastUnrollKey = unrollKey;
    renderCartesianStrip(unrollCanvas, ev, state);
  }
}

const heroRenderer = createHeroPolarRenderer(polarCanvas, (action) => {
  if (action.type === "getState") return state;
  if (action.type === "probe") {
    state = { ...state, probe: { rNorm: action.rNorm, thetaDeg: action.thetaDeg } };
  } else if (action.type === "rotateZero") {
    state = { ...state, zeroAngle: action.zeroAngle };
    evalCache = evaluatePolar(state);
    heroDirty = true;
    uiDirty = true;
    if (reducedMotion.matches) heroLoop.draw();
    return; // 拖动手势合并到下一帧 rAF 单次绘制，避免 touchmove 与 rAF 双重绘制和同步回流
  } else if (action.type === "snapZero") {
    // 仅在靠近 0° 或 90° ±2° 时轻柔吸附，绝不强拉远角
    const z = normDeg(state.zeroAngle);
    if (z <= 2 || z >= 358) state = { ...state, zeroAngle: 0 };
    else if (Math.abs(z - 90) <= 2) state = { ...state, zeroAngle: 90 };
  } else if (action.type === "selectSector") {
    const item = evalCache.items[action.index];
    state = {
      ...state,
      selectedIndex: action.index,
      probe: item ? { rNorm: Math.max(0.15, item.rNorm), thetaDeg: item.angleDeg } : state.probe,
    };
  }
  heroDirty = true;
  syncHeroUI();
  heroLoop.draw();
});

const heroLoop = loop(polarCanvas, (t, dt, { still }) => {
  const animatingIntro = !still && heroIntro < 1;
  if (still) {
    heroIntro = 1;
    heroDirty = true;
  } else if (animatingIntro) {
    heroIntro = Math.min(1, heroIntro + Math.max(dt, 0.016) * 1.45);
    heroDirty = true;
  }
  if (uiDirty) {
    uiDirty = false;
    syncHeroUI(true);
  }
  const needRadarSweep = !still && state.theme === "radar" && state.layers.sector;
  if (!heroDirty && !needRadarSweep) return;
  heroDirty = false;
  heroRenderer.render(evalCache, state, still ? 0.5 : t, heroIntro);
});

function markHeroDirtyAndDraw() {
  heroDirty = true;
  syncHeroUI();
  heroLoop.draw();
}

// 键盘操作画布（方向键调极轴角与半径）
polarCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.shiftKey ? 15 : 1;
    state = { ...state, zeroAngle: normDeg(state.zeroAngle + (e.key === "ArrowRight" ? step : -step)) };
    markHeroDirtyAndDraw();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const delta = e.key === "ArrowUp" ? 0.05 : -0.05;
    state = {
      ...state,
      probe: { ...state.probe, rNorm: Math.max(0.12, Math.min(1, state.probe.rNorm + delta)) },
    };
    markHeroDirtyAndDraw();
  }
});

// 绑定开场全部控件
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextTheme = btn.dataset.theme;
    const tObj = THEMES[nextTheme];
    state = {
      ...state,
      theme: nextTheme,
      selectedIndex: 0,
      probe: { ...tObj.defaultProbe },
    };
    markHeroDirtyAndDraw();
  });
});

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = createPresetState(btn.dataset.preset, state.theme);
    markHeroDirtyAndDraw();
  });
});

document.querySelectorAll(".legend-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    state = { ...state, layers: { ...state.layers, [k]: !state.layers[k] } };
    markHeroDirtyAndDraw();
  });
});

els.zeroRange.addEventListener("input", () => {
  state = { ...state, zeroAngle: Number(els.zeroRange.value) };
  markHeroDirtyAndDraw();
});

document.querySelectorAll(".mini-btn[data-zero]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, zeroAngle: Number(btn.dataset.zero) };
    markHeroDirtyAndDraw();
  });
});

document.querySelectorAll("#div-group .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, divisions: Number(btn.dataset.div) };
    markHeroDirtyAndDraw();
  });
});

document.querySelectorAll("#ring-group .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, rings: Number(btn.dataset.ring) };
    markHeroDirtyAndDraw();
  });
});

document.querySelectorAll("#scale-group .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, scaleMode: btn.dataset.scale };
    markHeroDirtyAndDraw();
  });
});

syncHeroUI();

// ==================== 2. 01 节：四部件解剖互动 ====================
const ANAT_CAPTIONS = {
  radius: "<strong>聚焦：半径 r</strong> — 从唯一圆心出发的直线距离，决定层级位置；填色扇区与纯点位对 r 的缩放律不同。",
  angle: "<strong>聚焦：角度 θ</strong> — 每条射线代表一个方向基准；8 路（45°）或 12 路（30°）能守住 0°/90°/180°/270° 四正交主轴。",
  sector: "<strong>聚焦：扇区 A</strong> — 由两条角线和半径围合的单元格；同一角度跨度下，外环扇区面积比内环宽得多。",
  circles: "<strong>聚焦：同心层级 K</strong> — 等步同心圆构成标尺；4–6 道环让近、中、外递进层级一眼可读。",
};
const anatCaption = document.getElementById("anatomy-caption");
document.querySelectorAll(".anat-card").forEach((card) => {
  card.addEventListener("click", () => {
    const part = card.dataset.part;
    document.querySelectorAll(".anat-card").forEach((c) => {
      const on = c === card;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll(".av-layer").forEach((g) => {
      g.classList.toggle("is-focus", g.dataset.av === part);
    });
    anatCaption.innerHTML = ANAT_CAPTIONS[part];
  });
});

// ==================== 3. 02 节：面积陷阱双盘对照 ====================
const areaCanvas = document.getElementById("area-lab-canvas");
const areaSlider = document.getElementById("area-ratio-slider");
const areaValEl = document.getElementById("area-ratio-val");
const areaReadout = document.getElementById("area-readout");
let areaRatio = 2.0;
let areaFocus = "both";

function updateAreaLab() {
  const lin = evaluateAreaLab(areaRatio, "linear");
  const sq = evaluateAreaLab(areaRatio, "sqrt");
  areaValEl.textContent = `${areaRatio.toFixed(1)}×`;
  areaReadout.innerHTML = `数据真实差 <strong>${areaRatio.toFixed(1)}×</strong>：误用线性半径（r ∝ v）时，扇区 A 的填色面积变成 B 的 <strong>${lin.areaRatio.toFixed(2)}×</strong>（视觉夸大 +${Math.round(lin.errorPct)}%）；改用南丁格尔平方根法（r ∝ √v）后，半径缩为 <strong>${sq.radiusRatio.toFixed(2)}×</strong>，色块面积正好等于 <strong>${sq.areaRatio.toFixed(2)}×</strong>（0% 误差）。`;
  renderAreaLabCanvas(areaCanvas, areaRatio, areaFocus);
}
areaSlider.addEventListener("input", () => {
  areaRatio = Number(areaSlider.value);
  updateAreaLab();
});
document.querySelectorAll(".area-focus-btns .light-seg").forEach((btn) => {
  btn.addEventListener("click", () => {
    areaFocus = btn.dataset.afocus;
    document.querySelectorAll(".area-focus-btns .light-seg").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateAreaLab();
  });
});

// ==================== 4. 03 节：直角 ↔ 极坐标拓扑卷绕暗室 ====================
const morphCanvas = document.getElementById("morph-canvas");
const morphSlider = document.getElementById("morph-slider");
const morphPctEl = document.getElementById("morph-pct");
const mrPolar = document.getElementById("mr-polar");
const mrCart = document.getElementById("mr-cart");
const mrNote = document.getElementById("mr-note");
let morphVal = 0.68;
let traceKind = "wave";
let morphPin = { u: 0.25, v: 0.6 };

const TRACE_NOTES = {
  wave: "周期波在直角展开时被硬切成左端 0° 和右端 360° 两截；拉到 100% 卷绕闭合后，断口彻底消失——这就是气象、潮汐和 24 小时节律天然适合极坐标的几何原因。",
  circle: "直角坐标里的平直水平线 y = 3.0，卷绕到 100% 时恰好变成以圆心为基准的同心圆 r = 3.0；所有等距点到中心的距离完全相等。",
  spiral: "直角坐标里一条普通的斜直线（r 随 θ 线性增加），卷绕到极坐标后立刻化作阿基米德螺线——伯努利与牛顿正是靠它简化了复杂曲线的微积分。",
};

const morphLab = createMorphLab(morphCanvas, (u, v) => {
  morphPin = { u, v };
  updateMorphUI();
});

function updateMorphUI() {
  const pct = Math.round(morphVal * 100);
  const stageName = pct === 0 ? "直角展开" : pct === 100 ? "极坐标闭合" : "卷绕中";
  morphPctEl.textContent = `${pct}% · ${stageName}`;
  morphSlider.value = String(pct);

  const r = morphPin.v * 5;
  const deg = Math.round(morphPin.u * 360) % 360;
  const rad = (deg * Math.PI) / 180;
  const x = r * Math.cos(rad);
  const y = r * Math.sin(rad);
  mrPolar.textContent = `极坐标：r = ${r.toFixed(2)} · θ = ${deg}°`;
  mrCart.textContent = `直角坐标：x = ${fmtSigned(x)} · y = ${fmtSigned(y)}`;
  mrNote.textContent = TRACE_NOTES[traceKind];
  morphLab.render(morphVal, traceKind, morphPin);
}

morphSlider.addEventListener("input", () => {
  morphVal = Number(morphSlider.value) / 100;
  updateMorphUI();
});
document.querySelectorAll(".morph-quick .mini-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    morphVal = Number(btn.dataset.morph) / 100;
    updateMorphUI();
  });
});
document.querySelectorAll("#trace-group .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    traceKind = btn.dataset.trace;
    document.querySelectorAll("#trace-group .seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateMorphUI();
  });
});

// ==================== 5. 04 节：四大应用场景实时仪器 ====================
const APP_DATA = {
  radar: {
    theta: "θ = 方位角（北向 0° 顺时针）",
    r: "r = 线性航距（km）",
    title: "雷达平面位置显示器：本机即圆心",
    desc: "飞机、舰船或气象雷达站在圆心不动，旋转天线以 360° 扫描周边空间。回波目标以孤立光点标示，没有填色扇区面积，因此半径 r 严格按线性比例对应真实直线距离，让操作员一眼估出拦截方位与剩余航程。",
    mainLbl: "标准空域回波",
    altLbl: "繁忙进近空域",
  },
  wind: {
    theta: "θ = 来风方位（8 / 16 罗盘方位）",
    r: "r = √(风频)，守恒扇区面积",
    title: "风玫瑰气象图：方位与强弱一次读完",
    desc: "建筑选址、机场跑道规划和环境监测都需要知道主导风向。极坐标把 8 或 16 个罗盘方位直接摆在真实方向上，扇区面积按平方根半径忠实呈现各方向出现频次。",
    mainLbl: "冬季西北季风",
    altLbl: "夏季东南季风",
  },
  clock: {
    theta: "θ = 24 小时昼夜循环（0h = 24h）",
    r: "r = √(活跃度)，消除跨午夜断层",
    title: "周期数据可视化：把午夜断口接回圆环",
    desc: "线性柱状图会把 23 点和次日 0 点拆到画布最右与最左两头，切断夜间连续峰。极坐标让时间绕圆闭合，凌晨与深夜的峰值连成一整片清晰扇群。",
    mainLbl: "夜间阅读单峰",
    altLbl: "早晚通勤双峰",
  },
  coverage: {
    theta: "θ = 拾音 / 辐射方向角",
    r: "r(θ) = 信号增益灵敏度",
    title: "声场指向性与天线覆盖：方向本身就是规律",
    desc: "麦克风的心形指向（r = 0.5 + 0.5 cos θ）或偶极天线的 8 字波瓣，本身就是极坐标方程的几何图像。任何方向衰减多少分贝，一落盘就一目了然。",
    mainLbl: "心形指向 r = ½(1+cosθ)",
    altLbl: "8 字双指向 r = |cosθ|",
  },
};

const appCanvas = document.getElementById("app-canvas");
const appBindTheta = document.getElementById("app-bind-theta");
const appBindR = document.getElementById("app-bind-r");
const appTitle = document.getElementById("app-title");
const appDesc = document.getElementById("app-desc");
const appSubMain = document.getElementById("app-sub-main");
const appSubAlt = document.getElementById("app-sub-alt");
let curApp = "radar";
let curSub = "main";

function syncAppCopy() {
  const d = APP_DATA[curApp];
  appBindTheta.textContent = d.theta;
  appBindR.textContent = d.r;
  appTitle.textContent = d.title;
  appDesc.textContent = d.desc;
  appSubMain.textContent = d.mainLbl;
  appSubAlt.textContent = d.altLbl;
  appSubMain.classList.toggle("is-active", curSub === "main");
  appSubAlt.classList.toggle("is-active", curSub === "alt");
}

const appLoop = loop(appCanvas, (t, _dt, { still }) => {
  renderAppInstrument(appCanvas, curApp, curSub, still ? 0.6 : t);
});

document.querySelectorAll(".app-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    curApp = btn.dataset.app;
    curSub = "main";
    document.querySelectorAll(".app-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    syncAppCopy();
    appLoop.draw();
  });
});

document.querySelectorAll(".app-switch-row .light-seg").forEach((btn) => {
  btn.addEventListener("click", () => {
    curSub = btn.dataset.sub;
    syncAppCopy();
    appLoop.draw();
  });
});
syncAppCopy();

// ==================== 6. 05 节：历史演进档案 ====================
const HISTORY_DATA = {
  bernoulli: {
    year: "1671（1736 刊印）& 1691",
    title: "从解析曲线走向公开坐标系",
    body: "艾萨克·牛顿约在 1671 年撰写的《流数法》手稿中就构想了包括极坐标在内的十种曲线定位法，但迟至 1736 年才出版。1691 年，瑞士数学家雅各布·伯努利在《博学者学报》发表论文，用「极点」与「极轴」系统研究对数螺线，使极坐标进入公开数学界；18 世纪意大利数学家格雷戈里奥·丰塔纳进一步确立了「极坐标」这一名称。",
  },
  nightingale: {
    year: "1858",
    title: "南丁格尔极区面积图与平方根铁律",
    body: "克里米亚战争后，弗洛伦斯·南丁格尔在 1858 年报告《关于影响英军健康、效率与医院管理的若干事项》中附上两幅 12 月份极区面积图，用蓝色大扇区向英国政界直观证明：绝大多数士兵死于可预防疫病而非战伤。她在图注中特别写明各扇区均以圆心为公共顶点、按面积而非半径度量——即半径按数值开平方（r ∝ √v），至今仍是极坐标信息设计的诚实准则。",
  },
  ppi: {
    year: "1940 — 1941",
    title: "平面位置显示器（PPI）定型圆形雷达界面",
    body: "早期雷达只能把回波显示在一条水平基线上，操作员得手动换算方位。1940 至 1941 年间，英国电信研究院（TRE）与美国麻省理工学院辐射实验室将旋转天线的方位角 θ 与脉冲测距 r 同步映射到阴极射线管圆形屏上，造出俯视地图般的平面位置显示器（PPI），让极坐标从纸面计算跃升为实时空间仪表。",
  },
  perception: {
    year: "1984 & 2010",
    title: "用实证实验划定极坐标的能力边界",
    body: "1984 年，William S. Cleveland 与 Robert McGill 在《美国统计学会会刊》（JASA）通过受控实验指出：人眼判断「公共基准线上的位置」最准，判断「角度」与「面积」的误差明显更高。2010 年，Stephan Diehl、Fabian Beck 与 Michael Burch 在 IEEE TVCG 发表含 674 名受试者的研究，证实直角可视化在阅读速度与空间记忆上整体胜过极坐标/放射排布，而极坐标的价值在于突出周期连续性与聚焦单一维度。",
  },
};

const historyCanvas = document.getElementById("history-canvas");
const historyCopy = document.getElementById("history-copy");
let curEra = "bernoulli";

function syncHistory() {
  const d = HISTORY_DATA[curEra];
  historyCopy.innerHTML = `<span class="hc-year">${d.year}</span><h3>${d.title}</h3><p>${d.body}</p>`;
  renderHistorySketch(historyCanvas, curEra);
}
document.querySelectorAll(".era-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    curEra = btn.dataset.era;
    document.querySelectorAll(".era-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    syncHistory();
  });
});

// ==================== 7. 06 节：工况勾选诊断器 ====================
const decChecks = {
  cyclic: document.getElementById("chk-cyclic"),
  precision: document.getElementById("chk-precision"),
  longText: document.getElementById("chk-longtext"),
  manyCats: document.getElementById("chk-manycats"),
};
const drBox = document.getElementById("decision-result");
const drBadge = document.getElementById("dr-badge");
const drTitle = document.getElementById("dr-title");
const drReason = document.getElementById("dr-reason");
const drAlt = document.getElementById("dr-alt");

function syncDecision() {
  const res = evaluateDecision({
    cyclic: decChecks.cyclic.checked,
    precision: decChecks.precision.checked,
    longText: decChecks.longText.checked,
    manyCats: decChecks.manyCats.checked,
  });
  drBox.className = `decision-result is-${res.tone}`;
  drBadge.textContent = res.verdict;
  drTitle.textContent = res.title;
  drReason.textContent = res.reason;
  const linkHtml = res.links
    .map((l) => `<a href="https://layout.xiaoxiaodong.ai/${l.id}/play/">${l.name}</a>`)
    .join("、");
  drAlt.innerHTML = `${res.alt.split("推荐")[0] ? "" : ""}可对照查阅：${linkHtml}`;
}
Object.values(decChecks).forEach((el) => el.addEventListener("change", syncDecision));
syncDecision();

// ==================== 8. 07 节：小练习四选一（纯 SVG 单变量对照） ====================
function buildQuizSVG(opt) {
  const cx = 80;
  const cy = 80;
  const R = 60;
  const N = opt.divisions;
  const r0 = opt.scaleMode === "truncated" ? 0.4 * R : 0;
  const rNW = opt.scaleMode === "sqrt" ? R * 0.92 : opt.scaleMode === "linear" ? R * 0.92 : r0 + 0.55 * R;
  const rSE = opt.scaleMode === "sqrt" ? rNW / 2 : opt.scaleMode === "linear" ? rNW / 4 : r0 + 0.55 * R * 0.25;
  const half = Math.PI / Math.max(8, N);

  const sectorPath = (deg, rOut) => {
    const a = (deg * Math.PI) / 180;
    const a1 = a - half;
    const a2 = a + half;
    const x1 = cx + Math.cos(a1) * rOut;
    const y1 = cy - Math.sin(a1) * rOut;
    const x2 = cx + Math.cos(a2) * rOut;
    const y2 = cy - Math.sin(a2) * rOut;
    if (r0 > 0) {
      const ix1 = cx + Math.cos(a2) * r0;
      const iy1 = cy - Math.sin(a2) * r0;
      const ix2 = cx + Math.cos(a1) * r0;
      const iy2 = cy - Math.sin(a1) * r0;
      return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${rOut.toFixed(1)} ${rOut.toFixed(1)} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)} L${ix1.toFixed(1)} ${iy1.toFixed(1)} A${r0.toFixed(1)} ${r0.toFixed(1)} 0 0 1 ${ix2.toFixed(1)} ${iy2.toFixed(1)} Z`;
    }
    return `M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${rOut.toFixed(1)} ${rOut.toFixed(1)} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
  };

  let rays = "";
  for (let i = 0; i < N; i++) {
    const a = (i * Math.PI * 2) / N;
    const isCard = Math.abs(((i * 360) / N) % 90) < 0.01;
    rays += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R).toFixed(1)}" y2="${(cy - Math.sin(a) * R).toFixed(1)}" stroke="${isCard ? "#1BCBFF" : "rgba(244,246,248,0.34)"}" stroke-width="${isCard ? 1.2 : 0.8}" ${isCard ? "" : 'stroke-dasharray="3 3"'}/>`;
  }
  const rings = [1, 2, 3, 4]
    .map((k) => `<circle cx="${cx}" cy="${cy}" r="${(R * k) / 4}" fill="none" stroke="rgba(92,134,178,0.4)" stroke-width="0.9"/>`)
    .join("");
  const innerRing = r0 > 0 ? `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="#000B19" stroke="#1BCBFF" stroke-dasharray="3 2" stroke-width="1"/>` : "";

  return `<svg viewBox="0 0 160 160" aria-hidden="true">
    ${rings}${rays}${innerRing}
    <path d="${sectorPath(135, rNW)}" fill="rgba(252,55,130,0.46)" stroke="#FC3782" stroke-width="1.4"/>
    <path d="${sectorPath(315, rSE)}" fill="rgba(27,203,255,0.42)" stroke="#1BCBFF" stroke-width="1.4"/>
    <circle cx="${cx}" cy="${cy}" r="2.8" fill="#F4F6F8"/>
    <text x="14" y="22" fill="#FF84B4" font-size="10" font-family="IBM Plex Mono, monospace">NW 40</text>
    <text x="108" y="148" fill="#1BCBFF" font-size="10" font-family="IBM Plex Mono, monospace">SE 10</text>
  </svg>`;
}

const quizWrap = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
QUIZ_OPTIONS.forEach((opt) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "quiz-opt";
  btn.dataset.opt = opt.id;
  btn.setAttribute("role", "radio");
  btn.setAttribute("aria-checked", "false");
  btn.innerHTML = `${buildQuizSVG(opt)}<strong>${opt.label}</strong><span>${opt.spec}</span>`;
  btn.addEventListener("click", () => {
    quizWrap.querySelectorAll(".quiz-opt").forEach((b) => {
      b.classList.remove("is-picked-ok", "is-picked-no");
      b.setAttribute("aria-checked", "false");
    });
    btn.setAttribute("aria-checked", "true");
    btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-no");
    quizFeedback.className = `quiz-feedback ${opt.correct ? "is-ok" : "is-no"}`;
    quizFeedback.textContent = `${opt.label}：${opt.explain}`;
  });
  quizWrap.append(btn);
});

// ==================== 9. 原海报缩放拖拽灯箱 ====================
const posterImg = document.getElementById("poster");
const openBtn = document.getElementById("poster-open-btn");
const lightbox = document.getElementById("poster-lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbScaleEl = document.getElementById("lb-scale");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}
function resetLb() {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
}

openBtn.addEventListener("click", () => {
  if (!lbImg.src) lbImg.src = posterImg.src;
  resetLb();
  lightbox.showModal();
});
document.getElementById("lb-close").addEventListener("click", () => lightbox.close());
document.getElementById("lb-reset").addEventListener("click", resetLb);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3.5, lbScale + 0.35);
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.75, lbScale - 0.35);
  applyLbTransform();
});
lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = Math.max(0.75, Math.min(3.5, lbScale + (e.deltaY < 0 ? 0.18 : -0.18)));
    applyLbTransform();
  },
  { passive: false },
);
lbViewport.addEventListener("pointerdown", (e) => {
  lbDragging = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbViewport.setPointerCapture(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
const stopLbDrag = () => { lbDragging = false; };
lbViewport.addEventListener("pointerup", stopLbDrag);
lbViewport.addEventListener("pointercancel", stopLbDrag);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});

// ==================== 10. 尺寸变化时同步重绘静态实验室画布 ====================
function redrawStaticLabs() {
  renderCartesianStrip(unrollCanvas, evalCache, state);
  updateAreaLab();
  updateMorphUI();
  syncHistory();
}
redrawStaticLabs();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    invalidateCanvasSize(polarCanvas);
    invalidateCanvasSize(unrollCanvas);
    lastUnrollKey = "";
    heroDirty = true;
    redrawStaticLabs();
    heroLoop.draw();
    appLoop.draw();
  }, 80);
});
