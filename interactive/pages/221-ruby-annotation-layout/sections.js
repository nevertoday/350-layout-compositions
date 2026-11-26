// 221 正文 01–07 节专属交互模块（每节控件互不重复）
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, computeDarkCollision } from "./model.js";

const FONT_CJK = '"Noto Sans SC", sans-serif';
const FONT_MONO = '"DM Mono", monospace';

// ---------- 01 节：5.5pt 铅活字 2:1 模数历史刻度 ----------
const HISTORY_ERAS = {
  british: {
    era: "19 世纪 · 英国活字",
    title: "Ruby 原本不是「注释」，而是 5.5 磅宝石字号",
    basePt: "11 pt（Small Pica）",
    rubyPt: "5.5 pt（Ruby）",
    ratioLabel: "2 : 1 铅身模数",
    ratioVal: 0.5,
    baseGlyph: "A",
    rubyGlyphs: ["r", "u"],
    body: "在点制统一之前，英国铅活字厂习惯用宝石给极小字号起名：Diamond（约 4.5pt）、Pearl（约 5pt）、Ruby（5.5pt）、Emerald（约 6.5pt）。因为 5.5pt 恰好是常规 10–11pt 正文的一半，印刷厂常拿它排夹注与小号音标。",
  },
  meiji: {
    era: "明治时期 · 日本号数活字",
    title: "五号正文（10.5pt）配七号旁注（5.25pt），得名「ルビ」",
    basePt: "五号活字 ≈ 10.5 pt",
    rubyPt: "七号活字 ≈ 5.25 pt",
    ratioLabel: "两枚七号 = 一枚五号",
    ratioVal: 0.5,
    baseGlyph: "望",
    rubyGlyphs: ["ぼ", "う"],
    body: "近代日本活版印刷先驱本木昌造与东京筑地活版制造所确立号数活字制后，报刊书籍最常用五号字排正文、七号字排汉字旁的振り仮名。七号字尺寸几乎与英国 5.5pt 的 Ruby 活字相同，工人便称其为「ルビ活字」，久而久之「ルビ（Ruby）」就成了旁注本身的称呼。",
  },
  pinyin: {
    era: "1958 年后 · 汉语拼音与教学书",
    title: "拉丁字母带四声调号，横排上方逐字对位",
    basePt: "教材正文 16–20 pt",
    rubyPt: "拼音注音 8–10 pt",
    ratioLabel: "声调高脚需放宽行距",
    ratioVal: 0.52,
    baseGlyph: "霜",
    rubyGlyphs: ["sh", "uā"],
    body: "1958 年《汉语拼音方案》颁布后，中国大陆小学语文课本与识字读物广泛采用横排字顶标拼音的做法。因拉丁字母宽窄不一且顶带四声调号，W3C CLReq 明确建议在教材中逐字居中挂接，并给带调字母留出更舒展的行间净空。",
  },
  web: {
    era: "2001 — 今日 · W3C 与 CSS Ruby",
    title: "从 JIS X 4051 到 HTML <ruby> 与 CSS 自动化排印",
    basePt: "1 em（基准字身）",
    rubyPt: "0.5 em（默认半字）",
    ratioLabel: "浏览器原生语义标签",
    ratioVal: 0.5,
    baseGlyph: "山",
    rubyGlyphs: ["や", "ま"],
    body: "日本工业标准 JIS X 4051（1993 首版、1995 修订、2004 扩展熟语与复杂旁注规则）为数字化奠基；2001 年 5 月 31 日 W3C 发布 Ruby Annotation 正式推荐标准，将 <ruby>、<rt>、<rp> 带入网页；随后的 JLReq（2009/2012/2020）与 CSS Ruby Annotation Layout Module Level 1 更细化了对齐、方位与悬挑规则。",
  },
};

function mountSec01() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const titleEl = document.getElementById("s1-title");
  const bodyEl = document.getElementById("s1-body");
  const metaBase = document.getElementById("s1-base-pt");
  const metaRuby = document.getElementById("s1-ruby-pt");
  const metaRatio = document.getElementById("s1-ratio");
  const svgBaseGlyph = document.getElementById("s1-svg-base");
  const svgRuby1 = document.getElementById("s1-svg-r1");
  const svgRuby2 = document.getElementById("s1-svg-r2");
  const svgEra = document.getElementById("s1-svg-era");
  if (!btns.length || !titleEl) return;

  function render(key) {
    const d = HISTORY_ERAS[key] || HISTORY_ERAS.meiji;
    btns.forEach((b) => {
      const active = b.dataset.era === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    titleEl.textContent = d.title;
    bodyEl.textContent = d.body;
    metaBase.textContent = d.basePt;
    metaRuby.textContent = d.rubyPt;
    metaRatio.textContent = d.ratioLabel;
    if (svgBaseGlyph) svgBaseGlyph.textContent = d.baseGlyph;
    if (svgRuby1) svgRuby1.textContent = d.rubyGlyphs[0];
    if (svgRuby2) svgRuby2.textContent = d.rubyGlyphs[1];
    if (svgEra) svgEra.textContent = d.era;
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.era)));
  render("meiji");
}

// ---------- 02 节：三种挂接（Mono / Jukugo / Group）真实断行对照台 ----------
const ATTACH_WORDS = {
  library: {
    label: "図書館（熟语）",
    monoLead: "明日は静かな",
    monoTail: "へ行く。",
    mono: [
      { b: "図", r: "と" },
      { b: "書", r: "しょ" },
      { b: "館", r: "かん" },
    ],
    jukugoNote: "按词内借位把「しょ・かん」平滑微移，单字归属仍在，且遇到行尾允许在「図・書・館」之间自然拆行。",
    groupText: "図書館",
    groupRuby: "としょかん",
    groupNote: "三字打包成不可拆分的一整块，居中匀排；一旦栏宽撞上行尾，整词被迫整体掉到下一行，上一行末尾留下大豁口。",
    monoNote: "三字各自锁死 1 对 1 中轴，「しょ」「かん」宽于单字若不借位，会把「書」和「館」之间撑出细缝。",
    cssCode: `/* 1. 单字 Mono-ruby */\n<ruby>図<rt>と</rt>書<rt>しょ</rt>館<rt>かん</rt></ruby>\n\n/* 2. 词组 Group-ruby */\n<ruby>図書館<rt>としょかん</rt></ruby>\n\n/* CSS 精确控位 */\nruby { ruby-align: space-around; ruby-overhang: auto; }`,
  },
  today: {
    label: "今日（熟字训）",
    monoLead: "窓を開ければ",
    monoTail: "は晴れだ。",
    mono: [
      { b: "今", r: "きょ" },
      { b: "日", r: "う" },
    ],
    jukugoNote: "「今日（きょう）」属于义训词，读音无法真正拆给「今」或「日」单字；硬拆熟语反而会误导读者以为「今=きょ」。",
    groupText: "今日",
    groupRuby: "きょう",
    groupNote: "标准正解！像「今日（きょう）」「七夕（たなばた）」这类熟字训必须用词组旁注跨整词居中，绝不强拆单字。",
    monoNote: "错用单字硬拆成「今(きょ) + 日(う)」，语言学归属是错的——单字「日」并不念「う」。",
    cssCode: `/* 熟字训必须用词组旁注 Group-ruby */\n<ruby>今日<rp>(</rp><rt>きょう</rt><rp>)</rp></ruby>\n\n/* 配合 space-around 让三假名在两汉字上均匀舒展 */\nruby { ruby-align: space-around; }`,
  },
  pinyin: {
    label: "参差霜叶（汉语拼音）",
    monoLead: "深秋庭前看",
    monoTail: "正红。",
    mono: [
      { b: "参", r: "cēn" },
      { b: "差", r: "cī" },
      { b: "霜", r: "shuāng" },
      { b: "叶", r: "yè" },
    ],
    jukugoNote: "把宽音节「shuāng」略微向短音节「cī」「yè」上方悬挑借位，既保住每个字精准对位，又让四字间距保持匀称。",
    groupText: "参差霜叶",
    groupRuby: "cēn cī shuāng yè",
    groupNote: "四音节连写居中后，长音节把相邻拼音推偏，「差」与「霜」头顶不再一一对准，识字教学场景不宜用词组整排。",
    monoNote: "不借位硬撑时，「shuāng」的宽度远超单个汉字，把「差—霜—叶」扯出明显白洞。",
    cssCode: `/* 汉语拼音逐字标注 + 允许悬挑 */\n<ruby>参<rt>cēn</rt>差<rt>cī</rt>霜<rt>shuāng</rt>叶<rt>yè</rt></ruby>\n\nruby {\n  ruby-position: over;\n  ruby-align: center;\n  ruby-overhang: auto;\n}`,
  },
};

function mountSec02() {
  const wordBtns = [...document.querySelectorAll("[data-attach-word]")];
  const widthRange = document.getElementById("s2-width");
  const widthVal = document.getElementById("s2-width-val");
  const monoBox = document.getElementById("s2-mono-demo");
  const jukugoBox = document.getElementById("s2-jukugo-demo");
  const groupBox = document.getElementById("s2-group-demo");
  const monoNote = document.getElementById("s2-mono-note");
  const jukugoNote = document.getElementById("s2-jukugo-note");
  const groupNote = document.getElementById("s2-group-note");
  const codeEl = document.getElementById("s2-code");
  const colsWrap = document.getElementById("s2-cols");
  if (!wordBtns.length || !widthRange) return;

  let curWord = "library";

  function buildRubyHtml(pairs, cls) {
    return pairs
      .map(
        (p) =>
          `<ruby class="${cls}">${p.b}<rp>(</rp><rt>${p.r}</rt><rp>)</rp></ruby>`
      )
      .join("");
  }

  function render() {
    const d = ATTACH_WORDS[curWord];
    const colW = Number(widthRange.value);
    widthVal.textContent = `${colW} px`;

    wordBtns.forEach((b) => {
      const act = b.dataset.attachWord === curWord;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });

    if (colsWrap) colsWrap.style.setProperty("--demo-col-w", `${colW}px`);

    monoBox.innerHTML = `${d.monoLead}${buildRubyHtml(d.mono, "rb-mono")}${d.monoTail}`;
    jukugoBox.innerHTML = `${d.monoLead}<span class="rb-jukugo-wrap">${buildRubyHtml(d.mono, "rb-jukugo")}</span>${d.monoTail}`;
    groupBox.innerHTML = `${d.monoLead}<ruby class="rb-group">${d.groupText}<rp>(</rp><rt>${d.groupRuby}</rt><rp>)</rp></ruby>${d.monoTail}`;

    monoNote.textContent = d.monoNote;
    jukugoNote.textContent = d.jukugoNote;
    groupNote.textContent = d.groupNote;
    if (codeEl) codeEl.textContent = d.cssCode;
  }

  wordBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curWord = b.dataset.attachWord;
      render();
    })
  );
  widthRange.addEventListener("input", render);
  render();
}

// ---------- 03 节暗室：多行段落红外防撞测绘仪（2D Canvas）----------
function mountSec03() {
  const canvas = document.getElementById("dark-collision-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const lhRange = document.getElementById("s3-lh");
  const gapRange = document.getElementById("s3-gap");
  const lhVal = document.getElementById("s3-lh-val");
  const gapVal = document.getElementById("s3-gap-val");
  const overBtn = document.getElementById("s3-overhang");
  const modeBtns = [...document.querySelectorAll("[data-s3-mode]")];
  const verdictEl = document.getElementById("s3-verdict");
  const vHitsEl = document.getElementById("s3-vhits");
  const hCracksEl = document.getElementById("s3-hcracks");
  const clearEl = document.getElementById("s3-clearance");
  const countEl = document.getElementById("s3-count");

  // 初始故意放进紧行距 + 大注距 + 禁悬挑，一眼见红外碰撞热区
  const state = {
    lineHeight: 1.52,
    gapEm: 0.28,
    overhang: false,
    mode: "full",
  };

  let w = 0;
  let h = 0;
  let dpr = 1;
  let dirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(280, Math.round(r.width));
    const nh = Math.max(240, Math.round(r.height));
    const ndpr = pixelRatio(2);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }

  function syncUI(data) {
    lhVal.textContent = `${state.lineHeight.toFixed(2)}×`;
    gapVal.textContent = `${Math.round(state.gapEm * 100)}%`;
    overBtn.textContent = state.overhang ? "半字悬挑：开" : "半字悬挑：关（硬撑）";
    overBtn.classList.toggle("is-on", state.overhang);
    overBtn.setAttribute("aria-pressed", String(state.overhang));

    modeBtns.forEach((b) => {
      const act = b.dataset.s3Mode === state.mode;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });

    verdictEl.textContent = data.verdict;
    verdictEl.dataset.level = data.level;
    vHitsEl.textContent = `${data.verticalHits} 处`;
    hCracksEl.textContent = `${data.horizontalCracks} 处`;
    clearEl.textContent = `${data.clearancePx} px`;
    countEl.textContent = `${data.activeRubyCount} 处`;
  }

  function draw() {
    resize();
    if (!dirty) return;
    dirty = false;

    const data = computeDarkCollision(state, w, h);
    syncUI(data);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 暗室底板
    ctx.fillStyle = PALETTE.darkCard;
    ctx.fillRect(0, 0, w, h);

    // 细网格刻度
    ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
    ctx.lineWidth = 1;
    for (let y = 24; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 绘制三行与碰撞热区
    data.lines.forEach((line, li) => {
      // 上行底线参考
      if (li > 0) {
        ctx.save();
        ctx.strokeStyle = line.vHit ? "rgba(255, 118, 110, 0.55)" : "rgba(93, 212, 172, 0.28)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(18, line.prevBottom + 1);
        ctx.lineTo(w - 18, line.prevBottom + 1);
        ctx.stroke();
        ctx.restore();

        // 若发生垂直撞行/倒挂，整条缝染亮珊瑚预警带
        if (line.vHit) {
          const bandTop = Math.min(line.prevBottom, line.rubyTop) - 2;
          const bandH = Math.max(8, Math.abs(line.rubyTop - line.prevBottom) + data.rubyPx * 0.4);
          ctx.fillStyle = "rgba(255, 118, 110, 0.16)";
          ctx.fillRect(16, bandTop, w - 32, bandH);
        }
      }

      line.cells.forEach((c) => {
        // 横向豁口高亮
        if (c.isCrack) {
          ctx.fillStyle = "rgba(255, 198, 92, 0.16)";
          ctx.fillRect(c.bx - c.crackPx * 0.5, c.by, c.crackPx * 0.46, c.bw);
          ctx.fillRect(c.bx + c.bw + 1, c.by, c.crackPx * 0.46, c.bw);
        }

        // 主文汉字
        ctx.fillStyle = "#FAF5EF";
        ctx.font = `700 ${data.basePx}px ${FONT_CJK}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(c.b, c.bx + c.bw / 2, c.by);

        // 旁注
        if (c.r) {
          if (c.vHit) {
            ctx.strokeStyle = PALETTE.darkRed;
            ctx.lineWidth = 1;
            ctx.strokeRect(c.rx - c.rw / 2 - 2, c.rubyTop - 1, c.rw + 4, data.rubyPx + 2);
          }
          ctx.fillStyle = c.vHit ? "#FF8A82" : PALETTE.passGreenDark;
          ctx.font = `500 ${data.rubyPx}px ${FONT_CJK}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(c.r, c.rx, c.ry);
        }
      });
    });

    // 底部简洁图例
    ctx.fillStyle = "#BDB5AE";
    ctx.font = `400 11px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`GAP ${data.gapPx}px  ·  CLEARANCE ${data.clearancePx}px  ·  STEP ${data.stepY}px`, 16, h - 10);

    ctx.restore();
  }

  const ctl = loop(canvas, () => draw());

  const trigger = () => {
    dirty = true;
    ctl.draw();
  };

  lhRange.addEventListener("input", () => {
    state.lineHeight = Number(lhRange.value);
    trigger();
  });
  gapRange.addEventListener("input", () => {
    state.gapEm = Number(gapRange.value);
    trigger();
  });
  overBtn.addEventListener("click", () => {
    state.overhang = !state.overhang;
    trigger();
  });
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.mode = b.dataset.s3Mode;
      trigger();
    })
  );
  window.addEventListener("resize", trigger);

  // 预设同步
  lhRange.value = String(state.lineHeight);
  gapRange.value = String(state.gapEm);
  trigger();
}

// ---------- 04 节：四大应用场景活体书页样本切换 + 隐显旁注对照 ----------
const SCENE_SAMPLES = {
  furigana: {
    pill: "日语发音标注",
    en: "JAPANESE FURIGANA",
    tag: "直排右置 · 选注音（パラルビ）",
    vertical: true,
    css: `writing-mode: vertical-rl;\nruby-position: over; /* 直排时 over 即文字右侧 */`,
    tip: "现代日本文库本多采用「パラルビ（选注音）」：只给难读汉字或首次出现的人名地名标假名，常见字与助词留白，读起来不累眼。直排本身的行序规则见 214 直排右起。",
    linkNum: "214",
    linkName: "214 直排右起",
    html: `<div class="sheet-vcol">
      <p><ruby>静<rt>しず</rt></ruby>かな<ruby>夜明<rt>よあ</rt></ruby>け、<ruby>希望<rt>きぼう</rt></ruby>の<ruby>未来<rt>みらい</rt></ruby>へ。</p>
      <p>はるかな<ruby>山並<rt>やまな</rt></ruby>みに<ruby>光<rt>ひかり</rt></ruby>がさす。</p>
    </div>`,
  },
  hanzi: {
    pill: "汉字读音提示",
    en: "HANZI PRONUNCIATION",
    tag: "横排上置拼音 · 教学与易错多音字",
    vertical: false,
    css: `writing-mode: horizontal-tb;\nruby-position: over;\nruby-align: center; /* 拼音逐字居中 */`,
    tip: "大陆语文教材多在横排上方逐字标汉语拼音（拉丁字母横长，不适合竖排右置）；台湾地区注音符号（ㄅㄆㄇㄈ）则是少数在横排里也靠字符右侧竖排的 inter-character 特例。横排基线见 212 横排左起。",
    linkNum: "212",
    linkName: "212 横排左起",
    html: `<div class="sheet-hcol">
      <p class="sheet-lead">小学启蒙与生僻多音字读音提示</p>
      <p class="sheet-big"><ruby>参<rt>cēn</rt></ruby><ruby>差<rt>cī</rt></ruby>披拂，<ruby>霜<rt>shuāng</rt></ruby><ruby>叶<rt>yè</rt></ruby>如丹。</p>
      <p class="sheet-sub">注：仅在启蒙阶段全篇注音；成人读物只在「<ruby>参<rt>cēn</rt></ruby><ruby>差<rt>cī</rt></ruby>」「<ruby>句<rt>jù</rt></ruby><ruby>读<rt>dòu</rt></ruby>」这类易误读词上点注。</p>
    </div>`,
  },
  terms: {
    pill: "专业术语解释",
    en: "TERMS EXPLANATION",
    tag: "词组旁注 · 展板与技术文档轻释",
    vertical: false,
    css: `ruby { ruby-align: center; }\nrt { font-size: 0.46em; letter-spacing: 0.04em; }`,
    tip: "在博物馆导览牌或跨语种科普中，用简短词组旁注在专名上方标注英文原词或核心简称，读者视线不必离开当前行去翻文末注释。切记单条解释控制在 2–6 字或一个短词以内。",
    linkNum: "220",
    linkName: "220 双向文字排版",
    html: `<div class="sheet-hcol">
      <p class="sheet-lead">印刷与字体展墙双语轻注</p>
      <p class="sheet-big">东亚活字将<ruby>旁注<rt>Ruby</rt></ruby>与<ruby>留白<rt>Whitespace</rt></ruby>纳入同一<ruby>版心<rt>Type Area</rt></ruby>网格。</p>
      <p class="sheet-sub">把双语对照藏在主文上方半字处，既不拆断中文语流，也免去括号堆砌。</p>
    </div>`,
  },
  classical: {
    pill: "古籍整理排版",
    en: "CLASSICAL TEXTS",
    tag: "直排右音左释 · 双侧旁注与割注分工",
    vertical: true,
    css: `writing-mode: vertical-rl;\n/* 右侧标读音，左侧标简短异文/词义 */\nruby-position: over; /* 另一侧用 under */`,
    tip: "传统汉文古籍与训读本常在直排右侧注音、左侧标简短校勘或释义；一旦注解超过十来字，古人便不再硬塞进旁注，而是改用双行夹注（割注）或眉批。横直协奏可看 216 横直混排与 217 纵中横排。",
    linkNum: "216",
    linkName: "216 横直混排",
    html: `<div class="sheet-vcol sheet-classical">
      <p><ruby>学<rt>xué</rt></ruby>而<ruby>时<rt>shí</rt></ruby>习之，不亦<ruby>说<rt>yuè</rt></ruby>乎。</p>
      <p class="sheet-gloss">右侧点注通假字读音「说＝悦」，长段笺注则退入正文双行夹注。</p>
    </div>`,
  },
};

function mountSec04() {
  const pills = [...document.querySelectorAll("[data-scene]")];
  const toggleBtn = document.getElementById("s4-toggle-ruby");
  const sheet = document.getElementById("s4-sheet");
  const tagEl = document.getElementById("s4-tag");
  const tipEl = document.getElementById("s4-tip");
  const cssEl = document.getElementById("s4-css");
  const linkEl = document.getElementById("s4-sibling-link");
  if (!pills.length || !sheet) return;

  let cur = "furigana";
  let showRuby = true;

  function render() {
    const d = SCENE_SAMPLES[cur];
    pills.forEach((p) => {
      const act = p.dataset.scene === cur;
      p.classList.toggle("is-active", act);
      p.setAttribute("aria-pressed", String(act));
    });
    sheet.classList.toggle("is-vertical", d.vertical);
    sheet.classList.toggle("is-ruby-hidden", !showRuby);
    sheet.innerHTML = d.html;
    tagEl.textContent = d.tag;
    tipEl.textContent = d.tip;
    cssEl.textContent = d.css;
    if (linkEl) {
      linkEl.href = `https://layout.xiaoxiaodong.ai/${d.linkNum}/play/`;
      linkEl.textContent = `延伸阅读：${d.linkName} →`;
    }
    toggleBtn.textContent = showRuby ? "隐藏旁注对比扫读" : "恢复旁注显示";
    toggleBtn.setAttribute("aria-pressed", String(!showRuby));
  }

  pills.forEach((p) =>
    p.addEventListener("click", () => {
      cur = p.dataset.scene;
      render();
    })
  );
  toggleBtn.addEventListener("click", () => {
    showRuby = !showRuby;
    render();
  });
  render();
}

// ---------- 05 节：什么时候别用（四张 Before → Fix 原地急救翻牌）----------
function mountSec05() {
  const cards = [...document.querySelectorAll("[data-fix-card]")];
  cards.forEach((card) => {
    const btn = card.querySelector("[data-fix-btn]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const fixed = card.classList.toggle("is-fixed");
      btn.textContent = fixed ? "看回踩坑原样" : "换成更优方案";
      btn.setAttribute("aria-pressed", String(fixed));
    });
  });
}

// ---------- 06 节暗室：小练习四选一（2 道单变量排印审校题）----------
const QUIZ_QUESTIONS = [
  {
    id: 0,
    badge: "小练习 1 / 2 · 唯一变量：注距与行距配比",
    prompt: "下面四块双行日语排样，字号比（50%）、逐字居中与朱红墨色完全一致，只改变了注距与行距。挑一挑哪一版能最稳妥地守住「谁注谁」的视觉归属：",
    answer: "B",
    options: [
      {
        key: "A",
        line1: "静かな夜に",
        items: [
          { b: "希", r: "き" },
          { b: "望", r: "ぼう" },
          { b: "の", r: "" },
          { b: "未", r: "み" },
          { b: "来", r: "らい" },
        ],
        styleClass: "q1-a",
        whyWrong: "方案 A 把注距压到 0px，假名底缘紧贴甚至压进汉字顶部横画，笔画粘连发毛。",
      },
      {
        key: "B",
        line1: "静かな夜に",
        items: [
          { b: "希", r: "き" },
          { b: "望", r: "ぼう" },
          { b: "の", r: "" },
          { b: "未", r: "み" },
          { b: "来", r: "らい" },
        ],
        styleClass: "q1-b",
        whyRight: "答对了！方案 B 保持约 0.14em 呼吸注距与 2.0× 充裕行距：旁注紧贴自己的主字，同时与上一行底脚隔开超过注距两倍的安全净空，归属一目了然。",
      },
      {
        key: "C",
        line1: "静かな夜に",
        items: [
          { b: "希", r: "き" },
          { b: "望", r: "ぼう" },
          { b: "の", r: "" },
          { b: "未", r: "み" },
          { b: "来", r: "らい" },
        ],
        styleClass: "q1-c",
        whyWrong: "方案 C 把注距拉得过大，旁注向上漂浮后离上一行底脚比离自己主字还近，触发格式塔接近律倒挂，极易误读成上一行的下注。",
      },
      {
        key: "D",
        line1: "静かな夜に",
        items: [
          { b: "希", r: "き" },
          { b: "望", r: "ぼう" },
          { b: "の", r: "" },
          { b: "未", r: "み" },
          { b: "来", r: "らい" },
        ],
        styleClass: "q1-d",
        whyWrong: "方案 D 虽然注距合适，但两行整体行距压窄到约 1.38×，上一行字脚直接顶到下一行旁注头顶，段落一密就会撞成一团。",
      },
    ],
  },
  {
    id: 1,
    badge: "小练习 2 / 2 · 唯一变量：宽拼音处理策略",
    prompt: "给汉语诗句「参差霜叶」标拼音时，第三字「shuāng」远宽于单个汉字。四版字色与行距相同，只改变挂接与字号策略，选一选最适合阅读与识字的一版：",
    answer: "C",
    options: [
      {
        key: "A",
        line1: "秋林晚照",
        items: [
          { b: "参", r: "cēn" },
          { b: "差", r: "cī" },
          { b: "霜", r: "shuāng", tiny: true },
          { b: "叶", r: "yè" },
        ],
        styleClass: "q2-a",
        whyWrong: "方案 A 把「shuāng」单独压扁缩到 26%，既破坏整行旁注字号一致，又让声调符号糊成难以辨认的小点。",
      },
      {
        key: "B",
        line1: "秋林晚照",
        items: [
          { b: "参", r: "cēn" },
          { b: "差", r: "cī" },
          { b: "霜", r: "shuāng" },
          { b: "叶", r: "yè" },
        ],
        styleClass: "q2-b",
        whyWrong: "方案 B 把全行拼音放大到约 80%，拼音几乎与汉字等大，主客倒置且宽音节互相顶撞。",
      },
      {
        key: "C",
        line1: "秋林晚照",
        items: [
          { b: "参", r: "cēn" },
          { b: "差", r: "cī" },
          { b: "霜", r: "shuāng" },
          { b: "叶", r: "yè" },
        ],
        styleClass: "q2-c",
        whyRight: "答对了！方案 C 保持全行统一约 50% 清晰字号，允许宽音节「shuāng」向两侧短音节轻度悬挑并微增均匀字距，既逐字对准又不撕裂行流。",
      },
      {
        key: "D",
        line1: "秋林晚照",
        groupMode: true,
        baseText: "参差霜叶",
        groupRuby: "cēncīshuāngyè",
        styleClass: "q2-d",
        whyWrong: "方案 D 把四个拼音粘连成一整串词组通排，音节边界消失、每个汉字也不再对准各自的读音。",
      },
    ],
  },
];

function mountSec06() {
  const badgeEl = document.getElementById("q-badge");
  const promptEl = document.getElementById("q-prompt");
  const gridEl = document.getElementById("q-grid");
  const feedbackEl = document.getElementById("q-feedback");
  const nextBtn = document.getElementById("q-next");
  const resetBtn = document.getElementById("q-reset");
  if (!gridEl) return;

  let qIdx = 0;
  let picked = null;

  function renderSample(opt) {
    if (opt.groupMode) {
      return `
        <div class="q-sample ${opt.styleClass}">
          <div class="q-prev">${opt.line1}</div>
          <div class="q-main"><ruby>${opt.baseText}<rt>${opt.groupRuby}</rt></ruby></div>
        </div>
      `;
    }
    const inner = opt.items
      .map((it) => {
        if (!it.r) return `<span class="q-plain">${it.b}</span>`;
        return `<ruby class="${it.tiny ? "is-tiny" : ""}">${it.b}<rt>${it.r}</rt></ruby>`;
      })
      .join("");
    return `
      <div class="q-sample ${opt.styleClass}">
        <div class="q-prev">${opt.line1}</div>
        <div class="q-main">${inner}</div>
      </div>
    `;
  }

  function render() {
    const q = QUIZ_QUESTIONS[qIdx];
    badgeEl.textContent = q.badge;
    promptEl.textContent = q.prompt;

    gridEl.innerHTML = q.options
      .map((opt) => {
        let stateCls = "";
        if (picked) {
          if (opt.key === q.answer) stateCls = "is-correct";
          else if (opt.key === picked) stateCls = "is-wrong";
        }
        return `
          <button type="button" class="q-card ${stateCls}" data-opt="${opt.key}" aria-pressed="${picked === opt.key}">
            <span class="q-key">方案 ${opt.key}</span>
            ${renderSample(opt)}
          </button>
        `;
      })
      .join("");

    gridEl.querySelectorAll(".q-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.opt;
        render();
      });
    });

    if (!picked) {
      feedbackEl.className = "q-feedback is-idle";
      feedbackEl.textContent = "从上面四张排样卡里挑一挑，查看排印审校批注。";
    } else {
      const opt = q.options.find((o) => o.key === picked);
      const ok = picked === q.answer;
      feedbackEl.className = `q-feedback ${ok ? "is-ok" : "is-bad"}`;
      feedbackEl.textContent = ok ? opt.whyRight : `${opt.whyWrong} 正解是方案 ${q.answer}。`;
    }

    nextBtn.textContent = qIdx === 0 ? "下一题（宽拼音挂接） →" : "回到第 1 题";
  }

  nextBtn.addEventListener("click", () => {
    qIdx = (qIdx + 1) % QUIZ_QUESTIONS.length;
    picked = null;
    render();
  });
  resetBtn.addEventListener("click", () => {
    picked = null;
    render();
  });

  render();
}

// ---------- 07 节：原海报放大拖动灯箱 ----------
function mountPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const stage = document.getElementById("poster-modal-stage");
  if (!poster || !modal || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    modalImg.src = poster.currentSrc || poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    openBtn?.focus();
  }

  poster.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
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

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.min(3, Math.max(0.75, +(scale + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)));
    applyTransform();
  }, { passive: false });
}

export function mountSections() {
  mountSec01();
  mountSec02();
  mountSec03();
  mountSec04();
  mountSec05();
  mountSec06();
  mountPosterLightbox();
}
