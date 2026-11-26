// 089 静态构图 · 01–07 节全部交互模块
// 每节使用不同交互机制，相邻节绝不重复同款控件；均支持键盘、触屏与 reduced-motion。

import { loop } from "../../lib/stage.js";
import { clamp, PALETTE } from "./model.js";

// ============================================================
// 01 节：斜线效应（Appelle 1972）四向光栅与极坐标敏感度对照
// ============================================================
const ORIENTATIONS = {
  0: {
    angle: 0,
    label: "0° 水平基准",
    sensitivity: "高（基准 100% 示意）",
    tag: "大地与地平线",
    note: "水平线与双眼连线、地球地平线完全平行。大脑几乎不需要做空间旋转运算就能瞬间确认“放平了”，因此产生最直接的安稳与休止感。",
  },
  90: {
    angle: 90,
    label: "90° 垂直基准",
    sensitivity: "高（约 96% 示意）",
    tag: "重力与直立建筑",
    note: "垂直线与人体直立姿势、物体受重力下坠的垂线重合。只要柱体严守 90°，观众直觉它承重稳固、不会倾覆，传递庄重与秩序。",
  },
  45: {
    angle: 45,
    label: "45° 右倾斜线",
    sensitivity: "较低（约 72% 示意）",
    tag: "斜向滑坠张力",
    note: "人眼初级视皮层调谐到斜向的神经元明显少于水平与垂直（Appelle 1972 综述的斜线效应）。45° 线条既更难精确判平，又会在重力联想下触发滑落与冲刺的动势。",
  },
  135: {
    angle: 135,
    label: "135° 左倾斜线",
    sensitivity: "较低（约 72% 示意）",
    tag: "反向失衡趋势",
    note: "与 45° 同属斜轴区间。用于强调速度、冲突或悬念时很有效，但如果用在需要可信、沉静、久看不累的版面上，持续的倾斜感会不断消耗注意力。",
  },
};

export function initOrientationLab() {
  const btns = [...document.querySelectorAll("[data-orient-btn]")];
  const gratingGroup = document.getElementById("orient-grating");
  const axisLine = document.getElementById("orient-polar-ray");
  const polarDot = document.getElementById("orient-polar-dot");
  const titleEl = document.getElementById("orient-read-title");
  const sensEl = document.getElementById("orient-read-sens");
  const noteEl = document.getElementById("orient-read-note");
  if (!btns.length || !gratingGroup) return;

  function renderOrient(deg) {
    const info = ORIENTATIONS[deg] || ORIENTATIONS[0];
    btns.forEach((b) => {
      const active = Number(b.dataset.orientBtn) === deg;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });

    // 旋转光栅组（绕中心 120, 120）
    gratingGroup.setAttribute("transform", `rotate(${deg} 120 120)`);
    const isCardinal = deg === 0 || deg === 90;
    gratingGroup.setAttribute("stroke", isCardinal ? PALETTE.slateDeep : PALETTE.bad);

    // 更新右侧极坐标敏锐度示意图上的当前方向指针（四叶玫瑰线示意：0°/90° 峰值高，45°/135° 内凹）
    const rad = (deg * Math.PI) / 180;
    const rFactor = 0.72 + 0.28 * Math.pow(Math.cos(2 * rad), 2);
    const R = 76 * rFactor;
    const cx = 120;
    const cy = 120;
    const x2 = cx + Math.cos(rad) * R;
    const y2 = cy - Math.sin(rad) * R;
    if (axisLine) {
      axisLine.setAttribute("x2", x2.toFixed(1));
      axisLine.setAttribute("y2", y2.toFixed(1));
      axisLine.setAttribute("stroke", isCardinal ? PALETTE.ok : PALETTE.bad);
    }
    if (polarDot) {
      polarDot.setAttribute("cx", x2.toFixed(1));
      polarDot.setAttribute("cy", y2.toFixed(1));
      polarDot.setAttribute("fill", isCardinal ? PALETTE.ok : PALETTE.bad);
    }

    if (titleEl) titleEl.textContent = `${info.label} · ${info.tag}`;
    if (sensEl) {
      sensEl.textContent = `朝向辨别敏锐度：${info.sensitivity}`;
      sensEl.dataset.state = isCardinal ? "ok" : "bad";
    }
    if (noteEl) noteEl.textContent = info.note;
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => renderOrient(Number(b.dataset.orientBtn)));
  });
  renderOrient(0);
}

// ============================================================
// 02 节：拆解原海报四要点 · 四枚原海报圆徽解剖切换器
// ============================================================
const PILLAR_DATA = {
  stability: {
    key: "stability",
    title: "稳定感",
    en: "ORTHOGONAL STABILITY",
    quote: "水平与垂直的结构关系，传递沉稳、可靠与安定的视觉感受。",
    explain:
      "静态构图的第一条底线是「横平竖直」。画面的主承重边与画框四边保持平行和垂直，所有立柱垂直落在地基水平线上，眼睛一进场就获得明确的重力坐标。",
    tip: "自检口诀：把画面缩到拇指大小，最粗的主轮廓线是不是依然严格横平竖直？",
  },
  balance: {
    key: "balance",
    title: "均衡性",
    en: "VISUAL EQUILIBRIUM",
    quote: "左右或上下要素的对称或均衡分布，形成视觉上的平衡与支撑。",
    explain:
      "均衡不只有「照镜子」这一种写法。你可以像 089 原海报那样左右严格对称，也可以用「重块靠中轴、轻块放远端」的非对称力矩抵消，只要画面不往任何一侧下坠，上下保持下沉上轻，就是稳固的静态均衡。",
    tip: "自检口诀：把整张图当成一块压在底边支点上的石板，想象松开手——它会往哪边翻？",
  },
  rhythm: {
    key: "rhythm",
    title: "平静节奏",
    en: "CALM REPETITION",
    quote: "重复的形状、间距与比例关系，营造平缓、有规律的视觉节奏。",
    explain:
      "看 089 原海报两侧各 4 根暖石竖柱：它们宽度相近、间隔均匀、顶高平齐，像古典神庙的廊柱一样让视线以恒定步频滑过。没有忽大忽小的骤停，平静感才会真正留下来。",
    tip: "自检口诀：重复元素之间的留白宽度尽量保持同一模数，不要同一排里忽挤忽松。",
  },
  order: {
    key: "order",
    title: "秩序结构",
    en: "STRUCTURAL ORDER",
    quote: "清晰的层级与模块组织，增强信息的可读性与整体的秩序感。",
    explain:
      "原海报把画面清晰分出「顶沿刊头—中段石碑立面—底段四柱暖石卡片—底部深青压脚带」四层，每一块都在同一垂直轴线和清晰底线上各就各位。模块界限明确，读者扫一眼就知道先看哪、再看哪。",
    tip: "自检口诀：减少多余斜切与跨区重叠，让每个信息模块都稳稳对齐网格基准线。",
  },
};

export function initAnatomyDeck() {
  const btns = [...document.querySelectorAll("[data-anatomy-btn]")];
  const layers = [...document.querySelectorAll("[data-anatomy-layer]")];
  const titleEl = document.getElementById("anatomy-title");
  const enEl = document.getElementById("anatomy-en");
  const quoteEl = document.getElementById("anatomy-quote");
  const explainEl = document.getElementById("anatomy-explain");
  const tipEl = document.getElementById("anatomy-tip");
  if (!btns.length) return;

  function select(key) {
    const item = PILLAR_DATA[key] || PILLAR_DATA.stability;
    btns.forEach((b) => {
      const on = b.dataset.anatomyBtn === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    layers.forEach((g) => {
      g.classList.toggle("is-lit", g.dataset.anatomyLayer === key);
    });
    if (titleEl) titleEl.textContent = item.title;
    if (enEl) enEl.textContent = item.en;
    if (quoteEl) quoteEl.textContent = `原海报：「${item.quote}」`;
    if (explainEl) explainEl.textContent = item.explain;
    if (tipEl) tipEl.textContent = item.tip;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.anatomyBtn)));
  select("stability");
}

// ============================================================
// 03 节：静态不等于死对称 · 视觉天平砝码台（2D Canvas）
// ============================================================
const SCALE_PAIRS = {
  tone: {
    id: "tone",
    label: "大浅块 vs 小深块",
    leftW: 94,
    leftH: 64,
    leftColor: "#DAD0C1",
    leftTone: 0.62,
    leftName: "浅暖石大块",
    rightW: 54,
    rightH: 54,
    rightColor: "#232021",
    rightTone: 1.52,
    rightName: "深炭黑小块",
    leftArm: 0.56,
    initRightArm: 0.88,
  },
  material: {
    id: "material",
    label: "灰绿长碑 vs 青石方墩",
    leftW: 78,
    leftH: 68,
    leftColor: "#8B9081",
    leftTone: 0.92,
    leftName: "鼠尾草长碑",
    rightW: 66,
    rightH: 52,
    rightColor: "#4A5E63",
    rightTone: 1.24,
    rightName: "深青石方墩",
    leftArm: 0.62,
    initRightArm: 0.34,
  },
  mirror: {
    id: "mirror",
    label: "同色同体镜像对照",
    leftW: 68,
    leftH: 56,
    leftColor: "#6D7B7E",
    leftTone: 1.05,
    leftName: "左青石块",
    rightW: 68,
    rightH: 56,
    rightColor: "#6D7B7E",
    rightTone: 1.05,
    rightName: "右青石块",
    leftArm: 0.64,
    initRightArm: 0.64,
  },
};

export function initBalanceScale() {
  const canvas = document.getElementById("scale-canvas");
  const rangeEl = document.getElementById("scale-arm-range");
  const armValEl = document.getElementById("scale-arm-val");
  const statusEl = document.getElementById("scale-status");
  const verdictEl = document.getElementById("scale-verdict");
  const pairBtns = [...document.querySelectorAll("[data-scale-pair]")];
  const autoBtn = document.getElementById("scale-auto-btn");
  if (!canvas || !rangeEl) return;

  const ctx = canvas.getContext("2d");
  let pair = SCALE_PAIRS.tone;
  let rightArm = pair.initRightArm;
  let currentAngle = 0;
  let dragging = false;

  function calcPhysics() {
    const leftMass = (pair.leftW * pair.leftH) / 4000 * pair.leftTone;
    const rightMass = (pair.rightW * pair.rightH) / 4000 * pair.rightTone;
    const leftTorque = leftMass * pair.leftArm;
    const rightTorque = rightMass * rightArm;
    const diffPct = ((rightTorque - leftTorque) / Math.max(0.2, leftTorque + rightTorque)) * 100;
    const targetArm = clamp((leftTorque / Math.max(0.1, rightMass)), 0.18, 0.94);
    const balanced = Math.abs(diffPct) <= 4.5;
    return { leftMass, rightMass, leftTorque, rightTorque, diffPct, targetArm, balanced };
  }

  function updateReadout() {
    const phy = calcPhysics();
    rangeEl.value = String(Math.round(rightArm * 100));
    if (armValEl) armValEl.textContent = `${Math.round(rightArm * 100)}% 杠杆距`;
    if (statusEl) {
      statusEl.textContent = phy.balanced
        ? `视觉天平归零 · 非对称平衡成立（Δ ${phy.diffPct >= 0 ? "+" : ""}${phy.diffPct.toFixed(1)}% 示意）`
        : `天平向${phy.diffPct > 0 ? "右" : "左"}倾沉（Δ ${phy.diffPct > 0 ? "+" : ""}${phy.diffPct.toFixed(1)}% 示意）`;
      statusEl.dataset.state = phy.balanced ? "ok" : "bad";
    }
    if (verdictEl) {
      if (phy.balanced) {
        verdictEl.textContent =
          pair.id === "mirror"
            ? "左右体量、明度与力臂全部相等——这是最省心的对称静态平衡，庄重但变化最少。"
            : `面积差了近一半，但${pair.rightName}更暗更重，把它放在 ${Math.round(rightArm * 100)}% 力臂处时，刚好与左侧 ${Math.round(pair.leftArm * 100)}% 处的${pair.leftName}抵消归平。静态构图完全可以不对称！`;
      } else {
        verdictEl.textContent =
          phy.diffPct > 0
            ? `右侧力矩过沉。把「${pair.rightName}」往中间支点拉近（减小力臂到约 ${Math.round(phy.targetArm * 100)}%），横梁就能稳稳端平。`
            : `右侧力矩偏轻。把「${pair.rightName}」往外推远（加长力臂到约 ${Math.round(phy.targetArm * 100)}%），利用杠杆补足视觉分量。`;
      }
    }
  }

  function draw(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(210, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const phy = calcPhysics();
    const targetRad = clamp(phy.diffPct / 28, -1, 1) * 0.22;
    if (still || dt === 0) currentAngle = targetRad;
    else currentAngle += (targetRad - currentAngle) * Math.min(1, dt * 10);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#243237";
    ctx.fillRect(0, 0, w, h);

    // 柔和水平基准虚线
    const cx = w * 0.5;
    const pivotY = h * 0.68;
    const halfBeam = Math.min(w * 0.41, 230);

    ctx.strokeStyle = phy.balanced ? "rgba(126, 214, 182, 0.42)" : "rgba(242, 236, 225, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx - halfBeam - 18, pivotY);
    ctx.lineTo(cx + halfBeam + 18, pivotY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 底座三角形支点（呼应 089 原海报「稳定感」圆徽）
    ctx.fillStyle = "#8B9081";
    ctx.beginPath();
    ctx.moveTo(cx, pivotY + 2);
    ctx.lineTo(cx - 18, pivotY + 34);
    ctx.lineTo(cx + 18, pivotY + 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#414544";
    ctx.fillRect(cx - halfBeam * 0.65, pivotY + 34, halfBeam * 1.3, 6);

    // 旋转天平横梁与两块视觉色块
    ctx.save();
    ctx.translate(cx, pivotY);
    ctx.rotate(currentAngle);

    // 标尺刻线
    ctx.strokeStyle = phy.balanced ? PALETTE.darkOk : "#E8E1D4";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-halfBeam, 0);
    ctx.lineTo(halfBeam, 0);
    ctx.stroke();

    // 刻点
    ctx.fillStyle = "rgba(242, 236, 225, 0.45)";
    for (const frac of [-0.8, -0.6, -0.4, -0.2, 0.2, 0.4, 0.6, 0.8]) {
      ctx.fillRect(frac * halfBeam - 1, 4, 2, 6);
    }

    const scaleK = Math.min(1, halfBeam / 185);
    // 左块（固定参考）
    const lx = -pair.leftArm * halfBeam;
    const lw = pair.leftW * scaleK;
    const lh = pair.leftH * scaleK;
    ctx.fillStyle = pair.leftColor;
    ctx.fillRect(lx - lw / 2, -lh - 2, lw, lh);
    ctx.strokeStyle = "rgba(242, 236, 225, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(lx - lw / 2, -lh - 2, lw, lh);

    // 右块（可左右拖动）
    const rx = rightArm * halfBeam;
    const rw = pair.rightW * scaleK;
    const rh = pair.rightH * scaleK;
    ctx.fillStyle = pair.rightColor;
    ctx.fillRect(rx - rw / 2, -rh - 2, rw, rh);
    ctx.strokeStyle = phy.balanced ? PALETTE.darkOk : PALETTE.darkBad;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx - rw / 2, -rh - 2, rw, rh);

    // 右块可拖手柄微点
    ctx.fillStyle = phy.balanced ? PALETTE.darkOk : PALETTE.darkBad;
    ctx.beginPath();
    ctx.arc(rx, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // 标注两块名字与力臂
    ctx.font = `700 11px "Space Mono", monospace`;
    ctx.fillStyle = "#F2ECE1";
    ctx.textAlign = "center";
    ctx.fillText(`L ${Math.round(pair.leftArm * 100)}%`, lx, 22);
    ctx.fillStyle = phy.balanced ? PALETTE.darkOk : PALETTE.darkBad;
    ctx.fillText(`R ${Math.round(rightArm * 100)}%`, rx, 22);

    ctx.restore();

    // 顶部简短读数
    ctx.font = `700 12px "Space Mono", monospace`;
    ctx.fillStyle = phy.balanced ? PALETTE.darkOk : "#D8CFC0";
    ctx.textAlign = "left";
    ctx.fillText(phy.balanced ? "EQUILIBRIUM · 0.0°" : `TILT ${(currentAngle * 180 / Math.PI).toFixed(1)}°`, 14, 22);
    ctx.textAlign = "right";
    ctx.fillStyle = "#C9D3D6";
    ctx.fillText("横拖右侧色块或拨动滑轨", w - 14, 22);

    ctx.restore();
  }

  const ctrl = loop(canvas, draw);

  function setArm(next) {
    rightArm = clamp(next, 0.18, 0.94);
    updateReadout();
    ctrl.draw();
  }

  rangeEl.addEventListener("input", () => setArm(Number(rangeEl.value) / 100));

  pairBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      pair = SCALE_PAIRS[btn.dataset.scalePair] || SCALE_PAIRS.tone;
      pairBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      setArm(pair.initRightArm);
    });
  });

  if (autoBtn) {
    autoBtn.addEventListener("click", () => {
      const phy = calcPhysics();
      setArm(phy.targetArm);
    });
  }

  // 直接在天平画布上横拖右侧色块调整力臂
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    const r = canvas.getBoundingClientRect();
    const halfBeam = Math.min(r.width * 0.41, 230);
    const arm = (e.clientX - r.left - r.width * 0.5) / halfBeam;
    if (arm > 0.08) setArm(arm);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const halfBeam = Math.min(r.width * 0.41, 230);
    const arm = (e.clientX - r.left - r.width * 0.5) / halfBeam;
    setArm(arm);
  });
  const endDrag = () => {
    dragging = false;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  updateReadout();
  ctrl.draw();
}

// ============================================================
// 04 节：历史溯源里程碑切换（严格核实出处 + 建筑几何线稿）
// ============================================================
const ERAS = {
  vitruvius: {
    year: "约前 1 世纪",
    who: "维特鲁威 · 《建筑十书》",
    en: "VITRUVIUS · DE ARCHITECTURA",
    summary:
      "古罗马建筑师维特鲁威把「模数对称（symmetria）」与「外观和谐（eurhythmia）」定为建筑立面的核心准则：整座神庙以列柱直径为基准单位，在水平基台与垂直柱廊间建立稳固不可动摇的秩序。",
    takeaway: "给平面设计的遗产：把重复间距锁进同一模数，水平底基永远托住垂直立柱。",
  },
  palladio: {
    year: "1570",
    who: "安德烈亚·帕拉第奥 · 《建筑四书》",
    en: "ANDREA PALLADIO · I QUATTRO LIBRI (VENICE, 1570)",
    summary:
      "文艺复兴建筑大师帕拉第奥在威尼斯出版《建筑四书》，用木刻平立面图系统化了中轴对称与静衡比例（如圆厅别墅）。这种以方形、圆形与轴线构建的庄重静谧感，成为后来数百年纪念碑与典籍版式的母本。",
    takeaway: "给平面设计的遗产：中轴居中 + 阶梯式层高收束，天然自带纪念碑般的庄重与可信度。",
  },
  mondrian: {
    year: "1917–1920",
    who: "彼埃特·蒙德里安 · 风格派新造型主义",
    en: "PIET MONDRIAN · DE STIJL / NEO-PLASTICISM",
    summary:
      "蒙德里安在荷兰《风格》杂志系统提出新造型主义：彻底剔除斜线与写实轮廓，只保留严格正交的水平线与垂直线，靠不对称的大小色块互相抵消，证明「纯正交静态结构」无需死板对称也能充满秩序张力。",
    takeaway: "给平面设计的遗产：水平代表大地、垂直代表直立，仅靠直角分割与色块权重就能撑起整张版面。",
  },
  perception: {
    year: "1954–1973",
    who: "阿恩海姆 / Appelle / 唐迪斯 · 视知觉定论",
    en: "ARNHEIM (1954/74) · APPELLE (1972) · DONDIS (1973)",
    summary:
      "鲁道夫·阿恩海姆《艺术与视知觉》揭示画框内的「结构骨架」与垂直重力不对称；Stuart Appelle（1972，《Psychological Bulletin》）综述命名了人眼对水平垂直更敏锐的「斜线效应」；Donis A. Dondis（1973，MIT Press《视觉素养入门》）将静态平抑（Leveling）与动态锐化（Sharpening）正式并立为视觉语法两极。",
    takeaway: "给平面设计的遗产：静态构图不是审美偏好，而是顺应大脑神经编码与重力直觉的低认知负荷解法。",
  },
};

export function initHistoryTimeline() {
  const btns = [...document.querySelectorAll("[data-era-btn]")];
  const svgs = [...document.querySelectorAll("[data-era-svg]")];
  const yearEl = document.getElementById("era-year");
  const whoEl = document.getElementById("era-who");
  const enEl = document.getElementById("era-en");
  const summaryEl = document.getElementById("era-summary");
  const takeawayEl = document.getElementById("era-takeaway");
  if (!btns.length) return;

  function showEra(key) {
    const item = ERAS[key] || ERAS.vitruvius;
    btns.forEach((b) => {
      const on = b.dataset.eraBtn === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    svgs.forEach((el) => {
      el.hidden = el.dataset.eraSvg !== key;
    });
    if (yearEl) yearEl.textContent = item.year;
    if (whoEl) whoEl.textContent = item.who;
    if (enEl) enEl.textContent = item.en;
    if (summaryEl) summaryEl.textContent = item.summary;
    if (takeawayEl) takeawayEl.textContent = item.takeaway;
  }

  btns.forEach((b) => b.addEventListener("click", () => showEra(b.dataset.eraBtn)));
  showEra("vitruvius");
}

// ============================================================
// 05 节：何时用、何时别用 · 静构 vs 破轴双语境试映对照
// ============================================================
const COMPARE_CASES = {
  museum: {
    label: "建筑博物馆常设展",
    staticVerdict: "契合：水平基座与垂直柱格把“混凝土与光”的建筑质感直接立住，沉静、耐看、像一本可以收藏的展册。",
    brokenVerdict: "违和：整块展墙与标题生硬斜倾 14°，稳重气质立刻变得焦躁轻浮，像是误用了促销传单的模板。",
    staticFit: "ok",
    brokenFit: "bad",
    kicker: "PERMANENT EXHIBITION · 2026",
    title: "静土与光影",
    sub: "建筑立面与空间秩序回顾展",
  },
  marathon: {
    label: "城市半程马拉松赛",
    staticVerdict: "违和：四平八稳、横平竖直的石碑结构把奔跑的冲刺感完全冻住，像一份严肃的行政公告而非体育赛事。",
    brokenVerdict: "契合：打破水平基准引入 14° 前冲斜轴，视线瞬间顺着起跑方向前冲——这正是该交给「090 动态构图」的场合。",
    staticFit: "bad",
    brokenFit: "ok",
    kicker: "NIGHT RUN · 21.0975 KM",
    title: "破风半程赛",
    sub: "城市午夜竞速与耐力挑战",
  },
};

export function initContextSwitch() {
  const topicBtns = [...document.querySelectorAll("[data-ctx-topic]")];
  const modeBtns = [...document.querySelectorAll("[data-ctx-mode]")];
  const posterCard = document.getElementById("ctx-poster");
  const kickerEl = document.getElementById("ctx-kicker");
  const titleEl = document.getElementById("ctx-title");
  const subEl = document.getElementById("ctx-sub");
  const badgeEl = document.getElementById("ctx-fit-badge");
  const verdictEl = document.getElementById("ctx-verdict");
  if (!posterCard || !topicBtns.length) return;

  let topic = "museum";
  let mode = "static";

  function render() {
    const info = COMPARE_CASES[topic];
    topicBtns.forEach((b) => {
      const on = b.dataset.ctxTopic === topic;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    modeBtns.forEach((b) => {
      const on = b.dataset.ctxMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    posterCard.dataset.topic = topic;
    posterCard.dataset.mode = mode;
    if (kickerEl) kickerEl.textContent = info.kicker;
    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.sub;

    const isFit = (mode === "static" ? info.staticFit : info.brokenFit) === "ok";
    if (badgeEl) {
      badgeEl.textContent = isFit ? "适配当前气质" : "气质错配";
      badgeEl.dataset.state = isFit ? "ok" : "bad";
    }
    if (verdictEl) {
      verdictEl.textContent = mode === "static" ? info.staticVerdict : info.brokenVerdict;
    }
  }

  topicBtns.forEach((b) => b.addEventListener("click", () => { topic = b.dataset.ctxTopic; render(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.ctxMode; render(); }));
  render();
}

// ============================================================
// 06 节：小练习（严格单一变量：主重块垂直落位高度）
// ============================================================
const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "方案 A 不够稳：重块压在顶部（重心偏高约 68%）",
    body: "虽然四平八稳、左右对称，但面积最大且最暗的深青石板块压在最上方，下方仅靠细窄柱脚承托。在阿恩海姆所述的视觉重力里，上重下轻会持续制造「即将坠落」的紧张感，违背静态构图追求的沉稳踏实。",
  },
  B: {
    ok: false,
    title: "方案 B 略显悬空：重块停在几何正中（重心约 50%）",
    body: "几何居中常常被误认为最稳，但当深色重块悬在画幅正中、下方空出一大截空白时，主块会显得像飘在半空没有落地，缺少「坐实大地」的厚重感。",
  },
  C: {
    ok: true,
    title: "答对了！方案 C 最稳固：重块稳坐下三分之一地基线（重心约 34%）",
    body: "四张图的文字、配色、面积、对称与 0° 正交全无二致，唯一差别是重块的垂直落位。方案 C 把深色大重块稳稳压在留有适当底边距的下三分之一基座上，上方留出通透静谧的呼吸空间，既顺应视觉重力，又不显得压迫。",
  },
  D: {
    ok: false,
    title: "方案 D 过度下沉：重块贴死底边（0px 底距裁断）",
    body: "压低重心并不等于把重块直接推到画框最底沿。完全贴死下边会让石块看起来像滑出画框、被意外切掉一截，丧失了完整地基线与外框之间的秩序留白。",
  },
};

export function initQuiz() {
  const cards = [...document.querySelectorAll("[data-quiz-choice]")];
  const resultBox = document.getElementById("quiz-result");
  const resultTitle = document.getElementById("quiz-result-title");
  const resultBody = document.getElementById("quiz-result-body");
  const guideBtn = document.getElementById("quiz-guides-btn");
  const gridEl = document.getElementById("quiz-grid");
  if (!cards.length || !resultBox) return;

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.quizChoice;
      const fb = QUIZ_FEEDBACK[choice];
      if (!fb) return;

      cards.forEach((c) => {
        const key = c.dataset.quizChoice;
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", String(key === choice));
        if (key === choice) c.classList.add("is-picked", fb.ok ? "is-correct" : "is-wrong");
        if (key === "C" && !fb.ok) c.classList.add("is-correct");
      });

      resultBox.hidden = false;
      resultBox.dataset.state = fb.ok ? "ok" : "bad";
      if (resultTitle) resultTitle.textContent = fb.title;
      if (resultBody) resultBody.textContent = fb.body;
      if (guideBtn) guideBtn.hidden = false;
    });
  });

  if (guideBtn && gridEl) {
    guideBtn.addEventListener("click", () => {
      const on = gridEl.classList.toggle("show-cog");
      guideBtn.setAttribute("aria-pressed", String(on));
      guideBtn.textContent = on ? "隐藏重心标线" : "叠看四图重心标线";
    });
  }
}

// ============================================================
// 07 节：原海报灯箱（点击放大、拖动、缩放、Esc 关闭）
// ============================================================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const stage = document.getElementById("lb-stage");
  if (!poster || !dialog || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    if (!lbImg.src || lbImg.src !== poster.src) lbImg.src = poster.src;
    resetView();
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function close() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  poster.addEventListener("click", open);
  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      close();
    }
  });

  if (zoomInBtn) zoomInBtn.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3); applyTransform(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  if (resetBtn) resetBtn.addEventListener("click", resetView);

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.18 : -0.18), 1, 3);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    pan = { id: e.pointerId, x: e.clientX - tx, y: e.clientY - ty };
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    applyTransform();
  });
  const endPan = () => { pan = null; };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);
}
