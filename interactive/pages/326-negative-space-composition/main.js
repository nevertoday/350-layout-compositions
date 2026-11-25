// 326 留白构图 · 主控脚本（开场联动 + 第 01–07 节独立交互 + 原海报灯箱）

import { createInitialState, evaluate, PRESETS, THEMES } from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";

// ==================== 开场：单真源状态与 UI 联动 ====================
const state = createInitialState();
const heroCanvas = document.getElementById("hero-canvas");

const elStamp = document.getElementById("hero-stamp");
const elTitle = document.getElementById("hero-title");
const elRule = document.getElementById("poster-rule");
const elScaleRange = document.getElementById("scale-range");
const elScaleVal = document.getElementById("scale-val");
const elVoidBtn = document.getElementById("btn-void-map");

const elDiagTag = document.getElementById("diag-tag");
const elDiagTitle = document.getElementById("diag-title");
const elDiagWhy = document.getElementById("diag-why");
const elDiagNext = document.getElementById("diag-next");

const elMWhite = document.getElementById("m-white");
const elMVoid = document.getElementById("m-void");
const elMSubj = document.getElementById("m-subj");
const elMGrade = document.getElementById("m-grade");
const elMMargin = document.getElementById("m-margin");

const elPSpace = document.getElementById("pillar-space");
const elPContrast = document.getElementById("pillar-contrast");
const elPFocus = document.getElementById("pillar-focus");
const elLiveSpace = document.getElementById("live-space");
const elLiveContrast = document.getElementById("live-contrast");
const elLiveFocus = document.getElementById("live-focus");

let canvasApi = null;

function syncHeroUI() {
  const aspect = canvasApi ? canvasApi.getAspect() : 1.48;
  const res = evaluate(state, aspect);
  const isOk = res.passCount === 4;

  // 顶部印签与诊断带
  elStamp.textContent = res.badge;
  elStamp.dataset.state = isOk ? "ok" : "err";
  elDiagTag.textContent = res.badge;
  elDiagTag.dataset.state = isOk ? "ok" : "err";

  elDiagTitle.textContent = res.title;
  elDiagWhy.textContent = res.why;
  elDiagNext.textContent = res.next;

  // 四枚实测指标
  elMWhite.textContent = `${res.whitePct}%`;
  elMVoid.textContent = `${res.largestVoidPct}%`;
  elMSubj.textContent = `${res.subjectPct}%`;
  elMGrade.textContent = res.orderGrade;
  elMGrade.classList.toggle("is-ok", isOk);
  elMMargin.textContent = `最小护边 ${res.minMarginPct}% · 连通 ${res.voidCohesion}%`;

  // 自示范活体主标题：字距与钴蓝短杠孤点间距随实时净留白率自然开合
  const trackEm = Math.max(0.01, Math.min(0.20, ((res.whitePct - 30) / 60) * 0.14 + 0.02));
  const dotGapPx = Math.round(Math.max(4, Math.min(22, ((res.whitePct - 25) / 65) * 14 + 4)));
  elTitle.style.setProperty("--title-track", `${trackEm.toFixed(3)}em`);
  elRule.style.setProperty("--rule-gap", `${dotGapPx}px`);

  // 原海报三枚蓝符实况
  elPSpace.classList.toggle("is-ok", res.pillars.space.ok);
  elLiveSpace.textContent = res.pillars.space.label;
  elPContrast.classList.toggle("is-ok", res.pillars.contrast.ok);
  elLiveContrast.textContent = res.pillars.contrast.label;
  elPFocus.classList.toggle("is-ok", res.pillars.focus.ok);
  elLiveFocus.textContent = res.pillars.focus.label;

  // 滑块与杂件开关同步
  elScaleRange.value = String(Math.round(state.scale * 100));
  elScaleVal.textContent = `${res.subjectPct}%`;

  const th = THEMES[state.theme] || THEMES.poster;
  document.querySelectorAll("[data-clutter]").forEach((btn) => {
    const k = btn.dataset.clutter;
    const on = !!state.clutter[k];
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("is-warn", on);
    btn.textContent = on ? `${th.clutterNames[k]}：在` : `${th.clutterNames[k]}：已撤`;
  });

  elVoidBtn.setAttribute("aria-pressed", String(state.showVoidMap));
  elVoidBtn.classList.toggle("is-on", state.showVoidMap);
  elVoidBtn.textContent = state.showVoidMap ? "显影整白区：开" : "显影整白区";

  document.querySelectorAll("[data-theme]").forEach((btn) => {
    const active = btn.dataset.theme === state.theme;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

let uiRaf = 0;
function scheduleUI() {
  if (uiRaf) return;
  uiRaf = requestAnimationFrame(() => {
    uiRaf = 0;
    syncHeroUI();
  });
}

function mutateState(patch, immediate = false) {
  if (patch.theme !== undefined) state.theme = patch.theme;
  if (patch.sx !== undefined) state.sx = patch.sx;
  if (patch.sy !== undefined) state.sy = patch.sy;
  if (patch.scale !== undefined) state.scale = patch.scale;
  if (patch.clutter !== undefined) state.clutter = { ...state.clutter, ...patch.clutter };
  if (patch.showVoidMap !== undefined) state.showVoidMap = patch.showVoidMap;
  if (canvasApi) canvasApi.markDirty();
  if (immediate) syncHeroUI();
  else scheduleUI();
}

canvasApi = mountHeroCanvas(heroCanvas, () => state, (patch) => mutateState(patch, false), syncHeroUI);
syncHeroUI();

// 控件事件绑定
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ theme: btn.dataset.theme }, true));
});

elScaleRange.addEventListener("input", () => {
  mutateState({ scale: Number(elScaleRange.value) / 100 }, false);
});

document.querySelectorAll("[data-clutter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.clutter;
    mutateState({ clutter: { [k]: !state.clutter[k] } }, true);
  });
});

elVoidBtn.addEventListener("click", () => {
  mutateState({ showVoidMap: !state.showVoidMap }, true);
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    document.querySelectorAll("[data-preset]").forEach((b) => b.classList.toggle("is-active", b === btn));
    mutateState({
      sx: p.sx,
      sy: p.sy,
      scale: p.scale,
      clutter: { ...p.clutter },
    }, true);
  });
});

// ==================== 01 节：同一 68% 留白面积 · 四种聚散对比 ====================
// 严格单真源：四个方案中全部色块面积之和均精确等于画幅 32%（约 46,080 px²，总留白恒定 68%）
const S1_PATTERNS = {
  split4: {
    blocks: [
      { x: 48, y: 30, w: 160, h: 72 },
      { x: 272, y: 30, w: 160, h: 72 },
      { x: 48, y: 198, w: 160, h: 72 },
      { x: 272, y: 198, w: 160, h: 72 },
    ],
    voidRect: { x: 0, y: 102, w: 480, h: 96 },
    kind: "被动碎缝（十字窄沟）",
    desc: "四块等重内容分占四个象限，把 68% 空白切成一横一竖的狭窄走廊。虽然空着大半张纸，但视线被四面拉扯，既没有呼吸中心，也没有主次层次。",
  },
  scatter: {
    blocks: [
      { x: 24, y: 24, w: 120, h: 96 },
      { x: 336, y: 24, w: 120, h: 96 },
      { x: 180, y: 102, w: 120, h: 96 },
      { x: 336, y: 180, w: 120, h: 96 },
    ],
    voidRect: { x: 0, y: 120, w: 180, h: 180 },
    kind: "散点切碎（无聚气处）",
    desc: "色块面积丝毫没变，只是打散在四角与中央。最大连续整白区跌到只剩 23%，画面显得凌乱忙碌——这就是为什么「留白够多却依然显得拥挤」。",
  },
  offset: {
    blocks: [
      { x: 294, y: 28, w: 158, h: 174 },
      { x: 294, y: 214, w: 158, h: 58 },
      { x: 216, y: 214, w: 68, h: 58 },
      { x: 112, y: 214, w: 94, h: 58 },
    ],
    voidRect: { x: 0, y: 0, w: 294, h: 214 },
    kind: "偏置蓄白（左空右实）",
    desc: "把同样面积的内容有意识地归拢到右侧与底沿基线，左上方立刻汇出 44% 连续净空，呼应 326 原海报的架构，视觉顺序一眼清晰。",
  },
  corner: {
    blocks: [
      { x: 280, y: 14, w: 176, h: 158 },
      { x: 280, y: 180, w: 176, h: 62 },
      { x: 280, y: 250, w: 176, h: 42 },
    ],
    voidRect: { x: 0, y: 0, w: 280, h: 300 },
    kind: "一侧聚气（整片大白）",
    desc: "总面积依旧是完全一样的 32% 实形、68% 留白，但把内容紧凑编组到右侧后，左侧瞬间连成一整片 58% 的开阔通透呼吸场，格局彻底打开。",
  },
};

let s1Current = "split4";
let s1ShowVoid = true;

function renderS1() {
  const p = S1_PATTERNS[s1Current];
  const svg = document.getElementById("s1-svg");
  const totalBlockArea = p.blocks.reduce((sum, b) => sum + b.w * b.h, 0);
  const realWhitePct = Math.round((1 - totalBlockArea / (480 * 300)) * 100);
  const vr = p.voidRect;
  const realVoidPct = Math.round((vr.w * vr.h) / (480 * 300) * 100);

  let html = `<rect width="480" height="300" fill="#FEF9F6"/>`;
  if (s1ShowVoid) {
    const isGood = realVoidPct >= 40;
    const fill = isGood ? "rgba(58,106,199,0.11)" : "rgba(182,42,36,0.09)";
    const stroke = isGood ? "#3A6AC7" : "#B62A24";
    const textCol = isGood ? "#234B9A" : "#B62A24";
    html += `<rect x="${vr.x + 1}" y="${vr.y + 1}" width="${vr.w - 2}" height="${vr.h - 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
    html += `<text x="${vr.x + 12}" y="${vr.y + 22}" fill="${textCol}" font-family="DM Mono, Noto Sans SC, monospace" font-size="12" font-weight="500">最大连续整白 ${realVoidPct}%</text>`;
  }

  p.blocks.forEach((b, i) => {
    const fill = i === 0 ? "#1D1D1D" : i === 1 ? "#3A6AC7" : "#6D6865";
    html += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${fill}"/>`;
  });

  svg.innerHTML = html;
  document.getElementById("s1-total").textContent = `${realWhitePct}%`;
  document.getElementById("s1-max").textContent = `${realVoidPct}%`;
  document.getElementById("s1-kind").textContent = p.kind;
  document.getElementById("s1-desc").textContent = p.desc;
}

document.querySelectorAll(".s1-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    s1Current = btn.dataset.pattern;
    document.querySelectorAll(".s1-btn").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderS1();
  });
});

document.getElementById("s1-overlay-btn").addEventListener("click", (e) => {
  s1ShowVoid = !s1ShowVoid;
  e.currentTarget.setAttribute("aria-pressed", String(s1ShowVoid));
  e.currentTarget.textContent = s1ShowVoid ? "显影整白区：开" : "显影整白区：关";
  renderS1();
});
renderS1();

// ==================== 02 节：宏观 × 微观双轴真 DOM 标本 ====================
let s2Macro = "tight";
let s2Micro = "cramped";
let s2Xray = false;

const S2_META = {
  macro: { tight: "外檐 14px", balanced: "外檐 52px", luxury: "外檐 82px" },
  micro: {
    cramped: { lh: "行高 1.18×", gap: "段距 6px" },
    balanced: { lh: "行高 1.78×", gap: "段距 16px" },
    loose: { lh: "行高 2.55×", gap: "段距 30px" },
  },
};

function renderS2() {
  const wrap = document.getElementById("s2-specimen-wrap");
  wrap.dataset.macro = s2Macro;
  wrap.dataset.micro = s2Micro;
  wrap.dataset.xray = String(s2Xray);

  document.getElementById("s2-meta-pad").textContent = S2_META.macro[s2Macro];
  document.getElementById("s2-meta-lh").textContent = S2_META.micro[s2Micro].lh;
  document.getElementById("s2-meta-gap").textContent = S2_META.micro[s2Micro].gap;

  let verdict = "";
  let explain = "";
  if (s2Macro === "tight" && s2Micro === "cramped") {
    verdict = "双层皆窒息：外沿顶墙，行间互咬";
    explain = "外边距压缩到贴近边框，正文行高仅 1.18 倍。观众既看不到主标题的停顿处，读第二行时还容易串行。";
  } else if (s2Macro !== "tight" && s2Micro === "cramped") {
    verdict = "外松内紧：四周白墙再阔，正文依然难读";
    explain = "典型误区！宏观外檐已经非常阔气，但字行间依然死死粘在一起。没有微观留白兜底，大外框只像给一堵砖块裱了个豪华画框。";
  } else if (s2Macro === "tight" && s2Micro === "balanced") {
    verdict = "内舒外憋：单句好读，但整卡像被挤在墙角";
    explain = "行高与段距都很舒服，但卡片紧贴外缘、缺乏宏观护边，第一眼依然显得急促廉价，撑不起安静的展厅气场。";
  } else if (s2Micro === "loose") {
    verdict = "微观散架：行距拉开到 2.55×，句子各自飘散";
    explain = "微观留白不是越大越好。行距和字距拆得太散时，相邻两行失去格式塔群组联系，读起来像孤立的碎片标语。";
  } else if (s2Macro === "luxury" && s2Micro === "balanced") {
    verdict = "展厅奢阔平衡：极强静谧感与聚焦度";
    explain = "大幅宏观外檐先替画面隔绝外界喧嚣，内部 1.78 倍行高与清晰段距稳稳托住阅读节奏，适合书封、展签与精读长文。";
  } else {
    verdict = "双层俱佳：外有气口、内有呼吸";
    explain = "宏观外檐确立了主体与边界的清晰秩序，微观行距与段距让每行汉字各有停顿，安静、利落、不费眼。";
  }

  document.getElementById("s2-verdict").textContent = verdict;
  document.getElementById("s2-explain").textContent = explain;
}

document.querySelectorAll("[data-macro]").forEach((btn) => {
  if (!btn.classList.contains("seg-btn")) return;
  btn.addEventListener("click", () => {
    s2Macro = btn.dataset.macro;
    document.querySelectorAll(".seg-btn[data-macro]").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderS2();
  });
});

document.querySelectorAll("[data-micro]").forEach((btn) => {
  if (!btn.classList.contains("seg-btn")) return;
  btn.addEventListener("click", () => {
    s2Micro = btn.dataset.micro;
    document.querySelectorAll(".seg-btn[data-micro]").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderS2();
  });
});

document.getElementById("s2-xray-btn").addEventListener("click", (e) => {
  s2Xray = !s2Xray;
  e.currentTarget.setAttribute("aria-pressed", String(s2Xray));
  e.currentTarget.textContent = s2Xray ? "透视宏观/微观空白层：开" : "透视宏观/微观空白层：关";
  renderS2();
});
renderS2();

// ==================== 03 节：暗室反例展厅（4 病例 + 修补翻幕） ====================
const S3_CASES = {
  hollow: {
    badTitle: "主体小得发虚，整张画成了「忘放完内容的白纸」",
    okTitle: "主体撑起 14% 清晰体量，整片暗空立刻成为聚光幕布",
    why: "把 95% 面积全清空，却只放一个灰蒙蒙的微小主体在角落，观者第一反应不是高级极简，而是「图片加载失败了吗」。留白成立的前提，是主体拥有足够锐利的轮廓、对比或体量去撑起这片空。",
    symptom: "主体占幅不足 3%、明度反差偏弱，视线无处停驻",
    remedy: "把主体放大到约 14% 清晰体量并拉高明度对比，让大片空白真正去托举它",
    draw(fixed) {
      if (!fixed) {
        return `
          <rect width="520" height="320" fill="#131E33"/>
          <rect x="440" y="252" width="24" height="30" rx="12" fill="#324361"/>
          <rect x="40" y="276" width="52" height="5" fill="#324361"/>
          <text x="260" y="162" text-anchor="middle" fill="#FF857D" font-family="Noto Sans SC" font-size="13">96% 空白无锚点 · 像未加载完</text>
        `;
      }
      return `
        <rect width="520" height="320" fill="#131E33"/>
        <polygon points="336,244 432,244 352,292 252,272" fill="rgba(123,169,255,0.16)"/>
        <path d="M336 244V128a48 48 0 0 1 96 0v116Z" fill="#F5F2EE"/>
        <rect x="54" y="218" width="128" height="12" fill="#F5F2EE"/>
        <rect x="54" y="238" width="76" height="5" fill="#7BA9FF"/>
        <text x="54" y="42" fill="#6AE0B0" font-family="DM Mono, Noto Sans SC" font-size="12">主体 14% · 高对比立稳 · 左上整片净空</text>
      `;
    },
  },
  sliced: {
    badTitle: "四个元素摊满四角，把 70% 空白撕成碎布",
    okTitle: "元素归组右收，零碎边缝立刻合并成一整片大空",
    why: "新手为了「看起来不挤」，习惯把标题放左上、图标放右上、正文放左下、落款放右下——结果中间留出一个孤立空洞，四面全是碎缝，眼睛被迫在四个角落来回奔命。",
    symptom: "四个元素彼此相距过远，最大连续整白不足 24%",
    remedy: "利用邻近原则把相关信息编成一个视觉组，留出单侧整片连续空白",
    draw(fixed) {
      if (!fixed) {
        return `
          <rect width="520" height="320" fill="#131E33"/>
          <rect x="26" y="26" width="110" height="56" fill="#7BA9FF" opacity="0.85"/>
          <rect x="384" y="26" width="110" height="56" fill="#C6CFDF" opacity="0.75"/>
          <rect x="26" y="238" width="110" height="56" fill="#C6CFDF" opacity="0.75"/>
          <rect x="384" y="238" width="110" height="56" fill="#7BA9FF" opacity="0.85"/>
          <line x1="146" y1="54" x2="374" y2="266" stroke="#FF857D" stroke-dasharray="5 4" stroke-width="1.4"/>
          <line x1="374" y1="54" x2="146" y2="266" stroke="#FF857D" stroke-dasharray="5 4" stroke-width="1.4"/>
          <text x="260" y="165" text-anchor="middle" fill="#FF857D" font-family="Noto Sans SC" font-size="13">视线四角拉扯 · 空白支离破碎</text>
        `;
      }
      return `
        <rect width="520" height="320" fill="#131E33"/>
        <rect x="24" y="24" width="276" height="272" fill="rgba(106,224,176,0.08)" stroke="#6AE0B0" stroke-dasharray="6 4"/>
        <text x="40" y="52" fill="#6AE0B0" font-family="DM Mono, Noto Sans SC" font-size="12">连续整片空白 54%</text>
        <rect x="328" y="52" width="150" height="96" fill="#F5F2EE"/>
        <rect x="328" y="164" width="150" height="14" fill="#7BA9FF"/>
        <rect x="328" y="188" width="112" height="10" fill="#C6CFDF"/>
        <rect x="328" y="208" width="84" height="10" fill="#9AA8C0"/>
      `;
    },
  },
  pinched: {
    badTitle: "中间空一大片，主体却贴死右框快要掉出去",
    okTitle: "退回 10% 安全护边，主体与整片空白重新对话",
    why: "把主体推到离画框只剩 1–2% 的位置，会产生视觉「擦边紧张」——主体仿佛被画框边缘死死挤住，与另一侧的大空白断了联系，画面显得失衡局促。",
    symptom: "右外缘护边不足 2%，形成擦边卡顿",
    remedy: "给主体四边留足 8%–14% 呼吸护边，让空气绕过主体背后流畅循环",
    draw(fixed) {
      if (!fixed) {
        return `
          <rect width="520" height="320" fill="#131E33"/>
          <path d="M432 238V116a43 43 0 0 1 86 0v122Z" fill="#F5F2EE"/>
          <line x1="518" y1="0" x2="518" y2="320" stroke="#FF857D" stroke-width="4" stroke-dasharray="6 4"/>
          <text x="410" y="72" text-anchor="end" fill="#FF857D" font-family="Noto Sans SC" font-size="13">贴死右框 · 擦边欲坠 →</text>
        `;
      }
      return `
        <rect width="520" height="320" fill="#131E33"/>
        <path d="M352 240V122a44 44 0 0 1 88 0v118Z" fill="#F5F2EE"/>
        <line x1="440" y1="180" x2="520" y2="180" stroke="#6AE0B0" stroke-width="1.5"/>
        <text x="480" y="168" text-anchor="middle" fill="#6AE0B0" font-family="DM Mono" font-size="12">15%</text>
        <text x="42" y="52" fill="#6AE0B0" font-family="Noto Sans SC" font-size="12">安全护边到位 · 空气从背后绕流</text>
      `;
    },
  },
  noisy: {
    badTitle: "看起来没放别的东西，但满底纹路让眼球一刻不得闲",
    okTitle: "撤掉底纹杂音，纯色暗底让主体对比瞬间拉满",
    why: "留白不等于「必须是纯白色」，深蓝、墨黑、暖米纸都可以作为留白；但它必须足够「静」。一旦铺上高对比网格、大水印或杂乱光斑，背景就会抢夺注意力，沦为伪留白。",
    symptom: "背景充满规律高对比斜纹与水印，主体轮廓被干扰",
    remedy: "清空背景装饰纹样，用干净单色面拉大主体与底面的纯净反差",
    draw(fixed) {
      if (!fixed) {
        let lines = "";
        for (let d = -320; d < 620; d += 18) {
          lines += `<line x1="${d}" y1="0" x2="${d + 220}" y2="320" stroke="#364C74" stroke-width="1.5"/>`;
        }
        return `
          <rect width="520" height="320" fill="#131E33"/>
          ${lines}
          <path d="M336 244V128a48 48 0 0 1 96 0v116Z" fill="#C6CFDF"/>
          <text x="36" y="42" fill="#FF857D" font-family="Noto Sans SC" font-size="13">满底斜纹噪点 · 伪留白破坏对比</text>
        `;
      }
      return `
        <rect width="520" height="320" fill="#131E33"/>
        <path d="M336 244V128a48 48 0 0 1 96 0v116Z" fill="#F5F2EE"/>
        <rect x="48" y="220" width="124" height="10" fill="#7BA9FF"/>
        <text x="48" y="42" fill="#6AE0B0" font-family="Noto Sans SC" font-size="12">深青净底 · 任何纯静底色皆可留白</text>
      `;
    },
  },
};

let s3Case = "hollow";
let s3Fixed = false;

function renderS3() {
  const c = S3_CASES[s3Case];
  document.getElementById("s3-svg").innerHTML = c.draw(s3Fixed);
  const badge = document.getElementById("s3-badge");
  badge.textContent = s3Fixed ? "修补后：秩序成立" : "失手原状";
  badge.dataset.fixed = String(s3Fixed);
  const btn = document.getElementById("s3-fix-btn");
  btn.setAttribute("aria-pressed", String(s3Fixed));
  btn.textContent = s3Fixed ? "← 还原失手原状" : "修补此病 →";

  document.getElementById("s3-title").textContent = s3Fixed ? c.okTitle : c.badTitle;
  document.getElementById("s3-why").textContent = c.why;
  document.getElementById("s3-symptom").textContent = c.symptom;
  document.getElementById("s3-remedy").textContent = c.remedy;
}

document.querySelectorAll(".pit-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    s3Case = btn.dataset.case;
    s3Fixed = false;
    document.querySelectorAll(".pit-tab").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderS3();
  });
});

document.getElementById("s3-fix-btn").addEventListener("click", () => {
  s3Fixed = !s3Fixed;
  renderS3();
});
renderS3();

// ==================== 04 节：历史双线源流时间轴 ====================
const S4_ERAS = {
  song: {
    quote: "一叶扁舟悬素绢，不画江水而烟波浩渺。",
    heading: "传南宋马远《寒江独钓图》（东京国立博物馆藏 TA-140）",
    body: "这件 13 世纪绢本墨画淡彩立轴（26.7 × 50.6 厘米，日本重要文化财）全幅几乎只画一叶小舟、垂钓蓑翁与数笔淡墨水纹，四周大面积素绢完全留空，反倒让观者看见整片无边冬江。明初曹昭《格古要论》最早文字概括马远「全景不多……此边角之景也」，后世画坛由此俗称「马一角、夏半边」。",
    cite: "核实来源：东京国立博物馆 e-Museum（ID 100823 / TA-140）",
    svg: `
      <rect width="360" height="240" fill="#F7F1E7"/>
      <rect x="18" y="16" width="324" height="122" fill="rgba(58,106,199,0.08)" stroke="#3A6AC7" stroke-dasharray="5 4"/>
      <text x="30" y="38" fill="#234B9A" font-family="Noto Sans SC" font-size="12">大片无墨素绢 → 观者脑补寒江浩渺</text>
      <!-- 孤舟与蓑笠剪影（无五官） -->
      <path d="M126 172 Q178 192 232 164 Q182 178 126 172 Z" fill="#1D1D1D"/>
      <path d="M174 172 Q178 152 188 154 Q192 164 190 172 Z" fill="#2A2B2D"/>
      <path d="M170 154 Q182 142 194 155 Z" fill="#4E4B49"/>
      <path d="M188 162 Q216 146 244 138" fill="none" stroke="#1D1D1D" stroke-width="1.4"/>
      <line x1="244" y1="138" x2="246" y2="188" stroke="#635F5C" stroke-width="1"/>
      <path d="M112 192 Q156 186 202 194 M192 204 Q228 199 266 204" fill="none" stroke="#8C8782" stroke-width="1.3"/>
    `,
  },
  qing: {
    quote: "空本难图，实景清而空景现；无画处皆成妙境。",
    heading: "清康熙年间 · 笪重光《画筌》的留白之理",
    body: "17 世纪后期，清代书画家、理论家笪重光在《画筌》写下名句：「空本难图，实景清而空景现；神无可绘，真境逼而神境生。位置相戾，有画处多属赘疣；虚实相生，无画处皆成妙境。」这句话道破留白的底气：空白不是空洞偷懒，恰恰靠把实景画得清朗真切、摆对位置，空白才会生出意境。",
    cite: "核实来源：清·笪重光《画筌》（维基文库古籍原文核对）",
    svg: `
      <rect width="360" height="240" fill="#F8F3ED"/>
      <path d="M24 216 L96 122 L152 168 L194 134 L232 216 Z" fill="#2A2B2D" opacity="0.86"/>
      <rect x="206" y="24" width="132" height="132" fill="rgba(58,106,199,0.09)" stroke="#3A6AC7" stroke-dasharray="5 4"/>
      <text x="272" y="88" text-anchor="middle" fill="#234B9A" font-family="Noto Sans SC" font-size="13">无画处</text>
      <text x="272" y="108" text-anchor="middle" fill="#234B9A" font-family="Noto Sans SC" font-size="11">以实清显空景</text>
      <text x="112" y="198" text-anchor="middle" fill="#F5F2EE" font-family="Noto Sans SC" font-size="12">实景清</text>
    `,
  },
  bauhaus: {
    quote: "纸上的大片空白，与黑色铅字同等是造型元素。",
    heading: "1928 年柏林 · 扬·奇肖尔德《新字体排印学》（Die neue Typographie）",
    body: "1928 年，德国排版大师扬·奇肖尔德在柏林出版《新字体排印学》，彻底推翻了传统中轴对称填满页面的惯例。他在书中明确提出：新字体排印有意识地把以往视作「背景」的纸面留白，当成与黑字同等重要的正式构图元素，并指出大片空白往往比灰黑更强有力。",
    cite: "核实来源：Jan Tschichold, Die neue Typographie (Berlin, 1928); University of California Press 英译本",
    svg: `
      <rect width="360" height="240" fill="#FFFDFB"/>
      <rect x="22" y="20" width="164" height="200" fill="rgba(58,106,199,0.08)" stroke="#3A6AC7" stroke-dasharray="5 4"/>
      <text x="36" y="46" fill="#234B9A" font-family="Space Grotesk, sans-serif" font-size="11" letter-spacing="1">ACTIVE WHITE</text>
      <rect x="206" y="34" width="128" height="18" fill="#1D1D1D"/>
      <rect x="206" y="60" width="92" height="6" fill="#3A6AC7"/>
      <rect x="206" y="118" width="128" height="7" fill="#4E4B49"/>
      <rect x="206" y="133" width="114" height="7" fill="#4E4B49"/>
      <rect x="206" y="148" width="122" height="7" fill="#4E4B49"/>
      <rect x="206" y="163" width="80" height="7" fill="#4E4B49"/>
      <rect x="206" y="200" width="44" height="10" fill="#1D1D1D"/>
    `,
  },
  hara: {
    quote: "白不是一种颜色，而是容纳万物的「空容器」。",
    heading: "2003–2010 年 · 原研哉无印良品「地平线」海报与《白》",
    body: "2003 年，平面设计师原研哉与摄影师藤井保赴玻利维亚乌尤尼盐沼拍摄无印良品「地平线（Horizon）」海报：画面 90% 以上是无垠天水相接的空白，只在极远的地平线上立着一个微小身影。2008 年（英文版 2010 年由 Lars Müller Publishers 出版）他在《白》（White）中把这种留白阐释为「空的容器」，把想象权交还观者。",
    cite: "核实来源：Kenya Hara, White (2008 / Lars Müller Publishers 2010); MUJI Horizon Campaign (2003)",
    svg: `
      <rect width="360" height="240" fill="#FEF9F6"/>
      <rect x="0" y="146" width="360" height="94" fill="#F1EBE8"/>
      <line x1="0" y1="146" x2="360" y2="146" stroke="#C8C1BF" stroke-width="1"/>
      <!-- 地平线上的极小静立剪影（无五官） -->
      <rect x="178" y="132" width="4" height="14" rx="2" fill="#1D1D1D"/>
      <circle cx="180" cy="129" r="2.2" fill="#1D1D1D"/>
      <text x="180" y="72" text-anchor="middle" fill="#234B9A" font-family="Space Grotesk, sans-serif" font-size="11" letter-spacing="2">HORIZON · EMPTINESS AS VESSEL</text>
    `,
  },
};

function renderS4(key) {
  const era = S4_ERAS[key];
  document.getElementById("s4-svg").innerHTML = era.svg;
  document.getElementById("s4-quote").textContent = era.quote;
  document.getElementById("s4-heading").textContent = era.heading;
  document.getElementById("s4-body").textContent = era.body;
  document.getElementById("s4-cite").textContent = era.cite;
}

document.querySelectorAll(".tl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tl-btn").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderS4(btn.dataset.era);
  });
});
renderS4("song");

// ==================== 05 节：四项真实任务适用边界自检 ====================
const S5_FEEDBACK = [
  "判断准确：十米外匆匆扫过、只有单一核心器物与少量文字，大片净白墙面能让主体在嘈杂户外瞬间跳出来。",
  "判断准确：急诊分诊屏要求护士一眼同扫 24 个床位状态，这里要的是清晰分区和极高信息密度，硬留大白只会延误判断。",
  "判断准确：嘈杂书台里满眼都是高饱和促销封面，克制的大留白与精简四字书名反而最先捉住读者的目光。",
  "判断准确：18 项硬件横评靠紧邻并置对比，过度留白会迫使买家来回滚屏、失去横向对照能力，应改用紧凑栅格表。",
];
const s5Done = new Map();

document.querySelectorAll(".triage-card").forEach((card) => {
  const idx = Number(card.dataset.task);
  const ans = card.dataset.ans;
  const fb = card.querySelector(".triage-fb");
  const btns = card.querySelectorAll(".tr-btn");

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.pick;
      const right = pick === ans;
      s5Done.set(idx, right);

      btns.forEach((b) => {
        b.classList.remove("is-right", "is-wrong");
        if (b === btn) b.classList.add(right ? "is-right" : "is-wrong");
        if (b.dataset.pick === ans) b.classList.add("is-right");
      });

      fb.hidden = false;
      fb.textContent = right
        ? S5_FEEDBACK[idx]
        : `再想一步：这个场景其实${ans === "use" ? "适合大留白" : "别硬留白"}。${S5_FEEDBACK[idx].replace(/^判断准确：/, "")}`;

      const rightCount = [...s5Done.values()].filter(Boolean).length;
      document.getElementById("s5-score").textContent = `已判 ${s5Done.size} / 4 · 答对 ${rightCount}`;
    });
  });
});

// ==================== 06 节：单变量控变小练习 ====================
const QUIZ_EXPLAIN = {
  A: "方案 A 把器物贴死右上角、标题贴死左下角：虽然中间空了一大片，但两侧全部擦边欲坠，且大空白成了割裂主视觉与标题的「空洞裂谷」。",
  B: "方案 B 把器物与标题死居中轴：四周留白被均匀分成等宽的窄框，缺少聚气的大片净空，整体显得呆板、没有层次起伏。",
  C: "方案 C（最佳）把器物稳落在右下安全内区、标题收束在左下同一基线：既给四边留出从容护边，又把上方与左上汇成一整片连贯呼吸大白，视线自然落焦。",
  D: "方案 D 给器物和标题各套了一道细黑方框：总空白面积差不多，但封闭方框把留白切碎成零星格子，截断了空间向外延展的呼吸感。",
};

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const pick = card.dataset.choice;
    const isOk = pick === "C";

    document.querySelectorAll(".quiz-card").forEach((c) => {
      const ch = c.dataset.choice;
      c.setAttribute("aria-pressed", String(ch === pick));
      c.classList.remove("is-picked", "is-correct");
      if (ch === "C") c.classList.add("is-correct");
      else if (ch === pick) c.classList.add("is-picked");
    });

    const box = document.getElementById("quiz-result");
    const badge = document.getElementById("qr-badge");
    const title = document.getElementById("qr-title");
    const body = document.getElementById("qr-body");
    const list = document.getElementById("qr-breakdown");

    box.hidden = false;
    badge.dataset.ok = String(isOk);
    badge.textContent = isOk ? "判断准确 · 方案 C" : `你选了方案 ${pick} · 最佳为方案 C`;
    title.textContent = isOk
      ? "你抓住了留白构图最关键的一步：护边从容 + 聚成整片大白"
      : `为什么方案 ${pick} 稍逊一筹，而方案 C 最立得住？`;
    body.textContent = QUIZ_EXPLAIN[pick];

    list.innerHTML = ["A", "B", "C", "D"]
      .map((k) => `<li><strong>方案 ${k}${k === "C" ? "（最佳）" : ""}：</strong>${QUIZ_EXPLAIN[k].replace(/^方案 [A-D]（最佳）|^方案 [A-D]/, "")}</li>`)
      .join("");
  });
});

// ==================== 07 节：原海报放大灯箱（复用 #poster.src，可拖可缩 Esc 关闭） ====================
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  document.getElementById("lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-trigger").focus();
}

document.getElementById("poster-trigger").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => { lbScale = Math.min(3, lbScale + 0.25); applyLbTransform(); });
document.getElementById("lb-out").addEventListener("click", () => { lbScale = Math.max(0.6, lbScale - 0.25); applyLbTransform(); });
document.getElementById("lb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.6, Math.min(3, lbScale + (e.deltaY < 0 ? 0.15 : -0.15)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1.01) {
    closeLightbox();
    return;
  }
  lbDrag = { sx: e.clientX - lbX, sy: e.clientY - lbY };
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.sx;
  lbY = e.clientY - lbDrag.sy;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

window.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  else if (e.key === "+" || e.key === "=") { lbScale = Math.min(3, lbScale + 0.25); applyLbTransform(); }
  else if (e.key === "-" || e.key === "_") { lbScale = Math.max(0.6, lbScale - 0.25); applyLbTransform(); }
});
