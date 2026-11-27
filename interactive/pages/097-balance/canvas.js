// 097 平衡 BALANCE · 视觉天平实验室 2D Canvas 物理绘制与直操交互
// 1:1 转译 097 原海报：暖宣纸底、贯顶中轴虚线、双层同心大虚线圆环、墨黑三角支点、黑色横梁与朱砂圆核。
// 支持拖拽任意配重块、拖拽支点、画布空白区横拖（兼顾触屏与 perf 中心横拖）、点击切材质、Space 阻尼微扰称重。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BEAM_LIMIT,
  FULCRUM_LIMIT,
  MAT_ORDER,
  clamp,
  evaluate,
} from "./model.js";

const COLORS = {
  paper: "#FAF0DE",
  paperSoft: "#F4E7CF",
  ink: "#1C1C1C",
  inkSoft: "#4D463E",
  vermilion: "#CE4A22",
  vermilionDeep: "#A33311",
  dash: "#C0B39E",
  dashStrong: "#9B8E7A",
  ok: "#1B5E42",
  err: "#B82E14",
};

export function createBalanceCanvas({ canvas, getState, getContextMode, onStateChange, onSelect }) {
  const ctx = canvas.getContext("2d");

  // 真实二阶阻尼摆动状态（角度与角速度）
  const phys = {
    angleDeg: 15.8,
    velDeg: 0,
    pulseT: -1, // Space 称重共振波时间戳
    pulseOk: false,
    introT: 0,
    dirty: true,
    w: 760,
    h: 520,
    geom: null,
  };

  let evalCache = evaluate(getState());

  // 计算画布内几何参数（保证所有圆严格正圆，绝不不等比变形！）
  function computeGeom(w, h, ev, angleDeg) {
    const cx = w * 0.5;
    const compact = w < 440;
    const beamLen = Math.min(w * (compact ? 0.84 : 0.78), h * 1.18);
    const halfBeam = beamLen * 0.5;
    const beamY = h * (compact ? 0.67 : 0.66);
    const beamThick = Math.max(9, Math.round(beamLen * 0.025));
    const triH = Math.max(30, Math.round(beamLen * 0.118));
    const triW = triH * 1.24;

    const fulcrumX = cx + ev.fulcrum * halfBeam;
    const pivotY = beamY + beamThick * 0.5;
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const beamToCanvas = (localX, localUp) => {
      const dx = (localX - ev.fulcrum) * halfBeam;
      const dy = -(beamThick * 0.5 + localUp);
      return {
        x: fulcrumX + dx * cos - dy * sin,
        y: pivotY + dx * sin + dy * cos,
      };
    };

    const hitItems = ev.items.map((it) => {
      const bw = it.halfW * 2 * halfBeam;
      const bh = it.height * halfBeam;
      const center = beamToCanvas(it.x, bh * 0.5);
      return {
        ...it,
        bw,
        bh,
        cx: center.x,
        cy: center.y,
        r: Math.max(bw, bh) * 0.5,
      };
    });

    const outerRingR = Math.min(w * 0.45, h * 0.43, halfBeam * 0.96);
    const innerRingR = outerRingR * 0.78;
    const ringCy = beamY - outerRingR * 0.42;

    return {
      w,
      h,
      cx,
      beamLen,
      halfBeam,
      beamY,
      beamThick,
      triH,
      triW,
      fulcrumX,
      pivotY,
      rad,
      cos,
      sin,
      beamToCanvas,
      hitItems,
      outerRingR,
      innerRingR,
      ringCy,
    };
  }

  function measureSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    // GUIDE.md 性能提示：窄屏手机限制 DPR <= 1.5，大幅减轻软件渲染填充压力且画质依然清晰
    const dpr = pixelRatio(w < 520 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      phys.w = w;
      phys.h = h;
      phys.dirty = true;
    }
  }

  const ro = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => {
        measureSize();
        phys.dirty = true;
        if (ctrl) ctrl.draw();
      })
    : null;

  // 绘制背景中轴虚线与双层同心大虚线圆环（1:1 源自 097 原海报！）
  function drawBackgroundGuides(g, ev, t, still) {
    // 融纸宣纸底色
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, g.w, g.h);

    // 极细腻的水平基准参考线（通过支点顶面，展示理想 0° 水平线）
    ctx.save();
    ctx.strokeStyle = ev.isBalanced ? "rgba(27, 94, 66, 0.30)" : "rgba(184, 171, 150, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(g.cx - g.halfBeam * 1.06, g.beamY);
    ctx.lineTo(g.cx + g.halfBeam * 1.06, g.beamY);
    ctx.stroke();

    // 原海报贯顶垂直中轴虚线（50% 几何中轴）
    ctx.strokeStyle = COLORS.dashStrong;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(g.cx, 4);
    ctx.lineTo(g.cx, g.h - 4);
    ctx.stroke();

    // 双层同心大虚线圆弧（原海报最具辨识度的引力场圆环）
    // 失衡时圆环随质心轻移并带暖褐，稳衡时严丝锁定正中并略提明晰度
    const ringShift = (ev.comX * 0.25) * g.halfBeam;
    const ringCx = g.cx + ringShift;
    const drawProg = still ? 1 : clamp(phys.introT / 0.85, 0.35, 1);

    ctx.strokeStyle = ev.isBalanced ? "rgba(206, 74, 34, 0.34)" : "rgba(184, 171, 150, 0.78)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 4]);

    // 外圈虚线环
    ctx.beginPath();
    ctx.arc(ringCx, g.ringCy, g.outerRingR, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * drawProg);
    ctx.stroke();

    // 内圈虚线环
    ctx.beginPath();
    ctx.arc(ringCx, g.ringCy, g.innerRingR, Math.PI * 0.5, Math.PI * 0.5 + Math.PI * 2 * drawProg);
    ctx.stroke();

    // Space 称重共振波（放手称重时扩散的一圈朱砂/翠绿共振环）
    if (phys.pulseT >= 0 && !still) {
      const p = clamp(phys.pulseT / 1.15, 0, 1);
      const r = g.innerRingR * (0.65 + p * 0.65);
      ctx.setLineDash([]);
      ctx.strokeStyle = phys.pulseOk
        ? `rgba(27, 94, 66, ${(1 - p) * 0.55})`
        : `rgba(206, 74, 34, ${(1 - p) * 0.55})`;
      ctx.lineWidth = 2.2 * (1 - p * 0.5);
      ctx.beginPath();
      ctx.arc(g.fulcrumX, g.ringCy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 在杂志跨页 / 展陈色重模式下，在配重块表面绘出极简抽象版面肌理（无五官剪影）
  function drawContextOverlay(it, bw, bh, mode) {
    if (mode === "poster") return;
    ctx.save();
    const isLightBg = it.mat === "hollow" || it.mat === "stone";
    const lineColor = isLightBg ? "rgba(28, 28, 28, 0.55)" : "rgba(250, 240, 222, 0.78)";
    const accentColor = it.mat === "vermilion" ? "rgba(250, 240, 222, 0.85)" : "rgba(206, 74, 34, 0.85)";
    ctx.fillStyle = lineColor;
    ctx.strokeStyle = lineColor;

    if (mode === "spread") {
      if (it.id === "leftSq") {
        // 左侧影人物剪影（严守规范：纯侧面剪影，绝不画任何五官！）
        ctx.beginPath();
        const rHead = bw * 0.17;
        ctx.arc(0, -bh * 0.64, rHead, 0, Math.PI * 2);
        ctx.moveTo(-bw * 0.28, -bh * 0.14);
        ctx.quadraticCurveTo(-bw * 0.26, -bh * 0.46, 0, -bh * 0.46);
        ctx.quadraticCurveTo(bw * 0.26, -bh * 0.46, bw * 0.28, -bh * 0.14);
        ctx.closePath();
        ctx.fill();
      } else if (it.id === "leftDot") {
        // 页眉朱砂印章横线
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-bw * 0.24, -bh * 0.5);
        ctx.lineTo(bw * 0.24, -bh * 0.5);
        ctx.stroke();
      } else if (it.id === "coreRed") {
        // 跨页大标三条节奏字行
        const w1 = bw * 0.54;
        const w2 = bw * 0.36;
        ctx.fillRect(-w1 * 0.5, -bh * 0.58, w1, Math.max(4, bh * 0.055));
        ctx.fillRect(-w2 * 0.5, -bh * 0.46, w2, Math.max(3, bh * 0.036));
      } else if (it.id === "rightSq") {
        // 右侧正文栏多行排印条
        const rows = 4;
        for (let i = 0; i < rows; i++) {
          const rw = i === rows - 1 ? bw * 0.44 : bw * 0.68;
          ctx.fillRect(-bw * 0.34, -bh * (0.76 - i * 0.16), rw, Math.max(2.5, bh * 0.05));
        }
      }
    } else if (mode === "exhibition") {
      if (it.id === "coreRed") {
        // 展陈主圆内细圆环
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -bh * 0.5, bw * 0.34, 0, Math.PI * 2);
        ctx.stroke();
      } else if (it.id === "rightSq") {
        // 浅灰说明墙细字纹
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(-bw * 0.36, -bh * (0.8 - i * 0.14), bw * (i === 4 ? 0.4 : 0.72), 2.5);
        }
      } else if (it.id === "leftSq") {
        // 导视标角
        ctx.fillStyle = accentColor;
        ctx.fillRect(-bw * 0.28, -bh * 0.72, bw * 0.56, Math.max(3, bh * 0.08));
      }
    }
    ctx.restore();
  }

  function drawScene(t, still) {
    const state = getState();
    const ev = evaluate(state);
    evalCache = ev;
    const mode = getContextMode();
    const angle = still ? ev.targetAngleDeg : phys.angleDeg;
    const g = computeGeom(phys.w, phys.h, ev, angle);
    phys.geom = g;

    const dpr = canvas.width / phys.w;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 背景中轴与同心虚线圆弧
    drawBackgroundGuides(g, ev, t, still);

    // 2. 顶部极简实时标尺带（倾角 + 左右力矩示意，窄屏缩短避免碰中轴虚线）
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textBaseline = "top";
    const cleanAngle = Math.abs(angle) < 0.05 ? 0 : angle;
    const degStr = `${cleanAngle > 0 ? "+" : ""}${cleanAngle.toFixed(1)}°`;
    const statusText =
      g.w < 430
        ? `TILT ${degStr} · L${ev.leftTorque.toFixed(1)}/R${ev.rightTorque.toFixed(1)}`
        : `TILT ${degStr} · L ${ev.leftTorque.toFixed(2)} / R ${ev.rightTorque.toFixed(2)}`;
    ctx.fillStyle = COLORS.inkSoft;
    ctx.textAlign = "left";
    ctx.fillText(statusText, 10, 10);

    // 右上角简洁达标徽
    const pillText = ev.badge;
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    const pw = ctx.measureText(pillText).width + 18;
    const px = g.w - pw - 10;
    const py = 8;
    ctx.fillStyle = ev.isBalanced ? COLORS.ok : COLORS.err;
    ctx.fillRect(px, py, pw, 22);
    ctx.fillStyle = "#FAF0DE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, px + pw * 0.5, py + 11.5);
    ctx.restore();

    // 3. 三角支点（1:1 承袭原海报墨黑等腰实心三角，支持拖拽）
    ctx.save();
    const triTopY = g.beamY + g.beamThick * 0.55;
    const triBaseY = triTopY + g.triH;
    // 支点移动滑槽标尺线
    ctx.strokeStyle = "rgba(155, 142, 122, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.cx - FULCRUM_LIMIT * g.halfBeam, triBaseY + 10);
    ctx.lineTo(g.cx + FULCRUM_LIMIT * g.halfBeam, triBaseY + 10);
    ctx.stroke();
    // 50% 中轴刻度齿
    ctx.strokeStyle = COLORS.vermilion;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(g.cx, triBaseY + 5);
    ctx.lineTo(g.cx, triBaseY + 15);
    ctx.stroke();

    // 支点偏塌警示虚线框
    if (Math.abs(ev.fulcrum) > 0.14) {
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(g.fulcrumX - g.triW * 0.62, triTopY - 3, g.triW * 1.24, g.triH + 8);
      ctx.setLineDash([]);
    }

    // 实心等腰三角
    ctx.fillStyle = Math.abs(ev.fulcrum) > 0.14 ? COLORS.err : COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(g.fulcrumX, triTopY);
    ctx.lineTo(g.fulcrumX - g.triW * 0.5, triBaseY);
    ctx.lineTo(g.fulcrumX + g.triW * 0.5, triBaseY);
    ctx.closePath();
    ctx.fill();

    // 支点小字标
    ctx.font = '500 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = Math.abs(ev.fulcrum) > 0.14 ? COLORS.err : COLORS.inkSoft;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`支点 ${ev.fulcrumPct}%（可左右拖）`, g.fulcrumX, triBaseY + 18);
    ctx.restore();

    // 4. 旋转横梁 + 其上四枚几何配重块
    ctx.save();
    ctx.translate(g.fulcrumX, g.pivotY);
    ctx.rotate(g.rad);

    const beamLeftX = (-1 - ev.fulcrum) * g.halfBeam;
    const beamRightX = (1 - ev.fulcrum) * g.halfBeam;
    const beamTopLocal = -g.beamThick * 0.5;

    // 墨黑实心横梁
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(beamLeftX, -g.beamThick * 0.5, beamRightX - beamLeftX, g.beamThick);

    // 横梁底缘质心 CoM 菱形指针（直观显示整幅视觉质心位置！）
    const comLocalX = (ev.comX - ev.fulcrum) * g.halfBeam;
    ctx.fillStyle = ev.isBalanced ? COLORS.ok : COLORS.vermilion;
    ctx.beginPath();
    ctx.moveTo(comLocalX, g.beamThick * 0.5 + 2);
    ctx.lineTo(comLocalX - 6, g.beamThick * 0.5 + 10);
    ctx.lineTo(comLocalX, g.beamThick * 0.5 + 16);
    ctx.lineTo(comLocalX + 6, g.beamThick * 0.5 + 10);
    ctx.closePath();
    ctx.fill();

    // 绘制 4 枚配重块（先画中央大圆再画前排块，或按 id 稳定层序）
    const drawOrder = ["coreRed", "leftSq", "leftDot", "rightSq"];
    for (const id of drawOrder) {
      const it = g.hitItems.find((x) => x.id === id);
      if (!it) continue;
      const lx = (it.x - ev.fulcrum) * g.halfBeam;
      const bw = it.bw;
      const bh = it.bh;
      const isSelected = state.selected === it.id;
      const isOverlap = ev.overlapIds.has(it.id);

      ctx.save();
      ctx.translate(lx, beamTopLocal - 1);

      // 实体填充或空心轮廓
      ctx.fillStyle = it.matInfo.fill;
      ctx.strokeStyle = it.matInfo.stroke;
      ctx.lineWidth = it.mat === "hollow" ? 2.4 : 1.5;

      if (it.shape === "circle" || it.shape === "core") {
        const r = bw * 0.5;
        ctx.beginPath();
        ctx.arc(0, -r, r, 0, Math.PI * 2);
        if (it.mat !== "hollow") ctx.fill();
        if (it.mat === "hollow" || it.mat === "stone") ctx.stroke();

        // 原海报细节：垂直中轴虚线隐约穿透中央朱砂大圆
        if (it.id === "coreRed" && Math.abs(it.x) < 0.05) {
          ctx.save();
          ctx.strokeStyle = it.mat === "hollow" ? COLORS.dashStrong : "rgba(28, 28, 28, 0.34)";
          ctx.lineWidth = 1.1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, -r * 2);
          ctx.lineTo(0, 0);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        ctx.beginPath();
        ctx.rect(-bw * 0.5, -bh, bw, bh);
        if (it.mat !== "hollow") ctx.fill();
        if (it.mat === "hollow" || it.mat === "stone") ctx.stroke();
      }

      // 语境版面肌理
      drawContextOverlay(it, bw, bh, mode);

      // 选中态极简角标（0px 锐利建筑框，不破坏海报几何感）
      if (isSelected) {
        const pad = 5;
        const cLen = 8;
        ctx.strokeStyle = it.mat === "vermilion" ? COLORS.ink : COLORS.vermilion;
        ctx.lineWidth = 2;
        const x0 = -bw * 0.5 - pad;
        const x1 = bw * 0.5 + pad;
        const y0 = -bh - pad;
        const y1 = pad * 0.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + cLen); ctx.lineTo(x0, y0); ctx.lineTo(x0 + cLen, y0);
        ctx.moveTo(x1 - cLen, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + cLen);
        ctx.moveTo(x0, y1 - cLen); ctx.lineTo(x0, y1); ctx.lineTo(x0 + cLen, y1);
        ctx.moveTo(x1 - cLen, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - cLen);
        ctx.stroke();
      }

      // 叠压错态红虚线警示框
      if (isOverlap) {
        ctx.strokeStyle = COLORS.err;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(-bw * 0.5 - 4, -bh - 4, bw + 8, bh + 8);
        ctx.setLineDash([]);
      }

      // 若是开场或核心出错，给关键块挂简洁白话提示签
      let tagLabel = "";
      if (isOverlap) tagLabel = "× 叠压";
      else if (it.id === "coreRed" && (Math.abs(it.x - ev.fulcrum) > 0.11 || it.mat === "hollow")) {
        tagLabel = it.mat === "hollow" ? "× 核失重" : "← 拖回中轴";
      } else if (it.id === "leftSq" && it.mat === "hollow" && ev.targetAngleDeg > 2.2) {
        tagLabel = "点换实心";
      }
      if (tagLabel) {
        ctx.font = '600 11px "Noto Sans SC", sans-serif';
        const tw = ctx.measureText(tagLabel).width + 12;
        ctx.fillStyle = COLORS.err;
        ctx.fillRect(-tw * 0.5, -bh - 28, tw, 20);
        ctx.fillStyle = "#FAF0DE";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagLabel, 0, -bh - 18);
      }

      ctx.restore();
    }

    ctx.restore(); // 结束横梁旋转坐标系

    // 5. 画布底部简洁上手提示（非侵入式）
    ctx.save();
    ctx.font = '400 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = COLORS.inkSoft;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const hint =
      g.w < 540
        ? "拖配重块或支点 · 点块换材质 · Space 称重"
        : "左右拖拽任意配重块改力臂 · 拖黑三角移支点 · 单击块面切换材质重量 · Space 放手称重";
    ctx.fillText(hint, g.cx, g.h - 6);
    ctx.restore();

    ctx.restore();
  }

  // ---------- 指针与触摸直操交互 ----------
  let drag = null;

  function clientToLocal(clientX, clientY, rect) {
    const r = rect || canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTest(px, py) {
    const g = phys.geom;
    if (!g) return null;
    // 1. 优先命中三角支点
    const triTopY = g.beamY + g.beamThick * 0.4;
    if (
      py >= triTopY - 8 &&
      py <= triTopY + g.triH + 28 &&
      Math.abs(px - g.fulcrumX) <= Math.max(36, g.triW * 0.72)
    ) {
      return { kind: "fulcrum" };
    }
    // 2. 命中配重块（从上层小块优先判定，避免被大圆吞掉）
    const hitOrder = ["leftDot", "leftSq", "rightSq", "coreRed"];
    for (const id of hitOrder) {
      const it = g.hitItems.find((x) => x.id === id);
      if (!it) continue;
      const pad = 12;
      if (it.shape === "circle" || it.shape === "core") {
        if (Math.hypot(px - it.cx, py - it.cy) <= it.bw * 0.5 + pad) {
          return { kind: "block", id: it.id };
        }
      } else {
        if (
          Math.abs(px - it.cx) <= it.bw * 0.5 + pad &&
          Math.abs(py - it.cy) <= it.bh * 0.5 + pad
        ) {
          return { kind: "block", id: it.id };
        }
      }
    }
    // 3. 命中画布其余区域：拖拽当前选中配重块（让手机单指横滑和 perf 中心横拖都丝滑生效！）
    return { kind: "ambient", id: getState().selected || "rightSq" };
  }

  function startDrag(clientX, clientY, pointerId, isTouch) {
    const rect = canvas.getBoundingClientRect();
    const pt = clientToLocal(clientX, clientY, rect);
    const hit = hitTest(pt.x, pt.y);
    if (!hit) return false;
    const state = getState();
    drag = {
      pointerId,
      isTouch,
      rect,
      kind: hit.kind,
      id: hit.id,
      startX: pt.x,
      startY: pt.y,
      lastX: pt.x,
      moved: false,
      lockedHoriz: !isTouch, // 触屏时先判横纵方向，保留页面竖向滚动！
      origVal: hit.kind === "fulcrum" ? state.fulcrum : state.blocks[hit.id].x,
    };
    if (hit.kind === "block") {
      onSelect(hit.id);
    }
    return true;
  }

  function moveDrag(clientX, clientY, evt) {
    if (!drag || !phys.geom) return;
    const pt = clientToLocal(clientX, clientY, drag.rect);
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;

    if (!drag.lockedHoriz) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15 && drag.kind === "ambient") {
        // 明显是竖向滚屏手势，释放给页面滚动
        drag = null;
        return;
      }
      drag.lockedHoriz = true;
    }

    if (evt && evt.cancelable) evt.preventDefault();
    if (Math.hypot(dx, dy) > 5) drag.moved = true;

    const deltaBeam = dx / phys.geom.halfBeam;
    if (drag.kind === "fulcrum") {
      const next = clamp(drag.origVal + deltaBeam, -FULCRUM_LIMIT, FULCRUM_LIMIT);
      const snapped = Math.abs(next) < 0.025 ? 0 : next;
      onStateChange((s) => ({ ...s, fulcrum: +snapped.toFixed(3) }), { fromDrag: true });
    } else {
      const id = drag.id;
      const state = getState();
      const it = evalCache.byId[id];
      const maxX = BEAM_LIMIT - (it ? it.halfW * 0.5 : 0.08);
      let next = clamp(drag.origVal + deltaBeam, -maxX, maxX);
      // 靠近中轴/支点轻微磁吸（特别是朱砂圆核）
      if (id === "coreRed" && Math.abs(next - state.fulcrum) < 0.03) {
        next = state.fulcrum;
      }
      onStateChange(
        (s) => ({
          ...s,
          selected: id,
          blocks: {
            ...s.blocks,
            [id]: { ...s.blocks[id], x: +next.toFixed(3) },
          },
        }),
        { fromDrag: true }
      );
    }
    // 仅置脏标，交由 rAF 统一一帧重绘一次，避免同帧双绘和强制同步回流！
    phys.dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function endDrag() {
    if (!drag) return;
    const wasClickBlock = drag.kind === "block" && !drag.moved;
    const id = drag.id;
    drag = null;
    if (wasClickBlock) {
      // 单击某个配重块（未拖动）：循环切换材质重量，直观感受同面积不同重！
      onStateChange((s) => {
        const cur = s.blocks[id].mat;
        const nextMat = MAT_ORDER[(MAT_ORDER.indexOf(cur) + 1) % MAT_ORDER.length];
        return {
          ...s,
          selected: id,
          blocks: {
            ...s.blocks,
            [id]: { ...s.blocks[id], mat: nextMat },
          },
        };
      }, { fromDrag: false });
      phys.velDeg += 14;
      phys.dirty = true;
      ctrl.draw();
    } else {
      // 拖动结束立即补同步终态 DOM
      onStateChange((s) => s, { fromDrag: false });
      phys.dirty = true;
    }
  }

  // 同时支持 Mouse 与 Touch（确保 perf.mjs 的 CDP Input.dispatchTouchEvent 100% 流畅触发！）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由 touch 事件精细判向
    if (e.button !== 0) return;
    if (startDrag(e.clientX, e.clientY, e.pointerId, false)) {
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (drag && drag.pointerId === e.pointerId) moveDrag(e.clientX, e.clientY, e);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (drag && drag.pointerId === e.pointerId) endDrag();
  });
  canvas.addEventListener("pointercancel", () => { drag = null; });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY, t.identifier, true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!drag || !e.touches.length) return;
      const t = [...e.touches].find((x) => x.identifier === drag.pointerId) || e.touches[0];
      moveDrag(t.clientX, t.clientY, e);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => endDrag(), { passive: true });
  canvas.addEventListener("touchcancel", () => { drag = null; }, { passive: true });

  // 键盘支持（画布获得焦点时方向键微调）
  canvas.addEventListener("keydown", (e) => {
    const step = 0.04;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      if (e.shiftKey) {
        onStateChange((s) => ({
          ...s,
          fulcrum: +clamp(s.fulcrum + dir * 0.03, -FULCRUM_LIMIT, FULCRUM_LIMIT).toFixed(3),
        }));
      } else {
        onStateChange((s) => {
          const id = s.selected || "rightSq";
          const cur = s.blocks[id];
          return {
            ...s,
            blocks: {
              ...s.blocks,
              [id]: { ...cur, x: +clamp(cur.x + dir * step, -BEAM_LIMIT + 0.06, BEAM_LIMIT - 0.06).toFixed(3) },
            },
          };
        });
      }
      phys.dirty = true;
      ctrl.draw();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      triggerWeighTest();
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      const ids = ["leftSq", "leftDot", "coreRed", "rightSq"];
      onSelect(ids[Number(e.key) - 1]);
      phys.dirty = true;
      ctrl.draw();
    }
  });

  function triggerWeighTest() {
    const ev = evaluate(getState());
    // 施加一次物理微扰，让天平真实摇摆回落
    const kick = ev.isBalanced ? 7.5 : ev.targetAngleDeg >= 0 ? 11 : -11;
    phys.velDeg += kick;
    phys.pulseT = 0;
    phys.pulseOk = ev.isBalanced;
    phys.dirty = true;
    ctrl.draw();
  }

  function poke() {
    phys.dirty = true;
    ctrl.draw();
  }

  // 主动画循环（走 lib/stage.js，离开视口或减动效自动停帧省电；帧内绝不触发布局回流！）
  const ctrl = loop(canvas, (t, dt, { still }) => {
    const ev = evaluate(getState());

    if (still) {
      phys.angleDeg = ev.targetAngleDeg;
      phys.velDeg = 0;
      phys.introT = 1;
      phys.pulseT = -1;
      drawScene(t, true);
      phys.dirty = false;
      return;
    }

    const introDone = phys.introT >= 0.9;
    if (!introDone) phys.introT += dt || 0.016;

    // 弹簧阻尼物理更新：F = -k*(theta - target) - c*vel
    const stepDt = Math.min(dt || 0.016, 0.04);
    const diff = ev.targetAngleDeg - phys.angleDeg;
    const accel = diff * 54 - phys.velDeg * 7.8;
    phys.velDeg += accel * stepDt;
    phys.angleDeg += phys.velDeg * stepDt;

    const settling = Math.abs(diff) > 0.04 || Math.abs(phys.velDeg) > 0.06;
    if (!settling) {
      phys.angleDeg = ev.targetAngleDeg;
      phys.velDeg = 0;
    }

    let pulsing = false;
    if (phys.pulseT >= 0) {
      phys.pulseT += stepDt;
      if (phys.pulseT >= 1.15) phys.pulseT = -1;
      else pulsing = true;
    }

    if (phys.dirty || !introDone || settling || pulsing || drag) {
      drawScene(t, false);
      phys.dirty = false;
    }
  });

  // 窗口变化时重算尺寸并重画
  window.addEventListener("resize", () => {
    measureSize();
    phys.dirty = true;
    ctrl.draw();
  });

  // 立即初始化一次画布，保证开场首帧立刻有画面
  measureSize();
  ro?.observe(canvas);
  if (reducedMotion.matches) {
    phys.angleDeg = evaluate(getState()).targetAngleDeg;
  }
  ctrl.draw();

  return {
    poke,
    triggerWeighTest,
    getCurrentAngle: () => phys.angleDeg,
  };
}
