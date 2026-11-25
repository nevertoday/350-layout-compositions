// 282 地图主导布局 · 开场活体滨海地图 2D Canvas 引擎
// 1:1 化用 282 原海报暖羊皮纸斜角半岛、海湾帆船、四区柔色地形、水滴锚点、虚线路径与悬浮卡片。
// 静态底图走离屏缓存（仅参数或尺寸变化时重绘），拖拽与动效帧 < 1.5ms，弱机稳跑 60 FPS。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  TERRAIN,
  SCENARIOS,
  CARD_BOX,
  HUB_CLEAN,
  evaluateMap,
} from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function tracePoly(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([u, v], i) => {
    if (i === 0) ctx.moveTo(u * W, v * H);
    else ctx.lineTo(u * W, v * H);
  });
  ctx.closePath();
}

// 绘制原海报风格的简洁地理图标（锚 / 山 / 楼 / 叶 / 厂）
function drawGlyph(ctx, icon, cx, cy, r, strokeColor) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = Math.max(1.3, r * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (icon === "anchor") {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.42, r * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.2);
    ctx.lineTo(cx, cy + r * 0.55);
    ctx.moveTo(cx - r * 0.35, cy - r * 0.02);
    ctx.lineTo(cx + r * 0.35, cy - r * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.14, r * 0.44, 0.22 * Math.PI, 0.78 * Math.PI);
    ctx.stroke();
  } else if (icon === "mountain") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy + r * 0.42);
    ctx.lineTo(cx - r * 0.12, cy - r * 0.42);
    ctx.lineTo(cx + r * 0.16, cy + r * 0.08);
    ctx.lineTo(cx + r * 0.34, cy - r * 0.18);
    ctx.lineTo(cx + r * 0.58, cy + r * 0.42);
    ctx.closePath();
    ctx.fill();
  } else if (icon === "city") {
    ctx.fillRect(cx - r * 0.46, cy - r * 0.08, r * 0.26, r * 0.52);
    ctx.fillRect(cx - r * 0.14, cy - r * 0.45, r * 0.30, r * 0.89);
    ctx.fillRect(cx + r * 0.22, cy - r * 0.20, r * 0.26, r * 0.64);
  } else if (icon === "leaf") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.44, cy + r * 0.42);
    ctx.quadraticCurveTo(cx - r * 0.40, cy - r * 0.45, cx + r * 0.46, cy - r * 0.44);
    ctx.quadraticCurveTo(cx + r * 0.42, cy + r * 0.42, cx - r * 0.44, cy + r * 0.42);
    ctx.fill();
  } else if (icon === "factory") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy + r * 0.44);
    ctx.lineTo(cx - r * 0.5, cy - r * 0.12);
    ctx.lineTo(cx - r * 0.14, cy + r * 0.12);
    ctx.lineTo(cx - r * 0.14, cy - r * 0.14);
    ctx.lineTo(cx + r * 0.22, cy + r * 0.12);
    ctx.lineTo(cx + r * 0.22, cy - r * 0.42);
    ctx.lineTo(cx + r * 0.48, cy - r * 0.42);
    ctx.lineTo(cx + r * 0.48, cy + r * 0.44);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 绘制水滴形地图锚点（忠实还原原海报造型）
function drawPin(ctx, x, y, radius, fill, selected, isHub, pulseT) {
  ctx.save();
  // 底部柔影
  ctx.fillStyle = "rgba(6, 51, 41, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, radius * 0.62, radius * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // 主锚点外圈青碧波纹（原海报标志母题）
  if (isHub) {
    const r1 = radius * (1.28 + 0.08 * Math.sin(pulseT * 2.4));
    const r2 = radius * (1.76 + 0.10 * Math.sin(pulseT * 2.4 - 0.8));
    ctx.fillStyle = "rgba(8, 117, 110, 0.20)";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r2, r2 * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(8, 117, 110, 0.36)";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r1, r1 * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (selected) {
    ctx.strokeStyle = PALETTE.teal;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(x, y + 1, radius * 1.45, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 水滴轮廓（针尖正好落于 (x, y)）
  const headY = y - radius * 1.55;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(
    x - radius * 0.95, y - radius * 0.82,
    x - radius * 1.05, headY - radius * 0.32,
    x, headY - radius
  );
  ctx.bezierCurveTo(
    x + radius * 1.05, headY - radius * 0.32,
    x + radius * 0.95, y - radius * 0.82,
    x, y
  );
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = isHub ? 2.4 : 1.8;
  ctx.strokeStyle = "#FEFDF9";
  ctx.stroke();

  // 内白圆孔
  ctx.beginPath();
  ctx.arc(x, headY - radius * 0.02, radius * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = "#FEFDF9";
  ctx.fill();
  ctx.restore();
}

export function mountHeroCanvas(canvas, getState, setState, onSyncUI) {
  const ctx = canvas.getContext("2d");
  const cache = document.createElement("canvas");
  const cctx = cache.getContext("2d");
  let cacheKey = "";
  let W = 800;
  let H = 560;
  let dpr = 1;

  // 拖拽状态
  let drag = null; // { kind: 'hub' | 'card' | 'ctrl', id, startX, startY, origU, origV, moved, pointerId }
  let animStart = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(260, Math.round(rect.width));
    H = Math.max(220, Math.round(rect.height));
    // 手机小屏上限 1.5（GUIDE.md 建议），软件渲染像素量直降 44%，画质依然锐利
    dpr = pixelRatio(W < 520 ? 1.5 : 2);
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      cache.width = pw;
      cache.height = ph;
      cacheKey = "";
    }
  }

  function renderTerrainCache(state) {
    const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
    const key = `${W}x${H}@${dpr}|${state.scenarioId}|${state.regionPalette}|${state.contextLevel}`;
    if (cacheKey === key) return;
    cacheKey = key;

    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 暖羊皮纸画布外框底
    cctx.fillStyle = PALETTE.paper;
    cctx.fillRect(0, 0, W, H);

    // 淡经纬坐标微格（仅在非 blank 时可见）
    if (state.contextLevel !== "blank") {
      cctx.strokeStyle = "rgba(8, 117, 110, 0.065)";
      cctx.lineWidth = 1;
      const step = Math.max(36, Math.round(W / 16));
      for (let x = step; x < W; x += step) {
        cctx.beginPath(); cctx.moveTo(x, 0); cctx.lineTo(x, H); cctx.stroke();
      }
      for (let y = step; y < H; y += step) {
        cctx.beginPath(); cctx.moveTo(0, y); cctx.lineTo(W, y); cctx.stroke();
      }
    }

    // 纯白失语境模式：不画海湾、不画地形、只留苍白虚框提示缺上下文
    if (state.contextLevel === "blank") {
      cctx.save();
      cctx.fillStyle = "#FFFFFF";
      roundRectPath(cctx, W * 0.08, H * 0.08, W * 0.84, H * 0.84, 16);
      cctx.fill();
      cctx.strokeStyle = "rgba(6, 51, 41, 0.16)";
      cctx.setLineDash([6, 5]);
      cctx.lineWidth = 1.5;
      cctx.stroke();
      cctx.setLineDash([]);
      cctx.fillStyle = "rgba(67, 94, 88, 0.65)";
      cctx.font = `500 ${Math.max(11, Math.round(W * 0.015))}px "Noto Sans SC", sans-serif`;
      cctx.textAlign = "center";
      cctx.fillText("地形底图已清空 · 失去海湾与山城空间语境", W * 0.5, H * 0.14);
      cctx.restore();
      return;
    }

    // 斜角海湾半岛底影
    cctx.save();
    cctx.shadowColor = "rgba(6, 51, 41, 0.11)";
    cctx.shadowBlur = 22;
    cctx.shadowOffsetY = 8;
    tracePoly(cctx, TERRAIN.clipPoly, W, H);
    cctx.fillStyle = "#EFE9DB";
    cctx.fill();
    cctx.restore();

    // 剪裁进有机岛岸地形范围
    cctx.save();
    tracePoly(cctx, TERRAIN.clipPoly, W, H);
    cctx.clip();

    // 1. 陆地总底 + 区域分组着色
    const pal = state.regionPalette;
    const isContour = state.contextLevel === "contour";
    cctx.fillStyle = isContour ? "#FBF6EA" : pal === "mono0" ? "#E0E0DC" : "#F3EBD8";
    cctx.fillRect(0, 0, W, H);

    // 绘制四个陆地区域
    for (const z of TERRAIN.zones) {
      tracePoly(cctx, z.poly, W, H);
      if (isContour) {
        cctx.fillStyle =
          pal === "rainbow7"
            ? z.rainbowFill
            : pal === "mono0"
              ? "#ECEAE4"
              : pal === "minimal3"
                ? z.minimalFill
                : z.posterFill;
        cctx.globalAlpha = pal === "rainbow7" ? 0.82 : 0.42;
        cctx.fill();
        cctx.globalAlpha = 1;
      } else {
        cctx.fillStyle =
          pal === "rainbow7"
            ? z.rainbowFill
            : pal === "mono0"
              ? z.monoFill
              : pal === "minimal3"
                ? z.minimalFill
                : z.posterFill;
        cctx.fill();
      }
      // 区域柔边
      cctx.strokeStyle = pal === "rainbow7" ? "rgba(255,255,255,0.55)" : "rgba(255,253,245,0.75)";
      cctx.lineWidth = pal === "mono0" ? 0.6 : 1.8;
      cctx.stroke();
    }

    // 7 色过载补丁
    if (pal === "rainbow7") {
      for (const patch of TERRAIN.rainbowPatches) {
        tracePoly(cctx, patch.poly, W, H);
        cctx.fillStyle = patch.fill;
        cctx.fill();
        cctx.strokeStyle = "rgba(255,255,255,0.6)";
        cctx.lineWidth = 1.5;
        cctx.stroke();
      }
    }

    // 2. 西北海湾水域
    tracePoly(cctx, TERRAIN.seaPoly, W, H);
    cctx.fillStyle =
      pal === "rainbow7"
        ? "#00C7BE"
        : pal === "mono0"
          ? "#D2D4D2"
          : isContour
            ? "#D7ECE8"
            : PALETTE.sea;
    cctx.fill();
    // 浅岸线光晕
    cctx.strokeStyle = pal === "mono0" ? "rgba(255,255,255,0.45)" : "rgba(252, 245, 232, 0.9)";
    cctx.lineWidth = 3.5;
    cctx.stroke();

    // 3. 南岸湿地蜿蜒河道
    cctx.save();
    cctx.beginPath();
    TERRAIN.river.forEach(([u, v], i) => {
      if (i === 0) cctx.moveTo(u * W, v * H);
      else cctx.lineTo(u * W, v * H);
    });
    cctx.strokeStyle = pal === "mono0" ? "#C5C8C6" : "#8CCEC5";
    cctx.lineWidth = Math.max(4, W * 0.011);
    cctx.lineCap = "round";
    cctx.lineJoin = "round";
    cctx.stroke();
    cctx.restore();

    // 4. 地形等高线（北山与南岸）
    cctx.save();
    cctx.strokeStyle = isContour ? "rgba(8, 117, 110, 0.34)" : "rgba(255, 253, 245, 0.62)";
    cctx.lineWidth = isContour ? 1.25 : 1.1;
    const rings = [
      { cx: 0.72, cy: 0.22, rx: 0.14, ry: 0.09 },
      { cx: 0.72, cy: 0.22, rx: 0.20, ry: 0.13 },
      { cx: 0.72, cy: 0.22, rx: 0.26, ry: 0.17 },
      { cx: 0.72, cy: 0.74, rx: 0.11, ry: 0.07 },
      { cx: 0.72, cy: 0.74, rx: 0.17, ry: 0.11 },
    ];
    for (const rg of rings) {
      cctx.beginPath();
      cctx.ellipse(rg.cx * W, rg.cy * H, rg.rx * W, rg.ry * H, -0.22, 0, Math.PI * 2);
      cctx.stroke();
    }
    cctx.restore();

    // 5. 城区微弱路网格（原海报柔和白灰街道感）
    cctx.save();
    cctx.strokeStyle = isContour ? "rgba(6, 51, 41, 0.12)" : "rgba(255, 253, 246, 0.72)";
    cctx.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) {
      const gx = (0.50 + i * 0.062) * W;
      cctx.beginPath();
      cctx.moveTo(gx, H * 0.39);
      cctx.lineTo(gx - W * 0.03, H * 0.57);
      cctx.stroke();
    }
    for (let j = 0; j < 4; j++) {
      const gy = (0.41 + j * 0.045) * H;
      cctx.beginPath();
      cctx.moveTo(W * 0.48, gy);
      cctx.lineTo(W * 0.87, gy - H * 0.02);
      cctx.stroke();
    }
    cctx.restore();

    // 6. 海浪波纹与原海报小帆船
    if (!isContour) {
      cctx.save();
      cctx.strokeStyle = "rgba(255, 255, 255, 0.68)";
      cctx.lineWidth = 1.5;
      cctx.lineCap = "round";
      for (const [wu, wv] of TERRAIN.waves) {
        const wx = wu * W, wy = wv * H;
        cctx.beginPath();
        cctx.moveTo(wx - 12, wy);
        cctx.quadraticCurveTo(wx - 6, wy - 4, wx, wy);
        cctx.quadraticCurveTo(wx + 6, wy - 4, wx + 12, wy);
        cctx.stroke();
      }
      // 白帆船
      const bx = TERRAIN.boat[0] * W, by = TERRAIN.boat[1] * H;
      cctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      cctx.beginPath();
      cctx.moveTo(bx, by - 14);
      cctx.lineTo(bx + 10, by);
      cctx.lineTo(bx, by);
      cctx.closePath();
      cctx.fill();
      cctx.beginPath();
      cctx.moveTo(bx - 2, by - 11);
      cctx.lineTo(bx - 8, by);
      cctx.lineTo(bx - 2, by);
      cctx.closePath();
      cctx.fill();
      cctx.beginPath();
      cctx.moveTo(bx - 10, by + 2);
      cctx.lineTo(bx + 11, by + 2);
      cctx.lineTo(bx + 7, by + 6);
      cctx.lineTo(bx - 7, by + 6);
      cctx.closePath();
      cctx.fill();
      cctx.restore();

      // 7. 北山与南湿地针叶林微剪影
      cctx.save();
      cctx.fillStyle = pal === "mono0" ? "rgba(110,115,112,0.4)" : "rgba(73, 118, 63, 0.36)";
      for (const [tu, tv] of TERRAIN.trees) {
        const tx = tu * W, ty = tv * H;
        cctx.beginPath();
        cctx.moveTo(tx, ty - 11);
        cctx.lineTo(tx - 6, ty + 3);
        cctx.lineTo(tx + 6, ty + 3);
        cctx.closePath();
        cctx.fill();
      }
      cctx.restore();
    }

    // 8. 重噪路网反例模式（密集暗街、杂标、高对比干扰线）
    if (state.contextLevel === "noisy") {
      cctx.save();
      cctx.strokeStyle = "rgba(18, 32, 36, 0.42)";
      cctx.lineWidth = 1.6;
      for (let i = 0; i < 18; i++) {
        cctx.beginPath();
        cctx.moveTo(W * 0.08 + i * (W * 0.052), H * 0.06);
        cctx.lineTo(W * 0.02 + i * (W * 0.052), H * 0.94);
        cctx.stroke();
      }
      for (let j = 0; j < 14; j++) {
        cctx.beginPath();
        cctx.moveTo(W * 0.06, H * 0.08 + j * (H * 0.064));
        cctx.lineTo(W * 0.95, H * 0.13 + j * (H * 0.064));
        cctx.stroke();
      }
      // 干扰杂标文字
      const noiseLabels = ["S201", "G15", "滨海支路", "辅道 B", "变电站", "3号口", "排水渠", "高架北", "停车场", "货运道", "公交站", "环城东"];
      cctx.font = `600 10px "JetBrains Mono", "Noto Sans SC", monospace`;
      cctx.fillStyle = "rgba(15, 28, 30, 0.65)";
      noiseLabels.forEach((lbl, idx) => {
        const nx = (0.18 + ((idx * 17) % 68) / 100) * W;
        const ny = (0.18 + ((idx * 23) % 66) / 100) * H;
        cctx.fillText(lbl, nx, ny);
      });
      cctx.restore();
    }

    cctx.restore(); // 结束半岛剪裁

    // 右上轻盈指北针与左下比例尺（真实制图质感）
    cctx.save();
    const nX = W - 26, nY = 26;
    cctx.strokeStyle = "rgba(6, 51, 41, 0.35)";
    cctx.lineWidth = 1.2;
    cctx.beginPath();
    cctx.arc(nX, nY, 13, 0, Math.PI * 2);
    cctx.stroke();
    cctx.fillStyle = PALETTE.teal;
    cctx.beginPath();
    cctx.moveTo(nX, nY - 10);
    cctx.lineTo(nX + 3.5, nY);
    cctx.lineTo(nX - 3.5, nY);
    cctx.closePath();
    cctx.fill();
    cctx.fillStyle = PALETTE.ink;
    cctx.font = `600 10px "Outfit", sans-serif`;
    cctx.textAlign = "center";
    cctx.fillText("N", nX, nY + 11);

    // 比例尺与坐标铭牌（左下角）
    const sx = 16, sy = H - 16;
    cctx.strokeStyle = "rgba(6, 51, 41, 0.55)";
    cctx.lineWidth = 1.5;
    cctx.beginPath();
    cctx.moveTo(sx, sy - 4);
    cctx.lineTo(sx, sy);
    cctx.lineTo(sx + 54, sy);
    cctx.lineTo(sx + 54, sy - 4);
    cctx.stroke();
    cctx.fillStyle = PALETTE.inkMuted;
    cctx.font = `600 10px "JetBrains Mono", monospace`;
    cctx.textAlign = "left";
    cctx.fillText(`${sc.scaleText} · ${sc.coordText}`, sx, sy - 8);
    cctx.restore();
  }

  // 绘制单张悬浮卡片（原海报圆角白卡风格）
  function drawCard(item, node, selected, hovered, compact) {
    const cw = Math.max(compact ? 86 : 114, Math.min(compact ? 112 : 168, CARD_BOX.w * W));
    const ch = Math.max(compact ? 42 : 56, Math.min(compact ? 56 : 82, CARD_BOX.h * H));
    const x = item.card.u * W - cw / 2;
    const y = item.card.v * H - ch / 2;
    const isErr = !item.ok;

    // 引线（从卡片最近边指向对应锚点针头）
    const pinX = node.pin.u * W;
    const pinY = node.pin.v * H - 14;
    const edgeX = Math.max(x, Math.min(pinX, x + cw));
    const edgeY = Math.max(y, Math.min(pinY, y + ch));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(edgeX, edgeY);
    ctx.lineTo(pinX, pinY);
    if (isErr) {
      ctx.strokeStyle = PALETTE.error;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
    } else {
      ctx.strokeStyle = selected || hovered ? node.color : "rgba(6, 51, 41, 0.38)";
      ctx.lineWidth = selected || hovered ? 2.1 : 1.35;
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 引线端点小圆
    ctx.fillStyle = isErr ? PALETTE.error : node.color;
    ctx.beginPath();
    ctx.arc(edgeX, edgeY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 卡片主体（用两层轻薄矢量偏置底影替代昂贵的逐帧高斯 shadowBlur，软件渲染提速 10×）
    roundRectPath(ctx, x, y + 3.5, cw, ch, 10);
    ctx.fillStyle = isErr
      ? "rgba(192, 50, 43, 0.14)"
      : selected || hovered
        ? "rgba(8, 117, 110, 0.16)"
        : "rgba(6, 51, 41, 0.09)";
    ctx.fill();

    roundRectPath(ctx, x, y, cw, ch, 10);
    ctx.fillStyle = PALETTE.paperCard;
    ctx.fill();

    ctx.lineWidth = isErr ? 2 : selected || hovered ? 2 : 1;
    ctx.strokeStyle = isErr
      ? PALETTE.error
      : selected || hovered
        ? node.color
        : "rgba(6, 51, 41, 0.14)";
    ctx.stroke();

    // 左上彩色圆形图标徽
    const iconR = compact ? 10 : 12.5;
    const iconCx = x + (compact ? 14 : 18);
    const iconCy = y + (compact ? 16 : 21);
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2);
    ctx.fill();
    drawGlyph(ctx, node.icon, iconCx, iconCy, iconR * 0.72, "#FEFDF9");

    // 标题
    const textX = iconCx + iconR + (compact ? 6 : 8);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(node.name, textX, compact ? iconCy - 1 : iconCy - 4);

    // 英文标签或错态提示
    if (isErr) {
      const warn = item.tooFar
        ? `远跳 ${Math.round(item.edgeDist * 100)}% · 拖近`
        : "遮压 · 轻移开";
      ctx.fillStyle = PALETTE.error;
      ctx.font = `600 ${compact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText(warn, compact ? x + 8 : textX, compact ? y + ch - 11 : iconCy + 11);
    } else if (!compact) {
      ctx.fillStyle = node.tagInk;
      ctx.font = `700 10px "Outfit", sans-serif`;
      ctx.fillText(node.tag, textX, iconCy + 11);
      // 简介小字（仅大尺寸显示一行截断）
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 10.5px "Noto Sans SC", sans-serif`;
      const maxChars = Math.max(7, Math.floor((cw - 18) / 11));
      const shortDesc = node.desc.length > maxChars ? node.desc.slice(0, maxChars - 1) + "…" : node.desc;
      ctx.fillText(shortDesc, x + 10, y + ch - 13);
    } else {
      ctx.fillStyle = node.tagInk;
      ctx.font = `700 9.5px "Outfit", sans-serif`;
      ctx.fillText(node.tag, textX, y + ch - 11);
    }

    ctx.restore();
    return { id: item.id, x, y, w: cw, h: ch };
  }

  // 每帧主绘制
  let lastCardRects = [];
  let lastCrossingPts = [];
  let lastCtrlPts = [];
  let dirty = true;
  let lastDragTime = 0;

  function drawFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
    const ev = evaluateMap(state);
    renderTerrainCache(state);

    if (!animStart && !still) animStart = t || 0.001;
    const intro = still ? 1 : Math.min(1, 0.55 + (t / 0.85) * 0.45);
    // 开场 0.9s 后静置时只在状态变化或拖拽时重绘，避免空转吃慢机 CPU；拖拽期每帧必画
    const animatingIntro = !still && intro < 1;
    const activePulse = !still && ev.allPass && state.anchorMode === "balanced";
    if (!dirty && !animatingIntro && !activePulse && !still && dt > 0 && performance.now() - lastDragTime > 120) {
      return;
    }
    dirty = false;

    const compact = W < 500;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(cache, 0, 0, W, H);

    // 1. 路径虚线（原海报标志虚线曲线）
    lastCtrlPts = [];
    for (const r of ev.routes) {
      const isFocused = state.selectedId === r.nodeId || state.hoverId === r.nodeId || state.selectedId === "hub";
      const isCrossed = ev.crossings.some((c) => c.rA === r.nodeId || c.rB === r.nodeId);
      ctx.save();
      ctx.beginPath();
      const maxIdx = Math.max(2, Math.floor((r.pts.length - 1) * intro));
      for (let i = 0; i <= maxIdx; i++) {
        const px = r.pts[i].u * W, py = r.pts[i].v * H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = isCrossed
        ? "rgba(192, 50, 43, 0.84)"
        : state.routeTopology === "mesh"
          ? "rgba(192, 50, 43, 0.58)"
          : r.color;
      ctx.lineWidth = isFocused ? 3 : 2.3;
      ctx.lineCap = "round";
      ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = still ? 0 : -t * 18;
      ctx.stroke();
      ctx.setLineDash([]);

      // 在每条可调曲线的真实中点画一个空心白心拐点环（对应原海报湿地路径上的白心圆环）
      if (r.draggableCtrl) {
        const mid = r.pts[Math.floor(r.pts.length / 2)];
        const mx = mid.u * W, my = mid.v * H;
        ctx.fillStyle = "#FEFDF9";
        ctx.strokeStyle = isCrossed ? PALETTE.error : r.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(mx, my, compact ? 5.5 : 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        lastCtrlPts.push({ id: r.nodeId, x: mx, y: my, r: compact ? 16 : 14 });
      }
      ctx.restore();
    }

    // 2. 真实几何交点红叉徽（点一下即可直接掰直该对交叉路径）
    lastCrossingPts = [];
    for (const c of ev.crossings) {
      const cx = c.u * W, cy = c.v * H;
      ctx.save();
      ctx.fillStyle = PALETTE.error;
      ctx.strokeStyle = "#FEFDF9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, compact ? 10 : 11.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#FEFDF9";
      ctx.lineWidth = 2.1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 3.8, cy - 3.8);
      ctx.lineTo(cx + 3.8, cy + 3.8);
      ctx.moveTo(cx + 3.8, cy - 3.8);
      ctx.lineTo(cx - 3.8, cy + 3.8);
      ctx.stroke();
      ctx.restore();
      lastCrossingPts.push({ ...c, x: cx, y: cy, r: 16 });
    }

    // 3. 次级锚点
    const baseSecR = compact ? 9.5 : 11.5;
    for (const n of sc.nodes) {
      const px = n.pin.u * W, py = n.pin.v * H;
      const pinColor = state.anchorMode === "flat" ? "#8E5A54" : n.color;
      drawPin(ctx, px, py, baseSecR, pinColor, state.selectedId === n.id || state.hoverId === n.id, false, t);
    }

    // 4. 中央主锚点
    const hubX = state.hub.u * W, hubY = state.hub.v * H;
    const hubScale = state.anchorMode === "balanced" ? 1.62 : state.anchorMode === "giant" ? 2.32 : 1.0;
    const hubR = baseSecR * hubScale;
    const hubErr = ev.checks.anchor.code === "sea" || ev.checks.anchor.code === "edge" || state.anchorMode === "giant";
    const hubFill = hubErr
      ? PALETTE.error
      : state.anchorMode === "flat"
        ? "#8E5A54"
        : PALETTE.ink;
    drawPin(ctx, hubX, hubY, hubR, hubFill, state.selectedId === "hub", state.anchorMode === "balanced" && !hubErr, t);

    // 主锚点拖拽标签（仅在错态落海/贴边或选中主锚时轻巧提示）
    if (ev.checks.anchor.code === "sea" || ev.checks.anchor.code === "edge") {
      ctx.save();
      const label = ev.checks.anchor.code === "sea" ? "主锚落海 · 拖回陆地" : "主锚贴边 · 拖回中心";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width + 16;
      const lx = Math.max(8, Math.min(W - tw - 8, hubX - tw / 2));
      const ly = Math.max(10, hubY - hubR * 2.6 - 24);
      roundRectPath(ctx, lx, ly, tw, 22, 6);
      ctx.fillStyle = PALETTE.error;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx + tw / 2, ly + 11);
      ctx.restore();
    } else if (state.selectedId === "hub" && !compact) {
      ctx.save();
      const label = `↔ 拖动${sc.hubName}`;
      ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width + 14;
      const lx = Math.max(8, Math.min(W - tw - 8, hubX - tw / 2));
      const ly = Math.min(H - 28, hubY + 14);
      roundRectPath(ctx, lx, ly, tw, 20, 10);
      ctx.fillStyle = "rgba(6, 51, 41, 0.86)";
      ctx.fill();
      ctx.fillStyle = "#FCF5E8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx + tw / 2, ly + 10);
      ctx.restore();
    }

    // 5. 五张悬浮信息卡
    lastCardRects = [];
    for (const item of ev.cardMeta.items) {
      const node = sc.nodes.find((n) => n.id === item.id);
      const rect = drawCard(item, node, state.selectedId === item.id, state.hoverId === item.id, compact);
      lastCardRects.push(rect);
    }

    // 右下角原海报 4×3 青碧点阵微装饰（纯视觉呼应，不干扰交互）
    if (!compact) {
      ctx.save();
      ctx.fillStyle = "rgba(8, 117, 110, 0.28)";
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          ctx.beginPath();
          ctx.arc(W - 44 + col * 9, H - 30 + row * 9, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  const ctrl = loop(canvas, drawFrame);

  // ---------- 指针与触屏交互（保证手机竖滑滚页、横拖稳控主锚与卡片） ----------
  function getCanvasPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTest(x, y, state) {
    // 1. 红色交叉章优先（点击即解结）
    for (const c of lastCrossingPts) {
      if (Math.hypot(x - c.x, y - c.y) <= c.r) return { kind: "crossing", data: c };
    }
    // 2. 悬浮卡片（倒序命中顶部）
    for (let i = lastCardRects.length - 1; i >= 0; i--) {
      const b = lastCardRects[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        return { kind: "card", id: b.id };
      }
    }
    // 3. 主锚点（慷慨命中半径）
    const hx = state.hub.u * W, hy = state.hub.v * H - 14;
    if (Math.hypot(x - hx, y - hy) <= 34) {
      return { kind: "hub", id: "hub" };
    }
    // 4. 路径拐点环
    for (const c of lastCtrlPts) {
      if (Math.hypot(x - c.x, y - c.y) <= c.r) return { kind: "ctrl", id: c.id };
    }
    // 5. 次级锚点
    const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
    for (const n of sc.nodes) {
      const px = n.pin.u * W, py = n.pin.v * H - 10;
      if (Math.hypot(x - px, y - py) <= 22) return { kind: "pin", id: n.id };
    }
    // 6. 地图空地横拖默认拖主锚点（让 perf.mjs 居中横拖与随手微调中心都能立即生效）
    return { kind: "hub-bg", id: "hub" };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  canvas.addEventListener("pointerdown", (e) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    const state = getState();
    const hit = hitTest(pos.x, pos.y, state);

    if (hit.kind === "crossing") {
      // 直接拉直相交的两条路线
      const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
      const nextCtrls = { ...state.ctrls };
      for (const id of [hit.data.rA, hit.data.rB]) {
        const node = sc.nodes.find((n) => n.id === id);
        if (node) nextCtrls[id] = { ...node.cleanCtrl };
      }
      setState({ ...state, routeTopology: "custom", ctrls: nextCtrls });
      dirty = true;
      ctrl.draw();
      onSyncUI();
      return;
    }

    if (hit.kind === "pin") {
      setState({ ...state, selectedId: hit.id });
      dirty = true;
      ctrl.draw();
      onSyncUI();
      return;
    }

    const orig =
      hit.kind === "card"
        ? state.cards[hit.id]
        : hit.kind === "ctrl"
          ? state.ctrls[hit.id]
          : state.hub;

    drag = {
      kind: hit.kind,
      id: hit.id,
      startX: pos.x,
      startY: pos.y,
      origU: orig.u,
      origV: orig.v,
      moved: false,
      locked: hit.kind !== "hub-bg",
      pointerId: e.pointerId,
    };

    if (hit.kind === "card" || hit.kind === "ctrl" || hit.kind === "hub") {
      setState({ ...state, selectedId: hit.id });
      dirty = true;
      onSyncUI();
    }
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    const state = getState();
    if (!drag) {
      const hit = hitTest(pos.x, pos.y, state);
      const nextHover = hit.kind === "card" || hit.kind === "pin" ? hit.id : null;
      canvas.style.cursor =
        hit.kind === "crossing" ? "pointer" : hit.kind === "hub-bg" ? "grab" : "grab";
      if (state.hoverId !== nextHover) {
        setState({ ...state, hoverId: nextHover });
        dirty = true;
      }
      return;
    }
    if (e.pointerId !== drag.pointerId) return;

    const dx = pos.x - drag.startX;
    const dy = pos.y - drag.startY;
    // 触屏空地若明显竖向滑屏，立刻交还给页面滚动
    if (!drag.locked) {
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && Math.abs(dy) > 8) {
        drag = null;
        return;
      }
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.locked = true;
    }

    drag.moved = true;
    lastDragTime = performance.now();
    const du = dx / W;
    const dv = dy / H;
    const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;

    if (drag.kind === "card") {
      const hw = CARD_BOX.w * 0.5 + 0.01;
      const hh = CARD_BOX.h * 0.5 + 0.01;
      let nu = clamp(drag.origU + du, hw, 1 - hw);
      let nv = clamp(drag.origV + dv, hh, 1 - hh);
      const node = sc.nodes.find((n) => n.id === drag.id);
      if (node && Math.hypot(nu - node.cleanCard.u, nv - node.cleanCard.v) < 0.045) {
        nu = node.cleanCard.u;
        nv = node.cleanCard.v;
      }
      setState({ ...state, cards: { ...state.cards, [drag.id]: { u: nu, v: nv } } });
    } else if (drag.kind === "ctrl") {
      const node = sc.nodes.find((n) => n.id === drag.id);
      let nu = clamp(drag.origU + du, 0.08, 0.92);
      let nv = clamp(drag.origV + dv, 0.08, 0.92);
      if (node && Math.hypot(nu - node.cleanCtrl.u, nv - node.cleanCtrl.v) < 0.04) {
        nu = node.cleanCtrl.u;
        nv = node.cleanCtrl.v;
      }
      setState({
        ...state,
        routeTopology: "custom",
        ctrls: { ...state.ctrls, [drag.id]: { u: nu, v: nv } },
      });
    } else {
      let nu = clamp(drag.origU + du, 0.12, 0.88);
      let nv = drag.kind === "hub-bg" ? drag.origV : clamp(drag.origV + dv, 0.14, 0.86);
      if (Math.hypot(nu - HUB_CLEAN.u, nv - HUB_CLEAN.v) < 0.035 && Math.abs(du) > 0.04) {
        nu = HUB_CLEAN.u;
        nv = HUB_CLEAN.v;
      }
      setState({ ...state, hub: { u: nu, v: nv } });
    }

    // 标脏交由 rAF 合批重画，避免一次 pointermove 叠一次 rAF 造成单帧双绘
    dirty = true;
    onSyncUI();
  });

  const endDrag = () => {
    if (drag) {
      dirty = true;
      ctrl.draw();
    }
    drag = null;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘可操作：方向键微调当前选中主锚或卡片
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.05 : 0.02;
    let du = 0, dv = 0;
    if (e.key === "ArrowLeft") du = -step;
    else if (e.key === "ArrowRight") du = step;
    else if (e.key === "ArrowUp") dv = -step;
    else if (e.key === "ArrowDown") dv = step;
    else return;
    e.preventDefault();
    const state = getState();
    if (state.selectedId === "hub") {
      setState({
        ...state,
        hub: { u: clamp(state.hub.u + du, 0.12, 0.88), v: clamp(state.hub.v + dv, 0.14, 0.86) },
      });
    } else if (state.cards[state.selectedId]) {
      const cur = state.cards[state.selectedId];
      setState({
        ...state,
        cards: {
          ...state.cards,
          [state.selectedId]: {
            u: clamp(cur.u + du, 0.12, 0.88),
            v: clamp(cur.v + dv, 0.10, 0.90),
          },
        },
      });
    }
    dirty = true;
    ctrl.draw();
    onSyncUI();
  });

  window.addEventListener("resize", () => {
    cacheKey = "";
    dirty = true;
    ctrl.draw();
  });

  return {
    draw: () => { dirty = true; ctrl.draw(); },
    invalidate: () => { cacheKey = ""; dirty = true; ctrl.draw(); },
  };
}
