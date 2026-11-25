// 246 簇群 —— 开场 2D Canvas 活体簇群涌现盘
// 忠实呈现原海报 21 件几何标本、有机圆角虚线包络壳、胶囊组标、跨簇实测标尺与直接拖/点交互。
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, THEMES, analyzeClusterState, clamp } from "./model.js";

// 2D Andrew 单调链凸包（用于围绕任意实时聚类成员生成有机光滑虚线包络）
function convexHull(pts) {
  if (pts.length <= 2) return pts.slice();
  const s = pts.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo = [];
  for (const p of s) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const hi = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i];
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  lo.pop();
  hi.pop();
  return lo.concat(hi);
}

// 为一组实时图元生成向外膨胀 pad 的有机圆角包络点集
function buildClusterHull(members, pad) {
  if (members.length === 1) {
    const m = members[0];
    return { type: "circle", cx: m.x, cy: m.y, r: Math.max(m.rx, m.ry) + pad };
  }
  const samplePts = [];
  const steps = 8;
  for (const m of members) {
    const ex = m.rx + pad;
    const ey = m.ry + pad;
    const isBoxy = m.shape === "rect" || m.shape === "square" || m.shape === "pill";
    for (let k = 0; k < steps; k++) {
      const ang = (k / steps) * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      if (isBoxy) {
        const sc = Math.sign(c) * Math.pow(Math.abs(c), 0.58);
        const ss = Math.sign(s) * Math.pow(Math.abs(s), 0.58);
        samplePts.push({ x: m.x + sc * ex, y: m.y + ss * ey });
      } else {
        samplePts.push({ x: m.x + c * ex, y: m.y + s * ey });
      }
    }
  }
  return { type: "poly", pts: convexHull(samplePts) };
}

function traceSmoothPoly(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  const n = pts.length;
  const startX = (pts[n - 1].x + pts[0].x) * 0.5;
  const startY = (pts[n - 1].y + pts[0].y) * 0.5;
  ctx.moveTo(startX, startY);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % n];
    const midX = (p.x + next.x) * 0.5;
    const midY = (p.y + next.y) * 0.5;
    ctx.quadraticCurveTo(p.x, p.y, midX, midY);
  }
  ctx.closePath();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const textWidthCache = new Map();
function drawPillTag(ctx, cx, cy, text, bg, fg, fontPx = 12) {
  const font = `700 ${fontPx}px "Manrope", "Noto Sans SC", sans-serif`;
  const key = `${fontPx}|${text}`;
  ctx.font = font;
  let tw = textWidthCache.get(key);
  if (tw === undefined) {
    tw = ctx.measureText(text).width;
    textWidthCache.set(key, tw);
  }
  const pw = tw + 20;
  const ph = fontPx + 10;
  drawRoundedRect(ctx, cx - pw * 0.5, cy - ph * 0.5, pw, ph, ph * 0.5);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  return { x: cx - pw * 0.5, y: cy - ph * 0.5, w: pw, h: ph };
}

export function mountClusterCanvas(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let worldMode = "wide";
  let cssW = 900;
  let cssH = 360;
  let rectLeft = 0;
  let rectTop = 0;
  let dpr = 1;
  let scale = 1;
  let offX = 0;
  let offY = 0;

  let intro = 0;
  let dirty = true;
  let lastStateRef = null;
  let hoverItemId = null;
  let dragInfo = null;
  let dragShift = 0;
  let lastAnalysis = null;

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    rectLeft = rect.left;
    rectTop = rect.top;
    worldMode = cssW / cssH < 1.95 ? "compact" : "wide";
    // 手机与软件渲染遵循 GUIDE 推荐上限 1.5，桌面保持 2× 锐利
    dpr = pixelRatio(cssW < 640 ? 1.5 : 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    dirty = true;
  }

  function toWorld(clientX, clientY) {
    const px = clientX - rectLeft;
    const py = clientY - rectTop;
    return {
      wx: (px - offX) / scale,
      wy: (py - offY) / scale,
      px,
      py,
    };
  }

  function hitTestItem(wx, wy, items) {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const hitPad = 10;
      if (Math.abs(wx - it.x) <= it.rx + hitPad && Math.abs(wy - it.y) <= it.ry + hitPad) {
        return it;
      }
    }
    return null;
  }

  function drawItemShape(it, alpha, scaleK) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.scale(scaleK, scaleK);
    ctx.globalAlpha = alpha;

    const rx = it.rx;
    const ry = it.ry;
    const sh = it.renderShape;

    ctx.fillStyle = it.renderColor;

    if (sh === "circle") {
      // 若宽矩形临时客串圆（相似冲突态），取短边为半径避免过度膨胀遮盖邻块
      const rad = rx !== ry ? Math.min(rx, ry) + 3 : rx;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
    } else if (sh === "rect") {
      drawRoundedRect(ctx, -rx, -ry, rx * 2, ry * 2, 9);
      ctx.fill();
    } else if (sh === "square") {
      const s = rx !== ry ? Math.min(rx, ry) + 3 : rx;
      drawRoundedRect(ctx, -s, -s, s * 2, s * 2, 8);
      ctx.fill();
    } else if (sh === "pill") {
      drawRoundedRect(ctx, -rx, -ry, rx * 2, ry * 2, ry);
      ctx.fill();
    } else if (sh === "diamond") {
      ctx.rotate(Math.PI / 4);
      const side = rx * 1.46;
      drawRoundedRect(ctx, -side * 0.5, -side * 0.5, side, side, 7);
      ctx.fill();
      ctx.rotate(-Math.PI / 4);
    }

    // 真实 UI 题材的清晰标签文字
    if (it.label) {
      const isLightFill = it.renderColor === PALETTE.pink;
      ctx.fillStyle = isLightFill ? PALETTE.ink : "#FFFDF9";
      ctx.font = `700 12px "Manrope", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, 0, 0.5);
    }

    // 混杂干扰点：醒目红虚线外环 + 轻微点击提示环
    if (it.isIntruder) {
      const ringR = (sh === "circle" || sh === "square") && rx !== ry ? Math.min(rx, ry) + 9 : Math.max(rx, ry) + 6;
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 游离点或离群点可拖拽提示环
    if ((it.isStray || it.isOutlier) && (hoverItemId === it.id || (dragInfo && dragInfo.itemId === it.id))) {
      ctx.strokeStyle = it.isOutlier ? PALETTE.ink : PALETTE.vermilionDeep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(rx, ry) + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function render(t, dt, { still }) {
    const state = getState();
    if (still) {
      if (intro < 1) dirty = true;
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + (dt || 0.016) * 2.2);
      dirty = true;
    }

    if (state !== lastStateRef) {
      lastStateRef = state;
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const analysis = analyzeClusterState(state, worldMode);
    lastAnalysis = analysis;

    const easeIntro = 1 - Math.pow(1 - intro, 3);
    const { world, items, perceptualClusters, checks, metrics, closestInterPair } = analysis;
    const themeInfo = THEMES[analysis.theme];

    // 等比居中映射到画布（绝不拉伸变形，圆永远是正圆；底沿预留 22px 给等大提示字）
    const padTop = 8;
    const padBot = 24;
    scale = Math.min((cssW - 14) / world.w, (cssH - padTop - padBot) / world.h);
    offX = (cssW - world.w * scale) * 0.5;
    offY = padTop + (cssH - padTop - padBot - world.h * scale) * 0.5;

    // 铺原海报暖杏米纸底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    // 若组间未拉开或正在横拖廊道，在中央呼吸廊道画柔和标尺带
    const cxMid = (analysis.corridorX ?? (analysis.centers.A.x + analysis.centers.B.x) * 0.5) + dragShift;
    if (dragInfo?.mode === "corridor" || !checks.gapOk) {
      const bandW = Math.max(12, Math.min(72, state.interGap));
      ctx.save();
      ctx.fillStyle = checks.gapOk ? "rgba(21, 107, 83, 0.08)" : "rgba(173, 28, 28, 0.075)";
      ctx.fillRect(cxMid - bandW * 0.5, 16, bandW, world.h - 30);
      ctx.strokeStyle = checks.gapOk ? "rgba(21, 107, 83, 0.35)" : "rgba(173, 28, 28, 0.32)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cxMid, 16);
      ctx.lineTo(cxMid, world.h - 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 相似冲突连线：用极细点线示意混色图形把视线拉向隔壁组
    if (analysis.activeIntruders.length > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(173, 28, 28, 0.42)";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 4]);
      for (const intr of analysis.activeIntruders) {
        const it = items.find((x) => x.id === intr.itemId);
        const tgtCenter = analysis.centers[intr.to];
        if (!it || !tgtCenter) continue;
        ctx.beginPath();
        ctx.moveTo(it.x, it.y);
        const mx = (it.x + tgtCenter.x) * 0.5;
        const my = (it.y + tgtCenter.y) * 0.5 - 18;
        ctx.quadraticCurveTo(mx, my, tgtCenter.x, tgtCenter.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ---------- 1. 绘制动态涌现的知觉包络壳 ----------
    const hullPad = 19;
    const tagBoxes = [];
    for (const cluster of perceptualClusters) {
      const hull = buildClusterHull(cluster.members, hullPad);
      const isOut = cluster.isPureOutlier;
      const isBad = cluster.isTangled || cluster.isAccidentalOrphan;

      ctx.save();
      // 边界表达模式：dashed（原海报虚线壳）| none（无框纯留白，仅出错或悬浮时微提示）| heavy（试错重框）
      const showEnvelope = state.frameMode !== "none" || isBad;
      if (showEnvelope) {
        if (hull.type === "circle") {
          ctx.beginPath();
          ctx.arc(hull.cx, hull.cy, hull.r, 0, Math.PI * 2);
        } else {
          traceSmoothPoly(ctx, hull.pts);
        }

        if (state.frameMode === "heavy") {
          ctx.fillStyle = isBad ? "rgba(173, 28, 28, 0.08)" : "rgba(8, 8, 8, 0.055)";
          ctx.fill();
          ctx.strokeStyle = isBad ? PALETTE.err : PALETTE.ink;
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          ctx.stroke();
        } else {
          if (isBad) {
            ctx.fillStyle = "rgba(173, 28, 28, 0.065)";
            ctx.fill();
          }
          ctx.strokeStyle = isBad
            ? PALETTE.err
            : isOut
              ? PALETTE.ink
              : PALETTE.vermilion;
          ctx.lineWidth = isBad ? 2 : 1.5;
          ctx.setLineDash(isOut ? [5, 4] : [5, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 计算包络顶部锚点，复刻原海报「胶囊组标 + 细竖短引线」
      let minX = Infinity, maxX = -Infinity, minY = Infinity;
      if (hull.type === "circle") {
        minX = hull.cx - hull.r;
        maxX = hull.cx + hull.r;
        minY = hull.cy - hull.r;
      } else {
        for (const p of hull.pts) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
        }
      }

      const anchorX = clamp((minX + maxX) * 0.5, 68, world.w - 68);
      const anchorY = Math.max(20, minY - 19);
      let tagText = "";
      let tagBg = PALETTE.vermilionDeep;
      if (cluster.isTangled) {
        tagText = cluster.groups.includes("O")
          ? `粘连吞并：${cluster.groups.join(" + ")}`
          : `跨簇粘连：${cluster.groups.join(" + ")}`;
        tagBg = PALETTE.err;
      } else if (cluster.isAccidentalOrphan) {
        tagText = "误生孤点 · 拖回 A";
        tagBg = PALETTE.err;
      } else if (isOut) {
        tagText = themeInfo.groupNames.O;
        tagBg = PALETTE.outlierPill;
      } else {
        tagText = themeInfo.groupNames[cluster.primaryGroup] || `簇群 ${cluster.primaryGroup}`;
        tagBg = state.frameMode === "none" ? PALETTE.ok : PALETTE.vermilionDeep;
      }

      // 细短引线连接到虚线壳顶部
      ctx.strokeStyle = tagBg;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY + 11);
      ctx.lineTo(anchorX, minY + 1);
      ctx.stroke();

      tagBoxes.push({ anchorX, anchorY, tagText, tagBg });
      ctx.restore();
    }

    // ---------- 2. 绘制 21 件真实几何 / UI 标本 ----------
    items.forEach((it, i) => {
      const stagger = clamp((easeIntro - i * 0.014) / 0.72, 0, 1);
      const k = 0.65 + 0.35 * stagger;
      drawItemShape(it, stagger, k);
    });

    // ---------- 3. 组标胶囊盖在最上层（防被元素遮挡） ----------
    for (const tb of tagBoxes) {
      drawPillTag(ctx, tb.anchorX, tb.anchorY, tb.tagText, tb.tagBg, "#FFFDF9", 11.5);
    }

    // ---------- 4. 实时几何标尺与交互锚点 ----------
    // 跨簇最小净距标尺（单真源实测）
    if (closestInterPair && !checks.isCrushed) {
      const { a, b, d } = closestInterPair;
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      ctx.save();
      ctx.strokeStyle = checks.gapOk ? PALETTE.ok : PALETTE.err;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      const badge = `组间 ${Math.round(d)}px · ${metrics.separationRatio.toFixed(1)}×`;
      drawPillTag(
        ctx,
        clamp(mx, 92, world.w - 92),
        clamp(my, 46, world.h - 26),
        badge,
        checks.gapOk ? PALETTE.ok : PALETTE.err,
        "#FFFDF9",
        11
      );
      ctx.restore();
    }

    // 游离点归队虚线箭提示
    if (!checks.cohesionOk && analysis.strayItem && analysis.strayAnchor) {
      const s = analysis.strayItem;
      const a = analysis.strayAnchor;
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 离群点被吞时加拖拽提示签
    if (!checks.outlierOk && analysis.outlierItem) {
      const o = analysis.outlierItem;
      drawPillTag(
        ctx,
        clamp(o.x + 12, 84, world.w - 84),
        clamp(o.y + o.ry + 24, 36, world.h - 18),
        "右拖孤立 →",
        PALETTE.outlierPill,
        "#FFFDF9",
        11
      );
    }

    ctx.restore();

    // 画布底沿交互提示绘制在 CSS 像素坐标系，手机与宽屏始终保持清晰等大字号
    ctx.save();
    ctx.fillStyle = PALETTE.inkSoft;
    const hintSize = cssW < 460 ? 11.5 : 12;
    ctx.font = `500 ${hintSize}px "Manrope", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const hint = cssW < 460
      ? (checks.gapOk && checks.simOk && checks.cohesionOk && checks.outlierOk
          ? "横拖廊道测临界 · 拖游离点或黑菱试错"
          : "横拖画布拉组距 · 点红圈归正 · 拖游离点/黑菱")
      : (checks.gapOk && checks.simOk && checks.cohesionOk && checks.outlierOk
          ? "左右横拖画布廊道测试组距临界 · 可拖移游离点/黑菱形试错"
          : "横拖画布空白处拉开组距 · 点红圈图形归正相似 · 拖游离点回 A · 右拖黑菱形独立");
    ctx.fillText(hint, cssW * 0.5, cssH - 6);
    ctx.restore();
  }

  // ---------- 指针与触屏事件（支持横拖廊道 + 直拖游离点/离群点 + 点修混杂点） ----------
  let activePointerId = null;
  let movedDist = 0;

  function startDrag(clientX, clientY) {
    if (!lastAnalysis) return;
    // 仅在按下瞬间刷新一次画布屏幕坐标，拖动中零同步回流
    const rect = canvas.getBoundingClientRect();
    rectLeft = rect.left;
    rectTop = rect.top;
    const { wx, wy } = toWorld(clientX, clientY);
    const state = getState();
    const hit = hitTestItem(wx, wy, lastAnalysis.items);
    movedDist = 0;

    if (hit && hit.isStray) {
      dragInfo = {
        mode: "stray",
        itemId: hit.id,
        startWx: wx,
        startWy: wy,
        initDrift: { ...state.strayDrift },
      };
    } else if (hit && hit.isOutlier) {
      dragInfo = {
        mode: "outlier",
        itemId: hit.id,
        startWx: wx,
        startWy: wy,
        initPull: { ...state.outlierPull },
      };
    } else if (hit && hit.isIntruder) {
      dragInfo = {
        mode: "intruderClick",
        itemId: hit.id,
        intruderIndex: hit.intruderIndex,
        startClientX: clientX,
        startClientY: clientY,
        initInter: state.interGap,
        initIntra: state.intraGap,
        startWx: wx,
        startWy: wy,
      };
    } else {
      // 在空白廊道或任意非特种元素上横拖 → 连续拉合组间廊道与组内收紧（perf.mjs 水平滑动同样驱动 60fps 实绘！）
      dragInfo = {
        mode: "corridor",
        startClientX: clientX,
        startClientY: clientY,
        initInter: state.interGap,
        initIntra: state.intraGap,
      };
    }
  }

  function moveDrag(clientX, clientY) {
    if (!dragInfo || !lastAnalysis) return;
    const { wx, wy } = toWorld(clientX, clientY);
    if (dragInfo.mode === "intruderClick") {
      const dx = clientX - dragInfo.startClientX;
      const dy = clientY - dragInfo.startClientY;
      if (Math.hypot(dx, dy) >= 4) {
        dragInfo.mode = "corridor";
      } else {
        return;
      }
    }
    if (dragInfo.mode === "corridor") {
      const dx = clientX - dragInfo.startClientX;
      movedDist = Math.max(movedDist, Math.abs(dx));
      const rawInter = dragInfo.initInter + dx * 0.34;
      const nextInter = clamp(Math.round(rawInter), 6, 86);
      const nextIntra = clamp(Math.round(dragInfo.initIntra - dx * 0.085), 4, 32);
      // 触顶或触底时保留轻柔阻尼回弹感，连续手势反馈不中断
      dragShift = rawInter < 6 ? clamp((rawInter - 6) * 0.35, -14, 0) : rawInter > 86 ? clamp((rawInter - 86) * 0.35, 0, 14) : 0;
      dirty = true;
      onMutate({ interGap: nextInter, intraGap: nextIntra }, true);
    } else if (dragInfo.mode === "stray") {
      const dx = wx - dragInfo.startWx;
      const dy = wy - dragInfo.startWy;
      movedDist = Math.max(movedDist, Math.hypot(dx, dy));
      const spanX = Math.max(74, getState().interGap * 0.55 + 62);
      const spanY = Math.max(58, getState().interGap * 0.55 + 48);
      let nu = clamp(dragInfo.initDrift.u + dx / spanX, -0.45, 1.35);
      let nv = clamp(dragInfo.initDrift.v + dy / spanY, -0.45, 1.25);
      // 靠近归位点轻轻吸附
      if (Math.hypot(nu, nv) < 0.16) {
        nu = 0;
        nv = 0;
      }
      onMutate({ strayDrift: { u: nu, v: nv } }, true);
    } else if (dragInfo.mode === "outlier") {
      const dx = wx - dragInfo.startWx;
      const dy = wy - dragInfo.startWy;
      movedDist = Math.max(movedDist, Math.hypot(dx, dy));
      let nu = clamp(dragInfo.initPull.u + dx / 110, -1.05, 0.35);
      let nv = clamp(dragInfo.initPull.v + dy / 66, -0.85, 0.85);
      if (Math.hypot(nu, nv) < 0.15) {
        nu = 0;
        nv = 0;
      }
      onMutate({ outlierPull: { u: nu, v: nv } }, true);
    }
  }

  function endDrag() {
    if (!dragInfo) return;
    if (dragInfo.mode === "intruderClick" && movedDist < 12) {
      const st = getState();
      const nextFixed = st.fixedIntruders.slice();
      nextFixed[dragInfo.intruderIndex] = true;
      const allFixed = nextFixed.every(Boolean);
      onMutate({
        fixedIntruders: nextFixed,
        similarityMode: allFixed ? "unified" : st.similarityMode,
      }, false);
    } else {
      onMutate({}, false);
    }
    dragInfo = null;
    if (dragShift !== 0) {
      dragShift = 0;
      dirty = true;
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    activePointerId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    startDrag(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (dragInfo && e.pointerId === activePointerId) {
      moveDrag(e.clientX, e.clientY);
      return;
    }
    if (!lastAnalysis) return;
    const rect = canvas.getBoundingClientRect();
    rectLeft = rect.left;
    rectTop = rect.top;
    const { wx, wy } = toWorld(e.clientX, e.clientY);
    const hit = hitTestItem(wx, wy, lastAnalysis.items);
    const nextHover = hit ? hit.id : null;
    if (nextHover !== hoverItemId) {
      hoverItemId = nextHover;
      canvas.style.cursor = hit
        ? hit.isIntruder
          ? "pointer"
          : hit.isStray || hit.isOutlier
            ? "grab"
            : "ew-resize"
        : "ew-resize";
      dirty = true;
    }
  });

  const finishPointer = (e) => {
    if (e.pointerId !== activePointerId) return;
    endDrag();
    activePointerId = null;
  };
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);

  // 兼容直接派发 TouchEvent（perf.mjs 使用 Input.dispatchTouchEvent 测试 60fps 拖动帧率）
  let touchActive = false;
  canvas.addEventListener("touchstart", (e) => {
    if (dragInfo || !e.touches.length) return;
    touchActive = true;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchActive || !e.touches.length) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", () => {
    if (!touchActive) return;
    touchActive = false;
    endDrag();
  }, { passive: true });

  // 键盘操作：左右键调组间距，上下键调组内距
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    const step = e.shiftKey ? 6 : 2;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onMutate({ interGap: clamp(st.interGap + step, 6, 86) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onMutate({ interGap: clamp(st.interGap - step, 6, 86) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onMutate({ intraGap: clamp(st.intraGap - step, 2, 34) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onMutate({ intraGap: clamp(st.intraGap + step, 2, 34) });
    }
  });

  syncSize();
  const ctl = loop(canvas, render);
  const onResize = () => {
    syncSize();
    ctl.draw();
  };
  window.addEventListener("resize", onResize);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(onResize).observe(canvas);
  }

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    markDirty: () => {
      dirty = true;
    },
    getWorldMode: () => worldMode,
  };
}
