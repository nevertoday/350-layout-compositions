// 开场玩具：一张样张，空白总量不变，只改「组间 : 组内」的比例 r。
// 状态只有一个数：lr = ln(r)。间距、分组、读数都从它算出来。
import { loop } from "../../lib/stage.js";

const $ = (id) => document.getElementById(id);
const R_MIN = 0.4, R_MAX = 8, R_GOOD = 3.2;
const SPAN = Math.log(R_MAX / R_MIN);
const toU = (r) => Math.log(r / R_MIN) / SPAN;
const toR = (u) => R_MIN * Math.exp(u * SPAN);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// 样张里 9 块之间的 8 个空：i 组内，o 组间。空白总量固定为 TOTAL em。
const KINDS = ["i", "i", "o", "i", "o", "i", "o", "i"];
const N_I = KINDS.filter((k) => k === "i").length, N_O = KINDS.length - N_I;
const TOTAL = 7.6;
const BREAK = 1.3; // 一个空比最小的空宽出 30% 以上，眼睛就在这里断开（简化的接近模型）
export const gapsFor = (r) => { const i = TOTAL / (N_I + N_O * r); return { i, o: i * r }; };

const ZONES = [
  { max: 1 / BREAK, short: "读反", chip: "读反了", text: "组内反而比组间宽：每条的小标题离上一段更近，眼睛把它接到了上一条的尾巴上。虚线框是眼睛分出的组，全错开了。" },
  { max: BREAK, short: "一锅粥", chip: "一锅粥", text: "间距全都一样，眼睛找不到分界，只能从头一行一行往下读。哪句是标题、哪两句是一条，全靠字号在撑。" },
  { max: 2, short: "含糊", chip: "看得出，不干脆", text: "组间比组内宽了一点，仔细看分得出来，但要想一下。再拉开些，一眼就分开了。" },
  { max: 5, short: "分得清", chip: "分得清", text: "组内靠紧、组间拉开：一眼看去是一个标题、三条要点，标题那组先被读到。没加一根线、一个框，空白也没多，只是换了分法。" },
  { max: Infinity, short: "太挤", chip: "组内太挤", text: "组和组分得很开，可组内快贴上了：小标题和正文抢一口气，整块显得局促。组间不必无限大，组内也要留口气。" },
];
const zoneOf = (r) => ZONES.find((z) => r < z.max);

// 眼睛分出的组：在比最小的空宽出 BREAK 倍的地方断开。返回每块所在组的编号。
export function groupsFor(r) {
  const { i, o } = gapsFor(r);
  const g = KINDS.map((k) => (k === "i" ? i : o));
  const min = Math.min(...g);
  const ids = [0];
  g.forEach((v, k) => ids.push(ids[k] + (v > min * BREAK ? 1 : 0)));
  return ids;
}

export function initHero() {
  const spec = $("spec"), body = $("spec-body"), svg = $("halos");
  const blocks = [...body.querySelectorAll(".sp")];
  const track = $("ruler-track"), knob = $("knob"), ruler = $("ruler");
  const NS = "http://www.w3.org/2000/svg";
  // 虚线框：每种分法一层（layer），框的位置每帧照当前排版算，不滞后；分法变了，旧层淡出、新层淡入。
  let layers = [];
  const layerFor = (ids) => {
    const key = ids.join(",");
    let L = layers.find((l) => l.key === key);
    if (!L) {
      const n = ids[ids.length - 1] + 1;
      const g = document.createElementNS(NS, "g");
      g.setAttribute("opacity", "0");
      const rects = Array.from({ length: n }, () => { const el = document.createElementNS(NS, "rect"); el.setAttribute("rx", "8"); g.append(el); return el; });
      svg.append(g);
      L = { key, ids, g, rects, a: 0 };
      layers.push(L);
    }
    return L;
  };

  // 标尺上的分区和刻度
  let lo = 0;
  $("zones").innerHTML = ZONES.map((z, k) => {
    const hi = k === ZONES.length - 1 ? 1 : clamp(toU(z.max), 0, 1);
    const s = `<span class="zone z${k}" style="left:${(lo * 100).toFixed(2)}%;width:${((hi - lo) * 100).toFixed(2)}%"><b>${z.short}</b></span>`;
    lo = hi;
    return s;
  }).join("");
  $("ticks").innerHTML = [0.5, 1, 2, 4, 8].map((r) => `<span style="left:${(toU(r) * 100).toFixed(2)}%">${r}×</span>`).join("");

  let lr = 0;               // 当前显示的 ln(r)；开场从 r = 1（一锅粥）开始
  let target = Math.log(R_GOOD);
  let opening = true, dragging = false;
  let shownKey = "", lastLr = NaN;
  const showGroups = $("show-groups"), showGaps = $("show-gaps");

  function apply() {
    const r = Math.exp(lr);
    const { i, o } = gapsFor(r);
    body.style.setProperty("--gi", `${i.toFixed(3)}em`);
    body.style.setProperty("--go", `${o.toFixed(3)}em`);
    const u = toU(r);
    knob.style.left = `${(u * 100).toFixed(2)}%`;
    const z = zoneOf(r);
    const ids = groupsFor(r);
    const n = ids[ids.length - 1] + 1;
    const fs = parseFloat(getComputedStyle(body).fontSize);
    $("hero-ratio").textContent = `${r < 1 ? r.toFixed(2) : r.toFixed(1)}×`;
    $("hero-meta").textContent = `组内 ${Math.round(i * fs)}px · 组间 ${Math.round(o * fs)}px · 眼睛分出 ${n} 组`;
    knob.setAttribute("aria-valuenow", r.toFixed(2));
    knob.setAttribute("aria-valuetext", `组间是组内的 ${r.toFixed(1)} 倍：${z.chip}`);
    if (z.chip !== shownKey) {
      shownKey = z.chip;
      $("hero-chip").textContent = z.chip;
      $("hero-chip").dataset.zone = String(ZONES.indexOf(z));
      $("hero-text").textContent = z.text;
    }
    return ids;
  }

  function placeLayer(L) {
    const sr = spec.getBoundingClientRect(), br = body.getBoundingClientRect();
    const rects = blocks.map((b) => b.getBoundingClientRect());
    const fs = parseFloat(getComputedStyle(body).fontSize);
    const { i, o } = gapsFor(Math.exp(lr));
    const pad = clamp(Math.min(i, o) * fs * 0.45, 1.5, 7);
    L.rects.forEach((el, gi) => {
      const mine = rects.filter((_, j) => L.ids[j] === gi);
      const top = Math.min(...mine.map((r) => r.top)), bottom = Math.max(...mine.map((r) => r.bottom));
      el.setAttribute("x", (br.left - sr.left - 9).toFixed(1));
      el.setAttribute("y", (top - sr.top - pad).toFixed(1));
      el.setAttribute("width", (br.width + 18).toFixed(1));
      el.setAttribute("height", (bottom - top + pad * 2).toFixed(1));
    });
  }

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  const { draw } = loop(spec, (t, dt, { still }) => {
    if (opening) {
      if (still) { lr = target; opening = false; }
      else {
        const p = clamp((t - 0.2) / 1.6, 0, 1);
        lr = Math.log(R_GOOD) * ease(p);
        if (p >= 1) opening = false;
      }
    } else if (!dragging) {
      lr = still ? target : lr + (target - lr) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - lr) < 1e-4) lr = target;
    }
    const moved = lr !== lastLr;
    lastLr = lr;
    const ids = moved ? apply() : groupsFor(Math.exp(lr));
    const cur = layerFor(ids);
    const fading = layers.some((l) => l.a !== (l === cur ? 1 : 0));
    if (!moved && !fading) return; // 静止且淡入淡出都已完成：不写 DOM
    const k = still ? 1 : 1 - Math.exp(-dt * 10);
    for (const l of layers) {
      const goal = l === cur ? 1 : 0;
      l.a += (goal - l.a) * k;
      if (Math.abs(goal - l.a) < 0.01) l.a = goal;
      l.g.setAttribute("opacity", l.a.toFixed(3));
      if (l.a > 0) placeLayer(l);
    }
    for (const l of layers) if (l !== cur && l.a === 0) l.g.remove();
    layers = layers.filter((l) => l === cur || l.a > 0);
  });

  const set = (r, { animate = false } = {}) => {
    opening = false;
    target = Math.log(clamp(r, R_MIN, R_MAX));
    if (!animate) lr = target;
    draw();
  };

  // 拖标尺：横向拖动，竖向留给页面滚动；靠近 1× 和 3.2× 轻轻吸住
  const fromX = (x) => {
    const r = track.getBoundingClientRect();
    let u = clamp((x - r.left) / r.width, 0, 1);
    for (const snap of [1, R_GOOD]) if (Math.abs(u - toU(snap)) < 0.018) u = toU(snap);
    return toR(u);
  };
  ruler.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    dragging = true;
    ruler.setPointerCapture(e.pointerId);
    ruler.classList.add("dragging");
    set(fromX(e.clientX));
    if (e.pointerType === "mouse") { e.preventDefault(); knob.focus({ preventScroll: true }); }
  });
  ruler.addEventListener("pointermove", (e) => { if (dragging) set(fromX(e.clientX)); });
  const end = () => { dragging = false; ruler.classList.remove("dragging"); };
  ruler.addEventListener("pointerup", end);
  ruler.addEventListener("pointercancel", end);

  knob.addEventListener("keydown", (e) => {
    const u = toU(Math.exp(target));
    const step = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02, PageUp: 0.1, PageDown: -0.1 }[e.key];
    if (step != null) set(toR(clamp(u + step, 0, 1)));
    else if (e.key === "Home") set(R_MIN);
    else if (e.key === "End") set(R_MAX);
    else return;
    e.preventDefault();
  });

  document.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => set(+b.dataset.r, { animate: true })));
  const toggles = () => {
    spec.classList.toggle("no-groups", !showGroups.checked);
    spec.classList.toggle("no-gaps", !showGaps.checked);
  };
  showGroups.addEventListener("change", toggles);
  showGaps.addEventListener("change", toggles);
  toggles();
  // 尺寸变了（字体载入、转屏）框要跟着重算
  new ResizeObserver(() => { lastLr = NaN; draw(); }).observe(body);
  apply();
}
