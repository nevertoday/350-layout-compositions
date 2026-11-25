// 从原海报 #poster 一次裁出暖阳金圆与真实冲浪者海浪照片，补平右侧「视觉焦点」虚线引注，不另存图片。
// 原海报尺寸 1086×1448：暖阳圆心约 (747, 386)，半径约 152px。

export function createSurferMedallion(onReady) {
  const SIZE = 180;
  const off = document.createElement("canvas");
  off.width = SIZE;
  off.height = SIZE;
  let ready = false;

  function buildFromImg(img) {
    const w = img.naturalWidth || 1086;
    const h = img.naturalHeight || 1448;
    const sxScale = w / 1086;
    const syScale = h / 1448;

    const cx = 747 * sxScale;
    const cy = 386 * syScale;
    const r = 148 * Math.min(sxScale, syScale);

    const ctx = off.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.clip();

    // 画暖阳底色，避免最边缘露海雾绿边
    ctx.fillStyle = "#FDCA33";
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2, 0, 0, SIZE, SIZE);

    // 温和修补右侧靠近浪花边缘的一小段「视觉焦点」黑色虚线（原图 x≈850..898, y≈356..385）
    const px = ((868 - (747 - 148)) / (2 * 148)) * SIZE;
    const py = ((368 - (386 - 148)) / (2 * 148)) * SIZE;
    const g = ctx.createRadialGradient(px, py, 2, px, py, 32);
    g.addColorStop(0, "rgba(253, 202, 51, 0.96)");
    g.addColorStop(0.55, "rgba(253, 202, 51, 0.72)");
    g.addColorStop(1, "rgba(253, 202, 51, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, 32, 0, Math.PI * 2);
    ctx.fill();

    // 柔和白色内圈，让暖阳圆在任意波形上都利落收口
    ctx.restore();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();

    ready = true;
    if (onReady) onReady();
  }

  const posterEl = document.getElementById("poster");
  if (posterEl) {
    if (posterEl.complete && posterEl.naturalWidth > 0) {
      buildFromImg(posterEl);
    } else {
      posterEl.addEventListener("load", () => buildFromImg(posterEl), { once: true });
    }
  }

  return {
    get canvas() {
      return off;
    },
    get ready() {
      return ready;
    },
  };
}
