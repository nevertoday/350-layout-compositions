// 311 平面调度 · 原海报放大灯箱（支持缩放、鼠标/触屏拖动、Esc 关闭，图片加 draggable="false"）

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
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  const applyTransform = () => {
    bigImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomReadout) zoomReadout.textContent = `${Math.round(scale * 100)}%`;
    stage.style.cursor = scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in";
  };

  const resetView = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  };

  const setZoom = (next) => {
    scale = Math.max(1, Math.min(3, Math.round(next * 100) / 100));
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  };

  const open = () => {
    if (!bigImg.src) bigImg.src = thumb.currentSrc || thumb.src;
    resetView();
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
  zoomInBtn?.addEventListener("click", () => setZoom(scale + 0.4));
  zoomOutBtn?.addEventListener("click", () => setZoom(scale - 0.4));
  zoomResetBtn?.addEventListener("click", resetView);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === stage) {
      if (!dragging) close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") setZoom(scale + 0.35);
    else if (e.key === "-") setZoom(scale - 0.35);
    else if (e.key === "0") resetView();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== bigImg) return;
    if (scale <= 1) {
      setZoom(1.85);
      return;
    }
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    originX = tx;
    originY = ty;
    stage.setPointerCapture(e.pointerId);
    applyTransform();
  });

  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = originX + (e.clientX - startX);
    ty = originY + (e.clientY - startY);
    applyTransform();
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {}
    applyTransform();
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener(
    "wheel",
    (e) => {
      if (lightbox.hidden) return;
      e.preventDefault();
      setZoom(scale + (e.deltaY < 0 ? 0.2 : -0.2));
    },
    { passive: false }
  );
}
