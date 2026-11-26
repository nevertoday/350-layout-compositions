// 337 节标题幻灯片版式 · 单真源几何、亮度反差与认知换气模型
// 所有画布绘制、四项橙线探针、诊单文案、波形谷深和点击热区均只从此文件计算。

export const VIRTUAL_W = 1600;
export const VIRTUAL_H = 900;
export const SAFE_X = 112; // 7% 投影水平安全边
export const SAFE_Y = 72;  // 8% 投影垂直安全边

export const DECKS = {
  annual: {
    id: "annual",
    name: "年度复盘 · 12页",
    shortName: "年度复盘",
    prevSlide: {
      num: "04",
      chapter: "01 营收结构",
      title: "四季度区域毛利承压，续费漏斗出现分层",
      bullets: [
        "华东直营环比 +14.2%，华南渠道折损扩大",
        "中端套餐续费率回落 4.8 个百分点",
        "冷链履约单票成本上升 1.6 元",
        "需在二季度重构城市复制模型"
      ],
      bars: [0.82, 0.64, 0.71, 0.49, 0.56]
    },
    section: {
      num: "02",
      total: "04",
      chapters: ["01 营收结构", "02 增长引擎", "03 组织提效", "04 明年预算"],
      shortTitle: "增长引擎",
      enTitle: "GROWTH ENGINE",
      longTitle: "关于第二阶段全渠道商业化增长路径及重点城市落地执行复盘计划",
      vagueTitle: "PART 02",
      vagueEn: "SECTION TWO",
      subLine: "把试点打法复制到八座核心城市",
      agendaItems: [
        "01 华东与华南直营门店标准动线复盘",
        "02 代理商分层返利机制与季度考核口径",
        "03 会员私域复购触达节奏与优惠券核销",
        "04 供应链冷链履约成本拆解与仓配优化",
        "05 三季度市场预算审批边界与风险兜底"
      ],
      proseParas: [
        "承接上一章对四季度区域毛利与续费漏斗的拆解，本章将重点梳理全渠道增长的三大抓手，并同步对比直营与联营两套单店模型的回收周期差异。",
        "同时我们汇总了过去六个月在苏州、杭州和成都试点的九组转化数据，方便各位在进入细表前先对齐核心前提与考核口径。"
      ]
    },
    nextSlide: {
      num: "06",
      chapter: "02 增长引擎",
      title: "单店复制模型：标准化选址与 90 天爬坡曲线",
      cards: ["选址评分模型", "开业 90 天爬坡", "冷链半径 ≤ 120km", "单店盈亏平衡线"]
    }
  },
  launch: {
    id: "launch",
    name: "产品发布 · 10页",
    shortName: "产品发布",
    prevSlide: {
      num: "04",
      chapter: "01 痛点现场",
      title: "云端往返 680ms，弱网场景打断创作心流",
      bullets: [
        "高铁与机舱断网时实时草图直接报错",
        "高峰期并发排队导致首字延迟翻倍",
        "敏感设计稿上传云端触发法务合规拦截",
        "用户需要真正离线即用的本地智能内核"
      ],
      bars: [0.91, 0.78, 0.85, 0.69, 0.74]
    },
    section: {
      num: "02",
      total: "03",
      chapters: ["01 痛点现场", "02 端侧内核", "03 实测交付"],
      shortTitle: "端侧内核",
      enTitle: "ON-DEVICE CORE",
      longTitle: "全新一代低功耗离线端侧推理引擎架构设计与全场景实测说明",
      vagueTitle: "PART 02",
      vagueEn: "NEXT CHAPTER",
      subLine: "断网也能在毫秒内完成本地理解",
      agendaItems: [
        "01 四比特权重量化与内存峰值压缩路径",
        "02 统一显存零拷贝调度与能效实测数据",
        "03 断网离线缓存与增量模型热更新策略",
        "04 隐私沙盒权限边界与本地审计日志",
        "05 开发者插件接口与多端版本兼容计划"
      ],
      proseParas: [
        "在上一部分看完弱网延迟和隐私合规带来的卡顿之后，接下来我们把视角切回设备本身，拆解这套完全在本地运行的推理底座如何压低内存占用。",
        "为了兼顾轻薄本与手机端续航，我们在编译期合并了十二个高频算子，下文将逐一展示功耗对比与真实响应时间。"
      ]
    },
    nextSlide: {
      num: "06",
      chapter: "02 端侧内核",
      title: "零云端往返：18ms 本地响应与 1.4GB 常驻内存",
      cards: ["4-bit 量化压缩", "统一内存零拷贝", "完全离线运行", "功耗降低 42%"]
    }
  },
  defense: {
    id: "defense",
    name: "学术答辩 · 14页",
    shortName: "学术答辩",
    prevSlide: {
      num: "04",
      chapter: "01 实验设计",
      title: "双组对照流程：连续播报与分段停顿变量控制",
      bullets: [
        "两组使用完全相同的 16 步因果讲解脚本",
        "实验组在每段关键节点加入显式章节停顿",
        "控制总学习时长并记录眼动回视次数",
        "分别施测记忆保持题与问题迁移应用题"
      ],
      bars: [0.68, 0.76, 0.84, 0.72, 0.79]
    },
    section: {
      num: "02",
      total: "04",
      chapters: ["01 实验设计", "02 实验发现", "03 机制讨论", "04 边界局限"],
      shortTitle: "实验发现",
      enTitle: "KEY FINDINGS",
      longTitle: "跨组对照实验样本统计显著性检验方法与误差修正结果汇总汇报",
      vagueTitle: "SECTION 02",
      vagueEn: "CHAPTER TWO",
      subLine: "分段停顿如何把迁移理解推高一档",
      agendaItems: [
        "01 记忆保持得分与迁移测试得分均值对比",
        "02 眼动注视热图与跨段回扫频率变化",
        "03 高先验知识组与新手组交互效应检验",
        "04 认知负荷主观量表与客观耗时相关性",
        "05 异常样本剔除标准与稳健性复核结果"
      ],
      proseParas: [
        "根据前述实验分组与测量口径，本节汇总两轮采集到的行为数据与眼动指标，重点检验显式章节边界对复杂因果链条理解的真实影响。",
        "结果显示单纯机械复述差异不大，但要求被试将原理迁移到新情境时，分段组表现出更稳定的结构化召回。"
      ]
    },
    nextSlide: {
      num: "06",
      chapter: "02 实验发现",
      title: "新手组在迁移应用题上获益最明显，回视减少",
      cards: ["迁移成绩提升", "工作记忆减负", "眼动回视下降", "专家反转边界"]
    }
  }
};

export const SURFACES = {
  same: {
    id: "same",
    label: "同底浅页",
    bg: "#F7F1E7",
    ink: "#0D2426",
    muted: "#485E60",
    accent: "#B53D04",
    accentGraphic: "#F16318",
    lum: 0.889
  },
  dark: {
    id: "dark",
    label: "深石油青",
    bg: "#012527",
    ink: "#F5E4CE",
    muted: "#A6C2C0",
    accent: "#FF8240",
    accentGraphic: "#F16318",
    lum: 0.017
  },
  orange: {
    id: "orange",
    label: "信号炽橙",
    bg: "#D94F0A",
    ink: "#FFF6EB",
    muted: "#FFE1C8",
    accent: "#012527",
    accentGraphic: "#012527",
    lum: 0.148
  },
  noisy: {
    id: "noisy",
    label: "花哨噪底",
    bg: "#5D2E8C",
    ink: "#F8F3D4",
    muted: "#DFC8F7",
    accent: "#FFCA28",
    accentGraphic: "#FF5E7E",
    lum: 0.092
  }
};

export const NEIGHBOR_BG = "#F7F1E7";
export const NEIGHBOR_LUM = 0.889;

export const INITIAL_STATE = {
  deckId: "annual",
  scrub: 0.5, // 0 = Slide 04, 0.5 = Slide 05 (节标题), 1 = Slide 06
  cueMode: "long",       // long | vague | clear | progress
  surfaceMode: "same",   // same | dark | orange | noisy
  moodMode: "flat",      // flat | ribbon | numeral | horizon
  payloadMode: "bullets",// bullets | prose | subline | minimal
  titlePt: 36            // 24 .. 96
};

export const PRESETS = {
  darkClassic: {
    label: "深青反色解",
    kind: "valid",
    patch: { cueMode: "clear", surfaceMode: "dark", moodMode: "ribbon", payloadMode: "subline", titlePt: 70, scrub: 0.5 }
  },
  orangeFull: {
    label: "炽橙满铺解",
    kind: "valid",
    patch: { cueMode: "clear", surfaceMode: "orange", moodMode: "numeral", payloadMode: "minimal", titlePt: 78, scrub: 0.5 }
  },
  progressAnchor: {
    label: "进度锚点解",
    kind: "valid",
    patch: { cueMode: "progress", surfaceMode: "dark", moodMode: "horizon", payloadMode: "subline", titlePt: 64, scrub: 0.5 }
  },
  errSameBg: {
    label: "试错：同底隐形",
    kind: "error",
    patch: { cueMode: "clear", surfaceMode: "same", moodMode: "ribbon", payloadMode: "subline", titlePt: 68, scrub: 0.5 }
  },
  errTooEmpty: {
    label: "试错：只写Part 2",
    kind: "error",
    patch: { cueMode: "vague", surfaceMode: "dark", moodMode: "numeral", payloadMode: "minimal", titlePt: 76, scrub: 0.5 }
  },
  errStuffed: {
    label: "试错：塞满议程",
    kind: "error",
    patch: { cueMode: "clear", surfaceMode: "dark", moodMode: "ribbon", payloadMode: "bullets", titlePt: 58, scrub: 0.5 }
  },
  resetBad: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_STATE }
  }
};

// 按虚拟坐标像素宽逐字折行，确保几何测算和 Canvas 渲染严格一致
export function wrapText(text, fontSize, maxWidth) {
  const lines = [];
  let line = "";
  let lineW = 0;
  for (const ch of text) {
    const isAscii = ch.charCodeAt(0) < 128;
    const cw = isAscii ? (ch === " " ? fontSize * 0.34 : fontSize * 0.62) : fontSize * 1.02;
    if (line && lineW + cw > maxWidth) {
      lines.push({ text: line, width: lineW });
      line = ch;
      lineW = cw;
    } else {
      line += ch;
      lineW += cw;
    }
  }
  if (line) lines.push({ text: line, width: lineW });
  return lines;
}

function charCount(str) {
  return [...str.replace(/\s+/g, "")].length;
}

// 核心单真源：计算 05 号节标题页所有实绘矩形、留白比例、明度反差与扫读时间
export function computeSlideGeometry(state) {
  const deck = DECKS[state.deckId] || DECKS.annual;
  const sec = deck.section;
  const surf = SURFACES[state.surfaceMode] || SURFACES.same;
  const titlePt = Math.max(24, Math.min(96, Math.round(state.titlePt)));
  const titlePx = titlePt * 1.38; // 1600×900 画布下的实绘像素字号

  // 可排版有效区（海报弯带和平铺杂块都在右侧占槽，避免文字框撞进右列图形）
  const hasRightRibbon = state.moodMode === "ribbon";
  const hasRightFlat = state.moodMode === "flat";
  const rightLimit = hasRightRibbon ? VIRTUAL_W - 260 : hasRightFlat ? VIRTUAL_W - 310 : VIRTUAL_W - SAFE_X;
  const leftX = state.moodMode === "numeral" ? 132 : SAFE_X;
  const colW = Math.max(660, rightLimit - leftX);

  // 1. 决定标题文案与章号
  let titleText = sec.shortTitle;
  let enText = sec.enTitle;
  let hasChapterNum = false;
  if (state.cueMode === "long") {
    titleText = sec.longTitle;
    enText = "CHAPTER OVERVIEW";
    hasChapterNum = false;
  } else if (state.cueMode === "vague") {
    titleText = sec.vagueTitle;
    enText = sec.vagueEn;
    hasChapterNum = true;
  } else if (state.cueMode === "clear" || state.cueMode === "progress") {
    titleText = sec.shortTitle;
    enText = sec.enTitle;
    hasChapterNum = true;
  }

  // 2. 折行计算标题框（巨字模式下可能自然越出安全边）
  const wrapWidth = state.moodMode === "flat" ? colW - 24 : colW - 20;
  const titleLines = wrapText(titleText, titlePx, wrapWidth);
  const maxLineW = Math.max(...titleLines.map((l) => l.width), titlePx * 2);
  const titleLineH = titlePx * 1.18;
  const titleH = titleLines.length * titleLineH;

  // 垂直锚位：精简页落在黄金偏上（光学中心 38%），塞满内容时被迫顶到上沿
  const isHeavyPayload = state.payloadMode === "bullets" || state.payloadMode === "prose";
  const baseTop = isHeavyPayload ? 116 : (state.moodMode === "horizon" ? 248 : 268);

  // 章号区 / 进度条
  const cueBox = hasChapterNum
    ? {
        x: leftX,
        y: state.cueMode === "progress" ? 96 : Math.max(82, baseTop - 88),
        w: state.cueMode === "progress" ? colW : 260,
        h: state.cueMode === "progress" ? 44 : 58
      }
    : null;

  // 标题实绘框
  const titleY = cueBox ? Math.max(baseTop, cueBox.y + cueBox.h + 26) : baseTop;
  const titleBox = {
    x: leftX,
    y: titleY,
    w: maxLineW,
    h: titleH,
    lines: titleLines,
    fontSize: titlePx,
    lineHeight: titleLineH
  };

  // 英文副标框
  const enFontSize = Math.max(20, Math.min(28, titlePx * 0.34));
  const enBox = {
    x: leftX,
    y: titleBox.y + titleBox.h + 16,
    w: Math.min(colW, enText.length * enFontSize * 0.64),
    h: enFontSize * 1.2,
    text: enText,
    fontSize: enFontSize
  };

  // 信息负荷区（payload）
  let payloadBox = null;
  let payloadLines = [];
  let payloadChars = 0;
  const payloadY = enBox.y + enBox.h + 28;
  if (state.payloadMode === "bullets") {
    const fs = 27;
    const lh = 78; // 含每条议程下的细目拆解行，真实还原被提纲塞满的压迫感
    payloadLines = sec.agendaItems.map((it) => ({ text: it, size: fs }));
    payloadChars = sec.agendaItems.reduce((s, it) => s + charCount(it), 0);
    payloadBox = {
      x: leftX,
      y: payloadY,
      w: colW * 0.96,
      h: sec.agendaItems.length * lh + 20,
      kind: "bullets",
      fontSize: fs,
      lineHeight: lh
    };
  } else if (state.payloadMode === "prose") {
    const fs = 28;
    const lh = 52;
    const p1 = wrapText(sec.proseParas[0], fs, colW * 0.94);
    const p2 = wrapText(sec.proseParas[1], fs, colW * 0.94);
    payloadLines = [...p1.map((l) => ({ text: l.text, para: 0 })), ...p2.map((l) => ({ text: l.text, para: 1 }))];
    payloadChars = charCount(sec.proseParas[0]) + charCount(sec.proseParas[1]);
    payloadBox = {
      x: leftX,
      y: payloadY,
      w: colW * 0.94,
      h: payloadLines.length * lh + 48,
      kind: "prose",
      fontSize: fs,
      lineHeight: lh
    };
  } else if (state.payloadMode === "subline") {
    const fs = 30;
    const wrapped = wrapText(sec.subLine, fs, colW * 0.85);
    payloadLines = wrapped.map((l) => ({ text: l.text }));
    payloadChars = charCount(sec.subLine);
    payloadBox = {
      x: leftX,
      y: payloadY + 8,
      w: Math.max(...wrapped.map((l) => l.width), 240),
      h: wrapped.length * (fs * 1.45),
      kind: "subline",
      fontSize: fs,
      lineHeight: fs * 1.45
    };
  }

  // 情绪视觉锚点面积核算（按实绘几何扣除，不瞎写常量）
  let motifArea = 0;
  let motifBox = null;
  if (state.moodMode === "ribbon") {
    motifArea = 185 * VIRTUAL_H * 0.48 + VIRTUAL_W * 30 * 0.42 + Math.PI * 58 * 58 * 0.5;
    motifBox = { x: VIRTUAL_W - 196, y: 0, w: 196, h: VIRTUAL_H };
  } else if (state.moodMode === "numeral") {
    motifArea = 380 * 320 * 0.32;
    motifBox = { x: VIRTUAL_W - 500, y: 120, w: 410, h: 360 };
  } else if (state.moodMode === "horizon") {
    motifArea = VIRTUAL_W * 160 * 0.34;
    motifBox = { x: 0, y: VIRTUAL_H - 220, w: VIRTUAL_W, h: 220 };
  } else if (state.moodMode === "flat") {
    motifArea = 4 * 158 * 124 * 0.95;
    motifBox = { x: VIRTUAL_W - 266, y: 118, w: 170, h: 560 };
  }

  // 噪底视觉干扰等效占用
  const noiseArea = state.surfaceMode === "noisy" ? VIRTUAL_W * VIRTUAL_H * 0.24 : 0;

  // 实测墨面与有效留白率（基于实绘块外包盒面积核算）
  const slideArea = VIRTUAL_W * VIRTUAL_H;
  const titleInkArea = titleLines.reduce((sum, l) => sum + l.width * titleLineH * 1.15, 0);
  const enInkArea = enBox.w * enBox.h * 1.1;
  const cueInkArea = cueBox ? cueBox.w * cueBox.h * (state.cueMode === "progress" ? 0.58 : 0.72) : 0;
  const payloadInkArea = payloadBox
    ? payloadBox.w * payloadBox.h * (state.payloadMode === "subline" ? 0.85 : 1.05)
    : 0;

  const occupied = Math.min(slideArea * 0.88, titleInkArea + enInkArea + cueInkArea + payloadInkArea + motifArea + noiseArea);
  const whitespacePct = Math.max(12, Math.min(92, Math.round((1 - occupied / slideArea) * 100)));

  // 检查是否越出安全边距（下沿或右沿）
  const bottomMost = Math.max(
    titleBox.y + titleBox.h,
    enBox.y + enBox.h,
    payloadBox ? payloadBox.y + payloadBox.h : 0
  );
  const rightMost = Math.max(
    titleBox.x + titleBox.w,
    payloadBox ? payloadBox.x + payloadBox.w : 0
  );
  const overflowBottom = bottomMost > VIRTUAL_H - SAFE_Y - (state.moodMode === "ribbon" ? 48 : 0);
  const overflowRight = rightMost > rightLimit + 8;
  const overflowSafeEdge = overflowBottom || overflowRight || titlePt > 88 && titleLines.length >= 2;

  // 相邻内容页（04 与 06）的相对明度差 ΔL
  const deltaL = Math.abs(NEIGHBOR_LUM - surf.lum);

  // 总字数与预计扫读秒数（示意：按中文演讲抬头扫视约 4.5 字/秒 + 视觉定位 0.6s 估算）
  const titleChars = charCount(titleText);
  const totalChars = titleChars + payloadChars + (hasChapterNum ? 2 : 0);
  const scanSec = Number((0.55 + totalChars / 4.8 + (state.surfaceMode === "noisy" ? 1.4 : 0)).toFixed(1));

  // 认知负荷曲线高度（0..1，越低代表越轻松换气）
  const densityLoad = Math.min(1, Math.max(0.12, (100 - whitespacePct) / 68));
  const cuePenalty = state.cueMode === "long" ? 0.2 : state.cueMode === "vague" ? 0.16 : 0;
  const transPenalty = deltaL < 0.25 ? 0.18 : state.surfaceMode === "noisy" ? 0.24 : 0;
  const sectionLoad = Math.min(0.95, Math.max(0.16, densityLoad * 0.62 + cuePenalty + transPenalty));

  return {
    deck,
    sec,
    surf,
    titlePt,
    titlePx,
    titleText,
    titleChars,
    totalChars,
    hasChapterNum,
    leftX,
    rightLimit,
    colW,
    cueBox,
    titleBox,
    enBox,
    payloadBox,
    payloadLines,
    motifBox,
    bottomMost,
    overflowBottom,
    overflowRight,
    overflowSafeEdge,
    whitespacePct,
    deltaL,
    scanSec,
    sectionLoad,
    prevLoad: 0.85,
    nextLoad: 0.87
  };
}

// 连续波形采样：u ∈ [0, 1]，0.0 = 04页中心，0.5 = 05节标题中心，1.0 = 06页中心
export function sampleLoadCurve(u, geom) {
  const gauss = (x, mu, sig) => Math.exp(-((x - mu) ** 2) / (2 * sig * sig));
  const dip = gauss(u, 0.5, 0.155);
  const base = geom.prevLoad * (1 - u) + geom.nextLoad * u;
  const wave = Math.sin(u * Math.PI * 6) * 0.025;
  return Math.max(0.12, Math.min(0.96, base * (1 - dip) + geom.sectionLoad * dip + wave * (1 - dip * 0.6)));
}

// 单真源诊断：严格基于 computeSlideGeometry 的实绘结果判定四项支柱
export function auditSlide(state) {
  const g = computeSlideGeometry(state);

  // 1. 章节提示 SECTION CUE
  let cueOk = false;
  let cueTag = "成立";
  let cueCode = "ok";
  if (state.cueMode === "vague") {
    cueTag = "无方向空题";
    cueCode = "vague";
  } else if (state.cueMode === "long" || g.titleBox.lines.length >= 3) {
    cueTag = `${g.titleChars}字 · ${g.titleBox.lines.length}行`;
    cueCode = "long";
  } else if (g.overflowSafeEdge) {
    cueTag = "巨字越安全边";
    cueCode = "overflow";
  } else if (g.titlePt < 44) {
    cueTag = `仅 ${g.titlePt}pt 偏弱`;
    cueCode = "small";
  } else {
    cueOk = true;
    cueTag = state.cueMode === "progress" ? `进度 ${g.sec.num}/${g.sec.total}` : `${g.sec.num} · ${g.titlePt}pt`;
  }

  // 2. 转场 TRANSITION
  let transOk = false;
  let transTag = "成立";
  let transCode = "ok";
  if (state.surfaceMode === "same" || g.deltaL < 0.25) {
    transTag = `同底 ΔL ${g.deltaL.toFixed(2)}`;
    transCode = "same";
  } else if (state.surfaceMode === "noisy") {
    transTag = "噪底失焦";
    transCode = "noisy";
  } else {
    transOk = true;
    transTag = `反差 ΔL ${g.deltaL.toFixed(2)}`;
  }

  // 3. 情绪建立 MOOD
  let moodOk = false;
  let moodTag = "成立";
  let moodCode = "ok";
  if (state.surfaceMode === "noisy") {
    moodTag = "色噪跳戏";
    moodCode = "noisy";
  } else if (state.moodMode === "flat") {
    moodTag = "平铺无锚";
    moodCode = "flat";
  } else if (g.titlePt < 44) {
    moodTag = "气场不足";
    moodCode = "small";
  } else {
    moodOk = true;
    moodTag = state.moodMode === "ribbon" ? "海报弯带" : state.moodMode === "numeral" ? "巨号衬底" : "意境留白";
  }

  // 4. 信息留白 WHITESPACE
  let wsOk = false;
  let wsTag = `留白 ${g.whitespacePct}%`;
  let wsCode = "ok";
  if (state.payloadMode === "bullets") {
    wsTag = `5条议程 · ${g.whitespacePct}%`;
    wsCode = "bullets";
  } else if (state.payloadMode === "prose") {
    wsTag = `两段正文 · ${g.whitespacePct}%`;
    wsCode = "prose";
  } else if (g.overflowSafeEdge) {
    wsTag = "压迫安全边";
    wsCode = "overflow";
  } else if (g.whitespacePct < 64) {
    wsTag = `偏挤 ${g.whitespacePct}%`;
    wsCode = "tight";
  } else {
    wsOk = true;
    wsTag = `留白 ${g.whitespacePct}%`;
  }

  const score = [cueOk, transOk, moodOk, wsOk].filter(Boolean).length;

  // 按最影响观众体验的顺序生成单真源诊单与一步纠偏
  let issue;
  if (transCode === "same") {
    issue = {
      code: "same",
      badge: `${score}/4 · 同底隐形转场`,
      headline: `05 页与前后内容页完全同底（ΔL ${g.deltaL.toFixed(2)}），翻过去毫无转场信号`,
      why: "04 页和 06 页都是高密度浅米内容页。如果节标题页也用同一块浅底，观众视野里没有出现光暗顿挫，大脑不会触发事件边界，会误以为这只是下一页未写完的正文。",
      action: "直接点击画布里的 05 页底色，或切到「深石油青」/「信号炽橙」建立强反差转场。",
      fixLabel: "切深石油青反色转场",
      fixPatch: { surfaceMode: "dark" }
    };
  } else if (transCode === "noisy") {
    issue = {
      code: "noisy",
      badge: `${score}/4 · 噪底打架失焦`,
      headline: "撞色纹理背景抢了文字的戏，情绪转折变成了视觉噪音",
      why: "节标题页用色块或反色拉起情绪，但必须保持与整套母版同源的克制配色。杂乱高饱和撞色不仅压低文字对比度，还让这页像是从别的演示文稿里拼贴进来的。",
      action: "把背景切回与主色同系的「深石油青」或「信号炽橙」纯色面。",
      fixLabel: "改回深石油青纯底",
      fixPatch: { surfaceMode: "dark" }
    };
  } else if (wsCode === "bullets" || wsCode === "prose") {
    issue = {
      code: wsCode,
      badge: `${score}/4 · 信息过载窒息`,
      headline: wsCode === "bullets"
        ? `节标题页硬塞了 5 条议程（共 ${g.totalChars} 字），实测留白只剩 ${g.whitespacePct}%`
        : `两段前情摘要占满版面（共 ${g.totalChars} 字），观众低头默读不再听你说话`,
      why: `按示意估算，读完当前页面需要约 ${g.scanSec} 秒。节标题的职责是清空上一章的工作记忆，一旦把正文提纲搬进来，负荷曲线就压不下去，换气阀失效了。`,
      action: "点击画布里的冗长文字区，删成「一句话导语」或「极简纯标题」，把留白放回 65% 以上。",
      fixLabel: "删繁就简，仅留一句话导语",
      fixPatch: { payloadMode: "subline" }
    };
  } else if (cueCode === "vague") {
    issue = {
      code: "vague",
      badge: `${score}/4 · 少过头失方向`,
      headline: `留白高达 ${g.whitespacePct}%，但只写「${g.titleText}」没有主题，观众依然迷路`,
      why: "海报写着「少即是多，只保留方向与重点」——删掉的是论据和细节，不是路标。只剩章号没有主题词，后排观众看一眼屏幕还是不知道下一章究竟要谈什么。",
      action: "点击画布标题区，补上 4–8 字具体章节主题（或带进度锚点），让方向一眼可读。",
      fixLabel: `补全章节主题「${g.sec.num} · ${g.sec.shortTitle}」`,
      fixPatch: { cueMode: "clear" }
    };
  } else if (cueCode === "long") {
    issue = {
      code: "long",
      badge: `${score}/4 · 公文长题难扫`,
      headline: `标题塞了 ${g.titleChars} 个字并断成 ${g.titleBox.lines.length} 行，抬眼 2 秒根本读不完`,
      why: "节标题页是给演讲者开口转场争取 2 秒视觉停顿的。把整句公文报告名搬上章节页，观众被迫逐字默读，反而漏听了你最关键的转场过渡词。",
      action: "点击画布里的长标题，收束成 4–8 字核心主题词，并配清晰章号。",
      fixLabel: `精炼标题为「${g.sec.shortTitle}」`,
      fixPatch: { cueMode: "clear", titlePt: Math.max(66, g.titlePt) }
    };
  } else if (cueCode === "overflow" || wsCode === "overflow") {
    issue = {
      code: "overflow",
      badge: `${score}/4 · 巨字压破安全边`,
      headline: `标题放大到 ${g.titlePt}pt 后已贴近或越出 7% 投影安全边距`,
      why: "投影仪镜头裁切和会议室屏幕边框常会吃掉边缘 5%–7% 画面。大字带来气场，但必须守住外围呼吸框，否则整页显得局促笨重。",
      action: "把「标题尺度」稍微回调到 56–78pt，让文字稳稳停在安全框内。",
      fixLabel: "回调标题字号到 70pt",
      fixPatch: { titlePt: 70 }
    };
  } else if (cueCode === "small" || moodCode === "small") {
    issue = {
      code: "small",
      badge: `${score}/4 · 字号偏弱立不住`,
      headline: `主标题只有 ${g.titlePt}pt，远看和普通内容页小标题拉不开层级`,
      why: "后排观众需要一抬头就能凭字号压倒性优势确认「换章节了」。把节标题放回 52–80pt 区间，才能撑起单页留白的视觉锚点。",
      action: "向右拉动「标题尺度」到 60–78pt。",
      fixLabel: "放大主标题到 70pt",
      fixPatch: { titlePt: 70 }
    };
  } else if (moodCode === "flat") {
    issue = {
      code: "flat",
      badge: `${score}/4 · 构图平铺缺情绪`,
      headline: "版面散放杂项装饰块，缺少统一的视觉锚点与转场情绪",
      why: "单靠黑底白字只完成了一半转场。用一道品牌弯带、巨号章节数字或极简地平线把大面积留白稳稳「钉」住，整页才会从「空白」变成「有气场的留白」。",
      action: "点击画布右侧情绪区，切换到「海报弯带」「巨号衬底」或「意境地平线」。",
      fixLabel: "启用原海报炽橙弯带构图",
      fixPatch: { moodMode: "ribbon" }
    };
  } else if (wsCode === "tight") {
    issue = {
      code: "tight",
      badge: `${score}/4 · 留白偏紧`,
      headline: `当前实测留白 ${g.whitespacePct}%，略低于舒适换气区间（≥ 64%）`,
      why: "节标题页之所以能让紧绷的观众松一口气，靠的就是大面积无信息静默区。稍微缩小标题字号或省去副标，就能把留白再让出来。",
      action: "适当微调标题字号或切到极简纯标题。",
      fixLabel: "优化字号至 66pt 释放留白",
      fixPatch: { titlePt: 66 }
    };
  } else {
    const styleName =
      state.surfaceMode === "orange"
        ? "炽橙满铺转场"
        : state.cueMode === "progress"
        ? "进度锚点转场"
        : "深青反色转场";
    issue = {
      code: "pass",
      badge: `4/4 · ${styleName}成立`,
      headline: `实测留白 ${g.whitespacePct}%、相邻反差 ΔL ${g.deltaL.toFixed(2)}，约 ${g.scanSec} 秒即可扫读完并完成换气`,
      why: "前后两张浅底高密度数据页把负荷波形拉到高位，你刚修好的 05 页在中间切出了一道清晰的低负荷深谷——观众先收拢上一章，再带着明确方向走进下一章。",
      action: "横拖画布在 04 → 05 → 06 间来回推演，或按空格键播放三页节奏，也可以换「炽橙满铺解」「进度锚点解」对比。",
      fixLabel: "播放 04 → 05 → 06 转场",
      fixPatch: null
    };
  }

  return {
    geom: g,
    score,
    pillars: {
      cue: { ok: cueOk, tag: cueTag, code: cueCode },
      transition: { ok: transOk, tag: transTag, code: transCode },
      mood: { ok: moodOk, tag: moodTag, code: moodCode },
      whitespace: { ok: wsOk, tag: wsTag, code: wsCode }
    },
    issue
  };
}
