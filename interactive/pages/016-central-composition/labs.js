// 016 居中构图 · 五个互动实验 + 练习题 + 原海报放大镜

import { arnheimForce, clamp } from "./model.js";
import { PALETTE } from "./palette.js";

const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);

function el(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text != null) n.textContent = text;
  return n;
}

// =========================================================================
// 实验 1：阿恩海姆「正方形隐性结构」圆盘力场（第 02 节）
// =========================================================================
function initArnheimLab() {
  const svg = $("arnheim-svg");
  const handle = $("arnheim-handle");
  const toggleSkel = $("arnheim-skel");
  const outTitle = $("arnheim-title");
  const outBody = $("arnheim-body");
  const outForce = $("arnheim-force");
  if (!svg || !handle) return;

  const state = { u: 0.58, v: 0.44, skel: true };
  const PRESETS = {
    center: { u: 0.5, v: 0.5 },
    near: { u: 0.58, v: 0.44 },
    diag: { u: 0.34, v: 0.34 },
    edge: { u: 0.81, v: 0.5 },
  };

  function render() {
    const W = 320;
    const H = 320;
    const cx = state.u * W;
    const cy = state.v * H;
    const f = arnheimForce(state.u, state.v);
    const dCenter = Math.hypot(state.u - 0.5, state.v - 0.5);

    const frag = new DocumentFragment();
    frag.append(el("rect", { x: 1, y: 1, width: W - 2, height: H - 2, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.6 }));

    // 阿恩海姆正方形隐性结构：中线、对角线、中心点、内环
    if (state.skel) {
      const sg = el("g", { opacity: "0.95" });
      sg.append(
        el("line", { x1: 0, y1: 0, x2: W, y2: H, stroke: PALETTE.hairline, "stroke-width": 1, "stroke-dasharray": "4 5" }),
        el("line", { x1: W, y1: 0, x2: 0, y2: H, stroke: PALETTE.hairline, "stroke-width": 1, "stroke-dasharray": "4 5" }),
        el("line", { x1: W / 2, y1: 0, x2: W / 2, y2: H, stroke: PALETTE.ink, "stroke-opacity": 0.22, "stroke-width": 1, "stroke-dasharray": "5 5" }),
        el("line", { x1: 0, y1: H / 2, x2: W, y2: H / 2, stroke: PALETTE.ink, "stroke-opacity": 0.22, "stroke-width": 1, "stroke-dasharray": "5 5" }),
        el("circle", { cx: W / 2, cy: H / 2, r: 52, fill: "none", stroke: PALETTE.vermilion, "stroke-opacity": 0.2, "stroke-width": 1, "stroke-dasharray": "3 4" }),
        // 中心小十字
        el("path", { d: `M${W / 2 - 7},${H / 2}H${W / 2 + 7} M${W / 2},${H / 2 - 7}V${H / 2 + 7}`, stroke: PALETTE.ink, "stroke-width": 1.6 })
      );
      frag.append(sg);
    }

    // 力场拉扯箭头（静止正中时归零）
    if (f.mag > 0.04) {
      const len = 18 + f.mag * 54;
      const nx = f.fx / Math.max(0.001, Math.hypot(f.fx, f.fy));
      const ny = f.fy / Math.max(0.001, Math.hypot(f.fx, f.fy));
      const x2 = cx + nx * len;
      const y2 = cy + ny * len;
      const ang = Math.atan2(ny, nx);
      const ah = 8;
      const p1x = x2 - ah * Math.cos(ang - 0.5);
      const p1y = y2 - ah * Math.sin(ang - 0.5);
      const p2x = x2 - ah * Math.cos(ang + 0.5);
      const p2y = y2 - ah * Math.sin(ang + 0.5);
      frag.append(
        el("line", { x1: cx, y1: cy, x2, y2, stroke: PALETTE.vermilion, "stroke-width": 2.4, "stroke-linecap": "round" }),
        el("polygon", { points: `${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`, fill: PALETTE.vermilion })
      );
    }

    // 黑色圆盘（向阿恩海姆 1954 第一章原图致敬，居中锁定则显朱红边环）
    const locked = dCenter < 0.025;
    if (locked) {
      frag.append(el("circle", { cx, cy, r: 33, fill: "none", stroke: PALETTE.vermilion, "stroke-width": 2 }));
    }
    frag.append(el("circle", { cx, cy, r: 26, fill: locked ? PALETTE.vermilion : PALETTE.ink }));
    frag.append(el("circle", { cx, cy, r: 3.2, fill: PALETTE.paper }));

    svg.replaceChildren(frag);

    handle.style.left = `${state.u * 100}%`;
    handle.style.top = `${state.v * 100}%`;
    handle.setAttribute("aria-valuetext", `横向 ${Math.round(state.u * 100)}%，纵向 ${Math.round(state.v * 100)}%`);

    // 读数与感知判断
    const tensionPct = Math.round(f.mag * 100);
    outForce.textContent = locked ? "拉扯力 0% · 归零" : `视觉张力约 ${tensionPct}%`;
    if (locked) {
      outTitle.textContent = "正中静止点：四向合力完全抵消";
      outBody.textContent = "阿恩海姆指出，正方形并非空白容器，而是布满隐性轴线的力场。圆盘落在正中时，上下左右与四条对角线的拉扯全部抵消，画面立刻安静下来。";
    } else if (dCenter < 0.14) {
      outTitle.textContent = "微妙偏离：最让人坐立不安的位置";
      outBody.textContent = "圆盘只挪开了几毫米，却被中心强力拉扯着。观众一眼就会怀疑「是不是放歪了」，这是排版里最常踩的半吊子区域。";
    } else if (state.u < 0.24 || state.u > 0.76 || state.v < 0.24 || state.v > 0.76) {
      outTitle.textContent = "贴近边界：被画框边缘吸住";
      outBody.textContent = "圆盘离边太近，边缘的吸附力盖过了中心引力，视觉上像要粘到边框上，原本的稳定感荡然无存。";
    } else if (Math.abs(Math.abs(state.u - 0.5) - Math.abs(state.v - 0.5)) < 0.045) {
      outTitle.textContent = "落在对角轴上：偏心却有秩序";
      outBody.textContent = "虽然离开了中心，但恰好踩在正方形隐性的对角线上，不安分感骤减——此时已转为有意识的偏心构图。";
    } else {
      outTitle.textContent = "自由偏心位：中心静默让位于方向";
      outBody.textContent = "距离足够远，眼睛不再把它当成「没放正」，而是开始读取圆盘与大块空白之间的方向关系。";
    }
  }

  function setPos(u, v, snap = false) {
    let nu = clamp(u, 0.12, 0.88);
    let nv = clamp(v, 0.12, 0.88);
    if (snap && Math.hypot(nu - 0.5, nv - 0.5) < 0.045) {
      nu = 0.5;
      nv = 0.5;
    }
    state.u = nu;
    state.v = nv;
    document.querySelectorAll("[data-arnheim]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    render();
  }

  const fromEv = (e) => {
    const r = svg.getBoundingClientRect();
    return { u: (e.clientX - r.left) / Math.max(1, r.width), v: (e.clientY - r.top) / Math.max(1, r.height) };
  };

  let dragging = false;
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    handle.focus({ preventScroll: true });
    dragging = true;
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const p = fromEv(e);
    setPos(p.u, p.v, false);
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    setPos(state.u, state.v, true);
  };
  handle.addEventListener("pointerup", stop);
  handle.addEventListener("pointercancel", stop);

  svg.addEventListener("click", (e) => {
    const p = fromEv(e);
    setPos(p.u, p.v, true);
  });

  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.01 : 0.04;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (d) {
      e.preventDefault();
      setPos(state.u + d[0], state.v + d[1], false);
    } else if (e.key === "Home" || e.key === " ") {
      e.preventDefault();
      setPos(0.5, 0.5, true);
    }
  });

  document.querySelectorAll("[data-arnheim]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.arnheim;
      const p = PRESETS[key];
      if (!p) return;
      state.u = p.u;
      state.v = p.v;
      document.querySelectorAll("[data-arnheim]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });

  toggleSkel?.addEventListener("change", () => {
    state.skel = toggleSkel.checked;
    render();
  });

  render();
}

// =========================================================================
// 实验 2：几何中心 vs. 光学中心校准台（第 03 节）
// =========================================================================
function initOpticalLab() {
  const svg = $("opt-svg");
  const range = $("opt-range");
  const outVal = $("opt-val");
  const btnBlind = $("opt-blind");
  const btnIdeal = $("opt-ideal");
  const outTitle = $("opt-title");
  const outBody = $("opt-body");
  if (!svg || !range) return;

  // 各形体的「光学舒适上移参考值（经验值，单位：% 画高，正数代表向上提）」
  const SHAPES = {
    circle: {
      label: "正圆",
      ideal: 3.5,
      note: "正圆上下完全对称，但放在 50% 数学正中仍略感沉底；按装裱经验值上提约 3%–4%，观感更轻盈稳固。",
    },
    triUp: {
      label: "正三角（底重）",
      ideal: -3.0,
      note: "等边三角形的面积质心距顶点占高的 2/3，远低于外接框中点。如果再往上提就会头轻脚空；通常要略向下放低一点点，或按面积质心对齐。",
    },
    triDown: {
      label: "倒三角（顶重）",
      ideal: 5.5,
      note: "倒三角的视觉重量压在上半截，放在几何中点会觉得整块往下坠；比正圆需要更明显的上提（经验值约 5%–6%）。",
    },
    text: {
      label: "双行标题块",
      ideal: 4.0,
      note: "单张海报或书籍扉页上的居中文字块，底部留白略大于顶部（常见经验值上移 3%–5%），下方像多了一层隐形底座托住文字。",
    },
  };

  const state = { shape: "circle", offset: 0, blind: false };

  function render() {
    const W = 400;
    const H = 300;
    const cy = H * (0.5 - state.offset / 100);
    const geoY = H * 0.5;
    const idealY = H * (0.5 - SHAPES[state.shape].ideal / 100);

    const frag = new DocumentFragment();
    frag.append(el("rect", { x: 1, y: 1, width: W - 2, height: H - 2, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.6 }));

    // 四角取景折角
    const m = 22;
    const cl = 14;
    frag.append(
      el("path", {
        d: `M${m},${m + cl}V${m}H${m + cl} M${W - m - cl},${m}H${W - m}V${m + cl} M${m},${H - m - cl}V${H - m}H${m + cl} M${W - m - cl},${H - m}H${W - m}V${H - m - cl}`,
        fill: "none",
        stroke: PALETTE.vermilion,
        "stroke-width": 2,
      })
    );

    // 参考线（盲测时隐藏）
    if (!state.blind) {
      frag.append(
        // 几何中心线
        el("line", { x1: 12, y1: geoY, x2: W - 12, y2: geoY, stroke: PALETTE.ink, "stroke-opacity": 0.35, "stroke-width": 1, "stroke-dasharray": "5 5" }),
        el("line", { x1: W / 2, y1: 12, x2: W / 2, y2: H - 12, stroke: PALETTE.ink, "stroke-opacity": 0.22, "stroke-width": 1, "stroke-dasharray": "5 5" }),
        el("text", { x: 18, y: geoY + 13, fill: PALETTE.inkMuted, "font-size": 10.5, "font-family": "Space Grotesk, Noto Sans SC, sans-serif" }, "50% 几何中线"),
        // 光学参考线
        el("line", { x1: 12, y1: idealY, x2: W - 12, y2: idealY, stroke: PALETTE.vermilion, "stroke-opacity": 0.55, "stroke-width": 1.2, "stroke-dasharray": "2 4" }),
        el("text", { x: W - 18, y: idealY - 6, "text-anchor": "end", fill: PALETTE.vermilionDeep, "font-size": 10.5, "font-family": "Space Grotesk, Noto Sans SC, sans-serif" }, "光学参考位")
      );
    }

    // 绘制主体
    const g = el("g", { transform: `translate(${W / 2} ${cy})` });
    if (state.shape === "circle") {
      g.append(el("circle", { cx: 0, cy: 0, r: 52, fill: PALETTE.vermilion }));
    } else if (state.shape === "triUp") {
      g.append(el("polygon", { points: "0,-54 62,54 -62,54", fill: PALETTE.vermilion }));
      if (!state.blind) {
        // 标出真实几何质心（距顶点 2/3 高）
        g.append(
          el("circle", { cx: 0, cy: 18, r: 3.5, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.5 }),
          el("text", { x: 8, y: 21, fill: PALETTE.paper, "font-size": 9.5, "font-family": "Noto Sans SC, sans-serif" }, "质心")
        );
      }
    } else if (state.shape === "triDown") {
      g.append(el("polygon", { points: "-62,-54 62,-54 0,54", fill: PALETTE.vermilion }));
      if (!state.blind) {
        g.append(el("circle", { cx: 0, cy: -18, r: 3.5, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.5 }));
      }
    } else if (state.shape === "text") {
      g.append(
        el("rect", { x: -78, y: -28, width: 156, height: 18, fill: PALETTE.ink }),
        el("rect", { x: -54, y: 2, width: 108, height: 8, fill: PALETTE.vermilion }),
        el("rect", { x: -64, y: 20, width: 128, height: 5, fill: PALETTE.inkMuted, opacity: 0.55 })
      );
    }
    if (!state.blind) {
      g.append(el("path", { d: "M-5,0H5 M0,-5V5", stroke: state.shape === "text" ? PALETTE.vermilion : PALETTE.ink, "stroke-width": 1.4 }));
    }
    frag.append(g);
    svg.replaceChildren(frag);

    const sign = state.offset > 0 ? `+${state.offset.toFixed(1)}%（偏上）` : state.offset < 0 ? `${state.offset.toFixed(1)}%（偏下）` : "0.0%（几何中点）";
    outVal.textContent = sign;

    const info = SHAPES[state.shape];
    const diff = Math.abs(state.offset - info.ideal);
    if (state.blind) {
      outTitle.textContent = "盲测进行中：仅凭肉眼调到「最稳」";
      outBody.textContent = "辅助线已隐藏。左右拖动滑块，凭直觉停在你觉得最不沉、也不飘的位置，再点「显示参考线」验证差值。";
    } else if (Math.abs(state.offset) < 0.3) {
      outTitle.textContent = `${info.label} · 严格几何中点（50%）`;
      outBody.textContent = info.note;
    } else if (diff <= 1.2) {
      outTitle.textContent = `${info.label} · 落入光学舒适区`;
      outBody.textContent = `当前垂直偏移 ${sign}，与该形体的光学参考位非常接近。${info.note}`;
    } else if (state.offset > info.ideal + 1.2) {
      outTitle.textContent = "抬得略高，重心开始发飘";
      outBody.textContent = "高于光学参考区后，下方空隙拉得过大，主体不再像「稳坐中央」，而是开始接近上方标题区。";
    } else {
      outTitle.textContent = "位置偏沉，有下坠感";
      outBody.textContent = "低于光学中心时，下边距被压薄，画面像被地心引力拖住，显得闷重。";
    }
  }

  range.addEventListener("input", () => {
    state.offset = Number(range.value);
    render();
  });

  document.querySelectorAll('input[name="opt-shape"]').forEach((r) => {
    r.addEventListener("change", () => {
      if (!r.checked) return;
      state.shape = r.value;
      render();
    });
  });

  btnBlind?.addEventListener("click", () => {
    state.blind = !state.blind;
    btnBlind.setAttribute("aria-pressed", String(state.blind));
    btnBlind.textContent = state.blind ? "显示参考线（揭晓）" : "隐藏辅助线（盲测）";
    render();
  });

  btnIdeal?.addEventListener("click", () => {
    state.blind = false;
    if (btnBlind) {
      btnBlind.setAttribute("aria-pressed", "false");
      btnBlind.textContent = "隐藏辅助线（盲测）";
    }
    state.offset = SHAPES[state.shape].ideal;
    range.value = String(state.offset);
    render();
  });

  render();
}

// =========================================================================
// 实验 3：体量、干扰与画幅三开关（第 04 节）
// =========================================================================
function initSwitchesLab() {
  const svg = $("sw-svg");
  const scaleRange = $("sw-scale");
  const scaleOut = $("sw-scale-out");
  const outBadge = $("sw-badge");
  const outTitle = $("sw-title");
  const outBody = $("sw-body");
  if (!svg || !scaleRange) return;

  const state = { scale: 44, clutter: "none", ratio: "3:4" };

  const RATIOS = {
    "1:1": { w: 260, h: 260, label: "1:1 正方" },
    "3:4": { w: 210, h: 280, label: "3:4 竖版海报" },
    "16:9": { w: 368, h: 207, label: "16:9 宽银幕" },
  };

  function render() {
    const VW = 420;
    const VH = 340;
    const r = RATIOS[state.ratio];
    const fx = (VW - r.w) / 2;
    const fy = 32 + (VH - 46 - r.h) / 2;
    const cx = VW / 2;
    const cy = fy + r.h * 0.48; // 微抬光学中心
    const radius = (Math.min(r.w, r.h) * (state.scale / 100)) / 2;

    const frag = new DocumentFragment();
    // 外台面底
    frag.append(el("rect", { width: VW, height: VH, fill: PALETTE.paperSoft }));
    // 画幅白纸
    frag.append(el("rect", { x: fx, y: fy, width: r.w, height: r.h, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.6 }));

    // 十字参考线
    frag.append(
      el("line", { x1: cx, y1: fy + 8, x2: cx, y2: fy + r.h - 8, stroke: PALETTE.ink, "stroke-opacity": 0.2, "stroke-width": 1, "stroke-dasharray": "4 4" }),
      el("line", { x1: fx + 8, y1: cy, x2: fx + r.w - 8, y2: cy, stroke: PALETTE.ink, "stroke-opacity": 0.2, "stroke-width": 1, "stroke-dasharray": "4 4" })
    );

    // 主体圆（保持 016 海报母题）
    frag.append(el("circle", { cx, cy, r: radius, fill: PALETTE.vermilion }));
    frag.append(el("path", { d: `M${cx - 6},${cy}H${cx + 6} M${cx},${cy - 6}V${cy + 6}`, stroke: PALETTE.ink, "stroke-width": 1.6 }));

    // 干扰物（按 clutter 级别加入）
    let shiftX = 0;
    let shiftY = 0;
    if (state.clutter === "light") {
      frag.append(
        el("rect", { x: fx + r.w - 42, y: fy + 14, width: 28, height: 10, fill: PALETTE.ink, opacity: 0.72 }),
        el("rect", { x: fx + 14, y: fy + r.h - 24, width: 42, height: 8, fill: PALETTE.inkMuted, opacity: 0.45 })
      );
      shiftX = 6;
      shiftY = -3;
    } else if (state.clutter === "heavy") {
      frag.append(
        el("rect", { x: fx + r.w - 58, y: fy + 14, width: 44, height: 34, fill: PALETTE.ink }),
        el("circle", { cx: fx + r.w - 30, cy: fy + r.h - 32, r: 16, fill: PALETTE.vermilionDeep }),
        el("rect", { x: fx + 14, y: fy + 16, width: 32, height: 14, fill: PALETTE.ink, opacity: 0.8 }),
        el("rect", { x: fx + 14, y: fy + r.h - 36, width: 52, height: 18, fill: PALETTE.ink, opacity: 0.65 }),
        el("circle", { cx: fx + r.w - 22, cy: cy - 4, r: 8, fill: PALETTE.ink })
      );
      shiftX = 18;
      shiftY = -9;
    }

    // 若有干扰，画出被拉偏的综合重心点
    if (state.clutter !== "none") {
      frag.append(
        el("line", { x1: cx, y1: cy, x2: cx + shiftX, y2: cy + shiftY, stroke: PALETTE.ink, "stroke-width": 1.5 }),
        el("circle", { cx: cx + shiftX, cy: cy + shiftY, r: 4.5, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 2 })
      );
    }

    // 尺寸标签（置顶居中，留足上下边距不裁切）
    frag.append(
      el("text", { x: VW / 2, y: 20, "text-anchor": "middle", fill: PALETTE.inkMuted, "font-size": 11, "font-family": "Space Grotesk, Noto Sans SC, sans-serif" }, `${r.label} · 主体直径占比 ${state.scale}%`)
    );

    svg.replaceChildren(frag);
    scaleOut.textContent = `${state.scale}%`;

    // 综合诊断
    if (state.clutter === "heavy") {
      outBadge.textContent = "重心失血";
      outBadge.dataset.tone = "warn";
      outTitle.textContent = "四角杂物正在把居中撕散";
      outBody.textContent = "即使圆心纹丝不动，边缘的大黑块与高对比角标也在抢夺眼球，整幅画的重心已经向右偏移。居中是减法构图，四周越吵，中心越弱。";
    } else if (state.scale < 22) {
      outBadge.textContent = "体量过小";
      outBadge.dataset.tone = "warn";
      outTitle.textContent = "主体像迷失在空白里的小点";
      outBody.textContent = `直径只占画框短边的 ${state.scale}%，压不住四周空白。除非刻意做极简孤寂感，否则单主体海报一般需维持在约 35%–52%（经验值）。`;
    } else if (state.scale > 68) {
      outBadge.textContent = "逼近满幅";
      outBadge.dataset.tone = "warn";
      outTitle.textContent = "四周缓冲场被压扁，开始闷胀";
      outBody.textContent = "主体大到快顶住画框边缘时，居中带来的「四周呼吸与平衡」就会让位于满幅冲击——那是 012 填满画面构图的领域了。";
    } else if (state.ratio === "16:9") {
      outBadge.textContent = state.clutter === "light" ? "基本成立" : "宽幅居中";
      outBadge.dataset.tone = "ok";
      outTitle.textContent = "16:9 宽银幕：左右侧翼更长，更怕杂物";
      outBody.textContent = "宽画幅里单主体居中，左右留出大片水平静默区，很有电影停顿感；但两侧空间一宽，任何多余元素都会格外显眼。";
    } else {
      outBadge.textContent = state.clutter === "light" ? "轻度分心" : "黄金平衡";
      outBadge.dataset.tone = "ok";
      outTitle.textContent =
        state.clutter === "light"
          ? "体量恰当，角标需压低对比"
          : "体量饱满、四周纯净，居中气场全开";
      outBody.textContent =
        state.clutter === "light"
          ? "主体体量正好，但右上深色角标略微拉走了重量；把角标字号缩细、明度压浅，中心就能重新独揽全局。"
          : `在 ${r.label} 画幅中，主体占短边约 ${state.scale}%（经验值舒适区间），四周均匀的留白像托盘一样稳稳托住主角。`;
    }
  }

  scaleRange.addEventListener("input", () => {
    state.scale = Number(scaleRange.value);
    render();
  });
  document.querySelectorAll('input[name="sw-clutter"]').forEach((r) =>
    r.addEventListener("change", () => {
      if (r.checked) {
        state.clutter = r.value;
        render();
      }
    })
  );
  document.querySelectorAll('input[name="sw-ratio"]').forEach((r) =>
    r.addEventListener("change", () => {
      if (r.checked) {
        state.ratio = r.value;
        render();
      }
    })
  );

  render();
}

// =========================================================================
// 实验 4：居中 ≠ 对称，四种气质切换（第 05 节）
// =========================================================================
function initTemperamentLab() {
  const svg = $("temp-svg");
  const outTitle = $("temp-title");
  const outBody = $("temp-body");
  if (!svg) return;

  const MODES = {
    sym: {
      title: "居中 + 严格对称：仪式感与权威",
      body: "主体本身左右完全一致，加上居中落位，稳定感叠加到顶点——常见于建筑立面、官方徽章与典礼封面。若要求全画镜像一一对应，则进入 018 对称构图与 020 镜像构图。",
    },
    asym: {
      title: "居中 + 异形轮廓：稳而不僵（最实用）",
      body: "核心视觉重心牢牢压在正中，但主体枝叶、器物造型或姿态并不左右对称。既有居中的聚焦力，又保留自然松弛的呼吸感。",
    },
    offsetType: {
      title: "居中主体 + 偏位字标：打破「PPT 居中对齐」的呆板",
      body: "视觉主体稳坐十字中心，把编号、日期或短标题利落地压进一侧边角——这是瑞士平面设计与现代杂志常用的解腻手法。",
    },
    tunnel: {
      title: "居中主体 + 纵深空间：把视线推向正中",
      body: "一点透视的建筑框架从四面向中央收拢，把观者直接吸向画心的主体；电影镜头里常用这种中心汇聚制造庄严或压迫感。",
    },
  };

  let active = "asym";

  function render() {
    const W = 420;
    const H = 280;
    const cx = W / 2;
    const cy = H / 2;
    const frag = new DocumentFragment();

    frag.append(el("rect", { x: 1, y: 1, width: W - 2, height: H - 2, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.6 }));
    // 统一中心十字
    frag.append(
      el("line", { x1: cx, y1: 10, x2: cx, y2: H - 10, stroke: PALETTE.ink, "stroke-opacity": 0.16, "stroke-width": 1, "stroke-dasharray": "4 5" }),
      el("line", { x1: 10, y1: cy, x2: W - 10, y2: cy, stroke: PALETTE.ink, "stroke-opacity": 0.16, "stroke-width": 1, "stroke-dasharray": "4 5" })
    );

    if (active === "sym") {
      // 严整对称徽章器物
      frag.append(
        el("rect", { x: cx - 54, y: cy - 68, width: 108, height: 136, fill: "none", stroke: PALETTE.ink, "stroke-width": 2 }),
        el("circle", { cx, cy, r: 42, fill: PALETTE.vermilion }),
        el("polygon", { points: `${cx},${cy - 28} ${cx + 22},${cy} ${cx},${cy + 28} ${cx - 22},${cy}`, fill: PALETTE.ink }),
        el("circle", { cx, cy, r: 6, fill: PALETTE.paper }),
        el("rect", { x: cx - 44, y: cy + 84, width: 88, height: 6, fill: PALETTE.ink })
      );
    } else if (active === "asym") {
      // 居中但不对称的抽象花枝器物（主体重心在正中，轮廓自然舒展）
      frag.append(
        // 主体底座与朱红主圆压住视觉中心
        el("circle", { cx: cx - 4, cy: cy + 8, r: 48, fill: PALETTE.vermilion }),
        // 向右上伸出的非对称枝条与叶片
        el("path", { d: `M${cx - 6},${cy + 8} Q${cx + 12},${cy - 34} ${cx + 58},${cy - 68}`, fill: "none", stroke: PALETTE.ink, "stroke-width": 3, "stroke-linecap": "round" }),
        el("ellipse", { cx: cx + 44, cy: cy - 54, rx: 14, ry: 7, transform: `rotate(-36 ${cx + 44} ${cy - 54})`, fill: PALETTE.ink }),
        el("ellipse", { cx: cx + 18, cy: cy - 32, rx: 11, ry: 5.5, transform: `rotate(-52 ${cx + 18} ${cy - 32})`, fill: PALETTE.ink }),
        // 左下侧一点小体量做视觉平衡
        el("rect", { x: cx - 68, y: cy + 32, width: 32, height: 22, fill: PALETTE.ink }),
        el("circle", { cx, cy, r: 3.5, fill: PALETTE.paper })
      );
    } else if (active === "offsetType") {
      // 居中纯主体 + 瑞士风非对称边角字标
      frag.append(
        el("circle", { cx, cy: cy - 4, r: 54, fill: PALETTE.vermilion }),
        el("circle", { cx, cy: cy - 4, r: 22, fill: PALETTE.ink }),
        // 左上角锐利字标
        el("text", { x: 22, y: 34, fill: PALETTE.ink, "font-size": 11, "font-weight": 700, "font-family": "Space Grotesk, sans-serif" }, "NO. 016"),
        el("line", { x1: 22, y1: 42, x2: 72, y2: 42, stroke: PALETTE.ink, "stroke-width": 1.6 }),
        // 右下角克制文案块
        el("rect", { x: W - 114, y: H - 46, width: 92, height: 7, fill: PALETTE.ink }),
        el("rect", { x: W - 86, y: H - 32, width: 64, height: 4, fill: PALETTE.inkMuted, opacity: 0.6 })
      );
    } else if (active === "tunnel") {
      // 一点透视走廊把视线推向正中主体
      for (const s of [0.92, 0.72, 0.52, 0.34]) {
        const rw = W * s;
        const rh = H * s;
        frag.append(
          el("rect", {
            x: cx - rw / 2,
            y: cy - rh / 2,
            width: rw,
            height: rh,
            fill: "none",
            stroke: PALETTE.ink,
            "stroke-opacity": 0.28 + (1 - s) * 0.45,
            "stroke-width": 1.4,
          })
        );
      }
      frag.append(
        el("line", { x1: 0, y1: 0, x2: cx - 42, y2: cy - 28, stroke: PALETTE.ink, "stroke-opacity": 0.35, "stroke-width": 1.2 }),
        el("line", { x1: W, y1: 0, x2: cx + 42, y2: cy - 28, stroke: PALETTE.ink, "stroke-opacity": 0.35, "stroke-width": 1.2 }),
        el("line", { x1: 0, y1: H, x2: cx - 42, y2: cy + 28, stroke: PALETTE.ink, "stroke-opacity": 0.35, "stroke-width": 1.2 }),
        el("line", { x1: W, y1: H, x2: cx + 42, y2: cy + 28, stroke: PALETTE.ink, "stroke-opacity": 0.35, "stroke-width": 1.2 }),
        // 走廊尽头居中剪影（无五官）
        el("circle", { cx, cy: cy - 12, r: 11, fill: PALETTE.vermilion }),
        el("path", { d: `M${cx - 18},${cy + 28} C${cx - 17},${cy + 4} ${cx + 17},${cy + 4} ${cx + 18},${cy + 28} Z`, fill: PALETTE.ink })
      );
    }

    svg.replaceChildren(frag);
    outTitle.textContent = MODES[active].title;
    outBody.textContent = MODES[active].body;
  }

  document.querySelectorAll("[data-temp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      active = btn.dataset.temp;
      document.querySelectorAll("[data-temp]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });

  render();
}

// =========================================================================
// 实验 5：正面居中 vs. 侧向朝向压力测试（第 06 节，帕尔默 2008）
// 严格遵守 BRIEF：画人只用剪影/侧影/背影，不画眼睛与嘴巴等五官细节！
// =========================================================================
function initDirectionLab() {
  const svg = $("dir-svg");
  const outTitle = $("dir-title");
  const outBody = $("dir-body");
  if (!svg) return;

  const state = { subject: "profile", framing: "center" };

  function render() {
    const W = 420;
    const H = 260;
    const frag = new DocumentFragment();

    frag.append(el("rect", { x: 1, y: 1, width: W - 2, height: H - 2, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.6 }));
    // 中线参考
    frag.append(
      el("line", { x1: W / 2, y1: 10, x2: W / 2, y2: H - 10, stroke: PALETTE.ink, "stroke-opacity": 0.22, "stroke-width": 1, "stroke-dasharray": "4 5" }),
      el("line", { x1: 10, y1: H / 2, x2: W - 10, y2: H / 2, stroke: PALETTE.ink, "stroke-opacity": 0.14, "stroke-width": 1, "stroke-dasharray": "4 5" })
    );

    const isCenter = state.framing === "center";

    if (state.subject === "frontal") {
      // 正面人像剪影（无五官：纯头肩背影/剪影形态）
      const px = isCenter ? W / 2 : W * 0.34;
      const g = el("g", { transform: `translate(${px} 0)` });
      // 朱红光晕圆盘托起正面剪影
      g.append(
        el("circle", { cx: 0, cy: 118, r: 74, fill: PALETTE.vermilion, opacity: 0.18 }),
        el("circle", { cx: 0, cy: 96, r: 34, fill: PALETTE.ink }),
        el("rect", { x: -12, y: 124, width: 24, height: 26, fill: PALETTE.ink }),
        el("path", { d: "M-64,259 C-60,180 -34,152 0,152 C34,152 60,180 64,259 Z", fill: PALETTE.ink }),
        // 胸前朱红徽章圆点表示正对镜头
        el("circle", { cx: 0, cy: 196, r: 8, fill: PALETTE.vermilion })
      );
      frag.append(g);
    } else {
      // 侧向剪影（纯侧影轮廓，朝右，无眼睛与嘴部五官细节）
      const px = isCenter ? W * 0.52 : W * 0.34;
      // 标出前方剩余空间色块
      const aheadX = px + 46;
      const aheadW = Math.max(0, W - 12 - aheadX);
      frag.append(
        el("rect", { x: aheadX, y: 20, width: aheadW, height: H - 40, fill: PALETTE.vermilion, opacity: isCenter ? 0.08 : 0.14 }),
        el("line", { x1: px + 42, y1: 100, x2: W - 26, y2: 100, stroke: PALETTE.vermilion, "stroke-width": 2, "stroke-dasharray": "5 4" }),
        el("polygon", { points: `${W - 22},100 ${W - 33},94 ${W - 33},106`, fill: PALETTE.vermilion })
      );

      // 纯黑剪影侧脸轮廓（平滑弧线+鼻梁折角，绝无五官）
      const g = el("g", { transform: `translate(${px} 0)` });
      g.append(
        el("path", {
          d: "M-32,126 C-42,110 -40,68 -8,62 C22,56 36,74 36,92 L46,104 L34,110 C34,122 28,132 14,136 L14,158 C42,164 56,192 58,259 L-56,259 C-54,196 -38,168 -14,158 L-14,136 C-22,134 -28,130 -32,126 Z",
          fill: PALETTE.ink,
        })
      );
      frag.append(g);

      frag.append(
        el("text", { x: aheadX + aheadW / 2, y: 42, "text-anchor": "middle", fill: PALETTE.vermilionDeep, "font-size": 11, "font-family": "Space Grotesk, Noto Sans SC, sans-serif" }, `前方余地 ${Math.round((aheadW / W) * 100)}%`)
      );
    }

    svg.replaceChildren(frag);

    if (state.subject === "frontal" && isCenter) {
      outTitle.textContent = "正面剪影 × 居中：直接、笃定、有对峙感";
      outBody.textContent = "主体没有左右偏转，视线直迎观者。把它放在中轴正中，符合帕尔默团队（2008）观察到的居中偏好，气场最稳。";
    } else if (state.subject === "frontal" && !isCenter) {
      outTitle.textContent = "正面剪影 × 偏置：右侧大片空白失去指向";
      outBody.textContent = "正面主体没有朝右看的线索，强行往左挪后，右侧留白显得孤立——除非你在右侧专门排标题文字。";
    } else if (state.subject === "profile" && isCenter) {
      outTitle.textContent = "侧向剪影 × 死卡正中：前方空间略憋屈";
      outBody.textContent = "人物明确朝右，卡在正中时背后留了一大半无用空地，面向的前方却被压窄——画框像一堵贴近鼻尖的墙。";
    } else {
      outTitle.textContent = "侧向剪影 × 顺应朝向退半步：画面立刻通气";
      outBody.textContent = "把朝右的主体稍稍往左撤，让它面向画框内部（帕尔默 2008 所称「向内偏好」），视线和动势终于有了去处。";
    }
  }

  document.querySelectorAll('input[name="dir-sub"]').forEach((r) =>
    r.addEventListener("change", () => {
      if (r.checked) {
        state.subject = r.value;
        render();
      }
    })
  );
  document.querySelectorAll('input[name="dir-frame"]').forEach((r) =>
    r.addEventListener("change", () => {
      if (r.checked) {
        state.framing = r.value;
        render();
      }
    })
  );

  render();
}

// =========================================================================
// 小练习：四张「陶器展」海报草图（第 07 节）
// =========================================================================
function initQuiz() {
  const container = $("quiz");
  const titleEl = $("quiz-title");
  const textEl = $("quiz-text");
  if (!container) return;

  const VERDICTS = {
    A: {
      ok: false,
      title: "A · 失焦散乱：主体偏小偏沉，角落杂物抢走了重心",
      text: "陶瓶只占了很小一块且落偏几何中点下方，四角又堆了色块与粗框标签——居中构图最忌四周喧宾夺主，视线一进来就被角标拉走了。",
    },
    B: {
      ok: true,
      title: "B · 居中成立！光学中心落点、体量饱满、四周纯净",
      text: "正立陶瓶放在略高于几何中点的光学中心，高度约占画幅四成多，四周留出干净均等的空白场域；底部一行克制细标题托底，稳重又不呆板。",
    },
    C: {
      ok: false,
      title: "C · 朝向撞框：长嘴茶壶朝右，却被硬卡在正中偏右",
      text: "带明确指向的壶嘴几乎顶到右侧边框，左边背后反倒空出一大截。这种强朝向的单主体不该死卡居中，需要顺应朝向往左退让（见 009 视线空间与 017 偏心构图）。",
    },
    D: {
      ok: false,
      title: "D · 过满憋闷：四周缓冲场消失，已滑向满幅压迫",
      text: "虽然左右正中，但陶瓶大到快撑破四边，看不到上下左右的呼吸边距。居中构图的安定感来自「主体被四周空白稳稳托住」，而不是把框塞满。",
    },
  };

  function drawCard(id, reveal) {
    const svg = $(`q-svg-${id}`);
    if (!svg) return;
    const W = 220;
    const H = 290;
    const frag = new DocumentFragment();

    frag.append(el("rect", { x: 1, y: 1, width: W - 2, height: H - 2, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.4 }));

    if (id === "A") {
      // 主体太小且沉底 + 四角杂物干扰
      frag.append(
        el("rect", { x: 12, y: 12, width: 54, height: 22, fill: PALETTE.ink }),
        el("circle", { cx: W - 28, cy: 28, r: 15, fill: PALETTE.vermilion }),
        el("rect", { x: 14, y: H - 42, width: 64, height: 24, fill: PALETTE.ink, opacity: 0.75 }),
        el("rect", { x: W - 64, y: H - 38, width: 50, height: 20, fill: PALETTE.vermilion, opacity: 0.85 }),
        // 过小偏沉的陶瓶
        el("ellipse", { cx: W / 2, cy: 176, rx: 16, ry: 22, fill: PALETTE.ink }),
        el("rect", { x: W / 2 - 7, y: 146, width: 14, height: 14, fill: PALETTE.ink }),
        el("rect", { x: W / 2 - 11, y: 142, width: 22, height: 5, fill: PALETTE.vermilion })
      );
    } else if (id === "B") {
      // 正确示范：光学中心（略高于 50%），饱满正立陶瓶，纯净留白，克制底字
      const cx = W / 2;
      const cy = H * 0.455;
      frag.append(
        el("circle", { cx, cy: cy + 4, r: 58, fill: PALETTE.vermilion, opacity: 0.14 }),
        // 经典对称高肩陶瓶
        el("path", {
          d: `M${cx - 14},${cy - 54} H${cx + 14} L${cx + 11},${cy - 34} C${cx + 38},${cy - 24} ${cx + 42},${cy + 24} ${cx + 22},${cy + 58} H${cx - 22} C${cx - 42},${cy + 24} ${cx - 38},${cy - 24} ${cx - 11},${cy - 34} Z`,
          fill: PALETTE.ink,
        }),
        el("rect", { x: cx - 18, y: cy - 58, width: 36, height: 6, fill: PALETTE.vermilion }),
        el("line", { x1: cx - 28, y1: cy + 6, x2: cx + 28, y2: cy + 6, stroke: PALETTE.vermilion, "stroke-width": 4 }),
        // 底部克制单行标题
        el("text", { x: cx, y: H - 36, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 11, "font-weight": 700, "letter-spacing": 3, "font-family": "Space Grotesk, Noto Sans SC, sans-serif" }, "VESSEL · 016"),
        el("line", { x1: cx - 20, y1: H - 24, x2: cx + 20, y2: H - 24, stroke: PALETTE.vermilion, "stroke-width": 2.4, "stroke-linecap": "round" })
      );
    } else if (id === "C") {
      // 长嘴茶壶朝右硬卡正中偏右，壶嘴贴死右框
      const cx = W * 0.56;
      const cy = H * 0.5;
      frag.append(
        // 壶身
        el("ellipse", { cx, cy: cy + 8, rx: 38, ry: 34, fill: PALETTE.ink }),
        // 壶盖
        el("rect", { x: cx - 18, y: cy - 30, width: 36, height: 7, fill: PALETTE.vermilion }),
        el("circle", { cx, cy: cy - 35, r: 5, fill: PALETTE.ink }),
        // 朝右长壶嘴几乎顶到右框
        el("path", { d: `M${cx + 34},${cy + 6} Q${cx + 64},${cy + 2} ${W - 8},${cy - 22} L${W - 12},${cy - 10} Q${cx + 62},${cy + 16} ${cx + 32},${cy + 22} Z`, fill: PALETTE.vermilion }),
        // 左侧把手
        el("path", { d: `M${cx - 34},${cy - 4} C${cx - 56},${cy - 6} ${cx - 56},${cy + 24} ${cx - 34},${cy + 22}`, fill: "none", stroke: PALETTE.ink, "stroke-width": 6 }),
        el("text", { x: W / 2, y: H - 30, "text-anchor": "middle", fill: PALETTE.inkMuted, "font-size": 10, "font-family": "Space Grotesk, sans-serif" }, "TEAPOT")
      );
    } else if (id === "D") {
      // 主体过大撑死四边，无缓冲呼吸
      const cx = W / 2;
      const cy = H * 0.5;
      frag.append(
        el("path", {
          d: `M${cx - 32},14 H${cx + 32} L${cx + 26},56 C${cx + 96},78 ${cx + 104},186 ${cx + 58},278 H${cx - 58} C${cx - 104},186 ${cx - 96},78 ${cx - 26},56 Z`,
          fill: PALETTE.ink,
        }),
        el("rect", { x: cx - 40, y: 6, width: 80, height: 12, fill: PALETTE.vermilion }),
        el("line", { x1: cx - 78, y1: cy + 8, x2: cx + 78, y2: cy + 8, stroke: PALETTE.vermilion, "stroke-width": 8 })
      );
    }

    // 选完后叠加辅助中线与诊断标记
    if (reveal) {
      frag.append(
        el("line", { x1: W / 2, y1: 6, x2: W / 2, y2: H - 6, stroke: PALETTE.vermilion, "stroke-opacity": 0.6, "stroke-width": 1, "stroke-dasharray": "4 4" }),
        el("line", { x1: 6, y1: H / 2, x2: W - 6, y2: H / 2, stroke: PALETTE.vermilion, "stroke-opacity": 0.45, "stroke-width": 1, "stroke-dasharray": "4 4" })
      );
      if (id === "B") {
        frag.append(el("line", { x1: 24, y1: H * 0.455, x2: W - 24, y2: H * 0.455, stroke: PALETTE.vermilion, "stroke-width": 1.6 }));
      }
      if (id === "C") {
        frag.append(el("circle", { cx: W - 10, cy: H * 0.5 - 16, r: 9, fill: "none", stroke: PALETTE.vermilion, "stroke-width": 2 }));
      }
    }

    svg.replaceChildren(frag);
  }

  for (const id of ["A", "B", "C", "D"]) drawCard(id, false);

  const buttons = [...container.querySelectorAll(".q-opt")];
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.opt;
      const v = VERDICTS[choice];
      if (!v) return;
      for (const id of ["A", "B", "C", "D"]) drawCard(id, true);
      buttons.forEach((b) => {
        const key = b.dataset.opt;
        const selected = b === btn;
        b.setAttribute("aria-pressed", String(selected));
        b.classList.toggle("is-correct", VERDICTS[key].ok);
        b.classList.toggle("is-wrong", selected && !VERDICTS[key].ok);
        const mark = b.querySelector(".q-mark");
        if (mark) mark.textContent = VERDICTS[key].ok ? "✓ 最佳" : selected ? "× 未中" : "";
      });
      titleEl.textContent = v.title;
      textEl.textContent = v.text;
      container.dataset.answered = "true";
    });
  });
}

// =========================================================================
// 原海报放大灯箱（支持拖动平移、点击关闭、Esc 关闭；图片 draggable="false"）
// =========================================================================
function initPosterLightbox() {
  const openBtn = $("poster-btn");
  const posterImg = $("poster");
  const lb = $("lightbox");
  const lbStage = $("lb-stage");
  const lbImg = $("lb-img");
  const closeBtn = $("lb-close");
  if (!openBtn || !posterImg || !lb || !lbImg) return;

  let tx = 0;
  let ty = 0;
  let scale = 1.45;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function open() {
    lbImg.src = posterImg.currentSrc || posterImg.src;
    tx = 0;
    ty = 0;
    scale = matchMedia("(max-width: 760px)").matches ? 1.15 : 1.4;
    applyTransform();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn?.focus({ preventScroll: true });
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.style.overflow = "";
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus({ preventScroll: true });
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);

  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target === lbStage) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });

  lbImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbImg.setPointerCapture(e.pointerId);
    lbImg.classList.add("panning");
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = clamp(e.clientX - sx, -420, 420);
    ty = clamp(e.clientY - sy, -520, 520);
    applyTransform();
  });
  const endPan = () => {
    dragging = false;
    lbImg.classList.remove("panning");
  };
  lbImg.addEventListener("pointerup", endPan);
  lbImg.addEventListener("pointercancel", endPan);

  lbStage?.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(scale + (e.deltaY < 0 ? 0.16 : -0.16), 1, 2.8);
      applyTransform();
    },
    { passive: false }
  );
}

export function initLabs() {
  initArnheimLab();
  initOpticalLab();
  initSwitchesLab();
  initTemperamentLab();
  initDirectionLab();
  initQuiz();
  initPosterLightbox();
}
