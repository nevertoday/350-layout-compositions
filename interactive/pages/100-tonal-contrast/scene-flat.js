// WebGL 不可用时的 2D Canvas 降级画法：读取与 scene-3d.js 完全相同的 state，视觉与交互无损。
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, clamp, lerp, rgbCss, toneRgb } from "./palette.js";
import { tonalMetrics } from "./model.js";

export function createSceneFlat(host) {
  const canvas = document.createElement("canvas");
  canvas.className = "flat-canvas";
  host.append(canvas);
  const ctx = canvas.getContext("2d");
  let w = 600;
  let h = 440;
  let dpr = 1;

  return {
    el: canvas,
    resize(nw, nh) {
      w = Math.max(240, nw);
      h = Math.max(200, nh);
      dpr = pixelRatio(2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    },
    render(state, openK = 1) {
      const m = tonalMetrics(state.u, state.v);
      ctx.save();
      ctx.scale(dpr, dpr);

      if (state.scene === "split") {
        const splitX = w * lerp(0.57, 0.43, state.v);
        ctx.fillStyle = rgbCss(m.lightRgb);
        ctx.fillRect(0, 0, splitX, h);
        ctx.fillStyle = rgbCss(m.darkRgb);
        ctx.fillRect(splitX, 0, w - splitX, h);

        const cy = h * 0.43;
        const R = Math.min(w, h) * 0.26 * lerp(0.86, 1, openK);

        // 左下斜向投影楔
        ctx.beginPath();
        ctx.moveTo(splitX, cy + R * 0.96);
        ctx.lineTo(0, h);
        ctx.lineTo(splitX, h);
        ctx.closePath();
        ctx.fillStyle = rgbCss(m.darkRgb);
        ctx.fill();

        // 右下透视阶梯
        const STEP_N = 9;
        const y0 = cy + R * 0.96;
        const spanH = h - y0 - 24;
        for (let i = 0; i < STEP_N; i++) {
          const f = i / (STEP_N - 1);
          const bw = lerp(R * 0.2, R * 1.45, Math.pow(f, 1.25)) * openK;
          const bh = lerp(3, 14, Math.pow(f, 1.3));
          const sy = y0 + f * f * spanH;
          const st =
            state.gradation === "notan"
              ? m.hi
              : state.gradation === "five"
                ? lerp(m.lo + (m.hi - m.lo) * 0.35, m.hi, Math.floor(f * 4.999) / 4)
                : lerp(m.lo + (m.hi - m.lo) * 0.28, m.hi, f);
          ctx.fillStyle = rgbCss(toneRgb(st));
          ctx.fillRect(splitX, sy, bw, bh);
        }

        // 左半黑圆 + 右半纸圆
        ctx.beginPath();
        ctx.arc(splitX, cy, R, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fillStyle = rgbCss(m.darkRgb);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(splitX, cy, R, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fillStyle = rgbCss(m.lightRgb);
        ctx.fill();

        // 朱红焦点点
        if (state.dot) {
          ctx.beginPath();
          ctx.arc(splitX + R * 0.42, cy - R * 0.28, R * 0.19, 0, Math.PI * 2);
          ctx.fillStyle = PALETTE.redHex;
          ctx.fill();
        }
      } else if (state.scene === "chiaroscuro") {
        const bgTone = lerp(m.hi * 0.96, m.lo * 1.05, clamp(state.v, 0, 1));
        ctx.fillStyle = rgbCss(toneRgb(bgTone));
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = rgbCss(toneRgb(clamp(bgTone - 0.12 * state.u, 0, 1)));
        ctx.fillRect(0, h * 0.68, w, h * 0.32);

        const cx = w * 0.52;
        const cy = h * 0.44;
        const R = Math.min(w, h) * 0.27;
        const g = ctx.createRadialGradient(cx + R * 0.35, cy - R * 0.32, R * 0.1, cx, cy, R * 1.15);
        g.addColorStop(0, rgbCss(m.lightRgb));
        g.addColorStop(1, rgbCss(m.darkRgb));
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      } else {
        const bgDark = state.v > 0.56;
        const bg = toneRgb(bgDark ? m.lo : m.hi);
        const fg = toneRgb(bgDark ? m.hi : m.lo);
        const mid = toneRgb(lerp(bgDark ? m.lo : m.hi, bgDark ? m.hi : m.lo, 0.55));
        ctx.fillStyle = rgbCss(bg);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = rgbCss(fg);
        ctx.font = `900 ${Math.round(Math.min(w, h) * 0.14)}px "Noto Sans SC", sans-serif`;
        ctx.fillText("明暗有度", w * 0.08, h * 0.44);
        ctx.fillText("画面有力", w * 0.08, h * 0.62);
        ctx.fillStyle = rgbCss(mid);
        ctx.font = `400 ${Math.round(Math.min(w, h) * 0.045)}px "Noto Sans SC", sans-serif`;
        ctx.fillText("明度差决定信息先后顺序", w * 0.08, h * 0.74);
      }

      ctx.restore();
    },
  };
}
