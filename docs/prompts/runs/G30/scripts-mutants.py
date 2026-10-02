"""G30's mutants: each built row reverted on its own, the tests that must catch it run, the file restored.

usage: python docs/prompts/runs/G30/scripts-mutants.py <out.txt>
Each mutant rewrites one file, runs its unittest targets from tools/content, records the exit code and the
failing test names, and puts the original bytes back in a `finally`, checked byte for byte. Run alone: the
mutated file is the worktree's own, so nothing else may read it meanwhile.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CONTENT = ROOT / "tools" / "content"
GEN = CONTENT / "generate_exercises.py"
CONTRACTS = CONTENT / "family_contracts.json"
TABLE = CONTENT / "generator_continuity.json"
FCPY = CONTENT / "family_contracts.py"


def json_edit(path: Path, change) -> callable:
    def apply(raw: bytes) -> bytes:
        crlf = b"\r\n" in raw
        data = json.loads(raw.decode("utf-8"))
        change(data)
        text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        return (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
    return apply


def skip_step_in_cadence(raw: bytes) -> bytes:
    text = raw.decode("utf-8")
    start = text.index("def make_cadence(")
    at = text.index("    return print_as_contracted(sc, entry)", start)
    return (text[:at] + "    return sc, entry" + text[at + len("    return print_as_contracted(sc, entry)"):]).encode("utf-8")


def single_identity(raw: bytes) -> bytes:
    text = raw.decode("utf-8")
    old = 'return json.loads(json.dumps([one["identity"], *one.get("formerGeneratorIdentities", [])]))'
    assert text.count(old) == 1
    return text.replace(old, 'return [json.loads(json.dumps(one["identity"]))]').encode("utf-8")


def drop_carried(data: dict) -> None:
    for record in data["families"].values():
        for one in record["items"].values():
            one.pop("formerGeneratorIdentities", None)


def cadence_prints(data: dict) -> None:
    data["families"]["cadence"]["physical"]["fingering"]["printed"] = "printed"


def cadence_version_back(data: dict) -> None:
    data["families"]["cadence"]["version"] -= 1


FC_TESTS = "tests.test_family_contracts"
MUTANTS = [
    ("M1 the print step skipped in one maker (make_cadence returns its fingered score)", GEN, skip_step_in_cadence,
     ["tests.test_physical_gate.TestEveryItemInThePlan"]),
    ("M2 the contract flip reverted for one family (cadence printed again, the step in place)", CONTRACTS,
     json_edit(CONTRACTS, cadence_prints),
     [f"{FC_TESTS}.TestFingeringOnlyWhereSourced", "tests.test_physical_gate.TestEveryItemInThePlan"]),
    ("M3 the version bump reverted for one family (cadence back to 1, its notes and pin unchanged)", CONTRACTS,
     json_edit(CONTRACTS, cadence_version_back),
     [f"{FC_TESTS}.TestIdentity", f"{FC_TESTS}.TestTheWithdrawalKeepsLearnerContinuity"]),
    ("M4 the naive capture (no item's CL15 identities recorded in the table)", TABLE, json_edit(TABLE, drop_carried),
     [f"{FC_TESTS}.TestGeneratedIdentityContinuity", f"{FC_TESTS}.TestTheWithdrawalKeepsLearnerContinuity"]),
    ("M5 the reader ignores the recorded chain (former_generator_identities returns one identity)", FCPY, single_identity,
     [f"{FC_TESTS}.TestGeneratedIdentityContinuity", f"{FC_TESTS}.TestTheWithdrawalKeepsLearnerContinuity"]),
]


def main() -> None:
    lines = []
    for name, path, mutate, targets in MUTANTS:
        original = path.read_bytes()
        try:
            path.write_bytes(mutate(original))
            run = subprocess.run([sys.executable, "-m", "unittest", *targets], cwd=CONTENT, capture_output=True, text=True,
                                 encoding="utf-8", errors="replace")
        finally:
            path.write_bytes(original)
            assert path.read_bytes() == original, f"{path} not restored"
        failing = sorted(set(re.findall(r"^(?:FAIL|ERROR): (\w+)", run.stderr, re.M)))
        summary = next((line for line in run.stderr.splitlines()[::-1] if line.startswith(("FAILED", "OK"))), "?")
        verdict = "caught" if run.returncode != 0 else "NOT CAUGHT"
        lines.append(f"{name}: {verdict} (exit {run.returncode}; {summary}); red: {', '.join(failing) or '-'}")
        print(lines[-1], flush=True)
    Path(sys.argv[1]).write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
