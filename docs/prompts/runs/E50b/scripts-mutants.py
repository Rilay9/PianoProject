"""
E50b (Entry 181): the mutants. Each changes one line of the implementation (or the table), runs the discriminating
tests, records whether they went red and which, and restores the file byte for byte (checked by sha256). A control run
first, green. Output: runs/E50b/mutants.txt. Never run while a content build is running (it reads these files).

    python scripts-mutants.py
"""
from __future__ import annotations

import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
LOG = W / "docs" / "prompts" / "runs" / "E50b" / "mutants.txt"
APP = W / "app"
NPX = "npx.cmd" if os.name == "nt" else "npx"
PY = [sys.executable, "-m", "unittest"]
PY_CUT = PY + ["tools.content.tests.test_excerpts.TheRepairedCut"]
APP_LINEAGE = [NPX, "vitest", "run", "tests/unit/repairedTempoLineage.test.ts"]

MUTANTS = [
    {
        "name": "M1 the guard removed: meetsStandard reads the old percentage as if its denominator were the repaired tempo",
        "file": "app/src/evidence/rungState.ts",
        "old": "    if (tempoNotComparable(row)) return criteria.passTempoPct <= 0;\n",
        "new": "",
        "run": ("app", APP_LINEAGE),
    },
    {
        "name": "M2 the relation dropped: the table's cut relation removed",
        "file": "tools/content/repaired_identities.json",
        "regex": r',\n  "cuts": \[\n.*?\n  \]',
        "new": "",
        "run": ("repo", PY_CUT),
    },
    {
        "name": "M2b the relation dropped at the build: former_cut_identities names nothing",
        "file": "tools/content/excerpts.py",
        "old": "    relations = [one for one in (repaired_cuts() if cuts is None else cuts) if one.get(\"id\") == entry_id]\n",
        "new": "    relations = []\n",
        "run": ("repo", PY_CUT),
    },
    {
        "name": "M3 the guard keyed on the row alone: a run of the repaired file itself refused too",
        "file": "app/src/curriculum/material.ts",
        "old": "  return !knownMaterial(material) || typeof base !== 'object' || base.source !== 'written';\n",
        "new": "  return true;\n",
        "run": ("app", APP_LINEAGE),
    },
    {
        "name": "M4 the cut's relation without the parent repair's re-proof",
        "file": "tools/content/excerpts.py",
        "old": "        if len(parent_repairs) != 1 or relation[\"parentFrom\"] not in former_identities(parent_path, table, repairs):\n",
        "new": "        if len(parent_repairs) != 1:\n",
        "run": ("repo", PY_CUT),
    },
    {
        "name": "M5 a repaired row's run with no material or no written base read as comparable (only a named old file refused)",
        "file": "app/src/curriculum/material.ts",
        "old": "  return !knownMaterial(material) || typeof base !== 'object' || base.source !== 'written';\n",
        "new": "  return false;\n",
        "run": ("app", APP_LINEAGE),
    },
]


def run(where: str, command: list[str]) -> tuple[int, str]:
    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    done = subprocess.run(command, cwd=APP if where == "app" else W, capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)
    return done.returncode, done.stdout + done.stderr


def failing(output: str) -> list[str]:
    names = re.findall(r"^(?:FAIL|ERROR): (test_\w+)", output, re.M)
    names += [m.strip() for m in re.findall(r"^\s+[×✗] (.+?)(?: \d+ms)?$", output, re.M)]
    return sorted(set(names))


def main() -> int:
    lines: list[str] = []
    for where, command in (("repo", PY_CUT), ("app", APP_LINEAGE)):
        code, output = run(where, command)
        lines.append(f"control {' '.join(command[-2:])}: exit {code}")
        if code != 0:
            LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
            raise SystemExit("the control is not green")
    killed = 0
    for mutant in MUTANTS:
        path = W / mutant["file"]
        original = path.read_bytes()
        text = original.decode("utf-8")
        if "regex" in mutant:
            mutated, count = re.subn(mutant["regex"], mutant["new"], text, count=1, flags=re.S)
        else:
            # The checkout writes CRLF (core.autocrlf): the line is matched in the file's own line endings.
            eol = "\r\n" if "\r\n" in text else "\n"
            old, new = mutant["old"].replace("\n", eol), mutant["new"].replace("\n", eol)
            count = text.count(old)
            mutated = text.replace(old, new, 1)
        if count != 1:
            lines.append(f"{mutant['name']}: NOT APPLIED (the line occurs {count} times)")
            continue
        try:
            path.write_bytes(mutated.encode("utf-8"))
            code, output = run(*mutant["run"])
        finally:
            path.write_bytes(original)
        restored = hashlib.sha256(path.read_bytes()).hexdigest() == hashlib.sha256(original).hexdigest()
        names = failing(output)
        killed += code != 0
        lines.append(f"{mutant['name']} ({mutant['file']}): exit {code}, {'KILLED' if code != 0 else 'SURVIVED'}; restored byte for byte: {restored}")
        lines.extend(f"   red: {name}" for name in names)
    lines.append(f"{killed} of {len(MUTANTS)} killed")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0 if killed == len(MUTANTS) else 1


if __name__ == "__main__":
    sys.exit(main())
