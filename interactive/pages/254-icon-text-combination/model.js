// 254 图标文字组合 — 单真源几何与诊断模型
// 所有画面坐标、实测内距/组距、纵轴偏差、错态研判与实时 CSS 均只出自此模块。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 6 组",
    desc: "254 原海报 2×3 概念标本（图形识别 + 文字补充 + 组合成组）",
    items: [
      { id: "goal", icon: "goal", wrongIcon: "collab", title: "目标", en: "GOAL", body: "明确方向，设定可达成的目标。" },
      { id: "time", icon: "time", wrongIcon: "idea", title: "时间", en: "TIME", body: "合理安排，提升效率与节奏。" },
      { id: "idea", icon: "idea", wrongIcon: "time", title: "灵感", en: "IDEA", body: "捕捉想法，激发创造与思考。" },
      { id: "learning", icon: "learning", wrongIcon: "growth", title: "学习", en: "LEARNING", body: "持续积累，构建知识与能力。" },
      { id: "growth", icon: "growth", wrongIcon: "goal", title: "成长", en: "GROWTH", body: "不断进步，实现自我超越。" },
      { id: "collab", icon: "collab", wrongIcon: "learning", title: "协作", en: "COLLABORATION", body: "团队协同，创造更大价值。" },
    ],
  },
  navbar: {
    id: "navbar",
    label: "导航栏 UI",
    desc: "网页与移动应用顶部/侧边导航项的图文配对",
    items: [
      { id: "home", icon: "home", wrongIcon: "settings", title: "首页", en: "HOME", body: "回到主工作台，浏览动态概览。" },
      { id: "search", icon: "search", wrongIcon: "bell", title: "检索", en: "SEARCH", body: "输入关键词，直达文档与成员。" },
      { id: "explore", icon: "explore", wrongIcon: "bookmark", title: "发现", en: "EXPLORE", body: "浏览精选主题，追踪最新案例。" },
      { id: "bookmark", icon: "bookmark", wrongIcon: "explore", title: "收藏", en: "SAVED", body: "收拢常用条目，随时一键回看。" },
      { id: "bell", icon: "bell", wrongIcon: "search", title: "提醒", en: "ALERTS", body: "集中查看审批，跟进系统通知。" },
      { id: "settings", icon: "settings", wrongIcon: "home", title: "设置", en: "CONFIG", body: "调整界面偏好，管理访问权限。" },
    ],
  },
  actions: {
    id: "actions",
    label: "操作列表",
    desc: "工具栏与功能面板里「图标 + 动宾短语」高频任务项",
    items: [
      { id: "export", icon: "export", wrongIcon: "lock", title: "导出", en: "EXPORT", body: "打包离线文件，输出高清成图。" },
      { id: "schedule", icon: "schedule", wrongIcon: "cloud", title: "定时", en: "SCHEDULE", body: "预设发送窗口，开启周期提醒。" },
      { id: "collab", icon: "collab", wrongIcon: "history", title: "共享", en: "SHARE", body: "邀请协作者，实时批注编辑。" },
      { id: "cloud", icon: "cloud", wrongIcon: "schedule", title: "同步", en: "SYNC", body: "跨设备流转，保留最新改动。" },
      { id: "history", icon: "history", wrongIcon: "collab", title: "回溯", en: "HISTORY", body: "按时间线对比，一键恢复旧版。" },
      { id: "lock", icon: "lock", wrongIcon: "export", title: "加锁", en: "LOCK", body: "冻结当前终稿，防止误改覆写。" },
    ],
  },
};

export const PRESETS = {
  broken: {
    label: "复原开场错态",
    internalGap: 44,
    iconScale: 0.6,
    verticalOffset: 14,
    mode: "both",
    layout: "horizontal",
    semanticMismatch: false,
  },
  classic: {
    label: "原海报经典解",
    internalGap: 16,
    iconScale: 1.0,
    verticalOffset: 0,
    mode: "both",
    layout: "horizontal",
    semanticMismatch: false,
  },
  compact: {
    label: "紧凑工具栏解",
    internalGap: 10,
    iconScale: 0.84,
    verticalOffset: 0,
    mode: "both",
    layout: "horizontal",
    semanticMismatch: false,
  },
  stacked: {
    label: "上下堆叠解",
    internalGap: 12,
    iconScale: 0.96,
    verticalOffset: 0,
    mode: "both",
    layout: "vertical",
    semanticMismatch: false,
  },
  tryZero: {
    label: "试错：零缝撞字",
    internalGap: 1,
    iconScale: 1.04,
    verticalOffset: 0,
    mode: "both",
    layout: "horizontal",
    semanticMismatch: false,
  },
  tryGiant: {
    label: "试错：巨图压字",
    internalGap: 14,
    iconScale: 1.46,
    verticalOffset: 0,
    mode: "both",
    layout: "horizontal",
    semanticMismatch: false,
  },
};

export function createInitialState() {
  return {
    scene: "poster",
    selected: 2, // 默认指向原海报底栏成品卡「灵感 IDEA」
    internalGap: PRESETS.broken.internalGap,
    iconScale: PRESETS.broken.iconScale,
    verticalOffset: PRESETS.broken.verticalOffset,
    mode: PRESETS.broken.mode, // 'both' | 'icon-only' | 'text-only'
    layout: PRESETS.broken.layout, // 'horizontal' | 'vertical'
    semanticMismatch: PRESETS.broken.semanticMismatch,
    showGuides: true,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 统一几何引擎：计算 6 个图文单元在任意视口下的精确像素矩形 + 逻辑实测指标
// 关键诚实原则：画面上相邻两列「前组文字右沿 ↔ 后组图标左沿」的实际像素间距严格等于 groupGapPx，
// 让亲密性倒挂（内距 > 组距）在桌面与手机上均 100% 肉眼可证。
export function computeStageLayout(state, width, height) {
  const scene = SCENES[state.scene] || SCENES.poster;
  const cols = width >= 860 ? 3 : 2;
  const rows = Math.ceil(scene.items.length / cols);

  const padX = width >= 860 ? 22 : width >= 460 ? 12 : 8;
  const topPad = state.showGuides && state.mode === "both" && state.layout === "horizontal" ? 26 : 12;
  const bottomPad = 12;
  const innerW = Math.max(200, width - padX * 2);
  const innerH = Math.max(170, height - topPad - bottomPad);
  const rowH = innerH / rows;

  const internalGap = clamp(state.internalGap, 0, 52);
  const iconScale = clamp(state.iconScale, 0.45, 1.55);
  const verticalOffset = clamp(state.verticalOffset, -18, 18);
  const isVert = state.layout === "vertical";

  // 固定总间距预算：拉大内距直接压缩相邻组间距，真实演示「内距反超组距」
  const logicalGroupGap = isVert
    ? clamp(Math.round(54 - internalGap), 10, 54)
    : clamp(Math.round(64 - internalGap), 10, 64);

  const baseDiscDia = isVert ? 62 : 76;
  const logicalIconDia = Math.round(baseDiscDia * iconScale);

  // 图标过大 (>1.22×) 时挤压文字栏宽，真实演示「巨图压字」；默认紧贴中文两行实墨宽，让亲密性倒挂肉眼可证
  const squeezePenalty = iconScale > 1.22 ? (iconScale - 1.22) * 115 : 0;
  const logicalTextW = isVert
    ? clamp(160 - squeezePenalty * 0.35, 96, 160)
    : clamp(128 - squeezePenalty, 76, 128);

  const showIcon = state.mode !== "text-only";
  const showText = state.mode !== "icon-only";

  // 计算以逻辑单位表示的整阵总宽，再求统一等比缩放 s（圆盘永远正圆！）
  const logicalUnitW = isVert
    ? Math.max(showIcon ? logicalIconDia : 0, showText ? logicalTextW : 0)
    : (showIcon ? logicalIconDia : 0) + (showIcon && showText ? internalGap : 0) + (showText ? logicalTextW : 0);

  // 满幅排布基准逻辑总宽（以 classic 解为基准让画布在所有宽度下丰满不虚空）
  const refLogicalGridW = cols * (76 + 16 + 128) + (cols - 1) * 48;
  const curLogicalGridW = cols * logicalUnitW + (cols - 1) * logicalGroupGap;
  const maxLogicalGridW = Math.max(refLogicalGridW, curLogicalGridW);

  const scaleW = innerW / maxLogicalGridW;
  const scaleH = rowH / (isVert ? 124 : 108);
  const scale = clamp(Math.min(scaleW, scaleH), 0.52, 1.62);

  const discR = (logicalIconDia * 0.5) * scale;
  const gapPx = internalGap * scale;
  const groupGapPx = logicalGroupGap * scale;
  const textW = logicalTextW * scale;
  const unitW = logicalUnitW * scale;

  const actualGridW = cols * unitW + (cols - 1) * groupGapPx;
  const gridLeft = padX + (innerW - actualGridW) * 0.5;
  const pitchX = unitW + groupGapPx;

  // 竖脊与实心黑圆精准落在两列实绘墨迹的正中！
  const spineXs = [];
  for (let c = 0; c < cols - 1; c++) {
    const colRight = gridLeft + c * pitchX + unitW;
    spineXs.push(colRight + groupGapPx * 0.5);
  }
  const rowDivYs = [];
  for (let r = 1; r < rows; r++) rowDivYs.push(topPad + rowH * r);

  const cells = scene.items.map((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const ux = gridLeft + col * pitchX;
    const cellX = ux - groupGapPx * 0.35;
    const cellW = unitW + groupGapPx * 0.7;
    const cellY = topPad + row * rowH;
    const cellCx = ux + unitW * 0.5;
    const cellCy = cellY + rowH * 0.5;

    const activeIconId = state.semanticMismatch ? item.wrongIcon : item.icon;

    let iconRect = null;
    let textRect = null;

    if (!isVert) {
      const textH = Math.min(rowH - 22, 82 * scale);
      const textTop = cellCy - textH * 0.5;
      const iconCy = cellCy + verticalOffset * scale;

      if (showIcon && showText) {
        const iconCx = ux + discR;
        const textX = ux + discR * 2 + gapPx;
        iconRect = {
          cx: iconCx,
          cy: iconCy,
          r: discR,
          x: ux,
          y: iconCy - discR,
          w: discR * 2,
          h: discR * 2,
        };
        textRect = {
          x: textX,
          y: textTop,
          w: textW,
          h: textH,
          cy: cellCy,
        };
      } else if (showIcon) {
        iconRect = {
          cx: cellCx,
          cy: iconCy,
          r: discR,
          x: cellCx - discR,
          y: iconCy - discR,
          w: discR * 2,
          h: discR * 2,
        };
      } else if (showText) {
        textRect = {
          x: cellCx - textW * 0.5,
          y: textTop,
          w: textW,
          h: textH,
          cy: cellCy,
        };
      }
    } else {
      const textH = Math.min(rowH * 0.44, 52 * scale);
      const vGap = gapPx * 0.58;
      const totalH = (showIcon ? discR * 2 : 0) + (showIcon && showText ? vGap : 0) + (showText ? textH : 0);
      const topY = cellCy - totalH * 0.5;
      if (showIcon) {
        const iconCy = topY + discR;
        iconRect = {
          cx: cellCx,
          cy: iconCy,
          r: discR,
          x: cellCx - discR,
          y: iconCy - discR,
          w: discR * 2,
          h: discR * 2,
        };
      }
      if (showText) {
        const ty = showIcon ? topY + discR * 2 + vGap : cellCy - textH * 0.5;
        textRect = {
          x: cellCx - textW * 0.5,
          y: ty,
          w: textW,
          h: textH,
          cy: ty + textH * 0.5,
        };
      }
    }

    return {
      idx,
      col,
      row,
      item,
      activeIconId,
      cellRect: { x: cellX, y: cellY, w: cellW, h: rowH, cx: cellCx, cy: cellCy },
      iconRect,
      textRect,
    };
  });

  // 从实绘矩形回测像素级内距与组距
  let measuredPixelInternalGap = gapPx;
  let measuredPixelGroupGap = groupGapPx;
  if (cells.length >= 2 && cells[0].textRect && cells[1].iconRect && !isVert) {
    measuredPixelInternalGap = Math.max(0, cells[0].textRect.x - (cells[0].iconRect.x + cells[0].iconRect.w));
    measuredPixelGroupGap = Math.max(4, cells[1].iconRect.x - (cells[0].textRect.x + cells[0].textRect.w));
  }

  return {
    scene,
    cols,
    rows,
    width,
    height,
    padX,
    topPad,
    bottomPad,
    gridLeft,
    actualGridW,
    colW: pitchX,
    rowH,
    scale,
    spineXs,
    rowDivYs,
    cells,
    metrics: {
      internalGap: Math.round(internalGap),
      groupGap: Math.round(logicalGroupGap),
      ratio: +(logicalGroupGap / Math.max(1, internalGap)).toFixed(2),
      iconScale: +iconScale.toFixed(2),
      iconScaleStr: iconScale.toFixed(2),
      iconDia: logicalIconDia,
      verticalOffset: Math.round(verticalOffset),
      textColWidth: Math.round(logicalTextW),
      measuredPixelInternalGap: Math.round(measuredPixelInternalGap),
      measuredPixelGroupGap: Math.round(measuredPixelGroupGap),
    },
  };
}

// 单真源诊断器：读 computeStageLayout 的输出，识别 7 类双向真错态与多组合法解
export function diagnose(state, layout) {
  const m = layout.metrics;
  const issues = [];

  if (state.mode === "icon-only") {
    issues.push({
      id: "missing-label",
      pillar: "text",
      tag: "纯图猜谜",
      title: "只留图标不配文字，界面退化成猜谜游戏",
      why: "除了极少数全球通识符号（如放大镜、房屋），绝大多数图标单独出现都有多重解读——比如这枚山峰旗帜既像「目标」也像「里程碑」或「登山」。Wiedenbeck (1999) 与 NN/g (2014) 的可用性研究都证明，新手面对纯图标界面时试错率最高。",
      actionLabel: "补回文字标签",
      fix: { mode: "both" },
    });
  } else if (state.mode === "text-only") {
    issues.push({
      id: "missing-icon",
      pillar: "icon",
      tag: "缺图失锚",
      title: "拿掉图标只剩纯文字，六组条目失去扫视锚点",
      why: "人眼能先于阅读文字捕捉图形轮廓（预注意加工）。去掉 6 枚双色圆标后，视线必须逐字辨认标题才能区分条目，视觉扫描节奏明显放慢。",
      actionLabel: "恢复图形圆标",
      fix: { mode: "both" },
    });
  }

  if (state.semanticMismatch && state.mode === "both") {
    issues.push({
      id: "semantic-mismatch",
      pillar: "icon",
      tag: "图意背离",
      title: "图标隐喻与文字含义在打架，双重编码反成干扰",
      why: "此刻「时间」配了灯泡、「灵感」配了时钟——图形通道与语言通道给出相反信号，读者必须额外花脑力压制第一眼直觉。图形识别必须与文字指向同一概念。",
      actionLabel: "对齐图意配对",
      fix: { semanticMismatch: false },
    });
  }

  if (state.mode === "both") {
    if (m.internalGap < 6) {
      issues.push({
        id: "collision-zero",
        pillar: "group",
        tag: `撞字 ${m.internalGap}px`,
        title: `图字内距仅 ${m.internalGap}px，圆标边缘直接贴撞首字`,
        why: "把内距拉过头同样是错。圆标轮廓与汉字左笔画之间没有缓冲呼吸缝，两者的笔画在余光里黏成一团，既损图形轮廓也损识字清晰度。",
        actionLabel: "拉开到 16px 呼吸缝",
        fix: { internalGap: 16 },
      });
    } else if (m.ratio <= 1.0) {
      issues.push({
        id: "proximity-invert",
        pillar: "group",
        tag: `倒挂 ${m.internalGap}>${m.groupGap}`,
        title: `亲密性倒挂：图字内距 ${m.internalGap}px 已超过组间外距 ${m.groupGap}px`,
        why: `根据格式塔亲密性原则，眼睛会把距离更近的元素划成一组。现在同一组的图字相隔 ${m.internalGap}px，反倒比相邻两列的间隔 ${m.groupGap}px 更远——扫视时右列圆标会错吸向左列文字，整个图文单元散架。`,
        actionLabel: "收紧内距到 16px",
        fix: { internalGap: 16 },
      });
    } else if (m.ratio < 1.5) {
      issues.push({
        id: "proximity-blur",
        pillar: "group",
        tag: `边界模糊 ${m.ratio}×`,
        title: `外距仅为内距的 ${m.ratio} 倍，归属感还不够明确`,
        why: `经验上组间外距至少要达到图字内距的 1.5–2 倍，眼睛才不用费劲分辨「这个图标到底配左边还是配右边」。当前外距 ${m.groupGap}px 与内距 ${m.internalGap}px 太接近，再收紧一点就能稳稳咬合。`,
        actionLabel: "收紧到 16px 明确归属",
        fix: { internalGap: 16 },
      });
    }

    if (state.layout === "horizontal" && Math.abs(m.verticalOffset) > 3) {
      const dir = m.verticalOffset > 0 ? "下沉" : "上浮";
      const sign = m.verticalOffset > 0 ? `+${m.verticalOffset}` : `${m.verticalOffset}`;
      issues.push({
        id: "axis-drift",
        pillar: "group",
        tag: `脱轴 ${sign}px`,
        title: `图标${dir} ${Math.abs(m.verticalOffset)}px，与文字块光学中轴错位`,
        why: `横排图文组合靠一条隐形水平中轴把图形和文字穿成一体。图标偏离中线 ${Math.abs(m.verticalOffset)}px 后，视线从圆标滑向标题时被迫上下折跳，显得像临时拼贴的草稿。`,
        actionLabel: "归回 0px 光学中轴",
        fix: { verticalOffset: 0 },
      });
    }
  }

  if (state.mode !== "text-only") {
    if (m.iconScale < 0.72) {
      issues.push({
        id: "icon-too-small",
        pillar: "icon",
        tag: `蚁图 ${m.iconScaleStr}×`,
        title: `图标缩到 ${m.iconScaleStr}×（${m.iconDia}px），权重太轻像一粒噪点`,
        why: "图标缩得过小，内部双色结构糊在一起，无法在扫视第一瞬间承担「图形识别」的分工；和旁边粗黑中文标题相比头轻脚重，视觉层级失衡。",
        actionLabel: "放大图标到 1.00×",
        fix: { iconScale: 1.0 },
      });
    } else if (m.iconScale > 1.32) {
      issues.push({
        id: "icon-too-large",
        pillar: "icon",
        tag: `巨图 ${m.iconScaleStr}×`,
        title: `图标膨大到 ${m.iconScaleStr}×（${m.iconDia}px），反客为主挤压文字`,
        why: `巨大的圆盘抢走全部注意力，右侧文字栏被硬生生挤窄到约 ${m.textColWidth}px，文字被迫折成碎行；图文组合讲究的是协同，不是大图标吞掉文字。`,
        actionLabel: "回落到 1.00× 均衡尺度",
        fix: { iconScale: 1.0 },
      });
    }
  }

  const iconIssue = issues.find((i) => i.pillar === "icon");
  const textIssue = issues.find((i) => i.pillar === "text");
  const groupIssue = issues.find((i) => i.pillar === "group");

  const triad = {
    icon: iconIssue
      ? { ok: false, badge: iconIssue.tag }
      : { ok: true, badge: `${m.iconScaleStr}× · 可辨` },
    text: textIssue
      ? { ok: false, badge: textIssue.tag }
      : { ok: true, badge: "语义明确" },
    group: groupIssue
      ? { ok: false, badge: groupIssue.tag }
      : state.mode !== "both"
        ? { ok: false, badge: "缺半成不了组" }
        : { ok: true, badge: `外/内 ${m.ratio}×` },
  };

  let styleName = "";
  let okSummary = "";
  if (issues.length === 0) {
    if (state.layout === "vertical") {
      styleName = "上下堆叠成组";
      okSummary = `图标居中立在文字上方 ${m.internalGap}px，组间留白 ${m.groupGap}px（${m.ratio}×）清清楚楚。这种垂直图文单元最适合手机底栏与居中功能宫格。`;
    } else if (m.internalGap <= 13 && m.iconScale <= 0.92) {
      styleName = "紧凑内联成组";
      okSummary = `图标 ${m.iconScaleStr}× 紧随文字左侧 ${m.internalGap}px、中轴齐平，外距拉到 ${m.groupGap}px（${m.ratio}×）。这是工具栏按钮与顶部导航最利落的咬合比例。`;
    } else if (m.internalGap >= 20) {
      styleName = "舒展展陈成组";
      okSummary = `圆标饱满（${m.iconScaleStr}×），图字保持 ${m.internalGap}px 呼吸感，同时外距留足 ${m.groupGap}px（${m.ratio}×），兼顾海报级气度与一眼归组。`;
    } else {
      styleName = "原海报经典成组";
      okSummary = `图标（${m.iconScaleStr}×）与文字沿 0px 光学中轴对齐，内距 ${m.internalGap}px 明显小于组距 ${m.groupGap}px（${m.ratio}×）——先凭形状定位，再用文字确认，图文真正合为一体。`;
    }
  }

  const primary = issues[0] || null;

  const emSize = +(1.15 * m.iconScale).toFixed(2);
  const gapEm = +(m.internalGap / 16).toFixed(2);
  const groupEm = +(m.groupGap / 16).toFixed(2);
  const css =
    state.layout === "vertical"
      ? `.icon-text-grid {\n  display: grid;\n  gap: ${groupEm}rem; /* 组间外距 ${m.groupGap}px */\n}\n.icon-text {\n  display: inline-flex;\n  flex-direction: column;\n  align-items: center;\n  gap: ${gapEm}em; /* 图字内距 ${m.internalGap}px */\n}\n.icon-text svg {\n  width: ${emSize}em;\n  height: ${emSize}em;\n  flex: none;\n}`
      : `.icon-text-grid {\n  display: grid;\n  column-gap: ${groupEm}rem; /* 组间外距 ${m.groupGap}px */\n}\n.icon-text {\n  display: inline-flex;\n  align-items: center;\n  gap: ${gapEm}em; /* 图字内距 ${m.internalGap}px */\n}\n.icon-text svg {\n  width: ${emSize}em;\n  height: ${emSize}em;\n  flex: none;${m.verticalOffset !== 0 ? `\n  transform: translateY(${m.verticalOffset}px); /* 光学偏轴 */` : ""}\n}`;

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    primary,
    triad,
    styleName,
    okSummary,
    css,
    badgeText:
      issues.length === 0
        ? `✓ ${styleName} · 外/内 ${m.ratio}×`
        : `× ${issues.length} 处待校准 · ${primary.tag}`,
  };
}
