// 01–08 各小节的互动实验、练习诊断与海报放大灯箱
import { describeBreakpoint, describeStress, QUIZ_OPTIONS } from "./model.js";

const $ = (id) => document.getElementById(id);

/* =========================================================
   01 · 双向关联演示台（主内容 ↔ 辅助窗格实时联动 + 断联对比）
   ========================================================= */
const LINK_ITEMS = [
  {
    id: "metric-a",
    tag: "增长异常",
    title: "4 月留存率跃升 +11.4%",
    body: "核心用户次月留存由 38.2% 升至 49.6%，移动端贡献主要增量。",
    context: "统计口径：排除新注册 7 天内试用账号，按自然月回访计算。",
    support: "已自动勾选「仅看核心付费群体」筛选条件。",
    relation: "关联变更：4 月 3 日上线的新手引导简化版（#REL-403）。",
    cat: "growth",
  },
  {
    id: "metric-b",
    tag: "性能告警",
    title: "报表首屏耗时 3.4 s",
    body: "明细表在宽屏端加载超过 2,000 行时，主线程出现短暂卡顿。",
    context: "环境快照：桌面 Chrome 宽屏，单次拉取全量 18 列字段。",
    support: "建议操作：开启虚拟滚动，并把低频明细列移入右侧辅助窗格。",
    relation: "关联工单：前端渲染优化追踪（#PERF-118）。",
    cat: "perf",
  },
  {
    id: "metric-c",
    tag: "转化回落",
    title: "续费页跳出率上升",
    body: "套餐对比页停留时间拉长，但底部确认按钮点击率下降。",
    context: "用户行为：62% 访客在价格项与权益说明之间来回上下滚动。",
    support: "改进参考：在右侧增加常驻费用汇总与答疑窗格，减少上下翻找。",
    relation: "关联访谈：第 14 期用户可用性回访记录（#UX-014）。",
    cat: "growth",
  },
];

export function initLinkLab() {
  const listEl = $("link-main-list");
  const filterSeg = $("link-filter");
  const syncBtn = $("link-sync-btn");
  if (!listEl) return;

  let activeId = "metric-a";
  let filterCat = "all";
  let synced = true;

  function render() {
    const visible = LINK_ITEMS.filter((it) => !synced || filterCat === "all" || it.cat === filterCat);
    if (!visible.some((it) => it.id === activeId) && visible.length) activeId = visible[0].id;
    const cur = LINK_ITEMS.find((it) => it.id === activeId) || LINK_ITEMS[0];
    // 断联状态下右侧锁定死板内容，不再随左侧选区变化
    const shown = synced ? cur : LINK_ITEMS[0];

    listEl.querySelectorAll(".link-card").forEach((btn) => {
      const id = btn.dataset.id;
      const item = LINK_ITEMS.find((x) => x.id === id);
      const hidden = synced && filterCat !== "all" && item.cat !== filterCat;
      btn.hidden = hidden;
      btn.classList.toggle("active", id === activeId);
      btn.setAttribute("aria-pressed", String(id === activeId));
    });

    $("aux-context").textContent = synced ? shown.context : "固定公告：系统每周五凌晨例行维护（与左侧所选条目无关）。";
    $("aux-support").textContent = synced ? shown.support : "通用快捷入口：查看帮助中心 / 联系客服。";
    $("aux-relation").textContent = synced ? shown.relation : "热门榜单：本月全站阅读最高的 5 篇文档。";
    $("aux-target-badge").textContent = synced ? `跟随：${shown.tag}` : "已断联 · 静态栏";
    $("aux-target-badge").dataset.synced = String(synced);

    $("link-read").textContent = synced
      ? `联动生效中：点击左侧「${cur.title}」，右侧三块支撑信息同步切换；切换右侧筛选条件，左侧主内容也会即时过滤。`
      : "已模拟「断联」状态：左侧怎么切换条目，右侧都纹丝不动，筛选项也失效——此时辅助窗格退化成与主任务无关的孤立边栏，用户很快就会无视它。";

    syncBtn.setAttribute("aria-pressed", String(!synced));
    syncBtn.textContent = synced ? "断开关联试试" : "恢复双向联动";
  }

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".link-card");
    if (!btn) return;
    activeId = btn.dataset.id;
    render();
  });

  filterSeg.addEventListener("change", (e) => {
    filterCat = e.target.value;
    render();
  });

  syncBtn.addEventListener("click", () => {
    synced = !synced;
    render();
  });

  render();
}

/* =========================================================
   02 · 模态弹窗 vs 非模态辅助窗格（体验 Alan Cooper 的「附加工」）
   ========================================================= */
export function initModalLab() {
  const box = $("modal-lab");
  if (!box) return;

  const state = {
    mode: "pane", // "pane" | "modal"
    modalOpen: false,
    accent: "navy",
    density: "normal",
    grid: true,
    exciseClicks: 0,
    changes: 0,
  };

  const preview = $("ml-preview");
  const modalLayer = $("ml-modal-layer");
  const openBtn = $("ml-open-modal");
  const closeBtn = $("ml-close-modal");

  function syncControls(prefix) {
    box.querySelectorAll(`[data-ml-prop]`).forEach((btn) => {
      const prop = btn.dataset.mlProp;
      const val = btn.dataset.mlVal;
      const active = String(state[prop]) === val;
      btn.setAttribute("aria-pressed", String(active));
      btn.classList.toggle("is-on", active);
    });
    void prefix;
  }

  function render() {
    box.dataset.mode = state.mode;
    preview.dataset.accent = state.accent;
    preview.dataset.density = state.density;
    preview.dataset.grid = String(state.grid);

    const showModal = state.mode === "modal" && state.modalOpen;
    modalLayer.hidden = !showModal;
    openBtn.hidden = state.mode !== "modal";

    $("ml-excise").textContent = String(state.exciseClicks);
    $("ml-changes").textContent = String(state.changes);

    if (state.mode === "pane") {
      $("ml-read").textContent =
        state.changes === 0
          ? "非模态辅助窗格模式：右侧直接调配色、密度与网格，左侧主画面实时变化，零遮挡、零弹窗开关。"
          : `你做了 ${state.changes} 次有效调整，期间额外打开/关闭弹窗的「附加工」点击为 0 次，视线始终没离开主画布。`;
    } else {
      $("ml-read").textContent = showModal
        ? "模态弹窗盖住了主画布：你改完参数却看不清实际效果，必须先关掉弹窗检查，不满意再点开重调。"
        : state.exciseClicks > 0
          ? `在模态弹窗模式下，完成 ${state.changes} 次有效调整已经多花了 ${state.exciseClicks} 次纯开关弹窗的「附加工（Excise）」操作。`
          : "试试切到弹窗模式后点「打开设置弹窗」改两项参数，感受反复开关和遮挡画布的打断感。";
    }

    syncControls();
  }

  $("ml-mode").addEventListener("change", (e) => {
    state.mode = e.target.value;
    state.modalOpen = false;
    state.exciseClicks = 0;
    state.changes = 0;
    render();
  });

  openBtn.addEventListener("click", () => {
    state.modalOpen = true;
    state.exciseClicks++;
    render();
  });

  closeBtn.addEventListener("click", () => {
    state.modalOpen = false;
    state.exciseClicks++;
    render();
  });

  box.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ml-prop]");
    if (!btn) return;
    const prop = btn.dataset.mlProp;
    const val = btn.dataset.mlVal;
    state[prop] = val === "true" ? true : val === "false" ? false : val;
    state.changes++;
    render();
  });

  render();
}

/* =========================================================
   03 · 宽度、策略与视觉噪声压力台
   ========================================================= */
export function initStressLab() {
  const vwRange = $("stress-vw");
  const modeSeg = $("stress-mode");
  const noiseBtn = $("stress-noise");
  if (!vwRange) return;

  let vw = 1440;
  let mode = "fixed";
  let noisy = false;

  function render() {
    const info = describeStress(vw, mode, noisy);
    $("stress-vw-out").textContent = `${vw} px`;
    $("stress-main-px").textContent = `${info.mainPx} px (${info.mainPct}%)`;
    $("stress-aux-px").textContent = `${info.auxPx} px (${info.auxPct}%)`;
    $("stress-badge").textContent = info.badge;
    $("stress-badge").dataset.status = info.status;
    $("stress-verdict").textContent = info.verdict;

    // 预览框按视口相对缩放，一眼看出 768 / 1440 / 2200 下的真实松紧度
    const stage = $("stress-stage");
    const scalePct = Math.round(((vw - 640) / (2200 - 640)) * 42 + 58);
    stage.style.setProperty("--vp-w", `${scalePct}%`);
    stage.style.setProperty("--aux-pct", `${info.auxPct}%`);
    stage.dataset.noisy = String(noisy);
    stage.dataset.status = info.status;

    noiseBtn.setAttribute("aria-pressed", String(noisy));
    noiseBtn.textContent = noisy ? "还原低噪克制" : "模拟花哨杂物栏";
  }

  vwRange.addEventListener("input", () => {
    vw = +vwRange.value;
    render();
  });
  modeSeg.addEventListener("change", (e) => {
    mode = e.target.value;
    render();
  });
  noiseBtn.addEventListener("click", () => {
    noisy = !noisy;
    render();
  });

  render();
}

/* =========================================================
   04 · 跨端形态变形台（360px – 1440px 断点 + Push/Overlay + 折叠）
   ========================================================= */
export function initBreakpointLab() {
  const range = $("bp-range");
  const presets = $("bp-presets");
  const behavSeg = $("bp-behavior");
  const toggleBtn = $("bp-toggle");
  if (!range) return;

  let vw = 1280;
  let behavior = "push";
  let open = true;

  function render() {
    const info = describeBreakpoint(vw, behavior, open);
    range.value = String(vw);
    $("bp-vw-out").textContent = `${vw} px`;
    $("bp-tier").textContent = info.tierLabel;
    $("bp-badge").textContent = info.badge;
    $("bp-title").textContent = info.title;
    $("bp-text").textContent = info.text;

    const frame = $("bp-frame");
    frame.dataset.mode = info.layoutMode;
    frame.dataset.tier = info.tier;
    // 动态设备外框宽度感
    const framePct = Math.round(((vw - 360) / (1440 - 360)) * 58 + 42);
    frame.style.setProperty("--dev-w", `${framePct}%`);

    toggleBtn.setAttribute("aria-pressed", String(!open));
    toggleBtn.textContent = open ? "折叠辅助窗格" : "展开辅助窗格";

    presets.querySelectorAll("button").forEach((b) => {
      const hit = Math.abs(+b.dataset.vw - vw) <= 10;
      b.setAttribute("aria-pressed", String(hit));
    });
  }

  range.addEventListener("input", () => {
    vw = +range.value;
    render();
  });

  presets.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-vw]");
    if (!b) return;
    vw = +b.dataset.vw;
    render();
  });

  behavSeg.addEventListener("change", (e) => {
    behavior = e.target.value;
    render();
  });

  toggleBtn.addEventListener("click", () => {
    open = !open;
    render();
  });

  render();
}

/* =========================================================
   05 · 四类海报适用场景（可切 tab + 蓝图示意）
   ========================================================= */
const SCENARIO_CARDS = {
  analysis: {
    zh: "数据分析",
    en: "DATA ANALYSIS",
    mainRole: "核心趋势折线、分项柱图、关键指标卡",
    auxRole: "多维筛选条件、统计口径备注、异常点关联报表",
    why: "分析决策最怕「改一个筛选条件就跳走重加载」。辅助窗格让参数调节和图表反馈同屏共振。",
    tip: "筛选器超过 6 项时，用折叠分组收纳，别让左图被右栏拉成长页面。",
  },
  browsing: {
    zh: "内容浏览",
    en: "CONTENT BROWSING",
    mainRole: "长篇文章、知识库正文、高清图集",
    auxRole: "章节目录大纲、专业词条注释、相关引用与延伸",
    why: "读者保持纵向阅读节奏，只有遇到生词或想查上下文时，视线才向右借一眼——像纸书的优雅边注。",
    tip: "提供一键收起或纯阅读模式，让不需要辅助信息的读者拿回全部行宽。",
  },
  creation: {
    zh: "编辑创作",
    en: "CONTENT CREATION",
    mainRole: "文档编辑区、设计画布、代码或音视频时间线",
    auxRole: "跟随选区实时切换的属性检查器（Inspector）、图层与批注",
    why: "源自 NeXTSTEP 与现代设计工具的经典范式：选中即改、改完即看，彻底消灭遮挡画布的模态设置框。",
    tip: "只展示「当前选中对象」相关的属性，不相关的参数隐藏，避免检查器无限拉长。",
  },
  settings: {
    zh: "设置管理",
    en: "SETTINGS & CONFIG",
    mainRole: "权限表、自动化规则、系统配置项列表",
    auxRole: "生效范围预览、依赖模块提示、待保存变更摘要",
    why: "后台配置最怕误改导致线上事故。在主列表旁实时显示「这条改动会影响谁」，就是最好的防错支撑。",
    tip: "高风险开关的警告提示紧贴右侧同屏出现，比保存后再弹报错框友好得多。",
  },
};

export function initScenariosLab() {
  const tabs = $("scen-tabs");
  if (!tabs) return;
  let cur = "analysis";

  function render() {
    const d = SCENARIO_CARDS[cur];
    tabs.querySelectorAll("[role='tab']").forEach((btn) => {
      const on = btn.dataset.scen === cur;
      btn.setAttribute("aria-selected", String(on));
    });
    $("scen-title").textContent = d.zh;
    $("scen-en").textContent = d.en;
    $("scen-main").textContent = d.mainRole;
    $("scen-aux").textContent = d.auxRole;
    $("scen-why").textContent = d.why;
    $("scen-tip").textContent = d.tip;
    $("scen-wire").dataset.scen = cur;
  }

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[role='tab']");
    if (!btn) return;
    cur = btn.dataset.scen;
    render();
  });

  render();
}

/* =========================================================
   07 · 小练习：四个数据看板辅助窗格方案
   ========================================================= */
export function initQuiz() {
  const quiz = $("quiz");
  if (!quiz) return;
  let picked = null;

  quiz.addEventListener("click", (e) => {
    const btn = e.target.closest(".q-opt");
    if (!btn) return;
    picked = btn.dataset.opt;
    quiz.classList.add("answered");

    quiz.querySelectorAll(".q-opt").forEach((b) => {
      const k = b.dataset.opt;
      const isCorrect = QUIZ_OPTIONS[k].correct;
      b.setAttribute("aria-pressed", String(k === picked));
      b.classList.toggle("picked", k === picked);
      b.classList.toggle("correct", isCorrect);
      b.classList.toggle("wrong", k === picked && !isCorrect);
      const mark = b.querySelector(".q-mark");
      if (mark) mark.textContent = isCorrect ? "✓ 成立" : QUIZ_OPTIONS[k].tag;
    });

    const info = QUIZ_OPTIONS[picked];
    const verdict = $("quiz-verdict");
    verdict.dataset.state = info.correct ? "correct" : "wrong";
    $("quiz-title").textContent = info.title;
    $("quiz-text").textContent = info.text;
  });
}

/* =========================================================
   08 · 原海报放大灯箱（支持拖动查看细节、缩放切换、Esc 关闭）
   ========================================================= */
export function initLightbox() {
  const posterBtn = $("poster-btn");
  const posterImg = $("poster");
  const lb = $("lightbox");
  const lbImg = $("lb-img");
  const lbStage = $("lb-stage");
  const lbClose = $("lb-close");
  const lbZoom = $("lb-zoom");
  if (!posterBtn || !lb) return;

  let zoomed = false;
  let tx = 0;
  let ty = 0;
  let drag = null;
  let moved = false;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${zoomed ? 1.85 : 1})`;
    lbStage.dataset.zoomed = String(zoomed);
    if (lbZoom) {
      lbZoom.setAttribute("aria-pressed", String(zoomed));
      lbZoom.textContent = zoomed ? "还原 1×" : "放大 1.8×";
    }
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    zoomed = false;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    posterBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    lbClose.focus({ preventScroll: true });
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    posterBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    posterBtn.focus({ preventScroll: true });
  }

  posterBtn.addEventListener("click", open);
  lbClose.addEventListener("click", close);

  if (lbZoom) {
    lbZoom.addEventListener("click", () => {
      zoomed = !zoomed;
      if (!zoomed) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    });
  }

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) return;
    e.preventDefault();
    lbStage.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: tx, sy: ty };
    moved = false;
  });

  lbStage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) moved = true;
    if (!zoomed && moved) {
      zoomed = true;
    }
    tx = Math.max(-420, Math.min(420, drag.sx + dx));
    ty = Math.max(-520, Math.min(520, drag.sy + dy));
    applyTransform();
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
  };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  lbStage.addEventListener("click", (e) => {
    if (moved) {
      moved = false;
      return;
    }
    if (e.target === lbStage) {
      close();
    } else if (e.target === lbImg) {
      zoomed = !zoomed;
      if (!zoomed) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

/* =========================================================
   渐显动效（尊重 reduced-motion）
   ========================================================= */
export function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
  );
  els.forEach((el) => io.observe(el));
}
