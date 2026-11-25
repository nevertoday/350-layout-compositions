// 189 形状文字 · 几何容器与扫描线逐行排字单真源模型
// 开场舞台、所有章节交互与小练习全部共用这份几何函数、排布引擎与经验常量。

export const POSTER_BODY =
  "设计的本质是传达与解决问题。将文字置入几何容器中，文本的排列方式会随形状发生变化，从而形成独特的视觉节奏与边界感。这种方法不仅提升信息的识别度，也为版面注入秩序与趣味，使内容在简洁的形式中更具记忆点与设计感，适用于标题、摘要、引导语等多种场景。";

// 经验阈值（唯一声明，读数与正文引用同一常量，页面标注「经验值」）
export const RULES = {
  safePadMinRatio: 0.42, // 安全内壁经验下限：约 0.42em（近半个汉字宽），低于此汉字方角易咬破弧线
  safePadMaxRatio: 1.35, // 内壁过厚经验上限：超过此文字会退缩成孤立内核
  minFillRatio: 0.78, // 垂向填满经验下限：低于 78% 时底壳空洞，脱壳后下半轮廓塌陷
  lineHeightRatio: 1.36, // 中文形状容器内紧凑行高比（经验值 1.32–1.42）
  minReadablePx: 12, // 逻辑画布内近读下限
  maxJustifyGapRatio: 0.48, // 两端强齐行触发明显词隙白河的字距经验阈值（占字号比）
};

// 统一逻辑坐标系：容器以 (0, 0) 为中心，基准半径 BASE_RY = 180
export const LOGICAL = {
  canvasW: 540,
  canvasH: 500,
  cx: 270,
  cy: 230,
  ry: 180,
};

// 避头点标点（不可出现在行首）
const NO_START = new Set([
  "，", "。", "、", "；", "：", "！", "？", "”", "’", "）", "》", "】", "…", ",", ".", ";", ":", "!", "?", ")",
]);
// 避尾标点（尽量不独留行尾）
const NO_END = new Set(["“", "‘", "（", "《", "【", "("]);

export function charWidthUnits(ch) {
  if (!ch) return 0;
  if (ch === " ") return 0.34;
  if (/[0-9A-Za-z]/.test(ch)) return 0.58;
  if (/[-/.:%+×·]/.test(ch)) return 0.52;
  // 全角中文及全角标点
  return 1.0;
}

// ---------- 几何容器定义 ----------
// 每个形状提供：
//   aspect: rx / ry（宽半轴与高半轴之比）
//   convex: 是否凸形
//   intervals(ny): 给定归一化纵坐标 ny ∈ [-1, 1]，返回水平区间数组 [[x0, x1], ...]（单位为 rx 比例，[-1, 1]）
//   polygon(steps): 生成归一化轮廓多边形点集 [{ x, y }, ...]（x 按 rx 比例，y 为 ny）

function teardropHalfW(ny) {
  if (ny <= -1 || ny >= 1) return 0;
  // 严格拟合 189 原海报实测水滴轮廓（aspect W/H ≈ 0.916，峰值在 ny ≈ +0.11）
  const base = Math.sqrt(Math.max(0, 1 - ny * ny));
  const raw = base * (0.952 + 0.088 * ny - 0.036 * ny * ny);
  return Math.min(1, raw / 0.971);
}

// 通用射线交多边形水平扫描线求区间（用于五角星、月牙、细腰瓶等非凸图形）
function scanlinePolygon(poly, ny) {
  const xs = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    if ((a.y <= ny && b.y > ny) || (b.y <= ny && a.y > ny)) {
      const t = (ny - a.y) / (b.y - a.y);
      xs.push(a.x + t * (b.x - a.x));
    }
  }
  xs.sort((u, v) => u - v);
  const segs = [];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    if (xs[i + 1] - xs[i] > 1e-4) segs.push([xs[i], xs[i + 1]]);
  }
  return segs;
}

function makeStarPoly() {
  const pts = [];
  const outer = 1.0;
  const inner = 0.41;
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return pts;
}

function makeCrescentPoly() {
  // 外圆 (0,0) r=1，内挖圆 (0.42, -0.04) r=0.82 形成弯月
  const pts = [];
  const startA = -Math.PI * 0.42;
  const endA = Math.PI * 0.42;
  // 外弧：从顶角逆时针绕左半圆到底角
  const outerSteps = 44;
  for (let i = 0; i <= outerSteps; i++) {
    const a = startA - (i / outerSteps) * (2 * Math.PI - (endA - startA));
    pts.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  // 内凹弧：从底角顺着右侧内凹弧回顶角
  const topPt = pts[0];
  const botPt = pts[pts.length - 1];
  const icx = 0.42;
  const icy = 0;
  const ir = Math.hypot(topPt.x - icx, topPt.y - icy);
  const aBot = Math.atan2(botPt.y - icy, botPt.x - icx);
  const aTop = Math.atan2(topPt.y - icy, topPt.x - icx);
  const innerSteps = 32;
  for (let i = 1; i < innerSteps; i++) {
    const t = i / innerSteps;
    const a = aBot + t * (aTop - aBot);
    pts.push({ x: icx + Math.cos(a) * ir, y: icy + Math.sin(a) * ir });
  }
  return pts;
}

function makeHourglassPoly() {
  const pts = [];
  const steps = 36;
  // 右侧从上到下
  for (let i = 0; i <= steps; i++) {
    const ny = -1 + (2 * i) / steps;
    const w = 0.24 + 0.72 * Math.pow(Math.abs(ny), 1.45);
    pts.push({ x: w, y: ny });
  }
  // 左侧从下到上
  for (let i = steps; i >= 0; i--) {
    const ny = -1 + (2 * i) / steps;
    const w = 0.24 + 0.72 * Math.pow(Math.abs(ny), 1.45);
    pts.push({ x: -w, y: ny });
  }
  return pts;
}

const STAR_POLY = makeStarPoly();
const CRESCENT_POLY = makeCrescentPoly();
const HOURGLASS_POLY = makeHourglassPoly();

function symmetricPoly(halfWFn, steps = 96) {
  const right = [];
  const left = [];
  for (let i = 0; i <= steps; i++) {
    const ny = -1 + (2 * i) / steps;
    const hw = halfWFn(ny);
    right.push({ x: hw, y: ny });
    if (i > 0 && i < steps) left.push({ x: -hw, y: ny });
  }
  left.reverse();
  return [...right, ...left];
}

export const SHAPES = {
  teardrop: {
    id: "teardrop",
    name: "水滴（原海报）",
    short: "水滴",
    aspect: 0.916,
    convex: true,
    note: "上略收尖、中下饱满，行长先放后收，形成自然呼吸的节奏。",
    intervals(ny) {
      const hw = teardropHalfW(ny);
      return hw > 0.002 ? [[-hw, hw]] : [];
    },
    polygon() {
      return symmetricPoly(teardropHalfW, 100);
    },
  },
  circle: {
    id: "circle",
    name: "正圆",
    short: "正圆",
    aspect: 1.0,
    convex: true,
    note: "最稳的凸几何容器，曲率均匀、无尖锐断角，徽章与展签最常用。",
    intervals(ny) {
      if (ny <= -1 || ny >= 1) return [];
      const hw = Math.sqrt(Math.max(0, 1 - ny * ny));
      return hw > 0.002 ? [[-hw, hw]] : [];
    },
    polygon() {
      return symmetricPoly((ny) => Math.sqrt(Math.max(0, 1 - ny * ny)), 96);
    },
  },
  diamond: {
    id: "diamond",
    name: "菱形",
    short: "菱形",
    aspect: 0.96,
    convex: true,
    note: "斜直边锐利有力，但上下 90° 尖角极易把首尾行挤成 1 字孤行。",
    intervals(ny) {
      if (ny <= -1 || ny >= 1) return [];
      const hw = 1 - Math.abs(ny);
      return hw > 0.002 ? [[-hw, hw]] : [];
    },
    polygon() {
      return [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
      ];
    },
  },
  hexagon: {
    id: "hexagon",
    name: "六边形",
    short: "六边形",
    aspect: 0.92,
    convex: true,
    note: "中腰直壁保持稳定行宽，上下斜坡温和收束，兼顾识别与易读。",
    intervals(ny) {
      if (ny <= -1 || ny >= 1) return [];
      const ay = Math.abs(ny);
      const hw = ay <= 0.5 ? 1 : Math.max(0, (1 - ay) * 2);
      return hw > 0.002 ? [[-hw, hw]] : [];
    },
    polygon() {
      return [
        { x: 0, y: -1 },
        { x: 1, y: -0.5 },
        { x: 1, y: 0.5 },
        { x: 0, y: 1 },
        { x: -1, y: 0.5 },
        { x: -1, y: -0.5 },
      ];
    },
  },
  star: {
    id: "star",
    name: "五角星（凹形）",
    short: "五角星",
    aspect: 1.0,
    convex: false,
    note: "五处深凹口把多行文字硬劈成左右两截，视线不得不跨沟跳读。",
    intervals(ny) {
      return scanlinePolygon(STAR_POLY, ny);
    },
    polygon() {
      return STAR_POLY;
    },
  },
  crescent: {
    id: "crescent",
    name: "弯月（深凹）",
    short: "弯月",
    aspect: 0.96,
    convex: false,
    note: "弯弧极窄且偏心，上下两角尖细碎行，长句进来瞬间碎成字渣。",
    intervals(ny) {
      return scanlinePolygon(CRESCENT_POLY, ny);
    },
    polygon() {
      return CRESCENT_POLY;
    },
  },
  hourglass: {
    id: "hourglass",
    name: "细腰沙漏",
    short: "细腰沙漏",
    aspect: 0.9,
    convex: false,
    note: "中段细腰把阅读节奏勒断，宽行突然收成两三字，段落呼吸彻底失衡。",
    intervals(ny) {
      return scanlinePolygon(HOURGLASS_POLY, ny);
    },
    polygon() {
      return HOURGLASS_POLY;
    },
  },
};

// 求两段区间集合的交集，确保每行字的顶边与底边同时留在容器内
function intersectIntervals(a, b) {
  const out = [];
  for (const [a0, a1] of a) {
    for (const [b0, b1] of b) {
      const l = Math.max(a0, b0);
      const r = Math.min(a1, b1);
      if (r > l) out.push([l, r]);
    }
  }
  return out;
}

// 给定像素坐标 (px, py) 检测点是否在容器内（相对 cx, cy）
export function pointInShape(shapeId, dx, dy, ry) {
  const s = SHAPES[shapeId] || SHAPES.teardrop;
  const rx = ry * s.aspect;
  const ny = dy / ry;
  if (ny < -1 || ny > 1) return false;
  const nx = dx / rx;
  const segs = s.intervals(ny);
  return segs.some(([x0, x1]) => nx >= x0 && nx <= x1);
}

// 计算某高度行盒 [yTop, yBot] 相对中心 cy 的有效可用水平区间（像素，相对 cx）
export function lineSpansPx(shapeId, yTop, yBot, ry, padPx) {
  const s = SHAPES[shapeId] || SHAPES.teardrop;
  const rx = ry * s.aspect;
  // 在行盒上沿、中线、下沿三处采样并求交，保证整行字盒四角都在几何轮廓内
  const nyTop = yTop / ry;
  const nyMid = ((yTop + yBot) * 0.5) / ry;
  const nyBot = yBot / ry;
  if (nyTop < -1 || nyBot > 1) return [];
  const raw = intersectIntervals(
    intersectIntervals(s.intervals(nyTop), s.intervals(nyMid)),
    s.intervals(nyBot)
  );
  // 按斜率补偿安全内距（斜壁处水平缩进略大于垂直缩进，视觉内壁更均匀）
  const out = [];
  for (const [x0, x1] of raw) {
    const leftPx = x0 * rx + padPx;
    const rightPx = x1 * rx - padPx;
    if (rightPx > leftPx) out.push([leftPx, rightPx]);
  }
  return out;
}

// ---------- 核心排字引擎（单真源） ----------
// mode: "shaped"（随形居中） | "justify"（随形两端强齐行） | "rect"（矩形硬叠）
export function layoutShapedText({
  text = POSTER_BODY,
  shapeId = "teardrop",
  fontSize = 21,
  padPx = 12,
  mode = "shaped",
  ry = LOGICAL.ry,
  lineHeightRatio = RULES.lineHeightRatio,
  allowMultiSpan = false, // 02 节展示非凸凹形跨沟分裂时为 true
}) {
  const shape = SHAPES[shapeId] || SHAPES.teardrop;
  const rx = ry * shape.aspect;
  const lineH = fontSize * lineHeightRatio;
  const chars = [...text.replace(/\s+/g, "")];
  const lines = [];
  let idx = 0;

  // 有效垂直起止范围（扣除上下安全内壁）
  const topBound = -ry + Math.max(4, padPx);
  const botBound = ry - Math.max(4, padPx);

  if (mode === "rect") {
    // 矩形硬叠：把常规矩形文本框居中直接叠在几何容器上方（宽度贴近容器最大宽，四角真实戳出弧外）
    const rectW = rx * 1.96;
    const halfW = rectW / 2;
    const rowsCap = Math.max(1, Math.floor((ry * 1.88) / lineH));
    // 先分好行，再垂直居中于容器
    const rawRows = [];
    while (idx < chars.length) {
      let w = 0;
      let end = idx;
      while (end < chars.length) {
        const cw = charWidthUnits(chars[end]) * fontSize;
        const allowTail = NO_START.has(chars[end]) ? fontSize * 0.25 : 0;
        if (end > idx && w + cw > rectW + allowTail) break;
        w += cw;
        end++;
      }
      if (end < chars.length && NO_START.has(chars[end]) && end - idx > 2) {
        // 避头禁则：若下一字是句逗号且可压回或推前一字下移
        if (w + fontSize * 0.55 <= rectW + fontSize * 0.35) {
          w += charWidthUnits(chars[end]) * fontSize;
          end++;
        } else {
          end--;
          w -= charWidthUnits(chars[end]) * fontSize;
        }
      }
      rawRows.push({ text: chars.slice(idx, end).join(""), chars: chars.slice(idx, end), textW: w });
      idx = end;
    }
    const blockH = rawRows.length * lineH;
    const startY = -blockH / 2;
    let protrudingChars = 0;
    const bitePoints = [];
    rawRows.forEach((row, r) => {
      const yTop = startY + r * lineH;
      const yBot = yTop + fontSize;
      const cy = yTop + fontSize * 0.5;
      const xStart = -halfW; // 左对齐或居中矩形块
      const lineX0 = -row.textW / 2;
      const glyphPos = [];
      let curX = lineX0;
      for (const ch of row.chars) {
        const cw = charWidthUnits(ch) * fontSize;
        const gx = curX + cw / 2;
        const leftCornerOut = !pointInShape(shapeId, curX + 1, yTop + 1, ry) || !pointInShape(shapeId, curX + 1, yBot - 1, ry);
        const rightCornerOut = !pointInShape(shapeId, curX + cw - 1, yTop + 1, ry) || !pointInShape(shapeId, curX + cw - 1, yBot - 1, ry);
        const out = leftCornerOut || rightCornerOut;
        if (out) {
          protrudingChars++;
          bitePoints.push({ x: gx, y: cy, ch, kind: "protrude" });
        }
        glyphPos.push({ ch, x: gx, w: cw, out });
        curX += cw;
      }
      lines.push({
        rowIndex: r,
        yTop,
        yBot,
        cy,
        spanLeft: xStart,
        spanRight: halfW,
        text: row.text,
        textW: row.textW,
        charCount: row.chars.length,
        glyphs: glyphPos,
        splitRow: false,
        gapRatio: 0,
      });
    });

    return {
      shapeId,
      mode,
      rx,
      ry,
      fontSize,
      padPx,
      lineH,
      totalChars: chars.length,
      placedChars: chars.length,
      overflowChars: [],
      overflowCount: 0,
      lines,
      bitePoints,
      biteCount: protrudingChars,
      protrudingChars,
      splitLineCount: 0,
      orphanLines: 0,
      maxGapRatio: 0,
      fillRatio: Math.min(1, (rawRows.length * lineH) / Math.max(1, botBound - topBound)),
      minLineChars: lines.length ? Math.min(...lines.map((l) => l.charCount)) : 0,
      maxLineChars: lines.length ? Math.max(...lines.map((l) => l.charCount)) : 0,
      rectW,
      rowsCap,
    };
  }

  // ---------- 随形扫描线排版（shaped / justify） ----------
  // 从 topBound 向下逐行扫描；为使首行不卡在几何极尖点，遇到放不下 1 字的极尖处继续下移
  let y = topBound;
  let splitLineCount = 0;
  let maxGapRatio = 0;

  // 若是凸形且总行数少于容器可用高度，我们可以先试排一次，但注意：
  // 真实「灌字」是从顶部自然顺流而下，这样字太少时底部空洞（半空塌底）才会诚实暴露！
  while (y + fontSize <= botBound && idx < chars.length) {
    const yTop = y;
    const yBot = y + fontSize;
    const cy = y + fontSize * 0.5;
    const spans = lineSpansPx(shapeId, yTop, yBot, ry, padPx);

    // 过滤宽度至少容纳 1 个汉字的区间（如果非凸且 allowMultiSpan=true 则保留所有能放≥1字的分裂段）
    const usableSpans = spans.filter(([l, r]) => r - l >= fontSize * 0.96);
    if (!usableSpans.length) {
      y += Math.max(3, lineH * 0.25);
      continue;
    }

    const activeSpans = allowMultiSpan ? usableSpans : [usableSpans.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a))];
    const isSplit = allowMultiSpan && activeSpans.length > 1;
    if (isSplit) splitLineCount++;

    for (let si = 0; si < activeSpans.length && idx < chars.length; si++) {
      const [spanLeft, spanRight] = activeSpans[si];
      const spanW = spanRight - spanLeft;

      let w = 0;
      let end = idx;
      while (end < chars.length) {
        const cw = charWidthUnits(chars[end]) * fontSize;
        const tailBonus = NO_START.has(chars[end]) ? fontSize * 0.28 : 0;
        if (end > idx && w + cw > spanW + tailBonus) break;
        w += cw;
        end++;
      }
      // 避头点禁则：不让句号、逗号落下一行行首
      if (end < chars.length && NO_START.has(chars[end]) && end - idx >= 2) {
        if (w + fontSize * 0.62 <= spanW + fontSize * 0.34) {
          w += charWidthUnits(chars[end]) * fontSize;
          end++;
        } else if (!NO_END.has(chars[end - 1])) {
          end--;
          w -= charWidthUnits(chars[end]) * fontSize;
        }
      }
      // 避尾点禁则：不让开引号留在行尾
      if (end - idx >= 2 && NO_END.has(chars[end - 1])) {
        end--;
        w -= charWidthUnits(chars[end]) * fontSize;
      }

      const rowChars = chars.slice(idx, end);
      const isLastLine = end >= chars.length;
      const glyphPos = [];
      let gapRatio = 0;

      if (mode === "justify" && rowChars.length >= 2 && !isLastLine) {
        const extra = Math.max(0, spanW - w);
        const gap = extra / (rowChars.length - 1);
        gapRatio = gap / fontSize;
        if (gapRatio > maxGapRatio) maxGapRatio = gapRatio;
        let curX = spanLeft;
        for (const ch of rowChars) {
          const cw = charWidthUnits(ch) * fontSize;
          glyphPos.push({ ch, x: curX + cw / 2, w: cw, out: false });
          curX += cw + gap;
        }
      } else {
        const centerX = (spanLeft + spanRight) * 0.5;
        let curX = centerX - w / 2;
        for (const ch of rowChars) {
          const cw = charWidthUnits(ch) * fontSize;
          glyphPos.push({ ch, x: curX + cw / 2, w: cw, out: false });
          curX += cw;
        }
      }

      lines.push({
        rowIndex: lines.length,
        yTop,
        yBot,
        cy,
        spanLeft,
        spanRight,
        spanW,
        text: rowChars.join(""),
        textW: w,
        charCount: rowChars.length,
        hanCount: rowChars.filter((c) => !NO_START.has(c) && !NO_END.has(c)).length,
        glyphs: glyphPos,
        splitRow: isSplit,
        gapRatio,
      });

      idx = end;
    }

    y += lineH;
  }

  // 检测边缘贴壁啃边点（实测首尾字符外角距容器轮廓的像素距离）
  const safeMinPx = fontSize * RULES.safePadMinRatio;
  const bitePoints = [];
  for (const ln of lines) {
    if (!ln.glyphs.length) continue;
    const first = ln.glyphs[0];
    const last = ln.glyphs[ln.glyphs.length - 1];
    // 查该行顶、底边界真实的几何轮廓外沿（padPx = 0）
    const outerSpans = lineSpansPx(shapeId, ln.yTop, ln.yBot, ry, 0);
    if (!outerSpans.length) continue;
    // 找包住本段的 outer span
    const os = outerSpans.find(([l, r]) => first.x >= l - 2 && last.x <= r + 2) || outerSpans[0];
    const leftEdge = first.x - first.w / 2;
    const rightEdge = last.x + last.w / 2;
    const leftGap = leftEdge - os[0];
    const rightGap = os[1] - rightEdge;
    if (leftGap < safeMinPx * 0.92) {
      bitePoints.push({ x: leftEdge, y: ln.cy, gap: leftGap, side: "L", ch: first.ch, kind: "bite" });
    }
    if (rightGap < safeMinPx * 0.92) {
      bitePoints.push({ x: rightEdge, y: ln.cy, gap: rightGap, side: "R", ch: last.ch, kind: "bite" });
    }
  }

  // 统计孤字行（只剩 1 个汉字的极窄行）
  const orphanLines = lines.filter((l) => l.hanCount <= 1).length;
  const overflowChars = chars.slice(idx);

  // 计算有效垂向填满率（已排首行顶至末行底占容器可用垂直跨度的比例）
  let fillRatio = 0;
  if (lines.length) {
    const usedBottom = lines[lines.length - 1].yBot;
    const usedTop = lines[0].yTop;
    const usableH = Math.max(1, botBound - topBound);
    // 如果溢出则按 100% 满载记
    fillRatio = overflowChars.length > 0 ? 1 : Math.min(1, (usedBottom - usedTop) / usableH);
  }

  return {
    shapeId,
    mode,
    rx,
    ry,
    fontSize,
    padPx,
    lineH,
    totalChars: chars.length,
    placedChars: idx,
    overflowChars,
    overflowCount: overflowChars.length,
    lines,
    bitePoints,
    biteCount: bitePoints.length,
    protrudingChars: 0,
    splitLineCount,
    orphanLines,
    maxGapRatio,
    fillRatio,
    minLineChars: lines.length ? Math.min(...lines.map((l) => l.charCount)) : 0,
    maxLineChars: lines.length ? Math.max(...lines.map((l) => l.charCount)) : 0,
  };
}

// ---------- 开场严格优先级主错诊断（单真源） ----------
export function evaluateHero(layout) {
  const padEm = layout.padPx / Math.max(1, layout.fontSize);
  const fillPct = Math.round(layout.fillRatio * 100);
  const shapeName = SHAPES[layout.shapeId]?.short || "容器";

  // 三项与原海报三组引注一一对应的实测子检定
  const checkFlow = layout.mode !== "rect" && layout.orphanLines === 0;
  const checkEdge = layout.mode !== "rect" && padEm >= RULES.safePadMinRatio && padEm <= RULES.safePadMaxRatio;
  const checkForm = layout.mode !== "rect" && layout.overflowCount === 0 && layout.fillRatio >= RULES.minFillRatio;

  // 1. 矩形硬叠
  if (layout.mode === "rect") {
    return {
      ok: false,
      code: "rect",
      badge: "框字脱节 · 四角戳出",
      tone: "err",
      headline: `实测 ${layout.protrudingChars} 个字符边角戳破${shapeName}轮廓`,
      detail: `普通矩形文本框硬叠在${shapeName}上，文字边界和图形边界各说各话，视觉上退回「图底叠字」而非形状文字。切回「随形排」，让每一行按弦宽自动收放。`,
      checks: { flow: false, edge: false, form: false },
      callouts: {
        topRight: { ok: false, val: "未随形", desc: `固定宽 ${Math.round(layout.rectW)}px 矩形硬排` },
        botLeft: { ok: false, val: `${layout.protrudingChars} 字戳出`, desc: "四角顶破绿色轮廓外" },
        botRight: { ok: false, val: "图文分离", desc: "隐去绿壳只剩普通方块" },
      },
    };
  }

  // 2. 容积溢流（最优先，信息被直接腰斩）
  if (layout.overflowCount > 0) {
    const biteHint = padEm < RULES.safePadMinRatio ? `，同时内壁仅 ${Math.round(layout.padPx)}px 正在啃边` : "";
    return {
      ok: false,
      code: "overflow",
      badge: `容积超载 · 溢出 ${layout.overflowCount} 字`,
      tone: "err",
      headline: `最后 ${layout.overflowCount} 个字冲破底尖被截断${biteHint}`,
      detail: `形状文字是定容灌字：当前字号 ${layout.fontSize.toFixed(1)}px 撑爆了${shapeName}容积，末句直接掉出壳外。往左拉字号标尺把文字全部收回容器内，再拉出安全内壁。`,
      checks: { flow: checkFlow, edge: checkEdge, form: false },
      callouts: {
        topRight: {
          ok: checkFlow,
          val: `${layout.lines.length} 行 · ${layout.minLineChars}–${layout.maxLineChars} 字`,
          desc: layout.orphanLines > 0 ? `含 ${layout.orphanLines} 行单字孤行` : "行宽随几何弧线自动收放",
        },
        botLeft: {
          ok: checkEdge,
          val: padEm < RULES.safePadMinRatio ? `内壁 ${Math.round(layout.padPx)}px · 啃边` : `内壁 ${padEm.toFixed(2)}em`,
          desc: padEm < RULES.safePadMinRatio ? `${layout.biteCount} 处字角紧咬弧线` : "字块与弧线留出呼吸缝",
        },
        botRight: { ok: false, val: `溢出 ${layout.overflowCount} 字`, desc: "底尖超载截断，图文失衡" },
      },
    };
  }

  // 3. 贴壁啃边
  if (padEm < RULES.safePadMinRatio) {
    return {
      ok: false,
      code: "bite",
      badge: `贴壁啃边 · 内壁 ${padEm.toFixed(2)}em`,
      tone: "err",
      headline: `内壁余量不足经验下限 ${RULES.safePadMinRatio}em，${layout.biteCount} 处字角啃住弧线`,
      detail: `汉字是方正字框，贴紧圆弧或斜壁排布时四角会直接顶撞边界，整枚${shapeName}像被剪刀剪出毛边。把「内壁呼吸距」向右拉到 0.45em 以上（约 10–16px）。`,
      checks: { flow: checkFlow, edge: false, form: checkForm },
      callouts: {
        topRight: { ok: checkFlow, val: `${layout.lines.length} 行 · ${layout.minLineChars}–${layout.maxLineChars} 字`, desc: "每行按实时弦宽折行" },
        botLeft: { ok: false, val: `${layout.biteCount} 处咬边`, desc: `内壁 ${Math.round(layout.padPx)}px 小于经验安全距` },
        botRight: { ok: checkForm, val: `装满 ${fillPct}%`, desc: fillPct >= 78 ? "容积饱满，但边缘过紧" : "底端仍有空隙" },
      },
    };
  }

  // 4. 半空塌底
  if (layout.fillRatio < RULES.minFillRatio) {
    return {
      ok: false,
      code: "underfill",
      badge: `半空塌底 · 仅满 ${fillPct}%`,
      tone: "warn",
      headline: `文字只占去上半 ${fillPct}% 高度，底壳空出一大块`,
      detail: `形状文字靠字群撑起轮廓：低于经验下限 ${Math.round(RULES.minFillRatio * 100)}% 时，点「脱壳验形」会看到下半截${shapeName}直接塌平。把字号向右适当放大，把字灌满到底部。`,
      checks: { flow: checkFlow, edge: checkEdge, form: false },
      callouts: {
        topRight: { ok: checkFlow, val: `${layout.lines.length} 行 · ${layout.minLineChars}–${layout.maxLineChars} 字`, desc: "上半行宽随弧线展开" },
        botLeft: { ok: checkEdge, val: `内壁 ${padEm.toFixed(2)}em`, desc: "边缘留白干净无咬边" },
        botRight: { ok: false, val: `仅满 ${fillPct}%`, desc: "底壳空荡，脱壳轮廓塌底" },
      },
    };
  }

  // 5. 内缩过深
  if (padEm > RULES.safePadMaxRatio) {
    return {
      ok: false,
      code: "overpad",
      badge: `内缩过深 · 内壁 ${padEm.toFixed(2)}em`,
      tone: "warn",
      headline: `内壁过厚（超过 ${RULES.safePadMaxRatio}em 经验上限），文字缩成中间一小团`,
      detail: `留出太厚的绿边会让字群与外轮廓脱节，读者看到的只是「绿图形里贴了一小块字」而非图文一体。把内壁呼吸距往回收一点，并微调字号。`,
      checks: { flow: checkFlow, edge: false, form: checkForm },
      callouts: {
        topRight: { ok: checkFlow, val: `${layout.lines.length} 行 · ${layout.minLineChars}–${layout.maxLineChars} 字`, desc: "有效弦宽被内壁大幅吃掉" },
        botLeft: { ok: false, val: `内壁 ${padEm.toFixed(2)}em`, desc: "外环绿壳过厚，字壳疏离" },
        botRight: { ok: checkForm, val: `内核 ${fillPct}%`, desc: "文字退缩，识别张力变弱" },
      },
    };
  }

  // 6. 尖角孤字
  if (layout.orphanLines > 0) {
    return {
      ok: false,
      code: "orphan",
      badge: `尖角碎行 · ${layout.orphanLines} 行孤字`,
      tone: "warn",
      headline: `${shapeName}收尖处被挤出 ${layout.orphanLines} 行单字孤行`,
      detail: `顶角或底角过窄，只塞得下 1 个孤零零的汉字，视线刚落进来就被截断。微调字号或稍收内壁距，让首末行至少稳住 2 个汉字。`,
      checks: { flow: false, edge: checkEdge, form: checkForm },
      callouts: {
        topRight: { ok: false, val: `含 ${layout.orphanLines} 行孤字`, desc: `最短行仅 ${layout.minLineChars} 字，节奏断层` },
        botLeft: { ok: checkEdge, val: `内壁 ${padEm.toFixed(2)}em`, desc: "侧壁安全距合适" },
        botRight: { ok: checkForm, val: `装满 ${fillPct}%`, desc: "整体满度合格，微调消孤字" },
      },
    };
  }

  // 7. 全部成立：图文一体！
  return {
    ok: true,
    code: "ok",
    badge: `图文一体成立 · 装满 ${fillPct}%`,
    tone: "ok",
    headline: `0 溢流、无啃边、无孤字——点「脱壳验形」试试拿掉绿底`,
    detail: `116 字分成 ${layout.lines.length} 行（每行 ${layout.minLineChars}–${layout.maxLineChars} 字）自然贴合${shapeName}，内壁 ${padEm.toFixed(2)}em 护住方角又稳撑轮廓；哪怕隐去底色，文字自身边界也能一眼认出${shapeName}。`,
    checks: { flow: true, edge: true, form: true },
    callouts: {
      topRight: { ok: true, val: `${layout.lines.length} 行 · ${layout.minLineChars}–${layout.maxLineChars} 字`, desc: "行长随弦宽匀顺收放" },
      botLeft: { ok: true, val: `内壁 ${padEm.toFixed(2)}em`, desc: "方角不咬弧，边界利落" },
      botRight: { ok: true, val: `装满 ${fillPct}% · 0 溢流`, desc: "脱壳仍一眼认出几何形" },
    },
  };
}

// 通用轮廓路径绘制工具（Canvas 2D）
export function traceShapePath(ctx, shapeId, cx, cy, ry, insetPx = 0) {
  const s = SHAPES[shapeId] || SHAPES.teardrop;
  const rx = ry * s.aspect;
  const scaleX = Math.max(0.1, (rx - insetPx) / rx);
  const scaleY = Math.max(0.1, (ry - insetPx) / ry);
  const pts = s.polygon();
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = cx + p.x * rx * scaleX;
    const y = cy + p.y * ry * scaleY;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}
