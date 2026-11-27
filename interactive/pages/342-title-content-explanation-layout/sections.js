// 342 内容与标题说明 幻灯片版式 — 01–07 节独立交互模块
// 每节采用不同交互形态，不与相邻章节重复控件。

import { loop, pixelRatio } from "../../lib/stage.js";

/* ==================== 01 四根结构柱：X-Ray 透视剥离灯箱 ==================== */
const XRAY_DATA = {
  all: {
    title: "四根柱子合体：一页幻灯片的清晰骨架",
    quote: "原海报核心提示：「标题引导注意，内容建立信任，结构清晰，信息更有力量。」",
    detail:
      "层级决定第一眼落哪里，对齐决定目光顺不顺，阅读节奏决定因果怎么连，强调重点决定散场后留什么。四层互相咬合，观众 5 秒就能复述主旨。",
    fail: "点上方任意单层开关，单独点亮该结构层，看拿掉它之后页面为什么立刻塌架。",
  },
  hierarchy: {
    title: "第一柱 · 层级（通过大小、粗细、色彩建立信息层级关系）",
    quote: "原海报原话：「通过大小、粗细、色彩，建立信息层级关系」",
    detail:
      "顶部标题用 2× 以上主次字号差与加粗墨黑稳稳压住全场，中段三步标题次之，说明与支持短句最轻。目光不必思考，自动按重量顺序往下走。",
    fail: "如果失去层级：标题与正文差不多大，整页变成均质灰砖，听众不知道先读哪一句。",
  },
  alignment: {
    title: "第二柱 · 对齐（统一左对齐与模块间距，形成稳定的视觉秩序）",
    quote: "原海报原话：「统一左对齐与模块间距，形成稳定的视觉秩序」",
    detail:
      "标题三角、内容方块、支持模块与底部横幅全钉死在同一条左锚线上，水平模块等距切分，外圈留出 6%–10% 安全呼吸边距。",
    fail: "如果失去对齐：每层起笔参差错牙，观众每换行都要重新定位起点，专业感瞬间瓦解。",
  },
  rhythm: {
    title: "第三柱 · 阅读节奏（由总到分，由简到繁，引导视线自然流动）",
    quote: "原海报原话：「由总到分，由简到繁，引导视线自然流动」",
    detail:
      "先由顶部一句总论定调，再横向顺走 01 提出观点 → 02 解释说明 → 03 总结升华，最后由下层四枚精简支持槽补充事实细节。",
    fail: "如果失去节奏：把总结倒挂到前面，或退化成无序平铺列表，观众读完仍不知道因果先后。",
  },
  emphasis: {
    title: "第四柱 · 强调重点（用色块与图标突出关键信息，帮助记忆与理解）",
    quote: "原海报原话：「用色块与图标突出关键信息，帮助记忆与理解」",
    detail:
      "全页 85% 以上面积留给冷静的象牙纸、燕麦灰与深苔藓绿，高饱和赤陶红橙只给顶部小三角和底部「核心提示」横幅，一击定锚。",
    fail: "如果失去克制：把标题、三步卡片和支持槽全涂满亮色，重点互相抢戏等于全页没重点。",
  },
};

function renderXraySvg(layer) {
  const dim = (k) => (layer === "all" || layer === k ? 1 : 0.16);
  const hiStroke = (k) => (layer === k ? "#CB6627" : "none");
  return `
  <svg viewBox="0 0 600 400" role="img" aria-label="幻灯片四层结构透视解剖图">
    <rect x="6" y="6" width="588" height="388" rx="12" fill="#FAF6EC" stroke="#D0C9B5" stroke-width="1.5"/>

    <!-- 对齐参考线层 -->
    <g opacity="${layer === "alignment" ? 1 : layer === "all" ? 0.55 : 0.08}">
      <line x1="44" y1="22" x2="44" y2="378" stroke="#506E59" stroke-width="1.8" stroke-dasharray="5 4"/>
      <line x1="556" y1="22" x2="556" y2="378" stroke="#506E59" stroke-width="1.2" stroke-dasharray="4 4"/>
      <rect x="44" y="26" width="512" height="348" fill="none" stroke="${layer === "alignment" ? "#CB6627" : "#506E59"}" stroke-width="${layer === "alignment" ? 2 : 1}" stroke-dasharray="5 4"/>
      <text x="50" y="21" font-size="11" font-family="IBM Plex Mono, monospace" fill="#2D4735">LEFT ANCHOR 44px · EQUAL GAPS</text>
    </g>

    <!-- 层级层（标题与字号重量） -->
    <g opacity="${dim("hierarchy")}">
      <polygon points="44,44 58,52 44,60" fill="#CB6627"/>
      <rect x="66" y="38" width="320" height="24" rx="4" fill="#141915"/>
      <rect x="66" y="69" width="230" height="10" rx="3" fill="#6F7A70"/>
      <line x1="44" y1="90" x2="556" y2="90" stroke="#242C26" stroke-width="1.4"/>
      <rect x="40" y="32" width="520" height="62" rx="6" fill="none" stroke="${hiStroke("hierarchy")}" stroke-width="2" stroke-dasharray="5 3"/>
      <text x="438" y="55" font-size="11.5" font-weight="600" font-family="IBM Plex Mono, monospace" fill="#9B410F">TYPE 2.1×</text>
    </g>

    <!-- 阅读节奏层（01 → 02 → 03 + 支持槽） -->
    <g opacity="${dim("rhythm")}">
      <rect x="44" y="106" width="12" height="12" fill="#506E59"/>
      <rect x="64" y="106" width="110" height="12" rx="3" fill="#242C26"/>
      <rect x="44" y="128" width="154" height="104" rx="8" fill="#EAE5D4" stroke="${hiStroke("rhythm")}" stroke-width="2"/>
      <rect x="223" y="128" width="154" height="104" rx="8" fill="#EAE5D4" stroke="${hiStroke("rhythm")}" stroke-width="2"/>
      <rect x="402" y="128" width="154" height="104" rx="8" fill="#EAE5D4" stroke="${hiStroke("rhythm")}" stroke-width="2"/>
      <circle cx="64" cy="148" r="11" fill="#506E59"/><text x="64" y="152" text-anchor="middle" font-size="10.5" fill="#FFF" font-family="IBM Plex Mono, monospace">01</text>
      <circle cx="243" cy="148" r="11" fill="#506E59"/><text x="243" y="152" text-anchor="middle" font-size="10.5" fill="#FFF" font-family="IBM Plex Mono, monospace">02</text>
      <circle cx="422" cy="148" r="11" fill="#506E59"/><text x="422" y="152" text-anchor="middle" font-size="10.5" fill="#FFF" font-family="IBM Plex Mono, monospace">03</text>
      <text x="121" y="186" text-anchor="middle" font-size="13" font-weight="700" fill="#141915">提出观点</text>
      <text x="300" y="186" text-anchor="middle" font-size="13" font-weight="700" fill="#141915">解释说明</text>
      <text x="479" y="186" text-anchor="middle" font-size="13" font-weight="700" fill="#141915">总结升华</text>
      <path d="M 203 180 L 218 180 M 213 175 L 218 180 L 213 185" fill="none" stroke="${layer === "rhythm" ? "#CB6627" : "#141915"}" stroke-width="2"/>
      <path d="M 382 180 L 397 180 M 392 175 L 397 180 L 392 185" fill="none" stroke="${layer === "rhythm" ? "#CB6627" : "#141915"}" stroke-width="2"/>
      <!-- 支持模块四格 -->
      <line x1="44" y1="246" x2="556" y2="246" stroke="#C7C0AC" stroke-dasharray="4 4"/>
      <rect x="44" y="258" width="120" height="48" rx="5" fill="#FAF6EC" stroke="#8D8A7E"/>
      <rect x="174" y="258" width="120" height="48" rx="5" fill="#FAF6EC" stroke="#8D8A7E"/>
      <rect x="304" y="258" width="120" height="48" rx="5" fill="#FAF6EC" stroke="#8D8A7E"/>
      <rect x="434" y="258" width="122" height="48" rx="5" fill="#FAF6EC" stroke="#8D8A7E"/>
      <text x="104" y="286" text-anchor="middle" font-size="12" fill="#2D4735">数据支撑</text>
      <text x="234" y="286" text-anchor="middle" font-size="12" fill="#2D4735">案例举例</text>
      <text x="364" y="286" text-anchor="middle" font-size="12" fill="#2D4735">方法步骤</text>
      <text x="495" y="286" text-anchor="middle" font-size="12" fill="#2D4735">行动指引</text>
    </g>

    <!-- 强调重点层（唯一底部赤陶横幅） -->
    <g opacity="${dim("emphasis")}">
      <rect x="44" y="320" width="512" height="46" rx="8" fill="#B44F16" stroke="${layer === "emphasis" ? "#141915" : "none"}" stroke-width="2"/>
      <circle cx="72" cy="343" r="12" fill="none" stroke="#FFF4EC" stroke-width="1.6"/>
      <text x="72" y="347" text-anchor="middle" font-size="12" fill="#FFF4EC">★</text>
      <text x="94" y="347" font-size="13.5" font-weight="700" fill="#FFFFFF">核心提示</text>
      <line x1="164" y1="331" x2="164" y2="355" stroke="rgba(255,244,236,0.5)"/>
      <text x="178" y="347" font-size="12.5" fill="#FFF8F2">全页唯一强暖色焦点 · 约占版面 12%</text>
    </g>
  </svg>`;
}

export function initXraySection() {
  const host = document.getElementById("xray-svg-host");
  const out = document.getElementById("xray-readout");
  const tabs = [...document.querySelectorAll(".xray-tab")];
  if (!host || !out) return;

  function render(layer) {
    host.innerHTML = renderXraySvg(layer);
    const d = XRAY_DATA[layer] || XRAY_DATA.all;
    out.innerHTML = `
      <h3>${d.title}</h3>
      <p class="xray-quote">${d.quote}</p>
      <p class="xray-detail">${d.detail}</p>
      <p class="xray-fail">${d.fail}</p>
    `;
    tabs.forEach((b) => {
      const on = b.dataset.layer === layer;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  tabs.forEach((b) => b.addEventListener("click", () => render(b.dataset.layer)));
  render("all");
}

/* ==================== 02 标题先给结论：三幕台词改写对照拨盘 ==================== */
const REWRITE_CASES = [
  {
    steps: [
      { k: "01 提出观点", v: "把常见问题拆进首屏自助入口，减少人工排队" },
      { k: "02 解释说明", v: "试运行两周，平均等待从 6 分 20 秒降到 52 秒" },
      { k: "03 总结升华", v: "本月推广至全部 4 条售后专线" },
    ],
    modes: {
      topic: {
        head: "售后客服响应情况",
        audience: "「听众 3 秒内心独白」：客服响应……到底是变快了还是变慢了？我得一行行往下翻小字找答案。",
        meter: "主旨抓取效率：偏慢（示意） · 标题只报了话题名，没给判断",
      },
      wall: {
        head: "针对近期客户在售后热线反映的排队时间较长的问题，客服与产品团队联合梳理了高频工单并上线自助入口，两周内把等待时间显著缩短并计划本月全量上线",
        audience: "「听众 3 秒内心独白」：第一行字太长了，我读到一半演讲者已经翻到下面讲数据，脑子跟不上。",
        meter: "主旨抓取效率：拥堵（示意） · 标题超 60 字，与正文抢阅读精力",
      },
      assertion: {
        head: "上线自助分流后，售后平均等待从 6 分钟降至 52 秒",
        audience: "「听众 3 秒内心独白」：秒懂！自助分流把等待压缩到 1 分钟内——下面三步就是讲怎么做到的。",
        meter: "主旨抓取效率：极快（示意） · 18 字完整论断，一眼锁定结论与数字",
      },
    },
  },
  {
    steps: [
      { k: "01 提出观点", v: "零下 15℃ 环境下，电芯内阻上升是掉电主因" },
      { k: "02 解释说明", v: "预热策略启动后，低温可用续航回收 18%" },
      { k: "03 总结升华", v: "冬季 OTA 固件默认开启出行前 10 分钟温控" },
    ],
    modes: {
      topic: {
        head: "冬季低温电池测试",
        audience: "「听众 3 秒内心独白」：又是一页测试报告目录？结论到底过关没过关？",
        meter: "主旨抓取效率：偏慢（示意） · 名词标签隐去了最值钱的 18% 收益",
      },
      wall: {
        head: "今年冬季在零下十五度黑河试验场对三款电芯模组进行充放电测试后，发现低温内阻激增严重影响里程，通过新增出行前十分钟预热策略成功挽回了近两成续航",
        audience: "「听众 3 秒内心独白」：全是定语和背景，最关键的结论藏在最后一个逗号后面。",
        meter: "主旨抓取效率：拥堵（示意） · 标题膨胀成三行，压塌了版面主次",
      },
      assertion: {
        head: "增加 10 分钟出行预热，严寒续航可挽回 18%",
        audience: "「听众 3 秒内心独白」：清楚！10 分钟预热换回 18% 续航，我现在想知道底层机理。",
        meter: "主旨抓取效率：极快（示意） · 一句断言直接抛出因果和量化收益",
      },
    },
  },
  {
    steps: [
      { k: "01 提出观点", v: "社区底商的复购率是大型商场店的 2.1 倍" },
      { k: "02 解释说明", v: "租金仅占前者四成，单店回本周期缩至 7 个月" },
      { k: "03 总结升华", v: "明年新开 12 家门店全部优先锁定成熟社区" },
    ],
    modes: {
      topic: {
        head: "明年开店选址分析",
        audience: "「听众 3 秒内心独白」：选址分析……所以明年到底开商场还是开社区？",
        meter: "主旨抓取效率：偏慢（示意） · 缺少方向性主张，听众只能盲猜",
      },
      wall: {
        head: "综合对比过去一年我们在核心商圈购物中心与大型居住社区两类点位的租金成本、客单价、月复购频次及回本周期后，财务与运营部门建议明年全部转向成熟社区底商",
        audience: "「听众 3 秒内心独白」：这段像公文摘要，放进投影仪后排根本没耐心读完。",
        meter: "主旨抓取效率：拥堵（示意） · 长句堆砌削弱了核心建议的冲击力",
      },
      assertion: {
        head: "社区底商回本仅需 7 个月，明年 12 家新店全转社区",
        audience: "「听众 3 秒内心独白」：决策明确！7 个月回本是核心依据，全转社区是行动方向。",
        meter: "主旨抓取效率：极快（示意） · 结论与依据在 2 秒内完成合流",
      },
    },
  },
];

export function initRewriteSection() {
  const preview = document.getElementById("rewrite-preview");
  const caseBtns = [...document.querySelectorAll(".case-btn")];
  const modeBtns = [...document.querySelectorAll(".rw-mode")];
  if (!preview) return;

  let curCase = 0;
  let curMode = "assertion";

  function render() {
    const c = REWRITE_CASES[curCase];
    const m = c.modes[curMode];
    preview.innerHTML = `
      <div class="rw-split">
        <div class="rw-slide-mock">
          <div class="rw-head-bar">
            <span class="rw-tri" aria-hidden="true">▶</span>
            <p class="rw-head-text is-${curMode}">${m.head}</p>
          </div>
          <div class="rw-steps-mini">
            ${c.steps.map((s) => `<div class="rw-step-chip"><strong>${s.k}</strong><span>${s.v}</span></div>`).join("")}
          </div>
        </div>
        <div class="rw-audience-box">
          <span class="rw-bubble-k">后排听众 3 秒复述模拟</span>
          <p class="rw-bubble-text">${m.audience}</p>
          <div class="rw-meter">${m.meter}</div>
        </div>
      </div>
    `;
    caseBtns.forEach((b) => {
      const on = Number(b.dataset.case) === curCase;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    modeBtns.forEach((b) => {
      const on = b.dataset.mode === curMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  caseBtns.forEach((b) => b.addEventListener("click", () => { curCase = Number(b.dataset.case); render(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { curMode = b.dataset.mode; render(); }));
  render();
}

/* ==================== 03 证据别抢主线：深苔藓暗室 2D Canvas 载荷切片机 ==================== */
export function initPayloadSection() {
  const canvas = document.getElementById("payload-canvas");
  const readout = document.getElementById("payload-readout");
  const slotBtns = [...document.querySelectorAll(".slot-toggle")];
  const densBtns = [...document.querySelectorAll(".dens-btn")];
  if (!canvas || !readout) return;

  const ctx = canvas.getContext("2d");
  const activeSlots = new Set(["data", "case", "method", "action"]);
  let density = "short"; // "short" | "medium" | "heavy"
  let cssW = 540;
  let cssH = 320;
  let dpr = pixelRatio(2);
  let dirty = true;

  const SLOT_LABELS = { data: "数据支撑", case: "案例举例", method: "方法步骤", action: "行动指引" };
  const DENS_WORDS = { short: 8, medium: 22, heavy: 45 };

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    cssW = r.width;
    cssH = r.height;
    dpr = pixelRatio(cssW <= 440 ? 1.5 : 2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      dirty = true;
    }
  }
  new ResizeObserver(() => { resize(); ctrl.draw(); }).observe(canvas);
  resize();

  function calcMetrics() {
    const spineWords = 54; // 标题 + 01/02/03 三步固定约 54 字
    const slotCount = activeSlots.size;
    const proofWords = slotCount * DENS_WORDS[density];
    const totalWords = spineWords + proofWords;
    const spineShare = Math.round((spineWords / totalWords) * 100);
    const proofShare = 100 - spineShare;

    let statusKind = "ok";
    let statusText = "主次均衡 · 低负荷（示意）";
    let heading = "主线稳居 C 位，支持模块刚好托住可信度";
    let detail = `当前主叙事线约 ${spineWords} 字（占 ${spineShare}%），${slotCount} 枚支持槽合计约 ${proofWords} 字（占 ${proofShare}%）。观众先听懂三步因果，再顺眼扫过底部短证据，不会被小字拖住。`;

    if (slotCount === 0) {
      statusKind = "bad";
      statusText = "证据缺位 · 说服力偏弱（示意）";
      heading = "撤光了支持模块，只剩三步口号缺少背书";
      detail = "主线虽然清爽，但缺少哪怕 1–2 枚事实、案例或落地节点来建立信任。至少保留 2 枚最硬的短句支持槽。";
    } else if (proofShare > 55) {
      statusKind = "bad";
      statusText = "喧宾夺主 · 认知过载（示意）";
      heading = `支持模块字数（${proofWords} 字）反超主叙事线，配菜抢走了主菜`;
      detail = `下层 ${slotCount} 格占去整页 ${proofShare}% 的阅读负荷。根据多媒体学习认知原则，此时观众视觉通道被底部密字塞满，根本听不进演讲者对 01→02→03 的口头展开。`;
    } else if (proofShare > 42) {
      statusKind = "bad";
      statusText = "略显拥挤 · 接近临界（示意）";
      heading = "支持模块开始分流注意力，建议缩字或减槽";
      detail = `支持区已占 ${proofShare}% 阅读量（约 ${proofWords} 字）。要么把单槽压回 8 字短句，要么只保留 2 枚最核心的证据槽。`;
    }

    return { spineWords, proofWords, slotCount, spineShare, proofShare, statusKind, statusText, heading, detail };
  }

  function updateReadout() {
    const m = calcMetrics();
    readout.innerHTML = `
      <div>
        <span class="pl-status is-${m.statusKind}">${m.statusText}</span>
        <h3>${m.heading}</h3>
      </div>
      <p>${m.detail}</p>
      <div class="pl-bars">
        <div class="pl-bar-row">
          <div class="pl-bar-top"><span>主叙事脊梁（标题 + 01→03）</span><span>${m.spineShare}% · ${m.spineWords}字</span></div>
          <div class="pl-track"><div class="pl-fill-spine" style="width:${m.spineShare}%"></div></div>
        </div>
        <div class="pl-bar-row">
          <div class="pl-bar-top"><span>下层支持模块（${m.slotCount} 槽）</span><span>${m.proofShare}% · ${m.proofWords}字</span></div>
          <div class="pl-track"><div class="pl-fill-proof" style="width:${m.proofShare}%"></div></div>
        </div>
      </div>
    `;
  }

  const ctrl = loop(canvas, (t, _dt, { still }) => {
    if (!dirty && still) return;
    dirty = false;
    const m = calcMetrics();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const pad = cssW < 380 ? 12 : 16;
    const innerW = cssW - pad * 2;
    const narrow = cssW < 380;
    const spineY = narrow ? 14 : 20;
    const spineH = Math.round(cssH * 0.34);
    const proofY = Math.round(cssH * 0.53);
    const proofH = Math.round(cssH * 0.41);

    // 上层：主叙事三步脊梁
    ctx.fillStyle = "rgba(136,221,167,0.12)";
    ctx.strokeStyle = "#88DDA7";
    ctx.lineWidth = 1.4;
    ctx.fillRect(pad, spineY, innerW, spineH);
    ctx.strokeRect(pad, spineY, innerW, spineH);

    ctx.fillStyle = "#E8F5EC";
    ctx.font = `700 ${narrow ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillText(`主叙事脊梁（占比 ${m.spineShare}%）`, pad + 10, spineY + (narrow ? 18 : 20));

    const stepGap = narrow ? 8 : 12;
    const stepW = (innerW - 20 - stepGap * 2) / 3;
    const spineTopPad = narrow ? 26 : 32;
    const sh = Math.max(22, spineH - spineTopPad - 8);
    ["01 提出观点", "02 解释说明", "03 总结升华"].forEach((lb, i) => {
      const sx = pad + 10 + i * (stepW + stepGap);
      const sy = spineY + spineTopPad;
      ctx.fillStyle = "rgba(244,239,226,0.12)";
      ctx.fillRect(sx, sy, stepW, sh);
      ctx.fillStyle = "#F4EFE2";
      ctx.font = `600 ${narrow ? 10.2 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lb, sx + stepW / 2, sy + sh / 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    });

    // 中间注意力流动箭头
    const overloaded = m.proofShare > 55;
    const pulse = still ? 0.5 : (t * 0.9) % 1;
    ctx.strokeStyle = overloaded ? "#FF8E82" : "#F0985C";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cssW * 0.5, spineY + spineH + 2);
    ctx.lineTo(cssW * 0.5, proofY - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    const spanY = Math.max(8, proofY - spineY - spineH - 12);
    const dotY = spineY + spineH + 6 + pulse * spanY;
    ctx.beginPath();
    ctx.arc(cssW * 0.5, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = overloaded ? "#FF8E82" : "#88DDA7";
    ctx.fill();

    // 下层：支持模块
    ctx.fillStyle = overloaded ? "rgba(255,142,130,0.15)" : "rgba(240,152,92,0.1)";
    ctx.strokeStyle = overloaded ? "#FF8E82" : m.slotCount === 0 ? "#FF8E82" : "#F0985C";
    ctx.lineWidth = overloaded ? 2 : 1.3;
    ctx.fillRect(pad, proofY, innerW, proofH);
    ctx.strokeRect(pad, proofY, innerW, proofH);

    ctx.fillStyle = overloaded ? "#FFB4AC" : "#F4EFE2";
    ctx.font = `700 ${narrow ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillText(
      m.slotCount === 0
        ? "支持模块已清空 · 缺少证据背书"
        : `下层支持模块（${m.slotCount} 槽 · 占 ${m.proofShare}% 负荷）`,
      pad + 10,
      proofY + (narrow ? 18 : 20),
    );

    if (m.slotCount > 0) {
      const list = [...activeSlots];
      const gap = narrow ? 6 : 8;
      const sw = (innerW - 20 - gap * (list.length - 1)) / list.length;
      const linesCount = density === "short" ? 1 : density === "medium" ? 3 : 5;
      const proofTopPad = narrow ? 26 : 30;
      const bh = Math.max(28, proofH - proofTopPad - 8);
      list.forEach((key, idx) => {
        const bx = pad + 10 + idx * (sw + gap);
        const by = proofY + proofTopPad;
        ctx.fillStyle = overloaded ? "rgba(255,142,130,0.16)" : "rgba(244,239,226,0.08)";
        ctx.fillRect(bx, by, sw, bh);
        ctx.fillStyle = "#F4EFE2";
        ctx.font = `600 ${narrow ? 10 : 11}px "Noto Sans SC", sans-serif`;
        ctx.fillText(SLOT_LABELS[key], bx + 5, by + 14);
        // 示意文字条密度
        for (let l = 0; l < linesCount; l++) {
          const ly = by + 22 + l * 6.5;
          if (ly + 3 < by + bh - 3) {
            ctx.fillStyle = overloaded ? "rgba(255,168,158,0.65)" : "rgba(197,209,199,0.5)";
            ctx.fillRect(bx + 5, ly, (sw - 10) * (l === linesCount - 1 ? 0.65 : 0.94), 3);
          }
        }
      });
    }
    ctx.restore();
  });

  slotBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.slot;
      if (activeSlots.has(k)) activeSlots.delete(k);
      else activeSlots.add(k);
      b.classList.toggle("is-on", activeSlots.has(k));
      b.setAttribute("aria-pressed", String(activeSlots.has(k)));
      dirty = true;
      updateReadout();
      ctrl.draw();
    }),
  );

  densBtns.forEach((b) =>
    b.addEventListener("click", () => {
      density = b.dataset.dens;
      densBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      dirty = true;
      updateReadout();
      ctrl.draw();
    }),
  );

  updateReadout();
}

/* ==================== 04 它从哪来：四时期幻灯片标本翻页镜 ==================== */
const ERAS = [
  {
    year: "1978–1987",
    meta: "BARBARA MINTO · 麦肯锡写作训练与正式初版",
    title: "金字塔原理确立「结论先行、以上统下」",
    p1: "Barbara Minto 在麦肯锡设计商业写作课程时发现：人脑一次只能稳定记住少量并列分组，于是总结出先抛顶层结论、再向下拆出 3 组互斥穷尽理由、底层挂接事实证据的金字塔结构。",
    p2: "早期自印本流传于 1973–1978 年间，1987 年由 Minto International 正式出版《The Pyramid Principle》（随后由 Pitman 等出版社发行国际版）。今天 342 海报里「标题定调 → 01→02→03 → 支持模块」的纵深骨架，直接延续了这一商业论证传统。",
    source: "核实来源：Barbara Minto 官方网站（barbaraminto.com）与 1987 初版书目记录。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="金字塔原理顶层结论向下展开结构图">
      <rect x="6" y="6" width="348" height="208" rx="8" fill="#F5EDDF" stroke="#C7C0AC"/>
      <rect x="112" y="24" width="136" height="34" rx="5" fill="#B44F16"/>
      <text x="180" y="45" text-anchor="middle" font-size="12.5" font-weight="700" fill="#FFF">顶层核心结论</text>
      <path d="M180 58 V76 M74 76 H286 M74 76 V92 M180 76 V92 M286 76 V92" fill="none" stroke="#2D4735" stroke-width="1.6"/>
      <rect x="30" y="92" width="88" height="34" rx="4" fill="#506E59"/><text x="74" y="113" text-anchor="middle" font-size="11.5" fill="#FFF">分论点 01</text>
      <rect x="136" y="92" width="88" height="34" rx="4" fill="#506E59"/><text x="180" y="113" text-anchor="middle" font-size="11.5" fill="#FFF">分论点 02</text>
      <rect x="242" y="92" width="88" height="34" rx="4" fill="#506E59"/><text x="286" y="113" text-anchor="middle" font-size="11.5" fill="#FFF">分论点 03</text>
      <path d="M74 126 V150 M180 126 V150 M286 126 V150" fill="none" stroke="#8D8A7E" stroke-dasharray="3 3"/>
      <rect x="28" y="150" width="304" height="40" rx="4" fill="#EAE5D4" stroke="#8D8A7E"/>
      <text x="180" y="174" text-anchor="middle" font-size="11.5" fill="#242C26">底层事实 / 数据 / 案例证据支撑</text>
    </svg>`,
  },
  {
    year: "1987 年 4 月",
    meta: "FORETHOUGHT · ROBERT GASKINS & DENNIS AUSTIN",
    title: "PowerPoint 1.0 把投影片母版带进个人电脑",
    p1: "1987 年 4 月 20 日，硅谷创业公司 Forethought 发布了 Macintosh 版 PowerPoint 1.0（原开发代号 Presenter），专门用来制作黑白透明胶片、演讲备注与听众讲义；同年 7 月被微软收购。",
    p2: "随着母版占位符（Slide Layouts）体系成熟，除了最基础的标题加内容，微软进一步分离出「内容与标题（Content with Caption）」版式，首次在软件层面区分「主内容体」与「解释说明区」。",
    source: "核实来源：Computer History Museum 档案（computerhistory.org）与 Robert Gaskins 个人史料（robertgaskins.com）。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1987年黑白桌面投影片母版示意图">
      <rect x="6" y="6" width="348" height="208" rx="4" fill="#F4F4F0" stroke="#141915" stroke-width="2"/>
      <rect x="6" y="6" width="348" height="22" fill="#141915"/>
      <text x="180" y="21" text-anchor="middle" font-size="11" font-family="IBM Plex Mono, monospace" fill="#F4F4F0">POWERPOINT 1.0 · MACINTOSH 1987</text>
      <rect x="24" y="42" width="128" height="154" fill="none" stroke="#141915" stroke-dasharray="4 3"/>
      <text x="34" y="66" font-size="13" font-weight="700" fill="#141915">标题与说明区</text>
      <rect x="34" y="78" width="96" height="6" fill="#465148"/>
      <rect x="34" y="92" width="106" height="6" fill="#778078"/>
      <rect x="34" y="106" width="84" height="6" fill="#778078"/>
      <rect x="166" y="42" width="170" height="154" fill="#EAE5D4" stroke="#141915"/>
      <text x="251" y="122" text-anchor="middle" font-size="12" font-family="IBM Plex Mono, monospace" fill="#141915">CONTENT PLACEHOLDER</text>
    </svg>`,
  },
  {
    year: "2001",
    meta: "RICHARD E. MAYER · CAMBRIDGE UNIVERSITY PRESS",
    title: "多媒体学习理论给「留白与编号」提供认知依据",
    p1: "心理学家 Richard E. Mayer 在 2001 年《Multimedia Learning》（2020 年出至第三版）中提出双通道、有限容量认知模型，并总结出降低外在认知负荷的核心原则。",
    p2: "其中「信号原则（Signaling）」证明编号 01→02→03、箭头与高亮提示能帮学习者快速抓取组织骨架；「一致性原则（Coherence）」证明删掉无关字句与装饰能让理解更深入——这正是 342 强调留白与分点短句的科学底座。",
    source: "核实来源：Cambridge University Press（DOI: 10.1017/CBO9781139164603 / 10.1017/9781316941355）。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="双通道与信号原则认知模型示意图">
      <rect x="6" y="6" width="348" height="208" rx="8" fill="#FAF6EC" stroke="#C7C0AC"/>
      <rect x="24" y="34" width="124" height="58" rx="6" fill="#EAE5D4" stroke="#506E59"/>
      <text x="86" y="58" text-anchor="middle" font-size="12" font-weight="700" fill="#141915">听觉 · 演讲口述</text>
      <text x="86" y="76" text-anchor="middle" font-size="10.5" fill="#465148">承载故事与细节展开</text>
      <rect x="24" y="118" width="124" height="58" rx="6" fill="#EAE5D4" stroke="#506E59"/>
      <text x="86" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="#141915">视觉 · 结构化幻灯片</text>
      <text x="86" y="160" text-anchor="middle" font-size="10.5" fill="#465148">标题 + 01→03 路标</text>
      <path d="M150 63 L210 105 M150 147 L210 105" stroke="#CB6627" stroke-width="2" fill="none"/>
      <rect x="212" y="66" width="124" height="78" rx="8" fill="#1F2D23"/>
      <text x="274" y="98" text-anchor="middle" font-size="12.5" font-weight="700" fill="#F4EFE2">工作记忆整合</text>
      <text x="274" y="118" text-anchor="middle" font-size="10.5" fill="#88DDA7">低外在负荷 → 高效理解</text>
    </svg>`,
  },
  {
    year: "2003–2005",
    meta: "EDWARD TUFTE (2003) & MICHAEL ALLEY (2003 / 2005)",
    title: "告别多级子弹头，走向「一句话断言 + 证据」",
    p1: "2003 年，信息设计学者 Edward Tufte 出版《The Cognitive Style of PowerPoint》，批评默认多级项目符号模板割裂因果链、降低信息分辨率，甚至掩盖关键工程风险。",
    p2: "同年 Michael Alley 在《The Craft of Scientific Presentations》（Springer）提出并在 2005 年《Technical Communication》论文中确立「断言-证据（Assertion-Evidence）」框架：顶部写一句完整论断，下方用视觉与结构化证据支撑——构成了当代 342 解释型幻灯片的直接范式。",
    source: "核实来源：Edward Tufte 官网（edwardtufte.com）与 Assertion-Evidence 官网（assertion-evidence.com）。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="从子弹头列表转向断言加证据对照图">
      <rect x="6" y="6" width="348" height="208" rx="8" fill="#F5EDDF" stroke="#C7C0AC"/>
      <rect x="20" y="34" width="138" height="156" rx="6" fill="#FCECEB" stroke="#B32E24" stroke-dasharray="4 3"/>
      <text x="89" y="56" text-anchor="middle" font-size="11.5" font-weight="700" fill="#B32E24">旧习惯 · 多级子弹头</text>
      <text x="32" y="84" font-size="11" fill="#465148">• 主题名词空标题</text>
      <text x="38" y="106" font-size="10.5" fill="#465148">- 无因果平铺要点 1</text>
      <text x="38" y="126" font-size="10.5" fill="#465148">- 无因果平铺要点 2</text>
      <text x="38" y="146" font-size="10.5" fill="#465148">- 满屏段落读不完</text>
      <path d="M164 112 H194 M188 106 L194 112 L188 118" fill="none" stroke="#141915" stroke-width="2"/>
      <rect x="202" y="34" width="138" height="156" rx="6" fill="#E4F2E9" stroke="#255E3D"/>
      <text x="271" y="56" text-anchor="middle" font-size="11.5" font-weight="700" fill="#255E3D">现代 342 · 断言 + 结构</text>
      <rect x="214" y="68" width="114" height="18" rx="3" fill="#141915"/>
      <rect x="214" y="96" width="34" height="40" rx="4" fill="#506E59"/>
      <rect x="254" y="96" width="34" height="40" rx="4" fill="#506E59"/>
      <rect x="294" y="96" width="34" height="40" rx="4" fill="#506E59"/>
      <rect x="214" y="148" width="114" height="24" rx="4" fill="#B44F16"/>
    </svg>`,
  },
];

export function initHistorySection() {
  const stage = document.getElementById("history-stage");
  const tabs = [...document.querySelectorAll(".tl-btn")];
  if (!stage) return;

  function render(idx) {
    const e = ERAS[idx] || ERAS[0];
    stage.innerHTML = `
      <div class="era-specimen">${e.svg}</div>
      <div class="era-copy">
        <p class="era-meta">${e.year} · ${e.meta}</p>
        <h3>${e.title}</h3>
        <p>${e.p1}</p>
        <p>${e.p2}</p>
        <p class="era-source">${e.source}</p>
      </div>
    `;
    tabs.forEach((b) => {
      const on = Number(b.dataset.era) === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((b) => b.addEventListener("click", () => render(Number(b.dataset.era))));
  render(0);
}

/* ==================== 05 什么时候别用：四场景分诊决策卡 ==================== */
const TRIAGES = [
  {
    badge: "别用 342 · 改用开篇/转场页",
    title: "整场开篇定调，或切进下一个大章节",
    why: "观众刚坐稳或刚听完上一章的高密数据，大脑需要 2 秒呼吸缓冲。此刻直接甩出标题 + 三步卡 + 四支持槽，就像刚进餐厅还没坐下就端来整桌硬菜，只会让人瞬间拒读。",
    links: [
      { id: "335", name: "335 标题幻灯片", url: "https://layout.xiaoxiaodong.ai/335/play/" },
      { id: "337", name: "337 节标题幻灯片", url: "https://layout.xiaoxiaodong.ai/337/play/" },
    ],
    wire: `<svg viewBox="0 0 280 170" role="img" aria-label="标题页与节标题版式骨架示意">
      <rect x="6" y="6" width="268" height="158" rx="8" fill="#1F2D23"/>
      <text x="26" y="60" font-size="30" font-weight="800" font-family="Outfit, sans-serif" fill="#F0985C">02</text>
      <rect x="26" y="76" width="166" height="18" rx="3" fill="#F5EDDF"/>
      <rect x="26" y="106" width="110" height="8" rx="2" fill="#88A38F"/>
      <text x="26" y="146" font-size="11" fill="#C5D1C7">大留白 + 单一章标，先换气再展开</text>
    </svg>`,
  },
  {
    badge: "别用 342 · 改用极简冲击页",
    title: "整页只想砸下一句宣言或一个震撼数字",
    why: "当核心信息本身已经足够锋利（例如「用户突破 1000 万」），硬往底下填 01/02/03 和四个支持槽，属于画蛇添足，反而稀释了情绪张力与舞台停顿感。",
    links: [
      { id: "340", name: "340 仅标题幻灯片", url: "https://layout.xiaoxiaodong.ai/340/play/" },
      { id: "341", name: "341 空白幻灯片", url: "https://layout.xiaoxiaodong.ai/341/play/" },
    ],
    wire: `<svg viewBox="0 0 280 170" role="img" aria-label="仅标题与空白幻灯片骨架示意">
      <rect x="6" y="6" width="268" height="158" rx="8" fill="#FAF6EC" stroke="#8D8A7E" stroke-dasharray="4 3"/>
      <circle cx="140" cy="84" r="32" fill="#CB6627" opacity="0.22"/>
      <text x="140" y="91" text-anchor="middle" font-size="22" font-weight="900" fill="#141915">1,000 万</text>
      <text x="140" y="146" text-anchor="middle" font-size="11" fill="#465148">80% 留白托举唯一焦点</text>
    </svg>`,
  },
  {
    badge: "别用 342 · 改用双栏对照页",
    title: "要让 A/B 两种方案逐条硬碰硬比较优劣",
    why: "342 的横向三步是顺着时间或因果往下推进的（01→02→03），不是左右对峙。要呈现旧架构 vs 新架构、成本 vs 收益的镜像对照，左右双栏天平效率高得多。",
    links: [
      { id: "338", name: "338 两项内容版式", url: "https://layout.xiaoxiaodong.ai/338/play/" },
      { id: "339", name: "339 比较幻灯片版式", url: "https://layout.xiaoxiaodong.ai/339/play/" },
    ],
    wire: `<svg viewBox="0 0 280 170" role="img" aria-label="两项内容与比较双栏骨架示意">
      <rect x="6" y="6" width="268" height="158" rx="8" fill="#FAF6EC" stroke="#C7C0AC"/>
      <rect x="20" y="20" width="150" height="14" rx="3" fill="#141915"/>
      <rect x="20" y="46" width="112" height="100" rx="6" fill="#EAE5D4"/>
      <rect x="148" y="46" width="112" height="100" rx="6" fill="#E4F2E9" stroke="#506E59"/>
      <text x="76" y="70" text-anchor="middle" font-size="11.5" font-weight="700" fill="#242C26">方案 A</text>
      <text x="204" y="70" text-anchor="middle" font-size="11.5" font-weight="700" fill="#255E3D">方案 B</text>
    </svg>`,
  },
  {
    badge: "别用 342 · 改用大图说明页",
    title: "主角是一张产品实拍、设计稿或现场照片",
    why: "342 把 70% 面积都分配给了文字逻辑框与短句支持槽。如果这一页最该看的是高清照片或 UI 细节，硬塞三步卡会把照片压成邮票大小，彻底反客为主。",
    links: [
      { id: "343", name: "343 图片与标题说明", url: "https://layout.xiaoxiaodong.ai/343/play/" },
    ],
    wire: `<svg viewBox="0 0 280 170" role="img" aria-label="图片与标题说明版式骨架示意">
      <rect x="6" y="6" width="268" height="158" rx="8" fill="#FAF6EC" stroke="#C7C0AC"/>
      <rect x="18" y="20" width="154" height="130" rx="6" fill="#B8BFA9"/>
      <circle cx="132" cy="54" r="14" fill="#CB6627"/>
      <path d="M18 150 L74 86 L122 122 L172 92 L172 150 Z" fill="#506E59"/>
      <rect x="184" y="32" width="76" height="14" rx="3" fill="#141915"/>
      <rect x="184" y="56" width="70" height="8" rx="2" fill="#6F7A70"/>
      <rect x="184" y="70" width="64" height="8" rx="2" fill="#6F7A70"/>
    </svg>`,
  },
];

export function initTriageSection() {
  const panel = document.getElementById("triage-panel");
  const btns = [...document.querySelectorAll(".tri-btn")];
  if (!panel) return;

  function render(idx) {
    const t = TRIAGES[idx] || TRIAGES[0];
    panel.innerHTML = `
      <div class="triage-copy">
        <span class="tri-badge">${t.badge}</span>
        <h3>${t.title}</h3>
        <p>${t.why}</p>
        <div class="triage-links">
          ${t.links.map((l) => `<a class="sibling-pill" href="${l.url}" target="_blank" rel="noopener">去看 ${l.name} →</a>`).join("")}
        </div>
      </div>
      <div class="triage-wire">${t.wire}</div>
    `;
    btns.forEach((b) => {
      const on = Number(b.dataset.tri) === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => render(Number(b.dataset.tri))));
  render(0);
}

/* ==================== 06 小练习：单变量盲选判题 ==================== */
const QUIZ_OPTIONS = [
  {
    id: "A",
    neutral: "短词标题 · 四点列表",
    right: false,
    why: "顶部只写「引导流程优化」，把最关键的「首日留存升至 48%」藏进四条无编号平铺列表里；既缺论断入口，也缺由总到分的递进逻辑与底部唯一落点。",
    svg: `<svg viewBox="0 0 320 200" role="img" aria-label="方案 A 幻灯片缩略图">
      <rect x="4" y="4" width="312" height="192" rx="8" fill="#F5EDDF" stroke="#D0C9B5"/>
      <text x="22" y="34" font-size="14" font-weight="700" fill="#465148">引导流程优化</text>
      <line x1="22" y1="46" x2="298" y2="46" stroke="#242C26"/>
      <text x="22" y="74" font-size="11.5" fill="#242C26">• 砍掉前置 5 项必填，新客 15 秒进入试用</text>
      <text x="22" y="98" font-size="11.5" fill="#242C26">• 4.2 万灰度样本验证，首日留存升至 48%</text>
      <text x="22" y="122" font-size="11.5" fill="#242C26">• 字段改为使用场景触发，本月 15 日全量</text>
      <text x="22" y="146" font-size="11.5" fill="#242C26">• 先让用户尝到产品价值，再开口要资料</text>
    </svg>`,
  },
  {
    id: "B",
    neutral: "单句标题 · 三步单色",
    right: true,
    why: "唯一全部守住四根结构柱的方案：顶部一句话直接交出 48% 结论，中段 01→02→03 按因果顺流展开，下层精选 2 枚短证据背书，赤陶色克制留给底部核心提示。",
    svg: `<svg viewBox="0 0 320 200" role="img" aria-label="方案 B 幻灯片缩略图">
      <rect x="4" y="4" width="312" height="192" rx="8" fill="#F5EDDF" stroke="#D0C9B5"/>
      <polygon points="22,22 30,27 22,32" fill="#CB6627"/>
      <text x="36" y="31" font-size="13.5" font-weight="900" fill="#141915">砍掉前置 5 项表单，首日留存升至 48%</text>
      <line x1="22" y1="42" x2="298" y2="42" stroke="#242C26"/>
      <rect x="22" y="52" width="84" height="58" rx="5" fill="#EAE5D4"/>
      <rect x="118" y="52" width="84" height="58" rx="5" fill="#EAE5D4"/>
      <rect x="214" y="52" width="84" height="58" rx="5" fill="#EAE5D4"/>
      <circle cx="34" cy="64" r="7" fill="#506E59"/><text x="34" y="67" text-anchor="middle" font-size="7.5" fill="#FFF">01</text>
      <circle cx="130" cy="64" r="7" fill="#506E59"/><text x="130" y="67" text-anchor="middle" font-size="7.5" fill="#FFF">02</text>
      <circle cx="226" cy="64" r="7" fill="#506E59"/><text x="226" y="67" text-anchor="middle" font-size="7.5" fill="#FFF">03</text>
      <text x="64" y="88" text-anchor="middle" font-size="10.5" font-weight="700" fill="#141915">定位瓶颈</text>
      <text x="160" y="88" text-anchor="middle" font-size="10.5" font-weight="700" fill="#141915">灰度验证</text>
      <text x="256" y="88" text-anchor="middle" font-size="10.5" font-weight="700" fill="#141915">全量推广</text>
      <text x="112" y="84" text-anchor="middle" font-size="11" fill="#141915">→</text>
      <text x="208" y="84" text-anchor="middle" font-size="11" fill="#141915">→</text>
      <rect x="22" y="120" width="134" height="28" rx="4" fill="#FAF6EC" stroke="#8D8A7E"/><text x="89" y="138" text-anchor="middle" font-size="10" fill="#2D4735">数据 · 次日留存 +11pp</text>
      <rect x="164" y="120" width="134" height="28" rx="4" fill="#FAF6EC" stroke="#8D8A7E"/><text x="231" y="138" text-anchor="middle" font-size="10" fill="#2D4735">节点 · 10月15日全量</text>
      <rect x="22" y="156" width="276" height="28" rx="6" fill="#B44F16"/>
      <text x="160" y="174" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFFFFF">★ 先让用户尝到产品价值，再开口要注册信息</text>
    </svg>`,
  },
  {
    id: "C",
    neutral: "单句标题 · 四区暖色",
    right: false,
    why: "虽然写了断言标题也有三步流，但把标题底、三步卡、支持槽与底部横幅全涂成高饱和赤陶色——强调色铺满全页后彼此抵消，观众反而抓不住唯一的核心收口。",
    svg: `<svg viewBox="0 0 320 200" role="img" aria-label="方案 C 幻灯片缩略图">
      <rect x="4" y="4" width="312" height="192" rx="8" fill="#F5EDDF" stroke="#D0C9B5"/>
      <rect x="20" y="14" width="280" height="26" rx="4" fill="#F3D3BC"/>
      <text x="28" y="31" font-size="13" font-weight="900" fill="#8F3A0C">砍掉前置 5 项表单，首日留存升至 48%</text>
      <rect x="22" y="50" width="84" height="58" rx="5" fill="#CB6627"/>
      <rect x="118" y="50" width="84" height="58" rx="5" fill="#CB6627"/>
      <rect x="214" y="50" width="84" height="58" rx="5" fill="#CB6627"/>
      <text x="64" y="84" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFF">01 定位瓶颈</text>
      <text x="160" y="84" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFF">02 灰度验证</text>
      <text x="256" y="84" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFF">03 全量推广</text>
      <rect x="22" y="118" width="134" height="28" rx="4" fill="#F3D3BC" stroke="#CB6627"/><text x="89" y="136" text-anchor="middle" font-size="10" fill="#8F3A0C">数据 · 次日留存 +11pp</text>
      <rect x="164" y="118" width="134" height="28" rx="4" fill="#F3D3BC" stroke="#CB6627"/><text x="231" y="136" text-anchor="middle" font-size="10" fill="#8F3A0C">节点 · 10月15日全量</text>
      <rect x="22" y="156" width="276" height="28" rx="6" fill="#B44F16"/>
      <text x="160" y="174" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFFFFF">★ 先让用户尝到产品价值，再开口要注册信息</text>
    </svg>`,
  },
  {
    id: "D",
    neutral: "三行标题 · 三步单色",
    right: false,
    why: "底部强调色克制且有三步，但顶部标题塞进了三行 48 字长段背景，字号被迫缩到与正文几乎一样大，彻底压塌了标题与内容的视觉层级差。",
    svg: `<svg viewBox="0 0 320 200" role="img" aria-label="方案 D 幻灯片缩略图">
      <rect x="4" y="4" width="312" height="192" rx="8" fill="#F5EDDF" stroke="#D0C9B5"/>
      <text x="22" y="23" font-size="10" fill="#141915">本季度针对新客留存低开展了三轮访谈与灰度，</text>
      <text x="22" y="36" font-size="10" fill="#141915">发现旧版引导前置五项必填拦住了四成新客，</text>
      <text x="22" y="49" font-size="10" fill="#141915">改为先体验后补全使首日留存升至四成八。</text>
      <line x1="22" y1="57" x2="298" y2="57" stroke="#242C26"/>
      <rect x="22" y="65" width="84" height="48" rx="5" fill="#EAE5D4"/><text x="64" y="93" text-anchor="middle" font-size="10" font-weight="700" fill="#141915">01 定位瓶颈</text>
      <rect x="118" y="65" width="84" height="48" rx="5" fill="#EAE5D4"/><text x="160" y="93" text-anchor="middle" font-size="10" font-weight="700" fill="#141915">02 灰度验证</text>
      <rect x="214" y="65" width="84" height="48" rx="5" fill="#EAE5D4"/><text x="256" y="93" text-anchor="middle" font-size="10" font-weight="700" fill="#141915">03 全量推广</text>
      <rect x="22" y="121" width="134" height="27" rx="4" fill="#FAF6EC" stroke="#8D8A7E"/><text x="89" y="138" text-anchor="middle" font-size="10" fill="#2D4735">数据 · 次日留存 +11pp</text>
      <rect x="164" y="121" width="134" height="27" rx="4" fill="#FAF6EC" stroke="#8D8A7E"/><text x="231" y="138" text-anchor="middle" font-size="10" fill="#2D4735">节点 · 10月15日全量</text>
      <rect x="22" y="156" width="276" height="28" rx="6" fill="#B44F16"/>
      <text x="160" y="174" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFFFFF">★ 先让用户尝到产品价值，再开口要注册信息</text>
    </svg>`,
  },
];

export function initQuizSection() {
  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");
  if (!grid || !fb) return;

  grid.innerHTML = QUIZ_OPTIONS.map(
    (opt) => `
    <button type="button" class="quiz-card" data-opt="${opt.id}">
      <div class="quiz-card-head">
        <span class="quiz-letter">选项 ${opt.id}</span>
        <span class="quiz-neutral">${opt.neutral}</span>
      </div>
      <div class="quiz-thumb">${opt.svg}</div>
    </button>
  `,
  ).join("");

  const cards = [...grid.querySelectorAll(".quiz-card")];

  cards.forEach((btn) =>
    btn.addEventListener("click", () => {
      const picked = QUIZ_OPTIONS.find((o) => o.id === btn.dataset.opt);
      cards.forEach((c) => {
        c.classList.remove("is-picked-right", "is-picked-wrong");
        if (c === btn) c.classList.add(picked.right ? "is-picked-right" : "is-picked-wrong");
      });
      fb.hidden = false;
      fb.className = `quiz-feedback ${picked.right ? "is-right" : "is-wrong"}`;
      fb.innerHTML = `
        <p class="quiz-fb-head">${picked.right ? "答对了：方案 B 同时守住了全部四根结构柱" : `方案 ${picked.id} 踩中了单一变量陷阱`}</p>
        <p class="quiz-fb-body">${picked.why}</p>
        <ul class="quiz-fb-list">
          ${QUIZ_OPTIONS.map((o) => `<li><strong>方案 ${o.id}</strong>：${o.why}</li>`).join("")}
        </ul>
      `;
    }),
  );
}

/* ==================== 07 原海报放大灯箱（拖移 / 缩放 / Esc 关） ==================== */
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const poster = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const vp = document.getElementById("lb-viewport");
  const lbImg = document.getElementById("lb-img");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const btnClose = document.getElementById("lb-close");
  if (!trigger || !poster || !lb || !vp || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = poster.src; // 只复用已内联的一份海报
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.5, +(scale + 0.35).toFixed(2)); apply(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.7, +(scale - 0.35).toFixed(2)); apply(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target === vp) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });

  vp.addEventListener(
    "wheel",
    (e) => {
      if (lb.hidden) return;
      e.preventDefault();
      scale = Math.max(0.7, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      apply();
    },
    { passive: false },
  );

  vp.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    vp.classList.add("is-dragging");
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  vp.addEventListener("pointerup", () => {
    dragging = false;
    vp.classList.remove("is-dragging");
  });
}
