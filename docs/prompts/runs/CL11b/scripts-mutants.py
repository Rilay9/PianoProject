"""CL11b's mutants: each applied alone, its discriminating test run, the file restored.

Run from the worktree root: python build/cl11b/scripts-mutants.py
Writes build/cl11b/mutants.txt (one line per mutant) and build/cl11b/mutant-<id>.txt (the test's tail).
"""
from __future__ import annotations

import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
APP = ROOT / "app"
OUT = ROOT / "build" / "cl11b"

NPX = "npx.cmd" if sys.platform == "win32" else "npx"

VITEST = lambda *files, name=None: (  # noqa: E731
    [NPX, "vitest", "run", *files] + (["-t", name] if name else []),
    APP,
)
PYTEST = lambda test: ([sys.executable, "-m", "unittest", test], ROOT)  # noqa: E731

MUTANTS = [
    (
        "L58-absent-is-off",
        "names-off met wherever the row does not say the names were on (absence read as proof)",
        "app/src/evidence/evidence.ts",
        "met: (o) => o.keys?.names === false",
        "met: (o) => o.keys?.names !== true",
        VITEST("tests/unit/namesOnIsPractice.test.ts", name="does not record the names"),
    ),
    (
        "L58-standard",
        "names-off left off reading by interval's full standard in skills.json",
        "content/curriculum/vocabulary/skills.json",
        '"opportunity": ["interval.step", "interval.skip", "interval.leap"],\n      "observable": ["pitch"],\n      "standards": { "practice": [], "full": ["unseen", "guide-off", "names-off"] },',
        '"opportunity": ["interval.step", "interval.skip", "interval.leap"],\n      "observable": ["pitch"],\n      "standards": { "practice": [], "full": ["unseen", "guide-off"] },',
        VITEST("tests/unit/namesOnIsPractice.test.ts", name="Name the note I am waiting for"),
    ),
    (
        "L58-stamp",
        "EVIDENCE_DEFINITIONS left at 5: the stored rows are never recomputed",
        "app/src/evidence/evidence.ts",
        "export const EVIDENCE_DEFINITIONS = 6;",
        "export const EVIDENCE_DEFINITIONS = 5;",
        VITEST("tests/unit/namesOnIsPractice.test.ts", name="three learners"),
    ),
    (
        "L57-ladder",
        "the ladder reads the shipped share whatever vocabulary it is handed",
        "app/src/evidence/ladder.ts",
        "const share = supportShareOf(skillId, vocabulary);",
        "const share = supportShareOf(skillId);",
        VITEST("tests/unit/evidenceNumbersInTheVocabulary.test.ts", name="the ladder"),
    ),
    (
        "L57-transfer",
        "supportedAtFull back to its own copy of the share",
        "app/src/evidence/transferPolicy.ts",
        "run.right / run.n >= share;",
        "run.right / run.n >= 0.9;",
        VITEST("tests/unit/evidenceNumbersInTheVocabulary.test.ts", name="the transfer policy"),
    ),
    (
        "L57-readings",
        "the demand readings read the shipped share whatever vocabulary they are handed",
        "app/src/evidence/demandReadings.ts",
        "const support = supportShareOf(skill, vocabulary);",
        "const support = supportShareOf(skill);",
        VITEST("tests/unit/evidenceNumbersInTheVocabulary.test.ts", name="the demand readings"),
    ),
    (
        "L57-reader",
        "the reader's held-back demands read the shipped share whatever vocabulary it is handed",
        "app/src/curriculum/session.ts",
        "heldBack(evidence.slice(-policy.stepUpAfter), current, supportShareOf(READER_SKILL, vocabulary))",
        "heldBack(evidence.slice(-policy.stepUpAfter), current, supportShareOf(READER_SKILL))",
        VITEST("tests/unit/evidenceNumbersInTheVocabulary.test.ts", name="the reader"),
    ),
    (
        "L57-precision",
        "the evidence function reads the shipped precisions whatever vocabulary it is handed",
        "app/src/evidence/evidence.ts",
        "const own = ownPrecisions(vocabulary);",
        "const own = ownPrecisions(VOCABULARY_V0);\n    void own;",
        None,  # filled below: needs an import, so the replacement adds one
    ),
    (
        "L58-gate",
        "validate.py without the guide-off-without-names-off refusal",
        "tools/content/validate.py",
        'if "guide-off" in full and "names-off" not in full:',
        "if False:",
        PYTEST("tools.content.tests.test_evidence_gate.TestTheVocabulary.test_a_full_standard_with_the_guide_off_and_the_names_allowed_is_refused"),
    ),
]


def run_one(ident: str, what: str, path: str, old: str, new: str, command: tuple[list[str], pathlib.Path], extra: list[tuple[str, str]] | None = None) -> str:
    target = ROOT / path
    raw = target.read_bytes()
    text = raw.decode("utf-8")
    crlf = "\r\n" in text
    body = text.replace("\r\n", "\n")
    edits = [(old, new), *(extra or [])]
    for before, _after in edits:
        if body.count(before) != 1:
            return f"{ident}: NOT APPLIED ({body.count(before)} matches of the original) — {what}"
    mutated = body
    for before, after in edits:
        mutated = mutated.replace(before, after)
    target.write_bytes((mutated.replace("\n", "\r\n") if crlf else mutated).encode("utf-8"))
    try:
        args, cwd = command
        done = subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        tail = (done.stdout + done.stderr)[-6000:]
        (OUT / f"mutant-{ident}.txt").write_text(tail.replace(str(ROOT), "<worktree>"), encoding="utf-8")
        verdict = "caught" if done.returncode != 0 else "SURVIVED"
        return f"{ident}: {verdict} (exit {done.returncode}) — {what}"
    finally:
        target.write_bytes(raw)


def main() -> int:
    lines = []
    for ident, what, path, old, new, command in MUTANTS:
        extra = None
        if ident == "L57-precision":
            command = VITEST("tests/unit/evidenceNumbersInTheVocabulary.test.ts", name="rhythm skill")
            new = "const own = ownPrecisions(VOCABULARY_V0);"
            extra = [("import { quartersOf, type Vocabulary } from './vocabulary';", "import { quartersOf, VOCABULARY_V0, type Vocabulary } from './vocabulary';")]
        line = run_one(ident, what, path, old, new, command, extra)
        print(line, flush=True)
        lines.append(line)
    (OUT / "mutants.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return 0 if all(": caught" in line for line in lines) else 1


if __name__ == "__main__":
    sys.exit(main())
