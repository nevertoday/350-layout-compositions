// 三个设计小样：栏宽、字号阶梯、卡片比例。全是 CSS 变量，画面靠样式表过渡。
export function initDesign() {
  const cols = document.getElementById("cols");
  const colsMock = document.getElementById("cols-mock");
  const colsOut = document.getElementById("cols-out");
  const drawCols = () => {
    const share = +cols.querySelector("input:checked").value;
    colsMock.style.setProperty("--main", share);
    colsMock.style.setProperty("--side", 1 - share);
    const main = Math.round((1200 - 32) * share);
    colsOut.textContent = `1200 像素的版心，减去 32 的栏间距：主栏 ${main}，侧栏 ${1200 - 32 - main}`;
  };
  cols.addEventListener("change", drawCols);
  drawCols();

  const base = document.getElementById("type-base");
  const scale = document.getElementById("type-ratio");
  const sample = document.getElementById("type-sample");
  const baseOut = document.getElementById("type-base-out");
  const steps = document.getElementById("type-steps");
  const note = document.getElementById("type-note");
  const drawType = () => {
    const b = +base.value, r = +scale.querySelector("input:checked").value;
    const sizes = [0, 1, 2, 3].map((i) => b * r ** i);
    sizes.forEach((s, i) => sample.style.setProperty(`--t${i}`, `${s}px`));
    baseOut.textContent = `${b}px`;
    steps.textContent = sizes.map((s) => Math.round(s)).join(" → ");
    note.textContent = r > 1.6
      ? `φ 的台阶很陡，三级就到 ${Math.round(sizes[3])} 像素。每一级正好是下面两级之和（${Math.round(sizes[1])} + ${Math.round(sizes[2])} ≈ ${Math.round(sizes[3])}），适合封面、海报这种只有两三级的版面。`
      : "台阶平缓，可以分很多级，长文章、说明书、界面常用这一档。";
  };
  base.addEventListener("input", drawType);
  scale.addEventListener("change", drawType);
  drawType();

  const overlay = document.getElementById("cards-phi");
  const cards = document.getElementById("cards");
  overlay.addEventListener("input", () => cards.classList.toggle("overlay", overlay.checked));
}
