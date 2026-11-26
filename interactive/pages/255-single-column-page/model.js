// 255 单列页面 · 单真源排版与诊断模型（Canvas 视口、探针、诊单、徽标共用同一组实绘数据）

export const VIEWPORTS = {
  desktop: { id: "desktop", label: "桌面 1280", width: 1280, height: 780, url: "journal.example/single-column" },
  tablet: { id: "tablet", label: "平板 768", width: 768, height: 920, url: "journal.example/single-column" },
  mobile: { id: "mobile", label: "手机 390", width: 390, height: 760, url: "m.journal.example/article" },
};

export const SCENARIOS = {
  article: {
    id: "article",
    label: "专栏长文",
    short: "长文阅读",
    url: "editorial.example/single-column-flow",
    eyebrow: "TYPOGRAPHY NOTES · NO. 255",
    blocks: [
      {
        id: "hero",
        kind: "hero",
        rank: 0,
        tag: "主标题",
        title: "为什么好读的长文总爱缩回一列",
        meta: "阅读时间 4 分钟 · 出版排印观察",
      },
      {
        id: "lead",
        kind: "lead",
        rank: 1,
        tag: "核心导语",
        text: "所有内容沿一条垂直轴线有序排列，引导视线自上而下，形成清晰的阅读路径。在有限的宽度里，反而能建立无限的专注。",
      },
      {
        id: "body1",
        kind: "body",
        rank: 2,
        tag: "正文展开",
        heading: "一、把横向扫描压进舒适视野",
        text: "当桌面宽屏把文字从最左端一路铺满到最右端，视线读完行尾再跳回下一行开头时，水平跨越动辄超过千像素，很容易漏看一行或重复读同一行。把正文收束在约二十六至三十八个汉字的列宽内，眼球折返落点稳定，大脑可以把精力留给理解文意。",
      },
      {
        id: "quote",
        kind: "quote",
        rank: 3,
        tag: "节奏停顿",
        text: "留白不是空白，而是节奏的停顿；每一段之前的呼吸缝，都在提醒读者把上一句消化完再往下走。",
        en: "SPACE CREATES RHYTHM",
      },
      {
        id: "footnote",
        kind: "footnote",
        rank: 4,
        tag: "附注细则",
        heading: "参考与补充说明",
        text: "注：行宽阈值参考 W3C WCAG 2.1（SC 1.4.8）中日韩文不超过四十字符建议，以及罗伯特·布林赫斯特关于单栏正文的经典排印经验。",
      },
    ],
  },
  launch: {
    id: "launch",
    label: "产品发布页",
    short: "叙事落地页",
    url: "studio.example/release-note",
    eyebrow: "PRODUCT RELEASE · V2.5",
    blocks: [
      {
        id: "hero",
        kind: "hero",
        rank: 0,
        tag: "核心定位",
        title: "专注写作的纯单列草稿本",
        meta: "零侧栏干扰 · 打开即写 · 本地离线保存",
      },
      {
        id: "lead",
        kind: "lead",
        rank: 1,
        tag: "痛点与主张",
        text: "去掉左右工具墙、悬浮弹窗和无关推荐，只留下一条居中、行宽克制的书页轴线，让思路顺着光标自然往下流。",
      },
      {
        id: "body1",
        kind: "body",
        rank: 2,
        tag: "关键证据",
        heading: "一屏只回答一个问题",
        text: "顺着垂直叙事展开：先说清工具替你省掉什么麻烦，再展示真实书写与导出效果，最后给出明确的价格与下载入口。访客不用在左右模块间反复猜先看哪块。",
      },
      {
        id: "quote",
        kind: "cta",
        rank: 3,
        tag: "行动入口",
        text: "立即下载免费体验版（支持离线单文件导出）",
        en: "START WRITING NOW",
      },
      {
        id: "footnote",
        kind: "footnote",
        rank: 4,
        tag: "条款细则",
        heading: "系统要求与许可附注",
        text: "注：支持常见桌面与移动浏览器本地运行；历史版本迁移说明、快捷键对照与开源许可清单详见文末文档。",
      },
    ],
  },
  form: {
    id: "form",
    label: "结账表单",
    short: "单列表单",
    url: "shop.example/checkout",
    eyebrow: "CHECKOUT · SINGLE FLOW",
    blocks: [
      {
        id: "hero",
        kind: "hero",
        rank: 0,
        tag: "步骤抬头",
        title: "确认收货信息并完成订单",
        meta: "共 1 步 · 预计 40 秒完成",
      },
      {
        id: "lead",
        kind: "lead",
        rank: 1,
        tag: "联系与地址",
        text: "姓名：林清秋  ｜  手机：138-0000-2550  ｜  收货地址：上海市静安区延安中路书局东楼四层（沿单轴逐项填写，视线不左右折返）。",
      },
      {
        id: "body1",
        kind: "body",
        rank: 2,
        tag: "配送与发票",
        heading: "选择配送时段与电子凭证",
        text: "标准工作日送达（免运费）。需要开具抬头时在同一条垂直列内顺手展开补充，避免双列并排时把右侧必填项当成旁注漏掉。",
      },
      {
        id: "quote",
        kind: "cta",
        rank: 3,
        tag: "提交结算",
        text: "确认订单并支付 ¥128.00",
        en: "COMPLETE ORDER",
      },
      {
        id: "footnote",
        kind: "footnote",
        rank: 4,
        tag: "退换细则",
        heading: "售后与隐私补充说明",
        text: "注：签收七日内支持无理由退换；收货信息仅用于本次物流派送，不会向无关第三方共享。",
      },
    ],
  },
};

// 初始状态：刻意停在四重复合坏态（92% 满屏爆宽 + 黏连字墙 + 层级拉平且附注倒挂 + 锯齿对齐）
export function createInitialState() {
  return {
    scenario: "article",
    viewport: "desktop",
    colRatio: 0.92,       // 0.22 - 0.96 占模拟视口宽比例
    rhythm: "cramped",    // cramped | balanced | airy | chasm
    hierarchy: "flat",    // flat | clear | bold
    align: "zigzag",      // left | center | zigzag
    distraction: false,   // 双侧干扰栏开关
    order: ["footnote", "hero", "body1", "lead", "quote"], // 附注倒挂第一、正文压过导语
    selectedId: "footnote",
    scrollY: 0,           // 0 - 1 视口滚动进度
    showGuides: true,
  };
}

export const PRESETS = {
  broken: {
    label: "复原开场坏态",
    kind: "error",
    patch: {
      viewport: "desktop",
      colRatio: 0.92,
      rhythm: "cramped",
      hierarchy: "flat",
      align: "zigzag",
      distraction: false,
      order: ["footnote", "hero", "body1", "lead", "quote"],
      selectedId: "footnote",
      scrollY: 0,
    },
  },
  classic: {
    label: "经典书页解",
    kind: "valid",
    patch: {
      viewport: "desktop",
      colRatio: 0.50,
      rhythm: "balanced",
      hierarchy: "clear",
      align: "left",
      distraction: false,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "hero",
      scrollY: 0,
    },
  },
  magazine: {
    label: "紧凑杂志解",
    kind: "valid",
    patch: {
      viewport: "desktop",
      colRatio: 0.42,
      rhythm: "airy",
      hierarchy: "bold",
      align: "left",
      distraction: false,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "body1",
      scrollY: 0,
    },
  },
  editorial: {
    label: "宽幅图文解",
    kind: "valid",
    patch: {
      viewport: "desktop",
      colRatio: 0.58,
      rhythm: "airy",
      hierarchy: "clear",
      align: "left",
      distraction: false,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "quote",
      scrollY: 0,
    },
  },
  mobile: {
    label: "手机窄屏解",
    kind: "valid",
    patch: {
      viewport: "mobile",
      colRatio: 0.88,
      rhythm: "balanced",
      hierarchy: "clear",
      align: "left",
      distraction: false,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "hero",
      scrollY: 0,
    },
  },
  err_wide: {
    label: "试错：通栏爆宽",
    kind: "error",
    patch: {
      viewport: "desktop",
      colRatio: 0.94,
      rhythm: "balanced",
      hierarchy: "clear",
      align: "left",
      distraction: false,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "body1",
      scrollY: 0,
    },
  },
  err_narrow: {
    label: "试错：面条窄栏",
    kind: "error",
    patch: {
      viewport: "desktop",
      colRatio: 0.22,
      rhythm: "balanced",
      hierarchy: "clear",
      align: "left",
      distraction: false,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "body1",
      scrollY: 0,
    },
  },
  err_floor: {
    label: "试错：假底线断层",
    kind: "error",
    patch: {
      viewport: "desktop",
      colRatio: 0.50,
      rhythm: "chasm",
      hierarchy: "clear",
      align: "left",
      distraction: false,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "lead",
      scrollY: 0,
    },
  },
  err_side: {
    label: "试错：双侧分心",
    kind: "error",
    patch: {
      viewport: "desktop",
      colRatio: 0.50,
      rhythm: "balanced",
      hierarchy: "clear",
      align: "left",
      distraction: true,
      order: ["hero", "lead", "body1", "quote", "footnote"],
      selectedId: "body1",
      scrollY: 0,
    },
  },
};

const RHYTHM_SPEC = {
  cramped: { label: "紧缩黏连", lineHeight: 1.28, blockGap: 14, padY: 24, divider: false, gapRatio: 0.42 },
  balanced: { label: "适中呼吸", lineHeight: 1.66, blockGap: 40, padY: 34, divider: true, gapRatio: 1.35 },
  airy: { label: "舒朗留白", lineHeight: 1.76, blockGap: 58, padY: 42, divider: true, gapRatio: 1.92 },
  chasm: { label: "过度断层", lineHeight: 1.75, blockGap: 320, padY: 48, divider: false, gapRatio: 10.6 },
};

const HIERARCHY_SPEC = {
  flat: { label: "扁平拉平", titlePx: 20, h2Px: 18, leadPx: 17, bodyPx: 17, footPx: 16.5, titleWeight: 500 },
  clear: { label: "自然递进", titlePx: 36, h2Px: 22, leadPx: 19, bodyPx: 17, footPx: 14, titleWeight: 900 },
  bold: { label: "强对比递进", titlePx: 44, h2Px: 24, leadPx: 20, bodyPx: 17, footPx: 13.5, titleWeight: 900 },
};

// 按真实字符宽度折行（Canvas 传入 measureText，降级时按中文全宽 / 西文半宽估算）
export function wrapText(text, maxWidth, fontPx, measureFn) {
  const lines = [];
  if (!text) return lines;
  const measure = measureFn
    ? (s) => measureFn(s, fontPx)
    : (s) => {
        let w = 0;
        for (const ch of s) w += ch.charCodeAt(0) > 255 ? fontPx * 1.0 : fontPx * 0.56;
        return w;
      };
  let cur = "";
  for (const ch of text) {
    const next = cur + ch;
    if (cur.length > 0 && measure(next) > maxWidth) {
      lines.push(cur);
      cur = ch === " " ? "" : ch;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// 统计一行的等效中文汉字数（中文算 1，西文/数字/空格算 0.52）
export function cjkEquivalent(line) {
  let n = 0;
  for (const ch of line) n += ch.charCodeAt(0) > 255 ? 1 : 0.52;
  return n;
}

// 单真源几何排版：所有读数与 Canvas 绘制完全读取此函数返回的结构
export function computeLayout(state, measureFn) {
  const vp = VIEWPORTS[state.viewport] || VIEWPORTS.desktop;
  const sc = SCENARIOS[state.scenario] || SCENARIOS.article;
  const rSpec = RHYTHM_SPEC[state.rhythm] || RHYTHM_SPEC.balanced;
  const hSpec = HIERARCHY_SPEC[state.hierarchy] || HIERARCHY_SPEC.clear;

  // 实际内容列宽（逻辑像素）
  const minRatio = state.viewport === "mobile" ? 0.56 : 0.21;
  const maxRatio = state.viewport === "mobile" ? 0.94 : 0.95;
  const clampedRatio = Math.max(minRatio, Math.min(maxRatio, state.colRatio));
  const rawColW = Math.round(vp.width * clampedRatio);

  // 开启双侧分心栏时，两侧挂件占用左右 180px（移动端不出现双侧栏但会有悬浮条抢焦）
  const sideW = state.distraction ? (state.viewport === "desktop" ? 196 : state.viewport === "tablet" ? 132 : 0) : 0;
  const colW = state.distraction && state.viewport !== "mobile"
    ? Math.min(rawColW, Math.max(220, vp.width - sideW * 2 - 48))
    : rawColW;
  const colX = Math.round((vp.width - colW) / 2);
  const innerPadX = state.viewport === "mobile" ? 14 : Math.max(16, Math.min(28, Math.round(colW * 0.04)));
  const textMaxW = Math.max(140, colW - innerPadX * 2);

  const blockMap = Object.fromEntries(sc.blocks.map((b) => [b.id, b]));
  const ordered = state.order.map((id) => blockMap[id]).filter(Boolean);

  let y = rSpec.padY + 12;
  const laidBlocks = [];
  const bodyCplSamples = [];
  const leftEdges = [];

  ordered.forEach((b, idx) => {
    // 确定每个模块的对齐方式（锯齿模式下交替居中、偏右、偏左）
    let align = "left";
    let indent = 0;
    if (state.align === "center") {
      align = "center";
    } else if (state.align === "zigzag") {
      if (idx % 3 === 0) {
        align = "center";
        indent = Math.round(textMaxW * 0.14);
      } else if (idx % 3 === 1) {
        align = "left";
        indent = 0;
      } else {
        align = "right";
        indent = Math.round(textMaxW * 0.18);
      }
    }

    const startY = y;
    const parts = [];
    const blockInnerW = b.kind === "quote" || b.kind === "cta" ? Math.max(120, textMaxW - 28) : textMaxW;

    if (b.kind === "hero") {
      const titleLines = wrapText(b.title, textMaxW, hSpec.titlePx, measureFn);
      const lh = hSpec.titlePx * 1.24;
      parts.push({ type: "eyebrow", text: sc.eyebrow, y, h: 16, fontPx: 12 });
      y += 22;
      parts.push({ type: "title", lines: titleLines, y, h: titleLines.length * lh, fontPx: hSpec.titlePx, lh, weight: hSpec.titleWeight });
      y += titleLines.length * lh + 10;
      parts.push({ type: "rule", y, h: 4 });
      y += 14;
      const metaLines = wrapText(b.meta, textMaxW, 13.5, measureFn);
      parts.push({ type: "meta", lines: metaLines, y, h: metaLines.length * 20, fontPx: 13.5, lh: 20 });
      y += metaLines.length * 20 + 6;
    } else if (b.kind === "lead") {
      const leadLines = wrapText(b.text, textMaxW, hSpec.leadPx, measureFn);
      const lh = hSpec.leadPx * rSpec.lineHeight;
      parts.push({ type: "lead", lines: leadLines, y, h: leadLines.length * lh, fontPx: hSpec.leadPx, lh });
      y += leadLines.length * lh + 4;
      leadLines.forEach((ln, i) => {
        if (leadLines.length === 1 || i < leadLines.length - 1) bodyCplSamples.push(cjkEquivalent(ln));
      });
    } else if (b.kind === "body") {
      const headLines = wrapText(b.heading, textMaxW, hSpec.h2Px, measureFn);
      const hlh = hSpec.h2Px * 1.3;
      parts.push({ type: "h2", lines: headLines, y, h: headLines.length * hlh, fontPx: hSpec.h2Px, lh: hlh });
      y += headLines.length * hlh + (state.rhythm === "cramped" ? 4 : 12);
      const bodyLines = wrapText(b.text, textMaxW, hSpec.bodyPx, measureFn);
      const blh = hSpec.bodyPx * rSpec.lineHeight;
      parts.push({ type: "body", lines: bodyLines, y, h: bodyLines.length * blh, fontPx: hSpec.bodyPx, lh: blh });
      y += bodyLines.length * blh + 4;
      bodyLines.forEach((ln, i) => {
        if (bodyLines.length === 1 || i < bodyLines.length - 1) bodyCplSamples.push(cjkEquivalent(ln));
      });
    } else if (b.kind === "quote") {
      const qLines = wrapText(b.text, blockInnerW, hSpec.leadPx - 1, measureFn);
      const qlh = (hSpec.leadPx - 1) * rSpec.lineHeight;
      parts.push({ type: "quote", lines: qLines, en: b.en, y, h: qLines.length * qlh + 36, fontPx: hSpec.leadPx - 1, lh: qlh });
      y += qLines.length * qlh + 40;
    } else if (b.kind === "cta") {
      const cLines = wrapText(b.text, blockInnerW, hSpec.leadPx - 1, measureFn);
      const clh = (hSpec.leadPx - 1) * 1.4;
      parts.push({ type: "cta", lines: cLines, en: b.en, y, h: cLines.length * clh + 44, fontPx: hSpec.leadPx - 1, lh: clh });
      y += cLines.length * clh + 48;
    } else if (b.kind === "footnote") {
      const fHeadLines = wrapText(b.heading, textMaxW, Math.max(14, hSpec.footPx + 1), measureFn);
      const flh = Math.max(14, hSpec.footPx + 1) * 1.35;
      parts.push({ type: "foothead", lines: fHeadLines, y, h: fHeadLines.length * flh, fontPx: Math.max(14, hSpec.footPx + 1), lh: flh });
      y += fHeadLines.length * flh + (state.rhythm === "cramped" ? 3 : 8);
      const footLines = wrapText(b.text, textMaxW, hSpec.footPx, measureFn);
      const bflh = hSpec.footPx * rSpec.lineHeight;
      parts.push({ type: "footnote", lines: footLines, y, h: footLines.length * bflh, fontPx: hSpec.footPx, lh: bflh });
      y += footLines.length * bflh + 4;
    }

    // 真实视觉左起点（用于左边界散差核算）
    let visualLeft = colX + innerPadX;
    if (align === "center") {
      const firstLine = parts.find((p) => p.lines && p.lines.length)?.lines[0] || "";
      const fpx = parts.find((p) => p.lines && p.lines.length)?.fontPx || hSpec.bodyPx;
      const estW = measureFn ? measureFn(firstLine, fpx) : cjkEquivalent(firstLine) * fpx;
      visualLeft = colX + innerPadX + Math.max(0, (textMaxW - Math.min(textMaxW, estW)) / 2);
    } else if (align === "right") {
      visualLeft = colX + innerPadX + indent;
    }
    leftEdges.push(visualLeft);

    laidBlocks.push({
      ...b,
      index: idx,
      x: colX,
      w: colW,
      innerX: colX + innerPadX,
      innerW: textMaxW,
      y: startY,
      h: Math.max(36, y - startY),
      align,
      visualLeft,
      parts,
    });

    if (idx < ordered.length - 1) {
      y += rSpec.blockGap;
    }
  });

  const totalHeight = Math.round(y + rSpec.padY + 24);
  const avgCpl = bodyCplSamples.length
    ? +(bodyCplSamples.reduce((a, b) => a + b, 0) / bodyCplSamples.length).toFixed(1)
    : +(textMaxW / hSpec.bodyPx).toFixed(1);

  const minLeft = Math.min(...leftEdges);
  const maxLeft = Math.max(...leftEdges);
  const leftJitterPx = Math.round(maxLeft - minLeft);

  // 计算顺序逆序数（与理想逻辑序 rank 0..4 的逆序对）
  const inversions = [];
  for (let i = 0; i < laidBlocks.length; i++) {
    for (let j = i + 1; j < laidBlocks.length; j++) {
      if (laidBlocks[i].rank > laidBlocks[j].rank) {
        inversions.push([laidBlocks[i], laidBlocks[j]]);
      }
    }
  }

  const typeRatio = +(hSpec.titlePx / hSpec.bodyPx).toFixed(2);
  const marginPct = Math.round((1 - colW / vp.width) * 100);
  const maxGapViewportRatio = +(rSpec.blockGap / vp.height).toFixed(2);

  return {
    vp,
    sc,
    rSpec,
    hSpec,
    colRatio: clampedRatio,
    colX,
    colW,
    innerPadX,
    textMaxW,
    sideW,
    blocks: laidBlocks,
    totalHeight,
    avgCpl,
    leftJitterPx,
    inversions,
    typeRatio,
    marginPct,
    maxGapViewportRatio,
  };
}

// 从实绘布局单真源核算 8 类双向错态与四项设计要点通过态
export function diagnoseLayout(state, layout) {
  const issues = [];
  const { avgCpl, colW, vp, leftJitterPx, inversions, typeRatio, maxGapViewportRatio, rSpec } = layout;

  // 1 & 2. 行宽双向检查（W3C WCAG 2.1 SC 1.4.8 CJK ≤ 40 字，经验下限 ≥ 16 字）
  if (avgCpl > 40) {
    issues.push({
      code: "too_wide",
      pillar: "width",
      severity: 100,
      short: `爆宽 ${Math.round(avgCpl)}字/行`,
      title: `一行挤进约 ${Math.round(avgCpl)} 个汉字，回扫极易跳行`,
      why: `当前单列宽 ${colW}px（占 ${vp.width}px 视口的 ${Math.round((colW / vp.width) * 100)}%），已经超过 WCAG 1.4.8 给中日韩文划出的 40 字上限。眼睛从最右端折返左侧找下一行开头时跨越太长，很容易串行或漏读。`,
      hint: "在画布上向左拖收窄列宽至 520–720px（约 26–38 字/行），或在下方点「收窄至舒适列宽」。",
      fixLabel: "收窄至舒适列宽",
      fixAction: "fix_width",
    });
  } else if (avgCpl < 16) {
    issues.push({
      code: "too_narrow",
      pillar: "width",
      severity: 95,
      short: `过窄 ${Math.round(avgCpl)}字/行`,
      title: `列宽压成约 ${Math.round(avgCpl)} 字的面条栏，句子被频频斩断`,
      why: `现在正文区仅宽 ${colW}px，每读三四个词就得折行一次。眼球在短距离内高频往复跳动，页面也会被拉得过长，原本流畅的纵向节奏碎成一截截。`,
      hint: "在画布上向右拉宽单列，让每行落在 20–38 个汉字区间。",
      fixLabel: "放宽至舒适列宽",
      fixAction: "fix_width",
    });
  }

  // 3. 对齐边界检查
  if (state.align === "zigzag" || (state.align === "center" && state.viewport !== "mobile")) {
    issues.push({
      code: "unstable_edge",
      pillar: "align",
      severity: 90,
      short: state.align === "center" ? "全文居中漂移" : `左缘锯齿 ${leftJitterPx}px`,
      title:
        state.align === "center"
          ? "长文全文居中，每一行左起点都在左右晃动"
          : `各模块左边界错开了 ${leftJitterPx}px，回扫没有固定锚点`,
      why:
        state.align === "center"
          ? "居中对齐只适合短标题或封皮。整段长文居中后，每行字数略有不同，左侧起点就会参差不齐，眼球换行时每次都要重新摸索落脚点。"
          : "单列页面靠一条笔直的左侧基准线托住阅读速度。现在标题、正文与引文各自左偏右移，视线顺流往下时不断被拉歪。",
      hint: "在「保持对齐」一栏切回「齐左单轴」，给所有模块建立统一的左边界。",
      fixLabel: "统一为齐左单轴",
      fixAction: "fix_align",
    });
  }

  // 4 & 5. 节奏留白双向检查
  if (state.rhythm === "cramped") {
    issues.push({
      code: "cramped",
      pillar: "rhythm",
      severity: 85,
      short: "字墙黏连",
      title: `段距仅 ${rSpec.blockGap}px，内容糊成一堵密不透风的字墙`,
      why: `行距压缩到 ${rSpec.lineHeight}×、模块之间几乎贴在一起，没有给眼球留出切换话题的呼吸停顿。读者扫一眼就会觉得沉重，还没开读就想关闭页面。`,
      hint: "在「分段清晰」里把节奏切到「适中呼吸」或「舒朗留白」，拉开段间停顿与细分隔线。",
      fixLabel: "拉开呼吸留白",
      fixAction: "fix_rhythm",
    });
  } else if (state.rhythm === "chasm" || maxGapViewportRatio > 0.34) {
    issues.push({
      code: "false_floor",
      pillar: "rhythm",
      severity: 86,
      short: "假底线断层",
      title: `段间空白高达 ${rSpec.blockGap}px，造成「假底线」误判`,
      why: `单处留白已经占掉视口高度的 ${Math.round(maxGapViewportRatio * 100)}%。读者滚到这片大片空白时，视线找不到下方衔接内容，常会误以为网页已经结束而直接离开。`,
      hint: "把留白收回到「适中呼吸」或「舒朗留白」，让下一段始终在视口内露出衔接信号。",
      fixLabel: "收回过度留白",
      fixAction: "fix_rhythm",
    });
  }

  // 6. 层级反差检查
  if (typeRatio < 1.38) {
    issues.push({
      code: "flat_hierarchy",
      pillar: "rhythm",
      severity: 80,
      short: `字比平 ${typeRatio}×`,
      title: `标题与正文尺度比仅 ${typeRatio}×，看不出主次入口`,
      why: `现在大标题 ${layout.hSpec.titlePx}px、正文 ${layout.hSpec.bodyPx}px、附注 ${layout.hSpec.footPx}px，整页像同一份纯文本清单。视线落进页面后找不到第一落脚点，层级递进失效。`,
      hint: "把层级反差调到「自然递进」或「强对比递进」，让大标、小标与正文拉开清楚梯级。",
      fixLabel: "拉开标题层级",
      fixAction: "fix_hierarchy",
    });
  }

  // 7. 主次纵序检查
  if (inversions.length > 0) {
    const [firstWrong, behind] = inversions[0];
    issues.push({
      code: "inverted_order",
      pillar: "flow",
      severity: 88,
      short: `主次倒序 (${inversions.length}处)`,
      title: `「${firstWrong.tag}」压在了「${behind.tag}」前面，逻辑逆流`,
      why: `单列页面把读者的视线锁在一条垂直轨道上，几乎强迫人按先后顺序读完。把次要附注或滞后细节挡在主标题和核心导语之前，读者还没看懂重点就会失去耐心。`,
      hint: "在画布上点选错位模块，用下方 ↑ / ↓ 调回「先重要、后细节」的顺流顺序。",
      fixLabel: "顺排主次模块",
      fixAction: "fix_order",
    });
  }

  // 8. 双侧分心干扰检查
  if (state.distraction) {
    issues.push({
      code: "side_distraction",
      pillar: "flow",
      severity: 92,
      short: "双侧分心栏",
      title: "左右两侧塞进了抢焦浮栏，单轴专注被硬生生拆散",
      why: "单列布局最大的红利是「只留一条阅读轨、零分岔决策」。一旦在两侧放满悬浮推荐和广告卡片，眼球就会被迫横向跳走，主轴的沉浸感立刻瓦解。",
      hint: "关掉「双侧干扰栏」，把左右边距还给安静的呼吸留白。",
      fixLabel: "撤掉双侧干扰",
      fixAction: "fix_distraction",
    });
  }

  issues.sort((a, b) => b.severity - a.severity);

  const alignOk = !issues.some((i) => i.pillar === "align");
  const widthOk = !issues.some((i) => i.pillar === "width");
  const rhythmOk = !issues.some((i) => i.pillar === "rhythm");
  const flowOk = !issues.some((i) => i.pillar === "flow");
  const passedCount = [alignOk, widthOk, rhythmOk, flowOk].filter(Boolean).length;
  const passed = issues.length === 0;

  // 合法解风格识别（多解均可过关）
  let validName = "标准单列解";
  let validDesc = `单列宽 ${colW}px（约 ${Math.round(avgCpl)} 汉字/行），左边界稳定、留白与层级得体，视线沿着一条清晰纵轴自然流下。`;
  if (state.viewport === "mobile") {
    validName = "移动端天然单列解";
    validDesc = `在 390px 窄屏下，内容以 ${colW}px（约 ${Math.round(avgCpl)} 字/行）顺势收进单轴，无需横向缩放即可单指顺滑扫读。`;
  } else if (avgCpl <= 26) {
    validName = "紧凑杂志单列解";
    validDesc = `约 ${Math.round(avgCpl)} 字/行的修长版心搭配充裕左右留白（${layout.marginPct}%），节奏轻快精致，很有纸刊专栏的沉静感。`;
  } else if (avgCpl >= 33) {
    validName = "宽幅图文单列解";
    validDesc = `约 ${Math.round(avgCpl)} 字/行贴近 40 字安全线上缘，但仍守在舒适区内，配合清楚的段距与标题梯级，兼顾阅读效率与图文施展空间。`;
  } else {
    validName = "经典书页单列解";
  }

  // 三条原海报要点实况（① 纵向阅读 / ② 节奏留白 / ③ 层级递进）
  const p1Ok = widthOk && alignOk && !state.distraction;
  const p2Ok = !issues.some((i) => i.code === "cramped" || i.code === "false_floor");
  const p3Ok = !issues.some((i) => i.code === "flat_hierarchy" || i.code === "inverted_order");

  const pointsStatus = [
    {
      no: 1,
      ok: p1Ok,
      badge: p1Ok
        ? `顺流 · ${Math.round(avgCpl)}字/行`
        : issues.find((i) => i.code === "too_wide" || i.code === "too_narrow" || i.code === "unstable_edge" || i.code === "side_distraction")?.short || "待调",
    },
    {
      no: 2,
      ok: p2Ok,
      badge: p2Ok ? `${rSpec.label} · 缝 ${rSpec.blockGap}px` : state.rhythm === "cramped" ? "字墙黏连" : "假底线断层",
    },
    {
      no: 3,
      ok: p3Ok,
      badge: p3Ok ? `${typeRatio}× · 顺序` : inversions.length ? `倒序 ${inversions.length}处` : `字比平 ${typeRatio}×`,
    },
  ];

  // 实时生成的真实 CSS 片段（与当前状态 1:1 单真源对应）
  const chApprox = Math.round(avgCpl * 2);
  const cssLines = [
    `.single-column {`,
    `  max-width: ${colW}px; /* 约 ${Math.round(avgCpl)} 汉字 / ${chApprox}ch */`,
    `  margin-inline: auto;`,
    `  text-align: ${state.align === "center" ? "center" : "left"};`,
    `  line-height: ${rSpec.lineHeight};`,
    `}`,
    `.single-column > * + * { margin-top: ${rSpec.blockGap}px; }`,
    `.single-column h1 { font-size: ${layout.hSpec.titlePx}px; /* 正文 ${layout.hSpec.bodyPx}px × ${typeRatio} */ }`,
  ].join("\n");

  const primary = passed
    ? {
        ok: true,
        badge: `4/4 · ${validName}`,
        title: `单列秩序成立：${validName}`,
        why: validDesc,
        hint: "你可以继续换「产品发布页 / 结账表单」题材，或点下方「试错」按钮反向体验行宽、留白与分心栏如何破坏单列。",
        fixLabel: "",
        fixAction: "",
      }
    : {
        ok: false,
        badge: `${passedCount}/4 · ${issues[0].short}`,
        title: issues[0].title,
        why: issues[0].why,
        hint: issues[0].hint,
        fixLabel: issues[0].fixLabel,
        fixAction: issues[0].fixAction,
      };

  // 原海报底栏「单列的力量」实况动态结语
  const bannerNote = passed
    ? `当前实测 ${colW}px（约 ${Math.round(avgCpl)} 字/行）、留白 ${layout.marginPct}%：在有限的宽度里，已经建立起稳定的垂直专注。`
    : `尚有 ${issues.length} 处破坏垂直专注（首因：${issues[0].short}）——单列不是把内容硬塞成一条，而是管好宽度、对齐、停顿与先后。`;

  return {
    passed,
    passedCount,
    issues,
    primary,
    pillars: {
      align: { ok: alignOk, text: alignOk ? "左轴稳定" : state.align === "center" ? "居中晃动" : `错位 ${leftJitterPx}px` },
      width: { ok: widthOk, text: widthOk ? `${Math.round(avgCpl)} 字/行` : avgCpl > 40 ? `超宽 ${Math.round(avgCpl)}字` : `过窄 ${Math.round(avgCpl)}字` },
      rhythm: { ok: rhythmOk, text: rhythmOk ? `${rSpec.label} · ${typeRatio}×` : !p2Ok ? (state.rhythm === "cramped" ? "字墙黏连" : "假底线") : `层级平 ${typeRatio}×` },
      flow: { ok: flowOk, text: flowOk ? "顺流专注" : state.distraction ? "双侧分心" : `倒序 ${inversions.length}处` },
    },
    pointsStatus,
    cssLines,
    bannerNote,
  };
}
