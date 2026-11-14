#!/usr/bin/env python3
"""Print compact OCR evidence for card images that still need mapping review."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]


def useful_text(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value) or re.search(r"[A-Z]{3}", value))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mapping", type=Path)
    parser.add_argument("ocr_jsonl", type=Path)
    parser.add_argument("--score", type=float, default=0.95)
    parser.add_argument("--margin", type=float, default=0.04)
    parser.add_argument("--include-fixed", action="store_true")
    parser.add_argument("--mismatches-only", action="store_true")
    parser.add_argument("--from-id", type=int, default=1)
    parser.add_argument("--to-id", type=int, default=350)
    args = parser.parse_args()

    catalog = json.loads((REPO / "v2" / "catalog.json").read_text(encoding="utf-8"))
    mapping = json.loads(args.mapping.read_text(encoding="utf-8"))
    ocr = {
        Path(document["path"]).stem.split("-", 1)[0]: document
        for document in (
            json.loads(line) for line in args.ocr_jsonl.read_text(encoding="utf-8").splitlines()
        )
    }
    fixed = {
        result["file_id"]: result
        for result in mapping
        if result["score"] >= args.score and result["margin"] >= args.margin
    }
    used = {result["matched_id"] for result in fixed.values()}
    remaining_names = [item for item in catalog if item["id"] not in used]

    print(f"FIXED {len(fixed)} / UNRESOLVED {len(catalog) - len(fixed)}")
    print("REMAINING NAMES")
    for offset in range(0, len(remaining_names), 12):
        print(" | ".join(f"{item['id']} {item['name']}" for item in remaining_names[offset : offset + 12]))

    print("\nUNRESOLVED FILES")
    for item in catalog:
        if not args.from_id <= int(item["id"]) <= args.to_id:
            continue
        if item["id"] in fixed and not args.include_fixed:
            continue
        result = next(value for value in mapping if value["file_id"] == item["id"])
        if args.mismatches_only and result["matched_id"] == item["id"]:
            continue
        lines = [
            str(line["text"]).strip()
            for line in ocr[item["id"]]["lines"]
            if useful_text(str(line["text"]))
        ]
        evidence = " / ".join(lines[:14])
        print(
            f"{item['id']} declared={item['name']} suggested={result['matched_id']} {result['matched_name']} "
            f"score={result['score']:.3f} margin={result['margin']:.3f}\n  {evidence}"
        )


if __name__ == "__main__":
    main()
