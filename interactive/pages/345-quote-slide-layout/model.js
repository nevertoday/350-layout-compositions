// 345 引语页幻灯片版式 · 单一真源数据与诊断模型
// 画布渲染、四周原海报虚线引注、顶栏状态徽章与底部导演诊单全部共用 evaluate(state)。

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报示例",
    deckTopic: "设计观念讲座",
    prevSlide: {
      kicker: "SLIDE 01 · 问题清单",
      title: "常规功能设计常见五大瓶颈",
      bullets: [
        "仅围绕既有痛点做增量修补，容易陷入同质化竞争",
        "交付周期压缩导致调研阶段被迫删减，团队只盯表层需求",
        "评审标准偏重短期转化指标，忽视长期体验与文化语境",
        "视觉系统频繁换皮却缺乏统一主张，用户难以形成记忆",
      ],
    },
    nextSlide: {
      kicker: "SLIDE 03 · 实践落点",
      title: "回到提问本身：三步重审项目提案",
      steps: ["暂停追问怎么做", "先问为何存在", "用留白留出答案"],
    },
    // 5 档提纯文本：trim 0..100 对应从冗长原稿到极简残句的连续雕琢
    stages: [
      {
        maxTrim: 22,
        lines: [
          [{ t: "在当下追求快速交付的商业环境里，" }],
          [{ t: "很多人习惯把设计当成修补" }, { t: "具体故障", em: true }, { t: "的工具，" }],
          [{ t: "但退后一步重新审视器物与人的关系，" }],
          [{ t: "设计并不是单纯为了解决眼前的" }, { t: "问题", em: true }, { t: "，" }],
          [{ t: "而是为了给长远的" }, { t: "思考", em: true }, { t: "留出容器。" }],
        ],
        cutNote: "原稿 75 字 · 5 行字墙",
      },
      {
        maxTrim: 46,
        lines: [
          [{ t: "很多人把设计理解成修补故障的工具，" }],
          [{ t: "但退后一步看，设计并不只是为了" }, { t: "解决问题", em: true }, { t: "，" }],
          [{ t: "它更重要的价值，是为持续的" }, { t: "思考", em: true }, { t: "留出承载空间。" }],
        ],
        cutNote: "初删 48 字 · 仍偏长",
      },
      {
        maxTrim: 66,
        lines: [
          [{ t: "设计并不只是为了" }, { t: "解决问题", em: true }, { t: "，" }],
          [{ t: "它更重要的作用，" }],
          [{ t: "是为了承载持续的" }, { t: "思考", em: true }, { t: "。" }],
        ],
        cutNote: "再删 27 字 · 接近甜点",
      },
      {
        maxTrim: 88,
        // 1:1 复刻 345 原海报核心金句与断行
        lines: [
          [{ t: "设计不是" }],
          [{ t: "为了" }, { t: "解决问题", em: true }, { t: "，" }],
          [{ t: "而是为了承载" }, { t: "思考", em: true }, { t: "。" }],
        ],
        defaultHighlight: ["思考"],
        cutNote: "海报原句 18 字 · 3 行",
      },
      {
        maxTrim: 100,
        lines: [[{ t: "承载" }, { t: "思考", em: true }, { t: "。" }]],
        defaultHighlight: ["思考"],
        cutNote: "过度删空 4 字 · 语境断链",
      },
    ],
    author: {
      vague: { main: "某设计师", sub: "" },
      clear: { main: "原研哉", sub: "日本设计师（海报示例）" },
      bloated: {
        main: "原研哉 Kenya Hara",
        sub: "日本平面设计师 · 策展人 · 武藏野美术大学教授 · 无印良品艺术总监 ·《设计中的设计》作者",
      },
    },
    factNote: "核查提示：此句为 345 原海报示例句，属中文网络常见意译，未见于原研哉原著逐字原文；真实演讲引用请务必核对一手出处。",
  },

  interview: {
    id: "interview",
    label: "用户访谈原声",
    deckTopic: "产品体验复盘",
    prevSlide: {
      kicker: "SLIDE 01 · 数据背景",
      title: "门诊配药界面改版前四项摩擦指标",
      bullets: [
        "高峰期单张处方核对平均耗时 42 秒，误点率居高不下",
        "14 个同色按钮并排挤在底部，视觉层级彼此打架",
        "68% 的新入职护士需要靠纸质便签背诵快捷键位置",
        "夜班弱光环境下浅灰提示字对比度不足，频繁二次确认",
      ],
    },
    nextSlide: {
      kicker: "SLIDE 03 · 改版动作",
      title: "把 14 个按钮收束成 1 条主流程",
      steps: ["保留高频三键", "高对比核对条", "一秒撤销保护"],
    },
    stages: [
      {
        maxTrim: 22,
        lines: [
          [{ t: "其实我们每天在诊室里忙起来的时候根本顾不上看说明书，" }],
          [{ t: "之前旧系统每个弹窗都写满三四行专业术语，" }],
          [{ t: "我一边安抚排队病人一边找" }, { t: "确认键", em: true }, { t: "，心里特别发慌，" }],
          [{ t: "真正好用的软件不是功能堆得多，而是让我" }, { t: "不用停下来想", em: true }, { t: "。" }],
        ],
        cutNote: "访谈原录 82 字 · 4 行字墙",
      },
      {
        maxTrim: 46,
        lines: [
          [{ t: "忙起来的时候，没人顾得上读三行弹窗说明。" }],
          [{ t: "真正好用的系统不是功能堆得满，" }],
          [{ t: "而是让我手忙脚乱时，" }, { t: "不用停下来想", em: true }, { t: "下一步点哪。" }],
        ],
        cutNote: "初删 52 字 · 略繁琐",
      },
      {
        maxTrim: 66,
        lines: [
          [{ t: "真正好用的系统，不是功能堆得满，" }],
          [{ t: "而是忙起来时" }, { t: "不用停下来想", em: true }, { t: "下一步点哪。" }],
        ],
        cutNote: "再删 30 字 · 接近甜点",
      },
      {
        maxTrim: 88,
        lines: [
          [{ t: "真正好用的系统，" }],
          [{ t: "是忙起来时" }, { t: "不用停下来想", em: true }, { t: "。" }],
        ],
        defaultHighlight: ["不用停下来想"],
        cutNote: "提纯金句 18 字 · 2 行",
      },
      {
        maxTrim: 100,
        lines: [[{ t: "不用想", em: true }, { t: "。" }]],
        defaultHighlight: ["不用想"],
        cutNote: "过度删空 3 字 · 语义模糊",
      },
    ],
    author: {
      vague: { main: "一位匿名受访者", sub: "" },
      clear: { main: "陈护士长", sub: "社区诊所 · 1 对 1 深度访谈记录" },
      bloated: {
        main: "陈女士（化名）· 社区卫生服务中心护理部",
        sub: "拥有十二年基层门诊配药与急诊分诊经验 · 参与本次 2025 秋季医疗软件可用性测试第 04 号样本",
      },
    },
    factNote: "真实汇报常用「用户原声引语页」：署名写清身份角色与调研来源，既保护隐私又具说服力。",
  },

  book: {
    id: "book",
    label: "书页原句",
    deckTopic: "演讲视觉规范",
    prevSlide: {
      kicker: "SLIDE 01 · 常见误区",
      title: "为什么多数团队把幻灯片做成了文档",
      bullets: [
        "把逐字稿整段贴进页面，既当提词器又当会后读物",
        "每页塞进边框、渐变徽章与无关剪贴画，抢走正文注意力",
        "台下观众埋头读满屏细字，几乎听不见讲者的口头补充",
        "整场演讲维持单一高密度节奏，缺乏停顿与情绪锚点",
      ],
    },
    nextSlide: {
      kicker: "SLIDE 03 · 落地准则",
      title: "开讲前只问两句：删掉装饰，留出目光",
      steps: ["先写讲稿再配屏", "每页只放一焦点", "文档另附不塞屏"],
    },
    stages: [
      {
        maxTrim: 22,
        lines: [
          [{ t: "在准备面向团队或公众的视觉演示文稿时，" }],
          [{ t: "很多制作者会把大量时间花在堆砌花哨边框、阴影和" }, { t: "表面装饰", em: true }, { t: "上，" }],
          [{ t: "却忘了幻灯片真正的使命不是炫技，而是去做" }, { t: "服务表达的设计", em: true }, { t: "，" }],
          [{ t: "帮助台下观众一眼" }, { t: "看见你正在说的话", em: true }, { t: "。" }],
        ],
        cutNote: "长段译释 79 字 · 4 行字墙",
      },
      {
        maxTrim: 46,
        lines: [
          [{ t: "幻灯片不是用来堆砌边框与" }, { t: "装饰", em: true }, { t: "的画布，" }],
          [{ t: "你应该做的是服务表达的设计，" }],
          [{ t: "让台下观众一眼" }, { t: "看见你所说的话", em: true }, { t: "。" }],
        ],
        cutNote: "初删 43 字 · 仍偏长",
      },
      {
        maxTrim: 66,
        lines: [
          [{ t: "别把时间花在无关的" }, { t: "装饰", em: true }, { t: "上，" }],
          [{ t: "用设计帮助观众" }, { t: "看见你所说的话", em: true }, { t: "。" }],
        ],
        cutNote: "再删 25 字 · 接近甜点",
      },
      {
        maxTrim: 88,
        lines: [
          [{ t: "做设计，而非做" }, { t: "装饰", em: true }, { t: "。" }],
          [{ t: "帮助他们" }, { t: "看见你所说的话", em: true }, { t: "。" }],
        ],
        defaultHighlight: ["看见你所说的话"],
        enSub: "Practice design, not decoration. Help them see what you are saying.",
        cutNote: "原著凝练 19 字 · 2 行",
      },
      {
        maxTrim: 100,
        lines: [[{ t: "非装饰", em: true }, { t: "。" }]],
        defaultHighlight: ["非装饰"],
        cutNote: "过度删空 3 字 · 丢掉主旨",
      },
    ],
    author: {
      vague: { main: "某演讲导师", sub: "" },
      clear: { main: "Nancy Duarte", sub: "《slide:ology》· O'Reilly · 2008" },
      bloated: {
        main: "Nancy Duarte · Duarte Design CEO",
        sub: "硅谷知名演讲视觉设计公司创始人 · 曾指导多场全球主题演讲 · 著有《slide:ology》(2008) 与《Resonate》(2010)",
      },
    },
    factNote: "已核实一手书源：原句出自由 O'Reilly Media 于 2008 年出版的 Nancy Duarte《slide:ology》终章宣言。",
  },
};

export const INITIAL_STATE = {
  scenario: "poster",
  deckSlide: 1, // 0=前页密字 1=345引语页 2=后页行动
  trim: 8, // 初始停在未删减的 79 字长段（0/4 坏态！）
  mark: "straight", // straight | arc | crushing | bar
  highlights: [], // 被用户点中强调的词文本集合（初始空：平铺无焦点）
  space: "cramped", // cramped | balanced | island
  author: "vague", // none | vague | clear | bloated
  align: "center", // center | left | theater
};

export const PRESETS = {
  posterIdeal: {
    label: "原海报圆弧解",
    patch: { trim: 78, mark: "arc", space: "balanced", author: "clear", align: "center", deckSlide: 1, highlights: null },
  },
  leftModern: {
    label: "左齐竖杠解",
    patch: { trim: 78, mark: "bar", space: "balanced", author: "clear", align: "left", deckSlide: 1, highlights: null },
  },
  theaterMinimal: {
    label: "深场剧场解",
    patch: { trim: 80, mark: "arc", space: "balanced", author: "clear", align: "theater", deckSlide: 1, highlights: null },
  },
  resetBad: {
    label: "复原开场坏态",
    patch: { trim: 8, mark: "straight", space: "cramped", author: "vague", align: "center", deckSlide: 1, highlights: [] },
  },
};

export function getStageForTrim(scenarioKey, trim) {
  const sc = SCENARIOS[scenarioKey] || SCENARIOS.poster;
  for (let i = 0; i < sc.stages.length; i++) {
    if (trim <= sc.stages[i].maxTrim) return { index: i, stage: sc.stages[i] };
  }
  return { index: sc.stages.length - 1, stage: sc.stages[sc.stages.length - 1] };
}

export function extractTokens(stage) {
  const tokens = [];
  for (let li = 0; li < stage.lines.length; li++) {
    for (let si = 0; si < stage.lines[li].length; si++) {
      const seg = stage.lines[li][si];
      tokens.push({ line: li, segIndex: si, text: seg.t, canDefault: !!seg.em });
    }
  }
  return tokens;
}

export function countVisibleChars(stage) {
  let n = 0;
  for (const line of stage.lines) {
    for (const seg of line) {
      n += seg.t.replace(/[，。！？、；：“”‘’\s]/g, "").length;
    }
  }
  return n;
}

// 核心单真源评估：所有画布字号、留白率、阅读时长、4 桩探针、10 类正反错态全由此出
export function evaluate(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const { index: stageIdx, stage } = getStageForTrim(state.scenario, state.trim);
  const chars = countVisibleChars(stage);
  const lineCount = stage.lines.length;

  // 当前阶段实际被点亮的强调字数
  const activeSet = new Set(state.highlights || []);
  let hiChars = 0;
  let hiCount = 0;
  for (const line of stage.lines) {
    for (const seg of line) {
      if (activeSet.has(seg.t)) {
        hiChars += seg.t.replace(/[，。！？、；：“”‘’\s]/g, "").length;
        hiCount++;
      }
    }
  }
  const hiRatio = chars > 0 ? hiChars / chars : 0;

  // 连续字号（以 16:9 礼堂投影等效 pt 计），随 trim 连续微调，保证拖动每帧都有真实物理反馈
  const trimNorm = Math.max(0, Math.min(1, state.trim / 100));
  let basePt;
  if (stageIdx === 0) basePt = 21 + (state.trim / 22) * 3;
  else if (stageIdx === 1) basePt = 27 + ((state.trim - 22) / 24) * 4;
  else if (stageIdx === 2) basePt = 34 + ((state.trim - 46) / 20) * 5;
  else if (stageIdx === 3) basePt = 44 + ((state.trim - 66) / 22) * 6;
  else basePt = 52 + ((state.trim - 88) / 12) * 6;

  // 留白尺度对字号与实占面积的影响
  const spaceMul = state.space === "cramped" ? 0.94 : state.space === "island" ? 0.44 : 1.0;
  const fontPt = Math.round(basePt * spaceMul);

  // 实占面积按 16:9 画布与 stage-canvas.js 完全相同的几何比例实算（单真源）
  const fontHFrac = Math.min(0.13, (fontPt / 260) * 0.66);
  const charWFrac = fontHFrac * (9 / 16);
  const lineHFrac = fontHFrac * (lineCount >= 4 ? 1.52 : 1.38);
  const maxAllowedW = state.space === "cramped" ? 0.80 : 0.74;
  let inkArea = 0;
  let maxLineW = 0;
  for (const line of stage.lines) {
    const lc = line.reduce((a, s) => a + s.t.length, 0);
    const lw = Math.min(maxAllowedW, lc * charWFrac);
    if (lw > maxLineW) maxLineW = lw;
    inkArea += lw * lineHFrac;
  }
  // 多行密集字墙（≥4行）视觉上聚合成整块大矩形（按包围盒计），短金句按各行实际墨面计
  const textArea = lineCount >= 4 ? Math.max(inkArea, maxLineW * (lineCount * lineHFrac) * 0.92) : inkArea;
  const clutterArea = state.space === "cramped" ? 0.30 : 0;
  const authorArea = state.author === "bloated" ? 0.15 : state.author === "none" ? 0 : 0.042;
  const markArea = state.mark === "crushing" ? 0.14 : state.mark === "arc" ? 0.055 : 0.025;
  const occupied = Math.min(0.86, Math.max(0.06, textArea + clutterArea + authorArea + markArea));
  const whitespacePct = Math.round((1 - occupied) * 100);

  // 观众在投影大屏上的扫读耗时估算（示意：按中文快速扫读约 6.5 字/秒经验值 + 行间回扫）
  const readSec = +Math.max(0.5, chars / 6.5 + Math.max(0, lineCount - 1) * 0.18).toFixed(1);

  // ---------- 四桩独立判定（支持双向失误！） ----------
  // 1. 引语视觉引导（mark）
  let pMark;
  if (state.mark === "straight") {
    pMark = {
      ok: false,
      faultId: "straight-quote",
      status: "直引号失格",
      tag: '直引号 " "',
      headline: "用了打字机直引号，没有形成「引语入口」",
      why: "键盘直引号体量单薄、缺乏方向感，放在大屏上既像代码符号，也无法在半秒内告诉观众「现在切换成他人的声音」。",
      fix: "点画布左上引号（或左侧「引语」节点），换成象牙弯引号半环或现代竖杠引线。",
    };
  } else if (state.mark === "crushing") {
    pMark = {
      ok: false,
      faultId: "crushing-quote",
      status: "引号压字",
      tag: "巨型压字",
      headline: "装饰引号太重太暗，把正文首字直接压花了",
      why: "引号是领路灯而不是主角。一旦用高饱和深色巨引号直接压在文字上面，字形轮廓立刻打架，后排观众第一眼只看见两坨色块。",
      fix: "把引号切回低对比象牙弯引号（或利落竖杠），把最高对比度留给引文正文。",
    };
  } else {
    pMark = {
      ok: true,
      faultId: null,
      status: state.mark === "arc" ? "弯引号半环" : "竖杠引线",
      tag: state.mark === "arc" ? "弯引号 · 稳" : "竖杠 · 稳",
      headline: "",
      why: "",
      fix: "",
    };
  }

  // 2. 重点句（凝练度 + 高亮比例，双向判定！）
  let pFocus;
  if (chars > 32) {
    pFocus = {
      ok: false,
      faultId: "wall-of-text",
      status: `${chars} 字过载`,
      tag: `${chars} 字 · ${readSec}s`,
      headline: `塞了 ${chars} 字共 ${lineCount} 行，台下读字就听不见你讲话`,
      why: `按 6.5 字/秒经验扫读速度，观众大约要埋头读 ${readSec} 秒；语音通道与阅读通道正面撞车，引语页原本的「停顿感」变成了念稿感。`,
      fix: "向右横拖画布（或拉动「删词提纯尺」到 70%–85%），把整段原话删剩十几字核心句。",
    };
  } else if (chars < 7) {
    pFocus = {
      ok: false,
      faultId: "over-trimmed",
      status: `仅 ${chars} 字断链`,
      tag: `仅 ${chars} 字 · 缺语境`,
      headline: `删得只剩 ${chars} 个字，观众看不出前后因果`,
      why: "精简不是砍掉前提。把对立关系或主语一起删光后，大屏只剩一句悬空口号，没听过前文的观众无法靠画面记住你的观点。",
      fix: "把删词尺往左回拉一点（回到 70%–85% 区间），保留「对比或转折」的完整短句。",
    };
  } else if (hiChars === 0) {
    pFocus = {
      ok: false,
      faultId: "no-emphasis",
      status: "平铺无重点",
      tag: "未标重点词",
      headline: "句长合适，但整句重量完全一样，缺少落眼点",
      why: "当所有字都用同一种深色等重排列，眼睛在 3 秒内找不到最该带走的那 2–6 个核心词，记忆钩子会弱一截。",
      fix: "直接点击画布引文里的核心词（例如「思考」），给它加上紫粉重点强调。",
    };
  } else if (hiRatio > 0.52) {
    pFocus = {
      ok: false,
      faultId: "over-highlight",
      status: "满屏乱划",
      tag: `高亮 ${Math.round(hiRatio * 100)}%`,
      headline: `高亮占了全句 ${Math.round(hiRatio * 100)}%，全划重点等于没有重点`,
      why: "强调靠的是「少数词与多数词的反差」。当超过一半文字都染成紫色并画上笔触，焦点立刻散开，页面反而显得嘈杂。",
      fix: "再点一下画布上多余的词组取消高亮，只保留 1 处最能代表观点的短语。",
    };
  } else {
    pFocus = {
      ok: true,
      faultId: null,
      status: `${chars} 字 · 聚焦`,
      tag: `${chars} 字 · ${readSec}s`,
      headline: "",
      why: "",
      fix: "",
    };
  }

  // 3. 情绪留白（双向判定：过满窒息 vs 米粒孤岛）
  let pSpace;
  if (state.space === "cramped" || whitespacePct < 48) {
    pSpace = {
      ok: false,
      faultId: "cramped-space",
      status: `留白 ${whitespacePct}%`,
      tag: `拥挤 ${whitespacePct}%`,
      headline: `有效留白只有 ${whitespacePct}%，页眉杂框堵住了呼吸感`,
      why: "引语页靠大面积留白给大脑按下暂停键。四边塞满页眉、编号横条和杂乱色块，观众视线被拉扯到角落，情绪根本静不下来。",
      fix: "点画布外侧留白区（或右侧「情绪留白」节点），切到舒朗留白并清掉多余装饰。",
    };
  } else if (state.space === "island" || fontPt < 24) {
    pSpace = {
      ok: false,
      faultId: "tiny-island",
      status: `过小 ${fontPt}pt`,
      tag: `仅 ${fontPt}pt 看不清`,
      headline: `留白堆到 ${whitespacePct}%，但引文缩成约 ${fontPt}pt 米粒字`,
      why: "情绪留白不是把字往小里缩。投影到大厅后排时，过小的字会让观众眯眼辨认，优雅变成费劲。",
      fix: "把「情绪留白」切回舒朗平衡档，让核心引文回到约 40–50pt 的远距清晰体量。",
    };
  } else {
    pSpace = {
      ok: true,
      faultId: null,
      status: `留白 ${whitespacePct}%`,
      tag: `留白 ${whitespacePct}%`,
      headline: "",
      why: "",
      fix: "",
    };
  }

  // 4. 署名（双向判定：缺失 / 含糊 vs 喧宾夺主）
  let pAuthor;
  if (state.author === "none") {
    pAuthor = {
      ok: false,
      faultId: "no-author",
      status: "缺少署名",
      tag: "无来源",
      headline: "引文下面空着，观众分不清是名言还是你随手写的",
      why: "引语页之所以能借力增信，靠的是「谁在什么场合说过这句话」。没有署名，外部权威和真实证言的效力直接归零。",
      fix: "点画布下方署名区（或左下「署名」节点），补上清晰可核实的来源。",
    };
  } else if (state.author === "vague") {
    pAuthor = {
      ok: false,
      faultId: "vague-author",
      status: "来源含糊",
      tag: "「某设计师」",
      headline: "署名只写「某设计师」，反而拉低整页可信度",
      why: "模糊的「某专家 / 某用户 / 佚名」会让台下本能怀疑这句话是不是现编的。给出明确身份或书名年份，话的分量才立得住。",
      fix: "点画布下方署名区，切到清晰具体的署名与身份说明。",
    };
  } else if (state.author === "bloated") {
    pAuthor = {
      ok: false,
      faultId: "bloated-author",
      status: "署名压主",
      tag: "履历喧宾夺主",
      headline: "署名比引文还抢戏，三行履历抢走了主角风头",
      why: "署名是落款，视觉重量必须明显轻于引文。字号拉太大或贴满整段个人简介，观众视线会被拽到底部，忘了上面那句话。",
      fix: "把署名收束回「人名 + 一句精炼身份或出处」，把绝对重心交还给引文。",
    };
  } else {
    pAuthor = {
      ok: true,
      faultId: null,
      status: "来源清晰",
      tag: "落款克制",
      headline: "",
      why: "",
      fix: "",
    };
  }

  const pillars = { mark: pMark, focus: pFocus, space: pSpace, author: pAuthor };
  const ordered = [pFocus, pSpace, pMark, pAuthor];
  const score = ordered.filter((p) => p.ok).length;
  const primaryFault = ordered.find((p) => !p.ok) || null;

  let solutionName = "";
  let okHeadline = "";
  let okWhy = "";
  if (score === 4) {
    if (state.align === "theater") {
      solutionName = "深场剧场解";
      okHeadline = `4/4 成立 · 深场剧场静默锚点（约 ${readSec}s 扫完）`;
      okWhy = `深宵紫幕底拉高了引文与背景反差，${chars} 字核心句配 ${whitespacePct}% 留白，适合礼堂大屏转场。按 Space 实测从前页切入的 3 秒静场效果。`;
    } else if (state.align === "left" || state.mark === "bar") {
      solutionName = "左齐竖杠现代解";
      okHeadline = `4/4 成立 · 现代左齐竖杠解（约 ${readSec}s 扫完）`;
      okWhy = `左侧鸢尾紫竖杠干脆地划出引语入口，${chars} 字短句起笔齐整，${whitespacePct}% 留白清爽克制，很适合产品发布会与企业复盘。`;
    } else {
      solutionName = "原海报圆弧典范";
      okHeadline = `4/4 成立 · 原海报圆弧典范（约 ${readSec}s 扫完）`;
      okWhy = `象牙弯引号与半圆光环托住 ${chars} 字核心句，焦点词一击即中，${whitespacePct}% 雾紫留白与克制署名让观众抬眼记住整页。`;
    }
  }

  return {
    scenario: sc,
    stageIdx,
    stage,
    chars,
    lineCount,
    hiChars,
    hiCount,
    hiRatio,
    fontPt,
    whitespacePct,
    readSec,
    trimNorm,
    pillars,
    score,
    primaryFault,
    solutionName,
    okHeadline,
    okWhy,
    badge: score === 4 ? `4/4 · ${solutionName}` : `${score}/4 · ${primaryFault.status}`,
  };
}
