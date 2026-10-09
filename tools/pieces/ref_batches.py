"""Write reading batches for the reference check: each item pairs a rendered Pianocoda reference (pianocoda_refs.py)
with the candidate file's bars 1-8 as text (worklist.opening), for a reader agent to compare.

Each piece goes in at its lowest app level; pieces with no level on the app's spine are left out. Batches hold at most
12 items, one level each (small adjacent levels share a batch). Item ids are <level>.<nn>.

Output: build/pieces/batches/batch-<n>.md and build/pieces/batches/items.csv (id, level, composer, title, file, url).
Usage: python tools/pieces/ref_batches.py [--new]
  --new: leave out (candidate file, reference page) pairs already judged in docs/pieces/review/reference-verdicts.csv
  (except NOT READ rows); batches are then written as new-<n>.md.
"""
import csv, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
OUT = os.path.join(ROOT, "build", "pieces", "batches")
sys.path.insert(0, os.path.dirname(__file__))
import summarise as S  # noqa: E402
from worklist import opening  # noqa: E402

MAX = 12


def main():
    rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "review", "pianocoda-matches.csv"),
                                           encoding="utf-8")) if r["png"].endswith(".png")]
    new = "--new" in sys.argv
    if new:
        vp = os.path.join(ROOT, "docs", "pieces", "review", "reference-verdicts.csv")
        done = {(v["candidate_file"], v["pianocoda_url"]) for v in csv.DictReader(open(vp, encoding="utf-8"))
                if v["verdict"] != "NOT READ"}
        rows = [r for r in rows if (r["candidate_file"], r["pianocoda_url"]) not in done]
    by_level = {}
    for r in rows:
        lv = [x for x in r["levels"].split() if x in S.ORDER]
        if lv:
            by_level.setdefault(min(lv, key=S.ORDER.index), []).append(r)
    os.makedirs(OUT, exist_ok=True)
    items, batches, cur = [], [], []
    for lvl in S.ORDER:
        rs = by_level.get(lvl, [])
        chunks = [rs[i:i + MAX] for i in range(0, len(rs), MAX)]
        for ch in chunks:
            if cur and len(cur) + len(ch) > MAX:
                batches.append(cur)
                cur = []
            cur += [(lvl, i, r) for i, r in enumerate(ch, rs.index(ch[0]) + 1)]
            if len(ch) == MAX:
                batches.append(cur)
                cur = []
    if cur:
        batches.append(cur)
    for n, batch in enumerate(batches, 1):
        lines = [f"# Reference reading, batch {n}", ""]
        for lvl, i, r in batch:
            iid = f"{'n' if new else ''}{lvl}.{i:02d}"
            f = r["candidate_file"]
            path = os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)
            lines += [f"## {iid} {r['composer']}: {r['title']}", "",
                      f"- Reference image: `{os.path.join(ROOT, r['png'])}`",
                      f"- Candidate file title: \"{r['candidate_title']}\""]
            try:
                for label, bars in opening(path):
                    lines.append(f"- Candidate {label}:")
                    lines += [f"  - {b}" for b in bars]
            except Exception as e:
                lines.append(f"- Candidate bars could not be read ({type(e).__name__}): verdict UNREADABLE")
            lines.append("")
            items.append({"id": iid, "batch": n, "level": lvl, "composer": r["composer"], "title": r["title"],
                          "candidate_file": f, "candidate_title": r["candidate_title"], "pianocoda_url": r["pianocoda_url"]})
        open(os.path.join(OUT, f"{'new' if new else 'batch'}-{n}.md"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))
        print(f"batch {n}: {len(batch)} items, levels {sorted({b[0] for b in batch}, key=S.ORDER.index)}")
    with open(os.path.join(OUT, "new-items.csv" if new else "items.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(items[0].keys()))
        w.writeheader()
        w.writerows(items)


if __name__ == "__main__":
    main()
