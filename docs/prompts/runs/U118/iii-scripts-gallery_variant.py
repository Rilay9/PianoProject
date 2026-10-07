"""U118: the state gallery on a variant of the source — `base` (the two source files as at HEAD) or a mutant
from mutants.py — with this lane's gallery.ts kept, then the source restored byte for byte and the app rebuilt.
Run from the worktree root with no other Playwright run going.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mutants import APP, MUTANTS, OUT, ROOT, SS, WR, run  # noqa: E402

name = sys.argv[1]
OUT.mkdir(parents=True, exist_ok=True)
saved = {p: p.read_bytes() for p in (WR, SS)}
try:
    if name == "base":
        for p in (WR, SS):
            p.write_bytes(subprocess.check_output(["git", "show", f"HEAD:{p.relative_to(ROOT).as_posix()}"], cwd=ROOT))
    else:
        for path, old, new in MUTANTS[name]:
            text = path.read_bytes().decode("utf-8")
            crlf = "\r\n" in text
            norm = text.replace("\r\n", "\n")
            assert norm.count(old) == 1
            norm = norm.replace(old, new)
            path.write_bytes((norm.replace("\n", "\r\n") if crlf else norm).encode("utf-8"))
    build = run(["npx", "vite", "build"], OUT / f"{name}-gallery-build.txt")
    print(f"build {build}", flush=True)
    if build == 0:
        code = run(["npx", "playwright", "test", "-c", "build/u118/playwright.states.u118-5313.config.ts"], OUT / f"{name}-gallery.txt")
        print(f"gallery {code}", flush=True)
        states = ROOT / "build" / "states" / "states.json"
        if states.exists():
            shutil.copy(states, OUT / f"{name}-states.json")
finally:
    for p, data in saved.items():
        p.write_bytes(data)
    print(f"restored: {all(p.read_bytes() == d for p, d in saved.items())}", flush=True)
