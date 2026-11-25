// 164 目录 版式（CONTENTS LAYOUT）主控制器
import {
  DARKROOM_CASES,
  EDITIONS,
  HISTORY_STEPS,
  INITIAL_STATE,
  PRESETS,
  QUIZ_DATA,
  SCAN_GAME_ITEMS,
  SIBLING_PAGES,
  SPECIMENS_S02,
  TRIAGE_CASES,
  clamp,
} from "./model.js";
import { createDarkroomStage, createHeroStage } from "./hero.js";

// =========================================================
// 1. 开场活体目录编排台状态与 DOM 单真源同步
// =========================================================
const state = { ...INITIAL_STATE };
let latestEval = null;

const el = {
  canvas: document.getElementById("heroCanvas"),
  titleLockup: document.getElementById("titleLockup"),
  mobileStatusPill: document.getElementById("mobileStatusPill"),
  landscapeStatusPill: document.getElementById("landscapeStatusPill"),
  desktopStatusPill: document.getElementById("desktopStatusPill"),
  stageEditionLabel: document.getElementById("stageEditionLabel"),
  stageHudMeta: document.getElementById("stageHudMeta"),
  verdictPanel: document.querySelector(".verdict-panel"),
  verdictTier: document.getElementById("verdictTier"),
  verdictTitle: document.getElementById("verdictTitle"),
  verdictWhy: document.getElementById("verdictWhy"),
  verdictHint: document.getElementById("verdictHint"),
  quickFixBtn: document.getElementById("quickFixBtn"),
  metricGroup: document.getElementById("metricGroup"),
  metricScale: document.getElementById("metricScale"),
  metricGap: document.getElementById("metricGap"),
  metricDrift: document.getElementById("metricDrift"),
  scaleRange: document.getElementById("scaleRange"),
  scaleVal: document.getElementById("scaleVal"),
  splitRange: document.getElementById("splitRange"),
  splitVal: document.getElementById("splitVal"),
  pillarGroupBadge: document.getElementById("pillarGroupBadge"),
  pillarHierarchyBadge: document.getElementById("pillarHierarchyBadge"),
  pillarGuideBadge: document.getElementById("pillarGuideBadge"),
};

function syncControlsUI() {
  document.querySelectorAll("[data-edition]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.edition === state.edition);
  });
  document.querySelectorAll("[data-group]").forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.group) === state.grouping);
  });
  document.querySelectorAll("[data-folio]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.folio === state.folioMode);
  });
  document.querySelectorAll("[data-sign]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.sign === state.signposts);
  });
  el.scaleRange.value = state.scaleRatio.toFixed(2);
  el.scaleVal.textContent = `${state.scaleRatio.toFixed(2)}×`;
  const splitPct = Math.round(state.colSplit * 100);
  el.splitRange.value = String(splitPct);
  el.splitVal.textContent = `${splitPct}%`;
  const ed = EDITIONS[state.edition] || EDITIONS.poster;
  el.stageEditionLabel.textContent = `${ed.label} · 活体印张`;
}

function renderEvalToDOM(ev) {
  latestEval = ev;
  el.titleLockup.classList.toggle("is-pass", ev.allPass);
  el.verdictPanel.classList.toggle("is-pass", ev.allPass);

  for (const pill of [el.mobileStatusPill, el.landscapeStatusPill, el.desktopStatusPill]) {
    if (!pill) continue;
    pill.textContent = ev.statusTag;
    pill.classList.toggle("is-pass", ev.allPass);
  }

  const splitPct = Math.round(state.colSplit * 100);
  el.stageHudMeta.textContent = `SPLIT ${splitPct}% · SCALE ${state.scaleRatio.toFixed(2)}× · DRIFT ±${ev.geo.rowDriftLines.toFixed(1)}L`;

  el.verdictTier.textContent = ev.scanTier;
  el.verdictTitle.textContent = ev.primary.headline;
  el.verdictWhy.textContent = ev.primary.why;
  el.verdictHint.textContent = ev.primary.hint;

  if (ev.primary.fixLabel && ev.primary.fixPatch) {
    el.quickFixBtn.hidden = false;
    el.quickFixBtn.textContent = ev.primary.fixLabel;
  } else {
    el.quickFixBtn.hidden = true;
  }

  el.metricGroup.textContent =
    state.grouping === 1
      ? "1 组 · 15 条"
      : state.grouping === 15
      ? "15 碎块"
      : `${ev.geo.groupCount} 组聚类`;
  el.metricScale.textContent = `${state.scaleRatio.toFixed(2)}×`;
  el.metricGap.textContent = `${ev.geo.maxGapPx}px`;
  el.metricDrift.textContent =
    ev.geo.rowDriftLines > 0 ? `±${ev.geo.rowDriftLines.toFixed(1)} 行` : "0.0 行";

  // 同步左脊三柱实时状态灯
  const map = {
    group: [ev.pillars.group, el.pillarGroupBadge],
    hierarchy: [ev.pillars.hierarchy, el.pillarHierarchyBadge],
    guide: [ev.pillars.guide, el.pillarGuideBadge],
  };
  for (const [key, [pState, badgeEl]] of Object.entries(map)) {
    const item = document.querySelector(`.pillar-item[data-pillar="${key}"]`);
    if (item) item.classList.toggle("is-ok", pState.ok);
    if (badgeEl) badgeEl.textContent = pState.short;
  }
}

function updateState(patch, opts = {}) {
  Object.assign(state, patch);
  syncControlsUI();
  if (opts.silentScan) heroStage.redraw();
  else heroStage.triggerScan();
}

const heroStage = createHeroStage(
  el.canvas,
  () => state,
  (patch, opts) => updateState(patch, opts),
  renderEvalToDOM
);

document.querySelectorAll("[data-edition]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ edition: btn.dataset.edition }));
});

document.querySelectorAll("[data-group]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ grouping: Number(btn.dataset.group), focusIndex: 2 }));
});

document.querySelectorAll("[data-folio]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ folioMode: btn.dataset.folio }));
});

document.querySelectorAll("[data-sign]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ signposts: btn.dataset.sign }));
});

el.scaleRange.addEventListener("input", () => {
  updateState({ scaleRatio: +Number(el.scaleRange.value).toFixed(2) }, { silentScan: true });
});

el.splitRange.addEventListener("input", () => {
  updateState({ colSplit: +(Number(el.splitRange.value) / 100).toFixed(3) }, { silentScan: true });
});

el.quickFixBtn.addEventListener("click", () => {
  if (latestEval?.primary?.fixPatch) {
    updateState(latestEval.primary.fixPatch);
  }
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (preset) updateState({ ...preset.patch, focusIndex: 2 });
  });
});

syncControlsUI();

// =========================================================
// 2. 第 01 节：真实「找章节」计时扫读小实验
// =========================================================
const scanTargets = ["操作提示", "结构拆解", "视觉引导", "延伸阅读", "学习目标", "自我检查"];
const scanState = {
  mode: "flat",
  targetIdx: 0,
  startTs: performance.now(),
  flatSec: null,
  groupedSec: null,
};

const scanBoard = document.getElementById("scanBoard");
const scanTargetWord = document.getElementById("scanTargetWord");
const flatTimeVal = document.getElementById("flatTimeVal");
const groupedTimeVal = document.getElementById("groupedTimeVal");
const scanVerdict = document.getElementById("scanVerdict");

// 确定性乱序（避免平铺版总按章节顺序排得太好猜）
const FLAT_ORDER = [7, 1, 13, 4, 10, 0, 14, 6, 3, 11, 2, 9, 5, 12, 8];

function renderScanBoard() {
  const target = scanTargets[scanState.targetIdx];
  scanTargetWord.textContent = target;
  scanState.startTs = performance.now();

  document.querySelectorAll("[data-scan-mode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.scanMode === scanState.mode);
  });

  scanBoard.innerHTML = "";
  if (scanState.mode === "flat") {
    const wrap = document.createElement("div");
    wrap.className = "scan-flat-list";
    FLAT_ORDER.forEach((idx) => {
      const item = SCAN_GAME_ITEMS[idx];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scan-item-btn";
      btn.dataset.title = item.title;
      btn.innerHTML = `<span>${item.title}</span><span class="scan-page">${item.page}</span>`;
      btn.addEventListener("click", () => handleScanClick(btn, item.title));
      wrap.append(btn);
    });
    scanBoard.append(wrap);
  } else {
    const groups = new Map();
    SCAN_GAME_ITEMS.forEach((it) => {
      if (!groups.has(it.group)) groups.set(it.group, []);
      groups.get(it.group).push(it);
    });
    const grid = document.createElement("div");
    grid.className = "scan-grouped-grid";
    for (const [gName, items] of groups) {
      const col = document.createElement("div");
      col.className = "scan-group-col";
      const hd = document.createElement("div");
      hd.className = "scan-group-head";
      hd.textContent = gName;
      col.append(hd);
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "scan-item-btn";
        btn.dataset.title = item.title;
        btn.innerHTML = `<span>${item.title}</span><span class="scan-page">${item.page}</span>`;
        btn.addEventListener("click", () => handleScanClick(btn, item.title));
        col.append(btn);
      });
      grid.append(col);
    }
    scanBoard.append(grid);
  }
}

function handleScanClick(btn, title) {
  const target = scanTargets[scanState.targetIdx];
  if (title !== target) {
    btn.classList.add("is-miss");
    scanVerdict.textContent = `点成了「${title}」，目标条目是「${target}」——继续寻找。`;
    return;
  }
  btn.classList.add("is-hit");
  const sec = +Math.max(0.12, (performance.now() - scanState.startTs) / 1000).toFixed(2);
  if (scanState.mode === "flat") {
    scanState.flatSec = sec;
    flatTimeVal.textContent = `${sec.toFixed(2)} 秒`;
  } else {
    scanState.groupedSec = sec;
    groupedTimeVal.textContent = `${sec.toFixed(2)} 秒`;
  }

  if (scanState.flatSec != null && scanState.groupedSec != null) {
    const diff = scanState.flatSec - scanState.groupedSec;
    if (diff > 0.15) {
      scanVerdict.textContent = `实测完成：5 组聚类版比未分组快了 ${diff.toFixed(2)} 秒（${scanState.flatSec.toFixed(2)} 秒 → ${scanState.groupedSec.toFixed(2)} 秒）。先认大组再找子目，眼睛少扫了大半张表。`;
    } else {
      scanVerdict.textContent = `实测完成：未分组 ${scanState.flatSec.toFixed(2)} 秒，5 组聚类 ${scanState.groupedSec.toFixed(2)} 秒。点「换一个目标词重测」可换陌生条目再试一次。`;
    }
  } else {
    const nextLabel = scanState.mode === "flat" ? "5 组集群（原海报）" : "未分组 15 条";
    scanVerdict.textContent = `找到「${target}」用时 ${sec.toFixed(2)} 秒！现在切到「${nextLabel}」再测一次做对照。`;
  }
}

document.querySelectorAll("[data-scan-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    scanState.mode = btn.dataset.scanMode;
    renderScanBoard();
  });
});

document.getElementById("scanNewRoundBtn").addEventListener("click", () => {
  scanState.targetIdx = (scanState.targetIdx + 1) % scanTargets.length;
  scanState.flatSec = null;
  scanState.groupedSec = null;
  flatTimeVal.textContent = "待测";
  groupedTimeVal.textContent = "待测";
  scanVerdict.textContent = `新目标已切换为「${scanTargets[scanState.targetIdx]}」，请分别在两套版式里点击寻页。`;
  renderScanBoard();
});

renderScanBoard();

// =========================================================
// 3. 第 02 节：四类出版物目录标本切换台 + 轴线与等宽数字开关
// =========================================================
const specState = {
  active: "book",
  showAxis: false,
  tabular: true,
};

const specimenPlate = document.getElementById("specimenPlate");
const specEnTag = document.getElementById("specEnTag");
const specTitle = document.getElementById("specTitle");
const specPrinciple = document.getElementById("specPrinciple");
const specRuleNote = document.getElementById("specRuleNote");
const toggleAxisBtn = document.getElementById("toggleAxisBtn");
const toggleTabularBtn = document.getElementById("toggleTabularBtn");

function renderSpecimen() {
  const sp = SPECIMENS_S02.find((x) => x.id === specState.active) || SPECIMENS_S02[0];
  document.querySelectorAll("[data-spec]").forEach((b) => {
    const on = b.dataset.spec === sp.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  specimenPlate.classList.toggle("show-axis", specState.showAxis);
  specimenPlate.classList.toggle("is-tabular", specState.tabular);
  specimenPlate.classList.toggle("is-proportional", !specState.tabular);

  specEnTag.textContent = sp.en;
  specTitle.textContent = sp.label;
  specPrinciple.textContent = sp.principle;
  specRuleNote.textContent = sp.ruleNote;

  const rowsHtml = sp.rows
    .map((r) => {
      if (sp.id === "book") {
        return `<li class="spec-row lvl-${r.level}">
          <span class="spec-num">${r.num}</span>
          <span>${r.title}</span>
          <span class="spec-tight-gap"></span>
          <span class="spec-page">${r.page}</span>
        </li>`;
      }
      if (sp.id === "magazine") {
        return `<li class="spec-row lvl-${r.level}">
          <span class="spec-num">${r.num}</span>
          <span>${r.title}</span>
          <span class="spec-page spec-push">${r.page}</span>
        </li>`;
      }
      if (sp.id === "academic") {
        return `<li class="spec-row lvl-${r.level}">
          <span class="spec-num">${r.num}</span>
          <span>${r.title}</span>
          <span class="spec-leader" aria-hidden="true"></span>
          <span class="spec-page">${r.page}</span>
        </li>`;
      }
      return `<li class="spec-row lvl-${r.level}">
        <span class="spec-num">${r.num}</span>
        <span>${r.title}</span>
        <span class="spec-page spec-push">${r.page}</span>
      </li>`;
    })
    .join("");

  specimenPlate.innerHTML = `
    <div class="spec-sheet-head">
      <span class="spec-sheet-title" lang="en">CONTENTS</span>
      <span class="spec-sheet-sub" lang="en">${sp.en}</span>
    </div>
    <ul class="spec-rows">${rowsHtml}</ul>
  `;

  toggleAxisBtn.setAttribute("aria-pressed", String(specState.showAxis));
  toggleAxisBtn.textContent = `透视对齐轴线：${specState.showAxis ? "开" : "关"}`;
  toggleTabularBtn.setAttribute("aria-pressed", String(specState.tabular));
  toggleTabularBtn.textContent = `等宽页码：${specState.tabular ? "开" : "关"}`;
}

document.querySelectorAll("[data-spec]").forEach((btn) => {
  btn.addEventListener("click", () => {
    specState.active = btn.dataset.spec;
    renderSpecimen();
  });
});

toggleAxisBtn.addEventListener("click", () => {
  specState.showAxis = !specState.showAxis;
  renderSpecimen();
});

toggleTabularBtn.addEventListener("click", () => {
  specState.tabular = !specState.tabular;
  renderSpecimen();
});

renderSpecimen();

// =========================================================
// 4. 第 03 节：暗室跨栏眼动偏差实验
// =========================================================
let activeDarkId = "chasm";
const darkroomStage = createDarkroomStage(
  document.getElementById("darkroomCanvas"),
  () => activeDarkId
);

const darkCaseTag = document.getElementById("darkCaseTag");
const darkTitle = document.getElementById("darkTitle");
const darkSummary = document.getElementById("darkSummary");
const darkCorrection = document.getElementById("darkCorrection");
const darkFix = document.getElementById("darkFix");

function renderDarkCase() {
  const c = DARKROOM_CASES.find((x) => x.id === activeDarkId) || DARKROOM_CASES[0];
  document.querySelectorAll("[data-dark]").forEach((b) => {
    const on = b.dataset.dark === c.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  darkCaseTag.textContent = `${c.tag} · 典型跨距 ${c.spanMm}mm`;
  darkTitle.textContent = c.label;
  darkSummary.textContent = c.summary;
  darkCorrection.textContent = c.posterCorrection;
  darkFix.textContent = c.fixAdvice;
  darkroomStage.replay();
}

document.querySelectorAll("[data-dark]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeDarkId = btn.dataset.dark;
    renderDarkCase();
  });
});

document.getElementById("darkReplayBtn").addEventListener("click", () => darkroomStage.replay());
renderDarkCase();

// =========================================================
// 5. 第 04 节：历史演变标本翻页卡（定制微型矢量图板）
// =========================================================
const HISTORY_SVGS = {
  bamboo: `<svg viewBox="0 0 260 200" fill="none">
    <rect x="8" y="8" width="244" height="184" fill="#FAF9FF" stroke="#000" stroke-width="1.5"/>
    <g stroke="#0F1BE6" stroke-width="1.5">
      <line x1="210" y1="24" x2="210" y2="176"/><line x1="176" y1="24" x2="176" y2="176"/>
      <line x1="142" y1="24" x2="142" y2="176"/><line x1="108" y1="24" x2="108" y2="176"/>
      <line x1="74" y1="24" x2="74" y2="176"/>
    </g>
    <rect x="200" y="26" width="20" height="46" fill="#0F1BE6"/>
    <text x="210" y="44" fill="#FFF" font-size="11" text-anchor="middle" font-weight="700">辑</text>
    <text x="210" y="61" fill="#FFF" font-size="11" text-anchor="middle" font-weight="700">略</text>
    <g fill="#141626" font-size="11" text-anchor="middle" font-weight="700">
      <text x="176" y="48">六艺</text><text x="142" y="48">诸子</text>
      <text x="108" y="48">诗赋</text><text x="74" y="48">兵书</text>
    </g>
    <g stroke="#8A87A3" stroke-width="2">
      <line x1="176" y1="66" x2="176" y2="162"/><line x1="142" y1="66" x2="142" y2="152"/>
      <line x1="108" y1="66" x2="108" y2="160"/><line x1="74" y1="66" x2="74" y2="144"/>
    </g>
    <text x="22" y="176" fill="#0C17CC" font-size="10" font-family="DM Mono, monospace">26 BCE · SIX CATEGORIES</text>
  </svg>`,
  roman: `<svg viewBox="0 0 260 200" fill="none">
    <rect x="8" y="8" width="244" height="184" fill="#FAF9FF" stroke="#000" stroke-width="1.5"/>
    <text x="24" y="34" fill="#0F1BE6" font-size="13" font-family="EB Garamond, serif" font-weight="600">LIBER I · SUMMARIUM</text>
    <line x1="24" y1="44" x2="236" y2="44" stroke="#0F1BE6" stroke-width="1.5"/>
    <g fill="#141626" font-size="11" font-family="EB Garamond, serif">
      <text x="24" y="68">Lib. II — De mundo et elementis</text>
      <text x="24" y="92">Lib. III–VI — Geographia</text>
      <text x="24" y="116">Lib. VII — De homine</text>
      <text x="24" y="140">Lib. VIII–XI — Animalia</text>
      <text x="24" y="164">Lib. XXXIII–XXXVII — Metalla &amp; Ars</text>
    </g>
    <rect x="206" y="56" width="28" height="14" fill="#E3DFF7"/>
    <text x="220" y="67" fill="#0F1BE6" font-size="10" font-family="DM Mono, monospace" text-anchor="middle">77 CE</text>
  </svg>`,
  incunabula: `<svg viewBox="0 0 260 200" fill="none">
    <rect x="8" y="8" width="244" height="184" fill="#FAF9FF" stroke="#000" stroke-width="1.5"/>
    <rect x="30" y="26" width="166" height="148" fill="#E3DFF7" stroke="#8A87A3"/>
    <g stroke="#141626" stroke-width="2">
      <line x1="46" y1="50" x2="178" y2="50"/><line x1="46" y1="68" x2="170" y2="68"/>
      <line x1="46" y1="86" x2="176" y2="86"/><line x1="46" y1="104" x2="164" y2="104"/>
      <line x1="46" y1="122" x2="174" y2="122"/><line x1="46" y1="140" x2="154" y2="140"/>
    </g>
    <circle cx="222" cy="96" r="18" fill="#0F1BE6"/>
    <text x="222" y="100" fill="#FFF" font-size="12" font-family="DM Mono, monospace" text-anchor="middle">12</text>
    <line x1="196" y1="96" x2="204" y2="96" stroke="#0F1BE6" stroke-width="2"/>
    <text x="30" y="186" fill="#0C17CC" font-size="10" font-family="DM Mono, monospace">1470 COLOGNE · RECTO FOLIATION</text>
  </svg>`,
  chunks: `<svg viewBox="0 0 260 200" fill="none">
    <rect x="8" y="8" width="244" height="184" fill="#FAF9FF" stroke="#000" stroke-width="1.5"/>
    <text x="22" y="30" fill="#B81F26" font-size="11" font-weight="700">× 15 条散落：超出工作记忆负荷</text>
    <g fill="#B81F26" opacity="0.72">
      <rect x="22" y="38" width="10" height="10"/><rect x="36" y="38" width="10" height="10"/><rect x="50" y="38" width="10" height="10"/>
      <rect x="64" y="38" width="10" height="10"/><rect x="78" y="38" width="10" height="10"/><rect x="92" y="38" width="10" height="10"/>
      <rect x="106" y="38" width="10" height="10"/><rect x="120" y="38" width="10" height="10"/><rect x="134" y="38" width="10" height="10"/>
      <rect x="148" y="38" width="10" height="10"/><rect x="162" y="38" width="10" height="10"/><rect x="176" y="38" width="10" height="10"/>
      <rect x="190" y="38" width="10" height="10"/><rect x="204" y="38" width="10" height="10"/><rect x="218" y="38" width="10" height="10"/>
    </g>
    <text x="22" y="82" fill="#0F1BE6" font-size="11" font-weight="700">✓ 聚成 5 组 × 3 项（契合 4±1 组块）</text>
    <g stroke="#0F1BE6" stroke-width="1.5" fill="#E3DFF7">
      <rect x="22" y="92" width="40" height="72"/><rect x="68" y="92" width="40" height="72"/>
      <rect x="114" y="92" width="40" height="72"/><rect x="160" y="92" width="40" height="72"/>
      <rect x="206" y="92" width="32" height="72"/>
    </g>
    <g fill="#0F1BE6">
      <rect x="28" y="104" width="28" height="6"/><rect x="28" y="118" width="28" height="6"/><rect x="28" y="132" width="28" height="6"/>
      <rect x="74" y="104" width="28" height="6"/><rect x="74" y="118" width="28" height="6"/><rect x="74" y="132" width="28" height="6"/>
      <rect x="120" y="104" width="28" height="6"/><rect x="120" y="118" width="28" height="6"/><rect x="120" y="132" width="28" height="6"/>
      <rect x="166" y="104" width="28" height="6"/><rect x="166" y="118" width="28" height="6"/><rect x="166" y="132" width="28" height="6"/>
      <rect x="212" y="104" width="20" height="6"/><rect x="212" y="118" width="20" height="6"/><rect x="212" y="132" width="20" height="6"/>
    </g>
  </svg>`,
  modern: `<svg viewBox="0 0 260 200" fill="none">
    <rect x="8" y="8" width="244" height="184" fill="#FAF9FF" stroke="#000" stroke-width="1.5"/>
    <rect x="22" y="24" width="66" height="150" fill="#E3DFF7"/>
    <rect x="22" y="54" width="4" height="24" fill="#0F1BE6"/>
    <g fill="#0F1BE6" font-size="10" font-family="DM Mono, monospace">
      <text x="34" y="44">01 INTRO</text><text x="34" y="69" font-weight="700">02 METHOD</text>
      <text x="34" y="94">03 CASES</text><text x="34" y="119">04 QUIZ</text>
    </g>
    <rect x="104" y="28" width="130" height="14" fill="#0F1BE6"/>
    <g fill="#8A87A3">
      <rect x="104" y="54" width="122" height="6"/><rect x="104" y="68" width="108" height="6"/>
      <rect x="104" y="82" width="118" height="6"/><rect x="104" y="104" width="130" height="10" fill="#141626"/>
      <rect x="104" y="124" width="112" height="6"/><rect x="104" y="138" width="96" height="6"/>
    </g>
    <text x="104" y="168" fill="#0C17CC" font-size="10" font-family="DM Mono, monospace">SCANNABLE ANCHOR MAP</text>
  </svg>`,
};

const historySpecimen = document.getElementById("historySpecimen");
const histYearBig = document.getElementById("histYearBig");
const histPlace = document.getElementById("histPlace");
const histTitle = document.getElementById("histTitle");
const histSubtitle = document.getElementById("histSubtitle");
const histBody = document.getElementById("histBody");
const histSource = document.getElementById("histSource");

function renderHistory(id) {
  const item = HISTORY_STEPS.find((x) => x.id === id) || HISTORY_STEPS[0];
  document.querySelectorAll("[data-hist]").forEach((b) => {
    const on = b.dataset.hist === item.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  historySpecimen.innerHTML = HISTORY_SVGS[item.specimenKind] || "";
  histYearBig.textContent = item.year;
  histPlace.textContent = item.place;
  histTitle.textContent = item.title;
  histSubtitle.textContent = item.subtitle;
  histBody.textContent = item.body;
  histSource.textContent = item.sourceLabel;
}

document.querySelectorAll("[data-hist]").forEach((btn) => {
  btn.addEventListener("click", () => renderHistory(btn.dataset.hist));
});
renderHistory("han");

// =========================================================
// 6. 第 05 节：场景分诊翻牌 + 同系列 160–167 互链
// =========================================================
const triageGrid = document.getElementById("triageGrid");
const openedTriage = new Set(["leaflet", "course"]); // 预展两张对比卡，其余点击翻开

function renderTriage() {
  triageGrid.innerHTML = "";
  TRIAGE_CASES.forEach((tc) => {
    const isOpen = openedTriage.has(tc.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `triage-card${isOpen ? " is-open" : ""}`;
    btn.setAttribute("aria-expanded", String(isOpen));
    btn.innerHTML = `
      <div class="triage-top">
        <div>
          <h3>${tc.title}</h3>
          <div class="triage-meta">${tc.meta}</div>
        </div>
        <span class="triage-pill ${isOpen ? `is-${tc.verdictType}` : ""}">${isOpen ? tc.verdict : "点击研判"}</span>
      </div>
      ${
        isOpen
          ? `<p class="triage-reason">${tc.reason}</p>`
          : `<span class="triage-cue">展开查看该场景为什么用或不用目录 →</span>`
      }
    `;
    btn.addEventListener("click", () => {
      if (openedTriage.has(tc.id)) openedTriage.delete(tc.id);
      else openedTriage.add(tc.id);
      renderTriage();
    });
    triageGrid.append(btn);
  });
}
renderTriage();

const siblingList = document.getElementById("siblingList");
siblingList.innerHTML = SIBLING_PAGES.map(
  (s) =>
    `<li><a href="${s.url}">${s.id} ${s.name}</a><span>${s.role}</span></li>`
).join("");

// =========================================================
// 7. 第 06 节：严格单变量四选一排版判卷
// =========================================================
const quizPrompt = document.getElementById("quizPrompt");
const quizGrid = document.getElementById("quizGrid");
const quizFeedback = document.getElementById("quizFeedback");
quizPrompt.textContent = QUIZ_DATA.prompt;

const QUIZ_ROWS = [
  ["序论 · 十年街区脉络", "004"],
  ["空间 · 光影与灰空间", "020"],
  ["构造 · 节点与清水墙", "050"],
  ["人居 · 社区图书室", "080"],
  ["对谈 · 尺度圆桌纪要", "106"],
];

let pickedQuizKey = null;

function buildQuizMiniRows(mode) {
  return QUIZ_ROWS.map(([title, pg]) => {
    if (mode === "orphan") {
      return `<div class="qm-row is-orphan"><span class="qm-title">${title}</span><span class="qm-pg">${pg}</span></div>`;
    }
    if (mode === "heavy-dots") {
      return `<div class="qm-row is-heavy"><span class="qm-title">${title}</span><span class="qm-dots" aria-hidden="true"></span><span class="qm-pg">${pg}</span></div>`;
    }
    if (mode === "left-tabular") {
      return `<div class="qm-row is-left-tab"><span class="qm-pg">${pg}</span><span class="qm-title">${title}</span></div>`;
    }
    return `<div class="qm-row is-centered"><span class="qm-title">${title}</span><span class="qm-pg">${pg}</span></div>`;
  }).join("");
}

function renderQuiz() {
  quizGrid.innerHTML = "";
  QUIZ_DATA.options.forEach((opt) => {
    const picked = pickedQuizKey === opt.key;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    if (picked) btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-err");
    btn.dataset.quiz = opt.key;
    btn.innerHTML = `
      <div class="quiz-opt-head">
        <span class="quiz-letter">方案 ${opt.key}</span>
        <span class="quiz-state">${picked ? (opt.correct ? "✓ 扫读最稳" : "× 有隐患") : "点击选择"}</span>
      </div>
      <div class="quiz-mini-toc">${buildQuizMiniRows(opt.mode)}</div>
    `;
    btn.addEventListener("click", () => {
      pickedQuizKey = opt.key;
      renderQuiz();
      quizFeedback.className = `quiz-feedback ${opt.correct ? "is-ok" : "is-err"}`;
      quizFeedback.innerHTML = `<h3>${opt.feedbackTitle}</h3><p>${opt.feedbackBody}</p>`;
    });
    quizGrid.append(btn);
  });
}
renderQuiz();

// =========================================================
// 8. 第 07 节：原海报高清灯箱（只复用 #poster 的 src，绝不二次内联）
// =========================================================
const posterImg = document.getElementById("poster");
const posterOpenBtn = document.getElementById("posterOpenBtn");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lbViewport");
const lbImg = document.getElementById("lbImg");
const lbScaleVal = document.getElementById("lbScaleVal");
const lbClose = document.getElementById("lbClose");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbScaleVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => {
  lbScale = clamp(+(lbScale + 0.35).toFixed(2), 0.75, 3.5);
  applyLightboxTransform();
});
document.getElementById("lbZoomOut").addEventListener("click", () => {
  lbScale = clamp(+(lbScale - 0.35).toFixed(2), 0.75, 3.5);
  applyLightboxTransform();
});
document.getElementById("lbReset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  lbDragging = true;
  lbStartX = e.clientX - lbTx;
  lbStartY = e.clientY - lbTy;
  lbViewport.classList.add("is-dragging");
  lbViewport.setPointerCapture?.(e.pointerId);
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbTx = e.clientX - lbStartX;
  lbTy = e.clientY - lbStartY;
  applyLightboxTransform();
});

lbViewport.addEventListener("pointerup", () => {
  lbDragging = false;
  lbViewport.classList.remove("is-dragging");
});

lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = clamp(+(lbScale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2), 0.75, 3.5);
    applyLightboxTransform();
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});
