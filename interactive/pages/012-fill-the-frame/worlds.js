// 页面上画的几样东西：开场的黄环雕塑、03/07 的人（背影）、04 的柠檬片。颜色都取自海报。
export const C = {
  blue: "#012CA3",
  blueD: "#00217E",
  blueL: "#2A4FC0",
  yellow: "#FAC302",
  yellowD: "#E3A600",
  yellowL: "#FFDB55",
  white: "#FFFFFF",
};

// ---------- 黄环：一座立在地上的环形雕塑，旁边站一个人当比例尺 ----------
export const RING = { W: 2400, H: 1800, cx: 1200, cy: 900, ro: 400, ri: 180, ground: 1300, person: { x: 1720, h: 176 } };
RING.personBox = { x0: RING.person.x - 22, x1: RING.person.x + 22, y0: RING.ground - RING.person.h, y1: RING.ground };

const annulus = (g, x, y, ro, ri) => {
  g.beginPath();
  g.arc(x, y, ro, 0, Math.PI * 2);
  g.arc(x, y, ri, 0, Math.PI * 2, true);
};

export function paintRingMask(g) {
  g.fillStyle = "#000";
  annulus(g, RING.cx, RING.cy, RING.ro, RING.ri);
  g.fill();
}

// 背影小人：脚底在 (x, y)，高 h；没有五官
export function person(g, x, y, h, color = C.white) {
  const u = h / 100;
  g.save();
  g.translate(x, y);
  g.scale(u, u);
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.ellipse(0, -91, 7.6, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.fillRect(-2.6, -84, 5.2, 6);
  g.beginPath();
  g.moveTo(-12, -77);
  g.quadraticCurveTo(-13.5, -79.5, -9, -80);
  g.lineTo(9, -80);
  g.quadraticCurveTo(13.5, -79.5, 12, -77);
  g.lineTo(10, -60);
  g.lineTo(10.5, -45);
  g.lineTo(-10.5, -45);
  g.lineTo(-10, -60);
  g.closePath();
  g.fill();
  g.lineWidth = 4.6;
  g.beginPath();
  g.moveTo(-12.5, -75); g.lineTo(-14.6, -58); g.lineTo(-14, -44);
  g.moveTo(12.5, -75); g.lineTo(14.6, -58); g.lineTo(14, -44);
  g.stroke();
  g.lineWidth = 7.2;
  g.beginPath();
  g.moveTo(-5, -46); g.lineTo(-5.4, -3);
  g.moveTo(5, -46); g.lineTo(5.4, -3);
  g.stroke();
  g.beginPath();
  g.ellipse(-6, -1.6, 5.6, 2.2, 0, 0, Math.PI * 2);
  g.ellipse(6, -1.6, 5.6, 2.2, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function drawRingWorld(g) {
  const { W, H, cx, cy, ro, ri, ground, person: p } = RING;
  g.fillStyle = C.blue;
  g.fillRect(0, 0, W, H);
  g.fillStyle = C.blueD;
  g.beginPath();
  g.ellipse(cx, ground + 4, ro * 0.78, 22, 0, 0, Math.PI * 2);
  g.ellipse(p.x + 4, ground + 2, 30, 5.5, 0, 0, Math.PI * 2);
  g.fill();
  // 环：外缘右下、内缘左上压一道暗黄，像光从左上来，环就有了厚度
  g.save();
  annulus(g, cx, cy, ro, ri);
  g.clip("evenodd");
  g.fillStyle = C.yellowD;
  g.fillRect(cx - ro, cy - ro, ro * 2, ro * 2);
  g.fillStyle = C.yellow;
  annulus(g, cx - 24, cy - 30, ro, ri - 6);
  g.fill("evenodd");
  g.restore();
  person(g, p.x, ground, p.h);
}

// ---------- 人（背影）：形状在 index.html 的 <symbol id="fig">，高 1000 个单位，头顶 y=0，脚底 y=1000 ----------
// 画框的一条边落在哪一段身上。y 是 0–1000 的身高位置；kind：good 稳、ok 可以、bad 别切
export const BODY_ZONES = [
  { to: 6, name: "头顶上方", top: ["good", "头顶上还有空：整个人都在，上面的空白就是头部空间。"], bottom: ["bad", "画框底边在头上，人整个不见了。"] },
  { to: 60, name: "头顶", top: ["good", "切掉一截头顶：紧凑的人像常这么裁，眼睛会自己把头补圆，比切在下巴上稳。"], bottom: ["bad", "只剩头顶一截。"] },
  { to: 110, name: "头的中段", top: ["bad", "切进头里一大半：只剩半个后脑勺，太紧了。"], bottom: ["bad", "切在头的中段：人只剩半个脑袋。"] },
  { to: 168, name: "下巴、脖子", tag: "下巴", top: ["bad", "切在脖子上：头没了，背影本来就靠头和肩认人。"], bottom: ["bad", "切在下巴、脖子上：头像搁在画框边上，人被截断了。"] },
  { to: 205, name: "肩线", top: ["bad", "顶边从肩上过：人没了头，只剩身子。"], bottom: ["ok", "贴着肩线：边和肩膀平行，像肩膀放在框上。往下挪到胸口更稳。"] },
  { to: 330, name: "胸口、上臂中段", top: ["bad", "顶边在胸口：只剩下半身。"], bottom: ["good", "胸口、上臂中段：落在肩和手肘之间，常见的胸像切法。"] },
  { to: 412, name: "腰、手肘", tag: "肘", top: ["bad", "顶边在腰上。"], bottom: ["bad", "手肘、腰在这一带：刀落在关节上，人像少了一截。往上到胸口，或往下到大腿。"] },
  { to: 505, name: "小臂、胯", top: ["bad", "顶边在胯上。"], bottom: ["ok", "小臂中段、胯：可以，不过上下都挨着关节，稍一偏就擦到。"] },
  { to: 580, name: "手腕、手", tag: "腕", top: ["bad", "顶边在手上。"], bottom: ["bad", "手腕、手：切掉一半手，手指像被剪了。要么整只手进来，要么切到上面去。"] },
  { to: 722, name: "大腿中段", top: ["bad", "顶边在大腿上。"], bottom: ["good", "大腿中段：两个关节之间，经典的七分身，紧但不残。"] },
  { to: 800, name: "膝盖", tag: "膝", top: ["bad", "顶边在膝盖上。"], bottom: ["bad", "膝盖：最常见的坏刀。人像被截了肢，往上到大腿中段，或往下到小腿。"] },
  { to: 915, name: "小腿中段", top: ["bad", "顶边在小腿上。"], bottom: ["ok", "小腿中段：比膝盖稳。离脚踝近了就别犹豫，干脆让脚进来。"] },
  { to: 992, name: "脚踝、脚", tag: "踝", top: ["bad", "顶边在脚上。"], bottom: ["bad", "脚踝：只差一点脚，人像飘着。往下让整双脚进来，脚下留一点地。"] },
  { to: 1e9, name: "脚下", top: ["bad", "顶边在脚下：人不在画里。"], bottom: ["good", "整个人都在，脚下留了一点地。完整，但还谈不上填满。"] },
];
export const zoneAt = (y) => BODY_ZONES.find((z) => y < z.to);

// ---------- 柠檬片：半径 1，圆心在原点；旁边一把叉子当比例尺 ----------
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const SEG = 10;
const vesicles = (() => {
  const r = rng(12);
  const out = [];
  for (let s = 0; s < SEG; s++) {
    const a0 = (s / SEG) * Math.PI * 2, span = (Math.PI * 2) / SEG;
    for (let i = 0; i < 30; i++) {
      const rad = 0.2 + Math.sqrt(r()) * 0.62;
      const half = span / 2 - 0.05 / rad - 0.03;
      if (half <= 0.02) continue;
      const a = a0 + span / 2 + (r() * 2 - 1) * half;
      out.push({ a, rad, len: 0.07 + r() * 0.07, wid: 0.018 + r() * 0.014, tone: r() });
    }
  }
  return out;
})();

export function drawLemon(g) {
  // 叉子
  g.fillStyle = C.white;
  g.save();
  g.translate(1.62, 0.05);
  g.rotate(-0.12);
  g.beginPath();
  g.roundRect(-0.07, -0.1, 0.14, 1.25, 0.07);
  g.fill();
  g.beginPath();
  g.moveTo(-0.17, -0.42);
  g.quadraticCurveTo(-0.17, -0.06, 0, -0.04);
  g.quadraticCurveTo(0.17, -0.06, 0.17, -0.42);
  g.lineTo(0.17, -0.42);
  g.fill();
  for (let i = 0; i < 4; i++) g.fillRect(-0.17 + i * 0.104, -0.95, 0.03, 0.62);
  g.restore();
  // 影子
  g.fillStyle = C.blueD;
  g.beginPath();
  g.arc(0.05, 0.06, 1.0, 0, Math.PI * 2);
  g.fill();
  // 皮、白瓤
  g.fillStyle = C.yellowD;
  g.beginPath();
  g.arc(0, 0, 1, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#FFF3C4";
  g.beginPath();
  g.arc(0, 0, 0.925, 0, Math.PI * 2);
  g.fill();
  // 瓣：两边各收一点，中间露出白色的瓣膜
  for (let s = 0; s < SEG; s++) {
    const a0 = (s / SEG) * Math.PI * 2, a1 = ((s + 1) / SEG) * Math.PI * 2;
    const ri = 0.13, ro = 0.86;
    g.beginPath();
    g.arc(0, 0, ro, a0 + 0.03 / ro + 0.012, a1 - 0.03 / ro - 0.012);
    g.arc(0, 0, ri, a1 - 0.03 / ri - 0.05, a0 + 0.03 / ri + 0.05, true);
    g.closePath();
    g.fillStyle = C.yellow;
    g.fill();
  }
  // 汁囊：一粒粒顺着半径的泪滴
  for (const v of vesicles) {
    g.save();
    g.rotate(v.a);
    g.translate(v.rad, 0);
    g.fillStyle = v.tone < 0.5 ? C.yellowL : "#FFE27A";
    g.beginPath();
    g.ellipse(0, 0, v.len, v.wid, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  // 两颗籽
  g.fillStyle = "#FFF8DD";
  for (const a of [0.9, 4.1]) {
    g.save();
    g.rotate(a);
    g.translate(0.3, 0);
    g.beginPath();
    g.ellipse(0, 0, 0.09, 0.04, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.fillStyle = "#FFF3C4";
  g.beginPath();
  g.arc(0, 0, 0.06, 0, Math.PI * 2);
  g.fill();
}
