// 067 重叠空间构图 · 开场活体包豪斯叠层雕刻台渲染器（artwork.js）
// 100% 从 model.js 的单真源实绘几何渲染，保证圆永不变椭圆、读数与画面像素级一致。
import { P } from "./palette.js";
import { orderedShapes, THEMES } from "./model.js";

// 映射逻辑方阵 [0..1]×[0..1] 到画布像素坐标（等比正方形，绝不拉伸变形）
export function getArena(w, h) {
  const padY = Math.max(18, Math.round(h * 0.055));
  const s = Math.min(w - 28, h - padY * 2);
  // 稍偏左给右侧「重叠创造空间」黑牌留呼吸（宽画布时），窄屏居中
  const rightAllowance = w / h > 1.22 ? Math.min(54, (w - s) * 0.36) : 0;
  const ox = (w - s) * 0.5 - rightAllowance * 0.5;
  const oy = (h - s) * 0.5;
  return { ox, oy, s };
}

export function clientToNorm(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const px = clientX - r.left;
  const py = clientY - r.top;
  const { ox, oy, s } = getArena(r.width, r.height);
  return {
    nx: (px - ox) / s,
    ny: (py - oy) / s,
    px,
    py,
    arena: { ox, oy, s },
  };
}

// 不同对比模式下的真实形体涂色（与 model.js 严格同步）
function shapeStyle(g, state) {
  const cm = state.contrastMode;
  const mm = state.midMode;

  if (cm === "flat") {
    // 错态：平权同调闷灰（三层明度极其接近，难以区分主次）
    if (g.id === "obsidian") return { fill: "#5D626E", stroke: "rgba(255,255,255,0.16)", alpha: 1, text: "#E4E6EB" };
    if (g.id === "arch") return { fill: "#848073", stroke: "rgba(255,255,255,0.14)", alpha: 1, text: "#F2EFE8" };
    if (g.id === "amber") return { fill: "#7C796E", stroke: "rgba(255,255,255,0.14)", alpha: 1, text: "#F2EFE8" };
    if (g.id === "glass") {
      if (mm === "ghost") return { fill: "rgba(130,136,150,0.08)", stroke: "rgba(120,126,140,0.22)", alpha: 1, dashed: true, text: "#6C7280" };
      if (mm === "muddy") return { fill: "rgba(116,114,108,0.88)", stroke: "rgba(95,93,88,0.65)", alpha: 1, muddy: true, text: "#D9D6CE" };
      if (mm === "translucent") return { fill: "rgba(136,144,162,0.52)", stroke: "rgba(243,238,231,0.5)", alpha: 1, text: "#F3EEE7" };
      return { fill: "#727886", stroke: "rgba(255,255,255,0.18)", alpha: 1, text: "#F3EEE7" };
    }
    // 焦圆在平权灰下也发闷
    return { fill: "#5B6A8B", stroke: "rgba(255,255,255,0.25)", alpha: 1, text: "#E6EBF5" };
  }

  if (cm === "reverse") {
    // 错态：后层刺眼反抢，前层暗淡退缩
    if (g.id === "obsidian") return { fill: "#F7C432", stroke: "#0B0D11", alpha: 1, text: "#0B0D11" };
    if (g.id === "arch") return { fill: "#0533B0", stroke: "rgba(255,255,255,0.3)", alpha: 1, text: "#F8F5EE" };
    if (g.id === "amber") return { fill: "#E12D39", stroke: "rgba(255,255,255,0.28)", alpha: 1, text: "#FFFFFF" };
    if (g.id === "glass") {
      if (mm === "ghost") return { fill: "rgba(146,165,214,0.08)", stroke: "rgba(243,238,231,0.28)", alpha: 1, dashed: true, text: "#C7D2E6" };
      if (mm === "muddy") return { fill: "rgba(128,118,98,0.86)", stroke: "rgba(90,82,68,0.7)", alpha: 1, muddy: true, text: "#F0ECE4" };
      return { fill: mm === "translucent" ? "rgba(160,174,205,0.56)" : "#8C98B8", stroke: "rgba(255,255,255,0.55)", alpha: 1, text: "#111827" };
    }
    return { fill: "#9AA2B0", stroke: "rgba(255,255,255,0.35)", alpha: 1, text: "#1F2937" };
  }

  // 正常高反差清晰阶梯（1:1 复刻 067 原海报色系）
  if (g.id === "obsidian") return { fill: P.ink, stroke: "rgba(243,238,231,0.16)", alpha: 1, text: "#F3EEE7" };
  if (g.id === "arch") return { fill: P.yellow, stroke: "rgba(11,13,17,0.12)", alpha: 1, text: "#0B0D11" };
  if (g.id === "amber") return { fill: "#F7BB19", stroke: "rgba(11,13,17,0.1)", alpha: 1, text: "#0B0D11" };
  if (g.id === "glass") {
    if (mm === "ghost") return { fill: "rgba(238,230,222,0.08)", stroke: "rgba(243,238,231,0.34)", alpha: 1, dashed: true, text: "#F3EEE7" };
    if (mm === "muddy") return { fill: "rgba(125,112,86,0.86)", stroke: "rgba(80,70,50,0.68)", alpha: 1, muddy: true, text: "#EDE6D8" };
    if (mm === "opaque") return { fill: P.creamDisk, stroke: "rgba(11,13,17,0.18)", alpha: 1, text: "#0B0D11" };
    // 原海报招牌磨砂雾蓝玻片（透叠 X 节点）
    return { fill: "rgba(155, 174, 218, 0.56)", stroke: "rgba(245, 240, 233, 0.85)", alpha: 1, frosted: true, text: "#0B0D11" };
  }
  // 前层焦点蓝圆（最高纯度与对比，领跑视线）
  return { fill: P.cobalt, stroke: "#FBF8F3", strokeW: 2.2, alpha: 1, text: "#FFFFFF" };
}

// 把逻辑点 (nx, ny) 按层号 L ∈ {1,2,3} 和轴测拆层进度 explodeT ∈ [0..1] 映射到屏幕像素
function projectPt(nx, ny, layer, arena, explodeT) {
  const { ox, oy, s } = arena;
  const cx = ox + nx * s;
  const cy = oy + ny * s;
  if (explodeT <= 0.001) return { x: cx, y: cy, sx: 1, sy: 1, skewX: 0 };
  const dx = cx - (ox + s * 0.5);
  const dy = cy - (oy + s * 0.5);
  const scaleY = 1 - 0.34 * explodeT;
  const skew = -0.34 * explodeT;
  const zOffset = (layer - 2) * s * 0.145 * explodeT;
  return {
    x: ox + s * 0.5 + dx * (1 - 0.1 * explodeT) + dy * skew,
    y: oy + s * 0.5 + dy * scaleY - zOffset,
    sx: 1 - 0.1 * explodeT,
    sy: scaleY,
    skewX: skew,
  };
}

function traceShapePath(ctx, g, arena) {
  const { ox, oy, s } = arena;
  const cx = ox + g.x * s;
  const cy = oy + g.y * s;
  ctx.beginPath();
  if (g.kind === "circle") {
    ctx.arc(cx, cy, g.sr * s, 0, Math.PI * 2);
  } else if (g.kind === "semi") {
    const r = g.sr * s;
    ctx.arc(cx, cy, r, 0, Math.PI, false);
    ctx.closePath();
  } else {
    const rw = g.sw * s, rh = g.sh * s;
    ctx.rect(cx - rw * 0.5, cy - rh * 0.5, rw, rh);
  }
}

// 为不同题材在形体上叠加克制、无杂讯的包豪斯平面细节
function drawThemeOverlay(ctx, g, arena, theme, style) {
  const { ox, oy, s } = arena;
  const cx = ox + g.x * s;
  const cy = oy + g.y * s;

  if (theme === "poster") {
    // 原海报右上明黄块上的 3×3 白点阵（随黄块移动，忠实致敬原海报）
    if (g.id === "amber") {
      const rw = g.sw * s, rh = g.sh * s;
      const dotR = Math.max(2.2, s * 0.011);
      const step = dotR * 3.1;
      const startX = cx + rw * 0.5 - step * 2.55;
      const startY = cy + rh * 0.5 - step * 2.55;
      ctx.save();
      ctx.fillStyle = "rgba(251, 248, 243, 0.92)";
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.beginPath();
          ctx.arc(startX + c * step, startY + r * step, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    // 透叠玻片边缘高光细纹（表现包豪斯亚克力质感）
    if (g.isMidPane && style.frosted) {
      const rw = g.sw * s, rh = g.sh * s;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - rw * 0.5 + 8, cy - rh * 0.5 + 8);
      ctx.lineTo(cx + rw * 0.5 - 8, cy - rh * 0.5 + 8);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  if (theme === "exhibition") {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (g.id === "obsidian") {
      ctx.fillStyle = "rgba(243,238,231,0.85)";
      ctx.font = `700 ${Math.max(12, Math.round(s * 0.055))}px "Syne", sans-serif`;
      ctx.fillText("1924", cx, cy - g.sr * s * 0.16);
      ctx.font = `500 ${Math.max(9, Math.round(s * 0.025))}px "IBM Plex Mono", monospace`;
      ctx.fillText("WEIMAR · ARCHIV", cx, cy + g.sr * s * 0.18);
    } else if (g.id === "amber") {
      ctx.fillStyle = style.text;
      ctx.font = `700 ${Math.max(11, Math.round(s * 0.036))}px "Archivo", sans-serif`;
      ctx.fillText("BAUHAUS", cx, cy - g.sh * s * 0.12);
      ctx.font = `500 ${Math.max(9, Math.round(s * 0.024))}px "IBM Plex Mono", monospace`;
      ctx.fillText("PLANAR SPACE", cx, cy + g.sh * s * 0.15);
    } else if (g.id === "glass" && !style.dashed) {
      ctx.fillStyle = style.frosted ? "#0B0D11" : style.text;
      ctx.font = `800 ${Math.max(12, Math.round(s * 0.044))}px "Syne", sans-serif`;
      ctx.fillText("OVERLAP", cx, cy);
    } else if (g.id === "focal") {
      ctx.fillStyle = style.text;
      ctx.font = `700 ${Math.max(11, Math.round(s * 0.036))}px "IBM Plex Mono", monospace`;
      ctx.fillText("NO.67", cx, cy);
    } else if (g.id === "arch") {
      ctx.fillStyle = style.text;
      ctx.font = `700 ${Math.max(10, Math.round(s * 0.028))}px "Archivo", sans-serif`;
      ctx.fillText("EXHIBITION", cx, cy + g.sr * s * 0.45);
    }
    ctx.restore();
    return;
  }

  if (theme === "cards") {
    ctx.save();
    if (g.id === "obsidian") {
      const r = g.sr * s;
      ctx.strokeStyle = "rgba(243,238,231,0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    } else if (g.id === "amber") {
      const rw = g.sw * s, rh = g.sh * s;
      ctx.fillStyle = "rgba(11,13,17,0.16)";
      ctx.fillRect(cx - rw * 0.36, cy - rh * 0.24, rw * 0.56, Math.max(4, rh * 0.09));
      ctx.fillRect(cx - rw * 0.36, cy - rh * 0.04, rw * 0.72, Math.max(3, rh * 0.06));
      ctx.fillRect(cx - rw * 0.36, cy + rh * 0.12, rw * 0.44, Math.max(3, rh * 0.06));
    } else if (g.id === "glass" && !style.dashed) {
      const rw = g.sw * s, rh = g.sh * s;
      ctx.fillStyle = "rgba(11,13,17,0.28)";
      ctx.fillRect(cx - rw * 0.38, cy - rh * 0.28, rw * 0.42, Math.max(5, rh * 0.09));
      ctx.fillStyle = "rgba(11,13,17,0.16)";
      ctx.fillRect(cx - rw * 0.38, cy - rh * 0.05, rw * 0.76, Math.max(3, rh * 0.06));
      ctx.fillRect(cx - rw * 0.38, cy + rh * 0.11, rw * 0.62, Math.max(3, rh * 0.06));
    } else if (g.id === "focal") {
      ctx.fillStyle = style.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(11, Math.round(s * 0.032))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("焦点", cx, cy);
    }
    ctx.restore();
  }
}

export function renderHeroStage(ctx, w, h, state, evalRes, anim = { intro: 1, explodeT: 0, pulse: 0 }) {
  const { list, activeState } = orderedShapes(state);
  const arena = getArena(w, h);
  const { ox, oy, s } = arena;
  const intro = anim.intro;
  const explodeT = anim.explodeT;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // 1) 原海报双壁背景：左暖米纸 × 右钴蓝建筑壁
  const splitX = Math.round(ox + s * 0.43);
  ctx.fillStyle = P.paper;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = P.cobalt;
  ctx.fillRect(splitX, 0, w - splitX, h);

  // 细微包豪斯构图分界刻度（保持干脆）
  ctx.strokeStyle = "rgba(11,13,17,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX + 0.5, 0);
  ctx.lineTo(splitX + 0.5, h);
  ctx.stroke();

  // 原海报右侧暗黑竖牌「重叠 创造 空间」+ 金色细竖线（在后景壁上）
  if (w > 280) {
    const plaqueW = Math.max(34, Math.min(58, w * 0.105));
    const plaqueH = Math.min(h * 0.40, 178);
    const px = w - plaqueW - Math.max(8, w * 0.02);
    const py = h * 0.44;
    ctx.fillStyle = P.inkSlab;
    ctx.fillRect(px, py, plaqueW, plaqueH);

    // 金色细竖杠与底短杠（1:1 呼应原海报右侧标牌）
    ctx.fillStyle = P.yellow;
    const gx = px + plaqueW - 10;
    ctx.fillRect(gx, py + 16, 2, plaqueH - 36);
    ctx.fillRect(px + 10, py + plaqueH - 18, plaqueW - 26, 2);

    ctx.fillStyle = P.yellowDark;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fs = Math.max(10, Math.min(13, Math.round(plaqueW * 0.25)));
    ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
    const words = ["重叠", "创造", "空间"];
    words.forEach((wd, i) => {
      ctx.fillText(wd, px + plaqueW * 0.42, py + 34 + i * (fs * 1.9));
    });
  }

  // 逻辑方阵的极细构图边界框（低干扰）
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  ctx.strokeRect(ox + 0.5, oy + 0.5, s - 1, s - 1);

  // 2) 若处于 28° 轴测拆层模式，绘制三片透明层平面框（Z1 后层 / Z2 中层 / Z3 前层）
  const drawLayerGroup = (layerNum) => {
    const items = list.filter((g) => g.layer === layerNum);
    ctx.save();
    if (explodeT > 0.001) {
      const cx = ox + s * 0.5;
      const cy = oy + s * 0.5;
      const scaleX = 1 - 0.1 * explodeT;
      const scaleY = 1 - 0.34 * explodeT;
      const skew = -0.34 * explodeT;
      const zLift = (layerNum - 2) * s * 0.145 * explodeT;
      ctx.translate(cx, cy - zLift);
      ctx.transform(scaleX, 0, skew, scaleY, 0, 0);
      ctx.translate(-cx, -cy);

      // 绘制透明层板边框
      ctx.fillStyle = layerNum === 3
        ? "rgba(5, 51, 176, 0.09)"
        : layerNum === 2
          ? "rgba(245, 185, 21, 0.08)"
          : "rgba(11, 13, 17, 0.09)";
      ctx.fillRect(ox, oy, s, s);
      ctx.strokeStyle = layerNum === 3
        ? "rgba(255,255,255,0.68)"
        : layerNum === 2
          ? "rgba(247, 196, 50, 0.72)"
          : "rgba(255,255,255,0.34)";
      ctx.lineWidth = 1.3;
      ctx.strokeRect(ox, oy, s, s);

      // 层标 Z1 / Z2 / Z3
      ctx.fillStyle = layerNum === 2 ? P.yellowDark : "#FBF8F3";
      ctx.font = `600 11px "IBM Plex Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const lbl = layerNum === 3 ? "Z3 · FRONT 前层" : layerNum === 2 ? "Z2 · MID 中层" : "Z1 · BACK 后层";
      ctx.fillText(lbl, ox + 8, oy + 7);
    }

    for (const g of items) {
      const st = shapeStyle(g, activeState);
      // 温和入场位移（0.45s 内自然落定，首帧即完整优雅）
      const settleShift = (1 - intro) * (layerNum === 3 ? -14 : layerNum === 2 ? 10 : -8);
      ctx.save();
      if (settleShift !== 0) ctx.translate(settleShift, settleShift * 0.35);

      traceShapePath(ctx, g, arena);
      ctx.fillStyle = st.fill;
      ctx.fill();

      // 假透明灰泥警示斜纹（合并单路径绘制，极大降低 2D 绘制开销）
      if (st.muddy) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "rgba(55, 48, 36, 0.24)";
        ctx.lineWidth = 2;
        const step = 14;
        ctx.beginPath();
        for (let k = -s; k < s * 2; k += step) {
          ctx.moveTo(ox + k, oy);
          ctx.lineTo(ox + k - s * 0.5, oy + s);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (st.stroke) {
        ctx.save();
        if (st.dashed) ctx.setLineDash([6, 5]);
        ctx.strokeStyle = st.stroke;
        ctx.lineWidth = st.strokeW || 1.4;
        ctx.stroke();
        ctx.restore();
      }

      drawThemeOverlay(ctx, g, arena, activeState.theme, st);

      // 选中形体的精致包豪斯虚线外环与拖拽提示
      if (g.id === state.selectedId && state.compareMode === "live") {
        const cx = ox + g.x * s;
        const cy = oy + g.y * s;
        const isCircle = g.kind === "circle";
        ctx.save();
        ctx.strokeStyle = g.id === "obsidian" && activeState.contrastMode === "ladder" ? P.yellowDark : "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        if (isCircle) {
          ctx.beginPath();
          ctx.arc(cx, cy, g.sr * s + 5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (g.kind === "semi") {
          ctx.beginPath();
          ctx.arc(cx, cy, g.sr * s + 5, 0, Math.PI, false);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(cx - g.sw * s * 0.5 - 4, cy - g.sh * s * 0.5 - 4, g.sw * s + 8, g.sh * s + 8);
        }
        ctx.restore();

        // 中心拖拽胶囊标签（窄画布简洁显示，避让右下角擦边红标）
        const names = THEMES[activeState.theme]?.names || THEMES.poster.names;
        const tag = w < 440 ? `↔ 拖移` : `↔ 拖移 ${names[g.id]}`;
        const ly = g.kind === "semi" ? cy + g.sr * s * 0.48 : cy - (w < 440 ? 4 : 0);
        ctx.save();
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tag).width + 14;
        const th = 22;
        const bx = Math.max(8, Math.min(w - tw - 8, cx - tw * 0.5));
        const by = Math.max(38, Math.min(h - th - 8, ly - th * 0.5));
        ctx.fillStyle = "rgba(11, 13, 17, 0.88)";
        ctx.fillRect(bx, by, tw, th);
        ctx.strokeStyle = P.yellowDark;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, th - 1);
        ctx.fillStyle = "#FBF8F3";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, bx + tw * 0.5, by + th * 0.5 + 0.5);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  };

  drawLayerGroup(1);
  drawLayerGroup(2);
  drawLayerGroup(3);

  // 3) 轴测模式下的 Z 轴垂线连接（把各形心映射到 Z1–Z3，直观看见纵深间距）
  if (explodeT > 0.08) {
    ctx.save();
    ctx.strokeStyle = `rgba(247, 196, 50, ${(0.58 * explodeT).toFixed(2)})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    for (const g of list) {
      if (g.layer === 1) continue;
      const pTop = projectPt(g.x, g.y, g.layer, arena, explodeT);
      const pBot = projectPt(g.x, g.y, 1, arena, explodeT);
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pBot.x, pBot.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4) 实时 T 形节点 / X 形节点 / 擦边切线陷阱精准标记（正视模式）
  if (activeState.showNodes && explodeT < 0.25) {
    const fade = 1 - explodeT * 4;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);

    // T 形节点（实色遮挡交点：白底深蓝框 T 标）
    for (const pt of evalRes.tJunctions.slice(0, 6)) {
      const px = ox + pt.x * s;
      const py = oy + pt.y * s;
      ctx.fillStyle = "#FBF8F3";
      ctx.fillRect(px - 8, py - 8, 16, 16);
      ctx.strokeStyle = P.cobalt;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(px - 8, py - 8, 16, 16);
      ctx.fillStyle = P.cobalt;
      ctx.font = `700 10px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("T", px, py + 0.5);
    }

    // X 形节点（透叠玻片交点：黑底明黄框 X 标）
    for (const pt of evalRes.xJunctions.slice(0, 6)) {
      const px = ox + pt.x * s;
      const py = oy + pt.y * s;
      ctx.fillStyle = P.ink;
      ctx.fillRect(px - 8, py - 8, 16, 16);
      ctx.strokeStyle = P.yellowDark;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(px - 8, py - 8, 16, 16);
      ctx.fillStyle = P.yellowDark;
      ctx.font = `700 10px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("X", px, py + 0.5);
    }

    // 擦边切线警示（高对比赤红双环）
    for (const tg of evalRes.tangents.slice(0, 4)) {
      const px = ox + tg.x * s;
      const py = oy + tg.y * s;
      const rPulse = 11 + Math.sin(anim.pulse * 4) * 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, rPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = P.bad;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(px, py, rPulse, 0, Math.PI * 2);
      ctx.stroke();

      const lbl = "擦边";
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      const lw = ctx.measureText(lbl).width + 10;
      const lx = Math.max(6, Math.min(w - lw - 6, px - lw * 0.5));
      const ly = Math.max(6, py - rPulse - 20);
      ctx.fillStyle = P.bad;
      ctx.fillRect(lx, ly, lw, 17);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, lx + lw * 0.5, ly + 8.5);
    }
    ctx.restore();
  }

  // 5) 顶部角标：模式提示 & 实时节点读数
  ctx.save();
  const modePill = state.compareMode === "flat_none"
    ? "对比预览 · 无重叠（平面单薄）"
    : state.compareMode === "ref_good"
      ? "对比预览 · 原海报参考解"
      : `${THEMES[activeState.theme]?.label || "原海报几何"} · ${explodeT > 0.5 ? "28° 轴测拆层" : "0° 正视叠层"}`;
  ctx.font = `600 11px "Noto Sans SC", sans-serif`;
  const mw = ctx.measureText(modePill).width + 16;
  ctx.fillStyle = "rgba(11, 13, 17, 0.88)";
  ctx.fillRect(10, 10, mw, 24);
  ctx.fillStyle = "#FBF8F3";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(modePill, 18, 22.5);

  const statPill = `T:${evalRes.tCount} · X:${evalRes.xCount} · 留白 ${evalRes.whitespacePct}%`;
  ctx.font = `600 11px "IBM Plex Mono", monospace`;
  const sw = ctx.measureText(statPill).width + 16;
  ctx.fillStyle = evalRes.isPass ? P.good : P.inkSlab;
  ctx.fillRect(w - sw - 10, 10, sw, 24);
  ctx.fillStyle = "#FBF8F3";
  ctx.textAlign = "right";
  ctx.fillText(statPill, w - 18, 22.5);
  ctx.restore();

  ctx.restore();
}
