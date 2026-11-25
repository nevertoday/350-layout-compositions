// 开场主角玩具：189 原海报「活体几何灌字台」
// 所有排字坐标、溢流字数、咬边点、填满率与诊断全部来自 model.js 单真源。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  LOGICAL,
  POSTER_BODY,
  RULES,
  SHAPES,
  evaluateHero,
  layoutShapedText,
  traceShapePath,
} from "./model.js";

// 初始故意停在「容积超载溢流 + 0px 贴壁啃边」错态，绝不提前给答案
const INITIAL = {
  shapeId: "teardrop",
  fontSize: 25.0,
  padPx: 0,
  mode: "shaped",
  shellHidden: false,
};

const SIZE_MIN = 14;
const SIZE_MAX = 27;
const PAD_MIN = 0;
const PAD_MAX = 30;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function initHero() {
  const stageEl = document.getElementById("hero-stage");
  const canvas = document.getElementById("hero-canvas");
  if (!stageEl || !canvas) return;
  const ctx = canvas.getContext("2d");

  const ui = {
    pill: document.getElementById("hero-pill"),
    pillText: document.getElementById("hero-pill-text"),
    diag: document.getElementById("hero-diag"),
    diagHead: document.getElementById("diag-head"),
    diagBody: document.getElementById("diag-body"),
    coTr: document.getElementById("co-tr"),
    coTrVal: document.getElementById("co-tr-val"),
    coTrDesc: document.getElementById("co-tr-desc"),
    coBl: document.getElementById("co-bl"),
    coBlVal: document.getElementById("co-bl-val"),
    coBlDesc: document.getElementById("co-bl-desc"),
    coBr: document.getElementById("co-br"),
    coBrVal: document.getElementById("co-br-val"),
    coBrDesc: document.getElementById("co-br-desc"),
    sizeRuler: document.getElementById("size-ruler"),
    sizeVal: document.getElementById("val-size"),
    sizeFill: document.getElementById("size-fill"),
    sizeThumb: document.getElementById("size-thumb"),
    padRuler: document.getElementById("pad-ruler"),
    padVal: document.getElementById("val-pad"),
    padFill: document.getElementById("pad-fill"),
    padThumb: document.getElementById("pad-thumb"),
    padSweet: document.getElementById("pad-sweet"),
    shapeBtns: [...document.querySelectorAll("[data-hero-shape]")],
    btnShaped: document.getElementById("btn-mode-shaped"),
    btnRect: document.getElementById("btn-mode-rect"),
    btnShell: document.getElementById("btn-shell"),
    btnReset: document.getElementById("btn-reset"),
  };

  const state = { ...INITIAL };
  let spacePeek = false;
  let dirty = true;
  let needsLayout = true;
  let layout = null;
  let diag = null;
  let cw = 640;
  let ch = 460;
  let dpr = 1;

  // 高清离屏汉字图集（Glyph Atlas）：初始化一次性光栅化约 85 个字符，
  // 拖动字号滑轨时用 drawImage 缩放绘制，彻底避免软件渲染下每帧变字号触发 Skia 反复重栅格化！
  const ATLAS_CELL = 44;
  const ATLAS_FONT = 32;
  const ATLAS_COLS = 16;
  const atlasChars = [...new Set([...POSTER_BODY, ..."溢出0123456789字：… "])];
  const atlasIndex = new Map(atlasChars.map((ch, i) => [ch, i]));
  const atlasRows = Math.ceil(atlasChars.length / ATLAS_COLS);

  function buildAtlas(color) {
    const off = document.createElement("canvas");
    off.width = ATLAS_COLS * ATLAS_CELL;
    off.height = atlasRows * ATLAS_CELL;
    const octx = off.getContext("2d");
    octx.font = `700 ${ATLAS_FONT}px "Noto Sans SC", sans-serif`;
    octx.fillStyle = color;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    atlasChars.forEach((ch, i) => {
      const col = i % ATLAS_COLS;
      const row = Math.floor(i / ATLAS_COLS);
      octx.fillText(ch, col * ATLAS_CELL + ATLAS_CELL * 0.5, row * ATLAS_CELL + ATLAS_CELL * 0.52);
    });
    return off;
  }

  const atlases = {
    light: buildAtlas("#F4FCF6"),
    dark: buildAtlas("#073626"),
    err: buildAtlas("#B02418"),
    ink: buildAtlas("#0B140E"),
  };

  function drawAtlasGlyph(ch, x, y, fontPx, kind) {
    const idx = atlasIndex.get(ch);
    if (idx === undefined) return;
    const col = idx % ATLAS_COLS;
    const row = Math.floor(idx / ATLAS_COLS);
    const drawSize = (fontPx / ATLAS_FONT) * ATLAS_CELL;
    ctx.drawImage(
      atlases[kind],
      col * ATLAS_CELL,
      row * ATLAS_CELL,
      ATLAS_CELL,
      ATLAS_CELL,
      x - drawSize * 0.5,
      y - drawSize * 0.5,
      drawSize,
      drawSize
    );
  }

  function recompute() {
    layout = layoutShapedText({
      text: POSTER_BODY,
      shapeId: state.shapeId,
      fontSize: state.fontSize,
      padPx: state.padPx,
      mode: state.mode,
      ry: LOGICAL.ry,
    });
    diag = evaluateHero(layout);
    syncDom();
    needsLayout = false;
    dirty = true;
  }

  function syncDom() {
    const sizeRatio = (state.fontSize - SIZE_MIN) / (SIZE_MAX - SIZE_MIN);
    const padRatio = (state.padPx - PAD_MIN) / (PAD_MAX - PAD_MIN);
    const padEm = state.padPx / Math.max(1, state.fontSize);

    // 滑块中心限定在 [18px, 100% - 18px]，确保 0% 与 100% 时严丝合缝贴在轨道边框内不溢出
    ui.sizeVal.textContent = `${state.fontSize.toFixed(1)} px`;
    ui.sizeFill.style.width = `${(sizeRatio * 100).toFixed(2)}%`;
    ui.sizeThumb.style.left = `calc(18px + (100% - 36px) * ${sizeRatio.toFixed(4)})`;
    ui.sizeRuler.setAttribute("aria-valuenow", state.fontSize.toFixed(1));
    ui.sizeRuler.setAttribute("aria-valuetext", `${state.fontSize.toFixed(1)} 像素`);

    ui.padVal.textContent = `${Math.round(state.padPx)} px (${padEm.toFixed(2)}em)`;
    ui.padFill.style.width = `${(padRatio * 100).toFixed(2)}%`;
    ui.padThumb.style.left = `calc(18px + (100% - 36px) * ${padRatio.toFixed(4)})`;
    ui.padRuler.setAttribute("aria-valuenow", String(Math.round(state.padPx)));
    ui.padRuler.setAttribute("aria-valuetext", `${Math.round(state.padPx)} 像素，约 ${padEm.toFixed(2)} 字宽`);

    // 经验甜区在当前字号下映射到内壁滑轨上的位置（0.42em ~ 1.15em）
    const sweetLo = clamp((state.fontSize * RULES.safePadMinRatio) / PAD_MAX, 0, 1) * 100;
    const sweetHi = clamp((state.fontSize * 1.15) / PAD_MAX, 0, 1) * 100;
    ui.padSweet.style.left = `${sweetLo}%`;
    ui.padSweet.style.width = `${Math.max(4, sweetHi - sweetLo)}%`;

    ui.pill.dataset.tone = diag.tone;
    ui.pillText.textContent = diag.badge;
    ui.diag.dataset.tone = diag.tone;
    ui.diagHead.textContent = diag.headline;
    ui.diagBody.textContent = diag.detail;

    ui.coTr.dataset.ok = String(diag.callouts.topRight.ok);
    ui.coTrVal.textContent = diag.callouts.topRight.val;
    ui.coTrDesc.textContent = diag.callouts.topRight.desc;

    ui.coBl.dataset.ok = String(diag.callouts.botLeft.ok);
    ui.coBlVal.textContent = diag.callouts.botLeft.val;
    ui.coBlDesc.textContent = diag.callouts.botLeft.desc;

    ui.coBr.dataset.ok = String(diag.callouts.botRight.ok);
    ui.coBrVal.textContent = diag.callouts.botRight.val;
    ui.coBrDesc.textContent = diag.callouts.botRight.desc;

    ui.shapeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.heroShape === state.shapeId));
    ui.btnShaped.classList.toggle("is-active", state.mode === "shaped");
    ui.btnRect.classList.toggle("is-active", state.mode === "rect");
    const peeled = state.shellHidden || spacePeek;
    ui.btnShell.setAttribute("aria-pressed", String(peeled));
    ui.btnShell.textContent = peeled ? "恢复绿壳" : "脱壳验形";
  }

  function resize() {
    const r = stageEl.getBoundingClientRect();
    cw = Math.max(260, Math.round(r.width));
    ch = Math.max(240, Math.round(r.height));
    dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    dirty = true;
  }

  // 绘制函数：同一逻辑坐标系等比映射至任意画布尺寸，确保绝不压扁且各端排字 100% 一致
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const peeled = state.shellHidden || spacePeek;
    const hasOverflow = layout.overflowCount > 0;

    // 根据画布尺寸计算等比缩放因子（留出上下空间给溢流槽与呼吸余白）
    const padY = hasOverflow ? 56 : 26;
    const availH = Math.max(160, ch - padY);
    const availW = Math.max(160, cw - (cw >= 640 ? 110 : 24));
    const shape = SHAPES[state.shapeId] || SHAPES.teardrop;
    const logicalW = LOGICAL.ry * 2 * Math.max(shape.aspect, 0.96);
    const logicalH = LOGICAL.ry * 2;
    const scale = Math.min(availW / logicalW, availH / logicalH);

    const cx = cw * 0.5;
    const cy = hasOverflow ? (ch - 34) * 0.48 : ch * 0.5;
    const ry = LOGICAL.ry * scale;
    const rx = ry * shape.aspect;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. 容器主体（正常翡翠绿 / 脱壳态极淡虚线参考轮廓）
    traceShapePath(ctx, state.shapeId, 0, 0, ry, 0);
    if (!peeled) {
      ctx.fillStyle = "#0C9468";
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(12, 148, 104, 0.05)";
      ctx.fill();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(7, 95, 66, 0.34)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. 安全内壁参考线（当内壁 > 0 且非矩形硬叠时轻绘内壁边界，展示文字真正可用的内腔）
    if (state.mode !== "rect" && state.padPx > 0.5) {
      traceShapePath(ctx, state.shapeId, 0, 0, ry, state.padPx * scale);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = peeled ? "rgba(7, 95, 66, 0.25)" : "rgba(243, 251, 245, 0.32)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. 矩形硬叠模式：画出矩形框外框，直观暴露框与壳打架
    if (state.mode === "rect" && layout.lines.length) {
      const rw = layout.rectW * scale;
      const rh = layout.lines.length * layout.lineH * scale + 6;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "#B02418";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);
      ctx.setLineDash([]);
    }

    // 4. 轻绘当前扫描弦线（增强「逐行量弦宽」机理可视化）
    if (state.mode !== "rect") {
      ctx.strokeStyle = peeled ? "rgba(7, 95, 66, 0.14)" : "rgba(243, 251, 245, 0.14)";
      ctx.lineWidth = 1;
      for (const ln of layout.lines) {
        const yPx = ln.cy * scale;
        ctx.beginPath();
        ctx.moveTo(ln.spanLeft * scale, yPx);
        ctx.lineTo(ln.spanRight * scale, yPx);
        ctx.stroke();
      }
    }

    // 5. 半空塌底空腔提示（当填满率 < 78% 且无溢流且非矩形模式）
    if (state.mode !== "rect" && !hasOverflow && layout.fillRatio < RULES.minFillRatio && layout.lines.length) {
      const lastBot = layout.lines[layout.lines.length - 1].yBot * scale;
      ctx.save();
      traceShapePath(ctx, state.shapeId, 0, 0, ry, 2);
      ctx.clip();
      ctx.fillStyle = peeled ? "rgba(139, 78, 8, 0.08)" : "rgba(7, 44, 31, 0.28)";
      ctx.fillRect(-rx, lastBot + 6, rx * 2, ry - lastBot);
      ctx.strokeStyle = peeled ? "#8B4E08" : "#F3FBF5";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-rx, lastBot + 6);
      ctx.lineTo(rx, lastBot + 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = peeled ? "#8B4E08" : "#E6F7EC";
      ctx.font = `700 ${Math.max(11, Math.round(12 * scale))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const emptyMidY = (lastBot + 6 + ry) * 0.5;
      if (ry - lastBot > 30) {
        ctx.fillText("空底塌形区", 0, emptyMidY);
      }
      ctx.restore();
    }

    // 6. 绘制每一行文字（使用高清图集 drawImage，软件渲染 6× 降速下依旧锁死 60 fps！）
    const fontPx = layout.fontSize * scale;

    for (let i = 0; i < layout.lines.length; i++) {
      const ln = layout.lines[i];
      const yPx = ln.cy * scale;
      const isOrphan = state.mode !== "rect" && ln.hanCount <= 1;

      if (isOrphan) {
        ctx.fillStyle = peeled ? "rgba(176, 36, 24, 0.16)" : "rgba(255, 224, 150, 0.35)";
        ctx.fillRect(ln.spanLeft * scale - 2, ln.yTop * scale, (ln.spanRight - ln.spanLeft) * scale + 4, fontPx);
      }

      if (state.mode === "rect") {
        for (const g of ln.glyphs) {
          const kind = g.out ? "err" : peeled ? "ink" : "light";
          drawAtlasGlyph(g.ch, g.x * scale, yPx, fontPx, kind);
        }
      } else {
        const kind = peeled ? "dark" : "light";
        for (const g of ln.glyphs) {
          drawAtlasGlyph(g.ch, g.x * scale, yPx, fontPx, kind);
        }
      }
    }

    // 7. 咬边红点警示（当内壁距 < 0.42em 时高亮具体啃边点）
    if (state.mode !== "rect" && state.padPx / Math.max(1, state.fontSize) < RULES.safePadMinRatio && layout.bitePoints.length) {
      const rDot = Math.max(3, 3.6 * scale);
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      for (const bp of layout.bitePoints) {
        ctx.moveTo(bp.x * scale + rDot + 1.2, bp.y * scale);
        ctx.arc(bp.x * scale, bp.y * scale, rDot + 1.2, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = "#D93829";
      ctx.beginPath();
      for (const bp of layout.bitePoints) {
        ctx.moveTo(bp.x * scale + rDot, bp.y * scale);
        ctx.arc(bp.x * scale, bp.y * scale, rDot, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // 8. 溢流截断区（使用图集逐字绘，软件渲染拖动同样零字形重栅格化！）
    if (hasOverflow) {
      const ovFontPx = Math.max(11, Math.min(13, fontPx * 0.62));
      const fullStr = `溢出 ${layout.overflowCount} 字：${layout.overflowChars.join("")}`;
      const charsArr = [...fullStr];
      const maxBoxW = Math.min(cw - 24, Math.max(rx * 1.95, 250));
      const maxTextW = maxBoxW - 24;
      const charStep = (ch) => (/[0-9 ]/.test(ch) ? ovFontPx * 0.58 : ovFontPx * 1.0);
      const ovLines = [];
      let cur = [];
      let curW = 0;
      for (const ch of charsArr) {
        const wCh = charStep(ch);
        if (cur.length && curW + wCh > maxTextW) {
          ovLines.push({ chars: cur, w: curW });
          cur = [ch];
          curW = wCh;
          if (ovLines.length === 1) continue;
          break;
        }
        cur.push(ch);
        curW += wCh;
      }
      if (ovLines.length < 2 && cur.length) ovLines.push({ chars: cur, w: curW });
      if (ovLines.length === 2) {
        const used = ovLines[0].chars.length + ovLines[1].chars.length;
        if (used < charsArr.length) {
          while (ovLines[1].chars.length > 2 && ovLines[1].w + ovFontPx > maxTextW) {
            const pop = ovLines[1].chars.pop();
            ovLines[1].w -= charStep(pop);
          }
          ovLines[1].chars.push("…");
          ovLines[1].w += ovFontPx;
        }
      }
      const maxLineW = Math.max(...ovLines.map((o) => o.w));
      const boxW = Math.min(cw - 16, Math.max(maxLineW + 24, 180));
      const boxY = ry + 8;
      const boxH = Math.min(48, ovLines.length * 17 + 12);
      ctx.fillStyle = "#FDECE9";
      ctx.strokeStyle = "#B02418";
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.4;
      ctx.fillRect(-boxW / 2, boxY, boxW, boxH);
      ctx.strokeRect(-boxW / 2, boxY, boxW, boxH);
      ctx.setLineDash([]);

      ovLines.forEach((lineObj, k) => {
        const ly = boxY + 12 + k * 17;
        let xCursor = -lineObj.w * 0.5;
        for (const ch of lineObj.chars) {
          const wCh = charStep(ch);
          drawAtlasGlyph(ch, xCursor + wCh * 0.5, ly, ovFontPx, "err");
          xCursor += wCh;
        }
      });
    }

    ctx.restore();

    // 10. 桌面宽屏（三组 DOM 标注浮于左右两翼时）绘原海报同款三根黑圆点折角细虚线引注
    if (window.innerWidth > 1080 && cw >= 780) {
      drawPosterCalloutLines(ctx, cx, cy, rx, ry, cw, ch, diag.checks);
    }
  }

  function drawPosterCalloutLines(c, cx, cy, rx, ry, w, h, checks) {
    // 精准延伸至左右两侧 DOM 标注文字边缘，避免平板/窄屏悬空
    const rightEnd = Math.min(w - 266, cx + rx * 1.62);
    const leftEnd = Math.max(266, cx - rx * 1.62);
    const anchors = [
      {
        x0: cx + rx * 0.72,
        y0: cy - ry * 0.62,
        x1: cx + rx * 1.05,
        y1: cy - ry * 0.84,
        x2: Math.max(cx + rx * 1.18, rightEnd),
        y2: cy - ry * 0.84,
        ok: checks.flow,
      },
      {
        x0: cx - rx * 0.82,
        y0: cy + ry * 0.56,
        x1: cx - rx * 1.1,
        y1: cy + ry * 0.76,
        x2: Math.min(cx - rx * 1.18, leftEnd),
        y2: cy + ry * 0.76,
        ok: checks.edge,
      },
      {
        x0: cx + rx * 0.82,
        y0: cy + ry * 0.56,
        x1: cx + rx * 1.1,
        y1: cy + ry * 0.76,
        x2: Math.max(cx + rx * 1.18, rightEnd),
        y2: cy + ry * 0.76,
        ok: checks.form,
      },
    ];

    for (const a of anchors) {
      const col = a.ok ? "#075F42" : "#0B140E";
      c.save();
      c.setLineDash([4, 3]);
      c.strokeStyle = col;
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(a.x0, a.y0);
      c.lineTo(a.x1, a.y1);
      c.lineTo(a.x2, a.y2);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = col;
      c.beginPath();
      c.arc(a.x0, a.y0, 3.5, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(a.x2, a.y2, 3, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  // ---------- 通用无障碍滑轨绑定（同时支持鼠标、触摸单指与键盘，适配 perf.mjs 的 touchMove） ----------
  function bindRuler(el, min, max, step, getVal, setVal, keyStep = step) {
    let dragging = false;

    const applyClientX = (clientX) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      setVal(clamp(snapped, min, max));
    };

    // 鼠标拖拽
    el.addEventListener("mousedown", (e) => {
      dragging = true;
      el.focus({ preventScroll: true });
      applyClientX(e.clientX);
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (dragging) applyClientX(e.clientX);
    });
    window.addEventListener("mouseup", () => {
      dragging = false;
    });

    // 触摸拖拽（显式监听 touch* 确保 CDP Input.dispatchTouchEvent 与真机触屏零丢失）
    el.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches.length) return;
        dragging = true;
        applyClientX(e.touches[0].clientX);
      },
      { passive: true }
    );
    el.addEventListener(
      "touchmove",
      (e) => {
        if (!dragging || !e.touches.length) return;
        applyClientX(e.touches[0].clientX);
      },
      { passive: true }
    );
    el.addEventListener(
      "touchend",
      () => {
        dragging = false;
      },
      { passive: true }
    );

    // 键盘微调
    el.addEventListener("keydown", (e) => {
      const mult = e.shiftKey ? 0.5 : 1;
      const delta = keyStep * mult;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        setVal(clamp(getVal() + delta, min, max));
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        setVal(clamp(getVal() - delta, min, max));
        e.preventDefault();
      } else if (e.key === "PageUp") {
        setVal(clamp(getVal() + keyStep * 4, min, max));
        e.preventDefault();
      } else if (e.key === "PageDown") {
        setVal(clamp(getVal() - keyStep * 4, min, max));
        e.preventDefault();
      }
    });
  }

  bindRuler(
    ui.sizeRuler,
    SIZE_MIN,
    SIZE_MAX,
    0.1,
    () => state.fontSize,
    (v) => {
      if (Math.abs(v - state.fontSize) < 1e-4) return;
      state.fontSize = v;
      needsLayout = true;
      dirty = true;
      if (reducedMotion.matches) {
        recompute();
        ctrl.draw();
      }
    },
    0.5
  );

  bindRuler(
    ui.padRuler,
    PAD_MIN,
    PAD_MAX,
    1,
    () => state.padPx,
    (v) => {
      if (Math.abs(v - state.padPx) < 1e-4) return;
      state.padPx = v;
      needsLayout = true;
      dirty = true;
      if (reducedMotion.matches) {
        recompute();
        ctrl.draw();
      }
    },
    1
  );

  // 直接在主水滴画布上横向拖动也可调字号（只取横向位移，绝不阻断手机竖滚）
  let canvasDrag = null;
  canvas.addEventListener("mousedown", (e) => {
    canvasDrag = { x0: e.clientX, fs0: state.fontSize };
  });
  window.addEventListener("mousemove", (e) => {
    if (!canvasDrag) return;
    const dx = e.clientX - canvasDrag.x0;
    const next = clamp(Math.round((canvasDrag.fs0 + dx * 0.04) * 2) / 2, SIZE_MIN, SIZE_MAX);
    if (next !== state.fontSize) {
      state.fontSize = next;
      recompute();
    }
  });
  window.addEventListener("mouseup", () => {
    canvasDrag = null;
  });

  // 按钮切换
  ui.shapeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.shapeId = btn.dataset.heroShape;
      recompute();
    });
  });

  ui.btnShaped.addEventListener("click", () => {
    state.mode = "shaped";
    recompute();
  });

  ui.btnRect.addEventListener("click", () => {
    state.mode = "rect";
    recompute();
  });

  ui.btnShell.addEventListener("click", () => {
    state.shellHidden = !state.shellHidden;
    syncDom();
    dirty = true;
  });

  ui.btnReset.addEventListener("click", () => {
    Object.assign(state, INITIAL);
    recompute();
  });

  // 按住空格键快速脱壳验形（仅当焦点不在按钮或输入框上时，防止与空格点击按钮冲突）
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "BUTTON" && !document.getElementById("lightbox")?.hidden === false) {
      if (document.activeElement === document.body || document.activeElement === ui.sizeRuler || document.activeElement === ui.padRuler) {
        spacePeek = true;
        syncDom();
        dirty = true;
        e.preventDefault();
      }
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" && spacePeek) {
      spacePeek = false;
      syncDom();
      dirty = true;
    }
  });

  resize();
  recompute();
  window.addEventListener("resize", () => {
    resize();
    ctrl.draw();
  });

  const ctrl = loop(stageEl, () => {
    if (needsLayout) recompute();
    if (!dirty) return;
    dirty = false;
    render();
  });

  // 当交互变更时（含 reducedMotion 模式下）立即通知重画
  const origRecompute = recompute;
  recompute = function () {
    origRecompute();
    if (reducedMotion.matches) ctrl.draw();
  };
  ui.btnShell.addEventListener("click", () => {
    if (reducedMotion.matches) ctrl.draw();
  });
  if (reducedMotion.matches) ctrl.draw();
}
