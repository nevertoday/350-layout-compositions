// 120 共同区域原则 · 正文 01–07 节互动控制器（相邻两节控件互不重复）
import { PALETTE, computeNestingDemo } from "./model.js";

export function mountSections() {
  initS1BlindTest();
  initS2HistoryLab();
  initS3BoundarySpectrum();
  initS4UiClinics();
  initS5OnionPeeler();
  initS6Quiz();
  initS7PosterLightbox();
}

// ---------- 01 节：原海报去色盲测与颜色拔河板 ----------
function initS1BlindTest() {
  const root = document.getElementById("s1-lab");
  if (!root) return;
  const svg = root.querySelector("#s1-svg");
  const verdict = root.querySelector("#s1-verdict");
  const boxToggle = root.querySelector("#s1-toggle-box");
  const chips = [...root.querySelectorAll("[data-s1-color]")];

  let colorMode = "poster"; // poster | mono | conflict
  let boxOn = true;

  function render() {
    chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s1Color === colorMode)));
    boxToggle.setAttribute("aria-pressed", String(boxOn));
    boxToggle.textContent = boxOn ? "撤掉三条粉彩底框" : "盖回三条粉彩底框";

    // 绘制 3x3：组内水平距 132，跨区垂直距 66（恰好 2.0×）
    const xs = [84, 216, 348];
    const ys = [56, 122, 188];
    const fills = ["#EBE1D7", "#FDC2CD", "#E2D5D3"];

    let markup = `<rect x="0" y="0" width="432" height="244" fill="#FCF9F3" rx="12"/>`;

    // 无底框时且非原海报色，画出红虚线竖列误读提示
    if (!boxOn && colorMode !== "poster") {
      for (let c = 0; c < 3; c++) {
        markup += `<rect x="${xs[c] - 28}" y="22" width="56" height="200" rx="14" fill="rgba(184,29,36,0.06)" stroke="#B81D24" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      }
    }

    // 三道粉彩底框
    if (boxOn) {
      for (let r = 0; r < 3; r++) {
        markup += `<rect x="36" y="${ys[r] - 27}" width="360" height="54" rx="18" fill="${fills[r]}"/>`;
      }
    }

    // 9 枚正圆点
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        let dotFill = PALETTE.dotMono;
        if (colorMode === "poster") dotFill = PALETTE.dots[r];
        else if (colorMode === "conflict") dotFill = PALETTE.dots[c];
        markup += `<circle cx="${xs[c]}" cy="${ys[r]}" r="15" fill="${dotFill}"/>`;
      }
    }

    // 距离对比标注（右侧竖标加暖象牙底板避免虚线穿字）
    markup += `
      <g font-family="'Space Mono','Noto Sans SC',monospace" font-size="11" font-weight="700">
        <line x1="84" y1="16" x2="216" y2="16" stroke="#3F3B37" stroke-width="1.2"/>
        <rect x="115" y="6" width="70" height="18" rx="4" fill="#FCF9F3"/>
        <text x="150" y="19" text-anchor="middle" fill="#0C0E14">横距 132</text>
        <line x1="408" y1="56" x2="408" y2="122" stroke="${boxOn ? "#E74F08" : "#B81D24"}" stroke-width="1.4" stroke-dasharray="4 3"/>
        <rect x="386" y="79" width="44" height="19" rx="4" fill="#FCF9F3"/>
        <text x="408" y="92" text-anchor="middle" fill="${boxOn ? "#B83800" : "#B81D24"}">竖 66</text>
      </g>`;

    svg.innerHTML = markup;

    if (colorMode === "poster" && boxOn) {
      verdict.textContent = "原海报状态：粉彩底框（共同区域）＋同行同色（相似性）双保险，横排极稳——但也把颜色帮手藏在了里面。试着切到「纯单色盲测」或「按列撞色」。";
    } else if (colorMode === "poster" && !boxOn) {
      verdict.textContent = "撤掉底框后：上下竖距（66）只有横距（132）的一半，但同行同色仍在硬撑——这说明原海报若只靠三色圆点，其实混入了 115 相似性原则。";
    } else if (colorMode === "mono" && boxOn) {
      verdict.textContent = "纯单色盲测＋粉彩底框：颜色线索归零、横距仍是竖距 2 倍，大脑依然毫不犹豫分成三横排——这才是纯粹的共同区域力量。";
    } else if (colorMode === "mono" && !boxOn) {
      verdict.textContent = "纯单色盲测＋无底框：一旦掀开底框，116 邻近性瞬间接管，9 枚黑点立刻竖劈成三道紧贴的竖列！";
    } else if (colorMode === "conflict" && boxOn) {
      verdict.textContent = "逆风极限测试：按列同色（相似性）和上下更近（邻近性）联手把你往「3 竖列」拽，但三道横排底框依然稳稳把视觉锁成 3 横组！";
    } else {
      verdict.textContent = "撤掉底框后：按列同色＋上下更近双重叠加，画面彻底锁死成三竖列——再点一下「盖回三条粉彩底框」，感受边界瞬间夺回控制权。";
    }
  }

  chips.forEach((b) => {
    b.addEventListener("click", () => {
      colorMode = b.dataset.s1Color;
      render();
    });
  });
  boxToggle.addEventListener("click", () => {
    boxOn = !boxOn;
    render();
  });
  render();
}

// ---------- 02 节：4 站历史年代胶囊 + 心理学实验矢量板 ----------
function initS2HistoryLab() {
  const root = document.getElementById("s2-history");
  if (!root) return;
  const tabs = [...root.querySelectorAll("[data-era]")];
  const titleEl = root.querySelector("#s2-era-title");
  const citeEl = root.querySelector("#s2-era-cite");
  const descEl = root.querySelector("#s2-era-desc");
  const svgEl = root.querySelector("#s2-era-svg");
  const actionBtn = root.querySelector("#s2-era-toggle");

  let active = "1992";
  let palmerFence = true;

  const ERAS = {
    "1923": {
      title: "1923 · 古典格式塔清单里，还没有「共同区域」",
      cite: "Max Wertheimer (1923), Untersuchungen zur Lehre von der Gestalt II（英译收录于 Ellis 1938）",
      desc: "韦特海默首次系统提出邻近性、相似性、闭合性、连续性与共同命运等经典知觉组织规律。但在 1923 年的论文里，所有刺激都是悬浮在纯白背景上的离散点线，并未把「封闭边界或底色容器」单列为独立原则。",
      hasToggle: false,
    },
    "1992": {
      title: "1992 · Stephen Palmer 正式命名「共同区域原则」",
      cite: "Stephen E. Palmer (1992), Cognitive Psychology, 24(3), 436–447（PMID 1516361）",
      desc: "加州大学伯克利分校心理学家帕尔默提出：位于同一封闭轮廓或共同底色区域内的元素会被优先编组。下方复刻了论文中最著名的经典示范——点一下「掀开椭圆边界」，亲眼看成对关系如何瞬间改写。",
      hasToggle: true,
    },
    "1994": {
      title: "1994 · Palmer & Rock 提出「一致连通性」前哨机制",
      cite: "Stephen E. Palmer & Irvin Rock (1994), Psychonomic Bulletin & Review, 1(1), 29–55",
      desc: "帕尔默与洛克进一步追问「在按距离和相似性分组之前，大脑先拿什么当基本单位？」他们提出一致连通性（Uniform Connectedness）：均匀闭合的区域会先于离散点被视作入口级单元，解释了为何容器边界拥有极高优先级。",
      hasToggle: false,
    },
    "2020": {
      title: "2008–2020 · 百年综述定格与 UI 卡片时代全面普及",
      cite: "Colin Ware (2008) · Wagemans 等 (2012, Psychological Bulletin) · NN/g (2020) · Laws of UX (2020)",
      desc: "2012 年格式塔百年综述将共同区域定为对 1923 古典体系的关键现代扩展。随后 Colin Ware、Nielsen Norman Group 与 Jon Yablonski 把它译介为界面卡片、表单分区与仪表盘模块的核心法则——同时也提醒避免「框套框」。",
      hasToggle: false,
    },
  };

  function renderSvg() {
    if (active === "1923") {
      // 古典纯点阵：仅靠距离成对 (o o)   (o o)   (o o)
      const pairs = [64, 102, 184, 222, 304, 342];
      let s = `<rect width="406" height="176" rx="12" fill="#FFFDF9" stroke="#D4C9BE"/>`;
      s += `<text x="203" y="34" text-anchor="middle" font-size="11.5" font-weight="700" fill="#3F3B37" font-family="'Space Mono','Noto Sans SC',monospace">1923 · 仅靠距离邻近（无容器边界）</text>`;
      pairs.forEach((x) => {
        s += `<circle cx="${x}" cy="96" r="11" fill="#0C0E14"/>`;
      });
      [[64, 102], [184, 222], [304, 342]].forEach(([a, b]) => {
        s += `<path d="M${a - 14} 120 Q${(a + b) / 2} 138 ${b + 14} 120" fill="none" stroke="#E74F08" stroke-width="1.8" stroke-dasharray="4 3"/>`;
      });
      s += `<text x="203" y="158" text-anchor="middle" font-size="11" fill="#3F3B37" font-family="'Noto Sans SC',sans-serif">点间距 38px vs 组间距 82px → 自动两两成对</text>`;
      svgEl.innerHTML = s;
    } else if (active === "1992") {
      // Palmer 1992 经典实验：框内距 70px ＞ 框外邻距 44px，三只圆角框之间留 8px 清爽缝隙零重叠
      const xs = [52, 122, 166, 236, 280, 350];
      let s = `<rect width="406" height="176" rx="12" fill="#FFFDF9" stroke="#D4C9BE"/>`;
      s += `<text x="203" y="28" text-anchor="middle" font-size="11.5" font-weight="700" fill="${palmerFence ? "#155930" : "#B83800"}" font-family="'Space Mono','Noto Sans SC',monospace">${palmerFence ? "1992 Palmer 实验：圆角框锁住远距配对 (1-2)(3-4)(5-6)" : "掀开边界后：邻近性立刻改配成 (2-3)(4-5)！"}</text>`;
      if (palmerFence) {
        [[34, 106], [148, 106], [262, 106]].forEach(([x, w], i) => {
          const bg = ["#EBE1D7", "#FDC2CD", "#E2D5D3"][i];
          s += `<rect x="${x}" y="58" width="${w}" height="62" rx="22" fill="${bg}" stroke="#0D285F" stroke-width="1.6"/>`;
        });
      } else {
        // 掀开后近邻配对 (2-3) 与 (4-5)
        [[122, 166], [236, 280]].forEach(([a, b]) => {
          s += `<rect x="${a - 15}" y="62" width="${b - a + 30}" height="54" rx="16" fill="rgba(184,29,36,0.08)" stroke="#B81D24" stroke-width="1.5" stroke-dasharray="4 3"/>`;
        });
      }
      xs.forEach((x, idx) => {
        s += `<circle cx="${x}" cy="89" r="10.5" fill="#0C0E14"/>`;
        s += `<text x="${x}" y="144" text-anchor="middle" font-size="11" font-weight="700" fill="#3F3B37" font-family="'Space Mono',monospace">${idx + 1}</text>`;
      });
      s += `<text x="203" y="164" text-anchor="middle" font-size="11" fill="#3F3B37" font-family="'Noto Sans SC',sans-serif">框内距 70px ＞ 框外相邻距 44px（${palmerFence ? "共同区域胜出" : "邻近性接管"}）</text>`;
      svgEl.innerHTML = s;
    } else if (active === "1994") {
      // Uniform Connectedness：连通区域先于分离图形被切分
      let s = `<rect width="406" height="176" rx="12" fill="#FFFDF9" stroke="#D4C9BE"/>`;
      s += `<text x="203" y="30" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0D285F" font-family="'Space Mono','Noto Sans SC',monospace">1994 一致连通性：均匀连通块先成为视觉单元</text>`;
      s += `<rect x="40" y="54" width="146" height="72" rx="20" fill="#EBE1D7"/>`;
      s += `<rect x="220" y="54" width="146" height="72" rx="20" fill="#FDC2CD"/>`;
      s += `<circle cx="82" cy="90" r="12" fill="#E74F08"/><rect x="130" y="78" width="24" height="24" rx="3" fill="#0D285F"/>`;
      s += `<polygon points="262,76 276,104 248,104" fill="#155930"/><circle cx="326" cy="90" r="12" fill="#E74F08"/>`;
      s += `<text x="203" y="156" text-anchor="middle" font-size="11" fill="#3F3B37" font-family="'Noto Sans SC',sans-serif">即使圆、方、三角形态颜色各异，仍先随连通底块被打包</text>`;
      svgEl.innerHTML = s;
    } else {
      // 2008-2020 UI 卡片化
      let s = `<rect width="406" height="176" rx="12" fill="#FFFDF9" stroke="#D4C9BE"/>`;
      s += `<text x="203" y="28" text-anchor="middle" font-size="11.5" font-weight="700" fill="#155930" font-family="'Space Mono','Noto Sans SC',monospace">现代界面：卡片与分区成为共同区域的主战场</text>`;
      [[26, "#EBE1D7", "配送地址", "收件人 · 电话 · 门牌"], [214, "#E2D5D3", "发票设置", "抬头 · 税号 · 邮箱"]].forEach(([x, bg, t, sub]) => {
        s += `<rect x="${x}" y="46" width="166" height="94" rx="14" fill="${bg}"/>`;
        s += `<text x="${x + 16}" y="74" font-size="13" font-weight="700" fill="#0C0E14" font-family="'Noto Sans SC',sans-serif">${t}</text>`;
        s += `<rect x="${x + 16}" y="86" width="134" height="16" rx="4" fill="#FFFDF9"/>`;
        s += `<text x="${x + 16}" y="122" font-size="10.5" fill="#3F3B37" font-family="'Noto Sans SC',sans-serif">${sub}</text>`;
      });
      s += `<text x="203" y="162" text-anchor="middle" font-size="11" fill="#3F3B37" font-family="'Noto Sans SC',sans-serif">两块浅底色把六项表单干脆切分成两个任务模块</text>`;
      svgEl.innerHTML = s;
    }
  }

  function render() {
    const data = ERAS[active];
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.era === active)));
    titleEl.textContent = data.title;
    citeEl.textContent = data.cite;
    descEl.textContent = data.desc;
    actionBtn.hidden = !data.hasToggle;
    if (data.hasToggle) {
      actionBtn.textContent = palmerFence ? "掀开 1992 椭圆边界" : "盖回 1992 椭圆边界";
      actionBtn.setAttribute("aria-pressed", String(palmerFence));
    }
    renderSvg();
  }

  tabs.forEach((b) => b.addEventListener("click", () => { active = b.dataset.era; render(); }));
  actionBtn.addEventListener("click", () => { palmerFence = !palmerFence; render(); });
  render();
}

// ---------- 03 节（深海蓝暗室）：五种划区手段轻重谱 + 浅/暗背景对照 ----------
function initS3BoundarySpectrum() {
  const root = document.getElementById("s3-spectrum");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-spec]")];
  const envBtn = root.querySelector("#s3-env-toggle");
  const stage = root.querySelector("#s3-stage");
  const titleEl = root.querySelector("#s3-title");
  const strengthEl = root.querySelector("#s3-strength");
  const noiseEl = root.querySelector("#s3-noise");
  const noteEl = root.querySelector("#s3-note");

  let spec = "tint";
  let darkEnv = false;

  const SPECS = {
    space: {
      title: "仅靠留白（邻近性基准）",
      strength: "偏弱（依赖整齐结构）",
      noise: "最低（零额外墨水）",
      lightNote: "完全不画框、不铺底，全靠加大组外留白。条目简短规整时极优雅；但只要左右长短参差、或同一项内出现次级按钮，分组边界就会发虚。",
      darkNote: "暗色背景下同样零噪音，但一旦横向跨度拉大，纯留白很难阻止上下行产生视觉串门。",
    },
    tint: {
      title: "低饱和底色差（120 原海报首选）",
      strength: "强且自然",
      noise: "很低（无硬线切割）",
      lightNote: "在暖象牙纸上铺 4%–12% 亮度差的柔和粉彩底块（如 120 原海报的暖米砂/柔樱粉），不添一条黑框线就立起了清晰容器，最适合现代卡片与表单。",
      darkNote: "暗色模式下最稳妥的手段！将卡片背景比深底提亮一级（如 #0B1D42 → #17336B），靠明度阶梯建立共同区域，不靠阴影也能一目了然。",
    },
    accent: {
      title: "单侧引导色条（借 118 闭合性脑补）",
      strength: "中等偏强",
      noise: "较低（仅一条边）",
      lightNote: "只在左侧放一道 4px 彩色竖杠（正如 120 原海报总述区左侧的朱橘竖线），大脑借闭合性原则自动补全隐形矩形，兼顾轻盈与扫描速度。",
      darkNote: "在暗色界面里用亮橘与亮绿竖杠区分模块，对比醒目、几乎不占横向宽度，很适合通知与日志流。",
    },
    border: {
      title: "1px 细实线 / 虚线描边",
      strength: "强（硬边界明确）",
      noise: "中等（多条卡片时易显密）",
      lightNote: "不铺底色、用细框明确边界，适合白底套白底的卡片、打印表单或高对比无障碍模式。切忌把线加粗到 2–3px 实黑，否则迅速滑向牢笼感。",
      darkNote: "暗色模式里用低透明浅色细描边（而非黑线）可以精准勾出边界，但多卡并排时建议把线色压柔和。",
    },
    shadow: {
      title: "柔和投影抬升（海拔感）",
      strength: "浅底强 / 暗底失效！",
      noise: "低（视觉轻盈）",
      lightNote: "浅色界面里，柔和底阴影借 119 图底关系把白卡托离浅灰底面，仿佛漂浮的纸片。非常适合需要区分可点击层级的主卡片。",
      darkNote: "注意暗色模式陷阱！黑色阴影落在深海蓝暗底上几乎完全隐身，两张卡片立刻失去共同区域边界——暗色 UI 必须改用「表面提亮」或「细浅边」替代阴影。",
    },
  };

  function render() {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.spec === spec)));
    envBtn.setAttribute("aria-pressed", String(darkEnv));
    envBtn.textContent = darkEnv ? "当前：暗色界面环境（点切浅色）" : "当前：浅色界面环境（点切暗色）";
    stage.dataset.spec = spec;
    stage.dataset.env = darkEnv ? "dark" : "light";

    const d = SPECS[spec];
    titleEl.textContent = d.title;
    strengthEl.textContent = d.strength;
    noiseEl.textContent = d.noise;
    noteEl.textContent = darkEnv ? d.darkNote : d.lightNote;
  }

  btns.forEach((b) => b.addEventListener("click", () => { spec = b.dataset.spec; render(); }));
  envBtn.addEventListener("click", () => { darkEnv = !darkEnv; render(); });
  render();
}

// ---------- 04 节：3 个真实 UI 冲突诊室原地修复 ----------
function initS4UiClinics() {
  const cards = [...document.querySelectorAll("[data-clinic]")];
  cards.forEach((card) => {
    const btn = card.querySelector("[data-clinic-toggle]");
    const status = card.querySelector("[data-clinic-status]");
    const note = card.querySelector("[data-clinic-note]");
    const badText = note.dataset.bad;
    const goodText = note.dataset.good;

    let fixed = false;
    function sync() {
      card.dataset.fixed = String(fixed);
      btn.setAttribute("aria-pressed", String(fixed));
      btn.textContent = fixed ? "撤掉共同区域（看失序原稿）" : "加上共同区域（看修复结果）";
      status.textContent = fixed ? "已用共同区域理顺" : "未加共同区域 · 归属串门";
      note.textContent = fixed ? goodText : badText;
    }
    btn.addEventListener("click", () => { fixed = !fixed; sync(); });
    sync();
  });
}

// ---------- 05 节：390px 手机「剥洋葱削框」真实像素核算 ----------
function initS5OnionPeeler() {
  const root = document.getElementById("s5-onion");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-nest]")];
  const shell = root.querySelector("#s5-phone-shell");
  const wEl = root.querySelector("#s5-width");
  const pctEl = root.querySelector("#s5-pct");
  const linesEl = root.querySelector("#s5-lines");
  const tagEl = root.querySelector("#s5-tag");
  const verdictEl = root.querySelector("#s5-verdict");
  const barFill = root.querySelector("#s5-bar-fill");

  let level = 4;

  function render() {
    const m = computeNestingDemo(level);
    btns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.nest) === level)));
    shell.dataset.nest = String(level);
    wEl.textContent = `${m.contentW}px`;
    pctEl.textContent = `占 390px 屏宽 ${m.ratioPct}%`;
    linesEl.textContent = `${m.borderLines} 条`;
    tagEl.textContent = m.tag;
    tagEl.dataset.tone = m.badgeType;
    verdictEl.textContent = m.verdict;
    barFill.style.width = `${m.ratioPct}%`;
  }

  btns.forEach((b) => b.addEventListener("click", () => { level = Number(b.dataset.nest); render(); }));
  render();
}

// ---------- 06 节：小练习四选一 ----------
function initS6Quiz() {
  const root = document.getElementById("s6-quiz");
  if (!root) return;
  const opts = [...root.querySelectorAll("[data-opt]")];
  const vBox = root.querySelector("#s6-verdict");
  const vTitle = root.querySelector("#s6-v-title");
  const vBody = root.querySelector("#s6-v-body");

  const FEEDBACK = {
    A: {
      ok: false,
      title: "A 不是最稳妥的一版——少了共同区域，距离反客为主",
      body: "四版文字、字号、间距完全一致：同行三项横隔 112px，而上午场与下午场上下只隔 24px。A 版没有任何底色或边界托底，人眼被 116 邻近性拉成三竖列（时间列 / 主题列 / 讲者列），必须逐行核对才能知道谁在上午场。正确答案是 C。",
    },
    B: {
      ok: false,
      title: "B 踩进了「逐项加框牢笼」——反而把一场拆散成三格",
      body: "B 给 6 个独立单元格都套上了 2px 硬黑框（24 条非数据边线），每一小块都被划成各自独立的共同区域。结果上下两场的归属非但没变清晰，6 格平权加粗黑框还制造了刺眼的视觉噪音。正确答案是 C。",
    },
    C: {
      ok: true,
      title: "选对了！C 用两道柔和粉彩底框，零噪音赢过 4.7× 距差",
      body: "尽管同行三项横距（112px）远大于上下场次间距（24px），C 版只用两块柔和粉彩圆角底色（零硬黑框、中间留清缝）就立起了两个独立的共同区域——视觉立刻按上午场、下午场两横排收编，同时保持极高的数据墨水比。",
    },
    D: {
      ok: false,
      title: "D 制造了「虚假合并」——一个大框抹平了两场边界",
      body: "D 用粗线大框把上午场和下午场全部 6 项统统包进了同一个共同区域。视觉上它们成了一个不可分的整体，读者在框内仍然只能靠 24px 窄竖距去猜，结果又被拉回三竖列。正确答案是 C。",
    },
  };

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.opt;
      root.dataset.answered = "true";
      opts.forEach((o) => {
        const key = o.dataset.opt;
        o.setAttribute("aria-pressed", String(key === choice));
        o.dataset.state = key === "C" ? "correct" : key === choice ? "wrong" : "dim";
      });
      const fb = FEEDBACK[choice];
      vBox.dataset.state = fb.ok ? "ok" : "err";
      vTitle.textContent = fb.title;
      vBody.textContent = fb.body;
    });
  });
}

// ---------- 07 节：原海报灯箱（放大、拖动、Esc 关闭） ----------
function initS7PosterLightbox() {
  const trigger = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const stage = document.getElementById("poster-modal-stage");
  const closeBtn = document.getElementById("poster-modal-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  if (!trigger || !modal || !posterImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    modalImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) closeModal();
  });

  zoomInBtn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = Math.max(0.8, Math.min(3, +(scale + delta).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  modalImg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    modalImg.setPointerCapture(e.pointerId);
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => { dragging = false; });
  modalImg.addEventListener("pointercancel", () => { dragging = false; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}
