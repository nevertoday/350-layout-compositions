// 155 插页式版式 · 单真源几何、纸材物理与九类错态诊断模型
// 开场画布、顶栏徽章、左侧五原则账本与右侧白话诊单全部从本模块同一组实绘矩形读取数值。

export const PALETTE = {
  paper: "#ECF0F1",
  paperPure: "#F5F7F7",
  folderMint: "#E9EFED",
  cardWarm: "#F3F1EF",
  citrineMist: "#F7F5E6",
  navyDeep: "#071731",
  navyPocket: "#122847",
  navyTab: "#041125",
  ink: "#03111E",
  inkSub: "#35495E",
  citrine: "#ECDB2A",
  citrineBright: "#EFDE05",
  citrineTab: "#ECDC40",
  citrineInk: "#6D5B00",
  teal: "#2E7E6E",
  tealSafe: "#1F6154",
  tealFold: "#3E907E",
  mintCircle: "#B7D0C4",
  mintCorner: "#BFDACC",
  mintDot: "#B0CFBC",
  errLight: "#B82A24",
  errDark: "#FF887A",
  okLight: "#176B58",
  okDark: "#7CE5C8",
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报夹层",
    hostTag: "P.154–155 · 版式样本档案",
    hostTitle: "连续阅读中的信息分层实验",
    colA: [
      "在长期面对同构双栏正文时，",
      "人眼会迅速进入匀速扫读模式。",
      "若没有纸张厚度或色面的变化，",
      "核心结论极易混入段落背景里。",
      "通过抽拉一张异质二级纸卡，",
      "读者指尖与视线同时产生停顿。",
    ],
    colB: [
      "插页并不取代原有的主文秩序，",
      "而是叠压在局部，留出底页脉络。",
      "读完重点卡片后，视线顺着纸缘",
      "自然回到宿主页下一段继续推进。",
      "好的插页像放大镜而非遮挡板，",
      "克制留余，整页反而更有呼吸。",
    ],
    insertKicker: "视觉焦点 · FOCUS",
    insertTitle: "插页天然形成视觉停顿",
    insertLines: [
      "不切断底页连续结构，",
      "把最关键的判断拎高一层，",
      "单抽出来也能独立读懂。",
    ],
    secondaryKicker: "设计思路 · LAYERING",
    secondaryTitle: "以短幅纸层制造呼吸",
    secondaryLines: [
      "薄荷衬夹先托出前后关系，",
      "焦卡叠前，视线主次立分。",
    ],
    chopTitle: "……却在连续翻页时被",
    chopLines: [
      "（此处硬截了主文第 2 段半句）",
      "「……忽略了原本应该停下来」",
      "读者必须退回左栏找前半句。",
    ],
    wallTitle: "插页设计完整细则与参数全表",
    wallLines: [
      "1.印刷装订需核对纸张丝缕方向与克重差",
      "2.铜版纸与道林纸含水率差异会引起微翘",
      "3.跨页出血位须外扩3mm并避开骑马钉口",
      "4.正文字号与行距在二级纸上不宜再缩小",
      "5.若同时塞进六百字细则便失去刹车效果",
      "6.密排长文让插页退化成另一堵文字墙。",
    ],
    extras: [
      { title: "附注 A", line: "顺便提一句字号规范" },
      { title: "促销贴", line: "扫码领取更多模板" },
    ],
  },
  arch: {
    id: "arch",
    label: "建筑季刊",
    hostTag: "ISSUE 09 · 旧厂更新专刊",
    hostTitle: "红砖仓库的静默改造动线",
    colA: [
      "原建于上世纪的锯齿形厂房，",
      "保留了南北通透的钢屋架跨度。",
      "设计团队没有拆除旧砖外墙，",
      "只在内庭置入轻钢与玻璃连廊。",
      "自然天光顺着北向高窗斜落，",
      "把三千平展厅切出柔和明暗带。",
    ],
    colB: [
      "改造预算原本最紧的是结构加固，",
      "团队改用可逆螺栓代替湿作业，",
      "工期因此压缩了近四分之一。",
      "展厅开放后的首年运维账本，",
      "印证了低干预策略的长期价值。",
      "参观者沿着旧轨道走过全馆。",
    ],
    insertKicker: "短幅插页 · 改造账本",
    insertTitle: "保留旧架省下 38% 碳排",
    insertLines: [
      "单方造价：¥4,120 / m²",
      "施工周期：7.5 个月（快 24%）",
      "旧砖复用率：86% 现场就地翻新",
    ],
    secondaryKicker: "剖面衬页 · 采光示意",
    secondaryTitle: "北向锯齿高窗倾角 52°",
    secondaryLines: [
      "半透衬纸叠加旧厂平面，",
      "对比改造前后的采光进深。",
    ],
    chopTitle: "……于是把原来的钢桁架",
    chopLines: [
      "（正文第 3 段被拦腰剪成两半）",
      "「……重新涂装后保留在屋顶」",
      "单看这张卡根本不知前因后果。",
    ],
    wallTitle: "结构加固与消防验收全部条款",
    wallLines: [
      "钢柱防火涂料耐火极限不低于2.5小时要求",
      "基础承台局部植筋采用C40微膨胀细石混凝",
      "暖通排烟风管沿旧天车轨道下挂并隐藏收口",
      "弱电桥架与应急照明回路分设于两侧柱廊内",
      "屋面防水卷材采用双层SBS改性沥青并做试水",
      "冗长条文堆满插页，一眼抓不到核心亮点。",
    ],
    extras: [
      { title: "材料表", line: "旧红砖 / 热镀锌钢" },
      { title: "交通贴", line: "地铁四号线东口出" },
    ],
  },
  report: {
    id: "report",
    label: "财经年报",
    hostTag: "ANNUAL REPORT · 研发与现金流",
    hostTitle: "韧性周期里的研发投入节奏",
    colA: [
      "在行业整体去库存的十二个月里，",
      "公司主动收缩了低毛利外包产线，",
      "把现金流向自研核心模组倾斜。",
      "三季度起海外直营渠道逐步起量，",
      "应收账款周转天数回落至稳态。",
      "以下正文继续拆解各区域明细。",
    ],
    colB: [
      "与同业削减研发费用的做法不同，",
      "本年度新增两座材料可靠性实验室。",
      "虽然短期折旧增加了管理费用，",
      "但关键部件良品率提升直接摊薄了",
      "单机售后成本，为下一年毛利率",
      "留出了可验证的安全垫。",
    ],
    insertKicker: "关键业绩插页 · KEY METRICS",
    insertTitle: "经营现金流净额 +29.4%",
    insertLines: [
      "研发占比：14.8%（连续四年升）",
      "海外营收占比：41.2%",
      "核心模组直通良率：98.6%",
    ],
    secondaryKicker: "注释衬页 · 口径说明",
    secondaryTitle: "剔除汇率波动的可比增速",
    secondaryLines: [
      "衬页收纳审计口径脚注，",
      "主焦卡只留三枚决策数字。",
    ],
    chopTitle: "……但管理层认为短期折旧",
    chopLines: [
      "（截断正文句子拼进插页）",
      "「……将在明年二季度前消化」",
      "抽离出来后缺乏完整财务语境。",
    ],
    wallTitle: "合并利润表附注第 14 至 29 项说明",
    wallLines: [
      "按准则第21号租赁准则确认使用权资产折旧",
      "递延所得税资产按未来可抵扣暂时性差异计",
      "外币报表折算差额列示于其他综合收益项目",
      "关联方交易定价参照独立第三方市场公允价",
      "股份支付费用按等待期内各资产负债表日摊",
      "整卡塞满附注密字，失去年度亮点放大功能。",
    ],
    extras: [
      { title: "风险提示", line: "汇率波动影响毛利" },
      { title: "名词表", line: "EBITDA / ROE 定义" },
    ],
  },
};

export const STOCKS = {
  flat: {
    id: "flat",
    label: "同色平纸",
    short: "同色隐身",
    fill: "#ECF0F1",
    border: "#CFD9DC",
    ink: "#35495E",
    subInk: "#52667A",
    tabFill: "#DCE4E6",
    tabInk: "#4E6375",
    shadowAlpha: 0,
    shadowOffset: 0,
    zStepMm: 0,
    contrastTier: "0 级 · 同底融合",
    alpha: 1,
  },
  citrine: {
    id: "citrine",
    label: "柠檬黄卡",
    short: "明黄强反差",
    fill: "#ECDB2A",
    border: "#D4C217",
    ink: "#03111E",
    subInk: "#213244",
    tabFill: "#041125",
    tabInk: "#ECDC40",
    shadowAlpha: 0.34,
    shadowOffset: 10,
    zStepMm: 4.2,
    contrastTier: "高阶 · 异色强跳",
    alpha: 1,
  },
  vellum: {
    id: "vellum",
    label: "薄荷硫酸纸",
    short: "半透硫酸纸",
    fill: "rgba(214, 234, 226, 0.84)",
    solidFill: "#D6EAE2",
    border: "#2E7E6E",
    ink: "#03111E",
    subInk: "#1F4B43",
    tabFill: "#2E7E6E",
    tabInk: "#F5F7F7",
    shadowAlpha: 0.24,
    shadowOffset: 7,
    zStepMm: 2.6,
    contrastTier: "中阶 · 半透叠影",
    alpha: 0.84,
  },
  navy: {
    id: "navy",
    label: "深藏青厚卡",
    short: "深青反色卡",
    fill: "#122847",
    border: "#2E7E6E",
    ink: "#F5F7F7",
    subInk: "#C6DDD2",
    tabFill: "#ECDC40",
    tabInk: "#03111E",
    shadowAlpha: 0.42,
    shadowOffset: 12,
    zStepMm: 5.0,
    contrastTier: "极高 · 反色深舱",
    alpha: 1,
  },
};

export const INITIAL_STATE = {
  theme: "poster",
  exposure: 0.82,
  stock: "flat",
  autonomy: "chop",
  count: 4,
  anchor: "pocket",
  pairBalance: "stepped",
  xray: false,
};

export const PRESETS = {
  broken: { ...INITIAL_STATE },
  poster: {
    theme: "poster",
    exposure: 0.42,
    stock: "citrine",
    autonomy: "clean",
    count: 2,
    anchor: "pocket",
    pairBalance: "stepped",
    xray: false,
  },
  shortLeaf: {
    theme: "arch",
    exposure: 0.38,
    stock: "navy",
    autonomy: "clean",
    count: 1,
    anchor: "spine",
    pairBalance: "stepped",
    xray: false,
  },
  vellum: {
    theme: "report",
    exposure: 0.46,
    stock: "vellum",
    autonomy: "clean",
    count: 1,
    anchor: "spine",
    pairBalance: "stepped",
    xray: false,
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 计算归一化坐标系（0..1 × 0..1）里的宿主页与所有活动插页的实绘矩形
export function computeLayout(state) {
  const host = { x: 0.055, y: 0.065, w: 0.85, h: 0.72 };
  const exp = clamp(state.exposure, 0.08, 0.94);
  const cards = [];

  if (state.count === 0) {
    return { host, cards, exposurePct: 0, coveragePct: 0, hostVisiblePct: 100, sizeRatio: 0 };
  }

  // 主插页的水平尺寸由 exposure 直接决定（与横向直拖单真源绑定）
  const primaryW = host.w * exp;
  const primaryH = state.count === 2 && state.pairBalance === "stepped" ? host.h * 0.56 : host.h * 0.64;

  // 计算锚定位置
  let px;
  let py;
  if (state.anchor === "spine") {
    // 紧锁中缝订口向右展开（若过宽自动贴左防出界）
    const spineX = host.x + host.w * 0.48;
    px = Math.min(spineX, host.x + host.w - primaryW - 0.015);
    px = Math.max(host.x + 0.03, px);
    py = host.y + (host.h - primaryH) * 0.5;
  } else if (state.anchor === "float") {
    // 悬空脱锚：漂在左偏上方，不靠订口也不进袋口
    px = host.x + host.w * 0.14;
    py = host.y + 0.04;
  } else {
    // pocket（155 原海报款）：从右侧深藏青袋口抽拉
    px = host.x + host.w - primaryW + 0.012;
    py = host.y + host.h - primaryH - 0.025;
  }

  // 次插页（仅在 count === 2 或 count === 4 时绘制，模拟原海报的薄荷文件夹衬夹）
  if (state.count === 2) {
    if (state.pairBalance === "equal") {
      // 试错态：两张一样响亮、面积近乎 1:1 的平权抢戏卡
      const secW = clamp(primaryW * 0.96, host.w * 0.22, host.w * 0.44);
      const secH = primaryH * 0.96;
      const sx = Math.max(host.x + 0.02, px - secW * 0.68);
      const sy = host.y + 0.045;
      cards.push({
        role: "secondary",
        loud: true,
        x: sx,
        y: sy,
        w: secW,
        h: secH,
        z: 1,
        hasNotch: false,
        tab: "right",
      });
    } else {
      // 原海报主次阶梯：后层淡薄荷指抠衬夹面积适度衬托、低饱和度，前层主焦卡突出
      const secW = clamp(primaryW * 0.72, host.w * 0.24, host.w * 0.42);
      const secH = host.h * 0.52;
      const sx = clamp(px - secW * 0.42, host.x + 0.05, host.x + host.w - secW - 0.04);
      const sy = host.y + 0.055;
      cards.push({
        role: "secondary",
        loud: false,
        x: sx,
        y: sy,
        w: secW,
        h: secH,
        z: 1,
        hasNotch: true,
        tab: "none",
      });
    }
  } else if (state.count === 4) {
    // 4 卡轰炸错态：衬夹 + 两枚侵入左栏与右上角的冗余贴纸卡
    const secW = clamp(primaryW * 0.62, host.w * 0.26, host.w * 0.48);
    cards.push({
      role: "secondary",
      loud: true,
      x: host.x + 0.04,
      y: host.y + 0.05,
      w: secW,
      h: host.h * 0.42,
      z: 1,
      hasNotch: true,
      tab: "none",
    });
    cards.push({
      role: "extra",
      idx: 0,
      loud: true,
      x: host.x + 0.03,
      y: host.y + host.h * 0.53,
      w: host.w * 0.36,
      h: host.h * 0.36,
      z: 2,
      hasNotch: false,
      tab: "none",
    });
    cards.push({
      role: "extra",
      idx: 1,
      loud: true,
      x: host.x + host.w * 0.54,
      y: host.y + 0.035,
      w: host.w * 0.38,
      h: host.h * 0.3,
      z: 2,
      hasNotch: false,
      tab: "right",
    });
  }

  cards.push({
    role: "primary",
    loud: true,
    x: px,
    y: py,
    w: primaryW,
    h: primaryH,
    z: state.count >= 2 ? 3 : 2,
    hasNotch: false,
    tab: "right",
  });

  // 精确栅格扫描计算全部插页并集对宿主页的真实遮盖率（0..100%）
  const GX = 24;
  const GY = 16;
  let covered = 0;
  for (let iy = 0; iy < GY; iy++) {
    const sy = host.y + ((iy + 0.5) / GY) * host.h;
    for (let ix = 0; ix < GX; ix++) {
      const sx = host.x + ((ix + 0.5) / GX) * host.w;
      for (let k = 0; k < cards.length; k++) {
        const c = cards[k];
        if (sx >= c.x && sx <= c.x + c.w && sy >= c.y && sy <= c.y + c.h) {
          covered++;
          break;
        }
      }
    }
  }
  const coveragePct = Math.round((covered / (GX * GY)) * 100);
  const hostVisiblePct = Math.max(0, 100 - coveragePct);

  // 主副面积比（用于检测双卡平权抢戏）
  const pCard = cards[cards.length - 1];
  const sCard = cards.find((c) => c.role === "secondary");
  const sizeRatio = sCard ? +((pCard.w * pCard.h) / Math.max(0.0001, sCard.w * sCard.h)).toFixed(2) : 1;

  return {
    host,
    cards,
    exposurePct: Math.round(exp * 100),
    coveragePct,
    hostVisiblePct,
    sizeRatio,
    trimMm: Math.round(185 * (1 - exp)), // 按标准 185mm 杂志单页折算短幅裁窄量
    sheetMm: Math.round(185 * exp),
  };
}

// 九类失误单真源诊断
export function diagnose(state) {
  const layout = computeLayout(state);
  const stock = STOCKS[state.stock];
  const { exposurePct, coveragePct, hostVisiblePct } = layout;

  const spanOk =
    state.count >= 1 &&
    state.count <= 2 &&
    state.exposure >= 0.24 &&
    state.exposure <= 0.56 &&
    coveragePct >= 18 &&
    coveragePct <= 58;

  const materialOk = state.count >= 1 && state.stock !== "flat" && state.anchor !== "float";
  const autonomyOk = state.count >= 1 && state.autonomy === "clean";
  const rhythmOk =
    state.count === 1 || (state.count === 2 && state.pairBalance === "stepped");

  const checks = {
    span: spanOk,
    material: materialOk,
    autonomy: autonomyOk,
    rhythm: rhythmOk,
  };
  const score = Object.values(checks).filter(Boolean).length;

  // 依严重程度排序判定主错态（9 类清晰失误）
  let fault = null;
  if (state.count === 0) {
    fault = {
      code: "zero_insert",
      tag: "平面失焦",
      headline: "抽走了全部插页，页面退回单层文字墙",
      why: "连续双栏正文缺少材质和层级的突变，人眼迅速切回匀速扫读，最该被记住的核心判断被埋进密字里。",
      hint: "在控台「插页密度」选「1 张单焦」或「2 张阶梯」，再把露出宽拖进 24%–56% 经验带。",
    };
  } else if (state.count >= 3) {
    fault = {
      code: "confetti",
      tag: "满屏轰炸",
      headline: `${state.count} 张插页把跨页切成了贴纸墙（遮盖 ${coveragePct}%）`,
      why: `冯·雷斯托夫孤立效应的前提是「稀缺」。满页都是跳出来的卡片时，人人都是重点就等于谁都不是重点，正文只剩 ${hostVisiblePct}% 缝隙，根本读不连贯。`,
      hint: "先把「插页密度」降回「1 张单焦」或「2 张阶梯」，再把露出幅宽收进 24%–56%。",
    };
  } else if (state.exposure > 0.56 || coveragePct > 58) {
    fault = {
      code: "swallow",
      tag: "喧宾夺主",
      headline: `插页盖住了 ${coveragePct}% 的宿主页，底文接不上行`,
      why: `主插页拉出到了 ${exposurePct}% 幅宽，宿主页只露出 ${hostVisiblePct}%。读者读完插页想回到原文继续读，视线找不到刚才停下的那一行，插页从「放大器」变成了挡路板。`,
      hint: "直接向左拖动插页索引耳（或按 ← 键），把露出幅宽收回到 24%–56% 之间。",
    };
  } else if (state.exposure < 0.24) {
    fault = {
      code: "bury",
      tag: "缩进隐没",
      headline: `插页只露出一道 ${exposurePct}% 窄边，重点根本没亮出来`,
      why: "插页藏得太深，标题被挤折、卡片内容读不全，既没有足够的停顿面积，也失去了独立承载核心信息的价值。",
      hint: "向右拖动插页索引耳（或按 → 键），把它拉出到 24%–56% 的舒适可读幅宽。",
    };
  } else if (state.stock === "flat") {
    fault = {
      code: "camouflage",
      tag: "同纸失层",
      headline: "插页和底页同白且零投影，退化成了普通方框",
      why: "插页式版式的灵魂是「二级纸张」的物理叠层错觉。纸色、透明度、投影全无反差时，人眼把它当成同一平面里的灰框，不会触发视觉刹车。",
      hint: "直接点击画布里的主插页，或把「纸材反差」切到柠檬黄卡、薄荷硫酸纸或深藏青厚卡。",
    };
  } else if (state.anchor === "float") {
    fault = {
      code: "edge_clip",
      tag: "悬空无锚",
      headline: "插页脱离订口与袋口悬空漂浮，像误弹的广告窗",
      why: "实体插页靠书脊装订或纸袋咬合固定，屏端插页也需明确边缘锚定。四边悬空盖在文字正中，只会引发读者的关窗冲动。",
      hint: "把「装订锚位」切回「袋口夹持」或「锁紧订口」，给插页一个真实的物理依托。",
    };
  } else if (state.autonomy === "chop") {
    fault = {
      code: "chop_sentence",
      tag: "腰斩主文",
      headline: "把正文第 2 段截成半句塞进插页，阅读流硬生生断了",
      why: "插页必须承载「抽出来也能独立读懂」的完整单元（关键数据、案例、要点）。一旦把连续论述硬劈进插页，眼睛被迫来回跳读找主语，反倒增加负担。",
      hint: "点画布上的红色「腰斩正文」警示条，或把「内容自洽」切为「独立摘要」。",
    };
  } else if (state.autonomy === "wall") {
    fault = {
      code: "wall_of_text",
      tag: "插页塞满字",
      headline: "插页里塞进了密排细则，视觉放大器变成第二堵文字墙",
      why: "读者停下来看插页，预期是三五秒扫完一个硬核结论。如果二级纸上照样铺满小字密文，停顿感立刻变成压迫感，大家反而会直接跳过它。",
      hint: "把「内容自洽」切回「独立摘要」，只保留一条核心判断与两三行短要点。",
    };
  } else if (state.count === 2 && state.pairBalance === "equal") {
    fault = {
      code: "weak_focus",
      tag: "双卡抢戏",
      headline: "两张插页一样大、一样跳，视线在两头打转",
      why: "同时出现两层插页时，必须像 155 原海报那样分出「浅衬夹 + 强焦卡」的主次落差。两张高饱和等大卡片并列，焦点互相抵消。",
      hint: "点按「已开：双卡抢戏」恢复主次阶梯，或精简为「1 张单焦」。",
    };
  }

  // 达标时的分类赞语（支持多组合法解）
  let passHeadline = "";
  let passWhy = "";
  if (!fault) {
    if (state.count === 2 && state.stock === "citrine" && state.anchor === "pocket") {
      passHeadline = `原海报式双层阶梯成局（露出 ${exposurePct}% · 净留底页 ${hostVisiblePct}%）`;
      passWhy = "浅薄荷指抠衬夹先立出前后层级，柠檬黄焦卡从深青袋口抽出形成清晰视觉刹车；底页两栏保持完整脉络，抽离插页正文照样通顺。";
    } else if (state.stock === "vellum") {
      passHeadline = `硫酸纸半透轻叠成局（露出 ${exposurePct}% · 净留底页 ${hostVisiblePct}%）`;
      passWhy = "半透薄荷硫酸纸既制造了清晰的材质转折与纸缘投影，又隐约透出底层正文肌理，适合建筑、画册与需要保留画面呼吸感的长篇专题。";
    } else if (state.stock === "navy") {
      passHeadline = `深藏青反色厚卡成局（露出 ${exposurePct}% · 净留底页 ${hostVisiblePct}%）`;
      passWhy = "深海藏青反色卡在冷白底页上形成最干脆的明暗翻转，单张短幅锁在订口或袋口，让关键数字与核心判断在三秒内落入记忆点。";
    } else {
      passHeadline = `短幅单页插页成局（露出 ${exposurePct}% · 净留底页 ${hostVisiblePct}%）`;
      passWhy = "单张异质特种纸卡稳落在 24%–56% 露出甜区，与底页拉开清晰材质和投影层差，且卡片内容独立自洽，实现了「停得住、回得去」的阅读节奏。";
    }
  }

  // 停顿强度档位（绝不用假精确百分比）
  let brakeTier = "清晰刹车";
  if (state.count === 0) brakeTier = "无停顿";
  else if (state.count >= 3 || (state.count === 2 && state.pairBalance === "equal")) brakeTier = "焦点溃散";
  else if (state.exposure > 0.56 || coveragePct > 58) brakeTier = "过度阻断";
  else if (state.stock === "flat" || state.exposure < 0.24) brakeTier = "感知过弱";
  else if (state.autonomy !== "clean") brakeTier = "打断失序";

  // 对应原海报左栏 5 条原则的实时状态徽
  const principles = [
    {
      key: "insert",
      title: "插入结构",
      en: "INSERT",
      body: "插入卡片或面板，增加信息承载层。",
      ok: state.count >= 1 && state.anchor !== "float" && state.autonomy !== "chop",
      badge:
        state.count === 0
          ? "无插页"
          : state.anchor === "float"
            ? "悬空脱锚"
            : state.autonomy === "chop"
              ? "腰斩正文"
              : state.anchor === "spine"
                ? "订口锚定"
                : "袋口咬合",
    },
    {
      key: "highlight",
      title: "内容强调",
      en: "HIGHLIGHT",
      body: "将关键信息置于插页，增强识别度。",
      ok: state.count >= 1 && state.stock !== "flat" && state.autonomy === "clean",
      badge:
        state.count === 0
          ? "未亮重点"
          : state.autonomy === "wall"
            ? "密字墙"
            : state.autonomy === "chop"
              ? "不独立"
              : state.stock === "flat"
                ? "缺反差"
                : "重点独立",
    },
    {
      key: "layering",
      title: "层次丰富",
      en: "LAYERING",
      body: "前后层叠关系，构建多维信息层级。",
      ok: state.count >= 1 && state.stock !== "flat" && coveragePct >= 18 && coveragePct <= 58,
      badge:
        state.count === 0
          ? "单层平面"
          : state.stock === "flat"
            ? "0 级失层"
            : coveragePct > 58
              ? `盖死 ${coveragePct}%`
              : `遮盖 ${coveragePct}%`,
    },
    {
      key: "interruption",
      title: "节奏打断",
      en: "INTERRUPTION",
      body: "打破连续阅读，制造停顿与思考点。",
      ok: state.count >= 1 && state.count <= 2 && state.exposure >= 0.24 && state.exposure <= 0.56,
      badge:
        state.count === 0
          ? "匀速平铺"
          : state.count >= 3
            ? `${state.count} 卡碎版`
            : state.exposure > 0.56
              ? `过宽 ${exposurePct}%`
              : state.exposure < 0.24
                ? `过窄 ${exposurePct}%`
                : `短幅 ${exposurePct}%`,
    },
    {
      key: "focus",
      title: "焦点聚合",
      en: "FOCUS",
      body: "聚焦视线，提升信息传达效率。",
      ok: rhythmOk && autonomyOk && materialOk && spanOk,
      badge:
        state.count >= 3
          ? "焦点溃散"
          : state.count === 2 && state.pairBalance === "equal"
            ? "双卡抢戏"
            : !fault
              ? "单焦收束"
              : "视线偏移",
    },
  ];

  return {
    layout,
    stock,
    checks,
    score,
    passed: score === 4,
    fault,
    headline: fault ? fault.headline : passHeadline,
    why: fault ? fault.why : passWhy,
    hint: fault ? fault.hint : "试试横向微调露出宽，或切换薄荷硫酸纸 / 深藏青厚卡，感受不同材质的合法解。",
    statusPill: fault ? `${score} / 4 · ${fault.tag}` : `4 / 4 · 插页成局`,
    brakeTier,
    principles,
  };
}

// 01 节四层纸卡分解数据（忠实还原 155 原海报）
export const ANATOMY_LAYERS = [
  {
    id: "host",
    no: "L0",
    name: "宿主页（底纸秩序）",
    en: "HOST SPREAD",
    quote: "要点提示：插页能在不打断版面整体性的前提下，有效承载重点内容。",
    note: "底层冷薄荷浅纸负责稳定阅读骨架：主标题、正文栏与阅读方向都在这一层锁定，哪怕抽走全部插页，底页结构也必须完整自足。",
    spec: "冷薄荷底 #ECF0F1 · 双栏主轴 · 保持 42%–80% 可见余量",
  },
  {
    id: "sleeve",
    no: "L1",
    name: "副衬夹（过渡缓冲）",
    en: "SECONDARY SLEEVE",
    quote: "设计思路：利用插入结构制造节奏变化，引导视线停留在关键信息上，强化信息的记忆点。",
    note: "半圆指抠文件夹与淡薄荷弧纹不和主角抢色，先在底页与主焦卡之间垫出一级台阶，把「平面」拉成可触摸的前后纵深。",
    spec: "浅薄荷夹 #E9EFED · 指抠缺口 + 斜线肌理 · 承上启下",
  },
  {
    id: "focus",
    no: "L2",
    name: "主焦插页（视觉放大器）",
    en: "PRIMARY INSERT",
    quote: "视觉焦点：插页天然形成视觉停顿，聚焦重点，突出层级。／灵活应用：可插入图表、案例、引用、提示框等。",
    note: "柠檬黄特种卡或带侧边索引耳的白卡直接亮出核心判断、数据或案例。体量克制、一眼可读，是全页真正让手指和目光停驻的记忆锚点。",
    spec: "柠檬黄 #ECDB2A / 索引耳 #ECDC40 · 建议露出 24%–56%（经验带）",
  },
  {
    id: "pocket",
    no: "L3",
    name: "深青袋口（物理锚定）",
    en: "ANCHOR POCKET",
    quote: "好的插页，不只是装饰，而是信息的放大器。插得恰当，读得深刻。",
    note: "深海藏青波浪袋口配薄荷半调点阵，从底部把几层纸张稳稳兜住——在印品里它对应书脊装订线，在网页里对应抽屉边缘锚定，防止插页漂成恼人弹窗。",
    spec: "深海藏青 #071731 / #122847 · 物理咬合边 · 杜绝无锚悬浮",
  },
];

// 02 节：12 页杂志插页间隔模拟（Von Restorff 稀缺边界模型，明确标「示意」）
export function simulatePacing(intervalPages) {
  const total = 12;
  const pages = [];
  let insertCount = 0;
  for (let i = 1; i <= total; i++) {
    const isInsert = intervalPages > 0 && i % intervalPages === 0;
    if (isInsert) insertCount++;
    pages.push({ page: i, isInsert });
  }
  const ratio = insertCount / total;
  let salienceTier = "最佳孤立峰";
  let verdict = "";
  let curve = [];

  if (intervalPages === 0) {
    salienceTier = "平直催眠（示意）";
    verdict = "整本 12 页零插页：每页长得一样，翻过第 4 页后注意力进入惯性滑行，读者合上书很难想起某一页具体讲了什么。";
    curve = [72, 66, 58, 52, 46, 43, 40, 38, 37, 36, 35, 34];
  } else if (intervalPages <= 2) {
    salienceTier = "稀缺失效（示意）";
    verdict = `每 ${intervalPages} 页就塞一张（共 ${insertCount} 张，占比 ${Math.round(ratio * 100)}%）：几乎翻一页撞一张，孤立对象变成了新的背景常态，冯·雷斯托夫孤立效应反被自己稀释掉了。`;
    curve = pages.map((p, idx) => (p.isInsert ? Math.max(44, 68 - idx * 2.1) : Math.max(32, 46 - idx * 1.2)));
  } else if (intervalPages <= 6) {
    salienceTier = "节奏鲜明（示意）";
    verdict = `每 ${intervalPages} 页安排 1 张（共 ${insertCount} 张，占比 ${Math.round(ratio * 100)}%）：连续阅读几页形成均匀底场后，异质纸页骤然打断惯性，注意力稳稳拉起高峰，翻过去后主文仍保持完整连贯。`;
    curve = pages.map((p, idx) => (p.isInsert ? 92 - Math.floor(idx / 6) * 4 : Math.max(44, 66 - (idx % intervalPages) * 5)));
  } else {
    salienceTier = "全册唯一高潮（示意）";
    verdict = `全册 12 页仅在收束处设 ${insertCount} 张重磅夹页：稀缺度拉满，适合画册精装彩版或年报总览折页；但前段连续十页仍需靠版面留白和小标维持节奏。`;
    curve = pages.map((p, idx) => (p.isInsert ? 96 : Math.max(38, 68 - idx * 2.8)));
  }
  return { pages, insertCount, ratio, salienceTier, verdict, curve };
}

// 03 节：四时代装订与版式由来（所有年份、刊名、人物均经联网核实）
export const HISTORY_ERAS = [
  {
    id: "tipin",
    year: "16–19 世纪",
    title: "手工刷胶贴页与薄护纸",
    en: "Tipped-in Plates & Tissue Guard",
    summary: "早期书籍正文走凸版活字，铜版雕刻、石版画或早期照相制版却必须换重磅铜版纸在另一台压印机上单独印制。装订工只能沿订口刷一条细胶把插图页粘进书帖（Tipped-in Plate），正面常再夹一张半透明防蹭墨薄纸（Tissue Guard）。",
    takeaway: "插页最初不是为了耍花招，而是被「不同印刷工艺与纸张互不相容」逼出来的实体分层。",
    diagram: "tipin",
  },
  {
    id: "verve",
    year: "1893 / 1937",
    title: "《The Studio》与《Verve》的艺术彩版",
    en: "Editorial Craft as Sensory Rhythm",
    summary: "1893 年 Charles Holme 在伦敦创办《The Studio》，常将独立彩版粘贴在异色衬纸上编入正文；1937 年 Tériade 在巴黎推出《Verve》，直接将马蒂斯、毕加索等人的原版石版插页装订成册，让纸张克重与质感的骤变成为翻阅时的策展节奏。",
    takeaway: "工艺限制被艺术总监反手用成武器：手摸到换纸的那一秒，大脑就知道「高光章节到了」。",
    diagram: "verve",
  },
  {
    id: "colors",
    year: "1991 起",
    title: "《Colors》与当代短幅特种纸夹页",
    en: "Short-Leaf Stock Shifts in Print",
    summary: "1991 年由 Benetton 资助、摄影师 Oliviero Toscani 与创刊主编兼设计总监 Tibor Kalman 共同推出的《Colors》杂志，主动在同一期里混用铜版纸、粗糙新闻纸、拉页折页与异形插页，把物理纸材变化变成概念表达。同期商业期刊也把裁窄 20–30 mm 的独立案例卡当作固定版式文法。",
    takeaway: "裁短开本让底层页面边缘始终露在外面——读者不用翻回去，一眼就知道自己还处在哪一章。",
    diagram: "colors",
  },
  {
    id: "web",
    year: "现代网页",
    title: "HTML <aside> 与数字叠层插卡",
    en: "Semantic Separation on Screen",
    summary: "屏幕没有纸张厚度，但 WHATWG / W3C HTML 标准用 <aside> 元素延续了同一条契约：承载与周围正文间接相关、即使整块抽走主文依然通顺的补充单元——通过表面反差、克制投影与边缘抽屉，在平面玻璃上重建二级纸张。",
    takeaway: "好不好用不取决于影子画得多浓，而取决于「抽走它主文断不断、看一眼值不值得停」。",
    diagram: "web",
  },
];

// 04 节：纸上工艺 × 屏端转译对照
export const CRAFT_PAIRS = [
  {
    id: "short",
    label: "短幅裁窄",
    printTitle: "单页裁窄 20–30 mm（经验值）",
    printDesc: "把插页切得比主书宽少 15%–25%，合页时底层正文标题与页码自然外露，视觉与触觉同时提示「这是夹进来的二级纸」。",
    printRule: "紧靠书脊装订防脱落 · 满色边照旧外扩 3 mm 出血",
    screenTitle: "非满宽叠卡（露出 30%–52% 宽）",
    screenDesc: "绝不让插页铺满 100% 视口宽；故意在左/右或上下露出宿主正文的列边与段落，保留空间锚点。",
    screenCss: "width: clamp(260px, 42%, 440px); position: relative;",
  },
  {
    id: "stock",
    label: "换纸 / 硫酸纸",
    printTitle: "换色卡、升克重或夹半透硫酸纸",
    printDesc: "正文用 90g 哑粉纸，插页换 160g 柠檬黄特种卡或半透硫酸纸：指尖翻到厚纸时物理回弹自带停顿。",
    printRule: "同册纸种控制在 2–3 种内 · 避免过厚撑裂书脊",
    screenTitle: "色面反差 + 多级柔和投影（Z 阶）",
    screenDesc: "靠明确明度/色相翻转（如浅纸叠黄卡或深蓝反色卡）叠加自然投影模拟纸缘离地感，必要时用轻度半透显出底层肌理。",
    screenCss: "background: #ECDB2A; box-shadow: -8px 10px 26px rgb(7 23 49 / .22);",
  },
  {
    id: "tab",
    label: "索引耳 / 指抠口",
    printTitle: "模切凸耳（Index Tab）与半圆指抠",
    printDesc: "如 155 号原海报所示，在纸张右缘模切一枚高对比索引耳，或在顶边裁出半圆缺口，暗示可抓取、可翻抽的操作 affordance。",
    printRule: "凸耳宽出 8–12 mm · 模切圆角防翻阅卷边",
    screenTitle: "可抽拉边耳 + 键盘聚焦把手",
    screenDesc: "把实体索引耳转译成带清晰标签与焦点框的原生按钮/拖柄，既提示交互入口，又避免大面积遮盖正文。",
    screenCss: "button.insert-tab { min-height: 44px; outline-offset: 2px; }",
  },
];

// 05 节：什么时候别用插页（三处真实翻车现场对照）
export const ANTI_CASES = [
  {
    id: "contract",
    label: "法律条文 / 操作步骤",
    badTitle: "错用插页：切断线性推演",
    badNote: "合同第 4 条写到违约金计算公式时，中间硬插一张反色提示卡——读者的逻辑链当场断裂，还容易漏看紧跟在卡片后面的免责但书。",
    goodTitle: "改用正途：顺序分段 + 轻量边注",
    goodNote: "强线性、高严谨文本不该中途制造叠层打断；补充解释改放到文末附录或改用同层不打断主线的边注版式（157）。",
  },
  {
    id: "mobile",
    label: "375px 窄屏手机正文",
    badTitle: "错用插页：退化成遮屏广告弹窗",
    badNote: "在 375px 宽的手机屏上硬学杂志左右叠压插页，卡片直接盖住一半字行，用户以为弹了推广窗，第一反应是找关闭按钮。",
    goodTitle: "改用正途：段间异色嵌卡或可收折抽屉",
    goodNote: "窄屏下取消横向叠压，把二级纸张顺流嵌在两段之间，用纸色差与顶底细线维持「停顿而不遮字」的效果。",
  },
  {
    id: "compare",
    label: "多方案参数逐行对比",
    badTitle: "错用插页：盖住参照物没法比",
    badNote: "把「方案 B 优势」做成叠压插页盖在参数表上——用户想核对方案 A 和 B 的同一行指标时，被迫不停开关卡片。",
    goodTitle: "改用正途：平层并排对照（区块/侧栏）",
    goodNote: "需要同时对照两组数据时，所有内容必须处在同一视觉平面，改用 154 区块式版式或 156 侧栏版式并排陈列。",
  },
];

// 06 节：练习题（四选项只差一个变量，标签绝对中性）
export const QUIZ_ITEMS = {
  A: {
    id: "A",
    correct: false,
    tag: "缺失层级反差",
    reason: "A 版宽度和内容独立性都对，但插页用了和底页完全一样的白纸且零投影，只剩一圈 1px 细灰边——视线扫过去把它当成普通文内小框，制造不出「二级纸张」的叠层停顿。",
  },
  B: {
    id: "B",
    correct: false,
    tag: "遮盖过满喧宾夺主",
    reason: "B 版纸色反差够强、数据也独立，但卡片一口气拉宽到 82%，把底层两栏正文几乎盖死。读者看完数据回到原文时找不到接续行，整体阅读脉络被压碎了。",
  },
  C: {
    id: "C",
    correct: true,
    tag: "四维齐备（正解）",
    reason: "选对了！C 版把柠檬黄特种卡控制在 40% 短幅露出，纸缘柔和投影拉出明确 Z 层；卡片里只装独立完整的三项改造成本指标，底层两栏正文完整连贯——既让重点跳出来，又不割裂主文。",
  },
  D: {
    id: "D",
    correct: false,
    tag: "内容不自洽、腰斩主文",
    reason: "D 版的纸色、投影和 40% 短幅都恰到好处，唯独犯了大忌：它把正文第 2 段后半截句子硬剪下来塞进插页。单看插页不知所云，读正文又被迫中途跳读，违背了「抽走插页正文仍通顺」的底线。",
  },
};
