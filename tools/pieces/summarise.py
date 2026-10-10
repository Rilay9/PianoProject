"""Summarise build/pieces/matches.csv by app level: how many wanted pieces have a candidate of each confidence.

App level from each source's own level (curriculum.md, level spine): ABRSM/Trinity 0 -> B, N -> N;
RCM PrepA -> A, PrepB -> B, L1-4 -> 1-4, L5-6 -> 5, L7-8 -> 6, L9 -> 7, L10 -> 8 (above Grade 4 approximate);
style lists by their grade (0 -> B). PSyllabus rows count under their board when it is ABRSM, Trinity or RCM;
other boards (AMEB, NZMEB, LCM, ...) are placed by PSyllabus's own normalised level when the piece has no ABRSM,
Trinity or RCM level: ps 0 -> B, ps 1-8 -> 1-8. The mapping is read off PSyllabus's ABRSM/RCM/Trinity rows, where ps N
falls mostly at Grade N (ps 0 at B); ps 9-10 are above Grade 8 and stay off the spine (2026-10-09). A board level
recorded by PSyllabus counts only when that row's PSyllabus level is no more than one above it (2026-10-10).
A piece counts once per app level, under its best candidate. Candidates are not confirmations.
"""
import csv, os, re, sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
B = os.path.join(ROOT, "build", "pieces")
csv.field_size_limit(10**9)
RCM = {"PrepA": "A", "PrepB": "B", "5": "5", "6": "5", "7": "6", "8": "6", "9": "7", "10": "8"}
ORDER = ["A", "B", "1", "2", "3", "4", "5", "6", "7", "8"]
RANK = {"high": 0, "medium": 1, "low": 2, "title-only": 3, "none": 4}


def app_levels(sources):
    out, other = set(), set()
    for s in sources.split("; "):
        m = re.match(r"(?:PSyllabus:)?(.+?)=([^()]+)(?:\(ps(\d+)\))?$", s)
        if not m:
            continue
        board, lvl, ps = m.group(1).strip(), m.group(2).strip(), m.group(3)
        if board == "RCM":
            lv = RCM.get(lvl, lvl)
        elif board in ("ABRSM", "Trinity") or board.startswith(("ABRSM Jazz", "ANZCA", "Trinity Rock", "RSL")):
            lv = "B" if lvl == "0" else lvl
        else:
            lv = None
        # a board level PSyllabus records (often an old syllabus) counts only when PSyllabus's own level for the row
        # agrees within one (Chopin Op. 10/12: "RCM=9(ps10)" had put a level-10 piece at Grade 7; ChatGPT's review)
        n = 0 if lv == "B" else int(lv) if lv and lv.isdigit() else None
        if lv is not None and not (ps is not None and n is not None and int(ps) - n >= 2):
            out.add(lv)
        elif ps is not None:
            other.add("ps" + ps)
    if not out:  # no exam-board level: place by PSyllabus level 0-8
        for o in other:
            n = int(o[2:])
            if n <= 8:
                out.add("B" if n == 0 else str(n))
    return out, other


def main():
    best = {}
    for r in csv.DictReader(open(os.path.join(B, "matches.csv"), encoding="utf-8")):
        k = (r["composer"], r["title"])
        if k not in best or RANK[r["confidence"]] < RANK[best[k]["confidence"]]:
            best[k] = r
    table = defaultdict(lambda: defaultdict(int))
    for r in best.values():
        lv, other = app_levels(r["sources"])
        for l in lv | other:
            table[l][r["confidence"]] += 1
    cols = ["high", "medium", "low", "title-only", "none"]
    print("| App level | wanted | " + " | ".join(cols) + " |")
    print("|---|---|" + "---|" * len(cols))
    for l in ORDER + sorted(k for k in table if k.startswith("ps")):
        if l in table:
            t = table[l]
            print(f"| {l} | {sum(t.values())} | " + " | ".join(str(t[c]) for c in cols) + " |")


if __name__ == "__main__":
    main()
