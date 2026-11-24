// 裁切框只存三个数：中心 (cx, cy) 和高 h，都是世界坐标；宽 = h × 画幅比。
// 量法：把主体画成一张小遮罩，做成积分图（summed-area table），任意矩形里有多少主体就是四次查表。

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function makeMask(W, H, cell, paint) {
  const w = Math.ceil(W / cell), h = Math.ceil(H / cell), stride = w + 1;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.scale(1 / cell, 1 / cell);
  paint(g);
  const px = g.getImageData(0, 0, w, h).data;
  const sat = new Float64Array(stride * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += px[(y * w + x) * 4 + 3] / 255;
      sat[(y + 1) * stride + x + 1] = sat[y * stride + x + 1] + row;
    }
  }
  // 积分图在格子里按双线性取值，正好等于「格子内均匀」时的精确面积
  const at = (X, Y) => {
    const x = clamp(X / cell, 0, w), y = clamp(Y / cell, 0, h);
    const xi = Math.min(Math.floor(x), w - 1), yi = Math.min(Math.floor(y), h - 1), fx = x - xi, fy = y - yi;
    const a = sat[yi * stride + xi], b = sat[yi * stride + xi + 1], c2 = sat[(yi + 1) * stride + xi], d = sat[(yi + 1) * stride + xi + 1];
    return a + fx * (b - a) + fy * (c2 - a) + fx * fy * (d - b - c2 + a);
  };
  const area = (x0, y0, x1, y1) => (at(x1, y1) - at(x0, y1) - at(x1, y0) + at(x0, y0)) * cell * cell;
  return { area, total: area(0, 0, W, H) };
}

export const rectOf = ({ cx, cy, h }, aspect) => {
  const w = h * aspect;
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2, w, h };
};

// 一个框量出来的东西：占画面多少、主体露出多少、四条边各是「切过」「将贴未贴」还是「空」
export function measure(mask, crop, aspect) {
  const r = rectOf(crop, aspect);
  const inside = mask.area(r.x0, r.y0, r.x1, r.y1);
  const fill = inside / (r.w * r.h);
  const visible = inside / mask.total;
  const t = r.h * 0.006, near = r.h * 0.04;
  const strip = (side, d) => {
    if (side === 0) return mask.area(r.x0, r.y0, r.x1, r.y0 + d) / (r.w * d);
    if (side === 1) return mask.area(r.x1 - d, r.y0, r.x1, r.y1) / (r.h * d);
    if (side === 2) return mask.area(r.x0, r.y1 - d, r.x1, r.y1) / (r.w * d);
    return mask.area(r.x0, r.y0, r.x0 + d, r.y1) / (r.h * d);
  };
  const edges = [0, 1, 2, 3].map((s) => (strip(s, t) > 0.02 ? "cut" : strip(s, near) > 0.004 ? "near" : "free"));
  return { fill, visible, edges, cut: edges.filter((e) => e === "cut").length, near: edges.filter((e) => e === "near").length };
}

export const EDGE_NAMES = ["上", "右", "下", "左"];

// 两个框之间插值：中心线性，高按对数走，缩放看着匀速
export const lerpCrop = (a, b, k) => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, h: Math.exp(Math.log(a.h) + (Math.log(b.h) - Math.log(a.h)) * k) });

export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// 两个框有多像：中心差按框高算，大小差按对数算
export const cropDistance = (a, b) => Math.hypot((a.cx - b.cx) / b.h, (a.cy - b.cy) / b.h) + Math.abs(Math.log(a.h / b.h)) * 1.4;
