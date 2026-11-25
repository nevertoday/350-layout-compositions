// 313 横向调度 · 正文各节差异化互动实验模块（01–08 节）
// 每节独立控件，零重复形态，单一数据驱动画面与读数。

import { pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

/* --------------------------------------------------------------------------
 * 01 节：画幅遮幅拉帘对比（1.33:1 → 1.85:1 → 2.35:1 → 2.55:1）
 * -------------------------------------------------------------------------- */
export function initAspectCurtainLab() {
  const canvas = document.getElementById("lab-aspect-canvas");
  const slider = document.getElementById("lab-aspect-range");
  const readout = document.getElementById("lab-aspect-readout");
  const verdict = document.getElementById("lab-aspect-verdict");
  const btns = [...document.querySelectorAll("[data-aspect-preset]")];
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  // 车站长廊里沿水平线分布的 4 位人物（相对 2.55:1 宽幅的坐标）
  const figures = [
    { x: 0.13, label: "①", color: PALETTE.gold, dir: 1 },
    { x: 0.31, label: "②", color: PALETTE.sand, dir: 1 },
    { x: 0.62, label: "③", color: PALETTE.steelMid, dir: 1 },
    { x: 0.87, label: "④", color: PALETTE.charcoal, dir: -1 },
  ];

  function draw() {
    const ratio = parseFloat(slider.value); // 1.33 .. 2.55
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width || 640));
    const h = Math.max(160, Math.round(rect.height || 240));
    const dpr = pixelRatio(2);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 底景：完整的 2.55:1 车站长廊
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 远景建筑长廊柱网与地平带
    const roofY = Math.round(h * 0.22);
    const floorY = Math.round(h * 0.64);
    ctx.fillStyle = PALETTE.linenPanel;
    ctx.fillRect(0, roofY, w, floorY - roofY);
    ctx.fillStyle = PALETTE.steel;
    ctx.fillRect(0, floorY, w, h - floorY);

    // 细长水平檐口线
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, roofY); ctx.lineTo(w, roofY);
    ctx.stroke();

    // 柱网
    ctx.strokeStyle = "rgba(27, 34, 31, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const cx = (w / 10) * i;
      ctx.beginPath();
      ctx.moveTo(cx, roofY);
      ctx.lineTo(cx, floorY);
      ctx.stroke();
    }

    // 可见画幅窗（基于 2.55:1 为 100% 宽度）
    const visFrac = ratio / 2.55;
    const visW = w * visFrac;
    const curtainW = (w - visW) / 2;
    const minVisible = curtainW / w;
    const maxVisible = 1 - minVisible;

    // 绘制 4 位人物剪影（零五官）
    let kept = 0;
    const cutList = [];
    for (const f of figures) {
      const inside = f.x >= minVisible + 0.035 && f.x <= maxVisible - 0.035;
      if (inside) kept++;
      else cutList.push(f.label);

      const px = f.x * w;
      const py = floorY;
      ctx.save();
      ctx.globalAlpha = inside ? 1 : 0.28;
      // 身体
      ctx.fillStyle = PALETTE.charcoal;
      ctx.fillRect(px - 8, py - 46, 16, 46);
      // 识别色带
      ctx.fillStyle = f.color;
      ctx.fillRect(px - 6, py - 38, 12, 10);
      // 无五官圆头 + 朝向小檐
      ctx.fillStyle = PALETTE.charcoal;
      ctx.beginPath();
      ctx.arc(px, py - 56, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.color === PALETTE.charcoal ? PALETTE.paperLight : f.color;
      ctx.beginPath();
      ctx.moveTo(px + f.dir * 3, py - 60);
      ctx.lineTo(px + f.dir * 12, py - 57);
      ctx.lineTo(px + f.dir * 5, py - 54);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 两侧对称遮幅幕布
    if (curtainW > 1) {
      ctx.fillStyle = "rgba(24, 35, 46, 0.86)";
      ctx.fillRect(0, 0, curtainW, h);
      ctx.fillRect(w - curtainW, 0, curtainW, h);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curtainW, 0); ctx.lineTo(curtainW, h);
      ctx.moveTo(w - curtainW, 0); ctx.lineTo(w - curtainW, h);
      ctx.stroke();
    }

    // 顶部画幅比例标注
    ctx.font = `700 11px "Space Mono", monospace`;
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${ratio.toFixed(2)}:1 · 视野覆盖 ${Math.round(visFrac * 100)}%`, w / 2, roofY * 0.52);

    ctx.restore();

    if (readout) {
      readout.textContent = `${ratio.toFixed(2)}:1 · 保留 ${kept}/4 位主体`;
    }
    if (verdict) {
      if (ratio < 1.55) {
        verdict.textContent = `学院窄幅（${ratio.toFixed(2)}:1）只容得下中间 2 位，外侧 ${cutList.join("、")} 号直接被幕布切出画外——这就是为什么 4:3 时代很难大面积铺开横向群像。`;
      } else if (ratio < 2.05) {
        verdict.textContent = `标准宽幅（${ratio.toFixed(2)}:1）放进了大部分长廊，但最外侧主体仍贴着边缘或被切边，横向呼吸感还差一口气。`;
      } else if (ratio < 2.42) {
        verdict.textContent = `现代变形宽银幕（${ratio.toFixed(2)}:1，近似早期 2.35:1 光学声道标准）把 4 位主体全收入同一条地平线，留白与人物关系一眼读清。`;
      } else {
        verdict.textContent = `1953 年《圣袍千秋》原初四轨磁声 CinemaScope 尺度（${ratio.toFixed(2)}:1）：左右余地彻底打开，地平线像展卷一样向两端延展。`;
      }
    }

    btns.forEach((b) => {
      const target = parseFloat(b.dataset.aspectPreset);
      b.setAttribute("aria-pressed", String(Math.abs(target - ratio) < 0.03));
    });
  }

  slider.addEventListener("input", draw);
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      slider.value = b.dataset.aspectPreset;
      draw();
    });
  });
  window.addEventListener("resize", draw);
  draw();
}

/* --------------------------------------------------------------------------
 * 02 节：12 格水平音序节奏编排槽（破解「晾衣绳」均分）
 * -------------------------------------------------------------------------- */
export function initRhythmSequencerLab() {
  const slotsWrap = document.getElementById("rhythm-slots");
  const svg = document.getElementById("rhythm-wave-svg");
  const statusEl = document.getElementById("rhythm-status");
  const detailEl = document.getElementById("rhythm-detail");
  const presetBtns = [...document.querySelectorAll("[data-rhythm-preset]")];
  if (!slotsWrap || !svg) return;

  const PRESETS = {
    clothesline: [1, 4, 7, 10], // 间距 3-3-3 晾衣绳
    group211:    [1, 3, 7, 10], // 2+1+1 对话分组
    isolate13:   [1, 7, 9, 11], // 1+3 孤立对峙
  };

  // 开场刻意停在「晾衣绳 3-3-3」让读者一进来就看到机械等距的死板波形
  let active = [...PRESETS.clothesline];

  function render() {
    active.sort((a, b) => a - b);
    const buttons = [...slotsWrap.querySelectorAll("button")];
    buttons.forEach((btn, idx) => {
      const pos = idx + 1;
      const order = active.indexOf(pos);
      const isOn = order >= 0;
      btn.setAttribute("aria-pressed", String(isOn));
      btn.classList.toggle("is-on", isOn);
      btn.dataset.rank = isOn ? String(order + 1) : "";
      const dot = btn.querySelector(".slot-mark");
      if (dot) dot.textContent = isOn ? `0${order + 1}` : "·";
    });

    // 计算 3 段间隔
    const gaps = [active[1] - active[0], active[2] - active[1], active[3] - active[2]];
    const span = active[3] - active[0];
    const minG = Math.min(...gaps);
    const maxG = Math.max(...gaps);
    const meanG = span / 3;
    const std = Math.sqrt(gaps.reduce((s, g) => s + (g - meanG) ** 2, 0) / 3);
    const cv = meanG > 0 ? std / meanG : 0;

    // 渲染节奏波形与角色落点 SVG（viewBox 640×120）
    const xs = active.map((p) => 34 + ((p - 1) / 11) * 572);
    const colors = [PALETTE.goldDarkBg, PALETTE.sand, "#8FB1CC", PALETTE.paperLight];

    let arcs = "";
    for (let i = 0; i < 3; i++) {
      const mx = (xs[i] + xs[i + 1]) / 2;
      const arcH = Math.min(48, 12 + gaps[i] * 7);
      const stroke = cv < 0.14 ? PALETTE.alertDarkBg : PALETTE.goldDarkBg;
      arcs += `<path d="M ${xs[i]} 78 Q ${mx} ${78 - arcH} ${xs[i + 1]} 78" fill="none" stroke="${stroke}" stroke-width="2" stroke-dasharray="${cv < 0.14 ? "4 4" : "none"}" />`;
      arcs += `<text x="${mx}" y="${72 - arcH * 0.55}" text-anchor="middle" fill="${PALETTE.paperLight}" font-family="Space Mono, monospace" font-size="11">${gaps[i]}拍</text>`;
    }

    let nodes = "";
    xs.forEach((x, i) => {
      nodes += `<line x1="${x}" y1="78" x2="${x}" y2="96" stroke="${colors[i]}" stroke-width="2" />`;
      nodes += `<rect x="${x - 10}" y="68" width="20" height="20" fill="${colors[i]}" />`;
      nodes += `<text x="${x}" y="82" text-anchor="middle" fill="${PALETTE.darkOcean}" font-family="Space Mono, monospace" font-size="10" font-weight="700">0${i + 1}</text>`;
    });

    svg.innerHTML = `
      <line x1="20" y1="78" x2="620" y2="78" stroke="rgba(238,231,220,0.28)" stroke-width="1" />
      ${arcs}
      ${nodes}
    `;

    // 诊断读数
    if (minG === 1 && span <= 4) {
      statusEl.textContent = `挤成一团（间隔 ${gaps.join("-")}）`;
      statusEl.dataset.tone = "warn";
      detailEl.textContent = "四个拍点紧紧挨在一起，右侧大半条轨道空成空白——先点亮靠右的空格，把总跨度拉出来。";
    } else if (cv < 0.14) {
      statusEl.textContent = `晾衣绳均分（间隔 ${gaps.join("-")} · 零起伏）`;
      statusEl.dataset.tone = "warn";
      detailEl.textContent = "三段间隔几乎完全相等，眼睛扫过去像在数栏杆，分不出谁和谁是一伙。把其中两位挪近 1 格，立刻会出现关系与呼吸。";
    } else if (maxG >= 6) {
      statusEl.textContent = `一强三弱 / 孤立对峙（间隔 ${gaps.join("-")}）`;
      statusEl.dataset.tone = "ok";
      detailEl.textContent = "超宽的停顿带把单人与群组切开——黑泽明在《天国与地狱》里常用这种「1 对多」横向留白制造道德孤立感。";
    } else {
      statusEl.textContent = `疏密有度（间隔 ${gaps.join("-")} · 呼吸感成立）`;
      statusEl.dataset.tone = "ok";
      detailEl.textContent = "既有成对靠近的紧凑对话节拍，也有舒展的宽幅过渡留白；视线沿横轴走完时，天然会停顿、加速再收尾。";
    }

    presetBtns.forEach((b) => {
      const key = b.dataset.rhythmPreset;
      const same = PRESETS[key].every((v, i) => v === active[i]);
      b.setAttribute("aria-pressed", String(same));
    });
  }

  // 构建 12 枚拍点槽
  slotsWrap.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seq-slot";
    btn.dataset.slot = String(i);
    btn.setAttribute("aria-label", `第 ${i} 拍`);
    btn.innerHTML = `<span class="slot-num">${String(i).padStart(2, "0")}</span><span class="slot-mark">·</span>`;
    btn.addEventListener("click", () => {
      const idx = active.indexOf(i);
      if (idx >= 0) {
        // 已亮则把这一拍往相邻空格轻移（始终保持 4 个角色在场上）
        for (let d = 1; d <= 11; d++) {
          if (i + d <= 12 && !active.includes(i + d)) { active[idx] = i + d; break; }
          if (i - d >= 1 && !active.includes(i - d)) { active[idx] = i - d; break; }
        }
      } else {
        // 点空格时把离它最近的那个角色移到这一拍
        let nearIdx = 0;
        let nearDist = Infinity;
        active.forEach((v, k) => {
          const dist = Math.abs(v - i);
          if (dist < nearDist) { nearDist = dist; nearIdx = k; }
        });
        active[nearIdx] = i;
      }
      render();
    });
    slotsWrap.appendChild(btn);
  }

  presetBtns.forEach((b) => {
    b.addEventListener("click", () => {
      active = [...PRESETS[b.dataset.rhythmPreset]];
      render();
    });
  });

  render();
}

/* --------------------------------------------------------------------------
 * 03 节：视线引导、朝向与前导留白点击器
 * -------------------------------------------------------------------------- */
export function initSightlineLab() {
  const svg = document.getElementById("sightline-svg");
  const titleEl = document.getElementById("sightline-title");
  const bodyEl = document.getElementById("sightline-body");
  const btns = [...document.querySelectorAll("[data-sight-idx]")];
  const leadBtn = document.getElementById("sightline-lead-btn");
  if (!svg || !btns.length) return;

  // 初始状态：末位紧贴右缘且朝右看画外（演示「漏出画框」）
  const dirs = [1, 1, 1];
  let wideLead = false;

  function render() {
    const xs = wideLead ? [110, 290, 445] : [130, 330, 565];
    const labels = ["① 起点", "② 中继", "③ 终点"];
    const colors = [PALETTE.gold, PALETTE.steelMid, PALETTE.charcoal];

    // 判定视流
    let stateTitle = "";
    let stateBody = "";
    let flowColor = PALETTE.gold;

    if (dirs[0] === 1 && dirs[1] === 1 && dirs[2] === -1) {
      stateTitle = "右流 + 末位回望收口：视线稳稳留在画框里";
      stateBody = "① 与 ② 顺畅把视线引向右侧，③ 微微向左回看，像一道温柔的弧墙把目光弹回画面中段，既流动又不漏气。";
      flowColor = PALETTE.ok;
    } else if (dirs[0] === 1 && dirs[1] === 1 && dirs[2] === 1) {
      if (wideLead) {
        stateTitle = "一致右流 + 充裕前导留白：视线有去处";
        stateBody = "三人全部向右，但 ③ 前方留出了约 30% 的开阔前导空间（Lead Room），观众会自然想象前方走廊正在延伸。";
        flowColor = PALETTE.ok;
      } else {
        stateTitle = "末位贴边盯画外：视线顺着右框滑出去了";
        stateBody = "③ 紧挨右框（前导空间不足 10%）还继续朝右看，观众目光刚到位就撞墙滑出画面。点「③ 终点」让它回望，或打开前导留白。";
        flowColor = PALETTE.alert;
      }
    } else if (dirs[0] === -1 && dirs[1] === -1 && dirs[2] === 1) {
      stateTitle = "两头外泄：首尾各看各的画外";
      stateBody = "左侧往左出画、右侧往右出画，整幅画面被从中间往两头扯散。";
      flowColor = PALETTE.alert;
    } else if (dirs[0] === -1 && dirs[1] === -1 && dirs[2] === -1) {
      stateTitle = "统一向左逆流（手卷 / 回溯语境）";
      stateBody = "三人统一自右向左引导，类似传统手卷展阅或电影里的逆向回溯——方向一致依然连贯，但需给最左端留出足够前导空间。";
      flowColor = PALETTE.steelDeep;
    } else {
      stateTitle = "中段朝向互撞：水平视流被打断";
      stateBody = "相邻人物的目光顶在一起或背道而驰，眼睛在画面中段来回打转，失去了横向阅读的顺畅感。";
      flowColor = PALETTE.alert;
    }

    let cones = "";
    let figs = "";
    xs.forEach((x, i) => {
      const d = dirs[i];
      const endX = x + d * 110;
      cones += `<polygon points="${x + d * 8},84 ${endX},56 ${endX},112" fill="${i === 0 ? "rgba(205,150,57,0.24)" : "rgba(76,106,132,0.22)"}" />`;
      // 极简无五官人物侧影
      figs += `
        <g transform="translate(${x}, 148)">
          <ellipse cx="0" cy="4" rx="18" ry="4" fill="rgba(27,34,31,0.18)" />
          <path d="M -11 -52 L 11 -52 L 14 0 L -14 0 Z" fill="${PALETTE.charcoal}" />
          <rect x="-8" y="-44" width="16" height="12" fill="${colors[i]}" />
          <circle cx="0" cy="-64" r="10" fill="${PALETTE.charcoal}" />
          <polygon points="${d * 4},-70 ${d * 16},-66 ${d * 6},-62" fill="${colors[i] === PALETTE.charcoal ? PALETTE.paperLight : colors[i]}" />
          <text x="0" y="24" text-anchor="middle" fill="${PALETTE.ink}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600">${labels[i]} ${d > 0 ? "→" : "←"}</text>
        </g>
      `;
    });

    // 末位漏出画外提示线
    const leakRight = dirs[2] === 1 && !wideLead;
    const leakMark = leakRight
      ? `<line x1="${xs[2] + 12}" y1="84" x2="636" y2="84" stroke="${PALETTE.alert}" stroke-width="2.5" stroke-dasharray="5 4" />
         <text x="595" y="42" text-anchor="middle" fill="${PALETTE.alert}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">撞框外泄</text>`
      : "";

    // 前导留白标注
    const leadMark = wideLead
      ? `<rect x="475" y="28" width="148" height="122" fill="rgba(43,107,86,0.08)" stroke="${PALETTE.ok}" stroke-dasharray="4 4" />
         <text x="549" y="46" text-anchor="middle" fill="${PALETTE.ok}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">前导留白 ~30%</text>`
      : "";

    svg.innerHTML = `
      <rect x="0" y="0" width="640" height="190" fill="${PALETTE.paperLight}" />
      <rect x="0" y="148" width="640" height="42" fill="${PALETTE.sand}" />
      <line x1="0" y1="148" x2="640" y2="148" stroke="${PALETTE.steel}" stroke-width="2" />
      ${leadMark}
      ${cones}
      ${leakMark}
      ${figs}
      <line x1="18" y1="20" x2="622" y2="20" stroke="${flowColor}" stroke-width="2" stroke-dasharray="6 4" />
    `;

    titleEl.textContent = stateTitle;
    titleEl.style.color = flowColor;
    bodyEl.textContent = stateBody;

    btns.forEach((b, i) => {
      b.textContent = `${labels[i]}：${dirs[i] > 0 ? "朝右 →" : "朝左 ←"}`;
      b.setAttribute("aria-pressed", String(dirs[i] < 0));
    });
    if (leadBtn) {
      leadBtn.textContent = wideLead ? "前导留白：充裕（30%）" : "前导留白：紧贴右框（10%）";
      leadBtn.setAttribute("aria-pressed", String(wideLead));
    }
  }

  btns.forEach((b, i) => {
    b.addEventListener("click", () => {
      dirs[i] = -dirs[i];
      render();
    });
  });
  if (leadBtn) {
    leadBtn.addEventListener("click", () => {
      wideLead = !wideLead;
      render();
    });
  }
  render();
}

/* --------------------------------------------------------------------------
 * 04 节：从手卷到宽银幕（容器内横向长卷展阅 + 画幅尺度条）
 * -------------------------------------------------------------------------- */
export function initHistoryScrollLab() {
  const rail = document.getElementById("history-rail");
  const prevBtn = document.getElementById("history-prev");
  const nextBtn = document.getElementById("history-next");
  const cards = [...document.querySelectorAll(".history-card")];
  const barFill = document.getElementById("history-scale-fill");
  const barLabel = document.getElementById("history-scale-label");
  if (!rail || !cards.length) return;

  let activeIdx = 0;

  function selectCard(idx, scrollInto = true) {
    activeIdx = Math.max(0, Math.min(cards.length - 1, idx));
    cards.forEach((c, i) => {
      const on = i === activeIdx;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-current", on ? "true" : "false");
    });
    const cur = cards[activeIdx];
    if (barFill && barLabel) {
      barFill.style.width = `${cur.dataset.scalePct || "40"}%`;
      barLabel.textContent = cur.dataset.scaleNote || "";
    }
    if (prevBtn) prevBtn.disabled = activeIdx === 0;
    if (nextBtn) nextBtn.disabled = activeIdx === cards.length - 1;
    if (scrollInto) {
      const targetLeft = cur.offsetLeft - 16;
      rail.scrollLeft = Math.max(0, targetLeft);
    }
  }

  cards.forEach((c, i) => {
    c.addEventListener("click", () => selectCard(i, true));
  });
  if (prevBtn) prevBtn.addEventListener("click", () => selectCard(activeIdx - 1, true));
  if (nextBtn) nextBtn.addEventListener("click", () => selectCard(activeIdx + 1, true));

  selectCard(0, false);
}

/* --------------------------------------------------------------------------
 * 05 节：同小类五种调度法对比（310 / 311 / 312 / 313 / 314）
 * -------------------------------------------------------------------------- */
export function initSiblingsLab() {
  const btns = [...document.querySelectorAll("[data-sibling]")];
  const svg = document.getElementById("siblings-svg");
  const nameEl = document.getElementById("siblings-name");
  const descEl = document.getElementById("siblings-desc");
  const linkEl = document.getElementById("siblings-link");
  if (!btns.length || !svg) return;

  const DATA = {
    "310": {
      name: "310 深度调度 · 沿 Z 轴推开前中后三层",
      desc: "把三人拉开纵深距离，近大远小，靠镜头深景深把关系压缩进一条前中后走廊。",
      href: "https://layout.xiaoxiaodong.ai/310/play/",
      linkText: "去看 310 深度调度互动版 →",
      draw: () => `
        <line x1="20" y1="138" x2="260" y2="96" stroke="rgba(238,231,220,0.28)" stroke-dasharray="4 4"/>
        <line x1="480" y1="138" x2="260" y2="96" stroke="rgba(238,231,220,0.28)" stroke-dasharray="4 4"/>
        <circle cx="260" cy="86" r="10" fill="${PALETTE.sand}"/>
        <circle cx="195" cy="108" r="16" fill="${PALETTE.steel}"/>
        <circle cx="118" cy="134" r="24" fill="${PALETTE.goldDarkBg}"/>
        <text x="118" y="176" text-anchor="middle" fill="${PALETTE.paperLight}" font-size="11">前景（近大）</text>
        <text x="260" y="64" text-anchor="middle" fill="${PALETTE.paperLight}" font-size="11">后景（远小）</text>
      `,
    },
    "311": {
      name: "311 平面调度 · 垂直正拍压平空间",
      desc: "机位严格垂直墙面，消除透视斜线，把画面当成一张讲究对齐与视觉配重的平面构成。",
      href: "https://layout.xiaoxiaodong.ai/311/play/",
      linkText: "去看 311 平面调度互动版 →",
      draw: () => `
        <rect x="88" y="34" width="324" height="128" fill="none" stroke="rgba(238,231,220,0.45)" stroke-width="1.5"/>
        <rect x="130" y="54" width="108" height="88" fill="${PALETTE.steel}"/>
        <circle cx="316" cy="98" r="34" fill="${PALETTE.goldDarkBg}"/>
        <rect x="218" y="88" width="90" height="18" fill="${PALETTE.sand}"/>
        <text x="250" y="180" text-anchor="middle" fill="${PALETTE.paperLight}" font-size="11">0° 正拍立面 · 二维图形平衡</text>
      `,
    },
    "312": {
      name: "312 三角调度 · 高低与斜线锁住顶点主角",
      desc: "把三人摆出明显的高低错落，左右斜线向上或向下汇聚到一个尖点，第一时间点出谁是中心。",
      href: "https://layout.xiaoxiaodong.ai/312/play/",
      linkText: "去看 312 三角调度互动版 →",
      draw: () => `
        <polygon points="250,40 120,148 380,148" fill="rgba(228,179,86,0.14)" stroke="${PALETTE.goldDarkBg}" stroke-width="2" stroke-dasharray="5 4"/>
        <circle cx="250" cy="40" r="18" fill="${PALETTE.goldDarkBg}"/>
        <circle cx="120" cy="148" r="15" fill="${PALETTE.sand}"/>
        <circle cx="380" cy="148" r="15" fill="${PALETTE.steel}"/>
        <text x="250" y="180" text-anchor="middle" fill="${PALETTE.paperLight}" font-size="11">斜边汇聚顶点 · 突出层级焦点</text>
      `,
    },
    "313": {
      name: "313 横向调度（本页）· 水平延展与流动节奏",
      desc: "共享一条稳定地平线，借宽幅视野、一致朝向与疏密分组引导视线自一端顺畅流向另一端。",
      href: "",
      linkText: "当前正在学习本页",
      draw: () => `
        <line x1="24" y1="104" x2="476" y2="104" stroke="${PALETTE.goldDarkBg}" stroke-width="2" stroke-dasharray="6 4"/>
        <circle cx="78" cy="104" r="18" fill="${PALETTE.goldDarkBg}"/>
        <rect x="148" y="88" width="46" height="32" fill="${PALETTE.sand}"/>
        <rect x="278" y="88" width="60" height="32" fill="${PALETTE.steel}"/>
        <rect x="394" y="88" width="46" height="32" fill="${PALETTE.paperLight}"/>
        <path d="M 102 68 L 418 68" stroke="${PALETTE.goldDarkBg}" stroke-width="2"/>
        <polygon points="424,68 414,62 414,74" fill="${PALETTE.goldDarkBg}"/>
        <text x="250" y="176" text-anchor="middle" fill="${PALETTE.paperLight}" font-size="11">同轴水平展开 · 疏密分组 · 横向视流</text>
      `,
    },
    "314": {
      name: "314 多层前景调度 · 门框遮挡造画中画",
      desc: "故意在镜头最贴近处放进门框、窗格或植物剪影做前景遮罩，制造窥视感与多重空间嵌套。",
      href: "https://layout.xiaoxiaodong.ai/314/play/",
      linkText: "去看 314 多层前景调度互动版 →",
      draw: () => `
        <rect x="20" y="20" width="96" height="156" fill="${PALETTE.darkOcean}"/>
        <rect x="384" y="20" width="96" height="156" fill="${PALETTE.darkOcean}"/>
        <rect x="20" y="20" width="460" height="24" fill="${PALETTE.darkOcean}"/>
        <circle cx="215" cy="108" r="16" fill="${PALETTE.goldDarkBg}"/>
        <circle cx="295" cy="112" r="14" fill="${PALETTE.sand}"/>
        <text x="250" y="182" text-anchor="middle" fill="${PALETTE.paperLight}" font-size="11">暗前景框架遮挡 · 锁定窥视窗口</text>
      `,
    },
  };

  function select(id) {
    const d = DATA[id];
    if (!d) return;
    svg.innerHTML = `<rect x="0" y="0" width="500" height="196" fill="rgba(24,35,46,0.55)" />` + d.draw();
    nameEl.textContent = d.name;
    descEl.textContent = d.desc;
    if (d.href) {
      linkEl.href = d.href;
      linkEl.textContent = d.linkText;
      linkEl.hidden = false;
    } else {
      linkEl.hidden = true;
    }
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sibling === id)));
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.sibling)));
  select("313");
}

/* --------------------------------------------------------------------------
 * 06 节：什么时候别用 · 2.39:1 宽银幕 vs 9:16 竖屏硬裁崩坏模拟
 * -------------------------------------------------------------------------- */
export function initVerticalCrashLab() {
  const btns = [...document.querySelectorAll("[data-crash-mode]")];
  const frame = document.getElementById("crash-frame");
  const note = document.getElementById("crash-note");
  if (!btns.length || !frame) return;

  const NOTES = {
    wide: "2.39:1 宽银幕：4 位人物在一条水平走廊里完整呼吸，关系与走向清晰自然。",
    crop: "9:16 竖屏硬裁：横向调度被直接砍掉三分之二，外侧两人彻底消失，只剩中间半截肩膀。",
    letterbox: "9:16 强塞黑边条：为了保住全部 4 人，整幅画面被缩成屏幕中央一条 20% 高的细缝，上下全是无意义的黑块。",
  };

  function setMode(mode) {
    frame.dataset.mode = mode;
    if (note) note.textContent = NOTES[mode] || "";
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.crashMode === mode)));
  }

  btns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.crashMode)));
  setMode("wide");
}

/* --------------------------------------------------------------------------
 * 07 节：四选一小练习（只差一个变量，标签仅 A/B/C/D，选后显影标尺）
 * -------------------------------------------------------------------------- */
export function initPracticeLab() {
  const cards = [...document.querySelectorAll("[data-quiz]")];
  const titleEl = document.getElementById("quiz-verdict-title");
  const bodyEl = document.getElementById("quiz-verdict-body");
  const resetBtn = document.getElementById("quiz-reset");
  if (!cards.length) return;

  const FEEDBACK = {
    A: {
      ok: false,
      title: "选 A：很齐整，但踩中了「晾衣绳均分」",
      body: "A 的展幅、地平线和朝向都没问题，唯一差在间距——四个人被排成了完全相等的 1:1:1。视线扫过去像在数栏杆，分不出对话组和独行者。对比看 B：把前两位轻轻拉近成组，画面立刻长出呼吸节奏。",
    },
    B: {
      ok: true,
      title: "选对了（B）：宽幅、地平、流向与疏密四项合一",
      body: "四组人物稳踩同一条海堤地平线；总跨度约 74% 留出左右余地；前两位靠近呼应、中间留宽幅呼吸、右侧顺承收尾；且前三朝右引流、最右一位微微向左回望把视线兜回画框内。",
    },
    C: {
      ok: false,
      title: "选 C：间距和地平线都对，唯独朝向在打架",
      body: "C 的站位间距与 B 完全一致，只改了一个变量——人物朝向。最左位朝左盯画外，中段两人背对背撕裂视线，横向流动直接断在中途。看显影后的红色虚线就能一眼发现。",
    },
    D: {
      ok: false,
      title: "选 D：跨度和朝向都顺，但高低脱轴把水平感拆散了",
      body: "D 的水平间距和朝向都照搬 B，只把纵向高度拉成了高低锯齿。横向调度最值钱的稳定与宽广感，需要一条共享的水平基准带托底。",
    },
  };

  function choose(key) {
    const fb = FEEDBACK[key];
    if (!fb) return;
    cards.forEach((c) => {
      const k = c.dataset.quiz;
      c.classList.add("is-revealed");
      c.classList.toggle("is-chosen", k === key);
      c.classList.toggle("is-correct", k === "B");
      c.classList.toggle("is-wrong", k === key && k !== "B");
      c.setAttribute("aria-pressed", String(k === key));
    });
    titleEl.textContent = fb.title;
    titleEl.dataset.state = fb.ok ? "ok" : "warn";
    bodyEl.textContent = fb.body;
    if (resetBtn) resetBtn.hidden = false;
  }

  cards.forEach((c) => c.addEventListener("click", () => choose(c.dataset.quiz)));
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      cards.forEach((c) => {
        c.classList.remove("is-revealed", "is-chosen", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", "false");
      });
      titleEl.textContent = "先凭第一眼直觉挑一张。";
      titleEl.dataset.state = "";
      bodyEl.textContent = "四张图画的是同一场四人海滨长廊宽银幕戏，只差一个变量。选完后会显出隐藏的水平轴、间距尺与视线箭头。";
      resetBtn.hidden = true;
    });
  }
}

/* --------------------------------------------------------------------------
 * 08 节：原海报放大灯箱（复用 #poster.src，draggable="false"，可拖可缩 Esc 关）
 * -------------------------------------------------------------------------- */
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-btn");
  const box = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lightbox-stage");
  const zoomImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zin");
  const zoomOutBtn = document.getElementById("lightbox-zout");
  const resetBtn = document.getElementById("lightbox-reset");
  if (!posterImg || !openBtn || !box || !zoomImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    zoomImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function open() {
    if (!zoomImg.src) zoomImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target === stage) close();
  });
  zoomInBtn?.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn?.addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } applyTransform(); });
  resetBtn?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.2, scale + (e.deltaY < 0 ? 0.16 : -0.16)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  zoomImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    zoomImg.setPointerCapture(e.pointerId);
  });
  zoomImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const stop = (e) => {
    dragging = false;
    try { zoomImg.releasePointerCapture(e.pointerId); } catch {}
  };
  zoomImg.addEventListener("pointerup", stop);
  zoomImg.addEventListener("pointercancel", stop);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}
