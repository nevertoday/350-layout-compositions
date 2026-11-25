// 开场主角玩具：活体稿纸与双页版心裁定台（2D Canvas）
// 直接承袭 194 原海报的稿纸细方格、朱砂虚线尺寸箭、古苔圆徽与翻开书页母题。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  PRESETS,
  SAMPLE_PARAGRAPHS,
  clamp,
  computeStageLayout,
  constrainMargins,
  createInitialState,
  evaluateManuscript,
  pct,
  snapMargin,
  wrapChineseParagraphs,
} from "./model.js";

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  const state = createInitialState();
  // 视觉插值状态（让切换模式与开场丝滑落位；拖动时即时贴手）
  const anim = {
    top: state.top,
    bottom: state.bottom,
    inner: state.inner,
    outer: state.outer,
    intro: 0,
    pulse: 0,
  };

  let layout = null;
  let drag = null;
  let hoverEdge = null;
  let snappedEdge = null;
  let snapFlash = 0;
  let dirty = true;
  let currentDpr = 1;

  // 正文排字离屏缓存：避免慢手机软件渲染拖动时每帧重复栅格化数百个楷体汉字
  const textCache = {
    canvas: document.createElement("canvas"),
    ctx: null,
    key: "",
    w: 0,
    h: 0,
    cssW: 0,
    cssH: 0,
  };
  textCache.ctx = textCache.canvas.getContext("2d");

  // DOM 引用
  const els = {
    sealStatus: document.getElementById("hero-seal-status"),
    diagTag: document.getElementById("diag-tag"),
    diagHead: document.getElementById("diag-headline"),
    diagReason: document.getElementById("diag-reason"),
    diagAction: document.getElementById("diag-action"),
    mWhitespace: document.getElementById("m-whitespace"),
    mMeasure: document.getElementById("m-measure"),
    mRatio: document.getElementById("m-ratio"),
    mArea: document.getElementById("m-area"),
    edgeReadout: document.getElementById("edge-readout"),
    leadingInput: document.getElementById("ctrl-leading"),
    leadingOut: document.getElementById("ctrl-leading-val"),
    titleFrame: document.getElementById("title-demo-frame"),
    principles: [...document.querySelectorAll(".principle-item")],
    viewBtns: [...document.querySelectorAll("[data-hero-view]")],
    formatBtns: [...document.querySelectorAll("[data-hero-format]")],
    clutterBtn: document.getElementById("btn-clutter"),
    canonBtn: document.getElementById("btn-canon"),
    thumbBtn: document.getElementById("btn-thumbs"),
    resetBtn: document.getElementById("btn-reset"),
    edgeBtns: [...document.querySelectorAll("[data-edge-select]")],
    edgeMinus: document.getElementById("btn-edge-minus"),
    edgePlus: document.getElementById("btn-edge-plus"),
  };

  // 画布高分屏尺寸同步（手机端按 GUIDE 规范上限 1.5×，桌面 2×，仅在尺寸变化时重设）
  let cw = 640;
  let ch = 540;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh || currentDpr !== dpr) {
      canvas.width = nw;
      canvas.height = nh;
      currentDpr = dpr;
      textCache.key = "";
      dirty = true;
    }
    cw = rect.width;
    ch = rect.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function markDirty(immediate = false) {
    dirty = true;
    if (immediate || reducedMotion.matches) stageLoop.draw();
  }

  // 把最新单一真源状态同步到所有 HUD 文本、标题微缩示范框与五项原则圆徽
  function syncUI() {
    const ev = evaluateManuscript(state);

    if (els.sealStatus) {
      els.sealStatus.textContent = `${ev.score} / 5 ${ev.score === 5 ? "已校定" : "待校版"}`;
      els.sealStatus.dataset.pass = ev.score === 5 ? "1" : "0";
    }
    if (els.diagTag) {
      els.diagTag.textContent = ev.verdictTag;
      els.diagTag.dataset.pass = ev.score === 5 ? "1" : "0";
    }
    if (els.diagHead) els.diagHead.textContent = ev.headline;
    if (els.diagReason) els.diagReason.textContent = ev.reason;
    if (els.diagAction) els.diagAction.textContent = ev.action;

    if (els.mWhitespace) els.mWhitespace.textContent = `${Math.round(ev.whitespaceFrac * 100)}%`;
    if (els.mMeasure) els.mMeasure.textContent = `${ev.charsPerLine} 字/行`;
    if (els.mRatio) els.mRatio.textContent = ev.ratioTuple.join(":");
    if (els.mArea) els.mArea.textContent = `${Math.round(ev.textAreaFrac * 100)}%`;

    if (els.leadingInput) els.leadingInput.value = String(state.leading);
    if (els.leadingOut) els.leadingOut.textContent = `${state.leading.toFixed(2)}×`;

    // 标题自身微缩示范框随四边距实时呼吸（标题即示范）
    if (els.titleFrame) {
      els.titleFrame.style.setProperty("--m-t", `${(state.top * 100).toFixed(1)}%`);
      els.titleFrame.style.setProperty("--m-b", `${(state.bottom * 100).toFixed(1)}%`);
      els.titleFrame.style.setProperty("--m-l", `${(state.inner * 100).toFixed(1)}%`);
      els.titleFrame.style.setProperty("--m-r", `${(state.outer * 100).toFixed(1)}%`);
    }

    // 更新 5 枚原海报古苔圆徽原则列
    els.principles.forEach((row, idx) => {
      const chk = ev.checks[idx];
      if (!chk) return;
      row.dataset.ok = chk.ok ? "1" : "0";
      row.dataset.focus = state.focusPrinciple === idx + 1 ? "1" : "0";
      row.setAttribute("aria-pressed", state.focusPrinciple === idx + 1 ? "true" : "false");
      const statusEl = row.querySelector(".principle-verdict");
      if (statusEl) statusEl.textContent = chk.short;
    });

    // 同步按钮激活态
    els.viewBtns.forEach((b) => {
      const on = b.dataset.heroView === state.view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    els.formatBtns.forEach((b) => {
      const on = b.dataset.heroFormat === state.format;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (els.clutterBtn) {
      els.clutterBtn.classList.toggle("is-active", !state.clutter);
      els.clutterBtn.setAttribute("aria-pressed", String(!state.clutter));
      els.clutterBtn.textContent = state.clutter ? "干扰插块：开" : "干扰插块：关";
    }
    if (els.canonBtn) {
      els.canonBtn.classList.toggle("is-active", state.showCanon);
      els.canonBtn.setAttribute("aria-pressed", String(state.showCanon));
    }
    if (els.thumbBtn) {
      els.thumbBtn.classList.toggle("is-active", state.showThumbs);
      els.thumbBtn.setAttribute("aria-pressed", String(state.showThumbs));
    }

    // 边界微调器标签（单页叫左/右，对开叫内/外；紧凑不裁切）
    const edgeNames =
      state.view === "spread"
        ? { top: "天头", bottom: "地脚", inner: "订口", outer: "切口" }
        : { top: "上边", bottom: "下边", inner: "左边", outer: "右边" };
    els.edgeBtns.forEach((b) => {
      const k = b.dataset.edgeSelect;
      const on = k === state.activeEdge;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = `${edgeNames[k]} ${pct(state[k])}`;
    });
    if (els.edgeReadout) {
      els.edgeReadout.textContent = `${edgeNames[state.activeEdge]} ${pct(state[state.activeEdge])}`;
    }
  }

  // 绘制双向朱砂虚线尺寸箭（原海报同款视觉母题）
  function drawDimArrow(x1, y1, x2, y2, label, active, warn, isVert) {
    const color = active ? PALETTE.cinnabar : warn ? PALETTE.cinnabarBright : PALETTE.olive;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = active ? 1.8 : 1.15;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 箭头端点
    const head = 4.6;
    const drawTip = (x, y, ang) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang + 2.55) * head, y + Math.sin(ang + 2.55) * head);
      ctx.lineTo(x + Math.cos(ang - 2.55) * head, y + Math.sin(ang - 2.55) * head);
      ctx.closePath();
      ctx.fill();
    };
    const ang = Math.atan2(y2 - y1, x2 - x1);
    if (Math.hypot(x2 - x1, y2 - y1) > 12) {
      drawTip(x1, y1, ang + Math.PI);
      drawTip(x2, y2, ang);
    }

    // 清晰高对比文字牌（不与线重叠，并预留底沿提示行高度）
    ctx.font = `400 11px "Space Mono", "Noto Serif SC", serif`;
    const tw = ctx.measureText(label).width;
    let lx = (x1 + x2) / 2;
    let ly = (y1 + y2) / 2;
    if (isVert) {
      ly = y1 < layout.primary.y + layout.primary.h * 0.5 ? y1 - 16 : y2 + 16;
    } else {
      const onLeft = x1 < layout.primary.x + layout.primary.w * 0.5;
      lx = onLeft ? Math.max(tw / 2 + 6, x1 - tw / 2 - 8) : Math.min(cw - tw / 2 - 6, x2 + tw / 2 + 8);
    }
    // 防越界（底部保留 26px 给底沿提示语，不互相压叠）
    lx = clamp(lx, tw / 2 + 6, cw - tw / 2 - 6);
    ly = clamp(ly, 14, ch - 26);

    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(lx - tw / 2 - 5, ly - 8.5, tw + 10, 17);
    if (active) {
      ctx.strokeStyle = PALETTE.cinnabar;
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - tw / 2 - 5, ly - 8.5, tw + 10, 17);
    }
    ctx.fillStyle = warn || active ? PALETTE.cinnabar : PALETTE.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx, ly + 0.5);
    ctx.restore();
  }

  // 绘制单个书页（稿纸细格 + 外延虚线 + 正文流 + 干扰块 + 页码）
  function drawPage(p, ev, renderState, reveal) {
    const t = p.text;
    const isLeftSpread = p.side === "left";

    // 1. 纸面底影与宣纸页身
    ctx.save();
    ctx.fillStyle = "rgba(38, 30, 16, 0.08)";
    ctx.fillRect(p.x + 3, p.y + 4, p.w, p.h);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // 留白区微高亮（当用户聚焦原则 01 留白为先）
    if (state.focusPrinciple === 1) {
      ctx.fillStyle = "rgba(100, 88, 40, 0.13)";
      ctx.fillRect(p.x, p.y, p.w, t.y - p.y); // 上
      ctx.fillRect(p.x, t.y + t.h, p.w, p.y + p.h - (t.y + t.h)); // 下
      ctx.fillRect(p.x, t.y, t.x - p.x, t.h); // 左
      ctx.fillRect(t.x + t.w, t.y, p.x + p.w - (t.x + t.w), t.h); // 右
    }

    // 2. 版心（正文区）底色 + 原海报同款稿纸细方格
    ctx.fillStyle = PALETTE.gridFill;
    ctx.fillRect(t.x, t.y, t.w, t.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(t.x, t.y, t.w, t.h);
    ctx.clip();

    const cell = clamp(p.w / 18, 9, 17);
    ctx.strokeStyle = PALETTE.gridLine;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    for (let x = t.x + cell; x < t.x + t.w; x += cell) {
      ctx.moveTo(Math.round(x) + 0.5, t.y);
      ctx.lineTo(Math.round(x) + 0.5, t.y + t.h);
    }
    for (let y = t.y + cell; y < t.y + t.h; y += cell) {
      ctx.moveTo(t.x, Math.round(y) + 0.5);
      ctx.lineTo(t.x + t.w, Math.round(y) + 0.5);
    }
    ctx.stroke();

    // 3. 正文真实排字（左页在双页模式模拟原海报 028 扉页「山川与风物」+ 留白，右页与单页排活体长文）
    const padIn = Math.max(4, t.w * 0.035);
    if (isLeftSpread) {
      // 致敬原海报 028 左页：简洁书名页 + 简墨远山剪影
      ctx.fillStyle = PALETTE.ink;
      const titleSize = clamp(t.w * 0.105, 11, 18);
      ctx.font = `600 ${titleSize}px "LXGW WenKai", "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const titleChars = [..."山川与风物"];
      const cx = t.x + t.w * 0.62;
      const startY = t.y + t.h * 0.24;
      const stepY = titleSize * 1.48;
      titleChars.forEach((chChar, i) => {
        ctx.fillText(chChar, cx, startY + i * stepY);
      });
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 ${Math.max(9.5, titleSize * 0.58)}px "LXGW WenKai", "Noto Serif SC", serif`;
      const authorChars = [..."林望舒 著"];
      authorChars.forEach((chChar, i) => {
        ctx.fillText(chChar, t.x + t.w * 0.34, t.y + t.h * 0.34 + i * titleSize * 0.92);
      });
      // 远山剪影（纯几何静雅层次，呼应原海报底图）
      ctx.fillStyle = "rgba(100, 88, 40, 0.16)";
      ctx.beginPath();
      ctx.moveTo(t.x, t.y + t.h);
      ctx.lineTo(t.x + t.w * 0.16, t.y + t.h * 0.78);
      ctx.lineTo(t.x + t.w * 0.36, t.y + t.h * 0.88);
      ctx.lineTo(t.x + t.w * 0.58, t.y + t.h * 0.80);
      ctx.lineTo(t.x + t.w * 0.82, t.y + t.h * 0.90);
      ctx.lineTo(t.x + t.w, t.y + t.h * 0.84);
      ctx.lineTo(t.x + t.w, t.y + t.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(73, 64, 26, 0.24)";
      ctx.beginPath();
      ctx.moveTo(t.x, t.y + t.h);
      ctx.lineTo(t.x + t.w * 0.24, t.y + t.h * 0.85);
      ctx.lineTo(t.x + t.w * 0.52, t.y + t.h * 0.94);
      ctx.lineTo(t.x + t.w * 0.76, t.y + t.h * 0.89);
      ctx.lineTo(t.x + t.w, t.y + t.h * 0.94);
      ctx.lineTo(t.x + t.w, t.y + t.h);
      ctx.closePath();
      ctx.fill();
    } else {
      // 实时重排正文（走离屏位图缓存，按单真源 activeChars / 宽度桶更新，慢机拖动 60fps 且字迹清晰）
      const activeChars = state.clutter ? ev.clutteredChars : ev.charsPerLine;
      const textAreaW = Math.max(40, (state.clutter ? t.w * 0.67 : t.w) - padIn * 2);
      const bucketW = drag ? Math.round(t.w / 10) * 10 : Math.round(t.w);
      const bucketH = drag ? Math.round(t.h / 12) * 12 : Math.round(t.h);
      const cacheKey = `${activeChars}|${bucketW}|${bucketH}|${renderState.leading.toFixed(2)}|${state.clutter ? 1 : 0}|${state.focusPrinciple === 2 ? (ev.checks[1].ok ? 2 : 1) : 0}|${currentDpr}`;

      if (textCache.key !== cacheKey) {
        const bwCss = Math.max(16, Math.ceil(t.w));
        const bhCss = Math.max(16, Math.ceil(t.h));
        const bwPx = Math.max(16, Math.ceil(bwCss * currentDpr));
        const bhPx = Math.max(16, Math.ceil(bhCss * currentDpr));
        if (textCache.canvas.width !== bwPx || textCache.canvas.height !== bhPx) {
          textCache.canvas.width = bwPx;
          textCache.canvas.height = bhPx;
        }
        const tctx = textCache.ctx;
        tctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
        tctx.clearRect(0, 0, bwCss, bhCss);

        const fontSize = clamp(textAreaW / Math.max(10, activeChars + 1.2), 4.6, 13.2);
        const maxFitChars = Math.max(8, Math.floor(textAreaW / (fontSize * 1.02)));
        const lines = wrapChineseParagraphs(SAMPLE_PARAGRAPHS, Math.min(activeChars, maxFitChars));
        const lineH = fontSize * renderState.leading;

        // 头部小书眉/红点标识（呼应原海报「• 正文区」）
        const headerY = padIn + 6;
        tctx.fillStyle = PALETTE.cinnabar;
        tctx.beginPath();
        tctx.arc(padIn + 4, headerY, 2.6, 0, Math.PI * 2);
        tctx.fill();
        tctx.font = `600 ${clamp(fontSize * 1.05, 8.5, 11.5)}px "Noto Serif SC", serif`;
        tctx.textAlign = "left";
        tctx.textBaseline = "middle";
        tctx.fillText("正文区 · 山川与风物", padIn + 11, headerY + 0.5);

        // 原则 02 高亮：行宽与行间舒适带
        const textStartY = headerY + Math.max(12, lineH * 1.05);
        if (state.focusPrinciple === 2) {
          tctx.fillStyle = ev.checks[1].ok ? PALETTE.olivePassSoft : PALETTE.cinnabarSoft;
          tctx.fillRect(padIn - 2, textStartY - fontSize * 0.6, textAreaW + 4, Math.min(t.h - 24, lineH * 5));
        }

        tctx.font = `400 ${fontSize.toFixed(2)}px "LXGW WenKai", "Noto Serif SC", serif`;
        tctx.fillStyle = PALETTE.ink;
        tctx.textBaseline = "top";
        let y = textStartY;
        const maxY = t.h - padIn - 4;
        for (const ln of lines) {
          if (y + fontSize > maxY) break;
          if (ln.gap) {
            y += lineH * 0.42;
            continue;
          }
          const x = padIn + (ln.indent ? fontSize * 2 : 0);
          tctx.fillText(ln.text, x, y);
          y += lineH;
        }

        // 干扰插块（错版打开时显示：不透明浅朱底，严格随盒宽缩字，绝不溢框）
        if (state.clutter) {
          const bx = t.w * 0.70;
          const bw = t.w * 0.28;
          const by = textStartY;
          const bh = Math.min(t.h * 0.56, Math.max(54, t.h * 0.44));
          tctx.fillStyle = "#F3E1DA";
          tctx.fillRect(bx, by, bw, bh);
          tctx.strokeStyle = PALETTE.cinnabar;
          tctx.lineWidth = 1.25;
          tctx.setLineDash([4, 2]);
          tctx.strokeRect(bx, by, bw, bh);
          tctx.setLineDash([]);
          tctx.fillStyle = PALETTE.cinnabar;
          const headFs = Math.min(clamp(bw * 0.20, 6, 11), Math.max(6, (bw - 6) / 4.3));
          const subText = bw < 48 ? "断单栏流" : "打断单栏流";
          const subFs = Math.min(clamp(bw * 0.15, 5.5, 9.5), Math.max(5.5, (bw - 6) / (subText.length * 1.06)));
          tctx.font = `700 ${headFs.toFixed(1)}px "Noto Serif SC", serif`;
          tctx.textAlign = "center";
          tctx.textBaseline = "middle";
          tctx.fillText("广告插块", bx + bw / 2, by + bh * 0.38);
          tctx.font = `400 ${subFs.toFixed(1)}px "Noto Serif SC", serif`;
          tctx.fillText(subText, bx + bw / 2, by + bh * 0.62);
        }

        textCache.key = cacheKey;
        textCache.w = bwPx;
        textCache.h = bhPx;
        textCache.cssW = bwCss;
        textCache.cssH = bhCss;
      }

      ctx.drawImage(textCache.canvas, 0, 0, textCache.w, textCache.h, t.x, t.y, textCache.cssW, textCache.cssH);
    }
    ctx.restore();

    // 4. 外延定位辅助线（复刻原海报版心四角延展到纸边的细褐线）
    ctx.strokeStyle = PALETTE.borderSoft;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(p.x, t.y); ctx.lineTo(p.x + p.w, t.y);
    ctx.moveTo(p.x, t.y + t.h); ctx.lineTo(p.x + p.w, t.y + t.h);
    ctx.moveTo(t.x, p.y); ctx.lineTo(t.x, p.y + p.h);
    ctx.moveTo(t.x + t.w, p.y); ctx.lineTo(t.x + t.w, p.y + p.h);
    ctx.stroke();

    // 5. 版心边框（按开场 reveal 逐段描边）
    ctx.strokeStyle = PALETTE.oliveDeep;
    ctx.lineWidth = 1.35;
    ctx.strokeRect(t.x, t.y, t.w * reveal, t.h * reveal);

    // 6. 页面外框
    ctx.strokeStyle = PALETTE.borderWarm;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    // 7. 书底页码（地脚偏窄时避开居中游标并清晰内退，不压外框线）
    const bottomStrip = p.y + p.h - (t.y + t.h);
    const folioTight = renderState.bottom < 0.12;
    const folioLabel = folioTight ? `${p.folio}!` : `— ${p.folio} —`;
    const folioFs = bottomStrip < 14 ? 8.5 : 9.5;
    ctx.font = `700 ${folioFs}px "Space Mono", monospace`;
    let folioX = folioTight ? Math.min(p.x + p.w - 22, t.x + t.w - 18) : p.x + p.w / 2;
    let folioY = folioTight
      ? (bottomStrip < 14 ? t.y + t.h - 9 : t.y + t.h + bottomStrip * 0.52)
      : t.y + t.h + bottomStrip * 0.54;
    if (folioTight && bottomStrip < 14) {
      const fw = ctx.measureText(folioLabel).width + 6;
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(folioX - fw / 2, folioY - 6, fw, 12);
    }
    ctx.fillStyle = folioTight ? PALETTE.cinnabar : PALETTE.inkMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(folioLabel, folioX, folioY);

    // 8. 原则 04 高亮：光学重心 vs 几何重心刻度
    if (state.focusPrinciple === 4 && !isLeftSpread) {
      const geoY = p.y + p.h * 0.5;
      const optY = t.y + t.h * 0.5;
      ctx.save();
      ctx.strokeStyle = PALETTE.olive;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(p.x + 6, geoY);
      ctx.lineTo(p.x + p.w - 6, geoY);
      ctx.stroke();
      ctx.strokeStyle = ev.checks[3].ok ? PALETTE.olivePass : PALETTE.cinnabar;
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x + 8, optY);
      ctx.lineTo(t.x + t.w - 8, optY);
      ctx.stroke();
      ctx.fillStyle = ev.checks[3].ok ? PALETTE.olivePass : PALETTE.cinnabar;
      ctx.font = `600 10px "Noto Serif SC", serif`;
      ctx.textAlign = "right";
      ctx.fillText(ev.centerLiftPct >= 1 ? "版心上托稳重" : "版心偏沉", t.x + t.w - 6, optY - 8);
      ctx.restore();
    }

    // 9. 拇指握持区（纯几何弧形，无拟人细节）
    if (state.showThumbs || (state.focusPrinciple === 5 && ev.thumb.covered)) {
      const hit = ev.thumb.covered;
      ctx.save();
      ctx.fillStyle = hit ? "rgba(144, 32, 4, 0.24)" : "rgba(60, 84, 38, 0.16)";
      ctx.strokeStyle = hit ? PALETTE.cinnabar : PALETTE.olivePass;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 3]);
      const thumbRx = p.w * 0.125;
      const thumbRy = p.h * 0.135;
      const drawThumb = (cx, cy, rot) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, thumbRx, thumbRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      if (isLeftSpread) {
        drawThumb(p.x + thumbRx * 0.55, p.y + p.h * 0.72, -0.2);
      } else {
        drawThumb(p.x + p.w - thumbRx * 0.55, p.y + p.h * 0.72, 0.2);
        if (state.view === "single") {
          drawThumb(p.x + thumbRx * 0.55, p.y + p.h * 0.72, -0.2);
        }
      }
      // 底部托手区
      ctx.beginPath();
      ctx.ellipse(p.x + p.w * 0.5, p.y + p.h - p.h * 0.055, p.w * 0.24, p.h * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // 绘制 Van de Graaf / 九分法古典对角辅助线
  function drawCanonOverlay(ly) {
    ctx.save();
    ctx.strokeStyle = "rgba(100, 88, 40, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    if (ly.view === "spread") {
      const b = ly.bounds;
      const [L, R] = ly.pages;
      // 双页大对角线 + 单页对角线
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.h); ctx.lineTo(b.x + b.w, b.y);
      ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y + b.h);
      ctx.moveTo(L.x, L.y + L.h); ctx.lineTo(L.x + L.w, L.y);
      ctx.moveTo(R.x, R.y); ctx.lineTo(R.x + R.w, R.y + R.h);
      ctx.stroke();
    } else {
      const p = ly.primary;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y + p.h);
      ctx.moveTo(p.x + p.w, p.y); ctx.lineTo(p.x, p.y + p.h);
      ctx.stroke();
    }
    // 目标理想版心虚线框
    ctx.strokeStyle = PALETTE.olivePass;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    for (const p of ly.pages) {
      ctx.strokeRect(p.canon.x, p.canon.y, p.canon.w, p.canon.h);
    }
    ctx.restore();
  }

  // 绘制四条可拖拽边界的游标把手（古苔/朱砂刻度滑块）
  function drawHandles(p) {
    const t = p.text;
    const handles = [
      { edge: "top", x: t.x + t.w / 2, y: t.y, horiz: true },
      { edge: "bottom", x: t.x + t.w / 2, y: t.y + t.h, horiz: true },
      { edge: "inner", x: t.x, y: t.y + t.h / 2, horiz: false },
      { edge: "outer", x: t.x + t.w, y: t.y + t.h / 2, horiz: false },
    ];
    for (const h of handles) {
      const isHot =
        (drag && (drag.edge === h.edge || (drag.edge === "bothX" && (h.edge === "inner" || h.edge === "outer")))) ||
        hoverEdge === h.edge ||
        state.activeEdge === h.edge;
      const isSnapped = snappedEdge === h.edge && snapFlash > 0;
      ctx.save();
      ctx.fillStyle = isSnapped ? PALETTE.olivePass : isHot ? PALETTE.cinnabar : PALETTE.olive;
      ctx.strokeStyle = PALETTE.paperLight;
      ctx.lineWidth = 1.5;
      const hw = h.horiz ? 26 : 9;
      const hh = h.horiz ? 9 : 26;
      ctx.fillRect(h.x - hw / 2, h.y - hh / 2, hw, hh);
      ctx.strokeRect(h.x - hw / 2, h.y - hh / 2, hw, hh);
      // 游标中央精细刻度线
      ctx.strokeStyle = PALETTE.paperLight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (h.horiz) {
        ctx.moveTo(h.x - 5, h.y); ctx.lineTo(h.x + 5, h.y);
      } else {
        ctx.moveTo(h.x, h.y - 5); ctx.lineTo(h.x, h.y + 5);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  function renderFrame(_t, dt, { still }) {
    if (still) {
      anim.intro = 1;
      anim.top = state.top;
      anim.bottom = state.bottom;
      anim.inner = state.inner;
      anim.outer = state.outer;
      snapFlash = 0;
      dirty = true;
    } else {
      const eps = 0.0004;
      const moving =
        anim.intro < 1 ||
        snapFlash > 0 ||
        Math.abs(state.top - anim.top) > eps ||
        Math.abs(state.bottom - anim.bottom) > eps ||
        Math.abs(state.inner - anim.inner) > eps ||
        Math.abs(state.outer - anim.outer) > eps;
      if (!dirty && !moving) return;

      anim.intro = Math.min(1, anim.intro + (dt || 0.016) * 2.2);
      const k = drag ? 1 : Math.min(1, (dt || 0.016) * 14);
      anim.top += (state.top - anim.top) * k;
      anim.bottom += (state.bottom - anim.bottom) * k;
      anim.inner += (state.inner - anim.inner) * k;
      anim.outer += (state.outer - anim.outer) * k;
      if (Math.abs(state.top - anim.top) <= eps) anim.top = state.top;
      if (Math.abs(state.bottom - anim.bottom) <= eps) anim.bottom = state.bottom;
      if (Math.abs(state.inner - anim.inner) <= eps) anim.inner = state.inner;
      if (Math.abs(state.outer - anim.outer) <= eps) anim.outer = state.outer;
      if (snapFlash > 0) snapFlash = Math.max(0, snapFlash - (dt || 0.016) * 2.5);
    }
    dirty = false;

    const rState = { ...state, top: anim.top, bottom: anim.bottom, inner: anim.inner, outer: anim.outer };
    layout = computeStageLayout(rState, cw, ch);
    const ev = evaluateManuscript(state);

    // 暖宣稿纸画台底色
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cw, ch);

    // 四角细微制图定位角标（呼应传统印刷版台，克制不喧宾）
    ctx.strokeStyle = "rgba(155, 136, 104, 0.35)";
    ctx.lineWidth = 1;
    const m = 10;
    const len = 10;
    ctx.beginPath();
    ctx.moveTo(m, m + len); ctx.lineTo(m, m); ctx.lineTo(m + len, m);
    ctx.moveTo(cw - m - len, m); ctx.lineTo(cw - m, m); ctx.lineTo(cw - m, m + len);
    ctx.moveTo(m, ch - m - len); ctx.lineTo(m, ch - m); ctx.lineTo(m + len, ch - m);
    ctx.moveTo(cw - m - len, ch - m); ctx.lineTo(cw - m, ch - m); ctx.lineTo(cw - m, ch - m - len);
    ctx.stroke();

    const reveal = 1 - Math.pow(1 - anim.intro, 3);

    // 绘制书页
    for (const p of layout.pages) {
      drawPage(p, ev, rState, reveal);
    }

    // 双页对开时的书脊装订阴影与中缝合计标尺
    if (layout.view === "spread") {
      const sx = layout.spineX;
      const by = layout.bounds.y;
      const bh = layout.bounds.h;
      const grad = ctx.createLinearGradient(sx - 16, 0, sx + 16, 0);
      grad.addColorStop(0, "rgba(27,25,21,0)");
      grad.addColorStop(0.46, "rgba(27,25,21,0.12)");
      grad.addColorStop(0.5, "rgba(27,25,21,0.28)");
      grad.addColorStop(0.54, "rgba(27,25,21,0.10)");
      grad.addColorStop(1, "rgba(27,25,21,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(sx - 16, by, 32, bh);

      // 中缝合计提示条（内距 × 2）
      const spineWarn = state.outer < state.inner + 0.04;
      const sw = rState.inner * layout.pageW * 2;
      if (state.focusPrinciple === 4 || spineWarn) {
        ctx.fillStyle = spineWarn ? "rgba(144,32,4,0.12)" : "rgba(60,84,38,0.10)";
        ctx.fillRect(sx - sw / 2, by, sw, bh);
      }
    }

    // 古典九分对角线层
    if (state.showCanon || state.focusPrinciple === 5) {
      drawCanonOverlay(layout);
    }

    // 主书页四条朱砂尺寸箭（与 194 原海报一致）
    const p = layout.primary;
    const t = p.text;
    const isSpread = layout.view === "spread";
    drawDimArrow(
      t.x + t.w * 0.5, p.y, t.x + t.w * 0.5, t.y,
      `${isSpread ? "天" : "上"} ${pct(state.top)}`,
      drag?.edge === "top" || state.activeEdge === "top",
      state.top < 0.10,
      true
    );
    drawDimArrow(
      t.x + t.w * 0.5, t.y + t.h, t.x + t.w * 0.5, p.y + p.h,
      `${isSpread ? "地" : "下"} ${pct(state.bottom)}`,
      drag?.edge === "bottom" || state.activeEdge === "bottom",
      state.bottom < 0.14 || state.bottom <= state.top + 0.02,
      true
    );
    drawDimArrow(
      p.x, t.y + t.h * 0.5, t.x, t.y + t.h * 0.5,
      `${isSpread ? "内" : "左"} ${pct(state.inner)}`,
      drag?.edge === "inner" || drag?.edge === "bothX" || state.activeEdge === "inner",
      isSpread ? state.inner > state.outer - 0.04 || state.inner < 0.085 : state.inner < 0.12,
      false
    );
    drawDimArrow(
      t.x + t.w, t.y + t.h * 0.5, p.x + p.w, t.y + t.h * 0.5,
      `${isSpread ? "外" : "右"} ${pct(state.outer)}`,
      drag?.edge === "outer" || drag?.edge === "bothX" || state.activeEdge === "outer",
      isSpread ? state.outer < 0.16 : state.outer < 0.12,
      false
    );

    // 四边拖拽游标
    drawHandles(p);

    // 底部轻量操作提示（向右避让左下定位角标，留出清爽间隙）
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = `400 ${cw < 360 ? 10 : 11}px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const hint = isSpread
      ? "拖四边游标调内外天地 · 版心内左右拖改行宽"
      : "拖四边游标裁边距 · 版心内左右拖同步收放留白";
    ctx.fillText(hint, 25, ch - 8);
  }

  const stageLoop = loop(canvas, renderFrame);

  // 命中检测：优先判定四条边距边框，否则判定版心内部（横向拖同步调左右边距）
  function hitTest(x, y) {
    if (!layout) return null;
    const p = layout.primary;
    const t = p.text;
    const tol = 22;

    const dTop = Math.abs(y - t.y);
    const dBot = Math.abs(y - (t.y + t.h));
    const dIn = Math.abs(x - t.x);
    const dOut = Math.abs(x - (t.x + t.w));

    const inX = x >= t.x - tol && x <= t.x + t.w + tol;
    const inY = y >= t.y - tol && y <= t.y + t.h + tol;

    const cand = [];
    if (inX && dTop <= tol) cand.push({ edge: "top", d: dTop });
    if (inX && dBot <= tol) cand.push({ edge: "bottom", d: dBot });
    if (inY && dIn <= tol) cand.push({ edge: "inner", d: dIn });
    if (inY && dOut <= tol) cand.push({ edge: "outer", d: dOut });
    if (cand.length) {
      cand.sort((a, b) => a.d - b.d);
      return cand[0].edge;
    }
    // 点击落在书页区域内：横向拖拽同步收放左右边距（方便手机触屏与 perf 拖动测帧）
    if (x >= layout.bounds.x - 16 && x <= layout.bounds.x + layout.bounds.w + 16 && y >= layout.bounds.y - 12 && y <= layout.bounds.y + layout.bounds.h + 12) {
      return "bothX";
    }
    return null;
  }

  function pointerCoords(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function applyDragDelta(x, y) {
    if (!drag || !layout) return;
    const p = layout.primary;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    snappedEdge = null;

    if (drag.edge === "top") {
      const raw = clamp(drag.start.top + dy / p.h, 0.03, 0.36);
      const sn = snapMargin("top", raw, state.view);
      state.top = sn.value;
      if (sn.snapped) { snappedEdge = "top"; snapFlash = 1; }
    } else if (drag.edge === "bottom") {
      const raw = clamp(drag.start.bottom - dy / p.h, 0.03, 0.38);
      const sn = snapMargin("bottom", raw, state.view);
      state.bottom = sn.value;
      if (sn.snapped) { snappedEdge = "bottom"; snapFlash = 1; }
    } else if (drag.edge === "inner") {
      const raw = clamp(drag.start.inner + dx / p.w, 0.03, 0.36);
      const sn = snapMargin("inner", raw, state.view);
      state.inner = sn.value;
      if (sn.snapped) { snappedEdge = "inner"; snapFlash = 1; }
    } else if (drag.edge === "outer") {
      const raw = clamp(drag.start.outer - dx / p.w, 0.03, 0.36);
      const sn = snapMargin("outer", raw, state.view);
      state.outer = sn.value;
      if (sn.snapped) { snappedEdge = "outer"; snapFlash = 1; }
    } else if (drag.edge === "bothX") {
      // 横向拖动：向右拖收窄版心（增大左右留白），向左拖拉宽版心
      const deltaFrac = dx / Math.max(140, p.w);
      if (state.view === "spread") {
        state.inner = clamp(drag.start.inner + deltaFrac * 0.45, 0.04, 0.30);
        state.outer = clamp(drag.start.outer + deltaFrac * 0.90, 0.04, 0.34);
      } else {
        const raw = clamp(drag.start.outer + deltaFrac * 0.65, 0.04, 0.34);
        const sn = snapMargin("outer", raw, state.view);
        state.inner = sn.value;
        state.outer = sn.value;
        if (sn.snapped) { snappedEdge = "outer"; snapFlash = 1; }
      }
    }
    constrainMargins(state);
    syncUI();
    markDirty(false);
  }

  // 指针与触屏交互（鼠标/触控笔走 pointer 事件，触屏走独立 touch 事件，互不重复；手机竖滑放行滚页）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    const pt = pointerCoords(e);
    const edge = hitTest(pt.x, pt.y);
    if (!edge) return;
    if (edge !== "bothX") state.activeEdge = edge;
    drag = {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      edge,
      startX: pt.x,
      startY: pt.y,
      locked: true,
      start: { top: state.top, bottom: state.bottom, inner: state.inner, outer: state.outer },
    };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    syncUI();
    markDirty(true);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = pointerCoords(e);
    if (!drag) {
      const h = hitTest(pt.x, pt.y);
      const nextHover = h === "bothX" ? null : h;
      if (nextHover !== hoverEdge) {
        hoverEdge = nextHover;
        markDirty(false);
      }
      canvas.style.cursor =
        h === "top" || h === "bottom" ? "ns-resize" :
        h === "inner" || h === "outer" || h === "bothX" ? "ew-resize" : "default";
      return;
    }
    if (e.pointerId !== drag.pointerId) return;
    applyDragDelta(pt.x, pt.y);
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag = null;
    textCache.key = "";
    markDirty(true);
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 兼容工具直接派发原生 touch 事件（tools/perf.mjs 发 Input.dispatchTouchEvent）
  let touchDrag = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const x = t0.clientX - r.left;
    const y = t0.clientY - r.top;
    const edge = hitTest(x, y);
    if (!edge) return;
    touchDrag = {
      edge,
      startX: x,
      startY: y,
      locked: edge === "top" || edge === "bottom",
      start: { top: state.top, bottom: state.bottom, inner: state.inner, outer: state.outer },
    };
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchDrag || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const x = t0.clientX - r.left;
    const y = t0.clientY - r.top;
    if (!touchDrag.locked) {
      const adx = Math.abs(x - touchDrag.startX);
      const ady = Math.abs(y - touchDrag.startY);
      if (adx < 4 && ady < 4) return;
      if (ady > adx * 1.25) {
        touchDrag = null;
        return;
      }
      touchDrag.locked = true;
    }
    e.preventDefault();
    drag = touchDrag;
    applyDragDelta(x, y);
  }, { passive: false });

  const endTouch = () => {
    if (!touchDrag) return;
    touchDrag = null;
    drag = null;
    textCache.key = "";
    markDirty(true);
  };
  canvas.addEventListener("touchend", endTouch);
  canvas.addEventListener("touchcancel", endTouch);

  // 键盘微调（选中画布时可用方向键调节当前边或四边）
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.005 : 0.015;
    let handled = true;
    if (e.key === "ArrowLeft") {
      state.activeEdge = "inner";
      state.inner = clamp(state.inner - step, 0.03, 0.36);
    } else if (e.key === "ArrowRight") {
      state.activeEdge = "outer";
      state.outer = clamp(state.outer + step, 0.03, 0.36);
    } else if (e.key === "ArrowUp") {
      state.activeEdge = "top";
      state.top = clamp(state.top - step, 0.03, 0.36);
    } else if (e.key === "ArrowDown") {
      state.activeEdge = "bottom";
      state.bottom = clamp(state.bottom + step, 0.03, 0.38);
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      constrainMargins(state);
      syncUI();
      markDirty(true);
    }
  });

  // 按钮控件绑定
  els.viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.heroView;
      syncUI();
      markDirty(true);
    });
  });

  els.formatBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.format = btn.dataset.heroFormat;
      syncUI();
      markDirty(true);
    });
  });

  if (els.leadingInput) {
    els.leadingInput.addEventListener("input", () => {
      state.leading = parseFloat(els.leadingInput.value);
      syncUI();
      markDirty(false);
    });
  }

  if (els.clutterBtn) {
    els.clutterBtn.addEventListener("click", () => {
      state.clutter = !state.clutter;
      syncUI();
      markDirty(true);
    });
  }

  if (els.canonBtn) {
    els.canonBtn.addEventListener("click", () => {
      state.showCanon = !state.showCanon;
      syncUI();
      markDirty(true);
    });
  }

  if (els.thumbBtn) {
    els.thumbBtn.addEventListener("click", () => {
      state.showThumbs = !state.showThumbs;
      syncUI();
      markDirty(true);
    });
  }

  if (els.resetBtn) {
    els.resetBtn.addEventListener("click", () => {
      Object.assign(state, PRESETS.broken);
      state.focusPrinciple = 0;
      syncUI();
      markDirty(true);
    });
  }

  // 精细边界步进控件（无障碍 + 手机点按微调）
  els.edgeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeEdge = btn.dataset.edgeSelect;
      syncUI();
      markDirty(true);
    });
  });

  const stepActiveEdge = (delta) => {
    const k = state.activeEdge;
    state[k] = clamp(state[k] + delta, 0.03, 0.38);
    constrainMargins(state);
    syncUI();
    markDirty(true);
  };
  if (els.edgeMinus) els.edgeMinus.addEventListener("click", () => stepActiveEdge(-0.02));
  if (els.edgePlus) els.edgePlus.addEventListener("click", () => stepActiveEdge(0.02));

  // 五枚古苔圆徽原则列点击高亮对应几何结构
  els.principles.forEach((row, idx) => {
    row.addEventListener("click", () => {
      state.focusPrinciple = state.focusPrinciple === idx + 1 ? 0 : idx + 1;
      syncUI();
      markDirty(true);
    });
  });

  // 窗口尺寸变化重绘
  new ResizeObserver(() => {
    resize();
    markDirty(true);
  }).observe(canvas);

  resize();
  syncUI();
  markDirty(true);
  document.fonts?.ready?.then(() => {
    textCache.key = "";
    markDirty(true);
  });

  return { state, syncUI, draw: () => markDirty(true) };
}
