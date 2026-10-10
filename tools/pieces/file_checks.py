"""Code checks on candidate files before any reader looks at them (the owner, 2026-10-09: get rid of the obviously
broken ones first). Each check is one the reference reading found by hand:

  bars      two or more bars in the section used hold more music than the time signature allows (one may be a
            free-rhythm cadenza bar; short bars are normal at pickups and repeats)
  opening   the first two bars hold no notes in either staff
  number    the file's title names a catalogue number (K, Op./No., BWV, Hob, D) that conflicts with the wanted title
  movements the file holds several movements (noted, not a failure: the first movement's bars are named)

Input: a check-items.csv / items.csv / reference-verdicts.csv style file (columns title, candidate_file,
candidate_title). Output: the same rows with columns checks and fail, to build/pieces/batches/<input>-checked.csv.
Usage: python tools/pieces/file_checks.py build/pieces/batches/check-items.csv
"""
import csv, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
sys.path.insert(0, os.path.dirname(__file__))
from match import catalogue, cat_compare  # noqa: E402
from pianocoda_refs import kfix  # noqa: E402


def check(path, title, ftitle):
    import music21
    out, fail = [], False
    s = music21.converter.parse(path)
    staves = [list(p.getElementsByClass(music21.stream.Measure)) for p in (s.parts[0], s.parts[-1])]
    n = min(len(x) for x in staves)
    end = n
    for k in range(1, n):
        m, nxt = staves[0][k - 1], staves[0][k]
        if m.rightBarline is not None and m.rightBarline.type == "final" and                 nxt.recurse().getElementsByClass(music21.meter.TimeSignature) and                 nxt.recurse().getElementsByClass(music21.expressions.TextExpression):
            end = k
            out.append(f"movements: first movement is bars 1-{k} of {n}")
            break
    over = []  # over-full bars in the section used; one can be a free-rhythm cadenza bar, so two are needed to fail
    for k in range(end):
        ts = staves[0][k].getContextByClass(music21.meter.TimeSignature)
        if ts is None:
            continue
        want = ts.barDuration.quarterLength
        if any(st[k].duration.quarterLength > want + 0.01 for st in staves):
            over.append(k + 1)
    if len(over) >= 2:
        out.append(f"bars: over-full bars {over[:6]}")
        fail = True
    if n >= 2 and not any(st[k].recurse().notes for st in staves for k in (0, 1)):
        out.append("opening: first two bars empty")
        fail = True
    import re
    wnums = {x for v in catalogue(kfix(title)).values() for x in v if x[:1].isdigit()}
    fnums = set(re.findall(r"\d+", ftitle))
    if cat_compare(catalogue(kfix(title)), catalogue(kfix(ftitle))) == "conflict" and not wnums <= fnums:
        out.append(f"number: file title '{ftitle[:50]}' conflicts with '{title[:50]}'")
        fail = True
    return out, fail


def main():
    src = sys.argv[1]
    rows = list(csv.DictReader(open(src, encoding="utf-8")))
    nfail = 0
    for r in rows:
        f = r["candidate_file"]
        path = os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)
        try:
            notes, fail = check(path, r["title"], r.get("candidate_title", ""))
        except Exception as e:
            notes, fail = [f"parse failed: {type(e).__name__}"], True
        r["checks"], r["fail"] = "; ".join(notes), "yes" if fail else ""
        nfail += fail
    out = os.path.join(ROOT, "build", "pieces", "batches", os.path.basename(src)[:-4] + "-checked.csv")
    with open(out, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(out, len(rows), "rows,", nfail, "fail")
    for r in rows:
        if r["checks"]:
            print(" ", r.get("id", ""), r["fail"] or "note", "|", r["title"][:40], "|", r["checks"])


if __name__ == "__main__":
    main()
