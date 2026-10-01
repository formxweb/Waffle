"""Subset the self-hosted fonts to Latin + Turkish (and ₺), keeping their variable axes.

fontsource ships each family as unicode-range files; the latin file lacks ĞğİŞş, which
live in latin-ext. Each pair is subset to exactly what the site needs and paired in
src/styles/fonts.css with matching unicode-range rules.

Run after changing font packages:  python3 scripts/fonts.py   (needs: pip install fonttools brotli)
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FS = ROOT / "node_modules" / "@fontsource-variable"
OUT = ROOT / "src" / "assets" / "fonts"

LATIN = (
    list(range(0x20, 0x7F))
    + list(range(0xA0, 0x100))
    + [0x0131, 0x02C6, 0x02DC]
    + [0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2022, 0x2026, 0x2039, 0x203A]
    + [0x2190, 0x2191, 0x2192, 0x2193, 0x2197, 0x2198, 0x2122, 0x2212]
)
TURKISH = [0x011E, 0x011F, 0x0130, 0x015E, 0x015F, 0x20BA]

FAMILIES = [
    ("fraunces", "fraunces/files/fraunces-{r}-full-normal.woff2", {"wght": (300, 560), "opsz": (24, 144), "SOFT": 60, "WONK": 0}),
    ("fraunces-italic", "fraunces/files/fraunces-{r}-full-italic.woff2", {"wght": (300, 560), "opsz": (24, 144), "SOFT": 60, "WONK": 0}),
    ("instrument-sans", "instrument-sans/files/instrument-sans-{r}-wght-normal.woff2", {}),
]


def build(name: str, pattern: str, limits: dict) -> None:
    for region, codes in (("latin", LATIN), ("latin-ext", TURKISH)):
        font = TTFont(FS / pattern.format(r=region))
        if limits:
            font = instancer.instantiateVariableFont(font, limits)
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "pnum", "tnum", "lnum", "ss01"]
        opts.name_IDs = ["*"]
        sub = subset.Subsetter(opts)
        cmap = font.getBestCmap()
        sub.populate(unicodes=[u for u in codes if u in cmap])
        sub.subset(font)
        out = OUT / f"{name}-{region}.woff2"
        font.flavor = "woff2"
        font.save(out)
        print(f"{out.name}: {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for args in FAMILIES:
        build(*args)
