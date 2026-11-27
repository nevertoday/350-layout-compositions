// 092 封闭式构图 — 开场主角画布：「四门合围·藏室封界仪」
// 2D Canvas（零 WebGL 依赖，软件渲染与慢手机稳跑 60fps），严格从 model.js 单真源绘制。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, SCENARIOS, GATE_NAMES, GATE_ORDER, audit, clamp } from "./model.js";

export function mountHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let size = 540;
  let dpr = pixelRatio(2);
  let intro = reducedMotion.matches ? 1 : 0.25;
  let dirty = true;

  // 视线粒子系统（按 Space 或点「放飞视线」触发物理碰撞 / 破口泄漏模拟）
  let particles = [];
  let simTime = 0;
  let simActive = false;
  let hoverTarget = null; // { kind: 'gate'|'corner'|'intruder', id }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const s = Math.max(200, Math.round(Math.min(rect.width || 500, rect.height || rect.width || 500)));
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(s * dpr) || canvas.height !== Math.round(s * dpr)) {
      size = s;
      canvas.width = Math.round(s * dpr);
      canvas.height = Math.round(s * dpr);
      dirty = true;
    }
  }

  function spawnGazeFlight() {
    const { g } = audit(state);
    particles = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.19;
      const startR = 0.44;
      const px = 0.5 + Math.cos(angle) * startR;
      const py = 0.5 + Math.sin(angle) * startR;
      // 初速度带有轻微斜向切线，让粒子真实撞墙、被斜壁折返或从缺口冲出
      const inward = state.inwardBevels ? 0.26 : -0.18;
      const tangent = (i % 2 === 0 ? 1 : -1) * 0.14;
      const ux = -Math.cos(angle);
      const uy = -Math.sin(angle);
      const tx = -uy;
      const ty = ux;
      particles.push({
        x: px,
        y: py,
        vx: ux * inward + tx * tangent,
        vy: uy * inward + ty * tangent,
        trail: [{ x: px, y: py }],
        escaped: false,
        settled: false,
        seed: i,
        wallHit: 0,
      });
    }
    simTime = 0;
    simActive = !reducedMotion.matches;
    if (reducedMotion.matches) {
      // 减少动态效果下直接步进 35 步呈现静态轨迹验真
      for (let k = 0; k < 35; k++) stepParticles(0.055, g);
    }
    dirty = true;
    ctrl.draw();
  }

  function stepParticles(dt, g) {
    const margin = g.innerMin + 0.015;
    const minB = margin;
    const maxB = 1 - margin;
    const coreCatchR = Math.max(0.05, g.coreCircleR + 0.03);
    const breachLo = 0.5 - g.breachHalf;
    const breachHi = 0.5 + g.breachHalf;
    const isTondo = state.form === "tondo";
    const tondoR = 0.5 - g.wallT - 0.01;

    let anyMoving = false;
    for (const p of particles) {
      if (p.escaped) {
        p.x += p.vx * dt * 1.1;
        p.y += p.vy * dt * 1.1;
        if (p.x > -0.05 && p.x < 1.05 && p.y > -0.05 && p.y < 1.05) {
          anyMoving = true;
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 18) p.trail.shift();
        }
        continue;
      }

      const dx = 0.5 - p.x;
      const dy = 0.5 - p.y;
      const dist = Math.hypot(dx, dy) || 0.001;

      // 斜切引导力：向内收束把粒子引回中心；外散则拉向四角
      if (state.inwardBevels) {
        const pull = g.closedCount === 4 ? 0.42 : 0.14;
        p.vx += (dx / dist) * pull * dt;
        p.vy += (dy / dist) * pull * dt;
      } else {
        const push = 0.36;
        p.vx -= (dx / dist) * push * dt;
        p.vy -= (dy / dist) * push * dt;
      }

      // 闯边杂块在右侧制造偏心引力
      if (state.strayIntruder) {
        const ix = g.intruder.x + g.intruder.w * 0.4 - p.x;
        const iy = g.intruder.y + g.intruder.h * 0.5 - p.y;
        const id = Math.hypot(ix, iy) || 0.01;
        if (id < 0.34) {
          p.vx += (ix / id) * 0.38 * dt;
          p.vy += (iy / id) * 0.38 * dt;
        }
      }

      // 阻尼
      p.vx *= Math.pow(0.58, dt);
      p.vy *= Math.pow(0.58, dt);

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // 边界碰撞检测：封门折返，开门外逃！
      if (isTondo) {
        const rNow = Math.hypot(p.x - 0.5, p.y - 0.5);
        if (rNow > tondoR) {
          const ang = Math.atan2(p.y - 0.5, p.x - 0.5);
          // 判断落在哪个方向扇区
          const gate =
            ang >= -Math.PI * 0.75 && ang < -Math.PI * 0.25 ? "n" :
            ang >= -Math.PI * 0.25 && ang < Math.PI * 0.25 ? "e" :
            ang >= Math.PI * 0.25 && ang < Math.PI * 0.75 ? "s" : "w";
          if (!state.gates[gate]) {
            p.escaped = true;
            p.vx = Math.cos(ang) * 0.58;
            p.vy = Math.sin(ang) * 0.58;
          } else {
            const nx = (p.x - 0.5) / rNow;
            const ny = (p.y - 0.5) / rNow;
            p.x = 0.5 + nx * tondoR;
            p.y = 0.5 + ny * tondoR;
            const dot = p.vx * nx + p.vy * ny;
            if (dot > 0) {
              p.vx -= 1.8 * dot * nx;
              p.vy -= 1.8 * dot * ny;
            }
            p.wallHit = 1;
          }
        }
      } else {
        if (p.y < minB) {
          if (!state.gates.n && p.x > breachLo && p.x < breachHi) {
            p.escaped = true;
            p.vy = -0.58;
          } else {
            p.y = minB;
            p.vy = Math.abs(p.vy) * 0.85 + (state.inwardBevels ? 0.1 : 0);
            p.wallHit = 1;
          }
        } else if (p.y > maxB) {
          if (!state.gates.s && p.x > breachLo && p.x < breachHi) {
            p.escaped = true;
            p.vy = 0.58;
          } else {
            p.y = maxB;
            p.vy = -Math.abs(p.vy) * 0.85 - (state.inwardBevels ? 0.1 : 0);
            p.wallHit = 1;
          }
        }
        if (p.x < minB) {
          if (!state.gates.w && p.y > breachLo && p.y < breachHi) {
            p.escaped = true;
            p.vx = -0.58;
          } else {
            p.x = minB;
            p.vx = Math.abs(p.vx) * 0.85 + (state.inwardBevels ? 0.1 : 0);
            p.wallHit = 1;
          }
        } else if (p.x > maxB) {
          if (!state.gates.e && p.y > breachLo && p.y < breachHi) {
            p.escaped = true;
            p.vx = 0.58;
          } else {
            p.x = maxB;
            p.vx = -Math.abs(p.vx) * 0.85 - (state.inwardBevels ? 0.1 : 0);
            p.wallHit = 1;
          }
        }
      }

      if (p.wallHit > 0) p.wallHit = Math.max(0, p.wallHit - dt * 2.5);

      const d2 = Math.hypot(0.5 - p.x, 0.5 - p.y);
      if (state.inwardBevels && g.closedCount === 4 && !state.strayIntruder && d2 < coreCatchR) {
        p.settled = true;
        // 绕核微巡
        const ang = Math.atan2(p.y - 0.5, p.x - 0.5) + dt * 1.4;
        const orb = coreCatchR * 0.92;
        p.x = 0.5 + Math.cos(ang) * orb;
        p.y = 0.5 + Math.sin(ang) * orb;
      }

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 18) p.trail.shift();
      anyMoving = true;
    }

    simTime += dt;
    if (simTime > 3.6 || !anyMoving) {
      simActive = false;
    }
  }

  // ---------- 命中测试（四门 / 四角斜切楔 / 闯边杂块）----------
  function hitTest(nx, ny) {
    const { g } = audit(state);
    if (state.strayIntruder) {
      const b = g.intruder;
      if (nx >= b.x - 0.03 && nx <= b.x + b.w + 0.03 && ny >= b.y - 0.03 && ny <= b.y + b.h + 0.03) {
        return { kind: "intruder", id: "stray" };
      }
    }
    for (const k of GATE_ORDER) {
      const z = g.gateZones[k];
      if (nx >= z.x && nx <= z.x + z.w && ny >= z.y && ny <= z.y + z.h) {
        return { kind: "gate", id: k };
      }
    }
    for (const c of g.cornerZones) {
      if (Math.hypot(nx - c.x, ny - c.y) < 0.095) {
        return { kind: "corner", id: c.id };
      }
    }
    return null;
  }

  // ---------- 绘图辅助 ----------
  function drawArrow(x1, y1, x2, y2, color, lw = 1.4, dashed = false, head = 6) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    if (dashed) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(ang - 0.45) * head, y2 - Math.sin(ang - 0.45) * head);
    ctx.lineTo(x2 - Math.cos(ang + 0.45) * head, y2 - Math.sin(ang + 0.45) * head);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBadgeTag(x, y, text, bg, fg = "#FFF9EE") {
    ctx.save();
    ctx.font = `600 ${Math.max(10.5, Math.round(size * 0.022))}px "Noto Serif SC", serif`;
    const padX = Math.round(size * 0.015);
    const w = ctx.measureText(text).width + padX * 2;
    const h = Math.max(21, Math.round(size * 0.042));
    const bx = clamp(x - w / 2, 6, size - w - 6);
    const by = clamp(y - h / 2, 6, size - h - 6);
    ctx.fillStyle = bg;
    ctx.fillRect(bx, by, w, h);
    ctx.strokeStyle = "rgba(255,249,238,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, h - 1);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
    ctx.restore();
  }

  // ---------- 核心绘制：1:1 复刻 092 叠院藏室 + 徽章/书封三语境 ----------
  function render(t, dt, { still }) {
    resize();
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.45);
      dirty = true;
    }

    const res = audit(state);
    const { g } = res;

    if (simActive && !still) {
      stepParticles(Math.max(dt, 0.016), g);
      dirty = true;
    }

    if (!dirty && !simActive && intro >= 1) return;
    dirty = false;

    const S = size;
    const ease = 1 - Math.pow(1 - intro, 3);
    const p = (u) => u * S;
    const isTondo = state.form === "tondo";
    const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, S, S);

    // 1. 宣纸底场（有缺口时，外溢的光雾会从深柏藏室渗到宣纸外）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, S, S);

    // 2. 深柏墨绿藏室外墙（方框或圆穹团扇）
    const outerPad = p(0.012);
    const frameS = S - outerPad * 2;
    const wallPx = p(g.wallT) * (0.85 + 0.15 * ease);

    if (isTondo) {
      // 圆穹团扇底：外圈宣纸角落保留微弱金格，中央深柏圆穹墙
      ctx.strokeStyle = "rgba(196, 166, 112, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(outerPad, outerPad, frameS, frameS);

      const outerR = frameS * 0.49;
      ctx.fillStyle = PALETTE.cypressDeep;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, outerR, 0, Math.PI * 2);
      ctx.fill();

      // 圆穹内金线
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, outerR - wallPx * 0.46, 0, Math.PI * 2);
      ctx.stroke();

      // 内庭暖金斜切圆盘
      const innerR = outerR - wallPx;
      const bevelGrad = ctx.createRadialGradient(S / 2, S / 2, innerR * 0.65, S / 2, S / 2, innerR);
      bevelGrad.addColorStop(0, PALETTE.bevelCream);
      bevelGrad.addColorStop(0.75, PALETTE.bevelGold);
      bevelGrad.addColorStop(1, PALETTE.bevelShade);
      ctx.fillStyle = bevelGrad;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, innerR, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 092 原海报标准方框藏室
      ctx.fillStyle = PALETTE.cypressDeep;
      ctx.fillRect(outerPad, outerPad, frameS, frameS);

      // 外墙中细金方框（与 092 原海报完全一致的建筑套线）
      const goldRulePad = outerPad + wallPx * 0.44;
      ctx.strokeStyle = g.seal > 105 ? PALETTE.alertDark : "rgba(214, 175, 109, 0.62)";
      ctx.lineWidth = 1.25;
      ctx.strokeRect(goldRulePad, goldRulePad, S - goldRulePad * 2, S - goldRulePad * 2);

      // 3. 四面古铜鎏金斜切梯形内壁（1:1 承袭 092 原海报明暗受光面）
      const i0 = p(g.innerMin);
      const i1 = p(g.innerMax);
      const c0 = p(g.courtMin);
      const c1 = p(g.courtMax);

      // 内腔暖白底
      ctx.fillStyle = PALETTE.bevelCream;
      ctx.fillRect(i0, i0, i1 - i0, i1 - i0);

      // 上斜切面（最亮暖宣）
      const topG = ctx.createLinearGradient(0, i0, 0, c0);
      topG.addColorStop(0, "#F5ECD9");
      topG.addColorStop(1, "#E7D5B3");
      ctx.fillStyle = topG;
      ctx.beginPath();
      ctx.moveTo(i0, i0);
      ctx.lineTo(i1, i0);
      ctx.lineTo(c1, c0);
      ctx.lineTo(c0, c0);
      ctx.closePath();
      ctx.fill();

      // 下斜切面（次亮暖金）
      const botG = ctx.createLinearGradient(0, i1, 0, c1);
      botG.addColorStop(0, "#F2E6CF");
      botG.addColorStop(1, "#DFC89F");
      ctx.fillStyle = botG;
      ctx.beginPath();
      ctx.moveTo(i0, i1);
      ctx.lineTo(i1, i1);
      ctx.lineTo(c1, c1);
      ctx.lineTo(c0, c1);
      ctx.closePath();
      ctx.fill();

      // 左斜切面（古铜阴影面）
      const leftG = ctx.createLinearGradient(i0, 0, c0, 0);
      leftG.addColorStop(0, "#D9BE8F");
      leftG.addColorStop(1, "#E8D6B4");
      ctx.fillStyle = leftG;
      ctx.beginPath();
      ctx.moveTo(i0, i0);
      ctx.lineTo(c0, c0);
      ctx.lineTo(c0, c1);
      ctx.lineTo(i0, i1);
      ctx.closePath();
      ctx.fill();

      // 右斜切面（古铜微暗面）
      const rightG = ctx.createLinearGradient(i1, 0, c1, 0);
      rightG.addColorStop(0, "#D3B685");
      rightG.addColorStop(1, "#E4CFA9");
      ctx.fillStyle = rightG;
      ctx.beginPath();
      ctx.moveTo(i1, i0);
      ctx.lineTo(c1, c0);
      ctx.lineTo(c1, c1);
      ctx.lineTo(i1, i1);
      ctx.closePath();
      ctx.fill();

      // 内庭细深柏分隔方框（原海报第二层深墨绿细框）
      ctx.strokeStyle = PALETTE.cypress;
      ctx.lineWidth = Math.max(4, S * 0.015);
      ctx.strokeRect(c0, c0, c1 - c0, c1 - c0);

      // 内庭暖白角域与四面斜切角线
      ctx.fillStyle = PALETTE.bevelCream;
      ctx.fillRect(c0 + S * 0.008, c0 + S * 0.008, c1 - c0 - S * 0.016, c1 - c0 - S * 0.016);

      // 若是原海报/书封，绘制内腔四边浅金斜角影
      if (state.scenario === "poster") {
        ctx.fillStyle = "rgba(214, 184, 132, 0.36)";
        const m = (c1 - c0) * 0.14;
        ctx.beginPath();
        ctx.moveTo(c0 + S * 0.008, c0 + S * 0.008);
        ctx.lineTo(c1 - S * 0.008, c0 + S * 0.008);
        ctx.lineTo(c1 - m, c0 + m);
        ctx.lineTo(c0 + m, c0 + m);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 4. 四向门闸处理：闭合时画原海报深柏内指三角楔 + 虚线金箭；敞开时直接凿穿外墙并画外泄红标！
    const bHalfPx = p(g.breachHalf);
    const wedgeDepth = p(g.bevelD) * 0.96;
    const wedgeHalf = bHalfPx * 0.56;

    for (const dir of GATE_ORDER) {
      const closed = state.gates[dir];
      const isHover = hoverTarget && hoverTarget.kind === "gate" && hoverTarget.id === dir;

      ctx.save();
      ctx.translate(S / 2, S / 2);
      const rot = dir === "n" ? 0 : dir === "e" ? Math.PI / 2 : dir === "s" ? Math.PI : -Math.PI / 2;
      ctx.rotate(rot);

      const wallInnerY = -S / 2 + p(g.innerMin);
      const outerEdgeY = -S / 2 + outerPad;

      if (closed) {
        // 闭合门闸：原海报标志性深柏内指三角门楔
        ctx.fillStyle = isHover ? "#1F4B37" : PALETTE.cypressDeep;
        ctx.beginPath();
        ctx.moveTo(-wedgeHalf, wallInnerY - 2);
        ctx.lineTo(wedgeHalf, wallInnerY - 2);
        ctx.lineTo(0, wallInnerY + wedgeDepth * (state.inwardBevels ? 1 : 0.42));
        ctx.closePath();
        ctx.fill();

        // 穿楔而入的金虚线向心箭头
        if (state.guides) {
          const arrowStart = outerEdgeY + wallPx * 0.22;
          const arrowEnd = wallInnerY + wedgeDepth * (state.inwardBevels ? 0.88 : 0.3);
          drawArrow(0, arrowStart, 0, arrowEnd, PALETTE.goldBright, 1.5, true, 6.5);
        }
      } else {
        // 敞开缺口：直接把深柏外墙凿空成宣纸底，展现视线外泄通道！
        ctx.fillStyle = PALETTE.paper;
        ctx.fillRect(-bHalfPx, outerEdgeY - 4, bHalfPx * 2, wallPx + wedgeDepth + 8);

        // 缺口红虚线预警框
        ctx.fillStyle = isHover ? "rgba(184, 50, 39, 0.24)" : "rgba(184, 50, 39, 0.12)";
        ctx.fillRect(-bHalfPx, outerEdgeY, bHalfPx * 2, wallPx + 6);
        ctx.strokeStyle = PALETTE.alert;
        ctx.lineWidth = isHover ? 2.4 : 1.8;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(-bHalfPx, outerEdgeY, bHalfPx * 2, wallPx + 6);
        ctx.setLineDash([]);

        // 向外逃逸的红色箭头
        drawArrow(-bHalfPx * 0.35, wallInnerY + 12, -bHalfPx * 0.35, outerEdgeY - 3, PALETTE.alert, 1.8, true, 7);
        drawArrow(bHalfPx * 0.35, wallInnerY + 12, bHalfPx * 0.35, outerEdgeY - 3, PALETTE.alert, 1.8, true, 7);
      }
      ctx.restore();
    }

    // 5. 深柏墨绿主圆环与双金圈（严格内切于内庭）
    const rOut = p(g.ringOuterR);
    const rIn = p(g.ringInnerR);
    const ringLine = Math.max(2, S * 0.009);

    ctx.fillStyle = PALETTE.cypress;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, rOut, 0, Math.PI * 2);
    ctx.fill();

    // 外圈极细金线
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, rOut - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈粗鎏金环（原海报中段标志金环）
    ctx.fillStyle = PALETTE.cypressDeep;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, rIn + ringLine * 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = ringLine;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, rIn, 0, Math.PI * 2);
    ctx.stroke();

    // 若核心顶框（cushionPct < 12%），在金环内缘高亮红虚线预警环
    if (g.cushionPct < 12) {
      ctx.save();
      ctx.strokeStyle = PALETTE.alertDark;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, rIn - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 6. 四角斜切导引矢（直点可翻转 向内收束 ↔ 向外发散）
    for (const c of g.cornerZones) {
      const cx = p(c.x);
      const cy = p(c.y);
      const isHover = hoverTarget && hoverTarget.kind === "corner" && hoverTarget.id === c.id;
      const len = Math.max(18, S * 0.054);
      const ux = c.dx * Math.SQRT1_2;
      const uy = c.dy * Math.SQRT1_2;

      if (state.inwardBevels) {
        // 向内收束：沿着 45° 对角线优雅指向中心金环
        const x1 = cx - ux * len * 0.35;
        const y1 = cy - uy * len * 0.35;
        const x2 = cx + ux * len * 0.85;
        const y2 = cy + uy * len * 0.85;
        drawArrow(x1, y1, x2, y2, isHover ? "#FFF4DC" : PALETTE.goldBright, isHover ? 2.4 : 1.6, true, 6.5);
      } else {
        // 外翻发散：红箭直接朝四个角落拉扯视线！
        const x1 = cx + ux * len * 0.55;
        const y1 = cy + uy * len * 0.55;
        const x2 = cx - ux * len * 0.82;
        const y2 = cy - uy * len * 0.82;
        ctx.save();
        ctx.fillStyle = isHover ? "rgba(184, 50, 39, 0.28)" : "rgba(184, 50, 39, 0.14)";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(18, S * 0.044), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.alert;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.restore();
        drawArrow(x1, y1, x2, y2, PALETTE.alert, 2.2, false, 8);
      }
    }
    if (!state.inwardBevels) {
      const c0 = g.cornerZones[0];
      drawBadgeTag(p(c0.x) + S * 0.11, p(c0.y) + S * 0.06, "× 斜切外散 · 点扳向内", PALETTE.alert);
    }

    // 环内四正交双向微小标尺箭（原海报细节点睛，仅 guides 开启时）
    if (state.guides) {
      const rMid = (rOut + rIn) * 0.5;
      const span = Math.max(8, (rOut - rIn) * 0.34);
      const col = state.inwardBevels ? "rgba(214, 175, 109, 0.82)" : "rgba(255, 131, 115, 0.72)";
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const mx = S / 2 + Math.cos(a) * rMid;
        const my = S / 2 + Math.sin(a) * rMid;
        const ax = Math.cos(a) * span;
        const ay = Math.sin(a) * span;
        if (state.inwardBevels) {
          drawArrow(mx + ax, my + ay, mx - ax, my - ay, col, 1.15, true, 4.5);
        } else {
          drawArrow(mx - ax, my - ay, mx + ax, my + ay, col, 1.35, true, 5);
        }
      }
    }

    // 7. 内庭层阶与核心（按三套语境渲染真实设计物，均严格读 g.diamondR / g.coreHalf）
    const dR = p(g.diamondR);
    const cHalf = p(g.coreHalf) * (0.85 + 0.15 * ease);

    if (state.scenario === "poster") {
      // 原海报：暖白内庭 45° 菱形 → 鎏金方座 → 深柏圆核 → 鎏金中心珠
      ctx.fillStyle = PALETTE.bevelCream;
      ctx.beginPath();
      ctx.moveTo(S / 2, S / 2 - dR);
      ctx.lineTo(S / 2 + dR, S / 2);
      ctx.lineTo(S / 2, S / 2 + dR);
      ctx.lineTo(S / 2 - dR, S / 2);
      ctx.closePath();
      ctx.fill();

      // 鎏金方座（带柔和斜向光泽渐变）
      const sqG = ctx.createLinearGradient(S / 2 - cHalf, S / 2 - cHalf, S / 2 + cHalf, S / 2 + cHalf);
      sqG.addColorStop(0, "#DFC48E");
      sqG.addColorStop(0.55, "#C7A76B");
      sqG.addColorStop(1, "#B99453");
      ctx.fillStyle = sqG;
      ctx.fillRect(S / 2 - cHalf, S / 2 - cHalf, cHalf * 2, cHalf * 2);

      // 深柏实心圆核
      const cRad = cHalf * 0.6;
      ctx.fillStyle = PALETTE.cypressDeep;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, cRad, 0, Math.PI * 2);
      ctx.fill();

      // 核心鎏金珠
      ctx.fillStyle = PALETTE.goldDot;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, cRad * 0.42, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.scenario === "crest") {
      // 品牌徽章语境：八角徽盾底 + 双金纹环 + 居中印记
      ctx.fillStyle = PALETTE.bevelCream;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + Math.PI / 8;
        const rx = S / 2 + Math.cos(a) * dR * 0.92;
        const ry = S / 2 + Math.sin(a) * dR * 0.92;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.fill();

      // 徽章主盾
      ctx.fillStyle = PALETTE.cypressDeep;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, cHalf * 1.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.goldBright;
      ctx.lineWidth = Math.max(2, S * 0.006);
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, cHalf * 0.88, 0, Math.PI * 2);
      ctx.stroke();

      // 印记大字（居中自足）
      ctx.fillStyle = PALETTE.goldBright;
      ctx.font = `900 ${Math.max(16, Math.round(cHalf * 0.92))}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sc.coreTitle, S / 2, S / 2 - cHalf * 0.06);
      ctx.font = `700 ${Math.max(9, Math.round(cHalf * 0.24))}px "Archivo", sans-serif`;
      ctx.fillText("EST · 092", S / 2, S / 2 + cHalf * 0.56);
    } else {
      // 典藏书封语境：拱形框景内窗 + 居中器物剪影 + 精排双行书题
      ctx.fillStyle = PALETTE.bevelCream;
      const wW = dR * 1.38;
      const wH = dR * 1.56;
      ctx.beginPath();
      ctx.roundRect(S / 2 - wW / 2, S / 2 - wH / 2, wW, wH, [wW / 2, wW / 2, 4, 4]);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // 居中青铜樽几何剪影（纯粹器形，绝无五官）
      const vH = cHalf * 1.48;
      const vW = cHalf * 0.95;
      const vx = S / 2;
      const vy = S / 2 + cHalf * 0.06;
      ctx.fillStyle = PALETTE.cypressDeep;
      ctx.beginPath();
      ctx.moveTo(vx - vW * 0.42, vy - vH * 0.45);
      ctx.lineTo(vx + vW * 0.42, vy - vH * 0.45);
      ctx.lineTo(vx + vW * 0.28, vy - vH * 0.16);
      ctx.quadraticCurveTo(vx + vW * 0.62, vy + vH * 0.08, vx + vW * 0.34, vy + vH * 0.38);
      ctx.lineTo(vx + vW * 0.46, vy + vH * 0.48);
      ctx.lineTo(vx - vW * 0.46, vy + vH * 0.48);
      ctx.lineTo(vx - vW * 0.34, vy + vH * 0.38);
      ctx.quadraticCurveTo(vx - vW * 0.62, vy + vH * 0.08, vx - vW * 0.28, vy - vH * 0.16);
      ctx.closePath();
      ctx.fill();
      // 器身金腰带
      ctx.fillStyle = PALETTE.goldDot;
      ctx.fillRect(vx - vW * 0.44, vy - vH * 0.02, vW * 0.88, Math.max(3, vH * 0.1));
    }

    // 核心过小提示（只在萎缩时贴出）
    if (g.coreScale < 18) {
      drawBadgeTag(S / 2, S / 2 + cHalf + Math.max(20, S * 0.048), `核过弱 ${g.coreScale}%`, PALETTE.alert);
    } else if (g.coreScale > 42 || g.cushionPct < 12) {
      drawBadgeTag(S / 2, S / 2 - Math.min(rIn, cHalf) - 10, `留气不足 ${g.cushionPct}%`, PALETTE.alert);
    }

    // 8. 闯边逃逸杂块（直点收回内庭）
    if (state.strayIntruder) {
      const b = g.intruder;
      const bx = p(b.x);
      const by = p(b.y);
      const bw = p(b.w);
      const bh = p(b.h);
      const isHover = hoverTarget && hoverTarget.kind === "intruder";

      ctx.save();
      ctx.fillStyle = isHover ? "#9E261C" : PALETTE.alert;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "#FFF7E8";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFF9EE";
      ctx.font = `600 ${Math.max(10.5, Math.round(S * 0.021))}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 闯边块", bx + bw / 2, by + bh * 0.35);
      ctx.font = `500 ${Math.max(10, Math.round(S * 0.019))}px "Noto Serif SC", serif`;
      ctx.fillText("点此收回", bx + bw / 2, by + bh * 0.72);
      ctx.restore();
    }

    // 8.5 所有缺口红标统一画在圆环与内庭之上，永不被深柏圆环遮挡
    for (const dir of GATE_ORDER) {
      if (!state.gates[dir]) {
        const z = g.gateZones[dir];
        const bx = dir === "e" ? S * 0.84 : dir === "w" ? S * 0.16 : p(z.cx);
        const by = dir === "e" ? S * 0.56 : dir === "w" ? S * 0.50 : dir === "n" ? Math.max(46, p(z.cy) + 10) : p(z.cy);
        drawBadgeTag(bx, by, `× ${GATE_NAMES[dir]}缺口 · 点封`, PALETTE.alert);
      }
    }

    // 9. 视线粒子验真层（流光轨迹 + 碰撞闪点）
    if (particles.length) {
      for (const pt of particles) {
        if (pt.trail.length > 1) {
          ctx.save();
          ctx.beginPath();
          pt.trail.forEach((v, idx) => {
            if (idx === 0) ctx.moveTo(p(v.x), p(v.y));
            else ctx.lineTo(p(v.x), p(v.y));
          });
          ctx.strokeStyle = pt.escaped ? "rgba(255, 118, 102, 0.85)" : "rgba(245, 206, 126, 0.88)";
          ctx.lineWidth = pt.escaped ? 2.1 : 1.9;
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = pt.escaped ? "#FF6B5B" : pt.settled ? "#73D6A4" : "#FFE29C";
        ctx.beginPath();
        ctx.arc(p(pt.x), p(pt.y), pt.settled ? 3.8 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 10. 顶部微尺读数（单真源数字，简洁锐利，绝不遮挡几何中心）
    const hudH = Math.max(24, Math.round(S * 0.05));
    ctx.fillStyle = "rgba(13, 33, 24, 0.88)";
    ctx.fillRect(outerPad + 6, outerPad + 6, Math.min(S * 0.56, 286), hudH);
    ctx.strokeStyle = "rgba(214, 175, 109, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(outerPad + 6.5, outerPad + 6.5, Math.min(S * 0.56, 286) - 1, hudH - 1);
    ctx.fillStyle = "#EFE6D5";
    ctx.font = `500 ${Math.max(10.5, Math.round(S * 0.021))}px "DM Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`SEAL ${g.seal}% · GAP ${g.cushionPct}% · ${g.closedCount}/4`, outerPad + 14, outerPad + 6 + hudH / 2 + 0.5);

    // 右上角状态印章
    const tagBg = res.ok ? PALETTE.ok : PALETTE.alert;
    drawBadgeTag(S - outerPad - Math.max(58, S * 0.145), outerPad + 6 + hudH / 2, res.stamp, tagBg);

    ctx.restore();
  }

  // ---------- 指针与触摸交互（横拖连续调合围度，单击开关四门/斜切/收杂块）----------
  let dragStart = null;
  let dragged = false;
  let startSeal = state.seal;

  function toNorm(e) {
    const r = canvas.getBoundingClientRect();
    return {
      nx: clamp((e.clientX - r.left) / (r.width || 1), 0, 1),
      ny: clamp((e.clientY - r.top) / (r.height || 1), 0, 1),
    };
  }

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return;
    const pt = toNorm(e);
    dragStart = { x: e.clientX, y: e.clientY, nx: pt.nx, ny: pt.ny };
    dragged = false;
    startSeal = state.seal;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  }

  function onPointerMove(e) {
    const pt = toNorm(e);
    if (dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (!dragged && Math.abs(dx) > 7 && Math.abs(dx) >= Math.abs(dy) * 0.8) {
        dragged = true;
      }
      if (dragged) {
        const delta = Math.round((dx / Math.max(180, size * 0.72)) * 96);
        let next = clamp(startSeal + delta, 20, 120);
        // 靠近原海报理想值 88% 轻吸附
        if (Math.abs(next - 88) <= 2) next = 88;
        if (next !== state.seal) {
          state.seal = next;
          dirty = true;
          onChange("drag-seal");
          ctrl.draw();
        }
      }
    } else {
      const hit = hitTest(pt.nx, pt.ny);
      const same = hit?.kind === hoverTarget?.kind && hit?.id === hoverTarget?.id;
      if (!same) {
        hoverTarget = hit;
        canvas.style.cursor = hit ? "pointer" : "ew-resize";
        dirty = true;
        ctrl.draw();
      }
    }
  }

  function onPointerUp(e) {
    if (!dragStart) return;
    const pt = toNorm(e);
    const wasDragged = dragged;
    dragStart = null;
    dragged = false;
    if (!wasDragged) {
      const hit = hitTest(pt.nx, pt.ny);
      if (hit?.kind === "gate") {
        state.gates[hit.id] = !state.gates[hit.id];
        dirty = true;
        onChange(`gate-${hit.id}`);
        ctrl.draw();
      } else if (hit?.kind === "corner") {
        state.inwardBevels = !state.inwardBevels;
        dirty = true;
        onChange("toggle-bevels");
        ctrl.draw();
      } else if (hit?.kind === "intruder") {
        state.strayIntruder = false;
        dirty = true;
        onChange("clear-intruder");
        ctrl.draw();
      }
    }
  }

  // 同时支持原生 touchstart/touchmove（确保 perf.mjs 的 dispatchTouchEvent 触发顺滑重画）
  let touchStart = null;
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    touchStart = {
      x: t0.clientX,
      y: t0.clientY,
      nx: clamp((t0.clientX - r.left) / (r.width || 1), 0, 1),
      ny: clamp((t0.clientY - r.top) / (r.height || 1), 0, 1),
      seal: state.seal,
      moved: false,
    };
  }
  function onTouchMove(e) {
    if (!touchStart || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - touchStart.x;
    const dy = t0.clientY - touchStart.y;
    if (Math.abs(dx) > 4 && Math.abs(dx) >= Math.abs(dy) * 0.7) {
      touchStart.moved = true;
      const next = clamp(Math.round(touchStart.seal + (dx / Math.max(150, size * 0.65)) * 96), 20, 120);
      if (next !== state.seal) {
        state.seal = next;
        dirty = true;
        onChange("touch-seal");
        ctrl.draw();
      }
    }
  }
  function onTouchEnd() {
    touchStart = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
    ctrl.draw();
  });
  ro.observe(canvas);

  const ctrl = loop(canvas, render);
  resize();
  ctrl.draw();

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
    launchGaze: spawnGazeFlight,
    clearGaze() {
      particles = [];
      simActive = false;
      dirty = true;
      ctrl.draw();
    },
  };
}
