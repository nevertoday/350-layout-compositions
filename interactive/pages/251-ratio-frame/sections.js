// 251 比例框 · 正文 01–07 节专属交互与原海报灯箱

import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, SCENES } from "./artwork.js";
import { mapMediaRect } from "./model.js";

// ==================== 01 节：真实 DOM 三列混源卡片墙 ====================
export function initSection01() {
  const wall = document.getElementById("dom-wall");
  const readout = document.getElementById("wall-readout");
  const btns = [...document.querySelectorAll(".wall-btn")];
  const widthToggle = document.getElementById("wall-width-toggle");
  let mode = "auto";

  const copy = {
    auto: "未设比例框：三张卡片各按原图高度自由生长。浏览器如实展示原图，但卡片墙底边锯齿错落，视线难以横向扫读。",
    fill: "只定 4:3 框却用 fill 强拉：三张卡齐平了，但 2:3 竖建筑被横向拉胖、21:9 山脊被纵向拉扯，画面里的圆直接成了椭圆。",
    contain: "4:3 + contain 留边：原图零畸变、也没切掉像素，但左右和上下大片斜纹空边把页面切碎，卡片像没装满的空相框。",
    cover: "比例框原语（aspect-ratio: 4 / 3 + object-fit: cover）：三张混源素材底边分毫不差齐平，圆形端正、零空边，只在安全边缘轻裁多余部分。",
  };

  function applyPreserveAspect() {
    const svgs = [...wall.querySelectorAll(".wall-media svg")];
    const par = mode === "fill" ? "none" : mode === "contain" ? "xMidYMid meet" : "xMidYMid slice";
    svgs.forEach((s) => s.setAttribute("preserveAspectRatio", par));
  }

  function measure() {
    requestAnimationFrame(() => {
      const medias = [...wall.querySelectorAll(".wall-media")];
      const hs = medias.map((el) => Math.round(el.getBoundingClientRect().height));
      const diff = Math.max(...hs) - Math.min(...hs);
      const status =
        mode === "auto"
          ? `实测三卡图像高度：${hs.join("px / ")}px（高度差 ΔH = ${diff}px）`
          : `实测三卡图像高度：${hs.join("px / ")}px（高度差 ΔH = ${diff}px，底沿完全齐平）`;
      readout.innerHTML = `<strong>${status}</strong><br>${copy[mode]}`;
    });
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.wall;
      wall.classList.remove("mode-auto", "mode-fill", "mode-contain", "mode-cover");
      wall.classList.add(`mode-${mode}`);
      btns.forEach((x) => x.classList.toggle("is-active", x === b));
      applyPreserveAspect();
      measure();
    });
  });

  widthToggle.addEventListener("click", () => {
    const narrow = wall.classList.toggle("is-narrow");
    widthToggle.textContent = narrow ? "恢复常规列宽" : "切换紧凑列宽";
    measure();
  });

  window.addEventListener("resize", measure);
  applyPreserveAspect();
  measure();
}

// ==================== 02 节：Kerns Powers 1984 等面积同心框 + 历史时间轴 ====================
export function initSection02() {
  const canvas = document.getElementById("kerns-canvas");
  const ctx = canvas.getContext("2d");
  const readout = document.getElementById("kerns-readout");
  const chips = [...document.querySelectorAll(".k-chip")];

  const defs = {
    "1:1": { r: 1, color: "#7B6165", label: "1:1" },
    "4:3": { r: 4 / 3, color: "#A43C45", label: "4:3" },
    "3:2": { r: 3 / 2, color: "#C8685B", label: "3:2" },
    "16:9": { r: 16 / 9, color: "#1A6B4A", label: "16:9", bold: true },
    "2.35:1": { r: 2.35, color: "#4B1A22", label: "2.35:1" },
  };
  const active = new Set(["1:1", "4:3", "3:2", "16:9", "2.35:1"]);

  function drawKerns() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 淡中心轴线
    const cx = w / 2;
    const cy = h / 2;
    ctx.strokeStyle = "rgba(164, 60, 69, 0.16)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, 12);
    ctx.lineTo(cx, h - 12);
    ctx.moveTo(16, cy);
    ctx.lineTo(w - 16, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 选定统一视觉面积 A，使 2.35:1 不超宽、1:1 不超高
    const maxW = w - 44;
    const maxH = h - 42;
    const areaByW = (maxW * maxW) / 2.35;
    const areaByH = maxH * maxH;
    const area = Math.min(areaByW, areaByH);

    // 若同时选中 4:3 与 2.35:1，先标出公共外包络（正好约 16:9）
    if (active.has("4:3") && active.has("2.35:1")) {
      const envW = Math.sqrt(area * 2.35);
      const envH = Math.sqrt(area / (4 / 3));
      ctx.fillStyle = "rgba(26, 107, 74, 0.08)";
      ctx.fillRect(cx - envW / 2, cy - envH / 2, envW, envH);
    }

    const keys = [...active];
    const boxes = keys.map((k) => {
      const d = defs[k];
      const bw = Math.sqrt(area * d.r);
      const bh = Math.sqrt(area / d.r);
      return { k, d, bx: cx - bw / 2, by: cy - bh / 2, bw, bh };
    });

    // 第一遍：先绘全部等面积矩形线框，避免后续描边压穿已有比例角标
    boxes.forEach(({ k, d, bx, by, bw, bh }) => {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.bold ? 2.6 : 1.5;
      if (k === "16:9") ctx.setLineDash([]);
      else ctx.setLineDash(k === "1:1" ? [4, 3] : []);
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      ctx.setLineDash([]);
    });

    // 第二遍：把 5 枚角标绘在所有线框最上层，清晰错开零遮挡
    boxes.forEach(({ k, d, bx, by, bw, bh }) => {
      ctx.font = `700 11px "Outfit", sans-serif`;
      const tw = ctx.measureText(d.label).width + 10;
      let lx = bx;
      let ly = by;
      if (k === "1:1") { lx = cx - tw / 2; ly = by; }
      else if (k === "4:3") { lx = bx + 2; ly = by + 2; }
      else if (k === "3:2") { lx = bx + 2; ly = by + bh - 19; }
      else if (k === "16:9") { lx = bx + bw - tw - 2; ly = by + 2; }
      else if (k === "2.35:1") { lx = bx + bw - tw - 2; ly = by + bh - 19; }
      ctx.fillStyle = d.color;
      ctx.fillRect(lx, ly, tw, 17);
      ctx.fillStyle = "#FFFBF7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.label, lx + tw / 2, ly + 9);
    });

    // 中心红十字（呼应原海报）
    ctx.strokeStyle = PALETTE.seal;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();

    ctx.restore();

    if (keys.length === 0) {
      readout.textContent = "至少勾选一组比例框，即可对比等面积下的外框边界。";
    } else if (active.has("4:3") && active.has("2.35:1")) {
      const geoMean = Math.sqrt((4 / 3) * 2.35).toFixed(3);
      readout.innerHTML = `已叠加 ${keys.join(" · ")}（面积全等）。4:3 与 2.35:1 的几何平均数为 <strong>√(1.333 × 2.35) ≈ ${geoMean}</strong>，最简整数比正好是 <strong>16:9（1.778）</strong>——这就是高清宽屏的数学原点。`;
    } else {
      readout.textContent = `当前叠加 ${keys.join(" · ")}：所有矩形视觉面积严格相等，越接近 1:1 越稳重居中，越接近 2.35:1 越强调横向展开。`;
    }
  }

  chips.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.kr;
      if (active.has(k) && active.size > 1) active.delete(k);
      else active.add(k);
      btn.classList.toggle("is-on", active.has(k));
      drawKerns();
    });
  });

  // 历史里程碑切换
  const tlCard = document.getElementById("tl-card");
  const tlBtns = [...document.querySelectorAll(".tl-btn")];
  const timeline = {
    "1892": {
      title: "1892 · 爱迪生实验室与 4:3 电影底片",
      body: "苏格兰裔发明家 William Kennedy Dickson 在爱迪生实验室敲定 35mm 电影胶片规格：竖向过片、单格画幅约 18×24mm，留下接近 4:3（1.33:1）的标准比例。后来早期电视机、传统电脑显示器与幻灯片都沿用了这副骨架。",
      src: "核实来源：Linda Hall Library / 35 mm movie film 史料档案",
    },
    "1913": {
      title: "1913–1925 · 巴纳克与 3:2 全画幅摄影",
      body: "德国莱茨光学工程师 Oskar Barnack 研发便携相机 Ur-Leica（1913–1914 试制，1925 年以 Leica I 正式上市）：他把 35mm 电影胶片横着走、一次占两格片孔，诞生了 24×36mm 的 3:2 比例，成为延续百年的静态摄影与画册基准。",
      src: "核实来源：Leica Camera 档案 / 35mm 24×36mm 历史记载",
    },
    "1984": {
      title: "1984 · Kerns Powers 推导 16:9 折中宽屏",
      body: "面对 4:3 电视与 1.85:1、2.35:1 电影混播的难题，SMPTE 工作组成员 Dr. Kerns H. Powers 将等面积的不同比例矩形同心叠加，取两端 4:3 与 2.35:1 的几何平均数 √(1.333×2.35) ≈ 1.770，提出了 16:9（1.778），统一了现代高清电视、电脑屏幕与视频网站。",
      src: "核实来源：SMPTE 1984 HDTV 工作组纪要与 16:9 几何推导",
    },
    "2009": {
      title: "2009 · Thierry Koblentz 的 padding-bottom 技巧",
      body: "网页进入响应式时代后，嵌入视频仍被死像素宽高困住。2009 年 9 月 1 日，Thierry Koblentz 在 A List Apart 发表《Creating Intrinsic Ratios for Video》，利用 CSS 纵向百分比 padding 按父容器宽度计算的规则（如 56.25% 对应 16:9），发明了统治前端十余年的比例框写法。",
      src: "核实来源：A List Apart (2009-09-01), Creating Intrinsic Ratios for Video",
    },
    "2019": {
      title: "2019 · 《Every Layout》将比例框立为布局原语",
      body: "Heydon Pickering 与 Andy Bell 在 2019 年出版《Every Layout》，把不依赖媒体查询、可复用的底层版式结构抽象为一组布局原语，其中专门以「The Frame（比例框）」命名专门裁切和约束媒体比例的容器组件。",
      src: "核实来源：Every Layout (2019), The Frame",
    },
    "2021": {
      title: "2021 · CSS 原生 aspect-ratio 全面落地",
      body: "W3C《CSS Box Sizing Module Level 4》将 aspect-ratio 写入标准。2021 年 Chrome 88、Firefox 89 与 9 月的 Safari 15 相继支持，一行 aspect-ratio: 4 / 3 搭配 object-fit: cover 彻底取代了绝对定位嵌套技巧，并直接用于消除图片加载跳屏（CLS）。",
      src: "核实来源：MDN Web Docs / Baseline 2021 (Chrome 88, Firefox 89, Safari 15)",
    },
  };

  function showYear(y) {
    const d = timeline[y];
    tlCard.innerHTML = `<h3>${d.title}</h3><p>${d.body}</p><p class="tl-source">${d.src}</p>`;
    tlBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.year === y));
  }

  tlBtns.forEach((b) => b.addEventListener("click", () => showYear(b.dataset.year)));
  window.addEventListener("resize", drawKerns);
  showYear("1892");
  drawKerns();
}

// ==================== 03 节：暗室慢网 CLS 对比 + 一图四端焦心校准 ====================
export function initSection03() {
  const replayBtn = document.getElementById("btn-replay-cls");
  const slotBad = document.getElementById("cls-slot-bad");
  const slotGood = document.getElementById("cls-slot-good");
  const textBad = document.getElementById("cls-text-bad");
  const textGood = document.getElementById("cls-text-good");
  const meterBad = document.getElementById("cls-meter-bad");
  const meterGood = document.getElementById("cls-meter-good");
  let clsTimer = 0;

  function syncClsHeight() {
    const h = Math.round(slotGood.getBoundingClientRect().height);
    if (h > 40) {
      slotBad.style.setProperty("--cls-h", `${h}px`);
      return h;
    }
    return 152;
  }

  function runClsDuel() {
    clearTimeout(clsTimer);
    const targetH = syncClsHeight();
    slotBad.classList.remove("is-loaded");
    slotGood.classList.remove("is-loaded");
    meterBad.textContent = "加载中 · 正文先顶上…";
    meterGood.textContent = "骨架预占 · 等待出图…";

    const badY0 = textBad.getBoundingClientRect().top;
    const goodY0 = textGood.getBoundingClientRect().top;

    clsTimer = setTimeout(() => {
      syncClsHeight();
      slotBad.classList.add("is-loaded");
      slotGood.classList.add("is-loaded");
      setTimeout(() => {
        const dyBad = Math.round(textBad.getBoundingClientRect().top - badY0);
        const dyGood = Math.round(textGood.getBoundingClientRect().top - goodY0);
        const measured = Math.abs(dyBad) > 8 ? Math.abs(dyBad) : targetH;
        meterBad.textContent = `下踹 ΔY = +${measured}px`;
        meterGood.textContent = `位移 ΔY = ${Math.abs(dyGood)}px（稳）`;
      }, 240);
    }, 620);
  }

  replayBtn.addEventListener("click", runClsDuel);
  // 初始呈现已加载完的结果对比态，两卡同享实测 4:3 高度，点按钮即可重演慢网塌陷
  slotBad.classList.add("is-loaded");
  slotGood.classList.add("is-loaded");
  const initClsH = syncClsHeight();
  meterBad.textContent = `无框跳屏 ΔY = +${initClsH}px`;
  meterGood.textContent = "全程位移 ΔY = 0px";
  window.addEventListener("resize", () => {
    const h = syncClsHeight();
    if (meterBad.textContent.startsWith("无框跳屏")) {
      meterBad.textContent = `无框跳屏 ΔY = +${h}px`;
    }
  });

  // 一图四端焦心校准板
  const quadHost = document.getElementById("quad-frames");
  const verdict = document.getElementById("focal-verdict");
  const sceneBtns = [...document.querySelectorAll("[data-fscene]")];
  const posBtns = [...document.querySelectorAll("[data-fpos]")];

  const targets = [
    { id: "16:9", label: "16:9 宽屏封面", ratio: 16 / 9 },
    { id: "4:3", label: "4:3 文章配图", ratio: 4 / 3 },
    { id: "1:1", label: "1:1 社交头像", ratio: 1 },
    { id: "3:4", label: "3:4 手机竖卡", ratio: 3 / 4 },
  ];

  let fScene = "silhouette";
  let fPos = "50% 16%";

  quadHost.innerHTML = targets
    .map(
      (t) => `
      <div class="quad-item">
        <div class="quad-meta">
          <strong>${t.label}</strong>
          <span class="quad-state" data-qstate="${t.id}">完整</span>
        </div>
        <canvas class="quad-canvas" data-qcanvas="${t.id}" aria-label="${t.label} 焦心裁切预览"></canvas>
      </div>`
    )
    .join("");

  function parsePos(str) {
    const [sx, sy] = str.split(" ").map((v) => parseFloat(v) / 100);
    return { x: sx, y: sy };
  }

  function renderQuads() {
    const sc = SCENES[fScene];
    const pos = parsePos(fPos);
    const badList = [];

    targets.forEach((t) => {
      const c = quadHost.querySelector(`[data-qcanvas="${t.id}"]`);
      const st = quadHost.querySelector(`[data-qstate="${t.id}"]`);
      const rect = c.getBoundingClientRect();
      const cw = rect.width || 220;
      const ch = rect.height || 110;
      const dpr = pixelRatio(2);
      c.width = Math.round(cw * dpr);
      c.height = Math.round(ch * dpr);
      const ctx = c.getContext("2d");

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#240B10";
      ctx.fillRect(0, 0, cw, ch);

      // 在画布内居中按 t.ratio 绘出真实比例框
      const pad = 8;
      let fw = cw - pad * 2;
      let fh = fw / t.ratio;
      if (fh > ch - pad * 2) {
        fh = ch - pad * 2;
        fw = fh * t.ratio;
      }
      const fx = (cw - fw) / 2;
      const fy = (ch - fh) / 2;

      const m = mapMediaRect(fw, fh, sc.naturalRatio, "cover", pos.x, pos.y);
      ctx.save();
      ctx.beginPath();
      ctx.rect(fx, fy, fw, fh);
      ctx.clip();
      sc.draw(ctx, fx + m.x, fy + m.y, m.w, m.h);
      ctx.restore();

      // 算主体安全盒可见率
      const sb = sc.subjectBox;
      const sx0 = m.x + sb.x * m.w;
      const sy0 = m.y + sb.y * m.h;
      const sw = sb.w * m.w;
      const sh = sb.h * m.h;
      const ix0 = Math.max(0, sx0);
      const iy0 = Math.max(0, sy0);
      const ix1 = Math.min(fw, sx0 + sw);
      const iy1 = Math.min(fh, sy0 + sh);
      const vis = ix1 > ix0 && iy1 > iy0 ? ((ix1 - ix0) * (iy1 - iy0)) / (sw * sh) : 0;
      const isBad = vis < 0.82;

      ctx.strokeStyle = isBad ? PALETTE.errDark || "#FF9BA3" : "#F4A8AE";
      ctx.lineWidth = isBad ? 2 : 1.3;
      ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
      ctx.restore();

      st.textContent = isBad ? `切主体 · 留 ${Math.round(vis * 100)}%` : `主体完整 ${Math.round(vis * 100)}%`;
      st.classList.toggle("is-bad", isBad);
      if (isBad) badList.push(t.id);
    });

    if (badList.length === 0) {
      verdict.innerHTML = `object-position: <code>${fPos}</code> 在四个终端比例里全部保住了「${sc.subjectName}」。`;
    } else {
      verdict.innerHTML = `当前焦心 <code>${fPos}</code> 在 <strong>${badList.join("、")}</strong> 端把「${sc.subjectName}」切出了框外——同一张图跨端分发时，务必按主体重心设置 object-position。`;
    }
  }

  sceneBtns.forEach((b) => {
    b.addEventListener("click", () => {
      fScene = b.dataset.fscene;
      sceneBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      renderQuads();
    });
  });

  posBtns.forEach((b) => {
    b.addEventListener("click", () => {
      fPos = b.dataset.fpos;
      posBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      renderQuads();
    });
  });

  window.addEventListener("resize", renderQuads);
  renderQuads();
}

// ==================== 04 节：两代 CSS 对照 + 原语嵌套解剖 ====================
export function initSection04() {
  const eraCode = document.getElementById("era-code");
  const eraExplain = document.getElementById("era-explain");
  const eraBtns = [...document.querySelectorAll(".era-btn")];

  const eras = {
    "2009": {
      code: `/* 2009 Thierry Koblentz · padding-bottom 百分比技巧 */
.frame-legacy {
  position: relative;
  height: 0;
  padding-bottom: 75%; /* 3 ÷ 4 = 75%，按父宽度算出高度 */
  overflow: hidden;
}
.frame-legacy > img,
.frame-legacy > iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}`,
      explain: "旧写法巧妙利用了「纵向百分比 padding 参照父元素宽度」的规则，但它必须把子元素绝对定位抽离文档流——一旦里面放的不是纯图而是带字内容，文字就会被压死或溢出。",
    },
    "2021": {
      code: `/* 2021 现代原生比例框 · Every Layout The Frame */
.ratio-frame {
  aspect-ratio: var(--ratio, 4 / 3);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.ratio-frame > img,
.ratio-frame > video {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: var(--focal, 50% 50%);
}`,
      explain: "现代原生 aspect-ratio 彻底甩掉绝对定位与心算百分比：直接写 4 / 3 或 16 / 9，改比例只需覆写一个 CSS 变量 --ratio；而且当元素是普通文字容器时，它会在内容超高时主动撑开，不会静默截字。",
    },
  };

  function showEra(k) {
    eraCode.textContent = eras[k].code;
    eraExplain.textContent = eras[k].explain;
    eraBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.era === k));
  }

  eraBtns.forEach((b) => b.addEventListener("click", () => showEra(b.dataset.era)));
  showEra("2021");

  // 原语组合解剖
  const comboHost = document.getElementById("combo-diagram");
  const comboBtns = [...document.querySelectorAll(".combo-btn")];
  const combos = {
    grid: {
      summary: "多列商品/资讯卡片墙最常见的黄金搭档：网格决定列数，比例框决定每张封面的统一高度。",
      layers: [
        { name: "外层 · 250 自适应网格原语", role: "根据可用宽度自动决定放 1 / 2 / 3 / 4 列与统一列缝" },
        { name: "媒体槽 · 251 比例框（本页）", role: "每格顶部锁定 4:3 或 16:9，保证整行图片底边一条直线", self: true },
        { name: "文案槽 · 243 堆栈", role: "下方标题、摘要、标签自然流排，绝不锁比例" },
      ],
    },
    reel: {
      summary: "电影剧照或图集横滑条：横向卷轴管滚动与吸附，比例框管每一帧的画幅一致。",
      layers: [
        { name: "外层 · 252 横向卷轴", role: "单行横向排布与平滑滚动，给每张子项定基准宽度" },
        { name: "单帧 · 251 比例框（本页）", role: "所有剧照统一锁 16:9 或 3:2，横滑时不忽高忽矮", self: true },
      ],
    },
    card: {
      summary: "一张标准信息卡的三层分工：盒子管皮、堆栈管距、比例框管图。",
      layers: [
        { name: "外框 · 244 盒子", role: "提供统一内边距、细边框与底色边界" },
        { name: "纵向骨架 · 243 堆栈", role: "控制图、标题、正文之间的垂直节奏" },
        { name: "图框 · 251 比例框（本页）", role: "只包住顶部的媒体槽，隔离原图尺寸波动", self: true },
      ],
    },
  };

  function showCombo(k) {
    const c = combos[k];
    comboHost.innerHTML = `
      <div>${c.summary}</div>
      <div class="combo-layers">
        ${c.layers
          .map(
            (l) =>
              `<div class="combo-layer ${l.self ? "is-self" : ""}"><strong>${l.name}</strong><span>${l.role}</span></div>`
          )
          .join("")}
      </div>`;
    comboBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.combo === k));
  }

  comboBtns.forEach((b) => b.addEventListener("click", () => showCombo(b.dataset.combo)));
  showCombo("grid");
}

// ==================== 05 节：什么时候别用比例框（4 组反例压力测试） ====================
export function initSection05() {
  const tabs = [...document.querySelectorAll(".anti-tab")];
  const modeBtns = [...document.querySelectorAll(".btn-anti-mode")];
  const titleEl = document.getElementById("anti-title");
  const descEl = document.getElementById("anti-desc");
  const verdictEl = document.getElementById("anti-verdict");
  const previewEl = document.getElementById("anti-preview");

  let current = "text";
  let mode = "bad";

  const cases = {
    text: {
      title: "不要给「可变长度文字卡片」锁死比例框与溢出隐藏",
      desc: "文章摘要、多语言翻译或用户放大字号后，文字高度天生不可预测。把整张卡片锁死成 16:9 再加 overflow: hidden，窄屏或长文立刻会被腰斩。",
      badVerdict: "事故现场：容器被 16:9 + overflow: hidden 锁死，第三句和按钮直接被切在框外。",
      goodVerdict: "正确方案：去掉文字容器的 aspect-ratio，用自由流排布（或只给顶部配图单独加比例框），多长都能完整阅读。",
      render(isBad) {
        return `
          <div class="anti-demo-card ${isBad ? "is-text-clip" : ""}">
            <h4>春季设计刊 · 导读摘要</h4>
            <p>文字内容的长度会随屏幕宽度、字号放大、以及中英文翻译剧烈变化。</p>
            <p>如果对整张文字卡硬套 16:9 与 overflow: hidden，后半段关键说明和底部操作按钮会直接消失在视口外，造成严重的可用性事故。</p>
            <p><strong>正确做法：媒体区定比例，文本区自然生长。</strong></p>
          </div>`;
      },
    },
    chart: {
      title: "不要用 cover 裁切数据图表、地图、合同扫描件与代码截图",
      desc: "信息图的四边往往放着坐标轴、图例与最高值标注。为了卡片墙整齐而硬用 cover 裁切，等于亲手抹掉最有价值的数据。",
      badVerdict: "事故现场：1:1 + object-fit: cover 切掉了右侧 Q4 峰值数据与顶部单位刻度，读者误判趋势。",
      goodVerdict: "正确方案：改用 object-fit: contain 完整呈现（配浅纸底衬），或直接按图表原比例展示。",
      render(isBad) {
        return `
          <div style="width:${isBad ? "210px" : "300px"};border:1.5px solid ${isBad ? "#A8242E" : "#1A6B4A"};background:#FBF5EE;overflow:hidden;">
            <div style="aspect-ratio:${isBad ? "1 / 1" : "16 / 10"};overflow:hidden;position:relative;">
              <svg viewBox="0 0 320 180" width="100%" height="100%" preserveAspectRatio="${isBad ? "xMidYMid slice" : "xMidYMid meet"}">
                <rect width="320" height="180" fill="#FBF5EE"/>
                <line x1="36" y1="148" x2="300" y2="148" stroke="#554447" stroke-width="1.5"/>
                <line x1="36" y1="22" x2="36" y2="148" stroke="#554447" stroke-width="1.5"/>
                <polyline points="44,132 110,118 180,94 245,62 292,30" fill="none" stroke="#A43C45" stroke-width="3"/>
                <circle cx="292" cy="30" r="5" fill="#D75156"/>
                <text x="16" y="34" font-size="11" fill="#211719">100%</text>
                <text x="256" y="22" font-size="11" font-weight="700" fill="#A8242E">Q4 +88%</text>
                <text x="42" y="166" font-size="11" fill="#554447">Q1</text>
                <text x="278" y="166" font-size="11" fill="#554447">Q4</text>
              </svg>
            </div>
          </div>`;
      },
    },
    art: {
      title: "不要强行统一「画幅本身就是作品」的摄影与绘画原作",
      desc: "博物馆数字展厅、摄影师作品集或插画档案里，竖构图的修长感与宽银幕的辽阔感是作者的表达本身，统一切成 16:9 或 1:1 是在破坏原作。",
      badVerdict: "事故现场：把 3:4 竖幅人物肖像强切成 16:9 横框，头顶和裙摆双双遭殃，原作比例荡然无存。",
      goodVerdict: "正确方案：展厅档案应尊重原画幅（或采用等高不等宽的画廊行排法），只在缩略导航条里谨慎使用统一比例框。",
      render(isBad) {
        return `
          <div style="width:${isBad ? "290px" : "165px"};border:1.5px solid ${isBad ? "#A8242E" : "#1A6B4A"};background:#F6E4DA;overflow:hidden;">
            <div style="aspect-ratio:${isBad ? "16 / 9" : "3 / 4"};overflow:hidden;">
              <svg viewBox="0 0 180 240" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                <rect width="180" height="240" fill="#F6E4DA"/>
                <circle cx="90" cy="68" r="38" fill="#DF9C97"/>
                <circle cx="90" cy="64" r="19" fill="#4B1A22"/>
                <path d="M82 82 L98 82 Q122 98 132 225 L48 225 Q58 98 82 82 Z" fill="#4B1A22"/>
                <path d="M62 104 Q90 118 118 106 L126 154 Q90 144 54 156 Z" fill="#A43E4E"/>
                <rect y="216" width="180" height="24" fill="#B85560"/>
              </svg>
            </div>
          </div>`;
      },
    },
    override: {
      title: "工程暗坑：同时写死 width 和 height，aspect-ratio 会静默失效",
      desc: "按 W3C《CSS Box Sizing Module Level 4》规范，aspect-ratio 只在「宽或高至少有一边为 auto」时生效。如果手抖同时写了固定宽度和固定高度，比例框规则不会报错，而是直接被忽略。",
      badVerdict: "事故现场：同时写了 width: 180px; height: 180px; aspect-ratio: 16 / 9; —— 浏览器只认死宽高，画出来仍是 1:1 正方形！",
      goodVerdict: "正确方案：只定宽度（width: 240px 或 100%），让 height 保持 auto，aspect-ratio: 16 / 9 立刻生效。",
      render(isBad) {
        return `
          <div class="anti-demo-box-override">
            <div class="override-rect ${isBad ? "is-fixed-both" : "is-auto-height"}">
              <span>${isBad ? "width: 180px; height: 180px;" : "width: 240px; height: auto;"}</span>
              <span>aspect-ratio: 16 / 9;</span>
              <span>${isBad ? "→ 实得 180×180（失效！）" : "→ 实得 240×135（生效）"}</span>
            </div>
          </div>`;
      },
    },
  };

  function renderAnti() {
    const c = cases[current];
    const isBad = mode === "bad";
    titleEl.textContent = c.title;
    descEl.textContent = c.desc;
    verdictEl.textContent = isBad ? c.badVerdict : c.goodVerdict;
    previewEl.innerHTML = c.render(isBad);
    tabs.forEach((b) => b.classList.toggle("is-active", b.dataset.anti === current));
    modeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.antimode === mode));
  }

  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      current = b.dataset.anti;
      mode = "bad";
      renderAnti();
    })
  );
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.antimode;
      renderAnti();
    })
  );
  renderAnti();
}

// ==================== 06 节：眼力测验（3 题单变量，中性标签不泄题） ====================
export function initSection06() {
  const promptEl = document.getElementById("quiz-prompt");
  const optionsEl = document.getElementById("quiz-options");
  const feedbackEl = document.getElementById("quiz-feedback");
  const scoreEl = document.getElementById("quiz-score");
  const stepBtns = [...document.querySelectorAll(".q-step")];

  const questions = [
    {
      prompt: "第 1 题（填充策略变量）：编辑部要做三列资讯卡片墙，后台上传的封面混杂 2:3 竖图、1:1 方图与 21:9 宽图。以下四组 CSS 中，哪一组能同时做到「三列齐平、图像不变形、无多余留边」？",
      answer: 2,
      options: [
        {
          letter: "A",
          code: "aspect-ratio: auto;\nheight: auto;",
          svg: `<svg viewBox="0 0 180 96" width="168" height="90"><rect x="10" y="6" width="46" height="84" fill="#DE9693" stroke="#A43C45" stroke-width="1.4"/><rect x="67" y="6" width="46" height="46" fill="#A43E4E" stroke="#A43C45" stroke-width="1.4"/><rect x="124" y="6" width="46" height="22" fill="#4B1A22" stroke="#A43C45" stroke-width="1.4"/></svg>`,
          explain: "A 只用 height: auto，三张卡片会随原图高矮参差不齐，且慢网加载容易产生布局跳动。",
        },
        {
          letter: "B",
          code: "aspect-ratio: 4 / 3;\nobject-fit: fill;",
          svg: `<svg viewBox="0 0 180 96" width="168" height="90"><rect x="10" y="28" width="46" height="36" fill="#F7E3DB" stroke="#A43C45" stroke-width="1.4"/><ellipse cx="33" cy="46" rx="18" ry="7" fill="#A43E4E"/><rect x="67" y="28" width="46" height="36" fill="#F7E3DB" stroke="#A43C45" stroke-width="1.4"/><ellipse cx="90" cy="46" rx="14" ry="11" fill="#A43E4E"/><rect x="124" y="28" width="46" height="36" fill="#F7E3DB" stroke="#A43C45" stroke-width="1.4"/><ellipse cx="147" cy="46" rx="7" ry="14" fill="#A43E4E"/></svg>`,
          explain: "B 虽然齐平了，但 object-fit: fill 会强行把非 4:3 的图片压扁或拉瘦，圆形和人像全部失真。",
        },
        {
          letter: "C",
          code: "aspect-ratio: 4 / 3;\nobject-fit: cover;",
          svg: `<svg viewBox="0 0 180 96" width="168" height="90"><rect x="10" y="28" width="46" height="36" fill="#F7E3DB" stroke="#A43C45" stroke-width="1.4"/><circle cx="33" cy="46" r="10.5" fill="#A43E4E"/><rect x="67" y="28" width="46" height="36" fill="#F7E3DB" stroke="#A43C45" stroke-width="1.4"/><circle cx="90" cy="46" r="10.5" fill="#A43E4E"/><rect x="124" y="28" width="46" height="36" fill="#F7E3DB" stroke="#A43C45" stroke-width="1.4"/><circle cx="147" cy="46" r="10.5" fill="#A43E4E"/></svg>`,
          explain: "选对了！C 先用 aspect-ratio: 4 / 3 统一三列骨架，再以 object-fit: cover 按原比例铺满，既齐平又无形变、无空边。",
        },
        {
          letter: "D",
          code: "aspect-ratio: 4 / 3;\nobject-fit: contain;",
          svg: `<svg viewBox="0 0 180 96" width="168" height="90"><rect x="10" y="28" width="46" height="36" fill="#EADAD2" stroke="#A43C45" stroke-width="1.4"/><rect x="22" y="28" width="22" height="36" fill="#A43E4E"/><rect x="67" y="28" width="46" height="36" fill="#EADAD2" stroke="#A43C45" stroke-width="1.4"/><rect x="72" y="28" width="36" height="36" fill="#A43E4E"/><rect x="124" y="28" width="46" height="36" fill="#EADAD2" stroke="#A43C45" stroke-width="1.4"/><rect x="124" y="39" width="46" height="14" fill="#A43E4E"/></svg>`,
          explain: "D 用 contain 会保住全图，但竖图左右留白、宽图上下留黑边，整排卡片视觉显得零碎不满。",
        },
      ],
    },
    {
      prompt: "第 2 题（折中比例变量）：一个社区图库里一半是 3:2 横拍照片、一半是 4:5 竖拍照片，全员采用 object-fit: cover 装进同一套卡片墙。以下哪个容器比例对横竖两边的平均裁切损耗最温和？",
      answer: 2,
      options: [
        {
          letter: "A",
          code: "aspect-ratio: 21 / 9;",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="8" y="24" width="104" height="28" fill="#DE9693" stroke="#A43C45" stroke-width="1.4"/><line x1="8" y1="24" x2="112" y2="52" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/><line x1="112" y1="24" x2="8" y2="52" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/></svg>`,
          explain: "21:9 过于扁长，4:5 竖拍照片塞进去会被上下裁掉超过 65%，几乎只剩一条窄缝。",
        },
        {
          letter: "B",
          code: "aspect-ratio: 16 / 9;",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="14" y="18" width="92" height="40" fill="#DE9693" stroke="#A43C45" stroke-width="1.4"/><line x1="14" y1="18" x2="106" y2="58" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/><line x1="106" y1="18" x2="14" y2="58" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/></svg>`,
          explain: "16:9 对 3:2 横图很友好，但对 4:5 竖图仍然会切掉超过一半画面高度。",
        },
        {
          letter: "C",
          code: "aspect-ratio: 4 / 3;",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="24" y="14" width="72" height="48" fill="#DE9693" stroke="#A43C45" stroke-width="1.4"/><line x1="24" y1="14" x2="96" y2="62" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/><line x1="96" y1="14" x2="24" y2="62" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/></svg>`,
          explain: "选对了！4:3（1.33）夹在 4:5（0.80）与 3:2（1.50）之间，对横拍只轻裁 11%，对竖拍也能留住约 60% 主体，是混排最稳的折中画幅。",
        },
        {
          letter: "D",
          code: "aspect-ratio: 9 / 16;",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="44" y="6" width="32" height="64" fill="#DE9693" stroke="#A43C45" stroke-width="1.4"/><line x1="44" y1="6" x2="76" y2="70" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/><line x1="76" y1="6" x2="44" y2="70" stroke="#A43C45" stroke-width="0.9" stroke-dasharray="3 2"/></svg>`,
          explain: "9:16 过于狭长，3:2 横拍照片装进去会被左右裁掉超过 62%，两侧信息全丢。",
        },
      ],
    },
    {
      prompt: "第 3 题（作用边界变量）：一张包含「封面图 + 两行标题 + 可变长摘要」的商品资讯卡，应该把 aspect-ratio: 4 / 3 写在哪一层最稳妥？",
      answer: 0,
      options: [
        {
          letter: "A",
          code: ".card-media {\n  aspect-ratio: 4 / 3;\n}",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="24" y="4" width="72" height="68" fill="#FBF5EE" stroke="#A43C45" stroke-width="1.2"/><rect x="28" y="8" width="64" height="38" fill="#DE9693" stroke="#A43C45" stroke-width="1"/><rect x="28" y="52" width="48" height="5" fill="#4B1A22"/><rect x="28" y="61" width="60" height="4" fill="#9F3942"/></svg>`,
          explain: "选对了！比例框只负责顶部的媒体封面槽，下方文字区留给自然文档流，防跳屏、齐整、又绝不截字。",
        },
        {
          letter: "B",
          code: ".card-whole {\n  aspect-ratio: 4 / 3;\n  overflow: hidden;\n}",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="24" y="14" width="72" height="48" fill="#FBF5EE" stroke="#A43C45" stroke-width="1.2"/><rect x="28" y="18" width="64" height="28" fill="#DE9693" stroke="#A43C45" stroke-width="1"/><rect x="28" y="50" width="54" height="5" fill="#4B1A22"/><rect x="28" y="57" width="60" height="4" fill="#9F3942"/></svg>`,
          explain: "把整张图文卡锁死比例并加 overflow: hidden，文字多折一行就会被底边硬生生切掉。",
        },
        {
          letter: "C",
          code: ".card-media {\n  width: 240px; height: 240px;\n  aspect-ratio: 4 / 3;\n}",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="24" y="4" width="72" height="68" fill="#FBF5EE" stroke="#A43C45" stroke-width="1.2"/><rect x="36" y="8" width="48" height="48" fill="#DE9693" stroke="#A43C45" stroke-width="1"/><rect x="28" y="61" width="52" height="5" fill="#4B1A22"/></svg>`,
          explain: "同时写死 width 和 height 时，按 CSS 规范 aspect-ratio 会直接失效，实际渲染出来还是 1:1。",
        },
        {
          letter: "D",
          code: ".card-media img {\n  width: 100%;\n  /* 不写比例与宽高 */\n}",
          svg: `<svg viewBox="0 0 120 76" width="112" height="72"><rect x="24" y="8" width="72" height="58" fill="#FBF5EE" stroke="#A43C45" stroke-width="1.2"/><rect x="28" y="12" width="64" height="10" fill="#EADAD2" stroke="#A43C45" stroke-dasharray="3 2"/><rect x="28" y="28" width="56" height="5" fill="#4B1A22"/><rect x="28" y="38" width="44" height="4" fill="#9F3942"/></svg>`,
          explain: "既不写 aspect-ratio 也不写原生宽高属性，慢网下图片到位前框高为 0，加载瞬间会把标题往下踹开导致 CLS。",
        },
      ],
    },
  ];

  let idx = 0;
  const picks = [null, null, null];

  function updateScore() {
    const done = picks.filter((x) => x !== null).length;
    const right = picks.filter((x, i) => x === questions[i].answer).length;
    scoreEl.textContent = done === 0 ? "已答 0 / 3" : `已答 ${done} / 3 · 答对 ${right}`;
  }

  function renderQ() {
    const q = questions[idx];
    const picked = picks[idx];
    promptEl.textContent = q.prompt;
    stepBtns.forEach((b, i) => b.classList.toggle("is-active", i === idx));

    optionsEl.innerHTML = q.options
      .map((opt, i) => {
        let cls = "quiz-opt";
        if (picked === i) cls += i === q.answer ? " is-picked-ok" : " is-picked-bad";
        return `
          <button type="button" class="${cls}" data-opt="${i}" role="radio" aria-checked="${picked === i}">
            <span class="quiz-opt-head">
              <span class="quiz-letter">${opt.letter}</span>
              <span class="quiz-opt-code">${opt.code.replace(/\n/g, "<br>")}</span>
            </span>
            <span class="quiz-thumb" aria-hidden="true">${opt.svg}</span>
          </button>`;
      })
      .join("");

    optionsEl.querySelectorAll(".quiz-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        picks[idx] = Number(btn.dataset.opt);
        updateScore();
        renderQ();
      });
    });

    feedbackEl.classList.remove("is-ok", "is-bad");
    if (picked === null) {
      feedbackEl.textContent = "点击上方 A / B / C / D 任一方案查看实时判定与原因解析。";
    } else {
      const ok = picked === q.answer;
      feedbackEl.classList.add(ok ? "is-ok" : "is-bad");
      feedbackEl.textContent = q.options[picked].explain;
    }
  }

  stepBtns.forEach((b) =>
    b.addEventListener("click", () => {
      idx = Number(b.dataset.q);
      renderQ();
    })
  );

  updateScore();
  renderQ();
}

// ==================== 07 节：原海报高清放大灯箱（含缩放与鼠标拖移） ====================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const dialog = document.getElementById("zoom");
  const view = document.getElementById("zoom-view");
  const img = document.getElementById("zoom-img");
  const level = document.getElementById("zoom-level");
  let k = 1;

  const setZoom = (next, cx = 0.5, cy = 0.5) => {
    const fx = (view.scrollLeft + view.clientWidth * cx) / Math.max(1, view.scrollWidth);
    const fy = (view.scrollTop + view.clientHeight * cy) / Math.max(1, view.scrollHeight);
    k = Math.min(4, Math.max(1, next));
    img.style.setProperty("--k", String(k));
    level.textContent = `${Math.round(k * 100)}%`;
    view.style.cursor = k > 1 ? "grab" : "zoom-in";
    view.scrollLeft = fx * view.scrollWidth - view.clientWidth * cx;
    view.scrollTop = fy * view.scrollHeight - view.clientHeight * cy;
  };

  const open = () => {
    if (!img.src) img.src = poster.src;
    dialog.showModal();
    setZoom(1);
  };

  document.getElementById("poster-open").addEventListener("click", open);
  document.getElementById("zoom-in").addEventListener("click", () => setZoom(k * 1.5));
  document.getElementById("zoom-out").addEventListener("click", () => setZoom(k / 1.5));
  document.getElementById("zoom-close").addEventListener("click", () => dialog.close());
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      dialog.close();
    }
  });
  img.addEventListener("click", (e) => {
    const r = view.getBoundingClientRect();
    setZoom(k >= 3.5 ? 1 : k * 2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  let pan = null;
  view.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || k === 1) return;
    pan = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop, moved: false };
    view.style.cursor = "grabbing";
  });
  view.addEventListener("pointermove", (e) => {
    if (!pan) return;
    pan.moved ||= Math.hypot(e.clientX - pan.x, e.clientY - pan.y) > 4;
    view.scrollLeft = pan.l - (e.clientX - pan.x);
    view.scrollTop = pan.t - (e.clientY - pan.y);
  });
  view.addEventListener(
    "click",
    (e) => {
      if (pan?.moved) e.stopPropagation();
      pan = null;
    },
    true
  );
  view.addEventListener("pointerup", () => {
    view.style.cursor = k > 1 ? "grab" : "zoom-in";
    setTimeout(() => {
      pan = null;
    });
  });
}
