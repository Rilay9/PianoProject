"""
G2's mutants: each replaces one exact text in one source file (refused unless it occurs once), runs
the named unit files, records the exit code (a caught mutant fails them), and puts the file back,
checked by sha256. Run from the repository root; writes docs/prompts/runs/G2/mutants.txt and one
red-mutant-<name>.txt per mutant.
"""
from __future__ import annotations

import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
RUNS = ROOT / "docs" / "prompts" / "runs" / "G2"
POLICY = "app/src/evidence/transferPolicy.ts"
TESTS = [
    "tests/unit/transferPolicy.test.ts",
    "tests/unit/transferFactsOnTheAttempt.test.ts",
    "tests/unit/transferOffer.test.ts",
    "tests/unit/masteryLadder.test.ts",
]

MUTANTS = [
    ("differsOn-read-as-evidence", POLICY,
     "    const measured = relationship.measured.find((fact) => fact.dimension === dimension)?.differs ?? 'unknown';",
     "    const measured = relationship.differsOn.includes(dimension) ? true : (relationship.measured.find((fact) => fact.dimension === dimension)?.differs ?? 'unknown');"),
    ("declared-read-as-evidence", POLICY,
     "    if (measured === true) differs.push(dimension);",
     "    if (measured === true || declared) differs.push(dimension);"),
    ("no-new-seed-rule", POLICY,
     "  if (shownAgain !== undefined) {",
     "  if (shownAgain !== undefined && false) {"),
    ("unknown-first-contact-read-as-first", POLICY,
     "  if (context.firstContact === undefined) return none('unknown', 'first contact not recorded (a row from before G1a)', newDemands);\n"
     "  if (!context.firstContact) return none('not-transfer', 'not first contact: this material was met before (played, heard, seen or a copy of it)', newDemands);",
     "  if (context.firstContact === false) return none('not-transfer', 'not first contact', newDemands);"),
    ("protection-guesses-unknown-contact", POLICY,
     "  return run.context.firstContact === true && (reading.differs.length > 0 || (reading.newDemands?.length ?? 0) > 0);",
     "  return run.context.firstContact !== false && (reading.differs.length > 0 || (reading.newDemands?.length ?? 0) > 0 || reading.verdict === 'unknown');"),
    ("skill-without-block-gets-every-dimension", POLICY,
     "  const dimensions = skill.transfer?.dimensions ?? [];",
     "  const dimensions = skill.transfer?.dimensions ?? (['family', 'source', 'key', 'hands', 'texture', 'rhythm'] as Dimension[]);"),
    ("context-first-contact-from-unseen", "app/src/evidence/evidence.ts",
     "      ...(observation.firstContact === undefined ? {} : { firstContact: observation.firstContact }),",
     "      firstContact: observation.unseen === true,"),
    ("no-relationship-on-ordinary-runs", "app/src/data/progressStore.ts",
     "  const toMeasure = orphaned ? [] : skills.filter((skill) => !relationships.has(skill));",
     "  const toMeasure: string[] = [];"),
    ("offer-reads-runs-alone", "app/src/curriculum/session.ts",
     "  return contactIn(input.rows ?? input.readingRows ?? [], itemId, material, input.contact ?? {});",
     "  return contactIn(input.rows ?? input.readingRows ?? [], itemId, material);"),
    ("established-not-reset-on-demotion", "app/src/evidence/ladder.ts",
     "          establishing = [];\r\n          transferScope = [];",
     "          transferScope = [];"),
]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    lines = []
    caught = 0
    only = set(sys.argv[1:])
    chosen = [m for m in MUTANTS if not only or m[0] in only]
    summary = RUNS / ("mutants.txt" if not only else f"mutants-{'-'.join(sorted(only))}.txt")
    for name, rel, old, new in chosen:
        path = ROOT / rel
        original = path.read_bytes()
        text = original.decode("utf-8")
        if text.count(old) != 1:
            lines.append(f"{name}: anchor occurs {text.count(old)} times in {rel}; not run")
            continue
        path.write_bytes(text.replace(old, new, 1).encode("utf-8"))
        try:
            run = subprocess.run(
                ["npx", "vitest", "run", *TESTS],
                cwd=ROOT / "app",
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=True,
            )
        finally:
            path.write_bytes(original)
        assert sha(path.read_bytes()) == sha(original), f"{rel} not restored"
        (RUNS / f"red-mutant-{name}.txt").write_text(
            f"(cd app) npx vitest run {' '.join(TESTS)}   # mutant {name} in {rel}\n{run.stdout}\n{run.stderr}\nexit={run.returncode}\n",
            encoding="utf-8",
        )
        verdict = "caught" if run.returncode != 0 else "SURVIVED"
        caught += run.returncode != 0
        failed = [l.strip() for l in run.stdout.splitlines() if "Tests " in l and ("failed" in l or "passed" in l)]
        lines.append(f"{name} ({rel}): {verdict}, exit={run.returncode}; {failed[-1] if failed else ''}; restored sha256 {sha(original)}")
    lines.append(f"{caught} of {len(chosen)} caught")
    command = " ".join(["(cd .) python docs/prompts/runs/G2/scripts-mutants.py", *sorted(only)])
    summary.write_text("\n".join([command, *lines, f"exit={0 if caught == len(chosen) else 1}"]) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
