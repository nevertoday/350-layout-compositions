// 01–08 各节的互动插图、控件逻辑、海报缩放拖拽与进场动效。
import { reducedMotion } from "../../lib/stage.js";
import { onBonsai } from "./bonsai.js";
import { anatomySVG, dofSVG, frameTypeSVG, layoutCardSVG, quizSVG, storySVG, svgEl } from "./flat.js";

const $ = (id) => document.getElementById(id);

const redraws = [];
function mountSVG(host, w, h, label, paint) {
  if (!host) return () => {};
  const svg = svgEl(w, h);
  svg.setAttribute("aria-label", label);
  host.append(svg);
  const draw = () => {
    svg.innerHTML = paint();
  };
  redraws.push(draw);
  draw();
  return draw;
}

// ---------- 01 海报「内外关系示意」三层解剖 ----------
const ANATOMY = [
  {
    name: "外框（前景）",
    quote: "建立边界与氛围",
    text: "离镜头最近的一层——拱门、门洞、树枝或阴影。它负责挡掉画面四周杂乱的背景，并先交代『人站在哪里看』。",
  },
  {
    name: "中框（中景）",
    quote: "延伸空间与节奏",
    text: "卡在前景与主角之间的第二道框，像走廊里的中式花格窗。它把平面拉开成前—中—后三段距离，纵深立刻成立。",
  },
  {
    name: "内框（主体）",
    quote: "承载视觉焦点",
    text: "被层层框住、受光最清楚的主角。四周留一点呼吸空间，不要让框线贴死或切穿主体轮廓。",
  },
];

function initAnatomy() {
  let active = -1;
  const draw = mountSVG($("anatomy-fig"), 220, 240, "外框、中框、内框三层关系示意图", () => anatomySVG(active));
  const btns = [...document.querySelectorAll(".an-btn")];
  for (const btn of btns) {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.layer;
      active = active === idx ? -1 : idx;
      btns.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.layer === active)));
      if (active < 0) {
        $("an-quote").textContent = "点选任意一层，查看它在海报里的分工。";
        $("an-desc").textContent = "外框定边界与氛围，中框拉空间与节奏，内框稳稳托住主角。";
      } else {
        $("an-quote").textContent = `海报原话 · ${ANATOMY[active].name}：「${ANATOMY[active].quote}」`;
        $("an-desc").textContent = ANATOMY[active].text;
      }
      draw();
    });
  }
}

// ---------- 02 六种现成的框 + 完整框 / 半框切换 ----------
const FRAME_TYPES = {
  arch: {
    name: "拱门",
    full: "圆拱自带向上的收束弧度，比直角方框更柔和，特别适合园林、古建与长廊。",
    part: "只露半边拱弧和一侧门柱，留出另一侧敞开，空间感比封死的门洞更松弛。",
  },
  window: {
    name: "方窗",
    full: "窗框把室外裁成一幅挂在墙上的画；窗棂越细，对主体的干扰越小。",
    part: "只借上檐和一侧窗框搭出 L 形半框，既有边界，又不会像把人关在格子里。",
  },
  branch: {
    name: "树枝叶隙",
    full: "垂枝与草木在四季和街头随处可得，天然打破几何僵硬感，适合拍风景和建筑。",
    part: "左上角探入两支垂竹叶就足够引导视线——人脑会自动补完其余边界。",
  },
  mirror: {
    name: "镜面反射",
    full: "后视镜、梳妆镜或橱窗反光能把『身后的人』和『眼前的人』放进同一帧，天然双层叙事。",
    part: "切掉一侧镜边，暗示镜外还有更大空间，减少摆拍感。",
  },
  tunnel: {
    name: "隧道暗口",
    full: "暗隧道配出口强光，是反差最强的天然暗框，哪怕主体很小也会瞬间抓住眼球。",
    part: "往出口迈几步，让暗边缩成顶部和两侧的弧影，保留呼吸的同时不丢纵深。",
  },
  crowd: {
    name: "人群肩缝",
    full: "在集市、剧场或街头，从前排两位路人的肩背缝隙之间拍过去，杂乱人群反而成了聚光框。",
    part: "只保留一侧前景肩背剪影做遮挡，交代现场热闹，又不把主角夹得太紧。",
  },
};

function initFrameTypes() {
  let kind = "arch";
  let partial = false;
  const draw = mountSVG($("types-fig"), 280, 200, "不同形状与完整度的现成框架示意", () => frameTypeSVG(kind, partial));
  const update = () => {
    const info = FRAME_TYPES[kind];
    $("types-title").textContent = `${info.name} · ${partial ? "不完整半框" : "完整全框"}`;
    $("types-text").textContent = partial ? info.part : info.full;
    draw();
  };
  $("types-kind").addEventListener("change", (e) => {
    kind = e.target.value;
    update();
  });
  const btn = $("types-partial");
  btn.addEventListener("click", () => {
    partial = !partial;
    btn.setAttribute("aria-pressed", String(partial));
    btn.firstChild.textContent = partial ? "切回完整全框 " : "换成半框试试 ";
    btn.lastElementChild.textContent = partial ? "Full frame" : "Partial frame";
    update();
  });
  update();
}

// ---------- 03 框在讲故事：谁在看谁、里外两个世界 ----------
const STORIES = {
  home: {
    title: "敞开的家门 · 归属与迎候",
    dark: "从暗屋里望向阳光院落：门框把『屋里』和『屋外』划成两个世界，像约翰·福特在《搜索者》里用门洞写出的那道边界。",
    light: "从亮处望向微暗门内：视线被拉进私密空间，像走进一户人家的生活现场。",
  },
  peek: {
    title: "半掩的门缝 · 窥视与距离",
    dark: "门缝缩窄到只露一个人影，观众立刻变成躲在暗处偷看的人——没改人物姿势，只改框的开口，情绪就变了。",
    light: "明暗倒过来后，缝隙里的微暗人影带着克制与悬念，像隔门相望。",
  },
  window: {
    title: "隔着窗棂 · 守望与隔阂",
    dark: "窗格与雨痕在主体与观众之间立起一层物理屏障，看得到却摸不着，天然带着思念或疏离。",
    light: "窗框发亮而窗外沉静，视觉焦点转向室内视角，强调『隔岸观望』。",
  },
  archway: {
    title: "拱廊与门槛 · 仪式与远望",
    dark: "圆拱配底部门槛，把普通背影托出舞台感与纪念感，像站在一幕戏的序曲里。",
    light: "亮色石拱温柔包住暗调远景，节奏放慢，像回望一段远去的旧时光。",
  },
};

function initStoryLab() {
  let mood = "home";
  let invert = false;
  const draw = mountSVG($("story-fig"), 320, 210, "同一背影在不同外框下的叙事变化", () => storySVG(mood, invert));
  const update = () => {
    const s = STORIES[mood];
    $("story-title").textContent = s.title;
    $("story-text").textContent = invert ? s.light : s.dark;
    draw();
  };
  $("story-mood").addEventListener("change", (e) => {
    mood = e.target.value;
    update();
  });
  const btn = $("story-invert");
  btn.addEventListener("click", () => {
    invert = !invert;
    btn.setAttribute("aria-pressed", String(invert));
    btn.firstChild.textContent = invert ? "外亮内暗（门外看里） " : "内暗外亮（门里看外） ";
    btn.lastElementChild.textContent = invert ? "Bright → Dark" : "Dark → Bright";
    update();
  });
  update();
}

// ---------- 04 景深与明暗：别让框抢了主角的戏 ----------
function initDofLab() {
  const blurInput = $("dof-blur-range");
  const lightInput = $("dof-light-range");
  const draw = mountSVG($("dof-fig"), 320, 220, "前景虚化与外框明暗对比实验", () =>
    dofSVG(+blurInput.value, +lightInput.value),
  );
  const update = () => {
    const b = +blurInput.value;
    const l = +lightInput.value;
    const fstop = (1.8 + (1 - b / 100) * 9.2).toFixed(1);
    $("dof-blur-out").textContent = `f/${fstop}`;
    $("dof-light-out").textContent = l < 35 ? "暗框" : l < 70 ? "中等" : "亮花框";

    let verdict = "";
    if (l <= 40 && b >= 45) {
      verdict = "最省心的组合：前景暗且微虚，砖纹自然退后，眼睛毫不费力就落在清晰的梅花盆景上。";
    } else if (l >= 70 && b <= 30) {
      verdict = "前景抢戏了：外框又亮、砖缝又锐利，眼睛先盯着砖墙看，里面的盆景反而被比下去了。";
    } else if (l <= 40 && b < 45) {
      verdict = "外框够暗，反差已经拉开；如果不想前景纹理太抢眼，把光圈再开大一点（往右拉虚化）会更干净。";
    } else if (b >= 60) {
      verdict = "前景已经虚化成柔边，但颜色偏亮；压暗一点前景，窗内庭院的通透感会立刻跳出来。";
    } else {
      verdict = "前景和主体的明暗、锐度比较接近，两层在拉锯。要么压暗外框，要么虚化外框，让一层主动退后。";
    }
    $("dof-read").textContent = verdict;
    draw();
  };
  blurInput.addEventListener("input", update);
  lightInput.addEventListener("input", update);
  update();
}

// ---------- 05 版式里的框（图片框、色块框、留边） ----------
const LAYOUT_MODES = {
  none: {
    title: "无框满铺",
    text: "图片顶满四边，文字直接压在图像上：冲击力强，但信息多了之后图文容易打架。",
  },
  double: {
    title: "外留边 + 内色块框",
    text: "外圈大留边定住整张页面的秩序，中间的淡粉底块框出主图，右边留给标题与按钮——一图一文互不干扰。",
  },
  break: {
    title: "破框叠层",
    text: "外框和底色块仍在维持秩序，只让主图上缘轻轻探出框外一点点：规矩里立刻有了呼吸和立体感。",
  },
  over: {
    title: "过度套框（反面例子）",
    text: "卡片套边框、边框里再套小框：真正的内容被挤成碎块，满眼都是线。版式里两层框通常就够了。",
  },
};

function initLayoutLab() {
  let mode = "double";
  const draw = mountSVG($("layout-fig"), 320, 220, "平面与网页版式中的框中框对比", () => layoutCardSVG(mode));
  const update = () => {
    $("layout-title").textContent = LAYOUT_MODES[mode].title;
    $("layout-text").textContent = LAYOUT_MODES[mode].text;
    draw();
  };
  $("layout-mode").addEventListener("change", (e) => {
    mode = e.target.value;
    update();
  });
  update();
}

// ---------- 07 小练习 ----------
const QUIZ = {
  A: {
    title: "A：花窗抢戏，横梁切脖",
    text: "前景格子又亮又碎，更糟的是中景横木正好横切过人物颈部——外框成了干扰，而不是帮手。",
  },
  B: {
    title: "B：暗拱半围，留有呼吸",
    text: "前景暗拱略带虚化、压住四周杂物，人物完整落在明亮的拱洞偏中位置，四周有余白，视线一眼到位。",
  },
  C: {
    title: "C：三层黑框叠太厚",
    text: "框套得太重太多，主角缩成正中一个小点，画面憋闷，眼睛全在看一圈圈厚墙。",
  },
  D: {
    title: "D：机位偏了，门框切人",
    text: "摄影师没往左挪半步，门柱直接把人物切掉一半，拱洞大半边空着，框和主体各玩各的。",
  },
};

function initQuiz() {
  const btns = [...document.querySelectorAll(".opt")];
  for (const btn of btns) {
    const k = btn.dataset.k;
    mountSVG(btn.querySelector(".opt-fig"), 200, 240, `练习选项 ${k}`, () => quizSVG(k));
    btn.classList.toggle("right", k === "B");
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const q = QUIZ[k];
      $("verdict").hidden = false;
      $("verdict").classList.toggle("right", k === "B");
      $("v-title").textContent = k === "B" ? "选对了，B 最妥当。" : `${q.title}——再看看。`;
      $("v-text").textContent = k === "B" ? q.text : `${q.text}对照 B：${QUIZ.B.text}`;
    });
  }
}

// ---------- 08 原海报放大、拖动查看、Esc 关闭 ----------
function initPosterZoom() {
  const fig = $("poster-fig");
  const btn = $("poster-btn");
  const img = $("poster");
  if (!fig || !btn || !img) return;

  let pan = { x: 0, y: 0 };
  let drag = null;
  let moved = false;

  const applyPan = () => {
    img.style.transform = fig.classList.contains("zoomed") ? `translate(${pan.x}px, ${pan.y}px)` : "";
  };

  const setOpen = (open) => {
    fig.classList.toggle("zoomed", open);
    document.documentElement.classList.toggle("noscroll", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "收起海报" : "放大海报");
    pan = { x: 0, y: 0 };
    applyPan();
    if (open) fig.scrollTop = 0;
  };

  btn.addEventListener("pointerdown", (e) => {
    if (!fig.classList.contains("zoomed")) return;
    moved = false;
    drag = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    btn.setPointerCapture(e.pointerId);
  });
  btn.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 6) moved = true;
    pan.x = Math.max(-240, Math.min(240, drag.px + dx));
    pan.y = Math.max(-240, Math.min(240, drag.py + dy));
    applyPan();
  });
  const endPan = () => (drag = null);
  btn.addEventListener("pointerup", endPan);
  btn.addEventListener("pointercancel", endPan);

  btn.addEventListener("click", () => {
    if (moved) {
      moved = false;
      return;
    }
    setOpen(!fig.classList.contains("zoomed"));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && fig.classList.contains("zoomed")) {
      setOpen(false);
      btn.focus();
    }
  });
}

// ---------- 滚动渐入 ----------
function initReveals() {
  if (reducedMotion.matches) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px 10% 0px" },
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

export function initFigures() {
  initAnatomy();
  initFrameTypes();
  initStoryLab();
  initDofLab();
  initLayoutLab();
  initQuiz();
  initPosterZoom();
  initReveals();
  onBonsai(() => redraws.forEach((d) => d()));
}
