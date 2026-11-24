// 01–08 各节的小图和交互。都用 model.js 的 frames() 算矩形、flat.js 画 SVG。
import { reducedMotion } from "../../lib/stage.js";
import { framesSVG, svgEl } from "./flat.js";
import { PHI, frames, pct } from "./model.js";
import { PEONY_SIZE, onPeony, peonyURL } from "./peony.js";

const $ = (id) => document.getElementById(id);
const center = { u: 0.5, v: 0.5 };

// 牡丹到了以后，所有小图重画一次
const redraws = [];
const figure = (host, paint) => {
  const svg = svgEl(80, 100);
  host.append(svg);
  const draw = () => (svg.innerHTML = paint());
  redraws.push(draw);
  draw();
  return draw;
};

const LAYERS = [
  {
    quote: "建立整体边界，稳定画面结构。",
    en: "Define boundary, establish structure.",
    text: "最外一圈把画面和周围隔开，像画框。它通常最宽、颜色最稳，给整组框定下比例。",
  },
  {
    quote: "缓冲视觉节奏，增强空间层次。",
    en: "Pacing buffer, enhance depth.",
    text: "夹在中间，通常比两边都浅，让眼睛从外框跨到内框之前歇一下。少了它，两圈深色框贴在一起，只会读成一道粗边。",
  },
  {
    quote: "引导视线向内，聚焦视觉中心。",
    en: "Guide the eye inward, focus the center.",
    text: "最后一圈贴着主体，颜色常和主体呼应：海报里是和牡丹同一色系的粉。它把视线交到主体手上。",
  },
  {
    quote: "通过包围与留白，突出核心主体。",
    en: "Through enclosure and space, emphasize the subject.",
    text: "主体被三圈包住，四周都是安静的色块，没有别的东西和它抢，自然成了画面里最先被看到的地方。",
  },
];

function anatomy() {
  const f = frames({ layers: 3, gap: 0.1, rhythm: "deepen", focus: center });
  let pick = -1;
  const draw = figure($("anatomy-fig"), () => framesSVG(f, { highlight: pick }));
  const btns = [...document.querySelectorAll(".layer-btn")];
  for (const b of btns) {
    b.addEventListener("click", () => {
      const k = +b.dataset.layer;
      pick = pick === k ? -1 : k;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.layer === pick)));
      if (pick < 0) {
        $("an-quote").textContent = "点一个名字。";
        $("an-text").textContent = "四层从外到内：边界、缓冲、收拢、主角。";
      } else {
        $("an-quote").textContent = `「${LAYERS[pick].quote}」${LAYERS[pick].en}`;
        $("an-text").textContent = LAYERS[pick].text;
      }
      draw();
    });
  }
}

function rhythm() {
  const input = $("rl-r");
  const N = 4;
  const state = () => ({ layers: N, gap: 0.075, r: +input.value, focus: center });
  const draw = figure($("rl-fig"), () => framesSVG(frames(state())));
  const update = () => {
    const r = +input.value;
    const k = r ** (N - 1);
    $("rl-out").textContent = k.toFixed(2);
    let t;
    if (k < 0.8) t = `最里一层只有最外一层的 ${pct(k)} 宽：近大远小，读起来像一条往里退的走廊，视线被一路吸进去。这是海报里那种「通道」感。`;
    else if (k <= 1.25) t = "几层差不多一样宽：像一叠平放的卡纸，稳重、规矩，但没有纵深，层次全靠颜色深浅。";
    else t = `最里一层是最外一层的 ${k.toFixed(1)} 倍宽：越往里越宽，像台阶一级级往外托，主体被捧出来，往里走的感觉没了。`;
    $("rl-text").textContent = t;
    draw();
  };
  input.addEventListener("input", update);
  update();
}

function cost() {
  const input = $("cost-n");
  const GAP = 0.05;
  const draw = figure($("cost-fig"), () => framesSVG(frames({ layers: +input.value, gap: GAP, rhythm: "even", focus: center })));
  const update = () => {
    const n = +input.value;
    const f = frames({ layers: n, gap: GAP, rhythm: "even", focus: center });
    const w = f.rects.at(-1);
    const area = w.w * w.h;
    $("cost-out").textContent = n;
    $("cost-bar").style.width = pct(area);
    const tone = area > 0.45 ? "主体还是画面里最大的一块。" : area > 0.22 ? "框和主体开始平分画面了。" : "框已经比主体占地方，眼睛先看到的是一圈圈框。";
    $("cost-read").textContent = `每层宽 5%，${n} 层：主体剩画面的 ${pct(area)}。${tone}`;
    const W = Math.round(Math.min(window.innerWidth, 1440));
    const band = W * GAP;
    const left = W - 2 * n * band;
    $("cost-screen").textContent = `换成你这块屏幕：一张 ${W} px 宽的图，每层约 ${Math.round(band)} px，${n} 层左右两边一共吃掉 ${Math.round(2 * n * band)} px，主体只剩 ${Math.max(0, Math.round(left))} px 宽。`;
    draw();
  };
  input.addEventListener("input", update);
  addEventListener("resize", update);
  update();
}

function placement() {
  const base = { layers: 3, gap: 0.075, rhythm: "even" };
  for (const host of document.querySelectorAll(".pl-fig")) {
    const kind = host.dataset.place;
    figure(host, () => {
      if (kind === "center") return framesSVG(frames({ ...base, focus: center }));
      if (kind === "golden") return framesSVG(frames({ ...base, focus: { u: PHI, v: PHI } }));
      // 框还是同心的，主体被挪到左上的黄金点，压在框上
      const f = frames({ ...base, focus: center });
      const src = peonyURL();
      const w = 80 * 0.36;
      const h = w / (PEONY_SIZE.w / PEONY_SIZE.h);
      const x = 80 * PHI - w / 2;
      const y = 100 * PHI - h / 2;
      const img = src ? `<svg x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" viewBox="0 0 ${PEONY_SIZE.w} ${PEONY_SIZE.h}"><image href="${src}" width="${PEONY_SIZE.w}" height="${PEONY_SIZE.h}"/></svg>` : "";
      return framesSVG(f, { window: "empty", fill: "#f6c9cc" }) + img;
    });
  }
}

const RATIO_TEXT = {
  1.3333: "4:3：两条线各离边 25%。左右两个正方形重叠了一大半，中间共用的竖带正好占一半宽，主体放在这条带里，两边都照顾到。",
  1.5: "3:2：折入线在 66.7%，从另一头折是 33.3%，正好和三分线重合，见 001 三分法。",
  1.618: "黄金矩形：折入线在 61.8% 和 38.2%，就是黄金分割线。把剩下那条小矩形再折一次、再折一次，就是 003 黄金螺旋底下那一串正方形。",
  1.7778: "16:9：线在 56.3% 和 43.8%，两个正方形几乎叠在一起，只夹出中间一条 12.5% 宽的竖带。宽银幕里人物常落在这条带附近。",
  2: "2:1：两个正方形正好拼满，两条线重合在正中。",
  1: "1:1：本来就是正方形，短边等于长边，没有东西可折。这时这个方法用不上，主体直接居中更稳。",
};

function fold() {
  const rect = $("fold-rect");
  const run = () => {
    const R = +document.querySelector('input[name="ratio"]:checked').value;
    const s = 1 / R;
    rect.style.aspectRatio = String(R);
    rect.style.width = R >= 1.7 ? "100%" : `${Math.round((R / 2) * 100)}%`;
    for (const el of [$("fold-flap"), $("fold-flap-r")]) el.style.width = `${(s * 100).toFixed(2)}%`;
    $("fold-line").style.left = `${(s * 100).toFixed(2)}%`;
    $("fold-line-r").style.left = `${((1 - s) * 100).toFixed(2)}%`;
    $("fold-line").hidden = $("fold-line-r").hidden = R === 1;
    const k = `${R}`;
    const pos = R === 1 ? "" : `从左边折过来，线在 ${(s * 100).toFixed(1)}%。`;
    $("fold-read").textContent = pos + RATIO_TEXT[k];
    rect.classList.add("folding");
    void rect.offsetWidth;
    rect.classList.remove("folding");
  };
  $("ratio").addEventListener("change", run);
  $("fold-btn").addEventListener("click", run);
  run();
}

function mat() {
  const btn = $("mat-btn");
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    $("mat").classList.toggle("weighted", on);
  });
}

const QUIZ = {
  A: {
    state: { layers: 6, gap: 0.035, rhythm: "even", focus: center },
    colors: ["#d9506f", "#fff6f1"],
    title: "A：六圈等宽的红白条",
    text: "红白交替、一样宽，读成了一个靶子。条纹本身对比最强，眼睛在条纹上跳来跳去，花反而退到后面。",
  },
  B: {
    state: { layers: 3, gap: 0.085, rhythm: "deepen", focus: center },
    title: "B：三层，越往里越窄",
    text: "层数克制，外宽内窄有纵深，颜色都比花浅、比花柔，花占了画面将近一半：框在帮忙，不在抢戏。",
  },
  C: {
    state: { layers: 3, gap: 0.085, rhythm: "deepen", focus: center },
    colors: ["#2a0610", "#7a1430", "#4a0c1d"],
    title: "C：三层深酒红",
    text: "结构和 B 一样，但框比牡丹还深、还浓。最重的颜色在框上，视线先被框抓住；深红的花落在深红的框里，轮廓也糊了。",
  },
  D: {
    state: { layers: 5, gap: 0.085, rhythm: "even", focus: center },
    title: "D：五层宽框",
    text: "层层包裹包过头了：花只剩画面的一小块，远看只见一圈圈框。层数和宽度都要为主体让路。",
  },
};

function quiz() {
  const btns = [...document.querySelectorAll(".opt")];
  for (const b of btns) {
    const q = QUIZ[b.dataset.k];
    const f = frames(q.state);
    figure(b.querySelector(".opt-fig"), () => framesSVG(f, { colors: q.colors, seams: !q.colors }));
    b.classList.toggle("right", b.dataset.k === "B");
    b.setAttribute("aria-label", `选项 ${b.dataset.k}`);
    b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const k = b.dataset.k;
      $("verdict").hidden = false;
      $("verdict").classList.toggle("right", k === "B");
      $("v-title").textContent = k === "B" ? "对，B 最好。" : `${q.title}：不太好。`;
      $("v-text").textContent = k === "B" ? q.text : `${q.text}对照 B：${QUIZ.B.text}`;
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
  anatomy();
  rhythm();
  cost();
  placement();
  fold();
  mat();
  quiz();
  posterZoom();
  reveals();
  onPeony(() => redraws.forEach((d) => d()));
}
