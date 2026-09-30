"""G96a's mutants: each edits app/src/ui/screens/LibraryScreen.ts in place, runs the G96a unit cases,
records the result, and puts the file back byte for byte (checked) whatever happens.

1  the old wording restored, both statements: *Type* reads `item.type` and a PDF's estimated level says
   the app guessed it from the music itself (the committed code's two lines).
1a the old level sentence restored for a PDF only.
1b the old type restored only.
2  the over-broad fix: every estimated level says the neutral sentence, a MusicXML import whose level the
   estimator read from its notes included.

Writes docs/prompts/runs/G96a/mutants.txt (a summary per mutant: the vitest tally and the failing names).
"""
import pathlib
import re
import subprocess
import sys

W = pathlib.Path(__file__).resolve().parents[4]
SRC = W / "app" / "src" / "ui" / "screens" / "LibraryScreen.ts"
OUT = W / "docs" / "prompts" / "runs" / "G96a" / "mutants.txt"

TYPE_NEW = "['Type', item.kind === 'pdf' ? 'PDF' : item.type],"
TYPE_OLD = "['Type', item.type],"
PDF_NEW = "? 'Estimated level — change it if it feels wrong.'"
PDF_OLD = "? 'The app guessed this level from the music itself — change it if it feels wrong.'"
REST_NEW = ": 'The app guessed this level from the music itself — change it if it feels wrong.',"
REST_BROAD = ": 'Estimated level — change it if it feels wrong.',"

MUTANTS = {
    "1": [(TYPE_NEW, TYPE_OLD), (PDF_NEW, PDF_OLD)],
    "1a": [(PDF_NEW, PDF_OLD)],
    "1b": [(TYPE_NEW, TYPE_OLD)],
    "2": [(REST_NEW, REST_BROAD)],
}


def run_cases() -> str:
    npx = "npx.cmd" if sys.platform == "win32" else "npx"
    done = subprocess.run(
        [npx, "vitest", "run", "tests/unit/libraryImportWords.test.ts", "-t", "G96a"],
        cwd=W / "app",
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    text = re.sub(r"\x1b\[[0-9;]*m", "", done.stdout + done.stderr)
    tally = [line.strip() for line in text.splitlines() if line.strip().startswith("Tests ")]
    failing = [line.strip() for line in text.splitlines() if line.strip().startswith("×")]
    return f"exit={done.returncode}; {' '.join(tally)}\n" + "".join(f"    {name}\n" for name in failing)


def main() -> int:
    original = SRC.read_bytes()
    report = []
    try:
        for name, edits in MUTANTS.items():
            text = original.decode("utf-8")
            for old, new in edits:
                if text.count(old) != 1:
                    raise SystemExit(f"mutant {name}: {old!r} found {text.count(old)} times, expected once")
                text = text.replace(old, new)
            SRC.write_bytes(text.encode("utf-8"))
            report.append(f"mutant {name}: {run_cases()}")
            SRC.write_bytes(original)
    finally:
        SRC.write_bytes(original)
    assert SRC.read_bytes() == original, "LibraryScreen.ts was not restored"
    report.append("LibraryScreen.ts restored byte for byte: yes\n")
    OUT.write_text("".join(report), encoding="utf-8")
    print("".join(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
