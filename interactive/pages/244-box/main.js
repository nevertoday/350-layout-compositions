// 244 盒子 BOX — 交互总控：开场四层盒模型解剖台 + 六个专题互动实验 + 原海报灯箱

import {
  LIMITS,
  PRESETS,
  clampParam,
  evaluateBox,
  initialState,
} from "./model.js";
import { createBoxCanvas } from "./box-canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 1. 开场活体四层盒模型解剖台 ====================
let state = initialState();
let metrics = evaluateBox(state);

const canvasEl = $("#box-canvas");
const titleFrame = $("#title-demo-frame");
const heroStatusPill = $("#hero-status-pill");
const diagBadge = $("#diag-badge");
const diagHeadline = $("#diag-headline");
const diagBody = $("#diag-body");
const diagHintText = $("#diag-hint-text");
const mathFormula = $("#math-formula");
const liveCss = $("#live-css");

const btnExplode = $("#btn-explode");
const btnHc = $("#btn-hc");
const btnOutline = $("#btn-outline");

const inputs = {
  width: $("#in-width"),
  padding: $("#in-padding"),
  border: $("#in-border"),
  margin: $("#in-margin"),
};
const outputs = {
  width: $("#out-width"),
  padding: $("#out-padding"),
  border: $("#out-border"),
  margin: $("#out-margin"),
};

const setText = (el, txt) => {
  if (el && el.textContent !== txt) el.textContent = txt;
};

let lastTitleSig = "";
function syncHeroUI() {
  metrics = evaluateBox(state);
  const s = metrics.state;
  const allOk = metrics.passCount === 4;

  // 顶部状态标 + 自示范标题框实时响应（仅数值变化时写入，避免拖拽时无谓重排）
  setText(heroStatusPill, allOk ? "4 / 4 盒界合度" : `${metrics.passCount} / 4 待校准`);
  const okStr = allOk ? "1" : "0";
  if (heroStatusPill.dataset.ok !== okStr) heroStatusPill.dataset.ok = okStr;

  const demoPadX = Math.max(6, Math.min(22, Math.round(s.padding * 0.5 + 4)));
  const demoPadY = Math.max(3, Math.min(12, Math.round(s.padding * 0.22 + 2)));
  const demoBdr = Math.max(1, Math.min(8, s.border === 0 ? 1 : Math.round(s.border * 0.6 + 1)));
  const titleSig = `${demoPadX}|${demoPadY}|${demoBdr}|${okStr}`;
  if (titleSig !== lastTitleSig) {
    lastTitleSig = titleSig;
    titleFrame.style.setProperty("--demo-pad-x", `${demoPadX}px`);
    titleFrame.style.setProperty("--demo-pad-y", `${demoPadY}px`);
    titleFrame.style.setProperty("--demo-bdr", `${demoBdr}px`);
    titleFrame.dataset.ok = okStr;
  }

  // 诊单
  setText(diagBadge, metrics.diagnosis.badge);
  if (diagBadge.dataset.sev !== metrics.diagnosis.severity) {
    diagBadge.dataset.sev = metrics.diagnosis.severity;
  }
  setText(diagHeadline, metrics.diagnosis.headline);
  setText(diagBody, metrics.diagnosis.body);
  setText(diagHintText, metrics.diagnosis.hint);

  // 实时算式与 CSS
  setText(mathFormula, metrics.formulaLine);
  setText(liveCss, metrics.cssText);

  // 题材、立体剥层、高对比、算宽模式、透明护边按钮
  $$("[data-theme]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.theme === s.theme);
  });
  btnExplode.setAttribute("aria-pressed", String(s.viewMode === "exploded"));
  btnHc.setAttribute("aria-pressed", String(s.highContrast));

  $$("[data-sizing]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.sizing === s.boxSizing);
  });
  btnOutline.setAttribute("aria-pressed", String(s.transparentOutline));
  setText(
    btnOutline,
    s.transparentOutline
      ? "已开启 · outline: 2px transparent"
      : "未开启 · 无框时高对比失踪",
  );

  // 滑杆与当前激活层高亮
  for (const k of ["width", "padding", "border", "margin"]) {
    const sv = String(s[k]);
    if (inputs[k].value !== sv) inputs[k].value = sv;
    setText(outputs[k], `${s[k]}px`);
  }
  $$("[data-layer-row]").forEach((row) => {
    row.classList.toggle("is-selected", row.dataset.layerRow === s.activeLayer);
  });

  // 底部四栏原海报核心要点实况
  for (const id of ["content", "padding", "border", "margin"]) {
    const p = metrics.pillars[id];
    const pill = $(`#pill-${id}`);
    if (pill) {
      setText(pill, p.tag);
      const pok = p.ok ? "1" : "0";
      if (pill.dataset.ok !== pok) pill.dataset.ok = pok;
    }
    const item = $(`[data-pillar="${id}"]`);
    if (item) {
      item.classList.toggle("is-selected", s.activeLayer === id);
    }
  }
}

let boxCanvas;
function updateState(patch) {
  state = { ...state, ...patch };
  syncHeroUI();
  if (boxCanvas) boxCanvas.redraw();
}

boxCanvas = createBoxCanvas(canvasEl, {
  getMetrics: () => metrics,
  onChange: (patch) => updateState(patch),
  onSelectLayer: (layer) => {
    if (state.activeLayer !== layer) {
      state = { ...state, activeLayer: layer };
      syncHeroUI();
    }
  },
});

// 题材切换
$$("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ theme: btn.dataset.theme }));
});

// 立体剥层 & 高对比 X 光
btnExplode.addEventListener("click", () => {
  updateState({ viewMode: state.viewMode === "exploded" ? "flat" : "exploded" });
});
btnHc.addEventListener("click", () => {
  updateState({ highContrast: !state.highContrast });
});

// 算宽模式 & 透明护边
$$("[data-sizing]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ boxSizing: btn.dataset.sizing }));
});
btnOutline.addEventListener("click", () => {
  updateState({ transparentOutline: !state.transparentOutline });
});

// 四条滑杆
for (const [key, layer] of [
  ["width", "content"],
  ["padding", "padding"],
  ["border", "border"],
  ["margin", "margin"],
]) {
  inputs[key].addEventListener("input", () => {
    updateState({ [key]: Number(inputs[key].value), activeLayer: layer });
  });
}

// 底部四栏要点条点击选中对应层
$$("[data-pillar]").forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({ activeLayer: btn.dataset.pillar });
  });
});

// 预设快选（多组合法解 + 试错解）
$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) updateState(p.patch);
  });
});

// 键盘方向键微调当前选中层
canvasEl.addEventListener("keydown", (e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  e.preventDefault();
  const param = state.activeLayer === "content" ? "width" : state.activeLayer;
  const step = LIMITS[param].step * (e.shiftKey ? 2 : 1);
  const delta = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : -step;
  updateState({ [param]: clampParam(param, state[param] + delta) });
});

syncHeroUI();

// ==================== 2. 第 01 节：点击热区与 background-clip 透视器 ====================
const hitStage = $("#hit-stage");
const hitBadge = $("#hit-badge");
const hitMsg = $("#hit-msg");
let activeClip = "border-box";

const CLIP_DESC = {
  "border-box": "背景一路铺到边框底下（CSS 默认行为），所以虚线边框缝隙里能看到深翠青背景。",
  "padding-box": "背景在内边距外缘刹车，不再钻到边框下面，虚线边框缝隙露出外层的底色。",
  "content-box": "背景被裁进最里面的内容核心，连内边距带都变成透明。",
};

const ZONE_INFO = {
  margin: {
    state: "miss",
    badge: "落空 · 穿透到父底",
    text: "点在「外边距 MARGIN」上不会触发元素自身的点击事件！外边距永远透明，它属于元素与外部邻居之间的空地。",
  },
  border: {
    state: "hit",
    badge: "命中 · 边框边界",
    text: "点在「边框 BORDER」上算命中当前元素。边框既是物理占宽的墙，也是内外交界的门槛。",
  },
  padding: {
    state: "hit",
    badge: "命中 · 扩展热区",
    text: "点在「内边距 PADDING」上同样触发点击！这就是为什么给按钮加大 padding 比加 margin 更能提高手指点击成功率。",
  },
  content: {
    state: "hit",
    badge: "命中 · 内容核心",
    text: "点在「内容区 CONTENT」上直接命中元素核心，图文与图标实际绘制在这里。",
  },
};

$$("[data-clip]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeClip = btn.dataset.clip;
    hitStage.dataset.clip = activeClip;
    $$("[data-clip]").forEach((b) => b.classList.toggle("is-active", b === btn));
    hitBadge.dataset.state = "hit";
    hitBadge.textContent = `clip: ${activeClip}`;
    hitMsg.textContent = CLIP_DESC[activeClip];
  });
});

$$("[data-zone]", hitStage).forEach((el) => {
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    const info = ZONE_INFO[el.dataset.zone];
    if (!info) return;
    hitBadge.dataset.state = info.state;
    hitBadge.textContent = info.badge;
    hitMsg.textContent = `${info.text} 当前 background-clip 为 ${activeClip}。`;
  });
});

// ==================== 3. 第 02 节：双栏 50% 折行实验室 ====================
const wrapState = { sizing: "content-box", pad: 24, bdr: 3 };
const wrapCardA = $("#wrap-card-a");
const wrapCardB = $("#wrap-card-b");
const wrapStatus = $("#wrap-status");
const wcValA = $("#wc-val-a");
const wcValB = $("#wc-val-b");
const wrapExplain = $("#wrap-explain");

function renderWrapLab() {
  const refTrack = 600;
  const half = refTrack / 2;
  const extra = 2 * wrapState.pad + 2 * wrapState.bdr;
  const realW = wrapState.sizing === "content-box" ? half + extra : half;
  const totalPct = Math.round((realW * 2 / refTrack) * 100);
  const broken = realW * 2 > refTrack;

  [wrapCardA, wrapCardB].forEach((c) => {
    c.style.boxSizing = wrapState.sizing;
    c.style.padding = `${wrapState.pad}px`;
    c.style.borderWidth = `${wrapState.bdr}px`;
  });

  wrapStatus.dataset.broken = broken ? "1" : "0";
  wrapStatus.textContent = broken
    ? `已折行 · 两栏共占 ${totalPct}%`
    : `并排齐平 · 两栏共占 100%`;

  const innerContent = wrapState.sizing === "content-box" ? half : Math.max(0, half - extra);
  wcValA.textContent = `实占 ${realW}px (${Math.round((realW / refTrack) * 100)}%)`;
  wcValB.textContent = broken ? "被挤到第二行" : `并排贴合 · 内容 ${innerContent}px`;

  wrapCardA.querySelector(".wc-sub").textContent =
    `内容区 ${innerContent}px · 内边距 2×${wrapState.pad}px · 边框 2×${wrapState.bdr}px`;
  wrapCardB.querySelector(".wc-sub").textContent = broken
    ? `因为 ${realW}px × 2 = ${realW * 2}px > ${refTrack}px`
    : `两栏合占 ${realW * 2}px = ${refTrack}px，严丝合缝`;

  wrapExplain.innerHTML = broken
    ? `<strong>为什么掉下去了：</strong>在默认 <code lang="en">content-box</code> 下，<code lang="en">width: 50%</code> 只分给内容区，左右 ${wrapState.pad}px 内边距与 ${wrapState.bdr}px 边框向外叠算，两栏合占 ${totalPct}%，右栏只能被迫折行。切到 <code lang="en">border-box</code> 立刻恢复并排。`
    : wrapState.sizing === "border-box"
      ? `<strong>为什么稳住了：</strong>切到 <code lang="en">border-box</code> 后，每栏声明的 <code lang="en">50%</code> 已经把 ${wrapState.pad}px 内边距和 ${wrapState.bdr}px 边框包在里面，内容区自动缩到 ${innerContent}px，两栏总宽永远锁死 100%。`
      : `<strong>现在没折行只是巧合：</strong>因为内边距和边框恰好都是 0px，一旦你给卡片加上任意内边距或边框，<code lang="en">content-box</code> 立刻会撑破 100% 导致折行。`;
}

$$("[data-wsizing]").forEach((btn) => {
  btn.addEventListener("click", () => {
    wrapState.sizing = btn.dataset.wsizing;
    $$("[data-wsizing]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderWrapLab();
  });
});
$$("[data-wpad]").forEach((btn) => {
  btn.addEventListener("click", () => {
    wrapState.pad = Number(btn.dataset.wpad);
    $$("[data-wpad]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderWrapLab();
  });
});
$$("[data-wbdr]").forEach((btn) => {
  btn.addEventListener("click", () => {
    wrapState.bdr = Number(btn.dataset.wbdr);
    $$("[data-wbdr]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderWrapLab();
  });
});
renderWrapLab();

// ==================== 4. 第 03 节：高对比 forced-colors X 光切换台 ====================
const sec3HcBtn = $("#sec3-hc-btn");
const sec3HcLabel = $("#sec3-hc-label");
const sec3HcCards = $("#sec3-hc-cards");
let forcedMode = false;

sec3HcBtn.addEventListener("click", () => {
  forcedMode = !forcedMode;
  sec3HcBtn.setAttribute("aria-pressed", String(forcedMode));
  sec3HcCards.dataset.forced = forcedMode ? "1" : "0";
  sec3HcLabel.textContent = forcedMode
    ? "已开启：系统高对比 forced-colors（背景已剥离）"
    : "当前：普通屏幕模式（点此开启高对比）";
  $("#hc-v1").textContent = forcedMode ? "高对比翻车：卡片边界彻底消失！" : "普通模式：靠底色可见";
  $("#hc-v2").textContent = forcedMode ? "高对比通过：实线边框仍在" : "普通模式：实线框清晰";
  $("#hc-v3").textContent = forcedMode ? "高对比通过：透明轮廓自动显形！" : "普通模式：清爽无边框";
});

// ==================== 5. 第 04 节：历史演进时间线 ====================
const ERAS = {
  "1996": {
    meta: "W3C Recommendation · 1996 年 12 月 17 日",
    title: "CSS Level 1 第 4 章确立四层矩形盒",
    body: "Håkon Wium Lie 与 Bert Bos 起草的 CSS1 正式推荐标准在第 4 章「Formatting model」写下根基：每个元素生成一个或多个矩形盒，由核心内容区加三层可选包裹（继承背景的内边距、边框、透明外边距）构成，并规定水平方向 7 项属性之和等于父元素宽度。",
    code: `/* CSS1 (1996) 水平七项等式 */\nmargin-left + border-left + padding-left\n  + width\n+ padding-right + border-right + margin-right\n= 父容器包含块宽度`,
  },
  ie5: {
    meta: "1990 年代末 – 2000 年代 · 浏览器盒模型分歧",
    title: "IE5 怪异盒把边框和内边距算进 width",
    body: "早期 Internet Explorer 5 与怪异模式（Quirks Mode）采用了和 W3C 不同的算法：width 直接包含内容区、内边距与边框。虽然一度让跨浏览器排版头疼不已，但很多设计师反而发现这种「外框尺寸先定死」的直觉更适合做分栏与卡片。",
    code: `/* 历史分歧：同样写 width: 300px; padding: 20px */\n/* W3C 标准盒 (content-box) → 实宽 340px */\n/* IE5 怪异盒 (border-box)  → 实宽 300px */`,
  },
  "2012": {
    meta: "Paul Irish · 2012 年 2 月（2014 年 8 月修订继承写法）",
    title: "全局 border-box 重置成为现代前端常识",
    body: "2012 年 2 月，Paul Irish 发表《* { box-sizing: border-box } FTW》，把原本只属于怪异模式的直观算宽方式推广成全站重置方案；2014 年 8 月进一步改为在 html 上声明并让后代 inherit，方便第三方旧组件局部改回 content-box。",
    code: `html {\n  box-sizing: border-box;\n}\n*, *::before, *::after {\n  box-sizing: inherit;\n}`,
  },
  "2018": {
    meta: "W3C Recommendation · 2018 年 6 月 21 日",
    title: "CSS Basic User Interface Level 3 正式收编 box-sizing",
    body: "W3C 在 2018 年 6 月发布的 CSS Basic User Interface Module Level 3 推荐标准中，将 box-sizing（content-box 与 border-box）定为正式标准属性，结束了过去需要加浏览器前缀的历史。",
    code: `.card {\n  box-sizing: border-box;\n  width: 50%;\n  padding: 1.5rem;\n  border: 2px solid currentColor;\n}`,
  },
  "2019": {
    meta: "2019 Every Layout · 2023/2024 W3C CSS Box Model Level 3",
    title: "盒模型进入「布局原语」与逻辑属性时代",
    body: "2019 年 Heydon Pickering 与 Andy Bell 在《Every Layout》里将「The Box」定义为极简布局原语（只管盒内留白、色彩与高对比透明轮廓，不背外边距）；2023 年 4 月（2024 年 4 月更新）W3C 正式发布 CSS Box Model Module Level 3，并与 padding-inline / padding-block 等逻辑属性无缝衔接，自动适配横竖排与从右到左语言。",
    code: `.box {\n  padding-inline: 1.25rem;\n  padding-block: 1rem;\n  border: 0;\n  outline: 2px solid transparent;\n  outline-offset: -2px;\n}`,
  },
};

$$("[data-era]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const info = ERAS[tab.dataset.era];
    if (!info) return;
    $$("[data-era]").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    $("#tl-meta").textContent = info.meta;
    $("#tl-title").textContent = info.title;
    $("#tl-body").textContent = info.body;
    $("#tl-code").textContent = info.code;
  });
});

// ==================== 6. 第 05 节：套娃盒子剥层压测 ====================
const nestPhone = $("#nest-phone");
const nestTax = $("#nest-tax");
const nestRem = $("#nest-rem");
const nestNote = $("#nest-note");

function renderNest(depth) {
  const perLayer = 36; // padding 16*2 + border 2*2
  const totalW = 340;
  const tax = depth * perLayer;
  const rem = totalW - tax;
  const taxPct = Math.round((tax / totalW) * 100);
  const remPct = 100 - taxPct;

  let html = `<p class="nest-core-text"><strong>正文区仅剩 ${rem}px：</strong>每一层多余的外框都在悄悄啃食手机横向阅读宽度。</p>`;
  for (let i = depth; i >= 1; i--) {
    html = `<div class="nest-layer nest-layer-${i}"><span class="nest-tag">第 ${i} 层盒子 · −36px</span>${html}</div>`;
  }
  nestPhone.innerHTML = html;

  nestTax.textContent = `${tax}px (${taxPct}%)`;
  nestRem.textContent = `${rem}px (${remPct}%)`;
  nestNote.textContent =
    depth === 1
      ? "只用一层盒子包裹卡片本体，正文保有 304px（89%）舒展阅读面，清晰又克制。"
      : depth === 2
        ? "两层嵌套已扣掉 72px（21%）；除非内层是独立告警条或操作区，否则优先用留白和细分割线代替外框。"
        : depth === 3
          ? "三层套娃吞掉 108px（32%），手机端正文宽度明显变窄，句子开始频繁折行。"
          : "四层盒子叠加后，42% 的屏幕宽度全耗在边框与重复留白上。把中间多余边框拆掉，正文立刻宽敞 72–108px。";
}

$$("[data-depth]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$("[data-depth]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderNest(Number(btn.dataset.depth));
  });
});
renderNest(4);

// ==================== 7. 第 06 节：小练习 ====================
const QUIZ_ANS = {
  A: {
    ok: false,
    msg: "方案 A 会撑爆槽位。它用了默认 content-box，左右 20px 内边距与 2px 边框全往外加，总宽达到 320 + 40 + 4 = 364px，比 320px 侧栏多出 44px，立刻触发横向溢出。",
  },
  B: {
    ok: false,
    msg: "方案 B 的总宽确实锁在了 320px，高对比下也有实线边框，但 padding 只有 2px——文字会死死贴在边框内壁上，读起来窒息局促。",
  },
  C: {
    ok: true,
    msg: "答对了，方案 C 最稳妥！border-box 把总宽严锁在 320px；20px 内边距让文字呼吸充分；margin: 0 不越权顶歪邻居；最关键的是 outline: 2px solid transparent; outline-offset: -2px 平时清爽无框，一旦系统开启高对比模式剥离底色，轮廓立刻自动显形。",
  },
  D: {
    ok: false,
    msg: "方案 D 是最隐蔽的坑！普通屏幕上它和方案 C 看上去一模一样，但它既没有 border 也没写透明 outline——一旦用户开启 Windows 高对比 / forced-colors 模式，背景色被清掉，卡片边界会彻底消失。",
  },
};

const quizFb = $("#quiz-feedback");
$$(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.opt;
    const ans = QUIZ_ANS[pick];
    $$(".quiz-opt").forEach((b) => {
      b.classList.remove("is-picked-right", "is-picked-wrong");
    });
    btn.classList.add(ans.ok ? "is-picked-right" : "is-picked-wrong");
    quizFb.dataset.res = ans.ok ? "ok" : "wrong";
    quizFb.innerHTML = `
      <strong>${ans.ok ? "判断正确：" : "再看一眼这个变量："}</strong>${ans.msg}
      <div class="quiz-hc-compare" aria-label="系统高对比模式实况对比">
        <div class="qhc-box qhc-c">方案 C 高对比实况：透明 outline 自动显出清晰边界</div>
        <div class="qhc-box qhc-d">方案 D 高对比实况：背景剥离后已找不到外框</div>
      </div>
    `;
  });
});

// ==================== 8. 第 07 节：原海报灯箱（复用 #poster.src，不二次内联） ====================
const posterImg = $("#poster");
const posterTrigger = $("#poster-trigger");
const lightbox = $("#lightbox");
const lbStage = $("#lb-stage");
const lbImg = $("#lb-img");
const lbZoomReset = $("#lb-zoom-reset");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbPan = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
lbZoomReset.addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const next = lbScale + (e.deltaY < 0 ? 0.18 : -0.18);
    lbScale = Math.max(0.6, Math.min(3, +next.toFixed(2)));
    applyLbTransform();
  },
  { passive: false },
);

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1) {
    closeLightbox();
    return;
  }
  lbPan = { id: e.pointerId, sx: e.clientX - lbX, sy: e.clientY - lbY };
  lbStage.classList.add("is-panning");
  try {
    lbStage.setPointerCapture(e.pointerId);
  } catch {}
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbPan || e.pointerId !== lbPan.id) return;
  lbX = e.clientX - lbPan.sx;
  lbY = e.clientY - lbPan.sy;
  applyLbTransform();
});

function stopPan() {
  lbPan = null;
  lbStage.classList.remove("is-panning");
}
lbStage.addEventListener("pointerup", stopPan);
lbStage.addEventListener("pointercancel", stopPan);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
