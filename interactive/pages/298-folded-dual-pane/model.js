// 298 折叠双窗格 · 单真源状态与几何诊断模型
// 舞台绘制、左右引注、四栏实况横带、使用示例与白话诊单全部只读 evaluate(state) 的实算结果。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报构图",
    short: "原海报",
    mainTitle: "主窗 · 核心视觉画布",
    mainLead: "承载核心内容，减少干扰，提升专注度。",
    mainCards: [
      { id: "M1", title: "焦点模块 A", sub: "首屏核心摘要" },
      { id: "M2", title: "内容区块 B", sub: "主线叙述主体" },
      { id: "M3", title: "延伸卡片 C", sub: "底部补充落点" },
    ],
    subTitle: "副窗 · 补充信息",
    subItems: [
      { id: "S1", tag: "参考 01", title: "版面参数与网格说明", note: "与焦点模块 A 联动", mapTo: 0 },
      { id: "S2", tag: "高亮 02", title: "主次对比与视觉锚点", note: "与内容区块 B 联动", mapTo: 1 },
      { id: "S3", tag: "笔记 03", title: "状态切换与上下文记录", note: "与延伸卡片 C 联动", mapTo: 2 },
    ],
    actionLabel: "同步主副视图",
  },
  editorial: {
    id: "editorial",
    label: "长文批注",
    short: "长文批注",
    mainTitle: "主窗 · 终稿正文",
    mainLead: "逐段校读定稿文字，保持连续阅读节奏。",
    mainCards: [
      { id: "P1", title: "第一段 · 开篇立意", sub: "引出双面协作命题" },
      { id: "P2", title: "第二段 · 折轴边界", sub: "核对 1988–2026 年份" },
      { id: "P3", title: "第三段 · 结论收束", sub: "收口于情境保留" },
    ],
    subTitle: "副窗 · 修订与引注",
    subItems: [
      { id: "C1", tag: "批注 #1", title: "精简开头形容词", note: "对应第一段首句", mapTo: 0 },
      { id: "C2", tag: "核实 #2", title: "补齐 W3C 草案日期", note: "对应第二段史实", mapTo: 1 },
      { id: "C3", tag: "批注 #3", title: "补充窄屏降级去向", note: "对应第三段尾句", mapTo: 2 },
    ],
    actionLabel: "采纳当前修订",
  },
  code: {
    id: "code",
    label: "代码审查",
    short: "代码审查",
    mainTitle: "主窗 · 布局样式源码",
    mainLead: "专注审阅容器逻辑与折叠状态切换。",
    mainCards: [
      { id: "L1", title: "split-grid 容器", sub: "主副分栏列宽定义" },
      { id: "L2", title: "viewport-segments", sub: "物理折缝环境变量" },
      { id: "L3", title: "aria-expanded", sub: "焦点与展开语义" },
    ],
    subTitle: "副窗 · 检查器",
    subItems: [
      { id: "D1", tag: "指标 01", title: "容器实宽与行长检查", note: "关联 split-grid", mapTo: 0 },
      { id: "D2", tag: "告警 02", title: "折缝安全带 24px 校验", note: "关联 segments", mapTo: 1 },
      { id: "D3", tag: "测试 03", title: "折叠往返焦点与滚动", note: "关联 aria-expanded", mapTo: 2 },
    ],
    actionLabel: "通过本段审查",
  },
};

export const PRESETS = {
  // 开场刻意停在复合坏态：半掩夹角 + 副窗 52% 喧宾夺主 + 高噪抢焦 + 按钮跨折缝 + 折叠失忆
  initial: {
    label: "复原开场错态",
    foldDeg: 102,
    subRatio: 0.52,
    subNoise: true,
    crossSeam: true,
    preserveState: false,
    simWidth: 1280,
  },
  // 合法解 1：原海报经典立体展开对照
  openIdeal: {
    label: "展开对照解",
    foldDeg: 142,
    subRatio: 0.34,
    subNoise: false,
    crossSeam: false,
    preserveState: true,
    simWidth: 1280,
  },
  // 合法解 2：原海报折叠专注全幅
  foldedFocus: {
    label: "折叠专注解",
    foldDeg: 0,
    subRatio: 0.34,
    subNoise: false,
    crossSeam: false,
    preserveState: true,
    simWidth: 1280,
  },
  // 合法解 3：平板 / 折叠屏 180° 平摊对照
  flatSpread: {
    label: "平摊书页解",
    foldDeg: 180,
    subRatio: 0.36,
    subNoise: false,
    crossSeam: false,
    preserveState: true,
    simWidth: 880,
  },
  // 试错预设：副窗过窄挤碎
  errCramped: {
    label: "试错：副窗挤碎",
    foldDeg: 152,
    subRatio: 0.17,
    subNoise: false,
    crossSeam: false,
    preserveState: true,
    simWidth: 1280,
  },
  // 试错预设：390px 窄屏强行并排
  errNarrow: {
    label: "试错：窄屏硬拆",
    foldDeg: 150,
    subRatio: 0.38,
    subNoise: false,
    crossSeam: false,
    preserveState: true,
    simWidth: 390,
  },
};

export function createState() {
  return {
    scene: "poster",
    foldDeg: PRESETS.initial.foldDeg,
    targetFoldDeg: PRESETS.initial.foldDeg,
    subRatio: PRESETS.initial.subRatio,
    subNoise: PRESETS.initial.subNoise,
    crossSeam: PRESETS.initial.crossSeam,
    preserveState: PRESETS.initial.preserveState,
    simWidth: PRESETS.initial.simWidth,
    activeItem: 1, // 默认已定位在第 2 条，方便用户一折一开检验记忆是否保留
    savedItem: 1,
    wasClosed: false,
    lostCount: 0,
    lastEvent: "",
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 折角变化时检测「折起→重开」的上下文留存/失忆事件
export function syncFoldMemory(state) {
  const closedNow = state.foldDeg <= 14;
  if (closedNow && !state.wasClosed) {
    state.wasClosed = true;
    if (!state.preserveState) {
      if (state.activeItem !== 0) {
        state.activeItem = 0;
        state.lostCount += 1;
        state.lastEvent = "lost";
      } else {
        state.lostCount += 1;
        state.lastEvent = "lost";
      }
    } else {
      state.savedItem = state.activeItem;
      state.lastEvent = "retained";
    }
  } else if (!closedNow && state.wasClosed) {
    state.wasClosed = false;
    if (state.preserveState) {
      state.activeItem = state.savedItem;
      state.lastEvent = "restored";
    }
  }
}

// 单真源几何与认知诊断
export function evaluate(state) {
  const deg = clamp(state.foldDeg, 0, 180);
  const subRatio = clamp(state.subRatio, 0.16, 0.56);
  const simW = state.simWidth;

  // 折叠收起程度：0° 为完全收折（主窗回收至 100%），≥ 120° 视为完全展开占宽
  const isFolded = deg <= 14;
  const isHalf = deg > 14 && deg < 116;
  const isOpen = deg >= 116;
  const isFlat = deg >= 170;

  // 有效副窗物理占屏比例：随折角展开平滑过渡
  const foldSpread = clamp(deg / 138, 0, 1);
  // 真实透视投影压缩比（90° 时最斜，180° 最平）
  const rad = (deg * Math.PI) / 180;
  // 在 3D 折页里，副页围绕中轴从背面 (0°) 旋出到 180° 平摊，
  // 观察者视角下 0° 时重合于背面 (有效水平露宽 0)，138° 接近原海报斜展，180° 完全平摊
  const effectiveSubShare = isFolded ? 0 : subRatio * Math.sin(clamp(rad * 0.5, 0, Math.PI * 0.5));
  const mainShare = clamp(1 - effectiveSubShare, 0.44, 1);

  const mainPct = Math.round(mainShare * 100);
  const subPct = isFolded ? 0 : 100 - mainPct;
  const openSubPct = Math.round(subRatio * 100);
  const openMainPct = 100 - openSubPct;

  // 折叠后为主窗回收的面积百分比（相对于展开时副窗所占比例）
  const reclaimPotentialPct = openSubPct;
  const reclaimedNowPct = isFolded ? openSubPct : 0;

  // 基于模拟设备宽度的真实像素估算（扣 32px 外边距与 16px 中缝）
  const usableW = Math.max(320, simW - 32);
  const seamGap = isFolded ? 0 : simW === 880 ? 24 : 16;
  const mainPx = isFolded ? usableW : Math.round((usableW - seamGap) * (1 - subRatio));
  const subPx = isFolded ? 0 : Math.round((usableW - seamGap) * subRatio);

  // 估算主窗每行中文可读字数（按 16px 字号、左右内边距 48px 粗估，标注为示意）
  const charsPerLine = Math.max(8, Math.round((mainPx - 48) / 16));
  const subCharsPerLine = isFolded ? 0 : Math.max(5, Math.round((subPx - 36) / 14));
  const seamClearancePx = !isFolded && state.crossSeam ? 0 : 20;

  // 6 类双向失误逐项检定
  const issues = [];

  // 1. 390px 窄屏强开并排双窗
  if (simW <= 420 && !isFolded) {
    issues.push({
      key: "narrowDual",
      short: "窄屏硬拆双窗",
      title: `${simW}px 窄屏强行并排，主窗只剩 ${mainPx}px`,
      why: `手机竖屏宽仅 ${simW}px，硬塞左右双窗后主窗每行只剩约 ${charsPerLine} 个字，副窗更缩到 ${subPx}px 变成竖条。窄屏上应把副窗完全折叠，或改由底部抽屉唤出。`,
      hint: "向左拖画布把折角合到 0° 进入折叠专注，或切回 880 / 1280px 宽屏。",
      fixLabel: "合上副窗适应窄屏",
      fixPatch: { targetFoldDeg: 0, preserveState: true },
    });
  }

  // 2. 半折夹角卡壳（20°–115°）
  if (isHalf) {
    issues.push({
      key: "halfFold",
      short: `半掩夹角 ${Math.round(deg)}°`,
      title: `折角停在 ${Math.round(deg)}° 半掩态，聚焦与查阅两头落空`,
      why: `副窗既没收进主窗背后释放那 +${reclaimPotentialPct}% 的专注空间，又因为折角过窄在视线里被透视挤扁，补充信息看不清、主线也没静下来。`,
      hint: "在画布上向右拖过 130° 舒展展开对照，或向左拖到 0° 彻底收起副窗。",
      fixLabel: "舒展至原海报 142°",
      fixPatch: { targetFoldDeg: 142 },
    });
  }

  // 3. 副窗喧宾夺主（展开态：占比 ≥ 44% 或高噪抢焦）
  if (!isFolded && (subRatio >= 0.44 || state.subNoise)) {
    const both = subRatio >= 0.44 && state.subNoise;
    issues.push({
      key: "subDominant",
      short: both ? `副窗抢焦 ${openSubPct}%` : subRatio >= 0.44 ? `副窗过宽 ${openSubPct}%` : "副窗强色抢焦",
      title: both
        ? `副窗占走 ${openSubPct}% 且高饱和色块压过主窗`
        : subRatio >= 0.44
        ? `副窗占了 ${openSubPct}%，主窗反被挤到 ${openMainPct}%`
        : "副窗满屏强色块，把视线从主窗拽跑了",
      why: "副窗的角色是「随时查阅、不抢占焦点」。当它比主窗还宽、或塞进过高饱和度色块时，眼睛每次扫屏都会在左右两面反复拉锯，主次层级直接崩塌。",
      hint: "把副窗占比收到 25%–38% 区间，并关闭「副窗高噪抢焦」让它退居次席。",
      fixLabel: "退回 66:34 主次层级",
      fixPatch: { subRatio: 0.34, subNoise: false },
    });
  }

  // 4. 副窗过窄挤碎（展开态：占比 < 22%）
  if (!isFolded && subRatio < 0.22) {
    issues.push({
      key: "subCramped",
      short: `副窗过窄 ${openSubPct}%`,
      title: `副窗被压到 ${openSubPct}%（${subPx}px），参考信息全被折断`,
      why: `副窗单行只剩约 ${subCharsPerLine} 个字，批注和参数卡片折成碎词，用户反而要反复横向滚动或眯眼辨认。副窗展开时一般需保住 25%–38%（或 280–360px 经验宽）。`,
      hint: "把副窗占比调回 26%–38%，或干脆向左拖至 0° 折叠收起。",
      fixLabel: "拉宽副窗至 34%",
      fixPatch: { subRatio: 0.34 },
    });
  }

  // 5. 关键操作跨折缝裁切
  if (!isFolded && state.crossSeam) {
    issues.push({
      key: "crossSeam",
      short: "按钮跨折缝",
      title: "底部关键按钮骑在中轴折缝上，被折痕一劈两半",
      why: "无论在折叠屏物理铰链还是桌面分栏脊上，中轴都是天然的视觉断层。把操作条或标题横跨中线摆放，文字和点击区都会被直接割裂。",
      hint: "点击画布红标或下方「折缝避让」，把操作条归回主窗安全区（净空 ≥ 20px）。",
      fixLabel: "解除跨折缝裁切",
      fixPatch: { crossSeam: false },
    });
  }

  // 6. 折叠失忆（关闭情境保留）
  if (!state.preserveState) {
    issues.push({
      key: "noState",
      short: "折叠会失忆",
      title: state.lostCount > 0
        ? `刚才一折一开已重置 ${state.lostCount} 次，选定条目与进度全丢`
        : "折叠策略设为「销毁清零」，一收起就会丢失上下文",
      why: "原海报强调「折叠不丢失上下文，随时返回，思路不断」。如果收起副窗就把组件卸载重置，用户每次再打开都得重新滚动找刚才看的那一条，切换成本瞬间翻倍。",
      hint: "开启「情境保留」，再把副窗合上又打开，亲眼看选中的第 2 条稳稳停在原位。",
      fixLabel: "开启情境保留",
      fixPatch: { preserveState: true },
    });
  }

  // 综合结论（支持多组合法解：折叠专注解、展开对照解、平摊书页解）
  let status = "error";
  let badge = "";
  let headline = "";
  let why = "";
  let hint = "";
  let fixLabel = "";
  let fixPatch = null;

  if (issues.length > 0) {
    const top = issues[0];
    status = "error";
    badge = issues.length > 1 ? `${issues.length} 处待整 · ${top.short}` : `待整 · ${top.short}`;
    headline = top.title;
    why = top.why;
    hint = top.hint;
    fixLabel = issues.length > 1 ? "一键按本态纠偏" : top.fixLabel;
    fixPatch =
      issues.length > 1
        ? isFolded
          ? { preserveState: true, crossSeam: false, subNoise: false }
          : simW <= 420
          ? { targetFoldDeg: 0, preserveState: true, crossSeam: false, subNoise: false }
          : {
              targetFoldDeg: isHalf ? 142 : deg,
              subRatio: subRatio < 0.22 || subRatio >= 0.44 ? 0.34 : subRatio,
              subNoise: false,
              crossSeam: false,
              preserveState: true,
            }
        : top.fixPatch;
  } else if (isFolded) {
    status = "folded-ok";
    badge = `FOLDED · 回收 +${reclaimedNowPct}%`;
    headline = `折叠专注成立：副窗稳收背后，主窗独占 100%（${mainPx}px）`;
    why = `副窗折叠隐入主窗后方，右侧只留一道淡青折边与唤回耳签；你刚才锁定的第 ${state.activeItem + 1} 条语境完整保留，想对照时向右一拉立刻接上思路。`;
    hint = "向右拖画布或点右侧淡青折边，感受丝滑展开对照且上下文零丢失。";
    fixLabel = "展开至双面对照";
    fixPatch = { targetFoldDeg: 142 };
  } else if (isFlat) {
    status = "spread-ok";
    badge = `OPEN 180° · ${openMainPct}:${openSubPct}`;
    headline = `平摊书页解成立：${openMainPct}:${openSubPct} 舒展对照，折缝净空 ${seamClearancePx}px`;
    why = `双页在 ${simW}px 屏面上完全平摊，主窗占 ${mainPx}px（每行约 ${charsPerLine} 字）负责推进主线，副窗占 ${subPx}px 柔和承托补充信息且避开中轴，随时可一键收折回归沉浸。`;
    hint = "试试点副窗第 3 条再向左拖到 0° 收起，检验「情境保留」是否不断思路。";
    fixLabel = "收折进专注态";
    fixPatch = { targetFoldDeg: 0 };
  } else {
    status = "open-ok";
    badge = `OPEN ${Math.round(deg)}° · ${openMainPct}:${openSubPct}`;
    headline = `展开对照成立：主窗 ${openMainPct}% 稳居主角，副窗 ${openSubPct}% 温和承托`;
    why = `沿中央折轴呈 ${Math.round(deg)}° 立体展开：主窗宽 ${mainPx}px 聚焦核心、副窗宽 ${subPx}px 随时可查却不抢眼，折缝安全净空 ${seamClearancePx}px，情境保留就绪。`;
    hint = "现在向左拖到 0° 或拨动下方开关收起副窗，看主窗立刻回收 +" + reclaimPotentialPct + "% 空间。";
    fixLabel = "合上副窗试聚焦";
    fixPatch = { targetFoldDeg: 0 };
  }

  // 原海报四栏横带实时状态（单真源输出）
  const activeObj = SCENES[state.scene].subItems[state.activeItem];
  const pillars = {
    context: state.preserveState
      ? { ok: true, tag: `已锁 ${activeObj.id}`, detail: state.lastEvent === "restored" ? "往返 0 丢失" : "折合自动保留" }
      : { ok: false, tag: state.lostCount > 0 ? `已失忆 ${state.lostCount} 次` : "卸载清零", detail: "收起会丢进度" },
    space: isFolded
      ? { ok: true, tag: `已回收 +${reclaimedNowPct}%`, detail: `主窗独占 ${mainPx}px` }
      : simW <= 420
      ? { ok: false, tag: `窄屏挤至 ${mainPx}px`, detail: "需收起副窗" }
      : { ok: !isHalf, tag: isHalf ? "半掩未释放" : `可回收 +${reclaimPotentialPct}%`, detail: `主 ${openMainPct}% · 副 ${openSubPct}%` },
    structure:
      !isFolded && (subRatio >= 0.44 || subRatio < 0.22 || state.subNoise || state.crossSeam)
        ? {
            ok: false,
            tag: state.crossSeam ? "跨轴截断" : subRatio >= 0.44 || state.subNoise ? "主副倒挂" : "副窗挤碎",
            detail: `${openMainPct}:${openSubPct} · 净空 ${seamClearancePx}px`,
          }
        : {
            ok: true,
            tag: isFolded ? "100% 单焦主线" : `${openMainPct}:${openSubPct} 主次分明`,
            detail: `中轴净空 ${seamClearancePx}px`,
          },
    switchState: {
      ok: !isHalf,
      tag: isFolded ? "FOLDED · 已折叠" : isHalf ? `半掩 ${Math.round(deg)}°` : `OPEN · ${Math.round(deg)}°`,
      detail: isFolded ? "点击立刻展开" : "点击一键折叠",
    },
  };

  return {
    deg: Math.round(deg),
    isFolded,
    isHalf,
    isOpen,
    isFlat,
    openMainPct,
    openSubPct,
    mainPct,
    subPct,
    mainPx,
    subPx,
    charsPerLine,
    subCharsPerLine,
    reclaimPotentialPct,
    reclaimedNowPct,
    seamClearancePx,
    issues,
    status,
    badge,
    headline,
    why,
    hint,
    fixLabel,
    fixPatch,
    pillars,
  };
}
