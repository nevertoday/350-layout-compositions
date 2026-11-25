import { reducedMotion } from "../../lib/stage.js";
import {
  RULES,
  INK_TIERS,
  COVER_WORDS,
  createInitialState,
  collectTextLineRects,
  evaluateCover,
  unionRectArea,
  FLASH_SPECIMENS,
  TIMELINE_ERAS,
  COMP_MODES,
  SCENE_CASES,
  ANTI_CASES,
  SIBLING_LAYOUTS,
  EXERCISE_SPEC,
} from "./model.js";
import { createDistanceView } from "./distance-view.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// =========================================================================
// 0. 将 model.js 统一经验常量水合到正文中所有标注点，保证全页唯一数据源
// =========================================================================
function hydrateUnifiedConstants() {
  const map = {
    "ratio-range": `${RULES.RATIO_MIN_PASS}×–${RULES.RATIO_SWEET_MAX}×`,
    "ratio-min": `${RULES.RATIO_MIN_PASS}×`,
    "ratio-flat": `${RULES.RATIO_FLAT_MAX}×`,
    "ws-range": `${Math.round(RULES.WHITESPACE_MIN * 100)}%–${Math.round(RULES.WHITESPACE_MAX * 100)}%`,
    "ws-min": `${Math.round(RULES.WHITESPACE_MIN * 100)}%`,
    "chars-range": `${RULES.CHARS_MIN}–${RULES.CHARS_MAX} 字`,
    "lines-max": `${RULES.LINES_MAX} 行`,
    "aux-px": `${RULES.AUX_MIN_RENDER_PX}px`,
    "aux-contrast": `${RULES.AUX_MIN_CONTRAST}:1`,
    "leading-range": `${RULES.LEADING_MIN.toFixed(2)}–${RULES.LEADING_MAX.toFixed(2)}`,
  };
  for (const el of $$("[data-rule]")) {
    const key = el.dataset.rule;
    if (map[key]) el.textContent = map[key];
  }
}

// =========================================================================
// 1. 开场主角玩具：封面层级活体排印台
// =========================================================================
function initHeroBench() {
  const coverEl = $("#cover-sheet");
  const hlLayer = $("#layer-headline");
  const subLayer = $("#layer-sub");
  const metaLayer = $("#layer-meta");
  const hlWordsWrap = $("#hl-words");
  const subTextEl = $("#sub-text");
  const metaTextEl = $("#meta-text");
  const hlHandle = $("#handle-headline");
  const subHandle = $("#handle-sub");
  const metaHandle = $("#handle-meta");

  const trashTray = $("#proof-trash");
  const layerTabBtns = $$("[data-pick-layer]");
  const activeLayerLabel = $("#active-layer-label");
  const sizeDownBtn = $("#btn-size-down");
  const sizeUpBtn = $("#btn-size-up");
  const sizeReadout = $("#active-size-readout");
  const inkControls = $("#ink-tier-controls");
  const inkBtns = $$("[data-ink-tier]", inkControls);
  const resetBtn = $("#btn-reset-cover");

  // 读数与诊断 UI
  const distCanvas = $("#distance-canvas");
  const distView = createDistanceView(distCanvas);
  const distEyeLabel = $("#dist-first-eye");
  const diagBadge = $("#diag-badge");
  const diagTitle = $("#diag-title");
  const diagWhy = $("#diag-why");
  const metricRatio = $("#metric-ratio");
  const metricWs = $("#metric-ws");
  const metricAux = $("#metric-aux");
  const lampEls = {
    hierarchy: $("#lamp-hierarchy"),
    focus: $("#lamp-focus"),
    rhythm: $("#lamp-rhythm"),
    space: $("#lamp-space"),
  };
  const coverGeoCircle = $("#cover-geo-circle");
  const coverGeoTri = $("#cover-geo-tri");

  const state = createInitialState();
  let rafId = 0;

  // 构建可点击划删的词块按钮
  function buildWordButtons() {
    hlWordsWrap.innerHTML = "";
    for (const w of COVER_WORDS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "word-chip";
      btn.dataset.wordId = w.id;
      btn.textContent = w.text;
      btn.setAttribute("aria-label", `点击划删词块「${w.text}」`);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        selectLayer("headline");
        toggleWord(w.id);
      });
      hlWordsWrap.append(btn);
    }
  }

  function toggleWord(id) {
    const idx = state.kept.indexOf(id);
    if (idx >= 0) {
      // 至少保留 1 枚词块让舞台不会彻底空洞（删掉核心词即可触发「剪丢核心」）
      if (state.kept.length <= 1) return;
      state.kept.splice(idx, 1);
    } else {
      state.kept.push(id);
      state.kept.sort(
        (a, b) =>
          COVER_WORDS.findIndex((w) => w.id === a) -
          COVER_WORDS.findIndex((w) => w.id === b)
      );
    }
    scheduleRender();
  }

  function selectLayer(layer) {
    state.selectedLayer = layer;
    scheduleRender();
  }

  function stepSelectedSize(delta) {
    if (state.selectedLayer === "headline") {
      state.headlinePx = clamp(state.headlinePx + delta * 4, RULES.HEADLINE_MIN, RULES.HEADLINE_MAX);
    } else if (state.selectedLayer === "sub") {
      state.subPx = clamp(state.subPx + delta * 1.5, RULES.SUB_MIN, RULES.SUB_MAX);
    } else {
      state.metaPx = clamp(state.metaPx + delta * 1.5, RULES.META_MIN, RULES.META_MAX);
    }
    scheduleRender();
  }

  function applyCoverScaleAndStyles() {
    const coverRect = coverEl.getBoundingClientRect();
    const scale = coverRect.width > 0 ? coverRect.width / RULES.BASE_W : 1;

    // 渲染字号：受保护硬底 10px 防止任何视口下浏览器出现 <10px 碎字，
    // 同时允许拖至 10.0–10.9px（< 11px）真实触发「辅文消失」错态。
    const hlRender = Math.max(RULES.AUX_HARD_FLOOR_PX, state.headlinePx * scale);
    const subRender = Math.max(RULES.AUX_HARD_FLOOR_PX, state.subPx * scale);
    const metaRender = Math.max(RULES.AUX_HARD_FLOOR_PX, state.metaPx * scale);

    hlWordsWrap.style.fontSize = `${hlRender.toFixed(1)}px`;
    // 巨字越大会自动收紧行高，呼应 02 节道理
    const dynLeading = state.headlinePx >= 64 ? 1.03 : state.headlinePx >= 42 ? 1.12 : 1.24;
    hlWordsWrap.style.lineHeight = String(dynLeading);

    subTextEl.style.fontSize = `${subRender.toFixed(1)}px`;
    const subStyle = INK_TIERS.sub[state.subTier];
    subTextEl.style.color = subStyle.color;
    subTextEl.style.fontWeight = String(subStyle.weight);

    metaTextEl.style.fontSize = `${metaRender.toFixed(1)}px`;
    const metaStyle = INK_TIERS.meta[state.metaTier];
    metaTextEl.style.color = metaStyle.color;
    metaTextEl.style.fontWeight = String(metaStyle.weight);
    metaTextEl.dataset.tier = state.metaTier;

    // 显隐词块
    for (const btn of $$(".word-chip", hlWordsWrap)) {
      const kept = state.kept.includes(btn.dataset.wordId);
      btn.hidden = !kept;
    }

    // 选中态高亮
    hlLayer.classList.toggle("is-selected", state.selectedLayer === "headline");
    subLayer.classList.toggle("is-selected", state.selectedLayer === "sub");
    metaLayer.classList.toggle("is-selected", state.selectedLayer === "meta");
    for (const tb of layerTabBtns) {
      const act = tb.dataset.pickLayer === state.selectedLayer;
      tb.classList.toggle("is-active", act);
      tb.setAttribute("aria-pressed", String(act));
    }

    // 废字槽
    const dropped = COVER_WORDS.filter((w) => !state.kept.includes(w.id));
    trashTray.innerHTML = "";
    if (!dropped.length) {
      const hint = document.createElement("span");
      hint.className = "trash-hint";
      hint.textContent = "点击封面上任意标题词块即可划删精炼";
      trashTray.append(hint);
    } else {
      const label = document.createElement("span");
      label.className = "trash-label";
      label.textContent = "已删词：";
      trashTray.append(label);
      for (const w of dropped) {
        const restoreBtn = document.createElement("button");
        restoreBtn.type = "button";
        restoreBtn.className = "trash-chip";
        restoreBtn.textContent = `+ ${w.text}`;
        restoreBtn.setAttribute("aria-label", `还原词块「${w.text}」`);
        restoreBtn.addEventListener("click", () => toggleWord(w.id));
        trashTray.append(restoreBtn);
      }
    }

    // 底沿选中层控制微条
    const names = { headline: "主标题", sub: "副标导语", meta: "刊期标签" };
    activeLayerLabel.textContent = names[state.selectedLayer];
    const currentActual =
      state.selectedLayer === "headline" ? hlRender : state.selectedLayer === "sub" ? subRender : metaRender;
    sizeReadout.textContent = `${Math.round(currentActual)}px`;

    const isAux = state.selectedLayer !== "headline";
    inkControls.hidden = !isAux;
    if (isAux) {
      const curTier = state.selectedLayer === "sub" ? state.subTier : state.metaTier;
      for (const b of inkBtns) {
        const active = b.dataset.inkTier === curTier;
        b.setAttribute("aria-pressed", String(active));
        b.classList.toggle("is-active", active);
      }
    }

    return { coverRect, scale };
  }

  function renderNow() {
    rafId = 0;
    const { coverRect } = applyCoverScaleAndStyles();

    const subStyle = INK_TIERS.sub[state.subTier];
    const metaStyle = INK_TIERS.meta[state.metaTier];

    const geom = {
      coverW: coverRect.width,
      coverH: coverRect.height,
      headline: collectTextLineRects(coverEl, hlWordsWrap, {
        layer: "headline",
        weight: 1.0,
        color: "#111111",
      }),
      sub: collectTextLineRects(coverEl, subTextEl, {
        layer: "sub",
        weight: subStyle.massFactor,
        color: subStyle.color,
      }),
      meta: collectTextLineRects(coverEl, metaTextEl, {
        layer: "meta",
        weight: metaStyle.massFactor,
        color: metaStyle.color,
        useSolidBox: metaStyle.isSolidBlock,
      }),
    };

    const res = evaluateCover(state, geom);

    // 原海报几何母题（蓝圆斜线与底角蓝三角）随主标题留白轻微退让呼吸
    const retreat = clamp((state.headlinePx - 28) / 80, 0, 1);
    if (coverGeoCircle) {
      coverGeoCircle.style.transform = `translate(${(retreat * 6).toFixed(1)}px, ${(retreat * 10).toFixed(1)}px) scale(${(1 - retreat * 0.08).toFixed(3)})`;
    }
    if (coverGeoTri) {
      coverGeoTri.style.transform = `translate(${(retreat * 5).toFixed(1)}px, ${(retreat * 6).toFixed(1)}px)`;
    }

    // 更新三米远观 2D Canvas（同源 DOM 矩形）
    distView.update(res);
    const eyeMap = {
      headline: "第一眼：主标题",
      sub: "第一眼：副标抢戏",
      meta: "第一眼：刊期蓝块",
      split: "第一眼：多处散焦",
    };
    distEyeLabel.textContent = eyeMap[res.firstEyeLayer];
    distEyeLabel.dataset.state = res.firstEyeLayer === "headline" && res.status.pass ? "good" : res.firstEyeLayer === "headline" ? "mid" : "warn";

    // 更新读数档位（以档位为主并注经验值）
    metricRatio.textContent = `${res.ratio.toFixed(1)}× · ${res.ratioTier.label}`;
    metricRatio.dataset.tone = res.ratioTier.code === "sweet" ? "good" : "warn";
    metricWs.textContent = `${Math.round(res.whitespace * 100)}% · ${res.whitespaceTier.label}`;
    metricWs.dataset.tone = res.whitespaceTier.code === "good" ? "good" : "warn";
    const auxOk = res.minAuxPx >= RULES.AUX_MIN_RENDER_PX - 0.05 && res.minContrast >= RULES.AUX_MIN_CONTRAST;
    metricAux.textContent = auxOk
      ? `清晰 · ≥${Math.floor(res.minAuxPx)}px`
      : res.minAuxPx < RULES.AUX_MIN_RENDER_PX
        ? `偏小 · ${res.minAuxPx.toFixed(1)}px`
        : `发虚 · ${res.minContrast.toFixed(1)}:1`;
    metricAux.dataset.tone = auxOk ? "good" : "warn";

    // 更新原海报四关键词体检灯
    for (const [k, el] of Object.entries(lampEls)) {
      const ok = !!res.lamps[k];
      el.classList.toggle("is-lit", ok);
      el.dataset.ok = String(ok);
    }

    // 更新唯一主诊断
    diagBadge.textContent = res.status.badge;
    diagBadge.dataset.pass = String(res.status.pass);
    diagTitle.textContent = res.status.title;
    diagWhy.textContent = res.status.why;
  }

  function scheduleRender() {
    if (!rafId) rafId = requestAnimationFrame(renderNow);
  }

  // 选中层事件
  hlLayer.addEventListener("click", () => selectLayer("headline"));
  subLayer.addEventListener("click", () => selectLayer("sub"));
  metaLayer.addEventListener("click", () => selectLayer("meta"));
  for (const tb of layerTabBtns) {
    tb.addEventListener("click", () => selectLayer(tb.dataset.pickLayer));
  }

  // 印刷裁切缩放柄拖拽（横向与斜向都灵敏，适配 perf.mjs 左右触控扫拖）
  function bindResizeHandle(handleEl, layerKey, minV, maxV, sensitivity) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startVal = 0;

    const getVal = () =>
      layerKey === "headline" ? state.headlinePx : layerKey === "sub" ? state.subPx : state.metaPx;
    const setVal = (v) => {
      const c = clamp(v, minV, maxV);
      if (layerKey === "headline") state.headlinePx = c;
      else if (layerKey === "sub") state.subPx = c;
      else state.metaPx = c;
    };

    const onStart = (clientX, clientY) => {
      dragging = true;
      selectLayer(layerKey);
      startX = clientX;
      startY = clientY;
      startVal = getVal();
      handleEl.classList.add("is-dragging");
    };

    const onMove = (clientX, clientY) => {
      if (!dragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;
      // 主取横向位移（方便触屏单手和左右拖动），辅以纵向微调
      const delta = (dx + dy * 0.35) * sensitivity;
      setVal(startVal + delta);
      scheduleRender();
    };

    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      handleEl.classList.remove("is-dragging");
    };

    handleEl.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { handleEl.setPointerCapture(e.pointerId); } catch {}
      onStart(e.clientX, e.clientY);
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      onMove(e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);

    // 兼容合成 TouchEvent（例如 CDP Input.dispatchTouchEvent 触控扫拖）
    handleEl.addEventListener("touchstart", (e) => {
      if (!e.touches.length) return;
      e.preventDefault();
      e.stopPropagation();
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener("touchmove", (e) => {
      if (!dragging || !e.touches.length) return;
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);

    handleEl.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        selectLayer(layerKey);
        setVal(getVal() + (layerKey === "headline" ? 6 : 2));
        scheduleRender();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        selectLayer(layerKey);
        setVal(getVal() - (layerKey === "headline" ? 6 : 2));
        scheduleRender();
      }
    });
  }

  bindResizeHandle(hlHandle, "headline", RULES.HEADLINE_MIN, RULES.HEADLINE_MAX, 0.55);
  bindResizeHandle(subHandle, "sub", RULES.SUB_MIN, RULES.SUB_MAX, 0.16);
  bindResizeHandle(metaHandle, "meta", RULES.META_MIN, RULES.META_MAX, 0.14);

  sizeDownBtn.addEventListener("click", () => stepSelectedSize(-1));
  sizeUpBtn.addEventListener("click", () => stepSelectedSize(1));

  for (const b of inkBtns) {
    b.addEventListener("click", () => {
      const tier = b.dataset.inkTier;
      if (state.selectedLayer === "sub") state.subTier = tier;
      else if (state.selectedLayer === "meta") state.metaTier = tier;
      scheduleRender();
    });
  }

  resetBtn.addEventListener("click", () => {
    const fresh = createInitialState();
    Object.assign(state, fresh);
    scheduleRender();
  });

  // 键盘在舞台区域操作
  coverEl.addEventListener("keydown", (e) => {
    if (e.target.closest("button") && e.target !== hlHandle && e.target !== subHandle && e.target !== metaHandle) return;
    if (e.key === "ArrowUp" || e.key === "+") {
      e.preventDefault();
      stepSelectedSize(1);
    } else if (e.key === "ArrowDown" || e.key === "-") {
      e.preventDefault();
      stepSelectedSize(-1);
    } else if (e.key === "r" || e.key === "R") {
      const fresh = createInitialState();
      Object.assign(state, fresh);
      scheduleRender();
    }
  });

  buildWordButtons();
  const ro = new ResizeObserver(() => {
    distView.resize();
    scheduleRender();
  });
  ro.observe(coverEl);
  document.fonts.ready.then(() => scheduleRender());
  renderNow();
}

// =========================================================================
// 2. 第 01 节：0.8 秒快闪扫读测验
// =========================================================================
function initFlashTest() {
  const stage = $("#flash-stage");
  const startBtn = $("#btn-flash-start");
  const revealBtn = $("#btn-flash-reveal");
  const promptEl = $("#flash-prompt");
  const pickBtns = $$("[data-flash-pick]");
  const resultEl = $("#flash-result");
  const cards = $$(".flash-card", stage);

  let timer = 0;
  let phase = "idle"; // idle | flashing | picking | revealed

  function setPhase(next) {
    phase = next;
    stage.dataset.phase = next;
    for (const b of pickBtns) b.disabled = next === "flashing";
  }

  function runFlash() {
    clearTimeout(timer);
    resultEl.textContent = "";
    for (const b of pickBtns) b.classList.remove("is-picked", "is-right", "is-wrong");
    if (reducedMotion.matches) {
      setPhase("revealed");
      promptEl.textContent = "已开启减少动态效果：三版同屏展开，点击下方按钮对比第一眼抓点。";
      return;
    }
    setPhase("flashing");
    promptEl.textContent = "盯着画面看 0.8 秒……";
    timer = setTimeout(() => {
      setPhase("picking");
      promptEl.textContent = "时间到！刚才 0.8 秒里，哪一版让你一眼就读出了「旧船厂再生」？";
    }, 820);
  }

  startBtn.addEventListener("click", runFlash);
  revealBtn.addEventListener("click", () => {
    clearTimeout(timer);
    setPhase("revealed");
    promptEl.textContent = "四维结构已展开：只有同时拉开级差、剪短词句并留白，大标题才立得住。";
  });

  for (const b of pickBtns) {
    b.addEventListener("click", () => {
      clearTimeout(timer);
      setPhase("revealed");
      const pick = b.dataset.flashPick;
      const spec = FLASH_SPECIMENS.find((s) => s.id === pick);
      for (const other of pickBtns) {
        other.classList.remove("is-picked", "is-right", "is-wrong");
      }
      b.classList.add("is-picked", spec?.best ? "is-right" : "is-wrong");
      for (const c of cards) c.classList.toggle("is-highlight", c.dataset.spec === pick);
      resultEl.textContent = spec?.best
        ? `判断准确：${spec.label}（${spec.ratioText}）——${spec.verdict}`
        : `再看一眼 ${spec?.label}（${spec?.ratioText}）：${spec?.verdict} 真正一眼定焦的是样张 C。`;
    });
  }

  setPhase("idle");
}

// =========================================================================
// 3. 第 02 节：行距夹钳 + Archivo 宽度可变轴实验台（零倍率标尺重复）
// =========================================================================
function initLeadingWidthLab() {
  const leadInput = $("#input-leading");
  const widthInput = $("#input-width");
  const leadPresets = $$("[data-lead-preset]");
  const widthPresets = $$("[data-wdth-preset]");

  const specimenBox = $("#s2-specimen-box");
  const zhHeadline = $("#s2-zh-headline");
  const enHeadline = $("#s2-en-headline");
  const leadValEl = $("#s2-lead-val");
  const widthValEl = $("#s2-wdth-val");
  const gapDiagEl = $("#s2-gap-diag");
  const fillDiagEl = $("#s2-fill-diag");
  const combinedNote = $("#s2-combined-note");

  function update() {
    const lh = parseFloat(leadInput.value);
    const wdth = parseInt(widthInput.value, 10);

    zhHeadline.style.lineHeight = lh.toFixed(2);
    enHeadline.style.lineHeight = (lh * 0.96).toFixed(2);
    enHeadline.style.fontVariationSettings = `"wdth" ${wdth}, "wght" 800`;

    leadValEl.textContent = lh.toFixed(2);
    widthValEl.textContent = `${wdth}%`;

    for (const b of leadPresets) {
      const active = Math.abs(parseFloat(b.dataset.leadPreset) - lh) < 0.03;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    }
    for (const b of widthPresets) {
      const active = Math.abs(parseInt(b.dataset.wdthPreset, 10) - wdth) <= 3;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    }

    // 实测行间裂隙与英文主标横向占幅
    const boxW = specimenBox.clientWidth || 300;
    const enRects = collectTextLineRects(specimenBox, enHeadline, { layer: "en" });
    const enMaxW = enRects.rects.length ? Math.max(...enRects.rects.map((r) => r.w)) : 0;
    const fillPct = Math.round(enMaxW * 100);
    const enLines = enRects.lines || 1;

    const leadStatus =
      lh < RULES.LEADING_MIN
        ? "偏紧碰撞 · 上下行笔画开始贴脸"
        : lh <= RULES.LEADING_MAX
          ? "紧钳成块 · 落在 0.95–1.12 经验区"
          : lh <= 1.32
            ? "略松散 · 块面凝聚感开始下降"
            : "裂成散行 · 正文行高套在大字上被白沟切碎";

    gapDiagEl.textContent = leadStatus;
    gapDiagEl.dataset.tone = lh >= RULES.LEADING_MIN && lh <= RULES.LEADING_MAX ? "good" : "warn";

    fillDiagEl.textContent = `实测占幅 ${fillPct}% · ${enLines} 行（字宽 wdth ${wdth}）`;
    fillDiagEl.dataset.tone = enLines <= 2 ? "good" : "warn";

    let note = "";
    if (lh > 1.32) {
      note = "巨字行高超过 1.35 时，行间空白比笔画本身还宽，一个完整标题会被拆成彼此脱节的横条。把行距往 1.00 附近收紧，标题立刻凝成一块雕塑。";
    } else if (lh < RULES.LEADING_MIN) {
      note = "行高低于 0.95 时上下行字面贴得太死，中文撇捺与英文升降部容易互撞；回调到 0.98–1.08 最稳。";
    } else if (enLines >= 3) {
      note = `字宽拉到 ${wdth}% 后英文在固定栏宽（${Math.round(boxW)}px）内被迫折成 ${enLines} 行；把 Archivo 宽度轴收窄到 75–90%，不用降字号就能稳住两行。`;
    } else {
      note = `行高 ${lh.toFixed(2)} 把多行巨字锁成一个整体，配合 Archivo 宽度轴 ${wdth}% 刚好铺满 ${fillPct}% 栏宽，既有冲击力又不折碎词组。`;
    }
    combinedNote.textContent = note;
  }

  leadInput.addEventListener("input", update);
  widthInput.addEventListener("input", update);
  for (const b of leadPresets) {
    b.addEventListener("click", () => {
      leadInput.value = b.dataset.leadPreset;
      update();
    });
  }
  for (const b of widthPresets) {
    b.addEventListener("click", () => {
      widthInput.value = b.dataset.wdthPreset;
      update();
    });
  }
  const ro = new ResizeObserver(update);
  ro.observe(specimenBox);
  document.fonts.ready.then(update);
  update();
}

// =========================================================================
// 4. 第 03 节：它从哪来 — 6 年代活字样本翻页夹
// =========================================================================
function initTimelineBinder() {
  const tabsWrap = $("#era-tabs");
  const prevBtn = $("#era-prev");
  const nextBtn = $("#era-next");
  const yearEl = $("#era-year");
  const tagEl = $("#era-tag");
  const titleEl = $("#era-title");
  const summaryEl = $("#era-summary");
  const extraLinkWrap = $("#era-extra-link");
  const sourceEl = $("#era-source");
  const specBox = $("#era-specimen");
  const specTitle = $("#era-spec-title");
  const specSub = $("#era-spec-sub");
  const counterEl = $("#era-counter");

  let index = 0;

  tabsWrap.innerHTML = "";
  TIMELINE_ERAS.forEach((era, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "era-tab";
    btn.textContent = era.year;
    btn.addEventListener("click", () => show(i));
    tabsWrap.append(btn);
  });

  function show(i) {
    index = (i + TIMELINE_ERAS.length) % TIMELINE_ERAS.length;
    const era = TIMELINE_ERAS[index];
    for (const [idx, b] of $$(".era-tab", tabsWrap).entries()) {
      const active = idx === index;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    yearEl.textContent = era.year;
    tagEl.textContent = era.tag;
    titleEl.textContent = era.title;
    summaryEl.textContent = era.summary;
    sourceEl.textContent = era.source;
    specBox.dataset.eraStyle = era.specimenStyle;
    specTitle.textContent = era.specimenTitle;
    specSub.textContent = era.specimenSub;
    counterEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(TIMELINE_ERAS.length).padStart(2, "0")}`;

    extraLinkWrap.innerHTML = "";
    if (era.noteLink) {
      const p = document.createElement("p");
      p.className = "era-cross-note";
      const a = document.createElement("a");
      a.href = era.noteLink.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = era.noteLink.text;
      p.append(a);
      extraLinkWrap.append(p);
    }
  }

  prevBtn.addEventListener("click", () => show(index - 1));
  nextBtn.addEventListener("click", () => show(index + 1));
  show(0);
}

// =========================================================================
// 5. 第 04 节：字一巨大，图形退让 — 四式落位 + 拖蓝圆斜线锚
// =========================================================================
function initGraphicRetreatLab() {
  const stage = $("#s4-stage");
  const anchor = $("#s4-anchor");
  const titleBlock = $("#s4-title-block");
  const modeBtns = $$("[data-comp-mode]");
  const modeDesc = $("#s4-mode-desc");
  const overlapStatus = $("#s4-overlap-status");

  let mode = COMP_MODES[0];
  let pos = { ...mode.defaultPos };
  let dragging = false;

  function render() {
    stage.dataset.mode = mode.id;
    anchor.style.left = `${(pos.x * 100).toFixed(1)}%`;
    anchor.style.top = `${(pos.y * 100).toFixed(1)}%`;

    for (const b of modeBtns) {
      const active = b.dataset.compMode === mode.id;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    modeDesc.textContent = mode.desc;

    // 真实 DOM 碰撞检测：蓝圆是否压进主标题字口
    const tr = titleBlock.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    const ix = Math.max(0, Math.min(tr.right, ar.right) - Math.max(tr.left, ar.left));
    const iy = Math.max(0, Math.min(tr.bottom, ar.bottom) - Math.max(tr.top, ar.top));
    const overlapRatio = ar.width * ar.height > 0 ? (ix * iy) / (ar.width * ar.height) : 0;

    if (mode.id === "underlay") {
      overlapStatus.textContent = overlapRatio > 0.15
        ? "浅底退后模式：图形已降为低饱和浅蓝底衬并压在字后，穿插而不打断识字。"
        : "图形停在标题旁侧，可往左上轻拖测试浅底穿插。";
      overlapStatus.dataset.tone = "good";
    } else if (overlapRatio > 0.12) {
      overlapStatus.textContent = "遮挡警告：高饱和实底钴蓝圆撞进主标题字口，笔画边缘被切断——请把蓝圆拖回空白配重角。";
      overlapStatus.dataset.tone = "warn";
    } else {
      overlapStatus.textContent = "配重安全：蓝圆斜线停在标题疆界外侧，既平衡画面又不与文字争锋。";
      overlapStatus.dataset.tone = "good";
    }
  }

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      const found = COMP_MODES.find((m) => m.id === b.dataset.compMode);
      if (!found) return;
      mode = found;
      pos = { ...mode.defaultPos };
      render();
    });
  }

  const moveToClient = (cx, cy) => {
    const r = stage.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    pos.x = clamp((cx - r.left) / r.width, 0.14, 0.88);
    pos.y = clamp((cy - r.top) / r.height, 0.16, 0.86);
    render();
  };

  anchor.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    try { anchor.setPointerCapture(e.pointerId); } catch {}
    anchor.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moveToClient(e.clientX, e.clientY);
  });
  const stopDrag = () => {
    dragging = false;
    anchor.classList.remove("is-dragging");
  };
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  anchor.addEventListener("keydown", (e) => {
    const step = 0.06;
    if (e.key === "ArrowLeft") { e.preventDefault(); pos.x = clamp(pos.x - step, 0.14, 0.88); render(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); pos.x = clamp(pos.x + step, 0.14, 0.88); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pos.y = clamp(pos.y - step, 0.16, 0.86); render(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); pos.y = clamp(pos.y + step, 0.16, 0.86); render(); }
  });

  render();
}

// =========================================================================
// 6. 第 05 节：封面、章节页与重点页 — 三场景切换 + 弱化前后拉帘
// =========================================================================
function initSceneCurtain() {
  const sceneBtns = $$("[data-scene-id]");
  const range = $("#s5-curtain-range");
  const frame = $("#s5-curtain-frame");
  const afterPane = $("#s5-after-pane");
  const divider = $("#s5-divider");
  const noteEl = $("#s5-scene-note");
  const pctLabel = $("#s5-curtain-pct");

  function setScene(id) {
    const sc = SCENE_CASES.find((s) => s.id === id) || SCENE_CASES[0];
    frame.dataset.scene = sc.id;
    for (const b of sceneBtns) {
      const active = b.dataset.sceneId === sc.id;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    for (const el of $$("[data-scene-hl]", frame)) el.textContent = sc.headline;
    for (const el of $$("[data-scene-sub]", frame)) el.textContent = sc.sub;
    for (const el of $$("[data-scene-meta]", frame)) el.textContent = sc.meta;
    noteEl.textContent = sc.note;
  }

  function setSplit(pct) {
    const p = clamp(pct, 8, 92);
    range.value = String(Math.round(p));
    afterPane.style.clipPath = `inset(0 0 0 ${p}%)`;
    divider.style.left = `${p}%`;
    pctLabel.textContent = p <= 25
      ? "拉帘偏左：右侧完整展示「辅助弱化、主角独霸」"
      : p >= 75
        ? "拉帘偏右：左侧完整暴露「辅助抢戏、层级模糊」"
        : `拉帘停在 ${Math.round(p)}%：左为辅文抢戏 · 右为辅文退后可读`;
  }

  for (const b of sceneBtns) {
    b.addEventListener("click", () => setScene(b.dataset.sceneId));
  }
  range.addEventListener("input", () => setSplit(parseFloat(range.value)));

  // 支持直接拖拉帘竖线
  let dragging = false;
  const moveDivider = (clientX) => {
    const r = frame.getBoundingClientRect();
    if (r.width < 1) return;
    setSplit(((clientX - r.left) / r.width) * 100);
  };
  divider.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    try { divider.setPointerCapture(e.pointerId); } catch {}
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moveDivider(e.clientX);
  });
  const endDiv = () => { dragging = false; };
  window.addEventListener("pointerup", endDiv);
  window.addEventListener("pointercancel", endDiv);

  setScene("cover");
  setSplit(48);
}

// =========================================================================
// 7. 第 06 节：什么时候别用大标题（4 反例切板 + 同小类 12 页矩阵）
// =========================================================================
function initAntiPatterns() {
  const grid = $("#s6-anti-grid");
  grid.innerHTML = "";

  for (const item of ANTI_CASES) {
    const card = document.createElement("article");
    card.className = "anti-card";
    card.dataset.mode = "bad";

    card.innerHTML = `
      <div class="anti-top">
        <h3>${item.title}</h3>
        <button type="button" class="anti-toggle" aria-pressed="false">切看对路版式</button>
      </div>
      <div class="anti-wire" aria-hidden="true">
        ${renderAntiWireSvg(item.id)}
      </div>
      <p class="anti-copy">${item.badLabel}</p>
      <p class="anti-link-row">更对路的做法：见 <a href="${item.link.href}" target="_blank" rel="noopener">${item.link.id} ${item.link.name}</a></p>
    `;

    const btn = $(".anti-toggle", card);
    const copy = $(".anti-copy", card);
    btn.addEventListener("click", () => {
      const nextGood = card.dataset.mode === "bad";
      card.dataset.mode = nextGood ? "good" : "bad";
      btn.setAttribute("aria-pressed", String(nextGood));
      btn.textContent = nextGood ? "回看硬塞翻车" : "切看对路版式";
      copy.textContent = nextGood ? item.goodLabel : item.badLabel;
    });
    grid.append(card);
  }

  const sibGrid = $("#s6-sibling-grid");
  sibGrid.innerHTML = "";
  for (const s of SIBLING_LAYOUTS) {
    const a = document.createElement("a");
    a.className = "sibling-item";
    a.href = `https://layout.xiaoxiaodong.ai/${s.id}/play/`;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = `<span class="sib-id" lang="en">${s.id}</span><strong>${s.name}</strong><span class="sib-note">${s.note}</span>`;
    sibGrid.append(a);
  }
}

function renderAntiWireSvg(id) {
  // 纯几何对比示意图：.wire-bad 与 .wire-good 按父元素 data-mode 切换
  if (id === "dashboard") {
    return `<svg viewBox="0 0 240 112" class="wire-svg">
      <g class="wire-bad">
        <rect x="8" y="8" width="224" height="50" fill="#235AD2"/>
        <rect x="18" y="18" width="160" height="14" fill="#F7F2EA"/>
        <rect x="18" y="37" width="112" height="12" fill="#F7F2EA"/>
        <rect x="8" y="68" width="68" height="36" fill="none" stroke="#8C99B3" stroke-width="1.5"/>
        <rect x="86" y="68" width="68" height="36" fill="none" stroke="#8C99B3" stroke-width="1.5"/>
        <rect x="164" y="68" width="68" height="36" fill="none" stroke="#8C99B3" stroke-width="1.5"/>
      </g>
      <g class="wire-good">
        <rect x="8" y="8" width="224" height="16" fill="#235AD2"/>
        <rect x="16" y="13" width="64" height="6" fill="#F7F2EA"/>
        <rect x="8" y="32" width="106" height="34" fill="none" stroke="#F7F2EA" stroke-width="1.5"/>
        <rect x="126" y="32" width="106" height="34" fill="none" stroke="#F7F2EA" stroke-width="1.5"/>
        <rect x="8" y="74" width="224" height="30" fill="none" stroke="#8C99B3" stroke-width="1.5"/>
      </g>
    </svg>`;
  }
  if (id === "legal") {
    return `<svg viewBox="0 0 240 112" class="wire-svg">
      <g class="wire-bad">
        <rect x="8" y="10" width="210" height="24" fill="#FF7A66"/>
        <rect x="8" y="42" width="150" height="24" fill="#FF7A66"/>
        <rect x="8" y="76" width="220" height="6" fill="#8C99B3"/>
        <rect x="8" y="88" width="190" height="6" fill="#8C99B3"/>
        <rect x="8" y="100" width="160" height="6" fill="#8C99B3"/>
      </g>
      <g class="wire-good">
        <rect x="8" y="10" width="96" height="10" fill="#F7F2EA"/>
        <rect x="8" y="30" width="218" height="7" fill="#B4C2D6"/>
        <rect x="8" y="44" width="206" height="7" fill="#B4C2D6"/>
        <rect x="8" y="62" width="218" height="7" fill="#B4C2D6"/>
        <rect x="8" y="76" width="198" height="7" fill="#B4C2D6"/>
        <rect x="8" y="94" width="176" height="7" fill="#B4C2D6"/>
      </g>
    </svg>`;
  }
  if (id === "photo") {
    return `<svg viewBox="0 0 240 112" class="wire-svg">
      <g class="wire-bad">
        <rect x="8" y="8" width="224" height="96" fill="#21314F"/>
        <circle cx="152" cy="48" r="24" fill="#4C7CE5"/>
        <rect x="16" y="24" width="198" height="24" fill="#111111" stroke="#FF7A66" stroke-width="1.5"/>
        <rect x="16" y="56" width="164" height="24" fill="#111111" stroke="#FF7A66" stroke-width="1.5"/>
      </g>
      <g class="wire-good">
        <rect x="8" y="8" width="224" height="96" fill="#21314F"/>
        <circle cx="152" cy="48" r="26" fill="#4C7CE5"/>
        <polygon points="8,104 96,52 174,104" fill="#1446B8"/>
        <rect x="18" y="84" width="72" height="8" fill="#F7F2EA"/>
      </g>
    </svg>`;
  }
  return `<svg viewBox="0 0 240 112" class="wire-svg">
    <g class="wire-bad">
      <rect x="8" y="10" width="224" height="16" fill="#FF7A66"/>
      <rect x="8" y="32" width="220" height="16" fill="#FF7A66"/>
      <rect x="8" y="54" width="216" height="16" fill="#FF7A66"/>
      <rect x="8" y="76" width="204" height="16" fill="#FF7A66"/>
      <rect x="8" y="96" width="140" height="10" fill="#8C99B3"/>
    </g>
    <g class="wire-good">
      <rect x="8" y="10" width="108" height="26" fill="#F7F2EA"/>
      <rect x="8" y="48" width="104" height="54" fill="none" stroke="#B4C2D6" stroke-width="1.5"/>
      <rect x="124" y="48" width="108" height="54" fill="none" stroke="#B4C2D6" stroke-width="1.5"/>
      <rect x="18" y="60" width="76" height="7" fill="#B4C2D6"/>
      <rect x="134" y="60" width="84" height="7" fill="#B4C2D6"/>
    </g>
  </svg>`;
}

// =========================================================================
// 8. 第 07 节：小练习 — 四档均 > 3×、乱序、与 model.js 同一几何测量
// =========================================================================
function initExercise() {
  const grid = $("#s7-grid");
  const feedbackEl = $("#s7-feedback");
  const retryBtn = $("#s7-retry");

  grid.innerHTML = "";
  const cardRefs = [];

  for (const opt of EXERCISE_SPEC.options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ex-card";
    btn.dataset.optId = opt.id;
    btn.setAttribute("aria-pressed", "false");

    btn.innerHTML = `
      <span class="ex-label">方案 ${opt.id}</span>
      <div class="ex-folio">
        <svg class="ex-tri" viewBox="0 0 120 120" aria-hidden="true">
          <polygon points="120,12 120,120 18,120" fill="#1446B8"/>
        </svg>
        <div class="ex-meta" lang="en">${EXERCISE_SPEC.metaText}</div>
        <div class="ex-headline">${EXERCISE_SPEC.headlineText}</div>
        <div class="ex-sub">${EXERCISE_SPEC.subText}</div>
      </div>
      <div class="ex-stats" hidden></div>
    `;

    btn.addEventListener("click", () => handlePick(opt.id));
    grid.append(btn);
    cardRefs.push({ opt, btn, folio: $(".ex-folio", btn), hl: $(".ex-headline", btn), sub: $(".ex-sub", btn), meta: $(".ex-meta", btn), stats: $(".ex-stats", btn) });
  }

  function applyScales() {
    for (const c of cardRefs) {
      const w = c.folio.getBoundingClientRect().width;
      const scale = w > 0 ? w / EXERCISE_SPEC.baseW : 1;
      const pad = EXERCISE_SPEC.padX * scale;
      c.folio.style.padding = `${(pad * 0.95).toFixed(1)}px ${pad.toFixed(1)}px`;
      c.hl.style.fontSize = `${(c.opt.headlinePx * scale).toFixed(2)}px`;
      c.sub.style.fontSize = `${Math.max(RULES.AUX_MIN_RENDER_PX, EXERCISE_SPEC.subPx * scale).toFixed(2)}px`;
      c.meta.style.fontSize = `${Math.max(RULES.AUX_MIN_RENDER_PX, EXERCISE_SPEC.metaPx * scale).toFixed(2)}px`;
    }
  }

  function measureCard(c) {
    const h = collectTextLineRects(c.folio, c.hl, { layer: "headline" });
    const s = collectTextLineRects(c.folio, c.sub, { layer: "sub" });
    const m = collectTextLineRects(c.folio, c.meta, { layer: "meta" });
    const ws = Math.max(0, Math.min(1, 1 - unionRectArea([...h.rects, ...s.rects, ...m.rects])));
    const ratio = s.fontSize > 0 ? h.fontSize / s.fontSize : c.opt.headlinePx / EXERCISE_SPEC.subPx;
    return { ratio, lines: h.lines, ws };
  }

  function handlePick(pickId) {
    applyScales();
    const chosen = EXERCISE_SPEC.options.find((o) => o.id === pickId);
    for (const c of cardRefs) {
      const m = measureCard(c);
      c.btn.setAttribute("aria-pressed", String(c.opt.id === pickId));
      c.btn.classList.toggle("is-correct", c.opt.correct);
      c.btn.classList.toggle("is-picked-wrong", c.opt.id === pickId && !c.opt.correct);
      c.stats.hidden = false;
      c.stats.innerHTML = `<strong>${c.opt.issueTag}</strong> · 倍率 ${m.ratio.toFixed(1)}× · ${m.lines} 行 · 净留白 ${Math.round(m.ws * 100)}%`;
    }
    const right = EXERCISE_SPEC.options.find((o) => o.correct);
    feedbackEl.hidden = false;
    feedbackEl.dataset.result = chosen.correct ? "correct" : "wrong";
    feedbackEl.innerHTML = chosen.correct
      ? `<p><strong>选对了（方案 ${chosen.id}）。</strong>${chosen.explain}</p>`
      : `<p><strong>你选了方案 ${chosen.id}（${chosen.issueTag}）。</strong>${chosen.explain}</p><p><strong>更稳妥的是方案 ${right.id}：</strong>${right.explain}</p>`;
    retryBtn.hidden = false;
  }

  retryBtn.addEventListener("click", () => {
    for (const c of cardRefs) {
      c.btn.setAttribute("aria-pressed", "false");
      c.btn.classList.remove("is-correct", "is-picked-wrong");
      c.stats.hidden = true;
    }
    feedbackEl.hidden = true;
    retryBtn.hidden = true;
  });

  const ro = new ResizeObserver(applyScales);
  ro.observe(grid);
  document.fonts.ready.then(applyScales);
  applyScales();
}

// =========================================================================
// 9. 第 08 节：原海报放大拖拽灯箱
// =========================================================================
function initPosterLightbox() {
  const trigger = $("#poster-btn");
  const posterImg = $("#poster");
  const lightbox = $("#poster-lightbox");
  const lbImg = $("#lightbox-img");
  const closeBtn = $("#lightbox-close");
  const resetZoomBtn = $("#lightbox-reset");

  let tx = 0;
  let ty = 0;
  let scale = 1.45;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function openLightbox() {
    lbImg.src = posterImg.src;
    tx = 0;
    ty = 0;
    scale = window.innerWidth < 640 ? 1.25 : 1.45;
    applyTransform();
    lightbox.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", openLightbox);
  closeBtn.addEventListener("click", closeLightbox);
  resetZoomBtn.addEventListener("click", () => {
    tx = 0; ty = 0; scale = 1.35; applyTransform();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  lbImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { lbImg.setPointerCapture(e.pointerId); } catch {}
    lbImg.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const stopPan = () => {
    dragging = false;
    lbImg.classList.remove("is-dragging");
  };
  window.addEventListener("pointerup", stopPan);
  window.addEventListener("pointercancel", stopPan);

  lbImg.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.15 : -0.15), 1, 2.8);
    applyTransform();
  }, { passive: false });
}

// =========================================================================
// 启动全部模块
// =========================================================================
hydrateUnifiedConstants();
initHeroBench();
initFlashTest();
initLeadingWidthLab();
initTimelineBinder();
initGraphicRetreatLab();
initSceneCurtain();
initAntiPatterns();
initExercise();
initPosterLightbox();
