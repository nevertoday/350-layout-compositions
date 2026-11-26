// 308 净单人镜头 · 同源 2D Canvas 取景台渲染器（开场主画布与 06 小练习共用）
// 绝不使用高开销整幅 ctx.filter 模糊，采用轻量多层柔焦渐层绘制，保证 6× 慢手机与软件渲染均 ≥ 50 fps。

import { evaluate, hexToRgb, mixRgb, clamp } from "./model.js";
import { drawSilhouette } from "./silhouette.js";

function rgbStr([r, g, b], a = 1) {
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

// 轻量柔焦圆角矩形（根据 aperture f-stop 动态扩展柔边，零滤镜开销）
function drawSoftRect(ctx, x, y, w, h, colorRgb, alpha, blurPx) {
  const layers = blurPx > 5 ? 4 : blurPx > 2 ? 2 : 1;
  for (let i = layers; i >= 1; i--) {
    const spread = layers === 1 ? 0 : (i - 1) * (blurPx * 0.72);
    const a = layers === 1 ? alpha : (alpha / layers) * (1.28 - (i - 1) * 0.22);
    ctx.fillStyle = rgbStr(colorRgb, clamp(a, 0.02, 0.96));
    ctx.fillRect(x - spread, y - spread, w + spread * 2, h + spread * 2);
  }
}

// 轻量背景路人剪影（零五官、纯背侧影，支持景深柔焦）
function drawExtraSilhouette(ctx, rect, W, H, blurPx, scene) {
  const cx = (rect.x + rect.w * 0.5) * W;
  const top = rect.y * H;
  const h = rect.h * H;
  const rw = rect.w * W;
  const baseRgb = scene === "theater" ? [14, 7, 9] : [36, 22, 24];
  const passes = blurPx > 5 ? 3 : blurPx > 2 ? 2 : 1;

  ctx.save();
  for (let i = passes; i >= 1; i--) {
    const grow = (i - 1) * blurPx * 0.62;
    const alpha = passes === 1 ? 0.82 : 0.22 + (passes - i) * 0.14;
    ctx.fillStyle = rgbStr(baseRgb, alpha);
    // 头部椭影
    ctx.beginPath();
    ctx.ellipse(cx, top + h * 0.14, rw * 0.24 + grow, h * 0.115 + grow, 0, 0, Math.PI * 2);
    ctx.fill();
    // 肩身剪影
    ctx.beginPath();
    ctx.moveTo(cx - rw * 0.48 - grow, top + h + 4);
    ctx.quadraticCurveTo(cx - rw * 0.44 - grow, top + h * 0.30 - grow * 0.5, cx, top + h * 0.27 - grow * 0.4);
    ctx.quadraticCurveTo(cx + rw * 0.44 + grow, top + h * 0.30 - grow * 0.5, cx + rw * 0.48 + grow, top + h + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 左侧闯入的同伴黑肩（纯剪影，标志镜头滑向 309 脏单人）
function drawForegroundShoulder(ctx, rect, W, H, blurPx) {
  const rw = rect.w * W;
  const top = rect.y * H;
  const passes = blurPx > 4 ? 3 : 2;
  ctx.save();
  for (let i = passes; i >= 1; i--) {
    const grow = (i - 1) * Math.max(2, blurPx * 0.85);
    const alpha = i === 1 ? 0.94 : 0.28 / i;
    ctx.fillStyle = `rgba(10, 6, 8, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(-10, H + 10);
    ctx.lineTo(-10, top + H * 0.08 - grow);
    // 颈肩与后脑一角轮廓
    ctx.bezierCurveTo(
      rw * 0.58 + grow,
      top - grow,
      rw * 0.88 + grow,
      top + H * 0.12,
      rw * 0.82 + grow,
      top + H * 0.32
    );
    ctx.bezierCurveTo(
      rw * 0.98 + grow,
      top + H * 0.46,
      rw * 1.04 + grow,
      H * 0.84,
      rw * 0.96 + grow,
      H + 10
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 可点击清场虚线标识（只画在开启交互的开场画布上）
function drawStrikeHint(ctx, x, y, label, active) {
  ctx.save();
  ctx.font = '700 11px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(label).width;
  const pw = tw + 16;
  const ph = 22;
  const bx = clamp(x - pw * 0.5, 10, ctx.canvas._cssW - pw - 10);
  const by = clamp(y - ph * 0.5, 10, ctx.canvas._cssH - ph - 10);
  ctx.fillStyle = active ? "rgba(123, 28, 42, 0.94)" : "rgba(23, 12, 14, 0.82)";
  ctx.beginPath();
  ctx.roundRect(bx, by, pw, ph, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(252, 231, 208, 0.72)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FCE7D0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + pw * 0.5, by + ph * 0.5 + 0.5);
  ctx.restore();
}

export function renderViewfinder(ctx, W, H, state, opts = {}) {
  const {
    interactive = true,
    showStrikeHints = true,
    gazeAnim = 0, // 0 = 关闭，0..1 = 0.8s 读图验真进度
    revealOverlay = false, // 06 练习揭晓后画视线留白与裁切标尺
    t = 0,
  } = opts;

  ctx.canvas._cssW = W;
  ctx.canvas._cssH = H;
  const aspect = W / Math.max(1, H);
  const ev = evaluate(state, aspect);
  const g = ev.geometry;
  const sc = ev.scene;

  const baseRgb = hexToRgb(sc.bgHex);
  const shadowRgb = hexToRgb(sc.bgShadowHex);
  const discRgb = hexToRgb(sc.discHex);
  const ambientFactor = state.scene === "theater" ? 0.15 : clamp((state.haloBright - 0.35) / 0.50, 0.12, 1.0);
  const wallRgb = mixRgb(shadowRgb, baseRgb, clamp(ambientFactor, 0, 1));
  const litRgb = mixRgb(wallRgb, discRgb, clamp(state.haloBright, 0, 1));

  // 1. 棚拍墙面底色（随光池明暗轻微呼应，忠实原海报 #FCBCA6 质感）
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, rgbStr(mixRgb(wallRgb, baseRgb, 0.28)));
  bgGrad.addColorStop(1, rgbStr(wallRgb));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 窗畔剧本加一道极柔和斜向自然窗影，剧场剧本加微弱幕布纵纹
  if (state.scene === "window") {
    ctx.save();
    ctx.fillStyle = "rgba(255, 244, 232, 0.16)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.12);
    ctx.lineTo(W * 0.52, 0);
    ctx.lineTo(W * 0.66, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (state.scene === "theater") {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
    for (let i = 0; i < 9; i++) {
      ctx.fillRect((i / 9) * W, 0, W * 0.035, H);
    }
    ctx.restore();
  }

  // 2. 招牌淡奶黄圆月光池（严格正圆：半径以画布高定标，永不压扁成椭圆）
  const hCx = g.halo.cx * W;
  const hCy = g.halo.cy * H;
  const hR = g.halo.r * H;

  // 轻微外晕（若过曝则外晕刺眼外溢）
  const haloFeather = state.haloBright > 0.96 ? hR * 0.24 : hR * 0.06;
  const discGrad = ctx.createRadialGradient(hCx, hCy, hR * 0.72, hCx, hCy, hR + haloFeather);
  discGrad.addColorStop(0, rgbStr(litRgb, 1));
  discGrad.addColorStop(0.92, rgbStr(litRgb, 0.98));
  discGrad.addColorStop(1, rgbStr(litRgb, 0));
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(hCx, hCy, hR + haloFeather, 0, Math.PI * 2);
  ctx.fill();

  // 若开启过曝，叠加刺眼白光核提示
  if (state.haloBright > 0.96 && state.haloRadius > 0.41) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.arc(hCx, hCy, hR * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 背景杂乱壁框与亮灯（受 aperture 浅景深柔化）
  if (state.bgClutter) {
    const cr = g.bgClutterRect;
    const x = cr.x * W, y = cr.y * H, w = cr.w * W, h = cr.h * H;
    const dofSoft = ev.blurPx;
    const wallDark = state.scene === "theater" ? [84, 34, 42] : [132, 56, 58];
    const lampWarm = [255, 232, 168];

    // 墙面矩形挂框
    drawSoftRect(ctx, x, y, w * 0.62, h * 0.74, wallDark, ev.clutterDissolvedByDof ? 0.22 : 0.66, dofSoft);
    drawSoftRect(ctx, x + w * 0.10, y + h * 0.14, w * 0.42, h * 0.46, [252, 224, 200], ev.clutterDissolvedByDof ? 0.18 : 0.56, dofSoft);
    // 杂乱亮壁灯（高对比干扰点）
    const lx = x + w * 0.84;
    const ly = y + h * 0.34;
    const lr = Math.max(10, Math.min(W, H) * 0.032 + dofSoft * 0.9);
    const lGrad = ctx.createRadialGradient(lx, ly, 2, lx, ly, lr * 1.9);
    lGrad.addColorStop(0, rgbStr(lampWarm, ev.clutterDissolvedByDof ? 0.42 : 0.96));
    lGrad.addColorStop(0.55, rgbStr([244, 152, 114], ev.clutterDissolvedByDof ? 0.20 : 0.58));
    lGrad.addColorStop(1, "rgba(244,152,114,0)");
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lr * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // 杂乱竖条墙格
    for (let k = 0; k < 3; k++) {
      drawSoftRect(
        ctx,
        W * (0.04 + k * 0.042),
        H * 0.06,
        3,
        H * 0.42,
        wallDark,
        ev.clutterDissolvedByDof ? 0.12 : 0.36,
        dofSoft
      );
    }
  }

  // 4. 背景穿头竖杆（Merger 叠线）
  if (state.bgPole) {
    const px = g.bgPoleRect.poleX * W;
    const poleW = Math.max(6, W * 0.013);
    const poleRgb = state.scene === "theater" ? [12, 5, 7] : [48, 16, 22];
    drawSoftRect(ctx, px - poleW * 0.5, 0, poleW, H * 0.78, poleRgb, 0.90, Math.min(3.5, ev.blurPx * 0.45));
    // 顶部灯架横臂增加真实片场辨识度
    drawSoftRect(ctx, px - poleW * 2.2, H * 0.06, poleW * 4.4, poleW * 0.9, poleRgb, 0.82, Math.min(2.5, ev.blurPx * 0.35));
  }

  // 5. 背景路人剪影
  if (state.bgExtra) {
    drawExtraSilhouette(ctx, g.bgExtraRect, W, H, ev.blurPx, state.scene);
  }

  // 6. 原海报细虚线定位轴（仅轻微优雅呈现，绝不喧宾夺主）
  const guideColor = state.scene === "theater" ? "rgba(252, 231, 208, 0.34)" : "rgba(123, 28, 42, 0.36)";
  if (state.showGuides) {
    ctx.save();
    ctx.strokeStyle = guideColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(hCx, H * 0.05);
    ctx.lineTo(hCx, H * 0.95);
    ctx.moveTo(W * 0.06, hCy);
    ctx.lineTo(W * 0.94, hCy);
    ctx.stroke();
    ctx.restore();
  }

  // 7. 主角纯黑侧影剪影（原海报真实提取透明蒙版 / 剧场与窗畔纯净轮廓，严格零五官）
  const drawBox = {
    x: g.box.x * W,
    y: g.box.y * H,
    w: g.box.w * W,
    h: g.box.h * H,
  };
  drawSilhouette(ctx, state.scene, drawBox, sc.silHex);

  // 8. 左侧闯入的同伴黑肩（最前景层）
  if (state.fgShoulder) {
    drawForegroundShoulder(ctx, g.fgShoulderRect, W, H, ev.blurPx);
  }

  // 9. 点击左侧 5 枚原海报圆徽时高亮对应的几何证明图层
  const hb = state.highlightBadge;
  if (interactive && hb >= 0) {
    ctx.save();
    const accent = state.scene === "theater" ? "#FF947D" : "#7B1C2A";
    if (hb === 0) {
      // 主体纯净：标出主体安全域
      ctx.strokeStyle = ev.cleanSubjectOk ? "#124B3A" : "#9C1520";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(drawBox.x + drawBox.w * 0.14, drawBox.y + drawBox.h * 0.03, drawBox.w * 0.80, drawBox.h * 0.92);
    } else if (hb === 1) {
      // 背景简化：标出后景干扰检视圈
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(W * 0.06, H * 0.06, W * 0.88, H * 0.88);
    } else if (hb === 2) {
      // 边缘清晰：在 6 个实测轮廓点标出真实对比度圆点
      for (const pt of ev.sampleResults) {
        const px = pt.x * W, py = pt.y * H;
        ctx.fillStyle = pt.inDisc && state.haloBright >= 0.56 ? "#124B3A" : "#9C1520";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FCE7D0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (hb === 3 || hb === 4) {
      // 情绪集中 / 可读性：画出前方视线呼吸空间廊道
      const corridorLeft = state.fgShoulder ? g.fgShoulderRect.w * 0.88 * W : W * 0.03;
      const corridorRight = g.noseX * W;
      if (corridorRight > corridorLeft + 6) {
        ctx.fillStyle = ev.breathingOk ? "rgba(18, 75, 58, 0.16)" : "rgba(156, 21, 32, 0.22)";
        ctx.fillRect(corridorLeft, g.eyeLineY * H - 24, corridorRight - corridorLeft, 48);
        ctx.strokeStyle = ev.breathingOk ? "#124B3A" : "#9C1520";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(corridorRight, g.eyeLineY * H);
        ctx.lineTo(corridorLeft + 8, g.eyeLineY * H);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 10. 06 练习揭晓时的同源标尺叠加
  if (revealOverlay) {
    ctx.save();
    const nosePx = g.noseX * W;
    const eyePx = g.eyeLineY * H;
    const ok = ev.passedCount === 4;
    ctx.fillStyle = ok ? "rgba(18, 75, 58, 0.20)" : "rgba(156, 21, 32, 0.22)";
    ctx.fillRect(2, eyePx - 16, Math.max(4, nosePx - 4), 32);
    ctx.strokeStyle = ok ? "#124B3A" : "#9C1520";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(nosePx, eyePx);
    ctx.lineTo(8, eyePx);
    ctx.stroke();

    // 发髻越界告警线
    if (g.bunX > 0.965) {
      ctx.strokeStyle = "#9C1520";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W - 3, H * 0.14);
      ctx.lineTo(W - 3, H * 0.62);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 11. 可点击清场提示标牌（仅在存在干扰且开启提示时显示，直观传达可直点剔除）
  if (interactive && showStrikeHints) {
    if (state.fgShoulder) {
      drawStrikeHint(ctx, g.fgShoulderRect.w * 0.52 * W, H * 0.72, "× 点此清前肩", true);
    }
    if (state.bgExtra) {
      drawStrikeHint(ctx, (g.bgExtraRect.x + g.bgExtraRect.w * 0.45) * W, H * 0.56, "× 点此清路人", true);
    }
    if (state.bgPole) {
      drawStrikeHint(ctx, g.bgPoleRect.poleX * W, Math.max(66, H * 0.19), "× 点此撤竖杆", true);
    }
    if (state.bgClutter && !ev.clutterDissolvedByDof) {
      drawStrikeHint(ctx, (g.bgClutterRect.x + g.bgClutterRect.w * 0.44) * W, Math.max(98, H * 0.31), "× 点此清杂墙", false);
    }

    // 圆月边缘极细柔环提示，表明可直接拖动光池位置
    ctx.save();
    const ringCol = state.scene === "theater" ? "rgba(252,231,208,0.52)" : "rgba(123,28,42,0.44)";
    ctx.strokeStyle = ringCol;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(hCx, hCy, hR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 12. 0.8s 读图验真眼动轨迹与切镜瞬闪动画
  if (gazeAnim > 0) {
    ctx.save();
    // 开场 0.12s 轻微切镜黑幕眨眼感
    if (gazeAnim < 0.16) {
      const flash = (1 - gazeAnim / 0.16) * 0.58;
      ctx.fillStyle = `rgba(16, 8, 9, ${flash.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
    const nodes = ev.gazeNodes;
    const progress = clamp((gazeAnim - 0.1) / 0.85, 0, 1);
    const totalSegs = Math.max(1, nodes.length - 1);
    const curFloat = progress * totalSegs;

    ctx.strokeStyle = ev.passedCount === 4 ? "#124B3A" : "#9C1520";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      if (i === 0) ctx.moveTo(p.x * W, p.y * H);
      else if (i <= Math.floor(curFloat)) ctx.lineTo(p.x * W, p.y * H);
      else if (i === Math.floor(curFloat) + 1) {
        const frac = curFloat - Math.floor(curFloat);
        const prev = nodes[i - 1];
        ctx.lineTo((prev.x + (p.x - prev.x) * frac) * W, (prev.y + (p.y - prev.y) * frac) * H);
      }
    }
    ctx.stroke();

    // 画已抵达的落点序号圆与微标签
    const arrived = Math.min(nodes.length, Math.floor(curFloat) + 1);
    for (let i = 0; i < arrived; i++) {
      const p = nodes[i];
      const px = p.x * W, py = p.y * H;
      const pulse = 1 + Math.sin(t * 7 + i) * 0.12;
      ctx.fillStyle = ev.passedCount === 4 ? "#124B3A" : "#9C1520";
      ctx.beginPath();
      ctx.arc(px, py, 9 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FCE7D0";
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), px, py + 0.5);

      if (i === arrived - 1) {
        drawStrikeHint(ctx, px, py - 24, p.label, ev.passedCount < 4);
      }
    }
    ctx.restore();
  }

  // 13. 1:1 复刻原海报四角酒红 L 形取景框（永不裁切、任何屏幕清晰利落）
  const pad = Math.round(Math.min(W, H) * 0.045);
  const arm = Math.round(Math.min(W, H) * 0.088);
  const bracketCol = state.scene === "theater" ? "#F7DEC6" : "#8A1C2D";
  ctx.save();
  ctx.strokeStyle = bracketCol;
  ctx.lineWidth = Math.max(2.2, Math.min(W, H) * 0.006);
  ctx.lineCap = "square";
  ctx.beginPath();
  // 左上
  ctx.moveTo(pad, pad + arm);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + arm, pad);
  // 右上
  ctx.moveTo(W - pad - arm, pad);
  ctx.lineTo(W - pad, pad);
  ctx.lineTo(W - pad, pad + arm);
  // 左下
  ctx.moveTo(pad, H - pad - arm);
  ctx.lineTo(pad, H - pad);
  ctx.lineTo(pad + arm, H - pad);
  // 右下
  ctx.moveTo(W - pad - arm, H - pad);
  ctx.lineTo(W - pad, H - pad);
  ctx.lineTo(W - pad, H - pad - arm);
  ctx.stroke();
  ctx.restore();

  // 14. 右上角极薄光学读数条（完全避开左侧杂墙与头顶竖杆，任何屏宽零重叠）
  if (interactive) {
    ctx.save();
    const hudText = `f/${state.aperture.toFixed(1)} · 对比 ${ev.contourRatio}:1 · 留白 ${ev.lookRoomPct}%`;
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    const tw = ctx.measureText(hudText).width + 18;
    const hx = Math.max(pad + 6, W - pad - tw - 8);
    const hy = pad + 8;
    ctx.fillStyle = "rgba(23, 12, 14, 0.86)";
    ctx.fillRect(hx, hy, tw, 24);
    ctx.fillStyle = "#FCE7D0";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, hx + 9, hy + 12.5);
    ctx.restore();
  }

  return ev;
}

// 点击画布内干扰元素的命中判定（归一化坐标 nx, ny）
export function hitTestClutter(state, nx, ny, aspect = 1.28) {
  const g = evaluate(state, aspect).geometry;
  if (state.fgShoulder) {
    const r = g.fgShoulderRect;
    if (nx >= r.x && nx <= r.x + r.w + 0.02 && ny >= r.y - 0.02 && ny <= 1) return "fgShoulder";
  }
  if (state.bgExtra) {
    const r = g.bgExtraRect;
    if (nx >= r.x - 0.03 && nx <= r.x + r.w + 0.04 && ny >= r.y - 0.03 && ny <= 1) return "bgExtra";
  }
  if (state.bgPole) {
    const r = g.bgPoleRect;
    if (Math.abs(nx - r.poleX) <= 0.065 && ny >= 0 && ny <= 0.56) return "bgPole";
  }
  if (state.bgClutter) {
    const r = g.bgClutterRect;
    if (nx >= r.x - 0.03 && nx <= r.x + r.w + 0.05 && ny >= r.y - 0.03 && ny <= r.y + r.h + 0.05) return "bgClutter";
  }
  return null;
}
