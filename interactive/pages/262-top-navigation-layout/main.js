// 262 顶部导航布局 · 主入口（单真源同步 + 顶部自示范导航跟踪 + 各节初始化）

import {
  applyFailCase,
  applySolution,
  createInitialState,
  evaluateNav,
} from "./model.js";
import { createNavStage } from "./stage.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

let state = createInitialState("learning");

// DOM 引用
const canvas = document.getElementById("nav-stage");
const topbarScore = document.getElementById("topbar-score");
const diagCard = document.getElementById("diag-card");
const diagTag = document.getElementById("diag-tag");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagFix = document.getElementById("diag-fix");

const probeEls = {
  guidance: document.getElementById("probe-guidance"),
  orientation: document.getElementById("probe-orientation"),
  overview: document.getElementById("probe-overview"),
  access: document.getElementById("probe-access"),
};

const chkEls = {
  overview: document.getElementById("chk-overview"),
  guidance: document.getElementById("chk-guidance"),
  orientation: document.getElementById("chk-orientation"),
  access: document.getElementById("chk-access"),
};

const rangeWidth = document.getElementById("range-width");
const valWidth = document.getElementById("val-width");
const rangeHeight = document.getElementById("range-height");
const valHeight = document.getElementById("val-height");
const btnBrandHome = document.getElementById("btn-brand-home");

function setState(patch) {
  state = { ...state, ...patch };
  syncUI();
  stage.draw();
}

const stage = createNavStage(
  canvas,
  () => state,
  setState,
  () => {}
);

const siteBtns = [...document.querySelectorAll("#ctrl-site [data-site]")];
const variantBtns = [...document.querySelectorAll("#ctrl-variant [data-variant]")];
const feedbackBtns = [...document.querySelectorAll("#ctrl-feedback [data-feedback]")];
const consistencyBtns = [...document.querySelectorAll("#ctrl-consistency [data-consistency]")];
const responsiveBtns = [...document.querySelectorAll("#ctrl-responsive [data-responsive]")];
const principleBtns = [...document.querySelectorAll("#principle-strip .p-probe")];

const setText = (el, txt) => { if (el.textContent !== txt) el.textContent = txt; };
const setCls = (el, cls, on) => { if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on); };

function syncUI() {
  const ev = evaluateNav(state);
  const okAll = ev.passCount === 4;

  // 顶栏状态胶囊
  setText(topbarScore, ev.summaryBadge);
  setCls(topbarScore, "is-ok", okAll);
  setCls(topbarScore, "is-bad", !okAll);

  // 四原则实时探针
  for (const key of ["guidance", "orientation", "overview", "access"]) {
    const c = ev.checks[key];
    const pEl = probeEls[key];
    setText(pEl, c.ok ? `✓ ${c.short}` : `× ${c.short}`);
    setCls(pEl, "is-ok", c.ok);
    setCls(pEl, "is-bad", !c.ok);

    const chk = chkEls[key];
    setCls(chk, "is-ok", c.ok);
    setCls(chk, "is-bad", !c.ok);
    setText(chk.querySelector(".chk-dot"), c.ok ? "✓" : "×");
  }

  // 单真源诊断舱
  setCls(diagCard, "is-ok", okAll);
  setText(diagTag, ev.diag.tag);
  setCls(diagTag, "is-ok", okAll);
  setCls(diagTag, "is-bad", !okAll);
  setText(diagHeadline, ev.diag.headline);
  setText(diagWhy, ev.diag.why);
  setText(diagFix, ev.diag.fix);

  // 控台分段按钮同步（预缓存节点，拖动零 DOM 查询）
  siteBtns.forEach((b) => setCls(b, "is-active", b.dataset.site === state.siteId));
  variantBtns.forEach((b) => setCls(b, "is-active", b.dataset.variant === state.variant));
  feedbackBtns.forEach((b) => setCls(b, "is-active", b.dataset.feedback === state.feedback));
  consistencyBtns.forEach((b) => setCls(b, "is-active", b.dataset.consistency === state.consistency));
  responsiveBtns.forEach((b) => setCls(b, "is-active", b.dataset.responsive === state.responsive));

  // 滑块与品牌回首页开关
  const wStr = String(state.simWidth);
  if (rangeWidth.value !== wStr) rangeWidth.value = wStr;
  setText(valWidth, `${state.simWidth}px`);
  const hStr = String(state.barHeight);
  if (rangeHeight.value !== hStr) rangeHeight.value = hStr;
  setText(valHeight, `${ev.curBar.effectiveBarHeight}px`);

  setText(btnBrandHome, state.brandHome ? "品牌回首页：开" : "品牌回首页：关");
  if (btnBrandHome.getAttribute("aria-pressed") !== String(state.brandHome)) {
    btnBrandHome.setAttribute("aria-pressed", String(state.brandHome));
  }
  setCls(btnBrandHome, "is-ok", state.brandHome);
  setCls(btnBrandHome, "is-bad", !state.brandHome);

  // 原则按钮高亮态
  principleBtns.forEach((btn) => {
    const p = String(state.highlightPrinciple === btn.dataset.principle);
    if (btn.getAttribute("aria-pressed") !== p) btn.setAttribute("aria-pressed", p);
  });
}

// 绑定开场控台事件
document.querySelectorAll("#ctrl-site [data-site]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextSite = btn.dataset.site;
    if (nextSite === state.siteId) return;
    // 切换语境时保留当前结构配置（合法或错态），让用户对比同一套顶栏在不同站点的表现
    setState({ siteId: nextSite, drawerOpen: false });
  });
});

document.querySelectorAll("#ctrl-variant [data-variant]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ variant: btn.dataset.variant }));
});

document.querySelectorAll("#ctrl-feedback [data-feedback]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ feedback: btn.dataset.feedback }));
});

document.querySelectorAll("#ctrl-consistency [data-consistency]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ consistency: btn.dataset.consistency }));
});

document.querySelectorAll("#ctrl-responsive [data-responsive]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ responsive: btn.dataset.responsive, drawerOpen: false }));
});

rangeWidth.addEventListener("input", () => setState({ simWidth: Number(rangeWidth.value) }));
rangeHeight.addEventListener("input", () => setState({ barHeight: Number(rangeHeight.value) }));

btnBrandHome.addEventListener("click", () => setState({ brandHome: !state.brandHome }));

document.querySelectorAll("[data-sol]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = applySolution(state, btn.dataset.sol);
    syncUI();
    stage.draw();
    stage.showToast(`已切换合法解：${btn.textContent}`, "ok");
  });
});

document.querySelectorAll("[data-fail]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = applyFailCase(state, btn.dataset.fail);
    syncUI();
    stage.draw();
    stage.showToast(`双向试错：${btn.textContent}`, "bad");
  });
});

document.getElementById("btn-fix-classic").addEventListener("click", () => {
  state = applySolution(state, "classic");
  syncUI();
  stage.draw();
  stage.showToast("已一键校准为原海报 5 项经典顶栏（4/4）", "ok");
});

document.getElementById("btn-wayfind").addEventListener("click", () => stage.startWayfinding());

document.getElementById("btn-reset").addEventListener("click", () => {
  state = createInitialState(state.siteId);
  syncUI();
  stage.draw();
  stage.showToast("已复原开场 0/4 复合错态", "bad");
});

document.querySelectorAll("#principle-strip .p-probe").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.dataset.principle;
    setState({ highlightPrinciple: state.highlightPrinciple === p ? null : p });
  });
});

// 画布键盘控制（方向键微调视口宽，Space 触发寻路实测）
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setState({ simWidth: Math.max(390, state.simWidth - 40) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setState({ simWidth: Math.min(1180, state.simWidth + 40) });
  } else if (e.key === " ") {
    e.preventDefault();
    stage.startWayfinding();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement === document.body) {
    const rect = canvas.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      e.preventDefault();
      stage.startWayfinding();
    }
  }
});

// 移动端自示范顶栏抽屉开关
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileDrawer = document.getElementById("mobile-nav-drawer");
const BURGER_SVG = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
mobileMenuBtn.addEventListener("click", () => {
  const willOpen = mobileDrawer.hidden;
  mobileDrawer.hidden = !willOpen;
  mobileMenuBtn.setAttribute("aria-expanded", String(willOpen));
  mobileMenuBtn.innerHTML = willOpen ? `<span>关闭 ×</span>` : `<span>目录</span>${BURGER_SVG}`;
});
mobileDrawer.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    mobileDrawer.hidden = true;
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    mobileMenuBtn.innerHTML = `<span>目录</span>${BURGER_SVG}`;
  });
});

// 顶端自示范真实顶栏的当前章节同步
const navLinks = [...document.querySelectorAll("#page-nav-list .top-nav-link")];
const secMap = [
  { id: "hero", href: "#hero" },
  { id: "s01", href: "#s01" },
  { id: "s02", href: "#s02" },
  { id: "s03", href: "#s03" },
  { id: "s04", href: "#s04" },
  { id: "s05", href: "#s04" },
  { id: "s06", href: "#s06" },
  { id: "s07", href: "#s06" },
];
const io = new IntersectionObserver(
  (entries) => {
    for (const ent of entries) {
      if (!ent.isIntersecting) continue;
      const m = secMap.find((x) => x.id === ent.target.id);
      if (!m) continue;
      navLinks.forEach((a) => {
        const active = a.getAttribute("href") === m.href;
        a.classList.toggle("is-active", active);
        if (active) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    }
  },
  { rootMargin: "-25% 0px -60% 0px", threshold: 0 }
);
secMap.forEach(({ id }) => {
  const el = document.getElementById(id);
  if (el) io.observe(el);
});

// 初始化全部章节与状态
syncUI();
stage.draw();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
