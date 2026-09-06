"""
The review page and the decision sheet (replan §2.5).

Nothing is committed that a person has not marked `keep`. The machine gates in
`quarry.py` decide what is *usable*; only an ear decides what is worth
practising, and no test in this repository can tell whether a transcription is
any good.

So this writes two files:

  build/pdmx/review/index.html   a static page — the two-bar preview the render
                                 check already produced, the facts, the flags,
                                 and a link to the MuseScore original
  build/pdmx/review/review.csv   cid, decision, level_override, note

The page is static and uses no server: it opens from the file system, which
matters because it is looked at on a laptop while the tarball is still on it.
`--check` lists what is still undecided, and `commit.py` refuses a row with no
decision.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
from pathlib import Path

import sys

# `tools/content` on the path and this directory *off* it, before anything
# else is imported. Python puts a script's own directory first on `sys.path`,
# so every module sitting beside this one silently outranks the standard
# library for the rest of the process. That is how `select.py` — since
# renamed to `shortlist.py` for the same reason — came to answer
# `socketserver`'s `import select` and kill a server on its first connection.
# The name is gone; the hazard is structural, so the guard stays.
_HERE = Path(__file__).resolve().parent
sys.path[:] = [entry for entry in sys.path if entry and Path(entry).resolve() != _HERE]
if str(_HERE.parent) not in sys.path:
    sys.path.insert(0, str(_HERE.parent))

from pdmx.paths import BUILD_DIR  # noqa: E402

DECISIONS = ("keep", "drop", "later")
CSV_COLUMNS = ("cid", "decision", "level_override", "note")

PAGE_CSS = """
:root { color-scheme: light dark; font-family: system-ui, sans-serif; }
body { margin: 0; padding: 16px; }
h1 { font-size: 1.2rem; }
p.lede { max-width: 60ch; opacity: 0.8; }
table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
th, td { border-bottom: 1px solid rgba(128,128,128,0.35); padding: 6px 8px; text-align: left;
         vertical-align: top; }
th { position: sticky; top: 0; background: Canvas; }
img { max-width: 320px; height: auto; border-radius: 6px; background: #fff; }
code { font-size: 0.85em; }
.flags span { display: inline-block; padding: 1px 6px; border-radius: 999px;
              border: 1px solid rgba(128,128,128,0.5); margin: 0 4px 4px 0; font-size: 0.8em; }
.status-pd { color: #2e7d32; }
.status-in-copyright { color: #c62828; }
.status-unknown { opacity: 0.7; }
""".strip()


def flags_for(row: dict) -> list[str]:
    flags: list[str] = []
    if row.get("duplicate_of"):
        flags.append(f"duplicate of {row['duplicate_of']}")
    if row.get("tempo_defaulted"):
        flags.append("tempo defaulted")
    if row.get("single_line"):
        flags.append("single line")
    if row.get("lyrics_stripped"):
        flags.append(f"{row['lyrics_stripped']} lyric(s) stripped")
    if row.get("level_source") == "fallback":
        flags.append("level from the fallback table")
    return flags


def write_page(rows: list[dict], candidates: dict[str, dict], out: Path, preview_dir: Path) -> None:
    parts: list[str] = [
        "<!doctype html><html><head><meta charset='utf-8'>",
        "<title>PDMX review</title>",
        f"<style>{PAGE_CSS}</style></head><body>",
        "<h1>PDMX review</h1>",
        "<p class='lede'>Every file below passed the machine gates: it parses, it round-trips "
        "note for note, it renders, and its cursor walks the same number of steps the model has. "
        "None of that says whether it is a good transcription or worth practising. "
        "Mark each row <code>keep</code>, <code>drop</code> or <code>later</code> in "
        "<code>review.csv</code>; a row with no decision stops the commit.</p>",
        f"<p class='lede'>{len(rows)} row(s).</p>",
        "<table><thead><tr><th>preview</th><th>what it is</th><th>level</th>"
        "<th>flags</th><th>cid</th></tr></thead><tbody>",
    ]
    for row in rows:
        cid = row["cid"]
        candidate = candidates.get(cid, {})
        preview = preview_dir / f"{cid}.png"
        image = (
            f"<img src='../previews/{html.escape(preview.name)}' alt='first two bars'>"
            if preview.is_file()
            else "<em>no preview</em>"
        )
        status = candidate.get("composition_status", "unknown")
        musescore = candidate.get("musescore_id")
        link = (
            f"<a href='https://musescore.com/score/{html.escape(str(musescore))}'>MuseScore</a>"
            if musescore
            else ""
        )
        drivers = ", ".join(f"{name} {value}" for name, value in (row.get("level_drivers") or []))
        parts.append(
            "<tr>"
            f"<td>{image}</td>"
            f"<td><strong>{html.escape(row.get('title') or cid)}</strong><br>"
            f"{html.escape(str(row.get('composer') or candidate.get('composer_raw') or '—'))}<br>"
            f"<span class='status-{html.escape(status)}'>{html.escape(status)}</span> · "
            f"band {html.escape(str(candidate.get('band', '?')))} · "
            f"{row.get('measures', 0)} bars · {row.get('notes', 0)} notes<br>{link}</td>"
            f"<td>{row.get('level', 0)}<br><small>{html.escape(drivers)}</small></td>"
            f"<td class='flags'>" + "".join(f"<span>{html.escape(flag)}</span>" for flag in flags_for(row))
            + f"</td><td><code>{html.escape(cid)}</code></td></tr>"
        )
    parts.append("</tbody></table></body></html>")
    out.write_text("\n".join(parts) + "\n", encoding="utf-8")


def write_sheet(rows: list[dict], path: Path) -> None:
    """
    Writes `review.csv`, keeping any decision already in it.

    Re-running review.py after growing the composer table and re-quarrying a
    band must not throw away the decisions already made — that is most of the
    work, and losing it would make anyone reluctant to re-run.

    The `note` column is pre-filled with what the machine noticed — a duplicate,
    a defaulted tempo, a single line, a level that came from the fallback table
    — and nothing else. Those are facts, not opinions: pre-filling a *decision*
    would defeat the one rule this whole design rests on, which is that nothing
    is bundled that a person has not looked at.
    """
    existing: dict[str, dict[str, str]] = {}
    if path.is_file():
        with path.open(encoding="utf-8", newline="") as handle:
            for record in csv.DictReader(handle):
                existing[record["cid"]] = record
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(CSV_COLUMNS))
        writer.writeheader()
        for row in rows:
            was = existing.get(row["cid"], {})
            flags = "; ".join(flags_for(row))
            writer.writerow(
                {
                    "cid": row["cid"],
                    "decision": was.get("decision", ""),
                    "level_override": was.get("level_override", ""),
                    "note": was.get("note") or flags,
                }
            )


def read_decisions(path: Path) -> dict[str, dict[str, str]]:
    if not path.is_file():
        return {}
    with path.open(encoding="utf-8", newline="") as handle:
        return {record["cid"]: record for record in csv.DictReader(handle)}


def undecided(rows: list[dict], decisions: dict[str, dict[str, str]]) -> list[str]:
    return [
        row["cid"]
        for row in rows
        if (decisions.get(row["cid"], {}).get("decision") or "").strip().lower() not in DECISIONS
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quarried", type=Path, default=BUILD_DIR / "quarried.json")
    parser.add_argument("--candidates", type=Path, default=BUILD_DIR / "candidates.json")
    parser.add_argument("--out", type=Path, default=BUILD_DIR / "review")
    parser.add_argument("--previews", type=Path, default=BUILD_DIR / "previews")
    parser.add_argument("--check", action="store_true", help="list undecided rows and exit")
    args = parser.parse_args(argv)

    if not args.quarried.is_file():
        print(f"{args.quarried} does not exist. Run quarry.py first.", file=sys.stderr)
        return 2
    data = json.loads(args.quarried.read_text(encoding="utf-8"))
    rows = [row for row in data["rows"] if row.get("ok")]
    candidates = {}
    if args.candidates.is_file():
        candidates = {
            c["cid"]: c
            for c in json.loads(args.candidates.read_text(encoding="utf-8"))["candidates"]
        }

    args.out.mkdir(parents=True, exist_ok=True)
    sheet = args.out / "review.csv"

    if args.check:
        pending = undecided(rows, read_decisions(sheet))
        print(f"{len(rows) - len(pending)}/{len(rows)} decided; {len(pending)} still open")
        for cid in pending[:40]:
            print(f"  {cid}")
        return 0 if not pending else 1

    write_sheet(rows, sheet)
    page = args.out / "index.html"
    write_page(rows, candidates, page, args.previews)
    print(f"{len(rows)} row(s) to review")
    print(f"  page  {page}")
    print(f"  sheet {sheet}")
    print("Open the page, fill the sheet, then run review.py --check.")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
