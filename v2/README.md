# 350 种排版数据集

本目录是新版 350 种排版图鉴的内容层。图片按 8 个一级分类存放，并细分为 33 个二级主题，同时提供适合程序读取的完整目录。

- [`images/`](images/)：高清 PNG。339 种各一张，其中 11 种另有一张「第二版」；另有 11 种暂缺配图，目录里标为待补图
- [`thumbnails/`](thumbnails/)：与高清图一一对应的 GitHub 页面预览 JPEG
- [`catalog.csv`](catalog.csv)：适合表格软件、脚本和数据分析
- [`catalog.json`](catalog.json)：适合网页、应用和自动化工具

字段包括全局编号、名称、一级/二级分类及其稳定标识、高清图路径、缩略图路径、尺寸与 SHA-256。有第二版的条目另填 `variant_image`、`variant_thumbnail`、`variant_sha256`；待补图的条目这几项和图片字段都留空。分类入口和完整画廊见 [`docs/350/`](../docs/350/README.md)。

> `images/` 与 `thumbnails/` 下的英文目录名是稳定标识；中文分类名记录在目录文件中。即使后续调整展示文案，也不应随意更改现有路径。
