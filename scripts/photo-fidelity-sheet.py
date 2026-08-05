#!/usr/bin/env python3
"""Side-by-side QA sheet: committed (LEGACY, currently live) vs working-tree (STUDIO) photos.

Studio regenerations overwrite images/post-<ref>.jpg in place, so a plain `git status` only says
"binary file changed" — you can't see whether the new render still shows the *real* product.
Some Batch-2 images were AI-regenerated, which can drift from the physical item (see
docs/ops/EXECUTION-STRATEGY.md B2). In a COD market a photo that oversells is paid for twice:
a refused delivery plus a bad review. So every changed photo gets eyeballed before it goes live.

    python3 scripts/photo-fidelity-sheet.py [--port 8801]

Serves a sheet of every changed product photo, legacy next to studio. Flag any that drifted.
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import shutil
import socketserver
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def changed_refs() -> list[str]:
    out = subprocess.run(["git", "status", "--short"], capture_output=True, text=True, cwd=ROOT).stdout
    refs = [
        line.split("images/post-")[1].replace(".jpg", "")
        for line in out.splitlines()
        if line.startswith(" M images/post-") and line.rstrip().endswith(".jpg")
    ]
    return sorted(set(refs))


def build(dest: Path) -> int:
    (dest / "legacy").mkdir(parents=True, exist_ok=True)
    (dest / "studio").mkdir(parents=True, exist_ok=True)
    manifest = {
        m.get("src", "").split("post-")[-1].replace(".jpg", ""): m
        for m in json.loads((ROOT / "images/manifest.json").read_text())
    }

    rows = []
    for ref in changed_refs():
        blob = subprocess.run(
            ["git", "show", f"HEAD:images/post-{ref}.jpg"], capture_output=True, cwd=ROOT
        ).stdout
        if not blob:  # brand-new photo, nothing live to compare against
            continue
        (dest / "legacy" / f"post-{ref}.jpg").write_bytes(blob)
        shutil.copyfile(ROOT / f"images/post-{ref}.jpg", dest / "studio" / f"post-{ref}.jpg")
        item = manifest.get(ref, {})
        rows.append((ref, item.get("title", f"post-{ref}"), item.get("price", "")))

    cards = "\n".join(
        f"""<section class="row">
<header><span class="ref">#{ref}</span><b>{title}</b><span class="price">PKR {price}</span>
<label class="flag"><input type="checkbox"> flag mismatch</label></header>
<div class="pair">
<figure><img loading="lazy" src="legacy/post-{ref}.jpg"><figcaption>LEGACY (real photo, currently live)</figcaption></figure>
<figure><img loading="lazy" src="studio/post-{ref}.jpg"><figcaption>STUDIO (new — would replace it)</figcaption></figure>
</div></section>"""
        for ref, title, price in rows
    )

    (dest / "index.html").write_text(
        f"""<!doctype html><meta charset=utf-8><title>Photo fidelity QA — {len(rows)} products</title>
<style>
body{{font:15px/1.5 system-ui;margin:0;background:#faf7f4;color:#2b2740}}
.top{{position:sticky;top:0;background:#fff;border-bottom:1px solid #e8e0d8;padding:14px 20px;z-index:9}}
h1{{margin:0 0 4px;font-size:19px}} .sub{{color:#6f6982;font-size:13px}}
.row{{background:#fff;margin:14px 20px;border:1px solid #eee4dc;border-radius:12px;overflow:hidden}}
header{{display:flex;gap:12px;align-items:center;padding:10px 14px;border-bottom:1px solid #f2ece6;flex-wrap:wrap}}
.ref{{font:600 12px ui-monospace;background:#f3ece6;padding:2px 7px;border-radius:20px}}
.price{{color:#e23e63;font-weight:700}} .flag{{margin-left:auto;font-size:13px;color:#c0392b}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}}
figure{{margin:0}} img{{width:100%;aspect-ratio:1;object-fit:contain;background:#fbf7f2;border-radius:8px;display:block}}
figcaption{{font-size:12px;color:#6f6982;text-align:center;padding-top:6px}}
@media(max-width:700px){{.pair{{grid-template-columns:1fr}}}}
</style>
<div class="top"><h1>Photo fidelity QA — {len(rows)} products would change on the live site</h1>
<div class="sub">Compare each pair. <b>Does the STUDIO image show the same physical product you actually ship?</b>
Tick &ldquo;flag mismatch&rdquo; for any that drifted (different petals, cord, colour, shape).</div></div>
{cards}"""
    )
    return len(rows)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8801)
    args = ap.parse_args()

    dest = Path(tempfile.mkdtemp(prefix="photo-qa-"))
    count = build(dest)
    print(f"Built fidelity sheet for {count} changed photos.")
    print(f"Open: http://localhost:{args.port}/   (Ctrl-C to stop)")

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(dest))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", args.port), handler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
