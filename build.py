#!/usr/bin/env python3
"""RunMoto demo: surenka src/pages/*.html su src/partials/* į šakninius *.html failus.

Puslapio pirma eilutė: <!-- @page title="..." description="..." body="..." header="overlay|solid" css="home" js="home" -->
Įterpimas: <!-- @include header -->
Naudojimas: python3 build.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = ROOT / "src" / "pages"
PARTIALS = ROOT / "src" / "partials"
INCLUDE = re.compile(r"<!--\s*@include\s+([\w-]+)\s*-->")
META = re.compile(r"<!--\s*@page\s+(.*?)-->", re.S)
ATTR = re.compile(r"""(\w+)=(?:"([^"]*)"|'([^']*)')""")


def partial(name, ctx, depth=0):
    path = PARTIALS / f"{name}.html"
    if not path.exists():
        path = PARTIALS / f"{name}.svg"
    text = path.read_text(encoding="utf-8")
    return render(text, ctx, depth + 1)


def render(text, ctx, depth=0):
    if depth > 6:
        raise RuntimeError("per gilus įterpimas")
    text = INCLUDE.sub(lambda m: partial(m.group(1), ctx, depth), text)
    return re.sub(r"\{\{\s*(\w+)\s*\}\}", lambda m: ctx.get(m.group(1), ""), text)


def build():
    for page in sorted(PAGES.glob("*.html")):
        if page.name.startswith("_"):
            continue
        src = page.read_text(encoding="utf-8")
        m = META.search(src)
        ctx = {k: a or b for k, a, b in ATTR.findall(m.group(1))} if m else {}
        body = META.sub("", src, count=1).lstrip()
        ctx.setdefault("header", "solid")
        ctx["page_css"] = f'<link rel="stylesheet" href="assets/css/{ctx["css"]}.css">' if ctx.get("css") else ""
        ctx["page_js"] = f'<script src="assets/js/{ctx["js"]}.js" defer></script>' if ctx.get("js") else ""
        ctx["content"] = render(body, ctx)
        html = partial("layout", ctx)
        if page.name != "index.html":
            # bendrų dalių nuorodos į pirmo puslapio sekcijas
            html = re.sub(r'href="#(kategorijos|naudotos|akcijos|verslui|prekes)"', r'href="index.html#\1"', html)
        (ROOT / page.name).write_text(html, encoding="utf-8")
        print(f"  {page.name}  {len(html) // 1024} KB")


if __name__ == "__main__":
    build()
