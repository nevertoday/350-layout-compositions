// 199 复合网格 · 正文 01–07 节各异化交互组件
import { PALETTE, gcd, lcm } from "./model.js";

// ======================================================
// 01 节：同素材四网对照切幕（手稿 / 分栏 / 模块 / 复合）
// ======================================================
const MODE_DATA = {
  manuscript: {
    label: "纯手稿单框",
    badge: "卡壳 · 图数沦为堆叠",
    verdict: "长文读着安静，但 72% 指标、图式圆点与叶片大片全被迫上下排长队。",
    detail: "单框手稿网格只认一条垂直文本流：跨页对比失效，数据失去并排参照，整页被拉成没有重点的纵长文档。长篇线性阅读适合它，多形态专题会当场失语。",
  },
  column: {
    label: "纯 3 栏分栏",
    badge: "卡壳 · 纵深节奏失控",
    verdict: "横向有了三栏，但图片高度和指标块缺少水平模数约束，底部参差不齐。",
    detail: "纯分栏网格只切竖线不切横格：一旦同时塞进大照片、圆环数据与注释，每一栏各自往下长，跨栏视觉落点高高低低，版面下半部容易扯出难看的空洞。",
  },
  modular: {
    label: "纯 4×3 模块",
    badge: "卡壳 · 长文碎成豆芽",
    verdict: "数据与小图很整齐，但整段导语硬塞进正方形小格里，每行只剩七八个字。",
    detail: "严格的等大模块格对均质产品卡片很友好，却对连续段落极不客气：读者刚看两眼就得折行换行，行尾撕裂、节奏破碎，大标题也施展不开气势。",
  },
  compound: {
    label: "复合（6栏 + 3×4模块）",
    badge: "协同 · 异质信息共生",
    verdict: "左 2 栏给长文稳定行长，右 4 栏给大图与三组模块精准对齐，共享同一套基线。",
    detail: "每 1 个模块宽度恰好等于 2 栏主轨，外边距和横纵基准完全重合。长文、摄影、圆环数据与注释各自待在最舒服的轨道里，眼睛一扫就能分清主次。",
  },
};

function renderModeSvg(mode) {
  const W = 560, H = 350, px = 26, py = 22, fw = W - px * 2, fh = H - py * 2;
  let gridLines = "";
  let blocks = "";

  if (mode === "manuscript") {
    gridLines = `<rect x="${px}" y="${py}" width="${fw}" height="${fh}" fill="none" stroke="${PALETTE.tealMain}" stroke-dasharray="4 3" opacity="0.55"/>`;
    blocks = `
      <rect x="${px + 18}" y="${py + 14}" width="${fw - 36}" height="38" fill="${PALETTE.ink}" opacity="0.1"/>
      <text x="${px + 28}" y="${py + 39}" font-size="16" font-weight="900" fill="${PALETTE.ink}">自然的秩序与生命力</text>
      <rect x="${px + 18}" y="${py + 62}" width="${fw - 36}" height="82" fill="${PALETTE.tealMain}"/>
      <text x="${px + 30}" y="${py + 109}" font-size="12" fill="#F4F2EC" font-weight="600">叶片主图被压成窄长横条，无法与标题并置</text>
      <g fill="${PALETTE.inkBody}" opacity="0.72">
        <rect x="${px + 18}" y="${py + 158}" width="${fw - 54}" height="8"/>
        <rect x="${px + 18}" y="${py + 174}" width="${fw - 72}" height="8"/>
        <rect x="${px + 18}" y="${py + 190}" width="${fw - 96}" height="8"/>
      </g>
      <rect x="${px + 18}" y="${py + 214}" width="${fw - 36}" height="76" fill="${PALETTE.errSoftBg}" stroke="${PALETTE.errLight}" stroke-dasharray="4 3"/>
      <text x="${px + 30}" y="${py + 245}" font-size="13" font-weight="700" fill="${PALETTE.errLight}">72% 指标 + PATTERN 图式 + 湖山被迫纵向排队</text>
      <text x="${px + 30}" y="${py + 269}" font-size="11" fill="${PALETTE.inkMuted}">横向空间全部浪费，无法在同一视线内对照阅读</text>
    `;
  } else if (mode === "column") {
    const cw = fw / 3;
    for (let i = 1; i < 3; i++) {
      gridLines += `<line x1="${px + cw * i}" y1="${py}" x2="${px + cw * i}" y2="${py + fh}" stroke="${PALETTE.tealMain}" stroke-dasharray="4 3" opacity="0.55"/>`;
    }
    blocks = `
      <rect x="${px + 4}" y="${py + 6}" width="${cw - 8}" height="156" fill="rgba(246,243,238,0.85)" stroke="${PALETTE.lilacLine}"/>
      <text x="${px + 12}" y="${py + 30}" font-size="15" font-weight="900" fill="${PALETTE.ink}">自然的秩序</text>
      <g fill="${PALETTE.inkBody}" opacity="0.65">
        <rect x="${px + 12}" y="${py + 48}" width="${cw - 28}" height="7"/>
        <rect x="${px + 12}" y="${py + 64}" width="${cw - 36}" height="7"/>
        <rect x="${px + 12}" y="${py + 80}" width="${cw - 24}" height="7"/>
        <rect x="${px + 12}" y="${py + 96}" width="${cw - 48}" height="7"/>
      </g>
      <rect x="${px + 4}" y="${py + 170}" width="${cw - 8}" height="128" fill="${PALETTE.errSoftBg}" stroke="${PALETTE.errLight}" stroke-dasharray="4 3"/>
      <text x="${px + 12}" y="${py + 236}" font-size="11" font-weight="700" fill="${PALETTE.errLight}">底部悬空参差</text>

      <rect x="${px + cw + 4}" y="${py + 6}" width="${cw - 8}" height="96" fill="${PALETTE.tealMain}"/>
      <text x="${px + cw + 14}" y="${py + 58}" font-size="12" fill="#fff" font-weight="700">叶片缩在 1 栏</text>
      <rect x="${px + cw + 4}" y="${py + 114}" width="${cw - 8}" height="118" fill="${PALETTE.violetMid}" opacity="0.85"/>
      <text x="${px + cw + 14}" y="${py + 174}" font-size="12" fill="#fff">湖山高度随意</text>

      <rect x="${px + cw * 2 + 4}" y="${py + 6}" width="${cw - 8}" height="134" fill="rgba(246,243,238,0.9)" stroke="${PALETTE.lilacLine}"/>
      <circle cx="${px + cw * 2 + 42}" cy="${py + 60}" r="22" fill="none" stroke="${PALETTE.tealMain}" stroke-width="8"/>
      <text x="${px + cw * 2 + 76}" y="${py + 66}" font-size="18" font-weight="800" fill="${PALETTE.ink}">72%</text>
      <rect x="${px + cw * 2 + 4}" y="${py + 154}" width="${cw - 8}" height="140" fill="${PALETTE.goldMain}" opacity="0.45"/>
      <text x="${px + cw * 2 + 14}" y="${py + 225}" font-size="11" fill="${PALETTE.goldInk}" font-weight="700">无横向模数对齐</text>
    `;
  } else if (mode === "modular") {
    const mw = fw / 4, mh = fh / 3;
    for (let i = 1; i < 4; i++) gridLines += `<line x1="${px + mw * i}" y1="${py}" x2="${px + mw * i}" y2="${py + fh}" stroke="${PALETTE.violetMain}" stroke-dasharray="4 3" opacity="0.55"/>`;
    for (let j = 1; j < 3; j++) gridLines += `<line x1="${px}" y1="${py + mh * j}" x2="${px + fw}" y2="${py + mh * j}" stroke="${PALETTE.violetMain}" stroke-dasharray="4 3" opacity="0.55"/>`;
    blocks = `
      <rect x="${px + 4}" y="${py + 4}" width="${mw - 8}" height="${mh - 8}" fill="${PALETTE.errSoftBg}" stroke="${PALETTE.errLight}" stroke-dasharray="4 3"/>
      <text x="${px + 11}" y="${py + 30}" font-size="13" font-weight="900" fill="${PALETTE.ink}">自然的秩</text>
      <text x="${px + 11}" y="${py + 48}" font-size="13" font-weight="900" fill="${PALETTE.ink}">序与生命</text>
      <text x="${px + 11}" y="${py + 76}" font-size="10" font-weight="700" fill="${PALETTE.errLight}">标题被迫断字</text>

      <rect x="${px + mw + 4}" y="${py + 4}" width="${mw - 8}" height="${mh - 8}" fill="${PALETTE.tealMain}"/>
      <text x="${px + mw + 14}" y="${py + 52}" font-size="11" fill="#fff">叶片受困小格</text>
      <rect x="${px + mw * 2 + 4}" y="${py + 4}" width="${mw - 8}" height="${mh - 8}" fill="${PALETTE.violetMid}"/>
      <text x="${px + mw * 2 + 14}" y="${py + 52}" font-size="11" fill="#fff">湖山被切方块</text>
      <rect x="${px + mw * 3 + 4}" y="${py + 4}" width="${mw - 8}" height="${mh - 8}" fill="#0A6665"/>
      <text x="${px + mw * 3 + 14}" y="${py + 52}" font-size="11" fill="#fff">鹦鹉螺平权</text>

      <rect x="${px + 4}" y="${py + mh + 4}" width="${mw - 8}" height="${mh - 8}" fill="${PALETTE.errSoftBg}" stroke="${PALETTE.errLight}" stroke-dasharray="4 3"/>
      <text x="${px + 10}" y="${py + mh + 26}" font-size="10" fill="${PALETTE.inkBody}">自然系统在</text>
      <text x="${px + 10}" y="${py + mh + 42}" font-size="10" fill="${PALETTE.inkBody}">看似混沌中</text>
      <text x="${px + 10}" y="${py + mh + 58}" font-size="10" fill="${PALETTE.inkBody}">遵循内在秩</text>
      <text x="${px + 10}" y="${py + mh + 82}" font-size="10" font-weight="700" fill="${PALETTE.errLight}">每行 5 字碎裂</text>

      <rect x="${px + mw + 4}" y="${py + mh + 4}" width="${mw - 8}" height="${mh - 8}" fill="rgba(246,243,238,0.9)" stroke="${PALETTE.lilacLine}"/>
      <text x="${px + mw + 26}" y="${py + mh + 56}" font-size="20" font-weight="800" fill="${PALETTE.ink}">72%</text>
      <rect x="${px + mw * 2 + 4}" y="${py + mh + 4}" width="${mw - 8}" height="${mh - 8}" fill="${PALETTE.goldMain}" opacity="0.5"/>
      <rect x="${px + mw * 3 + 4}" y="${py + mh + 4}" width="${mw - 8}" height="${mh - 8}" fill="rgba(246,243,238,0.6)" stroke="${PALETTE.lilacLine}"/>
      <text x="${px + 14}" y="${py + mh * 2 + 54}" font-size="12" fill="${PALETTE.inkMuted}">12 个等权豆腐块：全部一样大，读者不知先看哪一块</text>
    `;
  } else {
    const cw = fw / 6, mw = fw / 3, rh = fh / 3;
    for (let i = 1; i < 6; i++) {
      const isShared = i % 2 === 0;
      gridLines += `<line x1="${px + cw * i}" y1="${py}" x2="${px + cw * i}" y2="${py + fh}" stroke="${isShared ? PALETTE.violetMain : PALETTE.tealMain}" stroke-width="${isShared ? 1.4 : 0.9}" stroke-dasharray="${isShared ? "none" : "3 3"}" opacity="${isShared ? 0.72 : 0.42}"/>`;
    }
    for (let j = 1; j < 3; j++) {
      gridLines += `<line x1="${px}" y1="${py + rh * j}" x2="${px + fw}" y2="${py + rh * j}" stroke="${PALETTE.violetMain}" stroke-dasharray="5 3" opacity="0.55"/>`;
    }
    blocks = `
      <rect x="${px + 4}" y="${py + 4}" width="${cw * 2 - 8}" height="${rh - 8}" fill="rgba(246,243,238,0.88)"/>
      <text x="${px + 12}" y="${py + 34}" font-size="17" font-weight="900" fill="${PALETTE.ink}">自然的秩序</text>
      <text x="${px + 12}" y="${py + 56}" font-size="17" font-weight="900" fill="${PALETTE.ink}">与生命力</text>
      <text x="${px + 12}" y="${py + 78}" font-size="9.5" font-weight="700" fill="${PALETTE.tealDark}">LEFT 2 COLS · TITLE</text>

      <rect x="${px + cw * 2 + 4}" y="${py + 4}" width="${cw * 4 - 8}" height="${rh - 8}" fill="${PALETTE.tealMain}"/>
      <text x="${px + cw * 2 + 16}" y="${py + 52}" font-size="14" font-weight="700" fill="#F4F2EC">结构 STRUCTURE · 跨 4 栏大图锚定</text>
      <text x="${px + cw * 2 + 16}" y="${py + 74}" font-size="10.5" fill="rgba(244,242,236,0.85)">跨 2 个模块宽度，右缘严格钉在内容区外框</text>

      <rect x="${px + 4}" y="${py + rh + 4}" width="${cw * 2 - 8}" height="${rh - 8}" fill="rgba(246,243,238,0.92)"/>
      <g fill="${PALETTE.inkBody}" opacity="0.72">
        <rect x="${px + 12}" y="${py + rh + 18}" width="${cw * 2 - 28}" height="7"/>
        <rect x="${px + 12}" y="${py + rh + 34}" width="${cw * 2 - 32}" height="7"/>
        <rect x="${px + 12}" y="${py + rh + 50}" width="${cw * 2 - 26}" height="7"/>
        <rect x="${px + 12}" y="${py + rh + 66}" width="${cw * 2 - 56}" height="7"/>
      </g>
      <text x="${px + 12}" y="${py + rh + 86}" font-size="9.5" font-weight="700" fill="${PALETTE.tealDark}">左 2 栏稳定行长</text>

      <rect x="${px + mw + 4}" y="${py + rh + 4}" width="${mw - 8}" height="${rh - 8}" fill="rgba(246,243,238,0.92)"/>
      <circle cx="${px + mw + 38}" cy="${py + rh + 46}" r="20" fill="none" stroke="${PALETTE.tealMain}" stroke-width="7"/>
      <text x="${px + mw + 70}" y="${py + rh + 52}" font-size="19" font-weight="800" fill="${PALETTE.ink}">72%</text>
      <text x="${px + mw + 16}" y="${py + rh + 86}" font-size="9.5" fill="${PALETTE.violetDark}" font-weight="700">模块 2 · 数据环</text>

      <rect x="${px + mw * 2 + 4}" y="${py + rh + 4}" width="${mw - 8}" height="${rh - 8}" fill="rgba(246,243,238,0.92)"/>
      <circle cx="${px + mw * 2 + 34}" cy="${py + rh + 34}" r="11" fill="${PALETTE.goldMain}"/>
      <circle cx="${px + mw * 2 + 64}" cy="${py + rh + 44}" r="13" fill="${PALETTE.goldMain}"/>
      <circle cx="${px + mw * 2 + 42}" cy="${py + rh + 66}" r="9" fill="${PALETTE.goldMain}"/>
      <text x="${px + mw * 2 + 88}" y="${py + rh + 52}" font-size="11" font-weight="700" fill="${PALETTE.ink}">PATTERN</text>

      <rect x="${px + 4}" y="${py + rh * 2 + 4}" width="${mw * 2 - 8}" height="${rh - 8}" fill="#44346A"/>
      <text x="${px + 16}" y="${py + rh * 2 + 56}" font-size="13" font-weight="700" fill="#F3EFFA">RHYTHM · 跨 2 模块紫湖长图</text>

      <rect x="${px + mw * 2 + 4}" y="${py + rh * 2 + 4}" width="${mw - 8}" height="${rh - 8}" fill="#0A6665"/>
      <text x="${px + mw * 2 + 16}" y="${py + rh * 2 + 56}" font-size="12" font-weight="700" fill="#F2F7F6">GROWTH · 1 模块</text>
    `;
  }

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${MODE_DATA[mode].label}版面示意">
    <rect x="0" y="0" width="${W}" height="${H}" fill="${PALETTE.creamPaper}"/>
    <rect x="${px}" y="${py}" width="${fw}" height="${fh}" fill="none" stroke="#8C8798" stroke-width="1"/>
    ${blocks}
    ${gridLines}
  </svg>`;
}

export function initSection01() {
  const btns = [...document.querySelectorAll("[data-s1-mode]")];
  const stage = document.getElementById("s1Stage");
  const badge = document.getElementById("s1Badge");
  const verdict = document.getElementById("s1Verdict");
  const detail = document.getElementById("s1Detail");
  if (!stage) return;

  function apply(mode) {
    btns.forEach((b) => {
      const on = b.dataset.s1Mode === mode;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    const d = MODE_DATA[mode];
    stage.innerHTML = renderModeSvg(mode);
    badge.textContent = d.badge;
    badge.className = "pill-tag " + (mode === "compound" ? "is-ok" : "is-err");
    verdict.textContent = d.verdict;
    detail.textContent = d.detail;
  }

  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.s1Mode)));
  apply("manuscript");
}

// ======================================================
// 02 节：A×B 共约密码矩阵 + Karl Gerstner 58 单元标尺
// ======================================================
export function initSection02() {
  const aBtns = [...document.querySelectorAll("[data-div-a]")];
  const bBtns = [...document.querySelectorAll("[data-div-b]")];
  const barSvg = document.getElementById("s2OverlapSvg");
  const readout = document.getElementById("s2Readout");
  const cssOut = document.getElementById("s2Css");
  const gBtns = [...document.querySelectorAll("[data-gerstner]")];
  const gSvg = document.getElementById("s2GerstnerSvg");
  const gNote = document.getElementById("s2GerstnerNote");

  let aVal = 6;
  let bVal = 3;
  const activeG = new Set([2, 3, 6]);

  function renderDivisor() {
    aBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.divA) === aVal));
    bBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.divB) === bVal));

    const g = gcd(aVal, bVal);
    const L = lcm(aVal, bVal);
    const shared = g - 1;
    const nests = aVal % bVal === 0 || bVal % aVal === 0;
    const isSame = aVal === bVal;

    // 算出内部所有纵线找最窄碎缝
    const lines = [];
    for (let i = 1; i < aVal; i++) lines.push({ x: i / aVal, k: "a" });
    for (let j = 1; j < bVal; j++) lines.push({ x: j / bVal, k: "b" });
    lines.sort((p, q) => p.x - q.x);
    let minSliver = 1;
    const slivers = [];
    for (let i = 0; i < lines.length - 1; i++) {
      const gap = lines[i + 1].x - lines[i].x;
      if (lines[i].k !== lines[i + 1].k && gap > 0.004) {
        if (gap < minSliver) minSliver = gap;
        if (gap < 0.09) slivers.push([lines[i].x, lines[i + 1].x]);
      }
    }

    const W = 600, H = 152, px = 20, fw = W - px * 2;
    let parts = `<rect x="${px}" y="18" width="${fw}" height="106" fill="${PALETTE.creamPaper}" stroke="#8C8798"/>`;

    // 上半条：A 轨（孔雀青）
    for (let i = 0; i < aVal; i++) {
      const x = px + (fw * i) / aVal;
      const w = fw / aVal;
      parts += `<rect x="${x + 2}" y="24" width="${w - 4}" height="38" fill="rgba(10, 102, 101, 0.16)" stroke="${PALETTE.tealMain}" stroke-width="1"/>`;
      parts += `<text x="${x + w / 2}" y="47" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.tealDark}">A${i + 1}</text>`;
    }
    // 下半条：B 轨（薰衣草紫）
    for (let j = 0; j < bVal; j++) {
      const x = px + (fw * j) / bVal;
      const w = fw / bVal;
      parts += `<rect x="${x + 2}" y="78" width="${w - 4}" height="38" fill="rgba(97, 78, 173, 0.16)" stroke="${PALETTE.violetMain}" stroke-width="1"/>`;
      parts += `<text x="${x + w / 2}" y="101" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.violetDark}">B${j + 1}</text>`;
    }
    // 碎缝高亮
    for (const [x0, x1] of slivers) {
      parts += `<rect x="${px + x0 * fw}" y="18" width="${(x1 - x0) * fw}" height="106" fill="rgba(182, 39, 56, 0.22)"/>`;
    }
    // 共轨高亮菱形
    for (let k = 1; k < g; k++) {
      const x = px + (fw * k) / g;
      parts += `<line x1="${x}" y1="12" x2="${x}" y2="132" stroke="${PALETTE.tealDark}" stroke-width="2"/>`;
      parts += `<polygon points="${x},65 ${x + 5},70 ${x},75 ${x - 5},70" fill="${PALETTE.violetMain}"/>`;
    }
    // 底部标注
    parts += `<text x="${px}" y="144" font-size="11" fill="${PALETTE.inkMuted}" font-family="JetBrains Mono, monospace">A=${aVal} 栏 · B=${bVal} 列 · gcd=${g} · lcm=${L} · 内部共轨 ${shared} 条</text>`;
    barSvg.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="双轨共约叠加图">${parts}</svg>`;

    let status, explain;
    if (isSame) {
      status = "同构等分（未分出主从节奏）";
      explain = `${aVal} 栏叠 ${bVal} 列完全重合，没有错位碎缝，但也少了一层大栏配小格的节奏反差。`;
    } else if (nests) {
      status = "整除嵌套（推荐复合组合）";
      explain = `大数恰好是小数的 ${Math.max(aVal, bVal) / Math.min(aVal, bVal)} 倍，共有 ${shared} 条内部零偏差共轨线，0 碎缝打架。`;
    } else if (g > 1) {
      status = `半共约（中轴重合 ${shared} 线，两侧存在 ${Math.round(minSliver * 100)}% 窄缝）`;
      explain = `${aVal} 与 ${bVal} 只共享 ${shared} 条内部线，左右邻线贴得太近。若必须并用，应把 CSS 底层切到最小公倍数 ${L} 拍来统一沟槽。`;
    } else {
      status = `互质冲突（内部 0 共轨，最窄碎缝仅 ${Math.round(minSliver * 100)}% 版宽）`;
      explain = `gcd(${aVal}, ${bVal}) = 1。两套网直接叠在同一块区域会切出密碎杂缝；除非用 ${L} 拍大底网刻意做非对称韵律（如 3+4 = 12 拍），否则视觉极易打架。`;
    }
    readout.innerHTML = `<strong>${status}</strong><span>${explain}</span>`;

    // 生成真实分数轨道（基于 lcm）
    const pts = new Set([0, L]);
    for (let i = 1; i < aVal; i++) pts.add((L * i) / aVal);
    for (let j = 1; j < bVal; j++) pts.add((L * j) / bVal);
    const sorted = [...pts].sort((m, n) => m - n);
    const frs = [];
    for (let i = 0; i < sorted.length - 1; i++) frs.push(`${sorted[i + 1] - sorted[i]}fr`);
    cssOut.textContent = `grid-template-columns: ${frs.join(" ")}; /* 总计 ${L} 拍 */`;
  }

  function renderGerstner() {
    gBtns.forEach((b) => {
      const n = Number(b.dataset.gerstner);
      const on = activeG.has(n);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const selected = [...activeG].sort((a, b) => a - b);
    const W = 640, px = 42, fw = W - px - 18, rowH = 24, topY = 26;
    const H = topY + Math.max(1, selected.length) * (rowH + 8) + 26;
    const uW = fw / 58;

    let svg = `<rect x="${px}" y="6" width="${fw}" height="${H - 26}" fill="${PALETTE.creamLight}" stroke="${PALETTE.lilacLine}"/>`;
    // 58 细刻度竖线
    for (let u = 0; u <= 58; u++) {
      const x = px + u * uW;
      const major = u % 10 === 0 || u === 58;
      svg += `<line x1="${x}" y1="6" x2="${x}" y2="${H - 20}" stroke="${major ? "rgba(18,77,79,0.28)" : "rgba(140,135,152,0.16)"}" stroke-width="${major ? 1 : 0.6}"/>`;
      if (major) {
        svg += `<text x="${x}" y="${H - 6}" text-anchor="middle" font-size="10" font-family="JetBrains Mono, monospace" fill="${PALETTE.inkMuted}">${u}</text>`;
      }
    }

    const rowColors = {
      1: PALETTE.inkMuted,
      2: PALETTE.tealDark,
      3: PALETTE.violetMain,
      4: PALETTE.tealBright,
      5: PALETTE.goldInk,
      6: PALETTE.violetDark,
    };

    selected.forEach((n, idx) => {
      const y = topY + idx * (rowH + 8);
      const colUnits = 60 / n - 2; // Gerstner 公式：N * (col + 2) - 2 = 58
      svg += `<text x="${px - 8}" y="${y + 16}" text-anchor="end" font-size="11" font-weight="700" font-family="JetBrains Mono, monospace" fill="${rowColors[n]}">${n}栏</text>`;
      let cur = 0;
      for (let c = 0; c < n; c++) {
        const bx = px + cur * uW;
        const bw = colUnits * uW;
        svg += `<rect x="${bx}" y="${y}" width="${bw}" height="${rowH}" fill="${rowColors[n]}" opacity="0.22" stroke="${rowColors[n]}" stroke-width="1"/>`;
        svg += `<text x="${bx + bw / 2}" y="${y + 16}" text-anchor="middle" font-size="10.5" font-weight="700" font-family="JetBrains Mono, monospace" fill="${rowColors[n]}">${colUnits}u</text>`;
        cur += colUnits;
        if (c < n - 1) {
          const gx = px + cur * uW;
          svg += `<rect x="${gx}" y="${y + 2}" width="${2 * uW}" height="${rowH - 4}" fill="rgba(182, 39, 56, 0.14)"/>`;
          cur += 2;
        }
      }
    });

    gSvg.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Karl Gerstner 58 单元多栏叠加标尺">${svg}</svg>`;
    const formulas = selected.map((n) => `${n}栏 = ${n}×${60 / n - 2}u + ${n - 1}×2u沟 = 58u`);
    gNote.textContent = formulas.length
      ? `实算验证：${formulas.join(" ｜ ")}（栏沟恒定 2 单元，零小数误差）`
      : "点选上方任意栏数，查看它在 58 单元里如何精确整除。";
  }

  aBtns.forEach((b) => b.addEventListener("click", () => { aVal = Number(b.dataset.divA); renderDivisor(); }));
  bBtns.forEach((b) => b.addEventListener("click", () => { bVal = Number(b.dataset.divB); renderDivisor(); }));
  gBtns.forEach((b) => b.addEventListener("click", () => {
    const n = Number(b.dataset.gerstner);
    if (activeG.has(n) && activeG.size > 1) activeG.delete(n);
    else activeG.add(n);
    renderGerstner();
  }));

  renderDivisor();
  renderGerstner();
}

// ======================================================
// 03 节：深紫靛暗室 · 三张原海报版面五层印刷菲林剥离器
// ======================================================
const BLUEPRINTS = {
  mag: {
    id: "mag",
    num: "01",
    title: "杂志专题页 · 城市与水",
    posterQuote: "左侧栏栅承载长文，右侧模块展示数据与图像，形成阅读主线与信息补充的协同。",
    primary: "左 2 栏（6 栏主轨）承载标题与连续正文",
    secondary: "底沿 3×1 模块格精准并排降雨 / 河流 / 湿地指标",
    baseline: "左栏导语末行与底部数据注释共踩同一横基线",
  },
  report: {
    id: "report",
    num: "02",
    title: "数据报告页 · 年度增长概览",
    posterQuote: "栏栅组织信息层级，模块容纳图表与指标，确保比较清晰、重点突出。",
    primary: "左 4 栏主区稳托 2021–2024 四年递增柱状图",
    secondary: "右 2 栏切成 1×3 等高紫雾模块叠排 +34% / 58% / 4.2x",
    baseline: "柱图水平刻度线与右侧三枚指标卡底沿同步对齐",
  },
  poster: {
    id: "poster",
    num: "03",
    title: "活动海报 · 未来设计周",
    posterQuote: "标题依栏栅强化气势，右侧模块呈现视觉与要点，营造秩序感与吸引力。",
    primary: "左 2 栏纵排超粗黑「未来 / 设计 / 周」强化视觉重心",
    secondary: "右下 3×1 模块收束「论坛 20+ / 工作坊 18+ / 展览 30+」",
    baseline: "日期地点「05.24–05.28」与三枚图标卡底沿水平咬合",
  },
};

export function initSection03() {
  const tabs = [...document.querySelectorAll("[data-bp-id]")];
  const layers = [...document.querySelectorAll("[data-bp-layer]")];
  const svgHost = document.getElementById("s3BlueprintSvg");
  const quoteEl = document.getElementById("s3Quote");
  const specList = document.getElementById("s3SpecList");
  if (!svgHost) return;

  let cur = "mag";
  const vis = { margin: true, columns: true, modules: true, baseline: true, content: true };

  function draw() {
    tabs.forEach((t) => {
      const on = t.dataset.bpId === cur;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    layers.forEach((l) => {
      const on = vis[l.dataset.bpLayer];
      l.classList.toggle("is-active", on);
      l.setAttribute("aria-pressed", String(on));
    });

    const bp = BLUEPRINTS[cur];
    quoteEl.textContent = `原海报原话：「${bp.posterQuote}」`;
    specList.innerHTML = `
      <div><dt>主结构 · 栏栅</dt><dd>${bp.primary}</dd></div>
      <div><dt>次结构 · 模块</dt><dd>${bp.secondary}</dd></div>
      <div><dt>统一节拍 · 基线</dt><dd>${bp.baseline}</dd></div>
    `;

    const W = 520, H = 370, mx = 32, my = 28, fw = W - mx * 2, fh = H - my * 2;
    let out = `<rect x="0" y="0" width="${W}" height="${H}" fill="#211B3B"/>`;
    out += `<rect x="12" y="10" width="${W - 24}" height="${H - 20}" fill="#EAE5DC"/>`;

    // 层 5：成品内容
    if (vis.content) {
      if (cur === "mag") {
        const cw = fw / 6, mw = fw / 3;
        out += `
          <text x="${mx + 8}" y="${my + 52}" font-size="22" font-weight="900" fill="${PALETTE.tealDark}">城市与水</text>
          <text x="${mx + 8}" y="${my + 72}" font-size="10.5" font-weight="700" fill="${PALETTE.tealMain}" font-family="Sora, sans-serif">WATER &amp; CITY</text>
          <g fill="${PALETTE.inkBody}" opacity="0.72">
            <rect x="${mx + 8}" y="${my + 96}" width="${cw * 2 - 20}" height="7"/>
            <rect x="${mx + 8}" y="${my + 114}" width="${cw * 2 - 28}" height="7"/>
            <rect x="${mx + 8}" y="${my + 132}" width="${cw * 2 - 18}" height="7"/>
            <rect x="${mx + 8}" y="${my + 150}" width="${cw * 2 - 44}" height="7"/>
          </g>
          <rect x="${mx + cw * 2 + 8}" y="${my + 10}" width="${cw * 4 - 14}" height="${fh * 0.68}" fill="#0E555A"/>
          <rect x="${mx + cw * 2 + 24}" y="${my + 78}" width="26" height="96" fill="#073236"/>
          <rect x="${mx + cw * 2 + 60}" y="${my + 48}" width="32" height="126" fill="#073236"/>
          <rect x="${mx + cw * 2 + 104}" y="${my + 90}" width="28" height="84" fill="#073236"/>
          <rect x="${mx + cw * 2 + 146}" y="${my + 62}" width="38" height="112" fill="#073236"/>
          <rect x="${mx + cw * 2 + 8}" y="${my + 174}" width="${cw * 4 - 14}" height="${fh * 0.68 - 164}" fill="#1E7B7E" opacity="0.55"/>
          ${[["降雨", "68mm"], ["河流", "12km"], ["湿地", "23%"]].map(([k, v], i) => `
            <rect x="${mx + mw * i + 4}" y="${my + fh * 0.74}" width="${mw - 8}" height="${fh * 0.24}" fill="#F6F3EE"/>
            <circle cx="${mx + mw * i + 26}" cy="${my + fh * 0.86}" r="12" fill="${i === 2 ? PALETTE.violetMain : PALETTE.tealMain}"/>
            <text x="${mx + mw * i + 48}" y="${my + fh * 0.85}" font-size="14" font-weight="800" fill="${PALETTE.ink}" font-family="Sora, sans-serif">${v}</text>
            <text x="${mx + mw * i + 48}" y="${my + fh * 0.93}" font-size="10.5" fill="${PALETTE.inkMuted}">${k}</text>
          `).join("")}
        `;
      } else if (cur === "report") {
        const cw = fw / 6, mw = fw / 3;
        out += `
          <text x="${mx + 8}" y="${my + 36}" font-size="20" font-weight="900" fill="${PALETTE.ink}">年度增长概览</text>
          <text x="${mx + 8}" y="${my + 55}" font-size="11" fill="${PALETTE.inkMuted}" font-family="JetBrains Mono, monospace">2021 — 2024</text>
          ${[[23, "2021"], [37, "2022"], [54, "2023"], [79, "2024"]].map(([v, yr], i) => {
            const bx = mx + 24 + i * 64;
            const bh = (v / 85) * 188;
            const by = my + fh - 34 - bh;
            return `
              <rect x="${bx}" y="${by}" width="32" height="${bh}" fill="${PALETTE.violetMid}"/>
              <text x="${bx + 16}" y="${by - 6}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.ink}">${v}</text>
              <text x="${bx + 16}" y="${my + fh - 14}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.inkMuted}">${yr}</text>
            `;
          }).join("")}
          ${[["+34%", "同比增长", "#C9C3E3"], ["58%", "来源占比", "#F6F3EE"], ["4.2x", "效率提升", "#C9C3E3"]].map(([v, sub, bg], i) => {
            const cy = my + 8 + i * ((fh - 28) / 3 + 8);
            const ch = (fh - 28) / 3;
            return `
              <rect x="${mx + cw * 4 + 8}" y="${cy}" width="${mw - 10}" height="${ch}" fill="${bg}"/>
              <text x="${mx + cw * 4 + 8 + (mw - 10) / 2}" y="${cy + ch * 0.52}" text-anchor="middle" font-size="22" font-weight="800" fill="${PALETTE.ink}" font-family="Sora, sans-serif">${v}</text>
              <text x="${mx + cw * 4 + 8 + (mw - 10) / 2}" y="${cy + ch * 0.78}" text-anchor="middle" font-size="11" fill="${PALETTE.inkMuted}">${sub}</text>
            `;
          }).join("")}
        `;
      } else {
        const cw = fw / 6, mw = fw / 3;
        out += `
          <text x="${mx + 8}" y="${my + 44}" font-size="28" font-weight="900" fill="${PALETTE.ink}">未来</text>
          <text x="${mx + 8}" y="${my + 78}" font-size="28" font-weight="900" fill="${PALETTE.ink}">设计</text>
          <text x="${mx + 8}" y="${my + 112}" font-size="28" font-weight="900" fill="${PALETTE.ink}">周</text>
          <text x="${mx + 8}" y="${my + 138}" font-size="10.5" font-weight="700" fill="${PALETTE.violetDark}" font-family="Sora, sans-serif">FUTURE DESIGN WEEK</text>
          <text x="${mx + 8}" y="${my + fh - 38}" font-size="11.5" font-weight="700" fill="${PALETTE.ink}" font-family="JetBrains Mono, monospace">05.24 — 05.28</text>
          <text x="${mx + 8}" y="${my + fh - 18}" font-size="10.5" fill="${PALETTE.inkMuted}">上海 · 西岸艺术中心</text>

          <rect x="${mx + cw * 2 + 8}" y="${my + 8}" width="${cw * 4 - 12}" height="${fh * 0.68}" fill="#146A68"/>
          <circle cx="${mx + cw * 3.6}" cy="${my + 102}" r="48" fill="#89BCBC"/>
          <polygon points="${mx + cw * 4.4},${my + 42} ${mx + cw * 5.8},${my + 195} ${mx + cw * 3.9},${my + 195}" fill="#09484B"/>
          ${[["论坛", "20+"], ["工作坊", "18+"], ["展览", "30+"]].map(([k, v], i) => {
            const bx = mx + cw * 2 + 8 + i * ((cw * 4 - 24) / 3 + 6);
            const bw = (cw * 4 - 24) / 3;
            return `
              <rect x="${bx}" y="${my + fh * 0.74}" width="${bw}" height="${fh * 0.24}" fill="#F6F3EE"/>
              <text x="${bx + bw / 2}" y="${my + fh * 0.85}" text-anchor="middle" font-size="14" font-weight="800" fill="${PALETTE.violetDark}" font-family="Sora, sans-serif">${v}</text>
              <text x="${bx + bw / 2}" y="${my + fh * 0.94}" text-anchor="middle" font-size="10.5" fill="${PALETTE.inkMuted}">${k}</text>
            `;
          }).join("")}
        `;
      }
    }

    // 层 4：基线横轨
    if (vis.baseline) {
      for (let r = 0; r <= 14; r++) {
        const by = my + (fh * r) / 14;
        out += `<line x1="${mx}" y1="${by}" x2="${mx + fw}" y2="${by}" stroke="#A67E32" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.58"/>`;
      }
    }
    // 层 2：6 栏主栏栅
    if (vis.columns) {
      for (let c = 1; c < 6; c++) {
        const cx = mx + (fw * c) / 6;
        out += `<line x1="${cx}" y1="${my}" x2="${cx}" y2="${my + fh}" stroke="#0A7573" stroke-width="1.2" stroke-dasharray="4 3"/>`;
      }
    }
    // 层 3：次模块轨
    if (vis.modules) {
      for (let m = 1; m < 3; m++) {
        const gx = mx + (fw * m) / 3;
        out += `<line x1="${gx}" y1="${my}" x2="${gx}" y2="${my + fh}" stroke="${PALETTE.violetMain}" stroke-width="1.8"/>`;
      }
      for (let r = 1; r < 4; r++) {
        const gy = my + (fh * r) / 4;
        out += `<line x1="${mx}" y1="${gy}" x2="${mx + fw}" y2="${gy}" stroke="${PALETTE.violetMain}" stroke-width="1.2" stroke-dasharray="6 4"/>`;
      }
    }
    // 层 1：外边距框
    if (vis.margin) {
      out += `<rect x="${mx}" y="${my}" width="${fw}" height="${fh}" fill="none" stroke="#18132A" stroke-width="1.8"/>`;
    }

    svgHost.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${bp.title}菲林透视图">${out}</svg>`;
  }

  tabs.forEach((t) => t.addEventListener("click", () => { cur = t.dataset.bpId; draw(); }));
  layers.forEach((l) => l.addEventListener("click", () => {
    const k = l.dataset.bpLayer;
    vis[k] = !vis[k];
    draw();
  }));
  draw();
}

// ======================================================
// 04 节：从瑞士杂志到 CSS — 四代编年标本展柜
// ======================================================
const ERAS = {
  1962: {
    year: "1962–1964",
    person: "Karl Gerstner（与 Felix Berman）",
    work: "德国《Capital》杂志 &《Designing Programmes》（Arthur Niggli，1964）",
    summary: "将 58 单元基准与恒定 2 单元栏沟结合，让 1、2、3、4、5、6 栏在同一页幅中自由重叠，1973 年 MoMA 为其举办专题展《Designing Programs/Programming Designs》。",
    svg: () => `
      <svg viewBox="0 0 360 220" role="img" aria-label="1962 Karl Gerstner 58 单元多栏重叠图">
        <rect width="360" height="220" fill="${PALETTE.creamPaper}"/>
        <rect x="24" y="20" width="312" height="168" fill="#F6F3EE" stroke="#8C8798"/>
        ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${28 + i * 51}" y="28" width="46" height="44" fill="rgba(10,102,101,0.2)" stroke="${PALETTE.tealMain}"/>`).join("")}
        ${[0, 1, 2, 3].map((i) => `<rect x="${28 + i * 76.5}" y="82" width="71" height="44" fill="rgba(97,78,173,0.22)" stroke="${PALETTE.violetMain}"/>`).join("")}
        ${[0, 1, 2].map((i) => `<rect x="${28 + i * 102}" y="136" width="97" height="44" fill="rgba(210,179,126,0.34)" stroke="${PALETTE.goldInk}"/>`).join("")}
        <text x="24" y="206" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.inkMuted}">58 UNITS · 6/4/3 COLS · GUTTER = 2U</text>
      </svg>`,
  },
  1981: {
    year: "1981",
    person: "Josef Müller-Brockmann",
    work: "《Grid Systems in Graphic Design》（Niggli Verlag，德英双语首版）",
    summary: "把瑞士网格推向工业级手册：用 8 至 32 个网格场域（grid fields）与行距/字号的严格整数倍换算，确立「栏栅定横向、基线与场域定纵向」的复合骨架。",
    svg: () => `
      <svg viewBox="0 0 360 220" role="img" aria-label="1981 Müller-Brockmann 网格场域图">
        <rect width="360" height="220" fill="${PALETTE.creamPaper}"/>
        <rect x="24" y="20" width="312" height="168" fill="#F6F3EE" stroke="#8C8798"/>
        ${[0, 1, 2, 3].map((c) => [0, 1, 2].map((r) => `<rect x="${30 + c * 76}" y="${26 + r * 53}" width="68" height="45" fill="${(c + r) % 3 === 0 ? "rgba(10,102,101,0.24)" : "rgba(140,135,152,0.12)"}" stroke="${PALETTE.tealDark}"/>`).join("")).join("")}
        <rect x="30" y="26" width="144" height="98" fill="rgba(97,78,173,0.26)" stroke="${PALETTE.violetDark}" stroke-width="1.6"/>
        <text x="24" y="206" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.inkMuted}">12 GRID FIELDS · RATIO &amp; LEADING LOCK</text>
      </svg>`,
  },
  2002: {
    year: "2002",
    person: "Timothy Samara",
    work: "《Making and Breaking the Grid》（Rockport Publishers）",
    summary: "将「复合网格（Compound Grid）」正式单列并归类为共外框重叠、异外框叠加与跨页分区并置，使编辑与书籍设计在复杂内容中仍保有可复用秩序。",
    svg: () => `
      <svg viewBox="0 0 360 220" role="img" aria-label="2002 Timothy Samara 共外框与分区复合图">
        <rect width="360" height="220" fill="${PALETTE.creamPaper}"/>
        <rect x="24" y="20" width="150" height="168" fill="#F6F3EE" stroke="${PALETTE.tealDark}"/>
        <rect x="186" y="20" width="150" height="168" fill="#F6F3EE" stroke="${PALETTE.violetDark}"/>
        <line x1="74" y1="20" x2="74" y2="188" stroke="${PALETTE.tealMain}" stroke-dasharray="4 3"/>
        <line x1="124" y1="20" x2="124" y2="188" stroke="${PALETTE.tealMain}" stroke-dasharray="4 3"/>
        ${[0, 1].map((c) => [0, 1, 2].map((r) => `<rect x="${194 + c * 68}" y="${28 + r * 52}" width="60" height="44" fill="rgba(97,78,173,0.18)" stroke="${PALETTE.violetMain}"/>`).join("")).join("")}
        <text x="24" y="206" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.inkMuted}">SHARED MARGINS · SPREAD ZONE PAIRING</text>
      </svg>`,
  },
  2019: {
    year: "2019–今",
    person: "Andy Clarke & W3C CSS 工作组",
    work: "Smashing Magazine《Inspired Design Decisions》与 W3C CSS Grid Level 2",
    summary: "浏览器原生 `fr` 复合轨道（如 3+4 叠加的 12 拍轨道）与 CSS `subgrid` 让子容器直接继承父级主栏线，彻底告别早期网页千篇一律的 12 等分静态模板。",
    svg: () => `
      <svg viewBox="0 0 360 220" role="img" aria-label="CSS Grid 与 Subgrid 复合轨道图">
        <rect width="360" height="220" fill="${PALETTE.creamPaper}"/>
        <rect x="24" y="20" width="312" height="168" fill="#F6F3EE" stroke="#8C8798"/>
        ${[[0, 2], [2, 1], [3, 1], [4, 2], [6, 2], [8, 1], [9, 1], [10, 2]].map(([s, span], i) => {
          const x = 24 + (312 * s) / 12;
          const w = (312 * span) / 12;
          return `<rect x="${x + 1}" y="26" width="${w - 2}" height="156" fill="${i % 2 ? "rgba(97,78,173,0.16)" : "rgba(10,102,101,0.16)"}" stroke="${i % 2 ? PALETTE.violetMain : PALETTE.tealMain}" stroke-dasharray="3 2"/>`;
        }).join("")}
        <rect x="24" y="110" width="312" height="72" fill="rgba(18,77,79,0.14)" stroke="${PALETTE.tealDark}" stroke-width="1.6"/>
        <text x="34" y="148" font-size="11" font-weight="700" font-family="JetBrains Mono, monospace" fill="${PALETTE.tealDark}">grid-template-columns: subgrid;</text>
        <text x="24" y="206" font-size="11" font-family="JetBrains Mono, monospace" fill="${PALETTE.inkMuted}">3+4 = 12 TRACKS · CSS GRID &amp; SUBGRID</text>
      </svg>`,
  },
};

export function initSection04() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const card = document.getElementById("s4EraDetail");
  const visual = document.getElementById("s4EraVisual");
  if (!card || !visual) return;

  function show(key) {
    btns.forEach((b) => {
      const on = b.dataset.era === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const d = ERAS[key];
    card.innerHTML = `
      <p class="era-kicker">${d.year} · ${d.person}</p>
      <h3>${d.work}</h3>
      <p>${d.summary}</p>
    `;
    visual.innerHTML = d.svg();
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.era)));
  show("1962");
}

// ======================================================
// 05 节：三维项目体检判定器（该用复合 / 退回单网 / 窄屏收束）
// ======================================================
export function initSection05() {
  const checks = [...document.querySelectorAll("[data-fit-q]")];
  const verdictEl = document.getElementById("s5Verdict");
  const trackEl = document.getElementById("s5Track");
  if (!verdictEl) return;

  function update() {
    const hetero = document.getElementById("fitHetero")?.checked;
    const wide = document.getElementById("fitWide")?.checked;
    const compare = document.getElementById("fitCompare")?.checked;

    if (hetero && wide && compare) {
      verdictEl.innerHTML = `<span class="pill-tag is-ok">推荐 · 典型复合网格主场</span><p>你的版面同时拥有多类异质信息、充裕开本宽度和跨区并置对比需求。先用 6 栏或 12 栏确立主叙事区，再用公约 3×4 或 4×3 模块承接图表指标，底部统一基线即可兼顾秩序与变化。</p>`;
      trackEl.textContent = "桌面：6 栏主轨 + 3×4 次模块 + 24pt 基线";
    } else if (!hetero) {
      verdictEl.innerHTML = `<span class="pill-tag is-err">不必硬上 · 退回单一网格更省力</span><p>内容形态高度一致（全是纯长文或全是同类商品卡）时，叠加第二套网格只会增加维护成本而没有信息收益。纯长文用 194 手稿网格，均质卡片墙用 196 模块化网格就够利落。</p>`;
      trackEl.textContent = "建议：单栏手稿或单一均匀模块网";
    } else if (!wide) {
      verdictEl.innerHTML = `<span class="pill-tag is-warn">窄屏收束 · 仅保留纵向模块与基线</span><p>物理宽度偏窄（如 390px 手机竖屏）时，横排两套栏轨会把字行和卡片挤成牙签。在宽屏启用复合网格，到了窄屏按响应式规则自动折叠为单列流 + 统一基线，才是成熟做法。</p>`;
      trackEl.textContent = "宽屏：6 栏 + 3 模块 → 窄屏：1 栏流 + 2 格指标条";
    } else {
      verdictEl.innerHTML = `<span class="pill-tag is-ok">轻量复合 · 分区并置即可</span><p>需要区分内容类型但不需要密集同屏对照，可以用「上跨栏大视觉 + 下多列模块」的纵向分区复合法，省去全屏重度透叠。</p>`;
      trackEl.textContent = "上区：全宽主视觉 ｜ 下区：左 2 栏文 + 右 3 格模块";
    }
  }

  checks.forEach((c) => c.addEventListener("change", update));
  update();
}

// ======================================================
// 06 节：小练习（A/B/C/D 中性标签，只差网格协作这一个变量）
// ======================================================
const QUIZ_ITEMS = [
  {
    id: "A",
    title: "方案甲",
    correct: false,
    reason: "单一 4 栏均分强行接管所有元素：长文、大图与 3 项指标被套进同一套 4 等分格里，3 项指标塞进 4 栏后右下角多出一块孤立空坑，版面失衡。",
  },
  {
    id: "B",
    title: "方案乙",
    correct: false,
    reason: "主轨用 5 栏、次模块用 4 列——5 与 4 互质（gcd=1），内部没有任何一条纵线重合。中段大图左沿与下方数据卡边缘差出窄碎缝，扫视时像没对齐的印刷错位。",
  },
  {
    id: "C",
    title: "方案丙",
    correct: true,
    reason: "正确！6 栏主轨叠加 3×4 次模块，每 1 个模块精确跨 2 栏，共有 2 条内部零偏差共轨线；左 2 栏稳排主标与长评，右 4 栏大图与底沿 3 枚等宽指标严丝合缝，文字同落 24pt 基线。",
  },
  {
    id: "D",
    title: "方案丁",
    correct: false,
    reason: "极具迷惑性的一例：虽然主栏是 6 栏、右侧是 3 枚指标，但右侧模块另起了独立内缩外边距且行距与左栏基线脱钩，导致左右看起来像两张硬拼在一起的独立页面。",
  },
];

function drawQuizThumb(id, revealed) {
  const W = 280, H = 190, mx = 16, my = 14, fw = W - mx * 2, fh = H - my * 2;
  const kpi = ["+34%", "58%", "4.2x"];
  const textLines = (x, y, w, h, gapY = 10) => {
    let s = "";
    for (let i = 0; i < 4 && y + i * gapY + 4 < y + h; i++) {
      const lw = w * (i === 3 ? 0.62 : i === 1 ? 0.88 : 0.96);
      s += `<rect x="${x}" y="${y + i * gapY}" width="${lw}" height="4.5" fill="${PALETTE.inkBody}" opacity="0.34"/>`;
    }
    return s;
  };
  let content = "";
  let overlay = "";

  if (id === "A") {
    const cw = fw / 4;
    content = `
      <text x="${mx + 4}" y="${my + 24}" font-size="13" font-weight="900" fill="${PALETTE.ink}">生态年报</text>
      ${textLines(mx + 4, my + 36, cw - 8, 52, 11)}
      <rect x="${mx + cw + 4}" y="${my + 8}" width="${cw * 3 - 8}" height="80" fill="${PALETTE.tealMain}"/>
      <circle cx="${mx + cw * 2.5}" cy="${my + 48}" r="18" fill="#6AA8A6" opacity="0.5"/>
      ${[0, 1, 2].map((i) => `
        <rect x="${mx + cw * i + 4}" y="${my + 100}" width="${cw - 8}" height="52" fill="#C9C3E3"/>
        <text x="${mx + cw * i + cw / 2}" y="${my + 129}" text-anchor="middle" font-size="11.5" font-weight="800" font-family="Sora, sans-serif" fill="${PALETTE.ink}">${kpi[i]}</text>
        <rect x="${mx + cw * i + 12}" y="${my + 138}" width="${cw - 24}" height="3.5" fill="${PALETTE.inkMuted}" opacity="0.45"/>
      `).join("")}
      <rect x="${mx + cw * 3 + 4}" y="${my + 100}" width="${cw - 8}" height="52" fill="none" stroke="#B6B1C4" stroke-dasharray="3 3"/>
    `;
    if (revealed) {
      for (let i = 1; i < 4; i++) overlay += `<line x1="${mx + cw * i}" y1="${my}" x2="${mx + cw * i}" y2="${my + fh}" stroke="${PALETTE.tealMain}" stroke-dasharray="3 2"/>`;
      overlay += `<rect x="${mx + cw * 3 + 4}" y="${my + 100}" width="${cw - 8}" height="52" fill="rgba(182,39,56,0.22)" stroke="${PALETTE.errLight}" stroke-width="1.5"/>`;
      overlay += `<text x="${mx + cw * 3.5}" y="${my + 130}" text-anchor="middle" font-size="10" font-weight="700" fill="${PALETTE.errLight}">3塞4空坑</text>`;
    }
  } else if (id === "B") {
    const c5 = fw / 5, m4 = fw / 4;
    content = `
      <text x="${mx + 4}" y="${my + 24}" font-size="13" font-weight="900" fill="${PALETTE.ink}">生态年报</text>
      ${textLines(mx + 4, my + 36, c5 * 2 - 10, 52, 11)}
      <rect x="${mx + c5 * 2 + 4}" y="${my + 8}" width="${c5 * 3 - 8}" height="80" fill="${PALETTE.tealMain}"/>
      <circle cx="${mx + c5 * 3.5}" cy="${my + 48}" r="18" fill="#6AA8A6" opacity="0.5"/>
      ${[0, 1, 2].map((i) => {
        const bx = mx + m4 * (i + 1) - m4 * 0.12;
        const bw = m4 - 8;
        return `
          <rect x="${bx}" y="${my + 100}" width="${bw}" height="52" fill="#C9C3E3"/>
          <text x="${bx + bw / 2}" y="${my + 129}" text-anchor="middle" font-size="11.5" font-weight="800" font-family="Sora, sans-serif" fill="${PALETTE.ink}">${kpi[i]}</text>
          <rect x="${bx + 10}" y="${my + 138}" width="${bw - 20}" height="3.5" fill="${PALETTE.inkMuted}" opacity="0.45"/>
        `;
      }).join("")}
    `;
    if (revealed) {
      for (let i = 1; i < 5; i++) overlay += `<line x1="${mx + c5 * i}" y1="${my}" x2="${mx + c5 * i}" y2="${my + fh}" stroke="${PALETTE.tealMain}" stroke-dasharray="3 2"/>`;
      for (let j = 1; j < 4; j++) overlay += `<line x1="${mx + m4 * j}" y1="${my}" x2="${mx + m4 * j}" y2="${my + fh}" stroke="${PALETTE.violetMain}" stroke-dasharray="4 3"/>`;
      overlay += `<rect x="${mx + c5 * 2}" y="${my}" width="${m4 * 2 - c5 * 2}" height="${fh}" fill="rgba(182,39,56,0.26)"/>`;
      overlay += `<text x="${mx + fw * 0.5}" y="${my + 96}" text-anchor="middle" font-size="10" font-weight="700" fill="${PALETTE.errLight}">5栏×4列互质碎缝</text>`;
    }
  } else if (id === "C") {
    const c6 = fw / 6, m3 = fw / 3;
    content = `
      <text x="${mx + 4}" y="${my + 24}" font-size="13" font-weight="900" fill="${PALETTE.ink}">生态年报</text>
      ${textLines(mx + 4, my + 36, c6 * 2 - 10, 52, 11)}
      <rect x="${mx + c6 * 2 + 4}" y="${my + 8}" width="${c6 * 4 - 8}" height="80" fill="${PALETTE.tealMain}"/>
      <circle cx="${mx + c6 * 4}" cy="${my + 48}" r="18" fill="#6AA8A6" opacity="0.5"/>
      ${[0, 1, 2].map((i) => {
        const bx = mx + m3 * i + 4;
        const bw = m3 - 8;
        return `
          <rect x="${bx}" y="${my + 100}" width="${bw}" height="52" fill="#C9C3E3"/>
          <text x="${bx + bw / 2}" y="${my + 129}" text-anchor="middle" font-size="11.5" font-weight="800" font-family="Sora, sans-serif" fill="${PALETTE.ink}">${kpi[i]}</text>
          <rect x="${bx + 14}" y="${my + 138}" width="${bw - 28}" height="3.5" fill="${PALETTE.inkMuted}" opacity="0.45"/>
        `;
      }).join("")}
    `;
    if (revealed) {
      for (let i = 1; i < 6; i++) {
        const sh = i % 2 === 0;
        overlay += `<line x1="${mx + c6 * i}" y1="${my}" x2="${mx + c6 * i}" y2="${my + fh}" stroke="${sh ? PALETTE.okLight : PALETTE.tealSoft}" stroke-width="${sh ? 1.8 : 0.9}" stroke-dasharray="${sh ? "none" : "3 2"}"/>`;
      }
      overlay += `<line x1="${mx}" y1="${my + 88}" x2="${mx + fw}" y2="${my + 88}" stroke="${PALETTE.goldInk}" stroke-width="1.2" stroke-dasharray="3 2"/>`;
      overlay += `<text x="${mx + fw * 0.5}" y="${my + 96}" text-anchor="middle" font-size="10" font-weight="700" fill="${PALETTE.okLight}">6栏+3模块共轨齐平</text>`;
    }
  } else {
    const c6 = fw / 6;
    content = `
      <text x="${mx + 4}" y="${my + 22}" font-size="13" font-weight="900" fill="${PALETTE.ink}">生态年报</text>
      ${textLines(mx + 4, my + 34, c6 * 2 - 10, 62, 13.5)}
      <rect x="${mx + c6 * 2 + 18}" y="${my + 18}" width="${c6 * 4 - 28}" height="74" fill="${PALETTE.tealMain}"/>
      <circle cx="${mx + c6 * 4 + 4}" cy="${my + 55}" r="17" fill="#6AA8A6" opacity="0.5"/>
      ${[0, 1, 2].map((i) => {
        const bx = mx + 14 + i * 74;
        const bw = 66;
        return `
          <rect x="${bx}" y="${my + 112}" width="${bw}" height="44" fill="#C9C3E3"/>
          <text x="${bx + bw / 2}" y="${my + 136}" text-anchor="middle" font-size="11.5" font-weight="800" font-family="Sora, sans-serif" fill="${PALETTE.ink}">${kpi[i]}</text>
          <rect x="${bx + 12}" y="${my + 144}" width="${bw - 24}" height="3.5" fill="${PALETTE.inkMuted}" opacity="0.45"/>
        `;
      }).join("")}
    `;
    if (revealed) {
      overlay += `<rect x="${mx}" y="${my}" width="${fw}" height="${fh}" fill="none" stroke="${PALETTE.tealMain}" stroke-dasharray="3 2"/>`;
      overlay += `<rect x="${mx + 14}" y="${my + 18}" width="${fw - 24}" height="${fh - 22}" fill="none" stroke="${PALETTE.errLight}" stroke-width="1.5" stroke-dasharray="4 2"/>`;
      overlay += `<text x="${mx + fw * 0.5}" y="${my + 106}" text-anchor="middle" font-size="10" font-weight="700" fill="${PALETTE.errLight}">外框内缩+基线脱钩</text>`;
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="练习选项 ${id}">
    <rect width="${W}" height="${H}" fill="${PALETTE.creamPaper}"/>
    <rect x="${mx}" y="${my}" width="${fw}" height="${fh}" fill="#F6F3EE" stroke="#9A95AA"/>
    ${content}
    ${overlay}
  </svg>`;
}

export function initSection06() {
  const grid = document.getElementById("s6QuizGrid");
  const feedback = document.getElementById("s6Feedback");
  const resetBtn = document.getElementById("s6Reset");
  if (!grid || !feedback) return;

  let chosen = null;

  function render() {
    const revealed = chosen !== null;
    grid.innerHTML = QUIZ_ITEMS.map((item) => {
      const isPick = chosen === item.id;
      const cls = [
        "quiz-card",
        isPick ? "is-picked" : "",
        revealed && item.correct ? "is-correct" : "",
        revealed && isPick && !item.correct ? "is-wrong" : "",
      ].filter(Boolean).join(" ");
      return `
        <button type="button" class="${cls}" data-quiz-id="${item.id}" aria-pressed="${isPick}">
          <span class="quiz-head"><span class="quiz-letter">${item.id}</span><span class="quiz-name">${item.title}</span></span>
          <span class="quiz-thumb">${drawQuizThumb(item.id, revealed)}</span>
        </button>
      `;
    }).join("");

    grid.querySelectorAll("[data-quiz-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        chosen = btn.dataset.quizId;
        render();
      });
    });

    if (!revealed) {
      feedback.hidden = true;
      resetBtn.hidden = true;
    } else {
      const picked = QUIZ_ITEMS.find((x) => x.id === chosen);
      feedback.hidden = false;
      resetBtn.hidden = false;
      feedback.className = "quiz-feedback " + (picked.correct ? "is-ok" : "is-err");
      feedback.innerHTML = `
        <p class="qf-title">${picked.correct ? "判断准确 · 方案丙是真复合网格" : `选了 ${picked.id}（${picked.title}）· 再看一眼透视线`}</p>
        <p>${picked.reason}</p>
        <ul class="qf-compare">
          ${QUIZ_ITEMS.map((x) => `<li><strong>${x.id} ${x.title}：</strong>${x.reason}</li>`).join("")}
        </ul>
      `;
    }
  }

  resetBtn.addEventListener("click", () => {
    chosen = null;
    render();
  });
  render();
}

// ======================================================
// 07 节：原海报点击放大、滚轮/按钮缩放、自由拖动、Esc 退出
// ======================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("posterTrigger");
  const imgSrc = document.getElementById("poster");
  const modal = document.getElementById("posterModal");
  const modalImg = document.getElementById("posterModalImg");
  const closeBtn = document.getElementById("posterClose");
  const zoomIn = document.getElementById("posterZoomIn");
  const zoomOut = document.getElementById("posterZoomOut");
  const zoomReset = document.getElementById("posterZoomReset");
  const viewport = document.getElementById("posterViewport");
  if (!trigger || !imgSrc || !modal || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0, sy = 0, ox = 0, oy = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function openModal() {
    modalImg.src = imgSrc.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  zoomIn.addEventListener("click", () => { scale = Math.min(3.5, +(scale + 0.4).toFixed(2)); applyTransform(); });
  zoomOut.addEventListener("click", () => { scale = Math.max(0.7, +(scale - 0.4).toFixed(2)); applyTransform(); });
  zoomReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(0.7, Math.min(3.5, +(scale + delta).toFixed(2)));
    applyTransform();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = tx;
    oy = ty;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    applyTransform();
  });
  viewport.addEventListener("pointerup", () => { dragging = false; });
}
