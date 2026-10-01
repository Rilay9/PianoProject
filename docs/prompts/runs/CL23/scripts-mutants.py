"""CL23 mutants: apply one source edit, run the targeted unit file, restore the bytes, record what failed.

Each mutant names the file, the exact text it replaces (asserted to occur once), the replacement, the
test files run, and the test titles expected to fail. Run from anywhere; paths are relative to this
worktree. The source file is restored from its original bytes in a `finally`, and the script checks
the restore before moving on.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
APP = ROOT / "app"
DB = "src/data/db.ts"
STORE = "src/data/progressStore.ts"
BACKUP = "src/data/backup.ts"
REACH = "tests/unit/performanceReach.test.ts"
BACKUP_T = "tests/unit/backup.test.ts"
RETENTION = "tests/unit/sessionRetention.test.ts"

MUTANTS = [
    # A fresh database still gets the index at 9: the upgrade's blocks are keyed on the old version.
    ("M1a DB_VERSION back to 9", DB, "export const DB_VERSION = 10;", "export const DB_VERSION = 9;", [REACH], ["a version-9 database opens at version 10"]),
    ("M1b the upgrade's backfill dropped", DB, "if (marked !== row) await cursor.update(marked);", "void marked;", [REACH], ["a version-9 database opens at version 10"]),
    ("M16 the index keyed on the boolean itself", DB, "createIndex('byPerformance', ['performanceMark', 'at'])", "createIndex('byPerformance', ['performance', 'at'])", [REACH], ["a version-9 database opens at version 10", "finds a performance with more runs after it"]),
    (
        "M2 recentPerformances back to scan-and-stop",
        STORE,
        "    let cursor = await db.transaction('sessions').store.index('byPerformance').openCursor(null, 'prev');\n    while (cursor && out.length < limit) {\n      if (cursor.value.performance === true) out.push(cursor.value);\n      cursor = await cursor.continue();\n    }",
        "    let scanned = 0;\n    let cursor = await db.transaction('sessions').store.index('byDate').openCursor(null, 'prev');\n    while (cursor && out.length < limit && scanned < 2_200) {\n      if (cursor.value.performance === true) out.push(cursor.value);\n      scanned += 1;\n      cursor = await cursor.continue();\n    }",
        [REACH, BACKUP_T],
        ["finds a performance with more runs after it", "a version-9 database opens at version 10", "is listed after a replace restore", "is listed after a merge restore"],
    ),
    ("M3 importAll's sessions branch not marked", BACKUP, "const session = withPerformanceMark({ ...(row as SessionRow) }) as unknown as Record<string, unknown>;", "const session = { ...(row as SessionRow) } as unknown as Record<string, unknown>; void withPerformanceMark;", [BACKUP_T], ["is listed after a replace restore", "is listed after a merge restore"]),
    ("M4 compactObservation's evidence fold reverted", STORE, "if (!Array.isArray(evidence) || outside.size === 0) return evidence;", "if (!Array.isArray(evidence) || outside.size >= 0) return evidence;", [RETENTION], ["folds a compacted sight-read", "folds a measured record proven outside"]),
    ("M5 the fold takes n and right too", STORE, "({ demand, n, right }) => ({ demand, n, right, steps: [], wrong: [] })", "({ demand }) => ({ demand, n: 0, right: 0, steps: [], wrong: [] })", [RETENTION], ["leaves what heldBack and playedDemands read"]),
    ("M6 the reach guarded by age", STORE, "const outside = await reachOf(row, cursor.primaryKey);", "const outside = new Set(measuredIndexes(row)); void reachOf;", [RETENTION], ["six reads"]),
    ("M7 the pooled window across items", STORE, "let above = await byItem.openCursor(IDBKeyRange.only(row.itemId), 'prev');", "let above = await tx.store.openCursor(null, 'prev'); void byItem;", [RETENTION], ["two items"]),
    ("M8 the stamp not matched", STORE, "one.skill === skill && one.stamp === row.evidenceDefinitions && ", "one.skill === skill && ", [RETENTION], ["another evidence stamp"]),
    ("M9 the item's own pass after a run removed", STORE, "      if (itemId !== undefined) await foldEvidenceOfItem(itemId, now);\n", "      void itemId;\n", [RETENTION], ["a new run of the item folds"]),
    ("M10 a row holding positions counted as compact in the item's pass", STORE, "          settled = 0;\n          // A row past the edge with its steps is", "          settled = row.steps ? 0 : settled + 1;\n          // A row past the edge with its steps is", [RETENTION], ["a new run of the item folds"]),
    ("M11 a tie counted as newer", STORE, "one.at.localeCompare(row.at) > 0", "one.at.localeCompare(row.at) >= 0", [RETENTION], ["tied with the candidate"]),
    ("M12 a read dated after the day counted", STORE, "  if (!(Date.parse(row.at) <= now)) return [];\n", "  void now;\n", [RETENTION], ["dated after the compaction"]),
    ("M13 a newer read under a lower key counted", STORE, "      while (above && above.primaryKey > key) {\n        newer.push(...newerOf(above.value, day));", "      while (above) {\n        if (above.primaryKey !== key) newer.push(...newerOf(above.value, day));", [RETENTION], ["under a lower key"]),
    ("M14 a record that is not measured counted", STORE, "  return measuredIndexes(row).map((index) => ({ skill: (evidence[index] as MeasuredEvidence).skill,", "  return evidence.map((_one, index) => index).map((index) => ({ skill: (evidence[index] as MeasuredEvidence).skill,", [RETENTION], ["not measured toward the five"]),
    ("M15 the copied window drifts", STORE, "export const PROTECTED_READS = 5;", "export const PROTECTED_READS = 4;", [RETENTION], ["copies the reader"]),
]


def run(files):
    proc = subprocess.run(
        "npx vitest run " + " ".join(files) + " --reporter=verbose",
        cwd=APP,
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = proc.stdout + proc.stderr
    failed = [re.sub(r"\s+\d+ms$", "", line.strip()[2:]).strip() for line in out.splitlines() if line.strip().startswith("×")]
    return proc.returncode, failed, out


def main():
    only = set(sys.argv[1:])
    report = []
    ok = True
    for name, rel, old, new, files, expected in MUTANTS:
        if only and name.split()[0] not in only:
            continue
        path = APP / rel
        original = path.read_bytes()
        text = original.decode("utf-8")
        # The working tree is CRLF here (core.autocrlf); the patterns are written with LF.
        if "\r\n" in text:
            old = old.replace("\n", "\r\n")
            new = new.replace("\n", "\r\n")
        count = text.count(old)
        if count != 1:
            report.append(f"{name}: SKIPPED, the text to replace occurs {count} times in {rel}")
            ok = False
            continue
        try:
            path.write_bytes(text.replace(old, new).encode("utf-8"))
            code, failed, out = run(files)
        finally:
            path.write_bytes(original)
        assert path.read_bytes() == original, f"{rel} was not restored"
        missing = [want for want in expected if not any(want in title for title in failed)]
        verdict = "KILLED" if code != 0 and not missing else "SURVIVED" if code == 0 else "KILLED, but not by every expected case"
        if verdict != "KILLED":
            ok = False
        report.append(f"{name} [{rel}] -> exit {code}, {verdict}")
        for title in failed:
            report.append(f"    x {title}")
        for want in missing:
            report.append(f"    expected and not seen failing: {want}")
    print("\n".join(report))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
