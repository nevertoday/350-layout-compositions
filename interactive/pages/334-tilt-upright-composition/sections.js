// 334 欲正关系构图——正文各节专属互动模块（01–06 + 07 原海报灯箱）
// 每节使用不同交互机制，相邻不重复；所有图示与读数基于同一参数源实时生成。

import { pixelRatio } from "../../lib/stage.js";

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}

/* =========================================================================
   01 节：为什么斜需要正 —— 「抽离正轴」双格同步对照板 + 四档角度拨盘
   ========================================================================= */
const S1_DATA = {
  0: {
    verdict: "0° 正交并立：左右两格都安稳，但画面毫无方向牵引",
    withRef: "有正框参照时，垂直柱与边线完全平行，属于纯粹的静稳秩序——适合庄重场合，却少了破静的气口。",
    withoutRef: "即便撤掉内辅助轴，屏幕边缘本身仍是正交框，两块笔直块面依旧静止沉稳。",
  },
  3: {
    verdict: "3° 似正非正：一有正向参照，立刻暴露「没对齐」的刺眼毛病",
    withRef: "紧挨 0° 垂直标尺与暖宣正柱，3° 的极小斜度立刻触发大脑「斜效应」纠错警报——人眼以为是贴歪了，而不是刻意斜势。",
    withoutRef: "抽走正柱参照后，孤零零一根 3° 柱子显得含糊漂浮，既不像站稳，也不像要动。",
  },
  18: {
    verdict: "18° 敧正相生：正柱压住底盘，斜柱一下劈出利落视线动势",
    withRef: "暖宣正柱稳稳钉住 0° 铅垂坐标，18° 黑柱的斜势瞬间有了清晰标尺：静与动同时成立，张力清晰而不失稳。",
    withoutRef: "撤掉正向参照后，单独悬在空中的 18° 斜柱像突然失重滑落，失去了「靠着谁在发力」的力学依托。",
  },
  42: {
    verdict: "42° 失控险倾：斜度冲破安全界，连正向参照也拉不住倾覆感",
    withRef: "正柱虽还站着，但 42° 黑块重心大幅甩向画外，从「动态张力」滑落成「随时倒塌」的视觉焦躁。",
    withoutRef: "没了正轴更是彻底翻滚失重，眼睛只能顺着斜线直接滑出画框。",
  },
};

export function initSection01() {
  const svgWith = document.getElementById("s1-svg-with");
  const svgWithout = document.getElementById("s1-svg-without");
  const verdictEl = document.getElementById("s1-verdict");
  const noteWithEl = document.getElementById("s1-note-with");
  const noteWithoutEl = document.getElementById("s1-note-without");
  const refToggle = document.getElementById("s1-ref-toggle");
  const btns = [...document.querySelectorAll("[data-s1-angle]")];
  if (!svgWith || !svgWithout) return;

  let angle = 3;
  let showGrid = true;

  function drawPanel(svg, deg, withAnchor) {
    svg.innerHTML = "";
    // 背景
    el("rect", { x: 0, y: 0, width: 320, height: 220, fill: withAnchor ? "#FA4E06" : "#1D1916" }, svg);
    // 辅助正交坐标网格（可开关）
    if (showGrid && withAnchor) {
      for (let x = 40; x < 320; x += 40) {
        el("line", { x1: x, y1: 0, x2: x, y2: 220, stroke: "rgba(19,19,19,0.14)", "stroke-width": 1 }, svg);
      }
      for (let y = 40; y < 220; y += 40) {
        el("line", { x1: 0, y1: y, x2: 320, y2: y, stroke: "rgba(19,19,19,0.14)", "stroke-width": 1 }, svg);
      }
    }
    // 地平黑线
    if (withAnchor) {
      el("line", { x1: 20, y1: 188, x2: 300, y2: 188, stroke: "#131313", "stroke-width": 2 }, svg);
      // 暖宣正柱
      el("rect", { x: 64, y: 42, width: 88, height: 146, fill: "#F4E7D5" }, svg);
      // 垂直虚线正轴
      el("line", { x1: 108, y1: 22, x2: 108, y2: 202, stroke: "#5A524B", "stroke-width": 1.2, "stroke-dasharray": "4 3" }, svg);
      el("rect", { x: 104, y: 18, width: 8, height: 8, fill: "#131313" }, svg);
      el("rect", { x: 104, y: 198, width: 8, height: 8, fill: "#131313" }, svg);
    } else {
      // 无正参照：微弱漂浮底影
      el("ellipse", { cx: 168, cy: 192, rx: 56, ry: 6, fill: "rgba(244,231,213,0.12)" }, svg);
    }

    // 倾斜柱体（同一角度）
    const cx = withAnchor ? 196 : 160;
    const cy = 114;
    const g = el("g", { transform: `rotate(${deg} ${cx} ${cy})` }, svg);
    el("rect", {
      x: cx - 36,
      y: cy - 68,
      width: 72,
      height: 136,
      fill: withAnchor ? "#131313" : "#F4E7D5",
    }, g);
    // 贯穿箭线
    el("line", {
      x1: cx - 18,
      y1: cy + 56,
      x2: cx + 18,
      y2: cy - 58,
      stroke: withAnchor ? "#FFF8F9" : "#FA4E06",
      "stroke-width": 2,
    }, g);

    // 支点圆（仅在有正向参照时承托）
    if (withAnchor && deg >= 10 && deg <= 30) {
      el("circle", { cx: 204, cy: 178, r: 10, fill: "#0D0C06" }, svg);
    }

    // 右上角标尺读数
    el("rect", { x: 244, y: 14, width: 62, height: 22, fill: withAnchor ? "#131313" : "#FA4E06" }, svg);
    const txt = el("text", {
      x: 275,
      y: 29,
      "text-anchor": "middle",
      fill: "#FFF8F9",
      "font-size": 12,
      "font-family": "IBM Plex Mono, monospace",
      "font-weight": 600,
    }, svg);
    txt.textContent = `${deg}°`;
  }

  function render() {
    const info = S1_DATA[angle];
    drawPanel(svgWith, angle, true);
    drawPanel(svgWithout, angle, false);
    verdictEl.textContent = info.verdict;
    noteWithEl.textContent = info.withRef;
    noteWithoutEl.textContent = info.withoutRef;
    refToggle.textContent = showGrid ? "正交标尺网：开" : "正交标尺网：关";
    refToggle.setAttribute("aria-pressed", String(showGrid));
    for (const b of btns) {
      const active = Number(b.dataset.s1Angle) === angle;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
  }

  for (const b of btns) {
    b.addEventListener("click", () => {
      angle = Number(b.dataset.s1Angle);
      render();
    });
  }
  refToggle?.addEventListener("click", () => {
    showGrid = !showGrid;
    render();
  });
  render();
}

/* =========================================================================
   02 节：角度与份量的甜区 —— 二维敧正相图（角度 0–45° × 斜体视觉份量 10–75%）
   ========================================================================= */
function classifyPhase(deg, mass) {
  // mass 为斜体占画面主形体的视觉份量（10%..75%）
  if (deg < 1.5) {
    return {
      zone: "僵直正交区",
      tone: "bad",
      title: "完全垂直（0°）：零角度冲突，缺破静动势",
      desc: "无论斜体本身多轻多重，只要倾角归零，正斜对比就不存在。适合静穆庄严题材，但不属于欲正构图。",
    };
  }
  if (deg < 8.5) {
    return {
      zone: "似正非正误歪区",
      tone: "bad",
      title: `微斜 ${Math.round(deg)}°：最容易被看成「没摆正」的尴尬死区`,
      desc: "人眼对水平垂直的误差极为敏感。低于 8°–9° 时，块面越大越显得手抖歪斜，建议要么归回 0°，要么果断拉过 10°。",
    };
  }
  // 随斜体份量增大，稳态最大安全倾角递减（重块易倒，轻线条可更陡！）
  const maxSafeDeg = 39 - (mass - 10) * 0.31; // mass=15 -> 37.5°; mass=45 -> 28°; mass=65 -> 22°
  if (mass > 60) {
    return {
      zone: "正轻斜压区",
      tone: "bad",
      title: `斜体份量高达 ${Math.round(mass)}%：喧宾夺主，压垮正向骨架`,
      desc: "正向结构只剩不到四成，再好的角度也扛不住压顶的倾斜体量。先增厚稳正基底，再谈斜向破局。",
    };
  }
  if (deg > maxSafeDeg) {
    return {
      zone: "重压倾覆险区",
      tone: "bad",
      title: `${Math.round(deg)}° × ${Math.round(mass)}% 份量：倾覆力矩超过承重极限`,
      desc: "同样是 32°，细长斜标能飘逸起势，但巨幅黑碑就会轰然倾倒——份量越重，允许的安全倾角越要收紧。",
    };
  }
  if (mass <= 28 && deg >= 24) {
    return {
      zone: "轻逸锐斜甜区",
      tone: "good",
      title: `轻体量（${Math.round(mass)}%）配 ${Math.round(deg)}° 陡势：超出 25° 依然稳健`,
      desc: "这正是原海报 10°–25° 经验标尺之外的灵活解：当斜体是细箭、飘带或斜标时，重量轻、不撼动重心，陡到 26°–35° 反而利落生风。",
    };
  }
  return {
    zone: "经典敧正甜区",
    tone: "good",
    title: `${Math.round(deg)}° 倾角 × ${Math.round(mass)}% 斜体份量：原海报式稳衡区间`,
    desc: "正向骨架吃下主力重量，倾斜体量恰如其分地切开平静——角度清晰无歧义，重心稳落支撑带，张力与秩序兼得。",
  };
}

export function initSection02() {
  const canvas = document.getElementById("s2-map-canvas");
  const prevSvg = document.getElementById("s2-preview-svg");
  const tagEl = document.getElementById("s2-zone-tag");
  const titleEl = document.getElementById("s2-zone-title");
  const descEl = document.getElementById("s2-zone-desc");
  const coordsEl = document.getElementById("s2-coords");
  const sampleBtns = [...document.querySelectorAll("[data-s2-sample]")];
  if (!canvas || !prevSvg) return;

  const ctx = canvas.getContext("2d");
  let curDeg = 20;
  let curMass = 44;
  let cw = 500;
  let ch = 320;
  let dpr = pixelRatio(2);

  const PAD = { l: 48, r: 20, t: 30, b: 38 };

  function degToX(d) {
    return PAD.l + (d / 45) * (cw - PAD.l - PAD.r);
  }
  function massToY(m) {
    return ch - PAD.b - ((m - 10) / 65) * (ch - PAD.t - PAD.b);
  }
  function pxToCoord(px, py) {
    const d = Math.max(0, Math.min(45, ((px - PAD.l) / (cw - PAD.l - PAD.r)) * 45));
    const m = Math.max(10, Math.min(75, 10 + ((ch - PAD.b - py) / (ch - PAD.t - PAD.b)) * 65));
    return { deg: Math.round(d), mass: Math.round(m) };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = pixelRatio(2);
    cw = r.width;
    ch = r.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    drawMap();
  }

  function drawMap() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#F6F0E6";
    ctx.fillRect(0, 0, cw, ch);

    const pw = cw - PAD.l - PAD.r;
    const ph = ch - PAD.t - PAD.b;

    // 1) 似正非正误歪区（1°–8.5°）浅朱斜纹带
    ctx.fillStyle = "rgba(181,38,20,0.12)";
    ctx.fillRect(degToX(1), PAD.t, degToX(8.5) - degToX(1), ph);

    // 2) 正轻斜压区（mass > 60%）
    ctx.fillStyle = "rgba(19,19,19,0.11)";
    ctx.fillRect(PAD.l, PAD.t, pw, massToY(60) - PAD.t);

    // 3) 稳衡甜区多边形（含 10°–25° 经典核 + 轻体量向右延伸的锐斜翼）
    ctx.beginPath();
    ctx.moveTo(degToX(9.5), massToY(10));
    ctx.lineTo(degToX(37), massToY(10));
    ctx.lineTo(degToX(32.5), massToY(28));
    ctx.lineTo(degToX(23), massToY(60));
    ctx.lineTo(degToX(9.5), massToY(60));
    ctx.closePath();
    ctx.fillStyle = "rgba(14,102,72,0.16)";
    ctx.fill();
    ctx.strokeStyle = "#0E6648";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4) 原海报标示的 10°–25° 经验走廊高亮细框
    ctx.fillStyle = "rgba(250,78,6,0.14)";
    ctx.fillRect(degToX(10), massToY(56), degToX(25) - degToX(10), massToY(24) - massToY(56));
    ctx.strokeStyle = "#A82800";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(degToX(10), massToY(56), degToX(25) - degToX(10), massToY(24) - massToY(56));

    // 5) 坐标轴与刻度
    ctx.strokeStyle = "#131313";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, ch - PAD.b);
    ctx.lineTo(cw - PAD.r, ch - PAD.b);
    ctx.stroke();

    ctx.fillStyle = "#2E2824";
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const d of [0, 10, 20, 25, 35, 45]) {
      const x = degToX(d);
      ctx.beginPath();
      ctx.moveTo(x, ch - PAD.b);
      ctx.lineTo(x, ch - PAD.b + 5);
      ctx.stroke();
      ctx.fillText(`${d}°`, x, ch - PAD.b + 8);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const m of [15, 30, 45, 60, 75]) {
      const y = massToY(m);
      ctx.beginPath();
      ctx.moveTo(PAD.l - 5, y);
      ctx.lineTo(PAD.l, y);
      ctx.stroke();
      ctx.fillText(`${m}%`, PAD.l - 8, y);
    }

    // 轴名称
    ctx.fillStyle = "#131313";
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("倾斜角度 θ →", cw - PAD.r, ch - 8);
    ctx.textAlign = "left";
    ctx.fillText("↑ 斜体份量", 6, 12);

    // 区域水印标签（高对比清晰可读）
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = "#0E6648";
    ctx.textAlign = "center";
    ctx.fillText("原海报 10°–25° 甜区", degToX(17.5), massToY(40));
    if (cw >= 360) {
      ctx.fillStyle = "#0E6648";
      ctx.fillText("轻逸锐斜", degToX(30), massToY(18));
      ctx.fillStyle = "#9A2210";
      ctx.fillText("误歪", degToX(4.8), massToY(46));
      ctx.fillText("过斜倾覆", degToX(38), massToY(46));
    }

    // 6) 当前落点
    const px = degToX(curDeg);
    const py = massToY(curMass);
    const res = classifyPhase(curDeg, curMass);

    ctx.strokeStyle = "rgba(19,19,19,0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, ch - PAD.b);
    ctx.lineTo(px, py);
    ctx.lineTo(PAD.l, py);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = res.tone === "good" ? "#0E6648" : "#B52614";
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFF8F9";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPreview() {
    const res = classifyPhase(curDeg, curMass);
    prevSvg.innerHTML = "";
    el("rect", { x: 0, y: 0, width: 220, height: 180, fill: "#FA4E06" }, prevSvg);
    el("line", { x1: 14, y1: 156, x2: 206, y2: 156, stroke: "#131313", "stroke-width": 2 }, prevSvg);

    // 份量映射到宽窄；按旋转角抬升斜碑底角，保证右下角永不戳穿地平黑线且黑球清晰承托
    const totalW = 114;
    const tW = Math.max(12, totalW * (curMass / 100));
    const uW = Math.max(24, totalW - tW);
    const uX = 36;
    el("rect", { x: uX, y: 34, width: uW, height: 112, fill: "#F4E7D5" }, prevSvg);
    el("line", { x1: uX + uW / 2, y1: 20, x2: uX + uW / 2, y2: 164, stroke: "#5A524B", "stroke-dasharray": "3 3", "stroke-width": 1 }, prevSvg);

    const rad = (curDeg * Math.PI) / 180;
    const drop = Math.sin(rad) * tW;
    const pivX = uX + uW * 0.72;
    const pivY = Math.min(144, 146 - drop * 0.75 - 10);
    // 支点小黑球清晰垫在底线与斜碑之间
    el("circle", { cx: pivX + Math.min(34, tW * 0.42 + 8), cy: 147, r: 8.5, fill: "#0D0C06" }, prevSvg);
    const g = el("g", { transform: `rotate(${curDeg} ${pivX} ${pivY})` }, prevSvg);
    el("rect", { x: pivX, y: pivY - 100, width: tW, height: 100, fill: "#131313" }, g);
    el("line", { x1: pivX + 2, y1: pivY - 4, x2: pivX + tW - 2, y2: pivY - 108, stroke: "#FFF8F9", "stroke-width": 1.6 }, g);

    tagEl.textContent = res.zone;
    tagEl.dataset.tone = res.tone;
    titleEl.textContent = res.title;
    descEl.textContent = res.desc;
    coordsEl.textContent = `倾角 ${curDeg}° · 斜体份量 ${curMass}%`;
  }

  function update(d, m) {
    curDeg = d;
    curMass = m;
    drawMap();
    drawPreview();
  }

  let down = false;
  function handlePtr(e) {
    const r = canvas.getBoundingClientRect();
    const { deg, mass } = pxToCoord(e.clientX - r.left, e.clientY - r.top);
    update(deg, mass);
  }
  canvas.addEventListener("pointerdown", (e) => {
    down = true;
    canvas.setPointerCapture?.(e.pointerId);
    handlePtr(e);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (down) handlePtr(e);
  });
  canvas.addEventListener("pointerup", () => { down = false; });
  canvas.addEventListener("pointercancel", () => { down = false; });

  for (const b of sampleBtns) {
    b.addEventListener("click", () => {
      update(Number(b.dataset.deg), Number(b.dataset.mass));
    });
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  drawPreview();
}

/* =========================================================================
   03 节：四种场景怎样落势 —— X-Ray 结构层剥离切刀（跨媒介解剖）
   ========================================================================= */
const S3_CASES = {
  magazine: {
    title: "杂志跨页：端正三栏承正文 × 16° 斜切标题贯跨页",
    desc: "左侧和下方栏格保持 0° 规整读行，确保长文不累眼；主标题黑底条以 16° 斜劈过页缝，瞬间把双页缝成整体，页码锚点收住底角。",
    layers: {
      all: "完整成品：静读栏框与斜切标题互不抢戏，一眼抓住主轴又顺畅落进正文。",
      upright: "仅看正向承重层（暖宣）：三栏正文、刊眉与外框占了超过 60% 面积，稳稳吃下阅读秩序。",
      tilt: "仅看倾斜动势层（朱橘高亮）：仅一道 16° 斜切大标承担破静与跨页串联任务，克制集中。",
      fulcrum: "支点与力线解剖：跨页中缝与右下角期号黑圆点共同锁住斜标两端，避免视觉滑出纸边。",
    },
  },
  scroll: {
    title: "国画立轴：直壁悬瀑定正骨 × 斜探苍松破满屏",
    desc: "传统山水最讲「险中求平」：垂直峭壁与款识题跋立起 0° 骨架，古松干枝斜探出崖 22° 引出气韵，崖根磐石与朱红印章压住下盘。",
    layers: {
      all: "完整成品：一竖一斜彼此咬合，既见山骨峻拔，又得松势飞动。",
      upright: "仅看正向承重层：左侧垂壁、飞瀑与右上竖排题款构成牢固的垂直坐标。",
      tilt: "仅看倾斜动势层：古松斜干由左下向右上方斜出，成为全画唯一的视觉导流弧。",
      fulcrum: "支点与力线解剖：松根压石与右下朱印形成三角锚点，把向右上方冲出的松势稳稳拉回画心。",
    },
  },
  arch: {
    title: "摄影构图：垂立柱廊构骨架 × 斜行梯影与行者剪影",
    desc: "拍摄建筑空间时，让立柱与门框严格垂直（不歪镜头），借日光斜影与阶梯斜线制造 20° 动势，人物以极简剪影落于楼梯脚压住画面。",
    layers: {
      all: "完整成品：建筑垂直感令人安定，斜梯与侧光让空间立刻有了前进节奏。",
      upright: "仅看正向承重层：两根垂立廊柱和远景门框严格保持 0° 铅垂，杜绝建筑倒塌错觉。",
      tilt: "仅看倾斜动势层：斜向石阶与墙面斜光带形成强烈对角导引，视线直抵高处出口。",
      fulcrum: "支点与力线解剖：下方静立的人物侧影剪影（无五官）恰好充当黑球支点，把向下倾斜的阶梯稳稳接住。",
    },
  },
  mobile: {
    title: "移动端首屏：端正卡片与按钮 × 14° 斜置产品主视觉",
    desc: "手机屏幕窄长，按钮、价签与文案必须端正横排才好点击；只把中间主视觉画报轻轻斜置 14°，配底部圆章压脚，既有活力又不妨碍操作。",
    layers: {
      all: "完整成品：文字和按钮极易识别点击，中段斜置主图带来鲜明的活动张力。",
      upright: "仅看正向承重层：顶部导航、大标题基线与底部全宽主按钮严守 0° 对齐，操作零负担。",
      tilt: "仅看倾斜动势层：只有中间主卡斜置 14° 打破单栏沉闷，成为视觉第一落点。",
      fulcrum: "支点与力线解剖：主卡底角叠在端正按钮上方并配实心圆标压脚，稳稳坐进版心。",
    },
  },
};

export function initSection03() {
  const svg = document.getElementById("s3-stage-svg");
  const titleEl = document.getElementById("s3-case-title");
  const descEl = document.getElementById("s3-case-desc");
  const noteEl = document.getElementById("s3-layer-note");
  const caseBtns = [...document.querySelectorAll("[data-s3-case]")];
  const layerBtns = [...document.querySelectorAll("[data-s3-layer]")];
  if (!svg) return;

  let curCase = "magazine";
  let curLayer = "all";

  function renderSvg() {
    svg.innerHTML = "";
    const uOp = curLayer === "all" || curLayer === "upright" ? 1 : curLayer === "fulcrum" ? 0.32 : 0.16;
    const tOp = curLayer === "all" || curLayer === "tilt" ? 1 : curLayer === "fulcrum" ? 0.45 : 0.14;
    const fOp = curLayer === "all" || curLayer === "fulcrum" ? 1 : 0.25;
    const tFill = curLayer === "tilt" ? "#FA4E06" : "#131313";
    const uStroke = curLayer === "upright" ? "#6CF0B8" : "none";

    // 画板暗底框
    el("rect", { x: 0, y: 0, width: 460, height: 290, fill: "#1F1C18" }, svg);

    if (curCase === "magazine") {
      // 跨页纸张
      const gU = el("g", { opacity: uOp }, svg);
      el("rect", { x: 34, y: 24, width: 392, height: 242, fill: "#F4E7D5", stroke: uStroke, "stroke-width": 2 }, gU);
      el("line", { x1: 230, y1: 24, x2: 230, y2: 266, stroke: "rgba(19,19,19,0.28)", "stroke-dasharray": "4 3" }, gU);
      // 端正三栏文字条
      for (let i = 0; i < 6; i++) {
        el("rect", { x: 54, y: 48 + i * 16, width: 146, height: 6, fill: "rgba(19,19,19,0.28)" }, gU);
        el("rect", { x: 254, y: 158 + i * 14, width: 150, height: 5, fill: "rgba(19,19,19,0.25)" }, gU);
      }
      // 斜切跨页主标条
      const gT = el("g", { opacity: tOp, transform: "rotate(-16 235 125)" }, svg);
      el("rect", { x: 112, y: 92, width: 252, height: 62, fill: tFill }, gT);
      el("rect", { x: 132, y: 110, width: 162, height: 14, fill: "#FFF8F9" }, gT);
      el("rect", { x: 132, y: 132, width: 96, height: 7, fill: "#FA4E06" }, gT);
      // 支点与力线
      const gF = el("g", { opacity: fOp }, svg);
      el("circle", { cx: 368, cy: 232, r: 12, fill: curLayer === "fulcrum" ? "#FA4E06" : "#131313" }, gF);
      if (curLayer === "fulcrum") {
        el("line", { x1: 118, y1: 156, x2: 362, y2: 88, stroke: "#6CF0B8", "stroke-width": 2, "stroke-dasharray": "5 4" }, gF);
        el("line", { x1: 230, y1: 16, x2: 230, y2: 274, stroke: "#FFF8F9", "stroke-width": 1.6, "stroke-dasharray": "4 3" }, gF);
      }
    } else if (curCase === "scroll") {
      const gU = el("g", { opacity: uOp }, svg);
      el("rect", { x: 108, y: 16, width: 244, height: 258, fill: "#F4E7D5", stroke: uStroke, "stroke-width": 2 }, gU);
      // 左侧直峭崖壁 + 垂瀑
      el("polygon", { points: "108,16 196,16 184,274 108,274", fill: "#D9C9B2" }, gU);
      el("rect", { x: 148, y: 26, width: 14, height: 238, fill: "#FFF8F9" }, gU);
      // 右上竖排题款模拟线
      for (let c = 0; c < 3; c++) {
        el("rect", { x: 326 - c * 14, y: 34, width: 5, height: 64 - c * 10, fill: "rgba(19,19,19,0.45)" }, gU);
      }
      // 斜探古松
      const gT = el("g", { opacity: tOp }, svg);
      el("path", { d: "M176,222 Q232,174 318,118", stroke: tFill, "stroke-width": 16, fill: "none", "stroke-linecap": "round" }, gT);
      el("ellipse", { cx: 292, cy: 112, rx: 38, ry: 14, fill: tFill, transform: "rotate(-18 292 112)" }, gT);
      el("ellipse", { cx: 246, cy: 148, rx: 30, ry: 11, fill: tFill, transform: "rotate(-22 246 148)" }, gT);
      // 崖根磐石与朱印
      const gF = el("g", { opacity: fOp }, svg);
      el("circle", { cx: 184, cy: 234, r: 16, fill: curLayer === "fulcrum" ? "#FA4E06" : "#131313" }, gF);
      el("rect", { x: 316, y: 232, width: 16, height: 16, fill: "#FA4E06" }, gF);
      if (curLayer === "fulcrum") {
        el("line", { x1: 155, y1: 16, x2: 155, y2: 274, stroke: "#6CF0B8", "stroke-width": 1.6, "stroke-dasharray": "4 3" }, gF);
        el("line", { x1: 176, y1: 222, x2: 332, y2: 108, stroke: "#FFF8F9", "stroke-width": 2 }, gF);
      }
    } else if (curCase === "arch") {
      const gU = el("g", { opacity: uOp }, svg);
      el("rect", { x: 46, y: 20, width: 368, height: 250, fill: "#EAE0D0", stroke: uStroke, "stroke-width": 2 }, gU);
      // 严格垂直廊柱
      el("rect", { x: 76, y: 20, width: 40, height: 250, fill: "#F6F0E6" }, gU);
      el("rect", { x: 148, y: 20, width: 26, height: 250, fill: "#DDD0BC" }, gU);
      el("rect", { x: 356, y: 20, width: 34, height: 250, fill: "#F6F0E6" }, gU);
      // 斜阶梯与斜光影
      const gT = el("g", { opacity: tOp }, svg);
      el("polygon", { points: "174,270 356,112 356,174 248,270", fill: tFill }, gT);
      el("polygon", { points: "174,116 356,36 356,74 174,154", fill: curLayer === "tilt" ? "rgba(250,78,6,0.45)" : "rgba(19,19,19,0.16)" }, gT);
      // 行者极简无五官黑色剪影（稳立梯脚作支点）
      const gF = el("g", { opacity: fOp }, svg);
      const figFill = curLayer === "fulcrum" ? "#FA4E06" : "#131313";
      el("circle", { cx: 214, cy: 204, r: 9, fill: figFill }, gF);
      el("path", { d: "M202,268 L206,218 L222,218 L226,268 Z", fill: figFill }, gF);
      if (curLayer === "fulcrum") {
        el("line", { x1: 96, y1: 16, x2: 96, y2: 274, stroke: "#6CF0B8", "stroke-width": 1.8, "stroke-dasharray": "4 3" }, gF);
        el("line", { x1: 184, y1: 262, x2: 352, y2: 118, stroke: "#FFF8F9", "stroke-width": 2 }, gF);
      }
    } else {
      // mobile 首屏
      const gU = el("g", { opacity: uOp }, svg);
      el("rect", { x: 156, y: 12, width: 148, height: 266, rx: 14, fill: "#F4E7D5", stroke: uStroke || "#3A332D", "stroke-width": 2 }, gU);
      el("rect", { x: 172, y: 30, width: 82, height: 10, fill: "#131313" }, gU);
      el("rect", { x: 172, y: 48, width: 116, height: 6, fill: "rgba(19,19,19,0.28)" }, gU);
      // 底部端正按钮
      el("rect", { x: 172, y: 230, width: 116, height: 28, fill: "#131313" }, gU);
      el("rect", { x: 206, y: 241, width: 48, height: 6, fill: "#F4E7D5" }, gU);
      // 中段 14° 斜置主卡
      const gT = el("g", { opacity: tOp, transform: "rotate(-14 230 142)" }, svg);
      el("rect", { x: 178, y: 88, width: 104, height: 108, fill: tFill }, gT);
      el("line", { x1: 192, y1: 182, x2: 268, y2: 102, stroke: "#FFF8F9", "stroke-width": 2 }, gT);
      // 压脚圆章
      const gF = el("g", { opacity: fOp }, svg);
      el("circle", { cx: 272, cy: 196, r: 14, fill: "#FA4E06" }, gF);
      if (curLayer === "fulcrum") {
        el("line", { x1: 230, y1: 12, x2: 230, y2: 278, stroke: "#6CF0B8", "stroke-width": 1.6, "stroke-dasharray": "4 3" }, gF);
      }
    }
  }

  function render() {
    const info = S3_CASES[curCase];
    titleEl.textContent = info.title;
    descEl.textContent = info.desc;
    noteEl.textContent = info.layers[curLayer];
    renderSvg();
    for (const b of caseBtns) {
      const a = b.dataset.s3Case === curCase;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    }
    for (const b of layerBtns) {
      const a = b.dataset.s3Layer === curLayer;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    }
  }

  for (const b of caseBtns) b.addEventListener("click", () => { curCase = b.dataset.s3Case; render(); });
  for (const b of layerBtns) b.addEventListener("click", () => { curLayer = b.dataset.s3Layer; render(); });
  render();
}

/* =========================================================================
   04 节：从哪来 —— 四纪元历史年表 + 实时矢量机理图示
   ========================================================================= */
const S4_ERAS = {
  "687": {
    year: "公元 687 年 · 唐",
    title: "欧阳询《传授诀》与孙过庭《书谱》：敧正入章法",
    sub: "Calligraphy & Chinese Painting Aesthetics",
    body: "原海报大字写作「敧正」（敧读 qī，通「欹」，即倾斜；因与「欲」形近，目录常作「欲正」）。唐代欧阳询《传授诀》首提「心眼准程，疏密敧正」；垂拱三年（687 年），孙过庭《书谱》（真迹现藏台北故宫博物院）把这层辩证推到极致：初学求平正，进阶追险绝，最高境界则是「复归平正」——险斜最终要回到稳正的平衡中。",
    quote: "「至如初学分布，但求平正；既知平正，务追险绝；既能险绝，复归平正。」——唐·孙过庭《书谱》（687）",
  },
  "1924": {
    year: "1924–1925 年 · 荷兰",
    title: "风格派之争：凡·杜斯伯格以对角线破正交",
    sub: "De Stijl vs. Elementarism — Counter-Composition",
    body: "蒙德里安坚持画面只许有水平与垂直，以求绝对静穆；1924 年，同为风格派创始人的提奥·凡·杜斯伯格在《反构图 V》（1924，阿姆斯特丹市立博物馆藏）与《反构图 VI》（1925，伦敦泰特美术馆 T03374）中引入斜向对角块面，创立「元素主义」，用正框内的斜向冲突注入现代张力，直接塑造了此后百年的先锋海报与包豪斯排版。",
    quote: "正交边框锁住宇宙的重力秩序，而斜线把时间与运动放进了平面。",
  },
  "1954": {
    year: "1954 / 1974 年 · 美国",
    title: "阿恩海姆《艺术与视知觉》：结构骨架与视觉张力",
    sub: "Rudolf Arnheim — Art and Visual Perception",
    body: "鲁道夫·阿恩海姆在加州大学出版社 1954 年初版（1974 年修订增补）的经典著作中指出：水平与垂直构成了人眼对照重力与地平的「结构骨架（structural skeleton）」。只要元素偏离这套骨架形成斜角，大脑就会感到一股试图拉回或继续倾倒的心理势能——这正是「张力」的物理感知来源。",
    quote: "没有稳定骨架作对照，斜线就没有偏离感；平衡不是死寂的对称，而是正斜力场的相持。",
  },
  "1972": {
    year: "1972 年 · 心理物理学",
    title: "阿佩尔综述确立「斜效应」：为何人眼天生认正、对斜警觉",
    sub: "Stuart Appelle — Psychological Bulletin, 78(4)",
    body: "斯图尔特·阿佩尔于 1972 年在《心理学公报》发表综述（DOI: 10.1037/h0033117），系统总结人类及多种动物的「斜效应（oblique effect）」：视皮层对水平与垂直朝向的分辨精度显著高于斜向。这从神经机制上解释了为什么 0° 让人踏实、2°–7° 的微歪令人难受，而明确的大斜角能立刻抢占视觉注意。",
    quote: "水平与垂直是神经系统的「舒适母语」，倾斜则是高警觉的「破格强音」。",
  },
};

export function initSection04() {
  const yearEl = document.getElementById("s4-era-year");
  const titleEl = document.getElementById("s4-era-title");
  const subEl = document.getElementById("s4-era-sub");
  const bodyEl = document.getElementById("s4-era-body");
  const quoteEl = document.getElementById("s4-era-quote");
  const svg = document.getElementById("s4-era-svg");
  const btns = [...document.querySelectorAll("[data-s4-era]")];
  if (!svg) return;

  let cur = "687";

  function drawEraDiagram(id) {
    svg.innerHTML = "";
    el("rect", { x: 0, y: 0, width: 280, height: 220, fill: "#131313" }, svg);
    if (id === "687") {
      // 九宫米字格里的「平正 → 险绝 → 复归平正」几何字势示意
      el("rect", { x: 56, y: 26, width: 168, height: 168, fill: "none", stroke: "rgba(244,231,213,0.28)", "stroke-width": 1.2 }, svg);
      el("line", { x1: 140, y1: 26, x2: 140, y2: 194, stroke: "rgba(244,231,213,0.35)", "stroke-dasharray": "4 3" }, svg);
      el("line", { x1: 56, y1: 110, x2: 224, y2: 110, stroke: "rgba(244,231,213,0.35)", "stroke-dasharray": "4 3" }, svg);
      // 楷书左低右高抗肩横画（敧）+ 垂露中竖（正）
      el("line", { x1: 78, y1: 88, x2: 204, y2: 68, stroke: "#FA4E06", "stroke-width": 8, "stroke-linecap": "round" }, svg);
      el("line", { x1: 140, y1: 44, x2: 140, y2: 178, stroke: "#F4E7D5", "stroke-width": 9, "stroke-linecap": "round" }, svg);
      el("line", { x1: 84, y1: 158, x2: 198, y2: 144, stroke: "#FA4E06", "stroke-width": 6, "stroke-linecap": "round" }, svg);
      el("circle", { cx: 140, cy: 178, r: 5, fill: "#6CF0B8" }, svg);
    } else if (id === "1924") {
      // 风格派正交框内的 45° 反构图致敬图解
      el("rect", { x: 54, y: 24, width: 172, height: 172, fill: "#F4E7D5" }, svg);
      const g = el("g", { transform: "rotate(45 140 110)" }, svg);
      el("rect", { x: 86, y: 54, width: 52, height: 54, fill: "#FA4E06" }, g);
      el("rect", { x: 142, y: 112, width: 46, height: 48, fill: "#131313" }, g);
      el("line", { x1: 60, y1: 110, x2: 220, y2: 110, stroke: "#131313", "stroke-width": 5 }, g);
      el("line", { x1: 140, y1: 30, x2: 140, y2: 190, stroke: "#131313", "stroke-width": 5 }, g);
      // 严正外框裁切
      el("rect", { x: 54, y: 24, width: 172, height: 172, fill: "none", stroke: "#131313", "stroke-width": 4 }, svg);
    } else if (id === "1954") {
      // 阿恩海姆结构骨架（正交十字 + 中心力场 + 偏斜矢量箭）
      el("rect", { x: 40, y: 24, width: 200, height: 172, fill: "none", stroke: "#F4E7D5", "stroke-width": 1.6 }, svg);
      el("line", { x1: 140, y1: 24, x2: 140, y2: 196, stroke: "rgba(244,231,213,0.45)", "stroke-dasharray": "4 3" }, svg);
      el("line", { x1: 40, y1: 110, x2: 240, y2: 110, stroke: "rgba(244,231,213,0.45)", "stroke-dasharray": "4 3" }, svg);
      el("circle", { cx: 140, cy: 110, r: 44, fill: "none", stroke: "rgba(244,231,213,0.22)" }, svg);
      el("line", { x1: 108, y1: 162, x2: 184, y2: 56, stroke: "#FA4E06", "stroke-width": 5 }, svg);
      el("circle", { cx: 184, cy: 56, r: 6, fill: "#FA4E06" }, svg);
      // 拉回正轴的势能弧线
      el("path", { d: "M176,68 A60,60 0 0 0 142,50", fill: "none", stroke: "#6CF0B8", "stroke-width": 2, "stroke-dasharray": "3 3" }, svg);
    } else {
      // 1972 斜效应玫瑰图（水平/垂直敏锐峰高，45°/135° 敏锐谷低）
      const cx = 140, cy = 112;
      el("circle", { cx, cy, r: 74, fill: "none", stroke: "rgba(244,231,213,0.16)" }, svg);
      el("circle", { cx, cy, r: 44, fill: "none", stroke: "rgba(244,231,213,0.16)" }, svg);
      let d = "";
      for (let a = 0; a <= 360; a += 5) {
        const rad = (a * Math.PI) / 180;
        const r = 42 + 34 * Math.pow(Math.cos(2 * rad), 2);
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        d += (a === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      }
      d += "Z";
      el("path", { d, fill: "rgba(250,78,6,0.32)", stroke: "#FA4E06", "stroke-width": 2.2 }, svg);
      el("line", { x1: cx - 84, y1: cy, x2: cx + 84, y2: cy, stroke: "#F4E7D5", "stroke-width": 1.2 }, svg);
      el("line", { x1: cx, y1: cy - 84, x2: cx, y2: cy + 84, stroke: "#F4E7D5", "stroke-width": 1.2 }, svg);
      const t0 = el("text", { x: cx, y: 20, "text-anchor": "middle", fill: "#F4E7D5", "font-size": 11, "font-family": "IBM Plex Mono, monospace" }, svg);
      t0.textContent = "0° / 90° 高敏锐（稳）";
      const t45 = el("text", { x: cx, y: 208, "text-anchor": "middle", fill: "#FF7D45", "font-size": 11, "font-family": "IBM Plex Mono, monospace" }, svg);
      t45.textContent = "斜向灵敏度谷值 · 高警觉张力";
    }
  }

  function render() {
    const info = S4_ERAS[cur];
    yearEl.textContent = info.year;
    titleEl.textContent = info.title;
    subEl.textContent = info.sub;
    bodyEl.textContent = info.body;
    quoteEl.textContent = info.quote;
    drawEraDiagram(cur);
    for (const b of btns) {
      const a = b.dataset.s4Era === cur;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    }
  }

  for (const b of btns) b.addEventListener("click", () => { cur = b.dataset.s4Era; render(); });
  render();
}

/* =========================================================================
   05 节：什么时候别用 —— 4 张事故现场翻牌诊治卡
   ========================================================================= */
export function initSection05() {
  const cards = [...document.querySelectorAll(".s5-card")];
  for (const card of cards) {
    const btn = card.querySelector(".s5-flip-btn");
    const stateTag = card.querySelector(".s5-state-tag");
    const desc = card.querySelector(".s5-desc");
    if (!btn) continue;
    btn.addEventListener("click", () => {
      const fixed = card.dataset.fixed === "true";
      const next = !fixed;
      card.dataset.fixed = String(next);
      btn.setAttribute("aria-pressed", String(next));
      btn.textContent = next ? "看回误用现场" : "撤斜归正对比";
      if (stateTag) stateTag.textContent = next ? "归正修复版" : "强行加斜翻车";
      if (desc) desc.textContent = next ? card.dataset.goodText : card.dataset.badText;
    });
  }
}

/* =========================================================================
   06 节：小练习 —— 单变量四方案矢量海报考场（中性标签 A/B/C/D）
   ========================================================================= */
const QUIZ_SPECS = [
  { id: "A", deg: 0, ball: false, ok: false, reason: "方案 A 斜块倾角 0°，与左侧暖宣主栏严格平行并立：虽然端正不出错，但缺少角度冲突与视线导向，更像普通通告栏。" },
  { id: "B", deg: 4, ball: false, ok: false, reason: "方案 B 仅微斜 4°，正好掉进 1°–8°「似正非正」误歪死区：人眼会下意识以为排版软件手抖歪了，产生莫名别扭感。" },
  { id: "C", deg: 18, ball: true, ok: true, reason: "答对了！方案 C 左侧端正主栏占稳份量，右侧黑色展块以清晰的 18° 破静引势，底部实心圆锚稳稳接住重心投影——正斜对照鲜明而平衡。" },
  { id: "D", deg: 44, ball: false, ok: false, reason: "方案 D 倾角冲到 44° 且无底托，黑色斜块腰斩正栏、重心甩出右缘，视觉张力变成随时栽倒的不安感。" },
];

export function initSection06() {
  const optBtns = [...document.querySelectorAll("[data-quiz-opt]")];
  const fb = document.getElementById("quiz-feedback");
  const fbBadge = document.getElementById("quiz-result-badge");
  const fbTitle = document.getElementById("quiz-result-title");
  const fbBody = document.getElementById("quiz-result-body");
  const retryBtn = document.getElementById("quiz-retry");
  if (!optBtns.length || !fb) return;

  // 为四个选项现场绘制完全一致的单变量海报缩略图
  for (const spec of QUIZ_SPECS) {
    const svg = document.getElementById(`quiz-svg-${spec.id}`);
    if (!svg) continue;
    svg.innerHTML = "";
    el("rect", { x: 0, y: 0, width: 220, height: 270, fill: "#FA4E06" }, svg);
    // 顶部统一极简刊眉
    el("rect", { x: 18, y: 18, width: 78, height: 12, fill: "#FFF8F9" }, svg);
    el("rect", { x: 102, y: 18, width: 64, height: 12, fill: "#131313" }, svg);
    el("line", { x1: 18, y1: 42, x2: 202, y2: 42, stroke: "#131313", "stroke-width": 1.2 }, svg);
    // 地平黑线
    el("line", { x1: 18, y1: 238, x2: 202, y2: 238, stroke: "#131313", "stroke-width": 1.6 }, svg);
    // 统一端正左栏
    el("rect", { x: 26, y: 60, width: 78, height: 164, fill: "#F4E7D5" }, svg);
    el("line", { x1: 65, y1: 50, x2: 65, y2: 246, stroke: "#5A524B", "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
    for (let i = 0; i < 4; i++) {
      el("rect", { x: 36, y: 80 + i * 16, width: 52 - (i % 2) * 14, height: 4, fill: "rgba(19,19,19,0.28)" }, svg);
    }
    // 单一变量：黑色主视觉块倾角 + 底托（按倾角自动留出底沿净空，确保方案 C 优雅托球、方案 D 直观越界失稳）
    const rad = (spec.deg * Math.PI) / 180;
    const bw = 64;
    const bh = 144;
    const drop = Math.sin(rad) * bw;
    const pivX = spec.id === "D" ? 108 : 102;
    const pivY = spec.id === "D" ? 214 : Math.min(220, 224 - drop * 0.72 - (spec.ball ? 12 : 2));
    // 支点圆（仅方案 C 清晰正托在斜底边下方，A/B 游离一旁，D 脱空失托）
    if (spec.ball) {
      el("circle", { cx: 138, cy: 227, r: 10, fill: "#0D0C06" }, svg);
    } else if (spec.id === "D") {
      el("circle", { cx: 186, cy: 227, r: 10, fill: "none", stroke: "#131313", "stroke-width": 1.5, "stroke-dasharray": "3 3" }, svg);
    } else {
      el("circle", { cx: 184, cy: 227, r: 10, fill: "#0D0C06" }, svg);
    }
    const g = el("g", { transform: `rotate(${spec.deg} ${pivX} ${pivY})` }, svg);
    el("rect", { x: pivX, y: pivY - bh, width: bw, height: bh, fill: "#131313" }, g);
    el("line", { x1: pivX + 4, y1: pivY - 4, x2: pivX + bw - 2, y2: pivY - bh - 10, stroke: "#FFF8F9", "stroke-width": 1.8 }, g);
  }

  function pick(id) {
    const spec = QUIZ_SPECS.find((s) => s.id === id);
    if (!spec) return;
    for (const b of optBtns) {
      const bid = b.dataset.quizOpt;
      b.classList.toggle("is-picked", bid === id);
      b.classList.toggle("is-correct", bid === "C");
      b.classList.toggle("is-wrong", bid === id && bid !== "C");
      b.setAttribute("aria-pressed", String(bid === id));
    }
    fb.hidden = false;
    fbBadge.textContent = spec.ok ? "判断准确 · 方案 C" : `再琢磨一下 · 你选了方案 ${id}`;
    fbBadge.dataset.tone = spec.ok ? "good" : "bad";
    fbTitle.textContent = spec.ok ? "18° 明确斜势 + 0° 厚重正栏 + 支点托底" : "这版还没过「敧正平衡」关";
    fbBody.textContent = spec.reason + (spec.ok ? "" : " 看看方案 C：它把倾角推过 10° 误歪死区又收在 25° 内，并用底锚接住斜碑，正与斜彼此成全。");
  }

  for (const b of optBtns) {
    b.addEventListener("click", () => pick(b.dataset.quizOpt));
  }
  retryBtn?.addEventListener("click", () => {
    fb.hidden = true;
    for (const b of optBtns) {
      b.classList.remove("is-picked", "is-correct", "is-wrong");
      b.setAttribute("aria-pressed", "false");
    }
  });
}

/* =========================================================================
   07 节：原海报高清灯箱（缩放 + 拖拽 + Esc 关，只复读 #poster.src）
   ========================================================================= */
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const box = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbIn = document.getElementById("lb-in");
  const lbOut = document.getElementById("lb-out");
  const lbReset = document.getElementById("lb-reset");
  const lbClose = document.getElementById("lb-close");
  const lbStage = document.getElementById("lightbox-stage");
  if (!poster || !box || !lbImg) return;

  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let sx = 0, sy = 0, px0 = 0, py0 = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  }
  function resetView() {
    zoom = 1; panX = 0; panY = 0;
    applyTransform();
  }
  function open() {
    lbImg.src = poster.src;
    resetView();
    box.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose?.focus();
  }
  function close() {
    if (box.hidden) return;
    box.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  lbClose?.addEventListener("click", close);
  lbReset?.addEventListener("click", resetView);
  lbIn?.addEventListener("click", () => { zoom = Math.min(3.2, +(zoom + 0.35).toFixed(2)); applyTransform(); });
  lbOut?.addEventListener("click", () => {
    zoom = Math.max(0.75, +(zoom - 0.35).toFixed(2));
    if (zoom <= 1) { panX = 0; panY = 0; }
    applyTransform();
  });

  box.addEventListener("click", (e) => {
    if (e.target === box || e.target === lbStage) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });

  lbStage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    zoom = Math.max(0.75, Math.min(3.2, +(zoom + delta).toFixed(2)));
    if (zoom <= 1) { panX = 0; panY = 0; }
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    lbImg.setPointerCapture?.(e.pointerId);
    sx = e.clientX; sy = e.clientY;
    px0 = panX; py0 = panY;
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    panX = px0 + (e.clientX - sx);
    panY = py0 + (e.clientY - sy);
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { dragging = false; });
  lbImg.addEventListener("pointercancel", () => { dragging = false; });
}
