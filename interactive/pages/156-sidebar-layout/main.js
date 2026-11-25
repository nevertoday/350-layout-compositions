// 156 侧栏版式 · 主交互脚本
import {
  CONTRAST_MODES,
  MOBILE_MODES,
  PRESETS,
  SCENARIOS,
  clampSidebarPct,
  computeMetrics,
  createInitialState,
  snapSidebarPct,
} from "./model.js";
import { createHeroStage } from "./stage.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = createInitialState();

// ============ 1. 开场活体分栏裁切台与单真源 UI 同步 ============
const heroCanvas = $("#heroCanvas");
const stage = createHeroStage(heroCanvas, () => state, {
  onDragPct(rawPct) {
    const next = clampSidebarPct(rawPct);
    if (next === state.sidebarPct) return;
    state.sidebarPct = next;
    syncHeroUI(false);
  },
  onDragEnd() {
    state.sidebarPct = snapSidebarPct(state.sidebarPct, true);
    syncHeroUI(true);
  },
  onStepPct(delta) {
    state.sidebarPct = clampSidebarPct(state.sidebarPct + delta);
    syncHeroUI(true);
  },
  onCanvasAction(actionId) {
    if (actionId === "fix-core") {
      state.coreInSidebar = false;
    } else if (actionId === "fix-noise") {
      state.hasNoise = false;
    } else if (actionId === "toggle-mobile-view") {
      state.viewportPreview = state.viewportPreview === "mobile" ? "desktop" : "mobile";
    }
    syncHeroUI(true);
  },
});

function setText(el, text) {
  if (el && el.textContent !== text) el.textContent = text;
}

function syncHeroUI(immediateDraw = true) {
  const m = computeMetrics(state);

  // 顶眉状态丸
  const topPill = $("#topStatusPill");
  topPill.textContent = m.diag.ok ? `4 / 4 · 层次清晰` : `${m.passed} / 4 · ${m.dominanceTier}`;
  topPill.classList.toggle("is-ok", m.diag.ok);
  topPill.classList.toggle("is-err", !m.diag.ok);

  // 标题自带实时比例示范条
  $("#titleMainBar").style.width = `${m.mainPct}%`;
  $("#titleSideBar").style.width = `${m.sidebarPct}%`;
  $("#titleRatioLabel").textContent = `主 ${m.mainPct}% : 侧 ${m.sidebarPct}%`;

  // 题材按钮态
  $$("[data-scenario]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.scenario === state.scenario);
  });

  // 画布工具按钮态
  const btnFlip = $("#btnFlipSide");
  btnFlip.textContent = `侧栏位：${state.side === "left" ? "左栏" : "右栏"}`;
  btnFlip.setAttribute("aria-pressed", String(state.side === "left"));

  const btnFlow = $("#btnToggleFlow");
  btnFlow.textContent = `视线流：${state.showFlow ? "开" : "关"}`;
  btnFlow.setAttribute("aria-pressed", String(state.showFlow));

  const btnMobView = $("#btnToggleMobileView");
  btnMobView.textContent = state.viewportPreview === "mobile" ? "切回 1280 桌面" : "390px 实机视角";
  btnMobView.setAttribute("aria-pressed", String(state.viewportPreview === "mobile"));

  // ① 分栏比例
  const range = $("#rangeSidebarPct");
  range.value = String(m.sidebarPct);
  const ratioOut = $("#ctrlRatioReadout");
  ratioOut.textContent = `主 ${m.mainPct}% : 侧 ${m.sidebarPct}%`;
  ratioOut.className = `ctrl-val ${m.checks.ratioOk ? "is-ok" : "is-err"}`;

  // ② 职责与密度
  const roleOut = $("#ctrlRoleReadout");
  roleOut.textContent = state.coreInSidebar
    ? `核心错置 · ${m.totalSidebarBlocks} 块`
    : state.hasNoise
      ? `含 2 噪点 · ${m.totalSidebarBlocks} 块`
      : `${state.sidebarItems} 组辅信息`;
  roleOut.className = `ctrl-val ${m.checks.roleOk ? "is-ok" : "is-err"}`;

  const btnCore = $("#btnToggleCore");
  btnCore.textContent = state.coreInSidebar ? "核心归主区" : "核心已在主区";
  btnCore.classList.toggle("is-warn", state.coreInSidebar);
  btnCore.classList.toggle("is-active", !state.coreInSidebar);

  const btnNoise = $("#btnToggleNoise");
  btnNoise.textContent = state.hasNoise ? "清掉 2 噪点" : "无噪点（点加回）";
  btnNoise.classList.toggle("is-warn", state.hasNoise);
  btnNoise.classList.toggle("is-active", !state.hasNoise);

  $$("[data-items]").forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.items) === state.sidebarItems);
  });

  // ③ 视觉对比
  const contrastOut = $("#ctrlContrastReadout");
  contrastOut.textContent = CONTRAST_MODES[state.contrast].label;
  contrastOut.className = `ctrl-val ${m.checks.contrastOk ? "is-ok" : "is-err"}`;
  $$("[data-contrast]").forEach((btn) => {
    const k = btn.dataset.contrast;
    btn.classList.toggle("is-active", k === state.contrast);
    btn.classList.toggle("is-warn", !CONTRAST_MODES[k].ok && k === state.contrast);
  });

  // ④ 移动端
  const mobOut = $("#ctrlMobileReadout");
  mobOut.textContent = MOBILE_MODES[state.mobileMode].label;
  mobOut.className = `ctrl-val ${m.checks.mobileOk ? "is-ok" : "is-err"}`;
  $$("[data-mobile]").forEach((btn) => {
    const k = btn.dataset.mobile;
    btn.classList.toggle("is-active", k === state.mobileMode);
    btn.classList.toggle("is-warn", !MOBILE_MODES[k].ok && k === state.mobileMode);
  });

  // 右侧深普鲁士靛 5 项原海报功能状态灯
  for (const fn of m.functionsStatus) {
    const chip = $(`[data-chip="${fn.id}"]`);
    if (chip) {
      chip.textContent = fn.chip;
      chip.classList.toggle("is-ok", fn.ok);
      chip.classList.toggle("is-err", !fn.ok);
    }
  }

  // 右下斜贴橘色胶带的撕边纸条诊单
  const card = $("#diagCard");
  card.classList.toggle("is-ok", m.diag.ok);
  card.classList.toggle("is-err", !m.diag.ok);

  const badge = $("#diagBadge");
  badge.textContent = m.diag.badge;
  badge.classList.toggle("is-ok", m.diag.ok);
  badge.classList.toggle("is-err", !m.diag.ok);

  $("#diagTitle").textContent = m.diag.title;
  $("#diagWhy").textContent = m.diag.why;
  $("#diagAction").textContent = m.diag.action;

  setText($("#mRatio"), `${m.mainPct}% : ${m.sidebarPct}%`);
  setText($("#mCPL"), `${m.mainCPL}字·${m.measureTier}`);
  setText($("#mTier"), m.dominanceTier);
  setText(
    $("#mMob"),
    state.mobileMode === "fixed"
      ? `${m.mobileMainPx}px·挤`
      : state.mobileMode === "hidden"
        ? "390px·丢栏"
        : "390px·通读"
  );

  stage.markDirty(immediateDraw);
}

// 绑定开场控件事件
$$("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sc = btn.dataset.scenario;
    state.scenario = sc;
    if (SCENARIOS[sc]) state.side = SCENARIOS[sc].defaultSide;
    syncHeroUI();
  });
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    Object.assign(state, p);
    syncHeroUI();
  });
});

$("#btnFlipSide").addEventListener("click", () => {
  state.side = state.side === "left" ? "right" : "left";
  syncHeroUI();
});
$("#btnToggleFlow").addEventListener("click", () => {
  state.showFlow = !state.showFlow;
  syncHeroUI();
});
$("#btnToggleMobileView").addEventListener("click", () => {
  state.viewportPreview = state.viewportPreview === "mobile" ? "desktop" : "mobile";
  syncHeroUI();
});
$("#rangeSidebarPct").addEventListener("input", (e) => {
  state.sidebarPct = clampSidebarPct(Number(e.target.value));
  syncHeroUI();
});
$("#btnToggleCore").addEventListener("click", () => {
  state.coreInSidebar = !state.coreInSidebar;
  syncHeroUI();
});
$("#btnToggleNoise").addEventListener("click", () => {
  state.hasNoise = !state.hasNoise;
  syncHeroUI();
});
$$("[data-items]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.sidebarItems = Number(btn.dataset.items);
    syncHeroUI();
  });
});
$$("[data-contrast]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.contrast = btn.dataset.contrast;
    syncHeroUI();
  });
});
$$("[data-mobile]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mobileMode = btn.dataset.mobile;
    syncHeroUI();
  });
});

// 移动端 5 项侧栏功能折叠按钮（本页亲自践行「移动端按需折叠」）
const btnRailFold = $("#btnRailFold");
const railFuncList = $("#railFuncList");
btnRailFold.addEventListener("click", () => {
  const open = railFuncList.classList.toggle("is-open");
  btnRailFold.setAttribute("aria-expanded", String(open));
  btnRailFold.textContent = open ? "收起 5 项" : "展开 5 项";
});

syncHeroUI();

// ============ 2. 第 01 节：混排插播 vs 剥离侧栏 ============
const extractLab = $("#extractLab");
const extractCopy = {
  mixed: {
    stat: "主文被打断 3 次 · 视线反复左右折返",
    caption:
      "当前把目录、注释与标签硬插在正文段落之间，读者每读两句就被迫跳出叙事再找回断点；切到「剥离至侧栏」后，三段核心论述瞬间首尾相连，辅助信息静候在右侧边道。",
  },
  split: {
    stat: "0 次行内打断 · 主文连贯 + 侧栏随时待命",
    caption:
      "辅助信息全部退居右侧深靛边道后，正文三段自然接续，不需要查术语的读者一路顺滑读完，需要定位或核对定义的人只需余光向右轻扫。",
  },
  scan: {
    stat: "主轴直下（绿） · 按需右瞥（橘） · 旧折返路径（淡红）",
    caption:
      "对比两条路径（示意）：混排时眼睛像锯齿一样被行内横幅拽停；分出侧栏后主阅读轴几乎垂直推进，只在遇到专业词时短暂右瞥再立刻回轨。",
  },
};
$$("[data-extract]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.extract;
    extractLab.dataset.mode = mode;
    $$("[data-extract]").forEach((b) => b.classList.toggle("is-active", b === btn));
    $("#extractStat").textContent = extractCopy[mode].stat;
    $("#extractCaption").textContent = extractCopy[mode].caption;
  });
});

// ============ 3. 第 02 节：左栏 vs 右栏 视线分布切台 ============
let posTask = "admin";
let posPlace = "left";

const POS_DATA = {
  admin: {
    left: {
      tone: "is-ok",
      badge: "契合左倾扫读",
      title: "高频导航放左侧，视线落地就能定位",
      desc: "复杂文档或后台系统里，用户每完成一步就要切频道。把目录锚在左侧，贴合从左到右阅读的起笔位置，无需横穿整块内容就能快速跳转。",
    },
    right: {
      tone: "is-err",
      badge: "违背导航预期",
      title: "主导航藏进右栏，每次切页都要横跨整屏",
      desc: "左到右阅读环境中，读者找全局菜单时本能先扫顶部和左侧。把一级目录推到右边缘，既要拖长鼠标路径，又容易撞上右栏盲视。",
    },
    dual: {
      tone: "is-mid",
      badge: "仅限宽屏控制台",
      title: "左目录 + 右属性面板，中区极易被夹窄",
      desc: "双侧栏只在 ≥1440px 专业工作台里成立；屏幕一缩到 1024px 笔记本，左右两栏就会把中间主操作区压成一条窄缝。",
    },
  },
  article: {
    left: {
      tone: "is-mid",
      badge: "可用但偏工具感",
      title: "长文配左栏：适合技术手册，偏弱化沉浸感",
      desc: "如果是查条目为主的技术手册，左侧固定目录很高效；但若是散文或特写专栏，深色左栏会抢走左半区约八成首眼关注。",
    },
    right: {
      tone: "is-ok",
      badge: "156 原海报经典解",
      title: "主文独占左半高注意区，右栏静静伴读",
      desc: "把正文与主视觉留在左侧最易进入的视野区，右侧窄栏承接词条释义、本页目录与延伸标签，主次顺序与视线顺序天然重合。",
    },
    dual: {
      tone: "is-mid",
      badge: "典型文档三栏（需宽屏）",
      title: "左全局树 + 中正文 + 右页内小纲",
      desc: "很多开发文档采用三栏：左栏管整站、右栏管当前页跳转。前提是中间正文区必须保底 600px 以上，并在中等屏先撤掉右栏。",
    },
  },
  checkout: {
    left: {
      tone: "is-err",
      badge: "主次颠倒",
      title: "核心提交按钮不该缩进窄侧栏",
      desc: "完成任务的关键操作必须留在主阅读轴的视觉终点。把结账或保存按钮塞到左侧边栏里，读者填完表还要回头向左寻找按钮。",
    },
    right: {
      tone: "is-err",
      badge: "高危 · 右栏盲视",
      title: "关键按钮放进右栏，最容易被当成广告跳过",
      desc: "NN/g 研究指出长期存在的右侧广告位训练出了右栏盲视。如果把重要提交入口、报错告警或优惠码输入埋在最右窄栏，极易被遗漏。",
    },
    dual: {
      tone: "is-err",
      badge: "双重干扰",
      title: "转化表单最怕左右夹击的逃生入口",
      desc: "填写订单或注册资料时，左右两侧多出来的导航与推荐都在诱惑用户离开流程。这类页面应当撤掉侧栏，改用专注单栏。",
    },
  },
};

function renderPosSvg() {
  const svg = $("#posSvg");
  const isLeft = posPlace === "left";
  const isDual = posPlace === "dual";

  let blocks = "";
  if (isDual) {
    blocks = `
      <rect x="20" y="18" width="132" height="236" fill="#061A36"/>
      <rect x="164" y="18" width="312" height="236" fill="#FBF5EC" stroke="#8EA7C5" stroke-width="1.5"/>
      <rect x="488" y="18" width="132" height="236" fill="#061A36"/>
      <text x="86" y="42" text-anchor="middle" fill="#F2994A" font-size="11" font-weight="700">左栏 · 目录</text>
      <text x="320" y="42" text-anchor="middle" fill="#061A36" font-size="12" font-weight="800">主内容区（52%）</text>
      <text x="554" y="42" text-anchor="middle" fill="#C5D5E8" font-size="11" font-weight="700">右栏 · 辅读</text>
    `;
  } else if (isLeft) {
    blocks = `
      <rect x="20" y="18" width="166" height="236" fill="#061A36"/>
      <rect x="198" y="18" width="422" height="236" fill="#FBF5EC" stroke="#8EA7C5" stroke-width="1.5"/>
      <text x="103" y="42" text-anchor="middle" fill="#F2994A" font-size="11.5" font-weight="700">左侧栏（27%）</text>
      <text x="409" y="42" text-anchor="middle" fill="#061A36" font-size="12.5" font-weight="800">主内容区（73%）</text>
    `;
  } else {
    blocks = `
      <rect x="20" y="18" width="422" height="236" fill="#FBF5EC" stroke="#8EA7C5" stroke-width="1.5"/>
      <rect x="454" y="18" width="166" height="236" fill="#061A36"/>
      <text x="231" y="42" text-anchor="middle" fill="#061A36" font-size="12.5" font-weight="800">主内容区（73%）</text>
      <text x="537" y="42" text-anchor="middle" fill="#F2994A" font-size="11.5" font-weight="700">右侧栏（27%）</text>
    `;
  }

  // 任务专属视觉标记 + 左倾注意热区示意（底部文字落在暖纸带，对比度全程清晰）
  const heat = `
    <ellipse cx="185" cy="122" rx="145" ry="70" fill="#D86817" opacity="0.22"/>
    <ellipse cx="120" cy="112" rx="76" ry="46" fill="#D86817" opacity="0.24"/>
    <rect x="20" y="262" width="600" height="28" fill="#EFE4D5" stroke="#D3C3AB" stroke-width="1"/>
    <circle cx="34" cy="276" r="5" fill="#D86817"/>
    <text x="45" y="280" fill="#7A3106" font-size="11.5" font-weight="700">左半视野：高关注区（NN/g 约八成注视，示意）</text>
    <text x="608" y="280" text-anchor="end" fill="#25486E" font-size="11.5" font-weight="700">右边缘：易生右栏盲视</text>
  `;

  let targetBadge = "";
  if (posTask === "checkout") {
    const bx = isLeft ? 48 : isDual ? 506 : 484;
    targetBadge = `
      <rect x="${bx}" y="136" width="108" height="36" fill="#B6241C" stroke="#FFFBF5" stroke-width="1.5"/>
      <text x="${bx + 54}" y="159" text-anchor="middle" fill="#FFFBF5" font-size="11.5" font-weight="800">核心提交按钮!</text>
    `;
  } else if (posTask === "admin") {
    const bx = isLeft ? 42 : isDual ? 34 : 476;
    const col = isLeft ? "#136B52" : isDual ? "#D86817" : "#B6241C";
    targetBadge = `
      <rect x="${bx}" y="82" width="118" height="96" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="5 3"/>
      <text x="${bx + 59}" y="126" text-anchor="middle" fill="#F6EBDC" font-size="11" font-weight="700">多级频道导航</text>
      <text x="${bx + 59}" y="146" text-anchor="middle" fill="#F2994A" font-size="10.5">${isLeft ? "直落首眼区" : "需跨屏寻找"}</text>
    `;
  } else {
    const bx = isLeft ? 232 : isDual ? 196 : 52;
    const bw = isDual ? 248 : 340;
    targetBadge = `
      <rect x="${bx}" y="82" width="${bw}" height="12" fill="#061A36" opacity="0.85"/>
      <rect x="${bx}" y="106" width="${bw - 24}" height="8" fill="#6A7D92"/>
      <rect x="${bx}" y="122" width="${bw - 10}" height="8" fill="#6A7D92"/>
      <rect x="${bx}" y="138" width="${bw - 40}" height="8" fill="#6A7D92"/>
      <rect x="${bx}" y="160" width="${bw - 16}" height="8" fill="#6A7D92"/>
    `;
  }

  svg.innerHTML = blocks + heat + targetBadge;

  const info = POS_DATA[posTask][posPlace];
  const badge = $("#posBadge");
  badge.textContent = info.badge;
  badge.className = `verdict-badge ${info.tone}`;
  $("#posTitle").textContent = info.title;
  $("#posDesc").textContent = info.desc;
}

$$("[data-postask]").forEach((btn) => {
  btn.addEventListener("click", () => {
    posTask = btn.dataset.postask;
    $$("[data-postask]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderPosSvg();
  });
});
$$("[data-posplace]").forEach((btn) => {
  btn.addEventListener("click", () => {
    posPlace = btn.dataset.posplace;
    $$("[data-posplace]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderPosSvg();
  });
});
renderPosSvg();

// ============ 4. 第 03 节：Every Layout 内在弹性侧栏实验 ============
let intW = 860;
let intBasis = 260;
let intMinPct = 60;

function updateIntrinsic() {
  const pad = 28; // 逻辑左右内边距 14 * 2
  const gap = 14;
  const inner = intW - pad;
  const thresholdOuter = Math.ceil((intBasis + gap) / (1 - intMinPct / 100) + pad);
  const stacked = intW < thresholdOuter;
  const mainPx = stacked ? inner : inner - intBasis - gap;
  const sidePx = stacked ? inner : intBasis;
  const mainShare = Math.round((mainPx / inner) * 100);

  // 窄屏下按同一比例等比缩放容器、basis 与 gap，保持真实 CSS Flexbox 在同一临界宽精确折行！
  const outer = $(".intrinsic-stage-outer");
  const availW = outer ? Math.max(240, outer.clientWidth - 30) : 1040;
  const scale = Math.min(1, availW / 1040);

  const box = $("#intSandbox");
  box.style.width = `${Math.round(intW * scale)}px`;
  box.style.padding = `${Math.max(6, Math.round(14 * scale))}px`;
  box.style.gap = `${Math.max(5, Math.round(gap * scale))}px`;
  $("#intDemoMain").style.minInlineSize = `${intMinPct}%`;
  $("#intDemoSide").style.flexBasis = `${Math.round(intBasis * scale)}px`;

  $("#intWVal").textContent = `${intW}px`;
  $("#intWidthTag").textContent = `容器宽 ${intW}px`;
  $("#intThresholdMark").textContent = `临界折行点：≈ ${thresholdOuter}px`;

  const st = $("#intStateTag");
  st.textContent = stacked ? `已自动上下堆叠（跌破 ${thresholdOuter}px）` : `并排模式 · 主区 ${mainShare}%`;
  st.className = `mono-tag ${stacked ? "is-stack" : "is-pass"}`;

  $("#intMainPxLabel").textContent = stacked ? `通栏实宽 ${mainPx}px (100%)` : `并排实宽 ${mainPx}px (${mainShare}%)`;
  $("#intSidePxLabel").textContent = stacked ? `下沉通栏 ${sidePx}px` : `侧栏基准 ${sidePx}px`;

  $("#intCodeBox").innerHTML = `<code>.with-sidebar { display: flex; flex-wrap: wrap; gap: 14px; }
.with-sidebar &gt; main  { flex-basis: 0; flex-grow: 999; min-inline-size: ${intMinPct}%; }
.with-sidebar &gt; aside { flex-basis: ${intBasis}px; flex-grow: 1; } /* 实算折行临界 ≈ ${thresholdOuter}px · 当前${stacked ? "已折行堆叠" : "并排生效"} */</code>`;
}

window.addEventListener("resize", updateIntrinsic);

$("#intContainerW").addEventListener("input", (e) => {
  intW = Number(e.target.value);
  updateIntrinsic();
});
$$("[data-basis]").forEach((btn) => {
  btn.addEventListener("click", () => {
    intBasis = Number(btn.dataset.basis);
    $$("[data-basis]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateIntrinsic();
  });
});
$$("[data-minpct]").forEach((btn) => {
  btn.addEventListener("click", () => {
    intMinPct = Number(btn.dataset.minpct);
    $$("[data-minpct]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateIntrinsic();
  });
});
updateIntrinsic();

// ============ 5. 第 04 节：clamp() 超宽封顶对比 + sticky 滚动伴行 ============
function updateClampMatrix(mode) {
  $$("#clampMatrix .vm-row").forEach((row) => {
    const vw = Number(row.dataset.vw);
    const sidePx =
      mode === "pct"
        ? Math.round(vw * 0.3)
        : Math.max(240, Math.min(340, Math.round(vw * 0.26)));
    const sidePct = Math.round((sidePx / vw) * 100);
    row.querySelector(".vm-main").style.width = `${100 - sidePct}%`;
    row.querySelector(".vm-side").style.width = `${sidePct}%`;
    row.querySelector(".vm-px").textContent = `${sidePx}px`;
    row.classList.toggle("is-bloated", sidePx > 420);
  });
  $("#clampNote").textContent =
    mode === "pct"
      ? "纯写 30% 时，1920px 桌面侧栏膨胀到 576px、2560px 超宽屏飙到 768px——比一台平板还宽，辅助栏彻底失控。"
      : "改用 clamp(240px, 26%, 340px) 后：768px 下保底 240px 不碎字，1920px 与 2560px 超宽屏稳稳封顶在 340px，余宽全部留给主内容与留白。";
}

$$("[data-widthrule]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$("[data-widthrule]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateClampMatrix(btn.dataset.widthrule);
  });
});
updateClampMatrix("pct");

$$("[data-sticky]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.sticky;
    $$("[data-sticky]").forEach((b) => b.classList.toggle("is-active", b === btn));
    $("#miniScrollShell").dataset.sticky = mode;
    $("#miniScrollShell").scrollTop = mode === "sticky" ? 130 : 0;
    $("#stickyNote").innerHTML =
      mode === "sticky"
        ? "已切换为 <code>position: sticky</code> 并向下滚动：目录始终安静停在视野一侧，右侧不再拖出大片空白死区。"
        : "向下滚动上方微型视窗试试：静态侧栏滚到中段后右侧全空；切到 <code>sticky</code> 后目录一直安静伴随在旁。";
  });
});

// ============ 6. 第 05 节：反例翻卡解剖 ============
const ANTI_SPEC = {
  immersion: {
    badTag: "反例 01 · 沉浸叙事",
    goodTag: "改用全出血单栏",
    badBtn: "看改用单栏",
    goodBtn: "回看硬加侧栏",
    badDesc: "常驻深色侧栏像一堵竖墙，硬生生砍掉三成画面呼吸，把全景照片和叙事节奏截成憋屈的方框。",
    goodDesc: "撤掉侧栏让画幅撑满视口，把章节目录折叠进角落极简按钮，照片景深和叙事沉浸感立刻完整回来。",
    badSvg: `<rect x="8" y="8" width="166" height="100" fill="#8EA7C5"/><circle cx="56" cy="36" r="14" fill="#D86817"/><path d="M8 108 L76 58 L142 108 Z" fill="#0C203D"/><rect x="174" y="8" width="78" height="100" fill="#061A36"/><line x1="174" y1="8" x2="174" y2="108" stroke="#B6241C" stroke-width="3"/><text x="213" y="62" text-anchor="middle" fill="#FF8A7A" font-size="11" font-weight="700">截断视野</text>`,
    goodSvg: `<rect x="8" y="8" width="244" height="100" fill="#8EA7C5"/><circle cx="72" cy="36" r="16" fill="#D86817"/><path d="M8 108 L98 48 L194 108 Z" fill="#0C203D"/><path d="M138 108 L208 60 L252 108 Z" fill="#25486E"/><rect x="206" y="16" width="38" height="16" fill="#061A36"/><text x="225" y="28" text-anchor="middle" fill="#F6EBDC" font-size="9.5">≡ 目录</text>`,
  },
  checkout: {
    badTag: "反例 02 · 单步转化",
    goodTag: "改用居中专注表单",
    badBtn: "看改用专注流",
    goodBtn: "回看硬加侧栏",
    badDesc: "表单任务需要线性推进到底。旁边摆满频道导航和推荐商品，等于亲手递给用户一排离开页面的逃生门。",
    goodDesc: "撤掉多余导航栏，居中定宽单栏只留当前步骤与主提交钮，消除分心干扰，表单一路到底。",
    badSvg: `<rect x="8" y="8" width="68" height="100" fill="#061A36"/><text x="42" y="34" text-anchor="middle" fill="#FF8A7A" font-size="10">逃生链接</text><rect x="20" y="46" width="44" height="6" fill="#8EA7C5"/><rect x="20" y="60" width="44" height="6" fill="#8EA7C5"/><rect x="20" y="74" width="44" height="6" fill="#8EA7C5"/><rect x="86" y="14" width="160" height="88" fill="#FBF5EC" stroke="#CEBEA6"/><rect x="100" y="30" width="132" height="14" fill="#EFE4D5"/><rect x="100" y="54" width="132" height="14" fill="#EFE4D5"/><rect x="100" y="78" width="76" height="16" fill="#D86817"/>`,
    goodSvg: `<rect x="52" y="10" width="156" height="96" fill="#FBF5EC" stroke="#136B52" stroke-width="2"/><rect x="68" y="24" width="124" height="14" fill="#EFE4D5"/><rect x="68" y="46" width="124" height="14" fill="#EFE4D5"/><rect x="68" y="72" width="124" height="20" fill="#136B52"/><text x="130" y="86" text-anchor="middle" fill="#FFFBF5" font-size="10.5" font-weight="700">专注完成提交</text>`,
  },
  narrow: {
    badTag: "反例 03 · 窄幅短文",
    goodTag: "改用简洁单栏卡",
    badBtn: "看撤掉边栏",
    goodBtn: "回看硬加侧栏",
    badDesc: "正文一共不到两百字，或者屏幕本就不到 600px，硬拆侧栏只会让主文碎成三四字一行，边栏还空荡荡没话可写。",
    goodDesc: "短通知直接单栏居中舒展排版，字距与留白一次到位，省掉毫无意义的空边栏。",
    badSvg: `<rect x="58" y="8" width="144" height="100" fill="#FBF5EC" stroke="#B6241C" stroke-width="1.5"/><rect x="148" y="8" width="54" height="100" fill="#061A36"/><rect x="68" y="24" width="68" height="6" fill="#6A7D92"/><rect x="68" y="36" width="60" height="6" fill="#6A7D92"/><rect x="68" y="48" width="66" height="6" fill="#6A7D92"/><text x="175" y="62" text-anchor="middle" fill="#FF8A7A" font-size="10">空栏</text>`,
    goodSvg: `<rect x="58" y="8" width="144" height="100" fill="#FBF5EC" stroke="#136B52" stroke-width="1.8"/><rect x="72" y="24" width="116" height="8" fill="#061A36"/><rect x="72" y="42" width="112" height="6" fill="#6A7D92"/><rect x="72" y="54" width="104" height="6" fill="#6A7D92"/><rect x="72" y="66" width="90" height="6" fill="#6A7D92"/><rect x="72" y="82" width="62" height="14" fill="#136B52"/>`,
  },
  blind: {
    badTag: "反例 04 · 关键动作",
    goodTag: "把核心动作放回主轴",
    badBtn: "看放回主线",
    goodBtn: "回看塞进右栏",
    badDesc: "右栏盲视会让读者自动把右侧小卡片归为广告或补充信息。凡是必须完成的操作与报错提示，都必须留在主阅读轴里。",
    goodDesc: "主线末尾直接承接关键动作与系统提示，右侧只留真正的延伸资料，用户绝不会漏看。",
    badSvg: `<rect x="8" y="8" width="164" height="100" fill="#FBF5EC" stroke="#CEBEA6"/><rect x="20" y="24" width="132" height="7" fill="#6A7D92"/><rect x="20" y="38" width="124" height="7" fill="#6A7D92"/><rect x="20" y="52" width="136" height="7" fill="#6A7D92"/><rect x="176" y="8" width="76" height="100" fill="#061A36"/><rect x="184" y="42" width="60" height="24" fill="#B6241C"/><text x="214" y="58" text-anchor="middle" fill="#FFFBF5" font-size="9.5">易漏按钮</text>`,
    goodSvg: `<rect x="8" y="8" width="164" height="100" fill="#FBF5EC" stroke="#136B52" stroke-width="1.5"/><rect x="20" y="22" width="132" height="7" fill="#6A7D92"/><rect x="20" y="36" width="124" height="7" fill="#6A7D92"/><rect x="20" y="50" width="110" height="7" fill="#6A7D92"/><rect x="20" y="70" width="94" height="22" fill="#136B52"/><text x="67" y="85" text-anchor="middle" fill="#FFFBF5" font-size="10">主轴终点按钮</text><rect x="176" y="8" width="76" height="100" fill="#061A36"/><rect x="186" y="28" width="54" height="5" fill="#8EA7C5"/><rect x="186" y="40" width="48" height="5" fill="#8EA7C5"/>`,
  },
};

function renderAntiCard(card) {
  const key = card.dataset.anti;
  const good = card.dataset.state === "good";
  const spec = ANTI_SPEC[key];
  card.querySelector(".anti-tag").textContent = good ? spec.goodTag : spec.badTag;
  const btn = card.querySelector(".btn-flip");
  btn.textContent = good ? spec.goodBtn : spec.badBtn;
  btn.setAttribute("aria-pressed", String(good));
  card.querySelector(".anti-desc").textContent = good ? spec.goodDesc : spec.badDesc;
  card.querySelector("svg").innerHTML = good ? spec.goodSvg : spec.badSvg;
}

$$(".anti-card").forEach((card) => {
  renderAntiCard(card);
  card.querySelector(".btn-flip").addEventListener("click", () => {
    card.dataset.state = card.dataset.state === "good" ? "bad" : "good";
    renderAntiCard(card);
  });
});

// ============ 7. 第 06 节：单变量小练习 ============
const QUIZ_ANSWERS = {
  A: {
    ok: false,
    title: "方案 A（86% : 14%）不稳：侧栏过窄窒息，主文反而太长",
    body: "很多人误以为「主区越宽越好」，但在 1280px 下 14% 侧栏仅约 179px，扣完内边距后目录与术语简注被迫断成三四个字的竖条；同时主区拉宽到 1100px 以上，长文单行过长容易在换行时串行。",
  },
  B: {
    ok: true,
    title: "答对了 · 方案 B（70% : 30%）站得住",
    body: "70% : 30% 稳稳落在 20%–36% 经验参考带内（也最接近 156 原海报的 68% : 32%）。1280px 桌面上主区约 896px 保证舒适阅读行宽，右栏约 384px 完整容纳目录与 3 条术语释义而不显拥挤，主次层次一眼分明。",
  },
  C: {
    ok: false,
    title: "方案 C（52% : 48%）失焦：接近对半平分，深色右栏反压主角",
    body: "虽然视觉上「两边都很宽」，但面积接近 1:1 会直接抹平主次层级。右侧本就采用了强对比深普鲁士靛底色，一膨到 48%，视线权重会瞬间倒向辅助栏。",
  },
  D: {
    ok: false,
    title: "方案 D（40% : 60%）喧宾夺主：辅助栏比主内容还大",
    body: "侧栏超过整页一半宽度后，真正该承载 1800 字专栏的主内容区反而被挤成一条窄带，完全背离了侧栏版式「内容优先」的初衷。",
  },
};

$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const choice = card.dataset.choice;
    const res = QUIZ_ANSWERS[choice];
    $$(".quiz-card").forEach((c) => {
      c.classList.remove("is-right", "is-wrong");
      if (c === card) c.classList.add(res.ok ? "is-right" : "is-wrong");
      else if (c.dataset.choice === "B" && !res.ok) c.classList.add("is-right");
    });
    const fb = $("#quizFeedback");
    fb.className = `quiz-feedback ${res.ok ? "is-right" : "is-wrong"}`;
    fb.innerHTML = `<h3>${res.title}</h3><p>${res.body}</p>`;
  });
});

// ============ 8. 第 07 节：原海报放大灯箱（复用 #poster.src，绝不二次内联） ============
const lightbox = $("#posterLightbox");
const lbImg = $("#lbImg");
const lbViewport = $("#lbViewport");
const lbScale = $("#lbScale");
let zoom = 1;
let panX = 0;
let panY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  lbScale.textContent = `${Math.round(zoom * 100)}%`;
}

function openLightbox() {
  if (!lbImg.getAttribute("src")) {
    lbImg.src = $("#poster").src;
  }
  zoom = 1;
  panX = 0;
  panY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lbClose").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  $("#posterOpenBtn").focus();
}

$("#posterOpenBtn").addEventListener("click", openLightbox);
$("#lbClose").addEventListener("click", closeLightbox);
$("#lbZoomIn").addEventListener("click", () => {
  zoom = Math.min(3.5, +(zoom + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lbZoomOut").addEventListener("click", () => {
  zoom = Math.max(0.6, +(zoom - 0.35).toFixed(2));
  applyLbTransform();
});
$("#lbReset").addEventListener("click", () => {
  zoom = 1;
  panX = 0;
  panY = 0;
  applyLbTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  zoom = Math.max(0.6, Math.min(3.5, +(zoom + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && zoom <= 1.05) {
    closeLightbox();
    return;
  }
  lbDrag = { id: e.pointerId, sx: e.clientX - panX, sy: e.clientY - panY };
  lbViewport.classList.add("is-dragging");
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag || lbDrag.id !== e.pointerId) return;
  panX = e.clientX - lbDrag.sx;
  panY = e.clientY - lbDrag.sy;
  applyLbTransform();
});
const endLbDrag = (e) => {
  if (!lbDrag || lbDrag.id !== e.pointerId) return;
  lbDrag = null;
  lbViewport.classList.remove("is-dragging");
};
lbViewport.addEventListener("pointerup", endLbDrag);
lbViewport.addEventListener("pointercancel", endLbDrag);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});
