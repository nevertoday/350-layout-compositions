// 306 主观视角构图 · 正文 01–07 各节独立互动模块
// 严格遵循相邻两节不用同类控件：
// 01 历史年代索引卡 + 光学遮罩 SVG | 02 俯视片场机位图 SVG | 03 三镜剪辑重排节拍台
// 04 五种物理框中框 × 焦段 2D 画布 | 05 四类失效对照翻转卡 | 06 双题单变量视觉考场 | 07 原海报缩放拖拽灯箱

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, focalToFovDeg } from "./model.js";

// =========================================================================
// 01 · 从魔灯窥镜到现代镜头：历史年代胶片索引 + 光学机制图示
// =========================================================================
const HISTORY_ERAS = [
  {
    id: "1900",
    year: "1900",
    title: "《祖母的放大镜》",
    en: "GRANDMA'S READING GLASS",
    author: "乔治·阿尔伯特·史密斯（英国布莱顿学派）",
    mechanism: "圆形物理遮罩 + 主观插切",
    fact: "男孩举起放大镜观察怀表、金丝雀与祖母的眼睛；史密斯在中景与透过圆形黑罩拍摄的特写之间来回切换，是最早把摄影机绑定到角色眼光的标志实验之一。",
    takeaway: "给观影人一个「遮罩边界」，大脑就会自动把画面认作某双正在看东西的眼睛。",
    svg: `<svg viewBox="0 0 360 210" role="img" aria-label="1900 圆形放大镜遮罩示意图">
      <rect width="360" height="210" fill="#151918"/>
      <defs><clipPath id="clip-lens-1900"><circle cx="180" cy="105" r="74"/></clipPath></defs>
      <g clip-path="url(#clip-lens-1900)">
        <rect x="96" y="25" width="168" height="160" fill="#F4E7D1"/>
        <circle cx="180" cy="105" r="46" fill="none" stroke="#151918" stroke-width="5"/>
        <circle cx="180" cy="105" r="38" fill="none" stroke="#151918" stroke-width="1.5" stroke-dasharray="3 5"/>
        <line x1="180" y1="105" x2="180" y2="74" stroke="#151918" stroke-width="4" stroke-linecap="round"/>
        <line x1="180" y1="105" x2="205" y2="112" stroke="#EE5C18" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="180" cy="105" r="4.5" fill="#EE5C18"/>
      </g>
      <circle cx="180" cy="105" r="74" fill="none" stroke="#EE5C18" stroke-width="3"/>
      <text x="180" y="198" text-anchor="middle" fill="#F4E7D1" font-size="11" font-family="IBM Plex Mono, monospace">IRIS MASK · 1900 BRIGHTON SCHOOL</text>
    </svg>`,
  },
  {
    id: "1931",
    year: "1931",
    title: "《化身博士》开场",
    en: "DR. JEKYLL AND MR. HYDE",
    author: "鲁本·马莫利安导演 · 卡尔·斯特拉斯摄影",
    mechanism: "连续移动入眼 + 镜面现身",
    fact: "开场数分钟镜头完全占据杰基尔博士眼位：双手弹奏管风琴、起身穿廊、直到照镜子整理领结才首次现出弗雷德里克·马奇的身影，随后走出家门登上马车才退回客观视点。",
    takeaway: "移动本身带着人体步态的晃动与方向，比静止画面更能把观众钉进角色身体里。",
    svg: `<svg viewBox="0 0 360 210" role="img" aria-label="1931 化身博士镜中现身主观镜头示意图">
      <rect width="360" height="210" fill="#182022"/>
      <rect x="94" y="22" width="172" height="148" rx="6" fill="#2A3940" stroke="#F4E7D1" stroke-width="6"/>
      <rect x="106" y="34" width="148" height="124" fill="#9CCEE9" opacity="0.88"/>
      <circle cx="180" cy="86" r="22" fill="#151918"/>
      <path d="M138 158 C142 122 160 112 180 112 C200 112 218 122 222 158 Z" fill="#151918"/>
      <path d="M40 198 L108 154 L132 174 L84 210 Z" fill="#EE5C18"/>
      <path d="M320 198 L252 154 L228 174 L276 210 Z" fill="#EE5C18"/>
      <text x="180" y="198" text-anchor="middle" fill="#F4E7D1" font-size="11" font-family="IBM Plex Mono, monospace">MIRROR REVEAL · CONTINUOUS POV 1931</text>
    </svg>`,
  },
  {
    id: "1946",
    year: "1946/47",
    title: "《湖中女人》",
    en: "LADY IN THE LAKE",
    author: "罗伯特·蒙哥马利导演 · 保罗·沃格尔摄影",
    mechanism: "全片极端主观的反向教科书",
    fact: "1946 年 12 月伦敦首映、1947 年 1 月美国公映，几乎整部长片全用侦探马洛的第一人称视角拍摄。结果对手演员直盯镜头说话反而令观众疲惫出戏，成了好莱坞「慎用全片主观」的著名案例。",
    takeaway: "主观视角是高浓度调料而非主食；该让观众看主角表情时，必须敢于切回客观镜头。",
    svg: `<svg viewBox="0 0 360 210" role="img" aria-label="1946 湖中女人直盯镜头压迫示意图">
      <rect width="360" height="210" fill="#1C2122"/>
      <line x1="20" y1="30" x2="140" y2="95" stroke="#EE5C18" stroke-width="1.5" stroke-dasharray="5 4"/>
      <line x1="340" y1="30" x2="220" y2="95" stroke="#EE5C18" stroke-width="1.5" stroke-dasharray="5 4"/>
      <circle cx="180" cy="84" r="34" fill="#323A3D" stroke="#F4E7D1" stroke-width="2"/>
      <path d="M114 180 C122 132 148 122 180 122 C212 122 238 132 246 180 Z" fill="#2A3134"/>
      <rect x="82" y="144" width="196" height="28" rx="4" fill="#A91D19"/>
      <text x="180" y="162" text-anchor="middle" fill="#FAF3E6" font-size="12" font-family="Noto Sans SC, sans-serif">全片紧盯镜头 → 持续紧张与疏离</text>
      <text x="180" y="198" text-anchor="middle" fill="#BBD8E9" font-size="11" font-family="IBM Plex Mono, monospace">FULL-LENGTH POV CAUTION · 1946/47</text>
    </svg>`,
  },
  {
    id: "1965",
    year: "1965 / 1984",
    title: "语法定型与叙事拆解",
    en: "MASCELLI & BRANIGAN",
    author: "约瑟夫·V·马斯切利 / 爱德华·布拉尼根",
    mechanism: "三分机位 + 前瞻/回溯视点结构",
    fact: "1965 年马斯切利在《电影摄影的五个 C》里系统区分客观、主观与视点镜头；1984 年布拉尼根在《电影中的视点》里指出，主观感并非单靠摆机位，而是「看者—视线—时间—所见」的剪辑推演。",
    takeaway: "一个镜头是不是主观视角，一半由机位和前景决定，另一半由前后两刀怎么切决定。",
    svg: `<svg viewBox="0 0 360 210" role="img" aria-label="1965 与 1984 理论框架三段剪辑链示意图">
      <rect width="360" height="210" fill="#151918"/>
      <rect x="20" y="42" width="90" height="96" rx="4" fill="#222A2D" stroke="#9CCEE9" stroke-width="2"/>
      <circle cx="65" cy="78" r="14" fill="#F4E7D1"/>
      <path d="M44 128 C46 104 54 98 65 98 C76 98 84 104 86 128 Z" fill="#F4E7D1"/>
      <text x="65" y="156" text-anchor="middle" fill="#9CCEE9" font-size="11">1. 看者眼神</text>
      <path d="M116 90 L132 90" stroke="#EE5C18" stroke-width="2.5"/>
      <rect x="135" y="42" width="90" height="96" rx="4" fill="#222A2D" stroke="#EE5C18" stroke-width="2.5"/>
      <rect x="150" y="56" width="60" height="68" fill="#9CCEE9"/>
      <polygon points="180,68 188,82 172,82" fill="#EE5C18"/>
      <rect x="174" y="82" width="12" height="36" fill="#F4E7D1"/>
      <text x="180" y="156" text-anchor="middle" fill="#FF8547" font-size="11">2. 所见框景</text>
      <path d="M231 90 L247 90" stroke="#EE5C18" stroke-width="2.5"/>
      <rect x="250" y="42" width="90" height="96" rx="4" fill="#222A2D" stroke="#F4E7D1" stroke-width="2"/>
      <path d="M268 118 Q295 72 322 118" fill="none" stroke="#F4E7D1" stroke-width="3"/>
      <circle cx="295" cy="86" r="10" fill="#EE5C18"/>
      <text x="295" y="156" text-anchor="middle" fill="#F4E7D1" font-size="11">3. 心理反应</text>
      <text x="180" y="196" text-anchor="middle" fill="#BBD8E9" font-size="11" font-family="IBM Plex Mono, monospace">ORIGIN · GLANCE · OBJECT · MIND</text>
    </svg>`,
  },
  {
    id: "2007",
    year: "2007",
    title: "《潜水钟与蝴蝶》",
    en: "THE DIVING BELL & THE BUTTERFLY",
    author: "朱利安·施纳贝尔导演 · 雅努什·卡明斯基摄影",
    mechanism: "生理眨眼切镜 + 视野受限隐喻",
    fact: "影片前三分之一严格锁在患闭锁综合征的主角鲍比仅存的左眼里：眼皮开合化作黑场转场、泪水与失焦化作镜面雾气；待想象力冲破躯体后，镜头才逐步挣脱主观束缚。",
    takeaway: "把「看不全、眨一下眼」做成叙事本体，受限的视野本身就成了最动人的剧作。",
    svg: `<svg viewBox="0 0 360 210" role="img" aria-label="2007 潜水钟与蝴蝶眨眼视野示意图">
      <rect width="360" height="210" fill="#0E1314"/>
      <path d="M24 105 Q180 22 336 105 Q180 188 24 105 Z" fill="#9CCEE9"/>
      <rect x="24" y="114" width="312" height="58" fill="#6DAED1" opacity="0.72"/>
      <path d="M0 0 H360 V105 Q180 24 0 105 Z" fill="#0E1314"/>
      <path d="M0 210 H360 V105 Q180 186 0 105 Z" fill="#0E1314"/>
      <path d="M24 105 Q180 26 336 105 Q180 184 24 105 Z" fill="none" stroke="#EE5C18" stroke-width="2.5"/>
      <text x="180" y="198" text-anchor="middle" fill="#F4E7D1" font-size="11" font-family="IBM Plex Mono, monospace">EYELID SHUTTER · LOCKED-IN POV 2007</text>
    </svg>`,
  },
];

export function initOriginSection(root) {
  if (!root) return;
  const tabWrap = root.querySelector("#origin-tabs");
  const visual = root.querySelector("#origin-visual");
  const titleEl = root.querySelector("#origin-title");
  const metaEl = root.querySelector("#origin-meta");
  const factEl = root.querySelector("#origin-fact");
  const takeEl = root.querySelector("#origin-takeaway");

  function select(id) {
    const item = HISTORY_ERAS.find((e) => e.id === id) || HISTORY_ERAS[0];
    tabWrap.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.era === item.id;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    visual.innerHTML = item.svg;
    titleEl.textContent = `${item.year} · ${item.title}`;
    metaEl.textContent = `${item.author} ｜ ${item.mechanism}`;
    factEl.textContent = item.fact;
    takeEl.textContent = item.takeaway;
  }

  tabWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-era]");
    if (btn) select(btn.dataset.era);
  });
  select("1900");
}

// =========================================================================
// 02 · 同一小类五镜头怎么分：俯视片场机位交互图
// =========================================================================
const COVERAGE_MODES = {
  "306": {
    id: "306",
    name: "306 主观视角构图（本页）",
    tag: "镜头 = 角色双眼",
    summary: "机位直接占住角色头部眼位，彻底看不到角色自己的脸或背，只保留门框与手部等近身前景。",
    cone: "M150,152 L82,34 L218,34 Z",
    cam: { x: 150, y: 152 },
    link: null,
    preview: `<svg viewBox="0 0 280 170" role="img" aria-label="306 主观视角取景示意">
      <rect width="280" height="170" fill="#151918"/>
      <rect x="64" y="16" width="152" height="132" fill="#9CCEE9"/>
      <rect x="64" y="102" width="152" height="46" fill="#77B5D6"/>
      <rect x="150" y="48" width="22" height="60" fill="#F4E7D1"/>
      <polygon points="161,32 174,48 148,48" fill="#EE5C18"/>
      <path d="M84 170 L102 126 L124 134 L112 170 Z" fill="#EE5C18"/>
      <path d="M196 170 L178 126 L156 134 L168 170 Z" fill="#EE5C18"/>
      <rect x="118" y="122" width="44" height="36" rx="6" fill="#151918"/>
      <text x="140" y="14" text-anchor="middle" fill="#F4E7D1" font-size="10" font-family="IBM Plex Mono, monospace">CAM AT EYE · FRAME + HANDS</text>
    </svg>`,
  },
  "305": {
    id: "305",
    name: "305 过肩构图",
    tag: "退半步至角色肩后",
    summary: "摄影机架在前景人物肩头后方，借前景肩背建立「两人在同一空间对谈」的视觉连线与压迫关系。",
    cone: "M196,184 L86,38 L224,38 Z",
    cam: { x: 196, y: 184 },
    link: "https://layout.xiaoxiaodong.ai/305/play/",
    preview: `<svg viewBox="0 0 280 170" role="img" aria-label="305 过肩构图取景示意">
      <rect width="280" height="170" fill="#2A3439"/>
      <rect x="0" y="0" width="280" height="170" fill="#9CCEE9" opacity="0.22"/>
      <circle cx="176" cy="64" r="18" fill="#F4E7D1"/>
      <path d="M144 132 C148 94 160 86 176 86 C192 86 204 94 208 132 Z" fill="#F4E7D1"/>
      <circle cx="76" cy="96" r="34" fill="#151918"/>
      <path d="M14 170 C24 128 48 122 86 122 C122 122 142 134 150 170 Z" fill="#151918"/>
      <text x="140" y="160" text-anchor="middle" fill="#F4E7D1" font-size="10" font-family="IBM Plex Mono, monospace">FOREGROUND SHOULDER · OTS</text>
    </svg>`,
  },
  "307": {
    id: "307",
    name: "307 客观视角构图",
    tag: "退至场外冷静旁观",
    summary: "摄影机像不参与剧情的隐形观察者，同时交代角色站位、门框与环境全景，保持克制的中立距离。",
    cone: "M48,116 L246,34 L246,188 Z",
    cam: { x: 48, y: 116 },
    link: "https://layout.xiaoxiaodong.ai/307/play/",
    preview: `<svg viewBox="0 0 280 170" role="img" aria-label="307 客观视角取景示意">
      <rect width="280" height="170" fill="#DCECF6"/>
      <rect x="0" y="128" width="280" height="42" fill="#6F8B9C"/>
      <rect x="20" y="24" width="96" height="122" fill="#262D2E"/>
      <circle cx="88" cy="74" r="12" fill="#EE5C18"/>
      <path d="M72 136 C74 96 80 90 88 90 C96 90 102 96 104 136 Z" fill="#EE5C18"/>
      <rect x="204" y="54" width="20" height="74" fill="#F4E7D1"/>
      <polygon points="214,38 226,54 202,54" fill="#151918"/>
      <text x="140" y="160" text-anchor="middle" fill="#151918" font-size="10" font-family="IBM Plex Mono, monospace">DETACHED OBSERVER · WIDE SPACE</text>
    </svg>`,
  },
  "308": {
    id: "308",
    name: "308 净单人镜头",
    tag: "纯单人零前景遮挡",
    summary: "绕到正面单独拍一位人物，画面干干净净不带任何前景遮挡物，把全部注意力交给单人的孤立情绪。",
    cone: "M150,76 L104,174 L196,174 Z",
    cam: { x: 150, y: 76 },
    link: "https://layout.xiaoxiaodong.ai/308/play/",
    preview: `<svg viewBox="0 0 280 170" role="img" aria-label="308 净单人镜头取景示意">
      <rect width="280" height="170" fill="#9CCEE9"/>
      <circle cx="140" cy="68" r="24" fill="#151918"/>
      <path d="M92 170 C98 112 114 98 140 98 C166 98 182 112 188 170 Z" fill="#151918"/>
      <text x="140" y="160" text-anchor="middle" fill="#F4E7D1" font-size="10" font-family="IBM Plex Mono, monospace">CLEAN SINGLE · ZERO FOREGROUND</text>
    </svg>`,
  },
  "309": {
    id: "309",
    name: "309 脏单人镜头",
    tag: "带边缘虚景的单人镜头",
    summary: "主体仍是单人，但边缘刻意挂进一丝虚化的对手轮廓或器物，提示画外仍有人共处，却未进入本人眼位。",
    cone: "M222,94 L94,176 L192,188 Z",
    cam: { x: 222, y: 94 },
    link: "https://layout.xiaoxiaodong.ai/309/play/",
    preview: `<svg viewBox="0 0 280 170" role="img" aria-label="309 脏单人镜头取景示意">
      <rect width="280" height="170" fill="#9CCEE9"/>
      <circle cx="156" cy="68" r="23" fill="#151918"/>
      <path d="M110 170 C116 114 132 100 156 100 C180 100 196 114 202 170 Z" fill="#151918"/>
      <ellipse cx="26" cy="116" rx="34" ry="72" fill="#23292B" opacity="0.65"/>
      <text x="140" y="160" text-anchor="middle" fill="#F4E7D1" font-size="10" font-family="IBM Plex Mono, monospace">DIRTY SINGLE · SOFT EDGE PRESENCE</text>
    </svg>`,
  },
};

export function initCoverageSection(root) {
  if (!root) return;
  const coneEl = root.querySelector("#floor-cone");
  const activeRing = root.querySelector("#floor-active-ring");
  const previewEl = root.querySelector("#cov-preview");
  const titleEl = root.querySelector("#cov-title");
  const tagEl = root.querySelector("#cov-tag");
  const descEl = root.querySelector("#cov-desc");
  const linkWrap = root.querySelector("#cov-link-wrap");

  function pick(id) {
    const item = COVERAGE_MODES[id] || COVERAGE_MODES["306"];
    root.querySelectorAll("[data-cov]").forEach((el) => {
      const on = el.dataset.cov === item.id;
      el.classList.toggle("is-active", on);
      if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", String(on));
    });
    coneEl.setAttribute("d", item.cone);
    activeRing.setAttribute("cx", String(item.cam.x));
    activeRing.setAttribute("cy", String(item.cam.y));
    previewEl.innerHTML = item.preview;
    titleEl.textContent = item.name;
    tagEl.textContent = item.tag;
    descEl.textContent = item.summary;
    linkWrap.innerHTML = item.link
      ? `<a class="cov-ext-link" href="${item.link}" target="_blank" rel="noopener">打开 ${item.name} 互动页 →</a>`
      : `<span class="cov-here-pill">当前所在页：306 主观视角构图</span>`;
  }

  root.addEventListener("click", (e) => {
    const target = e.target.closest("[data-cov]");
    if (target) pick(target.dataset.cov);
  });
  pick("306");
}

// =========================================================================
// 03 · 信息闸门与揭示顺序：布拉尼根三镜剪辑顺序重排与节拍演播台
// =========================================================================
const SHOT_ART = {
  looker: {
    code: "镜头 A",
    title: "门后人物侧影微顿",
    sub: "WHO IS LOOKING",
    svg: `<svg viewBox="0 0 220 132" role="img" aria-label="镜头A 门后人物侧影">
      <rect width="220" height="132" fill="#1C2326"/>
      <rect x="0" y="0" width="66" height="132" fill="#0F1415"/>
      <circle cx="116" cy="54" r="20" fill="#F4E7D1"/>
      <path d="M84 132 C88 86 100 78 116 78 C132 78 144 86 148 132 Z" fill="#F4E7D1"/>
      <path d="M138 52 L192 52" stroke="#FF8547" stroke-width="2" stroke-dasharray="5 4"/>
      <polygon points="196,52 188,47 188,57" fill="#FF8547"/>
    </svg>`,
  },
  pov: {
    code: "镜头 B",
    title: "第一人称推门见红箱",
    sub: "SUBJECTIVE POV",
    svg: `<svg viewBox="0 0 220 132" role="img" aria-label="镜头B 推门缝见红皮箱">
      <rect width="220" height="132" fill="#101516"/>
      <rect x="64" y="10" width="92" height="112" fill="#2A404E"/>
      <polygon points="110,10 156,122 64,122" fill="#F4E7D1" opacity="0.22"/>
      <rect x="88" y="72" width="44" height="28" rx="3" fill="#EE5C18"/>
      <rect x="96" y="60" width="22" height="16" fill="#F4E7D1" transform="rotate(-10 96 60)"/>
      <path d="M150 56 L170 50 L170 74 L148 70 Z" fill="#EE5C18"/>
    </svg>`,
  },
  react: {
    code: "镜头 C",
    title: "急退半步反锁门链",
    sub: "EMOTIONAL REACTION",
    svg: `<svg viewBox="0 0 220 132" role="img" aria-label="镜头C 退步锁门链">
      <rect width="220" height="132" fill="#161C1E"/>
      <line x1="32" y1="62" x2="174" y2="62" stroke="#F4E7D1" stroke-width="5" stroke-dasharray="10 6"/>
      <rect x="20" y="48" width="22" height="28" rx="3" fill="#9CCEE9"/>
      <rect x="164" y="48" width="32" height="28" rx="3" fill="#EE5C18"/>
      <path d="M140 132 L152 74 L176 74 L170 132 Z" fill="#EE5C18"/>
    </svg>`,
  },
};

const MONTAGE_ORDERS = {
  prospective: {
    id: "prospective",
    label: "前瞻式（先人 → 后物 → 反应）",
    seq: ["looker", "pov", "react"],
    verdict: "布拉尼根「前瞻式 POV」：先交代是谁在看，再切入 TA 眼里打开的红箱。观众一进门缝就带着主角的预设紧张去扫视画面，叙事最稳。",
    beats: [
      "第 1 拍：先看到门后人物屏息望向门缝——建立「看者」来源。",
      "第 2 拍：立刻接第一人称门缝视野——观众顺理成章认定这就是 TA 所见。",
      "第 3 拍：接反手扣上防盗链——用身体动作完成情绪落点。",
    ],
  },
  retrospective: {
    id: "retrospective",
    label: "回溯式（先物 → 揭看者 → 反应）",
    seq: ["pov", "looker", "react"],
    verdict: "布拉尼根「回溯式 POV」：开场直接把观众扔进陌生门缝，前两秒不知「我是谁」，直到第二镜才揭晓偷窥者身份——悬疑与不安感骤升。",
    beats: [
      "第 1 拍：直接给出门缝内的红箱——观众被迫先用未知身份盯紧现场。",
      "第 2 拍：切回门后停顿的剪影——「原来刚才那是 TA 在偷看！」悬念反转。",
      "第 3 拍：拉上防盗链——秘密被证实，压迫感封口。",
    ],
  },
  pure: {
    id: "pure",
    label: "纯主观连镜（零客观脸部交代）",
    seq: ["pov", "react", "pov"],
    verdict: "全程不切回角色真容：看门缝 → 扣链锁 → 再窥一眼。代入感最猛，但观众完全读不到角色自己的微表情，只适合短段落制造强烈危机。",
    beats: [
      "第 1 拍：第一人称发现门外异常，画外的一切都被黑暗藏住。",
      "第 2 拍：手部急促拉上链锁——用近景动作代替脸部表演。",
      "第 3 拍：再次贴近门缝确认——紧绷感拉满，但也最容易让人喘不过气。",
    ],
  },
};

export function initMontageSection(root) {
  if (!root) return;
  const orderBtns = root.querySelector("#montage-orders");
  const playBtn = root.querySelector("#montage-play");
  const cardsEl = root.querySelector("#montage-cards");
  const verdictEl = root.querySelector("#montage-verdict");
  const beatEl = root.querySelector("#montage-beat");

  let activeOrder = "prospective";
  let timer = 0;

  function renderOrder(activeIndex = -1) {
    const cfg = MONTAGE_ORDERS[activeOrder];
    orderBtns.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.order === activeOrder;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    cardsEl.innerHTML = cfg.seq
      .map((key, idx) => {
        const s = SHOT_ART[key];
        const lit = idx === activeIndex ? " is-playing" : "";
        return `<div class="shot-card${lit}" data-beat-idx="${idx}">
          <div class="shot-head"><span class="shot-step">0${idx + 1}</span><span class="shot-code">${s.code}</span></div>
          <div class="shot-art">${s.svg}</div>
          <p class="shot-title">${s.title}</p>
          <p class="shot-sub">${s.sub}</p>
        </div>`;
      })
      .join("");
    verdictEl.textContent = cfg.verdict;
    beatEl.textContent = activeIndex >= 0 ? cfg.beats[activeIndex] : "点击「演播三镜节拍」或点任意分镜卡，感受同一组画面换序后的情绪落差。";
  }

  function stopPlay() {
    if (timer) {
      clearInterval(timer);
      timer = 0;
    }
    playBtn.textContent = "演播三镜节拍";
  }

  orderBtns.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-order]");
    if (!b) return;
    stopPlay();
    activeOrder = b.dataset.order;
    renderOrder(-1);
  });

  cardsEl.addEventListener("click", (e) => {
    const c = e.target.closest("[data-beat-idx]");
    if (!c) return;
    stopPlay();
    renderOrder(Number(c.dataset.beatIdx));
  });

  playBtn.addEventListener("click", () => {
    if (timer) {
      stopPlay();
      renderOrder(-1);
      return;
    }
    if (reducedMotion.matches) {
      renderOrder(1);
      return;
    }
    let step = 0;
    playBtn.textContent = "停止演播";
    renderOrder(step);
    timer = setInterval(() => {
      step++;
      if (step >= 3) {
        stopPlay();
        renderOrder(2);
      } else {
        renderOrder(step);
      }
    }, 1150);
  });

  renderOrder(0);
}

// =========================================================================
// 04 · 五种物理框中框与情绪焦段（2D Canvas 光学演示）
// =========================================================================
const MASK_TYPES = {
  door: {
    id: "door",
    label: "木屋门框",
    feel: "门槛感 · 内暗外明",
    desc: "不对称暗门框把室内静谧与室外辽阔一分为二，像跨出一步前的片刻犹疑。",
  },
  windshield: {
    id: "windshield",
    label: "汽车前挡",
    feel: "前行感 · 旅途包裹",
    desc: "后视镜与 A 柱构成方向感极强的移动画框，观众自动进入驾驶者的行进节奏。",
  },
  scope: {
    id: "scope",
    label: "望远镜圆遮",
    feel: "窥视感 · 高度收束",
    desc: "承袭 1900 年圆形遮罩传统，砍掉全部四周余光，强迫注意力钉死单一远端目标。",
  },
  blinds: {
    id: "blinds",
    label: "百叶窗缝",
    feel: "戒备感 · 切片隐藏",
    desc: "水平暗条把外界切成条状碎片，既暴露被监视感，也把大部分房间藏在阴影里。",
  },
  visor: {
    id: "visor",
    label: "头盔面罩",
    feel: "孤立感 · 呼吸贴近",
    desc: "圆弧面罩边缘配极近的前景反光，常用于宇航、潜水或高压封闭心理戏。",
  },
};

export function initMasksSection(root) {
  if (!root) return;
  const canvas = root.querySelector("#mask-canvas");
  const ctx = canvas.getContext("2d");
  const maskBtns = root.querySelector("#mask-buttons");
  const focalInput = root.querySelector("#mask-focal");
  const focalOut = root.querySelector("#mask-focal-out");
  const moodOut = root.querySelector("#mask-mood-out");
  const descOut = root.querySelector("#mask-desc");

  let activeMask = "door";
  let focal = 45;

  function updateCopy() {
    const m = MASK_TYPES[activeMask];
    const fov = Math.round(focalToFovDeg(focal));
    const lensMood =
      focal <= 28
        ? "广角压迫：前景框拉大、远景退远，焦虑与临场感强"
        : focal >= 65
          ? "长焦凝视：空间压平、远方灯塔扑面而来，像屏息盯梢"
          : "人眼标准：透视自然克制，最像本人真实站立所见";
    focalOut.textContent = `${focal}mm · ${fov}°`;
    moodOut.textContent = `${m.feel} ｜ ${lensMood}`;
    descOut.textContent = m.desc;
    maskBtns.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.mask === activeMask;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function render(t, _dt, { still }) {
    const r = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const W = Math.max(240, Math.round(r.width));
    const H = Math.max(160, Math.round(r.height));
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    const z = focal / 45;
    const sway = still ? 0 : Math.sin(t * 1.1) * 3;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 底层海岸远景（随焦段真实放大/缩小）
    const horizon = H * 0.62;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#8EC6E5");
    sky.addColorStop(1, "#C3E3F5");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = "#6FAED1";
    ctx.fillRect(0, horizon, W, H - horizon);

    // 远处灯塔与海浪（随 z 缩放，直观演示焦段变化）
    const lx = W * 0.54 + sway;
    const th = H * 0.34 * z;
    const tw = th * 0.28;
    ctx.fillStyle = "#222521";
    ctx.beginPath();
    ctx.moveTo(lx - tw * 3.2, horizon + 2);
    ctx.lineTo(lx, horizon - th * 0.25);
    ctx.lineTo(lx + tw * 3.4, horizon + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#F4E7D1";
    ctx.fillRect(lx - tw * 0.5, horizon - th, tw, th);
    ctx.fillStyle = "#EE5C18";
    ctx.beginPath();
    ctx.moveTo(lx, horizon - th * 1.24);
    ctx.lineTo(lx + tw * 0.65, horizon - th);
    ctx.lineTo(lx - tw * 0.65, horizon - th);
    ctx.closePath();
    ctx.fill();

    // 物理前景遮罩绘制
    ctx.fillStyle = "#151918";
    if (activeMask === "door") {
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(W * 0.22, H * 0.1, W * 0.56, H * 0.8);
      ctx.fill("evenodd");
      // 左侧门背小便签暗示
      ctx.fillStyle = "#F4E7D1";
      ctx.fillRect(W * 0.05, H * 0.38, W * 0.11, H * 0.22);
      ctx.fillStyle = "#EE5C18";
      ctx.fillRect(W * 0.095, H * 0.35, W * 0.025, H * 0.05);
    } else if (activeMask === "windshield") {
      // A 柱 + 顶棚 + 仪表台 + 后视镜
      ctx.fillRect(0, 0, W, H * 0.12);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W * 0.16, 0);
      ctx.lineTo(W * 0.07, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W, 0);
      ctx.lineTo(W * 0.84, 0);
      ctx.lineTo(W * 0.93, H);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      // 仪表台与方向盘弧
      ctx.beginPath();
      ctx.moveTo(0, H * 0.78);
      ctx.quadraticCurveTo(W * 0.5, H * 0.70, W, H * 0.78);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2A3032";
      ctx.fillRect(W * 0.43, H * 0.14, W * 0.14, H * 0.08);
      ctx.strokeStyle = "#EE5C18";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(W * 0.30, H * 0.96, H * 0.22, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    } else if (activeMask === "scope") {
      const rr = Math.min(W, H) * 0.35;
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(W * 0.5, H * 0.5, rr, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.strokeStyle = "#EE5C18";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.5, rr, 0, Math.PI * 2);
      ctx.stroke();
    } else if (activeMask === "blinds") {
      const slatH = H / 7;
      for (let i = 0; i < 7; i++) {
        const gap = i === 3 ? slatH * 0.48 : slatH * 0.18;
        ctx.fillRect(0, i * slatH, W, slatH - gap);
      }
      ctx.fillStyle = "#EE5C18";
      ctx.fillRect(W * 0.18, 0, 3, H);
      ctx.fillRect(W * 0.82, 0, 3, H);
    } else if (activeMask === "visor") {
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.ellipse(W * 0.5, H * 0.5, W * 0.42, H * 0.36, 0, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(244, 231, 209, 0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.5, W * 0.42, H * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(238, 92, 24, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.5, Math.min(W, H) * 0.28, -0.5, 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, render);
  new ResizeObserver(() => ctrl.draw()).observe(canvas);

  maskBtns.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mask]");
    if (!b) return;
    activeMask = b.dataset.mask;
    updateCopy();
    ctrl.draw();
  });

  focalInput.addEventListener("input", () => {
    focal = clamp(Number(focalInput.value), 24, 85);
    updateCopy();
    ctrl.draw();
  });

  updateCopy();
}

// =========================================================================
// 05 · 什么时候别用主观视角：四类反例 / 解药切换卡
// =========================================================================
export function initAvoidSection(root) {
  if (!root) return;
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-avoid-toggle]");
    if (!btn) return;
    const card = btn.closest(".avoid-card");
    const nextFix = !card.classList.contains("is-fixed");
    card.classList.toggle("is-fixed", nextFix);
    btn.setAttribute("aria-pressed", String(nextFix));
    btn.textContent = nextFix ? "看回硬用主观（翻车）" : "看改用合适镜头（解药）";
  });
}

// =========================================================================
// 06 · 小练习：两道单变量视觉四选一（严格中性标签，绝不剧透好坏）
// =========================================================================
const QUIZ_QUESTIONS = [
  {
    id: "q1",
    num: "01",
    title: "第一题 · 单一变量：门框开合与前景手位",
    prompt: "场景：角色清晨站在昏暗木屋里，推门望见海湾灯塔。四幅画面的镜头高度与灯塔方位完全一致，仅改变门框开合与捧杯手位。哪一幅最符合「主观视角构图」？",
    correct: "B",
    options: [
      {
        key: "A",
        label: "画面 A",
        reason: "门缝只开了一指宽，暗墙吞掉八成以上画幅，灯塔被门柱拦腰切去大半。信息压得太死，只剩憋闷而读不出所见世界。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第一题选项 A">
          <rect width="220" height="146" fill="#151918"/>
          <rect x="96" y="14" width="28" height="114" fill="#9CCEE9"/>
          <rect x="96" y="88" width="28" height="40" fill="#77B5D6"/>
          <rect x="116" y="42" width="12" height="50" fill="#F4E7D1"/>
          <polygon points="122,28 130,42 114,42" fill="#EE5C18"/>
          <rect x="86" y="114" width="48" height="32" rx="6" fill="#151918"/>
          <path d="M56 146 L76 116 L90 124 L82 146 Z" fill="#EE5C18"/>
          <path d="M164 146 L144 116 L130 124 L138 146 Z" fill="#EE5C18"/>
        </svg>`,
      },
      {
        key: "B",
        label: "画面 B",
        reason: "答对了！暗门框约占四成画幅，把明亮海天与灯塔自然包进「框中框」；捧杯双手稳托在底沿坐实第一人称身体，同时完全不遮挡远岸灯塔。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第一题选项 B">
          <rect width="220" height="146" fill="#151918"/>
          <rect x="50" y="14" width="122" height="112" fill="#9CCEE9"/>
          <rect x="50" y="88" width="122" height="38" fill="#77B5D6"/>
          <rect x="128" y="44" width="18" height="50" fill="#F4E7D1"/>
          <polygon points="137,30 148,44 126,44" fill="#EE5C18"/>
          <rect x="10" y="54" width="28" height="34" fill="#F4E7D1" transform="rotate(-6 24 71)"/>
          <path d="M62 146 L82 114 L98 124 L88 146 Z" fill="#EE5C18"/>
          <path d="M158 146 L138 114 L122 124 L132 146 Z" fill="#EE5C18"/>
          <rect x="92" y="112" width="36" height="28" rx="5" fill="#151918"/>
        </svg>`,
      },
      {
        key: "C",
        label: "画面 C",
        reason: "镜头迈出了门槛，深色门框彻底消失在画外。虽然灯塔很清楚，但没有了室内外的边界与视野限制，画面退化成一张普通海景明信片。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第一题选项 C">
          <rect width="220" height="146" fill="#9CCEE9"/>
          <rect x="0" y="92" width="220" height="54" fill="#77B5D6"/>
          <rect x="134" y="44" width="18" height="52" fill="#F4E7D1"/>
          <polygon points="143,30 154,44 132,44" fill="#EE5C18"/>
          <path d="M62 146 L82 118 L98 126 L88 146 Z" fill="#EE5C18"/>
          <path d="M158 146 L138 118 L122 126 L132 146 Z" fill="#EE5C18"/>
          <rect x="92" y="116" width="36" height="26" rx="5" fill="#151918"/>
        </svg>`,
      },
      {
        key: "D",
        label: "画面 D",
        reason: "门框开合比例原本不错，但捧杯双手举得过高，直接顶到画面正中把灯塔主体和海平线盖死，前景锚点反客为主成了障碍。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第一题选项 D">
          <rect width="220" height="146" fill="#151918"/>
          <rect x="50" y="14" width="122" height="112" fill="#9CCEE9"/>
          <rect x="50" y="88" width="122" height="38" fill="#77B5D6"/>
          <rect x="128" y="44" width="18" height="50" fill="#F4E7D1"/>
          <polygon points="137,30 148,44 126,44" fill="#EE5C18"/>
          <path d="M52 146 L84 56 L108 70 L94 146 Z" fill="#EE5C18"/>
          <path d="M174 146 L142 56 L118 70 L132 146 Z" fill="#EE5C18"/>
          <rect x="86" y="46" width="54" height="46" rx="7" fill="#151918"/>
        </svg>`,
      },
    ],
  },
  {
    id: "q2",
    num: "02",
    title: "第二题 · 单一变量：机位沿视线轴的入眼深度",
    prompt: "场景：角色深夜轻推防盗门观察走廊里敞开的红皮箱。四幅画面的灯光、门缝宽度与皮箱摆位完全不变，仅改变摄影机停放的位置。哪一幅是严格的主观视角？",
    correct: "C",
    options: [
      {
        key: "A",
        label: "画面 A",
        reason: "摄影机退在走廊侧面三米外，把推门的人物全身与远处红箱一起收入画内——这是典型的 307 客观视角，观众只是冷静的场外目击者。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第二题选项 A">
          <rect width="220" height="146" fill="#23323C"/>
          <rect x="0" y="108" width="220" height="38" fill="#172025"/>
          <rect x="18" y="20" width="54" height="96" fill="#101516"/>
          <circle cx="62" cy="58" r="10" fill="#F4E7D1"/>
          <path d="M50 112 C52 74 56 70 62 70 C68 70 72 74 74 112 Z" fill="#F4E7D1"/>
          <rect x="152" y="84" width="34" height="24" rx="3" fill="#EE5C18"/>
        </svg>`,
      },
      {
        key: "B",
        label: "画面 B",
        reason: "摄影机停在角色右肩后方，画面左前出现角色自己的大片头肩暗影——这属于 305 过肩构图，观众站在 TA 身后，而不是成为 TA 的眼睛。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第二题选项 B">
          <rect width="220" height="146" fill="#23323C"/>
          <rect x="136" y="76" width="36" height="26" rx="3" fill="#EE5C18"/>
          <circle cx="60" cy="76" r="28" fill="#0F1415"/>
          <path d="M8 146 C18 106 38 100 66 100 C94 100 112 110 120 146 Z" fill="#0F1415"/>
        </svg>`,
      },
      {
        key: "C",
        label: "画面 C",
        reason: "答对了！摄影机严格重合在角色双眼，画面不见角色自己的背影，只见门沿与扶门手指围出狭窄视窗，直接把视线送向走廊地上的敞开红箱。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第二题选项 C">
          <rect width="220" height="146" fill="#101516"/>
          <rect x="54" y="12" width="112" height="122" fill="#273A46"/>
          <polygon points="110,12 166,134 54,134" fill="#F4E7D1" opacity="0.20"/>
          <rect x="92" y="78" width="42" height="26" rx="3" fill="#EE5C18"/>
          <rect x="102" y="68" width="18" height="14" fill="#F4E7D1" transform="rotate(-12 102 68)"/>
          <path d="M158 64 L182 56 L182 86 L156 80 Z" fill="#EE5C18"/>
        </svg>`,
      },
      {
        key: "D",
        label: "画面 D",
        reason: "镜头直接飞到红箱正上方拍满屏特写，脱离了门沿与角色站立的物理空间。这是一颗孤立的道具插切镜头，失去了主观站位和窥视距离。",
        svg: `<svg viewBox="0 0 220 146" role="img" aria-label="第二题选项 D">
          <rect width="220" height="146" fill="#23323C"/>
          <rect x="34" y="26" width="152" height="94" rx="6" fill="#EE5C18"/>
          <rect x="64" y="42" width="62" height="44" fill="#F4E7D1" transform="rotate(-8 95 64)"/>
        </svg>`,
      },
    ],
  },
];

export function initQuizSection(root) {
  if (!root) return;
  const switcher = root.querySelector("#quiz-switcher");
  const promptEl = root.querySelector("#quiz-prompt");
  const gridEl = root.querySelector("#quiz-grid");
  const feedbackEl = root.querySelector("#quiz-feedback");
  const scoreEl = root.querySelector("#quiz-score");

  let currentIdx = 0;
  const answers = {};

  function render() {
    const q = QUIZ_QUESTIONS[currentIdx];
    const picked = answers[q.id] || null;
    const correctCount = QUIZ_QUESTIONS.filter((item) => answers[item.id] === item.correct).length;
    const answeredCount = Object.keys(answers).length;
    scoreEl.textContent = `已答 ${answeredCount}/${QUIZ_QUESTIONS.length} · 答对 ${correctCount}`;

    switcher.querySelectorAll("button").forEach((b, i) => {
      const on = i === currentIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    promptEl.textContent = q.prompt;

    gridEl.innerHTML = q.options
      .map((opt) => {
        let cls = "quiz-opt";
        if (picked) {
          if (opt.key === q.correct) cls += " is-correct";
          else if (opt.key === picked) cls += " is-wrong";
        }
        return `<button type="button" class="${cls}" data-opt="${opt.key}" aria-pressed="${picked === opt.key}">
          <span class="quiz-opt-head"><span class="quiz-key">${opt.key}</span><span class="quiz-neutral">${opt.label}</span></span>
          <span class="quiz-thumb">${opt.svg}</span>
        </button>`;
      })
      .join("");

    if (!picked) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = `<p>请点选 A、B、C、D 之一；四幅图严格只差一个构图变量。</p>`;
    } else {
      const opt = q.options.find((o) => o.key === picked);
      const ok = picked === q.correct;
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-bad"}`;
      const nextBtn =
        currentIdx < QUIZ_QUESTIONS.length - 1
          ? `<button type="button" class="btn-quiz-next" id="quiz-next">看下一题 →</button>`
          : `<button type="button" class="btn-quiz-next" id="quiz-retry">重新作答两题</button>`;
      feedbackEl.innerHTML = `<div class="quiz-fb-head"><strong>${ok ? `✓ 选 ${picked} 正确` : `× 选 ${picked} 不够准确（正解是 ${q.correct}）`}</strong>${nextBtn}</div><p>${opt.reason}</p>`;
    }
  }

  switcher.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-qidx]");
    if (!b) return;
    currentIdx = Number(b.dataset.qidx);
    render();
  });

  gridEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-opt]");
    if (!b) return;
    answers[QUIZ_QUESTIONS[currentIdx].id] = b.dataset.opt;
    render();
  });

  feedbackEl.addEventListener("click", (e) => {
    if (e.target.closest("#quiz-next")) {
      currentIdx = Math.min(QUIZ_QUESTIONS.length - 1, currentIdx + 1);
      render();
    } else if (e.target.closest("#quiz-retry")) {
      for (const k of Object.keys(answers)) delete answers[k];
      currentIdx = 0;
      render();
    }
  });

  render();
}

// =========================================================================
// 07 · 原海报放大拖拽灯箱（只复用 #poster 的 src，不重复内联图片）
// =========================================================================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-zoom-btn");
  const dialog = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-modal-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const viewport = document.getElementById("poster-modal-stage");
  if (!thumb || !dialog || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    if (!modalImg.src) modalImg.src = thumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    closeBtn.focus();
  }

  function close() {
    dialog.hidden = true;
    dialog.setAttribute("aria-hidden", "true");
  }

  thumb.addEventListener("click", open);
  if (openBtn) openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) close();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = clamp(scale + 0.45, 1, 2.8);
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = clamp(scale - 0.45, 1, 2.8);
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

  viewport.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  viewport.addEventListener("pointerup", () => {
    dragging = false;
  });
  viewport.addEventListener("pointercancel", () => {
    dragging = false;
  });
}
