// 纯状态与对称构图数学模型（零 DOM 依赖）
export const SUBJECT_PRESETS = [
  { id: "poster", label: "蝶翼", fullLabel: "海报蝶翼", en: "WINGS" },
  { id: "facade", label: "立面", fullLabel: "古典立面", en: "FACADE" },
  { id: "editorial", label: "封面", fullLabel: "封面版式", en: "COVER" },
];

export const MODE_PRESETS = [
  { id: "outer", label: "外廓校准", en: "OUTER" },
  { id: "near", label: "近似对称", en: "NEAR" },
];

export function createInitialState() {
  return {
    subject: "poster",   // poster | facade | editorial
    mode: "outer",       // outer | near
    // 外廓校准模式：右翼锚定在 (1.0, 0.0)，默认开场左翼略微偏窄/偏高（未对齐，待用户磁吸校准）
    leftSpread: 0.83,    // 0.56 .. 1.32
    leftLift: -0.06,     // -0.26 .. 0.26
    rightSpread: 1.0,    // 锚定不动
    rightLift: 0.0,      // 锚定不动
    // 近似对称模式：外廓锁定 100%，用户直接拖左翼内瓣/小叶产生真实细部变化
    detailDx: 0.0,       // -0.92 .. 0.92
    detailDy: 0.0,       // -0.92 .. 0.92
    // 对折状态：拖中轴铰链往右翻或点备用按钮
    foldTarget: 0,       // 0 = 展开, 1 = 左半页折向右侧
    fold: 0,             // 0 .. 1 实时折叠进度
    intro: 0.88,         // 0.88 .. 1.0 入场微舒展
    dragging: null,      // null | "wing" | "hinge"
    snapPulse: 0,        // 0 .. 1 磁吸锁回瞬时提示环
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function computeMetrics(s) {
  const activeLeftSpread = s.mode === "near" ? s.rightSpread : s.leftSpread;
  const activeLeftLift = s.mode === "near" ? s.rightLift : s.leftLift;
  const rightSpread = s.rightSpread;
  const rightLift = s.rightLift;

  const dSpread = Math.abs(activeLeftSpread - rightSpread);
  const dLift = Math.abs(activeLeftLift - rightLift);
  const outerLocked = dSpread < 0.005 && dLift < 0.005;

  const detailMag = s.mode === "near" ? Math.hypot(s.detailDx, s.detailDy) : 0;
  const detailLocked = detailMag < 0.035;

  let symmetryPct = 100;
  if (s.mode === "outer") {
    if (!outerLocked) {
      const geoPenalty = Math.min(66, dSpread * 84 + dLift * 68);
      symmetryPct = Math.round(clamp(100 - geoPenalty, 34, 99));
    }
  } else {
    // 近似对称模式：外廓严格 100% 重合，仅由用户实际拖出的内瓣/细部偏移计算示意对称度
    if (!detailLocked) {
      const detailPenalty = Math.min(20, detailMag * 15.5);
      symmetryPct = Math.round(clamp(100 - detailPenalty, 80, 99));
    }
  }

  const mismatchPct = 100 - symmetryPct;
  const isFolded = s.dragging === "hinge" ? s.fold > 0.5 : s.foldTarget > 0.5;
  const isNarrower = activeLeftSpread < rightSpread;

  let tone = "balanced";
  let stateTitle = "";
  let symSub = `示意对称度 ${symmetryPct}% · SYMMETRY`;
  let stateDesc = "";
  let eyeTitle = "";
  let eyeDesc = "";

  if (s.mode === "outer") {
    if (outerLocked) {
      tone = "balanced";
      stateTitle = "外廓完全重合";
      stateDesc = "左翼已磁吸锁回镜像位，左右到中轴距离处处相等，斜线错位区清零。";
      eyeTitle = "视线先停在中轴";
      eyeDesc = "左右视觉重量完全对等，没有哪边抢戏，眼睛顺着中轴直落正中铰链，一眼立稳。";
    } else if (mismatchPct <= 18) {
      tone = "almost";
      stateTitle = "差一点 · 假对称";
      const dirWord = isNarrower ? "收窄" : "外扩";
      stateDesc = `左翼比右翼略微${dirWord}，右侧斜线带标出没重合的边；靠近镜像位松手可磁吸锁回 100%。`;
      eyeTitle = "视线先卡在错位边";
      eyeDesc = "大脑先拿对称去核对，立刻撞上没对齐的左缘，视线直接卡在斜线错位区，像手抖放歪了。";
    } else {
      tone = "broken";
      stateTitle = "单翼破缺 · 重心偏移";
      const dirWord = isNarrower ? "明显收窄" : "大幅外张";
      stateDesc = `右翼锚定不动、左翼${dirWord}，斜线区直接摊开两翼体量差（按轮廓差值示意估算）。`;
      eyeTitle = isNarrower ? "视线被偏重的右翼拉走" : "视线立刻锁死外扩左翼";
      eyeDesc = "大面积秩序反衬出唯一突出的那一侧，眼睛不再停在中央轴线，而是直奔破缺处。";
    }
  } else {
    // 近似对称模式：外廓 100%，只看用户手调的细部偏移
    if (detailLocked) {
      tone = "balanced";
      stateTitle = "外廓与细部皆重合";
      symSub = "示意对称度 100% · 外廓锁定";
      stateDesc = "外廓与内瓣都已归零重合。拖动左翼内瓣圆柄，试着保住大轮廓、只动细节。";
      eyeTitle = "视线停在中轴，略显安静";
      eyeDesc = "外廓和内瓣一模一样时极其工整，但也容易显得像复印件；轻轻错开一点内瓣会更透气。";
    } else if (detailMag <= 0.82) {
      tone = "near";
      stateTitle = "近似对称 · 稳而不死";
      symSub = `示意对称度 ${symmetryPct}% · 外廓 100%`;
      stateDesc = "左右外轮廓严格锁死，仅左翼内瓣与小叶随手势变化——斜线只留在细部，不破大框。";
      eyeTitle = "先定大轮廓，再看内瓣变化";
      eyeDesc = "100% 重合的外廓先帮大脑稳住平衡秩序，随后视线自然停在有变化的内瓣处，稳重又不呆板。";
    } else {
      tone = "almost";
      stateTitle = "细部变化偏重";
      symSub = `示意对称度 ${symmetryPct}% · 外廓 100%`;
      stateDesc = "外框虽仍对齐，但左侧内瓣与小叶偏移较大，斜线区面积明显扩大。";
      eyeTitle = "视线开始偏向右左轻重差";
      eyeDesc = "内部色块挪动过多会改变局部重量，眼睛虽先认出大框，却很快被偏重的一侧牵走。";
    }
  }

  let foldTitle = "向右拖铰链对折";
  let foldDesc = "按住正中圆铰链往右翻，把左半页叠到右边，当场看斜线错位区。";
  if (isFolded) {
    if (outerLocked && (s.mode === "outer" || detailLocked)) {
      foldTitle = "对折完全重合";
      foldDesc = "左半翼翻叠到右侧严丝合缝，零斜线溢出；向左拖回铰链或点按钮展开。";
    } else if (s.mode === "near") {
      foldTitle = "外廓重合 · 细部显差";
      foldDesc = "对折后外缘严丝合缝，仅内部斜线带标出你手调的内瓣微差；向左拖回展开。";
    } else {
      foldTitle = "对折显出斜线错位";
      foldDesc = "左半翼翻到右侧后，斜线区清晰圈出没对齐的部分；展开后拖左翼靠近磁吸位即可归零。";
    }
  }

  return {
    activeLeftSpread,
    activeLeftLift,
    rightSpread,
    rightLift,
    outerLocked,
    detailMag,
    detailLocked,
    symmetryPct,
    mismatchPct,
    isFolded,
    tone,
    stateTitle,
    symSub,
    stateDesc,
    eyeTitle,
    eyeDesc,
    foldTitle,
    foldDesc,
  };
}
