#!/usr/bin/env python3
"""Normalize the public web derivatives of every product photo.

`sync-studio-primaries.py` copies the 1400² studio master straight to
`images/post-<ref>.jpg` and stops there. But the live site serves **WebP first**:

    PDP      <picture><source type="image/webp" srcset="/images/post-<ref>.webp">
    lightbox lightboxImg.src = item.src.replace(/\\.jpg$/, '.webp')

so a fresh .jpg with a stale .webp means ~every modern browser keeps showing the OLD
photo on the PDP/lightbox while the gallery thumb shows the new one. This script closes
that gap and keeps the perf work intact:

  * public jpg downscaled to <=1080 (masters stay 1400² in Product_Images/ — see
    docs/brand/PHOTOGRAPHY.md, which specs web derivatives as "<=1080px")
  * matching .webp regenerated from the resized jpg
  * run scripts/make-thumbs.py afterwards for the 400px thumb pair

    python3 scripts/publish-web-images.py [--force] [--ref 006 --ref 007]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
WEB_MAX = 1080          # matches the site's <img width="800"> / lightbox usage
JPG_Q = 86
WEBP_Q = 80


def cwebp(src: Path, dest: Path) -> bool:
    """Prefer cwebp (matches how existing .webp files were produced); fall back to Pillow."""
    try:
        subprocess.run(
            ["cwebp", "-q", str(WEBP_Q), str(src), "-o", str(dest)],
            check=True, capture_output=True,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        Image.open(src).convert("RGB").save(dest, "WEBP", quality=WEBP_Q, method=6)
        return False


def needs_work(jpg: Path, webp: Path, force: bool) -> bool:
    if force or not webp.exists():
        return True
    with Image.open(jpg) as im:
        if max(im.size) > WEB_MAX:
            return True
        jw = im.size[0]
    with Image.open(webp) as im:
        if im.size[0] != jw:          # webp built from a different (older) source
            return True
    return webp.stat().st_mtime < jpg.stat().st_mtime


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--ref", action="append", default=None, help="only these refs")
    args = ap.parse_args()

    manifest = json.loads((IMAGES / "manifest.json").read_text())
    refs = [m["src"].split("post-")[-1].replace(".jpg", "") for m in manifest if "src" in m]
    if args.ref:
        wanted = {r.zfill(3) for r in args.ref}
        refs = [r for r in refs if r in wanted]

    done, skipped = [], 0
    for ref in refs:
        jpg, webp = IMAGES / f"post-{ref}.jpg", IMAGES / f"post-{ref}.webp"
        if not jpg.exists():
            print(f"  ! missing {jpg.name}")
            continue
        if not needs_work(jpg, webp, args.force):
            skipped += 1
            continue

        with Image.open(jpg) as im:
            im = im.convert("RGB")
            before = im.size
            if max(im.size) > WEB_MAX:
                im = im.resize((WEB_MAX, WEB_MAX) if im.width == im.height
                               else (WEB_MAX, round(im.height * WEB_MAX / im.width)),
                               Image.LANCZOS)
                im.save(jpg, "JPEG", quality=JPG_Q, optimize=True, progressive=True)
        cwebp(jpg, webp)
        done.append((ref, before, Image.open(jpg).size))

    print(f"Published {len(done)} web image pair(s); {skipped} already current.")
    if done:
        tot_j = sum((IMAGES / f"post-{r}.jpg").stat().st_size for r, _, _ in done)
        tot_w = sum((IMAGES / f"post-{r}.webp").stat().st_size for r, _, _ in done)
        print(f"  jpg {tot_j/1024/1024:.1f} MB · webp {tot_w/1024/1024:.1f} MB "
              f"(avg webp {tot_w/len(done)/1024:.0f} KB)")
        print("  next: python3 scripts/make-thumbs.py")


if __name__ == "__main__":
    main()
