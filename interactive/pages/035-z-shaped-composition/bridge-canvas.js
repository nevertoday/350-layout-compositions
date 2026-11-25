// 03 节深皇家钴蓝暗室：2 秒一瞥·对角视觉桥验真台
// 演示「无桥裸排 / 几何实心斜带 / 人物背影指向（无五官）/ 斜切明暗光束」四种手段，
// 如何决定视线在右上②之后是顺利回拉左下③，还是直接垂直坠落成「7」字跳角。

import { pixelRatio } from "../../lib/stage.js";

export const BRIDGE_MODES = {
  none: {
    id: "none",
    label: "无桥裸排",
    verdict: "跳角成「7」字 · 左下③被跨过",
    desc: "四个角落各自孤立。看完右上②后，顺着左→右阅读习惯回拉左下逆势太费力，眼球往往直接垂直掉去右下④，整段第三站白放了。",
    pullsBack: false,
  },
  band: {
    id: "band",
    label: "朱橘斜带桥",
    verdict: "强力回拉 · 稳定走通完整 Z",
    desc: "正如 035 原海报所做的：用一条鲜明的实心朱橘斜带直接焊连右上②与左下③，让几何连续性抵消逆向回拉的阻力。",
    pullsBack: true,
  },
  figure: {
    id: "figure",
    label: "剪影朝向桥",
    verdict: "视线追随 · 含蓄牵引左下③",
    desc: "不画粗线条，而是把人物背影、乐器斜角或产品朝向摆成「右上→左下」走势，借人类天生的朝向追随本能自然回拉。",
    pullsBack: true,
  },
  light: {
    id: "light",
    label: "明暗斜光桥",
    verdict: "影调阶梯 · 柔和导向左下③",
    desc: "用一条斜穿画面的聚光或渐变色带打亮斜对角，其余背景压暗，视线会顺着明度阶梯从右上轻巧滑进左下转折区。",
    pullsBack: true,
  },
};

export function createBridgeCanvas(canvas, getCfg) {
  const ctx = canvas.getContext("2d");
  let W = 680;
  let H = 360;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    W = Math.max(260, Math.round(rect.width));
    H = Math.max(200, Math.round(rect.height));
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render(t, _dt, { still }) {
    resize();
    const { mode, glance } = getCfg();
    const info = BRIDGE_MODES[mode] || BRIDGE_MODES.none;
    const compact = W < 440;

    // 深钴暗室背景
    ctx.fillStyle = "#081C52";
    ctx.fillRect(0, 0, W, H);

    // 柔和暗舱格网
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo((W / 6) * i, 0);
      ctx.lineTo((W / 6) * i, H);
      ctx.stroke();
    }
    for (let j = 1; j < 4; j++) {
      ctx.beginPath();
      ctx.moveTo(0, (H / 4) * j);
      ctx.lineTo(W, (H / 4) * j);
      ctx.stroke();
    }

    const p1 = { x: W * 0.16, y: H * 0.22, t: "① 入口" };
    const p2 = { x: W * 0.84, y: H * 0.22, t: "② 承接" };
    const p3 = { x: W * 0.16, y: H * 0.78, t: "③ 转折" };
    const p4 = { x: W * 0.84, y: H * 0.78, t: "④ 终点" };

    // 搭桥元素绘制
    if (mode === "band") {
      ctx.save();
      ctx.strokeStyle = "#FA4718";
      ctx.lineWidth = compact ? 18 : 26;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = still ? 0 : -t * 26;
      ctx.beginPath();
      ctx.moveTo(p2.x - 16, p2.y + 10);
      ctx.lineTo(p3.x + 16, p3.y - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (mode === "figure") {
      // 抽象背影与斜向乐器/指路杆（严格无五官）
      const mx = W * 0.5;
      const my = H * 0.52;
      const sc = Math.min(W, H) / 310;
      ctx.save();
      ctx.translate(mx, my);
      ctx.fillStyle = "rgba(251, 244, 232, 0.22)";
      ctx.beginPath();
      ctx.arc(sc * 44, -sc * 52, sc * 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sc * 18, -sc * 26);
      ctx.quadraticCurveTo(sc * 62, -sc * 22, sc * 66, sc * 58);
      ctx.lineTo(sc * 6, sc * 58);
      ctx.quadraticCurveTo(sc * 4, sc * 4, sc * 18, -sc * 26);
      ctx.closePath();
      ctx.fill();

      // 斜向乐器/指向束从右上指向左下③
      ctx.strokeStyle = "#FF683B";
      ctx.lineWidth = sc * 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sc * 30, -sc * 14);
      ctx.lineTo(-sc * 62, sc * 44);
      ctx.stroke();

      // 朝向波纹暗示走向左下
      ctx.strokeStyle = "rgba(255, 104, 59, 0.55)";
      ctx.lineWidth = 2;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(-sc * 62, sc * 44, sc * (14 + k * 12), Math.PI * 0.65, Math.PI * 1.15);
        ctx.stroke();
      }
      ctx.restore();
    } else if (mode === "light") {
      // 明暗斜切舞台光束
      const grad = ctx.createLinearGradient(p2.x, p2.y, p3.x, p3.y);
      grad.addColorStop(0, "rgba(255, 104, 59, 0.42)");
      grad.addColorStop(0.5, "rgba(251, 244, 232, 0.24)");
      grad.addColorStop(1, "rgba(94, 234, 212, 0.34)");
      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p2.x - 16, p2.y - 24);
      ctx.lineTo(p2.x + 28, p2.y + 18);
      ctx.lineTo(p3.x + 34, p3.y + 24);
      ctx.lineTo(p3.x - 24, p3.y - 26);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // 无桥状态：在中央标出空洞断层提示
      ctx.save();
      ctx.strokeStyle = "rgba(255, 133, 133, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 133, 133, 0.9)";
      ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("中段空白无牵引", W * 0.5, H * 0.5);
      ctx.restore();
    }

    // 四个站位圆点
    const r = compact ? 18 : 22;
    [p1, p2, p3, p4].forEach((p, idx) => {
      const skipped = !info.pullsBack && idx === 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = skipped ? "rgba(255,255,255,0.08)" : idx === 3 ? "#FA4718" : "#FBF4E8";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = skipped ? "rgba(255,133,133,0.65)" : idx === 3 ? "#FFFBF2" : "#FF683B";
      ctx.stroke();

      ctx.fillStyle = skipped ? "rgba(255,180,180,0.85)" : idx === 3 ? "#FFFFFF" : "#061848";
      ctx.font = `700 ${compact ? 11 : 12.5}px "JetBrains Mono", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), p.x, p.y + 0.5);

      ctx.fillStyle = skipped ? "rgba(255,165,165,0.9)" : "#FBF4E8";
      ctx.font = `600 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      const ly = idx < 2 ? p.y - r - 10 : p.y + r + 14;
      ctx.fillText(skipped ? "③ 被跳过" : p.t, p.x, ly);
      ctx.restore();
    });

    // 视线实际路径
    const route = info.pullsBack ? [p1, p2, p3, p4] : [p1, p2, p4];
    ctx.save();
    ctx.strokeStyle = info.pullsBack ? "#5EEAD4" : "#FF8585";
    ctx.lineWidth = 2.6;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    route.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);

    // 探针位置
    const segs = [];
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const l = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].y - route[i].y);
      segs.push(l);
      total += l;
    }
    const prog = still ? 0.62 : (t * 0.34) % 1;
    let rem = prog * total;
    let gx = route[0].x;
    let gy = route[0].y;
    for (let i = 0; i < segs.length; i++) {
      if (rem <= segs[i] || i === segs.length - 1) {
        const f = segs[i] > 0.001 ? rem / segs[i] : 0;
        gx = route[i].x + (route[i + 1].x - route[i].x) * f;
        gy = route[i].y + (route[i + 1].y - route[i].y) * f;
        break;
      }
      rem -= segs[i];
    }

    // 「2 秒一瞥」模式：加局部暗角聚光遮罩，还原人眼中央凹有限清晰视野！
    if (glance) {
      const vg = ctx.createRadialGradient(gx, gy, Math.min(W, H) * 0.12, gx, gy, Math.max(W, H) * 0.56);
      vg.addColorStop(0, "rgba(6, 24, 72, 0)");
      vg.addColorStop(0.55, "rgba(6, 24, 72, 0.52)");
      vg.addColorStop(1, "rgba(4, 15, 48, 0.84)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    // 亮眼动探针
    ctx.beginPath();
    ctx.arc(gx, gy, 11, 0, Math.PI * 2);
    ctx.fillStyle = info.pullsBack ? "rgba(94, 234, 212, 0.25)" : "rgba(255, 133, 133, 0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = info.pullsBack ? "#5EEAD4" : "#FF8585";
    ctx.fill();
    ctx.restore();
  }

  return { render };
}
