"""Pair second uploads with references already held: for each wanted piece at the given levels whose reference pair
did not confirm, every other canonical MusicXML file of that piece that fits the facts (docs/pieces/quality.csv) is
paired with the same reference (Pianocoda or Mutopia), so a reader can check it without a new download.

Output: build/pieces/alt-matches.csv (columns of mutopia-matches.csv). Usage: python tools/pieces/alt_pairs.py 8 [7 ...]
"""
import csv, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
csv.field_size_limit(10**9)
sys.path.insert(0, os.path.dirname(__file__))
import summarise as S  # noqa: E402


def main():
    levels = set(sys.argv[1:]) or {"8"}
    refs = {}
    for f in ("pianocoda-matches.csv", "mutopia-matches.csv"):
        for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "review", f), encoding="utf-8")):
            if r["png"].endswith(".png"):
                refs.setdefault((r["composer"], r["title"]), r)
    verdicts = list(csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "review", "reference-verdicts.csv"), encoding="utf-8")))
    confirmed = {(v["composer"], v["title"]) for v in verdicts if v["verdict"] == "CONFIRMED"}
    tried = {v["candidate_file"] for v in verdicts}
    out = []
    for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "quality.csv"), encoding="utf-8")):
        k = (r["composer"], r["title"])
        if k not in refs or k in confirmed or r["a_file"] in tried or r["verdict"] != "facts fit" \
                or not r["a_file"].lower().endswith((".mxl", ".musicxml", ".xml")):
            continue
        lv = [x for x in S.app_levels(r["sources"])[0] if x in S.ORDER]
        if not lv or min(lv, key=S.ORDER.index) not in levels:
            continue
        ref = refs[k]
        out.append(dict(ref, candidate_file=r["a_file"], candidate_title=r["a_title"]))
        tried.add(r["a_file"])
    cols = list(csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "review", "mutopia-matches.csv"), encoding="utf-8")).fieldnames)
    with open(os.path.join(ROOT, "build", "pieces", "alt-matches.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, restval="", extrasaction="ignore")
        w.writeheader()
        w.writerows(out)
    print(len(out), "second-upload pairs at levels", sorted(levels))


if __name__ == "__main__":
    main()
