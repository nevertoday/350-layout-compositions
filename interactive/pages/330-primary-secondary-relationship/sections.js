// 330 主宾关系构图 · 01–07 章节独立交互模块
// 每节交互形式各异，绝不在相邻两节重复同一种控件做同一件事。

import { PALETTE, clamp } from "./model.js";

// ==================== 01 四杠杆独立开关台 ====================
// 演示原海报之外的关键事实：面积只是四根杠杆之一；色彩、位置、留白同样能立主。
export function initLeversSection() {
  const root = document.getElementById("levers-lab");
  if (!root) return;
  const inputs = [...root.querySelectorAll('input[type="checkbox"][data-lever]')];
  const hostEl = root.querySelector('[data-el="host"]');
  const guest1El = root.querySelector('[data-el="guest1"]');
  const guest2El = root.querySelector('[data-el="guest2"]');
  const guidePath = root.querySelector('[data-el="guide"]');
  const moatEl = root.querySelector('[data-el="moat"]');
  const orderEl = root.querySelector('[data-out="order"]');
  const scoreEl = root.querySelector('[data-out="score"]');
  const noteEl = root.querySelector('[data-out="note"]');

  function update() {
    const on = {};
    for (const i of inputs) on[i.dataset.lever] = i.checked;
    const count = Object.values(on).filter(Boolean).length;

    // 主体几何参数：全关时三块完全同大、同色、等距排成一排
    const rHost = on.size ? 56 : 28;
    const rG1 = on.size ? 22 : 28;
    const rG2 = on.size ? 11 : 28;

    const fillHost = on.color ? PALETTE.crimson : PALETTE.navy;
    const fillG1 = on.color ? PALETTE.navy : PALETTE.navy;
    const fillG2 = on.color ? PALETTE.ochre : PALETTE.navy;

    // 位置与留白杠杆控制排布与缓冲距离
    let hx = 105, hy = 120;
    let g1x = 220, g1y = 120;
    let g2x = 335, g2y = 120;
    if (on.position && on.whitespace) {
      hx = 262; hy = 102;
      g1x = 108; g1y = 166;
      g2x = 344; g2y = 196;
    } else if (on.position) {
      hx = 248; hy = 112;
      g1x = 148; g1y = 152;
      g2x = 324; g2y = 166;
    } else if (on.whitespace) {
      hx = 108; hy = 120;
      g1x = 278; g1y = 118;
      g2x = 356; g2y = 152;
    }

    hostEl.setAttribute("cx", hx);
    hostEl.setAttribute("cy", hy);
    hostEl.setAttribute("r", rHost);
    hostEl.setAttribute("fill", fillHost);

    guest1El.setAttribute("cx", g1x);
    guest1El.setAttribute("cy", g1y);
    guest1El.setAttribute("r", rG1);
    guest1El.setAttribute("fill", fillG1);

    guest2El.setAttribute("cx", g2x);
    guest2El.setAttribute("cy", g2y);
    guest2El.setAttribute("r", rG2);
    guest2El.setAttribute("fill", fillG2);

    // 护城河虚线环
    moatEl.setAttribute("cx", hx);
    moatEl.setAttribute("cy", hy);
    moatEl.setAttribute("r", rHost + (on.whitespace ? 28 : 8));
    moatEl.setAttribute("opacity", on.whitespace ? "0.55" : "0.14");

    // 引导弧
    const ctrlX = (g1x + g2x) * 0.5;
    const ctrlY = Math.max(hy + rHost + 24, (g1y + g2y) * 0.5 + 34);
    guidePath.setAttribute("d", `M ${hx} ${hy} Q ${g1x} ${g1y} ${g1x} ${g1y} Q ${ctrlX} ${ctrlY} ${g2x} ${g2y}`);
    guidePath.setAttribute("opacity", count >= 2 ? "0.6" : "0.18");

    // 单真源计算当前主宾分离度（示意）
    let weightHost = 1;
    let weightGuest = 1;
    if (on.size) { weightHost *= 2.4; weightGuest *= 0.85; }
    if (on.color) { weightHost *= 1.55; weightGuest *= 0.92; }
    if (on.position) { weightHost *= 1.25; }
    if (on.whitespace) { weightHost *= 1.32; weightGuest *= 0.94; }
    const dominance = weightHost / weightGuest;

    let tier, note;
    if (count === 0) {
      tier = "平局 · 看不出主宾";
      note = "三枚元素体量相同、颜色相同、排成一线。眼睛从左扫到右，没有任何一处愿意多停半秒。";
    } else if (!on.size && on.color && on.whitespace) {
      tier = "以少胜多 · 小核立主";
      note = "注意看：哪怕「体量」保持 1:1 完全相等，只要给主体独享朱砂红并腾出周围留白，它依然稳稳抢走第一眼——这正是「万绿丛中一点红」不用靠大面积也能立主的原理。";
    } else if (!on.size && on.color && !on.whitespace) {
      tier = "单凭色彩 · 初步聚焦";
      note = "等大三圆里只有一颗染红，眼睛已经能先找到它；但因为三者紧挨且等高，看完红圆后仍分不清第二、第三阅读顺位。";
    } else if (on.size && !on.color && count === 1) {
      tier = "单凭体量 · 阶梯初现";
      note = "纯黑白版面只靠大小反差也能定主宾，但缺少色彩与留白呼应，整体节奏偏平。";
    } else if (count >= 3) {
      tier = "多维协同 · 层级明晰";
      note = `${count} 根杠杆同时指向同一目标：体量定基调、色彩抓第一眼、位置与留白护住呼吸感，主宾关系一眼立住。`;
    } else {
      tier = "双杠杆配合 · 正在成形";
      note = "两根杠杆已让视觉重心开始偏向主体；再打开一根杠杆（例如留白或位置），主宾呼应会更稳固。";
    }

    orderEl.textContent = tier;
    scoreEl.textContent = `主/宾权重 ${dominance.toFixed(1)}×（示意）`;
    noteEl.textContent = note;
  }

  for (const i of inputs) i.addEventListener("change", update);
  update();
}

// ==================== 02 三阶梯队：阶梯形态对比台 ====================
const TIER_MODES = {
  four: {
    label: "四阶混战",
    ratioText: "1 : 0.85 : 0.78 : 0.72",
    bars: [96, 82, 74, 68],
    colors: [PALETTE.crimson, PALETTE.crimson, PALETTE.navy, PALETTE.navy],
    verdict: "四个标题都在喊「先看我」",
    explain: "当版面出现四层相近的视觉重量，读者每一行都要停顿比较轻重，反而失去重心。经验上，一张单屏信息卡最好守住三阶梯队。",
    card: { hSize: 22, hColor: PALETTE.crimson, subSize: 20, subColor: PALETTE.crimson, metaSize: 16, extraShow: true },
  },
  twin: {
    label: "双强平分",
    ratioText: "1 : 0.92 : 0.16",
    bars: [92, 85, 18, 0],
    colors: [PALETTE.crimson, PALETTE.crimson, PALETTE.ochre, "transparent"],
    verdict: "双强拉锯，视线反复横跳",
    explain: "主标题和副题时间几乎一样大、一样抢眼，视觉变成五五开的拔河，谁也没真正当上「主」。",
    card: { hSize: 24, hColor: PALETTE.crimson, subSize: 22, subColor: PALETTE.crimson, metaSize: 12, extraShow: false },
  },
  standard: {
    label: "标准三阶（经验值）",
    ratioText: "1 : 0.35 : 0.12",
    bars: [100, 38, 15, 0],
    colors: [PALETTE.crimson, PALETTE.navy, PALETTE.ochre, "transparent"],
    verdict: "主落锚 → 宾展开 → 点收尾",
    explain: "经验上把三阶视觉重量拉开到接近 1 : 0.35 : 0.12 的落差，主体负责 0.5 秒抓住注意，次要元素承接说明，细节点缀稳住边角平衡。",
    card: { hSize: 34, hColor: PALETTE.crimson, subSize: 15, subColor: PALETTE.navy, metaSize: 11, extraShow: false },
  },
  solo: {
    label: "孤主无宾",
    ratioText: "1 : 0.05 : 0.02",
    bars: [100, 7, 4, 0],
    colors: [PALETTE.crimson, PALETTE.stone, PALETTE.stone, "transparent"],
    verdict: "只剩一口号，信息无处延伸",
    explain: "次要说明缩得过小过淡，读者看完大标题后找不到时间地点，画面看似极简实则缺失功能性延伸。",
    card: { hSize: 36, hColor: PALETTE.crimson, subSize: 10, subColor: "#756E66", metaSize: 10, extraShow: false },
  },
};

export function initTierCascadeSection() {
  const root = document.getElementById("tier-cascade");
  if (!root) return;
  const btns = [...root.querySelectorAll("button[data-tier-mode]")];
  const barEls = [...root.querySelectorAll("[data-step-bar]")];
  const ratioOut = root.querySelector('[data-out="ratio"]');
  const verdictOut = root.querySelector('[data-out="verdict"]');
  const explainOut = root.querySelector('[data-out="explain"]');
  const mockH = root.querySelector('[data-mock="h"]');
  const mockSub = root.querySelector('[data-mock="sub"]');
  const mockMeta = root.querySelector('[data-mock="meta"]');
  const mockExtra = root.querySelector('[data-mock="extra"]');

  function apply(modeKey) {
    const m = TIER_MODES[modeKey] || TIER_MODES.standard;
    for (const b of btns) {
      const active = b.dataset.tierMode === modeKey;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    }
    barEls.forEach((el, idx) => {
      const pct = m.bars[idx] || 0;
      el.style.width = `${pct}%`;
      el.style.backgroundColor = m.colors[idx];
      const track = el.closest(".step-track");
      if (track) track.hidden = pct <= 0;
    });
    ratioOut.textContent = m.ratioText;
    verdictOut.textContent = m.verdict;
    explainOut.textContent = m.explain;

    mockH.style.fontSize = `${m.card.hSize}px`;
    mockH.style.color = m.card.hColor;
    mockSub.style.fontSize = `${m.card.subSize}px`;
    mockSub.style.color = m.card.subColor;
    mockMeta.style.fontSize = `${m.card.metaSize}px`;
    mockExtra.hidden = !m.card.extraShow;
  }

  for (const b of btns) {
    b.addEventListener("click", () => apply(b.dataset.tierMode));
  }
  apply("standard");
}

// ==================== 03 古今三境 X 光骨架透视镜 ====================
const HISTORY_PLATES = {
  guoxi: {
    year: "1072 · 北宋",
    title: "郭熙《早春图》正局主峰式",
    caption: "主峰自中轴拔起如「大君当阳」，左右冈阜林壑斜向拱揖（宾），山下行旅舟桥微点定尺（点）——九百年前的竖轴山水已跑通完整的三阶引导弧。",
  },
  jiezi: {
    year: "1679 · 清康熙",
    title: "《芥子园画传》双树宾主式",
    caption: "画谱讲「画树必分主宾」：一株苍干老树直立担纲，旁生一株低斜瘦树迎让呼应，根际以苔点坡石收脚，绝不两树齐头并立。",
  },
  modern: {
    year: "当代 · 平面与界面",
    title: "视觉层级三阶排印式",
    caption: "从宋画主峰移步到海报与落地页：主视觉/主标充当「大山」，副题导语充当「辅岭」，角标页码充当「点景」，底层认知秩序一脉相承。",
  },
};

export function initHistoryXraySection() {
  const root = document.getElementById("history-xray");
  if (!root) return;
  const tabs = [...root.querySelectorAll("button[data-plate]")];
  const xrayBtn = root.querySelector('button[data-toggle="xray"]');
  const plates = [...root.querySelectorAll("[data-plate-svg]")];
  const yearEl = root.querySelector('[data-out="year"]');
  const titleEl = root.querySelector('[data-out="title"]');
  const capEl = root.querySelector('[data-out="caption"]');
  let xrayOn = true;

  function showPlate(key) {
    const info = HISTORY_PLATES[key] || HISTORY_PLATES.guoxi;
    for (const t of tabs) {
      const active = t.dataset.plate === key;
      t.setAttribute("aria-pressed", String(active));
      t.classList.toggle("is-active", active);
    }
    for (const svg of plates) {
      svg.hidden = svg.dataset.plateSvg !== key;
    }
    yearEl.textContent = info.year;
    titleEl.textContent = info.title;
    capEl.textContent = info.caption;
  }

  function syncXray() {
    root.classList.toggle("xray-on", xrayOn);
    xrayBtn.setAttribute("aria-pressed", String(xrayOn));
    xrayBtn.textContent = xrayOn ? "主宾骨架透视：开" : "主宾骨架透视：关";
  }

  for (const t of tabs) {
    t.addEventListener("click", () => showPlate(t.dataset.plate));
  }
  xrayBtn.addEventListener("click", () => {
    xrayOn = !xrayOn;
    syncXray();
  });

  showPlate("guoxi");
  syncXray();
}

// ==================== 04 适用与禁用：四组场景翻检卡 ====================
export function initScenarioCards() {
  const cards = [...document.querySelectorAll(".scenario-card[data-scenario]")];
  for (const card of cards) {
    const btn = card.querySelector("button[data-flip]");
    const viewHierarchy = card.querySelector('[data-view="hierarchy"]');
    const viewEqual = card.querySelector('[data-view="equal"]');
    const verdict = card.querySelector('[data-out="verdict"]');
    const fit = card.dataset.fit === "yes";
    let mode = "hierarchy";

    function renderCard() {
      const isH = mode === "hierarchy";
      viewHierarchy.hidden = !isH;
      viewEqual.hidden = isH;
      btn.textContent = isH ? "切看：均等排布" : "切看：强主宾版";
      btn.setAttribute("aria-pressed", String(!isH));

      if (fit && isH) {
        verdict.textContent = card.dataset.msgGood;
        verdict.className = "sc-verdict is-good";
      } else if (fit && !isH) {
        verdict.textContent = card.dataset.msgAlt;
        verdict.className = "sc-verdict is-bad";
      } else if (!fit && isH) {
        verdict.textContent = card.dataset.msgBad;
        verdict.className = "sc-verdict is-bad";
      } else {
        verdict.textContent = card.dataset.msgAlt;
        verdict.className = "sc-verdict is-good";
      }
    }

    btn.addEventListener("click", () => {
      mode = mode === "hierarchy" ? "equal" : "hierarchy";
      renderCard();
    });
    renderCard();
  }
}

// ==================== 05 常见翻车：病版 / 救版拉帘对照台 ====================
const BREAKDOWNS = {
  clash: {
    rule: "对应注意事项①：避免主次元素竞争焦点",
    title: "副标抢色抢大，双强互撕",
    badNote: "左侧病版：日期和副题也用了朱砂红块，与主标抢同一道目光，读者不知先读展名还是先读日期。",
    goodNote: "右侧救版：朱砂红只留给「茶器秋展」主核，日期退回深黛青细排，第一眼瞬间定焦。",
  },
  flat: {
    rule: "对应注意事项②：保持足够的视觉差异",
    title: "三阶字号只差两三像素，糊成一片",
    badNote: "左侧病版：主标、展期、落款体量接近 1.2×，眼睛像扫流水账，抓不到重点。",
    goodNote: "右侧救版：把主标放大到次级 3× 以上，细节点缀压轻，扫一眼便知主次。",
  },
  choke: {
    rule: "对应注意事项③：留白有助于突出主体",
    title: "满框塞图加粗框，主体无处喘气",
    badNote: "左侧病版：主圆顶死边缘，再塞满装饰角标与密纹底，主体反而被周边杂物吞没。",
    goodNote: "右侧救版：撤去杂边、缩小主核外径，让大面积暖麻底纸托起朱砂重心。",
  },
  drift: {
    rule: "对应主宾呼应：次要元素不能与主体失联",
    title: "陪体孤悬对角，视线断流",
    badNote: "左侧病版：主图偏在左上，展期缩死右下角，中间空成断层，看完主图容易直接翻页。",
    goodNote: "右侧救版：让次要信息沿主核斜下方落位，并以细节点缀收束对角，形成顺滑视觉弧。",
  },
};

export function initCurtainSection() {
  const root = document.getElementById("curtain-lab");
  if (!root) return;
  const tabs = [...root.querySelectorAll("button[data-case]")];
  const slider = root.querySelector('input[type="range"][data-curtain]');
  const stage = root.querySelector(".curtain-stage");
  const goodLayer = root.querySelector(".curtain-good");
  const handle = root.querySelector(".curtain-handle");
  const pctOut = root.querySelector('[data-out="pct"]');
  const ruleOut = root.querySelector('[data-out="rule"]');
  const titleOut = root.querySelector('[data-out="title"]');
  const badOut = root.querySelector('[data-out="bad"]');
  const goodOut = root.querySelector('[data-out="good"]');
  const badSvgs = [...root.querySelectorAll("[data-bad-svg]")];
  const goodSvgs = [...root.querySelectorAll("[data-good-svg]")];

  let pct = 52;

  function setSplit(val) {
    pct = clamp(Math.round(val), 8, 92);
    slider.value = String(pct);
    goodLayer.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = `${pct}%`;
    pctOut.textContent = `病版 ${pct}% ｜ 救版 ${100 - pct}%`;
  }

  function setCase(key) {
    const info = BREAKDOWNS[key] || BREAKDOWNS.clash;
    for (const t of tabs) {
      const active = t.dataset.case === key;
      t.setAttribute("aria-pressed", String(active));
      t.classList.toggle("is-active", active);
    }
    for (const el of badSvgs) el.hidden = el.dataset.badSvg !== key;
    for (const el of goodSvgs) el.hidden = el.dataset.goodSvg !== key;
    ruleOut.textContent = info.rule;
    titleOut.textContent = info.title;
    badOut.textContent = info.badNote;
    goodOut.textContent = info.goodNote;
  }

  for (const t of tabs) t.addEventListener("click", () => setCase(t.dataset.case));
  slider.addEventListener("input", () => setSplit(Number(slider.value)));

  // 支持直接在舞台上左右拖动中缝帘
  let dragging = false;
  function moveFromClientX(clientX) {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 10) return;
    setSplit(((clientX - rect.left) / rect.width) * 100);
  }
  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    moveFromClientX(e.clientX);
    if (stage.setPointerCapture) {
      try { stage.setPointerCapture(e.pointerId); } catch {}
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moveFromClientX(e.clientX);
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });

  setCase("clash");
  setSplit(52);
}

// ==================== 06 小练习：单变量盲测四选一 ====================
const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "再看看「方案 A」：色彩频道撞车了",
    body: "方案 A 的主圆体量与留白都不错，但右侧「展期信息块」同样涂上了高饱和朱砂红。色彩一撞，次要元素立刻和主体抢第一眼，违背「避免主次元素竞争焦点」。",
  },
  B: {
    ok: true,
    title: "选对了！「方案 B」四根杠杆指向同一主核",
    body: "方案 B 把朱砂红与充裕体量专留给主体茶器圆，次要展期以深黛青稳妥退居二阶，右下赭金小印轻点平衡，且四周保留清晰暖麻留白——读者毫不费力地按「主 → 宾 → 点」读完。",
  },
  C: {
    ok: false,
    title: "再看看「方案 C」：主次体量差距太小",
    body: "方案 C 的颜色分配虽然没抢红，但次要元素放大到与主体面积比只剩约 1.3×。两块重量太接近，缺乏「足够的视觉差异」，第一眼会犹豫该先看哪一块。",
  },
  D: {
    ok: false,
    title: "再看看「方案 D」：满幅窒息且气脉断离",
    body: "方案 D 拉开了颜色和大小，但主体过度撑满顶边与右边、四周几乎没留白，次要块又被挤到左下死角，主宾之间失去了留白衬托与顺滑的视觉呼应。",
  },
};

export function initQuizSection() {
  const root = document.getElementById("quiz-lab");
  if (!root) return;
  const opts = [...root.querySelectorAll("button[data-choice]")];
  const fbBox = root.querySelector(".quiz-feedback");
  const fbTitle = root.querySelector('[data-out="q-title"]');
  const fbBody = root.querySelector('[data-out="q-body"]');
  const resetBtn = root.querySelector('button[data-quiz-reset]');

  function select(key) {
    const info = QUIZ_FEEDBACK[key];
    if (!info) return;
    for (const b of opts) {
      const chosen = b.dataset.choice === key;
      b.setAttribute("aria-pressed", String(chosen));
      b.classList.toggle("is-chosen", chosen);
      b.classList.toggle("is-right", chosen && info.ok);
      b.classList.toggle("is-wrong", chosen && !info.ok);
    }
    fbBox.hidden = false;
    fbBox.classList.toggle("is-right", info.ok);
    fbBox.classList.toggle("is-wrong", !info.ok);
    fbTitle.textContent = info.title;
    fbBody.textContent = info.body;
  }

  for (const b of opts) {
    b.addEventListener("click", () => select(b.dataset.choice));
  }
  resetBtn.addEventListener("click", () => {
    for (const b of opts) {
      b.setAttribute("aria-pressed", "false");
      b.classList.remove("is-chosen", "is-right", "is-wrong");
    }
    fbBox.hidden = true;
  });
}

// ==================== 07 原海报灯箱（点击放大、拖动、缩放、Esc 关闭） ====================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const thumb = document.getElementById("poster");
  const modal = document.getElementById("poster-lightbox");
  if (!trigger || !thumb || !modal) return;

  const img = modal.querySelector(".lb-img");
  const closeBtn = modal.querySelector('[data-lb="close"]');
  const zoomInBtn = modal.querySelector('[data-lb="in"]');
  const zoomOutBtn = modal.querySelector('[data-lb="out"]');
  const zoomResetBtn = modal.querySelector('[data-lb="reset"]');
  const stage = modal.querySelector(".lb-stage");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    img.src = thumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeModal();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 0.8, 3.2);
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 0.8, 3.2);
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  stage.addEventListener("wheel", (e) => {
    if (modal.hidden) return;
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.8, 3.2);
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  img.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    if (img.setPointerCapture) {
      try { img.setPointerCapture(e.pointerId); } catch {}
    }
  });
  img.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  img.addEventListener("pointerup", () => { dragging = false; });
  img.addEventListener("pointercancel", () => { dragging = false; });
}
