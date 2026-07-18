#!/usr/bin/env python3
"""Generate small gallery thumbnails from the full-size product photos.

The gallery grid shows cards at ~220-360px, but was loading the full 1080x1080
images (avg ~71KB, up to 321KB). This makes a 400x400 webp + jpg thumbnail for
each product (~12-50KB), cutting gallery image weight ~72%. The full-size images
are still used by the lightbox and the /p/<ref>/ product pages.

Run after adding/replacing product photos:
    python3 scripts/make-thumbs.py            # only missing/outdated thumbs
    python3 scripts/make-thumbs.py --force    # rebuild all
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "images")
THUMB_DIR = os.path.join(IMAGES, "thumb")
SIZE = 400          # gallery cards are ~220-360px; 400px stays crisp on mobile 2x
JPG_Q = 80
WEBP_Q = 78
FORCE = "--force" in sys.argv

os.makedirs(THUMB_DIR, exist_ok=True)

manifest = json.load(open(os.path.join(IMAGES, "manifest.json")))
made = 0
skipped = 0
for item in manifest:
    src = item.get("src", "")                      # e.g. images/post-034.jpg
    base = os.path.basename(src)                    # post-034.jpg
    full = os.path.join(ROOT, src)
    if not os.path.exists(full):
        print(f"  ! missing source: {src}")
        continue
    out_jpg = os.path.join(THUMB_DIR, base)
    out_webp = os.path.join(THUMB_DIR, base.rsplit(".", 1)[0] + ".webp")
    # skip if both thumbs exist and are newer than the source (unless --force)
    if (not FORCE and os.path.exists(out_jpg) and os.path.exists(out_webp)
            and os.path.getmtime(out_jpg) >= os.path.getmtime(full)
            and os.path.getmtime(out_webp) >= os.path.getmtime(full)):
        skipped += 1
        continue
    im = Image.open(full).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    im.save(out_jpg, "JPEG", quality=JPG_Q, optimize=True, progressive=True)
    im.save(out_webp, "WEBP", quality=WEBP_Q, method=6)
    made += 1

# report totals
def dir_mb(paths):
    return sum(os.path.getsize(p) for p in paths) / 1024 / 1024

webps = [os.path.join(THUMB_DIR, f) for f in os.listdir(THUMB_DIR) if f.endswith(".webp")]
print(f"Thumbnails: built {made}, skipped {skipped} (up to date).")
print(f"Total thumb webp weight: {dir_mb(webps):.1f} MB across {len(webps)} images "
      f"(avg {dir_mb(webps)*1024/max(1,len(webps)):.0f} KB).")
