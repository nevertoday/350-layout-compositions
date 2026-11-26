// 046 矩形构图 — 正文 01–07 节差异化交互组件（相邻节不复用同类控件）

import { PALETTE, POSTER_PHOTO_CROP, clamp } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

/* ==================== 01：五画幅实景切窗器 ==================== */
const W1_DATA = {
  "1": {
    badge: "1:1 · 1.00:1 静止方",
    axis: "neutral",
    note: "<strong>静态中立（1:1 方形对照）</strong>：横竖两边完全相等，视线没有优先滑动方向，落回画心打转——这属于 045 方形构图的稳定逻辑，尚未拉出矩形的方向势能。",
  },
  "1.333": {
    badge: "4:3 · 1.33:1 稳健窗",
    axis: "h-mild",
    note: "<strong>轻度横向延展（1.33:1）</strong>：早期经典画册与胶片常用比例，横向开始略占上风，既保留建筑立面的稳重感，又允许视线平缓横移。",
  },
  "1.778": {
    badge: "16:9 · 1.78:1 叙事横",
    axis: "h-strong",
    note: "<strong>横向叙事势能（1.78:1）</strong>：水平边比垂直边长出近八成，红墙台阶和行者前方的空气自然拼出「时间感」，眼睛顺着长轴从左向右扫过整段故事。",
  },
  "2.39": {
    badge: "2.39:1 宽银幕长卷",
    axis: "h-wide",
    note: "<strong>宽银幕史诗延伸（2.39:1）</strong>：大幅削去上下天地、极力放宽水平视野，行者被拉进辽阔建筑通道里，孤独感与前进的叙事张力倍增。",
  },
  "0.75": {
    badge: "3:4 · 0.75:1 挺拔竖",
    axis: "v-strong",
    note: "<strong>纵向拔高势能（0.75:1）</strong>：水平空间收束后，高耸的红墙阴影与上方天空立刻成为主角，视线沿纵轴上下攀升，非常适合海报、书封与竖屏叙事。",
  },
};

export function initSection01(getPosterImg) {
  const canvas = document.getElementById("w1-canvas");
  const tabs = document.getElementById("w1-tabs");
  const badge = document.getElementById("w1-ratio-badge");
  const note = document.getElementById("w1-note");
  if (!canvas || !tabs) return () => {};

  const ctx = canvas.getContext("2d");
  let currentRatioKey = "1.778";

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(180, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const r = Number(currentRatioKey);
    const info = W1_DATA[currentRatioKey];
    const padX = 28, padY = 24;
    const availW = w - padX * 2;
    const availH = h - padY * 2;
    let fw, fh;
    if (availW / availH > r) {
      fh = availH;
      fw = fh * r;
    } else {
      fw = availW;
      fh = fw / r;
    }
    const fx = (w - fw) * 0.5;
    const fy = (h - fh) * 0.5;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.stone;
    ctx.fillRect(0, 0, w, h);

    // 框内实景裁剪（来自同一张原海报红墙行者）
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();
    const img = getPosterImg ? getPosterImg() : null;
    if (img && img.complete && img.naturalWidth > 0) {
      const c = POSTER_PHOTO_CROP;
      const srcR = c.sw / c.sh;
      let sx = c.sx, sy = c.sy, sw = c.sw, sh = c.sh;
      if (r > srcR) {
        sh = sw / r;
        sy = c.sy + (c.sh - sh) * 0.62;
      } else {
        sw = sh * r;
        sx = c.sx + (c.sw - sw) * 0.56;
      }
      ctx.drawImage(img, sx, sy, sw, sh, fx, fy, fw, fh);
    } else {
      ctx.fillStyle = PALETTE.sky;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = PALETTE.wallLit;
      ctx.fillRect(fx, fy, fw * 0.62, fh * 0.85);
      ctx.fillStyle = PALETTE.wallShadow;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + fw * 0.25, fy);
      ctx.lineTo(fx + fw * 0.55, fy + fh * 0.85);
      ctx.lineTo(fx, fy + fh * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    // 叠加阿恩海姆结构骨架虚线 + 主方向视线矢
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(fx + fw * 0.5, fy);
    ctx.lineTo(fx + fw * 0.5, fy + fh);
    ctx.moveTo(fx, fy + fh * 0.5);
    ctx.lineTo(fx + fw, fy + fh * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    // 方向势能主箭头
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = PALETTE.redFill;
    ctx.lineWidth = 2.4;
    if (info.axis === "neutral") {
      // 1:1 双向均势收束圆环
      ctx.strokeStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(fx + fw * 0.5, fy + fh * 0.5, Math.min(fw, fh) * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (info.axis === "v-strong") {
      const cx = fx + fw * 0.5;
      const y1 = fy + fh * 0.78;
      const y2 = fy + fh * 0.18;
      ctx.beginPath();
      ctx.moveTo(cx, y1);
      ctx.lineTo(cx, y2);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(cx, y2 - 4);
      ctx.lineTo(cx - 6, y2 + 7);
      ctx.lineTo(cx + 6, y2 + 7);
      ctx.closePath();
      ctx.fill();
    } else {
      const cy = fy + fh * 0.52;
      const x1 = fx + fw * 0.14;
      const x2 = fx + fw * 0.86;
      ctx.beginPath();
      ctx.moveTo(x1, cy);
      ctx.lineTo(x2, cy);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(x2 + 5, cy);
      ctx.lineTo(x2 - 7, cy - 6);
      ctx.lineTo(x2 - 7, cy + 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 锐利黑框 + 边长标注
    ctx.strokeStyle = PALETTE.frame;
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);

    ctx.fillStyle = PALETTE.redText;
    ctx.font = `600 11.5px "DM Mono", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`W : H = ${r.toFixed(2)} : 1`, fx + fw * 0.5, fy + fh + 6);
    ctx.restore();
  }

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ratio]");
    if (!btn) return;
    currentRatioKey = btn.dataset.ratio;
    tabs.querySelectorAll(".w1-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    badge.textContent = W1_DATA[currentRatioKey].badge;
    note.innerHTML = W1_DATA[currentRatioKey].note;
    draw();
  });

  draw();
  return draw;
}

/* ==================== 02：原海报四步建构推演台 ==================== */
const W2_STEPS = {
  1: {
    caption: "<strong>1. 建立矩形框架</strong>（原海报原话：确定画面边界与比例。）—— 先决定是横向延展还是纵向挺拔，画定清晰边界，先把散落的画面收进同一个舞台。",
    evenCaption: "<strong>1. 建立矩形框架</strong>—— 外框同样是 2:1 横幅，但下一步如果草率切出四块等大格子，方向势能会被内部均分抵消。",
  },
  2: {
    caption: "<strong>2. 划分功能区域</strong>（原海报原话：明确主次信息的分布位置。）—— 用两条竖刃与一条横刃切出不等大四区：最大区留给主图，窄竖柱留给辅助信息，底带留给视线导流。",
    evenCaption: "<strong>2. 对照：均分死表切法</strong>—— 横竖都从正中一刀切开，四个子矩形各占 25%，谁也不是主角，画面瞬间退化成无感情的对照表。",
  },
  3: {
    caption: "<strong>3. 安排视觉元素</strong>（原海报原话：放置主体与辅助元素，注意大小与位置关系。）—— 朱红块把第一眼锁在左侧，主体建筑占据核心视窗，辅助文字退居右侧安静排版。",
    evenCaption: "<strong>3. 对照：均分填入元素</strong>—— 同样的朱红块、照片和说明文字被迫塞进同样大小的格子里，照片被砍窄、辅助文字又空荡浪费。",
  },
  4: {
    caption: "<strong>4. 优化层级与节奏</strong>（原海报原话：调整对比、留白与间距，形成清晰、有张力的画面。）—— 统一呼吸缝、拉高红块与靛灰对比、补上底部虚线导流箭，形成连贯的叙事流。",
    evenCaption: "<strong>4. 对照结果：层级扁平</strong>—— 就算补齐配色和留白，四块面积比仍停在 1.00×，视线在四格之间来回跳伞，无法形成起承转合。",
  },
};

export function initSection02() {
  const svg = document.getElementById("w2-svg");
  const stepsEl = document.getElementById("w2-steps");
  const captionEl = document.getElementById("w2-caption");
  const barsEl = document.getElementById("w2-bars");
  const modeBtns = document.querySelectorAll("[data-w2mode]");
  if (!svg || !stepsEl) return;

  let step = 4;
  let mode = "hierarchy"; // 'hierarchy' | 'even'

  function render() {
    const isEven = mode === "even";
    const fx = 30, fy = 22, fw = 500, fh = 206;
    const g = step === 4 ? 10 : 6;
    const ix = fx + g, iy = fy + g, iw = fw - g * 2, ih = fh - g * 2;

    let rects;
    let shares;
    if (!isEven) {
      const x1 = ix + iw * 0.285;
      const x2 = ix + iw * 0.81;
      const y1 = iy + ih * 0.765;
      rects = {
        focus: { x: ix, y: iy, w: x1 - ix - g * 0.5, h: y1 - iy - g * 0.5 },
        scene: { x: x1 + g * 0.5, y: iy, w: x2 - x1 - g, h: y1 - iy - g * 0.5 },
        support: { x: x2 + g * 0.5, y: iy, w: ix + iw - (x2 + g * 0.5), h: ih },
        guide: { x: ix, y: y1 + g * 0.5, w: x2 - ix - g * 0.5, h: iy + ih - (y1 + g * 0.5) },
      };
      shares = [
        { name: "视觉主图", pct: 40, color: "#4D5564" },
        { name: "焦点红块", pct: 22, color: "#C44332" },
        { name: "信息支撑", pct: 19, color: "#31434F" },
        { name: "引导视线", pct: 19, color: "#9C9284" },
      ];
    } else {
      const mx = ix + iw * 0.5;
      const my = iy + ih * 0.5;
      rects = {
        focus: { x: ix, y: iy, w: mx - ix - g * 0.5, h: my - iy - g * 0.5 },
        scene: { x: mx + g * 0.5, y: iy, w: ix + iw - (mx + g * 0.5), h: my - iy - g * 0.5 },
        guide: { x: ix, y: my + g * 0.5, w: mx - ix - g * 0.5, h: iy + ih - (my + g * 0.5) },
        support: { x: mx + g * 0.5, y: my + g * 0.5, w: ix + iw - (mx + g * 0.5), h: iy + ih - (my + g * 0.5) },
      };
      shares = [
        { name: "视觉主图", pct: 25, color: "#4D5564" },
        { name: "焦点红块", pct: 25, color: "#C44332" },
        { name: "信息支撑", pct: 25, color: "#31434F" },
        { name: "引导视线", pct: 25, color: "#9C9284" },
      ];
    }

    let out = `<rect x="0" y="0" width="560" height="250" fill="#F7F3ED"/>`;
    if (step === 1) {
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="2" stroke-dasharray="8 6"/>`;
      out += `<line x1="${fx}" y1="${fy + fh + 14}" x2="${fx + fw}" y2="${fy + fh + 14}" stroke="#B03222" stroke-width="1.3" stroke-dasharray="4 4"/>`;
      out += `<text x="${fx + fw * 0.5}" y="${fy + fh * 0.5}" text-anchor="middle" fill="#252A36" font-size="16" font-weight="700">1. 先定 2.07:1 横向矩形画框</text>`;
    } else if (step === 2) {
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="2"/>`;
      for (const [k, r] of Object.entries(rects)) {
        const lbl = k === "focus" ? "焦点区" : k === "scene" ? "主图区" : k === "support" ? "信息柱" : "导流带";
        out += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#FAF7F2" stroke="#D35443" stroke-width="1.4" stroke-dasharray="5 4"/>`;
        out += `<text x="${r.x + r.w * 0.5}" y="${r.y + r.h * 0.5 + 4}" text-anchor="middle" fill="#B03222" font-size="13" font-weight="700">${lbl}</text>`;
      }
    } else {
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="2"/>`;
      const f = rects.focus, sc = rects.scene, su = rects.support, gd = rects.guide;
      // 焦点红块
      out += `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="${step === 4 ? "#C44332" : "#E69588"}"/>`;
      out += `<text x="${f.x + 12}" y="${f.y + 24}" fill="${step === 4 ? "#FFFFFF" : "#252A36"}" font-size="13" font-weight="700">视觉焦点</text>`;
      out += `<rect x="${f.x + 12}" y="${f.y + 34}" width="${Math.min(44, f.w * 0.35)}" height="3" fill="${step === 4 ? "#FFFFFF" : "#252A36"}"/>`;

      // 主图区
      out += `<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.h}" fill="#C3CDD3"/>`;
      out += `<rect x="${sc.x}" y="${sc.y}" width="${sc.w * 0.62}" height="${sc.h * 0.85}" fill="#E0624A"/>`;
      out += `<polygon points="${sc.x},${sc.y} ${sc.x + sc.w * 0.25},${sc.y} ${sc.x + sc.w * 0.55},${sc.y + sc.h * 0.85} ${sc.x},${sc.y + sc.h * 0.85}" fill="#591C15"/>`;
      out += `<rect x="${sc.x}" y="${sc.y + sc.h * 0.85}" width="${sc.w}" height="${sc.h * 0.15}" fill="#E4DED5"/>`;

      // 信息支撑柱
      out += `<rect x="${su.x}" y="${su.y}" width="${su.w}" height="${su.h}" fill="${step === 4 ? "#31434F" : "#7D8B94"}"/>`;
      out += `<text x="${su.x + 10}" y="${su.y + 24}" fill="#FFFFFF" font-size="12.5" font-weight="700">信息支撑</text>`;
      out += `<rect x="${su.x + 10}" y="${su.y + 36}" width="${Math.max(18, su.w - 22)}" height="3" fill="rgba(255,255,255,0.65)"/>`;
      out += `<rect x="${su.x + 10}" y="${su.y + 45}" width="${Math.max(14, su.w - 30)}" height="3" fill="rgba(255,255,255,0.45)"/>`;

      // 引导视线带
      out += `<rect x="${gd.x}" y="${gd.y}" width="${gd.w}" height="${gd.h}" fill="#ECE4D9"/>`;
      out += `<text x="${gd.x + 12}" y="${gd.y + 22}" fill="#252A36" font-size="12" font-weight="700">引导视线</text>`;
      if (step === 4 && !isEven) {
        const ay = gd.y + gd.h * 0.56;
        out += `<line x1="${gd.x + 88}" y1="${ay}" x2="${gd.x + gd.w - 18}" y2="${ay}" stroke="#252A36" stroke-width="1.4" stroke-dasharray="4 4"/>`;
        out += `<polygon points="${gd.x + gd.w - 12},${ay} ${gd.x + gd.w - 20},${ay - 4} ${gd.x + gd.w - 20},${ay + 4}" fill="#252A36"/>`;
      }
      if (isEven) {
        out += `<rect x="${fx + fw * 0.5 - 52}" y="${fy + fh * 0.5 - 12}" width="104" height="24" fill="#AE261B"/>`;
        out += `<text x="${fx + fw * 0.5}" y="${fy + fh * 0.5 + 4}" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="700">四格均分 1.00×</text>`;
      }
    }

    svg.innerHTML = out;
    captionEl.innerHTML = isEven ? W2_STEPS[step].evenCaption : W2_STEPS[step].caption;
    barsEl.innerHTML = shares.map((s) => `
      <div class="w2-bar-item">
        <div class="w2-bar-label"><span>${s.name}</span><span lang="en">${s.pct}%</span></div>
        <div class="w2-bar-track"><div class="w2-bar-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
      </div>
    `).join("");
  }

  stepsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    step = Number(btn.dataset.step);
    stepsEl.querySelectorAll(".w2-step").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.w2mode;
      modeBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  render();
}

/* ==================== 03：二维「有框而不拘」相空间触控板 ==================== */
export function initSection03() {
  const pad = document.getElementById("w3-pad");
  const handle = document.getElementById("w3-handle");
  const coordEl = document.getElementById("w3-coord");
  const badgeEl = document.getElementById("w3-state-badge");
  const paramsEl = document.getElementById("w3-params");
  const svg = document.getElementById("w3-preview");
  const explainEl = document.getElementById("w3-explain");
  const qbtns = document.querySelectorAll("[data-w3]");
  if (!pad || !svg) return;

  // x: 呼吸度 0–100（左紧右散），y: 边界约束力 0–100（下松上紧，注意屏幕坐标 top = 100 - y）
  let bx = 62;
  let by = 74;
  let dragging = false;

  function render() {
    handle.style.left = `${bx}%`;
    handle.style.top = `${100 - by}%`;
    coordEl.textContent = `呼吸 ${Math.round(bx)}% · 框束 ${Math.round(by)}%`;

    const gutter = Math.round((bx / 100) * 32);
    const borderW = by < 20 ? 0 : +(1 + (by / 100) * 2.5).toFixed(1);
    const breakout = by > 30 && by < 60 && bx >= 45 && bx <= 82 ? Math.round((60 - by) * 0.6) : 0;

    let status, isOk, text;
    if (bx < 36 && by >= 50) {
      status = "铁笼闷死（有框而拘）";
      isOk = false;
      text = "外框锁得很死，内部间隙却被压成极窄细缝。色块之间互相顶撞，整张图只有僵硬约束，没有视觉呼吸感。";
    } else if (bx < 36 && by < 50) {
      status = "拥挤失控（无框贴撞）";
      isOk = false;
      text = "既没有外框约束，又缺少内部留白间距，元素堆成一团，边界模糊且结构混乱。";
    } else if (bx > 78 && by < 42) {
      status = "漂浮散架（框定失守）";
      isOk = false;
      text = "边界约束过弱、缝隙拉得太开，原本互相呼应的四个功能区解体成互不关联的散卡片，矩形秩序已经散失。";
    } else if (breakout > 0) {
      status = "微破框张力（可控活态）";
      isOk = true;
      text = "主体照片有克制地探出外框一角，其余三边仍严格守住矩形正交秩序——这是成熟海报常见的「局部破框」，既有框定底气又有惊喜动势。";
    } else if (bx >= 40 && bx <= 78 && by >= 52) {
      status = "稳态：有框而不拘";
      isOk = true;
      text = "外框笔直有力地收住边界，内部四个子矩形之间保留清晰的白纸呼吸缝，红块与建筑主图既服从同一正交秩序，又不互相贴撞——稳重又生动。";
    } else {
      status = "过渡区：接近平衡";
      isOk = true;
      text = "呼吸缝或外框力度正处于过渡带。继续往右上角虚线绿区微调，就能稳定落在「有框而不拘」的舒适区间。";
    }

    badgeEl.textContent = status;
    badgeEl.classList.toggle("is-warn", !isOk);
    paramsEl.textContent = `外框 ${borderW}px · 内缝 ${gutter}px · 破框 ${breakout}px`;
    explainEl.textContent = text;

    // 实时绘制右侧微型矩形构图预览
    const fx = 42, fy = 30, fw = 376, fh = 220;
    const padIn = gutter * 0.9;
    const ix = fx + padIn, iy = fy + padIn;
    const iw = Math.max(120, fw - padIn * 2), ih = Math.max(90, fh - padIn * 2);
    const g = gutter * 0.72;
    const x1 = ix + iw * 0.29;
    const x2 = ix + iw * 0.80;
    const y1 = iy + ih * 0.75;

    const scatterOff = bx > 78 && by < 42 ? (bx - 78) * 0.45 : 0;
    const sceneBreak = breakout;

    let out = `<rect x="0" y="0" width="460" height="280" fill="#F7F3ED"/>`;
    out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${borderW > 0 ? "#FFFFFF" : "rgba(255,255,255,0.4)"}" stroke="${borderW > 0 ? "#1C1C1C" : "#AE261B"}" stroke-width="${borderW > 0 ? borderW : 1.2}" ${borderW === 0 ? 'stroke-dasharray="6 5"' : ""}/>`;

    // 焦块
    out += `<rect x="${ix - scatterOff}" y="${iy - scatterOff * 0.5}" width="${Math.max(24, x1 - ix - g * 0.5)}" height="${Math.max(24, y1 - iy - g * 0.5)}" fill="#C44332"/>`;
    // 主图（支持微破框向上探出！）
    const sx = x1 + g * 0.5;
    const sy = iy - sceneBreak;
    const sw = Math.max(36, x2 - x1 - g);
    const sh = Math.max(36, y1 - iy - g * 0.5 + sceneBreak);
    out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#C3CDD3"/>`;
    out += `<rect x="${sx}" y="${sy}" width="${sw * 0.62}" height="${sh * 0.85}" fill="#E46651"/>`;
    out += `<polygon points="${sx},${sy} ${sx + sw * 0.25},${sy} ${sx + sw * 0.56},${sy + sh * 0.85} ${sx},${sy + sh * 0.85}" fill="#591C15"/>`;
    out += `<rect x="${sx}" y="${sy + sh * 0.85}" width="${sw}" height="${sh * 0.15}" fill="#E5DFD6"/>`;

    // 信息柱
    out += `<rect x="${x2 + g * 0.5 + scatterOff}" y="${iy}" width="${Math.max(20, ix + iw - (x2 + g * 0.5))}" height="${ih}" fill="#31434F"/>`;
    // 导流带
    out += `<rect x="${ix}" y="${y1 + g * 0.5 + scatterOff * 0.6}" width="${Math.max(40, x2 - ix - g * 0.5)}" height="${Math.max(16, iy + ih - (y1 + g * 0.5))}" fill="#ECE4D9"/>`;

    svg.innerHTML = out;
  }

  function updateFromPointer(e) {
    const rect = pad.getBoundingClientRect();
    bx = clamp(((e.clientX - rect.left) / rect.width) * 100, 4, 96);
    by = clamp((1 - (e.clientY - rect.top) / rect.height) * 100, 4, 96);
    qbtns.forEach((b) => b.classList.remove("is-active"));
    render();
  }

  pad.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { pad.setPointerCapture(e.pointerId); } catch {}
    updateFromPointer(e);
  });
  pad.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    updateFromPointer(e);
  });
  pad.addEventListener("pointerup", () => { dragging = false; });
  pad.addEventListener("pointercancel", () => { dragging = false; });

  pad.addEventListener("keydown", (e) => {
    const step = 6;
    if (e.key === "ArrowLeft") { bx = clamp(bx - step, 4, 96); e.preventDefault(); render(); }
    else if (e.key === "ArrowRight") { bx = clamp(bx + step, 4, 96); e.preventDefault(); render(); }
    else if (e.key === "ArrowUp") { by = clamp(by + step, 4, 96); e.preventDefault(); render(); }
    else if (e.key === "ArrowDown") { by = clamp(by - step, 4, 96); e.preventDefault(); render(); }
  });

  qbtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const [nx, ny] = btn.dataset.w3.split(",").map(Number);
      bx = nx; by = ny;
      qbtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
}

/* ==================== 04：四幅历史几何标本展板 ==================== */
const W4_ERAS = {
  alberti: {
    era: "1435 · DE PICTURA",
    actionLabel: "切换透视网格密度",
    title: "1435 · 把画布定义成「敞开的矩形窗户」",
    body: "文艺复兴建筑师与人文主义者莱昂·巴蒂斯塔·阿尔伯蒂在 1435 年拉丁文完稿的《论绘画》（De pictura，1436 年出版意大利文版 Della pittura）第一卷中写道：作画前先在平面上画出一个矩形，把它视作「一扇敞开的窗户」，透过它观看画面里的空间。矩形自此成为切分虚构空间与现实视野的标准视口。",
    source: "核实出处：Encyclopaedia Britannica · Leon Battista Alberti (De pictura, 1435)",
  },
  mondrian: {
    era: "1921 · DE STIJL",
    actionLabel: "切换：非对称平衡 / 僵化对称",
    title: "1921 · 蒙德里安与非对称矩形动态平衡",
    body: "荷兰「风格派」（De Stijl，1917 年创立）代表人物皮特·蒙德里安在《大红面、黄、黑、灰与蓝的构图》（1921，现藏海牙市立美术馆）中，仅用水平与垂直线条分割出大小悬殊的矩形。大片高饱和朱红只靠边角小块黄、蓝与深黑稳稳压秤——证明矩形构图的秩序不必依赖死板对称。",
    source: "核实出处：Kunstmuseum Den Haag 藏品页 · Composition with Large Red Plane, Yellow, Black, Gray and Blue (1921)",
  },
  din476: {
    era: "1922 DIN 476 → 1975 ISO 216",
    actionLabel: "再对折一次（检验 √2 不变）",
    title: "1922 / 1975 · 怎样裁都不变形的 1:√2 矩形纸张",
    body: "1922 年，德国工程师瓦尔特·波斯特曼把 1:√2（约 1:1.414）长宽比与公制面积（A0 为 1 平方米）结合，发布 DIN 476 标准，并于 1975 年成为国际标准 ISO 216。这个矩形有一个独一无二的几何本领：沿长边正中对折，切出的 A1、A2、A3、A4 每一张依然严格保持 1:1.414，直接塑造了现代书刊与海报的版面比例。",
    source: "核实出处：ISO 216 (1975) / DIN 476 (1922) 纸张尺寸国际标准",
  },
  swiss: {
    era: "1954–1981 · ARNHEIM & MÜLLER-BROCKMANN",
    actionLabel: "切换网格模数（8 / 12 / 16 格）",
    title: "1954–1981 · 从视知觉骨架到瑞士网格系统",
    body: "鲁道夫·阿恩海姆在《艺术与视知觉》（1954 初版，1974 加州大学出版社修订版）用格式塔心理学揭示了矩形画框内部隐含的视觉拉力；随后瑞士平面设计大师约瑟夫·米勒-布罗克曼在《平面设计中的网格系统》（1981，Niggli 出版社）中将矩形分区系统化为 8 至 32 格的模块体系，让现代杂志、海报与网页布局有了统一语法。",
    source: "核实出处：UC Press (Arnheim 1974) · Verlag Arthur Niggli (Müller-Brockmann 1981)",
  },
};

export function initSection04() {
  const tabs = document.getElementById("w4-tabs");
  const svg = document.getElementById("w4-svg");
  const eraEl = document.getElementById("w4-plate-era");
  const actBtn = document.getElementById("w4-plate-action");
  const copyEl = document.getElementById("w4-plate-copy");
  if (!tabs || !svg) return;

  let era = "alberti";
  let toggleStep = 0;

  function drawPlate() {
    const meta = W4_ERAS[era];
    eraEl.textContent = meta.era;
    actBtn.textContent = meta.actionLabel;
    copyEl.innerHTML = `<h3>${meta.title}</h3><p>${meta.body}</p><p class="w4-source">${meta.source}</p>`;

    let out = `<rect x="0" y="0" width="520" height="270" fill="#F7F3ED"/>`;

    if (era === "alberti") {
      const dense = toggleStep % 2 === 1;
      const fx = 80, fy = 26, fw = 360, fh = 216;
      const vx = fx + fw * 0.56, vy = fy + fh * 0.44;
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="2.4"/>`;
      // 地平线与汇聚灭点射线
      out += `<line x1="${fx}" y1="${vy}" x2="${fx + fw}" y2="${vy}" stroke="#B03222" stroke-width="1.2" stroke-dasharray="5 4"/>`;
      const rays = dense ? 10 : 6;
      for (let i = 0; i <= rays; i++) {
        const bx = fx + (fw / rays) * i;
        out += `<line x1="${vx}" y1="${vy}" x2="${bx}" y2="${fy + fh}" stroke="#31434F" stroke-width="1" opacity="0.6"/>`;
      }
      // 透视横阶线
      const rows = dense ? 6 : 4;
      for (let j = 1; j <= rows; j++) {
        const t = (j / (rows + 1)) ** 1.5;
        const y = vy + (fy + fh - vy) * t;
        out += `<line x1="${fx}" y1="${y.toFixed(1)}" x2="${fx + fw}" y2="${y.toFixed(1)}" stroke="#31434F" stroke-width="1" opacity="0.5"/>`;
      }
      // 窗内建筑矩形立面示意
      out += `<rect x="${fx + 44}" y="${fy + 44}" width="84" height="122" fill="#D35443" opacity="0.88"/>`;
      out += `<circle cx="${vx}" cy="${vy}" r="4.5" fill="#B03222"/>`;
      out += `<text x="${vx + 9}" y="${vy - 6}" fill="#B03222" font-size="11.5" font-weight="700">中心灭点</text>`;
      out += `<text x="${fx + fw - 8}" y="${fy + 18}" text-anchor="end" fill="#252A36" font-size="11.5" font-weight="700">FINESTRA APERTA · 敞开之窗</text>`;
    } else if (era === "mondrian") {
      const sym = toggleStep % 2 === 1;
      const fx = 135, fy = 20, fw = 250, fh = 230;
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#FCFBF8" stroke="#1C1C1C" stroke-width="3"/>`;
      if (!sym) {
        // 致敬 1921 非对称动态平衡（大红块 + 角落黄/蓝/黑）
        out += `<rect x="${fx + 62}" y="${fy + 2}" width="150" height="136" fill="#D35443"/>`;
        out += `<rect x="${fx + 2}" y="${fy + 142}" width="56" height="58" fill="#E3B23C"/>`;
        out += `<rect x="${fx + 216}" y="${fy + 142}" width="32" height="58" fill="#2C4F7C"/>`;
        out += `<rect x="${fx + 62}" y="${fy + 142}" width="56" height="58" fill="#22252A"/>`;
        out += `<line x1="${fx + 60}" y1="${fy}" x2="${fx + 60}" y2="${fy + fh}" stroke="#1C1C1C" stroke-width="4.5"/>`;
        out += `<line x1="${fx + 214}" y1="${fy}" x2="${fx + 214}" y2="${fy + fh}" stroke="#1C1C1C" stroke-width="4.5"/>`;
        out += `<line x1="${fx}" y1="${fy + 140}" x2="${fx + fw}" y2="${fy + 140}" stroke="#1C1C1C" stroke-width="4.5"/>`;
        out += `<line x1="${fx}" y1="${fy + 202}" x2="${fx + fw}" y2="${fy + 202}" stroke="#1C1C1C" stroke-width="4.5"/>`;
        out += `<line x1="${fx + 120}" y1="${fy + 140}" x2="${fx + 120}" y2="${fy + fh}" stroke="#1C1C1C" stroke-width="4.5"/>`;
        out += `<text x="260" y="264" text-anchor="middle" fill="#1B6652" font-size="12" font-weight="700">非对称面积配重：1 大红块 × 3 小色块形成灵动平衡</text>`;
      } else {
        out += `<rect x="${fx + 2}" y="${fy + 2}" width="121" height="111" fill="#D35443"/>`;
        out += `<rect x="${fx + 127}" y="${fy + 2}" width="121" height="111" fill="#E3B23C"/>`;
        out += `<rect x="${fx + 2}" y="${fy + 117}" width="121" height="111" fill="#2C4F7C"/>`;
        out += `<rect x="${fx + 127}" y="${fy + 117}" width="121" height="111" fill="#22252A"/>`;
        out += `<line x1="${fx + 125}" y1="${fy}" x2="${fx + 125}" y2="${fy + fh}" stroke="#1C1C1C" stroke-width="4.5"/>`;
        out += `<line x1="${fx}" y1="${fy + 115}" x2="${fx + fw}" y2="${fy + 115}" stroke="#1C1C1C" stroke-width="4.5"/>`;
        out += `<text x="260" y="264" text-anchor="middle" fill="#AE261B" font-size="12" font-weight="700">对照：四等分对称格子，画面顿时失去节奏张力</text>`;
      }
    } else if (era === "din476") {
      // 递归演示 1:√2 对折自相似：A0 -> A1 -> A2 -> A3 -> A4
      const folds = (toggleStep % 4) + 1; // 1..4 次对折
      let x = 86, y = 20, w = 348, h = 246; // 348/246 = 1.4146 ≈ √2
      out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="2.2"/>`;
      const colors = ["#ECE4D9", "#E6B5A8", "#C8D3DA", "#D35443"];
      let cx = x, cy = y, cw = w, ch = h;
      for (let i = 0; i < folds; i++) {
        if (i % 2 === 0) {
          // 沿长边竖折
          const hw = cw * 0.5;
          out += `<rect x="${cx}" y="${cy}" width="${hw}" height="${ch}" fill="${colors[i]}" stroke="#1C1C1C" stroke-width="1.4"/>`;
          out += `<text x="${cx + hw * 0.5}" y="${cy + ch * 0.5 + 4}" text-anchor="middle" fill="${i === 3 ? "#FFFFFF" : "#252A36"}" font-size="${15 - i}" font-weight="700">A${i + 1} (1:1.414)</text>`;
          cx += hw;
          cw = hw;
        } else {
          // 沿长边横折
          const hh = ch * 0.5;
          out += `<rect x="${cx}" y="${cy}" width="${cw}" height="${hh}" fill="${colors[i]}" stroke="#1C1C1C" stroke-width="1.4"/>`;
          out += `<text x="${cx + cw * 0.5}" y="${cy + hh * 0.5 + 4}" text-anchor="middle" fill="${i === 3 ? "#FFFFFF" : "#252A36"}" font-size="${14 - i}" font-weight="700">A${i + 1}</text>`;
          cy += hh;
          ch = hh;
        }
      }
      out += `<text x="${cx + cw * 0.5}" y="${cy + ch * 0.5 + 4}" text-anchor="middle" fill="#B03222" font-size="12" font-weight="700">余下 A${folds} 依然 1:√2</text>`;
    } else {
      // 1981 瑞士网格：切换 8 / 12 / 16 格
      const presets = [
        { cols: 4, rows: 2, label: "8 格瑞士模块网格" },
        { cols: 4, rows: 3, label: "12 格杂志模块网格" },
        { cols: 4, rows: 4, label: "16 格精密出版网格" },
      ];
      const p = presets[toggleStep % 3];
      const fx = 66, fy = 22, fw = 388, fh = 216, g = 8;
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="2"/>`;
      const cw = (fw - g * (p.cols + 1)) / p.cols;
      const ch = (fh - g * (p.rows + 1)) / p.rows;
      for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
          const rx = fx + g + c * (cw + g);
          const ry = fy + g + r * (ch + g);
          out += `<rect x="${rx}" y="${ry}" width="${cw}" height="${ch}" fill="#F4EFE8" stroke="#CFC6BB" stroke-width="1"/>`;
        }
      }
      // 叠放跨格主次模块（演示模块网格如何组合出不等大矩形）
      out += `<rect x="${fx + g}" y="${fy + g}" width="${cw}" height="${ch * Math.max(1, p.rows - 1) + g * Math.max(0, p.rows - 2)}" fill="#C44332" opacity="0.9"/>`;
      out += `<rect x="${fx + g * 2 + cw}" y="${fy + g}" width="${cw * 2 + g}" height="${ch * Math.max(1, p.rows - 1) + g * Math.max(0, p.rows - 2)}" fill="#31434F" opacity="0.88"/>`;
      out += `<rect x="${fx + g * 4 + cw * 3}" y="${fy + g}" width="${cw}" height="${fh - g * 2}" fill="#252A36" opacity="0.82"/>`;
      out += `<text x="260" y="258" text-anchor="middle" fill="#252A36" font-size="12.5" font-weight="700">${p.label} · 按模数跨格拼出主次矩形</text>`;
    }

    svg.innerHTML = out;
  }

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-era]");
    if (!btn) return;
    era = btn.dataset.era;
    toggleStep = 0;
    tabs.querySelectorAll(".w4-item").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    drawPlate();
  });

  actBtn.addEventListener("click", () => {
    toggleStep++;
    drawPlate();
  });

  drawPlate();
}

/* ==================== 05：原海报四大适用场景速查卡 ==================== */
const W5_DATA = {
  print: {
    ratio: "16:9 演示页 / 1:√2 书籍海报 / 2:1 展览主视觉",
    zoning: "2–4 个不等大子区，主区占 40%–60%",
    why: "印刷纸张、投影幕布与书籍跨页本身就是矩形，用内部正交隔断划分主标题、主图与辅助文字，既贴合媒介物理边界，又能靠长短边自然交代阅读起点和终点。",
    pitfall: "每页子矩形一般不超过 4–5 块（经验值）；超过 6 块且大小接近，就会退化成杂乱的便签墙。",
  },
  web: {
    ratio: "桌面 16:9 宽屏 / 移动端 9:16 竖屏卡片流",
    zoning: "主内容区 + 辅助侧栏或 Bento 不等跨度卡片",
    why: "浏览器视口与 CSS Grid 天然以矩形为基本单位。在首页首屏、Bento 特性墙与数据看板中，用清晰的边界和统一间距区分功能区，能大幅降低扫描成本。",
    pitfall: "窄屏下别硬保桌面三栏横向矩形，需顺势转为纵向延伸矩形，避免文字被压成碎条。",
  },
  photo: {
    ratio: "3:2 相机经典 / 16:9 剧集 / 2.39:1 宽银幕电影",
    zoning: "建筑门框、走廊、地平线形成的自然画中画矩形",
    why: "摄影师常借用墙面、窗框、台阶这些现实里的矩形边界来二次框定主体，并在人物朝向一侧留出延展空间，把瞬间静止画面拍出前进的叙事张力。",
    pitfall: "不要把行进中的人物紧紧贴在前进方向的那条画框边上，否则会被矩形边界「撞墙」憋死。",
  },
  brand: {
    ratio: "1.5:1–2.2:1 展陈背板 / 3:4 竖版产品画册",
    zoning: "品牌标志色焦块 + 静物主摄影 + 极简参数列",
    why: "建筑、家电、工业设计与高端器物品牌特别偏爱矩形构图：直来直去的边界自带理性、精准与可靠气质，色块与静物互相衬托，一眼建立专业信任感。",
    pitfall: "品牌色块面积与留白比例要克制，若满屏塞满高饱和色块且无白缝，会显得廉价促销。",
  },
};

export function initSection05() {
  const cards = document.getElementById("w5-cards");
  const detail = document.getElementById("w5-detail");
  if (!cards || !detail) return;

  cards.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sc]");
    if (!btn) return;
    const d = W5_DATA[btn.dataset.sc];
    if (!d) return;
    cards.querySelectorAll(".w5-card").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    detail.innerHTML = `
      <div class="w5-spec-row">
        <span class="w5-spec">常用框比（经验值）：<strong>${d.ratio}</strong></span>
        <span class="w5-spec">分区建议（经验值）：<strong>${d.zoning}</strong></span>
      </div>
      <p><strong>为什么好用：</strong>${d.why}</p>
      <p><strong>落地避坑：</strong>${d.pitfall}</p>
    `;
  });
}

/* ==================== 06：两道单变量视觉诊断练习 ==================== */
function makeQuizSvg(kind) {
  // 所有选项素材、配色与信息量严格一致，仅差一个结构变量，绝不在图形上贴文字提示答案
  if (kind === "q1-a") {
    // 均分四格（25%×4）
    return `<svg class="quiz-opt-svg" viewBox="0 0 240 135" aria-hidden="true">
      <rect x="6" y="6" width="228" height="123" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="1.8"/>
      <rect x="13" y="13" width="104" height="51" fill="#C44332"/>
      <rect x="123" y="13" width="104" height="51" fill="#C3CDD3"/>
      <rect x="123" y="13" width="64" height="43" fill="#E46651"/>
      <polygon points="123,13 150,13 175,56 123,56" fill="#591C15"/>
      <rect x="13" y="70" width="104" height="52" fill="#ECE4D9"/>
      <line x1="26" y1="96" x2="98" y2="96" stroke="#252A36" stroke-width="1.2" stroke-dasharray="3 3"/>
      <polygon points="103,96 97,93 97,99" fill="#252A36"/>
      <rect x="123" y="70" width="104" height="52" fill="#31434F"/>
    </svg>`;
  }
  if (kind === "q1-b") {
    // 主次配比正确，但 0px 呼吸缝贴死黑框
    return `<svg class="quiz-opt-svg" viewBox="0 0 240 135" aria-hidden="true">
      <rect x="6" y="6" width="228" height="123" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="2"/>
      <rect x="7" y="7" width="54" height="94" fill="#C44332"/>
      <rect x="61" y="7" width="128" height="94" fill="#C3CDD3"/>
      <rect x="61" y="7" width="80" height="80" fill="#E46651"/>
      <polygon points="61,7 92,7 125,87 61,87" fill="#591C15"/>
      <rect x="189" y="7" width="44" height="121" fill="#31434F"/>
      <rect x="7" y="101" width="182" height="27" fill="#ECE4D9"/>
      <line x1="88" y1="114" x2="174" y2="114" stroke="#252A36" stroke-width="1.2" stroke-dasharray="3 3"/>
      <polygon points="179,114 173,111 173,117" fill="#252A36"/>
    </svg>`;
  }
  if (kind === "q1-c") {
    // 正确答案：清晰外框 + 16:9 横向延展 + 主次错落 + 均匀呼吸缝 + 导流箭
    return `<svg class="quiz-opt-svg" viewBox="0 0 240 135" aria-hidden="true">
      <rect x="6" y="6" width="228" height="123" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="1.8"/>
      <rect x="13" y="13" width="52" height="80" fill="#C44332"/>
      <rect x="71" y="13" width="112" height="80" fill="#C3CDD3"/>
      <rect x="71" y="13" width="70" height="68" fill="#E46651"/>
      <polygon points="71,13 98,13 128,81 71,81" fill="#591C15"/>
      <rect x="189" y="13" width="38" height="109" fill="#31434F"/>
      <rect x="13" y="99" width="170" height="23" fill="#ECE4D9"/>
      <line x1="88" y1="110" x2="170" y2="110" stroke="#252A36" stroke-width="1.2" stroke-dasharray="3 3"/>
      <polygon points="175,110 169,107 169,113" fill="#252A36"/>
    </svg>`;
  }
  if (kind === "q1-d") {
    // 无外框 + 过度离散漂浮
    return `<svg class="quiz-opt-svg" viewBox="0 0 240 135" aria-hidden="true">
      <rect x="4" y="4" width="46" height="66" fill="#C44332"/>
      <rect x="74" y="10" width="90" height="64" fill="#C3CDD3"/>
      <rect x="74" y="10" width="56" height="54" fill="#E46651"/>
      <polygon points="74,10 96,10 120,64 74,64" fill="#591C15"/>
      <rect x="192" y="18" width="40" height="104" fill="#31434F"/>
      <rect x="24" y="104" width="136" height="22" fill="#ECE4D9"/>
      <line x1="70" y1="115" x2="146" y2="115" stroke="#252A36" stroke-width="1.2" stroke-dasharray="3 3"/>
      <polygon points="151,115 145,112 145,118" fill="#252A36"/>
    </svg>`;
  }

  // 题 2：3:4 竖幅画册封面（viewBox 180×220）
  if (kind === "q2-a") {
    // 暧昧近方缩在中间，上下大片失联留白
    return `<svg class="quiz-opt-svg" viewBox="0 0 180 220" aria-hidden="true">
      <rect x="20" y="42" width="140" height="134" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="1.8"/>
      <rect x="27" y="49" width="126" height="64" fill="#C3CDD3"/>
      <rect x="27" y="49" width="78" height="54" fill="#E46651"/>
      <polygon points="27,49 58,49 90,103 27,103" fill="#591C15"/>
      <rect x="27" y="119" width="60" height="50" fill="#C44332"/>
      <rect x="93" y="119" width="60" height="50" fill="#31434F"/>
    </svg>`;
  }
  if (kind === "q2-b") {
    // 正确答案：3:4 竖框充盈、上主图 56%、中焦红块+辅柱、底导流条、均匀呼吸缝
    return `<svg class="quiz-opt-svg" viewBox="0 0 180 220" aria-hidden="true">
      <rect x="18" y="8" width="144" height="204" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="1.8"/>
      <rect x="25" y="15" width="130" height="106" fill="#C3CDD3"/>
      <rect x="25" y="15" width="80" height="90" fill="#E46651"/>
      <polygon points="25,15 58,15 92,105 25,105" fill="#591C15"/>
      <rect x="25" y="127" width="76" height="48" fill="#C44332"/>
      <rect x="107" y="127" width="48" height="48" fill="#31434F"/>
      <rect x="25" y="181" width="130" height="24" fill="#ECE4D9"/>
    </svg>`;
  }
  if (kind === "q2-c") {
    // 四条等高横带均分
    return `<svg class="quiz-opt-svg" viewBox="0 0 180 220" aria-hidden="true">
      <rect x="18" y="8" width="144" height="204" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="1.8"/>
      <rect x="25" y="15" width="130" height="43" fill="#C44332"/>
      <rect x="25" y="64" width="130" height="43" fill="#C3CDD3"/>
      <rect x="25" y="64" width="80" height="36" fill="#E46651"/>
      <rect x="25" y="113" width="130" height="43" fill="#31434F"/>
      <rect x="25" y="162" width="130" height="43" fill="#ECE4D9"/>
    </svg>`;
  }
  // q2-d：主图被压成顶部细条，文字块吞噬 80%
  return `<svg class="quiz-opt-svg" viewBox="0 0 180 220" aria-hidden="true">
    <rect x="18" y="8" width="144" height="204" fill="#FFFFFF" stroke="#1C1C1C" stroke-width="1.8"/>
    <rect x="25" y="15" width="130" height="30" fill="#C3CDD3"/>
    <rect x="25" y="15" width="80" height="25" fill="#E46651"/>
    <rect x="25" y="51" width="62" height="122" fill="#C44332"/>
    <rect x="93" y="51" width="62" height="122" fill="#31434F"/>
    <rect x="25" y="179" width="130" height="26" fill="#ECE4D9"/>
  </svg>`;
}

const QUIZ_DATA = [
  {
    prompt: "场景 1/2：为「当代红砖建筑摄影展」做一张 16:9 横幅主视觉，素材、配色与字数完全一致，下面四个方案只差单一结构变量。哪一版最完整地做到了「框定、延展、分区、叙事」四项兼得？",
    correct: "C",
    options: [
      { id: "A", svg: "q1-a", desc: "方案 A", feedback: "还差一步：外框比例和呼吸缝都没问题，但内部正交隔断刚好把画面切成了四个面积打平（约 25%×4）的格子。视觉焦点、建筑主图与信息栏平权抢戏，叙事层级被拉平。" },
      { id: "B", svg: "q1-b", desc: "方案 B", feedback: "很接近了，但败在「有框而拘」：它的分区面积比例其实非常合理，可内缝与外框边距全是 0px，四个色块硬顶着黑框互相挤压，失去了原海报 TIPS 强调的呼吸感。" },
      { id: "C", svg: "q1-c", desc: "方案 C", feedback: "答对了！这版同时守住了四个条件：外框清晰且留有均匀白缝（有框而不拘）、16:9 拉出明确横向延展、主图领衔且主次面积分明、视线顺着左红块 → 建筑主图 → 底箭 → 右信息柱自然收束。" },
      { id: "D", svg: "q1-d", desc: "方案 D", feedback: "框定失守：面积比例虽有大小，但取消外框并把间距炸开后，四个色块变成各自漂浮的零散卡片，失去了矩形构图最核心的整体约束感。" },
    ],
  },
  {
    prompt: "场景 2/2：同一场展览要加印 3:4 竖幅画册封面，同样包含主图、朱红标题块、深灰刊号与底条四个区域。下面哪一版真正发挥了竖向矩形的纵深优势？",
    correct: "B",
    options: [
      { id: "A", svg: "q2-a", desc: "方案 A", feedback: "方向势能丢失：它在竖幅封面里画了一个接近 1.04:1 的暧昧方框，上下留出大片失联空白，既没有发挥 3:4 竖矩形的纵向延展，也让页面上下脱节。" },
      { id: "B", svg: "q2-b", desc: "方案 B", feedback: "答对了！3:4 竖框充盈稳固，顶部主图以 56% 面积建立高耸建筑纵深，中段左红标题块与右深灰刊号形成非对称主次承接，底部浅条稳稳压脚，呼吸缝均匀通透。" },
      { id: "C", svg: "q2-c", desc: "方案 C", feedback: "层次拉平：把竖矩形切成四条等高横带（各约 25%），三条水平横杠反复拦腰截断目光，反而抵消了竖矩形原本的纵向延伸感。" },
      { id: "D", svg: "q2-d", desc: "方案 D", feedback: "主次倒挂：顶部建筑摄影被挤压成只剩 15% 高度的细条，下方两块高饱和纯色块吞噬了近七成画幅，辅助信息反客为主压死了主体画面。" },
    ],
  },
];

export function initSection06() {
  const promptEl = document.getElementById("quiz-prompt");
  const switchEl = document.getElementById("quiz-switch");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  if (!gridEl || !switchEl) return;

  let qIndex = 0;
  let picked = null;

  function render() {
    const q = QUIZ_DATA[qIndex];
    promptEl.textContent = q.prompt;
    gridEl.innerHTML = q.options.map((o) => {
      const cls = picked === o.id ? (o.id === q.correct ? "is-picked-ok" : "is-picked-bad") : "";
      return `
        <button type="button" class="quiz-option ${cls}" data-opt="${o.id}">
          <div class="quiz-opt-head">
            <span>${o.desc}</span>
            <span>${picked === o.id ? (o.id === q.correct ? "✓ 正确" : "× 再看结构") : "点击研判"}</span>
          </div>
          ${makeQuizSvg(o.svg)}
          <span class="quiz-opt-desc">同素材同色系 · 点此检验结构</span>
        </button>
      `;
    }).join("");

    if (!picked) {
      fbEl.className = "quiz-feedback";
      fbEl.innerHTML = `<p>点选上方任意一个方案（A / B / C / D），立即对照单真源构图诊断。</p>`;
    } else {
      const chosen = q.options.find((o) => o.id === picked);
      const isRight = chosen.id === q.correct;
      fbEl.className = `quiz-feedback ${isRight ? "is-ok" : "is-bad"}`;
      fbEl.innerHTML = `<p><strong>${chosen.desc} · ${isRight ? "判断准确" : "未命中最佳解"}</strong></p><p>${chosen.feedback}</p>`;
    }
  }

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-opt]");
    if (!btn) return;
    picked = btn.dataset.opt;
    render();
  });

  switchEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-q]");
    if (!btn) return;
    qIndex = Number(btn.dataset.q);
    picked = null;
    switchEl.querySelectorAll(".qtab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  render();
}

/* ==================== 07：原海报灯箱（放大、拖拽、Esc 关闭） ==================== */
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbZoom = document.getElementById("lb-zoom");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!poster || !openBtn || !lb) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbZoom.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = poster.currentSrc || poster.src;
    scale = 1; tx = 0; ty = 0;
    apply();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = clamp(scale + 0.35, 0.7, 3.5); apply(); });
  btnOut.addEventListener("click", () => { scale = clamp(scale - 0.35, 0.7, 3.5); apply(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.5);
    apply();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    ox = tx; oy = ty;
    lbStage.classList.add("is-dragging");
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    apply();
  });
  lbStage.addEventListener("pointerup", () => {
    dragging = false;
    lbStage.classList.remove("is-dragging");
  });
  lbStage.addEventListener("click", (e) => {
    if (e.target === lbStage) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
