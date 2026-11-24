# 350 种排版 · 互动版

每张海报做成一个独立的互动网页。怎么做得好看、好玩、讲得清楚，见 `GUIDE.md`。

每页最后是**一个** HTML 文件，字体、图片、脚本全在里面，打包成 zip 发给别人，双击就能打开，不联网。

## 命令

```sh
npm install
npm run new -- 001                                 # 起骨架 pages/001-rule-of-thirds-composition/
npm run build -- --only 001 && npm run check -- --only 001
npm run build                                      # 全部页面 + dist/350-layout-interactive.zip
npm run dev                                        # 可选：http://127.0.0.1:4430/，改了自动刷新
```

- `build`：有缓存，输入没变就跳过（第一次用某个字体要下载，CJK 字体每个 17–28 MB，存在 `.cache/fonts/`）。`--force` 不用缓存。`--only` 不打 zip。
- `check`：无头 Chrome 打开 `dist/*.html`（file://），查完关掉。截图在 `.build/shots/<id>-*.png`。一页大约 20 秒。
- `dev`：打开某页时现打这一页，和 `build` 是同一份产物。端口上已有 dev 在跑就直接用它，不会起第二个。**谁起的谁关**：`kill <它打印的 PID>`，再 `lsof -i :4430` 确认端口空了。

## 目录

```
fonts.json            字体登记表：名字 → family、license、下载地址、字重
lib/stage.js          每页共用的小工具：loop()、webgl()、pixelRatio()、reducedMotion
pages/<id>-<slug>/
  page.json           { id, title, title_en, fonts: [{ name, weights, style?, axes? }], poster }
  index.html          完整的 HTML 文档，用 <link rel="stylesheet" href="style.css"> 和 <script type="module" src="main.js">
  style.css
  main.js             ES 模块，可以 import "three"、"three/addons/..."、"../../lib/stage.js"
  poster.webp         poster: true 时由 build 从 350-layout-redesign/site/public/p/<id>.webp 拷过来（POSTER_DIR 可改）
pages/000-sample/     样例：只演示机制（WebGL + 降级、两种字体、内联海报），不是设计参考；不进 zip
dist/<id>-<slug>.html 产物
```

海报上的全部文字（标题、要点、用法、关键词）在 `../site/src/data/poster-text.json`，按编号取。

## build 做了什么

1. `index.html` 里的本地样式表和模块脚本用 esbuild 打包（JS 是压缩过的 IIFE，放到 `</body>` 前），内联进去。CSS 里 `url(x.webp)`、JS 里 `import url from "./x.png"`、HTML 里 `src="x.webp"` 的本地图片都变成 data URI。
2. 字体：收集 HTML、打包后的 CSS 和 JS（字符串字面量都在里面）、page.json 里出现的所有字，加上 ASCII、Latin-1、常用标点、全角标点，用 fonttools 裁成 woff2、base64 内联。可变字体按 page.json 的 `weights` 收窄字重轴（一个字重就钉成静态）。
3. 写 `dist/<id>-<slug>.html`，开头一行注释写明用到的字体许可和 three.js (MIT)。

## 写页面的规矩

- **一个文件，不联网**：不用 CDN、不 fetch、不引外部字体；运行时不能有 ES 模块 import（build 会打包掉）。
- **中文为主，英文点缀**。
- **任何屏幕**：320 到 2560 宽，包括横过来的手机（844×390）。不能横向溢出。
- **减少动态效果**（`prefers-reduced-motion`）：静止但完整，画布也要画出一帧。
- **WebGL 关掉也能看**：先用 `webgl()` 判断，不行就换 CSS / SVG / 2D 画布的静态版本，不能报错。
- **键盘能操作**：控件用 `<button>`、`<input>`，有看得见的 `:focus-visible`。
- **省电**：画面不在屏幕上、标签页隐藏时停止渲染。`devicePixelRatio` 最多 2。用 `lib/stage.js` 的 `loop(el, frame)` 和 `pixelRatio()` 这两条就都有了。
- **大小**：`dist` 里一页 ≲ 2.5 MB（three.js 约 0.5 MB，海报约 0.15 MB）。海报只引用一次：JS 要用就读 `document.getElementById("poster").src`，不要再 import 一份。
- **字**：JS 里拼出来的字（`Intl` 日期、从数字算出来的汉字）不在字面量里，裁字体时会漏；在 page.json 加 `"glyphs": "缺的字"`。

`check` 会查：六种屏幕不溢出、有 viewport meta、没有 console 错误和未捕获异常、没有任何网络请求、内联字体都解得开、WebGL 画布滚完整页后不是空白；减少动态效果下同样；关掉 WebGL 再查一遍报错、溢出和正文。超过 2.5 MB 只警告。键盘、暂停渲染这两条它查不到，要自己守。

## 字体

只登记允许嵌入和再分发的字体（OFL-1.1）。用法：page.json 里 `{ "name": "noto-serif-sc", "weights": [400, 900] }`，CSS 里写 family 名。

| name | family | 字重 | 许可 |
| --- | --- | --- | --- |
| noto-sans-sc | Noto Sans SC | 100–900 可变 | OFL-1.1 |
| noto-serif-sc | Noto Serif SC | 200–900 可变 | OFL-1.1 |
| lxgw-wenkai | LXGW WenKai（霞鹜文楷） | 300 / 400 / 500 | OFL-1.1 |
| smiley-sans | Smiley Sans（得意黑） | 400（字形本身是斜的） | OFL-1.1 |
| zcool-xiaowei | ZCOOL XiaoWei（站酷小薇） | 400 | OFL-1.1 |
| zcool-qingke-huangyou | ZCOOL QingKe HuangYou（站酷庆科黄油体） | 400 | OFL-1.1 |
| ma-shan-zheng | Ma Shan Zheng（马善政楷书） | 400 | OFL-1.1 |
| fraunces | Fraunces | 100–900 可变，另有 opsz / SOFT / WONK 轴；有 italic | OFL-1.1 |
| instrument-serif | Instrument Serif | 400；有 italic | OFL-1.1 |
| inter | Inter | 100–900 可变，另有 opsz 轴；有 italic | OFL-1.1 |
| space-grotesk | Space Grotesk | 300–700 可变 | OFL-1.1 |
| jetbrains-mono | JetBrains Mono | 100–800 可变；有 italic | OFL-1.1 |

- 斜体：`{ "name": "fraunces", "weights": [300], "style": "italic" }`，要正斜两种就写两条。
- 其它可变轴默认整条保留（可以做动画）；要省体积就钉住：`"axes": { "opsz": 144, "SOFT": [0, 50] }`。
- 阿里巴巴普惠体没登记：本机那份写着 All rights reserved，fsType 是「仅预览和打印」，不允许改动后嵌入。
- 要加字体：在 fonts.json 加一条（下载地址要钉版本），许可必须允许嵌入和再分发。
