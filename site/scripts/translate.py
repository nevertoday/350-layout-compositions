#!/usr/bin/env python3
"""Translate the text the site shows in zh into the other ten locales with Gemini (agy CLI).

  translate.py run [--locales en,ja] [--jobs N] [--only UNIT,UNIT] [--break LOCALE/UNIT]
  translate.py status
  translate.py assemble

`run` first exports .cache/i18n/source.json (node scripts/i18n-source.mjs), then
translates it in units, per locale:
  names-<category>  the category, its sub-themes and the names of its layouts, so the
                    terms are consistent; en takes a layout's name from its poster
                    (nameEn) and translates only the names without one
  posters-NN        summary, points, usage, keywords and notes of ten layouts, with
                    their names as fixed terms (runs after the names)
  ui                src/i18n/ui/zh.json, once it exists
Each unit is cached in .cache/i18n/<code>/<unit>.json with the zh it came from; a unit
whose zh is unchanged is skipped, so rerunning resumes and makes no model calls for
finished work. An answer is cached only after check() passes; otherwise it is retried
up to three times with the problems appended to the prompt.

`assemble` writes src/i18n/content/<code>.json and src/i18n/ui/<code>.json from every
cached entry whose zh still matches source.json and lists what is missing; `run` ends
with it. `--break LOCALE/UNIT` drops an array item from that unit's first answer, to
show the check and the retry at work.
"""
import argparse, json, os, re, shutil, statistics, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
CACHE = SITE / ".cache" / "i18n"
SOURCE = CACHE / "source.json"
CONTENT = SITE / "src" / "i18n" / "content"
GUIDES = SITE / "src" / "i18n" / "guides"
UI = SITE / "src" / "i18n" / "ui"
AGY = os.environ.get("AGY", str(Path.home() / ".local" / "bin" / "agy"))
MODEL = "gemini-4-neon-high"
PER_UNIT = 10
ATTEMPTS = 4
TIMEOUT = 900

# Prompt wording per locale code. Which locales exist comes from src/i18n/locales.js (via source.json).
LANGUAGES = {
    "zh-Hant": ("Traditional Chinese (Taiwan)", "Write Traditional Chinese with Taiwan usage and wording, not a character-by-character conversion (for example 屏幕 → 螢幕, 信息 → 資訊, 视频 → 影片, 默认 → 預設)."),
    "en": ("English", "When a string is Chinese followed by the same text in English, output only that English part, unchanged."),
    "ja": ("Japanese", ""),
    "ko": ("Korean", ""),
    "es": ("Spanish", ""),
    "fr": ("French", ""),
    "de": ("German", ""),
    "pt": ("Brazilian Portuguese", ""),
    "ru": ("Russian", ""),
    "ar": ("Modern Standard Arabic", ""),
}
HAN_FREE = {"en", "ko", "es", "fr", "de", "pt", "ru", "ar"}
HAN = re.compile(r"[⺀-⿟々〇〡-〩〸-〻㐀-䶿一-鿿豈-﫿\U00020000-\U0003134f]")
PLACEHOLDER = re.compile(r"\{[A-Za-z0-9_.]+\}")
TAG = re.compile(r"<[^<>]+>")

PROMPT = """You are translating a design reference website from Simplified Chinese into {lang}. The site shows 350 posters; each one teaches a layout or composition technique (photography, graphic and editorial design, type and grids, web and UI, film framing, Chinese painting, presentations). The readers are designers.

{context}

Translate every string value in the JSON at the end into {lang}.
- Write natural, concise {lang}, the way a designer writes, with the standard design terminology of {lang}.
- Keep English words, abbreviations and code exactly as written: CSS, UI, CTA, HTML and CSS snippets, formulas like atan2(y, x), ratios like 1:1.618, placeholders like {{n}}. Inside code, translate only Chinese comments.
- English text printed on the poster (English sentences, capitalised English lines) stays exactly as it is, character for character; translate only the Chinese around it.
- Letter-shape names such as F 型, Z 字形, S 形 take the usual {lang} form (in English: F-pattern, Z-pattern, S-curve).
- An empty string stays an empty string. Keep every key, and keep every array at the same length and order: never merge, split, drop or add items.{rule}
- Output only the JSON with the same keys and structure: no explanations, no code fences.

"""
NAMES = """Below are one category of the site, its sub-themes (each with a one-line description) and the names of its layouts. Keep the terminology consistent across all of them: the poster texts will be translated later with these names as fixed terms. A layout name is the title of a technique; keep it short, the way a {lang} design book titles it. The English name printed on each poster shows the meaning:
{lines}"""
NAMES_EN = """Below are one category of the site and its sub-themes (each with a one-line description){extra}. Keep the terminology consistent with the layout names, which are fixed already (printed on the posters):
{lines}"""
POSTERS = """Below are the texts of ten posters. These names are translated already; wherever the same Chinese appears, use exactly these translations:
{lines}"""
GUIDES_TAX = """Below are conversational one-line editorial blurbs for the categories and sub-themes of the atlas. Keep the tone plain, vivid and practical (not stiff textbook prose). Match these already-translated category and sub-theme names:
{lines}"""
GUIDES_LAYOUTS = """Below are editorial teaching guides for ten layouts (plain-language hook, underlying principle, 3 actionable steps, when to use, pitfalls to avoid, contrast with neighboring layouts, keywords, and an AI composition prompt). Keep the clear, conversational, insightful tone of a senior designer speaking to a peer—never dry jargon. Wherever these already-translated layout or category names appear, use exactly these translations:
{lines}"""
UI_TEXT = "Below are the interface strings of the site: navigation, buttons, labels, headings and messages. Keep each as short as interface text in {lang} usually is. Keep HTML tags and their attributes exactly as written; translate only the text between them."
RETRY = "\n\nYour previous answer was rejected:\n{errors}\nTranslate again and fix these problems."


@dataclass
class Unit:
    id: str
    payload: dict  # the zh this unit translates; its cache stays valid while this is unchanged
    deps: list     # names units whose translations are fixed terms for this one


def load_source():
    if not SOURCE.exists():
        sys.exit(f"{SOURCE.relative_to(SITE)} is missing; run node scripts/i18n-source.mjs")
    return json.loads(SOURCE.read_text())


def targets(src):
    """The locale codes to translate into: src/i18n/locales.js minus zh."""
    codes = [c for c in src["locales"] if c != "zh"] if src.get("locales") else list(LANGUAGES)
    if bad := [c for c in codes if c not in LANGUAGES]:
        sys.exit(f"locales.js has {', '.join(bad)}; add its prompt wording to LANGUAGES in translate.py")
    return codes


def places(src):
    """layout id -> (category slug, sub slug)."""
    return {i: (cat, sub) for cat, subs in src["tree"].items() for sub, ids in subs.items() for i in ids}


def units(src):
    """Every unit of one locale, names first."""
    out, cat_of = [], {}
    for cat, subs in src["tree"].items():
        ids = [i for sub_ids in subs.values() for i in sub_ids]
        cat_of.update((i, cat) for i in ids)
        out.append(Unit(f"names-{cat}", {
            "taxonomy": {s: src["taxonomy"][s] for s in [cat, *subs]},
            "layouts": {i: {"name": src["layouts"][i]["name"], "nameEn": src["layouts"][i]["nameEn"]} for i in ids},
        }, []))
    ids = sorted(src["layouts"])
    for n in range(0, len(ids), PER_UNIT):
        chunk = ids[n:n + PER_UNIT]
        payload = {i: {k: v for k, v in src["layouts"][i].items() if k not in ("name", "nameEn")} for i in chunk}
        out.append(Unit(f"posters-{n // PER_UNIT + 1:02d}", payload, list(dict.fromkeys(f"names-{cat_of[i]}" for i in chunk))))
    if guides := src.get("guides"):
        if g_tax := guides.get("taxonomy"):
            out.append(Unit("guides-taxonomy", g_tax, [f"names-{cat}" for cat in src["tree"]]))
        g_lay = guides.get("layouts") or {}
        g_ids = sorted(i for i in g_lay if i in cat_of)
        for n in range(0, len(g_ids), PER_UNIT):
            chunk = g_ids[n:n + PER_UNIT]
            payload = {i: g_lay[i] for i in chunk}
            ref_ids = list(chunk) + [c["id"] for i in chunk for c in g_lay[i].get("compare", []) if c.get("id") in cat_of]
            deps = list(dict.fromkeys(f"names-{cat_of[i]}" for i in ref_ids))
            out.append(Unit(f"guides-{n // PER_UNIT + 1:02d}", payload, deps))
    if src["ui"] is not None:
        out.append(Unit("ui", src["ui"], []))
    return out


def cache_path(locale, uid):
    return CACHE / locale / f"{uid}.json"


def read_cache(locale, uid):
    path = cache_path(locale, uid)
    return json.loads(path.read_text()) if path.exists() else None


def fresh(unit, locale):
    cached = read_cache(locale, unit.id)
    return cached is not None and cached["source"] == unit.payload


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    tmp.rename(path)


# ---------- the request for one unit ----------

def request(unit, locale, src):
    """(JSON to translate, context paragraph, entries decided without the model)."""
    lang = LANGUAGES[locale][0]
    if unit.id.startswith("names-"):
        layouts = unit.payload["layouts"]
        if locale == "en":
            fixed = {i: {"name": l["nameEn"]} for i, l in layouts.items() if l["nameEn"]}
            todo_names = {i: {"name": l["name"]} for i, l in layouts.items() if not l["nameEn"]}
            lines = "\n".join(f"- {i} {l['name']} — {l['nameEn']}" for i, l in layouts.items() if l["nameEn"])
            extra = ", and the names of its layouts that have no English name on the poster" if todo_names else ""
            context = NAMES_EN.format(extra=extra, lines=lines)
        else:
            fixed = {}
            todo_names = {i: {"name": l["name"]} for i, l in layouts.items()}
            lines = "\n".join(f"- {i} {l['name']} — {l['nameEn'] or '(no English name on the poster)'}" for i, l in layouts.items())
            context = NAMES.format(lang=lang, lines=lines)
        todo = {"taxonomy": unit.payload["taxonomy"], **({"layouts": todo_names} if todo_names else {})}
        return todo, context, fixed
    if unit.id.startswith("posters-"):
        where, names = places(src), {}
        for dep in unit.deps:
            out = read_cache(locale, dep)["output"]
            names.update({slug: v["name"] for slug, v in out["taxonomy"].items()})
            names.update({i: v["name"] for i, v in out["layouts"].items()})
        lines, seen = [], set()
        for i in unit.payload:
            for slug, kind in zip(where[i], ("category", "sub-theme")):
                if slug not in seen:
                    seen.add(slug)
                    lines.append(f"- {src['taxonomy'][slug]['name']} → {names[slug]} ({kind})")
            en = src["layouts"][i]["nameEn"]
            lines.append(f"- {src['layouts'][i]['name']} → {names[i]} (layout {i}{'; English name on the poster: ' + en if en else ''})")
        return unit.payload, POSTERS.format(lines="\n".join(lines)), {}
    if unit.id == "guides-taxonomy":
        names = {}
        for dep in unit.deps:
            out = read_cache(locale, dep)["output"]
            names.update({slug: v["name"] for slug, v in out["taxonomy"].items()})
        lines = [f"- {src['taxonomy'][slug]['name']} → {names[slug]} ({slug})" for slug in unit.payload if slug in names]
        return unit.payload, GUIDES_TAX.format(lines="\n".join(lines)), {}
    if unit.id.startswith("guides-"):
        where, names = places(src), {}
        for dep in unit.deps:
            out = read_cache(locale, dep)["output"]
            names.update({slug: v["name"] for slug, v in out["taxonomy"].items()})
            names.update({i: v["name"] for i, v in out["layouts"].items()})
        lines, seen = [], set()
        todo, fixed = {}, {}
        for i, g in unit.payload.items():
            for slug, kind in zip(where[i], ("category", "sub-theme")):
                if slug not in seen:
                    seen.add(slug)
                    lines.append(f"- {src['taxonomy'][slug]['name']} → {names[slug]} ({kind})")
            for rid in [i, *(c["id"] for c in g.get("compare", []) if c.get("id") in names)]:
                if rid not in seen:
                    seen.add(rid)
                    en = src["layouts"][rid]["nameEn"]
                    lines.append(f"- {src['layouts'][rid]['name']} → {names[rid]} (layout {rid}{'; English: ' + en if en else ''})")
            fixed[i] = [c["id"] for c in g.get("compare", [])]
            todo[i] = {**g, "compare": [{"diff": c["diff"]} for c in g.get("compare", [])]}
        return todo, GUIDES_LAYOUTS.format(lines="\n".join(lines)), fixed
    return unit.payload, UI_TEXT.format(lang=lang), {}


def merge(unit, answer, fixed):
    if unit.id.startswith("names-"):
        layouts = {**fixed, **answer.get("layouts", {})}
        return {"taxonomy": answer["taxonomy"], "layouts": {i: layouts[i] for i in unit.payload["layouts"]}}
    if unit.id.startswith("guides-") and unit.id != "guides-taxonomy":
        return {
            i: {**entry, "compare": [{"id": cid, "diff": c["diff"]} for cid, c in zip(fixed[i], entry.get("compare", []))]}
            for i, entry in answer.items()
        }
    return answer


# ---------- checking an answer ----------

def code_runs(s):
    """ASCII stretches of 6+ characters with code punctuation: code, formulas, ratios and
    English printed on the poster. All of them must come back unchanged."""
    return [r for r in (m.strip() for m in re.findall(r"[\x20-\x7e]+", s)) if len(r) >= 6 and set("{};:()#.") & set(r)]


def check(src, out, locale, path=""):
    """Problems with a translation `out` of `src`, as lines the model can act on."""
    at = path or "the answer"
    if isinstance(src, dict):
        if not isinstance(out, dict):
            return [f"{at}: must be an object"]
        errs = [f"{path}.{k}: missing" for k in src if k not in out]
        errs += [f"{path}.{k}: not in the source, remove it" for k in out if k not in src]
        for k in src:
            if k in out:
                errs += check(src[k], out[k], locale, f"{path}.{k}" if path else k)
        return errs
    if isinstance(src, list):
        if not isinstance(out, list):
            return [f"{at}: must be an array of {len(src)} items"]
        if len(out) != len(src):
            return [f"{at}: the source has {len(src)} items, the answer {len(out)}; translate each item on its own, in order"]
        return [e for n, (a, b) in enumerate(zip(src, out)) for e in check(a, b, locale, f"{path}[{n}]")]
    if not isinstance(out, str):
        return [f"{at}: must be a string"]
    if src == "":
        return [] if out == "" else [f"{at}: must stay an empty string"]
    errs = [] if out.strip() else [f"{at}: empty, but the source has text"]
    if locale in HAN_FREE and (m := HAN.search(out)):
        errs.append(f"{at}: still has Chinese characters ({m.group()}) in: {out[:80]}")
    errs += [f"{at}: placeholder {p} is missing" for p in PLACEHOLDER.findall(src) if p not in out]
    if sorted(TAG.findall(src)) != sorted(TAG.findall(out)):
        errs.append(f"{at}: keep these HTML tags exactly, once each: {' '.join(TAG.findall(src))}")
    errs += [f"{at}: must contain this text unchanged: {r}" for r in code_runs(src) if r not in out]
    return errs


def first_json(text):
    dec = json.JSONDecoder()
    for m in re.finditer(r"\{", text):
        try:
            obj, _ = dec.raw_decode(text, m.start())
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            return obj
    return None


def sabotage(answer):
    """Drops the last item of the first non-empty array; returns its path."""
    def walk(node, path):
        if isinstance(node, list) and node:
            node.pop()
            return path
        items = node.items() if isinstance(node, dict) else enumerate(node) if isinstance(node, list) else ()
        for k, v in items:
            if found := walk(v, f"{path}[{k}]" if isinstance(node, list) else f"{path}.{k}" if path else k):
                return found
    return walk(answer, "")


# ---------- calling the model ----------

LIMITED = re.compile(r"429|rate.?limit|quota|resource.?exhausted|too many requests|overloaded|capacity", re.I)
print_lock, count_lock = threading.Lock(), threading.Lock()
calls = 0


def log(msg):
    with print_lock:
        print(time.strftime("%H:%M:%S ") + msg, flush=True)


class Gate:
    """After a rate-limit answer, no worker starts a call until the pause is over."""

    def __init__(self):
        self.until, self.lock = 0.0, threading.Lock()

    def wait(self):
        while (left := self.until - time.time()) > 0:
            time.sleep(min(left, 5))

    def pause(self, seconds):
        with self.lock:
            self.until = max(self.until, time.time() + seconds)


gate = Gate()


def agy(prompt, workdir):
    """(answer text, error text or None). Each call runs in an empty directory."""
    global calls
    with count_lock:
        calls += 1
    shutil.rmtree(workdir, ignore_errors=True)
    workdir.mkdir(parents=True)
    proc = subprocess.Popen([AGY, "--sandbox", "--disable-slash-commands", "--model", MODEL, "-p", prompt],
                            cwd=workdir, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        out, err = proc.communicate(timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.communicate()
        return "", f"no answer in {TIMEOUT}s"
    if proc.returncode != 0:
        return out, f"agy exit {proc.returncode}: {(err or out).strip()[-300:]}"
    return out, None


def translate(unit, locale, src, sabotage_this):
    todo, context, fixed = request(unit, locale, src)
    lang, rule = LANGUAGES[locale]
    prompt = PROMPT.format(lang=lang, context=context, rule=f"\n- {rule}" if rule else "") + json.dumps(todo, ensure_ascii=False, indent=1)
    workdir = CACHE / "work" / locale / unit.id
    errors, spent = [], 0.0
    for attempt in range(1, ATTEMPTS + 1):
        gate.wait()
        started = time.time()
        text, failure = agy(prompt + (RETRY.format(errors="\n".join(f"- {e}" for e in errors[:25])) if errors else ""), workdir)
        spent += time.time() - started
        if failure:
            limited = bool(LIMITED.search(failure))
            log(f"retry {locale} {unit.id} #{attempt} ({time.time() - started:.0f}s): {'rate limited, pausing all workers: ' if limited else ''}{failure}")
            if limited:
                gate.pause(60 * attempt)
            else:
                time.sleep(5 * attempt)
            continue
        answer = first_json(text)
        if answer is not None and sabotage_this and attempt == 1:
            log(f"break {locale} {unit.id}: dropped the last item of {sabotage(answer)} from the answer")
        errors = ["the answer is not one JSON object"] if answer is None else check(todo, answer, locale)
        if not errors:
            write_json(cache_path(locale, unit.id), {"source": unit.payload, "model": MODEL, "attempts": attempt,
                                                     "seconds": round(spent, 1), "output": merge(unit, answer, fixed)})
            log(f"ok {locale} {unit.id} ({time.time() - started:.0f}s, attempt {attempt})")
            return spent
        log(f"rejected {locale} {unit.id} #{attempt} ({time.time() - started:.0f}s): {len(errors)} problem(s): " + " | ".join(errors[:5]))
    log(f"FAILED {locale} {unit.id} after {ATTEMPTS} attempts")
    return None


# ---------- commands ----------

def alive(pid):
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        pass
    return True


def take_lock():
    lock = CACHE / "run.lock"
    if lock.exists() and (pid := int(lock.read_text() or 0)) and pid != os.getpid() and alive(pid):
        sys.exit(f"another run is going (pid {pid}); let it finish or kill it first")
    CACHE.mkdir(parents=True, exist_ok=True)
    lock.write_text(str(os.getpid()))
    return lock


def run(args):
    subprocess.run(["node", "scripts/i18n-source.mjs"], cwd=SITE, check=True)
    src = load_source()
    locales = args.locales.split(",") if args.locales else targets(src)
    if bad := [code for code in locales if code not in targets(src)]:
        sys.exit(f"unknown locale: {', '.join(bad)}")
    every = units(src)
    by_id = {u.id: u for u in every}
    if args.only:
        wanted = args.only.split(",")
        known = {u.id for u in every} | {"ui"}
        if bad := [w for w in wanted if w not in known]:
            sys.exit(f"unknown unit: {', '.join(bad)}")
        every = [u for u in every if u.id in wanted]
    if src["ui"] is None:
        print("ui: src/i18n/ui/zh.json does not exist yet, skipping the ui unit", flush=True)
    lock = take_lock()
    try:
        done, failed, blocked, seconds = 0, [], [], []
        started = time.time()
        for phase in ([u for u in every if not u.deps], [u for u in every if u.deps]):
            todo = [(u, code) for code in locales for u in phase if not fresh(u, code)]
            done += sum(1 for code in locales for u in phase) - len(todo)

            def one(item):
                unit, code = item
                if missing := [d for d in unit.deps if not fresh(by_id[d], code)]:
                    log(f"blocked {code} {unit.id}: needs {', '.join(missing)}")
                    blocked.append(f"{code}/{unit.id}")
                    return
                spent = translate(unit, code, src, args.break_unit == f"{code}/{unit.id}")
                if spent is None:
                    failed.append(f"{code}/{unit.id}")
                else:
                    seconds.append(spent)

            if todo:
                log(f"{len(todo)} unit(s) to translate with {args.jobs} worker(s)")
                with ThreadPoolExecutor(args.jobs) as pool:
                    list(pool.map(one, todo))
        wall = time.time() - started
        speed = f"; per unit median {statistics.median(seconds):.0f}s, mean {statistics.mean(seconds):.0f}s; wall {wall:.0f}s" if seconds else ""
        log(f"finished: {len(seconds)} translated, {done} already cached, {calls} model call(s){speed}; "
            f"failed: {', '.join(failed) or 'none'}; blocked: {', '.join(blocked) or 'none'}")
    finally:
        lock.unlink(missing_ok=True)
    assemble(src)
    return 1 if failed or blocked else 0


def spans(ids):
    """['001','002','003','007'] -> '001–003, 007'."""
    out, start, prev = [], None, None
    for i in ids:
        if prev is not None and i.isdigit() and prev.isdigit() and int(i) == int(prev) + 1:
            prev = i
            continue
        if start is not None:
            out.append(start if start == prev else f"{start}–{prev}")
        start = prev = i
    if start is not None:
        out.append(start if start == prev else f"{start}–{prev}")
    return ", ".join(out)


def assemble(src=None):
    src = src or load_source()
    every = units(src)
    for code in targets(src):
        taxonomy, names, texts, ui, guide_tax, guide_lay = {}, {}, {}, {}, {}, {}
        for unit in every:
            cached = read_cache(code, unit.id)
            if cached is None:
                continue
            old, new, out = cached["source"], unit.payload, cached["output"]
            # An entry counts while its zh is unchanged, even if other entries of its unit changed.
            if unit.id.startswith("names-"):
                taxonomy.update((s, v) for s, v in out["taxonomy"].items() if old["taxonomy"].get(s) == new["taxonomy"].get(s))
                names.update((i, v["name"]) for i, v in out["layouts"].items() if old["layouts"].get(i) == new["layouts"].get(i))
            elif unit.id.startswith("posters-"):
                texts.update((i, v) for i, v in out.items() if old.get(i) == new.get(i))
            elif unit.id == "guides-taxonomy":
                guide_tax.update((s, v) for s, v in out.items() if old.get(s) == new.get(s))
            elif unit.id.startswith("guides-"):
                guide_lay.update((i, v) for i, v in out.items() if old.get(i) == new.get(i))
            else:
                ui.update((k, v) for k, v in out.items() if old.get(k) == new.get(k))
        ids = sorted(src["layouts"])
        layouts = {i: {"name": names[i], **texts[i]} for i in ids if i in names and i in texts}
        tax = {s: taxonomy[s] for s in src["taxonomy"] if s in taxonomy}
        line = f"{code}: taxonomy {len(tax)}/{len(src['taxonomy'])}, layouts {len(layouts)}/{len(ids)}"
        if tax or layouts:
            write_json(CONTENT / f"{code}.json", {"taxonomy": tax, "layouts": layouts})
        if guides_src := src.get("guides"):
            gt_src = guides_src.get("taxonomy") or {}
            gl_src = guides_src.get("layouts") or {}
            gt = {s: guide_tax[s] for s in gt_src if s in guide_tax}
            gl = {i: guide_lay[i] for i in sorted(gl_src) if i in guide_lay}
            line += f", guides {len(gl)}/{len(gl_src)}"
            if gt or gl:
                write_json(GUIDES / f"{code}.json", {"taxonomy": gt, "layouts": gl})
        if src["ui"] is not None:
            keys = [k for k in src["ui"] if k in ui]
            line += f", ui {len(keys)}/{len(src['ui'])}"
            if keys:
                write_json(UI / f"{code}.json", {k: ui[k] for k in keys})
        if not (tax or layouts or ui or guide_tax or guide_lay):
            print(f"{line}; nothing cached, no file written")
            continue
        print(line)
        missing = [s for s in src["taxonomy"] if s not in tax]
        if missing:
            print(f"  warning: {code} taxonomy missing {', '.join(missing)}")
        if len(layouts) < len(ids):
            print(f"  warning: {code} layouts missing {spans([i for i in ids if i not in layouts])}")
        if src["ui"] is not None and len(ui) < len(src["ui"]):
            print(f"  warning: {code} ui missing {', '.join(k for k in src['ui'] if k not in ui)}")
    return 0


def status(_args):
    src = load_source()
    every = units(src)
    lock = CACHE / "run.lock"
    if lock.exists() and (pid := int(lock.read_text() or 0)) and alive(pid):
        print(f"a run is going: pid {pid}")
    kinds = [("names", "names-"), ("posters", "posters-"), ("guides", "guides-"), ("ui", "ui")]
    print(f"{'locale':8} " + " ".join(f"{k:>8}" for k, _ in kinds) + f" {'total':>8}  stale")
    for code in targets(src):
        cells, done_all, total_all, stale = [], 0, 0, []
        for _, prefix in kinds:
            group = [u for u in every if u.id.startswith(prefix)]
            done = sum(fresh(u, code) for u in group)
            stale += [u.id for u in group if cache_path(code, u.id).exists() and not fresh(u, code)]
            cells.append(f"{done}/{len(group)}" if group else "-")
            done_all, total_all = done_all + done, total_all + len(group)
        print(f"{code:8} " + " ".join(f"{c:>8}" for c in cells) + f" {done_all}/{total_all:<5}  {', '.join(stale)}")
    if src["ui"] is None:
        print("ui: src/i18n/ui/zh.json does not exist yet")
    return 0


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--locales", help="comma-separated codes; default every locale in src/i18n/locales.js but zh")
    r.add_argument("--jobs", type=int, default=8, help="agy calls at once (8 measured safe on 2026-11-24: no errors, about 2 GB)")
    r.add_argument("--only", help="comma-separated unit ids, e.g. names-01-composition-logic,posters-01")
    r.add_argument("--break", dest="break_unit", metavar="LOCALE/UNIT", help="drop an array item from that unit's first answer")
    sub.add_parser("status")
    sub.add_parser("assemble")
    args = ap.parse_args()
    sys.exit({"run": run, "status": status, "assemble": lambda _: assemble()}[args.cmd](args))


if __name__ == "__main__":
    main()
