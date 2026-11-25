// 328 虚实 相生构图 · 开场「虚实透屏推拉台」2D 光学画布引擎
// 零高开销滤镜模糊（全用径向渐变与层次合成），软件渲染下稳保 60fps；直接拖拽半透翠玉屏、朱橙焦点或点修红标。
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp, evaluate } from "./model.js";

const COLORS = {
  jadeBg: "#015656",
  jadeGlow: "#0A6A69",
  porcelain: "#F4F5F0",
  porcelainSoft: "rgba(244, 245, 240, 0.72)",
  porcelainWire: "rgba(232, 244, 241, 0.62)",
  porcelainDash: "rgba(220, 238, 234, 0.34)",
  vermilion: "#F56813",
  vermilionBright: "#FF8F47",
  mistLight: "rgba(130, 188, 180, 0.56)",
  mistMid: "rgba(98, 158, 152, 0.26)",
  mistZero: "rgba(98, 158, 152, 0)",
  faultBg: "#9F2316",
  faultStroke: "#FFB4AB",
  okStroke: "#6CE8C2",
};

export function createHeroStage(canvas, getState, onPatch) {
  const ctx = canvas.getContext("2d");
  let W = 720;
  let H = 540;
  let aspect = 4 / 3;
  let cachedBg = null;
  let cachedBgKey = "";
  let cachedEvalKey = "";
  let cachedEval = null;

  // 平滑插值态（用于点按钮切预设的丝滑过渡；直接手拖则即时跟手）
  const anim = {
    intro: 0,
    veilX: getState().veilX,
    veilY: getState().veilY,
    solidMass: getState().solidMass,
    aperture: getState().aperture,
    veilOpacity: getState().veilOpacity,
    focusX: getState().focusX,
    focusY: getState().focusY,
  };
  let dragging = null; // null | "veil" | "focus"
  let dragStart = null;
  let dragMoved = false;
  let hoverTarget = null; // null | "veil" | "focus" | "tag"
  let tagBoxes = []; // 可点红标命中区

  function resize() {
    const rect = canvas.getBoundingClientRect();
    // 遵循 GUIDE.md：窄屏手机像素比最多 1.5，兼顾清晰度与软件渲染 60fps
    const dpr = pixelRatio(window.innerWidth <= 520 ? 1.5 : 2);
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cachedBgKey = "";
    }
    W = w;
    H = h;
    aspect = W / H;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function evalCached(st) {
    const key = `${aspect.toFixed(3)}|${st.scene}|${st.veilX}|${st.veilY}|${st.solidMass}|${st.aperture}|${st.veilOpacity}|${st.focusX}|${st.focusY}|${st.waveFlow}|${st.multiFocus}`;
    if (key !== cachedEvalKey) {
      cachedEvalKey = key;
      cachedEval = evaluate(st, aspect);
    }
    return cachedEval;
  }

  const px = (u) => u * W;
  const py = (v) => v * H;
  const pr = (r) => r * H; // 半径严格按高度换算，绝不压成椭圆

  function traceStair(poly) {
    ctx.beginPath();
    poly.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(px(pt.x), py(pt.y));
      else ctx.lineTo(px(pt.x), py(pt.y));
    });
    ctx.closePath();
  }

  function drawMistOrb(cx, cy, radius, alphaScale) {
    if (radius <= 2 || alphaScale <= 0.02) return;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius * 1.45);
    grad.addColorStop(0, `rgba(146, 200, 193, ${(0.58 * alphaScale).toFixed(3)})`);
    grad.addColorStop(0.48, `rgba(98, 158, 152, ${(0.34 * alphaScale).toFixed(3)})`);
    grad.addColorStop(0.82, `rgba(60, 128, 122, ${(0.10 * alphaScale).toFixed(3)})`);
    grad.addColorStop(1, "rgba(1, 86, 86, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWaves(t, enabled, soloAlpha, introP) {
    if (!enabled) return;
    ctx.save();
    ctx.globalAlpha = soloAlpha * introP;
    const baseY = H * 0.805;
    const startX = W * 0.05;
    const spanW = W * 0.34;
    const phase = t * 0.65;
    for (let i = 0; i < 3; i++) {
      const y0 = baseY + i * (H * 0.032);
      const grad = ctx.createLinearGradient(startX, y0, startX + spanW, y0);
      grad.addColorStop(0, "rgba(128, 186, 180, 0)");
      grad.addColorStop(0.28, `rgba(136, 194, 187, ${(0.42 - i * 0.08).toFixed(2)})`);
      grad.addColorStop(0.75, `rgba(120, 180, 173, ${(0.36 - i * 0.07).toFixed(2)})`);
      grad.addColorStop(1, "rgba(128, 186, 180, 0)");

      // 外层柔雾光带（零 blur 滤镜，纯宽线半透模拟水雾）
      ctx.strokeStyle = grad;
      ctx.lineWidth = 7.5 - i * 1.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let s = 0; s <= 24; s++) {
        const u = s / 24;
        const x = startX + u * spanW;
        const amp = H * (0.017 - i * 0.002);
        const y = y0 + Math.sin(u * Math.PI * 2.4 - phase + i * 0.55) * amp;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 内层清细波脊
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = `rgba(218, 240, 235, ${(0.28 - i * 0.05).toFixed(2)})`;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSolidForms(state, g, insideVeil, alphaScale, introP) {
    ctx.save();
    ctx.globalAlpha = alphaScale;
    const solidFill = insideVeil ? "rgba(238, 244, 241, 0.84)" : COLORS.porcelain;
    const ringFill = insideVeil ? "rgba(62, 138, 131, 0.55)" : COLORS.porcelain;
    const orangeFill = insideVeil ? "#F56813" : COLORS.vermilion;

    // 1) 场景定制：山水（雾锁孤峰）
    if (state.scene === "landscape") {
      // 远山与孤峰实体（右上山峰带圆月虚腔，左下坡阶与孤舟）
      const cx = px(g.ring.cx);
      const cy = py(g.ring.cy);
      const rOut = pr(g.ring.outerR) * introP;
      const rIn = pr(g.ring.innerR) * introP;

      // 峰峦实影（外轮廓如屏风峰峦 + 中空月洞 = 实中含虚）
      ctx.fillStyle = ringFill;
      ctx.beginPath();
      ctx.moveTo(cx - rOut * 1.15, cy + rOut * 0.92);
      ctx.lineTo(cx - rOut * 0.58, cy - rOut * 0.62);
      ctx.lineTo(cx - rOut * 0.14, cy - rOut * 0.24);
      ctx.lineTo(cx + rOut * 0.22, cy - rOut * 1.05);
      ctx.lineTo(cx + rOut * 0.72, cy - rOut * 0.35);
      ctx.lineTo(cx + rOut * 1.12, cy + rOut * 0.92);
      ctx.closePath();
      if (rIn > 2) {
        ctx.moveTo(cx + rIn, cy);
        ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
      }
      ctx.fill("evenodd");

      // 前景石阶岸坡
      ctx.fillStyle = solidFill;
      traceStair(g.stair.poly);
      ctx.fill();

      // 朱砂水岸基石/印章底
      ctx.fillStyle = orangeFill;
      ctx.fillRect(px(g.baseRect.x), py(g.baseRect.y), px(g.baseRect.w), py(g.baseRect.h));

      // 左下江面孤舟剪影（极简几何船身与篷影，不画任何五官）
      if (!insideVeil) {
        const bx = W * 0.255;
        const by = H * 0.755;
        ctx.fillStyle = COLORS.porcelain;
        ctx.beginPath();
        ctx.moveTo(bx - 36, by);
        ctx.quadraticCurveTo(bx, by + 11, bx + 40, by - 3);
        ctx.lineTo(bx + 26, by + 7);
        ctx.lineTo(bx - 28, by + 7);
        ctx.closePath();
        ctx.fill();
        // 简笔竹篷与细钓竿
        ctx.beginPath();
        ctx.arc(bx - 4, by - 1, 10, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(244,245,240,0.72)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(bx + 12, by - 4);
        ctx.quadraticCurveTo(bx + 36, by - 22, bx + 54, by - 12);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 2) 场景定制：当代展演海报（版面实虚）
    if (state.scene === "editorial") {
      const cx = px(g.ring.cx);
      const cy = py(g.ring.cy);
      const rOut = pr(g.ring.outerR) * introP;
      const rIn = pr(g.ring.innerR) * introP;

      // 右上巨幅建筑字母 "O" 实环体
      ctx.fillStyle = ringFill;
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
      if (rIn > 2) ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
      ctx.fill("evenodd");

      // 左上克制小标块（刊号与日期线）
      if (!insideVeil) {
        ctx.fillStyle = COLORS.porcelain;
        ctx.fillRect(W * 0.14, H * 0.15, W * 0.17, 10);
        ctx.fillStyle = "rgba(244, 245, 240, 0.55)";
        ctx.fillRect(W * 0.14, H * 0.185, W * 0.11, 4);
        ctx.fillRect(W * 0.14, H * 0.205, W * 0.14, 4);
      }

      // 下方阶梯式展期主文栏
      ctx.fillStyle = solidFill;
      traceStair(g.stair.poly);
      ctx.fill();
      if (insideVeil) {
        // 透卡内显出柔和排印横线
        ctx.fillStyle = "rgba(1, 86, 86, 0.35)";
        for (let k = 0; k < 3; k++) {
          ctx.fillRect(px(g.stair.left) + 12, py(g.stair.bottom - 0.14) + k * 10, 48 - k * 10, 3);
        }
      }

      // 朱橙行动块
      ctx.fillStyle = orangeFill;
      ctx.fillRect(px(g.baseRect.x), py(g.baseRect.y), px(g.baseRect.w), py(g.baseRect.h));
      ctx.restore();
      return;
    }

    // 3) 默认：原海报 1:1 玉环阶屏
    const cx = px(g.ring.cx);
    const cy = py(g.ring.cy);
    const rOut = pr(g.ring.outerR) * introP;
    const rIn = pr(g.ring.innerR) * introP;

    // 瓷白大圆环（实中有虚）— 在透屏内部按原海报化为半透翠玉弧！
    ctx.fillStyle = ringFill;
    ctx.beginPath();
    ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
    if (rIn > 2) ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    // 阶梯白块（与原海报一致：在透屏内外均清晰显现，与半透圆环形成穿插阶层）
    ctx.fillStyle = solidFill;
    traceStair(g.stair.poly);
    ctx.fill();

    // 左下朱橙方基
    ctx.fillStyle = orangeFill;
    ctx.fillRect(px(g.baseRect.x), py(g.baseRect.y), px(g.baseRect.w), py(g.baseRect.h));

    ctx.restore();
  }

  function drawConstructionGuides(g, waveFlow, introP, soloLayer) {
    const a = soloLayer === "solid" ? 0.18 : 1;
    ctx.save();
    ctx.globalAlpha = a * introP;

    // 1) 原海报外围虚线方形构图框
    const boxX = W * 0.44;
    const boxY = H * 0.18;
    const boxW = W * 0.50;
    const boxH = H * 0.54;
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = COLORS.porcelainDash;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // 对角虚线（左上雾圆穿过圆环斜切）
    ctx.beginPath();
    ctx.moveTo(boxX, boxY);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.moveTo(boxX + boxW, boxY);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.stroke();

    // 2) 原海报大细白圆弧（上方贯穿留白标注，下方环抱透屏右下）
    ctx.setLineDash([]);
    ctx.strokeStyle = COLORS.porcelainWire;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(px(g.guideCircle.cx), py(g.guideCircle.cy), pr(g.guideCircle.r) * introP, -Math.PI * 0.85, Math.PI * 0.38);
    ctx.stroke();

    // 右下次环细圆弧（原海报「穿插与重叠」所指外弧）
    ctx.beginPath();
    ctx.arc(px(g.ring.cx - 0.04), py(g.ring.cy + 0.17), pr(0.175) * introP, -Math.PI * 0.18, Math.PI * 0.52);
    ctx.stroke();

    // 下方虚线小半圆弧（透屏底沿探出，忠实原海报）
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(220, 238, 234, 0.42)";
    ctx.beginPath();
    ctx.arc(px(g.veil.cx + 0.02), py(g.veil.y + g.veil.h), pr(0.082), 0, Math.PI);
    ctx.stroke();

    // 3) 对角视觉导流实细线（从左下雾波指向圆环心）
    if (waveFlow) {
      ctx.setLineDash([]);
      const grad = ctx.createLinearGradient(px(g.diag.x1), py(g.diag.y1), px(g.diag.x2), py(g.diag.y2));
      grad.addColorStop(0, "rgba(244,245,240,0.05)");
      grad.addColorStop(0.22, "rgba(244,245,240,0.68)");
      grad.addColorStop(0.85, "rgba(244,245,240,0.34)");
      grad.addColorStop(1, "rgba(244,245,240,0.08)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(px(g.diag.x1), py(g.diag.y1));
      ctx.lineTo(px(g.diag.x2), py(g.diag.y2));
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawAnnotations(state, res, introP) {
    if (W < 340 || state.soloLayer !== "all") return;
    const g = res.geom;
    ctx.save();
    ctx.globalAlpha = introP;

    const fontZh = `600 ${W < 460 ? 11 : 12}px "Noto Sans SC", sans-serif`;
    const fontSub = `400 ${W < 460 ? 10 : 10.5}px "Noto Sans SC", sans-serif`;

    // ① 「留白（虚）」原海报引注：置于左上开阔深青区，绝不压在白环或右上焦点红标上
    if (res.faults.length <= 2 || W >= 480) {
      const voidDotX = px(g.guideCircle.cx) + Math.cos(-Math.PI * 0.72) * pr(g.guideCircle.r);
      const voidDotY = py(g.guideCircle.cy) + Math.sin(-Math.PI * 0.72) * pr(g.guideCircle.r);
      const voidLblX = Math.max(16, Math.min(voidDotX - 108, W * 0.14));
      const voidLblY = Math.max(54, voidDotY - 18);
      ctx.setLineDash([2.5, 3]);
      ctx.strokeStyle = "rgba(232, 244, 241, 0.52)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(voidDotX, voidDotY);
      ctx.lineTo(voidLblX + 76, voidLblY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.porcelain;
      ctx.beginPath();
      ctx.arc(voidDotX, voidDotY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = fontZh;
      ctx.textBaseline = "middle";
      ctx.fillText("留白（虚）", voidLblX, voidLblY);
      if (W >= 480) {
        ctx.font = fontSub;
        ctx.fillStyle = "#CBE0DC";
        ctx.fillText(`占幅 ${res.voidPct}% · 呼吸空间`, voidLblX, voidLblY + 15);
      }
    }

    // ② 「穿插与重叠」原海报引注：加半透深青垫底，且放在透屏下沿外侧，绝不撞橙色基座
    const interX = clamp(px(g.veil.x + g.veil.w) + 12, 16, W - 116);
    const interY = clamp(py(g.veil.y + g.veil.h) + 12, 60, H - 16);
    if (W >= 420 && res.overlapPct >= 14) {
      ctx.setLineDash([2.5, 3]);
      ctx.strokeStyle = "rgba(232, 244, 241, 0.56)";
      ctx.beginPath();
      ctx.moveTo(px(g.veil.x + g.veil.w), py(g.veil.y + g.veil.h * 0.88));
      ctx.lineTo(interX + 8, interY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.porcelain;
      ctx.beginPath();
      ctx.arc(interX + 10, interY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = fontZh;
      ctx.fillText(`穿插与重叠 · ${res.overlapPct}%`, interX + 18, interY);
    }

    // ③ 视觉焦点（实）原海报朱橙折线引注（落白环上用高反差深朱橙 #C84300，落深青底上用亮橙 #FFC196）
    if (res.focusZone === "hinge" && !state.multiFocus) {
      const fx = px(g.focus.x);
      const fy = py(g.focus.y);
      const lx = Math.min(W - 104, fx + 16);
      const ly = Math.min(H - 46, fy + 38);
      const onWhite = Math.hypot(lx + 24 - px(g.ring.cx), ly - py(g.ring.cy)) < pr(g.ring.outerR);
      ctx.setLineDash([2.5, 3]);
      ctx.strokeStyle = onWhite ? "#C84300" : COLORS.vermilionBright;
      ctx.beginPath();
      ctx.moveTo(fx + pr(g.focus.r) + 2, fy);
      ctx.lineTo(lx + 22, fy);
      ctx.lineTo(lx + 22, ly - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = fontZh;
      ctx.fillStyle = onWhite ? "#B83B00" : "#FFC196";
      ctx.fillText("视觉焦点（实）", Math.min(W - 96, lx - 8), ly);
    }

    ctx.restore();
  }

  function drawFaultTags(res, introP) {
    tagBoxes = [];
    if (introP < 0.45 || !res.faults.length) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (introP - 0.35) / 0.5);
    const font = `600 ${W < 440 ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.font = font;
    ctx.textBaseline = "middle";

    // 画布最多同屏展示 3 条最关键红标，避免重叠杂乱
    const shown = res.faults.filter((f) => f.canvasTag).slice(0, 3);
    const placed = [];
    for (const f of shown) {
      const text = f.canvasTag.text;
      const tw = ctx.measureText(text).width;
      const bw = tw + 18;
      const bh = 26;
      let bx = clamp(px(f.canvasTag.x) - bw * 0.5, 10, W - bw - 10);
      let by = clamp(py(f.canvasTag.y) - bh * 0.5, 36, H - bh - 12);

      // 简单垂直防重叠避让
      for (const p of placed) {
        if (Math.abs(bx - p.x) < (bw + p.w) * 0.48 && Math.abs(by - p.y) < bh + 6) {
          by = clamp(p.y + bh + 8, 36, H - bh - 12);
        }
      }
      placed.push({ x: bx, y: by, w: bw, h: bh });
      tagBoxes.push({ x: bx, y: by, w: bw, h: bh, fault: f });

      ctx.fillStyle = COLORS.faultBg;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = COLORS.faultStroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

      ctx.fillStyle = "#FFF5F4";
      ctx.fillText(text, bx + 9, by + bh * 0.5 + 0.5);
    }
    ctx.restore();
  }

  function render(t, dt, { still }) {
    const state = getState();

    if (still) {
      anim.intro = 1;
      anim.veilX = state.veilX;
      anim.veilY = state.veilY;
      anim.solidMass = state.solidMass;
      anim.aperture = state.aperture;
      anim.veilOpacity = state.veilOpacity;
      anim.focusX = state.focusX;
      anim.focusY = state.focusY;
    } else {
      anim.intro = Math.min(1, anim.intro + (dt > 0 ? dt * 1.65 : 0.04));
      const ease = dragging ? 1 : Math.min(1, (dt || 0.016) * 12);
      anim.veilX += (state.veilX - anim.veilX) * ease;
      anim.veilY += (state.veilY - anim.veilY) * ease;
      anim.solidMass += (state.solidMass - anim.solidMass) * ease;
      anim.aperture += (state.aperture - anim.aperture) * ease;
      anim.veilOpacity += (state.veilOpacity - anim.veilOpacity) * ease;
      anim.focusX += (state.focusX - anim.focusX) * ease;
      anim.focusY += (state.focusY - anim.focusY) * ease;
    }

    const liveRes = evalCached(state); // 读数 HUD 与 DOM 严格共享同一缓存真源
    const isSettled =
      Math.abs(anim.veilX - state.veilX) < 0.001 &&
      Math.abs(anim.veilY - state.veilY) < 0.001 &&
      Math.abs(anim.solidMass - state.solidMass) < 0.001 &&
      Math.abs(anim.aperture - state.aperture) < 0.001 &&
      Math.abs(anim.veilOpacity - state.veilOpacity) < 0.001 &&
      Math.abs(anim.focusX - state.focusX) < 0.001 &&
      Math.abs(anim.focusY - state.focusY) < 0.001;

    const viewState = isSettled ? state : {
      ...state,
      veilX: anim.veilX,
      veilY: anim.veilY,
      solidMass: anim.solidMass,
      aperture: anim.aperture,
      veilOpacity: anim.veilOpacity,
      focusX: anim.focusX,
      focusY: anim.focusY,
    };

    const res = isSettled ? liveRes : evaluate(viewState, aspect);
    const g = res.geom;
    const introEase = 1 - Math.pow(1 - anim.intro, 3);

    // 1) 深青碧光学底面 + 缓存径向渐层（零每帧重复创建）
    const bgKey = `${W}x${H}:${state.soloLayer}`;
    if (bgKey !== cachedBgKey) {
      cachedBgKey = bgKey;
      const bgGrad = ctx.createRadialGradient(W * 0.56, H * 0.47, H * 0.05, W * 0.56, H * 0.47, Math.max(W, H) * 0.72);
      bgGrad.addColorStop(0, state.soloLayer === "void" ? "#0B7674" : COLORS.jadeGlow);
      bgGrad.addColorStop(0.65, COLORS.jadeBg);
      bgGrad.addColorStop(1, "#00494A");
      cachedBg = bgGrad;
    }
    ctx.fillStyle = cachedBg;
    ctx.fillRect(0, 0, W, H);

    // 仅看空白层时，在空白区域叠一层微妙细点格以凸显留白呼吸面积
    if (state.soloLayer === "void") {
      ctx.fillStyle = "rgba(218, 242, 237, 0.12)";
      for (let gx = 16; gx < W; gx += 22) {
        for (let gy = 16; gy < H; gy += 22) {
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
      }
    }

    const solidAlpha = state.soloLayer === "void" ? 0.14 : state.soloLayer === "transition" ? 0.22 : 1;
    const transAlpha = state.soloLayer === "solid" ? 0.14 : state.soloLayer === "void" ? 0.18 : 1;

    // 2) 左上淡青雾化虚圆（过渡 · 虚实）
    drawMistOrb(px(g.mist.cx), py(g.mist.cy), pr(g.mist.r) * introEase, transAlpha);

    // 3) 细白构造圆弧、虚线框与对角视线向量
    drawConstructionGuides(g, viewState.waveFlow, introEase, state.soloLayer);

    // 4) 左下三道半透水雾虚波
    drawWaves(still ? 0 : t, viewState.waveFlow, transAlpha, introEase);

    // 5) 主实体形体（透屏之外呈现纯粹瓷白实块）
    drawSolidForms(viewState, g, false, solidAlpha, introEase);

    // 6) 半透翠玉方屏（过渡 · 虚实）— 真正光学裁切重绘屏内世界！
    const vx = px(g.veil.x);
    const vy = py(g.veil.y);
    const vw = px(g.veil.w);
    const vh = py(g.veil.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(vx, vy, vw, vh);
    ctx.clip();

    // 透屏自身半透翠玉基底（浓度高时明显吞实发浊，浓度适中时通透显层）
    const veilAlpha = clamp(viewState.veilOpacity, 0.12, 0.94) * transAlpha;
    const veilGrad = ctx.createLinearGradient(vx, vy, vx + vw, vy + vh);
    veilGrad.addColorStop(0, `rgba(29, 118, 112, ${(veilAlpha * 1.05).toFixed(3)})`);
    veilGrad.addColorStop(1, `rgba(46, 134, 126, ${(veilAlpha * 0.92).toFixed(3)})`);
    ctx.fillStyle = veilGrad;
    ctx.fillRect(vx, vy, vw, vh);

    // 屏内重绘实形（白环化为柔翠半透弧，阶梯与朱橙方基清晰穿透——1:1 复刻原海报光学叠影）
    const innerSolidVisibility = clamp(1.15 - viewState.veilOpacity * 0.95, 0.12, 0.95) * solidAlpha;
    drawSolidForms(viewState, g, true, innerSolidVisibility, introEase);

    // 屏内细白虚线结构透视（呼应原海报透屏里的虚线直角阶）
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = `rgba(232, 245, 242, ${(0.38 * transAlpha).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(vx + vw * 0.16, vy + vh * 0.44, vw * 0.56, vh * 0.46);
    ctx.restore();

    // 透屏 0px 锐利细白外框 + 可拖拽微把手指示
    ctx.save();
    ctx.globalAlpha = transAlpha;
    ctx.strokeStyle = dragging === "veil" || hoverTarget === "veil"
      ? "#FFFFFF"
      : res.interplayOk
        ? "rgba(232, 245, 242, 0.88)"
        : "rgba(255, 180, 171, 0.88)";
    ctx.lineWidth = dragging === "veil" ? 2 : 1.25;
    ctx.strokeRect(vx + 0.5, vy + 0.5, vw - 1, vh - 1);

    // 透屏左上角极细微把手角标（指示可直接拖拉推入环域）
    const gripText = dragging === "veil" ? "⇄ 穿插 " + res.overlapPct + "%" : "⇄ 拖移透屏";
    ctx.font = `500 10px "Noto Sans SC", sans-serif`;
    const gw = ctx.measureText(gripText).width + 12;
    ctx.fillStyle = "rgba(1, 70, 70, 0.84)";
    ctx.fillRect(vx + 6, vy + 6, gw, 18);
    ctx.fillStyle = "#E6F4F1";
    ctx.textBaseline = "middle";
    ctx.fillText(gripText, vx + 12, vy + 15.5);
    ctx.restore();

    // 7) 朱橙视觉焦点（实）—— 当透屏太浓且盖住它时，焦点真实变暗被吞！
    const fx = px(g.focus.x);
    const fy = py(g.focus.y);
    const fr = pr(g.focus.r) * introEase;
    const focusCovered = vx <= fx && fx <= vx + vw && vy <= fy && fy <= vy + vh && viewState.veilOpacity > 0.72;

    // 若焦点偏离边界，画一道极淡虚环提示原海报理想内沿锚点方向（不强制，多个沿边位置均合法）
    if (!res.hierarchyOk && res.focusZone !== "hinge" && !viewState.multiFocus) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(255, 164, 99, 0.52)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px(g.idealFocus.x), py(g.idealFocus.y), fr * 1.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = (focusCovered ? 0.42 : 1) * solidAlpha;
    // 外层轻呼吸光晕（仅在达标时极克制脉动）
    if (res.focusZone === "hinge" && !still) {
      const pulse = 1 + Math.sin(t * 2.6) * 0.14;
      ctx.strokeStyle = "rgba(255, 164, 99, 0.42)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(fx, fy, fr * 1.55 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = focusCovered ? "#8E5E42" : COLORS.vermilion;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
    if (dragging === "focus" || hoverTarget === "focus") {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // 若开启双焦干扰试错，画出第二枚抢戏朱橙点
    if (viewState.multiFocus) {
      ctx.save();
      ctx.globalAlpha = solidAlpha;
      ctx.fillStyle = COLORS.vermilion;
      ctx.beginPath();
      ctx.arc(px(g.decoyFocus.x), py(g.decoyFocus.y), fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8) 原海报引注与画布顶角精简状态条
    drawAnnotations(viewState, res, introEase);

    // 顶左精简实测浮签（露实 + 纯虚 + 过渡 = 100%，与底部三色块图例严格一致）
    ctx.save();
    const hud = `露实 ${liveRes.solidPct}% · 纯虚 ${liveRes.voidPct}% · 过渡 ${liveRes.transPct}% · ${liveRes.passed}/4`;
    ctx.font = `500 ${W < 420 ? 10.5 : 11}px "DM Mono", "Noto Sans SC", monospace`;
    const hudW = ctx.measureText(hud).width + 18;
    ctx.fillStyle = "rgba(0, 58, 59, 0.86)";
    ctx.fillRect(10, 10, hudW, 24);
    ctx.strokeStyle = liveRes.passed === 4 ? COLORS.okStroke : "rgba(203, 224, 220, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10.5, 10.5, hudW - 1, 23);
    ctx.fillStyle = liveRes.passed === 4 ? "#B9FCE6" : "#F4F5F0";
    ctx.textBaseline = "middle";
    ctx.fillText(hud, 19, 22.5);
    ctx.restore();

    // 9) 可点纠偏红标
    drawFaultTags(liveRes, introEase);
  }

  // ---------- 指针与触屏交互（兼容竖向滚动 + 60Hz 横拖透屏） ----------
  function getCanvasPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: clientX - r.left,
      y: clientY - r.top,
      u: clamp((clientX - r.left) / r.width, 0, 1),
      v: clamp((clientY - r.top) / r.height, 0, 1),
    };
  }

  function hitTest(pos) {
    // 1) 优先命中可点红标
    for (const box of tagBoxes) {
      if (pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h) {
        return { kind: "tag", fault: box.fault };
      }
    }
    const state = getState();
    const res = evaluate(state, aspect);
    const g = res.geom;

    // 2) 朱橙焦点圆点
    const dFocus = Math.hypot(pos.x - px(g.focus.x), pos.y - py(g.focus.y));
    if (dFocus <= Math.max(22, pr(g.focus.r) * 1.9)) {
      return { kind: "focus" };
    }

    // 3) 其余画布区域均作横向/斜向推拉半透翠玉方屏（确保 perf.mjs 拖画布中心百分百命中！）
    return { kind: "veil" };
  }

  function applyDrag(pos, start) {
    const state = getState();
    const du = pos.u - start.u;
    const dv = pos.v - start.v;
    // 拖移透屏时传 isDrag=true，让主线程按帧合并 DOM 读数更新以稳保软件渲染 60fps
    if (dragging === "focus") {
      let nx = clamp(start.focusX + du, 0.06, 0.94);
      let ny = clamp(start.focusY + dv, 0.08, 0.92);
      const g = evalCached(state).geom;
      if (g.ring.innerR >= 0.04) {
        const dIdeal = Math.hypot((nx - g.idealFocus.x) * aspect, ny - g.idealFocus.y);
        if (dIdeal < 0.045) {
          nx = g.idealFocus.x;
          ny = g.idealFocus.y;
        }
      }
      onPatch({ focusX: +nx.toFixed(4), focusY: +ny.toFixed(4) }, true);
    } else if (dragging === "veil") {
      const nx = clamp(start.veilX + du, 0.16, 0.84);
      const ny = start.isTouch
        ? clamp(start.veilY - du * 0.14, 0.34, 0.72)
        : clamp(start.veilY + dv, 0.30, 0.74);
      onPatch({ veilX: +nx.toFixed(4), veilY: +ny.toFixed(4) }, true);
    }
  }

  // 鼠标事件
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏单独走 touch 事件以严格区分竖滚与横拖
    const pos = getCanvasPos(e.clientX, e.clientY);
    const hit = hitTest(pos);
    if (hit.kind === "tag") {
      if (hit.fault.fix) onPatch(hit.fault.fix);
      return;
    }
    const s = getState();
    dragging = hit.kind;
    dragMoved = false;
    dragStart = { u: pos.u, v: pos.v, veilX: s.veilX, veilY: s.veilY, focusX: s.focusX, focusY: s.focusY, isTouch: false };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (dragging && dragStart) {
      if (Math.hypot(pos.u - dragStart.u, pos.v - dragStart.v) > 0.004) dragMoved = true;
      applyDrag(pos, dragStart);
      return;
    }
    const hit = hitTest(pos);
    hoverTarget = hit.kind;
    canvas.style.cursor = hit.kind === "tag" ? "pointer" : "grab";
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (dragging) {
      dragging = null;
      dragStart = null;
      canvas.style.cursor = "grab";
      onPatch({}, false);
    }
  });

  canvas.addEventListener("pointercancel", () => {
    dragging = null;
    dragStart = null;
  });

  // 触屏事件：横向滑动锁定推拉透屏（供手机玩家与 perf.mjs 顺滑驱动），纯竖向滑动放行页面滚动
  let touchMode = null; // null | "pending" | "drag" | "scroll"
  let touchInit = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const pos = getCanvasPos(t0.clientX, t0.clientY);
    const hit = hitTest(pos);
    if (hit.kind === "tag") {
      e.preventDefault();
      if (hit.fault.fix) onPatch(hit.fault.fix);
      touchMode = null;
      return;
    }
    const s = getState();
    touchMode = "pending";
    touchInit = {
      clientX: t0.clientX,
      clientY: t0.clientY,
      hitKind: hit.kind,
      u: pos.u,
      v: pos.v,
      veilX: s.veilX,
      veilY: s.veilY,
      focusX: s.focusX,
      focusY: s.focusY,
      isTouch: true,
    };
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchInit || e.touches.length !== 1) return;
    const t1 = e.touches[0];
    const dx = t1.clientX - touchInit.clientX;
    const dy = t1.clientY - touchInit.clientY;
    if (touchMode === "pending") {
      if (Math.hypot(dx, dy) < 4) return;
      // 如果起手就抓住了焦点，或水平位移 >= 垂直位移，则接管为画布推拉；否则放行浏览器滚页
      if (touchInit.hitKind === "focus" || Math.abs(dx) >= Math.abs(dy) * 0.85) {
        touchMode = "drag";
        dragging = touchInit.hitKind;
        dragStart = touchInit;
      } else {
        touchMode = "scroll";
        return;
      }
    }
    if (touchMode === "drag") {
      e.preventDefault();
      const pos = getCanvasPos(t1.clientX, t1.clientY);
      applyDrag(pos, touchInit);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    const wasDragging = !!dragging;
    dragging = null;
    dragStart = null;
    touchMode = null;
    touchInit = null;
    if (wasDragging) onPatch({}, false);
  });

  // 键盘操作：方向键推拉翠玉透屏，Shift+方向键微调朱橙焦点
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    const step = 0.035;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
      const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
      if (e.shiftKey) {
        onPatch({ focusX: +(clamp(s.focusX + dx, 0.06, 0.94)).toFixed(4), focusY: +(clamp(s.focusY + dy, 0.08, 0.92)).toFixed(4) });
      } else {
        onPatch({ veilX: +(clamp(s.veilX + dx, 0.16, 0.84)).toFixed(4), veilY: +(clamp(s.veilY + dy, 0.30, 0.74)).toFixed(4) });
      }
    }
  });

  resize(); // 启动瞬间立即采集真实画布纵横比，确保首帧 DOM 读数与画布 HUD 完全一致
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => resize()).observe(canvas);
  }
  const controller = loop(canvas, render);
  return {
    draw: () => controller.draw(),
    resize,
    getAspect: () => aspect,
    evalState: (st) => evalCached(st),
  };
}
