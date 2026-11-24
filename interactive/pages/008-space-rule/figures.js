import { reducedMotion } from "../../lib/stage.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const f1 = (x) => (Math.round(x * 10) / 10).toString();
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const rect = (x, y, w, h, cls = "", extra = "") => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"${cls ? ` class="${cls}"` : ""}${extra}/>`;
function pressed(buttons, on) { buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === on))); }

// ---------- 01 宏观与微观 ----------
function macroMicro() {
  const svg = $("mm-svg");
  const C = { x0: 36, x1: 364, y0: 30, y1: 228 };
  const lines = [160, 154, 160, 148, 160, 156, 96];
  const ink = [
    rect(36, 30, 150, 16, "mm-ink"), rect(36, 52, 104, 16, "mm-ink"),
    ...lines.map((w, k) => rect(36, 92 + k * 12, w, 5, "mm-ink2")),
    rect(36, 200, 84, 28, "mm-btn", ' rx="4"'), rect(50, 211, 56, 6, "mm-btn-t"),
    rect(220, 30, 144, 160, "mm-img"),
    rect(220, 198, 120, 5, "mm-ink2"), rect(220, 209, 90, 5, "mm-ink2"),
  ].join("");
  const boat = `<g class="mm-boat" transform="translate(316 140)"><path d="M0 -26V-2H-10Z"/><path d="M2 -21V-2H9Z"/><path class="h" d="M-12 0H12L8 4H-8Z"/></g><path class="mm-hz" d="M220 128H364"/>`;
  const macro = [
    `<path fill-rule="evenodd" d="M0 0H400V290H0Z M${C.x0} ${C.y0}V${C.y1}H${C.x1}V${C.y0}Z"/>`,
    rect(196, 30, 24, 198), rect(36, 68, 160, 24), rect(36, 169, 160, 31),
  ].join("");
  const micro = [
    rect(36, 46, 150, 6),
    ...lines.slice(0, -1).map((w, k) => rect(36, 97 + k * 12, 160, 7)),
    `<path fill-rule="evenodd" d="M36 200h84v28h-84z M50 211v6h56v-6z"/>`,
    rect(220, 190, 144, 8), rect(220, 203, 120, 6),
  ].join("");
  const labels = {
    macro: `<g class="mm-lbl lbl-macro"><text x="200" y="20">边距</text><text x="208" y="250" transform="rotate(-90 208 250)" class="v">栏距</text><text x="116" y="84">块距</text><text x="116" y="189">块距</text></g>`,
    micro: `<g class="mm-lbl lbl-micro"><text x="170" y="51" class="sm">行距</text><text x="78" y="243" class="sm">内边距</text><text x="292" y="196" class="sm">图注</text></g>`,
  };
  svg.innerHTML = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="h-bg"/><path d="M0 0V6" class="h-ln"/></pattern></defs>
    <rect width="400" height="290" class="mm-paper"/>${ink}${boat}
    <g class="mm-macro">${macro}</g><g class="mm-micro">${micro}</g>${labels.macro}${labels.micro}`;
  const TEXT = {
    macro: "宏观留白：四周的边距、两栏之间、标题和正文之间、正文和按钮之间。它们把版面切成几块，先看哪块、后看哪块，由它们定。",
    micro: "微观留白：标题两行之间、正文每行之间、按钮里字的四周、图和图注之间。它们很小，却决定字读着顺不顺、按钮看着像不像能按。",
    both: "两层一起看：大的空把页面分成区块，小的空在区块里断句。大空要明显比小空大，层次才出得来，这就是第 03 节的「里小外大」。",
  };
  const buttons = [...document.querySelectorAll("[data-mm]")];
  const show = (m) => {
    svg.dataset.mode = m;
    $("mm-text").textContent = TEXT[m];
    pressed(buttons, buttons.find((b) => b.dataset.mm === m));
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.mm)));
  show("macro");
}

// ---------- 02 接近因素 ----------
function dots() {
  const svg = $("dots-svg"), range = $("dots-range"), color = $("dots-color");
  const COLS = 6, ROWS = 5;
  const els = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const el = document.createElementNS(NS, "circle");
    el.setAttribute("r", "6.5");
    el.dataset.col = String(c % 2);
    svg.append(el);
    els.push({ el, r, c });
  }
  const render = () => {
    const s = +range.value / 100;
    const hx = 30 * 2 ** (-0.75 * s), vy = 30 * 2 ** (0.75 * s);
    for (const { el, r, c } of els) {
      el.setAttribute("cx", f1(160 + (c - (COLS - 1) / 2) * hx));
      el.setAttribute("cy", f1(120 + (r - (ROWS - 1) / 2) * vy));
    }
    svg.classList.toggle("tinted", color.checked);
    $("dots-val").textContent = `左右 ${Math.round(hx)} · 上下 ${Math.round(vy)}`;
    let t;
    if (Math.abs(s) < 0.15) t = "横竖差不多远：读成一整块方阵，没有方向。" + (color.checked ? "这时颜色成了唯一的线索，一列一列分开了。" : "");
    else if (s > 0) t = `左右靠得近、上下离得远：看成 ${ROWS} 行。` + (color.checked ? "可颜色是一列一列换的，两种线索打架：先看到行，又被颜色拉回列。" : "");
    else t = `上下靠得近、左右离得远：看成 ${COLS} 列。` + (color.checked ? "颜色也按列换，两种线索指向同一边，分得最干脆。" : "");
    $("dots-text").textContent = t;
  };
  range.addEventListener("input", render);
  color.addEventListener("change", render);
  render();
}

// ---------- 03 里小外大 ----------
const SCALE = [0, 4, 8, 12, 16, 24, 32, 48];
function formDemo() {
  const fd = $("fd"), ri = $("fd-i"), ro = $("fd-o"), scale = $("scale");
  scale.innerHTML = SCALE.map((v) => `<span data-v="${v}"><i style="height:${Math.max(2, v)}px"></i><b>${v}</b></span>`).join("");
  const bars = [...scale.children];
  const render = () => {
    const i = SCALE[+ri.value], o = SCALE[+ro.value];
    fd.style.setProperty("--fi", `${i}px`);
    fd.style.setProperty("--fo", `${o}px`);
    $("fd-i-val").textContent = String(i);
    $("fd-o-val").textContent = String(o);
    bars.forEach((b) => { const v = +b.dataset.v; b.classList.toggle("is-i", v === i); b.classList.toggle("is-o", v === o); });
    let t, ok = false;
    if (o === 0 && i === 0) t = "全贴在一起了：标签、框、下一项挤成一条，分不出谁是谁。";
    else if (i > o) t = "反了：标签离上面那个框更近，看着像上一项的说明。填的人很可能对着错的框填。";
    else if (i === o) t = "标签在两个框正中间：是上面那格的，还是下面那格的？看的人得猜。";
    else if (o < i * 2) t = "分得开，但不干脆：标签确实离自己的框近一些，可差得不多，扫一眼还是会犹豫。";
    else if (i === 0) t = "组分清了，可标签贴死在框上，太挤。组内留 4 到 8 就够。";
    else { t = `清楚：标签贴着自己的框（${i}），一项和一项之间空出一截（${o}），是组内的 ${(o / i).toFixed(o % i ? 1 : 0)} 倍。不用框、不用线，三项一眼分开。`; ok = true; }
    $("fd-text").textContent = t;
    $("fd-text").dataset.kind = ok ? "on" : "off";
  };
  ri.addEventListener("input", render);
  ro.addEventListener("input", render);
  render();
}

// ---------- 04 行长与行距 ----------
function measureDemo() {
  const box = $("measure"), frame = $("measure-frame"), rn = $("ms-n"), rl = $("ms-l"), rp = $("ms-p");
  const fit = () => {
    // 字号最小缩到 9px，好让窄屏也能排出长行
    const cs = getComputedStyle(frame);
    const inner = frame.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const max = clamp(Math.floor(inner / 9), 8, 60);
    if (+rn.max !== max) { rn.max = String(max); render(); }
  };
  const render = () => {
    const n = Math.min(+rn.value, +rn.max), lh = +rl.value, p = +rp.value;
    box.style.setProperty("--n", String(n));
    box.style.setProperty("--lh", String(lh));
    box.style.setProperty("--pg", `${(p * lh).toFixed(3)}em`);
    $("ms-n-val").textContent = String(n);
    $("ms-l-val").textContent = lh.toFixed(2);
    $("ms-p-val").textContent = `${+p.toFixed(2)} 行`;
    const a = n <= 13 ? `每行 ${n} 字：太碎了，一个意思没读完就换行，眼睛老在折返。`
      : n <= 21 ? `每行 ${n} 字：偏短，窄栏、手机、图注可以，长文这样排读着累。`
      : n <= 40 ? `每行 ${n} 字：舒服，一眼扫得完一行，换行也找得到下一行开头。`
      : n <= 50 ? `每行 ${n} 字：偏长，读到行尾回头找下一行要费点劲。`
      : `每行 ${n} 字：太长，回头找下一行时很容易串行。`;
    const b = lh < 1.3 ? "行距太小：上下行快贴上了，字挤成一片。"
      : lh < 1.55 ? "行距偏紧：短行还行，长行会累。"
      : lh <= 2.05 ? "行距舒服。"
      : "行距太松：行和行像各说各的，读着断断续续。";
    const c = n > 36 && lh < 1.7 ? "行长了，行距要跟着放松，试试 1.7 以上。" : "";
    const d = p < 0.25 ? "段距几乎为零：两段粘成一块，看不出哪里换了段。"
      : p <= 1.25 ? "段距比行距大一截：一眼看得出是两段。"
      : "段距太大：两段像两件不相干的事，正文里半行到一行就够。";
    const e = parseFloat(getComputedStyle(box).fontSize) < 14.5 ? "（框不够宽，字缩小了，好排出这么长的行。）" : "";
    $("ms-text").textContent = [a + e, b, c, d].filter(Boolean).join(" ");
  };
  [rn, rl, rp].forEach((r) => r.addEventListener("input", render));
  new ResizeObserver(fit).observe(frame);
  render();
  // 这一页自己的正文：最宽每行几个字、行距多少
  const sample = document.querySelector(".prose p");
  if (sample) {
    const cs = getComputedStyle(sample);
    const chars = Math.round(parseFloat(getComputedStyle(sample.parentElement).maxWidth) / parseFloat(cs.fontSize));
    const lh = parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
    if (chars > 0) $("self-note").textContent = `顺带一提：这一页的正文最宽每行约 ${chars} 字，行距 ${lh.toFixed(2)}，段距约半行。窄屏上每行字数会少一些。`;
  }
}

// ---------- 05 只给它空间 ----------
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seaDemo() {
  const svg = $("sea-svg"), range = $("sea-range"), mark = $("sea-mark");
  const P = { x: 318, y: 214 };
  const rnd = mulberry(8);
  const boats = [];
  for (let tries = 0; boats.length < 22 && tries < 4000; tries++) {
    const b = { x: 18 + rnd() * 444, y: 162 + rnd() * 118 };
    const near = (q) => Math.hypot(q.x - b.x, (q.y - b.y) * 1.6) < 34;
    if (near(P) || boats.some(near)) continue;
    boats.push(b);
  }
  const boatG = `<path class="sail" d="M0 -24V-3H-10Z"/><path class="sail" d="M2 -19V-3H8Z"/><path class="mast" d="M1 -26V0"/><path class="hull" d="M-12 -1H12L8 3H-8Z"/><path class="refl" d="M-7 5H7M-4 8H5M-2 11H3"/>`;
  svg.innerHTML = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s0"/><stop offset="1" class="s1"/></linearGradient><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="w0"/><stop offset="1" class="w1"/></linearGradient><g id="boat">${boatG}</g></defs>
    <rect width="480" height="150" fill="url(#sky)"/><rect y="150" width="480" height="150" fill="url(#sea)"/><path class="hz" d="M0 150.5H480"/>
    <g id="fleet"></g><g class="hero-boat" transform="translate(${P.x} ${P.y})"><use href="#boat"/></g>
    <g class="mark" transform="translate(${P.x} ${P.y - 10})"><circle r="24"/><text y="-31">主角</text></g>`;
  const fleet = svg.querySelector("#fleet");
  const uses = boats.map(() => { const u = document.createElementNS(NS, "use"); u.setAttribute("href", "#boat"); fleet.append(u); return u; });
  const render = () => {
    const s = +range.value / 100, R = s * 720;
    let nearest = Infinity, inside = 0;
    boats.forEach((b, k) => {
      // 往外推，方向偏横（船只能在海面上走），推到离主角 R 为止
      const dx = b.x - P.x, dy = (b.y - P.y) * 1.6, d = Math.hypot(dx, dy);
      const vx = dx + (dx >= 0 ? 40 : -40), vl = Math.hypot(vx, dy), push = Math.max(0, R - d);
      const x = b.x + (vx / vl) * push, y = clamp(b.y + ((dy / vl) * push) / 1.6, 156, 296);
      uses[k].style.transform = `translate(${f1(x)}px, ${f1(y)}px)`;
      if (x > -14 && x < 494) { inside++; nearest = Math.min(nearest, Math.hypot(x - P.x, y - P.y)); }
    });
    svg.classList.toggle("marked", mark.checked);
    $("sea-val").textContent = String(+range.value);
    const lens = nearest / 24;
    let t;
    if (inside === 0) t = "整片海只剩它一条：船还是那么小，可整个画面都在托着它。海报那张图就是这样。";
    else if (lens < 1.8) t = "哪条是主角？二十多条一模一样，眼睛找不到起点，只看到一片船。" + (mark.checked ? "" : "勾上「标出主角」看看它在哪。");
    else if (lens < 4.5) t = `离它最近的船隔着约 ${lens.toFixed(1)} 个船身。四周空出一小圈，它开始能被单独看见，但还是一群里的一个。`;
    else t = `离它最近的船隔着约 ${lens.toFixed(0)} 个船身，画面里还剩 ${inside} 条别的船。它四周空出一大片，成了最先被看见的那条，别的船退到边上，像观众。`;
    $("sea-text").textContent = t;
  };
  range.addEventListener("input", render);
  mark.addEventListener("change", render);
  render();
}

// ---------- 06 密与疏 ----------
function densityDemo() {
  const card = $("card"), range = $("air");
  const parts = [card.querySelector(".card-img svg"), card.querySelector(".card-t"), ...card.querySelectorAll(".card-tags span"), card.querySelector(".card-d"), card.querySelector(".card-p"), card.querySelector(".card-b")];
  const area = (el) => {
    let r;
    if (el.matches("p:not(.card-b)")) { const rg = document.createRange(); rg.selectNodeContents(el); r = rg.getBoundingClientRect(); }
    else r = el.getBoundingClientRect();
    return r.width * r.height;
  };
  let pending = 0;
  const measure = () => {
    pending = 0;
    const cr = card.getBoundingClientRect();
    if (!cr.width) return;
    const used = parts.reduce((s, el) => s + area(el), 0);
    const pct = clamp(Math.round((1 - used / (cr.width * cr.height)) * 100), 0, 100);
    const a = +range.value / 100;
    const v = a < 0.2 ? "像大促传单：字大、色重、挤满，每样都在喊，反而没有一样特别重要。清仓、秒杀可以这样排。"
      : a < 0.5 ? "日常电商的样子：信息清楚，不算挤，也说不上讲究。"
      : a < 0.85 ? "像画册：杯子小了，四周空出来，它成了主角，价格也不再吆喝。同一只杯子，看着像能卖得更贵。"
      : "空过头了：字小到要凑近看，按钮快找不到了。留白是给主角搭台，不是把主角挤下台。";
    $("air-text").textContent = `按元素外框量，空白约占 ${pct}%。${v}`;
  };
  const render = () => {
    card.style.setProperty("--air", String(+range.value / 100));
    $("air-val").textContent = range.value;
    if (!pending) pending = requestAnimationFrame(measure);
  };
  range.addEventListener("input", render);
  new ResizeObserver(() => { if (!pending) pending = requestAnimationFrame(measure); }).observe(card);
  render();
}

// ---------- 08 小练习 ----------
function quiz() {
  // 内容：标题组、时间地点组、三位讲者、报名。每块 [宽, 高, 类]
  const GROUPS = [
    [[0, 13, "title"], [64, 3, "sub"]],
    [[58, 3, ""], [46, 3, ""]],
    [[30, 4, "name"], [56, 3, ""]],
    [[26, 4, "name"], [60, 3, ""]],
    [[34, 4, "name"], [50, 3, ""]],
    [[44, 5, "cta"]],
  ];
  const stack = (gi, go) => {
    let y = 16, out = "";
    GROUPS.forEach((g, k) => {
      if (k) y += go;
      g.forEach(([w, h, cls], j) => {
        if (j) y += gi;
        out += cls === "title" ? `<text x="14" y="${f1(y + h - 1)}" class="q-title">讲座</text>` : rect(14, y, w, h, cls ? `q-${cls}` : "q-bar");
        y += h;
      });
    });
    return out;
  };
  const scattered = () => {
    const at = [[14, 16], [66, 18], [60, 66], [10, 92], [72, 122], [18, 136]];
    return GROUPS.map((g, k) => {
      let [x, y] = at[k], out = "";
      g.forEach(([w, h, cls], j) => {
        if (j) y += 4;
        const ww = Math.min(w, 106 - x);
        out += cls === "title" ? `<text x="${x}" y="${f1(y + h - 1)}" class="q-title">讲座</text>` : rect(x, y, ww, h, cls ? `q-${cls}` : "q-bar");
        y += h;
      });
      return out;
    }).join("");
  };
  const POSTERS = {
    a: { svg: stack(8.5, 8.5), text: "A 每个空都一样宽：空白一点不少，可分不出哪两行是同一位讲者，只能一行一行数。" },
    b: { svg: stack(3, 14), best: true, text: "B 最好。标题和副标题靠紧，时间地点靠紧，每位讲者的名字和头衔靠紧，组和组之间空出一截。空白和 A 一样多，一眼就是六块。" },
    c: { svg: stack(14, 3), text: "C 分法反了：头衔离下一位讲者的名字更近，看着像下一个人的介绍。空白和 B 一样多，却把人读错了。" },
    d: { svg: scattered(), text: "D 东西散在各个角上，空白被切成好几块夹在中间，哪块也连不成片。看着空，却不干净，眼睛不知道从哪开始。" },
  };
  for (const [k, p] of Object.entries(POSTERS)) $(`q-${k}`).innerHTML = `<rect width="120" height="160" class="q-bg"/>${p.svg}`;
  const picks = [...document.querySelectorAll("[data-pick]")], out = $("quiz-text");
  picks.forEach((b) => b.addEventListener("click", () => {
    const p = POSTERS[b.dataset.pick];
    picks.forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.classList.toggle("right", x === b && !!p.best); x.classList.toggle("wrong", x === b && !p.best); });
    out.textContent = p.text;
    out.dataset.kind = p.best ? "on" : "off";
  }));
}

// ---------- 09 原海报 ----------
function posterViewer() {
  const dlg = $("viewer"), img = $("viewer-img"), scroll = $("viewer-scroll"), poster = $("poster");
  const levels = [1, 1.5, 2, 3];
  let z = 0;
  const apply = () => {
    const base = Math.min(scroll.clientWidth, (scroll.clientHeight * 1086) / 1448);
    img.style.width = `${Math.round(base * levels[z])}px`;
    $("zoom-val").textContent = `${levels[z] * 100}%`;
    $("zoom-out").disabled = z === 0;
    $("zoom-in").disabled = z === levels.length - 1;
  };
  $("poster-open").addEventListener("click", () => {
    if (!img.src) img.src = poster.currentSrc || poster.src;
    z = 0;
    dlg.showModal();
    apply();
    scroll.focus();
  });
  $("zoom-in").addEventListener("click", () => { z = Math.min(levels.length - 1, z + 1); apply(); });
  $("zoom-out").addEventListener("click", () => { z = Math.max(0, z - 1); apply(); });
  $("viewer-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  let pan = null;
  scroll.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { pan = { x: e.clientX, y: e.clientY, l: scroll.scrollLeft, t: scroll.scrollTop }; scroll.setPointerCapture(e.pointerId); scroll.classList.add("panning"); } });
  scroll.addEventListener("pointermove", (e) => { if (pan) { scroll.scrollLeft = pan.l - (e.clientX - pan.x); scroll.scrollTop = pan.t - (e.clientY - pan.y); } });
  const stop = () => { pan = null; scroll.classList.remove("panning"); };
  scroll.addEventListener("pointerup", stop);
  scroll.addEventListener("pointercancel", stop);
  addEventListener("resize", () => { if (dlg.open) apply(); });
}

function reveals() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px 10% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

export function initFigures() {
  macroMicro();
  dots();
  formDemo();
  measureDemo();
  seaDemo();
  densityDemo();
  quiz();
  posterViewer();
  reveals();
}
