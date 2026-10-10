"""Write a reading batch for the end check: the last page of each chosen piece's reference PDF, rendered, with the
candidate file's last 3 bars as text, for a reader to compare (the opening was compared already).

Acceptance (the owner, 2026-10-09, for step 3): the first and the last 2-3 bars match the reference, allowing one or
two notes to differ between transcriptions; the arrangement must be the same kind (not a reduction or simplification).

Input: item ids from docs/pieces/review/reference-verdicts.csv. Output: build/pieces/batches/ends-1.md.
Usage: python tools/pieces/ref_ends.py <id> [<id> ...]
"""
import csv, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
REFS = os.path.join(ROOT, "build", "pieces", "refs")
OUT = os.path.join(ROOT, "build", "pieces", "batches", "ends-1.md")
sys.path.insert(0, os.path.dirname(__file__))
from worklist import value  # noqa: E402
from pianocoda_refs import fold  # noqa: E402
import re  # noqa: E402


def closing(path, n=3):
    import music21
    s = music21.converter.parse(path)
    parts = list(s.parts)
    staves = [list(p.getElementsByClass(music21.stream.Measure)) for p in (parts[0], parts[-1])]
    last = min(len(x) for x in staves)
    while last > 0 and not any(x[last - 1].recurse().notes for x in staves):  # trailing empty bars
        last -= 1
    out = []
    for label, allms in (("RH (top staff)", staves[0]), ("LH (bottom staff)", staves[1])):
        ms = allms[:last]
        bars = []
        for i, m in enumerate(ms[-n:], len(ms) - n + 1):
            ev = []
            for e in m.recurse().notesAndRests:
                if e.isRest:
                    ev.append(f"rest {value(e.quarterLength)}")
                elif e.isChord:
                    ev.append("+".join(p.nameWithOctave.replace("-", "b") for p in e.pitches) + " " + value(e.quarterLength))
                else:
                    ev.append(e.nameWithOctave.replace("-", "b") + " " + value(e.quarterLength))
            bars.append(f"bar {i} of {len(ms)}: " + ", ".join(ev))
        out.append((label, bars))
    return out


def main():
    import pymupdf
    want = sys.argv[1:]
    rows = {r["id"]: r for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "review",
                                                                    "reference-verdicts.csv"), encoding="utf-8"))}
    lines = ["# End check", ""]
    for i in want:
        r = rows[i]
        name = re.sub(r"[^a-z0-9]+", "-", fold(r["pianocoda_url"].split("pianocoda.com/")[1])).strip("-")
        pdf = os.path.join(REFS, name + ".pdf")
        d = pymupdf.open(pdf)
        png = os.path.join(REFS, name + "-end.png")
        d[-1].get_pixmap(dpi=120).save(png)
        f = r["candidate_file"]
        path = os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)
        lines += [f"## {i} {r['composer']}: {r['title']}", "",
                  f"- Reference: last page of a {len(d)}-page score: `{png}`"]
        for label, bars in closing(path):
            lines.append(f"- Candidate {label}:")
            lines += [f"  - {b}" for b in bars]
        lines.append("")
    open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    print(OUT, len(want), "items")


if __name__ == "__main__":
    main()
