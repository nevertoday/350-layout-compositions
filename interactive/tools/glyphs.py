# npm run glyphs -- 004 [005 ...]：读 dist 里这页内联的字体，列出页面上用到、但字体里没有的字。
# 缺的字浏览器会拿系统字体补，排出来就不是这套字体的样子（Inter 没有「」，站酷庆科黄油体没有 θ φ）。
#   1. 哪个字体都没有的字：一定落到系统字体，换字体或者画成 SVG。
#   2. 每个字体缺的符号、标点、外文字母（汉字只对本身有汉字的字体查）：这个字体排到这些字时会换字体，
#      看 CSS 里用它的地方会不会碰到。
# 「页面上用到的字」和 build 裁字体用的是同一份：HTML、打包后的 CSS 和 JS 里出现的所有字。
import base64
import glob
import html
import io
import os
import re
import sys
import unicodedata

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def is_han(c):
    o = ord(c)
    return 0x3400 <= o <= 0x4DBF or 0x4E00 <= o <= 0x9FFF or 0xF900 <= o <= 0xFAFF or o >= 0x20000


def show(chars):
    return " ".join(sorted(chars)) if chars else "无"


def report(path):
    page = open(path, encoding="utf8").read()
    faces = []
    for block in re.findall(r"@font-face\{([^}]*)\}", page):
        family = re.search(r'font-family:\s*"?([^";]+)', block).group(1)
        weight = re.search(r"font-weight:\s*([^;]+)", block).group(1)
        style = re.search(r"font-style:\s*([^;]+)", block).group(1)
        data = re.search(r"base64,([A-Za-z0-9+/=]+)", block).group(1)
        cmap = set(TTFont(io.BytesIO(base64.b64decode(data))).getBestCmap())
        faces.append((f"{family} {'italic ' if style == 'italic' else ''}{weight}", cmap))
    text = html.unescape(re.sub(r"data:[^\"')\s]+", "", page))
    used = {c for c in text if not c.isspace() and unicodedata.category(c)[0] not in "CZ"}
    print(f"{os.path.basename(path)}  {len(used)} 种字")
    nowhere = {c for c in used if not any(ord(c) in cmap for _, cmap in faces)}
    print(f"  哪个字体都没有：{show(nowhere)}")
    for name, cmap in faces:
        has_han = any(is_han(chr(o)) for o in cmap)
        missing = {c for c in used if ord(c) not in cmap and not (c.isascii() and c.isalnum()) and (has_han or not is_han(c))}
        print(f"  {name}  缺 {len(missing)} 个：{show(missing)}")


ids = sys.argv[1:]
if not ids:
    sys.exit("用法：npm run glyphs -- 004 [005 ...]（先 npm run build）")
for i in ids:
    found = sorted(glob.glob(os.path.join(ROOT, "dist", f"{i}-*.html")))
    if not found:
        sys.exit(f"dist/ 里没有 {i}：先 npm run build -- --only {i}")
    report(found[0])
