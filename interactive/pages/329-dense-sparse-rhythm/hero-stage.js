// 329 开场主角画布：密疏点阵声谱 × 疏朗焦点调律台
// 1:1 承袭 329 原海报明姜黄纸面、纯黑渐变点阵、克莱因蓝孤圆、+ 气眼与底沿蓝色节奏波
import { loop, pixelRatio } from "../../lib/stage.js";
import { FOCUS_RADIUS, clamp } from "./model.js";

const COLORS = {
  yellow: "#F8C426",
  yellowDeep: "#E6AE12",
  ink: "#0B0907",
  inkSoft: "rgba(11, 9, 7, 0.24)",
  blue: "#1F3BB6",
  blueSoft: "rgba(31, 59, 182, 0.20)",
  blueWash: "rgba(31, 59, 182, 0.08)",
  warn: "#A82412",
  warnSoft: "rgba(168, 36, 18, 0.16)",
  ok: "#0F5D42",
  paperLight: "#FDFBF4",
};

export function mountHeroStage(canvas, getData, callbacks) {
  const ctx = canvas.getContext("2d");
  let w = 720;
  let h = 480;
  let dpr = 1;

  // 柔和入场进度（确保 0s 与 0.9s 截图均清晰完整，1.1s 后收束静止省电）
  let introProgress = 0;
  let introDone = false;
  let dirty = true;

  // 指针交互状态
  let dragKind = null; // "focus" | "gather" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartGather = 0;
  let dragMoved = false;
  let hoverFocus = false;
  let activePointerId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    dirty = true;
  }

  // 主画幅区（占顶部 82% 高度）与底沿实时节奏波带（占底部 18% 高度）
  function metrics() {
    const waveH = Math.max(52, Math.min(82, Math.round(h * 0.175)));
    const fieldH = h - waveH;
    const shortSide = Math.min(w, fieldH);
    const areaSide = Math.sqrt(Math.max(1, w * fieldH));
    return { w, h, fieldH, waveH, shortSide, areaSide, aspect: w / Math.max(1, fieldH) };
  }

  function toCanvasFocus(state, m) {
    return {
      x: state.focus.u * m.w,
      y: state.focus.v * m.fieldH,
      r: FOCUS_RADIUS * m.shortSide,
    };
  }

  // 绘原海报风格「墨点蓝圆」
  function drawPosterField(state, pts, evalRes, m, ease) {
    // 极轻的画纸水平呼吸参考线（只在密疏失衡或悬停时极克制显现）
    ctx.save();
    ctx.strokeStyle = "rgba(11, 9, 7, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, m.fieldH);
    ctx.lineTo(m.w, m.fieldH);
    ctx.stroke();

    // 画 330 颗纯黑墨点（严格正圆，半径与单真源面积基准 areaSide 一致）
    ctx.fillStyle = COLORS.ink;
    const scaleIn = 0.88 + 0.12 * ease;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const px = p.u * m.w;
      const py = p.v * m.fieldH;
      const pr = Math.max(1.2, p.r * m.areaSide * scaleIn);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 气眼 "+"（复刻 329 原海报中右那枚清脆纯黑小十字）
    const ex = state.eye.u * m.w;
    const ey = state.eye.v * m.fieldH;
    const arm = Math.max(7, Math.round(m.shortSide * 0.022));
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ex - arm, ey);
    ctx.lineTo(ex + arm, ey);
    ctx.moveTo(ex, ey - arm);
    ctx.lineTo(ex, ey + arm);
    ctx.stroke();

    // 克莱因蓝孤圆焦点 + 呼吸护城河光环
    const f = toCanvasFocus(state, m);
    const moatR = f.r * 1.65;
    const buried = evalRes.focusIntruders > 2 || evalRes.focusClearPct < 72;
    const edgeBad = evalRes.focusEdgePct < 9;

    // 呼吸圈反馈（无刺眼红贴条，克制使用原海报线型语汇）
    ctx.beginPath();
    ctx.arc(f.x, f.y, moatR, 0, Math.PI * 2);
    if (buried || edgeBad) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = COLORS.warn;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (evalRes.ok || hoverFocus) {
      ctx.strokeStyle = hoverFocus ? COLORS.blue : "rgba(31, 59, 182, 0.34)";
      ctx.lineWidth = hoverFocus ? 1.8 : 1.2;
      ctx.stroke();
    }

    // 蓝圆本体
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * (0.94 + 0.06 * ease), 0, Math.PI * 2);
    ctx.fillStyle = COLORS.blue;
    ctx.fill();

    // 若被黑点侵扰，在蓝圆内描一圈细明黄内环提示可拖出；悬停/拖动时外圈轻亮
    if (buried || edgeBad) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 0.72, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.yellow;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (dragKind === "focus" || hoverFocus) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 在蓝圆中心极简绘双箭头提示（仅在未移出错态或悬停时轻显，保持原海报极简美感）
    if (buried || edgeBad || hoverFocus || dragKind === "focus") {
      const a = Math.max(5, f.r * 0.24);
      ctx.strokeStyle = COLORS.paperLight;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(f.x - a, f.y);
      ctx.lineTo(f.x + a, f.y);
      ctx.moveTo(f.x + a - 3.5, f.y - 3.5);
      ctx.lineTo(f.x + a, f.y);
      ctx.lineTo(f.x + a - 3.5, f.y + 3.5);
      ctx.moveTo(f.x - a + 3.5, f.y - 3.5);
      ctx.lineTo(f.x - a, f.y);
      ctx.lineTo(f.x - a + 3.5, f.y + 3.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 绘宋人长卷风格「疏林孤舟」（仍严格读取同一组 pts 与 focus！）
  function drawScrollField(state, pts, evalRes, m, ease) {
    ctx.save();
    // 绢本淡淡远山脊（随 profile 真实起伏画出，与密区一一对应）
    const prof = evalRes.profile;
    ctx.beginPath();
    ctx.moveTo(0, m.fieldH);
    for (let i = 0; i < prof.length; i++) {
      const x = ((i + 0.5) / prof.length) * m.w;
      const peakH = (prof[i] / 100) * m.fieldH * 0.62 * ease;
      const y = m.fieldH - peakH - 12;
      if (i === 0) ctx.lineTo(0, y);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(m.w, m.fieldH);
    ctx.closePath();
    ctx.fillStyle = "rgba(11, 9, 7, 0.085)";
    ctx.fill();

    // 淡墨水纹（在疏区轻轻展开）
    ctx.strokeStyle = "rgba(11, 9, 7, 0.14)";
    ctx.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
      const wy = m.fieldH * (0.64 + row * 0.11);
      ctx.beginPath();
      ctx.moveTo(m.w * 0.48, wy);
      ctx.bezierCurveTo(m.w * 0.64, wy - 4, m.w * 0.78, wy + 5, m.w * 0.94, wy - 2);
      ctx.stroke();
    }

    // 同一组实绘点化作水墨苔点与枯笔点叶（大小形状随局部强度变化）
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const px = p.u * m.w;
      const py = p.v * m.fieldH;
      const pr = Math.max(1.3, p.r * m.areaSide * (0.9 + 0.1 * ease));
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((p.seed - 0.5) * 1.1);
      ctx.fillStyle = p.strength > 0.52 ? "rgba(11, 9, 7, 0.92)" : "rgba(11, 9, 7, 0.56)";
      ctx.beginPath();
      // 略扁的米家苔点
      ctx.ellipse(0, 0, pr * 1.18, pr * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 克莱因蓝孤舟（由 focus 坐标驱动，绝不画五官，仅极简一笠剪影）
    const f = toCanvasFocus(state, m);
    const buried = evalRes.focusIntruders > 2 || evalRes.focusClearPct < 72;
    const moatR = f.r * 1.65;

    ctx.beginPath();
    ctx.arc(f.x, f.y, moatR, 0, Math.PI * 2);
    ctx.strokeStyle = buried ? COLORS.warn : "rgba(31, 59, 182, 0.30)";
    ctx.lineWidth = buried ? 1.6 : 1.1;
    if (buried) ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 淡蓝江晕托底
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 1.04, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(31, 59, 182, 0.14)";
    ctx.fill();

    // 青蓝孤舟艇身
    const bw = f.r * 1.65;
    const bh = f.r * 0.44;
    ctx.fillStyle = COLORS.blue;
    ctx.beginPath();
    ctx.moveTo(f.x - bw * 0.55, f.y + bh * 0.2);
    ctx.quadraticCurveTo(f.x, f.y + bh * 1.25, f.x + bw * 0.58, f.y + bh * 0.05);
    ctx.quadraticCurveTo(f.x, f.y + bh * 0.45, f.x - bw * 0.55, f.y + bh * 0.2);
    ctx.closePath();
    ctx.fill();

    // 极简斗笠与背影剪影（无五官）
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(f.x - bw * 0.16, f.y - bh * 0.28);
    ctx.lineTo(f.x - bw * 0.02, f.y - bh * 0.72);
    ctx.lineTo(f.x + bw * 0.14, f.y - bh * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(f.x - bw * 0.01, f.y - bh * 0.02, bw * 0.1, bh * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 纤细竹竿
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(f.x + bw * 0.06, f.y - bh * 0.12);
    ctx.lineTo(f.x + bw * 0.42, f.y - bh * 1.05);
    ctx.stroke();

    // 气眼 "+" 化作一方极简墨印框
    const ex = state.eye.u * m.w;
    const ey = state.eye.v * m.fieldH;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ex - 6, ey - 6, 12, 12);
    ctx.restore();
  }

  // 绘现代版面风格「报刊图文」（把同一点阵化为排版字条与块面）
  function drawEditorialField(state, pts, evalRes, m, ease) {
    ctx.save();
    // 淡淡印刷版心细框
    const mx = m.w * 0.04;
    const my = m.fieldH * 0.06;
    ctx.strokeStyle = "rgba(11, 9, 7, 0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, m.w - mx * 2, m.fieldH - my * 2);

    // 墨点化为大小不一的排版文字段条与图块（真实面积与原圆点严格等量！）
    ctx.fillStyle = COLORS.ink;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const px = p.u * m.w;
      const py = p.v * m.fieldH;
      const pr = Math.max(1.2, p.r * m.areaSide * (0.9 + 0.1 * ease));
      // 与原圆面积近似相等的短横条（宽 2.4r, 高 1.3r）
      const bw = pr * 2.4;
      const bh = Math.max(2, pr * 1.22);
      ctx.globalAlpha = p.strength > 0.45 ? 0.94 : 0.58;
      ctx.fillRect(px - bw * 0.5, py - bh * 0.5, bw, bh);
    }
    ctx.globalAlpha = 1;

    // 气眼 "+" 化作版式套准十字
    const ex = state.eye.u * m.w;
    const ey = state.eye.v * m.fieldH;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    ctx.moveTo(ex - 10, ey);
    ctx.lineTo(ex + 10, ey);
    ctx.moveTo(ex, ey - 10);
    ctx.lineTo(ex, ey + 10);
    ctx.stroke();

    // 蓝色主视觉焦点徽章
    const f = toCanvasFocus(state, m);
    const buried = evalRes.focusIntruders > 2 || evalRes.focusClearPct < 72;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 1.65, 0, Math.PI * 2);
    ctx.strokeStyle = buried ? COLORS.warn : "rgba(31, 59, 182, 0.34)";
    ctx.lineWidth = buried ? 1.6 : 1.1;
    if (buried) ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.blue;
    ctx.fill();

    // 徽章内极简排版标线
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(f.x - f.r * 0.38, f.y - f.r * 0.14);
    ctx.lineTo(f.x + f.r * 0.38, f.y - f.r * 0.14);
    ctx.moveTo(f.x - f.r * 0.38, f.y + f.r * 0.16);
    ctx.lineTo(f.x + f.r * 0.12, f.y + f.r * 0.16);
    ctx.stroke();
    ctx.restore();
  }

  // 底沿实时「密度声谱波浪带」：复刻 329 原海报右下角的蓝色正弦节奏曲线 + 节拍竖线
  function drawRhythmBand(state, evalRes, m, ease) {
    const prof = evalRes.profile;
    const topY = m.fieldH;
    const bandH = m.waveH;
    const padX = m.w * 0.04;
    const plotW = m.w - padX * 2;
    const baseLine = topY + bandH - 12;
    const maxRise = bandH - 22;

    ctx.save();
    // 淡淡微黄沉底区隔
    ctx.fillStyle = "rgba(11, 9, 7, 0.04)";
    ctx.fillRect(0, topY, m.w, bandH);

    // 24 根极简竖拍线（复刻原海报 `| | · |` 节奏图例：密处长而粗，疏处短成细点）
    for (let i = 0; i < prof.length; i++) {
      const norm = clamp(prof[i] / 78, 0, 1);
      const x = padX + ((i + 0.5) / prof.length) * plotW;
      const barH = Math.max(3, norm * maxRise * 0.72 * ease);
      ctx.strokeStyle = norm > 0.35 ? "rgba(11, 9, 7, 0.45)" : "rgba(11, 9, 7, 0.22)";
      ctx.lineWidth = norm > 0.45 ? 2.1 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x, baseLine);
      ctx.lineTo(x, baseLine - barH);
      ctx.stroke();
    }

    // 实时蓝色节奏正弦曲线（随当前画面 24 切片实测墨量平滑样条生成）
    const pts = [];
    for (let i = 0; i < prof.length; i++) {
      const norm = clamp(prof[i] / 78, 0, 1);
      const x = padX + (i / (prof.length - 1)) * plotW;
      const y = baseLine - norm * maxRise * ease;
      pts.push({ x, y });
    }

    // 柔和淡蓝面积垫底
    ctx.beginPath();
    ctx.moveTo(pts[0].x, baseLine);
    ctx.lineTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) * 0.5;
      const my = (pts[i].y + pts[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(pts[pts.length - 1].x, baseLine);
    ctx.closePath();
    ctx.fillStyle = evalRes.ok ? COLORS.blueWash : "rgba(168, 36, 18, 0.08)";
    ctx.fill();

    // 标志克莱因蓝 3.2px 主弧线（错态且平直时转沉稳朱赤警示，让节奏起落一眼明辨）
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) * 0.5;
      const my = (pts[i].y + pts[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = evalRes.status === "flat" || evalRes.status === "cliff" ? COLORS.warn : COLORS.blue;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 在蓝圆横坐标对应的波形位置标一枚小蓝点，显示「主角落在波谷还是波峰」
    const fx = padX + state.focus.u * plotW;
    const fIdx = clamp(Math.round(state.focus.u * (pts.length - 1)), 0, pts.length - 1);
    const fy = pts[fIdx].y;
    ctx.beginPath();
    ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.blue;
    ctx.fill();
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 右上极简角标：标清这是实测密度波
    ctx.fillStyle = "rgba(11, 9, 7, 0.72)";
    ctx.font = '600 11px "Inter", "Noto Serif SC", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(`实时密度波 · ${evalRes.badge}`, m.w - padX, topY + 15);
    ctx.textAlign = "left";
    ctx.fillText(`密峰 ${evalRes.peakDensity}%  /  疏谷 ${evalRes.valleyDensity}%`, padX, topY + 15);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (!introDone) {
      if (still) {
        introProgress = 1;
        introDone = true;
      } else {
        introProgress = Math.min(1, introProgress + (dt || 0.016) * 1.15);
        if (introProgress >= 1) introDone = true;
        dirty = true;
      }
    }
    if (!dirty && !still) return;
    dirty = false;

    const m = metrics();
    const { state, pts, evalRes } = getData(m.aspect);
    const ease = 1 - Math.pow(1 - introProgress, 3);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 铺满 329 原海报明姜黄纸面
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(0, 0, m.w, m.h);

    if (state.theme === "scroll") {
      drawScrollField(state, pts, evalRes, m, ease);
    } else if (state.theme === "editorial") {
      drawEditorialField(state, pts, evalRes, m, ease);
    } else {
      drawPosterField(state, pts, evalRes, m, ease);
    }

    drawRhythmBand(state, evalRes, m, ease);
    ctx.restore();
  }

  // 指针坐标换算
  function clientToLocal(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
      rect,
    };
  }

  function isOnFocus(x, y, state, m) {
    const f = toCanvasFocus(state, m);
    const hitR = Math.max(f.r * 1.35, 34);
    return Math.hypot(x - f.x, y - f.y) <= hitR;
  }

  function onPointerDown(ev) {
    if (ev.button !== undefined && ev.button !== 0) return;
    const { x, y } = clientToLocal(ev);
    const m = metrics();
    const { state } = getData(m.aspect);
    activePointerId = ev.pointerId;
    dragStartX = x;
    dragStartY = y;
    dragStartGather = state.gather;
    dragMoved = false;

    if (isOnFocus(x, y, state, m)) {
      dragKind = "focus";
      canvas.style.cursor = "grabbing";
    } else {
      dragKind = "gather";
      canvas.style.cursor = "ew-resize";
    }
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {}
    dirty = true;
    ctl.draw();
  }

  function onPointerMove(ev) {
    const { x, y } = clientToLocal(ev);
    const m = metrics();
    const { state } = getData(m.aspect);

    if (!dragKind || ev.pointerId !== activePointerId) {
      const over = isOnFocus(x, y, state, m);
      if (over !== hoverFocus) {
        hoverFocus = over;
        canvas.style.cursor = over ? "grab" : "ew-resize";
        dirty = true;
        ctl.draw();
      }
      return;
    }

    const dx = x - dragStartX;
    const dy = y - dragStartY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;

    if (dragKind === "focus") {
      let nu = clamp(x / Math.max(1, m.w), 0.06, 0.94);
      let nv = clamp(y / Math.max(1, m.fieldH), 0.10, 0.90);
      // 柔和吸附到最佳疏朗气位（但不锁死，仍可继续拖出试错）
      const snapTarget =
        state.mode === "double"
          ? { u: 0.58, v: 0.37 }
          : state.mode === "corner"
            ? { u: 0.78, v: 0.32 }
            : { u: 0.84, v: 0.36 };
      if (Math.hypot(nu - snapTarget.u, nv - snapTarget.v) < 0.032) {
        nu = nu * 0.45 + snapTarget.u * 0.55;
        nv = nv * 0.45 + snapTarget.v * 0.55;
      }
      callbacks.onFocusMove(nu, nv);
    } else if (dragKind === "gather") {
      // 横拖平滑调整聚散势（整幅拖半屏即可走完 0 → 1，触屏与 perf.mjs 左右拖响应灵敏且有重画）
      const delta = dx / Math.max(180, m.w * 0.58);
      callbacks.onGatherChange(clamp(dragStartGather + delta, 0, 1));
    }
  }

  function onPointerUp(ev) {
    if (ev.pointerId !== activePointerId) return;
    const { x, y } = clientToLocal(ev);
    const m = metrics();
    // 轻点画布疏朗处：移动 "+" 呼吸气眼
    if (!dragMoved && dragKind === "gather" && y < m.fieldH) {
      callbacks.onEyePlace(clamp(x / m.w, 0.1, 0.94), clamp(y / m.fieldH, 0.12, 0.88));
    }
    dragKind = null;
    activePointerId = null;
    canvas.style.cursor = hoverFocus ? "grab" : "ew-resize";
    dirty = true;
    ctl.draw();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  // 键盘操作：左右调聚散势，Shift+方向键移蓝圆
  canvas.addEventListener("keydown", (ev) => {
    const m = metrics();
    const { state } = getData(m.aspect);
    const stepG = 0.06;
    const stepF = 0.04;
    if (ev.shiftKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(ev.key)) {
      ev.preventDefault();
      let { u, v } = state.focus;
      if (ev.key === "ArrowLeft") u = clamp(u - stepF, 0.06, 0.94);
      if (ev.key === "ArrowRight") u = clamp(u + stepF, 0.06, 0.94);
      if (ev.key === "ArrowUp") v = clamp(v - stepF, 0.1, 0.9);
      if (ev.key === "ArrowDown") v = clamp(v + stepF, 0.1, 0.9);
      callbacks.onFocusMove(u, v);
      return;
    }
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      callbacks.onGatherChange(clamp(state.gather + stepG, 0, 1));
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      callbacks.onGatherChange(clamp(state.gather - stepG, 0, 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      callbacks.onInkChange(clamp(state.ink + 0.05, 0.14, 1));
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      callbacks.onInkChange(clamp(state.ink - 0.05, 0.14, 1));
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctl = loop(canvas, render);

  return {
    invalidate() {
      dirty = true;
      ctl.draw();
    },
    getAspect() {
      return metrics().aspect;
    },
  };
}
