// 296 堆叠重排 · 开场交互舞台（宽屏乱序蓝图 + 固定 375px 逻辑宽度窄屏落位与调序）与 01 节 Canvas 动线回放
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SPECIMENS, analyzeHeroState } from "./model.js";

const ORANGE = "#F35216";
const ORANGE_DARK = "#B83606";
const INK = "#0F0F0E";
const PHONE_LOGICAL_W = 375;

export function iconSvg(shape) {
  if (shape === "circle") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="2" fill="#F35216"/><circle cx="18" cy="18" r="9.5" fill="#FFFDF9"/></svg>`;
  }
  if (shape === "triangle") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="2" fill="#F35216"/><polygon points="18,8 28,27 8,27" fill="#FFFDF9"/></svg>`;
  }
  if (shape === "square") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="2" fill="#F35216"/><rect x="10" y="10" width="16" height="16" rx="1" fill="#FFFDF9"/></svg>`;
  }
  return `<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="2" fill="#F35216"/><rect x="8.5" y="10" width="19" height="3.2" rx="1" fill="#FFFDF9"/><rect x="8.5" y="16.4" width="19" height="3.2" rx="1" fill="#FFFDF9"/><rect x="8.5" y="22.8" width="19" height="3.2" rx="1" fill="#FFFDF9"/></svg>`;
}

export function initHeroStage() {
  const stageRoot = document.getElementById("hero-stage");
  const canvas = document.getElementById("hero-canvas");
  const wideGrid = document.getElementById("wide-ref-grid");
  const phoneScaleHost = document.getElementById("phone-scale-host");
  const phoneViewport = document.getElementById("phone-viewport");
  const rowClip = document.getElementById("h-row-clip");
  const rowTrack = document.getElementById("h-row-track");
  const rowBadge = document.getElementById("h-overflow-badge");
  const rowStatus = document.getElementById("h-row-status");
  const dropZone = document.getElementById("v-drop-zone");
  const phoneScroll = document.getElementById("phone-scroll");
  const taskTextEl = document.getElementById("hero-task-text");

  // 舞台下方统一诊断带元素
  const roTag = document.getElementById("ro-tag");
  const roStacked = document.getElementById("ro-stacked");
  const roOverflow = document.getElementById("ro-overflow");
  const roPriority = document.getElementById("ro-priority");
  const roHead = document.getElementById("ro-head");
  const roWhy = document.getElementById("ro-why");

  const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
  const btnReset = document.getElementById("btn-hero-reset");
  const btnStackAll = document.getElementById("btn-hero-all");

  if (!stageRoot || !canvas || !phoneScaleHost || !phoneViewport || !rowClip || !rowTrack || !dropZone) return;
  const ctx = canvas.getContext("2d");
  const landscapeMQ = matchMedia("(max-height: 460px) and (min-width: 600px)");

  const state = {
    specimenId: "features",
    stackedIds: [], // 开场 0 块入列，4 块按宽屏乱序全挤在 375px 顶部一行里
    hoveredId: null,
    lastOverflowPx: 0,
    lastInfo: null,
    phoneScale: 1,
    drag: null, // { kind: "fromRow"|"reorder", id, el, ghost, pointerId, startX, startY, curX, curY, dx, dy, overZone, targetIndex, startTime }
    pulsePhase: 0,
    landFlash: { id: null, t: 0 },
  };

  const getSpecimen = () => SPECIMENS[state.specimenId];
  const getModules = () => getSpecimen().modules;
  const getRemaining = () => getModules().filter((m) => !state.stackedIds.includes(m.id));
  const getStacked = () => state.stackedIds.map((id) => getModules().find((m) => m.id === id)).filter(Boolean);

  // 固定 375px 逻辑宽排版，外层容器窄于 375px 时用 transform 等比缩放，保证所有屏幕下实测溢出 px 严格一致
  function fitPhoneViewport() {
    if (landscapeMQ.matches) {
      state.phoneScale = 1;
      phoneViewport.style.transform = "";
      phoneScaleHost.style.height = "";
      return;
    }
    const availW = phoneScaleHost.clientWidth;
    if (availW <= 0) return;
    if (availW >= PHONE_LOGICAL_W - 0.5) {
      state.phoneScale = 1;
      phoneViewport.style.transform = "";
      phoneScaleHost.style.height = "";
    } else {
      const s = availW / PHONE_LOGICAL_W;
      state.phoneScale = s;
      phoneViewport.style.transform = `scale(${s.toFixed(4)})`;
      const naturalH = phoneViewport.offsetHeight;
      phoneScaleHost.style.height = `${Math.ceil(naturalH * s)}px`;
    }
  }

  function measureOverflow() {
    const remaining = getRemaining();
    if (remaining.length === 0) {
      state.lastOverflowPx = 0;
      return 0;
    }
    // scrollWidth 与 clientWidth 均为未受 transform 影响的 375px 逻辑布局像素
    const over = Math.max(0, Math.round(rowTrack.scrollWidth - rowClip.clientWidth));
    state.lastOverflowPx = over;
    return over;
  }

  function updateReadout() {
    const over = measureOverflow();
    const info = analyzeHeroState(state.specimenId, state.stackedIds, over);
    state.lastInfo = info;

    rowClip.dataset.overflow = over > 0 ? "true" : "false";
    rowClip.dataset.empty = info.remainingCount === 0 ? "true" : "false";

    if (rowBadge) {
      if (info.remainingCount === 0) {
        if (info.orderStatus === "clear") {
          rowBadge.textContent = "顺序清晰 · 0 px";
          rowBadge.dataset.state = "ok";
        } else if (info.orderStatus === "partial") {
          rowBadge.textContent = "0 px · 次序可再顺";
          rowBadge.dataset.state = "mid";
        } else {
          rowBadge.textContent = "0 px · 顺序倒挂";
          rowBadge.dataset.state = "warn";
        }
      } else if (over > 0) {
        rowBadge.textContent = `实测溢出 +${over} px`;
        rowBadge.dataset.state = "warn";
      } else {
        rowBadge.textContent = `余 ${info.remainingCount} 块未入列 · 0 px`;
        rowBadge.dataset.state = "mid";
      }
    }

    if (rowStatus) {
      rowStatus.textContent =
        info.remainingCount === 0
          ? "4 块已全部入列（可拖动卡片或点 ↑ ↓ 调整先后）"
          : `横排剩余 ${info.remainingCount} 块（按轻重拖入下方单列，或点击 / Enter）`;
    }

    if (roTag) {
      roTag.textContent = info.stateTag;
      roTag.dataset.severity = info.severity;
    }
    if (roStacked) roStacked.textContent = `${info.stackedCount} / 4`;
    if (roOverflow) {
      roOverflow.textContent = info.overflowPx > 0 ? `+${info.overflowPx} px` : "0 px";
      roOverflow.dataset.severity = info.overflowPx > 0 ? "warn" : "ok";
    }
    if (roPriority) {
      roPriority.textContent = info.priorityText;
      roPriority.dataset.severity = info.prioritySeverity;
    }
    if (roHead) roHead.textContent = info.headline;
    if (roWhy) roWhy.textContent = info.why;
  }

  function renderWideRef() {
    if (!wideGrid) return;
    const mods = getModules();
    wideGrid.innerHTML = mods
      .map((m) => {
        const stackIdx = state.stackedIds.indexOf(m.id);
        const isStacked = stackIdx >= 0;
        const isHover = state.hoveredId === m.id || state.drag?.id === m.id;
        return `
          <div class="wide-mod${isStacked ? " is-stacked" : ""}${isHover ? " is-hot" : ""}" data-wide-id="${m.id}">
            <div class="wide-mod-top">
              <span class="mod-ico">${iconSvg(m.shape)}</span>
              <span class="wide-pos">${isStacked ? `单列 0${stackIdx + 1}` : `宽屏${m.widePos}`}</span>
            </div>
            <p class="wide-title">${m.title}</p>
            <p class="wide-sum">${m.summary}</p>
            <p class="wide-foot">${isStacked ? `已落入 0${stackIdx + 1} 位` : m.wideMeta}</p>
          </div>
        `;
      })
      .join("");
  }

  function renderPhone() {
    const remaining = getRemaining();
    const stacked = getStacked();

    if (taskTextEl) {
      taskTextEl.textContent = getSpecimen().task;
    }

    // 上方横排挤爆区（不提前印 01–04 剧透答案，靠几何徽标与真实文案按任务判轻重）
    if (remaining.length === 0) {
      const okOrder = state.lastInfo?.orderStatus === "clear";
      rowTrack.innerHTML = `<div class="h-row-cleared${okOrder ? "" : " is-check-order"}"><span class="h-clear-mark" aria-hidden="true">${okOrder ? "✓" : "!"}</span><span>${okOrder ? "横排清空，单列顺序清晰" : "横排已清空：请核对下方 01–04 顺序"}</span></div>`;
    } else {
      rowTrack.innerHTML = remaining
        .map((m, idx) => {
          const isPerfTarget = idx === 0 ? " data-perf-drag" : "";
          return `
            <button type="button" class="h-card" data-mod-id="${m.id}"${isPerfTarget} aria-label="${m.title}（${m.tag}）：向下拖入单列，或按回车立即落位">
              <span class="h-card-ico">${iconSvg(m.shape)}</span>
              <span class="h-card-copy">
                <span class="h-card-head"><strong>${m.title}</strong></span>
                <span class="h-card-sum">${m.summary}</span>
              </span>
              <span class="h-card-grip" aria-hidden="true"><svg viewBox="0 0 10 16" width="10" height="16"><circle cx="2.5" cy="3" r="1.3" fill="currentColor"/><circle cx="7.5" cy="3" r="1.3" fill="currentColor"/><circle cx="2.5" cy="8" r="1.3" fill="currentColor"/><circle cx="7.5" cy="8" r="1.3" fill="currentColor"/><circle cx="2.5" cy="13" r="1.3" fill="currentColor"/><circle cx="7.5" cy="13" r="1.3" fill="currentColor"/></svg></span>
            </button>
          `;
        })
        .join("");
    }

    // 下方纵向单列落位与调序区：槽位实时赋予 01–04 次序，每块支持 ↑ ↓ 调序、拖动换位与放回
    const slotHtml = [];
    for (let i = 0; i < 4; i++) {
      const m = stacked[i];
      if (m) {
        const isFirst = i === 0;
        const isLast = i === stacked.length - 1;
        const isPrimaryMisplaced = m.tier === 1 && i > 0;
        const isWrongLeader = i === 0 && m.tier !== 1;
        const cardStateCls = isWrongLeader ? " is-wrong-lead" : isPrimaryMisplaced ? " is-buried-main" : "";
        slotHtml.push(`
          <article class="v-card${cardStateCls}${state.landFlash.id === m.id ? " is-just-landed" : ""}" data-landed-id="${m.id}" data-stack-index="${i}">
            <div class="v-card-head">
              <span class="v-card-id">
                <b class="v-num" lang="en">0${i + 1}</b>
                <h3 class="v-title">${m.title}</h3>
                <span class="v-tag">${m.tag}</span>
              </span>
              <span class="v-card-right">
                <span class="v-ico">${iconSvg(m.shape)}</span>
                <button type="button" class="v-move" data-move-id="${m.id}" data-dir="-1" ${isFirst ? "disabled" : ""} aria-label="将 ${m.title} 上移一位">↑</button>
                <button type="button" class="v-move" data-move-id="${m.id}" data-dir="1" ${isLast ? "disabled" : ""} aria-label="将 ${m.title} 下移一位">↓</button>
                <button type="button" class="v-return" data-return-id="${m.id}" aria-label="把 ${m.title} 放回横排">放回</button>
              </span>
            </div>
            <p class="v-sum">${m.summary}</p>
          </article>
        `);
      } else {
        const nextFlag = i === stacked.length ? " is-next-slot" : "";
        const hint =
          i === 0
            ? "把最先要确认的主任务拖到 01（或点击 / Enter）"
            : i === stacked.length
              ? "继续按轻重拖入模块，或点击 / Enter 落位"
              : "等待单列落位";
        slotHtml.push(`
          <div class="v-slot${nextFlag}" data-slot-index="${i}">
            <span class="v-slot-no" lang="en">0${i + 1}</span>
            <span class="v-slot-hint">${hint}</span>
          </div>
        `);
      }
    }
    dropZone.innerHTML = slotHtml.join("");

    // 绑定横排可拖模块
    rowTrack.querySelectorAll(".h-card").forEach((card) => {
      bindRowDragCard(card);
    });

    // 绑定单列上移 / 下移按钮
    dropZone.querySelectorAll(".v-move").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.moveId;
        const dir = Number(btn.dataset.dir);
        moveStackedModule(id, dir, true);
      });
    });

    // 绑定「放回」按钮
    dropZone.querySelectorAll(".v-return").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.returnId;
        state.stackedIds = state.stackedIds.filter((x) => x !== id);
        renderAll();
        const restored = rowTrack.querySelector(`[data-mod-id="${id}"]`);
        if (restored) restored.focus();
      });
    });

    // 绑定单列卡片拖拽调序 + 悬停联动
    dropZone.querySelectorAll(".v-card").forEach((el) => {
      bindStackReorderCard(el);
      el.addEventListener("pointerenter", () => {
        state.hoveredId = el.dataset.landedId;
        renderWideRef();
        drawOverlay();
      });
      el.addEventListener("pointerleave", () => {
        if (!state.drag) {
          state.hoveredId = null;
          renderWideRef();
          drawOverlay();
        }
      });
    });
  }

  function landModule(id, insertIndex = null, focusNext = false) {
    if (state.stackedIds.includes(id)) return;
    if (typeof insertIndex === "number" && insertIndex >= 0 && insertIndex <= state.stackedIds.length) {
      state.stackedIds.splice(insertIndex, 0, id);
    } else {
      state.stackedIds.push(id);
    }
    state.landFlash = { id, t: performance.now() };
    renderAll();
    if (focusNext) {
      const nextCard = rowTrack.querySelector(".h-card");
      if (nextCard) nextCard.focus();
      else {
        const firstMove = dropZone.querySelector(".v-move:not(:disabled)");
        if (firstMove) firstMove.focus();
        else if (btnReset) btnReset.focus();
      }
    }
  }

  function moveStackedModule(id, dir, keepFocus = false) {
    const idx = state.stackedIds.indexOf(id);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= state.stackedIds.length) return;
    const copy = [...state.stackedIds];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    state.stackedIds = copy;
    state.landFlash = { id, t: performance.now() };
    renderAll();
    if (keepFocus) {
      const sameBtn = dropZone.querySelector(`.v-move[data-move-id="${id}"][data-dir="${dir}"]:not(:disabled)`);
      const altBtn = dropZone.querySelector(`.v-move[data-move-id="${id}"]:not(:disabled)`);
      (sameBtn || altBtn)?.focus();
    }
  }

  function computeInsertIndex(clientY, excludeId = null, cachedCards = null) {
    if (cachedCards) {
      for (let i = 0; i < cachedCards.length; i++) {
        if (clientY < cachedCards[i].midY) return i;
      }
      return cachedCards.length;
    }
    const cards = [...dropZone.querySelectorAll(".v-card")].filter((el) => el.dataset.landedId !== excludeId);
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (clientY < r.top + r.height * 0.5) {
        return i;
      }
    }
    return cards.length;
  }

  let layoutCache = null;
  function refreshLayoutCache() {
    const host = getCanvasHost();
    const rect = host.getBoundingClientRect();
    const toRel = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      return {
        x: r.left - rect.left,
        y: r.top - rect.top,
        w: r.width,
        h: r.height,
        cx: r.left - rect.left + r.width / 2,
        cy: r.top - rect.top + r.height / 2,
      };
    };

    const wideBox = document.getElementById("wide-ref-box");
    const wideVisible = !!(wideBox && getComputedStyle(wideBox).display !== "none" && wideBox.getBoundingClientRect().width > 120);
    const wideRect = wideVisible ? toRel(wideBox) : null;
    const phoneRect = toRel(phoneViewport);
    const wideLinks = [];
    if (wideVisible) {
      const stacked = getStacked();
      for (const m of stacked) {
        const a = toRel(wideGrid.querySelector(`[data-wide-id="${m.id}"]`));
        const b = toRel(dropZone.querySelector(`[data-landed-id="${m.id}"]`));
        if (a && b) wideLinks.push({ id: m.id, a, b });
      }
    }

    const landedCards = [...dropZone.querySelectorAll(".v-card")].map((el) => ({
      id: el.dataset.landedId,
      box: toRel(el),
      raw: el.getBoundingClientRect(),
    })).filter((c) => c.box);

    const primary = getModules().find((m) => m.tier === 1);
    const primaryCard = primary ? landedCards.find((c) => c.id === primary.id)?.box || null : null;

    layoutCache = {
      rect,
      wideVisible,
      stackedBelow: !!(wideRect && phoneRect && phoneRect.y > wideRect.y + wideRect.h - 10),
      wideLinks,
      landedCards,
      primaryCard,
      clipBox: toRel(rowClip),
      dzBox: toRel(dropZone),
      dzRaw: dropZone.getBoundingClientRect(),
      nextSlotBox: toRel(dropZone.querySelector(".v-slot.is-next-slot") || dropZone),
    };
    return layoutCache;
  }

  function startGhostDrag(kind, id, card, e) {
    if (state.drag?.ghost) state.drag.ghost.remove();

    const cache = refreshLayoutCache();
    const rect = card.getBoundingClientRect();
    const ghost = card.cloneNode(true);
    ghost.removeAttribute("data-perf-drag");
    ghost.classList.add(kind === "fromRow" ? "h-card-ghost" : "v-card-ghost");
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${card.offsetWidth}px`;
    ghost.style.height = `${card.offsetHeight}px`;
    ghost.style.transformOrigin = "top left";
    ghost.style.transform = `translate3d(0px, 0px, 0) scale(${(state.phoneScale * 1.02).toFixed(4)})`;
    document.body.appendChild(ghost);

    const reorderTargets = cache.landedCards
      .filter((c) => c.id !== id)
      .map((c) => ({ id: c.id, midY: c.raw.top + c.raw.height * 0.5, box: c.box }));

    state.drag = {
      kind,
      id,
      el: card,
      ghost,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      curX: e.clientX,
      curY: e.clientY,
      dx: 0,
      dy: 0,
      overZone: kind === "reorder",
      targetIndex: state.stackedIds.indexOf(id),
      dzRaw: cache.dzRaw,
      reorderTargets,
      startTime: performance.now(),
    };
    card.classList.add("is-dragging-origin");
    dropZone.classList.add("is-awaiting");
    renderWideRef();
    refreshLayoutCache();
  }

  function bindRowDragCard(card) {
    const id = card.dataset.modId;

    card.addEventListener("pointerenter", () => {
      state.hoveredId = id;
      renderWideRef();
    });
    card.addEventListener("pointerleave", () => {
      if (!state.drag) {
        state.hoveredId = null;
        renderWideRef();
      }
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        landModule(id, null, true);
      }
    });

    card.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();
      startGhostDrag("fromRow", id, card, e);
    });
  }

  function bindStackReorderCard(card) {
    const id = card.dataset.landedId;
    card.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (state.stackedIds.length < 2) return;
      e.preventDefault();
      startGhostDrag("reorder", id, card, e);
    });
  }

  window.addEventListener("pointermove", (e) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    d.curX = e.clientX;
    d.curY = e.clientY;
    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;

    // 仅更新合成层 transform，绝不在此处读取 DOM 布局或同步重画 Canvas（避免软件渲染下布局抖动）
    if (d.ghost) {
      d.ghost.style.transform = `translate3d(${d.dx.toFixed(1)}px, ${d.dy.toFixed(1)}px, 0) scale(${(state.phoneScale * 1.02).toFixed(4)})`;
    }

    const dz = d.dzRaw;
    if (d.kind === "fromRow") {
      const inZone =
        d.dy >= 30 ||
        (e.clientX >= dz.left - 18 && e.clientX <= dz.right + 18 && e.clientY >= dz.top - 16 && e.clientY <= dz.bottom + 24);
      if (inZone !== d.overZone) {
        d.overZone = inZone;
        dropZone.classList.toggle("is-hot", inZone);
      }
      d.targetIndex = inZone ? computeInsertIndex(e.clientY, null, d.reorderTargets) : state.stackedIds.length;
    } else {
      d.overZone = true;
      d.targetIndex = computeInsertIndex(e.clientY, d.id, d.reorderTargets);
    }
  });

  const finishWindowDrag = (e, cancelled = false) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    const dist = Math.hypot(d.dx, d.dy);
    const elapsed = performance.now() - d.startTime;

    if (d.ghost) d.ghost.remove();
    d.el.classList.remove("is-dragging-origin");
    dropZone.classList.remove("is-awaiting", "is-hot");
    state.drag = null;

    if (d.kind === "fromRow") {
      const isTap = dist < 10 && elapsed < 420;
      const shouldDrop = !cancelled && (d.overZone || isTap);
      if (shouldDrop) {
        landModule(d.id, isTap ? null : d.targetIndex, false);
        return;
      }
    } else if (d.kind === "reorder" && !cancelled && dist >= 10) {
      const next = state.stackedIds.filter((x) => x !== d.id);
      const idx = Math.max(0, Math.min(next.length, d.targetIndex));
      next.splice(idx, 0, d.id);
      state.stackedIds = next;
      state.landFlash = { id: d.id, t: performance.now() };
      renderAll();
      return;
    }

    renderWideRef();
    refreshLayoutCache();
    drawOverlay();
  };

  window.addEventListener("pointerup", (e) => finishWindowDrag(e, false));
  window.addEventListener("pointercancel", (e) => finishWindowDrag(e, true));

  function getCanvasHost() {
    return canvas.offsetParent || stageRoot;
  }

  let canvasSize = { w: 1, h: 1 };
  function resizeCanvas() {
    const cache = layoutCache || refreshLayoutCache();
    const r = cache.rect;
    const maxDpr = innerWidth <= 600 ? 1.5 : 2;
    const dpr = pixelRatio(maxDpr);
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    canvasSize = { w, h };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h, rect: r, cache };
  }

  function drawOverlay(t = 0) {
    const { w, h, rect, cache } = resizeCanvas();
    ctx.clearRect(0, 0, w, h);

    // 1. 宽屏蓝图可见时：绘制宽屏原稿与单列之间的橙色点线对应轨迹
    if (cache.wideVisible && cache.wideLinks.length) {
      for (const { id, a, b } of cache.wideLinks) {
        const hot = state.hoveredId === id;
        ctx.save();
        ctx.strokeStyle = hot ? ORANGE : "rgba(243, 82, 22, 0.30)";
        ctx.lineWidth = hot ? 2 : 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        let x1, y1, x2, y2;
        if (cache.stackedBelow) {
          x1 = a.cx;
          y1 = a.y + a.h;
          x2 = b.cx;
          y2 = b.y;
          const my = (y1 + y2) / 2;
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo(x1, my, x2, my, x2, y2);
        } else {
          x1 = a.x + a.w;
          y1 = a.cy;
          x2 = b.x;
          y2 = b.cy;
          const mx = (x1 + x2) / 2;
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = hot ? ORANGE : "rgba(243, 82, 22, 0.52)";
        ctx.beginPath();
        ctx.arc(x1, y1, hot ? 3.5 : 2.4, 0, Math.PI * 2);
        ctx.arc(x2, y2, hot ? 3.5 : 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. 手机视口内：单列阅读动线
    if (cache.landedCards.length >= 2) {
      const first = cache.landedCards[0].box;
      const last = cache.landedCards[cache.landedCards.length - 1].box;
      const orderStatus = state.lastInfo?.orderStatus;
      if (first && last) {
        const lineX = Math.max(8, first.x - 9);
        const yTop = first.y + 10;
        const yBot = last.y + last.h - 10;
        if (yBot > yTop + 12) {
          ctx.save();
          if (orderStatus === "misordered") {
            const pBox = cache.primaryCard;
            ctx.strokeStyle = ORANGE_DARK;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            if (pBox && pBox.cy > first.cy + 10) {
              ctx.moveTo(lineX, pBox.cy);
              ctx.lineTo(lineX, first.cy);
            } else {
              ctx.moveTo(lineX, yBot);
              ctx.lineTo(lineX, yTop);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            const tipY = pBox ? first.cy : yTop;
            ctx.fillStyle = ORANGE_DARK;
            ctx.beginPath();
            ctx.moveTo(lineX, tipY - 5);
            ctx.lineTo(lineX - 4.5, tipY + 3);
            ctx.lineTo(lineX + 4.5, tipY + 3);
            ctx.closePath();
            ctx.fill();
          } else {
            const isClear = orderStatus === "clear";
            ctx.strokeStyle = isClear ? ORANGE : "rgba(243, 82, 22, 0.55)";
            ctx.lineWidth = isClear ? 2.2 : 1.5;
            ctx.setLineDash([4, 4]);
            if (!reducedMotion.matches && isClear) {
              ctx.lineDashOffset = -(t * 20) % 16;
            }
            ctx.beginPath();
            ctx.moveTo(lineX, yTop);
            ctx.lineTo(lineX, yBot);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = isClear ? ORANGE : "rgba(243, 82, 22, 0.7)";
            ctx.beginPath();
            ctx.moveTo(lineX, yBot + 5);
            ctx.lineTo(lineX - 4.5, yBot - 3);
            ctx.lineTo(lineX + 4.5, yBot - 3);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    // 3. 横排区仍存在溢出时，在裁切右缘绘制半透明斜纹警告带
    if (state.lastOverflowPx > 0 && cache.clipBox) {
      const clipBox = cache.clipBox;
      ctx.save();
      const stripW = 14 * state.phoneScale;
      const sx = clipBox.x + clipBox.w - stripW;
      ctx.beginPath();
      ctx.rect(sx, clipBox.y + 1, stripW - 1, clipBox.h - 2);
      ctx.clip();
      ctx.fillStyle = "rgba(243, 82, 22, 0.14)";
      ctx.fillRect(sx, clipBox.y, stripW, clipBox.h);
      ctx.strokeStyle = "rgba(243, 82, 22, 0.55)";
      ctx.lineWidth = 1.5;
      const shift = reducedMotion.matches ? 0 : (t * 18) % 10;
      ctx.beginPath();
      for (let yy = clipBox.y - 20; yy < clipBox.y + clipBox.h + 20; yy += 8) {
        ctx.moveTo(sx - 4, yy + shift);
        ctx.lineTo(sx + stripW + 4, yy - 10 + shift);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. 正在拖动模块时：绘制弹性朱橙轨迹与落位插入线
    if (state.drag) {
      const d = state.drag;
      const fromX = d.curX - rect.left;
      const fromY = d.curY - rect.top;

      if (d.kind === "fromRow" && cache.nextSlotBox) {
        const slotBox = cache.nextSlotBox;
        const toX = slotBox.cx;
        const toY = slotBox.cy;
        ctx.save();
        ctx.strokeStyle = d.overZone ? ORANGE : ORANGE_DARK;
        ctx.lineWidth = d.overZone ? 2.6 : 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        const ctrlX = (fromX + toX) / 2 + d.dx * 0.2;
        const ctrlY = Math.min(fromY, toY) - 22;
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, toX, toY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(fromX, fromY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(toX, toY, d.overZone ? 11 : 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (d.overZone && cache.dzBox && d.reorderTargets.length > 0 && d.targetIndex <= d.reorderTargets.length) {
        const dzBox = cache.dzBox;
        let lineY;
        if (d.targetIndex === 0) {
          lineY = d.reorderTargets[0].box.y - 4;
        } else {
          const prev = d.reorderTargets[d.targetIndex - 1].box;
          lineY = prev.y + prev.h + 4;
        }
        ctx.save();
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(dzBox.x + 8, lineY);
        ctx.lineTo(dzBox.x + dzBox.w - 8, lineY);
        ctx.stroke();
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(dzBox.x + 8, lineY, 3.5, 0, Math.PI * 2);
        ctx.arc(dzBox.x + dzBox.w - 8, lineY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function renderAll() {
    const preOver = measureOverflow();
    state.lastInfo = analyzeHeroState(state.specimenId, state.stackedIds, preOver);
    renderWideRef();
    renderPhone();
    fitPhoneViewport();
    updateReadout();
    refreshLayoutCache();
    drawOverlay();
    requestAnimationFrame(() => {
      fitPhoneViewport();
      updateReadout();
      refreshLayoutCache();
      drawOverlay();
    });
  }

  // 标本切换、重置、按宽屏原序全堆（直接呈现溢出 0 px 但顺序倒挂的对比态）
  specimenBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.specimen;
      if (!SPECIMENS[next]) return;
      state.specimenId = next;
      state.stackedIds = [];
      specimenBtns.forEach((b) => {
        const active = b.dataset.specimen === next;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      renderAll();
    });
  });

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      state.stackedIds = [];
      renderAll();
    });
  }
  if (btnStackAll) {
    btnStackAll.addEventListener("click", () => {
      state.stackedIds = getModules().map((m) => m.id);
      renderAll();
    });
  }

  if (phoneScroll) {
    phoneScroll.addEventListener("scroll", () => {
      refreshLayoutCache();
      drawOverlay(state.pulsePhase);
    }, { passive: true });
  }

  const ro = new ResizeObserver(() => {
    fitPhoneViewport();
    updateReadout();
    refreshLayoutCache();
    drawOverlay(state.pulsePhase);
  });
  ro.observe(stageRoot);
  ro.observe(phoneScaleHost);
  if (stageRoot.parentElement) ro.observe(stageRoot.parentElement);
  landscapeMQ.addEventListener("change", () => {
    fitPhoneViewport();
    updateReadout();
    refreshLayoutCache();
    drawOverlay(state.pulsePhase);
  });

  const { draw } = loop(stageRoot, (t, dt, { still }) => {
    state.pulsePhase = still ? 0 : t;
    drawOverlay(state.pulsePhase);
  });

  renderAll();
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      fitPhoneViewport();
      updateReadout();
      refreshLayoutCache();
      draw();
    });
  }
}

// ================= 01 节：2D Canvas 双屏扫视动线回放对比器 =================
export function initScanPlayback() {
  const canvas = document.getElementById("scan-canvas");
  const btnReplay = document.getElementById("btn-scan-replay");
  const statusEl = document.getElementById("scan-status");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let playing = !reducedMotion.matches;
  let progress = reducedMotion.matches ? 1 : 0;
  const DURATION = 4.2;
  let cachedW = 320;
  let cachedH = 260;
  let dirty = true;
  let lastStatusPct = -1;

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    cachedW = Math.max(280, Math.round(rect.width));
    cachedH = Math.max(220, Math.round(rect.height));
    const maxDpr = innerWidth <= 600 ? 1.5 : 2;
    const dpr = pixelRatio(maxDpr);
    const pw = Math.round(cachedW * dpr);
    const ph = Math.round(cachedH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function drawScene(p) {
    const w = cachedW;
    const h = cachedH;
    const maxDpr = innerWidth <= 600 ? 1.5 : 2;
    ctx.setTransform(pixelRatio(maxDpr), 0, 0, pixelRatio(maxDpr), 0, 0);
    ctx.clearRect(0, 0, w, h);

    const isNarrow = w < 560;
    const pad = isNarrow ? 12 : 20;
    const gap = isNarrow ? 16 : 24;
    const panelW = isNarrow ? w - pad * 2 : (w - pad * 2 - gap) / 2;
    const panelH = isNarrow ? (h - pad * 2 - gap) / 2 : h - pad * 2;

    const leftRect = { x: pad, y: pad, w: panelW, h: panelH };
    const rightRect = isNarrow
      ? { x: pad, y: pad + panelH + gap, w: panelW, h: panelH }
      : { x: pad + panelW + gap, y: pad, w: panelW, h: panelH };

    const samplePath = (pts, frac) => {
      const segs = [];
      let total = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        segs.push({ a: pts[i], b: pts[i + 1], len });
        total += len;
      }
      let target = Math.max(0, Math.min(1, frac)) * total;
      const drawn = [pts[0]];
      for (const s of segs) {
        if (target >= s.len) {
          drawn.push(s.b);
          target -= s.len;
        } else {
          const r = s.len ? target / s.len : 0;
          drawn.push([s.a[0] + (s.b[0] - s.a[0]) * r, s.a[1] + (s.b[1] - s.a[1]) * r]);
          break;
        }
      }
      return { drawn, head: drawn[drawn.length - 1] };
    };

    // ---- 面板 A：硬留多列窄屏（往返折跳） ----
    drawPanelFrame(ctx, leftRect, "硬留多列（双向横滚 · 多次折返示意）", "#8C300E");
    const ax = leftRect.x + 14;
    const ay = leftRect.y + 38;
    const aw = leftRect.w - 28;
    const ah = leftRect.h - 52;
    const cellW = (aw - 12) / 2;
    const cellH = (ah - 12) / 2;
    const aBoxes = [
      { x: ax, y: ay, w: cellW, h: cellH, n: "01" },
      { x: ax + cellW + 12, y: ay, w: cellW, h: cellH, n: "02" },
      { x: ax, y: ay + cellH + 12, w: cellW, h: cellH, n: "03" },
      { x: ax + cellW + 12, y: ay + cellH + 12, w: cellW, h: cellH, n: "04" },
    ];
    for (const b of aBoxes) {
      ctx.fillStyle = "#FFFDF9";
      ctx.strokeStyle = "#D4C9BA";
      ctx.lineWidth = 1;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(b.x + 8, b.y + 8, 16, 16);
      ctx.fillStyle = INK;
      ctx.font = "700 12px Outfit, sans-serif";
      ctx.fillText(b.n, b.x + 30, b.y + 20);
      ctx.fillStyle = "#D8CFC3";
      ctx.fillRect(b.x + 30, b.y + 28, Math.max(24, b.w - 40), 5);
      ctx.fillRect(b.x + 30, b.y + 38, Math.max(18, b.w - 56), 5);
    }
    ctx.save();
    ctx.strokeStyle = "rgba(243,82,22,0.5)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(ax + aw - 14, ay - 4);
    ctx.lineTo(ax + aw - 14, ay + ah + 4);
    ctx.stroke();
    ctx.restore();

    const ptsA = [
      [aBoxes[0].x + 22, aBoxes[0].y + aBoxes[0].h * 0.68],
      [aBoxes[1].x + aBoxes[1].w * 0.78, aBoxes[1].y + aBoxes[1].h * 0.68],
      [aBoxes[2].x + 22, aBoxes[2].y + aBoxes[2].h * 0.68],
      [aBoxes[3].x + aBoxes[3].w * 0.78, aBoxes[3].y + aBoxes[3].h * 0.68],
    ];
    drawTrace(ctx, ptsA, samplePath(ptsA, p), "#C63B08", true);

    // ---- 面板 B：单列堆叠重排（单一纵轴） ----
    drawPanelFrame(ctx, rightRect, "单列堆叠（一条纵轴 · 零横向折返示意）", "#2B5B3B");
    const bx = rightRect.x + 18;
    const by = rightRect.y + 38;
    const bw = rightRect.w - 36;
    const bh = rightRect.h - 52;
    const rowGap = 8;
    const rowH = (bh - rowGap * 3) / 4;
    const bBoxes = [0, 1, 2, 3].map((i) => ({
      x: bx,
      y: by + i * (rowH + rowGap),
      w: bw,
      h: rowH,
      n: `0${i + 1}`,
    }));
    for (const b of bBoxes) {
      ctx.fillStyle = "#FFFDF9";
      ctx.strokeStyle = "#D4C9BA";
      ctx.lineWidth = 1;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(b.x + b.w - 24, b.y + (b.h - 14) / 2, 14, 14);
      ctx.fillStyle = INK;
      ctx.font = "700 12px Outfit, sans-serif";
      ctx.fillText(b.n, b.x + 28, b.y + b.h * 0.6);
      ctx.fillStyle = "#CFC5B7";
      ctx.fillRect(b.x + 52, b.y + b.h * 0.44, Math.max(40, b.w - 92), 5);
    }

    const ptsB = bBoxes.map((b) => [b.x + 14, b.y + b.h / 2]);
    drawTrace(ctx, ptsB, samplePath(ptsB, p), ORANGE, false);

    if (statusEl) {
      const pct = Math.round(p * 100);
      if (pct !== lastStatusPct) {
        lastStatusPct = pct;
        statusEl.textContent =
          pct >= 100
            ? "动线回放完成（示意）：左图往返跨栏折跳 3 次，右图沿单一纵轴直落到底。"
            : `扫视动线示意回放中 ${pct}% · 左图折返跨栏 vs 右图单轴直落`;
      }
    }
  }

  function drawPanelFrame(c, r, title, titleColor) {
    c.save();
    c.fillStyle = "#F4ECE0";
    c.strokeStyle = "#B8AEA1";
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeRect(r.x, r.y, r.w, r.h);
    c.setLineDash([]);
    c.fillStyle = titleColor;
    c.font = "600 12px 'Noto Sans SC', sans-serif";
    c.fillText(title, r.x + 12, r.y + 22);
    c.restore();
  }

  function drawTrace(c, fullPts, { drawn, head }, color, dashed) {
    c.save();
    c.strokeStyle = color;
    c.globalAlpha = 0.24;
    c.lineWidth = 2;
    c.lineJoin = "round";
    c.lineCap = "round";
    if (dashed) c.setLineDash([5, 4]);
    c.beginPath();
    fullPts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
    c.stroke();

    c.globalAlpha = 1;
    c.strokeStyle = color;
    c.lineWidth = 2.6;
    if (dashed) c.setLineDash([6, 4]);
    c.beginPath();
    drawn.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
    c.stroke();
    c.setLineDash([]);

    c.fillStyle = "#FFFDF9";
    c.strokeStyle = color;
    c.lineWidth = 2.6;
    c.beginPath();
    c.arc(head[0], head[1], 5.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  }

  const { draw } = loop(canvas, (t, dt, { still }) => {
    if (still) {
      progress = 1;
      playing = false;
      drawScene(1);
      dirty = false;
      return;
    }
    if (playing) {
      progress += dt / DURATION;
      if (progress >= 1) {
        progress = 1;
        playing = false;
      }
      drawScene(progress);
      dirty = false;
    } else if (dirty) {
      drawScene(progress);
      dirty = false;
    }
  });

  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      if (reducedMotion.matches) {
        progress = 1;
        dirty = true;
        draw();
        return;
      }
      progress = 0;
      playing = true;
      dirty = true;
      draw();
    });
  }

  new ResizeObserver(() => {
    syncCanvasSize();
    draw();
  }).observe(canvas);
  syncCanvasSize();
  draw();
}
