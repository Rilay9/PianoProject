#!/usr/bin/env python3
"""Are the three files the fetch wrote the bytes the harness was built against?

Compares this worktree's `build/midi-real/` (written by `fetch_maestro.py`) with the main
checkout's copies from 2026-09-21, read only, and with the SHA256 the fetch pins. Run from
the worktree root:

    python docs/prompts/runs/Q47/compare_with_main_checkout.py
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MAIN = Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject") / "build" / "midi-real"
sys.path.insert(0, str(ROOT / "tools" / "midi-cleanup" / "tests"))

from fetch_maestro import DEFAULT_OUT, PERFORMANCES  # noqa: E402

same = True
for p in PERFORMANCES:
    ours = (DEFAULT_OUT / p.alias).read_bytes()
    theirs = (MAIN / p.alias).read_bytes()
    digest = hashlib.sha256(ours).hexdigest()
    print(f"{p.alias}: identical to the main checkout's: {ours == theirs}; "
          f"SHA256 {digest}; the pinned one: {digest == p.sha256}")
    same &= ours == theirs and digest == p.sha256
sys.exit(0 if same else 1)
