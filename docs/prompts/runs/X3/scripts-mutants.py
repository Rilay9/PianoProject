"""X3's mutants (Entry 118): each applies one text change to the source, runs the two new unit
files, keeps the capture, and restores the file byte for byte (sha256 checked).

    python docs/prompts/runs/X3/scripts/mutants.py
"""
import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
APP = ROOT / "app"
OUT = ROOT / "docs" / "prompts" / "runs" / "X3" / "red"

MUTANTS = [
    (
        "u72-note-not-derived",
        "app/src/ui/assignSheet.ts",
        "return whoseFact(row.provenance?.facts.hands) === 'yours' ? IMPORT_TEXT.conversionHandsYours : note.hands;",
        "return note.hands;",
    ),
    (
        "swap-not-through-the-store",
        "app/src/ui/importSheet.ts",
        "const saved = await correctImportHands(current.id, can.xml, new Date(), estimateLevelFor);",
        "const saved = { ...current, data: can.xml } as ImportRow;",
    ),
    (
        "library-opens-the-bare-assign-sheet",
        "app/src/ui/screens/LibraryScreen.ts",
        "    await openImportSheetFor(row, {",
        "    await (await import('../assignSheet')).openAssignSheetFor(row, {",
    ),
    (
        "guess-said-as-the-files",
        "app/src/ui/help.ts",
        "if (fact.kind === 'inferred') return 'guess';",
        "if (fact.kind === 'inferred') return 'file';",
    ),
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    summary = []
    for name, rel, old, new in MUTANTS:
        path = ROOT / rel
        before = path.read_bytes()
        digest = sha(path)
        text = before.decode("utf-8")
        if text.count(old) != 1:
            summary.append(f"{name}: the line to mutate was not found exactly once; not run")
            continue
        path.write_bytes(text.replace(old, new).encode("utf-8"))
        try:
            run = subprocess.run(
                "npx vitest run tests/unit/importSheet.test.ts tests/unit/libraryImportWords.test.ts",
                cwd=APP, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True,
            )
            capture = OUT / f"mutant-{name}.txt"
            capture.write_text(run.stdout + run.stderr + f"\nexit {run.returncode}\n", encoding="utf-8")
            failed = [line.strip() for line in (run.stdout + run.stderr).splitlines() if line.strip().startswith("×")]
            summary.append(f"{name}: exit {run.returncode}, {len(failed)} red")
            summary.extend(f"    {line}" for line in failed)
        finally:
            path.write_bytes(before)
            assert sha(path) == digest, f"{rel} not restored"
    (OUT / "mutants-summary.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print("\n".join(summary))


if __name__ == "__main__":
    main()
