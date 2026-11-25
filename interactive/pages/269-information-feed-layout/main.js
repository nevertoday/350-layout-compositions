// 269 信息流布局 · 全页交互逻辑

import {
  ANTIPATTERNS,
  INCOMING_POOL,
  INITIAL_FEED,
  LOAD_DEMO_ITEMS,
  OLDER_POOL,
  PRACTICE_OPTIONS,
  RANKING_ITEMS,
  SORT_META,
} from "./data.js";
import { mountFlowSpine, mountRhythmRail } from "./flow-canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- 卡片几何图标（忠实呼应 269 原海报红黑交替视觉锚） ----------
function iconSVG(kind) {
  switch (kind) {
    case "circle":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="11.5" fill="#fff"/></svg>`;
    case "triangle":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 11L37 35H11Z" fill="#fa2c64"/></svg>`;
    case "diamond":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 9L38 24L24 39L10 24Z" fill="#fff"/></svg>`;
    case "venn":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18.5" cy="24" r="10.5" fill="#c568a1"/><circle cx="29.5" cy="24" r="10.5" fill="#fa2c64" fill-opacity="0.88"/><path d="M24 14.8a10.5 10.5 0 0 1 0 18.4a10.5 10.5 0 0 1 0-18.4Z" fill="#ffd9e5"/></svg>`;
    case "bars":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="23" width="6" height="14" rx="1.5" fill="#fff"/><rect x="21" y="13" width="6" height="24" rx="1.5" fill="#fff"/><rect x="31" y="19" width="6" height="18" rx="1.5" fill="#fff"/></svg>`;
    case "pulse":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 25h7l4-10 6 20 4-10h11" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case "grid":
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="11" width="11" height="11" rx="2.5" fill="#fa2c64"/><rect x="26" y="11" width="11" height="11" rx="2.5" fill="#fff"/><rect x="11" y="26" width="11" height="11" rx="2.5" fill="#fff"/><rect x="26" y="26" width="11" height="11" rx="2.5" fill="#fa2c64"/></svg>`;
    default:
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="12" fill="none" stroke="#fff" stroke-width="4.5"/><circle cx="24" cy="24" r="3.5" fill="#fff"/></svg>`;
  }
}

function bookmarkSVG(saved) {
  return `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5h10v13l-5-3.4-5 3.4v-13Z" fill="${saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
}

// =========================================================================
// 1. HERO 活体 S 轨信息流工作台
// =========================================================================
const heroState = {
  items: INITIAL_FEED.map((x) => ({ ...x })),
  pendingQueue: [],
  incomingIdx: 0,
  olderIdx: 0,
  sort: "time",
  gap: 16,
  directInsert: false,
  onlySaved: false,
  expandedId: null,
  freshId: null,
  dragging: false,
  lastActionNote: "",
};

const feedStream = $("#feed-stream");
const feedStage = $("#feed-stage");
const feedTimeLayer = $("#feed-time-layer");
const flowCanvas = $("#flow-canvas");
const rhythmScrub = $("#rhythm-scrub");
const rhythmCanvas = $("#rhythm-canvas");

const spineCtrl = mountFlowSpine(flowCanvas, feedStage, feedTimeLayer, () => heroState);
const railCtrl = mountRhythmRail(rhythmCanvas, () => heroState);

function visibleItems() {
  const arr = heroState.onlySaved
    ? heroState.items.filter((x) => x.saved)
    : [...heroState.items];
  const key = heroState.sort === "time" ? "timeRank" : heroState.sort === "priority" ? "priorityRank" : "hotRank";
  arr.sort((a, b) => a[key] - b[key]);
  return arr;
}

// 桌面/大平板端：卡片右边严格对齐，仅左侧沿洋红 S 线逐张向左错开（第 1 张缩进最多，末张最宽）
function applyCascadeOffsets() {
  const stageW = feedStage.clientWidth || 0;
  const cards = $$(".feed-card", feedStream);
  const count = cards.length;
  const desktopCascade = stageW >= 520;

  if (!desktopCascade) {
    cards.forEach((el) => el.style.setProperty("--card-indent", "0px"));
    return;
  }

  const maxIndent = Math.round(Math.min(92, Math.max(48, (stageW - 440) * 0.35)));
  // 有效左侧错位幅度随 gap 温和呼吸：挤墙(4px)收窄，甜区(16px)还原海报斜瀑，断流(40px)张开
  const gapNorm = Math.max(0, Math.min(1, (heroState.gap - 4) / 40));
  const spreadFactor = 0.56 + Math.min(1, gapNorm * 1.45) * 0.34 + Math.max(0, gapNorm - 0.5) * 0.2;
  const activeIndent = maxIndent * Math.min(1, spreadFactor);

  cards.forEach((el, i) => {
    const t = count > 1 ? i / (count - 1) : 0;
    const indent = (1 - t) * activeIndent;
    el.style.setProperty("--card-indent", `${indent.toFixed(1)}px`);
  });
}

// 按当前卡高、卡内行距、gap 与屏幕可用高度推算一屏约能排几条，并实测外/内距比值
function measureFeedMetrics(gap) {
  const cards = $$(".feed-card", feedStream);
  const avgCardH = cards.length
    ? cards.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0) / cards.length
    : 98;

  // 实测同一张卡内部元素间的真实行距（标题与元信息 / 摘要之间的 row-gap）
  let innerGap = 7;
  const firstBody = cards[0]?.querySelector(".fc-body");
  if (firstBody) {
    const cssGap = parseFloat(getComputedStyle(firstBody).rowGap);
    if (Number.isFinite(cssGap) && cssGap > 0) innerGap = cssGap;
  }

  // 用文档坐标扣除流区起点以上的页头占位，按视口高度推算同节奏下整屏可排条数
  const stageDocTop = Math.max(0, feedStage.getBoundingClientRect().top + window.scrollY);
  const usableTop = Math.min(stageDocTop, window.innerHeight * 0.52);
  const viewportFeedH = Math.max(avgCardH * 0.9, window.innerHeight - usableTop);
  const cardsPerScreen = Math.max(0.6, (viewportFeedH + gap) / (avgCardH + gap));
  const ratio = gap / Math.max(1, innerGap);

  return {
    avgCardH: Math.round(avgCardH),
    innerGap: +innerGap.toFixed(1),
    viewportFeedH: Math.round(viewportFeedH),
    cardsPerScreen: +cardsPerScreen.toFixed(1),
    ratio: +ratio.toFixed(1),
  };
}

function gapVerdict(gap, m) {
  const ratioNum = m.ratio.toFixed(1);
  const ratioText = `${ratioNum}×`;
  const innerText = `${m.innerGap}px`;

  // 遵循「外松内紧」：卡间距必须明显大于卡内留白（≥1.5×），且落在经验甜区上限 24px 以内
  if (m.ratio < 1.5) {
    return {
      state: "粘连拥挤",
      tag: "节奏过密",
      warn: true,
      shortBody: `外距仅内行距${ratioNum}倍：卡片贴墙，条目难分起止`,
      body: `外距 ${gap} px 仅为卡内行距（${innerText}）的 ${ratioText}，打破「外松内紧」：相邻卡片贴得几乎和卡内标题摘要一样近，时间节点也被挤扁，眼睛很难分清条目起止。`,
    };
  }
  if (gap <= 24) {
    return {
      state: "舒适呼吸",
      tag: "节奏成立",
      warn: false,
      shortBody: `卡间距是卡内行距的${ratioNum}倍：条目分得开，卡内不散`,
      body: `外距 ${gap} px 是卡内行距（${innerText}）的 ${ratioText}，落入 12–24 px 经验甜区（经验值）：卡内信息自然抱团，跨卡留出半拍停顿，节点与时间标签也正好有位置。`,
    };
  }
  return {
    state: "松散断流",
    tag: "流向割裂",
    warn: true,
    shortBody: `外距拉到${gap}px：卡片漂成孤岛，上下流向割裂`,
    body: `外距 ${gap} px 拉到卡内行距（${innerText}）的 ${ratioText}，超出 12–24 px 经验上限（经验值）：每张卡漂成孤岛，按此间距一屏仅能排约 ${m.cardsPerScreen.toFixed(1)} 条（按屏高推算），洋红流线也拉成虚线。`,
  };
}

function updateHeroReadout() {
  const m = measureFeedMetrics(heroState.gap);
  const v = gapVerdict(heroState.gap, m);

  $("#gap-val").textContent = `${heroState.gap} px`;
  rhythmScrub.setAttribute("aria-valuenow", String(heroState.gap));
  rhythmScrub.setAttribute("aria-valuetext", `${heroState.gap} 像素，${v.tag}，外距是卡内行距的 ${m.ratio} 倍`);

  const tag = $("#diag-tag");
  tag.textContent = v.tag;
  tag.classList.toggle("is-warn", v.warn);

  $("#diag-metrics").innerHTML =
    `按此间距，一屏约能排 <b>${m.cardsPerScreen.toFixed(1)}</b> 条（按屏高推算）· <span class="nowrap">外/内距 <b>${m.ratio.toFixed(1)}×</b></span>`;
  $("#diag-short").textContent = v.shortBody;
  $("#diag-body").textContent = v.body;

  // 1. 连续（排序）副文
  $("#sort-en").textContent = SORT_META[heroState.sort].en;
  $("#note-continuity").textContent = SORT_META[heroState.sort].summary;

  // 2. 更新副文
  const pendingN = heroState.pendingQueue.length;
  $("#update-meta").textContent = heroState.directInsert
    ? "直接顶入"
    : pendingN > 0
      ? `待查看 +${pendingN}`
      : "静默提示条";
  $("#insert-mode-label").textContent = heroState.directInsert ? "直接顶入" : "静默提示";
  $("#btn-insert-mode").setAttribute("aria-pressed", String(heroState.directInsert));
  if (heroState.lastActionNote) {
    $("#note-update").textContent = heroState.lastActionNote;
  } else if (heroState.directInsert) {
    $("#note-update").textContent = "已切为直接顶入：点「注入新动态」会立刻挤下当前第一张卡，体会视线被打断的感觉。";
  } else {
    $("#note-update").textContent = "新内容到达时先在流顶给温和提示条，由读者自己决定何时回顶查看。";
  }

  // 3. 节点（展开 / 收藏）副文
  const totalCount = heroState.items.length;
  const savedCount = heroState.items.filter((x) => x.saved).length;
  const list = visibleItems();
  $("#saved-badge").textContent = `${totalCount} 条 · 已收藏 ${savedCount}`;

  const expandBtn = $("#btn-toggle-expand");
  const hasExpanded = Boolean(heroState.expandedId && list.some((x) => x.id === heroState.expandedId));
  expandBtn.setAttribute("aria-pressed", String(hasExpanded));
  expandBtn.textContent = hasExpanded ? "收起卡片详情" : "展开首条详情";

  const filterBtn = $("#btn-filter-saved");
  filterBtn.setAttribute("aria-pressed", String(heroState.onlySaved));
  filterBtn.textContent = heroState.onlySaved ? "显示全部节点" : "仅看已收藏";

  const expandedItem = heroState.items.find((x) => x.id === heroState.expandedId);
  if (heroState.onlySaved) {
    $("#note-nodes").textContent = savedCount
      ? `已筛选出 ${savedCount} 枚收藏节点（S 线对应圆点实心亮起）；再点「显示全部节点」恢复整条流。`
      : "当前还没有收藏任何节点，点任意卡片右下书签即可标记并点亮 S 线圆点。";
  } else if (expandedItem) {
    $("#note-nodes").textContent = `已展开「${expandedItem.title}」详情——卡高增加后，按屏高推算的一屏可排条数也随之下降。`;
  } else {
    $("#note-nodes").textContent = "点任意卡片正文可就地展开详情，点右下书签标记节点并点亮 S 线圆点。";
  }

  $$(".preset-btn").forEach((b) => {
    const g = Number(b.dataset.gap);
    b.classList.toggle("is-active", Math.abs(g - heroState.gap) <= 2);
  });

  const remainOld = OLDER_POOL.length - heroState.olderIdx;
  const moreBtn = $("#btn-more");
  moreBtn.disabled = remainOld <= 0;
  $("#more-count").textContent = remainOld > 0 ? `+${remainOld}` : "已到底";
}

function renderFeed(animateFlip = false) {
  const prevPos = new Map();
  if (animateFlip) {
    $$(".feed-card", feedStream).forEach((el) => {
      const r = el.getBoundingClientRect();
      prevPos.set(el.dataset.id, { left: r.left, top: r.top });
    });
  }

  feedStage.style.setProperty("--feed-gap", `${heroState.gap}px`);
  feedStream.style.setProperty("--feed-gap", `${heroState.gap}px`);
  const list = visibleItems();
  if (!list.length) {
    feedStream.innerHTML = `<div class="feed-empty">暂无已收藏节点，点击「显示全部节点」恢复完整信息流。</div>`;
    feedTimeLayer.innerHTML = "";
  } else {
    feedStream.innerHTML = list
      .map((item, i) => {
        const expanded = heroState.expandedId === item.id;
        const cramped = heroState.gap <= 10;
        const fresh = heroState.freshId === item.id;
        return `
          <article
            class="feed-card${cramped ? " is-cramped" : ""}${expanded ? " is-expanded" : ""}${fresh ? " is-fresh" : ""}"
            data-id="${item.id}"
            data-saved="${item.saved ? "1" : "0"}"
            data-hot="${item.badge ? "1" : "0"}"
            data-time="${item.timeLabel}"
            aria-posinset="${i + 1}"
            aria-setsize="${list.length}"
          >
            <div class="fc-thumb tone-${item.tone}">${iconSVG(item.icon)}</div>
            <button type="button" class="fc-body" data-action="expand" aria-expanded="${expanded}">
              <div class="fc-meta">
                <span class="fc-cat">${item.category}</span>
                ${item.badge ? `<span class="fc-badge" lang="en">${item.badge}</span>` : ""}
                <time class="sr-only">${item.timeLabel}</time>
              </div>
              <h3 class="fc-title">${item.title}</h3>
              <p class="fc-excerpt">${item.excerpt}</p>
              <p class="fc-detail"${expanded ? "" : " hidden"}>${item.detail}</p>
            </button>
            <button type="button" class="fc-save" data-action="save" aria-pressed="${item.saved}" aria-label="${item.saved ? "取消收藏" : "收藏"} ${item.title}">
              ${bookmarkSVG(item.saved)}
            </button>
          </article>`;
      })
      .join("");

    feedTimeLayer.innerHTML = list
      .map(
        (item, i) =>
          `<span class="node-time-tag${heroState.gap <= 11 ? " is-cramped" : ""}${item.saved ? " is-saved" : ""}" data-idx="${i}">${item.timeLabel}</span>`
      )
      .join("");
  }

  applyCascadeOffsets();

  if (animateFlip && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$(".feed-card", feedStream).forEach((el) => {
      const old = prevPos.get(el.dataset.id);
      if (!old) return;
      const now = el.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (Math.abs(dy) > 1 || Math.abs(dx) > 1) {
        el.animate(
          [
            { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)` },
            { transform: `translate3d(0, 0, 0)` },
          ],
          { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }
    });
  }

  updateHeroReadout();
  spineCtrl.draw();
  requestAnimationFrame(() => {
    updateHeroReadout();
    spineCtrl.draw();
  });
}

function setGap(raw, snap = false) {
  let g = Math.max(4, Math.min(44, Math.round(raw)));
  if (snap && Math.abs(g - 16) <= 2) g = 16;
  if (g === heroState.gap) {
    railCtrl.draw();
    spineCtrl.draw();
    return;
  }
  heroState.gap = g;
  feedStage.style.setProperty("--feed-gap", `${g}px`);
  feedStream.style.setProperty("--feed-gap", `${g}px`);
  $$(".feed-card", feedStream).forEach((c) => c.classList.toggle("is-cramped", g <= 10));
  $$(".node-time-tag", feedTimeLayer).forEach((t) => t.classList.toggle("is-cramped", g <= 11));
  applyCascadeOffsets();
  updateHeroReadout();
  railCtrl.draw();
  spineCtrl.draw();
}

// 窗口尺寸变化时重算斜向错位、实测单屏卡数与 S 曲线
const stageRo = new ResizeObserver(() => {
  applyCascadeOffsets();
  updateHeroReadout();
  spineCtrl.draw();
});
stageRo.observe(feedStage);
window.addEventListener("resize", () => {
  applyCascadeOffsets();
  updateHeroReadout();
  spineCtrl.draw();
});

// 绑定声波节奏拖轨（Pointer Events，兼容鼠标与触摸，供 perf.mjs drag 流畅重绘）
function gapFromClientX(clientX) {
  const r = rhythmScrub.getBoundingClientRect();
  const pad = 16;
  const u = Math.max(0, Math.min(1, (clientX - r.left - pad) / Math.max(1, r.width - pad * 2)));
  return 4 + u * 40;
}

rhythmScrub.addEventListener("pointerdown", (e) => {
  heroState.dragging = true;
  if (rhythmScrub.setPointerCapture) {
    try { rhythmScrub.setPointerCapture(e.pointerId); } catch {}
  }
  setGap(gapFromClientX(e.clientX), false);
});
rhythmScrub.addEventListener("pointermove", (e) => {
  if (!heroState.dragging) return;
  setGap(gapFromClientX(e.clientX), false);
});
const endDrag = () => {
  if (!heroState.dragging) return;
  heroState.dragging = false;
  setGap(heroState.gap, true);
};
rhythmScrub.addEventListener("pointerup", endDrag);
rhythmScrub.addEventListener("pointercancel", endDrag);

// 同时也响应直接 touchmove（确保极端触屏/CDP 模拟下每一帧都重画）
rhythmScrub.addEventListener("touchstart", (e) => {
  if (!e.touches[0]) return;
  heroState.dragging = true;
  setGap(gapFromClientX(e.touches[0].clientX), false);
}, { passive: true });
rhythmScrub.addEventListener("touchmove", (e) => {
  if (!heroState.dragging || !e.touches[0]) return;
  setGap(gapFromClientX(e.touches[0].clientX), false);
}, { passive: true });
rhythmScrub.addEventListener("touchend", endDrag, { passive: true });

rhythmScrub.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setGap(heroState.gap - 2);
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setGap(heroState.gap + 2);
  } else if (e.key === "0") {
    e.preventDefault();
    setGap(16);
  }
});

$$(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => setGap(Number(btn.dataset.gap)));
});

// 排序切换
$$(".seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.sort = btn.dataset.sort;
    $$(".seg-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderFeed(true);
  });
});

// 卡片展开 & 收藏（事件委托）
feedStream.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const card = btn.closest(".feed-card");
  const id = card?.dataset.id;
  if (!id) return;
  if (btn.dataset.action === "expand") {
    heroState.expandedId = heroState.expandedId === id ? null : id;
    renderFeed(false);
  } else if (btn.dataset.action === "save") {
    const item = heroState.items.find((x) => x.id === id);
    if (item) {
      item.saved = !item.saved;
      renderFeed(false);
    }
  }
});

// 节点栏快捷控件：展开/收起首条详情 & 仅看已收藏
$("#btn-toggle-expand").addEventListener("click", () => {
  const list = visibleItems();
  if (!list.length) return;
  const hasExpanded = Boolean(heroState.expandedId && list.some((x) => x.id === heroState.expandedId));
  heroState.expandedId = hasExpanded ? null : list[0].id;
  renderFeed(false);
});

$("#btn-filter-saved").addEventListener("click", () => {
  heroState.onlySaved = !heroState.onlySaved;
  renderFeed(false);
});

// 注入新动态（对比静默提示条 vs 直接顶入）
function nextIncomingItem() {
  const tpl = INCOMING_POOL[heroState.incomingIdx % INCOMING_POOL.length];
  heroState.incomingIdx += 1;
  return {
    ...tpl,
    id: `${tpl.id}-${heroState.incomingIdx}`,
    timeRank: -heroState.incomingIdx,
    priorityRank: heroState.incomingIdx === 1 ? 0 : 1.2 - heroState.incomingIdx * 0.1,
    hotRank: heroState.incomingIdx === 3 ? 0.4 : 2.2,
  };
}

function flushPending() {
  if (!heroState.pendingQueue.length) return;
  const incoming = heroState.pendingQueue.splice(0);
  incoming.forEach((it) => heroState.items.unshift(it));
  heroState.freshId = incoming[incoming.length - 1].id;
  heroState.onlySaved = false;
  heroState.lastActionNote = `已主动将 ${incoming.length} 条新动态置顶，阅读节奏完全由你掌控。`;
  $("#new-banner").hidden = true;
  $("#jump-warn").hidden = true;
  renderFeed(true);
}

function pushIncoming(fromPull = false) {
  const item = nextIncomingItem();
  const warnEl = $("#jump-warn");
  const bannerEl = $("#new-banner");

  if (fromPull || heroState.directInsert) {
    heroState.items.unshift(item);
    heroState.freshId = item.id;
    heroState.onlySaved = false;
    bannerEl.hidden = true;
    if (!fromPull && heroState.directInsert) {
      warnEl.hidden = false;
      warnEl.textContent = "新卡片直接顶入，正在读的那条被突然挤下去了！";
      heroState.lastActionNote = "刚才直接顶入了新卡，你原本在读的第一张卡被瞬间挤低了一截。";
    } else {
      warnEl.hidden = true;
      heroState.lastActionNote = "通过主动下拉/刷新获取了新动态，符合预期，不打断视线。";
    }
    renderFeed(true);
  } else {
    heroState.pendingQueue.push(item);
    warnEl.hidden = true;
    bannerEl.hidden = false;
    $("#new-banner-text").textContent = `↑ 有 ${heroState.pendingQueue.length} 条新动态，点此置顶查看`;
    heroState.lastActionNote = `已有 ${heroState.pendingQueue.length} 条新动态在流顶静默等候，当前阅读位置纹丝不动。`;
    updateHeroReadout();
  }
}

$("#btn-push").addEventListener("click", () => pushIncoming(false));
$("#new-banner").addEventListener("click", flushPending);

$("#btn-insert-mode").addEventListener("click", () => {
  heroState.directInsert = !heroState.directInsert;
  heroState.lastActionNote = "";
  $("#jump-warn").hidden = true;
  updateHeroReadout();
});

// 下拉刷新按钮与真实下拉手势
const pullPill = $("#pull-pill");
function triggerPullRefresh() {
  pullPill.classList.add("is-spinning");
  $("#pull-hint").textContent = "正在拉取最新节点…";
  setTimeout(() => {
    pullPill.classList.remove("is-spinning");
    $("#pull-hint").textContent = "已更新！可继续下拉刷新";
    if (heroState.pendingQueue.length) flushPending();
    else pushIncoming(true);
  }, 260);
}
pullPill.addEventListener("click", triggerPullRefresh);

let pullStartY = null;
let pullDelta = 0;
feedStage.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button")) return;
  if (e.pointerType === "mouse") {
    pullStartY = e.clientY;
    pullDelta = 0;
  }
});
window.addEventListener("pointermove", (e) => {
  if (pullStartY === null) return;
  const dy = e.clientY - pullStartY;
  if (dy > 0) {
    pullDelta = Math.min(46, dy * 0.45);
    feedStream.style.transform = `translateY(${pullDelta}px)`;
    $("#pull-hint").textContent = pullDelta > 28 ? "松手立即刷新" : "继续下拉刷新…";
  }
});
window.addEventListener("pointerup", () => {
  if (pullStartY === null) return;
  const shouldRefresh = pullDelta > 28;
  pullStartY = null;
  pullDelta = 0;
  feedStream.style.transform = "";
  if (shouldRefresh) triggerPullRefresh();
  else $("#pull-hint").textContent = "下拉流道或点此刷新";
});

// 加载更早 & 复位
$("#btn-more").addEventListener("click", () => {
  if (heroState.olderIdx >= OLDER_POOL.length) return;
  const next = { ...OLDER_POOL[heroState.olderIdx] };
  heroState.olderIdx += 1;
  heroState.items.push(next);
  heroState.freshId = next.id;
  renderFeed(false);
});

$("#btn-reset").addEventListener("click", () => {
  heroState.items = INITIAL_FEED.map((x) => ({ ...x }));
  heroState.pendingQueue = [];
  heroState.incomingIdx = 0;
  heroState.olderIdx = 0;
  heroState.sort = "time";
  heroState.onlySaved = false;
  heroState.directInsert = false;
  heroState.expandedId = null;
  heroState.freshId = null;
  heroState.lastActionNote = "";
  $("#new-banner").hidden = true;
  $("#jump-warn").hidden = true;
  $("#pull-hint").textContent = "下拉流道或点此刷新";
  $$(".seg-btn").forEach((b) => {
    const on = b.dataset.sort === "time";
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  heroState.gap = 16;
  renderFeed(false);
  railCtrl.draw();
});

renderFeed(false);

// =========================================================================
// 2. SECTION 02 卡片解剖过载实验
// =========================================================================
const optThumb = $("#opt-thumb");
const optTime = $("#opt-time");
const optBadges = $("#opt-many-badges");
const optLong = $("#opt-long-text");
const optActions = $("#opt-many-actions");

function renderAnatomy() {
  const showThumb = optThumb.checked;
  const showTime = optTime.checked;
  const manyBadges = optBadges.checked;
  const longText = optLong.checked;
  const manyActions = optActions.checked;

  $("#anatomy-card").classList.toggle("no-thumb", !showThumb);
  $("#ac-thumb").hidden = !showThumb;
  $("#ac-time").hidden = !showTime;

  $("#ac-badges").innerHTML = manyBadges
    ? `<em class="badge-hot">NEW</em><em class="badge-alt">置顶</em><em class="badge-hot">紧急</em><em class="badge-orch">官方</em><em class="badge-alt">必读</em>`
    : `<em class="badge-hot">NEW</em>`;

  $("#ac-excerpt").textContent = longText
    ? "系统将于今晚 23:00 进行全量集群底层升级与存储迁移，预计耗时约 15 分钟。期间工作区保留只读权限，评论与文件上传暂缓，未提交的表单草稿会自动暂存至本地浏览器缓存。如需查看各可用区切换明细，请提前下载迁移检查表并核对接口回调地址，维护结束后刷新即可恢复写入…"
    : "系统将于今晚 23:00 进行底层升级，期间保留只读模式约 15 分钟，未提交草稿将自动本地暂存。";

  $("#ac-actions").innerHTML = manyActions
    ? `<span class="ac-fake-btn">赞 128</span><span class="ac-fake-btn">踩</span><span class="ac-fake-btn">评论 34</span><span class="ac-fake-btn">转发</span><span class="ac-fake-btn">举报</span><span class="ac-act-bookmark" aria-hidden="true">${bookmarkSVG(false)}</span>`
    : `<span class="ac-act-bookmark" aria-hidden="true">${bookmarkSVG(false)}</span>`;

  let elements = 4; // 分类 + 主标题 + 摘要 + 收藏书签
  if (showThumb) elements += 1;
  if (showTime) elements += 1;
  elements += manyBadges ? 5 : 1;
  if (manyActions) elements += 5;

  const overloadCount = (manyBadges ? 1 : 0) + (longText ? 1 : 0) + (manyActions ? 1 : 0);
  const loadScore = elements + (longText ? 4 : 0);
  const pct = Math.min(100, Math.round((loadScore / 20) * 100));

  $("#am-stops").textContent = longText ? `${elements} 个（含长正文）` : `${elements} 个`;
  $("#am-fill").style.width = `${pct}%`;

  const levelEl = $("#am-level");
  let level = "轻";
  let warn = false;
  let verdict = "";
  if (!showThumb && !showTime && overloadCount === 0) {
    level = "缺线索";
    warn = true;
    verdict = "信息过空：拿掉视觉锚和时间刻度后，整条流变成纯黑字条，扫视时分不清条目新鲜度和类别差异。";
  } else if (overloadCount === 0) {
    level = "轻";
    verdict =
      showThumb && showTime
        ? "负荷轻：视觉锚、单枚状态徽章、时间刻度、主标题与简短摘要各守其位，读者一眼就能决定点不点开。"
        : `负荷轻，但少了${!showThumb ? "左方视觉锚" : "时间刻度"}：条目依然清爽，只是快速扫视时少了一处定位线索。`;
  } else if (overloadCount === 1) {
    level = "适中";
    const reason = manyBadges
      ? "五枚彩色徽章同时抢眼"
      : longText
        ? "五行长正文直接摊在列表里"
        : "五个底部操作钮一字排开";
    verdict = `负荷升至适中：${reason}，开始分散主标题的注意力；单看一条还能接受，连续滑过十几条时会明显变累。`;
  } else {
    level = "过载";
    warn = true;
    verdict = "负荷过载：多重标签、长段正文与操作按钮同时喊「看我」——单张节点膨胀成迷你网页，信息流失去了「一眼速扫」的本意。";
  }
  levelEl.textContent = `负荷：${level}`;
  levelEl.classList.toggle("is-warn", warn);
  $("#am-verdict").textContent = verdict;
}

[optThumb, optTime, optBadges, optLong, optActions].forEach((el) => el.addEventListener("change", renderAnatomy));
$("#opt-reset").addEventListener("click", () => {
  optThumb.checked = true;
  optTime.checked = true;
  optBadges.checked = false;
  optLong.checked = false;
  optActions.checked = false;
  renderAnatomy();
});
renderAnatomy();

// =========================================================================
// 3. SECTION 03 排序人格模拟器
// =========================================================================
const wRecency = $("#w-recency");
const wEngage = $("#w-engage");

function renderRanking() {
  const wr = Number(wRecency.value);
  const we = Number(wEngage.value);
  $("#w-recency-val").textContent = `${wr}%`;
  $("#w-engage-val").textContent = `${we}%`;

  const denom = Math.max(1, wr + we);
  const scored = RANKING_ITEMS.map((item) => {
    const score = (item.recency * wr + item.engagement * we) / denom;
    return { ...item, score };
  }).sort((a, b) => b.score - a.score || a.minsAgo - b.minsAgo);

  const urgentPos = scored.findIndex((x) => x.urgent) + 1;
  const badge = $("#rv-badge");
  badge.textContent = `告警位列第 ${urgentPos}`;
  badge.classList.toggle("is-danger", urgentPos >= 4);

  let text = "";
  if (urgentPos === 1) {
    text = "时效主导：3 分钟前的支付超时告警稳居第一，刚发生的事永远先被看到；代价是四小时前的高分长文已经沉到中后段。";
  } else if (urgentPos <= 3) {
    text = `平衡混排：热门复盘被提到了前排，但突发告警仍在第 ${urgentPos} 位可见。实际产品若用混排，常会对紧急告警单独设「强置顶规则」。`;
  } else {
    text = `热度淹没了时效！刚发 3 分钟的支付故障因为还没人点赞，被算法一路压到第 ${urgentPos} 位——这就是工作通知流绝不能交给纯热度排序的原因。`;
  }
  $("#rv-text").textContent = text;

  $("#rank-list").innerHTML = scored
    .map(
      (item, idx) => `
      <li class="rank-item${item.urgent ? " is-urgent" : ""}">
        <span class="ri-pos" lang="en">0${idx + 1}</span>
        <div class="ri-main">
          <h3><span class="ri-tag">${item.tag}</span><span>${item.title}</span></h3>
          <p class="ri-meta">${item.author} · ${item.timeLabel} · ${item.likes}</p>
        </div>
        <span class="ri-score" lang="en">${Math.round(item.score)} PT</span>
      </li>`
    )
    .join("");

  $$(".rk-btn").forEach((b) => {
    const m = b.dataset.rk;
    const active =
      (m === "chrono" && wr === 100 && we === 0) ||
      (m === "balanced" && wr === 55 && we === 45) ||
      (m === "viral" && wr === 10 && we === 90);
    b.classList.toggle("is-active", active);
  });
}

[wRecency, wEngage].forEach((el) => el.addEventListener("input", renderRanking));
$$(".rk-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const m = btn.dataset.rk;
    if (m === "chrono") { wRecency.value = 100; wEngage.value = 0; }
    else if (m === "balanced") { wRecency.value = 55; wEngage.value = 45; }
    else { wRecency.value = 10; wEngage.value = 90; }
    renderRanking();
  });
});
renderRanking();

// =========================================================================
// 4. SECTION 04 加载机制实验（无限滚动 vs 加载更多 vs 分页）
// =========================================================================
const loadState = {
  mode: "infinite",
  shown: 6,
  page: 1,
  footerEscapes: 0,
  footerClicked: false,
};

const llViewport = $("#ll-viewport");
const llList = $("#ll-list");
const llControls = $("#ll-controls");

function renderLoadDemo() {
  let visible = [];
  if (loadState.mode === "paged") {
    const start = (loadState.page - 1) * 6;
    visible = LOAD_DEMO_ITEMS.slice(start, start + 6);
  } else {
    visible = LOAD_DEMO_ITEMS.slice(0, loadState.shown);
  }

  llList.innerHTML = visible
    .map(
      (it) => `
      <li class="ll-item">
        <span class="ll-num" lang="en">${String(it.idx).padStart(2, "0")}</span>
        <div><b>${it.title}</b><small>${it.cat} · ${it.time}</small></div>
      </li>`
    )
    .join("");

  if (loadState.mode === "infinite") {
    llControls.innerHTML =
      loadState.shown < LOAD_DEMO_ITEMS.length
        ? `<span class="ll-inf-hint">向下滚到底端会自动再接 6 条（试试看能不能直接点到下面的页脚）</span>`
        : `<span class="ll-inf-hint">全部 18 条已刷完，现在终于摸到页脚了</span>`;
    $("#lle-kicker").textContent = "当前：无限滚动";
    $("#lle-title").textContent = "零点击打断，但页脚会不断逃跑";
    $("#lle-desc").textContent =
      "滚到窗口底端时新条目自动接上，探索消遣最顺手；可只要还没把库里的内容刷空，底部的页脚就会一次次被推远——这就是 Baymard 与 NN/g 反复提醒的「页脚不可达」问题。";
    $("#lle-stat").textContent = `已加载 ${loadState.shown} / ${LOAD_DEMO_ITEMS.length} 条 · 页脚被推走 ${loadState.footerEscapes} 次${loadState.footerClicked ? " · 你终于点到了页脚！" : ""}`;
  } else if (loadState.mode === "more") {
    const left = LOAD_DEMO_ITEMS.length - loadState.shown;
    llControls.innerHTML =
      left > 0
        ? `<button type="button" class="ll-more-btn" id="ll-load-more">加载更多（还剩 ${left} 条）</button>`
        : `<span class="ll-inf-hint">全部 18 条已加载完</span>`;
    $("#lle-kicker").textContent = "当前：加载更多";
    $("#lle-title").textContent = "既有连续感，又把停顿权还给人";
    $("#lle-desc").textContent =
      "滚到第 6 条时流会主动停住：想继续探索就点一次「加载更多」，想看底部的客服与条款随时伸手就能点到。Baymard 的研究认为这是商品与内容浏览最稳妥的折中方案。";
    $("#lle-stat").textContent = `已主动加载 ${loadState.shown} / ${LOAD_DEMO_ITEMS.length} 条 · 页脚随时可达${loadState.footerClicked ? " · 已成功触达页脚 ✓" : ""}`;
  } else {
    llControls.innerHTML = [1, 2, 3]
      .map(
        (p) =>
          `<button type="button" class="ll-page-btn${loadState.page === p ? " is-active" : ""}" data-page="${p}">第 ${p} 页</button>`
      )
      .join("");
    $("#lle-kicker").textContent = "当前：传统分页";
    $("#lle-title").textContent = "牺牲一点顺滑，换回牢靠的位置锚点";
    $("#lle-desc").textContent =
      "每一页固定 6 条，让人清楚总共有多长、那条重要记录就在「第 2 页第 3 条」。需要定向回溯、比价或存档检索时，分页依然难以替代。";
    $("#lle-stat").textContent = `当前第 ${loadState.page} / 3 页（每页 6 条） · 页脚随时可达${loadState.footerClicked ? " · 已成功触达页脚 ✓" : ""}`;
  }
}

llControls.addEventListener("click", (e) => {
  if (e.target.id === "ll-load-more") {
    loadState.shown = Math.min(LOAD_DEMO_ITEMS.length, loadState.shown + 6);
    renderLoadDemo();
  }
  const pg = e.target.closest(".ll-page-btn");
  if (pg) {
    loadState.page = Number(pg.dataset.page);
    llViewport.scrollTop = 0;
    renderLoadDemo();
  }
});

let infCooldown = 0;
llViewport.addEventListener("scroll", () => {
  if (loadState.mode !== "infinite") return;
  if (loadState.shown >= LOAD_DEMO_ITEMS.length) return;
  const nearBottom = llViewport.scrollTop + llViewport.clientHeight >= llViewport.scrollHeight - 54;
  const now = performance.now();
  if (nearBottom && now - infCooldown > 280) {
    infCooldown = now;
    loadState.shown = Math.min(LOAD_DEMO_ITEMS.length, loadState.shown + 6);
    loadState.footerEscapes += 1;
    renderLoadDemo();
  }
});

$("#mf-btn").addEventListener("click", () => {
  loadState.footerClicked = true;
  renderLoadDemo();
});

$$(".ll-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    loadState.mode = tab.dataset.load;
    loadState.shown = 6;
    loadState.page = 1;
    loadState.footerEscapes = 0;
    loadState.footerClicked = false;
    llViewport.scrollTop = 0;
    $$(".ll-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    });
    renderLoadDemo();
  });
});
renderLoadDemo();

// =========================================================================
// 5. SECTION 06 反例改错器
// =========================================================================
const antiState = { key: "compare", fixed: false };

function antiSVG(kind, fixed) {
  if (!fixed) {
    // 坏示范：一律硬塞进单列长信息流
    return `
      <svg viewBox="0 0 360 190">
        <rect x="6" y="6" width="348" height="178" rx="12" fill="#fcf9f6" stroke="#111116" stroke-opacity="0.16"/>
        <path d="M36 22C24 60 48 110 34 166" fill="none" stroke="#fa2c64" stroke-width="2.2" stroke-dasharray="5 5"/>
        <rect x="58" y="20" width="274" height="42" rx="8" fill="#fff" stroke="#fa2c64" stroke-opacity="0.4"/>
        <rect x="68" y="29" width="24" height="24" rx="5" fill="#fa2c64"/>
        <rect x="102" y="32" width="120" height="7" rx="3" fill="#111116"/>
        <rect x="102" y="45" width="186" height="5" rx="2.5" fill="#6c6c77" fill-opacity="0.45"/>

        <rect x="58" y="72" width="274" height="42" rx="8" fill="#fff" stroke="#fa2c64" stroke-opacity="0.4"/>
        <rect x="68" y="81" width="24" height="24" rx="5" fill="#111116"/>
        <rect x="102" y="84" width="140" height="7" rx="3" fill="#111116"/>
        <rect x="102" y="97" width="170" height="5" rx="2.5" fill="#6c6c77" fill-opacity="0.45"/>

        <rect x="58" y="124" width="274" height="42" rx="8" fill="#fff" stroke="#fa2c64" stroke-opacity="0.4"/>
        <rect x="68" y="133" width="24" height="24" rx="5" fill="#fa2c64"/>
        <rect x="102" y="136" width="110" height="7" rx="3" fill="#111116"/>
        <rect x="102" y="149" width="194" height="5" rx="2.5" fill="#6c6c77" fill-opacity="0.45"/>
      </svg>`;
  }
  if (kind === "compare") {
    return `
      <svg viewBox="0 0 360 190">
        <rect x="6" y="6" width="348" height="178" rx="12" fill="#fcf9f6" stroke="#111116" stroke-opacity="0.16"/>
        ${[0, 1, 2]
          .map(
            (i) => `
          <rect x="${22 + i * 108}" y="22" width="98" height="146" rx="9" fill="#fff" stroke="#111116" stroke-opacity="0.15"/>
          <rect x="${32 + i * 108}" y="32" width="78" height="50" rx="6" fill="${i === 1 ? "#fa2c64" : "#111116"}"/>
          <rect x="${32 + i * 108}" y="94" width="58" height="7" rx="3" fill="#111116"/>
          <rect x="${32 + i * 108}" y="110" width="76" height="5" rx="2" fill="#6c6c77" fill-opacity="0.45"/>
          <rect x="${32 + i * 108}" y="122" width="66" height="5" rx="2" fill="#6c6c77" fill-opacity="0.45"/>
          <rect x="${32 + i * 108}" y="142" width="44" height="14" rx="5" fill="${i === 1 ? "#fa2c64" : "#111116"}" fill-opacity="0.14"/>`
          )
          .join("")}
      </svg>`;
  }
  if (kind === "kanban") {
    return `
      <svg viewBox="0 0 360 190">
        <rect x="6" y="6" width="348" height="178" rx="12" fill="#fcf9f6" stroke="#111116" stroke-opacity="0.16"/>
        ${["待办", "进行中", "已验收"]
          .map(
            (name, i) => `
          <rect x="${20 + i * 110}" y="20" width="100" height="150" rx="9" fill="#f5f0ea"/>
          <rect x="${30 + i * 110}" y="30" width="42" height="8" rx="3" fill="${i === 1 ? "#fa2c64" : "#111116"}"/>
          <rect x="${28 + i * 110}" y="48" width="84" height="32" rx="6" fill="#fff"/>
          <rect x="${28 + i * 110}" y="88" width="84" height="32" rx="6" fill="#fff"/>
          ${i !== 2 ? `<rect x="${28 + i * 110}" y="128" width="84" height="30" rx="6" fill="#fff"/>` : ""}`
          )
          .join("")}
      </svg>`;
  }
  if (kind === "search") {
    return `
      <svg viewBox="0 0 360 190">
        <rect x="6" y="6" width="348" height="178" rx="12" fill="#fcf9f6" stroke="#111116" stroke-opacity="0.16"/>
        <rect x="24" y="20" width="312" height="26" rx="8" fill="#fff" stroke="#111116" stroke-width="1.5"/>
        <rect x="34" y="29" width="90" height="8" rx="3" fill="#fa2c64"/>
        <rect x="24" y="58" width="312" height="24" rx="5" fill="#fff"/>
        <rect x="34" y="66" width="150" height="7" rx="3" fill="#111116"/>
        <rect x="24" y="88" width="312" height="24" rx="5" fill="#fff"/>
        <rect x="34" y="96" width="180" height="7" rx="3" fill="#111116"/>
        <rect x="24" y="118" width="312" height="24" rx="5" fill="#fff"/>
        <rect x="34" y="126" width="130" height="7" rx="3" fill="#111116"/>
        ${[1, 2, 3, 4]
          .map(
            (n, i) => `
          <rect x="${104 + i * 38}" y="152" width="28" height="20" rx="5" fill="${n === 3 ? "#fa2c64" : "#111116"}" fill-opacity="${n === 3 ? 1 : 0.12}"/>`
          )
          .join("")}
      </svg>`;
  }
  return `
    <svg viewBox="0 0 360 190">
      <rect x="6" y="6" width="348" height="178" rx="12" fill="#fcf9f6" stroke="#111116" stroke-opacity="0.16"/>
      <rect x="24" y="22" width="170" height="28" rx="12" fill="#fff" stroke="#111116" stroke-opacity="0.14"/>
      <rect x="166" y="60" width="170" height="28" rx="12" fill="#111116"/>
      <rect x="24" y="98" width="190" height="28" rx="12" fill="#fff" stroke="#111116" stroke-opacity="0.14"/>
      <rect x="24" y="142" width="248" height="28" rx="10" fill="#fff" stroke="#111116" stroke-opacity="0.24"/>
      <rect x="280" y="142" width="56" height="28" rx="10" fill="#fa2c64"/>
    </svg>`;
}

function renderAnti() {
  const item = ANTIPATTERNS[antiState.key];
  const stage = $("#anti-stage");
  stage.dataset.fixed = antiState.fixed ? "1" : "0";
  $("#anti-visual").innerHTML = antiSVG(item.kind, antiState.fixed);
  $("#anti-state-pill").textContent = antiState.fixed ? "正解：换成对路的布局" : "误用：硬套信息流";
  $("#anti-title").textContent = antiState.fixed ? item.goodTitle : item.badTitle;
  $("#anti-desc").textContent = antiState.fixed ? item.goodDesc : item.badDesc;
  $("#anti-links").innerHTML =
    `延伸参考：` +
    item.links
      .map(
        (l) => `<a class="xref" href="https://layout.xiaoxiaodong.ai/${l.id}/play/" target="_blank" rel="noopener">${l.name}</a>`
      )
      .join(" ");

  const flip = $("#anti-flip");
  flip.setAttribute("aria-pressed", String(antiState.fixed));
  flip.textContent = antiState.fixed ? "← 看硬套信息流的问题" : "换成对路的布局 →";
}

$$(".anti-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    antiState.key = tab.dataset.anti;
    antiState.fixed = false;
    $$(".anti-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
    renderAnti();
  });
});
$("#anti-flip").addEventListener("click", () => {
  antiState.fixed = !antiState.fixed;
  renderAnti();
});
renderAnti();

// =========================================================================
// 6. SECTION 07 练一练（四选一）
// =========================================================================
const practiceGrid = $(".practice-grid");
const practiceVerdict = $("#practice-verdict");

$$(".pr-card").forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.opt;
    const info = PRACTICE_OPTIONS[key];
    practiceGrid.classList.add("is-revealed");

    $$(".pr-card").forEach((c) => {
      const k = c.dataset.opt;
      const picked = k === key;
      c.setAttribute("aria-pressed", String(picked));
      c.classList.toggle("is-picked", picked);
      c.classList.toggle("is-correct", PRACTICE_OPTIONS[k].correct);
      c.classList.toggle("is-wrong", picked && !PRACTICE_OPTIONS[k].correct);
      const cap = $(".pr-cap", c);
      if (cap && PRACTICE_OPTIONS[k].revealedCap) {
        cap.textContent = PRACTICE_OPTIONS[k].revealedCap;
      }
    });

    practiceVerdict.classList.toggle("is-good", info.correct);
    practiceVerdict.classList.toggle("is-bad", !info.correct);
    $("#pv-title").textContent = info.title;
    $("#pv-text").textContent = info.explain;
  });
});

// =========================================================================
// 7. SECTION 08 原海报放大灯箱（支持缩放、拖动平移、Esc 关闭）
// =========================================================================
const lightbox = $("#lightbox");
const lbStage = $("#lb-stage");
const lbImg = $("#lb-img");
const posterBtn = $("#poster-btn");
const posterImg = $("#poster");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-zoom-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.getAttribute("src")) lbImg.src = posterImg.src;
  lbScale = 1;
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
$("#lb-zoom-in").addEventListener("click", () => { lbScale = Math.min(3, lbScale + 0.35); applyLbTransform(); });
$("#lb-zoom-out").addEventListener("click", () => { lbScale = Math.max(0.75, lbScale - 0.35); applyLbTransform(); });
$("#lb-zoom-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("click", (e) => {
  if (e.target === lbStage) closeLightbox();
});
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.75, Math.min(3.2, lbScale + (e.deltaY < 0 ? 0.16 : -0.16)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  lbStage.classList.add("is-dragging");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// =========================================================================
// 8. 滚入显现（尊重 prefers-reduced-motion）
// =========================================================================
const reveals = $$(".reveal");
if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
}
