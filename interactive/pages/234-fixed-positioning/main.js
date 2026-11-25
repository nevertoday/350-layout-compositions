// 234 固定定位布局 · 全页交互入口
import {
  ANCHOR_OFFSETS,
  BUDGET_DEVICES,
  DRILL_OPTIONS,
  HISTORY_ERAS,
  POSITION_MODES,
  SCENARIOS,
  TRAPS_DATA,
  createHeroState,
  evaluateBudget,
  evaluateHero,
} from "./model.js";
import { mountDepthCanvas, mountScrubCanvas } from "./depth-canvas.js";

const $ = (id) => document.getElementById(id);

// =========================================================================
// 1. HERO 活体浏览器视口 + 纵深剖面仪 + 滚页滑轨
// =========================================================================
const heroState = createHeroState("broken");
let latestEval = evaluateHero(heroState);

const depthCtl = mountDepthCanvas($("depthCanvas"), () => latestEval);
const scrubCtl = mountScrubCanvas($("scrubCanvas"), () => latestEval);

const vpDocEl = $("vpDoc");
const vpDocItems = [...vpDocEl.children];
const vpScrollThumbEl = $("vpScrollThumb");
const vpTopbarEl = $("vpTopbar");
const vpRailEl = $("vpRail");
const vpBottombarEl = $("vpBottombar");
const vpFabEl = $("vpFab");
const vpOverlapBandEl = $("vpOverlapBand");
const titlePinEl = $("titlePinReadout");
const legendScrollEl = $("legendScrollVal");
const scrubReadoutEl = $("scrubReadout");

function applyScrollTransform(scrollY, maxScroll, ancestorTransform) {
  const docTf = `translate3d(0, ${-scrollY}px, 0)`;
  for (let i = 0; i < vpDocItems.length; i++) vpDocItems[i].style.transform = docTf;
  const ratio = maxScroll > 0 ? scrollY / maxScroll : 0;
  vpScrollThumbEl.style.transform = `translate3d(0, ${Math.round(ratio * 182)}%, 0)`;

  const shiftY = ancestorTransform ? -scrollY : 0;
  const fixTf = `translate3d(0, ${shiftY}px, 0)`;
  vpTopbarEl.style.transform = fixTf;
  vpRailEl.style.transform = `translate3d(0, calc(-50% + ${shiftY}px), 0)`;
  vpBottombarEl.style.transform = fixTf;
  vpFabEl.style.transform = fixTf;
}

function renderHero() {
  const ev = evaluateHero(heroState);
  latestEval = ev;

  // 顶眉分数与示范大标实时坐标
  const badge = $("heroScoreBadge");
  badge.textContent = ev.passed === 4 ? "4 / 4 校准达标" : `${ev.passed} / 4 待校准`;
  badge.className = `score-pill ${ev.passed === 4 ? "is-ok" : "is-err"}`;

  titlePinEl.textContent = ev.pillars.containingBlock.ok
    ? `FIXED · Y ${ev.scrollY}px`
    : `UNPINNED · Y ${ev.scrollY}px`;

  // 图例实时读数
  $("legendFixedVal").textContent = `${ev.fixedCount} 件 · 占 ${ev.obstructedPct}%`;
  legendScrollEl.textContent = `Y ${ev.scrollY}px`;
  const ovBtn = $("btnLegendOverlay");
  ovBtn.setAttribute("aria-pressed", String(heroState.overlayOpen));
  ovBtn.textContent = heroState.overlayOpen ? "收起覆盖层" : "展开预览";

  // 视口形态与文档位移（仅平移子项，不触发回流且保持 z-index:20 促销卡真实穿透层叠）
  const vpFrame = $("vpFrame");
  vpFrame.classList.toggle("is-mobile-sim", heroState.viewportMode === "mobile");

  const vpScreen = $("vpScreen");
  vpScreen.classList.toggle("has-rail-wide", heroState.sideRail === "wide");
  vpScreen.classList.toggle("has-rail-slim", heroState.sideRail === "slim");

  vpDocEl.style.paddingTop = `${ev.docPaddingTop}px`;

  // 四个固定部件：直接通过 --fixed-z 与正文 z:20 卡片竞争层叠；外层带 transform 时一起随 scrollY 滚走
  const zVal = heroState.fixedZ === 1 ? 1 : 100;
  vpScreen.style.setProperty("--fixed-z", String(zVal));

  // 顶部导航栏
  vpTopbarEl.hidden = heroState.topBar === "off";
  vpTopbarEl.classList.toggle("is-bloated", heroState.topBar === "bloated");

  // 首行遮挡红虚线（紧贴顶栏底边，绝不盖脏顶栏文字）
  const showOverlap = ev.firstCardOverlapPx > 0 && ev.scrollY < 40 && !heroState.ancestorTransform;
  vpOverlapBandEl.hidden = !showOverlap;
  if (showOverlap) {
    vpOverlapBandEl.style.top = `${ev.topH + 8}px`;
    $("vpOverlapLabel").textContent = `↑ 首行被顶栏截断 ${ev.firstCardOverlapPx}px`;
  }

  // 左侧工具轨
  vpRailEl.hidden = heroState.sideRail === "off";
  vpRailEl.classList.toggle("is-wide", heroState.sideRail === "wide");

  // 底部工具栏
  vpBottombarEl.hidden = heroState.bottomBar === "off";
  vpBottombarEl.classList.toggle("is-bloated", heroState.bottomBar === "bloated");

  // 右下悬浮球（有底栏时自动抬高避让）
  vpFabEl.hidden = heroState.fab === "off";
  vpFabEl.classList.toggle("is-large", heroState.fab === "large");
  const fabBaseBottom = ev.bottomH > 0 ? ev.bottomH + 14 : 16;
  vpFabEl.style.bottom = `${fabBaseBottom}px`;

  applyScrollTransform(ev.scrollY, ev.dims.maxScroll, heroState.ancestorTransform);

  // 正文 z:20 促销横幅预警
  const promo = $("vpPromo");
  promo.classList.toggle("is-invading", !ev.pillars.stacking.ok);
  $("vpPromoText").textContent = !ev.pillars.stacking.ok
    ? "固定层 z-index 仅 1，滚过时我直接反盖导航栏！"
    : `固定层 z-index: ${heroState.fixedZ} 稳压我，导航可正常点击。`;

  // 锚点高亮
  for (const id of ["sec1", "sec2", "sec3"]) {
    const card = $(`vp${id[0].toUpperCase()}${id.slice(1)}`);
    if (card) card.classList.toggle("is-anchor-hit", heroState.activeAnchor === id);
  }
  document.querySelectorAll(".vp-nav-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.anchor === heroState.activeAnchor);
  });

  // 覆盖层
  $("vpOverlaySheet").hidden = !heroState.overlayOpen;

  // 滑轨读数与 ARIA
  $("scrubReadout").textContent = `scrollY ${ev.scrollY} / ${ev.dims.maxScroll}px`;
  const track = $("scrubTrack");
  track.setAttribute("aria-valuemax", String(ev.dims.maxScroll));
  track.setAttribute("aria-valuenow", String(ev.scrollY));

  // 右翼纵深仪标题读数
  const depthTag = $("depthVisibleTag");
  depthTag.textContent = `可视净区 ${ev.visiblePct}%`;
  depthTag.classList.toggle("is-ok", ev.pillars.budget.ok);

  // 同步所有控槽按钮高亮
  document.querySelectorAll("[data-hero-key]").forEach((btn) => {
    const key = btn.dataset.heroKey;
    const raw = btn.dataset.heroVal;
    let val = raw;
    if (key === "fixedZ") val = Number(raw);
    if (key === "ancestorTransform") val = raw === "true";
    const active = heroState[key] === val;
    btn.classList.toggle("is-active", active);
    const isBadOpt =
      (key === "topBar" && raw === "bloated") ||
      (key === "sideRail" && raw === "wide") ||
      (key === "bottomBar" && raw === "bloated") ||
      (key === "fab" && raw === "large") ||
      (key === "reserve" && raw !== "matched") ||
      (key === "fixedZ" && raw === "1") ||
      (key === "ancestorTransform" && raw === "true");
    btn.classList.toggle("is-bad-opt", active && isBadOpt);
    btn.setAttribute("aria-pressed", String(active));
  });

  // 白话诊单
  const diagPanel = $("diagPanel");
  diagPanel.classList.toggle("is-ok", ev.diag.level === "ok");
  const diagTag = $("diagTag");
  diagTag.textContent = ev.diag.tag;
  diagTag.className = `diag-badge ${ev.diag.level === "ok" ? "is-ok" : "is-err"}`;
  $("diagTitle").textContent = ev.diag.title;
  $("diagBody").textContent = ev.diag.body;
  $("diagAction").textContent = ev.diag.action;

  // 四项验收柱
  const setPillar = (elId, p) => {
    const el = $(elId);
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-err", !p.ok);
    el.querySelector(".pillar-v").textContent = p.status;
  };
  setPillar("pillarBudget", ev.pillars.budget);
  setPillar("pillarClearance", ev.pillars.clearance);
  setPillar("pillarStacking", ev.pillars.stacking);
  setPillar("pillarContaining", ev.pillars.containingBlock);

  // 实时 CSS 代码窗
  $("heroCssCode").textContent = ev.cssCode;

  // 重绘两块 Canvas
  scrubCtl.draw();
  depthCtl.draw();
}

// 绑定左/右翼分段按钮
document.querySelectorAll("[data-hero-key]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.heroKey;
    const raw = btn.dataset.heroVal;
    if (key === "fixedZ") heroState[key] = Number(raw);
    else if (key === "ancestorTransform") heroState[key] = raw === "true";
    else heroState[key] = raw;
    if (key === "viewportMode") {
      const maxS = evaluateHero(heroState).dims.maxScroll;
      heroState.scrollY = Math.min(heroState.scrollY, maxS);
    }
    renderHero();
  });
});

// 锚点点击：真实模拟 scroll-padding-top（无让位时章节标题会被顶栏吞掉！）
document.querySelectorAll("[data-anchor]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const anchor = btn.dataset.anchor;
    heroState.activeAnchor = anchor;
    const ev = evaluateHero(heroState);
    const cardDocTop = ev.docPaddingTop + (ANCHOR_OFFSETS[anchor] ?? 0);
    // 浏览器锚点滚到 cardDocTop - scrollPaddingTop
    const targetY = Math.max(0, Math.min(ev.dims.maxScroll, cardDocTop - ev.scrollPaddingTop));
    heroState.scrollY = targetY;
    renderHero();
  });
});

// 覆盖层开关
function toggleOverlay(force) {
  heroState.overlayOpen = typeof force === "boolean" ? force : !heroState.overlayOpen;
  renderHero();
}
$("btnLegendOverlay").addEventListener("click", () => toggleOverlay());
$("vpFab").addEventListener("click", () => toggleOverlay(true));
$("btnCloseVpOverlay").addEventListener("click", () => toggleOverlay(false));

// 复原 / 合规解
$("btnHeroReset").addEventListener("click", () => {
  Object.assign(heroState, createHeroState("broken"));
  renderHero();
});
$("btnHeroClean").addEventListener("click", () => {
  Object.assign(heroState, createHeroState("clean"));
  renderHero();
});

// 水平滚页滑轨（鼠标、触屏、键盘全支持，rAF 合批 + 零强制回流，慢手机软件渲染亦稳 60 帧）
const scrubTrack = $("scrubTrack");
let scrubDragging = false;
let scrubRectCache = null;
let scrubRaf = 0;
let pendingScrollY = null;

function applyScrollFast() {
  scrubRaf = 0;
  if (pendingScrollY === null) return;
  heroState.scrollY = pendingScrollY;
  pendingScrollY = null;
  latestEval.scrollY = heroState.scrollY;

  applyScrollTransform(heroState.scrollY, latestEval.dims.maxScroll, heroState.ancestorTransform);

  const showOverlap = latestEval.firstCardOverlapPx > 0 && heroState.scrollY < 40 && !heroState.ancestorTransform;
  if (vpOverlapBandEl.hidden === showOverlap) vpOverlapBandEl.hidden = !showOverlap;

  titlePinEl.textContent = latestEval.pillars.containingBlock.ok
    ? `FIXED · Y ${heroState.scrollY}px`
    : `UNPINNED · Y ${heroState.scrollY}px`;
  legendScrollEl.textContent = `Y ${heroState.scrollY}px`;
  scrubReadoutEl.textContent = `scrollY ${heroState.scrollY} / ${latestEval.dims.maxScroll}px`;
  scrubTrack.setAttribute("aria-valuenow", String(heroState.scrollY));

  scrubCtl.draw();
  depthCtl.draw();
}

function scrubFromClientX(clientX) {
  if (!scrubRectCache) scrubRectCache = scrubTrack.getBoundingClientRect();
  const rect = scrubRectCache;
  const pad = 22;
  const usable = Math.max(1, rect.width - pad * 2);
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left - pad) / usable));
  const maxS = latestEval.dims.maxScroll;
  const nextY = Math.round(ratio * maxS);
  if (nextY === pendingScrollY || (pendingScrollY === null && nextY === heroState.scrollY)) return;
  pendingScrollY = nextY;
  heroState.activeAnchor = null;
  if (!scrubRaf) scrubRaf = requestAnimationFrame(applyScrollFast);
}

scrubTrack.addEventListener("pointerdown", (e) => {
  scrubDragging = true;
  scrubRectCache = scrubTrack.getBoundingClientRect();
  if (scrubTrack.setPointerCapture) {
    try { scrubTrack.setPointerCapture(e.pointerId); } catch {}
  }
  scrubFromClientX(e.clientX);
});

scrubTrack.addEventListener("pointermove", (e) => {
  if (!scrubDragging) return;
  scrubFromClientX(e.clientX);
});

const endScrub = () => {
  scrubDragging = false;
  scrubRectCache = null;
};
scrubTrack.addEventListener("pointerup", endScrub);
scrubTrack.addEventListener("pointercancel", endScrub);

// 兼容 perf.mjs 直接派发原始 touch 事件（避免与 pointer 事件重复）
scrubTrack.addEventListener("touchstart", (e) => {
  scrubRectCache = scrubTrack.getBoundingClientRect();
  if (e.touches[0]) scrubFromClientX(e.touches[0].clientX);
}, { passive: true });
scrubTrack.addEventListener("touchmove", (e) => {
  if (e.touches[0]) scrubFromClientX(e.touches[0].clientX);
}, { passive: true });
scrubTrack.addEventListener("touchend", endScrub, { passive: true });

scrubTrack.addEventListener("keydown", (e) => {
  const maxS = evaluateHero(heroState).dims.maxScroll;
  const step = e.shiftKey ? 80 : 28;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    heroState.scrollY = Math.min(maxS, heroState.scrollY + step);
    renderHero();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    heroState.scrollY = Math.max(0, heroState.scrollY - step);
    renderHero();
  }
});

// 模拟视口内直接鼠标滚轮滚页
$("vpScreen").addEventListener("wheel", (e) => {
  const maxS = evaluateHero(heroState).dims.maxScroll;
  const next = Math.max(0, Math.min(maxS, heroState.scrollY + Math.round(e.deltaY * 0.45)));
  if (next !== heroState.scrollY) {
    e.preventDefault();
    heroState.scrollY = next;
    heroState.activeAnchor = null;
    renderHero();
  }
}, { passive: false });

// =========================================================================
// 2. SECTION 01 · 四定位同卷对照滑轨
// =========================================================================
const raceGrid = $("raceGrid");
raceGrid.innerHTML = POSITION_MODES.map((m) => `
  <div class="race-col ${m.id === "fixed" ? "is-fixed-star" : ""}">
    <div class="race-col-head">
      <span class="race-col-code">position: ${m.name}</span>
      <span class="race-col-tag">${m.tag}</span>
    </div>
    <div class="race-window">
      <div class="race-paper" data-race-paper="${m.id}">
        <div class="race-blk">段落 01 · 导语块</div>
        ${m.id === "static" ? `<div class="race-target"><span>目标块</span><span>流内</span></div>` : ""}
        ${m.id === "relative" ? `<div class="race-ghost">原占位保留<div class="race-target is-rel"><span>目标块</span><span>+14px</span></div></div>` : ""}
        ${m.id === "absolute" ? `<div class="race-target is-abs"><span>目标块</span><span>钉文档</span></div>` : ""}
        <div class="race-blk">段落 02 · 正文块${m.leavesFlow ? "（已顶上）" : ""}</div>
        <div class="race-blk">段落 03 · 细则块</div>
        <div class="race-blk">段落 04 · 延伸块</div>
        <div class="race-blk">段落 05 · 结语块</div>
      </div>
      ${m.id === "fixed" ? `<div class="race-target is-fix"><span>目标块</span><span>锁视口</span></div>` : ""}
    </div>
    <p class="race-col-note">${m.note}</p>
  </div>
`).join("");

const raceSlider = $("raceSlider");
function updateRace(val) {
  const y = Number(val);
  raceSlider.value = String(y);
  $("raceScrollVal").textContent = `scrollY = ${y}px`;
  raceGrid.querySelectorAll("[data-race-paper]").forEach((p) => {
    p.style.transform = `translate3d(0, ${-y}px, 0)`;
  });
  const ta = $("raceTakeaway");
  if (y < 20) {
    ta.textContent = "当前在页面顶部（0px）：注意 absolute 与 fixed 两栏里，段落 02 已经顶上来占掉原位置——两者都脱离了文档流。";
  } else if (y < 85) {
    ta.textContent = `已向下滚 ${y}px：static、relative 和 absolute 的目标块都在随纸带往上漂移，只有 fixed 目标块牢牢钉在视口顶边。`;
  } else {
    ta.textContent = `深滚到 ${y}px：前三种定位的目标块早已滚出视野，唯独 fixed 依然停在原处——这就是它和 233 绝对定位最本质的分水岭。`;
  }
}

raceSlider.addEventListener("input", () => updateRace(raceSlider.value));
$("btnRaceMid").addEventListener("click", () => updateRace(90));
$("btnRaceTop").addEventListener("click", () => updateRace(0));
updateRace(0);

// =========================================================================
// 3. SECTION 02 · 四个最隐蔽的翻车坑透视台
// =========================================================================
let activeTrapId = "transform";
let trapFixed = false;
let trapActStep = 0;

function renderTrap() {
  const item = TRAPS_DATA.find((t) => t.id === activeTrapId) || TRAPS_DATA[0];
  document.querySelectorAll(".trap-tab").forEach((tab) => {
    const on = tab.dataset.trap === activeTrapId;
    tab.classList.toggle("is-active", on);
    tab.setAttribute("aria-selected", String(on));
  });
  $("btnTrapBroken").classList.toggle("is-active", !trapFixed);
  $("btnTrapFixed").classList.toggle("is-active", trapFixed);

  const actLabels = {
    transform: trapActStep ? "回到顶部" : "模拟滚页",
    focus: "模拟按 Shift+Tab",
    safearea: trapActStep ? "收回地址栏" : "展开系统横条",
    keyboard: trapActStep ? "收起软键盘" : "弹出软键盘",
  };
  $("btnTrapAct").textContent = actLabels[activeTrapId];

  $("trapSpec").textContent = item.spec;
  const badge = $("trapBadge");
  badge.textContent = trapFixed ? `${item.badge} · 已修复` : `${item.badge} · 故障态`;
  badge.classList.toggle("is-ok", trapFixed);
  $("trapTitle").textContent = item.title;
  $("trapDesc").textContent = trapFixed ? item.fixedSummary : item.brokenSummary;
  $("trapCode").textContent = trapFixed ? item.fixedCss : item.brokenCss;

  const stage = $("trapStage");
  const statusOut = $("trapStatusOut");
  let statusMsg = "";
  let statusErr = false;

  if (activeTrapId === "transform") {
    const sc = trapActStep ? 76 : 0;
    const headShift = !trapFixed ? -sc : 0;
    stage.innerHTML = `
      <div class="tsim-phone">
        <div class="tsim-head ${!trapFixed && sc > 0 ? "is-err" : ""}" style="transform:translateY(${headShift}px)">
          <span>固定顶栏 (.topbar)</span>
          <span>${!trapFixed ? "被 transform 劫持" : "锁死视口"}</span>
        </div>
        <div class="tsim-doc" style="padding-top:54px;transform:translateY(${-sc}px)">
          <div class="tsim-item">.app-shell { transform: ${trapFixed ? "none" : "translateZ(0)"}; }</div>
          <div class="tsim-item">正文第 1 节：向下滚动 ${sc}px</div>
          <div class="tsim-item">正文第 2 节：观察上方青绿顶栏</div>
          <div class="tsim-item">正文第 3 节：是否还留在视口顶边</div>
        </div>
      </div>
    `;
    statusErr = !trapFixed && sc > 0;
    statusMsg = sc === 0
      ? "点击「模拟滚页」，对比外层带 transform 时顶栏会不会跟着滚跑。"
      : (!trapFixed ? "滚出视野！顶栏成了 .app-shell 的随滚子块。" : "纹丝不动！包含块已归还视口。");
  } else if (activeTrapId === "focus") {
    const idx = trapActStep % 3;
    const scrollOffset = trapFixed ? idx * 42 : idx * 42 + 44;
    stage.innerHTML = `
      <div class="tsim-phone">
        <div class="tsim-head"><span>固定顶栏 44px</span><span>${trapFixed ? "scroll-padding: 56px" : "scroll-padding: 0"}</span></div>
        <div class="tsim-doc" style="padding-top:52px;transform:translateY(${-scrollOffset}px)">
          <div class="tsim-item ${idx === 0 ? "is-focused" : ""}">焦点项 #1 · 章节锚点标题</div>
          <div class="tsim-item ${idx === 1 ? "is-focused" : ""}">焦点项 #2 · 邮箱输入框</div>
          <div class="tsim-item ${idx === 2 ? "is-focused" : ""}">焦点项 #3 · 提交按钮</div>
          <div class="tsim-item">正文后续段落</div>
        </div>
      </div>
    `;
    statusErr = !trapFixed;
    statusMsg = !trapFixed
      ? `WCAG 2.4.11 失败：焦点项 #${idx + 1} 已滚到 y=0，被 44px 顶栏完全盖住！`
      : `通过 AA 级：scroll-padding-top 让焦点项 #${idx + 1} 稳停在顶栏下方。`;
  } else if (activeTrapId === "safearea") {
    const padB = trapFixed ? 24 : 8;
    stage.innerHTML = `
      <div class="tsim-phone">
        <div class="tsim-head"><span>全面屏手机视口</span><span>${trapFixed ? "100dvh + env()" : "100vh 硬写"}</span></div>
        <div class="tsim-doc" style="padding-top:54px;">
          <div class="tsim-item">全面屏底部存在系统手势横条（safe-area-inset-bottom）</div>
          <div class="tsim-item">${trapFixed ? "底栏已补足安全区下内边距，图标清晰可点。" : "底栏紧贴 bottom: 0，按钮文字与系统横条撞车！"}</div>
        </div>
        <div class="tsim-dock" style="padding-bottom:${padB}px;background:${trapFixed ? "#157C79" : "#8B2820"}">
          首页 · 分类 · 订单 · 我的
        </div>
        <div class="tsim-homebar" aria-hidden="true"></div>
      </div>
    `;
    statusErr = !trapFixed;
    statusMsg = !trapFixed
      ? "故障态：底栏紧贴 bottom: 0，触控区被底部手势横条压住。"
      : "修复态：用 100dvh 与 padding-bottom: env(safe-area-inset-bottom) 完整避让安全区。";
  } else {
    const kbdOn = trapActStep === 1;
    const hideDock = trapFixed && kbdOn;
    stage.innerHTML = `
      <div class="tsim-phone">
        <div class="tsim-head"><span>顶部导航 44px</span><span>${kbdOn ? "键盘已弹出" : "常规态"}</span></div>
        <div class="tsim-doc" style="padding-top:54px;">
          <div class="tsim-item is-focused">正在输入：收件地址与备注…</div>
          <div class="tsim-item">下一栏：联系电话</div>
        </div>
        ${!hideDock ? `<div class="tsim-dock" style="bottom:${kbdOn ? 112 : 0}px;background:${kbdOn && !trapFixed ? "#8B2820" : "#157C79"}">固定底部提交栏 44px</div>` : ""}
        ${kbdOn ? `<div class="tsim-kbd">系统虚拟键盘（占用 ~44% 屏高）</div>` : ""}
      </div>
    `;
    statusErr = kbdOn && !trapFixed;
    statusMsg = !kbdOn
      ? "点击「弹出软键盘」，观察矮视口下底栏如何挤压输入区。"
      : (!trapFixed ? "三面夹击！顶栏 + 底栏 + 键盘把输入窗压成一条窄缝。" : "矮屏自动降级释放固定底栏，输入区视野完整保留。");
  }
  statusOut.textContent = statusMsg;
  statusOut.className = `trap-status-out ${statusErr ? "is-err" : ""}`;
}

document.querySelectorAll(".trap-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeTrapId = tab.dataset.trap;
    trapFixed = false;
    trapActStep = 1;
    renderTrap();
  });
});
$("btnTrapBroken").addEventListener("click", () => { trapFixed = false; renderTrap(); });
$("btnTrapFixed").addEventListener("click", () => { trapFixed = true; renderTrap(); });
$("btnTrapAct").addEventListener("click", () => {
  trapActStep = activeTrapId === "focus" ? trapActStep + 1 : (trapActStep ? 0 : 1);
  renderTrap();
});
renderTrap();

// =========================================================================
// 4. SECTION 03 · 视口占用预算秤
// =========================================================================
const budgetState = {
  device: "phonePort",
  topOn: true, topH: 60,
  bottomOn: true, bottomH: 56,
  sideOn: false, sideW: 64,
  bannerOn: true,
  fabOn: true,
};

function renderBudget() {
  const ev = evaluateBudget(budgetState);
  document.querySelectorAll("[data-budget-dev]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.budgetDev === budgetState.device);
  });
  $("valTop").textContent = `${budgetState.topH}px`;
  $("valBot").textContent = `${budgetState.bottomH}px`;
  $("valSide").textContent = `${budgetState.sideW}px`;

  // 按设备真实宽高比等比缩放，圆与矩形绝不拉伸变形
  const maxW = 280;
  const maxH = 190;
  const scale = Math.min(maxW / ev.dev.w, maxH / ev.dev.h);
  const sw = Math.round(ev.dev.w * scale);
  const sh = Math.round(ev.dev.h * scale);

  const scr = $("budgetScreen");
  scr.style.width = `${sw}px`;
  scr.style.height = `${sh}px`;

  const tH = Math.round(ev.topH * scale);
  const bH = Math.round(ev.botH * scale);
  const bnH = Math.round(ev.bannerH * scale);
  const sW = Math.round(ev.sideW * scale);
  const fabPx = Math.max(10, Math.round(ev.fabD * scale));

  const freeTop = tH + bnH;
  const freeH = Math.max(0, sh - freeTop - bH);
  const freeW = Math.max(0, sw - sW);

  scr.innerHTML = `
    ${tH > 0 ? `<div class="budget-piece" style="top:0;left:0;right:0;height:${tH}px"></div>` : ""}
    ${bnH > 0 ? `<div class="budget-piece budget-piece-banner" style="top:${tH}px;left:0;right:0;height:${bnH}px"></div>` : ""}
    ${sW > 0 ? `<div class="budget-piece" style="top:${freeTop}px;left:0;bottom:${bH}px;width:${sW}px"></div>` : ""}
    ${bH > 0 ? `<div class="budget-piece" style="bottom:0;left:0;right:0;height:${bH}px"></div>` : ""}
    ${ev.fabD > 0 ? `<div class="budget-piece budget-piece-fab" style="right:6px;bottom:${bH + 6}px;width:${fabPx}px;height:${fabPx}px"></div>` : ""}
    <div class="budget-free-box" style="top:${freeTop}px;left:${sW}px;width:${freeW}px;height:${freeH}px">
      ${freeH >= 24 && freeW >= 48 ? `${ev.freePct}%` : ""}
    </div>
  `;

  const rd = $("budgetReadout");
  rd.className = `budget-readout is-${ev.tone}`;
  rd.innerHTML = `<strong>${ev.verdict} · 净可视区 ${ev.freePct}%（固定层占 ${ev.usedPct}%）</strong><br>${ev.detail}`;
}

document.querySelectorAll("[data-budget-dev]").forEach((b) => {
  b.addEventListener("click", () => {
    budgetState.device = b.dataset.budgetDev;
    renderBudget();
  });
});
$("chkTop").addEventListener("change", (e) => { budgetState.topOn = e.target.checked; renderBudget(); });
$("rngTop").addEventListener("input", (e) => { budgetState.topH = Number(e.target.value); renderBudget(); });
$("chkBot").addEventListener("change", (e) => { budgetState.bottomOn = e.target.checked; renderBudget(); });
$("rngBot").addEventListener("input", (e) => { budgetState.bottomH = Number(e.target.value); renderBudget(); });
$("chkSide").addEventListener("change", (e) => { budgetState.sideOn = e.target.checked; renderBudget(); });
$("rngSide").addEventListener("input", (e) => { budgetState.sideW = Number(e.target.value); renderBudget(); });
$("chkBanner").addEventListener("change", (e) => { budgetState.bannerOn = e.target.checked; renderBudget(); });
$("chkFab").addEventListener("change", (e) => { budgetState.fabOn = e.target.checked; renderBudget(); });
renderBudget();

// =========================================================================
// 5. SECTION 04 · 历史时期切换
// =========================================================================
let activeEraId = "1998";
function renderEra() {
  const era = HISTORY_ERAS.find((e) => e.id === activeEraId) || HISTORY_ERAS[0];
  document.querySelectorAll(".era-btn").forEach((b) => {
    const on = b.dataset.era === activeEraId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("eraYear").textContent = era.year;
  $("eraTitle").textContent = era.title;
  $("eraDesc").textContent = era.desc;
  $("eraSource").textContent = `出处核实：${era.source}`;
  $("eraSimCap").textContent = era.simCaption;

  const box = $("eraSimBox");
  if (era.behavior === "spec") {
    box.innerHTML = `
      <div class="era-mini-bar">Section 9.6.1 · Fixed positioning</div>
      <div class="era-mini-row"><span>连续媒体（屏幕）</span><span>不随页面滚动移动</span></div>
      <div class="era-mini-row"><span>分页媒体（打印）</span><span>每一页重复出现</span></div>
    `;
  } else if (era.behavior === "ie6") {
    box.innerHTML = `
      <div class="era-mini-bar is-jitter">IE 6：top: expression(documentElement.scrollTop)</div>
      <div class="era-mini-row"><span>滚动中</span><span>随正文滑走后再抖动回弹</span></div>
      <div class="era-mini-row"><span>IE 7 (2006)</span><span>标准模式下首次原生锁定</span></div>
    `;
  } else if (era.behavior === "ios4") {
    box.innerHTML = `
      <div class="era-mini-bar is-jitter">iOS 4 Safari：惯性滚完再跳回底边</div>
      <div class="era-mini-row"><span>iOS 5 (2011)</span><span>Mobile Safari 首次原生支持</span></div>
      <div class="era-mini-row"><span>现代 GPU 合成</span><span>固定层与正文独立合批</span></div>
    `;
  } else {
    box.innerHTML = `
      <div class="era-mini-bar">WCAG 2.2 · 2.4.11 Focus Not Obscured (AA)</div>
      <div class="era-mini-row"><span>无 scroll-padding</span><span>F110：顶栏吞没焦点框</span></div>
      <div class="era-mini-row"><span>scroll-padding-top</span><span>焦点稳停在顶栏下方</span></div>
    `;
  }
}

document.querySelectorAll(".era-btn").forEach((b) => {
  b.addEventListener("click", () => { activeEraId = b.dataset.era; renderEra(); });
});
renderEra();

// =========================================================================
// 6. SECTION 05 · 6 场景决策矩阵
// =========================================================================
let activeScId = SCENARIOS[0].id;
const scGrid = $("scenarioGrid");
scGrid.innerHTML = SCENARIOS.map((s) => `
  <button type="button" class="sc-card" data-sc="${s.id}" role="listitem">
    <span class="sc-verdict is-${s.verdictTone}">${s.verdict}</span>
    <span class="sc-title">${s.title}</span>
    <span class="sc-tag">${s.posterTag}</span>
  </button>
`).join("");

function renderScenario() {
  const s = SCENARIOS.find((x) => x.id === activeScId) || SCENARIOS[0];
  scGrid.querySelectorAll(".sc-card").forEach((c) => {
    const on = c.dataset.sc === activeScId;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", String(on));
  });
  $("scenarioDetail").innerHTML = `
    <h3 class="sc-detail-h">${s.title} → ${s.verdict}</h3>
    <p class="sc-detail-p">${s.summary}</p>
    <p class="sc-detail-tip">实践建议：${s.tip}</p>
  `;
}

scGrid.querySelectorAll(".sc-card").forEach((c) => {
  c.addEventListener("click", () => { activeScId = c.dataset.sc; renderScenario(); });
});
renderScenario();

// =========================================================================
// 7. SECTION 06 · 四选一单变量诊断练习
// =========================================================================
let pickedDrill = null;
const drillGrid = $("drillGrid");
drillGrid.innerHTML = DRILL_OPTIONS.map((o) => `
  <button type="button" class="drill-opt" data-drill="${o.id}">
    <div class="drill-opt-head">
      <span>${o.label}</span>
      <span class="drill-opt-state" id="drillState${o.id}">选择</span>
    </div>
    <pre class="drill-opt-code">.page { ${o.shellCss} }
.nav  { ${o.navCss} }
main  { ${o.mainCss} }
html  { ${o.htmlCss} }</pre>
  </button>
`).join("");

function renderDrill() {
  drillGrid.querySelectorAll(".drill-opt").forEach((b) => {
    const id = b.dataset.drill;
    const opt = DRILL_OPTIONS.find((x) => x.id === id);
    const picked = pickedDrill === id;
    b.classList.toggle("is-picked-ok", picked && opt.correct);
    b.classList.toggle("is-picked-err", picked && !opt.correct);
    b.setAttribute("aria-pressed", String(picked));
    const st = $(`drillState${id}`);
    st.textContent = picked ? (opt.correct ? "✓ 正确" : "× 翻车") : "选择";
  });

  const res = $("drillResult");
  if (!pickedDrill) return;
  const opt = DRILL_OPTIONS.find((x) => x.id === pickedDrill);
  res.className = `drill-result ${opt.correct ? "is-ok" : "is-err"}`;

  let simHtml = "";
  if (opt.simBug === "hijack") {
    simHtml = `
      <div style="background:#8B2820;padding:4px 8px;border-radius:4px;transform:translateY(-18px)">.nav 随 .page 滚出顶边</div>
      <div style="margin-top:8px;color:#FF8575">外层 transform 抢走了包含块</div>
    `;
  } else if (opt.simBug === "anchorCut") {
    simHtml = `
      <div style="position:absolute;top:0;left:0;right:0;height:36px;background:#157C79;padding:8px 10px;font-weight:700;z-index:5">.nav (56px 顶栏)</div>
      <div style="position:absolute;top:14px;left:10px;right:10px;background:#8B2820;padding:6px 8px;border-radius:4px;z-index:2">#install 标题停在 y=0 被切掉一半！</div>
    `;
  } else if (opt.simBug === "zInvert") {
    simHtml = `
      <div style="position:absolute;top:8px;left:8px;right:8px;height:32px;background:#157C79;padding:6px 10px;z-index:1">.nav (z-index: 1)</div>
      <div style="position:absolute;top:18px;left:22px;right:22px;background:#8B2820;border:1px solid #FF8575;padding:8px 10px;border-radius:6px;z-index:5;font-weight:700">正文状态卡 (z-index: 5) 反压顶栏！</div>
    `;
  } else {
    simHtml = `
      <div style="position:absolute;top:0;left:0;right:0;height:34px;background:#157C79;padding:7px 10px;font-weight:700;z-index:10">.nav (z:100 稳锁视口)</div>
      <div style="position:absolute;top:44px;left:10px;right:10px;background:#0F2A4C;border:1.5px solid #5EEAD4;padding:8px 10px;border-radius:6px;color:#5EEAD4;font-weight:700">#install 停在 64px 处，清晰可读零遮挡</div>
    `;
  }

  res.innerHTML = `
    <div class="drill-res-layout">
      <div>
        <h3 class="drill-res-title">${opt.correct ? "判断准确：方案 C 全程不翻车" : `不对：${opt.label} 会在这里翻车`}</h3>
        <p class="drill-res-body">${opt.reason}</p>
      </div>
      <div class="drill-sim-mini" aria-label="所选方案后果示意">${simHtml}</div>
    </div>
  `;
}

drillGrid.querySelectorAll(".drill-opt").forEach((b) => {
  b.addEventListener("click", () => { pickedDrill = b.dataset.drill; renderDrill(); });
});

// =========================================================================
// 8. SECTION 07 · 原海报灯箱（复用 #poster src，支持缩放、拖拽、Esc 关闭）
// =========================================================================
const lb = $("posterLightbox");
const lbImg = $("lbImg");
const lbStage = $("lbStage");
let lbScale = 1, lbX = 0, lbY = 0, lbDrag = false, lbStartX = 0, lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate3d(${lbX}px, ${lbY}px, 0) scale(${lbScale})`;
  $("lbScale").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("poster").src;
  lbScale = 1; lbX = 0; lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("lbClose").focus();
}

function closeLightbox() {
  lb.hidden = true;
  $("btnOpenPoster").focus();
}

$("btnOpenPoster").addEventListener("click", openLightbox);
$("lbClose").addEventListener("click", closeLightbox);
$("lbZoomIn").addEventListener("click", () => { lbScale = Math.min(3, +(lbScale + 0.25).toFixed(2)); applyLbTransform(); });
$("lbZoomOut").addEventListener("click", () => { lbScale = Math.max(0.6, +(lbScale - 0.25).toFixed(2)); applyLbTransform(); });
$("lbReset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  if (lbStage.setPointerCapture) {
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  }
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
const endLb = () => { lbDrag = false; };
lbStage.addEventListener("pointerup", endLb);
lbStage.addEventListener("pointercancel", endLb);
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.6, Math.min(3, +(lbScale + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// 窗口尺寸变化时同步两块 Canvas 尺寸
window.addEventListener("resize", () => {
  depthCtl.resize();
  scrubCtl.resize();
});

// 首次渲染（开场停在 0 / 4 翻车态）
renderHero();
