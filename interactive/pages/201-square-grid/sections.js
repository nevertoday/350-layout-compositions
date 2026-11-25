// 201 方格网格：01–08 节全部独立交互 + 原海报缩放灯箱

export function initSections() {
  initSec01GutterMath();
  initSec02RhythmBoard();
  initSec03Applications();
  initSec04History();
  initSec05AvoidCases();
  initSec06CssLab();
  initSec07Quiz();
  initSec08Lightbox();
}

/* ==================== 01：跨格缝隙吞吐解剖器 ==================== */
function initSec01GutterMath() {
  const viz = document.getElementById("s1-viz");
  const formulaEl = document.getElementById("s1-formula");
  const readoutEl = document.getElementById("s1-readout");
  let n = 3;
  let mode = "0.25"; // "0" | "0.25" | "0.5" | "forget"

  function render() {
    const isForget = mode === "forget";
    const gRatio = isForget ? 0.25 : Number(mode);
    const u = 64;
    const g = u * gRatio;
    const topTotal = n * u + (n - 1) * g;
    const botTotal = isForget ? n * u : topTotal;
    const svgW = 460;
    const ox = Math.max(18, Math.round((svgW - topTotal) / 2));

    let topRects = "";
    for (let i = 0; i < n; i++) {
      const rx = ox + i * (u + g);
      topRects += `<rect x="${rx}" y="22" width="${u}" height="${u}" fill="#EDF2EC" stroke="#1E5746" stroke-width="1.6"/>`;
      topRects += `<text x="${rx + u / 2}" y="${22 + u / 2 + 4}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" fill="#0E1513">1u</text>`;
      if (i < n - 1 && g > 1) {
        const gx = rx + u;
        topRects += `<rect x="${gx}" y="22" width="${g}" height="${u}" fill="#F5DCCE"/>`;
        topRects += `<text x="${gx + g / 2}" y="15" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#A33517">+g</text>`;
      }
    }

    const botColor = isForget ? "#FDECEB" : "#F5DCCE";
    const botStroke = isForget ? "#B22222" : "#E1603C";
    const rightGuideX = ox + topTotal;
    const botRightX = ox + botTotal;

    const mismatch = isForget
      ? `<rect x="${botRightX}" y="106" width="${topTotal - botTotal}" height="${u}" fill="rgba(178,34,34,0.14)" stroke="#B22222" stroke-width="1.4" stroke-dasharray="4 3"/>
         <text x="${(botRightX + rightGuideX) / 2}" y="142" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#B22222">短一截</text>`
      : "";

    viz.innerHTML = `<svg viewBox="0 0 ${svgW} 196" role="img" aria-label="跨格缝隙吞吐示意图">
      <line x1="${ox}" y1="12" x2="${ox}" y2="182" stroke="#1E5746" stroke-width="1.2" stroke-dasharray="3 3"/>
      <line x1="${rightGuideX}" y1="12" x2="${rightGuideX}" y2="182" stroke="${isForget ? "#B22222" : "#1E5746"}" stroke-width="1.4" stroke-dasharray="3 3"/>
      ${topRects}
      <rect x="${ox}" y="106" width="${botTotal}" height="${u}" fill="${botColor}" stroke="${botStroke}" stroke-width="2"/>
      <text x="${ox + botTotal / 2}" y="142" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13.5" font-weight="600" fill="${isForget ? "#B22222" : "#0E1513"}">${
        isForget ? `${n}u（漏掉 ${n - 1} 条缝）` : `${n}u + ${n - 1}g = ${(n + (n - 1) * gRatio).toFixed(2)}u`
      }</text>
      ${mismatch}
      <text x="${ox}" y="188" font-family="Noto Sans SC, sans-serif" font-size="11.5" fill="#3B4C46">左边界齐平</text>
      <text x="${rightGuideX}" y="188" text-anchor="end" font-family="Noto Sans SC, sans-serif" font-size="11.5" fill="${isForget ? "#B22222" : "#19624B"}">${
        isForget ? `右边界错台 ${(n - 1) * 0.25}u` : "右边界严丝合缝"
      }</text>
    </svg>`;

    const sumU = (n + (n - 1) * gRatio).toFixed(2);
    if (isForget) {
      formulaEl.textContent = `错算 ${n}u ≠ ${sumU}u`;
      readoutEl.classList.add("is-err");
      readoutEl.textContent = `若只把大块做成 ${n} 个单格宽、漏算中间 ${n - 1} 条 1/4u 缝隙，合并模块就会比上排短出 ${((n - 1) * 0.25).toFixed(2)}u，右边线直接出现锯齿错台。`;
    } else if (gRatio === 0) {
      formulaEl.textContent = `W(${n}) = ${n}u`;
      readoutEl.classList.remove("is-err");
      readoutEl.textContent = `无缝隙贴合时，${n} 个单格与合并大块严格同宽 ${n}u，适合海报色块或强边界卡片。`;
    } else {
      const frac = gRatio === 0.25 ? "1/4u" : "1/2u";
      formulaEl.textContent = `W(${n}) = ${n}u + ${n - 1}g`;
      readoutEl.classList.remove("is-err");
      readoutEl.textContent = `上排 ${n} 个单格之间夹着 ${n - 1} 条 ${frac} 缝隙；下排合并大块吃进这 ${n - 1} 条缝后总宽 ${sumU}u，右边缘与上排严丝合缝。`;
    }
  }

  document.querySelectorAll("[data-s1-n]").forEach((btn) => {
    btn.addEventListener("click", () => {
      n = Number(btn.dataset.s1N);
      document.querySelectorAll("[data-s1-n]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });
  document.querySelectorAll("[data-s1-g]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.s1G;
      document.querySelectorAll("[data-s1-g]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
}

/* ==================== 02：6×6 节奏棋盘 ==================== */
function initSec02RhythmBoard() {
  const board = document.getElementById("s2-board");
  const tiersEl = document.getElementById("s2-tiers");
  const ratioEl = document.getElementById("s2-ratio");
  const emptyEl = document.getElementById("s2-empty");
  const verdictEl = document.getElementById("s2-verdict");
  const readoutEl = document.getElementById("s2-readout");

  // 预设块列表：{ c, r, w, h, kind: "big"|"mid"|"small"|"empty", label }
  const S2_PRESETS = {
    wall: Array.from({ length: 36 }, (_, i) => ({
      c: (i % 6) + 1,
      r: Math.floor(i / 6) + 1,
      w: 1,
      h: 1,
      kind: "mid",
      label: "1×1",
    })),
    rhythm: [
      { c: 1, r: 1, w: 3, h: 3, kind: "big", label: "主视觉" },
      { c: 4, r: 1, w: 3, h: 2, kind: "mid", label: "导语块" },
      { c: 4, r: 3, w: 2, h: 1, kind: "small", label: "日期" },
      { c: 6, r: 3, w: 1, h: 1, kind: "empty", label: "留白" },
      { c: 1, r: 4, w: 2, h: 2, kind: "mid", label: "副图" },
      { c: 3, r: 4, w: 2, h: 2, kind: "empty", label: "留白" },
      { c: 5, r: 4, w: 2, h: 3, kind: "mid", label: "侧栏" },
      { c: 1, r: 6, w: 1, h: 1, kind: "small", label: "标" },
      { c: 2, r: 6, w: 3, h: 1, kind: "empty", label: "留白" },
    ],
    airy: [
      { c: 1, r: 1, w: 3, h: 3, kind: "big", label: "主视觉" },
      { c: 4, r: 1, w: 3, h: 2, kind: "empty", label: "留白" },
      { c: 5, r: 3, w: 2, h: 2, kind: "mid", label: "副模块" },
      { c: 1, r: 4, w: 4, h: 1, kind: "empty", label: "留白" },
      { c: 1, r: 5, w: 2, h: 2, kind: "empty", label: "留白" },
      { c: 3, r: 5, w: 2, h: 2, kind: "small", label: "说明" },
      { c: 5, r: 5, w: 1, h: 1, kind: "small", label: "标" },
      { c: 6, r: 5, w: 1, h: 2, kind: "empty", label: "留白" },
      { c: 5, r: 6, w: 1, h: 1, kind: "empty", label: "留白" },
    ],
  };

  let blocks = S2_PRESETS.rhythm.map((b) => ({ ...b }));

  function render() {
    board.innerHTML = "";
    blocks.forEach((b, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `s2-tile is-${b.kind}`;
      btn.style.gridColumn = `${b.c} / span ${b.w}`;
      btn.style.gridRow = `${b.r} / span ${b.h}`;
      btn.innerHTML = `${b.w}×${b.h}<span>${b.kind === "empty" ? "留白" : b.label}</span>`;
      btn.setAttribute("aria-label", `模块 ${b.w}×${b.h}，当前${b.kind === "empty" ? "留白" : b.label}，点击切换状态`);
      btn.addEventListener("click", () => {
        // 循环切换：大/中块可拆成 1×1 单格，1×1 单格可在填充与留白之间切换
        if (b.w * b.h > 1 && b.kind !== "empty") {
          const split = [];
          for (let dy = 0; dy < b.h; dy++) {
            for (let dx = 0; dx < b.w; dx++) {
              split.push({ c: b.c + dx, r: b.r + dy, w: 1, h: 1, kind: "mid", label: "1×1" });
            }
          }
          blocks.splice(idx, 1, ...split);
        } else {
          b.kind = b.kind === "empty" ? "small" : "empty";
          b.label = b.kind === "empty" ? "留白" : "单格";
        }
        render();
      });
      board.append(btn);
    });

    const filled = blocks.filter((b) => b.kind !== "empty");
    const areas = filled.map((b) => b.w * b.h);
    const uniq = new Set(areas).size;
    const maxA = areas.length ? Math.max(...areas) : 0;
    const minA = areas.length ? Math.min(...areas) : 0;
    const ratio = minA > 0 ? maxA / minA : 0;
    const usedCells = areas.reduce((s, a) => s + a, 0);
    const emptyPct = Math.round(((36 - usedCells) / 36) * 100);

    tiersEl.textContent = `${uniq} 档`;
    ratioEl.textContent = ratio ? `${ratio.toFixed(1)}×` : "—";
    emptyEl.textContent = `${emptyPct}%`;

    if (uniq <= 1 && usedCells >= 24) {
      verdictEl.textContent = "瓷砖平权";
      readoutEl.classList.add("is-err");
      readoutEl.textContent = `全部 ${filled.length} 块面积一样（尺度比 ${ratio.toFixed(1)}×），留白仅 ${emptyPct}%，视线没有第一落点，像铺满墙面的均质瓷砖。`;
    } else if (emptyPct < 14) {
      verdictEl.textContent = "偏满少气";
      readoutEl.classList.add("is-err");
      readoutEl.textContent = `虽然有大小之分，但留白仅剩 ${emptyPct}%，块与块挤在一起喘不过气。点几块 1×1 翻成留白试试。`;
    } else if (ratio < 2) {
      verdictEl.textContent = "主次偏弱";
      readoutEl.classList.add("is-err");
      readoutEl.textContent = `最大与最小模块面积比只有 ${ratio.toFixed(1)}×，建议切到「大小混拼」对比主次拉开后的呼吸感。`;
    } else {
      verdictEl.textContent = "主次清晰";
      readoutEl.classList.remove("is-err");
      readoutEl.textContent = `棋盘拉开 ${uniq} 档尺度（最大/最小 ${ratio.toFixed(1)}×），留白占 ${emptyPct}%：大块先抓住视线，小块与留白形成清晰节奏。`;
    }
  }

  document.querySelectorAll("[data-s2-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.s2Preset;
      blocks = S2_PRESETS[k].map((b) => ({ ...b }));
      document.querySelectorAll("[data-s2-preset]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
}

/* ==================== 03：深松林暗室（原海报三大应用示例） ==================== */
function initSec03Applications() {
  const visual = document.getElementById("s3-visual");
  const kicker = document.getElementById("s3-kicker");
  const h3 = document.getElementById("s3-h3");
  const quote = document.getElementById("s3-quote");
  const body = document.getElementById("s3-body");
  const modeRow = document.getElementById("s3-mode-row");
  const guideBtn = document.getElementById("s3-guide-toggle");

  let tab = "icon";
  let mode = "a";
  let showGuide = true;

  const CONTENT = {
    icon: {
      kicker: "ICON GRID · 24×24 KEYLINES",
      h3: "为什么圆图标要比方图标多占两格？",
      quote: "原海报说：「图标按单元排列，大小一致，界面整洁，易扫视与识别。」",
      bodyA:
        "在 24×24 像素（或 dp）标准方格里，Material Design 等图标规范会划出光学关键线：正方形限在 18×18、正圆放宽到 20×20、竖矩形占 16×20。因为方形四角面积满，略缩一点才能在视觉上与圆形等重。",
      bodyB:
        "如果把正方形和圆形都硬撑满同一套 20×20 边界，圆形四角悬空、视觉体量会比方形明显小一圈。一排图标摆在一起，眼睛立刻觉得忽大忽小。",
      modes: ["光学关键线（等重）", "硬撑外框（方显大）"],
    },
    poster: {
      kicker: "POSTER TILES · 8×8 DESIGN WEEK",
      h3: "一张海报怎样用 1:1 网格管住字、图、箭？",
      quote: "原海报说：「内容置入网格单元，层级清晰，画面平衡统一，信息更有节奏。」",
      bodyA:
        "复刻原海报底部的《设计周 2024》：左上 4×4 排文字，右上 4×4 放大陶土圆，左下 4×3 排「06 JUNE」，底沿右下 2×1 用实色箭头收尾。所有边缘都踩在 8×8 方格线上，不靠花哨装饰就很有建筑感。",
      bodyB:
        "一旦把大圆挪偏半格、日期文字脱离网格线各自找对齐，虽然元素和颜色完全没变，整张海报的干脆利落瞬间散架，像临时拼出来的传单。",
      modes: ["咬死 8×8 格线", "脱离格线漂移"],
    },
    cards: {
      kicker: "UI CARDS · 2×2 MODULAR TILES",
      h3: "方格卡片何时稳、何时被长文撑破？",
      quote: "原海报说：「卡片按网格布局，间距统一，信息模块化，便于管理与扩展。」",
      bodyA:
        "复刻原海报底部的 2×2 界面卡片：数据概览、任务进度、团队成员、系统通知四块信息密度接近，放进等大正方格里扫视效率极高，新增第 5、第 6 块也无需重算版式。",
      bodyB:
        "但如果某一张卡片里突然塞进三行长说明和标签，锁死 1:1 高度会让文字贴边截断；此时应改用「等宽、高度随内容延展」的普通卡片网格，别死守正方形。",
      modes: ["密度一致（稳）", "塞进长文（撑破）"],
    },
  };

  function iconSvg() {
    const sqSize = mode === "a" ? 72 : 80; // 18/24 vs 20/24 on 96px cell
    const sqOff = (96 - sqSize) / 2;
    const cr = 40; // 20/24 diameter = 80 -> r=40
    const vW = mode === "a" ? 64 : 80;
    const vX = (96 - vW) / 2;

    const cellGrid = (ox) => {
      if (!showGuide) return "";
      let lines = "";
      for (let i = 0; i <= 6; i++) {
        const p = i * 16;
        lines += `<line x1="${ox + p}" y1="24" x2="${ox + p}" y2="120" stroke="#C5D4C9" stroke-width="0.8"/>`;
        lines += `<line x1="${ox}" y1="${24 + p}" x2="${ox + 96}" y2="${24 + p}" stroke="#C5D4C9" stroke-width="0.8"/>`;
      }
      lines += `<rect x="${ox + 12}" y="36" width="72" height="72" fill="none" stroke="#E1603C" stroke-width="1" stroke-dasharray="3 2"/>`;
      lines += `<circle cx="${ox + 48}" cy="72" r="40" fill="none" stroke="#1E5746" stroke-width="1" stroke-dasharray="3 2"/>`;
      return lines;
    };

    return `<svg viewBox="0 0 420 156" role="img" aria-label="24×24 图标方格关键线对比">
      <rect x="0" y="0" width="420" height="156" fill="#F7F8F3"/>
      ${cellGrid(24)}${cellGrid(162)}${cellGrid(300)}
      <!-- 方图标：日历/文件 -->
      <rect x="${24 + sqOff}" y="${24 + sqOff}" width="${sqSize}" height="${sqSize}" rx="5" fill="#E4ECE3" stroke="#0E1513" stroke-width="2.4"/>
      <line x1="${24 + sqOff}" y1="${24 + sqOff + 20}" x2="${24 + sqOff + sqSize}" y2="${24 + sqOff + 20}" stroke="#0E1513" stroke-width="2"/>
      <text x="72" y="142" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#1E5746">${mode === "a" ? "方 18×18" : "方 20×20"}</text>

      <!-- 圆图标：时钟 -->
      <circle cx="210" cy="72" r="${cr}" fill="#F5DCCE" stroke="#0E1513" stroke-width="2.4"/>
      <polyline points="210,50 210,72 226,80" fill="none" stroke="#0E1513" stroke-width="2.4" stroke-linecap="round"/>
      <text x="210" y="142" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#1E5746">圆 20×20</text>

      <!-- 竖矩形图标：书签/文档 -->
      <rect x="${300 + vX}" y="32" width="${vW}" height="80" rx="4" fill="#E4ECE3" stroke="#0E1513" stroke-width="2.4"/>
      <line x1="${300 + vX + 14}" y1="58" x2="${300 + vX + vW - 14}" y2="58" stroke="#0E1513" stroke-width="2"/>
      <line x1="${300 + vX + 14}" y1="74" x2="${300 + vX + vW - 14}" y2="74" stroke="#0E1513" stroke-width="2"/>
      <line x1="${300 + vX + 14}" y1="90" x2="${300 + vX + vW - 22}" y2="90" stroke="#0E1513" stroke-width="2"/>
      <text x="348" y="142" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#1E5746">${mode === "a" ? "竖 16×20" : "竖 20×20"}</text>
    </svg>`;
  }

  function posterSvg() {
    const off = mode === "b";
    let grid = "";
    if (showGuide) {
      for (let i = 0; i <= 8; i++) {
        const x = 60 + i * 37.5;
        const y = 14 + i * 32;
        grid += `<line x1="${x}" y1="14" x2="${x}" y2="270" stroke="#9BB4A5" stroke-width="0.9" stroke-dasharray="3 2"/>`;
        grid += `<line x1="60" y1="${y}" x2="360" y2="${y}" stroke="#9BB4A5" stroke-width="0.9" stroke-dasharray="3 2"/>`;
      }
    }
    const cx = off ? 298 : 285;
    const cy = off ? 96 : 78;
    const dx = off ? 16 : 0;
    return `<svg viewBox="0 0 420 284" role="img" aria-label="设计周海报分区 8×8 方格拆解">
      <rect x="60" y="14" width="300" height="256" fill="#EDF2EC" stroke="#8FA397" stroke-width="1.4"/>
      <line x1="60" y1="142" x2="360" y2="142" stroke="#8FA397" stroke-width="1"/>
      <line x1="210" y1="14" x2="210" y2="238" stroke="#8FA397" stroke-width="1"/>
      <line x1="60" y1="238" x2="360" y2="238" stroke="#8FA397" stroke-width="1"/>
      <text x="${74 + dx}" y="58" font-family="Noto Sans SC, sans-serif" font-size="24" font-weight="900" fill="#0E1513">设计周</text>
      <text x="${74 + dx}" y="84" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600" fill="#1E5746">DESIGN WEEK 2024</text>
      <circle cx="${cx}" cy="${cy}" r="50" fill="#DE7853" ${off ? 'stroke="#B22222" stroke-width="2" stroke-dasharray="5 3"' : ""}/>
      <text x="${74 - dx * 0.6}" y="198" font-family="Space Grotesk, sans-serif" font-size="30" font-weight="700" fill="#0E1513">06</text>
      <text x="${148 - dx * 0.6}" y="188" font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#3B4C46">JUNE</text>
      <text x="${148 - dx * 0.6}" y="204" font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#3B4C46">10–16</text>
      <text x="224" y="176" font-family="Noto Sans SC, sans-serif" font-size="11.5" font-weight="600" fill="#0E1513">创意 · 灵感 · 连接</text>
      <text x="224" y="196" font-family="Space Grotesk, sans-serif" font-size="11" fill="#3B4C46">CREATE · INSPIRE</text>
      <text x="74" y="258" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#3B4C46">城市展览中心 · CITY EXHIBITION CENTER</text>
      <rect x="${off ? 270 : 285}" y="238" width="75" height="32" fill="#E1603C"/>
      <text x="${off ? 308 : 322}" y="259" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="16" fill="#FFFFFF">→</text>
      ${grid}
    </svg>`;
  }

  function cardsSvg() {
    const cram = mode === "b";
    const guide = showGuide
      ? `<line x1="210" y1="16" x2="210" y2="252" stroke="#E1603C" stroke-width="1" stroke-dasharray="4 3"/>
         <line x1="36" y1="134" x2="384" y2="134" stroke="#E1603C" stroke-width="1" stroke-dasharray="4 3"/>`
      : "";
    return `<svg viewBox="0 0 420 268" role="img" aria-label="2×2 界面卡片方格布局对比">
      <rect x="36" y="16" width="164" height="108" fill="#FFFFFF" stroke="#8FA397" stroke-width="1.4"/>
      <rect x="52" y="30" width="24" height="24" rx="4" fill="#2E7861"/>
      <text x="52" y="76" font-family="Noto Sans SC, sans-serif" font-size="13.5" font-weight="700" fill="#0E1513">数据概览</text>
      <text x="52" y="96" font-family="IBM Plex Mono, monospace" font-size="12" fill="#3B4C46">今日新增 1,280</text>

      <rect x="220" y="16" width="164" height="108" fill="#FFFFFF" stroke="${cram ? "#B22222" : "#8FA397"}" stroke-width="${cram ? 2 : 1.4}"/>
      <circle cx="248" cy="42" r="12" fill="#2E7861"/>
      <text x="236" y="76" font-family="Noto Sans SC, sans-serif" font-size="13.5" font-weight="700" fill="#0E1513">任务进度</text>
      ${
        cram
          ? `<text x="236" y="94" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#B22222">已完成 68%，其中三项需</text>
             <text x="236" y="109" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#B22222">跨部门复核并于周五前…</text>
             <rect x="220" y="116" width="164" height="8" fill="rgba(178,34,34,0.22)"/>`
          : `<text x="236" y="96" font-family="IBM Plex Mono, monospace" font-size="12" fill="#3B4C46">已完成 68%</text>`
      }

      <rect x="36" y="144" width="164" height="108" fill="#FFFFFF" stroke="#8FA397" stroke-width="1.4"/>
      <rect x="52" y="158" width="24" height="24" rx="12" fill="#2E7861"/>
      <text x="52" y="204" font-family="Noto Sans SC, sans-serif" font-size="13.5" font-weight="700" fill="#0E1513">团队成员</text>
      <text x="52" y="224" font-family="IBM Plex Mono, monospace" font-size="12" fill="#3B4C46">32 人在线</text>

      <rect x="220" y="144" width="164" height="108" fill="#FFFFFF" stroke="#8FA397" stroke-width="1.4"/>
      <polygon points="248,158 260,180 236,180" fill="#2E7861"/>
      <text x="236" y="204" font-family="Noto Sans SC, sans-serif" font-size="13.5" font-weight="700" fill="#0E1513">系统通知</text>
      <text x="236" y="224" font-family="IBM Plex Mono, monospace" font-size="12" fill="#3B4C46">3 条未读</text>
      ${guide}
    </svg>`;
  }

  function render() {
    const c = CONTENT[tab];
    kicker.textContent = c.kicker;
    h3.textContent = c.h3;
    quote.textContent = c.quote;
    body.textContent = mode === "a" ? c.bodyA : c.bodyB;
    const btns = modeRow.querySelectorAll(".s3-mode-btn");
    btns[0].textContent = c.modes[0];
    btns[1].textContent = c.modes[1];
    btns[0].classList.toggle("is-active", mode === "a");
    btns[1].classList.toggle("is-active", mode === "b");

    visual.innerHTML = tab === "icon" ? iconSvg() : tab === "poster" ? posterSvg() : cardsSvg();
  }

  document.querySelectorAll("[data-s3-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tab = btn.dataset.s3Tab;
      mode = "a";
      document.querySelectorAll("[data-s3-tab]").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      render();
    });
  });

  modeRow.querySelectorAll(".s3-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.s3Mode;
      render();
    });
  });

  guideBtn.addEventListener("click", () => {
    showGuide = !showGuide;
    guideBtn.classList.toggle("is-on", showGuide);
    guideBtn.setAttribute("aria-pressed", String(showGuide));
    guideBtn.textContent = `网格关键线：${showGuide ? "开" : "关"}`;
    render();
  });

  render();
}

/* ==================== 04：方格网格历史节点 ==================== */
function initSec04History() {
  const sketchEl = document.getElementById("hist-sketch");
  const metaEl = document.getElementById("hist-meta");
  const titleEl = document.getElementById("hist-title");
  const p1El = document.getElementById("hist-p1");
  const p2El = document.getElementById("hist-p2");

  const DATA = [
    {
      meta: "法国 · Jean-Nicolas-Louis Durand · 《建筑学讲义概要》(1802–1805)",
      title: "把房子画在正方形坐标纸上",
      p1: "1802 至 1805 年，巴黎综合理工学院教授让-尼古拉-路易·迪朗出版了《建筑学讲义概要》（Précis des leçons d'architecture）。面对需要快速批量建造公共建筑的时代，他抛弃纯凭个人感觉推敲立面的旧习惯，把均匀的正方形坐标纸（papier quadrillé）变成构图底图。",
      p2: "柱廊、墙体、房间与庭院全按方格模数的倍数排进 3×3 或更大矩阵里自由组合——这种「先定正方形基本单位，再做组件拼装」的逻辑，比现代平面网格早了一个半世纪。",
      svg: `<svg viewBox="0 0 220 220"><rect width="220" height="220" fill="#F7F8F3"/>
        <g stroke="#B8C8BC" stroke-width="1">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="${20 + i * 30}" y1="20" x2="${20 + i * 30}" y2="200"/><line x1="20" y1="${20 + i * 30}" x2="200" y2="${20 + i * 30}"/>`).join("")}</g>
        <rect x="20" y="20" width="180" height="180" fill="none" stroke="#1E5746" stroke-width="2.4"/>
        <rect x="80" y="80" width="60" height="60" fill="#F5DCCE" stroke="#E1603C" stroke-width="2"/>
        <circle cx="50" cy="50" r="6" fill="#1E5746"/><circle cx="170" cy="50" r="6" fill="#1E5746"/>
        <circle cx="50" cy="170" r="6" fill="#1E5746"/><circle cx="170" cy="170" r="6" fill="#1E5746"/>
        <text x="110" y="114" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#0E1513">3×3 院落</text></svg>`,
    },
    {
      meta: "瑞士 · Karl Gerstner · 《设计程序》(1964)",
      title: "58 个基本单位，一网通吃 2 到 6 栏",
      p1: "1962 年左右，瑞士设计师卡尔·格斯特纳为德国财经杂志《Capital》设计了一套以 10pt 为基本单位、总宽 58 单位、缝隙恒为 2 单位的网格，并在 1964 年著作《设计程序》（Designing Programmes）中完整公开。",
      p2: "58 这个看似怪异的数字恰能无余数拆出 2 栏（2×28+2）、3 栏（3×18+4）、4 栏（4×13+6）、5 栏（5×10+8）与 6 栏（6×8+10）。他由此证明：网格不是僵化牢笼，而是生出秩序与变化的算法程序。",
      svg: `<svg viewBox="0 0 220 220"><rect width="220" height="220" fill="#F7F8F3"/>
        <text x="16" y="28" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#1E5746">58 UNITS · GUTTER = 2</text>
        <rect x="16" y="42" width="90" height="24" fill="#E4ECE3" stroke="#1E5746"/><rect x="114" y="42" width="90" height="24" fill="#E4ECE3" stroke="#1E5746"/>
        <rect x="16" y="76" width="58" height="24" fill="#F5DCCE" stroke="#E1603C"/><rect x="81" y="76" width="58" height="24" fill="#F5DCCE" stroke="#E1603C"/><rect x="146" y="76" width="58" height="24" fill="#F5DCCE" stroke="#E1603C"/>
        <rect x="16" y="110" width="42" height="24" fill="#E4ECE3" stroke="#1E5746"/><rect x="64" y="110" width="42" height="24" fill="#E4ECE3" stroke="#1E5746"/><rect x="112" y="110" width="42" height="24" fill="#E4ECE3" stroke="#1E5746"/><rect x="160" y="110" width="44" height="24" fill="#E4ECE3" stroke="#1E5746"/>
        <rect x="16" y="144" width="26" height="24" fill="#F5DCCE" stroke="#E1603C"/><rect x="48" y="144" width="26" height="24" fill="#F5DCCE" stroke="#E1603C"/><rect x="80" y="144" width="26" height="24" fill="#F5DCCE" stroke="#E1603C"/><rect x="112" y="144" width="26" height="24" fill="#F5DCCE" stroke="#E1603C"/><rect x="144" y="144" width="26" height="24" fill="#F5DCCE" stroke="#E1603C"/><rect x="176" y="144" width="28" height="24" fill="#F5DCCE" stroke="#E1603C"/>
        <text x="110" y="198" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#3B4C46">2 / 3 / 4 / 6 栏共享同底</text></svg>`,
    },
    {
      meta: "荷兰 · Wim Crouwel · New Alphabet (1967, MoMA 馆藏)",
      title: "只用横竖折线，在方格里重写字母表",
      p1: "1967 年，被称为「网格先生」的荷兰设计师维姆·克鲁威尔针对早期阴极射线管（CRT）与电子照排设备无法平滑显示曲线和斜线的限制，推出实验字体 New Alphabet（2011 年被纽约现代艺术博物馆 MoMA 收入馆藏）。",
      p2: "全部字母被严苛地锁进正交正方形方格里，只许走水平与垂直笔画。尽管克鲁威尔本人坦言它并非为了日常正文阅读，这套实验却提前预演了像素字体、点阵屏与数字图标网格的时代。",
      svg: `<svg viewBox="0 0 220 220"><rect width="220" height="220" fill="#F7F8F3"/>
        <g stroke="#CAD7CE" stroke-width="1">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${26 + i * 24}" y1="26" x2="${26 + i * 24}" y2="194"/><line x1="26" y1="${26 + i * 24}" x2="194" y2="${26 + i * 24}"/>`).join("")}</g>
        <path d="M50 170 V50 H170 V170 M50 110 H170" fill="none" stroke="#E1603C" stroke-width="12" stroke-linecap="square" stroke-linejoin="miter"/>
        <text x="110" y="210" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#1E5746">ORTHOGONAL GRID · 1967</text></svg>`,
    },
    {
      meta: "瑞士 · Josef Müller-Brockmann (1981) → 现代数字系统",
      title: "从瑞士纸面手册到 24dp 图标与 CSS Grid",
      p1: "1981 年，瑞士设计师约瑟夫·米勒-布罗克曼由 Niggli 出版社推出双语经典《平面设计中的网格系统》（Grid Systems in Graphic Design / Rastersysteme für die visuelle Gestaltung），系统讲透了 8 格到 32 格的建构比例与图文分工。",
      p2: "今天这套逻辑直接长进了屏幕里：Google Material Design 以 24dp×24dp 正方格配合关键线规范系统图标，CSS Grid 借 aspect-ratio: 1 / 1 与统一 gap 让网页无需繁琐换算就能长出自适应方格。",
      svg: `<svg viewBox="0 0 220 220"><rect width="220" height="220" fill="#F7F8F3"/>
        <g stroke="#B8C8BC" stroke-width="1">${[0, 1, 2, 3, 4].map((i) => `<line x1="${30 + i * 40}" y1="30" x2="${30 + i * 40}" y2="190"/><line x1="30" y1="${30 + i * 40}" x2="190" y2="${30 + i * 40}"/>`).join("")}</g>
        <rect x="46" y="46" width="128" height="128" fill="none" stroke="#E1603C" stroke-width="1.8" stroke-dasharray="4 3"/>
        <circle cx="110" cy="110" r="72" fill="none" stroke="#1E5746" stroke-width="1.8"/>
        <line x1="30" y1="30" x2="190" y2="190" stroke="#9BB4A5" stroke-width="1"/>
        <line x1="190" y1="30" x2="30" y2="190" stroke="#9BB4A5" stroke-width="1"/>
        <text x="110" y="210" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#1E5746">24dp KEYLINE / CSS 1:1</text></svg>`,
    },
  ];

  function render(idx) {
    const d = DATA[idx];
    sketchEl.innerHTML = d.svg;
    metaEl.textContent = d.meta;
    titleEl.textContent = d.title;
    p1El.textContent = d.p1;
    p2El.textContent = d.p2;
  }

  document.querySelectorAll("[data-hist]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.hist);
      document.querySelectorAll("[data-hist]").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      render(idx);
    });
  });

  render(0);
}

/* ==================== 05：什么时候别用（对比切换镜） ==================== */
function initSec05AvoidCases() {
  const stage = document.getElementById("s5-stage");
  const fixBtn = document.getElementById("s5-fix-btn");
  let cur = "cinema";
  let fixed = false;

  const CASES = {
    cinema: {
      badBadge: "硬塞 1:1 · 两侧画面被切掉 57%",
      goodBadge: "换回宽幅网格 · 完整保留 2.35:1 构图",
      badTitle: "宽银幕剧照被硬裁成正方形，叙事断成半截",
      goodTitle: "释放横向比例后，人物与远景的呼应完整回来",
      badDesc: "电影剧照靠左右开阔环境与两侧人物的对望建立关系。强塞进 1:1 方格后，左侧背影与右侧建筑同时被裁掉，只剩孤零零中间一块。",
      goodDesc: "改用层级网格或非对称网格承接 2.35:1 原画幅，下方配简洁文字栏，既不伤画面又能保住对齐秩序。",
      badSvg: `<svg viewBox="0 0 380 180"><rect width="380" height="180" fill="#E4ECE3"/>
        <rect x="20" y="34" width="340" height="112" fill="#DCE4DE" stroke="#8FA397" stroke-dasharray="4 3"/>
        <path d="M20 120 Q110 78 190 105 T360 96 L360 146 L20 146 Z" fill="#B2C5BA"/>
        <circle cx="72" cy="96" r="12" fill="#8D9E95"/><rect x="64" y="109" width="16" height="28" fill="#8D9E95"/>
        <rect x="134" y="34" width="112" height="112" fill="#F7F8F3" stroke="#B22222" stroke-width="2.4"/>
        <path d="M134 118 Q170 94 246 104 L246 146 L134 146 Z" fill="#2E7861"/>
        <circle cx="190" cy="88" r="13" fill="#E1603C"/><rect x="181" y="102" width="18" height="34" fill="#E1603C"/>
        <text x="76" y="26" text-anchor="middle" font-size="11" fill="#B22222">被裁掉的左景</text>
        <text x="304" y="26" text-anchor="middle" font-size="11" fill="#B22222">被裁掉的右景</text></svg>`,
      goodSvg: `<svg viewBox="0 0 380 180"><rect width="380" height="180" fill="#E4ECE3"/>
        <rect x="20" y="28" width="340" height="124" fill="#F7F8F3" stroke="#19624B" stroke-width="2.2"/>
        <path d="M20 124 Q110 78 190 106 T360 92 L360 152 L20 152 Z" fill="#2E7861"/>
        <circle cx="78" cy="94" r="12" fill="#0E1513"/><rect x="70" y="107" width="16" height="30" fill="#0E1513"/>
        <circle cx="292" cy="86" r="13" fill="#E1603C"/><rect x="283" y="100" width="18" height="36" fill="#E1603C"/>
        <text x="190" y="20" text-anchor="middle" font-size="11" fill="#19624B">完整保留 2.35 : 1 宽幅对话关系</text></svg>`,
    },
    essay: {
      badBadge: "硬塞 1:1 · 行宽过窄频繁换行",
      goodBadge: "换回分栏/手稿网格 · 稳定阅读节奏",
      badTitle: "长篇正文切进小方格，每读七八个字就被迫折行",
      goodTitle: "按舒适行宽（约 28–38 汉字）和基线行距排正文",
      badDesc: "把连贯论述强塞进 1:1 方格，眼球在行尾来回折返，阅读气口不断被打断；格子底边还硬截掉下半段。",
      goodDesc: "长文本应交给手稿网格或分栏网格控制合理行宽，再配合基线网格统一跨栏行高。",
      badSvg: `<svg viewBox="0 0 380 180"><rect width="380" height="180" fill="#E4ECE3"/>
        <rect x="115" y="15" width="150" height="150" fill="#FFFFFF" stroke="#B22222" stroke-width="2.2"/>
        <text x="128" y="42" font-size="12" fill="#0E1513">城市更新不是拆</text>
        <text x="128" y="60" font-size="12" fill="#0E1513">掉旧街区重盖玻</text>
        <text x="128" y="78" font-size="12" fill="#0E1513">璃塔楼，而是让</text>
        <text x="128" y="96" font-size="12" fill="#0E1513">步行尺度、转角</text>
        <text x="128" y="114" font-size="12" fill="#0E1513">商铺与日常光线</text>
        <text x="128" y="132" font-size="12" fill="#B22222">继续留在街面…</text>
        <rect x="115" y="144" width="150" height="21" fill="rgba(178,34,34,0.16)"/></svg>`,
      goodSvg: `<svg viewBox="0 0 380 180"><rect width="380" height="180" fill="#E4ECE3"/>
        <rect x="26" y="20" width="328" height="140" fill="#FFFFFF" stroke="#19624B" stroke-width="2"/>
        <line x1="42" y1="54" x2="338" y2="54" stroke="#DCE6DF"/>
        <line x1="42" y1="80" x2="338" y2="80" stroke="#DCE6DF"/>
        <line x1="42" y1="106" x2="338" y2="106" stroke="#DCE6DF"/>
        <line x1="42" y1="132" x2="338" y2="132" stroke="#DCE6DF"/>
        <text x="42" y="50" font-size="12.5" fill="#0E1513">城市更新不是拆掉旧街区重盖玻璃塔楼，</text>
        <text x="42" y="76" font-size="12.5" fill="#0E1513">而是让步行尺度、转角商铺与日常光线</text>
        <text x="42" y="102" font-size="12.5" fill="#0E1513">继续留在街面，让不同年代的居民自然</text>
        <text x="42" y="128" font-size="12.5" fill="#0E1513">在同一条路上相遇并停下来交谈。</text></svg>`,
    },
    mixed: {
      badBadge: "硬锁 1:1 · 左卡大面积空洞，右卡文字溢出",
      goodBadge: "松开高度锁 · 各自贴合内容体量",
      badTitle: "体量悬殊的条目硬装等大方格，一边空一边挤",
      goodTitle: "保留统一列宽与缝隙，让卡片高度随内容呼吸",
      badDesc: "第一张卡只有标题和数字，第二张卡带着多行摘要。硬锁 1:1 后，左卡底下空出大片死白，右卡文字撞底裁断。",
      goodDesc: "遇到长度不可控的动态内容流，保留列对齐与统一 gutter，把行高交给内容本身，或切到复合网格与子网格。",
      badSvg: `<svg viewBox="0 0 380 180"><rect width="380" height="180" fill="#E4ECE3"/>
        <rect x="34" y="18" width="144" height="144" fill="#FFFFFF" stroke="#8FA397" stroke-width="1.6"/>
        <text x="48" y="46" font-size="13" font-weight="700" fill="#0E1513">公告</text>
        <text x="48" y="68" font-size="12" fill="#3B4C46">周日闭馆。</text>
        <rect x="44" y="84" width="124" height="68" fill="#F4ECE6" stroke="#B22222" stroke-dasharray="3 3"/>
        <text x="106" y="122" text-anchor="middle" font-size="11" fill="#B22222">被迫空洞</text>

        <rect x="202" y="18" width="144" height="144" fill="#FFFFFF" stroke="#B22222" stroke-width="2"/>
        <text x="216" y="42" font-size="13" font-weight="700" fill="#0E1513">展期导览说明</text>
        <text x="216" y="62" font-size="11" fill="#3B4C46">上午十点起整点提供</text>
        <text x="216" y="79" font-size="11" fill="#3B4C46">双语导览，请提前在</text>
        <text x="216" y="96" font-size="11" fill="#3B4C46">东厅服务台登记耳机</text>
        <text x="216" y="113" font-size="11" fill="#3B4C46">并凭预约码入场参观</text>
        <text x="216" y="130" font-size="11" fill="#B22222">团体须提前三日电话…</text>
        <rect x="202" y="142" width="144" height="20" fill="rgba(178,34,34,0.18)"/></svg>`,
      goodSvg: `<svg viewBox="0 0 380 180"><rect width="380" height="180" fill="#E4ECE3"/>
        <rect x="34" y="18" width="144" height="68" fill="#FFFFFF" stroke="#19624B" stroke-width="1.8"/>
        <text x="48" y="44" font-size="13" font-weight="700" fill="#0E1513">公告</text>
        <text x="48" y="66" font-size="12" fill="#3B4C46">周日闭馆。</text>
        <rect x="34" y="98" width="144" height="64" fill="#EDF2EC" stroke="#8FA397" stroke-dasharray="3 2"/>
        <text x="106" y="134" text-anchor="middle" font-size="11.5" fill="#1E5746">顺势排入下一卡</text>

        <rect x="202" y="18" width="144" height="144" fill="#FFFFFF" stroke="#19624B" stroke-width="1.8"/>
        <text x="216" y="42" font-size="13" font-weight="700" fill="#0E1513">展期导览说明</text>
        <text x="216" y="64" font-size="11" fill="#3B4C46">上午十点起整点提供</text>
        <text x="216" y="82" font-size="11" fill="#3B4C46">双语导览，请提前在</text>
        <text x="216" y="100" font-size="11" fill="#3B4C46">东厅服务台登记耳机</text>
        <text x="216" y="118" font-size="11" fill="#3B4C46">并凭预约码入场。</text></svg>`,
    },
  };

  function render() {
    const c = CASES[cur];
    fixBtn.setAttribute("aria-pressed", String(fixed));
    fixBtn.classList.toggle("is-active", !fixed);
    fixBtn.classList.toggle("is-warn", !fixed);
    fixBtn.textContent = fixed ? "当前：已换合适网格（点此退回 1:1）" : "当前：硬塞 1:1（点此换对网格）";

    stage.innerHTML = `
      <div class="avoid-demo-box">${fixed ? c.goodSvg : c.badSvg}</div>
      <div class="avoid-note">
        <span class="avoid-badge ${fixed ? "is-ok" : ""}">${fixed ? c.goodBadge : c.badBadge}</span>
        <h3>${fixed ? c.goodTitle : c.badTitle}</h3>
        <p>${fixed ? c.goodDesc : c.badDesc}</p>
      </div>`;
  }

  document.querySelectorAll("[data-s5-case]").forEach((btn) => {
    btn.addEventListener("click", () => {
      cur = btn.dataset.s5Case;
      fixed = false;
      document.querySelectorAll("[data-s5-case]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  fixBtn.addEventListener("click", () => {
    fixed = !fixed;
    render();
  });

  render();
}

/* ==================== 06：CSS 实时方格生成器 ==================== */
function initSec06CssLab() {
  const colsIn = document.getElementById("s6-cols");
  const gapIn = document.getElementById("s6-gap");
  const spanIn = document.getElementById("s6-span");
  const colsOut = document.getElementById("s6-cols-val");
  const gapOut = document.getElementById("s6-gap-val");
  const spanOut = document.getElementById("s6-span-val");
  const codeEl = document.getElementById("s6-code");
  const preview = document.getElementById("s6-preview");
  const measureEl = document.getElementById("s6-measure");

  function render() {
    const cols = Number(colsIn.value);
    const gap = Number(gapIn.value);
    const sp = Math.min(Number(spanIn.value), cols - 1);

    colsOut.textContent = String(cols);
    gapOut.textContent = `${gap}px`;
    spanOut.textContent = `${sp}×${sp}`;

    preview.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    preview.style.gap = `${gap}px`;

    // 填满一个整洁的 rows × cols 演示矩阵
    const rows = Math.max(sp + 1, 4);
    const totalCells = cols * rows;
    const heroArea = sp * sp;
    const subSpan = cols >= 6 ? 2 : 1;
    const subArea = subSpan > 1 ? 2 : 1;
    const remaining = Math.max(0, totalCells - heroArea - subArea);

    let html = `<div class="css-cell is-hero-span" style="grid-column: span ${sp}; grid-row: span ${sp};">${sp}×${sp}</div>`;
    if (subSpan > 1) {
      html += `<div class="css-cell is-sub-span" style="grid-column: span 2; aspect-ratio: auto;">2×1</div>`;
    } else {
      html += `<div class="css-cell is-sub-span">1×1</div>`;
    }
    for (let i = 0; i < remaining; i++) {
      html += `<div class="css-cell">1×1</div>`;
    }
    preview.innerHTML = html;

    measureEl.textContent = `${cols} 列 · gap ${gap}px · 主块 ${sp}×${sp}`;
    codeEl.textContent = `.square-grid {\n  display: grid;\n  grid-template-columns: repeat(${cols}, minmax(0, 1fr));\n  gap: ${gap}px; /* 横竖等缝 */\n}\n.unit {\n  aspect-ratio: 1 / 1;\n}\n.module-hero {\n  grid-column: span ${sp};\n  grid-row: span ${sp};\n}`;
  }

  [colsIn, gapIn, spanIn].forEach((el) => el.addEventListener("input", render));
  render();
}

/* ==================== 07：小练习（单一变量四选一） ==================== */
function initSec07Quiz() {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const fb = document.getElementById("quiz-feedback");
  const fbHead = document.getElementById("quiz-fb-head");
  const fbBody = document.getElementById("quiz-fb-body");

  // 用统一视觉画四张 SVG，严格只差一个结构变量，不泄露好坏
  function drawOptionSvg(variant) {
    const W = 210;
    const H = 210;
    // 6×6 网格
    if (variant === "A") {
      // 变量：单元为 1.32:1 扁矩形，其余全对
      const cellW = 28;
      const cellH = 21.2;
      const g = 4;
      const ox = 11;
      const oy = 31;
      let grid = "";
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          grid += `<rect x="${ox + c * (cellW + g)}" y="${oy + r * (cellH + g)}" width="${cellW}" height="${cellH}" fill="none" stroke="#C5D2C8" stroke-width="0.9"/>`;
        }
      }
      const w3 = 3 * cellW + 2 * g;
      const h3 = 3 * cellH + 2 * g;
      const h2 = 2 * cellH + g;
      return `<svg viewBox="0 0 ${W} ${H}">${grid}
        <rect x="${ox}" y="${oy}" width="${w3}" height="${h3}" fill="#F5DCCE" stroke="#E1603C" stroke-width="1.5"/>
        <ellipse cx="${ox + w3 / 2}" cy="${oy + h3 / 2}" rx="${w3 * 0.34}" ry="${h3 * 0.34}" fill="#E1603C"/>
        <rect x="${ox + 3 * (cellW + g)}" y="${oy}" width="${w3}" height="${h2}" fill="#E4ECE3" stroke="#1E5746" stroke-width="1.4"/>
        <text x="${ox + 3 * (cellW + g) + 8}" y="${oy + 22}" font-size="11" font-weight="700" fill="#0E1513">城市建筑展</text>
        <text x="${ox + 3 * (cellW + g) + 8}" y="${oy + 38}" font-size="9.5" fill="#3B4C46">06.10–16</text>
        <rect x="${ox + 3 * (cellW + g)}" y="${oy + 3 * (cellH + g)}" width="${cellW}" height="${cellH}" fill="#2E7861"/>
        <rect x="${ox + 4 * (cellW + g)}" y="${oy + 3 * (cellH + g)}" width="${cellW}" height="${cellH}" fill="#2E7861"/>
        <rect x="${ox + 5 * (cellW + g)}" y="${oy + 3 * (cellH + g)}" width="${cellW}" height="${cellH}" fill="#2E7861"/>
      </svg>`;
    }

    if (variant === "B") {
      // 正确：严格 1:1 + 等缝 + 3×3 / 3×2 / 1×1 主次与平衡
      const u = 26;
      const g = 5;
      const ox = 15;
      const oy = 15;
      let grid = "";
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          grid += `<rect x="${ox + c * (u + g)}" y="${oy + r * (u + g)}" width="${u}" height="${u}" fill="none" stroke="#C5D2C8" stroke-width="0.9"/>`;
        }
      }
      const w3 = 3 * u + 2 * g;
      const h2 = 2 * u + g;
      return `<svg viewBox="0 0 ${W} ${H}">${grid}
        <rect x="${ox}" y="${oy}" width="${w3}" height="${w3}" fill="#F5DCCE" stroke="#E1603C" stroke-width="1.5"/>
        <circle cx="${ox + w3 / 2}" cy="${oy + w3 / 2}" r="${w3 * 0.34}" fill="#E1603C"/>
        <rect x="${ox + 3 * (u + g)}" y="${oy}" width="${w3}" height="${h2}" fill="#E4ECE3" stroke="#1E5746" stroke-width="1.4"/>
        <text x="${ox + 3 * (u + g) + 8}" y="${oy + 24}" font-size="11" font-weight="700" fill="#0E1513">城市建筑展</text>
        <text x="${ox + 3 * (u + g) + 8}" y="${oy + 42}" font-size="9.5" fill="#3B4C46">06.10–16</text>
        <rect x="${ox + 3 * (u + g)}" y="${oy + 3 * (u + g)}" width="${u}" height="${u}" fill="#2E7861"/>
        <rect x="${ox + 4 * (u + g)}" y="${oy + 3 * (u + g)}" width="${u}" height="${u}" fill="#2E7861"/>
        <rect x="${ox + 5 * (u + g)}" y="${oy + 3 * (u + g)}" width="${u}" height="${u}" fill="#2E7861"/>
      </svg>`;
    }

    if (variant === "C") {
      // 变量：横缝宽 11px、竖缝窄 2px，导致跨 3×3 大块和右边堆叠底边错台
      const u = 23;
      const gx = 10;
      const gy = 2;
      const ox = 11;
      const oy = 31;
      let grid = "";
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          grid += `<rect x="${ox + c * (u + gx)}" y="${oy + r * (u + gy)}" width="${u}" height="${u}" fill="none" stroke="#C5D2C8" stroke-width="0.9"/>`;
        }
      }
      const w3 = 3 * u + 2 * gx;
      const h3 = 3 * u + 2 * gy;
      const h2 = 2 * u + gy;
      return `<svg viewBox="0 0 ${W} ${H}">${grid}
        <rect x="${ox}" y="${oy}" width="${w3}" height="${h3}" fill="#F5DCCE" stroke="#E1603C" stroke-width="1.5"/>
        <circle cx="${ox + w3 / 2}" cy="${oy + h3 / 2}" r="${h3 * 0.34}" fill="#E1603C"/>
        <rect x="${ox + 3 * (u + gx)}" y="${oy}" width="${w3}" height="${h2}" fill="#E4ECE3" stroke="#1E5746" stroke-width="1.4"/>
        <text x="${ox + 3 * (u + gx) + 8}" y="${oy + 22}" font-size="11" font-weight="700" fill="#0E1513">城市建筑展</text>
        <text x="${ox + 3 * (u + gx) + 8}" y="${oy + 38}" font-size="9.5" fill="#3B4C46">06.10–16</text>
        <rect x="${ox + 3 * (u + gx)}" y="${oy + 3 * (u + gy)}" width="${u}" height="${u}" fill="#2E7861"/>
        <rect x="${ox + 4 * (u + gx)}" y="${oy + 3 * (u + gy)}" width="${u}" height="${u}" fill="#2E7861"/>
        <rect x="${ox + 5 * (u + gx)}" y="${oy + 3 * (u + gy)}" width="${u}" height="${u}" fill="#2E7861"/>
      </svg>`;
    }

    // D：严格 1:1 + 等缝，但 5 块全做成一样大的 2×2 均等瓷砖，零尺度差
    const u = 26;
    const g = 5;
    const ox = 15;
    const oy = 15;
    let grid = "";
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        grid += `<rect x="${ox + c * (u + g)}" y="${oy + r * (u + g)}" width="${u}" height="${u}" fill="none" stroke="#C5D2C8" stroke-width="0.9"/>`;
      }
    }
    const w2 = 2 * u + g;
    return `<svg viewBox="0 0 ${W} ${H}">${grid}
      <rect x="${ox}" y="${oy}" width="${w2}" height="${w2}" fill="#F5DCCE" stroke="#E1603C" stroke-width="1.5"/>
      <circle cx="${ox + w2 / 2}" cy="${oy + w2 / 2}" r="${w2 * 0.32}" fill="#E1603C"/>
      <rect x="${ox + 2 * (u + g)}" y="${oy}" width="${w2}" height="${w2}" fill="#E4ECE3" stroke="#1E5746" stroke-width="1.4"/>
      <text x="${ox + 2 * (u + g) + 5}" y="${oy + 24}" font-size="10.5" font-weight="700" fill="#0E1513">建筑展</text>
      <text x="${ox + 2 * (u + g) + 5}" y="${oy + 40}" font-size="9" fill="#3B4C46">06.10</text>
      <rect x="${ox + 4 * (u + g)}" y="${oy}" width="${w2}" height="${w2}" fill="#2E7861"/>
      <rect x="${ox}" y="${oy + 2 * (u + g)}" width="${w2}" height="${w2}" fill="#2E7861"/>
      <rect x="${ox + 2 * (u + g)}" y="${oy + 2 * (u + g)}" width="${w2}" height="${w2}" fill="#2E7861"/>
    </svg>`;
  }

  ["A", "B", "C", "D"].forEach((id) => {
    document.getElementById(`quiz-svg-${id}`).innerHTML = drawOptionSvg(id);
  });

  const EXPLAIN = {
    A: {
      ok: false,
      head: "再看看底格的形状：方案 A 的单元格是 1.32 : 1 扁矩形",
      body: "虽然模块边缘都贴齐了格线，但底格本身不是正方形，圆图被顺带拉扁成椭圆，横竖尺度也不同步。方格网格的第一前提是 1 : 1 正方单元。",
    },
    B: {
      ok: true,
      head: "选对了！方案 B 四条规律同时成立",
      body: "严格 1 : 1 正方底格、横竖等缝、全部模块咬住格线交点；同时用 3×3 主图、3×2 标题、三枚 1×1 导览块拉开尺度层级，留白舒展，一眼既有秩序又有主次。",
    },
    C: {
      ok: false,
      head: "缝隙露出破绽了：方案 C 横缝宽、竖缝极窄",
      body: "尽管单个格子都是 1 : 1，但列缝和行缝差了 5 倍。跨 3 格的大模块横向吃进两条宽缝、纵向只吃进两条极窄缝，硬生生把 3×3 正方主块拉成了扁矩形，节奏横松竖挤。",
    },
    D: {
      ok: false,
      head: "陷入了瓷砖平权：方案 D 五块元素全做成一样大的 2×2",
      body: "底格和缝隙都很规整，但主视觉、标题与三个小图标全占同样大小，面积比只有 1 : 1，失去了主次层级，视线不知道该先看哪一块。",
    },
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const choice = card.dataset.choice;
      const ex = EXPLAIN[choice];
      cards.forEach((c) => {
        const isMe = c === card;
        c.setAttribute("aria-checked", String(isMe));
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        if (isMe) c.classList.add(ex.ok ? "is-correct" : "is-wrong");
        else if (c.dataset.choice === "B") c.classList.add("is-correct");
      });
      fb.hidden = false;
      fb.classList.toggle("is-wrong", !ex.ok);
      fbHead.textContent = ex.head;
      fbBody.textContent = ex.body;
    });
  });
}

/* ==================== 08：原海报放大灯箱（支持拖动、缩放、Esc 关） ==================== */
function initSec08Lightbox() {
  const posterImg = document.getElementById("poster");
  const posterBtn = document.getElementById("poster-btn");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbViewport = document.getElementById("lb-viewport");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    posterBtn.focus();
  }

  posterBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.35);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.75, scale - 0.35);
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbViewport.addEventListener("pointerdown", (e) => {
    if (e.target === lbViewport && scale <= 1) {
      close();
      return;
    }
    lbViewport.setPointerCapture(e.pointerId);
    dragging = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
  });
  lbViewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = dragging.ox + (e.clientX - dragging.sx);
    ty = dragging.oy + (e.clientY - dragging.sy);
    applyTransform();
  });
  lbViewport.addEventListener("pointerup", () => (dragging = null));
  lbViewport.addEventListener("pointercancel", () => (dragging = null));

  lbViewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3.5, scale + (e.deltaY < 0 ? 0.18 : -0.18)));
      applyTransform();
    },
    { passive: false }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
