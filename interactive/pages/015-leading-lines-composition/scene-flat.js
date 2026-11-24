// 无 WebGL 时的 SVG 降级版：读取同一份 model.js 状态，实时重绘一点透视长廊 / 公路。
import { PALETTE } from "./palette.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export function createSceneFlat(host) {
  const svg = el("svg", {
    class: "flat-svg",
    viewBox: "0 0 600 400",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
  });
  host.append(svg);

  let W = 600;
  let H = 400;

  return {
    el: svg,
    resize(w, h) {
      W = Math.max(1, w);
      H = Math.max(1, h);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    },
    render(s, t) {
      const vx = s.vp.u * W;
      const vy = s.vp.v * H;
      const isCorridor = s.scene === "corridor";
      const f = new DocumentFragment();

      // 深松底色
      f.append(el("rect", { x: 0, y: 0, width: W, height: H, fill: PALETTE.bg }));
      // 地平线以下略暗的地面
      f.append(el("rect", { x: 0, y: vy, width: W, height: H - vy, fill: "#08160d" }));

      // 走廊天花和侧墙框架或公路地平线
      if (isCorridor) {
        // 左右墙面暗示
        f.append(el("polygon", {
          points: `0,0 ${vx},${vy} 0,${H}`,
          fill: "#102418",
        }));
        f.append(el("polygon", {
          points: `${W},0 ${vx},${vy} ${W},${H}`,
          fill: "#102418",
        }));
        // 节奏立柱框
        for (let i = 1; i <= 6; i++) {
          const k = Math.pow(i / 7, 1.45);
          const x1 = vx * (1 - k);
          const x2 = vx + (W - vx) * k;
          const y1 = vy * (1 - k);
          const y2 = vy + (H - vy) * k;
          f.append(el("rect", {
            x: x1, y: y1, width: x2 - x1, height: y2 - y1,
            fill: "none", stroke: PALETTE.pineLight,
            "stroke-width": 1 + k * 2.5, opacity: 0.45 + k * 0.4,
          }));
        }
      } else {
        // 公路地平线
        f.append(el("line", {
          x1: 0, y1: vy, x2: W, y2: vy,
          stroke: PALETTE.cream, "stroke-opacity": "0.28", "stroke-width": "1",
        }));
        // 路侧电线收敛线
        for (const sx of [0, W]) {
          f.append(el("line", {
            x1: sx, y1: Math.max(0, vy - H * 0.42), x2: vx, y2: vy,
            stroke: PALETTE.orangeHi, "stroke-opacity": "0.55", "stroke-width": "1.2",
          }));
        }
      }

      // 两条海报核心宽引导带（米白 + 朱橙），精确从底边收拢至消失点 (vx, vy)
      f.append(el("polygon", {
        points: `${W * 0.08},${H} ${W * 0.29},${H} ${vx},${vy}`,
        fill: PALETTE.cream,
      }));
      f.append(el("polygon", {
        points: `${W * 0.36},${H} ${W * 0.54},${H} ${vx},${vy}`,
        fill: PALETTE.orange,
      }));
      // 细边引导线
      f.append(el("line", {
        x1: W * 0.62, y1: H, x2: vx, y2: vy,
        stroke: PALETTE.cream, "stroke-width": "1.6", "stroke-opacity": "0.85",
      }));
      if (isCorridor) {
        f.append(el("line", {
          x1: 0, y1: H * 0.66, x2: vx, y2: vy,
          stroke: PALETTE.orangeHi, "stroke-width": "2",
        }));
        f.append(el("line", {
          x1: W, y1: H * 0.66, x2: vx, y2: vy,
          stroke: PALETTE.orangeHi, "stroke-width": "2",
        }));
      }

      // 远端朱橙圆盘 + 中心黑点 + 剪影主体
      const fx = s.focal === "offset" ? (s.vp.u > 0.5 ? W * 0.24 : W * 0.76) : vx;
      const r = Math.min(W, H) * 0.085;
      f.append(el("circle", { cx: fx, cy: vy, r, fill: PALETTE.orange }));
      f.append(el("circle", { cx: fx, cy: vy, r: r * 0.14, fill: PALETTE.pinhole }));
      // 极简人物背影剪影（无五官）
      const fh = r * 1.1;
      f.append(el("circle", { cx: fx, cy: vy + r * 0.15, r: fh * 0.16, fill: PALETTE.pinhole }));
      f.append(el("path", {
        d: `M${fx - fh * 0.2},${vy + r * 0.36} L${fx + fh * 0.2},${vy + r * 0.36} L${fx + fh * 0.28},${vy + r * 1.25} L${fx - fh * 0.28},${vy + r * 1.25} Z`,
        fill: PALETTE.pinhole,
      }));

      // 视线流动小光点
      if (s.flow) {
        for (let i = 0; i < 3; i++) {
          const p = (i / 3 + t * 0.24) % 1;
          const bx = W * 0.19 + (vx - W * 0.19) * p;
          const by = H + (vy - H) * p;
          f.append(el("circle", {
            cx: bx, cy: by, r: Math.max(2, (1 - p) * 5.5),
            fill: PALETTE.orangeHi, opacity: 1 - p * 0.6,
          }));
        }
      }

      svg.replaceChildren(f);
    },
  };
}
