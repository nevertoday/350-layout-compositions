import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { ARTWORKS, PALETTES, artworkSvgMarkup, drawArtwork } from "./artworks.js";
import {
  INITIAL_STATE,
  PRESET_SOLVED,
  SNAP_SCALE,
  SWEET_RATIO_MAX,
  SWEET_RATIO_MIN,
  clamp,
  evaluate,
} from "./model.js";

// 开场活体画廊策展墙：2D Canvas 主展画 + 中缝横向比例尺 (data-perf-drag) + 8 幅交互缩略阵 + 灯箱精看
export function initHero() {
  const root = document.getElementById("hero-section");
  const wallEl = document.getElementById("gallery-wall");
  const heroWrap = document.getElementById("hero-frame-wrap");
  const canvas = document.getElementById("hero-canvas");
  const railEl = document.getElementById("scale-rail");
  const thumbHandle = document.getElementById("scale-thumb");
  const railFill = document.getElementById("scale-fill");
  const railReadout = document.getElementById("scale-readout");
  const trayEl = document.getElementById("thumb-tray");

  // 左侧展签 / 标题示范微图 / 底部四栏原则带
  const statusPill = document.getElementById("hero-status-pill");
  const diagBox = document.getElementById("hero-diag");
  const diagBadge = document.getElementById("diag-badge");
  const diagHead = document.getElementById("diag-head");
  const diagBody = document.getElementById("diag-body");
  const diagHint = document.getElementById("diag-hint");
  const mRatio = document.getElementById("m-ratio");
  const mShare = document.getElementById("m-share");
  const mThumb = document.getElementById("m-thumb");
  const mVisible = document.getElementById("m-visible");
  const captionCode = document.getElementById("hero-art-code");
  const captionTitle = document.getElementById("hero-art-title");
  const miniSvg = document.getElementById("title-mini-diagram");
  const lightboxBtn = document.getElementById("open-art-lightbox");

  // 展画灯箱
  const artLb = document.getElementById("art-lightbox");
  const artLbCanvas = document.getElementById("art-lb-canvas");
  const artLbCode = document.getElementById("art-lb-code");
  const artLbTitle = document.getElementById("art-lb-title");
  const artLbNote = document.getElementById("art-lb-note");
  const artLbPrev = document.getElementById("art-lb-prev");
  const artLbNext = document.getElementById("art-lb-next");
  const artLbClose = document.getElementById("art-lb-close");

  if (!root || !wallEl || !canvas || !railEl || !trayEl) return;

  const ctx = canvas.getContext("2d");
  const state = { ...INITIAL_STATE };
  let animStart = 0; // 画作切换或开场动画的起始时间
  let animDur = 0.85;
  let dragging = false;
  let dirty = true;
  let lastT = 0;
  let lastWallW = 760;
  let lastWallH = 500;
  let lastThumbKey = "";

  function measureWall() {
    const r = wallEl.getBoundingClientRect();
    if (r.width > 120) lastWallW = r.width;
    // 手机竖屏与桌面横屏采用自然协调的展墙高度基准，防止拉扯变形
    const vw = window.innerWidth;
    if (vw <= 600) {
      lastWallH = Math.round(clamp(window.innerHeight * 0.37, 260, 316));
    } else if (window.innerHeight <= 440 && vw <= 920) {
      lastWallH = Math.round(clamp(window.innerHeight * 0.62, 210, 248));
    } else if (vw >= 1920) {
      lastWallH = Math.round(clamp(lastWallW * 0.56, 520, 610));
    } else {
      lastWallH = Math.round(clamp(lastWallW * 0.68, 430, 540));
    }
    return { w: lastWallW, h: lastWallH };
  }

  function renderCanvas(progress, ev) {
    const { g } = ev;
    const dpr = pixelRatio(window.innerWidth <= 600 ? 1.5 : 2);
    const boxW = Math.max(220, Math.round(heroWrap.clientWidth || lastWallW));
    const boxH = Math.max(96, g.heroBoxH);

    if (canvas.style.height !== `${boxH}px`) canvas.style.height = `${boxH}px`;
    const pw = Math.round(boxW * dpr);
    const ph = Math.round(boxH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, boxW, boxH);

    const pal = PALETTES[state.mood] || PALETTES.plum;
    // 主展框外尺寸（含卡纸），在展墙主画区居中落位
    const frameW = Math.min(boxW - 12, g.heroW);
    const frameH = Math.min(boxH - 12, g.heroH);
    const fx = Math.round((boxW - frameW) / 2);
    const fy = Math.round((boxH - frameH) / 2);

    // 展墙微落影（仅非过曝白墙有柔和立体落影）
    if (state.mood !== "washed") {
      ctx.fillStyle = state.mood === "stone" ? "rgba(45, 22, 36, 0.14)" : "rgba(18, 5, 15, 0.42)";
      ctx.fillRect(fx + 5, fy + 6, frameW, frameH);
    }

    // 暖米卡纸外框（Passe-partout）
    const mat = g.matPx;
    if (mat > 0) {
      ctx.fillStyle = pal.mat;
      ctx.fillRect(fx, fy, frameW, frameH);
      // 极细内卡纸切口阴影线
      ctx.strokeStyle = state.mood === "stone" ? "rgba(53,20,44,0.18)" : "rgba(63,25,53,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + mat - 0.5, fy + mat - 0.5, frameW - mat * 2 + 1, frameH - mat * 2 + 1);
    }

    // 内画心
    const ix = fx + mat;
    const iy = fy + mat;
    const iw = Math.max(40, frameW - mat * 2);
    const ih = Math.max(40, frameH - mat * 2);
    drawArtwork(ctx, ix, iy, iw, ih, state.active, state.mood, progress);

    // 若惨白过曝，画出一道微弱虚线提醒画边正在溶入白墙
    if (state.mood === "washed") {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(184, 59, 46, 0.48)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, fy + 0.5, frameW - 1, frameH - 1);
      ctx.restore();
    }

    // 当处于平权退化或拖动校准时，在左侧留白处画出精致的建筑标尺线 + 单枚缩略体量对比框
    const sideRoom = fx - 12;
    if (sideRoom >= 56 && (dragging || !ev.pillars.select.ok)) {
      const refW = clamp(g.thumbW * 0.45, 18, Math.min(sideRoom - 10, 56));
      const refH = clamp(g.thumbH * 0.45, 14, Math.min(frameH - 18, 52));
      const rx = fx - refW - 12;
      const ry = fy + frameH - refH;
      ctx.save();
      ctx.strokeStyle = ev.pillars.select.ok
        ? state.mood === "stone" || state.mood === "washed"
          ? "rgba(29,107,74,0.72)"
          : "rgba(146,223,184,0.78)"
        : state.mood === "stone" || state.mood === "washed"
        ? "rgba(184,59,46,0.78)"
        : "rgba(246,155,131,0.85)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(rx + 0.5, ry + 0.5, refW, refH);
      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '600 10px "Space Grotesk", "Noto Sans SC", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(state.preview === "dots" ? "盲翻" : `${g.areaRatio}×`, fx - 12, ry - 5);
      ctx.restore();
    }

    // 展框右上角极克制的馆藏标号（仅联动开启时同步亮出珊瑚色标点）
    if (state.sync && frameW >= 150) {
      const bx = fx + frameW - (mat > 0 ? mat + 6 : 6);
      const by = fy + (mat > 0 ? mat + 6 : 6);
      ctx.save();
      ctx.fillStyle = "rgba(45, 16, 38, 0.84)";
      ctx.fillRect(bx - 42, by, 42, 18);
      ctx.fillStyle = "#F7E3CE";
      ctx.font = '600 10px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${ARTWORKS[state.active].code}/08`, bx - 21, by + 9.5);
      ctx.restore();
    }

    ctx.restore();
  }

  function renderMiniTitleDiagram(ev) {
    if (!miniSvg) return;
    const { g } = ev;
    const heroH = Math.round(clamp(g.heroSharePct * 0.52, 14, 42));
    const thumbY = heroH + 6;
    const thumbH = Math.max(6, Math.round((56 - thumbY) / (g.rows === 2 ? 2 : 1)) - 2);
    const activeStroke = state.sync ? "#F69B83" : "#F7E3CE";
    let thumbs = "";
    if (state.preview === "dots") {
      for (let i = 0; i < 8; i++) {
        thumbs += `<circle cx="${10 + i * 11}" cy="${thumbY + 6}" r="${i === state.active && state.sync ? 3 : 2}" fill="${i === state.active && state.sync ? "#F69B83" : "#A76C79"}"/>`;
      }
    } else {
      const count = g.visibleThumbs;
      const cols = Math.ceil(g.cols);
      const cw = (84 - (cols - 1) * 3) / cols;
      for (let i = 0; i < count; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = 6 + c * (cw + 3);
        const y = thumbY + r * (thumbH + 3);
        const isSel = i === state.active && state.sync;
        thumbs += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${thumbH}" fill="${isSel ? "#F69B83" : "#F7E3CE"}" fill-opacity="${isSel ? 1 : 0.45}"/>`;
      }
    }
    miniSvg.innerHTML = `
      <rect x="6" y="4" width="84" height="${heroH}" fill="#F7E3CE" fill-opacity="0.18" stroke="${activeStroke}" stroke-width="1.5"/>
      <circle cx="62" cy="${Math.round(4 + heroH * 0.38)}" r="${Math.max(3, Math.round(heroH * 0.16))}" fill="#F07868"/>
      ${thumbs}`;
  }

  function rebuildThumbTray(ev) {
    const { g } = ev;
    // 只在结构/氛围/选中态变化时重建或局部更新缩略图 DOM，拖比例尺时只改高度尺寸（超快）
    const key = `${state.preview}|${state.mood}|${state.sync}|${state.active}`;
    trayEl.dataset.mode = state.preview;
    trayEl.dataset.mood = state.mood;
    trayEl.style.setProperty("--tray-gap", `${g.gapPx}px`);
    trayEl.style.setProperty("--thumb-h", `${g.thumbH}px`);
    trayEl.style.setProperty("--thumb-mat", `${Math.max(0, Math.round(g.matPx * 0.48))}px`);
    const tightH = state.preview === "dots" ? 64 : g.rows * g.thumbH + (g.rows - 1) * g.gapPx;
    trayEl.style.minHeight = `${tightH}px`;

    if (key === lastThumbKey) return;
    lastThumbKey = key;

    if (state.preview === "dots") {
      trayEl.innerHTML = `
        <div class="dots-bar" role="group" aria-label="仅圆点盲翻导航">
          <div class="dots-row">
            ${ARTWORKS.map(
              (a, i) => `
              <button type="button" class="dot-btn ${i === state.active && state.sync ? "is-active" : ""}" data-art="${i}" aria-label="切换至第 ${a.code} 幅：${a.title}" aria-pressed="${i === state.active}">
                <span class="dot-core"></span>
              </button>`
            ).join("")}
          </div>
          <p class="dots-note">只见 8 枚圆点，看不到画面内容（仍可盲点切图）</p>
        </div>`;
      return;
    }

    const list = state.preview === "truncate" ? ARTWORKS.slice(0, 4) : ARTWORKS;
    const isStrip = state.preview === "strip";
    const cards = list
      .map((a, i) => {
        const isSel = state.sync && i === state.active;
        return `
          <button type="button" class="thumb-card ${isSel ? "is-selected" : ""}" data-art="${i}" aria-label="选择第 ${a.code} 幅：${a.title}" aria-pressed="${i === state.active}">
            <span class="thumb-art">${artworkSvgMarkup(i, state.mood)}</span>
            <span class="thumb-idx" aria-hidden="true">${a.code}</span>
          </button>`;
      })
      .join("");

    if (isStrip) {
      trayEl.innerHTML = `
        <div class="strip-shell">
          <div class="strip-scroll" role="group" aria-label="带余量提示的横向缩略胶片带">${cards}</div>
          <div class="strip-badge" aria-label="共 8 幅，滑动可看其余作品">
            <span class="strip-fade" aria-hidden="true"></span>
            <span class="strip-pill">+3 · 共 8 幅 →</span>
          </div>
        </div>`;
      // 自动把当前选中缩略图滚入胶片带视野
      const activeBtn = trayEl.querySelector(`[data-art="${state.active}"]`);
      if (activeBtn) activeBtn.scrollIntoView({ behavior: "instant", inline: "nearest", block: "nearest" });
    } else {
      trayEl.innerHTML = `<div class="thumb-grid ${state.preview === "truncate" ? "is-truncated" : ""}" role="group" aria-label="画廊缩略预览">${cards}</div>`;
    }
  }

  function updateUI(ev) {
    const { g, pillars, passed, severity, badge, headline, body, hint } = ev;
    const art = ARTWORKS[state.active];

    wallEl.dataset.mood = state.mood;
    root.dataset.severity = severity;

    // 比例尺视觉同步
    const pct = Math.round(state.scale * 100);
    thumbHandle.style.left = `${pct}%`;
    railFill.style.width = `${pct}%`;
    railEl.setAttribute("aria-valuenow", String(pct));
    railEl.setAttribute(
      "aria-valuetext",
      state.preview === "dots" ? `主图占展墙 ${g.heroSharePct}%` : `主图约为缩略图 ${g.areaRatio} 倍，主图占 ${g.heroSharePct}%`
    );
    railReadout.textContent =
      state.preview === "dots"
        ? `主图占 ${g.heroSharePct}% · 缩略已隐`
        : `${g.areaRatio}× · 主图 ${g.heroSharePct}% · 缩略 ${g.thumbMinSide}px`;
    railReadout.dataset.state = pillars.select.ok ? "ok" : "bad";

    // 主画展签
    if (captionCode) captionCode.textContent = state.sync ? `NO. ${art.code} / 08` : "NO. ?? / ??";
    if (captionTitle) captionTitle.textContent = `${art.title} · ${art.tag}`;

    // 状态胶囊与展签诊单
    if (statusPill) {
      statusPill.textContent = badge;
      statusPill.dataset.severity = severity;
    }
    if (diagBox) diagBox.dataset.severity = severity;
    if (diagBadge) diagBadge.textContent = badge;
    if (diagHead) diagHead.textContent = headline;
    if (diagBody) diagBody.textContent = body;
    if (diagHint) diagHint.textContent = hint;

    // 4 个单一真源实测指标
    if (mRatio) mRatio.textContent = state.preview === "dots" ? "无对照" : `${g.areaRatio}×`;
    if (mShare) mShare.textContent = `${g.heroSharePct}%`;
    if (mThumb) mThumb.textContent = state.preview === "dots" ? "0 px" : `${g.thumbW}×${g.thumbH}`;
    if (mVisible) {
      mVisible.textContent =
        state.preview === "dots"
          ? "0 / 8（圆点）"
          : state.preview === "truncate"
          ? "4 / 8（暗藏4）"
          : state.preview === "strip"
          ? "5+3 / 8（明示）"
          : "8 / 8（全览）";
    }

    // 按钮按下态同步
    root.querySelectorAll("[data-preview]").forEach((b) => {
      const on = b.dataset.preview === state.preview;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    root.querySelectorAll("[data-sync]").forEach((b) => {
      const on = (b.dataset.sync === "on") === state.sync;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    root.querySelectorAll("[data-mood]").forEach((b) => {
      const on = b.dataset.mood === state.mood;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    // 原海报底沿四栏原则灯（预览 / 浏览 / 选择 / 氛围）
    for (const [key, info] of Object.entries(pillars)) {
      const cell = root.querySelector(`[data-pillar="${key}"]`);
      if (!cell) continue;
      cell.dataset.ok = info.ok ? "yes" : "no";
      const tag = cell.querySelector(".pillar-state");
      if (tag) tag.textContent = info.tag;
    }

    rebuildThumbTray(ev);
    renderMiniTitleDiagram(ev);
  }

  function applyState(triggerAnim = false) {
    if (triggerAnim) {
      animStart = lastT;
      animDur = 0.42;
    }
    const { w, h } = measureWall();
    const ev = evaluate(state, w, h);
    updateUI(ev);
    dirty = true;
    ctrl.draw();
  }

  // 主循环：静止时零无效重绘；开场入场、换画与拖比例尺时顺滑满帧
  const ctrl = loop(wallEl, (t, _dt, { still }) => {
    lastT = t;
    const elapsed = t - animStart;
    const animating = !still && elapsed < animDur;
    if (!dirty && !animating && !still) return;

    const { w, h } = measureWall();
    const ev = evaluate(state, w, h);
    const progress = still ? 1 : clamp(elapsed / animDur, 0, 1);
    renderCanvas(progress, ev);
    dirty = false;
  });

  // 缩略图 / 圆点点击委托
  trayEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-art]");
    if (!btn) return;
    const idx = Number(btn.dataset.art);
    if (Number.isFinite(idx) && idx >= 0 && idx < ARTWORKS.length) {
      state.active = idx;
      applyState(true);
    }
  });

  // 三组策展开关与快捷动作
  root.addEventListener("click", (e) => {
    const pBtn = e.target.closest("[data-preview]");
    if (pBtn) {
      state.preview = pBtn.dataset.preview;
      if (state.preview === "truncate" && state.active > 3) state.active = 0;
      applyState(false);
      return;
    }
    const sBtn = e.target.closest("[data-sync]");
    if (sBtn) {
      state.sync = sBtn.dataset.sync === "on";
      applyState(false);
      return;
    }
    const mBtn = e.target.closest("[data-mood]");
    if (mBtn) {
      state.mood = mBtn.dataset.mood;
      applyState(false);
      return;
    }
    if (e.target.closest("#btn-reset-broken")) {
      Object.assign(state, INITIAL_STATE);
      applyState(true);
      return;
    }
    if (e.target.closest("#btn-apply-reference")) {
      Object.assign(state, PRESET_SOLVED);
      applyState(true);
      return;
    }
  });

  // 横向比例尺直拖（同时兼容 Pointer 与 Touch，供真手与 perf.mjs 测试丝滑重绘）
  function setScaleFromClientX(clientX, allowSnap = false) {
    const r = railEl.getBoundingClientRect();
    if (r.width <= 0) return;
    let v = clamp((clientX - r.left) / r.width, 0, 1);
    if (allowSnap && Math.abs(v - SNAP_SCALE) < 0.022) v = SNAP_SCALE;
    if (Math.abs(v - state.scale) < 0.001) return;
    state.scale = v;
    const { w, h } = measureWall();
    const ev = evaluate(state, w, h);
    updateUI(ev);
    dirty = true;
    renderCanvas(1, ev);
  }

  railEl.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    railEl.classList.add("is-dragging");
    try {
      railEl.setPointerCapture(e.pointerId);
    } catch {}
    setScaleFromClientX(e.clientX, false);
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setScaleFromClientX(e.clientX, false);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    railEl.classList.remove("is-dragging");
    if (Math.abs(state.scale - SNAP_SCALE) < 0.024) state.scale = SNAP_SCALE;
    applyState(false);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // 显式监听 touch 事件，确保纯 CDP touchMove 也能同步重绘
  railEl.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      dragging = true;
      railEl.classList.add("is-dragging");
      setScaleFromClientX(e.touches[0].clientX, false);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || !e.touches.length) return;
      setScaleFromClientX(e.touches[0].clientX, false);
    },
    { passive: true }
  );
  window.addEventListener("touchend", endDrag, { passive: true });
  window.addEventListener("touchcancel", endDrag, { passive: true });

  // 键盘操作：比例尺支持左右键调节；展墙聚焦或灯箱打开时左右键切画
  railEl.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.1 : 0.04;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.scale = clamp(state.scale - step, 0, 1);
      applyState(false);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.scale = clamp(state.scale + step, 0, 1);
      applyState(false);
    }
  });

  // 展画灯箱精看
  function renderArtLightbox() {
    if (!artLbCanvas) return;
    const art = ARTWORKS[state.active];
    const lctx = artLbCanvas.getContext("2d");
    const size = 480;
    const dpr = pixelRatio(2);
    artLbCanvas.width = size * dpr;
    artLbCanvas.height = size * dpr;
    lctx.save();
    lctx.scale(dpr, dpr);
    const moodForLb = state.mood === "clash" || state.mood === "washed" ? state.mood : state.mood;
    const pal = PALETTES[moodForLb] || PALETTES.plum;
    lctx.fillStyle = moodForLb === "clash" ? "#261221" : pal.mat;
    lctx.fillRect(0, 0, size, size);
    const pad = moodForLb === "clash" || moodForLb === "washed" ? 0 : 28;
    drawArtwork(lctx, pad, pad, size - pad * 2, size - pad * 2, state.active, moodForLb, 1);
    lctx.restore();

    if (artLbCode) artLbCode.textContent = `EXHIBIT ${art.code} / 08 · ${art.en}`;
    if (artLbTitle) artLbTitle.textContent = `${art.title}（${art.tag}）`;
    if (artLbNote) artLbNote.textContent = art.caption;
  }

  function openArtLightbox() {
    if (!artLb) return;
    renderArtLightbox();
    artLb.hidden = false;
    document.body.style.overflow = "hidden";
    artLbClose?.focus();
  }
  function closeArtLightbox() {
    if (!artLb || artLb.hidden) return;
    artLb.hidden = true;
    document.body.style.overflow = "";
    lightboxBtn?.focus();
  }

  lightboxBtn?.addEventListener("click", openArtLightbox);
  canvas.addEventListener("dblclick", openArtLightbox);
  artLbClose?.addEventListener("click", closeArtLightbox);
  artLb?.addEventListener("click", (e) => {
    if (e.target === artLb) closeArtLightbox();
  });
  artLbPrev?.addEventListener("click", () => {
    state.active = (state.active + ARTWORKS.length - 1) % ARTWORKS.length;
    applyState(true);
    renderArtLightbox();
  });
  artLbNext?.addEventListener("click", () => {
    state.active = (state.active + 1) % ARTWORKS.length;
    applyState(true);
    renderArtLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (artLb && !artLb.hidden) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeArtLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        state.active = (state.active + ARTWORKS.length - 1) % ARTWORKS.length;
        applyState(true);
        renderArtLightbox();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        state.active = (state.active + 1) % ARTWORKS.length;
        applyState(true);
        renderArtLightbox();
      }
      return;
    }
    if (wallEl.contains(document.activeElement) && document.activeElement !== railEl) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        state.active = (state.active + ARTWORKS.length - 1) % ARTWORKS.length;
        applyState(true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        state.active = (state.active + 1) % ARTWORKS.length;
        applyState(true);
      }
    }
  });

  // 响应尺寸变化
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => applyState(false), 80);
  });

  // 初始绘制（开场 0.9s 内展开舒适入场动画，若开减少动态效果则一步到位）
  applyState(true);
  if (reducedMotion.matches) ctrl.draw();
}
