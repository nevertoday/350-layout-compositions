// 165 索引版式（INDEX LAYOUT）单真源数据与几何评估模型
// 画布渲染、右侧书口切口、左侧诊单与活体示例卡全部读取本模块计算出的同一份状态与实绘坐标。

export const DATASETS = {
  poster: {
    id: "poster",
    label: "原海报·排版词典",
    shortLabel: "排版词典",
    edition: "POSTER SPECIMEN · 21 TERMS",
    defaultTarget: "B03",
    trailIds: ["A01", "C01", "D01", "E01", "B03"],
    brokenSample: { from: "B01", displayCode: "B02", wrongRef: "G01", realRef: "E01", realRefLabel: "网格" },
    groups: [
      { id: "A", zh: "内容元素", en: "CONTENT" },
      { id: "B", zh: "版式结构", en: "STRUCTURE" },
      { id: "C", zh: "组织方式", en: "ORGANIZATION" },
      { id: "D", zh: "视觉节奏", en: "RHYTHM" },
      { id: "E", zh: "网格系统", en: "GRID" },
      { id: "F", zh: "导航与引导", en: "NAVIGATION" },
      { id: "G", zh: "功能与目标", en: "FUNCTION" },
    ],
    // tier 1:1 核对自 165 原海报：primary 实心绿圆 / secondary 空心绿环 / related 虚线绿环
    terms: [
      { id: "A01", group: "A", zh: "标题", en: "TITLE", tier: "primary", subOf: null, rawOrder: 11, refs: ["C01", "C02", "G03"] },
      { id: "A02", group: "A", zh: "图像", en: "IMAGE", tier: "primary", subOf: null, rawOrder: 3, refs: ["B03", "G03"] },
      { id: "A03", group: "A", zh: "文字", en: "TEXT", tier: "secondary", subOf: "A01", rawOrder: 18, refs: ["E02", "G01"] },

      { id: "B01", group: "B", zh: "版心", en: "BLOCK AREA", tier: "primary", subOf: null, rawOrder: 7, refs: ["B03", "E01"] },
      { id: "B02", group: "B", zh: "栏数", en: "COLUMN", tier: "secondary", subOf: "B01", rawOrder: 15, refs: ["E01", "E03"] },
      { id: "B03", group: "B", zh: "留白", en: "WHITE SPACE", tier: "primary", subOf: null, rawOrder: 16, refs: ["E01", "B01", "D01"] },

      { id: "C01", group: "C", zh: "对齐", en: "ALIGNMENT", tier: "primary", subOf: null, rawOrder: 5, refs: ["A01", "D01", "E01"] },
      { id: "C02", group: "C", zh: "层级", en: "HIERARCHY", tier: "primary", subOf: null, rawOrder: 19, refs: ["A01", "D02", "F02"] },
      { id: "C03", group: "C", zh: "模块", en: "MODULE", tier: "secondary", subOf: "C01", rawOrder: 1, refs: ["E01", "D03"] },

      { id: "D01", group: "D", zh: "节奏", en: "RHYTHM", tier: "primary", subOf: null, rawOrder: 13, refs: ["C01", "E01", "D03"] },
      { id: "D02", group: "D", zh: "对比", en: "CONTRAST", tier: "secondary", subOf: "D01", rawOrder: 8, refs: ["C02", "G03"] },
      { id: "D03", group: "D", zh: "重复", en: "REPEAT", tier: "related", subOf: "D01", rawOrder: 20, refs: ["D01", "C03"] },

      { id: "E01", group: "E", zh: "网格", en: "GRID", tier: "primary", subOf: null, rawOrder: 17, refs: ["B01", "B03", "D01"] },
      { id: "E02", group: "E", zh: "基线", en: "BASELINE", tier: "secondary", subOf: "E01", rawOrder: 4, refs: ["A03", "C01"] },
      { id: "E03", group: "E", zh: "间距", en: "SPACING", tier: "secondary", subOf: "E01", rawOrder: 12, refs: ["B03", "D01"] },

      { id: "F01", group: "F", zh: "导航", en: "NAVIGATION", tier: "secondary", subOf: "F02", rawOrder: 6, refs: ["F02", "F03"] },
      { id: "F02", group: "F", zh: "索引", en: "INDEX", tier: "primary", subOf: null, rawOrder: 14, refs: ["F01", "C02", "G02"] },
      { id: "F03", group: "F", zh: "面包屑", en: "BREADCRUMB", tier: "related", subOf: "F02", rawOrder: 2, refs: ["F01", "F02"] },

      { id: "G01", group: "G", zh: "可读性", en: "READABILITY", tier: "secondary", subOf: "G03", rawOrder: 9, refs: ["A03", "E02", "B03"] },
      { id: "G02", group: "G", zh: "易用性", en: "USABILITY", tier: "related", subOf: "G03", rawOrder: 21, refs: ["F02", "F01"] },
      { id: "G03", group: "G", zh: "焦点", en: "FOCUS", tier: "primary", subOf: null, rawOrder: 10, refs: ["A01", "A02", "D02"] },
    ],
  },

  botany: {
    id: "botany",
    label: "植物图鉴索引",
    shortLabel: "植物图鉴",
    edition: "FLORA ATLAS · 21 TAXA",
    defaultTarget: "B03",
    trailIds: ["A01", "C01", "E01", "G01", "B03"],
    brokenSample: { from: "B01", displayCode: "B02", wrongRef: "G03", realRef: "E01", realRefLabel: "睡莲" },
    groups: [
      { id: "A", zh: "落叶乔木", en: "DECIDUOUS" },
      { id: "B", zh: "常绿灌木", en: "SHRUBS" },
      { id: "C", zh: "荫生蕨类", en: "FERNS" },
      { id: "D", zh: "苔藓地衣", en: "MOSSES" },
      { id: "E", zh: "水生植物", en: "AQUATIC" },
      { id: "F", zh: "兰科花卉", en: "ORCHIDS" },
      { id: "G", zh: "本草药用", en: "HERBS" },
    ],
    terms: [
      { id: "A01", group: "A", zh: "银杏", en: "GINKGO", tier: "primary", subOf: null, rawOrder: 12, refs: ["A02", "G01"] },
      { id: "A02", group: "A", zh: "水杉", en: "DAWN REDWOOD", tier: "primary", subOf: null, rawOrder: 4, refs: ["A01", "E02"] },
      { id: "A03", group: "A", zh: "红枫", en: "JAPANESE MAPLE", tier: "secondary", subOf: "A01", rawOrder: 19, refs: ["B02", "A01"] },

      { id: "B01", group: "B", zh: "山茶", en: "CAMELLIA", tier: "primary", subOf: null, rawOrder: 6, refs: ["B03", "E01"] },
      { id: "B02", group: "B", zh: "杜鹃", en: "RHODODENDRON", tier: "secondary", subOf: "B01", rawOrder: 14, refs: ["A03", "D01"] },
      { id: "B03", group: "B", zh: "栀子", en: "GARDENIA", tier: "primary", subOf: null, rawOrder: 17, refs: ["E01", "B01", "G02"] },

      { id: "C01", group: "C", zh: "铁线蕨", en: "MAIDENHAIR", tier: "primary", subOf: null, rawOrder: 5, refs: ["D01", "E01"] },
      { id: "C02", group: "C", zh: "鹿角蕨", en: "STAGHORN", tier: "primary", subOf: null, rawOrder: 20, refs: ["F01", "C01"] },
      { id: "C03", group: "C", zh: "肾蕨", en: "SWORD FERN", tier: "secondary", subOf: "C01", rawOrder: 2, refs: ["C01", "D02"] },

      { id: "D01", group: "D", zh: "白发藓", en: "PINCUSHION", tier: "primary", subOf: null, rawOrder: 11, refs: ["C01", "D03"] },
      { id: "D02", group: "D", zh: "羽藓", en: "FEATHER MOSS", tier: "secondary", subOf: "D01", rawOrder: 8, refs: ["C03", "D01"] },
      { id: "D03", group: "D", zh: "地钱", en: "LIVERWORT", tier: "related", subOf: "D01", rawOrder: 21, refs: ["D01", "E03"] },

      { id: "E01", group: "E", zh: "睡莲", en: "WATER LILY", tier: "primary", subOf: null, rawOrder: 16, refs: ["B03", "E02", "C01"] },
      { id: "E02", group: "E", zh: "菖蒲", en: "SWEET FLAG", tier: "secondary", subOf: "E01", rawOrder: 3, refs: ["A02", "G03"] },
      { id: "E03", group: "E", zh: "浮萍", en: "DUCKWEED", tier: "secondary", subOf: "E01", rawOrder: 13, refs: ["E01", "D03"] },

      { id: "F01", group: "F", zh: "蝴蝶兰", en: "PHALAENOPSIS", tier: "secondary", subOf: "F02", rawOrder: 7, refs: ["C02", "F02"] },
      { id: "F02", group: "F", zh: "春兰", en: "CYMBIDIUM", tier: "primary", subOf: null, rawOrder: 15, refs: ["F01", "F03"] },
      { id: "F03", group: "F", zh: "石斛", en: "DENDROBIUM", tier: "related", subOf: "F02", rawOrder: 1, refs: ["F02", "G01"] },

      { id: "G01", group: "G", zh: "艾草", en: "MUGWORT", tier: "secondary", subOf: "G03", rawOrder: 9, refs: ["A01", "G03"] },
      { id: "G02", group: "G", zh: "金银花", en: "HONEYSUCKLE", tier: "related", subOf: "G03", rawOrder: 18, refs: ["B03", "G03"] },
      { id: "G03", group: "G", zh: "薄荷", en: "MINT", tier: "primary", subOf: null, rawOrder: 10, refs: ["E02", "G01", "G02"] },
    ],
  },

  medicine: {
    id: "medicine",
    label: "医学术语索引",
    shortLabel: "医学术语",
    edition: "CLINICAL INDEX · 21 TERMS",
    defaultTarget: "B03",
    trailIds: ["A01", "B01", "C01", "F01", "B03"],
    brokenSample: { from: "B01", displayCode: "B02", wrongRef: "G02", realRef: "F01", realRefLabel: "核磁共振" },
    groups: [
      { id: "A", zh: "神经系统", en: "NEUROLOGY" },
      { id: "B", zh: "心血管", en: "CARDIOLOGY" },
      { id: "C", zh: "呼吸系统", en: "PULMONARY" },
      { id: "D", zh: "消化代谢", en: "DIGESTIVE" },
      { id: "E", zh: "免疫血液", en: "IMMUNOLOGY" },
      { id: "F", zh: "医学影像", en: "RADIOLOGY" },
      { id: "G", zh: "临床药理", en: "PHARMACOLOGY" },
    ],
    terms: [
      { id: "A01", group: "A", zh: "突触", en: "SYNAPSE", tier: "primary", subOf: null, rawOrder: 11, refs: ["A02", "G01"] },
      { id: "A02", group: "A", zh: "脑电图", en: "EEG", tier: "primary", subOf: null, rawOrder: 3, refs: ["A01", "F01"] },
      { id: "A03", group: "A", zh: "髓鞘", en: "MYELIN", tier: "secondary", subOf: "A01", rawOrder: 18, refs: ["A01", "E02"] },

      { id: "B01", group: "B", zh: "窦房结", en: "SA NODE", tier: "primary", subOf: null, rawOrder: 7, refs: ["B03", "F01"] },
      { id: "B02", group: "B", zh: "瓣膜", en: "HEART VALVE", tier: "secondary", subOf: "B01", rawOrder: 15, refs: ["B01", "F02"] },
      { id: "B03", group: "B", zh: "心电图", en: "ECG", tier: "primary", subOf: null, rawOrder: 16, refs: ["F01", "B01", "C01"] },

      { id: "C01", group: "C", zh: "肺泡", en: "ALVEOLUS", tier: "primary", subOf: null, rawOrder: 5, refs: ["B03", "C02", "F03"] },
      { id: "C02", group: "C", zh: "支气管", en: "BRONCHUS", tier: "primary", subOf: null, rawOrder: 19, refs: ["C01", "E01"] },
      { id: "C03", group: "C", zh: "通气量", en: "TIDAL VOLUME", tier: "secondary", subOf: "C01", rawOrder: 1, refs: ["C01", "C02"] },

      { id: "D01", group: "D", zh: "胰岛素", en: "INSULIN", tier: "primary", subOf: null, rawOrder: 13, refs: ["D02", "G03"] },
      { id: "D02", group: "D", zh: "肝糖原", en: "GLYCOGEN", tier: "secondary", subOf: "D01", rawOrder: 8, refs: ["D01", "D03"] },
      { id: "D03", group: "D", zh: "胆汁酸", en: "BILE ACID", tier: "related", subOf: "D01", rawOrder: 20, refs: ["D02", "G02"] },

      { id: "E01", group: "E", zh: "抗原", en: "ANTIGEN", tier: "primary", subOf: null, rawOrder: 17, refs: ["E02", "C02"] },
      { id: "E02", group: "E", zh: "淋巴细胞", en: "LYMPHOCYTE", tier: "secondary", subOf: "E01", rawOrder: 4, refs: ["E01", "A03"] },
      { id: "E03", group: "E", zh: "补体", en: "COMPLEMENT", tier: "secondary", subOf: "E01", rawOrder: 12, refs: ["E01", "E02"] },

      { id: "F01", group: "F", zh: "核磁共振", en: "MRI", tier: "primary", subOf: null, rawOrder: 14, refs: ["B03", "A02", "F02"] },
      { id: "F02", group: "F", zh: "超声", en: "ULTRASOUND", tier: "secondary", subOf: "F01", rawOrder: 6, refs: ["B02", "F01"] },
      { id: "F03", group: "F", zh: "断层扫描", en: "CT SCAN", tier: "related", subOf: "F01", rawOrder: 2, refs: ["C01", "F01"] },

      { id: "G01", group: "G", zh: "半衰期", en: "HALF-LIFE", tier: "secondary", subOf: "G03", rawOrder: 9, refs: ["A01", "G03"] },
      { id: "G02", group: "G", zh: "拮抗剂", en: "ANTAGONIST", tier: "related", subOf: "G03", rawOrder: 21, refs: ["D03", "G03"] },
      { id: "G03", group: "G", zh: "受体", en: "RECEPTOR", tier: "primary", subOf: null, rawOrder: 10, refs: ["D01", "G01", "G02"] },
    ],
  },
};

export const SORT_MODES = [
  { id: "unsorted", label: "录入乱序", short: "无切口" },
  { id: "alpha", label: "纯字母序", short: "无切口" },
  { id: "grouped", label: "A–G 切口", short: "原海报" },
  { id: "overcut", label: "14 碎切口", short: "过碎试错" },
];

export const HIERARCHY_MODES = [
  { id: "flat", label: "全同级", short: "拍平" },
  { id: "dots", label: "三态圆点", short: "原海报" },
  { id: "indent", label: "缩进嵌套", short: "CMOS" },
  { id: "overload", label: "全绿高亮", short: "过载试错" },
];

export const LOCATOR_MODES = [
  { id: "glued", label: "紧黏无引线", short: "混糊" },
  { id: "dotted", label: "疏点 + 定位码", short: "原海报" },
  { id: "inline", label: "窄栏紧随码", short: "书后解" },
  { id: "heavy", label: "粗黑实横线", short: "斑马试错" },
];

export const XREF_MODES = [
  { id: "none", label: "孤岛无链", short: "断开" },
  { id: "broken", label: "错码死链", short: "失步试错" },
  { id: "clean", label: "精准互链", short: "双向" },
  { id: "spaghetti", label: "全网滥连", short: "蛛网试错" },
];

// 开场默认：0/4 失序泥潭（绝不先给答案）
export const INITIAL_STATE = {
  dataset: "poster",
  sortMode: "unsorted",
  hierarchyMode: "flat",
  locatorMode: "glued",
  xrefMode: "none",
  targetId: "B03",
  selectedId: "B03",
  scrubPos: 0.24, // 0..1 连续翻槽/扫描游标
};

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    patch: { sortMode: "unsorted", hierarchyMode: "flat", locatorMode: "glued", xrefMode: "none" },
  },
  posterSol: {
    label: "原海报切口解",
    patch: { sortMode: "grouped", hierarchyMode: "dots", locatorMode: "dotted", xrefMode: "clean" },
  },
  chicagoSol: {
    label: "芝加哥书后解",
    patch: { sortMode: "grouped", hierarchyMode: "indent", locatorMode: "inline", xrefMode: "clean" },
  },
  compactSol: {
    label: "精简词典解",
    patch: { sortMode: "alpha", hierarchyMode: "indent", locatorMode: "dotted", xrefMode: "clean" },
  },
  trapOvercut: {
    label: "试错: 14碎切口",
    patch: { sortMode: "overcut", hierarchyMode: "dots", locatorMode: "dotted", xrefMode: "clean" },
  },
  trapBrokenRef: {
    label: "试错: 错码死链",
    patch: { sortMode: "grouped", hierarchyMode: "dots", locatorMode: "dotted", xrefMode: "broken" },
  },
  trapHeavy: {
    label: "试错: 斑马粗线",
    patch: { sortMode: "grouped", hierarchyMode: "overload", locatorMode: "heavy", xrefMode: "spaghetti" },
  },
};

export function getDataset(state) {
  return DATASETS[state.dataset] || DATASETS.poster;
}

export function getOrderedTerms(state) {
  const ds = getDataset(state);
  const list = [...ds.terms];
  if (state.sortMode === "unsorted") {
    list.sort((a, b) => a.rawOrder - b.rawOrder);
  } else if (state.sortMode === "alpha") {
    list.sort((a, b) => a.en.localeCompare(b.en));
  } else {
    // grouped or overcut: 按类别 A–G 及编码升序
    list.sort((a, b) => a.id.localeCompare(b.id));
  }
  return list;
}

// 计算有效书口桶结构
export function getBuckets(state, ordered) {
  const ds = getDataset(state);
  if (state.sortMode === "unsorted") {
    return [{ key: "ALL", zh: "未分类流水表", en: "UNSORTED", items: ordered, hasTab: false }];
  }
  if (state.sortMode === "alpha") {
    // 按英文首字母分桶（无右侧切口或仅有字母段头）
    const map = new Map();
    for (const t of ordered) {
      const k = t.en[0].toUpperCase();
      if (!map.has(k)) map.set(k, { key: k, zh: `${k} 开头`, en: `LETTER ${k}`, items: [], hasTab: false });
      map.get(k).items.push(t);
    }
    return [...map.values()];
  }
  if (state.sortMode === "overcut") {
    // 14 个过度切碎的书口槽（每槽仅 1-2 条，切口反增扫视负担）
    const out = [];
    for (const g of ds.groups) {
      const items = ordered.filter((t) => t.group === g.id);
      out.push({ key: `${g.id}1`, zh: `${g.zh}·上`, en: `${g.en} I`, items: items.slice(0, 2), hasTab: true });
      out.push({ key: `${g.id}2`, zh: `${g.zh}·下`, en: `${g.en} II`, items: items.slice(2), hasTab: true });
    }
    return out;
  }
  // grouped: 原海报 A–G 七大类 + 右侧书口切口
  return ds.groups.map((g) => ({
    key: g.id,
    zh: g.zh,
    en: g.en,
    items: ordered.filter((t) => t.group === g.id),
    hasTab: true,
  }));
}

// 构造每个词条当前生效的关联引用（包含图论死链校验数据）
export function getActiveRefs(state, term) {
  const ds = getDataset(state);
  const idMap = new Map(ds.terms.map((t) => [t.id, t]));
  if (state.xrefMode === "none") return [];
  if (state.xrefMode === "broken") {
    // 模拟真实校对失步：目标词或 B01 的首条关联被错标成不存在或错位的码（如把网格 E01 错指成 X99 / 错位码）
    const isBrokenHost = term.id === state.targetId || term.id === ds.brokenSample.from;
    return term.refs.slice(0, 2).map((refId, idx) => {
      if (isBrokenHost && idx === 0) {
        return {
          toId: ds.brokenSample.wrongRef,
          expectedId: refId,
          label: `${idMap.get(refId)?.zh || "目标"} → 错指 ${ds.brokenSample.wrongRef}`,
          broken: true,
        };
      }
      const target = idMap.get(refId);
      return { toId: refId, expectedId: refId, label: target ? `${target.zh} ${target.id}` : refId, broken: !target };
    });
  }
  if (state.xrefMode === "spaghetti") {
    // 全网滥连：每条塞满 6 条关联，视觉变成蜘蛛网
    const allIds = ds.terms.map((t) => t.id).filter((id) => id !== term.id);
    const idx = ds.terms.findIndex((t) => t.id === term.id);
    const extra = [];
    for (let k = 1; k <= 6; k++) extra.push(allIds[(idx * 3 + k * 4) % allIds.length]);
    return [...new Set([...term.refs, ...extra])].slice(0, 6).map((refId) => {
      const target = idMap.get(refId);
      return { toId: refId, expectedId: refId, label: `${target.zh} ${target.id}`, broken: false };
    });
  }
  // clean: 精准双向关联
  return term.refs.slice(0, 3).map((refId) => {
    const target = idMap.get(refId);
    return { toId: refId, expectedId: refId, label: `${target.zh} ${target.id}`, broken: false };
  });
}

// 核心单真源几何排布：输出每一行词条、每个组块、每个右侧书口切口在画布上的真实像素矩形
export function computeLayout(state, width, height, { showInlineTabs = true } = {}) {
  const ordered = getOrderedTerms(state);
  const buckets = getBuckets(state, ordered);
  const compact = width < 520;
  const padX = compact ? 10 : 18;
  const padTop = compact ? 36 : 40;
  const padBottom = compact ? 36 : 38;
  const tabW = showInlineTabs ? (compact ? 28 : 34) : 0;
  const innerW = Math.max(200, width - padX * 2 - (showInlineTabs ? tabW + 8 : 0));
  const innerH = Math.max(210, height - padTop - padBottom);

  // 当高度较矮（如 844×390 横屏画布）时，自动切为左右两栏，即便 unsorted 也对半均分，不留右半空洞
  const useTwoCols = height < 350 && width >= 410;
  const colGap = 14;
  const colW = useTwoCols ? (innerW - colGap) / 2 : innerW;

  const rows = [];
  const groupBoxes = [];
  const tabRects = [];

  // 右侧书口切口槽位计算（宽屏由外部 45° 斜切 DOM 脊承担，此处保留逻辑坐标供射线寻址）
  const tabX = showInlineTabs ? width - tabW - 4 : width - 4;
  const tabY0 = padTop;
  const tabTotalH = innerH;
  if (state.sortMode === "grouped") {
    const step = tabTotalH / 7;
    buckets.forEach((b, i) => {
      tabRects.push({ key: b.key, zh: b.zh, x: tabX, y: tabY0 + i * step, w: Math.max(4, tabW), h: step, active: true, overcut: false });
    });
  } else if (state.sortMode === "overcut") {
    const step = tabTotalH / buckets.length;
    buckets.forEach((b, i) => {
      tabRects.push({ key: b.key, zh: b.zh, x: tabX, y: tabY0 + i * step, w: Math.max(4, tabW), h: step, active: true, overcut: true });
    });
  } else {
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const step = tabTotalH / 7;
    letters.forEach((L, i) => {
      tabRects.push({ key: L, zh: "未建切口", x: tabX, y: tabY0 + i * step, w: Math.max(4, tabW), h: step, active: false, overcut: false });
    });
  }

  // 行排布计算
  const placeColumn = (colBuckets, x0, availW) => {
    const totalItems = colBuckets.reduce((s, b) => s + b.items.length, 0);
    const groupGaps = Math.max(0, colBuckets.length - 1) * (colBuckets.length > 8 ? 2 : 4);
    const rowH = Math.max(12, (innerH - groupGaps) / Math.max(1, totalItems));
    let curY = padTop;
    const labelColW = state.sortMode === "grouped" ? (compact ? 64 : 114) : state.sortMode === "overcut" ? (compact ? 48 : 82) : state.sortMode === "alpha" ? (compact ? 26 : 38) : 0;

    for (const b of colBuckets) {
      const gh = b.items.length * rowH;
      groupBoxes.push({
        key: b.key,
        zh: b.zh,
        en: b.en,
        hasTab: b.hasTab,
        x: x0,
        y: curY,
        w: availW,
        h: gh,
        labelW: labelColW,
      });

      b.items.forEach((term, idxInBucket) => {
        const ry = curY + idxInBucket * rowH;
        const indentPx =
          state.hierarchyMode === "indent"
            ? term.tier === "primary"
              ? 0
              : term.tier === "secondary"
                ? (compact ? 11 : 16)
                : (compact ? 18 : 26)
            : 0;
        // 为左侧盲扫轨迹预留 18px 清晰轨道，绝不压中文字
        const textX = x0 + labelColW + (labelColW ? (compact ? 10 : 14) : 20) + indentPx;
        const codeW = compact ? 30 : 38;
        const dotR = compact ? 3.4 : 4.1;
        const codeX = x0 + availW - codeW - 6;
        const dotX = codeX - (compact ? 12 : 16);
        const zhW = term.zh.length * (compact ? 10.5 : 12.2);
        const enW = term.en.length * (compact ? 5.2 : 6.1);
        const textEnd = Math.min(dotX - 10, textX + zhW + (compact ? 6 : 10) + enW);
        const leaderSpan = Math.max(0, dotX - 10 - textEnd);

        rows.push({
          term,
          bucketKey: b.key,
          indexInBucket: idxInBucket,
          bucketSize: b.items.length,
          x: x0,
          y: ry,
          w: availW,
          h: rowH,
          cy: ry + rowH / 2,
          textX,
          textEnd,
          dotX,
          dotR,
          codeX,
          codeW,
          leaderSpan,
          indentPx,
        });
      });

      curY += gh + (colBuckets.length > 8 ? 2 : 4);
    }
  };

  if (useTwoCols) {
    if (buckets.length === 1) {
      // 未分类流水账也对半拆入左右两栏，避免右栏空洞和底部行压滑轨
      const allItems = buckets[0].items;
      const mid = Math.ceil(allItems.length / 2);
      placeColumn([{ ...buckets[0], items: allItems.slice(0, mid) }], padX, colW);
      placeColumn([{ ...buckets[0], items: allItems.slice(mid) }], padX + colW + colGap, colW);
    } else {
      const half = Math.ceil(buckets.length / 2);
      placeColumn(buckets.slice(0, half), padX, colW);
      placeColumn(buckets.slice(half), padX + colW + colGap, colW);
    }
  } else {
    placeColumn(buckets, padX, colW);
  }

  rows.forEach((r, i) => {
    r.globalIndex = i;
  });

  const scrubTrack = {
    x: padX,
    y: height - 20,
    w: innerW,
    h: 12,
  };

  return { width, height, compact, useTwoCols, showInlineTabs, padX, padTop, padBottom, innerW, innerH, rows, groupBoxes, tabRects, buckets, scrubTrack };
}

// 从当前帧实绘 layout 单真源核算 4 大维度、8 类双向错态、查词步数与合法解判定
export function evaluate(state, layout) {
  const ds = getDataset(state);
  const rowById = new Map(layout.rows.map((r) => [r.term.id, r]));
  const targetRow = rowById.get(state.targetId) || layout.rows[0];
  const selectedRow = rowById.get(state.selectedId) || targetRow;

  // 1. 检索与分类切口实算：计算找到目标词的真实步骤数
  let scanSteps = targetRow.globalIndex + 1; // 乱序：必须逐行线性扫
  let scanPathNodes = [];
  let sortStatus = "fail";
  let sortDetail = "";

  if (state.sortMode === "unsorted") {
    scanSteps = targetRow.globalIndex + 1;
    // 线性扫描路径走左缘专属轨道（x = textX - 10），绝不压中文字，最后折向命中词条
    for (let i = 0; i <= targetRow.globalIndex; i++) {
      const r = layout.rows[i];
      scanPathNodes.push({ x: r.textX - 10, y: r.cy, kind: "scan" });
    }
    scanPathNodes.push({ x: targetRow.textX - 3, y: targetRow.cy, kind: "hit" });
    sortStatus = "fail";
    sortDetail = `无分类无切口，线性盲扫第 ${scanSteps}/21 行才撞见「${targetRow.term.zh}」`;
  } else if (state.sortMode === "alpha") {
    // 纯字母序：无右侧切口，但有序可二分定位（约 log2(bucketCount) + 桶内位序）
    const bIdx = layout.buckets.findIndex((b) => b.key === targetRow.bucketKey);
    const jumpSteps = Math.max(2, Math.ceil(Math.log2(layout.buckets.length + 1)));
    scanSteps = jumpSteps + targetRow.indexInBucket;
    scanPathNodes.push({ x: layout.padX + 12, y: layout.padTop + 6, kind: "entry" });
    scanPathNodes.push({ x: targetRow.x + 18, y: targetRow.cy, kind: "bucket" });
    scanPathNodes.push({ x: targetRow.codeX + 12, y: targetRow.cy, kind: "hit" });
    // 纯字母排序且没有碎切口，是传统书后索引的合法解之一！
    sortStatus = "pass";
    sortDetail = `字母序跳查 ${scanSteps} 步落位（书后标准法）`;
  } else if (state.sortMode === "overcut") {
    // 14 碎切口：光在右缘 14 个拥挤切口里辨认槽位就需扫视一半切口，再进桶
    const bIdx = layout.buckets.findIndex((b) => b.key === targetRow.bucketKey);
    scanSteps = Math.ceil((bIdx + 1) * 0.7) + 4 + targetRow.indexInBucket;
    const tab = layout.tabRects[bIdx] || layout.tabRects[0];
    scanPathNodes.push({ x: tab.x + tab.w / 2, y: layout.padTop + 8, kind: "entry" });
    scanPathNodes.push({ x: tab.x + tab.w / 2, y: tab.y + tab.h / 2, kind: "tab" });
    scanPathNodes.push({ x: targetRow.textX + 18, y: targetRow.cy, kind: "hit" });
    sortStatus = "fail";
    sortDetail = `切口裂成 14 细槽（槽高仅 ${Math.round(tab.h)}px），书口本身先堵眼`;
  } else {
    // grouped: A–G 七大类 + 右缘切口：1 跳入切口 + 桶内 1..3 行
    // 路径从右侧书口切口先水平滑入目标组顶缝，再沿定位码右侧边缘落到目标行，绝不横穿词条文字
    const tab = layout.tabRects.find((t) => t.key === targetRow.bucketKey) || layout.tabRects[0];
    const gb = layout.groupBoxes.find((g) => g.key === targetRow.bucketKey) || layout.groupBoxes[0];
    scanSteps = 1 + (targetRow.indexInBucket + 1);
    scanPathNodes.push({ x: tab.x + (layout.showInlineTabs ? tab.w / 2 : 0), y: tab.y + tab.h / 2, kind: "tab" });
    scanPathNodes.push({ x: targetRow.x + targetRow.w - 3, y: gb.y + 3, kind: "bucket" });
    scanPathNodes.push({ x: targetRow.x + targetRow.w - 3, y: targetRow.cy, kind: "hit" });
    sortStatus = "pass";
    sortDetail = `书口切口 1 跳入 ${targetRow.bucketKey} 组，桶内扫 ${targetRow.indexInBucket + 1} 行直达`;
  }

  // 2. 层级区分度实算
  let hierStatus = "fail";
  let hierLabel = "0 区分";
  if (state.hierarchyMode === "flat") {
    hierStatus = "fail";
    hierLabel = "全拍平";
  } else if (state.hierarchyMode === "overload") {
    hierStatus = "fail";
    hierLabel = "满屏高亮";
  } else if (state.hierarchyMode === "dots") {
    hierStatus = "pass";
    hierLabel = "三态圆点";
  } else {
    hierStatus = "pass";
    hierLabel = "缩进嵌套";
  }

  // 3. 定位列与引导线实算（从实绘跨距与模式核算）
  const avgLeaderSpan = Math.round(layout.rows.reduce((s, r) => s + r.leaderSpan, 0) / Math.max(1, layout.rows.length));
  let locStatus = "fail";
  let locLabel = "紧黏混糊";
  if (state.locatorMode === "glued") {
    locStatus = "fail";
    locLabel = "紧黏无分";
  } else if (state.locatorMode === "heavy") {
    locStatus = "fail";
    locLabel = "粗线斑马";
  } else if (state.locatorMode === "dotted") {
    locStatus = "pass";
    locLabel = `疏点 ${avgLeaderSpan}px`;
  } else {
    // inline 紧随定位码：书后窄栏合法解
    locStatus = "pass";
    locLabel = "紧随齐左";
  }

  // 4. 交叉引用图论校验（实测每条边是否有效 & 平均出度）
  let totalEdges = 0;
  let brokenEdges = 0;
  for (const r of layout.rows) {
    const refs = getActiveRefs(state, r.term);
    totalEdges += refs.length;
    for (const ref of refs) {
      if (ref.broken || !rowById.has(ref.toId)) brokenEdges++;
    }
  }
  const avgOutDegree = +(totalEdges / Math.max(1, layout.rows.length)).toFixed(1);
  let xrefStatus = "fail";
  let xrefLabel = "0 链孤岛";
  if (state.xrefMode === "none") {
    xrefStatus = "fail";
    xrefLabel = "0 链孤岛";
  } else if (state.xrefMode === "broken") {
    xrefStatus = "fail";
    xrefLabel = `死链 ${brokenEdges} 处`;
  } else if (state.xrefMode === "spaghetti") {
    xrefStatus = "fail";
    xrefLabel = `滥连 ${avgOutDegree} 链/词`;
  } else {
    xrefStatus = "pass";
    xrefLabel = `有效 ${avgOutDegree} 链/词`;
  }

  // 汇总问题列表（双向失误全覆盖）
  const issues = [];
  if (state.sortMode === "unsorted") {
    issues.push({
      id: "unsorted",
      pillar: "sort",
      badge: `× 无分类乱序 · 盲扫 ${scanSteps} 行`,
      title: `21 词条乱序堆成流水账，查「${targetRow.term.zh}」得逐行盲扫 ${scanSteps} 行`,
      reason: "没有分类桶和书口切口，读者只能从第 1 行一行行往下撞运气。词条涨到几百条时，索引就彻底退化成了无法检索的清单。",
      fixLabel: "开启 A–G 分类与书口切口",
      fixPatch: { sortMode: "grouped" },
    });
  } else if (state.sortMode === "overcut") {
    issues.push({
      id: "overcut",
      pillar: "sort",
      badge: "× 切口过碎 · 14 槽反堵眼",
      title: "书口被切碎成 14 个细槽，找切口本身比找词还费劲",
      reason: "分桶不是越细越好：每槽只装 1–2 个词时，右侧书口切口被压成极窄细条，手指点不准、眼睛光扫切口就要花掉多余步数。经验上 5–9 个主类（或每桶 3–8 词）最利一跳落位。",
      fixLabel: "合并为 A–G 七大切口",
      fixPatch: { sortMode: "grouped" },
    });
  }

  if (state.hierarchyMode === "flat") {
    issues.push({
      id: "flat",
      pillar: "lookup",
      badge: "× 层级全拍平 · 主次难辨",
      title: "核心词条与扩展词条完全同重，扫过去是一整面灰墙",
      reason: "原海报用「实心核心 / 空心次级 / 虚线关联」三态图标，或《芝加哥格式手册》用 1em 悬垂缩进，都是为了让眼睛先抓核心锚点、再决定是否深挖子目。",
      fixLabel: "切为原海报三态绿点",
      fixPatch: { hierarchyMode: "dots" },
    });
  } else if (state.hierarchyMode === "overload") {
    issues.push({
      id: "overload",
      pillar: "lookup",
      badge: "× 全绿实心过载 · 焦点失效",
      title: "21 个词条全部加重标绿，等于一条重点也没有",
      reason: "高亮靠的是稀缺与反差。当次级词条与扩展关联也涂满实心底色和粗绿块，全页视觉信噪比崩塌，眼睛反而找不到主锚点。",
      fixLabel: "恢复三态层级区分",
      fixPatch: { hierarchyMode: "dots" },
    });
  }

  if (state.locatorMode === "glued") {
    issues.push({
      id: "glued",
      pillar: "lookup",
      badge: "× 定位码紧黏 · 读串难对",
      title: "词条中英文与定位码挤作一团，眼睛落不住编码",
      reason: "没有疏点引导线与等宽右齐定位列（或清晰的齐左紧随间隔），定位码混在英文词尾里，扫到目标词后还要再停顿半秒找编码。",
      fixLabel: "启用疏点引导 + 等宽定位码",
      fixPatch: { locatorMode: "dotted" },
    });
  } else if (state.locatorMode === "heavy") {
    issues.push({
      id: "heavy",
      pillar: "lookup",
      badge: "× 粗黑实线压字 · 斑马噪点",
      title: "21 条粗黑实线把页面切成斑马栅栏，喧宾夺主",
      reason: "引导线只是轻扶眼睛水平渡河的虚桥，一旦加粗成浓黑实线，它的墨量反而盖过中文词条，让整页闪出条纹眩光。",
      fixLabel: "换成克制疏点引导线",
      fixPatch: { locatorMode: "dotted" },
    });
  }

  if (state.xrefMode === "none") {
    issues.push({
      id: "no-xref",
      pillar: "xref",
      badge: "× 关联断开 · 词条成孤岛",
      title: `查完「${targetRow.term.zh}」就断了线，看不到相关概念在哪`,
      reason: "索引不止是定位器，更是知识网。没有交叉引用（see also / 关联推荐），读者查完「留白」却想不起去查「网格」与「版心」，信息彼此孤立。",
      fixLabel: "接通精准双向关联网",
      fixPatch: { xrefMode: "clean" },
    });
  } else if (state.xrefMode === "broken") {
    issues.push({
      id: "broken-xref",
      pillar: "xref",
      badge: `× 检出 ${brokenEdges} 处错码死链`,
      title: `交叉引用编码失步：关联指向了错误的「${ds.brokenSample.wrongRef}」`,
      reason: `就像 165 原海报左下示例卡不慎把「网格」印成 G01（主表实为 E01）一样，手改索引最易发生编码错位。死链会直接打断读者的信任。`,
      fixLabel: "同源校验并修复死链",
      fixPatch: { xrefMode: "clean" },
    });
  } else if (state.xrefMode === "spaghetti") {
    issues.push({
      id: "spaghetti-xref",
      pillar: "xref",
      badge: `× 滥连 ${avgOutDegree} 链/词 · 织成蛛网`,
      title: "每个词都挂 6 条交叉引用，关联线织成密麻蜘蛛网",
      reason: "ISO 999 提醒交叉引用必须有节制：只连最核心的上下位与互补词（通常 1–3 条）。如果什么词都互连，等于把整本书再推回读者面前。",
      fixLabel: "精简为 1–3 条精准互链",
      fixPatch: { xrefMode: "clean" },
    });
  }

  const passed = [sortStatus, hierStatus, locStatus, xrefStatus].filter((s) => s === "pass").length;

  let solutionName = "";
  let solutionBody = "";
  if (passed === 4) {
    if (state.sortMode === "grouped" && state.hierarchyMode === "dots" && state.locatorMode === "dotted") {
      solutionName = "原海报标准解 · 切口疏点辞书";
      solutionBody = "复现 165 原海报全套骨架：右缘 A–G 书口切口实现一跳分桶，三态绿点清晰分层，疏点引线轻扶视线落入等宽编码，底部关联路径打通跨类知识。";
    } else if (state.hierarchyMode === "indent" && state.locatorMode === "inline") {
      solutionName = "芝加哥书后解 · 缩进紧随排法";
      solutionBody = "合乎《芝加哥格式手册》16.26 规范：无需长引导线，以 1em 阶梯缩进区分主次词条，定位码紧随词尾，特别适合双栏窄列学术书籍书后索引。";
    } else if (state.sortMode === "alpha") {
      solutionName = "纯字母典籍解 · 传统书后排检";
      solutionBody = "沿袭 1230 年代全词字母索引传统：按确定字母序排阵配合层级与精准互链，不依赖物理切口也能实现高速定位。";
    } else {
      solutionName = "精简词典合法解 · 结构通畅";
      solutionBody = "分桶克制、层级分明、定位清朗且交叉引用全部通过校验。你可以横拖游标或点击任意切口，体验两跳查词的顺滑感。";
    }
  }

  // 三原则实时状态（对应原海报右上：检索 / 分类 / 关联）
  const pillars = {
    lookup: hierStatus === "pass" && locStatus === "pass" ? "pass" : "fail",
    sort: sortStatus,
    xref: xrefStatus,
  };

  // 目标词及其首条有效关联词
  const targetRefs = getActiveRefs(state, targetRow.term);
  const selectedRefs = getActiveRefs(state, selectedRow.term);

  return {
    passed,
    total: 4,
    allPass: passed === 4,
    statusTag: passed === 4 ? "4/4 · 检索就绪" : `${passed}/4 · ${issues[0]?.id === "overcut" ? "切口过碎" : issues[0]?.id === "broken-xref" ? "错码死链" : issues[0]?.id === "overload" ? "高亮过载" : issues[0]?.id === "heavy" ? "粗线斑马" : issues[0]?.id === "spaghetti-xref" ? "滥连蛛网" : passed === 0 ? "失序泥潭" : "待校准"}`,
    issues,
    primaryIssue: issues[0] || null,
    solutionName,
    solutionBody,
    pillars,
    targetRow,
    selectedRow,
    targetRefs,
    selectedRefs,
    scanPathNodes,
    metrics: {
      scanSteps,
      sortDetail,
      hierLabel,
      locLabel,
      xrefLabel,
      avgLeaderSpan,
      brokenEdges,
      avgOutDegree,
    },
  };
}
