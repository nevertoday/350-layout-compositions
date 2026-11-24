// 01–08 各节的小图和交互。头都用 head2d.js 画，留白的算法都用 model.js。
import { reducedMotion } from "../../lib/stage.js";
import { C, placedHead } from "./head2d.js";
import { facingOf, goodZone, pct, room, verdict } from "./model.js";

const $ = (id) => document.getElementById(id);
const DEG = Math.PI / 180;
const f = (x) => +x.toFixed(2);
let gid = 0;

// 一块画框：米色底 + 目光前方的淡绿光晕。W×H 是 viewBox 尺寸，头的大小按画框高度算
function frame(W, H, { head, yaw, R, pitch = 0, glow = true, eye = 0 }) {
  const id = `g${++gid}`;
  const hx = head.u * W, hy = head.v * H, Rp = R * H;
  const dir = facingOf(yaw);
  const s = Math.abs(Math.sin(yaw));
  let out = `<rect width="${W}" height="${H}" fill="${C.paper}"/>`;
  if (glow && dir) {
    const edge = dir > 0 ? W : 0;
    const gx = hx + (edge - hx) * 0.62;
    out += `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${C.glow}" stop-opacity="${f(0.95 * s)}"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs>`;
    out += `<ellipse cx="${f(gx)}" cy="${f(hy)}" rx="${f(Math.abs(edge - hx) * 0.62 + Rp)}" ry="${f(H * 0.55)}" fill="url(#${id})"/>`;
  }
  out += placedHead(hx, hy, Rp, yaw, pitch, { eye });
  return out;
}
const svg = (W, H, inner, label) => `<svg viewBox="0 0 ${W} ${H}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${inner}</svg>`;

// 底边的尺寸线：脑后一段、前方一段
function bars(W, H, rm) {
  const y = H - 10;
  const seg = (a, b, cls, text) => {
    if (b - a < 2) return "";
    const t = b - a > 46 ? `<text x="${f((a + b) / 2)}" y="${y - 6}" text-anchor="middle" class="fig-lab ${cls}">${text}</text>` : "";
    return `<path class="${cls}" d="M${f(a)} ${y}H${f(b)}M${f(a)} ${y - 4}V${y + 4}M${f(b)} ${y - 4}V${y + 4}"/>${t}`;
  };
  const L = rm.left * W, Rr = rm.right * W;
  if (!rm.facing) return seg(0, L, "bar-back", pct(rm.left)) + seg(Rr, W, "bar-back", pct(1 - rm.right));
  const leadLeft = rm.facing < 0;
  return seg(0, L, leadLeft ? "bar-lead" : "bar-back", leadLeft ? `前方 ${pct(rm.lead)}` : `脑后 ${pct(rm.behind)}`) + seg(Rr, W, leadLeft ? "bar-back" : "bar-lead", leadLeft ? `脑后 ${pct(rm.behind)}` : `前方 ${pct(rm.lead)}`);
}

// ---------- 01 视线线索的小实验 ----------
function cue() {
  const face = $("cue-face");
  const boxes = [...document.querySelectorAll(".cue-box")];
  const msg = $("cue-msg");
  const start = $("cue-start");
  const keys = { "-1": $("cue-left"), 1: $("cue-right") };
  const drawFace = (look) => (face.innerHTML = svg(120, 150, placedHead(60, 62, 34, look * 0.42, 0, { eye: look * 1.1 })));
  drawFace(0);
  let trials = [], i = 0, phase = "idle", shownAt = 0, timer = 0;
  const res = { same: [], diff: [] };
  let errors = 0;
  const median = (a) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const show = () => {
    const ms = (v) => (v == null ? "—" : `${Math.round(v)} 毫秒`);
    $("cue-same").textContent = ms(median(res.same));
    $("cue-diff").textContent = ms(median(res.diff));
  };
  const setKeys = (on) => Object.values(keys).forEach((k) => (k.disabled = !on));
  const clear = () => boxes.forEach((b) => b.classList.remove("on"));
  const next = () => {
    clear();
    drawFace(0);
    if (i >= trials.length) return finish();
    phase = "wait";
    msg.textContent = `${i + 1} / ${trials.length}`;
    const t = trials[i];
    timer = setTimeout(() => {
      drawFace(t.look);
      timer = setTimeout(() => {
        boxes.find((b) => +b.dataset.side === t.target).classList.add("on");
        shownAt = performance.now();
        phase = "go";
      }, 300);
    }, 650 + Math.random() * 400);
  };
  const answer = (side) => {
    if (phase === "wait") {
      msg.textContent = "早了一点，× 还没出来。";
      return;
    }
    if (phase !== "go") return;
    const t = trials[i];
    const rt = performance.now() - shownAt;
    phase = "pause";
    if (side === t.target) (t.look === t.target ? res.same : res.diff).push(rt);
    else errors++;
    show();
    i++;
    clear();
    timer = setTimeout(next, 450);
  };
  const finish = () => {
    phase = "idle";
    setKeys(false);
    start.disabled = false;
    start.firstChild.textContent = "再来一轮 ";
    const a = median(res.same), b = median(res.diff);
    let t;
    if (a == null || b == null) t = "有一种情况没有记到有效的反应，再来一轮吧。";
    else if (a < b) t = `脸看向 × 那侧时，你快了 ${Math.round(b - a)} 毫秒：明知道它没用，眼睛还是被它带了一下。`;
    else t = "这一轮没看出差别，甚至反过来了。很正常：这个效应很小，实验室里要每人做很多轮、很多人平均才看得稳。";
    if (errors) t += `按错 ${errors} 次，没算进去。`;
    $("cue-read").textContent = t;
    msg.textContent = "做完了。";
    drawFace(0);
  };
  start.addEventListener("click", () => {
    clearTimeout(timer);
    trials = [];
    for (let k = 0; k < 16; k++) {
      const target = Math.random() < 0.5 ? -1 : 1;
      trials.push({ target, look: k % 2 ? target : -target });
    }
    trials.sort(() => Math.random() - 0.5);
    res.same = [];
    res.diff = [];
    errors = 0;
    i = 0;
    show();
    setKeys(true);
    start.disabled = true;
    $("cue-read").textContent = "看着中间的脸，× 出来就按。";
    next();
  });
  keys[-1].addEventListener("click", () => answer(-1));
  keys[1].addEventListener("click", () => answer(1));
  document.addEventListener("keydown", (e) => {
    // 只在焦点没落在别的控件上时接方向键，免得抢走滑块和把手的键盘操作
    if (phase === "idle" || e.repeat) return;
    if (e.target !== document.body && !e.target.closest("#cue-lab")) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      answer(e.key === "ArrowLeft" ? -1 : 1);
    }
  });
}

// ---------- 02 转头角度和舒适区 ----------
function roomLab() {
  const host = $("room-fig");
  const yawIn = $("room-yaw"), uIn = $("room-u");
  const W = 300, H = 200, R = 0.19;
  const r = { u: (R * H) / W, v: R };
  const draw = () => {
    const yaw = +yawIn.value * DEG, u = +uIn.value;
    const head = { u, v: 1 / 3 };
    const rm = room(head, yaw, r);
    const v = verdict(rm, head);
    const zone = goodZone(yaw, r);
    let inner = frame(W, H, { head, yaw, R });
    if (zone) inner += `<rect class="zone" x="${f(zone[0] * W)}" y="${H - 14}" width="${f((zone[1] - zone[0]) * W)}" height="14"/><text class="fig-lab zone-lab" x="${f(((zone[0] + zone[1]) / 2) * W)}" y="${H - 4}" text-anchor="middle">舒适区</text>`;
    inner += `<path class="center-mark" d="M${f(u * W - 5)} ${H - 20}L${f(u * W)} ${H - 14}L${f(u * W + 5)} ${H - 20}Z"/>`;
    inner += bars(W, H - 24, rm);
    host.innerHTML = svg(W, H, inner, `头在横向 ${pct(u)}，${v.tag}`);
    $("room-yaw-out").textContent = Math.abs(+yawIn.value) < 1 ? "0°" : `${+yawIn.value > 0 ? "右" : "左"} ${Math.abs(+yawIn.value)}°`;
    $("room-u-out").textContent = pct(u);
    $("room-tag").textContent = rm.facing ? `${v.tag} · 前方 ${pct(rm.lead)} · 脑后 ${pct(rm.behind)}` : v.tag;
    $("room-tag").dataset.kind = v.kind;
    let t = v.text;
    if (zone) t += ` 这个角度下，头放在 ${pct(zone[0])}–${pct(zone[1])} 之间都算舒适。`;
    $("room-text").textContent = t;
  };
  yawIn.addEventListener("input", draw);
  uIn.addEventListener("input", draw);
  draw();
}

// ---------- 03 广告：目光替你指路 ----------
const AD = {
  title: { yaw: 68, pitch: 0.12, text: "他看着标题，读者先看脸，再顺着他的目光滑到标题上，最后到按钮。人像和文字连成了一条路。" },
  camera: { yaw: 0, pitch: 0, text: "他看着镜头，读者先和他对视。正脸很抓人，眼睛却容易停在脸上，标题要靠字号和颜色自己去抢。" },
  away: { yaw: -70, pitch: 0.05, text: "他看向画外，读者的注意力也跟着出了画面。标题在他身后，像是被冷落的那一方。" },
};
function adLab() {
  const host = $("ad-fig");
  const W = 320, H = 180;
  const draw = (mode) => {
    const m = AD[mode];
    const yaw = m.yaw * DEG;
    const head = { u: 0.25, v: 0.42 };
    let s = frame(W, H, { head, yaw, R: 0.2, pitch: m.pitch });
    s += `<text class="ad-kicker" x="178" y="56">视线空间 · EYE ROOM</text><text class="ad-title" x="176" y="86">构图第一课</text><text class="ad-sub" x="178" y="104">让画面有呼吸</text><rect class="ad-btn" x="178" y="118" width="66" height="22" rx="11"/><text class="ad-btn-t" x="211" y="133" text-anchor="middle">开始学习</text>`;
    // 常见的读法（示意）：编号圈 + 虚线
    // 编号圈放在每样东西的左上角，虚线从眼睛出发
    const steps = mode === "title" ? [[44, 34], [166, 66], [170, 116]] : mode === "camera" ? [[44, 34]] : [[44, 34]];
    const eyeX = 80 + Math.sin(yaw) * 0.82 * 36, eyeY = 74;
    const paths = mode === "title" ? [`M${f(eyeX)} ${eyeY}L170 78`, "M211 92L211 113"] : mode === "away" ? [`M${f(eyeX)} ${eyeY}L4 66`] : [];
    for (const d of paths) s += `<path class="read-path" d="${d}" marker-end="url(#ad-arrow)"/>`;
    s += `<defs><marker id="ad-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="${C.olive}" stroke-width="1.6"/></marker></defs>`;
    steps.forEach((p, k) => {
      if (mode === "away" && k === 1) return;
      s += `<circle class="read-dot" cx="${p[0]}" cy="${p[1]}" r="7"/><text class="read-n" x="${p[0]}" y="${p[1] + 3}" text-anchor="middle">${k + 1}</text>`;
    });
    if (mode === "camera") s += `<text class="read-q" x="232" y="160" text-anchor="middle">然后呢？</text>`;
    s += `<text class="fig-note" x="${W - 6}" y="${H - 6}" text-anchor="end">示意，不是测量</text>`;
    host.innerHTML = svg(W, H, s, `课程封面示意：人像${mode === "title" ? "看向标题" : mode === "camera" ? "看镜头" : "看向画外"}`);
    $("ad-text").textContent = m.text;
    host.classList.toggle("animate", !reducedMotion.matches);
  };
  $("ad-mode").addEventListener("change", (e) => draw(e.target.value));
  draw("title");
}

// ---------- 04 对话：正反打 ----------
function talkLab() {
  const btn = $("talk-btn");
  const W = 200, H = 150;
  const draw = () => {
    const crossed = btn.getAttribute("aria-pressed") === "true";
    $("talk-a").innerHTML = svg(W, H, frame(W, H, { head: { u: 0.36, v: 0.42 }, yaw: 72 * DEG, R: 0.2 }), "镜头 A：人在左边，朝右看");
    $("talk-b").innerHTML = svg(W, H, frame(W, H, crossed ? { head: { u: 0.36, v: 0.42 }, yaw: 72 * DEG, R: 0.2 } : { head: { u: 0.64, v: 0.42 }, yaw: -72 * DEG, R: 0.2 }), crossed ? "镜头 B：人也在左边，朝右看" : "镜头 B：人在右边，朝左看");
    $("talk-text").textContent = crossed
      ? "机位跑到轴线另一边，B 也变成朝右看。两个镜头剪在一起，两人看向同一个方向，像在排队，不像在说话。"
      : "A 朝右、B 朝左，两人的视线空间朝着对方。来回切的时候，观众会觉得他们面对面在说话。";
    btn.firstChild.textContent = crossed ? "回到轴线这一侧 " : "机位越过轴线 ";
  };
  btn.addEventListener("click", () => {
    btn.setAttribute("aria-pressed", String(btn.getAttribute("aria-pressed") !== "true"));
    draw();
  });
  draw();
}

// ---------- 05 故意不留 ----------
const BREAK = {
  wall: { fig: { head: { u: 0.8, v: 0.4 }, yaw: 80, R: 0.26 }, title: "顶到框边：走投无路", text: "鼻尖贴着框边，目光一出去就撞墙。人物显得被困住、无路可走，看的人也跟着憋闷。适合压抑、焦虑、被逼到角落的时刻。" },
  back: { fig: { head: { u: 0.36, v: 0.36 }, yaw: -78, R: 0.2 }, title: "回头看：身后有事", text: "人在左边，却朝左看，大片空白留在他身后。看的人会觉得他在回望什么：过去的事、追来的人、刚刚离开的地方。" },
  behind: { fig: { head: { u: 0.84, v: 0.7 }, yaw: 76, R: 0.13 }, title: "身后一大片：不安", text: "人物缩在下角，前面没路，头顶和身后空出一大片。空白不再是呼吸，而是压迫，像有什么会从身后出现。《黑客军团》里常见这种画面。" },
};
function breakLab() {
  const btns = [...document.querySelectorAll(".break-btn")];
  const W = 200, H = 130;
  for (const b of btns) {
    const k = BREAK[b.dataset.k];
    b.querySelector(".bk-fig").innerHTML = svg(W, H, frame(W, H, { ...k.fig, yaw: k.fig.yaw * DEG, glow: false }));
  }
  const pick = (key) => {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === key)));
    $("bn-title").textContent = BREAK[key].title;
    $("bn-text").textContent = BREAK[key].text;
  };
  btns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.k)));
  pick("wall");
}

// ---------- 07 小练习 ----------
const QUIZ = {
  A: { head: { u: 0.74, v: 0.42 }, yaw: 70, title: [24, "left"], good: false, text: "A：人在右边、朝右看，目光直接出了画面，标题在他身后。读者看完脸，就被带走了。" },
  B: { head: { u: 0.26, v: 0.42 }, yaw: 68, title: [168, "left"], good: true, text: "B 最好：人在左边朝右看，前方留出一大片，标题正好在他目光落下的地方。脸是起点，标题是终点。" },
  C: { head: { u: 0.26, v: 0.42 }, yaw: 0, title: [168, "left"], good: false, text: "C：位置和 B 一样，只是他正脸看着镜头。不难看，但读者先和他对视，视线停在脸上，标题要靠自己去抢。" },
  D: { head: { u: 0.47, v: 0.42 }, yaw: 70, title: [206, "left"], good: false, text: "D：方向对了，可人往前挤，鼻尖快贴到标题上，前面没有空。目光指了路，路却太短，画面发闷。" },
};
function quiz() {
  const opts = [...document.querySelectorAll(".opt")];
  const W = 320, H = 180;
  for (const o of opts) {
    const q = QUIZ[o.dataset.k];
    const [x, anchor, y = 96] = q.title;
    const inner = frame(W, H, { head: q.head, yaw: q.yaw * DEG, R: 0.2, glow: false }) + `<text class="q-title" x="${x}" y="${y}" text-anchor="${anchor === "left" ? "start" : "middle"}">构图第一课</text>`;
    o.querySelector(".opt-fig").innerHTML = svg(W, H, inner);
  }
  for (const o of opts) {
    o.addEventListener("click", () => {
      const k = o.dataset.k;
      opts.forEach((x) => x.setAttribute("aria-pressed", String(x === o)));
      const q = QUIZ[k];
      $("verdict").hidden = false;
      $("verdict").dataset.good = String(q.good);
      $("v-title").textContent = q.good ? "选对了" : "再想想";
      $("v-text").textContent = q.good ? q.text : `${q.text}对照 B：${QUIZ.B.text}`;
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

// 标题前那只眼睛：平时看着「视线空间」四个字，鼠标动时看向鼠标
function titleEye() {
  const pupil = $("title-pupil");
  const svgEl = pupil.ownerSVGElement;
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = svgEl.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 200);
    pupil.setAttribute("cx", f(32 + (dx / d) * 14 * k));
    pupil.setAttribute("cy", f(20 + (dy / d) * 6 * k));
  });
}

function reveals() {
  if (reducedMotion.matches) return;
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
  cue();
  roomLab();
  adLab();
  talkLab();
  breakLab();
  quiz();
  posterZoom();
  titleEye();
  reveals();
}
