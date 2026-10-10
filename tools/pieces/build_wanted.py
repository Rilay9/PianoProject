"""Build wanted.csv: every graded piece from the published lists, one row per (source, piece).

Inputs:
  PSyllabus metadata (Zenodo 14794592, new_clean_data.json; path given as argument or $PSYLLABUS_JSON).
    Fields used: composer, PS_title, ps (PSyllabus level 0-10), syllabus, related_entries {board: board's own grade,
    preliminary levels as 0, as checked against ABRSM Grade 1 2025-26 entries}, period.
  docs/sources/lists/*.csv: board lists transcribed from the boards' own documents (same columns as the output;
    rows with source = the board and edition).

Columns: source, edition, board_level, ps_level, list, composer, title, catalogue, arranger, publication, period, page
'catalogue' is pulled from the title by pattern (Op., No., BWV, K., HWV, Z, Hob, WoO, L., D.) for matching only.
Nothing here is a confirmation; every row is a want.

Usage: python tools/pieces/build_wanted.py <new_clean_data.json> [out.csv]   (default build/pieces/wanted.csv)
"""
import csv, glob, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
COLS = ["source", "edition", "board_level", "ps_level", "list", "composer", "title", "catalogue",
        "arranger", "publication", "period", "page"]
CAT = re.compile(r"\b(?:op(?:us)?\.?\s*\d+[a-z]?(?:\s*no\.?\s*\d+)?|bwv\s*(?:anh\.?\s*)?\d+[a-z]?|hwv\s*\d+|k\.?\s*\d+[a-z]?"
                 r"|kv\s*\d+|z\.?\s*t?\s*\d+|hob\.?\s*[xvi]+[:/]?\s*\d+|woo\s*\d+|l\.\s*\d+|d\.?\s*\d{2,3})\b", re.I)


def catalogue(title):
    return "; ".join(m.group(0).strip() for m in CAT.finditer(title))


def psyllabus_rows(path):
    d = json.load(open(path, encoding="utf-8"))
    for v in d.values():
        boards = v.get("related_entries") or {}
        if not isinstance(boards, dict) or not boards:
            boards = {v.get("syllabus", ""): v.get("ps", "")}
        for board, grade in boards.items():
            yield {"source": f"PSyllabus:{board}", "edition": "PSyllabus v1 (2025)", "board_level": grade,
                   "ps_level": v.get("ps", ""), "list": "", "composer": v.get("composer", ""),
                   "title": v.get("PS_title", ""), "catalogue": catalogue(v.get("PS_title", "")),
                   "arranger": "", "publication": "", "period": v.get("period", ""), "page": ""}


def board_list_rows():
    for p in sorted(glob.glob(os.path.join(ROOT, "docs", "sources", "lists", "*.csv"))):
        with open(p, encoding="utf-8") as f:
            rd = csv.DictReader(f)
            # exam-format lists only (ABRSM, RCM, Trinity, styles): the book, course and 8notes lists in the same folder
            # have other columns and are read by candidates.songs() (ChatGPT's script review H1, 2026-10-10)
            if not {"source", "board_level", "title"} <= set(rd.fieldnames or []):
                print("  not an exam list, skipped:", os.path.basename(p))
                continue
            for r in rd:
                row = {c: r.get(c, "") for c in COLS}
                if not row["catalogue"]:
                    row["catalogue"] = catalogue(row["title"])
                yield row


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PSYLLABUS_JSON", "")
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "build", "pieces", "wanted.csv")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    counts = {}
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        gens = [board_list_rows()] + ([psyllabus_rows(src)] if src else [])
        for g in gens:
            for r in g:
                w.writerow(r)
                key = r["source"].split(":")[0]
                counts[key] = counts.get(key, 0) + 1
    print(out, counts)


if __name__ == "__main__":
    main()
