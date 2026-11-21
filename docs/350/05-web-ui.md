# 网页与 UI · 79 种

[总⁠览](README.md) · [0⁠1⁠ ⁠构⁠图⁠逻⁠辑](01-composition-logic.md) 86 · [0⁠2⁠ ⁠视⁠觉⁠原⁠则](02-visual-principles.md) 45 · [0⁠3⁠ ⁠出⁠版⁠广⁠告](03-editorial-advertising.md) 36 · [0⁠4⁠ ⁠字⁠体⁠网⁠格](04-type-grid-cjk.md) 54 · 0⁠5⁠ ⁠网⁠页⁠ ⁠U⁠I 79 · [0⁠6⁠ ⁠影⁠视⁠画⁠面](06-film-frame.md) 14 · [0⁠7⁠ ⁠中⁠国⁠传⁠统](07-chinese-composition.md) 20 · [0⁠8⁠ ⁠演⁠示⁠文⁠稿](08-presentation.md) 16

收录网站和产品界面的导航、内容、表单与响应式布局模式。

**本类主题：** [CSS 流、定位与响应](#css-layout) · [布局原语](#layout-primitives) · [页面框架与导航](#page-navigation) · [内容与产品模式](#product-patterns) · [响应式重排模式](#responsive-patterns)

<a id="css-layout"></a>

## CSS 流、定位与响应 · 21 种

普通流、Flex、Grid、定位、多栏和容器查询。 `222–242`

| <a href="../../v2/images/05-web-ui/222-普通流布局.png"><img src="../../v2/thumbnails/05-web-ui/222-普通流布局.jpg" width="180" alt="222 普通流布局"></a> | <a href="../../v2/images/05-web-ui/223-块级布局.png"><img src="../../v2/thumbnails/05-web-ui/223-块级布局.jpg" width="180" alt="223 块级布局"></a> | <a href="../../v2/images/05-web-ui/224-行内布局.png"><img src="../../v2/thumbnails/05-web-ui/224-行内布局.jpg" width="180" alt="224 行内布局"></a> | <a href="../../v2/images/05-web-ui/225-流根布局.png"><img src="../../v2/thumbnails/05-web-ui/225-流根布局.jpg" width="180" alt="225 流根布局"></a> |
| :---: | :---: | :---: | :---: |
| **222**<br>普通流布局 | **223**<br>块级布局 | **224**<br>行内布局 | **225**<br>流根布局 |

| <a href="../../v2/images/05-web-ui/226-弹性盒布局.png"><img src="../../v2/thumbnails/05-web-ui/226-弹性盒布局.jpg" width="180" alt="226 弹性盒布局"></a> | <a href="../../v2/images/05-web-ui/227-网格布局.png"><img src="../../v2/thumbnails/05-web-ui/227-网格布局.jpg" width="180" alt="227 网格布局"></a> | <a href="../../v2/images/05-web-ui/228-子网格布局.png"><img src="../../v2/thumbnails/05-web-ui/228-子网格布局.jpg" width="180" alt="228 子网格布局"></a> | <a href="../../v2/images/05-web-ui/229-多栏布局.png"><img src="../../v2/thumbnails/05-web-ui/229-多栏布局.jpg" width="180" alt="229 多栏布局"></a> |
| :---: | :---: | :---: | :---: |
| **226**<br>弹性盒布局 | **227**<br>网格布局 | **228**<br>子网格布局 | **229**<br>多栏布局 |

| <a href="../../v2/images/05-web-ui/230-表格布局.png"><img src="../../v2/thumbnails/05-web-ui/230-表格布局.jpg" width="180" alt="230 表格布局"></a> | <a href="../../v2/images/05-web-ui/231-浮动布局.png"><img src="../../v2/thumbnails/05-web-ui/231-浮动布局.jpg" width="180" alt="231 浮动布局"></a> | <a href="../../v2/images/05-web-ui/232-相对定位布局.png"><img src="../../v2/thumbnails/05-web-ui/232-相对定位布局.jpg" width="180" alt="232 相对定位布局"></a> | <a href="../../v2/images/05-web-ui/233-绝对定位布局.png"><img src="../../v2/thumbnails/05-web-ui/233-绝对定位布局.jpg" width="180" alt="233 绝对定位布局"></a> |
| :---: | :---: | :---: | :---: |
| **230**<br>表格布局 | **231**<br>浮动布局 | **232**<br>相对定位布局 | **233**<br>绝对定位布局 |

| <a href="../../v2/images/05-web-ui/234-固定定位布局.png"><img src="../../v2/thumbnails/05-web-ui/234-固定定位布局.jpg" width="180" alt="234 固定定位布局"></a> | <a href="../../v2/images/05-web-ui/235-粘性定位布局.png"><img src="../../v2/thumbnails/05-web-ui/235-粘性定位布局.jpg" width="180" alt="235 粘性定位布局"></a> | <a href="../../v2/images/05-web-ui/236-瀑布流布局.png"><img src="../../v2/thumbnails/05-web-ui/236-瀑布流布局.jpg" width="180" alt="236 瀑布流布局"></a> | <a href="../../v2/images/05-web-ui/237-覆盖布局.png"><img src="../../v2/thumbnails/05-web-ui/237-覆盖布局.jpg" width="180" alt="237 覆盖布局"></a> |
| :---: | :---: | :---: | :---: |
| **234**<br>固定定位布局 | **235**<br>粘性定位布局 | **236**<br>瀑布流布局 | **237**<br>覆盖布局 |

| <a href="../../v2/images/05-web-ui/238-固定宽度布局.png"><img src="../../v2/thumbnails/05-web-ui/238-固定宽度布局.jpg" width="180" alt="238 固定宽度布局"></a> | <a href="../../v2/images/05-web-ui/239-流体布局.png"><img src="../../v2/thumbnails/05-web-ui/239-流体布局.jpg" width="180" alt="239 流体布局"></a> | <a href="../../v2/images/05-web-ui/240-响应式布局.png"><img src="../../v2/thumbnails/05-web-ui/240-响应式布局.jpg" width="180" alt="240 响应式布局"></a> | <a href="../../v2/images/05-web-ui/241-自适应布局.png"><img src="../../v2/thumbnails/05-web-ui/241-自适应布局.jpg" width="180" alt="241 自适应布局"></a> |
| :---: | :---: | :---: | :---: |
| **238**<br>固定宽度布局 | **239**<br>流体布局 | **240**<br>响应式布局 | **241**<br>自适应布局 |

| <a href="../../v2/images/05-web-ui/242-容器查询布局.png"><img src="../../v2/thumbnails/05-web-ui/242-容器查询布局.jpg" width="180" alt="242 容器查询布局"></a> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> |
| :---: | :---: | :---: | :---: |
| **242**<br>容器查询布局 | &nbsp; | &nbsp; | &nbsp; |

<a id="layout-primitives"></a>

## 布局原语 · 12 种

堆栈、盒子、簇群、侧栏、切换器、封面与悬浮层。 `243–254`

| <a href="../../v2/images/05-web-ui/243-堆栈.png"><img src="../../v2/thumbnails/05-web-ui/243-堆栈.jpg" width="180" alt="243 堆栈"></a> | <a href="../../v2/images/05-web-ui/244-盒子.png"><img src="../../v2/thumbnails/05-web-ui/244-盒子.jpg" width="180" alt="244 盒子"></a> | <a href="../../v2/images/05-web-ui/245-居中器.png"><img src="../../v2/thumbnails/05-web-ui/245-居中器.jpg" width="180" alt="245 居中器"></a> | <a href="../../v2/images/05-web-ui/246-簇群.png"><img src="../../v2/thumbnails/05-web-ui/246-簇群.jpg" width="180" alt="246 簇群"></a> |
| :---: | :---: | :---: | :---: |
| **243**<br>堆栈 | **244**<br>盒子 | **245**<br>居中器 | **246**<br>簇群 |

| <a href="../../v2/images/05-web-ui/247-侧栏原语.png"><img src="../../v2/thumbnails/05-web-ui/247-侧栏原语.jpg" width="180" alt="247 侧栏原语"></a> | <a href="../../v2/images/05-web-ui/248-切换器.png"><img src="../../v2/thumbnails/05-web-ui/248-切换器.jpg" width="180" alt="248 切换器"></a> | <a href="../../v2/images/05-web-ui/249-封面原语.png"><img src="../../v2/thumbnails/05-web-ui/249-封面原语.jpg" width="180" alt="249 封面原语"></a> | <a href="../../v2/images/05-web-ui/250-自适应网格原语.png"><img src="../../v2/thumbnails/05-web-ui/250-自适应网格原语.jpg" width="180" alt="250 自适应网格原语"></a> |
| :---: | :---: | :---: | :---: |
| **247**<br>侧栏原语 | **248**<br>切换器 | **249**<br>封面原语 | **250**<br>自适应网格原语 |

| <a href="../../v2/images/05-web-ui/251-比例框.png"><img src="../../v2/thumbnails/05-web-ui/251-比例框.jpg" width="180" alt="251 比例框"></a> | <a href="../../v2/images/05-web-ui/252-横向卷轴.png"><img src="../../v2/thumbnails/05-web-ui/252-横向卷轴.jpg" width="180" alt="252 横向卷轴"></a> | <a href="../../v2/images/05-web-ui/253-悬浮层.png"><img src="../../v2/thumbnails/05-web-ui/253-悬浮层.jpg" width="180" alt="253 悬浮层"></a> | <a href="../../v2/images/05-web-ui/254-图标文字组合.png"><img src="../../v2/thumbnails/05-web-ui/254-图标文字组合.jpg" width="180" alt="254 图标文字组合"></a> |
| :---: | :---: | :---: | :---: |
| **251**<br>比例框 | **252**<br>横向卷轴 | **253**<br>悬浮层 | **254**<br>图标文字组合 |

<a id="page-navigation"></a>

## 页面框架与导航 · 14 种

多列、分屏、页眉页脚、标签页、抽屉和列表详情。 `255–268`

| <a href="../../v2/images/05-web-ui/255-单列页面.png"><img src="../../v2/thumbnails/05-web-ui/255-单列页面.jpg" width="180" alt="255 单列页面"></a> | <a href="../../v2/images/05-web-ui/256-双列页面.png"><img src="../../v2/thumbnails/05-web-ui/256-双列页面.jpg" width="180" alt="256 双列页面"></a> | <a href="../../v2/images/05-web-ui/257-三列页面.png"><img src="../../v2/thumbnails/05-web-ui/257-三列页面.jpg" width="180" alt="257 三列页面"></a> | <a href="../../v2/images/05-web-ui/258-侧边栏页面.png"><img src="../../v2/thumbnails/05-web-ui/258-侧边栏页面.jpg" width="180" alt="258 侧边栏页面"></a> |
| :---: | :---: | :---: | :---: |
| **255**<br>单列页面 | **256**<br>双列页面 | **257**<br>三列页面 | **258**<br>侧边栏页面 |

| <a href="../../v2/images/05-web-ui/259-分屏布局.png"><img src="../../v2/thumbnails/05-web-ui/259-分屏布局.jpg" width="180" alt="259 分屏布局"></a> | <a href="../../v2/images/05-web-ui/260-圣杯布局.png"><img src="../../v2/thumbnails/05-web-ui/260-圣杯布局.jpg" width="180" alt="260 圣杯布局"></a> | <a href="../../v2/images/05-web-ui/261-页眉—主体—页脚.png"><img src="../../v2/thumbnails/05-web-ui/261-页眉—主体—页脚.jpg" width="180" alt="261 页眉—主体—页脚"></a> | <a href="../../v2/images/05-web-ui/262-顶部导航布局.png"><img src="../../v2/thumbnails/05-web-ui/262-顶部导航布局.jpg" width="180" alt="262 顶部导航布局"></a> |
| :---: | :---: | :---: | :---: |
| **259**<br>分屏布局 | **260**<br>圣杯布局 | **261**<br>页眉—主体—页脚 | **262**<br>顶部导航布局 |

| <a href="../../v2/images/05-web-ui/263-导航抽屉布局.png"><img src="../../v2/thumbnails/05-web-ui/263-导航抽屉布局.jpg" width="180" alt="263 导航抽屉布局"></a> | <a href="../../v2/images/05-web-ui/264-底部导航布局.png"><img src="../../v2/thumbnails/05-web-ui/264-底部导航布局.jpg" width="180" alt="264 底部导航布局"></a> | <a href="../../v2/images/05-web-ui/265-标签页布局.png"><img src="../../v2/thumbnails/05-web-ui/265-标签页布局.jpg" width="180" alt="265 标签页布局"></a> | <a href="../../v2/images/05-web-ui/266-手风琴布局.png"><img src="../../v2/thumbnails/05-web-ui/266-手风琴布局.jpg" width="180" alt="266 手风琴布局"></a> |
| :---: | :---: | :---: | :---: |
| **263**<br>导航抽屉布局 | **264**<br>底部导航布局 | **265**<br>标签页布局 | **266**<br>手风琴布局 |

| <a href="../../v2/images/05-web-ui/267-列表—详情布局.png"><img src="../../v2/thumbnails/05-web-ui/267-列表—详情布局.jpg" width="180" alt="267 列表—详情布局"></a> | <a href="../../v2/images/05-web-ui/268-辅助窗格布局.png"><img src="../../v2/thumbnails/05-web-ui/268-辅助窗格布局.jpg" width="180" alt="268 辅助窗格布局"></a> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> |
| :---: | :---: | :---: | :---: |
| **267**<br>列表—详情布局 | **268**<br>辅助窗格布局 | &nbsp; | &nbsp; |

<a id="product-patterns"></a>

## 内容与产品模式 · 22 种

信息流、卡片、仪表盘、表格、表单、画廊与工作区。 `269–290`

| <a href="../../v2/images/05-web-ui/269-信息流布局.png"><img src="../../v2/thumbnails/05-web-ui/269-信息流布局.jpg" width="180" alt="269 信息流布局"></a> | <a href="../../v2/images/05-web-ui/270-卡片网格布局.png"><img src="../../v2/thumbnails/05-web-ui/270-卡片网格布局.jpg" width="180" alt="270 卡片网格布局"></a> | <a href="../../v2/images/05-web-ui/271-瀑布流页面.png"><img src="../../v2/thumbnails/05-web-ui/271-瀑布流页面.jpg" width="180" alt="271 瀑布流页面"></a> | <a href="../../v2/images/05-web-ui/272-便当盒布局.png"><img src="../../v2/thumbnails/05-web-ui/272-便当盒布局.jpg" width="180" alt="272 便当盒布局"></a> |
| :---: | :---: | :---: | :---: |
| **269**<br>信息流布局 | **270**<br>卡片网格布局 | **271**<br>瀑布流页面 | **272**<br>便当盒布局 |

| <a href="../../v2/images/05-web-ui/273-仪表盘布局.png"><img src="../../v2/thumbnails/05-web-ui/273-仪表盘布局.jpg" width="180" alt="273 仪表盘布局"></a> | <a href="../../v2/images/05-web-ui/274-数据表格布局.png"><img src="../../v2/thumbnails/05-web-ui/274-数据表格布局.jpg" width="180" alt="274 数据表格布局"></a> | <a href="../../v2/images/05-web-ui/275-画廊布局.png"><img src="../../v2/thumbnails/05-web-ui/275-画廊布局.jpg" width="180" alt="275 画廊布局"></a> | <a href="../../v2/images/05-web-ui/276-轮播布局.png"><img src="../../v2/thumbnails/05-web-ui/276-轮播布局.jpg" width="180" alt="276 轮播布局"></a> |
| :---: | :---: | :---: | :---: |
| **273**<br>仪表盘布局 | **274**<br>数据表格布局 | **275**<br>画廊布局 | **276**<br>轮播布局 |

| <a href="../../v2/images/05-web-ui/277-时间线布局.png"><img src="../../v2/thumbnails/05-web-ui/277-时间线布局.jpg" width="180" alt="277 时间线布局"></a> | <a href="../../v2/images/05-web-ui/278-看板布局.png"><img src="../../v2/thumbnails/05-web-ui/278-看板布局.jpg" width="180" alt="278 看板布局"></a> | <a href="../../v2/images/05-web-ui/279-日历布局.png"><img src="../../v2/thumbnails/05-web-ui/279-日历布局.jpg" width="180" alt="279 日历布局"></a> | <a href="../../v2/images/05-web-ui/280-树形浏览布局.png"><img src="../../v2/thumbnails/05-web-ui/280-树形浏览布局.jpg" width="180" alt="280 树形浏览布局"></a> |
| :---: | :---: | :---: | :---: |
| **277**<br>时间线布局 | **278**<br>看板布局 | **279**<br>日历布局 | **280**<br>树形浏览布局 |

| <a href="../../v2/images/05-web-ui/281-对话布局.png"><img src="../../v2/thumbnails/05-web-ui/281-对话布局.jpg" width="180" alt="281 对话布局"></a> | <a href="../../v2/images/05-web-ui/282-地图主导布局.png"><img src="../../v2/thumbnails/05-web-ui/282-地图主导布局.jpg" width="180" alt="282 地图主导布局"></a> | <a href="../../v2/images/05-web-ui/283-画布工作区布局.png"><img src="../../v2/thumbnails/05-web-ui/283-画布工作区布局.jpg" width="180" alt="283 画布工作区布局"></a> | <a href="../../v2/images/05-web-ui/284-表单布局.png"><img src="../../v2/thumbnails/05-web-ui/284-表单布局.jpg" width="180" alt="284 表单布局"></a> |
| :---: | :---: | :---: | :---: |
| **281**<br>对话布局 | **282**<br>地图主导布局 | **283**<br>画布工作区布局 | **284**<br>表单布局 |

| <a href="../../v2/images/05-web-ui/285-分步表单.png"><img src="../../v2/thumbnails/05-web-ui/285-分步表单.jpg" width="180" alt="285 分步表单"></a> | <a href="../../v2/images/05-web-ui/286-搜索结果布局.png"><img src="../../v2/thumbnails/05-web-ui/286-搜索结果布局.jpg" width="180" alt="286 搜索结果布局"></a> | <a href="../../v2/images/05-web-ui/287-设置页面布局.png"><img src="../../v2/thumbnails/05-web-ui/287-设置页面布局.jpg" width="180" alt="287 设置页面布局"></a> | <a href="../../v2/images/05-web-ui/288-媒体对象布局.png"><img src="../../v2/thumbnails/05-web-ui/288-媒体对象布局.jpg" width="180" alt="288 媒体对象布局"></a> |
| :---: | :---: | :---: | :---: |
| **285**<br>分步表单 | **286**<br>搜索结果布局 | **287**<br>设置页面布局 | **288**<br>媒体对象布局 |

| <a href="../../v2/images/05-web-ui/289-Hero 主视觉布局.png"><img src="../../v2/thumbnails/05-web-ui/289-Hero 主视觉布局.jpg" width="180" alt="289 Hero 主视觉布局"></a> | <a href="../../v2/images/05-web-ui/290-分层导航布局.png"><img src="../../v2/thumbnails/05-web-ui/290-分层导航布局.jpg" width="180" alt="290 分层导航布局"></a> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> |
| :---: | :---: | :---: | :---: |
| **289**<br>Hero 主视觉布局 | **290**<br>分层导航布局 | &nbsp; | &nbsp; |

<a id="responsive-patterns"></a>

## 响应式重排模式 · 10 种

列下落、布局切换、画布外、堆叠和组件级响应。 `291–300`

| <a href="../../v2/images/05-web-ui/291-大体流动模式.png"><img src="../../v2/thumbnails/05-web-ui/291-大体流动模式.jpg" width="180" alt="291 大体流动模式"></a> | <a href="../../v2/images/05-web-ui/292-列下落模式.png"><img src="../../v2/thumbnails/05-web-ui/292-列下落模式.jpg" width="180" alt="292 列下落模式"></a> | <a href="../../v2/images/05-web-ui/293-布局切换模式.png"><img src="../../v2/thumbnails/05-web-ui/293-布局切换模式.jpg" width="180" alt="293 布局切换模式"></a> | <a href="../../v2/images/05-web-ui/294-微调模式.png"><img src="../../v2/thumbnails/05-web-ui/294-微调模式.jpg" width="180" alt="294 微调模式"></a> |
| :---: | :---: | :---: | :---: |
| **291**<br>大体流动模式 | **292**<br>列下落模式 | **293**<br>布局切换模式 | **294**<br>微调模式 |

| <a href="../../v2/images/05-web-ui/295-画布外模式.png"><img src="../../v2/thumbnails/05-web-ui/295-画布外模式.jpg" width="180" alt="295 画布外模式"></a> | <a href="../../v2/images/05-web-ui/296-堆叠重排.png"><img src="../../v2/thumbnails/05-web-ui/296-堆叠重排.jpg" width="180" alt="296 堆叠重排"></a> | <a href="../../v2/images/05-web-ui/297-顺序重排.png"><img src="../../v2/thumbnails/05-web-ui/297-顺序重排.jpg" width="180" alt="297 顺序重排"></a> | <a href="../../v2/images/05-web-ui/298-折叠双窗格.png"><img src="../../v2/thumbnails/05-web-ui/298-折叠双窗格.jpg" width="180" alt="298 折叠双窗格"></a> |
| :---: | :---: | :---: | :---: |
| **295**<br>画布外模式 | **296**<br>堆叠重排 | **297**<br>顺序重排 | **298**<br>折叠双窗格 |

| <a href="../../v2/images/05-web-ui/299-自适应网格.png"><img src="../../v2/thumbnails/05-web-ui/299-自适应网格.jpg" width="180" alt="299 自适应网格"></a> | <a href="../../v2/images/05-web-ui/300-组件级响应布局.png"><img src="../../v2/thumbnails/05-web-ui/300-组件级响应布局.jpg" width="180" alt="300 组件级响应布局"></a> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> | <img src="../../docs/images/layout-placeholder.svg" width="180" alt=""> |
| :---: | :---: | :---: | :---: |
| **299**<br>自适应网格 | **300**<br>组件级响应布局 | &nbsp; | &nbsp; |
