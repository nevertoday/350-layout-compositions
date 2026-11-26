// 335 标题幻灯片版式 — 单真源几何与审片引擎
// 逻辑幻灯片尺寸严格对齐标准 16:9 宽屏幻灯片：960 × 540 pt（13.333 × 7.5 in @ 72 pt/in）。
// 所有绘制坐标、图文碰撞率、版面留白率、后排 15m 视角与四枚原海报引出针诊断均从同一组实绘矩形与圆计算。

export const SLIDE_W = 960;
export const SLIDE_H = 540;

export const SAFE_RECT = {
  x: 48, // 左右各 5% 投影安全边距
  y: 32, // 顶部 6% 安全边距
  w: SLIDE_W - 96,
  h: SLIDE_H - 70, // 底部留 7% 防投影裁切与讲台遮挡
};

export const DECKS = {
  launch: {
    id: "launch",
    tab: "产品发布",
    tag: "KEYNOTE LAUNCH",
    conciseTitle: ["下一代零延迟", "渲染管线"],
    bloatedTitle: [
      "关于本公司 2027 财年第三季度桌面与移动端",
      "跨平台图形渲染引擎核心架构全面升级改造方案汇报",
    ],
    oneLineSub: "一句话把复杂场景帧率推高三倍",
    oneLineSubEn: "ONE LINE. THREE TIMES FASTER.",
    bulletsSub: [
      "• 历史遗留渲染管线与多端兼容痛点背景综述",
      "• 本次重构涉及的 14 项底层接口变更清单说明",
      "• 研发排期、灰度发布与 QA 压测协同分工表",
      "• 第四季度演进路线图与跨团队风险应急预案",
    ],
    org: "光栅实验室",
    orgEn: "RASTER LABS · 2027",
    heroMetric: "3.0×",
    heroCaption: "FRAME RATE",
    slide2Title: "为什么旧管线在复杂场景掉帧",
    slide2Lead: "主线程频繁切换材质状态，把 GPU 算力卡在等待队列里。",
    slide2Cards: [
      { label: "合批前绘制调用", val: "1,420 次/帧", note: "主线程耗时 14.8 ms" },
      { label: "零延迟管线合批", val: "450 次/帧", note: "耗时压低至 4.6 ms" },
    ],
  },
  defense: {
    id: "defense",
    tab: "学术答辩",
    tag: "THESIS DEFENSE",
    conciseTitle: ["高密度街区", "微气候降温"],
    bloatedTitle: [
      "基于多源遥感监测与微尺度风热耦合模拟的",
      "高密度建成区屋顶绿化对近地面热岛缓解机制实证研究",
    ],
    oneLineSub: "实测屋顶绿化与通风廊道的协同降温效应",
    oneLineSubEn: "ONE LINE. COOLER URBAN CORRIDORS.",
    bulletsSub: [
      "• 城市热岛效应研究背景与国内外文献综述对比",
      "• 2023–2025 年 18 个气象观测站点布设参数汇总",
      "• ENVI-met 网格边界条件设置与误差校准方程",
      "• 规划政策建议、样本局限性与后续研究展望",
    ],
    org: "城市环境研究组",
    orgEn: "URBAN CLIMATE LAB · 2027",
    heroMetric: "-2.4°C",
    heroCaption: "PEAK COOLING",
    slide2Title: "通风廊道让屋顶绿化效率翻倍",
    slide2Lead: "孤立植被只能改善局部辐射，串联风道才能带走街谷蓄热。",
    slide2Cards: [
      { label: "独立屋顶绿化", val: "-0.9 °C", note: "午后 14:00 近地均值" },
      { label: "绿化叠加风道", val: "-2.4 °C", note: "18 组实测站点均值" },
    ],
  },
  pitch: {
    id: "pitch",
    tab: "年度提案",
    tag: "ANNUAL PROPOSAL",
    conciseTitle: ["2027 零碳", "供应链路线"],
    bloatedTitle: [
      "面向欧洲与亚太市场合规新规的集团制造基地及",
      "三级上游供应商全生命周期碳足迹核查与减排实施计划",
    ],
    oneLineSub: "三年内将单件交付碳排放压低一半",
    oneLineSubEn: "ONE LINE. HALF THE FOOTPRINT.",
    bulletsSub: [
      "• 欧盟碳边境调节机制合规节点与申报要求拆解",
      "• 128 家核心零部件上游厂商年度能耗摸底表",
      "• 绿电直采、循环包材与海运替代年度预算明细",
      "• 董事会阶段审批里程碑与各工厂 KPI 考核权重",
    ],
    org: "星衡制造",
    orgEn: "STARSCALE OPS · 2027",
    heroMetric: "-50%",
    heroCaption: "CARBON / UNIT",
    slide2Title: "八成碳排集中在原料与干线物流",
    slide2Lead: "先把铝材再生比例和区域直发改顺，就能拿掉最大两块排放。",
    slide2Cards: [
      { label: "再生原料替代", val: "75% 再生铝", note: "单件制造碳排降 34%" },
      { label: "区域仓直发网", val: "-620 km", note: "干线货运碳排降 18%" },
    ],
  },
};

export const INITIAL_STATE = {
  deck: "launch",
  axis: "left", // "left" 左文右图 | "right" 左图右文 | "center" 居中宣言
  titleSize: 26, // 20..82 pt（开场故意偏小）
  titleLines: "bloated", // "concise" | "bloated"（开场故意冗长）
  subtitleMode: "bullets", // "one-line" | "bullets" | "missing"（开场故意塞四条提纲）
  heroX: 0.41, // 0.14..0.86（开场故意压撞文字区）
  heroY: 0.48, // 0.22..0.78
  heroRadius: 0.34, // 0.10..0.44 占幻灯片高度比例
  heroStyle: "orb", // "orb" 原海报酸柠大圆 | "metric" 核心数据环 | "geo" 空间几何标
  identityAnchor: "top-center", // "bottom-left" | "top-center" | "bottom-edge"（开场故意顶中抢C位）
  identityScale: 1.75, // 0.65..2.0（开场故意放大抢戏）
  viewMode: "studio", // "studio" | "backrow"
  slideIndex: 0, // 0 = 封面 01, 1 = 承接页 02
  showGuides: true,
  activePart: "title", // "title" | "subtitle" | "hero" | "identity"
};

export const PRESETS = {
  poster: {
    label: "原海报左文右圆解",
    kind: "good",
    patch: {
      axis: "left",
      titleSize: 64,
      titleLines: "concise",
      subtitleMode: "one-line",
      heroX: 0.74,
      heroY: 0.52,
      heroRadius: 0.31,
      heroStyle: "orb",
      identityAnchor: "bottom-left",
      identityScale: 1.0,
      slideIndex: 0,
    },
  },
  mirror: {
    label: "左图右文对衡解",
    kind: "good",
    patch: {
      axis: "right",
      titleSize: 60,
      titleLines: "concise",
      subtitleMode: "one-line",
      heroX: 0.25,
      heroY: 0.5,
      heroRadius: 0.29,
      heroStyle: "metric",
      identityAnchor: "bottom-left",
      identityScale: 0.95,
      slideIndex: 0,
    },
  },
  centered: {
    label: "极简居中宣言解",
    kind: "good",
    patch: {
      axis: "center",
      titleSize: 66,
      titleLines: "concise",
      subtitleMode: "one-line",
      heroX: 0.5,
      heroY: 0.23,
      heroRadius: 0.17,
      heroStyle: "geo",
      identityAnchor: "bottom-left",
      identityScale: 0.9,
      slideIndex: 0,
    },
  },
  badWall: {
    label: "试错：提纲文字墙",
    kind: "bad",
    patch: {
      axis: "left",
      titleSize: 28,
      titleLines: "bloated",
      subtitleMode: "bullets",
      heroX: 0.76,
      heroY: 0.52,
      heroRadius: 0.26,
      identityAnchor: "bottom-left",
      identityScale: 1.0,
      slideIndex: 0,
    },
  },
  badLogo: {
    label: "试错：徽标抢C位",
    kind: "bad",
    patch: {
      axis: "left",
      titleSize: 54,
      titleLines: "concise",
      subtitleMode: "one-line",
      heroX: 0.74,
      heroY: 0.54,
      heroRadius: 0.28,
      identityAnchor: "top-center",
      identityScale: 1.9,
      slideIndex: 0,
    },
  },
  badEdge: {
    label: "试错：贴边越界",
    kind: "bad",
    patch: {
      axis: "left",
      titleSize: 58,
      titleLines: "concise",
      subtitleMode: "one-line",
      heroX: 0.86,
      heroY: 0.52,
      heroRadius: 0.36,
      identityAnchor: "bottom-edge",
      identityScale: 1.05,
      slideIndex: 0,
    },
  },
  reset: {
    label: "复原开场错态",
    kind: "reset",
    patch: {
      axis: INITIAL_STATE.axis,
      titleSize: INITIAL_STATE.titleSize,
      titleLines: INITIAL_STATE.titleLines,
      subtitleMode: INITIAL_STATE.subtitleMode,
      heroX: INITIAL_STATE.heroX,
      heroY: INITIAL_STATE.heroY,
      heroRadius: INITIAL_STATE.heroRadius,
      heroStyle: INITIAL_STATE.heroStyle,
      identityAnchor: INITIAL_STATE.identityAnchor,
      identityScale: INITIAL_STATE.identityScale,
      viewMode: "studio",
      slideIndex: 0,
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 按汉字 / 西文混合宽度估算字符宽（与 Canvas 实绘字体一致，避免依赖异步测量）
function measureTextWidth(str, fontSize) {
  let units = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code > 0x2e80) units += 1.02;
    else if (ch === " ") units += 0.34;
    else if (/[A-Z]/.test(ch)) units += 0.7;
    else units += 0.56;
  }
  return units * fontSize;
}

// 将过长标题按可用宽度真实折行，用于实绘与碰撞核算同一真源
function wrapTitleLines(rawLines, fontSize, maxWidth) {
  const out = [];
  for (const raw of rawLines) {
    let cur = "";
    for (const ch of raw) {
      const next = cur + ch;
      if (cur && measureTextWidth(next, fontSize) > maxWidth) {
        out.push(cur);
        cur = ch;
      } else {
        cur = next;
      }
    }
    if (cur) out.push(cur);
  }
  return out.slice(0, 4);
}

// 精确采样矩形与圆的重叠比例（0..1）
function rectCircleOverlap(rect, cx, cy, r) {
  if (!rect || rect.w <= 0 || rect.h <= 0 || r <= 0) return 0;
  // 先做快速包围盒排除
  if (
    cx + r <= rect.x ||
    cx - r >= rect.x + rect.w ||
    cy + r <= rect.y ||
    cy - r >= rect.y + rect.h
  ) {
    return 0;
  }
  const nx = 14;
  const ny = 10;
  let hits = 0;
  const r2 = r * r;
  for (let iy = 0; iy < ny; iy++) {
    const py = rect.y + ((iy + 0.5) / ny) * rect.h;
    const dy = py - cy;
    for (let ix = 0; ix < nx; ix++) {
      const px = rect.x + ((ix + 0.5) / nx) * rect.w;
      const dx = px - cx;
      if (dx * dx + dy * dy <= r2) hits++;
    }
  }
  return hits / (nx * ny);
}

// 两个矩形的重叠比例（相对于较小矩形面积）
function rectRectOverlap(a, b) {
  if (!a || !b || a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) return 0;
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ox * oy;
  if (inter <= 0) return 0;
  return inter / Math.min(a.w * a.h, b.w * b.h);
}

// 从状态算出四要素实绘几何框（单真源）
export function computeGeometry(state) {
  const deck = DECKS[state.deck] || DECKS.launch;
  const titleSize = clamp(state.titleSize, 20, 82);
  const rawTitle = state.titleLines === "concise" ? deck.conciseTitle : deck.bloatedTitle;

  const isCenter = state.axis === "center";
  const isRight = state.axis === "right";
  const textColX = isRight ? 468 : isCenter ? 130 : 72;
  const textMaxW = isCenter ? 700 : state.titleLines === "concise" ? 450 : 540;
  const titleLines = wrapTitleLines(rawTitle, titleSize, textMaxW);
  const titleLH = Math.round(titleSize * 1.16);
  const titleActualW = Math.min(
    textMaxW,
    Math.max(...titleLines.map((l) => measureTextWidth(l, titleSize)))
  );
  const titleH = titleLines.length * titleLH;
  const titleY = isCenter
    ? state.identityAnchor === "top-center"
      ? 238
      : 214
    : state.identityAnchor === "top-center"
      ? 122
      : 78;
  const titleX = isCenter ? (SLIDE_W - titleActualW) / 2 : textColX;

  const titleRect = {
    x: Math.round(titleX),
    y: Math.round(titleY),
    w: Math.round(titleActualW),
    h: Math.round(titleH),
    fontSize: titleSize,
    lineHeight: titleLH,
    lines: titleLines,
    align: isCenter ? "center" : "left",
  };

  // 副标题矩形
  const subY = titleRect.y + titleRect.h + 22;
  let subtitleRect;
  if (state.subtitleMode === "one-line") {
    const subSize = 21;
    const textW = measureTextWidth(deck.oneLineSub, subSize);
    const padX = 18;
    const barW = Math.min(isCenter ? 620 : 460, Math.round(textW + padX * 2));
    const barH = 44;
    subtitleRect = {
      x: Math.round(isCenter ? (SLIDE_W - barW) / 2 : textColX),
      y: Math.round(subY),
      w: barW,
      h: barH,
      fontSize: subSize,
      lines: [deck.oneLineSub],
      mode: "one-line",
      align: isCenter ? "center" : "left",
    };
  } else if (state.subtitleMode === "bullets") {
    const subSize = 18;
    const lh = 29;
    const maxLineW = Math.max(...deck.bulletsSub.map((l) => measureTextWidth(l, subSize)));
    const boxW = Math.min(isCenter ? 660 : 480, Math.round(maxLineW + 16));
    const boxH = deck.bulletsSub.length * lh + 10;
    subtitleRect = {
      x: Math.round(isCenter ? (SLIDE_W - boxW) / 2 : textColX),
      y: Math.round(subY),
      w: boxW,
      h: boxH,
      fontSize: subSize,
      lineHeight: lh,
      lines: deck.bulletsSub,
      mode: "bullets",
      align: "left",
    };
  } else {
    subtitleRect = {
      x: Math.round(isCenter ? SLIDE_W / 2 : textColX),
      y: Math.round(subY),
      w: 0,
      h: 0,
      fontSize: 0,
      lines: [],
      mode: "missing",
      align: isCenter ? "center" : "left",
    };
  }

  // 视觉焦点圆（Hero Area）
  const r = Math.round(clamp(state.heroRadius, 0.1, 0.44) * SLIDE_H);
  const cx = Math.round(clamp(state.heroX, 0.12, 0.88) * SLIDE_W);
  const cy = Math.round(clamp(state.heroY, 0.18, 0.82) * SLIDE_H);
  const hero = {
    cx,
    cy,
    r,
    bbox: { x: cx - r, y: cy - r, w: r * 2, h: r * 2 },
  };

  // 品牌信息锁组（Identity）
  const idScale = clamp(state.identityScale, 0.65, 2.0);
  const idW = Math.round(250 * idScale);
  const idH = Math.round(46 * idScale);
  let idX;
  let idY;
  if (state.identityAnchor === "top-center") {
    idX = Math.round((SLIDE_W - idW) / 2);
    idY = 28;
  } else if (state.identityAnchor === "bottom-edge") {
    idX = isRight ? 468 : 72;
    idY = SLIDE_H - Math.round(idH * 0.82); // 刻意压底越过 7% 安全边距
  } else {
    idX = isCenter ? Math.round((SLIDE_W - idW) / 2) : isRight ? 468 : 72;
    idY = SAFE_RECT.y + SAFE_RECT.h - idH - 8;
  }
  const identityRect = {
    x: idX,
    y: idY,
    w: idW,
    h: idH,
    scale: idScale,
    anchor: state.identityAnchor,
  };

  return { deck, safeRect: SAFE_RECT, titleRect, subtitleRect, hero, identityRect };
}

// 48×27 真实占用网格核算版面留白率（联合面积，不重复计重叠）
function measureWhitespacePct(geom) {
  const cols = 48;
  const rows = 27;
  const rects = [geom.titleRect, geom.subtitleRect, geom.identityRect].filter(
    (r) => r && r.w > 0 && r.h > 0
  );
  const { cx, cy, r } = geom.hero;
  const r2 = r * r;
  let occupied = 0;
  for (let ry = 0; ry < rows; ry++) {
    const py = ((ry + 0.5) / rows) * SLIDE_H;
    const dy = py - cy;
    for (let rx = 0; rx < cols; rx++) {
      const px = ((rx + 0.5) / cols) * SLIDE_W;
      const dx = px - cx;
      let hit = dx * dx + dy * dy <= r2;
      if (!hit) {
        for (const box of rects) {
          if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
            hit = true;
            break;
          }
        }
      }
      if (hit) occupied++;
    }
  }
  return Math.round((1 - occupied / (cols * rows)) * 100);
}

// 审片总核算：四支柱状态 + 7 类双向真错态 + 优先白话诊单 + 一步纠偏补丁
export function auditSlide(state) {
  const geom = computeGeometry(state);
  const { deck, safeRect, titleRect, subtitleRect, hero, identityRect } = geom;

  // 1. 实测碰撞与越界
  const heroTitleOverlap = Math.round(rectCircleOverlap(titleRect, hero.cx, hero.cy, hero.r) * 100);
  const heroSubOverlap = Math.round(rectCircleOverlap(subtitleRect, hero.cx, hero.cy, hero.r) * 100);
  const heroIdOverlap = Math.round(rectCircleOverlap(identityRect, hero.cx, hero.cy, hero.r) * 100);
  const idTitleOverlap = Math.round(rectRectOverlap(identityRect, titleRect) * 100);
  const maxHeroOverlap = Math.max(heroTitleOverlap, heroSubOverlap, heroIdOverlap);

  const safeRight = safeRect.x + safeRect.w;
  const safeBottom = safeRect.y + safeRect.h;

  const titleClipped =
    titleRect.x < safeRect.x - 4 ||
    titleRect.x + titleRect.w > safeRight + 4 ||
    titleRect.y + titleRect.h > safeBottom;
  const subClipped =
    subtitleRect.w > 0 &&
    (subtitleRect.x + subtitleRect.w > safeRight + 4 ||
      subtitleRect.y + subtitleRect.h > safeBottom);
  const heroOutOfFrame =
    hero.cx - hero.r < 12 ||
    hero.cx + hero.r > SLIDE_W - 12 ||
    hero.cy - hero.r < 12 ||
    hero.cy + hero.r > SLIDE_H - 12;
  const identityBreach =
    identityRect.y + identityRect.h > safeBottom + 4 ||
    identityRect.y < safeRect.y - 6 ||
    identityRect.x < safeRect.x - 6;

  // 2. 层级与光学读数
  const effectiveSubPt = subtitleRect.fontSize || 21;
  const scaleRatio = +(titleRect.fontSize / effectiveSubPt).toFixed(2);
  const whitespacePct = measureWhitespacePct(geom);

  // 标准 3.2m×1.8m 礼堂幕布，15m 后排的汉字真实视角（角分）
  const charHeightMm = (titleRect.fontSize / SLIDE_H) * 1800 * 0.86;
  const backRowArcmin = +(((charHeightMm / 15000) * (180 / Math.PI) * 60)).toFixed(1);

  // 估算 3 秒扫视耗时（示意，按真实字数换算：中文快扫约 7 字/秒 + 干扰惩罚）
  const titleChars = titleRect.lines.join("").length;
  const subChars = subtitleRect.lines.join("").length;
  const estGlanceSec = +(
    (titleChars * 0.09 + subChars * 0.11 + (maxHeroOverlap >= 6 ? 0.9 : 0) + (state.identityAnchor === "top-center" ? 0.6 : 0))
  ).toFixed(1);

  // 品牌面积相对主标题面积占比
  const titleArea = Math.max(1, titleRect.w * titleRect.h);
  const idArea = identityRect.w * identityRect.h;
  const idDominancePct = Math.round((idArea / titleArea) * 100);

  // 3. 七类双向真错态检测
  const faults = [];

  if (state.titleLines === "bloated") {
    faults.push({
      id: "title-verbose",
      part: "title",
      severity: 100,
      short: `${titleChars}字过长`,
      headline: `主标题塞进了 ${titleChars} 个字，3 秒扫视根本读不完`,
      why: `演讲开场观众抬头只给屏幕约 3 秒（示意估算当前需 ${estGlanceSec} 秒）。把整段公文标题搬上封面，字号被逼缩小，观众低头逐字默读时，正好错过你的第一句开场白。`,
      action: "把主标题压缩成 6–12 字核心短语，并把字号推到 50–72pt。",
      fixLabel: "精简主标题并放大",
      fixPatch: { titleLines: "concise", titleSize: Math.max(state.titleSize, 62) },
    });
  } else if (titleRect.fontSize < 44 || scaleRatio < 1.9) {
    faults.push({
      id: "title-weak",
      part: "title",
      severity: 95,
      short: `${titleRect.fontSize}pt 过小`,
      headline: `主标题仅 ${titleRect.fontSize}pt（层级比 ${scaleRatio}×），15 米后排已失焦`,
      why: `按 3.2 米宽幕布推算，当前主标在 15 米外视角仅 ${backRowArcmin}′，多笔画汉字容易糊成一团；且与副标题拉不开 ≥2× 字号反差，眼睛进屏找不到第一落点。`,
      action: "向右拉高「主标题字号」至 52–72pt，让主角一眼压住全场。",
      fixLabel: "把主标题推至 64pt",
      fixPatch: { titleSize: 64 },
    });
  } else if (titleClipped) {
    faults.push({
      id: "title-clipped",
      part: "title",
      severity: 88,
      short: "标题越界",
      headline: `主标题 ${titleRect.fontSize}pt 撑破了 5% 安全边距`,
      why: "投影仪梯形校正或电视过扫描常裁掉四周边缘，标题顶到画框外缘不仅显局促，现场还可能少半个字。",
      action: "略回调主标题字号至 58–68pt，把文字收回安全线内。",
      fixLabel: "收进安全边距内",
      fixPatch: { titleSize: 62 },
    });
  }

  if (state.subtitleMode === "bullets") {
    faults.push({
      id: "subtitle-bloated",
      part: "subtitle",
      severity: 90,
      short: "4行提纲",
      headline: "副标题堆成 4 行提纲，封面退化成了目录页",
      why: "原海报写明「一句话说明价值主张（ONE LINE. CLEAR VALUE.）」。根据 Mayer 冗余效应，封面挂满项目符号时，听众的视觉通道被文字占满，无暇听你开口。",
      action: "将「副标题」切回单行价值主张，把细节留给后面的内容页。",
      fixLabel: "压成一句话价值主张",
      fixPatch: { subtitleMode: "one-line" },
    });
  } else if (state.subtitleMode === "missing") {
    faults.push({
      id: "subtitle-missing",
      part: "subtitle",
      severity: 72,
      short: "缺少语境",
      headline: "副标题被清空，观众只见大词、不知你打算解决什么",
      why: "除非全场已熟知你的主题（如明星新品发布会），否则孤零零的大标题缺少语境锚点。补上一句 10–18 字的价值主张，能瞬间对齐听众预期。",
      action: "开启「一句话副标题」补全主题语境。",
      fixLabel: "补回一句话副标题",
      fixPatch: { subtitleMode: "one-line" },
    });
  } else if (subClipped) {
    faults.push({
      id: "subtitle-clipped",
      part: "subtitle",
      severity: 75,
      short: "副标顶边",
      headline: "副标题条被挤出安全边距",
      why: "上方标题占行过多或字号过大，把副标题条顶出了底部或右侧安全框。",
      action: "适度收小主标题字号，给副标题留出呼吸空间。",
      fixLabel: "调顺主副标题间距",
      fixPatch: { titleSize: 60 },
    });
  }

  if (maxHeroOverlap >= 5) {
    const targetName =
      heroTitleOverlap >= heroSubOverlap && heroTitleOverlap >= heroIdOverlap
        ? "主标题"
        : heroSubOverlap >= heroIdOverlap
          ? "副标题"
          : "品牌信息";
    faults.push({
      id: "hero-collision",
      part: "hero",
      severity: 92,
      short: `撞压${maxHeroOverlap}%`,
      headline: `视觉焦点压撞「${targetName}」达 ${maxHeroOverlap}%，图文互相抢戏`,
      why: "高饱和酸柠绿视觉区一旦叠压到白字或副标条下方，边缘明度突变会把字形切碎，观众必须费力辨认笔画，远看直接糊成一块。",
      action:
        state.axis === "right"
          ? "在画布上把酸柠圆向左拖进左侧空区（X ≈ 22%–32%），与右侧文字彻底分舱。"
          : state.axis === "center"
            ? "将视觉焦点上移并缩小为顶部徽章（Y ≈ 22%, 半径 17%），或切回左文右图。"
            : "在画布上把酸柠圆向右拖进右侧空区（X ≈ 68%–80%），让图文各自透气。",
      fixLabel: "把视觉焦点拖回空区",
      fixPatch:
        state.axis === "right"
          ? { heroX: 0.25, heroY: 0.5, heroRadius: Math.min(state.heroRadius, 0.3) }
          : state.axis === "center"
            ? { heroX: 0.5, heroY: 0.23, heroRadius: 0.17 }
            : { heroX: 0.74, heroY: 0.52, heroRadius: Math.min(state.heroRadius, 0.31) },
    });
  } else if (heroOutOfFrame) {
    faults.push({
      id: "hero-clipped",
      part: "hero",
      severity: 78,
      short: "圆体切边",
      headline: "视觉焦点滑出画框边缘，重心悬空",
      why: "当核心图形半截掉出安全画幅又并非刻意满幅出血摄影时，画面像投影仪对歪了，视觉锚点失去完整轮廓。",
      action: "往画布内侧拖回视觉焦点，或略微收小圆径。",
      fixLabel: "把焦点收回安全框",
      fixPatch: {
        heroX: clamp(state.heroX, 0.24, 0.76),
        heroY: clamp(state.heroY, 0.34, 0.64),
        heroRadius: Math.min(state.heroRadius, 0.32),
      },
    });
  } else if (state.heroRadius < 0.15) {
    faults.push({
      id: "hero-tiny",
      part: "hero",
      severity: 74,
      short: "焦点太小",
      headline: `视觉焦点仅占高度 ${Math.round(state.heroRadius * 200)}%，撑不起封面情绪`,
      why: "主视觉缩成一颗小圆点后，大面积深茄紫底面显得空落失衡，无法帮主题定调。",
      action: "把「视觉焦点尺度」调大到 22%–34%（居中构图 16%–20%）。",
      fixLabel: "放大视觉焦点至平衡",
      fixPatch: { heroRadius: state.axis === "center" ? 0.18 : 0.3 },
    });
  } else if (whitespacePct < 34) {
    faults.push({
      id: "crowded",
      part: "hero",
      severity: 80,
      short: `留白${whitespacePct}%`,
      headline: `版面留白只剩 ${whitespacePct}%，画面窒息没有呼吸`,
      why: "标题幻灯片至少应保留 35%–70% 的安静底面（经验值），好让视觉重心一眼跳出来。现在图形和文字把画面塞满，高级感瞬间消失。",
      action: "收小视觉焦点半径或精简副标题，把留白还给深茄紫底面。",
      fixLabel: "收小图形释放留白",
      fixPatch: { heroRadius: 0.28, subtitleMode: "one-line" },
    });
  }

  if (state.identityAnchor === "top-center" || idTitleOverlap > 4) {
    faults.push({
      id: "identity-hijack",
      part: "identity",
      severity: 86,
      short: "顶部抢C位",
      headline: `品牌信息挂在顶部正中且放大至 ${state.identityScale.toFixed(2)}×，抢走了主题风头`,
      why: "观众来听的是你的观点，不是来看巨幅公司 Logo。把机构标识放在顶部正中会把主标题往下压、打断第一视觉落点。",
      action: "把「品牌落脚」迁回左下角并将尺度收至 0.8×–1.15×，做安静的可信度背书。",
      fixLabel: "品牌迁回左下角克制尺度",
      fixPatch: { identityAnchor: "bottom-left", identityScale: 1.0 },
    });
  } else if (identityBreach) {
    faults.push({
      id: "identity-edge",
      part: "identity",
      severity: 82,
      short: "贴底被挡",
      headline: "品牌信息掉进底部 7% 遮挡区，后排会被讲台或前排人头挡住",
      why: "真实会议室里，屏幕最底沿常被前排观众头顶、演讲台或投影梯形裁切吃掉。机构落款贴着底边放，现场往往只剩半截字。",
      action: "将「品牌落脚」收回左下安全区内。",
      fixLabel: "收回左下安全区",
      fixPatch: { identityAnchor: "bottom-left", identityScale: Math.min(state.identityScale, 1.1) },
    });
  } else if (state.identityScale > 1.28 || idDominancePct > 55) {
    faults.push({
      id: "identity-huge",
      part: "identity",
      severity: 76,
      short: `占比${idDominancePct}%`,
      headline: `品牌锁组膨胀到主标题面积的 ${idDominancePct}%，喧宾夺主`,
      why: "品牌信息的作用是「建立专业可信度」，它应当像书脊或落款那样稳重克制，绝不该和主标题平起平坐。",
      action: "把「品牌尺度」收回到 0.85×–1.10×。",
      fixLabel: "收回克制品牌尺度",
      fixPatch: { identityScale: 1.0 },
    });
  }

  faults.sort((a, b) => b.severity - a.severity);

  // 4. 四枚原海报引出针各自实况
  const byPart = (part) => faults.find((f) => f.part === part) || null;
  const partMeta = {
    title: {
      cn: "主标题",
      en: "MAIN TITLE",
      posterBody: "清晰有力，传达主题，使用大号字体吸引注意",
      okTag: `${titleRect.fontSize}pt · ${scaleRatio}×`,
      fault: byPart("title"),
    },
    subtitle: {
      cn: "副标题",
      en: "SUBTITLE",
      posterBody: "补充说明或副标语，明确主题语境",
      okTag: "一句话 · 语境清",
      fault: byPart("subtitle"),
    },
    hero: {
      cn: "视觉焦点",
      en: "HERO AREA",
      posterBody: "放置核心图像 / 数据 / 图形，强化主题表达",
      okTag: `净空 · 留白 ${whitespacePct}%`,
      fault: byPart("hero"),
    },
    identity: {
      cn: "品牌信息",
      en: "IDENTITY",
      posterBody: "展示品牌标识与名称，建立专业可信度",
      okTag: `左下稳锚 · ${state.identityScale.toFixed(1)}×`,
      fault: byPart("identity"),
    },
  };

  const passedCount = Object.values(partMeta).filter((p) => !p.fault).length;
  const primary = faults[0] || null;

  // 合法平衡态判定（接受多组合法解）
  let passHeadline = "四支柱全部归位：3 秒读懂、后排清晰、留白透气";
  let passWhy = `主标题 ${titleRect.fontSize}pt（层级反差 ${scaleRatio}×，15m 视角 ${backRowArcmin}′）稳抓第一眼，一句话副标题交待语境，视觉焦点与文字 0% 重叠并保留 ${whitespacePct}% 留白，品牌落脚克制可信。`;
  if (state.axis === "right") {
    passHeadline = "左图右文对衡解成立：先吸睛、再落题";
  } else if (state.axis === "center") {
    passHeadline = "极简居中宣言解成立：发布会舞台感拉满";
  }

  const backRowGrade =
    titleRect.fontSize >= 52 && state.titleLines === "concise" && maxHeroOverlap < 5
      ? "后排清晰"
      : titleRect.fontSize >= 40 && maxHeroOverlap < 15
        ? "中排勉强"
        : "后排糊失";

  return {
    geom,
    deck,
    faults,
    partMeta,
    passedCount,
    isClean: passedCount === 4,
    primary: primary || {
      id: "clean",
      part: "all",
      short: "4/4 过关",
      headline: passHeadline,
      why: passWhy,
      action: "点上方「翻到 02 承接页」看这份封面如何定下整套幻灯片的视觉契约，或试试「3 秒快闪测验」。",
      fixLabel: "翻看 02 承接页",
      fixPatch: { slideIndex: 1 },
    },
    metrics: {
      titlePt: titleRect.fontSize,
      scaleRatio,
      overlapPct: maxHeroOverlap,
      whitespacePct,
      backRowArcmin,
      backRowGrade,
      estGlanceSec,
      idDominancePct,
      titleChars,
    },
  };
}
