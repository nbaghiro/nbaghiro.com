"""Turn the renderer's PNGs into the WebPs the site serves, and drop the PNGs.

    python3 scripts/covers/webp.py map-on-one-canvas [...]

The art layer keeps its alpha; everything else is flattened. Run it after render.mjs.
"""
import os
import sys
from PIL import Image

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../client/public/img/posts")

for name in sys.argv[1:] or sorted({f.rsplit("-", 1)[0] for f in os.listdir(IMG) if f.endswith(".png")}):
    for part, quality in (("card", 86), ("wide", 86), ("bg", 82), ("art", 92)):
        src = os.path.join(IMG, f"{name}-{part}.png")
        if not os.path.exists(src):
            continue
        im = Image.open(src)
        im = im if part == "art" else im.convert("RGB")
        out = os.path.join(IMG, f"{name}-{part}.webp")
        im.save(out, "WEBP", quality=quality, method=6)
        os.remove(src)
        print(f"{name}-{part}.webp {os.path.getsize(out) // 1024} KB")
