// 090 动态构图 · 正文各节独立交互模块（01 五维剥离器 / 02 角度重力坡道 / 03 拉帘对照 / 04 四代历史图谱 / 05 场景分诊 / 06 四选一考场 / 07 原海报灯箱）

const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, text = "") => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
};

/* ==================== 01 五维剥离器 ==================== */
export function initDissector() {
  const svg = document.getElementById("dissector-svg");
  const readout = document.getElementById("dissector-readout");
  const cards = [...document.querySelectorAll("[data-force]")];
  if (!svg || !cards.length) return;

  const active = { direction: true, tension: true, rhythm: true, speed: true, energy: true };

  function draw() {
    svg.replaceChildren();
    const bg = active.energy ? "#FCF6E6" : "#EFECE6";
    const orange = active.energy ? "#FB5700" : "#8B8880";
    const teal = active.energy ? "#00373B" : "#5F6667";
    const tealMid = active.energy ? "#006267" : "#7A8283";

    svg.append(svgEl("rect", { width: 560, height: 360, fill: bg }));

    // 正交参考网格（方向关掉时变得更显眼）
    const gOp = active.direction ? "0.08" : "0.22";
    for (let x = 70; x < 560; x += 70) {
      svg.append(svgEl("line", { x1: x, y1: 0, x2: x, y2: 360, stroke: teal, "stroke-opacity": gOp }));
    }
    for (let y = 60; y < 360; y += 60) {
      svg.append(svgEl("line", { x1: 0, y1: y, x2: 560, y2: y, stroke: teal, "stroke-opacity": gOp }));
    }

    // 底部斜切能量色块（能量开关控制）
    if (active.energy) {
      svg.append(svgEl("polygon", { points: "305,360 560,224 560,360", fill: teal }));
      svg.append(svgEl("polygon", { points: "476,360 560,282 560,360", fill: orange }));
    }

    const angle = active.direction ? 36 : 0;
    const rad = (angle * Math.PI) / 180;
    const cx = 278;
    const cy = 186;
    const ux = Math.cos(rad);
    const uy = -Math.sin(rad);
    const nx = -uy;
    const ny = ux;
    const span = active.direction ? 225 : 210;
    const pt = (s, off = 0) => ({ x: cx + ux * s * span + nx * off, y: cy + uy * s * span + ny * off });

    // 主路径虚线
    const pA = pt(-1.05, 0);
    const pB = pt(1.05, 0);
    svg.append(
      svgEl("line", {
        x1: pA.x.toFixed(1),
        y1: pA.y.toFixed(1),
        x2: pB.x.toFixed(1),
        y2: pB.y.toFixed(1),
        stroke: teal,
        "stroke-width": 1.6,
        "stroke-dasharray": "7 6",
        "stroke-opacity": 0.55,
      })
    );

    // 速度感知层：白切线与半调喷点
    if (active.speed) {
      for (let i = 0; i < 18; i++) {
        const d = pt(-0.95 + (i % 6) * 0.14, -46 + Math.floor(i / 6) * 28);
        svg.append(svgEl("circle", { cx: d.x.toFixed(1), cy: d.y.toFixed(1), r: 2.2 + (i % 3), fill: i % 2 ? orange : teal, opacity: 0.65 }));
      }
      for (const off of [-34, 24]) {
        const s1 = pt(-0.98, off);
        const s2 = pt(0.95, off * 0.7);
        svg.append(svgEl("line", { x1: s1.x.toFixed(1), y1: s1.y.toFixed(1), x2: s2.x.toFixed(1), y2: s2.y.toFixed(1), stroke: teal, "stroke-width": 1.4, opacity: 0.45 }));
      }
    }

    // 主橙色箭矢（方向开启时有锐利斜冲，关掉时横平）
    const arrG = svgEl("g", { transform: `translate(${cx} ${cy}) rotate(${-angle})` });
    arrG.append(
      svgEl("path", {
        d: "M-195,-14 L18,-11 L18,-34 L82,0 L18,34 L18,11 L-195,14 Z",
        fill: orange,
      })
    );
    if (active.speed) {
      arrG.append(svgEl("line", { x1: -155, y1: -4, x2: 34, y2: -4, stroke: bg, "stroke-width": 3 }));
      arrG.append(svgEl("line", { x1: 12, y1: -38, x2: 12, y2: 38, stroke: bg, "stroke-width": 4 }));
    }
    // 深青锯齿闪电
    arrG.append(
      svgEl("path", {
        d: "M-32,-46 L48,-66 L32,-38 L124,-48 L44,-14 L58,-38 Z",
        fill: tealMid,
      })
    );
    svg.append(arrG);

    // 4 个节奏圆球：位置由 rhythm 决定，大小由 tension 决定
    const sPos = active.rhythm ? [-0.82, -0.22, 0.34, 0.78] : [-0.78, -0.26, 0.26, 0.78];
    const radii = active.tension ? [26, 15, 22, 52] : [25, 25, 25, 26];
    const tones = [teal, tealMid, orange, orange];

    sPos.forEach((s, i) => {
      const p = pt(s, i === 3 ? 0 : active.direction ? 22 : 0);
      svg.append(svgEl("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: radii[i], fill: tones[i] }));
      if (active.speed) {
        svg.append(
          svgEl("line", {
            x1: (p.x - ux * radii[i]).toFixed(1),
            y1: (p.y - uy * radii[i]).toFixed(1),
            x2: (p.x + ux * radii[i]).toFixed(1),
            y2: (p.y + uy * radii[i]).toFixed(1),
            stroke: bg,
            "stroke-width": 2,
          })
        );
      }
    });

    // 紧咬主球的冲突小青圆（张力开启时紧密咬合）
    const sat = pt(active.tension ? 0.54 : 0.45, active.tension ? 10 : -40);
    svg.append(svgEl("circle", { cx: sat.x.toFixed(1), cy: sat.y.toFixed(1), r: active.tension ? 16 : 20, fill: teal }));

    // 实时文字解释
    const offList = Object.entries(active)
      .filter(([, v]) => !v)
      .map(([k]) => ({ direction: "方向引导", tension: "视觉张力", rhythm: "动感节奏", speed: "速度感知", energy: "能量爆发" }[k]));

    if (!offList.length) {
      readout.textContent = "五股推力全开：斜势箭头领路，约 3 倍大小落差建立焦点高潮，渐密步距与速度切线把视线一路送上右上角。";
    } else if (offList.length === 5) {
      readout.textContent = "五项全关：斜势、反差、节奏、速线与撞色全部退场，画面彻底塌回呆板的静态灰块。";
    } else {
      readout.textContent = `当前剥离了「${offList.join("、")}」：${
        !active.direction
          ? "没有斜势轴线，其余元素原地落回水平静置。"
          : !active.tension
            ? "虽然还在倾斜，但四枚圆球大小均等，视线走到尽头没有爆发焦点。"
            : !active.rhythm
              ? "圆球步距退回机械等距，推进的加速韵律消失。"
              : !active.speed
                ? "去掉白切速线与喷点尾迹后，图形轮廓变钝，速度感立刻降温。"
                : "去掉高反差撞色与底角深青块后，视觉情绪明显平淡。"
      }`;
    }
  }

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.force;
      active[k] = !active[k];
      btn.classList.toggle("is-on", active[k]);
      btn.setAttribute("aria-pressed", String(active[k]));
      const pill = btn.querySelector(".fc-pill");
      if (pill) pill.textContent = active[k] ? "已开启" : "已剥离";
      draw();
    });
  });

  draw();
}

/* ==================== 02 角度重力坡道 ==================== */
export function initSlopeLab() {
  const svg = document.getElementById("slope-svg");
  const btns = [...document.querySelectorAll("[data-slope]")];
  const tagEl = document.getElementById("slope-tag");
  const titleEl = document.getElementById("slope-title");
  const descEl = document.getElementById("slope-desc");
  const bObl = document.getElementById("bar-oblique");
  const bHor = document.getElementById("bar-horiz");
  const bVer = document.getElementById("bar-vert");
  const tObl = document.getElementById("txt-oblique");
  const tHor = document.getElementById("txt-horiz");
  const tVer = document.getElementById("txt-vert");
  if (!svg || !btns.length) return;

  const DATA = {
    0: {
      tag: "0° · 水平重力基准（完全静止）",
      title: "四平八稳，视线没有滑行冲动",
      desc: "0° 紧贴人眼最熟悉的地平线基准。放在其上的物体像被地面牢牢托住，适合表达稳重、宁静与秩序（见 089 静态构图），却缺乏前进推力。",
      oblique: [6, "极弱"],
      horiz: [100, "平铺"],
      vert: [4, "无"],
    },
    18: {
      tag: "18° · 轻斜试探（动势偏软）",
      title: "微微起势，容易被看成没摆正",
      desc: "小角度倾斜常常处于尴尬地带：如果缺少强烈的大小对比和速度线配合，观众第一反应往往不是“动感”，而是怀疑排版是不是歪了一点。",
      oblique: [38, "偏弱"],
      horiz: [95, "强"],
      vert: [31, "弱"],
    },
    36: {
      tag: "36° · 经验轻快推进区",
      title: "舒展的斜坡感，兼顾流动与易读",
      desc: "36° 明显挣脱水平基准，又保留了较宽的横向延展空间，非常适合需要同时容纳标题文案与动态图形的网页首屏和活动横幅。",
      oblique: [86, "强"],
      horiz: [81, "强"],
      vert: [59, "中高"],
    },
    54: {
      tag: "54° · 经验强动势区（090 原海报斜势）",
      title: "横向位移与向上跃升势均力敌",
      desc: "54° 既远离 0° 地平线、也远离 90° 垂线，对角线穿过画面时把视线从左下入口一口气甩向右上高点，是 090 原海报主箭与文字采用的强能量斜角。",
      oblique: [82, "强"],
      horiz: [59, "中高"],
      vert: [81, "强"],
    },
    76: {
      tag: "76° · 逼近垂柱（前进势能衰减）",
      title: "过陡之后，重新滑回静止立柱",
      desc: "超过 70° 以后，水平推进分量骤降，大脑开始把它归类为“略微歪斜的竖条”，向前的速度与延展感反而不如 35°–58°。",
      oblique: [30, "衰减"],
      horiz: [24, "弱"],
      vert: [97, "近垂"],
    },
    90: {
      tag: "90° · 垂直重力基准（回归静态）",
      title: "柱体稳立，动态冲势清零",
      desc: "90° 与 0° 同属正交基准。竖直线条表达的是纪念碑般的挺拔、严肃与静止，不再传递斜向移动的紧张感。",
      oblique: [6, "极弱"],
      horiz: [4, "无"],
      vert: [100, "垂立"],
    },
  };

  function drawSlope(deg) {
    const d = DATA[deg] || DATA[54];
    tagEl.textContent = d.tag;
    titleEl.textContent = d.title;
    descEl.textContent = d.desc;
    bObl.style.width = `${d.oblique[0]}%`;
    tObl.textContent = d.oblique[1];
    bHor.style.width = `${d.horiz[0]}%`;
    tHor.textContent = d.horiz[1];
    bVer.style.width = `${d.vert[0]}%`;
    tVer.textContent = d.vert[1];

    svg.replaceChildren();
    svg.append(svgEl("rect", { width: 540, height: 280, fill: "#FCF6E6" }));

    const ox = 86;
    const oy = 232;
    const len = 215;
    const rad = (deg * Math.PI) / 180;
    const ex = ox + Math.cos(rad) * len;
    const ey = oy - Math.sin(rad) * len;

    // 经验黄金斜势扇区（25°–60° 浅橙提示带）
    const r1 = (25 * Math.PI) / 180;
    const r2 = (60 * Math.PI) / 180;
    const sectorR = 165;
    svg.append(
      svgEl("path", {
        d: `M ${ox} ${oy} L ${(ox + Math.cos(r1) * sectorR).toFixed(1)} ${(oy - Math.sin(r1) * sectorR).toFixed(1)} A ${sectorR} ${sectorR} 0 0 0 ${(ox + Math.cos(r2) * sectorR).toFixed(1)} ${(oy - Math.sin(r2) * sectorR).toFixed(1)} Z`,
        fill: "#FB5700",
        opacity: "0.11",
      })
    );
    svg.append(
      svgEl(
        "text",
        { x: ox + 132, y: oy - 118, "font-family": "Noto Sans SC, sans-serif", "font-size": 12, "font-weight": 700, fill: "#B83B00" },
        "25°–60° 经验强动势区"
      )
    );

    // 水平 & 垂直正交基准线
    svg.append(svgEl("line", { x1: ox, y1: oy, x2: 478, y2: oy, stroke: "#00373B", "stroke-width": 1.6, "stroke-dasharray": "6 5" }));
    svg.append(svgEl("line", { x1: ox, y1: oy, x2: ox, y2: 24, stroke: "#00373B", "stroke-width": 1.6, "stroke-dasharray": "6 5" }));

    // 水平/垂直分解投影虚线
    if (deg > 0 && deg < 90) {
      svg.append(svgEl("line", { x1: ex.toFixed(1), y1: ey.toFixed(1), x2: ex.toFixed(1), y2: oy, stroke: "#006267", "stroke-width": 1.5, "stroke-dasharray": "4 4" }));
      svg.append(svgEl("line", { x1: ox, y1: oy, x2: ex.toFixed(1), y2: oy, stroke: "#006267", "stroke-width": 3.5 }));
      svg.append(svgEl("line", { x1: ex.toFixed(1), y1: oy, x2: ex.toFixed(1), y2: ey.toFixed(1), stroke: "#FB5700", "stroke-width": 3.5 }));
    }

    // 坡道主矢量轴
    const good = deg >= 25 && deg <= 62;
    svg.append(
      svgEl("line", {
        x1: ox,
        y1: oy,
        x2: ex.toFixed(1),
        y2: ey.toFixed(1),
        stroke: good ? "#FB5700" : "#00373B",
        "stroke-width": 5,
        "stroke-linecap": "square",
      })
    );

    // 运动冲锋块（随倾角旋转）
    const midX = ox + Math.cos(rad) * (len * 0.62);
    const midY = oy - Math.sin(rad) * (len * 0.62);
    const blk = svgEl("g", { transform: `translate(${midX.toFixed(1)} ${midY.toFixed(1)}) rotate(${-deg})` });
    blk.append(svgEl("polygon", { points: "-28,-12 24,-12 42,0 24,12 -28,12", fill: good ? "#00373B" : "#5D6D6E" }));
    blk.append(svgEl("circle", { cx: 66, cy: 0, r: 16, fill: good ? "#FB5700" : "#8A9596" }));
    svg.append(blk);

    // 角度弧标
    if (deg > 0) {
      const ar = 48;
      svg.append(
        svgEl("path", {
          d: `M ${ox + ar} ${oy} A ${ar} ${ar} 0 0 0 ${(ox + Math.cos(rad) * ar).toFixed(1)} ${(oy - Math.sin(rad) * ar).toFixed(1)}`,
          fill: "none",
          stroke: "#B83B00",
          "stroke-width": 2,
        })
      );
    }

    svg.append(
      svgEl(
        "text",
        { x: 472, y: 48, "text-anchor": "end", "font-family": "Anton, sans-serif", "font-size": 44, fill: good ? "#FB5700" : "#00373B" },
        `${deg}°`
      )
    );
    svg.append(
      svgEl(
        "text",
        { x: 472, y: 256, "text-anchor": "end", "font-family": "Space Grotesk, sans-serif", "font-size": 12, "font-weight": 700, fill: "#3A5557" },
        "0° HORIZONTAL BASELINE"
      )
    );
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      drawSlope(Number(btn.dataset.slope));
    });
  });

  drawSlope(54);
}

/* ==================== 03 左右拉帘对照台 ==================== */
export function initCurtain() {
  const stage = document.getElementById("curtain-stage");
  const bad = document.getElementById("curtain-bad");
  const handle = document.getElementById("curtain-handle");
  const range = document.getElementById("curtain-range");
  const out = document.getElementById("curtain-pct");
  if (!stage || !bad || !handle || !range) return;

  function setPct(v) {
    const pct = Math.min(92, Math.max(8, Math.round(v)));
    bad.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = `${pct}%`;
    range.value = String(pct);
    if (out) out.textContent = `${pct}%`;
  }

  range.addEventListener("input", () => setPct(Number(range.value)));

  let dragging = false;
  const fromClientX = (cx) => {
    const r = stage.getBoundingClientRect();
    return ((cx - r.left) / Math.max(1, r.width)) * 100;
  };

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    setPct(fromClientX(e.clientX));
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setPct(fromClientX(e.clientX));
  });
  const stop = (e) => {
    if (!dragging) return;
    dragging = false;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {}
  };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  setPct(50);
}

/* ==================== 04 四代历史图谱切换卡 ==================== */
export function initHistoryEras() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const svg = document.getElementById("era-svg");
  const meta = document.getElementById("era-meta");
  const title = document.getElementById("era-title");
  const body = document.getElementById("era-body");
  const takeaway = document.getElementById("era-takeaway");
  if (!tabs.length || !svg) return;

  const ERAS = {
    1913: {
      meta: "1913 · 翁贝托·博乔尼（Umberto Boccioni）",
      title: "把速度和空气流动直接雕进形体",
      body: "意大利未来主义雕塑家博乔尼于 1913 年创作《空间连续性的独特形态》（Unique Forms of Continuity in Space，石膏原作后铸青铜，藏于大都会艺术博物馆与纽约现代艺术博物馆）。他不再表现静止站立的雕像，而是用前倾斜轴与气流般的流线褶皱，让凝固的金属呈现疾步冲锋的连续动势。",
      takeaway: "留给今天排版的启发：不要只画一个孤零零的对象，要把对象身后的气流、轨迹与位移余韵一起编进版面。",
      draw() {
        svg.append(svgEl("rect", { width: 420, height: 280, fill: "#FFFDF7" }));
        // 连续流线弧波模拟未来主义前倾疾行
        for (let i = 0; i < 6; i++) {
          const dx = i * 28;
          svg.append(
            svgEl("path", {
              d: `M ${48 + dx} 240 Q ${128 + dx} 150 ${168 + dx} 54`,
              fill: "none",
              stroke: i % 2 ? "#FB5700" : "#00373B",
              "stroke-width": 4 + i * 1.4,
              opacity: (0.28 + i * 0.12).toFixed(2),
            })
          );
        }
        svg.append(svgEl("circle", { cx: 292, cy: 76, r: 22, fill: "#00373B" }));
        svg.append(svgEl("polygon", { points: "130,224 272,110 296,138 176,244", fill: "#FB5700" }));
        svg.append(svgEl("text", { x: 24, y: 36, "font-family": "Anton, sans-serif", "font-size": 24, fill: "#00373B" }, "1913 · FUTURISM"));
      },
    },
    1920: {
      meta: "1919–1920 · 埃尔·利西茨基（El Lissitzky）",
      title: "一把红色几何斜楔，刺穿圆形静物",
      body: "俄国构成主义代表作《用红楔子打击白军》（Beat the Whites with the Red Wedge，1919–1920 年石版画海报，波士顿美术馆等馆藏），彻底抛弃具象插画，仅凭锐角红三角形斜插进白色圆盘，就让观众一眼感受到方向、冲击与力量对比。",
      takeaway: "留给今天排版的启发：纯几何形状的锐角指向与黑白红强对比，本身就能讲清冲突与前进方向。",
      draw() {
        svg.append(svgEl("rect", { width: 420, height: 280, fill: "#FCF6E6" }));
        svg.append(svgEl("polygon", { points: "0,0 165,0 112,280 0,280", fill: "#002E2F" }));
        svg.append(svgEl("circle", { cx: 292, cy: 146, r: 78, fill: "#FFFFFF", stroke: "#00373B", "stroke-width": 3 }));
        // 标志性斜刺红楔
        svg.append(svgEl("polygon", { points: "44,72 282,148 118,224", fill: "#FB5700" }));
        svg.append(svgEl("rect", { x: 224, y: 52, width: 22, height: 8, transform: "rotate(-28 224 52)", fill: "#00373B" }));
        svg.append(svgEl("rect", { x: 266, y: 206, width: 26, height: 9, transform: "rotate(22 266 206)", fill: "#FB5700" }));
        svg.append(svgEl("text", { x: 20, y: 36, "font-family": "Anton, sans-serif", "font-size": 22, fill: "#FCF6E6" }, "1919–20 · WEDGE"));
      },
    },
    1928: {
      meta: "1928 · 扬·契肖尔德（Jan Tschichold）",
      title: "告别中轴对称，用非对称制造现代节奏",
      body: "扬·契肖尔德于 1928 年在柏林出版《新排印》（Die neue Typographie，加州大学出版社 1995/2006 年出英译本），系统批判了死板的居中对称排版，主张按信息主次采用非对称布局、无衬线大反差字阶与明确导视线，使版面呈现动态平衡。",
      takeaway: "留给今天排版的启发：不一定要斜着放字才叫动态，强烈的非对称留白与大小字阶同样能推动视线。",
      draw() {
        svg.append(svgEl("rect", { width: 420, height: 280, fill: "#FFFDF7" }));
        svg.append(svgEl("line", { x1: 126, y1: 18, x2: 126, y2: 262, stroke: "#FB5700", "stroke-width": 4 }));
        svg.append(svgEl("rect", { x: 146, y: 42, width: 230, height: 40, fill: "#00373B" }));
        svg.append(svgEl("rect", { x: 146, y: 98, width: 150, height: 14, fill: "#FB5700" }));
        svg.append(svgEl("rect", { x: 146, y: 126, width: 210, height: 8, fill: "#3A5557" }));
        svg.append(svgEl("rect", { x: 146, y: 144, width: 175, height: 8, fill: "#3A5557" }));
        svg.append(svgEl("rect", { x: 32, y: 184, width: 76, height: 58, fill: "#FB5700" }));
        svg.append(svgEl("rect", { x: 146, y: 214, width: 224, height: 28, fill: "#00373B", opacity: "0.18" }));
        svg.append(svgEl("text", { x: 158, y: 69, "font-family": "Anton, sans-serif", "font-size": 22, fill: "#FCF6E6" }, "1928 · ASYMMETRY"));
      },
    },
    1954: {
      meta: "1954 / 1972 / 1974 · 阿恩海姆 & 阿佩尔",
      title: "从格式塔张力到视皮层的「斜线效应」",
      body: "鲁道夫·阿恩海姆在《艺术与视知觉》（1954 初版、1974 修订扩充版，加州大学出版社）指出：斜线之所以充满生命力，是因为它偏离画框正交结构而激发视觉心理张力。1972 年斯图尔特·阿佩尔在《心理学公报》综述「斜线效应」，从视觉辨别机制上印证了人眼对横竖方向与倾斜方向的不同反应。",
      takeaway: "留给今天排版的启发：视觉张力不是玄学，它来自元素与画框水平/垂直参照系之间可度量的偏离。",
      draw() {
        svg.append(svgEl("rect", { width: 420, height: 280, fill: "#FCF6E6" }));
        // 画框结构场 + 斜向矢量合力
        svg.append(svgEl("rect", { x: 48, y: 34, width: 324, height: 212, fill: "none", stroke: "#00373B", "stroke-width": 2 }));
        svg.append(svgEl("line", { x1: 48, y1: 140, x2: 372, y2: 140, stroke: "#00373B", "stroke-dasharray": "5 5", opacity: "0.4" }));
        svg.append(svgEl("line", { x1: 210, y1: 34, x2: 210, y2: 246, stroke: "#00373B", "stroke-dasharray": "5 5", opacity: "0.4" }));
        svg.append(svgEl("line", { x1: 86, y1: 216, x2: 332, y2: 64, stroke: "#FB5700", "stroke-width": 4.5 }));
        svg.append(svgEl("polygon", { points: "340,59 318,61 327,76", fill: "#FB5700" }));
        svg.append(svgEl("circle", { cx: 210, cy: 140, r: 34, fill: "none", stroke: "#006267", "stroke-width": 2, "stroke-dasharray": "4 4" }));
        svg.append(svgEl("circle", { cx: 284, cy: 94, r: 22, fill: "#00373B" }));
        svg.append(svgEl("text", { x: 60, y: 62, "font-family": "Anton, sans-serif", "font-size": 20, fill: "#00373B" }, "1954–74 · FIELD"));
      },
    },
  };

  function show(key) {
    const item = ERAS[key] || ERAS[1913];
    meta.textContent = item.meta;
    title.textContent = item.title;
    body.textContent = item.body;
    takeaway.textContent = item.takeaway;
    svg.replaceChildren();
    item.draw();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      show(tab.dataset.era);
    });
  });

  show("1913");
}

/* ==================== 05 适用/慎用分诊筛选 ==================== */
export function initTriage() {
  const btns = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll(".triage-card")];
  if (!btns.length || !cards.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      cards.forEach((c) => {
        c.hidden = f !== "all" && c.dataset.cat !== f;
      });
    });
  });
}

/* ==================== 06 小练习（四选一单变量） ==================== */
export function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  const cards = [...document.querySelectorAll(".quiz-card")];
  const titleEl = document.getElementById("qv-title");
  const bodyEl = document.getElementById("qv-body");
  if (!grid || !cards.length) return;

  const FEEDBACK = {
    A: {
      ok: false,
      title: "选了方案 A：这是静态居中构图，缺少动势推力",
      body: "方案 A 把标题、跑鞋和三颗等大圆点全部水平对称摆死在 0° 基准线上。虽然整齐，但更接近 089 静态构图，没有传达出竞速跑鞋的前冲节奏。正确答案是方案 B。",
    },
    B: {
      ok: true,
      title: "答对了！方案 B 真正立起了动态构图",
      body: "方案 B 用单一 52° 上扬斜轴统领跑鞋、速度线与节奏点；小→中→大圆球拉开超过 3 倍体量差并前疏后密递增，把视线一路加速送进右上橙球高潮，同时右下角保留了水平静区承载发布日期。",
    },
    C: {
      ok: false,
      title: "选了方案 C：只借了斜角外壳，缺少体量反差与节奏变化",
      body: "方案 C 虽然把元素排成了 52° 斜线，但四枚圆球大小完全相同、步距像节拍器一样均匀，鞋体也被淹没其中，视线读不出起势和高潮。正确答案是方案 B。",
    },
    D: {
      ok: false,
      title: "选了方案 D：两条斜势迎头对冲，动能互相抵消",
      body: "方案 D 同时有斜线和大小块，但跑鞋与橙带朝右上冲，深青斜带和大标题却反着向右下砸来，两股力在画面正中撞车，让人一眼只觉得杂乱堵心。正确答案是方案 B。",
    },
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const opt = card.dataset.opt;
      const fb = FEEDBACK[opt];
      grid.classList.add("is-revealed");
      cards.forEach((c) => {
        const k = c.dataset.opt;
        c.setAttribute("aria-pressed", String(c === card));
        c.classList.toggle("is-picked", c === card);
        c.classList.toggle("is-right", k === "B");
        c.classList.toggle("is-wrong", c === card && k !== "B");
      });
      titleEl.textContent = fb.title;
      bodyEl.textContent = fb.body;
    });
  });
}

/* ==================== 07 原海报全屏灯箱 ==================== */
export function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-btn");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  if (!poster || !openBtn || !lb || !lbImg || !lbStage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;

  const applyTransform = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  };

  function open() {
    if (!lbImg.src) lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn?.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.7, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });

  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.min(3.2, Math.max(0.7, +(scale + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  let drag = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;
  let moved = false;

  lbStage.addEventListener("pointerdown", (e) => {
    drag = true;
    moved = false;
    sx = e.clientX;
    sy = e.clientY;
    ox = tx;
    oy = ty;
    try {
      lbStage.setPointerCapture(e.pointerId);
    } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.hypot(dx, dy) > 4) moved = true;
    tx = ox + dx;
    ty = oy + dy;
    applyTransform();
  });
  const end = (e) => {
    if (!drag) return;
    drag = false;
    try {
      lbStage.releasePointerCapture(e.pointerId);
    } catch {}
    if (!moved && e.target === lbStage) close();
  };
  lbStage.addEventListener("pointerup", end);
  lbStage.addEventListener("pointercancel", end);
}
