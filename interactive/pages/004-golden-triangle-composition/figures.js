// 05 应用、06 别用、07 练习的小图。每张都按 armature() 摆，骨架叠在上面。
import { armature, lerp, pathOf } from "./geo.js";
import { armatureMarkup, landscape, sunMarkup } from "./scene.js";

const f1 = (n) => n.toFixed(1);
const upper = (g) => (g.perps[0].foot[1] <= g.perps[1].foot[1] ? g.perps[0] : g.perps[1]);
const lower = (g) => (g.perps[0].foot[1] <= g.perps[1].foot[1] ? g.perps[1] : g.perps[0]);
const arm = (g, cls = "t-arm") => `<g class="${cls}">${armatureMarkup(g, { arrow: false })}</g>`;
// 在 4:3 的缩略图里放一个 w×h 的画框（居中），返回带 transform 的组
const inset = (w, h, body) => `<g transform="translate(${f1((400 - w) / 2)} ${f1((300 - h) / 2)})"><rect width="${w}" height="${h}" fill="#00238f"/>${body}</g>`;

const textLines = (x, y, widths, gap = 14, th = 6) => widths.map((w, i) => `<rect class="t-text" x="${f1(x)}" y="${f1(y + i * gap)}" width="${f1(w)}" height="${th}"/>`).join("");

const USES = {
  land() {
    const g = armature(400, 300, "rise");
    return landscape(g, { sun: upper(g).foot, sunR: 0.07, hiker: { at: lower(g).foot, face: 1 } }) + arm(g);
  },
  person() {
    const w = 210, h = 280, g = armature(w, h, "rise");
    const head = upper(g).foot, r = 22;
    const rail = `<path class="t-rail" d="${pathOf([lerp(g.A, g.C, -0.1), lerp(g.A, g.C, 1.1)], false)}"/>`;
    const body = `<path class="t-body2" d="M${f1(head[0] - 58)} ${h}C${f1(head[0] - 54)} ${f1(head[1] + 52)} ${f1(head[0] + 54)} ${f1(head[1] + 52)} ${f1(head[0] + 58)} ${h}Z"/><rect class="t-body2" x="${f1(head[0] - 9)}" y="${f1(head[1] + 14)}" width="18" height="${f1(r + 4)}"/><circle class="t-body" cx="${f1(head[0])}" cy="${f1(head[1])}" r="${r}"/>`;
    return inset(w, h, `<clipPath id="pc"><rect width="${w}" height="${h}"/></clipPath><g clip-path="url(#pc)">${rail}${body}</g>${arm(g)}`);
  },
  layout() {
    const g = armature(400, 300, "rise");
    const { foot } = upper(g);
    const s = landscape(g, { birds: false });
    const title = `<rect class="t-body" x="22" y="26" width="128" height="18"/><rect class="t-body" x="22" y="52" width="86" height="18"/>${textLines(22, 84, [120, 104, 112])}`;
    const badge = `<rect class="t-yel" x="${f1(foot[0] - 30)}" y="${f1(foot[1] - 15)}" width="60" height="30" rx="15"/>`;
    return s + title + arm(g) + badge;
  },
  product() {
    const g = armature(400, 300, "rise");
    const { foot } = upper(g);
    const a = Math.atan2(g.C[1] - g.A[1], g.C[0] - g.A[0]);
    const L = 190, T = 50;
    const base = lerp(foot, g.A, 0.62);
    const bottle = `<g transform="translate(${f1(base[0])} ${f1(base[1])}) rotate(${f1((a * 180) / Math.PI)})"><rect class="t-body" x="0" y="${-T / 2}" width="${L - 34}" height="${T}" rx="12"/><rect class="t-body" x="${L - 44}" y="-14" width="22" height="28"/><rect class="t-yel" x="${L - 26}" y="-16" width="30" height="32" rx="4"/><rect class="t-body2" x="34" y="-14" width="70" height="28"/></g>`;
    return bottle + textLines(232, 210, [130, 110, 120]) + arm(g);
  },
};

const AVOID = {
  square() {
    const g = armature(260, 260, "rise");
    const c = [130, 130];
    return inset(260, 260, `${arm(g)}<circle cx="${c[0]}" cy="${c[1]}" r="22" fill="none" stroke="#ff7a7a" stroke-width="3"/>`);
  },
  calm() {
    const g = armature(400, 300, "rise");
    const hz = 150;
    const peak = `<path class="t-body" d="M110 ${hz}L200 70L290 ${hz}Z"/><path class="t-body2" d="M200 70L290 ${hz}H200Z"/>`;
    const refl = `<g opacity="0.45"><path class="t-body" d="M110 ${hz}L200 230L290 ${hz}Z"/><path class="t-body2" d="M200 230L290 ${hz}H200Z"/></g>`;
    return `<rect x="0" y="${hz}" width="400" height="150" fill="#0a2fa3"/>${refl}${peak}${sunMarkup([200, 40], 14)}${arm(g, "t-arm t-forced")}`;
  },
  flat() {
    const g = armature(400, 300, "rise");
    return landscape(g, { ridge: false, horizon: 200, sun: upper(g).foot, sunR: 0.07 }) + arm(g, "t-arm t-forced");
  },
};

export function thumbs() {
  document.querySelectorAll("[data-use]").forEach((li) => {
    const svg = li.querySelector("svg");
    svg.setAttribute("viewBox", "0 0 400 300");
    svg.innerHTML = USES[li.dataset.use]();
  });
  document.querySelectorAll("[data-avoid]").forEach((li) => {
    const svg = li.querySelector("svg");
    svg.setAttribute("viewBox", "0 0 400 300");
    svg.innerHTML = AVOID[li.dataset.avoid]();
  });
}

// ---------- 07 练一练 ----------
const QUIZ = {
  center: {
    draw: (g) => landscape(g, { sun: [g.w / 2, g.h / 2], sunR: 0.08 }),
    verdict: "停在正中",
    why: "太阳落在斜线的正中间。它在线上，可两条垂线都不经过这里：眼睛沿山脊走到一半，没有东西接住，画面又回到居中的安静。",
  },
  flat: {
    draw: (g) => landscape(g, { ridge: false, horizon: g.h * 0.66, sun: upper(g).foot, sunR: 0.08 }),
    verdict: "骨架是空的",
    why: "太阳确实在垂足上，可画里没有斜线，地平线是平的。那几条线只是你画上去的，看的人看不见，也就感觉不到方向和张力。",
  },
  right: {
    draw: (g) => landscape(g, { sun: upper(g).foot, sunR: 0.08, hiker: { at: lower(g).foot, face: 1 } }),
    verdict: "就是它",
    why: "山脊就是主斜线，太阳在上方垂足，登山的人在下方垂足、朝着太阳走。一主一次，方向一致，眼睛从左下一路走到太阳停下。",
  },
  out: {
    draw: (g) => landscape(g, { sun: [g.w * 0.97, g.h * 0.06], sunR: 0.08 }),
    verdict: "冲出画框",
    why: "太阳被推到斜线尽头、贴着画框角。视线顺着山脊一路冲出画面，没有落点，太阳还被切掉了一块。",
  },
};

export function quiz() {
  const box = document.getElementById("quiz"), out = document.getElementById("quiz-out"), reset = document.getElementById("quiz-reset");
  const opts = [...box.querySelectorAll(".opt")];
  const g = armature(300, 200, "rise");
  opts.forEach((b) => {
    const q = QUIZ[b.dataset.q];
    const svg = b.querySelector("svg");
    svg.setAttribute("viewBox", "0 0 300 200");
    svg.innerHTML = `<rect width="300" height="200" fill="#00238f"/>${q.draw(g)}<g class="q-arm t-arm">${armatureMarkup(g, { arrow: false })}</g>`;
    b.querySelector(".verdict").textContent = q.verdict;
    b.classList.toggle("right", b.dataset.q === "right");
    b.setAttribute("aria-label", `选项 ${b.querySelector(".opt-l").textContent}`);
    b.addEventListener("click", () => {
      if (box.classList.contains("done")) return;
      box.classList.add("done");
      b.classList.add("picked");
      opts.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      const ok = b.dataset.q === "right";
      out.innerHTML = `<p class="q-lead">${ok ? "选对了。" : `你选了 ${b.querySelector(".opt-l").textContent}。最好的是 C。`}每张都画上了骨架：</p><ol class="q-list">${opts.map((o) => `<li class="${o.dataset.q === "right" ? "right" : ""}"><b>${o.querySelector(".opt-l").textContent}</b>${QUIZ[o.dataset.q].why}</li>`).join("")}</ol>`;
      reset.hidden = false;
    });
  });
  reset.addEventListener("click", () => {
    box.classList.remove("done");
    opts.forEach((o) => { o.classList.remove("picked"); o.removeAttribute("aria-pressed"); });
    out.innerHTML = `<p class="q-lead">先凭直觉选一张。</p>`;
    reset.hidden = true;
    opts[0].focus();
  });
}
