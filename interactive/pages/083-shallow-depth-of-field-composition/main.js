// 083 浅景深构图 — 主交互控制与各节光学实验台绑定
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  APERTURE_STOPS,
  INITIAL_STATE,
  PRESETS,
  QUIZ_ROUNDS,
  clamp,
  computeEqualMagOptics,
  evaluateOptics,
  formatAperture,
  formatDist,
  formatDof,
} from "./model.js";
import {
  renderBokehLab,
  renderEraSpecimen,
  renderOpticalBench,
  renderOpticalFrame,
  renderSplitCompare,
  updateIrisSvg,
} from "./scene.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== HERO 状态与单真源渲染 ====================
const heroState = { ...INITIAL_STATE };
let heroEval = evaluateOptics(heroState);
let hoverPlane = null;
let heroTime = 0;
let heroDirty = true;
let lastIrisAperture = null;

const heroCanvas = $("#hero-canvas");
const rulerTrack = $("#ruler-track");
const irisSvg = $("#iris-svg");

// 距离标尺对数映射（0.55m — 10.0m），让近距推焦手感和真实手动对焦环一致
const MIN_DIST = 0.55;
const MAX_DIST = 10.0;
const distToRatio = (m) => {
  const c = clamp(m, MIN_DIST, MAX_DIST);
  return (Math.log(c) - Math.log(MIN_DIST)) / (Math.log(MAX_DIST) - Math.log(MIN_DIST));
};
const ratioToDist = (r) => {
  const t = clamp(r, 0, 1);
  return Math.exp(Math.log(MIN_DIST) + t * (Math.log(MAX_DIST) - Math.log(MIN_DIST)));
};

const closestApertureIndex = (ap) => {
  let best = 0;
  let diff = Infinity;
  APERTURE_STOPS.forEach((v, i) => {
    const d = Math.abs(v - ap);
    if (d < diff) {
      diff = d;
      best = i;
    }
  });
  return best;
};

// 仅在格式化值发生变化时写 DOM，保持高频拖动下的零抖动与高帧率
const domCache = new Map();
function setText(el, val) {
  if (!el) return;
  if (domCache.get(el) === val) return;
  domCache.set(el, val);
  el.textContent = val;
}

function drawHeroCanvas(t = heroTime) {
  if (!heroCanvas) return;
  const w = heroCanvas.clientWidth || 640;
  const h = heroCanvas.clientHeight || 400;
  // 手机窄屏按 GUIDE.md 控低像素比（≤1.25），桌面按 ≤1.5，兼顾清晰度与软件渲染帧率
  const dpr = w < 520 ? Math.min(window.devicePixelRatio || 1, 1.25) : pixelRatio(1.5);
  const pw = Math.max(1, Math.round(w * dpr));
  const ph = Math.max(1, Math.round(h * dpr));
  if (heroCanvas.width !== pw || heroCanvas.height !== ph) {
    heroCanvas.width = pw;
    heroCanvas.height = ph;
  }
  const ctx = heroCanvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  renderOpticalFrame(ctx, w, h, heroEval, {
    showOverlay: true,
    compact: w < 420,
    hoverPlane,
    time: t,
  });
  ctx.restore();
}

function syncHeroUI() {
  const ev = heroEval;
  const { state, dof, metrics, diagnosis, keypoints, byId } = ev;

  // 顶栏状态签
  const pill = $("#hero-status-pill");
  setText(pill, diagnosis.badge);
  if (pill) pill.classList.toggle("is-valid", diagnosis.valid);

  // 自示范标题：背景虚化越明显，「浅景深」背后越透出柔暖散景微晕，同时前景墨字永保锐利
  const dofWord = $("#title-dof-word");
  if (dofWord) {
    const blurAmt = clamp(metrics.midBgCoC * 12, 0, 14);
    const halo = blurAmt > 2
      ? `0 0 ${blurAmt.toFixed(1)}px rgba(246, 145, 109, 0.45), 6px 2px ${(blurAmt * 1.4).toFixed(1)}px rgba(89, 164, 168, 0.28)`
      : "none";
    if (domCache.get("titleHalo") !== halo) {
      domCache.set("titleHalo", halo);
      dofWord.style.textShadow = halo;
    }
  }

  // 四要素紧凑实况条
  for (const kp of keypoints) {
    const card = $(`.kp-mini[data-kp="${kp.id}"]`);
    if (!card) continue;
    card.classList.toggle("is-ok", kp.ok);
    setText($(".kp-val", card), kp.status);
  }

  // 单真源诊断卡
  const diagCard = $("#diag-card");
  if (diagCard) diagCard.classList.toggle("is-valid", diagnosis.valid);
  setText($("#diag-badge"), diagnosis.badge);
  setText($("#diag-headline"), diagnosis.headline);
  setText($("#diag-explain"), diagnosis.explanation);
  setText($("#diag-hint"), diagnosis.actionHint);
  setText($("#btn-fix-step"), diagnosis.fixLabel);

  setText($("#m-dof"), formatDof(dof.dofM));
  setText($("#m-subj-coc"), `${metrics.subjCoC.toFixed(3)} mm`);
  setText($("#m-bg-coc"), `${metrics.midBgCoC.toFixed(2)} mm`);
  setText($("#m-tier"), metrics.separationTier);

  // 机械 6 叶光圈 SVG 仅在光圈档位变化时重算路径
  if (lastIrisAperture !== state.aperture) {
    lastIrisAperture = state.aperture;
    updateIrisSvg(irisSvg, state.aperture);
  }
  setText($("#iris-fstop"), formatAperture(state.aperture));
  setText($("#iris-pupil"), `入瞳 ${metrics.pupilMm.toFixed(1)} mm`);

  // 四阀控件值同步
  const apIdx = closestApertureIndex(state.aperture);
  const apRange = $("#ctrl-aperture");
  if (apRange && Number(apRange.value) !== apIdx) apRange.value = String(apIdx);
  setText($("#val-aperture"), formatAperture(state.aperture));

  setText($("#val-focal"), `${state.focalMm}mm`);
  $$(".focal-btn").forEach((b) => {
    const active = Number(b.dataset.focal) === state.focalMm;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  const sepRange = $("#ctrl-bgsep");
  if (sepRange && Math.abs(Number(sepRange.value) - state.bgSepM) > 0.01) {
    sepRange.value = state.bgSepM.toFixed(2);
  }
  setText($("#val-bgsep"), `${state.bgSepM.toFixed(2)} m`);

  const focusRange = $("#ctrl-focus");
  if (focusRange && Math.abs(Number(focusRange.value) - state.focusM) > 0.01) {
    focusRange.value = state.focusM.toFixed(2);
  }
  setText($("#val-focus"), `${state.focusM.toFixed(2)} m`);

  // 前景遮挡开关
  const fgBtn = $("#btn-fg-blocker");
  if (fgBtn) {
    fgBtn.setAttribute("aria-pressed", String(state.fgBlocker));
    setText(fgBtn, `前景挡镜陷阱：${state.fgBlocker ? "开" : "关"}`);
  }

  // 场景切签
  $$(".scene-tab").forEach((b) => {
    const active = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  // 镌刻式景深距离尺（单真源同步 Dn — u — Df 与前景/主体/背景刻线）
  const rNear = distToRatio(dof.nearM) * 100;
  const rFar = Number.isFinite(dof.farM) ? distToRatio(dof.farM) * 100 : 100;
  const rFocus = distToRatio(state.focusM) * 100;
  const rFg = distToRatio(byId.fg.z) * 100;
  const rSubj = distToRatio(byId.subject.z) * 100;
  const rBg = distToRatio(byId.midBg.z) * 100;

  const zone = $("#ruler-dof-zone");
  if (zone) {
    zone.style.left = `${rNear.toFixed(2)}%`;
    zone.style.width = `${Math.max(1.2, rFar - rNear).toFixed(2)}%`;
  }
  const needle = $("#ruler-needle");
  if (needle) needle.style.left = `${rFocus.toFixed(2)}%`;
  const mFg = $("#mark-fg");
  if (mFg) mFg.style.left = `${rFg.toFixed(2)}%`;
  const mSubj = $("#mark-subj");
  if (mSubj) mSubj.style.left = `${rSubj.toFixed(2)}%`;
  const mBg = $("#mark-bg");
  if (mBg) mBg.style.left = `${rBg.toFixed(2)}%`;

  if (rulerTrack) rulerTrack.setAttribute("aria-valuenow", state.focusM.toFixed(2));
  setText(
    $("#ruler-readout"),
    `合焦 u = ${state.focusM.toFixed(2)} m · 清晰带 ${formatDist(dof.nearM)} – ${formatDist(dof.farM)}`
  );
}

const heroLoop = loop(heroCanvas, (t, _dt, { still }) => {
  heroTime = still ? 0 : t;
  // 仅在状态变更、开场前 0.6s 落位或静止首帧时重绘，避免静置空转拖垮软件渲染
  if (still || heroDirty || t < 0.6) {
    heroDirty = false;
    drawHeroCanvas(heroTime);
  }
});

function updateHero(patch, redraw = true) {
  Object.assign(heroState, patch);
  heroState.focusM = clamp(Number(heroState.focusM), MIN_DIST, MAX_DIST);
  heroState.bgSepM = clamp(Number(heroState.bgSepM), 0.3, 5.0);
  heroEval = evaluateOptics(heroState);
  syncHeroUI();
  if (redraw) {
    heroDirty = true;
    // 在 prefers-reduced-motion 下 loop 不跑 rAF，直接补画一帧；常规情况交由下一帧 rAF 合并绘出，绝不每帧重复双绘
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroLoop.draw();
    }
  }
}

// ---------- Hero 开放取景画布交互（鼠标/触屏横拖推焦 + 点击前景/主体/背景移焦 + 键盘） ----------
if (heroCanvas) {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startRatio = 0;

  const getPlaneAt = (clientX, clientY) => {
    const r = heroCanvas.getBoundingClientRect();
    const nx = (clientX - r.left) / r.width;
    const ny = (clientY - r.top) / r.height;
    if (nx < 0.28 && ny > 0.52) return "fg";
    if (nx >= 0.28 && nx <= 0.72 && ny >= 0.2 && ny <= 0.86) return "subject";
    return "midBg";
  };

  heroCanvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    startRatio = distToRatio(heroState.focusM);
    try {
      heroCanvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  heroCanvas.addEventListener("pointermove", (e) => {
    if (!dragging) {
      const p = getPlaneAt(e.clientX, e.clientY);
      if (p !== hoverPlane) {
        hoverPlane = p;
        heroLoop.draw();
      }
      return;
    }
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    // 允许纵向滑屏滚动：若明显竖拖就不抢手势
    if (!moved && Math.abs(dy) > Math.abs(dx) * 1.4 && e.pointerType === "touch") {
      dragging = false;
      return;
    }
    moved = true;
    const rect = heroCanvas.getBoundingClientRect();
    const deltaRatio = dx / Math.max(220, rect.width * 0.72);
    let nextDist = ratioToDist(startRatio + deltaRatio);
    // 经过主体平面 2.2m 时给予轻微阻尼吸附（仍可继续拖过以测试前后跑焦）
    const subjZ = heroEval.byId.subject.z;
    if (Math.abs(nextDist - subjZ) < 0.06) nextDist = subjZ;
    updateHero({ focusM: Number(nextDist.toFixed(2)) });
  });

  const finishDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    if (!moved && e.clientX != null) {
      const p = getPlaneAt(e.clientX, e.clientY);
      const targetZ = heroEval.byId[p]?.z ?? 2.2;
      updateHero({ focusM: Number(targetZ.toFixed(2)) });
    }
  };
  heroCanvas.addEventListener("pointerup", finishDrag);
  heroCanvas.addEventListener("pointercancel", () => { dragging = false; });
  heroCanvas.addEventListener("pointerleave", () => {
    if (hoverPlane) {
      hoverPlane = null;
      heroDirty = true;
    }
  });

  // 键盘操作：←/→ 推焦，↑/↓ 开关光圈
  heroCanvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 0.045 : -0.045;
      const next = ratioToDist(distToRatio(heroState.focusM) + step);
      updateHero({ focusM: Number(next.toFixed(2)) });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const idx = closestApertureIndex(heroState.aperture);
      const nextIdx = clamp(idx + (e.key === "ArrowUp" ? -1 : 1), 0, APERTURE_STOPS.length - 1);
      updateHero({ aperture: APERTURE_STOPS[nextIdx] });
    }
  });
}

// 镌刻景深标尺拖动与键盘
if (rulerTrack) {
  let rDrag = false;
  const applyRulerX = (clientX) => {
    const rect = rulerTrack.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    let d = ratioToDist(ratio);
    const subjZ = heroEval.byId.subject.z;
    if (Math.abs(d - subjZ) < 0.07) d = subjZ;
    updateHero({ focusM: Number(d.toFixed(2)) });
  };
  rulerTrack.addEventListener("pointerdown", (e) => {
    rDrag = true;
    try { rulerTrack.setPointerCapture(e.pointerId); } catch {}
    applyRulerX(e.clientX);
  });
  rulerTrack.addEventListener("pointermove", (e) => { if (rDrag) applyRulerX(e.clientX); });
  rulerTrack.addEventListener("pointerup", () => { rDrag = false; });
  rulerTrack.addEventListener("pointercancel", () => { rDrag = false; });
  rulerTrack.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 0.04 : -0.04;
      updateHero({ focusM: Number(ratioToDist(distToRatio(heroState.focusM) + step).toFixed(2)) });
    }
  });
}

// 顶栏场景切换、底舱四阀、诊断按钮与预设条绑定
$$(".scene-tab").forEach((btn) => {
  btn.addEventListener("click", () => updateHero({ scene: btn.dataset.scene }));
});

$("#ctrl-aperture")?.addEventListener("input", (e) => {
  const idx = clamp(Number(e.target.value), 0, APERTURE_STOPS.length - 1);
  updateHero({ aperture: APERTURE_STOPS[idx] });
});

$("#btn-ap-wider")?.addEventListener("click", () => {
  const idx = clamp(closestApertureIndex(heroState.aperture) - 1, 0, APERTURE_STOPS.length - 1);
  updateHero({ aperture: APERTURE_STOPS[idx] });
});

$("#btn-ap-smaller")?.addEventListener("click", () => {
  const idx = clamp(closestApertureIndex(heroState.aperture) + 1, 0, APERTURE_STOPS.length - 1);
  updateHero({ aperture: APERTURE_STOPS[idx] });
});

$$(".focal-btn").forEach((btn) => {
  btn.addEventListener("click", () => updateHero({ focalMm: Number(btn.dataset.focal) }));
});

$("#ctrl-bgsep")?.addEventListener("input", (e) => {
  updateHero({ bgSepM: Number(e.target.value) });
});

$("#ctrl-focus")?.addEventListener("input", (e) => {
  updateHero({ focusM: Number(e.target.value) });
});

$("#btn-fg-blocker")?.addEventListener("click", () => {
  updateHero({ fgBlocker: !heroState.fgBlocker });
});

$("#btn-fix-step")?.addEventListener("click", () => {
  updateHero(heroEval.diagnosis.fixPatch);
});

$$(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) updateHero(p.state);
  });
});

// ==================== 01 节：全景实焦 vs 浅景深幕帘对照 ====================
const splitCanvas = $("#split-canvas");
const splitRange = $("#split-range");
const btnEdges = $("#btn-edges");
const splitState = { ratio: 0.5, showEdges: false };
const evalSplitSharp = evaluateOptics({ scene: "poppy", focalMm: 50, aperture: 16, focusM: 2.2, bgSepM: 1.4, fgBlocker: false });
const evalSplitShallow = evaluateOptics({ scene: "poppy", focalMm: 85, aperture: 2.0, focusM: 2.2, bgSepM: 3.4, fgBlocker: false });

function drawSplit() {
  if (!splitCanvas) return;
  renderSplitCompare(splitCanvas, splitState.ratio, splitState.showEdges, evalSplitSharp, evalSplitShallow);
  const pct = Math.round(splitState.ratio * 100);
  const desc = splitState.showEdges
    ? `幕帘 ${pct}%（高频轮廓标示已开）：红虚框标出了 f/16 下仍在抢眼的后方花枝与栏线；跨过分界进入 f/2.0 一侧后，杂乱轮廓全部消融，只剩中央深青框内的虞美人主信号。`
    : `当前幕帘位于 ${pct}%：左侧 f/16 下后方枝叶与窗栏保留大量锐利硬边，与虞美人平分注意力；右侧 f/2.0 把背景高频轮廓压平成柔色块，只留主体一道清晰信号。`;
  setText($("#split-readout"), desc);
}

if (splitRange) {
  splitRange.addEventListener("input", (e) => {
    splitState.ratio = Number(e.target.value) / 100;
    drawSplit();
  });
}
if (splitCanvas) {
  let sDrag = false;
  const applySplit = (x) => {
    const r = splitCanvas.getBoundingClientRect();
    splitState.ratio = clamp((x - r.left) / r.width, 0.1, 0.9);
    if (splitRange) splitRange.value = String(Math.round(splitState.ratio * 100));
    drawSplit();
  };
  splitCanvas.addEventListener("pointerdown", (e) => {
    sDrag = true;
    try { splitCanvas.setPointerCapture(e.pointerId); } catch {}
    applySplit(e.clientX);
  });
  splitCanvas.addEventListener("pointermove", (e) => { if (sDrag) applySplit(e.clientX); });
  splitCanvas.addEventListener("pointerup", () => { sDrag = false; });
  splitCanvas.addEventListener("pointercancel", () => { sDrag = false; });
}
btnEdges?.addEventListener("click", () => {
  splitState.showEdges = !splitState.showEdges;
  btnEdges.setAttribute("aria-pressed", String(splitState.showEdges));
  setText(btnEdges, `高频边缘干扰标示：${splitState.showEdges ? "开" : "关"}`);
  drawSplit();
});

// ==================== 02 节：侧视薄透镜光路与等放大率澄清 ====================
const benchCanvas = $("#bench-canvas");
const benchState = { focalMm: 85, aperture: 2.0, bgSepM: 3.0, lockMag: true };

function drawBench() {
  if (!benchCanvas) return;
  const data = computeEqualMagOptics(benchState.focalMm, benchState.aperture, benchState.bgSepM, benchState.lockMag);
  renderOpticalBench(benchCanvas, data);

  setText($("#br-u"), `${data.focusM.toFixed(2)} m`);
  setText($("#br-pupil"), `${data.dof.pupilMm.toFixed(1)} mm`);
  setText($("#br-dof"), formatDof(data.dof.dofM));
  setText($("#br-coc"), `${data.bgCoC.toFixed(2)} mm`);
  setText($("#br-fov"), `${data.fovDeg.toFixed(1)}°`);
  setText($("#bench-sep-val"), `${benchState.bgSepM.toFixed(1)} m`);

  const verdict = benchState.lockMag
    ? `等放大率模式已开：为保持主体在画面里同大，${data.focalMm}mm 需要退到 ${data.focusM.toFixed(2)} m。此时主体附近景深始终约 ${formatDof(data.dof.dofM)}（几乎不随焦段改变），但入瞳直径扩大到 ${data.dof.pupilMm.toFixed(1)} mm、背景弥散圆达到 ${data.bgCoC.toFixed(2)} mm，同时水平视角收窄至 ${data.fovDeg.toFixed(1)}°，背景被显著压缩并柔化。`
    : `固定机位（2.00 m）模式：人不挪步直接换到 ${data.focalMm}mm，放大率暴增导致景深直接缩至 ${formatDof(data.dof.dofM)}，背景弥散圆为 ${data.bgCoC.toFixed(2)} mm——但此时主体在画面里也会同步变大，已不是同一构图。`;
  setText($("#bench-verdict"), verdict);
}

$$("[data-bfocal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    benchState.focalMm = Number(btn.dataset.bfocal);
    $$("[data-bfocal]").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawBench();
  });
});
$$("[data-bap]").forEach((btn) => {
  btn.addEventListener("click", () => {
    benchState.aperture = Number(btn.dataset.bap);
    $$("[data-bap]").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawBench();
  });
});
$("#bench-sep")?.addEventListener("input", (e) => {
  benchState.bgSepM = Number(e.target.value);
  drawBench();
});
$("#btn-lock-mag")?.addEventListener("click", (e) => {
  benchState.lockMag = !benchState.lockMag;
  e.currentTarget.setAttribute("aria-pressed", String(benchState.lockMag));
  setText(e.currentTarget, `锁定主体画面同大（等放大率）：${benchState.lockMag ? "开" : "关"}`);
  drawBench();
});

// ==================== 03 节：深青暗室散景叶片与球差实验室 ====================
const bokehCanvas = $("#bokeh-canvas");
const bokehState = { blades: "6", spherical: 0, busyTwigs: true };

const BLADE_TITLES = {
  "5": "5 叶硬棱光圈",
  "6": "6 叶经典光圈",
  "9": "9 叶圆形光圈",
  cateye: "大光圈猫眼渐晕",
};

function drawBokeh() {
  if (!bokehCanvas) return;
  renderBokehLab(bokehCanvas, bokehState);

  const sa = bokehState.spherical;
  const saLabel = sa < -0.25 ? "过矫硬边 / 洋葱圈" : sa > 0.25 ? "欠矫奶油柔晕" : "中性均匀圆盘";
  setText($("#bokeh-sa-val"), saLabel);
  setText($("#bokeh-title"), `${BLADE_TITLES[bokehState.blades]} · ${saLabel}`);

  let desc = "光盘内部亮度分布均匀、外缘利落，点光源呈现柔和轮廓，不会抢走主体风头。";
  if (sa < -0.25) {
    desc = "球差过矫把光线能量挤向光斑外缘，形成刺眼亮环与同心洋葱圈；如果打开「背景杂枝」，能清楚看到细枝分裂出杂乱的双重虚影（二线性）。";
  } else if (sa > 0.25) {
    desc = "球差轻微欠矫让光斑中心亮、外缘像水彩一样渐变溶进深色背景里；哪怕背景有杂乱枝条，边缘也会平滑晕开成柔润奶油底。";
  } else if (bokehState.blades === "cateye") {
    desc = "超大光圈全开时，镜筒边沿裁切了斜射光束，画面四周光斑呈现向心弯曲的「猫眼」椭圆，带有独特的环绕聚心氛围。";
  }
  setText($("#bokeh-desc"), desc);
}

$$("[data-blades]").forEach((btn) => {
  btn.addEventListener("click", () => {
    bokehState.blades = btn.dataset.blades;
    $$("[data-blades]").forEach((b) => b.classList.toggle("is-active", b === btn));
    drawBokeh();
  });
});
$("#bokeh-sa")?.addEventListener("input", (e) => {
  bokehState.spherical = Number(e.target.value) / 100;
  drawBokeh();
});
$("#btn-twigs")?.addEventListener("click", (e) => {
  bokehState.busyTwigs = !bokehState.busyTwigs;
  e.currentTarget.setAttribute("aria-pressed", String(bokehState.busyTwigs));
  setText(e.currentTarget, `背景杂枝（二线性测试）：${bokehState.busyTwigs ? "开" : "关"}`);
  drawBokeh();
});

// ==================== 04 节：光学年代标本切换 ====================
const eraCanvas = $("#era-canvas");
const ERA_DATA = {
  "1840": {
    badge: "1840 · VIENNA",
    title: "约瑟夫·匹兹瓦与第一支数学计算的大光圈人像镜",
    body: "维也纳大学数学教授 Joseph Petzval 在 1840 年计算出 f/3.6 肖像镜头，由福伦达（Voigtländer）制造。相比 1839 年达盖尔相机约 f/15–f/16 的小光圈，它的通光量提高约 20 倍，把坐像曝光从几分钟压到数秒。由于大光圈伴随明显像场弯曲，中央人物锐利、四周化为旋涡散景，浅景深从此走进人像视觉传统。",
    source: "核实依据：伦敦科学博物馆藏 1841 年福伦达匹兹瓦达盖尔相机档案与光学史文献。",
  },
  "1889": {
    badge: "1889 · LONDON",
    title: "彼得·亨利·埃默森提出「微分对焦」自然主义美学",
    body: "英国摄影师兼作家 Peter Henry Emerson 在 1889 年出版《Naturalistic Photography for Students of the Art》。他反对把整幅照片拍得处处冰冷锐利，提出应效仿人眼中央凹清晰、周边自然柔和的观看规律，用「微分对焦（differential focusing）」只让核心主体清晰，将浅景深从技术副产品提升为自觉构图理论。",
    source: "核实依据：大英百科全书、大都会艺术博物馆与盖蒂博物馆埃默森馆藏文献。",
  },
  "1932": {
    badge: "1932 · SAN FRANCISCO",
    title: "f/64 小组首展：向柔焦宣战的现代主义逆流",
    body: "1932 年 11 月 15 日，安塞尔·亚当斯（Ansel Adams）、爱德华·韦斯顿（Edward Weston）等十一位美国西岸摄影师在旧金山笛洋美术馆（M. H. de Young Memorial Museum）举办首展，直接以大画幅相机最小光圈 f/64 命名，反击柔焦画意派，力主前后景通透锐利——这套美学正是「084 深焦构图」的源头，证明浅景深与深焦从来是并行的语言选择。",
    source: "核实依据：大都会艺术博物馆 Heilbrunn 艺术史年表 Group f/64 专题条目。",
    link084: true,
  },
  "1997": {
    badge: "1997 · PHOTO TECHNIQUES & MODERN OPTICS",
    title: "「Bokeh」正式定名与现代入瞳光学体系",
    body: "1992 年，曾任柯达光学设计主管的 Rudolf Kingslake 由 SPIE Press 出版《Optics in Photography》，同年物理学家 Harold Merklinger 发表《The INs and OUTs of Focus》，系统厘清了景深、弥散圆与入瞳直径的关系。1997 年 3/4 月号《Photo Techniques》主编 Mike Johnston 将日语「ボケ（boke）」定拼为「bokeh」并刊发专题，让散景质地成为现代镜头评测与视觉设计的核心概念。",
    source: "核实依据：SPIE Digital Library (1992)、Harold Merklinger (1992) 与 Photo Techniques (1997)。",
  },
};

let activeEra = "1840";
function renderEra() {
  const info = ERA_DATA[activeEra];
  if (!info) return;
  if (eraCanvas) renderEraSpecimen(eraCanvas, activeEra);
  setText($("#era-badge"), info.badge);
  setText($("#era-title"), info.title);
  const bodyEl = $("#era-body");
  if (bodyEl) {
    bodyEl.textContent = "";
    if (info.link084) {
      const parts = info.body.split("「084 深焦构图」");
      bodyEl.append(parts[0]);
      const a = document.createElement("a");
      a.href = "https://layout.xiaoxiaodong.ai/084/play/";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "084 深焦构图";
      bodyEl.append("「", a, "」", parts[1] || "");
    } else {
      bodyEl.textContent = info.body;
    }
  }
  setText($("#era-source"), info.source);
}

$$(".era-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeEra = btn.dataset.era;
    $$(".era-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderEra();
  });
});

// ==================== 05 节：什么时候别用（翻转对照卡） ====================
$$(".avoid-card").forEach((card) => {
  const btn = $(".avoid-toggle", card);
  const bad = $(".avoid-panel.is-bad", card);
  const good = $(".avoid-panel.is-good", card);
  btn?.addEventListener("click", () => {
    const showGood = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(showGood));
    btn.textContent = showGood ? "看误用" : "看改法";
    if (bad) bad.hidden = showGood;
    if (good) good.hidden = !showGood;
  });
});

// ==================== 06 节：暗室判卷（单变量两轮考题，实绘 Canvas 选项） ====================
let quizRoundIdx = 0;
const quizAnswers = new Map(); // roundIdx -> chosenOptIdx

function buildQuizGrid() {
  const round = QUIZ_ROUNDS[quizRoundIdx];
  const grid = $("#quiz-grid");
  const promptEl = $("#quiz-prompt");
  const fb = $("#quiz-feedback");
  if (!round || !grid) return;

  setText(promptEl, round.prompt);
  grid.textContent = "";

  const chosen = quizAnswers.has(quizRoundIdx) ? quizAnswers.get(quizRoundIdx) : null;

  round.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.dataset.opt = String(idx);
    if (chosen !== null) {
      if (idx === round.correctIndex) btn.classList.add("is-correct");
      else if (idx === chosen) btn.classList.add("is-wrong");
    }

    const cv = document.createElement("canvas");
    cv.setAttribute("aria-label", `${opt.tag} ${opt.sub} 光学样张`);
    const foot = document.createElement("div");
    foot.className = "quiz-card-foot";
    const tagSpan = document.createElement("span");
    tagSpan.className = "quiz-card-tag";
    tagSpan.textContent = opt.tag;
    const subSpan = document.createElement("span");
    subSpan.className = "quiz-card-sub";
    subSpan.textContent = opt.sub;
    foot.append(tagSpan, subSpan);
    btn.append(cv, foot);

    btn.addEventListener("click", () => {
      quizAnswers.set(quizRoundIdx, idx);
      buildQuizGrid();
    });

    grid.append(btn);

    // 用同一套 model.js 实算光学引擎渲染该选项样张
    const ev = evaluateOptics(opt.params);
    requestAnimationFrame(() => {
      const dpr = pixelRatio(2);
      const cw = cv.clientWidth || 260;
      const ch = cv.clientHeight || 195;
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      const ctx = cv.getContext("2d");
      ctx.save();
      ctx.scale(dpr, dpr);
      renderOpticalFrame(ctx, cw, ch, ev, { showOverlay: false, compact: true });
      ctx.restore();
    });
  });

  // 更新总分与单题解析
  let correctCount = 0;
  quizAnswers.forEach((ans, rIdx) => {
    if (QUIZ_ROUNDS[rIdx].correctIndex === ans) correctCount++;
  });
  setText($("#quiz-score"), `已答 ${quizAnswers.size} / ${QUIZ_ROUNDS.length} 题 · 答对 ${correctCount} 题`);

  if (chosen !== null && fb) {
    const isRight = chosen === round.correctIndex;
    const pickedOpt = round.options[chosen];
    const rightOpt = round.options[round.correctIndex];
    const pickedEv = evaluateOptics(pickedOpt.params);
    const rightEv = evaluateOptics(rightOpt.params);

    fb.hidden = false;
    fb.classList.toggle("is-wrong", !isRight);
    setText($("#qf-badge"), isRight ? "判断准确" : "光学失衡");
    setText(
      $("#qf-title"),
      isRight
        ? `${pickedOpt.tag}（${pickedOpt.sub}）成立 · 景深 ${formatDof(pickedEv.dof.dofM)}`
        : `你选了 ${pickedOpt.tag}（${pickedOpt.sub}），正解是 ${rightOpt.tag}（${rightOpt.sub}）`
    );
    setText(
      $("#qf-body"),
      isRight
        ? `${pickedOpt.reason}（单真源实测：主体弥散圆 ${pickedEv.metrics.subjCoC.toFixed(3)} mm，背景弥散圆 ${pickedEv.metrics.midBgCoC.toFixed(2)} mm。）`
        : `${pickedOpt.reason} 对比正解 ${rightOpt.tag}：${rightOpt.reason}（正解主体弥散圆 ${rightEv.metrics.subjCoC.toFixed(3)} mm，背景弥散圆 ${rightEv.metrics.midBgCoC.toFixed(2)} mm。）`
    );
  } else if (fb) {
    fb.hidden = true;
  }
}

$$("[data-quiz-round]").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizRoundIdx = Number(btn.dataset.quizRound);
    $$("[data-quiz-round]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    buildQuizGrid();
  });
});

$("#btn-quiz-next")?.addEventListener("click", () => {
  quizRoundIdx = (quizRoundIdx + 1) % QUIZ_ROUNDS.length;
  $$("[data-quiz-round]").forEach((b) => {
    const on = Number(b.dataset.quizRound) === quizRoundIdx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  buildQuizGrid();
});

// ==================== 07 节：原海报放大灯箱（缩放 + 拖动 + Esc） ====================
const posterImg = $("#poster");
const posterTrigger = $("#poster-trigger");
const lightbox = $("#lightbox");
const lbViewport = $("#lb-viewport");
const lbImg = $("#lb-img");
const lbResetBtn = $("#lb-zoom-reset");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;

function applyLbTransform() {
  if (!lbImg) return;
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  setText(lbResetBtn, `${Math.round(lbScale * 100)}%`);
}

function openLightbox() {
  if (!lightbox || !lbImg || !posterImg) return;
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close")?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger?.focus();
}

posterTrigger?.addEventListener("click", openLightbox);
$("#lb-close")?.addEventListener("click", closeLightbox);
$("#lb-zoom-in")?.addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 0.75, 3.5);
  applyLbTransform();
});
$("#lb-zoom-out")?.addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 0.75, 3.5);
  if (lbScale <= 1) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
});
lbResetBtn?.addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});

if (lbViewport) {
  let lbDrag = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  lbViewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 0.75, 3.5);
    if (lbScale <= 1) { lbTx = 0; lbTy = 0; }
    applyLbTransform();
  }, { passive: false });

  lbViewport.addEventListener("pointerdown", (e) => {
    if (e.target === lbViewport && lbScale <= 1.01) {
      closeLightbox();
      return;
    }
    lbDrag = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = lbTx;
    oy = lbTy;
    lbViewport.classList.add("is-dragging");
    try { lbViewport.setPointerCapture(e.pointerId); } catch {}
  });
  lbViewport.addEventListener("pointermove", (e) => {
    if (!lbDrag) return;
    lbTx = ox + (e.clientX - sx);
    lbTy = oy + (e.clientY - sy);
    applyLbTransform();
  });
  const endLbDrag = () => {
    lbDrag = false;
    lbViewport.classList.remove("is-dragging");
  };
  lbViewport.addEventListener("pointerup", endLbDrag);
  lbViewport.addEventListener("pointercancel", endLbDrag);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});

// ==================== 初始化与自适应重绘 ====================
function drawAllStaticStages() {
  drawHeroCanvas(heroTime);
  drawSplit();
  drawBench();
  drawBokeh();
  renderEra();
  buildQuizGrid();
}

syncHeroUI();
drawAllStaticStages();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawAllStaticStages, 120);
});
