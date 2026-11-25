// 01 / 03 / 05 / 07 / 08 节交互逻辑与海报放大查看器
import { reducedMotion } from "../../lib/stage.js";
import { QUIZ_SCENARIOS, STATE_CASES, STATE_ITEMS, clamp } from "./model.js";

const $ = (id) => document.getElementById(id);

export function initFigures() {
  initReveal();
  initContrastLab();
  initStateLab();
  initDensityLab();
  initQuiz();
  initPosterViewer();
}

// ---------- 滚动渐显（保守、不卡屏、尊重减少动态效果） ----------
function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.01, rootMargin: "80px 0px 80px 0px" }
  );
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 40) el.classList.add("in");
    else io.observe(el);
  });
}

// ---------- 01 节：关掉明暗对照 / 焦点对比实验 ----------
function initContrastLab() {
  const box = $("contrast-demo");
  const readout = $("contrast-read");
  const btns = [...document.querySelectorAll("[data-contrast]")];
  if (!box) return;

  const COPY = {
    poster: "原版层级：暗列表压低视觉噪音，暖米详情抬高亮度，亮橙只给唯一选中项与右下行动按钮。视线立刻就能顺着橙条落进详情。",
    flat: "去掉明暗对照：左右两栏一样亮，列表不再像退后的目录，整页变成两大块并排的白框，眼睛要在两边来回犹豫。",
    noisy: "去掉唯一焦点：每条列表都挂满亮橙色标和按钮，主次瞬间塌陷——处处都在喊「看我」，结果哪里都看不进去。",
  };

  const apply = (mode) => {
    box.dataset.mode = mode;
    readout.textContent = COPY[mode];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.contrast === mode)));
  };
  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.contrast)));
  apply("poster");
}

// ---------- 03 节：选中态、空状态与直达链接实验台（严格遵守 <600px 单窗格） ----------
function initStateLab() {
  const root = $("state-lab");
  if (!root) return;

  const caseBtns = [...root.querySelectorAll("[data-scase]")];
  const modeBtns = [...root.querySelectorAll("[data-smode]")];
  const paneBtns = [...root.querySelectorAll("[data-spane]")];
  const filterBtns = [...root.querySelectorAll("[data-sfilter]")];
  const listEl = $("sl-list");
  const detailEl = $("sl-detail");
  const urlBar = $("sl-url-bar");
  const urlText = $("sl-url-text");
  const urlBtn = $("sl-url-reopen");
  const filterBar = $("sl-filter-bar");
  const triggerBtn = $("sl-trigger");
  const resetBtn = $("sl-reset");
  const titleEl = $("sl-case-title");
  const diffEl = $("sl-diff");
  const whyEl = $("sl-why");

  const st = {
    caseId: "empty",       // "empty" | "filter" | "delete" | "deeplink"
    mode: "good",          // "bad" | "good"
    mobilePane: "detail",  // <600px 单窗格切换："list" | "detail"
    filter: "all",         // "all" | "high"
    removed: new Set(),
    selectedId: null,
    notice: "",
    flashId: "",
  };

  function visibleItems() {
    return STATE_ITEMS.filter((it) => !st.removed.has(it.id) && (st.filter === "all" || it.priority === "high"));
  }

  function findItem(id) {
    return STATE_ITEMS.find((it) => it.id === id) || null;
  }

  function setupCase(caseId, keepMode = true) {
    st.caseId = caseId;
    if (!keepMode) st.mode = "good";
    st.filter = "all";
    st.removed.clear();
    st.notice = "";
    st.flashId = "";

    if (caseId === "empty") {
      st.selectedId = null;
      st.mobilePane = "detail";
    } else if (caseId === "filter") {
      st.selectedId = "RQ-102"; // 常规项，一旦点「仅看高优」就会被筛掉
      st.filter = "high";
      applyFilterPolicy();
      st.mobilePane = "detail";
    } else if (caseId === "delete") {
      // 预演示刚移出 RQ-102 的瞬间，让坏/好做法一打开就形成直观对比，同时还能继续删完剩下 4 条
      st.selectedId = "RQ-102";
      removeCurrent({ silentRender: true });
      st.mobilePane = "detail";
    } else if (caseId === "deeplink") {
      st.selectedId = "RQ-103";
      simulateReloadLink({ silentRender: true });
      st.mobilePane = "detail";
    }
    render();
  }

  function applyFilterPolicy() {
    const vis = visibleItems();
    const stillHere = vis.some((it) => it.id === st.selectedId);
    if (stillHere) {
      st.notice = "";
      return;
    }
    if (st.mode === "bad") {
      // 坏做法：右栏继续停留在已被过滤掉的幽灵详情
      st.notice = "ghost";
    } else {
      // 好做法：同步切到筛选结果第 1 条，并告知用户原因
      st.selectedId = vis.length ? vis[0].id : null;
      st.notice = vis.length ? "synced-filter" : "empty-filter";
    }
  }

  function removeCurrent({ silentRender = false } = {}) {
    if (!st.selectedId) return;
    const before = visibleItems();
    const idx = before.findIndex((it) => it.id === st.selectedId);
    if (idx < 0) return;

    const gone = before[idx];
    st.removed.add(gone.id);
    const after = visibleItems();

    if (st.mode === "bad") {
      st.selectedId = null;
      st.notice = `lost:${gone.id}`;
    } else if (after.length) {
      const nextItem = after[Math.min(idx, after.length - 1)];
      st.selectedId = nextItem.id;
      st.flashId = nextItem.id;
      st.notice = `advanced:${gone.id}:${nextItem.id}`;
    } else {
      st.selectedId = null;
      st.notice = "all-cleared";
    }
    st.mobilePane = "detail";
    if (!silentRender) render();
  }

  function simulateReloadLink({ silentRender = false } = {}) {
    const targetId = st.selectedId || "RQ-103";
    if (st.mode === "bad") {
      st.selectedId = STATE_ITEMS[0].id;
      st.notice = `url-lost:${targetId}`;
    } else {
      st.selectedId = targetId;
      st.flashId = targetId;
      st.notice = `url-hit:${targetId}`;
    }
    st.mobilePane = "detail";
    if (!silentRender) render();
  }

  function render() {
    const cfg = STATE_CASES[st.caseId];
    const vis = visibleItems();

    root.dataset.scase = st.caseId;
    root.dataset.smode = st.mode;
    root.dataset.pane = st.mobilePane;

    caseBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scase === st.caseId)));
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.smode === st.mode)));
    paneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.spane === st.mobilePane)));
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sfilter === st.filter)));

    titleEl.textContent = cfg.heading;
    diffEl.textContent = st.mode === "bad" ? cfg.badDesc : cfg.goodDesc;
    whyEl.textContent = cfg.why;

    // 按当前情况露出专属控制条（不堆多余控件）
    filterBar.hidden = st.caseId !== "filter";
    urlBar.hidden = st.caseId !== "deeplink";

    if (st.caseId === "deeplink") {
      const shownId = st.selectedId || "RQ-103";
      urlText.textContent = st.mode === "bad" ? "app.example/reqs" : `app.example/reqs/${shownId}`;
      urlBar.dataset.synced = st.mode === "good" ? "1" : "0";
    }

    // 主演示触发按钮文案随情况变化
    if (st.caseId === "empty") {
      triggerBtn.textContent = "模拟刚打开（未选中）";
    } else if (st.caseId === "filter") {
      triggerBtn.textContent = st.filter === "high" ? "恢复全部 5 条" : "筛选「仅看高优」";
    } else if (st.caseId === "delete") {
      triggerBtn.textContent = vis.length && st.selectedId ? `完成并移出 ${st.selectedId}` : "恢复 5 条队列";
    } else {
      triggerBtn.textContent = "模拟同事打开链接 / 刷新";
    }

    // 渲染左栏列表
    const highCount = STATE_ITEMS.filter((it) => !st.removed.has(it.id) && it.priority === "high").length;
    const allCount = STATE_ITEMS.filter((it) => !st.removed.has(it.id)).length;
    const allBtn = filterBar.querySelector('[data-sfilter="all"]');
    const hiBtn = filterBar.querySelector('[data-sfilter="high"]');
    if (allBtn) allBtn.textContent = `全部 (${allCount})`;
    if (hiBtn) hiBtn.textContent = `仅看高优 (${highCount})`;

    if (!vis.length) {
      listEl.innerHTML = `<div class="sl-list-empty">当前列表已清空<br><button type="button" class="sl-inline-btn" data-sact="restore">恢复 5 条清单</button></div>`;
    } else {
      listEl.innerHTML = vis
        .map((it) => {
          const isSel = it.id === st.selectedId;
          const isFlash = it.id === st.flashId;
          return `
            <button type="button" class="sl-row${isSel ? " is-active" : ""}${isFlash ? " is-flash" : ""}" role="option" aria-selected="${isSel}" data-sid="${it.id}">
              <span class="sl-row-top">
                <span class="sl-id" lang="en">${it.id}</span>
                <em class="sl-prio" data-p="${it.priority}">${it.priorityLabel}</em>
                <time>${it.time}</time>
              </span>
              <b>${it.title}</b>
              <small>${it.owner}</small>
            </button>`;
        })
        .join("");
    }

    // 渲染右栏详情 / 空状态 / 冲突提示
    const activeItem = findItem(st.selectedId);
    const inVis = activeItem && vis.some((it) => it.id === activeItem.id);
    let bannerHtml = "";
    let bodyHtml = "";

    const backBarHtml = `<div class="sl-mobile-back-row"><button type="button" class="sl-back" data-sact="to-list">← 返回列表</button><span class="sl-back-meta">${vis.length ? `清单共 ${vis.length} 条` : "队列为空"}</span></div>`;

    if (st.caseId === "empty" && !activeItem) {
      if (st.mode === "bad") {
        bodyHtml = `
          <div class="sl-empty is-bad">
            <p class="sl-empty-blank">暂无数据</p>
            <p class="sl-empty-sub">（整块右栏留白，看不出是没选中、列表为空，还是网络加载失败）</p>
          </div>`;
      } else {
        bodyHtml = `
          <div class="sl-empty is-good">
            <span class="sl-empty-badge">未选中条目 · 轻量引导态</span>
            <h4>从左侧选择一条评审单</h4>
            <p>当前待处理 <b>${allCount}</b> 条（其中高优 <b>${highCount}</b> 条）。宽屏下点击任意行或按 <kbd>↑</kbd><kbd>↓</kbd> 即刻在右侧展开。</p>
            <button type="button" class="sl-action-btn" data-sact="pick-first">选中第 1 条开始 →</button>
          </div>`;
      }
    } else if (st.caseId === "delete" && !activeItem) {
      if (st.notice === "all-cleared") {
        bodyHtml = `
          <div class="sl-empty is-good">
            <span class="sl-empty-badge">队列已清空</span>
            <h4>5 条评审单已全部处理完成</h4>
            <p>直到最后一条移出后，右栏才切入完成态，并给出明确的下一步入口。</p>
            <button type="button" class="sl-action-btn" data-sact="restore">恢复 5 条再试一次</button>
          </div>`;
      } else {
        const goneId = st.notice.startsWith("lost:") ? st.notice.slice(5) : "当前项";
        bodyHtml = `
          <div class="sl-empty is-bad">
            <span class="sl-empty-badge is-warn">反例 · 选中态丢失</span>
            <p class="sl-empty-blank">${goneId} 已删除，右栏变空</p>
            <p class="sl-empty-sub">左栏还剩 ${vis.length} 条待办，却没有自动顺延下一条——你得重新去左栏点一行才能继续。</p>
          </div>`;
      }
    } else if (activeItem) {
      if (st.caseId === "filter" && !inVis) {
        bannerHtml = `<p class="sl-banner is-warn">⚠ 幽灵详情：左栏筛选为「仅看高优」已不含 ${activeItem.id}，右栏却仍死停在这条常规项上，左右不再对应。</p>`;
      } else if (st.notice === "synced-filter") {
        bannerHtml = `<p class="sl-banner is-ok">✓ 原常规项已被筛选隐藏 → 自动同步选中筛选后第 1 条（${activeItem.id}）。<button type="button" class="sl-link-btn" data-sact="clear-filter">恢复全部</button></p>`;
      } else if (st.notice.startsWith("advanced:")) {
        const [, gone, next] = st.notice.split(":");
        bannerHtml = `<p class="sl-banner is-ok">✓ ${gone} 已移出 → 选中态与焦点自动顺延至紧邻下一条 ${next}，可连续处理。</p>`;
      } else if (st.notice.startsWith("url-lost:")) {
        const wanted = st.notice.slice(9);
        bannerHtml = `<p class="sl-banner is-warn">⚠ 地址栏没有记录 ${wanted}：刷新或打开同事发来的 /reqs 链接后，页面直接掉回了第 1 条 ${activeItem.id}。</p>`;
      } else if (st.notice.startsWith("url-hit:")) {
        bannerHtml = `<p class="sl-banner is-ok">✓ 网址直达 /reqs/${activeItem.id}：打开即定位到目标详情，左栏同步滚入并高亮。</p>`;
      }

      const footAction =
        st.caseId === "delete"
          ? `<button type="button" class="sl-action-btn" data-sact="delete-cur">完成并移出 ${activeItem.id}</button>`
          : st.caseId === "deeplink"
            ? `<button type="button" class="sl-action-btn" data-sact="reopen">模拟刷新 / 发给同事打开</button>`
            : `<span class="sl-note-chip">${activeItem.note}</span>`;

      bodyHtml = `
        ${bannerHtml}
        <div class="sl-d-card">
          <div class="sl-d-meta">
            <span class="sl-d-id" lang="en">${activeItem.id}</span>
            <em class="sl-prio" data-p="${activeItem.priority}">${activeItem.priorityLabel}</em>
            <span>${activeItem.owner} · ${activeItem.time}</span>
          </div>
          <h4>${activeItem.title}</h4>
          <p class="sl-d-body">${activeItem.body}</p>
          <div class="sl-d-foot">
            <span class="sl-d-note">${activeItem.note}</span>
            ${footAction}
          </div>
        </div>`;
    }

    detailEl.innerHTML = backBarHtml + bodyHtml;
    st.flashId = "";
  }

  // 事件委托：列表点击与详情区按钮
  listEl.addEventListener("click", (e) => {
    const restore = e.target.closest('[data-sact="restore"]');
    if (restore) {
      setupCase(st.caseId, true);
      return;
    }
    const row = e.target.closest("[data-sid]");
    if (!row) return;
    st.selectedId = row.dataset.sid;
    st.notice = "";
    st.mobilePane = "detail";
    render();
  });

  detailEl.addEventListener("click", (e) => {
    const act = e.target.closest("[data-sact]")?.dataset.sact;
    if (!act) return;
    if (act === "to-list") {
      st.mobilePane = "list";
      render();
    } else if (act === "pick-first") {
      const vis = visibleItems();
      if (vis.length) {
        st.selectedId = vis[0].id;
        st.notice = "";
        st.mobilePane = "detail";
        render();
      }
    } else if (act === "clear-filter") {
      st.filter = "all";
      st.notice = "";
      render();
    } else if (act === "delete-cur") {
      removeCurrent();
    } else if (act === "restore") {
      setupCase("delete", true);
    } else if (act === "reopen") {
      simulateReloadLink();
    }
  });

  // 顶部 4 个情况标签
  caseBtns.forEach((b) => b.addEventListener("click", () => setupCase(b.dataset.scase, true)));

  // 坏做法 vs 好做法即时切换对比
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.mode = b.dataset.smode;
      setupCase(st.caseId, true);
    })
  );

  // <600px 单窗格切换器（列表窗格 / 详情窗格）
  paneBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.mobilePane = b.dataset.spane;
      render();
    })
  );

  // 情况 2 筛选条
  filterBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.filter = b.dataset.sfilter;
      if (st.filter === "high") {
        if (!st.selectedId) st.selectedId = "RQ-102";
        applyFilterPolicy();
        st.mobilePane = "detail";
      } else {
        st.notice = "";
      }
      render();
    })
  );

  // 情况 4 地址栏右侧模拟打开按钮
  if (urlBtn) urlBtn.addEventListener("click", simulateReloadLink);

  // 主操作按钮 & 重置
  triggerBtn.addEventListener("click", () => {
    if (st.caseId === "empty") {
      st.selectedId = null;
      st.notice = "";
      st.mobilePane = "detail";
      render();
    } else if (st.caseId === "filter") {
      if (st.filter === "high") {
        st.filter = "all";
        st.selectedId = "RQ-102";
        st.notice = "";
      } else {
        st.selectedId = "RQ-102";
        st.filter = "high";
        applyFilterPolicy();
      }
      st.mobilePane = "detail";
      render();
    } else if (st.caseId === "delete") {
      if (visibleItems().length && st.selectedId) removeCurrent();
      else setupCase("delete", true);
    } else {
      simulateReloadLink();
    }
  });

  resetBtn.addEventListener("click", () => setupCase(st.caseId, true));

  setupCase("empty", true);
}

// ---------- 05 节：列表密度调节器 ----------
function initDensityLab() {
  const demo = $("density-demo");
  const readout = $("density-read");
  const btns = [...document.querySelectorAll("[data-density]")];
  if (!demo) return;

  const COPY = {
    sparse: "信息过简：列表里只剩冷冰冰的编号，没有标题和状态。想找「发票抬头」那一条，只能从头到尾盲点一遍。",
    balanced: "信息刚好：每行只放「状态点 + 清晰标题 + 一行短线索」，一屏能扫 5–8 条，点中后在右边看正文并点击主按钮。",
    bloated: "列表过载：把正文、配图、标签和三个操作按钮全塞进左栏，每一项胀成一张大卡片——一屏只看得到两条，列表自己抢走了详情的活。",
  };

  const apply = (d) => {
    demo.dataset.density = d;
    readout.textContent = COPY[d];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.density === d)));
  };
  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.density)));
  apply("balanced");
}

// ---------- 07 节：4 场景版式取舍判断练习 ----------
function initQuiz() {
  const cards = [...document.querySelectorAll("[data-scenario]")];
  const scoreEl = $("quiz-score");
  const summaryEl = $("quiz-summary");
  const revealBtn = $("quiz-reveal");
  const resetBtn = $("quiz-reset");
  if (!cards.length) return;

  const map = Object.fromEntries(QUIZ_SCENARIOS.map((s) => [s.id, s]));
  const picked = {};

  function updateSummary() {
    const keys = Object.keys(picked);
    const rightCount = keys.filter((id) => picked[id] === map[id].answer).length;
    scoreEl.textContent = `已判断 ${keys.length} / ${QUIZ_SCENARIOS.length} · 答对 ${rightCount} / ${QUIZ_SCENARIOS.length}`;
    if (keys.length === 0) {
      summaryEl.textContent = "四个需求都像「清单配详情」，但只有 1 个真正该上桌面列表—详情双栏。先逐个拍板，看你会不会踩进常见惯性里。";
      summaryEl.dataset.state = "idle";
    } else if (keys.length < QUIZ_SCENARIOS.length) {
      summaryEl.textContent = `已完成 ${keys.length} 个场景判断，继续选完剩下 ${QUIZ_SCENARIOS.length - keys.length} 个；选错的卡片可以直接改选，对比不同版式的取舍理由。`;
      summaryEl.dataset.state = "progress";
    } else if (rightCount === QUIZ_SCENARIOS.length) {
      summaryEl.textContent = "全部判断准确！一句话收尾：条目多、高频切换、单条深看、屏幕够宽，四条凑齐才上列表—详情双栏；缺了哪一条，就果断换成单栏钻取、标签页或对比表格。";
      summaryEl.dataset.state = "right";
    } else {
      summaryEl.textContent = `4 个场景已全部试完（答对 ${rightCount} / 4）。再点一下选错卡片里的其他按钮，把「什么时候别用」的四条边界对齐一遍。`;
      summaryEl.dataset.state = "done";
    }
  }

  function renderCard(card) {
    const id = card.dataset.scenario;
    const sc = map[id];
    const choice = picked[id];
    const btns = [...card.querySelectorAll("[data-choice]")];
    const out = card.querySelector(".sc-verdict");
    const badge = card.querySelector(".sc-status");

    if (!choice) {
      card.dataset.state = "idle";
      badge.textContent = "待判断";
      out.textContent = "挑一个最合适的版式，看取舍理由。";
      btns.forEach((b) => {
        b.setAttribute("aria-pressed", "false");
        b.classList.remove("is-right", "is-wrong");
      });
      return;
    }

    const ok = choice === sc.answer;
    card.dataset.state = ok ? "right" : "wrong";
    badge.textContent = ok ? "✓ 选对了" : "× 再想想";
    out.textContent = sc.feedback[choice];
    btns.forEach((b) => {
      const c = b.dataset.choice;
      const isMe = c === choice;
      b.setAttribute("aria-pressed", String(isMe));
      b.classList.toggle("is-right", isMe && ok);
      b.classList.toggle("is-wrong", isMe && !ok);
    });
  }

  cards.forEach((card) => {
    const id = card.dataset.scenario;
    card.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[id] = btn.dataset.choice;
        renderCard(card);
        updateSummary();
      });
    });
    renderCard(card);
  });

  if (revealBtn) {
    revealBtn.addEventListener("click", () => {
      for (const sc of QUIZ_SCENARIOS) picked[sc.id] = sc.answer;
      cards.forEach(renderCard);
      updateSummary();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      for (const k of Object.keys(picked)) delete picked[k];
      cards.forEach(renderCard);
      updateSummary();
    });
  }

  updateSummary();
}

// ---------- 08 节：原海报放大查看器（支持缩放、拖动、Esc 关闭） ----------
function initPosterViewer() {
  const openBtn = $("poster-open");
  const poster = $("poster");
  const dlg = $("viewer");
  const img = $("viewer-img");
  const scroller = $("viewer-scroll");
  const zoomOut = $("zoom-out");
  const zoomIn = $("zoom-in");
  const zoomReset = $("zoom-reset");
  const zoomVal = $("zoom-val");
  const closeBtn = $("viewer-close");
  if (!openBtn || !dlg) return;

  let zoom = 1;
  const setZoom = (z) => {
    zoom = clamp(Math.round(z * 100) / 100, 0.75, 2.5);
    img.style.width = `${Math.round(zoom * 100)}%`;
    zoomVal.textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= 0.75;
    zoomIn.disabled = zoom >= 2.5;
  };

  openBtn.addEventListener("click", () => {
    if (!img.src) img.src = poster.src;
    setZoom(1);
    dlg.showModal();
    document.documentElement.classList.add("noscroll");
    closeBtn.focus();
  });

  const finishClose = () => {
    document.documentElement.classList.remove("noscroll");
    openBtn.focus();
  };
  dlg.addEventListener("close", finishClose);
  closeBtn.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });

  zoomOut.addEventListener("click", () => setZoom(zoom - 0.25));
  zoomIn.addEventListener("click", () => setZoom(zoom + 0.25));
  zoomReset.addEventListener("click", () => setZoom(1));

  // 鼠标拖动查看放大后的海报
  let drag = null;
  scroller.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sl: scroller.scrollLeft, st: scroller.scrollTop };
    try { scroller.setPointerCapture(e.pointerId); } catch {}
    scroller.classList.add("dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    scroller.scrollLeft = drag.sl - (e.clientX - drag.x);
    scroller.scrollTop = drag.st - (e.clientY - drag.y);
  });
  const endDrag = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    scroller.classList.remove("dragging");
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}
