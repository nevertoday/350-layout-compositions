#!/usr/bin/env python3
"""Import the 350-layout collection and build its GitHub Markdown galleries."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass(frozen=True)
class Category:
    source_name: str
    slug: str
    title: str
    short: str
    description: str


@dataclass(frozen=True)
class Subcategory:
    start: int
    end: int
    slug: str
    title: str
    description: str


CATEGORIES = (
    Category("构图逻辑名称", "01-composition-logic", "构图逻辑", "构图逻辑", "从经典比例、几何形态、空间层次到视点组织，建立画面的基础骨架。"),
    Category("视觉原则与阅读模式名称", "02-visual-principles", "视觉原则与阅读模式", "视觉原则", "用格式塔原则、视觉层级和阅读路径解释信息如何被看见与理解。"),
    Category("平面出版广告排版名称", "03-editorial-advertising", "平面、出版与广告", "出版广告", "覆盖海报、书刊、包装、广告等常见平面媒介的版式结构。"),
    Category("字体网格与东亚文字排版名称", "04-type-grid-cjk", "字体、网格与东亚文字", "字体网格", "聚焦字体编排、网格系统，以及横排、直排和中西文混排。"),
    Category("网页与UI布局名称", "05-web-ui", "网页与 UI", "网页 UI", "收录网站和产品界面的导航、内容、表单与响应式布局模式。"),
    Category("影视画面构图名称", "06-film-frame", "影视画面构图", "影视画面", "以镜头、景别、机位和画幅关系组织动态影像中的单个画面。"),
    Category("中国传统构图名称", "07-chinese-composition", "中国传统构图", "中国传统", "整理中国绘画与传统视觉中的空间经营、散点透视和章法。"),
    Category("演示文稿页面布局名称", "08-presentation", "演示文稿页面", "演示文稿", "覆盖封面、目录、内容、比较、数据、流程和全图等幻灯片版式。"),
)


SUBCATEGORIES: dict[str, tuple[Subcategory, ...]] = {
    "01-composition-logic": (
        Subcategory(1, 15, "classic-rules", "经典法则与空间留白", "比例、视线、运动空间、负空间与框景。"),
        Subcategory(16, 30, "balance-lines-axes", "重心、线条与轴线", "居中、对称、方向线、交叉线与轴线组织。"),
        Subcategory(31, 40, "letter-curves", "字母形与曲线", "X、T、L、V、Z、C、S 形及曲线节奏。"),
        Subcategory(41, 56, "geometry-radial", "几何形与放射结构", "三角、矩形、圆形、螺旋、向心与离心结构。"),
        Subcategory(57, 64, "pattern-grouping", "阵列、层叠与组群", "棋盘、阶梯、级联、聚类、分支和网络。"),
        Subcategory(65, 76, "depth-projection", "空间层次与投影", "前中后景、尺度递减、线性透视和轴测投影。"),
        Subcategory(77, 86, "viewpoint-focus", "视点、景深与空间感", "俯仰视角、强制透视、景深与平面化。"),
    ),
    "02-visual-principles": (
        Subcategory(87, 94, "balance-focus", "平衡、动势与焦点", "静态或动态、开放或封闭、单一或多重焦点。"),
        Subcategory(95, 106, "hierarchy-contrast", "层级、比例与对比", "主次、尺度、明暗、色彩、形状、质感和隔离。"),
        Subcategory(107, 114, "repetition-rhythm", "重复、图案与节奏", "重复、渐变、交替、渐进、流动和随机节奏。"),
        Subcategory(115, 126, "gestalt-grouping", "格式塔与组群", "相似、邻近、连续、闭合、图底与共同区域。"),
        Subcategory(127, 131, "reading-patterns", "页面阅读模式", "F 型、Z 型、古腾堡、层蛋糕与斑点扫描。"),
    ),
    "03-editorial-advertising": (
        Subcategory(132, 139, "columns-spreads", "分栏、跨页与出血", "单栏到多栏、对称与非对称跨页、出血控制。"),
        Subcategory(140, 152, "expressive-layouts", "图文主导与表现型版式", "大标题、图片窗口、拼贴、蒙太奇和实验版式。"),
        Subcategory(153, 159, "modules-annotations", "模块、侧栏与图文关系", "模块化页面、区块、边注、环绕图和浮动块。"),
        Subcategory(160, 167, "editorial-pages", "出版功能页面", "封面、扉页、目录、索引、图录与引语页面。"),
    ),
    "04-type-grid-cjk": (
        Subcategory(168, 175, "type-systems", "字体组织系统", "轴线、放射、扩张、随机、网格与双边系统。"),
        Subcategory(176, 193, "typesetting", "对齐、缩进与文字造型", "对齐方式、绕排、缩进、基线、路径与横竖排。"),
        Subcategory(194, 211, "grid-systems", "网格系统", "手稿、分栏、模块、层级、响应式与解构网格。"),
        Subcategory(212, 221, "cjk-writing", "东亚文字与混排", "横排、直排、纵中横、中西文转向、双向与旁注。"),
    ),
    "05-web-ui": (
        Subcategory(222, 242, "css-layout", "CSS 流、定位与响应", "普通流、Flex、Grid、定位、多栏和容器查询。"),
        Subcategory(243, 254, "layout-primitives", "布局原语", "堆栈、盒子、簇群、侧栏、切换器、封面与悬浮层。"),
        Subcategory(255, 268, "page-navigation", "页面框架与导航", "多列、分屏、页眉页脚、标签页、抽屉和列表详情。"),
        Subcategory(269, 290, "product-patterns", "内容与产品模式", "信息流、卡片、仪表盘、表格、表单、画廊与工作区。"),
        Subcategory(291, 300, "responsive-patterns", "响应式重排模式", "列下落、布局切换、画布外、堆叠和组件级响应。"),
    ),
    "06-film-frame": (
        Subcategory(301, 304, "subject-count", "人物数量与群像", "单人、双人、三人与群像的画面关系。"),
        Subcategory(305, 309, "viewpoint-coverage", "视角与镜头覆盖", "过肩、主客观视角、净单人和脏单人镜头。"),
        Subcategory(310, 314, "blocking-depth", "场面调度与景深", "深度、平面、三角、横向和多层前景调度。"),
    ),
    "07-chinese-composition": (
        Subcategory(315, 320, "perspective-roaming", "三远、透视与游观", "高远、深远、平远、散点透视与游观式构图。"),
        Subcategory(321, 325, "scene-framing", "取景与景式", "全景、一河两岸、边角、截景和折枝。"),
        Subcategory(326, 334, "blank-rhythm", "留白、虚实与章法", "计白当黑、疏密、主宾、开合、藏露与欹正。"),
    ),
    "08-presentation": (
        Subcategory(335, 343, "core-slides", "基础幻灯片", "标题、章节、内容、比较、空白与图文说明页面。"),
        Subcategory(344, 350, "story-data-slides", "叙事与数据页面", "大数字、引语、时间线、流程、矩阵、图表和全图。"),
    ),
}


def subcategory_for(category_slug: str, item_id: str) -> Subcategory:
    number = int(item_id)
    matches = [item for item in SUBCATEGORIES[category_slug] if item.start <= number <= item.end]
    if len(matches) != 1:
        raise ValueError(f"{item_id} 的二级分类匹配异常：{category_slug}")
    return matches[0]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_mapping(mapping_path: Path) -> list[dict[str, str]]:
    with mapping_path.open(encoding="utf-8-sig", newline="") as source:
        rows = list(csv.DictReader(source, delimiter="\t"))
    if len(rows) != 350:
        raise ValueError(f"映射表应有 350 项，实际为 {len(rows)} 项")
    expected = [f"{number:03d}" for number in range(1, 351)]
    actual = [row["序号"] for row in rows]
    if actual != expected:
        raise ValueError("映射表序号不是连续的 001–350")
    return rows


def image_name(row: dict[str, str]) -> str:
    return Path(row["新文件名"]).name


def layout_name(row: dict[str, str]) -> str:
    return Path(image_name(row)).stem.split("-", 1)[1]


def gallery_cells(item: dict[str, object], path_prefix: str) -> list[tuple[str, str]]:
    """One cell per image of an entry: missing entries get a marked placeholder, a second rendition gets its own cell."""
    if not item["image"]:
        return [(
            f'<img src="{path_prefix}docs/images/layout-placeholder.svg" width="180" alt="{item["id"]} {item["name"]}（待补图）">',
            f'**{item["id"]}**<br>{item["name"]}<br>待补图',
        )]
    renditions = [(item["image"], item["thumbnail"], "")]
    if item.get("variant_image"):
        renditions.append((item["variant_image"], item["variant_thumbnail"], " · 第二版"))
    return [
        (
            f'<a href="{path_prefix}{image}"><img src="{path_prefix}{thumb}" width="180" alt="{item["id"]} {item["name"]}{suffix}"></a>',
            f'**{item["id"]}**<br>{item["name"]}{suffix}',
        )
        for image, thumb, suffix in renditions
    ]


def gallery_tables(entries: list[dict[str, object]], path_prefix: str = "") -> list[str]:
    lines: list[str] = []
    flat = [cell for item in entries for cell in gallery_cells(item, path_prefix)]
    for offset in range(0, len(flat), 4):
        group = flat[offset : offset + 4]
        cells = [cell for cell, _ in group]
        labels = [label for _, label in group]
        while len(cells) < 4:
            cells.append(f'<img src="{path_prefix}docs/images/layout-placeholder.svg" width="180" alt="">')
            labels.append("&nbsp;")
        lines.extend(
            [
                "| " + " | ".join(cells) + " |",
                "| :---: | :---: | :---: | :---: |",
                "| " + " | ".join(labels) + " |",
                "",
            ]
        )
    return lines


def category_nav(grouped: dict[str, list[dict[str, object]]], current: str) -> str:
    links = ["总览" if current == "README" else "[总览](README.md)"]
    for index, category in enumerate(CATEGORIES, start=1):
        label = f"{index:02d}&nbsp;" + category.short.replace(" ", "&nbsp;")
        count = len(grouped[category.source_name])
        links.append(f"{label}&nbsp;{count}" if current == category.slug else f"[{label}]({category.slug}.md)&nbsp;{count}")
    return " · ".join(links)


def build_gallery_page(
    repo: Path, category: Category, items: list[dict[str, object]], grouped: dict[str, list[dict[str, object]]]
) -> None:
    page = repo / "docs" / "350" / f"{category.slug}.md"
    lines = [
        f"# {category.title} · {len(items)} 种",
        "",
        category_nav(grouped, category.slug),
        "",
        category.description,
        "",
        "**本类主题：** " + " · ".join(
            f'[{subcategory.title}](#{subcategory.slug})'
            for subcategory in SUBCATEGORIES[category.slug]
        ),
        "",
    ]
    for subcategory in SUBCATEGORIES[category.slug]:
        subgroup = [item for item in items if item["subcategory_slug"] == subcategory.slug]
        lines.extend(
            [
                f'<a id="{subcategory.slug}"></a>',
                "",
                f"## {subcategory.title} · {len(subgroup)} 种",
                "",
                f"{subcategory.description} `{subcategory.start:03d}–{subcategory.end:03d}`",
                "",
            ]
        )
        lines.extend(gallery_tables(subgroup, "../../"))
    page.write_text("\n".join(lines), encoding="utf-8")


def build_readme_default_gallery(repo: Path, items: list[dict[str, object]]) -> None:
    readme = repo / "README.md"
    text = readme.read_text(encoding="utf-8")
    start_marker = "<!-- default-gallery:start -->"
    end_marker = "<!-- default-gallery:end -->"
    if start_marker not in text or end_marker not in text:
        raise ValueError("README 缺少默认画廊标记")

    lines = [
        start_marker,
        "## 默认展示 · 构图逻辑 86 种",
        "",
        "进入项目即可浏览全部 86 种构图逻辑；点击缩略图打开 1086 × 1448 高清 PNG。",
        "",
        "**快速定位：** " + " · ".join(
            f'[{subcategory.title}](#default-{subcategory.slug})'
            for subcategory in SUBCATEGORIES["01-composition-logic"]
        ),
        "",
    ]
    for subcategory in SUBCATEGORIES["01-composition-logic"]:
        subgroup = [item for item in items if item["subcategory_slug"] == subcategory.slug]
        lines.extend(
            [
                f'<a id="default-{subcategory.slug}"></a>',
                "",
                f"### {subcategory.title} · {len(subgroup)} 种",
                "",
                f"{subcategory.description} `{subcategory.start:03d}–{subcategory.end:03d}`",
                "",
            ]
        )
        lines.extend(gallery_tables(subgroup))
    lines.extend([end_marker, ""])

    prefix, remainder = text.split(start_marker, 1)
    _, suffix = remainder.split(end_marker, 1)
    readme.write_text(prefix + "\n".join(lines) + suffix.lstrip("\n"), encoding="utf-8")


def build_index(repo: Path, grouped: dict[str, list[dict[str, object]]]) -> None:
    lines = [
        "# 350 种排版 · 分类图鉴",
        "",
        category_nav(grouped, "README"),
        "",
        "这是一套从构图基础到具体媒介的排版知识图鉴。350 个版式按 8 个一级分类、33 个二级主题组织；展开分类查看主题，点击主题直达对应画廊。",
        "",
        "[← 返回项目首页](../../README.md)",
        "",
    ]
    for index, category in enumerate(CATEGORIES, start=1):
        items = grouped[category.source_name]
        first, last = items[0]["id"], items[-1]["id"]
        lines.extend(
            [
                "<details open>" if index == 1 else "<details>",
                f"<summary><strong>{index:02d} · {category.title}</strong>　{len(items)} 种 · {first}–{last}</summary>",
                "",
                category.description,
                "",
                "| 二级主题 | 数量 | 编号 | 内容 |",
                "| --- | ---: | --- | --- |",
            ]
        )
        for subcategory in SUBCATEGORIES[category.slug]:
            count = subcategory.end - subcategory.start + 1
            lines.append(
                f"| [{subcategory.title}]({category.slug}.md#{subcategory.slug}) | {count} | "
                f"{subcategory.start:03d}–{subcategory.end:03d} | {subcategory.description} |"
            )
        lines.extend(["", f"**[打开「{category.title}」完整画廊 →]({category.slug}.md)**", "", "</details>", ""])
    lines.extend(
        [
            "",
            "## 浏览方式",
            "",
            "- 想系统学习：按 01–08 的顺序浏览。",
            "- 想解决具体设计问题：直接进入对应媒介分类。",
            "- 想查某个名称：在 GitHub 页面使用浏览器查找，或下载 [`catalog.csv`](../../v2/catalog.csv)。",
            "",
            "## 数据说明",
            "",
            "- 高清图：[`v2/images/`](../../v2/images/)",
            "- 轻量预览：[`v2/thumbnails/`](../../v2/thumbnails/)",
            "- 机器可读目录：[`catalog.json`](../../v2/catalog.json) / [`catalog.csv`](../../v2/catalog.csv)",
            "- 每项均保留全局连续编号，分类不会改变编号与名称之间的对应关系。",
            "",
        ]
    )
    (repo / "docs" / "350" / "README.md").write_text("\n".join(lines), encoding="utf-8")


CATALOG_FIELDS = [
    "id", "name", "category", "category_slug", "subcategory", "subcategory_slug",
    "image", "thumbnail", "width", "height", "sha256",
    "variant_image", "variant_thumbnail", "variant_sha256",
]


def write_catalog(repo: Path, catalog: list[dict[str, object]]) -> None:
    with (repo / "v2" / "catalog.json").open("w", encoding="utf-8") as target:
        json.dump(catalog, target, ensure_ascii=False, indent=2)
        target.write("\n")
    with (repo / "v2" / "catalog.csv").open("w", encoding="utf-8-sig", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=CATALOG_FIELDS, lineterminator="\n", restval="")
        writer.writeheader()
        writer.writerows(catalog)


def build_docs(repo: Path, catalog: list[dict[str, object]]) -> None:
    grouped = {category.source_name: [item for item in catalog if item["category_slug"] == category.slug] for category in CATEGORIES}
    for category in CATEGORIES:
        build_gallery_page(repo, category, grouped[category.source_name], grouped)
    build_index(repo, grouped)
    build_readme_default_gallery(repo, grouped[CATEGORIES[0].source_name])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, nargs="?", help="350 张瑞士平面图片目录")
    parser.add_argument("--from-catalog", action="store_true", help="不读源目录，按 v2/catalog.json 重建 Markdown")
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--skip-images", action="store_true", help="只重建目录和 Markdown")
    args = parser.parse_args()

    repo = args.repo.resolve()
    if args.from_catalog:
        catalog = json.loads((repo / "v2" / "catalog.json").read_text(encoding="utf-8"))
        build_docs(repo, catalog)
        print(f"已按目录重建 {len(catalog)} 项的 Markdown。")
        return
    source = args.source.resolve()
    mapping_path = source / "整理结果" / "图片对应关系.tsv"
    source_images = source / "整理结果" / "按主题分组"
    rows = parse_mapping(mapping_path)
    category_by_source = {category.source_name: category for category in CATEGORIES}
    unknown = sorted({row["主题"] for row in rows} - set(category_by_source))
    if unknown:
        raise ValueError(f"发现未知分类：{', '.join(unknown)}")

    (repo / "docs" / "350").mkdir(parents=True, exist_ok=True)
    (repo / "v2" / "images").mkdir(parents=True, exist_ok=True)
    (repo / "v2" / "thumbnails").mkdir(parents=True, exist_ok=True)
    catalog: list[dict[str, object]] = []

    for row in rows:
        category = category_by_source[row["主题"]]
        filename = image_name(row)
        source_image = source_images / row["主题"] / filename
        if not source_image.is_file():
            raise FileNotFoundError(source_image)
        image_path = Path("v2") / "images" / category.slug / filename
        thumb_path = Path("v2") / "thumbnails" / category.slug / f"{Path(filename).stem}.jpg"
        target_image = repo / image_path
        target_thumb = repo / thumb_path
        target_image.parent.mkdir(parents=True, exist_ok=True)
        target_thumb.parent.mkdir(parents=True, exist_ok=True)
        if not args.skip_images:
            if not target_image.exists() or source_image.stat().st_size != target_image.stat().st_size:
                shutil.copy2(source_image, target_image)
            if not target_thumb.exists() or target_thumb.stat().st_mtime < source_image.stat().st_mtime:
                with Image.open(source_image) as image:
                    image.thumbnail((480, 640), Image.Resampling.LANCZOS)
                    image.convert("RGB").save(target_thumb, "JPEG", quality=82, optimize=True, progressive=True)
        if not target_image.is_file() or not target_thumb.is_file():
            raise FileNotFoundError(f"缺少输出图片：{target_image} / {target_thumb}")
        with Image.open(target_image) as imported_image:
            width, height = imported_image.size
        item: dict[str, object] = {
            "id": row["序号"],
            "name": layout_name(row),
            "category": category.title,
            "category_slug": category.slug,
            "subcategory": subcategory_for(category.slug, row["序号"]).title,
            "subcategory_slug": subcategory_for(category.slug, row["序号"]).slug,
            "image": image_path.as_posix(),
            "thumbnail": thumb_path.as_posix(),
            "width": width,
            "height": height,
            "sha256": sha256(target_image),
        }
        catalog.append(item)

    write_catalog(repo, catalog)
    build_docs(repo, catalog)
    print(f"已导入 {len(catalog)} 张图片，生成 {len(CATEGORIES)} 个分类页面。")


if __name__ == "__main__":
    main()
