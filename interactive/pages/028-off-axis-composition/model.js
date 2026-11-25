// 028 偏轴构图 · 单一真源数据与几何评估模型
// 画布与读数、徽标、诊单共用同一组归一化坐标（0..1），杜绝数值脱节与假精确。

export const PALETTE = {
  paper: "#E8DFE6",
  mist: "#DDD4DC",
  cream: "#F4EBE9",
  ivory: "#FAF5F3",
  plum: "#372540",
  plumSlope: "#402744",
  plumTip: "#312640",
  plumDark: "#271C33",
  inkMuted: "#5A4963",
  darkMuted: "#CEC3D4",
  vermilion: "#F05A3B",
  vermilionBadge: "#E5553F",
  vermilionInk: "#B4341C",
  vermilionBright: "#FF7B61",
  salmon: "#DD8374",
  sage: "#1B665D",
  sageLight: "#7AD6C8",
  rule: "#B6A9B8",
  seaLight: "#E2DAE1",
  seaDark: "#A7A0AE",
};

export const HERO_SCENES = {
  hill: {
    id: "hill",
    label: "山坡望日",
    sub: "原海报母题",
    subjectName: "山坡行者",
    anchorName: "朱红日轮",
    clutterName: "乱石暗块",
  },
  sail: {
    id: "sail",
    label: "孤帆惊鸟",
    sub: "海报对比示例",
    subjectName: "海面独帆",
    anchorName: "远空飞鸟",
    clutterName: "礁石杂影",
  },
  arch: {
    id: "arch",
    label: "廊柱微光",
    sub: "空间叙事",
    subjectName: "廊下侧影",
    anchorName: "远端暖窗",
    clutterName: "散落杂箱",
  },
};

export const ANCHOR_MODES = {
  none: { label: "关闭", weight: 0, radiusScale: 0 },
  light: { label: "轻巧呼应", weight: 0.56, radiusScale: 1.0 },
  rival: { label: "同重抢戏", weight: 1.15, radiusScale: 1.52 },
};

export const SLOPE_MODES = {
  level: { label: "平直 0°", deg: 0 },
  gentle: { label: "斜坡 14°", deg: 14 },
  steep: { label: "陡坡 22°", deg: 22 },
};

// 开场刻意停在 0 / 4 翻车态：锁死居中 + 同侧过重呼应 + 留白走廊塞满杂块
export function createInitialHero() {
  return {
    scene: "hill",
    axisX: 0.5,
    facing: -1, // -1 朝左, +1 朝右
    anchorX: 0.41,
    anchorY: 0.34,
    anchorMode: "rival",
    slopeMode: "level",
    clutter: [
      { id: 0, x: 0.24, y: 0.46, active: true },
      { id: 1, x: 0.74, y: 0.44, active: true },
    ],
    showGuides: true,
    highlightPillar: null,
  };
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 根据轴位、坡度算出主体在归一化画框 (0..1, 0..1) 里的真实落脚点与视线起点
export function getSubjectGeometry(state) {
  const deg = SLOPE_MODES[state.slopeMode]?.deg ?? 14;
  // 斜坡向主体面朝方向轻轻下倾，形成开阔视域（平直时为水平线）
  const rad = (deg * Math.PI) / 180;
  const slopeSign = state.facing >= 0 ? 1 : -1; // 朝右则左高右低，朝左则右高左低
  const baseMidY = state.scene === "sail" ? 0.73 : state.scene === "arch" ? 0.78 : 0.69;
  const slopeY = (nx) => {
    if (state.scene !== "hill") return baseMidY;
    return clamp(baseMidY + slopeSign * Math.tan(rad) * (nx - 0.5) * 0.92, 0.42, 0.88);
  };
  const sx = clamp(state.axisX, 0.1, 0.9);
  const footY = slopeY(sx);
  const headY = clamp(footY - (state.scene === "sail" ? 0.18 : 0.17), 0.14, 0.76);
  return { sx, footY, headY, slopeY, slopeDeg: deg, slopeSign };
}

export function evaluateHero(state) {
  const geom = getSubjectGeometry(state);
  const { sx, headY, slopeDeg, slopeSign } = geom;
  const offsetSigned = sx - 0.5;
  const absOffset = Math.abs(offsetSigned);
  const axisPct = Math.round(sx * 100);
  const offsetPct = Math.round(offsetSigned * 100);

  let axisZone = "off-axis";
  if (absOffset <= 0.06) axisZone = "center";
  else if (absOffset < 0.12) axisZone = "hesitant";
  else if (sx < 0.16 || sx > 0.84) axisZone = "edge";

  const leadRoom = state.facing > 0 ? 1 - sx : sx;
  const leadRoomPct = Math.round(leadRoom * 100);
  const backRoomPct = 100 - leadRoomPct;

  const anchorSpec = ANCHOR_MODES[state.anchorMode] || ANCHOR_MODES.light;
  const hasAnchor = state.anchorMode !== "none";
  const ax = clamp(state.anchorX, 0.12, 0.88);
  const ay = clamp(state.anchorY, 0.16, 0.62);

  // 视线几何跨度与仰角（从主体视线原点到远端呼应物）
  const dx = ax - sx;
  const dy = headY - ay; // 向上为正
  const sightSpan = hasAnchor ? Math.hypot(dx, dy) : 0;
  const sightSpanPct = Math.round(sightSpan * 100);
  const sightAngleDeg = hasAnchor ? Math.round((Math.atan2(dy, Math.abs(dx) + 0.0001) * 180) / Math.PI) : 0;
  const anchorAhead = hasAnchor && dx * state.facing > 0.14;
  const anchorOppositeHalf =
    hasAnchor &&
    ((offsetSigned < -0.06 && ax > 0.52) || (offsetSigned > 0.06 && ax < 0.48));

  const activeClutterList = state.clutter.filter((c) => c.active);
  const activeClutterCount = activeClutterList.length;

  // 杠杆力矩（示意模型）：主体短臂重 1.00，轻呼应长臂重 0.56，抢重锚点 1.15，斜坡微托底
  const subjectMoment = 1.0 * (sx - 0.5);
  const anchorMoment = anchorSpec.weight * (ax - 0.5);
  const clutterMoment = activeClutterList.reduce((acc, c) => acc + 0.24 * (c.x - 0.5), 0);
  const slopeMoment = state.scene === "hill" ? -slopeSign * (slopeDeg / 22) * 0.035 : 0;
  const netTorque = subjectMoment + anchorMoment + clutterMoment + slopeMoment;

  let leverLabel = "动态持平（示意）";
  let leverState = "balanced";
  if (axisZone === "center") {
    leverLabel = "中心锁死（示意）";
    leverState = "locked";
  } else if (!hasAnchor) {
    leverLabel = offsetSigned < 0 ? "左沉悬空（示意）" : "右沉悬空（示意）";
    leverState = "unanchored";
  } else if (Math.abs(netTorque) > 0.18) {
    leverLabel = netTorque < 0 ? "明显左倾（示意）" : "明显右倾（示意）";
    leverState = "tilted";
  } else if (Math.abs(netTorque) > 0.11) {
    leverLabel = netTorque < 0 ? "微偏左沉（示意）" : "微偏右沉（示意）";
    leverState = "slight";
  }

  // 四大原海报原则单真源核验
  const offsetOk = axisZone === "off-axis";
  const balanceOk =
    offsetOk &&
    hasAnchor &&
    anchorOppositeHalf &&
    Math.abs(netTorque) <= 0.18;
  const emphasisOk =
    state.anchorMode !== "rival" &&
    activeClutterCount === 0 &&
    axisZone !== "edge";
  const dynamismOk =
    offsetOk &&
    leadRoom >= 0.58 &&
    activeClutterCount === 0 &&
    anchorAhead;

  const pillars = {
    offset: {
      ok: offsetOk,
      chip:
        axisZone === "center"
          ? `居中 ${axisPct}%`
          : axisZone === "hesitant"
            ? `微偏 ${axisPct}%`
            : axisZone === "edge"
              ? `贴边 ${axisPct}%`
              : `${offsetSigned < 0 ? "左偏" : "右偏"} ${axisPct}%`,
    },
    balance: {
      ok: balanceOk,
      chip: !hasAnchor
        ? "无远端落点"
        : !offsetOk
          ? "待离中心"
          : !anchorOppositeHalf
            ? "同侧堆重"
            : Math.abs(netTorque) > 0.18
              ? netTorque < 0
                ? "左沉失衡"
                : "右沉失衡"
              : "以轻博重",
    },
    emphasis: {
      ok: emphasisOk,
      chip:
        state.anchorMode === "rival"
          ? "双雄抢戏"
          : activeClutterCount > 0
            ? `杂块 ${activeClutterCount} 处`
            : axisZone === "edge"
              ? "主体受挤"
              : "主次分明",
    },
    dynamism: {
      ok: dynamismOk,
      chip: !offsetOk
        ? "视线停滞"
        : leadRoom < 0.52
          ? `面壁 ${leadRoomPct}%`
          : activeClutterCount > 0
            ? "走廊受阻"
            : !anchorAhead
              ? "呼应背向"
              : `前留 ${leadRoomPct}%`,
    },
  };

  const passedCount = [offsetOk, balanceOk, emphasisOk, dynamismOk].filter(Boolean).length;
  const sceneMeta = HERO_SCENES[state.scene] || HERO_SCENES.hill;

  // 8 类精确错态诊断 + 成立读数
  let diag = null;
  if (axisZone === "center") {
    diag = {
      code: "dead-center",
      badge: `错态 · 困在中心（${axisPct}%）`,
      title: `${sceneMeta.subjectName}被锁在画面正中，张力起不来`,
      body: `当前轴位在 ${axisPct}%，左右留白几乎均分，视觉拉力彼此抵消。人眼看一眼正中就停住了，画面沉稳却缺少方向与故事感。`,
      next: `在圆窗画布里向左或向右横拖，把主体推离中轴，落入 18%–38% 或 62%–82% 经验偏轴带。`,
      tip: "偏轴构图的第一步是敢把主轴挪开中心，打破左右均等的静态锁死。",
    };
  } else if (axisZone === "hesitant") {
    diag = {
      code: "hesitant-offset",
      badge: `错态 · 微偏手抖（${axisPct}%）`,
      title: `只挪开了 ${Math.abs(offsetPct)}%，看着不像偏轴，倒像没对齐`,
      body: `轴位落在 ${axisPct}% 的「暧昧区」：离中心太近，观众察觉不到刻意偏置的意图，反而会本能怀疑排版手抖了。`,
      next: `干脆把主体继续往${offsetSigned < 0 ? "左" : "右"}拖，跨过 38% 或 62% 边界，让偏轴态度彻底明确。`,
      tip: "偏轴忌讳犹豫：要么干脆居中（016/027），要么明确偏出至少 12% 以上。",
    };
  } else if (axisZone === "edge") {
    diag = {
      code: "edge-crushed",
      badge: `错态 · 贴边掉框（${axisPct}%）`,
      title: `${sceneMeta.subjectName}紧贴圆窗边缘，随时要滑出画框`,
      body: `当前轴位已逼近 ${axisPct}%，主体背侧只剩不到 ${Math.min(axisPct, 100 - axisPct)}% 的喘息余量，轮廓被画框死死压迫。`,
      next: `往画心方向轻收一点，回到 18%–38% 或 62%–82% 之间，给主体背后保留一点托底边余。`,
      tip: "偏轴不是把主体赶到墙角：背侧留出 18%–25% 托底，主体才站得稳。",
    };
  } else if (leadRoom < 0.52) {
    diag = {
      code: "facing-wall",
      badge: `错态 · 面壁堵死（前留 ${leadRoomPct}%）`,
      title: `主体明明偏开了，视线却一出门就撞墙`,
      body: `此刻${sceneMeta.subjectName}在${offsetSigned < 0 ? "左侧" : "右侧"} ${axisPct}%，却朝向窄边，前方留白只剩 ${leadRoomPct}%，身后反倒空出 ${backRoomPct}% 闲置空地。`,
      next: `点画布里的主体（或按 F / 下方「转身朝向」），让它面朝宽阔的${offsetSigned < 0 ? "右侧" : "左侧"}留白空间。`,
      tip: "把大片留白放在主体面向或行进的前方，画面立刻就有了「即将发生什么」的预期。",
    };
  } else if (state.anchorMode === "rival") {
    diag = {
      code: "rival-focus",
      badge: "错态 · 双雄抢戏",
      title: `${sceneMeta.anchorName}体量过重，变成两个主角打架`,
      body: `偏轴构图要靠主次反差突出唯一焦点。现在${sceneMeta.anchorName}放大到了 1.5×，视线在它和${sceneMeta.subjectName}之间反复拉锯，强调原则失效。`,
      next: `在下方把「呼应锚点」切到「轻巧呼应」，再拖到留白远端，以小体量、高对比隔空承接。`,
      tip: "对侧呼应物要「轻而醒目」：用小尺寸高饱和色块或远景微点承托，绝不喧宾夺主。",
    };
  } else if (!hasAnchor) {
    diag = {
      code: "void-unanchored",
      badge: "错态 · 空洞悬垂",
      title: `大片留白末端没有落点，视线滑出去收不回来`,
      body: `左侧主体虽然打开了 ${leadRoomPct}% 的呼吸空间，但留白远端完全空白，视觉重量单边下坠，画面像只剩半张没画完。`,
      next: `打开「轻巧呼应」，在斜前方的留白远端放一枚小而清晰的呼应点。`,
      tip: "大留白不是死空：在视线的远端埋一枚轻锚点，就能把目光稳稳托住并弹回主体。",
    };
  } else if (!anchorOppositeHalf || Math.abs(netTorque) > 0.18 || !anchorAhead) {
    diag = {
      code: "same-side-pile",
      badge: "错态 · 单边倾覆",
      title: `${sceneMeta.subjectName}和${sceneMeta.anchorName}没有隔空对撑`,
      body: `${!anchorOppositeHalf ? "两者挤在了同一侧，" : "远端呼应的力臂还不够或落在了身后，"}画面的视觉重量向一头倾倒（${leverLabel}），失衡还没转化为动态平衡。`,
      next: `直接拖动画布里的${sceneMeta.anchorName}，放到主体斜前方的对侧远端，拉长力臂把整幅画撑平。`,
      tip: "像一架不等臂杠杆：主体离中心近且重，对侧呼应物离中心远且轻，两边就能隔空平衡。",
    };
  } else if (activeClutterCount > 0) {
    diag = {
      code: "cluttered-void",
      badge: `错态 · 杂物绊眼（${activeClutterCount} 处）`,
      title: `留白走廊里混进了 ${activeClutterCount} 处${sceneMeta.clutterName}`,
      body: `偏轴构图最值钱的是主体与远端锚点之间那段干净的空气。杂块横在视线路径上，刚起跑的目光立刻被绊碎。`,
      next: `直接点击画布里带红圈标记的${sceneMeta.clutterName}将它清走（或点下方「清走杂物」）。`,
      tip: "原海报 TIP：大胆留白，给画面呼吸的空间；让视线自然被引导，而非被杂物打断。",
    };
  } else {
    const sideText = offsetSigned < 0 ? "左偏轴 · 朝右开放" : "右偏轴 · 朝左开放";
    diag = {
      code: "solved",
      badge: `4 / 4 成立 · ${sideText}`,
      title: `偏移、前留白与轻锚隔空对撑，张力和故事感都出来了`,
      body: `${sceneMeta.subjectName}稳落 ${axisPct}% 偏轴带，前方打开 ${leadRoomPct}% 干净呼吸空间；${sceneMeta.anchorName}在斜上方跨度 ${sightSpanPct}% 处以轻巧高对比承接，整幅画面达成${leverLabel}。`,
      next: `你可以试着把主体拖到另一侧、转身重构「${offsetSigned < 0 ? "右偏朝左" : "左偏朝右"}」镜像解，或切换「孤帆惊鸟 / 廊柱微光」验证同一规律。`,
      tip: "偏轴构图没有唯一坐标：只要「明显偏离 + 前方留白 + 远端轻承 + 走廊净空」同时成立，左右皆可成画。",
    };
  }

  return {
    geom,
    axisPct,
    offsetPct,
    axisZone,
    leadRoomPct,
    backRoomPct,
    sightSpanPct,
    sightAngleDeg,
    activeClutterCount,
    netTorque,
    leverLabel,
    leverState,
    pillars,
    passedCount,
    solved: passedCount === 4,
    diag,
    anchorPos: { x: ax, y: ay },
  };
}

// ---------- 02 节：构图逻辑方格配重板 ----------
export const LOGIC_PRESETS = {
  poster: {
    id: "poster",
    label: "原海报·斜纹重块",
    subject: { col: 4, row: 1 }, // 右上偏轴主体（0..5, 0..3）
    weightBox: { col: 0, row: 2, w: 3, h: 2 },
    kind: "hatch",
    note: "完全复刻 028 原海报「构图逻辑」：主体落右上三分交点，左下大片鲑红斜纹视觉重量跨中轴对撑，其余象限干净留白。",
  },
  sun: {
    id: "sun",
    label: "远端轻红点",
    subject: { col: 1, row: 2 },
    weightBox: { col: 4, row: 0, w: 1, h: 1 },
    kind: "dot",
    note: "阿恩海姆的「以轻博重」：左下深色大主体力臂较短，右上远端一小枚高饱和朱红圆点凭借更长力臂与强色彩对比撑平全局。",
  },
  title: {
    id: "title",
    label: "排字标题压角",
    subject: { col: 1, row: 2 },
    weightBox: { col: 3, row: 0, w: 3, h: 1 },
    kind: "type",
    note: "平面海报最常用的隐形配重：把深色大标题块刻意排在对侧偏右上方（正如 028 原海报的「偏轴构图」四字），让文字本身充当视觉配重。",
  },
  pile: {
    id: "pile",
    label: "同侧堆重（错例）",
    subject: { col: 4, row: 1 },
    weightBox: { col: 3, row: 2, w: 3, h: 2 },
    kind: "hatch",
    note: "翻车示范：主体与视觉重量全挤在右半边，左半幅塌成无意义空地，杠杆明显向右沉斜。",
  },
};

export function evaluateLogicGrid(subject, weightBox, kind) {
  // 网格 6 列 × 4 行，归一化重心计算
  const subX = (subject.col + 0.5) / 6;
  const subY = (subject.row + 0.5) / 4;
  const boxX = (weightBox.col + weightBox.w / 2) / 6;
  const boxY = (weightBox.row + weightBox.h / 2) / 4;

  const subWeight = 1.0;
  const area = (weightBox.w * weightBox.h) / 24;
  const boxWeight = kind === "dot" ? 0.62 : kind === "type" ? 0.85 : clamp(0.45 + area * 1.9, 0.5, 1.25);

  const subArm = subX - 0.5;
  const boxArm = boxX - 0.5;
  const torque = subWeight * subArm + boxWeight * boxArm;
  const oppositeSide = subArm * boxArm < -0.015;
  const balanced = oppositeSide && Math.abs(torque) <= 0.16;

  let verdict = "动态持平（示意）";
  let explain = `主体落在横轴 ${Math.round(subX * 100)}% 处，对侧配重中心在 ${Math.round(boxX * 100)}%，两侧力矩互相咬住，画面偏而不倒。`;
  if (!oppositeSide) {
    verdict = "同侧偏沉（示意）";
    explain = `主体（${Math.round(subX * 100)}%）与配重块（${Math.round(boxX * 100)}%）落在同一半幅，另一侧留白失去承接，视觉重心明显滑向一头。`;
  } else if (Math.abs(torque) > 0.16) {
    verdict = torque < 0 ? "左侧过重（示意）" : "右侧过重（示意）";
    explain = `虽然分居两侧，但${torque < 0 ? "左" : "右"}侧力矩依然压过对侧，把配重块再往边缘移一格或换更轻巧的呼应形式会更稳。`;
  }

  return {
    subX,
    subY,
    boxX,
    boxY,
    subWeight,
    boxWeight,
    torque,
    oppositeSide,
    balanced,
    verdict,
    explain,
  };
}

// ---------- 03 节：电影级朝向与反留白剧场 ----------
export const CINEMA_SCENES = {
  runner: {
    id: "runner",
    label: "奔跑留前路",
    en: "MOTION LEAD ROOM",
    openNote: (leadPct, dirWord) =>
      `行进方向打开 ${leadPct}% 宽阔前景，观众自然顺着脚步往${dirWord}看，期待下一秒冲入未知空间。`,
    shortNote: (leadPct) =>
      `把奔跑剪影推到同一侧却面朝近框，前方留白只剩 ${leadPct}%，鞋尖仿佛下一帧就会撞上黑边，画面瞬间透出阻滞与窘迫。`,
  },
  horizon: {
    id: "horizon",
    label: "背影望远山",
    en: "GAZE CORRIDOR",
    openNote: (leadPct) =>
      `正如 028 原海报与弗里德里希的远眺传统：视线跨过前方 ${leadPct}% 的空旷地平线，人在渺小中生出辽阔诗意。`,
    shortNote: (leadPct) =>
      `人物背对大片海天、直盯前方仅剩 ${leadPct}% 的画框边缘，开阔景致被浪费在脑后，情绪从辽阔变成回避与封闭。`,
  },
  thriller: {
    id: "thriller",
    label: "悬疑反留白",
    en: "INTENTIONAL SHORT-SIDING",
    openNote: (leadPct) =>
      `常规正向留白（前方 ${leadPct}%）让角色显得从容可控，观众把注意力放在角色前方即将抵达的目标。`,
    shortNote: (leadPct) =>
      `影史悬疑片常故意用「短边构图（Short-siding）」：前方仅留 ${leadPct}%，把身后大片暗影空出来——观众会本能警觉「他背后是不是藏着什么」。`,
  },
};

// ---------- 04 节：五件经核实的史料与典籍 ----------
export const LINEAGE_ITEMS = [
  {
    id: "mayuan",
    era: "南宋 · 约 13 世纪初",
    title: "马远《月下赏梅图》",
    en: "MA YUAN · ONE-CORNER COMPOSITION",
    meta: "大都会艺术博物馆藏（1986.493.2）· 团扇设色绢本",
    axis: "左下聚景 · 右上空朦月色",
    summary: "南宋院体画家马远（活跃于约 1190–1225）善用「边角之景」，被后世称为「马一角」。在《月下赏梅图》中，他把苍石、斜梅与临栏高士全收在团扇偏左一隅，让大半绢面化作清冷月色，仅以右上一点明月与淡峰隔空呼应。",
    takeaway: "东亚绘画早在八百年前就证明：把实景推离中心，空出来的不是空白，而是气氛本身。",
    diagram: { subject: [0.28, 0.68], anchor: [0.76, 0.24], mass: "corner-bl", labelS: "高士与斜梅", labelA: "淡月微峰" },
  },
  {
    id: "friedrich",
    era: "1808–1810 · 浪漫主义",
    title: "弗里德里希《海边修士》",
    en: "CASPAR DAVID FRIEDRICH · DER MÖNCH AM MEER",
    meta: "柏林国家博物馆 · 旧国家画廊藏 · 1810 年柏林学院首展",
    axis: "左下孤立微影 · 四分之三灰海长天",
    summary: "卡斯帕·大卫·弗里德里希把一袭深色修士背影压低在沙丘偏左位置，取消一切前景遮挡物，让暗海与巨幅灰云占据近四分之三画幅。当时在柏林展厅引发极大震动，海因里希·冯·克莱斯特形容观看它仿佛「眼睑被割去」。",
    takeaway: "极端偏轴配合极小主体比例，可以把「人面对宏大世界」的敬畏与孤寂放大到极致。",
    diagram: { subject: [0.29, 0.78], anchor: [0.74, 0.34], mass: "low-dune", labelS: "孤立修士", labelA: "辽阔灰云" },
  },
  {
    id: "hokusai",
    era: "约 1830–1832 · 浮世绘",
    title: "葛饰北斋《神奈川冲浪里》",
    en: "KATSUSHIKA HOKUSAI · THE GREAT WAVE",
    meta: "大都会艺术博物馆藏（JP1847）·《富岳三十六景》首图",
    axis: "左倾巨浪主势 · 右偏低处静岳",
    summary: "巨浪如巨爪从画面左侧高高拱起并向右扑下，三艘押送船顺着弧势切入浪谷；而真正的精神支点——覆雪的富士山却被放在偏右低处、小巧而静止，以沉稳的三角几何压住左侧排山倒海的动势。",
    takeaway: "偏轴动势与远端静点形成剧烈张力：大而动者偏左，小而静者偏右，动态平衡由此锁定。",
    diagram: { subject: [0.30, 0.42], anchor: [0.68, 0.68], mass: "wave-arc", labelS: "左倾巨浪", labelA: "静稳富士" },
  },
  {
    id: "degas",
    era: "1875–1876 · 印象派",
    title: "德加《咖啡馆里（苦艾酒）》",
    en: "EDGAR DEGAS · DANS UN CAFÉ",
    meta: "巴黎奥赛博物馆藏 · 布面油画 92 × 68.5 cm",
    axis: "右上挤压人物 · 左下空桌斜切",
    summary: "深受浮世绘与早期快照裁切启发，埃德加·德加把两位失神的巴黎茶客推挤到画布右上角，甚至毫不客气地截断右侧男子的肘部与烟斗；左下大片空荡的大理石桌面斜穿前景，把观者隔绝在冷清的距离之外。",
    takeaway: "把人物偏推到角落并保留前景空桌，让构图本身替人物说出疏离与沉默。",
    diagram: { subject: [0.72, 0.36], anchor: [0.24, 0.74], mass: "diag-tables", labelS: "右上二人", labelA: "空桌斜切" },
  },
  {
    id: "modern",
    era: "1928 / 1954 / 1982 · 理论奠基",
    title: "奇肖尔德与阿恩海姆",
    en: "TSCHICHOLD & ARNHEIM · DYNAMIC BALANCE",
    meta: "《新排版》（1928）·《艺术与视知觉》（1954/1974）·《中心的力量》（1982/1988）",
    axis: "打破古典中轴 · 隐蔽结构力场",
    summary: "1928 年扬·奇肖尔德在柏林出版《新排版》，明确告别古典居中对称，主张以大小、粗细、色块与主动留白建立「动态平衡」。随后格式塔心理学家鲁道夫·阿恩海姆用实验阐明：只要一个圆点稍微离开正方形几何中心，画框的隐蔽结构就会产生可感知的心理拉力，偏轴之所以生动，全在于这种方向性张力。",
    takeaway: "偏轴从画家的直觉沉淀为现代平面与交互设计的通用语法——留白不再是剩料，而是力场。",
    diagram: { subject: [0.32, 0.36], anchor: [0.74, 0.70], mass: "modern-grid", labelS: "偏置重块", labelA: "留白力场" },
  },
];

// ---------- 05 节：原海报四大应用场景 ----------
export const APP_SCENES = [
  {
    id: "portrait",
    title: "人像摄影",
    en: "PORTRAIT PHOTOGRAPHY",
    posterQuote: "增强情绪与故事性。",
    goodTitle: "偏左三分 + 视线留白",
    goodText: "人物侧影落于左侧偏轴，脸朝右侧大片柔和浅景深环境望去，留出呼吸与想象余地。",
    badTitle: "常见失误：居正中或面壁",
    badText: "人物僵直站在正中像证件照，或者明明偏在左侧却把面朝方向紧贴左框，情绪被当场憋住。",
  },
  {
    id: "landscape",
    title: "风景摄影",
    en: "LANDSCAPE PHOTOGRAPHY",
    posterQuote: "表现广阔空间与引导视线。",
    goodTitle: "偏轴孤树 + 远山呼应",
    goodText: "前景孤树或灯塔偏置一侧立起视觉起点，把三分之二的旷野与云层铺向远方，视线一路延伸。",
    badTitle: "常见失误：均分切半",
    badText: "孤树压在正中、地平线也死切一半，宽阔风景被切成对称的四块豆腐，空间感缩水。",
  },
  {
    id: "graphic",
    title: "平面设计",
    en: "GRAPHIC DESIGN",
    posterQuote: "制造层次与视觉节奏。",
    goodTitle: "图文错轴 + 留白呼吸",
    goodText: "主视觉图形偏左下方压阵，大标题与正文块落于右上偏轴列，视线沿对角线自然流转，层级分明。",
    badTitle: "常见失误：全员居中堆叠",
    badText: "图形、主标、副标、按钮一路沿中轴摞成圣诞树，每个元素都在争中心，节奏平板乏味。",
  },
  {
    id: "illustration",
    title: "插画创作",
    en: "ILLUSTRATION",
    posterQuote: "强化主题与动势表现。",
    goodTitle: "斜坡剪影 + 远日引线",
    goodText: "正如 028 原海报插画：主角停在左坡，斜向留白把目光送上右上朱红日轮，故事感一秒立住。",
    badTitle: "常见失误：大满贯填满",
    badText: "主角居中放大并把四周塞满配角与云朵，没有主次空白，动势和意境全被堵死。",
  },
];

// ---------- 07 节：两道单变量盲测小练习 ----------
export const QUIZ_ITEMS = [
  {
    id: "q1",
    index: "01",
    prompt: "同一幅「海边灯塔与海鸥」画面，四张构图只改变主体轴位与视线留白方向。哪一张最符合偏轴构图的核心要求？",
    variable: "单一变量：轴位与前方留白",
    answer: "C",
    options: [
      {
        key: "A",
        mode: "q1-center",
        why: "灯塔正好卡在 50% 居中轴线上，左右对称平静，但属于静态居中构图（016），没有打破中心制造方向张力。",
      },
      {
        key: "B",
        mode: "q1-wall",
        why: "灯塔虽然偏到了左侧 26%，但灯光束与海鸥全都朝向狭小的左边缘，形成「面壁堵死」，右侧大片空间白白浪费。",
      },
      {
        key: "C",
        mode: "q1-good",
        why: "正确答案。灯塔稳立左侧 28% 偏轴带，光束与视线向右侧宽阔海天打开，右上远端轻巧海鸥隔空呼应，偏移、留白与动感同时成立。",
      },
      {
        key: "D",
        mode: "q1-edge",
        why: "灯塔被挤到了最左 9% 边缘，轮廓紧贴画框随时像要裁出画面，背侧缺少喘息余量，产生失控挤压感。",
      },
    ],
  },
  {
    id: "q2",
    index: "02",
    prompt: "这一组把左偏 29%、朝右望的主体完全锁定不动，只改变其余元素的视觉重量安排。哪一张真正做到了「失衡中的平衡」？",
    variable: "单一变量：对侧呼应配重",
    answer: "C",
    options: [
      {
        key: "A",
        mode: "q2-same-side",
        why: "左下方又叠了一块深色大石块，所有视觉重量全部堆在左半边，右侧空空荡荡，整张画严重向左倾覆。",
      },
      {
        key: "B",
        mode: "q2-rival",
        why: "右侧摆了一块与主体同等体量、同等明度的深色巨块，变成两个主角互相打架，破坏了「强调单一焦点」的原则。",
      },
      {
        key: "C",
        mode: "q2-good",
        why: "正确答案。右侧远端用一枚小巧但高饱和的朱红日轮拉长力臂隔空承接，既撑平了视觉杠杆，又稳稳保住左侧主体的主角地位。",
      },
      {
        key: "D",
        mode: "q2-clutter",
        why: "留白走廊中段横插了三枚散乱色块，把本该引导视线的呼吸空间切得七零八落，目光还没走到远端就被打断。",
      },
    ],
  },
];
