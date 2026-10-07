#!/usr/bin/env python3
"""
R23's two mutants, one per built row: each drops the new `asks_for_songs` / `asksForSongs` gate
again, runs the test that should catch it, and restores the file byte for byte (also on failure).
Run from the repository root. Prints one line per mutant; exits 1 if a mutant survives.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
APP = REPO / "app"
NPX = "npx.cmd" if sys.platform == "win32" else "npx"

MUTANTS = [
    {
        "name": "write_needs without the song-run gate",
        "file": REPO / "tools" / "content" / "validate.py",
        "old": "need_songs = max(0, min_options - len(songs)) if asks_for_songs(lesson) else 0",
        "new": "need_songs = max(0, min_options - len(songs))",
        "cmd": [sys.executable, "-m", "unittest", "tools.content.tests.test_finder.TestNeeds"],
        "cwd": REPO,
    },
    {
        "name": "lessonShortfall without the song-run gate",
        "file": APP / "src" / "curriculum" / "needs.ts",
        "old": "songs: asksForSongs(lesson) ? Math.max(0, floor - songs) : 0,",
        "new": "songs: Math.max(0, floor - songs),",
        "cmd": [NPX, "vitest", "run", "tests/unit/needs.test.ts"],
        "cwd": APP,
    },
]


def main() -> int:
    survived = 0
    for m in MUTANTS:
        raw = m["file"].read_bytes()
        text = raw.decode("utf-8")
        if text.count(m["old"]) != 1:
            print(f"{m['name']}: the gated line is not in the file exactly once; not run")
            survived += 1
            continue
        try:
            m["file"].write_bytes(text.replace(m["old"], m["new"]).encode("utf-8"))
            result = subprocess.run(m["cmd"], cwd=m["cwd"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        finally:
            m["file"].write_bytes(raw)
        killed = result.returncode != 0
        tail = [line.strip() for line in (result.stdout + result.stderr).splitlines()
                if "AssertionError" in line or "FAIL" in line][:2]
        print(f"{m['name']}: {'killed' if killed else 'SURVIVED'} (exit {result.returncode}) {' | '.join(tail)}")
        survived += 0 if killed else 1
    return 1 if survived else 0


if __name__ == "__main__":
    sys.exit(main())
