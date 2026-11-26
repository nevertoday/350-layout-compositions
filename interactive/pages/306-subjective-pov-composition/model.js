// 306 主观视角构图 · 单真源几何与光学判定模型
// 所有画面绘制、几何读数、五枚原海报探针、五列关键要点与白话诊单均由此模块统一算出。

export const SCENES = {
  cabin: {
    id: "cabin",
    label: "原海报 · 看海木屋",
    shortLabel: "看海木屋",
    en: "COASTAL CABIN",
    noteLines: ["今天，", "去看海。"],
    subjectName: "远岸灯塔",
    fgName: "捧杯双手",
    frameName: "木屋门框",
    envHint: "昏暗木屋推门望向海面与灯塔",
    subjectWorld: { x: 0.16, y: -0.04, w: 0.17, h: 0.42 },
  },
  corridor: {
    id: "corridor",
    label: "悬疑 · 暗廊推门",
    shortLabel: "暗廊推门",
    en: "NIGHT CORRIDOR",
    noteLines: ["306 室", "勿开链锁"],
    subjectName: "敞开红箱与长影",
    fgName: "扶门手指",
    frameName: "防盗门缝",
    envHint: "夜色走廊透过虚掩门缝窥见可疑皮箱",
    subjectWorld: { x: 0.12, y: 0.04, w: 0.22, h: 0.36 },
  },
  train: {
    id: "train",
    label: "清晨 · 车窗出站",
    shortLabel: "车窗出站",
    en: "MORNING TRAIN",
    noteLines: ["海滨线", "07:18 发"],
    subjectName: "海湾车站塔楼",
    fgName: "窗台热饮",
    frameName: "车厢窗框",
    envHint: "清晨列车靠窗远眺出站海湾与站塔",
    subjectWorld: { x: 0.15, y: -0.03, w: 0.19, h: 0.39 },
  },
};

export const MOODS = {
  calm: {
    id: "calm",
    label: "平静呼吸",
    en: "CALM BREATH",
    swayAmp: 0.0045,
    swayFreq: 0.85,
    vignette: 0.12,
    tiltDeg: 0,
    note: "平稳缓慢的呼吸节奏，让视野像静立片刻的真实凝视。",
  },
  tense: {
    id: "tense",
    label: "屏息收束",
    en: "HELD BREATH",
    swayAmp: 0.0022,
    swayFreq: 1.9,
    vignette: 0.34,
    tiltDeg: -1.4,
    note: "暗角收紧、微幅急促心跳感，把注意压向缝隙中央。",
  },
  dizzy: {
    id: "dizzy",
    label: "眩晕摇晃",
    en: "VERTIGO SWAY",
    swayAmp: 0.014,
    swayFreq: 1.35,
    vignette: 0.28,
    tiltDeg: 5.5,
    note: "水平微倾与晃动步态，直接用光学失衡交代角色的不安。",
  },
};

// 开场刻意停在 0/4 复合破局态：
// 1. eyeDetach = 0.56（机位退在角色背后，漏出自己暗影背影 → 不再是第一人称入眼）
// 2. yaw = -30°（头偏向左侧木门，远岸灯塔被门框切出右沿 → 看什么失焦）
// 3. doorOpen = 18°（门仅开一道窄缝，暗墙压死七成以上画面 → 看到多少受阻）
// 4. handsHeight = 0（前景捧杯双手缺失 → 失去第一人称身体锚点）
export const INITIAL_STATE = {
  scene: "cabin",
  yaw: -26,
  pitch: 2,
  doorOpen: 18,
  eyeDetach: 0.56,
  handsHeight: 0,
  focalMm: 45,
  mood: "calm",
  focusLayer: null, // 'pov' | 'immersion' | 'frame' | 'focus' | 'info' | null
};

// 多组合法 4/4 解，证明并非只有单一固定参数
export const VALID_PRESETS = {
  poster: {
    id: "poster",
    label: "原海报 · 经典推门解",
    shortLabel: "原海报经典解",
    patch: { yaw: 2, pitch: 0, doorOpen: 58, eyeDetach: 0, handsHeight: 0.36, focalMm: 44, mood: "calm" },
  },
  peep: {
    id: "peep",
    label: "紧框 · 窥视悬念解",
    shortLabel: "紧框悬念解",
    patch: { yaw: 2, pitch: -1, doorOpen: 45, eyeDetach: 0, handsHeight: 0.30, focalMm: 48, mood: "tense" },
  },
  wide: {
    id: "wide",
    label: "开阔 · 舒展看海解",
    shortLabel: "开阔看海解",
    patch: { yaw: 0, pitch: 1, doorOpen: 74, eyeDetach: 0, handsHeight: 0.32, focalMm: 36, mood: "calm" },
  },
};

// 反向与边界试错样本（覆盖双向错态）
export const FAIL_PRESETS = {
  detach: {
    id: "detach",
    label: "退成旁观",
    patch: { yaw: 2, pitch: 0, doorOpen: 56, eyeDetach: 0.62, handsHeight: 0.34, focalMm: 44, mood: "calm" },
  },
  slit: {
    id: "slit",
    label: "门缝窒息",
    patch: { yaw: 2, pitch: 0, doorOpen: 14, eyeDetach: 0, handsHeight: 0.34, focalMm: 44, mood: "calm" },
  },
  noframe: {
    id: "noframe",
    label: "推门失框",
    patch: { yaw: 2, pitch: 0, doorOpen: 108, eyeDetach: 0, handsHeight: 0.34, focalMm: 34, mood: "calm" },
  },
  blocked: {
    id: "blocked",
    label: "举杯挡眼",
    patch: { yaw: 2, pitch: 0, doorOpen: 56, eyeDetach: 0, handsHeight: 0.88, focalMm: 44, mood: "calm" },
  },
  offgaze: {
    id: "offgaze",
    label: "偏头丢焦",
    patch: { yaw: -32, pitch: 2, doorOpen: 56, eyeDetach: 0, handsHeight: 0.34, focalMm: 44, mood: "calm" },
  },
};

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// 等效全画幅 36mm 水平视场角（真实光学公式）
export function focalToFovDeg(focalMm) {
  return (2 * Math.atan(36 / (2 * clamp(focalMm, 18, 120))) * 180) / Math.PI;
}

function rectIntersectArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}

// 依据当前状态与逻辑画布尺寸 W×H，计算所有实绘构件的精确投影几何与单真源评测
export function computeFrame(state, W = 800, H = 600) {
  const scene = SCENES[state.scene] || SCENES.cabin;
  const mood = MOODS[state.mood] || MOODS.calm;
  const focalMm = clamp(state.focalMm, 20, 90);
  const fovDeg = focalToFovDeg(focalMm);
  const zoomScale = focalMm / 44; // 44mm 近似人眼自然视角基准

  const yawRad = (clamp(state.yaw, -45, 45) * Math.PI) / 180;
  const pitchRad = (clamp(state.pitch, -18, 18) * Math.PI) / 180;
  const doorOpen = clamp(state.doorOpen, 10, 112); // 门扇开合角（度）
  const eyeDetach = clamp(state.eyeDetach, 0, 1); // 0 = 眼位重合，1 = 退成后背旁观
  const handsHeight = clamp(state.handsHeight, 0, 1); // 0 = 无前景，0.36 = 自然托杯，0.88 = 举杯挡眼

  // 透视视差：头向右转（yaw > 0）时，前景门洞与远景主体均向左移；
  // 因为灯塔位于门洞偏右的更远方位角，偏头过左时灯塔会被右门柱斜切出视野（真实 3D 视锥几何）
  const panNearX = -Math.tan(yawRad) * W * 0.48 * Math.min(1.18, zoomScale);
  const panFarX = -Math.tan(yawRad) * W * 0.72 * zoomScale;
  const panNearY = Math.tan(pitchRad) * H * 0.54;
  const panFarY = Math.tan(pitchRad) * H * 0.42 * zoomScale;

  // 门洞几何：原海报构图中门框略微左高右斜、占中央偏右；
  // 门开得越小（doorOpen 趋近 10°），门洞越窄；推门越宽（doorOpen > 92°）或广角迈出门外，暗框退到画外
  const openNorm = clamp((doorOpen - 10) / 96, 0, 1.06); // 0..1.06
  // 当 eyeDetach 变大（机位退回屋里），整个门洞向远处收缩
  const detachShrink = 1 - eyeDetach * 0.28;
  // 门洞在标准视野下的目标宽高
  const apW = W * (0.09 + openNorm * 0.94) * detachShrink * clamp(0.84 + (44 / focalMm) * 0.16, 0.72, 1.18);
  const apH = H * (0.64 + openNorm * 0.38) * detachShrink * clamp(0.86 + (44 / focalMm) * 0.14, 0.74, 1.16);

  // 门洞中心 X：原海报中左门板在左侧，门洞中心略偏右（0.52W），随推门增大向居中展开
  const apCenterX = W * (0.53 - openNorm * 0.03) + panNearX;
  const apCenterY = H * (0.47 - openNorm * 0.01) + panNearY;

  const apLeft = apCenterX - apW * 0.5;
  const apRight = apCenterX + apW * 0.5;
  const apTop = apCenterY - apH * 0.5;
  const apBottom = apCenterY + apH * 0.5;

  // 还原原海报微微左低右高的门框透视倾角（只在门框未完全消失时明显）
  const skew = clamp(1 - openNorm * 0.65, 0.15, 1) * H * 0.028;
  const aperturePoly = {
    tl: { x: apLeft, y: apTop + skew },
    tr: { x: apRight, y: apTop - skew * 0.75 },
    br: { x: apRight + W * 0.016 * (1 - openNorm * 0.7), y: apBottom + skew * 0.6 },
    bl: { x: apLeft - W * 0.008, y: apBottom - skew * 0.4 },
  };

  // 用于单真源精准核算的实绘可见门洞矩形（与画布边界裁交）
  const apRectRaw = {
    x: Math.max(0, Math.min(aperturePoly.tl.x, aperturePoly.bl.x)),
    y: Math.max(0, Math.min(aperturePoly.tl.y, aperturePoly.tr.y)),
    x2: Math.min(W, Math.max(aperturePoly.tr.x, aperturePoly.br.x)),
    y2: Math.min(H, Math.max(aperturePoly.bl.y, aperturePoly.br.y)),
  };
  const apRect = {
    x: apRectRaw.x,
    y: apRectRaw.y,
    w: Math.max(0, apRectRaw.x2 - apRectRaw.x),
    h: Math.max(0, apRectRaw.y2 - apRectRaw.y),
  };

  const canvasArea = W * H;
  const apertureArea = apRect.w * apRect.h;
  const frameRatio = clamp(1 - apertureArea / canvasArea, 0, 1);

  // 远景关键主体（灯塔 / 红箱长影 / 海湾站塔）的实绘投影包围盒
  const sw = scene.subjectWorld;
  const subjW = W * sw.w * zoomScale * detachShrink;
  const subjH = H * sw.h * zoomScale * detachShrink;
  const subjCx = W * (0.50 + sw.x) + panFarX;
  const subjCy = H * (0.50 + sw.y) + panFarY;
  const subjectRect = {
    x: subjCx - subjW * 0.5,
    y: subjCy - subjH * 0.5,
    w: subjW,
    h: subjH,
    cx: subjCx,
    cy: subjCy,
  };

  // 主体在门洞内的实际可见占比（直接由实绘主体框与实绘门洞框求交）
  const subjArea = Math.max(1, subjectRect.w * subjectRect.h);
  const subjInApertureArea = rectIntersectArea(subjectRect, apRect);
  const subjectVisibleRatio = clamp(subjInApertureArea / subjArea, 0, 1);

  // 主体中心到门洞左右沿的安全距离（相对门洞宽）
  const subjDistToLeft = apRect.w > 1 ? (subjectRect.cx - apRect.x) / apRect.w : -1;
  const subjDistToRight = apRect.w > 1 ? (apRect.x + apRect.w - subjectRect.cx) / apRect.w : -1;

  // 前景身体锚点（朱橙双手捧黑杯 / 扶门手 / 车窗热饮）的实绘包围盒
  const fgActive = handsHeight > 0.04;
  // 双手随微幅头部转动产生轻微反向视差（真实握在身前的感觉）
  const fgCx = W * 0.45 + panNearX * 0.14;
  const fgScale = 0.85 + handsHeight * 0.52;
  const fgW = fgActive ? W * 0.46 * fgScale : 0;
  const fgH = fgActive ? H * 0.29 * fgScale : 0;
  // handsHeight = 0.36 时，双手稳稳托在底沿上方（占画面底 22%，复刻原海报朱橙捧杯，不挡灯塔）；
  // handsHeight = 0.88 时，双手举到画面中央，直接盖死海面和灯塔！
  const fgTopY = fgActive ? H * (0.95 - handsHeight * 0.72) + panNearY * 0.18 : H + 60;
  const handsRect = {
    x: fgCx - fgW * 0.5,
    y: fgTopY,
    w: fgW,
    h: fgH,
    cx: fgCx,
    cy: fgTopY + fgH * 0.45,
    active: fgActive,
  };
  const handsOnScreenRect = {
    x: clamp(handsRect.x, 0, W),
    y: clamp(handsRect.y, 0, H),
    w: Math.max(0, Math.min(W, handsRect.x + handsRect.w) - clamp(handsRect.x, 0, W)),
    h: Math.max(0, Math.min(H, handsRect.y + handsRect.h) - clamp(handsRect.y, 0, H)),
  };
  const fgAreaRatio = fgActive ? clamp((handsOnScreenRect.w * handsOnScreenRect.h) / canvasArea, 0, 1) : 0;
  const fgCoverSubjectRatio = fgActive ? clamp(rectIntersectArea(handsOnScreenRect, subjectRect) / subjArea, 0, 1) : 0;

  // 若 eyeDetach > 0.04，机位退到角色脑后，画面左下/中央出现角色自己的暗影背影（无五官剪影）
  const observerVisible = eyeDetach > 0.04;
  const obsH = observerVisible ? H * (0.28 + eyeDetach * 0.44) : 0;
  const obsW = observerVisible ? W * (0.20 + eyeDetach * 0.24) : 0;
  const observerRect = {
    active: observerVisible,
    cx: W * (0.24 + eyeDetach * 0.08),
    topY: H - obsH + H * 0.04,
    w: obsW,
    h: obsH,
  };

  // 可拖动的门沿把手坐标（贴在右门框深炭木柱外缘，不遮挡门洞内远景灯塔）
  const doorHandle = {
    x: clamp((aperturePoly.tr.x + aperturePoly.br.x) * 0.5 + 10, W * 0.14, W - 14),
    y: clamp((aperturePoly.tr.y + aperturePoly.br.y) * 0.48, H * 0.24, H * 0.72),
    visible: frameRatio > 0.08,
  };

  // 地平线 Y（远景基准）
  const horizonY = H * 0.65 + panFarY;

  // ---------- 单真源四项双向核验 ----------
  // 规则 1：入眼纯度（角色视角 CHARACTER POV）
  let rPov = { ok: true, kind: "ok", tag: "眼位重合", value: `${Math.round(focalMm)}mm · 眼位` };
  if (eyeDetach > 0.08) {
    rPov = {
      ok: false,
      kind: "detached",
      tag: `退离 ${Math.round(eyeDetach * 100)}%`,
      value: `漏背影 ${Math.round(eyeDetach * 100)}%`,
    };
  } else if (focalMm < 28) {
    rPov = {
      ok: false,
      kind: "too_wide",
      tag: `超广 ${Math.round(focalMm)}mm`,
      value: `${Math.round(fovDeg)}° 畸变`,
    };
  } else if (focalMm > 68) {
    rPov = {
      ok: false,
      kind: "too_tele",
      tag: `长焦 ${Math.round(focalMm)}mm`,
      value: `${Math.round(fovDeg)}° 抽离`,
    };
  }

  // 规则 2：主体落域（看什么？ WHAT TO SHOW + 注意力聚焦）
  const visPct = Math.round(subjectVisibleRatio * 100);
  let rFocus = { ok: true, kind: "ok", tag: `完整 ${visPct}%`, value: `主体可见 ${visPct}%` };
  if (subjectVisibleRatio < 0.76) {
    const dir = subjectRect.cx > apRect.x + apRect.w * 0.5 ? "right" : "left";
    rFocus = {
      ok: false,
      kind: dir === "right" ? "clipped_right" : "clipped_left",
      tag: visPct < 20 ? "主体出框" : `切掉 ${100 - visPct}%`,
      value: `仅露 ${visPct}%`,
    };
  } else if (subjDistToLeft < 0.12 || subjDistToRight < 0.12) {
    rFocus = {
      ok: false,
      kind: "edge_pinch",
      tag: "贴压门柱",
      value: "主体擦边",
    };
  }

  // 规则 3：框中框开合（看到多少？ HOW MUCH + 框中框）
  const framePct = Math.round(frameRatio * 100);
  let rFrame = { ok: true, kind: "ok", tag: `框占 ${framePct}%`, value: `门开 ${Math.round(doorOpen)}° · 框 ${framePct}%` };
  if (frameRatio > 0.66) {
    rFrame = {
      ok: false,
      kind: "too_narrow",
      tag: `过窄 ${framePct}%`,
      value: `暗框压占 ${framePct}%`,
    };
  } else if (frameRatio < 0.24) {
    rFrame = {
      ok: false,
      kind: "too_open",
      tag: `失框 ${framePct}%`,
      value: `暗框仅余 ${framePct}%`,
    };
  }

  // 规则 4：前景身体锚点（代入感 IMMERSION + 如何构图？）
  const fgPct = Math.round(fgAreaRatio * 100);
  const coverPct = Math.round(fgCoverSubjectRatio * 100);
  let rAnchor = { ok: true, kind: "ok", tag: `锚点 ${fgPct}%`, value: `前景 ${fgPct}% · 零挡` };
  if (!fgActive || fgAreaRatio < 0.05) {
    rAnchor = {
      ok: false,
      kind: "no_anchor",
      tag: "无身体锚",
      value: "前景空白",
    };
  } else if (fgCoverSubjectRatio >= 0.12 || handsHeight > 0.68) {
    rAnchor = {
      ok: false,
      kind: "fg_blocks",
      tag: `挡主体 ${Math.max(coverPct, 15)}%`,
      value: `遮挡 ${Math.max(coverPct, 15)}%`,
    };
  }

  const checks = [rPov, rFocus, rFrame, rAnchor];
  const score = checks.filter((c) => c.ok).length;

  // 按严重程度排序给出最首要的白话诊断（讲清「为什么观众出戏」与「怎么改」）
  let diagnosis;
  if (score === 4) {
    const styleDesc =
      framePct >= 50
        ? "紧框窥视构图：门框压出半幅暗边，把悬念与视线牢牢锁在开口中央。"
        : framePct <= 36
          ? "开阔舒展构图：推开大半扇门，既守住门框边界，又让海面与呼吸感铺开。"
          : "经典推门构图：贴合原海报比例，暗门框裹住明亮远景，前景双手坐实「这就是我」。";
    diagnosis = {
      ok: true,
      badge: `4/4 · 主观入眼成立`,
      headline: `镜头已真正长在角色眼睛上（门开 ${Math.round(doorOpen)}° · 框占 ${framePct}%）`,
      why: `${styleDesc} 焦段 ${Math.round(focalMm)}mm（水平视野 ${Math.round(fovDeg)}°）接近人眼自然张角，${scene.fgName}托在下沿占 ${fgPct}% 而不遮挡${scene.subjectName}，观众不再从旁审视角色，而是直接替 TA 看世界。`,
      action: "试着按 Space 演播「睁眼揭示」，或点击下方反向试错，体会推过头或退半步时主观感怎样瞬间漏气。",
      tier: "成立（示意）",
    };
  } else if (!rPov.ok && rPov.kind === "detached") {
    diagnosis = {
      ok: false,
      badge: `${score}/4 · 退成旁观`,
      headline: `机位退在角色背后（离眼 ${Math.round(eyeDetach * 100)}%），漏出自己的背影`,
      why: `原海报第一条写得干脆：「镜头等同于角色的眼睛」。此刻角色自己的头肩暗影进了画面，观众立刻退回第三人称旁观（这已经滑向 305 过肩或 307 客观视角），无法真正「成为」角色。`,
      action: "把下方「机位入眼」拉回 0%（或点「一键入眼校准」），先让摄影机真正贴进角色双眼。",
      tier: score === 0 ? "多重失守（示意）" : "视角跑偏（示意）",
    };
  } else if (!rFocus.ok) {
    diagnosis = {
      ok: false,
      badge: `${score}/4 · 主体${rFocus.kind === "edge_pinch" ? "擦边" : "出框"}`,
      headline:
        rFocus.kind === "edge_pinch"
          ? `${scene.subjectName}被挤在门柱边沿，视线发紧`
          : `${scene.subjectName}被门框切去 ${100 - visPct}%，视线落空`,
      why: `主观视角靠剔除无关信息来聚焦。现在头部偏航 ${state.yaw > 0 ? "+" : ""}${Math.round(state.yaw)}°，门洞里只露出 ${visPct}% 的${scene.subjectName}，观众跟着角色转头却盯在一片暗墙上，不知道该「看什么」。`,
      action:
        rFocus.kind === "clipped_right"
          ? "直接在画布上向左横拖（把角色的头向右转），把远景主体带回门洞中央。"
          : "直接在画布上向右横拖（把角色的头向左微调），让主体离开硬邦邦的门柱边。",
      tier: "焦点落空（示意）",
    };
  } else if (!rFrame.ok) {
    diagnosis =
      rFrame.kind === "too_narrow"
        ? {
            ok: false,
            badge: `${score}/4 · 门缝窒息`,
            headline: `暗门框压占 ${framePct}%，视野只剩一条窄缝`,
            why: `「看到多少」决定信息量与呼吸感。门只开了 ${Math.round(doorOpen)}°，超过三分之二的画面被死黑内墙吞掉，外部世界被切得支离破碎，观众只剩憋闷，读不出空间交代。`,
            action: "向右拖动门沿橙色把手（或拉大「推门开合」到 36°–76°），把暗框比例放宽到 28%–64%。",
            tier: "信息过少（示意）",
          }
        : {
            ok: false,
            badge: `${score}/4 · 框中框失守`,
            headline: `门推过头（暗框仅剩 ${framePct}%），退化成普通风景明信片`,
            why: `当门开到 ${Math.round(doorOpen)}°、深色门框退到画外，画内画外的边界瞬间消失。没有「框中框」圈定视野，观众感受不到「从室内向外窥望」的主观立场。`,
            action: "向左收一点门沿（把「推门开合」收回 36°–76°），重新用深色门框把亮景裹住。",
            tier: "边界散失（示意）",
          };
  } else if (!rAnchor.ok) {
    diagnosis =
      rAnchor.kind === "no_anchor"
        ? {
            ok: false,
            badge: `${score}/4 · 缺少身体锚`,
            headline: `画面下沿空无一物，镜头像漂浮的无人航拍机`,
            why: `只有门框还不够坐实「有人站在这里」。原海报把朱橙双手捧杯摆在底沿，让观众一秒认出这是自己的双臂；抽掉身体前景后，代入感立减一半。`,
            action: "轻点画布底沿（或把「前景双手」调到 25%–55%），把角色自己的双手请回画框下缘。",
            tier: "身体缺席（示意）",
          }
        : {
            ok: false,
            badge: `${score}/4 · 前景挡主体`,
            headline: `${scene.fgName}举得太高，直接遮住${scene.subjectName} ${Math.max(coverPct, 15)}%`,
            why: `前景身体锚点应当像画框下沿的托盘，坐实身份却不抢戏。现在双手和杯子顶到了视线中轴，反而把角色最想看的目标挡了个严实。`,
            action: "点击画布里的双手或把「前景双手」调回 25%–52%，让手杯沉回画幅下缘。",
            tier: "前景抢戏（示意）",
          };
  } else {
    diagnosis =
      rPov.kind === "too_wide"
        ? {
            ok: false,
            badge: `${score}/4 · 广角过畸`,
            headline: `${Math.round(focalMm)}mm 超广角（${Math.round(fovDeg)}°）把空间拉变形`,
            why: `人眼自然专注视场接近 35–55mm 等效视角。超广角把门框边缘过度拉伸，观众会觉得透过鱼眼猫眼看世界，而非自己的肉眼。`,
            action: "把「等效焦段」回调至 32mm–62mm 之间，回到自然人眼尺度。",
            tier: "光学失真（示意）",
          }
        : {
            ok: false,
            badge: `${score}/4 · 长焦过平`,
            headline: `${Math.round(focalMm)}mm 长焦（${Math.round(fovDeg)}°）像望远镜偷窥`,
            why: `过窄的长焦把前景门框与远景压成扁平纸片，削弱了近大远小的身体临场感，除非剧本刻意交代角色正举着望远镜。`,
            action: "把「等效焦段」放宽到 32mm–62mm，找回身处门口的纵深感。",
            tier: "透视扁平（示意）",
          };
  }

  // 五枚原海报右侧圆徽的实时状态映射（单真源！）
  const callouts = {
    pov: {
      ok: rPov.ok,
      tag: rPov.tag,
    },
    immersion: {
      ok: rAnchor.ok && rPov.ok,
      tag: !rPov.ok ? "旁观抽离" : rAnchor.ok ? mood.label : rAnchor.tag,
    },
    frame: {
      ok: rFrame.ok,
      tag: rFrame.tag,
    },
    focus: {
      ok: rFocus.ok && rAnchor.kind !== "fg_blocks",
      tag: rAnchor.kind === "fg_blocks" ? "前景遮挡" : rFocus.tag,
    },
    info: {
      ok: rFrame.ok && rFocus.ok,
      tag:
        !rFrame.ok
          ? rFrame.kind === "too_narrow"
            ? "信息掐死"
            : "全盘托出"
          : !rFocus.ok
            ? "线索出画"
            : `画外留白 ${framePct}%`,
    },
  };

  // 底部原海报 5 列「关键要点 KEY POINTS」实时状态映射
  const keyPoints = {
    what: { ok: rFocus.ok, badge: rFocus.ok ? `${scene.subjectName} ${visPct}%` : rFocus.tag },
    howMuch: { ok: rFrame.ok, badge: `门开 ${Math.round(doorOpen)}° · 框 ${framePct}%` },
    when: { ok: true, badge: "按 Space 睁眼揭示" },
    feel: { ok: rPov.ok, badge: `${mood.label} · ${Math.round(focalMm)}mm` },
    howFrame: { ok: rFrame.ok && rAnchor.ok, badge: rAnchor.ok && rFrame.ok ? "框手呼应" : !rAnchor.ok ? rAnchor.tag : rFrame.tag },
  };

  return {
    scene,
    mood,
    W,
    H,
    fovDeg,
    zoomScale,
    horizonY,
    panNearX,
    panFarX,
    panNearY,
    panFarY,
    aperturePoly,
    apRect,
    subjectRect,
    handsRect,
    handsOnScreenRect,
    observerRect,
    doorHandle,
    metrics: {
      focalMm: Math.round(focalMm),
      fovDeg: Math.round(fovDeg),
      doorOpen: Math.round(doorOpen),
      yaw: Math.round(state.yaw),
      pitch: Math.round(state.pitch),
      framePct,
      visPct,
      fgPct,
      coverPct,
      detachPct: Math.round(eyeDetach * 100),
    },
    rules: { pov: rPov, focus: rFocus, frame: rFrame, anchor: rAnchor },
    score,
    maxScore: 4,
    diagnosis,
    callouts,
    keyPoints,
  };
}
