// 活体化纵深剖面景片滑轨（直接复刻 310 原海报左下 DEPTH LAYERS DIAGRAM：镜头眼睛 + 视锥 + 三景片）
// 左侧为镜头眼睛，向右沿 Z 轴推进 2.8m → 25.5m；三枚角色把手可直接左右拖、键盘调深与通道。

import {
  Z_MIN,
  Z_MAX,
  ZONE_FG_MAX,
  ZONE_MG_MIN,
  ZONE_MG_MAX,
  ZONE_BG_MIN,
  clamp,
} from "./model.js";

export function mountDepthRail(root, store) {
  const track = root.querySelector(".rail-track");
  const handles = {
    A: root.querySelector('[data-actor="A"]'),
    B: root.querySelector('[data-actor="B"]'),
    C: root.querySelector('[data-actor="C"]'),
  };
  const meter = root.querySelector("#rail-span");
  const focalRead = root.querySelector("#rail-focal");

  // 将物理 Z ∈ [2.8, 25.5] 映射为轨道左起百分比 [4%, 94%]
  const zToPct = (z) => 4 + ((clamp(z, Z_MIN, Z_MAX) - Z_MIN) / (Z_MAX - Z_MIN)) * 90;
  const pctToZ = (pct) => Z_MIN + ((clamp(pct, 4, 94) - 4) / 90) * (Z_MAX - Z_MIN);

  // 设置三片景区的精确宽度位置（与 model.js 常量同一来源，不写死 CSS 百分比）
  const setBand = (sel, z0, z1) => {
    const el = root.querySelector(sel);
    if (!el) return;
    const left = zToPct(z0);
    const right = zToPct(z1);
    el.style.left = `${left.toFixed(2)}%`;
    el.style.width = `${(right - left).toFixed(2)}%`;
  };
  setBand(".band-fg", Z_MIN, ZONE_FG_MAX);
  setBand(".band-mg", ZONE_MG_MIN, ZONE_MG_MAX);
  setBand(".band-bg", ZONE_BG_MIN, Z_MAX);

  // 绑定横向拖拽（touch-action: pan-y，让触屏上下滚页无阻、左右拖拽丝滑跟手）
  const bindHandle = (id, btn) => {
    let activePointer = null;
    let moved = false;

    const updateFromClientX = (clientX) => {
      const r = track.getBoundingClientRect();
      const pct = ((clientX - r.left) / Math.max(120, r.width)) * 100;
      store.setActorZ(id, pctToZ(pct));
    };

    btn.addEventListener("pointerdown", (e) => {
      activePointer = e.pointerId;
      moved = false;
      store.selectActor(id);
      btn.setPointerCapture(e.pointerId);
      btn.classList.add("is-dragging");
      e.preventDefault();
    });

    btn.addEventListener("pointermove", (e) => {
      if (activePointer !== e.pointerId) return;
      moved = true;
      updateFromClientX(e.clientX);
    });

    const release = (e) => {
      if (activePointer !== e.pointerId) return;
      activePointer = null;
      btn.classList.remove("is-dragging");
    };
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);

    // 兼容 perf.mjs 直接派发的 touch 事件（部分环境下 pointer 与 touch 同步，确保双通）
    btn.addEventListener("touchstart", (e) => {
      if (!e.touches.length) return;
      store.selectActor(id);
      btn.classList.add("is-dragging");
    }, { passive: true });
    btn.addEventListener("touchmove", (e) => {
      if (!e.touches.length) return;
      updateFromClientX(e.touches[0].clientX);
    }, { passive: true });
    btn.addEventListener("touchend", () => btn.classList.remove("is-dragging"), { passive: true });

    btn.addEventListener("click", () => {
      if (!moved) store.selectActor(id);
    });

    // 键盘完整支持：← / → 沿 Z 轴调深度，↑ / ↓ 挪动横向视线走廊
    btn.addEventListener("keydown", (e) => {
      const stepZ = e.shiftKey ? 0.3 : 1.0;
      const stepLane = e.shiftKey ? 0.05 : 0.14;
      const cur = store.state.actors[id];
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        store.setActorZ(id, cur.z - stepZ);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        store.setActorZ(id, cur.z + stepZ);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        store.setActorLane(id, cur.lane - stepLane);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        store.setActorLane(id, cur.lane + stepLane);
      }
    });
  };

  for (const id of ["A", "B", "C"]) {
    if (handles[id]) bindHandle(id, handles[id]);
  }

  // 点击导轨空白处：把当前选中角色直接移到该深度
  track.addEventListener("click", (e) => {
    if (e.target.closest(".rail-handle")) return;
    const r = track.getBoundingClientRect();
    const pct = ((e.clientX - r.left) / Math.max(120, r.width)) * 100;
    store.setActorZ(store.state.selected, pctToZ(pct));
  });

  // 同步 UI 位置与无障碍读数
  const render = (state, snap) => {
    const blockedIds = new Set();
    if (snap.status === "blocked" && snap.blockerPair) {
      blockedIds.add(snap.blockerPair.front.id);
      blockedIds.add(snap.blockerPair.back.id);
    }

    for (const a of snap.projected) {
      const btn = handles[a.id];
      if (!btn) continue;
      btn.style.left = `${zToPct(a.z).toFixed(2)}%`;
      btn.classList.toggle("is-selected", state.selected === a.id);
      btn.classList.toggle("is-blocked", blockedIds.has(a.id));
      btn.setAttribute("aria-valuenow", a.z.toFixed(1));
      btn.setAttribute("aria-valuetext", `${a.short} 纵深 ${a.z.toFixed(1)} 米，通道 ${a.lane >= 0 ? "偏右" : "偏左"}`);
      const zOut = btn.querySelector(".rh-z");
      if (zOut) zOut.textContent = `${a.z.toFixed(1)}m`;
    }
    if (meter) meter.textContent = `跨度 ${snap.depthSpan.toFixed(1)}m · 身高比 ${snap.heightRatio.toFixed(1)}×`;
    if (focalRead) focalRead.textContent = `${snap.focal}mm`;
  };

  store.subscribe(render);
  render(store.state, store.eval());
}
