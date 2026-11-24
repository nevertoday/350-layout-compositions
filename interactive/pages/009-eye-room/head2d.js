// 平面的头：海报那种黑色剪影、奶白眼睛、浅黄耳廓、橄榄绿肩膀。转头角度连续变化，
// 关掉 WebGL 时的开场和各节小图都用它。坐标以头的半径为 1，原点在眼睛那一高度的头中心，y 向下。
import { BACK_REACH, FRONT_REACH } from "./model.js";

export const C = {
  paper: "#fbf3e1",
  paper2: "#f3ead2",
  glow: "#cfd0a3",
  olive: "#5b6834",
  oliveDeep: "#46512a",
  ink: "#1b1b1b",
  hair: "#0e0e0d",
  cream: "#f6ecc8",
  ear: "#e9d79a",
  muted: "#77735f",
};

const f = (x) => +x.toFixed(3);
const ell = (cx, cy, rx, ry, fill) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"/>`;
const clamp1 = (x) => Math.max(-1, Math.min(1, x));

// 头发轮廓：正脸和全侧脸各一组控制点，按侧向分量插值，再连成平滑的闭合曲线
const HAIR_FRONT = [[-0.93, 0.05], [-0.98, -0.7], [-0.5, -1.22], [0.15, -1.3], [0.75, -1.05], [0.95, -0.5], [0.85, -0.3], [0.3, -0.62], [-0.3, -0.62], [-0.85, -0.3]];
const HAIR_SIDE = [[-1.04, 0.2], [-1.1, -0.62], [-0.62, -1.2], [0.1, -1.36], [0.85, -1.27], [1.1, -1.0], [0.84, -0.78], [0.4, -0.55], [0.02, -0.28], [-0.4, 0.06]];
function smooth(pts) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = pts.length;
  let d = `M${mid(pts[n - 1], pts[0]).map(f).join(" ")}`;
  for (let i = 0; i < n; i++) d += `Q${pts[i].map(f).join(" ")} ${mid(pts[i], pts[(i + 1) % n]).map(f).join(" ")}`;
  return `${d}Z`;
}

// yaw：向右为正（弧度）；pitch：抬头为正；eye：眼珠额外转的角度（看得比头快）。
// 先按「朝右」画，朝左时整体左右翻过来。
export function headSVG(yaw, pitch = 0, { eye = 0, body = true } = {}) {
  const dir = yaw < 0 ? -1 : 1;
  const a = Math.abs(yaw);
  const s = Math.sin(a);
  const lift = -Math.sin(pitch) * 0.28;
  const out = [];
  if (body) {
    const bx = s * 0.18;
    out.push(`<path d="M${f(bx - 2.5)} 3.4 C${f(bx - 2.4)} 1.9 ${f(bx - 1.4)} 1.32 ${f(bx)} 1.3 C${f(bx + 1.4)} 1.32 ${f(bx + 2.4)} 1.9 ${f(bx + 2.5)} 3.4 Z" fill="${C.olive}"/>`);
    out.push(`<path d="M${f(-0.4 + s * 0.02)} 0.5 L${f(0.4 + s * 0.02)} 0.5 L${f(0.48 + s * 0.06)} 1.42 Q${f(s * 0.06)} 1.6 ${f(-0.48 + s * 0.06)} 1.42 Z" fill="${C.ink}"/>`);
  }
  // 耳朵：先画深色的耳朵块，浅黄耳廓最后画在上面
  const ears = [];
  for (const e of [-1, 1]) {
    const ang = a + (e * Math.PI) / 2;
    const c = Math.cos(ang);
    if (c < -0.2) continue;
    const x = 0.86 * Math.sin(ang) - s * 0.1;
    const w = 0.2 * Math.max(0.3, c);
    const side = x > 0.3 ? -1 : 1; // 弧开口朝脸
    const y = 0.08 + lift * 0.4;
    out.push(ell(x, y, w * 0.9, 0.24, C.ink));
    ears.push(`<path d="M${f(x + side * w * 0.25)} ${f(y - 0.17)} Q${f(x - side * w * 1.25)} ${f(y)} ${f(x + side * w * 0.25)} ${f(y + 0.18)}" fill="none" stroke="${C.ear}" stroke-width="0.055" stroke-linecap="round"/>`);
  }
  // 头骨：侧过去时中心往后挪、后脑勺鼓出来；下巴往前伸
  const back = BACK_REACH(s);
  const cx = -(back - 0.88) * 0.5;
  out.push(ell(cx, -0.02, 0.88 + (back - 0.88) * 0.5, 1.06, C.ink));
  out.push(ell(s * 0.3, 0.56 + lift * 0.3, 0.6 - s * 0.06, 0.48, C.ink));
  // 鼻子：鼻根在脸面上，鼻尖往前伸到 FRONT_REACH
  if (s > 0.12) {
    const tip = s * 0.8 + (FRONT_REACH(s) - s * 0.8) * Math.min(1, s * 1.15);
    out.push(`<path d="M${f(s * 0.76)} ${f(-0.18 + lift)} L${f(tip)} ${f(0.24 + lift)} L${f(s * 0.7)} ${f(0.36 + lift)} Z" fill="${C.ink}"/>`);
  }
  const hair = HAIR_FRONT.map((p, i) => [p[0] + (HAIR_SIDE[i][0] - p[0]) * s, p[1] + (HAIR_SIDE[i][1] - p[1]) * s + (i > 5 ? lift * 0.4 : 0)]);
  out.push(`<path d="${smooth(hair)}" fill="${C.hair}"/>`);
  out.push(...ears);
  // 眼睛：在脸上 ±32° 处，朝镜头的那只才画；眼珠往看的方向偏
  for (const e of [-1, 1]) {
    const ang = a + e * 0.56;
    const c = Math.cos(ang);
    if (c < 0.12) continue;
    const x = 0.7 * Math.sin(ang);
    const y = -0.04 + lift;
    const rx = 0.17 * Math.max(0.45, c);
    out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="0.095" fill="${C.cream}"/>`);
    const px = x + clamp1(Math.sin(eye * dir) + s * 0.55) * rx * 0.55;
    out.push(`<circle cx="${f(px)}" cy="${f(y)}" r="0.062" fill="${C.ink}"/>`);
  }
  const g = out.join("");
  return dir < 0 ? `<g transform="scale(-1 1)">${g}</g>` : g;
}

// 在 (x, y) 处画一个半径 R 的头（单位随调用方）
export const placedHead = (x, y, R, yaw, pitch, opts) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(R)})">${headSVG(yaw, pitch, opts)}</g>`;
