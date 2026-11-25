// 312 三角调度 · 正文 01–07 节互动实验（相邻节控件形态互不重复）
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

const PAL = {
  paper: "#F4EADC",
  ivory: "#FAF4EC",
  sand: "#EDDFCB",
  ink: "#11100E",
  inkSoft: "#4B463F",
  darkBg: "#151311",
  darkSurface: "#211D19",
  vermilion: "#E54B1A",
  vermilionBright: "#FF7043",
  vermilionInk: "#B8350C",
};

// =====================================================================
// 01 节：点击式原海报四道力解剖（稳定 / 引导 / 层级 / 焦点）
// =====================================================================
const ANATOMY_DATA = {
  stability: {
    zh: "稳定",
    en: "STABILITY",
    quote: "「底宽顶窄，形成稳定支撑，视觉落点清晰可靠。」",
    detail:
      "人的视知觉天生带着重力预期：下宽上窄的实体重心贴近底面，不需要额外费力就能「立住」。312 原海报在最底部压了一根极粗的纯黑水平横梁，再排布三枚等距黑圆，正是为了先给出宽广底座，托住整座金字塔的视觉重量。",
    cue: "底部支撑：底部信息分布均衡，提供稳定的承载力。",
  },
  guide: {
    zh: "引导",
    en: "GUIDE",
    quote: "「线条与方向向上汇聚，自然引导视线聚焦。」",
    detail:
      "水平线让人左右平扫，垂直线让人上下静止，唯有成对向内收拢的斜线会制造强烈的「箭簇效应」。原海报两侧用虚线配朱红上行箭头夹紧画框，眼睛落到底边后，几乎不用思考就会沿两条斜坡滑向顶点。",
    cue: "两侧引导：两侧线条向中心汇聚，增强方向感与秩序感。",
  },
  hierarchy: {
    zh: "层级",
    en: "HIERARCHY",
    quote: "「从顶点到底部，信息层级由强至弱。」",
    detail:
      "在宽阔的底边可以并排容纳三组配角信息，中层由一枚巨大的朱红圆承担主视觉体量，到了窄窄的尖顶只够放下一位主角。空间越往上越稀缺，观众一眼就明白「谁主谁次」，不必靠弹窗或剪辑额外解释。",
    cue: "空间分级：上窄独占权重，中层聚量，下宽分摊支线。",
  },
  focus: {
    zh: "焦点",
    en: "FOCUS",
    quote: "「顶点作为视觉焦点，强化主题与核心信息。」",
    detail:
      "两道斜线交汇的唯一端点拥有最高的视觉势能。原海报把朱红顶点圆与三道辐射短芒悬在金字塔尖，即便它的面积远小于中央大圆，却依然稳稳锁住了视线终点——这就是几何汇聚赋予顶点的杠杆。",
    cue: "顶点聚焦：核心信息置于顶点，形成强烈聚焦。",
  },
};

function initAnatomyLab() {
  const btns = [...document.querySelectorAll("[data-anatomy]")];
  const svg = document.getElementById("anatomy-svg");
  const titleEl = document.getElementById("anatomy-title");
  const quoteEl = document.getElementById("anatomy-quote");
  const detailEl = document.getElementById("anatomy-detail");
  const cueEl = document.getElementById("anatomy-cue");
  if (!btns.length || !svg) return;

  const setKey = (key) => {
    const d = ANATOMY_DATA[key];
    if (!d) return;
    svg.dataset.active = key;
    for (const b of btns) {
      const on = b.dataset.anatomy === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    if (titleEl) titleEl.textContent = `${d.zh} · ${d.en}`;
    if (quoteEl) quoteEl.textContent = d.quote;
    if (detailEl) detailEl.textContent = d.detail;
    if (cueEl) cueEl.textContent = d.cue;
  };

  for (const b of btns) {
    b.addEventListener("click", () => setKey(b.dataset.anatomy));
  }
  setKey("stability");
}

// =====================================================================
// 02 节：四时代历史演进（胶片里程碑切换 + 矢量构图拆解）
// =====================================================================
const HISTORY_DATA = [
  {
    id: "davinci",
    year: "1483–1486",
    title: "达·芬奇《岩间圣母》",
    place: "卢浮宫藏品 INV 777",
    text: "文艺复兴盛期，达·芬奇把圣母、圣婴、幼年施洗约翰与天使四人收束进一座紧致的石窟金字塔。圣母头部占顶，四人的手势与视线在三角形内部首尾相扣，打破了中世纪圣像呆板平排的旧格律。",
    svg: `
      <rect x="18" y="16" width="324" height="208" fill="#FAF4EC" stroke="#11100E" stroke-width="1.5"/>
      <polygon points="180,34 62,204 298,204" fill="#EDDFCB" stroke="#E54B1A" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="180" cy="64" r="15" fill="#E54B1A"/>
      <path d="M150,126 C150,94 210,94 210,126 L224,202 L136,202 Z" fill="#11100E"/>
      <circle cx="112" cy="142" r="11" fill="#3C362F"/>
      <path d="M92,202 L100,158 L124,158 L132,202 Z" fill="#3C362F"/>
      <circle cx="246" cy="136" r="12" fill="#3C362F"/>
      <path d="M224,202 L233,152 L259,152 L268,202 Z" fill="#3C362F"/>
      <circle cx="192" cy="166" r="9.5" fill="#11100E"/>
      <path d="M174,202 L182,178 L202,178 L210,202 Z" fill="#11100E"/>
      <line x1="180" y1="78" x2="118" y2="136" stroke="#E54B1A" stroke-width="1.5"/>
      <line x1="238" y1="142" x2="198" y2="164" stroke="#E54B1A" stroke-width="1.5"/>
      <rect x="52" y="202" width="256" height="6" fill="#11100E"/>
      <text x="28" y="34" font-family="IBM Plex Mono, monospace" font-size="11" fill="#4B463F">1483–1486 · PYRAMID</text>
    `,
  },
  {
    id: "raphael",
    year: "1505–1506",
    title: "拉斐尔《草地上的圣母》",
    place: "维也纳艺术史博物馆 GG 175",
    text: "拉斐尔在佛罗伦萨时期吸收了达·芬奇的手法，将金字塔构图提炼得更加疏朗明快：圣母宽阔的坐姿裙摆稳稳拉出底边，左右两位幼童填实底角，开阔的远山与天空留白让三角形轮廓一眼可读。",
    svg: `
      <rect x="18" y="16" width="324" height="208" fill="#FAF4EC" stroke="#11100E" stroke-width="1.5"/>
      <line x1="18" y1="138" x2="342" y2="138" stroke="rgba(17,16,14,0.18)" stroke-width="1"/>
      <polygon points="186,38 74,202 288,202" fill="#EDDFCB" stroke="#E54B1A" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="186" cy="60" r="14" fill="#E54B1A"/>
      <path d="M162,84 L210,84 L268,202 L116,202 Z" fill="#11100E"/>
      <circle cx="102" cy="148" r="10" fill="#3C362F"/>
      <path d="M84,202 L93,162 L114,162 L120,202 Z" fill="#3C362F"/>
      <circle cx="174" cy="148" r="10" fill="#5D554B"/>
      <path d="M158,202 L164,162 L185,162 L192,202 Z" fill="#5D554B"/>
      <rect x="64" y="202" width="234" height="6" fill="#11100E"/>
      <text x="28" y="34" font-family="IBM Plex Mono, monospace" font-size="11" fill="#4B463F">1506 · M.D.V.I.</text>
    `,
  },
  {
    id: "arnheim",
    year: "1954 / 1974",
    title: "阿恩海姆《艺术与视知觉》",
    place: "加州大学出版社",
    text: "格式塔心理学家鲁道夫·阿恩海姆用「知觉力场」解释三角形为什么起作用：视觉元素带有心理重量与方向向量，底宽顶窄顺应人眼的重力轴而显稳固，顶点倒置或偏斜则会激发持续的张力。",
    svg: `
      <rect x="18" y="16" width="324" height="208" fill="#FAF4EC" stroke="#11100E" stroke-width="1.5"/>
      <polygon points="114,48 50,192 178,192" fill="#EDDFCB" stroke="#11100E" stroke-width="1.8"/>
      <line x1="114" y1="48" x2="114" y2="196" stroke="#E54B1A" stroke-width="1.5" stroke-dasharray="4 3"/>
      <circle cx="114" cy="144" r="6" fill="#E54B1A"/>
      <text x="114" y="212" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#11100E">重心贴底 · 稳</text>
      <polygon points="258,188 198,54 318,54" fill="rgba(229,75,26,0.12)" stroke="#E54B1A" stroke-width="1.8" stroke-dasharray="5 4"/>
      <line x1="258" y1="54" x2="258" y2="188" stroke="#11100E" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="258" cy="99" r="6" fill="#11100E"/>
      <path d="M236,158 Q258,176 280,158" fill="none" stroke="#E54B1A" stroke-width="1.5"/>
      <text x="258" y="212" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#B8350C">重心悬空 · 危</text>
    `,
  },
  {
    id: "cinema",
    year: "1991–2005",
    title: "卡茨 / 布洛克 / 波德维尔",
    place: "现代电影场面调度体系",
    text: "史蒂文·卡茨《电影镜头设计》（1991）把多人站位归纳为 A、I、L 字母几何；布鲁斯·布洛克《视觉故事》（2001）与大卫·波德维尔《光影造像》（2005）进一步说明：导演用走位与机位移动把静态金字塔变成时间里的动态三角。",
    svg: `
      <rect x="18" y="16" width="324" height="208" fill="#FAF4EC" stroke="#11100E" stroke-width="1.5"/>
      <polygon points="180,48 84,150 276,150" fill="rgba(229,75,26,0.11)" stroke="#E54B1A" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M74,196 Q180,224 286,196" fill="none" stroke="#11100E" stroke-width="1.5" stroke-dasharray="4 4"/>
      <rect x="168" y="196" width="24" height="14" fill="#11100E"/>
      <polygon points="174,196 168,186 192,186 186,196" fill="#E54B1A"/>
      <circle cx="180" cy="48" r="14" fill="#E54B1A"/>
      <text x="180" y="52" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="11" fill="#FAF4EC">A</text>
      <circle cx="84" cy="150" r="12" fill="#11100E"/>
      <text x="84" y="154" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="11" fill="#FAF4EC">B</text>
      <circle cx="276" cy="150" r="12" fill="#11100E"/>
      <text x="276" y="154" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="11" fill="#FAF4EC">C</text>
      <text x="28" y="34" font-family="IBM Plex Mono, monospace" font-size="11" fill="#4B463F">A-FRAME BLOCKING · 1991</text>
    `,
  },
];

function initHistoryLab() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const svg = document.getElementById("history-svg");
  const metaEl = document.getElementById("history-meta");
  const titleEl = document.getElementById("history-title");
  const textEl = document.getElementById("history-text");
  if (!tabs.length || !svg) return;

  const select = (id) => {
    const item = HISTORY_DATA.find((x) => x.id === id) || HISTORY_DATA[0];
    for (const t of tabs) {
      const on = t.dataset.era === item.id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    }
    svg.innerHTML = item.svg;
    if (metaEl) metaEl.textContent = `${item.year} · ${item.place}`;
    if (titleEl) titleEl.textContent = item.title;
    if (textEl) textEl.textContent = item.text;
  };

  for (const t of tabs) t.addEventListener("click", () => select(t.dataset.era));
  select("davinci");
}

// =====================================================================
// 03 节（暗房版）：重力倾角轮盘实验（拖动旋转 0° 正三角 ↔ 55° 偏心 ↔ 180° 倒三角）
// =====================================================================
function initGravityDialLab() {
  const canvas = document.getElementById("dial-canvas");
  const presetBtns = [...document.querySelectorAll("[data-tilt-preset]")];
  const angleOut = document.getElementById("dial-angle");
  const modeOut = document.getElementById("dial-mode");
  const descOut = document.getElementById("dial-desc");
  const stabOut = document.getElementById("dial-stability");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let angleDeg = 0; // 0=正三角，48=偏心斜三角，180=倒三角
  let W = 540, H = 300;

  function resize() {
    const dpr = pixelRatio(2);
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function classify(deg) {
    const a = ((deg % 360) + 360) % 360;
    const distFromUp = Math.min(a, 360 - a);
    const distFromDown = Math.abs(a - 180);
    if (distFromUp <= 22) {
      return {
        mode: "正三角 · 稳固秩序",
        level: "高稳定（底盘承重）",
        desc: "宽阔底边贴近地面、顶点直指上方，顺应重力预期。适合确立主角权威、仪式感或结局落定——这也是 312 原海报重点描绘的经典形态。",
      };
    }
    if (distFromDown <= 26) {
      return {
        mode: "倒三角 · 悬顶压迫",
        level: "强失稳（重心悬空）",
        desc: "两股视觉重量压在上沿，下方只靠尖锐单点支撑，仿佛随时倾倒。导演常用它拍审讯、孤立、危机逼近，把观众的心理防线绷紧。",
      };
    }
    return {
      mode: "斜三角 · 倾斜势能",
      level: "中张力（单侧牵引）",
      desc: `三角形整体偏转 ${Math.round(distFromUp)}°，重心垂线逼近一侧底脚。既有结构骨架，又拒绝静止对称，最适合表现谈判失衡与局势转向。`,
    };
  }

  function updateReadout() {
    const a = ((Math.round(angleDeg) % 360) + 360) % 360;
    const info = classify(a);
    if (angleOut) angleOut.textContent = `${a}°`;
    if (modeOut) modeOut.textContent = info.mode;
    if (stabOut) stabOut.textContent = info.level;
    if (descOut) descOut.textContent = info.desc;
    for (const b of presetBtns) {
      const target = Number(b.dataset.tiltPreset);
      const diff = Math.min(Math.abs(a - target), 360 - Math.abs(a - target));
      b.classList.toggle("is-active", diff <= 14);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PAL.darkSurface;
    ctx.fillRect(0, 0, W, H);

    // 左侧为轮盘，右侧（或整幅中心）为片场重力可视化
    const cx = W * 0.5;
    const cy = H * 0.51;
    const R = Math.min(W * 0.31, H * 0.38);

    // 暗房参考圆环与刻度
    ctx.save();
    ctx.strokeStyle = "rgba(244, 234, 220, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // 0° / 90° / 180° / 270° 刻度
    for (let d = 0; d < 360; d += 30) {
      const rad = ((d - 90) * Math.PI) / 180;
      const inner = d % 90 === 0 ? R - 9 : R - 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
      ctx.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
      ctx.stroke();
    }

    // 地平基线
    const groundY = cy + R + 16;
    ctx.strokeStyle = "rgba(244, 234, 220, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, groundY);
    ctx.lineTo(W - 24, groundY);
    ctx.stroke();

    // 旋转三角形三个顶点（角 0 在正上方 -90°）
    const baseRad = ((angleDeg - 90) * Math.PI) / 180;
    const pts = [0, 125, 235].map((off) => {
      const a = baseRad + (off * Math.PI) / 180;
      return { x: cx + Math.cos(a) * R * 0.86, y: cy + Math.sin(a) * R * 0.86 };
    });

    // 重心与重力垂线
    const gx = (pts[0].x + pts[1].x + pts[2].x) / 3;
    const gy = (pts[0].y + pts[1].y + pts[2].y) / 3;

    // 填充面
    const info = classify(angleDeg);
    const isInverted = info.mode.startsWith("倒三角");
    ctx.fillStyle = isInverted ? "rgba(255, 112, 67, 0.18)" : "rgba(244, 234, 220, 0.11)";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fill();

    // 两腰虚线 + 底边实线
    ctx.strokeStyle = PAL.vermilionBright;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = PAL.paper;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.stroke();

    // 重力铅垂线
    ctx.strokeStyle = "rgba(255, 112, 67, 0.75)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 重心圆点
    ctx.fillStyle = PAL.paper;
    ctx.beginPath();
    ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 三个角色剪影圆（B/C 为副锚点，A 为可拖主顶点）
    for (let i = 1; i <= 2; i++) {
      ctx.fillStyle = PAL.paper;
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.darkBg;
      ctx.font = '700 11px "Archivo", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i === 1 ? "B" : "C", pts[i].x, pts[i].y + 0.5);
    }

    // 顶点拖动把手 A
    const hx = cx + Math.cos(baseRad) * R;
    const hy = cy + Math.sin(baseRad) * R;
    ctx.strokeStyle = PAL.vermilionBright;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    ctx.fillStyle = PAL.vermilionBright;
    ctx.beginPath();
    ctx.arc(hx, hy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PAL.paper;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PAL.darkBg;
    ctx.font = '700 11px "Archivo", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", hx, hy + 0.5);

    // 提示微标
    ctx.fillStyle = "rgba(244, 234, 220, 0.78)";
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText("DRAG APEX A · 拖动圆环旋转顶点", 16, 22);
    ctx.restore();
  }

  let dragging = false;
  const setFromPtr = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const dx = clientX - r.left - W * 0.5;
    const dy = clientY - r.top - H * 0.51;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    deg = ((deg % 360) + 360) % 360;
    // 磁吸 0° 与 180°
    if (deg < 5 || deg > 355) deg = 0;
    else if (Math.abs(deg - 180) < 5) deg = 180;
    angleDeg = deg;
    updateReadout();
    draw();
  };

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    setFromPtr(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromPtr(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      angleDeg = (angleDeg + 15) % 360;
      updateReadout();
      draw();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      angleDeg = (angleDeg - 15 + 360) % 360;
      updateReadout();
      draw();
    }
  });

  for (const b of presetBtns) {
    b.addEventListener("click", () => {
      angleDeg = Number(b.dataset.tiltPreset);
      updateReadout();
      draw();
    });
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  updateReadout();
}

// =====================================================================
// 04 节：一镜之内换主角（三拍长镜头时间轴滑杆 + 播放/暂停，零剪辑移交顶点）
// =====================================================================
const BEATS = [
  {
    t: 0,
    tag: "BEAT 01 · 开场宣读",
    owner: "A 掌顶点",
    text: "开场正三角：主角 A 站在后景正中掌控全局，B 与 C 分坐前景两侧听审，不需要特写切镜头，权力高下一眼分明。",
    // 画面相对坐标 (u, v) + 俯视坐标 (fx, fz)
    A: { u: 0.50, v: 0.24, fx: 0.50, fz: 0.24, h: 1.0 },
    B: { u: 0.20, v: 0.56, fx: 0.24, fz: 0.72, h: 0.68 },
    C: { u: 0.80, v: 0.56, fx: 0.76, fz: 0.72, h: 0.68 },
    camX: 0.50,
  },
  {
    t: 0.5,
    tag: "BEAT 02 · 证人起身反驳",
    owner: "B 夺顶点",
    text: "第 6 秒不切镜头：原本坐着的 B 猛地站起并向中后方跨步，A 略微低头退侧。三角形顺势向左上方掀翻，视觉顶点立刻易主给 B。",
    A: { u: 0.56, v: 0.52, fx: 0.56, fz: 0.54, h: 0.72 },
    B: { u: 0.30, v: 0.22, fx: 0.34, fz: 0.26, h: 1.04 },
    C: { u: 0.82, v: 0.58, fx: 0.78, fz: 0.74, h: 0.68 },
    camX: 0.44,
  },
  {
    t: 1.0,
    tag: "BEAT 03 · 机位侧移定局",
    owner: "C 成新顶",
    text: "第 12 秒摄影机沿弧线向右滑移，同时 C 登上台阶转向全员。整场戏零剪辑走完三拍，焦点沿 A → B → C 丝滑流转。",
    A: { u: 0.22, v: 0.56, fx: 0.30, fz: 0.66, h: 0.70 },
    B: { u: 0.50, v: 0.58, fx: 0.48, fz: 0.72, h: 0.70 },
    C: { u: 0.74, v: 0.23, fx: 0.72, fz: 0.24, h: 1.05 },
    camX: 0.66,
  },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleBeat(u) {
  const s = clamp(u, 0, 1);
  const seg = s < 0.5 ? [BEATS[0], BEATS[1], s * 2] : [BEATS[1], BEATS[2], (s - 0.5) * 2];
  const [b0, b1, local] = seg;
  const e = local * local * (3 - 2 * local);
  const mix = (k) => ({
    u: lerp(b0[k].u, b1[k].u, e),
    v: lerp(b0[k].v, b1[k].v, e),
    fx: lerp(b0[k].fx, b1[k].fx, e),
    fz: lerp(b0[k].fz, b1[k].fz, e),
    h: lerp(b0[k].h, b1[k].h, e),
  });
  const activeIdx = s < 0.33 ? 0 : s < 0.72 ? 1 : 2;
  return {
    A: mix("A"),
    B: mix("B"),
    C: mix("C"),
    camX: lerp(b0.camX, b1.camX, e),
    beat: BEATS[activeIdx],
  };
}

function initTakeTimelineLab() {
  const canvas = document.getElementById("take-canvas");
  const slider = document.getElementById("take-slider");
  const playBtn = document.getElementById("take-play");
  const beatBtns = [...document.querySelectorAll("[data-beat]")];
  const tagEl = document.getElementById("take-tag");
  const ownerEl = document.getElementById("take-owner");
  const descEl = document.getElementById("take-desc");
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  let progress = 0;
  let playing = false;
  let dirty = true;
  let W = 720, H = 260;

  function resize() {
    const dpr = pixelRatio(2);
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
    ctl.draw();
  }

  function updateText(snap) {
    if (tagEl) tagEl.textContent = snap.beat.tag;
    if (ownerEl) ownerEl.textContent = snap.beat.owner;
    if (descEl) descEl.textContent = snap.beat.text;
    const idx = BEATS.indexOf(snap.beat);
    for (const b of beatBtns) {
      b.classList.toggle("is-active", Number(b.dataset.beat) === idx);
    }
  }

  function drawFrame() {
    const snap = sampleBeat(progress);
    updateText(snap);

    ctx.clearRect(0, 0, W, H);
    // 左 32% 迷你俯视图，右 68% 宽银幕取景画面（窄屏下自动调比例）
    const split = Math.round(W * (W < 420 ? 0.36 : 0.31));

    // 左：俯视走位轨迹
    ctx.fillStyle = PAL.sand;
    ctx.fillRect(0, 0, split - 8, H);
    ctx.strokeStyle = "rgba(17,16,14,0.22)";
    ctx.strokeRect(0.5, 0.5, split - 9, H - 1);

    const fw = split - 28;
    const fh = H - 54;
    const ox = 10;
    const oy = 26;

    ctx.fillStyle = PAL.inkSoft;
    ctx.font = '600 10px "IBM Plex Mono", monospace';
    ctx.fillText("FLOORPLAN", ox, 16);

    // 俯视三角形
    const ptsF = ["A", "B", "C"].map((id) => ({
      id,
      x: ox + snap[id].fx * fw,
      y: oy + snap[id].fz * fh,
    }));
    ctx.strokeStyle = PAL.vermilion;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(ptsF[0].x, ptsF[0].y);
    ctx.lineTo(ptsF[1].x, ptsF[1].y);
    ctx.lineTo(ptsF[2].x, ptsF[2].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    for (const p of ptsF) {
      ctx.fillStyle = p.id === snap.beat.owner[0] ? PAL.vermilion : PAL.ink;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.ivory;
      ctx.font = '700 10px "Archivo", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.id, p.x, p.y + 0.5);
    }

    // 俯视机位滑移
    const camPx = ox + snap.camX * fw;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(camPx - 8, H - 20, 16, 10);
    ctx.fillStyle = PAL.vermilion;
    ctx.fillRect(camPx - 4, H - 24, 8, 4);

    // 右：镜头画框
    const vx = split;
    const vw = W - split;
    ctx.fillStyle = "#FAF4EC";
    ctx.fillRect(vx, 0, vw, H * 0.55);
    ctx.fillStyle = "#EADBC6";
    ctx.fillRect(vx, H * 0.55, vw, H * 0.45);
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx + 0.5, 0.5, vw - 1, H - 1);

    const scr = ["A", "B", "C"].map((id) => ({
      id,
      x: vx + snap[id].u * vw,
      y: snap[id].v * H,
      h: snap[id].h,
    }));
    const sorted = [...scr].sort((p1, p2) => p1.y - p2.y);
    const apex = sorted[0];

    // 三角填色与汇聚虚线
    ctx.fillStyle = "rgba(229, 75, 26, 0.13)";
    ctx.beginPath();
    ctx.moveTo(scr[0].x, scr[0].y);
    ctx.lineTo(scr[1].x, scr[1].y);
    ctx.lineTo(scr[2].x, scr[2].y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = PAL.vermilion;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(sorted[1].x, sorted[1].y);
    ctx.lineTo(apex.x, apex.y);
    ctx.lineTo(sorted[2].x, sorted[2].y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sorted[1].x, sorted[1].y);
    ctx.lineTo(sorted[2].x, sorted[2].y);
    ctx.stroke();

    // 剪影人物（零五官）
    for (const p of scr) {
      const isApex = p.id === apex.id;
      const bodyW = clamp(vw * 0.062, 14, 24);
      const footY = H - 12;
      ctx.fillStyle = isApex ? "#11100E" : "#3E3831";
      ctx.beginPath();
      ctx.moveTo(p.x - bodyW * 0.72, footY);
      ctx.lineTo(p.x - bodyW, p.y + 18);
      ctx.lineTo(p.x + bodyW, p.y + 18);
      ctx.lineTo(p.x + bodyW * 0.72, footY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isApex ? PAL.vermilion : "#1C1916";
      ctx.beginPath();
      ctx.arc(p.x, p.y + 6, bodyW * 0.48, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PAL.ivory;
      ctx.font = '700 11px "Archivo", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.id, p.x, p.y + 34);
    }

    // 底部厚黑基座
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(vx, H - 7, vw, 7);

    // 顶部单镜秒标
    ctx.textAlign = "left";
    ctx.fillStyle = PAL.ink;
    ctx.font = '600 10px "IBM Plex Mono", monospace';
    ctx.fillText(`ONE-TAKE · ${(progress * 12).toFixed(1)}s / 12.0s`, vx + 12, 18);
  }

  const ctl = loop(canvas, (_t, dt, { still }) => {
    if (playing && !still) {
      progress += dt * 0.125;
      if (progress >= 1) {
        progress = 1;
        playing = false;
        if (playBtn) playBtn.textContent = "重播长镜";
      }
      slider.value = String(Math.round(progress * 100));
      dirty = true;
    }
    if (!dirty && !still) return;
    drawFrame();
    dirty = false;
  });

  slider.addEventListener("input", () => {
    playing = false;
    if (playBtn) playBtn.textContent = "播放三拍";
    progress = Number(slider.value) / 100;
    dirty = true;
    ctl.draw();
  });

  playBtn?.addEventListener("click", () => {
    if (playing) {
      playing = false;
      playBtn.textContent = "播放三拍";
    } else {
      if (progress >= 0.99) progress = 0;
      playing = true;
      playBtn.textContent = "暂停";
    }
    dirty = true;
    ctl.draw();
  });

  for (const b of beatBtns) {
    b.addEventListener("click", () => {
      playing = false;
      if (playBtn) playBtn.textContent = "播放三拍";
      const idx = Number(b.dataset.beat);
      progress = BEATS[idx].t;
      slider.value = String(Math.round(progress * 100));
      dirty = true;
      ctl.draw();
    });
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
}

// =====================================================================
// 05 节：三枚独立开关合成台（道具 / 光锥 / 视线补齐第三顶点）
// =====================================================================
function initImpliedLab() {
  const toggles = [...document.querySelectorAll("[data-implied]")];
  const svg = document.getElementById("implied-svg");
  const statusEl = document.getElementById("implied-status");
  const noteEl = document.getElementById("implied-note");
  if (!toggles.length || !svg) return;

  const active = new Set();

  function render() {
    const hasProp = active.has("prop");
    const hasLight = active.has("light");
    const hasGaze = active.has("gaze");
    const count = active.size;

    svg.querySelector("#imp-prop-layer")?.setAttribute("opacity", hasProp ? "1" : "0");
    svg.querySelector("#imp-light-layer")?.setAttribute("opacity", hasLight ? "1" : "0");
    svg.querySelector("#imp-gaze-layer")?.setAttribute("opacity", hasGaze ? "1" : "0");
    svg.querySelector("#imp-seesaw")?.setAttribute("opacity", count === 0 ? "1" : "0");

    if (count === 0) {
      if (statusEl) statusEl.textContent = "双人跷跷板 · 缺第三顶点";
      if (noteEl) noteEl.textContent = "画面里只有左右两位坐姿角色，视线在两人之间平平来回，缺少收束点。勾选上面的任意一项「非人物锚点」，看看画面如何立刻立起隐形三角。";
    } else if (hasProp && !hasLight && !hasGaze) {
      if (statusEl) statusEl.textContent = "道具倒三角 · 证物锁焦";
      if (noteEl) noteEl.textContent = "前景桌面放上一盏台灯或关键证物，它与左右两位角色的头部组成清晰倒三角——两个人的争执瞬间围绕这件物品收拢。";
    } else if (hasLight && !hasProp && !hasGaze) {
      if (statusEl) statusEl.textContent = "顶光正三角 · 光锥造顶";
      if (noteEl) noteEl.textContent = "一束居中的吊灯顶光斜洒下来，光束轮廓本身就是两条汇聚斜线，把孤立的两人罩进一座稳固的光影金字塔里。";
    } else if (hasGaze && !hasProp && !hasLight) {
      if (statusEl) statusEl.textContent = "视线隐形三角 · 心理聚焦";
      if (noteEl) noteEl.textContent = "即使画面上方空无一物，只要两人的目光同时斜向上方同一点汇聚，人脑就会自动补全那条看不见的三角顶点。";
    } else {
      if (statusEl) statusEl.textContent = `复合隐形三角 · ${count} 重锚点协同`;
      if (noteEl) noteEl.textContent = "光锥、桌面道具与视线交汇可以叠加协作，把原本平淡的双人对话镜头织成多层三角张力网，而不必硬塞进第三名演员。";
    }
  }

  for (const input of toggles) {
    input.addEventListener("change", () => {
      if (input.checked) active.add(input.dataset.implied);
      else active.delete(input.dataset.implied);
      render();
    });
  }
  render();
}

// =====================================================================
// 06 节（暗房版）：什么时候别用（四场景对照切卡）
// =====================================================================
const AVOID_DATA = {
  duel: {
    label: "双人 50/50 僵持",
    badTitle: "硬摆三角：偷偷偏心顶点那方",
    badDesc: "哪怕剧本写明「势均力敌」，只要强行把一人垫高凑出顶角，观众潜意识就会觉得居高者占了上风。",
    goodTitle: "更诚实的解：对称两分或平面调度",
    goodDesc: "两人等高分立中轴两侧，把画面做成严格对称天平；若要冷静扁平的秩序感，可参考 311 平面调度。",
    badSvg: `<polygon points="105,34 40,126 170,126" fill="rgba(255,112,67,0.16)" stroke="#FF7043" stroke-dasharray="4 3" stroke-width="1.6"/>
      <circle cx="105" cy="48" r="10" fill="#FF7043"/><rect x="92" y="62" width="26" height="64" fill="#F4EADC"/>
      <circle cx="52" cy="96" r="8" fill="#8C8378"/><rect x="42" y="108" width="20" height="18" fill="#8C8378"/>
      <circle cx="158" cy="96" r="8" fill="#8C8378"/><rect x="148" y="108" width="20" height="18" fill="#8C8378"/>`,
    goodSvg: `<line x1="105" y1="18" x2="105" y2="132" stroke="rgba(244,234,220,0.45)" stroke-dasharray="4 4" stroke-width="1.4"/>
      <circle cx="56" cy="60" r="10" fill="#F4EADC"/><rect x="43" y="74" width="26" height="52" fill="#F4EADC"/>
      <circle cx="154" cy="60" r="10" fill="#F4EADC"/><rect x="141" y="74" width="26" height="52" fill="#F4EADC"/>`,
  },
  chaos: {
    label: "街头失控群像",
    badTitle: "硬摆三角：整齐得像合唱团合影",
    badDesc: "三角形天生散发「秩序与收束」，把它套在恐慌或骚乱人群上，混乱感会瞬间塌成排练好的舞台剧。",
    goodTitle: "更诚实的解：散点穿插与横向冲撞",
    goodDesc: "打破统一顶点，让角色朝向各异、大小不一地错落穿插在画框边缘，保留未经整理的临场不安。",
    badSvg: `<polygon points="105,28 32,126 178,126" fill="rgba(255,112,67,0.16)" stroke="#FF7043" stroke-dasharray="4 3" stroke-width="1.6"/>
      <circle cx="105" cy="44" r="9" fill="#FF7043"/><circle cx="74" cy="84" r="9" fill="#F4EADC"/><circle cx="136" cy="84" r="9" fill="#F4EADC"/>
      <circle cx="46" cy="116" r="9" fill="#F4EADC"/><circle cx="105" cy="116" r="9" fill="#F4EADC"/><circle cx="164" cy="116" r="9" fill="#F4EADC"/>`,
    goodSvg: `<circle cx="34" cy="54" r="11" fill="#F4EADC"/><circle cx="72" cy="108" r="13" fill="#8C8378"/>
      <circle cx="108" cy="42" r="7" fill="#8C8378"/><circle cx="134" cy="96" r="15" fill="#F4EADC"/>
      <circle cx="176" cy="62" r="10" fill="#FF7043"/><circle cx="182" cy="118" r="8" fill="#8C8378"/>
      <path d="M40,66 L80,82 M168,70 L122,56" stroke="#FF7043" stroke-width="1.4" stroke-dasharray="3 3"/>`,
  },
  closeup: {
    label: "极短特写快切",
    badTitle: "硬摆三角：裁切掉底边根本读不出",
    badDesc: "三角调度靠中全景的底边跨度与两腰斜线起效；切到只剩肩头的特写或 1 秒快剪，观众大脑根本来不及拼出三点几何。",
    goodTitle: "更诚实的解：视线匹配与单人构图",
    goodDesc: "在特写快切里放弃强凑三人三角，专注单人留白方向（Look Room）和正反打视线轴线。",
    badSvg: `<rect x="44" y="24" width="122" height="96" fill="none" stroke="#FF7043" stroke-width="1.6"/>
      <circle cx="105" cy="72" r="32" fill="#F4EADC"/><line x1="18" y1="128" x2="105" y2="20" stroke="rgba(255,112,67,0.4)" stroke-dasharray="3 3"/>
      <line x1="192" y1="128" x2="105" y2="20" stroke="rgba(255,112,67,0.4)" stroke-dasharray="3 3"/>`,
    goodSvg: `<rect x="34" y="24" width="66" height="96" fill="none" stroke="#F4EADC" stroke-width="1.3"/>
      <circle cx="56" cy="72" r="17" fill="#F4EADC"/><line x1="76" y1="72" x2="94" y2="72" stroke="#FF7043" stroke-width="2"/>
      <rect x="110" y="24" width="66" height="96" fill="none" stroke="#F4EADC" stroke-width="1.3"/>
      <circle cx="154" cy="72" r="17" fill="#F4EADC"/><line x1="134" y1="72" x2="116" y2="72" stroke="#FF7043" stroke-width="2"/>`,
  },
  staged: {
    label: "纪实日常闲聊",
    badTitle: "硬摆三角：每镜等腰像刻意摆拍",
    badDesc: "连续几个镜头都把人精确摆成正中等腰三角形，观众会突然出戏，看见导演在镜头外发号施令。",
    goodTitle: "更诚实的解：藏进动作与自然遮挡",
    goodDesc: "让三角只出现在冲突高潮一拍，平常对话用偏心松散站位与自然动作（倒水、转身）把几何藏起来。",
    badSvg: `<polygon points="105,30 46,122 164,122" fill="rgba(255,112,67,0.16)" stroke="#FF7043" stroke-width="1.8"/>
      <line x1="105" y1="18" x2="105" y2="134" stroke="rgba(244,234,220,0.4)" stroke-dasharray="2 3"/>
      <circle cx="105" cy="40" r="9" fill="#FF7043"/><circle cx="54" cy="114" r="9" fill="#F4EADC"/><circle cx="156" cy="114" r="9" fill="#F4EADC"/>`,
    goodSvg: `<circle cx="56" cy="76" r="10" fill="#F4EADC"/><rect x="44" y="90" width="24" height="36" fill="#F4EADC"/>
      <circle cx="132" cy="64" r="10" fill="#F4EADC"/><rect x="120" y="78" width="24" height="48" fill="#F4EADC"/>
      <circle cx="166" cy="86" r="9" fill="#8C8378"/><rect x="156" y="98" width="20" height="28" fill="#8C8378"/>
      <path d="M72,82 Q100,72 118,68" fill="none" stroke="#FF7043" stroke-width="1.4" stroke-dasharray="4 3"/>`,
  },
};

function initAvoidLab() {
  const btns = [...document.querySelectorAll("[data-avoid]")];
  const badSvg = document.getElementById("avoid-bad-svg");
  const goodSvg = document.getElementById("avoid-good-svg");
  const badTitle = document.getElementById("avoid-bad-title");
  const badDesc = document.getElementById("avoid-bad-desc");
  const goodTitle = document.getElementById("avoid-good-title");
  const goodDesc = document.getElementById("avoid-good-desc");
  if (!btns.length || !badSvg || !goodSvg) return;

  const setKey = (k) => {
    const d = AVOID_DATA[k];
    if (!d) return;
    for (const b of btns) {
      const on = b.dataset.avoid === k;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    badSvg.innerHTML = d.badSvg;
    goodSvg.innerHTML = d.goodSvg;
    if (badTitle) badTitle.textContent = d.badTitle;
    if (badDesc) badDesc.textContent = d.badDesc;
    if (goodTitle) goodTitle.textContent = d.goodTitle;
    if (goodDesc) goodDesc.textContent = d.goodDesc;
  };

  for (const b of btns) b.addEventListener("click", () => setKey(b.dataset.avoid));
  setKey("duel");
}

// =====================================================================
// 07 节：导演小练习（四选一中性标签，只差高低与顶点朝向单一变量）
// =====================================================================
const QUIZ_REASONS = {
  A: {
    ok: false,
    head: "方案 A 不贴合：三人齐高横排，没有视觉领头人",
    body: "虽然主角 A 站在正中间，但 B、A、C 三颗头顶连成完全水平的直线，缺少向上汇聚的斜线和高度级差。观众看到的是平起平坐的并列关系，而不是由 A 掌控全局。",
  },
  B: {
    ok: true,
    head: "选对了，就是方案 B：底宽顶窄的正三角一镜锁死掌控权",
    body: "水平间距和焦段与其余三镜完全一致，但 A 居中立于高位、B 与 C 分坐前景左右低位，自然围出一座底宽顶窄的正三角。宽底稳住画面，两条汇聚斜线直指主角 A，不切镜头就建立了清晰的权力层级。",
  },
  C: {
    ok: false,
    head: "方案 C 刚好反了：这是压迫主角的倒三角",
    body: "B、C 高立两侧、主角 A 沉在中间低位，围成了上宽下尖的倒三角形。视觉重量从左右上方斜压向中央，观众会立刻读出「A 正在被两人逼问或围困」，与剧本要求正好相反。",
  },
  D: {
    ok: false,
    head: "方案 D 跑偏焦点：单向阶梯把最高点让给了配角 B",
    body: "从左到右一路走低的单向斜坡里，最高顶点落在了最左侧的 B 头上，而非主角 A；同时画面重心明显左坠，失去正三角的对称承托感。",
  },
};

function initQuizLab() {
  const opts = [...document.querySelectorAll("[data-quiz-opt]")];
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");
  const fbHead = document.getElementById("quiz-fb-head");
  const fbBody = document.getElementById("quiz-fb-body");
  if (!opts.length || !grid) return;

  for (const btn of opts) {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.quizOpt;
      const res = QUIZ_REASONS[pick];
      if (!res) return;
      grid.classList.add("is-answered");
      for (const b of opts) {
        const key = b.dataset.quizOpt;
        b.classList.toggle("is-picked", key === pick);
        b.classList.toggle("is-correct", key === "B");
        b.classList.toggle("is-wrong", key === pick && key !== "B");
        b.setAttribute("aria-pressed", String(key === pick));
      }
      if (feedback) {
        feedback.hidden = false;
        feedback.dataset.result = res.ok ? "correct" : "wrong";
      }
      if (fbHead) fbHead.textContent = res.head;
      if (fbBody) fbBody.textContent = res.body;
    });
  }
}

export function initSectionLabs() {
  initAnatomyLab();
  initHistoryLab();
  initGravityDialLab();
  initTakeTimelineLab();
  initImpliedLab();
  initAvoidLab();
  initQuizLab();
}
