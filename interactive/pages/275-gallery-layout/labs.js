import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { ARTWORKS, artworkSvgMarkup, drawArtwork } from "./artworks.js";
import { clamp } from "./model.js";

// ============================================================
// 01 节：目光跳步对比器（2D Canvas 动画对比三种找图模式）
// 目标任务：在 8 幅馆藏里找到「第 06 幅 · 折角微日」并放大确认细节
// ============================================================
function initGazeLab() {
  const wrap = document.getElementById("lab-gaze");
  const canvas = document.getElementById("gaze-canvas");
  const summaryEl = document.getElementById("gaze-summary");
  const statClicks = document.getElementById("gaze-clicks");
  const statSwitches = document.getElementById("gaze-switches");
  const statHint = document.getElementById("gaze-verdict");
  if (!wrap || !canvas) return;

  const ctx = canvas.getContext("2d");
  const MODES = {
    list: {
      label: "纯列表反复进退",
      clicks: "6 次点击",
      switches: "3 次整页跳转",
      verdict: "进出迷失",
      summary: "点进详情页 → 发现不是要找的图 → 退回列表 → 再点下一张。每次整页刷新都在打断脑中的空间位置记忆。",
    },
    carousel: {
      label: "圆点盲翻轮播",
      clicks: "5 次翻页",
      switches: "0 次跳页 · 5 次盲猜",
      verdict: "线性摸黑",
      summary: "只能按 01 → 02 → 03 → 04 → 05 → 06 挨个往后点。虽然没离开页面，却无法一眼跳到目标，越靠后越烦躁。",
    },
    gallery: {
      label: "画廊主次同屏",
      clicks: "1 次直达",
      switches: "0 次跳页 · 同屏参照",
      verdict: "先扫后定",
      summary: "缩略阵一次摊开全部 8 幅构图，眼睛 1 秒扫到第 06 幅「折角微日」，点一下即在上框放大细看，其余 7 幅仍留在视野里兜底。",
    },
  };

  let mode = "gallery";
  let startedAt = 0;
  let lastT = 0;
  let dirty = true;

  function setMode(next) {
    mode = next;
    startedAt = lastT;
    dirty = true;
    wrap.querySelectorAll("[data-gaze]").forEach((b) => {
      const on = b.dataset.gaze === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const m = MODES[mode];
    if (statClicks) statClicks.textContent = m.clicks;
    if (statSwitches) statSwitches.textContent = m.switches;
    if (statHint) statHint.textContent = m.verdict;
    if (summaryEl) summaryEl.textContent = m.summary;
    ctrl.draw();
  }

  function draw(progress) {
    const dpr = pixelRatio(2);
    const w = Math.max(260, Math.round(canvas.clientWidth || 620));
    const h = Math.round(clamp(w * 0.44, 210, 290));
    if (canvas.style.height !== `${h}px`) canvas.style.height = `${h}px`;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#3F1935";
    ctx.fillRect(0, 0, w, h);

    // 淡背景微网格，保持美术馆技术蓝图感
    ctx.strokeStyle = "rgba(247, 227, 206, 0.08)";
    ctx.lineWidth = 1;
    for (let gx = 28; gx < w; gx += 28) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    const pad = 16;
    const p = clamp(progress, 0, 1);

    if (mode === "list") {
      // 3 个来回翻页窗口示意：列表 → 错页02 → 退回列表 → 错页04 → 退回列表 → 目标06
      const boxW = (w - pad * 4) / 3;
      const boxH = h - 54;
      const labels = ["列表页（缩图）", "误点 03 → 返回", "二次进出 → 终达 06"];
      const pts = [];
      for (let i = 0; i < 3; i++) {
        const bx = pad + i * (boxW + pad);
        const by = 22;
        ctx.fillStyle = i === 2 ? "#4F2242" : "#34142C";
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = i === 2 ? "#92DFB8" : "#A76C79";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

        if (i === 0) {
          const cw = (boxW - 22) / 4;
          const ch = (boxH - 42) / 2;
          for (let k = 0; k < 8; k++) {
            const cx = bx + 8 + (k % 4) * (cw + 2);
            const cy = by + 26 + Math.floor(k / 4) * (ch + 4);
            drawArtwork(ctx, cx, cy, cw, ch, k, "plum", 1);
            if (k === 5) {
              ctx.strokeStyle = "#F69B83";
              ctx.lineWidth = 1.5;
              ctx.strokeRect(cx, cy, cw, ch);
            }
          }
          pts.push([bx + boxW * 0.52, by + boxH * 0.45]);
        } else if (i === 1) {
          drawArtwork(ctx, bx + 14, by + 28, boxW - 28, boxH - 46, 2, "plum", 1);
          pts.push([bx + boxW * 0.5, by + boxH * 0.5]);
          pts.push([pad + boxW * 0.65, by + boxH * 0.65]); // 回跳回列表！
        } else {
          drawArtwork(ctx, bx + 14, by + 28, boxW - 28, boxH - 46, 5, "plum", 1);
          pts.push([bx + boxW * 0.5, by + boxH * 0.55]);
        }
        ctx.fillStyle = "#F7E3CE";
        ctx.font = '600 11px "Noto Sans SC", sans-serif';
        ctx.fillText(labels[i], bx + 8, by + 16);
      }
      drawAnimatedPath(ctx, pts, p, "#F07868", true);
    } else if (mode === "carousel") {
      // 居中单图 + 底部 8 枚盲点，红线被迫逐点摸黑走到第 6 枚
      const fw = Math.min(w * 0.46, 230);
      const fh = h - 78;
      const fx = (w - fw) / 2;
      const fy = 16;
      const stepIdx = Math.min(5, Math.floor(p * 5.99));
      ctx.fillStyle = "#F7E3CE";
      ctx.fillRect(fx - 6, fy - 6, fw + 12, fh + 12);
      drawArtwork(ctx, fx, fy, fw, fh, stepIdx, "plum", 1);

      const dotY = h - 28;
      const gap = Math.min(34, (w - 80) / 8);
      const startX = w / 2 - (7 * gap) / 2;
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const dx = startX + i * gap;
        ctx.beginPath();
        ctx.arc(dx, dotY, i === stepIdx ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = i === 5 ? "#92DFB8" : i <= stepIdx ? "#F07868" : "rgba(247,227,206,0.38)";
        ctx.fill();
        if (i <= 5) pts.push([dx, dotY - 10]);
      }
      drawAnimatedPath(ctx, pts, p, "#F69B83", false);
      ctx.fillStyle = "#F7E3CE";
      ctx.font = '600 11px "Space Grotesk", "Noto Sans SC", sans-serif';
      ctx.fillText(`第 ${stepIdx + 1} 次盲点：0${stepIdx + 1} / 08`, pad, 22);
    } else {
      // 画廊主次同屏：左/上主画 + 下/右 4×2 缩略全览，一步直跳第 06 幅
      const heroW = Math.round(w * 0.44);
      const heroH = h - 38;
      const hx = pad + 8;
      const hy = 18;
      const shownArt = p > 0.52 ? 5 : 0;
      ctx.fillStyle = "#F7E3CE";
      ctx.fillRect(hx - 6, hy - 6, heroW + 12, heroH + 12);
      drawArtwork(ctx, hx, hy, heroW, heroH, shownArt, "plum", 1);

      const gx0 = hx + heroW + 24;
      const gw = w - gx0 - pad;
      const cols = 4;
      const rows = 2;
      const gGap = 6;
      const tw = (gw - gGap * (cols - 1)) / cols;
      const th = Math.min(tw, (heroH - gGap) / rows);
      const gy0 = hy + (heroH - (th * rows + gGap)) / 2;

      let targetCenter = [gx0 + tw * 1.5, gy0 + th * 1.5];
      for (let i = 0; i < 8; i++) {
        const tx = gx0 + (i % cols) * (tw + gGap);
        const ty = gy0 + Math.floor(i / cols) * (th + gGap);
        ctx.fillStyle = i === 5 && p > 0.35 ? "#F69B83" : "#F7E3CE";
        ctx.fillRect(tx - 2, ty - 2, tw + 4, th + 4);
        drawArtwork(ctx, tx, ty, tw, th, i, "plum", 1);
        if (i === 5) targetCenter = [tx + tw / 2, ty + th / 2];
      }

      const pts = [
        [gx0 + gw * 0.15, gy0 + th * 0.45],
        targetCenter,
        [hx + heroW * 0.55, hy + heroH * 0.48],
      ];
      drawAnimatedPath(ctx, pts, p, "#92DFB8", false);
    }

    ctx.restore();
  }

  function drawAnimatedPath(ctx2, pts, p, color, dashed) {
    if (pts.length < 2) return;
    let total = 0;
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(len);
      total += len;
    }
    const targetLen = total * clamp(p, 0.05, 1);

    ctx2.save();
    ctx2.strokeStyle = color;
    ctx2.lineWidth = 2.2;
    if (dashed) ctx2.setLineDash([5, 4]);
    ctx2.beginPath();
    ctx2.moveTo(pts[0][0], pts[0][1]);
    let acc = 0;
    let tip = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const len = segs[i - 1];
      if (acc + len <= targetLen) {
        ctx2.lineTo(pts[i][0], pts[i][1]);
        tip = pts[i];
        acc += len;
      } else {
        const f = len > 0 ? (targetLen - acc) / len : 0;
        tip = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
        ctx2.lineTo(tip[0], tip[1]);
        break;
      }
    }
    ctx2.stroke();
    ctx2.setLineDash([]);

    // 当前视线光点
    ctx2.fillStyle = color;
    ctx2.beginPath();
    ctx2.arc(tip[0], tip[1], 5, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = "#2D1026";
    ctx2.lineWidth = 1.5;
    ctx2.stroke();
    ctx2.restore();
  }

  const ctrl = loop(wrap, (t, _dt, { still }) => {
    lastT = t;
    const dur = 2.1;
    const el = t - startedAt;
    if (!still && el <= dur + 0.1) {
      draw(el / dur);
      dirty = false;
    } else if (dirty || still) {
      draw(1);
      dirty = false;
    }
  });

  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-gaze]");
    if (b) setMode(b.dataset.gaze);
    if (e.target.closest("#gaze-replay")) {
      startedAt = lastT;
      dirty = true;
      ctrl.draw();
    }
  });

  setMode("gallery");
  if (reducedMotion.matches) ctrl.draw();
}

// ============================================================
// 02 节：悄悄截断寻宝小实验（实测 8 图里找「06 尺寸标注」「07 材质微距」）
// ============================================================
function initTruncationLab() {
  const wrap = document.getElementById("lab-trunc");
  const rail = document.getElementById("trunc-rail");
  const heroBox = document.getElementById("trunc-hero");
  const foundText = document.getElementById("trunc-found");
  const noteEl = document.getElementById("trunc-note");
  const scrollNextBtn = document.getElementById("trunc-scroll-next");
  if (!wrap || !rail || !heroBox) return;

  let mode = "cut"; // "cut" | "peek" | "all"
  let active = 0;
  let foundSize = false;
  let foundMat = false;
  let clicks = 0;

  const NOTES = {
    cut: "硬切无提示：边缘刚好对齐第 4 张结束，没有箭头也没有「+4」计数，多数访客会直接以为全套只有 4 张图，压根不会尝试横向滚动。",
    peek: "露半边 + 渐变 +「+4」签：第 5 张被特意露出半张边，配合明确的余量提示与翻页按钮，访客一眼就知道后面还有尺寸和微距图。",
    all: "4×2 全部摊开：总数 ≤ 8 张时，桌面端直接铺满两行零折叠，尺寸图（06）与材质图（07）不需要任何翻找就能一秒看见。",
  };

  function render() {
    wrap.dataset.mode = mode;
    wrap.querySelectorAll("[data-trunc-mode]").forEach((b) => {
      const on = b.dataset.truncMode === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const art = ARTWORKS[active];
    heroBox.innerHTML = `
      <div class="trunc-hero-art">${artworkSvgMarkup(active, "plum")}</div>
      <div class="trunc-hero-meta">
        <span class="trunc-code" lang="en">NO. ${art.code} / 08</span>
        <strong>${art.title} · ${art.tag}</strong>
        <p>${art.caption}</p>
      </div>`;

    rail.dataset.mode = mode;
    rail.innerHTML = ARTWORKS.map((a, i) => {
      const isTarget = i === 5 || i === 6;
      return `
        <button type="button" class="trunc-thumb ${i === active ? "is-active" : ""} ${isTarget ? "is-target" : ""}" data-t-idx="${i}" aria-label="查看第 ${a.code} 张：${a.tag}" aria-pressed="${i === active}">
          <span class="trunc-thumb-svg">${artworkSvgMarkup(i, "plum")}</span>
          <span class="trunc-thumb-tag">${a.code} ${a.tag}</span>
        </button>`;
    }).join("");

    if (scrollNextBtn) scrollNextBtn.hidden = mode !== "peek";

    const got = (foundSize ? 1 : 0) + (foundMat ? 1 : 0);
    if (foundText) {
      foundText.textContent =
        got === 2
          ? `已找齐 2/2 关键图（共点 ${clicks} 次）`
          : `任务：找出「06 尺寸标注」与「07 材质微距」 · 已找到 ${got}/2`;
      foundText.dataset.done = got === 2 ? "yes" : "no";
    }
    if (noteEl) noteEl.textContent = NOTES[mode];
  }

  wrap.addEventListener("click", (e) => {
    const mBtn = e.target.closest("[data-trunc-mode]");
    if (mBtn) {
      mode = mBtn.dataset.truncMode;
      active = 0;
      foundSize = false;
      foundMat = false;
      clicks = 0;
      rail.scrollLeft = 0;
      render();
      return;
    }
    const tBtn = e.target.closest("[data-t-idx]");
    if (tBtn) {
      active = Number(tBtn.dataset.tIdx);
      clicks++;
      if (active === 5) foundSize = true;
      if (active === 6) foundMat = true;
      render();
      return;
    }
    if (e.target.closest("#trunc-scroll-next")) {
      rail.scrollLeft = rail.scrollLeft > 120 ? 0 : 420;
    }
  });

  render();
}

// ============================================================
// 03 节（深梅暗版展厅）：混排画幅装裱台（卡纸滑杆 + 裁切方式）
// ============================================================
function initMattingLab() {
  const wrap = document.getElementById("lab-mat");
  const grid = document.getElementById("mat-grid");
  const range = document.getElementById("mat-range");
  const rangeVal = document.getElementById("mat-range-val");
  const verdict = document.getElementById("mat-verdict");
  if (!wrap || !grid || !range) return;

  // 4 幅故意不同原始画幅比的作品：16:9 宽、3:4 竖、1:1 方、4:3 横
  const SAMPLES = [
    { idx: 4, ratioLabel: "16:9 宽幅", w: 16, h: 9, edgeRisk: "阶梯左右两端易被裁断" },
    { idx: 1, ratioLabel: "3:4 竖幅", w: 3, h: 4, edgeRisk: "拱顶圆弧与底阶易切头" },
    { idx: 0, ratioLabel: "1:1 正方", w: 1, h: 1, edgeRisk: "比例刚好吻合" },
    { idx: 3, ratioLabel: "4:3 横幅", w: 4, h: 3, edgeRisk: "双峰底角易被削去" },
  ];

  let fitMode = "cover"; // "cover" | "raw" | "contain"
  let matPx = 0;

  function render() {
    rangeVal.textContent = `${matPx} px`;
    wrap.querySelectorAll("[data-fit]").forEach((b) => {
      const on = b.dataset.fit === fitMode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    grid.dataset.fit = fitMode;
    grid.innerHTML = SAMPLES.map((s) => {
      const art = ARTWORKS[s.idx];
      const clipped = fitMode === "cover" && s.w !== s.h;
      const jagged = fitMode === "raw";
      const safe = fitMode === "contain" && matPx >= 8;
      const boxStyle =
        fitMode === "raw"
          ? `aspect-ratio:${s.w} / ${s.h}; padding:${matPx}px;`
          : `aspect-ratio:1 / 1; padding:${matPx}px;`;
      const innerStyle =
        fitMode === "contain"
          ? `aspect-ratio:${s.w} / ${s.h}; width:${s.w >= s.h ? "100%" : "auto"}; height:${s.h > s.w ? "100%" : "auto"}; max-width:100%; max-height:100%;`
          : `width:100%; height:100%;`;
      const badge = clipped ? "边缘被裁" : jagged ? "外框参差" : safe ? "完整且齐整" : "缺卡纸留白";
      return `
        <div class="mat-card ${clipped ? "is-warn" : safe ? "is-ok" : ""}">
          <div class="mat-frame" style="${boxStyle}">
            <div class="mat-art" style="${innerStyle}">${artworkSvgMarkup(s.idx, "plum")}</div>
          </div>
          <div class="mat-meta">
            <span>${art.title} · ${s.ratioLabel}</span>
            <span class="mat-pill" data-state="${clipped ? "bad" : safe ? "ok" : "mid"}">${badge}</span>
          </div>
        </div>`;
    }).join("");

    if (verdict) {
      if (fitMode === "cover") {
        verdict.textContent =
          "暴力满裁（object-fit: cover）虽然让外框齐了，但 16:9 宽画的左右与 3:4 竖画的拱顶都被硬切掉了一块；摄影与设计作品集最忌讳替作者私自二次构图。";
      } else if (fitMode === "raw") {
        verdict.textContent =
          "裸放原比例（不统一外框）保住了画面完整性，但一行 4 张底边高高低低参差不齐，墙面秩序散了，只适合轻松的瀑布流而不是端庄画廊。";
      } else if (matPx < 8) {
        verdict.textContent =
          "已保住 4 幅作品的原始画幅不裁边，但卡纸留白还是 " + matPx + "px，外框过于紧绷；把上方滑杆推到 8–18px，立刻能看到美术馆装裱气口。";
      } else {
        verdict.textContent =
          `外框统一 1:1、内画按原比例完整置中（contain），再配 ${matPx}px 暖米卡纸留白：既像 275 原海报一样外框齐整，又尊重每一幅作品原本的画幅比例。`;
      }
    }
  }

  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fit]");
    if (b) {
      fitMode = b.dataset.fit;
      if (fitMode === "contain" && matPx === 0) {
        matPx = 12;
        range.value = "12";
      }
      render();
    }
  });
  range.addEventListener("input", () => {
    matPx = Number(range.value);
    render();
  });

  render();
}

// ============================================================
// 04 节：多端视口变形矩阵（3 设备 × 3 缩略位真实面积核算）
// ============================================================
function initResponsiveLab() {
  const wrap = document.getElementById("lab-resp");
  const frame = document.getElementById("resp-frame");
  const statHero = document.getElementById("resp-hero-pct");
  const statTap = document.getElementById("resp-tap-px");
  const note = document.getElementById("resp-note");
  if (!wrap || !frame) return;

  const DEVICES = {
    desktop: { label: "桌面 1440", w: 680, h: 420 },
    tablet: { label: "平板 768", w: 460, h: 440 },
    phone: { label: "手机 390", w: 340, h: 520 },
  };

  let dev = "desktop";
  let pos = "left"; // "bottom-grid" | "left" | "strip"

  function render() {
    wrap.querySelectorAll("[data-dev]").forEach((b) => {
      const on = b.dataset.dev === dev;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    wrap.querySelectorAll("[data-pos]").forEach((b) => {
      const on = b.dataset.pos === pos;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const d = DEVICES[dev];
    // 真实按屏幕像素核算主图占比与缩略图点击尺寸
    let heroPct = 62;
    let tapPx = 64;
    let verdict = "";
    let stateFlag = "ok";

    if (pos === "bottom-grid") {
      if (dev === "desktop") {
        heroPct = 66;
        tapPx = 74;
        verdict = "桌面宽屏 + 底部 4×2 网格（275 原海报同构）：8 张缩略一眼全览，每枚 74px 清晰舒适，适合 6–12 张展品的作品集与图录。";
      } else if (dev === "tablet") {
        heroPct = 60;
        tapPx = 62;
        verdict = "平板竖屏 + 底部 4×2：上下空间充裕，主图与 8 张缩略稳稳同屏，手指点选轻松。";
      } else {
        heroPct = 52;
        tapPx = 56;
        verdict = "手机竖屏 + 底部 4×2：能看全 8 张，但两行缩略吃掉将近一半首屏高度；若下方还有购买按钮，建议切「底部胶片带」省出高度。";
        stateFlag = "mid";
      }
    } else if (pos === "left") {
      if (dev === "desktop") {
        heroPct = 78;
        tapPx = 66;
        verdict = "桌面宽屏 + 左侧竖轨：把宽屏富余的横向空间分给缩略栏，主图首屏占比冲到 78%，是电商详情页最省竖向高度的成熟阵型。";
      } else if (dev === "tablet") {
        heroPct = 72;
        tapPx = 54;
        verdict = "平板 + 左侧竖轨：表现仍稳妥，但 8 张全排会超出主图高度，需标出向下滚动余量提示。";
      } else {
        heroPct = 74;
        tapPx = 30;
        verdict = "手机 390px 硬塞左侧竖轨会出事故：留给左轨的宽度被挤到 30px（低于 40px 拇指点击下限），既点不准又把主图挤成窄条！手机端务必改到底部。";
        stateFlag = "bad";
      }
    } else {
      if (dev === "desktop") {
        heroPct = 74;
        tapPx = 68;
        verdict = "桌面 + 底部单行胶片带：图片超过 12 张时比 4×2 更克制，只要右端露半张图并标清「+N」余量，浏览效率极高。";
      } else if (dev === "tablet") {
        heroPct = 72;
        tapPx = 62;
        verdict = "平板 + 底部单行胶片带：主图大方舒展，底带单指横滑自然顺手。";
      } else {
        heroPct = 72;
        tapPx = 54;
        verdict = "手机竖屏 + 底部单行胶片带（带余量提示）：最契合窄屏的画廊排法——主图稳占 72%，单行缩略 54px 拇指好点，还不挤占正文首屏。";
      }
    }

    frame.dataset.dev = dev;
    frame.dataset.pos = pos;
    frame.dataset.state = stateFlag;
    frame.innerHTML = `
      <div class="resp-shell">
        <div class="resp-hero-box">
          ${artworkSvgMarkup(0, "plum")}
          <span class="resp-tag">主视觉 ${heroPct}%</span>
        </div>
        <div class="resp-thumbs">
          ${[0, 1, 2, 3, 4, 5, 6, 7]
            .slice(0, pos === "strip" ? 5 : 8)
            .map(
              (k) => `<span class="resp-t ${k === 0 ? "is-sel" : ""}">${artworkSvgMarkup(k, "plum")}</span>`
            )
            .join("")}
          ${pos === "strip" ? `<span class="resp-more">+3</span>` : ""}
        </div>
      </div>`;

    if (statHero) statHero.textContent = `${heroPct}%`;
    if (statTap) {
      statTap.textContent = `${tapPx} px ${tapPx < 40 ? "（过小警告）" : "（好点）"}`;
      statTap.dataset.state = tapPx < 40 ? "bad" : "ok";
    }
    if (note) note.textContent = verdict;
  }

  wrap.addEventListener("click", (e) => {
    const db = e.target.closest("[data-dev]");
    if (db) {
      dev = db.dataset.dev;
      render();
      return;
    }
    const pb = e.target.closest("[data-pos]");
    if (pb) {
      pos = pb.dataset.pos;
      render();
    }
  });

  render();
}

// ============================================================
// 05 节：百年策展演进图谱（4 时期可切换微缩展墙示意）
// ============================================================
function initHistoryLab() {
  const wrap = document.getElementById("lab-history");
  const svgBox = document.getElementById("hist-svg");
  const titleEl = document.getElementById("hist-title");
  const bodyEl = document.getElementById("hist-body");
  const srcEl = document.getElementById("hist-src");
  if (!wrap || !svgBox) return;

  const ERAS = {
    moma1929: {
      title: "1929 · 从巴黎沙龙堆墙到 MoMA 眼平单行挂画",
      body: "19 世纪沙龙展把画框从地板叠到天花板，观众很难专心凝视单幅作品。1929 年纽约现代艺术博物馆（MoMA）首任馆长 Alfred H. Barr Jr. 在开馆首展（Cézanne, Gauguin, Seurat, van Gogh）起推广中性墙面、宽画距与眼平单行挂画，奠定了「用留白隔离出专注空间」的现代画廊观展语法。1976 年 Brian O'Doherty 在 Artforum 连载《白盒子之内》（Inside the White Cube），更进一步指出墙面与氛围本身就是观展体验的一部分。",
      source: "核实来源：MoMA 1929 首展档案 · Brian O'Doherty《Inside the White Cube》（1976 / 1999 加州大学出版社）",
      svg: `
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <rect width="360" height="150" fill="#3F1935"/>
          <line x1="180" y1="14" x2="180" y2="136" stroke="#A76C79" stroke-dasharray="4 4"/>
          <text x="16" y="24" fill="#F1B6A8" font-size="11" font-family="Noto Sans SC, sans-serif">19 世纪沙龙密堆</text>
          <g fill="#F7E3CE" fill-opacity="0.82">
            <rect x="16" y="34" width="38" height="28"/><rect x="58" y="34" width="46" height="34"/><rect x="108" y="34" width="54" height="24"/>
            <rect x="16" y="66" width="38" height="36"/><rect x="58" y="72" width="46" height="30"/><rect x="108" y="62" width="54" height="40"/>
            <rect x="16" y="106" width="54" height="26"/><rect x="74" y="106" width="40" height="26"/><rect x="118" y="106" width="44" height="26"/>
          </g>
          <text x="196" y="24" fill="#F69B83" font-size="11" font-family="Noto Sans SC, sans-serif">1929 MoMA 眼平单行</text>
          <line x1="196" y1="84" x2="344" y2="84" stroke="#F07868" stroke-width="1" stroke-dasharray="3 3"/>
          <rect x="204" y="56" width="42" height="54" fill="#F7E3CE"/><rect x="210" y="62" width="30" height="42" fill="#EE6D5F"/>
          <rect x="294" y="56" width="42" height="54" fill="#F7E3CE"/><rect x="300" y="62" width="30" height="42" fill="#F1B6A8"/>
        </svg>`,
    },
    contact: {
      title: "暗房原型 · 35mm 接触印样（Contact Sheet）与看片灯箱",
      body: "胶片时代，摄影师会把整卷 35mm 底片直接贴压在相纸上晒出一张 1:1 缩略图阵——接触印样（Contact Sheet），放在背光灯箱（Light Table）上一次扫完几十格快门，再用红蜡笔圈出决定性瞬间单独放大精印。今天界面里「缩略阵选片 + 主框放大」的双层分工，直接继承了这条暗房工作流。",
      source: "传统暗房接触印样与玛格南图片社编辑传统（Contact Sheet / Light Table）",
      svg: `
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <rect width="360" height="150" fill="#2D1026"/>
          <rect x="18" y="20" width="174" height="110" fill="#1C0918" stroke="#A76C79"/>
          ${Array.from({ length: 12 }, (_, i) => {
            const x = 28 + (i % 4) * 40;
            const y = 30 + Math.floor(i / 4) * 32;
            const sel = i === 5;
            return `<rect x="${x}" y="${y}" width="32" height="24" fill="${sel ? "#F7E3CE" : "#5F2D51"}" stroke="${sel ? "#F07868" : "#7A4566"}" stroke-width="${sel ? 2 : 1}"/>`;
          }).join("")}
          <circle cx="84" cy="74" r="17" fill="none" stroke="#F07868" stroke-width="2.2"/>
          <path d="M198 75 L230 75" stroke="#F69B83" stroke-width="1.6"/>
          <polygon points="228,70 237,75 228,80" fill="#F69B83"/>
          <rect x="244" y="24" width="98" height="102" fill="#F7E3CE"/>
          <rect x="256" y="36" width="74" height="78" fill="#EE6D5F"/>
          <circle cx="305" cy="58" r="12" fill="#3F1935"/>
        </svg>`,
    },
    mantra1996: {
      title: "1996 · Ben Shneiderman 提出信息可视化总诀",
      body: "1996 年 9 月，马里兰大学人机交互实验室的 Ben Shneiderman 在 IEEE 视觉语言研讨会论文《The Eyes Have It》中写下著名总诀：「Overview first, zoom and filter, then details-on-demand（先总览，再缩放过滤，按需看细节）」。画廊布局正是这句总诀在图像产品里的最简形态：缩略阵给总览，点选给按需细节。",
      source: "核实来源：Ben Shneiderman (1996), IEEE Symposium on Visual Languages, pp. 336–343, DOI: 10.1109/VL.1996.545307",
      svg: `
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <rect width="360" height="150" fill="#3F1935"/>
          <rect x="18" y="34" width="92" height="82" fill="#4C2040" stroke="#F7E3CE" stroke-opacity="0.4"/>
          <text x="64" y="24" text-anchor="middle" fill="#F7E3CE" font-size="11" font-family="Noto Sans SC, sans-serif">1. 先总览 Overview</text>
          <g fill="#F1B6A8">${Array.from({ length: 6 }, (_, i) => `<rect x="${28 + (i % 3) * 26}" y="${48 + Math.floor(i / 3) * 30}" width="20" height="22"/>`).join("")}</g>
          <path d="M114 75 L132 75" stroke="#F07868" stroke-width="1.6"/>
          <rect x="136" y="34" width="92" height="82" fill="#4C2040" stroke="#F07868"/>
          <text x="182" y="24" text-anchor="middle" fill="#F69B83" font-size="11" font-family="Noto Sans SC, sans-serif">2. 筛选定焦 Select</text>
          <rect x="158" y="54" width="48" height="44" fill="#F7E3CE" stroke="#F07868" stroke-width="2.2"/>
          <path d="M232 75 L250 75" stroke="#F07868" stroke-width="1.6"/>
          <rect x="254" y="34" width="88" height="82" fill="#F7E3CE"/>
          <text x="298" y="24" text-anchor="middle" fill="#92DFB8" font-size="11" font-family="Noto Sans SC, sans-serif">3. 按需细看 Detail</text>
          <rect x="264" y="44" width="68" height="62" fill="#491D39"/>
          <circle cx="308" cy="64" r="12" fill="#EE6D5F"/>
        </svg>`,
    },
    web2005: {
      title: "2005 ·《Designing Interfaces》归档模式与 Lightbox JS 诞生",
      body: "2005 年 11 月，Jenifer Tidwell 在 O'Reilly 出版《Designing Interfaces》，将「缩略网格（Thumbnail Grid）」与「双栏选择器 / 总览加细节」正式写入界面模式词典；紧接着 12 月，开发者 Lokesh Dhakar 发布 Lightbox JS，点击缩略图不再跳新标签页，而是直接压暗网页浮出居中大图，把暗房灯箱搬进了现代浏览器。",
      source: "核实来源：Jenifer Tidwell (2005) O'Reilly · Lokesh Dhakar Lightbox JS (Dec 2005)",
      svg: `
        <svg viewBox="0 0 360 150" aria-hidden="true">
          <rect width="360" height="150" fill="#2D1026"/>
          <g opacity="0.28">
            <rect x="18" y="18" width="324" height="114" fill="#4C2040"/>
            <rect x="30" y="30" width="60" height="40" fill="#F7E3CE"/>
            <rect x="98" y="30" width="60" height="40" fill="#F7E3CE"/>
            <rect x="30" y="78" width="60" height="40" fill="#F7E3CE"/>
            <rect x="98" y="78" width="60" height="40" fill="#F7E3CE"/>
          </g>
          <rect x="104" y="18" width="152" height="114" fill="#F7E3CE" stroke="#F69B83" stroke-width="2"/>
          <rect x="116" y="28" width="128" height="80" fill="#EE6D5F"/>
          <polygon points="116,78 196,108 116,108" fill="#491D39"/>
          <circle cx="212" cy="52" r="14" fill="#F7E3CE"/>
          <text x="180" y="124" text-anchor="middle" fill="#35142C" font-size="10" font-family="Space Grotesk, sans-serif">LIGHTBOX OVERLAY · ESC</text>
        </svg>`,
    },
  };

  function setEra(id) {
    const e = ERAS[id];
    if (!e) return;
    wrap.querySelectorAll("[data-era]").forEach((b) => {
      const on = b.dataset.era === id;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    svgBox.innerHTML = e.svg;
    if (titleEl) titleEl.textContent = e.title;
    if (bodyEl) bodyEl.textContent = e.body;
    if (srcEl) srcEl.textContent = e.source;
  }

  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-era]");
    if (b) setEra(b.dataset.era);
  });

  setEra("moma1929");
}

// ============================================================
// 06 节：三问选型判别器（给出画廊布局或精准分流到同小类页面）
// ============================================================
function initDecisionLab() {
  const wrap = document.getElementById("lab-decide");
  const outTitle = document.getElementById("decide-title");
  const outBody = document.getElementById("decide-body");
  const outLinks = document.getElementById("decide-links");
  if (!wrap || !outTitle) return;

  const ans = { visual: true, jump: true, focus: true };

  function render() {
    for (const k of Object.keys(ans)) {
      wrap.querySelectorAll(`[data-q="${k}"]`).forEach((b) => {
        const on = (b.dataset.v === "yes") === ans[k];
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
    }

    let title = "";
    let body = "";
    let links = "";

    if (!ans.visual) {
      title = "别用画廊布局：文字与数据比较会被大图拖慢";
      body = "画廊要为单张主图让出 55%–70% 首屏空间。如果核心任务是核对参数、读写指标或浏览长文条目，大图反而遮挡信息密度。";
      links = `推荐改看：<a href="https://layout.xiaoxiaodong.ai/274/play/" target="_blank" rel="noopener">274 数据表格布局</a> · <a href="https://layout.xiaoxiaodong.ai/273/play/" target="_blank" rel="noopener">273 仪表盘布局</a> · <a href="https://layout.xiaoxiaodong.ai/288/play/" target="_blank" rel="noopener">288 媒体对象布局</a>`;
    } else if (!ans.focus) {
      title = "更适合平权浏览：让所有条目同等大小展开";
      body = "当你有几十件商品或大量灵感图要并列扫货、每张图地位平等时，不需要强行抬出一张巨幅主视觉占用半个屏幕。";
      links = `推荐改看：<a href="https://layout.xiaoxiaodong.ai/270/play/" target="_blank" rel="noopener">270 卡片网格布局</a> · <a href="https://layout.xiaoxiaodong.ai/271/play/" target="_blank" rel="noopener">271 瀑布流页面</a>`;
    } else if (!ans.jump) {
      title = "按剧本顺序走，或首屏只需单幅视觉宣言";
      body = "如果画面只要求按 1→2→3 依次播放而无需随机跳选，用轮播更轻；如果整屏只需要一张主视觉配行动按钮，直接用 Hero 主视觉。";
      links = `推荐改看：<a href="https://layout.xiaoxiaodong.ai/276/play/" target="_blank" rel="noopener">276 轮播布局</a> · <a href="https://layout.xiaoxiaodong.ai/289/play/" target="_blank" rel="noopener">289 Hero 主视觉布局</a>`;
    } else {
      title = "正中画廊布局（No. 275）的主场";
      body = "看图做决策 + 需要自由挑张细看 + 首屏要有压阵主视觉：电商多角度详情、摄影/设计作品集、空间巡览和馆藏展陈，用「大主图 + 缩略阵 + 统一氛围」效果最稳。";
      links = `同小类延伸：需要按功能分仓概览可看 <a href="https://layout.xiaoxiaodong.ai/272/play/" target="_blank" rel="noopener">272 便当盒布局</a>`;
    }

    outTitle.textContent = title;
    if (outBody) outBody.textContent = body;
    if (outLinks) outLinks.innerHTML = links;
  }

  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    ans[b.dataset.q] = b.dataset.v === "yes";
    render();
  });

  render();
}

// ============================================================
// 07 节：小练习（4 选 1 单变量展墙诊断题，中性标签 A/B/C/D）
// ============================================================
function initQuiz() {
  const wrap = document.getElementById("lab-quiz");
  const fb = document.getElementById("quiz-feedback");
  if (!wrap || !fb) return;

  const REASONS = {
    A: {
      ok: false,
      title: "方案 A 不够稳妥：主图太矮，退化成了平权卡片网",
      body: "虽然 8 张图都露出来了，但主图高度只占 24%，和下方单张缩略图面积比接近 1.3×。访客进页面后眼睛在 9 个差不多大的方框里来回打转，没有清晰的聚焦主角。",
    },
    B: {
      ok: true,
      title: "选对了：方案 B 同时守住了聚焦、全览与清晰联动",
      body: "主图占 64% 高度（约为单枚缩略图 7.4 倍面积），压得住阵；下方 4×2 完整摊开全部 8 张实拍图，没有任何隐蔽截断，第 03 张珊瑚焦框一眼标明当前正在细看的视角。",
    },
    C: {
      ok: false,
      title: "方案 C 暗藏隐患：悄悄截断了后 4 张图",
      body: "主图体量本身没错，但下方只齐平露出了 4 张较大缩略图，右端既没有露半边也没有「+4」提示。Baymard 研究反复看到：访客会直觉以为全套只有 4 张图，直接错过后面的尺寸标注图。",
    },
    D: {
      ok: false,
      title: "方案 D 矫枉过正：主图吞噬了缩略预览区",
      body: "主图冲到 88% 高度后，8 张缩略图被挤成一条极矮的细片。既看不出每张缩略图拍的是什么角度，在触屏上也远远低于 40px 点击舒适区，预览功能名存实亡。",
    },
  };

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-choice]");
    if (!btn) return;
    const ch = btn.dataset.choice;
    const r = REASONS[ch];
    if (!r) return;

    wrap.querySelectorAll("[data-choice]").forEach((b) => {
      const k = b.dataset.choice;
      b.classList.toggle("is-picked", k === ch);
      b.classList.toggle("is-right", k === "B" && (ch === "B" || k === ch));
      b.classList.toggle("is-wrong", k === ch && !r.ok);
      b.setAttribute("aria-pressed", String(k === ch));
    });

    fb.hidden = false;
    fb.dataset.ok = r.ok ? "yes" : "no";
    fb.innerHTML = `<strong>${r.title}</strong><p>${r.body}</p>`;
  });
}

// ============================================================
// 08 节：原海报放大、缩放、拖拽与 Esc 关闭灯箱
// 复用 #poster 的 src，绝不二次内联图片；大图加 draggable="false"
// ============================================================
function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("poster-lightbox");
  const stage = document.getElementById("plb-stage");
  const lbImg = document.getElementById("plb-img");
  const zoomIn = document.getElementById("plb-in");
  const zoomOut = document.getElementById("plb-out");
  const zoomReset = document.getElementById("plb-reset");
  const closeBtn = document.getElementById("plb-close");
  const zoomRead = document.getElementById("plb-zoom");
  if (!trigger || !posterImg || !lb || !lbImg || !stage) return;

  let z = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${z})`;
    if (zoomRead) zoomRead.textContent = `${Math.round(z * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
    z = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  zoomIn?.addEventListener("click", () => {
    z = clamp(z + 0.35, 1, 3.2);
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    z = clamp(z - 0.35, 1, 3.2);
    if (z <= 1.02) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => {
    z = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage) {
      close();
      return;
    }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.classList.add("is-panning");
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = clamp(e.clientX - sx, -640, 640);
    ty = clamp(e.clientY - sy, -640, 640);
    applyTransform();
  });
  const endPan = () => {
    panning = false;
    stage.classList.remove("is-panning");
  };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      z = clamp(z + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
      if (z <= 1.02) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "+" || e.key === "=") {
      z = clamp(z + 0.3, 1, 3.2);
      applyTransform();
    } else if (e.key === "-") {
      z = clamp(z - 0.3, 1, 3.2);
      applyTransform();
    }
  });
}

export function initLabs() {
  initGazeLab();
  initTruncationLab();
  initMattingLab();
  initResponsiveLab();
  initHistoryLab();
  initDecisionLab();
  initQuiz();
  initPosterLightbox();
}
