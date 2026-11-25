// 166 图录版式（CATALOG LAYOUT）单真源几何与校样评估模型
// 全部卡片像素坐标、标注边界框、基线错差、面积倍比与 VS 对照判定均由此模块唯一产出。

export const PALETTE = {
  paper: "#F2E8D7",
  paperLight: "#FAF4EA",
  paperCard: "#EFE5D3",
  paperMid: "#E6DAC5",
  cobalt: "#164FB4",
  cobaltDeep: "#003EAB",
  cobaltDark: "#0E234D",
  vermilion: "#E14B21",
  vermilionInk: "#B3310D",
  vermilionBright: "#E85324",
  pine: "#10795C",
  pineInk: "#0B5D46",
  ochre: "#EEB71E",
  ochreDeep: "#C99206",
  pinkBg: "#F1B6C3",
  magenta: "#EE6799",
  purpleBg: "#2C1B4A",
  purpleWave: "#CA70A1",
  ink: "#0F1114",
  inkSub: "#46433D",
  rule: "#B5AA96",
  redProof: "#C02A1C",
  redTint: "rgba(192, 42, 28, 0.11)",
};

// 三套真实图录题材，每套 9 件独立标本
export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 构图图录",
    shortLabel: "构图图录",
    edition: "CAT. 166-A · COMPOSITION SPECIMENS",
    items: [
      {
        id: "central",
        code: "01",
        zh: "中心构图",
        en: "CENTRAL",
        roleNote: "信息聚焦",
        dot: "#E14B21",
        group: "focus",
        aspect: 1.38,
        jaggedAspect: 1.56,
        jaggedOffsetY: -9,
        messyLines: ["主视觉放在画框正中央，最常用来突出单一核心元素", "适合封面海报、标志展示与极简静物摄影", "参考页码 P.012 · 经典构图系列"],
      },
      {
        id: "diagonal",
        code: "02",
        zh: "对角线构图",
        en: "DIAGONAL",
        roleNote: "斜向动势",
        dot: "#10795C",
        group: "motion",
        aspect: 1.38,
        jaggedAspect: 0.92,
        jaggedOffsetY: 16,
        messyLines: ["斜线带来速度感与方向指引"],
      },
      {
        id: "scattered",
        code: "03",
        zh: "散点式构图",
        en: "SCATTERED",
        roleNote: "信息扩散",
        dot: "#0F1114",
        group: "diffuse",
        aspect: 1.38,
        jaggedAspect: 1.18,
        jaggedOffsetY: -12,
        messyLines: ["多点自由散布，打破单一中心，营造星图或群像氛围", "注意留白疏密避免糊成一团"],
      },
      {
        id: "triangular",
        code: "04",
        zh: "三角形构图",
        en: "TRIANGULAR",
        roleNote: "底宽稳固",
        dot: "#E85324",
        group: "stable",
        aspect: 1.38,
        jaggedAspect: 0.88,
        jaggedOffsetY: 11,
        messyLines: ["经典稳定三角结构"],
      },
      {
        id: "ninegrid",
        code: "05",
        zh: "九宫格构图",
        en: "NINE-GRID",
        roleNote: "秩序均分",
        dot: "#164FB4",
        group: "grid",
        aspect: 1.38,
        jaggedAspect: 1.62,
        jaggedOffsetY: -14,
        messyLines: ["三行三列等分画布，秩序极强", "九格均布适合多图并列或矩阵展示", "编号 G-05 · 网格系统模块"],
      },
      {
        id: "enveloping",
        code: "06",
        zh: "包围式构图",
        en: "ENVELOPING",
        roleNote: "框护聚焦",
        dot: "#EE6799",
        group: "focus",
        aspect: 1.38,
        jaggedAspect: 1.12,
        jaggedOffsetY: 15,
        messyLines: ["外框围合保护中心主体，增强聚焦"],
      },
      {
        id: "curvilinear",
        code: "07",
        zh: "曲线式构图",
        en: "CURVILINEAR",
        roleNote: "柔线流动",
        dot: "#4B2E6B",
        group: "motion",
        aspect: 1.0,
        jaggedAspect: 1.35,
        jaggedOffsetY: -8,
        messyLines: ["S 形柔和曲线引导视线蜿蜒穿行全图", "气质温润舒展"],
      },
      {
        id: "segmentation",
        code: "08",
        zh: "分割式构图",
        en: "SEGMENTATION",
        roleNote: "板块切分",
        dot: "#C99206",
        group: "grid",
        aspect: 1.0,
        jaggedAspect: 0.78,
        jaggedOffsetY: 14,
        messyLines: ["A/B/C 多板块直切"],
      },
      {
        id: "fourcorner",
        code: "09",
        zh: "四角式构图",
        en: "FOUR-CORNER",
        roleNote: "边角外张",
        dot: "#0C8268",
        group: "diffuse",
        aspect: 1.0,
        jaggedAspect: 1.24,
        jaggedOffsetY: -10,
        messyLines: ["元素退向四角，留空中央，视觉向外张开", "适合题签装饰边框"],
      },
    ],
  },
  bronze: {
    id: "bronze",
    label: "博物 · 青铜器物图录",
    shortLabel: "青铜图录",
    edition: "CAT. 166-B · RITUAL BRONZE ARCHIVE",
    items: [
      {
        id: "ding",
        code: "B01",
        zh: "三足圆鼎",
        en: "ROUND DING",
        roleNote: "圆腹稳重",
        dot: "#10795C",
        group: "stable",
        aspect: 1.38,
        jaggedAspect: 1.52,
        jaggedOffsetY: -10,
        messyLines: ["商晚期炊器，三柱足承托深圆腹，双立耳厚实", "高 24.5 cm · 口径 19.2 cm", "出土记录待补录"],
      },
      {
        id: "gu",
        code: "B02",
        zh: "喇叭长觚",
        en: "SLENDER GU",
        roleNote: "修长挺拔",
        dot: "#164FB4",
        group: "motion",
        aspect: 1.38,
        jaggedAspect: 0.85,
        jaggedOffsetY: 16,
        messyLines: ["饮酒器，极细束腰"],
      },
      {
        id: "pan",
        code: "B03",
        zh: "宽沿浅盘",
        en: "WIDE PAN",
        roleNote: "扁阔横展",
        dot: "#E14B21",
        group: "diffuse",
        aspect: 1.38,
        jaggedAspect: 1.65,
        jaggedOffsetY: -12,
        messyLines: ["水器浅盘，横宽远大于器高，双附耳微翘", "常与匜配对承水"],
      },
      {
        id: "fangzun",
        code: "B04",
        zh: "折肩方尊",
        en: "SQUARE ZUN",
        roleNote: "方棱庄严",
        dot: "#0F1114",
        group: "grid",
        aspect: 1.38,
        jaggedAspect: 0.94,
        jaggedOffsetY: 12,
        messyLines: ["方体折棱礼器"],
      },
      {
        id: "jue",
        code: "B05",
        zh: "流尾三爵",
        en: "TRIPOD JUE",
        roleNote: "斜流尖尾",
        dot: "#C99206",
        group: "motion",
        aspect: 1.38,
        jaggedAspect: 1.48,
        jaggedOffsetY: -13,
        messyLines: ["前有长流后有尖尾，三刀足外撇，动势鲜明", "商周饮酒代表器型", "藏品编号 M-105"],
      },
      {
        id: "gui",
        code: "B06",
        zh: "双耳圈簋",
        en: "RINGED GUI",
        roleNote: "敦实居中",
        dot: "#10795C",
        group: "stable",
        aspect: 1.38,
        jaggedAspect: 1.15,
        jaggedOffsetY: 14,
        messyLines: ["盛黍稷礼器，双兽耳对称"],
      },
      {
        id: "you",
        code: "B07",
        zh: "提梁弧卣",
        en: "ARCHED YOU",
        roleNote: "弧梁柔廓",
        dot: "#4B2E6B",
        group: "focus",
        aspect: 1.0,
        jaggedAspect: 1.32,
        jaggedOffsetY: -8,
        messyLines: ["盛酒器，高拱提梁围合壶身，轮廓柔润"],
      },
      {
        id: "fangding",
        code: "B08",
        zh: "四足方鼎",
        en: "FANG DING",
        roleNote: "直壁方阵",
        dot: "#164FB4",
        group: "grid",
        aspect: 1.0,
        jaggedAspect: 0.82,
        jaggedOffsetY: 13,
        messyLines: ["长方腹四柱足"],
      },
      {
        id: "zhong",
        code: "B09",
        zh: "合瓦编钟",
        en: "BELL CHIME",
        roleNote: "悬垂序列",
        dot: "#E85324",
        group: "diffuse",
        aspect: 1.0,
        jaggedAspect: 1.24,
        jaggedOffsetY: -11,
        messyLines: ["乐器合瓦形，常按音阶成列悬挂"],
      },
    ],
  },
  chair: {
    id: "chair",
    label: "工业 · 座椅标本图录",
    shortLabel: "座椅图录",
    edition: "CAT. 166-C · INDUSTRIAL SEATING INDEX",
    items: [
      {
        id: "stool",
        code: "S01",
        zh: "三腿圆凳",
        en: "ROUND STOOL",
        roleNote: "极简收束",
        dot: "#E14B21",
        group: "focus",
        aspect: 1.38,
        jaggedAspect: 1.54,
        jaggedOffsetY: -9,
        messyLines: ["无靠背无扶手，可叠放收纳，占地极小", "桦木曲木工艺 · 坐高 440mm", "热销基础款"],
      },
      {
        id: "cantilever",
        code: "S02",
        zh: "钢管悬臂椅",
        en: "CANTILEVER",
        roleNote: "弹性斜力",
        dot: "#164FB4",
        group: "motion",
        aspect: 1.38,
        jaggedAspect: 0.90,
        jaggedOffsetY: 15,
        messyLines: ["取消后腿，靠弯管回弹承重"],
      },
      {
        id: "bench",
        code: "S03",
        zh: "多人长条凳",
        en: "LONG BENCH",
        roleNote: "横向延展",
        dot: "#0F1114",
        group: "diffuse",
        aspect: 1.38,
        jaggedAspect: 1.68,
        jaggedOffsetY: -12,
        messyLines: ["开放式公共长座，不限定单人边界", "展厅与走廊常用"],
      },
      {
        id: "highback",
        code: "S04",
        zh: "高背餐椅",
        en: "HIGHBACK",
        roleNote: "挺直正坐",
        dot: "#10795C",
        group: "stable",
        aspect: 1.38,
        jaggedAspect: 0.86,
        jaggedOffsetY: 12,
        messyLines: ["直脊高靠背"],
      },
      {
        id: "gridchair",
        code: "S05",
        zh: "方格网格椅",
        en: "GRID CHAIR",
        roleNote: "几何方阵",
        dot: "#164FB4",
        group: "grid",
        aspect: 1.38,
        jaggedAspect: 1.50,
        jaggedOffsetY: -13,
        messyLines: ["横竖方格构成靠背与扶手结构", "工业标准化焊接框架", "序列编号 I-05"],
      },
      {
        id: "armchair",
        code: "S06",
        zh: "围合扶手椅",
        en: "ARMCHAIR",
        roleNote: "环抱聚焦",
        dot: "#EE6799",
        group: "focus",
        aspect: 1.38,
        jaggedAspect: 1.12,
        jaggedOffsetY: 14,
        messyLines: ["三面包围感强，提供独立私密坐区"],
      },
      {
        id: "lounge",
        code: "S07",
        zh: "曲线躺椅",
        en: "LOUNGE",
        roleNote: "斜仰舒展",
        dot: "#4B2E6B",
        group: "motion",
        aspect: 1.0,
        jaggedAspect: 1.38,
        jaggedOffsetY: -9,
        messyLines: ["贴合脊柱波浪弧线，后仰角度深"],
      },
      {
        id: "folding",
        code: "S08",
        zh: "交叉折叠椅",
        en: "FOLDING",
        roleNote: "直切结构",
        dot: "#C99206",
        group: "grid",
        aspect: 1.0,
        jaggedAspect: 0.82,
        jaggedOffsetY: 13,
        messyLines: ["铰链直切折叠"],
      },
      {
        id: "barstool",
        code: "S09",
        zh: "高脚吧台凳",
        en: "BARSTOOL",
        roleNote: "高挑外张",
        dot: "#0C8268",
        group: "diffuse",
        aspect: 1.0,
        jaggedAspect: 1.24,
        jaggedOffsetY: -10,
        messyLines: ["四脚外撇加高踏圈，重心提至 750mm"],
      },
    ],
  },
};

// 视觉维度的反差矩阵：同组为弱对照，跨反义轴为强对照
const OPPOSITE_GROUPS = new Set([
  "focus|diffuse",
  "diffuse|focus",
  "motion|stable",
  "stable|motion",
  "grid|motion",
  "motion|grid",
  "grid|diffuse",
  "diffuse|grid",
  "focus|motion",
  "motion|focus",
  "stable|diffuse",
  "diffuse|stable",
]);

export function evaluateVsPair(themeId, pair) {
  const items = THEMES[themeId].items;
  const [aIdx, bIdx] = pair;
  const a = items[aIdx];
  const b = items[bIdx];
  if (!a || !b) return { quality: "off", reason: "未配置对照标本" };
  if (aIdx === bIdx) {
    return {
      quality: "same",
      reason: `左右两边放了同一张「${a.zh}」，对照区变成了原样重复`,
    };
  }
  if (a.group === b.group) {
    return {
      quality: "weak",
      reason: `「${a.zh}」与「${b.zh}」属于同类特征（${a.roleNote} vs ${b.roleNote}），差异太弱，看不出对比意图`,
    };
  }
  if (OPPOSITE_GROUPS.has(`${a.group}|${b.group}`)) {
    return {
      quality: "strong",
      reason: `「${a.zh}（${a.roleNote}）」与「${b.zh}（${b.roleNote}）」反差明确，对照一眼就记住`,
    };
  }
  return {
    quality: "strong",
    reason: `「${a.zh}（${a.roleNote}）」与「${b.zh}（${b.roleNote}）」结构属性不同，形成有效参照`,
  };
}

// 开场刻意停在「杂货铺错态」：参差错牙 + 长短杂注 + 1.00×平权 + 同质弱对照
export function createInitialState() {
  return {
    theme: "poster",
    gridMode: "jagged", // jagged | tiered | uniform | dense6
    captionMode: "messy", // messy | none | standard | overlay
    scaleRatio: 1.0, // 1.00 .. 3.20
    vsEnabled: true,
    vsPair: [0, 5], // 开场：中心构图 VS 包围式构图（同属 focus，故意弱对照）
    selectingSide: "right",
    highlightGroup: null, // null | 'module' | 'caption' | 'rhythm'
  };
}

// 预设方案：包含多组合法解 + 双向试错态
export const PRESETS = {
  initial: {
    label: "复原错态",
    state: {
      gridMode: "jagged",
      captionMode: "messy",
      scaleRatio: 1.0,
      vsEnabled: true,
      vsPair: [0, 5],
    },
  },
  posterClassic: {
    label: "原海报阶梯解",
    state: {
      gridMode: "tiered",
      captionMode: "standard",
      scaleRatio: 1.78,
      vsEnabled: true,
      vsPair: [0, 2],
    },
  },
  museumUniform: {
    label: "博物等大阵解",
    state: {
      gridMode: "uniform",
      captionMode: "standard",
      scaleRatio: 1.25,
      vsEnabled: true,
      vsPair: [4, 6],
    },
  },
  curatedContrast: {
    label: "主次策展解",
    state: {
      gridMode: "tiered",
      captionMode: "standard",
      scaleRatio: 2.22,
      vsEnabled: true,
      vsPair: [1, 3],
    },
  },
  errDense: {
    label: "试错：6列邮票",
    state: {
      gridMode: "dense6",
      captionMode: "standard",
      scaleRatio: 1.6,
      vsEnabled: true,
      vsPair: [0, 2],
    },
  },
  errOverlay: {
    label: "试错：浮标遮图",
    state: {
      gridMode: "tiered",
      captionMode: "overlay",
      scaleRatio: 1.75,
      vsEnabled: true,
      vsPair: [0, 2],
    },
  },
  errExtreme: {
    label: "试错：落差拉爆",
    state: {
      gridMode: "tiered",
      captionMode: "standard",
      scaleRatio: 3.05,
      vsEnabled: true,
      vsPair: [0, 2],
    },
  },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// 单真源布局与实时校样计算
export function computeLayout(state, width, height) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const items = theme.items;
  const isCompact = width < 520;
  const padX = isCompact ? 10 : 18;
  const padTop = isCompact ? 34 : 38;
  const padBot = isCompact ? 10 : 14;
  const innerW = Math.max(220, width - padX * 2);
  const innerH = Math.max(220, height - padTop - padBot);

  // 顶沿活体尺度标尺轨道坐标（同时作为 data-perf-drag 与视觉反馈标尺）
  const rulerBar = {
    x: padX,
    y: isCompact ? 8 : 10,
    w: innerW,
    h: isCompact ? 18 : 20,
    ratio: clamp(state.scaleRatio, 1.0, 3.2),
  };

  // 标注区高度计算函数
  const captionMetrics = (item) => {
    if (state.captionMode === "none") {
      return { lines: 0, h: 4, occludedRatio: 0 };
    }
    if (state.captionMode === "overlay") {
      return { lines: 2, h: 6, occludedRatio: 0.31 };
    }
    if (state.captionMode === "messy") {
      const l = item.messyLines.length;
      return { lines: l, h: 6 + l * (isCompact ? 9.5 : 11.2), occludedRatio: 0 };
    }
    // standard: 固定两行（色点+中文名，英文副标）
    return { lines: 2, h: isCompact ? 24 : 28, occludedRatio: 0 };
  };

  const cards = [];
  let vsBox = null;
  const gapX = isCompact ? 8 : 14;
  const gapY = isCompact ? 8 : 13;

  // 根据 scaleRatio（1.0..3.2）确定上排大标本与底排对照/小标本的高度分配
  // 设总可用高度按比例分配，避免超出画布
  const sr = clamp(state.scaleRatio, 1.0, 3.2);

  if (state.gridMode === "dense6") {
    // 6 列密麻邮票（2 行，含 9 卡 + 2 VS 卡挤进 6 列）
    const cols = 6;
    const cellW = (innerW - gapX * (cols - 1)) / cols;
    const rows = 2;
    const rowH = (innerH - gapY) / rows;
    const allSlots = [
      ...items.map((it, idx) => ({ item: it, idx, isVs: false, vsRole: null })),
      ...(state.vsEnabled
        ? [
            { item: items[state.vsPair[0]], idx: state.vsPair[0], isVs: true, vsRole: "left" },
            { item: items[state.vsPair[1]], idx: state.vsPair[1], isVs: true, vsRole: "right" },
          ]
        : []),
    ];
    allSlots.forEach((slot, sIdx) => {
      const r = Math.floor(sIdx / cols);
      const c = sIdx % cols;
      if (r >= rows) return;
      const cm = captionMetrics(slot.item);
      const x = padX + c * (cellW + gapX);
      const y = padTop + r * (rowH + gapY);
      const thumbH = Math.max(26, rowH - cm.h);
      cards.push({
        slotId: slot.isVs ? `vs-${slot.vsRole}` : `item-${slot.idx}`,
        index: slot.idx,
        item: slot.item,
        row: r,
        col: c,
        isVs: slot.isVs,
        vsRole: slot.vsRole,
        cardRect: { x, y, w: cellW, h: rowH },
        thumbRect: { x, y, w: cellW, h: thumbH },
        captionRect: { x, y: y + thumbH + 3, w: cellW, h: Math.max(0, cm.h - 3) },
        captionLines: cm.lines,
        occludedRatio: cm.occludedRatio,
      });
    });
    if (state.vsEnabled) {
      const leftC = cards.find((c) => c.vsRole === "left");
      const rightC = cards.find((c) => c.vsRole === "right");
      if (leftC && rightC) {
        vsBox = {
          x: leftC.cardRect.x - 3,
          y: leftC.cardRect.y - 3,
          w: rightC.cardRect.x + rightC.cardRect.w - leftC.cardRect.x + 6,
          h: Math.max(leftC.cardRect.h, rightC.cardRect.h) + 6,
          cx: (leftC.thumbRect.x + leftC.thumbRect.w + rightC.thumbRect.x) / 2,
          cy: leftC.thumbRect.y + leftC.thumbRect.h / 2,
        };
      }
    }
  } else if (state.gridMode === "uniform") {
    // 严谨等大阵：3 行，上两行各 4 张（共 8 张）等大标本，底行 1 张+VS 或 4 列齐整（随 scaleRatio 微调底行高度）
    const cols = 4;
    const cellW = (innerW - gapX * (cols - 1)) / cols;
    // 上两行与第 3 行高度比随 sqrt(sr) 平滑微调（保持等大阵基本齐整，同时拖动可实时调主次比例）
    const topWeight = 1.0 + (sr - 1.0) * 0.22;
    const botWeight = Math.max(0.45, 1.0 - (sr - 1.0) * 0.2);
    const totalW = topWeight * 2 + botWeight;
    const availH = innerH - gapY * 2;
    const rowHs = [
      (availH * topWeight) / totalW,
      (availH * topWeight) / totalW,
      (availH * botWeight) / totalW,
    ];
    // uniform 模式下也按行统一预留标注槽，保证等大阵缩略图基线严格 0px 齐平
    const uniReserve =
      state.captionMode === "messy"
        ? isCompact
          ? 34
          : 38
        : state.captionMode === "standard"
        ? isCompact
          ? 24
          : 28
        : 6;
    let curY = padTop;
    for (let r = 0; r < 3; r++) {
      const rH = rowHs[r];
      const capRes = Math.min(uniReserve, rH * 0.44);
      if (r < 2) {
        for (let c = 0; c < 4; c++) {
          const idx = r * 4 + c;
          const item = items[idx];
          const cm = captionMetrics(item);
          const x = padX + c * (cellW + gapX);
          const thumbH = Math.max(30, rH - capRes);
          cards.push({
            slotId: `item-${idx}`,
            index: idx,
            item,
            row: r,
            col: c,
            isVs: false,
            vsRole: null,
            cardRect: { x, y: curY, w: cellW, h: rH },
            thumbRect: { x, y: curY, w: cellW, h: thumbH },
            captionRect: { x, y: curY + thumbH + 2, w: cellW, h: Math.max(0, capRes - 2) },
            captionLines: cm.lines,
            occludedRatio: cm.occludedRatio,
          });
        }
      } else {
        // 第 3 行：左侧放第 9 张标本，右侧放 VS 对照组
        const item8 = items[8];
        const cm8 = captionMetrics(item8);
        const x0 = padX;
        const w0 = state.vsEnabled ? cellW * 1.45 : cellW * 2 + gapX;
        const tH8 = Math.max(26, rH - capRes);
        cards.push({
          slotId: "item-8",
          index: 8,
          item: item8,
          row: 2,
          col: 0,
          isVs: false,
          vsRole: null,
          cardRect: { x: x0, y: curY, w: w0, h: rH },
          thumbRect: { x: x0, y: curY, w: w0, h: tH8 },
          captionRect: { x: x0, y: curY + tH8 + 2, w: w0, h: Math.max(0, capRes - 2) },
          captionLines: cm8.lines,
          occludedRatio: cm8.occludedRatio,
        });

        if (state.vsEnabled) {
          const vsGap = isCompact ? 22 : 34;
          const vsAreaX = padX + w0 + gapX * 1.4;
          const vsAreaW = padX + innerW - vsAreaX;
          const eachW = (vsAreaW - vsGap) / 2;
          const leftItem = items[state.vsPair[0]];
          const rightItem = items[state.vsPair[1]];
          const cmL = captionMetrics(leftItem);
          const cmR = captionMetrics(rightItem);
          const tHL = Math.max(24, rH - capRes);
          const tHR = Math.max(24, rH - capRes);
          cards.push({
            slotId: "vs-left",
            index: state.vsPair[0],
            item: leftItem,
            row: 2,
            col: 2,
            isVs: true,
            vsRole: "left",
            cardRect: { x: vsAreaX, y: curY, w: eachW, h: rH },
            thumbRect: { x: vsAreaX, y: curY, w: eachW, h: tHL },
            captionRect: { x: vsAreaX, y: curY + tHL + 2, w: eachW, h: Math.max(0, capRes - 2) },
            captionLines: cmL.lines,
            occludedRatio: cmL.occludedRatio,
          });
          cards.push({
            slotId: "vs-right",
            index: state.vsPair[1],
            item: rightItem,
            row: 2,
            col: 3,
            isVs: true,
            vsRole: "right",
            cardRect: { x: vsAreaX + eachW + vsGap, y: curY, w: eachW, h: rH },
            thumbRect: { x: vsAreaX + eachW + vsGap, y: curY, w: eachW, h: tHR },
            captionRect: { x: vsAreaX + eachW + vsGap, y: curY + tHR + 2, w: eachW, h: Math.max(0, capRes - 2) },
            captionLines: cmR.lines,
            occludedRatio: cmR.occludedRatio,
          });
          vsBox = {
            x: vsAreaX - 5,
            y: curY - 4,
            w: vsAreaW + 10,
            h: rH + 8,
            cx: vsAreaX + eachW + vsGap / 2,
            cy: curY + Math.min(tHL, tHR) / 2,
          };
        }
      }
      curY += rH + gapY;
    }
  } else {
    // tiered（原海报招牌 3 + 3 + 5 阶梯对照）或 jagged（开场错态：参差错牙）
    const isJagged = state.gridMode === "jagged";
    // 平滑标定尺度曲线：1.00× 接近平权（底行较高）；1.78× 呈现原海报黄金阶梯（面积比 ~2.0×）；
    // 2.22× 为主次策展解（面积比 ~2.55× 且底行依然清晰可读）；> 2.70× 时拉爆挤瘪底行
    const normT = clamp((sr - 1.0) / 2.2, 0, 1);
    const topWeight = 0.88 + normT * 0.56;
    const botWeight = Math.max(0.36, 1.38 - normT * 0.94);
    const totalW = topWeight * 2 + botWeight;
    const availH = innerH - gapY * 2;
    const rowHs = [
      (availH * topWeight) / totalW,
      (availH * topWeight) / totalW,
      (availH * botWeight) / totalW,
    ];

    const col3W = (innerW - gapX * 2) / 3;
    let curY = padTop;

    // Row 0 & Row 1 (each 3 cards)
    // 齐整格局（tiered）按行统一预留标注槽，保证缩略图基线严格 0px 齐平；杂注自身只表现为行数错乱
    const unifiedCapReserve =
      state.captionMode === "messy"
        ? isCompact
          ? 34
          : 38
        : state.captionMode === "standard"
        ? isCompact
          ? 24
          : 28
        : 6;

    for (let r = 0; r < 2; r++) {
      const rH = rowHs[r];
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const item = items[idx];
        const cm = captionMetrics(item);
        let x = padX + c * (col3W + gapX);
        let w = col3W;
        let y = curY;
        let tH = Math.max(36, rH - (isJagged ? cm.h : Math.min(unifiedCapReserve, rH * 0.42)));

        if (isJagged) {
          // 清晰但不互相重叠的参差错牙（行底错差约 22–44px）
          const wFactor = item.jaggedAspect > 1.35 ? 1.02 : item.jaggedAspect < 0.98 ? 0.84 : 0.93;
          const hFactor = item.jaggedAspect < 0.98 ? 1.0 : item.jaggedAspect > 1.45 ? 0.78 : 0.89;
          const oldW = w;
          w = oldW * wFactor;
          x = x + (oldW - w) * (c === 0 ? 0.12 : c === 2 ? 0.88 : 0.5);
          const maxCapSpace = Math.min(cm.h, rH * 0.44);
          tH = Math.max(38, (rH - maxCapSpace) * hFactor);
          const shift = clamp(item.jaggedOffsetY * (isCompact ? 0.42 : 0.58), -6, 8);
          y = y + shift;
        }

        cards.push({
          slotId: `item-${idx}`,
          index: idx,
          item,
          row: r,
          col: c,
          isVs: false,
          vsRole: null,
          cardRect: { x, y, w, h: Math.min(rH + 2, tH + cm.h) },
          thumbRect: { x, y, w, h: tH },
          captionRect: { x, y: y + tH + 2, w, h: Math.max(0, Math.min(cm.h, curY + rH - (y + tH) + 3)) },
          captionLines: cm.lines,
          occludedRatio: cm.occludedRatio,
        });
      }
      curY += rH + gapY;
    }

    // Row 2: 3 张小卡 + 右侧 VS 2 张卡（原海报标志 5 格底行）
    const rH = rowHs[2];
    const row2CapReserve = Math.min(unifiedCapReserve, rH * 0.44);
    if (state.vsEnabled) {
      const vsGap = isCompact ? 18 : 28;
      // 仅在 sr > 2.55 拉爆区开始明显压窄底行
      const extraMargin = sr > 2.55 ? (sr - 2.55) * innerW * 0.24 : 0;
      const usableW = Math.max(innerW * 0.54, innerW - extraMargin);
      const startX = padX + (innerW - usableW) * 0.5;
      const groupGap = isCompact ? 10 : 18;
      const smallGap = isCompact ? 6 : 10;
      const unitW = (usableW - smallGap * 2 - groupGap - vsGap) / 5;

      // 3 small cards: indices 6, 7, 8
      for (let i = 0; i < 3; i++) {
        const idx = 6 + i;
        const item = items[idx];
        const cm = captionMetrics(item);
        let x = startX + i * (unitW + smallGap);
        let w = unitW;
        let y = curY;
        const maxCap = isJagged ? Math.min(cm.h, rH * 0.46) : row2CapReserve;
        let tH = Math.max(20, rH - maxCap);
        if (isJagged) {
          const hFactor = i === 1 ? 0.78 : i === 0 ? 0.96 : 0.86;
          tH = Math.max(28, tH * hFactor);
          y = y + (i === 1 ? 6 : i === 0 ? -4 : 3);
        }
        cards.push({
          slotId: `item-${idx}`,
          index: idx,
          item,
          row: 2,
          col: i,
          isVs: false,
          vsRole: null,
          cardRect: { x, y, w, h: Math.min(rH, tH + maxCap) },
          thumbRect: { x, y, w, h: tH },
          captionRect: { x, y: y + tH + 2, w, h: Math.max(0, curY + rH - (y + tH) - 1) },
          captionLines: cm.lines,
          occludedRatio: cm.occludedRatio,
        });
      }

      // 2 VS cards
      const vsStartX = startX + 3 * unitW + 2 * smallGap + groupGap;
      const leftItem = items[state.vsPair[0]];
      const rightItem = items[state.vsPair[1]];
      const cmL = captionMetrics(leftItem);
      const cmR = captionMetrics(rightItem);
      const maxCapL = isJagged ? Math.min(cmL.h, rH * 0.46) : row2CapReserve;
      const maxCapR = isJagged ? Math.min(cmR.h, rH * 0.46) : row2CapReserve;
      const tHL = Math.max(20, rH - maxCapL);
      const tHR = Math.max(20, rH - maxCapR);
      const yL = curY + (isJagged ? -3 : 0);
      const yR = curY + (isJagged ? 5 : 0);

      cards.push({
        slotId: "vs-left",
        index: state.vsPair[0],
        item: leftItem,
        row: 2,
        col: 3,
        isVs: true,
        vsRole: "left",
        cardRect: { x: vsStartX, y: yL, w: unitW, h: Math.min(rH, tHL + maxCapL) },
        thumbRect: { x: vsStartX, y: yL, w: unitW, h: tHL },
        captionRect: { x: vsStartX, y: yL + tHL + 2, w: unitW, h: Math.max(0, curY + rH - (yL + tHL) - 1) },
        captionLines: cmL.lines,
        occludedRatio: cmL.occludedRatio,
      });
      cards.push({
        slotId: "vs-right",
        index: state.vsPair[1],
        item: rightItem,
        row: 2,
        col: 4,
        isVs: true,
        vsRole: "right",
        cardRect: { x: vsStartX + unitW + vsGap, y: yR, w: unitW, h: Math.min(rH, tHR + maxCapR) },
        thumbRect: { x: vsStartX + unitW + vsGap, y: yR, w: unitW, h: tHR },
        captionRect: { x: vsStartX + unitW + vsGap, y: yR + tHR + 2, w: unitW, h: Math.max(0, curY + rH - (yR + tHR) - 1) },
        captionLines: cmR.lines,
        occludedRatio: cmR.occludedRatio,
      });

      vsBox = {
        x: vsStartX - 5,
        y: Math.min(yL, yR) - 4,
        w: unitW * 2 + vsGap + 10,
        h: Math.min(rH + 6, Math.max(tHL + maxCapL, tHR + maxCapR) + 8),
        cx: vsStartX + unitW + vsGap / 2,
        cy: curY + Math.min(tHL, tHR) / 2,
      };
    } else {
      // 未开启 VS 时，第 3 行仅铺 3 张标本，宽度与上面 3 列一致（失去节奏对比）
      for (let i = 0; i < 3; i++) {
        const idx = 6 + i;
        const item = items[idx];
        const cm = captionMetrics(item);
        const x = padX + i * (col3W + gapX);
        const tH = Math.max(24, rH - cm.h);
        cards.push({
          slotId: `item-${idx}`,
          index: idx,
          item,
          row: 2,
          col: i,
          isVs: false,
          vsRole: null,
          cardRect: { x, y: curY, w: col3W, h: rH },
          thumbRect: { x, y: curY, w: col3W, h: tH },
          captionRect: { x, y: curY + tH + 3, w: col3W, h: Math.max(0, cm.h - 3) },
          captionLines: cm.lines,
          occludedRatio: cm.occludedRatio,
        });
      }
    }
  }

  // ===== 单真源实测核算（严格从实绘 cards 矩形计算）=====
  // 1. 按行计算缩略图底边基线最大偏差（px）
  const byRow = new Map();
  for (const c of cards) {
    if (!byRow.has(c.row)) byRow.set(c.row, []);
    byRow.get(c.row).push(c);
  }
  let maxBaselineJitter = 0;
  for (const rowCards of byRow.values()) {
    const bottoms = rowCards.map((c) => c.thumbRect.y + c.thumbRect.h);
    const minB = Math.min(...bottoms);
    const maxB = Math.max(...bottoms);
    maxBaselineJitter = Math.max(maxBaselineJitter, maxB - minB);
  }

  // 2. 最小缩略图宽、高（换算成标准 960×420 印张尺度，确保跨设备判定一致）
  const normW = 960 / Math.max(300, width);
  const normH = 420 / Math.max(260, height);
  const minCardW = Math.min(...cards.map((c) => c.thumbRect.w * normW));
  const minCardH = Math.min(...cards.map((c) => c.thumbRect.h * normH));

  // 3. 标注行数波动与遮挡率
  const capLines = cards.map((c) => c.captionLines);
  const captionLineSpread = Math.max(...capLines) - Math.min(...capLines);
  const maxOcclusionPct = Math.round(Math.max(...cards.map((c) => c.occludedRatio)) * 100);

  // 4. 主次面积对比倍比（上排大卡平均面积 ÷ 底排小卡平均面积）
  const topCards = cards.filter((c) => c.row === 0);
  const botCards = cards.filter((c) => c.row === Math.max(...cards.map((x) => x.row)));
  const avgArea = (arr) =>
    arr.reduce((s, c) => s + c.thumbRect.w * c.thumbRect.h, 0) / Math.max(1, arr.length);
  const topArea = avgArea(topCards);
  const botArea = avgArea(botCards);
  const measuredAreaRatio = Math.max(1, topArea / Math.max(1, botArea));

  // 5. VS 对照质量
  const vsEval = state.vsEnabled
    ? evaluateVsPair(state.theme, state.vsPair)
    : { quality: "off", reason: "未开启 VS 对照区" };

  // 6. 浏览路径点（顺着各行卡片中心连成扫读轨迹）
  const pathPoints = [];
  const rowKeys = [...byRow.keys()].sort((a, b) => a - b);
  for (const rk of rowKeys) {
    const rc = byRow.get(rk);
    for (const c of rc) {
      pathPoints.push({
        x: c.thumbRect.x + c.thumbRect.w / 2,
        y: c.thumbRect.y + c.thumbRect.h / 2,
        isVs: c.isVs,
        row: rk,
      });
    }
  }

  // ===== 检出全部双向真错态 =====
  const issues = [];

  if (maxBaselineJitter > 6) {
    issues.push({
      id: "jagged",
      pillar: "module",
      severity: 1,
      badge: `基线错差 ${Math.round(maxBaselineJitter)}px`,
      title: `缩略图高矮错牙 ${Math.round(maxBaselineJitter)}px，视线扫不直`,
      why: `同一行里的图块底边上下跳动了 ${Math.round(maxBaselineJitter)}px，读者横扫一排时眼睛不断抬高落低，图录赖以成立的秩序感立刻散架。`,
      actionLabel: "收齐到 3+3+5 阶梯模数",
      fixPatch: { gridMode: "tiered" },
    });
  }

  if (state.gridMode === "dense6" || (!state.gridMode.includes("jagged") && (minCardW < 92 || minCardH < 40))) {
    issues.push({
      id: "crushed",
      pillar: state.gridMode === "dense6" ? "module" : "rhythm",
      severity: 2,
      badge: state.gridMode === "dense6" ? `最窄仅 ${Math.round(minCardW)}px` : `底卡压扁 ${Math.round(minCardH)}px`,
      title:
        state.gridMode === "dense6"
          ? `6 列硬塞把缩略图压成 ${Math.round(minCardW)}px 邮票`
          : `底行小卡被压扁到 ${Math.round(minCardH)}px 高，细节糊成色块`,
      why:
        state.gridMode === "dense6"
          ? `一排硬排 6 列后，每张样本在标准印张上折合只剩 ${Math.round(minCardW)}px 宽，构图里的辅助线与细节全部粘在一起，失去了看图识类的意义。`
          : `大小落差推到 ${measuredAreaRatio.toFixed(2)}× 后，上排霸占了太多版心，底排对照卡被压到只剩 ${Math.round(minCardH)}px 高，眼睛根本辨认不出差异。`,
      actionLabel: state.gridMode === "dense6" ? "改回 3+3+5 舒适密度" : "把尺度比回调到 1.78×",
      fixPatch: state.gridMode === "dense6" ? { gridMode: "tiered" } : { scaleRatio: 1.78 },
    });
  }

  if (state.captionMode === "messy") {
    issues.push({
      id: "messyCaption",
      pillar: "caption",
      severity: 3,
      badge: `行数差 ${captionLineSpread} 行`,
      title: `标注长短不一（相差 ${captionLineSpread} 行），横向没法对照`,
      why: "有的卡片塞进 3 行推销碎语，有的只剩一句话、缺分类色点和英文副标。字段槽位不统一，读者没法用眼睛直扫同一位置提取关键信息。",
      actionLabel: "统一为色点+中英两行标注",
      fixPatch: { captionMode: "standard" },
    });
  } else if (state.captionMode === "none") {
    issues.push({
      id: "noCaption",
      pillar: "caption",
      severity: 3,
      badge: "裸图无签",
      title: "只放裸图没有标注，看完记不住也分不清类",
      why: "图录不是纯画廊墙。去掉编号、分类色点和中英名称后，读者认不出每张标本叫什么，更没法按主题把跨行的同类作品串联起来。",
      actionLabel: "补齐原海报规范标注",
      fixPatch: { captionMode: "standard" },
    });
  } else if (state.captionMode === "overlay") {
    issues.push({
      id: "overlayCaption",
      pillar: "caption",
      severity: 3,
      badge: `遮图 ${maxOcclusionPct}%`,
      title: `浮标压在画面上遮掉 ${maxOcclusionPct}% 构图主体`,
      why: `大色块标签直接盖住了缩略图下部 ${maxOcclusionPct}% 的区域，把原本用来演示视觉结构的画面切去一截，标注反客为主。`,
      actionLabel: "把标注移出画面下方对齐",
      fixPatch: { captionMode: "standard" },
    });
  }

  if (state.vsEnabled && (vsEval.quality === "same" || vsEval.quality === "weak")) {
    issues.push({
      id: "weakVs",
      pillar: "rhythm",
      severity: 4,
      badge: vsEval.quality === "same" ? "同图自比" : "同质弱对照",
      title: vsEval.quality === "same" ? "VS 槽里放了同一张图，对照失去意义" : "VS 对照选成同类构图，反差拉不开",
      why: `${vsEval.reason}。图录的 VS 对照位应当放一对方向、聚散或结构相反的样本（例如点选「${items[0].zh}」配「${items[2].zh}」）。`,
      actionLabel: `换配「${items[0].zh} VS ${items[2].zh}」`,
      fixPatch: { vsPair: [0, 2] },
    });
  }

  if (measuredAreaRatio > 3.25 && !issues.some((i) => i.id === "crushed")) {
    issues.push({
      id: "extremeContrast",
      pillar: "rhythm",
      severity: 5,
      badge: `面积比 ${measuredAreaRatio.toFixed(2)}×`,
      title: `大卡面积达到小卡 ${measuredAreaRatio.toFixed(2)} 倍，节奏失衡`,
      why: `大标本行过度膨胀会把底行挤成一条窄边，读者的视线被牢牢锁死在上半页，底沿的 VS 对照区几乎被忽略。`,
      actionLabel: "收回到 1.78× 稳健阶梯",
      fixPatch: { scaleRatio: 1.78 },
    });
  }

  // 平权催眠判定：当既没有形成大小节奏又无有效 VS 对照
  const hasScaleRhythm = measuredAreaRatio >= 1.32 && measuredAreaRatio <= 3.25;
  const hasStrongVs = state.vsEnabled && vsEval.quality === "strong";
  if (
    !issues.some((i) => i.id === "jagged" || i.id === "crushed") &&
    !hasScaleRhythm &&
    !hasStrongVs
  ) {
    issues.push({
      id: "flatRhythm",
      pillar: "rhythm",
      severity: 5,
      badge: `平权 ${measuredAreaRatio.toFixed(2)}× · 无VS`,
      title: "满页等大又无对照，整张图录平铺得像表格",
      why: "缩略图统一之后，如果没有大小落差或 VS 并置对照制造视觉停顿，读者扫过九个一模一样的方块会迅速审美疲劳、找不到记忆锚点。",
      actionLabel: "拉开 1.78× 阶梯并启 VS 对照",
      fixPatch: { scaleRatio: 1.78, vsEnabled: true, vsPair: [0, 2] },
    });
  } else if (
    state.gridMode === "tiered" &&
    state.scaleRatio < 1.22 &&
    !issues.some((i) => i.id === "jagged")
  ) {
    issues.push({
      id: "flatRhythm",
      pillar: "rhythm",
      severity: 6,
      badge: `尺差仅 ${state.scaleRatio.toFixed(2)}×`,
      title: `上两行与底行高度几乎拉平（标尺 ${state.scaleRatio.toFixed(2)}×），阶梯节奏偏弱`,
      why: "向右拖动顶部钴蓝标尺把大标本与底行小卡拉开到 1.35× 以上，读者才会先稳看核心大卡、再快速扫过底行小标本与 VS 对照。",
      actionLabel: "拉到 1.78× 原海报黄金阶梯",
      fixPatch: { scaleRatio: 1.78 },
    });
  }

  issues.sort((a, b) => a.severity - b.severity);

  // 三大支柱状态（直接驱动刊头三枚蓝徽 + 左侧三锚功能脊）
  const pillarStatus = {
    module: issues.some((i) => i.pillar === "module")
      ? { ok: false, text: issues.find((i) => i.pillar === "module").badge }
      : {
          ok: true,
          text: state.gridMode === "uniform" ? "4×2 等大齐整" : "基线 0px 齐整",
        },
    caption: issues.some((i) => i.pillar === "caption")
      ? { ok: false, text: issues.find((i) => i.pillar === "caption").badge }
      : { ok: true, text: "色点+两行定槽" },
    rhythm: issues.some((i) => i.pillar === "rhythm")
      ? { ok: false, text: issues.find((i) => i.pillar === "rhythm").badge }
      : {
          ok: true,
          text: hasStrongVs ? `${measuredAreaRatio.toFixed(2)}× · VS成立` : `${measuredAreaRatio.toFixed(2)}× 阶梯`,
        },
  };

  // 最终校样评语（多组合法解）
  let verdict;
  if (issues.length === 0) {
    let solutionName = "原海报阶梯对照解";
    let solutionWhy = `上两行 3 列大标本稳住秩序，底行 5 格紧凑变奏配「${items[state.vsPair[0]].zh} VS ${items[state.vsPair[1]].zh}」直出反差，实测大/小面积比 ${measuredAreaRatio.toFixed(2)}×、基线错差 0px，扫读一路有起有落。`;
    if (state.gridMode === "uniform") {
      solutionName = "严谨等大标本解";
      solutionWhy = `前两行 4×2 严谨等大格阵保证每件标本享有同等客观尺度，底行借「${items[state.vsPair[0]].zh} VS ${items[state.vsPair[1]].zh}」制造收尾对照，最适合博物馆藏品总录与工业规格型录。`;
    } else if (measuredAreaRatio >= 2.05) {
      solutionName = "主次策展对照解";
      solutionWhy = `将主次面积差拉至 ${measuredAreaRatio.toFixed(2)}×，突出重点展品区、把次级样本收进底带并辅以有效 VS 对比，适合策展画册与年度精选图录。`;
    }
    verdict = {
      pass: true,
      code: "APPROVED",
      tag: `通过付印 · ${solutionName}`,
      title: `图录秩序成立：${solutionName}`,
      why: solutionWhy,
      actionLabel: null,
      fixPatch: null,
      issueCount: 0,
    };
  } else {
    const top = issues[0];
    verdict = {
      pass: false,
      code: "REJECTED",
      tag: `校样退回 · ${issues.length} 处待整`,
      title: top.title,
      why: top.why,
      actionLabel: top.actionLabel,
      fixPatch: top.fixPatch,
      issueCount: issues.length,
    };
  }

  return {
    theme,
    cards,
    vsBox,
    rulerBar,
    pathPoints,
    metrics: {
      baselineJitterPx: Math.round(maxBaselineJitter),
      minCardW: Math.round(minCardW),
      minCardH: Math.round(minCardH),
      captionLineSpread,
      maxOcclusionPct,
      measuredAreaRatio,
      scaleRatio: sr,
      vsQuality: vsEval.quality,
      vsReason: vsEval.reason,
    },
    pillarStatus,
    issues,
    verdict,
  };
}
