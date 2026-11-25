// 144 框架 版式 · 全部互动逻辑
import {
  EXP,
  OUTER_MODES,
  ZONE_MODES,
  ZONES,
  GRAMMAR_MODES,
  STRIP_STEPS,
  ERAS,
  SCENARIOS,
  QUIZ_OPTIONS,
  initialHeroState,
  evaluateHero,
} from "./model.js";
import {
  mountHeroOverlay,
  mountGestaltCanvas,
  mountBreakoutCanvas,
} from "./canvases.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ============================================================
// HERO：展陈说明页装框审校台
// ============================================================
const heroState = initialHeroState();
let heroEval = evaluateHero(heroState);

const sheetEl = $("#spec-sheet");
const overlayCanvas = $("#hero-overlay");
const outerBadgeVal = $("#outer-badge-val");
const pickOuterBtn = $("#pick-outer-btn");
const heroScore = $("#hero-score");
const verdictBox = $("#audit-verdict");
const verdictBadge = $("#verdict-badge");
const verdictHead = $("#verdict-head");
const verdictDesc = $("#verdict-desc");
const verdictHint = $("#verdict-hint");
const mBoxes = $("#m-boxes");
const mBreath = $("#m-breath");
const mConflict = $("#m-conflict");
const ctrlCurrent = $("#ctrl-current");
const modeBtnsWrap = $("#mode-btns");
const btnItemBoxes = $("#btn-item-boxes");
const btnXray = $("#btn-xray");
const btnReset = $("#btn-reset");
const caliperTrack = $("#caliper-track");
const caliperThumb = $("#caliper-thumb");
const thumbVal = $("#thumb-val");
const caliperReadout = $("#caliper-readout");

const heroOverlayCtl = mountHeroOverlay(
  overlayCanvas,
  sheetEl,
  () => heroState,
  () => heroEval
);

const OUTER_LABEL = Object.fromEntries(OUTER_MODES.map((m) => [m.id, m.label]));
const ZONE_LABEL = Object.fromEntries(ZONE_MODES.map((m) => [m.id, m.label]));
const TARGET_NAME = {
  outer: "整页外框",
  ...Object.fromEntries(ZONES.map((z) => [z.id, z.label])),
};

let lastModeKey = "";
function renderModeButtons() {
  const isOuter = heroState.selected === "outer";
  const activeVal = isOuter ? heroState.outer : heroState.zones[heroState.selected];
  const key = `${heroState.selected}:${activeVal}`;
  if (key === lastModeKey) return;
  lastModeKey = key;
  const opts = isOuter ? OUTER_MODES : ZONE_MODES;
  modeBtnsWrap.classList.toggle("cols-3", isOuter);
  modeBtnsWrap.innerHTML = opts
    .map(
      (o) =>
        `<button type="button" class="m-btn${o.id === activeVal ? " is-active" : ""}" data-mode-val="${o.id}" aria-pressed="${o.id === activeVal}">${o.label}</button>`
    )
    .join("");
}

function syncHero(padOnly = false) {
  heroEval = evaluateHero(heroState);

  // 更新活体说明页 DOM
  sheetEl.style.setProperty("--zpad", `${heroState.padding}px`);
  if (!padOnly) {
    sheetEl.dataset.outer = heroState.outer;
    outerBadgeVal.textContent = OUTER_LABEL[heroState.outer];
    pickOuterBtn.classList.toggle("is-selected", heroState.selected === "outer");

    for (const z of ZONES) {
      const el = sheetEl.querySelector(`[data-zone="${z.id}"]`);
      const mode = heroState.zones[z.id];
      el.dataset.mode = mode;
      el.classList.toggle("is-selected", heroState.selected === z.id);
      const tag = el.querySelector(".zone-mode-tag");
      if (tag) tag.textContent = ZONE_LABEL[mode];
    }
    const listZone = sheetEl.querySelector('[data-zone="list"]');
    listZone.dataset.itemBoxes = heroState.itemBoxes ? "true" : "false";
  }

  // 更新卡尺读数与位置
  const pct = ((heroState.padding - EXP.padMin) / (EXP.padMax - EXP.padMin)) * 100;
  caliperThumb.style.left = `${Math.max(4, Math.min(96, pct))}%`;
  thumbVal.textContent = String(Math.round(heroState.padding));
  caliperReadout.textContent = `${Math.round(heroState.padding)}px · ${heroEval.breathRatio.toFixed(2)}× 字号`;
  caliperTrack.setAttribute("aria-valuenow", String(Math.round(heroState.padding)));
  caliperTrack.setAttribute("aria-valuetext", `${Math.round(heroState.padding)} 像素`);

  // 更新审校单读数与诊断
  heroScore.textContent = `${heroEval.passCount} / 4`;
  verdictBox.dataset.status = heroEval.status;
  verdictBadge.textContent = heroEval.badge;
  verdictHead.textContent = heroEval.headline;
  verdictDesc.textContent = heroEval.detail;
  verdictHint.textContent = heroEval.hint;

  mBoxes.textContent = `${heroEval.totalBoxes} 框 · ${heroEval.nestingDepth} 层`;
  mBreath.textContent = `${heroEval.breathRatio.toFixed(2)}× (${Math.round(heroState.padding)}px)`;
  const emphText =
    heroEval.blockCount >= 2
      ? `${heroEval.blockCount} 色块（过载）`
      : heroEval.heavyCount >= 2
      ? `${heroEval.heavyCount} 重框（过载）`
      : heroEval.checks.emphasis
      ? "1 处强调 ✓"
      : "0 强调";
  mConflict.textContent = `${heroEval.conflictEdges} 冲突 · ${emphText}`;

  if (!padOnly) {
    ctrlCurrent.textContent = `当前：${TARGET_NAME[heroState.selected]}`;
    for (const btn of $$("#target-tabs .t-btn")) {
      const on = btn.dataset.target === heroState.selected;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
    renderModeButtons();

    btnItemBoxes.classList.toggle("is-on", heroState.itemBoxes);
    btnItemBoxes.setAttribute("aria-pressed", String(heroState.itemBoxes));
    btnItemBoxes.textContent = `清单子项套框：${heroState.itemBoxes ? "开" : "关"}`;

    btnXray.classList.toggle("is-on", heroState.xray);
    btnXray.setAttribute("aria-pressed", String(heroState.xray));
    btnXray.textContent = `1+1=3 透视：${heroState.xray ? "开" : "关"}`;
  }

  // 更新底带四项原海报关键词灯
  for (const item of $$(".hero-foot-kw .kw-item")) {
    const key = item.dataset.kw;
    const pass = heroEval.checks[key];
    item.classList.toggle("is-pass", pass);
    const st = item.querySelector(".kw-state");
    if (st) st.textContent = pass ? "✓" : "○";
  }

  heroOverlayCtl.markDirty(true);
}

// 直接点击活体说明页上的外框或分区：未选中则选中；已选中则顺次切换下一种装框手法
pickOuterBtn.addEventListener("click", () => {
  if (heroState.selected === "outer") {
    const idx = OUTER_MODES.findIndex((m) => m.id === heroState.outer);
    heroState.outer = OUTER_MODES[(idx + 1) % OUTER_MODES.length].id;
  } else {
    heroState.selected = "outer";
  }
  syncHero();
});

for (const el of $$(".spec-zone", sheetEl)) {
  const activate = () => {
    const zid = el.dataset.zone;
    if (heroState.selected === zid) {
      const idx = ZONE_MODES.findIndex((m) => m.id === heroState.zones[zid]);
      heroState.zones[zid] = ZONE_MODES[(idx + 1) % ZONE_MODES.length].id;
    } else {
      heroState.selected = zid;
    }
    syncHero();
  };
  el.addEventListener("click", activate);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  });
}

$("#target-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".t-btn");
  if (!btn) return;
  heroState.selected = btn.dataset.target;
  syncHero();
});

modeBtnsWrap.addEventListener("click", (e) => {
  const btn = e.target.closest(".m-btn");
  if (!btn) return;
  const val = btn.dataset.modeVal;
  if (heroState.selected === "outer") heroState.outer = val;
  else heroState.zones[heroState.selected] = val;
  syncHero();
});

btnItemBoxes.addEventListener("click", () => {
  heroState.itemBoxes = !heroState.itemBoxes;
  syncHero();
});

btnXray.addEventListener("click", () => {
  heroState.xray = !heroState.xray;
  syncHero();
});

btnReset.addEventListener("click", () => {
  Object.assign(heroState, initialHeroState());
  syncHero();
});

// 内距呼吸卡尺：拖动时固定按真实指针位置更新，零跨帧跳变、零多余 DOM 强排
let cachedTrackRect = null;
let lastMoveTs = 0;

function updatePadFromClientX(clientX, freshRect = false) {
  if (freshRect || !cachedTrackRect) cachedTrackRect = caliperTrack.getBoundingClientRect();
  const r = cachedTrackRect;
  if (!r || r.width <= 0) return;
  const u = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  const rounded = Math.round(EXP.padMin + u * (EXP.padMax - EXP.padMin));
  const pct = Math.max(4, Math.min(96, u * 100));
  caliperThumb.style.left = `${pct.toFixed(2)}%`;
  if (rounded !== heroState.padding) {
    heroState.padding = rounded;
    syncHero(true);
    caliperThumb.style.left = `${pct.toFixed(2)}%`;
  } else {
    heroOverlayCtl.markDirty(false);
  }
}

function handleMoveClientX(clientX) {
  const now = performance.now();
  if (now - lastMoveTs < 12) return;
  lastMoveTs = now;
  updatePadFromClientX(clientX, false);
}

let draggingCaliper = false;
caliperTrack.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return;
  draggingCaliper = true;
  if (caliperTrack.setPointerCapture) {
    try { caliperTrack.setPointerCapture(e.pointerId); } catch {}
  }
  updatePadFromClientX(e.clientX, true);
});
caliperTrack.addEventListener("pointermove", (e) => {
  if (!draggingCaliper || e.pointerType === "touch") return;
  handleMoveClientX(e.clientX);
});
const stopCaliper = () => {
  draggingCaliper = false;
  cachedTrackRect = null;
};
caliperTrack.addEventListener("pointerup", stopCaliper);
caliperTrack.addEventListener("pointercancel", stopCaliper);

// 兼容原生触摸事件（确保 CDP dispatchTouchEvent 每帧顺滑响应）
caliperTrack.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches[0]) {
      e.preventDefault();
      updatePadFromClientX(e.touches[0].clientX, true);
    }
  },
  { passive: false }
);
caliperTrack.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches[0]) {
      e.preventDefault();
      handleMoveClientX(e.touches[0].clientX);
    }
  },
  { passive: false }
);
caliperTrack.addEventListener("touchend", stopCaliper);
caliperTrack.addEventListener("touchcancel", stopCaliper);

caliperTrack.addEventListener("keydown", (e) => {
  let next = heroState.padding;
  const step = e.shiftKey ? 4 : 1;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") next -= step;
  else if (e.key === "ArrowRight" || e.key === "ArrowUp") next += step;
  else return;
  e.preventDefault();
  heroState.padding = Math.max(EXP.padMin, Math.min(EXP.padMax, next));
  syncHero(true);
});

new ResizeObserver(() => {
  cachedTrackRect = null;
  heroOverlayCtl.markDirty(true);
}).observe(sheetEl);
syncHero();

// ============================================================
// 01 节：Palmer 共同区域律实验
// ============================================================
const s1State = { proximity: 25, mode: "line" };
const s1Canvas = $("#s1-canvas");
const s1Prox = $("#s1-prox");
const s1ProxVal = $("#s1-prox-val");
const s1Note = $("#s1-note");
const s1Ctl = mountGestaltCanvas(s1Canvas, () => s1State);

function syncS1() {
  const p = Number(s1State.proximity);
  s1ProxVal.textContent = p < 30 ? "非常紧凑" : p < 65 ? "中等接近" : "趋近等距";
  for (const b of $$("[data-s1-mode]")) {
    const on = b.dataset.s1Mode === s1State.mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  if (s1State.mode === "none") {
    s1Note.textContent =
      "撤掉边框后，人眼严格按距离远近把 6 颗点分成 (1-2)、(3-4)、(5-6) 三对——这是格式塔「接近律」在起作用。";
  } else if (s1State.mode === "line") {
    s1Note.textContent =
      "加上两道深青细线框后，即使 1 和 2 挨得更近，眼睛仍优先把同一框内的 (2-3) 与 (4-5) 认作两组——共同区域律压过了距离。";
  } else {
    s1Note.textContent =
      "换成浅赭橙底色块，不需要粗黑线条也能形成同等强度的共同区域归组——这就是原海报说的「通过线框或色块框定内容」。";
  }
  s1Ctl.draw();
}

s1Prox.addEventListener("input", () => {
  s1State.proximity = Number(s1Prox.value);
  syncS1();
});
for (const b of $$("[data-s1-mode]")) {
  b.addEventListener("click", () => {
    s1State.mode = b.dataset.s1Mode;
    syncS1();
  });
}
syncS1();

// ============================================================
// 02 节：四种装框语气
// ============================================================
const s2Specimen = $("#s2-specimen");
const s2Badge = $("#s2-badge");
const s2Why = $("#s2-why");
const s2Ink = $("#s2-ink");
const s2Scan = $("#s2-scan");

function selectGrammar(id) {
  const item = GRAMMAR_MODES.find((g) => g.id === id) || GRAMMAR_MODES[0];
  s2Specimen.dataset.mode = item.id;
  s2Badge.textContent = item.modeName;
  s2Why.textContent = item.why;
  s2Ink.textContent = item.inkLevel;
  s2Scan.textContent = item.scanOrder;
  for (const b of $$("#s2-tabs .g-tab")) {
    const on = b.dataset.g === item.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }
}

$("#s2-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".g-tab");
  if (btn) selectGrammar(btn.dataset.g);
});
selectGrammar("boundary");

// ============================================================
// 03 节：Tufte 四步减框剥离
// ============================================================
const s3Done = new Set();
const s3Switches = $("#s3-switches");
const s3Table = $("#s3-table");
const s3InkPct = $("#s3-ink-pct");
const s3InkBar = $("#s3-ink-bar");
const s3Note = $("#s3-note");

function renderS3() {
  s3Switches.innerHTML = STRIP_STEPS.map((st) => {
    const done = s3Done.has(st.id);
    return `<button type="button" class="strip-btn${done ? " is-done" : ""}" data-strip="${st.id}" aria-pressed="${done}">
      <span>${st.label}<small>${st.desc}</small></span>
      <span class="strip-pill">${done ? "已执行" : "点击剥离"}</span>
    </button>`;
  }).join("");

  s3Table.dataset.double = s3Done.has("doubleOuter") ? "0" : "1";
  s3Table.dataset.grid = s3Done.has("cellGrid") ? "0" : "1";
  s3Table.dataset.tags = s3Done.has("tagBorders") ? "0" : "1";
  s3Table.dataset.anchor = s3Done.has("keepAnchor") ? "1" : "0";

  let ink = 86;
  for (const st of STRIP_STEPS) {
    if (s3Done.has(st.id)) ink -= st.inkCost;
  }
  ink = Math.max(12, ink);
  s3InkBar.style.width = `${ink}%`;
  const grade =
    ink >= 70 ? "框灾严重" : ink >= 45 ? "仍有冗余网格" : ink > 20 ? "趋于清爽" : "最小有效差异";
  s3InkPct.textContent = `${ink}% · ${grade}`;

  if (s3Done.size === 0) {
    s3Note.textContent = "外双框、全单元格粗线与标签黑边叠在一起，眼睛几乎先看到网格而不是议程时间。";
  } else if (s3Done.size < 4) {
    s3Note.textContent = `已卸掉 ${s3Done.size}/4 层多余边框，文字开始浮出纸面；继续把剩余冗余框线也剥离看看。`;
  } else {
    s3Note.textContent = "外框轻定边界、内部只留极淡横线与 1 处主旨赭橙色块——信息量丝毫未减，可读性却跃升一截。";
  }
}

s3Switches.addEventListener("click", (e) => {
  const btn = e.target.closest(".strip-btn");
  if (!btn) return;
  const id = btn.dataset.strip;
  if (s3Done.has(id)) s3Done.delete(id);
  else s3Done.add(id);
  renderS3();
});
renderS3();

// ============================================================
// 04 节：内距与破框张力 Canvas
// ============================================================
const s4State = { pad: 18, anchor: "straddle" };
const s4Canvas = $("#s4-canvas");
const s4Pad = $("#s4-pad");
const s4PadVal = $("#s4-pad-val");
const s4Note = $("#s4-note");
const s4Ctl = mountBreakoutCanvas(s4Canvas, () => s4State);

function syncS4() {
  const ratio = (s4State.pad / EXP.bodyFontPx).toFixed(2);
  s4PadVal.textContent = `${s4State.pad}px · ${ratio}×`;
  for (const b of $$("[data-s4-anchor]")) {
    const on = b.dataset.s4Anchor === s4State.anchor;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  const padMsg =
    s4State.pad < 12
      ? "内距偏紧，版心快贴到外框上；"
      : s4State.pad > 26
      ? "内距偏空，内部图文与外框显得脱节；"
      : "内距落在 12–26px 舒适区，四周呼吸匀称；";
  const ancMsg =
    s4State.anchor === "inside"
      ? "角块全部缩进框内后，轮廓工整但偏拘谨，缺少突破感。"
      : s4State.anchor === "straddle"
      ? "角块骑压在深青外框上，像角铁一样锁定矩形结构，同时制造出原海报标志性的活力。"
      : "角块完全漂离框线之外，结构锚定关系断开，反而显得零散。";
  s4Note.textContent = padMsg + ancMsg;
  s4Ctl.draw();
}

s4Pad.addEventListener("input", () => {
  s4State.pad = Number(s4Pad.value);
  syncS4();
});
for (const b of $$("[data-s4-anchor]")) {
  b.addEventListener("click", () => {
    s4State.anchor = b.dataset.s4Anchor;
    syncS4();
  });
}
syncS4();

// ============================================================
// 05 节：四时代历史剖面图
// ============================================================
const s5Tabs = $("#s5-tabs");
const s5Diagram = $("#s5-diagram");
const s5Year = $("#s5-year");
const s5Title = $("#s5-title");
const s5Src = $("#s5-src");
const s5Summary = $("#s5-summary");
const s5Role = $("#s5-role");

const ERA_SVG = {
  song: `<svg viewBox="0 0 180 230" aria-hidden="true">
    <rect x="0" y="0" width="180" height="230" fill="#F9F0E3"/>
    <rect x="16" y="22" width="148" height="186" fill="none" stroke="#032D35" stroke-width="3.5"/>
    <rect x="21" y="27" width="138" height="176" fill="none" stroke="#032D35" stroke-width="1"/>
    <line x1="48" y1="27" x2="48" y2="203" stroke="#032D35" stroke-width="0.9" opacity="0.65"/>
    <line x1="76" y1="27" x2="76" y2="203" stroke="#032D35" stroke-width="0.9" opacity="0.65"/>
    <line x1="104" y1="27" x2="104" y2="203" stroke="#032D35" stroke-width="0.9" opacity="0.65"/>
    <line x1="132" y1="27" x2="132" y2="203" stroke="#032D35" stroke-width="0.9" opacity="0.65"/>
    <polygon points="84,74 96,74 90,84" fill="#C05C21"/>
    <rect x="30" y="38" width="8" height="140" fill="#032D35" opacity="0.24"/>
    <rect x="58" y="38" width="8" height="148" fill="#032D35" opacity="0.24"/>
    <rect x="114" y="38" width="8" height="144" fill="#032D35" opacity="0.24"/>
    <rect x="142" y="38" width="8" height="132" fill="#032D35" opacity="0.24"/>
  </svg>`,
  kelmscott: `<svg viewBox="0 0 180 230" aria-hidden="true">
    <rect x="0" y="0" width="180" height="230" fill="#F9F0E3"/>
    <rect x="12" y="14" width="156" height="202" fill="#032D35"/>
    <rect x="28" y="30" width="124" height="170" fill="#F9F0E3"/>
    <rect x="18" y="20" width="144" height="190" fill="none" stroke="#C05C21" stroke-width="2" stroke-dasharray="4 3"/>
    <rect x="38" y="40" width="104" height="68" fill="#EFE3D1" stroke="#032D35" stroke-width="2"/>
    <circle cx="90" cy="74" r="18" fill="none" stroke="#C05C21" stroke-width="2.5"/>
    <rect x="38" y="120" width="48" height="68" fill="#032D35" opacity="0.22"/>
    <rect x="94" y="120" width="48" height="68" fill="#032D35" opacity="0.22"/>
    <rect x="38" y="120" width="18" height="18" fill="#C05C21"/>
  </svg>`,
  tschichold: `<svg viewBox="0 0 180 230" aria-hidden="true">
    <rect x="0" y="0" width="180" height="230" fill="#F9F0E3"/>
    <line x1="18" y1="36" x2="162" y2="36" stroke="#032D35" stroke-width="4"/>
    <rect x="18" y="52" width="96" height="18" fill="#032D35"/>
    <rect x="128" y="52" width="34" height="18" fill="#C05C21"/>
    <line x1="72" y1="86" x2="72" y2="206" stroke="#032D35" stroke-width="1.5"/>
    <rect x="84" y="92" width="76" height="8" fill="#032D35" opacity="0.7"/>
    <rect x="84" y="108" width="68" height="8" fill="#032D35" opacity="0.45"/>
    <rect x="84" y="124" width="72" height="8" fill="#032D35" opacity="0.45"/>
    <rect x="18" y="156" width="44" height="44" fill="#032D35" opacity="0.16"/>
    <line x1="18" y1="208" x2="162" y2="208" stroke="#C05C21" stroke-width="2.5"/>
  </svg>`,
  cognitive: `<svg viewBox="0 0 180 230" aria-hidden="true">
    <rect x="0" y="0" width="180" height="230" fill="#F9F0E3"/>
    <rect x="18" y="20" width="144" height="190" fill="none" stroke="#032D35" stroke-width="3"/>
    <rect x="148" y="12" width="20" height="20" fill="#C05C21"/>
    <rect x="12" y="198" width="14" height="14" fill="#C05C21"/>
    <rect x="32" y="38" width="84" height="14" fill="#032D35"/>
    <rect x="32" y="62" width="114" height="6" fill="#032D35" opacity="0.5"/>
    <rect x="32" y="75" width="96" height="6" fill="#032D35" opacity="0.5"/>
    <line x1="32" y1="98" x2="148" y2="98" stroke="#032D35" stroke-dasharray="3 3" opacity="0.45"/>
    <rect x="32" y="114" width="116" height="32" fill="none" stroke="#032D35" stroke-width="1.2"/>
    <rect x="32" y="158" width="116" height="34" fill="#C05C21"/>
    <rect x="44" y="171" width="70" height="7" fill="#FDF8F0"/>
  </svg>`,
};

let activeEra = ERAS[0].id;
function renderS5() {
  s5Tabs.innerHTML = ERAS.map(
    (e) =>
      `<button type="button" class="era-tab${e.id === activeEra ? " is-active" : ""}" role="tab" aria-selected="${e.id === activeEra}" data-era="${e.id}">
        <span>${e.year}</span>
        <strong>${e.title}</strong>
      </button>`
  ).join("");
  const cur = ERAS.find((e) => e.id === activeEra) || ERAS[0];
  s5Diagram.innerHTML = ERA_SVG[cur.id];
  s5Year.textContent = `${cur.year} · ${cur.en}`;
  s5Title.textContent = cur.title;
  s5Src.textContent = cur.source;
  s5Summary.textContent = cur.summary;
  s5Role.textContent = cur.frameRole;
}
s5Tabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".era-tab");
  if (!btn) return;
  activeEra = btn.dataset.era;
  renderS5();
});
renderS5();

// ============================================================
// 06 节：场景试纸
// ============================================================
const s6Picks = $("#s6-picks");
const s6Verdict = $("#s6-verdict");
const s6Title = $("#s6-title");
const s6Preview = $("#s6-preview");
const s6Why = $("#s6-why");
const s6ViewNote = $("#s6-view-note");

let activeSc = SCENARIOS[0].id;
let activeScView = "framed";

function previewMarkup(scId, view) {
  const framed = view === "framed";
  if (scId === "spec") {
    return `<div style="border:${framed ? "2.5px solid #032D35" : "none"};padding:${framed ? "14px" : "4px"};display:grid;grid-template-columns:72px 1fr;gap:14px;align-items:center;">
      <div style="height:68px;background:#EFE3D1;border:${framed ? "2px solid #032D35" : "none"};display:flex;align-items:center;justify-content:center;font-weight:800;color:#032D35;">展图</div>
      <div>
        <strong style="display:block;font-size:15px;color:#032D35;">宋青瓷弦纹尊 · 高 21.4 cm</strong>
        <span style="display:block;font-size:12.5px;color:#2B4C52;margin:4px 0 8px;">北宋晚期 · 汝窑系 · 三号展柜</span>
        <span style="display:inline-block;padding:3px 9px;font-size:12px;font-weight:700;background:${framed ? "#C05C21" : "transparent"};color:${framed ? "#FDF8F0" : "#032D35"};">特展必看 · 禁止闪光灯</span>
      </div>
    </div>`;
  }
  if (scId === "checklist") {
    return `<div style="border:${framed ? "2.5px solid #032D35" : "none"};padding:${framed ? "14px" : "4px"};">
      <div style="font-weight:800;font-size:14px;color:#032D35;margin-bottom:8px;${framed ? "border-bottom:1.5px solid #032D35;padding-bottom:6px;" : ""}">印前交付核对清单</div>
      <div style="display:grid;gap:6px;font-size:13px;">
        <div style="${framed ? "border-bottom:1px solid rgba(3,45,53,0.16);padding-bottom:5px;" : ""}">✓ 出血尺寸 3mm 与裁切线核对</div>
        <div style="${framed ? "border-bottom:1px solid rgba(3,45,53,0.16);padding-bottom:5px;" : ""}">✓ 专色版与深青墨值复查</div>
        <div style="${framed ? "background:#C05C21;color:#FDF8F0;padding:4px 8px;font-weight:700;" : ""}">! 送印前确认小字对比度 ≥ 4.5:1</div>
      </div>
    </div>`;
  }
  if (scId === "essay") {
    return `<div style="border:${framed ? "3.5px solid #032D35" : "none"};padding:${framed ? "10px 12px" : "8px 18px"};max-width:52ch;margin:0 auto;">
      <p style="margin:0 0 8px;font-size:13.5px;line-height:1.75;color:#072329;">秋末的港口风很轻，老船坞的铁轨在午后拉出细长影子。长文阅读依靠的是安静的页边和稳定的行宽，眼睛顺着句子自然流淌。</p>
      <p style="margin:0;font-size:13.5px;line-height:1.75;color:#072329;">${framed ? "一旦四面套上硬黑框，每行末尾的竖线都在不断提醒边界，反而把思绪锁在盒子里。" : "拿掉硬框后，空白本身就是最好的缓冲，视线在段落间来去自如。"}</p>
    </div>`;
  }
  return `<div style="padding:${framed ? "12px" : "0"};border:${framed ? "4px solid #032D35" : "none"};background:${framed ? "#F9F0E3" : "transparent"};">
    <div style="height:122px;background:linear-gradient(180deg,#E8D7C0 0%,#E8D7C0 52%,#032D35 52%,#032D35 100%);position:relative;overflow:hidden;">
      <div style="position:absolute;right:22%;top:18%;width:34px;height:34px;border-radius:50%;background:#C05C21;"></div>
      <div style="position:absolute;left:12px;bottom:10px;color:#F9F0E3;font-size:12px;font-weight:700;">${framed ? "被粗框截断的海平线" : "直抵边沿的满幅海景"}</div>
    </div>
  </div>`;
}

function renderS6() {
  s6Picks.innerHTML = SCENARIOS.map(
    (sc) =>
      `<button type="button" class="sc-pick${sc.id === activeSc ? " is-active" : ""}" role="tab" aria-selected="${sc.id === activeSc}" data-sc="${sc.id}">
        <span>${sc.title}</span>
        <small>${sc.recommend ? "适合框" : "别硬框"}</small>
      </button>`
  ).join("");
  const cur = SCENARIOS.find((s) => s.id === activeSc) || SCENARIOS[0];
  s6Verdict.textContent = cur.verdict;
  s6Verdict.classList.toggle("is-no", !cur.recommend);
  s6Title.textContent = cur.title;
  s6Why.textContent = cur.why;
  s6ViewNote.textContent = activeScView === "framed" ? `当前预览（套框）：${cur.framedNote}` : `当前预览（拆框）：${cur.unframedNote}`;
  s6Preview.innerHTML = previewMarkup(cur.id, activeScView);

  for (const b of $$("[data-s6-view]")) {
    const on = b.dataset.s6View === activeScView;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
}

s6Picks.addEventListener("click", (e) => {
  const btn = e.target.closest(".sc-pick");
  if (!btn) return;
  activeSc = btn.dataset.sc;
  renderS6();
});
for (const b of $$("[data-s6-view]")) {
  b.addEventListener("click", () => {
    activeScView = b.dataset.s6View;
    renderS6();
  });
}
renderS6();

// ============================================================
// 07 节：单变量小练习
// ============================================================
const quizGrid = $("#quiz-grid");
const quizFeedback = $("#quiz-feedback");
const qfTitle = $("#qf-title");
const qfBody = $("#qf-body");
const qfRetry = $("#qf-retry");

function answerQuiz(id) {
  const picked = QUIZ_OPTIONS.find((q) => q.id === id);
  if (!picked) return;
  for (const card of $$(".q-card", quizGrid)) {
    card.classList.remove("is-right", "is-wrong");
    const cid = card.dataset.q;
    if (cid === id) card.classList.add(picked.correct ? "is-right" : "is-wrong");
    else if (cid === "C" && !picked.correct) card.classList.add("is-right");
  }
  quizFeedback.hidden = false;
  qfTitle.textContent = picked.correct
    ? `选对了（${id} 版）：${picked.verdict}`
    : `选了 ${id} 版（${picked.verdict}）——更稳的是 C 版`;
  qfBody.textContent = picked.reason;
}

quizGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".q-card");
  if (card) answerQuiz(card.dataset.q);
});
qfRetry.addEventListener("click", () => {
  for (const card of $$(".q-card", quizGrid)) card.classList.remove("is-right", "is-wrong");
  quizFeedback.hidden = true;
});

// ============================================================
// 08 节：原海报灯箱（复用 #poster.src，不重复内联图片）
// ============================================================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbPct = $("#lb-pct");
const posterOpen = $("#poster-open");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function updateLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbPct.textContent = `${Math.round(lbScale * 100)}%`;
}
function openLb() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  updateLb();
  lightbox.hidden = false;
  $("#lb-close").focus();
}
function closeLb() {
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLb);
$("#lb-close").addEventListener("click", closeLb);
$("#lb-in").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  updateLb();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.75, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  updateLb();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1; lbX = 0; lbY = 0;
  updateLb();
});

lbStage.addEventListener("pointerdown", (e) => {
  lbDragging = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbStage.classList.add("is-dragging");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  updateLb();
});
const stopLbDrag = () => {
  lbDragging = false;
  lbStage.classList.remove("is-dragging");
};
lbStage.addEventListener("pointerup", stopLbDrag);
lbStage.addEventListener("pointercancel", stopLbDrag);
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.75, Math.min(3, +(lbScale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
  updateLb();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLb();
});
