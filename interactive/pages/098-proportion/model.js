// 098 比例 PROPORTION — 单真源几何与比例评估引擎
// 画布绘制、卡尺数字、左侧五枚几何探针、底部灯泡诊单与四栏关键词全部只读此文件算出的结果。

export const PHI = (1 + Math.sqrt(5)) / 2; // 1.6180339887...
export const SQRT2 = Math.SQRT2;           // 1.4142135623...

export const CONTEXTS = {
  poster: {
    id: "poster",
    label: "海报原型 · 几何构成",
    short: "原海报构成",
    hint: "承袭 098 原海报深青主块、灰青内切圆与 2:3 琥珀金焦点。",
  },
  book: {
    id: "book",
    label: "书籍跨页 · 版心留白",
    short: "书籍跨页",
    hint: "奇肖尔德传统书页体系：插图版心、正文栏与页边留白共守同一比例。",
  },
  ui: {
    id: "ui",
    label: "界面卡片 · 图文配比",
    short: "界面卡片",
    hint: "数字产品头图区、信息栏、主按钮与三级字阶沿同一模数缩放。",
  },
};

// 原海报底部 5 枚常用比例标本 + 主体黄金比例
export const SPECIMENS = [
  { id: "1:1", num: "1", label: "1 : 1", aspect: 1.0, split: 0.625, rhythm: 1.5, interval: "同度 · 1:1", feel: "端方稳重，需靠内部非对称分割建立主次", badge: "正方" },
  { id: "2:3", num: "2", label: "2 : 3", aspect: 1.5, split: 0.6, rhythm: 1.5, interval: "纯五度 · 3:2", feel: "传统书页与 35mm 画幅，从容而有延展感", badge: "经典书页", amber: true },
  { id: "3:4", num: "3", label: "3 : 4", aspect: 4 / 3, split: 0.571, rhythm: 1.333, interval: "纯四度 · 4:3", feel: "端稳克制，常见于展陈海报与平板屏幕", badge: "展陈画幅" },
  { id: "4:5", num: "4", label: "4 : 5", aspect: 1.25, split: 0.6, rhythm: 1.25, interval: "大三度 · 5:4", feel: "饱满亲近，常用于社媒信息卡与肖像画幅", badge: "社媒画幅" },
  { id: "5:8", num: "5", label: "5 : 8", aspect: 1.6, split: 0.625, rhythm: 1.6, interval: "小六度 · 8:5", feel: "整数中最贴近黄金比，便于网格切分", badge: "斐波那契" },
  { id: "phi", num: "φ", label: "1.618 : 1", aspect: PHI, split: 1 / PHI, rhythm: PHI, interval: "黄金比 · φ", feel: "切掉一个正方形后余形仍与原形相似", badge: "原海报主图" },
];

// 开场故意停在 0/4 四重失序状态：绝不先给答案
export const BROKEN_STATE = {
  context: "poster",
  frameAspect: 1.09,   // 夹生胖框：既不像 1:1 也不像 5:4
  split: 0.51,         // 51:49 近似对半切，主次含糊
  rhythm: 1.07,        // 三级尺寸几乎雷同，节奏死平
  marginPct: 0.03,     // 边距窒息
  accentScale: 0.78,   // 琥珀金焦点过胀顶边
  unified: false,      // 局部子模块与整体各算各的账
  showCheck: false,
  highlightProbe: null,
};

// 多组合法解（验证均由下方 evaluate 实算通过 4/4）
export const SOLUTIONS = {
  golden: {
    id: "golden",
    label: "黄金比例 1.618:1",
    patch: { frameAspect: PHI, split: 1 / PHI, rhythm: PHI, marginPct: 0.09, accentScale: 0.44, unified: true },
  },
  book: {
    id: "book",
    label: "纯五度书页 3:2",
    patch: { frameAspect: 1.5, split: 0.6, rhythm: 1.5, marginPct: 0.1, accentScale: 0.42, unified: true },
  },
  silver: {
    id: "silver",
    label: "白银纸张 √2:1",
    patch: { frameAspect: SQRT2, split: 1 / (1 + 1 / SQRT2), rhythm: SQRT2, marginPct: 0.095, accentScale: 0.4, unified: true },
  },
  classic: {
    id: "classic",
    label: "纯四度 4:3",
    patch: { frameAspect: 4 / 3, split: 4 / 7, rhythm: 4 / 3, marginPct: 0.09, accentScale: 0.44, unified: true },
  },
  square: {
    id: "square",
    label: "正方嵌套 1:1",
    patch: { frameAspect: 1.0, split: 0.625, rhythm: 1.5, marginPct: 0.1, accentScale: 0.38, unified: true },
  },
};

// 双向错态试错预设（涵盖过弱与过强两个方向）
export const FAULTS = {
  broken: { id: "broken", label: "开场四重失序", patch: { ...BROKEN_STATE } },
  crush: { id: "crush", label: "主块霸凌 5.7:1", patch: { frameAspect: PHI, split: 0.85, rhythm: 1.5, marginPct: 0.09, accentScale: 0.44, unified: true } },
  cliff: { id: "cliff", label: "级差断崖 2.95×", patch: { frameAspect: 1.5, split: 0.62, rhythm: 2.95, marginPct: 0.09, accentScale: 0.42, unified: true } },
  ribbon: { id: "ribbon", label: "过扁画幅 2.45:1", patch: { frameAspect: 2.45, split: 0.62, rhythm: 1.5, marginPct: 0.08, accentScale: 0.42, unified: true } },
  choke: { id: "choke", label: "顶边窒息", patch: { frameAspect: 1.5, split: 0.62, rhythm: 1.45, marginPct: 0.024, accentScale: 0.82, unified: true } },
  disunified: { id: "disunified", label: "局部系统分裂", patch: { frameAspect: PHI, split: 0.618, rhythm: 1.618, marginPct: 0.09, accentScale: 0.44, unified: false } },
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 把任意画幅比吸附到最接近的已知经典比例名（仅用于展示识别，不篡改实测值）
export function identifyRatio(r) {
  const candidates = [
    { val: 1.0, name: "1 : 1 正方", interval: "同度" },
    { val: 1.25, name: "5 : 4 大三度", interval: "大三度" },
    { val: 4 / 3, name: "4 : 3 纯四度", interval: "纯四度" },
    { val: SQRT2, name: "√2 : 1 白银比", interval: "增四度 / A4" },
    { val: 1.5, name: "3 : 2 纯五度", interval: "纯五度" },
    { val: 1.6, name: "8 : 5 小六度", interval: "小六度" },
    { val: PHI, name: "1.618 : 1 黄金比", interval: "黄金分割 φ" },
    { val: 16 / 9, name: "16 : 9 宽银幕", interval: "小七度" },
    { val: 2.0, name: "2 : 1 双正方", interval: "八度" },
  ];
  let best = candidates[0];
  let minD = Math.abs(r - best.val);
  for (const c of candidates) {
    const d = Math.abs(r - c.val);
    if (d < minD) {
      minD = d;
      best = c;
    }
  }
  if (minD <= 0.032) return best;
  return { val: r, name: `${r.toFixed(2)} : 1 自定义`, interval: "自由比例" };
}

// 核心单真源几何计算：在 w × h 的画布坐标系里算出全部实绘框体与卡尺点位
export function computeGeometry(state, w, h) {
  const compact = w < 540;
  const padL = compact ? 38 : 52;
  const padR = compact ? 18 : 26;
  const padT = compact ? 48 : 56;
  const padB = compact ? 108 : 34;

  const usableW = Math.max(180, w - padL - padR);
  const usableH = Math.max(160, h - padT - padB);

  // 宽屏左 67% 主卡尺画框 + 右 29% 节奏与嵌套验算区；窄屏主卡尺占上方主体，节奏验算条放底部
  const stageW = compact ? usableW : usableW * 0.67;
  const stageH = usableH;

  // 按 frameAspect 等比放进 stageW × stageH，绝不拉扁或变形
  const targetA = clamp(state.frameAspect, 0.85, 2.5);
  let fw = stageW * 0.94;
  let fh = fw / targetA;
  if (fh > stageH * 0.92) {
    fh = stageH * 0.92;
    fw = fh * targetA;
  }
  const fx = padL + (stageW - fw) * 0.5;
  const fy = padT + (stageH - fh) * 0.5;

  // 内边距由 marginPct 实算
  const m = clamp(state.marginPct, 0.02, 0.16) * Math.min(fw, fh);
  const ix = fx + m;
  const iy = fy + m;
  const iw = Math.max(40, fw - m * 2);
  const ih = Math.max(40, fh - m * 2);

  // 主次分割刀刃位置
  const split = clamp(state.split, 0.34, 0.88);
  const gutter = Math.max(4, Math.min(12, iw * 0.018));
  const majorW = (iw - gutter) * split;
  const minorW = (iw - gutter) * (1 - split);

  const majorRect = { x: ix, y: iy, w: majorW, h: ih };
  const minorRect = { x: ix + majorW + gutter, y: iy, w: minorW, h: ih };

  // 次区内嵌图形（原海报内切圆 / 书页栏 / 卡片图文）及琥珀金核心点
  const minorShort = Math.min(minorW, ih);
  const circleR = minorShort * 0.44;
  const circleCx = minorRect.x + minorRect.w * 0.5;
  const circleCy = minorRect.y + minorRect.h * 0.46;

  // 琥珀金焦点直径按 accentScale 相对于次区短边实算
  const accentD = minorShort * clamp(state.accentScale, 0.1, 0.88);
  const accentR = accentD * 0.5;
  const accentCx = minorRect.x + minorRect.w * 0.5;
  const accentCy = minorRect.y + minorRect.h * 0.5;

  // 局部嵌套子矩形（用于验证「整体统一」：开启统一锁时嵌套切分继承 split 与 frameAspect，关闭时故意使用失调的 0.27 杂乱切分）
  const innerCutRatio = state.unified ? split : 0.27;
  const subH = Math.min(majorRect.h * 0.52, Math.max(30, majorRect.h * (1 - innerCutRatio)));
  const subW = Math.min(majorRect.w * 0.56, Math.max(46, state.unified ? majorRect.w * (1 - split) : majorRect.w * 0.28));
  const subRect = {
    x: majorRect.x + majorRect.w - subW - 14,
    y: majorRect.y + majorRect.h - subH - 12,
    w: subW,
    h: subH,
  };

  // 右侧（或底部）三级节奏标本几何：严格按 rhythm 计算大/中/小三级真实长度
  const rhythm = clamp(state.rhythm, 1.02, 3.1);
  const panelRect = compact
    ? { x: padL - 12, y: h - 94, w: w - (padL - 12) - padR, h: 78 }
    : { x: padL + usableW * 0.71, y: fy, w: usableW * 0.29, h: fh };

  const barSmall = 1;
  const barMid = barSmall * rhythm;
  const barLarge = barMid * rhythm;
  const barNorm = [barLarge / barLarge, barMid / barLarge, barSmall / barLarge];

  // 对角线相似检尺几何（主画框对角线 vs 次区或子模块斜率）
  const frameSlope = fh / fw;
  const subAspect = subRect.w / Math.max(1, subRect.h);
  const targetSubAspect = state.frameAspect > 1.05 ? 1 / state.frameAspect : 1.0;

  return {
    compact,
    frame: { x: fx, y: fy, w: fw, h: fh, aspect: fw / fh },
    inner: { x: ix, y: iy, w: iw, h: ih, margin: m, marginRatio: m / Math.min(fw, fh) },
    bladeX: ix + majorW + gutter * 0.5,
    gutter,
    major: majorRect,
    minor: minorRect,
    circle: { cx: circleCx, cy: circleCy, r: circleR },
    accent: { cx: accentCx, cy: accentCy, r: accentR, diameter: accentD },
    sub: subRect,
    panel: panelRect,
    bars: barNorm,
    handles: {
      blade: { x: ix + majorW + gutter * 0.5, y: iy + ih * 0.5 },
      corner: { x: fx + fw, y: fy + fh },
    },
    metrics: {
      frameAspect: fw / fh,
      partRatio: majorW / Math.max(1, minorW), // 实测主:次比
      majorShare: majorW / Math.max(1, majorW + minorW),
      minorShare: minorW / Math.max(1, majorW + minorW),
      marginRatio: m / Math.min(fw, fh),
      accentFill: accentD / Math.max(1, minorShort),
      rhythmStep: rhythm,
      frameSlope,
      subAspect,
      targetSubAspect,
    },
  };
}

// 单真源比例审计：严格从实绘几何 computeGeometry 计算，双向检出 9 类正反错态
export function evaluate(state) {
  const geo = computeGeometry(state, 900, 480);
  const { frameAspect, partRatio, majorShare, marginRatio, accentFill, rhythmStep } = geo.metrics;

  // 系统统一偏离度：比较主次比、节奏级差与画幅比（或 1:1 时的对称模数）的协同误差
  const refRatio = Math.abs(frameAspect - 1.0) <= 0.03 ? partRatio : frameAspect;
  const splitDev = Math.abs(partRatio - refRatio) / Math.max(1, refRatio);
  const rhythmDev = Math.abs(rhythmStep - refRatio) / Math.max(1, refRatio);
  const rawDrift = state.unified ? (splitDev * 0.55 + rhythmDev * 0.45) : Math.max(0.34, splitDev * 0.5 + 0.28);
  const unityDriftPct = Math.round(clamp(rawDrift, 0, 0.99) * 100);

  // 1. 关系主次（RELATIONSHIP）
  let relFault = null;
  if (partRatio >= 0.81 && partRatio <= 1.24) {
    relFault = {
      code: "near-split",
      short: `平切 ${partRatio.toFixed(2)}:1`,
      headline: `主次切在 ${Math.round(majorShare * 100)} : ${Math.round((1 - majorShare) * 100)}，两块势均力敌抢第一眼`,
      why: `当左右两块比值卡在 1.03:1 到 1.24:1 之间时，既不是庄重的 1:1 绝对对称，又没拉开足够的主次差。人眼会在两块相近的青色面积之间反复摇摆，分不清该先读哪一块。`,
      action: `向右横拖画布上的竖向卡尺（或把「主次分割」推到 57%–67%，约 1.33:1–2.0:1），让主区稳稳接管第一眼。`,
    };
  } else if (partRatio < 0.81) {
    relFault = {
      code: "inverted-split",
      short: `主次倒置 ${partRatio.toFixed(2)}:1`,
      headline: `主块被压得比次块还小（${Math.round(majorShare * 100)}%），视觉重心倒挂`,
      why: `深青主块本应承担画面主体，但现在反而退成窄栏，次区占据绝大部分面积，主次信号互相打架。`,
      action: `向右拖动卡尺回到 57%–68% 区间，恢复「主块领跑、次块呼应」的秩序。`,
    };
  } else if (partRatio > 3.6) {
    relFault = {
      code: "crushed-minor",
      short: `次区压扁 ${partRatio.toFixed(1)}:1`,
      headline: `主块霸占 ${Math.round(majorShare * 100)}%，次区已被挤成一条窄缝`,
      why: `主次不是把配角挤死。当主次比超过 3.6:1 时，次区的内切圆和说明文字被严重压缩，比例关系滑向极端尺度压迫（那属于 099 尺度对比的戏剧手段，不再是日常自然有序的比例）。`,
      action: `把主次卡尺往左回拉到 57%–70%（约 1.33:1–2.3:1），还给次区舒适的呼吸宽度。`,
    };
  }

  // 2. 尺寸呼吸（SIZE）
  let sizeFault = null;
  if (marginRatio < 0.052) {
    sizeFault = {
      code: "choked-margin",
      short: `边距仅 ${Math.round(marginRatio * 100)}%`,
      headline: `画幅留白被压到 ${Math.round(marginRatio * 100)}%，模块紧顶外框喘不过气`,
      why: `元素与外框的距离本身也是比例的一部分。留白低于 5% 时，色块边缘与纸框产生强烈粘连感，所有内部比例都被边框吞掉。`,
      action: `把「外框留白」拉到 7%–13%，同时点一下画布中偏胀的琥珀金圆点让它收缩到舒适尺寸。`,
    };
  } else if (accentFill > 0.68) {
    sizeFault = {
      code: "bloated-accent",
      short: `焦点过胀 ${Math.round(accentFill * 100)}%`,
      headline: `琥珀金核心膨胀至次区的 ${Math.round(accentFill * 100)}%，塞满边界`,
      why: `原海报 2:3 标本里的暖金圆之所以耐看，是因为它四周留有清晰缓冲带。撑满次区后，点缀色反客为主，尺寸层级崩溃。`,
      action: `直接点击画布里的琥珀金圆点（或把「核心尺度」调回 28%–56%），留出清晰环隙。`,
    };
  } else if (accentFill < 0.16) {
    sizeFault = {
      code: "tiny-accent",
      short: `焦点过小 ${Math.round(accentFill * 100)}%`,
      headline: `琥珀金核心缩到仅 ${Math.round(accentFill * 100)}%，像误落的噪点`,
      why: `在整体尺度里过小的点缀元素失去了视觉锚点功能，读者无法在扫视时察觉它与次区的呼应关系。`,
      action: `点击琥珀金圆点或把「核心尺度」拉回到 28%–56%。`,
    };
  }

  // 3. 节奏韵律（RHYTHM）
  let rhythmFault = null;
  if (rhythmStep < 1.22) {
    rhythmFault = {
      code: "monotone-rhythm",
      short: `平庸 ${rhythmStep.toFixed(2)}×`,
      headline: `三级尺度级差只有 ${rhythmStep.toFixed(2)}×，画面平铺没有起伏`,
      why: `大、中、小三阶模块相差不到两成时，眼睛感受不到韵律，只能看到一堆差不多大小的色块排成一排，难以形成阅读节奏。`,
      action: `点击节奏阶梯或把「节奏级差」推到 1.25×–1.85×（如 1.33× 纯四度或 1.62× 黄金比）。`,
    };
  } else if (rhythmStep > 2.35) {
    rhythmFault = {
      code: "jarring-leap",
      short: `断崖 ${rhythmStep.toFixed(2)}×`,
      headline: `节奏级差飙到 ${rhythmStep.toFixed(2)}×，大小之间出现断层`,
      why: `每跨一级就放大两倍多，第三级小模块只剩最大块的不到五分之一，节奏感碎成「巨人配微尘」，失去了过渡的流畅韵律。`,
      action: `把「节奏级差」收回到 1.25×–1.85×，让三级梯阶平滑衔接。`,
    };
  }

  // 4. 画幅协调与整体统一（HARMONY & UNITY）
  let unityFault = null;
  if (frameAspect > 1.03 && frameAspect < 1.15) {
    unityFault = {
      code: "awkward-frame",
      short: `夹生框 ${frameAspect.toFixed(2)}:1`,
      headline: `外框比例停在 ${frameAspect.toFixed(2)} : 1，像没画方正的正方形`,
      why: `1.04:1 到 1.14:1 是设计里最容易显「别扭」的夹生比例：人眼会先把它当正方形，随即发现横边多出一小截，产生「歪了」的错觉。`,
      action: `点下方标本架里任意一款经典画幅（如 1:1 正方、4:3、3:2 或 1.618:1），或拖动外框右下角柄脱离夹生区。`,
    };
  } else if (frameAspect > 2.25) {
    unityFault = {
      code: "extreme-ribbon",
      short: `过扁 ${frameAspect.toFixed(2)}:1`,
      headline: `画幅拉长到 ${frameAspect.toFixed(2)} : 1，常规模块被拉成细带`,
      why: `超过 2.25:1 的极扁画幅适合横幅标语，但在标准图文框里会迫使内切圆和主次区域比例失衡。`,
      action: `把画幅比例收回到 1.00:1 或 1.20:1–1.85:1 之间的常用区间。`,
    };
  } else if (!state.unified || unityDriftPct > 28) {
    unityFault = {
      code: "disunified-system",
      short: `偏离 ${unityDriftPct}%`,
      headline: state.unified
        ? `画幅、分割与节奏各自偏离 ${unityDriftPct}%，还没说同一种比例语言`
        : `局部嵌套与外框脱节（偏离 ${unityDriftPct}%），像拼凑出来的版面`,
      why: `比例最怕「外框一套、分割一套、字阶又是另一套」。局部和整体不共享相近倍数时，即便单看每一块都不差，合在一起依然散乱。`,
      action: state.unified
        ? `让主次分割与节奏级差靠近同一目标比值（或按 Space 打开对角检尺对比斜率）。`
        : `打开「比例统一锁」（或直接点击主块右下角虚线红框），让嵌套子模块继承主比例。`,
    };
  }

  const checks = [
    { key: "relationship", title: "关系", en: "RELATIONSHIP", ok: !relFault, badge: relFault ? relFault.short : `${partRatio.toFixed(2)}:1 主次清`, fault: relFault },
    { key: "size", title: "尺寸", en: "SIZE", ok: !sizeFault, badge: sizeFault ? sizeFault.short : `留白 ${Math.round(marginRatio * 100)}% · 呼吸佳`, fault: sizeFault },
    { key: "rhythm", title: "节奏", en: "RHYTHM", ok: !rhythmFault, badge: rhythmFault ? rhythmFault.short : `${rhythmStep.toFixed(2)}× 有韵律`, fault: rhythmFault },
    { key: "unity", title: "协调与统一", en: "HARMONY & UNITY", ok: !unityFault, badge: unityFault ? unityFault.short : `偏离 ${unityDriftPct}% · 共尺`, fault: unityFault },
  ];

  const passCount = checks.filter((c) => c.ok).length;
  const primaryFault = checks.find((c) => !c.ok)?.fault || null;
  const ratioInfo = identifyRatio(frameAspect);

  // 左侧原海报 5 枚探针各自独立状态（协调看画幅，统一看系统一致）
  const frameOk = !(frameAspect > 1.03 && frameAspect < 1.15) && frameAspect <= 2.25;
  const sysOk = state.unified && unityDriftPct <= 28;
  const probes = {
    relationship: { ok: !relFault, text: relFault ? relFault.short : `${partRatio.toFixed(2)} : 1` },
    size: { ok: !sizeFault, text: sizeFault ? sizeFault.short : `留白 ${Math.round(marginRatio * 100)}%` },
    rhythm: { ok: !rhythmFault, text: rhythmFault ? rhythmFault.short : `${rhythmStep.toFixed(2)}× 递进` },
    harmony: { ok: frameOk, text: frameOk ? ratioInfo.name.split(" ")[0] : (frameAspect > 2.25 ? `过扁 ${frameAspect.toFixed(2)}` : `夹生 ${frameAspect.toFixed(2)}`) },
    unity: { ok: sysOk, text: sysOk ? `同尺 ${100 - unityDriftPct}%` : `脱节 ${unityDriftPct}%` },
  };

  // 原海报底栏 4 关键词实时读数
  const keywords = [
    { zh: "突出重点", en: "EMPHASIZE", ok: !relFault, val: !relFault ? `主区 ${Math.round(majorShare * 100)}%` : relFault.short },
    { zh: "优化布局", en: "ORGANIZE", ok: !sizeFault, val: !sizeFault ? `留白 ${Math.round(marginRatio * 100)}%` : sizeFault.short },
    { zh: "提升美感", en: "ENHANCE", ok: !rhythmFault && frameOk, val: (!rhythmFault && frameOk) ? ratioInfo.interval : (rhythmFault ? rhythmFault.short : "画幅失调") },
    { zh: "传达秩序", en: "COMMUNICATE", ok: sysOk, val: sysOk ? `统一锁 · 开` : `分裂 ${unityDriftPct}%` },
  ];

  // 定性秩序档位（不造假精确百分比）
  let grade = "比例失序（示意）";
  if (passCount === 4) grade = "秩序自然成立（示意）";
  else if (passCount === 3) grade = "差临门一脚（示意）";
  else if (passCount >= 1) grade = "局部失调（示意）";

  const verdict = primaryFault
    ? {
        ok: false,
        tag: `${passCount}/4 · ${primaryFault.short}`,
        headline: primaryFault.headline,
        why: primaryFault.why,
        action: primaryFault.action,
      }
    : {
        ok: true,
        tag: `4/4 · ${ratioInfo.name}`,
        headline: `整幅版面已落入「${ratioInfo.name}」的有序比例`,
        why: `主区占 ${Math.round(majorShare * 100)}%（主次 ${partRatio.toFixed(2)}:1），三级节奏按 ${rhythmStep.toFixed(2)}× 递进，外框留白 ${Math.round(marginRatio * 100)}% 且嵌套子模块共享同一把尺子——视线自然先落主区、再滑向次区与琥珀金锚点。`,
        action: `试试点击下方其他比例标本（如 1:1、2:3、3:4 或 1.618:1），感受不同比例的气质切换，或按 Space 展开对角相似检尺验真。`,
      };

  return {
    geo,
    passCount,
    checks,
    probes,
    keywords,
    ratioInfo,
    unityDriftPct,
    grade,
    verdict,
  };
}
