// 333 藏露关系构图 · 单真源几何与感知模型
// 拱形漏窗、遮片几何、焦点/干扰区域与 48×48 实测采样均在此统一定义，
// Canvas 绘制与页面所有读数、诊单、三阶链路、五枚关键词状态全部只读此模型。

export const SCENES = {
  mountain: {
    id: "mountain",
    label: "雪峰云海",
    tag: "原海报主景",
    subjectName: "雪峰主尖",
    clutterName: "山脚碎石与底坡",
    hintFeature: "峰脊斜线与云腰切口",
    focalBox: { u0: 0.34, u1: 0.76, v0: 0.16, v1: 0.45 },
    clutterBox: { u0: 0.08, u1: 0.90, v0: 0.62, v1: 0.98 },
    keyTip: "山欲高，尽出之则不高；锁住杂乱山脚、托出亮白峰尖，高度与纵深才会同时出来。",
  },
  moon: {
    id: "moon",
    label: "寒月弧坡",
    tag: "自然风光海报",
    subjectName: "月牙与蓝夜天际",
    clutterName: "低处杂乱屋脊与坡脚",
    hintFeature: "大弧山脊切出的弯月",
    focalBox: { u0: 0.48, u1: 0.80, v0: 0.22, v1: 0.50 },
    clutterBox: { u0: 0.06, u1: 0.88, v0: 0.58, v1: 0.98 },
    keyTip: "大块暗黑弧坡压住地面杂景，只让一弯白月在钴蓝夜空里亮出来，视线无处可逃。",
  },
  letter: {
    id: "letter",
    label: "截切字母 A",
    tag: "字体设计",
    subjectName: "A 字顶角与横梁交口",
    clutterName: "冗余底脚与下缘空地",
    hintFeature: "背光勾出的三角尖顶与横杠",
    focalBox: { u0: 0.28, u1: 0.72, v0: 0.18, v1: 0.56 },
    clutterBox: { u0: 0.08, u1: 0.90, v0: 0.68, v1: 0.98 },
    keyTip: "截切字体的命门在结构拐点：切掉底脚仍一眼认出 A；一旦盖住横梁和顶角，字形就垮成无意义斜条。",
  },
  bottle: {
    id: "bottle",
    label: "暗影瓶身",
    tag: "产品展示",
    subjectName: "瓶颈与蓝光肩线",
    clutterName: "沉重瓶底与桌面暗面",
    hintFeature: "电光蓝逆光勾勒的肩弧",
    focalBox: { u0: 0.34, u1: 0.72, v0: 0.18, v1: 0.52 },
    clutterBox: { u0: 0.10, u1: 0.90, v0: 0.60, v1: 0.98 },
    keyTip: "高级产品照从不急着照亮每一毫米：遮住厚重瓶身，只留一道干净肩线轮廓光，期待感立刻拉满。",
  },
};

export const MASK_SHAPES = {
  arc: { id: "arc", label: "弧幕掩映", en: "ARC VEIL" },
  slash: { id: "slash", label: "斜切暗帘", en: "DIAGONAL SLIT" },
  aperture: { id: "aperture", label: "漏窗框景", en: "MOON GATE" },
};

export const PLACEMENTS = {
  guard: { id: "guard", label: "护焦避让", note: "藏下露上" },
  waist: { id: "waist", label: "锁腰留顶", note: "云霞+弧幕" },
  crush: { id: "crush", label: "压焦误遮", note: "反盖要害" },
  bisect: { id: "bisect", label: "中线死切", note: "垂直对劈" },
};

// 开场刻意停在「全盘直露」错态：弧幕退缩在右下角边沿、云腰散尽，显露约 90%
export const INITIAL_STATE = Object.freeze({
  scene: "mountain",
  maskShape: "arc",
  placement: "guard",
  cover: 0.18,
  mist: 0.0,
  xray: false,
});

// 多组合法解与试错预设
export const PRESETS = {
  classic: {
    label: "原海报经典解",
    kind: "good",
    patch: { maskShape: "arc", placement: "waist", cover: 0.56, mist: 0.54, xray: false },
  },
  mystery: {
    label: "深藏留悬解",
    kind: "good",
    patch: { maskShape: "slash", placement: "guard", cover: 0.67, mist: 0.18, xray: false },
  },
  bright: {
    label: "漏窗明朗解",
    kind: "good",
    patch: { maskShape: "aperture", placement: "guard", cover: 0.44, mist: 0.2, xray: false },
  },
  errExpose: {
    label: "试错：全盘直露",
    kind: "bad",
    patch: { maskShape: "arc", placement: "guard", cover: 0.18, mist: 0.0, xray: false },
  },
  errWrongSpot: {
    label: "试错：遮错要害",
    kind: "bad",
    patch: { maskShape: "arc", placement: "crush", cover: 0.56, mist: 0.15, xray: false },
  },
  errBlackout: {
    label: "试错：过度死遮",
    kind: "bad",
    patch: { maskShape: "arc", placement: "guard", cover: 0.89, mist: 0.4, xray: false },
  },
  errBisect: {
    label: "试错：中线死切",
    kind: "bad",
    patch: { maskShape: "slash", placement: "bisect", cover: 0.52, mist: 0.0, xray: false },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 333 原海报招牌的非对称拱形画窗边界：u, v ∈ [0, 1]
// 上方为拱形圆顶，左壁微斜向外展，右壁挺直垂落，与原海报雪峰窗口 1:1 呼应。
export function archBoundsAt(v) {
  if (v < 0.03 || v > 0.99) return null;
  const archTop = 0.03;
  const archSplit = 0.34;
  const rightWall = 0.89;
  const leftAtSplit = 0.16;
  const leftAtBottom = 0.05;
  if (v >= archSplit) {
    const t = (v - archSplit) / (0.99 - archSplit);
    const left = leftAtSplit + (leftAtBottom - leftAtSplit) * t;
    return [left, rightWall];
  }
  const cy = archSplit;
  const ry = archSplit - archTop;
  const cx = (leftAtSplit + rightWall) * 0.5;
  const rx = (rightWall - leftAtSplit) * 0.5;
  const dy = (v - cy) / ry;
  const disc = 1 - dy * dy;
  if (disc <= 0) return null;
  const dx = Math.sqrt(disc) * rx;
  return [cx - dx, cx + dx];
}

export function inArch(u, v) {
  const b = archBoundsAt(v);
  return b !== null && u >= b[0] && u <= b[1];
}

// 计算当前主前景遮片的解析几何参数（Canvas 绘制与栅格采样共用）
export function getOccluderGeom(state) {
  const c = clamp(state.cover, 0, 1);
  const { maskShape, placement } = state;

  if (placement === "bisect") {
    // 笔直垂直中线劈开焦点正中
    const xLine = 0.52 + (0.5 - c) * 0.28;
    return { kind: "bisect", xLine };
  }

  if (maskShape === "arc") {
    if (placement === "crush") {
      // 反盖上方焦点区：大圆弧从右上/顶侧倒压下来吞掉雪峰尖顶/月牙/A 梁/瓶肩
      const cx = 0.62;
      const cy = -0.14 + c * 0.42;
      const r = 0.14 + c * 0.66;
      return { kind: "arc", cx, cy, r, inverted: true };
    }
    // 标准护焦/锁腰：1:1 原海报右下 sweeping 大黑圆弧，向上左推进吃掉山脚杂景
    const cx = 0.94 - c * 0.12;
    const cy = 1.09 - c * 0.16;
    const r = 0.18 + c * 0.74;
    return { kind: "arc", cx, cy, r, inverted: false };
  }

  if (maskShape === "slash") {
    if (placement === "crush") {
      // 斜帘从左上压向焦点上方
      const offset = -0.12 + c * 0.98;
      return { kind: "slash", nx: -0.44, ny: -0.90, threshold: -offset, inverted: true };
    }
    // 原海报「露」字与产品图同款斜切暗幕：右下往左上斜扫
    // 判定：nx*u + ny*v >= threshold 时被遮挡
    const threshold = 1.48 - c * 1.12;
    return { kind: "slash", nx: 0.58, ny: 0.81, threshold, inverted: false };
  }

  // maskShape === "aperture"：中式园林月洞/漏窗，框外皆藏、孔内显露
  const r = clamp(0.64 - c * 0.46, 0.12, 0.68);
  const cx = placement === "crush" ? 0.48 : 0.53;
  const cy = placement === "crush" ? 0.74 : 0.34;
  return { kind: "aperture", cx, cy, r, inverted: placement === "crush" };
}

// 辅助云岚/腰带雾遮挡（在锁腰模式或手动调高 mist 时生效，软遮中下段）
export function getMistBand(state) {
  const m = clamp(state.mist, 0, 1);
  if (m <= 0.02) return null;
  const centerV = state.placement === "crush" ? 0.30 : 0.56;
  const halfH = 0.05 + m * 0.15;
  return { centerV, halfH, strength: m };
}

// 判断拱窗内一点 (u, v) 是否被前景硬遮挡
export function isHardOccluded(u, v, geom) {
  if (geom.kind === "arc") {
    const dx = u - geom.cx;
    const dy = (v - geom.cy) * 1.18; // 匹配拱窗竖长画幅比例
    return dx * dx + dy * dy <= geom.r * geom.r;
  }
  if (geom.kind === "slash") {
    const dot = geom.nx * u + geom.ny * v;
    return dot >= geom.threshold;
  }
  if (geom.kind === "bisect") {
    return u <= geom.xLine;
  }
  if (geom.kind === "aperture") {
    const dx = u - geom.cx;
    const dy = (v - geom.cy) * 1.16;
    return dx * dx + dy * dy >= geom.r * geom.r;
  }
  return false;
}

// 48×48 预生成采样坐标（零运行时数组分配）
const GRID_N = 48;
const SAMPLES = [];
for (let j = 0; j < GRID_N; j++) {
  const v = (j + 0.5) / GRID_N;
  for (let i = 0; i < GRID_N; i++) {
    const u = (i + 0.5) / GRID_N;
    if (inArch(u, v)) SAMPLES.push([u, v]);
  }
}

function inBox(u, v, b) {
  return u >= b.u0 && u <= b.u1 && v >= b.v0 && v <= b.v1;
}

// 单真源全面核算：基于实际绘制几何输出全部百分比、错态分类、三阶状态、五关键词状态与白话诊断
export function evaluate(state) {
  const scene = SCENES[state.scene] || SCENES.mountain;
  const geom = getOccluderGeom(state);
  const mist = getMistBand(state);

  let total = 0;
  let visibleWeight = 0;
  let hardOccludedCount = 0;

  let focalTotal = 0;
  let focalVisible = 0;

  let clutterTotal = 0;
  let clutterHidden = 0;

  let boundaryHits = 0;

  for (let k = 0; k < SAMPLES.length; k++) {
    const [u, v] = SAMPLES[k];
    total++;
    const hard = isHardOccluded(u, v, geom);
    let mistFactor = 0;
    if (!hard && mist) {
      const dist = Math.abs(v - mist.centerV);
      if (dist < mist.halfH) {
        mistFactor = Math.cos((dist / mist.halfH) * Math.PI * 0.5) * mist.strength * 0.82;
      }
    }
    const vis = hard ? 0 : clamp(1 - mistFactor, 0, 1);
    visibleWeight += vis;
    if (hard) hardOccludedCount++;

    if (inBox(u, v, scene.focalBox)) {
      focalTotal++;
      focalVisible += vis;
    }
    if (inBox(u, v, scene.clutterBox)) {
      clutterTotal++;
      clutterHidden += 1 - vis;
    }
    // 统计遮片边缘是否穿过画面中段以产生 T 形交点线索
    if (u > 0.16 && u < 0.84 && v > 0.22 && v < 0.82) {
      const rightHard = isHardOccluded(u + 0.022, v, geom);
      const downHard = isHardOccluded(u, v + 0.022, geom);
      if (hard !== rightHard || hard !== downHard) boundaryHits++;
    }
  }

  const revealPct = Math.round((visibleWeight / Math.max(1, total)) * 100);
  const concealPct = 100 - revealPct;
  const hardOccPct = Math.round((hardOccludedCount / Math.max(1, total)) * 100);
  const focalExposedPct = Math.round((focalVisible / Math.max(1, focalTotal)) * 100);
  const clutterHiddenPct = Math.round((clutterHidden / Math.max(1, clutterTotal)) * 100);
  const hasTJunction = boundaryHits >= 10 && hardOccPct >= 14 && hardOccPct <= 84;
  const depthPlanes = hardOccPct < 15 ? 1 : (mist && mist.strength >= 0.28 ? 3 : 2);

  // 6 类真实双向错态 + 3 组合法得法态
  let code = "balanced";
  let status = "pass";
  let badge = "藏露得法";
  let headline = "";
  let reason = "";
  let action = "";
  let fixPreset = null;
  let fixLabel = "";

  if (state.placement === "bisect") {
    code = "bisect";
    status = "error";
    badge = "中线死切";
    headline = `垂直切线正劈过${scene.subjectName}，画面断成僵硬两半`;
    reason = `当前虽遮去 ${concealPct}%、露出 ${revealPct}%，但硬直中线把${scene.subjectName}生硬剖半，既没有斜势引导，也让边缘失去顺势延续的「暗示」感。`;
    action = "把落点切回「护焦避让」或「锁腰留顶」，让弧幕或斜帘顺着形体势头遮掩。";
    fixPreset = "classic";
    fixLabel = "切回弧幕锁腰";
  } else if (revealPct < 24) {
    code = "blackout";
    status = "error";
    badge = "过度死遮";
    headline = `显露仅剩 ${revealPct}%，暗幕吞掉了识别线索`;
    reason = `遮挡推进到了 ${concealPct}%，${scene.subjectName}只剩 ${focalExposedPct}% 露在外面。线索一旦跌破辨识底线，大脑触发不了「非模态补全」，悬念就塌成了漆黑谜语。`;
    action = "向右拖回画布，把显露率拉回 30%–60% 区间，重新露出关键轮廓。";
    fixPreset = "classic";
    fixLabel = "退回原海报经典露幅";
  } else if (focalExposedPct < 45) {
    code = "wrong_spot";
    status = "error";
    badge = "遮错要害";
    headline = `总显露 ${revealPct}% 看似合规，却盖住了${scene.subjectName}`;
    reason = `藏露不是机械凑百分比：此刻${scene.subjectName}被压得只剩 ${focalExposedPct}%，反把${scene.clutterName}晾在外面——这是最容易踩的「藏主露次」反例。`;
    action = "把落点切回「护焦避让」或「锁腰留顶」，先决定遮住次要杂景，再把要害托出来。";
    fixPreset = "classic";
    fixLabel = "改遮次要、托出要害";
  } else if (revealPct > 68 && clutterHiddenPct < 42) {
    code = "over_expose";
    status = "error";
    badge = "全盘直露";
    headline = `显露高达 ${revealPct}%，一切摊平毫无纵深与悬念`;
    reason = `前景暗幕退在边角，${scene.clutterName}几乎全盘露出（仅遮去 ${clutterHiddenPct}%）。北宋郭熙说「山欲高，尽出之则不高」——所有信息一次交代完，眼睛扫一眼就走，留不下想象余地。`;
    action = "在画布上向左拖动推入前景暗幕，或拉动旁边的滑轨把显露率收进 30%–60%。";
    fixPreset = "classic";
    fixLabel = "推入暗幕到原海报构图";
  } else if (state.mist >= 0.72 && hardOccPct >= 52 && revealPct <= 31) {
    code = "choked";
    status = "error";
    badge = "双幕夹窒";
    headline = `前景暗幕与中段云岚同时收死，只剩 ${revealPct}% 狭缝`;
    reason = `前景硬遮 ${hardOccPct}% 又叠加厚重云岚，呼吸空间被上下双幕掐紧，留白感消失，画面变得沉闷局促。`;
    action = "放薄一点云岚，或微退前景暗幕，留出能喘气的暗空与蓝天。";
    fixPreset = "classic";
    fixLabel = "舒展双幕留白";
  } else if (revealPct > 60 || clutterHiddenPct < 44) {
    code = "timid";
    status = "warn";
    badge = "半藏不藏";
    headline = `显露 ${revealPct}% 仍偏满，暗幕只是擦边挡了一下`;
    reason = `遮挡只吃掉 ${clutterHiddenPct}% 的${scene.clutterName}，像是无意蹭到镜头边缘，前后层次还没真正拉开，也没进入原海报建议的 30%–60% 黄金带。`;
    action = "继续向左推进暗幕，果断切掉更多次要底部，让主焦点被干净托起。";
    fixPreset = "classic";
    fixLabel = "推进至 30%–60% 区间";
  } else {
    // 合法多解细分：深藏留悬解 / 原海报经典解 / 轻遮明朗解
    status = "pass";
    if (revealPct <= 38) {
      code = "pass_mystery";
      badge = "深藏留悬 · 成立";
      headline = `藏 ${concealPct}% 露 ${revealPct}%：强悬念的极简留白构图`;
      reason = `大面积暗幕果断屏蔽 ${clutterHiddenPct}% 的${scene.clutterName}，同时保住 ${focalExposedPct}% 的${scene.subjectName}。大脑借着${scene.hintFeature}自动补全隐去部分，神秘与高级感极强。`;
      action = "按住或点开「X-Ray 透视暗幕」，看看你藏掉的那一大半是如何靠脑补成立的。";
    } else if (revealPct >= 52) {
      code = "pass_bright";
      badge = "轻遮明朗 · 成立";
      headline = `藏 ${concealPct}% 露 ${revealPct}%：兼顾辨识与层次的明朗解`;
      reason = `${scene.subjectName}暴露度达 ${focalExposedPct}%，次要杂景已被收去 ${clutterHiddenPct}%，前后 ${depthPlanes} 层空间分明，适合信息清晰度优先的封面与产品首图。`;
      action = "试着再向左多推一点，体会悬念从「明朗」滑向「深邃」的临界点。";
    } else {
      code = "pass_classic";
      badge = "藏露平衡 · 成立";
      headline = `藏 ${concealPct}% 露 ${revealPct}%：落入 30%–60% 经典张力区`;
      reason = `${scene.clutterName}被稳妥藏去 ${clutterHiddenPct}%，${scene.subjectName}保留 ${focalExposedPct}% 关键轮廓，${depthPlanes} 层前后纵深与 T 形截断线索齐备——${scene.keyTip}`;
      action = "试试切换「压焦误遮」或继续猛推过 76%，验证为什么同样是藏，藏错位置或藏过头立刻失效。";
    }
  }

  // 原海报「核心原理」三阶链路实时判定（遮挡 → 显露 → 暗示）
  const stepConceal = {
    ok: clutterHiddenPct >= 46 && concealPct >= 35 && concealPct <= 76,
    state: concealPct < 35 ? "偏弱" : concealPct > 76 ? "过死" : clutterHiddenPct < 46 ? "遮错位" : `已藏 ${concealPct}%`,
  };
  const stepReveal = {
    ok: focalExposedPct >= 58 && revealPct >= 24 && revealPct <= 64,
    state: focalExposedPct < 58 ? "要害受压" : revealPct > 64 ? "无主次" : `焦点 ${focalExposedPct}%`,
  };
  const stepHint = {
    ok: hasTJunction && status === "pass",
    state: state.placement === "bisect" ? "生硬对劈" : !hasTJunction ? "缺截断线索" : status === "pass" ? "脑补成立" : "线索偏弱",
  };

  // 原海报五枚「设计关键词」实时评估（示意档位，绝不假精确）
  const keywords = {
    focus: focalExposedPct >= 62 && clutterHiddenPct >= 50 ? "锁定" : focalExposedPct < 45 ? "被压" : "发散",
    mystery: status === "pass" ? (revealPct <= 42 ? "深邃" : "适中") : revealPct > 65 ? "直白" : "成谜",
    depth: depthPlanes === 3 ? "三层纵深" : depthPlanes === 2 ? "两层前后" : "单层塌平",
    rhythm: status === "pass" ? `藏${concealPct}/露${revealPct}` : "失衡",
    space: revealPct >= 28 && revealPct <= 58 && status === "pass" ? "有余地" : revealPct > 66 ? "塞满" : "偏窒",
  };

  // 张力定性档位（遵守 BRIEF：示意不伪造测量精度）
  const tensionTier =
    status === "pass"
      ? revealPct <= 40
        ? "高悬念（示意）"
        : "平衡耐看（示意）"
      : code === "over_expose"
        ? "平淡无悬（示意）"
        : code === "wrong_spot"
          ? "焦次倒置（示意）"
          : code === "blackout"
            ? "线索断裂（示意）"
            : "生硬失衡（示意）";

  return {
    scene,
    geom,
    mist,
    revealPct,
    concealPct,
    hardOccPct,
    focalExposedPct,
    clutterHiddenPct,
    depthPlanes,
    hasTJunction,
    code,
    status,
    badge,
    headline,
    reason,
    action,
    fixPreset,
    fixLabel,
    tensionTier,
    steps: { conceal: stepConceal, reveal: stepReveal, hint: stepHint },
    keywords,
  };
}
