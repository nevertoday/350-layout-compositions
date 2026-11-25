// 253 悬浮层 FLOATING LAYER · 主交互控制器
import { loop } from "../../lib/stage.js";
import { analyze, clamp, contrastRatio, initialState, LAYERS_META, PRESETS, shadowTokens } from "./model.js";
import { createHeroStage } from "./stage.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== HERO：单真源状态与 3D 画布联动 ====================
const state = initialState();
const heroCanvas = $("#hero-canvas");
let redrawHero = () => {};

function promoteLayer(id) {
  state.order = [...state.order.filter((x) => x !== id), id];
  state.selected = id;
}

function renderIsoSvg(diag) {
  const host = $("#iso-planes");
  if (!host) return;
  const order = state.order;
  const gapBase = 18 + Math.round((state.elevation / 36) * 14);
  const ys = [92, 92 - Math.round(gapBase * 0.85), 92 - Math.round(gapBase * 1.85)];

  const fills = {
    bg: { fill: "#5D4774", stroke: "#9B83B8" },
    secondary: { fill: "#A8C8BB", stroke: "#CBE2D8" },
    focus: { fill: "#ECE6E0", stroke: diag.ok ? "#FFFFFF" : "#EC72A2" },
  };

  let markup = "";
  order.forEach((id, idx) => {
    const cy = ys[idx];
    const f = fills[id];
    const pts = `66,${cy - 22} 118,${cy} 66,${cy + 22} 14,${cy}`;
    markup += `<polygon points="${pts}" fill="${f.fill}" stroke="${f.stroke}" stroke-width="1.4" />`;
    if (id === "bg") {
      markup += `<line x1="40" y1="${cy - 11}" x2="92" y2="${cy + 11}" stroke="rgba(226,212,244,0.28)" stroke-width="0.9"/>`;
      markup += `<line x1="92" y1="${cy - 11}" x2="40" y2="${cy + 11}" stroke="rgba(226,212,244,0.28)" stroke-width="0.9"/>`;
    }
  });
  host.innerHTML = markup;

  // 高亮当前最顶层对应的图例按钮
  const topId = order[2];
  $$(".iso-btn").forEach((btn) => {
    btn.classList.toggle("is-top", btn.dataset.promote === topId);
  });
}

function syncHeroUI() {
  const diag = analyze(state);

  // 1. 标题自示范微浮与顶部状态药丸
  $("#hero-h1").classList.toggle("is-lifted", diag.zIndexOrder.focus === 2 && state.elevation >= 8);
  const pill = $("#hero-status-pill");
  pill.textContent = diag.modeName;
  pill.classList.toggle("is-ok", diag.ok);
  pill.classList.toggle("is-warn", !diag.ok);

  // 2. 原海报三点实时探针
  const map = [
    ["#probe-overlay", "#probe-overlay-badge", diag.probes.overlay],
    ["#probe-emphasis", "#probe-emphasis-badge", diag.probes.emphasis],
    ["#probe-support", "#probe-support-badge", diag.probes.support],
  ];
  for (const [rowSel, badgeSel, probe] of map) {
    $(rowSel).classList.toggle("is-ok", probe.ok);
    $(badgeSel).textContent = probe.text;
  }

  // 3. 左下活体轴测三片栈
  renderIsoSvg(diag);

  // 4. 控件数值同步
  $("#inp-elev").value = String(state.elevation);
  $("#val-elev").textContent = `${state.elevation}dp`;
  $("#inp-scrim").value = String(state.scrim);
  $("#val-scrim").textContent = `${state.scrim}%`;
  $("#inp-shift").value = String(Math.round(state.focusShift * 100));
  $("#val-shift").textContent = `${state.focusShift > 0 ? "+" : ""}${Math.round(state.focusShift * 100)}%`;

  const focusTop = state.order[2] === "focus";
  $("#btn-order-toggle").textContent = focusTop ? "压回底层试错" : "焦点置顶";
  const secCompete = state.secElevation >= 16;
  $("#btn-sec-compete").setAttribute("aria-pressed", String(secCompete));
  $("#btn-sec-compete").textContent = secCompete ? "次层争焦：开 (20dp)" : "次层争焦 20dp";

  $$("[data-scene]").forEach((b) => b.classList.toggle("is-active", b.dataset.scene === state.scene));
  $("#btn-view-flat").classList.toggle("is-active", state.peel <= 4);
  $("#btn-view-peel").classList.toggle("is-active", state.peel >= 36);

  // 5. 单真源白话诊单与实时 CSS
  const box = $("#diag-box");
  box.classList.toggle("is-ok", diag.ok);
  $("#diag-tag").textContent = diag.ok ? "层级成立" : `${diag.faultCount} 处待修`;
  $("#diag-title").textContent = diag.title;
  $("#diag-why").textContent = diag.why;
  $("#diag-hint").textContent = diag.hint;

  const fixBtn = $("#btn-fix");
  if (diag.fixAction) {
    fixBtn.hidden = false;
    fixBtn.textContent = diag.fixLabel;
    fixBtn.dataset.action = diag.fixAction;
  } else {
    fixBtn.hidden = true;
  }

  $("#css-code").textContent = diag.cssCode;
  redrawHero();
}

function handleHeroAction(act) {
  if (act.type === "peel") {
    state.peel = act.value;
    syncHeroUI();
  } else if (act.type === "clickLayer") {
    promoteLayer(act.layer);
    syncHeroUI();
  } else if (act.type === "redraw") {
    redrawHero();
  }
}

const stage = createHeroStage(heroCanvas, () => state, handleHeroAction);
const heroLoop = loop(heroCanvas, (t, dt, meta) => stage.renderFrame(t, dt, meta));
redrawHero = heroLoop.draw;

// 绑定开场所有原生控件
$$("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    syncHeroUI();
  });
});

$("#btn-view-flat").addEventListener("click", () => {
  state.peel = 0;
  syncHeroUI();
});
$("#btn-view-peel").addEventListener("click", () => {
  state.peel = 42;
  syncHeroUI();
});

$("#inp-elev").addEventListener("input", (e) => {
  state.elevation = Number(e.target.value);
  syncHeroUI();
});
$("#inp-scrim").addEventListener("input", (e) => {
  state.scrim = Number(e.target.value);
  syncHeroUI();
});
$("#inp-shift").addEventListener("input", (e) => {
  state.focusShift = Number(e.target.value) / 100;
  syncHeroUI();
});

$("#btn-order-toggle").addEventListener("click", () => {
  if (state.order[2] === "focus") {
    state.order = ["bg", "focus", "secondary"];
  } else {
    state.order = ["bg", "secondary", "focus"];
  }
  syncHeroUI();
});

$("#btn-sec-compete").addEventListener("click", () => {
  state.secElevation = state.secElevation >= 16 ? 4 : 20;
  syncHeroUI();
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    Object.assign(state, p.state, { order: [...p.state.order] });
    syncHeroUI();
  });
});

$$(".iso-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    promoteLayer(btn.dataset.promote);
    syncHeroUI();
  });
});

$("#btn-fix").addEventListener("click", (e) => {
  const action = e.currentTarget.dataset.action;
  if (action === "promoteFocus") state.order = ["bg", "secondary", "focus"];
  else if (action === "calmSecondary") state.secElevation = 6;
  else if (action === "liftFocus") state.elevation = 18;
  else if (action === "easeScrim") state.scrim = 32;
  else if (action === "centerFocus") state.focusShift = 0;
  syncHeroUI();
});

$("#btn-css-toggle").addEventListener("click", (e) => {
  const drawer = $("#css-drawer");
  const open = drawer.hidden;
  drawer.hidden = !open;
  e.currentTarget.setAttribute("aria-expanded", String(open));
});

heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.peel = clamp(state.peel - 6, 0, 52);
    syncHeroUI();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.peel = clamp(state.peel + 6, 0, 52);
    syncHeroUI();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.elevation = clamp(state.elevation + 2, 0, 36);
    syncHeroUI();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.elevation = clamp(state.elevation - 2, 0, 36);
    syncHeroUI();
  }
});

// ==================== 01 · 四通道深度剥离器 ====================
const cueState = { overlap: true, shadow: true, lift: true, scrim: true };
function updateCueLab() {
  const st = $("#cue-stage");
  st.dataset.overlap = cueState.overlap ? "1" : "0";
  st.dataset.shadow = cueState.shadow ? "1" : "0";
  st.dataset.lift = cueState.lift ? "1" : "0";
  st.dataset.scrim = cueState.scrim ? "1" : "0";

  const onCount = Object.values(cueState).filter(Boolean).length;
  const v = $("#cue-verdict");
  if (onCount === 4) {
    v.textContent = "四项深度线索齐备：重叠宣告先后，投影拉出悬空距离，暖白提亮锁定焦点，压暗让背景安静退后。";
  } else if (!cueState.overlap) {
    v.textContent = "关闭「重叠跨界」后，焦点卡与底层退回并排陈列——即便留着阴影，也更像并列卡片而非覆盖式悬浮层。";
  } else if (!cueState.shadow && !cueState.lift) {
    v.textContent = "投影与表面提亮同时缺失：卡片与底层融成同一色块，只剩模糊轮廓，悬浮焦点完全瓦解。";
  } else if (!cueState.shadow) {
    v.textContent = "去掉投影后，卡片虽然靠暖白高反差依然突出，但失去了「离开纸面」的空气距离感，像贴在底上的贴纸。";
  } else if (!cueState.lift) {
    v.textContent = "失去表面提亮与高光边后，在暗梅紫底面上，纯黑投影几乎被吞没——这正是第 04 节「暗底色调海拔」要解决的问题。";
  } else {
    v.textContent = "关掉背景压暗后，底层依然清晰可见：这恰恰是非模态轻浮卡（Popover）的理想状态——靠投影与明度差浮起，却不锁死页面。";
  }
}

$$(".cue-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.cue;
    cueState[key] = !cueState[key];
    btn.classList.toggle("is-on", cueState[key]);
    btn.setAttribute("aria-pressed", String(cueState[key]));
    updateCueLab();
  });
});

// ==================== 02 · 五类悬浮原语迷你沙盒 ====================
const OVERLAY_SPECS = {
  popover: { name: "Popover 锚定浮卡", modal: "非模态（不锁背景）", dp: "8dp · 轻投影无遮罩", exit: "点外部或按 Esc 轻关闭", scrim: false },
  tooltip: { name: "Tooltip 轻提示", modal: "非模态（纯说明）", dp: "4dp · 贴近触发词", exit: "移开指针或失焦即散", scrim: false },
  dropdown: { name: "Dropdown 下拉菜单", modal: "非模态（选完即关）", dp: "8dp · 紧接按钮底沿", exit: "选中一项、点外或 Esc", scrim: false },
  drawer: { name: "Drawer 侧滑抽屉", modal: "半模态（保留一侧语境）", dp: "16dp · 轻遮罩压暗", exit: "点遮罩、关闭钮或 Esc", scrim: true },
  modal: { name: "Modal 模态确认框", modal: "强模态（锁死背景与焦点）", dp: "24dp · 48% 遮罩聚焦", exit: "明确点操作钮或按 Esc", scrim: true },
  toast: { name: "Toast 轻通知", modal: "非模态（不打断操作）", dp: "6dp · 底边悬浮", exit: "数秒后自动退场或点撤销", scrim: false },
};

let activeOverlay = "popover";
function setSandboxOverlay(kind) {
  activeOverlay = kind;
  const app = $("#mini-app");
  app.dataset.active = kind || "none";
  $$(".sb-trigger").forEach((b) => b.classList.toggle("is-active", b.dataset.overlay === kind));

  for (const k of Object.keys(OVERLAY_SPECS)) {
    const el = $(`#ov-${k}`);
    if (el) el.hidden = k !== kind;
  }
  const spec = kind ? OVERLAY_SPECS[kind] : null;
  $("#mini-scrim").hidden = !(spec && spec.scrim);

  if (spec) {
    $("#sp-name").textContent = spec.name;
    $("#sp-modal").textContent = spec.modal;
    $("#sp-dp").textContent = spec.dp;
    $("#sp-exit").textContent = spec.exit;
    $("#mini-bg-hint").textContent = spec.scrim
      ? "当前为强遮罩状态：遮罩已拦截底层文档点击，必须先处理或关闭浮层。"
      : "当前为非模态浮层：你可以直接点击这片底层文档区，浮层会轻柔收起。";
  } else {
    $("#sp-name").textContent = "已收起（回到常规文档流）";
    $("#sp-modal").textContent = "无悬浮层";
    $("#sp-dp").textContent = "0dp · 底层画布";
    $("#sp-exit").textContent = "点上方任意原语再次唤出";
    $("#mini-bg-hint").textContent = "浮层已安全退场，焦点回到文档正文。可点上方按钮体验其他原语。";
  }
}

$$(".sb-trigger").forEach((btn) => {
  btn.addEventListener("click", () => setSandboxOverlay(btn.dataset.overlay));
});
$("#ma-btn-info").addEventListener("click", () => setSandboxOverlay("popover"));
$("#ma-btn-more").addEventListener("click", () => setSandboxOverlay("dropdown"));
$("#ma-btn-del").addEventListener("click", () => setSandboxOverlay("modal"));
$$("[data-close-ov]").forEach((btn) => btn.addEventListener("click", () => setSandboxOverlay("")));
$$(".dd-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $("#ov-toast span").textContent = `已执行「${btn.dataset.dd}」 · 非模态回馈`;
    setSandboxOverlay("toast");
  });
});
$("#mini-body").addEventListener("click", () => {
  if (activeOverlay && !OVERLAY_SPECS[activeOverlay].scrim) {
    setSandboxOverlay("");
  }
});
$("#mini-scrim").addEventListener("click", () => {
  if (activeOverlay === "drawer") setSandboxOverlay("");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeOverlay && !$("#lightbox").open) {
    setSandboxOverlay("");
  }
});

// ==================== 03 · 层叠上下文陷阱实测 ====================
const TRAP_COPY = {
  transform: {
    css: "transform: translateZ(0)",
    free: false,
    html: "<strong>已被锁死：</strong>父容器 A 因 <code>transform</code> 生成独立层叠上下文（权重 <code>z=1</code>），子菜单的 <code>z-index: 9999</code> 出不了门，被权重 <code>z=2</code> 的兄弟顶栏 B 迎面切掉。",
  },
  opacity: {
    css: "opacity: 0.99",
    free: false,
    html: "<strong>已被锁死：</strong>哪怕只是 <code>opacity: 0.99</code> 这样肉眼几乎看不出的微透明，规范也会强制创建新层叠上下文，立刻锁死内部的 <code>z-index: 9999</code>。",
  },
  overflow: {
    css: "overflow: hidden",
    free: false,
    html: "<strong>已被裁断：</strong>哪怕没有层叠倒挂，只要父容器为了圆角或动画写了 <code>overflow: hidden</code>，越出父框边界的悬浮菜单也会被生生切掉上半截。",
  },
  toplayer: {
    css: "Top Layer (popover / dialog)",
    free: true,
    html: "<strong>彻底破狱：</strong>移入原生 Top Layer（或解除父级层叠上下文）后，悬浮菜单独立于普通 DOM 树渲染，无需再堆砌 <code>99999</code>，稳稳浮在顶栏之上。",
  },
};

$$(".trap-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.trap;
    const arena = $("#trap-arena");
    arena.dataset.trap = mode;
    $$(".trap-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    const info = TRAP_COPY[mode];
    $("#trap-css-badge").textContent = info.css;
    const ro = $("#trap-readout");
    ro.innerHTML = info.html;
    ro.classList.toggle("is-free", info.free);
  });
});

// ==================== 04 · 暗底与亮底阴影光度学 ====================
const optics = { theme: "dark", dp: 16, tonal: true };
const DARK_SURFACES = {
  0: [45, 31, 66],
  2: [58, 42, 82],
  8: [74, 56, 100],
  16: [94, 73, 122],
  24: [112, 89, 142],
};

function updateOptics() {
  const stageEl = $("#optics-stage");
  const card = $("#optics-card");
  stageEl.classList.toggle("is-dark", optics.theme === "dark");
  stageEl.classList.toggle("is-light", optics.theme === "light");

  const sh = shadowTokens(optics.dp);
  const dp = optics.dp;

  if (optics.theme === "dark") {
    const bgRgb = [45, 31, 66];
    const cardRgb = optics.tonal ? DARK_SURFACES[dp] : [49, 34, 71];
    const cr = contrastRatio(cardRgb, bgRgb);
    card.style.background = `rgb(${cardRgb.join(",")})`;
    card.style.color = "#F3EEE9";
    card.style.border = optics.tonal && dp > 0 ? "1px solid rgba(214, 198, 240, 0.34)" : "1px solid transparent";
    card.style.boxShadow = dp === 0 ? "none" : sh.css.replace(/\n\s+/g, " ");
    $("#optics-dp-tag").textContent = `${dp}dp · DARK SURFACE`;
    $("#optics-cr-tag").textContent = `底面明度比 ${cr}:1`;
    $("#optics-card-desc").textContent = dp === 0
      ? "0dp 与暗底完全持平，无投影也无提亮，属于底层画布自身。"
      : optics.tonal
        ? `在暗梅紫底上，单靠黑影几乎被背景吃掉；叠加色调提亮与 1px 高光边后，表面与底面拉开 ${cr}:1 明度差，立刻浮起。`
        : `关掉色调海拔后，哪怕给足 ${dp}dp 黑影，深紫卡片与深紫背景明度比仅 ${cr}:1，边界迅速糊成一团。`;
  } else {
    const bgRgb = [244, 239, 234];
    const cardRgb = dp === 0 ? [244, 239, 234] : [255, 253, 251];
    const cr = contrastRatio(cardRgb, bgRgb);
    card.style.background = `rgb(${cardRgb.join(",")})`;
    card.style.color = "#1E1B1A";
    card.style.border = optics.tonal && dp > 0 ? "1px solid rgba(45, 31, 66, 0.12)" : "1px solid transparent";
    card.style.boxShadow = dp === 0
      ? "none"
      : `0 ${(dp * 0.4).toFixed(1)}px ${(dp * 0.55).toFixed(1)}px ${(-dp * 0.18).toFixed(1)}px rgba(34,20,52,0.16), 0 ${(dp * 0.85).toFixed(1)}px ${(dp * 1.45).toFixed(1)}px rgba(34,20,52,0.12), 0 ${(dp * 0.3).toFixed(1)}px ${(dp * 1.8).toFixed(1)}px rgba(34,20,52,0.08)`;
    $("#optics-dp-tag").textContent = `${dp}dp · LIGHT PAPER`;
    $("#optics-cr-tag").textContent = `底面明度比 ${cr}:1`;
    $("#optics-card-desc").textContent = dp === 0
      ? "亮纸底面上 0dp 卡片与纸面齐平，需要边框或色块划分区域。"
      : `在亮纸底面上，半透明深色本影与半影清晰可见，${dp}dp 海拔足以在几乎纯白的表面上拉开明确的空间距离。`;
  }

  $("#m-umbra").textContent = dp === 0 ? "0px · 无接触本影" : `Y +${(dp * 0.46).toFixed(1)}px · 模糊 ${(dp * 0.62).toFixed(1)}px`;
  $("#m-penumbra").textContent = dp === 0 ? "0px · 无主光半影" : `Y +${(dp * 0.92).toFixed(1)}px · 模糊 ${(dp * 1.48).toFixed(1)}px`;
  $("#m-ambient").textContent = dp === 0 ? "0px · 无环境漫射" : `Y +${(dp * 0.36).toFixed(1)}px · 模糊 ${(dp * 1.85).toFixed(1)}px`;
}

$$("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    optics.theme = btn.dataset.theme;
    $$("[data-theme]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateOptics();
  });
});
$$(".dp-step").forEach((btn) => {
  btn.addEventListener("click", () => {
    optics.dp = Number(btn.dataset.dp);
    $$(".dp-step").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateOptics();
  });
});
$("#btn-tonal").addEventListener("click", (e) => {
  optics.tonal = !optics.tonal;
  e.currentTarget.classList.toggle("is-on", optics.tonal);
  e.currentTarget.setAttribute("aria-pressed", String(optics.tonal));
  e.currentTarget.textContent = `色调海拔 + 1px 高光边：${optics.tonal ? "开" : "关"}`;
  updateOptics();
});

// ==================== 05 · 从哪来：四时代切换 ====================
const ERAS = [
  {
    kicker: "1973–1976 · XEROX PARC · ALTO & SMALLTALK",
    heading: "像书桌上的纸片一样彼此重叠",
    text: "在施乐帕洛阿尔托研究中心（Xerox PARC），Alan Kay 提出面向个人电脑的桌面隐喻，让多份文档像书桌上的纸页一样叠放；Dan Ingalls 在 Smalltalk-74 与 Smalltalk-76 中实现 BitBlt 位块传输算法，使高分辨率位图屏幕上的重叠窗口与弹出菜单得以流畅重绘。1979 年 12 月苹果团队造访参观后，随后由 Lisa 与 Macintosh 将重叠窗口推向大众。",
    source: '核实文献：Alan Kay, <em>The Early History of Smalltalk</em> (ACM HOPL-II, 1993) · <a href="https://computerhistory.org/" target="_blank" rel="noopener">Computer History Museum</a>',
    svg: `<svg viewBox="0 0 220 140" width="220" height="140"><rect x="20" y="18" width="116" height="84" rx="4" fill="#5D4774" stroke="#B2A4CD" stroke-width="1.5"/><rect x="20" y="18" width="116" height="16" fill="#47345C"/><rect x="56" y="36" width="116" height="84" rx="4" fill="#A8C8BB" stroke="#FFFFFF" stroke-width="1.5"/><rect x="56" y="36" width="116" height="16" fill="#1A4A3B"/><rect x="88" y="54" width="112" height="72" rx="4" fill="#ECE6E0" stroke="#EC72A2" stroke-width="2"/><rect x="88" y="54" width="112" height="16" fill="#2D1F42"/><text x="96" y="66" fill="#ECE6E0" font-size="9" font-family="DM Mono">SMALLTALK WINDOW</text></svg>`,
  },
  {
    kicker: "1998-05-12 · W3C CSS 2.0 RECOMMENDATION",
    heading: "网页首次拥有受控的 Z 轴绘序",
    text: "1998 年 5 月 12 日，W3C 发布 CSS 2.0 正式推荐标准，在第 9.9 节「Layered presentation」首次正式引入 z-index 属性与层叠上下文（Stacking Context）概念。网页从此不再只能沿着文档流从上往下堆砌，而是能在三维层叠树里显式声明前后关系——但也埋下了日后「9999 大战」的伏笔。",
    source: '核实文献：<a href="https://www.w3.org/TR/1998/REC-CSS2-19980512/visuren.html#layers" target="_blank" rel="noopener">W3C CSS 2.0 Section 9.9 Layered presentation</a>',
    svg: `<svg viewBox="0 0 220 140" width="220" height="140"><line x1="36" y1="116" x2="36" y2="20" stroke="#EC72A2" stroke-width="2" stroke-dasharray="4 3"/><polygon points="36,14 31,24 41,24" fill="#EC72A2"/><rect x="58" y="88" width="134" height="26" rx="6" fill="#5D4774" stroke="#B2A4CD"/><text x="70" y="105" fill="#ECE6E0" font-size="11" font-family="DM Mono">z-index: 1</text><rect x="58" y="54" width="134" height="26" rx="6" fill="#A8C8BB"/><text x="70" y="71" fill="#17382D" font-size="11" font-family="DM Mono">z-index: 10</text><rect x="58" y="20" width="134" height="26" rx="6" fill="#ECE6E0" stroke="#EC72A2" stroke-width="1.5"/><text x="70" y="37" fill="#1E1B1A" font-size="11" font-family="DM Mono">z-index: 100</text></svg>`,
  },
  {
    kicker: "2014 · GOOGLE MATERIAL DESIGN",
    heading: "把海拔量化成 0–24dp 的纸面光影学",
    text: "2014 年 Google 发布 Material Design，用「量子纸片 + 双光源（定向主光与环境漫射光）」重新定义界面纵深，给卡片、菜单、抽屉与对话框分配了从 0dp 到 24dp 的统一静止海拔标尺，并以本影、半影、环境光三层叠加投影取代随意模糊。随后 Material Design 3 进一步补齐暗色模式下的色调海拔体系。",
    source: '核实文献：<a href="https://m2.material.io/design/environment/elevation.html" target="_blank" rel="noopener">Material Design Elevation &amp; Shadows Specification</a>',
    svg: `<svg viewBox="0 0 220 140" width="220" height="140"><ellipse cx="110" cy="112" rx="76" ry="12" fill="rgba(10,4,20,0.6)"/><ellipse cx="110" cy="110" rx="54" ry="8" fill="rgba(10,4,20,0.45)"/><rect x="54" y="42" width="112" height="44" rx="8" fill="#ECE6E0" stroke="#EC72A2" stroke-width="1.5"/><line x1="176" y1="42" x2="176" y2="110" stroke="#A8C8BB" stroke-width="1.5" stroke-dasharray="3 3"/><text x="182" y="80" fill="#A8C8BB" font-size="11" font-family="DM Mono">24dp</text><text x="76" y="68" fill="#1E1B1A" font-size="11" font-family="DM Mono">UMBRA+PEN</text></svg>`,
  },
  {
    kicker: "2022–2024 · HTML DIALOG, POPOVER API & TOP LAYER",
    heading: "原生 Top Layer 终结 z-index 军备竞赛",
    text: "随着 HTML 原生 <dialog>.showModal() 与 Popover API 在 2024 年进入全浏览器 Baseline，浏览器终于内置了高于整个文档树的 Top Layer（顶层）与 ::backdrop 遮罩伪元素。结合 W3C WAI-ARIA APG 对话框规范（焦点陷阱、Esc 关闭、关闭后焦点归还触发器），悬浮层从「靠 hack 硬顶」走入原生语义时代。",
    source: '核实文献：<a href="https://developer.mozilla.org/en-US/docs/Web/API/Popover_API" target="_blank" rel="noopener">MDN Popover API</a> · <a href="https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" target="_blank" rel="noopener">W3C WAI-ARIA APG Dialog Pattern</a>',
    svg: `<svg viewBox="0 0 220 140" width="220" height="140"><rect x="24" y="76" width="172" height="46" rx="6" fill="#46335A" stroke="#7E6799" stroke-dasharray="4 3"/><text x="34" y="103" fill="#C9BCE0" font-size="10" font-family="DM Mono">DOM · z-index: 9999</text><line x1="16" y1="62" x2="204" y2="62" stroke="#EC72A2" stroke-width="1.5"/><rect x="44" y="18" width="132" height="34" rx="7" fill="#ECE6E0" stroke="#A8C8BB" stroke-width="2"/><text x="62" y="39" fill="#1E1B1A" font-size="11" font-family="DM Mono">BROWSER TOP LAYER</text></svg>`,
  },
];

function renderEra(idx) {
  const e = ERAS[idx];
  $$(".era-tab").forEach((t, i) => {
    const active = i === idx;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
  $("#era-kicker").textContent = e.kicker;
  $("#era-heading").textContent = e.heading;
  $("#era-text").textContent = e.text;
  $("#era-source").innerHTML = e.source;
  $("#era-diagram").innerHTML = e.svg;
}

$$(".era-tab").forEach((tab) => {
  tab.addEventListener("click", () => renderEra(Number(tab.dataset.era)));
});

// ==================== 06 · 反模式就地改造对比 ====================
const ANTI_COPY = [
  {
    bad: "两层遮罩叠加会让屏幕彻底漆黑，用户搞不清点一次「关闭」会退回上一张卡还是直接丢掉全部编辑。",
    good: "已改造：把二次确认折成同一弹窗内的步骤切换（Step 1 → Step 2），整屏永远只保持一层清晰悬浮。",
  },
  {
    bad: "读者刚进页面还没看到底层内容，就用强模态遮罩拦住视线，没有「背景承托」的悬浮层只会被条件反射秒关。",
    good: "已改造：撤掉冷启动遮罩，改为不挡正文的页底轻横幅——先让用户读完内容，再决定是否点击订阅。",
  },
  {
    bad: '超过 6 项填写或需要对比资料的任务塞进弹窗，会引发双滚动条，误点遮罩还易丢失输入——应改为独立页面或 <a href="https://layout.xiaoxiaodong.ai/243/play/" target="_blank" rel="noopener">243 堆栈</a>。',
    good: "已改造：拆回全页双列步骤流，自然随页面主滚动条浏览，无需在窄框里上下折腾双滚动条。",
  },
  {
    bad: '390px 宽的手机屏同时漂浮吸底条、客服球与推广横幅，正文被挤成窄缝——多组操作应收束为单一底栏或 <a href="https://layout.xiaoxiaodong.ai/252/play/" target="_blank" rel="noopener">252 横向卷轴</a>。',
    good: "已改造：撤掉左右互抢视线的漂浮按钮，统一收束进一条克制的底部操作栏，把 85% 以上视口还给阅读正文。",
  },
];

$$(".anti-card").forEach((card, idx) => {
  const btn = $(".anti-btn", card);
  const desc = $(".anti-desc", card);
  btn.addEventListener("click", () => {
    const fixed = card.dataset.fixed !== "1";
    card.dataset.fixed = fixed ? "1" : "0";
    btn.textContent = fixed ? "看反模式" : "看稳妥改法";
    desc.innerHTML = fixed ? ANTI_COPY[idx].good : ANTI_COPY[idx].bad;
  });
});

// ==================== 07 · 小练习四选一 ====================
const QUIZ_ANSWERS = {
  A: {
    right: true,
    msg: "答对了！方案 A 用暖瓷白高反差确认卡 + 18dp 柔和投影稳稳锁住第一眼，同时把遮罩克制在 42%——背后文档与次级层依然隐约可辨，同时达成了「悬浮焦点」与「背景承托」。",
  },
  B: {
    right: false,
    msg: "再看一次表面明度与投影：方案 B 的确认卡几乎和暗紫底色同亮度，36dp 的超宽纯黑影不仅在暗底里辨识度极低，还会散成一团脏雾，焦点完全立不住。",
  },
  C: {
    right: false,
    msg: "差在遮罩过度：方案 C 的确认卡本身清晰，但 94% 实黑遮罩把背后的文档与次级层彻底涂死，用户失去「我在删除哪篇文档」的上下文安全感，违背了「背景承托」。",
  },
  D: {
    right: false,
    msg: "双浮层在抢戏：方案 D 把次级侧栏也提亮到暖白并挂上同级 18dp 投影，两块高亮浮层在同海拔同时呼喊，视线在左右来回打架，破坏了「悬浮焦点」的唯一性。",
  },
};

$$(".quiz-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const choice = btn.dataset.choice;
    const res = QUIZ_ANSWERS[choice];
    $$(".quiz-card").forEach((c) => {
      c.classList.remove("is-right", "is-wrong");
      if (c === btn) c.classList.add(res.right ? "is-right" : "is-wrong");
    });
    $("#quiz-feedback").textContent = `${res.right ? "✓ " : "× "}${res.msg}`;
  });
});

// ==================== 08 · 原海报原生 Top Layer 灯箱 ====================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbViewport = $("#lb-viewport");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

$("#poster-open-btn").addEventListener("click", () => {
  // 只引用页面已有 #poster 的 src，不重复内联图片体积
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.showModal();
});

$("#lb-close").addEventListener("click", () => lightbox.close());
$("#lb-in").addEventListener("click", () => {
  lbScale = clamp(+(lbScale + 0.35).toFixed(2), 1, 3.2);
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = clamp(+(lbScale - 0.35).toFixed(2), 1, 3.2);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (lbScale <= 1) return;
  lbDrag = { id: e.pointerId, x: e.clientX - lbX, y: e.clientY - lbY };
  lbViewport.style.cursor = "grabbing";
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = clamp(e.clientX - lbDrag.x, -480, 480);
  lbY = clamp(e.clientY - lbDrag.y, -580, 580);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => {
  lbDrag = null;
  lbViewport.style.cursor = "grab";
});
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});

// ==================== 初始化 ====================
syncHeroUI();
updateCueLab();
setSandboxOverlay("popover");
updateOptics();
renderEra(0);
