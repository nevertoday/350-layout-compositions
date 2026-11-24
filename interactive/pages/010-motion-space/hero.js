import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SUBJECTS, PRESETS, clamp, idealU, idealLead, sweetRange, evaluate } from "./model.js";

const $ = (id) => document.getElementById(id);

const C = {
  orange: "#EB540F",
  orangeSoft: "#F37939",
  cream: "#F3EDE2",
  creamDark: "#E6DDCE",
  navy: "#0B1D36",
  navyMid: "#173154",
  danger: "#C92412",
  white: "#FAF7F2",
};

// 仅在 010 海报配色内绘制四种纯几何运动剪影（绝不画五官细节）
function drawRunner(ctx, x, y, sc, phase, dir, speed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * sc, sc);

  const lean = 0.34 + speed * 0.28; // 海报同款凌厉前倾角
  const amp = 0.55 + speed * 0.45;
  const s = Math.sin(phase);
  const bob = -Math.abs(s) * (3 + speed * 5);

  ctx.translate(0, bob);

  const hipX = 0;
  const hipY = -31;
  const shX = hipX + Math.sin(lean) * 34;
  const shY = hipY - Math.cos(lean) * 34;

  // 双腿采用宽幅剪刀步态：确保任意瞬间都有清晰的迈步跨度与后蹬折叠
  const leg1 = (0.15 + s * 0.82 * amp);
  const leg2 = (0.15 - s * 0.82 * amp);

  const drawLeg = (thighA, color, isBack) => {
    const kneeX = hipX + Math.sin(thighA) * 24;
    const kneeY = hipY + Math.cos(thighA) * 24;
    // 抬腿向前时小腿自然下垂微收，后蹬时小腿大角度后折（标志性海报折线）
    const bend = thighA < 0 ? 1.15 : 0.42;
    const shinA = thighA - bend;
    const footX = kneeX + Math.sin(shinA) * 27;
    const footY = kneeY + Math.cos(shinA) * 27;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(hipX - (isBack ? 2 : 5), hipY - 3);
    ctx.lineTo(hipX + (isBack ? 5 : 8), hipY + 3);
    ctx.lineTo(kneeX + 6, kneeY + 2);
    ctx.lineTo(footX, footY);
    ctx.lineTo(kneeX - 5, kneeY - 3);
    ctx.closePath();
    ctx.fill();
  };

  // 后腿（海报信号橙色）
  drawLeg(leg2, C.orange, true);

  // 后摆臂（深蓝次色调，明显向后甩出）
  const armBack = -0.35 - s * 0.82 * amp;
  const bElbX = shX + Math.sin(armBack) * 18;
  const bElbY = shY + Math.cos(armBack) * 18;
  const bHandX = bElbX + Math.sin(armBack + 1.15) * 16;
  const bHandY = bElbY + Math.cos(armBack + 1.15) * 16;

  ctx.fillStyle = C.navyMid;
  ctx.beginPath();
  ctx.moveTo(shX - 5, shY - 2);
  ctx.lineTo(bElbX - 4, bElbY - 3);
  ctx.lineTo(bHandX, bHandY);
  ctx.lineTo(bElbX + 4, bElbY + 4);
  ctx.lineTo(shX + 3, shY + 6);
  ctx.closePath();
  ctx.fill();

  // 前腿（海报深海蓝）
  drawLeg(leg1, C.navy, false);

  // 锐角几何躯干
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.moveTo(shX - 11, shY - 3);
  ctx.lineTo(shX + 10, shY + 3);
  ctx.lineTo(hipX + 7, hipY + 5);
  ctx.lineTo(hipX - 7, hipY - 1);
  ctx.closePath();
  ctx.fill();

  // 前摆臂（高抬前冲，与后腿同相位）
  const armFront = 0.28 + s * 0.82 * amp;
  const fElbX = shX + Math.sin(armFront) * 18;
  const fElbY = shY + Math.cos(armFront) * 18;
  const fHandX = fElbX + Math.sin(armFront + 1.48) * 19;
  const fHandY = fElbY + Math.cos(armFront + 1.48) * 19;

  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.moveTo(shX - 2, shY - 2);
  ctx.lineTo(shX + 7, shY + 4);
  ctx.lineTo(fElbX + 4, fElbY + 4);
  ctx.lineTo(fHandX, fHandY);
  ctx.lineTo(fElbX - 4, fElbY - 3);
  ctx.closePath();
  ctx.fill();

  // 纯圆剪影头（无五官）
  const headX = shX + Math.sin(lean + 0.12) * 15;
  const headY = shY - Math.cos(lean + 0.12) * 15;
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.arc(headX, headY, 9.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCyclist(ctx, x, y, sc, phase, dir, speed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * sc, sc);

  const wr = 18;
  const rwX = -27, fwX = 27, wy = -wr - 1;

  // 双轮
  for (const wx of [rwX, fwX]) {
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.stroke();

    // 旋转辐条
    ctx.strokeStyle = "rgba(11,29,54,0.35)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const a = phase * 1.4 + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(wx - Math.cos(a) * (wr - 2), wy - Math.sin(a) * (wr - 2));
      ctx.lineTo(wx + Math.cos(a) * (wr - 2), wy + Math.sin(a) * (wr - 2));
      ctx.stroke();
    }
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(wx, wy, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 车架（深蓝 + 橙色上管）
  const bbX = -2, bbY = wy + 3;
  const seatX = -12, seatY = wy - 22;
  const headX = 18, headY = wy - 20;

  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 3.4;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(rwX, wy);
  ctx.lineTo(bbX, bbY);
  ctx.lineTo(headX, headY);
  ctx.lineTo(fwX, wy);
  ctx.moveTo(rwX, wy);
  ctx.lineTo(seatX, seatY);
  ctx.lineTo(bbX, bbY);
  ctx.stroke();

  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(seatX, seatY);
  ctx.lineTo(headX, headY);
  ctx.stroke();

  // 车把
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(headX + 6, headY - 4);
  ctx.lineTo(headX + 10, headY + 1);
  ctx.stroke();

  // 骑行者几何剪影（速度越快越伏低）
  const tuck = speed * 7;
  const hipX = seatX - 3, hipY = seatY - 7;
  const shX = 12, shY = seatY - 21 + tuck;

  // 踩踏腿
  const pedX = bbX + Math.cos(phase * 1.4) * 9;
  const pedY = bbY + Math.sin(phase * 1.4) * 9;
  const kneeX = (hipX + pedX) * 0.5 + 8;
  const kneeY = (hipY + pedY) * 0.5 - 2;

  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(hipX + 4, bbY - 6);
  ctx.lineTo(bbX - Math.cos(phase * 1.4) * 9, bbY - Math.sin(phase * 1.4) * 9);
  ctx.stroke();

  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(pedX, pedY);
  ctx.stroke();

  // 躯干与手臂
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.moveTo(hipX - 6, hipY + 3);
  ctx.lineTo(hipX + 5, hipY - 5);
  ctx.lineTo(shX + 4, shY - 5);
  ctx.lineTo(shX - 3, shY + 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(shX, shY + 1);
  ctx.lineTo(headX + 7, headY - 2);
  ctx.stroke();

  // 气动头盔剪影（无五官）
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.ellipse(shX + 9, shY - 6, 10, 7.2, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCar(ctx, x, y, sc, phase, dir, speed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * sc, sc);

  const pitch = -speed * 0.025;
  ctx.rotate(pitch);

  // 底部阴影
  ctx.fillStyle = "rgba(11,29,54,0.18)";
  ctx.fillRect(-52, -4, 106, 4);

  // 车身凌厉几何轮廓
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.moveTo(-52, -10);
  ctx.lineTo(-50, -24);
  ctx.lineTo(-42, -26);
  ctx.lineTo(-24, -36); // 车顶后缘
  ctx.lineTo(6, -36);   // 车顶前缘
  ctx.lineTo(28, -23);  // 挡风玻璃
  ctx.lineTo(54, -17);  // 低趴车头
  ctx.lineTo(56, -9);
  ctx.lineTo(-52, -9);
  ctx.closePath();
  ctx.fill();

  // 尾翼（橙色点缀）
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.moveTo(-53, -24);
  ctx.lineTo(-58, -32);
  ctx.lineTo(-47, -31);
  ctx.lineTo(-45, -24);
  ctx.closePath();
  ctx.fill();

  // 车窗负形
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.moveTo(-21, -32);
  ctx.lineTo(4, -32);
  ctx.lineTo(21, -23);
  ctx.lineTo(-27, -23);
  ctx.closePath();
  ctx.fill();

  // 车身橙色速度腰线
  ctx.fillStyle = C.orange;
  ctx.fillRect(-44, -18, 84, 3.2);

  // 车灯高光
  ctx.fillStyle = C.cream;
  ctx.fillRect(46, -16, 7, 2.5);

  // 双轮
  for (const wx of [-31, 31]) {
    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.arc(wx, -11, 11.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.navy;
    ctx.beginPath();
    ctx.arc(wx, -11, 9.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = phase * 2.2 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(wx, -11);
      ctx.lineTo(wx + Math.cos(a) * 6.5, -11 + Math.sin(a) * 6.5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawBird(ctx, x, y, sc, phase, dir, speed) {
  ctx.save();
  ctx.translate(x, y - 56 * sc);
  ctx.scale(dir * sc, sc);

  const flap = Math.sin(phase * 1.15) * (1 - speed * 0.42);
  const bob = Math.cos(phase * 1.15) * 4;
  ctx.translate(0, bob);
  ctx.rotate(speed * 0.14);

  // 后翼（橙色）
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(-28, -22 - flap * 18);
  ctx.lineTo(4, -8);
  ctx.closePath();
  ctx.fill();

  // 身体与尾羽（深蓝）
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.moveTo(-42, 4);
  ctx.lineTo(-16, -5);
  ctx.lineTo(18, -7);
  ctx.lineTo(38, -2);
  ctx.lineTo(16, 5);
  ctx.lineTo(-20, 7);
  ctx.lineTo(-40, 12);
  ctx.lineTo(-30, 5);
  ctx.closePath();
  ctx.fill();

  // 主翼（深蓝大掠角）
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.moveTo(-8, -1);
  ctx.lineTo(-22, -26 + flap * 26);
  ctx.lineTo(14, -4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function initHero() {
  const vf = $("viewfinder");
  const canvas = $("hero-canvas");
  const ctx = canvas.getContext("2d");
  const handle = $("hero-handle");
  const speedInput = $("hero-speed");
  const speedOut = $("hero-speed-out");
  const hudSub = $("hud-sub");
  const hudSpeed = $("hud-speed");
  const btnDir = $("btn-dir");
  const dirVal = $("dir-val");
  const btnPlay = $("btn-play");
  const readoutBox = $("hero-readout");
  const roLead = $("ro-lead");
  const roTrail = $("ro-trail");
  const roTag = $("ro-tag");
  const roText = $("ro-text");
  const roNote = $("ro-note");
  const titleTrack = $("title-track");

  const listeners = new Set();

  const state = {
    subject: "runner",
    dir: 1,
    speed: 0.62,
    u: reducedMotion.matches ? idealU(1, 0.62, "runner") : 0.44,
    targetU: idealU(1, 0.62, "runner"),
    introActive: !reducedMotion.matches,
    paused: false,
    dragging: false,
    phase: 1.5,
    worldX: 0,
  };
  let lastSyncedLead = -1;

  let W = 640, H = 400, dpr = 1;

  function resize() {
    const r = vf.getBoundingClientRect();
    W = Math.max(240, Math.round(r.width));
    H = Math.max(180, Math.round(r.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  // 海报风格的微斜跑道线 y(x)：往运动方向微微抬升
  function trackY(x) {
    const base = H * 0.77;
    const tilt = H * 0.055;
    const nx = x / W - 0.5;
    return base - state.dir * nx * tilt;
  }

  function syncHandle() {
    const sub = SUBJECTS[state.subject];
    const cx = state.u * W;
    const cy = state.subject === "bird" ? H * 0.43 : trackY(cx) - H * 0.14;
    const bw = Math.max(58, sub.halfW * 2 * W);
    const bh = Math.max(66, H * 0.34);
    handle.style.left = `${cx}px`;
    handle.style.top = `${cy}px`;
    handle.style.width = `${bw}px`;
    handle.style.height = `${bh}px`;
    handle.setAttribute("aria-valuenow", String(Math.round(state.u * 100)));
  }

  function syncUI() {
    const ev = evaluate(state);
    const sub = SUBJECTS[state.subject];
    speedOut.textContent = `${ev.kmh} ${sub.unit} · ${ev.pace}`;
    hudSub.textContent = sub.en;
    hudSpeed.textContent = `${ev.kmh} ${sub.unit}`;
    dirVal.textContent = state.dir > 0 ? "向右 →" : "← 向左";
    btnPlay.textContent = state.paused ? "继续" : "暂停";
    btnPlay.setAttribute("aria-pressed", String(state.paused));

    roLead.textContent = `${Math.round(ev.lead * 100)}%`;
    roTrail.textContent = `${Math.round(ev.trail * 100)}%`;
    roTag.textContent = ev.tag;
    roText.textContent = ev.text;
    roNote.textContent = ev.note;
    readoutBox.dataset.tone = ev.tone;

    // 标题示范联动：方向和前导箭头长度随主玩具同步变化
    if (titleTrack) {
      titleTrack.dataset.dir = String(state.dir);
      titleTrack.style.setProperty("--lead-scale", String((0.55 + state.speed * 0.65).toFixed(2)));
    }

    syncHandle();
    for (const fn of listeners) fn(state, ev);
  }

  function drawScene(t, dt, { still }) {
    if (!W || !H) resize();
    const stepDt = still ? 0 : dt;

    // 开场平滑落位：0.0s 到 1.0s 间柔和滑到速度匹配点，同时让右侧读数与画布完全同步
    if (state.introActive && !state.dragging) {
      if (still) {
        state.u = state.targetU;
        state.introActive = false;
        syncUI();
      } else {
        const diff = state.targetU - state.u;
        state.u += diff * Math.min(1, stepDt * 4.5);
        if (Math.abs(diff) < 0.002) {
          state.u = state.targetU;
          state.introActive = false;
        }
        const curLeadPct = Math.round(evaluate(state).lead * 100);
        if (curLeadPct !== lastSyncedLead || !state.introActive) {
          lastSyncedLead = curLeadPct;
          syncUI();
        } else {
          syncHandle();
        }
      }
    }

    if (!state.paused && !still) {
      const rate = 2.2 + state.speed * 11.5;
      state.phase += stepDt * rate;
      state.worldX += stepDt * (45 + state.speed * 440) * state.dir;
    }

    const ev = evaluate(state);
    const sub = SUBJECTS[state.subject];
    const subX = state.u * W;
    const groundY = trackY(subX);
    const frontX = (state.dir > 0 ? state.u + sub.halfW : state.u - sub.halfW) * W;
    const backX = (state.dir > 0 ? state.u - sub.halfW : state.u + sub.halfW) * W;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 米白画布底（前方空间主色，取自 010 原海报）
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, H);

    // 2. 海报标志性的橙色斜切动势色块（紧随主体身后，角度随速度变化）
    const diagX = subX + state.dir * W * 0.02;
    const slant = W * (0.24 + state.speed * 0.14);
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    if (state.dir > 0) {
      ctx.moveTo(0, 0);
      ctx.lineTo(clamp(diagX + slant, W * 0.12, W * 0.94), 0);
      ctx.lineTo(clamp(diagX - slant * 0.65, 0, W * 0.85), H * 0.85);
      ctx.lineTo(0, H * 0.85);
    } else {
      ctx.moveTo(W, 0);
      ctx.lineTo(clamp(diagX - slant, W * 0.06, W * 0.88), 0);
      ctx.lineTo(clamp(diagX + slant * 0.65, W * 0.15, W), H * 0.85);
      ctx.lineTo(W, H * 0.85);
    }
    ctx.closePath();
    ctx.fill();

    // 3. 背景视差标杆（证明摄影机正在跟随移动！）
    const postSpacing = Math.max(76, W * 0.15);
    const offset = ((-state.worldX % postSpacing) + postSpacing) % postSpacing;
    ctx.save();
    for (let px = offset - postSpacing; px < W + postSpacing; px += postSpacing) {
      const py = trackY(px);
      // 远处竖向测距细线
      ctx.strokeStyle = "rgba(11,29,54,0.11)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, H * 0.14);
      ctx.lineTo(px, py);
      ctx.stroke();

      // 地面里程桩
      ctx.fillStyle = "rgba(11,29,54,0.22)";
      ctx.fillRect(px - 1.5, py - 9, 3, 9);
    }
    ctx.restore();

    // 4. 海报风格的斜向粉笔/速度拖影条（从主体身后向后拉出）
    if (state.speed > 0.05) {
      const streakCount = Math.round(5 + state.speed * 9);
      const streakMaxLen = W * (0.12 + state.speed * 0.42);
      const baseStreakY = state.subject === "bird" ? H * 0.42 : groundY - H * 0.14;
      ctx.save();
      for (let i = 0; i < streakCount; i++) {
        const frac = (i + 0.5) / streakCount;
        const sy = baseStreakY + (frac - 0.5) * H * 0.34;
        const len = streakMaxLen * (0.55 + 0.45 * Math.sin(i * 2.3 + 0.4));
        const pulse = ((state.worldX * 0.012 + i * 0.37) % 1 + 1) % 1;
        const startX = backX - state.dir * (4 + pulse * 18);
        const endX = startX - state.dir * len;
        const dy = state.dir * len * 0.11;

        const grad = ctx.createLinearGradient(startX, sy, endX, sy + dy);
        grad.addColorStop(0, "rgba(250,247,242,0.78)");
        grad.addColorStop(0.5, "rgba(250,247,242,0.34)");
        grad.addColorStop(1, "rgba(250,247,242,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = i % 3 === 0 ? 4.5 : 2;
        ctx.beginPath();
        ctx.moveTo(startX, sy);
        ctx.lineTo(endX, sy + dy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 底部深海蓝斜跑道带（直取海报底层色块）
    ctx.fillStyle = C.navy;
    ctx.beginPath();
    ctx.moveTo(0, trackY(0));
    ctx.lineTo(W, trackY(W));
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 跑道表面高速滑动刻线
    const tickStep = 44;
    const tickOff = ((-state.worldX * 1.15 % tickStep) + tickStep) % tickStep;
    ctx.strokeStyle = "rgba(243,237,226,0.22)";
    ctx.lineWidth = 1.5;
    for (let tx = tickOff - tickStep; tx < W + tickStep; tx += tickStep) {
      const ty = trackY(tx);
      ctx.beginPath();
      ctx.moveTo(tx, ty + 4);
      ctx.lineTo(tx - state.dir * (8 + state.speed * 16), ty + 11);
      ctx.stroke();
    }

    // 海报同款跑道双细光带
    ctx.strokeStyle = "rgba(235,84,15,0.65)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, trackY(W * 0.18) + 18);
    ctx.lineTo(W * 0.72, trackY(W * 0.72) + 18);
    ctx.stroke();

    // 6. 推荐速度舒适区标尺（在深蓝跑道带底部显示，随速度自动移动！）
    const [rMin, rMax] = sweetRange(state.dir, state.speed, state.subject);
    const barY = H - 22;
    ctx.fillStyle = "rgba(243,237,226,0.12)";
    ctx.fillRect(W * 0.06, barY, W * 0.88, 6);

    const sweetX = rMin * W;
    const sweetW = Math.max(12, (rMax - rMin) * W);
    const inSweet = state.u >= rMin && state.u <= rMax;
    ctx.fillStyle = inSweet ? C.orange : "rgba(235,84,15,0.52)";
    ctx.fillRect(sweetX, barY - 1, sweetW, 8);

    // 舒适区标签
    ctx.font = `600 10px "Inter", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "rgba(243,237,226,0.78)";
    ctx.textAlign = "center";
    ctx.fillText("当前速度推荐位置", clamp(sweetX + sweetW / 2, 58, W - 58), barY - 6);

    // 当前主体在标尺上的刻度针
    ctx.fillStyle = C.white;
    ctx.fillRect(subX - 1.5, barY - 4, 3, 14);

    // 7. 绘制主角运动剪影
    const sc = clamp(Math.min(W / 520, H / 320), 0.65, 1.38);
    if (state.subject === "runner") drawRunner(ctx, subX, groundY + 2, sc * 1.35, state.phase, state.dir, state.speed);
    else if (state.subject === "cyclist") drawCyclist(ctx, subX, groundY + 2, sc * 1.28, state.phase, state.dir, state.speed);
    else if (state.subject === "car") drawCar(ctx, subX, groundY + 2, sc * 1.24, state.phase, state.dir, state.speed);
    else drawBird(ctx, subX, groundY, sc * 1.25, state.phase, state.dir, state.speed);

    // 8. 海报标志性「前方空间 LEAD ROOM」虚线 + 橙色水平箭头
    const isWall = ev.kind === "wall";
    const arrowColor = isWall ? C.danger : C.orange;
    const clampedFrontX = clamp(frontX, 10, W - 10);

    // 竖向虚线界线
    ctx.save();
    ctx.strokeStyle = isWall ? C.danger : "rgba(11,29,54,0.45)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(clampedFrontX, H * 0.14);
    ctx.lineTo(clampedFrontX, trackY(clampedFrontX));
    ctx.stroke();
    ctx.restore();

    // 水平箭头指向前进方向边缘
    const edgeX = state.dir > 0 ? W - 14 : 14;
    const arrowY = H * 0.36;
    const span = Math.abs(edgeX - clampedFrontX);

    if (span > 22) {
      ctx.strokeStyle = arrowColor;
      ctx.fillStyle = arrowColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(clampedFrontX, arrowY);
      ctx.lineTo(edgeX - state.dir * 8, arrowY);
      ctx.stroke();

      // 实心三角箭头（同海报）
      ctx.beginPath();
      ctx.moveTo(edgeX, arrowY);
      ctx.lineTo(edgeX - state.dir * 10, arrowY - 5.5);
      ctx.lineTo(edgeX - state.dir * 10, arrowY + 5.5);
      ctx.closePath();
      ctx.fill();

      // 箭头下方标注（空间足够宽才写全）
      if (span > 84) {
        const midX = (clampedFrontX + edgeX) / 2;
        ctx.textAlign = "center";
        ctx.fillStyle = arrowColor;
        ctx.font = `700 ${W < 420 ? 12 : 14}px "Noto Sans SC", sans-serif`;
        ctx.fillText(`前方空间 ${Math.round(ev.lead * 100)}%`, midX, arrowY + 22);
        ctx.font = `700 10px "Inter", sans-serif`;
        ctx.fillStyle = "rgba(11,29,54,0.6)";
        ctx.fillText("LEAD ROOM", midX, arrowY + 36);
      }
    }

    // 撞墙警报竖条
    if (isWall) {
      const wx = state.dir > 0 ? W - 6 : 0;
      ctx.fillStyle = C.danger;
      ctx.fillRect(wx, 0, 6, trackY(wx));
    }

    // 9. 取景器四角直角框
    const pad = 10, arm = 14;
    ctx.strokeStyle = "rgba(11,29,54,0.45)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    // TL
    ctx.moveTo(pad, pad + arm); ctx.lineTo(pad, pad); ctx.lineTo(pad + arm, pad);
    // TR
    ctx.moveTo(W - pad - arm, pad); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad, pad + arm);
    ctx.stroke();

    ctx.strokeStyle = "rgba(243,237,226,0.45)";
    ctx.beginPath();
    // BL
    ctx.moveTo(pad, H - pad - arm); ctx.lineTo(pad, H - pad); ctx.lineTo(pad + arm, H - pad);
    // BR
    ctx.moveTo(W - pad - arm, H - pad); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad, H - pad - arm);
    ctx.stroke();

    ctx.restore();
  }

  resize();
  const runnerLoop = loop(vf, drawScene);

  function setU(nextU, snap = false) {
    state.introActive = false;
    let u = clamp(nextU, 0.1, 0.9);
    if (snap && state.speed > 0.1) {
      const target = idealU(state.dir, state.speed, state.subject);
      if (Math.abs(u - target) < 0.04) u = target;
    }
    state.u = u;
    syncUI();
    runnerLoop.draw();
  }

  // 把手拖动（鼠标 + 触摸横向拖动，不阻塞页面上下滚动）
  let dragPointer = null;
  let startX = 0, startY = 0, startU = 0, lockedAxis = null;

  handle.addEventListener("pointerdown", (e) => {
    state.introActive = false;
    dragPointer = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startU = state.u;
    lockedAxis = e.pointerType === "mouse" ? "x" : null;
    state.dragging = true;
    vf.classList.add("is-dragging");
    try { handle.setPointerCapture(e.pointerId); } catch {}
  });

  handle.addEventListener("pointermove", (e) => {
    if (e.pointerId !== dragPointer) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!lockedAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (lockedAxis === "y") return;
    const r = vf.getBoundingClientRect();
    setU(startU + dx / Math.max(1, r.width), false);
  });

  const endDrag = (e) => {
    if (e.pointerId !== dragPointer) return;
    dragPointer = null;
    state.dragging = false;
    vf.classList.remove("is-dragging");
    if (lockedAxis !== "y") setU(state.u, true);
    lockedAxis = null;
  };
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
  handle.addEventListener("click", (e) => e.stopPropagation());

  // 兼容 perf.mjs 直接派发的 touch 事件
  let touchStartX = 0, touchStartU = 0, touchActive = false;
  handle.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    state.introActive = false;
    touchActive = true;
    state.dragging = true;
    touchStartX = e.touches[0].clientX;
    touchStartU = state.u;
  }, { passive: true });
  handle.addEventListener("touchmove", (e) => {
    if (!touchActive || !e.touches.length) return;
    const dx = e.touches[0].clientX - touchStartX;
    const r = vf.getBoundingClientRect();
    setU(touchStartU + dx / Math.max(1, r.width), false);
  }, { passive: true });
  handle.addEventListener("touchend", () => {
    if (!touchActive) return;
    touchActive = false;
    state.dragging = false;
    setU(state.u, true);
  }, { passive: true });

  // 点击画框任意位置也能定位主体
  vf.addEventListener("click", (e) => {
    const r = vf.getBoundingClientRect();
    setU((e.clientX - r.left) / Math.max(1, r.width), true);
  });

  // 键盘操作把手
  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.02 : 0.05;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setU(state.u - step, false);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setU(state.u + step, false);
    } else if (e.key === "Home") {
      e.preventDefault();
      setU(0.15, false);
    } else if (e.key === "End") {
      e.preventDefault();
      setU(0.85, false);
    }
  });

  // 切换运动主体
  const subBtns = [...document.querySelectorAll("[data-subject]")];
  subBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.subject;
      if (!SUBJECTS[k]) return;
      state.subject = k;
      state.speed = SUBJECTS[k].defaultSpeed;
      speedInput.value = String(Math.round(state.speed * 100));
      state.u = idealU(state.dir, state.speed, state.subject);
      state.introActive = false;
      subBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      syncUI();
      runnerLoop.draw();
    });
  });

  // 速度滑块
  speedInput.addEventListener("input", () => {
    state.speed = Number(speedInput.value) / 100;
    state.introActive = false;
    syncUI();
    runnerLoop.draw();
  });

  // 方向切换（同时自动镜像位置？不，保留原位置让用户瞬间感受到“突然调头后空间反了”的冲击！）
  btnDir.addEventListener("click", () => {
    state.dir = -state.dir;
    state.introActive = false;
    syncUI();
    runnerLoop.draw();
  });

  // 暂停/继续
  btnPlay.addEventListener("click", () => {
    state.paused = !state.paused;
    syncUI();
    runnerLoop.draw();
  });

  // 四种预设摆法
  const presetBtns = [...document.querySelectorAll("[data-preset]")];
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const fn = PRESETS[btn.dataset.preset];
      if (!fn) return;
      const patch = fn(state);
      if (patch.speed != null) {
        state.speed = patch.speed;
        speedInput.value = String(Math.round(state.speed * 100));
      }
      if (patch.u != null) state.u = patch.u;
      state.introActive = false;
      syncUI();
      runnerLoop.draw();
    });
  });

  const ro = new ResizeObserver(() => {
    resize();
    syncHandle();
    runnerLoop.draw();
  });
  ro.observe(vf);

  syncUI();
  runnerLoop.draw();

  return {
    getState: () => state,
    onChange: (fn) => listeners.add(fn),
  };
}
