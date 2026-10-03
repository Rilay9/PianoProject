"""The real generator with repeated_notes moved like the other 42: what the build's physical gate says (Hypothesis 2).

usage: python docs/prompts/runs/G30/scripts-repeated_notes_probe.py <scratch-dir> <out.txt>
Flips repeated_notes' row to "none" and routes `make_repeated_notes` through `print_as_contracted`, as
scripts-edit_contracts/scripts-edit_generator do for the 42, then runs `generate_exercises.py`'s own `main`
(the build's generate step: `confirm_physical` on every item before it is written) into a scratch folder,
and puts both files back byte for byte in a `finally`. The step stops at the first item the gate refuses;
the plan-wide count of what it would refuse is scripts-baseline.py's (baseline.txt).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CONTENT = ROOT / "tools" / "content"
GEN = CONTENT / "generate_exercises.py"
CONTRACTS = CONTENT / "family_contracts.json"


def main() -> None:
    scratch = Path(sys.argv[1])
    scratch.mkdir(parents=True, exist_ok=True)
    gen0, con0 = GEN.read_bytes(), CONTRACTS.read_bytes()
    try:
        text = gen0.decode("utf-8")
        start = text.index("def make_repeated_notes(")
        at = text.index("    return sc, entry", start)
        GEN.write_bytes((text[:at] + "    return print_as_contracted(sc, entry)" + text[at + len("    return sc, entry"):]).encode("utf-8"))
        crlf = b"\r\n" in con0
        data = json.loads(con0.decode("utf-8"))
        data["families"]["repeated_notes"]["physical"]["fingering"]["printed"] = "none"
        out = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        CONTRACTS.write_bytes((out.replace("\n", "\r\n") if crlf else out).encode("utf-8"))
        run = subprocess.run([sys.executable, "generate_exercises.py", "--out", str(scratch / "scores"),
                              "--catalog", str(scratch / "catalog.json")], cwd=CONTENT, capture_output=True, text=True,
                             encoding="utf-8", errors="replace")
    finally:
        GEN.write_bytes(gen0)
        CONTRACTS.write_bytes(con0)
        assert GEN.read_bytes() == gen0 and CONTRACTS.read_bytes() == con0
    last = [line for line in run.stderr.splitlines() if line.strip()][-1:] or ["(no stderr)"]
    report = [f"generate_exercises.py exit {run.returncode}", *(line[:600] for line in last)]
    Path(sys.argv[2]).write_text("\n".join(report) + "\n", encoding="utf-8")
    print("\n".join(report))


if __name__ == "__main__":
    main()
