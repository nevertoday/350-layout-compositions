// 190 图形诗排版 · 单一几何与诊断真源
// 所有诗句字符的坐标 (u, v ∈ 0..1)、旋转角、包围盒叠字、留白占比与落日碰撞
// 全部由本模块一次性算出；画布渲染、读数条与体检灯共读同一份 layoutPoem(state) 结果。

export const INITIAL_STATE = {
  mode: "mountain", // "mountain" | "prose" | "rain"
  slope: 0,         // 0..64 度（开场 0° 平排错态）
  river: 0,         // 0..100 % 曲流弯度（开场 0% 僵直错态）
  breath: 14,       // 0..100 % 字距与留白呼吸（开场 14% 挤闷错态）
  sunX: 0.35,       // 0.09..0.91（开场压在平排文字块上）
  sunY: 0.35,       // 0.09..0.88
  showGuides: false,
};

// 经验舒适带（页面与读数均明确标注为经验值）
export const BANDS = {
  slopeMin: 18,
  slopeMax: 38,
  slopeCollapse: 14,
  slopeSteep: 44,
  riverMin: 42,
  riverMax: 82,
  riverFlat: 28,
  riverKink: 88,
  breathMin: 35,
  breathMax: 76,
  wsMin: 66,
  wsMax: 84,
  sunR: 0.072,
};

// 严格取自 190 号原海报的诗句正文
export const POEM = {
  summit: "山是沉默的句号",
  tiers: [
    { text: "风从远方来", sizeMul: 0.84, innerGap: 0.018 },
    { text: "掠过棱线", sizeMul: 0.90, innerGap: 0.024 },
    { text: "带走云影 也带走喧嚣", sizeMul: 0.96, innerGap: 0.028 },
    { text: "只留下光 在石上 呼吸", sizeMul: 1.02, innerGap: 0.032 },
  ],
  riverUpper: "水向低处流动  流向更远的地方",
  riverLower: "水向低处流动",
  riverTail: "流向更远的地方",
  rainLines: [
    "山是沉默的句号",
    "风从远方来 掠过棱线",
    "带走云影 也带走喧嚣",
    "只留下光 在石上 呼吸",
    "水向低处流动 流向更远的地方",
  ],
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// 采样两段始终顺读（从左向右）的 S 形蜿蜒河道 + 末端竖直下坠尾流
function buildCurve(pts) {
  const arc = [0];
  for (let i = 1; i < pts.length; i++) {
    arc.push(arc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { pts, arc, totalLen: arc[arc.length - 1] };
}

function sampleRiverSystem(riverPct, nSamples = 96) {
  const r = clamp(riverPct / 100, 0, 1);
  const bend = smoothstep(0.02, 0.84, r);
  const kink = smoothstep(0.84, 1.0, r);

  // 上河段：从左向右起伏蜿蜒（绝不倒读）
  const upperPts = [];
  for (let i = 0; i <= nSamples; i++) {
    const t = i / nSamples;
    const x = lerp(0.10, 0.88, t);
    let y = lerp(0.74, 0.635 + Math.sin(t * Math.PI * 2.15 - 0.5) * 0.068 + t * 0.04, bend);
    if (kink > 0) {
      // 过弯(>84%)产生剧烈急折锯齿，触发弯内真实碰撞
      y += Math.sin(t * Math.PI * 11) * kink * 0.088;
    }
    upperPts.push({ x, y: clamp(y, 0.53, 0.86) });
  }

  // 下河段：承接中腹向左缓弯再汇入中轴竖落尾流
  const lowerPts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const x = lerp(0.10 + t * 0.34, 0.24 + t * 0.30, bend);
    let y = lerp(0.79, 0.77 + Math.sin(t * Math.PI * 1.45 + 0.3) * 0.052 + t * 0.02, bend);
    if (kink > 0) {
      y -= Math.sin(t * Math.PI * 9) * kink * 0.095;
    }
    lowerPts.push({ x, y: clamp(y, 0.56, 0.90) });
  }

  // 末端垂落段「流向更远的地方」：曲度 0% 时平接在右端，展开后优雅垂落向底端
  const tailPts = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const fx = lerp(0.49, 0.88, t);
    const fy = 0.79;
    const vx = 0.555 + Math.sin(t * Math.PI) * 0.012 * (1 - kink);
    const vy = lerp(0.77, 0.955, t);
    tailPts.push({ x: lerp(fx, vx, bend), y: lerp(fy, vy, bend) });
  }

  return {
    upper: buildCurve(upperPts),
    lower: buildCurve(lowerPts),
    tail: buildCurve(tailPts),
    guidePts: [...upperPts, ...lowerPts, ...tailPts],
  };
}

function pointAtArc(path, s) {
  const { pts, arc, totalLen } = path;
  const target = clamp(s, 0, totalLen);
  let lo = 0;
  let hi = arc.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (arc[mid] <= target) lo = mid;
    else hi = mid;
  }
  const span = Math.max(1e-6, arc[hi] - arc[lo]);
  const f = (target - arc[lo]) / span;
  const p0 = pts[lo];
  const p1 = pts[hi];
  const x = lerp(p0.x, p1.x, f);
  const y = lerp(p0.y, p1.y, f);
  const iA = Math.max(0, lo - 2);
  const iB = Math.min(pts.length - 1, hi + 2);
  let angle = Math.atan2(pts[iB].y - pts[iA].y, pts[iB].x - pts[iA].x);
  if (angle > Math.PI * 0.55) angle -= Math.PI;
  if (angle < -Math.PI * 0.55) angle += Math.PI;
  return { x, y, angle };
}

export function layoutPoem(rawState) {
  const state = {
    ...INITIAL_STATE,
    ...rawState,
    slope: clamp(Number(rawState?.slope ?? INITIAL_STATE.slope), 0, 64),
    river: clamp(Number(rawState?.river ?? INITIAL_STATE.river), 0, 100),
    breath: clamp(Number(rawState?.breath ?? INITIAL_STATE.breath), 0, 100),
    sunX: clamp(Number(rawState?.sunX ?? INITIAL_STATE.sunX), 0.08, 0.92),
    sunY: clamp(Number(rawState?.sunY ?? INITIAL_STATE.sunY), 0.08, 0.90),
  };

  const b = state.breath / 100;
  // 呼吸度同步驱动字号紧舒、字距(-0.08em..+0.56em)与行间呼吸
  const sizeScale = lerp(1.30, 0.68, b);
  const baseSize = 0.0325 * sizeScale;
  const trackingEm = lerp(-0.08, 0.56, Math.pow(b, 1.05));
  const stepFactor = 1.02 + trackingEm;

  const glyphs = [];
  const guides = { ridgeLeft: [], ridgeRight: [], riverPts: [], rainVectors: [] };

  const effectiveMode = state.mode;
  const slopeNorm = smoothstep(0, 24, state.slope);
  const slopeRad = (state.slope * Math.PI) / 180;

  if (effectiveMode === "prose") {
    const lines = [
      POEM.summit,
      "风从远方来，掠过棱线，",
      "带走云影，也带走喧嚣，",
      "只留下光，在石上呼吸。",
      "水向低处流动，流向更远的地方。",
    ];
    const fs = baseSize * 1.08;
    const lh = fs * lerp(1.22, 2.25, b);
    const startY = 0.22;
    const startX = 0.10;
    lines.forEach((line, row) => {
      let cx = startX;
      const cy = startY + row * lh;
      for (const ch of [...line]) {
        const adv = (ch === " " ? 0.5 : 1.0) * fs * Math.max(0.84, stepFactor);
        if (ch !== " ") {
          glyphs.push({
            char: ch,
            x: cx + adv * 0.5,
            y: cy,
            angle: 0,
            size: fs,
            group: row === 4 ? "river" : "mountain",
            seq: glyphs.length,
            hit: false,
          });
        }
        cx += adv;
      }
    });
  } else if (effectiveMode === "rain") {
    const rainAngle = 1.08;
    const cosA = Math.cos(rainAngle);
    const sinA = Math.sin(rainAngle);
    const cols = [0.20, 0.35, 0.50, 0.65, 0.80];
    const yStarts = [0.11, 0.16, 0.10, 0.17, 0.13];
    POEM.rainLines.forEach((line, idx) => {
      const fs = baseSize * 0.94;
      const step = fs * lerp(1.02, 1.75, b);
      const x0 = cols[idx];
      const y0 = yStarts[idx];
      guides.rainVectors.push({
        x0,
        y0,
        x1: x0 + cosA * step * line.length * 0.95,
        y1: y0 + sinA * step * line.length * 0.95,
      });
      [...line].forEach((ch, ci) => {
        if (ch === " ") return;
        const dist = ci * step;
        glyphs.push({
          char: ch,
          x: clamp(x0 + cosA * dist, 0.04, 0.96),
          y: clamp(y0 + sinA * dist, 0.06, 0.94),
          angle: rainAngle - Math.PI * 0.5,
          size: fs,
          group: "rain",
          seq: glyphs.length,
          hit: false,
        });
      });
    });
  } else {
    const flatT = 1 - slopeNorm;
    const peakX = 0.50;
    const peakTopY = lerp(0.16, 0.088, slopeNorm);

    // 1. 峰脊「山是沉默的句号」
    const summitChars = [...POEM.summit];
    const summitSize = baseSize * lerp(1.06, 0.90, slopeNorm);
    const summitStepFlat = summitSize * Math.max(0.84, stepFactor);
    const summitStepVert = summitSize * lerp(0.98, 1.32, b);

    summitChars.forEach((ch, i) => {
      const fx = 0.12 + (i + 0.5) * summitStepFlat;
      const fy = 0.19;
      const vx = peakX + (i >= 4 ? (i - 3.5) * 0.004 : 0);
      const vy = peakTopY + i * summitStepVert * 0.84;
      glyphs.push({
        char: ch,
        x: lerp(vx, fx, flatT),
        y: lerp(vy, fy, flatT),
        angle: 0,
        size: summitSize,
        group: "summit",
        seq: glyphs.length,
        hit: false,
      });
    });

    // 2. 山坡双翼：4 级阶梯诗句（由短及长），超过 42° 两坡内折碰撞
    const overSteep = smoothstep(42, 64, state.slope);
    const flatStep = baseSize * lerp(1.24, 1.86, b);
    const leftOuterPts = [];
    const rightOuterPts = [];

    POEM.tiers.forEach((tier, ti) => {
      const chars = [...tier.text];
      const fs = baseSize * tier.sizeMul;
      const charAdv = fs * Math.max(0.80, stepFactor);
      const lineLen = chars.reduce((s, c) => s + (c === " " ? charAdv * 0.45 : charAdv), 0);

      const tierSpread = lerp(0.84, 1.08, b);
      const mtnY = peakTopY + 0.14 + ti * 0.078 * tierSpread;
      const flatY = 0.255 + ti * flatStep;

      const baseInner = tier.innerGap * lerp(0.78, 1.32, b);
      const pinch = overSteep * (0.056 + ti * 0.015);
      const innerOffset = baseInner - pinch;

      // 左翼
      const leftAngle = slopeRad;
      const leftEndX = peakX - innerOffset;
      const leftEndY = mtnY + Math.sin(leftAngle) * lineLen * 0.44;
      const leftStartX = leftEndX - Math.cos(leftAngle) * lineLen;
      const leftStartY = leftEndY - Math.sin(leftAngle) * lineLen;
      leftOuterPts.push({ x: leftStartX, y: leftStartY });

      let acc = 0;
      chars.forEach((ch) => {
        const w = ch === " " ? charAdv * 0.45 : charAdv;
        if (ch !== " ") {
          const dist = acc + w * 0.5;
          const mx = leftStartX + Math.cos(leftAngle) * dist;
          const my = leftStartY + Math.sin(leftAngle) * dist;
          glyphs.push({
            char: ch,
            x: lerp(mx, 0.12 + dist, flatT),
            y: lerp(my, flatY, flatT),
            angle: lerp(leftAngle, 0, flatT),
            size: fs,
            group: "mountain-left",
            tier: ti,
            seq: glyphs.length,
            hit: false,
          });
        }
        acc += w;
      });

      // 右翼（平排时优雅排在下方重复段，展开后对称立于右坡，保持总墨量连续真实）
      const rightAngle = -slopeRad;
      const rightStartX = peakX + innerOffset;
      const rightStartY = mtnY + Math.sin(slopeRad) * lineLen * 0.44;
      const rightEndX = rightStartX + Math.cos(rightAngle) * lineLen;
      const rightEndY = rightStartY + Math.sin(rightAngle) * lineLen;
      rightOuterPts.push({ x: rightEndX, y: rightEndY });
      const flatY2 = 0.255 + (ti + POEM.tiers.length) * flatStep;

      let accR = 0;
      chars.forEach((ch) => {
        const w = ch === " " ? charAdv * 0.45 : charAdv;
        if (ch !== " ") {
          const dist = accR + w * 0.5;
          const mx = rightStartX + Math.cos(rightAngle) * dist;
          const my = rightStartY + Math.sin(rightAngle) * dist;
          glyphs.push({
            char: ch,
            x: lerp(mx, 0.12 + dist, flatT),
            y: lerp(my, flatY2, flatT),
            angle: lerp(rightAngle, 0, flatT),
            size: fs,
            group: "mountain-right",
            tier: ti,
            seq: glyphs.length,
            hit: false,
          });
        }
        accR += w;
      });
    });

    guides.ridgeLeft = [{ x: peakX, y: peakTopY }, ...leftOuterPts];
    guides.ridgeRight = [{ x: peakX, y: peakTopY }, ...rightOuterPts];

    // 3. 蜿蜒溪流句：两段始终从左向右顺读的 S 形河道 + 末端竖落「流向更远的地方」
    const riverSys = sampleRiverSystem(state.river);
    guides.riverPts = riverSys.upper.pts;
    const riverSize = baseSize * 0.78;
    const placeAlong = (curve, text, verticalTail = false) => {
      const chars = [...text];
      const desiredStep = riverSize * Math.max(0.88, stepFactor * 1.06);
      const totalNeed = chars.reduce((s, c) => s + (c === " " ? desiredStep * 0.45 : desiredStep), 0);
      const actualScale = Math.min(1.0, curve.totalLen / Math.max(0.001, totalNeed));
      const startOffset = Math.max(0, (curve.totalLen - totalNeed * actualScale) * 0.5);
      let sPos = startOffset;
      chars.forEach((ch) => {
        const step = (ch === " " ? desiredStep * 0.45 : desiredStep) * actualScale;
        if (ch !== " ") {
          const pt = pointAtArc(curve, sPos + step * 0.5);
          glyphs.push({
            char: ch,
            x: pt.x,
            y: pt.y,
            angle: verticalTail && state.river >= 30 ? 0 : pt.angle,
            size: riverSize,
            group: "river",
            seq: glyphs.length,
            hit: false,
          });
        }
        sPos += step;
      });
    };
    placeAlong(riverSys.upper, POEM.riverUpper, false);
    placeAlong(riverSys.lower, POEM.riverLower, false);
    placeAlong(riverSys.tail, POEM.riverTail, true);
  }

  // ---------- 真实几何实测（单真源） ----------
  let mountainCollisions = 0;
  let riverCollisions = 0;
  const hitPairs = [];
  for (let i = 0; i < glyphs.length; i++) {
    const a = glyphs[i];
    for (let j = i + 1; j < glyphs.length; j++) {
      const bg = glyphs[j];
      const sameInline = a.group === bg.group && a.tier === bg.tier && Math.abs(a.seq - bg.seq) === 1;
      const sameRiverNeighbor = a.group === "river" && bg.group === "river" && Math.abs(a.seq - bg.seq) === 1;
      const threshold = (a.size + bg.size) * (sameInline || sameRiverNeighbor ? 0.34 : 0.42);
      const d = Math.hypot(a.x - bg.x, a.y - bg.y);
      if (d < threshold) {
        a.hit = true;
        bg.hit = true;
        hitPairs.push({ x: (a.x + bg.x) * 0.5, y: (a.y + bg.y) * 0.5 });
        if (a.group === "river" && bg.group === "river") riverCollisions++;
        else mountainCollisions++;
      }
    }
  }

  // 落日压字与贴边实测
  const sunR = BANDS.sunR;
  let sunOverlapCount = 0;
  for (const g of glyphs) {
    const d = Math.hypot(g.x - state.sunX, g.y - state.sunY);
    if (d < sunR + g.size * 0.56) {
      sunOverlapCount++;
      g.sunHit = true;
    }
  }
  const sunClipped =
    state.sunX - sunR < 0.03 ||
    state.sunX + sunR > 0.97 ||
    state.sunY - sunR < 0.03 ||
    state.sunY + sunR > 0.97;

  // 素底留白率实测（44×44 网格真实栅格化全部字框+行晕+圆日占纸比）
  const GRID = 44;
  let inkCells = 0;
  for (let gy = 0; gy < GRID; gy++) {
    const py = (gy + 0.5) / GRID;
    for (let gx = 0; gx < GRID; gx++) {
      const px = (gx + 0.5) / GRID;
      if (Math.hypot(px - state.sunX, py - state.sunY) <= sunR * 1.05) {
        inkCells++;
        continue;
      }
      let covered = false;
      for (let k = 0; k < glyphs.length; k++) {
        const g = glyphs[k];
        const rad = g.size * 0.92;
        if (Math.abs(px - g.x) <= rad && Math.abs(py - g.y) <= rad) {
          covered = true;
          break;
        }
      }
      if (covered) inkCells++;
    }
  }
  const whitespacePct = Math.round((1 - inkCells / (GRID * GRID)) * 100);

  let outOfBounds = 0;
  for (const g of glyphs) {
    if (g.x < 0.02 || g.x > 0.98 || g.y < 0.02 || g.y > 0.98) outOfBounds++;
  }

  // ---------- 四项实时体检 ----------
  const semanticsOk = effectiveMode === "mountain" && state.slope >= BANDS.slopeCollapse;
  const slopeOk =
    effectiveMode === "mountain" &&
    state.slope >= BANDS.slopeMin &&
    state.slope <= BANDS.slopeMax &&
    mountainCollisions === 0 &&
    outOfBounds === 0;
  const riverOk =
    effectiveMode === "mountain" &&
    state.river >= BANDS.riverMin &&
    state.river <= BANDS.riverMax &&
    riverCollisions === 0;
  const breathInBand = state.breath >= BANDS.breathMin && state.breath <= BANDS.breathMax;
  const wsInBand = whitespacePct >= BANDS.wsMin && whitespacePct <= BANDS.wsMax;
  const sunOk = sunOverlapCount === 0 && !sunClipped;
  const spaceOk = breathInBand && wsInBand && sunOk;

  const passedCount = [semanticsOk, slopeOk, riverOk, spaceOk].filter(Boolean).length;

  let status = "err";
  let badge = "意象塌陷";
  let headline = "文字平躺成普通段落，山与水完全隐身";
  let detail =
    "当前山势坡角为 0°、水句拉直成横条，眼睛只会把它当成普通说明文字扫过。先把「山势坡角」拉开到 18°–38°，再弯出「水句曲度」与留白，别忘了把落日挪进右上空域。";

  if (effectiveMode === "rain") {
    status = "err";
    badge = "形意打架";
    headline = "诗写「山是沉默的句号」，画面却在斜坠下雨";
    detail =
      "图形诗的第一条铁律是「形意同构」：这里的诗句在写沉默稳固的山峦与低缓流水，强套斜雨造型会让视觉动作和词意互相拆台。切回「山水原形」，让造型重新服从诗意。";
  } else if (effectiveMode === "prose" || state.slope < BANDS.slopeCollapse) {
    status = "err";
    badge = "意象塌陷";
    headline =
      effectiveMode === "prose"
        ? "退回左对齐平排段落，画面感归零"
        : `坡角 ${Math.round(state.slope)}°，诗行太扁立不起山势`;
    detail =
      effectiveMode === "prose"
        ? "字样完全相同，但拿掉阶梯行长、坡角与曲流后，它只剩一段安静的散文。切回「山水原形」并向右拖动画布或坡角滑杆，看文字如何自己长出山脊。"
        : `低于约 14° 时，左右两坡的斜度弱到接近平排，眼睛只看到普通段落。把坡角推到 18°–38°（经验顺读带），让短句上峰顶、长句铺山脚。${sunOverlapCount ? `另外朱陶落日正压住 ${sunOverlapCount} 个字。` : ""}`;
  } else if (state.slope > BANDS.slopeSteep || mountainCollisions > 0) {
    status = "err";
    badge = "过陡断读";
    headline = `坡角 ${Math.round(state.slope)}° 折得太陡${mountainCollisions ? `，脊线撞叠 ${mountainCollisions} 处` : ""}`;
    detail =
      "为了把山尖拔得更锐利而把行向掰过 44°，两坡字尾会在中脊互相挤压打架，读者也必须歪头破译——造型一压过可读性，图形诗就退化成难辨的装饰剪影。往回调回 18°–38°。";
  } else if (state.river > BANDS.riverKink || riverCollisions > 0) {
    status = "err";
    badge = "急弯叠字";
    headline = `曲流弯度 ${Math.round(state.river)}% 打成急结${riverCollisions ? `，弯内撞叠 ${riverCollisions} 处` : ""}`;
    detail =
      "河流曲率超过字符高度承受极限后，急弯内侧的字会挤成一团、视线卡死。图形诗的曲线要顺着眼球的扫视惯性走，把曲度收回 42%–82% 经验舒适带。";
  } else if (state.breath > BANDS.breathMax || whitespacePct > BANDS.wsMax) {
    status = "err";
    badge = "散成星尘";
    headline = `字距拉到 +${trackingEm.toFixed(2)}em（留白 ${whitespacePct}%），词句散架`;
    detail =
      "字与字隔得太远，格式塔接近律失效：眼睛连不成完整诗句，远看也聚不成山峰轮廓，只剩散落纸面的孤字。把「字距与留白」往左收回，让留白落在 66%–84% 经验带。";
  } else if (state.breath < BANDS.breathMin || whitespacePct < BANDS.wsMin) {
    status = "err";
    badge = "字密憋闷";
    headline = `字距偏挤（留白仅 ${whitespacePct}%），缺少停顿与呼吸`;
    detail =
      "图形诗靠「大片素底托出字形」才能一眼成画。现在墨区过密（低于 66% 经验留白线），字句像贴成一块闷砖，拉开「字距与留白」让姜黄纸面透出空气。";
  } else if (sunOverlapCount > 0 || sunClipped) {
    status = "err";
    badge = sunOverlapCount > 0 ? "落日压字" : "落日贴边";
    headline =
      sunOverlapCount > 0
        ? `朱陶落日压住 ${sunOverlapCount} 个诗字，干扰读序`
        : "朱陶落日挤贴在画幅边缘，重心发憋";
    detail =
      sunOverlapCount > 0
        ? "圆日是全幅唯一的非文字意象，用来压住留白重心，绝不能直接盖在文字上抢辨识。把圆日拖到右上开阔空域，与左侧标题形成斜向呼应。"
        : "把圆日往画幅内侧挪回一点，让它安稳悬在山脊旁的大片留白里。";
  } else if (state.river < BANDS.riverMin) {
    status = "warn";
    badge = "水流僵直";
    headline = `山势已立，水句曲度仅 ${Math.round(state.river)}% 仍僵直`;
    detail =
      "山要稳、水要动——静山配动水才有画面层次。拉高「水句曲度」到 42%–82%，让「水向低处流动」蜿蜒承接山脚并垂落向下方。";
  } else if (passedCount === 4) {
    status = "ok";
    badge = "形意成立";
    headline = "山势立起、曲流引视、留白透气，字句本身成了画";
    detail = `坡角 ${Math.round(state.slope)}° 顺眼连读，曲度 ${Math.round(state.river)}% 零叠字，素底留白 ${whitespacePct}%（经验舒适带 66%–84%），朱陶落日稳悬空域——不加一条边框线，文字自己长出了山水与呼吸。`;
  } else {
    status = "warn";
    badge = "差一步收口";
    headline = "轮廓已现，把剩余一项微调进舒适带";
    detail = "顺着旁边标出的那项指标微调一下，感受每个参数过低与过高时画面如何失衡。";
  }

  return {
    state,
    glyphs,
    guides,
    hitPairs,
    metrics: {
      slopeDeg: Math.round(state.slope),
      riverPct: Math.round(state.river),
      trackingEm: Number(trackingEm.toFixed(2)),
      whitespacePct,
      totalCollisions: mountainCollisions + riverCollisions,
      mountainCollisions,
      riverCollisions,
      sunOverlapCount,
      sunClipped,
      outOfBounds,
      passedCount,
    },
    checks: {
      semanticsOk,
      slopeOk,
      riverOk,
      spaceOk,
    },
    verdict: {
      status,
      badge,
      headline,
      detail,
    },
  };
}
