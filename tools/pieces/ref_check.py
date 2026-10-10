"""Write one-pass reading batches under the owner's acceptance rule (2026-10-09): each item gives the reference's first
page and last page as images, with the candidate's first 3 and last 3 bars as text (the last bars stop at the end of
the first movement when the file holds several), for a reader to compare both ends at once.

Input: a matches file (pianocoda_refs.py or mutopia_refs.py output). Pairs already in reference-verdicts.csv are
left out, and so are files failing the code checks (file_checks.py); one item per (file, reference) pair; pieces off the app's level spine are left out. Batches of 10.
Output: build/pieces/batches/check-<n>.md and build/pieces/batches/check-items.csv.
Usage: python tools/pieces/ref_check.py docs/pieces/review/mutopia-matches.csv
"""
import csv, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
OUT = os.path.join(ROOT, "build", "pieces", "batches")
sys.path.insert(0, os.path.dirname(__file__))
import summarise as S  # noqa: E402
from worklist import opening  # noqa: E402
from ref_ends import closing  # noqa: E402
from file_checks import check  # noqa: E402

PER = 10


def main():
    import pymupdf
    src = sys.argv[1]
    done = {(v["candidate_file"], v["pianocoda_url"]) for v in csv.DictReader(open(os.path.join(
        ROOT, "docs", "pieces", "review", "reference-verdicts.csv"), encoding="utf-8")) if v["verdict"] != "REREAD"}
    pairs = {}
    for r in csv.DictReader(open(src, encoding="utf-8")):
        k = (r["candidate_file"], r["pianocoda_url"])
        if not r["png"].endswith(".png") or k in done:
            continue
        if k in pairs:
            pairs[k]["levels"] = " ".join(sorted(set(pairs[k]["levels"].split()) | set(r["levels"].split())))
        else:
            pairs[k] = dict(r)
    rows = []
    for r in pairs.values():
        lv = [x for x in r["levels"].split() if x in S.ORDER]
        if lv:
            r["level"] = min(lv, key=S.ORDER.index)
            rows.append(r)
    kept = []
    for r in rows:  # code checks first: obviously broken files never reach a reader
        f = r["candidate_file"]
        path = os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)
        try:
            notes, fail = check(path, r["title"], r["candidate_title"])
        except Exception as e:
            notes, fail = [f"parse failed: {type(e).__name__}"], True
        if fail:
            print("  dropped by code checks:", r["title"][:40], "|", "; ".join(notes))
        else:
            kept.append(r)
    rows = kept
    rows.sort(key=lambda r: S.ORDER.index(r["level"]))
    items = []
    for n in range(0, len(rows), PER):
        lines = [f"# Reference check, batch {n // PER + 1}", ""]
        for j, r in enumerate(rows[n:n + PER], n + 1):
            iid = f"c{j:03d}"
            png1 = os.path.join(ROOT, r["png"])
            pdf = png1[:-4] + ".pdf"
            d = pymupdf.open(pdf)
            png2 = png1[:-4] + "-end.png"
            d[-1].get_pixmap(dpi=120).save(png2)
            f = r["candidate_file"]
            path = os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)
            lines += [f"## {iid} (level {r['level']}) {r['composer']}: {r['title']}", "",
                      f"- Candidate file title: \"{r['candidate_title']}\"",
                      f"- Reference first page (top): `{png1}`",
                      f"- Reference last page: `{png2}` ({len(d)} pages; full PDF `{pdf}`)"]
            try:
                for label, bars in opening(path, 3):
                    lines.append(f"- Candidate first bars, {label}:")
                    lines += [f"  - {b}" for b in bars]
                for label, bars in closing(path):
                    lines.append(f"- Candidate last bars, {label}:")
                    lines += [f"  - {b}" for b in bars]
            except Exception as e:
                lines.append(f"- Candidate bars could not be read ({type(e).__name__}): verdict UNREADABLE")
            lines.append("")
            items.append({"id": iid, "batch": n // PER + 1, "level": r["level"], "composer": r["composer"],
                          "title": r["title"], "candidate_file": f, "candidate_title": r["candidate_title"],
                          "pianocoda_url": r["pianocoda_url"]})
        open(os.path.join(OUT, f"check-{n // PER + 1}.md"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    with open(os.path.join(OUT, "check-items.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(items[0].keys()))
        w.writeheader()
        w.writerows(items)
    from collections import Counter
    print(len(items), "items in", (len(items) + PER - 1) // PER, "batches;", dict(Counter(i["level"] for i in items)))


if __name__ == "__main__":
    main()
