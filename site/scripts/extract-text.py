#!/usr/bin/env python3
"""Transcribe the text printed on each poster into structured JSON.

  extract-text.py run   [--model M] [--jobs N] [--only 001,002]
  extract-text.py verify [--primary M] [--check M] [--judge M]

`run` sends each poster (read straight from git) to an OpenAI-compatible
Responses endpoint and writes .cache/text/<model>/<id>.json. Finished posters
are skipped, so rerunning resumes.

`verify` builds src/data/poster-text.json from the primary reading. Every
string the site shows must also appear in the independent check reading; a
field the primary left empty is taken from the check reading when its text is
nowhere in the primary. Strings only one reading has go to a third model with
the poster, which returns the exact printed text or "" when it is not there.
A correction is applied only when the judge's text matches the check
reading's (two of three agree); otherwise the primary text stays.
A "" is ignored when the other reading saw a similar line, and an answer that
only adds surrounding text to the line, or only cuts 4+ characters from it,
keeps the line.
Rulings are cached in .cache/text/judge/<id>.json, the report is
.cache/text/verify.md.

Endpoint: XXD_CPA_URL and XXD_CPA_KEY, or the local CLIProxyAPI config.
"""
import argparse, base64, difflib, json, os, re, subprocess, sys, threading, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
REPO = SITE.parent
CACHE = SITE / ".cache" / "text"
OUT = SITE / "src" / "data" / "poster-text.json"

PROMPT = """这是一张排版/构图教学海报。只抄录海报上印着的文字，不要补写、不要改写、不要翻译。按下面的 JSON 输出（没有的字段给空字符串或空数组）：
{
 "title": "海报主标题（中文）",
 "title_en": "主标题下的英文名，原样大小写",
 "series": "左上角栏目名，原样",
 "tagline": "右上角或角落的那一句，原样",
 "summary": "主标题下面的说明段落，合成一段",
 "points": [{"title": "要点标题", "body": "要点说明", "en": "要点下的英文小字"}],
 "usage_title": "应用建议这类框的标题",
 "usage": ["框里的每一条，原样"],
 "keywords": [{"zh": "关键词", "en": "英文"}],
 "other_text": ["图里其他成段的说明文字（图示里的标注小字省略）"]
}
多行文字合成一行：原文换行处用一个空格连接，不加标点。只输出 JSON。"""

FIELDS = ["title", "title_en", "series", "tagline", "summary", "points", "usage_title", "usage", "keywords", "other_text"]


def endpoint():
    url, key = os.environ.get("XXD_CPA_URL"), os.environ.get("XXD_CPA_KEY")
    if url and key:
        return url.rstrip("/"), key
    cfg = Path.home() / "gcli2api" / "config.yaml"
    text = cfg.read_text()
    port = re.search(r"^port:\s*(\d+)", text, re.M).group(1)
    key = re.search(r"^api-keys:\s*\n\s*-\s*\"?([^\"\n]+)", text, re.M).group(1)
    return f"http://127.0.0.1:{port}", key


def posters():
    catalog = json.loads((REPO / "v2" / "catalog.json").read_text())
    return [(p["id"], p["image"]) for p in catalog]


class Blobs:
    """Reads files at HEAD through one `git cat-file --batch` process."""

    def __init__(self):
        self.proc = subprocess.Popen(["git", "-C", str(REPO), "cat-file", "--batch"],
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        self.lock = threading.Lock()

    def read(self, path):
        with self.lock:
            self.proc.stdin.write(f"HEAD:{path}\n".encode())
            self.proc.stdin.flush()
            header = self.proc.stdout.readline().decode().split()
            if header[-1] == "missing":
                raise FileNotFoundError(path)
            data = self.proc.stdout.read(int(header[2]))
            self.proc.stdout.read(1)
            return data


def ask(url, key, model, png, prompt):
    body = {"model": model,
            "input": [{"role": "user", "content": [
                {"type": "input_text", "text": prompt},
                {"type": "input_image", "image_url": "data:image/png;base64," + base64.b64encode(png).decode()}]}],
            "text": {"format": {"type": "json_object"}}}
    req = urllib.request.Request(url + "/v1/responses", data=json.dumps(body).encode(),
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    res = json.load(urllib.request.urlopen(req, timeout=300))
    return json.loads("".join(c.get("text", "") for o in res.get("output", []) if o.get("type") == "message" for c in o["content"]))


def transcribe(url, key, model, png):
    data = ask(url, key, model, png, PROMPT)
    return {f: data.get(f, [] if f in ("points", "usage", "keywords", "other_text") else "") for f in FIELDS}


def retry(fn, label):
    for attempt in range(4):
        try:
            return fn()
        except Exception as e:
            print(f"retry {label} #{attempt + 1}: {e}", flush=True)
            time.sleep(5 * (attempt + 1))
    return None


def run(args):
    url, key = endpoint()
    out = CACHE / args.model
    out.mkdir(parents=True, exist_ok=True)
    todo = [(i, p) for i, p in posters() if not (out / f"{i}.json").exists()]
    if args.only:
        keep = set(args.only.split(","))
        todo = [t for t in todo if t[0] in keep]
    print(f"{args.model}: {len(todo)} to do", flush=True)
    blobs = Blobs()
    failed = []

    def one(item):
        pid, path = item
        data = retry(lambda: transcribe(url, key, args.model, blobs.read(path)), pid)
        if data is None:
            failed.append(pid)
            return
        write_json(out / f"{pid}.json", data)
        print(f"ok {pid} {data['title']}", flush=True)

    with ThreadPoolExecutor(args.jobs) as pool:
        list(pool.map(one, todo))
    print(f"done; failed: {','.join(failed) or 'none'}", flush=True)
    return 1 if failed else 0


def write_json(path, data):
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    tmp.rename(path)


def norm(text):
    """Readings differ harmlessly in punctuation, spacing and case; compare the characters."""
    return re.sub(r"[\W_]+", "", text, flags=re.U).lower()


SHOWN = ("title_en", "summary", "points", "usage_title", "usage", "keywords", "other_text")


def strings(d):
    """(path, text) for every string the site shows."""
    out = [(("title_en",), d["title_en"]), (("summary",), d["summary"]), (("usage_title",), d["usage_title"])]
    for i, p in enumerate(d["points"]):
        out += [(("points", i, k), p.get(k, "")) for k in ("title", "body", "en")]
    out += [(("usage", i), u) for i, u in enumerate(d["usage"])]
    for i, k in enumerate(d["keywords"]):
        out += [(("keywords", i, f), k.get(f, "")) for f in ("zh", "en")]
    out += [(("other_text", i), t) for i, t in enumerate(d["other_text"])]
    return [(path, t) for path, t in out if isinstance(t, str) and len(norm(t)) >= 2]


def everything(d):
    return norm(" ".join(t for _, t in strings(d)) + d.get("series", "") + d.get("tagline", ""))


def within(short, long):
    """Every character of short appears in long, in order."""
    it = iter(long)
    return all(ch in it for ch in short)


def put(d, path, value):
    target = d
    for k in path[:-1]:
        target = target[k]
    target[path[-1]] = value


JUDGE = """下面每一条是从这张海报上抄下来的文字，两次抄写有出入。对照海报逐条给出海报上**实际印着的**原文（只改错字、漏字、多字；多行文字用一个空格连接，不加标点）。如果这条文字海报上根本没有，给空字符串。
只输出 JSON：{"items": [{"n": 编号, "text": "原文"}]}

"""


def verify(args):
    catalog = posters()
    if args.only:
        keep = set(args.only.split(","))
        catalog = [c for c in catalog if c[0] in keep]
    judged_dir = CACHE / "judge"
    judged_dir.mkdir(parents=True, exist_ok=True)
    final, todo, filled = {}, {}, []
    for pid, path in catalog:
        a, b = (json.loads((CACHE / m / f"{pid}.json").read_text()) for m in (args.primary, args.check))
        d = json.loads(json.dumps(a))
        source = {}
        full_a = everything(a)
        for f in ("summary", "points", "usage", "keywords"):
            if not d[f] and b[f] and norm(json.dumps(b[f], ensure_ascii=False)) not in full_a:
                d[f] = b[f]
                filled.append(f"{pid}.{f}")
                if f == "usage" and not d["usage_title"]:
                    d["usage_title"] = b["usage_title"]
                source[f] = "check"
        full = {"primary": full_a, "check": everything(b)}
        doubts = []
        for spath, text in strings(d):
            other = "primary" if source.get(spath[0]) == "check" else "check"
            if norm(text) not in full[other]:
                pool = [t for _, t in strings(a if other == "primary" else b)]
                alt = max(pool, key=lambda t: difflib.SequenceMatcher(None, norm(text), norm(t)).ratio(), default="")
                if difflib.SequenceMatcher(None, norm(text), norm(alt)).ratio() < 0.5:
                    alt = ""
                doubts.append({"path": spath, "text": text, "alt": alt})
        final[pid] = d
        if doubts:
            todo[pid] = (path, doubts)

    url, key = endpoint()
    blobs = Blobs()

    def rule(pid):
        cached = judged_dir / f"{pid}.json"
        path, doubts = todo[pid]
        asked = [{"n": i, "text": x["text"], **({"alt": x["alt"]} if x["alt"] else {})} for i, x in enumerate(doubts)]
        if cached.exists():
            got = json.loads(cached.read_text())
            if got.get("asked") == asked:
                return got
        listing = "\n".join(f'{q["n"]}. 抄写一：{q["text"]}' + (f' ｜ 抄写二：{q["alt"]}' if "alt" in q else "") for q in asked)
        res = retry(lambda: ask(url, key, args.judge, blobs.read(path), JUDGE + listing), pid)
        if res is None:
            return None
        got = {"asked": asked, "items": res.get("items", [])}
        write_json(cached, got)
        print(f"judged {pid}: {len(asked)}", flush=True)
        return got

    with ThreadPoolExecutor(args.jobs) as pool:
        rulings = dict(zip(todo, pool.map(rule, list(todo))))

    report, changed, removed, kept, unjudged = [], 0, 0, 0, []
    for pid, (path, doubts) in todo.items():
        got = rulings[pid]
        if got is None:
            unjudged.append(pid)
            continue
        answer = {int(x["n"]): x.get("text", "") for x in got["items"] if str(x.get("n", "")).isdigit()}
        for i, x in enumerate(doubts):
            if i not in answer:
                unjudged.append(f"{pid}#{i}")
                continue
            new = answer[i].strip()
            # The judge sometimes says "" for a line the other reading also saw, or quotes the
            # surrounding block around a line it confirms; both mean the line is printed as is.
            gone_but_seen = not norm(new) and x["alt"]
            quoted_more = within(norm(x["text"]), norm(new)) and len(norm(new)) - len(norm(x["text"])) >= 4
            cut_short = norm(new) and within(norm(new), norm(x["text"])) and len(norm(x["text"])) - len(norm(new)) >= 4
            # A change needs two of three readings: the judge must land on what the check reading saw.
            no_majority = norm(new) and norm(new) != norm(x["alt"])
            if norm(new) == norm(x["text"]) or gone_but_seen or quoted_more or cut_short or no_majority:
                kept += 1
                continue
            put(final[pid], x["path"], new)
            if new:
                changed += 1
                report.append(f"- {pid} {'.'.join(map(str, x['path']))}: {x['text']} → {new}")
            else:
                removed += 1
                report.append(f"- {pid} {'.'.join(map(str, x['path']))}: removed {x['text']}")
    for d in final.values():
        d["points"] = [p for p in d["points"] if any(norm(p.get(k, "")) for k in ("title", "body"))]
        d["usage"] = [u for u in d["usage"] if norm(u)]
        d["keywords"] = [k for k in d["keywords"] if norm(k.get("zh", "")) or norm(k.get("en", ""))]
        d["other_text"] = [t for t in d["other_text"] if norm(t)]
    if unjudged:
        print("not judged, rerun verify: " + ", ".join(unjudged))
        return 1
    if not args.only:
        write_json(OUT, final)
    total = sum(len(strings(d)) for d in final.values())
    doubted = sum(len(v[1]) for v in todo.values())
    head = (f"# {len(final)} posters, {total} shown strings\n\n"
            f"- confirmed by both readings: {total - doubted + removed}\n"
            f"- fields filled from the check reading: {len(filled)} ({', '.join(filled) or 'none'})\n"
            f"- sent to {args.judge}: {doubted} on {len(todo)} posters; kept {kept}, corrected {changed}, removed {removed}\n\n")
    (CACHE / "verify.md").write_text(head + "\n".join(report) + "\n")
    print(head.strip())
    print(f"{'trial, nothing written' if args.only else 'written ' + str(OUT.relative_to(REPO))}; corrections listed in {(CACHE / 'verify.md').relative_to(REPO)}")
    return 0


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--model", default="gpt-6.2-sol")
    r.add_argument("--jobs", type=int, default=3)
    r.add_argument("--only")
    v = sub.add_parser("verify")
    v.add_argument("--primary", default="gpt-6.2-sol")
    v.add_argument("--check", default="gpt-6-sol")
    v.add_argument("--judge", default="gpt-6.1-sol")
    v.add_argument("--jobs", type=int, default=3)
    v.add_argument("--only", help="trial run on a few posters; does not write poster-text.json")
    args = ap.parse_args()
    sys.exit(run(args) if args.cmd == "run" else verify(args))


if __name__ == "__main__":
    main()
