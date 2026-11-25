// 165 索引版式（INDEX LAYOUT）主控脚本
import {
  DATASETS,
  HIERARCHY_MODES,
  INITIAL_STATE,
  LOCATOR_MODES,
  PRESETS,
  SORT_MODES,
  XREF_MODES,
  getDataset,
} from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";

const state = { ...INITIAL_STATE };
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 1. 初始化开场交互控件 ====================
function renderValves() {
  const specs = [
    { key: "sortMode", items: SORT_MODES, traps: new Set(["unsorted", "overcut"]) },
    { key: "hierarchyMode", items: HIERARCHY_MODES, traps: new Set(["flat", "overload"]) },
    { key: "locatorMode", items: LOCATOR_MODES, traps: new Set(["glued", "heavy"]) },
    { key: "xrefMode", items: XREF_MODES, traps: new Set(["none", "broken", "spaghetti"]) },
  ];

  for (const sp of specs) {
    const host = $(`.valve-group[data-group="${sp.key}"]`);
    host.innerHTML = "";
    for (const item of sp.items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "valve-btn" + (sp.traps.has(item.id) ? " is-trap" : "") + (state[sp.key] === item.id ? " is-active" : "");
      btn.dataset.value = item.id;
      btn.textContent = item.label;
      btn.setAttribute("aria-pressed", String(state[sp.key] === item.id));
      btn.addEventListener("click", () => {
        state[sp.key] = item.id;
        syncAll();
      });
      host.appendChild(btn);
    }
  }
}

function renderPresets() {
  const host = $("#preset-row");
  host.innerHTML = "";
  for (const [key, p] of Object.entries(PRESETS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-btn" + (key.startsWith("trap") || key === "broken" ? " is-trap-preset" : "");
    btn.dataset.preset = key;
    btn.textContent = p.label;
    btn.addEventListener("click", () => {
      Object.assign(state, p.patch);
      syncAll();
    });
    host.appendChild(btn);
  }
}

function renderOuterSpine() {
  const spine = $("#fore-edge-spine");
  const ds = getDataset(state);
  const enabled = state.sortMode === "grouped" || state.sortMode === "overcut";
  spine.className = "fore-edge-spine" + (!enabled ? " is-off" : state.sortMode === "overcut" ? " is-overcut" : "");

  if (spine.childElementCount !== ds.groups.length) {
    spine.innerHTML = "";
    for (const g of ds.groups) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "spine-tab";
      btn.dataset.group = g.id;
      btn.textContent = g.id;
      btn.title = `${g.id} ${g.zh}`;
      btn.setAttribute("aria-label", `跳至 ${g.id} 组 ${g.zh}`);
      btn.addEventListener("click", () => selectGroup(g.id));
      spine.appendChild(btn);
    }
  }
  const curTerm = ds.terms.find((t) => t.id === state.selectedId);
  for (const btn of $$(".spine-tab", spine)) {
    const active = enabled && curTerm && btn.dataset.group === curTerm.group;
    btn.classList.toggle("is-active", !!active);
  }
}

let trailDatasetId = "";
function renderRelatedTrail() {
  const host = $("#related-trail");
  const ds = getDataset(state);
  if (trailDatasetId !== ds.id) {
    trailDatasetId = ds.id;
    const termById = new Map(ds.terms.map((t) => [t.id, t]));
    host.innerHTML = "";
    ds.trailIds.forEach((id, idx) => {
      const t = termById.get(id);
      if (!t) return;
      if (idx > 0) {
        const sep = document.createElement("span");
        sep.className = "trail-arrow";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "↔";
        host.appendChild(sep);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "trail-chip";
      btn.dataset.termId = id;
      btn.innerHTML = `${t.zh} <code>${t.id}</code>`;
      btn.addEventListener("click", () => {
        state.selectedId = id;
        state.targetId = id;
        const pos = ds.terms.findIndex((x) => x.id === id);
        if (pos >= 0) state.scrubPos = (pos + 0.5) / ds.terms.length;
        syncAll();
      });
      host.appendChild(btn);
    });
  }
  for (const btn of $$(".trail-chip", host)) {
    btn.classList.toggle("is-current", btn.dataset.termId === state.selectedId);
  }
}

function selectGroup(groupKey) {
  const ds = getDataset(state);
  const base = groupKey[0];
  const found = ds.terms.find((t) => t.group === base);
  if (found) {
    state.selectedId = found.id;
    const idx = ds.terms.findIndex((t) => t.id === found.id);
    state.scrubPos = (idx + 0.5) / ds.terms.length;
    syncAll();
  }
}

let lastFixPatch = null;

function syncUI(ev) {
  const ds = getDataset(state);

  // 顶栏状态徽
  const pill = $("#hero-status-pill");
  pill.textContent = ev.statusTag;
  pill.className = "status-pill " + (ev.allPass ? "status-pass" : "status-fail");

  // 原海报三原则实时灯
  const setPillar = (key, pass, text) => {
    const el = $(`.pillar-chip[data-pillar="${key}"]`);
    if (el) el.classList.toggle("is-pass", pass);
    const st = $(`#pillar-${key}-state`);
    if (st) st.textContent = text;
  };
  setPillar("lookup", ev.pillars.lookup === "pass", ev.pillars.lookup === "pass" ? `${ev.metrics.hierLabel}·清晰` : `${ev.metrics.hierLabel}·${ev.metrics.locLabel}`);
  setPillar("sort", ev.pillars.sort === "pass", ev.pillars.sort === "pass" ? `${ev.metrics.scanSteps} 步定位` : state.sortMode === "overcut" ? "14 槽过碎" : "乱序无切");
  setPillar("xref", ev.pillars.xref === "pass", ev.metrics.xrefLabel);

  // 诊单卡（全部读自同一份 ev）
  const diag = $("#diag-card");
  diag.classList.toggle("is-pass", ev.allPass);
  diag.classList.toggle("is-fail", !ev.allPass);
  $("#diag-tag").textContent = ev.statusTag;

  const fixWrap = $("#diag-fix-wrap");
  if (ev.allPass) {
    $("#diag-title").textContent = ev.solutionName;
    $("#diag-body").textContent = ev.solutionBody;
    fixWrap.hidden = true;
    lastFixPatch = null;
  } else {
    $("#diag-title").textContent = ev.primaryIssue.title;
    $("#diag-body").textContent = ev.primaryIssue.reason;
    fixWrap.hidden = false;
    $("#diag-fix-btn").textContent = ev.primaryIssue.fixLabel;
    lastFixPatch = ev.primaryIssue.fixPatch;
  }

  $("#m-steps").textContent = `${ev.metrics.scanSteps} 步`;
  $("#m-hier").textContent = ev.metrics.hierLabel;
  $("#m-loc").textContent = ev.metrics.locLabel;
  $("#m-xref").textContent = ev.metrics.xrefLabel;

  // 活体示例卡（原海报左下角 EXAMPLE）
  const sel = ev.selectedRow.term;
  const grp = ds.groups.find((g) => g.id === sel.group);
  $("#ex-bucket").textContent = grp ? `${grp.id} · ${grp.zh}` : sel.group;
  $("#ex-term-zh").textContent = sel.zh;
  $("#ex-term-id").textContent = sel.id;

  const refsEl = $("#ex-refs");
  refsEl.innerHTML = "";
  const labelSpan = document.createElement("span");
  labelSpan.textContent = "关联：";
  refsEl.appendChild(labelSpan);

  if (ev.selectedRefs.length === 0) {
    const none = document.createElement("span");
    none.textContent = "未建立交叉引用（孤岛）";
    refsEl.appendChild(none);
  } else {
    ev.selectedRefs.slice(0, 4).forEach((ref) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ex-ref-chip" + (ref.broken ? " is-broken" : "");
      b.textContent = ref.label;
      b.addEventListener("click", () => {
        const hit = ds.terms.find((t) => t.id === ref.toId);
        if (hit) {
          state.selectedId = hit.id;
          const idx = ds.terms.findIndex((t) => t.id === hit.id);
          state.scrubPos = (idx + 0.5) / ds.terms.length;
          syncAll();
        }
      });
      refsEl.appendChild(b);
    });
  }

  // 图例同步提示
  $("#legend-mode-tag").textContent =
    state.hierarchyMode === "dots"
      ? "三态圆点"
      : state.hierarchyMode === "indent"
        ? "缩进嵌套"
        : state.hierarchyMode === "overload"
          ? "过载警示"
          : "未启分层";

  renderOuterSpine();
  renderRelatedTrail();
}

const heroCanvasEl = $("#hero-canvas");
const heroStage = createHeroCanvas(heroCanvasEl, () => state, {
  onEvaluated(ev) {
    syncUI(ev);
  },
  onScrub(norm, termId) {
    state.scrubPos = norm;
    state.selectedId = termId;
  },
  onSelectGroup(key) {
    selectGroup(key);
  },
  onSelectTerm(termId) {
    state.selectedId = termId;
    const ds = getDataset(state);
    const idx = ds.terms.findIndex((t) => t.id === termId);
    if (idx >= 0) state.scrubPos = (idx + 0.5) / ds.terms.length;
    syncAll();
  },
  onPatch(patch) {
    Object.assign(state, patch);
    syncAll();
  },
});

function syncAll() {
  renderValves();
  heroStage.redraw();
}

$("#diag-fix-btn").addEventListener("click", () => {
  if (lastFixPatch) {
    Object.assign(state, lastFixPatch);
    syncAll();
  }
});

// 题材切换
$$(".ds-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.dataset;
    if (!DATASETS[id]) return;
    state.dataset = id;
    state.targetId = DATASETS[id].defaultTarget;
    state.selectedId = DATASETS[id].defaultTarget;
    $$(".ds-btn").forEach((b) => {
      const on = b.dataset.dataset === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    syncAll();
  });
});

// 换一个查词目标
$("#btn-next-target").addEventListener("click", () => {
  const ds = getDataset(state);
  const candidates = ["B03", "E01", "C02", "F02", "D01", "G03", "A01"];
  const cur = candidates.indexOf(state.targetId);
  const next = candidates[(cur + 1) % candidates.length];
  state.targetId = next;
  state.selectedId = next;
  const idx = ds.terms.findIndex((t) => t.id === next);
  if (idx >= 0) state.scrubPos = (idx + 0.5) / ds.terms.length;
  syncAll();
});

// 画布键盘操作（方向键 + A–G 直跳）
heroCanvasEl.addEventListener("keydown", (e) => {
  const ds = getDataset(state);
  const idx = Math.max(0, ds.terms.findIndex((t) => t.id === state.selectedId));
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    const next = ds.terms[(idx + 1) % ds.terms.length];
    state.selectedId = next.id;
    state.scrubPos = (((idx + 1) % ds.terms.length) + 0.5) / ds.terms.length;
    syncAll();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    const prev = ds.terms[(idx - 1 + ds.terms.length) % ds.terms.length];
    state.selectedId = prev.id;
    state.scrubPos = (((idx - 1 + ds.terms.length) % ds.terms.length) + 0.5) / ds.terms.length;
    syncAll();
  } else if (/^[a-g]$/i.test(e.key)) {
    e.preventDefault();
    selectGroup(e.key.toUpperCase());
  }
});

renderPresets();
syncAll();

// ==================== 2. 01 节：双栏寻词竞速模拟器 ====================
const RACE_WORDS = [
  { zh: "留白", bucket: 1, bucketLabel: "B", linearSlot: 15, inBucketSlot: 2 },
  { zh: "网格", bucket: 4, bucketLabel: "E", linearSlot: 17, inBucketSlot: 0 },
  { zh: "索引", bucket: 5, bucketLabel: "F", linearSlot: 13, inBucketSlot: 1 },
  { zh: "基线", bucket: 4, bucketLabel: "E", linearSlot: 19, inBucketSlot: 1 },
  { zh: "焦点", bucket: 6, bucketLabel: "G", linearSlot: 20, inBucketSlot: 2 },
];
let raceWordIdx = 0;
let raceTimer = null;

function buildRaceGrid() {
  const lin = $("#race-lin-track");
  const idx = $("#race-idx-track");
  lin.innerHTML = "";
  idx.innerHTML = "";
  for (let i = 0; i < 21; i++) {
    const c1 = document.createElement("div");
    c1.className = "race-cell";
    c1.textContent = String(i + 1).padStart(2, "0");
    lin.appendChild(c1);

    const g = Math.floor(i / 3);
    const n = (i % 3) + 1;
    const c2 = document.createElement("div");
    c2.className = "race-cell";
    c2.textContent = `${"ABCDEFG"[g]}${n}`;
    idx.appendChild(c2);
  }
}

function updateRaceStats(animated = false) {
  const w = RACE_WORDS[raceWordIdx];
  const totalN = Number($("#race-size").value);
  $("#race-size-val").textContent = String(totalN);
  const linSteps = Math.max(1, Math.round(((w.linearSlot + 1) / 21) * totalN));
  const bucketSize = Math.max(3, Math.round(totalN / 7));
  const idxSteps = 1 + Math.max(1, Math.round(((w.inBucketSlot + 1) / 3) * Math.min(bucketSize, Math.ceil(Math.log2(bucketSize) + 2))));

  $("#race-lin-stat").textContent = `需扫过约 ${linSteps} 条（总 ${totalN} 条）`;
  $("#race-idx-stat").textContent = `1 跳入 ${w.bucketLabel} 切口 + 约 ${idxSteps - 1} 步定位（示意）`;

  const linCells = $$("#race-lin-track .race-cell");
  const idxCells = $$("#race-idx-track .race-cell");
  linCells.forEach((c) => (c.className = "race-cell"));
  idxCells.forEach((c) => (c.className = "race-cell"));

  if (raceTimer) clearInterval(raceTimer);

  const targetIdxCell = w.bucket * 3 + w.inBucketSlot;
  if (!animated) {
    for (let i = 0; i < w.linearSlot; i++) linCells[i].classList.add("is-scanned");
    linCells[w.linearSlot].classList.add("is-hit");
    for (let k = 0; k < 3; k++) idxCells[w.bucket * 3 + k].classList.add("is-bucket");
    idxCells[targetIdxCell].classList.add("is-hit");
    return;
  }

  let step = 0;
  // 索引路先一步亮出整桶，第 2 步直达目标；线性路要一步步扫过十几格
  for (let k = 0; k < 3; k++) idxCells[w.bucket * 3 + k].classList.add("is-bucket");
  raceTimer = setInterval(() => {
    if (step === 1) idxCells[targetIdxCell].classList.add("is-hit");
    if (step < w.linearSlot) {
      linCells[step].classList.add("is-scanned");
    } else if (step === w.linearSlot) {
      linCells[step].classList.add("is-hit");
      clearInterval(raceTimer);
      raceTimer = null;
    }
    step++;
  }, 65);
}

(() => {
  buildRaceGrid();
  const host = $("#race-word-btns");
  RACE_WORDS.forEach((w, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "race-word-btn" + (i === 0 ? " is-active" : "");
    b.textContent = w.zh;
    b.addEventListener("click", () => {
      raceWordIdx = i;
      $$(".race-word-btn", host).forEach((el, k) => el.classList.toggle("is-active", k === i));
      updateRaceStats(true);
    });
    host.appendChild(b);
  });
  $("#race-size").addEventListener("input", () => updateRaceStats(false));
  $("#race-run-btn").addEventListener("click", () => updateRaceStats(true));
  updateRaceStats(false);
})();

// ==================== 3. 02 节：索引历史五个切口 ====================
const ERAS = [
  {
    year: "1230s",
    short: "全词字母索引",
    place: "1230 年代 · 巴黎圣雅各修院",
    title: "圣谢尔的休与第一部《圣经》全词字母索引",
    body: "13 世纪欧洲大学和讲道修士急需在厚重手抄本里快速核对词句。圣谢尔的休（Hugh of Saint-Cher）组织修士把整部拉丁文《圣经》拆成按字母表排列的词条清单（Concordance），标出所在章段；同期牛津的罗伯特·格罗斯泰斯特（Robert Grosseteste）则以主题符号编纂《Tabula》。人类第一次用与原文顺序无关的字母骨架来随机检索文本。",
    source: "核实来源：Dennis Duncan, Index, A History of the（英国 Allen Lane 2021 / 美国 W. W. Norton 2022）。",
    svg: `<svg viewBox="0 0 360 190" role="img" aria-label="1230年代字母全词索引版面示意">
      <rect x="6" y="6" width="348" height="178" rx="4" fill="#F7F7F3" stroke="#CBD2CE"/>
      <text x="24" y="34" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">CONCORDANTIAE · A — Z</text>
      <line x1="24" y1="44" x2="336" y2="44" stroke="#0C7854" stroke-width="1.5"/>
      <text x="24" y="68" font-family="Libre Baskerville, serif" font-size="14" font-weight="700" fill="#0E1110">A</text>
      <text x="48" y="68" font-family="Space Mono, monospace" font-size="11" fill="#424B48">Abyssus ........ Gen 1:2 · Ps 42:7</text>
      <text x="48" y="88" font-family="Space Mono, monospace" font-size="11" fill="#424B48">Anima .......... Job 12:10 · Ps 23:3</text>
      <text x="24" y="120" font-family="Libre Baskerville, serif" font-size="14" font-weight="700" fill="#0E1110">L</text>
      <text x="48" y="120" font-family="Space Mono, monospace" font-size="11" fill="#424B48">Lux ............ Gen 1:3 · Joh 8:12</text>
      <rect x="24" y="142" width="312" height="28" rx="3" fill="#E2F1EB"/>
      <text x="34" y="160" font-family="Noto Sans SC, sans-serif" font-size="11.5" font-weight="700" fill="#095C40">突破：脱离正文先后顺序，用确定字母序直达章段</text>
    </svg>`,
  },
  {
    year: "1615 / 1716",
    short: "214 部首笔画",
    place: "明万历四十三年（1615）· 清康熙五十五年（1716）",
    title: "梅膺祚《字汇》创立 214 部首，《康熙字典》承袭定型",
    body: "汉字不是拼音文字，无法直接套用拉丁字母表。明代学者梅膺祚在 1615 年刊行的《字汇》里，把东汉许慎《说文解字》繁复的 540 个篆书部首归并为楷书 214 部首，并首创“部首按笔画排、同部汉字亦按笔画排”的二维检字结构。百年后清代官修《康熙字典》（1716）沿袭并确立这一体系，影响汉语辞书至今。",
    source: "核实来源：故宫博物院古籍馆藏资料及《字汇》《康熙字典》版本考证。",
    svg: `<svg viewBox="0 0 360 190" role="img" aria-label="214部首与笔画检字结构示意">
      <rect x="6" y="6" width="348" height="178" rx="4" fill="#F7F7F3" stroke="#CBD2CE"/>
      <rect x="20" y="20" width="84" height="148" fill="#0C7854" rx="3"/>
      <text x="62" y="54" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">三画</text>
      <text x="62" y="82" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="13" fill="#E2F1EB">口 · 土 · 山</text>
      <text x="62" y="112" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">四画</text>
      <text x="62" y="138" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="13" fill="#E2F1EB">心 · 手 · 木</text>
      <text x="122" y="46" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700" fill="#0E1110">第一跳：按部首笔画找「木」部（四画）</text>
      <text x="122" y="76" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#424B48">余 3 画：杆 · 杉 · 李</text>
      <text x="122" y="100" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#424B48">余 4 画：松 · 板 · 林 · 果</text>
      <rect x="122" y="118" width="214" height="38" rx="3" fill="#E2F1EB"/>
      <text x="132" y="141" font-family="Noto Sans SC, sans-serif" font-size="11.5" font-weight="700" fill="#095C40">二维分桶：214 部首 × 剩余笔画数</text>
    </svg>`,
  },
  {
    year: "1863–1870s",
    short: "物理书口切口",
    place: "19 世纪下半叶 · 欧美大辞书与账簿",
    title: "书口切口（Thumb Index）把索引刻进书页边缘",
    body: "19 世纪辞书、百科和地图集越印越厚，1863 年地图集已出现书口切口广告，随后 Charles Halbert Denison 发明并取得书口半圆切口专利（Denison's Patent Index），死后由其遗孀 Dimies T. Stocking Denison 延续经营。圆弧切口让读者的拇指不用先翻开目录，一摸书口就能直接弹开目标字母段——这正是 165 原海报右侧翡翠绿斜切条的原型。",
    source: "核实来源：Thumb index 与 Charles Halbert Denison 专利及装帧史料。",
    svg: `<svg viewBox="0 0 360 190" role="img" aria-label="物理书口半圆切口索引示意">
      <rect x="20" y="16" width="270" height="158" rx="4" fill="#FFFFFF" stroke="#AAB5B0" stroke-width="1.5"/>
      <path d="M290 16 L336 16 L336 174 L290 174 Z" fill="#0C7854"/>
      <circle cx="290" cy="42" r="13" fill="#FFFFFF" stroke="#0C7854" stroke-width="1.5"/>
      <circle cx="290" cy="74" r="13" fill="#095C40"/>
      <circle cx="290" cy="106" r="13" fill="#FFFFFF" stroke="#0C7854" stroke-width="1.5"/>
      <circle cx="290" cy="138" r="13" fill="#FFFFFF" stroke="#0C7854" stroke-width="1.5"/>
      <text x="313" y="46" text-anchor="middle" font-family="Archivo, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF">A</text>
      <text x="313" y="78" text-anchor="middle" font-family="Archivo, sans-serif" font-size="12" font-weight="900" fill="#7BE4BC">B</text>
      <text x="313" y="110" text-anchor="middle" font-family="Archivo, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF">C</text>
      <text x="313" y="142" text-anchor="middle" font-family="Archivo, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF">D</text>
      <text x="38" y="54" font-family="Noto Sans SC, sans-serif" font-size="14" font-weight="900" fill="#0E1110">把视觉分类变成触觉切口</text>
      <line x1="38" y1="74" x2="255" y2="74" stroke="#0C7854" stroke-width="1.6" stroke-dasharray="4 3"/>
      <text x="38" y="102" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#424B48">拇指一按 B 槽，直接掀开对应页段</text>
      <text x="38" y="128" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#424B48">165 原海报右缘绿脊即源于此工艺</text>
    </svg>`,
  },
  {
    year: "1925",
    short: "四角号码检字",
    place: "1925 年 · 上海商务印书馆",
    title: "王云五创制「四角号码」，用数字编码绕开部首争议",
    body: "传统部首查字常让人拿不准一个难字归哪一部。1925 年出版家王云五受电报码启发，把汉字笔形归成 0–9 十类，依左上、右上、左下、右下四角取码编成四位（及附角五位）数字。它证明了：只要检索键足够确定、无歧义，视觉版式就能把任何复杂信息压缩成纯坐标直查。",
    source: "核实来源：王云五《号码检字法》（1925）与商务印书馆辞书出版史。",
    svg: `<svg viewBox="0 0 360 190" role="img" aria-label="四角号码笔形编码示意">
      <rect x="6" y="6" width="348" height="178" rx="4" fill="#F7F7F3" stroke="#CBD2CE"/>
      <rect x="34" y="34" width="112" height="112" fill="#FFFFFF" stroke="#0C7854" stroke-width="2" rx="4"/>
      <text x="90" y="114" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="68" font-weight="900" fill="#0E1110">索</text>
      <circle cx="34" cy="34" r="12" fill="#0C7854"/><text x="34" y="38" text-anchor="middle" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#FFFFFF">4</text>
      <circle cx="146" cy="34" r="12" fill="#0C7854"/><text x="146" y="38" text-anchor="middle" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#FFFFFF">0</text>
      <circle cx="34" cy="146" r="12" fill="#0C7854"/><text x="34" y="150" text-anchor="middle" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#FFFFFF">9</text>
      <circle cx="146" cy="146" r="12" fill="#0C7854"/><text x="146" y="150" text-anchor="middle" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#FFFFFF">0</text>
      <text x="174" y="64" font-family="Space Mono, monospace" font-size="22" font-weight="700" fill="#0C7854">4090<tspan dy="5" font-size="13">3</tspan></text>
      <text x="174" y="96" font-family="Noto Sans SC, sans-serif" font-size="12.5" fill="#424B48">跳过「到底归十部还是糸部」</text>
      <text x="174" y="118" font-family="Noto Sans SC, sans-serif" font-size="12.5" fill="#424B48">直接用确定数字坐标定位词条</text>
    </svg>`,
  },
  {
    year: "1975 / 1996",
    short: "ISO 999 与 CMOS",
    place: "1975 首版 · 1996 修订 · 现代出版排印规范",
    title: "ISO 999 与《芝加哥格式手册》固化现代索引排印语法",
    body: "国际标准化组织在 1975 年推出 ISO 999，并于 1996 年全面修订为《信息与文献——索引编制规则》（ISO 999:1996），覆盖纸书与电子索引；同时《芝加哥格式手册》第 16 章明确了现代书后索引的双栏窄列、左齐右不齐（ragged right）、齐左悬垂缩进、缩进式与接排式区分，以及用斜体标出 see / see also 交叉引用。",
    source: "核实来源：ISO 999:1996（iso.org/standard/5446.html）与 The Chicago Manual of Style 第 17 版第 16 章。",
    svg: `<svg viewBox="0 0 360 190" role="img" aria-label="ISO 999 与芝加哥格式手册现代双栏索引规范示意">
      <rect x="6" y="6" width="348" height="178" rx="4" fill="#FFFFFF" stroke="#CBD2CE"/>
      <text x="20" y="30" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#0C7854">ISO 999:1996 · CMOS 16.24–16.26</text>
      <line x1="20" y1="38" x2="340" y2="38" stroke="#CBD2CE"/>
      <text x="20" y="60" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#0E1110">网格系统, 42, 88</text>
      <text x="34" y="79" font-family="Noto Sans SC, sans-serif" font-size="11.5" fill="#424B48">基线对齐, 91–94</text>
      <text x="34" y="98" font-family="Noto Sans SC, sans-serif" font-size="11.5" fill="#424B48">栏间间距, 102</text>
      <text x="34" y="117" font-family="Libre Baskerville, serif" font-style="italic" font-size="11.5" fill="#095C40">See also 留白; 模块</text>
      <line x1="184" y1="48" x2="184" y2="164" stroke="#CBD2CE" stroke-dasharray="3 3"/>
      <text x="198" y="64" font-family="Noto Sans SC, sans-serif" font-size="11.5" font-weight="700" fill="#095C40">✓ 双栏窄列 + 左齐右不齐</text>
      <text x="198" y="88" font-family="Noto Sans SC, sans-serif" font-size="11.5" font-weight="700" fill="#095C40">✓ 1em 缩进明晰从属</text>
      <text x="198" y="112" font-family="Noto Sans SC, sans-serif" font-size="11.5" font-weight="700" fill="#095C40">✓ 斜体分离交叉引用</text>
      <text x="198" y="136" font-family="Noto Sans SC, sans-serif" font-size="11.5" font-weight="700" fill="#095C40">✓ 不在数字间乱断行</text>
    </svg>`,
  },
];

(() => {
  const tabsHost = $("#era-tabs");
  function showEra(i) {
    const e = ERAS[i];
    $("#era-year").textContent = e.place;
    $("#era-title").textContent = e.title;
    $("#era-body").textContent = e.body;
    $("#era-source").textContent = e.source;
    $("#era-specimen").innerHTML = e.svg;
    $$(".era-tab", tabsHost).forEach((t, k) => {
      t.classList.toggle("is-active", k === i);
      t.setAttribute("aria-selected", String(k === i));
    });
  }
  ERAS.forEach((e, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "era-tab";
    btn.role = "tab";
    btn.innerHTML = `<span>${e.year}</span><strong>${e.short}</strong>`;
    btn.addEventListener("click", () => showEra(i));
    tabsHost.appendChild(btn);
  });
  showEra(0);
})();

// ==================== 4. 03 节：深翠暗室排印解剖对比台 ====================
const anatState = { substyle: "indented", align: "ragged", xrefstyle: "italic" };

function renderAnatomy() {
  const seeCls = anatState.xrefstyle === "italic" ? "spec-see-italic" : "spec-see-plain";
  const colCls = "spec-col" + (anatState.align === "justify" ? " is-justify" : "");

  const renderGroup = (letter, main, mainLoc, subs, seeText) => {
    let body = "";
    if (anatState.substyle === "indented") {
      body = `
        <div class="spec-entry">
          <div class="spec-line"><span class="spec-main">${main}</span>, <span class="spec-loc">${mainLoc}</span></div>
          ${subs.map((s) => `<div class="spec-line spec-sub">${s.label}, <span class="spec-loc">${s.loc}</span></div>`).join("")}
          <div class="spec-line spec-sub"><span class="${seeCls}">See also</span> ${seeText}</div>
        </div>`;
    } else {
      body = `
        <div class="spec-entry">
          <div class="spec-line"><span class="spec-main">${main}</span>: <span class="spec-runin">${subs.map((s) => `${s.label}, <span class="spec-loc">${s.loc}</span>`).join("; ")}.</span> <span class="${seeCls}">See also</span> ${seeText}</div>
        </div>`;
    }
    return `<div class="${colCls}"><div class="spec-head-letter">${letter}</div>${body}</div>`;
  };

  $("#anatomy-sheet").innerHTML = `<div class="spec-cols">
    ${renderGroup("B", "版式结构", "24", [
      { label: "版心与天头地脚", loc: "26–29" },
      { label: "多栏宽窄控制", loc: "31" },
      { label: "留白呼吸比例", loc: "35, 84" },
    ], "网格; 间距")}
    ${renderGroup("E", "网格系统", "78", [
      { label: "基线跨栏对齐", loc: "82–85" },
      { label: "栏距与模块节奏", loc: "88" },
      { label: "窄列断行规则", loc: "92" },
    ], "对齐; 留白")}
  </div>`;

  let title = "";
  let text = "";
  if (anatState.align === "justify") {
    title = "警示：窄栏强制两端对齐，拉出了刺眼的“字间河流”";
    text = "《芝加哥格式手册》明令书后索引必须「左齐右不齐（ragged right）」。索引单栏往往只有几厘米宽，硬推两端对齐会把词条和页码强行扯开，扫读时视线像踩进坑洼，极易看错行。";
  } else if (anatState.substyle === "runin") {
    title = "接排式（CMOS 16.25）：极省版面，适合只有一层子目的学术书";
    text = "子词条接在主词条后面用分号隔开，比缩进式节省近 30%–40% 纵向空间（经验值），常用于篇幅紧张的大学出版社专著；但一旦子目超过一层或需要极快扫读，就不如缩进式一目了然。";
  } else if (anatState.xrefstyle === "plain") {
    title = "提示：交叉引用指令与词条同体，跳读时容易误认成词条";
    text = "把 See also 设为斜体（中文常用括注或细仿宋/绿标），是为了在眼动扫过行尾的 0.1 秒内就分清：这句不是新的知识点，而是带你跳转去别处的路标。";
  } else {
    title = "规范示范：缩进式（CMOS 16.26）+ 左齐右不齐 + 斜体交叉引用";
    text = "每条子目另起一行缩进 1em，左侧垂直线天然长出两级树状层级；右缘自然不齐保证字距均匀；斜体 See also 与等宽页码清楚分离内容、指令与坐标，是技术文档与工具书最稳健的排法。";
  }

  $("#anatomy-diagnosis").innerHTML = `<h3>${title}</h3><p>${text}</p>`;
}

$$(".anat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    for (const key of ["substyle", "align", "xrefstyle"]) {
      if (btn.dataset[key]) {
        anatState[key] = btn.dataset[key];
        $$(`.anat-btn[data-${key}]`).forEach((b) => b.classList.toggle("is-active", b === btn));
      }
    }
    renderAnatomy();
  });
});
renderAnatomy();

// ==================== 5. 04 节：同类出版功能页 160–167 分诊器 ====================
const FAMILY = [
  { id: "160", name: "封面版式", role: "第一眼建立气质与主题预期，决定读者愿不愿意伸手拿起来。", tags: ["browse"] },
  { id: "161", name: "章节扉页", role: "在两章之间停顿换气，宣告内容切换与章节核心情绪。", tags: ["pause"] },
  { id: "162", name: "栏目开启页", role: "报刊或杂志的常设栏目标识，告诉读者“进到固定频道了”。", tags: ["pause"] },
  { id: "163", name: "特写跨页", role: "用跨边大视觉把主体推到眼前，主打情绪与细节冲击。", tags: ["visual"] },
  { id: "164", name: "目录版式", role: "书前的线性章节地图，按作者安排的顺序总览全书结构。", tags: ["outline"] },
  { id: "165", name: "索引版式（本页）", role: "书后或工具页的非连续检索器，带关键词两跳直达并追溯关联。", tags: ["lookup"], self: true },
  { id: "166", name: "图录版式", role: "以规整图片矩阵编目陈列，适合靠长相和样式找物的画册。", tags: ["visual"] },
  { id: "167", name: "引语主导版式", role: "放大一句核心金句作视觉焦点，浓缩整篇观点的情绪钩子。", tags: ["pause"] },
];

const TRIAGE = [
  { id: "lookup", label: "“忘了在第几章，只想立刻查「基线」和相关词”" },
  { id: "outline", label: "“刚拿到新书，想先按顺序看全书讲哪几章”" },
  { id: "visual", label: "“叫不出名字，想靠器物外观或大图挑着看”" },
  { id: "pause", label: "“想给长阅读切出节奏停顿和栏目标记”" },
];
let activeTriage = "lookup";

function renderFamily() {
  const grid = $("#family-grid");
  grid.innerHTML = "";
  for (const f of FAMILY) {
    const match = f.tags.includes(activeTriage);
    const card = document.createElement("article");
    card.className = "fam-card" + (f.self ? " is-self" : "") + (match ? " is-match" : "");
    card.innerHTML = `
      <div class="fam-top"><span class="fam-no">NO. ${f.id}</span>${match ? '<span class="fam-no">✓ 匹配</span>' : ""}</div>
      <h3>${f.name}</h3>
      <p>${f.role}</p>
      ${f.self ? '<span class="fam-no">当前页面</span>' : `<a class="fam-link" href="https://layout.xiaoxiaodong.ai/${f.id}/play/" target="_blank" rel="noopener">去看 ${f.id} 互动页 →</a>`}
    `;
    grid.appendChild(card);
  }
}

(() => {
  const host = $("#triage-prompts");
  TRIAGE.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "triage-btn" + (t.id === activeTriage ? " is-active" : "");
    b.textContent = t.label;
    b.addEventListener("click", () => {
      activeTriage = t.id;
      $$(".triage-btn", host).forEach((el) => el.classList.toggle("is-active", el === b));
      renderFamily();
    });
    host.appendChild(b);
  });
  renderFamily();
})();

// ==================== 6. 05 节：适用度自查勾选器 ====================
function updateChecklist() {
  const checks = new Set($$("#checklist-items input:checked").map((el) => el.value));
  const v = $("#checklist-verdict");
  const adv = $("#checklist-advice");

  if (!checks.has("volume") && !checks.has("known")) {
    v.textContent = "不必建索引";
    v.className = "checklist-verdict is-skip";
    adv.textContent = "篇幅轻、又不是带着词名回查的场景，强加索引只会增加一层无用的查找壳；用清晰标题或简洁目录更省心。";
  } else if (!checks.has("sync")) {
    v.textContent = "慎用编码索引 · 谨防死链";
    v.className = "checklist-verdict is-skip";
    adv.textContent = "内容确实有检索需求，但若页码和关联码全靠手工维护，改版一次就会出现错码死链。建议先打通自动页码/链接同步，或改用不依赖页码的轻量关键词分类表。";
  } else if (checks.has("volume") && checks.has("known") && checks.has("cross")) {
    v.textContent = "强烈推荐：切口分桶 + 交叉引用索引";
    v.className = "checklist-verdict";
    adv.textContent = "四项条件全中！大词量、明确关键词回查、跨章节关联且可同步维护，正是 165 索引版式威力最大的主战场。";
  } else if (checks.has("volume") && checks.has("known")) {
    v.textContent = "推荐：标准字母/分类索引";
    v.className = "checklist-verdict";
    adv.textContent = "适合采用书口切口或标准双栏字母索引，把定位速度拉满；如果概念之间关联不强，关联推荐栏可以精简，避免硬凑凑数链接。";
  } else {
    v.textContent = "推荐用 164 目录版式替代";
    v.className = "checklist-verdict is-skip";
    adv.textContent = "如果读者更需要从头理解全书脉络、而不是带着名词查词，把空间交给书前目录（164）比塞一张书后索引更合算。";
  }
}
$$("#checklist-items input").forEach((el) => el.addEventListener("change", updateChecklist));
updateChecklist();

// ==================== 7. 06 节：单变量 SVG 排印四选一练习 ====================
const QUIZ_OPTIONS = [
  {
    id: "A",
    tag: "样张 A",
    correct: true,
    why: "正确！样张 A 完全契合双栏窄列书后索引原则（CMOS 16.24/16.26 与 ISO 999）：左齐右不齐杜绝字间撕裂，1em 悬垂缩进一眼分清主次词条，窄栏内页码紧随词尾不添长线噪点，斜体 See also 干净分离跳转指令与词条。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 156" aria-hidden="true">
      <text x="12" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">G</text>
      <line x1="12" y1="25" x2="104" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="12" y="42" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110">网格系统, <tspan font-family="Space Mono, monospace" fill="#095C40">42</tspan></text>
      <text x="24" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">基线对齐, <tspan font-family="Space Mono, monospace" fill="#095C40">44</tspan></text>
      <text x="24" y="75" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">栏间间距, <tspan font-family="Space Mono, monospace" fill="#095C40">48</tspan></text>
      <text x="24" y="92" font-family="Libre Baskerville, serif" font-style="italic" font-size="9" fill="#095C40">See also 留白</text>
      <text x="12" y="114" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110">留白比例, <tspan font-family="Space Mono, monospace" fill="#095C40">61</tspan></text>
      <text x="24" y="131" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">版心边距, <tspan font-family="Space Mono, monospace" fill="#095C40">63</tspan></text>
      <line x1="112" y1="12" x2="112" y2="144" stroke="#D4DAD7" stroke-dasharray="2 2"/>
      <text x="120" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">H</text>
      <line x1="120" y1="25" x2="208" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="120" y="42" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110">层级秩序, <tspan font-family="Space Mono, monospace" fill="#095C40">72</tspan></text>
      <text x="132" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">字级阶梯, <tspan font-family="Space Mono, monospace" fill="#095C40">74</tspan></text>
      <text x="132" y="75" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">焦点落位, <tspan font-family="Space Mono, monospace" fill="#095C40">79</tspan></text>
      <text x="132" y="92" font-family="Libre Baskerville, serif" font-style="italic" font-size="9" fill="#095C40">See also 标题</text>
    </svg>`,
  },
  {
    id: "B",
    tag: "样张 B",
    correct: false,
    why: "样张 B 错在把窄栏强行两端对齐：为了撑满左右两边，字与字、词与页码之间被撕出大片不规则空白洞（“字间河流”），眼睛扫读窄栏时反复踩空。书后索引规范要求左齐右不齐。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 156" aria-hidden="true">
      <text x="12" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">G</text>
      <line x1="12" y1="25" x2="104" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="12" y="42" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110" textLength="92" lengthAdjust="spacing">网 格 系 统  42</text>
      <text x="24" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48" textLength="80" lengthAdjust="spacing">基 线 对 齐  44</text>
      <text x="24" y="75" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48" textLength="80" lengthAdjust="spacing">栏 间 间 距  48</text>
      <text x="24" y="92" font-family="Libre Baskerville, serif" font-style="italic" font-size="9" fill="#095C40" textLength="80" lengthAdjust="spacing">See  also  留白</text>
      <text x="12" y="114" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110" textLength="92" lengthAdjust="spacing">留 白 比 例  61</text>
      <text x="24" y="131" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48" textLength="80" lengthAdjust="spacing">版 心 边 距  63</text>
      <line x1="112" y1="12" x2="112" y2="144" stroke="#D4DAD7" stroke-dasharray="2 2"/>
      <text x="120" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">H</text>
      <line x1="120" y1="25" x2="208" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="120" y="42" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110" textLength="88" lengthAdjust="spacing">层 级 秩 序  72</text>
      <text x="132" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48" textLength="76" lengthAdjust="spacing">字 级 阶 梯  74</text>
      <text x="132" y="75" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48" textLength="76" lengthAdjust="spacing">焦 点 落 位  79</text>
    </svg>`,
  },
  {
    id: "C",
    tag: "样张 C",
    correct: false,
    why: "样张 C 错在抹平了全部缩进与字重层级：主词条「网格系统」和从属子目「基线对齐」「栏间间距」全部齐左同重，读者会误以为它们是平级主词条，失去树状检索锚点。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 156" aria-hidden="true">
      <text x="12" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">G</text>
      <line x1="12" y1="25" x2="104" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="12" y="42" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">网格系统, 42</text>
      <text x="12" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">基线对齐, 44</text>
      <text x="12" y="75" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">栏间间距, 48</text>
      <text x="12" y="92" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">See also 留白</text>
      <text x="12" y="114" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">留白比例, 61</text>
      <text x="12" y="131" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">版心边距, 63</text>
      <line x1="112" y1="12" x2="112" y2="144" stroke="#D4DAD7" stroke-dasharray="2 2"/>
      <text x="120" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">H</text>
      <line x1="120" y1="25" x2="208" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="120" y="42" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">层级秩序, 72</text>
      <text x="120" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">字级阶梯, 74</text>
      <text x="120" y="75" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">焦点落位, 79</text>
    </svg>`,
  },
  {
    id: "D",
    tag: "样张 D",
    correct: false,
    why: "样张 D 错在窄栏里硬塞粗黑实线引导并把页码推去远端：粗重横线占掉过多墨量，形成刺眼斑马条纹压过文字主体。窄栏书后索引适合页码紧随词尾；宽表才用克制的疏点引导线。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 156" aria-hidden="true">
      <text x="12" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">G</text>
      <line x1="12" y1="25" x2="104" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="12" y="42" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110">网格</text>
      <line x1="36" y1="39" x2="86" y2="39" stroke="#0E1110" stroke-width="2.4"/>
      <text x="90" y="42" font-family="Space Mono, monospace" font-size="9.5" fill="#0E1110">42</text>
      <text x="24" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">基线</text>
      <line x1="46" y1="56" x2="86" y2="56" stroke="#0E1110" stroke-width="2.4"/>
      <text x="90" y="59" font-family="Space Mono, monospace" font-size="9.5" fill="#0E1110">44</text>
      <text x="24" y="75" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">间距</text>
      <line x1="46" y1="72" x2="86" y2="72" stroke="#0E1110" stroke-width="2.4"/>
      <text x="90" y="75" font-family="Space Mono, monospace" font-size="9.5" fill="#0E1110">48</text>
      <text x="12" y="114" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110">留白</text>
      <line x1="36" y1="111" x2="86" y2="111" stroke="#0E1110" stroke-width="2.4"/>
      <text x="90" y="114" font-family="Space Mono, monospace" font-size="9.5" fill="#0E1110">61</text>
      <line x1="112" y1="12" x2="112" y2="144" stroke="#D4DAD7" stroke-dasharray="2 2"/>
      <text x="120" y="20" font-family="Archivo, sans-serif" font-size="13" font-weight="900" fill="#0C7854">H</text>
      <line x1="120" y1="25" x2="208" y2="25" stroke="#0C7854" stroke-width="1.2"/>
      <text x="120" y="42" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700" fill="#0E1110">层级</text>
      <line x1="144" y1="39" x2="190" y2="39" stroke="#0E1110" stroke-width="2.4"/>
      <text x="194" y="42" font-family="Space Mono, monospace" font-size="9.5" fill="#0E1110">72</text>
      <text x="132" y="59" font-family="Noto Sans SC, sans-serif" font-size="9.5" fill="#424B48">字级</text>
      <line x1="154" y1="56" x2="190" y2="56" stroke="#0E1110" stroke-width="2.4"/>
      <text x="194" y="59" font-family="Space Mono, monospace" font-size="9.5" fill="#0E1110">74</text>
    </svg>`,
  },
];

(() => {
  const host = $("#quiz-grid");
  const fb = $("#quiz-feedback");
  QUIZ_OPTIONS.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.dataset.choice = opt.id;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.innerHTML = `
      <div class="quiz-card-head">
        <span class="quiz-letter">${opt.id}</span>
        <span class="quiz-neutral">${opt.tag}</span>
      </div>
      ${opt.svg}
    `;
    btn.addEventListener("click", () => {
      $$(".quiz-card", host).forEach((el) => {
        el.classList.remove("is-picked-ok", "is-picked-no");
        el.setAttribute("aria-checked", String(el === btn));
      });
      btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-no");
      fb.hidden = false;
      fb.classList.toggle("is-wrong", !opt.correct);
      fb.innerHTML = `
        <h3>${opt.correct ? "选对了：样张 A 是最稳健的窄栏索引" : `再想想：你选了 ${opt.tag}`}</h3>
        <p>${opt.why}</p>
        ${opt.correct ? "" : `<p><strong>正确答案是样张 A：</strong>${QUIZ_OPTIONS[0].why}</p>`}
      `;
    });
    host.appendChild(btn);
  });
})();

// ==================== 8. 07 节：原海报 21 关键词回跳 + 放大暗箱 ====================
(() => {
  const ds = DATASETS.poster;
  const host = $("#kw-groups");
  for (const g of ds.groups) {
    const card = document.createElement("div");
    card.className = "kw-group-card";
    const items = ds.terms.filter((t) => t.group === g.id);
    card.innerHTML = `
      <div class="kw-group-title"><strong>${g.id}</strong><span>${g.zh}</span></div>
      <div class="kw-btn-list"></div>
    `;
    const list = $(".kw-btn-list", card);
    items.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "kw-jump-btn";
      b.innerHTML = `<span>${t.zh} · ${t.en}</span><code>${t.id}</code>`;
      b.addEventListener("click", () => {
        state.dataset = "poster";
        state.sortMode = "grouped";
        state.hierarchyMode = "dots";
        state.locatorMode = "dotted";
        state.xrefMode = "clean";
        state.targetId = t.id;
        state.selectedId = t.id;
        const pos = ds.terms.findIndex((x) => x.id === t.id);
        state.scrubPos = (pos + 0.5) / ds.terms.length;
        $$(".ds-btn").forEach((el) => {
          const on = el.dataset.dataset === "poster";
          el.classList.toggle("is-active", on);
          el.setAttribute("aria-selected", String(on));
        });
        syncAll();
        window.scrollTo(0, 0);
      });
      list.appendChild(b);
    });
    host.appendChild(card);
  }
})();

// 原海报高清暗箱（读 #poster.src，不重复内联；支持缩放、拖动、Esc 关）
(() => {
  const lb = $("#lightbox");
  const lbImg = $("#lb-img");
  const vp = $("#lb-viewport");
  const scaleTxt = $("#lb-scale");
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleTxt.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLb() {
    lbImg.src = $("#poster").src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    $("#lb-close").focus();
  }

  function closeLb() {
    lb.hidden = true;
    $("#poster-open-btn").focus();
  }

  $("#poster-open-btn").addEventListener("click", openLb);
  $("#lb-close").addEventListener("click", closeLb);
  $("#lb-zoom-in").addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  $("#lb-zoom-out").addEventListener("click", () => {
    scale = Math.max(0.6, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  $("#lb-reset").addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
    vp.classList.add("is-dragging");
    try { vp.setPointerCapture(e.pointerId); } catch {}
  });
  vp.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = e.clientX - drag.sx;
    ty = e.clientY - drag.sy;
    applyTransform();
  });
  const endDrag = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    vp.classList.remove("is-dragging");
    try { vp.releasePointerCapture(e.pointerId); } catch {}
  };
  vp.addEventListener("pointerup", endDrag);
  vp.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) {
      e.preventDefault();
      closeLb();
    }
  });
})();
