#!/usr/bin/env python3
"""Verify both the classic 100-layout set and the classified 350-layout set."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image


REPO = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def verify_classic() -> None:
    for number in range(1, 101):
        image = REPO / "images" / f"layout-{number:03d}.png"
        thumbnail = REPO / "thumbnails" / f"layout-{number:03d}.jpg"
        if not image.is_file() or not thumbnail.is_file():
            fail(f"经典版缺少第 {number:03d} 项")


def verify_v2() -> list[dict[str, object]]:
    json_path = REPO / "v2" / "catalog.json"
    csv_path = REPO / "v2" / "catalog.csv"
    catalog = json.loads(json_path.read_text(encoding="utf-8"))
    with csv_path.open(encoding="utf-8-sig", newline="") as source:
        csv_catalog = list(csv.DictReader(source))
    if len(catalog) != 350 or len(csv_catalog) != 350:
        fail(f"新版目录数量异常：JSON={len(catalog)}, CSV={len(csv_catalog)}")
    expected_ids = [f"{number:03d}" for number in range(1, 351)]
    if [item["id"] for item in catalog] != expected_ids:
        fail("新版目录编号不是连续的 001–350")
    if [item["id"] for item in csv_catalog] != expected_ids:
        fail("CSV 目录编号与 JSON 不一致")
    if len({item["name"] for item in catalog}) != 350:
        fail("新版目录中存在重复名称")
    paths = [path for item in catalog for path in (item["image"], item.get("variant_image")) if path]
    if len(set(paths)) != len(paths):
        fail("新版目录中存在重复图片路径")
    categories = {item["category_slug"] for item in catalog}
    if len(categories) != 8:
        fail(f"新版分类应为 8 个，实际为 {len(categories)} 个")
    subcategories = {item.get("subcategory_slug") for item in catalog}
    if None in subcategories or len(subcategories) != 33:
        fail(f"新版二级分类应为 33 个，实际为 {len(subcategories - {None})} 个")
    for json_item, csv_item in zip(catalog, csv_catalog, strict=True):
        for field in ("category", "category_slug", "subcategory", "subcategory_slug"):
            if str(json_item[field]) != csv_item[field]:
                fail(f"{json_item['id']} 的 JSON/CSV 字段不一致：{field}")

    for item in catalog:
        if not item["image"]:
            if item["thumbnail"] or item["sha256"] or item.get("variant_image"):
                fail(f"{item['id']} 标为待补图，却仍带有图片字段")
            continue
        renditions = [(item["image"], item["thumbnail"], item["sha256"], f"{item['id']}-{item['name']}.png")]
        if item.get("variant_image"):
            renditions.append((item["variant_image"], item["variant_thumbnail"], item["variant_sha256"], f"{item['id']}-{item['name']}-第二版.png"))
        for image_rel, thumb_rel, sha, filename in renditions:
            image_path = REPO / str(image_rel)
            thumb_path = REPO / str(thumb_rel)
            if not image_path.is_file() or not thumb_path.is_file():
                fail(f"{item['id']} 缺少高清图或缩略图：{image_rel}")
            if image_path.name != filename or thumb_path.name != f"{Path(filename).stem}.jpg":
                fail(f"{item['id']} 名称与图片文件名不一致：{image_rel}")
            with Image.open(image_path) as image:
                image.verify()
            with Image.open(image_path) as image:
                if list(image.size) != [int(item["width"]), int(item["height"])]:
                    fail(f"{item['id']} 图片尺寸与目录不一致")
            with Image.open(thumb_path) as thumbnail:
                thumbnail.verify()
            if digest(image_path) != sha:
                fail(f"{item['id']} SHA-256 与目录不一致：{image_rel}")
    on_disk = {path.relative_to(REPO).as_posix() for path in (REPO / "v2" / "images").rglob("*.png")}
    if on_disk != set(paths):
        fail(f"v2/images 与目录不一致：多出 {sorted(on_disk - set(paths))[:3]}，缺少 {sorted(set(paths) - on_disk)[:3]}")
    return catalog


def verify_markdown_links() -> None:
    pages = [REPO / "README.md", REPO / "v2" / "README.md"]
    pages.extend(sorted((REPO / "docs" / "350").glob("*.md")))
    link_pattern = re.compile(r'(?:href|src)="([^"]+)"|\[[^]]*\]\(([^)]+)\)')
    for page in pages:
        text = page.read_text(encoding="utf-8")
        for match in link_pattern.finditer(text):
            link = match.group(1) or match.group(2)
            if link.startswith(("http://", "https://", "mailto:")):
                continue
            target, _, fragment = link.partition("#")
            path = page if not target else (page.parent / target).resolve()
            if not path.exists():
                fail(f"链接不存在：{page.relative_to(REPO)} -> {link}")
            if fragment and path.suffix == ".md":
                target_text = path.read_text(encoding="utf-8")
                if f'id="{fragment}"' not in target_text:
                    fail(f"页面锚点不存在：{page.relative_to(REPO)} -> {link}")


def verify_default_gallery(catalog: list[dict[str, object]]) -> None:
    text = (REPO / "README.md").read_text(encoding="utf-8")
    start_marker = "<!-- default-gallery:start -->"
    end_marker = "<!-- default-gallery:end -->"
    if text.count(start_marker) != 1 or text.count(end_marker) != 1:
        fail("README 默认画廊标记异常")
    gallery = text.split(start_marker, 1)[1].split(end_marker, 1)[0]
    composition = [item for item in catalog if item["category_slug"] == "01-composition-logic"]
    expected = {
        f'v2/thumbnails/01-composition-logic/{item["id"]}-': (1 if item["image"] else 0) + (1 if item.get("variant_image") else 0)
        for item in composition
    }
    wrong = [prefix for prefix, count in expected.items() if gallery.count(prefix) != count]
    if len(composition) != 86 or wrong:
        fail(f"README 未默认完整展示构图逻辑 001–086：{wrong[:3]}")
    for item in composition:
        if not item["image"] and f"**{item['id']}**<br>{item['name']}<br>待补图" not in gallery:
            fail(f"README 未标出待补图：{item['id']}")


def verify_gallery_cells() -> None:
    pages = [REPO / "README.md"]
    pages.extend(sorted((REPO / "docs" / "350").glob("[0-9][0-9]-*.md")))
    for page in pages:
        for line_number, line in enumerate(page.read_text(encoding="utf-8").splitlines(), start=1):
            if line.startswith("| <") and ("v2/thumbnails/" in line or "layout-placeholder.svg" in line):
                if line.count("<img ") != 4:
                    fail(f"画廊行未撑满 4 个单元格：{page.relative_to(REPO)}:{line_number}")


def main() -> None:
    verify_classic()
    catalog = verify_v2()
    verify_markdown_links()
    verify_default_gallery(catalog)
    verify_gallery_cells()
    category_counts: dict[str, int] = {}
    for item in catalog:
        category = str(item["category"])
        category_counts[category] = category_counts.get(category, 0) + 1
    summary = "，".join(f"{name} {count}" for name, count in category_counts.items())
    missing = sum(1 for item in catalog if not item["image"])
    variants = sum(1 for item in catalog if item.get("variant_image"))
    print(f"验证通过：README 默认展示构图逻辑 86 种；经典版 100 张；新版 350 种 / 8 个一级分类 / 33 个二级分类（{summary}），其中待补图 {missing} 种、第二版 {variants} 张；本地链接完整。")


if __name__ == "__main__":
    main()
