"""Copy the probe's evidence into docs/prompts/runs/A7a1/, machine paths replaced (operating-procedure §14)."""
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
DEST = REPO / "docs" / "prompts" / "runs" / "A7a1"
WT = str(REPO)
HOME = str(Path.home())
REPL = []
for base, tag in ((WT, "<worktree>"), (str(REPO.parents[2]), "<main checkout>"), (HOME, "<home>")):
    for form in (base, base.replace("\\", "/"), base.replace("\\", "\\\\")):
        REPL.append((form, tag))
TEXT = ["csv_hits.py", "candidate_row.py", "scan_br.py", "gates_br.py", "converter_report.py", "readers.py",
        "event_table.py", "h1_scratch.py", "shuffle_read.py", "keep.py",
        "hits.json", "scan.json", "candidate_row.out", "extract.out", "quarry.out", "gates_br.out",
        "converter_report.out", "converter-report.json", "readers.out", "readers.json", "events-by-role.json",
        "event-table.md", "h1_scratch.out", "shuffle_read.out", "shuffle.json", "app-facts.json",
        "chordmatch-subsets.out", "preflight.out", "check_chains.out", "vitest-probe.out"]
EXTRA = {"pdmx/quarried.json": "quarried.json", "pdmx/candidates.json": "candidates.json",
         str(REPO / "app" / "build" / "A7a1-probe" / "facts.probe.ts"): "facts.probe.ts"}
DEST.mkdir(parents=True, exist_ok=True)


def clean(text: str) -> str:
    for a, b in REPL:
        text = text.replace(a, b)
    return text.lstrip("﻿")


for name in TEXT:
    (DEST / name).write_text(clean((HERE / name).read_text(encoding="utf-8-sig", errors="replace")), encoding="utf-8")
for src, name in EXTRA.items():
    p = Path(src) if Path(src).is_absolute() else HERE / src
    (DEST / name).write_text(clean(p.read_text(encoding="utf-8-sig")), encoding="utf-8")
(DEST / "source").mkdir(exist_ok=True)
cid = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
shutil.copyfile(HERE / "pdmx" / "raw" / f"{cid}.mxl", DEST / "source" / f"{cid}.mxl")
shutil.copyfile(HERE / "pdmx" / "converted" / f"{cid}.mxl", DEST / "source" / f"{cid}.converted.mxl")
left = [f.name for f in DEST.rglob("*") if f.is_file() and f.suffix != ".mxl"
        and any(s in f.read_text(encoding="utf-8", errors="replace") for s in ("yalir", "Users\\", "Users/"))]
print("kept", len(list(DEST.rglob('*'))), "files; with a machine path left:", left)
