// 343 图片与标题说明 幻灯片版式 · 全页交互总控

import {
  ANCHORS_02,
  INITIAL_STATE,
  LAYERS_01,
  PRESETS,
  QUIZ_06,
  SIBLINGS,
  TIMELINE_04,
  TRIAGE_05,
  clamp,
  evaluate,
} from "./model.js";
import { createHeroStage, createRoomSimulator } from "./stage.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 1. 开场活体暗室图文剪辑台 ====================
const state = { ...INITIAL_STATE };
const heroCanvas = $("#hero-canvas");

const topStatusPill = $("#top-status-pill");
const heroRatioTag = $("#hero-ratio-tag");
const heroDock = $("#hero-dock");
const diagPill = $("#diag-pill");
const diagTier = $("#diag-tier");
const diagHead = $("#diag-head");
const diagReason = $("#diag-reason");
const diagNext = $("#diag-next");
const ratioSlider = $("#ratio-slider");
const ratioReadout = $("#ratio-readout");
const btnScrim = $("#btn-scrim");

const heroStage = createHeroStage(
  heroCanvas,
  () => state,
  (patch, opts = {}) => {
    Object.assign(state, patch);
    syncHeroUI(opts.fromDrag);
  }
);

function syncHeroUI(skipCanvas = false) {
  const audit = evaluate(state);
  const passAll = audit.passed === 5;

  topStatusPill.textContent = audit.statusPill;
  topStatusPill.classList.toggle("is-pass", passAll);

  heroRatioTag.textContent =
    audit.clutterPct > 0
      ? `有效图 ${audit.sharePct}% · 杂框 ${audit.clutterPct}% · 文字区 ${100 - audit.rawPct}%`
      : `主图 ${audit.sharePct}% · 说明区 ${100 - audit.rawPct}%`;
  heroDock.classList.toggle("is-pass", passAll);

  diagPill.textContent = audit.statusPill;
  diagPill.classList.toggle("is-pass", passAll);
  diagTier.textContent = audit.tierLabel;
  diagHead.textContent = audit.headline;
  diagReason.textContent = audit.reason;
  diagNext.textContent = `${passAll ? "进一步验证" : "下一步"}：${audit.nextAction}`;

  ratioSlider.value = String(audit.rawPct);
  ratioReadout.textContent = `${audit.rawPct}%`;

  btnScrim.setAttribute("aria-pressed", String(state.scrim));
  btnScrim.textContent = state.scrim ? "底部暗罩：开" : "底部暗罩：关";

  $$("[data-deck]").forEach((b) => b.classList.toggle("is-active", b.dataset.deck === state.deck));
  $$("[data-ori]").forEach((b) => b.classList.toggle("is-active", b.dataset.ori === state.orientation));

  // 左侧 5 条原海报橘红虚线引注同步更新
  for (const key of ["hero", "title", "caption", "explain", "guide"]) {
    const chk = audit.checks[key];
    const item = $(`.rail-item[data-slot="${key}"]`);
    const badge = $(`[data-rail-badge="${key}"]`);
    if (item) {
      item.classList.toggle("is-pass", chk.ok);
      item.classList.toggle("is-focused", state.focusSlot === key);
    }
    if (badge) {
      badge.textContent = chk.shortTag;
    }

    // 底部 1:1 复刻原海报「设计要点」条实时亮灭
    const stripItem = $(`.strip-item[data-strip="${key}"]`);
    if (stripItem) {
      stripItem.classList.toggle("is-pass", chk.ok);
      const mark = $(".strip-mark", stripItem);
      if (mark) mark.textContent = chk.ok ? "✓" : "×";
    }
  }

  if (!skipCanvas) heroStage.invalidate();
}

// 剧本切换
$$("[data-deck]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroStage.stopPlayback();
    state.deck = btn.dataset.deck;
    syncHeroUI();
  });
});

// 构图朝向切换
$$("[data-ori]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroStage.stopPlayback();
    const ori = btn.dataset.ori;
    state.orientation = ori;
    if (ori === "full-bleed" && state.imageRatio < 0.65) state.imageRatio = 0.76;
    if (ori === "left-right" && state.imageRatio > 0.68) state.imageRatio = 0.60;
    if (ori === "top-bottom" && state.imageRatio > 0.74) state.imageRatio = 0.63;
    syncHeroUI();
  });
});

// 主图占比滑尺
ratioSlider.addEventListener("input", () => {
  heroStage.stopPlayback();
  state.imageRatio = clamp(Number(ratioSlider.value) / 100, 0.24, 0.82);
  state.focusSlot = "hero";
  syncHeroUI();
});

// 暗罩开关
btnScrim.addEventListener("click", () => {
  heroStage.stopPlayback();
  state.scrim = !state.scrim;
  if (state.orientation !== "full-bleed") {
    state.orientation = "full-bleed";
    if (state.imageRatio < 0.7) state.imageRatio = 0.76;
  }
  state.focusSlot = "explain";
  syncHeroUI();
});

// 一键校准 / 复原 / 预设多解与反向试错
$("#btn-fix-poster").addEventListener("click", () => {
  heroStage.stopPlayback();
  Object.assign(state, PRESETS.poster);
  syncHeroUI();
});

$("#btn-reset-broken").addEventListener("click", () => {
  heroStage.stopPlayback();
  Object.assign(state, PRESETS.broken, { deck: state.deck });
  syncHeroUI();
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroStage.stopPlayback();
    const p = PRESETS[btn.dataset.preset];
    if (p) {
      Object.assign(state, p);
      syncHeroUI();
    }
  });
});

// 3 秒暗场投屏按钮
$("#btn-play-top").addEventListener("click", () => heroStage.startPlayback());
$("#btn-play-dock").addEventListener("click", () => heroStage.startPlayback());

// 点击左侧 5 条原海报引注：首次点高亮聚焦，再点即对该槽执行精准手术
$$(".rail-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroStage.stopPlayback();
    const slot = btn.dataset.slot;
    const same = state.focusSlot === slot;
    state.focusSlot = slot;
    if (same || !evaluate(state).checks[slot].ok) {
      if (slot === "hero") {
        state.visualMode = state.visualMode === "focused" ? "flat" : "focused";
        if (state.imageRatio < 0.54 || state.imageRatio > 0.76) state.imageRatio = 0.63;
      } else if (slot === "title") {
        state.titleMode = state.titleMode === "claim" ? "describe" : "claim";
      } else if (slot === "caption") {
        state.captionMode = state.captionMode === "balanced" ? "minimal" : "balanced";
      } else if (slot === "explain") {
        state.scrim = true;
        if (state.captionMode === "wall" || state.captionMode === "none") state.captionMode = "balanced";
      } else if (slot === "guide") {
        state.guideMode = state.guideMode === "aligned" ? "overloaded" : "aligned";
      }
    }
    syncHeroUI();
  });
});

// 键盘操作：左右方向键微调主图占比，Space 触发 3 秒投屏（非输入控件焦点时）
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#lightbox").hidden) {
    closeLightbox();
    return;
  }
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  if (e.code === "Space" && document.activeElement?.tagName !== "BUTTON") {
    const r = heroCanvas.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) {
      e.preventDefault();
      heroStage.startPlayback();
    }
  } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    const r = heroCanvas.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) {
      e.preventDefault();
      heroStage.stopPlayback();
      const step = e.key === "ArrowRight" ? 0.03 : -0.03;
      state.imageRatio = clamp(Number((state.imageRatio + step).toFixed(3)), 0.24, 0.82);
      state.focusSlot = "hero";
      syncHeroUI();
    }
  }
});

// ==================== 2. 01 节 · 五层盲抽剥离开关矩阵 ====================
const layerState = { hero: true, title: true, caption: true, explain: true, guide: true };
const layerSwitchesEl = $("#layer-switches");
const layerVerdictEl = $("#layer-verdict");

function renderLayers01() {
  layerSwitchesEl.innerHTML = "";
  for (const item of LAYERS_01) {
    const on = layerState[item.id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layer-btn";
    btn.setAttribute("aria-pressed", String(on));
    btn.dataset.layerId = item.id;
    btn.innerHTML = `
      <span class="layer-check" aria-hidden="true">${on ? "✓" : "×"}</span>
      <span>
        <span class="layer-name">${item.name} · ${item.en}</span>
        <span class="layer-quote">「${item.posterQuote}」</span>
      </span>
      <span class="layer-state">${on ? "显示中" : "已剥离"}</span>
    `;
    btn.addEventListener("click", () => {
      layerState[item.id] = !layerState[item.id];
      renderLayers01();
    });
    layerSwitchesEl.appendChild(btn);
  }

  // 同步控制 SVG 5 层显隐
  $("#svg-layer-hero").setAttribute("opacity", layerState.hero ? "1" : "0");
  $("#svg-layer-hero-empty").setAttribute("opacity", layerState.hero ? "0" : "1");
  $("#svg-layer-title").setAttribute("opacity", layerState.title ? "1" : "0");
  $("#svg-layer-caption").setAttribute("opacity", layerState.caption ? "1" : "0");
  $("#svg-layer-explain").setAttribute("opacity", layerState.explain ? "1" : "0");
  $("#svg-layer-guide").setAttribute("opacity", layerState.guide ? "1" : "0");

  const missing = LAYERS_01.filter((l) => !layerState[l.id]);
  if (!missing.length) {
    layerVerdictEl.innerHTML =
      "<strong>五件套完整协同：</strong>主图先抢第一眼，引导箭与琥珀角标顺势接力，标题把画面锚定在唯一观点，图注与三要点在底部低干扰补齐要点。试试点掉其中 1–2 层看看会发生什么。";
  } else {
    layerVerdictEl.innerHTML = missing
      .map((m) => `<div><strong>少了「${m.name}」：</strong>${m.whenMissing}</div>`)
      .join("");
  }
}

$("#btn-layers-all").addEventListener("click", () => {
  for (const k of Object.keys(layerState)) layerState[k] = true;
  renderLayers01();
});

// ==================== 3. 02 节 · 一图四锚标题换带台 ====================
let activeAnchor = ANCHORS_02[0].id;
const anchorTabsEl = $("#anchor-tabs");

function renderAnchor02() {
  anchorTabsEl.innerHTML = "";
  for (const item of ANCHORS_02) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.role = "tab";
    btn.className = `anchor-tab${item.id === activeAnchor ? " is-active" : ""}`;
    btn.setAttribute("aria-selected", String(item.id === activeAnchor));
    btn.dataset.anchorId = item.id;
    btn.textContent = item.tab;
    btn.addEventListener("click", () => {
      activeAnchor = item.id;
      renderAnchor02();
    });
    anchorTabsEl.appendChild(btn);
  }

  const cur = ANCHORS_02.find((a) => a.id === activeAnchor) || ANCHORS_02[0];
  const ring = $("#anchor-focus-ring");
  const tag = $("#anchor-focus-tag");
  const bg = $("#anchor-focus-bg");
  const cx = Math.round(14 + 512 * cur.focus.x);
  const cy = Math.round(14 + 222 * cur.focus.y);
  const r = Math.round(222 * cur.focus.r);
  ring.setAttribute("cx", String(cx));
  ring.setAttribute("cy", String(cy));
  ring.setAttribute("r", String(r));
  ring.setAttribute(
    "stroke",
    cur.verdictTone === "pass" ? "#FF9248" : cur.verdictTone === "warn" ? "#FFD166" : "#FF7A80"
  );
  bg.setAttribute("stroke", ring.getAttribute("stroke"));
  tag.textContent = cur.focus.tag;

  $("#anchor-slide-h").textContent = cur.headline;
  $("#anchor-slide-p").textContent = cur.caption;

  const verdict = $("#anchor-verdict");
  verdict.textContent = cur.verdict;
  verdict.className = `mirror-badge${cur.verdictTone === "warn" ? " is-warn" : cur.verdictTone === "fail" ? " is-fail" : ""}`;
  $("#anchor-takeaway").textContent = cur.takeaway;
  $("#anchor-barthes").textContent = cur.barthesNote;
}

// ==================== 4. 03 节 · 演讲厅远距模拟器 ====================
const roomState = { distance: 12, ratio: 0.63, layout: "top-bottom", scrim: "grad" };
const roomCanvas = $("#room-canvas");
const roomSim = createRoomSimulator(roomCanvas, () => roomState);

function syncRoomUI() {
  const d = roomState.distance;
  const pct = Math.round(roomState.ratio * 100);
  $("#room-dist-val").textContent = `${d} m · ${d <= 6 ? "前排" : d <= 10 ? "中排" : "后排"}`;
  $("#room-ratio-val").textContent = `${pct}%`;

  $$("[data-room-layout]").forEach((b) => b.classList.toggle("is-active", b.dataset.roomLayout === roomState.layout));
  $$("[data-room-scrim]").forEach((b) => b.classList.toggle("is-active", b.dataset.roomScrim === roomState.scrim));

  let msg = "";
  if (roomState.layout === "full-bleed" && roomState.scrim === "none") {
    msg = `<strong>后排风险（${d}m）：</strong>满屏叠字未开暗罩，浅色标题直接撞在克莱因蓝与骨白圆日上。站到 ${d} 米外时边缘发糊，文字迅速融进画面背景。`;
  } else if (pct < 48) {
    msg = `<strong>主图偏弱（${pct}%）：</strong>在 ${d} 米距离下，主图体量已退化成小插图，整页视觉统治力明显下降；建议调回 55%–75% 经验区间。`;
  } else if (pct > 76 && roomState.layout !== "full-bleed") {
    msg = `<strong>说明区过扁（仅剩 ${100 - pct}%）：</strong>主图把文字舱压得太窄，在 ${d} 米后排看，下方短图注字号被迫缩水，远距辨识度骤降。`;
  } else {
    msg = `<strong>清晰稳妥（${d}m · 图 ${pct}%）：</strong>主图轮廓在 ${d} 米后排依旧一眼可辨，${
      roomState.layout === "full-bleed" ? "底部暗罩托出了足够反差" : "独立深玄底与高对比骨白字保住了可读性"
    }，标题与图注无明显湮灭。`;
  }
  $("#room-readout").innerHTML = msg;
  roomSim.invalidate();
}

$("#room-dist").addEventListener("input", (e) => {
  roomState.distance = Number(e.target.value);
  syncRoomUI();
});

$("#room-ratio").addEventListener("input", (e) => {
  roomState.ratio = Number(e.target.value) / 100;
  syncRoomUI();
});

$$("[data-room-layout]").forEach((btn) => {
  btn.addEventListener("click", () => {
    roomState.layout = btn.dataset.roomLayout;
    syncRoomUI();
  });
});

$$("[data-room-scrim]").forEach((btn) => {
  btn.addEventListener("click", () => {
    roomState.scrim = btn.dataset.roomScrim;
    if (roomState.layout !== "full-bleed") roomState.layout = "full-bleed";
    syncRoomUI();
  });
});

// ==================== 5. 04 节 · 五代演进时间轴 ====================
let activeEra = 0;
const eraRailEl = $("#era-rail");

function eraSpecimenSVG(kind) {
  if (kind === "barthes") {
    return `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#0A0E11"/><rect x="16" y="16" width="248" height="104" fill="#123FDF"/><circle cx="140" cy="68" r="32" fill="#EFE8DB"/><text x="140" y="73" text-anchor="middle" fill="#0E1216" font-size="11" font-weight="700">多义图像</text><path d="M140,120 L140,142" stroke="#FF9248" stroke-width="2" stroke-dasharray="3 3"/><rect x="34" y="142" width="212" height="24" fill="#161D24" stroke="#ED7D21"/><text x="140" y="158" text-anchor="middle" fill="#F4EFE6" font-size="11">标题下锚（Ancrage）→ 锁定唯一含义</text></svg>`;
  }
  if (kind === "paivio") {
    return `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#0A0E11"/><rect x="16" y="22" width="114" height="92" fill="#123FDF"/><circle cx="73" cy="68" r="24" fill="#EFE8DB"/><text x="73" y="134" text-anchor="middle" fill="#7FA6FF" font-size="11" font-weight="700">图像表象通道</text><rect x="150" y="22" width="114" height="92" fill="#161D24" stroke="#ED7D21"/><text x="207" y="64" text-anchor="middle" fill="#F4EFE6" font-size="13" font-weight="700">精炼标题</text><text x="207" y="84" text-anchor="middle" fill="#B8C0C8" font-size="10.5">语言符号编码</text><text x="207" y="134" text-anchor="middle" fill="#FF9248" font-size="11" font-weight="700">语言符号通道</text><line x1="73" y1="146" x2="207" y2="146" stroke="#36D89E" stroke-width="2"/><text x="140" y="166" text-anchor="middle" fill="#C8FCE8" font-size="11">双路径叠加记忆</text></svg>`;
  }
  if (kind === "mayer") {
    return `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#0A0E11"/><rect x="16" y="16" width="152" height="148" fill="#123FDF"/><polygon points="34,164 92,76 154,164" fill="#0E1216"/><circle cx="102" cy="70" r="26" fill="#EFE8DB"/><line x1="150" y1="74" x2="178" y2="74" stroke="#FF9248" stroke-width="2"/><rect x="178" y="42" width="86" height="96" fill="#161D24" stroke="#36D89E"/><text x="188" y="66" fill="#F4EFE6" font-size="11.5" font-weight="700">紧邻短注</text><text x="188" y="88" fill="#B8C0C8" font-size="10">• 空间邻近</text><text x="188" y="106" fill="#B8C0C8" font-size="10">• 删无关装饰</text><text x="188" y="124" fill="#B8C0C8" font-size="10">• 不搬讲稿</text></svg>`;
  }
  if (kind === "alley") {
    return `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#0A0E11"/><rect x="16" y="14" width="248" height="32" fill="#161D24" stroke="#ED7D21"/><text x="26" y="34" fill="#F4EFE6" font-size="12" font-weight="700">断言标题：完整一句核心结论</text><rect x="16" y="56" width="248" height="108" fill="#123FDF"/><circle cx="152" cy="100" r="30" fill="#EFE8DB"/><polygon points="74,164 152,106 232,164" fill="#0E1216"/><rect x="172" y="76" width="22" height="22" fill="#F35512"/><text x="28" y="76" fill="#F8F4EC" font-size="10.5">视觉证据取代项目符号</text></svg>`;
  }
  return `<svg viewBox="0 0 280 180"><rect width="280" height="180" fill="#0A0E11"/><rect x="14" y="14" width="252" height="104" fill="#123FDF"/><circle cx="156" cy="58" r="32" fill="#EFE8DB"/><polygon points="62,118 156,64 242,118" fill="#0E1216"/><rect x="174" y="36" width="24" height="22" fill="#F35512"/><path d="M20,138 L20,128 L30,128 M250,164 L260,164 L260,154" fill="none" stroke="#ED7D21" stroke-width="1.8"/><text x="32" y="145" fill="#F8F4EC" font-size="12.5" font-weight="800">Picture with Caption</text><text x="32" y="162" fill="#B8C0C8" font-size="10">现代九大标准幻灯片版式之一</text></svg>`;
}

function renderTimeline04() {
  eraRailEl.innerHTML = "";
  TIMELINE_04.forEach((era, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.role = "tab";
    btn.className = `era-btn${idx === activeEra ? " is-active" : ""}`;
    btn.setAttribute("aria-selected", String(idx === activeEra));
    btn.dataset.eraIdx = String(idx);
    btn.innerHTML = `<span class="era-btn-year">${era.year}</span><span class="era-btn-sub">${era.short}</span>`;
    btn.addEventListener("click", () => {
      activeEra = idx;
      renderTimeline04();
    });
    eraRailEl.appendChild(btn);
  });

  const cur = TIMELINE_04[activeEra];
  $("#era-year").textContent = cur.year;
  $("#era-person").textContent = cur.person;
  $("#era-work").textContent = cur.work;
  $("#era-fact").textContent = cur.fact;
  $("#era-lesson-text").textContent = cur.slideLesson;
  $("#era-specimen").innerHTML = eraSpecimenSVG(cur.specimen);
}

// ==================== 6. 05 节 · 什么时候别用分诊面板 ====================
let activeTriage = TRIAGE_05[0].id;
const triageMenuEl = $("#triage-menu");
const triageDetailEl = $("#triage-detail");

function renderTriage05() {
  triageMenuEl.innerHTML = "";
  for (const item of TRIAGE_05) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.role = "tab";
    btn.className = `triage-btn${item.id === activeTriage ? " is-active" : ""}`;
    btn.setAttribute("aria-selected", String(item.id === activeTriage));
    btn.dataset.triageId = item.id;
    btn.textContent = item.tab;
    btn.addEventListener("click", () => {
      activeTriage = item.id;
      renderTriage05();
    });
    triageMenuEl.appendChild(btn);
  }

  const cur = TRIAGE_05.find((t) => t.id === activeTriage) || TRIAGE_05[0];
  triageDetailEl.innerHTML = `
    <span class="triage-verdict">不建议用 343</span>
    <h3>${cur.verdict}</h3>
    <p class="triage-why">${cur.whyNot}</p>
    <div class="triage-links">
      ${cur.switchTo
        .map(
          (s) => `
          <a class="sibling-jump" href="https://layout.xiaoxiaodong.ai/${s.id}/play/" target="_blank" rel="noopener">
            <strong>改用：${s.name} ↗</strong>
            <span>${s.desc}</span>
          </a>`
        )
        .join("")}
    </div>
  `;
}

// ==================== 7. 06 节 · 单变量四选一盲测 ====================
let pickedQuiz = null;
const quizGridEl = $("#quiz-grid");
const quizFeedbackEl = $("#quiz-feedback");
$("#quiz-prompt").textContent = QUIZ_06.prompt;

function quizSlideSVG(opt) {
  // 四个选项主图 100% 相同（北向采光剖面），唯一变量是下方标题与图注文字关系
  const titleEl = opt.title
    ? `<text x="16" y="130" fill="#F8F4EC" font-size="11.5" font-weight="800">${opt.title}</text>`
    : `<rect x="16" y="122" width="188" height="44" fill="none" stroke="#36404A" stroke-dasharray="4 3" /><text x="110" y="148" text-anchor="middle" fill="#8C96A0" font-size="10">（无标题与图注）</text>`;

  let bodyEl = "";
  if (opt.mode === "overload") {
    bodyEl = `
      <text x="16" y="144" fill="#B8C0C8" font-size="7.8">本项目依据建筑采光设计标准第 4.2 条对主展厅</text>
      <text x="16" y="154" fill="#B8C0C8" font-size="7.8">屋面进行整体改造，冬季采光系数维持在 2.4%</text>
      <text x="16" y="164" fill="#B8C0C8" font-size="7.8">以上，结合保温层、防水坡度、钢桁架跨度与</text>
      <text x="16" y="174" fill="#B8C0C8" font-size="7.8">室内恒温恒湿新风管路排布方案综合优化实施。</text>
    `;
  } else if (opt.body) {
    const line1 = opt.body.slice(0, 21);
    const line2 = opt.body.slice(21, 42);
    bodyEl = `
      <text x="16" y="147" fill="#C4C9CE" font-size="8.8">${line1}</text>
      <text x="16" y="161" fill="#C4C9CE" font-size="8.8">${line2}</text>
    `;
  }

  return `
    <svg class="quiz-svg" viewBox="0 0 220 184" aria-hidden="true">
      <rect width="220" height="184" fill="#0A0E11" />
      <rect x="8" y="8" width="204" height="102" fill="#123FDF" />
      <circle cx="128" cy="54" r="30" fill="#EFE8DB" />
      <polygon points="34,110 126,60 198,110" fill="#0E1216" />
      <rect x="142" y="34" width="22" height="18" fill="#F35512" />
      <line x1="24" y1="98" x2="82" y2="66" stroke="#FFFFFF" stroke-width="2" />
      <polygon points="88,63 77,64 81,71" fill="#FFFFFF" />
      <path d="M10,126 L10,117 L19,117 M201,176 L210,176 L210,167" fill="none" stroke="#ED7D21" stroke-width="1.4" />
      ${titleEl}
      ${bodyEl}
    </svg>
  `;
}

function renderQuiz06() {
  quizGridEl.innerHTML = "";
  for (const opt of QUIZ_06.options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.dataset.quizKey = opt.key;
    let mark = "点击选择";
    if (pickedQuiz) {
      if (pickedQuiz === opt.key) {
        btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-err");
        mark = opt.correct ? "✓ 已选 · 正确" : "× 已选";
      } else if (opt.correct) {
        btn.classList.add("is-reveal-ok");
        mark = "✓ 最佳方案";
      } else {
        mark = "对比方案";
      }
    }
    btn.innerHTML = `
      <div class="quiz-card-top">
        <span class="quiz-label">方案 ${opt.key}</span>
        <span class="quiz-mark">${mark}</span>
      </div>
      ${quizSlideSVG(opt)}
    `;
    btn.addEventListener("click", () => {
      pickedQuiz = opt.key;
      renderQuiz06();
    });
    quizGridEl.appendChild(btn);
  }

  if (!pickedQuiz) {
    quizFeedbackEl.className = "quiz-feedback";
    quizFeedbackEl.innerHTML = `<p class="quiz-placeholder">点选上面四页里的任意一页，看单变量对照拆解。</p>`;
    return;
  }

  const chosen = QUIZ_06.options.find((o) => o.key === pickedQuiz);
  quizFeedbackEl.className = `quiz-feedback ${chosen.correct ? "is-ok" : "is-err"}`;
  quizFeedbackEl.innerHTML = `
    <div class="quiz-fb-head">
      <h3 class="quiz-fb-title">${chosen.correct ? `答对了：方案 ${chosen.key} 兼顾了主图、观点锚定与精炼图注` : `你选了方案 ${chosen.key}（最佳为方案 B）`}</h3>
      <button type="button" class="btn-ghost" id="btn-quiz-reset">重选对比</button>
    </div>
    <p class="quiz-fb-body">${chosen.feedback}</p>
  `;
  $("#btn-quiz-reset").addEventListener("click", () => {
    pickedQuiz = null;
    renderQuiz06();
  });
}

// ==================== 8. 07 节 · 同小类索引 & 原海报灯箱 ====================
const siblingListEl = $("#sibling-list");
siblingListEl.innerHTML = SIBLINGS.map((s) =>
  s.current
    ? `<li class="sib-item-current"><div class="sib-current"><span class="sib-id">${s.id}</span><span class="sib-name">${s.title}</span><span class="sib-note">${s.note}</span></div></li>`
    : `<li><a href="https://layout.xiaoxiaodong.ai/${s.id}/play/" target="_blank" rel="noopener"><span class="sib-id">${s.id}</span><span class="sib-name">${s.title}</span><span class="sib-note">${s.note}</span></a></li>`
).join("");

const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  $("#btn-open-lightbox").focus();
}

$("#btn-open-lightbox").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.3, 0.8, 4);
  applyLightboxTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.3, 0.8, 4);
  applyLightboxTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLightboxTransform();
});

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 0.8, 4);
    applyLightboxTransform();
  },
  { passive: false }
);

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  lbStage.style.cursor = "grabbing";
  try {
    lbStage.setPointerCapture(e.pointerId);
  } catch {}
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLightboxTransform();
});

lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
  lbStage.style.cursor = "grab";
});

// ==================== 初始渲染 ====================
syncHeroUI();
renderLayers01();
renderAnchor02();
syncRoomUI();
renderTimeline04();
renderTriage05();
renderQuiz06();
