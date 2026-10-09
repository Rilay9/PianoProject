"""Summarise build/pieces/matches.csv by app level: how many wanted pieces have a candidate of each confidence.

App level from each source's own level (curriculum.md, level spine): ABRSM/Trinity 0 -> B, N -> N;
RCM PrepA -> A, PrepB -> B, L1-4 -> 1-4, L5-6 -> 5, L7-8 -> 6, L9 -> 7, L10 -> 8 (above Grade 4 approximate);
style lists by their grade (0 -> B). PSyllabus rows count under their board when it is ABRSM, Trinity or RCM;
other boards are counted separately by PSyllabus level 0-10 (no app-level mapping is claimed for them).
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
            out.add(RCM.get(lvl, lvl))
        elif board in ("ABRSM", "Trinity") or board.startswith(("ABRSM Jazz", "ANZCA", "Trinity Rock", "RSL")):
            out.add("B" if lvl == "0" else lvl)
        elif ps is not None:
            other.add("ps" + ps)
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
