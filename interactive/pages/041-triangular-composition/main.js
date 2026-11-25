// 041 三角构图 · 主交互编排（开场单真源联动 + 八节独立互动装置 + 原海报灯箱）
import { PRESETS, cloneState, evaluateTriangle } from "./model.js";
import { createHeroStage } from "./heroStage.js";

// ==================== 1. 开场三角力学台与全页联动 ====================
const heroCanvas = document.getElementById("hero-canvas");
const dotMatrixEl = document.getElementById("hero-dot-matrix");

// 初始化 1:1 原海报右上 4×4 圆点矩阵（16 枚圆点）
// 随 1..4 项通过逐步点亮一个等腰三角形图案的金色圆点
const TRI_DOT_GROUPS = [
  [1, 2],           // 1 项通过：顶端两点
  [5, 6],           // 2 项通过：腰部
  [8, 9, 10, 11],   // 3 项通过：中下展宽
  [12, 13, 14, 15], // 4 项全通过：宽稳底排
];
const dotEls = [];
for (let i = 0; i < 16; i++) {
  const d = document.createElement("span");
  d.className = "dot-cell";
  dotMatrixEl.appendChild(d);
  dotEls.push(d);
}

const elStatusPill = document.getElementById("hero-status-pill");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagHeadline = document.getElementById("diag-headline");
const elDiagExplanation = document.getElementById("diag-explanation");
const elDiagHint = document.getElementById("diag-hint");
const elFixBtn = document.getElementById("btn-fix-next");
const elMApex = document.getElementById("m-apex");
const elMTilt = document.getElementById("m-tilt");
const elMArea = document.getElementById("m-area");
const elMGrade = document.getElementById("m-grade");
const elTipsLive = document.getElementById("tips-live");
const elHierarchyRange = document.getElementById("hierarchy-range");
const elHierarchyVal = document.getElementById("hierarchy-val");
const elToggleGuide = document.getElementById("toggle-guide");
const elTitleTriPoly = document.getElementById("title-tri-poly");
const elTitleTriApex = document.getElementById("title-tri-apex");
const elTitleTriF = document.getElementById("title-tri-f");

const pillarButtons = [...document.querySelectorAll(".pillar-item")];
const stepButtons = [
  document.getElementById("step-1"),
  document.getElementById("step-2"),
  document.getElementById("step-3"),
];

function syncHeroUI(state, ev) {
  const allOk = ev.passedCount === 4;

  // 状态简签与诊单头
  const pillText = `${ev.passedCount}/4 · ${ev.badgeShort}`;
  elStatusPill.textContent = pillText;
  elStatusPill.className = `status-pill ${allOk ? "is-ok" : "is-err"}`;

  elDiagBadge.textContent = pillText;
  elDiagBadge.className = `diag-badge ${allOk ? "is-ok" : "is-err"}`;

  elDiagHeadline.textContent = ev.headline;
  elDiagExplanation.textContent = ev.explanation;
  elDiagHint.textContent = ev.actionHint;

  if (ev.fixType !== "none") {
    elFixBtn.hidden = false;
    elFixBtn.textContent = ev.fixLabel;
  } else {
    elFixBtn.hidden = true;
  }

  // 四格单真源实测读数
  elMApex.textContent = `${Math.round(ev.apexDeg)}°`;
  elMTilt.textContent = `${ev.baseTiltDeg.toFixed(1)}°`;
  elMArea.textContent = `${Math.round(ev.areaPct)}%`;
  elMGrade.textContent = ev.stabilityGrade;

  // 刊头自示范微型三角徽实时随三顶点变形
  const mapX = (x) => (4 + x * 40).toFixed(1);
  const mapY = (y) => (4 + y * 34).toFixed(1);
  elTitleTriPoly.setAttribute(
    "points",
    `${mapX(state.a.x)},${mapY(state.a.y)} ${mapX(state.b.x)},${mapY(state.b.y)} ${mapX(state.c.x)},${mapY(state.c.y)}`
  );
  elTitleTriApex.setAttribute("cx", mapX(state.a.x));
  elTitleTriApex.setAttribute("cy", mapY(state.a.y));
  elTitleTriF.setAttribute("cx", mapX(state.f.x));
  elTitleTriF.setAttribute("cy", mapY(state.f.y));

  // 右上 4×4 圆点矩阵实时点亮金色三角
  const lit = new Set();
  for (let i = 0; i < ev.passedCount; i++) {
    for (const idx of TRI_DOT_GROUPS[i]) lit.add(idx);
  }
  dotEls.forEach((el, idx) => el.classList.toggle("is-gold", lit.has(idx)));

  // 左侧原海报四枚圆徽探针实时反馈
  for (const btn of pillarButtons) {
    const key = btn.dataset.pillar;
    const chk = ev.checks[key];
    btn.classList.toggle("is-ok", chk.ok);
    btn.classList.toggle("is-selected", state.highlight === key);
    const badge = btn.querySelector(`[data-badge="${key}"]`);
    if (badge) badge.textContent = chk.tag;
  }

  // 层级滑杆与框架开关同步
  if (Math.abs(parseFloat(elHierarchyRange.value) - state.hierarchy) > 0.02) {
    elHierarchyRange.value = state.hierarchy.toFixed(2);
  }
  elHierarchyVal.textContent = `${state.hierarchy.toFixed(1)}×`;

  elToggleGuide.classList.toggle("is-on", state.showGuide);
  elToggleGuide.setAttribute("aria-pressed", String(state.showGuide));
  elToggleGuide.textContent = state.showGuide ? "框架：显性" : "框架：隐性";

  // 底部 1→2→3 活体三步图示
  stepButtons.forEach((btn, idx) => {
    btn.classList.toggle("is-done", ev.steps[idx]);
  });

  // 底部 TIPS 随当前解态补充一句话
  if (allOk) {
    elTipsLive.textContent = ` 当前已达成「${ev.badgeShort}」，可试着关闭显性框架验证隐性三角是否依然稳健。`;
  } else {
    elTipsLive.textContent = "";
  }
}

const initialState = cloneState(PRESETS.initial, "landscape");
const heroStage = createHeroStage(heroCanvas, initialState, {
  onChange: syncHeroUI,
});

// 绑定左侧四圆徽高亮检验
pillarButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    heroStage.setHighlight(btn.dataset.pillar);
    syncHeroUI(heroStage.getState(), heroStage.getEval());
  });
});

// 绑定层级滑杆与框架显隐开关
elHierarchyRange.addEventListener("input", () => {
  heroStage.setHierarchy(parseFloat(elHierarchyRange.value));
});

elToggleGuide.addEventListener("click", () => {
  heroStage.setGuide(!heroStage.getState().showGuide);
});

// 绑定一步纠偏按钮
elFixBtn.addEventListener("click", () => {
  heroStage.fixNext();
});

// 绑定预设与试错快钮
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.preset;
    const preset = PRESETS[key];
    if (preset) heroStage.animateTo(preset);
  });
});

// 绑定原海报右侧三大场景切换图标
const sceneBtns = [...document.querySelectorAll(".scene-btn")];
sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const sc = btn.dataset.scene;
    sceneBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    heroStage.setScene(sc);
  });
});

// 绑定底部 1→2→3 三步活体卡点击演示对应阶段
stepButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const step = Number(btn.dataset.step);
    const cur = heroStage.getState();
    if (step === 1) {
      // 只把三角框架扶正拔起，焦点仍留待用户安放
      heroStage.animateTo({
        a: { x: 0.50, y: 0.17 },
        b: { x: 0.14, y: 0.84 },
        c: { x: 0.86, y: 0.84 },
        f: { ...cur.f },
        hierarchy: cur.hierarchy,
        showGuide: true,
      });
    } else if (step === 2) {
      heroStage.animateTo({
        a: { x: 0.50, y: 0.17 },
        b: { x: 0.14, y: 0.84 },
        c: { x: 0.86, y: 0.84 },
        f: { ...cur.f },
        hierarchy: 1.95,
        showGuide: true,
      });
    } else {
      heroStage.animateTo(PRESETS.poster);
    }
  });
});

// ==================== 2. 第 01 节：桁架推力与重心落点物理推演 ====================
const trussSvg = document.getElementById("truss-svg");
const trussReadout = document.getElementById("truss-readout");
const trussPushBtn = document.getElementById("truss-push-btn");
const trussBtns = [...document.querySelectorAll("[data-truss]")];

const TRUSS_DATA = {
  tri: {
    name: "正置宽三角（稳固基准）",
    idle: "三条边长互相顶锁，底宽充裕，重心 G 垂线正中落入地基，给眼睛强烈的踏实感。",
    pushed: "施加侧向推力后：斜杆把水平力分解为沿杆压力，形体几乎纹丝不动（倾角 0°），重心依然稳锁底边中央。",
    ok: true,
  },
  quad: {
    name: "无斜撑四边形（侧推失稳）",
    idle: "静止时看似方正，但四个角点缺少斜线锁死，视觉上容易松散成四块各自为政的区域。",
    pushed: "施加侧向推力后：立柱顺势向右偏斜 22° 塌成平行四边形，只有加上斜线拆分成三角形才能锁住结构。",
    ok: false,
  },
  inv: {
    name: "倒置尖底三角（悬垂易倾）",
    idle: "宽边在上、重心高悬，只靠底部一个尖点支撑，心理上天然紧绷。",
    pushed: "施加侧向推力后：重心 G 瞬间滑出支点右侧，整座三角形向左或右翻倒（偏倾 20°）——这正是 043 倒三角构图的悬念来源。",
    ok: false,
  },
  narrow: {
    name: "偏心窄三角（支撑段过短）",
    idle: "底边缩到不足画幅四分之一且顶点外甩，像一根斜插在土里的长标枪。",
    pushed: "施加侧向推力后：重心垂线立刻越过右侧底角支点，视觉上明显要向右倾覆。",
    ok: false,
  },
};

let trussMode = "tri";
let trussPushed = false;

function renderTruss() {
  const info = TRUSS_DATA[trussMode];
  trussReadout.innerHTML = `<strong>${info.name}</strong>${trussPushed ? info.pushed : info.idle}`;
  trussPushBtn.classList.toggle("is-pushed", trussPushed);
  trussPushBtn.setAttribute("aria-pressed", String(trussPushed));
  trussPushBtn.textContent = trussPushed ? "← 撤去侧向推力" : "施加侧向推力 →";

  const groundY = 278;
  let pts = [];
  let gPt = { x: 240, y: 200 };
  let stable = true;
  let forceY = 128;

  if (trussMode === "tri") {
    pts = [[240, 74], [116, groundY], [364, groundY]];
    gPt = { x: 240, y: 210 };
    stable = true;
  } else if (trussMode === "quad") {
    const shift = trussPushed ? 74 : 0;
    pts = [[145 + shift, 98], [335 + shift, 98], [335, groundY], [145, groundY]];
    gPt = { x: 240 + shift * 0.5, y: 188 };
    stable = !trussPushed;
    forceY = 112;
  } else if (trussMode === "inv") {
    const rot = trussPushed ? 0.34 : 0;
    const pivot = { x: 240, y: groundY };
    const raw = [[126, 86], [354, 86], [240, groundY]];
    pts = raw.map(([x, y]) => {
      const dx = x - pivot.x, dy = y - pivot.y;
      return [
        pivot.x + dx * Math.cos(rot) - dy * Math.sin(rot),
        pivot.y + dx * Math.sin(rot) + dy * Math.cos(rot),
      ];
    });
    gPt = {
      x: (pts[0][0] + pts[1][0] + pts[2][0]) / 3,
      y: (pts[0][1] + pts[1][1] + pts[2][1]) / 3,
    };
    stable = false;
    forceY = 104;
  } else {
    const shift = trussPushed ? 58 : 0;
    pts = [[292 + shift, 74], [190, groundY], [282, groundY]];
    gPt = {
      x: (pts[0][0] + pts[1][0] + pts[2][0]) / 3,
      y: (pts[0][1] + pts[1][1] + pts[2][1]) / 3,
    };
    stable = !trussPushed && gPt.x >= 200 && gPt.x <= 272;
  }

  const polyStr = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const accentCol = stable ? "#0E6345" : "#A62C1E";
  const fillCol = stable ? "rgba(6,43,32,0.12)" : "rgba(166,44,30,0.12)";

  const forceArrow = trussPushed
    ? `<g>
        <line x1="34" y1="${forceY}" x2="108" y2="${forceY}" stroke="#A62C1E" stroke-width="3.5" stroke-linecap="round"/>
        <polygon points="116,${forceY} 102,${forceY - 7} 102,${forceY + 7}" fill="#A62C1E"/>
        <text x="72" y="${forceY - 12}" text-anchor="middle" font-size="12" font-weight="700" fill="#A62C1E">侧向推力</text>
      </g>`
    : `<text x="24" y="34" font-size="12" font-family="JetBrains Mono, Noto Sans SC, monospace" fill="#354F46">静态平衡状态 · 点按「施加侧向推力」测试抗倾覆</text>`;

  const joints = pts
    .map(
      (p, i) =>
        `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="7" fill="${i === 0 ? "#D2971C" : "#062B20"}" stroke="#FBF7EF" stroke-width="2"/>`
    )
    .join("");

  trussSvg.innerHTML = `
    <rect x="0" y="0" width="480" height="340" fill="#F5ECDD"/>
    <line x1="36" y1="${groundY}" x2="444" y2="${groundY}" stroke="#062B20" stroke-width="2"/>
    ${Array.from({ length: 14 }, (_, i) => `<line x1="${52 + i * 28}" y1="${groundY}" x2="${42 + i * 28}" y2="${groundY + 11}" stroke="rgba(6,43,32,0.3)" stroke-width="1.2"/>`).join("")}
    ${forceArrow}
    <polygon points="${polyStr}" fill="${fillCol}" stroke="${accentCol}" stroke-width="3" stroke-linejoin="round"/>
    ${trussMode === "tri" ? `<line x1="116" y1="${groundY}" x2="364" y2="${groundY}" stroke="#0E6345" stroke-width="5"/>` : ""}
    <!-- 重心垂线 -->
    <line x1="${gPt.x.toFixed(1)}" y1="${gPt.y.toFixed(1)}" x2="${gPt.x.toFixed(1)}" y2="${groundY}" stroke="${accentCol}" stroke-width="2" stroke-dasharray="5 4"/>
    <circle cx="${gPt.x.toFixed(1)}" cy="${gPt.y.toFixed(1)}" r="8" fill="#D2971C" stroke="#062B20" stroke-width="1.8"/>
    <text x="${gPt.x.toFixed(1)}" y="${(gPt.y + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" font-weight="600" fill="#062B20">G</text>
    <circle cx="${gPt.x.toFixed(1)}" cy="${groundY}" r="5" fill="${accentCol}"/>
    ${joints}
    <text x="240" y="320" text-anchor="middle" font-size="13" font-weight="700" fill="${accentCol}">
      ${stable ? "重心垂线稳落底边支撑段内 · 抗倾覆成立" : "重心滑离支撑段或框架侧倾 · 视觉结构失稳"}
    </text>
  `;
}

trussBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    trussMode = btn.dataset.truss;
    trussBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderTruss();
  });
});

trussPushBtn.addEventListener("click", () => {
  trussPushed = !trussPushed;
  renderTruss();
});
renderTruss();

// ==================== 3. 第 02 节：显性与隐性三角 X 光刮帘 ====================
const xraySvg = document.getElementById("xray-svg");
const xrayRange = document.getElementById("xray-range");
const xrayPct = document.getElementById("xray-pct");
const xrayCaption = document.getElementById("xray-caption");
const xrayBtns = [...document.querySelectorAll("[data-xray]")];

const XRAY_SCENES = {
  mountain: {
    caption: "【显性三角】雪山轮廓本身就是天然的三角形：山巅即顶点，左右山脊线一路下探托出宽阔山脚，金色夕阳顺着受光面把注意力稳稳收进山心。",
    tri: [[260, 52], [72, 294], [448, 294]],
    focus: [260, 168],
    art: `
      <rect width="520" height="340" fill="#2A4A3C"/>
      <circle cx="260" cy="48" r="18" fill="#D2971C" opacity="0.9"/>
      <polygon points="40,340 165,165 260,64 360,188 485,340" fill="#102C21"/>
      <polygon points="260,64 218,162 155,248 232,216 268,155 294,205 274,126" fill="#E4CD98"/>
      <polygon points="360,188 332,240 374,255 398,220" fill="#CBB27A" opacity="0.72"/>
      <polygon points="0,340 110,262 248,290 385,254 520,340" fill="#071E16"/>
      <circle cx="260" cy="168" r="30" fill="#D2971C" opacity="0.22"/>
    `,
  },
  people: {
    caption: "【隐性三角】画面里没有任何一条三角形边框，但站立者的头顶与左右两位坐姿同伴（剪影，无五官）的肩线自然连成闭合三角，视线顺着三人朝向稳稳聚拢。",
    tri: [[260, 68], [108, 286], [412, 286]],
    focus: [260, 162],
    art: `
      <rect width="520" height="340" fill="#213E32"/>
      <rect x="0" y="274" width="520" height="66" fill="#0D261D"/>
      <circle cx="260" cy="148" r="108" fill="#E4CD98" opacity="0.14"/>
      <!-- 居中较高人物剪影（严守无五官） -->
      <ellipse cx="260" cy="96" rx="22" ry="26" fill="#071E16"/>
      <path d="M248,120 Q204,136 196,294 L324,294 Q316,136 272,120 Z" fill="#071E16"/>
      <!-- 左侧坐姿人物剪影 -->
      <ellipse cx="144" cy="176" rx="19" ry="22" fill="#133326"/>
      <path d="M134,196 Q94,212 86,298 L206,298 Q196,216 154,196 Z" fill="#133326"/>
      <!-- 右侧坐姿人物剪影 -->
      <ellipse cx="376" cy="182" rx="19" ry="22" fill="#133326"/>
      <path d="M366,202 Q326,218 318,298 L434,298 Q426,216 386,202 Z" fill="#133326"/>
      <!-- 暖金衣领光边 -->
      <path d="M242,76 A22,22 0 0 1 278,76" fill="none" stroke="#E8D09B" stroke-width="2.5"/>
    `,
  },
  still: {
    caption: "【隐性三角】桌面三件器物高低错落：高颈陶瓶定顶点、矮茶碗与书卷分守两底角，不用画一根框线，静物群便稳稳收拢成一座有呼吸的三角形。",
    tri: [[242, 62], [116, 282], [402, 282]],
    focus: [248, 162],
    art: `
      <rect width="520" height="340" fill="#E9DEC9"/>
      <rect x="0" y="254" width="520" height="86" fill="#D5C6AA"/>
      <ellipse cx="255" cy="284" rx="168" ry="16" fill="rgba(6,43,32,0.14)"/>
      <!-- 高颈深松绿花瓶 -->
      <path d="M226,80 L258,80 L252,132 Q284,166 280,224 Q276,276 242,276 Q208,276 204,224 Q200,166 232,132 Z" fill="#0B2E22"/>
      <ellipse cx="242" cy="80" rx="16" ry="5" fill="#2A4F40"/>
      <!-- 左下日轮金茶碗 -->
      <path d="M96,236 L176,236 Q172,282 136,282 Q100,282 96,236 Z" fill="#D2971C"/>
      <ellipse cx="136" cy="236" rx="40" ry="9" fill="#E8D09B"/>
      <!-- 右下精装书卷与果实 -->
      <rect x="314" y="248" width="112" height="28" fill="#1D4032"/>
      <rect x="318" y="253" width="104" height="5" fill="#E8D09B"/>
      <circle cx="352" cy="232" r="18" fill="#C98D19"/>
    `,
  },
};

let xrayMode = "mountain";

function renderXray() {
  const sc = XRAY_SCENES[xrayMode];
  const pct = Number(xrayRange.value);
  xrayPct.textContent = `${pct}%`;
  xrayCaption.textContent = sc.caption;
  const cutX = (pct / 100) * 520;
  const [[ax, ay], [bx, by], [cx, cy]] = sc.tri;
  const [fx, fy] = sc.focus;
  const gx = (ax + bx + cx) / 3;
  const gy = (ay + by + cy) / 3;

  xraySvg.innerHTML = `
    <defs>
      <clipPath id="xray-right-clip">
        <rect x="${cutX.toFixed(1)}" y="0" width="${(520 - cutX).toFixed(1)}" height="340"/>
      </clipPath>
    </defs>
    <!-- 左侧完整自然成片 -->
    ${sc.art}
    <!-- 右侧 X 光骨架显影层 -->
    <g clip-path="url(#xray-right-clip)">
      <rect width="520" height="340" fill="rgba(6, 36, 26, 0.72)"/>
      <polygon points="${ax},${ay} ${bx},${by} ${cx},${cy}" fill="rgba(210,151,28,0.14)" stroke="#F2BD49" stroke-width="2.6" stroke-dasharray="8 6"/>
      <line x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${gx.toFixed(1)}" y2="${by}" stroke="#6EE0B2" stroke-width="1.8" stroke-dasharray="4 4"/>
      <circle cx="${fx}" cy="${fy}" r="28" fill="rgba(210,151,28,0.28)" stroke="#F2BD49" stroke-width="2"/>
      <text x="${fx}" y="${fy + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#FBF7EF">焦点区</text>
      <circle cx="${ax}" cy="${ay}" r="8" fill="#F2BD49"/>
      <circle cx="${bx}" cy="${by}" r="8" fill="#6EE0B2"/>
      <circle cx="${cx}" cy="${cy}" r="8" fill="#6EE0B2"/>
      <text x="${ax + 14}" y="${ay + 4}" font-size="11.5" font-family="JetBrains Mono, monospace" fill="#F2BD49">APEX</text>
      <circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="4.5" fill="#6EE0B2"/>
      <text x="${(gx + 10).toFixed(1)}" y="${(by - 14).toFixed(1)}" font-size="11" font-family="JetBrains Mono, Noto Sans SC, monospace" fill="#6EE0B2">G 重心落点</text>
    </g>
    <!-- 分割刮帘线 -->
    <line x1="${cutX.toFixed(1)}" y1="0" x2="${cutX.toFixed(1)}" y2="340" stroke="#F2BD49" stroke-width="2.5"/>
    <rect x="${(cutX - 18).toFixed(1)}" y="154" width="36" height="32" rx="4" fill="#D2971C" stroke="#062B20" stroke-width="1.5"/>
    <text x="${cutX.toFixed(1)}" y="174" text-anchor="middle" font-size="13" font-weight="900" fill="#062B20">↔</text>
    <rect x="12" y="12" width="76" height="24" fill="rgba(6,43,32,0.82)"/>
    <text x="50" y="28" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FBF7EF">自然成片</text>
    <rect x="432" y="12" width="76" height="24" fill="rgba(210,151,28,0.92)"/>
    <text x="470" y="28" text-anchor="middle" font-size="11.5" font-weight="700" fill="#062B20">显影骨架</text>
  `;
}

xrayRange.addEventListener("input", renderXray);
xrayBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    xrayMode = btn.dataset.xray;
    xrayBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderXray();
  });
});
renderXray();

// ==================== 4. 第 03 节深松绿暗室：情绪原型画板 ====================
const moodSvg = document.getElementById("mood-svg");
const moodMeta = document.getElementById("mood-meta");
const moodCards = [...document.querySelectorAll(".mood-card")];

const MOODS = {
  monument: {
    angle: "56° 等腰",
    feel: "庄重 · 永恒 · 纪念碑感",
    use: "主峰海报、仪式人像、品牌展陈",
    tris: [[[270, 44], [118, 286], [422, 286]]],
    focus: [270, 206],
    flow: "M128,274 L264,56 M412,274 L276,56 M270,84 L270,170",
  },
  charge: {
    angle: "54° 右倾斜冲",
    feel: "蓄力 · 推进 · 叙事高潮",
    use: "历史叙事画、运动海报、人物动势",
    tris: [[[376, 46], [84, 284], [434, 276]]],
    focus: [324, 174],
    flow: "M102,272 L364,58 M422,266 L380,62 M368,78 L334,148",
  },
  twin: {
    angle: "主 58° + 辅 64°",
    feel: "纵深 · 对话 · 层次分明",
    use: "群山叠嶂、双主角海报、叙事插画",
    tris: [
      [[192, 92], [68, 286], [316, 286]],
      [[354, 46], [218, 286], [476, 286]],
    ],
    focus: [354, 186],
    flow: "M82,274 L188,104 L262,210 L350,58",
  },
  horizon: {
    angle: "96° 宽肩平峰",
    feel: "宽舒 · 从容 · 宁静落地",
    use: "辽阔风光、温暖家庭合照、建筑横幅",
    tris: [[[270, 122], [64, 284], [476, 284]]],
    focus: [270, 224],
    flow: "M82,274 L262,130 M458,274 L278,130",
  },
};

function renderMood(key) {
  const m = MOODS[key];
  const polyHtml = m.tris
    .map((tri, idx) => {
      const pStr = tri.map((p) => p.join(",")).join(" ");
      const isMain = idx === m.tris.length - 1;
      return `
        <polygon points="${pStr}" fill="${isMain ? "rgba(210,151,28,0.16)" : "rgba(110,224,178,0.09)"}" stroke="${isMain ? "#F2BD49" : "#6EE0B2"}" stroke-width="${isMain ? 2.6 : 1.8}"/>
        <circle cx="${tri[0][0]}" cy="${tri[0][1]}" r="${isMain ? 8 : 6}" fill="${isMain ? "#F2BD49" : "#6EE0B2"}"/>
        <circle cx="${tri[1][0]}" cy="${tri[1][1]}" r="6" fill="#D6E0D9"/>
        <circle cx="${tri[2][0]}" cy="${tri[2][1]}" r="6" fill="#D6E0D9"/>
      `;
    })
    .join("");

  const mainTri = m.tris[m.tris.length - 1];
  const gx = (mainTri[0][0] + mainTri[1][0] + mainTri[2][0]) / 3;
  const gy = (mainTri[0][1] + mainTri[1][1] + mainTri[2][1]) / 3;

  moodSvg.innerHTML = `
    <rect width="540" height="330" fill="#081F17"/>
    <line x1="36" y1="286" x2="504" y2="286" stroke="rgba(232,208,155,0.22)" stroke-width="1"/>
    ${polyHtml}
    <path d="${m.flow}" fill="none" stroke="#FBF7EF" stroke-width="1.8" stroke-dasharray="6 5" opacity="0.82"/>
    <line x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${gx.toFixed(1)}" y2="286" stroke="#6EE0B2" stroke-width="1.6" stroke-dasharray="3 3"/>
    <circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="5" fill="#6EE0B2"/>
    <circle cx="${m.focus[0]}" cy="${m.focus[1]}" r="30" fill="#D2971C"/>
    <text x="${m.focus[0]}" y="${m.focus[1] + 5}" text-anchor="middle" font-size="13" font-weight="900" fill="#062B20">焦点</text>
    <text x="${gx.toFixed(1)}" y="306" text-anchor="middle" font-size="11.5" font-family="JetBrains Mono, Noto Sans SC, monospace" fill="#6EE0B2">G 重心垂落点</text>
  `;

  moodMeta.innerHTML = `
    <div class="mood-stat"><span>顶角 / 结构</span><strong>${m.angle}</strong></div>
    <div class="mood-stat"><span>情绪气场</span><strong>${m.feel}</strong></div>
    <div class="mood-stat"><span>常见题材</span><strong>${m.use}</strong></div>
  `;
}

moodCards.forEach((card) => {
  card.addEventListener("click", () => {
    moodCards.forEach((c) => {
      const on = c === card;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    renderMood(card.dataset.mood);
  });
});
renderMood("monument");

// ==================== 5. 第 04 节：艺术史骨架透视年代尺 ====================
const eraSvg = document.getElementById("era-svg");
const eraTextCol = document.getElementById("era-text-col");
const eraWorkTag = document.getElementById("era-work-tag");
const eraToggleArrows = document.getElementById("era-toggle-arrows");
const eraTabs = [...document.querySelectorAll(".era-tab")];

const ERAS = {
  renaissance: {
    title: "达·芬奇与拉斐尔：把多人群像拧成一座稳固整体",
    sub: "High Renaissance · 1483–1508",
    tag: "《岩间圣母》/《草地上的圣母》群像三角",
    paragraphs: [
      "文艺复兴盛期，达·芬奇在《岩间圣母》（卢浮宫首版约 1483–1486；伦敦国家美术馆 NG1093 约 1491/2–1508）和《圣母子与圣安妮》（卢浮宫 INV 776）中，用人物坐姿、手臂伸展与彼此凝视的目光，把原本容易散开的四个人物紧密锁进同一个三角形骨架。",
      "稍晚的拉斐尔在《草地上的圣母》（1505/1506，维也纳艺术史博物馆）中更进一步：圣母头部构成顶点，披风与两位幼童稳稳铺出宽阔底边，让宁静、神圣与亲密感在同一座等腰结构里达成平衡。",
    ],
    cite: "核实馆藏：伦敦国家美术馆 NG1093 · 巴黎卢浮宫 INV 776 · 维也纳艺术史博物馆",
    art: (arrows) => `
      <rect width="420" height="300" fill="#FBF7EF"/>
      <polygon points="210,36 74,264 346,264" fill="rgba(6,43,32,0.08)" stroke="#062B20" stroke-width="2" stroke-dasharray="6 4"/>
      <!-- 抽象群像剪影（无五官） -->
      <circle cx="210" cy="78" r="20" fill="#062B20"/>
      <path d="M196,98 Q144,132 132,262 L288,262 Q276,132 224,98 Z" fill="#183C2E"/>
      <circle cx="136" cy="196" r="15" fill="#2E5343"/>
      <path d="M126,210 Q100,226 94,262 L176,262 Q170,226 146,210 Z" fill="#2E5343"/>
      <circle cx="284" cy="196" r="15" fill="#2E5343"/>
      <path d="M274,210 Q248,226 242,262 L324,262 Q318,226 294,210 Z" fill="#2E5343"/>
      ${arrows ? `<path d="M148,190 L198,92 M272,190 L222,92 M154,202 L266,202" stroke="#D2971C" stroke-width="2.4" stroke-dasharray="4 4"/>` : ""}
      <circle cx="210" cy="36" r="6" fill="#D2971C"/>
      <circle cx="74" cy="264" r="6" fill="#062B20"/>
      <circle cx="346" cy="264" r="6" fill="#062B20"/>
    `,
  },
  romantic: {
    title: "籍里柯与德拉克洛瓦：用斜顶与双三角引爆叙事张力",
    sub: "French Romanticism · 1818–1830",
    tag: "《美杜莎之筏》双三角 / 《自由引导人民》斜顶冲势",
    paragraphs: [
      "到了浪漫主义时期，三角形不再只代表端庄平静。泰奥多尔·籍里柯在《美杜莎之筏》（1818–1819，卢浮宫 INV 4884）里排出了著名的「双三角叠套」：左侧以绝望木筏与桅杆结成低沉的死寂三角，右侧由奋力向上托举的人链斜冲向挥舞红巾的最高点，直指海平线远方的救生船。",
      "1830 年，欧仁·德拉克洛瓦在《自由引导人民》（卢浮宫 RF 129）中，用宽阔的街垒与倒地者托出沉重底边，把高举旗帜的顶点斜向推升——稳固底座与向上冲锋合二为一。",
    ],
    cite: "核实馆藏：巴黎卢浮宫 INV 4884（《美杜莎之筏》）· RF 129（《自由引导人民》）",
    art: (arrows) => `
      <rect width="420" height="300" fill="#FBF7EF"/>
      <!-- 左侧低沉三角 -->
      <polygon points="154,84 42,264 260,264" fill="rgba(6,43,32,0.09)" stroke="#354F46" stroke-width="1.8" stroke-dasharray="5 4"/>
      <!-- 右侧高潮冲锋三角 -->
      <polygon points="334,40 128,264 388,264" fill="rgba(210,151,28,0.16)" stroke="#062B20" stroke-width="2.4"/>
      <line x1="154" y1="84" x2="154" y2="262" stroke="#354F46" stroke-width="3"/>
      <polygon points="334,40 374,52 334,74" fill="#D2971C"/>
      ${arrows ? `<line x1="148" y1="252" x2="322" y2="54" stroke="#A62C1E" stroke-width="3"/><polygon points="328,47 314,54 324,63" fill="#A62C1E"/>` : ""}
      <circle cx="154" cy="84" r="6" fill="#354F46"/>
      <circle cx="334" cy="40" r="7" fill="#D2971C"/>
      <circle cx="42" cy="264" r="6" fill="#062B20"/>
      <circle cx="388" cy="264" r="6" fill="#062B20"/>
    `,
  },
  bauhaus: {
    title: "普尔与康定斯基：从绘画手册到现代几何形色语法",
    sub: "Poore (1903) & Kandinsky (1923–1926)",
    tag: "角形构图理论 × 包豪斯锐角张力分析",
    paragraphs: [
      "1903 年，亨利·兰金·普尔在《绘画构图与作品评判》中，把三角形归入「角形构图（Angular Composition）」，专门论述宽底如何抵消左右倾覆、斜边如何把视线送往高潮顶点，并指出优秀构图要让三角形隐匿于自然光影与形态之中。",
      "1923 年，瓦西里·康定斯基在魏玛包豪斯发放了著名的「红黄蓝与方圆三角」形色问卷，并于 1926 年出版《点与线到面》（包豪斯丛书第 9 卷），系统剖析锐角三角形天生带有尖锐、向外放射与向上刺破的动态张力——这直接影响了整个现代平面海报语言。",
    ],
    cite: "核实书目：Henry Rankin Poore (1903) · Wassily Kandinsky (1926, Bauhausbücher 9)",
    art: (arrows) => `
      <rect width="420" height="300" fill="#FBF7EF"/>
      <!-- 包豪斯三原形参照：方、圆退后，金色锐三角居前主位 -->
      <rect x="64" y="138" width="96" height="96" fill="rgba(6,43,32,0.12)" stroke="#062B20" stroke-width="1.5"/>
      <circle cx="322" cy="186" r="48" fill="rgba(6,43,32,0.10)" stroke="#062B20" stroke-width="1.5"/>
      <polygon points="210,44 108,248 312,248" fill="rgba(210,151,28,0.28)" stroke="#062B20" stroke-width="2.6"/>
      ${arrows ? `
        <line x1="210" y1="44" x2="210" y2="16" stroke="#D2971C" stroke-width="2.6"/>
        <line x1="186" y1="54" x2="168" y2="30" stroke="#D2971C" stroke-width="2.2"/>
        <line x1="234" y1="54" x2="252" y2="30" stroke="#D2971C" stroke-width="2.2"/>
      ` : ""}
      <circle cx="210" cy="176" r="24" fill="#D2971C"/>
      <text x="210" y="180" text-anchor="middle" font-size="11" font-weight="900" fill="#062B20">锐角</text>
    `,
  },
  modern: {
    title: "阿恩海姆与弗里曼：视知觉力场与当代隐性三角",
    sub: "Arnheim (1954/1974) & Freeman (2007)",
    tag: "结构骨架力场 × 摄影显隐双轨",
    paragraphs: [
      "心理学家鲁道夫·阿恩海姆在《艺术与视知觉》（1954 初版，1974 修订，加州大学出版社）里用格式塔心理学说明：人眼看画不是被动拍照，而是主动感受画框内看不见的「结构骨架」与视觉重量。三角形之所以有力，是因为它把分散的视觉重量扣进了明确的平衡力场。",
      "进入数码摄影与视觉传达时代，迈克尔·弗里曼在《摄影师之眼》（2007）进一步提炼出显性三角、隐性三角与广角透视汇聚三角的实操法则，让这套跨越五百年的几何骨架成为今天网页、海报与摄影最常用的基础结构之一。",
    ],
    cite: "核实书目：Rudolf Arnheim (1954/1974, UC Press) · Michael Freeman (2007)",
    art: (arrows) => `
      <rect width="420" height="300" fill="#FBF7EF"/>
      <rect x="34" y="28" width="352" height="244" fill="none" stroke="rgba(6,43,32,0.28)" stroke-width="1.2"/>
      <!-- 视知觉对称轴与对角力场线 -->
      <line x1="210" y1="28" x2="210" y2="272" stroke="rgba(6,43,32,0.16)" stroke-dasharray="4 4"/>
      <line x1="34" y1="150" x2="386" y2="150" stroke="rgba(6,43,32,0.16)" stroke-dasharray="4 4"/>
      <polygon points="210,58 92,248 328,248" fill="rgba(6,43,32,0.08)" stroke="#062B20" stroke-width="2"/>
      <circle cx="210" cy="184" r="22" fill="#D2971C"/>
      <circle cx="210" cy="58" r="10" fill="#062B20"/>
      <circle cx="92" cy="248" r="10" fill="#062B20"/>
      <circle cx="328" cy="248" r="10" fill="#062B20"/>
      ${arrows ? `<path d="M104,238 L200,72 M316,238 L220,72 M110,248 L310,248" stroke="#0E6345" stroke-width="2" stroke-dasharray="5 4"/>` : ""}
    `,
  },
};

let currentEra = "renaissance";
let eraArrowsOn = true;

function renderEra() {
  const e = ERAS[currentEra];
  eraWorkTag.textContent = e.tag;
  eraSvg.innerHTML = e.art(eraArrowsOn);
  eraTextCol.innerHTML = `
    <h3>${e.title}</h3>
    <p class="era-sub">${e.sub}</p>
    ${e.paragraphs.map((p) => `<p>${p}</p>`).join("")}
    <div class="era-cite">${e.cite}</div>
  `;
}

eraTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentEra = tab.dataset.era;
    eraTabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderEra();
  });
});

eraToggleArrows.addEventListener("click", () => {
  eraArrowsOn = !eraArrowsOn;
  eraToggleArrows.classList.toggle("is-on", eraArrowsOn);
  eraToggleArrows.setAttribute("aria-pressed", String(eraArrowsOn));
  eraToggleArrows.textContent = eraArrowsOn ? "视线箭：开" : "视线箭：关";
  renderEra();
});
renderEra();

// ==================== 6. 第 05 节：三大应用场景变式预览台 ====================
const appSvg = document.getElementById("app-svg");
const appNotes = document.getElementById("app-notes");
const appVariantBtns = document.getElementById("app-variant-btns");
const domainBtns = [...document.querySelectorAll(".domain-btn")];

const APP_DATA = {
  landscape: [
    {
      id: "peak",
      label: "单峰巍立（广底仰拍）",
      title: "主峰定顶点，左右山脚宽稳收底",
      bullets: [
        "顶点：最高主峰避开顶框 15% 左右，留出天空呼吸。",
        "双底角：山谷两侧林线或岩石稳托底部，形成 55°–70° 挺拔轮廓。",
        "焦点：雪线受光阳面落于中下重心，天然锁住视线。",
      ],
      svg: `
        <rect width="460" height="360" fill="#2A4C3E"/>
        <circle cx="230" cy="48" r="18" fill="#D2971C"/>
        <line x1="230" y1="22" x2="230" y2="10" stroke="#D2971C" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="206" y1="30" x2="196" y2="20" stroke="#D2971C" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="254" y1="30" x2="264" y2="20" stroke="#D2971C" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="10,336 124,186 244,336" fill="#1F3E31"/>
        <polygon points="216,336 340,174 452,336" fill="#1B392C"/>
        <polygon points="34,336 230,78 426,336" fill="#0E2A20"/>
        <polygon points="230,78 192,164 140,256 210,214 238,154 264,198 244,124" fill="#E4CD98"/>
        <polygon points="304,200 282,248 318,262 342,228" fill="#CBB27A" opacity="0.62"/>
        <polygon points="0,336 118,284 242,306 364,278 460,336" fill="#071E16"/>
        <rect x="0" y="330" width="460" height="30" fill="#071E16"/>
        <polygon points="230,78 44,330 416,330" fill="none" stroke="#F2BD49" stroke-width="2" stroke-dasharray="6 5"/>
        <circle cx="230" cy="236" r="24" fill="rgba(210,151,28,0.92)"/>
        <text x="230" y="241" text-anchor="middle" font-size="12" font-weight="900" fill="#062B20">重心</text>
      `,
    },
    {
      id: "road",
      label: "林道透视（汇聚三角）",
      title: "路面从底边双角伸出，向远方地平线汇成顶角",
      bullets: [
        "顶点：道路消失点落于中线上三分之一，把目光一路吸向远方。",
        "双底角：路缘与两旁树影从画幅左下、右下切入，拉出纵深。",
        "焦点：行进剪影或远山灯塔放在消失点前方偏下，成片瞬间有故事。",
      ],
      svg: `
        <rect width="460" height="360" fill="#E8DFCD"/>
        <rect x="0" y="138" width="460" height="222" fill="#264739"/>
        <polygon points="230,138 38,360 422,360" fill="#C9BC9E"/>
        <line x1="230" y1="138" x2="230" y2="360" stroke="#FBF7EF" stroke-width="2" stroke-dasharray="10 8"/>
        <polygon points="230,138 38,354 422,354" fill="none" stroke="#062B20" stroke-width="2.2" stroke-dasharray="6 5"/>
        <circle cx="230" cy="138" r="10" fill="#D2971C"/>
        <circle cx="230" cy="222" r="18" fill="#062B20"/>
        <text x="230" y="226" text-anchor="middle" font-size="11" font-weight="700" fill="#FBF7EF">焦点</text>
      `,
    },
  ],
  portrait: [
    {
      id: "solo",
      label: "单人头肩稳姿",
      title: "头部落顶点，双臂与肘部自然张开成底边",
      bullets: [
        "顶点：人物头部（以剪影示意）置于上方顶点，成为第一视觉落点。",
        "双底角：自然下垂的肩线或撑桌双肘向外撑开，消除「电线杆式」僵直感。",
        "焦点：头肩交汇处落在上部关键区，沉稳又有亲和力。",
      ],
      svg: `
        <rect width="460" height="360" fill="#18372B"/>
        <circle cx="230" cy="138" r="112" fill="#E8D09B" opacity="0.14"/>
        <ellipse cx="230" cy="112" rx="32" ry="38" fill="#071E16"/>
        <path d="M210,148 Q128,176 92,340 L368,340 Q332,176 250,148 Z" fill="#0A241B"/>
        <polygon points="230,72 86,334 374,334" fill="none" stroke="#F2BD49" stroke-width="2" stroke-dasharray="6 5"/>
        <circle cx="230" cy="112" r="24" fill="rgba(210,151,28,0.32)" stroke="#F2BD49" stroke-width="2"/>
        <text x="230" y="116" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FBF7EF">顶焦</text>
      `,
    },
    {
      id: "group",
      label: "三人高低错落",
      title: "打破一字排开合照，用高低站坐织出隐性三角",
      bullets: [
        "顶点：主讲或核心人物站位略高，位于三角顶峰。",
        "双底角：两侧人物略低或前倾坐姿，与主角形成一高二低层次。",
        "避坑：切忌三人头顶排成一条水平线，那样会退化成平淡横条。",
      ],
      svg: `
        <rect width="460" height="360" fill="#EFE5D3"/>
        <ellipse cx="230" cy="108" rx="24" ry="28" fill="#062B20"/>
        <path d="M216,134 Q174,154 166,336 L294,336 Q286,154 244,134 Z" fill="#062B20"/>
        <ellipse cx="122" cy="192" rx="20" ry="24" fill="#2A4C3E"/>
        <path d="M110,214 Q74,234 68,336 L176,336 Q170,234 134,214 Z" fill="#2A4C3E"/>
        <ellipse cx="338" cy="196" rx="20" ry="24" fill="#2A4C3E"/>
        <path d="M326,218 Q290,238 284,336 L392,336 Q386,238 350,218 Z" fill="#2A4C3E"/>
        <polygon points="230,78 96,326 364,326" fill="none" stroke="#D2971C" stroke-width="2.4" stroke-dasharray="6 4"/>
        <circle cx="230" cy="78" r="7" fill="#D2971C"/>
        <circle cx="96" cy="326" r="7" fill="#062B20"/>
        <circle cx="364" cy="326" r="7" fill="#062B20"/>
      `,
    },
  ],
  poster: [
    {
      id: "center",
      label: "中心焦点博物海报",
      title: "顶端展名领衔，主体大圆镇心，底部双角承接日期与主办",
      bullets: [
        "顶点：精炼短标题或图形徽标居顶，一眼定调。",
        "焦点：核心产品/主视觉圆核占中下重心，周围留足宣纸呼吸。",
        "双底角：左下时间与右下地点等宽压底，锁紧版面下沿。",
      ],
      svg: `
        <rect width="460" height="360" fill="#F5ECDD"/>
        <rect x="52" y="20" width="356" height="320" fill="#FBF7EF" stroke="#062B20" stroke-width="1.8"/>
        <rect x="172" y="48" width="116" height="14" fill="#062B20"/>
        <rect x="194" y="68" width="72" height="5" fill="#D2971C"/>
        <polygon points="230,90 96,298 364,298" fill="rgba(6,43,32,0.08)" stroke="#062B20" stroke-width="1.6" stroke-dasharray="5 4"/>
        <circle cx="230" cy="214" r="52" fill="#D2971C"/>
        <text x="230" y="219" text-anchor="middle" font-size="16" font-weight="900" fill="#062B20">核心主视觉</text>
        <rect x="86" y="290" width="74" height="8" fill="#062B20"/>
        <rect x="86" y="304" width="52" height="5" fill="#354F46"/>
        <rect x="300" y="290" width="74" height="8" fill="#062B20"/>
        <rect x="322" y="304" width="52" height="5" fill="#354F46"/>
      `,
    },
    {
      id: "asymm",
      label: "偏峰斜冲活动海报",
      title: "顶点偏右拉出动势，左侧大方留白给主标题呼吸",
      bullets: [
        "顶点：高视觉体量主体偏右上方，斜边从左下贯通冲出。",
        "层次：左侧利用负空间放置粗黑大标题，与右侧三角主体形成重量互锁。",
        "底基：底边保持水平稳贴，动中有稳不显杂乱。",
      ],
      svg: `
        <rect width="460" height="360" fill="#F5ECDD"/>
        <rect x="52" y="20" width="356" height="320" fill="#0A261D"/>
        <polygon points="312,64 102,306 376,306" fill="#1C4234" stroke="#F2BD49" stroke-width="2" stroke-dasharray="5 4"/>
        <circle cx="294" cy="196" r="42" fill="#D2971C"/>
        <rect x="78" y="64" width="118" height="16" fill="#FBF7EF"/>
        <rect x="78" y="88" width="92" height="16" fill="#FBF7EF"/>
        <rect x="78" y="114" width="68" height="5" fill="#F2BD49"/>
        <rect x="92" y="306" width="84" height="6" fill="#D6E0D9"/>
        <rect x="304" y="306" width="72" height="6" fill="#F2BD49"/>
      `,
    },
  ],
};

let currentDomain = "landscape";
let currentVariantIdx = 0;

function renderAppDemo() {
  const variants = APP_DATA[currentDomain];
  const v = variants[currentVariantIdx] || variants[0];

  appVariantBtns.innerHTML = variants
    .map(
      (item, idx) =>
        `<button type="button" class="seg-btn ${idx === currentVariantIdx ? "is-active" : ""}" data-vidx="${idx}" aria-pressed="${idx === currentVariantIdx}">${item.label}</button>`
    )
    .join("");

  appVariantBtns.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentVariantIdx = Number(btn.dataset.vidx);
      renderAppDemo();
    });
  });

  appNotes.innerHTML = `
    <h4>${v.title}</h4>
    <ul>${v.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
  `;
  appSvg.innerHTML = v.svg;
}

domainBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentDomain = btn.dataset.domain;
    currentVariantIdx = 0;
    domainBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderAppDemo();
  });
});
renderAppDemo();

// ==================== 7. 第 06 节：什么时候别用折页卡 ====================
document.querySelectorAll(".avoid-trigger").forEach((btn) => {
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    const body = btn.nextElementSibling;
    btn.setAttribute("aria-expanded", String(!expanded));
    body.hidden = expanded;
    const plus = btn.querySelector(".avoid-plus");
    if (plus) plus.textContent = expanded ? "+" : "−";
  });
});

// ==================== 8. 第 07 节：严格单变量构图小练习 ====================
// 唯一变量：三顶点构成的三角形几何比例（水平地平线、色彩、标题与内部焦点圆大小 100% 相同）
const QUIZ_OPTS = {
  A: {
    // 广底低峰：顶角约 117°，水平宽底但坡度过平，视线横滑缺乏向顶牵引
    tri: [[110, 158], [22, 212], [198, 212]],
    f: [110, 189],
    right: false,
  },
  B: {
    // 狭尖高柱：顶角约 27°，底宽仅 31%，基座发飘缺乏稳固感
    tri: [[110, 68], [76, 212], [144, 212]],
    f: [110, 174],
    right: false,
  },
  C: {
    // 外甩偏峰：底边虽水平，但顶点大幅右甩超出右底角，重心垂线 G 落至支撑段 89% 边缘，向右倾覆失稳
    tri: [[204, 72], [50, 212], [142, 212]],
    f: [132, 168],
    right: false,
  },
  D: {
    // 正解：底宽 65%、底边水平、顶角约 54°、重心垂线正落支撑段中点（50%），稳固且引导有力
    tri: [[110, 72], [38, 212], [182, 212]],
    f: [110, 166],
    right: true,
  },
};

function measureQuizOption(cfg) {
  const [[ax, ay], [bx, by], [cx, cy]] = cfg.tri;
  const abx = bx - ax, aby = by - ay;
  const acx = cx - ax, acy = cy - ay;
  const cosA = Math.max(-1, Math.min(1, (abx * acx + aby * acy) / (Math.hypot(abx, aby) * Math.hypot(acx, acy))));
  const apexDeg = Math.round((Math.acos(cosA) * 180) / Math.PI);
  const basePct = Math.round((Math.abs(cx - bx) / 220) * 100);
  const gx = (ax + bx + cx) / 3;
  const gy = (ay + by + cy) / 3;
  const uPct = Math.round(((gx - Math.min(bx, cx)) / Math.max(1, Math.abs(cx - bx))) * 100);
  return { apexDeg, basePct, gx, gy, uPct };
}

const quizCards = [...document.querySelectorAll(".quiz-card")];
const quizFeedback = document.getElementById("quiz-feedback");
const quizFbTitle = document.getElementById("quiz-fb-title");
const quizFbBody = document.getElementById("quiz-fb-body");
const quizResetBtn = document.getElementById("quiz-reset");
let quizAnswered = null;

function renderQuizCards(reveal) {
  for (const [opt, cfg] of Object.entries(QUIZ_OPTS)) {
    const svg = document.querySelector(`[data-quiz-svg="${opt}"]`);
    const [[ax, ay], [bx, by], [cx, cy]] = cfg.tri;
    const [fx, fy] = cfg.f;
    const m = measureQuizOption(cfg);
    const pStr = `${ax},${ay} ${bx},${by} ${cx},${cy}`;
    const col = cfg.right ? "#0E6345" : "#A62C1E";
    const tagText = cfg.right
      ? `顶角 ${m.apexDeg}° · 底宽 ${m.basePct}% · 稳固`
      : opt === "A"
      ? `顶角 ${m.apexDeg}° · 扁平乏力`
      : opt === "B"
      ? `顶角 ${m.apexDeg}° · 底宽 ${m.basePct}% 偏窄`
      : `重心落点 ${m.uPct}% · 右倾失稳`;

    svg.innerHTML = `
      <rect width="220" height="260" fill="#F5ECDD"/>
      <!-- 固定统一的海报顶标题、水平基线与底脚，确保唯一变量是三角形三顶点几何比例 -->
      <rect x="20" y="18" width="84" height="10" fill="#062B20"/>
      <rect x="20" y="33" width="56" height="4" fill="#D2971C"/>
      <line x1="20" y1="212" x2="200" y2="212" stroke="rgba(6,43,32,0.28)" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="20" y1="238" x2="200" y2="238" stroke="#062B20" stroke-width="1"/>
      <rect x="20" y="244" width="44" height="4" fill="#354F46"/>
      <rect x="156" y="244" width="44" height="4" fill="#354F46"/>
      <!-- 实景山体三角（凸组合重心坐标受光雪脊，保证任意偏斜几何都不溢出轮廓） -->
      <polygon points="${pStr}" fill="#17382B"/>
      <polygon points="${ax},${ay} ${(0.40 * ax + 0.50 * bx + 0.10 * cx).toFixed(1)},${(0.40 * ay + 0.50 * by + 0.10 * cy).toFixed(1)} ${(0.34 * ax + 0.24 * bx + 0.42 * cx).toFixed(1)},${(0.34 * ay + 0.24 * by + 0.42 * cy).toFixed(1)}" fill="#E4CD98" opacity="0.88"/>
      <circle cx="${ax}" cy="${ay}" r="5" fill="#D2971C"/>
      <circle cx="${bx}" cy="${by}" r="5" fill="#062B20"/>
      <circle cx="${cx}" cy="${cy}" r="5" fill="#062B20"/>
      <!-- 等大日轮焦点圆 -->
      <circle cx="${fx}" cy="${fy}" r="17" fill="#D2971C"/>
      <text x="${fx}" y="${fy + 4}" text-anchor="middle" font-size="10.5" font-weight="900" fill="#062B20">焦点</text>
      ${
        reveal
          ? `
        <polygon points="${pStr}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="4 3"/>
        <line x1="${m.gx.toFixed(1)}" y1="${m.gy.toFixed(1)}" x2="${m.gx.toFixed(1)}" y2="212" stroke="${col}" stroke-width="1.8" stroke-dasharray="3 3"/>
        <circle cx="${m.gx.toFixed(1)}" cy="${m.gy.toFixed(1)}" r="4" fill="${col}"/>
        <circle cx="${m.gx.toFixed(1)}" cy="212" r="3.5" fill="${col}"/>
        <rect x="16" y="216" width="188" height="20" fill="${col}"/>
        <text x="110" y="230" text-anchor="middle" font-size="10" font-weight="700" fill="#FBF7EF">${tagText}</text>
      `
          : ""
      }
    `;
  }
}

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    quizAnswered = opt;
    const isRight = QUIZ_OPTS[opt].right;
    const mA = measureQuizOption(QUIZ_OPTS.A);
    const mB = measureQuizOption(QUIZ_OPTS.B);
    const mC = measureQuizOption(QUIZ_OPTS.C);
    const mD = measureQuizOption(QUIZ_OPTS.D);
    renderQuizCards(true);

    quizCards.forEach((c) => {
      const o = c.dataset.opt;
      c.classList.toggle("is-picked", o === opt);
      c.classList.toggle("is-right", QUIZ_OPTS[o].right);
      c.classList.toggle("is-wrong", o === opt && !QUIZ_OPTS[o].right);
    });

    quizFeedback.hidden = false;
    quizFeedback.classList.toggle("is-wrong-fb", !isRight);
    quizFbTitle.textContent = isRight
      ? "选对了！方案 D 同时做到宽底稳固、斜边有力引导与重心正中落地。"
      : `你选了方案 ${opt}，更稳妥的答案是「方案 D」。`;

    const reasons = {
      A: `方案 A 底边虽平且宽，但顶角张大到 ${mA.apexDeg}°，山体压成扁平低丘，斜边坡度太缓，视线只会左右平扫而缺少向顶峰攀升的牵引力。`,
      B: `方案 B 峰顶高耸，但底宽收窄到仅占画幅 ${mB.basePct}%、顶角锐至 ${mB.apexDeg}°，退化成一根细长尖针，视觉基座发飘、两侧留白显空。`,
      C: `方案 C 的底边虽然水平，但顶点大幅右甩超出右底角，重心垂线 G 逼近支撑边 ${mC.uPct}% 外缘（超出 14%–86% 安全支撑段），对端庄稳重的博物展海报来说显得随时要向右倾倒。`,
      D: `方案 D 底宽 ${mD.basePct}% 水平托底、顶角 ${mD.apexDeg}° 挺拔有力，重心垂线 G 正落支撑段中点（${mD.uPct}%），日轮焦点稳坐内心——稳固、引导、层次与焦点四者全部成立。`,
    };
    quizFbBody.textContent = reasons[opt] + (isRight ? "" : " 相比之下，" + reasons.D);
  });
});

quizResetBtn.addEventListener("click", () => {
  quizAnswered = null;
  quizFeedback.hidden = true;
  quizCards.forEach((c) => c.classList.remove("is-picked", "is-right", "is-wrong"));
  renderQuizCards(false);
});
renderQuizCards(false);

// ==================== 9. 第 08 节：原海报灯箱（复用 #poster.src，绝不二次内联） ====================
const posterImg = document.getElementById("poster");
const posterOpenBtn = document.getElementById("poster-open-btn");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbZoomVal = document.getElementById("lb-zoom-val");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbReset.addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
});
lbZoomIn.addEventListener("click", () => {
  lbScale = Math.min(3.5, lbScale + 0.35);
  applyLightboxTransform();
});
lbZoomOut.addEventListener("click", () => {
  lbScale = Math.max(0.6, lbScale - 0.35);
  applyLightboxTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.18 : -0.18;
  lbScale = Math.max(0.6, Math.min(3.5, lbScale + delta));
  applyLightboxTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbScale <= 1.05) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy };
  lbViewport.classList.add("is-dragging");
  lbViewport.setPointerCapture(e.pointerId);
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = lbDrag.tx + (e.clientX - lbDrag.x);
  lbTy = lbDrag.ty + (e.clientY - lbDrag.y);
  applyLightboxTransform();
});

lbViewport.addEventListener("pointerup", () => {
  lbDrag = null;
  lbViewport.classList.remove("is-dragging");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});
