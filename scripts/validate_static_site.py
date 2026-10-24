#!/usr/bin/env python3
"""Zero-dependency structural smoke checks for the published GitHub Pages storefront.

This does not test the Vinext/Worker app or replace a real browser/WCAG audit.
"""

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class StorefrontHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.local_files = []
        self.images = []
        self.references = []
        self.mains = []
        self.h1 = 0
        self.forms = 0
        self.skip_links = []
        self.html_lang = None
        self.header_seen = False

    def handle_starttag(self, tag, attrs):
        at = dict(attrs)
        if tag == "html":
            self.html_lang = at.get("lang")
        if tag == "header":
            self.header_seen = True
        if tag == "main":
            self.mains.append(at)
        if tag == "h1":
            self.h1 += 1
        if tag == "form":
            self.forms += 1
        if "id" in at:
            self.ids.append(at["id"])
        if tag == "img":
            self.images.append(at)
        if tag == "a" and "skip-link" in (at.get("class") or "").split():
            self.skip_links.append((at.get("href"), self.header_seen))
        for attr in ("href", "src"):
            url = at.get(attr)
            if not url:
                continue
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc or url.startswith("//"):
                continue
            if parsed.fragment and not parsed.path:
                self.links.append(parsed.fragment)
            if parsed.path:
                self.local_files.append((tag, unquote(parsed.path)))
        for attr in ("aria-controls", "aria-labelledby"):
            value = at.get(attr)
            if value:
                self.references.extend(value.split())


def validate():
    parser = StorefrontHTML()
    parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    errors = []

    if parser.html_lang != "en":
        errors.append("Missing html lang=en")
    if len(parser.mains) != 1 or parser.mains[0].get("id") != "main":
        errors.append("Exactly one main#main is required")
    elif parser.mains[0].get("tabindex") != "-1":
        errors.append("main#main must be focusable after skip navigation")
    if parser.skip_links != [("#main", False)]:
        errors.append("Skip link must target #main before the header")
    if parser.h1 != 1:
        errors.append(f"Expected one h1, found {parser.h1}")
    if parser.forms != 1:
        errors.append(f"Expected one inquiry form, found {parser.forms}")

    duplicates = [k for k, n in Counter(parser.ids).items() if n > 1]
    if duplicates:
        errors.append(f"Duplicate ids: {', '.join(duplicates)}")
    known_ids = set(parser.ids)
    for fragment in parser.links:
        if fragment not in known_ids:
            errors.append(f"Broken local fragment: #{fragment}")
    for ref in parser.references:
        if ref not in known_ids:
            errors.append(f"Broken ARIA ID reference: {ref}")

    for image in parser.images:
        if "alt" not in image:
            errors.append(f"Missing alt attribute: {image.get('src')}")
    for tag, path in parser.local_files:
        target = (ROOT / path.lstrip("/")).resolve()
        if not target.is_relative_to(ROOT.resolve()) or not target.is_file():
            errors.append(f"Missing local {tag} asset: {path}")

    if ":focus-visible" not in css or ".skip-link:focus" not in css:
        errors.append("Expected keyboard focus and visible skip-link styling")
    if "prefers-reduced-motion: reduce" not in css:
        errors.append("Missing reduced-motion handling")
    if not (ROOT / "CNAME").read_text().strip() == "tropicals.blackthorn.enterprises":
        errors.append("Custom-domain CNAME does not match expected host")

    if errors:
        print("FAILED static storefront checks:")
        for error in errors:
            print(f"  - {error}")
        raise SystemExit(1)
    print("PASSED: HTML landmarks, skip link, ARIA IDs, in-page links, local assets, alt attributes, CNAME, focus visibility, reduced motion")
    print(f"Checked {len(parser.local_files)} local files and {len(parser.images)} image elements")


if __name__ == "__main__":
    validate()
