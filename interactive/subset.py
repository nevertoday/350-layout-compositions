# 由 build.mjs 调用：uv run --with fonttools --with brotli python -I subset.py < jobs.json
# 每个任务：把字体裁到给定的字，再把可变轴钉住或收窄，存成 woff2。
# 任务：{"src": 原字体, "out": 输出 woff2, "text": 要留的字, "limits": {"wght": 700 | [400, 900], ...}}
# 输出每个任务的 {"size": 字节数, "weight": 实际字重（可变字体是 [最小, 最大]）}，build.mjs 拿它写 @font-face。
import json
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer


def run(job):
    font = TTFont(job["src"])
    options = subset.Options()
    options.layout_features = ["*"]
    options.hinting = False
    options.desubroutinize = True
    options.notdef_outline = True
    sub = subset.Subsetter(options)
    sub.populate(text=job["text"])
    sub.subset(font)

    limits = job.get("limits") or {}
    pinned = {}
    if "fvar" in font:
        axes = {a.axisTag: (a.minValue, a.maxValue) for a in font["fvar"].axes}
        clamp = lambda tag, v: min(max(v, axes[tag][0]), axes[tag][1])
        for tag, v in limits.items():
            if tag not in axes:
                continue
            if isinstance(v, list):
                lo, hi = clamp(tag, v[0]), clamp(tag, v[1])
                pinned[tag] = lo if lo == hi else (lo, hi)
            else:
                pinned[tag] = clamp(tag, v)
        if pinned:
            font = instancer.instantiateVariableFont(font, pinned, updateFontNames=False)
    weight = pinned.get("wght")
    if not isinstance(weight, (int, float)):
        w = next((a for a in font["fvar"].axes if a.axisTag == "wght"), None) if "fvar" in font else None
        weight = [w.minValue, w.maxValue] if w else font["OS/2"].usWeightClass

    font.flavor = "woff2"
    tmp = f"{job['out']}.{os.getpid()}.tmp"
    font.save(tmp)
    os.replace(tmp, job["out"])
    return {"size": os.path.getsize(job["out"]), "weight": weight}


jobs = json.load(sys.stdin)
print(json.dumps([run(j) for j in jobs]))
