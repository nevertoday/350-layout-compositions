// 010 运动空间 — 共享状态模型与评价逻辑
// 状态仅存归一化比例：u (0.10..0.90) 为主体在画框中的水平中心，dir (1 右 / -1 左)，speed (0..1)。

export const SUBJECTS = {
  runner: {
    id: "runner",
    label: "奔跑",
    en: "RUNNER",
    maxKmh: 36,
    halfW: 0.068,
    defaultSpeed: 0.62,
    unit: "km/h",
    paceText: (v) => (v < 0.12 ? "站定起跑" : v < 0.35 ? "慢跑热身" : v < 0.72 ? "中速奔跑" : "全力冲刺"),
  },
  cyclist: {
    id: "cyclist",
    label: "骑行",
    en: "CYCLIST",
    maxKmh: 62,
    halfW: 0.095,
    defaultSpeed: 0.68,
    unit: "km/h",
    paceText: (v) => (v < 0.12 ? "滑行起步" : v < 0.38 ? "巡航骑行" : v < 0.74 ? "拉扯提速" : "伏低冲线"),
  },
  car: {
    id: "car",
    label: "赛车",
    en: "RACE CAR",
    maxKmh: 280,
    halfW: 0.125,
    defaultSpeed: 0.78,
    unit: "km/h",
    paceText: (v) => (v < 0.12 ? "出弯起步" : v < 0.38 ? "城区行驶" : v < 0.72 ? "高速巡航" : "全油门极速"),
  },
  bird: {
    id: "bird",
    label: "飞鸟",
    en: "SWIFT",
    maxKmh: 110,
    halfW: 0.082,
    defaultSpeed: 0.56,
    unit: "km/h",
    paceText: (v) => (v < 0.12 ? "逆风悬停" : v < 0.38 ? "平缓滑翔" : v < 0.72 ? "振翅疾飞" : "收翼俯冲"),
  },
};

export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function kmhOf(state) {
  const s = SUBJECTS[state.subject] || SUBJECTS.runner;
  return Math.round(s.maxKmh * state.speed);
}

// 速度越快，推荐的前方留白越多：静止/极慢时约 46%，全力高速时约 68%
export function idealLead(speed) {
  return 0.44 + 0.24 * clamp(speed, 0, 1);
}

// 给定方向和速度，返回推荐的主体水平位置 u
export function idealU(dir, speed, subject = "runner") {
  const halfW = (SUBJECTS[subject] || SUBJECTS.runner).halfW;
  const lead = idealLead(speed);
  const raw = dir > 0 ? 1 - lead - halfW : lead + halfW;
  return clamp(raw, 0.16, 0.84);
}

// 推荐舒适区 [uMin, uMax]
export function sweetRange(dir, speed, subject = "runner") {
  const c = idealU(dir, speed, subject);
  const tol = 0.075;
  return [clamp(c - tol, 0.12, 0.88), clamp(c + tol, 0.12, 0.88)];
}

// 前方空间与后方空间（扣除主体自身宽度后的真实净留白）
export function spaces(state) {
  const halfW = (SUBJECTS[state.subject] || SUBJECTS.runner).halfW;
  const frontEdge = state.dir > 0 ? state.u + halfW : state.u - halfW;
  const backEdge = state.dir > 0 ? state.u - halfW : state.u + halfW;
  const lead = clamp(state.dir > 0 ? 1 - frontEdge : frontEdge, 0, 1);
  const trail = clamp(state.dir > 0 ? backEdge : 1 - backEdge, 0, 1);
  return { lead, trail, frontEdge, backEdge };
}

export const PRESETS = {
  ideal: (state) => ({
    u: idealU(state.dir, Math.max(state.speed, 0.55), state.subject),
    speed: Math.max(state.speed, 0.55),
  }),
  center: () => ({ u: 0.5 }),
  wall: (state) => {
    const halfW = (SUBJECTS[state.subject] || SUBJECTS.runner).halfW;
    return {
      u: state.dir > 0 ? clamp(0.95 - halfW, 0.72, 0.87) : clamp(0.05 + halfW, 0.13, 0.28),
      speed: Math.max(state.speed, 0.65),
    };
  },
  pan: (state) => ({
    u: state.dir > 0 ? 0.36 : 0.64,
    speed: 0.85,
  }),
};

const pct = (v) => `${Math.round(v * 100)}%`;

export function evaluate(state) {
  const { lead, trail } = spaces(state);
  const targetLead = idealLead(state.speed);
  const diff = lead - targetLead;
  const dirWord = state.dir > 0 ? "向右" : "向左";
  const sub = SUBJECTS[state.subject] || SUBJECTS.runner;
  const kmh = kmhOf(state);
  const pace = sub.paceText(state.speed);

  if (state.speed < 0.08) {
    return {
      kind: "still",
      tag: "几乎静止",
      tone: "neutral",
      lead,
      trail,
      targetLead,
      kmh,
      pace,
      dirWord,
      text: `主体几乎停在原地（${kmh} ${sub.unit}），运动向量很弱。把速度滑块往右推，再看前方空间怎么变得重要。`,
      note: "没有前进动势时，居中或按视线方向留白即可。",
    };
  }

  if (lead < 0.14) {
    return {
      kind: "wall",
      tag: "贴边撞墙",
      tone: "danger",
      lead,
      trail,
      targetLead,
      kmh,
      pace,
      dirWord,
      text: `${sub.label}正${dirWord}${pace}（${kmh} ${sub.unit}），前方却只剩 ${pct(lead)}。画框边缘像一堵墙横在面前，观众看不到前路，立刻感到受阻、急促或悬念。`,
      note: "想拍正常舒展的运动镜头，把主体往反方向拖；只有刻意制造压迫或盲区悬念时才这样摆。",
    };
  }

  if (trail < 0.09) {
    return {
      kind: "pinched",
      tag: "后缘挤贴",
      tone: "warn",
      lead,
      trail,
      targetLead,
      kmh,
      pace,
      dirWord,
      text: `前方虽然空出 ${pct(lead)}，但后方只剩 ${pct(trail)}——脚跟与尾部快贴死画框了。即使高速运动，身后也要保留一窄条缓冲，拖影和体态才舒展。`,
      note: "把主体往前进方向挪回一点，给身后留出 12% 以上呼吸边。",
    };
  }

  if (Math.abs(state.u - 0.5) < 0.045 && state.speed > 0.35) {
    return {
      kind: "center",
      tag: "居中跟拍",
      tone: "warn",
      lead,
      trail,
      targetLead,
      kmh,
      pace,
      dirWord,
      text: `主体正卡在画面中线，前方 ${pct(lead)}、后方 ${pct(trail)} 几乎对半分。速度起来后，居中构图既显得前路局促，又少了方向张力。`,
      note: `当前 ${kmh} ${sub.unit} 下，把主体往${state.dir > 0 ? "左" : "右"}退一点，把前方留到约 ${pct(targetLead)} 会舒展得多。`,
    };
  }

  if (diff < -0.1) {
    return {
      kind: "tight",
      tag: "前路偏短",
      tone: "warn",
      lead,
      trail,
      targetLead,
      kmh,
      pace,
      dirWord,
      text: `现在速度是 ${kmh} ${sub.unit}（${pace}），前方只有 ${pct(lead)}，赶不上观众脑中提前算出的落点。快要冲出画框的紧绷感已经出现了。`,
      note: `建议往${state.dir > 0 ? "左" : "右"}再退一些，让前方接近 ${pct(targetLead)}。`,
    };
  }

  if (Math.abs(diff) <= 0.1) {
    return {
      kind: "sweet",
      tag: "速度与空间匹配",
      tone: "good",
      lead,
      trail,
      targetLead,
      kmh,
      pace,
      dirWord,
      text: `${sub.label}${dirWord}${pace}（${kmh} ${sub.unit}），前方留出 ${pct(lead)} 承接去向，身后保留 ${pct(trail)} 展示速度拖影。视线顺着动势落进开阔处，既有力又舒服。`,
      note: state.speed > 0.7
        ? "高速时主体退得更靠后，提前替观众打开视线跑道。"
        : "试着拉高速度滑块：你会看到下方的推荐区间跟着往后退。",
    };
  }

  return {
    kind: "wide",
    tag: "前路极开阔",
    tone: "good",
    lead,
    trail,
    targetLead,
    kmh,
    pace,
    dirWord,
    text: `前方留出 ${pct(lead)} 的大块空间，方向意图非常强烈，也适合在前方空白里排主标题；注意身后的 ${pct(trail)} 留白别再继续压缩。`,
    note: "在海报与广告里，前方这块运动空间正是标题和口号的天然落脚处。",
  };
}
