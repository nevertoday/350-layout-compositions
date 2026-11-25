// 328 虚实 相生构图 · 正文各节独立交互模块
// 每节使用不同交互机制，绝不在相邻节重复同类控件。

// ---------- 01 节：水平拉幕对比仪（无过渡硬切 ⇄ 半透穿插） ----------
export function initCompareCurtain() {
  const wrap = document.getElementById("curtain-stage");
  const range = document.getElementById("curtain-range");
  const divider = document.getElementById("curtain-divider");
  const clipLeft = document.getElementById("curtain-clip-rect");
  const readout = document.getElementById("curtain-readout");
  const explain = document.getElementById("curtain-explain");
  if (!wrap || !range || !divider || !clipLeft) return;

  function apply(pct) {
    const p = Math.max(4, Math.min(96, Math.round(pct)));
    range.value = String(p);
    clipLeft.setAttribute("width", String((p / 100) * 640));
    divider.style.left = `${p}%`;
    if (readout) readout.textContent = `硬切 ${p}% ｜ 半透穿插 ${100 - p}%`;
    if (explain) {
      if (p >= 72) {
        explain.textContent = "目前几乎全屏处于「无过渡硬切」：瓷白实体直接贴在深青底上，边界骤然断开，画面像平贴的剪纸，缺少前后纵深。";
      } else if (p <= 28) {
        explain.textContent = "目前几乎全屏进入「半透穿插」：翠玉透屏与柔雾把硬实边化开，圆环在屏内退后一层，阶梯却从屏前浮出，实与虚互相咬合。";
      } else {
        explain.textContent = "拉幕停在中段对比带：左边是硬切贴片（只有实与虚两级），右边加入了「过渡层（虚实交织）」，同一组形状立刻长出前后景深。";
      }
    }
  }

  range.addEventListener("input", () => apply(Number(range.value)));

  let active = false;
  const moveFromClientX = (clientX) => {
    const r = wrap.getBoundingClientRect();
    apply(((clientX - r.left) / r.width) * 100);
  };
  wrap.addEventListener("pointerdown", (e) => {
    active = true;
    wrap.setPointerCapture(e.pointerId);
    moveFromClientX(e.clientX);
  });
  wrap.addEventListener("pointermove", (e) => {
    if (active) moveFromClientX(e.clientX);
  });
  wrap.addEventListener("pointerup", () => { active = false; });
  wrap.addEventListener("pointercancel", () => { active = false; });

  apply(50);
}

// ---------- 02 节：4 拍视线节奏剧场 + 抽走一环破坏测试 ----------
const FLOW_BEATS = [
  {
    step: 1,
    title: "第一拍 · 轻雾引流",
    en: "ENTRY VIA MIST",
    text: "左下三道半透水雾波纹把空白吹活，视线不带压迫感地从低对比的虚处滑进画面。",
    dot: { x: 118, y: 274 },
  },
  {
    step: 2,
    title: "第二拍 · 阶梯承实",
    en: "ANCHOR & ASCENT",
    text: "朱橙方基稳住左下角，瓷白阶梯沿对角斜线向上拾级而升，把目光自然托向右上主体。",
    dot: { x: 258, y: 236 },
  },
  {
    step: 3,
    title: "第三拍 · 透屏交织",
    en: "VEIL INTERPENETRATION",
    text: "半透翠玉方屏拦腰切过阶梯与白环交界，前景白阶清朗、后景圆环微柔，视线瞬间读出空间进深。",
    dot: { x: 344, y: 184 },
  },
  {
    step: 4,
    title: "第四拍 · 环眼落焦",
    en: "FOCAL LOCK & RELEASE",
    text: "目光攀上瓷白圆环并钉在环内沿的朱橙焦点上，再借中空深青环眼回吐进右上留白，形成永不卡死的呼吸循环。",
    dot: { x: 468, y: 158 },
  },
];

const BREAK_MODES = {
  intact: {
    label: "完整循环",
    status: "4 拍贯通",
    ok: true,
    note: "左下雾波起势 → 阶梯托举 → 透屏柔化 → 朱橙焦点锁目 → 环眼回吐留白。目光走完一圈还会自然回到起点。",
    path: "M 78 278 C 145 276, 190 258, 258 234 C 304 216, 336 186, 384 148 C 430 112, 496 122, 470 160 C 446 196, 380 184, 348 118",
  },
  choke_eye: {
    label: "封死环眼",
    status: "右上滞重",
    ok: false,
    note: "把圆环中间的深青虚眼填死成一块实白饼后，视线一冲到右上就被硬白墙挡住，失去向远处留白回吐的出口。",
    path: "M 78 278 C 145 276, 190 258, 258 234 C 304 216, 355 178, 434 142",
  },
  cut_waves: {
    label: "撤掉雾波斜线",
    status: "入口断拍",
    ok: false,
    note: "拿掉左下三道水雾波纹与对角细线，左下大片深青变成死空，眼睛直接生硬跳撞到右上圆环，丢失由虚入实的过渡节奏。",
    path: "M 366 196 C 392 174, 444 134, 470 160",
  },
  double_dot: {
    label: "加第二枚橙点",
    status: "左右扯焦",
    ok: false,
    note: "在左上空白再添一枚同等浓度的朱橙圆点，视线立刻在两枚强实点之间来回弹跳，环心的主次节奏被彻底拆散。",
    path: "M 136 106 C 230 120, 356 144, 470 160 C 370 176, 232 146, 136 106",
  },
};

export function initFlowTheater() {
  const beatBtns = [...document.querySelectorAll("[data-flow-beat]")];
  const breakBtns = [...document.querySelectorAll("[data-flow-break]")];
  const playBtn = document.getElementById("flow-play");
  const svg = document.getElementById("flow-svg");
  const routePath = document.getElementById("flow-route");
  const pulseDot = document.getElementById("flow-pulse");
  const beatTitle = document.getElementById("flow-beat-title");
  const beatText = document.getElementById("flow-beat-text");
  const breakBadge = document.getElementById("flow-break-badge");
  const eyeHollow = document.getElementById("flow-ring-eye");
  const wavesGroup = document.getElementById("flow-waves-group");
  const decoyDot = document.getElementById("flow-decoy-dot");
  if (!svg || !routePath || !pulseDot) return;

  let currentBeat = 1;
  let currentBreak = "intact";
  let playing = false;
  let timer = 0;

  function render() {
    const bm = BREAK_MODES[currentBreak];
    const beat = FLOW_BEATS[currentBeat - 1];

    routePath.setAttribute("d", bm.path);
    routePath.classList.toggle("is-broken", !bm.ok);
    if (eyeHollow) eyeHollow.style.opacity = currentBreak === "choke_eye" ? "0" : "1";
    if (wavesGroup) wavesGroup.style.opacity = currentBreak === "cut_waves" ? "0.06" : "1";
    if (decoyDot) decoyDot.style.opacity = currentBreak === "double_dot" ? "1" : "0";

    if (bm.ok) {
      pulseDot.setAttribute("cx", String(beat.dot.x));
      pulseDot.setAttribute("cy", String(beat.dot.y));
      pulseDot.style.opacity = "1";
      if (beatTitle) beatTitle.textContent = `${beat.title} · ${beat.en}`;
      if (beatText) beatText.textContent = beat.text;
    } else {
      pulseDot.style.opacity = "0.25";
      if (beatTitle) beatTitle.textContent = `破坏实验：${bm.label}`;
      if (beatText) beatText.textContent = bm.note;
    }

    if (breakBadge) {
      breakBadge.textContent = bm.status;
      breakBadge.classList.toggle("is-err", !bm.ok);
    }

    beatBtns.forEach((b) => {
      const on = Number(b.dataset.flowBeat) === currentBeat && bm.ok;
      b.setAttribute("aria-pressed", String(on));
    });
    breakBtns.forEach((b) => {
      const on = b.dataset.flowBreak === currentBreak;
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function stopPlay() {
    playing = false;
    clearInterval(timer);
    if (playBtn) {
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.textContent = "自动演播 4 拍";
    }
  }

  beatBtns.forEach((b) => {
    b.addEventListener("click", () => {
      stopPlay();
      currentBreak = "intact";
      currentBeat = Number(b.dataset.flowBeat);
      render();
    });
  });

  breakBtns.forEach((b) => {
    b.addEventListener("click", () => {
      stopPlay();
      currentBreak = b.dataset.flowBreak;
      render();
    });
  });

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (playing) {
        stopPlay();
        return;
      }
      currentBreak = "intact";
      playing = true;
      playBtn.setAttribute("aria-pressed", "true");
      playBtn.textContent = "暂停演播";
      render();
      timer = setInterval(() => {
        currentBeat = (currentBeat % 4) + 1;
        render();
      }, 1600);
    });
  }

  render();
}

// ---------- 03 节：古今实虚几何标本灯箱（深青暗室） ----------
const SPECIMENS = {
  mayuan: {
    name: "南宋 · 传马远《寒江独钓图》",
    meta: "东京国立博物馆藏 · TA-140 · 绢本 26.7 × 50.6 cm",
    quote: "一叶孤舟与数道淡墨水波为「实」，满幅未着墨的素绢遂化为浩渺寒江之「虚」。",
    solid: "中下方极凝练的孤舟与钓者侧影，落墨不到画面一成，轮廓利落。",
    void: "四周大片素绢不画一笔，借孤舟的体量与朝向生出天寒水阔的江面。",
    trans: "船腹下三五道极淡细波纹与垂钓细线，把实舟柔和过渡进整片江空。",
    svg: `
      <g class="sp-void"><rect x="18" y="18" width="524" height="284" fill="#034849" stroke="#3D8782" stroke-dasharray="4 4"/></g>
      <g class="sp-trans">
        <path d="M90 218 Q180 208 260 220 T440 214" fill="none" stroke="#6FAEA7" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
        <path d="M120 238 Q210 229 300 240 T470 234" fill="none" stroke="#6FAEA7" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
        <path d="M294 176 Q336 140 374 168" fill="none" stroke="#CBE0DC" stroke-width="1.3" stroke-dasharray="3 3"/>
      </g>
      <g class="sp-solid">
        <path d="M196 198 Q248 214 304 192 L286 208 L210 208 Z" fill="#F4F5F0"/>
        <path d="M236 196 A16 14 0 0 1 268 196 Z" fill="#F4F5F0"/>
        <circle cx="288" cy="184" r="6" fill="#F56813"/>
      </g>
    `,
  },
  dachongguang: {
    name: "清康熙十九年（1680）· 笪重光《画筌》云气章法",
    meta: "《画筌》：「空本难图，实景清而空景现……虚实相生，无画处皆成妙境。」",
    quote: "山水画并不把山峦连成铁板，而以一道横向「云气（虚）」拦腰截断实山，使近坡、中云、远峰三层自生纵深。",
    solid: "近景浓重坡石与右上清朗远峰，轮廓清晰，定出画面筋骨。",
    void: "画幅左上与峰顶大片空天，容纳视线远望的余韵。",
    trans: "横贯山腰的半透流云带，一面隐去山脚接缝，一面把远近两山柔连为一体。",
    svg: `
      <g class="sp-void"><rect x="18" y="18" width="524" height="284" fill="#034849" stroke="#3D8782" stroke-dasharray="4 4"/></g>
      <g class="sp-solid">
        <path d="M310 210 L392 78 L452 152 L494 114 L528 210 Z" fill="#F4F5F0"/>
        <path d="M36 286 L128 206 L216 244 L290 286 Z" fill="#F4F5F0"/>
        <circle cx="392" cy="126" r="7" fill="#F56813"/>
      </g>
      <g class="sp-trans">
        <rect x="86" y="164" width="420" height="62" fill="#1F736D" fill-opacity="0.78" stroke="#CBE0DC" stroke-width="1"/>
        <ellipse cx="220" cy="170" rx="110" ry="26" fill="#6FAEA7" fill-opacity="0.34"/>
        <ellipse cx="380" cy="212" rx="125" ry="24" fill="#6FAEA7" fill-opacity="0.28"/>
      </g>
    `,
  },
  nolli: {
    name: "1748 年 · Giambattista Nolli《罗马大图》图底法",
    meta: "Pianta Grande di Roma · 12 块铜版测绘 · 建筑与城市实虚经典",
    quote: "诺利把私密建筑实体涂黑，却把街道、广场连同万神殿与柱廊的公共室内全部留白，让「实中含虚、内外贯通」跃然纸上。",
    solid: "涂实的高密度私密街区与厚实墙墩，界定出城市不可穿越的硬边界。",
    void: "街道、广场与公共大殿内部连通成一片连续的公共流动空白。",
    trans: "柱廊门厅与半开敞中庭，用细列柱点阵衔接室外广场与室内殿堂。",
    svg: `
      <g class="sp-void"><rect x="18" y="18" width="524" height="284" fill="#034849" stroke="#3D8782" stroke-dasharray="4 4"/></g>
      <g class="sp-solid">
        <path d="M44 42 H214 V134 H44 Z M44 176 H178 V278 H44 Z M268 42 H516 V278 H268 Z M392 104 A58 58 0 1 0 392 220 A58 58 0 1 0 392 104 Z" fill="#F4F5F0" fill-rule="evenodd"/>
        <rect x="242" y="140" width="96" height="44" fill="#034849"/>
        <circle cx="392" cy="162" r="8" fill="#F56813"/>
      </g>
      <g class="sp-trans">
        <rect x="220" y="128" width="114" height="68" fill="#1F736D" fill-opacity="0.58" stroke="#CBE0DC" stroke-width="1"/>
        <circle cx="240" cy="144" r="4" fill="#F4F5F0"/><circle cx="264" cy="144" r="4" fill="#F4F5F0"/><circle cx="288" cy="144" r="4" fill="#F4F5F0"/>
        <circle cx="240" cy="180" r="4" fill="#F4F5F0"/><circle cx="264" cy="180" r="4" fill="#F4F5F0"/><circle cx="288" cy="180" r="4" fill="#F4F5F0"/>
      </g>
    `,
  },
  rubin: {
    name: "1915 年 · Edgar Rubin《视知觉图形》图底临界",
    meta: "Synsoplevede Figurer · 双稳态图底反转 vs 中国三态虚实相生",
    quote: "鲁宾杯证明「图与底共享同一条边界」，大脑在同一瞬间只能在花瓶与双侧影间二选一；而中国「虚实相生」多设一层柔和过渡，让实与虚同场共存而非彼此排斥。",
    solid: "中央高反差瓷白器皿轮廓，边界收紧时立刻成为前景「图」。",
    void: "左右对称深青余域，翻转聚焦时化作两张极简几何侧影（不画五官细节）。",
    trans: "若在边界中段叠上一层半透翠玉屏，二元硬抢立即缓和为前后层叠关系。",
    svg: `
      <g class="sp-void"><rect x="18" y="18" width="524" height="284" fill="#034849" stroke="#3D8782" stroke-dasharray="4 4"/></g>
      <g class="sp-solid">
        <path d="M196 52 H364 C332 94, 336 122, 314 146 C334 166, 312 184, 316 206 C332 232, 356 250, 368 272 H192 C204 250, 228 232, 244 206 C248 184, 226 166, 246 146 C224 122, 228 94, 196 52 Z" fill="#F4F5F0"/>
        <circle cx="280" cy="162" r="7" fill="#F56813"/>
      </g>
      <g class="sp-trans">
        <rect x="292" y="88" width="166" height="148" fill="#1F736D" fill-opacity="0.52" stroke="#CBE0DC" stroke-width="1" stroke-dasharray="4 4"/>
      </g>
    `,
  },
};

export function initSpecimenLightbox() {
  const tabBtns = [...document.querySelectorAll("[data-specimen]")];
  const layerBtns = [...document.querySelectorAll("[data-spec-layer]")];
  const svg = document.getElementById("specimen-svg");
  const titleEl = document.getElementById("specimen-title");
  const metaEl = document.getElementById("specimen-meta");
  const quoteEl = document.getElementById("specimen-quote");
  const solidEl = document.getElementById("specimen-solid-note");
  const voidEl = document.getElementById("specimen-void-note");
  const transEl = document.getElementById("specimen-trans-note");
  if (!svg || !tabBtns.length) return;

  let active = "mayuan";
  let layer = "all";

  function render() {
    const item = SPECIMENS[active];
    svg.innerHTML = item.svg;
    svg.dataset.layer = layer;
    if (titleEl) titleEl.textContent = item.name;
    if (metaEl) metaEl.textContent = item.meta;
    if (quoteEl) quoteEl.textContent = item.quote;
    if (solidEl) solidEl.textContent = item.solid;
    if (voidEl) voidEl.textContent = item.void;
    if (transEl) transEl.textContent = item.trans;

    tabBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.specimen === active)));
    layerBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.specLayer === layer)));
  }

  tabBtns.forEach((b) => b.addEventListener("click", () => { active = b.dataset.specimen; render(); }));
  layerBtns.forEach((b) => b.addEventListener("click", () => { layer = b.dataset.specLayer; render(); }));
  render();
}

// ---------- 04 节：当代三领域实虚密度工坊 ----------
const STUDIO_DATA = {
  poster: {
    label: "文化展演海报",
    heavy: {
      note: "实重压境：主图形与文字把全幅填到 70% 以上，呼吸空域被压成窄缝，海报虽满却没有安静停顿。",
      svg: `<rect width="460" height="280" fill="#015656"/><rect x="24" y="22" width="412" height="236" fill="#F4F5F0"/><rect x="44" y="42" width="220" height="44" fill="#015656"/><rect x="44" y="102" width="372" height="28" fill="#015656" opacity="0.72"/><rect x="44" y="144" width="372" height="28" fill="#015656" opacity="0.72"/><rect x="44" y="186" width="372" height="52" fill="#F56813"/>`,
    },
    balanced: {
      note: "虚实交织：右上实心圆环内透深青虚眼，磨砂信息卡轻搭环沿，朱橙日期标落在交界，大面积深青留白让展题自带声场。",
      svg: `<rect width="460" height="280" fill="#015656"/><circle cx="318" cy="122" r="78" fill="#F4F5F0"/><circle cx="318" cy="122" r="34" fill="#015656"/><rect x="176" y="138" width="128" height="106" fill="#1F736D" fill-opacity="0.74" stroke="#E2F0ED"/><rect x="196" y="160" width="84" height="10" fill="#F4F5F0"/><rect x="196" y="180" width="62" height="6" fill="#CBE0DC"/><rect x="176" y="218" width="54" height="26" fill="#F56813"/><circle cx="348" cy="138" r="8" fill="#F56813"/><rect x="38" y="42" width="96" height="14" fill="#F4F5F0"/><rect x="38" y="66" width="64" height="6" fill="#CBE0DC"/>`,
    },
    sparse: {
      note: "空灵疏朗：实形缩至不到两成、大虚占七成，适合茶席、东方器物与极简唱片封套，前提是仅保留一条核心字句。",
      svg: `<rect width="460" height="280" fill="#015656"/><circle cx="342" cy="146" r="46" fill="#F4F5F0"/><circle cx="342" cy="146" r="24" fill="#015656"/><rect x="256" y="156" width="68" height="68" fill="#1F736D" fill-opacity="0.56" stroke="#CBE0DC"/><circle cx="362" cy="158" r="6" fill="#F56813"/><rect x="42" y="220" width="76" height="8" fill="#F4F5F0"/>`,
    },
  },
  ui: {
    label: "网页首屏与磨砂卡",
    heavy: {
      note: "实重压境：所有功能块、弹窗与公告全用不透明白卡平铺满屏，缺少过渡层次，用户扫视两秒就视觉疲劳。",
      svg: `<rect width="460" height="280" fill="#015656"/><rect x="18" y="18" width="424" height="36" fill="#F4F5F0"/><rect x="18" y="64" width="136" height="96" fill="#F4F5F0"/><rect x="162" y="64" width="136" height="96" fill="#F4F5F0"/><rect x="306" y="64" width="136" height="96" fill="#F4F5F0"/><rect x="18" y="170" width="206" height="92" fill="#F4F5F0"/><rect x="234" y="170" width="208" height="92" fill="#F56813"/>`,
    },
    balanced: {
      note: "虚实交织：清晰主视觉实形 + 浮压在交界处的半透明磨砂状态卡（过渡层）+ 克制留白底面 + 唯一朱橙主按钮，层级一眼分清。",
      svg: `<rect width="460" height="280" fill="#015656"/><rect x="36" y="54" width="156" height="18" fill="#F4F5F0"/><rect x="36" y="84" width="122" height="8" fill="#CBE0DC"/><rect x="36" y="102" width="98" height="8" fill="#CBE0DC"/><rect x="36" y="134" width="92" height="28" fill="#F56813"/><circle cx="328" cy="124" r="68" fill="#F4F5F0"/><circle cx="328" cy="124" r="30" fill="#015656"/><rect x="218" y="152" width="132" height="78" fill="#1F736D" fill-opacity="0.78" stroke="#E2F0ED"/><rect x="234" y="172" width="76" height="8" fill="#F4F5F0"/><rect x="234" y="190" width="94" height="6" fill="#CBE0DC"/><rect x="234" y="204" width="60" height="6" fill="#CBE0DC"/>`,
    },
    sparse: {
      note: "空灵疏朗：品牌宣言型落地页常见排法——单句实标配大面积沉浸空场与极轻半透导航条，适合品牌官网而非后台工具。",
      svg: `<rect width="460" height="280" fill="#015656"/><rect x="148" y="108" width="164" height="16" fill="#F4F5F0"/><rect x="186" y="138" width="88" height="26" fill="#F56813"/><rect x="34" y="218" width="392" height="36" fill="#1F736D" fill-opacity="0.46" stroke="#CBE0DC" stroke-opacity="0.5"/>`,
    },
  },
  garden: {
    label: "园林漏窗与建筑光影",
    heavy: {
      note: "实重压境：一整面无开洞的实心高墙堵死视线，院内院外彻底隔绝，只剩封闭感没有借景纵深。",
      svg: `<rect width="460" height="280" fill="#015656"/><rect x="30" y="34" width="400" height="212" fill="#F4F5F0"/><line x1="30" y1="90" x2="430" y2="90" stroke="#CBD5D1" stroke-width="2"/><line x1="30" y1="150" x2="430" y2="150" stroke="#CBD5D1" stroke-width="2"/><line x1="30" y1="210" x2="430" y2="210" stroke="#CBD5D1" stroke-width="2"/>`,
    },
    balanced: {
      note: "虚实交织：白粉实墙开出月洞门（实中有虚），再以半透花窗格栅柔化内院竹影（过渡），朱红门柱点出游览入口——一步一景。",
      svg: `<rect width="460" height="280" fill="#015656"/><path d="M36 36 H424 V244 H36 Z M250 74 A66 66 0 1 0 250 206 A66 66 0 1 0 250 74 Z" fill="#F4F5F0" fill-rule="evenodd"/><rect x="86" y="88" width="98" height="98" fill="#1F736D" fill-opacity="0.72" stroke="#015656" stroke-width="2"/><path d="M86 137 H184 M135 88 V186 M102 104 L168 170 M168 104 L102 170" stroke="#E2F0ED" stroke-width="1.2" opacity="0.7"/><circle cx="304" cy="168" r="9" fill="#F56813"/><path d="M222 192 Q252 146 278 192" fill="none" stroke="#6FAEA7" stroke-width="3"/>`,
    },
    sparse: {
      note: "空灵疏朗：极简亭柱架空四面，实构件缩成细长廊柱，把最大视野让给池水与远天。",
      svg: `<rect width="460" height="280" fill="#015656"/><rect x="52" y="48" width="356" height="12" fill="#F4F5F0"/><rect x="92" y="60" width="10" height="168" fill="#F4F5F0"/><rect x="358" y="60" width="10" height="168" fill="#F4F5F0"/><rect x="52" y="228" width="356" height="8" fill="#F4F5F0"/><rect x="190" y="132" width="112" height="96" fill="#1F736D" fill-opacity="0.44" stroke="#CBE0DC"/><circle cx="363" cy="180" r="7" fill="#F56813"/>`,
    },
  },
};

export function initModernStudio() {
  const domainBtns = [...document.querySelectorAll("[data-studio-domain]")];
  const densityBtns = [...document.querySelectorAll("[data-studio-density]")];
  const svg = document.getElementById("studio-svg");
  const note = document.getElementById("studio-note");
  if (!svg || !domainBtns.length) return;

  let domain = "poster";
  let density = "balanced";

  function render() {
    const item = STUDIO_DATA[domain][density];
    svg.innerHTML = item.svg;
    if (note) note.textContent = item.note;
    domainBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.studioDomain === domain)));
    densityBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.studioDensity === density)));
  }

  domainBtns.forEach((b) => b.addEventListener("click", () => { domain = b.dataset.studioDomain; render(); }));
  densityBtns.forEach((b) => b.addEventListener("click", () => { density = b.dataset.studioDensity; render(); }));
  render();
}

// ---------- 05 节：什么时候别用 · 4 张高风险反测卡 ----------
export function initCounterCards() {
  const btns = [...document.querySelectorAll("[data-counter-toggle]")];
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".counter-card");
      if (!card) return;
      const nowFixed = card.dataset.mode !== "fixed";
      card.dataset.mode = nowFixed ? "fixed" : "bad";
      btn.setAttribute("aria-pressed", String(nowFixed));
      btn.textContent = nowFixed ? "切回：硬套虚实透层" : "切换：回归清晰实排";
      const badge = card.querySelector(".counter-badge");
      const verdict = card.querySelector(".counter-verdict");
      if (badge) badge.textContent = nowFixed ? "清晰实排 · 可靠" : "硬套透层 · 失效";
      if (verdict) verdict.textContent = nowFixed ? card.dataset.goodText : card.dataset.badText;
    });
  });
}

// ---------- 06 节：练一练（单一变量 A/B/C/D 判题） ----------
const QUIZ_ANSWERS = {
  A: {
    ok: false,
    title: "选 A 不太稳 · 差在「透屏脱开，零穿插」",
    text: "A 的圆环虚眼与朱橙焦点都在对的位置，唯独半透翠玉屏退在左下角，和瓷白实形完全没交叠（穿插 0%）。实和虚成了互不相干的两片贴纸，缺了「穿插与重叠」这一步。",
  },
  B: {
    ok: true,
    title: "选对了 · B 做到「实、虚、过渡三者相生」",
    text: "只有 B 同时守住三个条件：瓷白圆环留出深青虚眼（实中有虚），半透翠玉方屏切入圆环与阶梯约三成（穿插重叠），唯一朱橙焦点稳钉在环内实虚边界，视线自左下入画、在右上收束回吐。",
  },
  C: {
    ok: false,
    title: "选 C 偏闷 · 差在「环眼填死，实中无虚」",
    text: "C 的透屏穿插和焦点位置都对，但圆环中间的深青孔被填成一整块实白大饼（实占飙到近半幅）。右上角重量憋死，失去了「虚为实之形」的通透呼吸。",
  },
  D: {
    ok: false,
    title: "选 D 失骨 · 差在「透屏过浓放大，吞没实形与焦点」",
    text: "D 保留了圆环空心，却把翠玉透屏拉大增浊盖住了大半圆环连带朱橙焦点。过渡层喧宾夺主时，实体锐度和视觉焦点一并被蒙灰，画面发糊没精神。",
  },
};

export function initQuiz() {
  const btns = [...document.querySelectorAll("[data-quiz]")];
  const grid = document.getElementById("quiz-grid");
  const titleEl = document.getElementById("quiz-title");
  const textEl = document.getElementById("quiz-text");
  const box = document.getElementById("quiz-verdict");
  if (!btns.length || !grid) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.quiz;
      const ans = QUIZ_ANSWERS[pick];
      if (!ans) return;
      grid.classList.add("is-revealed");
      btns.forEach((b) => {
        const isPick = b.dataset.quiz === pick;
        const isRight = b.dataset.quiz === "B";
        b.setAttribute("aria-pressed", String(isPick));
        b.classList.toggle("is-correct", isRight);
        b.classList.toggle("is-wrong", isPick && !isRight);
      });
      if (box) {
        box.classList.toggle("is-ok", ans.ok);
        box.classList.toggle("is-err", !ans.ok);
      }
      if (titleEl) titleEl.textContent = ans.title;
      if (textEl) textEl.textContent = ans.text;
    });
  });
}

// ---------- 07 节：原海报放大、拖动、Esc 收起 ----------
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-btn");
  const dialog = document.getElementById("poster-dialog");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const viewport = document.getElementById("poster-viewport");
  const zoomImg = document.getElementById("poster-zoom-img");
  const posterSrcImg = document.getElementById("poster");
  if (!openBtn || !dialog || !zoomImg || !posterSrcImg) return;

  // 绝不内联两份图片：放大图直接复用 #poster 的 src
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (viewport) viewport.style.cursor = scale > 1 ? (panning ? "grabbing" : "grab") : "zoom-in";
  }

  function setScale(next) {
    scale = Math.max(1, Math.min(3, +next.toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }

  function open() {
    if (!zoomImg.getAttribute("src")) zoomImg.src = posterSrcImg.src;
    setScale(1.25);
    openBtn.setAttribute("aria-expanded", "true");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function close() {
    openBtn.setAttribute("aria-expanded", "false");
    if (dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (zoomInBtn) zoomInBtn.addEventListener("click", () => setScale(scale + 0.35));
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => setScale(scale - 0.35));
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => setScale(1));

  dialog.addEventListener("close", () => openBtn.setAttribute("aria-expanded", "false"));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      close();
    }
  });

  if (viewport) {
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.2 : -0.2));
    }, { passive: false });

    viewport.addEventListener("pointerdown", (e) => {
      if (scale <= 1) { setScale(1.6); return; }
      panning = true;
      startX = e.clientX - tx;
      startY = e.clientY - ty;
      viewport.setPointerCapture(e.pointerId);
      applyTransform();
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!panning) return;
      tx = e.clientX - startX;
      ty = e.clientY - startY;
      applyTransform();
    });
    viewport.addEventListener("pointerup", () => { panning = false; applyTransform(); });
    viewport.addEventListener("pointercancel", () => { panning = false; applyTransform(); });
  }
}
