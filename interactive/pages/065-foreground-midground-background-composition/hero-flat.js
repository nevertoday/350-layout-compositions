// WebGL 关闭时的 2D Canvas 2.5D 多平面玻璃景片降级舞台。
// 严格共用 model.js 与 artwork.js 离屏三层画布，支持完全一致的横向拖拽拆层视角与 1->2->3 视线推演。

import { pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import { createLayerCanvases, updateLayerCanvases } from "./artwork.js";

export function mountHeroFlat(canvas, getState, getEval) {
  const ctx = canvas.getContext("2d");
  const canvases = createLayerCanvases();
  let lastTexSig = "";
  let curYaw = 12;

  function syncTextures(state, evalRes) {
    const sig = `${state.scene}|${state.fgScale.toFixed(3)}|${state.fgLayout}|${state.atmoFade.toFixed(3)}|${state.focusMode}`;
    if (sig === lastTexSig) return;
    lastTexSig = sig;
    updateLayerCanvases(canvases, state, evalRes);
  }

  function render(t, dt, { still }) {
    const state = getState();
    const evalRes = getEval();
    syncTextures(state, evalRes);

    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(1.5);
    const w = Math.max(200, Math.round(rect.width));
    const h = Math.max(150, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    if (still) curYaw = state.camYaw;
    else curYaw += (state.camYaw - curYaw) * (dt > 0 ? 1 - Math.exp(-dt * 9.5) : 0.25);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.creamTop;
    ctx.fillRect(0, 0, w, h);

    const yawRad = (curYaw * Math.PI) / 180;
    const oblique = Math.min(1, Math.abs(curYaw) / 14);

    // 等比计算景片基准尺寸（匹配 2.5:1 全景宽幅，不裁边）
    const aspect = 2.5;
    let pw = Math.min(w * 0.90, h * 0.86 * aspect);
    let ph = pw / aspect;
    if (ph > h * 0.84) {
      ph = h * 0.84;
      pw = ph * aspect;
    }

    const scaleX = Math.max(0.56, Math.cos(yawRad * 0.85));
    const shiftBase = Math.sin(yawRad) * pw * 0.24;

    const { fgZ, midZ, bgZ } = evalRes.planes;
    const layers = [
      { img: canvases.bg, z: bgZ, color: PALETTE.bgBand, tag: "3 背景" },
      { img: canvases.mid, z: midZ, color: PALETTE.midBand, tag: "2 中景" },
      { img: canvases.fg, z: fgZ, color: PALETTE.fgBand, tag: "1 前景" },
    ];

    // 侧斜时画底部 Z 导轨线
    if (oblique > 0.05) {
      ctx.save();
      ctx.strokeStyle = `rgba(8, 54, 38, ${(oblique * 0.32).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      const baseY = h * 0.5 + ph * 0.52;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - shiftBase * bgZ - pw * scaleX * 0.45, baseY);
      ctx.lineTo(w * 0.5 - shiftBase * fgZ - pw * scaleX * 0.45, baseY);
      ctx.moveTo(w * 0.5 - shiftBase * bgZ + pw * scaleX * 0.45, baseY);
      ctx.lineTo(w * 0.5 - shiftBase * fgZ + pw * scaleX * 0.45, baseY);
      ctx.stroke();
      ctx.restore();
    }

    // 由远及近绘出三片玻璃景片
    const anchors = [];
    for (const l of layers) {
      const cx = w * 0.5 - shiftBase * l.z;
      const cy = h * 0.5 - l.z * oblique * 8;
      const dw = pw * scaleX * (1 + l.z * 0.04);
      const dh = ph * (1 + l.z * 0.04);
      const x = cx - dw / 2;
      const y = cy - dh / 2;
      anchors.push({ cx, cy, dw, dh });

      ctx.save();
      if (oblique > 0.05) {
        ctx.fillStyle = "rgba(255,252,245,0.22)";
        ctx.fillRect(x, y, dw, dh);
      }
      ctx.drawImage(l.img, x, y, dw, dh);
      if (oblique > 0.05) {
        ctx.strokeStyle = l.color;
        ctx.globalAlpha = oblique * 0.85;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, dw, dh);
      }
      ctx.restore();
    }

    // 视线推演金线 1 -> 2 -> 3
    if (state.sightPulse > 0 && anchors.length === 3) {
      const p0 = { x: anchors[2].cx - anchors[2].dw * 0.25, y: anchors[2].cy + anchors[2].dh * 0.24 };
      const p1 = { x: anchors[1].cx + anchors[1].dw * 0.18, y: anchors[1].cy + anchors[1].dh * 0.06 };
      const p2 = { x: anchors[0].cx + anchors[0].dw * 0.28, y: anchors[0].cy - anchors[0].dh * 0.20 };
      ctx.save();
      ctx.strokeStyle = "#C98A2B";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      const phase = still ? 0.52 : (t * 0.42) % 1;
      const dot = phase < 0.5
        ? { x: p0.x + (p1.x - p0.x) * phase * 2, y: p0.y + (p1.y - p0.y) * phase * 2 }
        : { x: p1.x + (p2.x - p1.x) * (phase - 0.5) * 2, y: p1.y + (p2.y - p1.y) * (phase - 0.5) * 2 };
      ctx.fillStyle = "#D48A24";
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return { render };
}
