// 140 图片主导版式 · 第 01–06 节独立交互实验模块
// 每一节控件互不重复：01 快门瞬闪 / 02 裁切取景直拖 / 03 暗室三开关 / 04 时代跨页图谱 / 05 翻车诊改卡 / 06 单变量四选一考场
import { pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp } from "./model.js";

/* ==================== 01 · 快门瞬闪实验台 ==================== */
export function initShutterLab() {
  const svg = document.getElementById("shutter-svg");
  const curtain = document.getElementById("shutter-curtain");
  const readout = document.getElementById("shutter-readout");
  const ratioBtns = [...document.querySelectorAll("[data-flash-ratio]")];
  const speedBtns = [...document.querySelectorAll("[data-speed]")];
  const fireBtn = document.getElementById("btn-shutter-fire");

  let ratio = 72;
  let speed = 80;
  let timer = 0;

  const COPY = {
    18: "<strong>18% 邮票图（主图太弱）</strong>：一闪而过后，眼睛只记住一大片灰白文字栏，几乎没注意到角落的小蓝图——图片沦为装饰点缀。",
    45: "<strong>45% 五五开（主次打架）</strong>：图和字在版面上平分秋色，瞬闪后视线在左图与右字之间犹豫摇摆，两边都没占到绝对上风。",
    72: "<strong>72% 图像主导（经验甜区）</strong>：极短曝光里，巨型蓝球与左下朱红点瞬间抢占视觉皮层，左上标题自然接力，信息层级零摩擦。",
    95: "<strong>95% 满图无隙（过满挤字）</strong>：主图本身冲击极强，但四周几乎没有安静负空间，标题和说明被迫硬叠在亮暗交界处，字很难读清。",
  };

  function renderSvg() {
    const rMap = { 18: 44, 45: 76, 72: 122, 95: 162 };
    const cxMap = { 18: 310, 45: 270, 72: 266, 95: 224 };
    const rad = rMap[ratio];
    const cx = cxMap[ratio];
    const cy = ratio === 18 ? 140 : 134;
    const textW = ratio === 18 ? 200 : ratio === 45 ? 160 : ratio === 72 ? 102 : 120;
    const textX = 22;
    const textY = ratio === 95 ? 112 : 94;
    const hasIce = ratio >= 72;

    svg.innerHTML = `
      <defs>
        <linearGradient id="sh-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0C9C9B"/>
          <stop offset="55%" stop-color="#00337F"/>
          <stop offset="100%" stop-color="#001447"/>
        </linearGradient>
        <radialGradient id="sh-orb" cx="28%" cy="32%" r="72%">
          <stop offset="0%" stop-color="#9BD6FF"/>
          <stop offset="28%" stop-color="#2276D6"/>
          <stop offset="68%" stop-color="#01123B"/>
          <stop offset="100%" stop-color="#010308"/>
        </radialGradient>
      </defs>
      <rect width="420" height="260" fill="url(#sh-bg)"/>
      ${ratio === 18 ? `<rect x="${cx - rad - 10}" y="${cy - rad - 10}" width="${(rad + 10) * 2}" height="${(rad + 10) * 2}" fill="none" stroke="rgba(255,124,102,0.8)" stroke-dasharray="4 3"/>` : ""}
      <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#sh-orb)"/>
      ${hasIce ? `<polygon points="${ratio === 95 ? "310,260 420,150 420,260" : "180,260 420,66 420,260"}" fill="#C7D9E5" opacity="${ratio === 95 ? 0.55 : 0.92}"/>` : ""}
      <circle cx="${ratio === 18 ? 248 : 138}" cy="222" r="10" fill="#E22F16"/>
      <rect x="22" y="20" width="${ratio === 18 ? 190 : 148}" height="24" fill="#FFFFFF" opacity="0.95"/>
      <rect x="22" y="50" width="96" height="7" fill="#CBEAF5" opacity="0.8"/>
      <g opacity="${ratio === 72 ? 0.92 : 0.98}">
        ${ratio === 95 ? `<rect x="${textX - 6}" y="${textY - 6}" width="${textW + 12}" height="74" fill="rgba(181,31,11,0.34)" stroke="#FF7C66" stroke-dasharray="4 3"/>` : ""}
        <rect x="${textX}" y="${textY}" width="${textW}" height="10" fill="#FFFFFF"/>
        <rect x="${textX}" y="${textY + 18}" width="${Math.round(textW * 0.85)}" height="7" fill="#C9E5FA"/>
        <rect x="${textX}" y="${textY + 32}" width="${Math.round(textW * 0.92)}" height="7" fill="#C9E5FA"/>
        <rect x="${textX}" y="${textY + 46}" width="${Math.round(textW * 0.68)}" height="7" fill="#C9E5FA"/>
        ${ratio <= 45 ? `<rect x="${textX}" y="${textY + 62}" width="${Math.round(textW * 0.88)}" height="7" fill="#C9E5FA"/><rect x="${textX}" y="${textY + 76}" width="${Math.round(textW * 0.74)}" height="7" fill="#C9E5FA"/>` : ""}
      </g>
      <line x1="${textX + textW + 6}" y1="${textY + 6}" x2="${cx - rad * 0.52}" y2="${cy - rad * 0.25}" stroke="#F8F026" stroke-width="1.4" stroke-dasharray="4 3"/>
      <circle cx="${cx - rad * 0.52}" cy="${cy - rad * 0.25}" r="3.5" fill="#F8F026"/>
      <rect x="314" y="14" width="94" height="22" fill="rgba(2,17,56,0.88)" stroke="#F8F026"/>
      <text x="361" y="29" text-anchor="middle" fill="#F8F026" font-family="DM Mono, monospace" font-size="11">主图 ${ratio}%</text>
    `;
    readout.innerHTML = COPY[ratio];
  }

  function fireShutter() {
    clearTimeout(timer);
    if (reducedMotion.matches) {
      readout.innerHTML = `${COPY[ratio]} <br><em>（已开启减少动态效果，直接保持常亮对照。）</em>`;
      return;
    }
    // 闭帘 -> 极短放光 -> 闭帘片刻 -> 自动揭帘复盘
    curtain.classList.add("is-closed");
    curtain.querySelector(".curtain-text").textContent = `准备 ${speed} ms 曝光…`;
    timer = setTimeout(() => {
      curtain.classList.remove("is-closed");
      timer = setTimeout(() => {
        curtain.classList.add("is-closed");
        curtain.querySelector(".curtain-text").textContent = `${speed} ms 闪看结束 · 第一眼你先看到了图还是字？`;
        timer = setTimeout(() => {
          curtain.classList.remove("is-closed");
        }, 1250);
      }, Math.max(speed, 24));
    }, 340);
  }

  ratioBtns.forEach((b) => b.addEventListener("click", () => {
    ratio = Number(b.dataset.flashRatio);
    ratioBtns.forEach((x) => x.classList.toggle("is-active", x === b));
    curtain.classList.remove("is-closed");
    renderSvg();
  }));
  speedBtns.forEach((b) => b.addEventListener("click", () => {
    speed = Number(b.dataset.speed);
    speedBtns.forEach((x) => x.classList.toggle("is-active", x === b));
  }));
  fireBtn.addEventListener("click", fireShutter);

  renderSvg();
}

/* ==================== 02 · 裁切刀法与斜切角直拖实验台 ==================== */
export function initCropLab() {
  const canvas = document.getElementById("crop-canvas");
  const ctx = canvas.getContext("2d");
  const btns = [...document.querySelectorAll("[data-crop-mode]")];
  const outEl = document.getElementById("crop-out-val");
  const coreEl = document.getElementById("crop-core-val");
  const angEl = document.getElementById("crop-ang-val");
  const readout = document.getElementById("crop-readout");

  const MODES = {
    whole:    { cx: 0.50, cy: 0.50, rFrac: 0.30, angle: 45, cut: 0.00, note: "<strong>全貌居中（证件照感）</strong>：球体四边完整收在画框内，裁切率为 0%。大脑一眼量完尺寸，画面稳定却平淡，少了杂志封面的压迫与延展感。" },
    edge:     { cx: 0.72, cy: 0.50, rFrac: 0.46, angle: 45, cut: 0.00, note: "<strong>单边破框（尺度倍增）</strong>：只让球体右弧冲出右缘，格式塔闭合让大脑在画外补完圆弧，主体在心理上瞬间比框内全貌大出一圈。" },
    diagonal: { cx: 0.64, cy: 0.48, rFrac: 0.48, angle: 45, cut: 0.36, note: "<strong>海报 140 斜切刀法</strong>：右缘破框叠加右下 45° 浅冰斜切面，一刀切出明暗强反差与斜向动势，同时为右下角注释留出干净着陆区。" },
    over:     { cx: 0.90, cy: 0.66, rFrac: 0.56, angle: 34, cut: 0.52, note: "<strong>过度紧裁（失去辨识）</strong>：边缘与斜切合吃掉主体超七成面积，圆弧几乎退化成一条无特征斜边，观者一瞥之内认不出原本的主体。" },
  };

  let cur = { ...MODES.diagonal, mode: "diagonal" };
  let dragging = false;

  function draw() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = pixelRatio(2);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深蓝背景
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#0C9C9B");
    bg.addColorStop(0.55, "#00337F");
    bg.addColorStop(1, "#001447");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const cx = cur.cx * w;
    const cy = cur.cy * h;
    const r = Math.min(w, h) * cur.rFrac;

    // 球体
    const orb = ctx.createRadialGradient(cx - r * 0.55, cy - r * 0.42, r * 0.08, cx + r * 0.1, cy + r * 0.1, r * 1.25);
    orb.addColorStop(0, "#A4DCFF");
    orb.addColorStop(0.28, "#1F74D4");
    orb.addColorStop(0.66, "#011647");
    orb.addColorStop(1, "#010308");
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 画外虚线续圆示意（可视化格式塔闭合）
    if (cur.mode !== "whole") {
      ctx.save();
      ctx.strokeStyle = "rgba(248, 240, 38, 0.45)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 斜切半平面：法向角由 cur.angle 决定
    const rad = (cur.angle * Math.PI) / 180;
    const nx = Math.cos(rad);
    const ny = Math.sin(rad);
    const maxProj = w * nx + h * ny;
    const cutLineProj = maxProj * (1 - cur.cut * 0.92);

    if (cur.cut > 0.01) {
      ctx.save();
      ctx.beginPath();
      // 用大矩形裁剪半平面
      const px = nx * cutLineProj;
      const py = ny * cutLineProj;
      const tx = -ny * 1200, ty = nx * 1200;
      ctx.moveTo(px - tx, py - ty);
      ctx.lineTo(px + tx, py + ty);
      ctx.lineTo(px + tx + nx * 1200, py + ty + ny * 1200);
      ctx.lineTo(px - tx + nx * 1200, py - ty + ny * 1200);
      ctx.closePath();
      const ice = ctx.createLinearGradient(px, py, w, h);
      ice.addColorStop(0, "#DCE8F2");
      ice.addColorStop(0.55, "#90BEE5");
      ice.addColorStop(1, "#0970C6");
      ctx.fillStyle = ice;
      ctx.fill();

      // 刀刃黄线
      ctx.strokeStyle = "#F8F026";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - tx, py - ty);
      ctx.lineTo(px + tx, py + ty);
      ctx.stroke();
      ctx.restore();
    }

    // 真实采样球体可见比与裁切比
    let tot = 0, cropped = 0;
    for (let iy = 0; iy < 20; iy++) {
      const uy = ((iy + 0.5) / 20) * 2 - 1;
      for (let ix = 0; ix < 20; ix++) {
        const ux = ((ix + 0.5) / 20) * 2 - 1;
        if (ux * ux + uy * uy > 1) continue;
        tot++;
        const x = cx + ux * r, y = cy + uy * r;
        const out = x < 0 || x > w || y < 0 || y > h;
        const sliced = cur.cut > 0.01 && (x * nx + y * ny) >= cutLineProj;
        if (out || sliced) cropped++;
      }
    }
    const cropPct = Math.round((cropped / Math.max(1, tot)) * 100);
    const corePct = 100 - cropPct;

    outEl.textContent = `${cropPct}%`;
    coreEl.textContent = `${corePct}%`;
    angEl.textContent = cur.cut > 0.01 ? `${Math.round(cur.angle)}°` : "无斜切";

    // 角标提示拖动
    ctx.fillStyle = "rgba(2, 17, 56, 0.85)";
    ctx.fillRect(10, 10, 176, 22);
    ctx.fillStyle = "#F8F026";
    ctx.font = `500 11px "DM Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "middle";
    ctx.fillText(cur.cut > 0.01 ? `横拖微调斜切角：${Math.round(cur.angle)}°` : "切「海报 140 斜切」体验斜刃", 18, 21);

    ctx.restore();
  }

  btns.forEach((b) => b.addEventListener("click", () => {
    const m = b.dataset.cropMode;
    cur = { ...MODES[m], mode: m };
    btns.forEach((x) => x.classList.toggle("is-active", x === b));
    readout.innerHTML = cur.note;
    draw();
  }));

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (cur.cut < 0.05) cur.cut = 0.34;
    const rect = canvas.getBoundingClientRect();
    const u = clamp((e.clientX - rect.left) / rect.width, 0.08, 0.92);
    cur.angle = Math.round(22 + u * 48); // 22°..70°
    readout.innerHTML = `<strong>自定义斜切角 ${cur.angle}°</strong>：角度越接近 45° 对角线，冰川浅蓝面与蓝球弧线的切割张力越干脆，右下落字区也最方正。`;
    draw();
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  window.addEventListener("resize", draw);

  draw();
}

/* ==================== 03 · 午夜暗室注释配线盘 ==================== */
export function initAnnotationLab() {
  const svg = document.getElementById("ann-svg");
  const readout = document.getElementById("ann-readout");
  const swBtns = [...document.querySelectorAll("[data-ann-key]")];

  const st = { anchor: "edge", line: "dual", copy: "third" };

  function render() {
    const isOverlay = st.anchor === "overlay";
    const isBlank = st.anchor === "blank";
    const isDual = st.line === "dual";
    const isHeavy = st.line === "heavy";
    const isNone = st.line === "none";
    const isThird = st.copy === "third";

    const c1Title = isThird ? "图像优先" : "这是一颗圆球";
    const c1Sub = isThird ? "让图片成为视觉焦点" : "画面中间有一个蓝球";
    const c2Title = isThird ? "注释引导" : "下面有个红点";
    const c2Sub = isThird ? "用线条标注信息层级" : "左下角放着一个红圆";

    const tx1 = isOverlay ? 190 : 18;
    const ty1 = isOverlay ? 94 : 62;
    const tx2 = isOverlay ? 210 : 18;
    const ty2 = isOverlay ? 156 : 178;

    const ax1 = isBlank ? 116 : 210;
    const ay1 = isBlank ? 88 : 98;
    const ax2 = isBlank ? 118 : 134;
    const ay2 = isBlank ? 188 : 206;

    const strokeW = isHeavy ? 3.5 : 1.5;
    const strokeCol = isHeavy ? "#FF7C66" : "#F8F026";
    const good = st.anchor === "edge" && st.line === "dual" && st.copy === "third";

    svg.innerHTML = `
      <defs>
        <radialGradient id="an-orb" cx="30%" cy="32%" r="70%">
          <stop offset="0%" stop-color="#9BD6FF"/>
          <stop offset="32%" stop-color="#1969C8"/>
          <stop offset="72%" stop-color="#01123B"/>
          <stop offset="100%" stop-color="#010309"/>
        </radialGradient>
      </defs>
      <rect width="460" height="250" fill="#031642"/>
      <circle cx="300" cy="128" r="112" fill="url(#an-orb)"/>
      <polygon points="228,250 460,64 460,250" fill="#C7D9E5" opacity="0.88"/>
      <circle cx="148" cy="208" r="12" fill="#E22F16"/>

      ${!isNone && !isOverlay ? `
        <line x1="${tx1 + 106}" y1="${ty1 + 16}" x2="${ax1}" y2="${ay1}" stroke="${strokeCol}" stroke-width="${strokeW}" ${isDual ? 'stroke-dasharray="5 4"' : ""}/>
        <circle cx="${ax1}" cy="${ay1}" r="${isHeavy ? 5 : 4}" fill="${isBlank ? "#FF7C66" : strokeCol}"/>
        <line x1="${tx2 + 106}" y1="${ty2 + 16}" x2="${ax2}" y2="${ay2}" stroke="${strokeCol}" stroke-width="${strokeW}"/>
        <circle cx="${ax2}" cy="${ay2}" r="${isHeavy ? 5 : 4}" fill="${isBlank ? "#FF7C66" : strokeCol}"/>
        <line x1="398" y1="36" x2="328" y2="30" stroke="${strokeCol}" stroke-width="${strokeW}"/>
        <circle cx="328" cy="30" r="4" fill="${strokeCol}"/>
      ` : ""}

      ${isHeavy ? `<rect x="12" y="54" width="118" height="46" fill="none" stroke="#FF7C66" stroke-width="2"/><rect x="12" y="170" width="118" height="46" fill="none" stroke="#FF7C66" stroke-width="2"/>` : ""}
      ${isOverlay ? `<rect x="${tx1 - 6}" y="${ty1 - 6}" width="134" height="46" fill="rgba(181,31,11,0.55)" stroke="#FF7C66" stroke-dasharray="4 3"/><rect x="${tx2 - 6}" y="${ty2 - 6}" width="134" height="46" fill="rgba(181,31,11,0.55)" stroke="#FF7C66" stroke-dasharray="4 3"/>` : ""}

      <text x="382" y="24" fill="#FFFFFF" font-size="12" font-weight="700">视觉中心</text>
      <text x="${tx1}" y="${ty1 + 12}" fill="#FFFFFF" font-size="13" font-weight="700">${c1Title}</text>
      <rect x="${tx1}" y="${ty1 + 19}" width="22" height="2" fill="#F8F026"/>
      <text x="${tx1}" y="${ty1 + 35}" fill="#CFE7FA" font-size="11">${c1Sub}</text>

      <text x="${tx2}" y="${ty2 + 12}" fill="#FFFFFF" font-size="13" font-weight="700">${c2Title}</text>
      <rect x="${tx2}" y="${ty2 + 19}" width="22" height="2" fill="#F8F026"/>
      <text x="${tx2}" y="${ty2 + 35}" fill="#CFE7FA" font-size="11">${c2Sub}</text>

      <rect x="14" y="12" width="206" height="22" fill="${good ? "rgba(3,74,68,0.92)" : "rgba(168,28,14,0.9)"}" stroke="${good ? "#2BE0C2" : "#FF907D"}"/>
      <text x="22" y="27" fill="#FFFFFF" font-family="DM Mono, Noto Sans SC, monospace" font-size="11">${good ? "✓ ①主图 → ②配重 → ③引线" : "× 注释与主图协同受损"}</text>
    `;

    const msgs = [];
    if (isOverlay) msgs.push("文字直接盖在蓝球受光区上，把视觉中心生生切碎，既遮图又难读。");
    else if (isBlank) msgs.push("黄点落在了空白背景里，读者顺着线看过去什么也没指到，引线白占空间。");
    if (isHeavy) msgs.push("全粗实线加粗框把画面割成工程表格，线抢走了主图的风头。");
    else if (isNone) msgs.push("去掉引线后，边角文字与主图特征断联，眼睛不得不反复来回猜哪段字在说哪一块。");
    if (!isThird) msgs.push("文案只是重复「这是蓝球、那是红点」，没有提供图外信息，浪费了读者注意力。");

    if (good) {
      readout.innerHTML = "<strong>视线秩序成立（① 视觉中心 → ② 朱红配重 → ③ 细线注记）</strong>：140 原海报用实线钉住核心锚点、虚线轻引辅助说明，且每段短字都在补充信息层级而非重复看图说话。";
    } else {
      readout.innerHTML = `<strong>协同诊断</strong>：${msgs.join(" ")}`;
    }
  }

  swBtns.forEach((b) => b.addEventListener("click", () => {
    st[b.dataset.annKey] = b.dataset.annVal;
    swBtns.filter((x) => x.dataset.annKey === b.dataset.annKey).forEach((x) => x.classList.toggle("is-active", x === b));
    render();
  }));

  render();
}

/* ==================== 04 · 时代跨页图谱 ==================== */
export function initLineageLab() {
  const cards = [...document.querySelectorAll(".era-card")];
  const tagEl = document.getElementById("era-folio-tag");
  const titleEl = document.getElementById("era-stage-title");
  const noteEl = document.getElementById("era-stage-note");
  const svg = document.getElementById("era-svg");

  const ERAS = {
    brodovitch: {
      tag: "ARCHIVE FOLIO · 01 / 04 · 1934–1958",
      title: "跨页呼吸：从对称方框解放摄影",
      note: "Brodovitch 在 Harper's Bazaar 将左右两页视作一整张画布：照片冲破栏线跨过中缝，精致标题退入大片白色呼吸区，页面第一次有了电影般的动势。",
      svg: `
        <rect width="480" height="280" fill="#F4F9FD"/>
        <rect x="24" y="26" width="432" height="228" fill="#FFFFFF" stroke="#041536" stroke-width="1.5"/>
        <line x1="240" y1="26" x2="240" y2="254" stroke="#9BB6CE" stroke-dasharray="4 4"/>
        <polygon points="212,26 456,26 456,214 260,254 176,254" fill="#00337F"/>
        <circle cx="324" cy="134" r="76" fill="#0C9C9B" opacity="0.65"/>
        <circle cx="342" cy="146" r="56" fill="#020E28"/>
        <text x="38" y="64" fill="#041536" font-family="Instrument Serif, serif" font-style="italic" font-size="22">Harper's Bazaar</text>
        <rect x="38" y="194" width="104" height="5" fill="#041536"/>
        <rect x="38" y="206" width="84" height="4" fill="#5A7798"/>
        <rect x="38" y="216" width="92" height="4" fill="#5A7798"/>
        <text x="38" y="240" fill="#00449E" font-family="DM Mono, monospace" font-size="10">ASYMMETRIC SPREAD</text>
      `,
    },
    life: {
      tag: "ARCHIVE FOLIO · 02 / 04 · 1936 / 1952",
      title: "图片故事：单幅主照 + 精短图注协同",
      note: "1936 年《LIFE》创刊号封面与内页照片故事确立了「大图叙事 + 紧贴短注」的现代报道结构；Wilson Hicks（1952）将这种图文互补概括为新的视觉媒介。",
      svg: `
        <rect width="480" height="280" fill="#F4F9FD"/>
        <rect x="132" y="18" width="216" height="244" fill="#001959" stroke="#041536" stroke-width="1.5"/>
        <rect x="144" y="30" width="68" height="28" fill="#E22F16"/>
        <text x="155" y="50" fill="#FFFFFF" font-family="Unbounded, sans-serif" font-weight="800" font-size="15">LIFE</text>
        <rect x="156" y="72" width="168" height="148" fill="#0C9C9B" opacity="0.28"/>
        <rect x="166" y="88" width="24" height="132" fill="#D5E1EA"/>
        <rect x="204" y="88" width="24" height="132" fill="#B2CDE4"/>
        <rect x="242" y="88" width="24" height="132" fill="#77AEDF"/>
        <rect x="280" y="88" width="24" height="132" fill="#327BC7"/>
        <line x1="144" y1="234" x2="336" y2="234" stroke="#F8F026" stroke-width="1.5"/>
        <text x="144" y="249" fill="#E8F4FF" font-family="DM Mono, monospace" font-size="10">NOV 23, 1936 · PHOTO ESSAY</text>
      `,
    },
    fleckhaus: {
      tag: "ARCHIVE FOLIO · 03 / 04 · 1959–1971",
      title: "激进裁切：12 栏网格上的巨幅特写",
      note: "Willy Fleckhaus 在西德《twen》里把照片裁得极具压迫感，让人物或物象局部撑满整页，旁边以冷静的窄黑体大标和严密网格稳住秩序。",
      svg: `
        <rect width="480" height="280" fill="#F4F9FD"/>
        <rect x="24" y="24" width="432" height="232" fill="#FFFFFF" stroke="#041536" stroke-width="1.5"/>
        <g stroke="#D6E4F0" stroke-width="1">
          <line x1="60" y1="24" x2="60" y2="256"/><line x1="96" y1="24" x2="96" y2="256"/>
          <line x1="132" y1="24" x2="132" y2="256"/><line x1="168" y1="24" x2="168" y2="256"/>
          <line x1="204" y1="24" x2="204" y2="256"/><line x1="240" y1="24" x2="240" y2="256"/>
        </g>
        <clipPath id="tw-clip"><rect x="168" y="24" width="288" height="232"/></clipPath>
        <g clip-path="url(#tw-clip)">
          <rect x="168" y="24" width="288" height="232" fill="#001959"/>
          <circle cx="386" cy="146" r="154" fill="#00449E"/>
          <circle cx="404" cy="156" r="118" fill="#010612"/>
        </g>
        <text x="38" y="76" fill="#041536" font-family="Unbounded, sans-serif" font-weight="800" font-size="34">twen</text>
        <rect x="38" y="196" width="110" height="6" fill="#041536"/>
        <rect x="38" y="210" width="90" height="4" fill="#4A6888"/>
        <line x1="140" y1="198" x2="258" y2="144" stroke="#E22F16" stroke-width="1.6"/>
        <circle cx="258" cy="144" r="4" fill="#E22F16"/>
      `,
    },
    science: {
      tag: "ARCHIVE FOLIO · 04 / 04 · 1967 &amp; 2014",
      title: "认知底气：为什么先给图，再给注记",
      note: "Shepard（1967）的再认记忆曲线与 Potter 等（2014）的 13 ms RSVP 实验共同印证：强图像先完成瞬间语义锚定，随后再由细线注释接管深度阅读。",
      svg: `
        <rect width="480" height="280" fill="#F4F9FD"/>
        <rect x="24" y="24" width="432" height="232" fill="#031233"/>
        <text x="44" y="54" fill="#F8F026" font-family="DM Mono, monospace" font-size="11">SHEPARD 1967 · RECOGNITION (~600 ITEMS)</text>
        <text x="44" y="92" fill="#DCEFFC" font-size="12">图片</text>
        <rect x="92" y="78" width="320" height="18" fill="#0C9C9B"/>
        <text x="420" y="91" fill="#F8F026" font-family="DM Mono, monospace" font-size="12">98%</text>
        <text x="44" y="124" fill="#DCEFFC" font-size="12">单词</text>
        <rect x="92" y="110" width="294" height="18" fill="#327BC7"/>
        <text x="394" y="123" fill="#FFFFFF" font-family="DM Mono, monospace" font-size="12">90%</text>
        <text x="44" y="156" fill="#DCEFFC" font-size="12">句子</text>
        <rect x="92" y="142" width="286" height="18" fill="#1D4B8C"/>
        <text x="386" y="155" fill="#FFFFFF" font-family="DM Mono, monospace" font-size="12">88%</text>
        <line x1="44" y1="184" x2="436" y2="184" stroke="rgba(248,240,38,0.35)"/>
        <text x="44" y="210" fill="#F8F026" font-family="DM Mono, monospace" font-size="11">POTTER ET AL. 2014 · MIT RSVP</text>
        <text x="44" y="234" fill="#E8F4FF" font-size="13">单张画面仅闪现 13 ms，视觉皮层仍能高出随机地捕获概念意义。</text>
      `,
    },
  };

  function selectEra(key) {
    const e = ERAS[key];
    tagEl.innerHTML = e.tag;
    titleEl.textContent = e.title;
    noteEl.textContent = e.note;
    svg.innerHTML = e.svg;
    cards.forEach((c) => {
      const active = c.dataset.era === key;
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-selected", String(active));
    });
  }

  cards.forEach((c) => c.addEventListener("click", () => selectEra(c.dataset.era)));
  selectEra("brodovitch");
}

/* ==================== 05 · 什么时候别用（翻车 vs 改用对比卡） ==================== */
export function initDontUseCards() {
  const SVGS = {
    weak: {
      bad: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#DDE6EE"/><rect x="112" y="14" width="234" height="122" fill="#BAC8D4" stroke="#B51F0B" stroke-dasharray="4 3"/><text x="229" y="78" text-anchor="middle" fill="#4A5D72" font-size="12">低质平庸素材撑大 70%</text><rect x="14" y="20" width="84" height="14" fill="#041536"/><rect x="14" y="42" width="72" height="6" fill="#5D748E"/><rect x="14" y="114" width="86" height="20" fill="#B51F0B"/><text x="57" y="128" text-anchor="middle" fill="#FFFFFF" font-size="11">× 放大空洞</text></svg>`,
      good: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#031233"/><text x="20" y="64" fill="#FFFFFF" font-size="30" font-weight="900">用强标题撑场</text><rect x="20" y="80" width="60" height="3" fill="#F8F026"/><text x="20" y="106" fill="#C4E1F8" font-size="12">改用 142 大标题版式 / 141 文字主导</text><rect x="242" y="114" width="102" height="22" fill="#006B5E"/><text x="293" y="129" text-anchor="middle" fill="#FFFFFF" font-size="11">✓ 扬长避短</text></svg>`,
    },
    dense: {
      bad: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#002364"/><circle cx="242" cy="78" r="66" fill="#0A54B0"/><rect x="12" y="14" width="122" height="122" fill="rgba(255,255,255,0.92)" stroke="#B51F0B"/><text x="20" y="34" fill="#041536" font-size="10">参数A 12.4 / 参数B 9.8</text><text x="20" y="50" fill="#041536" font-size="10">条款1 / 条款2 / 条款3</text><text x="20" y="66" fill="#041536" font-size="10">费用 / 周期 / 违约金</text><rect x="18" y="106" width="106" height="20" fill="#B51F0B"/><text x="71" y="120" text-anchor="middle" fill="#FFFFFF" font-size="11">× 密字被挤爆</text></svg>`,
      good: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#F2F7FB"/><rect x="14" y="14" width="106" height="122" fill="#FFFFFF" stroke="#00337F"/><rect x="128" y="14" width="106" height="122" fill="#FFFFFF" stroke="#00337F"/><rect x="242" y="14" width="104" height="122" fill="#E3EEF6" stroke="#00337F"/><text x="67" y="42" text-anchor="middle" fill="#041536" font-size="11" font-weight="700">面板 A</text><text x="181" y="42" text-anchor="middle" fill="#041536" font-size="11" font-weight="700">面板 B</text><text x="294" y="42" text-anchor="middle" fill="#041536" font-size="11" font-weight="700">面板 C</text><rect x="22" y="58" width="90" height="6" fill="#8AA9C8"/><rect x="136" y="58" width="90" height="6" fill="#8AA9C8"/><rect x="250" y="58" width="88" height="6" fill="#00449E"/><rect x="242" y="110" width="104" height="22" fill="#006B5E"/><text x="294" y="125" text-anchor="middle" fill="#FFFFFF" font-size="11">✓ 多面板清晰</text></svg>`,
    },
    multi: {
      bad: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#001959"/><circle cx="220" cy="75" r="64" fill="#0C9C9B"/><rect x="16" y="20" width="94" height="36" fill="rgba(181,31,11,0.85)"/><text x="63" y="42" text-anchor="middle" fill="#FFFFFF" font-size="11">丢掉步骤 2/3/4</text><rect x="16" y="112" width="112" height="22" fill="#B51F0B"/><text x="72" y="127" text-anchor="middle" fill="#FFFFFF" font-size="11">× 单图讲不全</text></svg>`,
      good: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#EDF4FA"/><rect x="14" y="16" width="128" height="118" fill="#00337F"/><rect x="150" y="16" width="96" height="56" fill="#0C9C9B"/><rect x="150" y="78" width="96" height="56" fill="#0970C6"/><rect x="254" y="16" width="92" height="84" fill="#021238"/><rect x="254" y="108" width="92" height="26" fill="#006B5E"/><text x="300" y="125" text-anchor="middle" fill="#FFFFFF" font-size="11">✓ 拼贴叙事</text></svg>`,
    },
    noisy: {
      bad: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#0A3A7A"/><g opacity="0.72"><polygon points="0,0 140,150 0,150" fill="#DCE8F2"/><polygon points="90,0 240,150 160,150" fill="#F8F026"/><polygon points="200,0 360,120 260,150" fill="#E22F16"/></g><text x="20" y="64" fill="#FFFFFF" font-size="16" font-weight="700">高杂讯碎底上强叠长段说明</text><rect x="20" y="114" width="118" height="22" fill="#B51F0B"/><text x="79" y="129" text-anchor="middle" fill="#FFFFFF" font-size="11">× 文字读不清</text></svg>`,
      good: `<svg viewBox="0 0 360 150"><rect width="360" height="150" fill="#FFFFFF"/><rect x="14" y="14" width="332" height="72" fill="#00337F"/><polygon points="14,86 150,14 230,86" fill="#0C9C9B" opacity="0.7"/><rect x="14" y="96" width="218" height="12" fill="#041536"/><rect x="14" y="114" width="180" height="7" fill="#5D748E"/><rect x="244" y="108" width="102" height="24" fill="#006B5E"/><text x="295" y="124" text-anchor="middle" fill="#FFFFFF" font-size="11">✓ 图片窗分舱</text></svg>`,
    },
  };

  document.querySelectorAll(".dont-card").forEach((card) => {
    const key = card.dataset.case;
    const vis = card.querySelector(".dont-vis");
    const btn = card.querySelector(".flip-btn");
    let flipped = false;
    const draw = () => {
      vis.innerHTML = flipped ? SVGS[key].good : SVGS[key].bad;
      btn.setAttribute("aria-pressed", String(flipped));
      btn.textContent = flipped ? "回看翻车态" : "看改用方案";
    };
    btn.addEventListener("click", () => {
      flipped = !flipped;
      draw();
    });
    draw();
  });
}

/* ==================== 06 · 实战判断练习（单变量四选一，无剧透标签） ==================== */
export function initQuizLab() {
  const tabs = [...document.querySelectorAll(".quiz-tab")];
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");

  const QUESTIONS = {
    q1: {
      prompt: "以下四份建筑摄影展封面使用完全相同的题材、色彩与文案，每份只改变了一个版式变量。哪一份真正成立「图片主导版式」？点击卡片作答。",
      answer: "B",
      summaryRight: "答对了！方案 B 让主图以约 68% 的体量破右缘并配合冰川斜切，标题与两条零交叉黄引线安静退守负空间，在第一眼同时做到了「图像优先、裁切提气、焦点无遮挡」。",
      summaryWrong: "再对照看看四份方案各自唯一的变量差：A 缩成居中方框（36%）退化为图文均分；C 过度紧裁（92%）把主体轮廓切碎并挤死留白；D 虽然大图破边，却把正文压在了受光焦点上。只有方案 B 四项全成立。",
      options: [
        {
          id: "A",
          verdict: "主图缩在居中方框里只占 36%，下方文字与它五五平分，失去图像压倒性主导。",
          svg: `
            <svg viewBox="0 0 180 240">
              <rect width="180" height="240" fill="#03225E"/>
              <rect x="28" y="24" width="124" height="92" fill="#001440" stroke="#79B4E8" stroke-width="1"/>
              <circle cx="90" cy="70" r="34" fill="#2178D6"/>
              <circle cx="98" cy="76" r="24" fill="#020814"/>
              <rect x="28" y="134" width="118" height="14" fill="#FFFFFF"/>
              <rect x="28" y="156" width="124" height="7" fill="#B8D8F5"/>
              <rect x="28" y="168" width="110" height="7" fill="#B8D8F5"/>
              <rect x="28" y="180" width="96" height="7" fill="#B8D8F5"/>
              <circle cx="38" cy="212" r="7" fill="#E22F16"/>
            </svg>`,
        },
        {
          id: "B",
          verdict: "正解：主图占约 68% 破右缘且配冰川斜切，文字安守安静负空间，双引线零交叉。",
          svg: `
            <svg viewBox="0 0 180 240">
              <defs><linearGradient id="qb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0C9C9B"/><stop offset="55%" stop-color="#00337F"/><stop offset="100%" stop-color="#001447"/></linearGradient></defs>
              <rect width="180" height="240" fill="url(#qb)"/>
              <circle cx="122" cy="118" r="82" fill="#2178D6"/>
              <circle cx="136" cy="126" r="64" fill="#010712"/>
              <polygon points="62,240 180,104 180,240" fill="#C7D9E5"/>
              <rect x="14" y="16" width="78" height="13" fill="#FFFFFF"/>
              <rect x="14" y="34" width="52" height="5" fill="#CCF0F7"/>
              <rect x="14" y="74" width="38" height="6" fill="#FFFFFF"/>
              <rect x="14" y="84" width="32" height="4" fill="#B8D8F5"/>
              <line x1="54" y1="78" x2="72" y2="88" stroke="#F8F026" stroke-width="1.3" stroke-dasharray="3 2"/>
              <circle cx="72" cy="88" r="2.8" fill="#F8F026"/>
              <circle cx="48" cy="204" r="8" fill="#E22F16"/>
              <rect x="122" y="196" width="44" height="6" fill="#041536"/>
              <line x1="120" y1="198" x2="108" y2="186" stroke="#F8F026" stroke-width="1.3" stroke-dasharray="3 2"/>
              <circle cx="108" cy="186" r="2.8" fill="#F8F026"/>
            </svg>`,
        },
        {
          id: "C",
          verdict: "过度放大裁切（92%），球体轮廓被切碎到失去辨识，标题被迫挤在明暗边缘上。",
          svg: `
            <svg viewBox="0 0 180 240">
              <rect width="180" height="240" fill="#001959"/>
              <circle cx="152" cy="152" r="146" fill="#2178D6"/>
              <circle cx="166" cy="164" r="118" fill="#010712"/>
              <polygon points="10,240 180,44 180,240" fill="#C7D9E5"/>
              <rect x="14" y="18" width="94" height="13" fill="#FFFFFF"/>
              <rect x="14" y="36" width="60" height="5" fill="#FFFFFF"/>
              <rect x="14" y="84" width="48" height="6" fill="#FFFFFF"/>
              <circle cx="40" cy="204" r="8" fill="#E22F16"/>
            </svg>`,
        },
        {
          id: "D",
          verdict: "主图尺寸与裁切同 B，但文案块放大并压在了主图受光焦点上，直接遮碎视觉中心。",
          svg: `
            <svg viewBox="0 0 180 240">
              <defs><linearGradient id="qd" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0C9C9B"/><stop offset="55%" stop-color="#00337F"/><stop offset="100%" stop-color="#001447"/></linearGradient></defs>
              <rect width="180" height="240" fill="url(#qd)"/>
              <circle cx="122" cy="118" r="82" fill="#2178D6"/>
              <circle cx="136" cy="126" r="64" fill="#010712"/>
              <polygon points="62,240 180,104 180,240" fill="#C7D9E5"/>
              <rect x="14" y="16" width="78" height="13" fill="#FFFFFF"/>
              <rect x="44" y="82" width="96" height="54" fill="rgba(4,21,54,0.72)" stroke="#FFFFFF" stroke-width="0.8"/>
              <rect x="52" y="92" width="72" height="9" fill="#FFFFFF"/>
              <rect x="52" y="107" width="80" height="5" fill="#B8D8F5"/>
              <rect x="52" y="117" width="66" height="5" fill="#B8D8F5"/>
              <circle cx="48" cy="204" r="8" fill="#E22F16"/>
            </svg>`,
        },
      ],
    },
    q2: {
      prompt: "第二题：同一张机械表盘特写跨页，四份方案仅改变注释与引线的组织方式。哪一份最忠实于「注释引导」层级原则？",
      answer: "C",
      summaryRight: "答对了！方案 C 让三组注释各自退守安静负空间，柠檬黄实/虚引线零交叉精准点向表圈、游丝与斜切刃，图不被遮、眼不绕路。",
      summaryWrong: "对比单变量：A 两条黄引线跨过主图交叉打结；B 取消引线把三段注记堆在底栏，图文对应断裂；D 把标签胶囊直接糊在表盘机芯正中。只有方案 C 同时做到零遮挡与零交叉。",
      options: [
        {
          id: "A",
          verdict: "两条黄色注释引线跨过主图交叉打结，视线在半路撞车，难以分辨对应关系。",
          svg: `
            <svg viewBox="0 0 180 240">
              <rect width="180" height="240" fill="#031B52"/>
              <circle cx="118" cy="118" r="76" fill="#0D4B9C"/>
              <circle cx="118" cy="118" r="60" fill="#020B22" stroke="#7FC2FA" stroke-width="1"/>
              <rect x="14" y="18" width="66" height="11" fill="#FFFFFF"/>
              <rect x="12" y="64" width="38" height="16" fill="rgba(255,255,255,0.12)" stroke="#F8F026" stroke-width="0.8"/>
              <rect x="12" y="168" width="38" height="16" fill="rgba(255,255,255,0.12)" stroke="#F8F026" stroke-width="0.8"/>
              <line x1="50" y1="72" x2="104" y2="162" stroke="#F8F026" stroke-width="1.4"/>
              <line x1="50" y1="176" x2="96" y2="78" stroke="#F8F026" stroke-width="1.4"/>
              <circle cx="104" cy="162" r="3" fill="#F8F026"/>
              <circle cx="96" cy="78" r="3" fill="#F8F026"/>
            </svg>`,
        },
        {
          id: "B",
          verdict: "取消全部引线并将三段说明平摊在底边，视觉锚点与文字说明彻底割裂。",
          svg: `
            <svg viewBox="0 0 180 240">
              <rect width="180" height="240" fill="#031B52"/>
              <circle cx="118" cy="108" r="76" fill="#0D4B9C"/>
              <circle cx="118" cy="108" r="60" fill="#020B22" stroke="#7FC2FA" stroke-width="1"/>
              <rect x="14" y="18" width="66" height="11" fill="#FFFFFF"/>
              <rect x="12" y="196" width="46" height="26" fill="rgba(255,255,255,0.14)"/>
              <rect x="66" y="196" width="46" height="26" fill="rgba(255,255,255,0.14)"/>
              <rect x="120" y="196" width="46" height="26" fill="rgba(255,255,255,0.14)"/>
            </svg>`,
        },
        {
          id: "C",
          verdict: "正解：注释退守四角负空间，实线与虚线零交叉精准锚定核心结构边缘。",
          svg: `
            <svg viewBox="0 0 180 240">
              <rect width="180" height="240" fill="#031B52"/>
              <circle cx="118" cy="118" r="76" fill="#0D4B9C"/>
              <circle cx="118" cy="118" r="60" fill="#020B22" stroke="#7FC2FA" stroke-width="1"/>
              <polygon points="74,240 180,122 180,240" fill="#C7D9E5"/>
              <rect x="14" y="18" width="66" height="11" fill="#FFFFFF"/>
              <rect x="12" y="68" width="34" height="14" fill="rgba(255,255,255,0.12)"/>
              <line x1="46" y1="75" x2="72" y2="86" stroke="#F8F026" stroke-width="1.3" stroke-dasharray="3 2"/>
              <circle cx="72" cy="86" r="3" fill="#F8F026"/>
              <rect x="12" y="168" width="34" height="14" fill="rgba(255,255,255,0.12)"/>
              <line x1="46" y1="175" x2="62" y2="196" stroke="#F8F026" stroke-width="1.3"/>
              <circle cx="62" cy="196" r="3" fill="#F8F026"/>
              <circle cx="72" cy="202" r="7" fill="#E22F16"/>
              <rect x="126" y="198" width="38" height="12" fill="#041536"/>
              <line x1="124" y1="202" x2="112" y2="188" stroke="#F8F026" stroke-width="1.3" stroke-dasharray="3 2"/>
              <circle cx="112" cy="188" r="3" fill="#F8F026"/>
            </svg>`,
        },
        {
          id: "D",
          verdict: "三枚色底标签直接贴在表盘正中，盖住机芯结构，把图片主导降级成了贴纸墙。",
          svg: `
            <svg viewBox="0 0 180 240">
              <rect width="180" height="240" fill="#031B52"/>
              <circle cx="118" cy="118" r="76" fill="#0D4B9C"/>
              <circle cx="118" cy="118" r="60" fill="#020B22" stroke="#7FC2FA" stroke-width="1"/>
              <rect x="14" y="18" width="66" height="11" fill="#FFFFFF"/>
              <rect x="74" y="76" width="54" height="16" fill="#F8F026"/>
              <rect x="92" y="112" width="56" height="16" fill="#F8F026"/>
              <rect x="68" y="148" width="52" height="16" fill="#F8F026"/>
            </svg>`,
        },
      ],
    },
  };

  let activeQ = "q1";
  let picked = { q1: null, q2: null };

  function render() {
    const q = QUESTIONS[activeQ];
    const choice = picked[activeQ];
    promptEl.textContent = q.prompt;
    grid.innerHTML = "";

    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      btn.dataset.opt = opt.id;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(choice === opt.id));
      if (choice) {
        if (opt.id === q.answer) btn.classList.add("is-right");
        else if (opt.id === choice) btn.classList.add("is-wrong");
      }
      btn.innerHTML = `
        <div class="quiz-opt-head">
          <span>方案 ${opt.id}</span>
          <span>${choice ? (opt.id === q.answer ? "✓ 正解" : opt.id === choice ? "× 已选" : "") : "点击判图"}</span>
        </div>
        ${opt.svg}
        <div class="quiz-opt-verdict">${choice ? opt.verdict : ""}</div>
      `;
      btn.addEventListener("click", () => {
        picked[activeQ] = opt.id;
        render();
      });
      grid.appendChild(btn);
    }

    feedback.classList.remove("is-right", "is-wrong");
    if (!choice) {
      feedback.textContent = "请选择上方方案 A / B / C / D 中的一项，查看四份方案各自的单变量成败拆解。";
    } else if (choice === q.answer) {
      feedback.classList.add("is-right");
      feedback.textContent = q.summaryRight;
    } else {
      feedback.classList.add("is-wrong");
      feedback.textContent = q.summaryWrong;
    }
  }

  tabs.forEach((t) => t.addEventListener("click", () => {
    activeQ = t.dataset.quiz;
    tabs.forEach((x) => {
      const on = x === t;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-selected", String(on));
    });
    render();
  }));

  render();
}
