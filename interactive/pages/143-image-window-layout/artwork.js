// 143 图片 窗口版式 — 高保真 2D Canvas 绘图模块（带离屏静态底图缓存，确保慢手机与软件渲染 60fps）
import {
  COLORS,
  LANDMARKS,
  SHAPES,
  traceWindowPath,
  windowMetricsPx,
} from "./model.js";

// 生成极细微纸面/灰泥颗粒纹理（仅初始化一次，零每帧开销）
function paintSubtleGrain(ctx, W, H, alpha = 0.032) {
  const tile = 96;
  const g = document.createElement("canvas");
  g.width = tile;
  g.height = tile;
  const gx = g.getContext("2d");
  const img = gx.createImageData(tile, tile);
  let seed = 1432026;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = (seed >>> 24) & 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = Math.round(alpha * 255);
  }
  gx.putImageData(img, 0, 0);
  const pat = ctx.createPattern(g, "repeat");
  if (pat) {
    ctx.save();
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// 绘制墙后连续的 143 同源山水画卷（暖白日轮 + 松青天空 + 暗松岭 + 鼠尾草山坡 + 曲径溪流）
export function paintHeroLandscape(ctx, W, H) {
  ctx.save();
  // 1. 松石青绿渐变天空
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, "#3D7A74");
  sky.addColorStop(0.55, "#4E8A83");
  sky.addColorStop(1, "#7CA59C");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 2. 暖白日轮（严格正圆，直接读取 LANDMARKS.sun 坐标）
  const sunX = LANDMARKS.sun.x * W;
  const sunY = LANDMARKS.sun.y * H;
  const sunR = LANDMARKS.sun.r * W;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.6, sunX, sunY, sunR * 2.1);
  halo.addColorStop(0, "rgba(232, 227, 218, 0.24)");
  halo.addColorStop(1, "rgba(232, 227, 218, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.cream;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 中远景柔雾鼠尾草山丘（呼应 143 海报中段弧丘）
  ctx.fillStyle = "#A4C0B6";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.50);
  ctx.bezierCurveTo(W * 0.22, H * 0.42, W * 0.48, H * 0.49, W * 0.72, H * 0.39);
  ctx.bezierCurveTo(W * 0.86, H * 0.34, W * 0.96, H * 0.36, W, H * 0.37);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // 4. 左侧暗松青主山脊（呼应 143 海报主窗左暗山）
  ctx.fillStyle = COLORS.pine;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.31);
  ctx.bezierCurveTo(W * 0.18, H * 0.26, W * 0.34, H * 0.35, W * 0.56, H * 0.48);
  ctx.bezierCurveTo(W * 0.42, H * 0.55, W * 0.22, H * 0.58, 0, H * 0.62);
  ctx.closePath();
  ctx.fill();

  // 5. 中景连续暖白弧光丘陵（流畅贯通全幅，无生硬垂直切边）
  ctx.fillStyle = COLORS.cream;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.54);
  ctx.bezierCurveTo(W * 0.16, H * 0.50, W * 0.28, H * 0.58, W * 0.42, H * 0.62);
  ctx.bezierCurveTo(W * 0.58, H * 0.52, W * 0.80, H * 0.47, W, H * 0.53);
  ctx.lineTo(W, H * 0.74);
  ctx.lineTo(0, H * 0.74);
  ctx.closePath();
  ctx.fill();

  // 6. 右下松青柔坡（呼应 143 海报中方窗右下深青弧）
  ctx.fillStyle = "#337875";
  ctx.beginPath();
  ctx.moveTo(W * 0.64, H * 0.74);
  ctx.bezierCurveTo(W * 0.75, H * 0.63, W * 0.88, H * 0.59, W, H * 0.61);
  ctx.lineTo(W, H * 0.75);
  ctx.closePath();
  ctx.fill();

  // 7. 中左深岩青斜切坡（流畅没入谷底，无竖直断口）
  ctx.fillStyle = "#2E444B";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.68);
  ctx.bezierCurveTo(W * 0.18, H * 0.62, W * 0.34, H * 0.56, W * 0.50, H * 0.73);
  ctx.lineTo(0, H * 0.75);
  ctx.closePath();
  ctx.fill();

  // 8. 底部幽暗河谷与 S 形蜿蜒鼠尾草曲径（呼应 143 海报底横窗！）
  ctx.fillStyle = "#2C434A";
  ctx.fillRect(0, H * 0.71, W, H * 0.29);

  // 右侧松青坡岸
  ctx.fillStyle = "#397B75";
  ctx.beginPath();
  ctx.moveTo(W * 0.68, H * 0.71);
  ctx.bezierCurveTo(W * 0.60, H * 0.78, W * 0.84, H * 0.83, W * 0.76, H * 0.94);
  ctx.lineTo(W * 0.72, H);
  ctx.lineTo(W, H);
  ctx.lineTo(W, H * 0.71);
  ctx.closePath();
  ctx.fill();

  // S 形浅鼠尾草曲径溪流（清晰平滑的引导线）
  ctx.fillStyle = COLORS.sageLight;
  ctx.beginPath();
  ctx.moveTo(W * 0.67, H * 0.71);
  ctx.bezierCurveTo(W * 0.40, H * 0.75, W * 0.44, H * 0.80, W * 0.62, H * 0.84);
  ctx.bezierCurveTo(W * 0.80, H * 0.88, W * 0.65, H * 0.95, W * 0.46, H);
  ctx.lineTo(W * 0.70, H);
  ctx.bezierCurveTo(W * 0.86, H * 0.94, W * 0.91, H * 0.86, W * 0.70, H * 0.82);
  ctx.bezierCurveTo(W * 0.56, H * 0.79, W * 0.62, H * 0.75, W * 0.84, H * 0.71);
  ctx.closePath();
  ctx.fill();

  // 极轻微印刷颗粒，增加哑光丝网质感
  paintSubtleGrain(ctx, W, H, 0.036);
  ctx.restore();
}

// 创建/更新离屏缓存（素墙纹理 + 墙后完整画卷）
export function createStageCache(W, H) {
  const backdrop = document.createElement("canvas");
  backdrop.width = W;
  backdrop.height = H;
  paintHeroLandscape(backdrop.getContext("2d"), W, H);

  const wall = document.createElement("canvas");
  wall.width = W;
  wall.height = H;
  const wx = wall.getContext("2d");
  wx.fillStyle = COLORS.plaster;
  wx.fillRect(0, 0, W, H);
  // 微妙柔和的墙面漫射光（左上微亮、右下微沉）
  const sheen = wx.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0, "rgba(255,255,255,0.22)");
  sheen.addColorStop(1, "rgba(25,57,60,0.05)");
  wx.fillStyle = sheen;
  wx.fillRect(0, 0, W, H);
  paintSubtleGrain(wx, W, H, 0.022);

  return { W, H, backdrop, wall };
}

// 绘制主开场「墙面开窗裁景台」一帧
export function renderWallStage(ctx, W, H, state, evalRes, cache, animT, introProgress) {
  ctx.save();
  // 1. 铺满哑光青灰素墙
  ctx.drawImage(cache.wall, 0, 0, W, H);

  // 2. 若开启「透视墙后」，把墙后完整画卷半透明显现出来
  if (state.xrayAlpha > 0.005) {
    ctx.save();
    ctx.globalAlpha = 0.42 * state.xrayAlpha;
    ctx.drawImage(cache.backdrop, 0, 0, W, H);
    ctx.restore();

    // 标出墙后关键主焦范围
    ctx.save();
    ctx.globalAlpha = 0.88 * state.xrayAlpha;
    const sx = LANDMARKS.sun.x * W;
    const sy = LANDMARKS.sun.y * H;
    const sr = LANDMARKS.sun.r * W + 6;
    ctx.strokeStyle = COLORS.pine;
    ctx.lineWidth = Math.max(1.5, W * 0.0026);
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.pine;
    ctx.font = `700 ${Math.max(11, Math.round(W * 0.021))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("主焦 · 日轮", sx, sy - sr - 7);

    const px = LANDMARKS.path.x * W;
    const py = LANDMARKS.path.y * H;
    ctx.fillStyle = COLORS.cream;
    ctx.fillText("视线导引 · 曲径", px, py + 5);
    ctx.restore();
  }

  // 3. 逐扇绘制实体凹槽开窗（开场 introProgress 让窗洞依次柔和睁开）
  const details = evalRes.details;
  const dprScale = W / 600;
  for (let i = 0; i < details.length; i++) {
    const win = details[i];
    const delay = i * 0.06;
    const localP = Math.max(0, Math.min(1, (introProgress - delay) / 0.55));
    const ease = 1 - (1 - localP) ** 3;
    if (ease <= 0.01) continue;

    // 缩放进场仅围绕窗口中心微幅展开（0.90 → 1.0），任意时刻截图都清晰规整
    const sc = 0.90 + 0.10 * ease;
    const cx = (win.x + win.w / 2) * W;
    const cy = (win.y + win.h / 2) * H;

    ctx.save();
    if (sc < 0.999) {
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-cx, -cy);
    }

    // 3a. 窗洞外部底沿微弱亮唇（素墙厚度的受光面）
    traceWindowPath(ctx, win, W, H);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = Math.max(1.5, 2 * dprScale);
    ctx.stroke();

    // 3b. 裁剪至窗洞内部，透出连续的墙后画卷！
    ctx.save();
    traceWindowPath(ctx, win, W, H);
    ctx.clip();
    ctx.drawImage(cache.backdrop, 0, 0, W, H);

    // 3c. 模拟原海报 143 的实感凹槽内阴影（双层柔和内描边，零高斯模糊开销，软件渲染同样 60fps）
    ctx.save();
    traceWindowPath(ctx, win, W, H);
    ctx.strokeStyle = "rgba(16, 38, 40, 0.14)";
    ctx.lineWidth = Math.max(8, 12 * dprScale);
    ctx.stroke();
    ctx.strokeStyle = "rgba(16, 38, 40, 0.28)";
    ctx.lineWidth = Math.max(3, 4.5 * dprScale);
    ctx.stroke();
    ctx.restore();

    // 若此窗劈开主焦日轮，在窗内边缘绘出柔和陶红警示斜纹提示线
    if (win.isSliced) {
      ctx.save();
      traceWindowPath(ctx, win, W, H);
      ctx.strokeStyle = "rgba(180, 62, 46, 0.85)";
      ctx.lineWidth = Math.max(3, 4 * dprScale);
      ctx.setLineDash([7 * dprScale, 5 * dprScale]);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore(); // end clip

    // 3d. 碰撞或选中外框
    const isActive = win.id === state.activeId;
    if (win.colliding) {
      traceWindowPath(ctx, win, W, H);
      ctx.strokeStyle = COLORS.alert;
      ctx.lineWidth = Math.max(2.2, 2.8 * dprScale);
      ctx.stroke();
    } else if (isActive) {
      traceWindowPath(ctx, win, W, H);
      ctx.strokeStyle = COLORS.pine;
      ctx.lineWidth = Math.max(2.2, 2.6 * dprScale);
      ctx.stroke();
    }

    // 3e. 窗口左上微型编号签（简洁建筑标号，不挡画面中心）
    const m = windowMetricsPx(win, W, H);
    const padBadge = Math.max(7, 9 * dprScale);
    const bx = win.shape === "circle" ? m.cx - 14 * dprScale : m.x + padBadge;
    const by = win.shape === "circle" ? m.cy - m.r + padBadge : m.y + padBadge;
    const bw = Math.max(26, 30 * dprScale);
    const bh = Math.max(18, 20 * dprScale);
    ctx.save();
    ctx.fillStyle = win.colliding || win.isSliced
      ? "rgba(154, 59, 45, 0.92)"
      : isActive
        ? "rgba(25, 57, 60, 0.92)"
        : "rgba(25, 57, 60, 0.72)";
    roundRectSimple(ctx, bx, by, bw, bh, 4 * dprScale);
    ctx.fill();
    ctx.fillStyle = "#F2F4F3";
    ctx.font = `700 ${Math.max(10, Math.round(11 * dprScale))}px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const idxNum = String(win.rank).padStart(2, "0");
    ctx.fillText(idxNum, bx + bw / 2, by + bh / 2 + 0.5);
    ctx.restore();

    ctx.restore();
  }

  // 4. 若布局「成立」且有多扇窗，在窗心之间描绘优雅的聚焦视线路径（01 → 02 → 03）
  if (evalRes.statusKind === "ok" && evalRes.gazeOrder.length >= 2) {
    const pts = evalRes.gazeOrder.map((w) => {
      const m = windowMetricsPx(w, W, H);
      return { x: m.cx, y: m.cy, rank: w.rank };
    });
    ctx.save();
    ctx.strokeStyle = "rgba(25, 57, 60, 0.58)";
    ctx.lineWidth = Math.max(1.8, 2.2 * dprScale);
    ctx.setLineDash([6 * dprScale, 5 * dprScale]);
    ctx.lineDashOffset = -(animT * 18 * dprScale);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const mx = (prev.x + cur.x) / 2;
      const my = (prev.y + cur.y) / 2 - 14 * dprScale;
      ctx.quadraticCurveTo(mx, my, cur.x, cur.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 路径端点小圆点
    for (let i = 0; i < pts.length; i++) {
      ctx.fillStyle = i === 0 ? COLORS.teal : COLORS.pine;
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = Math.max(1.8, 2.2 * dprScale);
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, (i === 0 ? 5.5 : 4) * dprScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. 墙面外缘细建筑框线
  ctx.strokeStyle = "rgba(35, 40, 41, 0.14)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  ctx.restore();
}

function roundRectSimple(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 示范标题旁的迷你活体拱窗：实时映射主窗裁切到的画面片段！
export function renderTitleMiniWindow(canvas, cache, activeWin) {
  if (!canvas || !cache) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  // 拱门路径
  const topR = W / 2;
  ctx.beginPath();
  ctx.moveTo(0, topR);
  ctx.arc(topR, topR, topR, Math.PI, 0, false);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();

  if (activeWin) {
    const sx = activeWin.x * cache.W;
    const sy = activeWin.y * cache.H;
    const sw = activeWin.w * cache.W;
    const sh = activeWin.h * cache.H;
    ctx.drawImage(cache.backdrop, sx, sy, sw, sh, 0, 0, W, H);
  } else {
    ctx.drawImage(cache.backdrop, cache.W * 0.45, cache.H * 0.1, cache.W * 0.45, cache.H * 0.45, 0, 0, W, H);
  }
  ctx.restore();
}

// ---------- 01 节：非模态补全遮挡拉帘画布 ----------
export function renderCurtainScene(canvas, sceneId, wallOcclusion) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // 先绘完整底图
  if (sceneId === "pottery") {
    paintPotteryScene(ctx, W, H);
  } else if (sceneId === "archway") {
    paintArchwayScene(ctx, W, H);
  } else {
    paintHeroLandscape(ctx, W, H);
  }

  // 根据 wallOcclusion (0..0.88) 收缩中央主窗与左下辅窗
  if (wallOcclusion <= 0.01) return;

  // 构造带洞素墙（evenodd 裁剪）
  const openScale = 1 - wallOcclusion; // 1.0 → 0.12
  const mw = Math.max(W * 0.16, W * (0.20 + openScale * 0.72));
  const mh = Math.max(H * 0.18, H * (0.20 + openScale * 0.72));
  const mx = (W - mw) * 0.56;
  const my = (H - mh) * 0.44;
  const r = Math.min(mw, mh) * 0.14;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  // 挖出主拱/圆角窗洞（椭圆拱无缝衔接，绝无台阶感）
  const topR = Math.min(mw / 2, mh * 0.46);
  if (sceneId === "pottery") {
    const midX = mx + mw / 2;
    const archY = my + topR;
    ctx.moveTo(mx, archY);
    ctx.ellipse(midX, archY, mw / 2, topR, 0, Math.PI, 0, false);
    ctx.lineTo(mx + mw, my + mh - r * 0.6);
    ctx.quadraticCurveTo(mx + mw, my + mh, mx + mw - r * 0.6, my + mh);
    ctx.lineTo(mx + r * 0.6, my + mh);
    ctx.quadraticCurveTo(mx, my + mh, mx, my + mh - r * 0.6);
    ctx.closePath();
  } else {
    ctx.moveTo(mx + r, my);
    ctx.lineTo(mx + mw - r, my);
    ctx.quadraticCurveTo(mx + mw, my, mx + mw, my + r);
    ctx.lineTo(mx + mw, my + mh - r);
    ctx.quadraticCurveTo(mx + mw, my + mh, mx + mw - r, my + mh);
    ctx.lineTo(mx + r, my + mh);
    ctx.quadraticCurveTo(mx, my + mh, mx, my + mh - r);
    ctx.lineTo(mx, my + r);
    ctx.quadraticCurveTo(mx, my, mx + r, my);
    ctx.closePath();
  }
  ctx.fillStyle = COLORS.plaster;
  ctx.fill("evenodd");

  // 凹槽描边
  ctx.strokeStyle = "rgba(25, 57, 60, 0.24)";
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.stroke();

  // 适度遮挡区间内，以极轻虚线示意大脑在墙后「非模态补全」出的隐形轮廓
  if (wallOcclusion >= 0.34 && wallOcclusion <= 0.72) {
    ctx.save();
    ctx.strokeStyle = "rgba(33, 83, 81, 0.36)";
    ctx.lineWidth = Math.max(1.5, W * 0.0025);
    ctx.setLineDash([5, 5]);
    if (sceneId === "pottery") {
      ctx.beginPath();
      ctx.ellipse(W * 0.54, H * 0.58, W * 0.22, H * 0.24, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (sceneId === "archway") {
      ctx.beginPath();
      ctx.arc(W * 0.55, H * 0.44, W * 0.28, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(W * 0.14, H * 0.42);
      ctx.quadraticCurveTo(W * 0.50, H * 0.28, W * 0.88, H * 0.40);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function paintPotteryScene(ctx, W, H) {
  // 素雅工坊背景
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#D6DFDC");
  bg.addColorStop(0.62, "#C2D0CB");
  bg.addColorStop(1, "#9EB4AC");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 桌面
  ctx.fillStyle = "#2A4046";
  ctx.fillRect(0, H * 0.74, W, H * 0.26);

  // 暖光斜墙投影
  ctx.fillStyle = "rgba(232, 227, 218, 0.48)";
  ctx.beginPath();
  ctx.moveTo(W * 0.38, 0);
  ctx.lineTo(W * 0.86, 0);
  ctx.lineTo(W * 0.64, H * 0.74);
  ctx.lineTo(W * 0.16, H * 0.74);
  ctx.closePath();
  ctx.fill();

  // 壶影
  ctx.fillStyle = "rgba(18, 36, 39, 0.32)";
  ctx.beginPath();
  ctx.ellipse(W * 0.58, H * 0.78, W * 0.22, H * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  // 鹅颈壶嘴（左探）
  ctx.strokeStyle = "#215351";
  ctx.lineWidth = Math.max(8, W * 0.032);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(W * 0.40, H * 0.61);
  ctx.bezierCurveTo(W * 0.28, H * 0.59, W * 0.28, H * 0.38, W * 0.20, H * 0.34);
  ctx.stroke();

  // 环形壶把（右探）
  ctx.strokeStyle = "#19393C";
  ctx.lineWidth = Math.max(7, W * 0.026);
  ctx.beginPath();
  ctx.moveTo(W * 0.66, H * 0.44);
  ctx.bezierCurveTo(W * 0.81, H * 0.44, W * 0.81, H * 0.67, W * 0.65, H * 0.68);
  ctx.stroke();

  // 青釉壶身
  const body = ctx.createLinearGradient(W * 0.36, H * 0.36, W * 0.72, H * 0.76);
  body.addColorStop(0, "#4E8D85");
  body.addColorStop(0.5, "#2C6765");
  body.addColorStop(1, "#19393C");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(W * 0.45, H * 0.36);
  ctx.bezierCurveTo(W * 0.34, H * 0.46, W * 0.34, H * 0.68, W * 0.43, H * 0.76);
  ctx.lineTo(W * 0.65, H * 0.76);
  ctx.bezierCurveTo(W * 0.74, H * 0.68, W * 0.74, H * 0.46, W * 0.63, H * 0.36);
  ctx.closePath();
  ctx.fill();

  // 壶盖与顶钮
  ctx.fillStyle = "#E8E3DA";
  roundRectSimple(ctx, W * 0.45, H * 0.31, W * 0.18, H * 0.055, 6);
  ctx.fill();
  ctx.fillStyle = "#19393C";
  ctx.beginPath();
  ctx.arc(W * 0.54, H * 0.29, W * 0.028, 0, Math.PI * 2);
  ctx.fill();

  // 釉面柔润高光弧
  ctx.strokeStyle = "rgba(232, 227, 218, 0.78)";
  ctx.lineWidth = Math.max(4, W * 0.015);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(W * 0.46, H * 0.44);
  ctx.quadraticCurveTo(W * 0.42, H * 0.54, W * 0.46, H * 0.65);
  ctx.stroke();
}

function paintArchwayScene(ctx, W, H) {
  ctx.fillStyle = "#3E7A74";
  ctx.fillRect(0, 0, W, H);
  // 远墙暖光
  ctx.fillStyle = "#E8E3DA";
  ctx.fillRect(W * 0.28, H * 0.18, W * 0.48, H * 0.58);
  // 地面透视斜影
  ctx.fillStyle = "#9FBEB3";
  ctx.beginPath();
  ctx.moveTo(W * 0.28, H * 0.76);
  ctx.lineTo(W * 0.76, H * 0.76);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  // 深松青混凝土门廊拱洞
  ctx.fillStyle = "#19393C";
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.moveTo(W * 0.32, H * 0.78);
  ctx.lineTo(W * 0.32, H * 0.44);
  ctx.arc(W * 0.54, H * 0.44, W * 0.22, Math.PI, 0, false);
  ctx.lineTo(W * 0.76, H * 0.78);
  ctx.closePath();
  ctx.fill("evenodd");
  // 斜阳光斑
  ctx.fillStyle = "rgba(232, 227, 218, 0.75)";
  ctx.beginPath();
  ctx.moveTo(W * 0.32, H * 0.58);
  ctx.lineTo(W * 0.68, H * 0.38);
  ctx.lineTo(W * 0.76, H * 0.68);
  ctx.lineTo(W * 0.42, H * 0.88);
  ctx.closePath();
  ctx.fill();
  // 台阶细线
  ctx.strokeStyle = "#2B4249";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const y = H * (0.76 + i * 0.055);
    ctx.beginPath();
    ctx.moveTo(W * (0.28 - i * 0.05), y);
    ctx.lineTo(W * (0.76 + i * 0.05), y);
    ctx.stroke();
  }
}

// ---------- 03 节：窗数与主次压测（深松青暗房内 2D Canvas 视线落点模拟） ----------
export function buildStressLayout(count, unequal) {
  if (count === 1) {
    return [{ x: 0.14, y: 0.12, w: 0.72, h: 0.74, shape: "rounded" }];
  }
  if (count === 2) {
    return unequal
      ? [
          { x: 0.08, y: 0.08, w: 0.62, h: 0.76, shape: "rounded" },
          { x: 0.74, y: 0.34, w: 0.18, h: 0.50, shape: "arch" },
        ]
      : [
          { x: 0.08, y: 0.14, w: 0.39, h: 0.70, shape: "rounded" },
          { x: 0.53, y: 0.14, w: 0.39, h: 0.70, shape: "rounded" },
        ];
  }
  if (count === 3) {
    return unequal
      ? [
          { x: 0.07, y: 0.08, w: 0.56, h: 0.80, shape: "rounded" },
          { x: 0.67, y: 0.08, w: 0.26, h: 0.38, shape: "arch" },
          { x: 0.67, y: 0.52, w: 0.26, h: 0.36, shape: "strip" },
        ]
      : [
          { x: 0.06, y: 0.18, w: 0.26, h: 0.62, shape: "rounded" },
          { x: 0.37, y: 0.18, w: 0.26, h: 0.62, shape: "rounded" },
          { x: 0.68, y: 0.18, w: 0.26, h: 0.62, shape: "rounded" },
        ];
  }
  if (count === 4) {
    return unequal
      ? [
          { x: 0.07, y: 0.07, w: 0.56, h: 0.58, shape: "rounded" },
          { x: 0.67, y: 0.07, w: 0.26, h: 0.34, shape: "arch" },
          { x: 0.67, y: 0.45, w: 0.26, h: 0.20, shape: "rounded" },
          { x: 0.07, y: 0.71, w: 0.72, h: 0.19, shape: "strip" },
        ]
      : [
          { x: 0.08, y: 0.08, w: 0.39, h: 0.39, shape: "rounded" },
          { x: 0.53, y: 0.08, w: 0.39, h: 0.39, shape: "rounded" },
          { x: 0.08, y: 0.53, w: 0.39, h: 0.39, shape: "rounded" },
          { x: 0.53, y: 0.53, w: 0.39, h: 0.39, shape: "rounded" },
        ];
  }
  if (count === 6) {
    if (unequal) {
      return [
        { x: 0.06, y: 0.07, w: 0.44, h: 0.46, shape: "rounded" },
        { x: 0.54, y: 0.07, w: 0.18, h: 0.21, shape: "rounded" },
        { x: 0.76, y: 0.07, w: 0.18, h: 0.21, shape: "rounded" },
        { x: 0.54, y: 0.32, w: 0.40, h: 0.21, shape: "strip" },
        { x: 0.06, y: 0.59, w: 0.42, h: 0.32, shape: "rounded" },
        { x: 0.52, y: 0.59, w: 0.42, h: 0.32, shape: "rounded" },
      ];
    }
    const out = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        out.push({ x: 0.06 + c * 0.305, y: 0.10 + r * 0.42, w: 0.27, h: 0.36, shape: "rounded" });
      }
    }
    return out;
  }
  // 9 扇
  const out = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const big = unequal && r === 0 && c === 0;
      out.push({
        x: 0.06 + c * 0.305,
        y: 0.07 + r * 0.295,
        w: big ? 0.28 : 0.255,
        h: big ? 0.26 : 0.24,
        shape: "rounded",
      });
    }
  }
  return out;
}

export function renderStressCanvas(canvas, count, unequal, t) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // 暗房里的青灰墙板
  ctx.fillStyle = "#E6E9E8";
  ctx.fillRect(0, 0, W, H);

  const wins = buildStressLayout(count, unequal);
  const areas = wins.map((w) => w.w * w.h);
  const sorted = [...areas].sort((a, b) => b - a);
  const ratio = count === 1 ? Infinity : sorted[0] / (sorted[1] || 0.001);
  const cleanHierarchy = count <= 4 && (count === 1 || ratio >= 1.65);

  // 缓存连续山水底图，避免每帧重绘导致慢机掉帧
  if (!canvas.__bgCache || canvas.__bgCache.width !== W || canvas.__bgCache.height !== H) {
    const bg = document.createElement("canvas");
    bg.width = W;
    bg.height = H;
    paintHeroLandscape(bg.getContext("2d"), W, H);
    canvas.__bgCache = bg;
  }
  const bg = canvas.__bgCache;

  for (let i = 0; i < wins.length; i++) {
    const w = wins[i];
    ctx.save();
    traceWindowPath(ctx, w, W, H);
    ctx.clip();
    ctx.drawImage(bg, 0, 0, W, H);
    ctx.strokeStyle = "rgba(18, 42, 45, 0.28)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  // 绘制模拟视线落点与路径（明确标「示意」）
  const ranked = wins
    .map((w, i) => ({
      cx: (w.x + w.w / 2) * W,
      cy: (w.y + w.h / 2) * H,
      area: areas[i],
    }))
    .sort((a, b) => b.area - a.area);

  ctx.save();
  if (cleanHierarchy) {
    // 清晰有序的 1 → 2 → 3 主次视线流
    if (ranked.length >= 2) {
      ctx.strokeStyle = "#19393C";
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -(t * 22);
      ctx.beginPath();
      ctx.moveTo(ranked[0].cx, ranked[0].cy);
      for (let i = 1; i < ranked.length; i++) ctx.lineTo(ranked[i].cx, ranked[i].cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ranked.forEach((p, idx) => {
      const r = idx === 0 ? Math.max(15, W * 0.032) : Math.max(11, W * 0.022);
      ctx.fillStyle = idx === 0 ? "#19393C" : "#367876";
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#E8E3DA";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#F2F4F3";
      ctx.font = `700 ${Math.max(11, Math.round(r * 0.9))}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), p.cx, p.cy + 1);
    });
  } else {
    // 散焦弹跳示意（红褐短折线与等大脉冲圈，表示无主次）
    ctx.strokeStyle = "rgba(154, 59, 45, 0.72)";
    ctx.lineWidth = Math.max(1.8, W * 0.0032);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < ranked.length; i++) {
      const a = ranked[i];
      const b = ranked[(i + 2) % ranked.length];
      ctx.moveTo(a.cx, a.cy);
      ctx.lineTo(b.cx, b.cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ranked.forEach((p, idx) => {
      const r = Math.max(10, W * 0.022) + (idx % 2 === 0 ? pulse * 2.5 : (1 - pulse) * 2.5);
      ctx.fillStyle = "rgba(154, 59, 45, 0.86)";
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#F2F4F3";
      ctx.font = `700 ${Math.max(10, Math.round(W * 0.02))}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", p.cx, p.cy + 1);
    });
  }
  ctx.restore();

  return { count, ratio, cleanHierarchy };
}
