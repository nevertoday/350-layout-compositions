// 286 搜索结果布局 · 主控脚本
import {
  ANATOMY_LAYERS,
  EDGE_CASES,
  ERAS,
  INITIAL_STATE,
  KWIC_CORPUS,
  PRESETS,
  QUIZ_ROUNDS,
  SCENARIOS,
  TRIAGE_CASES,
  evaluate,
} from "./model.js";
import { createScrubber } from "./scrubber.js";
import { SCAN_MODES, createScanLab } from "./scanlab.js";

const state = { ...INITIAL_STATE };
let latestEval = evaluate(state);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- 工具：原海报风格极简 SVG 缩略图（无五官细节） ----------
function thumbSvg(kind) {
  const vb = "0 0 118 82";
  if (kind === "mountain") {
    return `<svg viewBox="${vb}" aria-hidden="true"><rect width="118" height="82" fill="#D5DDE7"/><circle cx="88" cy="22" r="9" fill="#2A508E"/><polygon points="4,82 40,28 70,58 88,42 114,82" fill="#5D77A0"/></svg>`;
  }
  if (kind === "shapes") {
    return `<svg viewBox="${vb}" aria-hidden="true"><rect width="118" height="82" fill="#DDE3EC"/><circle cx="34" cy="48" r="15" fill="#2A508E"/><polygon points="56,64 80,26 104,64" fill="#637EA6"/></svg>`;
  }
  if (kind === "profile") {
    // 严格遵守规范：极简抽象圆点与横线，不画五官
    return `<svg viewBox="${vb}" aria-hidden="true"><rect width="118" height="82" fill="#DDE3EC"/><circle cx="32" cy="41" r="14" fill="#4E6B96"/><rect x="54" y="29" width="48" height="5" rx="2.5" fill="#8C9DB6"/><rect x="54" y="39" width="38" height="5" rx="2.5" fill="#9EADC3"/><rect x="54" y="49" width="44" height="5" rx="2.5" fill="#8C9DB6"/></svg>`;
  }
  if (kind === "video") {
    return `<svg viewBox="${vb}" aria-hidden="true"><rect width="118" height="82" fill="#D5DDE7"/><rect x="14" y="14" width="90" height="54" rx="7" fill="#3D5E91"/><polygon points="52,29 74,41 52,53" fill="#FFFDF8"/></svg>`;
  }
  return `<svg viewBox="${vb}" aria-hidden="true"><rect width="118" height="82" fill="#DDE3EC"/><rect x="16" y="18" width="86" height="6" rx="3" fill="#6C82A4"/><rect x="16" y="31" width="76" height="5" rx="2.5" fill="#95A6BF"/><rect x="16" y="43" width="82" height="5" rx="2.5" fill="#95A6BF"/><rect x="16" y="55" width="60" height="5" rx="2.5" fill="#95A6BF"/></svg>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderSegments(segments) {
  if (!segments.length) return `<span class="snip-empty">（摘要已被裁空，用户无法预判正文相关性）</span>`;
  return segments
    .map((seg) => {
      const txt = escapeHtml(seg.text);
      if (!seg.mark) return txt;
      return seg.kind === "noise" ? `<mark class="is-noise">${txt}</mark>` : `<mark>${txt}</mark>`;
    })
    .join("");
}

function formatUrlDisplay(url, hierarchy) {
  if (hierarchy === "breadcrumb") {
    const clean = url.replace(/^https?:\/\//, "");
    const parts = clean.split("/").filter(Boolean);
    return parts.join(" › ");
  }
  return url;
}

// ---------- Hero 渲染：单真源驱动全部 DOM + 读数 + 要点带 ----------
const dom = {
  statusPill: $("#hero-status-pill"),
  titleHit: $("#title-hit"),
  diagCard: $("#diag-card"),
  diagBadge: $("#diag-badge"),
  diagHeadline: $("#diag-headline"),
  diagWhy: $("#diag-why"),
  diagHint: $("#diag-hint"),
  mRank: $("#m-rank"),
  mRatio: $("#m-ratio"),
  mChars: $("#m-chars"),
  mFold: $("#m-fold"),
  mDiagStrip: $("#mobile-diag-strip"),
  mDiagBadge: $("#m-diag-badge"),
  mDiagText: $("#m-diag-text"),
  searchInput: $("#serp-input"),
  serpCount: $("#serp-count"),
  serpSortPill: $("#serp-sort-pill"),
  serpClickToast: $("#serp-click-toast"),
  serpList: $("#serp-list"),
  scrubberEl: $("#snippet-scrubber"),
};

const SORT_LABELS = {
  date: "排序：发布时间（乱序）",
  relevance: "排序：相关性优先",
  "ad-hijack": "排序：推广占首位",
  "all-featured": "排序：全员红框平权",
};

let scrubber;

function updateHero(fromScrub = false) {
  latestEval = evaluate(state);
  const ev = latestEval;
  const mood = ev.passedCount === 4 ? "is-ok" : ev.passedCount >= 2 ? "is-mid" : "is-bad";

  // 顶栏状态与自示范标题
  dom.statusPill.className = `hero-status-pill ${mood}`;
  dom.statusPill.textContent = ev.passedCount === 4 ? `4 / 4 · ${ev.solutionLabel}` : `${ev.passedCount} / 4 待梳理`;
  dom.titleHit.className = `title-hit ${mood}`;

  // 单真源诊单卡
  dom.diagCard.className = `diag-card ${mood}`;
  dom.mDiagStrip.className = `mobile-diag-strip ${mood}`;
  if (ev.topIssue) {
    dom.diagBadge.textContent = `${ev.topIssue.badge}（${ev.passedCount}/4）`;
    dom.diagHeadline.textContent = ev.topIssue.headline;
    dom.diagWhy.textContent = ev.topIssue.why;
    dom.diagHint.textContent = ev.topIssue.fixHint;
    dom.mDiagBadge.textContent = `${ev.passedCount}/4`;
    dom.mDiagText.textContent = ev.topIssue.headline;
  } else {
    dom.diagBadge.textContent = `4/4 达标 · ${ev.solutionLabel}`;
    dom.diagHeadline.textContent = `层级清晰、最相关结果稳居首位，扫一眼即中`;
    dom.diagWhy.textContent =
      ev.scenario.intent === "navigational"
        ? `当前导航型查询下，官网入口排第 1 位，摘要控制在 ${state.snippetChars} 字精简带，首屏可露约 ${ev.foldCount} 条，符合 Cutrell & Guan (2007) 实证节奏。`
        : `标题与摘要保持 ${ev.titleRatio.toFixed(2)}× 字号层级，摘要 ${state.snippetChars} 字带实时查询高亮，首屏稳露约 ${ev.foldCount} 条结果，兼顾信息气味与浏览视野。`;
    dom.diagHint.textContent = "可以试试在搜索框改输「番茄」或切到「导航型 · 找官网」，看看同一套摘要长度是否会从优解变成错态。";
    dom.mDiagBadge.textContent = "4/4";
    dom.mDiagText.textContent = `已达标：${ev.solutionLabel}`;
  }

  // 四项单真源读数
  dom.mRank.textContent = ev.bestRank === 1 ? "第 1 位" : `第 ${ev.bestRank} 位`;
  dom.mRank.className = `mono ${ev.pillarMap.priority ? "is-ok" : "is-bad"}`;

  dom.mRatio.textContent = `${ev.titleRatio.toFixed(2)}×`;
  dom.mRatio.className = `mono ${ev.pillarMap.hierarchy ? "is-ok" : "is-bad"}`;

  dom.mChars.textContent = `${state.snippetChars} 字`;
  const [optMin, optMax] = ev.optimalRange;
  dom.mChars.className = `mono ${state.snippetChars >= optMin && state.snippetChars <= optMax && state.match !== "none" && state.match !== "over" ? "is-ok" : "is-bad"}`;

  dom.mFold.textContent = `≈ ${ev.foldCount} 条`;
  dom.mFold.className = `mono ${ev.foldCount >= 2.4 ? "is-ok" : "is-bad"}`;

  // 三要点脊与底部四栏要点实况带
  const pillarStates = {
    hierarchy: { ok: ev.pillarMap.hierarchy, bad: "平级", good: "清晰" },
    priority: { ok: ev.pillarMap.priority, bad: state.priority === "ad-hijack" ? "被劫" : state.priority === "all-featured" ? "平权" : "埋没", good: "首位" },
    scent: { ok: ev.pillarMap.scent, bad: state.match === "none" ? "无气味" : state.match === "over" ? "过亮" : state.snippetChars < optMin ? "过空" : "过满", good: "适中" },
    rhythm: { ok: ev.pillarMap.rhythm, bad: "乱跳", good: "一致" },
  };
  for (const [k, info] of Object.entries(pillarStates)) {
    const ps = $(`#ps-${k}`);
    if (ps) {
      ps.textContent = info.ok ? info.good : info.bad;
      ps.className = `pillar-state ${info.ok ? "is-ok" : ""}`;
    }
    const tk = $(`#tk-${k}`);
    if (tk) {
      tk.textContent = info.ok ? "达标" : info.bad;
      tk.className = `tk-dot ${info.ok ? "is-ok" : ""}`;
    }
  }

  // 搜索统计与排序标牌
  const matchedDocs = ev.cards.filter((c) => !c.isAd && c.tokenHits > 0).length;
  dom.serpCount.textContent = ev.zeroMatch
    ? `0 条直接匹配「${state.query}」 (${ev.scenario.latency})`
    : state.query.trim() === ev.scenario.defaultQuery
    ? `${ev.scenario.totalFound} (${ev.scenario.latency})`
    : `匹配 ${matchedDocs} / 5 篇相关文档 · ${ev.scenario.intentLabel} (${ev.scenario.latency})`;
  dom.serpSortPill.textContent = SORT_LABELS[state.priority];
  dom.scrubberEl.setAttribute("aria-valuenow", String(state.snippetChars));

  // 同步按钮高亮
  $$(".tab-btn").forEach((b) => {
    const active = b.dataset.scenario === state.scenarioId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $$(".pill-btn").forEach((b) => {
    const dim = b.dataset.dim;
    const val = b.dataset.val;
    const active = state[dim] === val;
    b.classList.toggle("is-active", active);
    const danger =
      (dim === "priority" && val !== "relevance") ||
      (dim === "hierarchy" && val === "flat") ||
      (dim === "match" && (val === "none" || val === "over")) ||
      (dim === "rhythm" && val === "chaotic");
    b.classList.toggle("is-danger", active && danger);
  });

  // 渲染 5 张活体结果卡
  renderSerpCards(ev);

  if (!fromScrub && scrubber) {
    scrubber.syncTarget(state.snippetChars);
  }
}

function renderSerpCards(ev) {
  if (ev.zeroMatch) {
    const sc = ev.scenario;
    dom.serpList.innerHTML = `
      <li class="zero-recovery">
        <h3>没有找到与「${escapeHtml(state.query)}」直接匹配的条目</h3>
        <p>好的搜索结果布局在零结果时绝不甩白页，而是提供纠错、相近主题与一键回退入口：</p>
        <div class="zero-chips">
          <button type="button" class="preset-btn is-alt" data-suggest="${escapeHtml(sc.defaultQuery)}">试试搜「${escapeHtml(sc.defaultQuery)}」</button>
          <button type="button" class="preset-btn" data-suggest="番茄工作法">搜「番茄工作法」</button>
          <button type="button" class="preset-btn" data-suggest="专注力">搜「专注力」</button>
        </div>
      </li>`;
    return;
  }

  const html = ev.cards
    .map((card, idx) => {
      const classes = ["serp-card"];
      if (card.featured) classes.push("is-featured");
      if (card.isAd) classes.push("is-ad");
      if (state.hierarchy === "flat") classes.push("is-flat");
      if (state.rhythm === "compact-text") classes.push("is-compact");
      if (state.rhythm === "chaotic" && idx % 2 === 1) classes.push("is-chaotic-flip");
      if (state.rhythm === "chaotic" && idx % 2 === 0) classes.push("is-chaotic-tall");

      const urlStr = formatUrlDisplay(card.url, state.hierarchy);
      const urlBlock = `<p class="card-url ${state.hierarchy === "breadcrumb" ? "is-crumb-top" : ""}">${escapeHtml(urlStr)}</p>`;
      const titleBlock = `<button type="button" class="card-title-btn" data-card-id="${card.id}">${escapeHtml(card.title)}</button>`;
      const headOrder = state.hierarchy === "breadcrumb" ? urlBlock + titleBlock : titleBlock + urlBlock;

      const showTags =
        card.isAd ||
        state.match === "over" ||
        (state.match === "kwic-tags" && (idx === 0 || card.featured));
      let tagsHtml = "";
      if (showTags) {
        const list = card.isAd
          ? card.tags.map((t) => `<span class="card-tag is-ad-tag">${escapeHtml(t)}</span>`)
          : state.match === "over"
          ? [
              ...card.tags.map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`),
              ...(card.extraNoiseTags || []).map((t) => `<span class="card-tag is-noise">${escapeHtml(t)}</span>`),
            ]
          : card.tags.map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`);
        tagsHtml = `<div class="card-tags">${list.join("")}</div>`;
      }

      const showThumb = state.rhythm !== "compact-text";
      const ribbon = card.featured ? `<div class="card-ribbon" aria-hidden="true"><span>★</span></div>` : "";
      const pinBtn =
        !card.isAd && idx > 0
          ? `<button type="button" class="pin-btn" data-pin-id="${card.id}">↑ 置顶</button>`
          : "";

      return `
        <li class="${classes.join(" ")}" data-id="${card.id}">
          ${ribbon}
          <div class="card-main">
            <div class="card-top-row">
              <span class="rank-dot" aria-hidden="true">${card.rank}</span>
              <div class="card-head-block">
                ${headOrder}
                <p class="card-snippet">${renderSegments(card.snippet.segments)}</p>
              </div>
            </div>
            <div class="card-foot-row">
              ${tagsHtml}
              <div class="card-actions">
                <span class="rel-chip">${card.isAd ? "赞助推广" : `相关度 ${card.relevanceScore}`}</span>
                ${pinBtn}
              </div>
            </div>
          </div>
          ${showThumb ? `<div class="card-thumb">${thumbSvg(card.thumb)}</div>` : ""}
        </li>`;
    })
    .join("");

  dom.serpList.innerHTML = html;
}

// 初始化 2D Canvas 游标尺（data-perf-drag）
scrubber = createScrubber(dom.scrubberEl, {
  getEval: () => latestEval,
  getState: () => state,
  onChange: (chars) => {
    state.snippetChars = chars;
    updateHero(true);
  },
});

// 绑定搜索框与控件事件
$("#search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  state.query = dom.searchInput.value.trim() || SCENARIOS[state.scenarioId].defaultQuery;
  state.pinnedId = null;
  updateHero();
});

dom.searchInput.addEventListener("input", () => {
  state.query = dom.searchInput.value;
  state.pinnedId = null;
  updateHero();
});

$("#search-clear").addEventListener("click", () => {
  dom.searchInput.value = "";
  state.query = "";
  dom.searchInput.focus();
  updateHero();
});

$$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.scenario;
    if (!SCENARIOS[id]) return;
    state.scenarioId = id;
    state.query = SCENARIOS[id].defaultQuery;
    state.pinnedId = null;
    dom.searchInput.value = state.query;
    dom.serpClickToast.className = "serp-click-toast";
    dom.serpClickToast.textContent =
      id === "nav"
        ? "已切导航型：注意观察摘要舒适带向左收缩"
        : "点任意结果标题可测试找寻准确度";
    updateHero();
  });
});

$$(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.preset;
    const preset = PRESETS[key];
    if (!preset) return;
    Object.assign(state, preset);
    if (key === "posterSolution" && state.scenarioId === "nav") {
      // 导航型下自动演示导航紧凑直达解
      Object.assign(state, PRESETS.navCompactSolution);
    }
    updateHero();
  });
});

$$(".pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const { dim, val } = btn.dataset;
    if (!dim) return;
    state[dim] = val;
    if (dim === "priority") state.pinnedId = null;
    updateHero();
  });
});

dom.serpList.addEventListener("click", (e) => {
  const suggest = e.target.closest("[data-suggest]");
  if (suggest) {
    state.query = suggest.dataset.suggest;
    dom.searchInput.value = state.query;
    updateHero();
    return;
  }
  const pin = e.target.closest("[data-pin-id]");
  if (pin) {
    state.pinnedId = pin.dataset.pinId;
    if (state.priority === "ad-hijack") state.priority = "relevance";
    updateHero();
    return;
  }
  const titleBtn = e.target.closest("[data-card-id]");
  if (titleBtn) {
    const id = titleBtn.dataset.cardId;
    const clicked = latestEval.cards.find((c) => c.id === id);
    if (!clicked) return;
    if (clicked.isAd) {
      dom.serpClickToast.className = "serp-click-toast is-miss";
      dom.serpClickToast.textContent = "点中了推广广告：首位红框误导了点击！";
    } else if (clicked.id === latestEval.bestDoc.id) {
      dom.serpClickToast.className = "serp-click-toast is-hit";
      dom.serpClickToast.textContent = `命中最高相关文档（当前排第 ${clicked.rank} 位）`;
    } else {
      dom.serpClickToast.className = "serp-click-toast is-miss";
      dom.serpClickToast.textContent = `这是次相关条目（相关度 ${clicked.relevanceScore}），最佳匹配是《${latestEval.bestDoc.title.slice(0, 10)}…》`;
    }
  }
});

// 快捷键 `/` 快速聚焦搜索框（不在输入框时）
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
    e.preventDefault();
    dom.searchInput.focus();
    dom.searchInput.select();
  }
});

// ---------- Section 01：四层结果卡 X 光剥离解剖 ----------
function renderAnatomy(layerId) {
  const info = ANATOMY_LAYERS.find((l) => l.id === layerId) || ANATOMY_LAYERS[0];
  $$(".xray-tab").forEach((b) => {
    const active = b.dataset.layer === info.id;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $$(".xray-layer", $("#xray-card")).forEach((el) => {
    el.classList.toggle("is-hit", el.dataset.part === info.id);
  });
  $("#xray-kicker").textContent = `${info.no} · ${info.en}`;
  $("#xray-name").textContent = info.name;
  $("#xray-ratio").textContent = info.ratio;
  $("#xray-timing").textContent = info.timing;
  $("#xray-rule").textContent = info.rule;
  $("#xray-pitfall").textContent = info.pitfall;
}

$$(".xray-tab").forEach((b) => b.addEventListener("click", () => renderAnatomy(b.dataset.layer)));

// ---------- Section 02：2D Canvas 眼动扫视路径播放器 ----------
const scanRange = $("#scan-range");
const scanTimeLabel = $("#scan-time");
const scanPlayBtn = $("#scan-play-btn");

const scanLab = createScanLab($("#scan-canvas"), {
  onTimeUpdate: (sec) => {
    scanRange.value = sec.toFixed(1);
    scanTimeLabel.textContent = `${sec.toFixed(1)}s`;
  },
});

function renderScanInfo(modeId) {
  const mode = SCAN_MODES[modeId] || SCAN_MODES["f-pattern"];
  $$(".scan-tab").forEach((b) => {
    const active = b.dataset.scan === mode.id;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("#scan-badge").textContent = mode.badge;
  $("#scan-title").textContent = mode.label;
  $("#scan-summary").textContent = mode.summary;
}

$$(".scan-tab").forEach((b) => {
  b.addEventListener("click", () => {
    scanLab.setMode(b.dataset.scan);
    renderScanInfo(b.dataset.scan);
  });
});

scanPlayBtn.addEventListener("click", () => {
  const next = !scanLab.getState().playing;
  scanLab.setPlaying(next);
  scanPlayBtn.textContent = next ? "暂停轨迹" : "播放轨迹";
});

scanRange.addEventListener("input", () => {
  const val = Number(scanRange.value);
  scanLab.setTime(val);
  scanTimeLabel.textContent = `${val.toFixed(1)}s`;
  scanPlayBtn.textContent = "播放轨迹";
});

// ---------- Section 03：KWIC 查询词动态摘句对比 ----------
function highlightTerms(text, terms) {
  const escaped = terms.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  return escapeHtml(text).replace(re, "<mark>$1</mark>");
}

function renderKwic(queryId) {
  const item = KWIC_CORPUS.queries.find((q) => q.id === queryId) || KWIC_CORPUS.queries[0];
  $$(".kwic-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.kwic === item.id));
  $("#kwic-full-text").innerHTML = highlightTerms(KWIC_CORPUS.fullParagraph, item.tokens);
  $("#kwic-static-snip").textContent = item.staticText;
  $("#kwic-dynamic-snip").innerHTML = highlightTerms(item.kwicText, item.tokens);
  $("#kwic-intent-tag").textContent =
    item.intent === "navigational" ? "导航型 · 建议 16–56 字" : "信息型 · 建议 44–94 字";
  $("#kwic-takeaway").textContent = item.note;
}

$$(".kwic-btn").forEach((b) => b.addEventListener("click", () => renderKwic(b.dataset.kwic)));

// ---------- Section 04：五代搜索结果标本 ----------
function renderEra(eraId) {
  const era = ERAS.find((e) => e.id === eraId) || ERAS[1];
  $$(".era-btn").forEach((b) => {
    const active = b.dataset.era === era.id;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("#era-year").textContent = era.year;
  $("#era-title").textContent = era.title;
  $("#era-ref").textContent = era.ref;
  $("#era-summary").textContent = era.summary;
  $("#era-note").textContent = `版式特征：${era.layoutNote}`;
  const spec = $("#era-specimen");
  spec.dataset.era = era.id;
  spec.innerHTML = era.items
    .map(
      (it) => `
      <div class="era-spec-item ${it.featured ? "is-featured" : ""}">
        <div class="era-spec-head">
          <p class="era-spec-title">${escapeHtml(it.title)}</p>
          <span class="era-spec-meta">${escapeHtml(it.meta)}</span>
        </div>
        <p class="era-spec-url mono">${escapeHtml(it.url)}</p>
        <p class="era-spec-desc">${escapeHtml(it.desc)}</p>
      </div>`
    )
    .join("");
}

$$(".era-btn").forEach((b) => b.addEventListener("click", () => renderEra(b.dataset.era)));

// ---------- Section 05：业务场景分诊器 ----------
function renderTriage(id) {
  const item = TRIAGE_CASES.find((c) => c.id === id) || TRIAGE_CASES[0];
  $$(".triage-btn").forEach((b) => {
    const active = b.dataset.triage === item.id;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("#triage-tag").textContent = item.tag;
  $("#triage-brief").textContent = item.brief;
  const v = $("#triage-verdict");
  v.textContent = item.verdict;
  v.className = `triage-verdict ${item.verdictKind === "use" ? "is-use" : "is-avoid"}`;
  $("#triage-why").textContent = item.why;
  $("#triage-alt").textContent = `落地建议：${item.alt}`;
}

$$(".triage-btn").forEach((b) => b.addEventListener("click", () => renderTriage(b.dataset.triage)));

// ---------- Section 06：极端工程压测 ----------
function renderEdge(edgeId) {
  const item = EDGE_CASES[edgeId] || EDGE_CASES.normal;
  $$(".edge-btn").forEach((b) => {
    const active = b.dataset.edge === item.id;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("#edge-code-title").textContent = item.cssTitle;
  $("#edge-code").textContent = item.cssCode;
  $("#edge-explain").textContent = item.explanation;

  const box = $("#edge-preview");
  if (item.mode === "zero") {
    box.innerHTML = `
      <div class="edge-zero-box">
        <p class="serp-count" style="margin-bottom:8px;">${escapeHtml(item.countText)}</p>
        <h3>未找到与「${escapeHtml(item.query)}」精确匹配的结果</h3>
        <p>您是不是想找：<strong>如何提高专注力</strong>？也可以放宽筛选或先看相近专题：</p>
        <div class="edge-zero-chips">
          <span>一键纠错：如何提高专注力</span>
          <span>清除「仅限今年」筛选</span>
          <span>番茄工作法入门</span>
        </div>
      </div>`;
  } else if (item.mode === "overflow") {
    box.innerHTML = `
      <p class="serp-count" style="margin-bottom:8px;">${escapeHtml(item.countText)}</p>
      <div class="edge-card">
        <div style="min-width:0;">
          <p class="edge-card-title">跨学科认知负荷条件下专注力训练干预实验数据集与双盲对照评估完整归档手册（2026 修订版）</p>
          <p class="edge-card-url mono">https://archive.researchhub.edu/datasets/2026/cognitive-load-attention-training-rct-v4-final-export-utf8?ref=index</p>
          <p class="edge-card-snip">本归档汇总近五年三组注意力训练干预的原始测量字段与清洗脚本，摘要自动控制在两行内截断，避免挤爆相邻卡片…</p>
        </div>
        <div class="edge-thumb">${thumbSvg("doc", true)}</div>
      </div>`;
  } else if (item.mode === "mobile") {
    box.innerHTML = `
      <div class="edge-mobile-frame">
        <p class="serp-count" style="margin-bottom:8px;">390px 竖屏模拟 · ${escapeHtml(item.countText)}</p>
        <div class="edge-card">
          <div style="min-width:0;">
            <p class="edge-card-title">如何提高专注力：科学方法与实用技巧</p>
            <p class="edge-card-url mono">focuslab.com › guide</p>
            <p class="edge-card-snip">系统介绍专注力的原理与训练方法，包含环境与时间管理…</p>
          </div>
          <div class="edge-thumb">${thumbSvg("mountain", true)}</div>
        </div>
      </div>`;
  } else {
    box.innerHTML = `
      <p class="serp-count" style="margin-bottom:8px;">${escapeHtml(item.countText)}</p>
      <div class="edge-card">
        <div style="min-width:0;">
          <p class="edge-card-title">如何提高专注力：科学方法与实用技巧</p>
          <p class="edge-card-url mono">www.focuslab.com/guide</p>
          <p class="edge-card-snip">系统介绍专注力的原理与训练方法，包含环境管理、时间管理与注意力训练技巧。</p>
        </div>
        <div class="edge-thumb">${thumbSvg("mountain", true)}</div>
      </div>`;
  }
}

$$(".edge-btn").forEach((b) => b.addEventListener("click", () => renderEdge(b.dataset.edge)));

// ---------- Section 07：双题中性小练习 ----------
let quizRoundIdx = 0;
let quizPicked = null;

function renderQuiz() {
  const round = QUIZ_ROUNDS[quizRoundIdx];
  $$(".quiz-round-btn").forEach((b) => {
    const active = Number(b.dataset.round) === quizRoundIdx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("#quiz-query").textContent = round.query;
  $("#quiz-prompt").textContent = round.prompt;

  const wrap = $("#quiz-options");
  wrap.innerHTML = round.options
    .map((opt) => {
      const cls = ["quiz-opt"];
      if (opt.flatMode) cls.push("is-flat-opt");
      if (quizPicked === opt.id) {
        cls.push(opt.id === round.correct ? "is-picked-ok" : "is-picked-bad");
      }
      const tags = opt.tags.length
        ? `<div class="quiz-opt-tags">${opt.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
        : "";
      const snip = opt.snippetHtml
        ? `<span class="quiz-opt-snip">${opt.snippetHtml}</span>`
        : `<span class="quiz-opt-snip">（无摘要）</span>`;
      return `
        <button type="button" class="${cls.join(" ")}" data-opt="${opt.id}">
          <span class="quiz-opt-label">${escapeHtml(opt.label)}</span>
          <span class="quiz-opt-title">${escapeHtml(opt.title)}</span>
          <span class="quiz-opt-url">${escapeHtml(opt.url)}</span>
          ${snip}
          ${tags}
        </button>`;
    })
    .join("");

  const fb = $("#quiz-feedback");
  if (!quizPicked) {
    fb.className = "quiz-feedback";
    fb.innerHTML = `<p class="quiz-fb-empty">点选上方方案 A / B / C / D 中的任意一张，查看原理解析。</p>`;
  } else {
    const chosen = round.options.find((o) => o.id === quizPicked);
    const ok = quizPicked === round.correct;
    fb.className = `quiz-feedback ${ok ? "is-ok" : "is-bad"}`;
    fb.innerHTML = `
      <p class="quiz-fb-head">${ok ? `答对了（${chosen.label}）` : `再对比一下（你选了 ${chosen.label}，更优的是方案 ${round.correct}）`}</p>
      <p class="quiz-fb-body">${escapeHtml(chosen.reason)}</p>`;
  }
}

$$(".quiz-round-btn").forEach((b) => {
  b.addEventListener("click", () => {
    quizRoundIdx = Number(b.dataset.round) || 0;
    quizPicked = null;
    renderQuiz();
  });
});

$("#quiz-options").addEventListener("click", (e) => {
  const opt = e.target.closest("[data-opt]");
  if (!opt) return;
  quizPicked = opt.dataset.opt;
  renderQuiz();
});

// ---------- Section 08：原海报放大灯箱（支持缩放、拖拽平移、Esc 关闭） ----------
const posterBtn = $("#poster-btn");
const posterImg = $("#poster");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScale = $("#lb-scale");
let lbZoom = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbZoom})`;
  lbScale.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbZoom = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbZoom = Math.min(3, +(lbZoom + 0.25).toFixed(2));
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbZoom = Math.max(0.75, +(lbZoom - 0.25).toFixed(2));
  if (lbZoom <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.15 : -0.15;
  lbZoom = Math.max(0.75, Math.min(3, +(lbZoom + delta).toFixed(2)));
  if (lbZoom <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbZoom <= 1) {
    closeLightbox();
    return;
  }
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = false; });
lbStage.addEventListener("pointercancel", () => { lbDrag = false; });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ---------- 初始渲染 ----------
updateHero();
renderAnatomy("title");
renderScanInfo("f-pattern");
renderKwic("principle");
renderEra("1998");
renderTriage("docs");
renderEdge("normal");
renderQuiz();
