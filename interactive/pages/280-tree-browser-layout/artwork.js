// 280 树形浏览布局 · 2D Canvas 缩进标尺、动态肘形连线、64 叶子拓扑实验室与原海报植物回路插画
import { POSTER_PALETTE as P, BREADTH_SHAPES } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

// ============================================================
// 1. Hero 2D Canvas 缩进与层级地形标尺（data-perf-drag 主交互画布）
//    实时以 60fps 绘制：层级阶梯地形 + 经验甜区带(14-26px) + 裁字警戒线 + 可拖滑标
// ============================================================
export function createIndentRuler(canvas) {
  const ctx = canvas.getContext("2d");
  let animIndent = 4;
  let animPulse = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(200, Math.round(rect.width));
    const h = Math.max(58, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    return { w, h, dpr };
  }

  function valueToX(val, padL, trackW) {
    return padL + ((val - 4) / (40 - 4)) * trackW;
  }

  function xToValue(clientX) {
    const rect = canvas.getBoundingClientRect();
    const padL = 16;
    const padR = 16;
    const trackW = Math.max(100, rect.width - padL - padR);
    const norm = Math.max(0, Math.min(1, (clientX - rect.left - padL) / trackW));
    return Math.round(4 + norm * (40 - 4));
  }

  function render(evalRes, t, dt, { still }) {
    const { w, h, dpr } = resize();
    const targetIndent = evalRes.metrics.indentPx;
    if (still || dt === 0) {
      animIndent = targetIndent;
    } else {
      animIndent += (targetIndent - animIndent) * Math.min(1, dt * 18);
      animPulse = (animPulse + dt * 2.2) % (Math.PI * 2);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 背景：柔和米青底
    ctx.fillStyle = "#F4F8F5";
    ctx.fillRect(0, 0, w, h);

    const padL = 16;
    const padR = 16;
    const trackW = w - padL - padR;
    const trackY = 36;
    const trackH = 14;

    // 顶部迷你阶梯预览条：直观画出当前 depth 层级的实时阶梯宽度与右墙截字冲突
    const depth = evalRes.metrics.maxDepth;
    const previewY = 8;
    const previewH = 18;
    const stepScale = Math.min(1, (trackW * 0.42) / 140);

    // 绘制模拟右壁边界
    const wallX = padL + trackW - 2;
    ctx.fillStyle = "#E8F0EB";
    ctx.fillRect(padL, previewY, trackW, previewH);

    const layers = Math.min(6, Math.max(1, depth));
    const barH = Math.max(2, Math.floor((previewH - 4) / layers));
    for (let i = 0; i < layers; i++) {
      const bx = padL + 4 + i * animIndent * stepScale * 1.15;
      const bw = Math.min(84, trackW * 0.32);
      const overflow = bx + bw > wallX;
      ctx.fillStyle =
        overflow || depth > 4 || depth === 1
          ? P.err
          : animIndent < 14
            ? P.warn
            : i === layers - 1
              ? P.tealBright
              : P.ink;
      ctx.globalAlpha = i === layers - 1 ? 0.92 : 0.45 + i * 0.1;
      ctx.fillRect(bx, previewY + 2 + i * barH, Math.max(6, Math.min(bw, wallX - bx)), Math.max(1.5, barH - 0.8));
    }
    ctx.globalAlpha = 1;

    // 标尺底槽三段色区：过扁警戒(4-13) / 清晰甜区(14-26) / 过宽截字(27-40)
    const xFlatEnd = valueToX(14, padL, trackW);
    const xSweetEnd = valueToX(26, padL, trackW);

    // 槽底
    ctx.fillStyle = "#F5E7E4";
    ctx.fillRect(padL, trackY, xFlatEnd - padL, trackH);

    ctx.fillStyle = "#D8EFE5";
    ctx.fillRect(xFlatEnd, trackY, xSweetEnd - xFlatEnd, trackH);

    ctx.fillStyle = "#F5E7E4";
    ctx.fillRect(xSweetEnd, trackY, padL + trackW - xSweetEnd, trackH);

    // 标尺边框与分界虚线
    ctx.strokeStyle = "#B8CFC6";
    ctx.lineWidth = 1;
    ctx.strokeRect(padL + 0.5, trackY + 0.5, trackW - 1, trackH - 1);

    ctx.save();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = P.tealText;
    ctx.beginPath();
    ctx.moveTo(xFlatEnd, trackY - 2);
    ctx.lineTo(xFlatEnd, trackY + trackH + 2);
    ctx.moveTo(xSweetEnd, trackY - 2);
    ctx.lineTo(xSweetEnd, trackY + trackH + 2);
    ctx.stroke();
    ctx.restore();

    // 区段文字标注（高对比深色，>=10px）
    ctx.font = '400 10px "Space Mono", "Noto Sans SC", monospace';
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#7D352B";
    ctx.textAlign = "left";
    ctx.fillText("齐平 4px", padL + 4, trackY + trackH / 2 + 0.5);

    ctx.fillStyle = "#085B58";
    ctx.textAlign = "center";
    ctx.fillText("清晰带 14–26px", (xFlatEnd + xSweetEnd) / 2, trackY + trackH / 2 + 0.5);

    ctx.fillStyle = "#7D352B";
    ctx.textAlign = "right";
    ctx.fillText("截字 40px", padL + trackW - 4, trackY + trackH / 2 + 0.5);

    // 实时滑块游标
    const knobX = valueToX(animIndent, padL, trackW);
    const inSweet = targetIndent >= 14 && targetIndent <= 26 && evalRes.metrics.clippedCount === 0;
    const knobColor = inSweet ? P.chrome : P.err;

    // 游标垂直引线连向顶部阶梯
    ctx.strokeStyle = knobColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(knobX, previewY + previewH);
    ctx.lineTo(knobX, trackY);
    ctx.stroke();

    // 胶囊游标
    const pillW = 54;
    const pillH = 22;
    const px = Math.max(padL, Math.min(padL + trackW - pillW, knobX - pillW / 2));
    const py = trackY + trackH / 2 - pillH / 2;

    ctx.fillStyle = knobColor;
    roundRectPath(ctx, px, py, pillW, pillH, 11);
    ctx.fill();

    // 微弱呼吸描边（仅在未校准且非静止时提示可拖动）
    if (!inSweet && !still) {
      const a = 0.25 + 0.2 * Math.sin(animPulse);
      ctx.strokeStyle = `rgba(196, 62, 47, ${a.toFixed(2)})`;
      ctx.lineWidth = 3;
      roundRectPath(ctx, px - 1.5, py - 1.5, pillW + 3, pillH + 3, 12.5);
      ctx.stroke();
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`↔ ${Math.round(animIndent)}px`, px + pillW / 2, py + pillH / 2 + 0.5);

    ctx.restore();
  }

  return { render, xToValue };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ============================================================
// 2. Hero 中栏肘形连线渲染（SVG 覆盖在左树与中栏三卡间隙上，精确复刻 280 原海报）
// ============================================================
export function drawCascadeConnectors(svgEl, stageEl, leftTreeEl, cascadeEl, evalRes) {
  if (!svgEl || !stageEl || !leftTreeEl || !cascadeEl) return;
  const stageRect = stageEl.getBoundingClientRect();
  const leftRect = leftTreeEl.getBoundingClientRect();
  const midRect = cascadeEl.getBoundingClientRect();

  // 仅在桌面三栏横向并排时绘制跨栏肘形连线
  const sideBySide = midRect.left > leftRect.right - 8;
  svgEl.setAttribute("viewBox", `0 0 ${Math.max(1, Math.round(stageRect.width))} ${Math.max(1, Math.round(stageRect.height))}`);
  if (!sideBySide) {
    svgEl.innerHTML = "";
    return;
  }

  const blind = evalRes.checks.feedback.tag === "盲态无提示";
  const strokeColor = blind ? "#B9C5C2" : P.teal;
  const dotColor = blind ? "#94A5A2" : P.chrome;

  const card1 = cascadeEl.querySelector('[data-cascade-card="1"]');
  const card2 = cascadeEl.querySelector('[data-cascade-card="2"]');
  const card3 = cascadeEl.querySelector('[data-cascade-card="3"]');
  const src1Id = evalRes.cascade.card1?.sourceId;
  const src2Id = evalRes.cascade.card2?.sourceId;

  const row1 = leftTreeEl.querySelector(`[data-node-id="${src1Id}"]`) || leftTreeEl.querySelector('[aria-selected="true"]');
  const row2 = leftTreeEl.querySelector(`[data-node-id="${src2Id}"]`);

  const parts = [];
  if (row1 && card1) {
    const r1 = row1.getBoundingClientRect();
    const c1 = card1.getBoundingClientRect();
    const x1 = Math.min(r1.right, leftRect.right) - stageRect.left - 8;
    const y1 = r1.top + r1.height / 2 - stageRect.top;
    const x2 = c1.left - stageRect.left;
    const y2 = c1.top + Math.min(92, c1.height * 0.42) - stageRect.top;
    const midX = (x1 + x2) / 2;

    if (blind) {
      parts.push(`<path d="M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}" fill="none" stroke="${strokeColor}" stroke-width="1.4" stroke-dasharray="3 5" opacity="0.55"/>`);
    } else {
      parts.push(`<path d="M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>`);
      parts.push(`<circle cx="${x1}" cy="${y1}" r="4" fill="${dotColor}"/>`);
      parts.push(`<circle cx="${x2}" cy="${y2}" r="3.5" fill="${P.teal}"/>`);
    }
  }

  if (row2 && card2 && row2 !== row1) {
    const r2 = row2.getBoundingClientRect();
    const c2 = card2.getBoundingClientRect();
    const x1 = Math.min(r2.right, leftRect.right) - stageRect.left - 8;
    const y1 = r2.top + r2.height / 2 - stageRect.top;
    const x2 = c2.left - stageRect.left;
    const y2 = c2.top + Math.min(54, c2.height * 0.3) - stageRect.top;
    const midX = (x1 + x2) / 2;
    parts.push(`<path d="M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-dasharray="4 4" opacity="${blind ? 0.45 : 0.9}"/>`);
    if (!blind) {
      parts.push(`<circle cx="${x1}" cy="${y1}" r="3.5" fill="${P.teal}"/>`);
    }
  }

  // 卡片 1 → 卡片 2 与 卡片 2 → 卡片 3 的垂直虚线连接点（精确承袭原海报）
  const linkVert = (upper, lower) => {
    if (!upper || !lower) return;
    const u = upper.getBoundingClientRect();
    const l = lower.getBoundingClientRect();
    const cx = u.left + u.width / 2 - stageRect.left;
    const yTop = u.bottom - stageRect.top;
    const yBot = l.top - stageRect.top;
    if (yBot - yTop > 4) {
      parts.push(`<line x1="${cx}" y1="${yTop}" x2="${cx}" y2="${yBot}" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="3 3" opacity="${blind ? 0.4 : 0.9}"/>`);
      if (!blind) {
        parts.push(`<circle cx="${cx}" cy="${yBot}" r="3.5" fill="${P.teal}"/>`);
      }
    }
  };
  linkVert(card1, card2);
  linkVert(card2, card3);

  svgEl.innerHTML = parts.join("");
}

// ============================================================
// 3. 标题旁活体树枝示范徽（随当前层级深度与缩进同步变形）
// ============================================================
export function updateTitleTwigSvg(svgEl, evalRes) {
  if (!svgEl) return;
  const depth = evalRes.metrics.maxDepth;
  const ok = evalRes.allOk;
  const color = ok ? P.teal : evalRes.metrics.maxDepth > 4 || evalRes.metrics.maxDepth === 1 ? P.err : P.ink;

  if (depth === 1) {
    // 1 层扁平：全部横排成一列无分支
    svgEl.innerHTML = `
      <line x1="6" y1="20" x2="46" y2="20" stroke="${P.err}" stroke-width="2" stroke-dasharray="2 2"/>
      ${[8, 17, 26, 35, 44].map((x) => `<circle cx="${x}" cy="20" r="3" fill="${P.err}"/>`).join("")}
    `;
    return;
  }

  const levels = Math.min(6, depth);
  const stepX = Math.min(9, Math.floor(34 / Math.max(1, levels - 1)));
  const stepY = Math.floor(28 / Math.max(1, levels));
  let lines = "";
  let nodes = "";
  for (let i = 0; i < levels; i++) {
    const x = 8 + i * stepX;
    const y = 7 + i * stepY;
    if (i > 0) {
      const px = 8 + (i - 1) * stepX;
      const py = 7 + (i - 1) * stepY;
      lines += `<path d="M ${px} ${py} L ${px} ${y} L ${x} ${y}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    nodes += `<circle cx="${x}" cy="${y}" r="${i === 0 ? 3.2 : 2.5}" fill="${i === levels - 1 ? color : P.ink}"/>`;
  }
  svgEl.innerHTML = lines + nodes;
}

// ============================================================
// 4. 第 01 节 2D Canvas：64 叶子「广度 × 深度」拓扑与寻路动画实验台
// ============================================================
export function createBreadthCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  let activeShapeId = "d6";
  let targetLeafIdx = 41; // 64 个叶子中选中的目标文档（0..63）
  let progress = 1; // 0..1 寻路步进动画

  function setShape(shapeId, replay = true) {
    activeShapeId = shapeId;
    if (replay) progress = 0;
  }

  function pickTarget(leafIdx) {
    targetLeafIdx = Math.max(0, Math.min(63, leafIdx));
    progress = 0;
  }

  function render(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    if (still) {
      progress = 1;
    } else if (progress < 1) {
      progress = Math.min(1, progress + dt * 0.95);
    }

    const shape = BREADTH_SHAPES.find((s) => s.id === activeShapeId) || BREADTH_SHAPES[0];
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 淡纸格底
    ctx.fillStyle = P.ivory;
    ctx.fillRect(0, 0, w, h);

    const padX = 28;
    const padTop = 34;
    const padBot = 30;
    const innerW = w - padX * 2;
    const innerH = h - padTop - padBot;

    const levels = shape.depth + 1; // 含根节点（第 0 层）到叶子层（第 depth 层）
    const rowY = (lvl) => padTop + (lvl / Math.max(1, levels - 1)) * innerH;

    // 计算目标叶子的路径索引（每层选中的节点序号）
    const pathAtLevel = new Array(levels).fill(0);
    let idx = targetLeafIdx;
    for (let lvl = levels - 1; lvl >= 0; lvl--) {
      pathAtLevel[lvl] = idx;
      idx = Math.floor(idx / shape.branching);
    }

    // 绘制层标尺横线与左侧层级标签
    ctx.font = '400 10px "Space Mono", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let lvl = 0; lvl < levels; lvl++) {
      const y = rowY(lvl);
      ctx.strokeStyle = lvl > 4 ? "rgba(196,62,47,0.22)" : "rgba(2,45,60,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.stroke();

      ctx.fillStyle = lvl > 4 ? P.err : P.inkMuted;
      ctx.fillText(lvl === 0 ? "R" : `L${lvl}`, 6, y);
    }

    // 4 层经验警戒虚线（在 6 层时高亮提示）
    if (shape.depth > 4) {
      const warnY = (rowY(4) + rowY(5)) / 2;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = P.err;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padX, warnY);
      ctx.lineTo(w - padX, warnY);
      ctx.stroke();
      ctx.fillStyle = P.err;
      ctx.textAlign = "right";
      ctx.fillText("4 层经验参考线", w - padX, warnY - 8);
      ctx.restore();
    }

    // 逐层绘制树边和节点
    const nodePos = (lvl, i, count) => {
      const x = count === 1 ? padX + innerW / 2 : padX + ((i + 0.5) / count) * innerW;
      return { x, y: rowY(lvl) };
    };

    // 先画普通边
    ctx.lineWidth = 1;
    for (let lvl = 1; lvl < levels; lvl++) {
      const count = Math.pow(shape.branching, lvl);
      const pCount = Math.pow(shape.branching, lvl - 1);
      ctx.strokeStyle = lvl > 4 ? "rgba(196,62,47,0.28)" : "rgba(10,150,143,0.26)";
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const pIdx = Math.floor(i / shape.branching);
        const p = nodePos(lvl - 1, pIdx, pCount);
        const c = nodePos(lvl, i, count);
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
      }
      ctx.stroke();
    }

    // 再画所有节点小点
    for (let lvl = 0; lvl < levels; lvl++) {
      const count = Math.pow(shape.branching, lvl);
      const r = count <= 8 ? 4.2 : count <= 16 ? 3 : 2.1;
      ctx.fillStyle = lvl === 0 ? P.ink : lvl > 4 ? "rgba(196,62,47,0.55)" : "rgba(10,150,143,0.55)";
      for (let i = 0; i < count; i++) {
        const pt = nodePos(lvl, i, count);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 高亮绘制：找到目标叶子 #targetLeafIdx 的实际逐层点击轨迹
    const activeSteps = progress * shape.depth;
    const accent = shape.verdictTone === "err" ? P.err : shape.verdictTone === "warn" ? P.warn : P.tealBright;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";

    for (let lvl = 1; lvl < levels; lvl++) {
      const segProgress = Math.max(0, Math.min(1, activeSteps - (lvl - 1)));
      if (segProgress <= 0) break;
      const pCount = Math.pow(shape.branching, lvl - 1);
      const cCount = Math.pow(shape.branching, lvl);
      const p = nodePos(lvl - 1, pathAtLevel[lvl - 1], pCount);
      const c = nodePos(lvl, pathAtLevel[lvl], cCount);
      const cx = p.x + (c.x - p.x) * segProgress;
      const cy = p.y + (c.y - p.y) * segProgress;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // 同级需扫读的兄弟节点高亮环（体现每层决策成本！）
      if (segProgress > 0.15) {
        const sibStart = pathAtLevel[lvl - 1] * shape.branching;
        ctx.fillStyle = shape.verdictTone === "err" ? "rgba(196,62,47,0.22)" : "rgba(0,170,162,0.22)";
        for (let s = 0; s < shape.branching; s++) {
          const sp = nodePos(lvl, sibStart + s, cCount);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, cCount >= 64 ? 3.2 : 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (segProgress >= 0.99) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(c.x, c.y, lvl === levels - 1 ? 5.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.6;
      }
    }

    // 底部读数条
    const tgt = nodePos(levels - 1, targetLeafIdx, 64);
    ctx.fillStyle = P.ink;
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    ctx.textAlign = "left";
    ctx.fillText(`目标文档 #${String(targetLeafIdx + 1).padStart(2, "0")} / 64`, padX, h - 12);
    ctx.textAlign = "right";
    ctx.fillStyle = accent;
    ctx.fillText(`点击 ${shape.clicks} 步 · 每层扫读 ${shape.scanPerLevel} 项`, w - padX, h - 12);

    // 顶部提示
    ctx.fillStyle = P.inkMuted;
    ctx.font = '500 10px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("点击画布任意横位置可换目标文档，重放寻路步数", w / 2, 14);

    // 目标小箭头
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(tgt.x, tgt.y + 8);
    ctx.lineTo(tgt.x - 4, tgt.y + 14);
    ctx.lineTo(tgt.x + 4, tgt.y + 14);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  return { render, setShape, pickTarget };
}
