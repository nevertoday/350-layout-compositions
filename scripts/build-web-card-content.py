#!/usr/bin/env python3
"""Build browser metadata and copy-ready prompts from audited image OCR."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]

# Ambiguous OCR matches reviewed against the full-resolution cards. Values are
# canonical catalog ids for the concept visible in each source image. Repeated
# values are intentional: the source collection contains alternate cards for
# the same concept.
MANUAL_MATCHES = {
    "019": "019", "022": "088", "024": "090", "025": "091", "031": "097",
    "032": "098", "036": "102", "040": "106", "044": "110", "062": "032",
    "063": "033", "068": "038", "071": "041", "073": "043", "091": "061",
    "098": "069", "102": "072", "107": "077", "108": "078", "111": "192",
    "119": "200", "140": "171", "152": "135", "154": "133", "157": "136",
    "158": "141", "170": "192", "172": "203", "181": "142", "183": "144",
    "184": "145", "186": "147", "187": "148", "189": "150", "190": "151",
    "202": "227", "203": "228", "205": "230", "221": "246", "222": "247",
    "225": "250", "231": "256", "236": "261", "239": "264", "242": "163",
    "243": "164", "245": "166", "246": "167", "260": "275", "267": "292",
    "270": "295", "273": "303", "284": "299", "308": "318", "321": "218",
    "322": "219", "324": "221", "325": "335", "326": "336", "327": "337",
    "330": "340", "332": "342", "333": "343", "334": "344", "336": "346",
    "338": "348", "339": "349", "340": "350", "343": "333", "346": "213",
    "347": "214", "348": "215", "350": "217",
}

DISPLAY_NAME_FIXES = {
    "335": "标题幻灯片版式",
}

MEDIUM_BY_CATEGORY = {
    "构图逻辑": "摄影、插画或海报画面",
    "视觉原则与阅读模式": "视觉设计画面",
    "平面、出版与广告": "平面版式",
    "字体、网格与东亚文字": "文字版式",
    "网页与 UI": "桌面端界面",
    "影视画面构图": "影视单帧画面",
    "中国传统构图": "具有东方空间意识的画面",
    "演示文稿页面": "演示文稿页面",
}

DESCRIPTION_BY_CATEGORY = {
    "构图逻辑": "以「{name}」安排主体、空间关系与视线方向，让画面结构清楚、焦点明确。",
    "视觉原则与阅读模式": "把「{name}」作为主要视觉原则，用层级、对比、节奏与留白组织信息。",
    "平面、出版与广告": "以「{name}」组织标题、正文、图像与留白，建立清晰的版面层级和阅读节奏。",
    "字体、网格与东亚文字": "以「{name}」控制文字方向、对齐、网格与留白，让排版秩序清晰且易读。",
    "网页与 UI": "以「{name}」组织界面区域、导航与内容层级，让浏览路径清晰、操作重点明确。",
    "影视画面构图": "以「{name}」安排人物、镜头视点与景深关系，让画面叙事和注意力方向明确。",
    "中国传统构图": "以「{name}」经营取景、留白、虚实与主次，让视线在画面中自然游走。",
    "演示文稿页面": "以「{name}」组织标题、内容与数据，让讲述顺序清晰、重点一眼可见。",
}


def build_prompt(name: str, category: str, synopsis: str) -> str:
    medium = MEDIUM_BY_CATEGORY[category]
    return (
        f"请以「{name}」为核心设计一张{medium}。{synopsis}"
        "让这一结构在第一眼就能被识别；明确主视觉焦点，"
        "用尺寸、位置、方向、对比、留白与节奏组织信息。保持层级清晰、阅读路径自然，"
        "删去与主题无关的装饰，呈现克制、清楚、可落地的设计感。"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mapping", type=Path, help="independent OCR mapping JSON")
    parser.add_argument("ocr_jsonl", type=Path, help="full-resolution OCR JSONL")
    parser.add_argument("--output", type=Path, default=REPO / "web" / "card-content.js")
    args = parser.parse_args()

    catalog = json.loads((REPO / "v2" / "catalog.json").read_text(encoding="utf-8"))
    catalog_by_id = {item["id"]: item for item in catalog}
    mapping = {
        item["file_id"]: item
        for item in json.loads(args.mapping.read_text(encoding="utf-8"))
    }
    ocr = {
        Path(document["path"]).stem.split("-", 1)[0]: document
        for document in (
            json.loads(line) for line in args.ocr_jsonl.read_text(encoding="utf-8").splitlines()
        )
    }

    if set(mapping) != set(catalog_by_id) or set(ocr) != set(catalog_by_id):
        raise ValueError("mapping, OCR and catalog must contain the same 350 source ids")

    content: dict[str, dict[str, object]] = {}
    for source_item in catalog:
        source_id = source_item["id"]
        matched_id = MANUAL_MATCHES.get(source_id, mapping[source_id]["matched_id"])
        matched_item = catalog_by_id[matched_id]
        name = DISPLAY_NAME_FIXES.get(matched_id, matched_item["name"])
        synopsis = DESCRIPTION_BY_CATEGORY[matched_item["category"]].format(name=name)
        content[source_id] = {
            "matchId": matched_id,
            "name": name,
            "category": matched_item["category"],
            "categorySlug": matched_item["category_slug"],
            "subcategory": matched_item["subcategory"],
            "subcategorySlug": matched_item["subcategory_slug"],
            "description": synopsis,
            "prompt": build_prompt(name, matched_item["category"], synopsis),
        }

    payload = json.dumps(content, ensure_ascii=False, indent=2)
    args.output.write_text(f"window.LAYOUT_CONTENT = {payload};\n", encoding="utf-8")
    print(
        f"wrote {len(content)} cards to {args.output}; "
        f"manual_reviews={len(MANUAL_MATCHES)} unique_concepts={len({item['matchId'] for item in content.values()})}"
    )


if __name__ == "__main__":
    main()
