// 073 平行透视构图 · 正文 01–07 节专属互动实验台 + 08 节原海报灯箱
// 相邻两节控件形式绝不重样：
// 01 三轴色码拨片 + 平行透视/平行投影对照（SVG 精密线框）
// 02 纵深切片游标 + 相似正立面宽高比实测（SVG 联动）
// 03 真实 CSS perspective / perspective-origin / translateZ vs rotateY 活体卡片舞台
// 04 历史 4 节点编年轨 + 蓝晒几何剖析窗（乌尔比诺理想城 / 最后的晚餐 / 奥林匹克剧场 / 移轴镜头）
// 05 通道尽头道具替换槽 + 视线汇聚路径重播（纯背影剪影，绝不画五官）
// 06 蓝晒深钴底四命题中缝对比拉帘
// 07 单变量侧墙窗沿盲测四选一（A/B/C/D，交卷齐显延长线）
// 08 原海报放大拖拽灯箱

import { reducedMotion } from "../../lib/stage.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function elSVG(tag, attrs = {}, text) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text != null) n.textContent = text;
  return n;
}

// =========================================================================
// 01 节：三轴色码独立开关（X 白 ∥ / Y 冰青 ∥ / Z 橙 →）+ 平行透视 ↔ 平行投影
// =========================================================================
export function initSec01Axes(root) {
  const svg = root.querySelector("#s01-svg");
  const modeBtns = [...root.querySelectorAll("[data-s01-mode]")];
  const axisBtns = [...root.querySelectorAll("[data-s01-axis]")];
  const readout = root.querySelector("#s01-readout");
  const note = root.querySelector("#s01-note");

  const st = {
    mode: "perspective", // "perspective" | "parallel-proj"
    x: true,
    y: true,
    z: true,
  };

  function draw() {
    svg.innerHTML = "";
    const W = 680;
    const H = 360;
    const isPersp = st.mode === "perspective";

    // 背景晴空蓝晒底
    svg.append(
      elSVG("rect", { x: 0, y: 0, width: W, height: H, fill: "#134786" }),
      elSVG("rect", { x: 0, y: 0, width: W, height: 162, fill: "#1A59A4" })
    );

    // 视平线（仅平行透视下存在单消失点）
    if (isPersp) {
      svg.append(
        elSVG("line", {
          x1: 0,
          y1: 162,
          x2: W,
          y2: 162,
          stroke: "rgba(255,255,255,0.45)",
          "stroke-width": 1.2,
          "stroke-dasharray": "5 5",
        })
      );
    }

    // 定义一个正交走廊骨架（正面框架 + 远端正面框架 + 左右立面）
    // 平行透视：前后两道正立面中心都在 VP(340, 162)，近框大、远框小
    // 平行投影（斜投影）：前后两道正立面等大，沿固定斜向量 (+130, -54) 平行错移，Z 线互相平行！
    const vp = { x: 340, y: 162 };
    let near, far;
    if (isPersp) {
      near = { l: 96, r: 584, t: 54, b: 306 };
      far = { l: 256, r: 424, t: 124, b: 211 };
    } else {
      near = { l: 82, r: 454, t: 118, b: 312 };
      far = { l: 222, r: 594, t: 48, b: 242 };
    }

    // 铺设淡蓝透明墙面帮助理解空间体块
    const leftWall = `${near.l},${near.t} ${far.l},${far.t} ${far.l},${far.b} ${near.l},${near.b}`;
    const rightWall = `${near.r},${near.t} ${far.r},${far.t} ${far.r},${far.b} ${near.r},${near.b}`;
    const floor = `${near.l},${near.b} ${far.l},${far.b} ${far.r},${far.b} ${near.r},${near.b}`;
    svg.append(
      elSVG("polygon", { points: floor, fill: "rgba(15, 61, 117, 0.55)" }),
      elSVG("polygon", { points: leftWall, fill: "rgba(105, 179, 245, 0.24)" }),
      elSVG("polygon", { points: rightWall, fill: "rgba(64, 139, 209, 0.28)" })
    );

    // 额外在走廊中段插一道中框，强化三轴并行对比
    const lerp = (a, b, k) => a + (b - a) * k;
    const mid = {
      l: lerp(near.l, far.l, 0.5),
      r: lerp(near.r, far.r, 0.5),
      t: lerp(near.t, far.t, 0.5),
      b: lerp(near.b, far.b, 0.5),
    };

    const drawLine = (x1, y1, x2, y2, stroke, width, dash) => {
      const a = { x1, y1, x2, y2, stroke, "stroke-width": width };
      if (dash) a["stroke-dasharray"] = dash;
      svg.append(elSVG("line", a));
    };

    // Z 轴进深线（信号橙）
    const zColor = st.z ? "#FC750A" : "rgba(255,255,255,0.16)";
    const zW = st.z ? 2.6 : 1;
    const zPairs = [
      [near.l, near.t, far.l, far.t],
      [near.r, near.t, far.r, far.t],
      [near.l, near.b, far.l, far.b],
      [near.r, near.b, far.r, far.b],
      [near.l, lerp(near.t, near.b, 0.5), far.l, lerp(far.t, far.b, 0.5)],
      [near.r, lerp(near.t, near.b, 0.5), far.r, lerp(far.t, far.b, 0.5)],
      [lerp(near.l, near.r, 0.5), near.b, lerp(far.l, far.r, 0.5), far.b],
    ];
    for (const [x1, y1, x2, y2] of zPairs) {
      drawLine(x1, y1, x2, y2, zColor, zW);
      if (isPersp && st.z) {
        drawLine(x2, y2, vp.x, vp.y, "rgba(252,117,10,0.62)", 1.3, "4 4");
      }
    }

    // X 轴横向平行线（纯白 ∥）
    const xColor = st.x ? "#FFFFFF" : "rgba(255,255,255,0.15)";
    const xW = st.x ? 2.6 : 1;
    for (const box of [near, mid, far]) {
      drawLine(box.l, box.t, box.r, box.t, xColor, xW);
      drawLine(box.l, box.b, box.r, box.b, xColor, xW);
    }

    // Y 轴竖向平行线（浅冰青 #8BE4FF ∥）
    const yColor = st.y ? "#8BE4FF" : "rgba(255,255,255,0.15)";
    const yW = st.y ? 2.6 : 1;
    for (const box of [near, mid, far]) {
      drawLine(box.l, box.t, box.l, box.b, yColor, yW);
      drawLine(box.r, box.t, box.r, box.b, yColor, yW);
    }

    // 单消失点徽标或「无消失点」标记
    if (isPersp) {
      svg.append(
        elSVG("circle", { cx: vp.x, cy: vp.y, r: st.z ? 7 : 5, fill: "#FC750A", stroke: "#FFFFFF", "stroke-width": 2 }),
        elSVG(
          "text",
          {
            x: vp.x,
            y: vp.y - 14,
            fill: "#FFFFFF",
            "font-size": 12,
            "font-weight": 700,
            "text-anchor": "middle",
          },
          "唯一消失点 VP1"
        )
      );
    } else {
      svg.append(
        elSVG("rect", { x: 454, y: 16, width: 206, height: 28, fill: "#06111F" }),
        elSVG(
          "text",
          {
            x: 557,
            y: 34,
            fill: "#FFB066",
            "font-size": 12,
            "font-weight": 700,
            "text-anchor": "middle",
          },
          "平行投影：Z 轴也平行，无消失点"
        )
      );
    }

    // 底部简洁图例条
    const legend = [
      { label: "X 横向：恒平行 ∥", color: "#FFFFFF", on: st.x, x: 24 },
      { label: "Y 竖向：恒平行 ∥", color: "#8BE4FF", on: st.y, x: 224 },
      {
        label: isPersp ? "Z 进深：汇于一点 →" : "Z 进深：保持平行 ∥",
        color: "#FC750A",
        on: st.z,
        x: 424,
      },
    ];
    for (const item of legend) {
      svg.append(
        elSVG("line", {
          x1: item.x,
          y1: 342,
          x2: item.x + 22,
          y2: 342,
          stroke: item.color,
          "stroke-width": item.on ? 3 : 1.2,
          opacity: item.on ? 1 : 0.45,
        }),
        elSVG(
          "text",
          {
            x: item.x + 30,
            y: 346,
            fill: "#F2F8FE",
            "font-size": 12,
            "font-weight": item.on ? 700 : 400,
            opacity: item.on ? 1 : 0.55,
          },
          item.label
        )
      );
    }

    // 读数更新
    const activeCount = [st.x, st.y, st.z].filter(Boolean).length;
    if (isPersp) {
      readout.textContent = "平行透视：X ∥ · Y ∥ · 唯有 Z → 单消失点";
      if (st.x && st.y && !st.z) {
        note.textContent = "现在只剩 X 与 Y 两组正面线：它们横平竖直、绝不相交，这正是「平行」透视得名的真正原因。";
      } else if (!st.x && !st.y && st.z) {
        note.textContent = "单独亮起 Z 轴进深线：只有垂直于画面的这一组平行线，才全部收束到视平线上的唯一橙点。";
      } else if (activeCount === 0) {
        note.textContent = "三组轴线均已隐去，点亮任意一轴对比它们是否汇聚。";
      } else {
        note.textContent = "原海报说「所有平行线汇聚」其实说多了一点——只有 Z 向进深线汇聚，与画面平行的 X、Y 永远保持平行。";
      }
    } else {
      readout.textContent = "平行投影：X ∥ · Y ∥ · Z ∥（无近大远小）";
      note.textContent = "切到平行投影后，远端框架与近端一样大、橙色 Z 线彼此平行永不相交——那是斜投影（074）、等距（075）与轴测（076）的领地，而非平行透视。";
    }
  }

  for (const btn of modeBtns) {
    btn.addEventListener("click", () => {
      st.mode = btn.dataset.s01Mode;
      modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      draw();
    });
  }
  for (const btn of axisBtns) {
    btn.addEventListener("click", () => {
      const a = btn.dataset.s01Axis;
      st[a] = !st[a];
      btn.setAttribute("aria-pressed", String(st[a]));
      draw();
    });
  }
  draw();
}

// =========================================================================
// 02 节：不同深度，正立面全相似（纵深切片游标 + 相似矩形宽高比实测）
// =========================================================================
export function initSec02Similar(root) {
  const svg = root.querySelector("#s02-svg");
  const slider = root.querySelector("#s02-depth");
  const countBtns = [...root.querySelectorAll("[data-s02-layers]")];
  const valDepth = root.querySelector("#s02-val-depth");
  const tableBody = root.querySelector("#s02-table");
  const summary = root.querySelector("#s02-summary");

  let sliceZ = 2.6;
  let layerCount = 3;

  // 真实正立面参数：世界宽 4.8m × 高 3.0m（严格 1.60 : 1）
  const REAL_W = 4.8;
  const REAL_H = 3.0;
  const F_PX = 128; // 投影焦距系数
  const VP_X = 250; // 偏左单消失点，证明偏轴同样严守相似矩形！
  const VP_Y = 172;
  const CAM_X = 0.65; // 正立面中心相对主点偏右一点，产生空间行进感

  function projRect(z) {
    const w = (F_PX * REAL_W) / z;
    const h = (F_PX * REAL_H) / z;
    const cx = VP_X + (F_PX * CAM_X) / z;
    const cy = VP_Y;
    return {
      z,
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
      ratio: w / h,
      scalePct: (1.5 / z) * 100,
    };
  }

  function draw() {
    svg.innerHTML = "";
    const W = 680;
    const H = 344;

    svg.append(
      elSVG("rect", { x: 0, y: 0, width: W, height: H, fill: "#F2F8FE" }),
      elSVG("line", {
        x1: 0,
        y1: VP_Y,
        x2: W,
        y2: VP_Y,
        stroke: "#9EC8EC",
        "stroke-width": 1.2,
        "stroke-dasharray": "5 5",
      })
    );

    const fixedZs = layerCount === 3 ? [1.5, 3.0, 5.2] : [1.5, 2.2, 3.1, 4.2, 5.5];
    const nearBox = projRect(fixedZs[0]);
    const farBox = projRect(fixedZs[fixedZs.length - 1]);
    const activeBox = projRect(sliceZ);

    // 连接最前框与单消失点的四条 Z 轴射线（所有中间相似矩形四角必然严丝合缝压在这四条线上！）
    const corners = [
      [nearBox.x, nearBox.y],
      [nearBox.x + nearBox.w, nearBox.y],
      [nearBox.x, nearBox.y + nearBox.h],
      [nearBox.x + nearBox.w, nearBox.y + nearBox.h],
    ];
    for (const [cx, cy] of corners) {
      svg.append(
        elSVG("line", {
          x1: cx,
          y1: cy,
          x2: VP_X,
          y2: VP_Y,
          stroke: "#69B3F5",
          "stroke-width": 1.4,
          "stroke-dasharray": "6 4",
        })
      );
    }

    // 从远到近绘出固定参考正立面框
    for (let i = fixedZs.length - 1; i >= 0; i--) {
      const r = projRect(fixedZs[i]);
      const isNear = i === 0;
      const isFar = i === fixedZs.length - 1;
      svg.append(
        elSVG("rect", {
          x: r.x,
          y: r.y,
          width: r.w,
          height: r.h,
          fill: isNear ? "rgba(105,179,245,0.12)" : "rgba(32,103,182,0.12)",
          stroke: "#2067B6",
          "stroke-width": isNear || isFar ? 2 : 1.3,
        })
      );
      // 正立面深度标（远框标在右下内侧，避开中央消失点标签）
      svg.append(
        elSVG(
          "text",
          {
            x: isFar ? r.x + r.w - 5 : r.x + 6,
            y: isFar ? r.y + r.h - 6 : r.y + 15,
            fill: "#0F3D75",
            "font-size": 11,
            "font-weight": 700,
            "text-anchor": isFar ? "end" : "start",
          },
          `Z=${r.z.toFixed(1)}m`
        )
      );
    }

    // 绘出用户可拖动的橙色活动正立面切片帧框
    svg.append(
      elSVG("rect", {
        x: activeBox.x,
        y: activeBox.y,
        width: activeBox.w,
        height: activeBox.h,
        fill: "rgba(252, 117, 10, 0.14)",
        stroke: "#FC750A",
        "stroke-width": 2.8,
      })
    );
    // 四个角点小圆标出它严丝合缝卡在四条透视线上
    for (const [ax, ay] of [
      [activeBox.x, activeBox.y],
      [activeBox.x + activeBox.w, activeBox.y],
      [activeBox.x, activeBox.y + activeBox.h],
      [activeBox.x + activeBox.w, activeBox.y + activeBox.h],
    ]) {
      svg.append(elSVG("circle", { cx: ax, cy: ay, r: 4, fill: "#FC750A", stroke: "#FFFFFF", "stroke-width": 1.4 }));
    }

    // 活动框宽/高双标注
    svg.append(
      elSVG(
        "text",
        {
          x: activeBox.x + activeBox.w / 2,
          y: activeBox.y - 8,
          fill: "#A33D00",
          "font-size": 12,
          "font-weight": 700,
          "text-anchor": "middle",
        },
        `活动截面 ${Math.round(activeBox.w)} × ${Math.round(activeBox.h)} px（宽:高 = ${activeBox.ratio.toFixed(2)} : 1）`
      )
    );

    // 消失点标记（标签放正下方空白处，绝不与深框数字碰头）
    svg.append(
      elSVG("circle", { cx: VP_X, cy: VP_Y, r: 6.5, fill: "#FC750A", stroke: "#FFFFFF", "stroke-width": 2 }),
      elSVG(
        "text",
        { x: VP_X, y: VP_Y + 21, fill: "#06111F", "font-size": 11.5, "font-weight": 700, "text-anchor": "middle" },
        "单消失点"
      )
    );

    // 更新数值表（近框 / 活动截面 / 远框 三者精确对比）
    valDepth.textContent = `Z = ${sliceZ.toFixed(2)} m`;
    const rows = [
      { label: "近景正立面", box: nearBox, accent: false },
      { label: "活动切片（当前）", box: activeBox, accent: true },
      { label: "远景正立面", box: farBox, accent: false },
    ];
    tableBody.innerHTML = rows
      .map(
        (r) => `<tr class="${r.accent ? "is-active" : ""}">
          <td>${r.label}</td>
          <td class="num">${r.box.z.toFixed(2)} m</td>
          <td class="num">${Math.round(r.box.w)} × ${Math.round(r.box.h)} px</td>
          <td class="num"><strong>${r.box.ratio.toFixed(2)} : 1</strong></td>
          <td class="num">${Math.round((r.box.w * r.box.h) / (nearBox.w * nearBox.h) * 100)}%</td>
        </tr>`
      )
      .join("");

    const areaPct = Math.round(((activeBox.w * activeBox.h) / (nearBox.w * nearBox.h)) * 100);
    summary.textContent = `活动截面推至 ${sliceZ.toFixed(2)} m 时，像素面积缩为近框的 ${areaPct}%，但宽与高永远同步按 1/Z 收缩，宽高比死锁 ${activeBox.ratio.toFixed(2)} : 1、四边永不歪斜——平行透视里的每一道正立面，都是彼此严格的相似矩形。`;
  }

  slider.addEventListener("input", () => {
    sliceZ = Number(slider.value);
    draw();
  });
  for (const btn of countBtns) {
    btn.addEventListener("click", () => {
      layerCount = Number(btn.dataset.s02Layers);
      countBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      draw();
    });
  }
  draw();
}

// =========================================================================
// 03 节：网页里的平行透视（真实 CSS perspective + perspective-origin + translateZ vs rotateY）
// =========================================================================
export function initSec03Css3d(root) {
  const scene = root.querySelector("#s03-scene");
  const cardMain = root.querySelector("#s03-card-main");
  const cardBack = root.querySelector("#s03-card-back");
  const vpDot = root.querySelector("#s03-vp-dot");
  const zSlider = root.querySelector("#s03-z");
  const zVal = root.querySelector("#s03-z-val");
  const origBtns = [...root.querySelectorAll("[data-s03-origin]")];
  const rotBtns = [...root.querySelectorAll("[data-s03-rot]")];
  const codeOut = root.querySelector("#s03-code");
  const metricOut = root.querySelector("#s03-metric");
  const diagOut = root.querySelector("#s03-diag");

  const st = {
    persp: 760,
    originX: 30, // 默认偏左，示范 perspective-origin 移位依然保持平行透视
    tz: -110,
    ry: 0,
  };

  function update() {
    scene.style.perspective = `${st.persp}px`;
    scene.style.perspectiveOrigin = `${st.originX}% 50%`;

    cardMain.style.transform = `translateZ(${st.tz}px) rotateY(${st.ry}deg)`;
    cardBack.style.transform = `translateZ(${st.tz - 150}px) rotateY(${st.ry}deg)`;

    vpDot.style.left = `${st.originX}%`;
    zVal.textContent = `${st.tz > 0 ? "+" : ""}${st.tz}px`;

    // 用标准 W3C 透视矩阵精确计算当前卡片的近远缩放与左右边高度比（与浏览器渲染完全同源）
    const cardW = 240;
    const rad = (st.ry * Math.PI) / 180;
    const zL = st.tz - (cardW / 2) * Math.sin(rad);
    const zR = st.tz + (cardW / 2) * Math.sin(rad);
    const scaleL = st.persp / Math.max(120, st.persp - zL);
    const scaleR = st.persp / Math.max(120, st.persp - zR);
    const lrRatio = scaleL / scaleR;
    const centerScale = st.persp / Math.max(120, st.persp - st.tz);

    codeOut.textContent =
      `.stage {\n  perspective: ${st.persp}px;\n  perspective-origin: ${st.originX}% 50%;\n}\n.card {\n  transform: translateZ(${st.tz}px) rotateY(${st.ry}deg);\n}`;

    if (st.ry === 0) {
      metricOut.textContent = `缩放 ${Math.round(centerScale * 100)}% · 左右边高比 1.00 : 1（纯平行透视）`;
      metricOut.dataset.state = "ok";
      diagOut.textContent = `只动 translateZ(${st.tz}px) 与 perspective-origin(${st.originX}% 50%)、不加 rotateY：卡片朝单消失点等比退远，所有横线竖线照旧对齐屏幕像素格，中文字体清晰方正。`;
    } else {
      metricOut.textContent = `缩放 ${Math.round(centerScale * 100)}% · 左右边高比 ${lrRatio.toFixed(2)} : 1（已偏转成两点透视）`;
      metricOut.dataset.state = "warn";
      diagOut.textContent = `叠入 rotateY(${st.ry}deg) 后，卡片左近右远产生真实梯形透视缩减，左右边缘高度差拉大到 ${lrRatio.toFixed(2)} : 1；原本整齐的横排文字开始斜倾、笔画发糊——正文卡片通常忌用侧转。`;
    }
  }

  zSlider.addEventListener("input", () => {
    st.tz = Number(zSlider.value);
    update();
  });
  for (const btn of origBtns) {
    btn.addEventListener("click", () => {
      st.originX = Number(btn.dataset.s03Origin);
      origBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      update();
    });
  }
  for (const btn of rotBtns) {
    btn.addEventListener("click", () => {
      st.ry = Number(btn.dataset.s03Rot);
      rotBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      update();
    });
  }
  update();
}

// =========================================================================
// 04 节：从理想城到移轴镜头（4 节点历史编年轨 + 蓝晒几何剖析窗）
// =========================================================================
export function initSec04History(root) {
  const tabs = [...root.querySelectorAll("[data-s04-era]")];
  const svg = root.querySelector("#s04-svg");
  const titleEl = root.querySelector("#s04-title");
  const metaEl = root.querySelector("#s04-meta");
  const bodyEl = root.querySelector("#s04-body");

  const ERAS = {
    urbino: {
      title: "乌尔比诺《理想城市》",
      meta: "约 1480–1490 · 佚名意大利中部画家 · 木板油画 67.7 × 239.4 cm · 马尔凯国家美术馆",
      body: "画幅宽近四比一，中央圆形神庙门洞正中即为单一消失点。广场地砖方格与左右贵族宫殿的大理石正面严格保持横平竖直，唯有退远檐线与地砖纵缝直指中轴中心点——文艺复兴用平行透视把理想城邦写成可视的几何秩序。",
      draw(svg) {
        svg.append(elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0F3D75" }));
        svg.append(elSVG("rect", { x: 0, y: 0, width: 640, height: 156, fill: "#1B5BA7" }));
        // 视平线
        svg.append(elSVG("line", { x1: 0, y1: 156, x2: 640, y2: 156, stroke: "rgba(255,255,255,0.5)", "stroke-dasharray": "5 4" }));
        // 广场辐射地砖纵线（指向正中 320,156）
        for (let i = -6; i <= 6; i++) {
          svg.append(
            elSVG("line", {
              x1: 320 + i * 76,
              y1: 300,
              x2: 320,
              y2: 156,
              stroke: "rgba(203,231,254,0.45)",
              "stroke-width": 1.1,
            })
          );
        }
        // 地砖严格水平横线（近疏远密）
        for (const y of [172, 184, 200, 222, 250, 284]) {
          svg.append(elSVG("line", { x1: 0, y1: y, x2: 640, y2: y, stroke: "rgba(255,255,255,0.42)", "stroke-width": 1 }));
        }
        // 两侧对称宫殿立面
        svg.append(
          elSVG("polygon", { points: "24,52 214,124 214,186 24,250", fill: "rgba(105,179,245,0.34)", stroke: "#FFFFFF", "stroke-width": 1.4 }),
          elSVG("polygon", { points: "616,52 426,124 426,186 616,250", fill: "rgba(105,179,245,0.34)", stroke: "#FFFFFF", "stroke-width": 1.4 })
        );
        // 建筑竖向柱列（严格垂直）
        for (const x of [66, 114, 158, 190, 450, 482, 526, 574]) {
          svg.append(elSVG("line", { x1: x, y1: 96, x2: x, y2: 215, stroke: "rgba(255,255,255,0.5)", "stroke-width": 1 }));
        }
        // 中央圆亭建筑（立面水平圆顶与竖柱）
        svg.append(
          elSVG("rect", { x: 244, y: 100, width: 152, height: 86, fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 1.8 }),
          elSVG("path", { d: "M248,100 Q320,42 392,100 Z", fill: "#408BD1", stroke: "#FFFFFF", "stroke-width": 1.8 }),
          elSVG("rect", { x: 306, y: 132, width: 28, height: 54, fill: "#0F3D75", stroke: "#FFFFFF", "stroke-width": 1.4 }),
          elSVG("circle", { cx: 320, cy: 156, r: 6.5, fill: "#FC750A", stroke: "#FFFFFF", "stroke-width": 2 }),
          elSVG("text", { x: 320, y: 34, fill: "#F2F8FE", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "圆亭门洞正中 = 单一中心点")
        );
      },
    },
    supper: {
      title: "达·芬奇《最后的晚餐》",
      meta: "1495–1498 · 干壁画 460 × 880 cm · 米兰圣玛利亚感恩教堂食堂",
      body: "据圣玛利亚感恩教堂博物馆官方专文记载，达·芬奇将全画线性透视的单一消失点设在 4 米高处、基督右太阳穴旁。天花藻井、侧壁挂毯与长桌纵深线将真实的修道院食堂墙面延伸进画框，让所有目光毫无分叉地落在中心人物身上。",
      draw(svg) {
        svg.append(elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0F3D75" }));
        const vp = { x: 320, y: 132 };
        // 天花藻井与左右壁毯进深线（全指基督右太阳穴）
        const rays = [
          [40, 20], [130, 20], [225, 20], [415, 20], [510, 20], [600, 20],
          [40, 88], [40, 168], [40, 230], [600, 88], [600, 168], [600, 230],
        ];
        for (const [rx, ry] of rays) {
          svg.append(elSVG("line", { x1: rx, y1: ry, x2: vp.x, y2: vp.y, stroke: "rgba(252,117,10,0.7)", "stroke-width": 1.2, "stroke-dasharray": "5 4" }));
        }
        // 后墙正立面与三扇窗（严格平行画框的横平竖直矩形！）
        svg.append(
          elSVG("rect", { x: 186, y: 82, width: 268, height: 112, fill: "rgba(105,179,245,0.22)", stroke: "#FFFFFF", "stroke-width": 1.8 }),
          elSVG("rect", { x: 282, y: 98, width: 76, height: 78, fill: "#408BD1", stroke: "#FFFFFF", "stroke-width": 1.5 }),
          elSVG("rect", { x: 212, y: 106, width: 46, height: 64, fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 1.2 }),
          elSVG("rect", { x: 382, y: 106, width: 46, height: 64, fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 1.2 })
        );
        // 水平长桌（横贯画面的严格 X 向水平线）
        svg.append(
          elSVG("rect", { x: 76, y: 196, width: 488, height: 42, fill: "#F2F8FE", stroke: "#06111F", "stroke-width": 1.5 }),
          // 抽象剪影三角构图示意（不画五官！）
          elSVG("polygon", { points: "320,122 284,196 356,196", fill: "#134786", stroke: "#FFFFFF", "stroke-width": 1.6 }),
          elSVG("circle", { cx: 320, cy: 132, r: 7, fill: "#FC750A", stroke: "#FFFFFF", "stroke-width": 2 }),
          elSVG("text", { x: 320, y: 274, fill: "#CBE7FE", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "天花、挂毯进深线全聚于 4 米高处的单消失点（正面窗框与长桌恒水平）")
        );
      },
    },
    olimpico: {
      title: "维琴察奥林匹克剧场",
      meta: "1580 年帕拉第奥设计 · 1585 年开幕 · 斯卡莫齐强制透视立体木构布景",
      body: "不要把它误写成单一平行透视舞台：斯卡莫齐为 1585 年首演《俄狄浦斯王》在台口五道门洞后建了底比斯七条立体木构斜街（地面急抬、屋檐急缩的强制透视）。七条街道各自拥有独立消失点，唯有正中主街近似单点正面透视，靠真实三维缩尺造出纵深幻觉。",
      draw(svg) {
        svg.append(elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0F3D75" }));
        // 平面俯视示意图：清楚呈现五门洞后的七条辐射斜街，各有消失点！
        svg.append(
          elSVG("text", { x: 320, y: 28, fill: "#FFB066", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "俯视骨架示意：五门洞后七条强制透视木构街（七街各有灭点，唯中街近似单点）")
        );
        // 台口实墙（Scaenae Frons）
        svg.append(elSVG("rect", { x: 64, y: 206, width: 512, height: 18, fill: "#CBE7FE", stroke: "#06111F", "stroke-width": 1.5 }));
        // 7 条辐射街（中门洞 3 条、左右次门洞各 2 条）
        const streets = [
          { x0: 320, y0: 206, x1: 320, y1: 54, center: true },
          { x0: 302, y0: 206, x1: 214, y1: 68, center: false },
          { x0: 338, y0: 206, x1: 426, y1: 68, center: false },
          { x0: 196, y0: 206, x1: 112, y1: 86, center: false },
          { x0: 178, y0: 206, x1: 66, y1: 128, center: false },
          { x0: 444, y0: 206, x1: 528, y1: 86, center: false },
          { x0: 462, y0: 206, x1: 574, y1: 128, center: false },
        ];
        for (const s of streets) {
          svg.append(
            elSVG("line", {
              x1: s.x0,
              y1: s.y0,
              x2: s.x1,
              y2: s.y1,
              stroke: s.center ? "#FC750A" : "#8BE4FF",
              "stroke-width": s.center ? 3.2 : 2,
            }),
            elSVG("circle", {
              cx: s.x1,
              cy: s.y1,
              r: s.center ? 6 : 4,
              fill: s.center ? "#FC750A" : "#FFFFFF",
              stroke: "#06111F",
              "stroke-width": 1.2,
            })
          );
        }
        // 半圆形观众席轮廓
        svg.append(
          elSVG("path", { d: "M120,236 Q320,310 520,236", fill: "none", stroke: "rgba(255,255,255,0.65)", "stroke-width": 1.6, "stroke-dasharray": "4 4" }),
          elSVG("text", { x: 320, y: 282, fill: "#F2F8FE", "font-size": 11, "text-anchor": "middle" }, "观众席视线穿门洞，每条街缩进极浅台深")
        );
      },
    },
    shift: {
      title: "建筑摄影移轴平移（Shift）",
      meta: "大画幅相机传统 · 1962 年 7 月 PC-Nikkor 35mm f/3.5 移入单反",
      body: "拍建筑立面时，一旦为了避开路人或把门楼放偏而歪转机身，正面墙体就会变梯形并生出第二灭点。建筑摄影用「移轴（镜头平移，Shift）」保持感光面与建筑正立面严格平行，只在超大成像圆里横向或纵向滑动取景框——这正是本页开场「拖橙点移轴」的真实光学原理。",
      draw(svg) {
        svg.append(elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0F3D75" }));
        // 超大成像圆（Image Circle）
        svg.append(
          elSVG("circle", { cx: 320, cy: 152, r: 112, fill: "rgba(105,179,245,0.18)", stroke: "#CBE7FE", "stroke-width": 1.6, "stroke-dasharray": "6 4" }),
          // 居中虚线原画框
          elSVG("rect", { x: 238, y: 102, width: 164, height: 100, fill: "none", stroke: "rgba(255,255,255,0.45)", "stroke-width": 1.2, "stroke-dasharray": "4 4" }),
          // 平移后的实线取景框（横平竖直不歪斜！）
          elSVG("rect", { x: 286, y: 102, width: 164, height: 100, fill: "rgba(32,103,182,0.42)", stroke: "#FC750A", "stroke-width": 2.4 }),
          // 成像圆里的正立面建筑（始终严格竖直水平）
          elSVG("rect", { x: 298, y: 116, width: 64, height: 74, fill: "#69B3F5", stroke: "#FFFFFF", "stroke-width": 1.5 }),
          // 建筑落在平移后画框的左 1/3！
          elSVG("line", { x1: 330, y1: 102, x2: 330, y2: 202, stroke: "#FFFFFF", "stroke-width": 1, "stroke-dasharray": "3 3" }),
          // 平移箭头
          elSVG("line", { x1: 238, y1: 82, x2: 286, y2: 82, stroke: "#FFB066", "stroke-width": 2.4 }),
          elSVG("polygon", { points: "286,77 296,82 286,87", fill: "#FFB066" }),
          elSVG("text", { x: 320, y: 28, fill: "#FFFFFF", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "超大成像圆内平移画框（Shift）：机身不转头，墙面零变形"),
          elSVG("text", { x: 368, y: 224, fill: "#FFB066", "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, "平移取景框 → 建筑自然落至左侧 1/3，右半留空")
        );
      },
    },
  };

  function show(key) {
    const item = ERAS[key];
    titleEl.textContent = item.title;
    metaEl.textContent = item.meta;
    bodyEl.textContent = item.body;
    svg.innerHTML = "";
    item.draw(svg);
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.s04Era === key)));
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => show(tab.dataset.s04Era));
  }
  show("urbino");
  return { selectEra: show };
}

// =========================================================================
// 05 节：通道尽头道具替换槽 + 视线汇聚路径重播（行者仅纯背影剪影，绝不画五官）
// =========================================================================
export function initSec05Focal(root) {
  const svg = root.querySelector("#s05-svg");
  const propBtns = [...root.querySelectorAll("[data-s05-prop]")];
  const replayBtn = root.querySelector("#s05-replay");
  const statusEl = root.querySelector("#s05-status");
  const descEl = root.querySelector("#s05-desc");

  let activeProp = "empty";
  let pulseTimer = 0;

  const PROPS = {
    empty: {
      badge: "视线扑空",
      desc: "四面八方的进深射线把目光硬押到单消失点，尽头却空无一物——读者冲到终点刹不住车，心里发虚。",
    },
    walker: {
      badge: "背影收住焦点",
      desc: "一道深色行者背影恰好立在单消失点下方：不需要画五官或动作特写，单凭高对比剪影就能稳稳接住所有引导线。",
    },
    gate: {
      badge: "正立面题字定锚",
      desc: "尽头横跨一道与画面平行的门楼题字：平行透视保证匾额横平竖直、可读性最高，最适合做封面标题或空间收口。",
    },
    clutter: {
      badge: "焦点被打散",
      desc: "尽头堆满高反差碎块与杂乱亮斑，引导线把视线推过去后被迫到处弹跳，平行透视最宝贵的「一键聚焦」优势被直接抵消。",
    },
  };

  function draw(animatePulse) {
    svg.innerHTML = "";
    const W = 680;
    const H = 330;
    const vp = { x: 340, y: 160 };

    // 蓝晒长廊背景
    svg.append(
      elSVG("rect", { x: 0, y: 0, width: W, height: 160, fill: "#B5E3FD" }),
      elSVG("rect", { x: 0, y: 160, width: W, height: 170, fill: "#2067B6" }),
      elSVG("polygon", { points: `0,18 ${vp.x - 74},${vp.y - 42} ${vp.x - 74},${vp.y + 42} 0,308`, fill: "#5CA9EE", stroke: "#FFFFFF", "stroke-width": 1.4 }),
      elSVG("polygon", { points: `${W},18 ${vp.x + 74},${vp.y - 42} ${vp.x + 74},${vp.y + 42} ${W},308`, fill: "#4693DA", stroke: "#FFFFFF", "stroke-width": 1.4 }),
      elSVG("rect", { x: vp.x - 74, y: vp.y - 42, width: 148, height: 84, fill: "#DDF0FE", stroke: "#FFFFFF", "stroke-width": 1.6 })
    );

    // 走廊透视竖柱
    for (const k of [0.22, 0.48, 0.74]) {
      const lx = k * (vp.x - 74);
      const rx = W - lx;
      const ty = 18 + k * (vp.y - 42 - 18);
      const by = 308 - k * (308 - (vp.y + 42));
      svg.append(
        elSVG("line", { x1: lx, y1: ty, x2: lx, y2: by, stroke: "rgba(255,255,255,0.68)", "stroke-width": 1.2 }),
        elSVG("line", { x1: rx, y1: ty, x2: rx, y2: by, stroke: "rgba(255,255,255,0.68)", "stroke-width": 1.2 })
      );
    }

    // 尽头四种道具渲染
    if (activeProp === "empty") {
      svg.append(
        elSVG("circle", { cx: vp.x, cy: vp.y, r: 16, fill: "none", stroke: "#A33D00", "stroke-width": 1.5, "stroke-dasharray": "4 4" }),
        elSVG("text", { x: vp.x, y: vp.y + 4, fill: "#334E68", "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, "空")
      );
    } else if (activeProp === "walker") {
      // 严格纯背影剪影（头部圆廓 + 外套肩背与双腿剪影，零五官细节！）
      svg.append(
        elSVG("ellipse", { cx: vp.x, cy: vp.y + 40, rx: 22, ry: 5, fill: "rgba(6,17,31,0.28)" }),
        elSVG("circle", { cx: vp.x, cy: vp.y - 12, r: 10, fill: "#06111F" }),
        elSVG("path", {
          d: `M${vp.x - 16},${vp.y + 2} C${vp.x - 16},${vp.y - 4} ${vp.x + 16},${vp.y - 4} ${vp.x + 16},${vp.y + 2} L${vp.x + 12},${vp.y + 39} L${vp.x + 3},${vp.y + 39} L${vp.x + 1},${vp.y + 22} L${vp.x - 1},${vp.y + 22} L${vp.x - 3},${vp.y + 39} L${vp.x - 12},${vp.y + 39} Z`,
          fill: "#06111F",
        })
      );
    } else if (activeProp === "gate") {
      svg.append(
        elSVG("rect", { x: vp.x - 62, y: vp.y - 32, width: 124, height: 42, fill: "#0F3D75", stroke: "#FFFFFF", "stroke-width": 2 }),
        elSVG("rect", { x: vp.x - 54, y: vp.y - 26, width: 108, height: 3, fill: "#FC750A" }),
        elSVG("text", { x: vp.x, y: vp.y - 6, fill: "#FFFFFF", "font-size": 16, "font-weight": 900, "text-anchor": "middle" }, "中 轴 终 点"),
        elSVG("rect", { x: vp.x - 24, y: vp.y + 10, width: 48, height: 32, fill: "#1A5BA5", stroke: "#FFFFFF", "stroke-width": 1.2 })
      );
    } else if (activeProp === "clutter") {
      const junk = [
        [vp.x - 58, vp.y - 34, 34, 24, "#FC750A"],
        [vp.x - 16, vp.y - 26, 26, 36, "#06111F"],
        [vp.x + 22, vp.y - 32, 36, 20, "#FFFFFF"],
        [vp.x - 46, vp.y + 4, 40, 26, "#0F3D75"],
        [vp.x + 12, vp.y + 2, 48, 30, "#FFB066"],
      ];
      for (const [jx, jy, jw, jh, jc] of junk) {
        svg.append(elSVG("rect", { x: jx, y: jy, width: jw, height: jh, fill: jc, stroke: "#06111F", "stroke-width": 1.2 }));
      }
    }

    // 四条视线汇聚导轨
    const guides = [
      `M 30,36 L ${vp.x - 24},${vp.y - 12}`,
      `M 650,36 L ${vp.x + 24},${vp.y - 12}`,
      `M 70,308 L ${vp.x - 18},${vp.y + 24}`,
      `M 610,308 L ${vp.x + 18},${vp.y + 24}`,
    ];
    for (const d of guides) {
      svg.append(
        elSVG("path", {
          d,
          fill: "none",
          stroke: "#FC750A",
          "stroke-width": 2.2,
          "stroke-dasharray": "8 6",
          class: animatePulse && !reducedMotion.matches ? "s05-ray is-playing" : "s05-ray",
        })
      );
    }

    // 扑空或打散时画出散射提示箭头
    if (activeProp === "empty" || activeProp === "clutter") {
      svg.append(
        elSVG("circle", { cx: vp.x, cy: vp.y, r: 30, fill: "none", stroke: "#A33D00", "stroke-width": 1.4, "stroke-dasharray": "3 5" })
      );
    } else {
      svg.append(
        elSVG("circle", { cx: vp.x, cy: vp.y, r: 36, fill: "none", stroke: "#FC750A", "stroke-width": 2 })
      );
    }

    statusEl.textContent = PROPS[activeProp].badge;
    statusEl.dataset.ok = activeProp === "walker" || activeProp === "gate" ? "1" : "0";
    descEl.textContent = PROPS[activeProp].desc;
  }

  for (const btn of propBtns) {
    btn.addEventListener("click", () => {
      activeProp = btn.dataset.s05Prop;
      propBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      draw(true);
    });
  }
  replayBtn.addEventListener("click", () => {
    clearTimeout(pulseTimer);
    draw(false);
    pulseTimer = setTimeout(() => draw(true), 20);
  });
  draw(false);
}

// =========================================================================
// 06 节：蓝晒深钴底 · 什么时候别硬用平行（四命题中缝对比拉帘）
// =========================================================================
export function initSec06Dont(root) {
  const tabs = [...root.querySelectorAll("[data-s06-case]")];
  const wrap = root.querySelector("#s06-compare");
  const svgBad = root.querySelector("#s06-bad");
  const svgGood = root.querySelector("#s06-good");
  const clipPane = root.querySelector("#s06-clip");
  const handle = root.querySelector("#s06-handle");
  const captionBad = root.querySelector("#s06-cap-bad");
  const captionGood = root.querySelector("#s06-cap-good");
  const reasonEl = root.querySelector("#s06-reason");

  let activeCase = "product";
  let split = 0.5;

  const CASES = {
    product: {
      badTitle: "硬套平行透视：只见扁平正面",
      goodTitle: "换 071 两点透视：双侧面体块立现",
      reason: "展示包装盒、家具或汽车需要同时交代正面与侧面的厚度转折；硬摆成正对平行透视，侧面几乎消失，产品扁成一张纸片——这类需求请换用 071 两点透视。",
      drawBad(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#13457E" }),
          elSVG("line", { x1: 0, y1: 180, x2: 640, y2: 180, stroke: "rgba(255,255,255,0.35)", "stroke-dasharray": "4 4" }),
          elSVG("rect", { x: 148, y: 74, width: 256, height: 158, fill: "#5CA9EE", stroke: "#FFFFFF", "stroke-width": 2 }),
          // 标牌稳放于默认 50% 中缝与橙色把手（x≈304..336）以左，打开瞬间即可完整读全
          elSVG("rect", { x: 162, y: 100, width: 130, height: 54, fill: "#0F3D75" }),
          elSVG("text", { x: 227, y: 123, fill: "#FFFFFF", "font-size": 14, "font-weight": 700, "text-anchor": "middle" }, "正面一览无余"),
          elSVG("text", { x: 227, y: 143, fill: "#CBE7FE", "font-size": 11, "font-weight": 500, "text-anchor": "middle" }, "但厚度完全看不出"),
          elSVG("text", { x: 154, y: 274, fill: "#FFB066", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "平行硬拍：看不出包装有多厚")
        );
      },
      drawGood(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0A2A52" }),
          elSVG("line", { x1: 0, y1: 168, x2: 640, y2: 168, stroke: "rgba(255,255,255,0.35)", "stroke-dasharray": "4 4" }),
          // 两点透视包装盒（左亮面 + 右暗面，双侧面立现）
          elSVG("polygon", { points: "176,94 344,64 344,234 176,204", fill: "#69B3F5", stroke: "#FFFFFF", "stroke-width": 2 }),
          elSVG("polygon", { points: "344,64 468,104 468,196 344,234", fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 2 }),
          elSVG("line", { x1: 344, y1: 64, x2: 344, y2: 234, stroke: "#FC750A", "stroke-width": 2.4 }),
          elSVG("text", { x: 260, y: 154, fill: "#06111F", "font-size": 13, "font-weight": 900, "text-anchor": "middle" }, "主封面"),
          elSVG("text", { x: 406, y: 156, fill: "#FFFFFF", "font-size": 13, "font-weight": 700, "text-anchor": "middle" }, "侧面厚度"),
          elSVG("text", { x: 486, y: 274, fill: "#CBE7FE", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "两点透视：双灭点交代体积")
        );
      },
    },
    tower: {
      badTitle: "硬套平视平行：切掉楼顶失气势",
      goodTitle: "换 072 三点透视：仰视直插天际",
      reason: "表现摩天大楼直刺云霄的压迫感，必须大角度抬头仰拍让竖线朝天顶第三消失点收束；死守平视平行透视，镜头只能截出平淡的中段楼身——这类需求请换用 072 三点透视。",
      drawBad(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#13457E" }),
          elSVG("rect", { x: 244, y: 0, width: 152, height: 300, fill: "#4B96DF", stroke: "#FFFFFF", "stroke-width": 2 })
        );
        for (let y = 36; y < 290; y += 34) {
          svg.append(elSVG("line", { x1: 244, y1: y, x2: 396, y2: y, stroke: "rgba(255,255,255,0.6)" }));
        }
        svg.append(elSVG("text", { x: 146, y: 274, fill: "#FFB066", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "平视只截到一截楼身"));
      },
      drawGood(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0A2A52" }),
          elSVG("polygon", { points: "284,42 320,32 320,256 212,232", fill: "#69B3F5", stroke: "#FFFFFF", "stroke-width": 1.8 }),
          elSVG("polygon", { points: "320,32 356,42 428,232 320,256", fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 1.8 }),
          elSVG("line", { x1: 212, y1: 232, x2: 320, y2: -36, stroke: "#FC750A", "stroke-width": 1.4, "stroke-dasharray": "5 4" }),
          elSVG("line", { x1: 428, y1: 232, x2: 320, y2: -36, stroke: "#FC750A", "stroke-width": 1.4, "stroke-dasharray": "5 4" }),
          elSVG("text", { x: 486, y: 274, fill: "#CBE7FE", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "三点仰视：竖线直指天顶")
        );
      },
    },
    blueprint: {
      badTitle: "硬套平行透视：远端零件缩水难量尺",
      goodTitle: "换 075 等距构图：前后尺寸严格等比",
      reason: "工程装配图、机房架构图与产品爆炸图需要后排零件和前排保持相同比例以便读数；平行透视的近大远小会把后排部件越缩越小——这类需求应选 074 斜投影、075 等距或 076 轴测。",
      drawBad(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#13457E" }),
          elSVG("rect", { x: 74, y: 92, width: 130, height: 116, fill: "#69B3F5", stroke: "#FFFFFF", "stroke-width": 1.8 }),
          elSVG("rect", { x: 230, y: 128, width: 60, height: 48, fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 1.4 }),
          elSVG("line", { x1: 204, y1: 92, x2: 290, y2: 128, stroke: "#FC750A", "stroke-dasharray": "4 4" }),
          elSVG("line", { x1: 204, y1: 208, x2: 290, y2: 176, stroke: "#FC750A", "stroke-dasharray": "4 4" }),
          elSVG("text", { x: 139, y: 155, fill: "#06111F", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "前模块 100%"),
          elSVG("text", { x: 260, y: 156, fill: "#FFFFFF", "font-size": 11, "text-anchor": "middle" }, "后 41%"),
          elSVG("text", { x: 154, y: 274, fill: "#FFB066", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "透视缩放：同尺寸零件难读尺")
        );
      },
      drawGood(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0A2A52" }),
          // 两个完全等大等距块（居中偏右，默认 50% 打开即完整呈现双块等比）
          elSVG("polygon", { points: "344,124 406,92 468,124 406,156", fill: "#9ED0FA", stroke: "#FFFFFF", "stroke-width": 1.6 }),
          elSVG("polygon", { points: "344,124 406,156 406,216 344,184", fill: "#5CA9EE", stroke: "#FFFFFF", "stroke-width": 1.6 }),
          elSVG("polygon", { points: "406,156 468,124 468,184 406,216", fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 1.6 }),
          elSVG("polygon", { points: "482,124 544,92 606,124 544,156", fill: "#9ED0FA", stroke: "#FFFFFF", "stroke-width": 1.6 }),
          elSVG("polygon", { points: "482,124 544,156 544,216 482,184", fill: "#5CA9EE", stroke: "#FFFFFF", "stroke-width": 1.6 }),
          elSVG("polygon", { points: "544,156 606,124 606,184 544,216", fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 1.6 }),
          elSVG("text", { x: 486, y: 274, fill: "#CBE7FE", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "等距投影：前后 1:1 严格等比")
        );
      },
    },
    casual: {
      badTitle: "硬套正中平行：日常街角像检阅仪式",
      goodTitle: "放松轴线视角：松弛自然的生活感",
      reason: "平行透视天生带着强烈的秩序、仪式与监控感（建筑立面、科幻长廊极契合）；若拍咖啡桌随笔、朋友聚会或松弛街头日常，硬把背景拉成绝对正交走廊反而显得生硬做作。",
      drawBad(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#13457E" }),
          elSVG("line", { x1: 0, y1: 30, x2: 320, y2: 148, stroke: "#FFFFFF", "stroke-width": 1.5 }),
          elSVG("line", { x1: 640, y1: 30, x2: 320, y2: 148, stroke: "#FFFFFF", "stroke-width": 1.5 }),
          elSVG("line", { x1: 0, y1: 270, x2: 320, y2: 148, stroke: "#FFFFFF", "stroke-width": 1.5 }),
          elSVG("line", { x1: 640, y1: 270, x2: 320, y2: 148, stroke: "#FFFFFF", "stroke-width": 1.5 }),
          elSVG("rect", { x: 266, y: 112, width: 108, height: 74, fill: "#2872C1", stroke: "#FFFFFF", "stroke-width": 2 }),
          elSVG("circle", { cx: 320, cy: 148, r: 14, fill: "#FC750A" }),
          elSVG("text", { x: 154, y: 274, fill: "#FFB066", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "严密轴线：失去松弛呼吸感")
        );
      },
      drawGood(svg) {
        svg.append(
          elSVG("rect", { x: 0, y: 0, width: 640, height: 300, fill: "#0A2A52" }),
          elSVG("polygon", { points: "40,224 600,196 600,300 40,300", fill: "#1A59A4" }),
          elSVG("circle", { cx: 214, cy: 174, r: 34, fill: "#FC750A", opacity: 0.9 }),
          elSVG("rect", { x: 356, y: 102, width: 158, height: 108, fill: "#5CA9EE", stroke: "#FFFFFF", "stroke-width": 1.6, transform: "rotate(-4 435 156)" }),
          elSVG("text", { x: 486, y: 274, fill: "#CBE7FE", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "错落视角：保留自在纪实节奏")
        );
      },
    },
  };

  function applySplit(v) {
    split = Math.max(0.08, Math.min(0.92, v));
    const pct = `${(split * 100).toFixed(1)}%`;
    clipPane.style.clipPath = `inset(0 ${((1 - split) * 100).toFixed(1)}% 0 0)`;
    handle.style.left = pct;
    handle.setAttribute("aria-valuenow", String(Math.round(split * 100)));
  }

  function renderCase(key) {
    activeCase = key;
    const c = CASES[key];
    svgBad.innerHTML = "";
    svgGood.innerHTML = "";
    c.drawBad(svgBad);
    c.drawGood(svgGood);
    captionBad.textContent = c.badTitle;
    captionGood.textContent = c.goodTitle;
    reasonEl.textContent = c.reason;
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.s06Case === key)));
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => renderCase(tab.dataset.s06Case));
  }

  let dragging = false;
  const moveFromClientX = (clientX) => {
    const r = wrap.getBoundingClientRect();
    applySplit((clientX - r.left) / Math.max(1, r.width));
  };
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moveFromClientX(e.clientX);
  });
  const stopDrag = () => {
    dragging = false;
  };
  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);

  wrap.addEventListener("click", (e) => {
    if (e.target === handle || handle.contains(e.target)) return;
    moveFromClientX(e.clientX);
  });

  handle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      applySplit(split - 0.06);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      applySplit(split + 0.06);
    }
  });

  renderCase("product");
  applySplit(0.5);
}

// =========================================================================
// 07 节：小练习 · 同一张 0° 偏轴大道，补画右侧楼面二层窗户上沿（A/B/C/D）
// A 水平（专钓横平竖直误解） / B 指向主消失点（正确） / C 指向视平线距点 / D 微斜指向画外第二点
// =========================================================================
export function initSec07Quiz(root) {
  const cards = [...root.querySelectorAll("[data-quiz-opt]")];
  const feedback = root.querySelector("#s07-feedback");
  const retryBtn = root.querySelector("#s07-retry");

  let answered = null;

  // 基准几何（4 张图 100% 共用同一张 0° 偏轴城市大道，唯一差异是右侧墙面窗户上沿线走向）
  const W = 320;
  const H = 200;
  const VP = { x: 108, y: 100 }; // 左侧偏轴主消失点（0° 真平行透视）
  const DP = { x: 246, y: 100 }; // 视平线上的距点（与主点相距约焦距 f）
  const VP2_OUT = { x: -95, y: 100 }; // 画外另一侧虚假第二消失点

  // 右侧楼面轮廓（从近右边缘 x=320 退向远端门楼右柱 x=166）
  const WALL_TOP_NEAR = { x: 320, y: 12 };
  const WALL_TOP_FAR = { x: 166, y: 76 }; // 检查共线：(166-108)/(76-100) = 58/-24; (320-108)/(12-100) = 212/-88 ≈ 58/-24！精准指向 VP！
  const WALL_BOT_NEAR = { x: 320, y: 188 };
  const WALL_BOT_FAR = { x: 166, y: 124 };

  // 右侧楼面两扇二层窗的竖直框与下窗台（下窗台沿 Z 轴共汇于 VP，竖框严格垂直）
  // 窗户 X 区间：近窗 [248, 294]，远窗 [192, 228]
  // 在视平线以上 y_base(x) = VP.y - k * (x - VP.x)
  const rayY = (target, anchorX, anchorY, x) => {
    const t = (x - anchorX) / (target.x - anchorX);
    return anchorY + (target.y - anchorY) * t;
  };

  // 以近窗右竖框顶点 (294, 46) 为统一起点（四项窗户位置、竖框、下窗台完全相同！）
  // 计算下窗台（按指向 VP 的正确 Z 线）
  const sillY = (x) => rayY(VP, 294, 86, x);
  // 计算每个选项的「窗户上沿」函数 topY(x)
  const topFnByOpt = {
    // A：严格水平横线（专钓「平行透视所有横线都水平」的经典误解！）
    A: () => 48,
    // B（正确）：精准指向主消失点 VP(108, 100)
    B: (x) => rayY(VP, 294, 46, x),
    // C：指向视平线上的距点 DP(246, 100) —— 角度明显更陡，斜冲下方视平线
    C: (x) => {
      // 从近窗右顶 (294, 46) 指向视平线距点附近的假斜向（保证窗顶不穿破窗台，以 (294, 46) 指向 (148, 100)）
      return rayY({ x: 158, y: 100 }, 294, 46, x);
    },
    // D：微斜指向画外左侧另一点 VP2_OUT(-95, 100) —— 斜率偏平、与楼顶檐线明显分叉
    D: (x) => rayY(VP2_OUT, 294, 46, x),
  };

  const EXPLAIN = {
    A: "选 A 不对：A 把右侧墙面的窗户上沿画成了水平线——这是把「平行透视」误解成「所有横线都保持水平」。只有正对画面的正立面横线（X 轴）才水平；右侧墙面沿街道纵深延伸，窗沿属于 Z 轴进深线，必须向主消失点倾斜收敛。",
    B: "答对了！B 是唯一正确的画法：右侧楼面属于进深方向（Z 轴）的侧墙，窗框上沿与屋檐、路沿互为空间平行线，因此延长后必须严丝合缝交汇在视平线上的唯一主消失点（橙点）。",
    C: "选 C 不对：C 的窗沿确实画斜了，但它偏去了视平线上的距点方向（坡度比真实屋檐更陡），延长线错过了主消失点，让窗户像向外扭离了整面楼墙。",
    D: "选 D 不对：D 的窗沿略微下倾，但延长线并没有汇入主消失点，而是飘向了画外另一侧的第二点，破坏了平行透视「进深线共汇单点」的铁律。",
  };

  function drawOption(svg, opt, showReveal) {
    svg.innerHTML = "";
    const topY = topFnByOpt[opt];

    // 晴空与地面
    svg.append(
      elSVG("rect", { x: 0, y: 0, width: W, height: 100, fill: "#C5E5FE" }),
      elSVG("rect", { x: 0, y: 100, width: W, height: 100, fill: "#246DBB" })
    );

    // 左侧窄墙与尽头正立面门楼（四图 100% 相同，严格 0° 偏轴平行透视）
    svg.append(
      elSVG("polygon", { points: "0,54 70,84 70,116 0,146", fill: "#69B3F5", stroke: "#FFFFFF", "stroke-width": 1.2 }),
      elSVG("rect", { x: 70, y: 76, width: 96, height: 48, fill: "#1B5BA7", stroke: "#FFFFFF", "stroke-width": 1.3 }),
      elSVG("rect", { x: 96, y: 90, width: 24, height: 34, fill: "#DDF0FE", stroke: "#FFFFFF", "stroke-width": 1 }),
      // 右侧宽阔楼面
      elSVG("polygon", {
        points: `${WALL_TOP_NEAR.x},${WALL_TOP_NEAR.y} ${WALL_TOP_FAR.x},${WALL_TOP_FAR.y} ${WALL_BOT_FAR.x},${WALL_BOT_FAR.y} ${WALL_BOT_NEAR.x},${WALL_BOT_NEAR.y}`,
        fill: "#4895DD",
        stroke: "#FFFFFF",
        "stroke-width": 1.4,
      })
    );

    // 右墙原有竖直分柱
    for (const wx of [184, 238, 306]) {
      const ty = rayY(VP, WALL_TOP_NEAR.x, WALL_TOP_NEAR.y, wx);
      const by = rayY(VP, WALL_BOT_NEAR.x, WALL_BOT_NEAR.y, wx);
      svg.append(elSVG("line", { x1: wx, y1: ty, x2: wx, y2: by, stroke: "rgba(255,255,255,0.4)", "stroke-width": 1 }));
    }

    // 路面透视线
    svg.append(
      elSVG("line", { x1: 24, y1: 200, x2: 78, y2: 124, stroke: "rgba(255,255,255,0.7)", "stroke-width": 1.1 }),
      elSVG("line", { x1: 256, y1: 200, x2: 154, y2: 124, stroke: "rgba(255,255,255,0.7)", "stroke-width": 1.1 })
    );

    // 绘制右侧楼面二层两扇窗（下沿与竖框相同，唯独上沿窗框线用醒目信号橙粗线标出！）
    const windows = [
      [246, 294],
      [194, 228],
    ];
    for (const [x1, x2] of windows) {
      const y1t = topY(x1);
      const y2t = topY(x2);
      const y1b = sillY(x1);
      const y2b = sillY(x2);
      // 窗洞玻璃面
      svg.append(
        elSVG("polygon", {
          points: `${x1},${y1t} ${x2},${y2t} ${x2},${y2b} ${x1},${y1b}`,
          fill: "#113D75",
        }),
        // 竖框与下窗台（白色固定参照）
        elSVG("polyline", {
          points: `${x1},${y1t} ${x1},${y1b} ${x2},${y2b} ${x2},${y2t}`,
          fill: "none",
          stroke: "#FFFFFF",
          "stroke-width": 1.5,
        }),
        // 待判断的「窗户上沿线」（统一高对比橙白强调线）
        elSVG("line", {
          x1,
          y1: y1t,
          x2,
          y2: y2t,
          stroke: "#FC750A",
          "stroke-width": 3.4,
          "stroke-linecap": "square",
        })
      );
    }

    // 交卷后统一浮现真实几何校验线与消失点
    if (showReveal) {
      // 视平线
      svg.append(
        elSVG("line", { x1: 0, y1: VP.y, x2: W, y2: VP.y, stroke: "rgba(255,255,255,0.78)", "stroke-width": 1.1, "stroke-dasharray": "4 4" })
      );
      // 屋檐基准延长线（全部汇聚于 VP）
      svg.append(
        elSVG("line", { x1: WALL_TOP_NEAR.x, y1: WALL_TOP_NEAR.y, x2: VP.x, y2: VP.y, stroke: "#CBE7FE", "stroke-width": 1.1, "stroke-dasharray": "3 3" })
      );
      // 窗沿延长线（从近窗右顶一路延到左边界，暴露究竟指向哪）
      const extX = 16;
      const extY = topY(extX);
      svg.append(
        elSVG("line", {
          x1: 294,
          y1: topY(294),
          x2: extX,
          y2: extY,
          stroke: opt === "B" ? "#8BE4FF" : "#FFB066",
          "stroke-width": 1.8,
          "stroke-dasharray": "5 3",
        }),
        // 主消失点橙圈
        elSVG("circle", { cx: VP.x, cy: VP.y, r: 5.5, fill: "#FC750A", stroke: "#FFFFFF", "stroke-width": 1.8 })
      );

      // 若为 C，同时标出延长线扎到视平线的错误交点（距点侧）
      if (opt === "C") {
        svg.append(elSVG("circle", { cx: 158, cy: 100, r: 4.5, fill: "#FFB066", stroke: "#06111F", "stroke-width": 1.2 }));
      }
      // 标注对错角标（放左下角，绝不与左上角 A/B/C/D 冲突，也绝不压住右侧楼面窗户！）
      const isRight = opt === "B";
      svg.append(
        elSVG("rect", { x: 8, y: 170, width: isRight ? 104 : 108, height: 22, fill: isRight ? "#0F3D75" : "#06111F" }),
        elSVG(
          "text",
          {
            x: isRight ? 60 : 62,
            y: 185,
            fill: isRight ? "#8BE4FF" : "#FFB066",
            "font-size": 11,
            "font-weight": 700,
            "text-anchor": "middle",
          },
          isRight ? "✓ 汇于主消失点" : opt === "A" ? "× 水平不汇聚" : opt === "C" ? "× 偏去距点" : "× 飘向画外点"
        )
      );
    }
  }

  function renderAll() {
    for (const card of cards) {
      const opt = card.dataset.quizOpt;
      const svg = card.querySelector("svg");
      drawOption(svg, opt, answered !== null);
      card.dataset.selected = String(answered === opt);
      card.dataset.result = answered === null ? "" : opt === "B" ? "correct" : answered === opt ? "wrong" : "dim";
      card.setAttribute("aria-pressed", String(answered === opt));
    }
    if (answered === null) {
      feedback.hidden = true;
      retryBtn.hidden = true;
    } else {
      feedback.hidden = false;
      retryBtn.hidden = false;
      feedback.dataset.correct = String(answered === "B");
      feedback.textContent = EXPLAIN[answered];
    }
  }

  for (const card of cards) {
    card.addEventListener("click", () => {
      answered = card.dataset.quizOpt;
      renderAll();
    });
  }
  retryBtn.addEventListener("click", () => {
    answered = null;
    renderAll();
  });

  renderAll();
}

// =========================================================================
// 08 节：原海报放大拖拽灯箱（遵守 GUIDE.md：draggable="false"，Esc 关闭）
// =========================================================================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const closeBtn = document.getElementById("lb-close");
  const zoomBtns = [...document.querySelectorAll("[data-lb-zoom]")];

  if (!poster || !modal || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;
  let opener = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbStage.dataset.zoomed = scale > 1 ? "1" : "0";
  }

  function setZoom(z) {
    scale = z;
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    zoomBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.lbZoom) === z)));
    applyTransform();
  }

  function open(trigger) {
    opener = trigger || document.activeElement;
    lbImg.src = poster.src; // 复用唯一内联的原海报 data URI，绝不二次嵌入
    setZoom(1);
    modal.hidden = false;
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    if (opener && opener.focus) opener.focus();
  }

  poster.addEventListener("click", () => open(openBtn));
  if (openBtn) openBtn.addEventListener("click", () => open(openBtn));
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === lbStage) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  for (const btn of zoomBtns) {
    btn.addEventListener("click", () => setZoom(Number(btn.dataset.lbZoom)));
  }

  lbStage.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  const stop = () => {
    dragging = false;
  };
  lbStage.addEventListener("pointerup", stop);
  lbStage.addEventListener("pointercancel", stop);
}
