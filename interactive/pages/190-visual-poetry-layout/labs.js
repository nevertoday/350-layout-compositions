import { reducedMotion } from "../../lib/stage.js";

export function initLabs() {
  initMorphLab();
  initHistoryLab();
  initCadenceLab();
  initCompareLab();
  initStressLab();
  initQuizLab();
  initPosterDialog();
}

/* ==================== 01 节：三诗活字变形台 ==================== */
function initMorphLab() {
  const stage = document.getElementById("morph-stage");
  const cap = document.getElementById("morph-cap");
  const modeBtn = document.getElementById("btn-morph-mode");
  const poemBtns = [...document.querySelectorAll("[data-morph-poem]")];

  const POEMS = {
    pagoda: {
      caption:
        "唐代元稹《一字至七字诗·茶》：不添一笔线条，仅凭每行字数由一递增至七、居中叠落，字阵自己立成一座宝塔。",
      plainCap:
        "切回普通左对齐正文：字词一个不少，但「一至七字递进」的塔形意象立刻消失，只剩一段七行诗句。",
      lines: [
        { text: "茶。", style: "text-align:center; letter-spacing:0.12em;" },
        { text: "香叶，嫩芽。", style: "text-align:center; letter-spacing:0.10em;" },
        { text: "慕诗客，爱僧家。", style: "text-align:center; letter-spacing:0.08em;" },
        { text: "碾雕白玉，罗织红纱。", style: "text-align:center; letter-spacing:0.06em;" },
        { text: "铫煎黄蕊色，碗转曲尘花。", style: "text-align:center; letter-spacing:0.05em;" },
        { text: "夜后邀陪明月，晨前独对朝霞。", style: "text-align:center; letter-spacing:0.03em;" },
        { text: "洗尽古今人不倦，将知醉后岂堪夸。", style: "text-align:center; letter-spacing:0.02em;" },
      ],
    },
    rain: {
      caption:
        "《斜雨·听窗》：五句向右下方梯次错落并轻微倾斜，字距由密渐疏——视线像跟着屋檐滑落的雨丝一路下坠。",
      plainCap:
        "切回普通左对齐正文：同样五句写雨，排齐之后失去了「斜落」和「由密渐散」的物理速度感。",
      lines: [
        { text: "细雨斜斜划过窗沿", style: "padding-left:6%; letter-spacing:0.04em; transform:rotate(5deg);" },
        { text: "敲醒檐下旧时名字", style: "padding-left:15%; letter-spacing:0.09em; transform:rotate(6deg);" },
        { text: "每一滴都带着回声", style: "padding-left:24%; letter-spacing:0.14em; transform:rotate(7deg);" },
        { text: "落在石阶 散成停顿", style: "padding-left:31%; letter-spacing:0.18em; transform:rotate(5deg);" },
        { text: "听  那场远去的雨", style: "padding-left:40%; letter-spacing:0.24em; transform:rotate(3deg);" },
      ],
    },
    wings: {
      caption:
        "《双翼·升降》：化用 1633 年赫伯特《复活节之翼》的「由宽收窄、再由窄展宽」结构，最窄的「最轻」正好落在振翅转折点。",
      plainCap:
        "切回普通左对齐正文：句意仍在讲坠落与扬起，但版面平直如箱，失去了呼吸收束再张开的体感。",
      lines: [
        { text: "曾经乘着长风越过整片寂静山谷", style: "text-align:center; letter-spacing:0.02em;" },
        { text: "后来羽毛沾湿 渐渐沉向微凉雾气", style: "text-align:center; letter-spacing:0.03em;" },
        { text: "越飞越低 几乎碰见地面", style: "text-align:center; letter-spacing:0.06em;" },
        { text: "只剩一口微弱喘息", style: "text-align:center; letter-spacing:0.08em;" },
        { text: "最轻", style: "text-align:center; letter-spacing:0.28em; font-weight:700;" },
        { text: "借一点风", style: "text-align:center; letter-spacing:0.16em;" },
        { text: "把折翼慢慢重新舒展", style: "text-align:center; letter-spacing:0.06em;" },
        { text: "再一次越过云影 听见远处天光", style: "text-align:center; letter-spacing:0.02em;" },
      ],
    },
  };

  let curPoem = "pagoda";
  let shaped = true;

  function render() {
    const p = POEMS[curPoem];
    stage.dataset.shaped = String(shaped);
    stage.innerHTML = p.lines
      .map((l) => `<p class="morph-line" style="${l.style}">${l.text}</p>`)
      .join("");
    modeBtn.setAttribute("aria-pressed", String(shaped));
    modeBtn.textContent = shaped ? "当前：图形诗" : "当前：普通正文";
    cap.textContent = shaped ? p.caption : p.plainCap;
    poemBtns.forEach((b) => {
      const on = b.dataset.morphPoem === curPoem;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  poemBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curPoem = b.dataset.morphPoem;
      render();
    })
  );
  modeBtn.addEventListener("click", () => {
    shaped = !shaped;
    render();
  });
  render();
}

/* ==================== 02 节：历史书页标本切片台 ==================== */
function initHistoryLab() {
  const spread = document.getElementById("hist-spread");
  const tag = document.getElementById("hist-tag");
  const title = document.getElementById("hist-title");
  const desc = document.getElementById("hist-desc");
  const source = document.getElementById("hist-source");
  const tabs = [...document.querySelectorAll("[data-hist]")];

  const ITEMS = {
    simias: {
      tag: "约公元前 300 年 · 古希腊",
      title: "罗德岛的西米亚斯《翼》等象形诗",
      desc: "存世最早的一批西洋象形诗（希腊文称 technopaegnia），收录于《希腊诗选》。西米亚斯借诗行音步逐行收短再放长，让文字在卷轴上直接排成双翼、斧头与鸟卵轮廓，开启两千年象形诗传统。",
      source: "文献线索：《希腊诗选》（Greek Anthology）；拉丁传统称 carmina figurata。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="古希腊象形诗《翼》对称收窄版式示意">
        <rect x="14" y="12" width="332" height="196" fill="#FAF4E2" stroke="#120F0A" stroke-width="1.2"/>
        <g stroke="#120F0A" stroke-linecap="round">
          <line x1="44" y1="42" x2="316" y2="42" stroke-width="5"/>
          <line x1="68" y1="60" x2="292" y2="60" stroke-width="4.5"/>
          <line x1="94" y1="78" x2="266" y2="78" stroke-width="4"/>
          <line x1="126" y1="96" x2="234" y2="96" stroke-width="3.5"/>
          <line x1="154" y1="112" x2="206" y2="112" stroke-width="3" stroke="#823306"/>
          <line x1="126" y1="128" x2="234" y2="128" stroke-width="3.5"/>
          <line x1="94" y1="146" x2="266" y2="146" stroke-width="4"/>
          <line x1="68" y1="164" x2="292" y2="164" stroke-width="4.5"/>
          <line x1="44" y1="182" x2="316" y2="182" stroke-width="5"/>
        </g>
        <text x="180" y="28" text-anchor="middle" font-size="11" fill="#463D2F">WINGS OF EROS · 音步长短构成双翼</text>
      </svg>`,
    },
    suhui: {
      tag: "4 世纪（前秦）· 中国",
      title: "苏蕙五色织锦《璇玑图》",
      desc: "《晋书·列女传》记窦滔妻苏蕙以五色丝织锦寄夫，原载八百四十字，后世传本常于正中加「心」字成 29×29 方阵。读者可横读、竖读、斜读、回环读，在二维网格里走不同路径读出不同诗篇。",
      source: "文献线索：《晋书·卷九十六·列女传·窦滔妻苏氏》及唐武则天《璇玑图序》。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="苏蕙《璇玑图》方阵与多向回文路径示意">
        <rect x="85" y="15" width="190" height="190" fill="#FAF4E2" stroke="#120F0A" stroke-width="1.4"/>
        <g stroke="rgba(18,15,10,0.22)" stroke-width="1">
          <path d="M112 15V205 M139 15V205 M166 15V205 M194 15V205 M221 15V205 M248 15V205"/>
          <path d="M85 42H275 M85 69H275 M85 96H275 M85 124H275 M85 151H275 M85 178H275"/>
        </g>
        <rect x="166" y="96" width="28" height="28" fill="#F2B72C"/>
        <text x="180" y="115" text-anchor="middle" font-size="15" font-weight="900" fill="#120F0A">心</text>
        <path d="M98 28 H262 V192 H98 Z" fill="none" stroke="#823306" stroke-width="2" stroke-dasharray="5 3"/>
        <path d="M112 42 L248 178 M248 42 L112 178" fill="none" stroke="#1B5530" stroke-width="1.6" stroke-dasharray="3 3"/>
        <text x="42" y="112" text-anchor="middle" font-size="11" fill="#823306">外框旋读</text>
        <text x="318" y="112" text-anchor="middle" font-size="11" fill="#1B5530">斜径回文</text>
      </svg>`,
    },
    yuanzhen: {
      tag: "唐代长庆四年（824 年）· 洛阳",
      title: "元稹《一字至七字诗·茶》（宝塔诗）",
      desc: "中唐文人洛阳雅集唱和「一字至七字诗」，元稹以「茶」字起尖，以下两两对仗逐层加字，至底行七言收基。不需要任何图画装饰，汉字方阵天然叠成一座端稳宝塔。",
      source: "文献线索：《全唐诗》元稹《一字至七字诗·茶》（亦称《一七令·茶》）。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="唐代元稹宝塔诗《茶》一至七字阶梯示意">
        <rect x="14" y="10" width="332" height="200" fill="#F2B72C" stroke="#120F0A" stroke-width="1.2"/>
        <g text-anchor="middle" fill="#120F0A" font-family="LXGW WenKai, Noto Serif SC, serif" font-size="14">
          <text x="180" y="38" font-weight="700">茶。</text>
          <text x="180" y="62">香叶，嫩芽。</text>
          <text x="180" y="86">慕诗客，爱僧家。</text>
          <text x="180" y="110">碾雕白玉，罗织红纱。</text>
          <text x="180" y="134">铫煎黄蕊色，碗转曲尘花。</text>
          <text x="180" y="158">夜后邀陪明月，晨前独对朝霞。</text>
          <text x="180" y="182">洗尽古今人不倦，将知醉后岂堪夸。</text>
        </g>
      </svg>`,
    },
    herbert: {
      tag: "1633 年 · 英国剑桥",
      title: "乔治·赫伯特《复活节之翼》（Easter Wings）",
      desc: "收录于遗作诗集《圣殿》（The Temple）。1633 年初版特意将两节诗横印在左右对页上，每节由宽逐行缩至「Most poore / Most thinne」两词再张开，直观映照人的衰落与展翼复起。",
      source: "文献线索：George Herbert, The Temple (Cambridge, 1633), Poetry Foundation。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1633年赫伯特《复活节之翼》跨页双翼横印示意">
        <rect x="18" y="16" width="160" height="188" fill="#FAF4E2" stroke="#120F0A" stroke-width="1.2"/>
        <rect x="182" y="16" width="160" height="188" fill="#FAF4E2" stroke="#120F0A" stroke-width="1.2"/>
        <line x1="180" y1="14" x2="180" y2="206" stroke="#823306" stroke-dasharray="4 3"/>
        <g fill="#120F0A">
          <rect x="34" y="34" width="128" height="7"/><rect x="48" y="50" width="100" height="7"/>
          <rect x="64" y="66" width="68" height="7"/><rect x="80" y="82" width="36" height="7"/>
          <rect x="88" y="98" width="20" height="7" fill="#823306"/>
          <rect x="80" y="114" width="36" height="7"/><rect x="64" y="130" width="68" height="7"/>
          <rect x="48" y="146" width="100" height="7"/><rect x="34" y="162" width="128" height="7"/>
          <rect x="198" y="34" width="128" height="7"/><rect x="212" y="50" width="100" height="7"/>
          <rect x="228" y="66" width="68" height="7"/><rect x="244" y="82" width="36" height="7"/>
          <rect x="252" y="98" width="20" height="7" fill="#823306"/>
          <rect x="244" y="114" width="36" height="7"/><rect x="228" y="130" width="68" height="7"/>
          <rect x="212" y="146" width="100" height="7"/><rect x="198" y="162" width="128" height="7"/>
        </g>
        <text x="180" y="194" text-anchor="middle" font-size="11" fill="#463D2F">1633 初版对页横排 · 中段缩窄至两词</text>
      </svg>`,
    },
    carroll: {
      tag: "1865 年 · 英国",
      title: "刘易斯·卡罗尔《老鼠的尾巴/故事》",
      desc: "出自《爱丽丝梦游仙境》第三章。借英语里 tale（故事）与 tail（尾巴）的同音双关，爱丽丝把老鼠讲的故事想象成一条逐行缩小、左摇右摆的细长尾巴，成为大众最熟知的图形诗之一。",
      source: "文献线索：Lewis Carroll, Alice's Adventures in Wonderland (1865), Chapter III。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1865年卡罗尔《老鼠的尾巴》逐行缩小蜿蜒排布示意">
        <rect x="18" y="12" width="324" height="196" fill="#FAF4E2" stroke="#120F0A" stroke-width="1.2"/>
        <path d="M132 34 C196 58 106 94 176 124 C236 150 144 174 198 194" fill="none" stroke="rgba(130,51,6,0.28)" stroke-width="1.5" stroke-dasharray="3 3"/>
        <g fill="#120F0A" font-family="Outfit, sans-serif">
          <text x="118" y="42" font-size="15" font-weight="600">Fury said to a mouse,</text>
          <text x="148" y="64" font-size="13.5">That he met in the house,</text>
          <text x="128" y="86" font-size="12">Let us both go to law:</text>
          <text x="114" y="108" font-size="11">I will prosecute you.—</text>
          <text x="148" y="128" font-size="10.5">Come, I'll take no denial;</text>
          <text x="174" y="148" font-size="10">We must have a trial:</text>
          <text x="150" y="168" font-size="10">I'll be judge, I'll be jury,</text>
          <text x="170" y="188" font-size="10" fill="#823306">and condemn you to death.</text>
        </g>
      </svg>`,
    },
    mallarme: {
      tag: "1897 年 5 月 · 巴黎",
      title: "马拉美《骰子一掷永不能取消偶然》",
      desc: "首刊于杂志《大都会》（Cosmopolis），1914 年独立成书。马拉美不再把文字拼成具体物体，而是把跨页当作音乐总谱——大号全大写跨越中缝、小号斜体漂浮海面，大片空白就是沉默的休止符。",
      source: "文献线索：Stéphane Mallarmé, Cosmopolis Vol. 6 No. 17 (1897) / 1914 书版。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1897年马拉美《骰子一掷》跨页留白总谱示意">
        <rect x="16" y="16" width="162" height="188" fill="#FFFDF6" stroke="#120F0A" stroke-width="1.2"/>
        <rect x="182" y="16" width="162" height="188" fill="#FFFDF6" stroke="#120F0A" stroke-width="1.2"/>
        <text x="34" y="54" font-family="Outfit, sans-serif" font-size="17" font-weight="700" letter-spacing="2" fill="#120F0A">UN COUP DE DÉS</text>
        <text x="110" y="98" font-family="Outfit, sans-serif" font-size="11" fill="#463D2F">quand bien même lancé</text>
        <text x="208" y="124" font-family="Outfit, sans-serif" font-size="16" font-weight="700" letter-spacing="2" fill="#823306">JAMAIS</text>
        <text x="218" y="158" font-family="Outfit, sans-serif" font-size="11" fill="#463D2F">du fond d'un naufrage</text>
        <text x="234" y="186" font-family="Outfit, sans-serif" font-size="13" font-weight="700" fill="#120F0A">LE HASARD</text>
      </svg>`,
    },
    apollinaire: {
      tag: "1918 年 · 巴黎法兰西水星社",
      title: "阿波利奈尔《图画诗》（Calligrammes）",
      desc: "阿波利奈尔把「书法（calligraphie）」与「表意符号（idéogramme）」合造为 Calligrammes。其中名篇《下雨了》（Il pleut，1916 年先刊于杂志 SIC）用五条斜落的法文字列，直接让读者看见窗外斜雨。",
      source: "文献线索：Guillaume Apollinaire, Calligrammes (Mercure de France, 1918)；MoMA 藏本。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1918年阿波利奈尔《下雨了》五列斜落雨丝示意">
        <rect x="18" y="12" width="324" height="196" fill="#F2B72C" stroke="#120F0A" stroke-width="1.2"/>
        <g fill="#120F0A" font-family="Outfit, sans-serif" font-size="11" letter-spacing="2.2">
          <text x="86" y="34" transform="rotate(64 86 34)">il pleut des voix de femmes</text>
          <text x="142" y="28" transform="rotate(64 142 28)">c'est vous aussi qu'il pleut</text>
          <text x="198" y="38" transform="rotate(64 198 38)">et ces nuages cabrés</text>
          <text x="250" y="30" transform="rotate(64 250 30)">écoute s'il pleut tandis</text>
          <text x="294" y="42" transform="rotate(64 294 42)">écoute tomber les liens</text>
        </g>
      </svg>`,
    },
    concrete: {
      tag: "1954–1958 年 · 瑞士与巴西",
      title: "贡林格《Silencio》与巴西诺伊甘德雷斯小组",
      desc: "1954 年欧根·贡林格（Eugen Gomringer）将西班牙语 silencio（沉默）重复 14 次排成 5×3 方阵，唯独把正中央一格留空——「空白本身就是沉默」。1958 年巴西 Noigandres 小组发表《具象诗先导计划》，确立现代空间结构诗学。",
      source: "文献线索：Eugen Gomringer (1954)；Noigandres No. 4《Plano-Piloto》(1958)，Britannica。",
      svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1954年贡林格《Silencio》14词围出中心留白示意">
        <rect x="18" y="12" width="324" height="196" fill="#FAF4E2" stroke="#120F0A" stroke-width="1.2"/>
        <g fill="#120F0A" font-family="IBM Plex Mono, monospace" font-size="13.5" text-anchor="middle">
          <text x="92" y="54">silencio</text><text x="180" y="54">silencio</text><text x="268" y="54">silencio</text>
          <text x="92" y="84">silencio</text><text x="180" y="84">silencio</text><text x="268" y="84">silencio</text>
          <text x="92" y="114">silencio</text>
          <rect x="142" y="98" width="76" height="22" fill="none" stroke="#823306" stroke-dasharray="4 3"/>
          <text x="268" y="114">silencio</text>
          <text x="92" y="144">silencio</text><text x="180" y="144">silencio</text><text x="268" y="144">silencio</text>
          <text x="92" y="174">silencio</text><text x="180" y="174">silencio</text><text x="268" y="174">silencio</text>
        </g>
        <text x="180" y="198" text-anchor="middle" font-size="11" fill="#823306">14 个 silencio 围出正中空洞——空即沉默本身</text>
      </svg>`,
    },
  };

  function select(key) {
    const item = ITEMS[key];
    if (!item) return;
    tag.textContent = item.tag;
    title.textContent = item.title;
    desc.textContent = item.desc;
    source.textContent = item.source;
    spread.innerHTML = item.svg;
    tabs.forEach((b) => {
      const on = b.dataset.hist === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((b) => b.addEventListener("click", () => select(b.dataset.hist)));
  select("simias");
}

/* ==================== 03 节：深墨研石 · 诵读节拍仪 ==================== */
function initCadenceLab() {
  const sheet = document.getElementById("cadence-sheet");
  const restOut = document.getElementById("cadence-rests");
  const noteEl = document.getElementById("cadence-note");
  const playBtn = document.getElementById("btn-cadence-play");
  const presetBtns = [...document.querySelectorAll("[data-cadence]")];

  const LINES = ["风过石阶", "落叶停了一拍", "远山不语", "光慢慢退潮"];
  const PRESETS = {
    even: {
      indents: [0, 0, 0, 0],
      rests: new Set(),
      note: "全部等距平排：没有一处视觉停顿，四句会以匀速一口气滑过，少了诗的回声。",
    },
    breath: {
      indents: [2, 10, 18, 28],
      rests: new Set(["0-1", "1-1", "2-1", "3-0", "3-2"]),
      note: "字间空隙拉开后，关键意象（「停」「不语」「退潮」）前自然长出呼吸停顿，情绪比等距平排沉静得多。",
    },
    cascade: {
      indents: [0, 14, 30, 44],
      rests: new Set(["1-2", "2-1", "3-0", "3-1", "3-2", "3-3"]),
      note: "行首逐级右移、末句字字拉开：越往后读得越慢，像黄昏退潮时脚步一步步放轻。",
    },
  };

  let curPreset = "breath";
  let rests = new Set(PRESETS.breath.rests);
  let indents = [...PRESETS.breath.indents];
  let timers = [];

  function stopPlay() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    sheet.querySelectorAll(".is-lit, .is-lit-gap").forEach((el) => {
      el.classList.remove("is-lit", "is-lit-gap");
    });
    playBtn.textContent = "按版面默读一遍";
  }

  function updateSummary(custom) {
    const restCount = rests.size;
    const totalChars = LINES.reduce((s, l) => s + l.length, 0);
    // 示意默读时长：每字 0.19s，每行换行 0.28s，每处空间空拍额外停顿 0.42s
    const sec = (totalChars * 0.19 + (LINES.length - 1) * 0.28 + restCount * 0.42).toFixed(1);
    restOut.textContent = `${restCount} 处空拍 · 默读约 ${sec} 秒（示意）`;
    if (custom) {
      noteEl.textContent =
        restCount === 0
          ? "现在零空拍：视线一路直滑过去，语气急促，几乎没有留给意象发酵的停顿。"
          : restCount >= 8
          ? `已插入 ${restCount} 处空拍：停顿极多，每读一两字便顿一下，近乎缓慢低吟；再多就容易把句子拆碎。`
          : `已自订 ${restCount} 处空间休止：点击「按版面默读一遍」，感受留白宽窄如何直接改变阅读速度。`;
    }
  }

  function render() {
    stopPlay();
    sheet.innerHTML = "";
    LINES.forEach((line, r) => {
      const row = document.createElement("div");
      row.className = "cad-row";
      row.style.setProperty("--ind", `${Math.min(indents[r], 36)}%`);
      const chars = [...line];
      chars.forEach((ch, c) => {
        const span = document.createElement("span");
        span.className = "cad-ch";
        span.dataset.pos = `${r}-${c}`;
        span.textContent = ch;
        row.appendChild(span);

        if (c < chars.length - 1) {
          const key = `${r}-${c}`;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = `cad-gap${rests.has(key) ? " is-rest" : ""}`;
          btn.dataset.gap = key;
          btn.setAttribute("aria-pressed", String(rests.has(key)));
          btn.setAttribute("aria-label", `在「${ch}」与「${chars[c + 1]}」之间${rests.has(key) ? "收回" : "插入"}留白停顿`);
          btn.textContent = rests.has(key) ? "— 拍 —" : "·";
          btn.addEventListener("click", () => {
            stopPlay();
            if (rests.has(key)) rests.delete(key);
            else rests.add(key);
            btn.classList.toggle("is-rest", rests.has(key));
            btn.setAttribute("aria-pressed", String(rests.has(key)));
            btn.textContent = rests.has(key) ? "— 拍 —" : "·";
            presetBtns.forEach((p) => {
              p.classList.remove("is-active");
              p.setAttribute("aria-pressed", "false");
            });
            updateSummary(true);
          });
          row.appendChild(btn);
        }
      });
      sheet.appendChild(row);
    });
    updateSummary(false);
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      curPreset = btn.dataset.cadence;
      const p = PRESETS[curPreset];
      rests = new Set(p.rests);
      indents = [...p.indents];
      noteEl.textContent = p.note;
      presetBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  playBtn.addEventListener("click", () => {
    if (timers.length) {
      stopPlay();
      return;
    }
    if (reducedMotion.matches) {
      // 减少动态效果下直接高亮所有空拍位置说明
      sheet.querySelectorAll(".cad-gap.is-rest").forEach((g) => g.classList.add("is-lit-gap"));
      return;
    }
    playBtn.textContent = "停止默读";
    let t = 0;
    LINES.forEach((line, r) => {
      const chars = [...line];
      chars.forEach((_, c) => {
        const chEl = sheet.querySelector(`.cad-ch[data-pos="${r}-${c}"]`);
        const onAt = t;
        timers.push(
          setTimeout(() => {
            sheet.querySelectorAll(".is-lit, .is-lit-gap").forEach((x) => x.classList.remove("is-lit", "is-lit-gap"));
            if (chEl) chEl.classList.add("is-lit");
          }, onAt)
        );
        t += 190;
        if (c < chars.length - 1 && rests.has(`${r}-${c}`)) {
          const gapEl = sheet.querySelector(`.cad-gap[data-gap="${r}-${c}"]`);
          const gAt = t;
          timers.push(
            setTimeout(() => {
              if (gapEl) gapEl.classList.add("is-lit-gap");
            }, gAt)
          );
          t += 420;
        }
      });
      t += 260;
    });
    timers.push(setTimeout(stopPlay, t + 180));
  });

  render();
}

/* ==================== 04 节：脱壳剥离对照镜 ==================== */
function initCompareLab() {
  const chk = document.getElementById("chk-strip-shell");
  const grid = document.getElementById("compare-grid");
  const hint = document.getElementById("compare-hint");
  chk.addEventListener("change", () => {
    const stripped = chk.checked;
    grid.dataset.stripped = String(stripped);
    hint.textContent = stripped
      ? "辅助壳与参考线已全部抽掉：189 靠满填字块撑轮廓，191 剩一条弯带，只有 190 靠多行坡势、曲流与留白自己站成完整画面。"
      : "当前显示辅助图形与参考线——勾选试试看剥离后谁还成立。";
  });
}

/* ==================== 05 节：四场景翻车试纸 ==================== */
function initStressLab() {
  const preview = document.getElementById("stress-preview");
  const badge = document.getElementById("stress-badge");
  const scan = document.getElementById("stress-scan");
  const title = document.getElementById("stress-title");
  const desc = document.getElementById("stress-desc");
  const btns = [...document.querySelectorAll("[data-scene]")];

  const SCENES = {
    exhibition: {
      ok: true,
      badge: "适用 · 主视觉",
      scan: "预期心境：愿意驻足 3–5 秒细品",
      title: "字少、情绪浓、留白充裕，图形诗直击第一眼",
      desc: "诗歌与艺术展海报天生要人慢下来。把寥寥几句诗排成风势或山影当主视觉，时间与展馆地址老老实实归到底角正排——诗意归诗意，功能信息归功能信息。",
      poeticHtml: `<p class="sp-kicker">图形诗排法</p>
        <div class="sp-body" style="padding:6px 0">
          <div style="text-align:right; letter-spacing:0.22em; transform:rotate(6deg)">风 从 远 方 来</div>
          <div style="text-align:center; letter-spacing:0.12em; margin-top:14px">在 石 上 呼 吸</div>
          <div style="font-size:11px; margin-top:26px; font-family:var(--font-serif)">秋日诗展 · 10.12–11.08 · 南岸美术馆</div>
        </div>
        <p class="sp-foot">远看成景，近看可读</p>`,
      plainHtml: `<p class="sp-kicker">常规齐头排法</p>
        <div class="sp-body">
          <div style="font-weight:700; font-size:16px">秋日诗展</div>
          <div style="margin-top:8px">风从远方来，在石上呼吸。</div>
          <div style="font-size:12px; margin-top:16px; color:var(--ink-muted)">时间：10 月 12 日—11 月 8 日<br>地点：南岸美术馆</div>
        </div>
        <p class="sp-foot">信息清楚，但缺少诗展记忆点</p>`,
    },
    book: {
      ok: true,
      badge: "适用 · 书封 / 扉页",
      scan: "预期心境：把玩封面、建立第一印象",
      title: "文学与诗集封面，文字造型直接预告书的气质",
      desc: "扉页与诗集封面对信息密度要求极低，全页只需书名、作者与一句短引。用字位与留白把「雨」「潮」「夜」先演出来，比套一张风景图库照片高级得多。",
      poeticHtml: `<p class="sp-kicker">图形诗排法</p>
        <div class="sp-body" style="text-align:center; padding:6px 0">
          <div style="letter-spacing:0.4em; font-size:18px; font-weight:700">落 潮</div>
          <div style="margin-top:14px; padding-left:18%; letter-spacing:0.18em; font-size:12.5px">水 向 低 处 流 动</div>
          <div style="margin-top:10px; padding-left:34%; letter-spacing:0.12em; font-size:12px">流 向 更 远</div>
        </div>
        <p class="sp-foot">不配插画也能自带意境</p>`,
      plainHtml: `<p class="sp-kicker">常规齐头排法</p>
        <div class="sp-body">
          <div style="font-size:18px; font-weight:700">落潮</div>
          <div style="margin-top:8px; font-size:13px">水向低处流动，流向更远。</div>
          <div style="margin-top:24px; font-size:12px; color:var(--ink-muted)">当代短诗选</div>
        </div>
        <p class="sp-foot">端正稳妥，但氛围平淡</p>`,
    },
    boarding: {
      ok: false,
      badge: "别用 · 功能翻车",
      scan: "预期心境：赶登机，0.5 秒扫出登机口",
      title: "把登机牌排成飞机轮廓，是在和赶飞机的旅客作对",
      desc: "航班号、登机口 B14、登机时间属于高频检索信息。斜排和阶梯缩进打断了固定的横向扫视坐标，旅客慌乱中找错口或看漏时间，好看一秒、误事一天。",
      poeticHtml: `<p class="sp-kicker">强套图形诗（翻车）</p>
        <div class="sp-body" style="text-align:center; line-height:1.45">
          <div style="font-size:11px; letter-spacing:0.15em">MU5108</div>
          <div style="font-size:12px; transform:rotate(-8deg)">上海虹桥 → 北京首都</div>
          <div style="font-size:11.5px; letter-spacing:0.25em; transform:rotate(6deg)">登机口 B14 · 08:25</div>
          <div style="font-size:11px">座位 14A</div>
        </div>
        <p class="sp-foot">× 关键数字分散倾斜，扫读慢且易看串</p>`,
      plainHtml: `<p class="sp-kicker">常规表格对齐（正确）</p>
        <div class="sp-body" style="font-family:var(--font-mono); font-size:12.5px; line-height:1.7">
          <div><b>航班</b> MU5108 · <b>座位</b> 14A</div>
          <div><b>登机口</b> <span style="background:#120F0A;color:#F2B72C;padding:0 5px">B14</span></div>
          <div><b>登机时间</b> 08:25</div>
          <div>SHA → PEK</div>
        </div>
        <p class="sp-foot">✓ 坐标对齐，半秒定位登机口</p>`,
    },
    medicine: {
      ok: false,
      badge: "别用 · 风险极高",
      scan: "预期心境：生病疲惫，必须零误差核对剂量",
      title: "药品用量玩视觉造型，可能直接造成服药事故",
      desc: "安全提示、禁忌与剂量必须按最保守的左对齐层级与清晰字号呈现。一旦为了造型把「每日一次」和「儿童减半」错位打散，极易漏读或错配。",
      poeticHtml: `<p class="sp-kicker">强套图形诗（翻车）</p>
        <div class="sp-body" style="line-height:1.5">
          <div style="padding-left:32%; transform:rotate(7deg)">每 日 一 次</div>
          <div style="padding-left:8%; letter-spacing:0.18em">成 人 一 片</div>
          <div style="padding-left:42%; font-size:12px">饭 后 温 水</div>
          <div style="padding-left:12%; font-size:11.5px; transform:rotate(-6deg)">儿童及孕妇遵医嘱</div>
        </div>
        <p class="sp-foot">× 读序跳跃，极易漏看禁忌项</p>`,
      plainHtml: `<p class="sp-kicker">常规层级排版（正确）</p>
        <div class="sp-body" style="font-family:var(--font-serif); font-size:13px; line-height:1.65">
          <div><b>用法用量：</b>成人每次 1 片，每日 1 次，饭后温水送服。</div>
          <div style="margin-top:6px; color:#823306"><b>注意：</b>儿童及孕妇须遵医嘱。</div>
        </div>
        <p class="sp-foot">✓ 零歧义，高对比直读</p>`,
    },
  };

  function select(key) {
    const sc = SCENES[key];
    preview.innerHTML = `<div class="sp-box is-poetic">${sc.poeticHtml}</div><div class="sp-box">${sc.plainHtml}</div>`;
    badge.textContent = sc.badge;
    badge.className = `stress-badge${sc.ok ? "" : " is-no"}`;
    scan.textContent = sc.scan;
    title.textContent = sc.title;
    desc.textContent = sc.desc;
    btns.forEach((b) => {
      const on = b.dataset.scene === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.scene)));
  select("exhibition");
}

/* ==================== 06 节：落雪小练习 ==================== */
function initQuizLab() {
  const grid = document.getElementById("quiz-grid");
  const cards = [...grid.querySelectorAll(".quiz-card")];
  const vTitle = document.getElementById("qv-title");
  const vText = document.getElementById("qv-text");

  const FEEDBACK = {
    A: {
      title: "选了 A：压角挤紧，雪落不下来（正解是 B）",
      text: "A 版的字距压得太紧，三行全挤在左下底角，下坠的路径被底边堵死了。虽然上方空很大，但字块本身又闷又沉，演不出「雪落无声」的轻盈与停顿。",
    },
    B: {
      title: "答对了！B 版同时守住了轻落意象、留白与顺读",
      text: "三行自右上向左下缓落，首行字距微开如飘雪，次行温和过渡，末行归平落定；倾角控制在约 12° 内无需歪头，全幅留白约 78%，字句和画面合二为一。",
    },
    C: {
      title: "选了 C：倾角 58° 过陡，造型压过了可读性（正解是 B）",
      text: "C 版的留白位置和 B 接近，但它把三行硬扳到 58° 陡坡——不仅迫使读者歪头读字，急锐的斜刺感也彻底破坏了「无声、微白」的安静情绪。",
    },
    D: {
      title: "选了 D：字距拉到 1.4em，句子散架成孤字（正解是 B）",
      text: "D 版把每个字扯得太远、铺满四边，格式塔接近律失效：眼睛连不成完整诗句，素底留白也被切得支离破碎，失掉了节奏与聚散对比。",
    },
  };

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;
      grid.classList.add("is-revealed");
      cards.forEach((c) => {
        const ch = c.dataset.choice;
        c.classList.remove("is-picked", "is-right", "is-wrong");
        c.setAttribute("aria-pressed", String(ch === choice));
        if (ch === "B") c.classList.add("is-right");
        else if (ch === choice) c.classList.add("is-wrong");
      });
      vTitle.textContent = FEEDBACK[choice].title;
      vText.textContent = FEEDBACK[choice].text;
    });
  });
}

/* ==================== 07 节：原海报放大与平移弹窗 ==================== */
function initPosterDialog() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const dlg = document.getElementById("poster-dialog");
  const vp = document.getElementById("dlg-viewport");
  const dlgImg = document.getElementById("dlg-img");
  const pct = document.getElementById("dlg-pct");
  const btnIn = document.getElementById("dlg-in");
  const btnOut = document.getElementById("dlg-out");
  const btnReset = document.getElementById("dlg-reset");
  const btnClose = document.getElementById("dlg-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function apply() {
    dlgImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    pct.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  }

  openBtn.addEventListener("click", () => {
    if (!dlgImg.src) dlgImg.src = posterImg.src;
    reset();
    dlg.showModal();
  });

  btnIn.addEventListener("click", () => {
    scale = Math.min(2.6, +(scale + 0.3).toFixed(2));
    apply();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.6, +(scale - 0.3).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });
  btnReset.addEventListener("click", reset);
  btnClose.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dlg.open) {
      e.preventDefault();
      dlg.close();
    }
  });

  vp.addEventListener("pointerdown", (e) => {
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY, tx, ty };
    vp.classList.add("is-panning");
    try {
      vp.setPointerCapture(e.pointerId);
    } catch {}
  });
  vp.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = pan.tx + (e.clientX - pan.x);
    ty = pan.ty + (e.clientY - pan.y);
    apply();
  });
  const endPan = (e) => {
    if (!pan || (e && e.pointerId !== pan.id)) return;
    pan = null;
    vp.classList.remove("is-panning");
  };
  vp.addEventListener("pointerup", endPan);
  vp.addEventListener("pointercancel", endPan);
}
