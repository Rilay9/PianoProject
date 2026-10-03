"""CL15's mutants on the app side: each swaps one file for a mutant copy, runs the named Vitest file, and
puts the file back byte for byte (checked by sha256), whatever the run did.

usage: python build/cl15/app_mutants.py
Run only while no content build or other Vitest run is using app/.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
NPX = "npx.cmd"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def vitest(test: str) -> tuple[int, str]:
    run = subprocess.run([NPX, "vitest", "run", test], cwd=APP, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = run.stdout + run.stderr
    summary = [line.strip() for line in out.splitlines() if re.search(r"Tests\s+\d|×", line)]
    return run.returncode, "\n    ".join(summary[:12])


def with_mutant(path: Path, mutate) -> tuple[int, str]:
    original = path.read_bytes()
    before = sha(path)
    try:
        raw = original.decode("utf-8")
        crlf = "\r\n" in raw
        text = raw.replace("\r\n", "\n")
        mutated = mutate(text)
        assert mutated != text, f"the mutant changed nothing in {path.name}"
        path.write_bytes((mutated.replace("\n", "\r\n") if crlf else mutated).encode("utf-8"))
        return MUTANT_TEST[0]()
    finally:
        path.write_bytes(original)
        assert sha(path) == before, f"{path} was not restored"


MUTANT_TEST: list = [None]


def run_case(name: str, path: Path, mutate, test: str) -> bool:
    MUTANT_TEST[0] = lambda: vitest(test)
    code, summary = with_mutant(path, mutate)
    caught = code != 0
    print(f"{name}: exit {code} -> {'CAUGHT' if caught else 'MISSED'}\n    {summary}")
    return caught


def clef_fallback(text: str) -> str:
    """U68's forbidden path: a lone staff whose file writes the bass clef is read as the left hand."""
    old = "        const hand: 'R' | 'L' = home === 2 ? 'L' : 'R';"
    new = ("        const loneBass = !/<staves>\\s*[2-9]/.test(options.musicXml) && /<sign>F<\\/sign>/.test(options.musicXml);\n"
           "        const hand: 'R' | 'L' = home === 2 || loneBass ? 'L' : 'R';")
    assert text.count(old) == 1
    return text.replace(old, new)


def reader_not_widened(text: str) -> str:
    """The generator branch of learnerMaterial removed: a former generator identity resolves to nothing."""
    old = "  if (material?.kind === 'generator') return currentOfFormerGenerator.get(generatorKey(material)) ?? material;\n"
    assert text.count(old) == 1
    return text.replace(old, "")


def catalogue(mutate_rows):
    def mutate(text: str) -> str:
        rows = json.loads(text)
        mutate_rows(rows)
        return json.dumps(rows)
    return mutate


def stamp_changed_too(rows: list[dict]) -> None:
    """Guard 3's mutant: the changed third tremolos carry their v1 identity as if unchanged."""
    for row in rows:
        if row["id"].startswith("exercise.tremolo-third."):
            identity = row["provenance"]["identity"]
            row["provenance"]["formerGeneratorIdentities"] = [{**identity, "version": 1}]


def old_identity_current(rows: list[dict]) -> None:
    """Guard 4's mutant: the octave tremolos' current identity written as the old one."""
    for row in rows:
        if row["id"].startswith("exercise.tremolo."):
            row["provenance"]["identity"] = {**row["provenance"]["identity"], "version": 1}
            row["drill"]["generator"]["version"] = 1


def family_split(rows: list[dict]) -> None:
    """Guard 5's mutant: the bumped octave rows moved to a split family, as a mechanical split would."""
    for row in rows:
        if row["id"].startswith("exercise.tremolo."):
            row["provenance"]["identity"] = {**row["provenance"]["identity"], "family": "tremolo_octaves_v2"}


def no_stamp(rows: list[dict]) -> None:
    """Guards 1 and 2's mutant: the build writes no former generator identity."""
    for row in rows:
        (row.get("provenance") or {}).pop("formerGeneratorIdentities", None)


def main() -> None:
    extractor = APP / "src" / "score" / "extractScoreModel.ts"
    material = APP / "src" / "curriculum" / "material.ts"
    built = APP / "public" / "content" / "catalog.json"
    continuity = "tests/unit/generatedIdentityContinuity.test.ts"
    print("control:")
    for test in ("tests/unit/oneStaffHand.test.ts", continuity):
        code, summary = vitest(test)
        print(f"  {test}: exit {code}\n    {summary}")
    cases = [
        ("U68-clef-fallback", extractor, clef_fallback, "tests/unit/oneStaffHand.test.ts"),
        ("9-reader-not-widened", material, reader_not_widened, continuity),
        ("9-no-stamp (guards 1, 2)", built, catalogue(no_stamp), continuity),
        ("9-changed-stamped (guard 3)", built, catalogue(stamp_changed_too), continuity),
        ("9-old-identity-current (guard 4)", built, catalogue(old_identity_current), continuity),
        ("9-family-split (guard 5)", built, catalogue(family_split), continuity),
    ]
    caught = sum(run_case(*case) for case in cases)
    print(f"{caught} of {len(cases)} caught")


if __name__ == "__main__":
    main()
