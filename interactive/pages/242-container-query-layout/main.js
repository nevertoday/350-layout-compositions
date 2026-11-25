// 242 容器查询布局 · 主控脚本与 7 节独立交互模块

import {
  PRESETS,
  SLOT_META,
  THEMES,
  clampSlotW,
  createBrokenState,
  evaluate,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";

// ==================== 开场同屏三槽组件自治实验室 ====================
let state = createBrokenState("poster");
let evalCache = evaluate(state);

const els = {
  score: document.getElementById("hero-score"),
  titleFrame: document.getElementById("title-frame"),
  titleTag: document.getElementById("title-frame-tag"),
  emblemBar: document.getElementById("emblem-bar"),
  pilContainer: document.getElementById("pil-container"),
  pilComponent: document.getElementById("pil-component"),
  pilQuery: document.getElementById("pil-query"),
  diagCard: document.getElementById("diag-card"),
  diagTag: document.getElementById("diag-tag"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagAct: document.getElementById("diag-act"),
  dmVp: document.getElementById("dm-vp"),
  dmFocus: document.getElementById("dm-focus"),
  dmTiers: document.getElementById("dm-tiers"),
  dmOv: document.getElementById("dm-ov"),
  liveCss: document.getElementById("live-css"),
  slM: document.getElementById("sl-m"),
  slL: document.getElementById("sl-l"),
  slMVal: document.getElementById("sl-m-val"),
  slLVal: document.getElementById("sl-l-val"),
  slBand: document.getElementById("sl-band"),
  mqQuery: document.getElementById("mq-query"),
  mqContain: document.getElementById("mq-contain"),
  mqAutonomy: document.getElementById("mq-autonomy"),
  mqSolve: document.getElementById("mq-solve"),
};

let heroCanvasApi = null;
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const queryBtns = [...document.querySelectorAll("[data-query]")];
const ctypeBtns = [...document.querySelectorAll("[data-ctype]")];
const autoBtns = [...document.querySelectorAll("[data-auto]")];
const vpBtns = [...document.querySelectorAll("[data-vp]")];
const lastDom = {};
function setText(key, el, val) {
  if (!el || lastDom[key] === val) return;
  lastDom[key] = val;
  el.textContent = val;
}

function syncHeroUI(controlsChanged = true) {
  evalCache = evaluate(state);
  const ev = evalCache;
  const active = ev.slots[state.activeSlot] || ev.slots[1];
  const g = ev.theme.geom;

  // 顶部状态丸（仅值变化时改 DOM，避免拖拽高频触发样式重算）
  const scoreTxt = ev.passed === 4 ? "4 / 4 自治成立" : `${ev.passed} / 4 待校自治`;
  setText("score", els.score, scoreTxt);
  const scoreCls =
    "score-pill " +
    (ev.passed === 4 ? "is-ok" : ev.diag.level === "warn" ? "is-warn" : "is-err");
  if (els.score.className !== scoreCls) els.score.className = scoreCls;

  // 自示范大标实时 inline-size 括号
  const okHeader = ev.checks.queryOk && ev.checks.containOk;
  const okStr = String(okHeader);
  if (els.titleFrame.dataset.ok !== okStr) els.titleFrame.dataset.ok = okStr;
  setText(
    "titleTag",
    els.titleTag,
    okHeader
      ? `${active.name} ${active.w}px · inline-size`
      : state.containerType === "size"
        ? "size 双轴 · 高度塌陷 0px"
        : state.queryMode === "viewport"
          ? `@media 锁死 ${state.viewportW}px`
          : "漏写 container-type"
  );

  // 原海报右上几何徽章姜黄块随聚焦槽宽微调宽度
  if (els.emblemBar) {
    const bw = String(Math.round(18 + ((active.w - 180) / (760 - 180)) * 28));
    if (lastDom.emblemBw !== bw) {
      lastDom.emblemBw = bw;
      els.emblemBar.setAttribute("width", bw);
    }
  }

  // 原海报三支柱状态灯
  const pilMap = {
    container: els.pilContainer,
    component: els.pilComponent,
    query: els.pilQuery,
  };
  for (const p of ev.pillars) {
    const el = pilMap[p.id];
    if (!el) continue;
    setText("pil_" + p.id, el, p.status);
    el.classList.toggle("is-ok", p.ok);
  }

  // 暖米单真源诊单
  if (els.diagCard.dataset.level !== ev.diag.level) els.diagCard.dataset.level = ev.diag.level;
  setText("diagTag", els.diagTag, ev.diag.tag);
  setText("diagTitle", els.diagTitle, ev.diag.title);
  setText("diagBody", els.diagBody, ev.diag.body);
  setText("diagAct", els.diagAct, ev.diag.action);

  setText("dmVp", els.dmVp, `${state.viewportW}px`);
  setText("dmFocus", els.dmFocus, `${active.w}px · ${active.cqiUnit}px`);
  setText(
    "dmTiers",
    els.dmTiers,
    ev.slots
      .map((s) => (s.renderedTier === "COLLAPSE" ? "0px" : s.renderedTier === "FALLBACK" ? "未命中" : s.renderedTier))
      .join(" / ")
  );
  const ovTxt = ev.slots.some((s) => s.renderedTier === "COLLAPSE")
    ? "高度塌陷"
    : ev.worstOverflow > 0
      ? `+${ev.worstOverflow}px`
      : "0px 贴合";
  setText("dmOv", els.dmOv, ovTxt);
  const ovCls = "mono " + (ev.worstOverflow > 0 || ev.slots.some((s) => s.renderedTier === "COLLAPSE") ? "is-bad" : "is-good");
  if (els.dmOv.className !== ovCls) els.dmOv.className = ovCls;

  setText("liveCss", els.liveCss, ev.css);

  if (controlsChanged) {
    themeBtns.forEach((b) => {
      const on = b.dataset.theme === state.themeId;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    queryBtns.forEach((b) => {
      const on = b.dataset.query === state.queryMode;
      b.classList.toggle("is-active", on);
      b.classList.toggle("is-bad", b.dataset.query === "viewport");
    });
    ctypeBtns.forEach((b) => {
      const on = b.dataset.ctype === state.containerType;
      b.classList.toggle("is-active", on);
      b.classList.toggle("is-bad", b.dataset.ctype !== "inline-size");
    });
    const autoKey =
      state.autonomyMode === "slot-patch"
        ? "slot-patch"
        : state.unitMode === "vw"
          ? "auto-vw"
          : state.unitMode === "rem"
            ? "auto-rem"
            : "auto-cqi";
    autoBtns.forEach((b) => {
      const on = b.dataset.auto === autoKey;
      b.classList.toggle("is-active", on);
      b.classList.toggle("is-bad", b.dataset.auto === "slot-patch" || b.dataset.auto === "auto-vw");
    });
    vpBtns.forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.vp) === state.viewportW);
    });

    els.slM.value = String(state.bpM);
    els.slL.value = String(state.bpL);
    setText("slMVal", els.slMVal, `${state.bpM}px`);
    setText("slLVal", els.slLVal, `${state.bpL}px`);
    setText("slBand", els.slBand, `「${ev.theme.label}」经验安全带：M ${g.safeM[0]}–${g.safeM[1]}px · L ${g.safeL[0]}–${g.safeL[1]}px（差值 ≥ ${g.minGap}px）`);

    if (els.mqQuery) {
      els.mqQuery.classList.toggle("is-on", state.queryMode === "container");
      els.mqContain.classList.toggle("is-on", state.containerType === "inline-size");
      els.mqAutonomy.classList.toggle("is-on", state.autonomyMode === "autonomous" && state.unitMode !== "vw");
    }
  }

  if (heroCanvasApi) heroCanvasApi.draw();
}

function patchHero(patch) {
  let changed = false;
  if (typeof patch.slotIndex === "number" && typeof patch.slotW === "number") {
    const nw = clampSlotW(patch.slotW);
    if (state.slots[patch.slotIndex].w !== nw) {
      state.slots[patch.slotIndex].w = nw;
      changed = true;
    }
  }
  if (typeof patch.activeSlot === "number" && state.activeSlot !== patch.activeSlot) {
    state.activeSlot = patch.activeSlot;
    changed = true;
  }
  if (changed) syncHeroUI(false);
}

const heroCanvas = document.getElementById("hero-canvas");
heroCanvasApi = mountHeroCanvas(heroCanvas, () => state, () => evalCache, patchHero);

// 绑定开场控件事件
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.themeId = btn.dataset.theme;
    syncHeroUI();
  });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const fn = PRESETS[btn.dataset.preset];
    if (!fn) return;
    state = fn(state.themeId);
    syncHeroUI();
  });
});

document.querySelectorAll("[data-query]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.queryMode = btn.dataset.query;
    syncHeroUI();
  });
});

document.querySelectorAll("[data-ctype]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.containerType = btn.dataset.ctype;
    syncHeroUI();
  });
});

document.querySelectorAll("[data-auto]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const v = btn.dataset.auto;
    if (v === "slot-patch") {
      state.autonomyMode = "slot-patch";
      state.unitMode = "vw";
    } else if (v === "auto-vw") {
      state.autonomyMode = "autonomous";
      state.unitMode = "vw";
    } else if (v === "auto-rem") {
      state.autonomyMode = "autonomous";
      state.unitMode = "rem";
    } else {
      state.autonomyMode = "autonomous";
      state.unitMode = "cqi";
    }
    syncHeroUI();
  });
});

document.querySelectorAll("[data-vp]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.viewportW = Number(btn.dataset.vp);
    syncHeroUI();
  });
});

els.slM.addEventListener("input", () => {
  state.bpM = Number(els.slM.value);
  syncHeroUI();
});
els.slL.addEventListener("input", () => {
  state.bpL = Number(els.slL.value);
  syncHeroUI();
});

// 手机快捷按钮
els.mqQuery?.addEventListener("click", () => {
  state.queryMode = state.queryMode === "container" ? "viewport" : "container";
  syncHeroUI();
});
els.mqContain?.addEventListener("click", () => {
  state.containerType = state.containerType === "inline-size" ? "none" : "inline-size";
  syncHeroUI();
});
els.mqAutonomy?.addEventListener("click", () => {
  if (state.autonomyMode === "slot-patch") {
    state.autonomyMode = "autonomous";
    state.unitMode = "cqi";
  } else {
    state.autonomyMode = "slot-patch";
    state.unitMode = "vw";
  }
  syncHeroUI();
});
els.mqSolve?.addEventListener("click", () => {
  state = PRESETS.posterSol(state.themeId);
  syncHeroUI();
});

syncHeroUI();

// ==================== 01 节：原生 @container 实弹搬家台 ====================
const S1_SLOTS = {
  rail: { label: "侧边窄栏 · inline-size", targetW: 248 },
  drawer: { label: "抽屉面板 · inline-size", targetW: 312 },
  split: { label: "双栏卡片格 · inline-size", targetW: 440 },
  hero: { label: "主内容通栏 · inline-size", targetW: 640 },
};

const s1Host = document.getElementById("s1-host");
const s1SlotLabel = document.getElementById("s1-slot-label");
const s1SlotPx = document.getElementById("s1-slot-px");
const s1Rules = document.querySelectorAll("#s1-rules li");

function updateS1Measure() {
  if (!s1Host) return;
  const actualW = Math.round(s1Host.getBoundingClientRect().width);
  const innerW = Math.max(0, actualW - 28); // 扣除边框与内边距，反映真实容器查询内宽
  s1SlotPx.textContent = `${actualW}px`;
  const hit = innerW >= 510 ? "wide" : innerW >= 330 ? "mid" : "base";
  s1Rules.forEach((li) => li.classList.toggle("is-hit", li.dataset.rule === hit));
}

document.querySelectorAll("[data-slot]").forEach((btn) => {
  if (btn.id === "s1-host") return;
  btn.addEventListener("click", () => {
    const key = btn.dataset.slot;
    const cfg = S1_SLOTS[key];
    if (!cfg) return;
    s1Host.dataset.slot = key;
    s1SlotLabel.textContent = cfg.label;
    document.querySelectorAll(".slot-switcher [data-slot]").forEach((b) => {
      const on = b.dataset.slot === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    // 动画过渡中与结束后都读真实实测宽度
    updateS1Measure();
    setTimeout(updateS1Measure, 320);
  });
});

if (typeof ResizeObserver !== "undefined" && s1Host) {
  new ResizeObserver(updateS1Measure).observe(s1Host);
}
updateS1Measure();

// ==================== 02 节：布局引擎循环步进器 ====================
const LOOP_STEPS = {
  cycle: [
    {
      n1: ["量得自身宽度", "width = 300px"],
      n2: ["命中自查规则", "≥ 290px → 缩字号"],
      n3: ["等待重排", "下一步计算内容"],
      banner: "第 1 步 / 4：盒子量得自己 300px，命中“宽 ≥ 290px 就缩小字号”",
      cap: "规则还没应用，目前盒子靠文字撑开成 300px 宽。",
      hi: "node-measure",
    },
    {
      n1: ["原测量值", "width = 300px"],
      n2: ["样式已生效", "font-size: 12px"],
      n3: ["准备重新排版", "字变小，文本变短"],
      banner: "第 2 步 / 4：样式阶段把字号改小，文字总宽度随之缩水",
      cap: "没有隔离时，盒子宽度由内部文字决定——文字变短埋下了反推隐患。",
      hi: "node-style",
    },
    {
      n1: ["旧值失效", "300px → 268px"],
      n2: ["字号 12px", "引发尺寸变化"],
      n3: ["反推自身变窄", "新宽 = 268px"],
      banner: "第 3 步 / 4：布局算完，盒子被变短的文字缩成 268px（跌破 290px！）",
      cap: "注意下方红色回环：布局结果反向推翻了第 1 步的测量前提！",
      hi: "node-layout",
    },
    {
      n1: ["重测 268px", "条件又不成立了"],
      n2: ["撤销小字号", "font-size 弹回 16px"],
      n3: ["撑回 300px", "下一帧再次震荡 →"],
      banner: "第 4 步 / 4：撤销规则后盒子又撑回 300px——无限循环，浏览器无法收敛",
      cap: "这就是“元素查询”卡死浏览器的根本原因：元素不能既被内容撑宽，又靠自身宽改内容。",
      hi: "feedback",
    },
  ],
  contain: [
    {
      n1: ["量祖先容器宽", "container = 300px"],
      n2: ["等待查询匹配", "@container (≥ 290px)"],
      n3: ["子卡片待排", "外框已锁单轴"],
      banner: "第 1 步 / 4：父容器声明 inline-size，宽度只由外部网格给定（300px）",
      cap: "David Baron 2020 方案核心：父容器宽度与子内容脱钩，先稳住查询基准。",
      hi: "node-measure",
    },
    {
      n1: ["容器宽锁稳", "container = 300px"],
      n2: ["子卡片命中规则", "切换横排 + 调字号"],
      n3: ["准备内部排版", "只影响后代元素"],
      banner: "第 2 步 / 4：后代卡片读取祖先 300px，放心切换样式与字号",
      cap: "组件查的是祖先，改的是自己，职责拆成两层。",
      hi: "node-style",
    },
    {
      n1: ["容器宽不变", "仍是 300px"],
      n2: ["样式稳定", "无需回滚"],
      n3: ["内部排版完成", "高度可自然撑开"],
      banner: "第 3 步 / 4：子内容变化被翠绿 inline-size 防火墙挡住，绝不反推父宽",
      cap: "因为只隔离行内轴（宽），高度依然可以跟着文字行数自然增高。",
      hi: "node-layout",
    },
    {
      n1: ["基准不变", "300px 恒定"],
      n2: ["规则恒定", "0 次回滚"],
      n3: ["1 轮收敛绘制 ✓", "性能与弹性兼得"],
      banner: "第 4 步 / 4：无回环、1 轮收敛——这就是现代 @container 能落地的原理",
      cap: "用一层薄薄的 inline-size 隔离，换来了彻底的组件自治与稳定帧率。",
      hi: "wall",
    },
  ],
};

let loopMode = "cycle";
let loopStep = 0;

function renderLoopStepper() {
  const s = LOOP_STEPS[loopMode][loopStep];
  document.getElementById("s2-n1-title").textContent = s.n1[0];
  document.getElementById("s2-n1-sub").textContent = s.n1[1];
  document.getElementById("s2-n2-title").textContent = s.n2[0];
  document.getElementById("s2-n2-sub").textContent = s.n2[1];
  document.getElementById("s2-n3-title").textContent = s.n3[0];
  document.getElementById("s2-n3-sub").textContent = s.n3[1];
  document.getElementById("s2-banner").textContent = s.banner;
  document.getElementById("s2-caption").textContent = s.cap;

  const wall = document.getElementById("s2-wall");
  const fb = document.getElementById("s2-feedback");
  const fba = document.getElementById("s2-fb-arrow");
  const isContain = loopMode === "contain";
  wall.setAttribute("opacity", isContain ? "1" : "0");
  fb.setAttribute("stroke", isContain ? "rgba(103,200,157,0.28)" : "#FF7E75");
  fba.setAttribute("fill", isContain ? "rgba(103,200,157,0.28)" : "#FF7E75");

  ["node-measure", "node-style", "node-layout"].forEach((id) => {
    const rect = document.querySelector(`#${id} rect`);
    rect.setAttribute("stroke-width", s.hi === id ? "3.5" : "1.5");
    rect.setAttribute("fill", s.hi === id ? "#311a73" : "#231257");
  });
}

document.querySelectorAll("[data-loop-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    loopMode = btn.dataset.loopMode;
    loopStep = 0;
    document.querySelectorAll("[data-loop-mode]").forEach((b) => {
      const on = b.dataset.loopMode === loopMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderLoopStepper();
  });
});

document.getElementById("s2-step")?.addEventListener("click", () => {
  loopStep = (loopStep + 1) % 4;
  renderLoopStepper();
});
document.getElementById("s2-reset")?.addEventListener("click", () => {
  loopStep = 0;
  renderLoopStepper();
});
renderLoopStepper();

// ==================== 03 节：cqi 连续游标卡尺 ====================
let s3Unit = "cqi";
const s3Range = document.getElementById("s3-width");
const s3WRead = document.getElementById("s3-w-read");
const s3Card = document.getElementById("s3-card");
const s3Badge = document.getElementById("s3-badge");
const s3UnitTag = document.getElementById("s3-unit-tag");
const s3Title = document.getElementById("s3-card-title");
const s3Text = document.getElementById("s3-card-text");
const mFont = document.getElementById("m-font");
const mFontV = document.getElementById("m-font-v");
const mPad = document.getElementById("m-pad");
const mPadV = document.getElementById("m-pad-v");
const mRatio = document.getElementById("m-ratio");
const mRatioV = document.getElementById("m-ratio-v");
const s3Note = document.getElementById("s3-note");

function renderS3() {
  const w = Number(s3Range.value);
  const cqi = +(w / 100).toFixed(2);
  let fontPx, padPx, formula, note, ratioText, warn = false;

  if (s3Unit === "cqi") {
    fontPx = +(Math.max(14, Math.min(24, w * 0.045))).toFixed(1);
    padPx = +(Math.max(12, Math.min(26, w * 0.042))).toFixed(1);
    formula = "clamp(14px, 4.5cqi, 24px)";
    ratioText = "贴合容器";
    note = `当前容器宽 ${w}px（1cqi = ${cqi}px），字号与内边距按容器宽线性呼吸，并被 clamp() 护在 14–24px 可读区间内。`;
  } else if (s3Unit === "vw") {
    // 假定桌面视口固定 1440px → 1.9vw 恒定为 27.4px！
    fontPx = 27.4;
    padPx = 28.8;
    formula = "1.9vw（1440 视口锁死）";
    warn = w < 380;
    ratioText = warn ? "窄槽爆大" : "碰巧还行";
    note = warn
      ? `容器已经缩到 ${w}px，但 1.9vw 仍然盯着 1440px 窗口算出 27.4px 巨字！窄侧栏里两三个字就被迫折行。`
      : `容器拉到 ${w}px 时 27.4px 看似还能接受，可一旦缩回 260px 侧栏，vw 立刻失控——它根本不知道容器有多宽。`;
  } else {
    fontPx = 16;
    padPx = 14;
    formula = "font-size: 16px（死值）";
    warn = w > 540 || w < 230;
    ratioText = w > 540 ? "宽槽偏小" : w < 230 ? "窄槽偏挤" : "静态稳定";
    note =
      w > 540
        ? `容器宽达 ${w}px 时，锁死 16px 标题和 14px 内边距显得像一张小名片，缺少随宽展开的节奏感。`
        : "固定像素简单稳妥，但跨度超过 2 倍的窄/宽插槽之间缺乏呼吸感，常需额外多写几档 @container 断点。";
  }

  s3WRead.textContent = `${w}px · 1cqi = ${cqi.toFixed(2)}px`;
  s3Card.style.width = `${w}px`;
  s3Card.style.padding = `${padPx}px`;
  s3Card.style.borderColor = warn ? "#FF7E75" : "#67C89D";
  s3Badge.textContent = `100cqi = ${w}px`;
  s3UnitTag.textContent = formula;
  s3Title.style.fontSize = `${fontPx}px`;
  s3Text.style.fontSize = `${Math.max(12, Math.min(15, fontPx * 0.72)).toFixed(1)}px`;

  mFont.style.width = `${Math.min(100, (fontPx / 28) * 100)}%`;
  mFont.classList.toggle("is-warn", warn);
  mFontV.textContent = `${fontPx}px`;

  mPad.style.width = `${Math.min(100, (padPx / 30) * 100)}%`;
  mPad.classList.toggle("is-warn", warn);
  mPadV.textContent = `${padPx}px`;

  const charsPerLine = Math.max(4, Math.round((w - padPx * 2) / fontPx));
  mRatio.style.width = `${Math.min(100, warn ? 28 : Math.min(94, charsPerLine * 5.2))}%`;
  mRatio.classList.toggle("is-warn", warn);
  mRatioV.textContent = ratioText;
  s3Note.textContent = note;
}

s3Range?.addEventListener("input", renderS3);
document.querySelectorAll("[data-s3-unit]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s3Unit = btn.dataset.s3Unit;
    document.querySelectorAll("[data-s3-unit]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.s3Unit === s3Unit);
    });
    renderS3();
  });
});
renderS3();

// ==================== 04 节：两坑 DOM 诊所 ====================
const pit1Box = document.getElementById("pit1-box");
const pit1Read = document.getElementById("pit1-readout");
const PIT1_MAP = {
  "size-auto": {
    cls: "is-collapsed",
    html: "当前实测容器高：<strong>0px（已塌陷）</strong>——<code>size</code> 切断了内容撑高通道，内部文字溢出到容器外面。",
  },
  "size-fixed": {
    cls: "is-fixed",
    html: "当前实测容器高：<strong>136px（人为锁死）</strong>——高度保住了，但如果以后文案增减，仍可能溢字或留白，仅在明确要查高度时使用。",
  },
  inline: {
    cls: "is-auto",
    html: "当前实测容器高：<strong>随内容自然撑开（推荐）</strong>——<code>inline-size</code> 只隔离宽度、不锁高度，日常卡片布局几乎都选它。",
  },
};

document.querySelectorAll("[data-pit1]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.pit1;
    const cfg = PIT1_MAP[k];
    if (!cfg) return;
    pit1Box.className = "pit1-box " + cfg.cls;
    pit1Read.innerHTML = cfg.html;
    document.querySelectorAll("[data-pit1]").forEach((b) => {
      const on = b.dataset.pit1 === k;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  });
});

const pit2In = document.getElementById("pit2-pop-in");
const pit2Out = document.getElementById("pit2-pop-out");
const pit2Read = document.getElementById("pit2-readout");

document.querySelectorAll("[data-pit2]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const escaped = btn.dataset.pit2 === "escaped";
    pit2In.hidden = escaped;
    pit2Out.hidden = !escaped;
    pit2Read.innerHTML = escaped
      ? "<strong>已解困</strong>：把弹窗渲染在容器之外（或使用原生 Popover / Dialog 进入 Top Layer），就能绕开父容器的包含块与层叠限制。"
      : "留在声明了 <code>container-type</code> 的父盒内时，全屏遮罩或下拉浮层会被新包含块锁在卡片边框里。";
    document.querySelectorAll("[data-pit2]").forEach((b) => {
      const on = b.dataset.pit2 === btn.dataset.pit2;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  });
});

// ==================== 05 节：6 卡需求分拣台 ====================
const SORT_CASES = [
  {
    badge: "用 @container",
    cls: "is-use",
    title: "典型主角场景：给外层插槽挂 inline-size",
    why: "侧栏和主区处在同一个 1440px 窗口里，@media 根本分不出谁宽谁窄；把查询交给容器，卡片就能在两个位置各用最合适的排法。",
    code: `.slot { container-type: inline-size; }\n@container (width >= 400px) { .card { display: grid; grid-template-columns: 140px 1fr; } }`,
  },
  {
    badge: "改用 @media",
    cls: "is-alt",
    title: "页面全局壳层：交给视口媒体查询",
    why: "顶栏展开还是折叠成汉堡抽屉，本身就取决于整块屏幕宽度；直接用 @media 更干净，也不会给顶栏里的下拉菜单引入额外包含块限制。",
    code: `@media (max-width: 768px) {\n  .site-nav { display: none; }\n  .menu-toggle { display: inline-flex; }\n}`,
  },
  {
    badge: "禁止 inline-size",
    cls: "is-no",
    title: "内容自撑宽元素：千万别设尺寸隔离",
    why: "胶囊标签靠文字长度自然撑开宽度。给它加 container-type: inline-size 会切断内容宽度上报，盒子当场缩为 0px 或折碎。",
    code: `.tag-pill { display: inline-flex; width: fit-content; /* 不写 container-type */ }`,
  },
  {
    badge: "用 @container",
    cls: "is-use",
    title: "用户可调分屏面板：容器查询无可替代",
    why: "浏览器窗口 1 像素都没动，但用户在后台把中间分隔条拉宽或挤窄；只有容器查询能实时感知面板内宽并重排图表与指标列。",
    code: `.pane { container: widget / inline-size; }\n@container widget (width >= 520px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }`,
  },
  {
    badge: "改用 Subgrid",
    cls: "is-alt",
    title: "跨兄弟卡严格对齐行高：优先子网格",
    why: "container-type 的布局隔离会把父网格轨道拦在门外，导致子卡之间无法共享行线；跨卡对齐价格与按钮底线应交给 228 子网格布局。",
    code: `.pricing-row { display: grid; grid-template-columns: repeat(3, 1fr); }\n.plan-card { display: grid; grid-row: span 3; grid-template-rows: subgrid; }`,
  },
  {
    badge: "改用 auto-fit 网格",
    cls: "is-alt",
    title: "只变列数、单卡结构不变：一行 Grid 足够",
    why: "如果每张照片卡片自身始终是“上图下文”、只需要随可用空间自动增减列数，CSS Grid 的 minmax() 一行就能做到，无需写任何查询规则。",
    code: `.gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }`,
  },
];

const svBadge = document.getElementById("sv-badge");
const svTitle = document.getElementById("sv-title");
const svWhy = document.getElementById("sv-why");
const svCode = document.getElementById("sv-code");

document.querySelectorAll("#sort-cards .scard").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = SORT_CASES[Number(btn.dataset.case)];
    if (!item) return;
    svBadge.textContent = item.badge;
    svBadge.className = "sv-badge " + item.cls;
    svTitle.textContent = item.title;
    svWhy.textContent = item.why;
    svCode.textContent = item.code;
    document.querySelectorAll("#sort-cards .scard").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  });
});

// ==================== 06 节：练一练单变量四选一 ====================
const QUIZ_ANSWERS = {
  A: {
    ok: false,
    title: "A 不对：@media 只认 1280px 视口，260px 侧栏被硬挤爆",
    body: "1280px 早已超过 600px，所以连最窄的 260px 侧栏也被强行切进 160px 配图横排，剩下不到 80px 给标题和按钮，直接溢出挤碎。",
  },
  B: {
    ok: false,
    title: "B 不对：container-type: size 未写固定高度，三槽集体塌陷",
    body: "size 会把宽、高两轴都与内部内容隔离。height: auto 下浏览器不再靠卡片文字撑开容器高度，三座插槽压成一条细缝。",
  },
  C: {
    ok: true,
    title: "选对了！C 让三座插槽在同一个 1280px 视口下各自成立",
    body: "inline-size 只隔离行内宽度、保留高度自然撑开；380px 与 560px 两道门槛恰好让 260px 走紧凑态、460px 走平衡态、700px 走展开态，三个位置同时健康。",
  },
  D: {
    ok: false,
    title: "D 不对：门槛设得太晚（640px），460px 中槽被迫卡死窄版",
    body: "虽然声明了 inline-size，但唯一门槛卡在 640px，导致宽裕的 460px 分栏依然退守极窄紧凑态，右侧空出一大片无用留白。",
  },
};

const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");

document.querySelectorAll("#quiz-grid .qcard").forEach((btn) => {
  btn.addEventListener("click", () => {
    const opt = btn.dataset.opt;
    const ans = QUIZ_ANSWERS[opt];
    if (!ans) return;
    document.querySelectorAll("#quiz-grid .qcard").forEach((b) => {
      const o = b.dataset.opt;
      b.classList.toggle("is-picked", o === opt);
      b.classList.toggle("is-right", o === "C");
      b.classList.toggle("is-wrong", o === opt && o !== "C");
      b.setAttribute("aria-pressed", String(o === opt));
    });
    quizVerdict.className = "quiz-verdict " + (ans.ok ? "is-right" : "is-wrong");
    qvTitle.textContent = ans.title;
    qvBody.textContent = ans.body;
  });
});

// ==================== 07 节：原海报放大拖拽灯箱 ====================
const posterImg = document.getElementById("poster");
const posterBtn = document.getElementById("poster-btn");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbClose = document.getElementById("lb-close");
const lbReset = document.getElementById("lb-zoom-reset");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  // 复用已内联的原海报 data URI，绝不二次内联图片
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1.25;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn?.addEventListener("click", openLightbox);
lbClose?.addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in")?.addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-zoom-out")?.addEventListener("click", () => {
  lbScale = Math.max(0.75, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
lbReset?.addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});

lbStage?.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy, id: e.pointerId };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage?.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = lbDrag.tx + (e.clientX - lbDrag.x);
  lbTy = lbDrag.ty + (e.clientY - lbDrag.y);
  applyLbTransform();
});
lbStage?.addEventListener("pointerup", () => { lbDrag = null; });
lbStage?.addEventListener("pointercancel", () => { lbDrag = null; });
lbStage?.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.75, Math.min(3, +(lbScale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
