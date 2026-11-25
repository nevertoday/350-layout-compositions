// 030 十字构图 · 正文 01–07 节专属交互与原海报灯箱
// 相邻两节绝不复用同一类控件：
//   01 左右拉幕透视镜 + 光学微提开关
//   02 五座时代切片蓝图切换器
//   03 暗房 6 格错态/救回翻牌矩阵
//   04 双栏同门构图形变对比器
//   05 四类项目落版压力测试器
//   06 两题组单变量四选一眼力考
//   07 原海报灯箱（放大、拖移、Esc 关闭）

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initPosterLightbox();
}

// ---------- 01 视线引力场拉幕透视镜 ----------
function initSection01() {
  const slider = document.getElementById("s01-curtain");
  const mask = document.getElementById("s01-mask-layer");
  const divider = document.getElementById("s01-divider");
  const readout = document.getElementById("s01-readout");
  const optBtns = [...document.querySelectorAll("[data-s01-hub]")];
  const hubLines = [...document.querySelectorAll("[data-s01-hub-y]")];
  const hubNote = document.getElementById("s01-hub-note");
  if (!slider || !mask || !divider) return;

  function applyCurtain() {
    const p = Number(slider.value);
    mask.style.clipPath = `inset(0 0 0 ${p}%)`;
    divider.style.left = `${p}%`;
    if (readout) {
      readout.textContent =
        p < 25
          ? `引力场透视 ${100 - p}% · 看清横竖双轴与中心引力核如何吸附视线`
          : p > 75
            ? `成片视觉 ${p}% · 骨架隐入画面，只留稳固与聚焦的心理感受`
            : `对半剖视 · 左看成片，右看阿恩海姆式结构引力骨架（${p}%）`;
    }
  }
  slider.addEventListener("input", applyCurtain);
  applyCurtain();

  function applyHub(mode) {
    const y = mode === "optical" ? 138 : 150; // viewBox 0..300 => 46% vs 50%
    for (const el of hubLines) {
      if (el.tagName.toLowerCase() === "line") {
        el.setAttribute("y1", String(y));
        el.setAttribute("y2", String(y));
      } else if (el.tagName.toLowerCase() === "circle") {
        el.setAttribute("cy", String(y));
      } else if (el.tagName.toLowerCase() === "rect") {
        const h = Number(el.getAttribute("height") || 24);
        el.setAttribute("y", String(y - h / 2));
      } else if (el.tagName.toLowerCase() === "text") {
        el.setAttribute("y", String(y + 4));
      }
    }
    for (const b of optBtns) {
      const on = b.dataset.s01Hub === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    if (hubNote) {
      hubNote.textContent =
        mode === "optical"
          ? "光学微提 46%（经验值）：横轴比数学中点轻提 4%，刚好抵消人眼看正中时自带的轻微下坠感，上轻下稳。"
          : "数学中点 50%：上下距离绝对相等，但在视觉上常觉得中心微微发沉——这就是原海报说「交汇于中心」时需要留心的一毫米修正。";
    }
  }
  for (const b of optBtns) {
    b.addEventListener("click", () => applyHub(b.dataset.s01Hub));
  }
  applyHub("optical");
}

// ---------- 02 五座时代切片蓝图切换器 ----------
const LINEAGE = [
  {
    id: "roman",
    year: "公元前 1 世纪起",
    title: "古罗马建城：南北纵街与东西横街",
    en: "CARDO & DECUMANUS",
    place: "古罗马军营与新建城邦规划",
    body: "古罗马规划新建城市时，先立南北向主街 Cardo Maximus 与东西向主街 Decumanus Maximus，两条正交大道在城心交汇，并把公共广场（Forum）安放在交汇核心——用一条十字架同时解决「城市中心在哪」与「四向通往何方」两件事。",
    takeaway: "给排版的启发：十字交汇处天然适合放最核心的公共信息，四条轴则是让视线进出的主干道。",
    svg: `
      <rect x="24" y="24" width="272" height="192" fill="#F5F8FB" stroke="#2B629E" stroke-width="2"/>
      <g stroke="#B8CBE0" stroke-width="1">
        <line x1="78" y1="24" x2="78" y2="216"/><line x1="242" y1="24" x2="242" y2="216"/>
        <line x1="24" y1="72" x2="296" y2="72"/><line x1="24" y1="168" x2="296" y2="168"/>
      </g>
      <rect x="148" y="24" width="24" height="192" fill="#3D7ABC" opacity="0.88"/>
      <rect x="24" y="108" width="272" height="24" fill="#3D7ABC" opacity="0.88"/>
      <line x1="160" y1="28" x2="160" y2="212" stroke="#FFFFFF" stroke-dasharray="5 5" stroke-width="1.4"/>
      <line x1="28" y1="120" x2="292" y2="120" stroke="#FFFFFF" stroke-dasharray="5 5" stroke-width="1.4"/>
      <rect x="136" y="96" width="48" height="48" fill="#181A1A" stroke="#FFFFFF" stroke-width="3"/>
      <text x="160" y="124" text-anchor="middle" fill="#FAF8EC" font-size="11" font-weight="700">FORUM</text>
      <text x="160" y="17" text-anchor="middle" fill="#1D5490" font-size="10" font-weight="700">CARDO（南北轴）</text>
      <text x="292" y="100" text-anchor="end" fill="#1D5490" font-size="10" font-weight="700">DECUMANUS（东西轴）</text>
    `,
  },
  {
    id: "palladio",
    year: "1566–1570",
    title: "帕拉第奥：圆厅别墅的四向门廊",
    en: "VILLA LA ROTONDA · VICENZA",
    place: "意大利维琴察 · 约 1566 年始建，收于 1570《建筑四书》第二卷",
    body: "安德烈亚·帕拉第奥在维琴察城外设计的圆厅别墅（Villa Almerico Capra），把一座圆形穹顶大厅钉在正方形平面正中，再沿十字正交两轴向东南西北各伸出一模一样的古典门廊。无论从哪一翼步入，视线都会沿轴直抵中央圆厅。",
    takeaway: "给排版的启发：030 原海报「四臂向内收于黑核白环」的视觉秩序，正是这座文艺复兴十字建筑的平面回响。",
    svg: `
      <rect x="76" y="40" width="168" height="160" fill="#E6ECF1" stroke="#1D5490" stroke-width="2"/>
      <rect x="128" y="16" width="64" height="24" fill="#3D7ABC"/>
      <rect x="128" y="200" width="64" height="24" fill="#3D7ABC"/>
      <rect x="52" y="88" width="24" height="64" fill="#3D7ABC"/>
      <rect x="244" y="88" width="24" height="64" fill="#3D7ABC"/>
      <line x1="160" y1="16" x2="160" y2="224" stroke="#1D5490" stroke-dasharray="4 4" stroke-width="1.3"/>
      <line x1="52" y1="120" x2="268" y2="120" stroke="#1D5490" stroke-dasharray="4 4" stroke-width="1.3"/>
      <circle cx="160" cy="120" r="40" fill="#CDE0F1" stroke="#2B629E" stroke-width="1.6"/>
      <circle cx="160" cy="120" r="24" fill="#181A1A" stroke="#FFFFFF" stroke-width="3"/>
      <text x="160" y="124" text-anchor="middle" fill="#FAF8EC" font-size="10" font-weight="700">圆厅</text>
    `,
  },
  {
    id: "poore",
    year: "1903",
    title: "普尔：把「十字」写入构图教科书",
    en: "HENRY RANKIN POORE",
    place: "《绘画构图与画作评判》（G. P. Putnam's Sons）",
    body: "美国画家兼教师亨利·兰金·普尔在 1903 年的经典手册里，明确把「十字（The Cross）」归纳为绘画几大基础骨架之一。他特别指出：十字不必死守相等的四臂，桅杆交海平线、人物立于地平之上，靠四臂长短与轻重差才能稳中见活。",
    takeaway: "给排版的启发：正交保证稳固，四臂不等距或远轻近重才让十字长出生命力。",
    svg: `
      <rect x="30" y="24" width="260" height="192" fill="#F5F8FB" stroke="#1A2634" stroke-width="1.6"/>
      <line x1="30" y1="146" x2="290" y2="146" stroke="#3D7ABC" stroke-width="6"/>
      <line x1="146" y1="24" x2="146" y2="216" stroke="#3D7ABC" stroke-width="6"/>
      <circle cx="146" cy="146" r="16" fill="#181A1A" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="88" cy="146" r="10" fill="#2B629E"/>
      <circle cx="242" cy="146" r="6" fill="#2B629E"/>
      <circle cx="146" cy="70" r="7" fill="#588FC8"/>
      <text x="88" y="172" text-anchor="middle" fill="#1D5490" font-size="10" font-weight="600">近重</text>
      <text x="242" y="172" text-anchor="middle" fill="#1D5490" font-size="10" font-weight="600">远轻</text>
      <text x="160" y="42" fill="#45596E" font-size="10">不等臂长 · 仍保正交</text>
    `,
  },
  {
    id: "1915",
    year: "1915",
    title: "1915 双峰：马列维奇与蒙德里安",
    en: "MALEVICH & MONDRIAN",
    place: "巴黎蓬皮杜中心 / 荷兰克勒勒-米勒博物馆",
    body: "同在 1915 年，两位现代主义先驱把十字从风景和宗教里彻底抽离：马列维奇在彼得格勒 0.10 展亮出《黑十字》，将其与黑方、黑圆并列为至上主义三大母形；蒙德里安则在《黑白构图 10 号（码头与海）》里只用黑白横竖短线交织出整片海面节律。",
    takeaway: "给排版的启发：去掉一切具象装饰，纯横与纯竖的正交关系本身就足以撑起全画张力。",
    svg: `
      <rect x="26" y="24" width="124" height="192" fill="#FFFFFF" stroke="#1A2634" stroke-width="1.6"/>
      <rect x="74" y="46" width="28" height="148" fill="#181A1A"/>
      <rect x="38" y="106" width="100" height="28" fill="#181A1A"/>
      <text x="88" y="208" text-anchor="middle" fill="#1A2634" font-size="10" font-weight="700">黑十字 · 1915</text>

      <rect x="170" y="24" width="124" height="192" fill="#FFFFFF" stroke="#1A2634" stroke-width="1.6"/>
      <g stroke="#181A1A" stroke-width="2.2">
        <line x1="216" y1="68" x2="248" y2="68"/><line x1="232" y1="54" x2="232" y2="82"/>
        <line x1="194" y1="104" x2="232" y2="104"/><line x1="212" y1="90" x2="212" y2="116"/>
        <line x1="234" y1="112" x2="274" y2="112"/><line x1="252" y1="98" x2="252" y2="128"/>
        <line x1="214" y1="146" x2="252" y2="146"/><line x1="232" y1="130" x2="232" y2="180"/>
        <line x1="192" y1="158" x2="220" y2="158"/><line x1="246" y1="164" x2="274" y2="164"/>
      </g>
      <text x="232" y="208" text-anchor="middle" fill="#1A2634" font-size="10" font-weight="700">码头与海 · 1915</text>
    `,
  },
  {
    id: "arnheim",
    year: "1954 / 1974",
    title: "阿恩海姆：画框里看不见的十字骨架",
    en: "RUDOLF ARNHEIM · UC PRESS",
    place: "《艺术与视知觉》（1954 首版，1974 修订）",
    body: "格式塔心理学家鲁道夫·阿恩海姆在开篇「平衡」一章画出了著名的方形「结构骨架（structural skeleton）」：哪怕画布还是白的，人眼也会自动在其中投射出横竖两条中轴与正中交点。交点引力最强，元素落轴则稳、偏轴则生拉力。",
    takeaway: "给排版的启发：十字构图不是硬塞进画框的外来图形，而是把画框本身隐含的心理受力骨架直接显影出来。",
    svg: `
      <rect x="64" y="24" width="192" height="192" fill="#F5F8FB" stroke="#1A2634" stroke-width="2"/>
      <line x1="64" y1="24" x2="256" y2="216" stroke="#9DB9D6" stroke-dasharray="4 4" stroke-width="1.2"/>
      <line x1="256" y1="24" x2="64" y2="216" stroke="#9DB9D6" stroke-dasharray="4 4" stroke-width="1.2"/>
      <line x1="160" y1="24" x2="160" y2="216" stroke="#2B629E" stroke-width="3"/>
      <line x1="64" y1="120" x2="256" y2="120" stroke="#2B629E" stroke-width="3"/>
      <circle cx="160" cy="120" r="46" fill="none" stroke="#3D7ABC" stroke-dasharray="3 3" stroke-width="1.3"/>
      <circle cx="160" cy="120" r="24" fill="#CDE0F1"/>
      <circle cx="160" cy="120" r="11" fill="#181A1A"/>
      <text x="160" y="232" text-anchor="middle" fill="#1D5490" font-size="10" font-weight="700">STRUCTURAL SKELETON · 中心引力最强</text>
    `,
  },
];

function initSection02() {
  const tabs = [...document.querySelectorAll("[data-lineage-id]")];
  const svg = document.getElementById("s02-svg");
  const yearEl = document.getElementById("s02-year");
  const titleEl = document.getElementById("s02-title");
  const enEl = document.getElementById("s02-en");
  const placeEl = document.getElementById("s02-place");
  const bodyEl = document.getElementById("s02-body");
  const takeEl = document.getElementById("s02-takeaway");
  if (!tabs.length || !svg) return;

  function select(id) {
    const item = LINEAGE.find((x) => x.id === id) || LINEAGE[0];
    for (const t of tabs) {
      const on = t.dataset.lineageId === item.id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    }
    svg.innerHTML = item.svg;
    if (yearEl) yearEl.textContent = item.year;
    if (titleEl) titleEl.textContent = item.title;
    if (enEl) enEl.textContent = item.en;
    if (placeEl) placeEl.textContent = item.place;
    if (bodyEl) bodyEl.textContent = item.body;
    if (takeEl) takeEl.textContent = item.takeaway;
  }
  for (const t of tabs) t.addEventListener("click", () => select(t.dataset.lineageId));
  select(LINEAGE[0].id);
}

// ---------- 03 深建筑暗室：6 格翻车处方翻牌矩阵 ----------
const FAILURES = [
  {
    id: "gridcut",
    name: "硬切四死格",
    badLabel: "两条实黑粗框把画面一刀剁成四张互不搭界的卡片，像填表不像构图。",
    fixLabel: "改用向两端渐隐的柔轴与统一中心主核把四区重新缝成一体，既有骨架又不断流。",
    badSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <line x1="90" y1="8" x2="90" y2="112" stroke="#FF9C94" stroke-width="5"/>
      <line x1="8" y1="60" x2="172" y2="60" stroke="#FF9C94" stroke-width="5"/>
      <rect x="20" y="18" width="56" height="30" fill="#2A4A73"/><rect x="104" y="18" width="56" height="30" fill="#2A4A73"/>
      <rect x="20" y="72" width="56" height="30" fill="#2A4A73"/><rect x="104" y="72" width="56" height="30" fill="#2A4A73"/>
    `,
    fixSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <rect x="82" y="12" width="16" height="96" fill="#4B8CD1" opacity="0.55"/>
      <rect x="14" y="52" width="152" height="16" fill="#4B8CD1" opacity="0.55"/>
      <circle cx="90" cy="60" r="18" fill="#0D1929" stroke="#FAF8EC" stroke-width="3.5"/>
      <circle cx="44" cy="60" r="5" fill="#9DF3DF"/><circle cx="136" cy="60" r="5" fill="#9DF3DF"/>
    `,
  },
  {
    id: "hollow",
    name: "交汇处空心",
    badLabel: "两条轴线规规矩矩画好了，主角却躲在左上角，十字中心扑了个空。",
    fixLabel: "把主视觉稳稳挪回交汇核心，借十字自带的最强引力一次锁住第一眼。",
    badSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <line x1="90" y1="12" x2="90" y2="108" stroke="#588FC8" stroke-width="8" opacity="0.7"/>
      <line x1="14" y1="60" x2="166" y2="60" stroke="#588FC8" stroke-width="8" opacity="0.7"/>
      <circle cx="90" cy="60" r="13" fill="none" stroke="#FF9C94" stroke-dasharray="3 3" stroke-width="2"/>
      <circle cx="42" cy="30" r="14" fill="#0D1929" stroke="#FF9C94" stroke-width="2.5"/>
    `,
    fixSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <line x1="90" y1="12" x2="90" y2="108" stroke="#588FC8" stroke-width="8" opacity="0.85"/>
      <line x1="14" y1="60" x2="166" y2="60" stroke="#588FC8" stroke-width="8" opacity="0.85"/>
      <circle cx="90" cy="60" r="16" fill="#0D1929" stroke="#FAF8EC" stroke-width="3.5"/>
    `,
  },
  {
    id: "skew",
    name: "轴角歪斜发晃",
    badLabel: "十字架斜了 18°：既失掉 90° 的端正安定，又没有 45° 斜交的冲劲，像画歪的框架。",
    fixLabel: "把主轴扶正回 0° 水平垂直，用严格正交呼应人眼的重力基准线。",
    badSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <g transform="rotate(18 90 60)">
        <rect x="83" y="10" width="14" height="100" fill="#FF9C94" opacity="0.75"/>
        <rect x="18" y="53" width="144" height="14" fill="#FF9C94" opacity="0.75"/>
      </g>
      <circle cx="90" cy="60" r="14" fill="#0D1929" stroke="#FF9C94" stroke-width="2.5"/>
    `,
    fixSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <rect x="83" y="12" width="14" height="96" fill="#4B8CD1" opacity="0.85"/>
      <rect x="18" y="53" width="144" height="14" fill="#4B8CD1" opacity="0.85"/>
      <circle cx="90" cy="60" r="14" fill="#0D1929" stroke="#9DF3DF" stroke-width="3"/>
    `,
  },
  {
    id: "stub",
    name: "短截成孤立加号",
    badLabel: "四条臂半路截断，悬在画幅正中像一枚医药标志，视线根本延展不出去。",
    fixLabel: "让四臂延伸至画幅外沿并自然羽化，把局部符号升级成贯通全图的视觉骨架。",
    badSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <rect x="84" y="34" width="12" height="52" fill="#FF9C94"/>
      <rect x="64" y="54" width="52" height="12" fill="#FF9C94"/>
      <circle cx="90" cy="60" r="10" fill="#0D1929" stroke="#FAF8EC" stroke-width="2"/>
    `,
    fixSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <rect x="84" y="10" width="12" height="100" fill="#4B8CD1" opacity="0.88"/>
      <rect x="12" y="54" width="156" height="12" fill="#4B8CD1" opacity="0.88"/>
      <line x1="16" y1="60" x2="164" y2="60" stroke="#FAF8EC" stroke-dasharray="4 4" stroke-width="1.2"/>
      <line x1="90" y1="14" x2="90" y2="106" stroke="#FAF8EC" stroke-dasharray="4 4" stroke-width="1.2"/>
      <circle cx="90" cy="60" r="14" fill="#0D1929" stroke="#FAF8EC" stroke-width="3"/>
    `,
  },
  {
    id: "crowded",
    name: "核周拥堵窒息",
    badLabel: "次要标签和装饰块全贴着黑核塞成一团，中心呼吸环荡然无存。",
    fixLabel: "把次要信息外推到四臂中段，留出围绕主核的干净白环与空气感。",
    badSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <line x1="90" y1="12" x2="90" y2="108" stroke="#588FC8" stroke-width="6" opacity="0.6"/>
      <line x1="14" y1="60" x2="166" y2="60" stroke="#588FC8" stroke-width="6" opacity="0.6"/>
      <circle cx="90" cy="60" r="14" fill="#0D1929" stroke="#FAF8EC" stroke-width="2.5"/>
      <rect x="62" y="34" width="18" height="14" fill="#FF9C94"/><rect x="100" y="34" width="18" height="14" fill="#FF9C94"/>
      <rect x="62" y="72" width="18" height="14" fill="#FF9C94"/><rect x="100" y="72" width="18" height="14" fill="#FF9C94"/>
    `,
    fixSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <line x1="90" y1="12" x2="90" y2="108" stroke="#588FC8" stroke-width="6" opacity="0.75"/>
      <line x1="14" y1="60" x2="166" y2="60" stroke="#588FC8" stroke-width="6" opacity="0.75"/>
      <circle cx="90" cy="60" r="26" fill="#4B8CD1" opacity="0.22"/>
      <circle cx="90" cy="60" r="14" fill="#0D1929" stroke="#FAF8EC" stroke-width="3"/>
      <circle cx="38" cy="60" r="6" fill="#9DF3DF"/><circle cx="142" cy="60" r="6" fill="#9DF3DF"/>
      <circle cx="90" cy="24" r="5" fill="#9DF3DF"/><circle cx="90" cy="96" r="5" fill="#9DF3DF"/>
    `,
  },
  {
    id: "tilt",
    name: "单臂倾覆失衡",
    badLabel: "重块和标题全挂在右臂与上臂，左臂下臂空空荡荡，整副十字架向右上方翻倒。",
    fixLabel: "用对侧臂配重拉平力矩，既可等距呼应，也可「近重配远轻」稳中生韵。",
    badSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <line x1="90" y1="12" x2="90" y2="108" stroke="#588FC8" stroke-width="6" opacity="0.65"/>
      <line x1="14" y1="60" x2="166" y2="60" stroke="#588FC8" stroke-width="6" opacity="0.65"/>
      <circle cx="90" cy="60" r="13" fill="#0D1929" stroke="#FAF8EC" stroke-width="2.5"/>
      <rect x="122" y="46" width="32" height="28" fill="#FF9C94"/>
      <rect x="76" y="16" width="28" height="20" fill="#FF9C94"/>
    `,
    fixSvg: `
      <rect x="8" y="8" width="164" height="104" fill="#1D3554"/>
      <line x1="90" y1="12" x2="90" y2="108" stroke="#588FC8" stroke-width="6" opacity="0.8"/>
      <line x1="14" y1="60" x2="166" y2="60" stroke="#588FC8" stroke-width="6" opacity="0.8"/>
      <circle cx="90" cy="60" r="14" fill="#0D1929" stroke="#FAF8EC" stroke-width="3"/>
      <circle cx="56" cy="60" r="10" fill="#9DF3DF"/>
      <circle cx="144" cy="60" r="6" fill="#9DF3DF"/>
      <circle cx="90" cy="28" r="5" fill="#9DF3DF"/>
      <circle cx="90" cy="92" r="7" fill="#9DF3DF"/>
    `,
  },
];

function initSection03() {
  const grid = document.getElementById("s03-grid");
  const btnAll = document.getElementById("s03-toggle-all");
  if (!grid) return;

  const fixed = new Set();

  function renderCards() {
    grid.innerHTML = FAILURES.map((f, idx) => {
      const isFixed = fixed.has(f.id);
      return `
        <article class="fail-card ${isFixed ? "is-fixed" : "is-bad"}" data-fail-id="${f.id}">
          <div class="fail-head">
            <span class="fail-idx">0${idx + 1}</span>
            <h3>${f.name}</h3>
            <span class="fail-pill">${isFixed ? "已救回" : "翻车态"}</span>
          </div>
          <svg class="fail-svg" viewBox="0 0 180 120" aria-hidden="true">${isFixed ? f.fixSvg : f.badSvg}</svg>
          <p class="fail-desc">${isFixed ? f.fixLabel : f.badLabel}</p>
          <button type="button" class="fail-btn" data-fix-btn="${f.id}">
            ${isFixed ? "退回错版对照" : "点击原地救回"}
          </button>
        </article>
      `;
    }).join("");

    if (btnAll) {
      btnAll.textContent = fixed.size === FAILURES.length ? "全部退回错版" : "一键全部救回";
    }
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fix-btn]");
    if (!btn) return;
    const id = btn.dataset.fixBtn;
    if (fixed.has(id)) fixed.delete(id);
    else fixed.add(id);
    renderCards();
  });

  if (btnAll) {
    btnAll.addEventListener("click", () => {
      if (fixed.size === FAILURES.length) fixed.clear();
      else FAILURES.forEach((f) => fixed.add(f.id));
      renderCards();
    });
  }

  renderCards();
}

// ---------- 04 同门构图怎么分清：结构形变双栏对比 ----------
const NEIGHBORS = {
  "029": {
    id: "029",
    name: "029 双轴构图",
    url: "https://layout.xiaoxiaodong.ai/029/play/",
    coreDiff: "双轴重在「切出四个独立象限各干各的」；十字重在「交汇处立唯一主核，四臂为它导流」。",
    switchWhen: "当你手里有 4 块平级或层级清晰的独立板块（如目录、图表、四区展板）要分房间放时，改用 029 双轴构图。",
    svg: `
      <rect x="20" y="18" width="90" height="72" fill="#DCE6F0" stroke="#2B629E" stroke-width="1.5"/>
      <rect x="122" y="18" width="98" height="72" fill="#2B629E"/>
      <rect x="20" y="102" width="90" height="60" fill="#2B629E"/>
      <rect x="122" y="102" width="98" height="60" fill="#DCE6F0" stroke="#2B629E" stroke-width="1.5"/>
      <line x1="116" y1="10" x2="116" y2="170" stroke="#181A1A" stroke-width="2"/>
      <line x1="12" y1="96" x2="228" y2="96" stroke="#181A1A" stroke-width="2"/>
      <text x="65" y="58" text-anchor="middle" fill="#1A2634" font-size="11" font-weight="700">Q1 分区</text>
      <text x="171" y="58" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">Q2 分区</text>
      <text x="65" y="136" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">Q3 分区</text>
      <text x="171" y="136" text-anchor="middle" fill="#1A2634" font-size="11" font-weight="700">Q4 分区</text>
    `,
  },
  "016": {
    id: "016",
    name: "016 居中构图",
    url: "https://layout.xiaoxiaodong.ai/016/play/",
    coreDiff: "居中构图只靠中心一团独立吸引视线，四周多为安静留白；十字构图则显式铺出贯通全幅的横竖引导臂。",
    switchWhen: "当主体本身足够纯粹、不需要沿四向延展次要信息或空间纵深时，用更简洁的 016 居中构图。",
    svg: `
      <rect x="18" y="16" width="204" height="148" fill="#F5F8FB" stroke="#B8CBE0" stroke-width="1.5"/>
      <circle cx="120" cy="90" r="46" fill="#DCE6F0"/>
      <circle cx="120" cy="90" r="24" fill="#181A1A"/>
      <text x="120" y="152" text-anchor="middle" fill="#45596E" font-size="10" font-weight="600">单点聚心 · 无外扩轴臂</text>
    `,
  },
  "026": {
    id: "026",
    name: "026 交叉线构图",
    url: "https://layout.xiaoxiaodong.ai/026/play/",
    coreDiff: "把十字转过 45° 变成 X 形斜交，安定建筑感瞬间转成碰撞、速度与戏剧冲锋。",
    switchWhen: "当主题强调对决、冲刺、能量迸发而非庄重稳健时，果断换成 026 交叉线构图。",
    svg: `
      <rect x="18" y="16" width="204" height="148" fill="#F5F8FB" stroke="#B8CBE0" stroke-width="1.5"/>
      <line x1="28" y1="24" x2="212" y2="156" stroke="#3D7ABC" stroke-width="10"/>
      <line x1="212" y1="24" x2="28" y2="156" stroke="#3D7ABC" stroke-width="10"/>
      <line x1="28" y1="24" x2="212" y2="156" stroke="#FFFFFF" stroke-dasharray="5 5" stroke-width="1.4"/>
      <line x1="212" y1="24" x2="28" y2="156" stroke="#FFFFFF" stroke-dasharray="5 5" stroke-width="1.4"/>
      <circle cx="120" cy="90" r="16" fill="#181A1A" stroke="#FFFFFF" stroke-width="3"/>
    `,
  },
  "027": {
    id: "027",
    name: "027 中轴构图",
    url: "https://layout.xiaoxiaodong.ai/027/play/",
    coreDiff: "中轴构图只立一根从顶贯底的垂直脊梁，视线顺一条竖线走；十字构图多了一条横梁，把视线定在正交点并向左右铺开。",
    switchWhen: "当你只需要仪式感极强的纵向通廊或竖排单序阅读，不想被横轴截断纵流时，改用 027 中轴构图。",
    svg: `
      <rect x="18" y="16" width="204" height="148" fill="#F5F8FB" stroke="#B8CBE0" stroke-width="1.5"/>
      <rect x="110" y="16" width="20" height="148" fill="#3D7ABC"/>
      <line x1="120" y1="20" x2="120" y2="160" stroke="#FFFFFF" stroke-dasharray="5 5" stroke-width="1.4"/>
      <rect x="78" y="42" width="84" height="16" fill="#181A1A"/>
      <rect x="92" y="76" width="56" height="12" fill="#1A2634"/>
      <rect x="84" y="114" width="72" height="12" fill="#45596E"/>
    `,
  },
};

function initSection04() {
  const btns = [...document.querySelectorAll("[data-nb-id]")];
  const svg = document.getElementById("s04-nb-svg");
  const title = document.getElementById("s04-nb-title");
  const diff = document.getElementById("s04-nb-diff");
  const when = document.getElementById("s04-nb-when");
  const link = document.getElementById("s04-nb-link");
  if (!btns.length || !svg) return;

  function show(id) {
    const nb = NEIGHBORS[id] || NEIGHBORS["029"];
    for (const b of btns) {
      const on = b.dataset.nbId === nb.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    svg.innerHTML = nb.svg;
    if (title) title.textContent = nb.name;
    if (diff) diff.textContent = nb.coreDiff;
    if (when) when.textContent = nb.switchWhen;
    if (link) {
      link.href = nb.url;
      link.textContent = `去看 ${nb.name} 互动版 →`;
    }
  }
  for (const b of btns) b.addEventListener("click", () => show(b.dataset.nbId));
  show("029");
}

// ---------- 05 什么时候用 / 什么时候别用：四类项目落版压力测试 ----------
const SCENARIOS = {
  exhibition: {
    id: "exhibition",
    label: "建筑光影展海报",
    fit: true,
    badge: "高适配 · 十字主场",
    headline: "标志建筑居中镇场，展期、场馆与导览沿四臂有序铺展",
    reason: "展览主海报只需要 1 个最强记忆点和 3–4 组短标签。十字交汇一眼锁住视觉图腾，四条隐形轴线把日期、地点、策展名分别托在上下左右，端庄、克制且极易远距离扫读。",
    altHtml: "",
    svg: `
      <rect x="14" y="14" width="292" height="182" fill="#E9EFF4" stroke="#2B629E" stroke-width="1.5"/>
      <rect x="150" y="14" width="20" height="182" fill="#3D7ABC" opacity="0.25"/>
      <rect x="14" y="90" width="292" height="20" fill="#3D7ABC" opacity="0.25"/>
      <circle cx="160" cy="100" r="30" fill="#181A1A" stroke="#FFFFFF" stroke-width="4"/>
      <text x="160" y="104" text-anchor="middle" fill="#FAF8EC" font-size="11" font-weight="700">光影展</text>
      <text x="160" y="38" text-anchor="middle" fill="#1D5490" font-size="10" font-weight="700">2026 ARCHITECTURAL LIGHT</text>
      <text x="160" y="176" text-anchor="middle" fill="#1A2634" font-size="10" font-weight="700">11.08 — 12.20 · 美术馆东翼</text>
      <text x="58" y="104" text-anchor="middle" fill="#1A2634" font-size="10" font-weight="600">免费预约</text>
      <text x="262" y="104" text-anchor="middle" fill="#1A2634" font-size="10" font-weight="600">03 号展厅</text>
    `,
  },
  headphone: {
    id: "headphone",
    label: "旗舰耳机单品主视觉",
    fit: true,
    badge: "高适配 · 仪式感强",
    headline: "产品轮廓压在光学十字心，四大卖点分落四臂不抢主图",
    reason: "精密工业产品（手表、相机、耳机、香氛）最需要「可靠、精准、值得信赖」的气场。十字正交天然带来精密仪器感，四臂留白又给产品留足呼吸空间。",
    altHtml: "",
    svg: `
      <rect x="14" y="14" width="292" height="182" fill="#F5F8FB" stroke="#2B629E" stroke-width="1.5"/>
      <line x1="160" y1="20" x2="160" y2="190" stroke="#3D7ABC" stroke-dasharray="4 4" stroke-width="1.6"/>
      <line x1="20" y1="100" x2="300" y2="100" stroke="#3D7ABC" stroke-dasharray="4 4" stroke-width="1.6"/>
      <circle cx="160" cy="100" r="38" fill="#DCE6F0"/>
      <path d="M138 106 A22 22 0 0 1 182 106" fill="none" stroke="#181A1A" stroke-width="6" stroke-linecap="round"/>
      <rect x="132" y="100" width="11" height="22" rx="4" fill="#181A1A"/>
      <rect x="177" y="100" width="11" height="22" rx="4" fill="#181A1A"/>
      <text x="64" y="96" text-anchor="middle" fill="#1D5490" font-size="10" font-weight="700">42dB 降噪</text>
      <text x="256" y="96" text-anchor="middle" fill="#1D5490" font-size="10" font-weight="700">48h 续航</text>
      <text x="160" y="38" text-anchor="middle" fill="#1A2634" font-size="11" font-weight="700">STUDIO ONE</text>
      <text x="160" y="176" text-anchor="middle" fill="#45596E" font-size="10">精密声学参考系列</text>
    `,
  },
  sprint: {
    id: "sprint",
    label: "跑鞋百米冲刺广告",
    fit: false,
    badge: "避用警示 · 动势被锁死",
    headline: "90° 横平竖直把奔跑冲劲当场刹停，画面像卡在格子里",
    reason: "十字构图的本质是「稳定与驻停」。用来装百米冲刺、滑雪飞跃或赛车漂移时，横竖正交线会强行抵消前冲动能，让广告显得木讷。",
    altHtml: `建议改用 <a href="https://layout.xiaoxiaodong.ai/023/play/" target="_blank" rel="noopener">023 对角线构图</a> 或 <a href="https://layout.xiaoxiaodong.ai/028/play/" target="_blank" rel="noopener">028 偏轴构图</a>，给运动方向留出大片前向冲刺走廊。`,
    svg: `
      <rect x="14" y="14" width="292" height="182" fill="#F6EAEB" stroke="#B42822" stroke-width="1.5"/>
      <rect x="152" y="14" width="16" height="182" fill="#B42822" opacity="0.22"/>
      <rect x="14" y="96" width="292" height="16" fill="#B42822" opacity="0.22"/>
      <polygon points="122,118 198,86 190,118" fill="#181A1A"/>
      <line x1="205" y1="68" x2="205" y2="136" stroke="#B42822" stroke-width="3"/>
      <text x="160" y="42" text-anchor="middle" fill="#B42822" font-size="11" font-weight="700">正交竖轴挡住前冲路线 · 速度感折损</text>
      <text x="160" y="174" text-anchor="middle" fill="#45596E" font-size="10">越要求快，越别用十字把运动锁在正中</text>
    `,
  },
  longread: {
    id: "longread",
    label: "两千字深度新闻专栏",
    fit: false,
    badge: "避用警示 · 切碎阅读流",
    headline: "密集文字塞进十字骨架，眼球每读半行就被轴线绊停",
    reason: "长文阅读靠的是自左而右、自上而下的连贯扫视流。强行在中间放十字主核与四臂分割，会把整段文章剁得支离破碎，读者根本不知该先读哪一角。",
    altHtml: `长文或多区块导览请改用清晰分栏或 <a href="https://layout.xiaoxiaodong.ai/029/play/" target="_blank" rel="noopener">029 双轴构图</a> 的独立分区。`,
    svg: `
      <rect x="14" y="14" width="292" height="182" fill="#F6EAEB" stroke="#B42822" stroke-width="1.5"/>
      <g fill="#6E7F91" opacity="0.55">
        <rect x="28" y="28" width="106" height="8"/><rect x="28" y="42" width="96" height="8"/><rect x="28" y="56" width="104" height="8"/>
        <rect x="186" y="28" width="106" height="8"/><rect x="186" y="42" width="92" height="8"/><rect x="186" y="56" width="100" height="8"/>
        <rect x="28" y="132" width="106" height="8"/><rect x="28" y="146" width="94" height="8"/><rect x="28" y="160" width="102" height="8"/>
        <rect x="186" y="132" width="106" height="8"/><rect x="186" y="146" width="98" height="8"/><rect x="186" y="160" width="90" height="8"/>
      </g>
      <rect x="150" y="14" width="20" height="182" fill="#B42822" opacity="0.28"/>
      <rect x="14" y="92" width="292" height="20" fill="#B42822" opacity="0.28"/>
      <circle cx="160" cy="102" r="22" fill="#B42822"/>
      <text x="160" y="106" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="700">断流</text>
    `,
  },
};

function initSection05() {
  const btns = [...document.querySelectorAll("[data-sc-id]")];
  const svg = document.getElementById("s05-svg");
  const badge = document.getElementById("s05-badge");
  const headline = document.getElementById("s05-headline");
  const reason = document.getElementById("s05-reason");
  const alt = document.getElementById("s05-alt");
  if (!btns.length || !svg) return;

  function pick(id) {
    const s = SCENARIOS[id] || SCENARIOS.exhibition;
    for (const b of btns) {
      const on = b.dataset.scId === s.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    svg.innerHTML = s.svg;
    if (badge) {
      badge.textContent = s.badge;
      badge.dataset.fit = s.fit ? "yes" : "no";
    }
    if (headline) headline.textContent = s.headline;
    if (reason) reason.textContent = s.reason;
    if (alt) {
      alt.innerHTML = s.altHtml;
      alt.hidden = !s.altHtml;
    }
  }
  for (const b of btns) b.addEventListener("click", () => pick(b.dataset.scId));
  pick("exhibition");
}

// ---------- 06 两题组单变量四选一眼力考 ----------
// 严格遵守 BRIEF：四个选项只差一个变量，标签只写中性描述，不泄露优劣！
const QUIZZES = [
  {
    id: 0,
    tag: "第 1 题 / 共 2 题 · 变量：四臂次要信息落位",
    prompt:
      "为「现代建筑光影展」排一张海报。四版的主标黑核位置、十字轴角、配色和字号完全相同，只差 4 枚次要信息在四条轴臂上的落位。哪一版最稳且最有延展节奏？",
    answer: "C",
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "四枚次要信息环列在距心 22% 处",
        why: "主核外圈被次要信息紧箍着，失去白环呼吸感，而四条向外延伸的轴臂几乎全空，白白浪费了十字的引导空间。",
        svg: quizPosterSvg({ n: 56, s: 124, w: 66, e: 114, wSize: 16, eSize: 16 }),
      },
      {
        key: "B",
        label: "方案 B",
        meta: "四枚次要信息全落于上臂与右臂外段",
        why: "四项次要元素全往右上方两臂扎堆，左臂与下臂空置悬空，整张海报的视觉天平明显向右上方倾覆。",
        svg: quizPosterSvg({ n: 24, s: null, w: null, e: 158, wSize: 0, eSize: 18, extraNE: true }),
      },
      {
        key: "C",
        label: "方案 C",
        meta: "四枚次要信息落于四臂中段，左右微差配重",
        why: "正确！主核四周留出干爽呼吸环，四条臂中段（距心约 55%–70%）各托信息形成外延引导；左近略重、右远略轻，兼顾端庄稳定与视觉张力。",
        svg: quizPosterSvg({ n: 34, s: 150, w: 46, e: 146, wSize: 20, eSize: 13 }),
      },
      {
        key: "D",
        label: "方案 D",
        meta: "四枚次要信息贴紧画框四边末端（距心 94%）",
        why: "次要信息被推到紧贴画框边线，视觉上被外框吸走，视线顺着十字轴冲到边上就滑出画面，与中心主核断开了联系。",
        svg: quizPosterSvg({ n: 14, s: 168, w: 16, e: 164, wSize: 16, eSize: 16 }),
      },
    ],
  },
  {
    id: 1,
    tag: "第 2 题 / 共 2 题 · 变量：水平轴高度与倾角",
    prompt:
      "在立交桥拱廊正下方拍一张纪念碑感十字构图照片。四版焦段、曝光与主体比例都相同，只差镜头俯仰（横轴高度）和水平仪倾角。哪一版最端正挺拔？",
    answer: "B",
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "横轴压在 62% 下半区 · 倾角 0°",
        why: "横轴沉得过低，上方垂直臂拉得过长而下臂局促，整幅画面重心下坠、略显沉闷。",
        svg: quizPhotoSvg({ hy: 112, angle: 0 }),
      },
      {
        key: "B",
        label: "方案 B",
        meta: "横轴位于 47% 略上提 · 倾角 0°",
        why: "正确！严格 0° 水平垂直守住建筑稳重感，同时将交汇点从 50% 轻提 3% 至光学中心，抵消人眼自带的下坠错觉，显得挺拔舒展。",
        svg: quizPhotoSvg({ hy: 85, angle: 0 }),
      },
      {
        key: "C",
        label: "方案 C",
        meta: "横轴位于 47% · 镜头右倾 11°",
        why: "只歪 11° 既打碎了十字构图赖以立足的正交稳固感，又不够果断到形成斜交动势，看起来像端歪了相机。",
        svg: quizPhotoSvg({ hy: 85, angle: 11 }),
      },
      {
        key: "D",
        label: "方案 D",
        meta: "横轴抬高到 24% 顶区 · 倾角 0°",
        why: "横轴太靠顶边，上臂几乎被截没了，十字结构退化成顶沿横杠挂着一根长柱（T 形压顶），失去四向平衡。",
        svg: quizPhotoSvg({ hy: 44, angle: 0 }),
      },
    ],
  },
];

function quizPosterSvg({ n, s, w, e, wSize, eSize, extraNE }) {
  return `
    <rect x="4" y="4" width="172" height="172" fill="#E9EFF4" stroke="#B8CBE0" stroke-width="1.2"/>
    <rect x="83" y="4" width="14" height="172" fill="#3D7ABC" opacity="0.32"/>
    <rect x="4" y="83" width="172" height="14" fill="#3D7ABC" opacity="0.32"/>
    <line x1="90" y1="8" x2="90" y2="172" stroke="#FFFFFF" stroke-dasharray="4 4" stroke-width="1.2"/>
    <line x1="8" y1="90" x2="172" y2="90" stroke="#FFFFFF" stroke-dasharray="4 4" stroke-width="1.2"/>
    <circle cx="90" cy="90" r="26" fill="#CDE0F1" opacity="0.72"/>
    <circle cx="90" cy="90" r="15" fill="#181A1A" stroke="#FFFFFF" stroke-width="3.5"/>
    ${n != null ? `<rect x="74" y="${n - 4}" width="32" height="8" rx="1" fill="#1D5490"/>` : ""}
    ${s != null ? `<rect x="72" y="${s - 4}" width="36" height="8" rx="1" fill="#1D5490"/>` : ""}
    ${w != null && wSize ? `<rect x="${w - wSize / 2}" y="85" width="${wSize}" height="10" rx="1" fill="#1A2634"/>` : ""}
    ${e != null && eSize ? `<rect x="${e - eSize / 2}" y="86" width="${eSize}" height="8" rx="1" fill="#1A2634"/>` : ""}
    ${extraNE ? `<rect x="74" y="38" width="32" height="8" rx="1" fill="#1D5490"/><rect x="126" y="85" width="18" height="10" rx="1" fill="#1A2634"/>` : ""}
  `;
}

function quizPhotoSvg({ hy, angle }) {
  return `
    <defs><clipPath id="qp-${hy}-${angle}"><rect x="4" y="4" width="172" height="172"/></clipPath></defs>
    <rect x="4" y="4" width="172" height="172" fill="#DCE6F0" stroke="#B8CBE0" stroke-width="1.2"/>
    <g clip-path="url(#qp-${hy}-${angle})" transform="rotate(${angle} 90 ${hy})">
      <rect x="-20" y="${hy}" width="220" height="140" fill="#3D7ABC" opacity="0.22"/>
      <rect x="80" y="-20" width="20" height="220" fill="#2B629E"/>
      <rect x="-20" y="${hy - 8}" width="220" height="16" fill="#2B629E"/>
      <line x1="90" y1="-20" x2="90" y2="200" stroke="#FAF8EC" stroke-dasharray="4 4" stroke-width="1.2"/>
      <line x1="-20" y1="${hy}" x2="200" y2="${hy}" stroke="#FAF8EC" stroke-dasharray="4 4" stroke-width="1.2"/>
      <circle cx="90" cy="${hy}" r="16" fill="#181A1A" stroke="#FFFFFF" stroke-width="3.5"/>
    </g>
  `;
}

function initSection06() {
  const wrap = document.getElementById("s06-quiz-wrap");
  if (!wrap) return;
  let current = 0;
  const picked = {};

  function render() {
    const q = QUIZZES[current];
    const chosen = picked[q.id] || null;
    const chosenOpt = q.options.find((o) => o.key === chosen);
    const isRight = chosen === q.answer;

    wrap.innerHTML = `
      <div class="quiz-top">
        <span class="quiz-tag">${q.tag}</span>
        <div class="quiz-nav">
          <button type="button" class="quiz-switch" data-q-go="0" ${current === 0 ? 'aria-current="step"' : ""}>第 1 题</button>
          <button type="button" class="quiz-switch" data-q-go="1" ${current === 1 ? 'aria-current="step"' : ""}>第 2 题</button>
        </div>
      </div>
      <p class="quiz-prompt">${q.prompt}</p>
      <div class="quiz-grid">
        ${q.options
          .map((opt) => {
            let cls = "quiz-opt";
            if (chosen) {
              if (opt.key === q.answer) cls += " is-correct";
              else if (opt.key === chosen) cls += " is-wrong";
            }
            return `
              <button type="button" class="${cls}" data-q-opt="${opt.key}" aria-pressed="${chosen === opt.key}">
                <svg class="quiz-svg" viewBox="0 0 180 180" aria-hidden="true">${opt.svg}</svg>
                <span class="quiz-opt-head">
                  <strong>${opt.label}</strong>
                  ${chosen && opt.key === q.answer ? '<span class="quiz-mark ok">正解</span>' : ""}
                  ${chosen && opt.key === chosen && opt.key !== q.answer ? '<span class="quiz-mark err">已选</span>' : ""}
                </span>
                <span class="quiz-opt-meta">${opt.meta}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="quiz-feedback ${chosen ? (isRight ? "is-ok" : "is-err") : ""}" role="status" aria-live="polite">
        ${
          chosenOpt
            ? `<strong>${isRight ? `答对了（${chosenOpt.label}）` : `选了 ${chosenOpt.label}，再看看 ${q.answer}`}</strong>
               <p>${chosenOpt.why}</p>
               ${!isRight ? `<p class="quiz-answer-hint">正解 ${q.answer}：${q.options.find((o) => o.key === q.answer).why}</p>` : ""}
               <div class="quiz-fb-actions">
                 <button type="button" class="btn-outline" data-q-reset>重做本题</button>
                 <button type="button" class="btn-solid" data-q-next>${current === 0 ? "做下一题 →" : "回到第 1 题"}</button>
               </div>`
            : `<p>点选上方 A / B / C / D 任一方案查看结构拆解。</p>`
        }
      </div>
    `;
  }

  wrap.addEventListener("click", (e) => {
    const go = e.target.closest("[data-q-go]");
    if (go) {
      current = Number(go.dataset.qGo);
      render();
      return;
    }
    const opt = e.target.closest("[data-q-opt]");
    if (opt) {
      picked[QUIZZES[current].id] = opt.dataset.qOpt;
      render();
      return;
    }
    if (e.target.closest("[data-q-reset]")) {
      delete picked[QUIZZES[current].id];
      render();
      return;
    }
    if (e.target.closest("[data-q-next]")) {
      current = (current + 1) % QUIZZES.length;
      render();
    }
  });

  render();
}

// ---------- 07 原海报灯箱（点击放大、拖动、缩放、Esc 关） ----------
function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomIn = document.getElementById("lightbox-zoom-in");
  const zoomOut = document.getElementById("lightbox-zoom-out");
  const zoomReset = document.getElementById("lightbox-reset");
  if (!poster || !dialog || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    lbImg.src = poster.currentSrc || poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  poster.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") close();
  });

  zoomIn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbImg.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, x: e.clientX - tx, y: e.clientY - ty };
    try {
      lbImg.setPointerCapture(e.pointerId);
    } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => {
    drag = null;
  });
  lbImg.addEventListener("pointercancel", () => {
    drag = null;
  });
}
