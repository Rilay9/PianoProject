"""Build available.csv: one row per score file we can get, from every source already on disk.

Sources:
  pdmx       PDMX.csv (all rows) in the session folder; the 544 pieces quarried by the old project are flagged
  kern       content/scores/imported/kern/*  (!!!COM composer, !!!OTL title, !!!OPS opus, !!!ONM number, !!!SCT catalogue)
  musetrainer content/scores/imported/musetrainer/scores/*.mxl  (title from the file name)
  mutopia    content/scores/imported/mutopia/**/*.ly  (\\header title/composer/opus)

Columns: source, file, composer, title, subtitle, catalogue, bars, tracks, rating, n_ratings, licence, genres, quarried_before
Nothing here judges level or identity; it only lists what exists.

Usage: python tools/pieces/build_available.py [out.csv]   (default build/pieces/available.csv)
"""
import csv, json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SESSION = os.path.dirname(ROOT)
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "build", "pieces", "available.csv")
IMP = os.path.join(ROOT, "content", "scores", "imported")
COLS = ["source", "file", "composer", "title", "subtitle", "catalogue", "bars", "tracks",
        "rating", "n_ratings", "licence", "genres", "quarried_before"]
csv.field_size_limit(10**9)


def quarried_cids():
    """CIDs of the 544 PDMX pieces the old project kept (old branch content/sources/pdmx.json)."""
    try:
        raw = subprocess.run(["git", "-C", ROOT, "show", "claude/piano-teaching-app-bo19td:content/sources/pdmx.json"],
                             capture_output=True, check=True).stdout
        return {it["cid"] for it in json.loads(raw)["items"]}
    except Exception as e:
        print("warning: old PDMX record not read:", e)
        return set()


def pdmx_rows(cids):
    with open(os.path.join(SESSION, "PDMX.csv"), encoding="utf-8") as f:
        for d in csv.DictReader(f):
            cid = os.path.basename(d["mxl"]).rsplit(".", 1)[0]
            yield {"source": "pdmx", "file": d["mxl"], "composer": d["composer_name"],
                   "title": d["title"] if d["title"] != "NA" else d["song_name"],
                   "subtitle": d["subtitle"] if d["subtitle"] != "NA" else "",
                   "catalogue": "", "bars": d["song_length.bars"], "tracks": d["n_tracks"],
                   "rating": d["rating"], "n_ratings": d["n_ratings"], "licence": d["license"],
                   "genres": d["genres"], "quarried_before": "yes" if cid in cids else ""}


def kern_rows():
    for dp, _, fs in os.walk(os.path.join(IMP, "kern")):
        for fn in fs:
            if not fn.endswith(".krn"):
                continue
            p = os.path.join(dp, fn)
            h = {}
            with open(p, encoding="utf-8", errors="replace") as f:
                for line in f:
                    m = re.match(r"!!!(COM|OTL|OPS|ONM|SCT|SCA|OMV|OMD)[^:]*:\s*(.*)", line)
                    if m and m.group(1) not in h:
                        h[m.group(1)] = m.group(2).strip()
            cat = " ".join(x for x in [h.get("SCT", ""), h.get("OPS", ""), h.get("ONM", "")] if x)
            title = " ".join(x for x in [h.get("OTL", ""), h.get("OMV", ""), h.get("OMD", "")] if x)
            yield {"source": "kern", "file": os.path.relpath(p, ROOT).replace("\\", "/"),
                   "composer": h.get("COM", ""), "title": title or fn[:-4], "subtitle": "",
                   "catalogue": cat, "bars": "", "tracks": "", "rating": "", "n_ratings": "",
                   "licence": "see SOURCES.md", "genres": "classical", "quarried_before": ""}


def musetrainer_rows():
    d = os.path.join(IMP, "musetrainer", "scores")
    for fn in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        if fn.endswith((".mxl", ".musicxml", ".xml")):
            yield {"source": "musetrainer", "file": os.path.relpath(os.path.join(d, fn), ROOT).replace("\\", "/"),
                   "composer": "", "title": os.path.splitext(fn)[0].replace("_", " "), "subtitle": "",
                   "catalogue": "", "bars": "", "tracks": "", "rating": "", "n_ratings": "",
                   "licence": "public domain (blanket claim)", "genres": "", "quarried_before": ""}


def mutopia_rows():
    for dp, _, fs in os.walk(os.path.join(IMP, "mutopia")):
        for fn in fs:
            if not fn.endswith(".ly"):
                continue
            p = os.path.join(dp, fn)
            txt = open(p, encoding="utf-8", errors="replace").read()
            def field(k):
                m = re.search(k + r'\s*=\s*"([^"]*)"', txt)
                return m.group(1) if m else ""
            if not (field("title") or field("mutopiatitle")):
                continue  # include-only fragments
            yield {"source": "mutopia", "file": os.path.relpath(p, ROOT).replace("\\", "/"),
                   "composer": field("composer") or field("mutopiacomposer"),
                   "title": field("mutopiatitle") or field("title"), "subtitle": field("subtitle"),
                   "catalogue": field("opus"), "bars": "", "tracks": "", "rating": "", "n_ratings": "",
                   "licence": field("license"), "genres": "", "quarried_before": ""}


def catalogue_rows():
    """Online libraries catalogued in docs/sources/catalogues/*.csv (Mutopia, OpenScore): listed, not yet on disk."""
    import glob
    for p in sorted(glob.glob(os.path.join(ROOT, "docs", "sources", "catalogues", "*.csv"))):
        with open(p, encoding="utf-8") as f:
            for r in csv.DictReader(f):
                yield {"source": r.get("source", "") or os.path.basename(p)[:-4], "file": r.get("url", ""),
                       "composer": r.get("composer", ""), "title": r.get("title", ""), "subtitle": r.get("instrument", ""),
                       "catalogue": r.get("catalogue", ""), "bars": "", "tracks": "", "rating": "", "n_ratings": "",
                       "licence": r.get("licence", ""), "genres": r.get("formats", ""), "quarried_before": ""}


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    counts = {}
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        for gen in (pdmx_rows(quarried_cids()), kern_rows(), musetrainer_rows(), mutopia_rows(), catalogue_rows()):
            for r in gen:
                w.writerow(r)
                counts[r["source"]] = counts.get(r["source"], 0) + 1
    print(OUT, counts)


if __name__ == "__main__":
    main()
