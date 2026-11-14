#!/usr/bin/env python3
"""Match the title visible in each card image against the canonical catalog names."""

from __future__ import annotations

import argparse
from collections import Counter
import difflib
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Candidate:
    text: str
    height: float
    confidence: float


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower()
    value = value.replace("臺", "台").replace("佈", "布")
    return "".join(re.findall(r"[0-9a-z\u3400-\u9fff]+", value))


def make_candidates(lines: list[dict[str, object]]) -> list[Candidate]:
    ordered = sorted(lines, key=lambda line: (-float(line["y"]), float(line["x"])))
    candidates = [
        Candidate(str(line["text"]), float(line["height"]), float(line["confidence"]))
        for line in ordered
        if len(normalize(str(line["text"]))) >= 2
    ]

    for first, second in zip(ordered, ordered[1:]):
        first_height = float(first["height"])
        second_height = float(second["height"])
        vertical_gap = abs(float(first["y"]) - float(second["y"]))
        horizontal_gap = abs(float(first["x"]) - float(second["x"]))
        if min(first_height, second_height) >= 0.025 and vertical_gap <= 0.14 and horizontal_gap <= 0.3:
            candidates.append(
                Candidate(
                    str(first["text"]) + str(second["text"]),
                    min(first_height, second_height),
                    min(float(first["confidence"]), float(second["confidence"])),
                )
            )

    # Large display titles are sometimes split into several OCR observations,
    # especially when the Chinese title is set vertically. Recombine those
    # observations before matching against the canonical names.
    headline_lines = [line for line in ordered if float(line["height"]) >= 0.035]
    for start in range(len(headline_lines)):
        for length in range(2, 6):
            group = headline_lines[start : start + length]
            if len(group) != length:
                continue
            left = min(float(line["x"]) for line in group)
            right = max(float(line["x"]) + float(line["width"]) for line in group)
            top = max(float(line["y"]) + float(line["height"]) for line in group)
            bottom = min(float(line["y"]) for line in group)
            if right - left > 0.38 or top - bottom > 0.38:
                continue
            candidates.append(
                Candidate(
                    "".join(str(line["text"]) for line in group),
                    min(float(line["height"]) for line in group),
                    min(float(line["confidence"]) for line in group),
                )
            )
    return candidates


def candidate_score(candidate: Candidate, expected_name: str) -> float:
    actual = normalize(candidate.text)
    expected = normalize(expected_name)
    if not actual or not expected:
        return 0.0

    similarity = difflib.SequenceMatcher(None, actual, expected).ratio()
    if expected in actual or actual in expected:
        coverage = min(len(actual), len(expected)) / max(len(actual), len(expected))
        similarity = max(similarity, 0.9 + 0.1 * coverage)

    visual_weight = min(candidate.height / 0.075, 1.0)
    confidence_weight = max(0.0, min(candidate.confidence, 1.0))
    length_penalty = min(abs(len(actual) - len(expected)) / max(len(expected), 1), 1.0)
    return similarity * 0.83 + visual_weight * 0.11 + confidence_weight * 0.06 - length_penalty * 0.04


def build_score_row(document: dict[str, object], names: list[str]) -> tuple[list[float], list[str]]:
    candidates = make_candidates(list(document["lines"]))
    prepared = [(candidate, normalize(candidate.text)) for candidate in candidates]
    scores: list[float] = []
    visible_texts: list[str] = []
    for name in names:
        expected = normalize(name)
        exact = [candidate for candidate, actual in prepared if expected in actual or actual in expected]
        if exact:
            eligible = exact
        else:
            expected_counts = Counter(expected)

            def overlap(value: tuple[Candidate, str]) -> float:
                _, actual = value
                shared = sum((Counter(actual) & expected_counts).values())
                return 2 * shared / max(len(actual) + len(expected), 1)

            eligible = [candidate for candidate, _ in sorted(prepared, key=overlap, reverse=True)[:12]]

        best_candidate = max(eligible, key=lambda candidate: candidate_score(candidate, name))
        scores.append(candidate_score(best_candidate, name))
        visible_texts.append(best_candidate.text)
    return scores, visible_texts


def hungarian_maximize(scores: list[list[float]]) -> list[int]:
    """Return the unique column assigned to each row."""
    row_count = len(scores)
    column_count = len(scores[0])
    if row_count > column_count:
        raise ValueError("Hungarian assignment requires rows <= columns")

    potentials_rows = [0.0] * (row_count + 1)
    potentials_columns = [0.0] * (column_count + 1)
    matched_row = [0] * (column_count + 1)
    previous_column = [0] * (column_count + 1)

    for row in range(1, row_count + 1):
        matched_row[0] = row
        current_column = 0
        minimum = [float("inf")] * (column_count + 1)
        used = [False] * (column_count + 1)
        while True:
            used[current_column] = True
            current_row = matched_row[current_column]
            delta = float("inf")
            next_column = 0
            for column in range(1, column_count + 1):
                if used[column]:
                    continue
                cost = 1.0 - scores[current_row - 1][column - 1]
                reduced_cost = cost - potentials_rows[current_row] - potentials_columns[column]
                if reduced_cost < minimum[column]:
                    minimum[column] = reduced_cost
                    previous_column[column] = current_column
                if minimum[column] < delta:
                    delta = minimum[column]
                    next_column = column
            for column in range(column_count + 1):
                if used[column]:
                    potentials_rows[matched_row[column]] += delta
                    potentials_columns[column] -= delta
                else:
                    minimum[column] -= delta
            current_column = next_column
            if matched_row[current_column] == 0:
                break
        while True:
            next_column = previous_column[current_column]
            matched_row[current_column] = matched_row[next_column]
            current_column = next_column
            if current_column == 0:
                break

    assignment = [-1] * row_count
    for column in range(1, column_count + 1):
        if matched_row[column] != 0:
            assignment[matched_row[column] - 1] = column - 1
    return assignment


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("ocr_jsonl", type=Path)
    parser.add_argument("--show", type=int, default=40, help="show this many lowest-confidence matches")
    parser.add_argument("--output", type=Path, help="write the one-to-one mapping as JSON")
    parser.add_argument(
        "--allow-duplicates",
        action="store_true",
        help="match every image independently; use when the source collection contains repeated topics",
    )
    args = parser.parse_args()

    catalog = json.loads((REPO / "v2" / "catalog.json").read_text(encoding="utf-8"))
    documents = [json.loads(line) for line in args.ocr_jsonl.read_text(encoding="utf-8").splitlines()]
    names = [str(item["name"]) for item in catalog]
    by_filename = {Path(str(document["path"])).stem.split("-", 1)[0]: document for document in documents}

    ordered_documents: list[dict[str, object]] = []
    for item in catalog:
        ordered_documents.append(by_filename[str(item["id"])])

    rows_and_texts = [build_score_row(document, names) for document in ordered_documents]
    score_matrix = [row for row, _ in rows_and_texts]
    visible_matrix = [visible for _, visible in rows_and_texts]
    if args.allow_duplicates:
        assignment = [max(range(len(row)), key=row.__getitem__) for row in score_matrix]
    else:
        assignment = hungarian_maximize(score_matrix)

    results: list[dict[str, object]] = []
    for row_index, (item, matched_index) in enumerate(zip(catalog, assignment, strict=True)):
        score = score_matrix[row_index][matched_index]
        alternative_scores = sorted(
            (value for index, value in enumerate(score_matrix[row_index]) if index != matched_index),
            reverse=True,
        )
        results.append(
            {
                "file_id": item["id"],
                "declared_name": item["name"],
                "matched_id": catalog[matched_index]["id"],
                "matched_name": catalog[matched_index]["name"],
                "visible_text": visible_matrix[row_index][matched_index],
                "score": score,
                "margin": score - alternative_scores[0],
            }
        )

    exact = sum(result["file_id"] == result["matched_id"] for result in results)
    strong = sum(float(result["score"]) >= 0.86 and float(result["margin"]) >= 0.04 for result in results)
    print(
        f"documents={len(results)} unique_matches={len(set(assignment))} "
        f"declared_matches={exact} strong={strong} duplicates_allowed={args.allow_duplicates}"
    )

    if args.output:
        args.output.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for result in sorted(results, key=lambda value: (float(value["score"]), float(value["margin"])))[: args.show]:
        print(
            f"{result['file_id']} {result['declared_name']} -> {result['matched_id']} {result['matched_name']} "
            f"score={result['score']:.3f} margin={result['margin']:.3f} visible={result['visible_text']!r}"
        )


if __name__ == "__main__":
    main()
