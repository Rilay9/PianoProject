"""Which easy PDMX files (build/pieces/beginner-pdmx.csv) look like Level B pieces, and which skill rungs they show.

A file "fits Level B" when what it asks of the player stays inside what rungs.md teaches by Level B: key signature of
at most two sharps or flats (B.3, B.4, B.12); no sixteenths, tuplets, grace notes or ornaments (these come at 1.4,
2.4, 2.6, 3.4); chords of at most three notes in a hand; at most 48 bars. The rule is tested first on the pieces
already chosen with a published level (docs/pieces/chosen.csv): its pass rate per level is printed, and it should
pass the Level B pieces and fail most pieces from Grade 2 up. This is a reading of rungs.md turned into a filter, not
a published grading.

The code checks (file_checks.py) run on every candidate; skill rungs come from rung_pieces.RULES at Levels B and 1.
A candidate whose title matches a tune named in a beginner book list (docs/sources/lists) carries that book's
placement and stated skill.

Output: build/pieces/level-b-candidates.csv. Usage: python tools/pieces/level_fit.py
"""
import csv, glob, os, re, sys
from collections import Counter, defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
sys.path.insert(0, os.path.dirname(__file__))
from rung_pieces import features, RULES  # noqa: E402
from file_checks import check  # noqa: E402
csv.field_size_limit(10**9)


def extra(path):
    """Largest chord in either hand, and bar count."""
    import music21
    s = music21.converter.parse(path)
    big = max([len(c.pitches) for c in s.recurse().getElementsByClass(music21.chord.Chord)] or [1])
    return big, len(list(s.parts[0].getElementsByClass(music21.stream.Measure)))


def fits_b(f, big, bars):
    why = []
    if abs(f["keysig"]) > 2:
        why.append(f"key signature {f['keysig']}")
    if f["sixteenth"] > 0:  # none at all, as the docstring says (ChatGPT's code review, 2026-10-10)
        why.append("sixteenths")
    if f["tuplet"]:
        why.append("tuplets")
    if f["grace"]:
        why.append("grace notes")
    if f["ornament"]:
        why.append("ornaments")
    if big > 3:
        why.append(f"{big}-note chords")
    if bars > 48:
        why.append(f"{bars} bars")
    return not why, why


def path_of(f):
    return os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)


def norm(t):
    return re.sub(r"[^a-z ]", "", t.lower().replace("’", "'")).strip()


def main():
    # 1. test the rule on pieces with a published level
    tally = defaultdict(Counter)
    for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8")):
        try:
            f = features(path_of(r["candidate_file"]), [])
            ok, _ = fits_b(f, *extra(path_of(r["candidate_file"])))
        except Exception:
            continue
        tally[r["level"]][ok] += 1
    print("Rule tested on chosen pieces (level: passes / total):")
    for lv in ["B", "1", "2", "3", "4", "5", "6", "7", "8"]:
        if tally[lv]:
            print(f"  {lv}: {tally[lv][True]} / {sum(tally[lv].values())}")
    # 2. book tunes: title -> (source, stated skill)
    book = defaultdict(list)
    for p in glob.glob(os.path.join(ROOT, "docs", "sources", "lists", "*.csv")):
        for r in csv.DictReader(open(p, encoding="utf-8")):
            t = r.get("title") or ""
            sk = r.get("teaches") or r.get("skill") or r.get("unit_concept") or r.get("skills") or ""
            if t:
                book[norm(t)].append(f"{os.path.basename(p)[:-4]}: {sk[:60]}")
    # 3. candidates
    out = []
    for r in csv.DictReader(open(os.path.join(ROOT, "build", "pieces", "beginner-pdmx.csv"), encoding="utf-8")):
        path = path_of(r["file"])
        try:
            notes, fail = check(path, r["title"], r["title"])
            f = features(path, [])
            big, bars = extra(path)
        except Exception as e:
            out.append({**r, "code_checks": f"parse failed: {type(e).__name__}", "fits_b": False})
            continue
        ok, why = fits_b(f, big, bars)
        rungs = [k for k, (_, test) in RULES.items() if k.split(".")[0] in ("B", "1") and test(f)]
        tn = norm(r["title"])
        src = next((v for k, v in book.items() if k and (tn == k or tn.startswith(k + " ") or k in tn and len(k) > 8)), [])
        out.append({**r, "code_checks": "fail: " + "; ".join(notes) if fail else "pass", "fits_b": ok and not fail,
                    "outside_b": "; ".join(why), "rungs_shown": " ".join(rungs), "range": f"{f['range'][0]}-{f['range'][1]}",
                    "book_sources": " | ".join(src[:3])})
    cols = list(out[0].keys())
    for o in out:
        for c in o:
            if c not in cols:
                cols.append(c)
    with open(os.path.join(ROOT, "build", "pieces", "level-b-candidates.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, restval="")
        w.writeheader()
        w.writerows(out)
    fit = [o for o in out if o["fits_b"] is True]
    print(len(out), "candidates;", len(fit), "fit Level B and pass the code checks;",
          sum(1 for o in fit if o["book_sources"]), "of those are tunes a beginner book names")
    print("Rungs shown by the fitting files:", Counter(x for o in fit for x in o["rungs_shown"].split()).most_common())


if __name__ == "__main__":
    main()
