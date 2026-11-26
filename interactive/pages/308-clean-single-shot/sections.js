// 308 净单人镜头 · 正文 01–07 节专属交互模块（相邻节绝不复用同一种控件）

import { loop, pixelRatio } from "../../lib/stage.js";
import { QUIZ_OPTIONS, evaluate, clamp, contrastRatio } from "./model.js";
import { renderViewfinder } from "./viewfinder.js";
import { drawSilhouette, onSilhouetteReady } from "./silhouette.js";

function sizeCanvas(canvas, cssW, cssH) {
  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: cssW, h: cssH };
}

// =========================================================================
// 01 节：图底明度分离对比镜（鲁宾 1915 轮廓归属感实测）
// =========================================================================
export function initSection01() {
  const canvas = document.getElementById("s01-canvas");
  const subSlider = document.getElementById("s01-sub-lum");
  const bgSlider = document.getElementById("s01-bg-lum");
  const subVal = document.getElementById("s01-sub-val");
  const bgVal = document.getElementById("s01-bg-val");
  const ratioOut = document.getElementById("s01-ratio");
  const verdictOut = document.getElementById("s01-verdict");
  const presetBtns = [...document.querySelectorAll("[data-s01-preset]")];
  if (!canvas) return;

  const PRESETS = {
    moon: { sub: 4, bg: 91, striped: false, note: "原海报极性：极深侧影配淡奶黄亮圆月，明度比拉开后轮廓瞬间锁死为前景图形。" },
    stage: { sub: 86, bg: 8, striped: false, note: "反向高对比：主光打亮人物、后墙做负补光压暗，照样形成干净利落的图底分离。" },
    muddy: { sub: 34, bg: 46, striped: false, note: "灰人撞灰墙：主体与背景落进相近中灰阶，对比度坍塌，肉眼必须费力寻找人物边缘。" },
    striped: { sub: 10, bg: 82, striped: true, note: "高反差条纹墙：即便局部很亮，背景强几何线条仍会把轮廓切碎，破坏鲁宾封闭边归属。" },
  };

  const st = { sub: 4, bg: 91, striped: false, preset: "moon" };

  function draw() {
    const r = canvas.getBoundingClientRect();
    const cssW = Math.max(240, Math.round(r.width || 460));
    const cssH = Math.max(190, Math.round(r.height || 270));
    const { ctx, w, h } = sizeCanvas(canvas, cssW, cssH);

    // 将 0..100 明度映射为暖杏-深酒黑连续色阶
    const toneColor = (pct) => {
      const t = clamp(pct / 100, 0, 1);
      const R = Math.round(14 + t * 238);
      const G = Math.round(10 + t * 222);
      const B = Math.round(11 + t * 198);
      return { rgb: `rgb(${R},${G},${B})`, lum: 0.2126 * Math.pow(R / 255, 2.2) + 0.7152 * Math.pow(G / 255, 2.2) + 0.0722 * Math.pow(B / 255, 2.2) };
    };

    const bgT = toneColor(st.bg);
    const subT = toneColor(st.sub);

    ctx.fillStyle = bgT.rgb;
    ctx.fillRect(0, 0, w, h);

    if (st.striped) {
      ctx.fillStyle = "rgba(38, 14, 18, 0.72)";
      const cols = 10;
      const bw = w / (cols * 2);
      for (let i = 0; i < cols; i++) {
        ctx.fillRect(i * bw * 2 + bw * 0.4, 0, bw * 0.95, h);
      }
    } else if (st.bg > 72 && st.sub < 22) {
      // 柔和原海报圆月衬托
      ctx.fillStyle = "#FCBCA6";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = bgT.rgb;
      ctx.beginPath();
      ctx.arc(w * 0.56, h * 0.48, Math.min(w, h) * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制纯净侧影（随主体明度变色，严格零五官）
    const boxH = h * 0.88;
    const boxW = boxH * 0.80;
    drawSilhouette(ctx, "theater", { x: w * 0.56 - boxW * 0.5, y: h - boxH + 6, w: boxW, h: boxH }, subT.rgb);

    // 标出面部轮廓对比采样标尺
    const ratio = st.striped ? 2.1 : +contrastRatio(bgT.lum, subT.lum).toFixed(1);
    const ok = !st.striped && ratio >= 6.0;

    ctx.save();
    ctx.strokeStyle = ok ? "#124B3A" : "#9C1520";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * 0.42);
    ctx.lineTo(w * 0.41, h * 0.42);
    ctx.stroke();
    ctx.fillStyle = ok ? "#124B3A" : "#9C1520";
    ctx.beginPath();
    ctx.arc(w * 0.41, h * 0.42, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (subVal) subVal.textContent = `${st.sub}%`;
    if (bgVal) bgVal.textContent = `${st.bg}%`;
    if (ratioOut) {
      ratioOut.textContent = st.striped ? "轮廓被条纹切碎" : `轮廓明度比 ${ratio}:1`;
      ratioOut.dataset.state = ok ? "ok" : "warn";
    }
    if (verdictOut) {
      if (st.striped) {
        verdictOut.textContent = PRESETS.striped.note;
      } else if (ratio >= 6.0) {
        verdictOut.textContent = `对比度 ${ratio}:1 清晰越过分离阈（经验值 ≥ 6:1），人眼在瞬间把闭合轮廓归为唯一主体，背景安静退居幕后。`;
      } else if (ratio >= 3.2) {
        verdictOut.textContent = `对比度 ${ratio}:1 偏平，人物侧脸边缘发软，观众需要多花半拍才能从墙面里「抠」出主体。`;
      } else {
        verdictOut.textContent = `对比度仅 ${ratio}:1，主体与墙面融成一片灰调（图底失效），哪怕背景没有杂物也看不清剪影姿态。`;
      }
    }
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.s01Preset;
      const p = PRESETS[key];
      if (!p) return;
      st.sub = p.sub;
      st.bg = p.bg;
      st.striped = p.striped;
      st.preset = key;
      if (subSlider) subSlider.value = String(p.sub);
      if (bgSlider) bgSlider.value = String(p.bg);
      presetBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      draw();
    });
  });

  const onSlide = () => {
    st.sub = Number(subSlider.value);
    st.bg = Number(bgSlider.value);
    st.striped = false;
    presetBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
    draw();
  };
  subSlider?.addEventListener("input", onSlide);
  bgSlider?.addEventListener("input", onSlide);
  window.addEventListener("resize", draw);
  draw();
}

// =========================================================================
// 02 节：影史五帧画幅检视条（1915–2024）
// =========================================================================
export function initSection02() {
  const canvas = document.getElementById("s02-canvas");
  const btns = [...document.querySelectorAll("[data-era]")];
  const titleEl = document.getElementById("s02-era-title");
  const metaEl = document.getElementById("s02-era-meta");
  const descEl = document.getElementById("s02-era-desc");
  if (!canvas || !btns.length) return;

  const ERAS = {
    "1915": {
      year: "1915",
      aspect: 1.33,
      ratioLabel: "图底感知实验 · 轮廓归属",
      title: "埃德加·鲁宾《视觉图形》揭示轮廓归属权",
      desc: "丹麦心理学家 Edgar Rubin 在 1915 年博士论文《Synsoplevede Figurer》中指出：同一条共享边界只能同时归属「图形」或「背景」其一。当背景干净且与人物拉开明暗反差时，边界唯一归属人物，大脑零犹豫锁定主体。",
      mode: "rubin",
    },
    "1924": {
      year: "1924",
      aspect: 1.33,
      ratioLabel: "1.33:1 默片画幅 · 理论奠基",
      title: "贝拉·巴拉兹提出「微面相学」与单人特写",
      desc: "匈牙利电影理论家 Béla Balázs 在 1924 年《可见的人》（Der sichtbare Mensch，后汇入 1952 年《电影美学》）中论证：特写与独立单人镜头剥离周遭杂讯，让面部与姿态本身成为无需台词的视觉语言。",
      mode: "balazs",
    },
    "1928": {
      year: "1928",
      aspect: 1.33,
      ratioLabel: "1.33:1 素白灰泥墙 · 极端隔离",
      title: "德莱叶《圣女贞德蒙难记》的素墙净单人",
      desc: "Carl Theodor Dreyer 与摄影师 Rudolph Maté 放弃繁复布景，让 Renée Falconetti 反复独自立于几乎空白的浅白灰泥墙前。彻底净化的背景把审讯压迫与孤独感推向极致。",
      mode: "dreyer",
    },
    "1966": {
      year: "1966",
      aspect: 1.37,
      ratioLabel: "1.37:1 学院比 · 高反差黑白",
      title: "伯格曼与尼奎斯特《假面》的强反差单人",
      desc: "Ingmar Bergman 与摄影指导 Sven Nykvist 在 1966 年《Persona》中用极简柔光与锐利黑白反差，把角色孤立于纯净墙面与暗影之间，让沉默与呼吸占据整个银幕。",
      mode: "bergman",
    },
    "2001": {
      year: "2001–2024",
      aspect: 2.39,
      ratioLabel: "2.39:1 宽银幕 · 现代教材术语化",
      title: "现代摄影教材确立「净单人 vs 脏单人」覆盖语法",
      desc: "Bruce Block《The Visual Story》（2001）梳理明暗与图底分离，Gustavo Mercado《The Filmmaker's Eye》（2011）与 Roy Thompson / Christopher J. Bowen《Grammar of the Shot》（1998–2024）明确区分 Clean Single 与 Dirty Single，使「何时净、何时脏」成为片场标准调度词。",
      mode: "modern",
    },
  };

  let active = "1928";

  function draw() {
    const r = canvas.getBoundingClientRect();
    const cssW = Math.max(240, Math.round(r.width || 560));
    const cssH = Math.max(180, Math.round(r.height || 260));
    const { ctx, w, h } = sizeCanvas(canvas, cssW, cssH);
    const era = ERAS[active];

    ctx.fillStyle = "#170C0E";
    ctx.fillRect(0, 0, w, h);

    // 按该年代真实银幕比例画内框
    const maxW = w - 44;
    const maxH = h - 46;
    let fw = maxW;
    let fh = fw / era.aspect;
    if (fh > maxH) {
      fh = maxH;
      fw = fh * era.aspect;
    }
    const fx = (w - fw) * 0.5;
    const fy = (h - fh) * 0.5 - 4;

    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();

    if (era.mode === "rubin") {
      // 暖奶亮底 + 左右相望双轮廓（致敬鲁宾轮廓归属，无五官）
      ctx.fillStyle = "#FCE7D0";
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = "#170C0E";
      // 左侧向内轮廓
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + fw * 0.42, fy);
      ctx.bezierCurveTo(fx + fw * 0.42, fy + fh * 0.25, fx + fw * 0.34, fy + fh * 0.34, fx + fw * 0.44, fy + fh * 0.46);
      ctx.bezierCurveTo(fx + fw * 0.36, fy + fh * 0.52, fx + fw * 0.36, fy + fh * 0.62, fx + fw * 0.42, fy + fh * 0.68);
      ctx.bezierCurveTo(fx + fw * 0.33, fy + fh * 0.78, fx + fw * 0.34, fy + fh * 0.90, fx + fw * 0.40, fy + fh);
      ctx.lineTo(fx, fy + fh);
      ctx.closePath();
      ctx.fill();
      // 右侧对称形成中央花瓶负形
      ctx.beginPath();
      ctx.moveTo(fx + fw, fy);
      ctx.lineTo(fx + fw * 0.58, fy);
      ctx.bezierCurveTo(fx + fw * 0.58, fy + fh * 0.25, fx + fw * 0.66, fy + fh * 0.34, fx + fw * 0.56, fy + fh * 0.46);
      ctx.bezierCurveTo(fx + fw * 0.64, fy + fh * 0.52, fx + fw * 0.64, fy + fh * 0.62, fx + fw * 0.58, fy + fh * 0.68);
      ctx.bezierCurveTo(fx + fw * 0.67, fy + fh * 0.78, fx + fw * 0.66, fy + fh * 0.90, fx + fw * 0.60, fy + fh);
      ctx.lineTo(fx + fw, fy + fh);
      ctx.closePath();
      ctx.fill();
    } else if (era.mode === "balazs") {
      // 默片柔暖鸢尾光圈单人特写
      ctx.fillStyle = "#211417";
      ctx.fillRect(fx, fy, fw, fh);
      const gr = ctx.createRadialGradient(fx + fw * 0.52, fy + fh * 0.48, fh * 0.08, fx + fw * 0.52, fy + fh * 0.48, fh * 0.58);
      gr.addColorStop(0, "#FCE7D0");
      gr.addColorStop(0.7, "#D6A894");
      gr.addColorStop(1, "#211417");
      ctx.fillStyle = gr;
      ctx.fillRect(fx, fy, fw, fh);
      const bh = fh * 0.96, bw = bh * 0.80;
      drawSilhouette(ctx, "theater", { x: fx + fw * 0.54 - bw * 0.5, y: fy + fh - bh + 8, w: bw, h: bh }, "#0B0708");
    } else if (era.mode === "dreyer") {
      // 素白灰泥斜拱墙 × 极低机位孤立单人
      ctx.fillStyle = "#EFE6DB";
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = "#DDD0C0";
      ctx.fillRect(fx, fy + fh * 0.78, fw, fh * 0.22);
      const bh = fh * 0.84, bw = bh * 0.80;
      drawSilhouette(ctx, "window", { x: fx + fw * 0.58 - bw * 0.5, y: fy + fh - bh + 10, w: bw, h: bh }, "#141112");
    } else if (era.mode === "bergman") {
      // 《假面》高反差黑白分界
      ctx.fillStyle = "#0F0C0D";
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = "#F7EFE6";
      ctx.fillRect(fx, fy, fw * 0.52, fh);
      const bh = fh * 0.92, bw = bh * 0.80;
      drawSilhouette(ctx, "theater", { x: fx + fw * 0.50 - bw * 0.5, y: fy + fh - bh + 6, w: bw, h: bh }, "#121011");
    } else {
      // 现代 2.39:1 宽银幕珊瑚杏 × 奶黄月轮大留白呼吸
      ctx.fillStyle = "#FCBCA6";
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = "#FCE7D0";
      ctx.beginPath();
      ctx.arc(fx + fw * 0.68, fy + fh * 0.48, fh * 0.42, 0, Math.PI * 2);
      ctx.fill();
      const bh = fh * 0.92, bw = bh * 0.80;
      drawSilhouette(ctx, "poster", { x: fx + fw * 0.68 - bw * 0.5, y: fy + fh - bh + 5, w: bw, h: bh }, "#050707");
    }
    ctx.restore();

    // 画幅细框与比例铭牌
    ctx.strokeStyle = "rgba(252, 231, 208, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.fillStyle = "#FCE7D0";
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    ctx.textAlign = "center";
    ctx.fillText(`${era.year} · ${era.ratioLabel}`, w * 0.5, h - 10);
  }

  function select(key) {
    active = key;
    const era = ERAS[key];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === key)));
    if (titleEl) titleEl.textContent = era.title;
    if (metaEl) metaEl.textContent = `${era.year} · ${era.ratioLabel}`;
    if (descEl) descEl.textContent = era.desc;
    draw();
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  onSilhouetteReady(draw);
  window.addEventListener("resize", draw);
  select(active);
}

// =========================================================================
// 03 节（深酒黑暗室）：侧视机位—人物—后墙光学沙盘（墙距 × 布光模式）
// =========================================================================
export function initSection03() {
  const sideCanvas = document.getElementById("s03-side");
  const frontCanvas = document.getElementById("s03-front");
  const distSlider = document.getElementById("s03-dist");
  const distOut = document.getElementById("s03-dist-val");
  const lightBtns = [...document.querySelectorAll("[data-s03-light]")];
  const readout = document.getElementById("s03-readout");
  if (!sideCanvas || !frontCanvas) return;

  const st = { wallDist: 0.6, light: "flat" }; // 开场默认贴墙平光反例，鼓励拉远后墙距离

  function draw() {
    // 1) 侧视光路沙盘
    const sr = sideCanvas.getBoundingClientRect();
    const { ctx: sctx, w: sw, h: sh } = sizeCanvas(sideCanvas, Math.max(240, Math.round(sr.width || 460)), Math.max(180, Math.round(sr.height || 230)));

    sctx.fillStyle = "#1F1013";
    sctx.fillRect(0, 0, sw, sh);

    // 地面基准线与标尺刻度
    const floorY = sh * 0.78;
    sctx.strokeStyle = "rgba(252, 231, 208, 0.25)";
    sctx.lineWidth = 1;
    sctx.beginPath();
    sctx.moveTo(22, floorY);
    sctx.lineTo(sw - 22, floorY);
    sctx.stroke();

    const camX = sw * 0.14;
    const subX = sw * 0.42;
    // wallDist: 0.4m..5.0m 映射至 subX+24 .. sw-32
    const tDist = clamp((st.wallDist - 0.4) / 4.6, 0, 1);
    const wallX = subX + 26 + tDist * (sw - subX - 62);

    // 景深清晰区间带（以人物为焦点）
    const dofHalf = 22;
    sctx.fillStyle = "rgba(111, 214, 179, 0.14)";
    sctx.fillRect(subX - dofHalf, 28, dofHalf * 2, floorY - 28);
    sctx.strokeStyle = "rgba(111, 214, 179, 0.55)";
    sctx.setLineDash([3, 3]);
    sctx.strokeRect(subX - dofHalf, 28, dofHalf * 2, floorY - 28);
    sctx.setLineDash([]);

    // 镜头视锥线
    sctx.strokeStyle = "rgba(252, 231, 208, 0.22)";
    sctx.beginPath();
    sctx.moveTo(camX + 18, floorY - 56);
    sctx.lineTo(wallX, 24);
    sctx.moveTo(camX + 18, floorY - 56);
    sctx.lineTo(wallX, floorY);
    sctx.stroke();

    // 灯光位置与光束
    if (st.light === "backlight") {
      // 逆光灯照亮后墙圆月
      const lx = (subX + wallX) * 0.52;
      const ly = floorY - 14;
      const g = sctx.createRadialGradient(wallX - 4, floorY - 68, 4, wallX - 4, floorY - 68, 56);
      g.addColorStop(0, "rgba(252, 231, 208, 0.65)");
      g.addColorStop(1, "rgba(252, 231, 208, 0)");
      sctx.fillStyle = g;
      sctx.beginPath();
      sctx.arc(wallX - 4, floorY - 68, 56, 0, Math.PI * 2);
      sctx.fill();
      sctx.fillStyle = "#FCE7D0";
      sctx.beginPath();
      sctx.arc(lx, ly, 5, 0, Math.PI * 2);
      sctx.fill();
    } else if (st.light === "keydark") {
      // 前侧主光照亮主体、后墙落入负补光暗区
      const g = sctx.createLinearGradient(camX + 24, 30, subX + 8, floorY - 40);
      g.addColorStop(0, "rgba(252, 231, 208, 0.34)");
      g.addColorStop(1, "rgba(252, 231, 208, 0.04)");
      sctx.fillStyle = g;
      sctx.beginPath();
      sctx.moveTo(camX + 36, 28);
      sctx.lineTo(subX + 12, floorY - 88);
      sctx.lineTo(subX + 12, floorY - 22);
      sctx.closePath();
      sctx.fill();
    } else {
      // 机顶平光直打，贴墙时后墙投下硬黑重影
      sctx.fillStyle = "rgba(255, 148, 125, 0.16)";
      sctx.beginPath();
      sctx.moveTo(camX + 18, floorY - 68);
      sctx.lineTo(wallX, 34);
      sctx.lineTo(wallX, floorY - 6);
      sctx.closePath();
      sctx.fill();
    }

    // 三脚架与摄影机剪影（呼应原海报右下角图标）
    sctx.strokeStyle = "#FCE7D0";
    sctx.lineWidth = 1.8;
    sctx.beginPath();
    sctx.moveTo(camX, floorY - 50);
    sctx.lineTo(camX - 11, floorY);
    sctx.moveTo(camX, floorY - 50);
    sctx.lineTo(camX + 11, floorY);
    sctx.stroke();
    sctx.fillStyle = "#FCE7D0";
    sctx.fillRect(camX - 12, floorY - 62, 22, 13);
    sctx.fillRect(camX + 10, floorY - 59, 6, 7);

    // 人物简笔立姿侧影（无五官）
    sctx.fillStyle = "#FF947D";
    sctx.beginPath();
    sctx.arc(subX, floorY - 70, 9, 0, Math.PI * 2);
    sctx.fill();
    sctx.beginPath();
    sctx.roundRect(subX - 8, floorY - 58, 16, 36, 6);
    sctx.fill();
    sctx.fillRect(subX - 5, floorY - 22, 10, 22);

    // 可移动后墙立面
    const wallBlurOk = st.wallDist >= 2.2;
    sctx.fillStyle = wallBlurOk ? "#6FD6B3" : "#FF7A70";
    sctx.fillRect(wallX, 24, 7, floorY - 24);

    // 墙距双向标尺
    sctx.strokeStyle = wallBlurOk ? "#6FD6B3" : "#FF7A70";
    sctx.lineWidth = 1.4;
    sctx.beginPath();
    sctx.moveTo(subX + 8, floorY + 18);
    sctx.lineTo(wallX, floorY + 18);
    sctx.stroke();
    sctx.fillStyle = "#FCE7D0";
    sctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    sctx.textAlign = "center";
    sctx.fillText(`人物距墙 ${st.wallDist.toFixed(1)} m`, (subX + wallX) * 0.5, floorY + 34);
    sctx.fillStyle = "rgba(252,231,208,0.78)";
    sctx.fillText("摄影机", camX, floorY + 18);
    sctx.fillText("主体", subX, 18);
    sctx.fillText("后墙", wallX + 3, 18);

    // 2) 联动前视图结果预览
    const fr = frontCanvas.getBoundingClientRect();
    const { ctx: fctx, w: fw, h: fh } = sizeCanvas(frontCanvas, Math.max(240, Math.round(fr.width || 420)), Math.max(180, Math.round(fr.height || 230)));

    // 根据墙距计算真实物理虚化度（f/2.0 下墙距越远后墙纹理越融化，贴墙影越脱落）
    const blur = clamp((st.wallDist - 0.3) * 3.1, 0.3, 12.5);
    const bgHex = st.light === "keydark" ? "#261216" : st.light === "backlight" ? "#D68E79" : "#D9A490";
    fctx.fillStyle = bgHex;
    fctx.fillRect(0, 0, fw, fh);

    // 后墙砖缝/纹理（贴墙时刺眼清晰，拉远至 2.4m+ 时逐渐柔化消失）
    const texAlpha = clamp(0.46 - tDist * 0.38, 0.05, 0.46);
    fctx.strokeStyle = st.light === "keydark" ? `rgba(252,231,208,${(texAlpha * 0.45).toFixed(2)})` : `rgba(82,26,32,${texAlpha.toFixed(2)})`;
    fctx.lineWidth = Math.max(1, blur * 0.45);
    for (let gx = 20; gx < fw; gx += 32) {
      fctx.beginPath();
      fctx.moveTo(gx, 0);
      fctx.lineTo(gx, fh);
      fctx.stroke();
    }
    for (let gy = 20; gy < fh; gy += 28) {
      fctx.beginPath();
      fctx.moveTo(0, gy);
      fctx.lineTo(fw, gy);
      fctx.stroke();
    }

    // 逆光圆月托底
    if (st.light === "backlight") {
      const rMoon = Math.min(fw, fh) * 0.42;
      fctx.fillStyle = "#FCE7D0";
      fctx.beginPath();
      fctx.arc(fw * 0.58, fh * 0.48, rMoon, 0, Math.PI * 2);
      fctx.fill();
    }

    // 贴墙硬黑投影（平光且墙距 < 1.8m 时直接在脑后砸出丑陋双影）
    const boxH = fh * 0.90;
    const boxW = boxH * 0.80;
    const bx = fw * 0.58 - boxW * 0.5;
    const by = fh - boxH + 6;
    if (st.light === "flat" && st.wallDist < 2.2) {
      const shAlpha = clamp((2.2 - st.wallDist) / 1.8 * 0.58, 0, 0.58);
      const offset = 10 + st.wallDist * 14;
      drawSilhouette(fctx, "theater", { x: bx + offset, y: by + 6, w: boxW, h: boxH }, `rgba(28, 10, 14, ${shAlpha.toFixed(2)})`);
    }

    // 主体侧影
    const silFill = st.light === "keydark" ? "#F4DCC7" : "#070909";
    drawSilhouette(fctx, "theater", { x: bx, y: by, w: boxW, h: boxH }, silFill);

    // 状态条
    const clean = st.wallDist >= 2.2 && st.light !== "flat";
    fctx.fillStyle = "rgba(16, 8, 9, 0.84)";
    fctx.fillRect(10, 10, fw - 20, 24);
    fctx.fillStyle = clean ? "#6FD6B3" : "#FF947D";
    fctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    fctx.textAlign = "left";
    fctx.textBaseline = "middle";
    fctx.fillText(
      clean
        ? `后墙虚化 ${blur.toFixed(1)}px · 无贴墙重影 · 轮廓清透`
        : st.wallDist < 2.2
          ? `贴墙仅 ${st.wallDist.toFixed(1)}m · 墙纹锐利且易投重影`
          : `墙距已拉开 · 改逆光亮底或主光暗底拉开明暗`,
      18,
      22
    );

    if (distOut) distOut.textContent = `${st.wallDist.toFixed(1)} m`;
    if (readout) {
      if (st.wallDist < 1.5 && st.light === "flat") {
        readout.textContent = "贴墙平光是最常见的片场翻车：即使镜头开到 f/2.0，墙面也在清晰景深内，机顶光还会把硬黑重影直接打在脑后。把人物向前拉离后墙 2.2 米以上，再切逆光亮底或主光暗底看看。";
      } else if (st.wallDist < 2.2) {
        readout.textContent = `墙距 ${st.wallDist.toFixed(1)} m 仍然偏近，背景纹理还在清晰区边缘。片场经验值：尽量让「人物到背景墙的距离」大于「摄影机到人物的距离」。`;
      } else if (st.light === "flat") {
        readout.textContent = `拉出 ${st.wallDist.toFixed(1)} m 后墙面已明显柔化，但前后平光会让人物与墙面明度接近。切到「逆光亮底」或「主光暗底」，立刻拉出利落轮廓。`;
      } else {
        readout.textContent = `物理墙距 ${st.wallDist.toFixed(1)} m 叠加${st.light === "backlight" ? "逆光亮底" : "主光暗底"}：不用后期抠图，机身直出就能拿到边缘锐利、背景化开的净单人画面。`;
      }
    }
  }

  distSlider?.addEventListener("input", () => {
    st.wallDist = Number(distSlider.value);
    draw();
  });
  lightBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      st.light = btn.dataset.s03Light;
      lightBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      draw();
    });
  });
  window.addEventListener("resize", draw);
  draw();
}

// =========================================================================
// 04 节：四种最佳出场时机（拍摄处方翻签）
// =========================================================================
export function initSection04() {
  const tabs = [...document.querySelectorAll("[data-s04-tab]")];
  const panels = [...document.querySelectorAll("[data-s04-panel]")];
  if (!tabs.length) return;

  function select(id) {
    tabs.forEach((t) => {
      const on = t.dataset.s04Tab === id;
      t.setAttribute("aria-selected", String(on));
      t.setAttribute("aria-pressed", String(on));
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.s04Panel !== id;
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.s04Tab)));
  select(tabs[0].dataset.s04Tab);
}

// =========================================================================
// 05 节：什么时候别拍净单人（4 张独立翻牌正反对照卡）
// =========================================================================
export function initSection05() {
  const cards = [...document.querySelectorAll("[data-s05-card]")];
  cards.forEach((card) => {
    const btn = card.querySelector("[data-s05-flip]");
    const bad = card.querySelector("[data-s05-face='bad']");
    const fix = card.querySelector("[data-s05-face='fix']");
    if (!btn || !bad || !fix) return;
    let showingFix = false;
    const sync = () => {
      bad.hidden = showingFix;
      fix.hidden = !showingFix;
      card.dataset.mode = showingFix ? "fix" : "bad";
      btn.setAttribute("aria-pressed", String(showingFix));
      btn.textContent = showingFix ? "回看误用净单人" : "查看对症改拍";
    };
    btn.addEventListener("click", () => {
      showingFix = !showingFix;
      sync();
    });
    sync();
  });
}

// =========================================================================
// 06 节（深酒黑暗室）：小练习——严格单变量四选一盲测（与开场共用 model.js + viewfinder.js）
// =========================================================================
export function initSection06() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const resultBox = document.getElementById("s06-result");
  const resetBtn = document.getElementById("s06-reset");
  if (!cards.length) return;

  let picked = null;

  function renderAll() {
    cards.forEach((card, i) => {
      const opt = QUIZ_OPTIONS[i];
      const canvas = card.querySelector("canvas");
      const meta = card.querySelector("[data-quiz-meta]");
      if (!canvas || !opt) return;
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(140, Math.round(rect.width || 280));
      const cssH = Math.max(112, Math.round(rect.height || 210));
      const { ctx, w, h } = sizeCanvas(canvas, cssW, cssH);
      const ev = renderViewfinder(ctx, w, h, opt.state, {
        interactive: false,
        showStrikeHints: false,
        revealOverlay: picked !== null,
      });

      card.classList.toggle("is-picked", picked === opt.id);
      card.classList.toggle("is-correct", picked !== null && opt.correct);
      card.classList.toggle("is-wrong", picked === opt.id && !opt.correct);
      card.setAttribute("aria-pressed", String(picked === opt.id));

      if (meta) {
        if (picked === null) {
          meta.textContent = "点击或按数字键 1–4 选出最佳净单人";
        } else {
          const clipTxt = ev.rearMarginPct < 4 ? " · 发髻被右框切缺" : ` · 脑后余 ${ev.rearMarginPct}%`;
          meta.textContent = `实测视线留白 ${ev.lookRoomPct}%${clipTxt}${opt.correct ? " ✓" : ""}`;
        }
      }
    });
  }

  function answer(id) {
    picked = id;
    const chosen = QUIZ_OPTIONS.find((o) => o.id === id);
    renderAll();
    if (resultBox && chosen) {
      const rows = QUIZ_OPTIONS.map((o) => {
        const mark = o.correct ? "【正解】" : o.id === id ? "【你选了】" : "";
        return `<li><strong>${o.label} ${mark}</strong>：${o.reason}</li>`;
      }).join("");
      resultBox.hidden = false;
      resultBox.innerHTML = `
        <p class="quiz-verdict ${chosen.correct ? "ok" : "bad"}">
          ${chosen.correct ? "判断精准！构图 C 在四个同景别、同光圈、同纯净背景的画面里唯一做到了「轮廓完整 + 视线呼吸」。" : `你选了 ${chosen.label}——其实正解是构图 C。看上面同源标尺就知道差距在哪：`}
        </p>
        <ul class="quiz-breakdown">${rows}</ul>
      `;
    }
    if (resetBtn) resetBtn.hidden = false;
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => answer(card.dataset.quizOpt));
  });
  resetBtn?.addEventListener("click", () => {
    picked = null;
    if (resultBox) resultBox.hidden = true;
    resetBtn.hidden = true;
    renderAll();
  });

  // 键盘 1–4 快捷答题（仅当小练习在视口内且焦点不在输入框时）
  window.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
    const sec = document.getElementById("sec-06");
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.7 || r.bottom < window.innerHeight * 0.25) return;
    const map = { "1": "A", "2": "B", "3": "C", "4": "D" };
    if (map[e.key]) answer(map[e.key]);
  });

  onSilhouetteReady(renderAll);
  window.addEventListener("resize", renderAll);
  renderAll();
}

// =========================================================================
// 07 节：原海报高清灯箱（放大、鼠标/触控拖动、Esc 关闭）
// =========================================================================
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbStage = document.getElementById("lightbox-stage");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const closeBtn = document.getElementById("lb-close");
  const zoomLabel = document.getElementById("lb-zoom-val");
  if (!posterImg || !dialog || !lbImg || !lbStage) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0, stx = 0, sty = 0;

  function syncTransform() {
    if (scale <= 1.01) {
      tx = 0;
      ty = 0;
    }
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale.toFixed(2)})`;
    lbStage.dataset.zoomed = scale > 1.05 ? "true" : "false";
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    syncTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  posterImg.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  window.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(scale + 0.4, 1, 3);
    syncTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(scale - 0.4, 1, 3);
    syncTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    syncTransform();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    if (scale <= 1.05) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = clamp(stx + (e.clientX - sx), -480, 480);
    ty = clamp(sty + (e.clientY - sy), -640, 640);
    syncTransform();
  });
  const endDrag = () => {
    dragging = false;
  };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);
}

// 供性能测试确认开场动画流畅的同时避免离屏渲染消耗
export { loop };
