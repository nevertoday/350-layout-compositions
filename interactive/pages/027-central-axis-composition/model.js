// 027 中轴构图 · 单一真源构图与物理力矩模型
// 开场画布、天平倾角、四柱验收徽、深蓝 TIP 诊单与各节交互全部从本文件同源计算。

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const round1 = (v) => Math.round(v * 10) / 10;

// 逐像素采自 027 原海报 (site/public/p/027.webp) 的精确色板
export const PALETTE = {
  paper: "#EEEBE7",
  paperLight: "#F7F5F2",
  paperSand: "#E6E2DC",
  rule: "#CEC9C0",
  navyDeep: "#04213E",
  navy: "#072B50",
  navyTip: "#072C52",
  navyDarkSec: "#062340",
  slateBlue: "#325274",
  midBlue: "#1A3E66",
  waterLight: "#4E7092",
  ink: "#243242",
  inkMuted: "#4A5968",
  sunOrange: "#F15C1E",
  orangeText: "#B83B0B",
  orangeGlow: "#FF7A45",
  snow: "#F4F8FC",
  white: "#FFFFFF",
  okLight: "#0E665E",
  okDark: "#6CD6C8",
  errLight: "#B62614",
  errDark: "#FF8570",
};

// 开场三题材（直接对应 027 原海报主图与下栏应用示例）
export const HERO_SCENES = {
  mountain: {
    id: "mountain",
    label: "落日雪山",
    sub: "原海报主视觉",
    wingLabel: "松林",
    subjectLabel: "落日雪山白帆",
    subjectWeight: 3.2,
  },
  lighthouse: {
    id: "lighthouse",
    label: "海岸灯塔",
    sub: "建筑与景观摄影",
    wingLabel: "礁标",
    subjectLabel: "灯塔与双翼光束",
    subjectWeight: 3.0,
  },
  bottle: {
    id: "bottle",
    label: "典藏瓶标",
    sub: "产品展示",
    wingLabel: "衬石",
    subjectLabel: "瓶身与朱橘圆标",
    subjectWeight: 2.9,
  },
};

// 开场初始状态：刻意停在 0 / 4 翻车态，绝不先给答案
export function createBrokenHeroState(scene = "mountain") {
  return {
    scene,
    axisX: 0.57, // 偏右 +7%（最尴尬的「假中轴歪斜带」）
    axisTilt: 5, // 向右歪斜 5°
    subjectX: 0.47, // 相对 0.57 脱轴左漂 -10%
    leftCount: 1, // 左翼仅 1 株（清晰立在左山外缘，绝不藏在山影里）
    leftArm: 0.25,
    leftScale: 1.0,
    rightCount: 4, // 右翼堆满 4 株（颗颗分明且力臂偏长）
    rightArm: 0.29,
    rightScale: 1.0,
    clutter: [true, true], // 左上/右上两枚游离抢戏杂块
    shadingMode: "subtle", // "subtle"（原海报左深右明微差）| "mirror"（纯平镜像）
    showGuides: true,
  };
}

// 供展开两翼实绘单件（画布绘图与力矩公式读完全同一份清单）
export function buildWingItems(state) {
  const spacing = 0.036;
  const makeSide = (side) => {
    const isLeft = side === "left";
    const count = isLeft ? state.leftCount : state.rightCount;
    const arm = isLeft ? state.leftArm : state.rightArm;
    const scale = isLeft ? state.leftScale : state.rightScale;
    const dir = isLeft ? -1 : 1;
    const halfSpan = ((count - 1) * spacing) / 2;
    // 保证整组群心按安全边距收敛，绝不把外侧两株重叠拍扁在边上
    const safeArm = isLeft
      ? clamp(arm, 0.14 + halfSpan, Math.max(0.14 + halfSpan, state.axisX - 0.055 - halfSpan))
      : clamp(arm, 0.14 + halfSpan, Math.max(0.14 + halfSpan, 0.945 - state.axisX - halfSpan));
    const items = [];
    for (let i = 0; i < count; i++) {
      const offsetFromCenter = (i - (count - 1) / 2) * spacing;
      const x = clamp(state.axisX + dir * safeArm + offsetFromCenter * dir, 0.05, 0.95);
      // 仿原海报三松外高内低的错落韵律
      const tierFactor = count === 1 ? 1.0 : 0.84 + (i / Math.max(1, count - 1)) * 0.28;
      const size = scale * tierFactor;
      const weight = round1(size * size * 0.92);
      items.push({
        side,
        index: i,
        x,
        size,
        weight,
        armFromAxis: x - state.axisX,
      });
    }
    return items;
  };
  return {
    left: makeSide("left"),
    right: makeSide("right"),
  };
}

// 杂块坐标（与画布绘制、点击命中检测完全同源；y=0.33 避开横屏顶部 HUD）
export const CLUTTER_DEFS = [
  { id: 0, x: 0.14, y: 0.33, label: "左上浮标", weight: 1.05 },
  { id: 1, x: 0.87, y: 0.33, label: "右上抢戏块", weight: 1.35 },
];

// 开场单一真源解析器
export function evaluateHero(state) {
  const sceneMeta = HERO_SCENES[state.scene] || HERO_SCENES.mountain;
  const wings = buildWingItems(state);
  const axisOffsetPct = round1((state.axisX - 0.5) * 100);
  const absAxisOffset = Math.abs(axisOffsetPct);
  const absTilt = Math.abs(state.axisTilt);
  const subjectDeltaPct = round1((state.subjectX - state.axisX) * 100);
  const absSubjDelta = Math.abs(subjectDeltaPct);

  // 逐件力矩积分：M = Σ w_i * (x_i - axisX)
  let leftWeight = 0;
  let rightWeight = 0;
  let leftTorque = 0;
  let rightTorque = 0;
  let minEdgeGap = 1;

  for (const it of wings.left) {
    leftWeight += it.weight;
    leftTorque += it.weight * Math.abs(it.armFromAxis);
    minEdgeGap = Math.min(minEdgeGap, it.x, 1 - it.x);
  }
  for (const it of wings.right) {
    rightWeight += it.weight;
    rightTorque += it.weight * Math.abs(it.armFromAxis);
    minEdgeGap = Math.min(minEdgeGap, it.x, 1 - it.x);
  }

  const subjectTorque = sceneMeta.subjectWeight * (state.subjectX - state.axisX);
  let clutterTorque = 0;
  let clutterCount = 0;
  state.clutter.forEach((active, idx) => {
    if (active) {
      clutterCount++;
      clutterTorque += CLUTTER_DEFS[idx].weight * (CLUTTER_DEFS[idx].x - state.axisX);
    }
  });

  // 正值代表右沉，负值代表左沉
  const netTorque = rightTorque - leftTorque + subjectTorque + clutterTorque;
  const totalAbsTorque = Math.max(0.45, leftTorque + rightTorque + Math.abs(subjectTorque) + 0.35);
  const imbalancePct = round1(clamp((netTorque / totalAbsTorque) * 100, -100, 100));
  const absImbalance = Math.abs(imbalancePct);

  // 底部机械杠杆天平倾角（度），纯物理映射且保证两端圆珠绝不沉出画布
  const beamAngleDeg = round1(clamp(netTorque * 6.8 + state.axisTilt * 0.22, -7.2, 7.2));

  // 判断边缘贴撞与空置
  const bothSidesPresent = state.leftCount >= 1 && state.rightCount >= 1;
  const edgeCramped = bothSidesPresent && minEdgeGap < 0.062;

  // 四枚原海报核心支柱的独立判定（全靠真源数算）
  const stabilityOk = absAxisOffset <= 1.5 && absTilt <= 0.8;
  const focusOk = absSubjDelta <= 1.8 && clutterCount === 0;
  const balanceOk = bothSidesPresent && absImbalance <= 9.0 && Math.abs(beamAngleDeg) <= 1.3;

  // 区分「镜像对称」与「异形等重动态平衡」两种合法呼应解
  const isStrictMirror =
    bothSidesPresent &&
    state.leftCount === state.rightCount &&
    Math.abs(state.leftArm - state.rightArm) <= 0.025 &&
    Math.abs(state.leftScale - state.rightScale) <= 0.1;

  const symmetryOk = bothSidesPresent && !edgeCramped && absImbalance <= 14.0 && absAxisOffset <= 3.5;

  const score = [symmetryOk, balanceOk, focusOk, stabilityOk].filter(Boolean).length;

  // 细分状态标签（供四枚深蓝圆徽实时显示）
  const pillarStatus = {
    symmetry: {
      ok: symmetryOk,
      tag: !bothSidesPresent
        ? "单侧空置"
        : edgeCramped
          ? "贴边挤撞"
          : symmetryOk
            ? isStrictMirror
              ? "镜像呼应"
              : "异形等重"
            : absAxisOffset > 3.5
              ? "轴偏失序"
              : "两翼失配",
    },
    balance: {
      ok: balanceOk,
      tag: !bothSidesPresent
        ? "无翼配平"
        : balanceOk
          ? `平齐 ${beamAngleDeg === 0 ? "0.0" : (beamAngleDeg > 0 ? "+" : "") + beamAngleDeg.toFixed(1)}°`
          : imbalancePct > 0
            ? `右沉 +${Math.round(absImbalance)}%`
            : `左沉 -${Math.round(absImbalance)}%`,
    },
    focus: {
      ok: focusOk,
      tag:
        absSubjDelta > 1.8
          ? `脱轴 ${subjectDeltaPct > 0 ? "+" : ""}${Math.round(subjectDeltaPct)}%`
          : clutterCount > 0
            ? `杂块 ${clutterCount} 处`
            : "骑轴凝聚",
    },
    stability: {
      ok: stabilityOk,
      tag:
        absTilt > 0.8
          ? `歪斜 ${state.axisTilt > 0 ? "+" : ""}${state.axisTilt}°`
          : absAxisOffset > 10.5
            ? `已滑偏轴`
            : absAxisOffset > 1.5
              ? `偏中 ${axisOffsetPct > 0 ? "+" : ""}${axisOffsetPct}%`
              : "中轴立正",
    },
  };

  // 原海报底栏三步法进度
  const steps = {
    axis: stabilityOk,
    subject: focusOk,
    balance: symmetryOk && balanceOk,
  };

  // 逐级诊单：说清「为什么人眼看着不对」和「下一步动作」
  let diag;
  if (absTilt > 0.8) {
    diag = {
      level: "err",
      badge: `错态 · 轴线歪斜 ${state.axisTilt > 0 ? "+" : ""}${state.axisTilt}°`,
      headline: `中轴自身歪了 ${absTilt}°，整张画的重力基准先塌了`,
      why: `人眼自带重力垂直参照，中轴只要歪出 1° 以上，左右元素再用心摆也像挂歪的相框，安定感立刻瓦解。`,
      action: `先在下方控制带点「轴线归直 0°」，再拖动顶沿朱橘轴锤把轴线拉回正中 50%。`,
    };
  } else if (absAxisOffset > 10.5) {
    diag = {
      level: "err",
      badge: `错态 · 偏离 ${axisOffsetPct > 0 ? "+" : ""}${axisOffsetPct}%（已入偏轴区）`,
      headline: `轴线偏到 ${Math.round(state.axisX * 100)}%，已经滑进「偏轴构图」地带`,
      why: `超过 10% 的大偏移不再靠中心对称建立秩序，而是靠不对称留白生出动势（见 028 偏轴构图）；此时若仍套中轴对称，画面会显得一头重一头空。`,
      action: `向右或向左拖动底沿「铅垂轴锤滑槽」，把轴线收回到画幅正中 50%（靠近中线会轻轻吸附）。`,
    };
  } else if (absAxisOffset > 1.5) {
    diag = {
      level: "err",
      badge: `错态 · 假中轴偏 ${axisOffsetPct > 0 ? "+" : ""}${axisOffsetPct}%`,
      headline: `差 ${absAxisOffset}% 没对正——这是最显眼的「假中轴」翻车`,
      why: `轴线只偏了几个百分点，离页眉居中虚线刚好错开一截。观者一眼就能觉察「没摆正」，心里反复校对却安不下神。`,
      action: `左右微调铅垂轴锤（或按 ← / → 键），让画布内虚线与页眉顶中虚线上下严丝合缝咬合在 50%。`,
    };
  } else if (absSubjDelta > 1.8) {
    const dirWord = subjectDeltaPct > 0 ? "右" : "左";
    diag = {
      level: "err",
      badge: `错态 · 主体脱轴 ${Math.round(absSubjDelta)}%`,
      headline: `${sceneMeta.subjectLabel}偏离中轴向${dirWord}飘出 ${Math.round(absSubjDelta)}%`,
      why: `轴线空戳在背景里，主角却躲在旁边，视线被迫在「结构中线」与「核心主体」之间左右拉扯，中轴的集中力量瞬间散掉。`,
      action: `直接在画布里按住${sceneMeta.subjectLabel}向中轴拖回（或点「主体骑轴」），让焦点与脊梁合一。`,
    };
  } else if (clutterCount > 0) {
    diag = {
      level: "err",
      badge: `错态 · 外围抢戏 ${clutterCount} 处`,
      headline: `画角还飘着 ${clutterCount} 枚游离杂块，把视线从中心扯散了`,
      why: `中轴构图靠四周干净留白把注意力推回脊梁。角落里无呼应的深色块既额外拉偏力矩，又不断分散焦点。`,
      action: `直接点击画布上方带红圈的游离杂块将其清掉（或点「清理杂块」），让视野收束回中央。`,
    };
  } else if (!bothSidesPresent) {
    const emptySide = state.leftCount === 0 && state.rightCount === 0 ? "两侧" : state.leftCount === 0 ? "左侧" : "右侧";
    diag = {
      level: "err",
      badge: `错态 · ${emptySide}空置无呼应`,
      headline: `${emptySide}缺少${sceneMeta.wingLabel}配重，退化成了孤立居中点`,
      why: `只有孤零零一个主体落在中间，属于居中构图（016）的范畴；真正的中轴构图需要轴线两翼相互呼应、托住空间张力。`,
      action: `用下方左右「＋」按钮补回两侧${sceneMeta.wingLabel}，再调节距轴距离让底沿机械天平归平。`,
    };
  } else if (edgeCramped) {
    diag = {
      level: "err",
      badge: `错态 · 外翼贴边窒息`,
      headline: `${sceneMeta.wingLabel}挤死在画框边沿，缺少外围呼吸带`,
      why: `当配重元素距边框不到画幅 7% 时，边缘会产生强牵引力，反而把视线从中心中轴拽向画框外缘。`,
      action: `把贴边的${sceneMeta.wingLabel}往轴心方向轻轻收进一点，让左右留出舒适的边缘余白。`,
    };
  } else if (!balanceOk) {
    const heavy = imbalancePct > 0 ? "右" : "左";
    const light = imbalancePct > 0 ? "左" : "右";
    diag = {
      level: "err",
      badge: `错态 · ${heavy}翼沉斜 ${beamAngleDeg > 0 ? "+" : ""}${beamAngleDeg.toFixed(1)}°`,
      headline: `${heavy}侧视觉力矩压过了${light}侧，底部天平向${heavy}沉倒`,
      why: `视觉平衡遵循「重量 × 距轴力臂」规律：目前左矩 ${leftTorque.toFixed(2)}、右矩 ${rightTorque.toFixed(2)}。哪怕不改数量，只要一侧拉得更远或体量更重，整幅画面就会失衡倾倒。`,
      action: `把${heavy}翼${sceneMeta.wingLabel}往中轴拖近（缩力臂）或减 1 件，也可以把${light}翼拉远或加重，直到天平梁水平归零。`,
    };
  } else if (isStrictMirror) {
    diag = {
      level: "ok",
      badge: `达标 · 4 / 4 经典镜像中轴解`,
      headline: `轴正、主骑、两翼对称平齐——庄重沉稳的原海报秩序已立住`,
      why: `中轴稳锁 50% 垂直线，${sceneMeta.subjectLabel}骑在脊梁正中，左右${sceneMeta.wingLabel}等距等重，天平倾角收进 ±1.6° 经验平齐带。${state.shadingMode === "subtle" ? "加上雪山/主体左深右明的微差受光，沉稳而不死板。" : "可试切「微破光影」，看原海报如何在对称轮廓里注入透气感。"}`,
      action: `你还可以试着减掉一侧 1 株${sceneMeta.wingLabel}并把剩余的往外拉远，亲手解锁另一种「异形等重」合法解！`,
    };
  } else {
    diag = {
      level: "ok",
      badge: `达标 · 4 / 4 异形等重中轴解`,
      headline: `左右形态并不相同，却借杠杆力矩稳稳立住了中轴平衡`,
      why: `左翼 ${state.leftCount} 件（力矩 ${leftTorque.toFixed(2)}）与右翼 ${state.rightCount} 件（力矩 ${rightTorque.toFixed(2)}）靠「近重远轻」互相抵消，机械天平依然水平。这正是阿恩海姆揭示的高阶中轴平衡：稳定而不僵硬。`,
      action: `不妨切到「海岸灯塔」或「典藏瓶标」，或在下方 01 节进一步拆解视觉砝码的配平法则。`,
    };
  }

  return {
    sceneMeta,
    wings,
    axisOffsetPct,
    absAxisOffset,
    subjectDeltaPct,
    absSubjDelta,
    leftWeight: round1(leftWeight),
    rightWeight: round1(rightWeight),
    leftTorque: round1(leftTorque * 10) / 10,
    rightTorque: round1(rightTorque * 10) / 10,
    netTorque: round1(netTorque * 100) / 100,
    imbalancePct,
    beamAngleDeg,
    clutterCount,
    isStrictMirror,
    bothSidesPresent,
    edgeCramped,
    score,
    pillars: { symmetryOk, balanceOk, focusOk, stabilityOk },
    pillarStatus,
    steps,
    diag,
  };
}

// ---------- 01 节：视觉砝码配平槽模型 ----------
// 左侧锚定建筑/版块视觉重量示意 = 6.0 × 力臂 0.55 = 3.30
export const SCALE_LEFT_TARGET = {
  label: "深海蓝主碑块",
  weight: 6.0,
  arm: 0.55,
  torque: 3.3,
};

export const SCALE_TOKENS = [
  { id: "sun", name: "朱橘日盘", shape: "circle", color: PALETTE.sunOrange, area: 1.8, contrast: 1.55, note: "面积小但暖色高反差，视觉重" },
  { id: "tower", name: "深蓝方塔", shape: "rect", color: PALETTE.navy, area: 2.8, contrast: 1.35, note: "体量厚实、深墨沉重" },
  { id: "pines", name: "双松剪影", shape: "trees", color: PALETTE.midBlue, area: 2.1, contrast: 1.25, note: "轮廓琐碎拉高注意力" },
  { id: "mist", name: "浅青水纹", shape: "bars", color: PALETTE.waterLight, area: 2.6, contrast: 0.72, note: "面积虽大但低反差偏轻" },
  { id: "sail", name: "雪白三角帆", shape: "tri", color: PALETTE.snow, area: 1.9, contrast: 0.85, note: "高明度浅色，视觉最轻盈" },
  { id: "seal", name: "朱橘印章", shape: "square", color: PALETTE.orangeText, area: 1.35, contrast: 1.48, note: "小巧凝练，适合远臂微调" },
].map((t) => ({ ...t, visualWeight: round1(t.area * t.contrast) }));

export const SCALE_SLOTS = [
  { id: 0, label: "近轴槽", arm: 0.35 },
  { id: 1, label: "中臂槽", arm: 0.68 },
  { id: 2, label: "远缘槽", arm: 1.0 },
];

export function evaluateScalePuzzle(slotTokens) {
  let rightTorque = 0;
  let rightWeight = 0;
  let count = 0;
  slotTokens.forEach((tokenId, idx) => {
    if (!tokenId) return;
    const tok = SCALE_TOKENS.find((t) => t.id === tokenId);
    if (!tok) return;
    count++;
    rightWeight += tok.visualWeight;
    rightTorque += tok.visualWeight * SCALE_SLOTS[idx].arm;
  });
  const diff = rightTorque - SCALE_LEFT_TARGET.torque;
  const angleDeg = round1(clamp(diff * 3.2, -10.2, 10.2));
  const ok = count > 0 && Math.abs(diff) <= 0.38;
  let verdict;
  if (count === 0) {
    verdict = "右侧空槽：请从下方选 1–2 枚视觉砝码放进近 / 中 / 远槽，用「重量 × 力臂」抵消左侧深蓝主碑块。";
  } else if (ok) {
    const farLight = count === 1 && slotTokens[2] && SCALE_TOKENS.find((t) => t.id === slotTokens[2]).visualWeight < 4.0;
    verdict = farLight
      ? `平衡成立（示意力矩差 ${diff >= 0 ? "+" : ""}${diff.toFixed(2)}）：一枚小体量亮色块放到远缘槽，靠长力臂稳稳撬平了左侧大黑块！`
      : `平衡成立（示意力矩差 ${diff >= 0 ? "+" : ""}${diff.toFixed(2)}）：左右形态完全不同，却以视觉重量 × 力臂在轴心处平齐。`;
  } else if (diff < 0) {
    verdict = `左侧偏沉（右矩 ${rightTorque.toFixed(2)} < 左矩 ${SCALE_LEFT_TARGET.torque.toFixed(2)}）：把砝码挪到更远的槽位，或换一枚深色/朱橘重码。`;
  } else {
    verdict = `右侧压过头（右矩 ${rightTorque.toFixed(2)} > 左矩 ${SCALE_LEFT_TARGET.torque.toFixed(2)}）：把砝码往近轴槽挪一档，或换成低反差浅青块减重。`;
  }
  return {
    leftTorque: SCALE_LEFT_TARGET.torque,
    rightTorque: round1(rightTorque * 100) / 100,
    rightWeight: round1(rightWeight),
    diff: round1(diff * 100) / 100,
    angleDeg,
    ok,
    count,
    verdict,
  };
}

// ---------- 02 节：肉眼定轴盲测模型（几何中心 vs 视觉质心） ----------
export const BLIND_SHAPES = [
  {
    id: "sail",
    name: "单侧斜帆",
    desc: "主帆鼓向右侧、细拉索留在左侧：外接矩形中心偏左，但真实视觉重心压在右侧实心帆面上。",
    geomCenter: 0.5, // 外接框中点（当主体平移 dx=0 时）
    opticalOffset: 0.048, // 视觉质心相对外接框中心偏右 +4.8%
  },
  {
    id: "pagoda",
    name: "挑檐侧松塔",
    desc: "古塔主体端正，但右侧探出一枝浓墨横松：按外接盒硬居中，塔尖会被顶到左侧显得歪斜。",
    geomCenter: 0.5,
    opticalOffset: -0.055, // 外接框因右侧横松右扩，导致主体塔身视觉重心落在外接框中心偏左 -5.5%
  },
  {
    id: "monogram",
    name: "宽脚字母 A 徽",
    desc: "厚左斜笔配细右斜笔与外延横杠：外接框居中会让视觉主干偏斜，排版师常需微调 3%–4% 光学补偿。",
    geomCenter: 0.5,
    opticalOffset: -0.038,
  },
];

// userShift 是用户拖动主体相对画幅中线 0.5 的水平位移 (-0.24 ~ +0.24)
export function evaluateBlindTest(shapeId, userShift) {
  const shape = BLIND_SHAPES.find((s) => s.id === shapeId) || BLIND_SHAPES[0];
  // 当主体几何外接框中心在 0.5 + userShift 时，视觉质心在 0.5 + userShift + shape.opticalOffset
  const geomX = 0.5 + userShift;
  const opticalX = 0.5 + userShift + shape.opticalOffset;
  const errFromGeomPct = round1((geomX - 0.5) * 100);
  const errFromOpticalPct = round1((opticalX - 0.5) * 100);
  const absOpt = Math.abs(errFromOpticalPct);
  const absGeom = Math.abs(errFromGeomPct);

  let judgment;
  if (absOpt <= 1.8) {
    judgment = `很准！你下意识做了光学补偿：把外接框微移了 ${errFromGeomPct >= 0 ? "+" : ""}${errFromGeomPct}%，让视觉质心紧贴中轴（仅差 ${absOpt}%）。`;
  } else if (absGeom <= 1.8) {
    judgment = `你对准了几何外接框（框差 ${absGeom}%），但视觉质心偏了 ${errFromOpticalPct >= 0 ? "+" : ""}${errFromOpticalPct}%——这正是「软件一键水平居中却看起来歪」的原因。`;
  } else if (absOpt <= 6.5) {
    judgment = `落点偏离视觉中心 ${errFromOpticalPct >= 0 ? "+" : ""}${errFromOpticalPct}%：正好掉进 2%–8% 的「差一点假中轴」尴尬带，人眼立刻觉得没摆正。`;
  } else {
    judgment = `偏离视觉中心 ${errFromOpticalPct >= 0 ? "+" : ""}${errFromOpticalPct}%：已明显脱出中轴区，进入偏轴构图视野。`;
  }
  return { shape, geomX, opticalX, errFromGeomPct, errFromOpticalPct, absOpt, judgment };
}

// ---------- 06 节：单变量挑一挑练习（零剧透标签 + 同源数值解析） ----------
export const QUIZ_BANK = [
  {
    id: "q1",
    prompt: "某建筑博物馆要出「中轴与秩序」特展主海报（竖版，包含标题、落日、展馆尖顶、松林与底部展期）。下面四张草图只动了一个关键构图变量，哪一张真正立稳了中轴构图？",
    options: [
      {
        key: "A",
        axisX: 0.5,
        subjectX: 0.5,
        leftTrees: 3,
        rightTrees: 1,
        leftBadge: true,
        longCenteredCopy: false,
        correct: false,
        metrics: { axisOff: "0%", subjOff: "0%", torque: "左沉 -38%" },
        reason: "虽然标题和尖顶骑在中轴 50%，但左侧同时压了深蓝展期章与三株密松，右侧只剩一株细松，左右力矩严重左倾，整张海报像往左歪倒。",
      },
      {
        key: "B",
        axisX: 0.5,
        subjectX: 0.56,
        leftTrees: 2,
        rightTrees: 2,
        leftBadge: false,
        longCenteredCopy: false,
        correct: false,
        metrics: { axisOff: "0%", subjOff: "+6% 脱轴", torque: "右沉 +19%" },
        reason: "两侧松林明明镜像对称，落日与展馆尖顶却整体向右漂了 6%，与上方居中大标题错开半格——掉进最刺眼的「差一点假中轴」坑。",
      },
      {
        key: "C",
        axisX: 0.5,
        subjectX: 0.5,
        leftTrees: 2,
        rightTrees: 3,
        leftHeavyNear: true,
        leftBadge: false,
        longCenteredCopy: false,
        correct: true,
        metrics: { axisOff: "0%", subjOff: "0%", torque: "平齐 +1%" },
        reason: "正确！标题、落日、展馆尖顶严丝合缝同骑 50% 垂直中轴；左翼两株近轴高松与右翼三株远轴小松达成「异形等重」力矩平衡，底栏简洁收口，庄重而不死板。",
      },
      {
        key: "D",
        axisX: 0.5,
        subjectX: 0.5,
        leftTrees: 2,
        rightTrees: 2,
        leftBadge: false,
        longCenteredCopy: true,
        correct: false,
        metrics: { axisOff: "0%", subjOff: "0%", torque: "下盘散焦" },
        reason: "上半幅中轴立得很稳，但底部硬塞了 6 行居中对齐的长介绍：每一行起笔左缘来回漂移成锯齿，读者换行吃力，把中轴原本的利落收口拖散了。",
      },
    ],
  },
  {
    id: "q2",
    prompt: "给一瓶手工陶瓷器皿拍竖版静物主图：上方居中放品牌名，画面主体是深蓝釉瓶配朱橘圆标。下面四张构图里，哪一张把中轴的「集中」与「稳定」发挥得最好？",
    options: [
      {
        key: "A",
        kind: "product",
        bottleX: 0.5,
        bottleScale: 1.0,
        rightStamp: true,
        cornerNoise: false,
        correct: false,
        metrics: { axisOff: "0%", focus: "右翼抢戏", torque: "右沉 +34%" },
        reason: "釉瓶站对了中轴，但右侧硬贴了一枚超大实心促销圆章，高反差圆块把视觉重量和视线一起拽向右边，破坏了左右均衡。",
      },
      {
        key: "B",
        kind: "product",
        bottleX: 0.5,
        bottleScale: 1.0,
        rightStamp: false,
        cornerNoise: false,
        correct: true,
        metrics: { axisOff: "0%", focus: "骑轴凝聚", torque: "平齐 0%" },
        reason: "正确！瓶身与朱橘圆标稳骑 50% 中轴，底部椭圆浅影与微差高光托出立体呼吸感，左右信息短标签等距呼应，一眼聚焦、稳重耐看。",
      },
      {
        key: "C",
        kind: "product",
        bottleX: 0.445,
        bottleScale: 1.0,
        rightStamp: false,
        cornerNoise: false,
        correct: false,
        metrics: { axisOff: "-5.5%", focus: "轴主错位", torque: "左偏 -22%" },
        reason: "上方品牌名稳居正中，瓶身却悄悄左偏了 5.5%——既不像有意偏轴（028）留出大块说明区，又没对正中线，像拍摄机位歪了半步。",
      },
      {
        key: "D",
        kind: "product",
        bottleX: 0.5,
        bottleScale: 0.62,
        rightStamp: false,
        cornerNoise: true,
        correct: false,
        metrics: { axisOff: "0%", focus: "四角拉扯", torque: "中心失焦" },
        reason: "瓶身被缩得过小，四角又塞满四枚与主体同等抢眼的角标，视线不断被扯向画框四隅，中轴最核心的「向心聚焦」力量彻底丢失。",
      },
    ],
  },
];
