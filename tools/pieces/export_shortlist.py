"""Zip the shortlist's score files as plain (uncompressed) MusicXML, with an index, for the owner to upload to ChatGPT
(the owner, 2026-10-10: the repo is public, so the files are not pushed; the zip stays in build/, which git ignores).

Input: docs/pieces/review/shortlist.csv (column file: a PDMX ./mxl/... path, unpacked in build/pieces/files, or a
repo-relative .musicxml path). Each .mxl is opened at the root file its META-INF/container.xml names (else its first
non-META score file). Output: build/pieces/shortlist-musicxml.zip holding NNN-<title>.musicxml and index.csv (n, file
name, title, composer, levels, reasons, flags, file_title, source file). Every file is checked to be a MusicXML score
before it goes in; any that is not is listed and left out, never silently skipped.

Usage: python tools/pieces/export_shortlist.py
"""
import csv, io, os, re, sys, zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
SHORTLIST = os.path.join(ROOT, "docs", "pieces", "review", "shortlist.csv")
OUT = os.path.join(ROOT, "build", "pieces", "shortlist-musicxml.zip")


def musicxml_bytes(f):
    """The uncompressed MusicXML of a shortlist file."""
    path = os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)
    if not path.lower().endswith(".mxl"):
        return open(path, "rb").read()
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        inner = None
        if "META-INF/container.xml" in names:
            rf = ET.fromstring(z.read("META-INF/container.xml")).find(".//{*}rootfile")
            inner = rf.get("full-path") if rf is not None else None
        inner = inner or next(n for n in names if n.endswith((".xml", ".musicxml")) and not n.startswith("META-INF"))
        return z.read(inner)


def is_score(data):
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return False
    return root.tag.split("}")[-1] in ("score-partwise", "score-timewise")


def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:50] or "untitled"


def main():
    rows = list(csv.DictReader(open(SHORTLIST, encoding="utf-8")))
    index, bad = [], []
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for n, r in enumerate(rows, 1):
            name = f"{n:03d}-{slug(r['title'])}.musicxml"
            try:
                data = musicxml_bytes(r["file"])
            except Exception as e:
                bad.append(f"{n} {r['title']}: {type(e).__name__}")
                continue
            if not is_score(data):
                bad.append(f"{n} {r['title']}: not a MusicXML score")
                continue
            z.writestr(name, data)
            index.append({"n": n, "file_name": name, "title": r["title"], "composer": r["composer"],
                          "levels": r["levels"], "reasons": r["reasons"], "flags": r["flags"],
                          "file_title": r["file_title"], "source_file": r["file"]})
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=list(index[0].keys()))
        w.writeheader()
        w.writerows(index)
        z.writestr("index.csv", buf.getvalue())
    print(OUT, f"{len(index)} of {len(rows)} shortlist files written, {os.path.getsize(OUT) / 1e6:.1f} MB zipped")
    for b in bad:
        print("  left out:", b)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
