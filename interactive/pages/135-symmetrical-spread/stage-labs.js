// 135 对称跨页 · 正文 01–06 节差异化互动实验台
// 每一节使用独立交互机制：对折角验镜台 / 四柱拆骨开关 / 装订剖面 Canvas / 范德格拉夫四步作图 / 六场景滤镜 / 双回合中性考场

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, computeGutterProfile } from "./model.js";

// ==================== 01 节：对折角验镜台（平移 vs 镜像 vs 异形等重） ====================
export function initFoldCompareLab() {
  const root = document.getElementById("lab-fold");
  if (!root) return;
  const slider = document.getElementById("fold-angle-range");
  const angleOut = document.getElementById("fold-angle-val");
  const playBtn = document.getElementById("fold-play-btn");
  const modeBtns = [...root.querySelectorAll("[data-fold-mode]")];
  const flap = document.getElementById("fold-verso-flap");
  const rectoGroup = document.getElementById("fold-recto-group");
  const verdict = document.getElementById("fold-verdict");
  const matchTag = document.getElementById("fold-match-tag");

  let mode = "translation";
  let angle = 0;
  let animRaf = 0;

  const RECTO_TEMPLATES = {
    translation: `
      <rect x="266" y="34" width="22" height="72" fill="#0A6554" />
      <path d="M294 42 A34 34 0 0 1 294 110 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.6"/>
      <circle cx="332" cy="144" r="28" fill="#F2486A" />
      <circle cx="337" cy="144" r="28" fill="none" stroke="#EFE6D2" stroke-width="1.3"/>
      <line x1="266" y1="184" x2="324" y2="184" stroke="#5A5D58" stroke-width="2"/>
      <line x1="266" y1="194" x2="314" y2="194" stroke="#5A5D58" stroke-width="2"/>
    `,
    mirror: `
      <rect x="432" y="34" width="22" height="72" fill="#0A6554" />
      <path d="M426 42 A34 34 0 0 0 426 110 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.6"/>
      <circle cx="388" cy="144" r="28" fill="#F2486A" />
      <circle cx="383" cy="144" r="28" fill="none" stroke="#EFE6D2" stroke-width="1.3"/>
      <line x1="396" y1="184" x2="454" y2="184" stroke="#5A5D58" stroke-width="2"/>
      <line x1="406" y1="194" x2="454" y2="194" stroke="#5A5D58" stroke-width="2"/>
    `,
    counterweight: `
      <line x1="286" y1="42" x2="380" y2="42" stroke="#18201E" stroke-width="2.6"/>
      <line x1="286" y1="56" x2="372" y2="56" stroke="#5A5D58" stroke-width="2"/>
      <line x1="286" y1="68" x2="366" y2="68" stroke="#5A5D58" stroke-width="2"/>
      <line x1="286" y1="80" x2="376" y2="80" stroke="#5A5D58" stroke-width="2"/>
      <line x1="286" y1="92" x2="352" y2="92" stroke="#5A5D58" stroke-width="2"/>
      <rect x="394" y="36" width="54" height="68" fill="#0A6554"/>
      <circle cx="384" cy="144" r="28" fill="#F2486A"/>
      <circle cx="379" cy="144" r="28" fill="none" stroke="#EFE6D2" stroke-width="1.3"/>
      <rect x="286" y="182" width="162" height="16" fill="#0A6554"/>
    `,
  };

  function update() {
    const cos = Math.cos((angle * Math.PI) / 180);
    // 绕脊线 x = 240 做横向余弦折叠
    flap.setAttribute("transform", `translate(240 0) scale(${cos.toFixed(4)} 1) translate(-240 0)`);
    flap.setAttribute("opacity", angle > 95 ? "0.62" : "1");
    angleOut.textContent = `${Math.round(angle)}°`;
    slider.value = String(Math.round(angle));
    rectoGroup.innerHTML = RECTO_TEMPLATES[mode];

    for (const b of modeBtns) {
      const on = b.dataset.foldMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }

    const folded = angle >= 165;
    if (mode === "translation") {
      matchTag.textContent = folded ? "× 对折错开 · 平移假对称" : "平移复制模式";
      matchTag.className = "lab-chip is-bad";
      verdict.textContent = folded
        ? "合上 180° 后看得很清楚：左页的深绿竖条与半圆翻过去落在了右页外沿，而右页的竖条却卡在书脊边——两页根本对不上。"
        : "把折页角拉到 180°，看左页翻过去后能否和右页的轮廓套准。";
    } else if (mode === "mirror") {
      matchTag.textContent = folded ? "✓ 严丝合缝 · 真实轴线镜像" : "中轴镜像模式";
      matchTag.className = "lab-chip is-ok";
      verdict.textContent = folded
        ? "合上 180° 后所有半圆、玫红圆与文字边线严丝合缝重合——这才是以装订脊为对称轴的真正双页镜像。"
        : "左右页以书脊为镜面反射：外切口呼应外切口，内订口呼应内订口。拉到 180° 验证套准。";
    } else {
      matchTag.textContent = folded ? "✓ 异形同框 · 重心吻合" : "异形等重模式";
      matchTag.className = "lab-chip is-ok";
      verdict.textContent = folded
        ? "合上 180° 后几何轮廓虽不完全一样，但外边距框架、水平基线与玫红焦点圆精准重合，整体视觉重心依然稳稳对称。"
        : "高级画册常在镜像骨架里放不同元素（左图右文），只要边框、基线和视觉分量彼此呼应，依然成立。";
    }
  }

  slider.addEventListener("input", () => {
    cancelAnimationFrame(animRaf);
    angle = Number(slider.value);
    update();
  });

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      mode = b.dataset.foldMode;
      update();
    });
  }

  playBtn.addEventListener("click", () => {
    cancelAnimationFrame(animRaf);
    const target = angle > 120 ? 0 : 180;
    if (reducedMotion.matches) {
      angle = target;
      update();
      return;
    }
    const start = angle;
    const t0 = performance.now();
    const dur = 680;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      angle = start + (target - start) * ease;
      update();
      if (p < 1) animRaf = requestAnimationFrame(step);
    };
    animRaf = requestAnimationFrame(step);
  });

  update();
}

// ==================== 02 节：四柱拆骨解剖台（抽掉单根支柱立见崩塌） ====================
export function initPillarBreakLab() {
  const root = document.getElementById("lab-pillars");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-break-pillar]")];
  const svg = document.getElementById("pillar-demo-svg");
  const titleEl = document.getElementById("pillar-break-title");
  const descEl = document.getElementById("pillar-break-desc");

  const CASES = {
    intact: {
      title: "四柱齐备：轴线、镜像、平衡、秩序同时咬合",
      desc: "书脊居正中，左右边距与半圆严格反射，玫红主圆分量相等，横跨中缝的水平基线连成一条笔直视线。",
      render: () => `
        <rect x="20" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <rect x="220" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <line x1="220" y1="8" x2="220" y2="252" stroke="#EFE6D2" stroke-dasharray="4 4" stroke-width="1.3"/>
        <circle cx="220" cy="18" r="4" fill="#050606" stroke="#EFE6D2" stroke-width="1.4"/>
        <rect x="40" y="40" width="26" height="62" fill="#0A6554"/>
        <path d="M74 44 A29 29 0 0 1 74 102 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="116" cy="156" r="30" fill="#F2486A"/>
        <circle cx="122" cy="156" r="30" fill="none" stroke="#EFE6D2" stroke-width="1.2"/>
        <rect x="374" y="40" width="26" height="62" fill="#0A6554"/>
        <path d="M366 44 A29 29 0 0 0 366 102 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="324" cy="156" r="30" fill="#F2486A"/>
        <circle cx="318" cy="156" r="30" fill="none" stroke="#EFE6D2" stroke-width="1.2"/>
        <line x1="32" y1="156" x2="408" y2="156" stroke="#39C6A8" stroke-dasharray="4 4" stroke-width="1.2"/>
      `,
    },
    axis: {
      title: "抽掉「轴线 AXIS」：右页脱轴漂移，中缝不再是中心",
      desc: "即便图形本身保持镜像，只要左右页距书脊的距离不再相等，整本书打开就像装订偏心，视线失去稳定锚点。",
      render: () => `
        <rect x="20" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <rect x="220" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <line x1="220" y1="8" x2="220" y2="252" stroke="#FF6F8C" stroke-dasharray="4 4" stroke-width="1.5"/>
        <rect x="40" y="40" width="26" height="62" fill="#0A6554"/>
        <path d="M74 44 A29 29 0 0 1 74 102 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="116" cy="156" r="30" fill="#F2486A"/>
        <rect x="314" y="40" width="26" height="62" fill="#0A6554"/>
        <path d="M306 44 A29 29 0 0 0 306 102 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="264" cy="156" r="30" fill="#F2486A"/>
        <rect x="220" y="20" width="24" height="220" fill="rgba(242,72,106,0.22)"/>
        <text x="320" y="226" fill="#FF708D" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">偏轴挤缝 −60px</text>
      `,
    },
    mirror: {
      title: "抽掉「镜像 MIRROR」：退化成机械平移，内外边距颠倒",
      desc: "右页只是把左页横移过来，半圆朝向不再对望，反而一起往右滑走，跨页瞬间变成两张重复的传单。",
      render: () => `
        <rect x="20" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <rect x="220" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <line x1="220" y1="8" x2="220" y2="252" stroke="#EFE6D2" stroke-dasharray="4 4" stroke-width="1.3"/>
        <rect x="40" y="40" width="26" height="62" fill="#0A6554"/>
        <path d="M74 44 A29 29 0 0 1 74 102 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="116" cy="156" r="30" fill="#F2486A"/>
        <rect x="240" y="40" width="26" height="62" fill="#0A6554" stroke="#FF708D" stroke-width="1.6"/>
        <path d="M274 44 A29 29 0 0 1 274 102 Z" fill="#0A6554" stroke="#FF708D" stroke-width="1.6"/>
        <circle cx="316" cy="156" r="30" fill="#F2486A"/>
        <text x="320" y="226" fill="#FF708D" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">→ 同向平移（未反射）</text>
      `,
    },
    balance: {
      title: "抽掉「平衡 BALANCE」：右页视觉量级骤降，版面向左倾覆",
      desc: "骨架还在，但右页主视觉缩成轻飘飘的一小点，书页的天平在读者的潜意识里立刻向左沉下去。",
      render: () => `
        <rect x="20" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <rect x="220" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <line x1="220" y1="8" x2="220" y2="252" stroke="#EFE6D2" stroke-dasharray="4 4" stroke-width="1.3"/>
        <rect x="40" y="40" width="26" height="62" fill="#0A6554"/>
        <path d="M74 44 A29 29 0 0 1 74 102 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="116" cy="156" r="36" fill="#F2486A"/>
        <rect x="382" y="54" width="16" height="36" fill="#0A6554"/>
        <path d="M376 58 A14 14 0 0 0 376 86 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
        <circle cx="324" cy="156" r="14" fill="#F2486A" stroke="#FF708D" stroke-width="1.6"/>
        <line x1="146" y1="232" x2="294" y2="210" stroke="#FF708D" stroke-width="2"/>
        <text x="320" y="236" fill="#FF708D" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">量级失衡 0.34×</text>
      `,
    },
    order: {
      title: "抽掉「秩序 ORDER」：跨缝水平基准错牙，眼神上下跳动",
      desc: "两页各自都挺饱满，但右页基准线掉下一截，眼睛从左页横扫到右页时被生生绊住，书刊的庄重节奏碎掉。",
      render: () => `
        <rect x="20" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <rect x="220" y="18" width="200" height="224" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1.2"/>
        <line x1="220" y1="8" x2="220" y2="252" stroke="#EFE6D2" stroke-dasharray="4 4" stroke-width="1.3"/>
        <rect x="40" y="34" width="26" height="62" fill="#0A6554"/>
        <path d="M74 38 A29 29 0 0 1 74 96 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="116" cy="140" r="28" fill="#F2486A"/>
        <rect x="374" y="68" width="26" height="62" fill="#0A6554"/>
        <path d="M366 72 A29 29 0 0 0 366 130 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.4"/>
        <circle cx="324" cy="176" r="28" fill="#F2486A"/>
        <line x1="30" y1="140" x2="216" y2="140" stroke="#39C6A8" stroke-dasharray="4 3" stroke-width="1.3"/>
        <line x1="224" y1="176" x2="410" y2="176" stroke="#FF708D" stroke-dasharray="4 3" stroke-width="1.3"/>
        <text x="320" y="226" fill="#FF708D" font-size="11" font-family="Space Mono, monospace" text-anchor="middle">跨缝错牙 +36px</text>
      `,
    },
  };

  function select(key) {
    const item = CASES[key] || CASES.intact;
    for (const b of btns) {
      const on = b.dataset.breakPillar === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    svg.innerHTML = item.render();
    titleEl.textContent = item.title;
    descEl.textContent = item.desc;
  }

  for (const b of btns) {
    b.addEventListener("click", () => select(b.dataset.breakPillar));
  }
  select("intact");
}

// ==================== 03 节：装订中缝弯折与吞字模拟仪（2D Canvas） ====================
export function initGutterSectionLab() {
  const canvas = document.getElementById("gutter-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const pagesInput = document.getElementById("gutter-pages");
  const pagesOut = document.getElementById("gutter-pages-val");
  const marginInput = document.getElementById("gutter-margin");
  const marginOut = document.getElementById("gutter-margin-val");
  const bindBtns = [...document.querySelectorAll("[data-gutter-bind]")];
  const verdictEl = document.getElementById("gutter-verdict");
  const statLoss = document.getElementById("gutter-loss-val");
  const statRec = document.getElementById("gutter-rec-val");

  const st = { pages: 320, binding: "perfect", innerMm: 12 };
  let dirty = true;

  function draw(t, dt, { still }) {
    if (!dirty && !still) return;
    dirty = false;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = pixelRatio(2);
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const res = computeGutterProfile(st);
    const scale = Math.min(w / 720, h / 340);
    const ox = (w - 720 * scale) * 0.5;
    const oy = (h - 340 * scale) * 0.5;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0E1211";
    ctx.fillRect(0, 0, w, h);

    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const cx = 360;
    const halfBookW = 290; // 代表 210mm 单页宽
    const mmToPx = halfBookW / 210;
    const lossPx = res.lossMm * mmToPx;
    const innerPx = res.innerMm * mmToPx;
    const arch = res.archHeight;

    // --- 上半：物理侧剖面（书脊厚度与页弓） ---
    const baseY = 128;
    const spineThick = 6 + ((res.pages - 48) / 432) * 20;

    // 标尺标签
    ctx.font = '700 12.5px "Space Mono", "Noto Serif SC", monospace';
    ctx.fillStyle = PALETTE.ivoryMuted;
    ctx.textAlign = "left";
    ctx.fillText("SIDE PROFILE · 书籍摊开横截面（经验示意）", 26, 23);

    // 底部厚书背与内页块
    ctx.fillStyle = "#1B2220";
    ctx.fillRect(cx - halfBookW, baseY, halfBookW * 2, spineThick);
    ctx.strokeStyle = "rgba(239,230,210,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - halfBookW, baseY, halfBookW * 2, spineThick);

    // 摊开纸页弧线（从左外沿起拱再跌进书脊谷底，再起拱到右外沿）
    const spineValleyY = baseY + 2;
    ctx.beginPath();
    ctx.moveTo(cx - halfBookW, baseY - 2);
    ctx.bezierCurveTo(cx - halfBookW * 0.55, baseY - arch * 1.15, cx - lossPx * 1.4, baseY - arch * 0.9, cx, spineValleyY);
    ctx.bezierCurveTo(cx + lossPx * 1.4, baseY - arch * 0.9, cx + halfBookW * 0.55, baseY - arch * 1.15, cx + halfBookW, baseY - 2);
    ctx.strokeStyle = PALETTE.ivoryBright;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // 中缝阴影吞噬带投影
    const zoneColor =
      res.status === "swallow" ? "rgba(242,72,106,0.28)" : res.status === "tight" ? "rgba(242,182,84,0.22)" : "rgba(57,198,168,0.18)";
    ctx.fillStyle = zoneColor;
    ctx.fillRect(cx - lossPx, 40, lossPx * 2, 270);

    // --- 下半：俯视双页跨缝阅读视图 ---
    const topY = 178;
    const botY = 308;
    ctx.font = '700 12.5px "Space Mono", "Noto Serif SC", monospace';
    ctx.fillStyle = PALETTE.ivoryMuted;
    ctx.textAlign = "left";
    ctx.fillText("TOP VIEW · 俯视跨页订口与正文边线", 26, 166);

    ctx.fillStyle = "#080A09";
    ctx.fillRect(cx - halfBookW, topY, halfBookW * 2, botY - topY);
    ctx.strokeStyle = "rgba(239,230,210,0.42)";
    ctx.strokeRect(cx - halfBookW, topY, halfBookW * 2, botY - topY);

    // 再次叠加中缝阴影区
    ctx.fillStyle = zoneColor;
    ctx.fillRect(cx - lossPx, topY, lossPx * 2, botY - topY);

    // 绘制左页与右页文字行（内边线正好落在 innerPx 处）
    const textOuterPad = 32;
    const leftTextEnd = cx - innerPx;
    const rightTextStart = cx + innerPx;
    const lineColor = res.status === "swallow" ? "#FF92A8" : PALETTE.ivory;

    for (let i = 0; i < 6; i++) {
      const ly = topY + 24 + i * 17;
      ctx.strokeStyle = i === 0 ? PALETTE.emeraldBright : lineColor;
      ctx.lineWidth = i === 0 ? 3 : 1.8;
      // 左页文字行
      ctx.beginPath();
      ctx.moveTo(cx - halfBookW + textOuterPad, ly);
      ctx.lineTo(leftTextEnd, ly);
      ctx.stroke();
      // 右页文字行
      ctx.beginPath();
      ctx.moveTo(rightTextStart, ly);
      ctx.lineTo(cx + halfBookW - textOuterPad, ly);
      ctx.stroke();
    }

    // 标出内订口边界竖线（绿=安全，红=被吞噬）
    const edgeColor = res.status === "swallow" ? PALETTE.roseBright : res.status === "tight" ? PALETTE.warn : PALETTE.ok;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(leftTextEnd, topY - 4);
    ctx.lineTo(leftTextEnd, botY + 4);
    ctx.moveTo(rightTextStart, topY - 4);
    ctx.lineTo(rightTextStart, botY + 4);
    ctx.stroke();

    // 中轴虚线
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = PALETTE.ivory;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, 36);
    ctx.lineTo(cx, botY + 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // 标注吞噬/净空数值
    ctx.font = '700 12.5px "Space Mono", "Noto Serif SC", monospace';
    ctx.fillStyle = edgeColor;
    ctx.textAlign = "center";
    ctx.fillText(
      `弯折影响 ±${res.lossMm.toFixed(1)}mm · 当前内订口 ${res.innerMm}mm`,
      cx,
      328
    );

    ctx.restore();
  }

  const runner = loop(canvas, draw);

  function syncUI() {
    const res = computeGutterProfile(st);
    pagesOut.textContent = `${res.pages} 页`;
    marginOut.textContent = `${res.innerMm} mm`;
    statLoss.textContent = `约 ${res.lossMm.toFixed(1)}mm（经验）`;
    statRec.textContent = `≥ ${res.recommendedMm} mm`;
    verdictEl.textContent = res.verdict;
    verdictEl.dataset.state = res.status;
    for (const b of bindBtns) {
      const on = b.dataset.gutterBind === st.binding;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    dirty = true;
    runner.draw();
  }

  pagesInput.addEventListener("input", () => {
    st.pages = Number(pagesInput.value);
    syncUI();
  });
  marginInput.addEventListener("input", () => {
    st.innerMm = Number(marginInput.value);
    syncUI();
  });
  for (const b of bindBtns) {
    b.addEventListener("click", () => {
      st.binding = b.dataset.gutterBind;
      syncUI();
    });
  }
  new ResizeObserver(() => {
    dirty = true;
    runner.draw();
  }).observe(canvas);
  syncUI();
}

// ==================== 04 节：范德格拉夫 2:3:4:6 法典几何作图步进器 ====================
export function initCanonLab() {
  const root = document.getElementById("lab-canon");
  if (!root) return;
  const stepBtns = [...root.querySelectorAll("[data-canon-step]")];
  const ratioBtns = [...root.querySelectorAll("[data-canon-ratio]")];
  const svg = document.getElementById("canon-svg");
  const noteEl = document.getElementById("canon-note");

  let step = 3;
  let ratio = "2to3"; // '2to3' | 'iso'

  function render() {
    for (const b of stepBtns) {
      const on = Number(b.dataset.canonStep) === step;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of ratioBtns) {
      const on = b.dataset.canonRatio === ratio;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }

    // 单页宽 w, 高 h
    const pw = ratio === "2to3" ? 180 : 192;
    const ph = ratio === "2to3" ? 270 : 272; // 2:3 vs 1:1.414
    const x0 = 260 - pw;
    const y0 = 20;
    const spine = 260;

    // 范德格拉夫九分几何点（纯数学解：版芯为单页 6/9 宽 × 6/9 高，内 1/9、顶 1/9、外 2/9、底 2/9）
    const u = pw / 9;
    const v = ph / 9;
    // 左页版芯
    const lvX = x0 + 2 * u;
    const lvY = y0 + v;
    const lvW = 6 * u;
    const lvH = 6 * v;
    // 右页版芯（严格沿 spine 镜像）
    const rvX = spine + u;
    const rvY = y0 + v;
    const rvW = 6 * u;
    const rvH = 6 * v;

    let g = `
      <rect x="${x0}" y="${y0}" width="${pw}" height="${ph}" fill="#FBF8F0" stroke="#18201E" stroke-width="1.4"/>
      <rect x="${spine}" y="${y0}" width="${pw}" height="${ph}" fill="#FBF8F0" stroke="#18201E" stroke-width="1.4"/>
      <line x1="${spine}" y1="${y0 - 8}" x2="${spine}" y2="${y0 + ph + 8}" stroke="#18201E" stroke-dasharray="4 4" stroke-width="1.2"/>
    `;

    // Step 1: 跨页大对角线 + 单页对角线
    if (step >= 1) {
      g += `
        <line x1="${x0}" y1="${y0 + ph}" x2="${spine + pw}" y2="${y0}" stroke="#B01D3D" stroke-width="1.15" opacity="0.82"/>
        <line x1="${x0}" y1="${y0}" x2="${spine + pw}" y2="${y0 + ph}" stroke="#B01D3D" stroke-width="1.15" opacity="0.82"/>
        <line x1="${x0}" y1="${y0 + ph}" x2="${spine}" y2="${y0}" stroke="#065244" stroke-width="1.15" opacity="0.75"/>
        <line x1="${spine}" y1="${y0}" x2="${spine + pw}" y2="${y0 + ph}" stroke="#065244" stroke-width="1.15" opacity="0.75"/>
      `;
    }

    // Step 2: 交点垂线定出 1/9 网格
    if (step >= 2) {
      const ixL = x0 + (pw * 2) / 3;
      const iy = y0 + ph / 3;
      const ixR = spine + pw / 3;
      g += `
        <circle cx="${ixL.toFixed(1)}" cy="${iy.toFixed(1)}" r="4" fill="#B01D3D"/>
        <circle cx="${ixR.toFixed(1)}" cy="${iy.toFixed(1)}" r="4" fill="#B01D3D"/>
        <line x1="${ixL.toFixed(1)}" y1="${y0}" x2="${ixL.toFixed(1)}" y2="${iy.toFixed(1)}" stroke="#B01D3D" stroke-dasharray="3 3" stroke-width="1.2"/>
        <line x1="${ixR.toFixed(1)}" y1="${y0}" x2="${ixR.toFixed(1)}" y2="${iy.toFixed(1)}" stroke="#B01D3D" stroke-dasharray="3 3" stroke-width="1.2"/>
        <line x1="${ixR.toFixed(1)}" y1="${y0}" x2="${spine + u}" y2="${y0 + v}" stroke="#065244" stroke-width="1.3"/>
        <line x1="${ixL.toFixed(1)}" y1="${y0}" x2="${spine - u}" y2="${y0 + v}" stroke="#065244" stroke-width="1.3"/>
      `;
    }

    // Step 3: 填充严格镜像版芯与 2:3:4:6 边距标注（白色描边底晕避开对角辅助线干扰）
    if (step >= 3) {
      const halo = 'paint-order="stroke" stroke="#FBF8F0" stroke-width="4" stroke-linejoin="round" font-weight="700" font-size="12" font-family="Space Mono, monospace" text-anchor="middle"';
      g += `
        <rect x="${lvX.toFixed(1)}" y="${lvY.toFixed(1)}" width="${lvW.toFixed(1)}" height="${lvH.toFixed(1)}" fill="rgba(10,101,84,0.22)" stroke="#065244" stroke-width="1.8"/>
        <rect x="${rvX.toFixed(1)}" y="${rvY.toFixed(1)}" width="${rvW.toFixed(1)}" height="${rvH.toFixed(1)}" fill="rgba(10,101,84,0.22)" stroke="#065244" stroke-width="1.8"/>
        <text x="${(spine + u * 0.5).toFixed(1)}" y="${(y0 + ph * 0.72).toFixed(1)}" fill="#B01D3D" ${halo}>2</text>
        <text x="${(rvX + rvW * 0.5).toFixed(1)}" y="${(y0 + v * 0.68).toFixed(1)}" fill="#065244" ${halo}>${ratio === "2to3" ? "3" : "2.8"}</text>
        <text x="${(rvX + rvW + u).toFixed(1)}" y="${(y0 + ph * 0.54).toFixed(1)}" fill="#065244" ${halo}>4</text>
        <text x="${(rvX + rvW * 0.5).toFixed(1)}" y="${(y0 + ph - v * 0.85).toFixed(1)}" fill="#065244" ${halo}>${ratio === "2to3" ? "6" : "5.7"}</text>
      `;
    }

    svg.innerHTML = g;

    const NOTES = {
      1: "第一步：同时拉出整幅跨页的大对角线（绯红）与左右单页的对角线（松绿），先把两页锁定成同一个几何整体。",
      2: "第二步：跨页对角线与单页对角线的交点，自然切出 1/3 高度；向上引垂线再连向页角，无需任何毫米刻度即可精确分出九分之一网格。",
      3:
        ratio === "2to3"
          ? "第三步（古典 2:3 页比）：九分格锁出的镜像版芯与纸张完全同比例，四边留白恰好呈 内 2 : 顶 3 : 外 4 : 底 6——翻开时两页内订口相加等于一侧外切口。"
          : "第三步（现代 ISO A4，1:√2）：同一套几何作图照样生效！版芯仍与纸张同比例，四边留白比例微调为 内 2 : 顶 2.83 : 外 4 : 底 5.66，外切口依然宽于单侧内订口。",
    };
    noteEl.textContent = NOTES[step];
  }

  for (const b of stepBtns) {
    b.addEventListener("click", () => {
      step = Number(b.dataset.canonStep);
      render();
    });
  }
  for (const b of ratioBtns) {
    b.addEventListener("click", () => {
      ratio = b.dataset.canonRatio;
      render();
    });
  }
  render();
}

// ==================== 05 节：六大出版场景决策滤镜 ====================
export function initScenarioFilter() {
  const root = document.getElementById("lab-scenarios");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-scenario]")];
  const badge = document.getElementById("sc-badge");
  const title = document.getElementById("sc-title");
  const body = document.getElementById("sc-body");
  const linkWrap = document.getElementById("sc-sibling-wrap");

  const SCENARIOS = {
    monograph: {
      fit: "ok",
      badge: "强烈推荐 · 对称跨页",
      title: "建筑、器物或双图对照画册",
      body: "对称跨页赋予作品庄重的策展感：左右两页同构呼应或异形等重，读者天然放慢翻页节奏，把两页并置品读。配锁线平摊装订效果尤佳。",
      sibling: { id: "139", name: "无出血版式", note: "若想以干净四边白框托出作品边界，常配合" },
    },
    literature: {
      fit: "ok",
      badge: "经典主场 · 对称跨页",
      title: "精装文学书、典籍与学术专著",
      body: "长篇连续阅读靠的是稳定的双页节奏：内订口避开书脊弯折，外切口与底边留足拇指握持区，让读者翻阅数百页都不觉疲惫。",
      sibling: { id: "132", name: "单栏版式", note: "单页内部的正文流组织可延伸阅读" },
    },
    manifesto: {
      fit: "ok",
      badge: "高仪式感 · 对称跨页",
      title: "年报扉页、章节序页与品牌宣言",
      body: "把章节大标或双核心图形稳稳安在书脊两侧，能瞬间立住秩序与权威感，给读者明确的「新篇章开启」心理停顿。",
      sibling: { id: "138", name: "满出血版式", note: "若追求画面四边齐切破框的沉浸冲击，则可结合" },
    },
    interview: {
      fit: "warn",
      badge: "慎用 · 易显呆板",
      title: "强叙事人物专访或潮流杂志特稿",
      body: "如果一页是大幅情绪人像、另一页是快节奏问答和旁白，强行左右严格镜像反而会扼杀故事张力——此时应打破中轴对称。",
      sibling: { id: "136", name: "非对称跨页", note: "需要打破静态均衡、制造方向动势时，请改用" },
    },
    panorama: {
      fit: "warn",
      badge: "换法 · 别被中轴切断",
      title: "单张全景摄影、大跨幅海报地图",
      body: "当一整张横幅画面需要畅通无阻地跨越书脊铺满双页时，对称跨页的「左右独立镜像框架」反而成了阻碍。",
      sibling: { id: "137", name: "通版跨页", note: "让单幅主视觉直接横贯整幅双页时，请改用" },
    },
    dashboard: {
      fit: "bad",
      badge: "不适用 · 缺少物理中轴",
      title: "手机竖屏长文、复杂资讯报刊或数据目录",
      body: "对称跨页依赖「左右两页同时出现在视野中」。窄屏单页设备根本没有物理对开中缝，强行硬套对称镜像只会压缩有效阅读宽度。",
      sibling: { id: "134", name: "多栏版式", note: "需要高密度模块编排或信息分轨时，请改用" },
    },
  };

  function select(id) {
    const sc = SCENARIOS[id] || SCENARIOS.monograph;
    for (const b of btns) {
      const on = b.dataset.scenario === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    badge.textContent = sc.badge;
    badge.className = `sc-badge is-${sc.fit}`;
    title.textContent = sc.title;
    body.textContent = sc.body;
    linkWrap.innerHTML = `${sc.sibling.note} <a href="https://layout.xiaoxiaodong.ai/${sc.sibling.id}/play/" target="_blank" rel="noopener">${sc.sibling.id} ${sc.sibling.name}</a>。`;
  }

  for (const b of btns) {
    b.addEventListener("click", () => select(b.dataset.scenario));
  }
  select("monograph");
}

// ==================== 06 节：双回合四选一中性视觉考场 ====================
export function initQuizLab() {
  const root = document.getElementById("lab-quiz");
  if (!root) return;
  const roundBtns = [...root.querySelectorAll("[data-quiz-round]")];
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");

  const ROUNDS = [
    {
      id: 0,
      prompt: "第 1 题：你要为一本 320 页无线胶装建筑画册排一对对称跨页。下面四个方案元素完全相同，仅在镜像与订口结构上各差一个变量，哪一个真正成立？",
      answer: "B",
      options: [
        {
          key: "A",
          verdict: "不对：这是「平移复制」而非中轴镜像。右页的深绿竖条与半圆没有沿书脊反射，反而贴着装订中缝同向滑走，对折根本无法吻合。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="#EFE6D2" stroke-dasharray="3 3"/>
            <rect x="28" y="30" width="16" height="44" fill="#0A6554"/>
            <path d="M48 34 A20 20 0 0 1 48 74 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
            <circle cx="84" cy="118" r="21" fill="#F2486A"/>
            <rect x="164" y="30" width="16" height="44" fill="#0A6554" ${rev ? 'stroke="#FF708D" stroke-width="1.8"' : ""}/>
            <path d="M184 34 A20 20 0 0 1 184 74 Z" fill="#0A6554" stroke="${rev ? "#FF708D" : "#EFE6D2"}" stroke-width="${rev ? "1.8" : "1.2"}"/>
            <circle cx="220" cy="118" r="21" fill="#F2486A"/>
            ${rev ? '<text x="218" y="160" fill="#FF708D" font-size="10" font-family="Space Mono, Noto Serif SC, monospace" text-anchor="middle">× 平移未镜像</text>' : ""}
          `,
        },
        {
          key: "B",
          verdict: "正确！左右页严格沿书脊中轴反射，内订口同时避开 320 页胶装阴影区，跨缝水平基线齐平且左右视觉量级均衡。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="137" y="15" width="26" height="154" fill="rgba(0,0,0,0.45)"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="${rev ? "#39C6A8" : "#EFE6D2"}" stroke-dasharray="3 3"/>
            <rect x="28" y="30" width="16" height="44" fill="#0A6554"/>
            <path d="M48 34 A20 20 0 0 1 48 74 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
            <circle cx="84" cy="118" r="21" fill="#F2486A"/>
            <rect x="256" y="30" width="16" height="44" fill="#0A6554"/>
            <path d="M252 34 A20 20 0 0 0 252 74 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
            <circle cx="216" cy="118" r="21" fill="#F2486A"/>
            ${rev ? '<line x1="20" y1="118" x2="280" y2="118" stroke="#39C6A8" stroke-dasharray="3 3"/><text x="218" y="160" fill="#39C6A8" font-size="10" font-family="Space Mono, monospace" text-anchor="middle">✓ 镜像且安全</text>' : ""}
          `,
        },
        {
          key: "C",
          verdict: "不对：虽然做了镜像，但内订口压得极窄——在 320 页无线胶装书里，贴近书脊的半圆弧和玫红圆边会被装订弯折直接吞进暗缝。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="135" y="15" width="30" height="154" fill="${rev ? "rgba(242,72,106,0.28)" : "rgba(0,0,0,0.52)"}"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="#EFE6D2" stroke-dasharray="3 3"/>
            <rect x="78" y="30" width="16" height="44" fill="#0A6554"/>
            <path d="M98 34 A20 20 0 0 1 98 74 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
            <circle cx="127" cy="118" r="21" fill="#F2486A"/>
            <rect x="206" y="30" width="16" height="44" fill="#0A6554"/>
            <path d="M202 34 A20 20 0 0 0 202 74 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
            <circle cx="173" cy="118" r="21" fill="#F2486A"/>
            ${rev ? '<text x="150" y="160" fill="#FF708D" font-size="10" font-family="Space Mono, Noto Serif SC, monospace" text-anchor="middle">× 落入胶装吞噬区</text>' : ""}
          `,
        },
        {
          key: "D",
          verdict: "不对：镜像朝向与订口净空都对，但右页整套水平基线比左页下沉了一截，跨缝扫视时上下错牙，对称秩序被破坏。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="#EFE6D2" stroke-dasharray="3 3"/>
            <rect x="28" y="24" width="16" height="44" fill="#0A6554"/>
            <path d="M48 28 A20 20 0 0 1 48 68 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
            <circle cx="84" cy="108" r="21" fill="#F2486A"/>
            <rect x="256" y="48" width="16" height="44" fill="#0A6554"/>
            <path d="M252 52 A20 20 0 0 0 252 92 Z" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.2"/>
            <circle cx="216" cy="132" r="21" fill="#F2486A"/>
            ${rev ? '<line x1="20" y1="108" x2="148" y2="108" stroke="#39C6A8" stroke-dasharray="3 2"/><line x1="152" y1="132" x2="280" y2="132" stroke="#FF708D" stroke-dasharray="3 2"/><text x="218" y="162" fill="#FF708D" font-size="10" font-family="Space Mono, Noto Serif SC, monospace" text-anchor="middle">× 基线错牙 +24px</text>' : ""}
          `,
        },
      ],
    },
    {
      id: 1,
      prompt: "第 2 题（进阶）：左页是一幅大面积深松绿图版，右页需要排章节正文与章印。如何在不机械复印的前提下，做到「异形等重」的对称跨页？",
      answer: "C",
      options: [
        {
          key: "A",
          verdict: "不对：右页正文分量太稀薄且缩在角落，视觉重心彻底倒向左页的大图版。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="#EFE6D2" stroke-dasharray="3 3"/>
            <rect x="30" y="30" width="102" height="122" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.1"/>
            <line x1="170" y1="36" x2="220" y2="36" stroke="#EFE6D2" stroke-width="2"/>
            <line x1="170" y1="48" x2="212" y2="48" stroke="#9F9D92" stroke-width="1.5"/>
            <line x1="170" y1="58" x2="206" y2="58" stroke="#9F9D92" stroke-width="1.5"/>
            ${rev ? '<text x="218" y="158" fill="#FF708D" font-size="10" font-family="Space Mono, Noto Serif SC, monospace" text-anchor="middle">× 右页过轻失重</text>' : ""}
          `,
        },
        {
          key: "B",
          verdict: "不对：右页内容被强行推贴到最外侧裁切边，丢失了与左页呼应的对称外边距，且中缝拉成割裂裂谷。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="#EFE6D2" stroke-dasharray="3 3"/>
            <rect x="30" y="30" width="102" height="122" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.1"/>
            <line x1="214" y1="34" x2="282" y2="34" stroke="#EFE6D2" stroke-width="2.4"/>
            <line x1="214" y1="48" x2="282" y2="48" stroke="#9F9D92" stroke-width="1.6"/>
            <line x1="214" y1="60" x2="282" y2="60" stroke="#9F9D92" stroke-width="1.6"/>
            <circle cx="252" cy="116" r="24" fill="#F2486A"/>
            ${rev ? '<text x="218" y="160" fill="#FF708D" font-size="10" font-family="Space Mono, Noto Serif SC, monospace" text-anchor="middle">× 外切压边裂谷</text>' : ""}
          `,
        },
        {
          key: "C",
          verdict: "正确！右页严守与左页镜像的外切口与内订口版芯框、共享上下水平基线，并用饱满正文栏 + 玫红章印 + 底部松绿压舱块配平左页图版的视觉分量。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="${rev ? "#39C6A8" : "#EFE6D2"}" stroke-dasharray="3 3"/>
            <rect x="30" y="30" width="102" height="122" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.1"/>
            <line x1="168" y1="34" x2="266" y2="34" stroke="#EFE6D2" stroke-width="2.6"/>
            <line x1="168" y1="48" x2="258" y2="48" stroke="#9F9D92" stroke-width="1.6"/>
            <line x1="168" y1="60" x2="262" y2="60" stroke="#9F9D92" stroke-width="1.6"/>
            <line x1="168" y1="72" x2="246" y2="72" stroke="#9F9D92" stroke-width="1.6"/>
            <circle cx="218" cy="108" r="21" fill="#F2486A"/>
            <rect x="168" y="138" width="102" height="14" fill="#0A6554"/>
            ${rev ? '<line x1="24" y1="30" x2="276" y2="30" stroke="#39C6A8" stroke-dasharray="3 3"/><line x1="24" y1="152" x2="276" y2="152" stroke="#39C6A8" stroke-dasharray="3 3"/><text x="218" y="165" fill="#39C6A8" font-size="10" font-family="Space Mono, monospace" text-anchor="middle">✓ 同框等重成立</text>' : ""}
          `,
        },
        {
          key: "D",
          verdict: "不对：右页字块紧贴中缝且上下越出左页框线，双页失去共同的天头地脚基准线，对称骨架瓦解。",
          svg: (rev) => `
            <rect x="14" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <rect x="150" y="14" width="136" height="156" fill="#0B0E0D" stroke="#EFE6D2" stroke-width="1"/>
            <line x1="150" y1="8" x2="150" y2="176" stroke="#EFE6D2" stroke-dasharray="3 3"/>
            <rect x="30" y="30" width="102" height="122" fill="#0A6554" stroke="#EFE6D2" stroke-width="1.1"/>
            <line x1="154" y1="20" x2="244" y2="20" stroke="#EFE6D2" stroke-width="2.4"/>
            <line x1="154" y1="32" x2="236" y2="32" stroke="#9F9D92" stroke-width="1.6"/>
            <circle cx="182" cy="86" r="22" fill="#F2486A"/>
            <rect x="154" y="146" width="110" height="18" fill="#0A6554"/>
            ${rev ? '<text x="218" y="166" fill="#FF708D" font-size="10" font-family="Space Mono, Noto Serif SC, monospace" text-anchor="middle">× 贴缝且破天头地脚</text>' : ""}
          `,
        },
      ],
    },
  ];

  let roundIdx = 0;
  let picked = null;

  function render() {
    const r = ROUNDS[roundIdx];
    promptEl.textContent = r.prompt;
    for (const b of roundBtns) {
      const on = Number(b.dataset.quizRound) === roundIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }

    grid.innerHTML = r.options
      .map((opt) => {
        const isPicked = picked === opt.key;
        const isRight = opt.key === r.answer;
        let stateCls = "";
        if (picked) {
          if (isRight) stateCls = "is-correct";
          else if (isPicked) stateCls = "is-wrong";
        }
        return `
          <button type="button" class="quiz-card ${stateCls}" data-quiz-opt="${opt.key}" aria-pressed="${isPicked}">
            <div class="quiz-card-head">
              <span class="quiz-letter" lang="en">${opt.key} 方案</span>
              ${picked ? `<span class="quiz-mark">${isRight ? "✓ 正解" : isPicked ? "× 误选" : "对照"}</span>` : ""}
            </div>
            <svg class="quiz-svg" viewBox="0 0 300 184" aria-hidden="true">${opt.svg(Boolean(picked))}</svg>
          </button>
        `;
      })
      .join("");

    if (!picked) {
      feedback.innerHTML = `<p class="quiz-hint">本节小练习共 2 题：仔细核对四个方案的装订中缝、镜像朝向与水平基线，任选一张提交。</p>`;
    } else {
      const sel = r.options.find((o) => o.key === picked);
      const ok = picked === r.answer;
      feedback.innerHTML = `
        <div class="quiz-result ${ok ? "is-ok" : "is-bad"}">
          <p class="quiz-res-head"><strong>${ok ? `选对了（${picked} 方案）` : `你选了 ${picked} 方案，正确是 ${r.answer} 方案`}</strong></p>
          <p class="quiz-res-main">${sel.verdict}</p>
          <ul class="quiz-res-list">
            ${r.options
              .map((o) => `<li><strong>${o.key} 方案：</strong>${o.verdict}</li>`)
              .join("")}
          </ul>
        </div>
      `;
    }

    for (const card of grid.querySelectorAll("[data-quiz-opt]")) {
      card.addEventListener("click", () => {
        picked = card.dataset.quizOpt;
        render();
      });
    }
  }

  for (const b of roundBtns) {
    b.addEventListener("click", () => {
      roundIdx = Number(b.dataset.quizRound);
      picked = null;
      render();
    });
  }

  render();
}
