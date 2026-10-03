"""
G1c: the two comments that described the old seed ("technique.8's exercise (its one)") say what the
seed now does. Idempotent. Run from the repository root.
"""
from pathlib import Path

EDITS = {
    "app/tests/e2e/plan.spec.ts": (
        "    // A clean Keep tempo run of each option named, judged by its rung: classical.9's exercise and\n"
        "    // song (both its requirements), technique.8's exercise (its one). Read from the built curriculum,\n"
        "    // so the case follows the options wherever the curriculum moves them.\n",
        "    // Clean Keep tempo runs, each judged by its rung: classical.9's and technique.8's, as many as each\n"
        "    // of their requirements counts. Read from the built curriculum, so the case follows the options\n"
        "    // and the counts wherever the curriculum moves them.\n",
    ),
    "docs/prompts/runs/G1c/scripts-zz-g1c-pictures.spec.ts": (
        " * the evidence meeting classical.9 (its two runs, judged by it) and technique.8 (its one), as the\n"
        " * browser case seeds it.",
        " * the evidence meeting classical.9 and technique.8 (as many runs as each requirement counts, judged\n"
        " * by the rung), as the browser case seeds it.",
    ),
}

for path, (old, new) in EDITS.items():
    p = Path(path)
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    if new in text:
        print(f"{path}: already")
        continue
    assert text.count(old) == 1, path
    text = text.replace(old, new)
    p.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    print(f"{path}: done")
