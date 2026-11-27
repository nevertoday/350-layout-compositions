import { loop, reducedMotion } from "../../lib/stage.js";
import {
  CONTEXTS,
  MODES,
  BAD_START,
  VALID_SOLUTIONS,
  FAIL_PRESETS,
  createInitialState,
  findActivePage,
  evaluate,
} from "./model.js";

// ==================== 全局状态 ====================
const state = createInitialState();

// 画布动画 & 交互命中区状态
const anim = {
  intro: reducedMotion.matches ? 1 : 0,
  visualOpen: state.openProgress,
  visualW: state.drawerWidth,
  dragging: false,
  dragMode: "width", // "width" | "slide"
  dragStartX: 0,
  dragStartY: 0,
  dragStartVal: 0,
  dragLocked: null, // "x" | "y" | null
  dragMoved: false,
  simActive: false,
  simT: 0,
  dirty: true,
  hits: [], // 每帧生成的真实几何热区，供鼠标/触摸直点
};

// ==================== DOM 引用 ====================
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const appShell = $("#app-shell");
const pageDrawer = $("#page-drawer");
const pageScrim = $("#page-scrim");
const desktopDrawerToggle = $("#desktop-drawer-toggle");
const railArrow = $("#rail-arrow");
const mobileDrawerOpen = $("#mobile-drawer-open");
const mobileDrawerClose = $("#mobile-drawer-close");
const drawerGroupBtn = $("#drawer-group-btn");
const drawerSubCore = $("#drawer-sub-core");

const canvas = $("#hero-canvas");
const ctx2d = canvas.getContext("2d");

const motifCoreDot = $("#motif-core-dot");
const heroStatusPill = $("#hero-status-pill");
const mobileStatusPill = $("#mobile-status-pill");
const drawerScoreBadge = $("#drawer-score-badge");
const barDrawerMeta = $("#bar-drawer-meta");
const barMainMeta = $("#bar-main-meta");
const btnSimPath = $("#btn-sim-path");
const btnToggleSimDrawer = $("#btn-toggle-sim-drawer");

const bulbDiag = $("#bulb-diag");
const diagScoreChip = $("#diag-score-chip");
const diagTier = $("#diag-tier");
const diagHeadline = $("#diag-headline");
const diagWhy = $("#diag-why");
const diagFix = $("#diag-fix");

const rngDrawerW = $("#rng-drawer-w");
const rngViewport = $("#rng-viewport");
const rngItems = $("#rng-items");
const rngDepth = $("#rng-depth");
const valDrawerW = $("#val-drawer-w");
const valViewport = $("#val-viewport");
const valItems = $("#val-items");
const valDepth = $("#val-depth");
const togScrim = $("#tog-scrim");
const togGrouped = $("#tog-grouped");
const togActive = $("#tog-active");

// ==================== 页面自示范真实导航抽屉（桌面可收折，移动真覆层滑出） ====================
const isMobileShell = () => window.innerWidth <= 1140;
let mobileOpen = false;
let lastFocusBeforeDrawer = null;

function syncPageDrawerA11y() {
  if (isMobileShell()) {
    pageDrawer.setAttribute("role", "dialog");
    pageDrawer.setAttribute("aria-modal", mobileOpen ? "true" : "false");
    if (mobileOpen) {
      pageDrawer.classList.add("is-open");
      pageDrawer.removeAttribute("inert");
      pageDrawer.removeAttribute("aria-hidden");
      pageScrim.hidden = false;
      pageScrim.setAttribute("aria-hidden", "false");
    } else {
      pageDrawer.classList.remove("is-open");
      pageDrawer.setAttribute("inert", "");
      pageDrawer.setAttribute("aria-hidden", "true");
      pageScrim.hidden = true;
      pageScrim.setAttribute("aria-hidden", "true");
    }
    mobileDrawerOpen.setAttribute("aria-expanded", String(mobileOpen));
  } else {
    mobileOpen = false;
    pageDrawer.classList.remove("is-open");
    pageDrawer.removeAttribute("role");
    pageDrawer.removeAttribute("aria-modal");
    pageDrawer.removeAttribute("inert");
    pageDrawer.removeAttribute("aria-hidden");
    pageScrim.hidden = true;
    pageScrim.setAttribute("aria-hidden", "true");
    mobileDrawerOpen.setAttribute("aria-expanded", "false");
  }
}

function openMobilePageDrawer() {
  if (!isMobileShell()) return;
  lastFocusBeforeDrawer = document.activeElement;
  mobileOpen = true;
  syncPageDrawerA11y();
  mobileDrawerClose.focus();
}

function closeMobilePageDrawer(restoreFocus = true) {
  if (!mobileOpen) return;
  mobileOpen = false;
  syncPageDrawerA11y();
  if (restoreFocus && lastFocusBeforeDrawer instanceof HTMLElement) {
    lastFocusBeforeDrawer.focus();
  }
}

mobileDrawerOpen.addEventListener("click", openMobilePageDrawer);
mobileDrawerClose.addEventListener("click", () => closeMobilePageDrawer(true));
pageScrim.addEventListener("click", () => closeMobilePageDrawer(true));

desktopDrawerToggle.addEventListener("click", () => {
  const collapsed = appShell.classList.toggle("is-collapsed");
  desktopDrawerToggle.setAttribute("aria-expanded", String(!collapsed));
  railArrow.textContent = collapsed ? "›" : "‹";
  anim.dirty = true;
});

drawerGroupBtn.addEventListener("click", () => {
  const expanded = drawerGroupBtn.getAttribute("aria-expanded") === "true";
  drawerGroupBtn.setAttribute("aria-expanded", String(!expanded));
  drawerSubCore.hidden = expanded;
});

// 抽屉内点击章节链接：移动端收起覆层并跳转
$$("[data-nav-sec]").forEach((a) => {
  a.addEventListener("click", () => {
    if (isMobileShell() && mobileOpen) closeMobilePageDrawer(false);
  });
});

// 滚动时同步左侧自示范抽屉的当前章高亮带
const navLinks = $$("[data-nav-sec]");
const observedIds = ["top", "sec-01", "sec-02", "sec-03", "sec-04", "sec-05", "sec-06", "sec-07"];
const secObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (!visible.length) return;
    const id = visible[0].target.id;
    navLinks.forEach((el) => el.classList.toggle("is-active", el.dataset.navSec === id));
  },
  { rootMargin: "-15% 0px -65% 0px", threshold: 0.01 }
);
observedIds.forEach((id) => {
  const el = document.getElementById(id);
  if (el) secObserver.observe(el);
});

window.addEventListener("resize", () => {
  syncPageDrawerA11y();
  anim.dirty = true;
});
syncPageDrawerA11y();

// ==================== 单真源同步到全部 UI 控件与读数 ====================
function syncUI() {
  const ev = evaluate(state);
  const isOk = ev.score === 4;
  const tagText = isOk ? `4/4 · ${ev.solutionName}` : `${ev.score}/4 · ${ev.issues[0]?.shortTag || "待修"}`;

  // 顶部、移动端顶栏、左侧抽屉同步状态
  heroStatusPill.textContent = tagText;
  heroStatusPill.classList.toggle("is-ok", isOk);

  mobileStatusPill.textContent = isOk ? "4/4 成立" : `${ev.score}/4 ${ev.issues[0]?.shortTag || ""}`;
  mobileStatusPill.dataset.score = String(ev.score);

  drawerScoreBadge.textContent = isOk ? "4/4 成立" : `${ev.score}/4 失守`;
  drawerScoreBadge.classList.toggle("is-ok", isOk);

  // 玫瑰粉顶条实测读数
  const openLabel = state.mode === "permanent" ? "常驻" : ev.open < 0.08 ? "已收起" : MODES[state.mode].short;
  barDrawerMeta.textContent = `${ev.shownW}px · ${openLabel}`;
  barMainMeta.textContent =
    state.mode === "modal" && ev.open > 0.1
      ? `退场缝 ${ev.peekW}px / ${ev.vw}px`
      : `主区 ${ev.liveMainW}px / ${ev.vw}px`;

  // 活体粉弧深红圆核微联动
  if (motifCoreDot) {
    const cx = 76 + ev.open * 16;
    motifCoreDot.setAttribute("cx", cx.toFixed(1));
  }

  // 收起/展开抽屉按钮
  if (state.mode === "permanent") {
    btnToggleSimDrawer.textContent = "常驻锁定";
    btnToggleSimDrawer.disabled = true;
  } else {
    btnToggleSimDrawer.disabled = false;
    btnToggleSimDrawer.textContent = state.openProgress > 0.4 ? "收起抽屉" : "拉开抽屉";
  }

  // 灯泡单真源诊单
  bulbDiag.dataset.state = isOk ? "ok" : "bad";
  diagScoreChip.textContent = isOk ? `4/4 · ${ev.solutionName}` : `${ev.score}/4 失守`;
  diagTier.textContent = `寻路负担：${ev.loadTier}（示意）· 约 ${ev.taps} 步`;
  diagHeadline.textContent = ev.headline;
  diagWhy.textContent = ev.why;
  diagFix.textContent = ev.fix;

  // 四列布局优势实时探针
  for (const key of ["expand", "access", "layering", "flexibility"]) {
    const d = ev.dims[key];
    const card = document.querySelector(`.adv-card[data-dim="${key}"]`);
    const badge = document.getElementById(`dim-${key}-badge`);
    if (card) card.classList.toggle("is-ok", d.ok);
    if (badge) badge.textContent = d.badge;
  }

  // 精控滑轨与按钮回显
  rngDrawerW.value = String(state.drawerWidth);
  valDrawerW.textContent = `${ev.effDrawerW}px`;
  rngViewport.value = String(state.viewport);
  valViewport.textContent = `${ev.vw}px · ${ev.dev.short}`;
  rngItems.value = String(state.itemCount);
  valItems.textContent = `${ev.itemCount} 项`;
  rngDepth.value = String(state.depth);
  valDepth.textContent = `${ev.depth} 层`;

  $$("[data-vp]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.vp) === ev.vw));
  $$("[data-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === state.mode));
  $$("[data-ctx]").forEach((b) => {
    const active = b.dataset.ctx === state.context;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  togScrim.setAttribute("aria-pressed", String(state.scrim));
  togScrim.textContent = `暗层遮罩：${state.scrim ? "开" : "关"}`;
  togGrouped.setAttribute("aria-pressed", String(state.grouped));
  togGrouped.textContent = `逻辑分组：${state.grouped ? "开" : "关"}`;
  togActive.setAttribute("aria-pressed", String(state.showActive));
  togActive.textContent = `当前高亮：${state.showActive ? "开" : "关"}`;

  anim.dirty = true;
}

// ==================== 2D Canvas 实境抽屉试拉台绘制引擎 ====================
function roundRectPath(c, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function drawNavIcon(c, type, x, y, s, color) {
  c.save();
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = Math.max(1.2, s * 0.12);
  c.lineCap = "round";
  c.lineJoin = "round";
  const r = s * 0.44;
  c.beginPath();
  if (type === "home") {
    c.moveTo(x - r, y - r * 0.05);
    c.lineTo(x, y - r);
    c.lineTo(x + r, y - r * 0.05);
    c.lineTo(x + r * 0.72, y - r * 0.05);
    c.lineTo(x + r * 0.72, y + r * 0.9);
    c.lineTo(x - r * 0.72, y + r * 0.9);
    c.lineTo(x - r * 0.72, y - r * 0.05);
    c.closePath();
    c.stroke();
  } else if (type === "grid") {
    const g = r * 0.76;
    const b = r * 0.62;
    c.strokeRect(x - g, y - g, b, b);
    c.strokeRect(x + g - b, y - g, b, b);
    c.strokeRect(x - g, y + g - b, b, b);
    c.strokeRect(x + g - b, y + g - b, b, b);
  } else if (type === "bookmark") {
    c.moveTo(x - r * 0.68, y - r * 0.85);
    c.lineTo(x + r * 0.68, y - r * 0.85);
    c.lineTo(x + r * 0.68, y + r * 0.9);
    c.lineTo(x, y + r * 0.35);
    c.lineTo(x - r * 0.68, y + r * 0.9);
    c.closePath();
    c.stroke();
  } else if (type === "user") {
    c.arc(x, y - r * 0.35, r * 0.42, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(x, y + r * 1.05, r * 0.78, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
  } else {
    c.arc(x, y, r * 0.82, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

function drawBadgePill(c, x, y, text, bg, fg, border) {
  c.save();
  c.font = `700 11px "Noto Sans SC", sans-serif`;
  const tw = c.measureText(text).width;
  const pw = tw + 16;
  const ph = 22;
  roundRectPath(c, x, y, pw, ph, 5);
  c.fillStyle = bg;
  c.fill();
  if (border) {
    c.strokeStyle = border;
    c.lineWidth = 1.2;
    c.stroke();
  }
  c.fillStyle = fg;
  c.textBaseline = "middle";
  c.textAlign = "left";
  c.fillText(text, x + 8, y + ph / 2 + 0.5);
  c.restore();
  return { x, y, w: pw, h: ph };
}

function renderHeroCanvas(W, H, ev) {
  const c = ctx2d;
  anim.hits = [];

  // 背景：暖杏展台纸底 + 极淡建筑方格
  c.fillStyle = "#F7E9DB";
  c.fillRect(0, 0, W, H);

  c.strokeStyle = "rgba(91, 20, 38, 0.055)";
  c.lineWidth = 1;
  const gridStep = 24;
  c.beginPath();
  for (let gx = gridStep; gx < W; gx += gridStep) {
    c.moveTo(gx + 0.5, 0);
    c.lineTo(gx + 0.5, H);
  }
  for (let gy = gridStep; gy < H; gy += gridStep) {
    c.moveTo(0, gy + 0.5);
    c.lineTo(W, gy + 0.5);
  }
  c.stroke();

  // 计算微缩设备视口框在画布中的等比尺寸（绝不拉扁，根据 viewport 动态呈现手机/平板/桌面形态）
  const padX = W < 440 ? 12 : 24;
  const padTop = W < 440 ? 28 : 32;
  const padBot = 28;
  const availW = W - padX * 2;
  const availH = H - padTop - padBot;

  // 设备框宽随 viewport(320..1280) 真实缩放，但手机下依然足够饱满便于直点
  const ratioNorm = (ev.vw - 320) / (1280 - 320); // 0..1
  const minFrac = W < 460 ? 0.88 : 0.44;
  const maxFrac = 0.96;
  const devW = Math.round(availW * (minFrac + (maxFrac - minFrac) * Math.pow(ratioNorm, 0.72)));
  const devH = Math.round(availH);
  const devX = Math.round((W - devW) / 2);
  const devY = padTop;
  const scale = devW / ev.vw;

  // 顶部物理标尺（显示当前模拟设备宽）
  c.save();
  c.strokeStyle = "rgba(91, 20, 38, 0.45)";
  c.lineWidth = 1;
  const rulerY = devY - 12;
  c.beginPath();
  c.moveTo(devX, rulerY);
  c.lineTo(devX + devW, rulerY);
  c.moveTo(devX, rulerY - 4);
  c.lineTo(devX, rulerY + 4);
  c.moveTo(devX + devW, rulerY - 4);
  c.lineTo(devX + devW, rulerY + 4);
  c.stroke();

  const rulerLabel = `${ev.dev.label} ${ev.vw}px`;
  c.font = `600 11px "JetBrains Mono", "Noto Sans SC", sans-serif`;
  const rtw = c.measureText(rulerLabel).width + 14;
  c.fillStyle = "#F7E9DB";
  c.fillRect(W / 2 - rtw / 2, rulerY - 8, rtw, 16);
  c.fillStyle = "#500E21";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(rulerLabel, W / 2, rulerY);
  c.restore();

  // 轻量双层偏移纸面阴影（不用 shadowBlur，保证慢手机 SwiftShader 60fps）
  roundRectPath(c, devX + 4, devY + 5, devW, devH, 10);
  c.fillStyle = "rgba(56, 8, 22, 0.12)";
  c.fill();

  // 裁切至模拟设备视口内
  c.save();
  roundRectPath(c, devX, devY, devW, devH, 10);
  c.clip();

  // 主内容区底色（暖杏奶油）
  c.fillStyle = "#FFF4E5";
  c.fillRect(devX, devY, devW, devH);

  // 计算实时绘制中的抽屉像素宽（带入场缓动与拖拽平滑）
  const introOpen = state.mode === "permanent" ? 1 : anim.visualOpen * anim.intro;
  const effWpx = Math.min(anim.visualW, ev.vw * 0.94);
  const railWpx = 68;
  const shownLogicW =
    state.mode === "rail"
      ? railWpx + (effWpx - railWpx) * introOpen
      : effWpx * introOpen;
  const drawerPx = Math.round(shownLogicW * scale);

  // 主内容区位置（push / permanent 挤占主区；modal 浮在主区上；rail 平时留 68px）
  const isInline = state.mode === "permanent" || state.mode === "push";
  const mainLeftPx = isInline
    ? devX + drawerPx
    : state.mode === "rail"
    ? devX + Math.round(railWpx * scale)
    : devX;
  const mainWidthPx = Math.max(0, devX + devW - mainLeftPx);

  // ---------- 绘制右侧主内容区（真实联动当前所选页面） ----------
  const activeInfo = findActivePage(state);
  const page = activeInfo.item;
  const ctxData = CONTEXTS[state.context] || CONTEXTS.poster;
  const topBarH = 34;

  // 主区顶栏
  c.fillStyle = "#FFF9F1";
  c.fillRect(mainLeftPx, devY, mainWidthPx, topBarH);
  c.fillStyle = "rgba(91, 20, 38, 0.12)";
  c.fillRect(mainLeftPx, devY + topBarH - 1, mainWidthPx, 1);

  if (mainWidthPx > 28) {
    // 汉堡图标按钮（可点击切换抽屉开关）
    const hbx = mainLeftPx + 10;
    const hby = devY + 7;
    if (state.mode !== "permanent") {
      c.strokeStyle = "#500E21";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(hbx + 3, hby + 6);
      c.lineTo(hbx + 17, hby + 6);
      c.moveTo(hbx + 3, hby + 11);
      c.lineTo(hbx + 17, hby + 11);
      c.moveTo(hbx + 3, hby + 16);
      c.lineTo(hbx + 17, hby + 16);
      c.stroke();
      anim.hits.push({
        type: "hamburger",
        x: mainLeftPx + 4,
        y: devY + 2,
        w: 32,
        h: topBarH - 4,
      });
    }

    // 面包屑标题
    if (mainWidthPx > 95) {
      c.fillStyle = "#500E21";
      c.font = `700 12px "Noto Sans SC", sans-serif`;
      c.textAlign = "left";
      c.textBaseline = "middle";
      const crumb = activeInfo.parent ? `${activeInfo.parent.label} / ${page.label}` : page.label;
      c.fillText(crumb, mainLeftPx + (state.mode === "permanent" ? 12 : 36), devY + topBarH / 2);
    }

    // 原海报右上角玫瑰粉圆点徽章
    if (mainWidthPx > 60) {
      c.beginPath();
      c.arc(devX + devW - 16, devY + topBarH / 2, 6, 0, Math.PI * 2);
      c.fillStyle = "#F38292";
      c.fill();
    }
  }

  // 主区内容骨架（当被推挤压缩到窄条时，真实呈现文字与卡片被挤碎的惨状！）
  const padM = Math.min(16, Math.max(4, mainWidthPx * 0.05));
  const innerM = Math.max(0, mainWidthPx - padM * 2);
  const contentTop = devY + topBarH + 12;

  if (mainWidthPx >= 12) {
    // 顶部大主图色块（原海报同款柔桃主卡）
    const heroCardH = Math.min(96, Math.max(54, devH * 0.3));
    roundRectPath(c, mainLeftPx + padM, contentTop, innerM, heroCardH, 6);
    c.fillStyle = "#F7D3C5";
    c.fill();

    if (innerM > 110) {
      c.fillStyle = "#500E21";
      c.font = `800 ${innerM > 220 ? 15 : 12.5}px "Noto Sans SC", sans-serif`;
      c.textAlign = "left";
      c.textBaseline = "top";
      c.fillText(page.pageTitle, mainLeftPx + padM + 12, contentTop + 12, innerM - 24);

      c.fillStyle = "#6F3646";
      c.font = `400 11.5px "Noto Sans SC", sans-serif`;
      const subText = page.pageSub;
      // 简单双行折排
      const maxChars = Math.max(8, Math.floor((innerM - 24) / 11.5));
      const l1 = subText.slice(0, maxChars);
      const l2 = subText.length > maxChars ? subText.slice(maxChars, maxChars * 2 - 1) + (subText.length > maxChars * 2 ? "…" : "") : "";
      c.fillText(l1, mainLeftPx + padM + 12, contentTop + 34, innerM - 24);
      if (l2) c.fillText(l2, mainLeftPx + padM + 12, contentTop + 51, innerM - 24);
    } else if (innerM > 6) {
      // 主区被压碎：用密集短红杠真实体现文字被迫折成一字一行
      c.fillStyle = "rgba(169, 27, 38, 0.55)";
      for (let sy = contentTop + 8; sy < contentTop + heroCardH - 8; sy += 9) {
        c.fillRect(mainLeftPx + padM + 3, sy, Math.max(4, innerM - 6), 4);
      }
    }

    // 下方三列小卡片（原海报同款）
    const cardsY = contentTop + heroCardH + 12;
    const cardsH = Math.max(42, devY + devH - cardsY - 14);
    const cols = innerM > 190 ? 3 : innerM > 105 ? 2 : 1;
    const gapC = 8;
    const cw = Math.max(4, (innerM - gapC * (cols - 1)) / cols);
    for (let i = 0; i < cols; i++) {
      const cx = mainLeftPx + padM + i * (cw + gapC);
      roundRectPath(c, cx, cardsY, cw, Math.min(cardsH, 108), 5);
      c.fillStyle = "#FBE8DB";
      c.fill();
      c.strokeStyle = "rgba(91, 20, 38, 0.08)";
      c.lineWidth = 1;
      c.stroke();

      if (cw > 52) {
        c.fillStyle = "#500E21";
        c.font = `700 11.5px "Noto Sans SC", sans-serif`;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(page.cards[i] || "模块", cx + 8, cardsY + 10, cw - 14);

        c.fillStyle = "#E1BFB0";
        c.fillRect(cx + 8, cardsY + 32, cw - 16, 5);
        c.fillRect(cx + 8, cardsY + 43, (cw - 16) * 0.72, 5);
        c.fillRect(cx + 8, cardsY + 54, (cw - 16) * 0.52, 5);
      }
    }
  }

  // 主区已完全收起时的呼出提示胶囊
  if (state.mode !== "permanent" && introOpen < 0.08) {
    const tip = drawBadgePill(
      c,
      mainLeftPx + padM,
      devY + devH - 36,
      "主区已释放 100% · 点左上 ≡ 或向右拖重开抽屉",
      "#5B1426",
      "#FFF4E5"
    );
    anim.hits.push({ type: "hamburger", ...tip });
  }

  // ---------- 暗层遮罩（Scrim）与可点击退场区 ----------
  const isOverlayOpen = (state.mode === "modal" || (state.mode === "rail" && introOpen > 0.05)) && introOpen > 0.05;
  if (isOverlayOpen || (state.mode === "push" && introOpen > 0.05)) {
    const scrimX = devX + drawerPx;
    const scrimW = Math.max(0, devW - drawerPx);
    if (state.scrim && scrimW > 0) {
      c.fillStyle = `rgba(38, 6, 15, ${(0.48 * introOpen).toFixed(2)})`;
      c.fillRect(scrimX, devY, scrimW, devH);
    }
    if (scrimW > 6 && state.mode !== "permanent") {
      anim.hits.push({ type: "scrim", x: scrimX, y: devY, w: scrimW, h: devH });
    }
  }

  // ---------- 原海报标志性「····→」侧滑推进虚线箭头（仅在右侧有足够空间时出现，绝不压在窄碎条上） ----------
  if (drawerPx > 14 && devW - drawerPx > 78 && (state.mode === "modal" ? ev.peekW >= 56 : ev.openMainW >= 72)) {
    const ay = devY + devH * 0.52;
    const ax = devX + drawerPx + 14;
    c.save();
    c.fillStyle = "#EB5A73";
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.arc(ax + i * 7, ay, 2, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = "#EB5A73";
    c.lineWidth = 2;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(ax + 29, ay - 6);
    c.lineTo(ax + 36, ay);
    c.lineTo(ax + 29, ay + 6);
    c.stroke();
    c.restore();
  }

  // ---------- 绘制左侧深勃艮第抽屉本体 ----------
  let listOverflowed = false;
  if (drawerPx > 2) {
    // 抽屉外投轻影（双层半透明条，零 shadowBlur）
    c.fillStyle = "rgba(38, 6, 15, 0.16)";
    c.fillRect(devX + drawerPx, devY, 5, devH);

    // 抽屉主体深酒红底
    c.fillStyle = "#5B1426";
    c.fillRect(devX, devY, drawerPx, devH);

    const railEdgeW = Math.min(7, Math.max(4, drawerPx * 0.04));
    const innerDW = Math.max(0, drawerPx - railEdgeW);
    const isMiniOnly = state.mode === "rail" && introOpen < 0.22;

    c.save();
    c.beginPath();
    c.rect(devX, devY, innerDW, devH);
    c.clip();

    // 抽屉品牌头（原海报同款玫瑰粉圆徽 + 标题）
    const headH = 44;
    if (innerDW > 26) {
      c.beginPath();
      c.arc(devX + (isMiniOnly ? innerDW / 2 : 20), devY + 22, isMiniOnly ? 10 : 11, 0, Math.PI * 2);
      c.fillStyle = "#F38292";
      c.fill();
      if (!isMiniOnly && innerDW > 66) {
        c.fillStyle = "#FFF4E5";
        c.font = `700 12px "Noto Sans SC", sans-serif`;
        c.textAlign = "left";
        c.textBaseline = "middle";
        c.fillText(ctxData.brand, devX + 38, devY + 17, innerDW - 44);
        c.fillStyle = "#F7C5CE";
        c.font = `600 8.5px "Sora", sans-serif`;
        c.fillText(ctxData.brandEn, devX + 38, devY + 30, innerDW - 44);
      }
    }

    // 计算扁平化后的可渲染条目列表（含二级展开项 & 超过 2 层时的真实缩进撞墙演示）
    const renderRows = [];
    const items = ev.items;
    items.forEach((it, idx) => {
      if (state.grouped && idx === items.length - 1 && items.length >= 5) {
        renderRows.push({ kind: "sep" });
      } else if (state.grouped && idx === 6 && items.length > 7) {
        renderRows.push({ kind: "sep" });
      }
      renderRows.push({ kind: "item", item: it, level: 0 });

      // 若是「分类」项且层级 ≥ 2 且处于展开态，挂载二级（及超深 3/4 级）子项
      if (it.hasChildren && ev.depth >= 2 && state.expandedGroup && !isMiniOnly) {
        (it.children || []).forEach((ch, ci) => {
          renderRows.push({ kind: "sub", item: ch, parent: it, level: 1 });
          if (ci === 0 && ev.depth >= 3) {
            renderRows.push({
              kind: "deep",
              label: ctxData.deepTrail[2] || "三级子目录",
              level: 2,
            });
          }
          if (ci === 0 && ev.depth >= 4) {
            renderRows.push({
              kind: "deep",
              label: ctxData.deepTrail[3] || "四级明细节点",
              level: 3,
            });
          }
        });
      }
    });

    const listTop = devY + headH + 4;
    const listAvailH = devH - headH - 10;
    const naturalRowH = 26;
    const rowH = Math.max(17, Math.min(naturalRowH, Math.floor(listAvailH / Math.max(1, renderRows.length))));
    let cy = listTop;

    for (const row of renderRows) {
      if (cy + rowH > devY + devH - 4) {
        listOverflowed = true;
        // 顶部条目溢出底部提示
        c.fillStyle = "rgba(255, 138, 144, 0.92)";
        c.fillRect(devX, devY + devH - 18, innerDW, 18);
        c.fillStyle = "#380816";
        c.font = `700 10px "Noto Sans SC", sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("↓ 过多条目溢出首屏", devX + innerDW / 2, devY + devH - 9);
        break;
      }
      if (row.kind === "sep") {
        c.fillStyle = "rgba(243, 130, 146, 0.45)";
        c.fillRect(devX + 12, cy + 4, Math.max(8, innerDW - 24), 1);
        cy += 9;
        continue;
      }

      const isItemActive = state.showActive && row.item && row.item.id === state.activeId;
      if (isItemActive) {
        // 原海报招牌玫瑰粉通栏高亮带
        c.fillStyle = "#F38292";
        c.fillRect(devX, cy, innerDW, rowH);
      }

      const fg = isItemActive ? "#380816" : row.kind === "deep" ? "#FF9BA1" : "#FFF4E5";
      const subFg = isItemActive ? "#5C1125" : "#F3BCC6";

      if (isMiniOnly) {
        if (row.kind === "item") {
          drawNavIcon(c, row.item.icon, devX + innerDW / 2, cy + rowH / 2, 13, fg);
          anim.hits.push({
            type: "item",
            id: row.item.id,
            x: devX,
            y: cy,
            w: innerDW,
            h: rowH,
          });
        }
      } else {
        const indent = row.level * 18;
        const ix = devX + 16 + indent;
        if (row.kind === "item") {
          drawNavIcon(c, row.item.icon, ix, cy + rowH / 2, 12, fg);
          c.fillStyle = fg;
          c.font = `${isItemActive ? 800 : 500} ${rowH < 21 ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
          c.textAlign = "left";
          c.textBaseline = "middle";
          const txtMax = Math.max(12, innerDW - (ix - devX) - 24);
          const label = row.item.label;
          c.fillText(label, ix + 14, cy + rowH / 2 + 0.5, txtMax);

          // 若过窄（< 192px），绘制红色截断示意竖杠
          if (ev.effDrawerW < 192 && c.measureText(label).width > txtMax) {
            c.fillStyle = "#FF8A90";
            c.fillRect(devX + innerDW - 5, cy + 3, 3, rowH - 6);
          }

          if (row.item.hasChildren && ev.depth >= 2) {
            // 原海报同款矢量折角折叠箭头（零缺字）
            c.save();
            c.strokeStyle = subFg;
            c.lineWidth = 1.6;
            c.lineCap = "round";
            c.lineJoin = "round";
            const cxA = devX + innerDW - 14;
            const cyA = cy + rowH / 2;
            c.beginPath();
            if (state.expandedGroup) {
              c.moveTo(cxA - 3.5, cyA - 1.5);
              c.lineTo(cxA, cyA + 2);
              c.lineTo(cxA + 3.5, cyA - 1.5);
            } else {
              c.moveTo(cxA - 1.5, cyA - 3.5);
              c.lineTo(cxA + 2, cyA);
              c.lineTo(cxA - 1.5, cyA + 3.5);
            }
            c.stroke();
            c.restore();
            anim.hits.push({
              type: "toggleGroup",
              id: row.item.id,
              x: devX + innerDW - 34,
              y: cy,
              w: 34,
              h: rowH,
            });
          }
          anim.hits.push({
            type: "item",
            id: row.item.id,
            x: devX,
            y: cy,
            w: row.item.hasChildren && ev.depth >= 2 ? Math.max(10, innerDW - 34) : innerDW,
            h: rowH,
          });
        } else if (row.kind === "sub") {
          c.fillStyle = subFg;
          c.fillRect(ix - 2, cy + rowH / 2 - 1, 5, 2);
          c.fillStyle = fg;
          c.font = `${isItemActive ? 800 : 400} 10.5px "Noto Sans SC", sans-serif`;
          c.textAlign = "left";
          c.textBaseline = "middle";
          c.fillText(row.item.label, ix + 8, cy + rowH / 2, Math.max(10, innerDW - (ix - devX) - 14));
          anim.hits.push({
            type: "item",
            id: row.item.id,
            x: devX,
            y: cy,
            w: innerDW,
            h: rowH,
          });
        } else if (row.kind === "deep") {
          // 超过 2 层深嵌套：红色虚线 + 矢量折角警示缩进撞墙（零缺字）
          c.strokeStyle = "#FF8A90";
          c.lineWidth = 1.2;
          c.setLineDash([2, 2]);
          c.beginPath();
          c.moveTo(ix - 5, cy + 2);
          c.lineTo(ix - 5, cy + rowH / 2);
          c.lineTo(ix + 1, cy + rowH / 2);
          c.stroke();
          c.setLineDash([]);
          c.fillStyle = "#FF9BA1";
          c.font = `600 10px "Noto Sans SC", sans-serif`;
          c.textAlign = "left";
          c.textBaseline = "middle";
          c.fillText(`L${row.level + 1} ${row.label}`, ix + 5, cy + rowH / 2, Math.max(10, innerDW - (ix - devX) - 10));
        }
      }
      cy += rowH;
    }
    c.restore();

    // 玫瑰珊瑚粉右缘拉手封边条（物理拖拽手柄！）
    const handleX = devX + drawerPx - railEdgeW;
    c.fillStyle = anim.dragging ? "#FF9EAE" : "#F38292";
    c.fillRect(handleX, devY, railEdgeW, devH);

    // 居中抓握竖条与小圆柄提示
    const gripY = devY + devH / 2;
    roundRectPath(c, handleX - 5, gripY - 22, railEdgeW + 10, 44, 7);
    c.fillStyle = "#F38292";
    c.fill();
    c.strokeStyle = "#500E21";
    c.lineWidth = 1.4;
    c.stroke();
    c.fillStyle = "#500E21";
    c.fillRect(handleX + railEdgeW / 2 - 1, gripY - 9, 2, 18);

    anim.hits.push({
      type: "handle",
      x: handleX - 14,
      y: devY,
      w: railEdgeW + 28,
      h: devH,
    });
  }

  // 设备外框收边
  roundRectPath(c, devX, devY, devW, devH, 10);
  c.strokeStyle = "#500E21";
  c.lineWidth = 2;
  c.stroke();
  c.restore(); // 结束设备内裁切

  // ---------- 画布内标红病灶直点修复标签（让用户在画布里一眼看出哪里坏了并就地修！） ----------
  if (ev.score < 4 && !anim.simActive) {
    const topIssue = ev.issues[0];
    let fixLabel = "";
    let fixAction = "";
    if (topIssue.code === "mode-squeeze") {
      fixLabel = "× 窄屏推挤压扁 · 点切覆层";
      fixAction = "fix-modal";
    } else if (topIssue.code === "drawer-too-wide") {
      fixLabel = `× 退场缝仅 ${ev.peekW}px · 点收窄`;
      fixAction = "fix-width";
    } else if (topIssue.code === "no-scrim") {
      fixLabel = "× 缺暗层遮罩 · 点开启";
      fixAction = "fix-scrim";
    } else if (topIssue.code === "too-deep") {
      fixLabel = `× ${ev.depth} 层深嵌套 · 点压平`;
      fixAction = "fix-depth";
    } else if (topIssue.code === "no-grouping") {
      fixLabel = "× 未分组文字墙 · 点分组";
      fixAction = "fix-group";
    } else if (topIssue.code === "no-active") {
      fixLabel = "× 缺当前高亮 · 点开启";
      fixAction = "fix-active";
    } else if (topIssue.code === "overload-items") {
      fixLabel = `× 塞满 ${ev.itemCount} 项 · 点精简`;
      fixAction = "fix-items";
    } else if (topIssue.code === "desktop-hidden-few" || topIssue.code === "narrow-permanent") {
      fixLabel = "× 模式错配 · 点切适配";
      fixAction = "fix-mode-auto";
    } else {
      fixLabel = `× ${topIssue.shortTag} · 点修复`;
      fixAction = "fix-best";
    }
    const pillW = Math.min(devW - 16, c.measureText(fixLabel).width + 42);
    const bx = Math.max(devX + 8, Math.min(devX + devW - pillW - 8, devX + drawerPx - pillW * 0.45));
    const by = listOverflowed ? devY + devH - 46 : devY + devH - 32;
    const hit = drawBadgePill(c, bx, by, fixLabel, "#A91B26", "#FFF9F1", "#FFF4E5");
    anim.hits.push({ type: "quickfix", action: fixAction, ...hit });
  } else if (ev.score === 4 && !anim.simActive) {
    drawBadgePill(
      c,
      devX + devW - 156,
      devY + devH - 30,
      `✓ 4/4 · ${ev.solutionName}`,
      "#166248",
      "#FFF9F1"
    );
  }

  // ---------- 底部实测宽度刻度条 ----------
  const footY = devY + devH + 15;
  c.fillStyle = "#500E21";
  c.font = `600 11px "JetBrains Mono", "Noto Sans SC", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText(`抽屉 ${ev.effDrawerW}px (${ev.widthPct}%)`, devX, footY);
  c.textAlign = "right";
  const rightStr =
    state.mode === "modal"
      ? `安全退场缝 ${ev.peekW}px${ev.peekW >= 56 ? " ✓" : " (<56px!)"}`
      : `主内容净宽 ${ev.openMainW}px (${ev.mainSharePct}%)`;
  c.fillStyle = ev.dims.expand.ok ? "#166248" : "#A91B26";
  c.fillText(rightStr, devX + devW, footY);

  // ---------- Space 跨频道寻路光点演播 ----------
  if (anim.simActive) {
    const p = Math.min(1, anim.simT / 2.6);
    const pts = [
      { x: devX + devW * 0.65, y: devY + devH * 0.48, label: "1. 正文出发" },
      { x: devX + 20, y: devY + 17, label: "2. 呼出抽屉" },
      { x: devX + Math.max(40, drawerPx * 0.48), y: devY + 112, label: "3. 扫视分组" },
      { x: devX + Math.max(46, drawerPx * 0.56), y: devY + 154, label: "4. 选中目标" },
      { x: devX + devW * 0.58, y: devY + devH * 0.56, label: "5. 退场释放主区" },
    ];
    const seg = p * (pts.length - 1);
    const idx = Math.min(pts.length - 2, Math.floor(seg));
    const f = seg - idx;
    const px = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * f;
    const py = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * f;

    c.save();
    c.strokeStyle = ev.score === 4 ? "#166248" : "#A91B26";
    c.lineWidth = 2;
    c.setLineDash([5, 4]);
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= idx; i++) c.lineTo(pts[i].x, pts[i].y);
    c.lineTo(px, py);
    c.stroke();
    c.setLineDash([]);

    // 寻路光珠
    c.beginPath();
    c.arc(px, py, 10, 0, Math.PI * 2);
    c.fillStyle = ev.score === 4 ? "rgba(22, 98, 72, 0.25)" : "rgba(169, 27, 38, 0.25)";
    c.fill();
    c.beginPath();
    c.arc(px, py, 5.5, 0, Math.PI * 2);
    c.fillStyle = ev.score === 4 ? "#166248" : "#A91B26";
    c.fill();
    c.strokeStyle = "#FFF9F1";
    c.lineWidth = 1.6;
    c.stroke();

    const stepTag = pts[Math.min(pts.length - 1, idx + 1)].label;
    drawBadgePill(
      c,
      Math.max(devX + 8, Math.min(devX + devW - 150, px - 55)),
      Math.max(devY + 6, py - 32),
      `${stepTag} · 约 ${ev.taps} 步`,
      "#380816",
      "#FFF4E5",
      "#F38292"
    );
    c.restore();
  }
}

// 启动 lib/stage.js loop（手机端限制 dpr ≤ 1.5，软件渲染稳稳 55–60fps）
const heroLoop = loop(canvas, (_t, dt, { still }) => {
  if (still) {
    anim.intro = 1;
    anim.visualOpen = state.openProgress;
    anim.visualW = state.drawerWidth;
    anim.simActive = false;
  } else {
    if (anim.intro < 1) {
      anim.intro = Math.min(1, anim.intro + dt * 2.1);
      anim.dirty = true;
    }
    const targetOpen = state.mode === "permanent" ? 1 : state.openProgress;
    const diffOpen = targetOpen - anim.visualOpen;
    if (Math.abs(diffOpen) > 0.004) {
      anim.visualOpen += diffOpen * Math.min(1, dt * 14);
      anim.dirty = true;
    } else if (anim.visualOpen !== targetOpen) {
      anim.visualOpen = targetOpen;
      anim.dirty = true;
    }

    const diffW = state.drawerWidth - anim.visualW;
    if (Math.abs(diffW) > 0.35) {
      anim.visualW += diffW * Math.min(1, dt * 16);
      anim.dirty = true;
    } else if (anim.visualW !== state.drawerWidth) {
      anim.visualW = state.drawerWidth;
      anim.dirty = true;
    }

    if (anim.simActive) {
      anim.simT += dt;
      anim.dirty = true;
      if (anim.simT >= 2.75) {
        anim.simActive = false;
        btnSimPath.classList.remove("is-running");
      }
    }
  }

  if (!anim.dirty && !still) return;

  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const maxDpr = window.innerWidth <= 480 ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const bw = Math.round(rect.width * dpr);
  const bh = Math.round(rect.height * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderHeroCanvas(rect.width, rect.height, evaluate(state));
  anim.dirty = false;
});

function triggerSimPath() {
  if (reducedMotion.matches) return;
  if (state.openProgress < 0.5 && state.mode !== "permanent") {
    state.openProgress = 1;
    syncUI();
  }
  anim.simActive = true;
  anim.simT = 0;
  btnSimPath.classList.add("is-running");
  anim.dirty = true;
  heroLoop.draw();
}

function applyBestForCurrentViewport() {
  if (state.viewport < 600) {
    Object.assign(state, VALID_SOLUTIONS.mobileModal.patch, { viewport: state.viewport });
  } else if (state.viewport < 960) {
    Object.assign(state, VALID_SOLUTIONS.tabletRail.patch, { viewport: state.viewport });
  } else {
    Object.assign(state, VALID_SOLUTIONS.desktopStandard.patch, { viewport: state.viewport });
  }
  syncUI();
  heroLoop.draw();
}

// ==================== 画布鼠标 / 触摸 / 键盘直操 ====================
function canvasCoords(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top, w: r.width };
}

function handleCanvasTap(x, y) {
  // 逆序匹配（后画的浮层胶囊优先级更高）
  for (let i = anim.hits.length - 1; i >= 0; i--) {
    const h = anim.hits[i];
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
      if (h.type === "quickfix") {
        if (h.action === "fix-modal") state.mode = "modal";
        else if (h.action === "fix-width") state.drawerWidth = Math.min(276, state.viewport - 80);
        else if (h.action === "fix-scrim") state.scrim = true;
        else if (h.action === "fix-depth") state.depth = 2;
        else if (h.action === "fix-group") state.grouped = true;
        else if (h.action === "fix-active") state.showActive = true;
        else if (h.action === "fix-items") state.itemCount = 7;
        else if (h.action === "fix-mode-auto") state.mode = state.viewport >= 960 ? "permanent" : "rail";
        else applyBestForCurrentViewport();
        syncUI();
        heroLoop.draw();
        return;
      }
      if (h.type === "toggleGroup") {
        state.expandedGroup = !state.expandedGroup;
        syncUI();
        heroLoop.draw();
        return;
      }
      if (h.type === "item") {
        state.activeId = h.id;
        syncUI();
        heroLoop.draw();
        return;
      }
      if (h.type === "hamburger") {
        if (state.mode !== "permanent") {
          state.openProgress = state.openProgress > 0.4 ? 0 : 1;
          syncUI();
          heroLoop.draw();
        }
        return;
      }
      if (h.type === "scrim") {
        if (state.mode !== "permanent" && state.openProgress > 0.2) {
          state.openProgress = 0;
          syncUI();
          heroLoop.draw();
        }
        return;
      }
    }
  }
}

function startDrag(clientX, clientY) {
  const pt = canvasCoords(clientX, clientY);
  anim.dragging = true;
  anim.dragStartX = pt.x;
  anim.dragStartY = pt.y;
  anim.dragStartVal = state.drawerWidth;
  anim.dragLocked = null;
  anim.dragMoved = false;
}

function moveDrag(clientX, clientY, preventFn) {
  if (!anim.dragging) return;
  const pt = canvasCoords(clientX, clientY);
  const dx = pt.x - anim.dragStartX;
  const dy = pt.y - anim.dragStartY;
  if (!anim.dragLocked) {
    if (Math.hypot(dx, dy) < 5) return;
    anim.dragLocked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  }
  if (anim.dragLocked === "y") return;
  if (preventFn) preventFn();
  anim.dragMoved = true;

  if (state.openProgress < 0.2 && state.mode !== "permanent" && dx > 16) {
    state.openProgress = 1;
  }
  const ev = evaluate(state);
  const ratioNorm = (ev.vw - 320) / (1280 - 320);
  const minFrac = pt.w < 460 ? 0.88 : 0.44;
  const devW = pt.w * (minFrac + (0.96 - minFrac) * Math.pow(ratioNorm, 0.72));
  const pxPerLogic = Math.max(0.25, devW / ev.vw);
  const rawNext = Math.round(anim.dragStartVal + dx / pxPerLogic);
  // 靠近常见理想宽 276px 时轻微柔和吸附（不锁死）
  let clamped = Math.max(140, Math.min(360, rawNext));
  if (Math.abs(clamped - 276) <= 3) clamped = 276;
  state.drawerWidth = clamped;
  anim.visualW = clamped;
  syncUI();
  heroLoop.draw();
}

function endDrag(clientX, clientY) {
  if (!anim.dragging) return;
  const moved = anim.dragMoved;
  anim.dragging = false;
  anim.dragLocked = null;
  if (!moved) {
    const pt = canvasCoords(clientX, clientY);
    handleCanvasTap(pt.x, pt.y);
  }
}

// Mouse
canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  startDrag(e.clientX, e.clientY);
});
window.addEventListener("mousemove", (e) => {
  if (anim.dragging) moveDrag(e.clientX, e.clientY);
});
window.addEventListener("mouseup", (e) => {
  if (anim.dragging) endDrag(e.clientX, e.clientY);
});

// Touch（只拦截横向拖动，竖向滑动照常滚页；perf.mjs 的水平 touchMove 100% 触发重绘）
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    if (!e.touches.length || !anim.dragging) return;
    moveDrag(e.touches[0].clientX, e.touches[0].clientY, () => e.preventDefault());
  },
  { passive: false }
);
canvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  endDrag(t ? t.clientX : anim.dragStartX, t ? t.clientY : anim.dragStartY);
});

// 键盘操作：方向键调宽度、Space 寻路、Esc 收起抽屉 / 关灯箱 / 关移动页抽屉、M 收折桌面左侧真抽屉
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.drawerWidth = Math.max(140, state.drawerWidth - 8);
    syncUI();
    heroLoop.draw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.drawerWidth = Math.min(360, state.drawerWidth + 8);
    syncUI();
    heroLoop.draw();
  } else if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    triggerSimPath();
  } else if (e.key === "Escape" && state.mode !== "permanent") {
    e.preventDefault();
    state.openProgress = 0;
    syncUI();
    heroLoop.draw();
  }
});

window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  const inInput = tag === "INPUT" || tag === "TEXTAREA";
  if (e.key === "Escape") {
    if (!lightbox.hidden) {
      closeLightbox();
      return;
    }
    if (mobileOpen) {
      closeMobilePageDrawer(true);
      return;
    }
    if (state.mode !== "permanent" && state.openProgress > 0.2) {
      state.openProgress = 0;
      syncUI();
      heroLoop.draw();
    }
  } else if (!inInput && (e.key === "m" || e.key === "M") && !isMobileShell()) {
    desktopDrawerToggle.click();
  } else if (!inInput && e.code === "Space" && document.activeElement === document.body) {
    e.preventDefault();
    triggerSimPath();
  }
});

// ==================== 精控台事件绑定 ====================
rngDrawerW.addEventListener("input", () => {
  state.drawerWidth = Number(rngDrawerW.value);
  if (state.openProgress < 0.2 && state.mode !== "permanent") state.openProgress = 1;
  syncUI();
  heroLoop.draw();
});
rngViewport.addEventListener("input", () => {
  state.viewport = Number(rngViewport.value);
  syncUI();
  heroLoop.draw();
});
rngItems.addEventListener("input", () => {
  state.itemCount = Number(rngItems.value);
  syncUI();
  heroLoop.draw();
});
rngDepth.addEventListener("input", () => {
  state.depth = Number(rngDepth.value);
  syncUI();
  heroLoop.draw();
});

$$("[data-vp]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.viewport = Number(btn.dataset.vp);
    syncUI();
    heroLoop.draw();
  });
});
$$("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    if (state.mode === "permanent") state.openProgress = 1;
    syncUI();
    heroLoop.draw();
  });
});
$$("[data-ctx]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.context = btn.dataset.ctx;
    state.activeId = "overview";
    syncUI();
    heroLoop.draw();
  });
});

togScrim.addEventListener("click", () => {
  state.scrim = !state.scrim;
  syncUI();
  heroLoop.draw();
});
togGrouped.addEventListener("click", () => {
  state.grouped = !state.grouped;
  syncUI();
  heroLoop.draw();
});
togActive.addEventListener("click", () => {
  state.showActive = !state.showActive;
  syncUI();
  heroLoop.draw();
});

$$("[data-sol]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sol = VALID_SOLUTIONS[btn.dataset.sol];
    if (!sol) return;
    Object.assign(state, sol.patch);
    syncUI();
    heroLoop.draw();
  });
});
$$("[data-fail]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = FAIL_PRESETS[btn.dataset.fail];
    if (!f) return;
    Object.assign(state, f.patch);
    syncUI();
    heroLoop.draw();
  });
});

$("#btn-fix-best").addEventListener("click", applyBestForCurrentViewport);
$("#btn-reset-bad").addEventListener("click", () => {
  Object.assign(state, BAD_START);
  syncUI();
  heroLoop.draw();
});
btnSimPath.addEventListener("click", triggerSimPath);
btnToggleSimDrawer.addEventListener("click", () => {
  if (state.mode === "permanent") return;
  state.openProgress = state.openProgress > 0.4 ? 0 : 1;
  syncUI();
  heroLoop.draw();
});

// ==================== 01 四类导航空间天平对比器 ====================
const balState = { vp: 375, cnt: 8 };
const balanceRowsEl = $("#balance-rows");
const balanceVerdictEl = $("#balance-verdict");

function renderBalance() {
  const { vp, cnt } = balState;
  const rows = [
    {
      id: "263",
      name: "263 导航抽屉（本页）",
      href: null,
      navPct: vp >= 1024 ? Math.round((252 / vp) * 100) : 0,
      visibleCount: vp >= 1024 ? cnt : 0,
      extraTap: vp >= 1024 ? "0 步（常驻）" : "+1 步呼出",
      status: cnt <= 4 ? "warn" : "ok",
      statusText: cnt <= 4 ? "杀鸡用牛刀" : vp >= 1024 ? "桌面常驻理想" : "空间/容量平衡",
      note:
        cnt <= 4
          ? "仅 4 个频道藏进抽屉会拖慢切换，平时抽屉也显得空荡。"
          : vp >= 1024
          ? "宽屏切常驻模式，完整展示多组目录且主内容稳占 80%。"
          : "平时 100% 释放正文宽度，需要时一次侧滑容下全部多组路径。",
    },
    {
      id: "262",
      name: "262 顶部导航布局",
      href: "https://layout.xiaoxiaodong.ai/262/play/",
      navPct: vp < 600 ? 12 : 8,
      visibleCount: Math.min(cnt, vp < 600 ? 3 : vp < 960 ? 6 : 8),
      extraTap: "0 步直达",
      status: vp < 600 && cnt > 4 ? "bad" : cnt > 8 ? "bad" : "ok",
      statusText:
        vp < 600 && cnt > 4
          ? "窄屏折行挤压"
          : cnt > 8
          ? "超 8 项撑爆顶栏"
          : vp >= 960
          ? "宽屏直观优选"
          : "中屏可用",
      note:
        vp < 600 && cnt > 4
          ? `${vp}px 屏宽横向最多排 3–4 个短词，${cnt} 项只能折叠或横向硬滚。`
          : cnt > 8
          ? "顶栏塞入 12 项会导致折成两行或被迫再套下拉菜单。"
          : "入口直接露在眼皮底下，发现率最高、零额外点击。",
    },
    {
      id: "258",
      name: "258 侧边栏页面",
      href: "https://layout.xiaoxiaodong.ai/258/play/",
      navPct: Math.min(68, Math.round((240 / vp) * 100)),
      visibleCount: cnt,
      extraTap: "0 步常驻",
      status: vp < 768 ? "bad" : vp < 1024 ? "warn" : "ok",
      statusText: vp < 768 ? "吞掉 64% 屏宽" : vp < 1024 ? "略挤正文" : "宽屏主力",
      note:
        vp < 768
          ? `在 ${vp}px 手机上常驻 240px 侧栏，正文只剩 ${vp - 240}px，完全没法阅读。`
          : vp < 1024
          ? "768px 平板常驻会吃掉约 31% 宽度，改为可收折抽屉更从容。"
          : "1280px 下与主内容并排最顺手，其实是抽屉在宽屏的常驻态。",
    },
    {
      id: "264",
      name: "264 底部导航布局",
      href: "https://layout.xiaoxiaodong.ai/264/play/",
      navPct: vp < 600 ? 10 : 7,
      visibleCount: Math.min(cnt, 5),
      extraTap: "0 步拇指直达",
      status: cnt <= 4 && vp < 768 ? "ok" : cnt > 5 ? "bad" : "warn",
      statusText:
        cnt <= 4 && vp < 768
          ? "手机拇指最优"
          : cnt > 5
          ? `上限 5 项，${cnt - 5} 项无处放`
          : "桌面少用底栏",
      note:
        cnt <= 4 && vp < 768
          ? "手机单手拇指热区一键切频道，发现率与速度全面胜过抽屉。"
          : cnt > 5
          ? "底部标签栏物理上限通常为 3–5 项，多出来的频道只能再收进抽屉或「更多」。"
          : "大屏鼠标指针长距离下移到屏底并不顺手。",
    },
  ];

  const bestId =
    cnt <= 4
      ? vp < 768
        ? "264"
        : "262"
      : vp < 1024
      ? "263"
      : "258";

  balanceRowsEl.innerHTML = rows
    .map((r) => {
      const mainPct = Math.max(0, 100 - r.navPct);
      const titleHtml = r.href
        ? `<a href="${r.href}" target="_blank" rel="noopener">${r.name}</a>`
        : r.name;
      return `
      <div class="bal-row ${r.id === bestId ? "is-best" : ""}">
        <div class="bal-row-top">
          <span class="bal-row-name">${titleHtml}</span>
          <span class="bal-row-meta">常态主区 ${mainPct}% · 直见 ${r.visibleCount}/${cnt} 项 · ${r.extraTap}</span>
          <span class="bal-tag ${r.status}">${r.statusText}</span>
        </div>
        <div class="bal-bar-track" aria-hidden="true">
          <div class="bal-bar-nav" style="width:${r.navPct}%"></div>
          <div class="bal-bar-main" style="width:${mainPct}%"></div>
        </div>
        <p class="bal-row-note">${r.note}</p>
      </div>`;
    })
    .join("");

  balanceVerdictEl.textContent =
    cnt <= 4
      ? `判断（${vp}px · ${cnt} 项）：入口很少，别藏进导航抽屉——${vp < 768 ? "手机优先用 264 底部导航让拇指一步直达" : "中大屏直接放进 262 顶部导航，零隐藏损耗"}。`
      : vp < 1024
      ? `判断（${vp}px · ${cnt} 项）：这正是 263 导航抽屉的主场——顶栏与底栏都装不下 ${cnt} 个频道，常驻侧栏又会吞掉正文，侧滑抽屉换出最大的净空与容量。`
      : `判断（${vp}px · ${cnt} 项）：桌面宽屏空间充足，导航抽屉应自动展开成常驻态（即 258 侧边栏形态），既容下 ${cnt} 项分组又省去隐藏点击。`;
}

$$("[data-bvp]").forEach((b) => {
  b.addEventListener("click", () => {
    balState.vp = Number(b.dataset.bvp);
    $$("[data-bvp]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderBalance();
  });
});
$$("[data-bcnt]").forEach((b) => {
  b.addEventListener("click", () => {
    balState.cnt = Number(b.dataset.bcnt);
    $$("[data-bcnt]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderBalance();
  });
});
renderBalance();

// ==================== 02 四联实体设备同步滑出矩阵 ====================
const modesVwRange = $("#modes-vw-range");
const modesVwVal = $("#modes-vw-val");
const modesToggleAll = $("#modes-toggle-all");
const modesGrid = $("#modes-grid");
let modesOpen = true;

function renderModesMatrix() {
  const vw = Number(modesVwRange.value);
  const devTxt = vw < 600 ? "手机窄屏" : vw < 960 ? "平板中屏" : "桌面宽屏";
  modesVwVal.textContent = `${vw}px · ${devTxt}`;

  const drawerW = vw < 600 ? 272 : 256;
  const pct = Math.min(76, Math.round((drawerW / vw) * 100));
  const railPct = Math.max(12, Math.round((68 / vw) * 100));

  const defs = [
    {
      id: "modal",
      name: "覆盖 Modal",
      fit: vw < 600 ? "rec" : vw < 960 ? "mid" : "bad",
      fitText: vw < 600 ? "当前屏推荐" : vw < 960 ? "备选可用" : "宽屏过于隐蔽",
      desc: "抽屉浮在正文上方配半透明暗层，主内容完全不重排；留出 ≥56px 露边点空白即关。",
      stat: modesOpen ? `主区不重排 · 退场缝 ${Math.max(0, vw - drawerW)}px` : `已收起 · 主区 100%`,
      drawerStyle: `width:${pct}%; transform:translateX(${modesOpen ? "0" : "-105%"});`,
      contentStyle: `left:0; width:100%;`,
      scrimOpacity: modesOpen ? 1 : 0,
    },
    {
      id: "push",
      name: "推挤 Push",
      fit: vw < 720 ? "bad" : "mid",
      fitText: vw < 720 ? "窄屏禁区" : "仅限临时工具",
      desc: "拉开时把主内容整块向右顶出或压窄，窄屏会让卡片和正文直接折断成碎片。",
      stat: modesOpen ? `主区被挤剩 ${Math.max(0, vw - drawerW)}px` : `已收起 · 主区 100%`,
      drawerStyle: `width:${pct}%; transform:translateX(${modesOpen ? "0" : "-105%"});`,
      contentStyle: `left:${modesOpen ? pct : 0}%; width:${modesOpen ? 100 - pct : 100}%;`,
      scrimOpacity: 0,
    },
    {
      id: "rail",
      name: "迷你轨 Mini-Rail",
      fit: vw >= 600 && vw < 1024 ? "rec" : vw < 600 ? "bad" : "mid",
      fitText: vw >= 600 && vw < 1024 ? "当前屏推荐" : vw < 600 ? "窄屏占边" : "桌面可用",
      desc: "平时缩成 68px 图标窄轨保住高频直达，需要看文字标签与分组时再向右滑展。",
      stat: modesOpen ? `展开至 ${drawerW}px（覆层）` : `常驻 68px 图标轨 · 主区 ${vw - 68}px`,
      drawerStyle: `width:${modesOpen ? pct : railPct}%; transform:translateX(0);`,
      contentStyle: `left:${railPct}%; width:${100 - railPct}%;`,
      scrimOpacity: modesOpen ? 0.85 : 0,
    },
    {
      id: "permanent",
      name: "常驻 Standard",
      fit: vw >= 960 ? "rec" : "bad",
      fitText: vw >= 960 ? "当前屏推荐" : "中小屏锁死过窄",
      desc: "始终与主内容左右并排，零隐藏点击；仅在宽屏有足够余量时启用。",
      stat: `常驻 ${drawerW}px · 主区 ${Math.max(0, vw - drawerW)}px`,
      drawerStyle: `width:${pct}%; transform:translateX(0);`,
      contentStyle: `left:${pct}%; width:${100 - pct}%;`,
      scrimOpacity: 0,
    },
  ];

  modesGrid.innerHTML = defs
    .map(
      (d) => `
    <article class="mode-card ${d.fit === "rec" ? "is-rec" : d.fit === "bad" ? "is-bad" : ""}">
      <div class="mode-card-head">
        <h3>${d.name}</h3>
        <span class="mode-fit-tag ${d.fit}">${d.fitText}</span>
      </div>
      <div class="mini-dev" aria-hidden="true">
        <div class="mini-dev-content" style="${d.contentStyle}">
          <div class="mini-dev-topbar"><span class="mini-dev-bars"></span></div>
          <div class="mini-dev-hero"></div>
          <div class="mini-dev-cards"><div class="mini-dev-card"></div><div class="mini-dev-card"></div></div>
        </div>
        <div class="mini-dev-scrim" style="opacity:${d.scrimOpacity}"></div>
        <div class="mini-dev-drawer" style="${d.drawerStyle}">
          <div class="mini-dr-item is-hi"></div>
          <div class="mini-dr-item"></div>
          <div class="mini-dr-item"></div>
          <div class="mini-dr-item"></div>
          <div class="mini-dr-item"></div>
        </div>
      </div>
      <p class="mode-card-desc">${d.desc}</p>
      <div class="mode-card-stat">${d.stat}</div>
    </article>`
    )
    .join("");
}

modesVwRange.addEventListener("input", renderModesMatrix);
modesToggleAll.addEventListener("click", () => {
  modesOpen = !modesOpen;
  modesToggleAll.setAttribute("aria-pressed", String(modesOpen));
  modesToggleAll.textContent = modesOpen ? "同步收起全部抽屉" : "同步拉出全部抽屉";
  renderModesMatrix();
});
renderModesMatrix();

// ==================== 03 深勃艮第暗室：抽屉信息架构手术台 ====================
const surgState = { group: false, shallow: false, highlight: false, icons: false };
const anatDrawer = $("#anatomy-drawer");
const anatSvg = $("#anatomy-scan-svg");
const anatScore = $("#anat-score");
const anatCaption = $("#anat-caption");
const anatToggleAll = $("#anat-toggle-all");

const ANAT_ICONS = {
  home: `<svg viewBox="0 0 16 16" fill="none"><path d="M2.5 7.5L8 2.8L13.5 7.5V13.4H10V9.8H6V13.4H2.5V7.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  discover: `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.4" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/></svg>`,
  grid: `<svg viewBox="0 0 16 16" fill="none"><rect x="2.6" y="2.6" width="4.4" height="4.4" rx="0.8" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="2.6" width="4.4" height="4.4" rx="0.8" stroke="currentColor" stroke-width="1.3"/><rect x="2.6" y="9" width="4.4" height="4.4" rx="0.8" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="9" width="4.4" height="4.4" rx="0.8" stroke="currentColor" stroke-width="1.3"/></svg>`,
  bookmark: `<svg viewBox="0 0 16 16" fill="none"><path d="M4 2.8H12V13.4L8 10.6L4 13.4V2.8Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  gear: `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2.4 2"/></svg>`,
  user: `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.4" r="2.4" stroke="currentColor" stroke-width="1.4"/><path d="M3.2 13.2C3.8 10.7 5.6 9.5 8 9.5C10.4 9.5 12.2 10.7 12.8 13.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  help: `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.4" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="10.8" r="0.8" fill="currentColor"/><path d="M6.6 6.4C6.6 5.5 7.2 5 8 5C8.8 5 9.4 5.5 9.4 6.2C9.4 7 8.4 7.3 8 8V8.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
};

function renderAnatomy() {
  const fixed = Object.values(surgState).filter(Boolean).length;
  const tier = fixed === 4 ? "清晰直扫（示意）" : fixed >= 2 ? "渐趋有序（示意）" : "扫视折返（示意）";
  anatScore.textContent = `已修 ${fixed}/4 · ${tier}`;
  anatToggleAll.textContent = fixed === 4 ? "全部关闭看混乱态" : "全部开启看原海报级秩序";

  const ico = (key) => (surgState.icons ? `<span class="anat-dot" aria-hidden="true">${ANAT_ICONS[key]}</span>` : "");
  const rows = [];
  if (surgState.group) rows.push(`<div class="anat-grp" lang="en">CORE · 核心导航</div>`);
  rows.push(`<div class="anat-row ${surgState.highlight ? "is-active" : ""}">${ico("home")}<span>概览${surgState.icons ? " · OVERVIEW" : ""}</span></div>`);
  rows.push(`<div class="anat-row">${ico("discover")}<span>发现${surgState.icons ? " · DISCOVER" : ""}</span></div>`);
  rows.push(`<div class="anat-row">${ico("grid")}<span>分类</span><svg width="11" height="11" viewBox="0 0 12 12" fill="none" style="margin-left:auto" aria-hidden="true"><path d="M2.5 4.2L6 7.8L9.5 4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`);
  rows.push(`<div class="anat-row is-sub" style="padding-left:34px"><span>页面框架</span></div>`);
  if (!surgState.shallow) {
    rows.push(`<div class="anat-row is-sub" style="padding-left:60px;color:#FF9BA1"><span class="anat-branch" aria-hidden="true"></span><span>导航组件（3 层）</span></div>`);
    rows.push(`<div class="anat-row is-sub" style="padding-left:88px;color:#FF9BA1"><span class="anat-branch" aria-hidden="true"></span><span>侧滑变体（4 层撞墙）</span></div>`);
  }
  rows.push(`<div class="anat-row">${ico("bookmark")}<span>收藏</span></div>`);
  rows.push(`<div class="anat-row">${ico("gear")}<span>设置</span></div>`);
  rows.push(`<div class="anat-row">${ico("user")}<span>个人中心</span></div>`);
  if (surgState.group) {
    rows.push(`<div class="anat-sep"></div>`);
    rows.push(`<div class="anat-grp" lang="en">SUPPORT · 辅助</div>`);
  }
  rows.push(`<div class="anat-row">${ico("help")}<span>帮助与反馈</span></div>`);

  anatDrawer.innerHTML = rows.join("");

  // SVG 眼动扫视折线（全开时为干脆单一垂直轴，未开时体现左右折返与撞墙）
  const pts =
    fixed === 4
      ? [[48, 44], [48, 86], [48, 128], [62, 162], [48, 200], [48, 240], [48, 280], [48, 342]]
      : [
          [42, 34],
          [116, 68],
          [56, 104],
          [92, 138],
          [156, 174],
          [214, 210],
          [66, 250],
          [130, 290],
          [58, 336],
        ];
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
  const stroke = fixed === 4 ? "#7CE5BE" : "#FF9BA1";
  anatSvg.innerHTML = `
    <path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="2" stroke-dasharray="5 4" opacity="0.88"/>
    ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${stroke}"/>`).join("")}
  `;

  $$("[data-surg]").forEach((btn) => {
    const k = btn.dataset.surg;
    const on = surgState[k];
    btn.setAttribute("aria-pressed", String(on));
    const st = btn.querySelector(".surg-state");
    if (k === "group") st.textContent = on ? "开 · 主辅细线切分" : "关 · 一锅乱炖";
    if (k === "shallow") st.textContent = on ? "开 · 封顶 2 层" : "关 · 4 层缩进撞墙";
    if (k === "highlight") st.textContent = on ? "开 · 玫瑰粉全宽带" : "关 · 丢失当前坐标";
    if (k === "icons") st.textContent = on ? "开 · 图标列齐左" : "关 · 纯文字墙";
  });

  const remain = [
    !surgState.shallow && "4 层嵌套向右撞墙",
    !surgState.group && "主频道和帮助混成一片",
    !surgState.highlight && "不知道自己现在在哪一页",
    !surgState.icons && "缺图标锚点导致纯字墙",
  ].filter(Boolean);
  anatCaption.textContent =
    fixed === 4
      ? "四项全部开启：视线沿左侧图标列匀速直下，玫瑰粉高亮带一眼定坐标，二级展开不过深，细横线把辅助入口安放到底部——正是 263 原海报的秩序底子。"
      : `还有 ${4 - fixed} 项未治理：${remain.join("、")}。`;
}

$$("[data-surg]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.surg;
    surgState[k] = !surgState[k];
    renderAnatomy();
  });
});
anatToggleAll.addEventListener("click", () => {
  const allOn = Object.values(surgState).every(Boolean);
  for (const k of Object.keys(surgState)) surgState[k] = !allOn;
  renderAnatomy();
});
renderAnatomy();

// ==================== 04 年代切片档案轨（全经联网核实） ====================
const ERAS = {
  "1981": {
    badge: "1981 · Xerox 8010 Star",
    title: "Norm Cox 画出三道横线：原本不是全站导航",
    text: "1981 年施乐推出的 Xerox 8010 Star 图形工作站上，交互设计师 Norm Cox 在低分辨率黑白屏幕（约 13×13 到 16×16 像素）中画出了三道水平短线，用来表示对象附带的列表式上下文菜单。演示时团队甚至打趣说那是「给窗口散热的通风口」。那时它并非网站主导航，也还没有「汉堡图标」这个外号。",
    source: "核实来源：Norm Cox 访谈与 Xerox Star 历史档案（Wikipedia: Hamburger button）。",
    svg: `<svg viewBox="0 0 260 164" fill="none"><rect width="260" height="164" fill="#F4E6DA"/><rect x="26" y="18" width="208" height="128" rx="4" fill="#FFFDF9" stroke="#500E21" stroke-width="2"/><rect x="26" y="18" width="208" height="24" fill="#500E21"/><rect x="36" y="25" width="70" height="10" rx="2" fill="#FFF4E5"/><rect x="196" y="22" width="26" height="16" rx="2" fill="#F38292"/><line x1="201" y1="26" x2="217" y2="26" stroke="#380816" stroke-width="2"/><line x1="201" y1="30" x2="217" y2="30" stroke="#380816" stroke-width="2"/><line x1="201" y1="34" x2="217" y2="34" stroke="#380816" stroke-width="2"/><rect x="148" y="46" width="76" height="74" fill="#FFF4E5" stroke="#500E21" stroke-width="1.6" stroke-dasharray="3 2"/><rect x="158" y="58" width="54" height="5" fill="#500E21"/><rect x="158" y="72" width="44" height="5" fill="#A46B78"/><rect x="158" y="86" width="50" height="5" fill="#A46B78"/><rect x="158" y="100" width="38" height="5" fill="#A46B78"/><rect x="40" y="56" width="88" height="8" fill="#E6C9BC"/><rect x="40" y="72" width="74" height="6" fill="#E6C9BC"/><rect x="40" y="86" width="82" height="6" fill="#E6C9BC"/></svg>`,
  },
  "2011": {
    badge: "2011 · Path 2.0 & Facebook Mobile",
    title: "智能手机屏太小，整个主界面开始向右滑开",
    text: "2011 年末 Path 2.0 与随后改版的 Facebook 移动客户端面对一个新难题：社交动态、消息、群组、相册、设置远超底部 4–5 格标签栏的容量。设计师把整张主页面向右推开，露出身后藏着的深色纵向导航清单——这就是今天人们熟悉的移动侧滑抽屉雏形，并迅速通过第三方代码库席卷 iOS 与 Android。",
    source: "核实来源：Path 2.0 发布与早期移动导航模式回顾。",
    svg: `<svg viewBox="0 0 260 164" fill="none"><rect width="260" height="164" fill="#F4E6DA"/><rect x="78" y="12" width="104" height="140" rx="14" fill="#5B1426" stroke="#380816" stroke-width="2.5"/><rect x="86" y="34" width="44" height="7" rx="2" fill="#F38292"/><rect x="86" y="48" width="40" height="5" rx="2" fill="#F8DFD2" fill-opacity="0.75"/><rect x="86" y="60" width="46" height="5" rx="2" fill="#F8DFD2" fill-opacity="0.75"/><rect x="86" y="72" width="36" height="5" rx="2" fill="#F8DFD2" fill-opacity="0.75"/><rect x="86" y="84" width="42" height="5" rx="2" fill="#F8DFD2" fill-opacity="0.75"/><rect x="142" y="20" width="36" height="124" rx="4" fill="#FFF4E5"/><rect x="148" y="32" width="24" height="24" rx="3" fill="#F38292" fill-opacity="0.45"/><rect x="148" y="64" width="24" height="34" rx="3" fill="#E9C7B9"/><path d="M126 118H154M148 112L155 118L148 124" stroke="#F38292" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  "2013": {
    badge: "2012–2013 · Off-Canvas & Android DrawerLayout",
    title: "从屏外响应式理念，到谷歌官方组件标准",
    text: "2012 年 6 月，产品策略师 Luke Wroblewski 撰文提出「Off Canvas Multi-Device Layouts（屏外多设备布局）」，把屏幕可视区之外的左右侧翼正式纳入响应式网页设计。2013 年 5 月 Google I/O 上，谷歌在 Android Support Library 正式推出 DrawerLayout 组件并写入官方结构指南，导航抽屉从此定型为跨平台标准范式。",
    source: "核实来源：Luke Wroblewski (2012) lukew.com；Google I/O 2013 Android Design 议题。",
    svg: `<svg viewBox="0 0 260 164" fill="none"><rect width="260" height="164" fill="#F4E6DA"/><rect x="26" y="22" width="208" height="120" rx="8" fill="#FFF9F1" stroke="#500E21" stroke-width="2"/><rect x="26" y="22" width="208" height="22" rx="6" fill="#F38292"/><rect x="26" y="44" width="84" height="98" fill="#5B1426"/><rect x="108" y="44" width="4" height="98" fill="#F38292"/><rect x="36" y="56" width="60" height="10" rx="2" fill="#F38292"/><rect x="36" y="74" width="52" height="6" rx="2" fill="#FFF4E5" fill-opacity="0.8"/><rect x="36" y="88" width="56" height="6" rx="2" fill="#FFF4E5" fill-opacity="0.8"/><rect x="36" y="102" width="46" height="6" rx="2" fill="#FFF4E5" fill-opacity="0.8"/><rect x="124" y="56" width="96" height="38" rx="4" fill="#F6D5C6"/><rect x="124" y="102" width="44" height="28" rx="4" fill="#FBE8DB"/><rect x="176" y="102" width="44" height="28" rx="4" fill="#FBE8DB"/></svg>`,
  },
  "2016": {
    badge: "2015–至今 · 反思隐藏代价与三端自适应",
    title: "不再一藏了之：手机覆层、平板迷你轨、桌面常驻",
    text: "热潮过后，实证研究敲响警钟：2015 年 Luke Wroblewski 以《Obvious Always Wins》指出把高频入口藏进抽屉会让使用率骤降；2016 年 NN/g 通过 179 人、6 个网站的量化测试证实隐藏导航显著损害发现率与速度。此后 Material Design 3 与 Apple HIG 形成现代共识：高频 3–5 项优先外露，大型架构则按屏宽在「覆层 Modal → 迷你轨 Rail → 常驻 Standard」之间平滑变形。",
    source: "核实来源：Luke Wroblewski (2015)；NN/g (2016) nngroup.com；Material Design 3 & Apple HIG。",
    svg: `<svg viewBox="0 0 260 164" fill="none"><rect width="260" height="164" fill="#F4E6DA"/><rect x="14" y="42" width="46" height="82" rx="6" fill="#FFF9F1" stroke="#500E21" stroke-width="1.8"/><rect x="14" y="42" width="32" height="82" rx="5" fill="#5B1426"/><rect x="44" y="42" width="3" height="82" fill="#F38292"/><rect x="74" y="34" width="66" height="90" rx="6" fill="#FFF9F1" stroke="#500E21" stroke-width="1.8"/><rect x="74" y="34" width="16" height="90" rx="5" fill="#5B1426"/><circle cx="82" cy="52" r="3" fill="#F38292"/><circle cx="82" cy="68" r="3" fill="#FFF4E5"/><circle cx="82" cy="84" r="3" fill="#FFF4E5"/><rect x="154" y="26" width="92" height="98" rx="6" fill="#FFF9F1" stroke="#500E21" stroke-width="1.8"/><rect x="154" y="26" width="32" height="98" rx="5" fill="#5B1426"/><rect x="184" y="26" width="3" height="98" fill="#F38292"/><rect x="195" y="38" width="42" height="28" rx="3" fill="#F6D5C6"/><rect x="195" y="72" width="42" height="40" rx="3" fill="#FBE8DB"/></svg>`,
  },
};

const eraVisual = $("#era-visual");
const eraBadge = $("#era-badge");
const eraTitle = $("#era-title");
const eraText = $("#era-text");
const eraSource = $("#era-source");

function renderEra(key) {
  const e = ERAS[key] || ERAS["1981"];
  eraVisual.innerHTML = e.svg;
  eraBadge.textContent = e.badge;
  eraTitle.textContent = e.title;
  eraText.textContent = e.text;
  eraSource.textContent = e.source;
  $$("[data-era]").forEach((t) => {
    const active = t.dataset.era === key;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
}
$$("[data-era]").forEach((t) => t.addEventListener("click", () => renderEra(t.dataset.era)));
renderEra("1981");

// ==================== 05 三组真实产品分诊卡片 ====================
const TRIAGE = {
  social: {
    badTitle: "硬塞进导航抽屉：4 个主频道全藏左上角",
    badText: "用户每次在「首页 / 发现 / 消息 / 我的」间往返，都得伸长左手去戳左上角汉堡钮再二次点选。次级频道曝光暴跌，单手握持体验极其别扭。",
    goodTitle: "改用 264 底部导航布局：拇指热区 1 步直达",
    goodText: "只有 4 个平级高频入口时，固定在底部的标签栏让全部频道一眼可见，切换只需 1 次拇指轻点，留出抽屉只收低频账号设置即可。",
    badSvg: `<svg viewBox="0 0 220 110" fill="none"><rect width="220" height="110" rx="8" fill="#FFF9F1" stroke="#E5CBBF"/><rect x="66" y="10" width="88" height="90" rx="10" fill="#FFF4E5" stroke="#A91B26" stroke-width="1.8"/><rect x="66" y="10" width="58" height="90" rx="8" fill="#5B1426"/><rect x="74" y="26" width="38" height="6" rx="2" fill="#F38292"/><rect x="74" y="40" width="32" height="5" rx="2" fill="#FFF4E5" fill-opacity="0.7"/><rect x="74" y="52" width="34" height="5" rx="2" fill="#FFF4E5" fill-opacity="0.7"/><rect x="74" y="64" width="30" height="5" rx="2" fill="#FFF4E5" fill-opacity="0.7"/></svg>`,
    goodSvg: `<svg viewBox="0 0 220 110" fill="none"><rect width="220" height="110" rx="8" fill="#F5FCF9" stroke="#B7DEC9"/><rect x="66" y="10" width="88" height="90" rx="10" fill="#FFF9F1" stroke="#166248" stroke-width="1.8"/><rect x="74" y="20" width="72" height="32" rx="4" fill="#F7D3C5"/><rect x="74" y="58" width="33" height="18" rx="3" fill="#FBE8DB"/><rect x="113" y="58" width="33" height="18" rx="3" fill="#FBE8DB"/><rect x="66" y="82" width="88" height="18" rx="4" fill="#5B1426"/><circle cx="80" cy="91" r="3.5" fill="#F38292"/><circle cx="100" cy="91" r="3.5" fill="#FFF4E5" fill-opacity="0.75"/><circle cx="120" cy="91" r="3.5" fill="#FFF4E5" fill-opacity="0.75"/><circle cx="140" cy="91" r="3.5" fill="#FFF4E5" fill-opacity="0.75"/></svg>`,
  },
  mail: {
    badTitle: "宽屏还藏覆层抽屉：每看一封信开关一次",
    badText: "1440px 桌面上处理邮件与笔记需要高频在发件清单和正文间跳转；把清单藏进覆层抽屉会导致每次切条目都要先开抽屉、盖住正文、选完再关。",
    goodTitle: "改用 267 列表—详情 或 258 常驻侧边栏",
    goodText: "宽屏直接采用左目录 + 中列表 + 右详情并行展示，无需反复滑出遮挡正文；只有缩到手机窄屏时才退化为导航抽屉。",
    badSvg: `<svg viewBox="0 0 220 110" fill="none"><rect width="220" height="110" rx="8" fill="#FFF9F1" stroke="#E5CBBF"/><rect x="16" y="14" width="188" height="82" rx="6" fill="#FFF4E5" stroke="#A91B26" stroke-width="1.8"/><rect x="16" y="14" width="188" height="16" rx="5" fill="#F8DFD2"/><rect x="24" y="19" width="14" height="6" fill="#5B1426"/><rect x="30" y="38" width="160" height="48" rx="4" fill="#FBE8DB"/></svg>`,
    goodSvg: `<svg viewBox="0 0 220 110" fill="none"><rect width="220" height="110" rx="8" fill="#F5FCF9" stroke="#B7DEC9"/><rect x="16" y="14" width="188" height="82" rx="6" fill="#FFF9F1" stroke="#166248" stroke-width="1.8"/><rect x="16" y="14" width="44" height="82" rx="5" fill="#5B1426"/><rect x="64" y="22" width="46" height="66" rx="4" fill="#F8DFD2"/><rect x="116" y="22" width="80" height="66" rx="4" fill="#FBE8DB"/></svg>`,
  },
  essay: {
    badTitle: "长文专题硬装抽屉：点开只有孤零零两项",
    badText: "一篇深度特稿或单页说明只有「首页 / 关于」两个链接，却为了显得「专业」塞了一只汉堡抽屉，读者点开后看到大片空白只觉空洞。",
    goodTitle: "改用 255 单列页面 + 极简顶栏两枚链接",
    goodText: "把有限的 1–2 个跳转安静放在顶部单行页眉里，整块屏幅彻底让给舒适的文字栏宽与插图节奏，零多余组件。",
    badSvg: `<svg viewBox="0 0 220 110" fill="none"><rect width="220" height="110" rx="8" fill="#FFF9F1" stroke="#E5CBBF"/><rect x="66" y="10" width="88" height="90" rx="10" fill="#FFF4E5" stroke="#A91B26" stroke-width="1.8"/><rect x="66" y="10" width="60" height="90" rx="8" fill="#5B1426"/><rect x="74" y="26" width="34" height="5" rx="2" fill="#F38292"/><rect x="74" y="38" width="28" height="5" rx="2" fill="#FFF4E5" fill-opacity="0.7"/></svg>`,
    goodSvg: `<svg viewBox="0 0 220 110" fill="none"><rect width="220" height="110" rx="8" fill="#F5FCF9" stroke="#B7DEC9"/><rect x="66" y="10" width="88" height="90" rx="10" fill="#FFF9F1" stroke="#166248" stroke-width="1.8"/><rect x="74" y="18" width="24" height="5" rx="2" fill="#5B1426"/><rect x="122" y="18" width="24" height="5" rx="2" fill="#F38292"/><rect x="76" y="34" width="68" height="7" rx="2" fill="#500E21"/><rect x="76" y="48" width="68" height="4" rx="2" fill="#D5B4A6"/><rect x="76" y="57" width="62" height="4" rx="2" fill="#D5B4A6"/><rect x="76" y="66" width="66" height="4" rx="2" fill="#D5B4A6"/><rect x="76" y="75" width="52" height="4" rx="2" fill="#D5B4A6"/></svg>`,
  },
};

const triageCompare = $("#triage-compare");
function renderTriage(key) {
  const t = TRIAGE[key] || TRIAGE.social;
  triageCompare.innerHTML = `
    <article class="triage-side is-bad">
      <span class="triage-badge">别用抽屉</span>
      ${t.badSvg}
      <h4>${t.badTitle}</h4>
      <p>${t.badText}</p>
    </article>
    <article class="triage-side is-good">
      <span class="triage-badge">更优替代</span>
      ${t.goodSvg}
      <h4>${t.goodTitle}</h4>
      <p>${t.goodText}</p>
    </article>`;
  $$("[data-triage]").forEach((b) => {
    const active = b.dataset.triage === key;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
}
$$("[data-triage]").forEach((b) => b.addEventListener("click", () => renderTriage(b.dataset.triage)));
renderTriage("social");

// ==================== 06 小练习（正确答案 B，单一变量四选一） ====================
const QUIZ_ANS = {
  A: {
    ok: false,
    title: "选了 A — 差在「抽屉过宽，吞掉了安全退场缝」",
    body: "375px 手机上把抽屉拉到 352px，右侧只剩 23px 窄缝，远小于 Material Design 3 建议的 56dp 最小露边。用户既看不清背后的原页面上下文，也极易点偏关不掉抽屉。正确答案是 B。",
  },
  B: {
    ok: true,
    title: "答对了！方案 B 全部成立",
    body: "在 375px 手机上用覆层（Modal）展开 280px 抽屉，右侧稳留 95px 暗层退场缝（远大于 56dp 门槛），不挤压底层正文；9 个频道用 3 组细线清晰归类，并高亮当前位置——兼顾净空、退场闭环与层级扫描。",
  },
  C: {
    ok: false,
    title: "选了 C — 差在「窄屏误用推挤模式」",
    body: "375px 屏幕用推挤展开 280px 抽屉，会把正文硬生生压扁到只剩 95px 宽，卡片和段落当场碎裂重排。窄屏应改用不挤正文的覆层（Modal）模式。正确答案是 B。",
  },
  D: {
    ok: false,
    title: "选了 D — 差在「内部无分组、缺当前坐标高亮」",
    body: "宽度和覆层模式都对了，但 9 个频道不按「阅读 / 整理 / 系统」加细线分组，且没有高亮当前所在页，用户每次拉开都要逐行扫描并丢失位置感。正确答案是 B。",
  },
};

const quizFeedback = $("#quiz-feedback");
$$("[data-opt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.opt;
    const info = QUIZ_ANS[pick];
    $$("[data-opt]").forEach((b) => {
      const k = b.dataset.opt;
      b.setAttribute("aria-pressed", String(k === pick));
      b.classList.remove("is-picked-ok", "is-picked-bad");
      if (k === pick) b.classList.add(info.ok ? "is-picked-ok" : "is-picked-bad");
      else if (k === "B") b.classList.add("is-picked-ok");
    });
    quizFeedback.hidden = false;
    quizFeedback.classList.toggle("is-ok", info.ok);
    quizFeedback.innerHTML = `
      <h3>${info.title}</h3>
      <p>${info.body}</p>
      <p><strong>单变量对照：</strong>A 过宽仅留 23px 退场缝 · B 四项全对 · C 窄屏误推挤 · D 缺分组与当前高亮。</p>`;
  });
});

// ==================== 07 原海报放大灯箱（只复用 #poster.src，不重复内联） ====================
const posterImg = $("#poster");
const posterZoomBtn = $("#poster-zoom-btn");
const lightbox = $("#lightbox");
const lightboxImg = $("#lightbox-img");
const lightboxStage = $("#lightbox-stage");
const lbZoom = $("#lb-zoom");
let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = false;
let lbSx = 0;
let lbSy = 0;

function updateLightboxTransform() {
  lightboxImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoom.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lightboxImg.src) lightboxImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  updateLightboxTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterZoomBtn.focus();
}

posterZoomBtn.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = Math.min(3.5, +(lbScale + 0.35).toFixed(2));
  updateLightboxTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  updateLightboxTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  updateLightboxTransform();
});

lightboxStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
    updateLightboxTransform();
  },
  { passive: false }
);
lightboxStage.addEventListener("pointerdown", (e) => {
  if (e.target === lightboxStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbDrag = true;
  lbSx = e.clientX - lbTx;
  lbSy = e.clientY - lbTy;
  lightboxStage.classList.add("is-dragging");
  lightboxStage.setPointerCapture(e.pointerId);
});
lightboxStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbSx;
  lbTy = e.clientY - lbSy;
  updateLightboxTransform();
});
lightboxStage.addEventListener("pointerup", () => {
  lbDrag = false;
  lightboxStage.classList.remove("is-dragging");
});

// ==================== 首次同步与绘制 ====================
syncUI();
heroLoop.draw();
