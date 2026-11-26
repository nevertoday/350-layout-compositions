// 257 三列页面 · 主控脚本（开场工作台 + 七节交互 + 原海报放大检视）
import { loop, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  PRESETS,
  QUIZ_OPTIONS,
  clampState,
  evaluateCollapse,
  evaluateLayout,
} from "./model.js";
import { createHeroCanvas } from "./canvas.js";

// ==================== 开场工作台状态与单真源同步 ====================
let state = clampState(INITIAL_STATE);
let evalNow = evaluateLayout(state);

const heroCanvas = document.getElementById("heroCanvas");
const heroStatusPill = document.getElementById("heroStatusPill");
const pBadgeHierarchy = document.getElementById("pBadgeHierarchy");
const pBadgeRoles = document.getElementById("pBadgeRoles");
const pBadgeContrast = document.getElementById("pBadgeContrast");

const diagScore = document.getElementById("diagScore");
const diagTitle = document.getElementById("diagTitle");
const diagWhy = document.getElementById("diagWhy");
const diagAction = document.getElementById("diagAction");
const btnNextFix = document.getElementById("btnNextFix");
const btnToggleGuides = document.getElementById("btnToggleGuides");
const mRatio = document.getElementById("mRatio");
const mGutter = document.getElementById("mGutter");
const mCpl = document.getElementById("mCpl");
const mCog = document.getElementById("mCog");
const cssReadout = document.getElementById("cssReadout");

const rangeS1 = document.getElementById("rangeS1");
const rangeS2 = document.getElementById("rangeS2");
const rangeGutter = document.getElementById("rangeGutter");
const outS1 = document.getElementById("outS1");
const outS2 = document.getElementById("outS2");
const outGutter = document.getElementById("outGutter");

const scenarioTabs = [...document.querySelectorAll("[data-scenario]")];
const vpBtns = [...document.querySelectorAll("[data-vp]")];
const contrastBtns = [...document.querySelectorAll("[data-contrast]")];
const alignedBtns = [...document.querySelectorAll("[data-aligned]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

let heroLoop = null;
let lastDiagKey = "";

function syncHeroUI(force = false) {
  evalNow = evaluateLayout(state);
  const st = evalNow.state;

  // 高频拖动时只更新有变化的 DOM，保证 6× CPU 限速下稳跑 60fps
  const key = `${st.scenario}|${evalNow.pcts.join(":")}|${st.gutter}|${st.viewport}|${st.contrast}|${st.aligned}|${st.order.join("")}|${st.focusSlot}|${st.showGuides}`;
  if (!force && key === lastDiagKey) return;
  lastDiagKey = key;

  const pillText = evalNow.ok
    ? `4/4 · ${evalNow.modeLabel}`
    : `${evalNow.score}/4 · ${evalNow.topIssue ? evalNow.topIssue.short : "待校"}`;
  heroStatusPill.textContent = pillText;
  heroStatusPill.dataset.ok = String(evalNow.ok);

  // 三柱徽标
  pBadgeHierarchy.textContent = evalNow.pillars.hierarchy.badge;
  pBadgeHierarchy.dataset.ok = String(evalNow.pillars.hierarchy.ok);
  pBadgeRoles.textContent = evalNow.pillars.roles.badge;
  pBadgeRoles.dataset.ok = String(evalNow.pillars.roles.ok);
  pBadgeContrast.textContent = evalNow.pillars.contrast.badge;
  pBadgeContrast.dataset.ok = String(evalNow.pillars.contrast.ok);

  // 单真源诊单
  diagScore.textContent = `${evalNow.score} / 4`;
  if (evalNow.ok) {
    diagTitle.textContent = `${evalNow.modeLabel}已成立，三列秩序稳固`;
    diagWhy.textContent = `当前 ${evalNow.pcts.join(":")} 配比下，核心列宽 ${evalNow.primaryCol.px}px（约 ${evalNow.primaryCol.cpl} 字/行），双缝 ${st.gutter}px 清晰止串，单一焦点拉出主次，顶沿齐平。`;
    diagAction.textContent = "可以继续切「数据展示 / 人物介绍」，或点右侧反向试错陷阱检验临界点。";
    btnNextFix.textContent = "换一组等宽合法解";
  } else {
    const top = evalNow.topIssue;
    diagTitle.textContent = top.headline;
    diagWhy.textContent = top.why;
    diagAction.textContent = `怎么改：${top.action}`;
    btnNextFix.textContent = top.fixLabel;
  }

  mRatio.textContent = evalNow.pcts.join(":");
  mGutter.textContent = `${st.gutter}px`;
  mCpl.textContent = `约 ${evalNow.primaryCol.cpl} 字/行`;
  mCog.textContent = evalNow.cogText;
  cssReadout.textContent = evalNow.cssGrid;

  const s1Pct = Math.round(st.s1 * 100);
  const s2Pct = Math.round(st.s2 * 100);
  if (Number(rangeS1.value) !== s1Pct) rangeS1.value = String(s1Pct);
  if (Number(rangeS2.value) !== s2Pct) rangeS2.value = String(s2Pct);
  if (Number(rangeGutter.value) !== st.gutter) rangeGutter.value = String(st.gutter);
  outS1.textContent = `${s1Pct}%`;
  outS2.textContent = `${s2Pct}%`;
  outGutter.textContent = `${st.gutter}px`;

  scenarioTabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scenario === st.scenario)));
  vpBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.vp) === st.viewport)));
  contrastBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.contrast === st.contrast)));
  alignedBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.aligned === String(st.aligned))));
  btnToggleGuides.setAttribute("aria-pressed", String(st.showGuides));
  btnToggleGuides.textContent = `标尺辅助：${st.showGuides ? "开" : "关"}`;
}

function setState(next) {
  state = clampState(next);
  syncHeroUI();
  renderer.markDirty();
  if (reducedMotion.matches && heroLoop) heroLoop.draw();
}

const renderer = createHeroCanvas(heroCanvas, () => state, (next) => setState(next));
heroLoop = loop(heroCanvas, (t, dt, opts) => renderer.render(t, dt, opts));
syncHeroUI(true);
renderer.markDirty();
heroLoop.draw();

// 控件事件绑定
scenarioTabs.forEach((btn) =>
  btn.addEventListener("click", () => {
    setState({ ...state, scenario: btn.dataset.scenario });
  })
);

rangeS1.addEventListener("input", () => {
  const v = Number(rangeS1.value) / 100;
  setState({ ...state, s1: v, s2: Math.max(state.s2, v + 0.12) });
});

rangeS2.addEventListener("input", () => {
  const v = Number(rangeS2.value) / 100;
  setState({ ...state, s2: v, s1: Math.min(state.s1, v - 0.12) });
});

rangeGutter.addEventListener("input", () => {
  setState({ ...state, gutter: Number(rangeGutter.value) });
});

vpBtns.forEach((btn) =>
  btn.addEventListener("click", () => setState({ ...state, viewport: Number(btn.dataset.vp) }))
);

contrastBtns.forEach((btn) =>
  btn.addEventListener("click", () => setState({ ...state, contrast: btn.dataset.contrast }))
);

alignedBtns.forEach((btn) =>
  btn.addEventListener("click", () => setState({ ...state, aligned: btn.dataset.aligned === "true" }))
);

document.getElementById("btnRotateOrder").addEventListener("click", () => {
  const [a, b, c] = state.order;
  setState({ ...state, order: [b, c, a], focusSlot: (state.focusSlot + 2) % 3 });
});

document.getElementById("btnCycleFocus").addEventListener("click", () => {
  setState({
    ...state,
    contrast: state.contrast === "flat" ? "focal" : state.contrast,
    focusSlot: (state.focusSlot + 1) % 3,
  });
});

btnToggleGuides.addEventListener("click", () => {
  setState({ ...state, showGuides: !state.showGuides });
});

btnNextFix.addEventListener("click", () => {
  if (evalNow.ok) {
    setState(PRESETS.equalThirds.apply(state));
  } else if (evalNow.topIssue && evalNow.topIssue.fix) {
    setState(evalNow.topIssue.fix(state));
  }
});

presetBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (preset) setState(preset.apply(state));
  })
);

window.addEventListener("resize", () => {
  renderer.markDirty();
  if (heroLoop) heroLoop.draw();
});

// ==================== 01 几何图式解剖 ====================
const MOTIF_DATA = {
  center: {
    steps: ["① 左列锚定目录", "② 中列聚焦核心", "③ 右列轻量补充"],
    mainIdx: 1,
    title: "对称中轴：让眼睛直落中间主角",
    desc: "像原海报第一幅图那样，用左实、中橙圆、右疏点的视觉重量差，把读者的第一眼锁定在正中核心区，左右两列分别退作导航坐标与轻辅助。",
    use: "典型落点：新闻专题页、知识文档、邮件与文档工作台。",
  },
  modular: {
    steps: ["① 方案一快速建锚", "② 推荐版视觉提亮", "③ 旗舰版抬高上限"],
    mainIdx: 1,
    title: "等宽模块：把三项平行对象放上同一把尺子",
    desc: "原海报第二幅图用等宽竖条配统一行线、仅中间一列换信号橙提亮，适合价格套餐、特性对比或三位成员展示，让读者横扫一行就能完成优劣判断。",
    use: "典型落点：产品三档定价卡、团队核心成员、三步服务说明。",
  },
  contrast: {
    steps: ["① 左宽列立住主内容", "② 中列承接数据/延展", "③ 右窄列快览动态"],
    mainIdx: 0,
    title: "阶梯递进：用形、色、宽拉开主次速度",
    desc: "原海报第三幅图并置大弧面、信号橙实块与细横条纹，说明三列不必等大：把左列做宽先接住长文或主图，右侧两列逐级收窄，形成从重到轻的明快节奏。",
    use: "典型落点：门户首页焦点区、图文特刊、信息流带双侧工具栏。",
  },
};

const motifBtns = [...document.querySelectorAll("[data-motif]")];
const mStepEls = [document.getElementById("mStep1"), document.getElementById("mStep2"), document.getElementById("mStep3")];
const motifTitle = document.getElementById("motifTitle");
const motifDesc = document.getElementById("motifDesc");
const motifUse = document.getElementById("motifUse");

function selectMotif(key) {
  const d = MOTIF_DATA[key] || MOTIF_DATA.center;
  motifBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.motif === key)));
  d.steps.forEach((txt, i) => {
    mStepEls[i].textContent = txt;
    mStepEls[i].classList.toggle("flow-main", i === d.mainIdx);
  });
  motifTitle.textContent = d.title;
  motifDesc.textContent = d.desc;
  motifUse.textContent = d.use;
}

motifBtns.forEach((b) => b.addEventListener("click", () => selectMotif(b.dataset.motif)));

// ==================== 02 六大要点开关破坏台 ====================
const stressState = {
  rhythm: true,
  balance: true,
  modularity: true,
  contrast: true,
  spacing: true,
  consistency: true,
};

const stressBtns = [...document.querySelectorAll("[data-pillar]")];
const stressSvg = document.getElementById("stressSvg");
const stressScore = document.getElementById("stressScore");
const stressNote = document.getElementById("stressNote");

const STRESS_MESSAGES = {
  spacing: "关掉「间距」后，三列紧贴在一起（缝宽归零），左右文字与色块粘连串行。",
  contrast: "关掉「对比」后，三列变成同样的浅灰平权块，眼球扫半天找不到第一落点。",
  balance: "关掉「平衡感」后，视觉重量全部堆到左列，右侧大块空虚、整页往左倾倒。",
  consistency: "关掉「一致性」后，三列顶沿高低错落、圆角与字块规格各搞一套，秩序瞬间瓦解。",
  modularity: "关掉「模块化」后，中列色块越界横跨左右列，职责边界模糊，窄屏无法干净拆分。",
  rhythm: "关掉「节奏感」后，每列被切成等高死板的单调横格，没有轻重快慢的阅读呼吸。",
};

function renderStress() {
  const s = stressState;
  const activeCount = Object.values(s).filter(Boolean).length;
  const gap = s.spacing ? 20 : 2;
  const pad = 22;
  const inner = 540 - pad * 2 - gap * 2;
  const ws = s.balance
    ? [Math.round(inner * 0.25), Math.round(inner * 0.5), inner - Math.round(inner * 0.25) - Math.round(inner * 0.5)]
    : [Math.round(inner * 0.54), Math.round(inner * 0.28), inner - Math.round(inner * 0.54) - Math.round(inner * 0.28)];
  const xs = [pad, pad + ws[0] + gap, pad + ws[0] + gap + ws[1] + gap];
  const ys = s.consistency ? [28, 28, 28] : [18, 52, 34];
  const radii = s.consistency ? [0, 0, 0] : [0, 14, 6];

  const colFills = s.contrast ? ["#FDF8EC", "#002EAA", "#FDF8EC"] : ["#F3ECE0", "#F3ECE0", "#F3ECE0"];
  const colStrokes = s.contrast ? ["#002EAA", "#F36301", "#002EAA"] : ["#9CA5BE", "#9CA5BE", "#9CA5BE"];
  const barFills = s.contrast ? ["#002EAA", "#F9EED5", "#002EAA"] : ["#8E97B0", "#8E97B0", "#8E97B0"];
  const accentFills = s.contrast ? ["#F36301", "#F36301", "#F36301"] : ["#8E97B0", "#8E97B0", "#8E97B0"];

  const colsMarkup = [0, 1, 2]
    .map((i) => {
      const h = 258 - (ys[i] - 28);
      const x = xs[i];
      const y = ys[i];
      const w = ws[i];
      const r = radii[i];
      const lineCount = s.rhythm ? (i === 1 ? 4 : 3) : 6;
      const lines = Array.from({ length: lineCount }, (_, li) => {
        const ly = y + (s.rhythm ? 104 + li * 22 : 48 + li * 28);
        const lw = s.rhythm ? w - 28 - (li % 2) * 18 : w - 24;
        return `<rect x="${x + 14}" y="${ly}" width="${Math.max(24, lw)}" height="${s.rhythm ? 7 : 12}" fill="${barFills[i]}" opacity="${s.rhythm ? 0.8 : 0.45}"/>`;
      }).join("");
      const heroBlock = s.rhythm
        ? `<rect x="${x + 14}" y="${y + 42}" width="${Math.max(24, w - 28)}" height="${i === 1 ? 46 : 36}" fill="${i === 1 ? accentFills[1] : s.contrast ? "#DCE6FA" : "#DDD6C8"}"/>`
        : "";
      return `
        <g>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${colFills[i]}" stroke="${colStrokes[i]}" stroke-width="${i === 1 && s.contrast ? 2.5 : 1.5}"/>
          <rect x="${x + 14}" y="${y + 16}" width="${Math.min(34, w - 24)}" height="5" fill="${accentFills[i]}"/>
          ${heroBlock}
          ${lines}
        </g>`;
    })
    .join("");

  const bleedOverlay = !s.modularity
    ? `<rect x="${xs[0] + ws[0] * 0.4}" y="128" width="${ws[0] * 0.6 + gap + ws[1] + gap + ws[2] * 0.55}" height="52" fill="#C42419" fill-opacity="0.86" stroke="#FDF8EC" stroke-width="2" stroke-dasharray="6 4"/>
       <text x="270" y="159" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">× 越界跨栏：破坏独立模块边界</text>`
    : "";

  const guideTop = !s.consistency
    ? `<line x1="16" y1="28" x2="524" y2="28" stroke="#C42419" stroke-width="1.5" stroke-dasharray="5 4"/>`
    : "";

  stressSvg.innerHTML = `${colsMarkup}${bleedOverlay}${guideTop}`;
  stressScore.textContent = `${activeCount} / 6 项开启 · ${activeCount === 6 ? "三列稳态" : activeCount >= 4 ? "局部受损" : "结构失序"}`;

  const offKeys = Object.keys(s).filter((k) => !s[k]);
  if (offKeys.length === 0) {
    stressNote.textContent = "六道阀门全开：主焦突出、双缝透气、左右平衡、顶沿一致，读者的扫视路径自然顺畅。";
  } else if (offKeys.length === 1) {
    stressNote.textContent = STRESS_MESSAGES[offKeys[0]];
  } else {
    stressNote.textContent = `同时关掉了 ${offKeys.length} 项要点：${STRESS_MESSAGES[offKeys[0]]} 其余缺失项也在叠加放大阅读阻力。`;
  }

  stressBtns.forEach((b) => {
    const on = s[b.dataset.pillar];
    b.setAttribute("aria-pressed", String(on));
    b.querySelector(".sw-state").textContent = on ? "开" : "关";
  });
}

stressBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.pillar;
    stressState[k] = !stressState[k];
    renderStress();
  })
);
document.getElementById("btnStressAllOff").addEventListener("click", () => {
  Object.keys(stressState).forEach((k) => (stressState[k] = false));
  renderStress();
});
document.getElementById("btnStressAllOn").addEventListener("click", () => {
  Object.keys(stressState).forEach((k) => (stressState[k] = true));
  renderStress();
});
renderStress();

// ==================== 03 三列从哪来（四时代历史标本） ====================
const ERAS = {
  1958: {
    meta: "1958–1965 · 苏黎世 · 18 期三语季刊",
    title: "《Neue Grafik》把德、英、法三语并排锁进三列网格",
    body: "由 Richard Paul Lohse、Josef Müller-Brockmann、Hans Neuburg 与 Carlo Vivarelli 联合创办编辑的《Neue Grafik / New Graphic Design / Graphisme actuel》，为了在同一个跨页同时容纳德、英、法三种语言正文与图注，系统运用了严格的三列与多列网格。读者只需盯着固定水平槽位就能顺读母语。",
    detail: "同年期的 1959 年，Karl Gerstner 与 Markus Kutter 合著的《Die neue Graphik》同样以等宽三列并行排版德、英、法三语。",
    source: '核实来源：瑞士国际主义平面设计文献及苏黎世《Neue Grafik》(1958–1965) 档案记录。',
    svg: `<svg viewBox="0 0 340 210" role="img" aria-label="1958 Neue Grafik 三语三栏跨页结构示意">
      <rect x="8" y="8" width="324" height="194" fill="#FDF8EC" stroke="#002EAA" stroke-width="2"/>
      <text x="22" y="30" fill="#002EAA" font-size="13" font-weight="900">NEUE GRAFIK · 1958</text>
      <line x1="22" y1="38" x2="318" y2="38" stroke="#F36301" stroke-width="2.5"/>
      <g fill="#0B1A4A">
        <text x="22" y="55" font-size="10" font-weight="700" fill="#002EAA">DEUTSCH</text>
        <rect x="22" y="63" width="88" height="5"/><rect x="22" y="74" width="82" height="5"/><rect x="22" y="85" width="88" height="5"/><rect x="22" y="96" width="76" height="5"/><rect x="22" y="107" width="88" height="5"/>
        <text x="126" y="55" font-size="10" font-weight="700" fill="#F36301">ENGLISH</text>
        <rect x="126" y="63" width="88" height="5"/><rect x="126" y="74" width="84" height="5"/><rect x="126" y="85" width="88" height="5"/><rect x="126" y="96" width="79" height="5"/><rect x="126" y="107" width="88" height="5"/>
        <text x="230" y="55" font-size="10" font-weight="700" fill="#002EAA">FRANÇAIS</text>
        <rect x="230" y="63" width="88" height="5"/><rect x="230" y="74" width="80" height="5"/><rect x="230" y="85" width="88" height="5"/><rect x="230" y="96" width="85" height="5"/><rect x="230" y="107" width="88" height="5"/>
      </g>
      <rect x="22" y="126" width="192" height="62" fill="#002EAA"/>
      <rect x="230" y="126" width="88" height="62" fill="#F36301"/>
    </svg>`,
  },
  1981: {
    meta: "1981 · VERLAG NIGGLI · ISBN 978-3-7212-0145-1",
    title: "《平面设计中的网格系统》写透三栏跨栏与留白算法",
    body: "Josef Müller-Brockmann 在 1981 年由 Verlag Niggli 出版的双语经典《Grid Systems in Graphic Design》中，系统论证了三栏网格为何比两栏灵活：它既能三列等宽排并列信息，也能用「跨两栏排正文 + 留一栏排图注或照片」制造干净的不对称呼吸感。",
    detail: "核心启发：三列不是非得塞满三列——把其中两列合并跨栏，第三列留作注释或留白，依然属于三列网格的严谨秩序。",
    source: '出版社页面：<a href="https://niggli.ch/products/grid-systems-in-graphic-design" target="_blank" rel="noopener">Niggli Verlag — Grid Systems in Graphic Design</a>',
    svg: `<svg viewBox="0 0 340 210" role="img" aria-label="1981 米勒-布罗克曼三栏跨两栏正文加一栏图注示意">
      <rect x="8" y="8" width="324" height="194" fill="#FDF8EC" stroke="#002EAA" stroke-width="2"/>
      <g stroke="#DCE6FA" stroke-width="1" fill="none">
        <rect x="22" y="22" width="90" height="166"/><rect x="125" y="22" width="90" height="166"/><rect x="228" y="22" width="90" height="166"/>
      </g>
      <rect x="22" y="22" width="193" height="86" fill="#002EAA"/>
      <rect x="22" y="120" width="193" height="8" fill="#0B1A4A"/><rect x="22" y="136" width="176" height="6" fill="#34477B"/><rect x="22" y="148" width="188" height="6" fill="#34477B"/><rect x="22" y="160" width="160" height="6" fill="#34477B"/>
      <rect x="228" y="120" width="28" height="4" fill="#F36301"/>
      <rect x="228" y="132" width="84" height="5" fill="#F36301"/><rect x="228" y="143" width="70" height="5" fill="#34477B"/><rect x="228" y="154" width="78" height="5" fill="#34477B"/>
      <text x="118" y="70" fill="#F9EED5" font-size="13" font-weight="700" text-anchor="middle">2 栏跨幅主图</text>
    </svg>`,
  },
  2006: {
    meta: "2006 年 1 月 30 日 · A LIST APART",
    title: "Matthew Levine 破解无表格 CSS 三列布局",
    body: "早期网页开发者只能用 HTML table 拼三列。2006 年 1 月 30 日，Matthew Levine 在《A List Apart》发表《In Search of the Holy Grail》，借助容器内边距与负外边距，首次在不破坏主内容源码顺序的前提下实现「流式中栏 + 定宽双侧栏」的纯 CSS 三列结构。",
    detail: "该模式专有变体请见同系列 <a href='https://layout.xiaoxiaodong.ai/260/play/' target='_blank' rel='noopener'>260 圣杯布局</a>，这里只记下它在三列网页史上的转折意义。",
    source: '原文核实：<a href="https://alistapart.com/article/holygrail/" target="_blank" rel="noopener">A List Apart — In Search of the Holy Grail (2006)</a>',
    svg: `<svg viewBox="0 0 340 210" role="img" aria-label="2006 负边距流式中栏加定宽双侧栏结构示意">
      <rect x="8" y="8" width="324" height="194" fill="#FDF8EC" stroke="#002EAA" stroke-width="2"/>
      <rect x="20" y="20" width="300" height="24" fill="#002EAA"/>
      <rect x="20" y="52" width="66" height="106" fill="#DCE6FA" stroke="#002EAA" stroke-dasharray="4 3"/>
      <rect x="94" y="52" width="152" height="106" fill="#F36301"/>
      <rect x="254" y="52" width="66" height="106" fill="#DCE6FA" stroke="#002EAA" stroke-dasharray="4 3"/>
      <rect x="20" y="166" width="300" height="22" fill="#001C6E"/>
      <text x="170" y="109" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Fluid Center (100%)</text>
      <text x="53" y="109" fill="#002EAA" font-size="10" font-weight="700" text-anchor="middle">-margin</text>
      <text x="287" y="109" fill="#002EAA" font-size="10" font-weight="700" text-anchor="middle">-margin</text>
    </svg>`,
  },
  2017: {
    meta: "2017 年 3 月 · W3C CSS GRID LEVEL 1",
    title: "三大浏览器同月上线 CSS Grid，一行代码定三列",
    body: "2017 年 3 月，Firefox 52（3 月 7 日）、Chrome 57（3 月 9 日）与 Safari 10.1（3 月 27 日）在同一个月内集中上线原生 CSS Grid Layout Level 1。开发者终于摆脱浮动清除与负边距技巧，直接用 fr 比例轨道、minmax() 安全底宽与 gap 原生缝距声明三列。",
    detail: "现代标准写法：display: grid; grid-template-columns: 220px minmax(0, 1fr) 260px; gap: 24px;",
    source: '标准规范：<a href="https://www.w3.org/TR/css-grid-1/" target="_blank" rel="noopener">W3C CSS Grid Layout Module Level 1</a>',
    svg: `<svg viewBox="0 0 340 210" role="img" aria-label="2017 CSS Grid 原生三轨道加 gap 结构示意">
      <rect x="8" y="8" width="324" height="194" fill="#001C6E" stroke="#F36301" stroke-width="2"/>
      <rect x="22" y="34" width="68" height="134" fill="#002EAA" stroke="#90B0FF" stroke-width="1.5"/>
      <rect x="106" y="34" width="128" height="134" fill="#F36301" stroke="#F9EED5" stroke-width="1.5"/>
      <rect x="250" y="34" width="68" height="134" fill="#002EAA" stroke="#90B0FF" stroke-width="1.5"/>
      <rect x="90" y="34" width="16" height="134" fill="#F9EED5" fill-opacity="0.22"/>
      <rect x="234" y="34" width="16" height="134" fill="#F9EED5" fill-opacity="0.22"/>
      <text x="56" y="106" fill="#F9EED5" font-size="12" font-weight="700" text-anchor="middle">220px</text>
      <text x="170" y="106" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">minmax(0, 1fr)</text>
      <text x="284" y="106" fill="#F9EED5" font-size="12" font-weight="700" text-anchor="middle">260px</text>
      <text x="98" y="186" fill="#FF9447" font-size="10" font-weight="700" text-anchor="middle">gap</text>
      <text x="242" y="186" fill="#FF9447" font-size="10" font-weight="700" text-anchor="middle">gap</text>
    </svg>`,
  },
};

const eraBtns = [...document.querySelectorAll("[data-era]")];
const eraVisual = document.getElementById("eraVisual");
const eraMeta = document.getElementById("eraMeta");
const eraTitle = document.getElementById("eraTitle");
const eraBody = document.getElementById("eraBody");
const eraDetail = document.getElementById("eraDetail");
const eraSource = document.getElementById("eraSource");

function selectEra(yr) {
  const e = ERAS[yr] || ERAS[1958];
  eraBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === String(yr))));
  eraVisual.innerHTML = e.svg;
  eraMeta.textContent = e.meta;
  eraTitle.textContent = e.title;
  eraBody.textContent = e.body;
  eraDetail.innerHTML = e.detail;
  eraSource.innerHTML = e.source;
}

eraBtns.forEach((b) => b.addEventListener("click", () => selectEra(b.dataset.era)));
selectEra("1958");

// ==================== 04 屏幕变窄折叠台 ====================
let collapseVw = 1200;
let collapseStrat = "stepped";

const rangeCollapseVw = document.getElementById("rangeCollapseVw");
const outCollapseVw = document.getElementById("outCollapseVw");
const stratBtns = [...document.querySelectorAll("[data-strat]")];
const collapsePreview = document.getElementById("collapsePreview");
const collapseVerdict = document.getElementById("collapseVerdict");
const collapseCode = document.getElementById("collapseCode");

function renderCollapse() {
  const res = evaluateCollapse(collapseVw, collapseStrat);
  outCollapseVw.textContent = `${res.vw}px`;
  stratBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.strat === collapseStrat)));

  const maxPreviewW = Math.round(Math.max(300, Math.min(1000, (res.vw / 1440) * 1000)));
  collapsePreview.style.maxWidth = `${maxPreviewW}px`;

  const visibleBoxes = res.boxes.filter((b) => !b.hidden);
  const hasDrawer = res.boxes.some((b) => b.hidden);

  let gridCols = "1fr";
  if (res.layoutMode === "3-col") {
    const tot = visibleBoxes.reduce((a, b) => a + b.w, 0);
    gridCols = visibleBoxes.map((b) => `${Math.round((b.w / tot) * 100)}%`).join(" ");
  } else if (res.layoutMode === "2-col+drop") {
    gridCols = "28% 1fr";
  } else if (res.layoutMode === "drawer+2") {
    gridCols = "1fr 32%";
  }

  const cells = visibleBoxes
    .map((b, idx) => {
      const isMain = b.name.includes("正文");
      const isBad = b.w < 170;
      const spanStyle = b.span === 2 ? ' style="grid-column: 1 / -1;"' : "";
      const cls = `cp-col${isMain ? " cp-main" : ""}${isBad ? " cp-bad" : ""}`;
      return `<div class="${cls}"${spanStyle}><strong>${b.name}</strong><span>${b.w}px · 约 ${b.cpl} 字/行</span></div>`;
    })
    .join("");

  collapsePreview.innerHTML = `
    <div class="cp-browser-bar">
      <span>VIEWPORT ${res.vw}px · ${res.layoutMode}</span>
      ${hasDrawer ? '<span class="cp-drawer-pill">[菜单] 左栏已收进抽屉</span>' : `<span>gap ${res.gap}px</span>`}
    </div>
    <div class="cp-grid" style="grid-template-columns:${gridCols};">${cells}</div>
  `;

  collapseVerdict.textContent = res.verdict;
  collapseVerdict.dataset.status = res.status;
  collapseCode.textContent = res.css;
}

rangeCollapseVw.addEventListener("input", () => {
  collapseVw = Number(rangeCollapseVw.value);
  renderCollapse();
});

stratBtns.forEach((b) =>
  b.addEventListener("click", () => {
    collapseStrat = b.dataset.strat;
    renderCollapse();
  })
);
renderCollapse();

// ==================== 05 需求分诊决策卡片 ====================
const TRIAGE_CASES = [
  {
    id: "pricing",
    tag: "CASE 01 · 数据展示",
    title: "三档 SaaS 订阅方案对比",
    desc: "桌面端展示基础版、专业主推版、企业版三套价格与权益，帮决策者一屏横比。",
    fit: true,
    why: "非常适合三列：三档平行对比加上中间主推色块，正好发挥「模块化 + 对比」优势。",
  },
  {
    id: "essay",
    tag: "CASE 02 · 长篇阅读",
    title: "12000 字人物深度专访",
    desc: "读者需要沉浸读完整篇采访故事，无需同时对照多份侧栏工具。",
    fit: false,
    why: "别用三列：线性深度阅读最怕左右分心，应换用 255 单列页面 锁稳舒适行宽。",
  },
  {
    id: "workspace",
    tag: "CASE 03 · 图文信息",
    title: "桌面端知识库文档页",
    desc: "左列目录树、中列主文档、右列本页大纲与批注，宽屏下需高频跳转对照。",
    fit: true,
    why: "经典三列主场：左导、中读、右查各司其职，但平板与手机端务必及时折叠。",
  },
  {
    id: "checkout",
    tag: "CASE 04 · 窄屏表单",
    title: "手机端收货地址与支付页",
    desc: "390px 竖屏里填写姓名、电话、地址、发票并点击提交按钮。",
    fit: false,
    why: "绝不用三列：手机硬拆三列会把输入框压碎成手指点不中的细条，应使用单列或 266 手风琴分段。",
  },
  {
    id: "speakers",
    tag: "CASE 05 · 人物介绍",
    title: "设计峰会三位主讲嘉宾卡",
    desc: "桌面端横向展示三位主讲人剪影头像、头衔与主题亮点。",
    fit: true,
    why: "适合等宽三列：呼应原海报「人物介绍：形象 + 文字 · 亮点突出」，节奏整齐明快。",
  },
  {
    id: "compare2",
    tag: "CASE 06 · 二元对照",
    title: "商品主图与参数说明双屏",
    desc: "整页只有「左高清产品图」和「右规格下单区」两大块，没有第三股信息。",
    fit: false,
    why: "不必强凑第三列：硬塞广告或冗余标签只会稀释下单焦点，直接用 256 双列或 259 分屏布局。",
  },
];

const triageGrid = document.getElementById("triageGrid");
triageGrid.innerHTML = TRIAGE_CASES.map(
  (c) => `
  <article class="triage-card" data-case="${c.id}">
    <span class="triage-tag" lang="en">${c.tag}</span>
    <h3>${c.title}</h3>
    <p>${c.desc}</p>
    <div class="triage-btns">
      <button type="button" class="triage-btn" data-pick="yes" aria-pressed="false">适合三列</button>
      <button type="button" class="triage-btn" data-pick="no" aria-pressed="false">换别的布局</button>
    </div>
    <div class="triage-res" hidden></div>
  </article>`
).join("");

triageGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".triage-btn");
  if (!btn) return;
  const card = btn.closest(".triage-card");
  const item = TRIAGE_CASES.find((x) => x.id === card.dataset.case);
  const pickedFit = btn.dataset.pick === "yes";
  const right = pickedFit === item.fit;
  card.querySelectorAll(".triage-btn").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  const res = card.querySelector(".triage-res");
  res.hidden = false;
  res.dataset.right = String(right);
  res.textContent = `${right ? "判断准确：" : "再想想："}${item.why}`;
});

// ==================== 06 小练习：单变量三列宽比考题 ====================
const quizGrid = document.getElementById("quizGrid");
const qvTitle = document.getElementById("qvTitle");
const qvBody = document.getElementById("qvBody");

function buildQuizSvg(pcts) {
  const W = 240;
  const gap = 8;
  const pad = 10;
  const usable = W - pad * 2 - gap * 2;
  const ws = pcts.map((p) => Math.round((usable * p) / 100));
  ws[2] = usable - ws[0] - ws[1];
  const xs = [pad, pad + ws[0] + gap, pad + ws[0] + gap + ws[1] + gap];

  const col = (i, fill, lineFill, linesN) => {
    const x = xs[i];
    const w = ws[i];
    const bars = Array.from({ length: linesN }, (_, li) => {
      const lw = Math.max(8, w - 12 - (li % 2) * 8);
      return `<rect x="${x + 6}" y="${44 + li * 13}" width="${lw}" height="4" fill="${lineFill}" opacity="0.82"/>`;
    }).join("");
    return `
      <rect x="${x}" y="14" width="${w}" height="122" fill="${fill}" stroke="#002EAA" stroke-width="1.2"/>
      <rect x="${x + 6}" y="22" width="${Math.min(22, Math.max(8, w - 12))}" height="4" fill="#F36301"/>
      <rect x="${x + 6}" y="31" width="${Math.max(8, w - 12)}" height="6" fill="${lineFill}"/>
      ${bars}
    `;
  };

  return `<svg viewBox="0 0 240 150" class="quiz-svg" aria-hidden="true">
    <rect width="240" height="150" fill="#F9EED5"/>
    ${col(0, "#EEF3FB", "#002EAA", 5)}
    ${col(1, "#002EAA", "#F9EED5", 6)}
    ${col(2, "#FDF8EC", "#34477B", 4)}
  </svg>`;
}

quizGrid.innerHTML = QUIZ_OPTIONS.map(
  (opt) => `
  <button type="button" class="quiz-opt" data-quiz="${opt.id}" aria-pressed="false">
    <div class="quiz-opt-head">
      <strong>方案 ${opt.id}</strong>
      <span>${opt.ratioLabel}</span>
    </div>
    ${buildQuizSvg(opt.pcts)}
  </button>`
).join("");

quizGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".quiz-opt");
  if (!btn) return;
  const picked = QUIZ_OPTIONS.find((o) => o.id === btn.dataset.quiz);
  quizGrid.querySelectorAll(".quiz-opt").forEach((b) => {
    const o = QUIZ_OPTIONS.find((x) => x.id === b.dataset.quiz);
    b.setAttribute("aria-pressed", String(b === btn));
    if (o.correct) b.dataset.state = "correct";
    else if (b === btn) b.dataset.state = "wrong";
    else delete b.dataset.state;
  });
  qvTitle.textContent = `方案 ${picked.id}（${picked.ratioLabel}）· ${picked.verdictTitle}`;
  qvBody.textContent = picked.verdictBody;
});

// ==================== 07 原海报放大、缩放与拖动 ====================
const posterImg = document.getElementById("poster");
const posterOpenBtn = document.getElementById("posterOpenBtn");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbStage = document.getElementById("lbStage");
const lbClose = document.getElementById("lbClose");
const lbZoomIn = document.getElementById("lbZoomIn");
const lbZoomOut = document.getElementById("lbZoomOut");
const lbZoomReset = document.getElementById("lbZoomReset");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLb() {
  lbImg.src = posterImg.src;
  lbScale = 1.25;
  lbX = 0;
  lbY = 0;
  applyLb();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLb() {
  lightbox.hidden = true;
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLb);
lbClose.addEventListener("click", closeLb);
lbZoomIn.addEventListener("click", () => {
  lbScale = Math.min(3.5, +(lbScale + 0.35).toFixed(2));
  applyLb();
});
lbZoomOut.addEventListener("click", () => {
  lbScale = Math.max(0.8, +(lbScale - 0.35).toFixed(2));
  applyLb();
});
lbZoomReset.addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLb();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.8, Math.min(3.5, +(lbScale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
  applyLb();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  lbStage.style.cursor = "grabbing";
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLb();
});
lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
  lbStage.style.cursor = "grab";
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLb();
});
