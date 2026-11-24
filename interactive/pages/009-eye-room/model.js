// 视线空间的全部算法。状态只存画框里的比例坐标：u 从左到右、v 从上到下，都是 0..1。
//   head：头的中心（眼睛那一高度）；look：他在看的那个点；shot：景别。
// 三维和 SVG 两种画法、开场和各节的小图都只读这里算出来的东西。

export const SHOTS = {
  close: { k: 0.27, label: "特写", en: "Close-up" },
  medium: { k: 0.19, label: "近景", en: "Medium" },
  wide: { k: 0.12, label: "中景", en: "Wide" },
};

// 头的轮廓在水平方向伸出去多少（以头的半径为单位）：s 是转头的侧向分量 |sin yaw|。
// 正脸时左右各 0.88；转成侧脸，鼻尖伸到 1.2，后脑勺到 1.0。三维头和 SVG 头都按这个尺寸画。
export const FRONT_REACH = (s) => 0.88 + 0.32 * s;
export const BACK_REACH = (s) => 0.88 + 0.12 * s;

const DEG = 180 / Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const pct = (x) => `${Math.round(x * 100)}%`;

// 头的半径：按画框短边算，横竖画幅都一样大
export const radius = (shot, aspect) => {
  const k = SHOTS[shot].k * Math.min(aspect, 1);
  return { u: k / aspect, v: k };
};

const MAX_YAW = 80 / DEG;
const MAX_PITCH = 32 / DEG;
// 他看的点在画框平面前方 1.3 个头半径处：点就在脸前面时是正脸，点离得越远越侧
export function gaze(head, look, r, aspect) {
  const dx = (look.u - head.u) * aspect;
  const dy = look.v - head.v;
  const depth = 1.3 * r.v;
  const yaw = clamp(Math.atan2(dx, depth), -MAX_YAW, MAX_YAW);
  const pitch = clamp(Math.atan2(-dy, Math.hypot(dx, depth)), -MAX_PITCH, MAX_PITCH);
  return { yaw, pitch };
}

export const FRONT_YAW = 20 / DEG;
export const facingOf = (yaw) => (Math.abs(yaw) < FRONT_YAW ? 0 : Math.sign(yaw));

// 头的左右边缘、前方和脑后各剩多少（画框宽度的比例）
export function room(head, yaw, r) {
  const s = Math.abs(Math.sin(yaw));
  const facing = facingOf(yaw);
  const dir = facing || 1;
  const front = head.u + dir * r.u * FRONT_REACH(s);
  const back = head.u - dir * r.u * BACK_REACH(s);
  const left = Math.min(front, back);
  const right = Math.max(front, back);
  const toEdge = (x, d) => (d > 0 ? 1 - x : x);
  const lead = Math.max(0, toEdge(front, dir));
  const behind = Math.max(0, toEdge(back, -dir));
  return { facing, left, right, lead, behind, front, back, share: lead + behind > 0 ? lead / (lead + behind) : 0.5 };
}

// 舒适不舒适：只看两件事，前面空出来的占全部空白的多少、鼻尖离框边还有多远
export function verdict(rm, head) {
  if (rm.facing === 0) {
    const off = head.u - 0.5;
    if (Math.abs(off) < 0.07) return { kind: "front", tag: "正面 · 居中", text: "正对镜头，没有朝向，左右对称地留就好。眼睛会先停在脸上，和读者对视。" };
    return { kind: "front-off", tag: "正面 · 偏了", text: `正对镜头却偏在${off < 0 ? "左" : "右"}边：他不看那片空，空出来的地方没有理由，画面像是放歪了。要么放回中间，要么让他转过去。` };
  }
  if (rm.lead < 0.05) return { kind: "wall", tag: "顶到框边", text: "鼻尖快贴到框边，像面壁：目光一出去就撞上画框，看的人也跟着发闷。除非你想要这种压迫感。" };
  if (rm.share < 0.42) return { kind: "short", tag: "前窄后宽", text: "脑后空得多，眼前反而挤。视线顺着他的方向走，没两步就出了画框，后面那一大片又没人看。" };
  if (rm.share < 0.58) return { kind: "even", tag: "前后差不多", text: "前后差不多一样宽：不难看，但目光那一侧显得紧，像话说到一半。再往后退一点。" };
  if (rm.behind < 0.02) return { kind: "cut", tag: "后脑勺贴边", text: "前面够宽了，后脑勺却贴住了框边，人像被挤在角落。脑后留一条窄边，就松下来了。" };
  return { kind: "good", tag: "目光有去处", text: "前面留得多、脑后留得少：目光有地方落，看的人顺着他的视线走进那片空白，画面松弛、有呼吸。" };
}

// 一句补充：转头多少、看出画外、抬头低头、眼睛在不在上三分线
export function notes(state, g, rm) {
  const out = [];
  const s = Math.abs(Math.sin(g.yaw));
  if (rm.facing !== 0) out.push(s > 0.9 ? "全侧脸：方向最明确，前方要留得最多。" : "四分之三侧脸：方向没有全侧那么强，前方也可以少留一些。");
  if (state.look.u < 0 || state.look.u > 1) out.push("他看的东西在画框外面：看的人会想知道那里有什么。");
  if (g.pitch > 0.26) out.push("他在抬头看，上方也要留出空间，别让头顶贴着上边。");
  if (g.pitch < -0.26) out.push("他在低头，视线落到下方，下面那片要能接住它。");
  if (Math.abs(state.head.v - 1 / 3) < 0.03) out.push("眼睛正好在上三分线上。");
  return out.join("");
}

export function describe(state, aspect) {
  const r = radius(state.shot, aspect);
  const g = gaze(state.head, state.look, r, aspect);
  const rm = room(state.head, g.yaw, r);
  return { r, ...g, room: rm, verdict: verdict(rm, state.head), note: notes(state, g, rm) };
}

export const facingLabel = (yaw) => {
  const f = facingOf(yaw);
  if (!f) return "看镜头";
  return `${f > 0 ? "向右" : "向左"} ${Math.round(Math.abs(yaw) * DEG)}°`;
};

// 头放在哪里：留在画框里，靠近三分线交点时吸住
const THIRDS = [1 / 3, 2 / 3];
export const HEAD_SNAP = 0.035;
export function placeHead(p, r) {
  let u = clamp(p.u, r.u * 0.9, 1 - r.u * 0.9);
  let v = clamp(p.v, 0.18, 0.72);
  for (const x of THIRDS) if (Math.abs(u - x) < HEAD_SNAP) u = x;
  if (Math.abs(v - 1 / 3) < HEAD_SNAP) v = 1 / 3;
  return { u, v };
}
export const placeLook = (p) => ({ u: clamp(p.u, -0.15, 1.15), v: clamp(p.v, -0.1, 1.1) });

// 某个转头角度下，头放在哪一段算「目光有去处」：给第 02 节画舒适区用
export function goodZone(yaw, r) {
  const xs = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const rm = room({ u, v: 0.4 }, yaw, r);
    if (verdict(rm, { u }).kind === (rm.facing ? "good" : "front")) xs.push(u);
  }
  return xs.length ? [xs[0], xs.at(-1)] : null;
}

export const PRESETS = {
  classic: { label: "留足前方", head: { u: 1 / 3, v: 1 / 3 }, look: { u: 0.9, v: 0.36 } },
  wall: { label: "顶到框边", head: { u: 0.82, v: 1 / 3 }, look: { u: 1.08, v: 0.36 } },
  camera: { label: "看镜头", head: { u: 0.5, v: 0.38 }, look: { u: 0.5, v: 0.38 } },
  back: { label: "回头看", head: { u: 1 / 3, v: 1 / 3 }, look: { u: -0.1, v: 0.38 } },
};
