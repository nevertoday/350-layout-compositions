// 323 边角式构图 — 正文各节专属可视化组件（01 力线剖面 / 02 名作解剖 / 03 四角翻转矩阵 / 04 三媒介留白标尺 / 05 场景问诊 / 06 眼力小练习）
// 绝不在相邻节复用同一种控件，全部矢量图清晰锐利、离线自绘。

const SVG_NS = "http://www.w3.org/2000/svg";

// ---------- 01 节：四态结构力线剖面 ----------
export const FORCE_MODES = {
  center: {
    label: "居中静立",
    tag: "静平衡 · 无方向",
    title: "重心锁死中轴，画面最稳也最静",
    body: "主体停在两条对角线的交叉中心，上下左右留白完全相等。观者视线一进入就停在原地，四边空白成了无方向的围框，适合庄严对称，却给不了边角式的开阔张力。",
    svg: `
      <svg viewBox="0 0 360 240" class="force-svg" role="img" aria-label="居中静立结构骨架图">
        <rect x="8" y="8" width="344" height="224" fill="#050F0A" stroke="#284232" stroke-width="1.5"/>
        <path d="M8 8 L352 232 M352 8 L8 232 M180 8 L180 232 M8 120 L352 120" stroke="#F3E9CC" stroke-opacity="0.14" stroke-dasharray="4 5"/>
        <circle cx="180" cy="120" r="52" fill="#F3E9CC"/>
        <circle cx="180" cy="120" r="30" fill="#A9C72E"/>
        <circle cx="180" cy="120" r="12" fill="#050F0A"/>
        <path d="M180 54 V28 M180 186 V212 M114 120 H88 M246 120 H272" stroke="#CCCDBA" stroke-width="1.5" stroke-dasharray="3 4"/>
        <text x="180" y="218" fill="#CCCDBA" font-size="11" text-anchor="middle" font-family="DM Mono, monospace">CENTER LOCK · 4 EQUAL MARGINS</text>
      </svg>`,
  },
  float: {
    label: "偏置悬空",
    tag: "失锚 · 漂移感",
    title: "偏到边上却没贴角，像没挂稳的物件",
    body: "主体离开中心却又与两条画框边沿各隔着一条尴尬的细缝。画框边缘产生的引力既没有托住它、又在拉扯它，观者下意识会觉得主体快要滑掉。",
    svg: `
      <svg viewBox="0 0 360 240" class="force-svg" role="img" aria-label="偏置悬空结构骨架图">
        <rect x="8" y="8" width="344" height="224" fill="#050F0A" stroke="#284232" stroke-width="1.5"/>
        <path d="M8 8 L352 232 M352 8 L8 232" stroke="#F3E9CC" stroke-opacity="0.12" stroke-dasharray="4 5"/>
        <circle cx="248" cy="152" r="46" fill="#F3E9CC"/>
        <circle cx="248" cy="152" r="26" fill="#A9C72E"/>
        <circle cx="248" cy="152" r="10" fill="#050F0A"/>
        <path d="M294 152 H346 M248 198 V228" stroke="#FF7A68" stroke-width="1.8" stroke-dasharray="4 3"/>
        <text x="320" y="144" fill="#FF7A68" font-size="11" text-anchor="middle">悬缝</text>
        <text x="278" y="217" fill="#FF7A68" font-size="11" text-anchor="middle">悬缝</text>
        <text x="24" y="30" fill="#CCCDBA" font-size="11" font-family="DM Mono, monospace">UNANCHORED DRIFT</text>
      </svg>`,
  },
  escape: {
    label: "压角外逃",
    tag: "方向反向 · 撞墙",
    title: "压进了角，方向却朝外框滑出画面",
    body: "锚点本身已经坐实，但线条、目光或斜势冲向最靠近的两条边框。眼睛刚被吸进角落就被直接甩出画面，对面 70% 的大留白沦为毫无联系的死黑背景。",
    svg: `
      <svg viewBox="0 0 360 240" class="force-svg" role="img" aria-label="压角外逃结构骨架图">
        <defs><clipPath id="fc-esc"><rect x="8" y="8" width="344" height="224"/></clipPath></defs>
        <rect x="8" y="8" width="344" height="224" fill="#050F0A" stroke="#FF7A68" stroke-width="1.5"/>
        <g clip-path="url(#fc-esc)">
          <circle cx="352" cy="232" r="120" fill="#F3E9CC"/>
          <circle cx="352" cy="232" r="68" fill="#A9C72E"/>
          <circle cx="352" cy="232" r="28" fill="#050F0A"/>
        </g>
        <line x1="252" y1="146" x2="346" y2="226" stroke="#FF7A68" stroke-width="2.4" stroke-dasharray="6 4"/>
        <polygon points="350,230 335,225 343,215" fill="#FF7A68"/>
        <circle cx="350" cy="230" r="14" fill="none" stroke="#FF7A68" stroke-width="1.5"/>
        <text x="24" y="30" fill="#FF7A68" font-size="11" font-family="DM Mono, monospace">VECTOR ESCAPE ↘ OUT OF FRAME</text>
        <text x="112" y="102" fill="#CCCDBA" font-size="12" text-anchor="middle">失联的空地</text>
      </svg>`,
  },
  inward: {
    label: "压角入腹",
    tag: "锚定 + 内引 + 留白",
    title: "双边锁稳支点，斜势直贯宽阔内腹",
    body: "主体吃进右下角，相邻两条边框像建筑角石般稳稳托住重量；同时斜向箭头把目光送进左上大留白，再由对角一笔微应轻轻接住，稳定与张力同时成立。",
    svg: `
      <svg viewBox="0 0 360 240" class="force-svg" role="img" aria-label="压角入腹结构骨架图">
        <defs><clipPath id="fc-in"><rect x="8" y="8" width="344" height="224"/></clipPath></defs>
        <rect x="8" y="8" width="344" height="224" fill="#050F0A" stroke="#A9C72E" stroke-width="1.5"/>
        <g clip-path="url(#fc-in)">
          <circle cx="352" cy="232" r="120" fill="#F3E9CC"/>
          <circle cx="352" cy="232" r="68" fill="#A9C72E"/>
          <circle cx="352" cy="232" r="28" fill="#050F0A"/>
        </g>
        <line x1="352" y1="232" x2="352" y2="34" stroke="#F3E9CC" stroke-width="1.3" stroke-dasharray="5 5"/>
        <polygon points="352,24 347,36 357,36" fill="#F3E9CC"/>
        <line x1="352" y1="232" x2="112" y2="232" stroke="#F3E9CC" stroke-width="1.3" stroke-dasharray="5 5"/>
        <polygon points="102,232 114,227 114,237" fill="#F3E9CC"/>
        <line x1="352" y1="232" x2="108" y2="74" stroke="#A9C72E" stroke-width="2.2" stroke-dasharray="6 5"/>
        <polygon points="98,68 112,69 106,80" fill="#A9C72E"/>
        <path d="M52 54 V40 H66" fill="none" stroke="#A9C72E" stroke-width="1.6"/>
        <text x="72" y="49" fill="#F3E9CC" font-size="11" font-family="DM Mono, monospace">ECHO</text>
        <text x="24" y="216" fill="#A9C72E" font-size="11" font-family="DM Mono, monospace">ANCHOR + INWARD VECTOR + VOID</text>
      </svg>`,
  },
};

// ---------- 02 节：南宋马远三件传世名作构图解剖 ----------
export const MASTERWORKS = [
  {
    id: "spring",
    name: "《山径春行》",
    artist: "南宋 · 马远",
    meta: "绢本设色册页 · 27.4 × 43.1 cm · 台北国立故宫博物院藏（故画 001289）",
    corner: "左下压角 · 斜柳右上探腹",
    voidNote: "右上大留白承接宋宁宗御题诗「触袖野花多自舞，避人幽鸟不成啼」",
    analysis: "全幅把巨石、垂柳、白袍高士与携琴童子全部聚拢在左下约三分之一处，画幅右上超过六成化为空濛春雾。高士微侧身向右上观望、枝条与惊飞黄鹂同朝右上牵引，题诗落于右上轻作虚应，一气贯通。",
    svg: `
      <svg viewBox="0 0 420 266" class="work-svg" role="img" aria-label="马远山径春行构图骨架解析图">
        <rect x="6" y="6" width="408" height="254" fill="#F3E9CC" stroke="#18291E" stroke-width="1.5"/>
        <line x1="6" y1="260" x2="414" y2="6" stroke="#455A09" stroke-opacity="0.28" stroke-dasharray="4 5"/>
        <!-- 左下山崖与土坡 -->
        <path d="M6 260 L6 122 L84 156 L142 192 L212 226 L246 260 Z" fill="#1C2E23"/>
        <path d="M6 176 L72 192 L134 224 L178 260 L6 260 Z" fill="#324B3B"/>
        <!-- 斜探柳枝 -->
        <path d="M56 156 Q132 108 214 78" fill="none" stroke="#455A09" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M126 116 Q130 144 122 162 M156 102 Q162 128 154 148 M188 88 Q194 114 186 132" fill="none" stroke="#5A7214" stroke-width="1.4"/>
        <!-- 高士无五官背影剪影 -->
        <path d="M108 218 Q110 194 116 184 L126 186 Q132 200 130 218 Z" fill="#FAF5E6"/>
        <circle cx="121" cy="178" r="5" fill="#122018"/>
        <!-- 视线主引线 -->
        <line x1="128" y1="176" x2="300" y2="74" stroke="#455A09" stroke-width="2" stroke-dasharray="6 4"/>
        <polygon points="308,69 294,70 301,81" fill="#455A09"/>
        <!-- 右上诗题与幽鸟虚应 -->
        <path d="M276 82 q5 -6 10 0 q5 -6 10 0" fill="none" stroke="#18291E" stroke-width="1.6"/>
        <rect x="318" y="26" width="76" height="68" fill="none" stroke="#455A09" stroke-dasharray="3 3"/>
        <text x="356" y="54" fill="#455A09" font-size="11" text-anchor="middle">御题诗</text>
        <text x="356" y="72" fill="#455A09" font-size="10" text-anchor="middle">对角轻应</text>
        <text x="20" y="246" fill="#F3E9CC" font-size="11" font-family="DM Mono, monospace">LOWER-LEFT ANCHOR ≈ 32%</text>
      </svg>`,
  },
  {
    id: "plum",
    name: "《月下赏梅图》",
    artist: "南宋 · 马远",
    meta: "团扇改册页 · 绢本设色 · 25.1 × 26.7 cm · 纽约大都会艺术博物馆藏（1986.493.2）",
    corner: "左侧与下角压实 · 孤枝横探月空",
    voidNote: "右上方大面积月色苍茫留白，仅悬一轮淡月遥相对望",
    analysis: "在近圆的团扇画框里，马远把峻崖、老梅、茅亭与白衣赏梅高士全部压向左侧与左下角，让虬曲梅枝斜向右上方破空而出，对面一片微灰月夜空域里单挂淡月，实景与月空宛若阴阳相衔。",
    svg: `
      <svg viewBox="0 0 420 266" class="work-svg" role="img" aria-label="马远月下赏梅图团扇构图解析图">
        <defs><clipPath id="fan-clip"><circle cx="210" cy="133" r="118"/></clipPath></defs>
        <rect x="6" y="6" width="408" height="254" fill="#0B1710" stroke="#284232" stroke-width="1.5"/>
        <circle cx="210" cy="133" r="118" fill="#16261D" stroke="#F3E9CC" stroke-opacity="0.4" stroke-width="1.5"/>
        <g clip-path="url(#fan-clip)">
          <!-- 左下峻崖与亭影 -->
          <path d="M88 256 L88 94 L148 134 L182 184 L224 230 L240 256 Z" fill="#050F0A"/>
          <path d="M104 166 L154 166 L146 150 L112 150 Z" fill="#3B5342"/>
          <!-- 老梅斜枝破空 -->
          <path d="M138 152 Q188 122 246 92" fill="none" stroke="#A9C72E" stroke-width="3" stroke-linecap="round"/>
          <path d="M188 124 Q212 132 234 118" fill="none" stroke="#A9C72E" stroke-width="1.8"/>
          <!-- 高士剪影无五官 -->
          <path d="M168 196 Q170 176 175 168 L184 170 Q188 184 186 196 Z" fill="#F3E9CC"/>
          <circle cx="179" cy="162" r="4.5" fill="#050F0A"/>
          <!-- 视线引向淡月 -->
          <line x1="184" y1="160" x2="274" y2="80" stroke="#A9C72E" stroke-width="1.8" stroke-dasharray="5 4"/>
          <polygon points="282,73 268,77 276,86" fill="#A9C72E"/>
          <!-- 右上淡月虚应 -->
          <circle cx="286" cy="70" r="13" fill="#F3E9CC" fill-opacity="0.9"/>
        </g>
        <text x="20" y="246" fill="#CCCDBA" font-size="11" font-family="DM Mono, monospace">FAN FORMAT · CORNER VS MOONLIGHT VOID</text>
      </svg>`,
  },
  {
    id: "songdance",
    name: "《踏歌图》",
    artist: "南宋 · 马远",
    meta: "立轴 · 绢本设色 · 192.5 × 111 cm · 北京故宫博物院藏",
    corner: "近景压底角 · 中腹烟雾断空",
    voidNote: "中段大片烟岚留白隔开人间田埂与云端奇峰，拉出深远空间",
    analysis: "在近两米高的大型立轴里，马远把大斧劈巨岩、松竹与田埂踏歌乡民压在下方边角，中间豪气留出宽阔烟霭，使下方鲜活的乡野欢歌与上方缥缈峰峦形成近重远轻的跨空呼应。",
    svg: `
      <svg viewBox="0 0 420 266" class="work-svg" role="img" aria-label="马远踏歌图立轴构图解析图">
        <rect x="130" y="8" width="160" height="250" fill="#F3E9CC" stroke="#18291E" stroke-width="1.5"/>
        <!-- 上部远峰云端微应 -->
        <path d="M214 14 L250 14 L268 78 L236 86 L206 58 Z" fill="#8D9B84" fill-opacity="0.65"/>
        <path d="M254 22 L286 18 L286 92 L262 84 Z" fill="#6F8067" fill-opacity="0.6"/>
        <!-- 中段大片烟云留白标注 -->
        <line x1="138" y1="102" x2="282" y2="102" stroke="#455A09" stroke-opacity="0.4" stroke-dasharray="4 4"/>
        <line x1="138" y1="158" x2="282" y2="158" stroke="#455A09" stroke-opacity="0.4" stroke-dasharray="4 4"/>
        <text x="210" y="134" fill="#455A09" font-size="11" text-anchor="middle">中段烟岚留白带</text>
        <!-- 下角斧劈岩与溪桥踏歌剪影 -->
        <path d="M130 258 L130 164 L182 184 L218 220 L256 236 L290 258 Z" fill="#17271D"/>
        <path d="M180 222 Q204 202 232 186" fill="none" stroke="#455A09" stroke-width="2.4"/>
        <line x1="184" y1="210" x2="242" y2="92" stroke="#455A09" stroke-width="1.8" stroke-dasharray="5 4"/>
        <polygon points="246,84 236,93 247,98" fill="#455A09"/>
        <text x="20" y="130" fill="#415247" font-size="11">立轴比例</text>
        <text x="20" y="148" fill="#415247" font-size="11" font-family="DM Mono, monospace">192.5 × 111 cm</text>
        <text x="310" y="218" fill="#415247" font-size="11">近景压底角</text>
        <text x="310" y="236" fill="#455A09" font-size="11">仰视拉通云峰</text>
      </svg>`,
  },
];

// ---------- 03 节：2×2 四角朝向翻转矩阵 ----------
export const QUAD_CARDS = [
  {
    id: "tl",
    name: "左上角 · 起势领读",
    inDesc: "视线从阅读第一落点顺势滑向右下宽阔腹地，最适合杂志开篇与海报主标。",
    outDesc: "势头倒顶左上死角，刚进画面就撞墙停住，整张右下版面变成闲置废白。",
    cx: 10, cy: 10,
    inEnd: [164, 108],
    outStart: [72, 52], outEnd: [18, 16],
    echo: [176, 114],
  },
  {
    id: "tr",
    name: "右上角 · 悬枝垂势",
    inDesc: "高位轻悬而向左下方斜垂，自带垂瀑、挂枝与俯瞰气韵，空灵不坠。",
    outDesc: "元素往右上画外硬冲，像要飞出画框，左下大片留白空荡无力。",
    cx: 210, cy: 10,
    inEnd: [56, 108],
    outStart: [148, 52], outEnd: [202, 16],
    echo: [44, 114],
  },
  {
    id: "bl",
    name: "左下角 · 稳坐山基",
    inDesc: "顺合自左向右攀升的视觉惯性，是南宋「马一角」最常用的稳重起势角。",
    outDesc: "重心掉向左下外缘，视线向下坠出画底，右侧大留白完全接不住。",
    cx: 10, cy: 140,
    inEnd: [164, 42],
    outStart: [72, 98], outEnd: [18, 134],
    echo: [176, 36],
  },
  {
    id: "br",
    name: "右下角 · 收尾压阵",
    inDesc: "正是 323 原海报选用的角落：厚重角扇镇住右下，斜箭把目光托回左上标题与留白。",
    outDesc: "视觉重量本来就沉在右下，箭头再朝右下角外推，整张版面直接滑出画底。",
    cx: 210, cy: 140,
    inEnd: [56, 42],
    outStart: [148, 98], outEnd: [202, 134],
    echo: [44, 36],
  },
];

export function renderQuadSVG(card, escaped) {
  const arrowCol = escaped ? "#FF7A68" : "#A9C72E";
  const strokeBox = escaped ? "#FF7A68" : "rgba(169,199,46,0.45)";
  const clipId = `qc-${card.id}-${escaped ? "e" : "i"}`;
  const [x1, y1] = escaped ? card.outStart : [card.cx, card.cy];
  const [x2, y2] = escaped ? card.outEnd : card.inEnd;
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return `
    <svg viewBox="0 0 220 150" class="quad-svg" role="img" aria-label="${card.name}${escaped ? "外逃状态" : "入腹状态"}">
      <defs><clipPath id="${clipId}"><rect x="10" y="10" width="200" height="130"/></clipPath></defs>
      <rect x="10" y="10" width="200" height="130" fill="#050F0A" stroke="${strokeBox}" stroke-width="1.3"/>
      <g clip-path="url(#${clipId})">
        <circle cx="${card.cx}" cy="${card.cy}" r="74" fill="#F3E9CC"/>
        <circle cx="${card.cx}" cy="${card.cy}" r="42" fill="#A9C72E"/>
        <circle cx="${card.cx}" cy="${card.cy}" r="16" fill="#050F0A"/>
      </g>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${arrowCol}" stroke-width="2.2" stroke-dasharray="5 4"/>
      <polygon points="0,0 -10,-5 -10,5" fill="${arrowCol}" transform="translate(${x2},${y2}) rotate(${ang})"/>
      ${escaped
        ? `<circle cx="${x2}" cy="${y2}" r="9" fill="none" stroke="#FF7A68" stroke-width="1.3"/>`
        : `<circle cx="${card.echo[0]}" cy="${card.echo[1]}" r="4" fill="#A9C72E"/>`}
    </svg>`;
}

// ---------- 04 节：三媒介留白占比标尺（摄影静物 / 诗集封面 / App 启动页） ----------
export function renderScaleCards(pct) {
  const voidPct = 100 - pct;
  let verdict = "甜区 · 实景压稳，留白呼吸充分";
  let tone = "ok";
  if (pct < 18) {
    verdict = "过轻（<18%）· 主体像角落微尘，大面积留白沦为空洞";
    tone = "warn";
  } else if (pct > 45) {
    verdict = "满溢（>45%）· 吞噬呼吸留白，边角式退化为发闷满构图";
    tone = "warn";
  }

  // 把面积百分比换算成精确的视觉缩放因子
  const r1 = Math.sqrt(pct / 100) * 172; // 静物圆域
  const bSize = Math.sqrt(pct / 100) * 140; // 书封角图形
  const mSize = Math.sqrt(pct / 100) * 150; // App 图形

  const strokeStatus = tone === "ok" ? "#455A09" : "#A82A1A";

  return {
    voidPct,
    verdict,
    tone,
    photoSvg: `
      <svg viewBox="0 0 220 156" class="scale-svg" role="img" aria-label="茶器静物摄影占比示意">
        <defs><clipPath id="sc-ph"><rect x="6" y="6" width="208" height="144"/></clipPath></defs>
        <rect x="6" y="6" width="208" height="144" fill="#131E18" stroke="${strokeStatus}" stroke-width="1.4"/>
        <g clip-path="url(#sc-ph)">
          <ellipse cx="${12 + r1 * 0.48}" cy="${148 - r1 * 0.24}" rx="${r1 * 0.65}" ry="${r1 * 0.26}" fill="#26382D"/>
          <!-- 极简茶壶剪影 -->
          <circle cx="${16 + r1 * 0.44}" cy="${144 - r1 * 0.36}" r="${Math.max(8, r1 * 0.24)}" fill="#F3E9CC"/>
          <path d="M${16 + r1 * 0.62} ${144 - r1 * 0.4} L${16 + r1 * 0.9} ${144 - r1 * 0.62}" stroke="#F3E9CC" stroke-width="${Math.max(2.5, r1 * 0.055)}" stroke-linecap="round"/>
          <!-- 斜松枝 -->
          <path d="M6 150 Q${16 + r1 * 0.4} ${144 - r1 * 0.52} ${22 + r1 * 0.88} ${144 - r1 * 0.84}" fill="none" stroke="#A9C72E" stroke-width="${Math.max(1.8, r1 * 0.03)}"/>
        </g>
        <text x="198" y="26" fill="#CCCDBA" font-size="10" text-anchor="end" font-family="DM Mono, monospace">VOID ${voidPct}%</text>
      </svg>`,
    bookSvg: `
      <svg viewBox="0 0 220 156" class="scale-svg" role="img" aria-label="诗集封面排版占比示意">
        <defs><clipPath id="sc-bk"><rect x="52" y="6" width="116" height="144"/></clipPath></defs>
        <rect x="52" y="6" width="116" height="144" fill="#FAF5E6" stroke="${strokeStatus}" stroke-width="1.4"/>
        <g clip-path="url(#sc-bk)">
          <circle cx="168" cy="150" r="${bSize}" fill="#14231A"/>
          <circle cx="168" cy="150" r="${bSize * 0.55}" fill="#A9C72E"/>
        </g>
        <rect x="64" y="20" width="24" height="3" fill="#455A09"/>
        <text x="64" y="42" fill="#122018" font-size="13" font-weight="700">秋山夜集</text>
        <text x="64" y="56" fill="#415247" font-size="9" font-family="DM Mono, monospace">POEMS · ${pct}%</text>
      </svg>`,
    appSvg: `
      <svg viewBox="0 0 220 156" class="scale-svg" role="img" aria-label="移动端开屏占比示意">
        <defs><clipPath id="sc-ap"><rect x="66" y="6" width="88" height="144" rx="8"/></clipPath></defs>
        <rect x="66" y="6" width="88" height="144" rx="8" fill="#050F0A" stroke="${strokeStatus}" stroke-width="1.4"/>
        <g clip-path="url(#sc-ap)">
          <circle cx="154" cy="150" r="${mSize}" fill="#F3E9CC"/>
          <circle cx="154" cy="150" r="${mSize * 0.54}" fill="#A9C72E"/>
          <circle cx="154" cy="150" r="${mSize * 0.22}" fill="#050F0A"/>
        </g>
        <text x="78" y="34" fill="#F3E9CC" font-size="11" font-weight="700">静夜</text>
        <text x="78" y="48" fill="#A9C72E" font-size="8.5" font-family="DM Mono, monospace">OPEN · ${pct}%</text>
      </svg>`,
  };
}

// ---------- 05 节：场景问诊筛查器 ----------
export const USE_CASES = [
  {
    id: "exhibition",
    label: "艺术展览 / 演出主海报",
    verdict: "宜用",
    tone: "good",
    reason: "主体压在一角自带强烈辨识度，其余 60% 以上纯净留白天然容纳展名、日期与导语，不抢图形又能把视线拉向文案。",
    tip: "实景压在右下或左下，主文字放在对角空域，确保视觉动线从主体斜指向展名。",
  },
  {
    id: "stilllife",
    label: "茶器 / 香氛 / 静物摄影",
    verdict: "宜用",
    tone: "good",
    reason: "器物本身小巧精致，放在正中显得像电商白底棚拍；压进一角并借茶烟、花枝或长投影斜穿大留白，瞬间有了东方意境与高级感。",
    tip: "投影或枝条必须指向画面内部留白，切忌朝最近画框边沿伸出。",
  },
  {
    id: "ecommerce",
    label: "高密度商品参数对比页",
    verdict: "别用",
    tone: "avoid",
    reason: "用户要同时横向扫描价格、规格、评分等十余项信息。硬做边角构图会浪费大半屏幕，逼得文字挤成一团。",
    tip: "改用网格、表格或分栏布局，把效率与信息对齐放在第一位。",
  },
  {
    id: "thumb",
    label: "120px 窄屏瀑布流缩略图",
    verdict: "别用",
    tone: "avoid",
    reason: "边角式依赖「小主体 + 大留白」的面积反差，一旦缩成拇指大小的小卡片，角里的主体只剩几个像素，用户根本看不清画的是什么。",
    tip: "小尺寸封面应优先放大主体或居中直给，把大留白留给整屏落地页。",
  },
  {
    id: "ceremony",
    label: "庄严中轴建筑 / 官方徽章",
    verdict: "别用",
    tone: "avoid",
    reason: "边角式天生带有偏置张力与灵动气息，会直接削弱对称仪式感、权威感与端正感。",
    tip: "这类题材老老实实回到居中对称或经典轴线构图更贴切。",
  },
  {
    id: "hero",
    label: "品牌首屏 Hero（左文右角）",
    verdict: "宜用",
    tone: "good",
    reason: "网页首屏常面临「既要留大片干净底色放核心标语和按钮，又要放震撼视觉」的难题。把产品或装置压在右下角斜指左上文案，是最耐看的一招。",
    tip: "务必同时验收 390px 手机竖屏：窄屏下把角部图形收低或移到文字下方，绝不遮盖文案。",
  },
];

// ---------- 06 节：眼力小练习（2 道单变量精绘海报题，选项完全中性 A/B/C/D） ----------
export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    prompt: "第 1 题（朝向与对角关系）：四张秋季茶器展海报的主体体量完全相同（均约 30%），哪一稿真正把「一角引视线入腹」落到了实处？",
    correct: "C",
    options: [
      {
        key: "A",
        label: "方案 A",
        explain: "主体虽压在左下角，但壶嘴与斜枝朝向左下方外墙，视线刚一落角就被甩出画框，右上大留白彻底失联。",
        svg: quizPosterSVG({ mode: "escape" }),
        overlaySvg: quizPosterSVG({ mode: "escape", reveal: true }),
      },
      {
        key: "B",
        label: "方案 B",
        explain: "茶器退回画面正中央水平摆放，四周空边均分，失去了边角式构图的锚定支点与对角方向张力。",
        svg: quizPosterSVG({ mode: "center" }),
        overlaySvg: quizPosterSVG({ mode: "center", reveal: true }),
      },
      {
        key: "C",
        label: "方案 C",
        explain: "正确！主体扎实压进左下角，壶嘴与松枝斜指向右上内腹，把目光送向留白，再由右上极轻的展签稳稳接住。",
        svg: quizPosterSVG({ mode: "good1" }),
        overlaySvg: quizPosterSVG({ mode: "good1", reveal: true }),
      },
      {
        key: "D",
        label: "方案 D",
        explain: "左下虽朝内，但右上塞了一块几乎同等大小的厚重色块，画面变成了两头拉扯的对角对称，失去了大留白呼吸。",
        svg: quizPosterSVG({ mode: "heavyEcho" }),
        overlaySvg: quizPosterSVG({ mode: "heavyEcho", reveal: true }),
      },
    ],
  },
  {
    id: "q2",
    prompt: "第 2 题（实景占比与单角纯度）：四稿全部锚定在右下角且方向都指向左上内腹，哪一稿的面积比例最符合边角式构图的张力与呼吸？",
    correct: "B",
    options: [
      {
        key: "A",
        label: "方案 A",
        explain: "右下角主体缩成仅约 8% 的微粒，压不住超过 90% 的漆黑空地，整幅画显得孤悬无力。",
        svg: quizPosterSVG({ mode: "tiny" }),
        overlaySvg: quizPosterSVG({ mode: "tiny", reveal: true }),
      },
      {
        key: "B",
        label: "方案 B",
        explain: "正确！右下实景约占 33%、净留白约 67%，既足以压稳画角，又给左上斜向视线留出开阔呼吸感，再配左上轻虚应达成平衡。",
        svg: quizPosterSVG({ mode: "good2" }),
        overlaySvg: quizPosterSVG({ mode: "good2", reveal: true }),
      },
      {
        key: "C",
        label: "方案 C",
        explain: "右下实景膨胀到约 64% 跨过中轴，把留白挤成一条窄缝，画面憋闷，已退化成偏沉的满构图。",
        svg: quizPosterSVG({ mode: "overflow" }),
        overlaySvg: quizPosterSVG({ mode: "overflow", reveal: true }),
      },
      {
        key: "D",
        label: "方案 D",
        explain: "左右下两角同时放了两座对称实景，视觉重心落回底部水平对称，不再是单角牵引的边角式构图。",
        svg: quizPosterSVG({ mode: "twin" }),
        overlaySvg: quizPosterSVG({ mode: "twin", reveal: true }),
      },
    ],
  },
];

function quizPosterSVG({ mode, reveal = false }) {
  const clip = `qp-${mode}-${reveal ? "r" : "n"}`;
  let inner = "";
  let guide = "";

  if (mode === "escape") {
    inner = `
      <path d="M8 148 L8 72 L52 96 L88 126 L108 148 Z" fill="#1F3327"/>
      <circle cx="48" cy="112" r="22" fill="#F3E9CC"/>
      <path d="M36 118 L12 140" stroke="#F3E9CC" stroke-width="5" stroke-linecap="round"/>
      <path d="M58 96 Q34 114 14 134" fill="none" stroke="#A9C72E" stroke-width="2.6"/>
      <rect x="136" y="24" width="38" height="4" fill="#F3E9CC" fill-opacity="0.75"/>
      <rect x="148" y="34" width="26" height="2.5" fill="#A9C72E"/>`;
    if (reveal) guide = `<line x1="56" y1="100" x2="14" y2="142" stroke="#FF7A68" stroke-width="2.2" stroke-dasharray="4 3"/><circle cx="14" cy="142" r="7" fill="none" stroke="#FF7A68" stroke-width="1.5"/>`;
  } else if (mode === "center") {
    inner = `
      <ellipse cx="96" cy="108" rx="46" ry="16" fill="#1F3327"/>
      <circle cx="96" cy="84" r="22" fill="#F3E9CC"/>
      <path d="M114 84 L138 78" stroke="#F3E9CC" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M62 82 L130 82" stroke="#A9C72E" stroke-width="2.2"/>
      <rect x="76" y="24" width="40" height="4" fill="#F3E9CC" fill-opacity="0.75"/>`;
    if (reveal) guide = `<path d="M96 8 V148 M8 78 H184" stroke="#FF7A68" stroke-width="1.3" stroke-dasharray="4 4"/>`;
  } else if (mode === "good1") {
    inner = `
      <path d="M8 148 L8 72 L52 96 L88 126 L108 148 Z" fill="#1F3327"/>
      <circle cx="48" cy="112" r="22" fill="#F3E9CC"/>
      <path d="M66 104 L94 84" stroke="#F3E9CC" stroke-width="5" stroke-linecap="round"/>
      <path d="M22 104 Q72 82 118 54" fill="none" stroke="#A9C72E" stroke-width="2.6"/>
      <rect x="136" y="24" width="36" height="4" fill="#F3E9CC" fill-opacity="0.85"/>
      <rect x="148" y="34" width="24" height="2.5" fill="#A9C72E"/>`;
    if (reveal) guide = `<line x1="12" y1="144" x2="132" y2="42" stroke="#A9C72E" stroke-width="2" stroke-dasharray="5 4"/><polygon points="138,37 125,40 132,49" fill="#A9C72E"/>`;
  } else if (mode === "heavyEcho") {
    inner = `
      <path d="M8 148 L8 72 L52 96 L88 126 L108 148 Z" fill="#1F3327"/>
      <circle cx="48" cy="112" r="22" fill="#F3E9CC"/>
      <path d="M66 104 L92 86" stroke="#F3E9CC" stroke-width="5" stroke-linecap="round"/>
      <path d="M22 104 Q66 86 98 66" fill="none" stroke="#A9C72E" stroke-width="2.6"/>
      <rect x="104" y="14" width="74" height="64" fill="#F3E9CC" fill-opacity="0.82"/>
      <rect x="116" y="26" width="44" height="16" fill="#A9C72E"/>`;
    if (reveal) guide = `<rect x="104" y="14" width="74" height="64" fill="none" stroke="#FF7A68" stroke-width="2" stroke-dasharray="4 3"/>`;
  } else if (mode === "tiny") {
    inner = `
      <circle cx="184" cy="148" r="38" fill="#F3E9CC"/>
      <circle cx="184" cy="148" r="22" fill="#A9C72E"/>
      <circle cx="184" cy="148" r="9" fill="#050F0A"/>
      <line x1="184" y1="148" x2="122" y2="100" stroke="#A9C72E" stroke-width="1.6" stroke-dasharray="4 4"/>`;
    if (reveal) guide = `<circle cx="184" cy="148" r="42" fill="none" stroke="#FF7A68" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  } else if (mode === "good2") {
    inner = `
      <circle cx="184" cy="148" r="88" fill="#F3E9CC"/>
      <circle cx="184" cy="148" r="50" fill="#A9C72E"/>
      <circle cx="184" cy="148" r="20" fill="#050F0A"/>
      <line x1="184" y1="148" x2="54" y2="48" stroke="#A9C72E" stroke-width="1.8" stroke-dasharray="5 4"/>
      <rect x="20" y="22" width="28" height="3.5" fill="#F3E9CC" fill-opacity="0.85"/>
      <rect x="20" y="31" width="16" height="2.5" fill="#A9C72E"/>`;
    if (reveal) guide = `<polygon points="48,43 61,46 55,55" fill="#A9C72E"/>`;
  } else if (mode === "overflow") {
    inner = `
      <circle cx="184" cy="148" r="144" fill="#F3E9CC"/>
      <circle cx="184" cy="148" r="82" fill="#A9C72E"/>
      <circle cx="184" cy="148" r="34" fill="#050F0A"/>
      <line x1="184" y1="148" x2="48" y2="42" stroke="#A9C72E" stroke-width="1.8" stroke-dasharray="5 4"/>`;
    if (reveal) guide = `<circle cx="184" cy="148" r="144" fill="none" stroke="#FF7A68" stroke-width="2" stroke-dasharray="5 3"/>`;
  } else if (mode === "twin") {
    inner = `
      <circle cx="184" cy="148" r="76" fill="#F3E9CC"/>
      <circle cx="184" cy="148" r="42" fill="#A9C72E"/>
      <circle cx="8" cy="148" r="76" fill="#F3E9CC"/>
      <circle cx="8" cy="148" r="42" fill="#A9C72E"/>
      <line x1="184" y1="148" x2="96" y2="74" stroke="#A9C72E" stroke-width="1.5" stroke-dasharray="4 4"/>
      <line x1="8" y1="148" x2="96" y2="74" stroke="#A9C72E" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    if (reveal) guide = `<line x1="96" y1="14" x2="96" y2="144" stroke="#FF7A68" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  }

  return `
    <svg viewBox="0 0 192 156" class="quiz-svg" aria-hidden="true">
      <defs><clipPath id="${clip}"><rect x="8" y="8" width="176" height="140"/></clipPath></defs>
      <rect x="8" y="8" width="176" height="140" fill="#050F0A" stroke="#284232" stroke-width="1.4"/>
      <g clip-path="url(#${clip})">${inner}</g>
      ${guide}
    </svg>`;
}
