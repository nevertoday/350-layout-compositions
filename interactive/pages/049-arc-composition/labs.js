// 049 弧形构图 · 01–07 节专属交互实验台与原海报灯箱
// 相邻两节绝不用同一种控件：
// 01 关联场短棒探测台（滑杆+连续切换）
// 02 360° 拱向罗盘（可旋转圆盘指针+实时海报线框）
// 03 名作弧骨透视抽屉（四幕策展切签+结构透视图）
// 04 四景弧律对照卡（四场景页签+死弧/活弧双态翻拍）
// 05 禁用场景压测台（三稿件切签+翻车/克制重构对比）
// 06 单变量辨析考场（A/B/C/D 四同构 SVG 单变量辨析）
// 07 原海报缩放拖拽灯箱

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// =========================================================
// 01 节：关联场短棒探测台（呼应 Field, Hayes & Hess 1993）
// =========================================================
export function initAssociationLab() {
  const svg = document.getElementById("lab-assoc-svg");
  const jitterInput = document.getElementById("lab-assoc-jitter");
  const jitterVal = document.getElementById("lab-assoc-jitter-val");
  const gapBtn = document.getElementById("lab-assoc-gap");
  const guideBtn = document.getElementById("lab-assoc-guide");
  const statusEl = document.getElementById("lab-assoc-status");
  const readoutEl = document.getElementById("lab-assoc-readout");
  if (!svg || !jitterInput) return;

  // 固定确定性种子，确保短棒位置稳定，只随抖动角变化
  let jitter = 4; // 初始顺滑对齐，立即可见潜藏大弧
  let hasGap = false;
  let showGuide = false;

  // 12 枚沿隐含大弧排布的短棒（路径点）
  const arcCenter = { x: 255, y: 245 };
  const arcR = 178;
  const arcDashes = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const ang = -Math.PI * 0.88 + t * Math.PI * 0.62; // 约 112° 开放大弧
    const x = arcCenter.x + arcR * Math.cos(ang);
    const y = arcCenter.y + arcR * Math.sin(ang);
    const tangentDeg = ((ang + Math.PI / 2) * 180) / Math.PI;
    const sign = i % 2 === 0 ? 1 : -1;
    const weight = 0.65 + ((i * 7) % 5) * 0.14;
    arcDashes.push({ i, x, y, tangentDeg, sign, weight });
  }

  // 24 枚背景干扰短棒（避开主弧路径，保持确定性分布）
  const bgSeeds = [
    [52, 46, 28], [116, 38, 114], [192, 34, 62], [298, 42, 140], [362, 54, 18], [412, 92, 74],
    [46, 118, 152], [114, 114, 48], [214, 128, 96], [286, 134, 168], [392, 156, 35], [420, 214, 122],
    [48, 198, 76], [122, 194, 14], [188, 182, 132], [254, 174, 52], [326, 184, 108], [374, 224, 164],
    [68, 250, 126], [146, 244, 88], [218, 238, 22], [292, 240, 146], [352, 252, 64], [414, 256, 12],
  ];

  // 预建 SVG 元素避免重复重建
  const guidePath = svgEl("path", {
    fill: "none",
    stroke: "#F4A98C",
    "stroke-width": 2.4,
    "stroke-dasharray": "6 5",
    opacity: 0,
  });
  const pStart = arcDashes[0];
  const pEnd = arcDashes[arcDashes.length - 1];
  guidePath.setAttribute("d", `M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)} A ${arcR} ${arcR} 0 0 1 ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}`);
  svg.appendChild(guidePath);

  for (const [bx, by, ba] of bgSeeds) {
    const g = svgEl("g", { transform: `translate(${bx} ${by}) rotate(${ba})` });
    g.appendChild(svgEl("line", {
      x1: -11, y1: 0, x2: 11, y2: 0,
      stroke: "#6F5D99", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.52,
    }));
    svg.appendChild(g);
  }

  const arcNodes = arcDashes.map((d) => {
    const g = svgEl("g");
    const line = svgEl("line", {
      x1: -13, y1: 0, x2: 13, y2: 0,
      stroke: "#261556", "stroke-width": 3.6, "stroke-linecap": "round",
    });
    g.appendChild(line);
    svg.appendChild(g);
    return { d, g, line };
  });

  function update() {
    let errSum = 0;
    let activeCount = 0;
    for (const { d, g, line } of arcNodes) {
      const hidden = hasGap && (d.i === 4 || d.i === 5 || d.i === 6);
      g.setAttribute("opacity", hidden ? "0.08" : "1");
      const delta = jitter * d.sign * d.weight;
      if (!hidden) {
        errSum += Math.abs(delta);
        activeCount++;
      }
      g.setAttribute("transform", `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) rotate(${(d.tangentDeg + delta).toFixed(1)})`);
      // 当高度对齐时呈现深暮靛主色，抖动过大时退化为背景混杂色
      line.setAttribute("stroke", jitter <= 16 && !hasGap ? "#261556" : jitter <= 28 ? "#4B3391" : "#6F5D99");
    }
    guidePath.setAttribute("opacity", showGuide ? "0.95" : "0");
    const avgErr = activeCount ? Math.round(errSum / activeCount) : 0;
    jitterVal.textContent = `±${jitter}°`;

    if (hasGap && jitter > 22) {
      statusEl.textContent = "路径彻底淹没";
      statusEl.dataset.tone = "err";
      readoutEl.textContent = `中段缺失 3 枚短棒，再加上平均 ${avgErr}° 切向偏转，局部关联场完全接不上——原本清晰的大弧碎成了互不相干的短横线。`;
    } else if (hasGap) {
      statusEl.textContent = "中段断流 · 勉强衔接";
      statusEl.dataset.tone = "warn";
      readoutEl.textContent = `虽然两头切向误差仅 ${avgErr}°，但中段出现宽缺口后，眼睛要跨过一段空桥重新找点；这正是原海报底沿 TIPS 第 3 个图示（×）警示的「断续割裂」。`;
    } else if (jitter <= 14) {
      statusEl.textContent = "关联场激活 · 大弧瞬间跳出";
      statusEl.dataset.tone = "ok";
      readoutEl.textContent = `相邻短棒的平均切向偏差只有 ${avgErr}°：尽管它们互不相连、周围还有 24 根干扰短棒，人眼还是在一瞬间把这 12 笔缝成了一条贯通大弧（Field 等人 1993 年关联场效应）。`;
    } else if (jitter <= 28) {
      statusEl.textContent = "边缘吃力 · 连续感松动";
      statusEl.dataset.tone = "warn";
      readoutEl.textContent = `平均切向偏差升到 ${avgErr}° 后，局部相邻关系开始迟疑，你得刻意搜寻才能勉强辨认出弧线——视线顺滑感已经大打折扣。`;
    } else {
      statusEl.textContent = "连续性瓦解 · 沦为杂噪";
      statusEl.dataset.tone = "err";
      readoutEl.textContent = `切向偏差达到 ${avgErr}° 时，视觉皮层不再把相邻线段归为同一条曲线，整条大弧彻底融进背景噪点里，点「显示潜藏弧轨」才能找回原路径。`;
    }
  }

  jitterInput.addEventListener("input", () => {
    jitter = Number(jitterInput.value);
    update();
  });
  gapBtn.addEventListener("click", () => {
    hasGap = !hasGap;
    gapBtn.setAttribute("aria-pressed", String(hasGap));
    gapBtn.textContent = hasGap ? "路径缺口：已截断" : "路径缺口：连续";
    update();
  });
  guideBtn.addEventListener("click", () => {
    showGuide = !showGuide;
    guideBtn.setAttribute("aria-pressed", String(showGuide));
    guideBtn.textContent = showGuide ? "隐藏潜藏弧轨" : "显示潜藏弧轨";
    update();
  });
  update();
}

// =========================================================
// 02 节：360° 拱向罗盘（可旋转罗盘指针 + 实时海报线框）
// =========================================================
export function initOrientationCompass() {
  const dial = document.getElementById("lab-compass-dial");
  const hand = document.getElementById("compass-hand");
  const arcPath = document.getElementById("compass-poster-arc");
  const pocketDot = document.getElementById("compass-poster-focus");
  const copyGroup = document.getElementById("compass-poster-copy");
  const degLabel = document.getElementById("compass-deg-label");
  const moodTitle = document.getElementById("compass-mood-title");
  const moodBody = document.getElementById("compass-mood-body");
  const moodRole = document.getElementById("compass-mood-role");
  const presetBtns = [...document.querySelectorAll("[data-compass-deg]")];
  if (!dial || !hand || !arcPath) return;

  // angleDeg: 0=上拱穹顶, 90=右侧抱湾, 180=下凹托盘, 315=斜向升弧（原海报）
  let angleDeg = 315;
  let dragging = false;

  const MODES = [
    {
      match: (a) => a >= 330 || a < 35,
      title: "上拱穹顶 · 庇护与仪式感",
      role: "焦点落于拱下正中 · 顶部留出宏阔天际",
      body: "拱顶像桥梁与教堂穹窿从上方罩住主体，天然带来稳重、端庄与庇护感；适合建筑摄影、节庆主视觉或需要庄重托举的封面。",
    },
    {
      match: (a) => a >= 35 && a < 135,
      title: "侧抱弯湾 · 图文自然分栏",
      role: "一侧弯心装主图 · 另一侧顺势排文字",
      body: "大弧把版面柔和切出左右两翼：凹侧稳稳兜住主角，外侧留出整洁的阅读走廊，比一条僵硬垂线多了亲和与呼吸空间。",
    },
    {
      match: (a) => a >= 135 && a < 225,
      title: "下凹托盘 · 轻盈托举与亲和",
      role: "主体浮于凹碗上方 · 顶部豁然开朗",
      body: "像一只浅碗或微笑曲线从底端稳稳托起产品或标题，上方不压顶、亲和力最高；常见于饮品海报、美妆展示与 App 弧形头图。",
    },
    {
      match: () => true,
      title: "斜向升弧 · 速度与空间延展（049 原海报）",
      role: "视线由左下起势 · 掠过弯心冲向右上",
      body: "结合对角线的动势与圆弧的顺滑，既有向上的扬升张力，又能在右下凹侧自然兜住落日与文字，是最具电影感与开阔视野的拱向。",
    },
  ];

  function render() {
    const norm = ((angleDeg % 360) + 360) % 360;
    const rad = ((norm - 90) * Math.PI) / 180; // 0° 朝上（12点钟方向）
    const hx = 100 + Math.cos(rad) * 62;
    const hy = 100 + Math.sin(rad) * 62;
    hand.setAttribute("x2", hx.toFixed(1));
    hand.setAttribute("y2", hy.toFixed(1));
    const knob = document.getElementById("compass-knob");
    if (knob) {
      knob.setAttribute("cx", hx.toFixed(1));
      knob.setAttribute("cy", hy.toFixed(1));
    }

    // 在右侧 240×300 海报线框内绘制对应拱向的大弧
    const cx = 120;
    const cy = 150;
    // 拱顶朝向矢量 (ux, uy) 指向 norm 方向
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);
    // 弦方向与拱顶法向垂直
    const tx = -uy;
    const ty = ux;
    const halfSpan = 106;
    const sagitta = 62;
    // 弦心略微朝凹侧回退，保证视觉居中
    const mx = cx - ux * 18;
    const my = cy - uy * 18;
    const p0x = mx - tx * halfSpan;
    const p0y = my - ty * halfSpan;
    const p1x = mx + tx * halfSpan;
    const p1y = my + ty * halfSpan;
    const qx = mx + ux * sagitta * 1.85;
    const qy = my + uy * sagitta * 1.85;
    arcPath.setAttribute("d", `M ${p0x.toFixed(1)} ${p0y.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${p1x.toFixed(1)} ${p1y.toFixed(1)}`);

    // 焦点自动坐落于凹侧弯心（与拱顶方向相反）
    const fx = cx - ux * 36;
    const fy = cy - uy * 36;
    pocketDot.setAttribute("cx", fx.toFixed(1));
    pocketDot.setAttribute("cy", fy.toFixed(1));

    // 文案块坐落于相对开阔的另一侧
    const copyX = Math.max(22, Math.min(148, cx + ux * 58 - 34));
    const copyY = Math.max(24, Math.min(242, cy + uy * 78 - 14));
    copyGroup.setAttribute("transform", `translate(${copyX.toFixed(1)} ${copyY.toFixed(1)})`);

    degLabel.textContent = `${Math.round(norm)}°`;
    const m = MODES.find((item) => item.match(norm));
    moodTitle.textContent = m.title;
    moodRole.textContent = m.role;
    moodBody.textContent = m.body;

    for (const btn of presetBtns) {
      const target = Number(btn.dataset.compassDeg);
      const diff = Math.abs(((norm - target + 540) % 360) - 180);
      btn.setAttribute("aria-pressed", String(diff < 18));
    }
  }

  function updateFromPointer(e) {
    const rect = dial.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
    angleDeg = Math.round(((deg % 360) + 360) % 360);
    render();
  }

  dial.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { dial.setPointerCapture(e.pointerId); } catch {}
    updateFromPointer(e);
  });
  dial.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    updateFromPointer(e);
  });
  dial.addEventListener("pointerup", () => { dragging = false; });
  dial.addEventListener("pointercancel", () => { dragging = false; });
  dial.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); angleDeg = (angleDeg + 15) % 360; render(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); angleDeg = (angleDeg + 345) % 360; render(); }
  });
  for (const btn of presetBtns) {
    btn.addEventListener("click", () => {
      angleDeg = Number(btn.dataset.compassDeg);
      render();
    });
  }
  render();
}

// =========================================================
// 03 节：名作弧骨透视抽屉（四幕策展切换 + 深靛结构透视图）
// =========================================================
export function initOriginsDeck() {
  const btns = [...document.querySelectorAll("[data-origin-id]")];
  const stage = document.getElementById("origin-svg");
  const yearEl = document.getElementById("origin-year");
  const titleEl = document.getElementById("origin-title");
  const bodyEl = document.getElementById("origin-body");
  const citeEl = document.getElementById("origin-cite");
  if (!btns.length || !stage) return;

  const ERAS = {
    hogarth: {
      year: "1753 · 伦敦",
      title: "贺加斯《美的分析》：把曲线从「装饰」升格为视觉原理",
      body: "英国画家威廉·贺加斯在 1753 年出版的《美的分析》中提出「美之线」（Line of Beauty），指出适度弯曲的曲线比僵直几何线更能调动眼睛的主动追踪与生机。值得注意的是，贺加斯推崇的是带反向折返的蛇形 S 线；而弧形构图将其收束为一道更果断的单向大弧，去掉二次折返，让视线更快抵达弯心焦点。",
      cite: "核实出处：William Hogarth, The Analysis of Beauty (London, 1753); Plate 1 藏大都会艺术博物馆（32.35(22)）。",
      draw: () => `
        <rect x="20" y="20" width="380" height="220" rx="14" fill="#251758" stroke="#493884"/>
        <line x1="62" y1="60" x2="62" y2="200" stroke="#7E6AB2" stroke-width="2" stroke-dasharray="4 4"/>
        <text x="62" y="220" fill="#D5C8EB" font-size="11" text-anchor="middle">僵直基准</text>
        <path d="M 155 198 C 120 154, 195 106, 152 60" fill="none" stroke="#C9BAFF" stroke-width="3.2" stroke-linecap="round"/>
        <text x="155" y="220" fill="#C9BAFF" font-size="11" text-anchor="middle">贺加斯 S 蛇形线</text>
        <path d="M 248 198 Q 272 92 356 62" fill="none" stroke="#FFC4AA" stroke-width="5" stroke-linecap="round"/>
        <circle cx="322" cy="144" r="22" fill="#F4B19F" opacity="0.9"/>
        <text x="308" y="220" fill="#FFC4AA" font-size="11" text-anchor="middle">049 单向大弧（直达弯心）</text>
      `,
    },
    hokusai: {
      year: "约 1830–1832 · 江户",
      title: "葛饰北斋《神奈川冲浪里》：巨浪大弧托出静止锚点",
      body: "葛饰北斋《富岳三十六景》最具代表性的一幅浮世绘，用一道横跨画面大半幅度的开放巨浪大弧从左上翻卷向右下；但浪弧并不封死画面，而是在凹侧弯心恰好留出一个澄净空腔，稳稳兜住远处静止的三角富士山——动态弧势与静态锚点互为对照，构成了弧形构图最经典的示范。",
      cite: "核实出处：Katsushika Hokusai, Under the Wave off Kanagawa (ca. 1830–32), 大都会艺术博物馆 JP1847。",
      draw: () => `
        <rect x="20" y="20" width="380" height="220" rx="14" fill="#251758" stroke="#493884"/>
        <path d="M 38 214 Q 112 36 286 72" fill="none" stroke="#FFC4AA" stroke-width="7" stroke-linecap="round"/>
        <path d="M 60 218 Q 134 80 264 98" fill="none" stroke="#C9BAFF" stroke-width="2.2" stroke-dasharray="5 5"/>
        <polygon points="222,188 266,118 310,188" fill="#5A429A" stroke="#C9BAFF" stroke-width="1.6"/>
        <polygon points="252,140 266,118 280,140 272,135 266,142 260,135" fill="#F5EFFA"/>
        <circle cx="266" cy="158" r="40" fill="none" stroke="#FFC4AA" stroke-width="1.4" stroke-dasharray="4 4"/>
        <text x="266" y="216" fill="#FFC4AA" font-size="11" text-anchor="middle">浪弧凹侧弯心托起静止富士山</text>
      `,
    },
    gestalt: {
      year: "1923 & 1993 · 视知觉",
      title: "韦特海默连续性原则与 Field–Hayes–Hess 关联场",
      body: "1923 年韦特海默提出格式塔「良好连续性原则」，阐明大脑天生偏好沿平滑曲率追踪路径而非在锐角处折返；七十年后，Field、Hayes 与 Hess（1993）在《Vision Research》中以心理物理实验揭示视觉皮层存在「局部关联场」——只要相邻元素的切向顺滑衔接，即便彼此断开，也会自动融成一条显眼弧线。",
      cite: "核实出处：Wertheimer (1923) Psychologische Forschung 4:301–350；Field, Hayes & Hess (1993) Vision Research 33(2):173–193。",
      draw: () => `
        <rect x="20" y="20" width="380" height="220" rx="14" fill="#251758" stroke="#493884"/>
        <path d="M 62 190 Q 170 48 354 78" fill="none" stroke="rgba(255,196,170,0.32)" stroke-width="14" stroke-linecap="round"/>
        <g stroke="#FFC4AA" stroke-width="3.5" stroke-linecap="round">
          <line x1="64" y1="186" x2="84" y2="162"/>
          <line x1="98" y1="146" x2="122" y2="124"/>
          <line x1="140" y1="112" x2="168" y2="96"/>
          <line x1="190" y1="88" x2="220" y2="79"/>
          <line x1="244" y1="75" x2="275" y2="73"/>
          <line x1="298" y1="74" x2="330" y2="77"/>
        </g>
        <text x="210" y="218" fill="#D5C8EB" font-size="11" text-anchor="middle">局部关联场把共切短段瞬间缝合成单一弧流</text>
      `,
    },
    neuro: {
      year: "2006 / 2007 / 2013 · 神经美学",
      title: "Bar & Neta（2006/2007）与 Vartanian 等（2013）：为何曲线显亲和",
      body: "Bar 与 Neta（2006）在《Psychological Science》报告：受试者对曲线轮廓日常物品的偏好显著高于尖角轮廓，并提出尖角隐含潜在威胁的假说；两人次年在《Neuropsychologia》（2007）的 fMRI 研究进一步发现尖角轮廓引发更强的杏仁核激活。Vartanian 等人（2013）在《PNAS》对建筑室内空间的脑成像研究则表明，曲线轮廓空间显著更易被评为美观并激活与情绪奖赏相关的前扣带回（ACC），不过曲线并未直接改变行为上的进入/回避决定——它提升的是情绪愉悦与亲和感，而非万能的行为开关。",
      cite: "核实出处：Bar & Neta (2006) Psychological Science 17(8):645–648；Bar & Neta (2007) Neuropsychologia 45(10):2191–2200；Vartanian et al. (2013) PNAS 110(S2):10446–10453。",
      draw: () => `
        <rect x="20" y="20" width="380" height="220" rx="14" fill="#251758" stroke="#493884"/>
        <polygon points="70,180 112,68 158,180" fill="none" stroke="#9A88C4" stroke-width="2.4"/>
        <text x="114" y="206" fill="#D5C8EB" font-size="11" text-anchor="middle">尖角轮廓 · 警觉感强</text>
        <path d="M 220 180 C 220 82, 350 82, 350 180" fill="rgba(249,187,162,0.16)" stroke="#FFC4AA" stroke-width="3.4"/>
        <circle cx="285" cy="144" r="18" fill="#F9BBA2"/>
        <text x="285" y="206" fill="#FFC4AA" font-size="11" text-anchor="middle">曲线拱腔 · 美感与情绪愉悦</text>
      `,
    },
  };

  function select(id) {
    const item = ERAS[id];
    if (!item) return;
    yearEl.textContent = item.year;
    titleEl.textContent = item.title;
    bodyEl.textContent = item.body;
    citeEl.textContent = item.cite;
    stage.innerHTML = item.draw();
    for (const b of btns) b.setAttribute("aria-pressed", String(b.dataset.originId === id));
  }

  for (const b of btns) b.addEventListener("click", () => select(b.dataset.originId));
  select("hokusai");
}

// =========================================================
// 04 节：四景弧律对照卡（原海报四格「应用示例」× 死弧/活弧切换）
// =========================================================
export function initAppRhythmLab() {
  const tabBtns = [...document.querySelectorAll("[data-app-id]")];
  const modeBtns = [...document.querySelectorAll("[data-rhythm-mode]")];
  const svg = document.getElementById("lab-app-svg");
  const titleEl = document.getElementById("lab-app-title");
  const tagEl = document.getElementById("lab-app-tag");
  const descEl = document.getElementById("lab-app-desc");
  if (!tabBtns.length || !svg) return;

  let curApp = "poster";
  let curMode = "alive"; // "stiff" | "alive"

  const DATA = {
    poster: {
      title: "海报设计 · 弧线引导信息层级",
      stiffTag: "单调均粗 · 仅当分隔线",
      aliveTag: "起粗收细 · 托起焦点圆光",
      stiffDesc: "一条等宽僵直的细弧横在版面中间，既没有蓄力起点，也没有引导落点，标题、圆光和底注各占一角互不联动。",
      aliveDesc: "复刻 049 原海报底栏第一格：深靛展底上一道从左下蓄力起笔、向右上方收锋扫开的杏桃大弧，自然把大标、正文与右下薰衣草圆光串成一条扫读动线。",
      render: (alive) => alive
        ? `<rect x="70" y="16" width="220" height="228" rx="14" fill="#301C6A"/>
           <rect x="92" y="38" width="96" height="10" rx="3" fill="#EFE6F3"/>
           <rect x="92" y="56" width="66" height="6" rx="2" fill="#B2A0D4"/>
           <rect x="92" y="68" width="78" height="6" rx="2" fill="#B2A0D4"/>
           <path d="M 70 198 C 118 118, 210 92, 290 102 L 290 132 C 218 122, 136 146, 70 226 Z" fill="#F7B398"/>
           <circle cx="232" cy="186" r="30" fill="#B6A3DC"/>
           <rect x="92" y="214" width="44" height="5" rx="2" fill="#C9BAFF"/>`
        : `<rect x="70" y="16" width="220" height="228" rx="14" fill="#301C6A"/>
           <rect x="92" y="38" width="96" height="10" rx="3" fill="#EFE6F3"/>
           <rect x="92" y="56" width="66" height="6" rx="2" fill="#B2A0D4"/>
           <path d="M 88 130 Q 180 122 272 130" fill="none" stroke="#F7B398" stroke-width="3"/>
           <circle cx="180" cy="130" r="24" fill="#B6A3DC" opacity="0.85"/>
           <rect x="92" y="214" width="44" height="5" rx="2" fill="#C9BAFF"/>`,
    },
    photo: {
      title: "摄影构图 · 弧形引导视线流动",
      stiffTag: "平直地平线 · 缺少景深牵引",
      aliveTag: "弯岸引流 · 光圈旋弧聚焦",
      stiffDesc: "死平的水平海岸把画面一刀切开，前景与远方焦点之间缺乏连贯动线，眼睛停在画面边缘迟迟进不去。",
      aliveDesc: "对应原海报底栏第二格的旋弧镜头意识：利用弯曲公路、石桥或海湾弧线从前景一角优雅切入，把观者目光顺滑带向弯心远景。",
      render: (alive) => alive
        ? `<circle cx="180" cy="130" r="96" fill="#2A1958"/>
           <g transform="translate(180 130)">
             <path d="M -88 -26 L -12 -72 L 24 -20 Z" fill="#C0ACE2"/>
             <path d="M 10 -86 L 78 -30 L 22 14 Z" fill="#5E4699"/>
             <path d="M 84 -10 L 62 74 L 0 28 Z" fill="#F9BBA2"/>
             <path d="M 42 84 L -48 76 L -20 18 Z" fill="#46317E"/>
             <path d="M -66 64 L -88 -12 L -26 -2 Z" fill="#8C74BD"/>
             <circle cx="0" cy="0" r="28" fill="#EFE6F3"/>
             <circle cx="0" cy="0" r="12" fill="#F4A98C"/>
           </g>`
        : `<rect x="44" y="34" width="272" height="192" rx="14" fill="#3B2574"/>
           <line x1="44" y1="130" x2="316" y2="130" stroke="#EFE6F3" stroke-width="2.5"/>
           <circle cx="180" cy="130" r="14" fill="#F9BBA2"/>
           <line x1="44" y1="176" x2="316" y2="176" stroke="#7E67B8" stroke-width="1.5"/>`,
    },
    illustration: {
      title: "插画创作 · 弧线营造氛围与深度",
      stiffTag: "平行直带 · 前后层次压扁",
      aliveTag: "双弧叠韵 · 山影与弯河拉纵深",
      stiffDesc: "把山、水、路排成几道等距平行线后，画面的空气感与纵深立刻压平，既没有节奏起伏，也缺少叙事温度。",
      aliveDesc: "对应原海报底栏第三格：柔和拱起的暮山轮廓与前景由宽收窄的弯曲河光形成节奏呼应，两道不同粗细的弧线叠加出悠远空间。",
      render: (alive) => alive
        ? `<rect x="52" y="24" width="256" height="212" rx="18" fill="#F4E2E6"/>
           <circle cx="256" cy="58" r="26" fill="#F4A98C"/>
           <path d="M 52 166 Q 134 52 218 144 Q 262 114 308 148 L 308 236 L 52 236 Z" fill="#432C78"/>
           <path d="M 52 192 Q 168 158 308 192 L 308 236 L 52 236 Z" fill="#291759"/>
           <path d="M 192 156 Q 238 176 176 196 Q 112 214 146 236 L 194 236 Q 168 214 218 196 Q 262 178 206 156 Z" fill="#FBECE8"/>`
        : `<rect x="52" y="24" width="256" height="212" rx="18" fill="#F4E2E6"/>
           <circle cx="256" cy="58" r="24" fill="#F4A98C"/>
           <rect x="52" y="138" width="256" height="44" fill="#432C78"/>
           <rect x="52" y="182" width="256" height="54" fill="#291759"/>
           <rect x="166" y="182" width="24" height="54" fill="#FBECE8"/>`,
    },
    ui: {
      title: "界面设计 · 弧形提升界面亲和力",
      stiffTag: "生硬直框 · 视觉冷峻阻隔",
      aliveTag: "柔和弧头 · 留足呼吸与聚焦点",
      stiffDesc: "强行用锋利直角与满塞硬框分割引导页，新用户第一眼感受像后台报错面板，缺少亲近与引导节奏。",
      aliveDesc: "对应原海报底栏第四格：以柔和圆角外框与克制的顶弧头图软化界面边界，用单一杏桃视觉锚点引导视线落向主要操作，同时保留下方文字区规整易读。",
      render: (alive) => alive
        ? `<rect x="46" y="34" width="268" height="192" rx="22" fill="#D5C8EB" stroke="#261556" stroke-width="2"/>
           <path d="M 46 56 Q 46 34 68 34 L 292 34 Q 314 34 314 56 L 314 82 Q 180 108 46 82 Z" fill="#261556"/>
           <circle cx="72" cy="58" r="5" fill="#F9BBA2"/>
           <circle cx="88" cy="58" r="5" fill="#C0ACE2"/>
           <circle cx="88" cy="134" r="18" fill="#4B3391"/>
           <circle cx="88" cy="182" r="18" fill="#4B3391"/>
           <rect x="124" y="114" width="166" height="44" rx="14" fill="#F7F3FA"/>
           <circle cx="264" cy="136" r="14" fill="#F4A98C"/>
           <rect x="124" y="174" width="136" height="8" rx="4" fill="#6F5B91"/>
           <rect x="124" y="190" width="96" height="8" rx="4" fill="#927EB8"/>`
        : `<rect x="46" y="34" width="268" height="192" rx="0" fill="#D5C8EB" stroke="#261556" stroke-width="2"/>
           <rect x="46" y="34" width="268" height="40" fill="#261556"/>
           <rect x="64" y="92" width="110" height="54" fill="#F7F3FA" stroke="#261556"/>
           <rect x="184" y="92" width="112" height="54" fill="#F7F3FA" stroke="#261556"/>
           <rect x="64" y="158" width="232" height="52" fill="#F7F3FA" stroke="#261556"/>`,
    },
  };

  function render() {
    const item = DATA[curApp];
    const alive = curMode === "alive";
    titleEl.textContent = item.title;
    tagEl.textContent = alive ? item.aliveTag : item.stiffTag;
    tagEl.dataset.tone = alive ? "ok" : "err";
    descEl.textContent = alive ? item.aliveDesc : item.stiffDesc;
    svg.innerHTML = item.render(alive);
    for (const b of tabBtns) b.setAttribute("aria-pressed", String(b.dataset.appId === curApp));
    for (const b of modeBtns) b.setAttribute("aria-pressed", String(b.dataset.rhythmMode === curMode));
  }

  for (const b of tabBtns) b.addEventListener("click", () => { curApp = b.dataset.appId; render(); });
  for (const b of modeBtns) b.addEventListener("click", () => { curMode = b.dataset.rhythmMode; render(); });
  render();
}

// =========================================================
// 05 节：禁用场景压测台（三稿件 × 强套翻车 vs 克制重构）
// =========================================================
export function initAntiCasesLab() {
  const caseBtns = [...document.querySelectorAll("[data-anti-id]")];
  const stateBtns = [...document.querySelectorAll("[data-anti-mode]")];
  const svg = document.getElementById("lab-anti-svg");
  const verdictEl = document.getElementById("lab-anti-verdict");
  const metricEl = document.getElementById("lab-anti-metric");
  const noteEl = document.getElementById("lab-anti-note");
  if (!caseBtns.length || !svg) return;

  let curCase = "table";
  let curMode = "bad"; // "bad" | "good"

  const CASES = {
    table: {
      badVerdict: "强套大弧：边角单元格被裁切，纵列基线全乱",
      goodVerdict: "克制重构：回归正交网格，纵横比对零阻力",
      badMetric: "可用格损约 24% · 基准列错位",
      goodMetric: "可用格 100% · 基准列严丝对齐",
      badNote: "财务参数表、比价清单需要眼睛沿垂直列迅速比对数值；套上大弧容器后，顶部与边角格子被迫缩行或裁角，好看没换来，读数效率先掉一截。",
      goodNote: "数据密集型版面直接交给清晰的横纵格线，把弧线留给真正需要情绪引导的封面或图表曲线本身。",
      render: (bad) => bad
        ? `<defs><clipPath id="anti-clip-t"><path d="M 30 220 Q 190 22 350 220 L 350 226 L 30 226 Z"/></clipPath></defs>
           <rect x="20" y="18" width="340" height="214" rx="12" fill="#EFE6F3" stroke="#D1C2E2"/>
           <g opacity="0.28">
             <rect x="36" y="48" width="308" height="170" fill="#FFFFFF" stroke="#B82348" stroke-width="1.5"/>
             <line x1="36" y1="84" x2="344" y2="84" stroke="#B82348" stroke-dasharray="4 3"/>
             <line x1="36" y1="120" x2="344" y2="120" stroke="#927EB8"/>
             <line x1="36" y1="156" x2="344" y2="156" stroke="#927EB8"/>
             <line x1="36" y1="192" x2="344" y2="192" stroke="#927EB8"/>
             <text x="52" y="72" fill="#B82348" font-size="11" font-weight="700">Q1 表头与边角数据被弧线裁掉</text>
             <text x="52" y="108" fill="#3B2C66" font-size="11">指标 A　128.4　+9.2%</text>
             <text x="52" y="144" fill="#3B2C66" font-size="11">指标 B　094.1　-1.4%</text>
             <text x="52" y="180" fill="#3B2C66" font-size="11">指标 C　210.8　+14.0%</text>
           </g>
           <g clip-path="url(#anti-clip-t)">
             <rect x="36" y="48" width="308" height="170" fill="#FFFFFF" stroke="#B82348" stroke-width="2"/>
             <line x1="36" y1="84" x2="344" y2="84" stroke="#B82348" stroke-dasharray="4 3"/>
             <line x1="36" y1="120" x2="344" y2="120" stroke="#C0ACE2"/>
             <line x1="36" y1="156" x2="344" y2="156" stroke="#C0ACE2"/>
             <line x1="36" y1="192" x2="344" y2="192" stroke="#C0ACE2"/>
             <text x="52" y="72" fill="#B82348" font-size="11">Q1 表头与边角数据被弧线裁掉</text>
             <text x="52" y="108" fill="#3B2C66" font-size="11">指标 A　128.4　+9.2%</text>
             <text x="52" y="144" fill="#3B2C66" font-size="11">指标 B　094.1　-1.4%</text>
             <text x="52" y="180" fill="#3B2C66" font-size="11">指标 C　210.8　+14.0%</text>
           </g>
           <path d="M 30 220 Q 190 22 350 220" fill="none" stroke="#B82348" stroke-width="2.6" stroke-dasharray="6 4"/>`
        : `<rect x="20" y="18" width="340" height="214" rx="10" fill="#FFFFFF" stroke="#261556" stroke-width="1.6"/>
           <rect x="20" y="18" width="340" height="38" rx="10" fill="#261556"/>
           <text x="40" y="42" fill="#F7F3FA" font-size="12" font-weight="700">季度核心指标</text>
           <text x="206" y="42" fill="#FFC4AA" font-size="11">实测值</text>
           <text x="286" y="42" fill="#FFC4AA" font-size="11">同比</text>
           <line x1="32" y1="98" x2="348" y2="98" stroke="#E2D6EE"/>
           <line x1="32" y1="140" x2="348" y2="140" stroke="#E2D6EE"/>
           <line x1="32" y1="182" x2="348" y2="182" stroke="#E2D6EE"/>
           <text x="40" y="82" fill="#180B42" font-size="12">指标 A · 交付准时率</text><text x="206" y="82" fill="#180B42" font-size="12">96.4%</text><text x="286" y="82" fill="#116351" font-size="12">+4.2%</text>
           <text x="40" y="124" fill="#180B42" font-size="12">指标 B · 复购留存</text><text x="206" y="124" fill="#180B42" font-size="12">68.1%</text><text x="286" y="124" fill="#116351" font-size="12">+2.8%</text>
           <text x="40" y="166" fill="#180B42" font-size="12">指标 C · 返工工时</text><text x="206" y="166" fill="#180B42" font-size="12">14.2 h</text><text x="286" y="166" fill="#116351" font-size="12">-11.0%</text>
           <text x="40" y="208" fill="#180B42" font-size="12">指标 D · 客诉响应</text><text x="206" y="208" fill="#180B42" font-size="12">8 min</text><text x="286" y="208" fill="#116351" font-size="12">-35.0%</text>`,
    },
    warning: {
      badVerdict: "强套柔弧：安全警示变成了咖啡馆招牌",
      goodVerdict: "克制重构：锐角直框守住警觉与紧迫感",
      badMetric: "警示锐度严重削弱",
      goodMetric: "一眼识别警戒边界",
      badNote: "Bar & Neta（2006）指出柔和曲线会降低威胁感知。如果高压电、急诊分诊或高危操作确认弹窗也裹上圆润彩弧，读者潜意识会把它当成轻松提示而放松警惕。",
      goodNote: "需要「立刻停下来核对」的警示与工业标识，理应回归锐利直框、高反差斜线或明确三角警示框。",
      render: (bad) => bad
        ? `<rect x="24" y="22" width="332" height="206" rx="48" fill="#FAF0EC" stroke="#F4A98C" stroke-width="3"/>
           <path d="M 44 172 Q 190 72 336 172" fill="none" stroke="#F4A98C" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
           <text x="190" y="114" fill="#9E371E" font-size="17" font-weight="700" text-anchor="middle">高压配电 · 请勿靠近</text>
           <text x="190" y="144" fill="#5D4478" font-size="12" text-anchor="middle">柔弧与大圆角把严肃警戒削弱成了温馨提示</text>`
        : `<rect x="24" y="22" width="332" height="206" fill="#180B42" stroke="#B82348" stroke-width="4"/>
           <rect x="24" y="22" width="332" height="44" fill="#B82348"/>
           <text x="190" y="50" fill="#FFFFFF" font-size="15" font-weight="800" text-anchor="middle">WARNING · 高压危险区域</text>
           <polygon points="88,162 120,104 152,162" fill="none" stroke="#FFC4AA" stroke-width="3.5"/>
           <text x="120" y="152" fill="#FFC4AA" font-size="24" font-weight="900" text-anchor="middle">!</text>
           <text x="176" y="128" fill="#F7F3FA" font-size="15" font-weight="700">高压配电 · 严禁靠近</text>
           <text x="176" y="154" fill="#D5C8EB" font-size="12">锐利边界与高反差瞬间拉响注意</text>`,
    },
    chaos: {
      badVerdict: "多弧混战：五条反向弧互相截断成乱麻",
      goodVerdict: "克制重构：只留一条主弧统领全局",
      badMetric: "5 处交叉冲突 · 无主视线",
      goodMetric: "0 冲突 · 单一主势直达焦点",
      badNote: "新手常以为「一条弧好看，五条弧更丰富」。一旦出现多条曲率各异、朝向相反的强弧交叉切割，眼睛在每个交点都会被迫停车改道，整页瞬间失去主角。",
      goodNote: "真正高级的弧形构图往往「一条主弧定乾坤，至多配一条同向轻伴弧」：把主角稳放凹侧弯心，其余留白呼吸。",
      render: (bad) => bad
        ? `<rect x="24" y="20" width="332" height="210" rx="14" fill="#EFE6F3" stroke="#D1C2E2"/>
           <path d="M 30 200 Q 150 20 340 160" fill="none" stroke="#261556" stroke-width="6"/>
           <path d="M 30 50 Q 190 240 346 60" fill="none" stroke="#9E371E" stroke-width="6"/>
           <path d="M 90 22 Q 310 120 74 224" fill="none" stroke="#5A429A" stroke-width="5"/>
           <path d="M 290 26 Q 90 125 312 222" fill="none" stroke="#B82348" stroke-width="4" stroke-dasharray="6 4"/>
           <circle cx="190" cy="126" r="22" fill="#F9BBA2"/>`
        : `<rect x="24" y="20" width="332" height="210" rx="14" fill="#EFE6F3" stroke="#D1C2E2"/>
           <path d="M 36 208 Q 130 48 338 52" fill="none" stroke="#261556" stroke-width="9" stroke-linecap="round"/>
           <path d="M 52 214 Q 144 68 326 68" fill="none" stroke="#F4A98C" stroke-width="2.2" stroke-linecap="round"/>
           <circle cx="238" cy="144" r="28" fill="#F4A98C"/>
           <rect x="210" y="182" width="56" height="6" rx="3" fill="#261556"/>`,
    },
  };

  function render() {
    const item = CASES[curCase];
    const bad = curMode === "bad";
    verdictEl.textContent = bad ? item.badVerdict : item.goodVerdict;
    verdictEl.dataset.tone = bad ? "err" : "ok";
    metricEl.textContent = bad ? item.badMetric : item.goodMetric;
    noteEl.textContent = bad ? item.badNote : item.goodNote;
    svg.innerHTML = item.render(bad);
    for (const b of caseBtns) b.setAttribute("aria-pressed", String(b.dataset.antiId === curCase));
    for (const b of stateBtns) b.setAttribute("aria-pressed", String(b.dataset.antiMode === curMode));
  }

  for (const b of caseBtns) b.addEventListener("click", () => { curCase = b.dataset.antiId; render(); });
  for (const b of stateBtns) b.addEventListener("click", () => { curMode = b.dataset.antiMode; render(); });
  render();
}

// =========================================================
// 06 节：单变量三题视觉辨析考场（绝无提示词标签）
// =========================================================
export function initQuiz() {
  const host = document.getElementById("quiz-host");
  const stepEl = document.getElementById("quiz-step");
  const promptEl = document.getElementById("quiz-prompt");
  const variableEl = document.getElementById("quiz-variable");
  const feedbackEl = document.getElementById("quiz-feedback");
  const nextBtn = document.getElementById("quiz-next");
  const restartBtn = document.getElementById("quiz-restart");
  if (!host || !promptEl) return;

  const QUESTIONS = [
    {
      variable: "唯一变量：落日焦点与主弧的相对位置",
      prompt: "以下四张海报的大弧完全相同，只移动了杏桃焦点圆的位置。哪一张最能发挥弧形构图的「引导与包围」？",
      answer: "C",
      options: [
        {
          id: "A",
          caption: "方案 A",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 18 118 Q 70 20 162 24" fill="none" stroke="#261556" stroke-width="7" stroke-linecap="round"/>
                <circle cx="48" cy="36" r="18" fill="#F4A98C"/>`,
          why: "不对：焦点落在主弧的凸背外侧。视线顺着大弧向右上方滑去时，会被弧背向外弹开，主体孤零零挂在左上角。",
        },
        {
          id: "B",
          caption: "方案 B",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 18 118 Q 70 20 162 24" fill="none" stroke="#261556" stroke-width="7" stroke-linecap="round"/>
                <circle cx="80" cy="48" r="18" fill="#F4A98C"/>`,
          why: "不对：焦点直接骑跨在弧脊线上，主弧像刀锋一样把焦点拦腰切断，边界互相打架，失去呼吸净空。",
        },
        {
          id: "C",
          caption: "方案 C",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 18 118 Q 70 20 162 24" fill="none" stroke="#261556" stroke-width="7" stroke-linecap="round"/>
                <circle cx="116" cy="84" r="18" fill="#F4A98C"/>`,
          why: "答对了！焦点稳稳安放在主弧凹侧弯心，与弧脊留出舒展净空，大弧既引流又温柔兜住视觉重心。",
        },
        {
          id: "D",
          caption: "方案 D",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 18 118 Q 70 20 162 24" fill="none" stroke="#261556" stroke-width="7" stroke-linecap="round"/>
                <circle cx="160" cy="118" r="18" fill="#F4A98C"/>`,
          why: "不对：焦点被挤到右下贴边死角，远离主弧的怀抱范围，大弧扫过画面后势能落了空。",
        },
      ],
    },
    {
      variable: "唯一变量：主弧的连续性与曲率质量",
      prompt: "四张画面的焦点位置完全一致，只改变了上方引导弧线的画法。哪一张最符合原海报 TIPS 的连续性要求？",
      answer: "D",
      options: [
        {
          id: "A",
          caption: "方案 A",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <polyline points="18,116 54,102 82,28 128,46 164,26" fill="none" stroke="#261556" stroke-width="6" stroke-linejoin="miter"/>
                <circle cx="114" cy="88" r="17" fill="#F4A98C"/>`,
          why: "不对：这是生硬的折角拼线（原海报 TIPS 第 4 个图示 ×）。锐角拐点会打断视觉连续性，让眼睛频频刹车。",
        },
        {
          id: "B",
          caption: "方案 B",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 18 116 Q 74 20 164 26" fill="none" stroke="#261556" stroke-width="6" stroke-dasharray="10 18"/>
                <circle cx="114" cy="88" r="17" fill="#F4A98C"/>`,
          why: "不对：虚线缺口拉得太宽（原海报 TIPS 第 3 个图示 ×），连贯势能被切碎，关联场弱化。",
        },
        {
          id: "C",
          caption: "方案 C",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <line x1="18" y1="116" x2="164" y2="26" stroke="#261556" stroke-width="6" stroke-linecap="round"/>
                <circle cx="114" cy="88" r="17" fill="#F4A98C"/>`,
          why: "不对：弧度被拉成一根直尺斜线，失去了凹侧包围感与柔和节奏，退化成了普通斜线分隔。",
        },
        {
          id: "D",
          caption: "方案 D",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 16 118 C 44 54, 96 24, 164 24 L 164 29 C 102 32, 54 62, 24 124 Z" fill="#261556"/>
                <circle cx="114" cy="88" r="17" fill="#F4A98C"/>`,
          why: "答对了！曲率一气呵成没有折角与宽断，而且起粗收细，既有自然顺滑的导流方向，又有书法般的节奏变化。",
        },
      ],
    },
    {
      variable: "唯一变量：弧线的跨幅与开放程度",
      prompt: "四张版面的焦点都处在弯心，只调整了弧线的跨幅与包角。哪一张保留了弧形构图特有的「延伸空间」？",
      answer: "C",
      options: [
        {
          id: "A",
          caption: "方案 A",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 78 62 Q 96 36 124 44" fill="none" stroke="#261556" stroke-width="5.5" stroke-linecap="round"/>
                <circle cx="104" cy="76" r="16" fill="#F4A98C"/>`,
          why: "不对：弧线跨幅太短，缩成一枚浮在半空的小括号装饰，完全撑不起整幅画面的空间骨架。",
        },
        {
          id: "B",
          caption: "方案 B",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 142 98 A 46 46 0 1 1 138 42" fill="none" stroke="#261556" stroke-width="6" stroke-linecap="round"/>
                <circle cx="102" cy="70" r="16" fill="#F4A98C"/>`,
          why: "不对：包角弯过了 240° 几乎首尾相接，退化成了封闭环形，把空间锁死在圈里而不是向画外延展。",
        },
        {
          id: "C",
          caption: "方案 C",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 14 114 Q 82 18 168 36" fill="none" stroke="#261556" stroke-width="6.5" stroke-linecap="round"/>
                <circle cx="104" cy="84" r="16" fill="#F4A98C"/>`,
          why: "答对了！大弧跨幅超过画面七成且两端舒展通向画外，既稳稳兜住弯心焦点，又把视野延展到画框之外。",
        },
        {
          id: "D",
          caption: "方案 D",
          svg: `<rect width="180" height="136" rx="8" fill="#EFE6F3"/>
                <path d="M 24 20 Q 82 68 24 118" fill="none" stroke="#261556" stroke-width="6" stroke-linecap="round"/>
                <path d="M 156 20 Q 98 68 156 118" fill="none" stroke="#261556" stroke-width="6" stroke-linecap="round"/>
                <circle cx="90" cy="69" r="16" fill="#F4A98C"/>`,
          why: "不对：两条背向而弯的弧把中间主体挤进狭窄漏斗，互相顶牛，既无单向引导也失去舒展包容。",
        },
      ],
    },
  ];

  let idx = 0;
  let score = 0;
  let answered = false;

  function render() {
    const q = QUESTIONS[idx];
    answered = false;
    stepEl.textContent = `小练习 ${idx + 1} / ${QUESTIONS.length} · 已答对 ${score} 题`;
    variableEl.textContent = q.variable;
    promptEl.textContent = q.prompt;
    feedbackEl.textContent = "挑一挑四张标本中最成立的一张，选完立刻看到几何归因。";
    feedbackEl.dataset.tone = "idle";
    nextBtn.hidden = true;
    restartBtn.hidden = true;

    host.innerHTML = "";
    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.choice = opt.id;
      btn.innerHTML = `
        <svg viewBox="0 0 180 136" class="quiz-svg" aria-hidden="true">${opt.svg}</svg>
        <span class="quiz-label">${opt.caption}</span>
      `;
      btn.addEventListener("click", () => choose(opt, btn));
      host.appendChild(btn);
    }
  }

  function choose(opt, btn) {
    if (answered) return;
    answered = true;
    const q = QUESTIONS[idx];
    const isRight = opt.id === q.answer;
    if (isRight) score++;
    stepEl.textContent = `小练习 ${idx + 1} / ${QUESTIONS.length} · 已答对 ${score} 题`;
    feedbackEl.textContent = opt.why;
    feedbackEl.dataset.tone = isRight ? "ok" : "err";

    for (const card of host.querySelectorAll(".quiz-card")) {
      card.disabled = true;
      if (card.dataset.choice === q.answer) card.dataset.state = "correct";
      else if (card === btn) card.dataset.state = "wrong";
    }
    if (idx < QUESTIONS.length - 1) {
      nextBtn.hidden = false;
    } else {
      restartBtn.hidden = false;
      feedbackEl.textContent += ` 本组三道小练习完成，共答对 ${score} / ${QUESTIONS.length} 题。`;
    }
  }

  nextBtn.addEventListener("click", () => {
    idx = (idx + 1) % QUESTIONS.length;
    render();
  });
  restartBtn.addEventListener("click", () => {
    idx = 0;
    score = 0;
    render();
  });

  render();
}

// =========================================================
// 07 节：原海报看图放大拖拽灯箱（draggable="false" + Esc 关闭）
// =========================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lb-close");
  const inBtn = document.getElementById("lb-zoom-in");
  const outBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  if (!trigger || !posterImg || !box || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    // 复用同一份内联 poster data URI，不重复打包图片
    if (lbImg.src !== posterImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    box.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  inBtn.addEventListener("click", () => { scale = Math.min(3.2, Number((scale + 0.4).toFixed(2))); apply(); });
  outBtn.addEventListener("click", () => {
    scale = Math.max(0.8, Number((scale - 0.4).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  });
  resetBtn.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  stage.addEventListener("click", (e) => {
    if (e.target === stage) close();
  });
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.2, scale - Math.sign(e.deltaY) * 0.18));
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  lbImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { lbImg.setPointerCapture(e.pointerId); } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  lbImg.addEventListener("pointerup", () => { dragging = false; });
  lbImg.addEventListener("pointercancel", () => { dragging = false; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}
