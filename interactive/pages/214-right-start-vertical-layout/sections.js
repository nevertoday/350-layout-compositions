// 214 直排右起 · 01–07 七节独立交互模块（每节控件完全不同）
import { reducedMotion } from "../../lib/stage.js";
import { clamp } from "./model.js";

// ==================== 01 双卷视线扫视同步对比仪 ====================
const RACE_CASES = {
  poem: {
    vBadge: "节奏从容",
    vWarn: false,
    hBadge: "平铺直叙",
    hWarn: false,
    vCols: ["空山新雨后，", "天气晚来秋。", "明月松间照，", "清泉石上流。"],
    hLines: ["空山新雨后，天气晚来秋。", "明月松间照，清泉石上流。"],
    vNote: "每列恰好五言一句，顺重力往下读，从右向左渐进，诗句对仗自带落落大方的停顿感。",
    hNote: "现代读者扫得更快，但两联挤作两行，古典卷轴的呼吸与立轴节奏明显减弱。",
    verdict: "结论：纯汉字诗词与短联是直排右起的天然主场——慢半拍的纵向节律本身就是表达的一部分。",
  },
  museum: {
    vBadge: "气场立住",
    vWarn: false,
    hBadge: "便于快读",
    hWarn: false,
    vCols: ["北宋汝窑青瓷", "天青釉色温润", "器型端庄素雅", "传世稀若晨星"],
    hLines: ["北宋汝窑青瓷，天青釉色温润，", "器型端庄素雅，传世稀若晨星。"],
    vNote: "展柜立签空间高窄，直排右起顺着器物垂线落字，视线先落最右题眼再自然移向器物本身。",
    hNote: "适合多语种长段说明；但在立轴或窄幅玻璃展签上，横排会被迫折成零碎短行。",
    verdict: "结论：高窄画幅（立轴、书脊、展签、茶罐标签）用直排右起能把画面比例吃满，不浪费竖向高度。",
  },
  changelog: {
    vBadge: "频繁卡顿",
    vWarn: true,
    hBadge: "一扫到底",
    hWarn: false,
    vCols: ["版本 v2.14.8", "修复 API-403", "详见 https://", "耗时 12.4ms"],
    hLines: ["版本 v2.14.8 修复 API-403", "耗时 12.4ms，详见 https://…"],
    vNote: "英文缩写、版本号与网址全部顺时针横倒 90°，读者在直立汉字与侧躺字符间来回歪头切换。",
    hNote: "汉字、数字、英文与符号共用同一条水平基线，扫视一次通过，零额外认知负担。",
    verdict: "结论：混杂大量数字、英文与网址的技术内容请果断回到横排左起（212），不要为了「传统感」牺牲可读性。",
  },
};

export function initSection01() {
  const svgV = document.getElementById("race-svg-v");
  const svgH = document.getElementById("race-svg-h");
  const badgeV = document.getElementById("race-badge-v");
  const badgeH = document.getElementById("race-badge-h");
  const noteV = document.getElementById("race-note-v");
  const noteH = document.getElementById("race-note-h");
  const verdict = document.getElementById("race-verdict");
  const playBtn = document.getElementById("race-play");
  const tabs = [...document.querySelectorAll("[data-race]")];

  let curKey = "poem";
  let animId = 0;
  let progress = 1; // 0..1

  function renderCase(p = 1) {
    const c = RACE_CASES[curKey];
    badgeV.textContent = c.vBadge;
    badgeV.classList.toggle("is-warn", c.vWarn);
    badgeH.textContent = c.hBadge;
    badgeH.classList.toggle("is-warn", c.hWarn);
    noteV.textContent = c.vNote;
    noteH.textContent = c.hNote;
    verdict.textContent = c.verdict;

    // 1. 构建直排右起 SVG（自右向左 4 列）
    const colXs = [212, 160, 108, 56];
    let vMarkup = `<rect x="10" y="10" width="240" height="170" rx="5" fill="#12093E" stroke="#6E4B82" stroke-width="1"/>`;
    vMarkup += `<line x1="22" y1="26" x2="238" y2="26" stroke="rgba(239,135,170,0.35)" stroke-dasharray="3 3"/>`;
    // 视线路径折线
    const vPts = [];
    for (let i = 0; i < 4; i++) {
      const x = colXs[i];
      vPts.push([x, 38], [x, 154]);
      const chars = [...c.vCols[i]];
      vMarkup += `<circle cx="${x}" cy="20" r="6" fill="${i === 0 ? "#EF87AA" : "rgba(239,135,170,0.22)"}"/>`;
      vMarkup += `<text x="${x}" y="23.5" text-anchor="middle" font-size="9" font-family="JetBrains Mono,monospace" fill="${i === 0 ? "#0C0533" : "#CFC3DE"}">${i + 1}</text>`;
      chars.forEach((ch, j) => {
        const isAscii = /[A-Za-z0-9./:-]/.test(ch);
        const y = 42 + j * 18;
        if (y > 166) return;
        const fill = isAscii && curKey === "changelog" ? "#FF867B" : "#EFE5DA";
        if (isAscii) {
          vMarkup += `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" font-family="JetBrains Mono,monospace" fill="${fill}" transform="rotate(90 ${x} ${y})">${ch}</text>`;
        } else {
          vMarkup += `<text x="${x}" y="${y}" text-anchor="middle" font-size="13" font-family="LXGW WenKai,Noto Serif SC,serif" fill="${fill}">${ch}</text>`;
        }
      });
    }
    const vPathD = vPts.map((pt, idx) => `${idx === 0 ? "M" : "L"}${pt[0]} ${pt[1]}`).join(" ");
    vMarkup += `<path d="${vPathD}" fill="none" stroke="${c.vWarn ? "rgba(255,134,123,0.45)" : "rgba(239,135,170,0.42)"}" stroke-width="1.3" stroke-dasharray="3 3"/>`;
    // 演练光点（直排）
    const vPos = samplePoly(vPts, p);
    vMarkup += `<circle cx="${vPos[0].toFixed(1)}" cy="${vPos[1].toFixed(1)}" r="5" fill="${c.vWarn ? "#FF867B" : "#EF87AA"}"/>`;
    svgV.innerHTML = vMarkup;

    // 2. 构建横排左起 SVG
    const hYs = [68, 122];
    let hMarkup = `<rect x="10" y="10" width="240" height="170" rx="5" fill="#12093E" stroke="#6E4B82" stroke-width="1"/>`;
    hMarkup += `<line x1="28" y1="24" x2="28" y2="164" stroke="rgba(118,226,192,0.4)" stroke-dasharray="3 3"/>`;
    const hPts = [
      [34, hYs[0]],
      [234, hYs[0]],
      [34, hYs[1]],
      [234, hYs[1]],
    ];
    c.hLines.forEach((line, idx) => {
      hMarkup += `<text x="34" y="${hYs[idx] + 4}" font-size="13" font-family="Noto Serif SC,serif" fill="#EFE5DA">${line}</text>`;
    });
    const hPathD = hPts.map((pt, idx) => `${idx === 0 ? "M" : "L"}${pt[0]} ${pt[1]}`).join(" ");
    hMarkup += `<path d="${hPathD}" fill="none" stroke="rgba(118,226,192,0.45)" stroke-width="1.3" stroke-dasharray="3 3"/>`;
    const hPos = samplePoly(hPts, p);
    hMarkup += `<circle cx="${hPos[0].toFixed(1)}" cy="${hPos[1].toFixed(1)}" r="5" fill="#76E2C0"/>`;
    svgH.innerHTML = hMarkup;
  }

  function samplePoly(pts, u) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push({ a: pts[i], b: pts[i + 1], len });
      total += len;
    }
    let dist = clamp(u, 0, 1) * total;
    for (const s of segs) {
      if (dist <= s.len || s === segs[segs.length - 1]) {
        const f = s.len ? dist / s.len : 0;
        return [s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f];
      }
      dist -= s.len;
    }
    return pts[pts.length - 1];
  }

  function runScan() {
    cancelAnimationFrame(animId);
    if (reducedMotion.matches) {
      progress = 1;
      renderCase(1);
      return;
    }
    const t0 = performance.now();
    const dur = 2600;
    const step = (now) => {
      progress = Math.min(1, (now - t0) / dur);
      renderCase(progress);
      if (progress < 1) animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      curKey = btn.dataset.race;
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      progress = 1;
      renderCase(1);
    });
  });

  playBtn.addEventListener("click", runScan);
  renderCase(1);
}

// ==================== 02 真 CSS vertical-rl 活体版心 + 二维 XY 调版垫 ====================
export function initSection02() {
  const pad = document.getElementById("xy-pad");
  const puck = document.getElementById("xy-puck");
  const readout = document.getElementById("xy-readout");
  const verdict = document.getElementById("xy-verdict");
  const badge = document.getElementById("vbook-badge");
  const page = document.getElementById("vbook-page");
  const cssOut = document.getElementById("vbook-css");
  const btnPunct = document.getElementById("xy-vert-punct");
  const btnRules = document.getElementById("xy-rules");
  const btnReset = document.getElementById("xy-reset");

  let nx = 0.42; // 0..1 → line-height 1.30..2.60
  let ny = 0.37; // 0..1 → block-size 9em..28em (字数/列)
  let vertPunct = true;
  let showRules = true;
  let dragging = false;

  function apply() {
    const lh = +(1.3 + nx * 1.3).toFixed(2);
    const chars = Math.round(9 + ny * 19);

    puck.style.left = `${(nx * 100).toFixed(1)}%`;
    puck.style.top = `${(ny * 100).toFixed(1)}%`;
    readout.textContent = `${chars} 字/列 · ${lh.toFixed(2)}×`;
    pad.setAttribute("aria-valuetext", `${chars}字每列，列距${lh.toFixed(2)}倍`);

    page.style.lineHeight = String(lh);
    page.style.height = `${chars}em`;
    page.style.backgroundSize = `${lh}em 100%`;
    page.classList.toggle("no-rules", !showRules);
    page.classList.toggle("no-vert", !vertPunct);

    btnPunct.classList.toggle("is-on", vertPunct);
    btnPunct.setAttribute("aria-pressed", String(vertPunct));
    btnPunct.textContent = `直排标点 vert：${vertPunct ? "开" : "关"}`;

    btnRules.classList.toggle("is-on", showRules);
    btnRules.setAttribute("aria-pressed", String(showRules));
    btnRules.textContent = `乌丝界栏：${showRules ? "开" : "关"}`;

    cssOut.textContent = `writing-mode: vertical-rl;\nline-height: ${lh.toFixed(2)};\nblock-size: ${chars}em;\nfont-feature-settings: "vert" ${vertPunct ? 1 : 0};`;

    let msg = "";
    let warn = false;
    if (lh < 1.52) {
      warn = true;
      msg = `列距压紧到 ${lh.toFixed(2)}×，字列之间几乎没有留白缓冲，长句向下扫时余光容易串到相邻列。`;
    } else if (lh > 2.32) {
      warn = true;
      msg = `列距拉到 ${lh.toFixed(2)}× 偏疏，换列时眼球要横跨大片纸面，只适合寥寥数句的诗签或题跋。`;
    } else if (chars < 12) {
      warn = true;
      msg = `每列仅 ${chars} 字，一句五言联都放不全，频繁折列让页面显碎。`;
    } else if (chars > 23) {
      warn = true;
      msg = `每列高达 ${chars} 字，超出海报 15–22 字/列的经验区间，列尾跳回下一列天头需要更宽列距配合。`;
    } else if (!vertPunct) {
      warn = true;
      msg = "字高与列距已落入舒适区，但关闭了 vert 直排字形特性，标点与竖排轴线不再严丝合缝。";
    } else {
      msg = `落入呼吸舒适区：每列 ${chars} 字配合 ${lh.toFixed(2)}× 列距，下扫连贯、换列回扫稳准。`;
    }

    verdict.textContent = msg;
    badge.textContent = warn ? "偏离呼吸区（示意）" : "气韵从容（示意）";
    badge.classList.toggle("is-warn", warn);
  }

  function updateFromEvent(e) {
    const r = pad.getBoundingClientRect();
    nx = clamp((e.clientX - r.left) / r.width, 0, 1);
    ny = clamp((e.clientY - r.top) / r.height, 0, 1);
    apply();
  }

  pad.addEventListener("pointerdown", (e) => {
    dragging = true;
    pad.setPointerCapture?.(e.pointerId);
    updateFromEvent(e);
  });
  pad.addEventListener("pointermove", (e) => {
    if (dragging) updateFromEvent(e);
  });
  pad.addEventListener("pointerup", () => {
    dragging = false;
  });
  pad.addEventListener("pointercancel", () => {
    dragging = false;
  });

  pad.addEventListener("keydown", (e) => {
    const step = 0.06;
    if (e.key === "ArrowLeft") { e.preventDefault(); nx = clamp(nx - step, 0, 1); apply(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); nx = clamp(nx + step, 0, 1); apply(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); ny = clamp(ny - step, 0, 1); apply(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); ny = clamp(ny + step, 0, 1); apply(); }
  });

  btnPunct.addEventListener("click", () => { vertPunct = !vertPunct; apply(); });
  btnRules.addEventListener("click", () => { showRules = !showRules; apply(); });
  btnReset.addEventListener("click", () => { nx = 0.42; ny = 0.37; vertPunct = true; showRules = true; apply(); });

  apply();
}

// ==================== 03 五时代历史器物步进器 ====================
const ERAS = [
  {
    tag: "先秦至汉 · 物理起源",
    title: "竹简窄长只能纵写，左手展卷自然由右向左",
    body: "早期的甲骨刻辞其实左行、右行兼有；真正把「自上而下、由右向左」定型的是竹木简牍。单枚竹简宽仅一指，只能竖写一列；多简以麻绳编联成「册」后，右手执笔写完一简、左手顺势往左侧摊开新简或向右卷收旧简，顺手形成了持续两千多年的直排右起秩序。",
    source: "核实来源：钱存训（Tsuen-Hsuin Tsien），《书于竹帛》（Written on Bamboo and Silk），University of Chicago Press，1962（2004 再版）。",
    svg: `<svg viewBox="0 0 420 210" aria-label="竹简编册由右向左展读示意">
      <rect x="8" y="8" width="404" height="194" rx="6" fill="#12093E"/>
      <line x1="48" y1="52" x2="372" y2="52" stroke="#EF87AA" stroke-width="2" stroke-dasharray="6 4"/>
      <line x1="48" y1="158" x2="372" y2="158" stroke="#EF87AA" stroke-width="2" stroke-dasharray="6 4"/>
      ${[336, 286, 236, 186, 136, 86].map((x, i) => `
        <rect x="${x - 16}" y="26" width="32" height="158" rx="3" fill="${i === 0 ? "#2D1D5E" : "#1C1248"}" stroke="${i === 0 ? "#EF87AA" : "#7B5690"}" stroke-width="1.3"/>
        <text x="${x}" y="46" text-anchor="middle" font-size="11" font-family="JetBrains Mono,monospace" fill="#EF87AA">${i + 1}</text>
        <text x="${x}" y="78" text-anchor="middle" font-size="14" font-family="LXGW WenKai,serif" fill="#EFE5DA">${["书", "于", "竹", "帛", "右", "起"][i]}</text>
        <text x="${x}" y="104" text-anchor="middle" font-size="14" font-family="LXGW WenKai,serif" fill="#EFE5DA">${["简", "窄", "纵", "写", "左", "展"][i]}</text>
        <text x="${x}" y="130" text-anchor="middle" font-size="14" font-family="LXGW WenKai,serif" fill="#EFE5DA">${["编", "绳", "成", "册", "成", "序"][i]}</text>
      `).join("")}
      <path d="M350 194 H76 M86 188 L74 194 L86 200" fill="none" stroke="#76E2C0" stroke-width="1.8"/>
      <text x="210" y="191" text-anchor="middle" font-size="11" font-family="Noto Serif SC,serif" fill="#76E2C0">左手展简 · 由右向左读</text>
    </svg>`,
  },
  {
    tag: "宋元明清 · 雕版定型",
    title: "界栏、版心与右翻书口把直排固化成典籍规制",
    body: "雕版印刷成熟后，一整块木板刻出一页双半叶，折页后装订在左侧，翻页方向自然从右往左翻开。四周的「边栏」、列与列之间的「乌丝栏/朱丝栏」、中缝的「鱼尾」与白口，把天头留白与行间呼吸固化为极其严谨的网格系统。",
    source: "参考：中国古籍版式术语与 W3C《中文排版需求》（CLREQ）传统版面章节。",
    svg: `<svg viewBox="0 0 420 210" aria-label="宋刻雕版界栏与版心鱼尾示意">
      <rect x="26" y="16" width="368" height="178" fill="#180E4A" stroke="#EF87AA" stroke-width="2"/>
      <rect x="32" y="22" width="356" height="166" fill="none" stroke="#8C67A8" stroke-width="1"/>
      <line x1="196" y1="22" x2="196" y2="188" stroke="#EF87AA" stroke-width="1.2"/>
      <line x1="224" y1="22" x2="224" y2="188" stroke="#EF87AA" stroke-width="1.2"/>
      <polygon points="200,52 220,52 220,66 210,60 200,66" fill="#EF87AA"/>
      <text x="210" y="114" text-anchor="middle" font-size="11" font-family="LXGW WenKai,serif" fill="#EFE5DA">版</text>
      <text x="210" y="132" text-anchor="middle" font-size="11" font-family="LXGW WenKai,serif" fill="#EFE5DA">心</text>
      ${[70, 112, 154, 266, 308, 350].map((x) => `<line x1="${x}" y1="22" x2="${x}" y2="188" stroke="rgba(160,124,194,0.4)" stroke-width="1"/>`).join("")}
      ${[368, 328, 286, 244, 174, 132, 90, 50].map((x, idx) => `<text x="${x}" y="58" text-anchor="middle" font-size="13" font-family="LXGW WenKai,serif" fill="#EFE5DA">${["卷", "首", "右", "起", "天", "头", "齐", "平"][idx]}</text><text x="${x}" y="86" text-anchor="middle" font-size="13" font-family="LXGW WenKai,serif" fill="#CFC3DE">${["乌", "丝", "界", "栏", "疏", "密", "有", "度"][idx]}</text>`).join("")}
      <text x="210" y="180" text-anchor="middle" font-size="10.5" font-family="Noto Serif SC,serif" fill="#76E2C0">右半叶先读 ← 版心折缝 ← 左半叶续读</text>
    </svg>`,
  },
  {
    tag: "1955–1956 · 现代转型",
    title: "《光明日报》与《人民日报》先后改横排",
    body: "随着近代科学符号、阿拉伯数字、数学公式和外文文献大量涌入，直排混排成本越来越高。1955 年 1 月 1 日，《光明日报》率先在全国报纸中由直排改为横排左起；1956 年 1 月 1 日，《人民日报》正式改为横排。中国大陆的大众报刊与现代出版由此大规模转向横排。",
    source: "核实来源：《光明日报》（1955-01-01 改版史料）与《人民日报》（1956-01-01 改横排记录）。",
    svg: `<svg viewBox="0 0 420 210" aria-label="1955-1956 报纸由直排转向横排对照">
      <rect x="14" y="16" width="180" height="178" rx="4" fill="#160D46" stroke="#7B5690"/>
      <text x="104" y="38" text-anchor="middle" font-size="12" font-family="Chivo,Noto Serif SC,sans-serif" fill="#CFC3DE">1955 前 · 传统直排</text>
      ${[162, 130, 98, 66, 38].map((x) => `<line x1="${x}" y1="52" x2="${x}" y2="174" stroke="rgba(239,135,170,0.45)" stroke-width="6" stroke-dasharray="10 6"/>`).join("")}
      <path d="M202 105 H226 M218 98 L226 105 L218 112" fill="none" stroke="#EF87AA" stroke-width="2.2"/>
      <rect x="234" y="16" width="172" height="178" rx="4" fill="#1E1357" stroke="#76E2C0"/>
      <text x="320" y="38" text-anchor="middle" font-size="12" font-family="Chivo,Noto Serif SC,sans-serif" fill="#76E2C0">1955/56 · 横排左起</text>
      ${[66, 92, 118, 144, 170].map((y) => `<line x1="252" y1="${y}" x2="388" y2="${y}" stroke="rgba(118,226,192,0.55)" stroke-width="6" stroke-dasharray="18 6"/>`).join("")}
    </svg>`,
  },
  {
    tag: "2004–2005 · 公文与出版并存",
    title: "行政公文转向横书，文学出版仍守直排右起",
    body: "2004 年 5 月，台湾修订《公文程式条例》，自 2005 年 1 月 1 日起全面实行公文由左而右横书以适配电脑办公；但在台湾与日本的文学书籍、报纸副刊与漫画领域，直排右起依然是主流日常，日本更以工业标准 JIS X 4051 与 W3C JLReq 精细定义了直排禁则、标点挤压与旁注。",
    source: "核实来源：台湾《公文程式条例》2004 修正条文（2005-01-01 施行）；W3C JLReq（Requirements for Japanese Text Layout）。",
    svg: `<svg viewBox="0 0 420 210" aria-label="公文横排与文学书刊直排分工并存">
      <rect x="22" y="24" width="170" height="162" rx="5" fill="#160D46" stroke="#7B5690"/>
      <text x="107" y="48" text-anchor="middle" font-size="12" font-family="Noto Serif SC,serif" fill="#CFC3DE">行政公文 · 图表办公</text>
      <rect x="42" y="66" width="130" height="10" rx="2" fill="rgba(207,195,222,0.35)"/>
      <rect x="42" y="88" width="110" height="8" rx="2" fill="rgba(207,195,222,0.25)"/>
      <rect x="42" y="108" width="124" height="8" rx="2" fill="rgba(207,195,222,0.25)"/>
      <text x="107" y="156" text-anchor="middle" font-size="11.5" font-family="JetBrains Mono,monospace" fill="#76E2C0">横排左起 →</text>
      <rect x="224" y="24" width="174" height="162" rx="5" fill="#1E1357" stroke="#EF87AA"/>
      <text x="311" y="48" text-anchor="middle" font-size="12" font-family="Noto Serif SC,serif" fill="#EF87AA">小说 · 诗集 · 漫画</text>
      ${[366, 336, 306, 276, 248].map((x, i) => `<rect x="${x}" y="64" width="12" height="${i === 0 ? 78 : 96}" rx="2" fill="${i === 0 ? "#EF87AA" : "rgba(239,229,218,0.4)"}"/>`).join("")}
      <text x="311" y="176" text-anchor="middle" font-size="11.5" font-family="JetBrains Mono,monospace" fill="#EF87AA">← 右翻直排</text>
    </svg>`,
  },
  {
    tag: "2019 · W3C 网页正式标准",
    title: "一行 writing-mode: vertical-rl 把直排带回浏览器",
    body: "2019 年 12 月 10 日，W3C 正式发布《CSS Writing Modes Level 3》推荐标准；配合 W3C 国际化工作组持续编写的《中文排版需求》（CLREQ），网页设计师终于不必把竖排文字切成静态图片，而是用原生 CSS 即可实现可检索、可复制、可响应式的直排右起版面。",
    source: "核实来源：W3C CSS Writing Modes Level 3 Recommendation（2019-12-10）与 W3C CLREQ（w3.org/TR/clreq/）。",
    svg: `<svg viewBox="0 0 420 210" aria-label="W3C CSS writing-mode vertical-rl 浏览器渲染示意">
      <rect x="18" y="18" width="384" height="174" rx="6" fill="#12093E" stroke="#76E2C0" stroke-width="1.4"/>
      <rect x="18" y="18" width="384" height="28" rx="6" fill="#1C1150"/>
      <circle cx="34" cy="32" r="4" fill="#EF87AA"/><circle cx="48" cy="32" r="4" fill="#CFC3DE"/><circle cx="62" cy="32" r="4" fill="#76E2C0"/>
      <text x="80" y="36" font-size="11" font-family="JetBrains Mono,monospace" fill="#EFE5DA">CSS Writing Modes Level 3 · 2019-12-10</text>
      <text x="36" y="84" font-size="12" font-family="JetBrains Mono,monospace" fill="#EF87AA">.scroll {</text>
      <text x="48" y="106" font-size="12" font-family="JetBrains Mono,monospace" fill="#76E2C0">writing-mode: vertical-rl;</text>
      <text x="48" y="128" font-size="12" font-family="JetBrains Mono,monospace" fill="#EFE5DA">line-height: 1.85;</text>
      <text x="48" y="150" font-size="12" font-family="JetBrains Mono,monospace" fill="#EFE5DA">font-feature-settings: "vert";</text>
      <text x="36" y="172" font-size="12" font-family="JetBrains Mono,monospace" fill="#EF87AA">}</text>
      <line x1="286" y1="60" x2="286" y2="174" stroke="rgba(160,124,194,0.35)"/>
      ${[370, 342, 314].map((x, idx) => `<text x="${x}" y="86" text-anchor="middle" font-size="14" font-family="LXGW WenKai,serif" fill="${idx === 0 ? "#EF87AA" : "#EFE5DA"}">${["原", "可", "右"][idx]}</text><text x="${x}" y="112" text-anchor="middle" font-size="14" font-family="LXGW WenKai,serif" fill="#EFE5DA">${["生", "选", "起"][idx]}</text><text x="${x}" y="138" text-anchor="middle" font-size="14" font-family="LXGW WenKai,serif" fill="#EFE5DA">${["直", "可", "成"][idx]}</text><text x="${x}" y="164" text-anchor="middle" font-size="14" font-family="LXGW WenKai,serif" fill="#EFE5DA">${["排", "搜", "序"][idx]}</text>`).join("")}
    </svg>`,
  },
];

export function initSection03() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const prevBtn = document.getElementById("era-prev");
  const nextBtn = document.getElementById("era-next");
  const art = document.getElementById("era-artifact");
  const tag = document.getElementById("era-tag");
  const title = document.getElementById("era-title");
  const body = document.getElementById("era-body");
  const source = document.getElementById("era-source");
  let idx = 0;

  function render() {
    const e = ERAS[idx];
    art.innerHTML = e.svg;
    tag.textContent = e.tag;
    title.textContent = e.title;
    body.textContent = e.body;
    source.textContent = e.source;
    btns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => { idx = Number(b.dataset.era); render(); }));
  prevBtn.addEventListener("click", () => { idx = (idx + ERAS.length - 1) % ERAS.length; render(); });
  nextBtn.addEventListener("click", () => { idx = (idx + 1) % ERAS.length; render(); });
  render();
}

// ==================== 04 六类真实文案直排压力测试台 ====================
const STRESS_CASES = {
  tea: {
    pill: "强烈推荐",
    cls: "",
    title: "茶器展海报：纯汉字短句天然立得住",
    body: "全是等宽方块汉字，没有长串英文或小数打断竖向视觉轴。最右一列放大展名，向左自然展开导语与节气，十秒之内就能立出安静雅致的展览气场。",
    html: `<div class="stress-vtext"><p class="st-title">秋山茶器展</p><p>以泥为骨，借火成器。</p><p>寒露开馆，邀君品茗。</p></div>`,
    linkHtml: "同属东方文化海报场景时，只需守住右起序与列缝呼吸，无需额外混排技巧。",
  },
  poem: {
    pill: "强烈推荐",
    cls: "",
    title: "古诗书签：一句一列，诗律与版式天然咬合",
    body: "五言或七言诗字数工整，天头地脚齐平后自带节奏美感。把诗题与作者稳稳锚定在最右列，书签一拿起来视线就从右往左缓缓展开。",
    html: `<div class="stress-vtext"><p class="st-title">山居秋暝</p><p>空山新雨后，天气晚来秋。</p><p>明月松间照，清泉石上流。</p></div>`,
    linkHtml: "若要给生僻古字加注读音，请配合 <a class='xref' href='https://layout.xiaoxiaodong.ai/221/play/' target='_blank' rel='noopener'>221 旁注（Ruby）排版</a>。",
  },
  spine: {
    pill: "需配合混排",
    cls: "is-caution",
    title: "书封与展期：少量两位数字可以直排，但别让它侧躺",
    body: "「10 月 24 日」如果直接塞进直排，默认情况下阿拉伯数字会横倒 90°，在一串端正的汉字里显得很扎眼。把两位数字横并进一个汉字格里，整列才会稳住。",
    html: `<div class="stress-vtext"><p class="st-title">器物年鉴</p><p>展期 <span class="st-bad-mark">10</span> 月 <span class="st-bad-mark">24</span> 日启幕，</p><p>共收器物 <span class="st-bad-mark">88</span> 件。</p></div>`,
    linkHtml: "两位数字或短缩写收进一格的做法见 <a class='xref' href='https://layout.xiaoxiaodong.ai/217/play/' target='_blank' rel='noopener'>217 纵中横排</a>；西文直立或转向取舍见 <a class='xref' href='https://layout.xiaoxiaodong.ai/218/play/' target='_blank' rel='noopener'>218</a> 与 <a class='xref' href='https://layout.xiaoxiaodong.ai/219/play/' target='_blank' rel='noopener'>219</a>。",
  },
  url: {
    pill: "明确别用",
    cls: "is-bad",
    title: "含网址与版本号的更新日志：侧翻难辨、复制别扭",
    body: "一旦出现 URL、语义版本号或英文错误码，竖排里超过一半篇幅都在 90° 横躺，读者必须歪着头辨认字符，复制选区也容易拖偏。",
    html: `<div class="stress-vtext is-broken"><p>发布 <span class="st-bad-mark">v3.14.2</span> 版本</p><p>接口 <span class="st-bad-mark">https://api.demo.io</span></p></div>`,
    linkHtml: "技术文档与更新日志请直接采用 <a class='xref' href='https://layout.xiaoxiaodong.ai/212/play/' target='_blank' rel='noopener'>212 横排左起</a>。",
  },
  table: {
    pill: "明确别用",
    cls: "is-bad",
    title: "三栏价目与数据表：小数点无法纵向对齐比较",
    body: "比较金额与参数靠的是横排右对齐的小数点与位数对齐。竖排后多位数要么侧躺、要么拆散成单字，读者无法一眼比较大小。",
    html: `<div class="stress-vtext is-broken"><p>手拉坯壶 <span class="st-bad-mark">¥1,280.00</span></p><p>柴烧茶杯 <span class="st-bad-mark">¥360.50</span></p></div>`,
    linkHtml: "价格表、参数栏与报表应使用 <a class='xref' href='https://layout.xiaoxiaodong.ai/212/play/' target='_blank' rel='noopener'>212 横排左起</a>，或在主视觉直排旁搭横排附表（<a class='xref' href='https://layout.xiaoxiaodong.ai/216/play/' target='_blank' rel='noopener'>216 横直混排</a>）。",
  },
  web: {
    pill: "谨慎别滥用",
    cls: "is-bad",
    title: "万字网页长文：滚轮上下滚却要页面向左翻",
    body: "桌面浏览器和手机手势都围绕「上下滚动」建立习惯。把几千字网页长文整篇设为 vertical-rl，读者每滚一下滑轮页面不动、得费劲拖底部横向滚动条，体验立刻崩盘。",
    html: `<div class="stress-vtext is-broken"><p>超出视口宽度的几十列正文</p><p>被迫不断向左溢出，桌面滚轮</p><p>无法顺畅翻列……</p></div>`,
    linkHtml: "网页里只建议把直排右起用在单屏装得下的标题、签条或诗卡；长文正文回到 <a class='xref' href='https://layout.xiaoxiaodong.ai/212/play/' target='_blank' rel='noopener'>212 横排左起</a>。",
  },
};

export function initSection04() {
  const btns = [...document.querySelectorAll("[data-stress]")];
  const pill = document.getElementById("stress-pill");
  const live = document.getElementById("stress-live");
  const title = document.getElementById("stress-title");
  const body = document.getElementById("stress-body");
  const linkWrap = document.getElementById("stress-link-wrap");

  function select(key) {
    const c = STRESS_CASES[key];
    pill.textContent = c.pill;
    pill.className = `stress-verdict-pill ${c.cls}`;
    live.innerHTML = c.html;
    title.textContent = c.title;
    body.textContent = c.body;
    linkWrap.innerHTML = c.linkHtml;
    btns.forEach((b) => {
      const on = b.dataset.stress === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.stress)));
  select("tea");
}

// ==================== 05 盲测小练习（两轮单变量四选一微型海报） ====================
const QUIZ_ROUNDS = [
  {
    prompt: "要为「秋山陶艺展」排一张直排右起请柬，四张小样字号、文案、画幅完全一样，每个错项与正解<strong>只差一个版式变量</strong>。点选最符合直排右起秩序的一张：",
    correct: 2, // C
    options: [
      {
        label: "方案 A",
        why: "只错在「列序反了」：题签「秋山陶艺展」被放在最左列，正文往右推进——这是直排左起（215），视线习惯从右上角入画反而先撞上落款。",
        svg: (reveal) => miniInviteSvg({ mode: "leftStart", reveal }),
      },
      {
        label: "方案 B",
        why: "只错在「竖列上下居中」：列序虽是从右向左，但每列长短不一，居中后天头高低起伏，换列回扫没有固定落点。",
        svg: (reveal) => miniInviteSvg({ mode: "center", reveal }),
      },
      {
        label: "方案 C",
        why: "正解！题签稳稳坐镇最右原点列、正文自右向左依次展开、所有列共用一条平直天头线，且列缝宽约 0.85 倍字宽，层次与呼吸一步到位。",
        svg: (reveal) => miniInviteSvg({ mode: "good", reveal }),
      },
      {
        label: "方案 D",
        why: "只错在「列缝过挤」：列序和天头都对，但相邻列间距被压到不足 0.25 倍字宽，向下读时极易横跳串到隔壁列。",
        svg: (reveal) => miniInviteSvg({ mode: "cramped", reveal }),
      },
    ],
  },
  {
    prompt: "第 2 题（书封节选校样）：四张直排右起书封列序与天头全部一致，每个错项仍与正解<strong>只差一处细节变量</strong>。找出最严谨的一张：",
    correct: 1, // B
    options: [
      {
        label: "方案 A",
        why: "只错在「横排标点未转直排」：逗号句号仍贴在字格左下角，视觉上直接勾住左邻列，破坏了列缝干净感。",
        svg: (reveal) => miniBookSvg({ mode: "badPunct", reveal }),
      },
      {
        label: "方案 B",
        why: "正解！题签比正文大且带粉点引导、直排标点归字格右上角、每列字数与天地留白恰到好处。",
        svg: (reveal) => miniBookSvg({ mode: "good", reveal }),
      },
      {
        label: "方案 C",
        why: "只错在「题签与正文同号拉平」：最右列书名和正文一样细小，没有建立第一眼视觉焦点，违背了「标题更大更重」的原则。",
        svg: (reveal) => miniBookSvg({ mode: "flatTitle", reveal }),
      },
      {
        label: "方案 D",
        why: "只错在「单列字数过满顶边」：上下天地留白几乎被吃光，列尾紧抵框线，画面发堵且回扫疲劳。",
        svg: (reveal) => miniBookSvg({ mode: "overlong", reveal }),
      },
    ],
  },
];

function miniInviteSvg({ mode, reveal }) {
  // 4 列内容：题签 + 3 句短文
  const titleX = mode === "leftStart" ? 36 : mode === "cramped" ? 132 : 162;
  const bodyXs =
    mode === "leftStart"
      ? [76, 116, 156]
      : mode === "cramped"
        ? [112, 92, 72]
        : [120, 82, 44];
  const tops =
    mode === "center"
      ? { t: 48, b: [28, 42, 62] }
      : { t: 28, b: [28, 28, 28] };

  const bTexts = ["寒露开馆邀君赏器", "柴烧茶盏百件陈列", "席备岩茶凭柬入座"];
  let overlay = "";
  if (reveal) {
    if (mode === "good") {
      overlay = `<line x1="20" y1="22" x2="180" y2="22" stroke="#76E2C0" stroke-width="1.3" stroke-dasharray="3 3"/><path d="M168 188 H36 M44 183 L34 188 L44 193" fill="none" stroke="#76E2C0" stroke-width="1.6"/>`;
    } else if (mode === "leftStart") {
      overlay = `<path d="M36 188 H164 M156 183 L166 188 L156 193" fill="none" stroke="#FF867B" stroke-width="1.8"/>`;
    } else if (mode === "center") {
      overlay = `<polyline points="${bodyXs[2]},${tops.b[2]} ${bodyXs[1]},${tops.b[1]} ${bodyXs[0]},${tops.b[0]} ${titleX},${tops.t}" fill="none" stroke="#FF867B" stroke-width="1.6" stroke-dasharray="3 2"/>`;
    } else if (mode === "cramped") {
      overlay = `<rect x="64" y="24" width="76" height="146" fill="rgba(255,134,123,0.16)" stroke="#FF867B" stroke-dasharray="3 2"/>`;
    }
  }

  return `<svg viewBox="0 0 200 206" aria-hidden="true">
    <rect width="200" height="206" rx="5" fill="#0C0533"/>
    <rect x="12" y="12" width="176" height="182" rx="4" fill="#130A40" stroke="#6E4B82"/>
    <circle cx="${titleX}" cy="${tops.t + 4}" r="3.2" fill="#EF87AA"/>
    ${[..."秋山陶艺展"].map((ch, i) => `<text x="${titleX}" y="${tops.t + 22 + i * 19}" text-anchor="middle" font-size="14" font-weight="700" font-family="Noto Serif SC,serif" fill="#EFE5DA">${ch}</text>`).join("")}
    ${bodyXs.map((x, ci) => [...bTexts[ci]].slice(0, ci === 2 ? 6 : 8).map((ch, i) => `<text x="${x}" y="${tops.b[ci] + 14 + i * 16}" text-anchor="middle" font-size="11.5" font-family="LXGW WenKai,serif" fill="#CFC3DE">${ch}</text>`).join("")).join("")}
    ${overlay}
  </svg>`;
}

function miniBookSvg({ mode, reveal }) {
  const titleFs = mode === "flatTitle" ? 11.5 : 15;
  const titleWeight = mode === "flatTitle" ? 400 : 700;
  const cols = [
    ["空", "山", "新", "雨", "后", "，", "天", "气", "晚", "来", "秋", "。"],
    ["明", "月", "松", "间", "照", "，", "清", "泉", "石", "上", "流", "。"],
  ];
  const stepY = mode === "overlong" ? 13 : 13.5;
  const startY = mode === "overlong" ? 18 : 34;
  const extraChars = mode === "overlong" ? ["薄", "雾", "轻", "笼", "翠"] : [];

  let overlay = "";
  if (reveal) {
    if (mode === "good") overlay = `<rect x="14" y="14" width="172" height="178" rx="3" fill="none" stroke="#76E2C0" stroke-width="1.5"/>`;
    if (mode === "badPunct") overlay = `<circle cx="101" cy="105" r="9" fill="none" stroke="#FF867B" stroke-width="1.5"/><circle cx="63" cy="105" r="9" fill="none" stroke="#FF867B" stroke-width="1.5"/>`;
    if (mode === "flatTitle") overlay = `<rect x="144" y="26" width="24" height="106" fill="rgba(255,134,123,0.16)" stroke="#FF867B" stroke-dasharray="3 2"/>`;
    if (mode === "overlong") overlay = `<line x1="20" y1="14" x2="180" y2="14" stroke="#FF867B" stroke-width="2"/><line x1="20" y1="194" x2="180" y2="194" stroke="#FF867B" stroke-width="2"/>`;
  }

  return `<svg viewBox="0 0 200 206" aria-hidden="true">
    <rect width="200" height="206" rx="5" fill="#0C0533"/>
    <rect x="12" y="12" width="176" height="182" rx="4" fill="#130A40" stroke="#6E4B82"/>
    ${mode === "flatTitle" ? "" : `<circle cx="156" cy="${startY - 4}" r="3.2" fill="#EF87AA"/>`}
    ${[..."林泉清赏"].map((ch, i) => `<text x="156" y="${startY + 14 + i * (titleFs + 5)}" text-anchor="middle" font-size="${titleFs}" font-weight="${titleWeight}" font-family="Noto Serif SC,serif" fill="${mode === "flatTitle" ? "#CFC3DE" : "#EFE5DA"}">${ch}</text>`).join("")}
    ${cols.map((arr, ci) => {
      const x = ci === 0 ? 106 : 68;
      const full = mode === "overlong" ? [...arr, ...extraChars].slice(0, 14) : arr.slice(0, 10);
      return full.map((ch, i) => {
        const isP = ch === "，" || ch === "。";
        const px = isP ? (mode === "badPunct" ? x - 5 : x + 4.5) : x;
        const py = startY + 8 + i * stepY + (isP ? (mode === "badPunct" ? 3 : -3.5) : 0);
        const col = isP && mode === "badPunct" ? "#FF867B" : "#EFE5DA";
        return `<text x="${px}" y="${py}" text-anchor="middle" font-size="11.5" font-family="LXGW WenKai,serif" fill="${col}">${ch}</text>`;
      }).join("");
    }).join("")}
    ${overlay}
  </svg>`;
}

export function initSection05() {
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");
  const roundBtns = [...document.querySelectorAll("[data-round]")];

  let roundIdx = 0;
  let picked = null;

  function render() {
    const r = QUIZ_ROUNDS[roundIdx];
    promptEl.innerHTML = r.prompt;
    roundBtns.forEach((b, i) => {
      const on = i === roundIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });

    const revealed = picked !== null;
    grid.innerHTML = "";
    r.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      if (revealed) {
        if (i === r.correct) btn.classList.add("is-right");
        else if (i === picked) btn.classList.add("is-wrong");
      }
      const tagText = !revealed ? "点击作答" : i === r.correct ? "正解" : i === picked ? "你的选择" : "对照项";
      btn.innerHTML = `
        <div class="quiz-opt-head">
          <span>${opt.label}</span>
          <span class="quiz-tag">${tagText}</span>
        </div>
        ${opt.svg(revealed)}
        <p class="quiz-opt-cap">${revealed ? opt.why : "仔细观察列序、天头、列缝、标点与层级。"}</p>
      `;
      btn.addEventListener("click", () => {
        picked = i;
        render();
      });
      grid.appendChild(btn);
    });

    if (revealed) {
      const ok = picked === r.correct;
      fb.hidden = false;
      fb.className = `quiz-feedback ${ok ? "is-right" : ""}`;
      fb.innerHTML = `<strong>${ok ? "判断精准！" : `再看一眼——正确答案是 ${r.options[r.correct].label}`}</strong>${r.options[picked].why}${ok ? "" : `<br>正解理由：${r.options[r.correct].why}`}`;
    } else {
      fb.hidden = true;
    }
  }

  roundBtns.forEach((b) => {
    b.addEventListener("click", () => {
      roundIdx = Number(b.dataset.round);
      picked = null;
      render();
    });
  });

  render();
}

// ==================== 06 四贴士实体开关校样台 ====================
export function initSection06() {
  const poster = document.getElementById("tips-poster");
  const badge = document.getElementById("tips-summary-badge");
  const checks = {
    focus: document.getElementById("tip-focus"),
    measure: document.getElementById("tip-measure"),
    space: document.getElementById("tip-space"),
    accent: document.getElementById("tip-accent"),
  };

  function update() {
    const f = checks.focus.checked;
    const m = checks.measure.checked;
    const s = checks.space.checked;
    const a = checks.accent.checked;

    poster.classList.toggle("no-focus", !f);
    poster.classList.toggle("no-measure", !m);
    poster.classList.toggle("no-space", !s);
    poster.classList.toggle("no-accent", !a);

    const n = [f, m, s, a].filter(Boolean).length;
    const missing = [
      !f && "缺标题焦点",
      !m && "列高过碎",
      !s && "无留白呼吸",
      !a && "缺粉线引导",
    ].filter(Boolean);
    badge.textContent = n === 4
      ? "4/4 贴士生效 · 焦点、列高、呼吸、引导完整"
      : `${n}/4 贴士生效 · 缺失：${missing.join("、")}`;
  }

  Object.values(checks).forEach((el) => el.addEventListener("change", update));
  update();
}

// ==================== 07 原海报灯箱（放大/拖动/Esc 关闭） ====================
export function initLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lb-stage");
  const img = document.getElementById("lb-img");
  const val = document.getElementById("lb-val");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    val.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!img.src) img.src = posterImg.src; // 海报只内联一次，直接复用
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    btnClose.focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3.5); applyTransform(); });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3.5);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.5);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage) { close(); return; }
    drag = { x: e.clientX - tx, y: e.clientY - ty, id: e.pointerId };
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => {
    drag = null;
    stage.classList.remove("is-dragging");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}
