"""U118: copy the run's kept files into docs/prompts/runs/U118 with machine paths replaced.

Every kept text file has the worktree's absolute path replaced by <worktree> and the home folder by
<home>, in both slash forms; a file over 300 KB is refused. Run from the worktree root.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path.cwd()
RUNS = ROOT / "docs" / "prompts" / "runs" / "U118"
HOME = Path.home()
LIMIT = 300 * 1024

PAIRS = {
    "build/u118/npm-ci.log": "npm-ci.txt",
    "build/u118/build-app-base.txt": "build-app-base.txt",
    "build/u118/probe-stop-base.txt": "probe-stop-run1.txt",
    "build/u118/probe-stop-base-2.txt": "probe-stop-run2.txt",
    "build/u118/probe-stop-not-tablets.txt": "probe-stop-not-tablets.txt",
    "build/u118/disc-as-is.txt": "disc-as-is.txt",
    "build/u118/disc-placement-stand-in.txt": "disc-placement-stand-in.txt",
    "app/build/u118/stop-table-run1.md": "stop-table-run1.md",
    "app/build/u118/stop-table-run2.md": "stop-table-run2.md",
    "app/build/u118/stop-table-not-tablets.md": "stop-table-not-tablets.md",
    "app/build/u118/placed-table.md": "placement-stand-in-table.md",
    "app/build/u118/placed-table-not-tablets.md": "placement-stand-in-table-not-tablets.md",
    "app/build/u118/probe/stop.spec.ts": "scripts-stop.spec.ts",
    "app/build/u118/disc/folded-chip.spec.ts": "scripts-folded-chip.spec.ts",
    "app/build/u118/summarise_stop.py": "scripts-summarise_stop.py",
    "app/build/u118/summarise_placed.py": "scripts-summarise_placed.py",
    "app/build/u118/playwright.u118-5313.config.ts": "scripts-playwright.u118-5313.config.ts",
    "build/u118/keep.py": "scripts-keep.py",
    "app/build/u118/probe-out-2/342x740-hcb-2bars-text100-as-is.json": "probe-342x740-hcb-2bars-as-is.json",
    "app/build/u118/probe-out-2/342x740-hcb-2bars-text100-reserved.json": "probe-342x740-hcb-2bars-reserved.json",
    "app/build/u118/probe-out-2/342x740-hcb-2bars-text100-placed.json": "probe-342x740-hcb-2bars-placed.json",
}


def scrub(text: str) -> str:
    for base, name in ((ROOT, "<worktree>"), (HOME, "<home>")):
        for form in {str(base), str(base).replace("\\", "/"), str(base).replace("\\", "\\\\")}:
            text = re.sub(re.escape(form), name, text, flags=re.IGNORECASE)
    return text


RUNS.mkdir(parents=True, exist_ok=True)
for src, dst in PAIRS.items():
    path = ROOT / src
    if not path.exists():
        print(f"missing: {src}", file=sys.stderr)
        continue
    text = scrub(path.read_text(encoding="utf-8", errors="replace"))
    if len(text.encode("utf-8")) > LIMIT:
        print(f"over 300 KB, not kept: {src}", file=sys.stderr)
        continue
    (RUNS / dst).write_text(text, encoding="utf-8", newline="\n")
    print(f"kept {dst}")
