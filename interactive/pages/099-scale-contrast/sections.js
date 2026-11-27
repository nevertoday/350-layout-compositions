// 099 尺度对比正文 01–07 节全部互动模块（相邻节绝不重复同一种控件）

// ---------------------------------------------------------------------------
// 01 节：史蒂文斯感知压缩实验器（滑杆 × 参照显隐开关 × 物理/感知双面积对比）
// ---------------------------------------------------------------------------
function initSection01() {
  const slider = document.getElementById("s01-ratio");
  const toggleBtn = document.getElementById("s01-ref-toggle");
  const ratioOut = document.getElementById("s01-ratio-val");
  const physOut = document.getElementById("s01-phys-val");
  const percOut = document.getElementById("s01-perc-val");
  const physBar = document.getElementById("s01-phys-bar");
  const percBar = document.getElementById("s01-perc-bar");
  const noteEl = document.getElementById("s01-note");
  const bigCircle = document.getElementById("s01-big-circle");
  const refGroup = document.getElementById("s01-ref-group");
  const refCaption = document.getElementById("s01-ref-caption");
  if (!slider) return;

  let hasRef = true;

  function render() {
    const dRatio = Number(slider.value); // 1.2 .. 12.0
    const physArea = dRatio * dRatio; // 直径比平方 = 二维面积比
    const percArea = Math.pow(physArea, 0.7); // Stevens 1957 视觉面积压缩指数 0.7

    ratioOut.textContent = `${dRatio.toFixed(1)}×`;
    physOut.textContent = `${physArea.toFixed(1)}×`;
    percOut.textContent = `约 ${percArea.toFixed(1)}×（示意）`;

    // 柱宽按对数比例展示，避免 144× 把小值压扁
    const maxLog = Math.log10(144 + 1);
    const wPhys = Math.min(100, (Math.log10(physArea + 1) / maxLog) * 100);
    const wPerc = Math.min(100, (Math.log10(percArea + 1) / maxLog) * 100);
    physBar.style.width = `${wPhys.toFixed(1)}%`;
    percBar.style.width = `${wPerc.toFixed(1)}%`;

    // 更新左侧 SVG 巨球与小人相对比例（球半径 32..82，小人随反比或稳定基准呈现）
    const r = 34 + ((dRatio - 1.2) / 10.8) * 52;
    bigCircle.setAttribute("r", r.toFixed(1));
    bigCircle.setAttribute("cy", (152 - r * 0.42).toFixed(1));

    const refH = Math.max(11, Math.min(92, (r * 2) / dRatio));
    const figScale = refH / 26;
    refGroup.setAttribute("transform", `translate(248, 206) scale(${figScale.toFixed(3)})`);
    refGroup.style.opacity = hasRef ? "1" : "0";
    refCaption.textContent = hasRef
      ? `直径比 ${dRatio.toFixed(1)}× · 参照可见`
      : "参照人影已撤除 · 巨球失去尺标";

    toggleBtn.textContent = hasRef ? "隐藏参照人影" : "恢复参照人影";
    toggleBtn.setAttribute("aria-pressed", String(!hasRef));

    if (!hasRef) {
      noteEl.textContent =
        "此刻只剩一颗孤零零的黄色圆盘——无论滑杆推到几倍，没有人类尺标作比对，观者完全无法判断它是硬币还是恒星。这就是唐迪斯（1973）所说的「尺度永远依赖上下文关系」。";
    } else if (dRatio < 2.5) {
      noteEl.textContent = `直径差只有 ${dRatio.toFixed(1)}×，物理面积虽有 ${physArea.toFixed(1)}×，经过人眼 0.7 次幂压缩后主观只剩约 ${percArea.toFixed(1)}×（示意）——读起来像「略微大一点的配角」，还没有进入尺度对比区。`;
    } else if (dRatio < 5.5) {
      noteEl.textContent = `直径拉开到 ${dRatio.toFixed(1)}×（感知面积约 ${percArea.toFixed(1)}×，示意），主次关系已经清晰确立，适合常规杂志页与产品海报；若想要原海报那种一眼震慑的纪念碑压迫感，可以继续往 7× 以上推。`;
    } else {
      noteEl.textContent = `达到 ${dRatio.toFixed(1)}× 极端直径差！物理面积差跃升至 ${physArea.toFixed(0)}×，即使经过人眼压缩，主观体量感仍高达约 ${percArea.toFixed(1)}×（示意）——视觉焦点被瞬间锁死，微光人影反向把巨球撑成苍穹。`;
    }
  }

  slider.addEventListener("input", render);
  toggleBtn.addEventListener("click", () => {
    hasRef = !hasRef;
    render();
  });
  render();
}

// ---------------------------------------------------------------------------
// 02 节：原海报五要点解剖台（五枚金黄原海报徽标切卡 + 「破坏此项」实时对照）
// ---------------------------------------------------------------------------
const PILLAR_DATA = [
  {
    id: "size",
    num: "01",
    title: "大小",
    en: "SIZE",
    quote: "极端的大小差异 形成强烈视觉反差",
    goodTitle: "跳级落差：只留极大与极小",
    badTitle: "失灵态：温吞接近，反差归零",
    goodText: "海报用占满大半画幅的巨圆并置一粒微点。因为跳过「偏大、中等、偏小」的渐进过渡，眼睛无需逐一比较，0.2 秒就能感到强烈的体量冲击。",
    badText: "当两个圆尺寸只差 1.3 倍时，大脑只会把它们归类成「一对同类图形」，反差感消失，画面立刻变得犹豫平淡。",
    renderSvg: (broken) =>
      broken
        ? `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <circle cx="136" cy="105" r="46" fill="#C9A02E"/>
            <circle cx="236" cy="105" r="36" fill="#B58E2A"/>
            <line x1="136" y1="168" x2="236" y2="168" stroke="#FF7461" stroke-dasharray="4 4"/>
            <text x="186" y="188" fill="#FF9282" font-size="12" text-anchor="middle">1.28× 接近等大 · 无法形成尺度反差</text>
          </svg>`
        : `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <circle cx="132" cy="102" r="76" fill="#F5BF12"/>
            <circle cx="272" cy="156" r="6.5" fill="#F7CE46"/>
            <line x1="208" y1="102" x2="272" y2="148" stroke="#F2E0BD" stroke-opacity="0.45" stroke-dasharray="4 4"/>
            <text x="180" y="196" fill="#F2E0BD" font-size="12" text-anchor="middle">11.7× 极端高差 · 第一眼瞬间落向巨圆</text>
          </svg>`,
  },
  {
    id: "hierarchy",
    num: "02",
    title: "主次",
    en: "HIERARCHY",
    quote: "通过尺度决定视觉 优先级，明确重点",
    goodTitle: "一巨统三微：主宾一眼分明",
    badTitle: "失灵态：四者平权，焦点内讧",
    goodText: "原海报徽标画了一颗巨圆压住三尊微人。不用额外加箭头或边框，单纯靠面积悬殊，观者就天然知道谁是核心主角、谁是陪衬注脚。",
    badText: "如果主角和配角体量相近，四个区域同时伸手抢注意力，读者的视线会在画面里来回折返，不知道该先读哪一句。",
    renderSvg: (broken) =>
      broken
        ? `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <circle cx="72" cy="96" r="30" fill="#C9A02E"/>
            <circle cx="148" cy="96" r="28" fill="#C9A02E"/>
            <circle cx="222" cy="96" r="27" fill="#C9A02E"/>
            <circle cx="294" cy="96" r="29" fill="#C9A02E"/>
            <text x="180" y="176" fill="#FF9282" font-size="12" text-anchor="middle">四者几乎同重 · 优先级瓦解</text>
          </svg>`
        : `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <circle cx="180" cy="78" r="54" fill="#F5BF12"/>
            <g fill="#F7CE46">
              <circle cx="144" cy="148" r="5"/><path d="M136 164c0-6 16-6 16 0z"/>
              <circle cx="180" cy="148" r="5"/><path d="M172 164c0-6 16-6 16 0z"/>
              <circle cx="216" cy="148" r="5"/><path d="M208 164c0-6 16-6 16 0z"/>
            </g>
            <text x="180" y="194" fill="#F2E0BD" font-size="12" text-anchor="middle">主视觉独占首眼 · 三枚小人自然退为陪衬</text>
          </svg>`,
  },
  {
    id: "impact",
    num: "03",
    title: "冲击",
    en: "IMPACT",
    quote: "巨大元素带来张力 瞬间抓住注意力",
    goodTitle: "逼近画框边界的膨胀势能",
    badTitle: "失灵态：缩在正中，气息散失",
    goodText: "巨球外缘几乎顶到画框边缘，在深黑夜幕衬托下产生向外扩张的张力——即使远在几米外的街头海报墙上，也能一秒截停路人目光。",
    badText: "把主体缩小到安全舒适的中号，四周空荡松散，能量感全无；或者反向吹到 98% 贴死四边，黄色反倒退化成普通底色。",
    renderSvg: (broken) =>
      broken
        ? `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <rect x="30" y="20" width="300" height="150" fill="none" stroke="#4D4638" stroke-dasharray="4 4"/>
            <circle cx="180" cy="95" r="24" fill="#B58E2A"/>
            <text x="180" y="194" fill="#FF9282" font-size="12" text-anchor="middle">主体萎缩居中 · 远看毫无抓手</text>
          </svg>`
        : `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <circle cx="148" cy="104" r="88" fill="#F5BF12"/>
            <g stroke="#F7CE46" stroke-width="1.5" opacity="0.8">
              <line x1="252" y1="62" x2="274" y2="52"/><line x1="258" y1="104" x2="286" y2="104"/><line x1="252" y1="146" x2="274" y2="156"/>
            </g>
            <circle cx="298" cy="158" r="4" fill="#F7CE46"/>
            <rect x="295" y="163" width="6" height="14" rx="2" fill="#F7CE46"/>
            <text x="275" y="196" fill="#F2E0BD" font-size="12" text-anchor="middle">巨物压场 · 瞬间破屏</text>
          </svg>`,
  },
  {
    id: "levels",
    num: "04",
    title: "层级",
    en: "LEVELS",
    quote: "大小差异建立信息 层级与阅读顺序",
    goodTitle: "跳过拥挤中档的阶梯字阶",
    badTitle: "失灵态：逐级微调，扫读迟疑",
    goodText: "像原海报的「尺度对比」超巨中文主标，配下方的细小英文总述与精炼要点——每一阶的跨度足够陡峭，眼睛自然按大→小依次读完，绝不迷路。",
    badText: "如果标题 20px、副标 17px、正文 15px、注脚 14px，四行字几乎一样大，读者被迫从头逐字搜寻重点。",
    renderSvg: (broken) =>
      broken
        ? `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <rect x="64" y="42" width="232" height="18" fill="#C9A02E"/>
            <rect x="64" y="72" width="218" height="17" fill="#B58E2A"/>
            <rect x="64" y="102" width="206" height="16" fill="#9E7C25"/>
            <rect x="64" y="132" width="196" height="15" fill="#8A6C20"/>
            <text x="180" y="186" fill="#FF9282" font-size="12" text-anchor="middle">阶差不足 1.15× · 四层糊成灰砖</text>
          </svg>`
        : `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <rect x="52" y="32" width="256" height="44" fill="#F5BF12"/>
            <rect x="52" y="92" width="160" height="18" fill="#E9D7B2"/>
            <rect x="52" y="124" width="104" height="9" fill="#C6B99C"/>
            <rect x="52" y="144" width="66" height="6" fill="#8F836A"/>
            <text x="180" y="186" fill="#F2E0BD" font-size="12" text-anchor="middle">陡峭级差 · 顺序 1 → 2 → 3 → 4 一目了然</text>
          </svg>`,
  },
  {
    id: "depth",
    num: "05",
    title: "远近",
    en: "DEPTH",
    quote: "尺度对比营造空间 感与距离感",
    goodTitle: "熟悉的身形把二维平面撑成纵深",
    badTitle: "失灵态：失去地平锚线，沦为贴纸",
    goodText: "人脑用经验里的「标准身高」去反推空间：只要把熟悉的小人踩在微光暗丘上，巨大的金球便不再是纸面黄圈，而是悬在千米天际的巨型天体。",
    badText: "一旦拿掉暗丘地平线与光影衔接，两枚图形就只是浮在同一层黑色底板上的扁平贴纸，距离感瞬间塌缩。",
    renderSvg: (broken) =>
      broken
        ? `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <circle cx="150" cy="96" r="56" fill="#C9A02E"/>
            <rect x="242" y="76" width="10" height="36" rx="4" fill="#C9A02E"/>
            <text x="180" y="186" fill="#FF9282" font-size="12" text-anchor="middle">无地平线与光影锚定 · 空间压平</text>
          </svg>`
        : `<svg viewBox="0 0 360 210" aria-hidden="true">
            <rect width="360" height="210" fill="#0B0A08"/>
            <path d="M0 170 Q180 148 360 172 L360 210 L0 210 Z" fill="#1C170B"/>
            <circle cx="144" cy="90" r="60" fill="#F5BF12"/>
            <line x1="176" y1="40" x2="262" y2="146" stroke="#F7CE46" stroke-dasharray="4 4" opacity="0.7"/>
            <line x1="158" y1="148" x2="262" y2="162" stroke="#F7CE46" stroke-dasharray="4 4" opacity="0.7"/>
            <circle cx="262" cy="144" r="3" fill="#F7CE46"/>
            <rect x="259.5" y="148" width="5" height="14" rx="1.5" fill="#F7CE46"/>
            <text x="180" y="196" fill="#F2E0BD" font-size="12" text-anchor="middle">地平弧与透视锥把尺差转译成千米纵深</text>
          </svg>`,
  },
];

function initSection02() {
  const btns = [...document.querySelectorAll("[data-pillar-tab]")];
  const breakBtn = document.getElementById("s02-break-btn");
  const svgBox = document.getElementById("s02-diagram");
  const quoteEl = document.getElementById("s02-quote");
  const titleEl = document.getElementById("s02-detail-title");
  const bodyEl = document.getElementById("s02-detail-body");
  if (!btns.length || !svgBox) return;

  let activeIdx = 0;
  let broken = false;

  function render() {
    const item = PILLAR_DATA[activeIdx];
    btns.forEach((b, i) => {
      const on = i === activeIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    svgBox.innerHTML = item.renderSvg(broken);
    quoteEl.textContent = `原海报「${item.title} ${item.en}」：${item.quote}`;
    titleEl.textContent = broken ? item.badTitle : item.goodTitle;
    titleEl.classList.toggle("is-broken", broken);
    bodyEl.textContent = broken ? item.badText : item.goodText;
    breakBtn.textContent = broken ? "恢复原海报成立态" : "破坏这一项看看";
    breakBtn.setAttribute("aria-pressed", String(broken));
  }

  btns.forEach((b, i) => {
    b.addEventListener("click", () => {
      activeIdx = i;
      broken = false;
      render();
    });
  });
  breakBtn.addEventListener("click", () => {
    broken = !broken;
    render();
  });
  render();
}

// ---------------------------------------------------------------------------
// 03 节：从巨穹到银幕的历史源流暗室（4 时代纯剪影剖面 + 可核实典藏出处）
// ---------------------------------------------------------------------------
const ERAS = [
  {
    id: "boullee",
    year: "1784",
    title: "布雷《牛顿纪念碑》",
    en: "ÉTIENNE-LOUIS BOULLÉE · CÉNOTAPHE À NEWTON",
    ratio: "球高约 150 米 vs 行者 1.7 米（≈ 88:1）",
    text: "法国启蒙建筑师艾蒂安-路易·布雷为致敬牛顿，设计了一座直径约 150 米的巨型空心球体（未建成，手稿藏于法国国家图书馆 BnF）。他在立面和剖面图底部故意画上如蚁般的微小人影与柏树——正是这组「纯几何巨球 + 微小人类尺标」，在两个多世纪前就写下了 099 原海报最纯粹的视觉原型。",
    source: "核实来源：法国国家图书馆（BnF）《布雷特展》数字馆藏（1784 年原图）",
    svg: `<svg viewBox="0 0 420 230" aria-hidden="true">
      <rect width="420" height="230" fill="#0A0A08"/>
      <circle cx="210" cy="112" r="88" fill="#F5BF12" fill-opacity="0.92"/>
      <rect x="64" y="160" width="292" height="14" fill="#1C1912" stroke="#F2E0BD" stroke-opacity="0.25"/>
      <rect x="44" y="174" width="332" height="18" fill="#14120D" stroke="#F2E0BD" stroke-opacity="0.25"/>
      <g fill="#F7CE46">
        <circle cx="186" cy="186" r="1.6"/><rect x="184.8" y="188" width="2.4" height="4.2"/>
        <circle cx="210" cy="185.5" r="1.7"/><rect x="208.7" y="187.5" width="2.6" height="4.5"/>
        <circle cx="236" cy="186" r="1.6"/><rect x="234.8" y="188" width="2.4" height="4.2"/>
      </g>
      <line x1="316" y1="24" x2="316" y2="192" stroke="#F2E0BD" stroke-opacity="0.5" stroke-dasharray="3 3"/>
      <text x="326" y="108" fill="#F2E0BD" font-size="11">≈ 150m 巨球</text>
      <text x="210" y="216" fill="#C6B99C" font-size="11" text-anchor="middle">1784 · 纯几何球体靠阶前微缩人影释放崇高体量</text>
    </svg>`,
  },
  {
    id: "friedrich",
    year: "1808–1810",
    title: "弗里德里希《海边修士》",
    en: "CASPAR DAVID FRIEDRICH · DER MÖNCH AM MEER",
    ratio: "天海画高 110 cm vs 修士背影约 11 cm（≈ 10:1）",
    text: "德国浪漫主义画家卡斯帕·大卫·弗里德里希在柏林展出的油画《海边修士》（110 × 171.5 cm，现藏柏林旧国家画廊）彻底删去前景树石与中景帆船，让整幅画超过四分之三成为压顶苍穹与墨色海面，只在沙丘边缘立下一尊极渺小的黑袍背影。没有多余过渡物，极简巨微直接把敬畏与孤寂推到极致。",
    source: "核实来源：柏林国家博物馆旧国家画廊（Alte Nationalgalerie, NG 9/85）",
    svg: `<svg viewBox="0 0 420 230" aria-hidden="true">
      <rect width="420" height="230" fill="#171612"/>
      <rect x="0" y="0" width="420" height="150" fill="#2A261D"/>
      <rect x="0" y="150" width="420" height="24" fill="#0B0B09"/>
      <path d="M0 174 Q140 164 420 182 L420 230 L0 230 Z" fill="#C6B48F" fill-opacity="0.28"/>
      <circle cx="118" cy="159" r="2.2" fill="#F7CE46"/>
      <path d="M115 162 L121 162 L122 175 L114 175 Z" fill="#F7CE46"/>
      <line x1="118" y1="12" x2="118" y2="152" stroke="#F5BF12" stroke-opacity="0.45" stroke-dasharray="3 3"/>
      <text x="130" y="84" fill="#F2E0BD" font-size="11">80% 压顶海天空域</text>
      <text x="210" y="216" fill="#C6B99C" font-size="11" text-anchor="middle">1808–1810 · 删去全部中景过渡，只留无垠苍穹与一寸背影</text>
    </svg>`,
  },
  {
    id: "hokusai",
    year: "约 1830–1832",
    title: "葛饰北斋《神奈川冲浪里》",
    en: "KATSUSHIKA HOKUSAI · THE GREAT WAVE",
    ratio: "前景巨浪占高 ~78% vs 远景富士山 ~18%",
    text: "葛饰北斋在《富岳三十六景》首幅（25.7 × 37.9 cm，纽约大都会艺术博物馆藏）里玩出反向尺度剧场：把近处的海浪抬成吞天巨爪，把原本巍峨的富士山压成远处一枚矮小三角，浪谷里三艘渔舟与低伏船工更小如细针。巨大浪弧包住远山，瞬间把二维木刻撑出惊涛拍面的空间纵深。",
    source: "核实来源：纽约大都会艺术博物馆馆藏（Accession No. JP1847）",
    svg: `<svg viewBox="0 0 420 230" aria-hidden="true">
      <rect width="420" height="230" fill="#0A0A08"/>
      <path d="M24 190 Q70 36 220 56 Q162 96 184 156 Q240 198 396 186 L396 200 L24 200 Z" fill="#F5BF12"/>
      <path d="M250 168 L286 124 L322 168 Z" fill="#E9D7B2" fill-opacity="0.72"/>
      <path d="M192 168 Q228 156 266 168" stroke="#090908" stroke-width="4" fill="none"/>
      <path d="M110 156 Q152 146 190 160" stroke="#090908" stroke-width="4" fill="none"/>
      <text x="116" y="42" fill="#F2E0BD" font-size="11">巨浪占高 ≈ 78%</text>
      <text x="286" y="114" fill="#F2E0BD" font-size="11" text-anchor="middle">远山 ≈ 18%</text>
      <text x="210" y="218" fill="#C6B99C" font-size="11" text-anchor="middle">约 1830–1832 · 近巨远微的透视尺度反差制造惊人纵深</text>
    </svg>`,
  },
  {
    id: "stevens",
    year: "1957 / 1973",
    title: "史蒂文斯幂定律与唐迪斯",
    en: "S. S. STEVENS (1957) & DONIS A. DONDIS (1973)",
    ratio: "面积感知幂次 ≈ 0.7（主观滞后于物理）",
    text: "1957 年心理物理学家 S. S. Stevens 在《Psychological Review》发表幂定律，指出人类对二维视觉面积的主观感知呈压缩曲线（指数约 0.7）：物理面积翻 4 倍，主观只觉约 2.6 倍。1973 年 Donis A. Dondis 在 MIT Press《视觉素养入门》进一步强调「尺度永远是相对的」，为现代平面与网页设计（包括 Ellen Lupton 等人的当代教科书）确立了必须主动拉大极端尺差的科学依据。",
    source: "核实来源：Psychological Review 64(3), 1957；MIT Press, 1973；Princeton Architectural Press, 2008/2015",
    svg: `<svg viewBox="0 0 420 230" aria-hidden="true">
      <rect width="420" height="230" fill="#0A0A08"/>
      <line x1="54" y1="184" x2="380" y2="184" stroke="#6B614D" stroke-width="1.2"/>
      <line x1="54" y1="28" x2="54" y2="184" stroke="#6B614D" stroke-width="1.2"/>
      <line x1="54" y1="184" x2="364" y2="36" stroke="#C6B99C" stroke-dasharray="5 4" stroke-width="1.3"/>
      <path d="M54 184 Q170 116 364 82" fill="none" stroke="#F5BF12" stroke-width="3"/>
      <circle cx="364" cy="36" r="4" fill="#C6B99C"/>
      <circle cx="364" cy="82" r="5" fill="#F5BF12"/>
      <text x="278" y="34" fill="#C6B99C" font-size="11">物理面积（线性）</text>
      <text x="266" y="102" fill="#F7CE46" font-size="11">人眼主观感知（≈ A^0.7）</text>
      <text x="210" y="216" fill="#C6B99C" font-size="11" text-anchor="middle">温和尺差会被视感知压平——尺度对比必须够极端</text>
    </svg>`,
  },
];

function initSection03() {
  const tabs = [...document.querySelectorAll("[data-era-tab]")];
  const plate = document.getElementById("s03-plate");
  const yearEl = document.getElementById("s03-year");
  const titleEl = document.getElementById("s03-title");
  const enEl = document.getElementById("s03-en");
  const ratioEl = document.getElementById("s03-ratio");
  const textEl = document.getElementById("s03-text");
  const srcEl = document.getElementById("s03-source");
  if (!tabs.length || !plate) return;

  function select(idx) {
    const era = ERAS[idx];
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    plate.innerHTML = era.svg;
    yearEl.textContent = era.year;
    titleEl.textContent = era.title;
    enEl.textContent = era.en;
    ratioEl.textContent = era.ratio;
    textEl.textContent = era.text;
    srcEl.textContent = era.source;
  }

  tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
  select(0);
}

// ---------------------------------------------------------------------------
// 04 节：四种真实版面 — 可推拉「平权稿 vs 尺度对比稿」对照帘
// ---------------------------------------------------------------------------
const ARENAS = [
  {
    id: "poster",
    label: "展览海报",
    summary: "同样一行标题与一张主图形，把主视觉拉大到破框压场并把展览时间压成精准微注脚后，整张海报在十米外就能抓人。",
    weak: `
      <div class="arena-mock arena-weak">
        <div class="am-kicker">AUTUMN EXHIBITION</div>
        <div class="am-mid-title">光与巨构建筑展</div>
        <div class="am-mid-circle"></div>
        <div class="am-mid-meta">10.18 — 11.30 · 城市美术馆北厅 · 免费预约</div>
      </div>`,
    strong: `
      <div class="arena-mock arena-strong">
        <div class="am-giant-circle"></div>
        <div class="am-hero-wrap">
          <div class="am-hero-title">光与巨构</div>
          <div class="am-micro-meta">
            <span>AUTUMN ARCHITECTURE EXHIBITION</span>
            <span>10.18 — 11.30 · 城市美术馆北厅</span>
          </div>
        </div>
      </div>`,
  },
  {
    id: "web",
    label: "网页首屏",
    summary: "把首屏口号与导航/辅助说明拉开 4.5× 以上字号断崖，用户 1 秒内就能读出产品定位，不必在平权文案里找重点。",
    weak: `
      <div class="arena-mock arena-web arena-weak">
        <div class="am-nav"><span>产品首页</span><span>定价方案</span><span>更新日志</span><span>登录</span></div>
        <div class="am-web-body">
          <div class="am-web-h-weak">让每次排版都有焦点</div>
          <p class="am-web-p-weak">三百五十种经典视觉构图原则在线交互实验室，支持桌面与手机直接打开体验。</p>
          <span class="am-btn-weak">立即开始体验</span>
        </div>
      </div>`,
    strong: `
      <div class="arena-mock arena-web arena-strong">
        <div class="am-nav am-nav-micro"><span>INDEX</span><span>350 PRINCIPLES</span><span>PLAY</span></div>
        <div class="am-web-body">
          <div class="am-web-h-strong">一眼定焦点</div>
          <div class="am-web-foot">
            <p class="am-web-p-micro">099 · SCALE CONTRAST · 极端尺差锁死注意力</p>
            <span class="am-btn-strong">开始体验 →</span>
          </div>
        </div>
      </div>`,
  },
  {
    id: "data",
    label: "数据大字",
    summary: "汇报单条关键结论时，把核心数字放大到占半屏、把单位与统计口径缩成清晰小注（但多项并列比值时切忌用面积尺度误导读者）。",
    weak: `
      <div class="arena-mock arena-data arena-weak">
        <div class="am-data-row"><span>主视觉面积占比</span><strong>66%</strong></div>
        <div class="am-data-row"><span>主次高度比值</span><strong>8.3×</strong></div>
        <div class="am-data-row"><span>留黑呼吸比例</span><strong>48%</strong></div>
      </div>`,
    strong: `
      <div class="arena-mock arena-data arena-strong">
        <div class="am-giant-num">8.3<span>×</span></div>
        <div class="am-data-caption">
          <strong>主次高度落差</strong>
          <span>原海报典范 · 物理面积 69× / 留黑 48%</span>
        </div>
      </div>`,
  },
  {
    id: "book",
    label: "书封包装",
    summary: "大面积素色封面上只放一枚巨型抽象符号或首字，书名与作者退成精细小字，货架与屏幕缩略图辨识度双双拉满。",
    weak: `
      <div class="arena-mock arena-book arena-weak">
        <div class="am-book-card">
          <div class="am-book-t-weak">视觉素养入门</div>
          <div class="am-book-s-weak">A PRIMER OF VISUAL LITERACY</div>
          <div class="am-book-dot-weak"></div>
          <div class="am-book-a-weak">DONIS A. DONDIS 著</div>
        </div>
      </div>`,
    strong: `
      <div class="arena-mock arena-book arena-strong">
        <div class="am-book-card am-book-card-strong">
          <div class="am-book-orb"></div>
          <div class="am-book-micro-col">
            <div class="am-book-t-micro">视觉素养入门</div>
            <div class="am-book-a-micro">DONIS A. DONDIS · 1973</div>
          </div>
        </div>
      </div>`,
  },
];

function initSection04() {
  const tabs = [...document.querySelectorAll("[data-arena-tab]")];
  const stage = document.getElementById("s04-stage");
  const beforeBox = document.getElementById("s04-before");
  const afterBox = document.getElementById("s04-after");
  const divider = document.getElementById("s04-divider");
  const range = document.getElementById("s04-curtain");
  const summaryEl = document.getElementById("s04-summary");
  const pctEl = document.getElementById("s04-pct");
  if (!tabs.length || !stage) return;

  let curIdx = 0;
  let split = 52; // %

  function applySplit(val) {
    split = Math.max(8, Math.min(92, Math.round(val)));
    afterBox.style.clipPath = `inset(0 0 0 ${split}%)`;
    divider.style.left = `${split}%`;
    range.value = String(split);
    pctEl.textContent = `左平权 ${split}% / 右尺度对比 ${100 - split}%`;
  }

  function selectArena(idx) {
    curIdx = idx;
    const item = ARENAS[idx];
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    beforeBox.innerHTML = item.weak;
    afterBox.innerHTML = item.strong;
    summaryEl.textContent = item.summary;
    applySplit(split);
  }

  tabs.forEach((t, i) => t.addEventListener("click", () => selectArena(i)));
  range.addEventListener("input", () => applySplit(Number(range.value)));

  // 支持直接在对比画框上拖拉拉门
  let dragging = false;
  function updateFromClientX(clientX) {
    const r = stage.getBoundingClientRect();
    if (r.width < 10) return;
    applySplit(((clientX - r.left) / r.width) * 100);
  }
  stage.addEventListener("mousedown", (e) => {
    dragging = true;
    updateFromClientX(e.clientX);
  });
  window.addEventListener("mousemove", (e) => {
    if (dragging) updateFromClientX(e.clientX);
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
  });
  stage.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length) {
        dragging = true;
        updateFromClientX(e.touches[0].clientX);
      }
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchmove",
    (e) => {
      if (dragging && e.touches.length) {
        updateFromClientX(e.touches[0].clientX);
      }
    },
    { passive: true }
  );
  stage.addEventListener("touchend", () => {
    dragging = false;
  });

  selectArena(0);
}

// ---------------------------------------------------------------------------
// 05 节：什么时候别用尺度对比 — 三问诊断处方器
// ---------------------------------------------------------------------------
function initSection05() {
  const inputs = [...document.querySelectorAll("[data-triage]")];
  const verdictBadge = document.getElementById("s05-verdict-badge");
  const verdictTitle = document.getElementById("s05-verdict-title");
  const verdictBody = document.getElementById("s05-verdict-body");
  const verdictLink = document.getElementById("s05-verdict-link");
  if (!inputs.length) return;

  function evaluateTriage() {
    const goal = document.querySelector('input[name="triage-goal"]:checked')?.value || "impact";
    const size = document.querySelector('input[name="triage-size"]:checked')?.value || "large";
    const risk = document.querySelector('input[name="triage-risk"]:checked')?.value || "low";

    if (risk === "high") {
      verdictBadge.textContent = "明确禁用 · 改用均衡层级";
      verdictBadge.className = "triage-badge is-warn";
      verdictTitle.textContent = "别把安全警示、法规条款或价格风险缩成蚂蚁字";
      verdictBody.textContent =
        "在医疗说明、金融风险提示或合同条款里使用极端尺度对比，会让微元素被忽略甚至造成合规隐患。请把核心信息与风险提示放进清晰可读的阶梯层级中。";
      verdictLink.href = "https://layout.xiaoxiaodong.ai/095/play/";
      verdictLink.textContent = "改看 095 视觉层级原则 →";
      return;
    }

    if (goal === "compare") {
      verdictBadge.textContent = "不推荐 · 改用比例与并置";
      verdictBadge.className = "triage-badge is-warn";
      verdictTitle.textContent = "多项商品、参数或方案平等对比时，尺度悬殊会制造偏见";
      verdictBody.textContent =
        "当读者需要公平横评 3–6 个选项（如比价表、功能矩阵、多图相册）时，刻意放大某一项会直接歪曲判断。应保持同尺并列，用留白或框线分组。";
      verdictLink.href = "https://layout.xiaoxiaodong.ai/105/play/";
      verdictLink.textContent = "改看 105 并置原则 →";
      return;
    }

    if (goal === "reading") {
      verdictBadge.textContent = "仅限开篇 · 正文慎用";
      verdictBadge.className = "triage-badge is-mid";
      verdictTitle.textContent = "长文深度阅读正文需要稳定节奏，不要反复出现巨字断层";
      verdictBody.textContent =
        "可以在文章首屏大标题或章节数字上用一次强尺度对比拉开气势，但进入正文段落后应回到温和克制的字阶与舒适行宽，避免打断沉浸阅读。";
      verdictLink.href = "https://layout.xiaoxiaodong.ai/098/play/";
      verdictLink.textContent = "改看 098 比例原则 →";
      return;
    }

    if (size === "tiny") {
      verdictBadge.textContent = "高风险 · 改用明暗或色彩对比";
      verdictBadge.className = "triage-badge is-warn";
      verdictTitle.textContent = "在图标、弹窗或极小卡片上，微元素一缩就糊成噪点";
      verdictBody.textContent =
        "容器宽度不足 240px 时，强行追求 8:1 尺差会把小字压到 10px 以下而彻底失读。小尺寸界面更适合用明暗反差、色彩反差或独立留白隔离来抢焦点。";
      verdictLink.href = "https://layout.xiaoxiaodong.ai/100/play/";
      verdictLink.textContent = "改看 100 明暗对比原则 →";
      return;
    }

    verdictBadge.textContent = "高度契合 · 放心拉满 099";
    verdictBadge.className = "triage-badge is-ok";
    verdictTitle.textContent = "这正是尺度对比最擅长的舞台：果断跳过中档，直拉极差";
    verdictBody.textContent =
      "画幅充裕、只需一秒锁死单一主角且无隐藏条款顾虑。大胆把核心视觉推到画幅 60%–80%，删掉中间过渡装饰，再留一处清晰可辨的人类尺标或微注脚。";
    verdictLink.href = "#hero-stage";
    verdictLink.textContent = "回到开场实验台试拉尺度 ↑";
  }

  inputs.forEach((el) => el.addEventListener("change", evaluateTriage));
  evaluateTriage();
}

// ---------------------------------------------------------------------------
// 06 节：小练习（3 题严格单变量控制、纯中性 A/B/C/D 标签）
// ---------------------------------------------------------------------------
const QUIZ = [
  {
    id: "q1",
    prompt: "第 1 题（仅改变主次尺度比）：四张图的色板、暗丘弧线与元素数量完全相同，哪一张真正成立了尺度对比？",
    answer: "B",
    options: [
      {
        key: "A",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="68" cy="64" r="24" fill="#F5BF12"/><circle cx="122" cy="70" r="4.5" fill="#F7CE46"/><rect x="116" y="75" width="12" height="28" rx="3" fill="#F7CE46"/></svg>`,
        explain: "选项 A 的金球与人影高度比仅约 1.4×，经人眼面积压缩后几乎像平起平坐，缺乏尺度张力。",
      },
      {
        key: "B",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="68" cy="56" r="42" fill="#F5BF12"/><circle cx="132" cy="91" r="1.7" fill="#F7CE46"/><rect x="130.5" y="93" width="3" height="8.5" rx="1" fill="#F7CE46"/></svg>`,
        explain: "正确！选项 B 把主球与人影高差拉到约 8.2×，既绕开视觉感知压缩，又保住了深黑留白托举与清晰人形轮廓。",
      },
      {
        key: "C",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><circle cx="88" cy="62" r="84" fill="#F5BF12"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="132" cy="91" r="1.7" fill="#090908"/><rect x="130.5" y="93" width="3" height="8.5" rx="1" fill="#090908"/></svg>`,
        explain: "选项 C 的巨球膨胀到塞满整个画幅，深黑夜幕几乎消失，黄色退化成了普通背景底色，反而失去巨物边界。",
      },
      {
        key: "D",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="68" cy="56" r="42" fill="#F5BF12"/><rect x="132" y="100" width="1.2" height="1.8" fill="#F7CE46"/></svg>`,
        explain: "选项 D 把参照人影压小到 1.5% 以下，连人形轮廓都无法辨认，在手机上只像屏幕噪点，尺标宣告失效。",
      },
    ],
  },
  {
    id: "q2",
    prompt: "第 2 题（仅改变参照物与中号干扰）：四张图里的主金球尺寸完全一致，哪一张的配角处理最能把「巨感」衬托出来？",
    answer: "C",
    options: [
      {
        key: "A",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="72" cy="56" r="41" fill="#F5BF12"/></svg>`,
        explain: "选项 A 撤走了所有小参照，只剩一颗孤立的黄球——没有可比对的尺标，大脑无从感受它的真实体量。",
      },
      {
        key: "B",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="56" cy="56" r="41" fill="#F5BF12"/><circle cx="110" cy="64" r="22" fill="#CFA128"/><circle cx="142" cy="78" r="12" fill="#B58B24"/><circle cx="160" cy="91" r="1.7" fill="#F7CE46"/><rect x="158.5" y="93" width="3" height="8.5" rx="1" fill="#F7CE46"/></svg>`,
        explain: "选项 B 在巨球与小人之间塞了两个递减的中号圆球，把干脆的尺度断崖填成了平滑楼梯，震撼感被明显稀释。",
      },
      {
        key: "C",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="68" cy="56" r="41" fill="#F5BF12"/><circle cx="136" cy="91" r="1.7" fill="#F7CE46"/><rect x="134.5" y="93" width="3" height="8.5" rx="1" fill="#F7CE46"/></svg>`,
        explain: "正确！选项 C 删光中间过渡物，用一片干净深黑净隙隔开巨球与山脊微光小人，形成最纯粹的二元尺度断崖。",
      },
      {
        key: "D",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><path d="M0 105 Q90 94 180 106 L180 124 L0 124 Z" fill="#1A150B"/><circle cx="78" cy="64" r="41" fill="#F5BF12"/><circle cx="106" cy="88" r="1.7" fill="#F7CE46"/><rect x="104.5" y="90" width="3" height="8.5" rx="1" fill="#F7CE46"/></svg>`,
        explain: "选项 D 的微光小人直接撞进巨球边缘重叠，亮黄叠亮黄导致尺标轮廓被吞没，空间前后关系也随之塌平。",
      },
    ],
  },
  {
    id: "q3",
    prompt: "第 3 题（仅改变排版字阶断崖）：同一段展览标题与时间文案，色板与左对齐全同，哪一张的文字尺度对比成立且实用？",
    answer: "B",
    options: [
      {
        key: "A",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><text x="16" y="44" fill="#F2E0BD" font-size="14" font-weight="700">秋季空间建筑展</text><text x="16" y="68" fill="#E9D7B2" font-size="12">10.18 — 11.30 城市美术馆</text><text x="16" y="90" fill="#C6B99C" font-size="11">免费预约入场 · 周二至周日</text></svg>`,
        explain: "选项 A 三行字分别只有 14 / 12 / 11 的微弱级差，读者进画面后分不清视觉入口，平淡如备忘录。",
      },
      {
        key: "B",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><text x="16" y="58" fill="#F5BF12" font-size="38" font-weight="900">巨构</text><line x1="16" y1="74" x2="164" y2="74" stroke="#6B614D" stroke-dasharray="3 3"/><text x="16" y="92" fill="#F2E0BD" font-size="10">秋季空间建筑展 · 10.18—11.30</text><text x="16" y="108" fill="#C6B99C" font-size="9">城市美术馆北厅 · 免费预约</text></svg>`,
        explain: "正确！选项 B 用超巨主标一秒定住焦点，下方细线隔出清晰可读的微注脚，既具极端尺差又保证信息不失读。",
      },
      {
        key: "C",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><text x="16" y="28" fill="#C6B99C" font-size="10">秋季空间建筑展</text><text x="16" y="76" fill="#F5BF12" font-size="34" font-weight="900">周二闭馆</text><text x="16" y="104" fill="#E9D7B2" font-size="10">城市美术馆北厅</text></svg>`,
        explain: "选项 C 虽然拉开了大字号落差，却把次要票务须知「周二闭馆」放大成主角、把展览主题压成细字，犯了主次倒挂。",
      },
      {
        key: "D",
        svg: `<svg viewBox="0 0 180 124" aria-hidden="true"><rect width="180" height="124" fill="#0A0A08"/><text x="16" y="58" fill="#F5BF12" font-size="38" font-weight="900">巨构</text><text x="16" y="98" fill="#9E9278" font-size="4.5">秋季空间建筑展 10.18-11.30 城市美术馆北厅 免费预约</text></svg>`,
        explain: "选项 D 过度追求字号反差，把关键时间地点压成彻底看不清的蚂蚁字，违背了信息传达的可读底线。",
      },
    ],
  },
];

function initSection06() {
  const container = document.getElementById("s06-quiz");
  const scoreEl = document.getElementById("s06-score");
  const resetBtn = document.getElementById("s06-reset");
  if (!container) return;

  const picked = {};

  function render() {
    let correct = 0;
    let answered = 0;
    QUIZ.forEach((q) => {
      if (picked[q.id]) {
        answered++;
        if (picked[q.id] === q.answer) correct++;
      }
    });
    scoreEl.textContent = `已答 ${answered}/${QUIZ.length} · 答对 ${correct} 题`;

    container.innerHTML = QUIZ.map((q) => {
      const choice = picked[q.id];
      const chosenOpt = q.options.find((o) => o.key === choice);
      const isRight = choice === q.answer;
      return `
        <article class="quiz-card" data-qid="${q.id}">
          <h3 class="quiz-prompt">${q.prompt}</h3>
          <div class="quiz-grid">
            ${q.options
              .map((o) => {
                const isSelected = choice === o.key;
                const cls = [
                  "quiz-opt",
                  isSelected ? (o.key === q.answer ? "is-correct" : "is-wrong") : "",
                  choice && o.key === q.answer && !isSelected ? "is-reveal" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return `
                  <button type="button" class="${cls}" data-pick="${q.id}:${o.key}" aria-pressed="${isSelected}">
                    <span class="quiz-key">${o.key}</span>
                    <span class="quiz-thumb">${o.svg}</span>
                  </button>`;
              })
              .join("")}
          </div>
          ${
            chosenOpt
              ? `<div class="quiz-feedback ${isRight ? "is-ok" : "is-bad"}">
                  <strong>${isRight ? `选对了（${q.answer}）` : `本题应选 ${q.answer}，你选了 ${choice}`}：</strong>${chosenOpt.explain}${
                    !isRight ? ` ${q.options.find((o) => o.key === q.answer).explain}` : ""
                  }
                </div>`
              : `<div class="quiz-feedback is-idle">点击上方 A / B / C / D 任一画幅作答，只差一个构图变量。</div>`
          }
        </article>`;
    }).join("");

    container.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [qid, key] = btn.dataset.pick.split(":");
        picked[qid] = key;
        render();
      });
    });
  }

  resetBtn?.addEventListener("click", () => {
    Object.keys(picked).forEach((k) => delete picked[k]);
    render();
  });

  render();
}

// ---------------------------------------------------------------------------
// 07 节：原海报全屏灯箱（缩放 + 拖动 + draggable="false" + Esc 关闭）
// ---------------------------------------------------------------------------
function initSection07() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbViewport = document.getElementById("lb-viewport");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const zoomLabel = document.getElementById("lb-zoom-val");
  if (!trigger || !lightbox || !lbImg || !posterImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale.toFixed(2)})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function openBox() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeBox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openBox);
  closeBtn.addEventListener("click", closeBox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === lbViewport) closeBox();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeBox();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.4);
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(1, scale - 0.4);
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbViewport.addEventListener("mousedown", (e) => {
    if (e.target !== lbImg) return;
    drag = { x: e.clientX, y: e.clientY, tx, ty };
  });
  window.addEventListener("mousemove", (e) => {
    if (!drag) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    drag = null;
  });
  lbViewport.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1 && e.target === lbImg) {
        drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
      }
    },
    { passive: true }
  );
  lbViewport.addEventListener(
    "touchmove",
    (e) => {
      if (drag && e.touches.length === 1) {
        tx = drag.tx + (e.touches[0].clientX - drag.x);
        ty = drag.ty + (e.touches[0].clientY - drag.y);
        applyTransform();
      }
    },
    { passive: true }
  );
  lbViewport.addEventListener("touchend", () => {
    drag = null;
  });
}

export function initAllSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initSection07();
}
