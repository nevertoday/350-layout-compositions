// 正文里的小插图：地平线滑块、帆船的前方空间、打破规则、裁切练习、海报放大、进场动画。
import { reducedMotion } from "../../lib/stage.js";

const $ = (id) => document.getElementById(id);
const pct = (x) => `${Math.round(x * 100)}%`;
const onRadio = (name, fn) =>
  document.querySelectorAll(`input[name="${name}"]`).forEach((i) => i.addEventListener("change", () => i.checked && fn(i.value)));

// 地平线高度 → 感受。按从上到下排，取第一个 v 不超过上限的
const HORIZON_FEEL = [
  [0.26, "地平线贴近上沿：几乎全是水面。适合强调前景的纹理——波纹、沙痕、倒影里的细节。"],
  [0.4, "上三分线附近：水面占三分之二，重心下沉，画面厚重、有纵深。"],
  [0.6, "居中：天地各半，安静、对称。有倒影时很好；没有时，容易显得犹豫。"],
  [0.74, "下三分线附近：天空占三分之二，开阔、轻盈。天空里要有东西可看。"],
  [1, "地平线压到底：几乎全是天空。适合云、霞光，或干脆走极简。"],
];

function horizonFigure() {
  const range = $("hz-range");
  const world = $("hz-world");
  const update = () => {
    let v = range.value / 100;
    // 离三分线、中线不到 2% 时轻轻吸上去
    for (const s of [1 / 3, 1 / 2, 2 / 3]) if (Math.abs(v - s) < 0.02) v = s;
    world.setAttribute("transform", `translate(0 ${(v * 360).toFixed(1)})`);
    $("hz-sky").textContent = pct(v);
    $("hz-sea").textContent = pct(1 - v);
    $("hz-feel").textContent = HORIZON_FEEL.find(([max]) => v <= max)[1];
    range.setAttribute("aria-valuetext", `天空 ${pct(v)}，水面 ${pct(1 - v)}`);
  };
  range.addEventListener("input", update);
  update();
}

function boatFigure() {
  const boat = $("boat");
  const room = $("room");
  const flip = $("boat-flip");
  const fig = boat.closest("figure");
  let u = 1 / 3;
  let right = true;
  const update = () => {
    const x = u * 600;
    boat.style.transform = `translate(${x}px, 226.7px)`;
    fig.classList.toggle("facing-left", !right);
    room.setAttribute("x", right ? x : 0);
    room.setAttribute("width", right ? 600 - x : x);
    flip.textContent = right ? "船头朝右 →" : "← 船头朝左";
    flip.setAttribute("aria-pressed", String(!right));
    const ahead = right ? 1 - u : u;
    $("boat-room").textContent = `前方 ${pct(ahead)}`;
    $("boat-text").textContent =
      ahead > 0.6
        ? "船有地方可去，画面顺着它往前流。"
        : ahead > 0.4
          ? "前后各一半，船像停住了。"
          : "前方挤，身后空：船像正在驶出画面，或被什么追着。想要不安感时可以这样用，不然换到另一侧。";
  };
  onRadio("boat-pos", (v) => { u = Number(v); update(); });
  flip.addEventListener("click", () => { right = !right; update(); });
  update();
}

const BREAK_TEXT = {
  thirds: "按规则：太阳在右上交点，地平线在下三分线。可倒影被挤进底下一窄条，上下对称被打断了。",
  center: "打破规则：地平线居中，太阳在中轴上。上下互为倒影，正中反而最安静、最完整。",
  minimal: "极简：太阳很小，几乎贴着边，山也不要了。大片的空成了画面本身，这比三分法走得更远。",
};
function breakFigure() {
  const fig = $("break");
  onRadio("break-mode", (v) => {
    fig.dataset.mode = v;
    $("break-text").textContent = BREAK_TEXT[v];
  });
}

const CROPS = {
  A: { title: "A · 稳，但平", text: "帆船在正中，地平线也几乎在正中。什么都没错，也什么都没发生；太阳被切在右上角，像是不小心带进来的。" },
  B: { title: "B · 最好的一张", text: "帆船在左下交点，船头朝右，前方留出三分之二；太阳在右上交点，和帆船隔着对角线呼应；地平线落在下三分线，天空占三分之二。" },
  C: { title: "C · 撞上画框", text: "帆船贴着右边，船头又朝右——前面没有路，身后却空着一大片。" },
  D: { title: "D · 头重脚轻", text: "地平线挤到最上沿，帆被切掉了；下面一大片空水面，没有东西让这片空变得有意义。" },
};
function practice() {
  const buttons = [...document.querySelectorAll(".crop")];
  const wrap = buttons[0].parentElement;
  for (const b of buttons) {
    b.addEventListener("click", () => {
      const pick = b.dataset.crop;
      wrap.classList.add("answered");
      for (const o of buttons) {
        o.setAttribute("aria-pressed", String(o === b));
        o.classList.toggle("best", o.dataset.crop === "B");
      }
      $("v-title").textContent = pick === "B" ? `选对了。${CROPS.B.title}` : CROPS[pick].title;
      $("v-text").textContent = pick === "B" ? CROPS.B.text : `${CROPS[pick].text}对照 B：${CROPS.B.text}`;
      $("verdict").classList.toggle("right", pick === "B");
    });
  }
}

function posterZoom() {
  const fig = $("poster-fig");
  const btn = $("poster-btn");
  const set = (open) => {
    fig.classList.toggle("zoomed", open);
    document.documentElement.classList.toggle("noscroll", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "收起海报" : "放大海报");
    if (open) fig.scrollTop = 0;
  };
  btn.addEventListener("click", () => set(!fig.classList.contains("zoomed")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && fig.classList.contains("zoomed")) {
      set(false);
      btn.focus();
    }
  });
}

function reveals() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px 12% 0px" },
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

export function initFigures() {
  horizonFigure();
  boatFigure();
  breakFigure();
  practice();
  posterZoom();
  reveals();
}
