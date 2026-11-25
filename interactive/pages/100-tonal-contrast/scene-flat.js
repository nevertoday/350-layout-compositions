// WebGL 不可用时的 2D Canvas 降级画法：读取与 scene-3d.js 完全相同的三点色阶 state，视觉与交互无损。
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, clamp, lerp, levelRgb, rgbCss } from "./palette.js";
import { tonalMetrics } from "./model.js";

export function createSceneFlat(host) {
  const canvas = document.createElement("canvas");
  canvas.className = "flat-canvas";
  host.append(canvas);
  const ctx = canvas.getContext("2d");
  let w = 600;
  let h = 400;
  let dpr = 1;

  return {
    el: canvas,
    resize(nw, nh) {
      w = Math.max(1, Math.round(nw));
      h = Math.max(1, Math.round(nh));
      dpr = pixelRatio(2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    },
    render(state, openK = 1) {
      const m = tonalMetrics(state);
      ctx.save();
      ctx.scale(dpr, dpr);

      // 与 scene-3d.js 共用同一 halfH = 1.0 归一化坐标系，保证任何屏幕比例下圆形 1:1 不变形且 9 级阶梯完整入框
      const unit = h * 0.5;
      const aspect = w / Math.max(h, 1);
      const toX = (wx) => w * 0.5 + wx * unit;
      const toY = (wy) => h * 0.5 - wy * unit;

      if (state.scene === "split") {
        const maxShift = Math.min(aspect * 0.52, 1.35);
        const splitWorld = lerp(-maxShift, maxShift, (m.key - 0.12) / 0.76);
        const splitX = toX(splitWorld);
        ctx.fillStyle = rgbCss(m.lightRgb);
        ctx.fillRect(0, 0, splitX, h);
        ctx.fillStyle = rgbCss(m.darkRgb);
        ctx.fillRect(splitX, 0, w - splitX, h);

        // 左下斜向投影楔（与右侧阶梯右沿同倾角）
        const wedgeW = Math.min(aspect * 0.98 + Math.max(0, splitWorld), 1.08);
        ctx.beginPath();
        ctx.moveTo(splitX, toY(-0.27));
        ctx.lineTo(toX(splitWorld - wedgeW), toY(-1.02));
        ctx.lineTo(splitX, toY(-1.02));
        ctx.closePath();
        ctx.fillStyle = rgbCss(m.darkRgb);
        ctx.fill();

        // 右下 9 级透视阶梯（底边止于 y = -0.802，完整落在舞台内且高于 360×740 角标）
        const STEP_N = 9;
        const startY = -0.265;
        const totalSpan = 0.54;
        const r = 1.185;
        let yCursor = startY;
        for (let i = 0; i < STEP_N; i++) {
          const f = i / (STEP_N - 1);
          const powR = Math.pow(r, i);
          const sh = 0.0148 * powR;
          const sg = 0.0154 * powR;
          const yc = yCursor - sh * 0.5;
          const t = clamp((startY - yc) / totalSpan, 0, 1);
          const sw = lerp(0.11, 0.84, t) * openK;
          const st =
            state.gradation === "notan"
              ? m.hi
              : state.gradation === "five"
                ? lerp(m.lo + m.span * 0.35, m.hi, Math.floor(f * 4.999) / 4)
                : lerp(m.lo + m.span * 0.26, m.hi, f);
          ctx.fillStyle = rgbCss(levelRgb(st));
          ctx.fillRect(splitX, toY(yCursor), sw * unit, sh * unit);
          yCursor -= sh + sg;
        }

        // 左半黑圆 + 右半纸圆
        const sRadius = lerp(0.88, 1.0, openK);
        const cy = toY(0.3);
        const R = 0.56 * sRadius * unit;
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
          const dotR = 0.102 * lerp(0.65, 1, openK) * unit;
          ctx.beginPath();
          ctx.arc(toX(splitWorld + 0.23 * sRadius), toY(0.3 + 0.15 * sRadius), dotR, 0, Math.PI * 2);
          ctx.fillStyle = PALETTE.redHex;
          ctx.fill();
        }
      } else if (state.scene === "chiaroscuro") {
        const bgTone = lerp(m.lo * 1.05, m.hi * 0.96, clamp((m.key - 0.12) / 0.76, 0, 1));
        ctx.fillStyle = rgbCss(levelRgb(bgTone));
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = rgbCss(levelRgb(clamp(bgTone - 0.14 * m.span, 0, 1)));
        ctx.fillRect(0, toY(-0.24), w, h - toY(-0.24));

        const cx = toX(0);
        const cy = toY(0.14);
        const R = 0.56 * 1.04 * lerp(0.9, 1, openK) * unit;
        const lx = lerp(0.55, 0.15, clamp((m.key - 0.12) / 0.76, 0, 1));
        const g = ctx.createRadialGradient(cx + R * lx, cy - R * 0.32, R * 0.1, cx, cy, R * 1.15);
        g.addColorStop(0, rgbCss(m.lightRgb));
        g.addColorStop(1, rgbCss(m.darkRgb));
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      } else {
        const bgDark = m.key < 0.44;
        const bg = bgDark ? m.darkRgb : m.lightRgb;
        const fg = bgDark ? m.lightRgb : m.darkRgb;
        const mid = levelRgb(lerp(bgDark ? m.lo : m.hi, bgDark ? m.hi : m.lo, 0.55));
        ctx.fillStyle = rgbCss(bg);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = rgbCss(fg);
        ctx.font = `900 ${Math.round(Math.min(w, h) * 0.14)}px "Noto Sans SC", sans-serif`;
        ctx.fillText("明暗有度", w * 0.08, h * 0.42);
        ctx.fillText("画面有力", w * 0.08, h * 0.62);
        ctx.fillStyle = rgbCss(mid);
        ctx.font = `500 ${Math.round(Math.min(w, h) * 0.04)}px "DM Mono", monospace`;
        ctx.fillText(`ISSUE 100 · ${m.ratio.toFixed(1)} : 1`, w * 0.08, h * 0.24);
      }

      ctx.restore();
    },
  };
}
