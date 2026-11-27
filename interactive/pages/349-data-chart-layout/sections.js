// 349 数据图表页 · 正文 01–07 节全部独立交互引擎
// 严守相邻两节绝不复用同一种控件的规矩：
//   01 逐层叠放步进解剖器 + 原海报口径核对卡
//   02 Cleveland & McGill 1984 盲测滑尺 + Tufte 数据墨水五步刀闸
//   03 深午夜蓝暗室 · 5 类翻车前后拖拽分屏帘幕对照器
//   04 1786–2015 五代可视化里程碑图谱与微缩 SVG 原理板
//   05 会议室场景分诊路由器（含 344–350 同小类分流）
//   06 深午夜蓝考场 · 两道单变量四选一 SVG 活体幻灯片小练习
//   07 原海报高清放大/拖拽/Esc 灯箱

export function mountAllSections() {
  mountSec01Layers();
  mountSec02PerceptionAndInk();
  mountSec03DarkroomCurtain();
  mountSec04Origins();
  mountSec05Triage();
  mountSec06Quiz();
  mountSec07PosterLightbox();
}

/* ============================================================
   01 三层阅读秩序：逐层叠放步进解剖器
   ============================================================ */
function mountSec01Layers() {
  const btns = [...document.querySelectorAll("[data-layer-step]")];
  const svg = document.getElementById("s01-svg");
  const titleEl = document.getElementById("s01-read-title");
  const descEl = document.getElementById("s01-read-desc");
  const timeEl = document.getElementById("s01-read-time");
  if (!btns.length || !svg) return;

  const STEPS = [
    {
      step: 1,
      time: "约 10–14 秒（示意 · 自行解码）",
      title: "只有第 1 层「图表主体」：四根等权蓝柱",
      desc: "听众能看到数值递增，却不知道「高到什么算达标」、也不知道演讲者想强调哪一季，只能逐根心算。",
    },
    {
      step: 2,
      time: "约 6–8 秒（示意 · 看到差距）",
      title: "叠加第 2 层「对比与聚焦」：目标基准 + Q4 凸显",
      desc: "加入目标红柱并压低前三个季度的饱和度后，眼睛立刻被拉向 Q4 蓝高红低的明显缺口——但仍需心算具体高出多少。",
    },
    {
      step: 3,
      time: "约 2–3 秒（示意 · 观点直达）",
      title: "补齐第 3 层「结论先行 + 珊瑚标注」：完整三层秩序",
      desc: "顶栏先交出「Q2–Q4 连续增长，Q4 达到全年峰值」，峰值旁珊瑚虚线标注直接报出「超出目标 100 万元」，听众三秒内完成验证。",
    },
  ];

  function draw(step) {
    const info = STEPS[step - 1];
    btns.forEach((b) => {
      const on = Number(b.dataset.layerStep) === step;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    titleEl.textContent = info.title;
    descEl.textContent = info.desc;
    timeEl.textContent = info.time;

    const showCompare = step >= 2;
    const showNarrative = step >= 3;
    const actual = [210, 320, 420, 580];
    const target = [220, 300, 380, 480];
    const qs = ["Q1", "Q2", "Q3", "Q4"];
    const baseY = 236;
    const scale = 148 / 600;

    let bars = "";
    actual.forEach((v, i) => {
      const cx = 105 + i * 98;
      const hA = Math.round(v * scale);
      const yA = baseY - hA;
      const colA = step === 1 ? "#2467DC" : i === 3 ? "#2467DC" : "#B8C4DA";
      const bw = showCompare ? 24 : 36;
      const xA = showCompare ? cx - bw - 3 : cx - bw / 2;
      bars += `<rect x="${xA}" y="${yA}" width="${bw}" height="${hA}" rx="3" fill="${colA}" />`;
      bars += `<text x="${xA + bw / 2}" y="${yA - 6}" text-anchor="middle" font-family="DM Mono, monospace" font-size="11.5" font-weight="${i === 3 && step >= 2 ? 700 : 500}" fill="${i === 3 && step >= 2 ? "#1850B8" : "#5A6B86"}">${v}</text>`;
      if (showCompare) {
        const hT = Math.round(target[i] * scale);
        const yT = baseY - hT;
        const colT = i === 3 ? "#FC6A5D" : "#E8C3BF";
        bars += `<rect x="${cx + 3}" y="${yT}" width="${bw}" height="${hT}" rx="3" fill="${colT}" />`;
        bars += `<text x="${cx + 3 + bw / 2}" y="${yT - 6}" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" fill="${i === 3 ? "#BF3228" : "#8A95A8"}">${target[i]}</text>`;
      }
      bars += `<text x="${cx}" y="${baseY + 18}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="${i === 3 ? 700 : 500}" fill="${i === 3 ? "#112243" : "#5A6B86"}">${qs[i]}</text>`;
    });

    const topBanner = showNarrative
      ? `<rect x="26" y="18" width="54" height="24" rx="6" fill="#D84339"/>
         <text x="53" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFFFF">结论</text>
         <text x="92" y="35" font-size="15.5" font-weight="800" fill="#112243">Q2–Q4 连续增长，Q4 达到全年峰值</text>
         <line x1="26" y1="54" x2="614" y2="54" stroke="#CFD6E1" stroke-dasharray="4 3"/>`
      : `<rect x="26" y="18" width="176" height="24" rx="5" fill="#E8EDF4"/>
         <text x="36" y="34" font-size="12" font-weight="600" fill="#4A5A75">季度销售统计（缺结论标题）</text>
         <line x1="26" y1="54" x2="614" y2="54" stroke="#E2E8F0"/>`;

    const callout = showNarrative
      ? `<circle cx="436" cy="94" r="4.5" fill="#D84339"/>
         <polyline points="436,94 456,94 470,116" fill="none" stroke="#FC6A5D" stroke-width="1.5"/>
         <rect x="470" y="102" width="144" height="72" rx="9" fill="#FFFFFF" stroke="#FC6A5D" stroke-width="1.3" stroke-dasharray="4 3"/>
         <rect x="513" y="91" width="58" height="22" rx="6" fill="#D84339"/>
         <text x="542" y="106" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FFFFFF">标注</text>
         <text x="482" y="132" font-size="11.5" font-weight="600" fill="#16233B">Q4 超出目标 100 万，</text>
         <text x="482" y="152" font-size="11.5" font-weight="600" fill="#16233B">创全年单季新高。</text>
         <circle cx="92" cy="14" r="9" fill="#0F7A5A"/><text x="92" y="18" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFF">1</text>
         <circle cx="388" cy="76" r="9" fill="#0F7A5A"/><text x="388" y="80" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFF">2</text>
         <circle cx="598" cy="100" r="9" fill="#0F7A5A"/><text x="598" y="104" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFF">3</text>`
      : "";

    svg.innerHTML = `
      <rect x="1" y="1" width="638" height="278" rx="10" fill="#FFFFFF" stroke="#DCE3EE"/>
      ${topBanner}
      <line x1="56" y1="88" x2="452" y2="88" stroke="#E5EAF2" stroke-dasharray="3 4"/>
      <line x1="56" y1="138" x2="452" y2="138" stroke="#E5EAF2" stroke-dasharray="3 4"/>
      <line x1="56" y1="187" x2="452" y2="187" stroke="#E5EAF2" stroke-dasharray="3 4"/>
      <line x1="56" y1="${baseY}" x2="452" y2="${baseY}" stroke="#112243" stroke-width="1.6"/>
      <text x="48" y="92" text-anchor="end" font-family="DM Mono, monospace" font-size="10.5" fill="#5A6B86">600</text>
      <text x="48" y="142" text-anchor="end" font-family="DM Mono, monospace" font-size="10.5" fill="#5A6B86">400</text>
      <text x="48" y="191" text-anchor="end" font-family="DM Mono, monospace" font-size="10.5" fill="#5A6B86">200</text>
      <text x="48" y="240" text-anchor="end" font-family="DM Mono, monospace" font-size="10.5" fill="#5A6B86">0</text>
      ${bars}
      ${callout}
    `;
  }

  btns.forEach((b) => b.addEventListener("click", () => draw(Number(b.dataset.layerStep))));
  draw(1);
}

/* ============================================================
   02 Cleveland & McGill 1984 盲测实验 + Tufte 数据墨水五步刀闸
   ============================================================ */
function mountSec02PerceptionAndInk() {
  // Part A: 盲测「B 是 A 的几倍？」
  const chBtns = [...document.querySelectorAll("[data-enc-channel]")];
  const svg = document.getElementById("s02-enc-svg");
  const guessInput = document.getElementById("s02-guess");
  const guessVal = document.getElementById("s02-guess-val");
  const submitBtn = document.getElementById("s02-submit");
  const nextBtn = document.getElementById("s02-next");
  const resultEl = document.getElementById("s02-result");

  const PAIRS = [
    { a: 210, b: 580, labelA: "Q1", labelB: "Q4" },
    { a: 180, b: 420, labelA: "A 组", labelB: "B 组" },
    { a: 160, b: 496, labelA: "旧版", labelB: "新版" },
  ];
  const CHANNELS = {
    bar: { name: "同基线柱高（排名第 1）", rank: "Cleveland & McGill 1984 最高精度通道" },
    pie: { name: "饼图扇区角度（排名靠中后）", rank: "角度与弧长易被高估或低估" },
    bubble: { name: "圆形气泡面积（排名靠后）", rank: "人眼常按直径而非面积估算，易严重低估倍率" },
    color: { name: "色阶明度深浅（排名垫底）", rank: "人眼对亮度比例极不敏感，无法精确读出倍数" },
  };
  let channel = "bubble";
  let pairIdx = 0;

  function renderEncoding(reveal) {
    const p = PAIRS[pairIdx];
    const ratio = p.b / p.a;
    chBtns.forEach((b) => {
      const on = b.dataset.encChannel === channel;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    let inner = "";
    if (channel === "bar") {
      const hA = 46;
      const hB = Math.round(hA * ratio);
      const base = 178;
      inner = `
        <line x1="56" y1="${base}" x2="364" y2="${base}" stroke="#112243" stroke-width="1.6"/>
        <rect x="112" y="${base - hA}" width="54" height="${hA}" rx="4" fill="#9EB4DE"/>
        <rect x="234" y="${base - hB}" width="54" height="${hB}" rx="4" fill="#2467DC"/>
        <text x="139" y="${base + 20}" text-anchor="middle" font-size="13" font-weight="700" fill="#112243">A（${p.labelA}）</text>
        <text x="261" y="${base + 20}" text-anchor="middle" font-size="13" font-weight="700" fill="#1850B8">B（${p.labelB}）</text>
        ${reveal ? `<text x="139" y="${base - hA - 8}" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" fill="#4A5A75">${p.a}</text><text x="261" y="${base - hB - 8}" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" font-weight="700" fill="#1850B8">${p.b}</text>` : ""}
      `;
    } else if (channel === "pie") {
      const total = p.a + p.b + p.a * 1.1;
      const angA = (p.a / total) * Math.PI * 2;
      const angB = (p.b / total) * Math.PI * 2;
      const cx = 210, cy = 104, r = 74;
      const pt = (a) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
      const a0 = -Math.PI / 2;
      const a1 = a0 + angA;
      const a2 = a1 + angB;
      const largeB = angB > Math.PI ? 1 : 0;
      inner = `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#E6ECF5"/>
        <path d="M${cx},${cy} L${pt(a0)} A${r},${r} 0 0,1 ${pt(a1)} Z" fill="#9EB4DE" stroke="#FFF" stroke-width="2"/>
        <path d="M${cx},${cy} L${pt(a1)} A${r},${r} 0 ${largeB},1 ${pt(a2)} Z" fill="#2467DC" stroke="#FFF" stroke-width="2"/>
        <text x="${cx + Math.cos(a0 + angA / 2) * (r + 18)}" y="${cy + Math.sin(a0 + angA / 2) * (r + 14)}" text-anchor="middle" font-size="13" font-weight="700" fill="#112243">A</text>
        <text x="${cx + Math.cos(a1 + angB / 2) * (r + 18)}" y="${cy + Math.sin(a1 + angB / 2) * (r + 14)}" text-anchor="middle" font-size="13" font-weight="700" fill="#1850B8">B</text>
      `;
    } else if (channel === "bubble") {
      const rA = 26;
      const rB = Math.round(rA * Math.sqrt(ratio));
      inner = `
        <circle cx="132" cy="108" r="${rA}" fill="#9EB4DE"/>
        <circle cx="272" cy="108" r="${rB}" fill="#2467DC"/>
        <text x="132" y="182" text-anchor="middle" font-size="13" font-weight="700" fill="#112243">A（面积基准）</text>
        <text x="272" y="182" text-anchor="middle" font-size="13" font-weight="700" fill="#1850B8">B（面积对照）</text>
      `;
    } else {
      inner = `
        <rect x="86" y="54" width="96" height="96" rx="10" fill="#A9C4F0" stroke="#DCE3EE"/>
        <rect x="238" y="54" width="96" height="96" rx="10" fill="#2467DC" stroke="#1850B8"/>
        <text x="134" y="176" text-anchor="middle" font-size="13" font-weight="700" fill="#112243">A（浅钴）</text>
        <text x="286" y="176" text-anchor="middle" font-size="13" font-weight="700" fill="#1850B8">B（深钴）</text>
      `;
    }

    svg.innerHTML = `
      <rect x="1" y="1" width="418" height="208" rx="10" fill="#FFFFFF" stroke="#DCE3EE"/>
      <text x="16" y="24" font-size="11.5" font-weight="600" fill="#4A5A75">${CHANNELS[channel].name}</text>
      ${inner}
    `;
  }

  if (svg && guessInput && submitBtn) {
    guessInput.addEventListener("input", () => {
      guessVal.textContent = `${Number(guessInput.value).toFixed(1)}×`;
    });
    chBtns.forEach((b) =>
      b.addEventListener("click", () => {
        channel = b.dataset.encChannel;
        resultEl.textContent = "拖动滑尺估一估「B 是 A 的多少倍」，再点右侧按钮揭晓误差。";
        resultEl.classList.remove("is-revealed");
        renderEncoding(false);
      })
    );
    submitBtn.addEventListener("click", () => {
      const p = PAIRS[pairIdx];
      const truth = p.b / p.a;
      const g = Number(guessInput.value);
      const errPct = Math.round((Math.abs(g - truth) / truth) * 100);
      renderEncoding(true);
      resultEl.classList.add("is-revealed");
      resultEl.innerHTML = `真实倍率是 <strong>${truth.toFixed(2)}×</strong>（${p.b} ÷ ${p.a}），你的盲估 <strong>${g.toFixed(1)}×</strong>，误差 <strong>${errPct}%</strong>。${CHANNELS[channel].rank}。`;
    });
    nextBtn.addEventListener("click", () => {
      pairIdx = (pairIdx + 1) % PAIRS.length;
      resultEl.textContent = "已换一组新数据，再拖滑尺盲估并提交对比！";
      resultEl.classList.remove("is-revealed");
      renderEncoding(false);
    });
    renderEncoding(false);
  }

  // Part B: Tufte 1983 数据墨水五步瘦身刀闸
  const inkChecks = [...document.querySelectorAll("[data-ink-step]")];
  const inkSvg = document.getElementById("s02-ink-svg");
  const inkMeter = document.getElementById("s02-ink-meter");
  if (!inkChecks.length || !inkSvg) return;

  function renderInk() {
    const flags = Object.fromEntries(inkChecks.map((c) => [c.dataset.inkStep, c.checked]));
    const cleanCount = Object.values(flags).filter(Boolean).length;
    const tier =
      cleanCount === 0
        ? "极低（装饰墨水淹没数据 · 示意）"
        : cleanCount <= 2
        ? "偏低（仍有明显图表垃圾 · 示意）"
        : cleanCount <= 4
        ? "良好（接近清爽直读 · 示意）"
        : "高（数据墨水主导画面 · 示意）";
    inkMeter.textContent = `已剥离 ${cleanCount}/5 项噪声 · 数据墨水比：${tier}`;

    const vals = [210, 320, 420, 580];
    const baseY = 172;
    const scale = 112 / 600;
    const rainbow = ["#E11D48", "#EA580C", "#16A34A", "#7C3AED"];

    let grid = "";
    [40, 84, 128].forEach((gy) => {
      grid += `<line x1="48" y1="${gy}" x2="386" y2="${gy}" stroke="${flags.grid ? "#E4EAF2" : "#475569"}" stroke-width="${flags.grid ? 1 : 1.4}" ${flags.grid ? 'stroke-dasharray="3 4"' : ""}/>`;
    });

    let bars = "";
    vals.forEach((v, i) => {
      const h = Math.round(v * scale);
      const y = baseY - h;
      const x = 74 + i * 78;
      const fill = flags.focus ? (i === 3 ? "#2467DC" : "#C4CEDF") : rainbow[i];
      if (!flags.shadow3d) {
        bars += `<rect x="${x + 6}" y="${y + 4}" width="40" height="${h}" fill="#94A3B8" opacity="0.45"/>`;
        bars += `<polygon points="${x},${y} ${x + 8},${y - 7} ${x + 48},${y - 7} ${x + 40},${y}" fill="${fill}" opacity="0.6"/>`;
      }
      bars += `<rect x="${x}" y="${y}" width="40" height="${h}" rx="${flags.shadow3d ? 3 : 0}" fill="${fill}"/>`;
      if (flags.direct) {
        bars += `<text x="${x + 20}" y="${y - 7}" text-anchor="middle" font-family="DM Mono, monospace" font-size="11.5" font-weight="${i === 3 ? 700 : 500}" fill="${i === 3 ? "#1850B8" : "#4A5A75"}">${v}</text>`;
      }
      bars += `<text x="${x + 20}" y="${baseY + 17}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="11.5" fill="#4A5A75">Q${i + 1}</text>`;
    });

    const box = flags.frame
      ? ""
      : `<rect x="44" y="28" width="346" height="148" fill="#E6ECF5" stroke="#334155" stroke-width="1.8"/>`;
    const legend = flags.direct
      ? ""
      : `<rect x="84" y="194" width="256" height="18" rx="3" fill="#F1F5F9" stroke="#94A3B8"/>
         <text x="212" y="206" text-anchor="middle" font-size="10.5" fill="#475569">■ Q1  ■ Q2  ■ Q3  ■ Q4（眼动需低头回查图例）</text>`;

    inkSvg.innerHTML = `
      <rect x="1" y="1" width="418" height="218" rx="10" fill="#FFFFFF" stroke="#DCE3EE"/>
      ${box}
      ${grid}
      <line x1="48" y1="${baseY}" x2="386" y2="${baseY}" stroke="#112243" stroke-width="1.5"/>
      ${bars}
      ${legend}
    `;
  }

  inkChecks.forEach((c) => c.addEventListener("change", renderInk));
  renderInk();
}

/* ============================================================
   03 深午夜蓝暗室：5 类翻车前后拖拽分屏帘幕对照器
   ============================================================ */
function mountSec03DarkroomCurtain() {
  const tabs = [...document.querySelectorAll("[data-fail-case]")];
  const slider = document.getElementById("s03-split");
  const splitStage = document.getElementById("s03-stage");
  const beforeLayer = document.getElementById("s03-before");
  const afterLayer = document.getElementById("s03-after");
  const divider = document.getElementById("s03-divider");
  const noteEl = document.getElementById("s03-note");
  if (!tabs.length || !slider || !beforeLayer || !afterLayer) return;

  const CASES = {
    trunc: {
      note: "左图把纵轴从 180 开始截断，让 Q4 看起来高出 Q1 十多倍；右图恢复 0 基线，长度忠实还原 2.76× 真实比例。",
      before: () => `
        <rect width="640" height="310" fill="#152545"/>
        <text x="24" y="34" font-size="13" font-weight="700" fill="#FF847A">翻车：纵轴从 180 起截断（谎言因子 4.8×）</text>
        <line x1="68" y1="252" x2="588" y2="252" stroke="#FF847A" stroke-width="1.6"/>
        <text x="58" y="256" text-anchor="end" font-family="DM Mono, monospace" font-size="11.5" font-weight="700" fill="#FF847A">180</text>
        <text x="58" y="164" text-anchor="end" font-family="DM Mono, monospace" font-size="11.5" fill="#9BB0D4">380</text>
        <text x="58" y="74" text-anchor="end" font-family="DM Mono, monospace" font-size="11.5" fill="#9BB0D4">580</text>
        <rect x="116" y="239" width="64" height="13" rx="3" fill="#FF847A"/>
        <rect x="234" y="191" width="64" height="61" rx="3" fill="#FF847A"/>
        <rect x="352" y="146" width="64" height="106" rx="3" fill="#FF847A"/>
        <rect x="470" y="74" width="64" height="178" rx="3" fill="#FF847A"/>
        <text x="148" y="232" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" fill="#FFD3CF">210</text>
        <text x="502" y="66" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" font-weight="700" fill="#FFD3CF">580</text>
        <text x="148" y="274" text-anchor="middle" font-size="12" fill="#C7D6EE">Q1</text>
        <text x="266" y="274" text-anchor="middle" font-size="12" fill="#C7D6EE">Q2</text>
        <text x="384" y="274" text-anchor="middle" font-size="12" fill="#C7D6EE">Q3</text>
        <text x="502" y="274" text-anchor="middle" font-size="12" fill="#C7D6EE">Q4</text>
      `,
      after: () => `
        <rect width="640" height="310" fill="#0F223D"/>
        <text x="616" y="34" text-anchor="end" font-size="13" font-weight="700" fill="#4DE0AE">修复：纵轴归零（谎言因子 1.0×）</text>
        <line x1="68" y1="252" x2="588" y2="252" stroke="#78AAFF" stroke-width="1.6"/>
        <text x="58" y="256" text-anchor="end" font-family="DM Mono, monospace" font-size="11.5" font-weight="700" fill="#4DE0AE">0</text>
        <text x="58" y="164" text-anchor="end" font-family="DM Mono, monospace" font-size="11.5" fill="#9BB0D4">300</text>
        <text x="58" y="74" text-anchor="end" font-family="DM Mono, monospace" font-size="11.5" fill="#9BB0D4">600</text>
        <rect x="116" y="190" width="64" height="62" rx="3" fill="#455E87"/>
        <rect x="234" y="157" width="64" height="95" rx="3" fill="#455E87"/>
        <rect x="352" y="128" width="64" height="124" rx="3" fill="#455E87"/>
        <rect x="470" y="80" width="64" height="172" rx="3" fill="#78AAFF"/>
        <text x="148" y="182" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" fill="#C7D6EE">210</text>
        <text x="502" y="72" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" font-weight="700" fill="#78AAFF">580</text>
        <text x="148" y="274" text-anchor="middle" font-size="12" fill="#C7D6EE">Q1</text>
        <text x="266" y="274" text-anchor="middle" font-size="12" fill="#C7D6EE">Q2</text>
        <text x="384" y="274" text-anchor="middle" font-size="12" fill="#C7D6EE">Q3</text>
        <text x="502" y="274" text-anchor="middle" font-size="12" fill="#4DE0AE">Q4 峰值</text>
      `,
    },
    rainbow: {
      note: "左图 8 根柱子各涂高饱和色，眼睛找不到重点；右图压灰 Q1–Q3，只给 Q4 实际与目标亮色，1 秒锁定主角。",
      before: () => `
        <rect width="640" height="310" fill="#152545"/>
        <text x="24" y="34" font-size="13" font-weight="700" fill="#FF847A">翻车：8 色彩虹柱 + 远置图例</text>
        <line x1="68" y1="238" x2="588" y2="238" stroke="#64748B" stroke-width="1.4"/>
        ${[
          [110, 174, 64, "#F43F5E"], [144, 171, 67, "#F97316"],
          [232, 141, 97, "#EAB308"], [266, 148, 90, "#22C55E"],
          [354, 111, 127, "#06B6D4"], [388, 124, 114, "#3B82F6"],
          [476, 68, 170, "#A855F7"], [510, 96, 142, "#EC4899"],
        ].map(([x, y, h, c]) => `<rect x="${x}" y="${y}" width="30" height="${h}" rx="3" fill="${c}"/>`).join("")}
        <text x="320" y="278" text-anchor="middle" font-size="11.5" fill="#CBD5E1">■ Q1实 ■ Q1目 ■ Q2实 ■ Q2目 ■ Q3实 ■ Q3目 ■ Q4实 ■ Q4目</text>
      `,
      after: () => `
        <rect width="640" height="310" fill="#0F223D"/>
        <text x="616" y="34" text-anchor="end" font-size="13" font-weight="700" fill="#4DE0AE">修复：灰化背景，只亮 Q4 对比</text>
        <line x1="68" y1="238" x2="588" y2="238" stroke="#78AAFF" stroke-width="1.4"/>
        ${[
          [110, 174, 64, "#3C5072"], [144, 171, 67, "#2E405E"],
          [232, 141, 97, "#3C5072"], [266, 148, 90, "#2E405E"],
          [354, 111, 127, "#3C5072"], [388, 124, 114, "#2E405E"],
          [476, 68, 170, "#78AAFF"], [510, 96, 142, "#FF847A"],
        ].map(([x, y, h, c]) => `<rect x="${x}" y="${y}" width="30" height="${h}" rx="3" fill="${c}"/>`).join("")}
        <text x="491" y="60" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" font-weight="700" fill="#78AAFF">580</text>
        <text x="525" y="88" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" font-weight="700" fill="#FF847A">480</text>
        <text x="508" y="274" text-anchor="middle" font-size="12" font-weight="700" fill="#4DE0AE">Q4 超额 +100 万</text>
      `,
    },
    pie8: {
      note: "左图把 8 个切片硬塞进饼图，微弱差距根本看不清；右图改为横向排序条形图，第一名与末名一目了然。",
      before: () => `
        <rect width="640" height="310" fill="#152545"/>
        <text x="24" y="34" font-size="13" font-weight="700" fill="#FF847A">翻车：8 块饼图难辨先后</text>
        <circle cx="310" cy="172" r="88" fill="#3B82F6"/>
        <path d="M310,172 L310,84 A88,88 0 0,1 384,126 Z" fill="#F43F5E" stroke="#152545" stroke-width="2"/>
        <path d="M310,172 L384,126 A88,88 0 0,1 398,176 Z" fill="#F97316" stroke="#152545" stroke-width="2"/>
        <path d="M310,172 L398,176 A88,88 0 0,1 378,228 Z" fill="#EAB308" stroke="#152545" stroke-width="2"/>
        <path d="M310,172 L378,228 A88,88 0 0,1 322,259 Z" fill="#22C55E" stroke="#152545" stroke-width="2"/>
        <path d="M310,172 L322,259 A88,88 0 0,1 260,244 Z" fill="#06B6D4" stroke="#152545" stroke-width="2"/>
        <path d="M310,172 L260,244 A88,88 0 0,1 225,194 Z" fill="#A855F7" stroke="#152545" stroke-width="2"/>
        <path d="M310,172 L225,194 A88,88 0 0,1 244,114 Z" fill="#EC4899" stroke="#152545" stroke-width="2"/>
        <text x="310" y="286" text-anchor="middle" font-size="12" fill="#FFD3CF">谁排第 2、谁排第 3？角度肉眼难辨</text>
      `,
      after: () => `
        <rect width="640" height="310" fill="#0F223D"/>
        <text x="616" y="34" text-anchor="end" font-size="13" font-weight="700" fill="#4DE0AE">修复：按值排序的横向条形图</text>
        ${[
          ["华东大区", 340, "#78AAFF"],
          ["华南大区", 286, "#4A6590"],
          ["华北大区", 252, "#4A6590"],
          ["西南大区", 198, "#4A6590"],
          ["其余 4 区合计", 156, "#364B6E"],
        ].map(([name, w, c], i) => `
          <text x="150" y="${90 + i * 42}" text-anchor="end" font-size="12.5" fill="#DCE6F5">${name}</text>
          <rect x="166" y="${75 + i * 42}" width="${w}" height="22" rx="4" fill="${c}"/>
          <text x="${174 + w}" y="${91 + i * 42}" font-family="DM Mono, monospace" font-size="12" fill="${i === 0 ? "#4DE0AE" : "#9BB0D4"}">${Math.round(w / 10)}%</text>
        `).join("")}
      `,
    },
    title: {
      note: "左图顶部只放「季度统计表」，听众要自己归纳结论；右图把核心判断写进标题，图表瞬间成为论据。",
      before: () => `
        <rect width="640" height="310" fill="#152545"/>
        <rect x="34" y="34" width="572" height="54" rx="6" fill="#1E3156" stroke="#FF847A" stroke-dasharray="4 3"/>
        <text x="52" y="66" font-size="18" font-weight="700" fill="#FFD3CF">2024 年度各季度销售数据统计</text>
        <text x="52" y="114" font-size="12.5" fill="#9BB0D4">听众心里问：所以呢？涨了还是跌了？达标了吗？</text>
        <rect x="76" y="190" width="54" height="72" rx="3" fill="#4A6590"/>
        <rect x="196" y="166" width="54" height="96" rx="3" fill="#4A6590"/>
        <rect x="316" y="144" width="54" height="118" rx="3" fill="#4A6590"/>
        <rect x="436" y="114" width="54" height="148" rx="3" fill="#4A6590"/>
      `,
      after: () => `
        <rect width="640" height="310" fill="#0F223D"/>
        <rect x="34" y="34" width="56" height="28" rx="6" fill="#D84339"/>
        <text x="62" y="53" text-anchor="middle" font-size="12.5" font-weight="700" fill="#FFFFFF">结论</text>
        <text x="104" y="55" font-size="18.5" font-weight="800" fill="#FFFFFF">Q2–Q4 连续增长，Q4 超目标 100 万创新高</text>
        <text x="104" y="80" font-size="12.5" fill="#4DE0AE">先给观点，再用右侧亮柱和标注秒速印证</text>
        <rect x="76" y="190" width="54" height="72" rx="3" fill="#3D5275"/>
        <rect x="196" y="166" width="54" height="96" rx="3" fill="#3D5275"/>
        <rect x="316" y="144" width="54" height="118" rx="3" fill="#3D5275"/>
        <rect x="436" y="114" width="54" height="148" rx="3" fill="#78AAFF"/>
        <rect x="500" y="138" width="54" height="124" rx="3" fill="#FF847A"/>
      `,
    },
    dual: {
      note: "左图靠随意调整左右双纵轴刻度，把无关的两条线硬拼出「交叉突破」假象；右图拆成上下同时间轴双子图，关系真假一眼看穿。",
      before: () => `
        <rect width="640" height="310" fill="#152545"/>
        <text x="24" y="34" font-size="13" font-weight="700" fill="#FF847A">翻车：双纵轴任意缩放，强行造出「黄金交叉」</text>
        <line x1="64" y1="68" x2="64" y2="250" stroke="#78AAFF" stroke-width="2"/>
        <line x1="576" y1="68" x2="576" y2="250" stroke="#FF847A" stroke-width="2"/>
        <text x="56" y="80" text-anchor="end" font-size="10.5" fill="#78AAFF">600万</text>
        <text x="584" y="80" font-size="10.5" fill="#FF847A">12.5%</text>
        <text x="584" y="250" font-size="10.5" fill="#FF847A">11.8%</text>
        <polyline points="110,210 250,180 390,145 530,92" fill="none" stroke="#78AAFF" stroke-width="3"/>
        <polyline points="110,126 250,152 390,164 530,196" fill="none" stroke="#FF847A" stroke-width="3"/>
        <circle cx="348" cy="158" r="14" fill="none" stroke="#FF847A" stroke-width="2" stroke-dasharray="3 3"/>
        <text x="348" y="280" text-anchor="middle" font-size="12" fill="#FFD3CF">交点纯属刻度凑出来的，换个刻度交点立刻漂移</text>
      `,
      after: () => `
        <rect width="640" height="310" fill="#0F223D"/>
        <text x="616" y="34" text-anchor="end" font-size="13" font-weight="700" fill="#4DE0AE">修复：拆成上下对齐双子图（Small Multiples）</text>
        <rect x="64" y="60" width="512" height="82" rx="6" fill="#15294A"/>
        <text x="78" y="80" font-size="11.5" font-weight="700" fill="#78AAFF">上栏：销售额（万元，0 基线）</text>
        <polyline points="120,128 256,116 392,104 528,84" fill="none" stroke="#78AAFF" stroke-width="3"/>
        <rect x="64" y="162" width="512" height="82" rx="6" fill="#15294A"/>
        <text x="78" y="182" font-size="11.5" font-weight="700" fill="#FF847A">下栏：退货率（%，仅微降 0.5pp）</text>
        <polyline points="120,206 256,210 392,213 528,216" fill="none" stroke="#FF847A" stroke-width="3"/>
        <text x="320" y="274" text-anchor="middle" font-size="12" fill="#4DE0AE">共享同一横向时间轴，各自守住诚实比例</text>
      `,
    },
  };

  let curCase = "trunc";
  function renderCase() {
    const c = CASES[curCase];
    tabs.forEach((t) => {
      const on = t.dataset.failCase === curCase;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    });
    beforeLayer.innerHTML = c.before();
    afterLayer.innerHTML = c.after();
    noteEl.textContent = c.note;
  }

  function updateSplit(pct) {
    const clamped = Math.max(8, Math.min(92, pct));
    slider.value = String(Math.round(clamped));
    afterLayer.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    divider.style.left = `${clamped}%`;
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      curCase = t.dataset.failCase;
      renderCase();
    })
  );
  slider.addEventListener("input", () => updateSplit(Number(slider.value)));

  // 支持直接在暗室舞台左右拖拽分屏帘幕
  let dragging = false;
  const setFromClientX = (cx) => {
    const r = splitStage.getBoundingClientRect();
    updateSplit(((cx - r.left) / Math.max(1, r.width)) * 100);
  };
  splitStage.addEventListener("pointerdown", (e) => {
    dragging = true;
    splitStage.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  });
  splitStage.addEventListener("pointermove", (e) => {
    if (dragging) setFromClientX(e.clientX);
  });
  splitStage.addEventListener("pointerup", () => {
    dragging = false;
  });

  renderCase();
  updateSplit(50);
}

/* ============================================================
   04 历史源流：五代里程碑微缩 SVG 原理图版
   ============================================================ */
function mountSec04Origins() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const plate = document.getElementById("s04-plate");
  const cap = document.getElementById("s04-cap");
  if (!btns.length || !plate) return;

  const ERAS = {
    playfair: {
      caption: "1786 · William Playfair《商业与政治图集》：因缺少苏格兰历年序列，首创用平行横条长度对比各贸易国进出口额。",
      svg: `
        <rect x="1" y="1" width="438" height="198" rx="10" fill="#FBF8F1" stroke="#D8CEBE"/>
        <text x="20" y="28" font-family="Instrument Serif, serif" font-size="16" fill="#112243">Exports &amp; Imports of Scotland (1780–1781)</text>
        ${[
          ["Ireland", 210, 145],
          ["Holland", 178, 96],
          ["Germany", 136, 118],
          ["Russia", 190, 52],
        ].map(([k, a, b], i) => `
          <text x="74" y="${64 + i * 32}" text-anchor="end" font-size="11.5" fill="#3B4252">${k}</text>
          <rect x="84" y="${52 + i * 32}" width="${a}" height="9" fill="#112243"/>
          <rect x="84" y="${62 + i * 32}" width="${b}" height="7" fill="#C4352A" opacity="0.82"/>
        `).join("")}
        <text x="20" y="184" font-size="11" fill="#5A6B86">首次把账簿数字转化为同一基线上的空间长度比较</text>
      `,
    },
    minto: {
      caption: "1978–1987 · Barbara Minto《金字塔原理》& 1985 Gene Zelazny《用图表说话》：确立管理演示的「结论先行动作标题」与「先定信息关系、再挑图型」。",
      svg: `
        <rect x="1" y="1" width="438" height="198" rx="10" fill="#FFFFFF" stroke="#DCE3EE"/>
        <rect x="112" y="20" width="216" height="36" rx="7" fill="#D84339"/>
        <text x="220" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF">顶层唯一结论（Action Title）</text>
        <line x1="220" y1="56" x2="220" y2="78" stroke="#112243" stroke-width="1.5"/>
        <line x1="88" y1="78" x2="352" y2="78" stroke="#112243" stroke-width="1.5"/>
        <line x1="88" y1="78" x2="88" y2="96" stroke="#112243" stroke-width="1.5"/>
        <line x1="220" y1="78" x2="220" y2="96" stroke="#112243" stroke-width="1.5"/>
        <line x1="352" y1="78" x2="352" y2="96" stroke="#112243" stroke-width="1.5"/>
        ${[
          [32, "时间对比 → 柱/折线"],
          [164, "成分占比 → 条/堆叠"],
          [296, "实际/目标 → 分组柱"],
        ].map(([x, txt]) => `
          <rect x="${x}" y="96" width="112" height="44" rx="6" fill="#E8EDF4" stroke="#2467DC"/>
          <text x="${x + 56}" y="122" text-anchor="middle" font-size="11" font-weight="600" fill="#112243">${txt}</text>
        `).join("")}
        <text x="220" y="174" text-anchor="middle" font-size="11.5" fill="#4A5A75">观点在顶，图表在下：先亮立场再给证据</text>
      `,
    },
    tufte: {
      caption: "1983 · Edward Tufte《定量信息的视觉展示》：提出数据墨水比、图表垃圾与谎言因子，奠定克制、高保真的信息设计伦理。",
      svg: `
        <rect x="1" y="1" width="438" height="198" rx="10" fill="#FFFFFF" stroke="#DCE3EE"/>
        <text x="22" y="34" font-family="Instrument Serif, serif" font-size="17" fill="#112243">Lie Factor = Visual Effect / Data Effect</text>
        <rect x="24" y="54" width="182" height="96" rx="8" fill="#FFF4F3" stroke="#FC6A5D" stroke-dasharray="4 3"/>
        <text x="115" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="#BF3228">擦掉图表垃圾</text>
        <text x="115" y="102" text-anchor="middle" font-size="11.5" fill="#4A5A75">粗网格 / 3D 斜面 / 重边框</text>
        <text x="115" y="124" text-anchor="middle" font-size="11.5" fill="#4A5A75">多余背景底色 / 装饰插图</text>
        <rect x="234" y="54" width="182" height="96" rx="8" fill="#EDF3FD" stroke="#2467DC"/>
        <text x="325" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="#1850B8">保留数据墨水</text>
        <text x="325" y="102" text-anchor="middle" font-size="11.5" fill="#16233B">诚实 0 基线 + 直接数据</text>
        <text x="325" y="124" text-anchor="middle" font-size="11.5" fill="#16233B">删去即丢失信息的墨迹</text>
        <text x="220" y="178" text-anchor="middle" font-size="11.5" fill="#5A6B86">理想谎言因子 = 1.0：图形变化幅度忠实匹配数据变化</text>
      `,
    },
    cleveland: {
      caption: "1984 · Cleveland & McGill（JASA）与 2010 Heer & Bostock（CHI）：用实验把视觉解码通道按精度排序，解释了为何柱状与点图远胜饼图与气泡。",
      svg: `
        <rect x="1" y="1" width="438" height="198" rx="10" fill="#FFFFFF" stroke="#DCE3EE"/>
        ${[
          ["1. 同刻度位置（柱状/点图）", 310, "#2467DC"],
          ["2. 非同基线长度（堆叠柱）", 242, "#4F83E2"],
          ["3. 角度与斜率（饼图/折线）", 174, "#8AAAE8"],
          ["4. 面积大小（气泡/树图）", 118, "#FC6A5D"],
          ["5. 颜色深浅（热力色阶）", 74, "#D84339"],
        ].map(([lbl, w, c], i) => `
          <text x="22" y="${42 + i * 32}" font-size="11.5" font-weight="600" fill="#16233B">${lbl}</text>
          <rect x="202" y="${29 + i * 32}" width="${Math.round(w * 0.68)}" height="16" rx="3" fill="${c}"/>
        `).join("")}
        <text x="22" y="188" font-size="10.5" fill="#5A6B86">条宽示意相对判读准确度（越长越准确，源自 1984 与 2010 实证排序）</text>
      `,
    },
    knaflic: {
      caption: "2015 · Cole Nussbaumer Knaflic《用数据讲故事》：把前注意属性（灰化背景 + 单色高亮 + 紧贴标注）变成商业演示的标准流程。",
      svg: `
        <rect x="1" y="1" width="438" height="198" rx="10" fill="#FFFFFF" stroke="#DCE3EE"/>
        <rect x="44" y="114" width="42" height="52" rx="3" fill="#CBD5E1"/>
        <rect x="108" y="94" width="42" height="72" rx="3" fill="#CBD5E1"/>
        <rect x="172" y="76" width="42" height="90" rx="3" fill="#CBD5E1"/>
        <rect x="236" y="42" width="42" height="124" rx="3" fill="#2467DC"/>
        <line x1="28" y1="166" x2="306" y2="166" stroke="#112243" stroke-width="1.5"/>
        <polyline points="282,46 306,46 318,64" fill="none" stroke="#FC6A5D" stroke-width="1.6"/>
        <rect x="318" y="48" width="102" height="58" rx="8" fill="#FFF4F3" stroke="#FC6A5D" stroke-dasharray="4 3"/>
        <text x="369" y="72" text-anchor="middle" font-size="11.5" font-weight="700" fill="#BF3228">单色聚焦</text>
        <text x="369" y="92" text-anchor="middle" font-size="11" fill="#16233B">灰色托底衬主角</text>
        <text x="220" y="188" text-anchor="middle" font-size="11.5" fill="#4A5A75">灰色不是单调，而是把前注意通道留给唯一关键数据</text>
      `,
    },
  };

  function show(id) {
    const e = ERAS[id];
    btns.forEach((b) => {
      const on = b.dataset.era === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    plate.innerHTML = e.svg;
    cap.textContent = e.caption;
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.era)));
  show("playfair");
}

/* ============================================================
   05 什么时候别用：会议室场景分诊路由器
   ============================================================ */
function mountSec05Triage() {
  const radios = [...document.querySelectorAll('input[name="s05-case"]')];
  const verdict = document.getElementById("s05-verdict");
  if (!radios.length || !verdict) return;

  const MAP = {
    chart: {
      ok: true,
      badge: "适合使用 · 349 数据图表页",
      title: "四季度趋势 + 实际/目标差额：正是 349 的主场",
      body: "同时存在时间序列变化与目标对照，用 0 基线分组柱状图或双折线配珊瑚标注，能让听众 3 秒内既看懂走势又核对达成率。",
      link: "",
    },
    bignum: {
      ok: false,
      badge: "建议换页 · 别用图表稀释焦点",
      title: "只记「72%」这一个数字时，画图反而添乱",
      body: "如果整页只需要听众带走一个颠覆性的关键数字，把数字单独放大做视觉锚点远比画四根柱子更有力量。",
      link: { label: "转看 344 大数字页幻灯片版式 →", href: "https://layout.xiaoxiaodong.ai/344/play/" },
    },
    timeline: {
      ok: false,
      badge: "建议换页 · 别把里程碑塞进柱状图",
      title: "讲 5 个上线阶段顺序，重点是节点演进而非数值大小",
      body: "没有需要量化比较的纵轴指标时，强行套柱状图只会造出无意义的条形高度。",
      link: { label: "转看 346 时间线页幻灯片版式 →", href: "https://layout.xiaoxiaodong.ai/346/play/" },
    },
    table: {
      ok: false,
      badge: "建议换载体 · 演示页不扛精确查账",
      title: "18 个科目的两位小数明细，交给表格附件",
      body: "图表擅长暴露趋势、峰值和落差；需要逐行检索精确数值时，在演示页只亮 Top 3 异常项，把全量明细表放到会后文档。",
      link: { label: "若做双维度定性归类，可看 348 矩阵页 →", href: "https://layout.xiaoxiaodong.ai/348/play/" },
    },
  };

  function update(val) {
    const m = MAP[val] || MAP.chart;
    verdict.className = `triage-verdict ${m.ok ? "is-ok" : "is-alt"}`;
    verdict.innerHTML = `
      <span class="triage-pill">${m.badge}</span>
      <h3>${m.title}</h3>
      <p>${m.body}</p>
      ${m.link ? `<a class="triage-link" href="${m.link.href}" target="_blank" rel="noopener">${m.link.label}</a>` : ""}
    `;
  }

  radios.forEach((r) => r.addEventListener("change", () => update(r.value)));
  update("chart");
}

/* ============================================================
   06 深午夜蓝考场：两道单变量四选一 SVG 活体幻灯片小练习
   （严格中性标签 A/B/C/D，绝不剧透好坏！）
   ============================================================ */
function mountSec06Quiz() {
  const qTabs = [...document.querySelectorAll("[data-quiz-q]")];
  const promptEl = document.getElementById("s06-prompt");
  const gridEl = document.getElementById("s06-grid");
  const feedbackEl = document.getElementById("s06-feedback");
  if (!qTabs.length || !gridEl) return;

  function miniSlideSVG(variant) {
    const baseY = 122;
    const isTrunc = variant === "trunc";
    const isTopic = variant === "topic";
    const isYoY = variant === "yoy";
    const isPie = variant === "pie";
    const isRainbow = variant === "rainbow";
    const is3d = variant === "bar3d";

    const headText = isTopic ? "2024 年度各季度销售统计图表" : "Q2–Q4 连续增长，Q4 达全年峰值";
    const headPill = isTopic
      ? `<rect x="12" y="10" width="38" height="16" rx="4" fill="#334B72"/><text x="31" y="21" text-anchor="middle" font-size="9" fill="#CBD5E1">主题</text>`
      : `<rect x="12" y="10" width="38" height="16" rx="4" fill="#D84339"/><text x="31" y="21" text-anchor="middle" font-size="9" font-weight="700" fill="#FFF">结论</text>`;

    let chart = "";
    if (isPie) {
      chart = `
        <circle cx="136" cy="84" r="38" fill="#2467DC"/>
        <path d="M136,84 L136,46 A38,38 0 0,1 171,70 Z" fill="#93B4EE" stroke="#152545" stroke-width="1.5"/>
        <path d="M136,84 L171,70 A38,38 0 0,1 162,113 Z" fill="#5D8CE3" stroke="#152545" stroke-width="1.5"/>
        <circle cx="136" cy="84" r="21" fill="#FC6A5D" stroke="#152545" stroke-width="1.5"/>
        <text x="190" y="76" font-size="9.5" fill="#CBD5E1">外环：实际</text>
        <text x="190" y="94" font-size="9.5" fill="#FF847A">内环：目标</text>
      `;
    } else {
      const vals = [210, 320, 420, 580];
      const tgts = [220, 300, 380, 480];
      const yMin = isTrunc ? 180 : 0;
      const ySpan = 600 - yMin;
      const rCols = ["#F43F5E", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#A855F7", "#EC4899"];

      chart += `<line x1="34" y1="${baseY}" x2="226" y2="${baseY}" stroke="#9BB0D4" stroke-width="1.2"/>`;
      chart += `<text x="30" y="${baseY + 3}" text-anchor="end" font-family="DM Mono, monospace" font-size="9" fill="${isTrunc ? "#FF847A" : "#9BB0D4"}">${yMin}</text>`;
      chart += `<text x="30" y="54" text-anchor="end" font-family="DM Mono, monospace" font-size="9" fill="#9BB0D4">600</text>`;

      vals.forEach((v, i) => {
        const x = 48 + i * 44;
        const hA = Math.max(4, Math.round(((v - yMin) / ySpan) * 68));
        const hT = Math.max(4, Math.round(((tgts[i] - yMin) / ySpan) * 68));
        const cA = isRainbow ? rCols[i * 2] : i === 3 ? "#78AAFF" : "#4A6590";
        const cT = isRainbow ? rCols[i * 2 + 1] : i === 3 ? "#FF847A" : "#384E73";
        if (is3d) {
          chart += `<polygon points="${x},${baseY - hA} ${x + 6},${baseY - hA - 6} ${x + 20},${baseY - hA - 6} ${x + 14},${baseY - hA}" fill="#B7D0FF"/>`;
          chart += `<polygon points="${x + 14},${baseY - hA} ${x + 20},${baseY - hA - 6} ${x + 20},${baseY - 6} ${x + 14},${baseY}" fill="#2E5496"/>`;
        }
        chart += `<rect x="${x}" y="${baseY - hA}" width="14" height="${hA}" rx="${is3d ? 0 : 2}" fill="${cA}"/>`;
        chart += `<rect x="${x + 16}" y="${baseY - hT}" width="14" height="${hT}" rx="${is3d ? 0 : 2}" fill="${cT}"/>`;
        chart += `<text x="${x + 15}" y="${baseY + 12}" text-anchor="middle" font-size="9" fill="#9BB0D4">Q${i + 1}</text>`;
      });

      chart += `<rect x="234" y="64" width="74" height="44" rx="5" fill="#10203C" stroke="#FF847A" stroke-dasharray="3 2"/>
        <text x="271" y="82" text-anchor="middle" font-size="8.8" fill="#FFFFFF">Q4 超目标</text>
        <text x="271" y="96" text-anchor="middle" font-size="8.8" fill="#FF847A">+100 万元</text>`;
    }

    const kpiBar = isYoY
      ? `<rect x="12" y="142" width="296" height="24" rx="5" fill="#10203C" stroke="#364F78"/>
         <text x="22" y="157" font-size="9" fill="#DCE6F5">同比增长 +38% (Q4 vs Q1) · 最高 Q4 · 达成 121%</text>`
      : `<rect x="12" y="142" width="296" height="24" rx="5" fill="#10203C" stroke="#2A426A"/>
         <text x="22" y="157" font-size="9" fill="#DCE6F5">${isRainbow ? "■Q1实 ■Q1目 ■Q2实 ■Q2目 ■Q3实 ■Q3目 ■Q4实 ■Q4目" : "环比 +38% (Q4 vs Q3) · 最高 Q4 · 达成 121%"}</text>`;

    return `
      <svg viewBox="0 0 320 176" width="100%" aria-hidden="true">
        <rect x="1" y="1" width="318" height="174" rx="8" fill="#152545" stroke="#2D456E"/>
        ${headPill}
        <text x="56" y="21.5" font-size="10.5" font-weight="700" fill="#FFFFFF">${headText}</text>
        <line x1="12" y1="32" x2="308" y2="32" stroke="#2B4066" stroke-dasharray="3 3"/>
        ${chart}
        ${kpiBar}
      </svg>
    `;
  }

  const QUESTIONS = [
    {
      id: "q1",
      prompt: "第 1 题：四页都汇报同一组 Q1–Q4 销售数据，版面同样整洁。哪一页既没有比例失真、又做到结论先行且指标口径经得起追问？",
      answer: "A",
      options: [
        { key: "A", variant: "good", explain: "正确。纵轴守住 0 基线，顶部先亮判断句结论，Q4 标注差额准确，且底部明确写清 +38% 是 Q4 比 Q3 的环比增长。" },
        { key: "B", variant: "trunc", explain: "只差在纵轴起点：把纵轴从 180 截断，让 Q1 柱被压成一条细缝，视觉差距夸大超过 4 倍，构成 Tufte 谎言因子失真。" },
        { key: "C", variant: "topic", explain: "只差在标题性质：顶部退回空壳名词标题「销售统计图表」，听众必须自己读完柱子再提炼观点。" },
        { key: "D", variant: "yoy", explain: "只差在重点数据口径：把 (580−420)÷420 = +38% 错标成了「同比增长 Q4 vs Q1」（Q4 比 Q1 实为 +176%，且同比须对去年同期）。" },
      ],
    },
    {
      id: "q2",
      prompt: "第 2 题：四页都守住了 0 基线和结论先行标题，唯独图表编码各不相同。哪一页最利于观众在 3 秒内精确比较「实际 vs 目标」？",
      answer: "B",
      options: [
        { key: "A", variant: "pie", explain: "只差在图表类型：双环饼图靠角度与弧长编码，既违背 Cleveland & McGill 的精度排序，也难以读出 Q4 实际超出目标的具体差额。" },
        { key: "B", variant: "good", explain: "正确。二维平面同基线分组柱状图利用排名第一的「同刻度位置」编码，配合灰蓝聚焦，一眼锁定 Q4 超额突破。" },
        { key: "C", variant: "rainbow", explain: "只差在配色编码：8 根柱子各用一种饱和色加底部图例，眼球不得不在柱体和图例间往返解码。" },
        { key: "D", variant: "bar3d", explain: "只差在 3D 透视：立体顶面斜向上抬，前棱与背后刻度线产生视差偏移，反而破坏精准读数。" },
      ],
    },
  ];

  let curQ = 0;
  let picked = { q1: null, q2: null };

  function renderQ() {
    const q = QUESTIONS[curQ];
    qTabs.forEach((t, i) => {
      const on = i === curQ;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    });
    promptEl.textContent = q.prompt;
    const chosen = picked[q.id];

    gridEl.innerHTML = q.options
      .map((opt) => {
        const isSel = chosen === opt.key;
        const isRight = chosen && opt.key === q.answer;
        const isWrong = isSel && opt.key !== q.answer;
        return `
          <button type="button" class="quiz-opt${isSel ? " is-selected" : ""}${isRight ? " is-right" : ""}${isWrong ? " is-wrong" : ""}" data-opt="${opt.key}" aria-pressed="${isSel}">
            <span class="quiz-opt-head">
              <span class="quiz-key">方案 ${opt.key}</span>
              ${chosen ? `<span class="quiz-mark">${opt.key === q.answer ? "✓ 最佳" : isWrong ? "× 有硬伤" : ""}</span>` : ""}
            </span>
            <span class="quiz-svg-wrap">${miniSlideSVG(opt.variant)}</span>
          </button>
        `;
      })
      .join("");

    gridEl.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[q.id] = btn.dataset.opt;
        renderQ();
      });
    });

    if (!chosen) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = "<p>仔细观察四页唯一不同的那一处细节，点击你认为最严谨的一页查看单变量解析。</p>";
    } else {
      const ok = chosen === q.answer;
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-warn"}`;
      feedbackEl.innerHTML = `
        <p class="quiz-fb-head">${ok ? `判断准确！方案 ${q.answer} 四项全过。` : `你选了方案 ${chosen}，正确答案是方案 ${q.answer}。`}</p>
        <ul class="quiz-fb-list">
          ${q.options.map((o) => `<li class="${o.key === q.answer ? "is-ans" : ""}"><strong>方案 ${o.key}：</strong>${o.explain}</li>`).join("")}
        </ul>
      `;
    }
  }

  qTabs.forEach((t, i) =>
    t.addEventListener("click", () => {
      curQ = i;
      renderQ();
    })
  );
  renderQ();
}

/* ============================================================
   07 原海报灯箱（点击放大、滚轮缩放、拖拽平移、Esc 关闭，draggable="false"）
   ============================================================ */
function mountSec07PosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const dlg = document.getElementById("poster-modal");
  const stage = document.getElementById("poster-modal-stage");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomIn = document.getElementById("poster-zin");
  const zoomOut = document.getElementById("poster-zout");
  const zoomReset = document.getElementById("poster-zreset");
  const zoomRead = document.getElementById("poster-zval");
  if (!poster || !dlg || !modalImg) return;

  let scale = 1, tx = 0, ty = 0, drag = null;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomRead.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    modalImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dlg.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    if (dlg.hidden) return;
    dlg.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  poster.addEventListener("click", openModal);
  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target === stage) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dlg.hidden) closeModal();
  });

  zoomIn?.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });
  stage?.addEventListener(
    "wheel",
    (e) => {
      if (dlg.hidden) return;
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      if (scale <= 1) { tx = 0; ty = 0; }
      applyTransform();
    },
    { passive: false }
  );
  modalImg.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    modalImg.setPointerCapture?.(e.pointerId);
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => {
    drag = null;
  });
}
