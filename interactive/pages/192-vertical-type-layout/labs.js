// 192 垂直文字排版 — 01 至 08 节交互实验与海报灯箱
// 所有状态判定均读取 model.js，不写死孤立常量。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ANTI_CASES,
  BAMBOO_STEPS,
  HISTORY_STELES,
  PALETTE,
  PRACTICE_CARDS,
  buildCssInspect,
  classifyPhase,
} from "./model.js";

// ---------- 01 节：简牍展卷 4 步演示 ----------
function mountBambooLab() {
  const btns = [...document.querySelectorAll("[data-bamboo-step]")];
  const svg = document.getElementById("bamboo-svg");
  const titleEl = document.getElementById("bamboo-title");
  const bodyEl = document.getElementById("bamboo-body");
  const cueEl = document.getElementById("bamboo-cue");
  if (!btns.length || !svg) return;

  const SLIP_TEXTS = [
    ["山", "川", "有", "声"],
    ["岁", "月", "成", "诗"],
    ["静", "默", "时", "光"],
    ["风", "物", "成", "篇"],
    ["文", "序", "留", "白"],
    ["东", "方", "美", "学"],
  ];

  function renderStep(idx) {
    const step = BAMBOO_STEPS[idx] || BAMBOO_STEPS[0];
    btns.forEach((b, i) => {
      const on = i === idx;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    if (titleEl) titleEl.textContent = step.title;
    if (bodyEl) bodyEl.textContent = step.body;
    if (cueEl) cueEl.textContent = step.cue;

    // 重绘 SVG：6 枚竹简自右向左排列（idx 0 在最右）
    const W = 560;
    const H = 240;
    const rightX = 486;
    const pitch = step.modern ? 66 : 62;
    const slipW = step.modern ? 44 : 42;
    const slipTop = 44;
    const slipH = 166;
    const parts = [];

    // 纸面底
    parts.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${step.modern ? PALETTE.scroll : "#EFE7D8"}" stroke="${PALETTE.rule}" stroke-width="1"/>`);

    // 步骤 3（现代纸面）：轻绘右侧深松绿弧与虚线乌丝栏
    if (step.modern) {
      parts.push(`<clipPath id="bm-clip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}"/></clipPath>`);
      parts.push(`<g clip-path="url(#bm-clip)"><circle cx="28" cy="128" r="76" fill="${PALETTE.teal}"/><circle cx="62" cy="186" r="28" fill="${PALETTE.ochre}"/></g>`);
    }

    // 顶部方向箭头
    if (idx >= 2) {
      const xStart = rightX + 10;
      const xEnd = rightX - (step.slips - 1) * pitch - 10;
      parts.push(`<line x1="${xStart}" y1="22" x2="${xEnd}" y2="22" stroke="${PALETTE.teal}" stroke-width="1.5"/>`);
      parts.push(`<polygon points="${xEnd},22 ${xEnd + 8},18 ${xEnd + 8},26" fill="${PALETTE.teal}"/>`);
      parts.push(`<text x="${(xStart + xEnd) / 2}" y="16" text-anchor="middle" fill="${PALETTE.teal}" font-size="11" font-family="Noto Serif SC, serif" font-weight="700">展卷与阅读方向：由右向左</text>`);
    } else if (idx === 0) {
      parts.push(`<line x1="${rightX + 32}" y1="${slipTop + 8}" x2="${rightX + 32}" y2="${slipTop + slipH - 12}" stroke="${PALETTE.teal}" stroke-width="1.5"/>`);
      parts.push(`<polygon points="${rightX + 32},${slipTop + slipH - 6} ${rightX + 28},${slipTop + slipH - 15} ${rightX + 36},${slipTop + slipH - 15}" fill="${PALETTE.teal}"/>`);
      parts.push(`<text x="${rightX - 18}" y="22" text-anchor="end" fill="${PALETTE.teal}" font-size="11" font-family="Noto Serif SC, serif" font-weight="700">单枚竹简仅容一字宽 · 自上而下</text>`);
    } else {
      parts.push(`<text x="${W / 2}" y="22" text-anchor="middle" fill="${PALETTE.ochreInk}" font-size="11" font-family="Noto Serif SC, serif" font-weight="700">上下两道麻绳编连成「册」</text>`);
    }

    // 若为编连状态，先画上下韦编绳
    if (step.bound) {
      const xR = rightX + 18;
      const xL = rightX - (step.slips - 1) * pitch - (step.unroll < 1 ? 10 : 20);
      for (const ry of [slipTop + 34, slipTop + slipH - 34]) {
        parts.push(`<line x1="${xL}" y1="${ry}" x2="${xR}" y2="${ry}" stroke="${PALETTE.ochreInk}" stroke-width="2.6" stroke-dasharray="10 4"/>`);
      }
    }

    // 绘制各枚竹简或纸面列
    for (let s = 0; s < step.slips; s++) {
      // 未完全展开时左侧几简靠紧卷拢
      const spread = step.unroll < 1 && s >= 2 ? 0.56 : 1;
      const cx = rightX - (s < 2 ? s * pitch : pitch + (s - 1) * pitch * spread);
      const x = cx - slipW / 2;

      if (step.modern) {
        // 虚线乌丝栏
        parts.push(`<line x1="${cx - pitch / 2}" y1="${slipTop - 4}" x2="${cx - pitch / 2}" y2="${slipTop + slipH + 4}" stroke="${PALETTE.teal}" stroke-opacity="0.35" stroke-dasharray="3 4"/>`);
        if (s === 0) {
          parts.push(`<line x1="${cx + pitch / 2}" y1="${slipTop - 4}" x2="${cx + pitch / 2}" y2="${slipTop + slipH + 4}" stroke="${PALETTE.teal}" stroke-opacity="0.35" stroke-dasharray="3 4"/>`);
        }
      } else {
        // 实体竹简：暖竹木色 + 微木纹边
        const tone = s === 0 ? "#DFC799" : "#D6BD8D";
        parts.push(`<rect x="${x}" y="${slipTop}" width="${slipW}" height="${slipH}" rx="2" fill="${tone}" stroke="#9C8050" stroke-width="1"/>`);
        // 简背卷起阴影感
        if (step.unroll < 1 && s >= 3) {
          parts.push(`<rect x="${x}" y="${slipTop}" width="${slipW}" height="${slipH}" rx="2" fill="rgba(22,27,25,${0.08 * (s - 2)})"/>`);
        }
      }

      // 纵排字
      const chars = SLIP_TEXTS[s] || SLIP_TEXTS[0];
      chars.forEach((ch, r) => {
        const cy = slipTop + 28 + r * 36;
        const onTeal = step.modern && cx < 110;
        parts.push(`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="${onTeal ? PALETTE.paperLight : PALETTE.ink}" font-size="18" font-family="Noto Serif SC, serif" font-weight="${s === 0 ? 700 : 400}">${ch}</text>`);
      });

      // 列号小标
      parts.push(`<text x="${cx}" y="${slipTop + slipH + 17}" text-anchor="middle" fill="${PALETTE.inkMuted}" font-size="10.5" font-family="DM Mono, monospace">0${s + 1}</text>`);
    }

    // 步骤 3 末列加一枚朱红小印
    if (step.modern) {
      const lastCx = rightX - (step.slips - 1) * pitch;
      parts.push(`<rect x="${lastCx - 9}" y="${slipTop + slipH - 18}" width="18" height="18" fill="${PALETTE.seal}"/>`);
      parts.push(`<text x="${lastCx}" y="${slipTop + slipH - 8}" text-anchor="middle" dominant-baseline="middle" fill="${PALETTE.paperLight}" font-size="9" font-family="Noto Serif SC, serif" font-weight="700">印</text>`);
    }

    svg.innerHTML = parts.join("");
  }

  btns.forEach((b, i) => b.addEventListener("click", () => renderStep(i)));
  renderStep(0);
}

// ---------- 02 节：历史碑签切换 ----------
function mountHistoryLab() {
  const btns = [...document.querySelectorAll("[data-stele]")];
  const eraEl = document.getElementById("stele-era");
  const titleEl = document.getElementById("stele-title");
  const bodyEl = document.getElementById("stele-body");
  const cardEl = document.getElementById("stele-specimen");
  if (!btns.length || !cardEl) return;

  function selectStele(id) {
    const item = HISTORY_STELES.find((s) => s.id === id) || HISTORY_STELES[0];
    btns.forEach((b) => {
      const on = b.dataset.stele === item.id;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    if (eraEl) eraEl.textContent = `${item.era} · ${item.year}`;
    if (titleEl) titleEl.textContent = item.title;
    if (bodyEl) bodyEl.textContent = item.summary;

    cardEl.dataset.style = item.sampleStyle;
    cardEl.dataset.dir = item.sampleDir;
    const colsHtml = item.sampleLines
      .map((line) => `<span class="st-col">${line}</span>`)
      .join("");
    cardEl.innerHTML = `
      <span class="st-badge">${item.sampleTitle}</span>
      <div class="st-lines" aria-label="${item.sampleTitle}排版示意">${colsHtml}</div>
    `;
  }

  btns.forEach((b) => b.addEventListener("click", () => selectStele(b.dataset.stele)));
  selectStele("bamboo");
}

// ---------- 03 节：深松绿暗室 · 二维行距×字距相位图 ----------
function mountPhaseLab() {
  const canvas = document.getElementById("phase-canvas");
  const wrap = document.getElementById("phase-lab");
  const zoneEl = document.getElementById("phase-zone");
  const explainEl = document.getElementById("phase-explain");
  const leadEl = document.getElementById("phase-lead");
  const trackEl = document.getElementById("phase-track");
  const ratioEl = document.getElementById("phase-ratio");
  const preview = document.getElementById("phase-preview");
  const presetBtns = [...document.querySelectorAll("[data-phase-preset]")];
  if (!canvas || !wrap || !preview) return;

  const ctx = canvas.getContext("2d");
  // 初始落在横向串行红区附近，鼓励用户拖进金绿纵流带
  let leading = 1.24;
  let tracking = 0.34;
  let dirty = true;
  let cssW = 420;
  let cssH = 290;

  const L_MIN = 1.08;
  const L_MAX = 2.45;
  const T_MIN = 0.0;
  const T_MAX = 0.48;
  const PAD = { l: 50, r: 22, t: 22, b: 40 };

  const lToX = (l) => PAD.l + ((l - L_MIN) / (L_MAX - L_MIN)) * (cssW - PAD.l - PAD.r);
  const tToY = (tr) => cssH - PAD.b - ((tr - T_MIN) / (T_MAX - T_MIN)) * (cssH - PAD.t - PAD.b);
  const xyToParams = (x, y) => {
    const nx = Math.max(0, Math.min(1, (x - PAD.l) / Math.max(1, cssW - PAD.l - PAD.r)));
    const ny = Math.max(0, Math.min(1, (cssH - PAD.b - y) / Math.max(1, cssH - PAD.t - PAD.b)));
    return {
      leading: +(L_MIN + nx * (L_MAX - L_MIN)).toFixed(2),
      tracking: +(T_MIN + ny * (T_MAX - T_MIN)).toFixed(2),
    };
  };

  function syncPreview() {
    const info = classifyPhase(leading, tracking);
    if (zoneEl) {
      zoneEl.textContent = info.name;
      zoneEl.dataset.zone = info.zone;
    }
    if (explainEl) explainEl.textContent = info.explain;
    if (leadEl) leadEl.textContent = `${leading.toFixed(2)}×（净空 ${info.colGap.toFixed(2)}em）`;
    if (trackEl) trackEl.textContent = `+${tracking.toFixed(2)}em`;
    if (ratioEl) ratioEl.textContent = `${info.ratio.toFixed(1)}×`;

    // 实时同步旁侧 3 列竖排诗块（原生 vertical-rl！）
    preview.style.setProperty("--ph-lead", String(leading));
    preview.style.setProperty("--ph-track", `${tracking}em`);
    preview.dataset.zone = info.zone;

    dirty = true;
    runner.draw();
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(220, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (w !== cssW || h !== cssH || canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      cssW = w;
      cssH = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }

  function drawPhase() {
    resize();
    if (!dirty) return;
    dirty = false;

    const dpr = canvas.width / cssW;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssW;
    const H = cssH;
    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;

    // 暗松室坐标底
    ctx.fillStyle = "#0F2F2B";
    ctx.fillRect(0, 0, W, H);

    // 1. 区域底色网格：逐格着色呈现三带边界
    const gx = 32;
    const gy = 22;
    const cw = plotW / gx;
    const ch = plotH / gy;
    for (let ix = 0; ix < gx; ix++) {
      for (let iy = 0; iy < gy; iy++) {
        const l = L_MIN + ((ix + 0.5) / gx) * (L_MAX - L_MIN);
        const tr = T_MIN + ((iy + 0.5) / gy) * (T_MAX - T_MIN);
        const z = classifyPhase(l, tr).zone;
        ctx.fillStyle =
          z === "cross"
            ? "rgba(242, 130, 119, 0.24)"
            : z === "sweet"
              ? "rgba(232, 184, 95, 0.22)"
              : "rgba(245, 239, 228, 0.05)";
        const px = PAD.l + ix * cw;
        const py = H - PAD.b - (iy + 1) * ch;
        ctx.fillRect(px, py, cw + 0.5, ch + 0.5);
      }
    }

    // 2. 格式塔临界斜线：列间净空 = 上下字距 (L - 1 = T) 与 1.8× 边界线
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD.l, PAD.t, plotW, plotH);
    ctx.clip();

    // 等距线 (colGap === charGap)
    ctx.strokeStyle = PALETTE.sealBright;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(lToX(1.0 + T_MIN), tToY(T_MIN));
    ctx.lineTo(lToX(1.0 + T_MAX), tToY(T_MAX));
    ctx.stroke();

    // 纵流经验框线 (L: 1.55..2.25, T: 0.04..0.24)
    ctx.setLineDash([]);
    ctx.strokeStyle = PALETTE.ochreBright;
    ctx.lineWidth = 1.4;
    const sx1 = lToX(1.55);
    const sx2 = lToX(2.25);
    const sy1 = tToY(0.24);
    const sy2 = tToY(0.04);
    ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);
    ctx.restore();

    // 区域标注文字
    ctx.font = `600 11px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = PALETTE.sealBright;
    ctx.fillText("横向串行红区", PAD.l + 8, PAD.t + 8);
    ctx.fillStyle = PALETTE.ochreBright;
    ctx.fillText("纵流舒展带", lToX(1.58), tToY(0.22));
    ctx.fillStyle = "rgba(245,239,228,0.68)";
    ctx.textAlign = "right";
    ctx.fillText("散架区", W - PAD.r - 6, PAD.t + 8);

    // 3. 坐标轴与刻度
    ctx.strokeStyle = "rgba(245, 239, 228, 0.38)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, H - PAD.b);
    ctx.lineTo(W - PAD.r, H - PAD.b);
    ctx.stroke();

    ctx.fillStyle = "rgba(245, 239, 228, 0.85)";
    ctx.font = `500 10.5px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const lv of [1.2, 1.6, 2.0, 2.4]) {
      const x = lToX(lv);
      ctx.fillText(`${lv.toFixed(1)}×`, x, H - PAD.b + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const tv of [0.0, 0.16, 0.32, 0.48]) {
      const y = tToY(tv);
      ctx.fillText(`${tv.toFixed(2)}`, PAD.l - 7, y);
    }

    // 轴名
    ctx.font = `500 11px "Noto Serif SC", serif`;
    ctx.fillStyle = PALETTE.paperLight;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("行距 Leading（列与列之间的横向距）→", PAD.l + plotW / 2, H - 4);

    // 4. 当前坐标点与垂线投影
    const px = lToX(leading);
    const py = tToY(tracking);
    const curZone = classifyPhase(leading, tracking).zone;
    const dotCol = curZone === "sweet" ? PALETTE.ochreBright : curZone === "cross" ? PALETTE.sealBright : PALETTE.paperLight;

    ctx.strokeStyle = "rgba(245, 239, 228, 0.32)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, H - PAD.b);
    ctx.lineTo(px, py);
    ctx.lineTo(PAD.l, py);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = dotCol;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.tealDeep;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  const runner = loop(wrap, drawPhase);

  // 点击/拖拽二维坐标板
  let dragging = false;
  function moveToEvent(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const p = xyToParams(clientX - r.left, clientY - r.top);
    leading = p.leading;
    tracking = p.tracking;
    syncPreview();
  }
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    moveToEvent(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moveToEvent(e.clientX, e.clientY);
  });
  const endDrag = () => {
    dragging = false;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘方向键操控二维坐标点
  canvas.addEventListener("keydown", (e) => {
    const dl = 0.08;
    const dt = 0.04;
    if (e.key === "ArrowRight") leading = Math.min(L_MAX, +(leading + dl).toFixed(2));
    else if (e.key === "ArrowLeft") leading = Math.max(L_MIN, +(leading - dl).toFixed(2));
    else if (e.key === "ArrowUp") tracking = Math.min(T_MAX, +(tracking + dt).toFixed(2));
    else if (e.key === "ArrowDown") tracking = Math.max(T_MIN, +(tracking - dt).toFixed(2));
    else return;
    e.preventDefault();
    syncPreview();
  });

  // 快捷预设点
  const PRESETS = {
    cross: { l: 1.2, t: 0.38 },
    sweet: { l: 1.9, t: 0.12 },
    loose: { l: 2.38, t: 0.34 },
  };
  presetBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const p = PRESETS[b.dataset.phasePreset];
      if (!p) return;
      leading = p.l;
      tracking = p.t;
      syncPreview();
    })
  );

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      dirty = true;
      runner.draw();
    }).observe(canvas);
  }
  syncPreview();
}

// ---------- 04 节：原生 CSS 竖排混排试验盒 ----------
function mountCssLab() {
  const box = document.getElementById("css-live-box");
  const codeEl = document.getElementById("css-live-code");
  const diagEl = document.getElementById("css-live-diag");
  const pBtns = [...document.querySelectorAll("[data-css-punct]")];
  const nBtns = [...document.querySelectorAll("[data-css-num]")];
  const lBtns = [...document.querySelectorAll("[data-css-latin]")];
  if (!box || !codeEl) return;

  const state = { punctMode: "horiz", numMode: "sideways", latinMode: "upright" };

  function render() {
    const info = buildCssInspect(state);
    pBtns.forEach((b) => {
      const on = b.dataset.cssPunct === state.punctMode;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    nBtns.forEach((b) => {
      const on = b.dataset.cssNum === state.numMode;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    lBtns.forEach((b) => {
      const on = b.dataset.cssLatin === state.latinMode;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });

    const numClass = state.numMode === "tcy" ? "tcy" : "raw-num";
    box.dataset.latin = state.latinMode;
    box.dataset.punct = state.punctMode;
    box.innerHTML = `
      <p class="cl-title">当代东方美学展</p>
      <p class="cl-body">展期于<span class="${numClass}">${info.num05}</span>月<span class="${numClass}">${info.num20}</span>日启幕，主题为${info.openQ}山川有声${info.closeQ}。</p>
      <p class="cl-sub">策展手记：<span class="cl-en" lang="en">Vertical Type 2026</span></p>
    `;

    codeEl.textContent = info.cssLines;
    if (diagEl) {
      diagEl.textContent = info.summary;
      diagEl.dataset.status = info.status;
    }
  }

  pBtns.forEach((b) => b.addEventListener("click", () => { state.punctMode = b.dataset.cssPunct; render(); }));
  nBtns.forEach((b) => b.addEventListener("click", () => { state.numMode = b.dataset.cssNum; render(); }));
  lBtns.forEach((b) => b.addEventListener("click", () => { state.latinMode = b.dataset.cssLatin; render(); }));
  render();
}

// ---------- 05 节：原海报三套应用（竖排 vs 硬改横排对比） ----------
function mountAppGallery() {
  const toggleBtn = document.getElementById("app-orient-toggle");
  const deck = document.getElementById("app-deck");
  const noteEl = document.getElementById("app-orient-note");
  if (!toggleBtn || !deck) return;

  let horiz = false;
  function sync() {
    deck.dataset.orient = horiz ? "horiz" : "vert";
    toggleBtn.setAttribute("aria-pressed", String(horiz));
    toggleBtn.classList.toggle("is-on", horiz);
    toggleBtn.textContent = horiz ? "已切为硬改横排（点此恢复原海报竖排）" : "切换为普通横排对比";
    if (noteEl) {
      noteEl.textContent = horiz
        ? "硬改横排后：茶罐圆月被横标切碎、拱门纵向走廊失去呼应、诗集细雨纵线与横排字打起十字架。"
        : "原海报竖排：三套设计分别借茶罐留白、拱门纵深与细雨垂线，让字列与画面几何同向呼吸。";
    }
  }
  toggleBtn.addEventListener("click", () => {
    horiz = !horiz;
    sync();
  });
  sync();
}

// ---------- 06 节：什么时候别用竖排（反例实测） ----------
function mountAntiCases() {
  const tabs = [...document.querySelectorAll("[data-anti-tab]")];
  const flipBtn = document.getElementById("anti-flip");
  const stage = document.getElementById("anti-stage");
  const titleEl = document.getElementById("anti-title");
  const whyEl = document.getElementById("anti-why");
  if (!tabs.length || !stage || !flipBtn) return;

  let active = "code";
  let forcedVertical = true;

  function render() {
    const c = ANTI_CASES[active] || ANTI_CASES.code;
    tabs.forEach((t) => {
      const on = t.dataset.antiTab === active;
      t.setAttribute("aria-pressed", String(on));
      t.classList.toggle("is-on", on);
    });
    flipBtn.setAttribute("aria-pressed", String(forcedVertical));
    flipBtn.textContent = forcedVertical ? "当前：强行竖排（点此改回横排）" : "当前：回归横排（点此看强行竖排）";
    stage.dataset.mode = forcedVertical ? "vert" : "horiz";
    stage.dataset.case = active;
    if (titleEl) titleEl.textContent = c.title;
    if (whyEl) whyEl.textContent = forcedVertical ? c.whyBad : c.whyGood;
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      active = t.dataset.antiTab;
      forcedVertical = true;
      render();
    })
  );
  flipBtn.addEventListener("click", () => {
    forcedVertical = !forcedVertical;
    render();
  });
  render();
}

// ---------- 07 节：小练习（四张中性展签，SVG 精准排版 + 选后揭晓结构标） ----------
function mountPractice() {
  const btns = [...document.querySelectorAll("[data-quiz-card]")];
  const verdictEl = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("quiz-v-title");
  const vText = document.getElementById("quiz-v-text");
  if (!btns.length || !verdictEl) return;

  // 同一张茶事展签内容，四张卡片严格仅差一个变量
  const TITLE = ["春", "山", "茶", "事"];
  const COL1 = ["听", "风", "煮", "茗", "，", "坐", "看", "云"];
  const COL2 = ["起", "。"]; // 用于 D 卡故意让句号掉列首，其余卡将句号与前文顺排成两列 8 字
  const COLS_GOOD = [
    ["听", "风", "煮", "茗", "，", "坐", "看", "云"],
    ["起", "于", "幽", "谷", "，", "04", "月", "18"],
    ["日", "雅", "集", "。"],
  ];
  // D 卡特意构造句号掉在第二列最顶、标点贴左下、数字侧躺
  const COLS_BAD_PUNCT = [
    ["听", "风", "煮", "茗", "，", "坐", "看", "云"],
    ["。", "起", "于", "幽", "谷", "，", "0", "4"],
    ["月", "1", "8", "日", "雅", "集"],
  ];

  function drawCardSvg(card, revealed) {
    const W = 220;
    const H = 260;
    const isRL = card.direction === "rl";
    const cols = card.verticalPunct ? COLS_GOOD : COLS_BAD_PUNCT;
    const fs = 15;
    const pitchX = fs * card.leading;
    const pitchY = fs * (1 + card.tracking);
    const titleX = isRL ? 184 : 36;
    const titleGap = 32;
    const topY = 44;

    const parts = [];
    parts.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${PALETTE.scroll}" stroke="${PALETTE.rule}" stroke-width="1"/>`);
    // 装饰小半圆（保持四张卡片外观完全同一套美术，略微左退兼顾标题对比）
    const qTealCx = 6;
    const qTealCy = 152;
    const qTealR = 42;
    const qGoldCx = 30;
    const qGoldCy = 188;
    const qGoldR = 15;
    parts.push(`<clipPath id="qclip-${card.id}"><rect x="1" y="1" width="${W - 2}" height="${H - 2}"/></clipPath>`);
    parts.push(`<g clip-path="url(#qclip-${card.id})"><circle cx="${qTealCx}" cy="${qTealCy}" r="${qTealR}" fill="${PALETTE.teal}" fill-opacity="0.92"/><circle cx="${qGoldCx}" cy="${qGoldCy}" r="${qGoldR}" fill="${PALETTE.ochre}"/></g>`);

    // 标题列（落入深松绿半圆上时自动提亮墨色，确保四张卡片文字一律清晰）
    TITLE.forEach((ch, r) => {
      const ty = topY + r * 26;
      const tOnTeal = Math.hypot(titleX - qTealCx, ty - qTealCy) < qTealR && Math.hypot(titleX - qGoldCx, ty - qGoldCy) > qGoldR;
      parts.push(`<text x="${titleX}" y="${ty}" text-anchor="middle" dominant-baseline="middle" fill="${tOnTeal ? PALETTE.paperLight : PALETTE.ink}" font-size="21" font-family="ZCOOL XiaoWei, Noto Serif SC, serif">${ch}</text>`);
    });

    // 正文三列
    const colXs = cols.map((_, ci) =>
      isRL ? titleX - titleGap - ci * pitchX : titleX + titleGap + ci * pitchX
    );

    cols.forEach((col, ci) => {
      const cx = colXs[ci];
      col.forEach((tok, ri) => {
        const y = topY + ri * pitchY;
        if (y > H - 16) return;
        const onTeal = Math.hypot(cx - qTealCx, y - qTealCy) < qTealR && Math.hypot(cx - qGoldCx, y - qGoldCy) > qGoldR;
        const fill = onTeal ? PALETTE.paperLight : PALETTE.ink;

        if (tok.length === 2 && /^\d{2}$/.test(tok)) {
          // 纵中横两位数字
          parts.push(`<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="${fill}" font-size="11.5" font-family="DM Mono, monospace">${tok}</text>`);
        } else if (!card.verticalPunct && /^\d$/.test(tok)) {
          // 侧躺数字
          parts.push(`<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="middle" transform="rotate(90 ${cx} ${y})" fill="${fill}" font-size="13" font-family="DM Mono, monospace">${tok}</text>`);
        } else if (tok === "，" || tok === "。") {
          const dx = card.verticalPunct ? 4.2 : -3.6;
          const dy = card.verticalPunct ? -3.6 : 3.6;
          parts.push(`<text x="${cx + dx}" y="${y + dy}" text-anchor="middle" dominant-baseline="middle" fill="${fill}" font-size="${fs}" font-family="Noto Serif SC, serif">${tok}</text>`);
          if (revealed && !card.verticalPunct && ri === 0) {
            parts.push(`<circle cx="${cx}" cy="${y}" r="9" fill="none" stroke="${PALETTE.seal}" stroke-width="1.6"/>`);
          }
        } else {
          parts.push(`<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="${fill}" font-size="${fs}" font-family="Noto Serif SC, serif">${tok}</text>`);
        }
      });
    });

    // 朱红小印
    const sealX = isRL ? colXs[colXs.length - 1] - 7 : colXs[colXs.length - 1] - 7;
    const sealY = Math.min(H - 34, topY + cols[cols.length - 1].length * pitchY + 6);
    parts.push(`<rect x="${sealX}" y="${sealY}" width="14" height="14" fill="${PALETTE.seal}"/>`);

    // 揭晓后显示结构检视标（每张卡指出成败）
    if (revealed) {
      const col = card.correct ? PALETTE.teal : PALETTE.seal;
      if (card.id === "A") {
        // 反向箭头
        parts.push(`<line x1="36" y1="20" x2="140" y2="20" stroke="${col}" stroke-width="1.5"/>`);
        parts.push(`<polygon points="144,20 136,16 136,24" fill="${col}"/>`);
        parts.push(`<text x="92" y="14" text-anchor="middle" fill="${col}" font-size="10.5" font-family="Noto Serif SC, serif" font-weight="700">左→右 倒序</text>`);
      } else if (card.id === "B") {
        // 横向串行桥接
        for (let r = 0; r < 4; r++) {
          const y = topY + r * pitchY;
          parts.push(`<line x1="${colXs[0]}" y1="${y}" x2="${colXs[1]}" y2="${y}" stroke="${col}" stroke-width="2" stroke-opacity="0.7"/>`);
        }
        parts.push(`<text x="${(colXs[0] + colXs[1]) / 2}" y="20" text-anchor="middle" fill="${col}" font-size="10.5" font-family="Noto Serif SC, serif" font-weight="700">列间窄于字距</text>`);
      } else if (card.id === "C") {
        parts.push(`<line x1="184" y1="20" x2="94" y2="20" stroke="${col}" stroke-width="1.5"/>`);
        parts.push(`<polygon points="90,20 98,16 98,24" fill="${col}"/>`);
        parts.push(`<text x="138" y="14" text-anchor="middle" fill="${col}" font-size="10.5" font-family="Noto Serif SC, serif" font-weight="700">右起 · 节律稳</text>`);
      } else if (card.id === "D") {
        parts.push(`<text x="${colXs[1]}" y="20" text-anchor="middle" fill="${col}" font-size="10.5" font-family="Noto Serif SC, serif" font-weight="700">句号顶首·数字躺</text>`);
      }
    }

    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${parts.join("")}</svg>`;
  }

  let pickedId = null;

  function renderAll() {
    const revealed = pickedId !== null;
    btns.forEach((btn) => {
      const id = btn.dataset.quizCard;
      const card = PRACTICE_CARDS.find((c) => c.id === id);
      if (!card) return;
      const slot = btn.querySelector(".q-art");
      if (slot) slot.innerHTML = drawCardSvg(card, revealed);
      const isPicked = pickedId === id;
      btn.setAttribute("aria-pressed", String(isPicked));
      btn.classList.toggle("is-picked", isPicked);
      btn.classList.toggle("is-correct", revealed && card.correct);
      btn.classList.toggle("is-wrong", revealed && isPicked && !card.correct);
      const tag = btn.querySelector(".q-reveal");
      if (tag) tag.textContent = revealed ? card.fault : "";
    });
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      pickedId = btn.dataset.quizCard;
      const card = PRACTICE_CARDS.find((c) => c.id === pickedId);
      if (!card) return;
      renderAll();
      verdictEl.dataset.state = card.correct ? "ok" : "err";
      if (vTitle) {
        vTitle.textContent = card.correct
          ? `选对了：样张 ${card.label} 站得最稳`
          : `再看一眼：样张 ${card.label} 绊在「${card.fault}」`;
      }
      if (vText) vText.textContent = card.note;
    });
  });

  renderAll();
}

// ---------- 08 节：原海报点击放大、拖动平移、Esc 收起 ----------
function mountPosterLightbox() {
  const btn = document.getElementById("poster-btn");
  const img = document.getElementById("poster");
  if (!btn || !img) return;

  let overlay = null;
  let pan = { x: 0, y: 0, dragging: false, sx: 0, sy: 0, px: 0, py: 0 };

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }

  function open() {
    if (overlay) return;
    pan = { x: 0, y: 0, dragging: false, sx: 0, sy: 0, px: 0, py: 0 };
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "原海报大图查看");
    overlay.innerHTML = `
      <div class="lb-bar">
        <span>拖动平移查看细节 · 再点空白处或按 Esc 收起</span>
        <button type="button" class="lb-close" aria-label="收起原海报">收起 Esc</button>
      </div>
      <div class="lb-stage">
        <img class="lb-img" src="${img.src}" draggable="false" alt="${img.alt}">
      </div>
    `;
    document.body.appendChild(overlay);
    btn.setAttribute("aria-expanded", "true");

    const closeBtn = overlay.querySelector(".lb-close");
    const lbImg = overlay.querySelector(".lb-img");
    const stage = overlay.querySelector(".lb-stage");

    closeBtn.focus();
    closeBtn.addEventListener("click", close);

    let moved = false;
    stage.addEventListener("pointerdown", (e) => {
      pan.dragging = true;
      moved = false;
      pan.sx = e.clientX;
      pan.sy = e.clientY;
      pan.px = pan.x;
      pan.py = pan.y;
      stage.setPointerCapture?.(e.pointerId);
    });
    stage.addEventListener("pointermove", (e) => {
      if (!pan.dragging) return;
      const dx = e.clientX - pan.sx;
      const dy = e.clientY - pan.sy;
      if (Math.hypot(dx, dy) > 5) moved = true;
      pan.x = Math.max(-480, Math.min(480, pan.px + dx));
      pan.y = Math.max(-560, Math.min(560, pan.py + dy));
      lbImg.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0)`;
    });
    const endPan = () => {
      pan.dragging = false;
    };
    stage.addEventListener("pointerup", (e) => {
      endPan();
      if (!moved && e.target === stage) close();
    });
    stage.addEventListener("pointercancel", endPan);
  }

  btn.addEventListener("click", open);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay) close();
  });
}

// ---------- 渐进显现（绝不锁死隐藏，减少动态效果下直接可见） ----------
function mountReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!nodes.length) return;
  if (reducedMotion.matches || typeof IntersectionObserver === "undefined") {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
  );
  nodes.forEach((n) => io.observe(n));
}

export function mountLabs() {
  mountBambooLab();
  mountHistoryLab();
  mountPhaseLab();
  mountCssLab();
  mountAppGallery();
  mountAntiCases();
  mountPractice();
  mountPosterLightbox();
  mountReveal();
}
