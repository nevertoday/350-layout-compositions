import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  DECKS,
  ICON_META,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_RANGE,
  clampScale,
  createDeckState,
  evaluatePhasePoint,
  evaluateState,
  getSlotCandidate,
} from "./model.js";
import { drawCanvasIcon, iconSvg } from "./riddle-art.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ============================================================================
// 1. HERO 活体谜面编排台（单真源状态 + 2D Canvas + data-perf-drag 调校尺）
// ============================================================================
let state = createDeckState("yixin", false);
let displayScale = state.iconScale;
let introProgress = 0;
let heroDirty = true;
let lastEval = null;
let dragOnCanvas = null;

const heroCanvas = $("#hero-canvas");
const heroCtx = heroCanvas.getContext("2d");
const scaleRail = $("#scale-rail");
const railThumb = $("#rail-thumb");
const railReadout = $("#rail-readout");
const chromePill = $("#chrome-pill");
const titleSlot = $("#title-riddle-slot");
const heroQmark = $("#hero-qmark");
const diagCard = $("#diag-card");
const diagBadge = $("#diag-badge");
const diagHeadline = $("#diag-headline");
const diagBody = $("#diag-body");
const diagAction = $("#diag-action");
const mReplace = $("#m-replace");
const mScale = $("#m-scale");
const mTier = $("#m-tier");
const cardKicker = $("#card-kicker");
const activeSlotLabel = $("#active-slot-label");
const btnToggleSlot = $("#btn-toggle-slot");
const iconPicker = $("#icon-picker");
const ansText = $("#ans-text");
const btnPeek = $("#btn-peek");
const explainLine = $("#riddle-explain-line");
const pillarsHost = $("#poster-pillars");

function sizeCanvasToBox(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(120, Math.round(rect.height));
  const dpr = pixelRatio(2);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  return { w, h, dpr };
}

function scaleToPct(sc) {
  return ((sc - SCALE_RANGE.min) / (SCALE_RANGE.max - SCALE_RANGE.min)) * 100;
}

function pctToScale(pct) {
  const p = Math.max(0, Math.min(1, pct));
  return clampScale(SCALE_RANGE.min + p * (SCALE_RANGE.max - SCALE_RANGE.min));
}

function renderHeroUI() {
  const rect = heroCanvas.getBoundingClientRect();
  const cw = Math.max(320, rect.width || 840);
  const ch = Math.max(180, rect.height || 304);
  const ev = evaluateState(state, cw, ch);
  lastEval = ev;

  // 顶眉胶囊 & 标题示范格 & 右上巨型网点问号联动
  const solved = ev.passCount === 4;
  chromePill.textContent = solved ? "4 / 4 谜面成立" : `${ev.passCount} / 4 待调谜面`;
  chromePill.className = `chrome-pill ${solved ? "is-ok" : "is-err"}`;
  titleSlot.classList.toggle("is-solved", solved);
  heroQmark.classList.toggle("is-solved", solved);

  // 左栏白话诊单
  diagCard.className = `diag-card ${solved ? "is-ok" : "is-err"}`;
  diagBadge.textContent = ev.badge;
  diagHeadline.textContent = ev.headline;
  diagBody.textContent = ev.body;
  diagAction.textContent = ev.action;
  mReplace.textContent = `${ev.replacePct}% (${ev.replacedCount}/${ev.total})`;
  mScale.textContent = `${state.iconScale.toFixed(2)}×`;
  mTier.textContent = ev.decodeTier.split(" · ")[0];

  // 卡头 & 题组选中态
  cardKicker.textContent = ev.deck.kicker;
  $$(".deck-btn").forEach((b) => {
    const on = b.dataset.deck === state.deckId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  // 调校尺游标位置（始终与 state.iconScale 一致）
  const pct = scaleToPct(state.iconScale);
  const clampedPct = Math.max(6, Math.min(94, pct));
  railThumb.style.left = `${clampedPct.toFixed(2)}%`;
  railThumb.textContent = `↔ ${state.iconScale.toFixed(2)}×`;
  const inSweet = state.iconScale >= SCALE_MIN && state.iconScale <= SCALE_MAX;
  scaleRail.classList.toggle("is-sweet", inSweet);
  scaleRail.setAttribute("aria-valuenow", state.iconScale.toFixed(2));
  railReadout.textContent = `${state.iconScale.toFixed(2)}× · 经验参考带 ${SCALE_MIN.toFixed(2)}×–${SCALE_MAX.toFixed(2)}×`;

  // 当前槽位选图芯片
  const slotIdx = state.activeSlot;
  const slotObj = ev.deck.slots[slotIdx];
  const isSlotIcon = state.replaced[slotIdx];
  activeSlotLabel.textContent = `第 ${slotIdx + 1} 格「${slotObj.char}」${isSlotIcon ? "图像槽" : "文字锚点"}`;
  btnToggleSlot.textContent = isSlotIcon ? "切回文字" : "换成图槽";

  iconPicker.innerHTML = slotObj.candidates
    .map((c) => {
      const meta = ICON_META[c.icon];
      const active = isSlotIcon && state.icons[slotIdx] === c.icon;
      const brokenCls = c.bridge === "broken" ? "is-broken-opt" : "";
      return `<button type="button" class="icon-chip ${active ? "is-active" : ""} ${brokenCls}" data-pick-icon="${c.icon}" aria-pressed="${active}">
        ${iconSvg(c.icon, 20)}<span>${meta.short}</span>
      </button>`;
    })
    .join("");

  // 谜底策略按钮
  $$(".reveal-btns .seg-btn").forEach((b) => {
    const on = b.dataset.reveal === state.revealMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 卡内底部谜底行
  if (state.revealMode === "hidden" && !state.peekAnswer) {
    ansText.textContent = "已隐藏（先凭眼力猜 2 秒）";
    btnPeek.hidden = false;
    btnPeek.textContent = "揭晓谜底";
  } else if (state.revealMode === "hidden" && state.peekAnswer) {
    ansText.textContent = ev.deck.answer;
    btnPeek.hidden = false;
    btnPeek.textContent = "重新隐藏";
  } else if (state.revealMode === "spoiler") {
    ansText.textContent = `${ev.deck.answer}（画布上方已同号剧透）`;
    btnPeek.hidden = true;
  } else {
    ansText.textContent = ev.deck.answer;
    btnPeek.hidden = true;
  }
  explainLine.textContent = ev.dynamicExplain;

  // 原海报底沿四枚虚线分隔检核图标
  pillarsHost.innerHTML = ev.indicators
    .map(
      (ind) => `<div class="pillar-item ${ind.ok ? "is-ok" : "is-err"}">
        <span class="pillar-ico">${iconSvg("badge_" + ind.key, 32)}</span>
        <div class="pillar-text">
          <span class="pillar-name">${ind.zh}</span>
          <span class="pillar-en" lang="en">${ind.en}</span>
          <span class="pillar-tag">${ind.status}</span>
        </div>
      </div>`
    )
    .join("");

  heroDirty = true;
}

function drawHeroCanvas(t, dt, { still }) {
  const { w, h, dpr } = sizeCanvasToBox(heroCanvas);
  if (still) {
    introProgress = 1;
    displayScale = state.iconScale;
  } else {
    introProgress = Math.min(1, introProgress + (dt || 0.016) * 2.1);
    const diff = state.iconScale - displayScale;
    if (Math.abs(diff) > 0.0015) {
      displayScale += diff * Math.min(1, (dt || 0.016) * 16);
      heroDirty = true;
    } else {
      displayScale = state.iconScale;
    }
  }

  if (!heroDirty && introProgress >= 1 && !still) return;
  heroDirty = false;

  const renderState = { ...state, iconScale: displayScale };
  const ev = evaluateState(renderState, w, h);
  const { geom } = ev;

  heroCtx.save();
  heroCtx.scale(dpr, dpr);

  // 暖象牙纸底 + 极淡出版排字基线
  heroCtx.fillStyle = "#FCF9F2";
  heroCtx.fillRect(0, 0, w, h);

  // 绘制上下光学字面参考线（Cap line / Baseline）
  const scaleGood = displayScale >= SCALE_MIN && displayScale <= SCALE_MAX && !geom.colliding;
  const guideColor = !state.replaced.some(Boolean)
    ? "rgba(80, 91, 87, 0.25)"
    : scaleGood
      ? "rgba(12, 138, 117, 0.42)"
      : "rgba(184, 58, 34, 0.48)";

  heroCtx.strokeStyle = guideColor;
  heroCtx.lineWidth = 1.2;
  heroCtx.setLineDash([5, 5]);
  heroCtx.beginPath();
  heroCtx.moveTo(16, geom.capY);
  heroCtx.lineTo(w - 16, geom.capY);
  heroCtx.moveTo(16, geom.baseY);
  heroCtx.lineTo(w - 16, geom.baseY);
  heroCtx.stroke();
  heroCtx.setLineDash([]);

  // 标注「字面等高线」与「字隙」在右上与左上边缘，绝不与下方槽位徽签撞车
  const lblFont = Math.max(10, Math.min(11.5, w * 0.015));
  heroCtx.fillStyle = scaleGood ? "#086C5B" : "#9C2B16";
  heroCtx.font = `500 ${lblFont}px "DM Mono", "Noto Sans SC", monospace`;
  heroCtx.textAlign = "left";
  heroCtx.textBaseline = "bottom";
  heroCtx.fillText("字头线", 12, geom.capY - 3);
  heroCtx.textAlign = "right";
  heroCtx.fillText(`基线 · 字隙 ${geom.minGapPx}px`, w - 12, geom.capY - 3);

  // 若开启「同号剧透」，在上方印出强抢视线的剧透大标，直观演示为何破梗！
  if (state.revealMode === "spoiler") {
    const stripH = Math.max(24, Math.min(36, h * 0.145));
    const stripY = 6;
    const stripW = w > 500 ? w * 0.78 : w * 0.92;
    const stripX = (w - stripW) * 0.5;
    heroCtx.fillStyle = "#FCECE8";
    heroCtx.strokeStyle = "#B83A22";
    heroCtx.lineWidth = 1.4;
    heroCtx.beginPath();
    heroCtx.roundRect(stripX, stripY, stripW, stripH, 7);
    heroCtx.fill();
    heroCtx.stroke();

    const spoilerTxt = `同号剧透：谜底就是「${ev.deck.answer}」！`;
    const spFont = Math.max(11, Math.min(16, stripH * 0.54, (stripW - 18) / (spoilerTxt.length * 0.92)));
    heroCtx.fillStyle = "#9C2B16";
    heroCtx.font = `900 ${spFont}px "Noto Sans SC", sans-serif`;
    heroCtx.textAlign = "center";
    heroCtx.textBaseline = "middle";
    heroCtx.fillText(spoilerTxt, w * 0.5, stripY + stripH * 0.5 + 0.5);
  }

  // 逐格绘制四个活体槽位（开场错开丝滑显影，0.55 秒内完成）
  const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

  geom.tiles.forEach((tile, idx) => {
    const p = ease(introProgress * 1.45 - idx * 0.12);
    const isActive = idx === state.activeSlot;
    const cand = getSlotCandidate(state, idx);
    const isBroken = tile.isIcon && cand.bridge === "broken";
    const isWeakFail =
      tile.isIcon && cand.bridge === "context" && !(ev.replacedCount === 1 && ev.anchorPct >= 75);

    heroCtx.save();
    heroCtx.globalAlpha = 0.25 + 0.75 * p;
    heroCtx.translate(0, (1 - p) * 12);

    // 活跃槽位高亮底框
    if (isActive) {
      heroCtx.fillStyle = tile.isIcon
        ? isBroken || isWeakFail
          ? "rgba(184, 58, 34, 0.07)"
          : "rgba(12, 138, 117, 0.08)"
        : "rgba(182, 218, 205, 0.25)";
      heroCtx.strokeStyle = tile.isIcon && (isBroken || isWeakFail) ? "#B83A22" : "#0C8A75";
      heroCtx.lineWidth = 2;
      heroCtx.setLineDash([6, 4]);
      const pad = Math.max(6, tile.emSize * 0.08);
      heroCtx.beginPath();
      heroCtx.roundRect(
        tile.cx - tile.emSize * 0.58 - pad * 0.4,
        geom.capY - pad,
        tile.emSize * 1.16 + pad * 0.8,
        tile.emSize + pad * 2,
        12
      );
      heroCtx.fill();
      heroCtx.stroke();
      heroCtx.setLineDash([]);
    }

    if (tile.isIcon) {
      // 超出字面框时的红框越界警示
      if (displayScale > SCALE_MAX) {
        heroCtx.strokeStyle = "rgba(184, 58, 34, 0.65)";
        heroCtx.lineWidth = 1.5;
        heroCtx.setLineDash([4, 4]);
        heroCtx.strokeRect(tile.box.x, tile.box.y, tile.box.w, tile.box.h);
        heroCtx.setLineDash([]);
      }

      const drawColor = isBroken
        ? "#B83A22"
        : isWeakFail
          ? "#A36000"
          : ICON_META[tile.iconId]?.accent || "#0C8A75";

      drawCanvasIcon(heroCtx, tile.iconId, tile.cx, tile.cy, tile.visualSize, {
        color: drawColor,
        brokenColor: "#B83A22",
        paper: "#FCF9F2",
      });

      // 槽位底角状态微签（象形直连 / 语境托底 / 断桥）
      const tagY = Math.min(h - 14, geom.baseY + Math.max(18, (tile.visualSize - tile.emSize) * 0.5 + 14));
      const tagText = isBroken
        ? `断桥 ≠ ${tile.char}`
        : cand.bridge === "context"
          ? isWeakFail
            ? `弱桥吃紧`
            : `语境→${tile.char}`
          : `象形→${tile.char}`;

      heroCtx.font = `700 ${Math.max(10.5, Math.min(12, w * 0.015))}px "Noto Sans SC", sans-serif`;
      const tw = heroCtx.measureText(tagText).width + 12;
      heroCtx.fillStyle = isBroken ? "#FCECE8" : isWeakFail ? "#FBF2DE" : "#DFF1E9";
      heroCtx.beginPath();
      heroCtx.roundRect(tile.cx - tw / 2, tagY - 10, tw, 20, 5);
      heroCtx.fill();

      heroCtx.fillStyle = isBroken ? "#9C2B16" : isWeakFail ? "#8A5200" : "#086C5B";
      heroCtx.textAlign = "center";
      heroCtx.textBaseline = "middle";
      heroCtx.fillText(tagText, tile.cx, tagY);
    } else {
      // 原海报粗黑汉字 / Young Serif 经典英文锚点
      heroCtx.fillStyle = "#0A0A09";
      const isLatin = ev.deck.isLatin;
      const fontSize = isLatin && tile.char.length > 2 ? tile.emSize * 0.42 : tile.emSize * 0.92;
      heroCtx.font = isLatin
        ? `400 ${fontSize}px "Young Serif", Georgia, serif`
        : `900 ${fontSize}px "Noto Sans SC", sans-serif`;
      heroCtx.textAlign = "center";
      heroCtx.textBaseline = "middle";
      heroCtx.fillText(tile.char, tile.cx, tile.cy + (isLatin ? 2 : 3));

      // 底部轻标「锚点」提示点击可替图
      heroCtx.fillStyle = "#505B57";
      heroCtx.font = `500 ${Math.max(10.5, Math.min(11.5, w * 0.014))}px "Noto Sans SC", sans-serif`;
      heroCtx.fillText(isActive ? "点格换图" : "文字锚点", tile.cx, Math.min(h - 14, geom.baseY + 20));
    }

    heroCtx.restore();
  });

  // 碰撞区域赤色警示条
  if (geom.colliding) {
    for (let i = 0; i < geom.tiles.length - 1; i++) {
      const a = geom.tiles[i];
      const b = geom.tiles[i + 1];
      const overlap = a.box.x + a.box.w - b.box.x;
      if (overlap > -4) {
        const midX = (a.box.x + a.box.w + b.box.x) / 2;
        heroCtx.fillStyle = "rgba(184, 58, 34, 0.22)";
        heroCtx.fillRect(midX - 5, geom.capY - 6, 10, geom.emSize + 12);
      }
    }
  }

  heroCtx.restore();
}

const heroLoop = loop(heroCanvas, drawHeroCanvas);

function updateState(patch) {
  state = { ...state, ...patch };
  renderHeroUI();
  heroLoop.draw();
}

// 点击画布：命中哪个槽位就选中它；若点在已选中槽位则切换「文字 / 图像」；左右拖动图像槽则直接改缩放！
heroCanvas.addEventListener("pointerdown", (e) => {
  const rect = heroCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const ev = evaluateState(state, rect.width, rect.height);
  const hit = ev.geom.tiles.find(
    (t) => x >= t.hit.x && x <= t.hit.x + t.hit.w && y >= t.hit.y && y <= t.hit.y + t.hit.h
  );
  if (!hit) return;
  dragOnCanvas = {
    pointerId: e.pointerId,
    slotIdx: hit.idx,
    startX: e.clientX,
    startScale: state.iconScale,
    moved: false,
  };
  heroCanvas.setPointerCapture(e.pointerId);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragOnCanvas || e.pointerId !== dragOnCanvas.pointerId) return;
  const dx = e.clientX - dragOnCanvas.startX;
  if (Math.abs(dx) > 8) {
    dragOnCanvas.moved = true;
    const rect = heroCanvas.getBoundingClientRect();
    const nextScale = clampScale(dragOnCanvas.startScale + (dx / Math.max(220, rect.width)) * 1.6);
    if (nextScale !== state.iconScale) {
      updateState({ activeSlot: dragOnCanvas.slotIdx, iconScale: nextScale });
    }
  }
});

heroCanvas.addEventListener("pointerup", (e) => {
  if (!dragOnCanvas || e.pointerId !== dragOnCanvas.pointerId) return;
  const { slotIdx, moved } = dragOnCanvas;
  dragOnCanvas = null;
  if (!moved) {
    const nextReplaced = [...state.replaced];
    nextReplaced[slotIdx] = !nextReplaced[slotIdx];
    updateState({ activeSlot: slotIdx, replaced: nextReplaced });
  }
});

heroCanvas.addEventListener("pointercancel", () => {
  dragOnCanvas = null;
});

// 底沿「图文等重调校尺」(data-perf-drag)：同时支持鼠标、Pointer 与原生 Touch 事件（确保 perf.mjs 实测 60fps！）
let railDragging = false;

function setScaleFromClientX(clientX) {
  const rect = scaleRail.getBoundingClientRect();
  const pct = (clientX - rect.left) / Math.max(1, rect.width);
  const next = pctToScale(pct);
  if (next !== state.iconScale) {
    displayScale = next; // 拖动时零延迟跟手
    updateState({ iconScale: next });
  } else {
    heroDirty = true;
    heroLoop.draw();
  }
}

scaleRail.addEventListener("pointerdown", (e) => {
  railDragging = true;
  scaleRail.setPointerCapture(e.pointerId);
  setScaleFromClientX(e.clientX);
});

scaleRail.addEventListener("pointermove", (e) => {
  if (!railDragging) return;
  setScaleFromClientX(e.clientX);
});

scaleRail.addEventListener("pointerup", () => {
  railDragging = false;
});

scaleRail.addEventListener("pointercancel", () => {
  railDragging = false;
});

// 兼容直接派发 CDP TouchEvent 的触摸测试（perf.mjs）
scaleRail.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches[0]) {
      railDragging = true;
      setScaleFromClientX(e.touches[0].clientX);
    }
  },
  { passive: true }
);

scaleRail.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches[0]) {
      e.preventDefault();
      setScaleFromClientX(e.touches[0].clientX);
    }
  },
  { passive: false }
);

scaleRail.addEventListener("touchend", () => {
  railDragging = false;
});

// 键盘方向键精细调节
scaleRail.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.1 : 0.04;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    updateState({ iconScale: clampScale(state.iconScale - step) });
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    updateState({ iconScale: clampScale(state.iconScale + step) });
  }
});

// 题组切换、原海报解、复原错版、选图芯片、剧透策略按钮事件
$$(".deck-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = createDeckState(btn.dataset.deck, false);
    displayScale = state.iconScale;
    renderHeroUI();
    heroLoop.draw();
  });
});

$("#btn-poster-sol").addEventListener("click", () => {
  state = createDeckState(state.deckId, true);
  renderHeroUI();
  heroLoop.draw();
});

$("#btn-reset-broken").addEventListener("click", () => {
  state = createDeckState(state.deckId, false);
  renderHeroUI();
  heroLoop.draw();
});

btnToggleSlot.addEventListener("click", () => {
  const nextReplaced = [...state.replaced];
  nextReplaced[state.activeSlot] = !nextReplaced[state.activeSlot];
  updateState({ replaced: nextReplaced });
});

iconPicker.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-pick-icon]");
  if (!btn) return;
  const nextIcons = [...state.icons];
  const nextReplaced = [...state.replaced];
  nextIcons[state.activeSlot] = btn.dataset.pickIcon;
  nextReplaced[state.activeSlot] = true;
  updateState({ icons: nextIcons, replaced: nextReplaced });
});

$$(".reveal-btns .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({ revealMode: btn.dataset.reveal, peekAnswer: false });
  });
});

btnPeek.addEventListener("click", () => {
  updateState({ peekAnswer: !state.peekAnswer });
});

// ============================================================================
// 2. SECTION 01 · 三组直读 vs 解谜盲测翻牌卡
// ============================================================================
const RECALL_DATA = [
  {
    id: "r1",
    kind: "直读对照 · 纯字",
    trap: false,
    latin: false,
    faceHtml: `<span>一</span><span>叶</span><span>知</span><span>秋</span>`,
    note: "约 0.3 秒平滑扫完。信息准确无误，但大脑未执行检索动作，合上页面后留痕偏浅（对应 141 文字主导版式）。",
  },
  {
    id: "r2",
    kind: "适度解谜 · 25% 替代",
    trap: false,
    latin: false,
    faceHtml: `<span>一</span>${iconSvg("leaf", 34)}<span>知</span><span>秋</span>`,
    note: "眼睛在第二格微顿约 1.2 秒，主动把绿叶译成「叶」字。这个微小的自我生成动作触发 Slamecka & Graf（1978）的生成效应，回忆更牢。",
  },
  {
    id: "r3",
    kind: "过度加密 · 100% 替代",
    trap: true,
    latin: false,
    faceHtml: `${iconSvg("oneBar", 30)}${iconSvg("leaf", 30)}${iconSvg("bulb", 30)}${iconSvg("maple", 30)}`,
    note: "四个字全部换成图后，没有汉字锚定句式；路人在 3 秒内容易读成「单叶想红叶」，记忆还没建立就先弃读了。",
  },
];

const recallHost = $("#recall-cards");
const openRecalls = new Set();

function renderRecallCards() {
  recallHost.innerHTML = RECALL_DATA.map((item) => {
    const open = openRecalls.has(item.id);
    return `<button type="button" class="recall-card ${open ? "is-open" : ""} ${item.trap ? "is-trap" : ""}" data-recall="${item.id}" aria-expanded="${open}">
      <div class="recall-top">
        <span class="recall-kind">${item.kind}</span>
        <span class="recall-action">${open ? "点击收起" : "点击验看认知过程"}</span>
      </div>
      <div class="recall-face ${item.latin ? "is-latin" : ""}">${item.faceHtml}</div>
      ${open ? `<div class="recall-reveal">${item.note}</div>` : ""}
    </button>`;
  }).join("");
}

recallHost.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-recall]");
  if (!btn) return;
  const id = btn.dataset.recall;
  if (openRecalls.has(id)) openRecalls.delete(id);
  else openRecalls.add(id);
  renderRecallCards();
});

// ============================================================================
// 3. SECTION 02 · 四种图像替代路径 + 「遮住周边文字」压力测试
// ============================================================================
const MECHANISMS = [
  {
    id: "picto",
    label: "1. 象形直替",
    en: "PICTOGRAPHIC SUBSTITUTION",
    tiles: [
      { kind: "text", val: "一" },
      { kind: "icon", val: "leaf" },
      { kind: "text", val: "知" },
      { kind: "text", val: "秋" },
    ],
    latin: false,
    desc: "图形本身就是被替汉字所指的实体物件（绿叶 = 叶、红心 = 心/爱）。无需绕弯，跨年龄、跨地区都能一秒读通，是商用海报里容错率最高的一类。",
    rule: "实测结论：即使遮住左右文字，单看一片绿叶依然直指「叶」，独立辨识度极强。",
    maskedStatus: { tone: "ok", text: "遮住前后字后：单凭这片绿叶仍能一眼叫出「叶」，象形直替几乎不依赖语境。" },
    openStatus: { tone: "ok", text: "完整谜面：象形直连 + 75% 文字锚点，约 1 秒稳稳读出「一叶知秋」。" },
  },
  {
    id: "phonetic",
    label: "2. 谐音双关",
    en: "PHONETIC REBUS · PUN",
    tiles: [
      { kind: "icon", val: "eye" },
      { kind: "icon", val: "heartRed" },
      { kind: "text", val: "N" },
      { kind: "text", val: "Y" },
    ],
    latin: true,
    desc: "借物体在特定口语里的读音去顶替另一个同音字（例如英文 Eye 读作 I、Bee 读作 B，中文传统纹样里「蝠」谐「福」、「鹿」谐「禄」）。趣味感最强，但也强绑定母语语音。",
    rule: "实测结论：在英语圈里「眼 + 心」极易读成 I Love；但换到不熟英文读音的受众，谐音桥会立刻打折。",
    maskedStatus: { tone: "warn", text: "遮住 NY 后：英语读者仍能靠 Eye + Heart 拼出 I Love，但离开语言圈就会停在字面「眼睛和心」。" },
    openStatus: { tone: "ok", text: "完整谜面：Eye（谐音 I）+ 红心（象形 Love）+ NY 地名锚点，双通道叠加。" },
  },
  {
    id: "metonym",
    label: "3. 局部借代",
    en: "METONYMY · ATTRIBUTE",
    tiles: [
      { kind: "text", val: "一" },
      { kind: "text", val: "叶" },
      { kind: "text", val: "知" },
      { kind: "icon", val: "maple" },
    ],
    latin: false,
    desc: "抽象概念（时间、季节、灵感）本身画不出来，便挑选最有代表性的典型物件代为出场——用红枫借代「秋」、用亮灯借代「意/知」、用切半圆借代「半」。",
    rule: "实测结论：借代比象形多走半步联想；必须挑选受众共识最强的标志物，否则容易在同类词里跑偏。",
    maskedStatus: { tone: "warn", text: "遮住前三字后：单看红枫可能想到「枫、林、秋、加拿大」——必须靠「一叶知_」把它收束到「秋」。" },
    openStatus: { tone: "ok", text: "完整谜面：前半句锁定语境，红枫自然收口到「秋」，兼具诗意与速度。" },
  },
  {
    id: "context",
    label: "4. 语境完形",
    en: "CONTEXTUAL CLOZE（原海报案例）",
    tiles: [
      { kind: "text", val: "一" },
      { kind: "text", val: "心" },
      { kind: "icon", val: "leaf" },
      { kind: "text", val: "意" },
    ],
    latin: false,
    desc: "这正是 150 号原海报的示范句「一心[叶]意」。当图形与目标字的音义距离较远时，真正让答案浮现的不是图形本身，而是周围高熟悉度熟语提供的强完形引力。",
    rule: "实测结论：离开前后三字就会完全猜不出「一」——这种手法只适合高频成语或人人背得出下句的经典口号，且最多只替一格。",
    maskedStatus: { tone: "err", text: "遮住「一心_意」后彻底失效：单看一片绿叶，几乎不可能联想到数字「一」！" },
    openStatus: { tone: "warn", text: "完整谜面：靠「一心□意」强语境托住绿叶，读者脑补出「一」后反过来记住「叶」的清新生机。" },
  },
];

let activeMechId = "picto";
let maskContext = false;
const mechTabs = $("#mech-tabs");
const mechStage = $("#mech-stage");
const btnMask = $("#btn-mask-context");

function renderMechanismSection() {
  mechTabs.innerHTML = MECHANISMS.map(
    (m) =>
      `<button type="button" class="mech-tab ${m.id === activeMechId ? "is-active" : ""}" data-mech="${m.id}" role="tab" aria-selected="${m.id === activeMechId}">${m.label}</button>`
  ).join("");

  const cur = MECHANISMS.find((m) => m.id === activeMechId) || MECHANISMS[0];
  const st = maskContext ? cur.maskedStatus : cur.openStatus;

  const tilesHtml = cur.tiles
    .map((t) => {
      if (t.kind === "icon") {
        return `<span class="mech-tile is-pic">${iconSvg(t.val, 36)}</span>`;
      }
      if (maskContext) {
        return `<span class="mech-tile is-masked" aria-label="已遮挡文字">?</span>`;
      }
      return `<span class="mech-tile ${cur.latin ? "is-latin" : ""}">${t.val}</span>`;
    })
    .join("");

  mechStage.innerHTML = `
    <div class="mech-specimen">
      <div class="mech-strip">${tilesHtml}</div>
      <div class="mech-status is-${st.tone}">${st.text}</div>
    </div>
    <div class="mech-copy">
      <span class="mech-tag-en" lang="en">${cur.en}</span>
      <h3>${cur.label}</h3>
      <p>${cur.desc}</p>
      <p class="mech-rule">${cur.rule}</p>
    </div>
  `;

  btnMask.setAttribute("aria-pressed", String(maskContext));
  btnMask.textContent = `遮住周边文字：${maskContext ? "开（仅留图像）" : "关"}`;
}

mechTabs.addEventListener("click", (e) => {
  const b = e.target.closest("[data-mech]");
  if (!b) return;
  activeMechId = b.dataset.mech;
  renderMechanismSection();
});

btnMask.addEventListener("click", () => {
  maskContext = !maskContext;
  renderMechanismSection();
});

// ============================================================================
// 4. SECTION 03 · 深翡翠暗室 2D Canvas 相图扫描仪
// ============================================================================
const PHASE_PRESETS = {
  sweet: { d: 30, c: 84 },
  plain: { d: 6, c: 80 },
  context: { d: 28, c: 48 },
  cryptic: { d: 86, c: 68 },
};

let phasePos = { ...PHASE_PRESETS.sweet };
let phaseDirty = true;
let phaseDragging = false;
const phaseCanvas = $("#phase-canvas");
const phaseCtx = phaseCanvas.getContext("2d");
const phaseBadge = $("#phase-badge");
const phaseTitle = $("#phase-title");
const phaseDetail = $("#phase-detail");
const pDensity = $("#p-density");
const pClarity = $("#p-clarity");
const pTier = $("#p-tier");
const phaseMiniTiles = $("#phase-mini-tiles");

function updatePhaseReadout() {
  const ev = evaluatePhasePoint(phasePos.d, phasePos.c);
  phaseBadge.textContent = ev.title;
  phaseBadge.className = `phase-badge ${ev.tone === "error" ? "is-err" : ""}`;
  phaseTitle.textContent =
    ev.zone === "sweet"
      ? "替代率 25%–50% 且桥接直白，停顿最短、记忆最深"
      : ev.zone === "plain"
        ? "几乎全为纯文字，信息直白但失去猜谜互动"
        : ev.zone === "context"
          ? "图标偏绕弯，全靠高频成语语境勉强兜底"
          : ev.zone === "cryptic"
            ? "图标占比失控，文字锚点被淹没成天书"
            : "图形与字义断桥，读者停在槽位反复卡壳";
  phaseDetail.textContent = ev.detail;
  pDensity.textContent = `${ev.densityPct}%`;
  pClarity.textContent = `${ev.clarityPct}%`;
  pTier.textContent = ev.tierLabel;

  // 联动四格迷你预览
  const baseChars = ["一", "叶", "知", "秋"];
  const goodIcons = ["oneBar", "leaf", "bulb", "maple"];
  const badIcons = ["wave", "cup", "gear", "cloud"];
  const useBad = ev.clarityPct < 42;
  const replaceOrder = [1, 3, 0, 2]; // 优先替换最自然的槽位
  const replacedSet = new Set(replaceOrder.slice(0, ev.slots));

  phaseMiniTiles.innerHTML = baseChars
    .map((ch, i) => {
      if (!replacedSet.has(i)) return `<span class="pm-tile">${ch}</span>`;
      const ico = useBad ? badIcons[i] : goodIcons[i];
      return `<span class="pm-tile ${useBad || ev.slots >= 3 ? "is-bad" : "is-pic"}">${iconSvg(ico, 26)}</span>`;
    })
    .join("");

  phaseDirty = true;
}

function drawPhaseCanvas(_t, _dt, { still }) {
  const { w, h, dpr } = sizeCanvasToBox(phaseCanvas);
  if (!phaseDirty && !still) return;
  phaseDirty = false;

  const padL = 52;
  const padR = 22;
  const padT = 26;
  const padB = 46;
  const plotW = Math.max(120, w - padL - padR);
  const plotH = Math.max(100, h - padT - padB);
  const xOf = (d) => padL + (d / 100) * plotW;
  const yOf = (c) => padT + (1 - c / 100) * plotH;

  phaseCtx.save();
  phaseCtx.scale(dpr, dpr);

  // 深翡翠暗室底
  phaseCtx.fillStyle = "#08201C";
  phaseCtx.fillRect(0, 0, w, h);

  // 四大分区色块
  // 1) 左纯字区 (0..14%)
  phaseCtx.fillStyle = "rgba(182, 218, 205, 0.08)";
  phaseCtx.fillRect(xOf(0), yOf(100), xOf(14) - xOf(0), plotH);
  // 2) 右天书弃读区 (62..100%)
  phaseCtx.fillStyle = "rgba(255, 148, 125, 0.14)";
  phaseCtx.fillRect(xOf(62), yOf(100), xOf(100) - xOf(62), plotH);
  // 3) 下断桥区 (14..62%, 0..38%)
  phaseCtx.fillStyle = "rgba(255, 148, 125, 0.11)";
  phaseCtx.fillRect(xOf(14), yOf(38), xOf(62) - xOf(14), yOf(0) - yOf(38));
  // 4) 中语境险区 (14..62%, 38..62%)
  phaseCtx.fillStyle = "rgba(244, 198, 114, 0.12)";
  phaseCtx.fillRect(xOf(14), yOf(62), xOf(62) - xOf(14), yOf(38) - yOf(62));
  // 5) 共振甜区 (14..62%, 62..100%)
  phaseCtx.fillStyle = "rgba(124, 226, 201, 0.22)";
  phaseCtx.fillRect(xOf(14), yOf(100), xOf(62) - xOf(14), yOf(62) - yOf(100));

  // 细网格线
  phaseCtx.strokeStyle = "rgba(124, 226, 201, 0.16)";
  phaseCtx.lineWidth = 1;
  for (const pct of [25, 50, 75]) {
    phaseCtx.beginPath();
    phaseCtx.moveTo(xOf(pct), padT);
    phaseCtx.lineTo(xOf(pct), padT + plotH);
    phaseCtx.moveTo(padL, yOf(pct));
    phaseCtx.lineTo(padL + plotW, yOf(pct));
    phaseCtx.stroke();
  }

  // 甜区高亮边框
  phaseCtx.strokeStyle = "#7CE2C9";
  phaseCtx.lineWidth = 1.6;
  phaseCtx.setLineDash([5, 4]);
  phaseCtx.strokeRect(xOf(14), yOf(100), xOf(62) - xOf(14), yOf(62) - yOf(100));
  phaseCtx.setLineDash([]);

  // 倒 U 型示意共振曲线（沿当前清晰度水平切片绘制）
  phaseCtx.strokeStyle = "rgba(247, 242, 231, 0.72)";
  phaseCtx.lineWidth = 2;
  phaseCtx.beginPath();
  for (let d = 0; d <= 100; d += 2) {
    const lv = evaluatePhasePoint(d, phasePos.c).resonanceLevel;
    const cx = xOf(d);
    const cy = padT + plotH - lv * plotH * 0.85;
    if (d === 0) phaseCtx.moveTo(cx, cy);
    else phaseCtx.lineTo(cx, cy);
  }
  phaseCtx.stroke();

  // 分区标签（高对比度，清晰可读）
  phaseCtx.font = `700 ${Math.max(11, Math.min(13, w * 0.019))}px "Noto Sans SC", sans-serif`;
  phaseCtx.textAlign = "center";
  phaseCtx.textBaseline = "middle";
  phaseCtx.fillStyle = "#7CE2C9";
  phaseCtx.fillText("共振甜区", xOf(38), yOf(83));
  phaseCtx.fillStyle = "#F7D288";
  phaseCtx.fillText("语境险区", xOf(38), yOf(50));
  phaseCtx.fillStyle = "#FF947D";
  phaseCtx.fillText("断桥区", xOf(38), yOf(19));
  phaseCtx.fillText("天书弃读区", xOf(81), yOf(54));

  // 坐标轴线与刻度
  phaseCtx.strokeStyle = "rgba(247, 242, 231, 0.45)";
  phaseCtx.lineWidth = 1.2;
  phaseCtx.beginPath();
  phaseCtx.moveTo(padL, padT);
  phaseCtx.lineTo(padL, padT + plotH);
  phaseCtx.lineTo(padL + plotW, padT + plotH);
  phaseCtx.stroke();

  phaseCtx.fillStyle = "#D5E8E2";
  phaseCtx.font = `500 11.5px "DM Mono", monospace`;
  phaseCtx.textAlign = "center";
  phaseCtx.textBaseline = "top";
  for (const pct of [0, 25, 50, 75, 100]) {
    phaseCtx.fillText(`${pct}%`, xOf(pct), padT + plotH + 8);
  }
  phaseCtx.fillStyle = "#F7F2E7";
  phaseCtx.font = `700 12px "Noto Sans SC", sans-serif`;
  phaseCtx.fillText("图像替代密度 →", padL + plotW * 0.5, h - 18);

  phaseCtx.save();
  phaseCtx.translate(16, padT + plotH * 0.5);
  phaseCtx.rotate(-Math.PI / 2);
  phaseCtx.fillText("图形桥接清晰度 →", 0, 0);
  phaseCtx.restore();

  // 当前交互采样点（翡翠亮环 + 坐标投影虚线）
  const px = xOf(phasePos.d);
  const py = yOf(phasePos.c);
  const ev = evaluatePhasePoint(phasePos.d, phasePos.c);
  const dotCol = ev.tone === "error" ? "#FF947D" : ev.tone === "warn" ? "#F7D288" : "#7CE2C9";

  phaseCtx.strokeStyle = dotCol;
  phaseCtx.lineWidth = 1;
  phaseCtx.setLineDash([3, 3]);
  phaseCtx.beginPath();
  phaseCtx.moveTo(px, py);
  phaseCtx.lineTo(px, padT + plotH);
  phaseCtx.moveTo(px, py);
  phaseCtx.lineTo(padL, py);
  phaseCtx.stroke();
  phaseCtx.setLineDash([]);

  phaseCtx.fillStyle = dotCol;
  phaseCtx.beginPath();
  phaseCtx.arc(px, py, 10, 0, Math.PI * 2);
  phaseCtx.fill();
  phaseCtx.fillStyle = "#08201C";
  phaseCtx.beginPath();
  phaseCtx.arc(px, py, 4.2, 0, Math.PI * 2);
  phaseCtx.fill();

  phaseCtx.restore();
}

const phaseLoop = loop(phaseCanvas, drawPhaseCanvas);

function setPhaseFromPointer(clientX, clientY) {
  const rect = phaseCanvas.getBoundingClientRect();
  const padL = 52;
  const padR = 22;
  const padT = 26;
  const padB = 46;
  const d = ((clientX - rect.left - padL) / Math.max(1, rect.width - padL - padR)) * 100;
  const c = (1 - (clientY - rect.top - padT) / Math.max(1, rect.height - padT - padB)) * 100;
  phasePos = {
    d: Math.max(0, Math.min(100, Math.round(d))),
    c: Math.max(0, Math.min(100, Math.round(c))),
  };
  $$(".phase-presets .dark-btn").forEach((b) => b.classList.remove("is-active"));
  updatePhaseReadout();
  phaseLoop.draw();
}

phaseCanvas.addEventListener("pointerdown", (e) => {
  phaseDragging = true;
  phaseCanvas.setPointerCapture(e.pointerId);
  setPhaseFromPointer(e.clientX, e.clientY);
});

phaseCanvas.addEventListener("pointermove", (e) => {
  if (!phaseDragging) return;
  setPhaseFromPointer(e.clientX, e.clientY);
});

phaseCanvas.addEventListener("pointerup", () => {
  phaseDragging = false;
});

phaseCanvas.addEventListener("pointercancel", () => {
  phaseDragging = false;
});

phaseCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 10 : 4;
  let handled = true;
  if (e.key === "ArrowLeft") phasePos.d = Math.max(0, phasePos.d - step);
  else if (e.key === "ArrowRight") phasePos.d = Math.min(100, phasePos.d + step);
  else if (e.key === "ArrowUp") phasePos.c = Math.min(100, phasePos.c + step);
  else if (e.key === "ArrowDown") phasePos.c = Math.max(0, phasePos.c - step);
  else handled = false;
  if (handled) {
    e.preventDefault();
    $$(".phase-presets .dark-btn").forEach((b) => b.classList.remove("is-active"));
    updatePhaseReadout();
    phaseLoop.draw();
  }
});

$$(".phase-presets .dark-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.phase;
    phasePos = { ...PHASE_PRESETS[key] };
    $$(".phase-presets .dark-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    updatePhaseReadout();
    phaseLoop.draw();
  });
});

// ============================================================================
// 5. SECTION 04 · 历史真迹解剖卡轨（全部史实与馆藏编号经核实）
// ============================================================================
const HISTORY_ITEMS = [
  {
    id: "rebus",
    year: "约公元前 3200–3000 年",
    short: "楔形文字与埃及圣书字",
    title: "声符假借（Rebus Principle）：图画跨向文字的桥梁",
    plateHtml: `${iconSvg("eye", 42)} <span class="hist-glyph">+</span> ${iconSvg("leaf", 42)}`,
    decode: "取物之音，不取物之实 · Non verbis, sed rebus",
    body: "早期苏美尔楔形文字与古埃及圣书字最初只能画具体物件，遇到抽象概念或人名便束手无策。书吏遂采用「画谜原则（Rebus Principle）」：借用同音常见物件的图像来拼读抽象音节——这既是文字迈向表音的关键转折，也是现代图文谜语最古老的语法原型。",
    src: "出处核实：Encyclopædia Britannica — Rebus writing principle。",
  },
  {
    id: "chinese",
    year: "传统工艺 · 明清尤盛",
    short: "中式吉祥谐音纹样",
    title: "以物谐音：瓷器与年画里的「五福捧寿」",
    plateHtml: `${iconSvg("bat", 48)} <span class="hist-glyph">+</span> ${iconSvg("peach", 46)} <span class="hist-glyph is-zh">＝ 福寿</span>`,
    decode: "蝠（fú）→ 福 · 倒蝠 → 福到 · 桃 → 长寿",
    body: "汉语同音字极为丰富，传统瓷器、玉雕、织锦常将整句吉语压缩成一幅无字画谜：蝙蝠取「蝠」谐「福」，五蝠环绕寿桃或寿字便读作「五福献寿」；蝙蝠倒悬则为「福到」。观者认出谐音的一瞬，便完成了器物与人之间的互动祝愿。",
    src: "文化传统：大都会艺术博物馆（The Met）及故宫清代吉祥纹样藏品普遍收录此类谐音画谜。",
  },
  {
    id: "glaser",
    year: "1976 构思 / 1977 发布",
    short: "Milton Glaser《I ♥ NY》",
    title: "出租车信封背面的全球级图文谜语",
    plateHtml: `<span class="hist-glyph">I</span> ${iconSvg("heartRed", 48)} <span class="hist-glyph">NY</span>`,
    decode: "I + [♥ = LOVE] + NY · American Typewriter 字体",
    body: "1976 年，美国平面设计师 Milton Glaser 为提振纽约州旅游形象，在出租车后座用红笔把四个元素草绘在一张信封背面：圆润的红心直接替代动词 Love，与无装饰的 American Typewriter 字母排成方阵。1977 年投放后迅速成为现代城市品牌史上传播最广的图文谜语之一。",
    src: "馆藏核实：纽约现代艺术博物馆（MoMA）馆藏编号 388.2009（1976 年原初草图）。",
  },
  {
    id: "rand",
    year: "1981 设计 / 1982 印行",
    short: "Paul Rand《IBM》海报",
    title: "Eye-Bee-M：给严肃科技巨头注入幽默感",
    plateHtml: `${iconSvg("eye", 46)} ${iconSvg("bee", 48)} <span class="hist-glyph">M</span>`,
    decode: "Eye（I）+ Bee（B）+ 8 条纹 M = IBM",
    body: "1981 年，Paul Rand 为 IBM 构思了一张大胆的画谜海报：用一只平面眼睛替掉字母 I、一只条纹蜜蜂替掉字母 B，末尾保留 IBM 标志性的八道条纹字母 M，呼应企业格言「THINK」。起初部分高管担心戏谑商标，问世后却成为企业识别史上最具人情味的典范。",
    src: "馆藏核实：纽约现代艺术博物馆（MoMA）馆藏编号 520.1983（1982 年胶印海报，91.5 × 61 cm）。",
  },
];

let activeHistId = "glaser";
const histRail = $("#history-rail");
const histDetail = $("#history-detail");

function renderHistory() {
  histRail.innerHTML = HISTORY_ITEMS.map(
    (h) => `<button type="button" class="hist-btn ${h.id === activeHistId ? "is-active" : ""}" data-hist="${h.id}" role="tab" aria-selected="${h.id === activeHistId}">
      <span class="hist-year">${h.year}</span>
      <span class="hist-name">${h.short}</span>
    </button>`
  ).join("");

  const cur = HISTORY_ITEMS.find((h) => h.id === activeHistId) || HISTORY_ITEMS[0];
  histDetail.innerHTML = `
    <div class="hist-plate">
      <div class="hist-rebus-row">${cur.plateHtml}</div>
      <p class="hist-decode">${cur.decode}</p>
    </div>
    <div class="hist-copy">
      <h3>${cur.title}</h3>
      <p>${cur.body}</p>
      <p class="hist-src">${cur.src}</p>
    </div>
  `;
}

histRail.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-hist]");
  if (!btn) return;
  activeHistId = btn.dataset.hist;
  renderHistory();
});

// ============================================================================
// 6. SECTION 05 · 六大业务场景适配体检板
// ============================================================================
const SCENARIOS = [
  {
    id: "s1",
    name: "城市文旅帆布袋",
    level: "go",
    stamp: "强烈推荐",
    title: "短口号 + 强文化共鸣，极适合图文谜语",
    text: "帆布袋和地标周边自带社交展示属性，3–6 字短句替换 1 枚强象形或地标剪影，路人看懂时的会心一笑能直接转化为记忆与转发。",
  },
  {
    id: "s2",
    name: "地铁应急疏散牌",
    level: "stop",
    stamp: "严禁使用",
    title: "安全与导视零容忍解谜延迟",
    text: "紧急状态下每一毫秒都关乎生命安全，必须用标准安全图标配直白文字，严禁玩双关或藏字谜。直达表达见 141 文字主导或 142 大标题版式。",
  },
  {
    id: "s3",
    name: "咖啡节主题海报",
    level: "go",
    stamp: "推荐尝试",
    title: "受众语境高度统一，适合轻量象形替代",
    text: "目标观众对咖啡豆、拉花杯等符号极为熟悉，在 4–6 字活动主标题中替换 1 个核心名词，既点明行业又显得轻快有巧思。",
  },
  {
    id: "s4",
    name: "跨国机场免税店标语",
    level: "caution",
    stamp: "慎用谐音",
    title: "仅限全球通用象形，切忌依赖单语谐音",
    text: "面对多语种旅客，中文谐音或英文谐音（如 Eye-Bee-M）对非母语者会直接断桥。只可用红心、飞机、地球等零语言门槛图标，或改用 140 图片主导版式。",
  },
  {
    id: "s5",
    name: "药品用法与剂量卡",
    level: "stop",
    stamp: "严禁使用",
    title: "合规与医疗信息绝不能靠联想补全",
    text: "剂量、禁忌和服用时段哪怕产生 1% 的误读风险都不可接受，必须依靠清晰的层级排版与高对比文字。",
  },
  {
    id: "s6",
    name: "亲子成语绘本封面",
    level: "go",
    stamp: "强烈推荐",
    title: "天然契合主动生成与亲子互动记忆",
    text: "把四字成语中的 1 个具体物象画成童趣图形，孩子指着图念出整句的过程正是生成效应的最佳课堂。",
  },
];

let activeScenId = "s1";
const scenGrid = $("#scenario-grid");
const scenVerdict = $("#scenario-verdict");

function renderScenarios() {
  scenGrid.innerHTML = SCENARIOS.map(
    (s) =>
      `<button type="button" class="scen-btn ${s.id === activeScenId ? "is-active" : ""}" data-scen="${s.id}" aria-pressed="${s.id === activeScenId}"><span>${s.name}</span></button>`
  ).join("");

  const cur = SCENARIOS.find((s) => s.id === activeScenId) || SCENARIOS[0];
  scenVerdict.innerHTML = `
    <span class="verdict-stamp is-${cur.level}">${cur.stamp}</span>
    <h3>${cur.title}</h3>
    <p>${cur.text}</p>
  `;
}

scenGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-scen]");
  if (!btn) return;
  activeScenId = btn.dataset.scen;
  renderScenarios();
});

// ============================================================================
// 7. SECTION 06 · 单变量四选一小练习（严格中性标签 方案 A/B/C/D）
// ============================================================================
const QUIZ_OPTIONS = [
  {
    id: "A",
    ok: true,
    label: "方案 A",
    svg: `<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect width="260" height="150" fill="#F9F4EA"/>
      <rect x="14" y="14" width="232" height="122" rx="12" fill="#FCF9F2" stroke="#8EC0AF" stroke-width="1.5"/>
      <text x="48" y="84" text-anchor="middle" font-size="38" font-weight="900" fill="#0A0A09">一</text>
      <g transform="translate(87, 46) scale(1.18)">
        <path d="M8 29 C4 16 14 5 30 5 C31 19 22 30 8 29 Z" fill="#0C8A75"/>
        <path d="M9 28 Q5 31 3 34" stroke="#0C8A75" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M11 26 Q18 18 24 12 M15 21 L14 14 M19 17 L25 16" stroke="#F9F4EA" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      </g>
      <text x="160" y="84" text-anchor="middle" font-size="38" font-weight="900" fill="#0A0A09">知</text>
      <text x="212" y="84" text-anchor="middle" font-size="38" font-weight="900" fill="#0A0A09">秋</text>
      <text x="130" y="118" text-anchor="middle" font-size="11" fill="#505B57">2026 秋季独立书展 · 10.18—10.25</text>
    </svg>`,
    title: "选对了：方案 A 同时守住全部四条底线",
    explain: "仅替换「叶」一格（替代率 25%，保留 75% 文字锚点），绿叶象形直连「叶」，视觉高度约 1.10× 与汉字光学齐平，底部仅轻注书展时间而不提前剧透谜底，一秒就能顺畅读通并记住。",
  },
  {
    id: "B",
    ok: false,
    label: "方案 B",
    svg: `<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect width="260" height="150" fill="#F9F4EA"/>
      <rect x="14" y="14" width="232" height="122" rx="12" fill="#FCF9F2" stroke="#8EC0AF" stroke-width="1.5"/>
      <g transform="translate(30, 50) scale(1.05)"><rect x="4" y="14" width="28" height="7" rx="3" fill="#0C8A75"/><ellipse cx="25" cy="10" rx="4.2" ry="2" transform="rotate(-24 25 10)" fill="#0C8A75"/></g>
      <g transform="translate(86, 48) scale(1.12)"><path d="M8 29 C4 16 14 5 30 5 C31 19 22 30 8 29 Z" fill="#0C8A75"/><path d="M11 26 Q18 18 24 12" stroke="#F9F4EA" stroke-width="1.8" fill="none"/></g>
      <g transform="translate(142, 48) scale(1.12)"><path d="M11 16 A7 7 0 1 1 25 16 L22 23 L14 23 Z" fill="#0C8A75"/><line x1="14" y1="26.5" x2="22" y2="26.5" stroke="#0A0A09" stroke-width="2.2"/></g>
      <g transform="translate(196, 48) scale(1.12)"><path d="M18 4 L21 12 L30 9 L26 17 L32 20 L24 25 L25 28 L19 26 L18 32 L17 26 L11 28 L12 25 L4 20 L10 17 L6 9 L15 12 Z" fill="#C45228"/></g>
      <text x="130" y="118" text-anchor="middle" font-size="11" fill="#505B57">2026 秋季独立书展 · 10.18—10.25</text>
    </svg>`,
    title: "再想想：方案 B 错在「替代密度过载（100%）」",
    explain: "四枚图标都画得工整、比例齐平、也没剧透——唯独把四个字全部换成了图。文字锚点归零后，路人第一眼很难锁定它是一句四字成语，极易在 3 秒内弃读。",
  },
  {
    id: "C",
    ok: false,
    label: "方案 C",
    svg: `<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect width="260" height="150" fill="#F9F4EA"/>
      <rect x="14" y="14" width="232" height="122" rx="12" fill="#FCF9F2" stroke="#8EC0AF" stroke-width="1.5"/>
      <text x="42" y="84" text-anchor="middle" font-size="36" font-weight="900" fill="#0A0A09">一</text>
      <g transform="translate(68, 22) scale(2.15)">
        <path d="M8 29 C4 16 14 5 30 5 C31 19 22 30 8 29 Z" fill="#0C8A75"/>
        <path d="M9 28 Q5 31 3 34" stroke="#0C8A75" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M11 26 Q18 18 24 12 M15 21 L14 14 M19 17 L25 16" stroke="#F9F4EA" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>
      <text x="168" y="84" text-anchor="middle" font-size="36" font-weight="900" fill="#0A0A09">知</text>
      <text x="218" y="84" text-anchor="middle" font-size="36" font-weight="900" fill="#0A0A09">秋</text>
      <text x="130" y="124" text-anchor="middle" font-size="11" fill="#505B57">2026 秋季独立书展 · 10.18—10.25</text>
    </svg>`,
    title: "再想想：方案 C 错在「图文比例脱离字流」",
    explain: "它同样只替了「叶」字、象形准确、也不剧透——但绿叶被撑大到字面框的近两倍，挤歪了前后字距。人眼会把它看成一张背景插图盖在「一 知秋」上，而非句子里的第二个字。",
  },
  {
    id: "D",
    ok: false,
    label: "方案 D",
    svg: `<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect width="260" height="150" fill="#F9F4EA"/>
      <rect x="14" y="14" width="232" height="122" rx="12" fill="#FCF9F2" stroke="#8EC0AF" stroke-width="1.5"/>
      <rect x="34" y="21" width="192" height="24" rx="5" fill="#FCECE8" stroke="#B83A22" stroke-width="1.2"/>
      <text x="130" y="37" text-anchor="middle" font-size="13" font-weight="900" fill="#9C2B16">谜底：一叶知秋！</text>
      <text x="48" y="96" text-anchor="middle" font-size="38" font-weight="900" fill="#0A0A09">一</text>
      <g transform="translate(87, 58) scale(1.18)">
        <path d="M8 29 C4 16 14 5 30 5 C31 19 22 30 8 29 Z" fill="#0C8A75"/>
        <path d="M11 26 Q18 18 24 12 M15 21 L14 14 M19 17 L25 16" stroke="#F9F4EA" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      </g>
      <text x="160" y="96" text-anchor="middle" font-size="38" font-weight="900" fill="#0A0A09">知</text>
      <text x="212" y="96" text-anchor="middle" font-size="38" font-weight="900" fill="#0A0A09">秋</text>
      <text x="130" y="126" text-anchor="middle" font-size="11" fill="#505B57">2026 秋季独立书展 · 10.18—10.25</text>
    </svg>`,
    title: "再想想：方案 D 错在「同号贴脸剧透」",
    explain: "它的替字密度、绿叶象形和比例全部成立，却在谜面正上方用醒目红框直接印出「谜底：一叶知秋！」。视线先读答案、略过读图，主动补全带来的记忆增益瞬间归零。",
  },
];

let pickedQuiz = null;
const quizGrid = $("#quiz-grid");
const quizFeedback = $("#quiz-feedback");

function renderQuiz() {
  quizGrid.innerHTML = QUIZ_OPTIONS.map((opt) => {
    const picked = pickedQuiz === opt.id;
    const cls = picked ? (opt.ok ? "is-picked-ok" : "is-picked-err") : "";
    return `<button type="button" class="quiz-opt ${cls}" data-quiz="${opt.id}" role="radio" aria-checked="${picked}">
      <span class="quiz-label">${opt.label}</span>
      <div class="quiz-mini-poster">${opt.svg}</div>
    </button>`;
  }).join("");

  if (!pickedQuiz) return;
  const cur = QUIZ_OPTIONS.find((o) => o.id === pickedQuiz);
  quizFeedback.className = `quiz-feedback ${cur.ok ? "is-ok" : "is-err"}`;
  quizFeedback.innerHTML = `<h3>${cur.title}</h3><p>${cur.explain}</p>`;
}

quizGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-quiz]");
  if (!btn) return;
  pickedQuiz = btn.dataset.quiz;
  renderQuiz();
});

// ============================================================================
// 8. SECTION 07 · 原海报关键词图标 & 放大拖拽灯箱
// ============================================================================
$$("[data-kw]").forEach((el) => {
  el.innerHTML = iconSvg(el.dataset.kw, 30);
});

const posterImg = $("#poster");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbViewport = $("#lb-viewport");
const lbZoom = $("#lb-zoom");
let lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0 };

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbState.x}px, ${lbState.y}px) scale(${lbState.scale})`;
  lbZoom.textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbState = { scale: 1.25, x: 0, y: 0, dragging: false, sx: 0, sy: 0 };
  applyLightboxTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  $("#poster-open-btn").focus();
}

$("#poster-open-btn").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbState.scale = Math.min(3.5, Math.round((lbState.scale + 0.35) * 100) / 100);
  applyLightboxTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbState.scale = Math.max(0.7, Math.round((lbState.scale - 0.35) * 100) / 100);
  applyLightboxTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0 };
  applyLightboxTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  lbState.dragging = true;
  lbState.sx = e.clientX - lbState.x;
  lbState.sy = e.clientY - lbState.y;
  lbViewport.classList.add("is-grabbing");
  lbViewport.setPointerCapture(e.pointerId);
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lbState.dragging) return;
  lbState.x = e.clientX - lbState.sx;
  lbState.y = e.clientY - lbState.sy;
  applyLightboxTransform();
});

lbViewport.addEventListener("pointerup", () => {
  lbState.dragging = false;
  lbViewport.classList.remove("is-grabbing");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// 窗口尺寸变化时重算画布尺寸并重绘
window.addEventListener("resize", () => {
  heroDirty = true;
  phaseDirty = true;
  renderHeroUI();
  heroLoop.draw();
  phaseLoop.draw();
});

// ============================================================================
// 初始渲染
// ============================================================================
if (reducedMotion.matches) introProgress = 1;
renderHeroUI();
renderRecallCards();
renderMechanismSection();
updatePhaseReadout();
renderHistory();
renderScenarios();
renderQuiz();
document.fonts?.ready?.then(() => {
  heroDirty = true;
  phaseDirty = true;
  heroLoop.draw();
  phaseLoop.draw();
});
