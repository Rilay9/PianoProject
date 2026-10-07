#!/usr/bin/env python3
"""Q47's mutants: each one breaks one rule the new tests hold, and the test must go red.

One text substitution at a time, applied to the working tree, the named test run, the
file's original bytes put back and compared by SHA256 before the next. Controls first:
every test command on the unchanged files must be green. Run from the worktree root:

    python docs/prompts/runs/Q47/mutate_q47.py
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PY = sys.executable
NPX = "npx.cmd" if os.name == "nt" else "npx"

FETCH = "tools/midi-cleanup/tests/fetch_maestro.py"
PARITY = "tools/midi-cleanup/tests/parity_reference.py"
CONVERTER = "tools/midi-cleanup/tests/test_converter.py"
CI = ".github/workflows/ci.yml"
REFERENCE = "build/midi-parity/one-track-two-hands.json"

T_FETCH = [PY, "-m", "unittest", "discover", "-s", "tools/midi-cleanup/tests", "-p", "test_fetch_maestro.py"]
T_PARITY = [PY, "-m", "unittest", "discover", "-s", "tools/midi-cleanup/tests", "-p", "test_parity_reference.py"]
T_GATE = [PY, "-m", "unittest", "discover", "-s", "tools/midi-cleanup/tests", "-p", "test_converter.py", "-k", "Gate"]
T_ORDER = [PY, "-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content", "-p", "test_ci_order.py"]
T_VITEST = [NPX, "vitest", "run", "tests/unit/midiParity.test.ts"]

MUTANTS = [
    ("F1 archive checksum not checked", FETCH,
     "if actual != expected_sha256:", "if False:", T_FETCH),
    ("F2 a member listed twice accepted", FETCH,
     "if len(listed) != 1:", "if len(listed) == 0:", T_FETCH),
    ("F3 the row's composer and year not checked", FETCH,
     '(row["canonical_composer"], row["year"]) != (p.composer, p.year)', "False", T_FETCH),
    ("F4 an empty member not refused as empty", FETCH,
     "if not data:", "if False:", T_FETCH),
    ("F5 a member's bytes not checked", FETCH,
     "if hashlib.sha256(data).hexdigest() != p.sha256:", "if False:", T_FETCH),
    ("F6 a cache hit not validated (falls through to a fetch)", FETCH,
     'if args.cache_hit == "true":', "if False:", T_FETCH),
    ("F7 SOURCE.md not checked for the aliases and members", FETCH,
     'for needed in (f"`{p.alias}`", f"`{MEMBER_ROOT}{p.member}`"):', "for needed in ():", T_FETCH),
    ("F8 a restored file's bytes not checked", FETCH,
     "elif sha256_of(path) != p.sha256:", "elif False:", T_FETCH),
    ("F9 a member absent from the archive not refused", FETCH,
     "present = names.count(member)", "present = 1", T_FETCH),
    ("P1 a fixture expected split accepted without a split", PARITY,
     'if must_split and data["handSplit"] is None:', "if False:", T_PARITY),
    ("P2 a missing recording under CI not a failure", PARITY,
     "failed = bool(missing or refused or (unfetched and in_ci) or not written)",
     "failed = bool(missing or refused or not written)", T_PARITY),
    ("P3 a missing committed fixture not a failure", PARITY,
     "failed = bool(missing or refused or (unfetched and in_ci) or not written)",
     "failed = bool(refused or (unfetched and in_ci) or not written)", T_PARITY),
    ("P4 a refused fixture's earlier reference left in place", PARITY,
     '            (OUT / f"{path.stem}.json").unlink(missing_ok=True)\n', "", T_PARITY),
    ("C1 the real-recording class skips in CI", CONVERTER,
     "            self.fail(real_reason)\n", "            pass\n", T_GATE),
    ("Y1 the fetch step renamed", CI,
     "- name: Fetch the MAESTRO test recordings", "- name: Fetch MAESTRO", T_ORDER),
    ("Y2 the save step gone (a second restore in its place)", CI,
     "uses: actions/cache/save@v4", "uses: actions/cache/restore@v4", T_ORDER),
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> tuple[int, str]:
    cwd = ROOT / "app" if command[0] == NPX else ROOT
    done = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding="utf-8",
                          errors="replace", env={k: v for k, v in os.environ.items() if k != "CI"})
    lines = [line.strip() for line in (done.stdout + done.stderr).splitlines()
             if line.strip().startswith(("Ran ", "OK", "FAILED", "Tests ", "Test Files"))]
    return done.returncode, " | ".join(lines)


def mutate_reference() -> tuple[bytes, bytes]:
    """V1: the one-track reference's split with its first left-hand note given to the right."""
    path = ROOT / REFERENCE
    before = path.read_bytes()
    data = json.loads(before)
    moved = data["handSplit"]["left"].pop(0)
    data["handSplit"]["right"].insert(0, moved)
    return before, json.dumps(data, indent=1).encode("utf-8")


def main() -> int:
    ok = True
    print("controls, on the unchanged files (expect exit 0):")
    for command in (T_FETCH, T_PARITY, T_GATE, T_ORDER, T_VITEST):
        code, summary = run(command)
        print(f"  exit {code}: {' '.join(Path(c).name if c == PY else c for c in command)} -> {summary}")
        ok &= code == 0

    print("mutants (expect exit non-zero):")
    for label, relative, old, new, command in MUTANTS:
        path = ROOT / relative
        original = path.read_bytes()
        text = original.decode("utf-8")
        eol = "\r\n" if "\r\n" in text else "\n"
        old_, new_ = old.replace("\n", eol), new.replace("\n", eol)
        if text.count(old_) != 1:
            print(f"  {label}: the text to replace occurs {text.count(old_)} times; not run")
            ok = False
            continue
        path.write_bytes(text.replace(old_, new_).encode("utf-8"))
        try:
            code, summary = run(command)
        finally:
            path.write_bytes(original)
        restored = hashlib.sha256(original).hexdigest() == sha(path)
        print(f"  {label}: exit {code} -> {summary}; restored byte-identical: {restored}")
        ok &= code != 0 and restored

    before, mutated = mutate_reference()
    path = ROOT / REFERENCE
    path.write_bytes(mutated)
    try:
        code, summary = run(T_VITEST)
    finally:
        path.write_bytes(before)
    restored = hashlib.sha256(before).hexdigest() == sha(path)
    print(f"  V1 the fixture's reference split moved by one note: exit {code} -> {summary}; "
          f"restored byte-identical: {restored}")
    ok &= code != 0 and restored

    print("every control green and every mutant red" if ok else "NOT every control green and every mutant red")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
