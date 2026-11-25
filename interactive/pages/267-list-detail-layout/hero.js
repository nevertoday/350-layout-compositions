// 开场主角玩具：真实可用工单收件箱 × 窗口宽度断点模拟器
// 核心操作：①点选或按↑↓切换 7 条真实工单（就地刷新正文、专属附件图与行动按钮，实时记「切换次数 / 无效返回次数」）
// ②拖窗口右边缘（或顶部宽度导轨）跨过 600 / 840 两档，现场看双栏退为单窗格钻取（全屏列表 → 推入详情 → 「← 列表」返回并恢复滚动位置）
// <600px 手机竖屏默认遵循自身规律，直接以 1:1 满宽单窗格列表呈现。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { HERO_TICKETS, clamp, heroBreakpoint } from "./model.js";

const $ = (id) => document.getElementById(id);

const MIN_W = 340;
const MAX_W = 1120;

const C = {
  bg: "#041c18",
  track: "#0a2e28",
  compact: "rgba(238, 97, 10, 0.22)",
  medium: "rgba(46, 160, 138, 0.24)",
  expanded: "rgba(248, 235, 216, 0.16)",
  teal: "#207767",
  tealHi: "#2ea08a",
  orange: "#ee610a",
  paper: "#f8ebd8",
  sun: "#fad8b6",
};

// 为 7 条工单分别生成各自专属的详情附件图示（拒绝千篇一律）
function renderAttachment(ticket) {
  switch (ticket.attachType) {
    case "poster-art":
      return `
        <div class="att-art">
          <svg viewBox="0 0 360 116" role="img" aria-label="活动头图深松墨配暖米纸与橙色山峰预览">
            <rect width="360" height="116" rx="6" fill="#011613"/>
            <rect x="10" y="10" width="96" height="96" rx="5" fill="#06231F"/>
            <rect x="10" y="18" width="4" height="22" rx="1" fill="#EE610A"/>
            <rect x="18" y="18" width="82" height="22" rx="4" fill="#0D352E"/>
            <circle cx="28" cy="29" r="4.5" fill="#EE610A"/>
            <rect x="38" y="25" width="48" height="4" rx="1.5" fill="#F8EBD8"/>
            <rect x="38" y="32" width="32" height="2.5" rx="1" fill="#2EA08A"/>
            <circle cx="28" cy="54" r="4" fill="#207767"/>
            <rect x="38" y="52" width="42" height="3.5" rx="1.5" fill="#207767"/>
            <circle cx="28" cy="74" r="4" fill="#207767"/>
            <rect x="38" y="72" width="36" height="3.5" rx="1.5" fill="#207767"/>
            <circle cx="28" cy="94" r="4" fill="#207767"/>
            <rect x="38" y="92" width="46" height="3.5" rx="1.5" fill="#207767"/>
            <path d="M108 29 H124 M120 25 L125 29 L120 33" stroke="#EE610A" stroke-width="2" fill="none" stroke-dasharray="3 3" stroke-linecap="round"/>
            <rect x="128" y="10" width="222" height="96" rx="6" fill="#EE610A"/>
            <circle cx="194" cy="52" r="24" fill="#FAD8B6"/>
            <polygon points="194,106 264,34 334,106" fill="#042923"/>
          </svg>
        </div>`;
    case "csv-diff":
      return `
        <div class="att-diff">
          <div class="ad-row is-bad"><span class="ad-lbl" lang="en">RAW</span><code lang="en">æ”¶å…¥æ±‡æ€»,2026-Q3,Â¥184,200</code></div>
          <div class="ad-row is-ok"><span class="ad-lbl" lang="en">BOM</span><code>EF BB BF · 收入汇总, 2026-Q3, ¥184,200</code></div>
        </div>`;
    case "quota-bar":
      return `
        <div class="att-quota">
          <div class="aq-head"><span>当前占用 <b>192 GB</b> / 200 GB</span><em lang="en">96%</em></div>
          <div class="aq-track"><i style="width:96%"></i></div>
          <div class="aq-chips">
            <span>海报原稿 124 GB</span>
            <span>导出样张 48 GB</span>
            <span>历史归档 20 GB</span>
          </div>
        </div>`;
    case "auth-trace":
      return `
        <div class="att-trace">
          <span class="at-node is-ok"><b lang="en">01</b>SSO 令牌通过</span>
          <span class="at-arrow" aria-hidden="true">→</span>
          <span class="at-node is-err"><b lang="en">02</b>工作区角色为空</span>
          <span class="at-arrow" aria-hidden="true">→</span>
          <span class="at-node is-wait"><b lang="en">03</b>首页路由中断</span>
        </div>`;
    case "latency-bars":
      return `
        <div class="att-bars">
          <div class="ab-row"><span>iOS 锁屏</span><div class="ab-track"><i style="width:8%" class="t"></i></div><b lang="en">1.2s</b></div>
          <div class="ab-row"><span>安卓前台</span><div class="ab-track"><i style="width:14%" class="t"></i></div><b lang="en">2.1s</b></div>
          <div class="ab-row"><span>省电限制</span><div class="ab-track"><i style="width:92%" class="o"></i></div><b lang="en">184s</b></div>
        </div>`;
    case "invoice-diff":
      return `
        <div class="att-invoice">
          <div><span>原发票抬头</span><s>星屿信息科技有限公司</s></div>
          <div><span>新发票抬头</span><b>星屿数字设计有限公司</b></div>
          <div><span>税务核验</span><em class="ok">营业执照公章已核对</em></div>
        </div>`;
    default:
      return `
        <div class="att-kpi">
          <div><b lang="en">142</b><span>本周关闭工单</span></div>
          <div><b lang="en">91%</b><span>一次解决率</span></div>
          <div><b lang="en">6 min</b><span>平均首响</span></div>
        </div>`;
  }
}

export function initHero() {
  const heroWrap = $("hero-workbench");
  const rail = $("hero-width-rail");
  const railCanvas = $("hero-width-canvas");
  const viewport = $("hero-viewport");
  const winEl = $("hero-stage");
  const edgeHandle = $("hero-edge");
  const listScrollEl = $("hero-list");
  const backBtn = $("hero-back");
  const ctaBtn = $("hero-cta");
  const ratioRange = $("hero-ratio-range");
  const ratioVal = $("hero-ratio-val");
  const resetBtn = $("hero-reset");
  const scaleTag = $("hero-scale-tag");
  const restoreBadge = $("hero-restore-badge");
  const ctx = railCanvas.getContext("2d");

  const items = [...listScrollEl.querySelectorAll(".hl-item")];
  const widthPresetBtns = [...document.querySelectorAll("[data-hero-w]")];

  const isPhoneInit = () => window.innerWidth < 600;

  let availW = 0;
  let naturalH = 420;
  let railW = 0;
  let railH = 0;
  let dpr = 1;
  let lastTier = "";
  let restoreFlashTimer = 0;

  const state = {
    simWidth: isPhoneInit() ? 360 : 960,
    shownWidth: isPhoneInit() ? 360 : (reducedMotion.matches ? 960 : 880),
    listPct: 34,
    active: 0,
    pane: isPhoneInit() ? "list" : "detail", // compact(<600) 下在 "list" 与 "detail" 之间钻取
    savedScrollTop: 0,
    lastReturnedIndex: -1,
    visited: isPhoneInit() ? new Set() : new Set([0]),
    done: new Set(),
    switches: 0,
    backs: 0,
    dragging: false,
    userSized: false,
    introDone: reducedMotion.matches || isPhoneInit(),
  };

  function getTier() {
    return heroBreakpoint(state.simWidth).tier;
  }

  function updateTelemetry() {
    const bp = heroBreakpoint(state.simWidth);
    const tier = bp.tier;
    const isCompact = tier === "compact";

    $("hero-w-num").textContent = `${Math.round(state.simWidth)}px`;
    const badge = $("hero-tier-badge");
    badge.textContent = window.innerWidth < 600 ? bp.shortBadge : bp.badge;
    badge.dataset.tier = tier;

    $("hero-seen-num").textContent = `${state.visited.size} / ${HERO_TICKETS.length}`;
    $("hero-switch-num").textContent = `${state.switches} 次`;
    $("hero-back-num").textContent = `${state.backs} 次`;
    $("hero-done-num").textContent = `${state.done.size} / ${HERO_TICKETS.length}`;

    // 次要控件：左栏占比滑轨在单窗格下停用
    ratioRange.disabled = isCompact;
    ratioRange.value = String(state.listPct);
    ratioVal.textContent = isCompact ? "单窗格满宽" : `${state.listPct}%`;
    ratioRange.closest(".sec-ratio").classList.toggle("is-disabled", isCompact);

    // 标尺预设高亮
    widthPresetBtns.forEach((b) => {
      const bw = +b.dataset.heroW;
      b.setAttribute("aria-pressed", String(Math.abs(state.simWidth - bw) <= 18));
    });

    // 动态白话解释：说清「为什么省力」以及「窄屏为何退回单窗格」
    const readEl = $("hero-read-text");
    if (isCompact) {
      if (state.pane === "detail") {
        readEl.textContent = `当前 ${Math.round(state.simWidth)}px（<600px 单窗格）：列表先让出全宽给详情阅读。想看下一条必须先点顶部「← 列表」（已记录刚才的列表滚动位置，返回后会自动还原）。`;
      } else if (state.backs > 0) {
        readEl.textContent = `已从详情返回列表并恢复刚才的滚动位置（累计无效返回 ${state.backs} 次）。窄屏退回单窗格保住了字号与可读性，代价是每换一条多一步「返回」；把导轨拉过 600px 立刻恢复零返回双栏。`;
      } else {
        readEl.textContent = `当前 ${Math.round(state.simWidth)}px（<600px）：按本页规矩自动退成单窗格。点击任意一条工单推入详情，再点「← 列表」看它如何恢复滚动位置；拖动上方导轨跨过 600 / 840 可对比双栏。`;
      }
    } else if (state.switches > 0) {
      readEl.textContent =
        state.backs === 0
          ? `已在同屏双栏中切换 ${state.switches} 次、无效返回 0 次：左栏一直留在原位，点选或按 ↑↓ 时右侧就地刷新，眼睛不必离开清单重新找行。试着把窗口拖窄到 600px 以下看看变化。`
          : `回到 ${Math.round(state.simWidth)}px 双栏后，后续切换不再增加返回次数（当前切换 ${state.switches} 次、累计返回 ${state.backs} 次）。这就是宽屏列表—详情省力的根本原因。`;
    } else {
      readEl.textContent = bp.rule;
    }

    rail.setAttribute("aria-valuenow", String(Math.round(state.simWidth)));
    rail.setAttribute("aria-valuetext", `${Math.round(state.simWidth)} 像素，${bp.badge}`);
  }

  function updateDetailDOM() {
    const tk = HERO_TICKETS[state.active];
    const isDone = state.done.has(tk.id);

    $("hd-code").textContent = tk.id;
    const tagEl = $("hd-tag");
    tagEl.textContent = tk.tag;
    tagEl.dataset.tone = tk.tagTone;
    $("hd-eyebrow").textContent = tk.eyebrow;
    $("hd-title").textContent = tk.title;
    $("hd-meta").textContent = `${tk.sender} · ${tk.time}`;
    $("hd-summary").textContent = tk.summary;
    $("hd-detail").textContent = tk.detail;
    $("hd-attach-name").textContent = tk.attachName;
    $("hd-attach-meta").textContent = tk.attachMeta;
    $("hd-attach-body").innerHTML = renderAttachment(tk);

    ctaBtn.textContent = isDone ? tk.ctaDone : `${tk.cta} →`;
    ctaBtn.dataset.done = isDone ? "1" : "0";

    $("hero-back-hint").textContent = `第 ${state.active + 1} / ${HERO_TICKETS.length} 条`;

    items.forEach((btn, i) => {
      const sel = i === state.active;
      const done = state.done.has(HERO_TICKETS[i].id);
      const seen = state.visited.has(i);
      btn.setAttribute("aria-selected", String(sel));
      btn.classList.toggle("is-active", sel);
      btn.classList.toggle("is-done", done);
      btn.classList.toggle("is-seen", seen);
    });
  }

  // 根据 simWidth 与容器可用宽 availW，应用真实宽度或等比 scale（杜绝手机窄屏出现反例挤压）
  function applyWindowLayout({ remeasure = false } = {}) {
    const tier = getTier();
    const isCompact = tier === "compact";
    const tierChanged = tier !== lastTier;
    lastTier = tier;

    winEl.dataset.tier = tier;
    winEl.dataset.pane = isCompact ? state.pane : "both";
    winEl.style.setProperty("--list-pct", `${state.listPct}%`);

    if (!availW) {
      availW = Math.max(280, Math.floor(viewport.getBoundingClientRect().width));
    }

    // 在真实 <600 手机上，若 simWidth <= availW + 12 且处于 compact，按 100% 满宽 1:1 渲染最清晰
    const w = Math.round(state.simWidth);
    let scale = 1;
    let cssW = w;
    if (isCompact && window.innerWidth < 600 && w <= availW + 24) {
      cssW = availW;
      scale = 1;
    } else if (w > availW) {
      scale = availW / w;
    }

    winEl.style.width = `${cssW}px`;

    // 仅在断点切档、初始或尺寸变化时重测未缩放高度，避免拖动时反复触发强制同步回流
    if (remeasure || tierChanged || scale === 1) {
      if (scale === 1) {
        winEl.style.transform = "";
        winEl.style.position = "relative";
        viewport.style.height = "";
        naturalH = winEl.offsetHeight || naturalH;
      } else {
        winEl.style.position = "absolute";
        winEl.style.transform = "none";
        naturalH = winEl.offsetHeight || naturalH;
        winEl.style.transform = `scale(${scale.toFixed(4)})`;
        viewport.style.height = `${Math.ceil(naturalH * scale)}px`;
      }
    } else if (scale < 1) {
      winEl.style.position = "absolute";
      winEl.style.transform = `scale(${scale.toFixed(4)})`;
      viewport.style.height = `${Math.ceil(naturalH * scale)}px`;
    }

    // 桌面容器内显示 600 / 840 参考标线位置
    if (availW >= 620) {
      viewport.style.setProperty("--g600", `${Math.min(600, availW)}px`);
      viewport.style.setProperty("--g840", `${Math.min(840, availW)}px`);
      viewport.dataset.guides = "1";
    } else {
      viewport.dataset.guides = "0";
    }

    // 缩放徽标提示（当模拟宽度超出当前设备宽度并等比缩小时显示）
    if (scale < 0.985) {
      scaleTag.hidden = false;
      scaleTag.textContent = `等比缩放入屏 ${Math.round(scale * 100)}%`;
    } else {
      scaleTag.hidden = true;
    }

    // 桌面拖右边缘把手位置紧贴窗口右缘（预留 28px 防止在 768/844/1024 下被裁切）
    const showEdge = window.innerWidth >= 640 && scale >= 0.995;
    edgeHandle.hidden = !showEdge;
    if (showEdge) {
      edgeHandle.style.left = `${Math.min(cssW, availW - 26)}px`;
    }

    heroWrap.dataset.tier = tier;
  }

  function setSimWidth(next, { fromUser = true, remeasure = false } = {}) {
    if (fromUser) {
      state.introDone = true;
      state.userSized = true;
    }
    const prevTier = getTier();
    state.simWidth = clamp(Math.round(next), MIN_W, MAX_W);
    if (fromUser || reducedMotion.matches) state.shownWidth = state.simWidth;
    const nextTier = getTier();

    // 刚从双栏缩进单窗格时，默认展示列表页以便马上体验「点选推入 → ← 列表返回」
    if (prevTier !== "compact" && nextTier === "compact") {
      state.pane = "list";
    }
    // 从单窗格拉宽成双栏时，确保当前选中的条目算作已看
    if (prevTier === "compact" && nextTier !== "compact") {
      state.visited.add(state.active);
    }

    applyWindowLayout({ remeasure: remeasure || prevTier !== nextTier });
    updateTelemetry();
    draw();
  }

  function openTicket(index, { fromUser = true, keepFocus = false } = {}) {
    const prev = state.active;
    const next = (index + HERO_TICKETS.length) % HERO_TICKETS.length;
    const isCompact = getTier() === "compact";

    if (fromUser) {
      if (isCompact) {
        // 记住当前列表滚动位置，等「← 列表」时精确还原
        state.savedScrollTop = listScrollEl.scrollTop;
        state.pane = "detail";
        state.switches += 1;
      } else if (next !== prev || !state.visited.has(next)) {
        state.switches += 1;
      }
    }

    state.active = next;
    state.visited.add(next);
    updateDetailDOM();
    applyWindowLayout({ remeasure: isCompact });
    updateTelemetry();
    if (keepFocus && !isCompact) items[next].focus();
    if (isCompact && fromUser) backBtn.focus({ preventScroll: true });
    draw();
  }

  function returnToList() {
    if (getTier() !== "compact" || state.pane !== "detail") return;
    state.pane = "list";
    state.backs += 1;
    state.lastReturnedIndex = state.active;
    applyWindowLayout({ remeasure: true });

    // 立即恢复进入详情前记住的列表滚动位置，并轻闪标记刚才读过的那一行
    listScrollEl.scrollTop = state.savedScrollTop;
    const targetBtn = items[state.active];
    if (targetBtn) {
      targetBtn.classList.remove("is-restored");
      void targetBtn.offsetWidth;
      targetBtn.classList.add("is-restored");
      targetBtn.focus({ preventScroll: true });
    }
    if (restoreBadge) {
      restoreBadge.hidden = false;
      restoreBadge.textContent =
        state.savedScrollTop > 4
          ? `已恢复滚动位置（${Math.round(state.savedScrollTop)}px · 第 ${state.active + 1} 条）`
          : `已回到第 ${state.active + 1} 条原位`;
      clearTimeout(restoreFlashTimer);
      restoreFlashTimer = setTimeout(() => {
        restoreBadge.hidden = true;
      }, 2800);
    }
    updateTelemetry();
    draw();
  }

  // ---------- 2D Canvas 宽度断点标尺（高效 60fps，响应拖拽并标明 600 / 840 两档） ----------
  function xForW(w) {
    const pad = 14;
    const span = Math.max(10, railW - pad * 2);
    return pad + ((clamp(w, MIN_W, MAX_W) - MIN_W) / (MAX_W - MIN_W)) * span;
  }

  function wForClientX(clientX) {
    const r = rail.getBoundingClientRect();
    const pad = 14;
    const span = Math.max(10, r.width - pad * 2);
    const frac = clamp((clientX - r.left - pad) / span, 0, 1);
    return MIN_W + frac * (MAX_W - MIN_W);
  }

  function frame(t, dt, { still }) {
    if (!railW || !railH) return;

    if (still) {
      state.shownWidth = state.simWidth;
      state.introDone = true;
    } else if (!state.introDone) {
      const target = state.simWidth;
      const k = dt ? 1 - Math.exp(-dt * 7.5) : 0;
      state.shownWidth += (target - state.shownWidth) * k;
      if (Math.abs(target - state.shownWidth) < 0.6 || t > 0.85) {
        state.shownWidth = target;
        state.introDone = true;
      }
    } else {
      state.shownWidth = state.simWidth;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, railW, railH);

    const pad = 14;
    const trackY = Math.round(railH * 0.52);
    const trackH = 10;
    const xMin = xForW(MIN_W);
    const x600 = xForW(600);
    const x840 = xForW(840);
    const xMax = xForW(MAX_W);
    const xCur = xForW(state.shownWidth);

    // 三档区间色带（Compact / Medium / Expanded）
    ctx.fillStyle = C.compact;
    ctx.fillRect(xMin, trackY - trackH / 2, x600 - xMin, trackH);
    ctx.fillStyle = C.medium;
    ctx.fillRect(x600, trackY - trackH / 2, x840 - x600, trackH);
    ctx.fillStyle = C.expanded;
    ctx.fillRect(x840, trackY - trackH / 2, xMax - x840, trackH);

    // 标尺小刻度
    ctx.strokeStyle = "rgba(248, 235, 216, 0.24)";
    ctx.lineWidth = 1;
    for (let w = 360; w <= 1120; w += 40) {
      const tx = Math.round(xForW(w)) + 0.5;
      const major = w === 600 || w === 840;
      ctx.beginPath();
      ctx.moveTo(tx, trackY - (major ? 10 : 5));
      ctx.lineTo(tx, trackY + (major ? 10 : 5));
      ctx.stroke();
    }

    // 600 / 840 两道关键断点亮橙标记线
    for (const bpW of [600, 840]) {
      const bx = Math.round(xForW(bpW)) + 0.5;
      const crossed = state.shownWidth >= bpW;
      ctx.strokeStyle = crossed ? C.orange : "rgba(238, 97, 10, 0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, 3);
      ctx.lineTo(bx, railH - 3);
      ctx.stroke();
    }

    // 当前宽度进度亮条
    ctx.fillStyle = state.shownWidth < 600 ? C.orange : C.tealHi;
    ctx.fillRect(xMin, trackY - 2.5, Math.max(2, xCur - xMin), 5);

    // 亮橙拖拽游标
    const knobW = 14;
    const knobH = 22;
    const kx = xCur - knobW / 2;
    const ky = trackY - knobH / 2;
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.roundRect(kx, ky, knobW, knobH, 4);
    ctx.fill();
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 游标中央白线
    ctx.strokeStyle = "#fff8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xCur, ky + 6);
    ctx.lineTo(xCur, ky + knobH - 6);
    ctx.stroke();
  }

  const { draw } = loop(heroWrap, frame);

  let lastMeasuredAvailW = 0;
  let lastMeasuredRailW = 0;

  function measureAndSync() {
    const rr = rail.getBoundingClientRect();
    const nextRailW = Math.round(rr.width);
    const nextRailH = Math.round(rr.height);
    const nextAvail = Math.max(280, Math.floor(viewport.getBoundingClientRect().width));

    // 高度变化（如手机单窗格列表/详情切换）不应重置用户当前视图或重复重算
    if (lastMeasuredAvailW && Math.abs(nextAvail - lastMeasuredAvailW) < 2 && Math.abs(nextRailW - lastMeasuredRailW) < 2) {
      return;
    }
    const widthChanged = Math.abs(nextAvail - lastMeasuredAvailW) >= 2;
    lastMeasuredAvailW = nextAvail;
    lastMeasuredRailW = nextRailW;

    railW = nextRailW;
    railH = nextRailH;
    dpr = pixelRatio(2);
    if (railW > 0 && railH > 0) {
      railCanvas.width = Math.round(railW * dpr);
      railCanvas.height = Math.round(railH * dpr);
    }

    availW = nextAvail;

    // 仅在首次挂载或容器宽度真正变化且用户未手动改窗宽时，按当前设备设置最自然的初始宽度
    if (widthChanged && !state.userSized) {
      if (window.innerWidth < 600) {
        state.simWidth = clamp(availW, MIN_W, 560);
        state.shownWidth = state.simWidth;
        state.pane = "list";
      } else {
        // 桌面与平板预留 30px 给右侧橙色「拖窗宽」把手，绝不贴边裁切
        const desktopRoom = Math.max(620, availW - 30);
        state.simWidth = clamp(Math.min(960, desktopRoom), 620, MAX_W);
        if (state.introDone) state.shownWidth = state.simWidth;
      }
    }

    applyWindowLayout({ remeasure: true });
    updateTelemetry();
    draw();
  }

  const ro = new ResizeObserver(measureAndSync);
  ro.observe(viewport);
  ro.observe(rail);

  // ---------- 交互绑定 ----------
  // 1. 工单列表点击 + 键盘 ↑↓ Home End（支持双栏就地刷新 & 窄屏钻取）
  items.forEach((btn, i) => {
    btn.addEventListener("click", () => openTicket(i, { fromUser: true }));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (i + 1) % items.length;
        if (getTier() === "compact") {
          items[next].focus();
        } else {
          openTicket(next, { fromUser: true, keepFocus: true });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (i - 1 + items.length) % items.length;
        if (getTier() === "compact") {
          items[prev].focus();
        } else {
          openTicket(prev, { fromUser: true, keepFocus: true });
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        if (getTier() === "compact") items[0].focus();
        else openTicket(0, { fromUser: true, keepFocus: true });
      } else if (e.key === "End") {
        e.preventDefault();
        const last = items.length - 1;
        if (getTier() === "compact") items[last].focus();
        else openTicket(last, { fromUser: true, keepFocus: true });
      }
    });
  });

  // 2. 单窗格返回按钮（恢复滚动位置 + 累计无效返回）
  backBtn.addEventListener("click", returnToList);
  winEl.addEventListener("keydown", (e) => {
    if ((e.key === "Escape" || e.key === "ArrowLeft") && getTier() === "compact" && state.pane === "detail") {
      e.preventDefault();
      returnToList();
    }
  });

  // 3. 详情区真实主行动按钮 CTA（标记该工单已处理）
  ctaBtn.addEventListener("click", () => {
    const tk = HERO_TICKETS[state.active];
    if (state.done.has(tk.id)) state.done.delete(tk.id);
    else state.done.add(tk.id);
    updateDetailDOM();
    updateTelemetry();
  });

  // 4. 顶部宽度断点导轨（标记 data-perf-drag，支持鼠标、触屏与键盘）
  let railPtr = null;
  rail.addEventListener("pointerdown", (e) => {
    railPtr = e.pointerId;
    state.dragging = true;
    try { rail.setPointerCapture(e.pointerId); } catch {}
    heroWrap.classList.add("is-dragging");
    setSimWidth(wForClientX(e.clientX));
    e.preventDefault();
  });
  window.addEventListener("pointermove", (e) => {
    if (railPtr !== e.pointerId) return;
    setSimWidth(wForClientX(e.clientX));
  });
  const endRail = (e) => {
    if (railPtr !== e.pointerId) return;
    railPtr = null;
    state.dragging = false;
    heroWrap.classList.remove("is-dragging");
    applyWindowLayout({ remeasure: true });
  };
  window.addEventListener("pointerup", endRail);
  window.addEventListener("pointercancel", endRail);

  rail.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 60 : 20;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setSimWidth(state.simWidth - step, { remeasure: true });
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setSimWidth(state.simWidth + step, { remeasure: true });
    } else if (e.key === "Home") {
      e.preventDefault();
      setSimWidth(390, { remeasure: true });
    } else if (e.key === "End") {
      e.preventDefault();
      setSimWidth(1080, { remeasure: true });
    }
  });

  // 点击宽度刻度快捷跳转（390 / 600 / 840 / 1080）
  widthPresetBtns.forEach((b) => {
    b.addEventListener("click", () => setSimWidth(+b.dataset.heroW, { remeasure: true }));
  });

  // 5. 窗口右边缘拖拽缩放柄（桌面直拖窗口右边跨过 840 / 600 两档）
  let edgeDrag = null;
  edgeHandle.addEventListener("pointerdown", (e) => {
    edgeDrag = { id: e.pointerId, startX: e.clientX, startW: state.simWidth };
    state.dragging = true;
    try { edgeHandle.setPointerCapture(e.pointerId); } catch {}
    heroWrap.classList.add("is-dragging");
    e.preventDefault();
  });
  window.addEventListener("pointermove", (e) => {
    if (!edgeDrag || edgeDrag.id !== e.pointerId) return;
    const dx = e.clientX - edgeDrag.startX;
    setSimWidth(clamp(edgeDrag.startW + dx, MIN_W, Math.min(MAX_W, Math.max(availW - 26, 620))));
  });
  const endEdge = (e) => {
    if (!edgeDrag || edgeDrag.id !== e.pointerId) return;
    edgeDrag = null;
    state.dragging = false;
    heroWrap.classList.remove("is-dragging");
    applyWindowLayout({ remeasure: true });
  };
  window.addEventListener("pointerup", endEdge);
  window.addEventListener("pointercancel", endEdge);

  edgeHandle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 60 : 20;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSimWidth(state.simWidth - step, { remeasure: true });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSimWidth(state.simWidth + step, { remeasure: true });
    }
  });

  // 6. 次要控件：左栏占比微调滑轨（不抢主角，无预设按钮）
  ratioRange.addEventListener("input", () => {
    state.listPct = clamp(+ratioRange.value, 24, 48);
    applyWindowLayout();
    updateTelemetry();
  });

  // 7. 重置计数
  resetBtn.addEventListener("click", () => {
    const isCompact = getTier() === "compact";
    state.active = 0;
    state.pane = isCompact ? "list" : "detail";
    state.savedScrollTop = 0;
    listScrollEl.scrollTop = 0;
    state.visited = isCompact ? new Set() : new Set([0]);
    state.done.clear();
    state.switches = 0;
    state.backs = 0;
    if (restoreBadge) restoreBadge.hidden = true;
    updateDetailDOM();
    applyWindowLayout({ remeasure: true });
    updateTelemetry();
  });

  updateDetailDOM();
  measureAndSync();
}
