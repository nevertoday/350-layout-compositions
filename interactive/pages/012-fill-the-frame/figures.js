// 01–08 节的小玩具。
import { pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, makeMask, rectOf } from "./model.js";
import { BODY_ZONES, C, RING, drawLemon, drawRingWorld, paintRingMask, zoneAt } from "./worlds.js";
import { PRESETS } from "./hero.js";

const $ = (id) => document.getElementById(id);
const pct = (v) => `${Math.round(v * 100)}%`;
const setChip = (el, text, kind) => { el.textContent = text; el.dataset.kind = kind; };
const sizeCanvas = (c) => {
  const r = c.getBoundingClientRect(), pr = pixelRatio();
  const w = Math.max(1, Math.round(r.width * pr)), h = Math.max(1, Math.round(r.height * pr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
};
const pressGroup = (btns, on) => btns.forEach((b) => b.setAttribute("aria-pressed", String(on(b))));

// ---------- 01 退后 / 走近 ----------
function points() {
  const box = $("points"), far = $("step-far"), near = $("step-near");
  const set = (isFar) => {
    box.classList.toggle("far", isFar);
    far.setAttribute("aria-pressed", String(isFar));
    near.setAttribute("aria-pressed", String(!isFar));
  };
  far.addEventListener("click", () => set(true));
  near.addEventListener("click", () => set(false));
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  // 第一次滚到这里：先退后，再走近一次，让人看见「走近」这个动作
  set(true);
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    setTimeout(() => set(false), 700);
  }, { threshold: 0.35 });
  io.observe(box);
}

// ---------- 02 边上的力 ----------
const EDGE = { W: 400, H: 300, r: 96, cy: 150, x0: 200, x1: 470 };
const EDGE_ZONES = [
  { until: 0.06, chip: "有余地", kind: "space", text: (g) => `离边还有 ${pct(g)} 的画宽。环安安稳稳待在框里，边只是边。` },
  { until: 0.015, chip: "挤着边", kind: "warn", text: () => "没碰到，可缝窄得像一条线。眼睛会一直去看这条缝，而不是看环。" },
  { until: -0.015, chip: "将贴未贴", kind: "bad", text: () => "差一线，或者只压过去一丝：分不清是故意的还是没对准。最别扭的位置。" },
  { until: -0.12, chip: "压了一点", kind: "warn", text: (g) => `切进去 ${pct(-g)} 的画宽，还是像没对准。再推一点，让这一刀看得出是故意的。` },
  { until: -Infinity, chip: "切出去", kind: "good", text: () => "明明白白切进去一截。框外那一块，眼睛会自己补上，画面往外延伸，像装不下它。" },
];
function edgeDemo() {
  const svg = $("edge-svg"), disc = $("edge-disc"), ghost = $("edge-ghost"), gap = $("edge-gap"), range = $("edge-range");
  const zonesEl = $("edge-zones");
  const gapOf = (cx) => (EDGE.W - (cx + EDGE.r)) / EDGE.W;
  const cxOf = (v) => EDGE.x0 + (v / 1000) * (EDGE.x1 - EDGE.x0);
  const vOf = (cx) => ((cx - EDGE.x0) / (EDGE.x1 - EDGE.x0)) * 1000;
  // 轨道下的分区条：位置由每个分区的边界换算
  const bounds = [0];
  for (const z of EDGE_ZONES.slice(0, -1)) bounds.push(clamp(vOf(EDGE.W - EDGE.r - z.until * EDGE.W), 0, 1000));
  bounds.push(vOf(EDGE.W), 1000);
  const labels = [...EDGE_ZONES.map((z) => z.chip), "大半在外"];
  zonesEl.innerHTML = labels.map((l, i) => { const w = bounds[i + 1] - bounds[i]; return `<li style="flex:${w.toFixed(1)}"><span>${w > 90 ? l : ""}</span></li>`; }).join("");
  const lis = [...zonesEl.children];

  const update = () => {
    const cx = cxOf(+range.value), g = gapOf(cx);
    disc.setAttribute("transform", `translate(${cx.toFixed(1)} ${EDGE.cy})`);
    ghost.setAttribute("transform", `translate(${cx.toFixed(1)} ${EDGE.cy})`);
    ghost.classList.toggle("on", g < 0);
    const right = cx + EDGE.r;
    gap.setAttribute("x1", Math.min(right, EDGE.W).toFixed(1));
    gap.setAttribute("x2", EDGE.W);
    gap.classList.toggle("on", g > 0.004);
    let i = EDGE_ZONES.findIndex((z) => g > z.until);
    let chip, kind, text;
    if (cx > EDGE.W) {
      i = labels.length - 1;
      [chip, kind, text] = ["大半在外", "good", "圆心都出了框，只剩一道弧。它不再是「一个环」，而是切进画面的一道形状，就像海报右边那只环。"];
    } else {
      const z = EDGE_ZONES[i];
      [chip, kind, text] = [z.chip, z.kind, z.text(g)];
    }
    setChip($("edge-chip"), chip, kind);
    $("edge-text").textContent = text;
    lis.forEach((li, k) => li.classList.toggle("on", k === i));
  };
  range.addEventListener("input", update);
  // 在画上横着拖环
  let drag = null;
  const toX = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).x; };
  svg.addEventListener("pointerdown", (e) => { drag = { dx: cxOf(+range.value) - toX(e) }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", (e) => { if (!drag) return; range.value = Math.round(vOf(clamp(toX(e) + drag.dx, EDGE.x0, EDGE.x1))); update(); });
  const up = () => { drag = null; };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);
  update();
}

// ---------- 03 这一刀落在哪 ----------
function cutDemo() {
  const stage = $("cut-stage"), svg = $("cut-svg"), topH = $("cut-top"), botH = $("cut-bot"), out = $("cut-out");
  const VB = { y0: -100, h: 1200 };
  const st = { top: -20, bot: 650 };
  // 左边一条「关节带」：底边落进去就是坏刀
  const bad = [];
  let from = -100;
  for (const z of BODY_ZONES) {
    if (z.bottom[0] === "bad" && from >= 100 && from < 1000) bad.push({ y: from, h: Math.min(z.to, 1000) - from, name: z.tag });
    from = z.to;
  }
  $("cut-joints").innerHTML = bad.map((b) => `<rect x="-300" y="${b.y}" width="22" height="${b.h}"/><text x="-270" y="${b.y + b.h / 2 + 12}">${b.name}</text>`).join("");
  const kindName = { good: "稳", ok: "可以", bad: "别切" };
  const update = () => {
    const H = stage.getBoundingClientRect().height;
    const toPx = (y) => ((y - VB.y0) / VB.h) * H;
    topH.style.top = `${toPx(st.top)}px`;
    botH.style.top = `${toPx(st.bot)}px`;
    $("cut-top-shade").setAttribute("height", st.top - VB.y0);
    $("cut-bot-shade").setAttribute("y", st.bot);
    $("cut-bot-shade").setAttribute("height", VB.y0 + VB.h - st.bot);
    const h = st.bot - st.top, w = h * 0.75;
    out.setAttribute("viewBox", `${(-w / 2).toFixed(1)} ${st.top} ${w.toFixed(1)} ${h}`);
    const zt = zoneAt(st.top), zb = zoneAt(st.bot);
    setChip($("cut-chip-top"), `顶边 · ${kindName[zt.top[0]]}`, zt.top[0]);
    $("cut-text-top").textContent = zt.top[1];
    setChip($("cut-chip-bot"), `底边 · ${kindName[zb.bottom[0]]}`, zb.bottom[0]);
    $("cut-text-bot").textContent = zb.bottom[1];
    topH.setAttribute("aria-valuenow", Math.round(st.top));
    botH.setAttribute("aria-valuenow", Math.round(st.bot));
    topH.setAttribute("aria-valuetext", zt.name);
    botH.setAttribute("aria-valuetext", zb.name);
    for (const b of cutBtns) b.setAttribute("aria-pressed", String(b.dataset.cut === `${st.top},${st.bot}`));
  };
  const setEdge = (which, y) => {
    if (which === "top") st.top = Math.round(clamp(y, VB.y0, st.bot - 140));
    else st.bot = Math.round(clamp(y, st.top + 140, VB.y0 + VB.h));
    update();
  };
  const cutBtns = [...document.querySelectorAll("[data-cut]")];
  for (const b of cutBtns) b.addEventListener("click", () => { const [t, bt] = b.dataset.cut.split(",").map(Number); st.top = t; st.bot = bt; update(); });
  for (const [el, which] of [[topH, "top"], [botH, "bot"]]) {
    let drag = null;
    const toY = (e) => { const r = stage.getBoundingClientRect(); return VB.y0 + ((e.clientY - r.top) / r.height) * VB.h; };
    el.addEventListener("pointerdown", (e) => { drag = { dy: st[which] - toY(e) }; el.setPointerCapture(e.pointerId); el.classList.add("on"); });
    el.addEventListener("pointermove", (e) => { if (drag) setEdge(which, toY(e) + drag.dy); });
    const up = () => { drag = null; el.classList.remove("on"); };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", (e) => {
      const d = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 }[e.key];
      if (!d) return;
      e.preventDefault();
      setEdge(which, st[which] + d * (e.shiftKey ? 50 : 10));
    });
  }
  new ResizeObserver(update).observe(stage);
  update();
}

// ---------- 04 柠檬：一路推近 ----------
const LEMON = { c0: { x: 0.35, y: 0 }, half: 1.32, target: { x: 0.83 * Math.cos(-1.2), y: 0.83 * Math.sin(-1.2) }, zmax: 18 };
function lemonDemo() {
  const canvas = $("lemon"), g = canvas.getContext("2d"), range = $("lemon-range");
  const zoomOf = () => Math.pow(LEMON.zmax, +range.value / 1000);
  const draw = () => {
    sizeCanvas(canvas);
    const z = zoomOf(), P = LEMON.target;
    const cx = P.x + (LEMON.c0.x - P.x) / z, cy = P.y + (LEMON.c0.y - P.y) / z;
    const half = LEMON.half / z, s = canvas.height / (2 * half);
    g.setTransform(s, 0, 0, s, canvas.width / 2 - cx * s, canvas.height / 2 - cy * s);
    g.fillStyle = C.blue;
    g.fillRect(cx - half * 2, cy - half, half * 4, half * 2);
    drawLemon(g);
  };
  const update = () => {
    const z = zoomOf();
    $("lemon-x").textContent = `${z < 10 ? z.toFixed(1) : Math.round(z)}×`;
    const [chip, kind, text] =
      z < 1.6 ? ["一片柠檬", "space", "一片柠檬，旁边一把叉子。东西都在，多大一看就知道：叉子告诉你，它比手掌还小。"]
      : z < 3.6 ? ["只剩柠檬", "ok", "叉子出了画，柠檬撑满了框。还认得出，可已经没东西和它比大小了。"]
      : z < 8 ? ["局部", "good", "只剩两三瓣和一截皮：瓣膜成了白色的放射线，汁囊成了一粒粒的纹理。形状开始自己说话。"]
      : ["认不出", "warn", "一道弧、几道白线、一片一粒粒的黄。没有参照物，它可以是一片柠檬，也可以是一整扇彩色玻璃窗。看的已经是纹理和形状，不再是柠檬。"];
    setChip($("lemon-chip"), chip, kind);
    $("lemon-text").textContent = text;
    draw();
  };
  range.addEventListener("input", update);
  new ResizeObserver(draw).observe(canvas);
  update();
}

// ---------- 05 字也能撑满 ----------
function typeDemo() {
  const canvas = $("type"), g = canvas.getContext("2d");
  const size = $("type-size"), xr = $("type-x");
  const words = [...document.querySelectorAll("[data-word]")];
  let word = "填满";
  const A = document.createElement("canvas");
  A.width = 600;
  A.height = 600;
  const ga = A.getContext("2d", { willReadFrequently: true });
  const FW = 120, FH = 160, FX = 240, FY = 220; // 量墨用的小画框，放在 600×600 的中间
  const fontOf = (w, px) => (/^[A-Z]+$/.test(w) ? `800 ${px}px Inter, "Noto Sans SC", sans-serif` : `900 ${px}px "Noto Sans SC", sans-serif`);
  // 字按「墨的宽度 = 画框宽 × 放大」摆，竖直居中，左右挪 x 个画宽
  const layout = (w, frameW, frameH, ctx) => {
    ctx.font = fontOf(w, 100);
    const m = ctx.measureText(w);
    const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const px = (100 * frameW * (+size.value / 100)) / inkW, k = px / 100;
    const left = frameW / 2 - (inkW * k) / 2 + (+xr.value / 100) * frameW;
    const top = frameH / 2 - (inkH * k) / 2;
    return { px, x: left + m.actualBoundingBoxLeft * k, y: top + m.actualBoundingBoxAscent * k };
  };
  const ink = (x0, y0, w, h) => {
    const d = ga.getImageData(x0, y0, w, h).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 127) n++;
    return n;
  };
  const measureInk = () => {
    ga.clearRect(0, 0, 600, 600);
    const L = layout(word, FW, FH, ga);
    ga.fillStyle = "#000";
    ga.font = fontOf(word, L.px);
    ga.fillText(word, FX + L.x, FY + L.y);
    const total = ink(0, 0, 600, 600), inside = ink(FX, FY, FW, FH);
    return { fill: inside / (FW * FH), visible: total ? inside / total : 0 };
  };
  const draw = () => {
    sizeCanvas(canvas);
    const W = canvas.width, H = canvas.height;
    const fw = W / 1.5, fh = (fw * 4) / 3, fx = (W - fw) / 2, fy = (H - fh) / 2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    const L = layout(word, fw, fh, g);
    g.font = fontOf(word, L.px);
    // 框外：字的轮廓虚线，看得见被切掉的那一截
    g.save();
    g.setLineDash([Math.max(3, W * 0.012), Math.max(3, W * 0.01)]);
    g.lineWidth = Math.max(1, W * 0.003);
    g.strokeStyle = "rgba(250, 195, 2, 0.75)";
    g.strokeText(word, fx + L.x, fy + L.y);
    g.restore();
    g.save();
    g.beginPath();
    g.rect(fx, fy, fw, fh);
    g.clip();
    g.fillStyle = C.yellow;
    g.fillRect(fx, fy, fw, fh);
    g.fillStyle = C.blue;
    g.fillText(word, fx + L.x, fy + L.y);
    g.restore();
  };
  const update = () => {
    draw();
    const m = measureInk();
    const cut = 1 - m.visible;
    const [chip, kind, text] =
      m.visible > 0.97 ? ["整字", "space", `字完整地待在框里，墨占画面 ${pct(m.fill)}。${m.fill < 0.3 ? "框里还空着一大片，再放大一点。" : "再大一点就出血了。"}`]
      : m.visible > 0.66 ? ["认得出", "good", `切掉了 ${pct(cut)} 的笔画，眼睛会把出框的部分补回来。字还读得出，还多了冲出去的劲。墨占画面 ${pct(m.fill)}。`]
      : m.visible > 0.42 ? ["勉强", "warn", `只剩 ${pct(m.visible)} 的笔画在框里。熟悉的字还能猜，生字就难了，标题别切到这儿。`]
      : ["成了图形", "bad", `只剩 ${pct(m.visible)}，读不出了，成了图形。当底纹、当装饰可以，当标题不行。`];
    setChip($("type-chip"), chip, kind);
    $("type-text").textContent = text;
  };
  for (const b of words) b.addEventListener("click", () => { word = b.dataset.word; pressGroup(words, (x) => x === b); update(); });
  pressGroup(words, (x) => x.dataset.word === word);
  size.addEventListener("input", update);
  xr.addEventListener("input", update);
  new ResizeObserver(draw).observe(canvas);
  // 字体到了再量，不然量的是后备字体
  document.fonts.ready.then(update);
  update();
}

// ---------- 06 字往哪放 ----------
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function mockDemo() {
  const canvas = $("mock-canvas"), g = canvas.getContext("2d"), title = $("mock-title"), band = $("mock-band");
  const mask = makeMask(RING.W, RING.H, 8, paintRingMask);
  const crops = { fill: PRESETS.find((p) => p.id === "bleed").crop, space: { cx: 1250, cy: 900, h: 1800 } };
  const POS = { top: 0.07, mid: 0.4, bot: 0.73 }, BOX_H = 0.2, BOX_X = 0.07, BOX_W = 0.86;
  const st = { crop: "fill", pos: "top", band: false };
  const cropBtns = [...document.querySelectorAll("[data-mock]")], posBtns = [...document.querySelectorAll("[data-pos]")];
  const draw = () => {
    sizeCanvas(canvas);
    const r = rectOf(crops[st.crop], 0.75), s = canvas.height / r.h;
    g.setTransform(s, 0, 0, s, -r.x0 * s, -r.y0 * s);
    drawRingWorld(g);
  };
  const update = () => {
    draw();
    title.style.top = `${POS[st.pos] * 100}%`;
    title.classList.toggle("band", st.band);
    pressGroup(cropBtns, (b) => b.dataset.mock === st.crop);
    pressGroup(posBtns, (b) => b.dataset.pos === st.pos);
    band.setAttribute("aria-pressed", String(st.band));
    const r = rectOf(crops[st.crop], 0.75);
    const bx0 = r.x0 + BOX_X * r.w, by0 = r.y0 + POS[st.pos] * r.h, bx1 = bx0 + BOX_W * r.w, by1 = by0 + BOX_H * r.h;
    const under = mask.area(bx0, by0, bx1, by1) / ((bx1 - bx0) * (by1 - by0));
    const inFrame = mask.area(r.x0, r.y0, r.x1, r.y1);
    const hidden = inFrame ? mask.area(bx0, by0, bx1, by1) / inFrame : 0;
    const cy = contrast(C.white, C.yellow).toFixed(1), cb = contrast(C.white, C.blue).toFixed(1);
    let chip, kind, text;
    if (st.band) [chip, kind, text] = ["清楚", "good", `垫了一条蓝底，白字和底色是 ${cb} : 1，怎么放都清楚。${hidden > 0.02 ? `代价是盖掉了画里 ${pct(hidden)} 的环。` : "这里底下本来就空，没盖掉什么。"}`];
    else if (under > 0.5) [chip, kind, text] = ["看不清", "bad", `标题底下 ${pct(under)} 是黄环。白字对黄底只有 ${cy} : 1，几乎看不见（正文一般要 4.5 : 1 以上）。`];
    else if (under > 0.12) [chip, kind, text] = ["一半一半", "warn", `标题底下 ${pct(under)} 是黄环：落在蓝上的笔画清楚（${cb} : 1），落在黄上的看不见（${cy} : 1），字被切成了两截。`];
    else [chip, kind, text] = ["清楚", "good", `标题底下几乎全是蓝，白字对蓝底 ${cb} : 1，清清楚楚。${st.crop === "space" ? "这块空就是给字留的地。" : ""}`];
    setChip($("mock-chip"), chip, kind);
    $("mock-text").textContent = text;
  };
  for (const b of cropBtns) b.addEventListener("click", () => { st.crop = b.dataset.mock; update(); });
  for (const b of posBtns) b.addEventListener("click", () => { st.pos = b.dataset.pos; update(); });
  band.addEventListener("click", () => { st.band = !st.band; update(); });
  new ResizeObserver(draw).observe(canvas);
  update();
}

// ---------- 07 小练习 ----------
function quiz() {
  const ANSWERS = {
    a: { text: "A 人站得整整齐齐，可四周的空比人还多。这是留白，不是填满；要冲击力，还得往前走。" },
    b: { text: "B 底边落在膝盖上，人像被截了一段。往上提到大腿中段，或者往下让脚进来。" },
    c: { best: true, text: "C 最好。人撑满上下，头顶只切了一点，底边落在大腿中段，正好在两个关节之间。紧，但不残。" },
    d: { text: "D 顶边从脖子上过，头没了。背影本来就靠头和肩认人，这一刀之后，连是不是人都要想一下。" },
  };
  const picks = [...document.querySelectorAll("[data-pick]")], out = $("quiz-text");
  picks.forEach((b) => b.addEventListener("click", () => {
    const p = ANSWERS[b.dataset.pick];
    picks.forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.classList.toggle("right", x === b && !!p.best); x.classList.toggle("wrong", x === b && !p.best); });
    out.textContent = p.text;
    out.dataset.kind = p.best ? "on" : "off";
  }));
}

// ---------- 08 原海报 ----------
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
  points();
  edgeDemo();
  cutDemo();
  lemonDemo();
  typeDemo();
  mockDemo();
  quiz();
  posterViewer();
  reveals();
}
