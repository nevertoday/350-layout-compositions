# 互动版页面任务（给批量作者的通用说明）

## 目标
把 350 种排版教学海报一张一张做成独立的互动网页：一个 HTML 文件，双击离线就能打开，也挂在 https://layout.xiaoxiaodong.ai/<编号>/play/。知识丰富、交互好、动画好、字体和审美讲究、各种屏幕都好看，每页都和别的页不一样。001–015 已经做完上线，是你的参照。

## 在哪做
- 工作区：/Users/admin/Desktop/js/350-layout-interactive，目录 interactive/。
- 先读 interactive/README.md 和 interactive/GUIDE.md，**全部照做**。再挑两三页已完成的看源码（interactive/pages/0*/）和线上成品，学它们的做法（比如 001 的 model.js：状态只存画框里的位置，3D 和 SVG 降级共用）。
- `npm run new -- <编号>` 起骨架。**只写 interactive/pages/<编号>-*/ 里面的文件**。不改 build.mjs、check.mjs、lib/、tools/、fonts.json、package.json、GUIDE.md、BRIEF.md；觉得指南有错或缺什么，写进最后的报告。
- 不要 git commit，不要 git stash，不要 `npm run dev`，不要部署。
- 同时还有别的作者在做别的编号；不要碰别的编号的目录。
- 内容来源：pages/<编号>-*/poster.webp（仔细看：配色、字体气质、图形母题）和 site/src/data/poster-text.json 里这个编号。site/src/data/guides.json 里如果有这个编号，可以参考，但里面的说法要先核实再用（已发现它有年份和数量写错的地方）。
- 选字体前先跑 `npm run fonts` 看已用的搭配，选一套和前后编号都不一样的；做完前再跑一次（别的作者可能刚用掉）。用 `npm run glyphs -- <编号>` 查字体缺字。
- 不编历史、不编统计数字、不编名人语录；查不准就不写。引用的书、论文、人名、年份要上网核实，报告里列出核实用的网址。经验值要写明是经验值。
- 长相要从海报来，不要通用的「深色仪表盘 + 圆角卡片」模板感：形状、线条、圆角与否、版面节奏都跟着这张海报的设计语言走。
- 画人时不画五官细节（眼、嘴），用侧影、剪影或背影；用户觉得有五官的面具脸吓人。
- 3D（Three.js）用在它真能帮上忙的地方；纯 DOM / SVG / 2D 画布同样可以，只要好看好玩。
- 同一小类的其他编号各有一页：不重讲它们的重点，提到时一句话加链接到它的在线版。

## 做完的标准（GUIDE.md「做完怎么算好」全部四条）
1. `npm run build -- --only <编号> && npm run check -- --only <编号>` 全过。
2. 自己一张张看截图（.build/shots/<编号>-*.png，包括 tour 截图），好看、清楚、不挤才算过。
3. 写一个脚本用真实的鼠标、键盘、触摸事件把每个控件操作一遍，没有报错、读数对（脚本放 interactive/.build/probe/<编号>/，起 Chrome 用 tools/cdp.mjs 的 `launch`）。**每条命令都要有时限**：`timeout 300 node ...`，脚本里每个等待也要有超时；卡住就杀掉重来，不要一直等。
4. `ONLY=<编号> npm run perf`：开场和拖动两段中位数 ≥ 40 帧；再用软件渲染跑一遍（命令在 tools/perf.mjs 开头）。

整页的时间预算是 60 分钟；超过 90 分钟会被强行停掉。

## 机器规矩（这台 Mac 只有 16 GB）
自己起的服务器、无头 Chrome 自己关：结束前用 `pgrep -fl 'Google Chrome.*headless'` 确认没有你起的还在跑。别人的进程（audit-chrome、别的作者的 check）不要动。

## 报告
每节讲什么、有什么交互、用了什么字体、文件大小、check 和 perf 的结果、核实用的网址、GUIDE.md 哪里帮上了忙、哪里缺了或错了。最后一行写「完成」。
