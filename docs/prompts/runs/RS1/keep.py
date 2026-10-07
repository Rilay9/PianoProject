"""Copy RS1's outputs from the worktree's build/RS1/ into this folder, machine paths replaced (operating-procedure 14)."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
SRC = REPO / "build" / "RS1"
REPL = []
for base, tag in ((str(REPO), "<worktree>"), (str(Path.home()), "<home>")):
    for form in (base, base.replace("\\", "/"), base.replace("\\", "\\\\")):
        REPL.append((form, tag))


def clean(text: str) -> str:
    for a, b in REPL:
        text = text.replace(a, b)
    return text


for name in ("red-first.out", "restaff-run.out", "crosscheck.out", "mutants.out", "refs.out", "check_chains.out",
             "station4-blues8.out", "station4-control.out"):
    (HERE / name).write_text(clean((SRC / name).read_text(encoding="utf-8", errors="replace")), encoding="utf-8")
report = json.loads((SRC / "render-report.json").read_text(encoding="utf-8"))
for item in report.get("items", []):
    item.pop("preview", None)
(HERE / "render-report.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf-8")
build_log = (SRC / "content-build-2.log").read_text(encoding="utf-8", errors="replace")
(HERE / "content-build.out").write_text(clean(build_log[build_log.find("--- content build ---"):]), encoding="utf-8")
first = (SRC / "content-build.log").read_text(encoding="utf-8", errors="replace")
(HERE / "content-build-first.out").write_text(clean(first[first.find("--- content build ---"):]), encoding="utf-8")
print(sorted(p.name for p in HERE.iterdir()))
