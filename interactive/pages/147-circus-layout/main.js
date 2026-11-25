// 147 马戏团 版式 · 主交互脚本
// 开场活体木活字排戏台（2D Canvas + 压杆 + 拖块）与 01–07 节各自独立交互

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  STAGE_W,
  STAGE_H,
  FAILURE_PRESETS,
  clamp,
  createInitialState,
  evaluateStage,
  pointInBox,
} from "./model.js";
import { renderCircusStage } from "./stage-canvas.js";

// ==================== 1. 开场主角玩具：马戏团木活字排戏台 ====================
const state = createInitialState();
let evalData = evaluateStage(state);

const canvas = document.getElementById("circus-canvas");
const ctx = canvas.getContext("2d");

const els = {
  ticketStamp: document.getElementById("ticket-stamp"),
  mobileStamp: document.getElementById("mobile-stamp"),
  ticketMetrics: document.getElementById("ticket-metrics"),
  verdictTitle: document.getElementById("verdict-title"),
  verdictBody: document.getElementById("verdict-body"),
  verdictHint: document.getElementById("verdict-hint"),
  mqvWrap: document.getElementById("mobile-quick-verdict"),
  mqvTag: document.getElementById("mqv-tag"),
  mqvText: document.getElementById("mqv-text"),
  jumpTrack: document.getElementById("jump-track"),
  jumpSlider: document.getElementById("jump-slider"),
  jumpReadout: document.getElementById("jump-readout"),
  leverFill: document.getElementById("lever-fill"),
  leverKnob: document.getElementById("lever-knob"),
  knobVal: document.getElementById("knob-val"),
  clutterRange: document.getElementById("clutter-range"),
  clutterVal: document.getElementById("clutter-val"),
  btnPath: document.getElementById("btn-path"),
  btnReset: document.getElementById("btn-reset"),
  btnPresetLoud: document.getElementById("btn-preset-loud"),
  btnPresetWild: document.getElementById("btn-preset-wild"),
  canvasCaption: document.getElementById("canvas-caption"),
  pillars: {
    jump: { li: document.getElementById("pillar-jump"), st: document.getElementById("pstate-jump") },
    exaggeration: { li: document.getElementById("pillar-exag"), st: document.getElementById("pstate-exag") },
    rhythm: { li: document.getElementById("pillar-rhythm"), st: document.getElementById("pstate-rhythm") },
    appeal: { li: document.getElementById("pillar-appeal"), st: document.getElementById("pstate-appeal") },
  },
};

const themeBtns = [...document.querySelectorAll("[data-theme]")];
const tiltBtns = [...document.querySelectorAll("[data-tilt]")];
const focusBtns = [...document.querySelectorAll("[data-focus]")];

// 动画状态（团长倾角物理阻尼 + 0.7 秒开场幕布展开）
const anim = {
  t: 0,
  introP: reducedMotion.matches ? 1 : 0.25,
  lean: evalData.ringmasterLean,
  needsDraw: true,
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const maxDpr = window.innerWidth <= 680 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    anim.needsDraw = true;
  }
}

function setText(el, val) {
  if (el.textContent !== val) el.textContent = val;
}

function syncUI() {
  evalData = evaluateStage(state);
  const pass = evalData.passCount;
  const isGood = pass === 4;

  // 检票印章
  const stampText = `${pass} / 4 ${evalData.verdict.tag}`;
  setText(els.ticketStamp, stampText);
  els.ticketStamp.className = `ticket-stamp ${isGood ? "is-good" : "is-bad"}`;
  setText(els.mobileStamp, stampText);
  els.mobileStamp.className = `mobile-stamp ${isGood ? "is-good" : ""}`;

  // 读数与诊单
  setText(els.ticketMetrics, `${evalData.ratio.toFixed(1)}× · 留白 ${evalData.whitespacePct}%`);
  setText(els.verdictTitle, evalData.verdict.title);
  setText(els.verdictBody, evalData.verdict.body);
  setText(els.verdictHint, evalData.verdict.hint);

  setText(els.mqvTag, evalData.verdict.tag);
  setText(els.mqvText, evalData.verdict.title);
  els.mqvWrap.classList.toggle("is-good", isGood);

  // 原海报四支柱徽标
  for (const [key, refs] of Object.entries(els.pillars)) {
    const p = evalData.pillars[key];
    refs.li.classList.toggle("is-ok", p.ok);
    refs.li.classList.toggle("is-bad", !p.ok);
    setText(refs.st, p.note);
  }

  // 字号跳跃压杆位置与读数
  const pct = clamp(((state.jumpRatio - 1.0) / (5.8 - 1.0)) * 100, 0, 100);
  const knobPct = clamp(pct, 9, 91);
  els.leverFill.style.width = `${pct.toFixed(1)}%`;
  els.leverKnob.style.left = `${knobPct.toFixed(1)}%`;
  const ratioStr = `${evalData.ratio.toFixed(1)}×`;
  setText(els.knobVal, ratioStr);
  const isSweet = evalData.pillars.jump.ok;
  els.leverKnob.classList.toggle("is-sweet", isSweet);
  els.jumpReadout.classList.toggle("is-sweet", isSweet);
  setText(els.jumpReadout, `${ratioStr}（经验甜区 2.4×–4.6×）`);
  els.jumpTrack.setAttribute("aria-valuenow", String(evalData.ratio));
  els.jumpSlider.value = String(state.jumpRatio);

  // 热闹道具读数
  els.clutterRange.value = String(state.clutter);
  const clutterNote = evalData.propsBlockingText > 0
    ? `压字 ${evalData.propsBlockingText} 处`
    : state.clutter < 18
      ? "偏冷清"
      : state.clutter > 60
        ? "偏拥挤"
        : "欢腾透气";
  setText(els.clutterVal, `${state.clutter}%（${clutterNote}）`);

  // 按钮高亮状态
  themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  tiltBtns.forEach((b) => {
    const on = b.dataset.tilt === state.tiltMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  focusBtns.forEach((b) => {
    const on = b.dataset.focus === state.focusMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.btnPath.classList.toggle("is-active", state.showPath);
  els.btnPath.setAttribute("aria-pressed", String(state.showPath));

  const sel = evalData.modules[state.selectedId];
  setText(
    els.canvasCaption,
    sel ? `已选「${sel.label}」· 画布可拖位 · 压杆调字号跳差` : "点选画布模块可微调位置 · 压杆调字号跳差",
  );

  anim.needsDraw = true;
}

const stageLoop = loop(canvas, (t, dt, { still }) => {
  resizeCanvas();
  anim.t = still ? 0 : t;
  if (still) {
    anim.introP = 1;
    anim.lean = evalData.ringmasterLean;
  } else {
    anim.introP = Math.min(1, anim.introP + dt * 1.4);
    anim.lean += (evalData.ringmasterLean - anim.lean) * Math.min(1, dt * 8);
  }
  renderCircusStage(ctx, canvas.width, canvas.height, evalData, state, anim);
  anim.needsDraw = false;
});

function updateAndDraw() {
  syncUI();
  // 正常开启动画时由 60Hz loop 统一在下一帧绘一次，避免同一帧画两遍；仅静止模式下立即补绘
  if (reducedMotion.matches) stageLoop.draw();
}

// 压杆拖动（同时支持鼠标、触摸和 tools/perf.mjs 的 TouchEvent）
let leverDragging = false;

function setRatioFromClientX(clientX) {
  const r = els.jumpTrack.getBoundingClientRect();
  if (!r.width) return;
  const u = clamp((clientX - r.left) / r.width, 0, 1);
  // 轻微吸附到经典 3.4× 甜区中心，保持顺手但不锁死
  let val = 1.0 + u * (5.8 - 1.0);
  if (Math.abs(val - 3.4) < 0.08) val = 3.4;
  val = +val.toFixed(2);
  if (Math.abs(val - state.jumpRatio) < 0.01) return;
  state.jumpRatio = val;
  updateAndDraw();
}

els.jumpTrack.addEventListener("pointerdown", (e) => {
  leverDragging = true;
  els.jumpTrack.setPointerCapture?.(e.pointerId);
  els.jumpTrack.focus();
  setRatioFromClientX(e.clientX);
});

els.jumpTrack.addEventListener("pointermove", (e) => {
  if (!leverDragging) return;
  setRatioFromClientX(e.clientX);
});

const stopLever = () => {
  leverDragging = false;
};
els.jumpTrack.addEventListener("pointerup", stopLever);
els.jumpTrack.addEventListener("pointercancel", stopLever);

// 兼容原生 touch 事件（确保 perf.mjs dispatchTouchEvent 百分百触发重绘）
els.jumpTrack.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  leverDragging = true;
  setRatioFromClientX(e.touches[0].clientX);
}, { passive: true });

els.jumpTrack.addEventListener("touchmove", (e) => {
  if (!e.touches.length) return;
  setRatioFromClientX(e.touches[0].clientX);
}, { passive: true });

els.jumpTrack.addEventListener("touchend", stopLever, { passive: true });

els.jumpTrack.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.3 : 0.15;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.jumpRatio = +clamp(state.jumpRatio + step, 1.0, 5.8).toFixed(2);
    updateAndDraw();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.jumpRatio = +clamp(state.jumpRatio - step, 1.0, 5.8).toFixed(2);
    updateAndDraw();
  }
});

// 画布直接点选与拖移模块（仅指针命中模块时拖动，不挡手机竖屏滚动）
let dragMod = null;

function clientToStage(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / Math.max(1, r.width)) * STAGE_W,
    y: ((clientY - r.top) / Math.max(1, r.height)) * STAGE_H,
  };
}

function hitModule(pt) {
  const order = ["headline", "ribbon", "star", "stamp", "note"];
  for (const id of order) {
    if (pointInBox(pt.x, pt.y, evalData.modules[id], 8)) return id;
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  const pt = clientToStage(e.clientX, e.clientY);
  const hit = hitModule(pt);
  if (!hit) return;
  state.selectedId = hit;
  const off = state.offsets[hit];
  dragMod = { id: hit, startX: pt.x, startY: pt.y, origDx: off.dx, origDy: off.dy };
  canvas.classList.add("is-dragging");
  canvas.setPointerCapture?.(e.pointerId);
  updateAndDraw();
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragMod) return;
  const pt = clientToStage(e.clientX, e.clientY);
  const dx = clamp(dragMod.origDx + (pt.x - dragMod.startX), -110, 110);
  const dy = clamp(dragMod.origDy + (pt.y - dragMod.startY), -75, 75);
  state.offsets[dragMod.id] = { dx: Math.round(dx), dy: Math.round(dy) };
  updateAndDraw();
});

const stopCanvasDrag = () => {
  if (!dragMod) return;
  dragMod = null;
  canvas.classList.remove("is-dragging");
};
canvas.addEventListener("pointerup", stopCanvasDrag);
canvas.addEventListener("pointercancel", stopCanvasDrag);

// 题材、倾角、聚光、道具与错版预设事件
themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    updateAndDraw();
  });
});

tiltBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.tiltMode = btn.dataset.tilt;
    state.angleDeltas = { headline: 0, ribbon: 0, stamp: 0, note: 0 };
    updateAndDraw();
  });
});

focusBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.focusMode = btn.dataset.focus;
    updateAndDraw();
  });
});

els.clutterRange.addEventListener("input", () => {
  state.clutter = Number(els.clutterRange.value);
  updateAndDraw();
});

els.btnPath.addEventListener("click", () => {
  state.showPath = !state.showPath;
  updateAndDraw();
});

els.btnReset.addEventListener("click", () => {
  const fresh = createInitialState();
  Object.assign(state, fresh);
  updateAndDraw();
});

els.btnPresetLoud.addEventListener("click", () => {
  Object.assign(state, FAILURE_PRESETS.allLoud);
  state.offsets = createInitialState().offsets;
  updateAndDraw();
});

els.btnPresetWild.addEventListener("click", () => {
  Object.assign(state, FAILURE_PRESETS.wildSpin);
  state.offsets = createInitialState().offsets;
  updateAndDraw();
});

window.addEventListener("resize", () => {
  resizeCanvas();
  stageLoop.draw();
});

// 初始同步与首帧绘制
syncUI();
resizeCanvas();
stageLoop.draw();

// ==================== 2. 01 节：街头 1.5 秒眨眼测验 ====================
const glanceWin = document.getElementById("glance-window");
const glanceFb = document.getElementById("glance-feedback");
const gpR1 = document.getElementById("gp-r1");
const gpR2 = document.getElementById("gp-r2");
const scaleTabs = [...document.querySelectorAll("[data-scale]")];
const btnFlash = document.getElementById("btn-flash");
let flashTimer = 0;

const SCALE_INFO = {
  flat: {
    r1: "1.2×",
    r2: "1.1×",
    msg: "1.2× 齐平公告：三行字大小相差无几，路人一瞥之间找不到入口，记忆留存最弱。",
  },
  step: {
    r1: "3.2×",
    r2: "1.5×",
    msg: "3.2× 马戏三阶：第一眼 0.3 秒就能认出「夏日大篷夜演」，再沿蓝带扫到时间，主次一步到位。",
  },
  over: {
    r1: "5.4×",
    r2: "0.9×",
    msg: "5.4× 巨字过载：大标几乎把副标和时间压到看不清，只剩惊呼却丢了「几点去哪」的关键信息。",
  },
};

function setScaleMode(mode) {
  clearTimeout(flashTimer);
  glanceWin.classList.remove("is-curtained");
  glanceWin.dataset.scale = mode;
  gpR1.textContent = SCALE_INFO[mode].r1;
  gpR2.textContent = SCALE_INFO[mode].r2;
  glanceFb.textContent = SCALE_INFO[mode].msg;
  scaleTabs.forEach((t) => {
    const on = t.dataset.scale === mode;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-pressed", String(on));
  });
}

scaleTabs.forEach((tab) => {
  tab.addEventListener("click", () => setScaleMode(tab.dataset.scale));
});

btnFlash.addEventListener("click", () => {
  clearTimeout(flashTimer);
  glanceWin.classList.remove("is-curtained");
  const delay = reducedMotion.matches ? 400 : 1500;
  btnFlash.textContent = "亮灯观察中…";
  flashTimer = setTimeout(() => {
    glanceWin.classList.add("is-curtained");
    btnFlash.textContent = "亮灯 1.5 秒";
  }, delay);
});

// ==================== 3. 02 节：左右掀幕解剖镜 ====================
const curtainStage = document.getElementById("curtain-stage");
const curtainRange = document.getElementById("curtain-range");
const xrayCheck = document.getElementById("xray-check");

curtainRange.addEventListener("input", () => {
  curtainStage.style.setProperty("--split", `${curtainRange.value}%`);
});

xrayCheck.addEventListener("change", () => {
  curtainStage.classList.toggle("is-xray", xrayCheck.checked);
});

// ==================== 4. 03 节：暗篷四柱聚光点检台 ====================
const spotBtns = [...document.querySelectorAll("[data-spot].spot-btn")];
const spotVisual = document.getElementById("spot-visual");
const beamCone = document.getElementById("beam-cone");
const spotKicker = document.getElementById("spot-kicker");
const spotHeading = document.getElementById("spot-heading");
const spotDesc = document.getElementById("spot-desc");
const spotRange = document.getElementById("spot-range");
const spotFail = document.getElementById("spot-fail");

const SPOT_DATA = {
  jump: {
    kicker: "PILLAR 01 · JUMP",
    heading: "跳跃：打破匀速平推，制造跨步落点",
    desc: "普通版面像匀速脚步，眼睛从左上滑到右下；马戏团版式靠弹簧式的字号跨度与高低错位，让眼睛从 1 号大标直接蹦到 2 号彩带、再落到 3 号主角插图。关键是每次跳跃的目标够明确，一步只跳一个落点。",
    range: "主标 / 正文字号比 2.4×–4.6×（经验参考）",
    fail: "倍率低于 2× 变普通公告；超过 5× 挤垮副信息",
    beam: "260,0 70,340 420,340",
  },
  exag: {
    kicker: "PILLAR 02 · EXAGGERATION",
    heading: "夸张：尺度和倾角放大一步，反差才成立",
    desc: "把最核心的两个词拉到超出日常比例，再配上一左一右的反向轻倾角（约 4°–12°），画面就长出了马戏海报的戏剧张力。夸张不是全场胡乱变形，而是「大的够大、小的够稳」的对照。",
    range: "主标与副带反向互锁 4°–12°（经验参考）",
    fail: "全 0° 显得呆板；同向斜会溜边；超过 17° 读字吃力",
    beam: "260,0 90,340 380,340",
  },
  rhythm: {
    kicker: "PILLAR 03 · RHYTHM",
    heading: "节奏：大块、小点与空白交替打拍子",
    desc: "听鼓点之所以带劲，是因为重拍之间有轻拍和休止符。马戏团版式里的大标是重拍，彩球和星屑是轻拍，而暖奶油纸白就是休止符——没了留白休止符，满场全是咚咚咚的噪音。",
    range: "干净底纸留白 36%–68%，装饰绝不压字（经验参考）",
    fail: "装饰星屑盖住文字或留白跌破 35%，立刻变牛皮癣",
    beam: "260,0 110,340 450,340",
  },
  appeal: {
    kicker: "PILLAR 04 · APPEAL",
    heading: "吸引：三米外先截停，一米内读清楚",
    desc: "磁铁画的是「远看能把人拉过来，近看还能留得住」。靠高对比红蓝黄三色配奶油底在远处一秒吸睛，但进到正文说明区必须立刻降温，让时间地点清清楚楚落进眼里。",
    range: "色板锁在 2–3 个高饱和主色 + 1 个安静纸底",
    fail: "五块全挂满高饱和彩底，像五人拿喇叭同时喊",
    beam: "260,0 60,340 460,340",
  },
};

spotBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.spot;
    const d = SPOT_DATA[key];
    spotVisual.dataset.spot = key;
    beamCone.setAttribute("points", d.beam);
    spotKicker.textContent = d.kicker;
    spotHeading.textContent = d.heading;
    spotDesc.textContent = d.desc;
    spotRange.textContent = d.range;
    spotFail.textContent = d.fail;
    spotBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  });
});

// ==================== 5. 04 节：木活字年代抽屉 ====================
const eraTabs = [...document.querySelectorAll("[data-era].era-tab")];
const eraSpecimen = document.getElementById("era-specimen");
const eraTitle = document.getElementById("era-title");
const eraBody = document.getElementById("era-body");
const eraSource = document.getElementById("era-source");

const ERA_DATA = {
  wood: {
    title: "1827–1834：木活字机械化，让街头大字不再受制于铅块",
    body: "19 世纪初，超过 72 磅的铅铸金属大字极其沉重、昂贵，冷却时还容易开裂变形。1827 年，纽约印刷商 Darius Wells 发明侧向铣刀（lateral router），并于 1828 年出版已知最早的木活字样本册；1834 年，新泽西的 William Leavenworth 又把缩放仪（pantograph）接上铣切工序，使端面枫木与樱桃木大字得以批量复制。从此巡回马戏团与剧场可以在一张大字报上同时拼出十几种夸张尺码的粗体字。",
    source: "核实出处：Hamilton Wood Type & Printing Museum（woodtype.org）与 Rob Roy Kelly《American Wood Type, 1828–1900》（1969）。",
  },
  litho: {
    title: "1870–1910：彩色石印术把马戏大篷搬上整面墙",
    body: "随着彩色石印术（chromolithograph）成熟，辛辛那提的 Strobridge Lithographing Company 等印厂为 Barnum & Bailey 等大型巡回马戏团印制了大量巨幅彩色海报（美国国会图书馆藏有 c.1895 实物原件）。放射状红白帐篷条纹、斜穿画面的燕尾标语缎带、夸张的杂技剪影与跳跃色块，正是今天马戏团版式最直接的视觉母题。",
    source: "核实出处：美国国会图书馆版画与摄影部馆藏条目 LCCN 98500053（loc.gov/pictures/item/98500053/）。",
  },
  press: {
    title: "1890 年代：街头报业大战催生「马戏团式拼版」",
    body: "1890 年代，美国报业在纽约展开激烈的街头单份发行竞争。为了在报摊上一眼抢走视线，部分煽情报纸抛弃了沉稳的传统多栏秩序，把马戏大字报那套通栏木活字巨标、多层叠放副标与跳色框搬上报纸头版，传统排版师把这种高能量甚至近乎喧嚣的头版戏称为「circus makeup（马戏团式拼版）」。",
    source: "核实出处：美国报业与印刷史词条「Yellow journalism / Circus makeup」与 19 世纪大字报档案。",
  },
  textbook: {
    title: "1967–1969：Roy Paul Nelson 将其正式写入广告版式谱系",
    body: "1967 年，美国新闻与广告设计教育家 Roy Paul Nelson 在《The Design of Advertising》（Wm. C. Brown 出版）中，把 Circus Layout（马戏团版式）与蒙德里安版式、框架版式、多面板版式并列为标准广告版式类型，点明它刻意打断平滑扫视、迫使读者停下解码的机制；两年后，Rob Roy Kelly 出版《American Wood Type, 1828–1900》（Van Nostrand Reinhold, 1969），系统保存了这批木活字海报遗产。",
    source: "核实出处：HathiTrust 馆藏记录 000305888 与德克萨斯大学奥斯汀分校 Rob Roy Kelly 美国木活字馆藏（rrk.finearts.utexas.edu）。",
  },
};

eraTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const k = tab.dataset.era;
    const d = ERA_DATA[k];
    eraSpecimen.dataset.era = k;
    eraTitle.textContent = d.title;
    eraBody.textContent = d.body;
    eraSource.textContent = d.source;
    eraTabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  });
});

// ==================== 6. 05 节：6 张真实委托单快检器 ====================
const triageScore = document.getElementById("triage-score");
const triageCards = [...document.querySelectorAll(".triage-card")];
const triageState = new Map();

const TRIAGE_EXPLAIN = [
  '适合进篷！街角围挡杂乱、观众步行速度快，马戏团版式的跳跃大标与明快色块能在 3 米外一秒截停视线。',
  '千万绕道！用药剂量要求零失误、冷静核对，请改用结构严谨的 <a href="https://layout.xiaoxiaodong.ai/141/play/" target="_blank" rel="noopener">141 文字主导版式</a> 或清晰的表格秩序。',
  '适合进篷！咖啡馆明信片墙竞争激烈，跳跃字号与反向倾角刚好把现场演出的躁动和玩乐感传出来。',
  '千万绕道！律所合规报告卖的是稳重与可信，马戏团语气会立刻削弱权威感，更适合 <a href="https://layout.xiaoxiaodong.ai/146/play/" target="_blank" rel="noopener">146 蒙德里安版式</a> 或 <a href="https://layout.xiaoxiaodong.ai/144/play/" target="_blank" rel="noopener">144 框架版式</a>。',
  '适合进篷！节庆限时活动天然追求热闹、惊喜和社交传播，只要守住唯一主标和留白气口就很出彩。',
  '千万绕道！急诊指引追求 0.5 秒单线直达、绝不制造额外视觉噪音，单句直给的 <a href="https://layout.xiaoxiaodong.ai/142/play/" target="_blank" rel="noopener">142 大标题版式</a> 远比跳跃多焦点更安全。',
];

triageCards.forEach((card) => {
  const idx = Number(card.dataset.id);
  const answer = card.dataset.answer;
  const btns = [...card.querySelectorAll(".tc-btn")];
  const res = card.querySelector(".tc-res");

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.pick;
      const ok = pick === answer;
      triageState.set(idx, ok);
      card.classList.toggle("is-right", ok);
      card.classList.toggle("is-wrong", !ok);
      btns.forEach((b) => b.classList.toggle("is-picked", b === btn));
      res.hidden = false;
      res.innerHTML = `<strong>${ok ? "判断准确：" : "再想想："}</strong>${TRIAGE_EXPLAIN[idx]}`;

      const done = triageState.size;
      const right = [...triageState.values()].filter(Boolean).length;
      triageScore.textContent = `已判 ${done} / 6 · 对 ${right} 题`;
    });
  });
});

// ==================== 7. 06 节：单变量盲选练习 ====================
const quizCards = [...document.querySelectorAll(".quiz-card")];
const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");

const QUIZ_EXPLAIN = {
  A: {
    ok: false,
    title: "方案 A 差在「字号跳差过平」",
    body: "它的倾角和留白都对，但唯一变动的字号被压成 1.25×：标题、蓝带、时间和地址几乎一样大，眼睛失去了第一落点，马戏张力瞬间泄气。",
  },
  B: {
    ok: false,
    title: "方案 B 差在「彩屑道具压字、留白窒息」",
    body: "它的字号和反向倾角与正确方案完全一致，但额外涌入的彩球与放射条纹直接盖住了文字笔画，奶油底纸呼吸被堵死，热闹越过红线成了凌乱噪音。",
  },
  C: {
    ok: true,
    title: "选对了！方案 C 在同一套元素里立住了舞台张力",
    body: "3.4× 跳跃字号瞬间交出入口，大标 -6° 与蓝带 +4° 反向咬住重心，三原色有主有次，外缘星点只点拍子不压字，留出近一半奶油纸白透气。",
  },
  D: {
    ok: false,
    title: "方案 D 差在「四块同向 +17° 过度右斜」",
    body: "它的字号与留白没问题，但把反向互锁换成了集体向右歪倒 17°：整张海报重心顺着坡滑出右下角，读者还得歪着脖子认字。",
  },
};

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    const choice = card.dataset.choice;
    const info = QUIZ_EXPLAIN[choice];
    quizCards.forEach((c) => {
      const isMe = c === card;
      c.classList.toggle("is-selected", isMe);
      c.classList.toggle("is-correct", isMe && info.ok);
      c.classList.toggle("is-incorrect", isMe && !info.ok);
      c.setAttribute("aria-pressed", String(isMe));
    });
    quizVerdict.classList.toggle("is-bad", !info.ok);
    qvTitle.textContent = info.title;
    qvBody.textContent = info.body;
  });
});

// ==================== 8. 07 节：原海报放大拖动灯箱 ====================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbScale = document.getElementById("lb-scale");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbZoom = 1;
let lbX = 0;
let lbY = 0;
let lbPan = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbZoom})`;
  lbScale.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbZoom = 1.25;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbReset.addEventListener("click", () => {
  lbZoom = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});
lbZoomIn.addEventListener("click", () => {
  lbZoom = clamp(lbZoom + 0.35, 0.75, 4);
  applyLbTransform();
});
lbZoomOut.addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.35, 0.75, 4);
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.2 : -0.2), 0.75, 4);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbZoom <= 1.05) {
    closeLightbox();
    return;
  }
  lbPan = { sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  lbStage.classList.add("is-panning");
  lbStage.setPointerCapture?.(e.pointerId);
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbPan) return;
  lbX = lbPan.ox + (e.clientX - lbPan.sx);
  lbY = lbPan.oy + (e.clientY - lbPan.sy);
  applyLbTransform();
});

const stopLbPan = () => {
  lbPan = null;
  lbStage.classList.remove("is-panning");
};
lbStage.addEventListener("pointerup", stopLbPan);
lbStage.addEventListener("pointercancel", stopLbPan);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
