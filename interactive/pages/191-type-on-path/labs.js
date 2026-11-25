// 191 路径文字 · 01–07 节互动实验与原海报灯箱
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, text = null) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text !== null) n.textContent = text;
  return n;
}

// 沿着圆弧放字工具（SVG 逐字精确旋转，不依赖浏览器 textPath 差异）
function placeCharsOnArc(parent, chars, cx, cy, r, startDeg, stepDeg, opts = {}) {
  const {
    fontSize = 22,
    fill = "#032B26",
    fontFamily = '"Noto Sans SC", sans-serif',
    fontWeight = "700",
    inward = false,         // true 表示文字沿内侧顺读（用于圆徽下弧）
    showNormals = false,
    align = "baseline",     // "baseline" | "center" | "top"
    highlightCollided = false,
  } = opts;

  const lift = align === "center" ? 0 : align === "top" ? -fontSize * 0.48 : fontSize * 0.48;
  const gWrap = el("g");
  const count = chars.length;

  for (let i = 0; i < count; i++) {
    const deg = startDeg + i * stepDeg;
    const rad = (deg * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);
    const bx = cx + ux * r;
    const by = cy + uy * r;

    // 外弧：文字立在圆外，法线指向圆外；内弧：文字立在圆内（顺读下弧时字脚指向圆外、字顶指向圆心）
    const nx = inward ? -ux : ux;
    const ny = inward ? -uy : uy;
    const px = bx + nx * lift;
    const py = by + ny * lift;
    const rot = inward ? deg - 90 : deg + 90;

    if (showNormals) {
      const tipR = fontSize * 1.15;
      const lx = bx + nx * tipR;
      const ly = by + ny * tipR;
      gWrap.appendChild(el("line", {
        x1: bx.toFixed(1),
        y1: by.toFixed(1),
        x2: lx.toFixed(1),
        y2: ly.toFixed(1),
        stroke: highlightCollided ? "#EB6847" : "#136B52",
        "stroke-width": 1.3,
        "stroke-dasharray": "3 3",
        opacity: 0.72,
      }));
    }

    const t = el("text", {
      x: px.toFixed(1),
      y: py.toFixed(1),
      fill,
      "font-family": fontFamily,
      "font-size": fontSize,
      "font-weight": fontWeight,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      transform: `rotate(${rot.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})`,
    }, chars[i]);
    gWrap.appendChild(t);
  }
  parent.appendChild(gWrap);
}

// ==================== 01 节：法线扇形放大镜 ====================
export function initNormalLab() {
  const svg = document.getElementById("normal-svg");
  const cap = document.getElementById("normal-cap");
  const modeBtns = [...document.querySelectorAll("#lab-normal [data-nmode]")];
  const alignBtns = [...document.querySelectorAll("#lab-normal [data-nalign]")];
  let mode = "convex";
  let align = "baseline";
  const sample = [..."基线沿弧流动"];

  const COPY = {
    flat: "平直基线：所有法线彼此平行，字脚与字头间距比例为 1.00 : 1.00，字距天然均匀。",
    convex: "外凸拱弧（R = 190px）：法线向外张开呈折扇，字顶弧长比字脚多出约 15%——字头显得更松，视觉略显稀疏，实操中常需微微收紧字距。",
    concave: "内凹谷弧（R = 165px）：法线向圆心聚拢，字顶弧长比基线短了约 17%——字脚还分开，字顶已经彼此贴近，必须适度放宽字距才不显黑。",
    sharp: "急弯折点（R = 62px）：曲率半径接近字高 2 倍，内凹处字顶弧长暴缩近一半，汉字方块顶角直接相撞，靠调字距已救不回来，只能拉缓曲线。",
  };

  const ALIGN_NOTE = {
    baseline: "当前「底边贴轨」：字脚踩在路径上，文字整体位于弧线外侧或内侧，离圆心距离变化最大。",
    center: "当前「字中穿轨」：路径穿过字身中心，上半字与下半字的拉伸变形各自减半，双弧徽章里很实用。",
    top: "当前「顶边挂轨」：字顶挂在轨道上，外凸弧时字脚反而向圆心收拢，适合悬挂式装饰标题。",
  };

  function render() {
    svg.innerHTML = "";
    const fs = 28;
    // 背景轻格
    svg.appendChild(el("rect", { x: 0, y: 0, width: 680, height: 280, fill: "#FAFBF2" }));

    if (mode === "flat") {
      svg.appendChild(el("line", { x1: 90, y1: 175, x2: 590, y2: 175, stroke: "#032B26", "stroke-width": 4, "stroke-linecap": "round" }));
      const lift = align === "center" ? 0 : align === "top" ? 16 : -18;
      sample.forEach((ch, i) => {
        const x = 165 + i * 70;
        svg.appendChild(el("line", { x1: x, y1: 175, x2: x, y2: 112, stroke: "#136B52", "stroke-width": 1.3, "stroke-dasharray": "3 3" }));
        svg.appendChild(el("text", {
          x, y: 175 + lift, fill: "#032B26", "font-family": '"Noto Sans SC", sans-serif',
          "font-size": fs, "font-weight": 900, "text-anchor": "middle", "dominant-baseline": "central",
        }, ch));
      });
      svg.appendChild(el("text", { x: 340, y: 244, fill: "#264F47", "font-family": '"Space Mono", monospace', "font-size": 12, "text-anchor": "middle" }, "R = ∞  ·  字顶弧长 / 基线弧长 = 1.00×"));
    } else if (mode === "convex") {
      const cx = 340, cy = 286, r = 190;
      svg.appendChild(el("path", { d: "M 176 190 A 190 190 0 0 1 504 190", fill: "none", stroke: "#032B26", "stroke-width": 4, "stroke-linecap": "round" }));
      svg.appendChild(el("path", { d: "M 148 172 A 222 222 0 0 1 532 172", fill: "none", stroke: "#EB6847", "stroke-width": 1.4, "stroke-dasharray": "4 4" }));
      placeCharsOnArc(svg, sample, cx, cy, r, -120, 12, { fontSize: fs, fontWeight: "900", showNormals: true, align });
      svg.appendChild(el("text", { x: 340, y: 244, fill: "#136B52", "font-family": '"Space Mono", monospace', "font-size": 12, "text-anchor": "middle" }, "R = 190px  ·  外凸字顶撑宽 ≈ 1.15×"));
    } else if (mode === "concave") {
      const cx = 340, cy = 12, r = 186;
      svg.appendChild(el("path", { d: "M 182 110 A 186 186 0 0 0 498 110", fill: "none", stroke: "#032B26", "stroke-width": 4, "stroke-linecap": "round" }));
      svg.appendChild(el("path", { d: "M 208 96 A 154 154 0 0 0 472 96", fill: "none", stroke: "#EB6847", "stroke-width": 1.4, "stroke-dasharray": "4 4" }));
      // 内凹顺读：从左到右为角度 122° 递减到 58°
      placeCharsOnArc(svg, sample, cx, cy, r, 120, -12, { fontSize: fs, fontWeight: "900", inward: true, showNormals: true, align, highlightCollided: true });
      svg.appendChild(el("text", { x: 340, y: 248, fill: "#B63B1D", "font-family": '"Space Mono", monospace', "font-size": 12, "text-anchor": "middle" }, "R = 186px  ·  内凹字顶收窄 ≈ 0.85×"));
    } else {
      const cx = 340, cy = 78, r = 72;
      svg.appendChild(el("path", { d: "M 268 78 A 72 72 0 0 0 412 78", fill: "none", stroke: "#032B26", "stroke-width": 4, "stroke-linecap": "round" }));
      svg.appendChild(el("circle", { cx, cy, r: 40, fill: "rgba(235,104,71,0.14)", stroke: "#EB6847", "stroke-width": 1.4, "stroke-dasharray": "4 4" }));
      placeCharsOnArc(svg, sample, cx, cy, r, 146, -22.5, { fontSize: fs, fontWeight: "900", inward: true, showNormals: true, align, highlightCollided: true });
      svg.appendChild(el("text", { x: 340, y: 244, fill: "#B63B1D", "font-family": '"Space Mono", monospace', "font-size": 12, "text-anchor": "middle" }, "R = 72px  ·  字顶弧长仅基线的 0.56×（顶角真实相撞）"));
    }

    cap.textContent = `${COPY[mode]} ${ALIGN_NOTE[align]}`;
  }

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      mode = b.dataset.nmode;
      for (const x of modeBtns) {
        const on = x === b;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", String(on));
      }
      render();
    });
  }
  for (const b of alignBtns) {
    b.addEventListener("click", () => {
      align = b.dataset.nalign;
      for (const x of alignBtns) {
        const on = x === b;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", String(on));
      }
      render();
    });
  }
  render();
}

// ==================== 02 节：四时代路径标本时间拨盘 ====================
export function initEraDeck() {
  const svg = document.getElementById("era-svg");
  const elYear = document.getElementById("era-year");
  const elTitle = document.getElementById("era-title");
  const elDesc = document.getElementById("era-desc");
  const elLesson = document.getElementById("era-lesson");
  const tabs = [...document.querySelectorAll("#era-deck .era-tab")];

  const ERAS = [
    {
      year: "c. 6th Century BCE",
      title: "古希腊与罗马钱币的环形铭文",
      desc: "大英博物馆所藏古希腊城邦与罗马帝国钱币普遍采用沿圆周边缘排列的环形铭文（legend），让城邦名或统治者头衔顺着凸起币缘环抱中央徽记或侧像。",
      lesson: "启示：环形路径天生适配圆形边界，能把边缘留白变成信息带。",
      draw(s) {
        s.appendChild(el("circle", { cx: 210, cy: 120, r: 94, fill: "#E5ECD7", stroke: "#032B26", "stroke-width": 3 }));
        s.appendChild(el("circle", { cx: 210, cy: 120, r: 64, fill: "none", stroke: "#99B399", "stroke-width": 1.2, "stroke-dasharray": "3 3" }));
        // 简约橄榄叶剪影（无五官）
        s.appendChild(el("path", { d: "M 186 148 C 198 118, 214 96, 236 86 C 228 118, 212 140, 186 148 Z", fill: "#032B26" }));
        s.appendChild(el("path", { d: "M 184 150 L 238 84", stroke: "#EB6847", "stroke-width": 2 }));
        placeCharsOnArc(s, [..."IMPERATOR · ROMA ·"], 210, 120, 74, -155, 19, {
          fontSize: 13, fontFamily: '"DM Serif Display", serif', fontWeight: "400", fill: "#032B26",
        });
      },
    },
    {
      year: "1796 — 1818",
      title: "石版印刷解放自由弧线标题",
      desc: "阿洛伊斯·塞内费尔德于 1796 年发明石版印刷，1818 年出版《石版印刷全书》。画家可以直接在石灰石板上勾画弧形、丝带与斜飞的文字，彻底摆脱活字铁框的纵横枷锁。",
      lesson: "启示：19 世纪彩色石版海报证明，一条流畅拱标比整块装饰边框更有号召力。",
      draw(s) {
        s.appendChild(el("rect", { x: 26, y: 18, width: 368, height: 204, rx: 4, fill: "#FAFBF2", stroke: "#032B26", "stroke-width": 2 }));
        s.appendChild(el("path", { d: "M 56 148 Q 210 46 364 148", fill: "none", stroke: "#EB6847", "stroke-width": 2.4 }));
        s.appendChild(el("path", { d: "M 74 166 Q 210 82 346 166", fill: "none", stroke: "#C1D2BE", "stroke-width": 1.5, "stroke-dasharray": "4 4" }));
        placeCharsOnArc(s, [..."LITHOGRAPHIE"], 210, 276, 174, -118, 5.2, {
          fontSize: 22, fontFamily: '"DM Serif Display", serif', fontWeight: "400", fill: "#032B26",
        });
        s.appendChild(el("text", { x: 210, y: 178, fill: "#B63B1D", "font-family": '"Space Mono", monospace', "font-size": 11, "text-anchor": "middle" }, "MUNICH · 1796–1818"));
      },
    },
    {
      year: "1962 / 1975",
      title: "伊姆霍夫的河流曲线注记法则",
      desc: "瑞士制图学家爱德华·伊姆霍夫在《地图注记配置》（1962 德文版，1975 英译刊于《美国制图师》）中明确提出：河流名称应顺着河道平滑走势弯曲，略过局部急折小弯，且绝不倒立。",
      lesson: "启示：路径不必死贴真实轮廓的每个抖动，先平滑出主趋势，字才能一口气读通。",
      draw(s) {
        // 真实抖动细河道 vs 平滑注记基线
        s.appendChild(el("path", { d: "M 26 172 C 74 176, 82 118, 134 128 C 186 138, 198 188, 250 144 C 296 102, 314 68, 394 82", fill: "none", stroke: "#A8C3B4", "stroke-width": 16, "stroke-linecap": "round" }));
        s.appendChild(el("path", { d: "M 32 162 C 110 148, 220 142, 384 74", fill: "none", stroke: "#EB6847", "stroke-width": 1.6, "stroke-dasharray": "4 4" }));
        const pts = [
          [78, 140, -10, "长"], [126, 132, -8, "江"], [174, 126, -12, "下"],
          [222, 115, -20, "游"], [270, 98, -24, "河"], [318, 80, -18, "段"],
        ];
        for (const [x, y, rot, ch] of pts) {
          s.appendChild(el("text", {
            x, y, fill: "#032B26", "font-family": '"Noto Sans SC", sans-serif',
            "font-size": 17, "font-weight": 700, "text-anchor": "middle",
            transform: `rotate(${rot} ${x} ${y})`,
          }, ch));
        }
        s.appendChild(el("text", { x: 210, y: 214, fill: "#264F47", "font-family": '"Noto Sans SC", sans-serif', "font-size": 11.5, "text-anchor": "middle" }, "虚线为简化后的平滑注记轨，刻意避开河道小弯"));
      },
    },
    {
      year: "1990 / 2001",
      title: "矢量贝塞尔与网页 SVG textPath",
      desc: "1988 年 Aldus FreeHand 与 1990 年 Adobe Illustrator 3.0 让设计师把文字直接挂到三次贝塞尔曲线上；2001 年 9 月 4 日 W3C 发布 SVG 1.0 推荐标准，用 <textPath> 把这套能力带进了浏览器。",
      lesson: "启示：工具只负责把字挂上去，曲率半径、倒字与字距补偿仍要靠人眼把关。",
      draw(s) {
        s.appendChild(el("path", { d: "M 48 176 C 148 214, 232 34, 368 78", fill: "none", stroke: "#032B26", "stroke-width": 3.5 }));
        s.appendChild(el("line", { x1: 48, y1: 176, x2: 148, y2: 214, stroke: "#EB6847", "stroke-width": 1.4, "stroke-dasharray": "3 3" }));
        s.appendChild(el("line", { x1: 368, y1: 78, x2: 232, y2: 34, stroke: "#EB6847", "stroke-width": 1.4, "stroke-dasharray": "3 3" }));
        for (const [cx, cy, fill] of [[48, 176, "#032B26"], [368, 78, "#032B26"], [148, 214, "#EB6847"], [232, 34, "#EB6847"]]) {
          s.appendChild(el("circle", { cx, cy, r: 5.5, fill }));
        }
        const tags = [[102, 166, -12, "<"], [126, 158, -24, "t"], [148, 146, -32, "e"], [170, 130, -34, "x"], [192, 112, -32, "t"], [216, 95, -24, "P"], [242, 82, -16, "a"], [268, 74, -8, "t"], [294, 70, 2, "h"], [318, 71, 8, ">"]];
        for (const [x, y, rot, ch] of tags) {
          s.appendChild(el("text", {
            x, y, fill: "#032B26", "font-family": '"Space Mono", monospace', "font-size": 19, "font-weight": 700,
            "text-anchor": "middle", transform: `rotate(${rot} ${x} ${y})`,
          }, ch));
        }
        s.appendChild(el("text", { x: 210, y: 226, fill: "#264F47", "font-family": '"Space Mono", monospace', "font-size": 11, "text-anchor": "middle" }, "W3C SVG 1.0 · 2001-09-04"));
      },
    },
  ];

  function select(idx) {
    const item = ERAS[idx] || ERAS[0];
    svg.innerHTML = "";
    item.draw(svg);
    elYear.textContent = item.year;
    elTitle.textContent = item.title;
    elDesc.textContent = item.desc;
    elLesson.textContent = item.lesson;
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => select(Number(t.dataset.era)));
  });
  select(0);
}

// ==================== 03 节：双轨圆徽翻面器（深墨暗版） ====================
export function initSealLab() {
  const svg = document.getElementById("seal-svg");
  const elStatus = document.getElementById("seal-status");
  const elExplain = document.getElementById("seal-explain");
  const btnSplit = document.getElementById("tog-split");
  const btnShift = document.getElementById("tog-shift");
  const btnKern = document.getElementById("tog-kern");
  const btnGuides = document.getElementById("tog-guides");
  const radBtns = [...document.querySelectorAll("#seal-lab [data-srad]")];

  const st = { split: false, shift: false, kern: false, guides: true, radius: "large" };
  const topText = [..."杭州西湖印社"];
  const botText = [..."HANGZHOU · 2026"];

  function syncBtn(btn, on) {
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
    const badge = btn.querySelector("[data-state]");
    if (badge) badge.textContent = on ? "开" : "关";
  }

  function render() {
    svg.innerHTML = "";
    const cx = 190, cy = 190;
    const baseR = st.radius === "large" ? 118 : 86;
    const fsTop = st.radius === "large" ? 21 : 17;
    const fsBot = st.radius === "large" ? 16 : 13.5;

    // 外装饰双圆框
    svg.appendChild(el("circle", { cx, cy, r: baseR + 40, fill: "#06201B", stroke: "#2E685C", "stroke-width": 1.6 }));
    svg.appendChild(el("circle", { cx, cy, r: baseR - 22, fill: "none", stroke: "#2E685C", "stroke-width": 1.2 }));

    // 中心简约印章几何纹（无五官）
    svg.appendChild(el("path", {
      d: `M ${cx - 26} ${cy + 14} C ${cx - 8} ${cy - 22}, ${cx + 8} ${cy - 22}, ${cx + 26} ${cy + 14}`,
      fill: "none", stroke: "#FF8869", "stroke-width": 2.4, "stroke-linecap": "round",
    }));
    svg.appendChild(el("circle", { cx, cy: cy - 16, r: 5, fill: "#FF8869" }));
    svg.appendChild(el("text", {
      x: cx, y: cy + 32, fill: "#C0D6CA", "font-family": '"Space Mono", monospace', "font-size": 10.5, "text-anchor": "middle",
    }, `R = ${baseR}px`));

    // 同心基准辅线（标出字中轴应落到的统一环带）
    if (st.guides) {
      const targetMidR = baseR + fsTop * 0.48;
      svg.appendChild(el("circle", {
        cx, cy, r: targetMidR, fill: "none", stroke: "#69DBB6", "stroke-width": 1.2, "stroke-dasharray": "4 4", opacity: 0.75,
      }));
      svg.appendChild(el("circle", {
        cx, cy, r: baseR, fill: "none", stroke: "#FF8869", "stroke-width": 1, "stroke-dasharray": "2 4", opacity: 0.55,
      }));
    }

    // 上弧（外凸顺读）
    const topStep = st.radius === "large" ? 16 : 20;
    const topStart = -90 - ((topText.length - 1) * topStep) * 0.5;
    placeCharsOnArc(svg, topText, cx, cy, baseR, topStart, topStep, {
      fontSize: fsTop, fill: "#F2F6E7", fontWeight: "700", inward: false, align: "baseline",
    });

    // 下弧：视三步开关决定呈现方式
    if (!st.split) {
      // 单圆硬绕：按顺时针继续走过底部（从右下到左下），字头朝下倒立！
      const step = st.radius === "large" ? 8.2 : 10.6;
      const start = 90 - ((botText.length - 1) * step) * 0.5;
      placeCharsOnArc(svg, botText, cx, cy, baseR, start, step, {
        fontSize: fsBot, fill: "#FF8869", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: "700",
        inward: false, align: "baseline",
      });
      // 倒立方向提示箭头
      svg.appendChild(el("text", { x: cx, y: 362, fill: "#FF8869", "font-family": '"Space Mono", monospace', "font-size": 11, "text-anchor": "middle" }, "↓ 下弧头朝下倒立（同一条顺时针路径）"));
    } else {
      // 拆成逆向内凹下轨：从左下向右读（角度递减）
      const botR = st.shift ? baseR + fsTop * 0.92 : baseR;
      const baseStep = st.radius === "large" ? 6.6 : 8.8;
      const step = st.kern ? baseStep * 1.26 : baseStep * 0.86;
      const start = 90 + ((botText.length - 1) * step) * 0.5;
      placeCharsOnArc(svg, botText, cx, cy, botR, start, -step, {
        fontSize: fsBot,
        fill: st.shift && st.kern ? "#69DBB6" : "#F2F6E7",
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontWeight: "700",
        inward: true,
        align: "baseline",
      });
      const hint = !st.shift
        ? "方向正了，但下弧掉进绿色基准环内侧"
        : !st.kern
          ? "圆环对齐了，但内凹下弧字顶挤偏黑"
          : "✓ 正向顺读 · 同心对齐 · 呼吸匀称";
      svg.appendChild(el("text", {
        x: cx, y: 362, fill: st.shift && st.kern ? "#69DBB6" : "#FF8869",
        "font-family": '"Noto Sans SC", sans-serif', "font-size": 11.5, "text-anchor": "middle",
      }, hint));
    }

    syncBtn(btnSplit, st.split);
    syncBtn(btnShift, st.shift);
    syncBtn(btnKern, st.kern);
    btnGuides.textContent = st.guides ? "同心辅线：开" : "同心辅线：关";
    btnGuides.classList.toggle("is-on", st.guides);
    btnGuides.setAttribute("aria-pressed", String(st.guides));
    radBtns.forEach((b) => {
      const on = b.dataset.srad === st.radius;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const ok = st.split && st.shift && st.kern;
    elStatus.classList.toggle("is-ok", ok);
    if (!st.split) {
      elStatus.textContent = "错态：单圆硬绕，下弧整行倒立";
      elExplain.textContent = "整圆路径沿着顺时针拐过 6 点钟方向时，字符也跟着旋转了 180°。哪怕只是给它补基线偏移或字距，只要不拆成反向双轨，读者依然要倒着歪头读。";
    } else if (!st.shift) {
      elStatus.textContent = "差两步：字翻正了，但上下环带错位";
      elExplain.textContent = "绿色虚线标出了上弧字体的视觉中轴。拆成反向内弧后，下弧挂在圆轨内侧，整体缩进了一圈；开启 STEP 2 把下弧基线向外推齐。";
    } else if (!st.kern) {
      elStatus.textContent = "差一步：内凹下弧显得比上弧偏紧";
      elExplain.textContent = "外凸上弧字顶扇形张开，内凹下弧字顶向圆心挤拢——两段字号完全相同，肉眼看下排却明显偏黑。开启 STEP 3 放宽下弧字距。";
    } else {
      elStatus.textContent = st.radius === "tight"
        ? "三步成立（小章下更能看出字距补偿的救场效果）"
        : "三步成立：上下同环、顺读自然、松紧一致";
      elExplain.textContent = "上弧外凸、下弧内凹反向，靠基线外移把两段拉回同一条绿色视觉环带，再用正字距抵消内凹挤压。切到「紧凑小章」试试，小半径下这一步更关键。";
    }
  }

  btnSplit.addEventListener("click", () => { st.split = !st.split; render(); });
  btnShift.addEventListener("click", () => { st.shift = !st.shift; render(); });
  btnKern.addEventListener("click", () => { st.kern = !st.kern; render(); });
  btnGuides.addEventListener("click", () => { st.guides = !st.guides; render(); });
  radBtns.forEach((b) => b.addEventListener("click", () => { st.radius = b.dataset.srad; render(); }));
  render();
}

// ==================== 04 节：动势轨迹扫视台 ====================
export function initFlowLab() {
  const canvas = document.getElementById("flow-canvas");
  const wrap = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const cap = document.getElementById("flow-cap");
  const sceneBtns = [...document.querySelectorAll("#flow-scene-group button")];
  const btnCompare = document.getElementById("flow-compare");
  const btnReplay = document.getElementById("flow-replay");

  let sceneId = "cup";
  let flatMode = false;
  let progress = reducedMotion.matches ? 0.85 : 0;
  let playing = !reducedMotion.matches;

  const SCENES = {
    cup: {
      text: "清晨现烘 · 慢煮时光",
      capPath: "咖啡杯套的浅下凹弧与纸杯锥面曲率吻合，贴上杯身时在人眼看来恰好舒展水平，并把视线自然托向杯面中央。",
      capFlat: "平排对比：硬直横条贴在锥形杯套上反而显得两头下垂，少了贴合器物形体的包裹感。",
      evalPt(u) {
        const x = 198 + u * 284;
        const y = 148 + Math.sin(u * Math.PI) * 38;
        const dx = 284;
        const dy = Math.cos(u * Math.PI) * Math.PI * 38;
        return { x, y, a: Math.atan2(dy, dx) };
      },
      bg(c) {
        c.fillStyle = "#EBF0E0";
        c.beginPath();
        c.moveTo(150, 56);
        c.lineTo(530, 56);
        c.lineTo(486, 268);
        c.lineTo(194, 268);
        c.closePath();
        c.fill();
        c.strokeStyle = "#032B26";
        c.lineWidth = 2;
        c.stroke();
      },
    },
    river: {
      text: "富 春 江 烟 雨 航 道",
      capPath: "地图河道注记遵循伊姆霍夫原则：文字顺着河水主弯拉开字距，一眼就把河流的起止长度与流向说清。",
      capFlat: "平排对比：水平文字横穿弯曲河岸，读者无法一眼判断它标的是河段、左岸还是右侧山地。",
      evalPt(u) {
        const x = 86 + u * 508;
        const y = 212 - u * 96 + Math.sin(u * Math.PI * 1.65) * 42;
        const dx = 508;
        const dy = -96 + Math.cos(u * Math.PI * 1.65) * Math.PI * 1.65 * 42;
        return { x, y, a: Math.atan2(dy, dx) };
      },
      bg(c) {
        c.strokeStyle = "#C1D2BE";
        c.lineWidth = 34;
        c.lineCap = "round";
        c.beginPath();
        for (let i = 0; i <= 40; i++) {
          const u = i / 40;
          const x = 86 + u * 508;
          const y = 212 - u * 96 + Math.sin(u * Math.PI * 1.65) * 42;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      },
    },
    poster: {
      text: "夏夜声波现场 · LIVE",
      capPath: "海报斜扬路径借助向上加速的切线，把目光从左下角一路推向右上焦点，自带声浪起伏的节拍感。",
      capFlat: "平排对比：拉平后信息一样能读，但整张海报的能量线断了，变成了安静呆板的标题条。",
      evalPt(u) {
        const x = 104 + u * 472;
        const y = 238 - u * 136 - Math.sin(u * Math.PI) * 34;
        const dx = 472;
        const dy = -136 - Math.cos(u * Math.PI) * Math.PI * 34;
        return { x, y, a: Math.atan2(dy, dx) };
      },
      bg(c) {
        c.fillStyle = "rgba(235, 104, 71, 0.14)";
        c.beginPath();
        c.arc(580, 96, 56, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#EB6847";
        c.beginPath();
        c.arc(580, 96, 14, 0, Math.PI * 2);
        c.fill();
      },
    },
    stamp: {
      text: "手作烘焙 · 当日出炉",
      capPath: "封签拱弧把视线环抱在中央标志四周，让外框和标题合二为一，省去多余边框装饰。",
      capFlat: "平排对比：横排文字和圆形封签轮廓各走各的，上方与左右留出尴尬的月牙形碎角。",
      evalPt(u) {
        const ang = (-148 + u * 116) * (Math.PI / 180);
        const cx = 340, cy = 226, r = 136;
        return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, a: ang + Math.PI * 0.5 };
      },
      bg(c) {
        c.strokeStyle = "#B2C6AF";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(340, 226, 152, Math.PI * 1.05, Math.PI * 1.95);
        c.stroke();
        c.fillStyle = "#032B26";
        c.beginPath();
        c.arc(340, 206, 28, 0, Math.PI * 2);
        c.fill();
      },
    },
  };

  function evalCurrent(u) {
    if (flatMode) return { x: 130 + u * 420, y: 164, a: 0 };
    return SCENES[sceneId].evalPt(u);
  }

  function resize() {
    const r = wrap.getBoundingClientRect();
    const dpr = pixelRatio(r.width < 560 ? 1.5 : 2);
    const pw = Math.max(240, Math.round(r.width * dpr));
    const ph = Math.max(120, Math.round(r.height * dpr));
    if (canvas.width === pw && canvas.height === ph) return;
    canvas.width = pw;
    canvas.height = ph;
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const sx = w / 680;
    const sy = h / 320;
    const scale = Math.min(sx, sy);
    const ox = (w - 680 * scale) * 0.5;
    const oy = (h - 320 * scale) * 0.5;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const sc = SCENES[sceneId];
    sc.bg(ctx);

    // 淡基线轨
    ctx.strokeStyle = flatMode ? "rgba(3,43,38,0.22)" : "rgba(3,43,38,0.42)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const pt = evalCurrent(i / 48);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 视线扫视尾迹
    const p = Math.max(0.02, Math.min(1, progress));
    ctx.strokeStyle = "#EB6847";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    const tailStart = Math.max(0, p - 0.34);
    for (let i = 0; i <= 26; i++) {
      const u = tailStart + (p - tailStart) * (i / 26);
      const pt = evalCurrent(u);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // 沿路径绘制字符
    const chars = [...sc.text];
    ctx.font = '900 24px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    chars.forEach((ch, i) => {
      const u = 0.06 + (i / Math.max(1, chars.length - 1)) * 0.88;
      const pt = evalCurrent(u);
      const nx = Math.sin(pt.a);
      const ny = -Math.cos(pt.a);
      const lit = Math.abs(u - p) < 0.09;
      ctx.save();
      ctx.translate(pt.x + nx * 20, pt.y + ny * 20);
      ctx.rotate(pt.a);
      ctx.fillStyle = lit ? "#B63B1D" : "#032B26";
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    // 朱橘视点光球
    const head = evalCurrent(p);
    ctx.fillStyle = "#EB6847";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FAFBF2";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  function syncText() {
    const sc = SCENES[sceneId];
    cap.textContent = flatMode ? sc.capFlat : sc.capPath;
    btnCompare.textContent = flatMode ? "恢复路径曲线" : "切平直排对比";
    btnCompare.classList.toggle("is-on", flatMode);
    btnCompare.setAttribute("aria-pressed", String(flatMode));
    sceneBtns.forEach((b) => {
      const on = b.dataset.scene === sceneId;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  sceneBtns.forEach((b) => {
    b.addEventListener("click", () => {
      sceneId = b.dataset.scene;
      progress = reducedMotion.matches ? 0.82 : 0;
      playing = !reducedMotion.matches;
      syncText();
      runner.draw();
    });
  });

  btnCompare.addEventListener("click", () => {
    flatMode = !flatMode;
    progress = reducedMotion.matches ? 0.82 : 0;
    playing = !reducedMotion.matches;
    syncText();
    runner.draw();
  });

  btnReplay.addEventListener("click", () => {
    progress = 0;
    playing = !reducedMotion.matches;
    if (reducedMotion.matches) progress = 0.82;
    runner.draw();
  });

  const ro = new ResizeObserver(() => { resize(); runner.draw(); });
  ro.observe(wrap);
  resize();
  syncText();

  const runner = loop(canvas, (_t, dt, { still }) => {
    if (still) {
      progress = 0.82;
      draw();
      return;
    }
    if (playing) {
      progress += Math.max(dt, 0.016) * 0.44;
      if (progress >= 1) {
        progress = 1;
        playing = false;
      }
      draw();
    }
  });
}

// ==================== 05 节：何时不用对照台 ====================
export function initBanLab() {
  const svg = document.getElementById("ban-svg");
  const cap = document.getElementById("ban-cap");
  const tabs = [...document.querySelectorAll("#ban-tabs button")];
  const toggleBtn = document.getElementById("ban-toggle");
  let active = "terms";
  let straightened = false;

  const CASES = {
    terms: {
      btnBad: "拉平看差距",
      btnGood: "切回波浪错排",
      capBad: "反例：38 字活动条款硬塞进高频波浪，每扫过三四个字眼球就要翻一次倾角，读到后半句几乎失去耐心。",
      capGood: "改回平排左对齐：横向基线让眼睛一次扫过一整词组，阅读速度立刻恢复，条款信息不漏读。",
      draw(s, flat) {
        const line1 = "活动期间单笔消费满一百元可凭小票于服务台兑换限定帆布袋，";
        const line2 = "每人每日限领一件，赠完即止，最终解释权归主办方所有。";
        if (flat) {
          s.appendChild(el("rect", { x: 48, y: 36, width: 584, height: 158, rx: 6, fill: "#F6F8EA", stroke: "#136B52", "stroke-width": 1.8 }));
          s.appendChild(el("text", { x: 76, y: 80, fill: "#136B52", "font-size": 12, "font-weight": 700 }, "✓ 建议：长句条款回到水平左对齐"));
          s.appendChild(el("text", { x: 76, y: 122, fill: "#032B26", "font-size": 17, "font-weight": 700 }, line1));
          s.appendChild(el("text", { x: 76, y: 154, fill: "#032B26", "font-size": 17, "font-weight": 700 }, line2));
        } else {
          const full = [...(line1 + line2)];
          s.appendChild(el("rect", { x: 48, y: 24, width: 584, height: 182, rx: 6, fill: "#FDF3EF", stroke: "#EB6847", "stroke-width": 1.6 }));
          s.appendChild(el("path", { d: "M 64 118 Q 124 44 184 118 T 304 118 T 424 118 T 544 118 T 616 118", fill: "none", stroke: "#EB6847", "stroke-width": 1.2, "stroke-dasharray": "3 3" }));
          full.slice(0, 32).forEach((ch, i) => {
            const u = i / 31;
            const x = 72 + u * 536;
            const phase = u * Math.PI * 5;
            const y = 118 - Math.sin(phase) * 44;
            const rot = (-Math.cos(phase) * 44 * Math.PI * 5 / 536) * (180 / Math.PI);
            s.appendChild(el("text", {
              x: x.toFixed(1), y: y.toFixed(1), fill: "#032B26", "font-size": 15, "font-weight": 700,
              "text-anchor": "middle", transform: `rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`,
            }, ch));
          });
          s.appendChild(el("text", { x: 340, y: 192, fill: "#B63B1D", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "× 字多 + 高频波浪：每字倾角剧变，后段还被裁断"));
        }
      },
    },
    label: {
      btnBad: "拉平看差距",
      btnGood: "切回弯弧小字",
      capBad: "反例：12px 配料与热量参数排在弯弧上，数字既无法按列比对，倾斜笔画在小字号下也容易发虚。",
      capGood: "改回水平对齐列表：名称左齐、克数右齐，一秒扫完关键营养数据。",
      draw(s, flat) {
        if (flat) {
          s.appendChild(el("rect", { x: 140, y: 30, width: 400, height: 170, rx: 6, fill: "#F6F8EA", stroke: "#136B52", "stroke-width": 1.8 }));
          s.appendChild(el("text", { x: 168, y: 64, fill: "#136B52", "font-size": 12, "font-weight": 700 }, "✓ 建议：小字与数据坚持水平对齐"));
          [["生牛乳", "72%"], ["冷萃浓缩咖啡", "24%"], ["冰博克淡奶油", "4%"]].forEach(([k, v], i) => {
            const y = 104 + i * 32;
            s.appendChild(el("text", { x: 168, y, fill: "#032B26", "font-size": 14, "font-weight": 700 }, k));
            s.appendChild(el("text", { x: 512, y, fill: "#032B26", "font-family": '"Space Mono", monospace', "font-size": 14, "font-weight": 700, "text-anchor": "end" }, v));
            s.appendChild(el("line", { x1: 168, y1: y + 10, x2: 512, y2: y + 10, stroke: "#C1D2BE", "stroke-width": 1 }));
          });
        } else {
          s.appendChild(el("rect", { x: 140, y: 24, width: 400, height: 182, rx: 6, fill: "#FDF3EF", stroke: "#EB6847", "stroke-width": 1.6 }));
          placeCharsOnArc(s, [..."生牛乳72% · 冷萃咖啡24% · 淡奶油4%"], 340, 126, 62, -162, 13.5, {
            fontSize: 12, fontWeight: "700", fill: "#032B26",
          });
          s.appendChild(el("text", { x: 340, y: 192, fill: "#B63B1D", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "× 小字弯排：比例数字散在圆周各处，核对极慢"));
        }
      },
    },
    badge: {
      btnBad: "拉平看差距",
      btnGood: "切回微弧路径",
      capBad: "正面对比：只有 6 个字的短句印章恰恰是路径文字的主场——字少、弯缓、字号足，反而比死直横排更有标志记忆点。",
      capGood: "硬拉直后虽然清晰，却和圆形杯贴脱节了；短标在舒缓大半径上完全值得用路径文字。",
      draw(s, flat) {
        s.appendChild(el("circle", { cx: 340, cy: 122, r: 90, fill: "#F6F8EA", stroke: flat ? "#B2C6AF" : "#136B52", "stroke-width": 2 }));
        if (flat) {
          s.appendChild(el("text", { x: 340, y: 112, fill: "#032B26", "font-size": 21, "font-weight": 900, "text-anchor": "middle" }, "山谷手冲咖啡"));
          s.appendChild(el("text", { x: 340, y: 146, fill: "#264F47", "font-size": 12, "text-anchor": "middle" }, "字少时拉平虽清楚，但与圆框互不呼应"));
        } else {
          placeCharsOnArc(s, [..."山谷手冲咖啡"], 340, 146, 86, -125, 14, {
            fontSize: 22, fontWeight: "900", fill: "#032B26",
          });
          s.appendChild(el("text", { x: 340, y: 148, fill: "#136B52", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "✓ 短标配大半径拱弧：图文合一"));
        }
      },
    },
  };

  function render() {
    svg.innerHTML = "";
    svg.appendChild(el("rect", { x: 0, y: 0, width: 680, height: 230, fill: "#FFFFFF" }));
    const c = CASES[active];
    c.draw(svg, straightened);
    cap.textContent = straightened ? c.capGood : c.capBad;
    toggleBtn.textContent = straightened ? c.btnGood : c.btnBad;
    toggleBtn.setAttribute("aria-pressed", String(straightened));
    tabs.forEach((t) => {
      const on = t.dataset.ban === active;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => {
    active = t.dataset.ban;
    straightened = false;
    render();
  }));
  toggleBtn.addEventListener("click", () => {
    straightened = !straightened;
    render();
  });
  render();
}

// ==================== 06 节：四枚圆章辨错练习 ====================
export function initPractice() {
  const cards = [...document.querySelectorAll("#quiz-grid .quiz-card")];
  const verdict = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("qv-title");
  const vBody = document.getElementById("qv-body");

  const CORRECT = "C";
  let picked = null;

  const REASONS = {
    A: {
      title: "选了 A：下弧头朝下倒立了（正确答案是 C）",
      body: "A 把上下两段字直接打在一条顺时针整圆路径上，上半弧「山谷烘焙工坊」顺读，拐到下半弧「ROASTERY 2026」时字母整体旋转了 180° 头朝下。C 先拆成上下反向双轨，再把下弧基线外移并补足字距，一眼顺读。",
    },
    B: {
      title: "选了 B：下弧掉进内圈、上下错环了（正确答案是 C）",
      body: "B 已经把下弧翻成正向顺读，但忽略了「基线偏移」——上弧字脚踩在线上、下弧字顶悬在线内，两行字实际半径差出一个字高，圆章显偏心。C 把下弧基线向外推到同一条绿色同心环带上。",
    },
    C: {
      title: "选对了！C 同时做对了拆轨、同心基线与内凹字距三件事",
      body: "对比四张展开的辅助线：A 下弧倒立；B 没做基线外移导致下弧掉进内圈；D 没给内凹下弧放宽字距，字母顶角挤得发黑；只有 C 既正向顺读，又稳稳落在同一条同心环带里，上下松紧一致。",
    },
    D: {
      title: "选了 D：内凹下弧字距过挤发黑（正确答案是 C）",
      body: "D 的方向和同心圆环都对了，但下弧是内凹弧，字母顶部向圆心聚拢，没做正字距补偿反而紧排，导致「ROASTERY 2026」顶角紧挨结块、比上弧明显偏黑。C 适度放宽了下弧字距，整体透气均匀。",
    },
  };

  function drawBadge(svg, opt, reveal) {
    svg.innerHTML = "";
    const cx = 130, cy = 130, baseR = 80;
    svg.appendChild(el("circle", { cx, cy, r: 112, fill: "#F6F8EA", stroke: "#032B26", "stroke-width": 2 }));
    svg.appendChild(el("circle", { cx, cy, r: 62, fill: "none", stroke: "#C1D2BE", "stroke-width": 1.2 }));
    // 中央咖啡豆极简图形
    svg.appendChild(el("ellipse", { cx, cy, rx: 18, ry: 25, fill: "#032B26", transform: `rotate(-24 ${cx} ${cy})` }));
    svg.appendChild(el("path", { d: "M 122 108 Q 134 130 138 152", fill: "none", stroke: "#F6F8EA", "stroke-width": 2.4, "stroke-linecap": "round" }));

    // 上弧四个选项完全一致（控制单一变量！）
    placeCharsOnArc(svg, [..."山谷烘焙工坊"], cx, cy, baseR, -130, 16, {
      fontSize: 16.5, fontWeight: "900", fill: "#032B26", inward: false,
    });

    const bot = [..."ROASTERY 2026"];
    if (opt === "A") {
      // 错误：单圆硬绕倒立
      placeCharsOnArc(svg, bot, cx, cy, baseR, 42, 8.0, {
        fontSize: 13.5, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: "700",
        fill: "#032B26", inward: false,
      });
    } else if (opt === "B") {
      // 错误：拆轨正向，但缺少基线外移（掉在内圈）
      placeCharsOnArc(svg, bot, cx, cy, baseR - 2, 134, -7.3, {
        fontSize: 13.5, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: "700",
        fill: "#032B26", inward: true,
      });
    } else if (opt === "C") {
      // 正确：拆轨正向 + 基线外移对齐同心环 + 内凹适度放宽字距
      placeCharsOnArc(svg, bot, cx, cy, baseR + 15.5, 138, -8.0, {
        fontSize: 13.5, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: "700",
        fill: "#032B26", inward: true,
      });
    } else {
      // D 错误：拆轨且环带对齐，但内凹下弧字距过挤发黑
      placeCharsOnArc(svg, bot, cx, cy, baseR + 15.5, 118, -4.6, {
        fontSize: 13.5, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: "700",
        fill: "#032B26", inward: true,
      });
    }

    if (reveal) {
      // 揭晓同心基准环（上弧字中轴半径 = baseR + 8）
      const ok = opt === CORRECT;
      svg.appendChild(el("circle", {
        cx, cy, r: baseR + 8, fill: "none", stroke: ok ? "#136B52" : "#EB6847",
        "stroke-width": 1.6, "stroke-dasharray": "4 3",
      }));
      const tag = opt === "A" ? "下弧倒立 180°" : opt === "B" ? "内缩错环" : opt === "C" ? "✓ 同心顺读" : "内凹挤撞发黑";
      svg.appendChild(el("rect", { x: 66, y: 230, width: 128, height: 22, rx: 4, fill: ok ? "#136B52" : "#B63B1D" }));
      svg.appendChild(el("text", { x: 130, y: 245, fill: "#FFFFFF", "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, tag));
    }
  }

  function renderAll(reveal) {
    for (const opt of ["A", "B", "C", "D"]) {
      drawBadge(document.getElementById(`quiz-svg-${opt}`), opt, reveal);
    }
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      picked = card.dataset.opt;
      const isRight = picked === CORRECT;
      cards.forEach((c) => {
        const o = c.dataset.opt;
        c.setAttribute("aria-pressed", String(o === picked));
        c.classList.toggle("is-picked", o === picked);
        c.classList.toggle("is-right", o === CORRECT);
        c.classList.toggle("is-wrong", o === picked && !isRight);
      });
      renderAll(true);
      verdict.classList.toggle("is-right", isRight);
      verdict.classList.toggle("is-wrong", !isRight);
      vTitle.textContent = REASONS[picked].title;
      vBody.textContent = REASONS[picked].body;
    });
  });

  renderAll(false);
}

// ==================== 07 节：原海报放大灯箱（拖动平移、缩放、Esc 收起） ====================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-btn");
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lb-img");
  const vp = document.getElementById("lb-viewport");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1, tx = 0, ty = 0;
  let pan = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!img.src) img.src = poster.src; // 复用同一份内联海报，绝不二次内联
    scale = 1.25;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    btnClose.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.75, +(scale - 0.35).toFixed(2)); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.75, Math.min(3.5, scale * (e.deltaY < 0 ? 1.12 : 0.9)));
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    pan = { id: e.pointerId, x: e.clientX - tx, y: e.clientY - ty };
    vp.classList.add("is-panning");
    try { vp.setPointerCapture(e.pointerId); } catch {}
  });
  vp.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    applyTransform();
  });
  const endPan = () => { pan = null; vp.classList.remove("is-panning"); };
  vp.addEventListener("pointerup", endPan);
  vp.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}
