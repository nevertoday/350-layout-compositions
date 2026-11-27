// 344 大数字页幻灯片版式 — 单真源几何、对比度与四柱诊断模型
// 读数、画布包围盒、15 米后排闪读路径、状态徽章全部从同一份实算结果派生，绝不写死常量。

export const SCENARIOS = {
  poster: {
    id: "poster",
    tab: "原海报 · 学习效率",
    rawNum: "72.48%",
    cleanNum: "72%",
    dir: "↗",
    label: "学习效率 提升",
    anchorNote: "对比纯文字大纲页 · 课后 48 小时回忆测验（教学演示口径）",
    vagueNote: "研究表明，采用大数字突出核心数据的幻灯片，可提升信息传达效果与记忆留存率。",
    wallNote: "根据跨年度多组课堂对照观察记录显示，在包含大量项目符号、背景说明与二级子标题的常规演示页面中，听众往往在翻页初期将视觉注意力分散于文字检索；而将最核心的量化结果单独抽离并放大展示后，现场理解速度与会后回忆留存均有明显改善，同时讲者口头解释空间也更充裕。",
    extras: [
      { id: "e1", num: "4.2×", label: "翻页首眼速度" },
      { id: "e2", num: "186万", label: "累计测试样本" },
      { id: "e3", num: "91.4%", label: "课后满意评分" },
    ],
  },
  keynote: {
    id: "keynote",
    tab: "发布会 · 续航跃升",
    rawNum: "28.6h",
    cleanNum: "28h",
    dir: "↗",
    label: "连续视频播放续航",
    anchorNote: "较上一代提升 6 小时 · 实验室 50% 亮度实测",
    vagueNote: "测试表明，新款芯片与电池架构显著延长了日常移动办公与娱乐续航表现。",
    wallNote: "得益于新一代低功耗制程、自适应屏幕刷新率调度算法以及主板堆叠空间的重新优化，本代机型在视频解码、在线会议、离线文档编辑与多任务待机等复合负载场景下的能效表现全面提升，即使跨洲长途飞行也无需中途寻找插座补电，同时机身重量保持不变。",
    extras: [
      { id: "e1", num: "192g", label: "整机轻薄重量" },
      { id: "e2", num: "3.1×", label: "图形算力涨幅" },
      { id: "e3", num: "35分", label: "半数快充耗时" },
    ],
  },
  review: {
    id: "review",
    tab: "季报复盘 · 次日留存",
    rawNum: "54.17%",
    cleanNum: "54%",
    dir: "↗",
    label: "新用户次日留存",
    anchorNote: "较旧版 31% 提升 23 个百分点 · 上线 30 天 · 1.8 万样本",
    vagueNote: "复盘数据显示，新版引导流程上线后，整体用户留存表现取得了突破性进步。",
    wallNote: "本季度增长团队围绕首日注册流失痛点重构了三步新手引导路径，删去五项非必填资料表单并提前展示首个可交互样本页。截至月末统计周期结束，各渠道新注册用户的次日回访率、七日留存率以及核心功能首次触发完成率均同步走高，拉动整体活跃大盘稳步上扬。",
    extras: [
      { id: "e1", num: "31%", label: "旧版基线留存" },
      { id: "e2", num: "1.8万", label: "统计样本量" },
      { id: "e3", num: "2.4分", label: "首单完成耗时" },
    ],
  },
};

export const LAYOUTS = {
  slash: {
    id: "slash",
    label: "原海报斜切",
    bg: "#F64316",
    numColor: "#F3EADB",
    numLowColor: "#D9663B",
    wedgeBg: "#0A0B08",
    wedgeText: "#F3EADB",
    wedgeMuted: "#CFC5B6",
    accent: "#F3EADB",
    isDark: false,
  },
  split: {
    id: "split",
    label: "暗场左数右释",
    bg: "#0D0D0B",
    numColor: "#F3EADB",
    numLowColor: "#46423D",
    wedgeBg: "#171512",
    wedgeText: "#F3EADB",
    wedgeMuted: "#C2B9AA",
    accent: "#F64316",
    isDark: true,
  },
  center: {
    id: "center",
    label: "暖骨极简居中",
    bg: "#F3EADB",
    numColor: "#0A0B08",
    numLowColor: "#CBC2B4",
    wedgeBg: "#0A0B08",
    wedgeText: "#F3EADB",
    wedgeMuted: "#CFC5B6",
    accent: "#F64316",
    isDark: false,
  },
};

export const CONTEXT_MODES = {
  wall: { id: "wall", label: "百字小作文" },
  bare: { id: "bare", label: "空降孤数" },
  vague: { id: "vague", label: "无基线泛断言" },
  anchor: { id: "anchor", label: "一语锚定+口径" },
};

export const SCALE_MIN = 1.5;
export const SCALE_MAX = 15.5;
export const SAFE_SCALE_MIN = 5.0;
export const SAFE_SCALE_MAX = 13.0;

// 默认开场坏态：0/4 复合翻车（4数争宠 + 1.8× 弱级差 + 冗余小数 + 百字小作文）
export function initialState() {
  return {
    scenario: "poster",
    layout: "slash",
    scale: 1.8, // heroPx / bodyPx 倍率
    precision: "raw", // "raw" | "clean"
    contextMode: "wall", // "wall" | "bare" | "vague" | "anchor"
    contrastMode: "high", // "high" | "low"
    activeExtras: ["e1", "e2", "e3"], // 3张副数字卡在屏上争宠
  };
}

// 合法多解预设 + 双向试错预设
export const PRESETS = {
  posterGood: {
    label: "原海报斜切解",
    patch: { layout: "slash", scale: 10.6, precision: "clean", contextMode: "anchor", contrastMode: "high", activeExtras: [] },
  },
  keynoteGood: {
    label: "发布会暗场解",
    patch: { layout: "split", scale: 9.4, precision: "clean", contextMode: "anchor", contrastMode: "high", activeExtras: [] },
  },
  minimalGood: {
    label: "暖骨极简解",
    patch: { layout: "center", scale: 10.0, precision: "clean", contextMode: "anchor", contrastMode: "high", activeExtras: [] },
  },
  brokenStart: {
    label: "复原开场坏态",
    patch: { layout: "slash", scale: 1.8, precision: "raw", contextMode: "wall", contrastMode: "high", activeExtras: ["e1", "e2", "e3"] },
  },
  errOversize: {
    label: "拉爆裁切",
    patch: { layout: "slash", scale: 15.2, precision: "raw", contextMode: "anchor", contrastMode: "high", activeExtras: [] },
  },
  errBare: {
    label: "空降孤数",
    patch: { layout: "slash", scale: 10.4, precision: "clean", contextMode: "bare", contrastMode: "high", activeExtras: [] },
  },
  errVague: {
    label: "无基线断言",
    patch: { layout: "slash", scale: 10.4, precision: "clean", contextMode: "vague", contrastMode: "high", activeExtras: [] },
  },
  errLowContrast: {
    label: "低反差发灰",
    patch: { layout: "slash", scale: 10.4, precision: "clean", contextMode: "anchor", contrastMode: "low", activeExtras: [] },
  },
};

// WCAG 2.1 相对亮度与对比度单真源计算
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function relLum([r, g, b]) {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrastRatio(hexA, hexB) {
  const l1 = relLum(hexToRgb(hexA));
  const l2 = relLum(hexToRgb(hexB));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 依据标准 16:9 幻灯片逻辑坐标系（960 × 540）精确计算每个元素的包围盒与诊断
export const SLIDE_W = 960;
export const SLIDE_H = 540;

export function evaluate(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const lay = LAYOUTS[state.layout] || LAYOUTS.slash;
  const numText = state.precision === "clean" ? sc.cleanNum : sc.rawNum;
  const numColor = state.contrastMode === "high" ? lay.numColor : lay.numLowColor;
  const ratioWCAG = contrastRatio(numColor, lay.bg);

  // 基准正文字号（在 960×540 16:9 投影画面内约 22px，对应常规幻灯片 18pt 正文）
  const bodyPx = 22;
  const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, Number(state.scale) || 1.8));
  const heroPx = bodyPx * scale;

  // 精确估算数字实绘宽高（Outfit 900 数字字宽系数：常规字符 0.56，小数点 0.24，% 0.78，中文单位 0.86）
  let glyphWidthUnits = 0;
  for (const ch of numText) {
    if (ch === ".") glyphWidthUnits += 0.25;
    else if (ch === "%") glyphWidthUnits += 0.78;
    else if (ch === "h" || ch === "s") glyphWidthUnits += 0.58;
    else if (/[\u4e00-\u9fff]/.test(ch)) glyphWidthUnits += 0.88;
    else glyphWidthUnits += 0.57;
  }
  const heroW = heroPx * glyphWidthUnits;
  const heroH = heroPx * 0.76; // 视觉字高（cap height）

  // 按版式计算数字中心、安全边界与说明区包围盒
  let heroBox;
  let wedgeBox;
  let wedgePoly = null;
  let extraBoxes = [];

  const extrasList = sc.extras.filter((e) => state.activeExtras.includes(e.id));
  const extraCount = extrasList.length;

  if (lay.id === "slash") {
    // 1:1 承袭 344 原海报：上方朱橙场，底沿左高右低斜切纯黑楔角
    const wedgeLeftY = state.contextMode === "wall" ? 310 : 352;
    const wedgeRightY = state.contextMode === "wall" ? 415 : 446;
    wedgePoly = [
      { x: 0, y: wedgeLeftY },
      { x: SLIDE_W, y: wedgeRightY },
      { x: SLIDE_W, y: SLIDE_H },
      { x: 0, y: SLIDE_H },
    ];
    wedgeBox = { x: 42, y: wedgeLeftY + 14, w: SLIDE_W - 220, h: SLIDE_H - wedgeLeftY - 24 };

    // 有多张副卡时，主数和副卡被迫排成上方多格，失去居中垄断
    if (extraCount > 0) {
      const cols = extraCount + 1;
      const totalW = SLIDE_W - 88;
      const gap = 18;
      const cellW = (totalW - gap * (cols - 1)) / cols;
      const cx = 44 + cellW / 2;
      const cy = 178;
      heroBox = { x: cx - heroW / 2, y: cy - heroH / 2, w: heroW, h: heroH, cx, cy };
      extrasList.forEach((item, idx) => {
        const ex = 44 + (idx + 1) * (cellW + gap);
        extraBoxes.push({ ...item, x: ex, y: 102, w: cellW, h: 156, cx: ex + cellW / 2, cy: 180 });
      });
    } else {
      const cx = SLIDE_W * 0.5;
      const cy = state.contextMode === "wall" ? 175 : 210;
      heroBox = { x: cx - heroW / 2, y: cy - heroH / 2, w: heroW, h: heroH, cx, cy };
    }
  } else if (lay.id === "split") {
    // 发布会暗场：左 56% 巨数，右 44% 竖向结论舱
    wedgeBox = { x: SLIDE_W * 0.57, y: 92, w: SLIDE_W * 0.37, h: 356 };
    if (extraCount > 0) {
      const cx = SLIDE_W * 0.29;
      const cy = 170;
      heroBox = { x: cx - heroW / 2, y: cy - heroH / 2, w: heroW, h: heroH, cx, cy };
      const cardW = 148;
      extrasList.forEach((item, idx) => {
        const ex = 44 + idx * (cardW + 14);
        extraBoxes.push({ ...item, x: ex, y: 312, w: cardW, h: 132, cx: ex + cardW / 2, cy: 378 });
      });
    } else {
      const cx = SLIDE_W * 0.30;
      const cy = SLIDE_H * 0.49;
      heroBox = { x: cx - heroW / 2, y: cy - heroH / 2, w: heroW, h: heroH, cx, cy };
    }
  } else {
    // 暖骨极简居中：上方超大黑数 + 底部居中短黑带说明
    wedgeBox = { x: 140, y: state.contextMode === "wall" ? 316 : 374, w: SLIDE_W - 280, h: state.contextMode === "wall" ? 184 : 114 };
    if (extraCount > 0) {
      const cols = extraCount + 1;
      const totalW = SLIDE_W - 112;
      const gap = 16;
      const cellW = (totalW - gap * (cols - 1)) / cols;
      const cx = 56 + cellW / 2;
      const cy = 186;
      heroBox = { x: cx - heroW / 2, y: cy - heroH / 2, w: heroW, h: heroH, cx, cy };
      extrasList.forEach((item, idx) => {
        const ex = 56 + (idx + 1) * (cellW + gap);
        extraBoxes.push({ ...item, x: ex, y: 112, w: cellW, h: 148, cx: ex + cellW / 2, cy: 186 });
      });
    } else {
      const cx = SLIDE_W * 0.5;
      const cy = state.contextMode === "wall" ? 172 : 212;
      heroBox = { x: cx - heroW / 2, y: cy - heroH / 2, w: heroW, h: heroH, cx, cy };
    }
  }

  // 检查是否撑破左右安全边或撞入说明区
  const safePad = 26;
  const maxRightX = lay.id === "split" ? wedgeBox.x - 18 : SLIDE_W - safePad;
  const overflowsX = heroBox.x < safePad || heroBox.x + heroBox.w > maxRightX;
  const overflowsTop = heroBox.y < safePad;

  // 在斜切版式里，允许数字右底脚轻触斜切带，但不允许压盖说明文字区或冲出底边
  let collidesCaption = false;
  if (lay.id === "slash") {
    const captionTopAtLeft = wedgeBox.y + 8;
    const heroTouchesCaptionText = heroBox.y + heroBox.h > captionTopAtLeft + 26 && heroBox.x < wedgeBox.x + 280;
    collidesCaption = heroTouchesCaptionText || heroBox.y + heroBox.h > SLIDE_H - 36;
  } else if (lay.id === "split") {
    collidesCaption = heroBox.x + heroBox.w > wedgeBox.x - 10 || heroBox.y + heroBox.h > SLIDE_H - safePad;
  } else {
    collidesCaption = heroBox.y + heroBox.h > wedgeBox.y - 12;
  }

  const clipped = overflowsX || overflowsTop || collidesCaption || scale > SAFE_SCALE_MAX;

  // 面积占比与 15 米后排可视高度比
  const heroHeightPct = (heroH / SLIDE_H) * 100;
  const heroAreaPct = Math.min(99, ((heroW * heroH) / (SLIDE_W * SLIDE_H)) * 100);
  const extraAreaPct = extraBoxes.reduce((acc, b) => acc + (b.w * b.h) / (SLIDE_W * SLIDE_H) * 100, 0);
  const captionAreaPct = state.contextMode === "bare" ? 0 : state.contextMode === "wall" ? 31 : 14;
  const breathingPct = Math.max(4, Math.round(100 - Math.min(62, heroAreaPct * 0.72) - extraAreaPct - captionAreaPct));

  // 说明字数统计（实时计算）
  const activeNote =
    state.contextMode === "bare"
      ? ""
      : state.contextMode === "vague"
        ? sc.vagueNote
        : state.contextMode === "wall"
          ? sc.wallNote
          : sc.anchorNote;
  const captionChars = (state.contextMode === "bare" ? 0 : sc.label.length) + activeNote.length;

  // 四大柱石独立校验（对应 344 原海报右上四枚黑圆徽：数据焦点 / 强调 / 对比 / 视觉冲击）
  // 大号展示数字（≥ 24px 粗体）按 WCAG 2.1 AA 大字标准取 3.0:1（原海报骨白 #F3EADB 配朱橙 #F64316 实测 3.09:1）
  const CONTRAST_MIN = 3.0;
  const focusOk = extraCount === 0 && scale >= 2.2;
  const emphasisOk = state.precision === "clean" && state.contextMode === "anchor";
  const contrastOk = scale >= SAFE_SCALE_MIN && scale <= SAFE_SCALE_MAX && !clipped && ratioWCAG >= CONTRAST_MIN;
  const impactOk = heroHeightPct >= 24 && !clipped && breathingPct >= 30 && extraCount === 0 && ratioWCAG >= CONTRAST_MIN;

  const pillars = {
    focus: {
      ok: focusOk,
      badge: extraCount > 0 ? `${extraCount + 1}数争宠` : scale < 2.2 ? "隐入正文" : "单数锁焦",
    },
    emphasis: {
      ok: emphasisOk,
      badge:
        state.contextMode === "bare"
          ? "空降孤数"
          : state.contextMode === "wall"
            ? `密字 ${captionChars}字`
            : state.contextMode === "vague"
              ? "缺比较基线"
              : state.precision === "raw"
                ? "小数冗赘"
                : "取整+口径",
    },
    contrast: {
      ok: contrastOk,
      badge:
        ratioWCAG < CONTRAST_MIN
          ? `反差 ${ratioWCAG.toFixed(1)}:1`
          : clipped
            ? "撑破撞框"
            : scale < SAFE_SCALE_MIN
              ? `${scale.toFixed(1)}× 过平`
              : `${scale.toFixed(1)}× 悬殊`,
    },
    impact: {
      ok: impactOk,
      badge: clipped
        ? "边缘挤压"
        : heroHeightPct < 24
          ? "15m 失焦"
          : extraCount > 0
            ? "视线分散"
            : breathingPct < 30
              ? `留白仅 ${breathingPct}%`
              : "1 秒入眼",
    },
  };

  const score = [focusOk, emphasisOk, contrastOk, impactOk].filter(Boolean).length;

  // 按严重程度产出唯一一条白话主诊断与下一步实操指引
  let tag = "单焦成立";
  let tier = "焦点锁定（示意）";
  let headline = `${numText} 在 ${scale.toFixed(1)}× 级差下瞬间锁死全场目光`;
  let reason = `全页只保留 1 个取整核心数字，字高占屏 ${Math.round(heroHeightPct)}%，与底色对比度 ${ratioWCAG.toFixed(1)}:1，留白约 ${breathingPct}%；底部一句短注交代了指标方向与比较口径，观众 1 秒内认出数字、随即听你展开讲述。`;
  let nextStep = "按 Space 跑一遍 15 米后排 3 秒闪读验真，或切换上方其他合法版式对比气场。";

  if (extraCount > 0) {
    tag = `${extraCount + 1} 数争宠`;
    tier = "视线分裂（示意）";
    headline = `同屏挤着 ${extraCount + 1} 个数字，观众先算谁最重要`;
    reason = `大数字页成立的前提是「孤立唯一焦点」。现在屏幕上还有 ${extraCount} 张副指标卡（${extrasList.map((e) => e.num).join("、")}）和主数抢视线，观众翻页后眼球来回扫视，谁也记不住。`;
    nextStep = "直接在画布上点击标红的副数字卡，把它们逐一移入讲者口述。";
  } else if (ratioWCAG < CONTRAST_MIN) {
    tag = "低反差发灰";
    tier = "后排糊成一片（示意）";
    headline = `数字与底色明度对比度只有 ${ratioWCAG.toFixed(1)}:1，投影一开就发灰`;
    reason = `会议室投影仪或强光现场会进一步压缩灰阶层次。即使字号拉到 ${scale.toFixed(1)}×，低于 3.0:1 的同色系弱反差也会让 15 米外后排观众辨认吃力。`;
    nextStep = "把「明暗反差」切回高反差（原海报骨白配朱橙达 3.1:1 大字标准，暗场/暖骨更达 14:1+）。";
  } else if (clipped) {
    tag = "撑破撞框";
    tier = "尺度过载（示意）";
    headline = `级差飙到 ${scale.toFixed(1)}×，数字已经冲出安全边距或压进说明区`;
    reason = `「大」不是无止境拉大。当前数字宽约 ${Math.round(heroW)}px，超过安全版心${state.precision === "raw" ? "（加上冗余小数更拉宽了占位）" : ""}，导致首尾被裁切或与底部说明文字打架，视觉冲击退化成拥挤失控。`;
    nextStep = state.precision === "raw"
      ? "先点大数字把小数取整，再向左横拖画布把级差收回 6×–12× 安全区间。"
      : "向左横拖画布把级差收回 6×–12× 区间，让数字四周恢复呼吸边界。";
  } else if (scale < SAFE_SCALE_MIN) {
    tag = "级差过平";
    tier = "怯弱平庸（示意）";
    headline = `主数字只有正文的 ${scale.toFixed(1)}×，和普通数据简报没拉开差距`;
    reason = `当前数字高度只占画面 ${Math.round(heroHeightPct)}%，在 15 米后排很容易与周围文字混在一起，无法触发前注意「弹出」效果，必须逐字细读才能找到重点。`;
    nextStep = "向右横拖画布（或拖尺度标尺），把字阶级差拉到 6× 以上。";
  } else if (state.contextMode === "bare") {
    tag = "空降孤数";
    tier = "有冲击无语义（示意）";
    headline = `屏幕上只有一个孤零零的 ${numText}，观众不知道它是啥`;
    reason = `没有指标名称、没有涨跌方向也没有比较基线时，大数字只是悬空符号。听众大脑会立刻卡在「${numText} 指的是增长、占比还是流失？」而漏听你接下来的话。`;
    nextStep = "点击画布底部黑色说明区（或下方口径开关），切到「一语锚定+口径」。";
  } else if (state.contextMode === "wall") {
    tag = "小作文反客";
    tier = "图文抢戏（示意）";
    headline = `底部说明区塞了 ${captionChars} 个字，听众埋头读字不听你讲`;
    reason = `根据多媒体学习通道原则，人脑无法同时高效阅读长段文字又听演讲。密排段落把有效留白压到 ${breathingPct}%，大数字的震撼力被下方字墙生生抵消。`;
    nextStep = "点击画布底部黑色说明区，把长段裁成一句「指标 + 比较口径」。";
  } else if (state.contextMode === "vague") {
    tag = "无基线泛断言";
    tier = "可信度悬空（示意）";
    headline = `只写「研究表明 / 显著提升」，却没交代比谁高、测了多久`;
    reason = `原海报底部的「研究表明」属于版式教学占位示意；在真实汇报里，缺少比较基准或样本范围的大数字最容易被当场追问「基数是多少？」从而折损说服力。`;
    nextStep = "点击画布底部说明区，切到「一语锚定+口径」补上一句极短基准。";
  } else if (state.precision === "raw") {
    tag = "小数冗赘";
    tier = "精度噪音（示意）";
    headline = `演讲大屏保留「${numText}」小数位，平白拖慢瞬间记忆`;
    reason = `精确到小数点后两位属于纸质报表或财务附表的职责。在 3 秒闪读的大数字页上，多出的 3 个字符既挤占字号上限，又让观众记不住整数印象。`;
    nextStep = "直接点击画布上的大数字，把它取整为「" + sc.cleanNum + "」。";
  }

  // 计算 3 秒后排闪读的真实眼动路径（全部来自实绘坐标）
  const eyePath = [];
  if (extraCount > 0) {
    // 多灶争宠：眼球在多个卡片与字墙间盲目弹跳
    eyePath.push({ x: heroBox.cx, y: heroBox.cy, ms: 420, note: "落到小字主数" });
    extraBoxes.forEach((b, i) => {
      eyePath.push({ x: b.cx, y: b.cy, ms: 580 + i * 110, note: `被副数 ${b.num} 拉走` });
    });
    eyePath.push({ x: wedgeBox.x + 140, y: wedgeBox.y + 52, ms: 860, note: "陷入底部文字搜寻" });
  } else if (score < 4) {
    eyePath.push({ x: heroBox.cx, y: heroBox.cy, ms: ratioWCAG < CONTRAST_MIN || scale < SAFE_SCALE_MIN ? 1180 : 480, note: ratioWCAG < CONTRAST_MIN ? "低反差辨认迟疑" : scale < SAFE_SCALE_MIN ? "字太小需眯眼搜寻" : "先看到数字" });
    eyePath.push({
      x: wedgeBox.x + Math.min(200, wedgeBox.w * 0.45),
      y: wedgeBox.y + 54,
      ms: state.contextMode === "wall" ? 1650 : 1220,
      note:
        state.contextMode === "bare"
          ? "下方空白，寻找含义失败"
          : state.contextMode === "wall"
            ? "被长段拖住，3 秒读不完"
            : state.contextMode === "vague"
              ? "缺少基线，心里打问号"
              : "精度或裁切引发停顿",
    });
  } else {
    // 4/4 合法解：前注意 0.3s 锁死数字 → 0.9s 顺势扫完底部短注 → 回到讲者
    eyePath.push({ x: heroBox.cx, y: heroBox.cy, ms: 320, note: `0.3s 锁定 ${numText}` });
    eyePath.push({ x: wedgeBox.x + 135, y: wedgeBox.y + 44, ms: 640, note: `0.9s 读懂「${sc.label}」` });
    eyePath.push({ x: wedgeBox.x + 185, y: wedgeBox.y + 92, ms: 520, note: "1.5s 核实口径 · 抬头听讲" });
  }
  const totalScanMs = eyePath.reduce((s, p) => s + p.ms, 0);

  return {
    sc,
    lay,
    numText,
    numColor,
    ratioWCAG,
    bodyPx,
    heroPx,
    scale,
    heroBox,
    wedgeBox,
    wedgePoly,
    extraBoxes,
    overflowsX,
    overflowsTop,
    collidesCaption,
    clipped,
    heroHeightPct,
    heroAreaPct,
    breathingPct,
    activeNote,
    captionChars,
    pillars,
    score,
    tag,
    tier,
    headline,
    reason,
    nextStep,
    eyePath,
    totalScanMs,
  };
}
