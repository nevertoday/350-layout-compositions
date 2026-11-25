// 192 垂直文字排版 — 单一数学与内容真源
// 开场宣纸立卷、03 节二维相位图、04 节原生 CSS 盒、05 节场景卡、06 节反例、07 节小练习共用本模块。

export const PALETTE = {
  paper: "#F7F3EB",
  paperLight: "#FBF8F2",
  scroll: "#F2EBE0",
  stone: "#E7DFD1",
  rule: "#CFC4B3",
  ink: "#161B19",
  inkMuted: "#46524E",
  teal: "#1E5F57",
  tealDeep: "#133A35",
  tealSoft: "#DDE8E4",
  ochre: "#E1AD54",
  ochreInk: "#855A0E",
  ochreBright: "#E8B85F",
  seal: "#A93931",
  sealBright: "#F28277",
};

// 开场立卷双题材（主文取自 192 原海报《山川有声》与底沿案例《听雨·诗集》）
export const SPECIMENS = {
  shanchuan: {
    id: "shanchuan",
    label: "山川有声",
    title: "山川有声·岁月成诗",
    seal: "山川",
    // 每条 token：普通字直接单字，数字双位标注 tcy 便于演示侧躺 vs 纵中横
    raw: "在静默的时光里，山川低语，风物成篇。以文字为舟，在“留白”中见东方美学。{03}月{20}日记。",
  },
  tingyu: {
    id: "tingyu",
    label: "听雨诗集",
    title: "听雨·庚子年春",
    seal: "听雨",
    raw: "一窗听雨，心自澄明。檐水滴石，落成“无声”诗行。夜深雨细，纸墨犹温。{05}月{12}日夜。",
  },
};

export const HERO_BOUNDS = {
  leading: { min: 1.08, max: 2.5, sweetMin: 1.55, sweetMax: 2.25 },
  tracking: { min: 0.0, max: 0.48, sweetMin: 0.04, sweetMax: 0.24 },
  colLimit: { min: 4, max: 20, sweetMin: 6, sweetMax: 12 },
};

// 开场刻意落在 0/4 错版：由左向右倒序 + 行距窄于字距串行 + 18字超长列 + 横标躺数
export const HERO_INITIAL = {
  specimen: "shanchuan",
  direction: "lr",
  leading: 1.14,
  tracking: 0.4,
  colLimit: 18,
  verticalPunct: false,
  guides: true,
};

const PUNCT_CORNER = new Set(["，", "。", "、", "：", "；"]);
const QUOTE_MAP = { "“": "﹁", "”": "﹂" };
const KINSOKU_HEAD = new Set(["，", "。", "、", "”", "﹂", "》", "！", "？"]);

export function clampHeroState(next) {
  const s = { ...HERO_INITIAL, ...next };
  s.specimen = SPECIMENS[s.specimen] ? s.specimen : "shanchuan";
  s.direction = s.direction === "rl" ? "rl" : "lr";
  s.leading = +Math.min(HERO_BOUNDS.leading.max, Math.max(HERO_BOUNDS.leading.min, Number(s.leading) || 1.14)).toFixed(2);
  s.tracking = +Math.min(HERO_BOUNDS.tracking.max, Math.max(HERO_BOUNDS.tracking.min, Number(s.tracking) || 0)).toFixed(2);
  s.colLimit = Math.round(Math.min(HERO_BOUNDS.colLimit.max, Math.max(HERO_BOUNDS.colLimit.min, Number(s.colLimit) || 10)));
  s.verticalPunct = Boolean(s.verticalPunct);
  s.guides = Boolean(s.guides);
  return s;
}

// 解析题材文本为竖排单元（开启纵中横时 {03} 合并为一个 1em 方格，关闭时拆为 2 个侧躺 90° 字符）
export function tokenizeSpecimen(raw, verticalPunct) {
  const tokens = [];
  const re = /\{(\d{2})\}|([\s\S])/g;
  let m;
  while ((m = re.exec(raw))) {
    if (m[1]) {
      if (verticalPunct) {
        tokens.push({ text: m[1], kind: "tcy", hang: false });
      } else {
        tokens.push({ text: m[1][0], kind: "sideways", hang: false });
        tokens.push({ text: m[1][1], kind: "sideways", hang: false });
      }
    } else {
      const ch = m[2];
      if (QUOTE_MAP[ch]) {
        tokens.push({
          text: verticalPunct ? QUOTE_MAP[ch] : ch,
          kind: verticalPunct ? "vquote" : "hquote",
          rawChar: ch,
          hang: ch === "”",
        });
      } else if (PUNCT_CORNER.has(ch)) {
        tokens.push({
          text: ch,
          kind: verticalPunct ? "vpunct" : "hpunct",
          hang: true,
        });
      } else {
        tokens.push({ text: ch, kind: "han", hang: false });
      }
    }
  }
  return tokens;
}

// 按单列上限字数分列；开启竖排标点时自动执行列首禁则避头（悬挂在上一列尾）
export function buildColumns(state) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.shanchuan;
  const tokens = tokenizeSpecimen(spec.raw, state.verticalPunct);
  const cols = [];
  let cur = [];
  for (const tok of tokens) {
    if (cur.length >= state.colLimit) {
      if (state.verticalPunct && tok.hang) {
        cur.push({ ...tok, hung: true });
        cols.push(cur);
        cur = [];
        continue;
      }
      cols.push(cur);
      cur = [tok];
    } else {
      cur.push(tok);
    }
  }
  if (cur.length) cols.push(cur);
  return { spec, cols };
}

// 单一诊断与几何真源：所有读数、状态灯、画布串行桥与提示文字皆从此产出
export function analyzeScroll(rawState) {
  const state = clampHeroState(rawState);
  const { spec, cols } = buildColumns(state);

  const colGapEm = +(state.leading - 1).toFixed(2);
  const charGapEm = +state.tracking.toFixed(2);
  const gapDiffEm = +(colGapEm - charGapEm).toFixed(2);
  const gapRatio = +(colGapEm / Math.max(0.08, charGapEm)).toFixed(2);

  // 统计每列正文非悬挂单元数与列首违禁标点
  const colLengths = cols.map((c) => c.filter((t) => !t.hung).length);
  const maxColChars = Math.max(0, ...colLengths);
  const headOrphans = [];
  cols.forEach((c, ci) => {
    if (c[0] && KINSOKU_HEAD.has(c[0].text)) headOrphans.push({ col: ci, char: c[0].text });
  });

  // 四项规则判定
  const dirOk = state.direction === "rl";

  let rhythmStatus = "ok";
  if (colGapEm <= charGapEm + 0.08 || (charGapEm > 0.08 && gapRatio < 1.8)) {
    rhythmStatus = "cross";
  } else if (state.leading < HERO_BOUNDS.leading.sweetMin) {
    rhythmStatus = "tight";
  } else if (state.leading > HERO_BOUNDS.leading.sweetMax) {
    rhythmStatus = "loose";
  } else if (state.tracking > HERO_BOUNDS.tracking.sweetMax) {
    rhythmStatus = "track-wide";
  } else if (state.tracking < HERO_BOUNDS.tracking.sweetMin) {
    rhythmStatus = "track-tight";
  }
  const rhythmOk = rhythmStatus === "ok";

  let lenStatus = "ok";
  if (maxColChars < HERO_BOUNDS.colLimit.sweetMin) lenStatus = "short";
  else if (maxColChars > HERO_BOUNDS.colLimit.sweetMax) lenStatus = "long";
  const lenOk = lenStatus === "ok";

  const punctOk = state.verticalPunct === true;

  const passCount = [dirOk, rhythmOk, lenOk, punctOk].filter(Boolean).length;

  // 生成首要诊断（按视觉破坏程度排序：串行 > 行序反 > 列长失衡 > 标点未竖排 > 全通）
  let tag = "四项就位";
  let severity = "ok";
  let headline = "立卷秩序成立，视线自右上顺流而下";
  let detail = `行距 ${state.leading.toFixed(2)}×（列间净空 ${colGapEm.toFixed(2)}em）明显宽于上下字距 ${charGapEm.toFixed(2)}em，单列最长 ${maxColChars} 字落在海报经验舒展带（6–12 字），标点与纵中横贴合纵轴。`;
  let action = "可以继续把卷轴拉紧或拉散，亲自试出「横向串行」和「列散断气」两条失误边界。";

  if (rhythmStatus === "cross") {
    tag = "错态 · 横向串行";
    severity = "err";
    headline = `列间净空（${colGapEm.toFixed(2)}em）压不过上下字距（${charGapEm.toFixed(2)}em）`;
    detail = "相邻两列之间的横向缝隙比同一列上下两字还近（或过于接近）。格式塔邻近律会强行把左右字编成横行，眼睛读着读着就横向串列。";
    action = "把底部「行距卷轴」往右拉开至 1.65× 以上，再把「上下字距」收回到 0.08–0.18em。";
  } else if (!dirOk) {
    tag = "错态 · 行序颠倒";
    severity = "err";
    headline = "列序设为「由左向右」，阅读入口倒置了";
    detail = "汉字竖排沿用竹简右起展卷习惯：主标应立于最右作「阅读起点」，正文逐列向左推进。反排时主标被挤在最左，读者第一眼容易先读到句尾。";
    action = "把「列序」切回「由右向左」，看主标与红色阅读起点箭头回到右侧。";
  } else if (rhythmStatus === "tight") {
    tag = "错态 · 列距过挤";
    severity = "err";
    headline = `行距仅 ${state.leading.toFixed(2)}×，列与列几乎贴肩`;
    detail = "即使上下字距不大，低于 1.55× 的竖排行距也会让黑字块糊成一片灰墙，换列回扫时容易漏列或重读同一列。";
    action = "继续向右拉动底部「行距卷轴」，把行距推入 1.55×–2.25× 经验舒展带。";
  } else if (rhythmStatus === "loose") {
    tag = "错态 · 列散断气";
    severity = "err";
    headline = `行距拉到 ${state.leading.toFixed(2)}×，诗列散成几根孤柱`;
    detail = "超过 2.25× 后，相邻两列之间的空沟过宽，段落失去整体群组感，末端诗列也会逼近左侧图形，破坏版面平衡。";
    action = "把底部「行距卷轴」往左收回至 1.65×–2.10× 之间。";
  } else if (rhythmStatus === "track-wide") {
    tag = "错态 · 字散失柱";
    severity = "err";
    headline = `上下字距 +${charGapEm.toFixed(2)}em 过散，每列像断线珠子`;
    detail = "字与字在纵向上拉得太远，语流一顿一顿，同时削弱了「列内紧、列间松」的纵流分组优势。";
    action = "把「上下字距」滑杆往左收回到 0.06–0.20em。";
  } else if (rhythmStatus === "track-tight") {
    tag = "错态 · 上下挤笔";
    severity = "err";
    headline = "上下字距几乎贴死（< 0.04em），长笔画容易撞脚";
    detail = "宋体或楷体竖排时，上一字的竖钩、撇捺与下一字顶横容易黏连，留出 0.06–0.18em 的微距能让呼吸立刻打开。";
    action = "把「上下字距」轻微调大到 0.08–0.16em。";
  } else if (lenStatus === "long") {
    tag = "错态 · 长柱憋气";
    severity = "err";
    headline = `每列塞进 ${maxColChars} 字，超出海报短卡 6–12 字经验带`;
    detail = "海报、茶签与展卡视野有限，单列过长会让视觉重心直坠底边，压扁地脚留白与印章气口（长篇竖排图书则需更宽行距另当别论）。";
    action = "把「单列上限」回调到 8–11 字，让天头地脚与朱红方印重新呼吸。";
  } else if (lenStatus === "short") {
    tag = "错态 · 碎步断句";
    severity = "err";
    headline = `每列只有 ${maxColChars} 字，句子被切得太碎`;
    detail = `一篇短文被迫折成 ${cols.length} 根短柱，眼睛刚往下读四五个字就得换列回跳，阅读节奏变得急促零散。`;
    action = "把「单列上限」提高到 7–11 字，让短句完整舒展。";
  } else if (!punctOk) {
    tag = "错态 · 横标躺数";
    severity = "err";
    headline = "标点仍按横排摆在左下，两位数字侧躺难读";
    detail = `逗号句号贴在字格左下角，视觉上像属于左边那一列；引号没转为直排「﹁﹂」；日期「03」「20」顺时针躺倒。${headOrphans.length ? `此外还有 ${headOrphans.length} 枚标点掉到了列首。` : ""}`;
    action = "把「标点与数字」切到「竖标＋纵中横」，观察点号移右上、日期正立与列首避头。";
  }

  return {
    state,
    spec,
    cols,
    colCount: cols.length,
    maxColChars,
    colGapEm,
    charGapEm,
    gapDiffEm,
    gapRatio,
    headOrphans,
    checks: {
      dir: {
        ok: dirOk,
        label: "阅读方向",
        value: dirOk ? "由右向左" : "反·左向右",
      },
      rhythm: {
        ok: rhythmOk,
        status: rhythmStatus,
        label: "行字节奏",
        value:
          rhythmStatus === "ok"
            ? `行${state.leading.toFixed(2)}×`
            : rhythmStatus === "cross"
              ? "横向串行"
              : rhythmStatus === "tight"
                ? "列距过挤"
                : rhythmStatus === "loose"
                  ? "列散断气"
                  : rhythmStatus === "track-wide"
                    ? "字距过散"
                    : "上下挤笔",
      },
      len: {
        ok: lenOk,
        status: lenStatus,
        label: "单列字数",
        value: lenOk ? `${maxColChars} 字/列` : lenStatus === "long" ? `${maxColChars} 字·过长` : `${maxColChars} 字·过碎`,
      },
      punct: {
        ok: punctOk,
        label: "标点混排",
        value: punctOk ? "竖标·纵中横" : "横标·躺数",
      },
    },
    passCount,
    tag,
    severity,
    headline,
    detail,
    action,
    isCrossReading: rhythmStatus === "cross",
  };
}

// ---------- 01 节：简牍展卷 4 步解说 ----------
export const BAMBOO_STEPS = [
  {
    id: 0,
    tag: "步骤 01",
    title: "剖竹成简：窄条天然只容纵书",
    body: "纸张普及之前，竹子顺纤维剖成宽约一指、长约一尺的狭长竹片。单枚竹简横向只够写一字，只能自上而下排成一纵行。",
    cue: "单简只容一字宽 → 自上而下",
    slips: 1,
    bound: false,
    unroll: 0.15,
    modern: false,
  },
  {
    id: 1,
    tag: "步骤 02",
    title: "编绳成册：多简并排连成书卷",
    body: "写好的单枚竹简用麻绳或丝线上下编连（「册」字象形正来源于此）。成卷后份量不轻，通常用左手托住整卷，右手往外抽展。",
    cue: "韦编连简 → 成束卷收",
    slips: 6,
    bound: true,
    unroll: 0.55,
    modern: false,
  },
  {
    id: 2,
    tag: "步骤 03",
    title: "右起展卷：左手持卷，右手逐简向左读",
    body: "左手握住未展开的书卷、右手向右拉出新简（或书写时右手自右向左写，袖口不蹭湿刚写完的墨迹），视线自然锁定「自上而下、由右向左」。",
    cue: "右手不蹭湿墨 → 由右向左",
    slips: 6,
    bound: true,
    unroll: 1,
    modern: false,
  },
  {
    id: 3,
    tag: "步骤 04",
    title: "化入纸面：实体简缝变成现代隐形网格",
    body: "竹简换成宣纸、活字与屏幕后，实体竹边消失了，但「隐形网格（乌丝栏）」「天头地脚留白」与「右起左行」的秩序留了下来。",
    cue: "简缝隐去 → 现代竖排网格",
    slips: 6,
    bound: false,
    unroll: 1,
    modern: true,
  },
];

// ---------- 02 节：历史碑签 ----------
export const HISTORY_STELES = [
  {
    id: "bamboo",
    era: "商周—秦汉",
    year: "简牍帛书",
    title: "狭长简牍定下两千年行款",
    summary: "1972 年山东临沂银雀山汉墓竹简（含《孙子兵法》《孙膑兵法》）、1975–1976 年湖北云梦睡虎地秦简、2002 年湖南龙山里耶秦简，均呈清晰的纵行右起墨迹。学者钱存训在 1962 年首版的《书于竹帛》中系统考证了竹木与缣帛形制如何塑造了早期汉字版面。",
    sampleTitle: "简牍墨迹",
    sampleLines: ["兵者国之大事", "死生之地存亡", "之道不可不察"],
    sampleDir: "rl",
    sampleStyle: "bamboo",
  },
  {
    id: "woodblock",
    era: "唐宋—明清",
    year: "雕版线装",
    title: "乌丝栏、版心与天头地脚",
    summary: "雕版与活字印书将简缝升格为精确的「界栏（乌丝栏、朱丝栏）」。页面上方多留「天头」供眉批，下方留「地脚」托住重心，每半叶行数与每行字数严格等距，形成成熟的东亚竖排网格系统。",
    sampleTitle: "雕版界栏",
    sampleLines: ["山川有声", "岁月成诗", "文序留白"],
    sampleDir: "rl",
    sampleStyle: "woodblock",
  },
  {
    id: "reform1955",
    era: "1955—1956",
    year: "报刊横排",
    title: "《光明日报》与《人民日报》先后改横排",
    summary: "1955 年 1 月 1 日，《光明日报》在全国主要报纸中率先改竖排为自左向右横排；1956 年 1 月 1 日，《人民日报》正式全面改横排并采用简化汉字。此后大陆公文、科技文献与主流出版物转向横排，而竖排沉淀为书籍装帧、艺文海报、茶酒包装与港台/日本图书的经典表达。",
    sampleTitle: "横排转向",
    sampleLines: ["一九五五年元旦", "报刊率先改横排", "竖排转为文化载体"],
    sampleDir: "tb",
    sampleStyle: "press",
  },
  {
    id: "web2019",
    era: "2011—2019",
    year: "数字标准",
    title: "GB/T 标点规范与 W3C 竖排推荐标准",
    summary: "2011 年国标 GB/T 15834-2011 明确了竖排标点右上移位与直排引号「﹃﹄」「﹁﹂」；2019 年 12 月 10 日，W3C 将 CSS Writing Modes Level 3 发布为正式推荐标准，结合中文排版需求（CLREQ）与日文排版需求（JLREQ），让浏览器原生排布垂直文字与纵中横。",
    sampleTitle: "W3C 标准",
    sampleLines: ["writing-mode:", "vertical-rl;", "纵中横原生支持"],
    sampleDir: "rl",
    sampleStyle: "css",
  },
];

// ---------- 03 节：二维行距×字距相位图 ----------
export function classifyPhase(leading, tracking) {
  const colGap = +(leading - 1).toFixed(2);
  const charGap = +tracking.toFixed(2);
  const ratio = +(colGap / Math.max(0.08, charGap)).toFixed(2);
  if (colGap <= charGap + 0.08 || (charGap > 0.08 && ratio < 1.8)) {
    return {
      zone: "cross",
      name: "横向串行红区",
      colGap,
      charGap,
      ratio,
      explain: `列间净空仅 ${colGap.toFixed(2)}em，压不过上下字距 ${charGap.toFixed(2)}em。相邻两列的字离得太近，眼睛被邻近律强行拉成横读。`,
    };
  }
  if (leading < 1.55) {
    return {
      zone: "tight",
      name: "列距偏挤区",
      colGap,
      charGap,
      ratio,
      explain: `行距 ${leading.toFixed(2)}×（净空 ${colGap.toFixed(2)}em）过紧，虽未横向串行，但黑度太闷，换列时眼睛容易找不到下一列顶头。`,
    };
  }
  if (leading > 2.25 || tracking > 0.24) {
    return {
      zone: "loose",
      name: "孤柱散架区",
      colGap,
      charGap,
      ratio,
      explain:
        leading > 2.25
          ? `行距 ${leading.toFixed(2)}× 把每列推得太远，相邻两列失去整体段落感。`
          : `上下字距 +${charGap.toFixed(2)}em 过散，一列里的词语被拆成断续单字。`,
    };
  }
  if (tracking < 0.04) {
    return {
      zone: "pinch",
      name: "上下贴笔区",
      colGap,
      charGap,
      ratio,
      explain: "上下字距几乎为零，竖排汉字的撇捺与横画容易相撞，微微放开 0.06–0.18em 会立刻透气。",
    };
  }
  return {
    zone: "sweet",
    name: "纵流舒展带（经验）",
    colGap,
    charGap,
    ratio,
    explain: `列间净空（${colGap.toFixed(2)}em）约是上下字距（${charGap.toFixed(2)}em）的 ${ratio.toFixed(1)} 倍，纵列像竹节一样连贯，列间又有从容留白。`,
  };
}

// ---------- 04 节：原生 CSS 混排检查 ----------
export function buildCssInspect({ punctMode, numMode, latinMode }) {
  const openQ = punctMode === "vert" ? "﹁" : "“";
  const closeQ = punctMode === "vert" ? "﹂" : "”";
  const num05 = numMode === "han" ? "五" : "05";
  const num20 = numMode === "han" ? "二十" : "20";

  const issues = [];
  if (punctMode === "horiz") issues.push("引号停留在横排弯引号，竖排中开口朝向与列轴脱节");
  if (numMode === "sideways") issues.push("两位日期「05」「20」侧躺 90°，读数字时视线被迫顿一下");
  if (latinMode === "upright") issues.push("整段英文强设 upright，词形被打散成一串字母糖葫芦");

  const status = issues.length === 0 ? "ok" : "warn";
  const summary =
    issues.length === 0
      ? "规范竖排：直排引号顺列包裹、两位日期用纵中横正立占 1em、英文短语顺时针 90° 保持完整词形。"
      : issues.join("；") + "。";

  const cssLines = [
    ".scroll-text {",
    "  writing-mode: vertical-rl;",
    `  text-orientation: ${latinMode === "upright" ? "upright" : "mixed"};`,
    "  line-height: 1.9;",
    "  letter-spacing: 0.12em;",
    "}",
    numMode === "tcy"
      ? ".scroll-text .num { text-combine-upright: all; } /* 纵中横：两位数字正立 */"
      : numMode === "sideways"
        ? "/* 未启用 text-combine-upright：数字默认随 mixed 顺转 90° */"
        : "/* 典籍体直接改用中文数字「五月二十日」，无需纵中横 */",
  ].join("\n");

  return { openQ, closeQ, num05, num20, status, summary, cssLines };
}

// ---------- 06 节：什么时候别用竖排（翻车对照） ----------
export const ANTI_CASES = {
  code: {
    id: "code",
    tab: "代码与报错",
    title: "代码、路径与报错日志",
    whyBad: "满屏是等宽拉丁词、缩进层级与符号（/、:、{}）。强行竖排后要么整段侧躺 90° 逼人歪头，要么正立拆成无法扫读的单字符柱。",
    whyGood: "保持水平自左向右排版，缩进与关键字一眼对齐。",
  },
  price: {
    id: "price",
    tab: "价格参数表",
    title: "多位数字、小数点与对比表格",
    whyBad: "多位价格（¥1,299.00）和参数单位无法塞进纵中横 1em，小数值纵排极难横向比价，扫描效率大跌。",
    whyGood: "用水平表头 + 右对齐等宽数字，小数点上下齐平，一秒比出差价。",
  },
  mobile: {
    id: "mobile",
    tab: "窄屏长正文",
    title: "手机窄屏上的千字长文",
    whyBad: "手机天生是竖长条，千字竖排正文只能变成横向往左无限拉长的卷轴，与单手上下滑动的手势、返回边缘手势处处打架。",
    whyGood: "移动端长文回归水平排版（见 193 水平文字排版），把竖排留给封面标题、短引言与节标题。",
  },
};

// ---------- 07 节：小练习四张展签（中性标签，仅差单一变量） ----------
export const PRACTICE_CARDS = [
  {
    id: "A",
    label: "甲",
    correct: false,
    fault: "行序反排（由左向右）",
    direction: "lr",
    leading: 1.9,
    tracking: 0.12,
    verticalPunct: true,
    note: "列距、字距与竖排标点都没毛病，但唯独「由左向右」排反了：主标《春山茶事》被推到最左，读者按直觉从右上看进去会先读到末尾的「云起」。",
  },
  {
    id: "B",
    label: "乙",
    correct: false,
    fault: "行距窄于上下字距（横向串行）",
    direction: "rl",
    leading: 1.15,
    tracking: 0.42,
    verticalPunct: true,
    note: "方向与标点都对，但列间净空（0.15em）比同一列里的上下字距（0.42em）还窄。格式塔邻近律把左右两字拉成横行，读着读着就串列。",
  },
  {
    id: "C",
    label: "丙",
    correct: true,
    fault: "四项齐备",
    direction: "rl",
    leading: 1.92,
    tracking: 0.12,
    verticalPunct: true,
    note: "正确。主标立于右上确立「阅读起点」，正文由右向左每列 8 字，行距明显宽于上下字距，逗号句号移右上、「04」「18」纵中横正立，左下朱印稳住收口。",
  },
  {
    id: "D",
    label: "丁",
    correct: false,
    fault: "横标照搬 + 句号顶列首 + 数字侧躺",
    direction: "rl",
    leading: 1.9,
    tracking: 0.12,
    verticalPunct: false,
    note: "方向和行距都稳，但直接照搬了横排标点：逗号句号贴在字格左下，句号甚至掉到了新列最顶，日期「04」「18」也跟着顺时针横躺，细节立刻露馅。",
  },
];
