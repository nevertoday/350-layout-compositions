// 215 直排左起 · 单真源几何模型与诊断引擎
// 画布绘制、右脊五原则状态灯、底部路径条、黑底诊单条共用同一份几何坐标与判据。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报五柱",
    en: "POSTER SPECIMEN",
    cols: [
      { lead: "好的排版始于路径", body: "左起推进顺畅。" },
      { lead: "信息分栏层级清晰", body: "明确列序秩序。" },
      { lead: "节奏由你掌控。", body: "平衡字距列距。" },
      { lead: "结构服务内容。", body: "按需选栏分组。" },
      { lead: "左起直排多景宜", body: "展墙画册清晰。" },
    ],
  },
  gallery: {
    id: "gallery",
    label: "展墙年表",
    en: "EXHIBITION TIMELINE",
    cols: [
      { lead: "一二〇四草原竖书", body: "逆旋九十左起。" },
      { lead: "一二六九八思巴字", body: "沿袭左起碑铭。" },
      { lead: "一五九九老满文兴", body: "借蒙文左起书。" },
      { lead: "一九九九统一编码", body: "蒙文入数字页。" },
      { lead: "二〇一九网页标准", body: "直排左起入规。" },
    ],
  },
  bilingual: {
    id: "bilingual",
    label: "左翻画册序",
    en: "LEFT-BOUND CATALOG",
    cols: [
      { lead: "卷首自左而启。", body: "左装订重心左。" },
      { lead: "动线顺势右行。", body: "与西文页合拍。" },
      { lead: "锚点红印定序。", body: "破除右起惯性。" },
      { lead: "节奏列宽字紧。", body: "成柱而不横串。" },
      { lead: "留白气韵相通。", body: "五柱连贯不散。" },
    ],
  },
};

export const LIMITS = {
  colGap: { min: 0.16, max: 2.55 },
  charGap: { min: 0.0, max: 0.68 },
};

// 开场刻意停在 0/5 复合错态：列距小于字距触发横串 + 起点落右且 5←1 逆序 + 全列同重拉平
export const INITIAL_STATE = {
  specimen: "poster",
  colGap: 0.30,
  charGap: 0.54,
  order: "rtl",       // "ltr" | "rtl" | "split"
  anchor: "right",    // "left" | "none" | "right"
  hierarchy: "flat",  // "lead" | "flat" | "rightHeavy"
  guides: true,
};

export const PRESETS = {
  poster: {
    label: "原海报经典解",
    kind: "valid",
    patch: { colGap: 1.18, charGap: 0.14, order: "ltr", anchor: "left", hierarchy: "lead" },
  },
  compact: {
    label: "紧致刊物解",
    kind: "valid",
    patch: { colGap: 0.88, charGap: 0.08, order: "ltr", anchor: "left", hierarchy: "lead" },
  },
  gallery: {
    label: "疏朗展墙解",
    kind: "valid",
    patch: { colGap: 1.56, charGap: 0.22, order: "ltr", anchor: "left", hierarchy: "lead" },
  },
  errCross: {
    label: "试错：横串错读",
    kind: "error",
    patch: { colGap: 0.26, charGap: 0.54, order: "ltr", anchor: "left", hierarchy: "lead" },
  },
  errIsland: {
    label: "试错：孤柱断链",
    kind: "error",
    patch: { colGap: 2.38, charGap: 0.12, order: "ltr", anchor: "left", hierarchy: "lead" },
  },
  errNoAnchor: {
    label: "试错：缺左起点",
    kind: "error",
    patch: { colGap: 1.18, charGap: 0.14, order: "ltr", anchor: "none", hierarchy: "flat" },
  },
  errRight: {
    label: "试错：右起逆排",
    kind: "error",
    patch: { colGap: 1.18, charGap: 0.14, order: "rtl", anchor: "right", hierarchy: "rightHeavy" },
  },
  reset: {
    label: "复原开场错态",
    kind: "reset",
    patch: {
      colGap: INITIAL_STATE.colGap,
      charGap: INITIAL_STATE.charGap,
      order: INITIAL_STATE.order,
      anchor: INITIAL_STATE.anchor,
      hierarchy: INITIAL_STATE.hierarchy,
    },
  },
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const ORDER_MAPS = {
  ltr: [0, 1, 2, 3, 4],
  rtl: [4, 3, 2, 1, 0],
  split: [2, 0, 4, 1, 3],
};

// 从真实画布像素尺寸算出每列每个字盒的精确位置，作为画布渲染与实时诊单的唯一真源
export function computeLayout(state, width, height) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const slots = ORDER_MAPS[state.order] || ORDER_MAPS.ltr;
  const maxChars = Math.max(...spec.cols.map((c) => [...(c.lead + c.body)].length));

  const padTop = 78;
  const padBottom = 60;
  const padLeft = Math.max(54, Math.round(width * 0.09));
  const padRight = Math.max(26, Math.round(width * 0.055));

  const availW = Math.max(160, width - padLeft - padRight);
  const availH = Math.max(140, height - padTop - padBottom);

  // 字号严格按当前真实字距与最大合理列宽动态缩放，确保任何极端参数都绝不裁底、且宽屏字体大气醒目
  const fsByH = availH / (maxChars + (maxChars - 1) * state.charGap);
  const fsByW = availW / (5 + 4 * Math.max(1.05, state.colGap));
  const fs = clamp(Math.min(fsByH, fsByW, 24), 8.5, 24);

  const vGapPx = fs * state.charGap;
  const hGapPx = fs * state.colGap;
  const stepY = fs + vGapPx;
  const stepX = fs + hGapPx;

  const totalColsW = 5 * fs + 4 * hGapPx;
  // 左起布局以左侧稳定锚位展开：列距缩紧时左侧紧缩、右侧留出清晰展开跑道提示向右拉开
  const startX = clamp(
    padLeft + (availW - totalColsW) * 0.18,
    padLeft,
    Math.max(padLeft, width - padRight - totalColsW)
  );
  const startY = padTop;

  const columns = slots.map((logicalIdx, visualIdx) => {
    const src = spec.cols[logicalIdx];
    const leadChars = [...src.lead];
    const bodyChars = [...src.body];
    const all = [
      ...leadChars.map((ch) => ({ ch, isLead: true })),
      ...bodyChars.map((ch) => ({ ch, isLead: false })),
    ];
    const cx = startX + visualIdx * stepX + fs * 0.5;
    const x0 = startX + visualIdx * stepX;
    const isHeavy =
      (state.hierarchy === "lead")
        ? false
        : (state.hierarchy === "rightHeavy" && visualIdx === 4);

    const cells = all.map((item, rowIdx) => {
      const y0 = startY + rowIdx * stepY;
      return {
        ch: item.ch,
        isLead: item.isLead,
        isBold:
          state.hierarchy === "lead"
            ? item.isLead
            : state.hierarchy === "rightHeavy"
              ? visualIdx === 4
              : false,
        visualIdx,
        logicalIdx,
        rowIdx,
        x0,
        y0,
        cx,
        cy: y0 + fs * 0.5,
        size: fs,
      };
    });

    const bottomY = startY + (all.length - 1) * stepY + fs;
    return {
      visualIdx,
      logicalIdx,
      displayNum: logicalIdx + 1,
      cx,
      x0,
      x1: x0 + fs,
      topY: startY,
      bottomY,
      badgeY: 54,
      isHeavy,
      cells,
    };
  });

  const maxBottomY = Math.max(...columns.map((c) => c.bottomY));
  // 真实相邻字盒边到边像素间隙
  const realVGap = columns[0].cells.length > 1
    ? columns[0].cells[1].y0 - (columns[0].cells[0].y0 + fs)
    : vGapPx;
  const realHGap = columns[1].x0 - columns[0].x1;
  const ratio = realHGap / Math.max(1.5, realVGap);
  const spanRatio = totalColsW / availW;

  // 三个完全分离的垂直带：顶部 y=22 起点锚轨 | 底部 maxBottomY+18 列距卡尺 | 最底 height-16 红虚线推进箭
  const colCaliper = {
    x1: columns[0].x1,
    x2: columns[1].x0,
    midX: (columns[0].x1 + columns[1].x0) * 0.5,
    y: Math.min(height - 34, maxBottomY + 18),
  };
  const charCaliper = {
    x: Math.max(22, columns[0].x0 - Math.max(24, fs * 1.35)),
    y1: columns[0].cells[0].y0 + fs,
    y2: columns[0].cells[1].y0,
    midY: columns[0].cells[0].y0 + fs + realVGap * 0.5,
    dragTop: startY,
    dragBottom: startY + stepY * 4,
  };

  const beaconCol = state.anchor === "right" ? columns[4] : columns[0];
  const beacon = {
    x: beaconCol.cx,
    y: 22,
    r: 9,
  };

  const arrowY = height - 14;

  return {
    width,
    height,
    fs,
    padLeft,
    padRight,
    padTop,
    padBottom,
    availW,
    availH,
    startX,
    startY,
    totalColsW,
    maxBottomY,
    arrowY,
    realVGap,
    realHGap,
    ratio,
    spanRatio,
    columns,
    colCaliper,
    charCaliper,
    beacon,
  };
}

// 基于实绘几何单真源核算 5 条原海报原则与 8 类双向失误
export function evaluate(state, layout) {
  const { realVGap, realHGap, ratio } = layout;
  const colGap = state.colGap;
  const charGap = state.charGap;

  // 1. 左起原则
  let p1 = { id: "leftStart", ok: true, badge: "左起锚定", detail: "左上红点与首列重合，入口清晰" };
  if (state.anchor === "right") {
    p1 = { id: "leftStart", ok: false, badge: "起点偏右", detail: "红点起点跑到了最右列，把读者拉回右起习惯" };
  } else if (state.anchor === "none") {
    p1 = { id: "leftStart", ok: false, badge: "缺起点标", detail: "中文竖排若无左起视觉锚点，读者本能会从右上角入眼" };
  } else if (state.hierarchy === "rightHeavy") {
    p1 = { id: "leftStart", ok: false, badge: "右重倒吸", detail: "末列过粗过重，视线未读首列便被直接吸向右侧" };
  }

  // 2. 列序顺序
  let p2 = { id: "colOrder", ok: true, badge: "1→5 正序", detail: "编号自左向右递增，叙事逻辑连贯" };
  if (state.order === "rtl") {
    p2 = { id: "colOrder", ok: false, badge: "5←1 逆排", detail: "列序倒排成直排右起，与左起动线直接打架" };
  } else if (state.order === "split") {
    p2 = { id: "colOrder", ok: false, badge: "列序打乱", detail: "列号跳跃（3·1·5·2·4），读者找不到下一列落点" };
  }

  // 3. 字距 & 列距（双向校验：横串 / 拉锯 / 撞字 / 散字 / 孤柱）
  let p3 = { id: "spacing", ok: true, badge: `列/字 ${ratio.toFixed(1)}×`, detail: "列距明显大于字距，纵列抱团而不横串" };
  let spacingFault = null;
  if (charGap < 0.05) {
    spacingFault = "charTight";
    p3 = { id: "spacing", ok: false, badge: "字距撞车", detail: `字距仅 ${Math.round(realVGap)}px，上下笔画贴死难辨` };
  } else if (ratio < 1.15) {
    spacingFault = "crossRead";
    p3 = { id: "spacing", ok: false, badge: `横串 ${ratio.toFixed(2)}×`, detail: `列距 ${Math.round(realHGap)}px 竟窄过或逼近字距 ${Math.round(realVGap)}px，眼睛横向串行` };
  } else if (charGap > 0.38) {
    spacingFault = "charLoose";
    p3 = { id: "spacing", ok: false, badge: "单字漂浮", detail: `字距拉到 ${charGap.toFixed(2)}em，单列句子散成零星孤字` };
  } else if (ratio < 1.55) {
    spacingFault = "ambiguous";
    p3 = { id: "spacing", ok: false, badge: `拉锯 ${ratio.toFixed(2)}×`, detail: "列距与字距过于接近，形成方阵棋盘，纵横引力拉锯" };
  } else if (colGap > 1.95) {
    spacingFault = "colIsland";
    p3 = { id: "spacing", ok: false, badge: "孤柱断链", detail: `列距扩至 ${colGap.toFixed(2)}em，五列裂成孤岛，换列跨越过长` };
  } else if (colGap < 0.62) {
    spacingFault = "colCramped";
    p3 = { id: "spacing", ok: false, badge: "列缝挤粘", detail: `列距仅 ${colGap.toFixed(2)}em，列间缺呼吸缝` };
  }

  // 4. 阅读动线
  let p4 = { id: "scanPath", ok: true, badge: "顺流左→右", detail: "先竖落、再右跳，五列一气呵成" };
  if (spacingFault === "crossRead" || spacingFault === "ambiguous") {
    p4 = { id: "scanPath", ok: false, badge: "横向串行", detail: "视线被横向临近字符吸走，横着扫过首行" };
  } else if (!p2.ok) {
    p4 = { id: "scanPath", ok: false, badge: "动线逆行", detail: "列序与左起路径相反，眼动来回折返" };
  } else if (!p1.ok) {
    p4 = { id: "scanPath", ok: false, badge: "入口犹豫", detail: "缺乏明确左起点，眼睛在左右两端来回找头" };
  } else if (spacingFault === "colIsland") {
    p4 = { id: "scanPath", ok: false, badge: "换列脱节", detail: "列间空槽太宽，读完底端难接下一列天头" };
  } else if (!p3.ok) {
    p4 = { id: "scanPath", ok: false, badge: "节奏受阻", detail: "字距失衡打断单列纵向流畅度" };
  }

  // 5. 结构为先
  let p5 = { id: "structure", ok: true, badge: "首句定锚", detail: "列首加粗标出主干，界栏清晰托底" };
  if (state.hierarchy === "flat") {
    p5 = { id: "structure", ok: false, badge: "层级拉平", detail: "五列字重完全一致，扫一眼抓不住每列重点" };
  } else if (state.hierarchy === "rightHeavy") {
    p5 = { id: "structure", ok: false, badge: "右重失衡", detail: "重笔落在最右末列，整版结构重心倒挂" };
  } else if (spacingFault === "colIsland" || spacingFault === "crossRead") {
    p5 = { id: "structure", ok: false, badge: "结构散架", detail: "纵横栅格比例失调，列块轮廓无法成立" };
  }

  const principles = [p1, p2, p3, p4, p5];
  const passed = principles.filter((p) => p.ok).length;

  // 主诊断（按最致命问题优先排序，确保每次操作都给出一针见血的反馈和一步修法）
  let headline = "";
  let body = "";
  let hint = "";
  let statusTag = "";
  let severity = "err";
  let quickFixLabel = "";
  let quickFixPatch = null;
  let scanMode = "good"; // "good" | "cross" | "rtl" | "split" | "island" | "hesitate"

  if (spacingFault === "crossRead") {
    scanMode = "cross";
    statusTag = `${passed}/5 · 横串错读`;
    headline = `列距 ${Math.round(realHGap)}px 窄于字距 ${Math.round(realVGap)}px，眼睛直接横着串行`;
    body = `按格式塔临近性法则，人眼永远把距离更近的字归成一组。现在横向相邻字比竖向相邻字更近（纵横比仅 ${ratio.toFixed(2)}×），读者不会顺着第 1 列往下读，而是直接横扫顶部一排字。`;
    hint = "向右横拖画布拉开列距，同时压紧字距，让列距至少达到字距的 1.6 倍。";
    quickFixLabel = "拉开列距、收紧字距";
    quickFixPatch = { colGap: 1.18, charGap: 0.14 };
  } else if (state.order === "rtl") {
    scanMode = "rtl";
    statusTag = `${passed}/5 · 列序反排`;
    headline = "编号倒排成 5←4←3←2←1，把直排左起做成了直排右起";
    body = "直排左起的核心是「左侧开篇、向右推进」。当前列序和红点起点仍留在右侧，和左侧大标与阅读箭头的向右动线直接迎面相撞。";
    hint = "点画布上的列序徽标切回「1→5 左起正序」，并把红点起点移回最左列。";
    quickFixLabel = "改为 1→5 左起正序";
    quickFixPatch = { order: "ltr", anchor: "left" };
  } else if (state.order === "split") {
    scanMode = "split";
    statusTag = `${passed}/5 · 列序错乱`;
    headline = "列序跳成 3·1·5·2·4，每换一列都要重新找头";
    body = "纵列本身没有连笔引导，一旦编号失去从左到右的单调递进，读者读完一列底端后视线会四处乱撞，完全丧失顺序感。";
    hint = "将列序切回「1→5 左起正序」，让信息沿单一向右轴线推进。";
    quickFixLabel = "理顺 1→5 列序";
    quickFixPatch = { order: "ltr" };
  } else if (state.anchor === "right") {
    scanMode = "rtl";
    statusTag = `${passed}/5 · 起点偏右`;
    headline = "红点起点留在最右列，读者本能从右边反着读";
    body = "中文读者看竖排自带数百年「右起」惯性。把醒目的红色起点标放在最右列，等于直接强化了右起入口，左侧第 1 列被彻底冷落。";
    hint = "点击画布顶部的红圆锚点，把它移回第 1 列天头建立左起原点。";
    quickFixLabel = "红点起点归左";
    quickFixPatch = { anchor: "left" };
  } else if (state.anchor === "none") {
    scanMode = "hesitate";
    statusTag = `${passed}/5 · 缺左起点`;
    headline = "拿掉了左起锚点，中文竖排会自动吸回右上角";
    body = "不像传统蒙古文天生左起，汉字竖排在没有红点起点或编号锚定时，绝大多数中文读者会习惯性地先看右上角——前两秒全浪费在试错「该从哪边读」上。";
    hint = "开启「左上红点锚定」，给左起动线一个不容错认的入口灯塔。";
    quickFixLabel = "补上左上红点起点";
    quickFixPatch = { anchor: "left" };
  } else if (spacingFault === "charTight") {
    scanMode = "hesitate";
    statusTag = `${passed}/5 · 上下撞字`;
    headline = `字距压到 ${charGap.toFixed(2)}em（${Math.round(realVGap)}px），竖排上下笔画粘成黑柱`;
    body = "收紧字距能增强纵列凝聚力，但压到几乎零缝隙时，方块字的横笔与竖笔互相咬死，读三行眼睛就会发酸。";
    hint = "向下微拖首列左侧的字距卡尺，把字距放回 0.08–0.24em 区间。";
    quickFixLabel = "放宽字距至 0.14em";
    quickFixPatch = { charGap: 0.14 };
  } else if (spacingFault === "charLoose") {
    scanMode = "hesitate";
    statusTag = `${passed}/5 · 单字漂浮`;
    headline = `字距拉到 ${charGap.toFixed(2)}em，单列句子断成零散孤字`;
    body = "每个字上下隔得太远，词语失去了连贯轮廓，即使列距足够宽，眼睛也要逐字点读，阅读节奏拖沓。";
    hint = "向上收紧字距卡尺至 0.08–0.24em，让词语重新抱团成句。";
    quickFixLabel = "收紧字距至 0.14em";
    quickFixPatch = { charGap: 0.14 };
  } else if (spacingFault === "ambiguous") {
    scanMode = "cross";
    statusTag = `${passed}/5 · 纵横拉锯`;
    headline = `列距与字距之比仅 ${ratio.toFixed(2)}×，五列退化成等距方阵棋盘`;
    body = "当列缝和字缝差不多宽，上下临近与左右临近势力相当，视线在「往下读」和「往右读」之间反复摇摆。";
    hint = "向右横拖画布适当加宽列距，或收紧字距，让纵横比稳稳超过 1.6×。";
    quickFixLabel = "拉大纵横间距反差";
    quickFixPatch = { colGap: 1.18, charGap: 0.14 };
  } else if (spacingFault === "colIsland") {
    scanMode = "island";
    statusTag = `${passed}/5 · 孤柱断链`;
    headline = `列距拉到 ${colGap.toFixed(2)}em，五列撕裂成互不往来的孤岛`;
    body = "列距并不是越宽越好：当列间空槽宽到两倍字高以上，读完一列底端后视线要长途奔袭才能找到下一列天头，整段语义被硬生生切断。";
    hint = "向左横拖画布把列距收回 0.75–1.75em，兼顾呼吸感与换列连贯。";
    quickFixLabel = "收回适中列距";
    quickFixPatch = { colGap: 1.18 };
  } else if (spacingFault === "colCramped") {
    scanMode = "hesitate";
    statusTag = `${passed}/5 · 列缝挤粘`;
    headline = `列距仅 ${colGap.toFixed(2)}em，列与列之间缺乏换气余地`;
    body = "即便字距更小暂未横串，过窄的列缝也会让相邻两列标点与笔画紧贴，版面透不过气。";
    hint = "向右横拖画布放宽列距至 0.80em 以上，留出舒展的列间白道。";
    quickFixLabel = "放宽列距至 1.10em";
    quickFixPatch = { colGap: 1.1 };
  } else if (state.hierarchy === "rightHeavy") {
    scanMode = "hesitate";
    statusTag = `${passed}/5 · 右重倒吸`;
    headline = "最右末列加粗过重，把左起入口抢走了";
    body = "视觉重量就是隐形入口。虽然起点标在最左，但最右一列通篇黑重，一眼望去目光先跌进终点，再回头倒找开头。";
    hint = "把层级切回「首句加粗定锚」，让每一列天头均匀建立清朗入口。";
    quickFixLabel = "恢复首句加粗层级";
    quickFixPatch = { hierarchy: "lead" };
  } else if (state.hierarchy === "flat") {
    scanMode = "hesitate";
    statusTag = `${passed}/5 · 层级拉平`;
    headline = "五列字重一马平川，扫一眼抓不住每列重点";
    body = "215 原海报之所以一秒读清五栏主旨，靠的是每列首句加粗领读、后句细写展开——先见骨架、再读细部。";
    hint = "切回「首句加粗定锚」，立刻拉开每列主干与阐释的轻重对比。";
    quickFixLabel = "开启首句加粗层级";
    quickFixPatch = { hierarchy: "lead" };
  } else {
    scanMode = "good";
    severity = "ok";
    const styleLabel =
      colGap < 1.0 ? "紧致刊物节奏" : colGap > 1.42 ? "疏朗展墙节奏" : "经典海报节奏";
    statusTag = `5/5 · ${styleLabel}`;
    headline = `直排左起成立：列/字比 ${ratio.toFixed(1)}×，视线顺着左起红点一列列右推`;
    body = `左上红点锚定第 1 列入口，实测列距 ${Math.round(realHGap)}px 明显宽于字距 ${Math.round(realVGap)}px，单列内靠紧抱团、列间留出清晰气口，首句加粗立住天头主干。换其他合法列距或试错按钮，还能继续验证边界。`;
    hint = "试试把列距拖得极窄或极宽，亲眼看「横串错读」与「孤柱断链」两条红线何时触发。";
    quickFixLabel = "演练左起视线流";
    quickFixPatch = null;
  }

  const lineHeightCss = (1 + colGap).toFixed(2);
  const letterSpacingCss = `${charGap.toFixed(2)}em`;
  const wmCss = state.order === "rtl" ? "vertical-rl" : "vertical-lr";
  const cssSnippet = `writing-mode: ${wmCss}; line-height: ${lineHeightCss}; letter-spacing: ${letterSpacingCss};`;

  return {
    principles,
    passed,
    total: 5,
    statusTag,
    severity,
    headline,
    body,
    hint,
    quickFixLabel,
    quickFixPatch,
    scanMode,
    spacingFault,
    cssSnippet,
  };
}
