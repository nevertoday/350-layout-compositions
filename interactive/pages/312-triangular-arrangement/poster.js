// 312 三角调度 · 原海报放大灯箱（支持点击/滚轮缩放、鼠标与触屏拖动、Esc 关闭）

export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const thumb = document.getElementById("poster");
  const lightbox = document.getElementById("poster-lightbox");
  const bigImg = document.getElementById("poster-lightbox-img");
  const stage = document.getElementById("poster-lightbox-stage");
  const closeBtn = document.getElementById("poster-lightbox-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const zoomReadout = document.getElementById("poster-zoom-readout");
  if (!trigger || !thumb || !lightbox || !bigImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let moved = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  const render = () => {
    bigImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomReadout) zoomReadout.textContent = `${Math.round(scale * 100)}%`;
    stage.style.cursor = scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in";
  };

  const setScale = (next) => {
    scale = Math.max(1, Math.min(3, Math.round(next * 100) / 100));
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    render();
  };

  const open = () => {
    if (!bigImg.src) bigImg.src = thumb.currentSrc || thumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    render();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  };

  const close = () => {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  };

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  zoomInBtn?.addEventListener("click", () => setScale(scale + 0.4));
  zoomOutBtn?.addEventListener("click", () => setScale(scale - 0.4));
  zoomResetBtn?.addEventListener("click", () => setScale(1));

  lightbox.addEventListener("click", (e) => {
    if ((e.target === lightbox || e.target === stage) && !moved) close();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") setScale(scale + 0.35);
    else if (e.key === "-") setScale(scale - 0.35);
    else if (e.key === "0") setScale(1);
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== bigImg) return;
    moved = false;
    if (scale <= 1) {
      setScale(1.85);
      return;
    }
    e.preventDefault();
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = tx;
    oy = ty;
    stage.setPointerCapture(e.pointerId);
    render();
  });

  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 4) moved = true;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    render();
  });

  const stop = (e) => {
    if (!dragging) return;
    dragging = false;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {}
    render();
  };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  stage.addEventListener(
    "wheel",
    (e) => {
      if (lightbox.hidden) return;
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.2 : -0.2));
    },
    { passive: false }
  );
}
