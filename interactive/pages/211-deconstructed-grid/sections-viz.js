// 211 解构网格 · 01–06 各节差异化交互引擎
// 严格做到相邻两节不复用同种控件：
//   01 拆网不拆义  → X 光拉帘对比镜（垂直拉帘 + 三态标本 + 隐形锚点透视）
//   02 四步重构法  → 四阶建筑构架步进器（Step 1–4 轴测错层 SVG + 残留对齐回声开关）
//   03 层级与留白  → 暗室三维度离散压力矩阵（字级跨度 × 留白率 × 护城框 → 活体中英版面）
//   04 从哪来      → 年代切片标本匣（1968–2004 六大核实节点 + 抽象网格解剖矢量图）
//   05 何时用与别用 → 六场景适配翻检卡（真实设计任务书判决 + 错用灾难微缩对比 + 同族替代链）
//   06 实战小练习  → 四版单变量 SVG 盲选 + X 光隐藏轴线批改覆层

import { PALETTE } from "./palette.js";

// ==================== 01 拆网不拆义：X 光拉帘对比镜 ====================
export function mountSection01(root) {
  if (!root) return;
  const modes = {
    modular: {
      name: "196 模块化网格（参照）",
      badge: "完整 5×5",
      lead: "每个元素被严密关进相邻单元，信息清晰平稳，但整页缺少意外感与视觉爆发点。",
      scan: "均匀横扫 · 无强停顿",
    },
    broken: {
      name: "210 破格网格（参照）",
      badge: "底网完整 · 局部越界",
      lead: "底层 5×5 骨架仍连成一片，只有 1–2 个主体越过栏线制造重点，整体秩序未被拆开。",
      scan: "常规底网 + 单点越界",
    },
    decon: {
      name: "211 解构网格（本页）",
      badge: "骨架拆解 · 语义重组",
      lead: "底网本身沿 63:37 断层被劈开错移，但残存的两条隐形对齐回声与破层语义板把四项信息重新锁成清晰动线。",
      scan: "1 主标 → 2 青碧 → 3 珊瑚 → 4 压舱",
    },
  };

  let activeMode = "decon";
  let peel = 56; // 0..100%，左侧显示结构完整原网 / X 光底层，右侧显示所选变体
  let showAnchors = true;

  const btns = root.querySelectorAll("[data-s1-mode]");
  const range = root.querySelector("[data-s1-peel]");
  const anchorBtn = root.querySelector("[data-s1-anchors]");
  const stage = root.querySelector("[data-s1-stage]");
  const readoutTitle = root.querySelector("[data-s1-title]");
  const readoutText = root.querySelector("[data-s1-text]");
  const readoutScan = root.querySelector("[data-s1-scan]");
  const peelVal = root.querySelector("[data-s1-peel-val]");

  function buildRightLayer(mode) {
    if (mode === "modular") {
      return `
        <g>
          ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${50 + i * 96}" y1="26" x2="${50 + i * 96}" y2="306" stroke="#9EB0AC" stroke-width="1"/>`).join("")}
          ${[0, 1, 2, 3, 4].map((i) => `<line x1="50" y1="${26 + i * 70}" x2="530" y2="${26 + i * 70}" stroke="#9EB0AC" stroke-width="1"/>`).join("")}
          <rect x="50" y="26" width="192" height="140" fill="${PALETTE.panelSilver}" stroke="#879693"/>
          <text x="66" y="74" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="22">STRUCTURE</text>
          <text x="66" y="102" fill="${PALETTE.inkMuted}" font-family="'Space Grotesk',sans-serif" font-size="18">IS FIXED.</text>
          <rect x="242" y="26" width="192" height="140" fill="${PALETTE.teal}"/>
          <rect x="434" y="166" width="96" height="70" fill="${PALETTE.coral}"/>
          <rect x="50" y="236" width="192" height="70" fill="${PALETTE.inkPure}"/>
        </g>`;
    }
    if (mode === "broken") {
      return `
        <g>
          ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${50 + i * 96}" y1="26" x2="${50 + i * 96}" y2="306" stroke="#9EB0AC" stroke-width="1" stroke-dasharray="4 3"/>`).join("")}
          ${[0, 1, 2, 3, 4].map((i) => `<line x1="50" y1="${26 + i * 70}" x2="530" y2="${26 + i * 70}" stroke="#9EB0AC" stroke-width="1" stroke-dasharray="4 3"/>`).join("")}
          <rect x="50" y="96" width="212" height="140" fill="${PALETTE.panelSilver}" stroke="#6B7A77"/>
          <text x="66" y="142" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="21">LOCAL BREAK</text>
          <text x="66" y="168" fill="${PALETTE.inkMuted}" font-family="'Space Grotesk',sans-serif" font-size="16">GRID STAYS WHOLE</text>
          <rect x="308" y="14" width="176" height="148" fill="${PALETTE.teal}"/>
          <rect x="412" y="218" width="132" height="44" fill="${PALETTE.coral}"/>
          <rect x="242" y="236" width="120" height="70" fill="${PALETTE.inkPure}"/>
        </g>`;
    }
    // decon: 真实断层劈开四象限 + 银灰破层语义板 + 隐形延伸回声
    return `
      <g>
        <!-- 左上残片 -->
        <g transform="translate(-14,-8)">
          <rect x="50" y="26" width="290" height="122" fill="rgba(255,255,255,0.55)" stroke="${PALETTE.inkMuted}" stroke-width="1"/>
          <line x1="146" y1="26" x2="146" y2="148" stroke="#9EB0AC" stroke-dasharray="4 3"/>
          <line x1="242" y1="26" x2="242" y2="148" stroke="#9EB0AC" stroke-dasharray="4 3"/>
        </g>
        <!-- 右上残片 -->
        <g transform="translate(22,-16)">
          <rect x="340" y="26" width="190" height="122" fill="rgba(222,226,227,0.35)" stroke="${PALETTE.inkMuted}" stroke-width="1"/>
          <rect x="366" y="34" width="128" height="106" fill="${PALETTE.teal}"/>
          <rect x="366" y="102" width="42" height="38" fill="${PALETTE.inkPure}"/>
        </g>
        <!-- 左下残片 -->
        <g transform="translate(-6,18)">
          <rect x="50" y="148" width="290" height="158" fill="rgba(255,255,255,0.45)" stroke="${PALETTE.inkMuted}" stroke-width="1"/>
          <rect x="74" y="198" width="76" height="92" fill="${PALETTE.tealBright}"/>
        </g>
        <!-- 右下残片 -->
        <g transform="translate(18,12)">
          <rect x="340" y="148" width="190" height="158" fill="rgba(222,226,227,0.3)" stroke="${PALETTE.inkMuted}" stroke-width="1"/>
          <rect x="356" y="168" width="44" height="36" fill="${PALETTE.coral}"/>
          <rect x="386" y="248" width="116" height="34" fill="${PALETTE.inkPure}"/>
        </g>
        <!-- 中央破层银灰语义板 -->
        <rect x="118" y="114" width="246" height="132" fill="${PALETTE.panelSilver}" stroke="rgba(8,11,11,0.22)"/>
        <text x="138" y="152" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="22">STRUCTURE</text>
        <text x="138" y="178" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="22">IS FLEXIBLE,</text>
        <text x="138" y="206" fill="${PALETTE.inkMuted}" font-family="'Space Grotesk',sans-serif" font-size="18">MEANING IS NOT.</text>
        <rect x="138" y="224" width="48" height="3" fill="${PALETTE.ink}"/>
        <rect x="294" y="256" width="128" height="24" fill="${PALETTE.coral}"/>
        <circle cx="316" cy="96" r="34" fill="none" stroke="${PALETTE.ink}" stroke-width="1.1"/>
      </g>`;
  }

  function render() {
    const m = modes[activeMode];
    readoutTitle.textContent = `${m.name} · ${m.badge}`;
    readoutText.textContent = m.lead;
    readoutScan.textContent = m.scan;
    peelVal.textContent = `${peel}%`;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s1Mode === activeMode)));
    if (anchorBtn) anchorBtn.setAttribute("aria-pressed", String(showAnchors));

    const splitX = 50 + (480 * peel) / 100;
    const anchorSvg = showAnchors
      ? `<g>
          <line x1="364" y1="12" x2="364" y2="320" stroke="${PALETTE.tealText}" stroke-width="1.2" stroke-dasharray="6 4"/>
          <line x1="36" y1="148" x2="548" y2="148" stroke="${PALETTE.tealText}" stroke-width="1.2" stroke-dasharray="6 4"/>
          <path d="M236 178 L442 84 L388 268 L452 276" fill="none" stroke="${PALETTE.coralText}" stroke-width="1.5" stroke-dasharray="4 4"/>
          ${[
            [236, 178, "1"],
            [442, 84, "2"],
            [388, 268, "3"],
            [452, 276, "4"],
          ]
            .map(
              ([cx, cy, n]) =>
                `<circle cx="${cx}" cy="${cy}" r="10" fill="${PALETTE.coralText}"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#fff" font-family="'IBM Plex Mono',monospace" font-size="11" font-weight="600">${n}</text>`
            )
            .join("")}
        </g>`
      : "";

    stage.innerHTML = `
      <svg viewBox="0 0 580 332" class="s1-svg" role="img" aria-label="网格X光拉帘对比图">
        <defs>
          <clipPath id="s1-clip-left"><rect x="0" y="0" width="${splitX}" height="332"/></clipPath>
          <clipPath id="s1-clip-right"><rect x="${splitX}" y="0" width="${580 - splitX}" height="332"/></clipPath>
        </defs>
        <rect x="0" y="0" width="580" height="332" fill="${PALETTE.paper}"/>
        <!-- 左侧：原始 5×5 完整未拆网底层 -->
        <g clip-path="url(#s1-clip-left)">
          <rect x="0" y="0" width="580" height="332" fill="#E8EEEC"/>
          ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${50 + i * 96}" y1="26" x2="${50 + i * 96}" y2="306" stroke="#8F9E9B" stroke-width="1"/>`).join("")}
          ${[0, 1, 2, 3, 4].map((i) => `<line x1="50" y1="${26 + i * 70}" x2="530" y2="${26 + i * 70}" stroke="#8F9E9B" stroke-width="1"/>`).join("")}
          <rect x="50" y="26" width="192" height="140" fill="rgba(222,226,227,0.75)" stroke="#687774"/>
          <text x="64" y="72" fill="${PALETTE.inkSoft}" font-family="'IBM Plex Mono',monospace" font-size="12">BASE GRID 5×5</text>
          <text x="64" y="96" fill="${PALETTE.inkMuted}" font-family="'Noto Sans SC',sans-serif" font-size="14">先有严密底网</text>
          <text x="64" y="118" fill="${PALETTE.inkMuted}" font-family="'Noto Sans SC',sans-serif" font-size="14">拆解才有比例依据</text>
          <rect x="18" y="14" width="128" height="22" fill="${PALETTE.ink}"/>
          <text x="82" y="29" text-anchor="middle" fill="#fff" font-family="'IBM Plex Mono',monospace" font-size="11">ORIGIN · 5×5</text>
        </g>
        <!-- 右侧：所选网格模式 -->
        <g clip-path="url(#s1-clip-right)">
          ${buildRightLayer(activeMode)}
          ${anchorSvg}
          <rect x="404" y="14" width="158" height="22" fill="${PALETTE.tealText}"/>
          <text x="483" y="29" text-anchor="middle" fill="#fff" font-family="'IBM Plex Mono',monospace" font-size="11">${activeMode.toUpperCase()} VIEW</text>
        </g>
        <!-- 拉帘分割线 -->
        <line x1="${splitX}" y1="0" x2="${splitX}" y2="332" stroke="${PALETTE.ink}" stroke-width="2"/>
        <rect x="${splitX - 16}" y="150" width="32" height="32" fill="${PALETTE.ink}"/>
        <text x="${splitX}" y="170" text-anchor="middle" fill="#fff" font-family="'IBM Plex Mono',monospace" font-size="13">↔</text>
      </svg>`;
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      activeMode = b.dataset.s1Mode;
      render();
    })
  );
  range.addEventListener("input", () => {
    peel = Number(range.value);
    render();
  });
  if (anchorBtn) {
    anchorBtn.addEventListener("click", () => {
      showAnchors = !showAnchors;
      render();
    });
  }
  render();
}

// ==================== 02 四步重构法：四阶轴测步进器 ====================
export function mountSection02(root) {
  if (!root) return;
  const steps = [
    {
      num: "01",
      tag: "敢于破坏 · 先立后破",
      title: "先铺满一张比例严谨的 5×5 基础网",
      desc: "原海报写「先理解网格，再打破网格」。如果一开始连基准栏宽与行距都没有，后面的「拆」只会变成毫无章法的乱摆。",
      echoNote: "完整 5×5 基准线尚未劈开，所有潜在比例锚点处于隐藏待命状态。",
    },
    {
      num: "02",
      tag: "引导视线 · 非对称劈缝",
      title: "沿 63:37 断层线劈开骨架，拒绝正中对半",
      desc: "两条互相垂直的断层把完整网格切成四块不等大板块。因为留住了原格子的单位宽度，每块残片内部仍说同一种比例语言。",
      echoNote: "青色断层线劈开了连续性，但相邻板块之间仍有 2 条共享延伸对齐回声。",
    },
    {
      num: "03",
      tag: "层级清晰 · 错位并抬升语义板",
      title: "沿断层滑移板块，把核心文字抬升到前景净空层",
      desc: "四块网格沿断层错位滑出节奏停顿，中央银灰语义板向上破层浮出，字重做足粗细对比，保证信息分散但第一眼可读。",
      echoNote: "核心语义板占据独立 Z 层，与底网错开形成立体纵深。",
    },
    {
      num: "04",
      tag: "重构平衡 · 对角压舱定序",
      title: "用青碧、珊瑚红与纯黑做对角配重，建立新秩序",
      desc: "在不完整中重建秩序：右上大青碧块与左下青碧角呼应，珊瑚红作为视线转折点，纯黑压住右下角收束整幅版面。",
      echoNote: "四块残片 + 三原功能色 + 破层语义板在新的重心上重新咬合。",
    },
  ];

  let cur = 0;
  let showEcho = true;

  const stepBtns = root.querySelectorAll("[data-s2-step]");
  const echoBtn = root.querySelector("[data-s2-echo]");
  const viz = root.querySelector("[data-s2-viz]");
  const titleEl = root.querySelector("[data-s2-title]");
  const descEl = root.querySelector("[data-s2-desc]");
  const echoNoteEl = root.querySelector("[data-s2-echonote]");

  function render() {
    const s = steps[cur];
    titleEl.textContent = `${s.num} · ${s.title}`;
    descEl.textContent = s.desc;
    echoNoteEl.textContent = showEcho
      ? s.echoNote
      : "已关闭残留对齐回声：注意看各块边缘似乎失去联系——这就是为什么真正的解构必须藏着隐形对齐轴。";

    stepBtns.forEach((b) => {
      const idx = Number(b.dataset.s2Step);
      b.setAttribute("aria-pressed", String(idx === cur));
    });
    echoBtn.setAttribute("aria-pressed", String(showEcho));

    // 根据步骤计算四块残片错位与前景层抬升高度
    const split = cur === 0 ? 0 : cur === 1 ? 10 : 20;
    const liftY = cur >= 2 ? -24 : 0;
    const showColors = cur >= 3;
    const showCut = cur >= 1;

    viz.innerHTML = `
      <svg viewBox="0 0 560 320" class="s2-svg" role="img" aria-label="四步解构重构轴测示意">
        <rect x="0" y="0" width="560" height="320" fill="${PALETTE.paperBright}"/>
        <!-- 底层坐标影 -->
        <g transform="translate(280,176) scale(1,0.58) rotate(-32)">
          <!-- 原整网残影 -->
          <rect x="-150" y="-120" width="300" height="240" fill="none" stroke="${PALETTE.gridGhost}" stroke-width="1.2" stroke-dasharray="5 4"/>

          <!-- NW 片 -->
          <g transform="translate(${-split * 0.9},${-split * 0.4})">
            <rect x="-150" y="-120" width="186" height="102" fill="#FFFFFF" stroke="${PALETTE.inkMuted}" stroke-width="1.4"/>
            <line x1="-88" y1="-120" x2="-88" y2="-18" stroke="#BDC8C5"/>
            <line x1="-26" y1="-120" x2="-26" y2="-18" stroke="#BDC8C5"/>
          </g>
          <!-- NE 片 -->
          <g transform="translate(${split * 1.1},${-split * 0.9})">
            <rect x="36" y="-120" width="114" height="102" fill="${PALETTE.paper}" stroke="${PALETTE.inkMuted}" stroke-width="1.4"/>
            ${showColors ? `<rect x="50" y="-108" width="84" height="76" fill="${PALETTE.teal}"/><rect x="50" y="-56" width="28" height="24" fill="${PALETTE.inkPure}"/>` : ""}
          </g>
          <!-- SW 片 -->
          <g transform="translate(${-split * 0.35},${split * 0.85})">
            <rect x="-150" y="-18" width="186" height="138" fill="#FFFFFF" stroke="${PALETTE.inkMuted}" stroke-width="1.4"/>
            ${showColors ? `<rect x="-132" y="42" width="54" height="62" fill="${PALETTE.tealBright}"/>` : ""}
          </g>
          <!-- SE 片 -->
          <g transform="translate(${split * 0.85},${split * 0.55})">
            <rect x="36" y="-18" width="114" height="138" fill="${PALETTE.paper}" stroke="${PALETTE.inkMuted}" stroke-width="1.4"/>
            ${showColors ? `<rect x="48" y="4" width="34" height="28" fill="${PALETTE.coral}"/><rect x="64" y="76" width="72" height="26" fill="${PALETTE.inkPure}"/>` : ""}
          </g>

          <!-- 断层切线与残留对齐回声 -->
          ${
            showCut && showEcho
              ? `<line x1="36" y1="-156" x2="36" y2="156" stroke="${PALETTE.tealText}" stroke-width="2" stroke-dasharray="8 5"/>
                 <line x1="-186" y1="-18" x2="186" y2="-18" stroke="${PALETTE.tealText}" stroke-width="2" stroke-dasharray="8 5"/>`
              : ""
          }
        </g>

        <!-- 前景核心语义板（Step 3–4 明显抬升破层） -->
        <g transform="translate(280,${172 + liftY}) scale(1,0.58) rotate(-32)">
          ${
            cur >= 2
              ? `<rect x="-92" y="-56" width="186" height="118" fill="rgba(8,11,11,0.14)" transform="translate(10,18)"/>`
              : ""
          }
          <rect x="-92" y="-56" width="186" height="118" fill="${cur >= 2 ? PALETTE.panelSilver : "rgba(222,226,227,0.55)"}" stroke="${cur >= 2 ? PALETTE.ink : PALETTE.ruleStrong}" stroke-width="${cur >= 2 ? 1.8 : 1.1}"/>
          <text x="-74" y="-16" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="18">MEANING</text>
          <text x="-74" y="10" fill="${PALETTE.inkMuted}" font-family="'Space Grotesk',sans-serif" font-size="15">STAYS INTACT</text>
          <rect x="-74" y="30" width="46" height="4" fill="${PALETTE.ink}"/>
          ${showColors ? `<rect x="26" y="46" width="84" height="20" fill="${PALETTE.coral}"/>` : ""}
        </g>

        <!-- 左上阶梯状态标注 -->
        <rect x="16" y="14" width="128" height="24" fill="${PALETTE.ink}"/>
        <text x="80" y="30" text-anchor="middle" fill="#fff" font-family="'IBM Plex Mono',monospace" font-size="11.5" font-weight="600">STEP ${s.num} / 04</text>
        <text x="542" y="30" text-anchor="end" fill="${PALETTE.inkSoft}" font-family="'IBM Plex Mono',monospace" font-size="11">${showEcho ? "ECHO AXES: ON" : "ECHO AXES: OFF"}</text>
      </svg>`;
  }

  stepBtns.forEach((b) =>
    b.addEventListener("click", () => {
      cur = Number(b.dataset.s2Step);
      render();
    })
  );
  echoBtn.addEventListener("click", () => {
    showEcho = !showEcho;
    render();
  });
  render();
}

// ==================== 03 层级与留白：暗室三维度离散压力矩阵 ====================
export function mountSection03(root) {
  if (!root) return;
  const st = {
    scale: "mid", // "flat" (1.2×) | "mid" (2.4×) | "high" (3.6×)
    space: "balanced", // "tight" (14%) | "balanced" (38%) | "sparse" (60%)
    corridor: "protected", // "invaded" | "protected"
  };

  const preview = root.querySelector("[data-s3-preview]");
  const verdict = root.querySelector("[data-s3-verdict]");
  const detail = root.querySelector("[data-s3-detail]");
  const loadEl = root.querySelector("[data-s3-load]");

  function render() {
    root.querySelectorAll("[data-s3-scale]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.s3Scale === st.scale))
    );
    root.querySelectorAll("[data-s3-space]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.s3Space === st.space))
    );
    root.querySelectorAll("[data-s3-corridor]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.s3Corridor === st.corridor))
    );

    preview.dataset.scale = st.scale;
    preview.dataset.space = st.space;
    preview.dataset.corridor = st.corridor;

    // 真实规则判定（档位 + 示意，绝不装精确百分比）
    const errs = [];
    if (st.corridor === "invaded") errs.push("青红碎片直接切穿正文区，字句被截断，读者必须费力拼读");
    if (st.scale === "flat") errs.push("主标与正文只有 1.2× 字级差，拆散后眼睛找不到阅读入口");
    if (st.space === "tight") errs.push("留白压到约 14%，断层块之间互相挤压，失去节奏停顿");
    if (st.space === "sparse" && st.scale === "flat") errs.push("大面积空白叠加平权字号，信息像散落的纸屑");

    if (errs.length === 0) {
      verdict.textContent =
        st.scale === "high"
          ? "张力充沛 · 语义一眼锁定"
          : "结构清晰 · 可读性稳固";
      verdict.dataset.state = "ok";
      detail.textContent =
        st.space === "sparse"
          ? "宽裕留白（约 60%）配合清晰主次字级与净空护城框，适合美术馆海报与先锋专刊。"
          : "主次字级跨度明确、色块停在语义护城框外侧、留白留出呼吸通道——结构虽拆，意义零损耗。";
      loadEl.textContent = st.scale === "high" ? "极速锁定（示意）" : "轻快通畅（示意）";
    } else {
      verdict.textContent =
        st.corridor === "invaded"
          ? "语义受侵 · 结构盖过信息"
          : st.scale === "flat"
          ? "入口迷失 · 层级过平"
          : "呼吸窒息 · 留白不足";
      verdict.dataset.state = "warn";
      detail.textContent = errs.join("；") + "。";
      loadEl.textContent = errs.length >= 2 ? "严重卡顿（示意）" : "扫读吃力（示意）";
    }
  }

  root.querySelectorAll("[data-s3-scale]").forEach((b) =>
    b.addEventListener("click", () => {
      st.scale = b.dataset.s3Scale;
      render();
    })
  );
  root.querySelectorAll("[data-s3-space]").forEach((b) =>
    b.addEventListener("click", () => {
      st.space = b.dataset.s3Space;
      render();
    })
  );
  root.querySelectorAll("[data-s3-corridor]").forEach((b) =>
    b.addEventListener("click", () => {
      st.corridor = b.dataset.s3Corridor;
      render();
    })
  );
  render();
}

// ==================== 04 从哪来：年代切片标本匣（1967–2004） ====================
export function mountSection04(root) {
  if (!root) return;
  const eras = [
    {
      year: "1968–1974",
      title: "巴塞尔松绑 · Wolfgang Weingart",
      place: "瑞士巴塞尔设计学院 · MoMA 馆藏",
      body: "1968 年 Wolfgang Weingart 受 Armin Hofmann 与 Emil Ruder 邀请赴瑞士巴塞尔设计学院任教。他在传统铅字与照相排字间做系统实验，借 1972–1973 年《Typografische Monatsblätter》封面与《Typographic Process》（1971–1974，纽约 MoMA 馆藏）拉宽字距、切片叠印、打破严格正交，率先松动瑞士国际主义网格。",
      svg: `
        <rect x="0" y="0" width="320" height="210" fill="${PALETTE.paper}"/>
        <line x1="24" y1="32" x2="296" y2="32" stroke="${PALETTE.ruleStrong}"/>
        <line x1="24" y1="178" x2="296" y2="178" stroke="${PALETTE.ruleStrong}"/>
        <rect x="34" y="46" width="248" height="32" fill="${PALETTE.ink}"/>
        <text x="44" y="68" fill="#fff" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="16" letter-spacing="8">TYPO PROCESS</text>
        <rect x="64" y="88" width="124" height="76" fill="${PALETTE.teal}" opacity="0.85"/>
        <line x1="34" y1="164" x2="276" y2="90" stroke="${PALETTE.coral}" stroke-width="2.5"/>
        <rect x="136" y="102" width="142" height="54" fill="${PALETTE.panelSilver}" stroke="${PALETTE.ink}"/>
        <text x="148" y="135" fill="${PALETTE.ink}" font-family="'IBM Plex Mono',monospace" font-size="13" letter-spacing="3">BASEL 1972</text>`,
    },
    {
      year: "1970s末–1984",
      title: "学院理论与《Emigre》数字排印",
      place: "Cranbrook 学院 · 加州伯克利 · MoMA 全套馆藏",
      body: "法国哲学家 Jacques Derrida 在《论文字学》（1967，英译 1976）中讨论「间距」对文本意义的建构；随后 Katherine McCoy 在 Cranbrook 学院将后结构主义引入版面教学。1984 年，与苹果 Macintosh 同年，Rudy VanderLans 与 Zuzana Licko 创办《Emigre》杂志（1984–2005 共 69 期，MoMA 收藏全套），以早期点阵字体和自由分栏改写了出版网格。",
      svg: `
        <rect x="0" y="0" width="320" height="210" fill="${PALETTE.paper}"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${28 + i * 38}" y="${28 + (i % 2) * 14}" width="26" height="26" fill="${i % 3 === 0 ? PALETTE.ink : PALETTE.panelSilver}"/>`).join("")}
        <rect x="28" y="82" width="118" height="98" fill="#fff" stroke="${PALETTE.ink}" stroke-dasharray="4 3"/>
        <text x="38" y="108" fill="${PALETTE.ink}" font-family="'IBM Plex Mono',monospace" font-size="12">EMIGRE #01</text>
        <text x="38" y="130" fill="${PALETTE.tealText}" font-family="'IBM Plex Mono',monospace" font-size="11">1984 — 2005</text>
        <rect x="166" y="72" width="124" height="62" fill="${PALETTE.teal}"/>
        <rect x="184" y="144" width="106" height="36" fill="${PALETTE.coral}"/>`,
    },
    {
      year: "1986",
      title: "折页海报拆解杂志 · April Greiman",
      place: "Walker Art Center · Design Quarterly #133 · MoMA 馆藏",
      body: "1986 年，美国设计师 April Greiman 受 Walker Art Center 委托制作《Design Quarterly》第 133 期《Does It Make Sense?》。她放弃传统 32 页装订册，用早期 Macintosh 的 MacDraw 拼接出一张约 2×6 英尺的双面巨幅折页海报，把时间轴、像素图与层叠网格融成空间式阅读。",
      svg: `
        <rect x="0" y="0" width="320" height="210" fill="${PALETTE.paper}"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${24 + i * 68}" y="${26 + (i % 2) * 10}" width="64" height="150" fill="${i === 1 ? PALETTE.panelSilver : "#fff"}" stroke="${PALETTE.ruleStrong}"/>`).join("")}
        <rect x="44" y="54" width="144" height="44" fill="${PALETTE.teal}" opacity="0.88"/>
        <rect x="130" y="108" width="144" height="44" fill="${PALETTE.ink}"/>
        <text x="142" y="135" fill="#fff" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="13">DQ #133 · 1986</text>
        <line x1="24" y1="98" x2="296" y2="98" stroke="${PALETTE.coral}" stroke-width="2" stroke-dasharray="5 3"/>`,
    },
    {
      year: "1988",
      title: "建筑展正式定名 · MoMA 解构建筑展",
      place: "纽约现代艺术博物馆（1988.6.23–8.30）",
      body: "Philip Johnson 与 Mark Wigley 在纽约 MoMA 策展《Deconstructivist Architecture》，集中展出 Bernard Tschumi、Peter Eisenman、Frank Gehry、Zaha Hadid、Rem Koolhaas、Daniel Libeskind 与 Coop Himmelblau 七组建筑师作品。Tschumi 自 1982 年设计的巴黎拉维莱特公园，将严整点阵网格与红色解构亭（folies）叠加错位，成为平面解构网格的直接空间范本。",
      svg: `
        <rect x="0" y="0" width="320" height="210" fill="${PALETTE.paper}"/>
        ${[0, 1, 2, 3, 4, 5].map((c) => [0, 1, 2, 3].map((r) => `<circle cx="${44 + c * 46}" cy="${40 + r * 44}" r="2.5" fill="${PALETTE.inkSoft}"/>`).join("")).join("")}
        <g transform="rotate(-14 160 105)">
          <line x1="36" y1="74" x2="290" y2="74" stroke="${PALETTE.tealText}" stroke-width="1.6"/>
          <line x1="120" y1="24" x2="120" y2="188" stroke="${PALETTE.tealText}" stroke-width="1.6"/>
          <rect x="112" y="66" width="32" height="32" fill="${PALETTE.coral}"/>
          <rect x="204" y="110" width="28" height="28" fill="${PALETTE.coral}"/>
          <rect x="52" y="120" width="30" height="24" fill="${PALETTE.ink}"/>
        </g>`,
    },
    {
      year: "1992–1995",
      title: "杂志实验潮 · David Carson《Ray Gun》",
      place: "《Ray Gun》(1992) · 《The End of Print》(1995)",
      body: "1992 年 David Carson 担任另类音乐杂志《Ray Gun》艺术指导，把栏目撕裂、跨页叠印、裁剪标题，提出「不要把易认性与沟通混为一谈」，在摇滚青年文化中把解构版式推至极限；1995 年与 Lewis Blackwell 合著的《The End of Print》记录了这场反规整浪潮，也反向提醒后人：情绪表达过头就会伤及阅读。",
      svg: `
        <rect x="0" y="0" width="320" height="210" fill="${PALETTE.ink}"/>
        <rect x="26" y="28" width="126" height="154" fill="${PALETTE.panelSilver}"/>
        <rect x="142" y="54" width="152" height="96" fill="${PALETTE.teal}"/>
        <text x="36" y="92" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="24">RAY GUN</text>
        <text x="154" y="118" fill="${PALETTE.ink}" font-family="'IBM Plex Mono',monospace" font-weight="600" font-size="16">1992 / 1995</text>
        <rect x="82" y="138" width="184" height="26" fill="${PALETTE.coral}"/>`,
    },
    {
      year: "1994–2004",
      title: "回到教学系统 · Ellen Lupton",
      place: "Visible Language (1994) · Thinking with Type (2004)",
      body: "1994 年 Ellen Lupton 与 J. Abbott Miller 在《Visible Language》发表论文《Deconstruction and Graphic Design》（1996 年收入《Design Writing Research》），把解构拆解为可分析的间距、层级与框架操作；2004 年 Lupton 出版《Thinking with Type》（Princeton Architectural Press），将网格的建构与解构并置为当代设计师的必修双翼。",
      svg: `
        <rect x="0" y="0" width="320" height="210" fill="${PALETTE.paperBright}"/>
        <rect x="28" y="26" width="122" height="158" fill="${PALETTE.paper}" stroke="${PALETTE.ink}"/>
        <line x1="68" y1="26" x2="68" y2="184" stroke="${PALETTE.ruleStrong}"/>
        <line x1="110" y1="26" x2="110" y2="184" stroke="${PALETTE.ruleStrong}"/>
        <rect x="166" y="26" width="126" height="72" fill="${PALETTE.teal}"/>
        <rect x="142" y="84" width="136" height="78" fill="${PALETTE.panelSilver}" stroke="${PALETTE.ink}"/>
        <text x="154" y="118" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="14">THINKING</text>
        <text x="154" y="138" fill="${PALETTE.inkMuted}" font-family="'Space Grotesk',sans-serif" font-size="13">WITH TYPE · 2004</text>
        <rect x="228" y="170" width="64" height="14" fill="${PALETTE.coral}"/>`,
    },
  ];

  let cur = 0;
  const tabs = root.querySelectorAll("[data-s4-era]");
  const yearEl = root.querySelector("[data-s4-year]");
  const titleEl = root.querySelector("[data-s4-title]");
  const placeEl = root.querySelector("[data-s4-place]");
  const bodyEl = root.querySelector("[data-s4-body]");
  const figEl = root.querySelector("[data-s4-fig]");

  function render() {
    const e = eras[cur];
    yearEl.textContent = e.year;
    titleEl.textContent = e.title;
    placeEl.textContent = e.place;
    bodyEl.textContent = e.body;
    figEl.innerHTML = `<svg viewBox="0 0 320 210" class="s4-svg" role="img" aria-label="${e.title} 结构缩略图">${e.svg}</svg>`;
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(Number(t.dataset.s4Era) === cur)));
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      cur = Number(t.dataset.s4Era);
      render();
    })
  );
  render();
}

// ==================== 05 何时用与别用：六场景适配翻检卡 ====================
export function mountSection05(root) {
  if (!root) return;
  const cases = [
    {
      id: "exhibition",
      name: "当代建筑双年展主海报",
      verdict: "推荐解构",
      tone: "ok",
      why: "受众期待鲜明的空间张力与审美态度，信息条目少（展名、展期、地点、策展方），最适合用断层错位与破层语义板制造停留感。",
      risk: "注意守住展期与地点的高对比净空区，不可被装饰色块压字。",
      altLabel: "本页 211 正适用",
      altUrl: null,
      goodSvg: `<rect width="220" height="120" fill="${PALETTE.paper}"/><rect x="128" y="14" width="66" height="48" fill="${PALETTE.teal}"/><rect x="34" y="34" width="112" height="58" fill="${PALETTE.panelSilver}" stroke="${PALETTE.ink}"/><text x="44" y="64" fill="${PALETTE.ink}" font-family="'Noto Sans SC',sans-serif" font-weight="700" font-size="14">空隙建筑展</text><text x="44" y="82" fill="${PALETTE.inkMuted}" font-family="'IBM Plex Mono',monospace" font-size="10">10.12–11.20</text><rect x="132" y="92" width="58" height="14" fill="${PALETTE.coral}"/>`,
    },
    {
      id: "medicine",
      name: "医院急诊用药剂量表",
      verdict: "严禁解构",
      tone: "no",
      why: "用药剂量、频次与禁忌属于零容错场景。一旦打断行列对齐，读者极易把上一行药品的剂量看串到下一行，后果严重。",
      risk: "错用解构会导致数字错行、扫视路径折返，必须保证绝对对齐。",
      altLabel: "改用 196 模块化网格 →",
      altUrl: "https://layout.xiaoxiaodong.ai/196/play/",
      goodSvg: `<rect width="220" height="120" fill="#fff"/>${[0, 1, 2, 3].map((r) => `<line x1="16" y1="${24 + r * 24}" x2="204" y2="${24 + r * 24}" stroke="#B8C4C1"/>`).join("")}<line x1="118" y1="24" x2="118" y2="96" stroke="#B8C4C1"/><text x="22" y="40" fill="${PALETTE.ink}" font-family="'Noto Sans SC',sans-serif" font-size="11">药品名称</text><text x="126" y="40" fill="${PALETTE.ink}" font-family="'Noto Sans SC',sans-serif" font-size="11">单次剂量</text><text x="22" y="64" fill="${PALETTE.inkMuted}" font-family="'Noto Sans SC',sans-serif" font-size="11">布洛芬缓释</text><text x="126" y="64" fill="${PALETTE.coralText}" font-family="'IBM Plex Mono',monospace" font-weight="600" font-size="11">300mg × 2</text>`,
    },
    {
      id: "vinyl",
      name: "独立电子乐黑胶封套",
      verdict: "推荐解构",
      tone: "ok",
      why: "实验音像文化本身强调切分节奏与非线性采样，用断续网格、空心校准圆和错层标题能直接外化听觉结构。",
      risk: "封底曲目表仍需保留一条清晰对齐基线，方便快速检索曲号。",
      altLabel: "本页 211 正适用",
      altUrl: null,
      goodSvg: `<rect width="220" height="120" fill="${PALETTE.darkTealRoom}"/><rect x="18" y="16" width="84" height="84" fill="${PALETTE.teal}"/><rect x="78" y="34" width="114" height="54" fill="${PALETTE.panelSilver}"/><text x="88" y="64" fill="${PALETTE.ink}" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="15">SIDE A / 09</text><rect x="150" y="94" width="48" height="12" fill="${PALETTE.coral}"/>`,
    },
    {
      id: "finance",
      name: "上市公司财报资产表",
      verdict: "严禁解构",
      tone: "no",
      why: "财务数据依赖严格纵向小数点对齐和横向年份比对；哪怕轻微错位，都会直接破坏数值核对效率与专业可信度。",
      risk: "绝对不要拿「设计感」去拆财务表格，清晰工整就是最高审美。",
      altLabel: "改用 201 方格网格 →",
      altUrl: "https://layout.xiaoxiaodong.ai/201/play/",
      goodSvg: `<rect width="220" height="120" fill="#fff"/>${[0, 1, 2, 3].map((r) => `<line x1="16" y1="${24 + r * 24}" x2="204" y2="${24 + r * 24}" stroke="#C5CECC"/>`).join("")}<text x="22" y="40" fill="${PALETTE.ink}" font-family="'IBM Plex Mono',monospace" font-size="10.5">Q1  1,240.00</text><text x="22" y="64" fill="${PALETTE.ink}" font-family="'IBM Plex Mono',monospace" font-size="10.5">Q2  1,385.50</text><text x="22" y="88" fill="${PALETTE.tealText}" font-family="'IBM Plex Mono',monospace" font-weight="600" font-size="10.5">Q3  1,512.80</text>`,
    },
    {
      id: "novel",
      name: "十万字长篇小说内文",
      verdict: "严禁解构",
      tone: "no",
      why: "深度沉浸阅读依赖均匀的行宽、恒定的基线与无打扰的版心节奏；频繁跳动的错层栏位会在三页之内迅速耗尽读者的眼力。",
      risk: "仅可在卷首扉页或章节跨页做克制破层，正文页必须回归单栏稳态。",
      altLabel: "改用 194 手稿网格 →",
      altUrl: "https://layout.xiaoxiaodong.ai/194/play/",
      goodSvg: `<rect width="220" height="120" fill="${PALETTE.paperBright}"/><rect x="46" y="18" width="128" height="84" fill="#fff" stroke="${PALETTE.ruleStrong}"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="58" y="${30 + i * 13}" width="${i === 4 ? 76 : 104}" height="4" fill="${PALETTE.inkSoft}"/>`).join("")}`,
    },
    {
      id: "fashion",
      name: "先锋时装周数字特刊首屏",
      verdict: "谨慎可控",
      tone: "caution",
      why: "桌面宽屏可放心施展跨断层错位与大留白，但手机竖屏宽度受限，必须把横向多片错位收束为纵向层级叠压，避免横向溢出。",
      risk: "多端发布时需在移动端降维为有序纵向流，可配合响应式断点管理。",
      altLabel: "多端断点见 209 响应式网格 →",
      altUrl: "https://layout.xiaoxiaodong.ai/209/play/",
      goodSvg: `<rect width="220" height="120" fill="${PALETTE.paper}"/><rect x="16" y="16" width="114" height="88" fill="#fff" stroke="${PALETTE.ink}"/><rect x="64" y="28" width="58" height="36" fill="${PALETTE.teal}"/><rect x="26" y="48" width="70" height="34" fill="${PALETTE.panelSilver}"/><rect x="150" y="16" width="52" height="88" fill="#fff" stroke="${PALETTE.ink}"/><rect x="156" y="24" width="40" height="22" fill="${PALETTE.teal}"/><rect x="156" y="52" width="40" height="26" fill="${PALETTE.panelSilver}"/>`,
    },
  ];

  let cur = 0;
  const cards = root.querySelectorAll("[data-s5-case]");
  const badgeEl = root.querySelector("[data-s5-badge]");
  const titleEl = root.querySelector("[data-s5-title]");
  const whyEl = root.querySelector("[data-s5-why]");
  const riskEl = root.querySelector("[data-s5-risk]");
  const linkWrap = root.querySelector("[data-s5-link]");
  const figEl = root.querySelector("[data-s5-fig]");

  function render() {
    const c = cases[cur];
    badgeEl.textContent = c.verdict;
    badgeEl.dataset.tone = c.tone;
    titleEl.textContent = c.name;
    whyEl.textContent = c.why;
    riskEl.textContent = c.risk;
    figEl.innerHTML = `<svg viewBox="0 0 220 120" class="s5-svg" role="img" aria-label="${c.name} 示意">${c.goodSvg}</svg>`;
    if (c.altUrl) {
      linkWrap.innerHTML = `<a class="s5-alt-link" href="${c.altUrl}" target="_blank" rel="noopener">${c.altLabel}</a>`;
    } else {
      linkWrap.innerHTML = `<span class="s5-alt-tag">${c.altLabel}</span>`;
    }
    cards.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.s5Case) === cur)));
  }

  cards.forEach((b) =>
    b.addEventListener("click", () => {
      cur = Number(b.dataset.s5Case);
      render();
    })
  );
  render();
}

// ==================== 06 实战小练习：单变量四选一 + X 光批改 ====================
export function mountSection06(root) {
  if (!root) return;
  const CORRECT = "C";
  const explanations = {
    A: {
      ok: false,
      head: "未选中正解 · 方案 A 只做了常规填色，并未解构网格",
      body: "方案 A 把主标、青碧块与珊瑚块严严实实关在未拆分的 5×5 工整格子里，虽然清晰无误，但属于 196 模块化网格而非 211 解构网格——缺少断层分解与非对称张力。",
    },
    B: {
      ok: false,
      head: "未选中正解 · 方案 B 让结构破坏了语义可读性",
      body: "方案 B 确实切开了非对称断层，但青碧色块直接盖住了主标「建筑」两字、展期又被甩到遥远左下角，违背了「结构可变，意义不变」的底线。",
    },
    C: {
      ok: true,
      head: "判断准确 · 方案 C 真正做到了「拆网不拆义」",
      body: "底层 5×5 在非对称断层处拆解滑移，仍留住两条隐形对齐回声；银灰主标板占据净空破层零遮挡，青碧与珊瑚红形成对角压舱，视线顺「空隙建筑 → 10.12–11.20 → 导语」单向抵达。",
    },
    D: {
      ok: false,
      head: "未选中正解 · 方案 D 是失控堆砌而非重构秩序",
      body: "方案 D 把所有板块任意斜转 ±24°–35° 并互相挤压，底网基准轴彻底消失、净留白塌陷，看起来最「炸裂」，实则失去了重构后的新平衡。",
    },
  };

  let picked = null;
  const optBtns = root.querySelectorAll("[data-quiz-opt]");
  const fbBox = root.querySelector("[data-quiz-fb]");
  const fbHead = root.querySelector("[data-quiz-head]");
  const fbBody = root.querySelector("[data-quiz-body]");
  const resetBtn = root.querySelector("[data-quiz-reset]");

  function render() {
    root.dataset.answered = picked ? "true" : "false";
    optBtns.forEach((btn) => {
      const id = btn.dataset.quizOpt;
      btn.setAttribute("aria-pressed", String(picked === id));
      btn.dataset.judge = !picked
        ? ""
        : id === CORRECT
        ? "correct"
        : id === picked
        ? "wrong"
        : "dim";
    });
    if (!picked) {
      fbBox.hidden = true;
    } else {
      const e = explanations[picked];
      fbBox.hidden = false;
      fbBox.dataset.tone = e.ok ? "ok" : "warn";
      fbHead.textContent = e.head;
      fbBody.textContent = e.body;
    }
  }

  optBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      picked = btn.dataset.quizOpt;
      render();
    })
  );
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      picked = null;
      render();
    });
  }
  render();
}
