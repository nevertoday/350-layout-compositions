// 详情页：切换第一版 / 第二版、点大图看原尺寸（xxd 的图片查看器，多一个「原尺寸 / 适应屏幕」）、← → 翻页、收藏。
import "./favs.js";

const X = window.Xxd;
const data = JSON.parse(document.getElementById("detail-data").textContent);
const poster = document.getElementById("poster");
const dl = document.getElementById("dl");
const png = document.getElementById("png");
let version = 0;

function showVersion(i) {
  version = i;
  const v = data.versions[i];
  poster.style.setProperty("--thumb", `url("${v.thumb}")`);
  poster.src = v.src;
  poster.alt = `${data.name}的海报（${v.label}）`;
  dl.href = v.src;
  dl.download = v.file;
  png.href = v.png;
}
document.getElementById("poster-version")?.addEventListener("xxd:change", (e) => showVersion(Number(e.detail.value)));

function download(v) {
  const a = Object.assign(document.createElement("a"), { href: v.src, download: v.file });
  document.body.append(a);
  a.click();
  a.remove();
}

document.getElementById("poster-open").addEventListener("click", () => {
  if (!X) return;
  const items = data.versions.map((v) => ({ src: v.src, alt: `${data.name}的海报（${v.label}）`, ...v }));
  const zoom = (on) => {
    const d = viewer.dialog;
    d.toggleAttribute("data-zoom", on);
    d.querySelector("[data-actions] button").lastChild.textContent = on ? "适应屏幕" : "原尺寸";
  };
  const viewer = X.openViewer(items, version, {
    actions: [
      { label: "原尺寸", run: () => zoom(!viewer.dialog.hasAttribute("data-zoom")) },
      { label: "下载", run: (item) => download(item) },
    ],
  });
  // 点图本身也是切换原尺寸；切到另一张时回到适应屏幕
  viewer.dialog.addEventListener("click", (e) => { if (e.target.tagName === "IMG") zoom(!viewer.dialog.hasAttribute("data-zoom")); });
  viewer.dialog.addEventListener("xxd:change", () => zoom(false));
});

// ← → 翻上一张 / 下一张：在输入框、分段控件、对话框里不管；带修饰键不管
addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  if (e.target.closest?.('input, textarea, select, [contenteditable], [role="radio"], [role="tab"], dialog') || document.querySelector("dialog[open]")) return;
  const a = document.querySelector(e.key === "ArrowLeft" ? 'a[rel="prev"]' : 'a[rel="next"]');
  if (a) location.href = a.href;
});
