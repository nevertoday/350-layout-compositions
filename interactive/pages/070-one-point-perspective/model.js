// 070 一点透视 · 单真源 3D 针孔投影与诊断模型
// 所有画面投影、延长检验线、面积配比与读数全部出自同一组三维坐标与方程，零写死常量。

export const CORRIDOR = {
  halfW: 1.0,      // 廊道半宽 X ∈ [-1, 1]
  halfH: 0.78,     // 廊道半高 Y ∈ [-0.78, 0.78]
  zNear: 1.12,     // 画框近端截面
  zFar: 7.4,       // 廊道尽头端面
  tileCount: 8,    // 纵深地砖格数
  colCount: 4,     // 横向地砖列数
};

export const TOL = {
  benchDeg: 2.2,
  doorPct: 2.5,
  pedestalDeg: 2.5,
  vpMin: 0.22,
  vpMax: 0.78,
};

export const SCENES = {
  poster: {
    id: "poster",
    name: "原海报长廊",
    benchLabel: "左墙长凳",
    doorLabel: "右墙红门",
    pedestalLabel: "前景展台",
    bgWall: "#F0E9DE",
    floorBg: "#F2EAE1",
    leftWall: "#E54616",
    rightWall: "#F2EBE2",
    doorFill: "#E74513",
    accent: "#E54616",
    ink: "#0F0F0F",
    ceilingTiles: "#0F0F0F",
  },
  supper: {
    id: "supper",
    name: "教堂餐室",
    benchLabel: "左墙挂毯台",
    doorLabel: "右墙高窗",
    pedestalLabel: "前景餐桌角",
    bgWall: "#EFE6D8",
    floorBg: "#E9DFCF",
    leftWall: "#C84B24",
    rightWall: "#ECE3D5",
    doorFill: "#2A2420",
    accent: "#E54616",
    ink: "#171412",
    ceilingTiles: "#26211D",
  },
  metro: {
    id: "metro",
    name: "地铁站厅",
    benchLabel: "左墙灯箱椅",
    doorLabel: "右墙出站口",
    pedestalLabel: "前景立柱墩",
    bgWall: "#ECEAE4",
    floorBg: "#E5E2DC",
    leftWall: "#D94418",
    rightWall: "#EFECE6",
    doorFill: "#E54616",
    accent: "#E54616",
    ink: "#101214",
    ceilingTiles: "#16181A",
  },
};

export function createInitialState() {
  return {
    scene: "poster",
    vpX: 0.54,             // 原海报消失点略偏中右
    vpY: 0.50,             // 平视视平线
    benchAngleDeg: 14,     // 错态1：左凳纵深棱线向上漂移 +14°（未聚同点）
    doorHorizonOffset: 18, // 错态2：右门落到下方 +18% 的错视平线（视平线混乱）
    pedestalYawDeg: 20,    // 错态3：前景展台偏航 +20°（透视方向不一致）
    floorMode: "perspective", // "perspective" | "uniform" | "reverse"
    foregroundScale: "normal", // "normal" | "large" | "shrunk"
    activeTarget: "bench", // "bench" | "door" | "pedestal" | "vp"
    highlightLayer: null,  // null | "vp" | "focus" | "depth" | "convergence"
    showGuides: true,
    introProgress: 0,
  };
}

export const PRESETS = {
  broken: {
    label: "复原 0/3 错态",
    vpX: 0.54,
    vpY: 0.50,
    benchAngleDeg: 14,
    doorHorizonOffset: 18,
    pedestalYawDeg: 20,
    floorMode: "perspective",
    foregroundScale: "normal",
    activeTarget: "bench",
  },
  poster: {
    label: "原海报正中解",
    vpX: 0.54,
    vpY: 0.50,
    benchAngleDeg: 0,
    doorHorizonOffset: 0,
    pedestalYawDeg: 0,
    floorMode: "perspective",
    foregroundScale: "normal",
    activeTarget: "vp",
  },
  highEye: {
    label: "高视平俯视解",
    vpX: 0.50,
    vpY: 0.68,
    benchAngleDeg: 0,
    doorHorizonOffset: 0,
    pedestalYawDeg: 0,
    floorMode: "perspective",
    foregroundScale: "normal",
    activeTarget: "vp",
  },
  lowEye: {
    label: "低视平仰视解",
    vpX: 0.50,
    vpY: 0.30,
    benchAngleDeg: 0,
    doorHorizonOffset: 0,
    pedestalYawDeg: 0,
    floorMode: "perspective",
    foregroundScale: "large",
    activeTarget: "vp",
  },
  offCenter: {
    label: "偏心动态解",
    vpX: 0.34,
    vpY: 0.48,
    benchAngleDeg: 0,
    doorHorizonOffset: 0,
    pedestalYawDeg: 0,
    floorMode: "perspective",
    foregroundScale: "normal",
    activeTarget: "vp",
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 由当前画布宽高与 state 构造统一 3D 针孔相机投影器
export function makeCamera(state, w, h) {
  const vpPx = { x: state.vpX * w, y: state.vpY * h };
  // 观者始终位于走廊内部，移动消失点相当于在走廊截面上平移机位
  const eyeX = (0.5 - state.vpX) * 0.92;
  const eyeY = (0.5 - state.vpY) * 0.72;
  // 等比焦距：用宽高综合但保持 X/Y 同比例，保证正方形端面在 390/844/1440/2560 都不变形
  const focal = Math.min(w * 0.58, h * 0.86);

  function project(x, y, z, customVp = null) {
    const vp = customVp || vpPx;
    const zEff = Math.max(0.25, z);
    const scale = focal / zEff;
    return {
      x: vp.x + (x - eyeX) * scale,
      y: vp.y - (y - eyeY) * scale,
      scale,
    };
  }

  // 反透视/伪等距地面 z 值映射（用于压测和真实 1/z 对比）
  function tileZ(i) {
    const n = CORRIDOR.tileCount;
    const t = i / n;
    if (state.floorMode === "perspective") {
      // 真实等距物理格子：z 均匀增加，投影后自然形成 1/z 近疏远密
      return CORRIDOR.zNear + t * (CORRIDOR.zFar - CORRIDOR.zNear);
    }
    if (state.floorMode === "uniform") {
      // 屏幕等距伪透视：反解 z 使得屏幕 y 均匀平分
      const invNear = 1 / CORRIDOR.zNear;
      const invFar = 1 / CORRIDOR.zFar;
      const invZ = invNear + t * (invFar - invNear);
      return 1 / invZ;
    }
    // reverse：越远间隔越大（反透视倒张）
    const invNear = 1 / CORRIDOR.zNear;
    const invFar = 1 / CORRIDOR.zFar;
    const invZ = invNear + Math.pow(t, 0.52) * (invFar - invNear);
    return 1 / invZ;
  }

  // 计算给定方向偏角（相对主消失点）下，长凳纵深棱线指向的错消失点
  function benchVanishingPoint() {
    if (Math.abs(state.benchAngleDeg) < 0.05) return { ...vpPx };
    const rad = (state.benchAngleDeg * Math.PI) / 180;
    const dist = Math.min(w, h) * 0.56;
    return {
      x: vpPx.x + Math.sin(rad) * dist * 0.45,
      y: vpPx.y - Math.tan(rad) * dist * 0.88,
    };
  }

  // 右墙红门纵深棱线所指向的消失点（独立错视平线）
  function doorVanishingPoint() {
    return {
      x: vpPx.x,
      y: vpPx.y + (state.doorHorizonOffset / 100) * h,
    };
  }

  // 根据近端 3D 截面点与指定消失点，按真实 1/z 缩放比推进到远端 z2
  function extrudeToward(pNear2d, z1, z2, vpTarget) {
    const ratio = state.floorMode === "reverse"
      ? 1 + (z2 - z1) * 0.06
      : z1 / z2;
    return {
      x: vpTarget.x + (pNear2d.x - vpTarget.x) * ratio,
      y: vpTarget.y + (pNear2d.y - vpTarget.y) * ratio,
    };
  }

  // 计算走廊各真实构件投影多边形（同时用于绘制、命中检测、诊断单真源）
  const { halfW, halfH, zNear, zFar } = CORRIDOR;

  // 1) 走廊四个角（近端与远端）
  const backTL = project(-halfW, halfH, zFar);
  const backTR = project(halfW, halfH, zFar);
  const backBR = project(halfW, -halfH, zFar);
  const backBL = project(-halfW, -halfH, zFar);

  const nearTL = project(-halfW, halfH, zNear);
  const nearTR = project(halfW, halfH, zNear);
  const nearBR = project(halfW, -halfH, zNear);
  const nearBL = project(-halfW, -halfH, zNear);

  // 2) 构件 A：左墙落地长凳（z: 1.55 -> 4.35, x: -1.0 -> -0.66, y: -0.78 -> -0.45）
  const benchVp = benchVanishingPoint();
  const bz1 = 1.55;
  const bz2 = 4.35;
  const bFrontTL = project(-halfW, -0.46, bz1);
  const bFrontTR = project(-0.66, -0.46, bz1);
  const bFrontBR = project(-0.66, -halfH, bz1);
  const bFrontBL = project(-halfW, -halfH, bz1);
  const bBackTL = extrudeToward(bFrontTL, bz1, bz2, benchVp);
  const bBackTR = extrudeToward(bFrontTR, bz1, bz2, benchVp);
  const bBackBR = extrudeToward(bFrontBR, bz1, bz2, benchVp);
  const bBackBL = extrudeToward(bFrontBL, bz1, bz2, benchVp);

  // 3) 构件 B：右墙朱红高门（z: 1.52 -> 2.72, x: +1.0, y: -0.78 -> +0.52）
  const doorVp = doorVanishingPoint();
  const dz1 = 1.52;
  const dz2 = 2.75;
  const dNearTop = project(halfW, 0.50, dz1);
  const dNearBot = project(halfW, -halfH, dz1);
  const dFarTop = extrudeToward(dNearTop, dz1, dz2, doorVp);
  const dFarBot = extrudeToward(dNearBot, dz1, dz2, doorVp);

  // 4) 构件 C：前景展台/立柱墩（走廊右偏中前区，用于演示物体透视方向一致 & 前景尺子）
  const fgMul = state.foregroundScale === "large" ? 1.32 : state.foregroundScale === "shrunk" ? 0.54 : 1.0;
  const pW = 0.24 * fgMul;
  const pH = 0.34 * fgMul;
  const pD = 0.42 * fgMul;
  const pcx = 0.26;
  const pcz = 2.25;
  const pBaseY = -halfH;
  const yaw = (state.pedestalYawDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  // 伴随偏航的轻微歪立（模拟手画透视方向失控时的立边歪斜）
  const tilt = (state.pedestalYawDeg / 32) * 0.065;

  function pedCorner(lx, ly, lz) {
    const rx = lx * cosY - lz * sinY;
    const rz = lx * sinY + lz * cosY;
    const tx = rx + (ly / Math.max(0.1, pH)) * tilt;
    return project(pcx + tx, pBaseY + ly, pcz + rz);
  }

  const ped = {
    fBL: pedCorner(-pW / 2, 0, -pD / 2),
    fBR: pedCorner(pW / 2, 0, -pD / 2),
    fTR: pedCorner(pW / 2, pH, -pD / 2),
    fTL: pedCorner(-pW / 2, pH, -pD / 2),
    bBL: pedCorner(-pW / 2, 0, pD / 2),
    bBR: pedCorner(pW / 2, 0, pD / 2),
    bTR: pedCorner(pW / 2, pH, pD / 2),
    bTL: pedCorner(-pW / 2, pH, pD / 2),
    // 展台右侧深棱线的真实消失点（当 yaw != 0 时分裂出水平偏离灭点！）
    sideVp: Math.abs(yaw) > 0.005
      ? {
          x: vpPx.x + Math.tan(-yaw) * focal,
          y: vpPx.y,
        }
      : { ...vpPx },
  };

  // 计算实测天花/地面屏幕面积占比（由真实投影多边形高估算）
  const ceilHeight = Math.max(1, backTL.y);
  const floorHeight = Math.max(1, h - backBL.y);
  const totalCF = ceilHeight + floorHeight;
  const ceilingShare = Math.round((ceilHeight / totalCF) * 100);
  const floorShare = 100 - ceilingShare;

  // 近端与远端门高实测纵深倍率（严格来自同一针孔投影）
  const nearSpan = Math.abs(nearBL.y - nearTL.y);
  const farSpan = Math.max(1, Math.abs(backBL.y - backTL.y));
  const depthRatio = +(nearSpan / farSpan).toFixed(1);

  return {
    w,
    h,
    focal,
    eyeX,
    eyeY,
    vpPx,
    project,
    tileZ,
    extrudeToward,
    corridor: { nearTL, nearTR, nearBR, nearBL, backTL, backTR, backBR, backBL },
    bench: {
      vp: benchVp,
      front: [bFrontTL, bFrontTR, bFrontBR, bFrontBL],
      top: [bFrontTL, bFrontTR, bBackTR, bBackTL],
      side: [bFrontTR, bBackTR, bBackBR, bFrontBR],
      center: {
        x: (bFrontTR.x + bBackTR.x) * 0.5,
        y: (bFrontTR.y + bBackTR.y) * 0.5,
      },
      handle: {
        x: bBackTR.x,
        y: bBackTR.y,
      },
    },
    door: {
      vp: doorVp,
      poly: [dNearTop, dFarTop, dFarBot, dNearBot],
      center: {
        x: (dNearTop.x + dFarTop.x) * 0.5,
        y: (dNearTop.y + dFarBot.y) * 0.5,
      },
      handle: {
        x: dFarTop.x,
        y: dFarTop.y,
      },
    },
    pedestal: {
      ...ped,
      center: {
        x: (ped.fTL.x + ped.fBR.x) * 0.5,
        y: (ped.fTL.y + ped.fBR.y) * 0.5,
      },
      handle: {
        x: ped.bTR.x,
        y: ped.bTR.y,
      },
    },
    metrics: {
      ceilingShare,
      floorShare,
      depthRatio,
    },
  };
}

// 单真源诊断：完全从 state 与真实相机几何计算 7 类错态、多组合法解与四柱原理带状态
export function diagnose(state) {
  const cam = makeCamera(state, 960, 620);
  const sc = SCENES[state.scene] || SCENES.poster;

  const benchOk = Math.abs(state.benchAngleDeg) <= TOL.benchDeg;
  const doorOk = Math.abs(state.doorHorizonOffset) <= TOL.doorPct;
  const pedOk = Math.abs(state.pedestalYawDeg) <= TOL.pedestalDeg;
  const floorOk = state.floorMode === "perspective";
  const fgOk = state.foregroundScale !== "shrunk";
  const vpInSafe =
    state.vpX >= TOL.vpMin &&
    state.vpX <= TOL.vpMax &&
    state.vpY >= TOL.vpMin &&
    state.vpY <= TOL.vpMax;

  const alignedCount = (benchOk ? 1 : 0) + (doorOk ? 1 : 0) + (pedOk ? 1 : 0);
  const allOk = benchOk && doorOk && pedOk && floorOk && fgOk && vpInSafe;

  // 视高情绪读数（贴合原海报「实用小贴士」）
  let eyeMood = "平视稳定";
  if (state.vpY >= 0.60) eyeMood = "俯视开阔";
  else if (state.vpY <= 0.40) eyeMood = "仰视宏阔";

  let symmetryMood = "居中对称";
  if (state.vpX < 0.43) symmetryMood = "偏左动势";
  else if (state.vpX > 0.59) symmetryMood = "偏右张力";

  let errorKind = "ok";
  let badge = "成立 · 全聚一点";
  let headline = "";
  let body = "";
  let hint = "";
  let solutionName = "";

  if (state.floorMode === "reverse") {
    errorKind = "reverse";
    badge = "错态 · 反透视倒张";
    headline = "远端反比近端更张开，走廊像朝脸上倒扣";
    body = "地面网格违背近大远小而越往深处越宽，大脑接收到的深度信号彻底倒置，空间不再向里退进，反而像折纸往画外翻出。";
    hint = "把地砖压测切回「真实 1/z 透视」，恢复随距离自然收紧的深度节拍。";
  } else if (state.floorMode === "uniform") {
    errorKind = "uniform";
    badge = "错态 · 地砖伪等距";
    headline = "地砖横缝均匀平铺，走廊被拍扁成一面竖墙";
    body = "虽然左右墙线指向了消失点，但地面横缝在画布上等宽排列，违背真实针孔投影的 1/z 压缩律——眼睛会觉得地板立了起来，而不是向深处平躺。";
    hint = "把地砖切回「真实 1/z 透视」，观察地砖从近到远逐格变密。";
  } else if (!fgOk) {
    errorKind = "shrunk";
    badge = "错态 · 前景失重";
    headline = "前景展台缩得太小，失去了近景尺度标尺";
    body = "原海报小贴士强调「前景物体越大，越能强化空间的深度感」。当前前景块缩到 0.54×，和远端墙洞拉不开尺差，整条走廊瞬间发平。";
    hint = "把前景尺度切回「标准 1.0×」或「放大 1.3×」，立住近景参照物。";
  } else if (!vpInSafe) {
    errorKind = "edge";
    badge = "错态 · 灭点逼边";
    headline = `消失点贴近画框边缘（${Math.round(state.vpX * 100)}%, ${Math.round(state.vpY * 100)}%），一侧墙面极度拉扁`;
    body = "消失点一旦挤出 22%–78% 舒适构图区，靠边那面墙会被压缩成一条几乎看不清细节的锐角斜缝，强向心聚焦感也随之泄掉。";
    hint = "拖动尽头朱红消失点回到画幅中段，或试按预设里的「偏心动态解」。";
  } else if (!benchOk) {
    errorKind = "bench";
    const dir = state.benchAngleDeg > 0 ? "向上翘偏" : "向下塌偏";
    const absDeg = Math.abs(state.benchAngleDeg).toFixed(1);
    badge = `错态 · 脱靶 ${absDeg}° (${alignedCount}/3)`;
    headline = `${sc.benchLabel}纵深线${dir} ${absDeg}°，没有汇聚到主消失点`;
    body = "一条走廊里所有平行朝前延伸的棱线，必须严丝合缝交在同一点。现在它的延长红线擦过了尽头圆点，人眼立刻觉得长凳漂浮翘起、和地板脱了胶。";
    hint = `在画布上选中并左右拖动「${sc.benchLabel}」（或调下方滑轨），把红虚线扳回尽头朱红消失点。`;
  } else if (!doorOk) {
    const dir = state.doorHorizonOffset > 0 ? "偏低" : "偏高";
    const absPct = Math.abs(state.doorHorizonOffset).toFixed(0);
    errorKind = "door";
    badge = `错态 · 视平分裂 (${alignedCount}/3)`;
    headline = `${sc.doorLabel}掉进了${dir} ${absPct}% 的第二条视平线`;
    body = "同一观者在同一时刻只有一双眼睛的高度，即只有一条视平线。红门上下沿收束到别的高度，会让整扇门看起来正在沿着墙面斜向下坠或上飘。";
    hint = `点选「${sc.doorLabel}」并左右拖动，把它的红色门楣延长线抬回水平视平线与主消失点。`;
  } else if (!pedOk) {
    const absDeg = Math.abs(state.pedestalYawDeg).toFixed(1);
    errorKind = "pedestal";
    badge = `错态 · 方向错位 (${alignedCount}/3)`;
    headline = `${sc.pedestalLabel}偏航 ${absDeg}°，在廊道里冒出了冲突的第二灭点`;
    body = "一点透视的秩序来自正面平行画框、纵深同向收束。这件孤立展台偷偷扭歪了朝向还带着歪立边，视觉上像从另一张斜角画里硬抠贴进来的。";
    hint = `点选「${sc.pedestalLabel}」并横向拖动，把它的正面掰正水平、纵深棱线重新对齐主消失点。`;
  } else {
    // 全部成立！按光学站位识别多组正当解
    if (state.vpY >= 0.60) {
      solutionName = "高视平俯视解";
      headline = "高视平线俯视成立：地面铺展占主导，空间一览无余";
      body = `全部构件精准汇入单一消失点。视平线抬到 ${Math.round(state.vpY * 100)}%，地面占比升至 ${cam.metrics.floorShare}%、天花收至 ${cam.metrics.ceilingShare}%，观众像站在廊桥高处向下鸟瞰整条通道。`;
    } else if (state.vpY <= 0.40) {
      solutionName = "低视平仰视解";
      headline = "低视平线仰视成立：天花压顶推进，建筑气势瞬间拉高";
      body = `全部构件齐聚一点。视平线压低至 ${Math.round(state.vpY * 100)}%，天花占比扩至 ${cam.metrics.ceilingShare}%、地面收窄到 ${cam.metrics.floorShare}%，廊道呈现出接近纪念碑或电影低机位的仰望张力。`;
    } else if (Math.abs(state.vpX - 0.52) > 0.10) {
      solutionName = "偏心动态廊道解";
      headline = "偏心一点透视成立：保住单灭点秩序，又腾出大面积侧墙叙事";
      body = `消失点挪到水平 ${Math.round(state.vpX * 100)}% 处，一侧墙面拉开更宽的展示面积，打破纯中轴的刻板感，但所有纵深线仍严密锁死在同一点上。`;
    } else if (state.foregroundScale === "large") {
      solutionName = "前景强化纵深解";
      headline = "前景放大纵深解成立：近大远小尺差把走廊拉得更深";
      body = `三件构件全齐，同时前景展台放大到 1.32× 形成强烈的近景门框参照，肉眼对 ${cam.metrics.depthRatio}× 进深纵深的感知明显增强。`;
    } else {
      solutionName = "原海报正中稳定解";
      headline = "一点透视秩序成立：三件构件严密归位，视线直贯尽头";
      body = `所有纵深平行线在 (${Math.round(state.vpX * 100)}%, ${Math.round(state.vpY * 100)}%) 处零分叉交会，正面横竖线严格水平垂直。现在试着上下或左右拖动尽头红点，看全员如何实时跟随联动。`;
    }
    badge = `成立 · ${solutionName} (3/3)`;
    hint = "已全部对齐！可继续拖动尽头朱红消失点体验高俯视 / 低仰视 / 偏心解，或切「教堂餐室 / 地铁站厅」验证。";
  }

  // 原海报纯黑四柱原理带的实时状态（完全单真源）
  const unaligned = 3 - alignedCount;
  const maxErrText = !benchOk
    ? `长凳偏 ${Math.abs(state.benchAngleDeg).toFixed(0)}°`
    : !doorOk
      ? `红门差 ${Math.abs(state.doorHorizonOffset).toFixed(0)}%`
      : !pedOk
        ? `展台偏 ${Math.abs(state.pedestalYawDeg).toFixed(0)}°`
        : "0° 零分叉";

  const pillars = {
    vp: {
      ok: alignedCount === 3 && floorOk,
      status: alignedCount === 3 ? "全聚一点" : `${unaligned} 处脱靶`,
    },
    focus: {
      ok: vpInSafe && alignedCount === 3,
      status: vpInSafe ? `${symmetryMood} · ${eyeMood}` : "灭点贴边",
    },
    depth: {
      ok: floorOk && fgOk,
      status: !floorOk
        ? (state.floorMode === "reverse" ? "反透视倒张" : "伪等距塌陷")
        : !fgOk
          ? "前景失重"
          : `纵深 ${cam.metrics.depthRatio}×`,
    },
    convergence: {
      ok: allOk,
      status: allOk ? "秩序锁定" : maxErrText,
    },
  };

  return {
    allOk,
    alignedCount,
    checks: { benchOk, doorOk, pedOk, floorOk, fgOk, vpInSafe },
    errorKind,
    badge,
    headline,
    body,
    hint,
    solutionName,
    eyeMood,
    symmetryMood,
    metrics: cam.metrics,
    pillars,
  };
}
