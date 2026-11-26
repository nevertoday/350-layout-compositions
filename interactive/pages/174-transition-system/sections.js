// 174 过渡系统 · 正文 01–07 全部专属互动组件（每节控件不同，离线轻量高帧率）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PAL, clamp, lerp, mixHex, rgba } from "./palette.js";

// =========================================================================
// 01 节：双轨视线竞速仪（对比无过渡硬切 vs 阶梯过渡的眼动停顿与连贯度）
// =========================================================================
export function mountSection01() {
  const root = document.getElementById("s01-racer");
  if (!root) return;

  const modes = {
    2: {
      label: "2 阶硬切",
      topCount: 2,
      botCount: 2,
      topStops: "1 次强撞崖（示意）",
      botStops: "仍缺中间过渡（示意）",
      summary: "只有起点和焦点两头时，无论怎么排版都像跨过一道深沟——2 阶只能叫「对比」，还不是「过渡」。",
    },
    4: {
      label: "4 阶过渡",
      topCount: 2,
      botCount: 4,
      topStops: "2 次急刹折返（示意）",
      botStops: "0 次断层顺流（示意）",
      summary: "加入 2 个承接中阶（比例约 1.4×–1.6× 递进）后，格式塔良好连续性接管扫视，眼睛一路滑进焦点。",
    },
    7: {
      label: "7 阶过密",
      topCount: 2,
      botCount: 7,
      topStops: "硬切跳变（示意）",
      botStops: "阶差碎散、失焦（示意）",
      summary: "台阶塞到 7 阶以上时，相邻两步肉眼几乎分不出差别（单步仅 ~1.12×），版面反而显得拖沓犹豫。",
    },
  };

  let curSteps = 4;
  let running = false;
  let tRun = 0;
  let raf = 0;
  let lastTs = 0;

  const svgBot = root.querySelector("#s01-bot-svg");
  const svgTop = root.querySelector("#s01-top-svg");
  const topStat = root.querySelector("#s01-top-stat");
  const botStat = root.querySelector("#s01-bot-stat");
  const noteEl = root.querySelector("#s01-note");
  const btns = [...root.querySelectorAll("[data-s01-steps]")];
  const playBtn = root.querySelector("#s01-play");

  function drawTracks(p) {
    const m = modes[curSteps];
    // 上轨：硬切反例（大块硬方突然撞小圆或断崖）
    const topNodes = [
      { x: 64, r: 10, rx: 0, fill: PAL.coral },
      { x: 240, r: 30, rx: 0, fill: PAL.clashA },
      { x: 382, r: 13, rx: 13, fill: PAL.flatGray },
      { x: 528, r: 34, rx: 0, fill: PAL.gold },
    ];
    // 上轨视线光球（停顿颠簸示意）
    const pTop = clamp(p, 0, 1);
    const jerky = pTop < 0.3 ? lerp(64, 240, pTop / 0.3)
      : pTop < 0.55 ? 240
      : pTop < 0.78 ? lerp(240, 382, (pTop - 0.55) / 0.23)
      : lerp(382, 528, Math.pow((pTop - 0.78) / 0.22, 2));

    svgTop.innerHTML = `
      <line x1="64" y1="48" x2="528" y2="48" stroke="#ACA4C0" stroke-width="1.5" stroke-dasharray="4 6"/>
      ${topNodes.map((n, i) => `
        <rect x="${n.x - n.r}" y="${48 - n.r}" width="${n.r * 2}" height="${n.r * 2}" rx="${n.rx}" fill="${n.fill}" opacity="0.9"/>
        ${i < topNodes.length - 1 ? `<text x="${(n.x + topNodes[i + 1].x) * 0.5}" y="22" text-anchor="middle" fill="${PAL.errLight}" font-size="11" font-weight="700">×</text>` : ""}
      `).join("")}
      ${running || p > 0 ? `<circle cx="${jerky.toFixed(1)}" cy="48" r="7" fill="${PAL.ink}" stroke="#FFFFFF" stroke-width="2.5"/>` : ""}
    `;

    // 下轨：按 curSteps 动态绘制真实递进台阶
    const n = m.botCount;
    const xs = Array.from({ length: n }, (_, i) => lerp(64, 524, n === 1 ? 0.5 : i / (n - 1)));
    const rs = Array.from({ length: n }, (_, i) => {
      const f = n === 1 ? 1 : i / (n - 1);
      return lerp(11, 34, Math.pow(f, 1.15));
    });
    const cols = Array.from({ length: n }, (_, i) => {
      const f = n === 1 ? 1 : i / (n - 1);
      return f < 0.5 ? mixHex(PAL.coral, PAL.orange, f * 2) : mixHex(PAL.orange, PAL.gold, (f - 0.5) * 2);
    });
    const smoothX = lerp(64, 524, curSteps === 4 ? clamp(p * 1.18, 0, 1) : clamp(p * 0.92, 0, 1));
    const lineColor = curSteps === 4 ? PAL.okLight : curSteps === 2 ? PAL.errLight : PAL.orangeText;

    svgBot.innerHTML = `
      <defs>
        <linearGradient id="s01-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${PAL.coral}"/>
          <stop offset="52%" stop-color="${PAL.orange}"/>
          <stop offset="100%" stop-color="${PAL.gold}"/>
        </linearGradient>
      </defs>
      <line x1="64" y1="48" x2="524" y2="48" stroke="${lineColor}" stroke-width="${curSteps === 4 ? 3 : 1.5}" stroke-dasharray="${curSteps === 4 ? "none" : "5 5"}"/>
      ${xs.map((x, i) => {
        const r = rs[i];
        const f = n === 1 ? 1 : i / (n - 1);
        const rx = lerp(r * 0.25, r, f);
        return `<rect x="${(x - r).toFixed(1)}" y="${(48 - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" rx="${rx.toFixed(1)}" fill="${cols[i]}" opacity="${lerp(0.68, 0.98, f).toFixed(2)}"/>`;
      }).join("")}
      ${running || p > 0 ? `<circle cx="${smoothX.toFixed(1)}" cy="48" r="7" fill="${PAL.ink}" stroke="#FFFFFF" stroke-width="2.5"/>` : ""}
    `;

    topStat.textContent = m.topStops;
    botStat.textContent = m.botStops;
    noteEl.textContent = m.summary;
  }

  function step(ts) {
    if (!running) return;
    const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.08) : 0;
    lastTs = ts;
    tRun += dt * 0.62;
    if (tRun >= 1) {
      drawTracks(1);
      running = false;
      playBtn.textContent = "再测一次视线推进";
      return;
    }
    drawTracks(tRun);
    raf = requestAnimationFrame(step);
  }

  function startRun() {
    if (reducedMotion.matches) {
      drawTracks(1);
      return;
    }
    cancelAnimationFrame(raf);
    running = true;
    tRun = 0;
    lastTs = 0;
    playBtn.textContent = "推进对比中…";
    raf = requestAnimationFrame(step);
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      curSteps = Number(b.dataset.s01Steps);
      btns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      running = false;
      cancelAnimationFrame(raf);
      playBtn.textContent = "发射双轨视线对比";
      drawTracks(0);
    });
  });

  playBtn.addEventListener("click", startRun);
  drawTracks(0);
}

// =========================================================================
// 02 节：三通道独立开关混音台（形态 / 比例 / 层级色阶 8 种组合实测）
// =========================================================================
export function mountSection02() {
  const root = document.getElementById("s02-mixer");
  if (!root) return;

  const ch = { shape: true, scale: true, tone: true };
  const svg = root.querySelector("#s02-preview");
  const titleEl = root.querySelector("#s02-verdict-title");
  const bodyEl = root.querySelector("#s02-verdict-body");
  const countEl = root.querySelector("#s02-active-count");
  const btns = [...root.querySelectorAll("[data-s02-ch]")];

  const VERDICTS = {
    "000": [
      "三轨全关 · 静态重复列队",
      "四个元素形状、大小、色阶完全相同。这适合等权列表或网格，却完全没有起点与焦点的流动方向。",
    ],
    "100": [
      "仅开形态 · 极简黑白蜕变",
      "即便不放大也不上色，光凭 □ → ▢ → ○ 的轮廓软化就能造出温和方向感——证明过渡并不依赖花哨渐变。",
    ],
    "010": [
      "仅开比例 · 纯尺度势能",
      "即使全用单色灰块，由小到大的等比推进依然能把视线拉向终点，这是黑白书刊最常用的克制手法。",
    ],
    "001": [
      "仅开色阶 · 轻重升温引导",
      "四个等大图形靠明度与色温由淡雾升至暖金，视线被色彩权重悄悄带走，但缺少体量支撑时终点略轻。",
    ],
    "110": [
      "形态 + 比例 · 无彩色建筑感",
      "单色印刷（如黑白画册、金属压凹）的黄金搭配：外形逐步柔和同时尺度倍增，不靠颜色一样立体聚焦。",
    ],
    "101": [
      "形态 + 色阶 · 情绪渐变带",
      "轮廓与色温同步转暖，但四阶体量持平，适合氛围横幅或章节隔页，主标题聚焦力度偏温和。",
    ],
    "011": [
      "比例 + 色阶 · 原海报主干解",
      "174 原海报核心画面的主骨架正是这一组：统一圆形让形式极干净，把全部视觉推力集中给放大与红→橘→金升温。",
    ],
    "111": [
      "三轨全开 · 全维渐进聚焦",
      "形态由方入圆、尺度逐阶放大、色温顺阶点亮——三股力量朝同一终点合流，导视效率最高，也最要注意克制步数。",
    ],
  };

  function render() {
    const key = `${ch.shape ? 1 : 0}${ch.scale ? 1 : 0}${ch.tone ? 1 : 0}`;
    const activeNum = (ch.shape ? 1 : 0) + (ch.scale ? 1 : 0) + (ch.tone ? 1 : 0);
    const [vt, vb] = VERDICTS[key];
    titleEl.textContent = vt;
    bodyEl.textContent = vb;
    countEl.textContent = `已开启 ${activeNum} / 3 轨`;

    const xs = [72, 178, 304, 464];
    const rs = ch.scale ? [14, 23, 36, 56] : [28, 28, 28, 28];
    const morphs = ch.shape ? [0, 0.35, 0.72, 1] : [1, 1, 1, 1];
    const cols = ch.tone
      ? [PAL.coral, "#F08556", PAL.orange, PAL.gold]
      : ["#7F7890", "#7F7890", "#7F7890", "#7F7890"];
    const alphas = ch.tone ? [0.64, 0.78, 0.90, 1] : [0.82, 0.82, 0.82, 0.82];
    const labels = ["01 起点", "02 连接", "03 递进", "04 焦点"];

    svg.innerHTML = `
      <rect x="0" y="0" width="560" height="210" fill="${PAL.mistBg}"/>
      <polygon points="34,46 112,50 112,158 34,162" fill="${PAL.panel1}" opacity="0.72"/>
      <polygon points="132,48 224,52 224,158 132,162" fill="${PAL.panel2}" opacity="0.72"/>
      <polygon points="246,48 362,54 362,160 246,164" fill="${PAL.panel3}" opacity="0.72"/>
      <polygon points="384,38 544,24 544,186 384,172" fill="${PAL.panel4Top}" opacity="0.78"/>
      <line x1="48" y1="104" x2="512" y2="104" stroke="#ACA4C0" stroke-width="1" stroke-dasharray="4 5"/>
      ${xs.map((x, i) => {
        const r = rs[i];
        const rx = r * morphs[i];
        const y = 104;
        return `
          <rect x="${(x - r).toFixed(1)}" y="${(y - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" rx="${rx.toFixed(1)}" fill="${cols[i]}" opacity="${alphas[i]}"/>
          <text x="${x}" y="196" text-anchor="middle" fill="${PAL.inkMuted}" font-size="11" font-family="Space Mono, Noto Sans SC, monospace" font-weight="700">${labels[i]}</text>
          <text x="${x}" y="22" text-anchor="middle" fill="${PAL.ink}" font-size="11" font-family="Space Mono, Noto Sans SC, monospace" font-weight="700">${(r / rs[0]).toFixed(1)}×</text>
        `;
      }).join("")}
    `;
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.s02Ch;
      ch[k] = !ch[k];
      b.classList.toggle("is-active", ch[k]);
      b.setAttribute("aria-pressed", String(ch[k]));
      b.querySelector(".s02-pill").textContent = ch[k] ? "开" : "关";
      render();
    });
  });

  render();
}

// =========================================================================
// 03 节：深室拉幕对照台（Elam 错层文字带 vs 严苛网格，可调错移振幅与拉幕）
// =========================================================================
export function mountSection03() {
  const canvas = document.getElementById("s03-canvas");
  const splitInput = document.getElementById("s03-split");
  const shiftInput = document.getElementById("s03-shift");
  const splitVal = document.getElementById("s03-split-val");
  const shiftVal = document.getElementById("s03-shift-val");
  const diagEl = document.getElementById("s03-diag");
  if (!canvas || !splitInput || !shiftInput) return;

  const ctx = canvas.getContext("2d");
  const state = { split: 0.36, shift: 56 }; // shift: 0–100 (%)

  const bands = [
    { text: "AUTUMN FORUM · BASEL", w: 0.34, h: 22, offset: -0.20, color: PAL.coralBright },
    { text: "空间的层叠与阅读动线", w: 0.42, h: 28, offset: 0.56, color: "#FFAB76" },
    { text: "打破垂直硬齐边，如岩层自然推移", w: 0.50, h: 26, offset: 0.08, color: PAL.orangeBright },
    { text: "过渡系统 · 排印展", w: 0.46, h: 38, offset: 0.78, color: PAL.goldBright },
    { text: "HALL B · 09:30 OPEN", w: 0.30, h: 20, offset: 0.32, color: PAL.darkMuted },
  ];

  function updateReadout() {
    splitVal.textContent = `${Math.round(state.split * 100)}%`;
    shiftVal.textContent = `${state.shift}%`;
    if (state.shift < 18) {
      diagEl.textContent = `错移仅 ${state.shift}%：左右只差几像素，看起来像「想对齐却没排齐」的事故——Elam 强调错层必须干脆明确。`;
      diagEl.dataset.tone = "err";
    } else if (state.shift <= 74) {
      diagEl.textContent = `错移 ${state.shift}%：岩层式带状推移成立！每条文字带既各自成层又彼此呼应，视觉沿着斜向留白自然流动。`;
      diagEl.dataset.tone = "ok";
    } else {
      diagEl.textContent = `错移高达 ${state.shift}%：相邻文字带甩得过远，失去上下文衔接，版面退化成零散的随机碎片。`;
      diagEl.dataset.tone = "err";
    }
  }

  let s03Dirty = true;
  let s03Size = "";

  function drawScene(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(w < 560 ? 1.5 : 2);
    const key = `${w}x${h}@${dpr}`;
    if (key !== s03Size || canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      s03Size = key;
      s03Dirty = true;
    }
    if (!s03Dirty) return;
    s03Dirty = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const compact = w < 520;
    const sx = w * state.split;

    // 背景
    ctx.fillStyle = PAL.darkCard;
    ctx.fillRect(0, 0, w, h);

    // 左侧裁剪：严苛左对齐网格版
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, sx, h);
    ctx.clip();

    ctx.fillStyle = "#221D2E";
    ctx.fillRect(0, 0, w, h);
    // 垂直网格线
    ctx.strokeStyle = "rgba(244,241,249,0.09)";
    ctx.lineWidth = 1;
    const padX = compact ? 18 : 42;
    for (let k = 0; k < 4; k++) {
      const gx = padX + ((w - padX * 2) / 3) * k;
      ctx.beginPath();
      ctx.moveTo(gx, 32);
      ctx.lineTo(gx, h - 20);
      ctx.stroke();
    }
    // 严格左齐排布
    bands.forEach((b, i) => {
      const by = 52 + i * ((h - 84) / (bands.length - 1));
      const bw = Math.min(w - padX * 2, (w - padX * 2) * b.w);
      ctx.fillStyle = "rgba(244,241,249,0.10)";
      ctx.fillRect(padX, by - b.h * 0.5, bw, b.h);
      ctx.fillStyle = i === 3 ? PAL.darkInk : PAL.darkMuted;
      ctx.font = `${i === 3 ? 900 : 700} ${compact ? Math.max(11, Math.round(b.h * 0.44)) : Math.max(12, Math.round(b.h * 0.52))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(b.text, padX + 8, by);
    });
    ctx.restore();

    // 右侧裁剪：Elam 错层过渡文字带版
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, 0, w - sx, h);
    ctx.clip();

    ctx.fillStyle = "#191523";
    ctx.fillRect(0, 0, w, h);

    // 斜向流动暗弧（Elam 教材里的太阳/地平线隐喻）
    const glow = ctx.createRadialGradient(w * 0.72, h * 0.64, 12, w * 0.72, h * 0.64, Math.min(w, h) * 0.42);
    glow.addColorStop(0, "rgba(247,187,66,0.22)");
    glow.addColorStop(0.55, "rgba(239,122,116,0.10)");
    glow.addColorStop(1, "rgba(25,21,35,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const amp = (state.shift / 100) * (w * (compact ? 0.24 : 0.30));
    const anchorX = w * (compact ? 0.52 : 0.56);
    // 连接虚线流路
    ctx.strokeStyle = state.shift >= 18 && state.shift <= 74 ? rgba(PAL.goldBright, 0.46) : rgba(PAL.errDark, 0.48);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    bands.forEach((b, i) => {
      const by = 52 + i * ((h - 84) / (bands.length - 1));
      const bw = Math.min(w - 36, Math.max(150, (w - 64) * b.w));
      const bx = clamp(anchorX + b.offset * amp - bw * 0.5, 16, w - bw - 16);
      if (i === 0) ctx.moveTo(bx + bw * 0.5, by);
      else ctx.lineTo(bx + bw * 0.5, by);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    bands.forEach((b, i) => {
      const by = 52 + i * ((h - 84) / (bands.length - 1));
      const bw = Math.min(w - 36, Math.max(150, (w - 64) * b.w));
      const bx = clamp(anchorX + b.offset * amp - bw * 0.5, 16, w - bw - 16);
      ctx.fillStyle = i === 3 ? rgba(PAL.gold, 0.24) : rgba(b.color, 0.16);
      ctx.fillRect(bx, by - b.h * 0.5, bw, b.h);
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by - b.h * 0.5, 4, b.h);

      ctx.fillStyle = i === 3 ? PAL.goldBright : PAL.darkInk;
      ctx.font = `${i === 3 ? 900 : 700} ${compact ? Math.max(11, Math.round(b.h * 0.44)) : Math.max(12, Math.round(b.h * 0.50))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(b.text, bx + 11, by);
    });
    ctx.restore();

    // 顶栏左右标识
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textBaseline = "top";
    if (sx > 84) {
      ctx.fillStyle = PAL.darkMuted;
      ctx.textAlign = "left";
      ctx.fillText("GRID · 硬齐边网格", 14, 12);
    }
    if (w - sx > 110) {
      ctx.fillStyle = PAL.goldBright;
      ctx.textAlign = "right";
      ctx.fillText("TRANSITIONAL · 错层文字带", w - 14, 12);
    }

    // 中缝拉幕线与拖拽圆柄
    ctx.strokeStyle = PAL.goldBright;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, h);
    ctx.stroke();

    ctx.fillStyle = PAL.gold;
    ctx.beginPath();
    ctx.arc(sx, h * 0.5, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.ink;
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", sx, h * 0.5 + 0.5);
  }

  const ctrl = loop(canvas, drawScene);

  // 画布内直接横拖拉幕
  let dragging = false;
  function setSplitFromClientX(clientX) {
    const r = canvas.getBoundingClientRect();
    state.split = clamp((clientX - r.left) / Math.max(1, r.width), 0.12, 0.88);
    splitInput.value = String(Math.round(state.split * 100));
    updateReadout();
    s03Dirty = true;
    ctrl.draw();
  }
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    setSplitFromClientX(e.clientX);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) setSplitFromClientX(e.clientX);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  splitInput.addEventListener("input", () => {
    state.split = Number(splitInput.value) / 100;
    updateReadout();
    s03Dirty = true;
    ctrl.draw();
  });
  shiftInput.addEventListener("input", () => {
    state.shift = Number(shiftInput.value);
    updateReadout();
    s03Dirty = true;
    ctrl.draw();
  });

  updateReadout();
  ctrl.draw();
}

// =========================================================================
// 04 节：五年代历史标本展开带（1923–2007 可核实来源 + 动态图式）
// =========================================================================
export function mountSection04() {
  const root = document.getElementById("s04-timeline");
  if (!root) return;

  const ITEMS = [
    {
      year: "1923",
      who: "Max Wertheimer",
      work: "《Untersuchungen zur Lehre von der Gestalt. II》（Psychologische Forschung 第 4 卷）",
      gist: "正式提出格式塔「良好连续性法则」：视觉系统偏爱方向与变化平顺的连续轨迹，这正是过渡系统能够无声牵引视线的知觉底层。",
      svg: `
        <path d="M 28 96 Q 130 22, 232 62 T 432 42" fill="none" stroke="${PAL.coral}" stroke-width="2.5" stroke-dasharray="5 5"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = 36 + i * 64;
          const y = 92 - Math.sin(i * 0.55) * 34 - i * 4;
          return `<circle cx="${x}" cy="${y.toFixed(1)}" r="${(6 + i * 1.6).toFixed(1)}" fill="${mixHex(PAL.coral, PAL.gold, i / 6)}"/>`;
        }).join("")}
      `,
    },
    {
      year: "1963",
      who: "Josef Albers",
      work: "《Interaction of Color》（Yale University Press 首版）",
      gist: "以 150 张丝网色板示范色彩相对性与透叠过渡：当两种反差色之间插入恰当的中间混合阶，硬边界会瞬间化作连续空间桥梁。",
      svg: `
        <rect x="44" y="28" width="110" height="84" fill="${PAL.coral}" opacity="0.88"/>
        <rect x="122" y="28" width="110" height="84" fill="${PAL.orange}" opacity="0.72"/>
        <rect x="200" y="28" width="110" height="84" fill="#F4A83E" opacity="0.78"/>
        <rect x="278" y="28" width="136" height="84" fill="${PAL.gold}" opacity="0.95"/>
        <line x1="44" y1="122" x2="414" y2="122" stroke="${PAL.inkMuted}" stroke-width="1"/>
      `,
    },
    {
      year: "1965",
      who: "Armin Hofmann",
      work: "《Graphic Design Manual》（Arthur Niggli Verlag 首版）",
      gist: "在巴塞尔设计学院的基础训练中，用点、线、面系统演练「递进（Progression）」与「形态过渡（Transition）」，把方到圆、疏到密的逐级变形写成教材范式。",
      svg: `
        ${[0, 1, 2, 3, 4].map((i) => {
          const x = 66 + i * 82;
          const r = 14 + i * 4.5;
          const rx = r * (i / 4);
          return `<rect x="${(x - r).toFixed(1)}" y="${(70 - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" rx="${rx.toFixed(1)}" fill="${i === 4 ? PAL.ink : mixHex(PAL.coral, PAL.gold, i / 4)}"/>`;
        }).join("")}
      `,
    },
    {
      year: "1972",
      who: "王无邪 Wucius Wong",
      work: "《Principles of Two-Dimensional Design》（Van Nostrand Reinhold，第 6 章 Gradation）",
      gist: "将「渐变」拆解为形态、大小、位置、方向四类有规律的步进变化，直接影响了此后半个世纪的华语平面构成教学与 174 海报的视觉语言。",
      svg: `
        ${[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 42 + i * 64;
          const w = 18 + i * 9;
          return `<rect x="${x}" y="26" width="${w}" height="88" fill="${mixHex(PAL.panel1, PAL.orange, i / 5)}" stroke="${PAL.ink}" stroke-width="0.8"/>`;
        }).join("")}
      `,
    },
    {
      year: "2007",
      who: "Kimberly Elam",
      work: "《Typographic Systems》（Princeton Architectural Press，ISBN 978-1-56898-687-6）",
      gist: "在八大字体组织系统中正式确立「Transitional System（过渡系统）」：刻意放弃僵硬齐边，用层叠错移的文字带形成如岩层与风沙般有机的视觉流程。",
      svg: `
        <path d="M 124 31 L 240 56 L 198 82 L 305 110" fill="none" stroke="${PAL.inkMuted}" stroke-width="1.4" stroke-dasharray="4 4"/>
        <circle cx="388" cy="40" r="14" fill="${PAL.gold}" opacity="0.88"/>
        <rect x="44" y="24" width="160" height="14" fill="${PAL.coral}"/>
        <rect x="136" y="48" width="210" height="16" fill="${PAL.orange}"/>
        <rect x="78" y="74" width="240" height="16" fill="#F4A73E"/>
        <rect x="196" y="100" width="218" height="20" fill="${PAL.gold}"/>
      `,
    },
  ];

  const btns = [...root.querySelectorAll("[data-s04-idx]")];
  const yrEl = root.querySelector("#s04-year");
  const whoEl = root.querySelector("#s04-who");
  const workEl = root.querySelector("#s04-work");
  const gistEl = root.querySelector("#s04-gist");
  const figEl = root.querySelector("#s04-svg");

  function show(idx) {
    const it = ITEMS[idx];
    yrEl.textContent = it.year;
    whoEl.textContent = it.who;
    workEl.textContent = it.work;
    gistEl.textContent = it.gist;
    figEl.innerHTML = it.svg;
    btns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => show(Number(b.dataset.s04Idx)));
  });
  show(4); // 默认先亮出 2007 Kimberly Elam，点击可回溯到 1923
}

// =========================================================================
// 05 节：六场景诊断翻牌器（何时用 / 何时千万别用 + 替代系统链接）
// =========================================================================
export function mountSection05() {
  const root = document.getElementById("s05-scenarios");
  if (!root) return;

  const cards = [...root.querySelectorAll(".s05-card")];
  const detail = document.getElementById("s05-detail");

  cards.forEach((c) => {
    c.addEventListener("click", () => {
      cards.forEach((x) => {
        const on = x === c;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      const verdict = c.dataset.verdict;
      const reason = c.dataset.reason;
      const altName = c.dataset.altName;
      const altUrl = c.dataset.altUrl;
      const tone = c.dataset.tone;

      detail.dataset.tone = tone;
      detail.innerHTML = `
        <div class="s05-det-head">
          <span class="s05-det-badge">${verdict}</span>
          <strong>${c.dataset.title}</strong>
        </div>
        <p>${reason}</p>
        ${altUrl ? `<p class="s05-alt">更合适的同类系统：<a href="${altUrl}" target="_blank" rel="noopener">${altName} ↗</a></p>` : ""}
      `;
    });
  });
}

// =========================================================================
// 06 节：双题实战考场（单变量四选一，中性选项，作答后叠加视线流与阶比标尺）
// =========================================================================
export function mountSection06() {
  const root = document.getElementById("s06-quiz");
  if (!root) return;

  const QUESTIONS = [
    {
      id: 0,
      tab: "第 1 题 · 展览主视觉",
      stem: "你要为「声景装置展」排一张海报，让观众从左上入口顺滑看到右下核心焦点。下面四个方案使用同一套配色和文案，只改变四阶过渡结构——哪一版真正做对了「过渡系统」？",
      answer: "C",
      options: [
        {
          key: "A",
          label: "方案 A",
          desc: "四阶面积递增，中段方圆交替并留出大缝",
          explain: "比例虽然在变大，但第 2 阶突然切回硬方且在第 3→4 阶之间裂出断崖空隙，形态与衔接在半路折断，眼睛被迫跳栏。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.mistBg}"/>
            <circle cx="34" cy="48" r="9" fill="${PAL.coral}"/>
            <rect x="74" y="42" width="28" height="28" fill="${PAL.orange}"/>
            <circle cx="136" cy="70" r="18" fill="${PAL.orange}"/>
            <rect x="200" y="76" width="46" height="46" fill="${PAL.gold}"/>
            ${reveal ? `<path d="M 34 48 L 88 56 L 136 70" stroke="${PAL.errLight}" stroke-width="2" fill="none" stroke-dasharray="4 3"/>
            <text x="172" y="88" fill="${PAL.errLight}" font-size="11" font-weight="700" text-anchor="middle">断崖</text>` : ""}
          `,
        },
        {
          key: "B",
          label: "方案 B",
          desc: "形态统一为圆，四阶等距且尺寸接近 1.0–1.15×",
          explain: "看似规整平滑，但四阶尺寸和体量几乎拉平，缺少「由小到大、由轻入重」的递进势能，扫完一遍找不到视觉终点。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.mistBg}"/>
            <circle cx="42" cy="74" r="17" fill="${PAL.coral}"/>
            <circle cx="100" cy="74" r="18" fill="#F08556"/>
            <circle cx="158" cy="74" r="19" fill="${PAL.orange}"/>
            <circle cx="216" cy="74" r="20" fill="${PAL.gold}"/>
            ${reveal ? `<line x1="42" y1="42" x2="216" y2="42" stroke="${PAL.errLight}" stroke-width="1.5" stroke-dasharray="4 3"/>
            <text x="130" y="34" fill="${PAL.errLight}" font-size="11" font-weight="700" text-anchor="middle">1.0 → 1.18× 平淡无焦点</text>` : ""}
          `,
        },
        {
          key: "C",
          label: "方案 C",
          desc: "从轻点经双叠中阶逐级放大，顺滑汇入暖金主焦",
          explain: "正确！起点克制轻落，中段通过交叠建立连接，相邻阶比保持温和递进（约 1.4×–1.6×），色温同步从珊瑚升温至琥珀金，连接、递进、引导三者完整闭合。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.mistBg}"/>
            <circle cx="34" cy="48" r="8" fill="${PAL.coral}"/>
            <circle cx="82" cy="58" r="13" fill="${PAL.coral}" opacity="0.8"/>
            <circle cx="96" cy="62" r="15" fill="${PAL.orange}" opacity="0.85"/>
            <circle cx="144" cy="76" r="16" fill="${PAL.coralSoft}" opacity="0.65"/>
            <circle cx="158" cy="80" r="22" fill="${PAL.orange}" opacity="0.9"/>
            <circle cx="210" cy="96" r="36" fill="${PAL.gold}"/>
            ${reveal ? `<path d="M 34 48 Q 112 64, 210 96" stroke="${PAL.okLight}" stroke-width="2.5" fill="none"/>
            <text x="130" y="24" fill="${PAL.okLight}" font-size="11" font-weight="700" text-anchor="middle">✓ 阶比顺滑 · 聚焦闭环</text>` : ""}
          `,
        },
        {
          key: "D",
          label: "方案 D",
          desc: "左上角最大最亮，沿对角线一路缩小并褪成冷灰",
          explain: "首尾跨度虽然够大，但流向和目标需求正好反了——最大焦点卡在左上入口，越往右下反而越萎缩暗淡，视线被钉死在起点。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.mistBg}"/>
            <circle cx="52" cy="54" r="34" fill="${PAL.gold}"/>
            <circle cx="116" cy="74" r="22" fill="${PAL.orange}" opacity="0.8"/>
            <circle cx="172" cy="92" r="14" fill="${PAL.coral}" opacity="0.65"/>
            <circle cx="220" cy="108" r="8" fill="${PAL.flatGray}"/>
            ${reveal ? `<path d="M 52 54 L 220 108" stroke="${PAL.errLight}" stroke-width="2" stroke-dasharray="4 3"/>
            <text x="148" y="34" fill="${PAL.errLight}" font-size="11" font-weight="700" text-anchor="middle">重心倒挂 · 入口吞焦点</text>` : ""}
          `,
        },
      ],
    },
    {
      id: 1,
      tab: "第 2 题 · 纯文字错层带",
      stem: "如果这是一份不能放插画的建筑论坛纯文字海报，要用 Kimberly Elam 式的「错层文字过渡」替代硬齐边网格，哪一版既流畅又有秩序？",
      answer: "B",
      options: [
        {
          key: "A",
          label: "方案 A",
          desc: "四条文字带左右只差 3–4 像素，字重完全一致",
          explain: "错移幅度太微弱，读者不会觉得这是有意设计的过渡，只会以为排版手抖没对齐；同时字重无递进，缺少焦点。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.darkCard}"/>
            <rect x="44" y="28" width="150" height="14" fill="${PAL.darkMuted}" opacity="0.7"/>
            <rect x="48" y="54" width="150" height="14" fill="${PAL.darkMuted}" opacity="0.7"/>
            <rect x="45" y="80" width="150" height="14" fill="${PAL.darkMuted}" opacity="0.7"/>
            <rect x="49" y="106" width="150" height="14" fill="${PAL.darkMuted}" opacity="0.7"/>
            ${reveal ? `<line x1="44" y1="20" x2="44" y2="132" stroke="${PAL.errDark}" stroke-width="1.5" stroke-dasharray="3 3"/>
            <text x="130" y="140" fill="${PAL.errDark}" font-size="11" font-weight="700" text-anchor="middle">微偏像没排齐</text>` : ""}
          `,
        },
        {
          key: "B",
          label: "方案 B",
          desc: "四条文字带干脆阶梯错移，高度与色温逐层增强至焦点",
          explain: "正确！每一条文字带之间有清晰明确的水平位移与上下呼应，同时带厚与色温逐步加强，不放任何图形也能走出流畅斜向动线。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.darkCard}"/>
            <rect x="26" y="24" width="106" height="11" fill="${PAL.coralBright}" opacity="0.75"/>
            <rect x="64" y="48" width="132" height="15" fill="${PAL.orangeBright}" opacity="0.85"/>
            <rect x="44" y="76" width="152" height="18" fill="${PAL.orange}" opacity="0.92"/>
            <rect x="92" y="106" width="144" height="24" fill="${PAL.goldBright}"/>
            ${reveal ? `<path d="M 79 30 L 130 55 L 120 85 L 164 118" stroke="${PAL.okDark}" stroke-width="2" fill="none"/>
            <text x="130" y="144" fill="${PAL.okDark}" font-size="11" font-weight="700" text-anchor="middle">✓ 错层清晰 · 逐层聚焦</text>` : ""}
          `,
        },
        {
          key: "C",
          label: "方案 C",
          desc: "文字被拆碎成 8 小块散落到四角与边缘",
          explain: "离散过度导致相邻行失去视觉承接，这已经滑入了随机系统的领地，失去了过渡系统必需的连贯动线。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.darkCard}"/>
            <rect x="14" y="18" width="52" height="12" fill="${PAL.coralBright}"/>
            <rect x="192" y="24" width="52" height="12" fill="${PAL.orangeBright}"/>
            <rect x="110" y="58" width="44" height="14" fill="${PAL.goldBright}"/>
            <rect x="18" y="114" width="60" height="12" fill="${PAL.darkMuted}"/>
            <rect x="186" y="112" width="58" height="16" fill="${PAL.coralBright}"/>
            ${reveal ? `<text x="130" y="96" fill="${PAL.errDark}" font-size="11" font-weight="700" text-anchor="middle">过度离散 · 失去承接</text>` : ""}
          `,
        },
        {
          key: "D",
          label: "方案 D",
          desc: "全部文字严丝合缝居中堆成对称金字塔",
          explain: "居中对称稳重庄严，属于 175 双边系统的语言，视线停留在垂直中轴上，并非过渡系统的斜向流动结构。",
          svg: (reveal) => `
            <rect width="260" height="150" fill="${PAL.darkCard}"/>
            <rect x="90" y="26" width="80" height="12" fill="${PAL.darkMuted}"/>
            <rect x="70" y="50" width="120" height="15" fill="${PAL.coralBright}" opacity="0.8"/>
            <rect x="50" y="76" width="160" height="18" fill="${PAL.orangeBright}" opacity="0.88"/>
            <rect x="34" y="106" width="192" height="20" fill="${PAL.goldBright}"/>
            ${reveal ? `<line x1="130" y1="16" x2="130" y2="134" stroke="${PAL.orangeBright}" stroke-width="1.5" stroke-dasharray="4 3"/>
            <text x="130" y="144" fill="${PAL.orangeBright}" font-size="11" font-weight="700" text-anchor="middle">居中对称（属双边系统）</text>` : ""}
          `,
        },
      ],
    },
  ];

  let qIdx = 0;
  const picked = [null, null];

  const tabsEl = root.querySelector("#s06-tabs");
  const stemEl = root.querySelector("#s06-stem");
  const gridEl = root.querySelector("#s06-grid");
  const fbEl = root.querySelector("#s06-feedback");

  function render() {
    const q = QUESTIONS[qIdx];
    const chosen = picked[qIdx];
    const revealed = chosen !== null;

    tabsEl.innerHTML = QUESTIONS.map((item, i) => `
      <button type="button" class="s06-tab ${i === qIdx ? "is-active" : ""}" data-q="${i}" aria-pressed="${i === qIdx}">
        ${item.tab}${picked[i] ? (picked[i] === item.answer ? " ✓" : " · 已答") : ""}
      </button>
    `).join("");

    stemEl.textContent = q.stem;

    gridEl.innerHTML = q.options.map((o) => {
      let cls = "s06-opt";
      if (revealed) {
        if (o.key === q.answer) cls += " is-correct";
        else if (o.key === chosen) cls += " is-wrong";
      }
      return `
        <button type="button" class="${cls}" data-opt="${o.key}" aria-pressed="${chosen === o.key}">
          <div class="s06-opt-head">
            <span class="s06-key">${o.label}</span>
            ${revealed && o.key === q.answer ? '<span class="s06-mark is-ok">最佳过渡</span>' : ""}
            ${revealed && o.key === chosen && o.key !== q.answer ? '<span class="s06-mark is-bad">再细看</span>' : ""}
          </div>
          <svg class="s06-svg" viewBox="0 0 260 150" aria-hidden="true">${o.svg(revealed)}</svg>
          <p class="s06-desc">${o.desc}</p>
        </button>
      `;
    }).join("");

    if (!revealed) {
      fbEl.hidden = true;
      fbEl.innerHTML = "";
    } else {
      const hit = chosen === q.answer;
      const curOpt = q.options.find((x) => x.key === chosen);
      const ansOpt = q.options.find((x) => x.key === q.answer);
      fbEl.hidden = false;
      fbEl.dataset.tone = hit ? "ok" : "err";
      fbEl.innerHTML = `
        <div class="s06-fb-title">${hit ? `答对了！${ansOpt.label} 真正立住了过渡系统` : `选了 ${curOpt.label}，但更完整的是 ${ansOpt.label}`}</div>
        <p>${curOpt.explain}</p>
        ${!hit ? `<p class="s06-fb-right"><strong>为什么 ${ansOpt.label} 成立：</strong>${ansOpt.explain}</p>` : ""}
        <div class="s06-fb-actions">
          <button type="button" class="s06-retry" id="s06-retry">重选本题</button>
          ${qIdx === 0 ? '<button type="button" class="s06-next" id="s06-next">继续第 2 题 →</button>' : ""}
        </div>
      `;
      fbEl.querySelector("#s06-retry")?.addEventListener("click", () => {
        picked[qIdx] = null;
        render();
      });
      fbEl.querySelector("#s06-next")?.addEventListener("click", () => {
        qIdx = 1;
        render();
      });
    }

    tabsEl.querySelectorAll("[data-q]").forEach((b) => {
      b.addEventListener("click", () => {
        qIdx = Number(b.dataset.q);
        render();
      });
    });

    gridEl.querySelectorAll("[data-opt]").forEach((b) => {
      b.addEventListener("click", () => {
        picked[qIdx] = b.dataset.opt;
        render();
      });
    });
  }

  render();
}

// =========================================================================
// 07 节：原海报全屏灯箱（缩放、鼠标拖动 draggable="false"、Esc 关）
// =========================================================================
export function mountPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  if (!thumb || !openBtn || !dialog) return;

  const img = dialog.querySelector("#lb-img");
  const stage = dialog.querySelector("#lb-stage");
  const zoomLabel = dialog.querySelector("#lb-zoom-val");
  const btnIn = dialog.querySelector("#lb-zoom-in");
  const btnOut = dialog.querySelector("#lb-zoom-out");
  const btnReset = dialog.querySelector("#lb-zoom-reset");
  const btnClose = dialog.querySelector("#lb-close");

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0, stx = 0, sty = 0;

  function apply() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  }

  function open() {
    if (!img.src) img.src = thumb.src;
    reset();
    dialog.showModal();
    btnClose.focus();
  }

  function close() {
    if (dialog.open) dialog.close();
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = clamp(scale + 0.35, 0.75, 3.2); apply(); });
  btnOut.addEventListener("click", () => { scale = clamp(scale - 0.35, 0.75, 3.2); apply(); });
  btnReset.addEventListener("click", reset);

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.75, 3.2);
    apply();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    apply();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
}
