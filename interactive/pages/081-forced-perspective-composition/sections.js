// 081 强制透视构图 · 正文各节专属互动图解（相邻节绝不复用同一种控件）
// 01: 双模式针孔射线天平（切换「原地拧焦段」vs「走近+广角」）
// 02: 视差偏轴穿帮滑轨（0°–35° 侧步揭穿单视点幻觉）
// 03: 暗室消失点落位五态直选网格
// 04: 斯帕达宫 8.6m 真实剖面 vs 37m 幻觉翻页卡
// 05: 四张翻车病例「翻车态 ↔ 修正态」拨签对比
// 06: 暗房四选一小练习（中性标签 A/B/C/D，单变量对比）
// 07: 原海报灯箱放大拖拽与 Esc 关闭

import { computeMetrics, corridorSection } from "./model.js";
import { PALETTE, drawSilhouettePerson } from "./stage.js";

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(160, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ========== 01 针孔射线天平 ==========
export function initSec01Optical() {
  const canvas = document.getElementById("sec01-canvas");
  const noteEl = document.getElementById("sec01-note");
  const btns = [...document.querySelectorAll("[data-sec01-mode]")];
  if (!canvas || !btns.length) return () => {};

  let mode = "zoom-only";
  const modes = {
    "zoom-only": {
      focal: 20,
      z1: 12,
      z2: 20,
      label: "原地拧到 20mm 广角（脚没动：近 12m / 远 20m）",
      note: "看画布左端的成像面：虽然从 95mm 拧到了 20mm，视野变宽了，但近人与远人的物距比仍是 20 ÷ 12 = 1.67。两人只是同时变小，身高比一分没涨！",
    },
    "tele-only": {
      focal: 95,
      z1: 12,
      z2: 20,
      label: "原地用 95mm 长焦（近 12m / 远 20m）",
      note: "物距比同样是 20 ÷ 12 = 1.67。长焦把两个人一块放大，像裁切放大照片一样，近大远小的比例关系完全没有变。",
    },
    "step-in": {
      focal: 20,
      z1: 2.0,
      z2: 20,
      label: "向前走近到 2.0m + 换 20mm 装下全景",
      note: "物距比从 1.67 暴涨到 20 ÷ 2 = 10.0！穿过针孔的近景夹角瞬间撑满传感器，远景缩成十分之一——真正制造近大远小的是你的脚步，广角只是让你站这么近还不切头。",
    },
  };

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const cfg = modes[mode];
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, w, h);

    // 左侧传感成像面、针孔、右侧真实物理空间
    const pinX = w * 0.28;
    const sensorX = pinX - clampVal(cfg.focal * 0.48, 16, w * 0.16);
    const axisY = h * 0.62;
    const floorY = h * 0.84;

    // 地面线与光轴
    ctx.strokeStyle = "rgba(15, 27, 27, 0.24)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pinX, floorY);
    ctx.lineTo(w - 18, floorY);
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(16, axisY);
    ctx.lineTo(w - 18, axisY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 传感器竖条
    const sensorHalfH = h * 0.25;
    ctx.strokeStyle = PALETTE.tealWall;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sensorX, axisY - sensorHalfH);
    ctx.lineTo(sensorX, axisY + sensorHalfH);
    ctx.stroke();

    // 针孔暗箱隔板
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pinX, 18);
    ctx.lineTo(pinX, axisY - 6);
    ctx.moveTo(pinX, axisY + 6);
    ctx.lineTo(pinX, h - 18);
    ctx.stroke();

    // 两名真实等高人物（完全同样像素高 objH）
    const objH = h * 0.34;
    const zToX = (z) => pinX + 18 + (z / 22) * (w - pinX - 48);
    const x1 = zToX(cfg.z1);
    const x2 = zToX(cfg.z2);

    // 画从头顶穿过针孔到传感器的光学射线
    const headY = floorY - objH;
    const projHead1 = axisY + ((axisY - headY) * (pinX - sensorX)) / (x1 - pinX);
    const projFoot1 = axisY + ((axisY - floorY) * (pinX - sensorX)) / (x1 - pinX);
    const projHead2 = axisY + ((axisY - headY) * (pinX - sensorX)) / (x2 - pinX);
    const projFoot2 = axisY + ((axisY - floorY) * (pinX - sensorX)) / (x2 - pinX);

    // 远景射线（深松青）
    ctx.strokeStyle = "rgba(18, 82, 81, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x2, headY);
    ctx.lineTo(sensorX, projHead2);
    ctx.moveTo(x2, floorY);
    ctx.lineTo(sensorX, projFoot2);
    ctx.stroke();

    // 近景射线（烈焰朱红）
    ctx.strokeStyle = "rgba(217, 57, 17, 0.72)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x1, headY);
    ctx.lineTo(sensorX, projHead1);
    ctx.moveTo(x1, floorY);
    ctx.lineTo(sensorX, projFoot1);
    ctx.stroke();

    // 传感器上的实测成像柱
    ctx.lineWidth = 5;
    ctx.strokeStyle = PALETTE.redStrong;
    ctx.beginPath();
    ctx.moveTo(sensorX - 7, clampVal(projFoot1, axisY - sensorHalfH, axisY + sensorHalfH));
    ctx.lineTo(sensorX - 7, clampVal(projHead1, axisY - sensorHalfH, axisY + sensorHalfH));
    ctx.stroke();

    ctx.strokeStyle = PALETTE.tealWall;
    ctx.beginPath();
    ctx.moveTo(sensorX - 15, clampVal(projFoot2, axisY - sensorHalfH, axisY + sensorHalfH));
    ctx.lineTo(sensorX - 15, clampVal(projHead2, axisY - sensorHalfH, axisY + sensorHalfH));
    ctx.stroke();

    // 画真实空间里两名完全等高的人影
    drawSilhouettePerson(ctx, x1, floorY, objH, PALETTE.red, 1);
    drawSilhouettePerson(ctx, x2, floorY, objH, PALETTE.tealWall, 0.92);

    // 顶部数据读数
    const ratio = (cfg.z2 / cfg.z1).toFixed(cfg.z2 / cfg.z1 >= 10 ? 0 : 2);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(cfg.label, 14, 24);
    ctx.fillStyle = Number(ratio) >= 8 ? PALETTE.redDeep : PALETTE.tealWall;
    ctx.font = `700 13px "DM Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(`h1 : h2 = ${ratio} : 1`, w - 14, 24);

    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `500 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`近 ${cfg.z1}m`, x1, floorY + 16);
    ctx.fillText(`远 ${cfg.z2}m`, x2, floorY + 16);
    ctx.fillText("成像面", sensorX, axisY + sensorHalfH + 16);
    ctx.fillText("针孔", pinX, h - 4);
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.sec01Mode;
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      if (noteEl) noteEl.textContent = modes[mode].note;
      draw();
    });
  });
  if (noteEl) noteEl.textContent = modes[mode].note;
  draw();
  return draw;
}

// ========== 02 视差偏轴穿帮滑轨 ==========
export function initSec02Parallax() {
  const canvas = document.getElementById("sec02-canvas");
  const slider = document.getElementById("sec02-angle");
  const valEl = document.getElementById("sec02-angle-val");
  const readEl = document.getElementById("sec02-readout");
  if (!canvas || !slider) return () => {};

  function draw() {
    const deg = Number(slider.value);
    if (valEl) valEl.textContent = `${deg}°`;
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#F4F8F6";
    ctx.fillRect(0, 0, w, h);

    // 左半区：借位透视（手指捏塔）；右半区：埃姆斯梯形屋（两同高人）
    const mid = w * 0.5;
    ctx.strokeStyle = "rgba(18, 82, 81, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mid, 14);
    ctx.lineTo(mid, h - 14);
    ctx.stroke();

    const rad = (deg * Math.PI) / 180;
    const shiftNear = Math.sin(rad) * Math.min(mid * 0.34, 72);
    const shiftFar = Math.sin(rad) * 8;

    // 左：借位指尖捏塔
    const lCx = mid * 0.5;
    const horizonY = h * 0.72;
    ctx.fillStyle = PALETTE.tealWall;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("① 相机借位（近指 + 远塔）", 14, 24);

    // 远塔
    const tx = lCx - shiftFar;
    ctx.fillStyle = PALETTE.tealWall;
    ctx.beginPath();
    ctx.moveTo(tx - 10, horizonY);
    ctx.lineTo(tx - 6, horizonY - h * 0.42);
    ctx.lineTo(tx, horizonY - h * 0.52);
    ctx.lineTo(tx + 6, horizonY - h * 0.42);
    ctx.lineTo(tx + 10, horizonY);
    ctx.closePath();
    ctx.fill();

    // 前景捏合指尖（大红夹爪剪影，随侧移剧烈错位）
    const hx = lCx + shiftNear;
    ctx.strokeStyle = PALETTE.redStrong;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hx - 46, horizonY - h * 0.34);
    ctx.lineTo(hx - 9, horizonY - h * 0.47);
    ctx.moveTo(hx - 46, horizonY - h * 0.14);
    ctx.lineTo(hx - 9, horizonY - h * 0.06);
    ctx.stroke();

    // 右：埃姆斯梯形屋（0° 正视呈方屋，侧移露出倾斜后墙）
    const rCx = mid + (w - mid) * 0.5;
    ctx.fillStyle = PALETTE.tealWall;
    ctx.fillText("② 物理梯形（埃姆斯屋 1946）", mid + 14, 24);

    const boxW = Math.min((w - mid) * 0.62, 180);
    const boxH = h * 0.54;
    const bx = rCx - boxW * 0.5;
    const by = h * 0.24;
    const reveal = deg / 35; // 0 = 伪方屋，1 = 暴露真实梯形

    // 屋框（随侧移显出斜底、斜顶、后墙拉远）
    ctx.strokeStyle = PALETTE.tealWall;
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(18, 82, 81, 0.08)";
    ctx.beginPath();
    ctx.moveTo(bx, by + reveal * 12);
    ctx.lineTo(bx + boxW, by - reveal * 18);
    ctx.lineTo(bx + boxW, by + boxH + reveal * 16);
    ctx.lineTo(bx, by + boxH - reveal * 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 左远角人（看起来小）vs 右近角人（看起来巨大）
    const floorL = by + boxH - reveal * 10;
    const floorR = by + boxH + reveal * 16;
    const hLeft = boxH * (0.34 + reveal * 0.20);
    const hRight = boxH * (0.74 - reveal * 0.14);
    drawSilhouettePerson(ctx, bx + boxW * 0.25, floorL - 4, hLeft, PALETTE.red, 1);
    drawSilhouettePerson(ctx, bx + boxW * 0.75, floorR - 4, hRight, PALETTE.red, 1);

    ctx.fillStyle = deg <= 3 ? PALETTE.ok : PALETTE.redDeep;
    ctx.font = `600 11px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(deg <= 3 ? "0° 单视点：错觉成立" : `偏轴 ${deg}°：视差穿帮`, lCx, h - 12);
    ctx.fillText(deg <= 3 ? "窥孔看去像正方屋" : "梯形斜墙与等高真相曝光", rCx, h - 12);

    if (readEl) {
      readEl.textContent =
        deg <= 3
          ? "正对唯一观察点（0°）：左侧指尖精准夹住远塔，右侧梯形墙在单眼下伪装成规整方盒，两个身高完全一样的人变成巨人与小人。"
          : `侧步偏离 ${deg}°：视差瞬间暴露了真实空间深度！左图近手指甩离远塔，右图倾斜的天花板与地板现出原形——强制透视对观察位置有极强依赖。`;
    }
  }

  slider.addEventListener("input", draw);
  draw();
  return draw;
}

// ========== 03 暗室消失点落位五态直选 ==========
export function initSec03VpPicker() {
  const canvas = document.getElementById("sec03-canvas");
  const noteEl = document.getElementById("sec03-note");
  const btns = [...document.querySelectorAll("[data-sec03-vp]")];
  if (!canvas || !btns.length) return () => {};

  const presets = {
    center: { u: 0.50, v: 0.44, title: "正中对称走廊", note: "四面墙壁等速率向画面正中猛收，压迫感与仪式感最强，常见于电影长廊推进（如库布里克式单点走廊）。" },
    third: { u: 0.62, v: 0.34, title: "原海报偏右三分", note: "081 原海报的选择：消失点让到中右上方，给左侧留出大面积前景锚点与说明留白，右侧高墙以更长斜边切入画面。" },
    low: { u: 0.52, v: 0.72, title: "低地平仰压", note: "消失点压低后，天花板与高层建筑占据大半画面，观者像蹲在地上仰望走廊，兼具 078 虫视构图的崇高压迫感。" },
    high: { u: 0.50, v: 0.16, title: "高地平深坠", note: "地砖铺满近八成画面，视线一路往下俯冲，适合强调漫长地面跑道或楼梯坠落感。" },
    edge: { u: 0.96, v: 0.34, title: "反例：画边泄气", note: "消失点推到画框最边缘，所有汇聚线朝画外狂奔，观者视线被直接甩出画外，走廊张力散失。" },
  };
  let cur = "third";

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const p = presets[cur];
    const vx = w * p.u;
    const vy = h * p.v;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#082424";
    ctx.fillRect(0, 0, w, h);

    // 放射透视骨架线
    const anchors = [
      [0, 0], [w * 0.35, 0], [w * 0.7, 0], [w, 0],
      [w, h * 0.45], [w, h], [w * 0.68, h], [w * 0.32, h], [0, h], [0, h * 0.55],
    ];
    ctx.strokeStyle = "rgba(125, 224, 214, 0.35)";
    ctx.lineWidth = 1.2;
    for (const [ax, ay] of anchors) {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(vx, vy);
      ctx.stroke();
    }

    // 四圈递减门框示意纵深
    for (const t of [0.16, 0.36, 0.56, 0.74]) {
      const rx1 = vx + (0 - vx) * (1 - t);
      const ry1 = vy + (0 - vy) * (1 - t);
      const rx2 = vx + (w - vx) * (1 - t);
      const ry2 = vy + (h - vy) * (1 - t);
      ctx.strokeStyle = "rgba(250, 238, 212, 0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rx1, ry1, rx2 - rx1, ry2 - ry1);
    }

    // 地平线
    ctx.strokeStyle = "rgba(255, 126, 87, 0.6)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, vy);
    ctx.lineTo(w, vy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 消失点标
    ctx.fillStyle = "#FF7E57";
    ctx.beginPath();
    ctx.arc(vx, vy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FAF0DC";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(vx, vy, 13, 0, Math.PI * 2);
    ctx.stroke();

    // 前景和远景红人
    drawSilhouettePerson(ctx, w * 0.28, h * 0.92, h * 0.42, "#FF7E57", 0.95);
    drawSilhouettePerson(ctx, clampVal(vx, 24, w - 24), vy + h * 0.08, h * 0.07, "#FF7E57", 0.95);

    ctx.fillStyle = "#FAF0DC";
    ctx.font = `600 12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`${p.title}（${Math.round(p.u * 100)}%, ${Math.round(p.v * 100)}%）`, 14, 24);
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      cur = b.dataset.sec03Vp;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (noteEl) noteEl.textContent = presets[cur].note;
      draw();
    });
  });
  if (noteEl) noteEl.textContent = presets[cur].note;
  draw();
  return draw;
}

// ========== 04 斯帕达宫幻觉 vs 真相剖面切换 ==========
export function initSec04History() {
  const toggleBtn = document.getElementById("sec04-toggle");
  const svg = document.getElementById("sec04-svg");
  const caption = document.getElementById("sec04-caption");
  if (!toggleBtn || !svg) return () => {};

  let revealed = false;
  function update() {
    svg.dataset.mode = revealed ? "truth" : "illusion";
    toggleBtn.textContent = revealed ? "切回：观者眼中的 37m 柱廊幻觉" : "掀开剖面：看 1653 斯帕达宫 8.6m 真相";
    if (caption) {
      caption.textContent = revealed
        ? "建筑师真实侧剖面：通道实长约 8.6 米，地面向上斜升、拱顶向下急压、柱高从约 5.8 米缩至约 2.45 米，尽头雕像高仅约 60 厘米。"
        : "从入口唯一观察点望去：大脑假定地板水平、柱高一致，于是把迅速变小的柱子误判成「退到三四十米外的等高巨柱」。";
    }
  }
  toggleBtn.addEventListener("click", () => {
    revealed = !revealed;
    update();
  });
  update();
  return update;
}

// ========== 05 四个翻车病例（翻车态 ↔ 修正态） ==========
export function initSec05Avoid() {
  const canvas = document.getElementById("sec05-canvas");
  const titleEl = document.getElementById("sec05-title");
  const descEl = document.getElementById("sec05-desc");
  const fixToggle = document.getElementById("sec05-fix-toggle");
  const tabs = [...document.querySelectorAll("[data-sec05-case]")];
  if (!canvas || !tabs.length) return () => {};

  const cases = {
    dof: {
      title: "病例 1：大光圈浅景深拆穿距离差",
      bad: "翻车：用 f/1.8 拍手托远塔，前景清晰、远塔糊成弥散光团。眼睛靠清晰度差立刻识破两者不在同一距离。",
      good: "修正：缩到 f/11–f/16 配合超焦距深焦拍摄，让近手与远塔同时锐利，大脑才肯信它们连在一起。",
    },
    shadow: {
      title: "病例 2：前景与背景投影方向打架",
      bad: "翻车：在合成或补光里，前景人物影子向左拉，远景建筑影子向右倒——两套光源一秒毁掉空间可信度。",
      good: "修正：同一时刻自然光直出，或严格统一补光方位角，让前景斜影顺着透视网格自然指向同一侧。",
    },
    portrait: {
      title: "病例 3：正式合影里贴脸用超广角",
      bad: "翻车：多人合影站得太近并用 16mm 广角，画面边缘的人头肩横向拉胖变形，离镜头近的手脚大得失真。",
      good: "修正：正式合影与产品测绘应退远改用 50–85mm 端正平视，把强制透视留给明确追求夸张的创意主题。",
    },
    freewalk: {
      title: "病例 4：开放展厅不做动线约束",
      bad: "翻车：在四面通透的展厅里放强制透视装置，观众从侧面走过只看到歪斜的道具与尴尬支架。",
      good: "修正：像罗马斯帕达宫一样用铁栅或窥孔框定唯一观景点，保住单点魔术不被侧面看穿。",
    },
  };

  let cur = "dof";
  let fixed = false;

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, w, h);

    const floorY = h * 0.80;
    ctx.strokeStyle = "rgba(15, 27, 27, 0.2)";
    ctx.beginPath();
    ctx.moveTo(16, floorY);
    ctx.lineTo(w - 16, floorY);
    ctx.stroke();

    if (cur === "dof") {
      // 前景人物清晰；远塔在 bad 态弥散糊掉，good 态锐利清晰
      drawSilhouettePerson(ctx, w * 0.34, floorY, h * 0.56, PALETTE.red, 1);
      const tx = w * 0.68;
      if (!fixed) {
        for (const [ox, oy] of [[-5, 0], [5, 0], [0, -5], [0, 5], [-4, -4], [4, 4]]) {
          ctx.fillStyle = "rgba(18, 82, 81, 0.16)";
          ctx.fillRect(tx - 16 + ox, floorY - h * 0.52 + oy, 32, h * 0.52);
        }
      } else {
        ctx.fillStyle = PALETTE.tealWall;
        ctx.fillRect(tx - 14, floorY - h * 0.52, 28, h * 0.52);
      }
      ctx.fillStyle = fixed ? PALETTE.ok : PALETTE.redDeep;
      ctx.font = `600 11px "DM Mono", monospace`;
      ctx.fillText(fixed ? "f/16 · 前后同时锐利" : "f/1.8 · 远景散景穿帮", 14, 24);
    } else if (cur === "shadow") {
      // 投影方向对比
      const drawShadow = (x, dir, len) => {
        ctx.fillStyle = "rgba(93, 113, 102, 0.5)";
        ctx.beginPath();
        ctx.moveTo(x - 10, floorY);
        ctx.lineTo(x + 10, floorY);
        ctx.lineTo(x + dir * len + 8, floorY + 26);
        ctx.lineTo(x + dir * len - 14, floorY + 26);
        ctx.closePath();
        ctx.fill();
      };
      drawShadow(w * 0.30, -1, 56);
      drawShadow(w * 0.72, fixed ? -1 : 1, 34);
      drawSilhouettePerson(ctx, w * 0.30, floorY, h * 0.56, PALETTE.red, 1);
      drawSilhouettePerson(ctx, w * 0.72, floorY, h * 0.24, PALETTE.tealWall, 1);
      ctx.fillStyle = fixed ? PALETTE.ok : PALETTE.redDeep;
      ctx.font = `600 11px "DM Mono", monospace`;
      ctx.fillText(fixed ? "同侧一致光源投影" : "左右冲突双光源穿帮", 14, 24);
    } else if (cur === "portrait") {
      // 合影边缘拉宽对比
      const xs = [0.22, 0.50, 0.78];
      xs.forEach((u, i) => {
        const stretch = !fixed && i !== 1 ? 1.48 : 1.0;
        ctx.save();
        ctx.translate(w * u, floorY);
        ctx.scale(stretch, 1);
        drawSilhouettePerson(ctx, 0, 0, h * (i === 1 ? 0.54 : 0.50), i === 1 ? PALETTE.tealWall : PALETTE.red, 0.92);
        ctx.restore();
      });
      ctx.fillStyle = fixed ? PALETTE.ok : PALETTE.redDeep;
      ctx.font = `600 11px "DM Mono", monospace`;
      ctx.fillText(fixed ? "50mm 退远 · 边缘人像端正" : "16mm 贴脸 · 边缘横向拉胖 1.5×", 14, 24);
    } else {
      // 开放展厅侧看穿帮 vs 窥孔围栏锁视点
      ctx.strokeStyle = PALETTE.tealWall;
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.16, h * 0.22, w * 0.68, h * 0.56);
      ctx.fillStyle = fixed ? PALETTE.ok : PALETTE.redStrong;
      if (fixed) {
        // 锁定入口单点
        ctx.beginPath();
        ctx.arc(w * 0.16, h * 0.50, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(18, 97, 74, 0.16)";
        ctx.beginPath();
        ctx.moveTo(w * 0.16, h * 0.50);
        ctx.lineTo(w * 0.84, h * 0.28);
        ctx.lineTo(w * 0.84, h * 0.72);
        ctx.closePath();
        ctx.fill();
      } else {
        // 多方向观众从侧面穿帮
        for (const [px, py] of [[0.50, 0.18], [0.68, 0.82], [0.32, 0.82]]) {
          ctx.beginPath();
          ctx.arc(w * px, h * py, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = fixed ? PALETTE.ok : PALETTE.redDeep;
      ctx.font = `600 11px "DM Mono", monospace`;
      ctx.fillText(fixed ? "限定唯一入口窥视点" : "三面自由漫游 · 侧面全看穿", 14, 24);
    }

    const info = cases[cur];
    if (titleEl) titleEl.textContent = info.title;
    if (descEl) descEl.textContent = fixed ? info.good : info.bad;
    if (fixToggle) {
      fixToggle.textContent = fixed ? "切回看翻车现场" : "一键看修正做法";
      fixToggle.setAttribute("aria-pressed", String(fixed));
    }
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      cur = t.dataset.sec05Case;
      fixed = false;
      tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
      draw();
    });
  });
  if (fixToggle) {
    fixToggle.addEventListener("click", () => {
      fixed = !fixed;
      draw();
    });
  }
  draw();
  return draw;
}

// ========== 06 暗房小练习（4 枚完全同题材、只改单一变量的微型透视实景卡） ==========
export function initSec06Quiz() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("quiz-feedback");
  if (!cards.length) return () => {};

  const options = {
    A: {
      ok: false,
      focal: 110, nearZ: 14.5, farZ: 22.0, nearX: -0.45, clutter: false,
      title: "方案 A · 未成立（物距比过小 + 长焦压扁）",
      why: "前景在 14.5m、远景在 22m，两人投影身高比只有 1.5 : 1，而且 110mm 长焦把走廊地砖和窗洞压得平平的，完全没有强制透视应有的近大远小戏剧差。",
    },
    B: {
      ok: true,
      focal: 20, nearZ: 2.6, farZ: 50.0, nearX: -0.44, clutter: false,
      title: "方案 B · 回答正确！强制透视完全成立",
      why: "20mm 广角配合 2.6m vs 50m 的大物距比，实测拉开约 19 : 1 的悬殊身高差；前景头肩完整不裁切、通道净空无杂物、近景微偏左侧正好露出消失点里的远景参照人。",
    },
    C: {
      ok: false,
      focal: 20, nearZ: 0.78, farZ: 50.0, nearX: -0.35, clutter: false,
      title: "方案 C · 未成立（前景过贴镜头被切头）",
      why: "和方案 B 只差「近景物距」一个变量：压到 0.78m 后前景红人巨大到头肩与脚底双双冲出画框边缘，主体残缺变形，反差过度变成失控裁切。",
    },
    D: {
      ok: false,
      focal: 20, nearZ: 2.6, farZ: 50.0, nearX: 0.0, clutter: true,
      title: "方案 D · 未成立（杂物截断收敛线且前景遮死远景）",
      why: "焦段和物距与方案 B 完全一样，但只改动了「场景简化与错位」一个变量：通道杂物打断了汇聚视线，居中的近景红人直接挡住远景参照人，近大远小失去对比支点。",
    },
  };

  function drawOptionCanvas(optKey) {
    const c = document.querySelector(`[data-quiz-canvas="${optKey}"]`);
    if (!c) return;
    const { ctx, w, h } = setupCanvas(c);
    const o = options[optKey];
    const st = {
      scene: "corridor",
      focal: o.focal,
      nearZ: o.nearZ,
      farZ: o.farZ,
      nearX: o.nearX,
      farX: 0,
      vpU: 0.56,
      vpV: 0.35,
      taperDeg: 0,
      camOffsetX: 0,
      clutter: o.clutter,
      aperture: "deep",
      activeLayer: "none",
    };
    const m = computeMetrics(st, w, h);
    const { project, vpX, vpY } = m.proj;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 简化高辨识走廊底图
    const sN = corridorSection(st, 1.1);
    const sF = corridorSection(st, 52);
    const wtN = project(sN.rightX, sN.ceilY, 1.1);
    const wtF = project(sF.rightX, sF.ceilY, 52);
    const wbN = project(sN.rightX, sN.floorY, 1.1);
    const wbF = project(sF.rightX, sF.floorY, 52);

    ctx.fillStyle = PALETTE.tealWall;
    ctx.beginPath();
    ctx.moveTo(wtF.x, wtF.y);
    ctx.lineTo(w + 20, wtN.y);
    ctx.lineTo(w + 20, h + 20);
    ctx.lineTo(wbN.x, wbN.y);
    ctx.lineTo(wbF.x, wbF.y);
    ctx.closePath();
    ctx.fill();

    // 地面线
    ctx.strokeStyle = "rgba(15, 27, 27, 0.28)";
    ctx.lineWidth = 0.85;
    for (let i = 0; i <= 4; i++) {
      const f = i / 4;
      const p1 = project(sN.leftX + (sN.rightX - sN.leftX) * f, 0, 1.1);
      const p2 = project(sF.leftX + (sF.rightX - sF.leftX) * f, 0, 52);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    // 窗洞
    for (const [z1, z2] of [[2.4, 4.4], [5.8, 8.6], [10.8, 15.0], [18.0, 24.0]]) {
      const a = corridorSection(st, z1);
      const b = corridorSection(st, z2);
      const p1t = project(a.rightX, a.ceilY - 0.7, z1);
      const p1b = project(a.rightX, 0.8, z1);
      const p2t = project(b.rightX, b.ceilY - 0.7, z2);
      const p2b = project(b.rightX, 0.8, z2);
      ctx.fillStyle = PALETTE.paper;
      ctx.beginPath();
      ctx.moveTo(p1t.x, p1t.y);
      ctx.lineTo(p2t.x, p2t.y);
      ctx.lineTo(p2b.x, p2b.y);
      ctx.lineTo(p1b.x, p1b.y);
      ctx.closePath();
      ctx.fill();
    }

    if (o.clutter) {
      for (const [z, x] of [[14, 0.4], [9, -0.95], [6, 0.8]]) {
        const pL = project(x - 0.5, 0, z);
        const pR = project(x + 0.5, 0, z);
        const pT = project(x - 0.5, 1.6, z);
        ctx.fillStyle = "#5D7166";
        ctx.fillRect(pL.x, pT.y, Math.max(8, pR.x - pL.x), Math.max(10, pL.y - pT.y));
      }
    }

    // 消失点细圆
    ctx.strokeStyle = PALETTE.redStrong;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(vpX, vpY, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 远人 & 近人
    drawSilhouettePerson(ctx, m.farBox.cx, m.farBox.botY, m.farBox.h, PALETTE.red, 1);
    drawSilhouettePerson(ctx, m.nearBox.cx, m.nearBox.botY, m.nearBox.h, PALETTE.red, 1);
  }

  function redrawAll() {
    for (const k of Object.keys(options)) drawOptionCanvas(k);
  }

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.quizOpt;
      const o = options[k];
      cards.forEach((c) => {
        const ck = c.dataset.quizOpt;
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", String(ck === k));
        if (ck === k) c.classList.add("is-picked", o.ok ? "is-correct" : "is-wrong");
      });
      if (feedback) {
        feedback.hidden = false;
        feedback.dataset.state = o.ok ? "ok" : "bad";
        feedback.innerHTML = `<strong>${o.title}</strong><p>${o.why}</p>`;
      }
    });
  });

  redrawAll();
  return redrawAll;
}

// ========== 07 原海报放大灯箱（可拖动、draggable="false"、Esc 关） ==========
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomIn = document.getElementById("poster-zoom-in");
  const zoomOut = document.getElementById("poster-zoom-out");
  const zoomReset = document.getElementById("poster-zoom-reset");
  if (!poster || !modal || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function open() {
    modalImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  poster.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  zoomIn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  modalImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    modalImg.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, tx0: tx, ty0: ty };
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = drag.tx0 + (e.clientX - drag.x0);
    ty = drag.ty0 + (e.clientY - drag.y0);
    applyTransform();
  });
  const endDrag = (e) => {
    if (drag && e.pointerId === drag.id) drag = null;
  };
  modalImg.addEventListener("pointerup", endDrag);
  modalImg.addEventListener("pointercancel", endDrag);
}

function clampVal(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
