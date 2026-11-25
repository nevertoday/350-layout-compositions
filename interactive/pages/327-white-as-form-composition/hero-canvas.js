// 327 计白当黑构图 · 开场「玄墨×白纸双生刻形台」2D 矢量渲染
// 主画布与反拓拓片窗共用同一份 drawComposition()，绝不手写两套不同几何。

import { PALETTE, clamp, isWhiteAt } from "./model.js";

// 将世界坐标 [-0.54..0.54] × [-0.52..0.52] 等比映射到任意尺寸画布（保证正圆不变形）
export function makeTransform(w, h) {
  const unit = Math.min(w / 1.12, h / 1.06);
  const cx = w * 0.5;
  const cy = h * 0.505;
  return {
    unit,
    cx,
    cy,
    x: (wx) => cx + wx * unit,
    y: (wy) => cy + wy * unit,
    s: (ws) => ws * unit,
    toWorld: (px, py) => ({
      x: (px - cx) / unit,
      y: (py - cy) / unit,
    }),
  };
}

// 绘制单幅作品（可原色玄底白形，也可反拓白纸黑墨）
export function drawComposition(ctx, w, h, ev, { invertOverride = null, mini = false, reveal = 1, activeHandle = null, pulse = 0 } = {}) {
  const { geo } = ev;
  const inv = invertOverride !== null ? invertOverride : geo.inverted;
  const bg = inv ? PALETTE.white : PALETTE.ink;
  const fg = inv ? PALETTE.ink : PALETTE.white;
  const t = makeTransform(w, h);

  // 背景底板
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 极淡石刻基准格线（仅主画布可见，不喧宾夺主）
  if (!mini) {
    ctx.save();
    ctx.strokeStyle = inv ? "rgba(0,6,22,0.05)" : "rgba(254,254,252,0.042)";
    ctx.lineWidth = 1;
    for (let gx = -0.4; gx <= 0.41; gx += 0.2) {
      const px = Math.round(t.x(gx)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, t.y(-0.48));
      ctx.lineTo(px, t.y(0.48));
      ctx.stroke();
    }
    for (let gy = -0.4; gy <= 0.41; gy += 0.2) {
      const py = Math.round(t.y(gy)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(t.x(-0.5), py);
      ctx.lineTo(t.x(0.5), py);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 开场渐显（由下向上平稳舒展，保证 0.9s 时 100% 清晰完整）
  const r = clamp(reveal, 0.08, 1);

  ctx.save();
  if (r < 0.999) {
    const clipH = h * (0.28 + 0.72 * r);
    ctx.beginPath();
    ctx.rect(0, h - clipH, w, clipH);
    ctx.clip();
  }

  if (geo.scene === "arch") {
    drawArchScene(ctx, t, geo, fg, bg);
  } else if (geo.scene === "seal") {
    drawSealScene(ctx, t, geo, fg, bg, inv, mini);
  } else {
    drawMarkScene(ctx, t, geo, fg, bg, inv, mini);
  }
  ctx.restore();

  if (mini) {
    ctx.save();
    ctx.strokeStyle = ev.score === 4 ? "rgba(12,94,70,0.45)" : "rgba(166,32,25,0.42)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
    ctx.restore();
    return;
  }

  drawOverlaysAndCallouts(ctx, t, w, h, ev, inv, activeHandle, pulse);
}

// 场景 1：原海报 327 拱门光道（1:1 几何刻形）
function drawArchScene(ctx, t, geo, fg, bg) {
  const { arch, portal, path, eye } = geo;

  ctx.save();
  ctx.fillStyle = fg;
  // 1) 主形拱门（纯白外圆弧 + 斜切拱脚 + 挖空内拱腔）
  ctx.beginPath();
  ctx.moveTo(t.x(arch.cx - arch.outerR), t.y(arch.legBottomOuter));
  ctx.lineTo(t.x(arch.cx - arch.outerR), t.y(arch.cy));
  ctx.arc(t.x(arch.cx), t.y(arch.cy), t.s(arch.outerR), Math.PI, 0, false);
  ctx.lineTo(t.x(arch.cx + arch.outerR), t.y(arch.legBottomOuter));
  ctx.lineTo(t.x(arch.cx + arch.innerR), t.y(arch.legBottomInner));
  ctx.lineTo(t.x(arch.cx + arch.innerR), t.y(arch.cy));
  ctx.arc(t.x(arch.cx), t.y(arch.cy), t.s(arch.innerR), 0, Math.PI, true);
  ctx.lineTo(t.x(arch.cx - arch.innerR), t.y(arch.legBottomInner));
  ctx.closePath();
  ctx.fill();

  // 2) 引导光道（下展弧底白色三角）
  ctx.beginPath();
  ctx.moveTo(t.x(path.apex.x), t.y(path.apex.y));
  ctx.lineTo(t.x(path.rightFoot.x), t.y(path.rightFoot.y));
  ctx.quadraticCurveTo(t.x(path.bottomCtrl.x), t.y(path.bottomCtrl.y), t.x(path.leftFoot.x), t.y(path.leftFoot.y));
  ctx.closePath();
  ctx.fill();

  // 3) 次形门洞（嵌于黑腔内的圆顶竖门）
  ctx.beginPath();
  ctx.moveTo(t.x(portal.x - portal.halfW), t.y(portal.baseY));
  ctx.lineTo(t.x(portal.x - portal.halfW), t.y(portal.topCy));
  ctx.arc(t.x(portal.x), t.y(portal.topCy), t.s(portal.topR), Math.PI, 0, false);
  ctx.lineTo(t.x(portal.x + portal.halfW), t.y(portal.baseY));
  ctx.closePath();
  ctx.fill();

  // 4) 圆黑眼（白中有黑的反计圆，挖回底色）
  if (eye.on) {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(t.x(eye.x), t.y(eye.y), t.s(eye.r), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 场景 2：篆刻朱白山门印（与 model.js geo.seal 单真源严格一致）
function drawSealScene(ctx, t, geo, fg, bg, inv, mini) {
  const { carve, portal, path, eye, seal } = geo;
  const { outer, inner: innerBound, bandW, courtHalfW, courtH } = seal;

  ctx.save();
  if (mini && inv) {
    ctx.strokeStyle = "rgba(0,6,22,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(t.x(-outer), t.y(-outer), t.s(outer * 2), t.s(outer * 2));
  } else {
    const sealBody = inv ? "#A8241C" : "#121A30";
    ctx.fillStyle = inv ? "#B5281E" : PALETTE.inkPanel;
    ctx.strokeStyle = inv ? "#8F1B14" : "rgba(254,254,252,0.26)";
    ctx.lineWidth = Math.max(1.5, t.s(0.008));
    ctx.beginPath();
    ctx.rect(t.x(-outer), t.y(-outer), t.s(outer * 2), t.s(outer * 2));
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sealBody;
    ctx.fillRect(t.x(-innerBound), t.y(-innerBound), t.s(innerBound * 2), t.s(innerBound * 2));
  }

  ctx.fillStyle = mini && inv ? PALETTE.ink : PALETTE.white;
  ctx.fillRect(t.x(-(innerBound - 0.03)), t.y(-0.27 - bandW * 0.6), t.s((innerBound - 0.03) * 2), t.s(bandW * 1.2));
  ctx.fillRect(t.x(-0.22 - bandW * 0.7), t.y(-innerBound + 0.03), t.s(bandW * 1.4), t.s(innerBound + 0.03));
  ctx.fillRect(t.x(0.22 - bandW * 0.7), t.y(-innerBound + 0.03), t.s(bandW * 1.4), t.s(innerBound + 0.03));
  ctx.fillRect(t.x(-0.22), t.y(-0.14 - bandW * 0.54), t.s(0.44), t.s(bandW * 1.08));

  ctx.fillRect(t.x(portal.x - courtHalfW), t.y(portal.y - courtH * 0.48), t.s(courtHalfW * 2), t.s(courtH));

  const lX = clamp(path.baseCenterX - (0.2 + carve * 0.28), -innerBound + 0.005, -0.04);
  const rX = clamp(path.baseCenterX + (0.2 + carve * 0.28), 0.04, innerBound - 0.005);
  ctx.beginPath();
  ctx.moveTo(t.x(path.apex.x), t.y(0.02 - carve * 0.08));
  ctx.lineTo(t.x(rX), t.y(innerBound - 0.01));
  ctx.lineTo(t.x(lX), t.y(innerBound - 0.01));
  ctx.closePath();
  ctx.fill();

  if (eye.on) {
    ctx.fillStyle = mini && inv ? PALETTE.white : inv ? "#B5281E" : bg;
    const hw = eye.r * 0.85;
    const hh = eye.r * 0.76;
    ctx.fillRect(t.x(eye.x - hw), t.y(eye.y - hh), t.s(hw * 2), t.s(hh * 2));
  }
  ctx.restore();
}

// 场景 3：现代标识负形箭字标（与 model.js geo.mark 单真源严格一致）
function drawMarkScene(ctx, t, geo, fg, bg, inv, mini) {
  const { carve, portal, path, eye, mark } = geo;
  const gap = mark.gap;
  const eLeft = -0.39;
  const eRight = -gap * 0.5;
  const barThick = 0.095 - carve * 0.04;
  const xLeft = gap * 0.5 + portal.x * 0.55;
  const xMidY = -0.145 + (portal.y - 0.01) * 0.8;

  ctx.save();
  ctx.fillStyle = fg;
  const wy0 = -0.29 - carve * 0.05;
  const wy1 = 0.01 + carve * 0.05;
  ctx.fillRect(t.x(eLeft + 0.06), t.y(wy0), t.s(0.34 - (eLeft + 0.06)), t.s(wy1 - wy0));

  ctx.fillStyle = inv ? bg : PALETTE.inkWell;
  const drawBlock = (x0, y0, bw, bh) => {
    ctx.fillRect(t.x(x0), t.y(y0), t.s(bw), t.s(bh));
  };
  drawBlock(eLeft, -0.32, 0.095 - carve * 0.035, 0.35);
  drawBlock(eLeft, -0.32, Math.max(0.11, eRight - eLeft), barThick);
  drawBlock(eLeft, -0.18, Math.max(0.08, eRight - 0.03 - eLeft), barThick * 0.82);
  drawBlock(eLeft, 0.03 - barThick, Math.max(0.11, eRight - eLeft), barThick);

  const tipX = xLeft + 0.145 + carve * 0.065;
  const topY = -0.32;
  const botY = 0.03;
  ctx.beginPath();
  ctx.moveTo(t.x(xLeft), t.y(topY));
  ctx.lineTo(t.x(0.39), t.y(topY));
  ctx.lineTo(t.x(0.39), t.y(botY));
  ctx.lineTo(t.x(xLeft), t.y(botY));
  ctx.lineTo(t.x(xLeft), t.y(xMidY + (tipX - xLeft) * 0.92));
  ctx.lineTo(t.x(tipX), t.y(xMidY));
  ctx.lineTo(t.x(xLeft), t.y(xMidY - (tipX - xLeft) * 0.92));
  ctx.closePath();
  ctx.fill();

  if (!mini) {
    ctx.strokeStyle = inv ? "rgba(0,6,22,0.2)" : "rgba(254,254,252,0.3)";
    ctx.lineWidth = 1.25;
    ctx.strokeRect(t.x(eLeft), t.y(topY), t.s(0.78), t.s(botY - topY));
  }

  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(t.x(path.apex.x), t.y(path.apex.y));
  ctx.lineTo(t.x(path.rightFoot.x), t.y(path.rightFoot.y));
  ctx.quadraticCurveTo(t.x(path.bottomCtrl.x), t.y(path.bottomCtrl.y), t.x(path.leftFoot.x), t.y(path.leftFoot.y));
  ctx.closePath();
  ctx.fill();

  if (eye.on) {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(t.x(eye.x), t.y(eye.y), t.s(eye.r * 0.88), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 建筑刻形边界提示与原海报金点虚线标注（直接拖拽形体本体，无靶心图标，标签自动防碰撞）
function drawOverlaysAndCallouts(ctx, t, w, h, ev, inv, activeHandle, pulse) {
  const { geo, checks, gaze } = ev;
  const { arch, portal, path, eye } = geo;
  const errColor = inv ? PALETTE.errLight : PALETTE.errDark;
  const okColor = inv ? PALETTE.okLight : PALETTE.okDark;
  const goldColor = inv ? PALETTE.goldDeep : PALETTE.gold;

  ctx.save();

  // 1) 视线流向虚线（光道中轴 → 次形中心）
  if (geo.showGuides) {
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = checks.guideOk ? (inv ? "rgba(12,94,70,0.52)" : "rgba(92,224,184,0.52)") : errColor;
    ctx.beginPath();
    ctx.moveTo(t.x(path.baseCenterX), t.y(path.baseY - 0.04));
    ctx.lineTo(t.x(path.apex.x), t.y(path.apex.y));
    ctx.lineTo(t.x(portal.x), t.y(portal.y - 0.02));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2) 直接高亮可拖拽形体轮廓（建筑描边而非靶心圆圈）
  const dashBreath = Math.sin(pulse) * 0.25 + 0.75;

  // 次形门洞轮廓框（可直拖本体）
  if (activeHandle === "portal" || !checks.layerOk || geo.showGuides) {
    const px0 = t.x(portal.x - portal.halfW) - 4;
    const py0 = t.y(portal.topCy - portal.topR) - 4;
    const pw = t.s(portal.halfW * 2) + 8;
    const ph = t.y(portal.baseY) - py0 + 4;
    ctx.strokeStyle = !checks.layerOk ? errColor : activeHandle === "portal" ? goldColor : inv ? "rgba(122,88,0,0.55)" : "rgba(251,210,18,0.55)";
    ctx.lineWidth = activeHandle === "portal" || !checks.layerOk ? 2 : 1.25;
    ctx.setLineDash(checks.layerOk ? [3, 3] : [5, 3]);
    ctx.strokeRect(px0, py0, pw, ph);
    ctx.setLineDash([]);
  }

  // 光道尖顶建筑折角游标（拖此角调整视线流向）
  {
    const ax = t.x(path.apex.x);
    const ay = t.y(path.apex.y);
    const sz = activeHandle === "apex" ? 9 : 7;
    ctx.strokeStyle = !checks.guideOk ? errColor : goldColor;
    ctx.lineWidth = activeHandle === "apex" ? 2.6 : 2;
    ctx.beginPath();
    ctx.moveTo(ax - sz, ay + sz * 1.15);
    ctx.lineTo(ax, ay - sz * 0.75);
    ctx.lineTo(ax + sz, ay + sz * 1.15);
    ctx.stroke();
  }

  // 圆黑眼外沿描边（破边时红色断边警框，正常时淡金细沿提示可拖）
  if (eye.on && (activeHandle === "eye" || !checks.balanceOk || geo.showGuides)) {
    ctx.strokeStyle = !checks.balanceOk ? errColor : activeHandle === "eye" ? goldColor : inv ? "rgba(122,88,0,0.55)" : "rgba(251,210,18,0.52)";
    ctx.lineWidth = activeHandle === "eye" || !checks.balanceOk ? 2.2 : 1.3;
    ctx.setLineDash(checks.balanceOk ? [4, 4] : [5, 3]);
    ctx.beginPath();
    ctx.arc(t.x(eye.x), t.y(eye.y), t.s(eye.r) + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3) 左侧建筑刻刀厚薄标尺（提示空白处左右横拖雕刻白壁）
  if (geo.showGuides && geo.scene === "arch") {
    const lxOuter = t.x(arch.cx - arch.outerR);
    const lxInner = t.x(arch.cx - arch.innerR);
    const ly = t.y(arch.cy + 0.04);
    ctx.strokeStyle = activeHandle === "carve" ? goldColor : !checks.formOk ? errColor : inv ? "rgba(122,88,0,0.6)" : "rgba(251,210,18,0.65)";
    ctx.lineWidth = activeHandle === "carve" ? 2.2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(lxOuter - 12, ly);
    ctx.lineTo(lxInner + 10, ly);
    // 两侧小刻痕
    ctx.moveTo(lxOuter, ly - 5);
    ctx.lineTo(lxOuter, ly + 5);
    ctx.moveTo(lxInner, ly - 5);
    ctx.lineTo(lxInner, ly + 5);
    ctx.stroke();
  }

  // 4) 部件侧边短签（统一排到形体左右安全侧并做竖向碰撞消解，绝不重叠压字！）
  const compact = w < 440 || h < 300;
  const calloutItems = [
    {
      key: "portal",
      ax: t.x(portal.x - portal.halfW) - 5,
      ay: t.y(portal.y - 0.03),
      side: "left",
      text: !checks.layerOk ? (ev.layer.detached ? "拖回次形" : "粘连 · 拖开") : geo.scene === "mark" ? "拖箭对齐" : "次形",
      color: checks.layerOk ? goldColor : errColor,
      important: !checks.layerOk || activeHandle === "portal",
    },
    {
      key: "apex",
      ax: t.x(path.apex.x) + (path.apex.x >= 0 ? -8 : 8),
      ay: t.y(path.apex.y) - 2,
      side: path.apex.x >= 0 ? "left" : "right",
      text: !checks.guideOk ? `偏 ${Math.abs(gaze.deg)}° · 拖正` : "光道正轴",
      color: checks.guideOk ? okColor : errColor,
      important: !checks.guideOk || activeHandle === "apex",
    },
  ];
  if (eye.on) {
    calloutItems.push({
      key: "eye",
      ax: t.x(eye.x) - t.s(eye.r) - 6,
      ay: t.y(eye.y),
      side: "left",
      text: !checks.balanceOk ? "黑眼破边 · 拖入" : "黑眼",
      color: checks.balanceOk ? goldColor : errColor,
      important: !checks.balanceOk || activeHandle === "eye",
    });
  }

  // 仅当显示引注或状态异常/拖动中时画短签，且对同侧标签按 y 排序防碰撞
  const visibleItems = calloutItems.filter((it) => it.important || (geo.showGuides && !compact));
  visibleItems.sort((a, b) => a.ay - b.ay);
  const placedBoxes = [];
  ctx.font = `700 ${compact ? 10 : 11}px "Noto Serif SC", "Archivo", sans-serif`;
  const boxH = compact ? 18 : 20;
  for (const it of visibleItems) {
    const tw = Math.ceil(ctx.measureText(it.text).width) + 12;
    let bx = it.side === "left" ? it.ax - tw - 10 : it.ax + 10;
    bx = clamp(bx, 10, w - tw - 10);
    let by = clamp(it.ay - boxH / 2, 42, h - boxH - 10);
    for (const prev of placedBoxes) {
      const horizOverlap = bx < prev.x + prev.w + 6 && bx + tw + 6 > prev.x;
      if (horizOverlap && Math.abs(by - prev.y) < boxH + 5) {
        by = clamp(prev.y + boxH + 6, 42, h - boxH - 10);
      }
    }
    placedBoxes.push({ x: bx, y: by, w: tw, h: boxH });

    // 短引线连接形体边缘与标签
    const lx = it.side === "left" ? bx + tw : bx;
    const ly = by + boxH / 2;
    ctx.strokeStyle = it.color;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = it.important ? dashBreath : 0.72;
    ctx.beginPath();
    ctx.moveTo(it.ax, it.ay);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = inv ? "rgba(0,6,22,0.88)" : "rgba(9,17,38,0.92)";
    ctx.fillRect(bx, by, tw, boxH);
    ctx.strokeStyle = it.color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by, tw, boxH);
    ctx.fillStyle = PALETTE.white;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(it.text, bx + tw / 2, by + boxH / 2 + 0.5);
  }

  // 5) 原海报风格右侧金点弧形虚线指向（空间充裕时显示，与左侧互动标签左右分离零碰撞）
  if (geo.showGuides && w >= 470 && h >= 320) {
    const rightEdge = w - 12;
    const rawAnchors = [
      { ax: t.x(arch.cx + arch.outerR * 0.94), ay: t.y(arch.cy - arch.outerR * 0.2), label: "主形" },
      { ax: t.x(portal.x + portal.halfW + 0.025), ay: t.y(portal.y - 0.015), label: "次形" },
      { ax: t.x(path.apex.x + 0.14), ay: t.y(0.23), label: "引导" },
    ];
    ctx.font = `700 11px "Archivo", "Noto Serif SC", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    let lastLabelY = 26;
    for (const a of rawAnchors) {
      if (a.ax > rightEdge - 58) continue;
      const ly = Math.max(lastLabelY + 28, a.ay - 4);
      lastLabelY = ly;
      ctx.strokeStyle = inv ? "rgba(0,6,22,0.42)" : "rgba(254,254,252,0.46)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(a.ax, a.ay);
      ctx.quadraticCurveTo((a.ax + rightEdge - 38) * 0.5, (a.ay + ly) * 0.5 - 6, rightEdge - 40, ly);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = goldColor;
      ctx.beginPath();
      ctx.arc(a.ax, a.ay, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = goldColor;
      ctx.fillText(a.label, rightEdge, ly);
    }
  }

  // 6) 左上角精简实测状态条
  const tagText = `黑 ${ev.blackPct}% · 白 ${ev.whitePct}% · ${ev.score}/4`;
  ctx.font = `600 11px "JetBrains Mono", monospace`;
  const tw = ctx.measureText(tagText).width + 16;
  ctx.fillStyle = inv ? "rgba(248,247,242,0.92)" : "rgba(9,17,38,0.88)";
  ctx.strokeStyle = ev.score === 4 ? okColor : inv ? "rgba(0,6,22,0.22)" : "rgba(251,210,18,0.4)";
  ctx.lineWidth = 1;
  ctx.fillRect(12, 12, tw, 24);
  ctx.strokeRect(12, 12, tw, 24);
  ctx.fillStyle = ev.score === 4 ? okColor : inv ? PALETTE.ink : PALETTE.white;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, 20, 24);

  ctx.restore();
}

export function getHandlePositions(geo, t) {
  return {
    portal: { x: t.x(geo.portal.x), y: t.y(geo.portal.y - 0.015) },
    apex: { x: t.x(geo.path.apex.x), y: t.y(geo.path.apex.y) },
    eye: { x: t.x(geo.eye.x), y: t.y(geo.eye.y) },
  };
}

// 命中测试：直接命中圆黑眼本体、光道尖顶或次形门洞本体，其余任意位置横拖雕刻白色体量
export function hitTestHandle(px, py, geo, w, h) {
  const t = makeTransform(w, h);
  const handles = getHandlePositions(geo, t);
  const eyeHitR = Math.max(24, t.s(geo.eye.r) + 10);
  if (geo.eye.on && Math.hypot(px - handles.eye.x, py - handles.eye.y) <= eyeHitR) return "eye";
  if (Math.hypot(px - handles.apex.x, py - handles.apex.y) <= 24) return "apex";
  // 次形门洞按完整矩形区域命中，直接抓住白门洞拖动
  const pLeft = t.x(geo.portal.x - geo.portal.halfW) - 14;
  const pRight = t.x(geo.portal.x + geo.portal.halfW) + 14;
  const pTop = t.y(geo.portal.topCy - geo.portal.topR) - 12;
  const pBot = t.y(geo.portal.baseY) + 10;
  if (px >= pLeft && px <= pRight && py >= pTop && py <= pBot) return "portal";
  return "carve";
}

// 供底栏「构图步骤 1→2→3」微缩线框实时同步
export function drawStepThumb(canvas, stepNum, ev) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const { geo } = ev;
  const t = makeTransform(w, h);

  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, 0, w, h);

  if (stepNum === 1) {
    ctx.strokeStyle = "rgba(254,254,252,0.75)";
    ctx.lineWidth = 1.4;
    const { arch } = geo;
    ctx.beginPath();
    ctx.moveTo(t.x(arch.cx - arch.outerR), t.y(arch.legBottomOuter));
    ctx.lineTo(t.x(arch.cx - arch.outerR), t.y(arch.cy));
    ctx.arc(t.x(arch.cx), t.y(arch.cy), t.s(arch.outerR), Math.PI, 0, false);
    ctx.lineTo(t.x(arch.cx + arch.outerR), t.y(arch.legBottomOuter));
    ctx.stroke();
  } else if (stepNum === 2) {
    const noEyeEv = { ...ev, geo: { ...geo, eye: { ...geo.eye, on: false } } };
    drawComposition(ctx, w, h, noEyeEv, { invertOverride: false, mini: true });
  } else {
    drawComposition(ctx, w, h, ev, { invertOverride: false, mini: true });
  }
}

export { isWhiteAt };
