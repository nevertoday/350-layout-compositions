// 177 右对齐 左参差 — 单真源排版几何与错态诊断引擎
// 画布渲染与读数诊单严格共享 computeLayout() 产出的逐行像素宽与坐标数组，无第二套常量。

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 昼夜球轴",
    shortLabel: "昼夜球轴",
    kicker: "POSTER 177 · COUNTERWEIGHT FIELD",
    massLabel: "配重圆",
    massKind: "orb",
    enLines: [
      "ALIGN THE RIGHT EDGE OF TEXT",
      "TO CREATE A RAGGED LEFT EDGE.",
      "THIS BUILDS VISUAL RHYTHM,",
      "STABILITY, AND DYNAMIC TENSION.",
    ],
    // 前 4 行为 177 原海报总述原话，5–10 行为拉长后进入长文过载区的续写
    lines: [
      "将文本的右侧边缘对齐，",
      "左侧自然形成参差变化，",
      "营造稳定有力的视觉节奏，",
      "增强版面的秩序与动感。",
      "可一旦把右对齐铺进长篇正文，",
      "视线每读完一行向右终线撞停，",
      "斜向回扫去寻下一行起笔时，",
      "左侧入口却每行前后忽远忽近，",
      "眼睛只得反复试探再修正落点，",
      "读完。",
    ],
  },
  gallery: {
    id: "gallery",
    label: "展墙 · 图签贴缝",
    shortLabel: "展墙图签",
    kicker: "GALLERY WALL · SEAM DOCKING",
    massLabel: "展画框",
    massKind: "frame",
    enLines: [
      "BASEL KUNSTHALLE · PLATE 04",
      "SILKSCREEN ON ARCHIVAL PAPER",
      "FLUSH RIGHT AGAINST THE SEAM",
    ],
    lines: [
      "《夜间网格研究 · 第七号》",
      "巴塞尔当代艺术馆藏 · 1967",
      "纸本丝网印刷 · 64 × 90 cm",
      "右终线紧扣右侧展墙边界。",
      "若在窄边栏继续堆满展评正文，",
      "把八九行导览解说一并靠右排，",
      "观众在画作前驻足细读的时候，",
      "目光反复回跳至起伏剧烈的左缘，",
      "稍一分神就会跳行或看错上一行，",
      "生累。",
    ],
  },
  ledger: {
    id: "ledger",
    label: "财报 · 末位表列",
    shortLabel: "财报表列",
    kicker: "LEDGER RAIL · TABULAR END",
    massLabel: "量级环",
    massKind: "ring",
    enLines: [
      "Q4 AUDITED SUMMARY · TABULAR",
      "UNIT: CNY · RIGHT-ALIGNED DIGITS",
    ],
    lines: [
      "Q4 净营收     ¥ 12,840,500",
      "年度研发       ¥ 2,195,000",
      "季度结余         ¥ 648,200",
      "同比增速            +18.4%",
      "披露说明：按权责发生制合并统计，",
      "若把整段财务附注也强行靠右排齐，",
      "核账人从行末折返左缘起笔位置，",
      "每行起点参差飘移失去固定标尺，",
      "逐条核对口径时极易串行漏读，",
      "慎用。",
    ],
  },
};

export const INITIAL_STATE = {
  scenario: "poster",
  align: "left",
  orbX: 0.43,
  lineCount: 8,
  colWidth: 0.46,
  nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// 多组合法解（全部实测 4/4 通过，供用户对比「不止一种正解」）
export const VALID_PRESETS = {
  classic: {
    id: "classic",
    label: "原海报经典解",
    patch: {
      align: "right",
      orbX: 0.18,
      lineCount: 4,
      colWidth: 0.44,
      nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  compact: {
    id: "compact",
    label: "紧凑展签解",
    patch: {
      align: "right",
      orbX: 0.30,
      lineCount: 3,
      colWidth: 0.41,
      nudges: [0, -2, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  stanza: {
    id: "stanza",
    label: "五言韵律解",
    patch: {
      align: "right",
      orbX: 0.21,
      lineCount: 5,
      colWidth: 0.47,
      nudges: [0, -2, 0, -2, 0, 0, 0, 0, 0, 0],
    },
  },
};

// 双向试错标本（每种刻意触发不同类别的真错态）
export const FAIL_PRESETS = {
  leftBroken: {
    id: "leftBroken",
    label: "左齐断轴",
    patch: {
      align: "left",
      orbX: 0.19,
      lineCount: 4,
      colWidth: 0.44,
      nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  proseOverload: {
    id: "proseOverload",
    label: "长文迷失",
    patch: {
      align: "right",
      orbX: 0.18,
      lineCount: 9,
      colWidth: 0.46,
      nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  rightCollapse: {
    id: "rightCollapse",
    label: "重心右塌",
    patch: {
      align: "right",
      orbX: 0.54,
      lineCount: 4,
      colWidth: 0.44,
      nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  justifyGap: {
    id: "justifyGap",
    label: "两端裂隙",
    patch: {
      align: "justify",
      orbX: 0.18,
      lineCount: 4,
      colWidth: 0.46,
      nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  widowStair: {
    id: "widowStair",
    label: "孤字阶梯",
    patch: {
      align: "right",
      orbX: 0.19,
      lineCount: 4,
      colWidth: 0.46,
      nudges: [2, 0, -3, -8, 0, 0, 0, 0, 0, 0],
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function createState(overrides = {}) {
  return {
    ...INITIAL_STATE,
    ...overrides,
    nudges: overrides.nudges
      ? [...overrides.nudges]
      : [...INITIAL_STATE.nudges],
  };
}

// 兜底宽度估算（无 canvas measureText 时仍与实绘高度一致）
export function fallbackMeasure(text, fontSize) {
  let w = 0;
  for (const ch of text) {
    if (ch.charCodeAt(0) > 0x2e80) w += fontSize * 1.0;
    else if (ch === " ") w += fontSize * 0.36;
    else w += fontSize * 0.56;
  }
  return w;
}

// 根据每行微调偏移，在不丢字的前提下真实改变行尾/行首分切（或对单行做修边缩进测试）
function applyLineNudges(rawLines, nudges, scenarioId) {
  const out = rawLines.map((s) => s);
  for (let i = 0; i < out.length; i++) {
    const n = nudges[i] || 0;
    if (!n) continue;
    if (scenarioId === "ledger" && i < 4) {
      // 表列前 4 行不可把数字切散，微调只影响文字与金额间的间隔
      if (n < 0) out[i] = out[i].replace(/\s{2,}/, " ".repeat(Math.max(1, 3 + n)));
      else out[i] = out[i].replace(/\s{2,}/, " ".repeat(5 + n * 2));
      continue;
    }
    const chars = [...out[i]];
    if (n < 0 && chars.length > 2) {
      const cut = Math.min(chars.length - 2, Math.abs(n));
      const tail = chars.splice(chars.length - cut, cut).join("");
      out[i] = chars.join("");
      if (i + 1 < out.length) {
        out[i + 1] = tail + out[i + 1];
      } else {
        // 末行再缩出孤尾（保留语义清晰，用于触发孤字反例）
        out[i] = chars.join("");
      }
    } else if (n > 0 && i + 1 < out.length) {
      const nextChars = [...out[i + 1]];
      if (nextChars.length > 2) {
        const pull = Math.min(nextChars.length - 2, n);
        const head = nextChars.splice(0, pull).join("");
        out[i] = out[i] + head;
        out[i + 1] = nextChars.join("");
      }
    }
  }
  return out.filter((s) => s.length > 0);
}

// 依据真实宽度限制对文本做软折行，确保极窄栏宽时真的会折出额外行、产生孤字或过密行数
function reflowToWidth(rawLines, maxW, measure) {
  const result = [];
  for (const line of rawLines) {
    if (measure(line) <= maxW || line.length <= 3) {
      result.push(line);
      continue;
    }
    // 按字符/词边界真实折行
    let cur = "";
    const tokens = line.match(/[A-Za-z0-9.,¥+%]+|\s+|./g) || [...line];
    for (const tok of tokens) {
      const cand = cur + tok;
      if (cur && measure(cand) > maxW) {
        result.push(cur.trimEnd());
        cur = tok.trimStart();
      } else {
        cur = cand;
      }
    }
    if (cur.trim()) result.push(cur.trimEnd());
  }
  return result.slice(0, 12);
}

/**
 * 单真源几何求解：给定画布逻辑尺寸与真实 measureFn，输出全套几何坐标与诊断结果。
 */
export function computeLayout(state, dims = { width: 920, height: 500 }, measureFn = null) {
  const W = dims.width;
  const H = dims.height;
  const compact = W < 540;
  const scenario = SCENARIOS[state.scenario] || SCENARIOS.poster;

  // 右终线位置与版面基准
  const spineX = Math.round(W * (compact ? 0.94 : 0.925));
  const shortH = H < 300;
  const effColRatio = compact ? clamp(state.colWidth + 0.12, 0.42, 0.66) : clamp(state.colWidth, 0.26, 0.56);
  const colW = Math.round(W * effColRatio);
  const colLeft = spineX - colW;

  // 左侧配重圆几何（始终正圆，绝不不等比变形）
  const orbR = Math.round(Math.min(W * (compact ? 0.135 : 0.140), H * (shortH ? 0.22 : compact ? 0.195 : 0.255)));
  const orbCx = Math.round(W * clamp(state.orbX, 0.08, 0.80));
  const orbCy = Math.round(H * (shortH ? 0.54 : compact ? 0.55 : 0.58));

  // 字号按场景、屏幕宽度、高度与行数自适应，避免窄屏或横屏折出碎片或溢底
  const rawBaseFont = compact
    ? clamp(Math.round(W * 0.036), 13, 15)
    : clamp(Math.round(W * 0.023), 16, 22);
  const activeCount = clamp(Math.round(state.lineCount), 1, 10);
  const maxLineBudget = Math.max(16, Math.floor((H - (shortH ? 86 : 112)) / Math.max(4, activeCount)));
  const scaledFont = Math.min(rawBaseFont, Math.max(11, Math.floor(maxLineBudget / 1.46)));
  const fontSize = activeCount >= 8 ? Math.max(11, Math.min(scaledFont, rawBaseFont - 1)) : scaledFont;
  const lineHeight = Math.max(fontSize + 5, Math.min(Math.round(fontSize * (activeCount >= 8 ? 1.46 : 1.62)), maxLineBudget));

  const measure = (txt) => (measureFn ? measureFn(txt, fontSize) : fallbackMeasure(txt, fontSize));

  // 取前 lineCount 行并应用手工修边偏移 + 栏宽真实折行
  const sliced = scenario.lines.slice(0, activeCount);
  const nudged = applyLineNudges(sliced, state.nudges || [], scenario.id);
  const wrapped = reflowToWidth(nudged, colW, measure);

  // 计算文本块垂直锚位
  const showEn = wrapped.length <= 5 && !shortH;
  const enFontSize = Math.max(10, Math.round(fontSize * 0.56));
  const enLineH = Math.round(enFontSize * 1.52);
  const enBlockH = showEn ? scenario.enLines.length * enLineH + 16 : 0;
  const totalTextH = wrapped.length * lineHeight + enBlockH;
  const topFloor = shortH ? Math.round(H * 0.16) : Math.round(H * 0.13);
  const startY = Math.round(
    clamp(topFloor + Math.max(0, (H - topFloor - 58 - totalTextH) * 0.35), topFloor, Math.round(H * 0.28))
  );

  // 逐行计算真实起止坐标与两端对齐内部拉伸比
  const lineBoxes = wrapped.map((text, idx) => {
    const rawW = measure(text);
    const y = startY + idx * lineHeight;
    const isLast = idx === wrapped.length - 1;
    let xLeft = colLeft;
    let xRight = colLeft + rawW;
    let drawW = rawW;
    let stretchRatio = 1;

    if (state.align === "right") {
      xRight = spineX;
      xLeft = spineX - rawW;
    } else if (state.align === "left") {
      xLeft = colLeft;
      xRight = colLeft + rawW;
    } else if (state.align === "center") {
      xLeft = colLeft + (colW - rawW) / 2;
      xRight = xLeft + rawW;
    } else if (state.align === "justify") {
      if (!isLast && wrapped.length > 1 && rawW < colW) {
        xLeft = colLeft;
        xRight = spineX;
        drawW = colW;
        stretchRatio = colW / Math.max(1, rawW);
      } else {
        xLeft = colLeft;
        xRight = colLeft + rawW;
      }
    }

    return {
      idx,
      text,
      rawW,
      drawW,
      xLeft,
      xRight,
      y,
      baselineY: y + fontSize * 0.86,
      height: lineHeight,
      stretchRatio,
      widthRatio: rawW / Math.max(1, colW),
    };
  });

  // 英文原海报副文块（仅短文案时呈现，保持清晰层次）
  const enStartY = startY + wrapped.length * lineHeight + 18;
  const enBoxes = showEn
    ? scenario.enLines.map((text, idx) => {
        const w = measureFn ? measureFn(text, enFontSize, true) : fallbackMeasure(text, enFontSize) * 1.05;
        let xLeft = colLeft;
        if (state.align === "right") xLeft = spineX - w;
        else if (state.align === "center") xLeft = colLeft + (colW - w) / 2;
        return {
          text,
          w,
          xLeft,
          xRight: xLeft + w,
          y: enStartY + idx * enLineH,
        };
      })
    : [];

  // 实测统计指标（全部来自 lineBoxes，绝不写死）
  const n = lineBoxes.length;
  const widths = lineBoxes.map((b) => b.rawW);
  const maxW = Math.max(1, ...widths);
  const minW = Math.min(...widths);
  const avgW = widths.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const minLeftX = Math.min(...lineBoxes.map((b) => b.xLeft));
  const maxRightGap = Math.max(...lineBoxes.map((b) => Math.abs(spineX - b.xRight)));

  // 左缘起伏幅（以最长行基准计算，排除两端对齐被强拉的情况）
  const leftStarts = lineBoxes.map((b) => b.xLeft);
  const leftMin = Math.min(...leftStarts);
  const leftMax = Math.max(...leftStarts);
  const leftRangePx = leftMax - leftMin;
  const ragSpread = state.align === "justify"
    ? 0
    : (maxW - minW) / Math.max(1, maxW);

  // 相邻行行首跳动均值（衡量回扫寻行头摆幅）
  let jumpSum = 0;
  for (let i = 1; i < n; i++) {
    jumpSum += Math.abs(lineBoxes[i].xLeft - lineBoxes[i - 1].xLeft);
  }
  const avgReturnJitterPx = n > 1 ? jumpSum / (n - 1) : 0;

  // 末行孤字检测
  const lastLine = lineBoxes[n - 1];
  const lastChars = lastLine ? [...lastLine.text.replace(/[，。！？、；：.,!?\s]/g, "")].length : 0;
  const lastRatio = lastLine ? lastLine.rawW / maxW : 1;
  const hasWidow = n >= 3 && (lastRatio < 0.30 || lastChars <= 2);

  // 阶梯状参差检测（连续 4 行严格单调增或单调减）
  let hasStaircase = false;
  if (n >= 4 && state.align === "right") {
    for (let i = 0; i <= n - 4; i++) {
      const d1 = lineBoxes[i + 1].rawW - lineBoxes[i].rawW;
      const d2 = lineBoxes[i + 2].rawW - lineBoxes[i + 1].rawW;
      const d3 = lineBoxes[i + 3].rawW - lineBoxes[i + 2].rawW;
      const minStep = maxW * 0.035;
      if (
        (d1 > minStep && d2 > minStep && d3 > minStep) ||
        (d1 < -minStep && d2 < -minStep && d3 < -minStep)
      ) {
        hasStaircase = true;
        break;
      }
    }
  }

  // 两端对齐内部最大拉伸倍比
  const maxStretch = Math.max(...lineBoxes.map((b) => b.stretchRatio));

  // 配重圆与文字左缘真实净空（px）
  const orbRightX = orbCx + orbR;
  const orbLeftX = orbCx - orbR;
  const clearancePx = minLeftX - orbRightX;

  // 光学重心估算（示意值：结合配重圆面积权重与文本块灰度面积权重）
  const orbWeight = Math.PI * orbR * orbR * 0.92;
  const textCenterX = lineBoxes.reduce((acc, b) => acc + (b.xLeft + b.xRight) * 0.5 * b.drawW, 0) /
    Math.max(1, lineBoxes.reduce((acc, b) => acc + b.drawW, 0));
  const textWeight = avgW * (n * lineHeight) * 0.42;
  const combinedCx = (orbCx * orbWeight + textCenterX * textWeight) / Math.max(1, orbWeight + textWeight);
  // 以画幅中心 0.5 为 0，正值为重心偏右，负值为偏左
  const gravityBias = (combinedCx / W) - 0.5;

  // 4 条水平张力虚线坐标（从配重圆垂轴连向文字区左缘，忠实复刻 177 原海报）
  const bridgeYs = [
    Math.round(H * 0.30),
    Math.round(H * 0.48),
    Math.round(H * 0.67),
    Math.round(H * 0.84),
  ];

  // ---------- 10 类真实错态双向检出 ----------
  const faults = [];

  // 1) 对齐方式类
  if (state.align === "left") {
    faults.push({
      id: "align_left",
      gate: "spine",
      severity: 100,
      badge: "右终线断裂",
      title: "当前是左对齐，右侧终线散成参差锯齿",
      why: `文字虽靠右侧摆布，但各行行尾长短不一，最大脱线达 ${Math.round(maxRightGap)}px。原本用来锁住整页气场的右侧竖向终线（┃）彻底消失，右边界显得松散无力。`,
      fix: "先把下方对齐切回「右对齐」，让所有行尾齐刷刷咬死在电光青柠终线上。",
    });
  } else if (state.align === "center") {
    faults.push({
      id: "align_center",
      gate: "spine",
      severity: 98,
      badge: "两侧虚浮",
      title: "居中排版把右终线抽空，文字在夜空里打飘",
      why: `居中让左右两边同时参差（右缘偏离终线达 ${Math.round(maxRightGap)}px），既没有 176 左对齐的固定起线，也没有 177 右对齐的硬朗终线，版面张力瞬间泄气。`,
      fix: "切回「右对齐」，把散开的文字块重新吸合到右侧终线轴上。",
    });
  } else if (state.align === "justify") {
    faults.push({
      id: "align_justify",
      gate: "spine",
      severity: 95,
      badge: "两端硬拉",
      title: `强行两端对齐抹平了左参差，还撑开 ${maxStretch.toFixed(2)}× 缝隙`,
      why: "把左缘硬拉成一条直线后，原本灵动的参差轮廓变成僵硬铁盒，引擎不得不把多余空隙硬塞进字词之间，既丢了动感又破坏灰度均匀。",
      fix: "切回「右对齐」，释放左侧自然参差并恢复正常字词间距。",
    });
  }

  // 2) 配重与碰撞类
  if (clearancePx < 18) {
    faults.push({
      id: "orb_collision",
      gate: "weight",
      severity: 96,
      badge: "配重撞字",
      title: `左侧${scenario.massLabel}挤到文字区（净空 ${Math.round(clearancePx)}px），张力通道被压碎`,
      why: `右对齐需要左侧视觉重物隔着一片安静负空间遥遥拉住文字。现在${scenario.massLabel}向右挤进文字左侧参差区，整页重心向右侧塌陷（重心偏右 ${Math.round(gravityBias * 100)}%），呼吸空间荡然无存。`,
      fix: `在画布上把青柠${scenario.massLabel}向左拖回左侧配重区（横坐标 14%–34%），拉出清晰的水平虚线张力桥。`,
    });
  } else if (state.orbX > 0.40) {
    faults.push({
      id: "orb_right_collapse",
      gate: "weight",
      severity: 88,
      badge: "重心右塌",
      title: `${scenario.massLabel}偏右停在 ${Math.round(state.orbX * 100)}%，整张版面右倾失衡`,
      why: `文字已经把重量锚在右终线，若${scenario.massLabel}也跟着挤向右半幅，左侧大片深海蓝就变成无主的死白，左右拉扯的「弓弦张力」立刻失效。`,
      fix: `把青柠${scenario.massLabel}往左拖到 14%–34% 区间，与右对齐文字形成一左一右的视觉对拉。`,
    });
  } else if (state.orbX < 0.115 || orbLeftX < 6) {
    faults.push({
      id: "orb_edge_clip",
      gate: "weight",
      severity: 82,
      badge: "贴死左框",
      title: `${scenario.massLabel}贴死左画框（${Math.round(state.orbX * 100)}%），呼吸边被挤没了`,
      why: "视觉锚点紧贴画幅外缘会产生向外滑落的压迫感，留出适度外边距才能让垂轴稳稳立住。",
      fix: `把青柠${scenario.massLabel}略向右回拉至 14%–34% 区间。`,
    });
  }

  // 3) 行数与回扫类
  if (n > 6) {
    faults.push({
      id: "prose_overload",
      gate: "sweep",
      severity: 92,
      badge: `长文 ${n} 行`,
      title: `右对齐硬排 ${n} 行长文，眼睛回扫每行都在左缘找起点`,
      why: `实测左侧起笔横坐标来回跳动（最大跨幅 ${Math.round(leftRangePx)}px，行间均值跳动 ${Math.round(avgReturnJitterPx)}px）。右对齐天生是短句、图签与表列工具，超过 6 行后回扫定位成本陡增，读起来明显吃力。`,
      fix: "把下方「文案行数」滑杆（或画布底端青柠行数闸）向上收短到 2–6 行，或按 Space 实看回扫光轨的折返卡顿。",
    });
  } else if (n < 2) {
    faults.push({
      id: "single_line",
      gate: "sweep",
      severity: 86,
      badge: "仅 1 行",
      title: "只剩 1 行文字，看不出右终线也无所谓左参差",
      why: "右对齐左参差至少需要两行以上才能由行尾连出一条视觉终线，并在左侧形成长短对比。",
      fix: "把「文案行数」拉到 3–5 行。",
    });
  }

  // 4) 参差轮廓类（孤字、阶梯、过平、锯齿）
  if (hasWidow) {
    faults.push({
      id: "widow_stub",
      gate: "rag",
      severity: 80,
      badge: "末行孤字",
      title: `末行只剩「${lastLine.text}」（仅占最宽行 ${Math.round(lastRatio * 100)}%），右下角缺口刺眼`,
      why: "右对齐的视觉重量汇集在右下终线，末行若突然只剩一两个孤字，整块文字像被啃掉一角，回扫节奏戛然而止。",
      fix: "调短行数避开孤尾，或在画布上直接点击倒数第二行轻推两字补齐末行。",
    });
  } else if (hasStaircase) {
    faults.push({
      id: "staircase_rag",
      gate: "rag",
      severity: 76,
      badge: "左缘阶梯",
      title: "左侧连续 4 行单调递减/递增，排成僵硬斜梯",
      why: "好的左参差应当像自然呼吸般长短交错；如果连续多行按同一方向递增或递减，左侧会冒出一条人工斜坡，喧宾夺主。",
      fix: "微调「栏宽」滑杆，或在画布上点击其中一行改变分切节奏，打破单调阶梯。",
    });
  } else if (state.align === "right" && n >= 2 && ragSpread < 0.075) {
    faults.push({
      id: "rag_too_flat",
      gate: "rag",
      severity: 72,
      badge: "参差过平",
      title: `左侧参差起伏只有 ${Math.round(ragSpread * 100)}%，像没排齐的方块`,
      why: "每一行几乎一样长，左侧既不齐也不散，观者会误以为是排版没对齐的失误，失去了右齐左参差特有的律动。",
      fix: "在画布上点按其中一行轻调分切，或微调栏宽，让左缘长短错落拉开到 8%–38%。",
    });
  } else if (state.align === "right" && n >= 2 && ragSpread > 0.44) {
    faults.push({
      id: "rag_too_wild",
      gate: "rag",
      severity: 78,
      badge: "锯齿过剧",
      title: `左侧参差起伏高达 ${Math.round(ragSpread * 100)}%，行首忽深忽浅`,
      why: "极长行与极短行紧挨在一起，左侧被咬出深坑，不仅视觉失衡，回扫时视线也要在左右之间大幅甩动。",
      fix: "放宽栏宽或点击过短/过长的行调整分切，把左缘起伏收束到 8%–38%。",
    });
  }

  faults.sort((a, b) => b.severity - a.severity);

  // 4 项独立门控（全部由同一组几何量决定）
  const gateSpine = state.align === "right";
  const gateSweep = n >= 2 && n <= 6;
  const gateRag =
    state.align === "right" &&
    n >= 2 &&
    !hasWidow &&
    !hasStaircase &&
    ragSpread >= 0.075 &&
    ragSpread <= 0.44;
  const gateWeight =
    state.orbX >= 0.115 &&
    state.orbX <= 0.40 &&
    orbLeftX >= 6 &&
    clearancePx >= 18;

  const score = [gateSpine, gateSweep, gateRag, gateWeight].filter(Boolean).length;

  // 匹配具体合法解风味（即便不是预设，只要 4/4 也认可为自定义合法解）
  let passFlavor = null;
  if (score === 4) {
    if (n <= 3 && state.orbX >= 0.26) {
      passFlavor = {
        tag: "4/4 · 紧凑展签解",
        title: "短句紧贴右终线，左侧配重近距咬合",
        why: `${n} 行精炼短句在右终线（┃）齐平截停，左侧参差起伏 ${Math.round(ragSpread * 100)}% 自然错落，${scenario.massLabel}与文字留出 ${Math.round(clearancePx)}px 干净通道，正是博物馆图签与边注的黄金比例。`,
        tip: "可以按 Space 放行回扫光轨，感受 3 行以内几乎零迟疑的阅读落点；也可以试着把行数拖到 8 行亲手把它弄坏。",
      };
    } else if (n >= 5) {
      passFlavor = {
        tag: "4/4 · 诗节韵律解",
        title: `${n} 行短节节奏舒展，左参差如音符起伏`,
        why: `虽然排到了 ${n} 行，但仍稳稳控制在 6 行回扫舒适上限内；左缘起伏 ${Math.round(ragSpread * 100)}% 无孤字无阶梯，与左侧${scenario.massLabel}隔着 ${Math.round(clearancePx)}px 暗场拉出稳定张力。`,
        tip: "再往上加到 7 行以上就会触碰回扫疲劳红线——这正是短诗宣言与长篇正文的分野。",
      };
    } else {
      passFlavor = {
        tag: "4/4 · 原海报均衡解",
        title: "右终线利落收束，左右张力恰到好处",
        why: `${n} 行文案以 0px 误差锁死右终线（┃），左侧参差起伏 ${Math.round(ragSpread * 100)}% 灵动不乱；${scenario.massLabel}稳驻左侧 ${Math.round(state.orbX * 100)}% 垂轴，隔着 ${Math.round(clearancePx)}px 午夜留白与右文形成明确拉扯（→）。`,
        tip: "按 Space 发射回扫光轨检验阅读路径，或点下方「试错对照」看它怎么在不同方向翻车。",
      };
    }
  }

  const primaryFault = faults[0] || null;
  const verdict = score === 4
    ? passFlavor
    : {
        tag: `${score}/4 · ${primaryFault.badge}`,
        title: primaryFault.title,
        why: primaryFault.why,
        tip: primaryFault.fix,
      };

  // 原海报三枚几何探针实时状态（┃ 终线统一 / → 张力明确 / ● 重心偏右）
  const probes = {
    clearEnd: {
      ok: gateSpine,
      text: gateSpine
        ? "0px 齐平"
        : state.align === "justify"
          ? `硬拉 ${maxStretch.toFixed(1)}×`
          : `偏离 ${Math.round(maxRightGap)}px`,
    },
    typoTension: {
      ok: gateRag && gateSweep,
      text: !gateSweep
        ? `${n} 行${n > 6 ? "过载" : "过短"}`
        : hasWidow
          ? "末行孤字"
          : hasStaircase
            ? "阶梯失律"
            : state.align !== "right"
              ? "未释参差"
              : `起伏 ${Math.round(ragSpread * 100)}%`,
    },
    rightEmphasis: {
      ok: gateWeight,
      text: clearancePx < 18
        ? "撞入文字"
        : state.orbX > 0.40
          ? "重心右塌"
          : state.orbX < 0.115
            ? "贴死左框"
            : `轴距 ${Math.round(clearancePx)}px`,
    },
  };

  return {
    W,
    H,
    compact,
    scenario,
    spineX,
    colW,
    colLeft,
    orb: { cx: orbCx, cy: orbCy, r: orbR, leftX: orbLeftX, rightX: orbRightX },
    fontSize,
    lineHeight,
    enFontSize,
    enLineH,
    lines: lineBoxes,
    enBoxes,
    bridgeYs,
    metrics: {
      lineCount: n,
      ragSpreadPct: Math.round(ragSpread * 100),
      leftRangePx: Math.round(leftRangePx),
      avgReturnJitterPx: Math.round(avgReturnJitterPx),
      clearancePx: Math.round(clearancePx),
      maxRightGapPx: Math.round(maxRightGap),
      orbPct: Math.round(state.orbX * 100),
      gravityBiasPct: Math.round(gravityBias * 100),
      maxStretch: Number(maxStretch.toFixed(2)),
    },
    gates: {
      spine: gateSpine,
      sweep: gateSweep,
      rag: gateRag,
      weight: gateWeight,
    },
    score,
    faults,
    verdict,
    probes,
  };
}
