"""
E50's mutants: each a one-place edit of the changed code, the test that must catch it run alone, the file restored byte
for byte afterwards (from the bytes read before the edit, and checked). A green control of each named test first.
Output: runs/E50/mutants.txt. Exit 1 when a mutant survives or a control is red.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
CONTENT = W / "tools" / "content"
APP = W / "app"
LOG = W / "docs" / "prompts" / "runs" / "E50" / "mutants.txt"

PY = [sys.executable, "-m", "unittest"]
NPX = "npx.cmd" if sys.platform == "win32" else "npx"
VITEST = [NPX, "vitest", "run", "tests/unit/repairedTempoLineage.test.ts"]

MUTANTS = [
    ("M1 the metre gate lets 6/8 through (a missing glyph read as a quarter in x/8)",
     CONTENT / "convert.py", 'beat = {4: 1.0, 2: 2.0}.get(signature.denominator)', 'beat = {4: 1.0, 2: 2.0, 8: 1.0}.get(signature.denominator)',
     CONTENT, PY + ["tests.test_convert.TestTheTempoPrintedAsText.test_d_a_missing_glyph_in_a_compound_metre_is_not_read"]),
    ("M2 the glyph map dropped (SMuFL's metronome glyphs read as they are)",
     CONTENT / "convert.py", 'text = "".join(METRONOME_GLYPHS.get(char, char) for char in', 'text = "".join(char for char in',
     CONTENT, PY + ["tests.test_convert.TestTheTempoPrintedAsText.test_b_a_quarter_glyph",
                    "tests.test_convert.TestTheTempoPrintedAsText.test_b_an_eighth_glyph_sounds_at_half_its_number",
                    "tests.test_convert.TestTheTempoPrintedAsText.test_b_a_dotted_quarter_glyph"]),
    ("M3 the printed words left in place beside the mark",
     CONTENT / "convert.py", "                copy[2].activeSite.remove(copy[2])", "                pass",
     CONTENT, PY + ["tests.test_convert.TestTheTempoPrintedAsText.test_a_the_wabash_shape_reads_as_a_quarter_the_metres_beat"]),
    ("M4 a repair named without rebuilding the old file (the restore lines never checked)",
     CONTENT / "convert.py", 'if rebuilt is not None and hashlib.sha256(rebuilt).hexdigest() == repair["from"] and repair["from"] not in out:',
     'if repair["from"] not in out:',
     CONTENT, PY + ["tests.test_convert_cache.TestRepairedIdentities.test_nothing_is_named_that_does_not_rebuild_or_that_the_table_did_not_record"]),
    ("M5 a repair named whether or not E50a's table recorded its old identity",
     CONTENT / "convert.py", '                   and entry["system"] == repair["system"] for entry in recorded):',
     '                   and entry["system"] == repair["system"] for entry in recorded) and False:',
     CONTENT, PY + ["tests.test_convert_cache.TestRepairedIdentities.test_nothing_is_named_that_does_not_rebuild_or_that_the_table_did_not_record"]),
    ("M6 a rung's pool routed through the relation (a run of a former identity counted for the rung)",
     APP / "src" / "evidence" / "rungState.ts", "        if (!pool.has(row.itemId)) continue;",
     "        if (!pool.has(row.itemId) && !(row.material?.kind === 'file' && learnerMaterial(row.material) !== row.material)) continue;",
     APP, VITEST),
]
#: M6 needs the resolution imported where the rung is read.
M6_IMPORT = ("import type { Vocabulary } from './vocabulary';",
             "import type { Vocabulary } from './vocabulary';\nimport { learnerMaterial } from '../curriculum/material';")


def run(cwd: Path, command: list[str]) -> tuple[int, str]:
    done = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                          env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"})
    tail = [line for line in (done.stdout + done.stderr).splitlines()
            if line.startswith(("FAIL", "ERROR", "OK", "Ran ", "AssertionError")) or "Tests " in line or "✓" in line or "×" in line or "FAIL" in line]
    return done.returncode, " | ".join(tail[-6:])


def main() -> int:
    lines: list[str] = []
    bad = 0
    for name, path, old, new, cwd, command in MUTANTS:
        original = path.read_bytes()
        text = original.decode("utf-8")
        control, control_tail = run(cwd, command)
        lines.append(f"{name}\n   test: {' '.join(command[3:] if command[0] == sys.executable else command[1:])}\n   control: exit {control} ({control_tail})")
        if control != 0:
            bad += 1
            lines.append("   CONTROL RED: the mutant is not judged")
            continue
        if text.count(old) != 1:
            bad += 1
            lines.append(f"   NOT APPLIED: the edit's text occurs {text.count(old)} times")
            continue
        mutated = text.replace(old, new, 1)
        if path.name == "rungState.ts":
            if M6_IMPORT[0] not in mutated:
                raise SystemExit("M6's import line is not where it was")
            mutated = mutated.replace(M6_IMPORT[0], M6_IMPORT[1], 1)
        try:
            path.write_bytes(mutated.encode("utf-8"))
            code, tail = run(cwd, command)
        finally:
            path.write_bytes(original)
        assert path.read_bytes() == original
        killed = code != 0
        bad += not killed
        lines.append(f"   mutant: exit {code} — {'KILLED' if killed else 'SURVIVED'} ({tail})\n   restored byte for byte: True")
    lines.append(f"{len(MUTANTS) - bad} of {len(MUTANTS)} killed against green controls" if bad == 0 else f"{bad} problem(s)")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
