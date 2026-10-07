"""
E57's mutants, each a copy of the worktree's `convert.py` with one change, never the file itself: the brief's (a), (b)
and (c), and three on what the lane added beside them. Each copy is run under the tempo-mark unit classes
(scripts-tests-with.py) and, for (a), under the kern rows' end-to-end case (scripts-kern-rows.py); the unchanged copy
is the green control.

    python scripts-mutants.py

(a) today's code restored: every mark after the first removed, wherever it stands.
(b) "same position" read by value, not by offset: every mark at one tempo collapses, wherever it stands (the Waltz's
    opening and closing 264).
(c) the tempo half of the duplicate test dropped: the first mark at a place wins, whatever it says.
(d) the printed-over-sound-only rule dropped: the first copy of a statement kept, whatever it is.
(e) the tolerance widened past X42's (0.2): a genuinely different nearby tempo (68.1 beside 68) collapses.
(f) the E57 relation's table check dropped: an undated relation is named without the table recording its from.
Output: runs/E57/mutants.txt. Exit 0 when the control is green and every mutant is caught.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs" / "E57"
SOURCE = (W / "tools" / "content" / "convert.py").read_text(encoding="utf-8")
MUTANTS = {
    "control": [],
    "a": [("        for mark in duplicate_tempo_marks(out, existing_tempo):\n", "        for mark in existing_tempo[1:]:\n")],
    "b": [("            at = round(float(mark.getOffsetInHierarchy(score)), 6)\n", "            at = 0.0\n")],
    "c": [("        same = next((copies for copies in here if abs(float(copies[0].getQuarterBPM()) - float(bpm)) <= SERIALIZATION_TOLERANCE), None)\n",
           "        same = here[0] if here else None\n")],
    "d": [("            kept = next((mark for mark in copies if mark.number is not None), copies[0])\n", "            kept = copies[0]\n")],
    "e": [("SERIALIZATION_TOLERANCE = 0.01\n", "SERIALIZATION_TOLERANCE = 0.2\n")],
    "f": [('            if not any(entry["file"] == repair["file"] and entry["undated"] == repair["from"] for entry in recorded):\n                continue\n',
           "")],
}


def main() -> int:
    lines: list[str] = []
    ok = True
    for name, edits in MUTANTS.items():
        text = SOURCE.replace("\r\n", "\n")
        for old, new in edits:
            if text.count(old) != 1:
                lines.append(f"{name}: the edit's text is not once in convert.py; not run")
                ok = False
                break
            text = text.replace(old, new, 1)
        else:
            folder = W / "build" / "e57" / "mutants" / name
            folder.mkdir(parents=True, exist_ok=True)
            (folder / "convert.py").write_text(text, encoding="utf-8", newline="\n")
            # The two tables `convert` reads beside itself, as the worktree holds them.
            for table in ("former_identities.json", "repaired_identities.json"):
                (folder / table).write_bytes((W / "tools" / "content" / table).read_bytes())
            classes = ["TestTempoMarks", "TestALaterTempoMarkSurvives"] + [
                f"test_convert_cache.TestRepairedIdentities.{test}" for test in (
                    "test_a_repaired_file_names_the_old_file_it_rebuilds",
                    "test_nothing_is_named_that_does_not_rebuild_or_that_the_table_did_not_record",
                    "test_e57_an_undated_old_file_is_named_by_its_restore_lines_alone")]
            unit = subprocess.run([sys.executable, str(RUNS / "scripts-tests-with.py"), str(folder), *classes],
                                  capture_output=True, text=True, cwd=W)
            failing = sorted({line.split(" (", 1)[0].split(": ", 1)[-1] for line in unit.stdout.splitlines()
                              if line.startswith(("FAIL: ", "ERROR: "))})
            record = f"{name}: unit exit {unit.returncode}; failing {failing or 'none'}"
            if name in ("control", "a"):
                rows = subprocess.run([sys.executable, str(RUNS / "scripts-kern-rows.py"), str(folder), f"mutant-{name}"],
                                      capture_output=True, text=True, cwd=W)
                record += f"; kern rows exit {rows.returncode} ({rows.stdout.strip().splitlines()[-1] if rows.stdout.strip() else rows.stderr[-200:]})"
                caught = unit.returncode != 0 and rows.returncode != 0
            else:
                caught = unit.returncode != 0
            if name == "control":
                ok &= unit.returncode == 0 and "3 of 3" in record
                record += " — green, as it must be" if unit.returncode == 0 else " — RED: the control fails"
            else:
                ok &= caught
                record += " — caught" if caught else " — NOT CAUGHT"
            lines.append(record)
    text = "\n".join(lines) + "\n"
    (RUNS / "mutants.txt").write_text(text, encoding="utf-8")
    print(text)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
