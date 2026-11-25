// 325 折枝式构图 · 主交互编排（开场写生卷 + 正文 7 节独立互动 + 灯箱）
import { loop } from "../../lib/stage.js";
import {
  applyPreset,
  clamp,
  computeColophonBalance,
  createState,
  diagnose,
  PRACTICE_CASES,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = createState();

// =============== 开场：同步 UI 读数、自示范标题折枝与画布 ===============
const topSeal = $("#top-seal");
const mobileSeal = $("#mobile-seal");
const diagBlock = $("#diag-block");
const diagSeal = $("#diag-seal");
const diagTitle = $("#diag-title");
const diagBody = $("#diag-body");
const diagNext = $("#diag-next");
const mIncline = $("#m-incline");
const mBend = $("#m-bend");
const mOffset = $("#m-offset");
const mVoid = $("#m-void");
const titleTwigPath = $("#title-twig-path");
const titleTwigHalo = $("#title-twig-halo");
const titleTwigCore = $("#title-twig-core");
const bendSlider = $("#bend-slider");
const bendSliderVal = $("#bend-slider-val");
const btnPruneLeaves = $("#btn-prune-leaves");
const btnPruneDecoy = $("#btn-prune-decoy");
const btnGuides = $("#btn-guides");

function syncHeroUI() {
  const d = diagnose(state);
  const g = d.g;
  const statusAttr = d.ok ? "ok" : "err";

  topSeal.textContent = d.primary.badge;
  topSeal.dataset.state = statusAttr;
  mobileSeal.textContent = d.ok ? "4/4 达标" : `${d.passedCount}/4`;
  mobileSeal.dataset.state = statusAttr;

  diagBlock.dataset.state = statusAttr;
  diagSeal.textContent = d.primary.badge;
  diagTitle.textContent = d.primary.title;
  diagBody.textContent = d.primary.body;
  diagNext.textContent = d.primary.action;

  mIncline.textContent = `${g.inclineDeg}°`;
  mBend.textContent = `${g.bendDeg}°`;
  mOffset.textContent = `${g.centerOffsetPct}%`;
  mVoid.textContent = `${g.whitespacePct}% · ${g.whitespaceTier}`;

  // 同步原海报三条核心知识点实况
  const setPoint = (id, ok, val) => {
    const li = $(`#${id}`);
    li.dataset.ok = String(ok);
    $(`#${id}-val`).textContent = val;
  };
  setPoint("pt-guide", d.checks.guide, d.pointStatus.guide);
  setPoint("pt-focus", d.checks.focus, d.pointStatus.focus);
  setPoint("pt-balance", d.checks.balance, d.pointStatus.balance);

  // 自示范标题折枝底痕随实时折势弯折
  const jy = clamp(14 + state.bend * 28, 5, 24);
  const tx = clamp(180 + g.tip.x * 130, 190, 306);
  const ty = clamp(4 + g.tip.y * 14, 5, 19);
  titleTwigPath.setAttribute("d", `M2 22 L152 ${jy.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}`);
  titleTwigHalo.setAttribute("cx", tx.toFixed(1));
  titleTwigHalo.setAttribute("cy", ty.toFixed(1));
  titleTwigCore.setAttribute("cx", tx.toFixed(1));
  titleTwigCore.setAttribute("cy", ty.toFixed(1));

  // 同步控件状态
  $$(".tab-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.theme === state.theme)));
  $$(".root-btns .mini-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.root === state.rootEdge)));

  const sliderInt = Math.round(state.bend * 100);
  bendSlider.value = String(clamp(sliderInt, -30, 30));
  bendSliderVal.textContent = `${g.bendDeg}°`;

  btnPruneLeaves.textContent = state.extraFoliage ? "修剪杂叶" : "恢复杂叶";
  btnPruneLeaves.setAttribute("aria-pressed", String(!state.extraFoliage));
  btnPruneDecoy.textContent = state.dualFocus ? "剪除副花" : "恢复副花";
  btnPruneDecoy.setAttribute("aria-pressed", String(!state.dualFocus));
  btnGuides.textContent = state.showGuides ? "虚线引注：开" : "虚线引注：关";
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
}

const heroCanvas = $("#hero-canvas");
const heroCtl = mountHeroCanvas(heroCanvas, state, syncHeroUI);
syncHeroUI();

$$(".tab-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    syncHeroUI();
    heroCtl.redraw(false);
  })
);

$$(".chip-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    applyPreset(state, btn.dataset.preset);
    syncHeroUI();
    heroCtl.redraw(false);
  })
);

$$(".root-btns .mini-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.rootEdge = btn.dataset.root;
    syncHeroUI();
    heroCtl.redraw(false);
  })
);

bendSlider.addEventListener("input", () => {
  state.bend = Number(bendSlider.value) / 100;
  syncHeroUI();
  heroCtl.redraw(false);
});

btnPruneLeaves.addEventListener("click", () => {
  state.extraFoliage = !state.extraFoliage;
  syncHeroUI();
  heroCtl.redraw(false);
});

btnPruneDecoy.addEventListener("click", () => {
  state.dualFocus = !state.dualFocus;
  syncHeroUI();
  heroCtl.redraw(false);
});

btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncHeroUI();
  heroCtl.redraw(false);
});

// =============== 01 节：三态眼动轨迹对比板 ===============
const GAZE_MODES = {
  straight: {
    badge: "枝端驻留：偏弱 · 易滑出（示意）",
    caption: "完全笔直的斜线像一枚无缓冲的箭头：眼神顺着直线高速冲过花朵，直接滑向右上角画框之外，很难在花心停下来细品。",
    point(u) {
      // 一路匀速冲到右上角边界
      const x = u * 626;
      const y = 300 - u * 298;
      return { x, y, r: 10 };
    },
    still: { x: 560, y: 34, r: 12 },
  },
  bent: {
    badge: "枝端驻留：稳停 · 节奏从容（示意）",
    caption: "视线从左下粗枝入画，到中段折节处微微一顿，顺势转向上扬细梢，最后稳稳停在孤立的胭脂花心——左上方与右下方留出的大片宣纸，把这处停顿衬得清旷从容。",
    point(u) {
      if (u < 0.34) {
        const k = u / 0.34;
        return { x: k * 292, y: 302 - k * 90, r: 11 };
      }
      if (u < 0.64) {
        const k = (u - 0.34) / 0.3;
        return { x: 292 + k * 176, y: 212 - k * 124, r: 12 };
      }
      // 后 36% 周期稳稳驻留在枝端花心并轻缓呼吸
      const p = (u - 0.64) / 0.36;
      return { x: 468, y: 88, r: 13 + Math.sin(p * Math.PI) * 7 };
    },
    still: { x: 468, y: 88, r: 15 },
  },
  crowded: {
    badge: "枝端驻留：分散 · 三处打架（示意）",
    caption: "枝腰上密密麻麻堆着杂叶和两朵同等体量的副花，视线走两步就被绊住一次，在三团红晕之间反复折返，彻底失去了「意在枝端」的清气。",
    point(u) {
      const stops = [
        [155, 242],
        [292, 206],
        [468, 88],
        [292, 206],
        [155, 242],
      ];
      const seg = Math.min(stops.length - 2, Math.floor(u * (stops.length - 1)));
      const k = u * (stops.length - 1) - seg;
      const [x1, y1] = stops[seg];
      const [x2, y2] = stops[seg + 1];
      return { x: x1 + (x2 - x1) * k, y: y1 + (y2 - y1) * k, r: 12 };
    },
    still: { x: 292, y: 206, r: 14 },
  },
};

let gazeMode = "bent";
const gazeSvg = $("#gaze-svg");
const gazeRing = $("#gaze-ring");
const gazeDot = $("#gaze-dot");
const gazeBadge = $("#gaze-badge");
const gazeCaption = $("#gaze-caption");

function setGazeMode(mode) {
  gazeMode = mode;
  $$(".gaze-tab").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.gaze === mode)));
  ["straight", "bent", "crowded"].forEach((k) => {
    const el = $(`#gaze-scene-${k}`);
    el.toggleAttribute("hidden", k !== mode);
    el.style.display = k === mode ? "" : "none";
  });
  gazeBadge.textContent = GAZE_MODES[mode].badge;
  gazeCaption.textContent = GAZE_MODES[mode].caption;
  gazeCtl.draw();
}

const gazeCtl = loop(gazeSvg, (t, _dt, { still }) => {
  const cfg = GAZE_MODES[gazeMode];
  const pt = still ? cfg.still : cfg.point((t * 0.34) % 1);
  gazeRing.setAttribute("cx", pt.x.toFixed(1));
  gazeRing.setAttribute("cy", pt.y.toFixed(1));
  gazeRing.setAttribute("r", pt.r.toFixed(1));
  gazeDot.setAttribute("cx", pt.x.toFixed(1));
  gazeDot.setAttribute("cy", pt.y.toFixed(1));
});

$$(".gaze-tab").forEach((b) => b.addEventListener("click", () => setGazeMode(b.dataset.gaze)));

// =============== 02 节：四代画史卷轴页签 ===============
const ERAS = {
  tang: {
    year: "8 世纪末 · 贞元间",
    title: "唐代边鸾：折枝花鸟首见画史",
    desc: "唐代朱景玄《唐朝名画录》（约成书于 841 年）记唐德宗贞元年间（785–805）画花鸟大家边鸾，赞其「折枝草木之妙，未之有也」。北宋官方编纂的《宣和画谱》（1120 年）卷十五再记其「又作折枝花，亦曲尽其妙」——花鸟自此不必再画全株根土，改以一枝特写夺取神态。",
    cite: "文献核实：朱景玄《唐朝名画录》；北宋《宣和画谱》卷十五",
    svg: `
      <rect x="28" y="24" width="84" height="142" fill="none" stroke="#9A9080" stroke-dasharray="3 3"/>
      <path d="M70 156 L70 46 M70 116 L44 92 M70 100 L96 80 M70 76 L50 58" stroke="#7A7368" stroke-width="2.5" stroke-linecap="round"/>
      <text x="70" y="178" text-anchor="middle" fill="#4A473F" font-size="11">早期整株全貌</text>
      <path d="M120 95 L138 95" stroke="#8C2E27" stroke-width="2"/>
      <polygon points="136,90 144,95 136,100" fill="#8C2E27"/>
      <path d="M150 152 L192 106 L222 58" fill="none" stroke="#1B1A16" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="222" cy="58" r="18" fill="#DFA596"/>
      <circle cx="222" cy="58" r="4" fill="#8C2E27"/>
      <text x="196" y="178" text-anchor="middle" fill="#8C2E27" font-size="11" font-weight="700">折取一枝特写</text>
    `,
  },
  nsong: {
    year: "10–11 世纪 · 北宋",
    title: "北宋赵昌：晨露写生，折枝传神",
    desc: "《宣和画谱》（1120 年）卷十八记载广汉画家赵昌「善画花果，名重一时。作折枝极有生意，傅色尤造其妙」，他常在清晨朝露未干时绕栏对花调色写生，自号「写生赵昌」。折枝从装饰母题彻底成熟为独立的写生审美样式。",
    cite: "文献核实：北宋官方《宣和画谱》卷十八（1120 年成书）",
    svg: `
      <circle cx="130" cy="94" r="68" fill="#EFE7D6" stroke="#B7AA94" stroke-width="1.2"/>
      <path d="M72 134 L126 106 L166 66" fill="none" stroke="#1B1A16" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="166" cy="66" r="22" fill="#DFA596"/>
      <circle cx="166" cy="66" r="5" fill="#8C2E27"/>
      <ellipse cx="108" cy="120" rx="16" ry="7" transform="rotate(24 108 120)" fill="#4F573F"/>
      <ellipse cx="146" cy="88" rx="14" ry="6" transform="rotate(-18 146 88)" fill="#4F573F"/>
      <text x="130" y="178" text-anchor="middle" fill="#4A473F" font-size="11">对景写生 · 傅色重生意</text>
    `,
  },
  ssong: {
    year: "12–13 世纪 · 南宋",
    title: "南宋院体小品：方寸留白的巅峰",
    desc: "南宋纨扇与册页将折枝构图推向极致：林椿《果熟来禽图》页（故宫博物院藏，26.9×27.2 cm）以一枝秋果配回眸小鸟定住方寸生机；马麟《层叠冰绡图》轴（故宫博物院藏，101.7×49.6 cm，约 1216 年杨皇后题诗）以两枝绿萼梅斜向穿插；马远《月下赏梅图》（大都会艺术博物馆藏，25.1×26.7 cm）斜枝探向明月虚空。",
    cite: "藏品核实：北京故宫博物院藏《果熟来禽图》《层叠冰绡图》；大都会艺术博物馆 1986.493.2",
    svg: `
      <rect x="44" y="18" width="172" height="146" fill="#E8DCC5" stroke="#B7AA94" stroke-width="1.4"/>
      <path d="M44 134 L118 106 L168 58" fill="none" stroke="#23201B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="168" cy="58" r="19" fill="#F6F1E7" stroke="#A69882"/>
      <circle cx="168" cy="58" r="4" fill="#6B4236"/>
      <circle cx="80" cy="48" r="12" fill="#F6F1E7" fill-opacity="0.7"/>
      <text x="130" y="178" text-anchor="middle" fill="#4A473F" font-size="11">方寸宋绢 · 留白成境</text>
    `,
  },
  qing: {
    year: "1701–1756 · 清康熙至乾隆",
    title: "清代画谱：从经验提炼成章法铁律",
    desc: "康熙四十年（1701 年），王概、王蓍、王臬刊行《芥子园画传》二、三集，系统图解出枝、穿插与向背。乾隆年间，邹一桂在《小山画谱》（卷末记乾隆二十一年 1756 年洋菊事）开篇「章法」点出「一实一虚，一疏一密」「势如勾股」「转枝切忌蛇形」，把折枝构图写成了清晰的方法论。",
    cite: "文献核实：王概等《芥子园画传》（1701）；邹一桂《小山画谱》卷上「章法」",
    svg: `
      <rect x="30" y="20" width="200" height="142" fill="#F6F1E7" stroke="#1B1A16" stroke-width="1.2"/>
      <path d="M30 144 L132 108 L184 48" fill="none" stroke="#1B1A16" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M132 108 L184 108 L184 48" fill="none" stroke="#8C2E27" stroke-width="1.3" stroke-dasharray="4 3"/>
      <text x="158" y="122" text-anchor="middle" fill="#8C2E27" font-size="11">势如勾股</text>
      <circle cx="184" cy="48" r="14" fill="#DFA596"/>
      <text x="130" y="178" text-anchor="middle" fill="#4A473F" font-size="11">一实一虚 · 转枝忌蛇</text>
    `,
  },
};

function renderEra(key) {
  const e = ERAS[key];
  $$(".era-btn").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.era === key)));
  $("#era-year").textContent = e.year;
  $("#era-title").textContent = e.title;
  $("#era-desc").textContent = e.desc;
  $("#era-cite").textContent = e.cite;
  $("#era-art").innerHTML = e.svg;
}
renderEra("tang");
$$(".era-btn").forEach((b) => b.addEventListener("click", () => renderEra(b.dataset.era)));

// =============== 03 节：松烟墨砚暗室题款对角配重台 ===============
const sealState = { sealPos: "empty-br", clearance: 22, showCone: true };

function syncSealLab() {
  const res = computeColophonBalance(sealState);
  const tx = res.tipX * 560;
  const ty = res.tipY * 360;

  $("#seal-branch").setAttribute("d", `M0 326 L248 232 L${tx.toFixed(1)} ${ty.toFixed(1)}`);
  $("#seal-halo").setAttribute("cx", tx.toFixed(1));
  $("#seal-halo").setAttribute("cy", ty.toFixed(1));
  $("#seal-core").setAttribute("cx", tx.toFixed(1));
  $("#seal-core").setAttribute("cy", ty.toFixed(1));
  $("#seal-breath-ring").setAttribute("cx", tx.toFixed(1));
  $("#seal-breath-ring").setAttribute("cy", ty.toFixed(1));
  $("#seal-breath-label").setAttribute("x", tx.toFixed(1));
  $("#seal-breath-label").setAttribute("y", (ty + 80).toFixed(1));
  $("#seal-cone").style.display = sealState.showCone ? "" : "none";

  // 顶部叶片跟随上枝中段
  const lx = 248 + (tx - 248) * 0.62;
  const ly = 232 + (ty - 232) * 0.62;
  $("#seal-leaf-top").setAttribute(
    "d",
    `M${lx.toFixed(1)} ${ly.toFixed(1)} C${(lx + 20).toFixed(1)} ${(ly - 8).toFixed(1)}, ${(lx + 42).toFixed(1)} ${(ly - 6).toFixed(1)}, ${(lx + 54).toFixed(1)} ${(ly + 2).toFixed(1)} C${(lx + 38).toFixed(1)} ${(ly + 11).toFixed(1)}, ${(lx + 16).toFixed(1)} ${(ly + 10).toFixed(1)}, ${lx.toFixed(1)} ${ly.toFixed(1)} Z`
  );

  // 题款与印章落位
  const col = $("#seal-colophon");
  if (sealState.sealPos === "none") {
    col.style.display = "none";
  } else {
    col.style.display = "";
    const cx = clamp(res.seal.x * 560 - 44, 18, 456);
    const cy = clamp(res.seal.y * 360 - 30, 18, 286);
    col.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);
  }

  // 重心连线与圆点
  const gx = res.cogX * 560;
  const gy = res.cogY * 360;
  $("#cog-link").setAttribute("x2", gx.toFixed(1));
  $("#cog-link").setAttribute("y2", gy.toFixed(1));
  $("#cog-dot").setAttribute("cx", gx.toFixed(1));
  $("#cog-dot").setAttribute("cy", gy.toFixed(1));
  $("#cog-inner").setAttribute("cx", gx.toFixed(1));
  $("#cog-inner").setAttribute("cy", gy.toFixed(1));
  $("#cog-label").setAttribute("x", (gx + 12).toFixed(1));
  $("#cog-label").setAttribute("y", (gy + 4).toFixed(1));

  const accent = res.status === "ok" ? "#8AD4A0" : res.status === "err" ? "#FF9182" : "#E8A89A";
  $("#cog-dot").setAttribute("stroke", accent);
  $("#cog-inner").setAttribute("fill", accent);
  $("#cog-label").setAttribute("fill", accent);

  $("#seal-readout").dataset.status = res.status;
  $("#seal-verdict").textContent = res.verdict;
  $("#seal-drift").textContent = `重心偏心 ${res.driftPct}%`;
  $("#seal-note").textContent = res.note;
  $("#clearance-val").textContent = `${sealState.clearance}%`;

  $$(".seal-btn-group .ink-btn").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.seal === sealState.sealPos))
  );
  $("#btn-cone").textContent = sealState.showCone ? "呼吸圈示意：开" : "呼吸圈示意：关";
  $("#btn-cone").setAttribute("aria-pressed", String(sealState.showCone));
}

syncSealLab();
$$(".seal-btn-group .ink-btn").forEach((b) =>
  b.addEventListener("click", () => {
    sealState.sealPos = b.dataset.seal;
    syncSealLab();
  })
);
$("#clearance-slider").addEventListener("input", (e) => {
  sealState.clearance = Number(e.target.value);
  syncSealLab();
});
$("#btn-cone").addEventListener("click", () => {
  sealState.showCone = !sealState.showCone;
  syncSealLab();
});

// =============== 04 节：四联现代设计 X-Ray 骨线显影开关 ===============
const btnXray = $("#btn-xray");
const usesGrid = $("#uses-grid");
btnXray.addEventListener("click", () => {
  const on = usesGrid.dataset.xray !== "true";
  usesGrid.dataset.xray = String(on);
  btnXray.setAttribute("aria-pressed", String(on));
  btnXray.textContent = on ? "显露折枝骨架：开" : "显露折枝骨架：关";
});

// =============== 05 节：错配场景压力测试对比器 ===============
const STRESS_CASES = {
  catalog: {
    bad: {
      note: "把 12 件商品硬塞在一条斜枝旁边，留白全被卡片吃干抹净，斜枝不仅引导不了视线，反而挡住了半排价格。",
      svg: `
        <path d="M0 206 L248 134 L420 44" fill="none" stroke="#1B1A16" stroke-width="10" stroke-linecap="round"/>
        <circle cx="420" cy="44" r="34" fill="#DFA596" fill-opacity="0.85"/>
        ${Array.from({ length: 12 }, (_, i) => {
          const c = i % 4, r = Math.floor(i / 4);
          return `<rect x="${22 + c * 132}" y="${16 + r * 66}" width="118" height="54" fill="#EDE5D9" fill-opacity="0.86" stroke="#9C251C" stroke-dasharray="3 3"/>
                  <rect x="${32 + c * 132}" y="${28 + r * 66}" width="52" height="6" fill="#4A473F"/>
                  <rect x="${32 + c * 132}" y="${42 + r * 66}" width="34" height="5" fill="#9C251C"/>`;
        }).join("")}
        <rect x="176" y="88" width="208" height="32" fill="#9C251C"/>
        <text x="280" y="108" text-anchor="middle" fill="#F6F1E7" font-size="13" font-weight="700">留白被 12 卡吞没 · 折枝成噪点</text>
      `,
    },
    good: {
      note: "改用齐整的多栏等距网格：每件商品的缩略图、品名与价格在统一基线上对齐，浏览效率与对比体验立刻翻倍。",
      svg: `
        ${Array.from({ length: 12 }, (_, i) => {
          const c = i % 4, r = Math.floor(i / 4);
          return `<rect x="${22 + c * 132}" y="${16 + r * 66}" width="118" height="54" fill="#EDE5D9" stroke="#364932"/>
                  <rect x="${30 + c * 132}" y="${24 + r * 66}" width="32" height="38" fill="#4F573F" fill-opacity="0.35"/>
                  <rect x="${70 + c * 132}" y="${28 + r * 66}" width="56" height="6" fill="#1B1A16"/>
                  <rect x="${70 + c * 132}" y="${42 + r * 66}" width="36" height="5" fill="#364932"/>`;
        }).join("")}
      `,
    },
  },
  duet: {
    bad: {
      note: "两位同等重要的对谈嘉宾被硬按在单根折枝上：一位占着枝端、另一位被迫缩在半路，视觉等级瞬间偏心失礼。",
      svg: `
        <path d="M0 202 L230 132 L420 58" fill="none" stroke="#1B1A16" stroke-width="8" stroke-linecap="round"/>
        <circle cx="420" cy="58" r="32" fill="#DFA596"/>
        <circle cx="420" cy="52" r="10" fill="#1B1A16"/>
        <path d="M402 82 C404 68, 436 68, 438 82 Z" fill="#1B1A16"/>
        <circle cx="212" cy="142" r="24" fill="#D2C7B5" stroke="#9C251C" stroke-dasharray="3 3"/>
        <circle cx="212" cy="138" r="8" fill="#4A473F"/>
        <path d="M198 160 C200 149, 224 149, 226 160 Z" fill="#4A473F"/>
        <text x="150" y="48" fill="#9C251C" font-size="13" font-weight="700">嘉宾乙沦为枝腰配角，主次失衡</text>
      `,
    },
    good: {
      note: "改用左右对称或双栏呼应（类似 322 一河两岸式的分庭抗礼）：两位嘉宾同等体量、隔中线对话，体面又平等。",
      svg: `
        <line x1="280" y1="20" x2="280" y2="200" stroke="#C8BCAA" stroke-dasharray="4 4"/>
        <rect x="46" y="28" width="204" height="164" fill="#EDE5D9" stroke="#364932"/>
        <rect x="310" y="28" width="204" height="164" fill="#EDE5D9" stroke="#364932"/>
        <circle cx="148" cy="84" r="22" fill="#4F573F"/>
        <path d="M116 146 C120 118, 176 118, 180 146 Z" fill="#4F573F"/>
        <circle cx="412" cy="84" r="22" fill="#8C2E27"/>
        <path d="M380 146 C384 118, 440 118, 444 146 Z" fill="#8C2E27"/>
        <text x="148" y="176" text-anchor="middle" fill="#1B1A16" font-size="12" font-weight="600">嘉宾甲 · 同等位次</text>
        <text x="412" y="176" text-anchor="middle" fill="#1B1A16" font-size="12" font-weight="600">嘉宾乙 · 同等位次</text>
      `,
    },
  },
  banner: {
    bad: {
      note: "在高度极窄的顶部通知条里硬画折枝，倾角被迫压扁到不足 10°，花晕上下全被裁切，只剩一截莫名其妙的斜黑杠。",
      svg: `
        <rect x="24" y="76" width="512" height="62" fill="#EDE5D9" stroke="#9C251C" stroke-width="1.5"/>
        <path d="M24 134 L268 118 L472 90" fill="none" stroke="#1B1A16" stroke-width="7"/>
        <circle cx="472" cy="90" r="24" fill="#DFA596"/>
        <rect x="24" y="52" width="512" height="24" fill="#F6F1E7"/>
        <text x="280" y="166" text-anchor="middle" fill="#9C251C" font-size="13" font-weight="700">纵向伸展空间不足，斜枝压扁、花晕顶破上沿</text>
      `,
    },
    good: {
      note: "改用水平单行流：左徽标、中简讯、右操作按钮，顺着横条本身的自然纵横比走，一眼扫完不费劲。",
      svg: `
        <rect x="24" y="76" width="512" height="62" fill="#EDE5D9" stroke="#364932" stroke-width="1.5"/>
        <circle cx="58" cy="107" r="12" fill="#364932"/>
        <rect x="86" y="99" width="224" height="7" fill="#1B1A16"/>
        <rect x="86" y="113" width="150" height="5" fill="#4A473F"/>
        <rect x="424" y="91" width="92" height="32" fill="#8C2E27"/>
        <text x="470" y="111" text-anchor="middle" fill="#F6F1E7" font-size="12" font-weight="700">立即查看</text>
        <text x="280" y="166" text-anchor="middle" fill="#364932" font-size="13" font-weight="600">顺应窄条画幅，水平对齐一眼读完</text>
      `,
    },
  },
};

const stressState = { key: "catalog", fixed: false };
function syncStress() {
  const item = STRESS_CASES[stressState.key][stressState.fixed ? "good" : "bad"];
  $("#stress-svg").innerHTML = item.svg;
  $("#stress-note").textContent = item.note;
  $$(".stress-case").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.case === stressState.key)));
  const flip = $("#stress-flip");
  flip.setAttribute("aria-pressed", String(stressState.fixed));
  flip.textContent = stressState.fixed ? "当前：改换合适构图（点回看错配）" : "当前：硬套折枝（点看改法）";
}
syncStress();
$$(".stress-case").forEach((b) =>
  b.addEventListener("click", () => {
    stressState.key = b.dataset.case;
    stressState.fixed = false;
    syncStress();
  })
);
$("#stress-flip").addEventListener("click", () => {
  stressState.fixed = !stressState.fixed;
  syncStress();
});

// =============== 06 节：四枝定势练习（同源几何渲染） ===============
function renderQuizPlates(revealed) {
  PRACTICE_CASES.forEach((c) => {
    const svg = $(`#quiz-svg-${c.id}`);
    const rx = c.root.x * 240, ry = c.root.y * 200;
    const jx = c.joint.x * 240, jy = c.joint.y * 200;
    const tx = c.tip.x * 240, ty = c.tip.y * 200;

    // 叶片按同一比例随下/上段生成
    const l1x = rx + (jx - rx) * 0.56, l1y = ry + (jy - ry) * 0.56;
    const l2x = jx + (tx - jx) * 0.62, l2y = jy + (ty - jy) * 0.62;
    const a1 = (Math.atan2(jy - ry, jx - rx) * 180) / Math.PI + 32;
    const a2 = (Math.atan2(ty - jy, tx - jx) * 180) / Math.PI + 36;

    const guide = revealed
      ? `
        <line x1="120" y1="0" x2="120" y2="200" stroke="#9A9080" stroke-dasharray="3 4"/>
        <line x1="0" y1="100" x2="240" y2="100" stroke="#9A9080" stroke-dasharray="3 4"/>
        <circle cx="${jx}" cy="${jy}" r="8" fill="none" stroke="${c.correct ? "#2C593A" : "#9C251C"}" stroke-width="1.6"/>
        <text x="12" y="22" fill="${c.correct ? "#2C593A" : "#9C251C"}" font-size="12" font-weight="700">${c.tag}</text>
      `
      : "";

    svg.innerHTML = `
      <rect width="240" height="200" fill="#EDE5D9"/>
      <circle cx="${tx}" cy="${ty}" r="24" fill="#DFA596" fill-opacity="0.9"/>
      <path d="M${rx} ${ry} L${jx} ${jy}" stroke="#1B1A16" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M${jx} ${jy} L${tx} ${ty}" stroke="#1B1A16" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="${tx}" cy="${ty}" r="5" fill="#8C2E27"/>
      <ellipse cx="${l1x + 10}" cy="${l1y + 6}" rx="12" ry="5" transform="rotate(${a1.toFixed(0)} ${l1x + 10} ${l1y + 6})" fill="#4F573F"/>
      <ellipse cx="${l2x + 8}" cy="${l2y + 4}" rx="10" ry="4.5" transform="rotate(${a2.toFixed(0)} ${l2x + 8} ${l2y + 4})" fill="#4F573F"/>
      ${guide}
    `;
  });
}

renderQuizPlates(false);

$$(".quiz-card").forEach((card) =>
  card.addEventListener("click", () => {
    const choice = card.dataset.choice;
    const item = PRACTICE_CASES.find((x) => x.id === choice);
    renderQuizPlates(true);

    $$(".quiz-card").forEach((el) => {
      const k = el.dataset.choice;
      const isTarget = k === choice;
      el.setAttribute("aria-pressed", String(isTarget));
      if (k === "B") el.dataset.result = "right";
      else if (isTarget) el.dataset.result = "wrong";
      else delete el.dataset.result;
    });

    const box = $("#quiz-verdict");
    box.dataset.result = item.correct ? "right" : "wrong";
    $("#qv-title").textContent = item.correct
      ? `选对了（${item.id} · ${item.tag}）`
      : `你选了 ${item.id}（${item.tag}）—— 建议对照 B 看差异`;
    $("#qv-text").textContent = item.explain;
  })
);

// =============== 07 节：原海报放大与拖拽灯箱 ===============
const posterBtn = $("#poster-btn");
const posterImg = $("#poster");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbClose = $("#lb-close");

let lbX = 0, lbY = 0, lbDragging = false, lbStartX = 0, lbStartY = 0;

function openLightbox() {
  lbImg.src = posterImg.src;
  lbX = 0;
  lbY = 0;
  lbImg.style.transform = "translate(0px, 0px) scale(1.12)";
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

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target === lbStage) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});
lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDragging = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
});
window.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = clamp(e.clientX - lbStartX, -280, 280);
  lbY = clamp(e.clientY - lbStartY, -280, 280);
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(1.12)`;
});
window.addEventListener("pointerup", () => {
  lbDragging = false;
});
