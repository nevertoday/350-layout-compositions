// 249 封面原语 · 页面总控（开场活体构造台 + 7 节独立交互 + 原海报灯箱）
import {
  PRESETS,
  THEMES,
  applyPatch,
  createInitialState,
  solveCover,
} from "./model.js";
import { mountCoverStage } from "./stage.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ==================== 1. 开场：活体封面原语构造室 ==================== */
let state = createInitialState();

const elSeal = $("#hero-score-seal");
const elCssPill = $("#hero-css-pill");
const elDiagBadge = $("#diag-badge");
const elDiagTitle = $("#diag-title");
const elDiagBody = $("#diag-body");
const elDiagHint = $("#diag-hint");
const elQuickFix = $("#btn-quick-fix");
const elMEl = $("#m-elements");
const elMSpring = $("#m-spring");
const elMRatio = $("#m-ratio");
const elMOverflow = $("#m-overflow");
const elPadInput = $("#input-pad");
const elPadVal = $("#val-pad");
const elRatioInput = $("#input-ratio");
const elRatioVal = $("#val-ratio");
const elLiveCss = $("#live-css");
const elXrayBtn = $("#btn-xray");
const elTitleMarkBar = $("#title-mark-bar");

const stage = mountCoverStage({
  canvas: $("#cover-stage"),
  getState: () => state,
  onPatch: (patch, opts) => updateState(patch, opts),
  onSyncLeaders: syncLeaderLines,
});

function syncLeaderLines({ entry, hero, hierarchy }) {
  const svg = $("#leader-svg");
  if (!svg || getComputedStyle(svg).display === "none") return;
  const H = 440;
  const targets = [
    { id: "entry", fromY: 76, toY: Math.round(entry * H) },
    { id: "hero", fromY: 220, toY: Math.round(hero * H) },
    { id: "hierarchy", fromY: 364, toY: Math.round(hierarchy * H) },
  ];
  for (const t of targets) {
    const p = $(`#leader-path-${t.id}`);
    const d = $(`#leader-dot-${t.id}`);
    if (p) p.setAttribute("d", `M 122 ${t.fromY} L 154 ${t.fromY} L 178 ${t.toY} L 214 ${t.toY}`);
    if (d) d.setAttribute("cy", String(t.toY));
  }
}

function renderHeroUI() {
  const m = solveCover(state);
  const ok = m.score === 4;

  // 顶眉分数章与 CSS 摘要
  elSeal.textContent = m.diag.badge;
  elSeal.classList.toggle("is-ok", ok);
  elCssPill.textContent =
    `${state.heightMode === "fixed" ? "height" : "min-block-size"}: ${m.containerH}px · ` +
    `${state.centerMode === "auto" ? "margin-block: auto" : state.centerMode === "between" ? "space-between" : "顶堆"}`;

  // 刊头自示范微型切角徽（过关时黄条居中对齐）
  if (elTitleMarkBar) {
    elTitleMarkBar.setAttribute("x", ok ? "15" : "6");
    elTitleMarkBar.setAttribute("width", ok ? "16" : "10");
  }

  // 单真源白话诊单
  elDiagBadge.textContent = m.diag.badge;
  elDiagBadge.classList.toggle("is-ok", ok);
  elDiagBadge.classList.toggle("is-error", !ok);
  elDiagTitle.textContent = m.diag.title;
  elDiagBody.textContent = m.diag.body;
  elDiagHint.textContent = m.diag.hint;

  if (m.diag.quickFix) {
    elQuickFix.hidden = false;
    elQuickFix.textContent = m.diag.quickFix.label;
  } else {
    elQuickFix.hidden = true;
  }

  // 四格单真源读数
  elMEl.textContent = `${m.totalElements} 件${m.clutterCount > 0 ? `（含${m.clutterCount}杂）` : ""}`;
  elMSpring.textContent =
    state.centerMode === "auto"
      ? `${m.springTop}/${m.springBottom}px`
      : state.centerMode === "between"
        ? "均分缝隙"
        : m.deadBottomVoid > 0
          ? `底空 ${m.deadBottomVoid}px`
          : "无弹簧 0px";
  elMRatio.textContent = `${m.titleRatio.toFixed(2)}×`;
  elMOverflow.textContent =
    m.overflowPx > 0
      ? `裁切 -${m.overflowPx}px`
      : m.padding < 14
        ? `边距 ${m.padding}px`
        : m.padRatio > 0.34
          ? `厚边 ${Math.round(m.padRatio * 100)}%`
          : m.expandedPx > 0
            ? `安全 +${m.expandedPx}px`
            : "安全无裁";

  // 控件激活态同步
  $$("[data-theme]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.theme === state.theme);
  });
  $$("[data-height-mode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.heightMode === state.heightMode);
  });
  $$("[data-center-mode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.centerMode === state.centerMode);
  });
  $$("[data-slot-mode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.slotMode === state.slotMode);
  });

  elPadInput.value = String(m.padding);
  elPadVal.textContent = `${m.padding}px`;
  elRatioInput.value = String(m.titleRatio);
  elRatioVal.textContent = `${m.titleRatio.toFixed(2)}×`;

  const clutterNames = { badge: "角标", card: "副卡", actions: "多钮" };
  $$("[data-clutter]").forEach((b) => {
    const k = b.dataset.clutter;
    const on = !!state.clutter[k];
    b.textContent = `${clutterNames[k]}：${on ? "在" : "清"}`;
    b.classList.toggle("is-warn", on);
    b.classList.toggle("is-clean", !on);
  });

  elXrayBtn.textContent = `弹簧透视：${state.xray ? "开" : "关"}`;
  elXrayBtn.classList.toggle("is-active", state.xray);
  elXrayBtn.setAttribute("aria-pressed", String(state.xray));

  // 5 行实时 CSS 代码匣
  elLiveCss.textContent = m.cssLines.join("\n");

  // 左侧引线状态 + 底部纯黑三栏图标带
  for (const key of ["entry", "hero", "hierarchy"]) {
    const info = m.pillars[key];
    const ls = $(`#leader-state-${key}`);
    const pill = $(`#pill-${key}`);
    const focused = state.focusPillar === key;
    if (ls) {
      ls.textContent = info.tag;
      ls.classList.toggle("is-ok", info.ok);
    }
    if (pill) {
      pill.textContent = info.tag;
      pill.classList.toggle("is-ok", info.ok);
      pill.classList.toggle("is-error", !info.ok);
    }
    $(`#leader-${key}`)?.classList.toggle("is-focused", focused);
    $(`#triad-${key}`)?.classList.toggle("is-focused", focused);
  }

  // 原海报底部三条活体检查清单
  $$("#hero-checklist li").forEach((li, i) => {
    const item = m.checklist[i];
    if (!item) return;
    li.classList.toggle("is-ok", item.ok);
    const mark = $(".chk-mark", li);
    if (mark) mark.textContent = item.ok ? "✓" : "×";
  });
}

function updateState(patch, opts = {}) {
  state = applyPatch(state, patch);
  renderHeroUI();
  if (!opts.fromCanvas) stage.notify();
}

// 绑定开场全部交互控件
$$("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ theme: btn.dataset.theme }));
});
$$("[data-height-mode]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ heightMode: btn.dataset.heightMode }));
});
$$("[data-center-mode]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ centerMode: btn.dataset.centerMode }));
});
$$("[data-slot-mode]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ slotMode: btn.dataset.slotMode }));
});
$$("[data-clutter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.clutter;
    updateState({ clutter: { ...state.clutter, [k]: !state.clutter[k] } });
  });
});
$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    updateState(preset.patch);
  });
});
$$("[data-pillar]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.dataset.pillar;
    updateState({ focusPillar: state.focusPillar === p ? null : p });
  });
});

elPadInput.addEventListener("input", () => {
  updateState({ padding: Number(elPadInput.value) });
});
elRatioInput.addEventListener("input", () => {
  updateState({ titleRatio: Number(elRatioInput.value) });
});
elXrayBtn.addEventListener("click", () => {
  updateState({ xray: !state.xray });
});
elQuickFix.addEventListener("click", () => {
  const m = solveCover(state);
  if (m.diag.quickFix) updateState(m.diag.quickFix.patch);
});

renderHeroUI();

/* ==================== 2. 01 节：4 种 CSS 写法压力对比台 ==================== */
const IMPL_DATA = {
  cover: {
    ok: true,
    badge: "稳健成立",
    name: "Cover 原语：flex-direction: column + margin-block: auto",
    reason: "不管视口拉高还是压矮，也不管标题从两行变成四行，顶部入口、居中主标题和底部预告始终留在同一条文档流里，永远不会互相踩踏或裁字。",
    captions: {
      tall: "宽松屏（420px）：上下两条 auto 弹簧平分剩余空间，主标题稳稳落中。",
      short: "矮横屏（250px）：弹簧自动收缩到 0，容器由 min-block-size 托住绝不重叠。",
      long: "长标题折 4 行：内容超高后容器顺势长高，顶栏与底部预告毫发无伤。",
    },
    code: `.cover {
  display: flex;
  flex-direction: column;
  min-block-size: 100svh;
  padding: 1.5rem;
}
.cover > .principal {
  margin-block: auto;
}`,
  },
  absolute: {
    ok: false,
    badge: "重叠风险",
    name: "绝对定位：position: absolute; top: 50%",
    reason: "一旦把主标题抽离文档流，浏览器就不再替它躲开顶栏和底栏。屏幕一压矮或标题一折行，红色虚线框内的主标题立刻压到顶栏和底沿预告上面。",
    captions: {
      tall: "宽松屏里看似居中，但只是靠空余高度碰巧没撞上。",
      short: "矮横屏（250px）：主标题已撞进顶部标识与底部预告，文字重影！",
      long: "长标题折 4 行：脱离文档流的主标题直接覆盖顶栏和底部箭标！",
    },
    code: `.cover {
  position: relative;
  height: 100vh;
}
.cover > .principal {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  /* ! 脱离文档流，矮屏/长文必重叠 */
}`,
  },
  pad: {
    ok: false,
    badge: "失衡脆弱",
    name: "硬写上边距：padding-top: 165px",
    reason: "手工凑出来的像素值只对某一台设计师的显示器有效。换到较矮横屏，上面空出一大截，主标题和底部预告直接掉出首屏折叠线外。",
    captions: {
      tall: "硬撑出 165px 顶部空隙，标题重心偏下且无法随高度居中。",
      short: "矮横屏（250px）：165px 死边距直接把主标题和预告挤出画面！",
      long: "长标题折 4 行：固定上留白把整段内容大幅顶向下半屏。",
    },
    code: `.cover {
  padding-top: 165px; /* ! 魔数写死 */
  padding-inline: 1.5rem;
}
/* 换设备或增减一行标题，重心全跑偏 */`,
  },
  fixed: {
    ok: false,
    badge: "裁切陷阱",
    name: "锁死高度：height: 100vh; overflow: hidden",
    reason: "把 min-block-size 误写成固定 height 后，容器彻底失去弹性生长能力。在矮屏或大字号折行时，底部信息预告直接被外框一刀切掉。",
    captions: {
      tall: "空间充裕时隐藏了隐患，一旦压矮立刻暴露裁切问题。",
      short: "矮横屏（250px）：固定 height 直接把底部信息预告裁出框外！",
      long: "长标题折 4 行：容器无法撑高，底沿预告完全被截断消失！",
    },
    code: `.cover {
  display: flex;
  flex-direction: column;
  height: 100vh;      /* ! 锁死高度 */
  overflow: hidden;   /* ! 超高即截字 */
}
.cover > .principal { margin-block: auto; }`,
  },
};

let sdImpl = "cover";
let sdStress = "tall";

function renderShowdown() {
  const cover = $("#sd-cover");
  const info = IMPL_DATA[sdImpl];
  cover.dataset.impl = sdImpl;
  cover.dataset.stress = sdStress;

  const titleEl = $("#sd-title");
  const subEl = $("#sd-sub");
  if (sdStress === "long") {
    titleEl.textContent = "封面不是装饰，而是多屏幕信息架构里负责立住主题层级的结构起点。";
    subEl.textContent = "当标题从两行涨到四行，只有留在正常文档流里的 min-block-size 能稳稳接住。";
  } else {
    titleEl.textContent = "封面不是装饰，而是结构的起点。";
    subEl.textContent = "核心标题永远停在剩余空间的视觉中轴。";
  }

  const badge = $("#sd-badge");
  const isActuallyBroken = sdImpl !== "cover" && (sdStress !== "tall" || sdImpl === "pad");
  badge.textContent = sdImpl === "cover" ? info.badge : isActuallyBroken ? `${info.badge} · 已崩坏` : `${info.badge} · 潜伏中`;
  badge.classList.toggle("is-ok", info.ok);
  badge.classList.toggle("is-error", !info.ok);

  $("#sd-name").textContent = info.name;
  $("#sd-reason").textContent = info.reason;
  $("#sd-caption").textContent = info.captions[sdStress];
  $("#sd-code").textContent = info.code;

  $$("[data-impl]").forEach((b) => b.classList.toggle("is-active", b.dataset.impl === sdImpl));
  $$("[data-stress]").forEach((b) => b.classList.toggle("is-active", b.dataset.stress === sdStress));
}

$$("[data-impl]").forEach((b) =>
  b.addEventListener("click", () => {
    sdImpl = b.dataset.impl;
    renderShowdown();
  })
);
$$("[data-stress]").forEach((b) =>
  b.addEventListener("click", () => {
    sdStress = b.dataset.stress;
    renderShowdown();
  })
);
renderShowdown();

/* ==================== 3. 02 节：6 件剥层减法板 ==================== */
const peelState = {
  eyebrow: true,
  headline: true,
  teaser: true,
  promo: true,
  metrics: true,
  buttons: true,
};

function renderPeel() {
  const keys = Object.keys(peelState);
  const activeKeys = keys.filter((k) => peelState[k]);
  const noiseCount = ["promo", "metrics", "buttons"].filter((k) => peelState[k]).length;
  const count = activeKeys.length;

  keys.forEach((k) => {
    const on = peelState[k];
    const chip = $(`[data-layer="${k}"]`);
    const prev = $(`[data-preview="${k}"]`);
    if (chip) {
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", String(on));
      const st = $(".peel-state", chip);
      if (st) st.textContent = on ? "已留" : "已剥";
    }
    if (prev) prev.hidden = !on;
  });

  $("#pr-count").textContent = `${count} 件`;
  const v = $("#pr-verdict");
  const jumps = $("#pr-jumps");
  const note = $("#pr-note");

  if (!peelState.headline) {
    jumps.textContent = "失焦 · 无主角";
    v.textContent = "缺少主标题";
    v.className = "pr-verdict is-error";
    note.textContent = "把核心主标题也剥掉了！封面原语做减法是为了让主标题独大，而不是把主题删成空壳。";
  } else if (noiseCount > 0) {
    jumps.textContent = `过载 · ${count} 跳`;
    v.textContent = `杂讯 ${noiseCount} 处`;
    v.className = "pr-verdict is-error";
    note.textContent = `还有 ${noiseCount} 件非核心杂件留在封面上。眼睛必须来回扫过角标、参数条或按钮群，原本半秒就能读懂的主题被迫拉长。`;
  } else if (count === 1) {
    jumps.textContent = "极净 · 1 跳";
    v.textContent = "单核宣言成立";
    v.className = "pr-verdict is-ok";
    note.textContent = "只保留 1 个居中主标题：视觉冲击最强，适合扉页宣言与极简封面；如需引出下文，可加回底部预告。";
  } else {
    jumps.textContent = `清晰 · ${count} 跳`;
    v.textContent = "最少元素成立";
    v.className = "pr-verdict is-ok";
    note.textContent = `精简到 ${count} 个结构槽：第一眼直奔主标题，再顺着底部预告自然往下翻——这正是原海报「用最少的元素，建立清晰的封面结构」。`;
  }
}

$$("[data-layer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    peelState[k] = !peelState[k];
    renderPeel();
  });
});
$("#peel-minimal").addEventListener("click", () => {
  Object.assign(peelState, {
    eyebrow: true,
    headline: true,
    teaser: true,
    promo: false,
    metrics: false,
    buttons: false,
  });
  renderPeel();
});
$("#peel-all").addEventListener("click", () => {
  Object.assign(peelState, {
    eyebrow: true,
    headline: true,
    teaser: true,
    promo: true,
    metrics: true,
    buttons: true,
  });
  renderPeel();
});
renderPeel();

/* ==================== 4. 03 节：svh / dvh 视口模拟器 ==================== */
let vpUnit = "vh";
let vpDevice = "phone";
let vpChrome = "expanded";

function renderViewportSim() {
  const shell = $("#vp-shell");
  const coverBox = $("#vp-cover-box");
  const voidBadge = $("#vp-void-badge");
  const statusEl = $("#vp-status");
  const numsEl = $("#vp-nums");
  const descEl = $("#vp-desc");

  shell.dataset.device = vpDevice;
  shell.classList.toggle("is-collapsed", vpChrome === "collapsed");

  const isPhone = vpDevice === "phone";
  const expanded = vpChrome === "expanded";
  const screenH = isPhone ? 844 : 1366;
  const chromeH = isPhone ? (expanded ? 112 : 20) : (expanded ? 74 : 20);
  const visibleH = screenH - chromeH;

  let computedH = screenH;
  if (vpUnit === "vh") computedH = screenH;
  else if (vpUnit === "svh") computedH = screenH - (isPhone ? 112 : 74);
  else if (vpUnit === "dvh") computedH = visibleH;
  else if (vpUnit === "clamp") computedH = Math.min(760, Math.max(460, Math.round((screenH - (isPhone ? 112 : 74)) * 0.76)));

  const overflowBehindBar = computedH > visibleH ? computedH - visibleH : 0;
  const tabletVoid = !isPhone && computedH > 900;

  // 把真实像素比例映射到模拟框可见区（352px 高）
  const visualMaxH = expanded ? 352 : 396;
  const pxHeight = Math.round((computedH / visibleH) * visualMaxH);
  coverBox.style.height = `${Math.min(visualMaxH + 46, Math.max(180, pxHeight))}px`;

  voidBadge.hidden = !tabletVoid;
  numsEl.textContent = `封面 ${computedH}px · 可视区 ${visibleH}px`;

  if (overflowBehindBar > 0) {
    statusEl.textContent = `底沿被工具栏遮住 ${overflowBehindBar}px`;
    statusEl.className = "vp-status is-error";
    descEl.textContent = isPhone
      ? `手机工具栏展开占掉 ${chromeH}px，而旧版 100vh 仍按最大视口 ${screenH}px 计算，底部的黄色「信息预告」正好沉到底栏后面看不见。`
      : `平板浏览器顶部栏占掉 ${chromeH}px，旧版 100vh 依然会超出首屏 ${overflowBehindBar}px，且拉出过长的垂直空隙。`;
  } else if (tabletVoid) {
    statusEl.textContent = `竖屏平板空洞过大（${computedH}px）`;
    statusEl.className = "vp-status is-error";
    descEl.textContent = `在 1024×1366 竖屏平板上硬锁 ${vpUnit === "svh" ? "100svh" : "100dvh"} 会把封面拉到 ${computedH}px 高，三行字中间空出大片真空。改用 clamp() 给上限才能兼顾平板。`;
  } else if (vpUnit === "dvh") {
    statusEl.textContent = "贴合可视区（注意滚动重排）";
    statusEl.className = "vp-status is-ok";
    descEl.textContent = `100dvh 实时跟随工具栏显隐从 ${screenH - 112}px 伸展到 ${screenH - 20}px，底部预告始终露面；但地址栏收起瞬间会触发一次高度重算，重动画页面慎用。`;
  } else if (vpUnit === "svh") {
    statusEl.textContent = "手机首屏稳妥露底";
    statusEl.className = "vp-status is-ok";
    descEl.textContent = expanded
      ? `100svh 按工具栏展开时的最小可视高（${computedH}px）结算，底部预告稳稳停在工具栏上方，不跳动也不裁切。`
      : `滚动收起工具栏后，100svh 保持稳态高度 ${computedH}px 不跳动，下方刚好自然露出一截正文开头，暗示可继续滚动。`;
  } else {
    statusEl.textContent = isPhone ? "紧凑露出正文开头" : "平板无空洞 · 比例稳健";
    statusEl.className = "vp-status is-ok";
    descEl.textContent = isPhone
      ? `clamp(460px, 76svh, 760px) 把封面收在 ${computedH}px，既完整展示三槽结构，又不与工具栏冲突，底部刚好探出一点正文诱发滚动。`
      : `在 1024×1366 竖屏平板上，760px 上限拦住了无节制拉伸，封面紧凑有分量，紧接下方 01 节正文零空洞。`;
  }

  $$("[data-unit]").forEach((b) => b.classList.toggle("is-active", b.dataset.unit === vpUnit));
  $$("[data-device]").forEach((b) => b.classList.toggle("is-active", b.dataset.device === vpDevice));
  $$("[data-chrome]").forEach((b) => b.classList.toggle("is-active", b.dataset.chrome === vpChrome));
}

$$("[data-unit]").forEach((b) =>
  b.addEventListener("click", () => {
    vpUnit = b.dataset.unit;
    renderViewportSim();
  })
);
$$("[data-device]").forEach((b) =>
  b.addEventListener("click", () => {
    vpDevice = b.dataset.device;
    renderViewportSim();
  })
);
$$("[data-chrome]").forEach((b) =>
  b.addEventListener("click", () => {
    vpChrome = b.dataset.chrome;
    renderViewportSim();
  })
);
renderViewportSim();

/* ==================== 5. 04 节：五站历史蓝图切换器 ==================== */
const ERAS = [
  {
    badge: "1928 · 柏林",
    work: "Jan Tschichold · Die neue Typographie",
    title: "从对称装饰转向功能层级",
    body: "德国排版师扬·奇肖尔德（Jan Tschichold）在 1928 年出版《新排版》（Die neue Typographie），将包豪斯与构成主义实验整理为实用印刷原则：抛弃中轴装饰与花边，改用无衬线字体、强烈字号反差、功能性细线与有意识的留白，让封面第一时间传达信息层级。",
    takeaway: "留给 249 号的基因：「封面不是装饰，而是结构的起点」，正是把封面从美工饰面拉回信息架构的起点。",
    svg: `<svg viewBox="0 0 180 225" aria-hidden="true">
      <rect x="8" y="8" width="164" height="209" fill="#FAF5EC" stroke="#050604" stroke-width="2"/>
      <rect x="8" y="8" width="164" height="36" fill="#050604"/>
      <rect x="20" y="21" width="76" height="9" fill="#FCC810"/>
      <line x1="20" y1="62" x2="156" y2="62" stroke="#050604" stroke-width="2"/>
      <rect x="20" y="76" width="112" height="16" fill="#050604"/>
      <rect x="20" y="98" width="84" height="16" fill="#050604"/>
      <rect x="20" y="124" width="38" height="4" fill="#FCC810"/>
      <rect x="98" y="148" width="60" height="52" fill="#050604"/>
      <rect x="20" y="192" width="58" height="6" fill="#47453D"/>
    </svg>`,
  },
  {
    badge: "1961 / 1981 · 苏黎世",
    work: "Josef Müller-Brockmann · Grid Systems (Niggli)",
    title: "把封面构图写进几何模数",
    body: "瑞士平面设计大师约瑟夫·米勒-布罗克曼先后在《Gestaltungsprobleme des Grafikers》（1961）与经典教材《Grid Systems in Graphic Design》（Niggli Verlag，1981）中，用严密模数网格控制封面上的主视觉、标题与底栏，用极简几何形与明确秩序替代随意摆位。",
    takeaway: "留给 249 号的基因：249 原海报的镉黄、暖米、纯黑三色与 90° 切角黑圆，正是瑞士理性几何封面的当代转译。",
    svg: `<svg viewBox="0 0 180 225" aria-hidden="true">
      <rect x="8" y="8" width="164" height="209" fill="#EFE2D0" stroke="#050604" stroke-width="2"/>
      <g stroke="#050604" stroke-opacity="0.2" stroke-width="1">
        <line x1="63" y1="8" x2="63" y2="217"/><line x1="118" y1="8" x2="118" y2="217"/>
        <line x1="8" y1="78" x2="172" y2="78"/><line x1="8" y1="148" x2="172" y2="148"/>
      </g>
      <circle cx="118" cy="108" r="42" fill="#050604"/>
      <polygon points="118,108 76,150 160,150" fill="#EFE2D0"/>
      <rect x="20" y="156" width="84" height="10" fill="#050604"/>
      <rect x="20" y="172" width="56" height="6" fill="#FCC810" stroke="#050604" stroke-width="0.8"/>
    </svg>`,
  },
  {
    badge: "2012–2018 · W3C",
    work: "CSS Flexible Box Layout Module Level 1 · §8.1",
    title: "auto 外边距成为纵向弹性弹簧",
    body: "W3C Flexbox 第 8.1 节（Aligning with 'auto' margins）明确规定：在弹性布局主轴上，计算完子项固有尺寸后，所有正向自由空间都优先分配给 auto 外边距，且优先级高于 justify-content；一旦溢出，auto 自动退回 0 防止反向裁切。",
    takeaway: "留给 249 号的基因：这短短一条规范，让「不靠绝对定位的弹性垂直居中」在浏览器里原生可行。",
    svg: `<svg viewBox="0 0 180 225" aria-hidden="true">
      <rect x="8" y="8" width="164" height="209" fill="#FAF5EC" stroke="#050604" stroke-width="2"/>
      <rect x="22" y="20" width="136" height="18" fill="#050604"/>
      <rect x="22" y="42" width="136" height="42" fill="#FCC810" fill-opacity="0.35" stroke="#7A5600" stroke-dasharray="4 3"/>
      <text x="90" y="67" text-anchor="middle" font-size="11" font-family="IBM Plex Mono, monospace" fill="#050604">auto</text>
      <rect x="22" y="88" width="136" height="48" fill="#050604"/>
      <rect x="34" y="106" width="84" height="10" fill="#FCC810"/>
      <rect x="22" y="140" width="136" height="42" fill="#FCC810" fill-opacity="0.35" stroke="#7A5600" stroke-dasharray="4 3"/>
      <text x="90" y="165" text-anchor="middle" font-size="11" font-family="IBM Plex Mono, monospace" fill="#050604">auto</text>
      <rect x="22" y="186" width="136" height="18" fill="#050604"/>
    </svg>`,
  },
  {
    badge: "2019 · Every Layout",
    work: "Heydon Pickering & Andy Bell · The Cover",
    title: "正式命名为「封面原语」",
    body: "2019 年，Heydon Pickering 与 Andy Bell 在《Every Layout》中将常见界面提炼为 12 个算法式布局原语，其中 The Cover（封面原语）只暴露 4 个核心参数：centered（居中主角）、space（间距）、minHeight（最小高度）与 noPad（是否去内边距），彻底摆脱媒体查询与魔数。",
    takeaway: "留给 249 号的基因：243–254 这整组 12 个「布局原语」正是与该体系一一对应的现代 UI 积木。",
    svg: `<svg viewBox="0 0 180 225" aria-hidden="true">
      <rect x="8" y="8" width="164" height="209" fill="#FCC810" stroke="#050604" stroke-width="2"/>
      <rect x="20" y="20" width="140" height="185" fill="#EFE2D0" stroke="#050604" stroke-width="1.5"/>
      <text x="30" y="42" font-size="10" font-family="IBM Plex Mono, monospace" fill="#050604">minHeight</text>
      <rect x="30" y="86" width="120" height="52" fill="#050604"/>
      <text x="90" y="116" text-anchor="middle" font-size="12" font-family="IBM Plex Mono, monospace" fill="#FCC810">centered</text>
      <text x="30" y="190" font-size="10" font-family="IBM Plex Mono, monospace" fill="#050604">space · noPad</text>
    </svg>`,
  },
  {
    badge: "2022–2024 · W3C",
    work: "CSS Values and Units Module Level 4",
    title: "svh / dvh 补齐移动端全屏拼图",
    body: "针对移动端浏览器地址栏动态伸缩长期导致的 100vh 遮挡问题，W3C CSS Values & Units Level 4 引入小视口（svh）、大视口（lvh）与动态视口（dvh）单位，使封面原语在手机浏览器里也能精准控制首屏底沿预告的可见性。",
    takeaway: "留给 249 号的基因：写现代封面原语时，优先用 min-block-size: 100svh 或带上限的 clamp()，别再盲写 100vh。",
    svg: `<svg viewBox="0 0 180 225" aria-hidden="true">
      <rect x="26" y="10" width="128" height="205" fill="#0B0C09" stroke="#050604" stroke-width="2"/>
      <rect x="32" y="16" width="116" height="18" fill="#34372E"/>
      <rect x="32" y="38" width="116" height="142" fill="#EFE2D0"/>
      <rect x="44" y="92" width="92" height="32" fill="#050604"/>
      <text x="90" y="112" text-anchor="middle" font-size="11" font-family="IBM Plex Mono, monospace" fill="#FCC810">100svh</text>
      <rect x="40" y="156" width="100" height="16" fill="#FCC810" stroke="#050604"/>
      <rect x="32" y="184" width="116" height="24" fill="#9E1B11"/>
      <text x="90" y="200" text-anchor="middle" font-size="9.5" font-family="IBM Plex Mono, monospace" fill="#FFFDF8">BROWSER BAR</text>
    </svg>`,
  },
];

function renderEra(idx) {
  const e = ERAS[idx] || ERAS[0];
  $("#era-art").innerHTML = e.svg;
  $("#era-badge").textContent = e.badge;
  $("#era-work").textContent = e.work;
  $("#era-title").textContent = e.title;
  $("#era-body").textContent = e.body;
  $("#era-takeaway").textContent = e.takeaway;

  $$(".era-tab").forEach((t, i) => {
    const active = i === idx;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
}

$$(".era-tab").forEach((t) => {
  t.addEventListener("click", () => renderEra(Number(t.dataset.era)));
});
renderEra(0);

/* ==================== 6. 05 节：场景分诊矩阵 ==================== */
const SCENES = [
  {
    ok: true,
    verdict: "推荐直接使用",
    title: "年度设计报告开篇页",
    spec: "建议：min-block-size: clamp(540px, 88svh, 860px) · 三槽完整",
    reason: "报告开篇有明确仪式感与单一核心主题：顶槽放年份与发行方，居中主标题配代表几何图，底槽放目录入口与阅读时长预告，刚好发挥封面原语全部优势。",
  },
  {
    ok: false,
    verdict: "不要使用",
    title: "后台客服工单处理台",
    spec: "改用：247 侧栏原语 + 243 堆栈表格",
    reason: "客服每天打开几十次，第一秒就要看未读工单和搜索框。在这里放一张大封面只会迫使操作员每次多滚一屏，纯属添堵。",
  },
  {
    ok: true,
    verdict: "非常适合",
    title: "无搜索结果的空状态屏",
    spec: "建议：min-block-size: 420px · 单核或双槽",
    reason: "空状态区域常随窗口高矮变化，且只有一句话提示加一个「清空筛选」按钮。用 Cover 原语配 margin-block: auto，能在任何屏幕高度稳稳把提示居中。",
  },
  {
    ok: false,
    verdict: "不要全屏套用",
    title: "突发科技新闻正文页",
    spec: "改用：245 居中器 + 243 堆栈阅读流",
    reason: "点进新闻链接的读者已准备好读正文第一段。把整屏交给巨幅封面会把导语推到首屏之外，拉高跳出率；紧凑题头直入正文效率高得多。",
  },
  {
    ok: true,
    verdict: "推荐卡片形态",
    title: "420px 高的课程封面卡",
    spec: "建议：min-block-size: 420px · padding: 24px",
    reason: "很多人误以为封面原语只能配 100vh。其实它在独立卡片里同样好用：顶槽放章节编号、中间标题自动垂直居中、底槽放课时与箭头，多张卡片排在一起极其整齐。",
  },
  {
    ok: false,
    verdict: "不要使用",
    title: "36 件商品筛选结果墙",
    spec: "改用：250 自适应网格原语 + 246 簇群筛选条",
    reason: "筛选结果页没有唯一主角，用户要横向比较几十件商品的价格与参数。应让网格首屏立刻露出第一行商品，而不是用大封面占掉半屏。",
  },
];

function renderTriage(idx) {
  const s = SCENES[idx] || SCENES[0];
  const v = $("#td-verdict");
  v.textContent = s.verdict;
  v.className = `td-verdict ${s.ok ? "is-ok" : "is-error"}`;
  $("#td-title").textContent = s.title;
  $("#td-spec").textContent = s.spec;
  $("#td-reason").textContent = s.reason;
  $$(".triage-card").forEach((c, i) => c.classList.toggle("is-active", i === idx));
}

$$(".triage-card").forEach((c) => {
  c.addEventListener("click", () => renderTriage(Number(c.dataset.scene)));
});
renderTriage(0);

/* ==================== 7. 06 节：两轮单变量眼力测验 ==================== */
const QUIZ_ROUNDS = [
  {
    prompt: "第 1 题（垂直弹性与护边）：下面四版封面文案、字体、字号完全一致，只改动了一处 Cover 原语结构规则。哪一版最稳健？",
    options: [
      {
        label: "方案 A",
        correct: true,
        explain: "选对了！方案 A 严格遵循封面原语：顶槽贴顶、底槽贴底，主标题通过 margin-block: auto 停在视觉中心，四周保留统一 24px 护边气口，容器拉伸或压矮都不崩。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <line x1="18" y1="30" x2="162" y2="30" stroke="#050604" stroke-opacity="0.3"/>
          <rect x="18" y="18" width="54" height="6" fill="#050604"/>
          <rect x="134" y="18" width="28" height="6" fill="#47453D"/>
          <circle cx="126" cy="116" r="34" fill="#050604"/>
          <polygon points="126,116 92,150 160,150" fill="#EFE2D0"/>
          <rect x="18" y="102" width="66" height="12" fill="#050604"/>
          <rect x="18" y="118" width="54" height="12" fill="#050604"/>
          <rect x="18" y="135" width="24" height="3.5" fill="#FCC810" stroke="#050604" stroke-width="0.6"/>
          <line x1="18" y1="206" x2="162" y2="206" stroke="#050604"/>
          <rect x="18" y="214" width="84" height="7" fill="#050604"/>
          <text x="158" y="221" text-anchor="end" font-size="11" fill="#050604">→</text>
        </svg>`,
      },
      {
        label: "方案 B",
        correct: false,
        explain: "再看一眼垂直空间：方案 B 没有对主标题设置 margin-block: auto，顶、主、底三块全部按普通流顶堆在上方，下方留出接近四成的呆板死白，预告线也没锚定底沿。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <line x1="18" y1="30" x2="162" y2="30" stroke="#050604" stroke-opacity="0.3"/>
          <rect x="18" y="18" width="54" height="6" fill="#050604"/>
          <rect x="134" y="18" width="28" height="6" fill="#47453D"/>
          <circle cx="126" cy="74" r="32" fill="#050604"/>
          <polygon points="126,74 94,106 158,106" fill="#EFE2D0"/>
          <rect x="18" y="48" width="66" height="12" fill="#050604"/>
          <rect x="18" y="64" width="54" height="12" fill="#050604"/>
          <rect x="18" y="81" width="24" height="3.5" fill="#FCC810" stroke="#050604" stroke-width="0.6"/>
          <line x1="18" y1="118" x2="162" y2="118" stroke="#050604"/>
          <rect x="18" y="126" width="84" height="7" fill="#050604"/>
          <text x="158" y="133" text-anchor="end" font-size="11" fill="#050604">→</text>
        </svg>`,
      },
      {
        label: "方案 C",
        correct: false,
        explain: "留意四周边框：方案 C 居中本身没问题，但把容器内边距设成了 0（noPad 且无外护边），顶部标识、左侧标题和底沿预告全都死死贴在 1.5px 黑框内壁上，毫无呼吸气口。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <line x1="0" y1="14" x2="180" y2="14" stroke="#050604" stroke-opacity="0.3"/>
          <rect x="2" y="3" width="54" height="6" fill="#050604"/>
          <rect x="150" y="3" width="28" height="6" fill="#47453D"/>
          <circle cx="138" cy="116" r="34" fill="#050604"/>
          <polygon points="138,116 104,150 172,150" fill="#EFE2D0"/>
          <rect x="2" y="102" width="66" height="12" fill="#050604"/>
          <rect x="2" y="118" width="54" height="12" fill="#050604"/>
          <rect x="2" y="135" width="24" height="3.5" fill="#FCC810" stroke="#050604" stroke-width="0.6"/>
          <line x1="0" y1="224" x2="180" y2="224" stroke="#050604"/>
          <rect x="2" y="230" width="84" height="7" fill="#050604"/>
          <text x="177" y="236" text-anchor="end" font-size="11" fill="#050604">→</text>
        </svg>`,
      },
      {
        label: "方案 D",
        correct: false,
        explain: "很接近但重心跑偏了：方案 D 用 justify-content: space-between 均分块间缝隙，可顶部装了较厚的两层导览条，导致中间主标题被明显推向画面下半部，失去居中稳重感。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <rect x="18" y="18" width="144" height="44" fill="#E3D4BE" stroke="#050604" stroke-opacity="0.3"/>
          <rect x="26" y="26" width="60" height="6" fill="#050604"/>
          <rect x="26" y="38" width="110" height="5" fill="#47453D"/>
          <rect x="26" y="48" width="88" height="5" fill="#47453D"/>
          <circle cx="126" cy="150" r="32" fill="#050604"/>
          <polygon points="126,150 94,182 158,182" fill="#EFE2D0"/>
          <rect x="18" y="136" width="66" height="12" fill="#050604"/>
          <rect x="18" y="152" width="54" height="12" fill="#050604"/>
          <rect x="18" y="169" width="24" height="3.5" fill="#FCC810" stroke="#050604" stroke-width="0.6"/>
          <line x1="18" y1="206" x2="162" y2="206" stroke="#050604"/>
          <rect x="18" y="214" width="84" height="7" fill="#050604"/>
          <text x="158" y="221" text-anchor="end" font-size="11" fill="#050604">→</text>
        </svg>`,
      },
    ],
  },
  {
    prompt: "第 2 题（层级主导与元素预算）：四版封面都在同一弹性容器里居中对齐，只改动了主副层级与元素数量。哪一版最符合封面原语？",
    options: [
      {
        label: "方案 A",
        correct: false,
        explain: "主副层级过于平均：方案 A 保留了干净的三槽，但主标题字号只比底下说明大了一点点，第一眼扫过去分不清哪一行才是核心主题。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <rect x="18" y="18" width="52" height="5" fill="#050604"/>
          <circle cx="128" cy="116" r="30" fill="#050604"/>
          <polygon points="128,116 98,146 158,146" fill="#EFE2D0"/>
          <rect x="18" y="106" width="78" height="7" fill="#050604"/>
          <rect x="18" y="118" width="74" height="6" fill="#47453D"/>
          <rect x="18" y="129" width="68" height="6" fill="#47453D"/>
          <line x1="18" y1="206" x2="162" y2="206" stroke="#050604"/>
          <rect x="18" y="214" width="80" height="6" fill="#050604"/>
        </svg>`,
      },
      {
        label: "方案 B",
        correct: true,
        explain: "选对了！方案 B 既有 2.6× 的清晰主副字号反差（标题主导），又克制在顶标 + 主角 + 底沿预告三槽之内，一眼抓重点、顺势引下文。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <rect x="18" y="18" width="52" height="5" fill="#050604"/>
          <circle cx="126" cy="114" r="35" fill="#050604"/>
          <polygon points="126,114 91,149 161,149" fill="#EFE2D0"/>
          <rect x="18" y="96" width="86" height="14" fill="#050604"/>
          <rect x="18" y="114" width="64" height="14" fill="#050604"/>
          <rect x="18" y="133" width="26" height="3.5" fill="#FCC810" stroke="#050604" stroke-width="0.6"/>
          <rect x="18" y="142" width="78" height="5" fill="#47453D"/>
          <line x1="18" y1="206" x2="162" y2="206" stroke="#050604"/>
          <rect x="18" y="214" width="82" height="6" fill="#050604"/>
          <text x="158" y="220" text-anchor="end" font-size="11" fill="#050604">→</text>
        </svg>`,
      },
      {
        label: "方案 C",
        correct: false,
        explain: "元素超载打架：方案 C 虽然保留了大主标题，却在四角和腰部硬塞了推荐角标、四格卖点条和双按钮，把原本清澈的封面变成了拥挤促销页。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <rect x="18" y="18" width="52" height="5" fill="#050604"/>
          <rect x="114" y="14" width="48" height="14" fill="#050604"/>
          <circle cx="132" cy="88" r="24" fill="#050604"/>
          <polygon points="132,88 108,112 156,112" fill="#EFE2D0"/>
          <rect x="18" y="68" width="84" height="13" fill="#050604"/>
          <rect x="18" y="85" width="62" height="13" fill="#050604"/>
          <rect x="18" y="118" width="32" height="24" fill="#E3D4BE" stroke="#050604"/>
          <rect x="55" y="118" width="32" height="24" fill="#E3D4BE" stroke="#050604"/>
          <rect x="92" y="118" width="32" height="24" fill="#E3D4BE" stroke="#050604"/>
          <rect x="129" y="118" width="32" height="24" fill="#E3D4BE" stroke="#050604"/>
          <rect x="18" y="154" width="68" height="20" fill="#050604"/>
          <rect x="94" y="154" width="68" height="20" fill="#FCC810" stroke="#050604"/>
          <line x1="18" y1="206" x2="162" y2="206" stroke="#050604"/>
          <rect x="18" y="214" width="82" height="6" fill="#050604"/>
        </svg>`,
      },
      {
        label: "方案 D",
        correct: false,
        explain: "过度放大反伤留白：方案 D 把主标题拉得过于庞大，被迫折成四行挤满整个容器，吞掉所有上下弹性留白，还把底沿信息预告顶出了黑框。",
        svg: `<svg class="quiz-opt-svg" viewBox="0 0 180 240" aria-hidden="true">
          <rect width="180" height="240" fill="#EFE2D0"/>
          <rect x="18" y="14" width="52" height="5" fill="#050604"/>
          <rect x="18" y="34" width="144" height="32" fill="#050604"/>
          <rect x="18" y="72" width="144" height="32" fill="#050604"/>
          <rect x="18" y="110" width="144" height="32" fill="#050604"/>
          <rect x="18" y="148" width="128" height="32" fill="#050604"/>
          <rect x="18" y="190" width="110" height="6" fill="#47453D"/>
          <line x1="18" y1="226" x2="162" y2="226" stroke="#9E1B11" stroke-dasharray="4 3" stroke-width="2"/>
          <rect x="18" y="232" width="82" height="8" fill="#47453D"/>
        </svg>`,
      },
    ],
  },
];

let quizRound = 0;
const quizAnswers = [null, null];

function renderQuiz() {
  const r = QUIZ_ROUNDS[quizRound];
  $("#quiz-prompt").textContent = r.prompt;
  const grid = $("#quiz-grid");
  const picked = quizAnswers[quizRound];

  grid.innerHTML = "";
  r.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    btn.dataset.opt = String(i);
    if (picked !== null) {
      if (i === picked) btn.classList.add(opt.correct ? "is-right" : "is-wrong");
      else if (opt.correct) btn.classList.add("is-right");
    }
    const statusText =
      picked === null
        ? "点选判定"
        : opt.correct
          ? "✓ 推荐方案"
          : i === picked
            ? "× 结构偏弱"
            : "";
    btn.innerHTML = `
      <span class="quiz-opt-head"><span>${opt.label}</span><span>${statusText}</span></span>
      ${opt.svg}
    `;
    btn.addEventListener("click", () => {
      quizAnswers[quizRound] = i;
      renderQuiz();
    });
    grid.appendChild(btn);
  });

  const fb = $("#quiz-feedback");
  if (picked === null) {
    fb.className = "quiz-feedback";
    fb.textContent = "先点击上方任意一版「方案 A / B / C / D」，查看单变量结构拆解。";
  } else {
    const chosen = r.options[picked];
    fb.className = `quiz-feedback ${chosen.correct ? "is-right" : "is-wrong"}`;
    fb.textContent = `${chosen.label}：${chosen.explain}`;
  }

  const solved = quizAnswers.filter((a, idx) => a !== null && QUIZ_ROUNDS[idx].options[a].correct).length;
  $("#quiz-progress").textContent = `已完成 ${solved}/2 题 · 四个选项仅差一个结构变量`;

  $$("[data-round]").forEach((b) =>
    b.classList.toggle("is-active", Number(b.dataset.round) === quizRound)
  );
}

$$("[data-round]").forEach((b) => {
  b.addEventListener("click", () => {
    quizRound = Number(b.dataset.round);
    renderQuiz();
  });
});
renderQuiz();

/* ==================== 8. 07 节：原海报放大灯箱（缩放 + 拖动 + Esc） ==================== */
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScaleEl = $("#lb-scale");
const posterImg = $("#poster");
const posterTrigger = $("#poster-trigger");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbSX = 0;
let lbSY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lb.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) {
    lbX = 0;
    lbY = 0;
  }
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    lbScale = Math.min(3.5, Math.max(0.7, +(lbScale + delta).toFixed(2)));
    applyLbTransform();
  },
  { passive: false }
);

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = true;
  lbSX = e.clientX - lbX;
  lbSY = e.clientY - lbY;
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbSX;
  lbY = e.clientY - lbSY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbDrag = false;
});
lbStage.addEventListener("pointercancel", () => {
  lbDrag = false;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});
