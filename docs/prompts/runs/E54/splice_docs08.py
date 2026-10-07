"""
E54's docs/08 rows (Entry 174), spliced as text from the repository root; idempotent, each edit checks its own marker:

    python docs/prompts/runs/E54/splice_docs08.py
"""
from pathlib import Path

path = Path("docs/08-test-map.md")
raw = path.read_bytes().decode("utf-8")
edits = [
    # The excerpt row, the "breaks it" column.
    ("the attribution lost with the header |",
     "the attribution lost with the header; a rejection of a current approval kept beside it, so the build "
     "goes on cutting a range a person rejected (E54) |",
     "a range a person rejected (E54)"),
    # The excerpt row, the tests column, after test_excerpts.py's merge clause.
    ("the merge idempotent, refusing a range twice and a malformed line)",
     "the merge idempotent, refusing a range twice and a malformed line; since E54 (`TheWithdrawal`), a rejection "
     "of the current approval withdraws it, the approval kept whole in `superseded` and the rejection in `rejected`, "
     "a rerun appending nothing, a later approval a new decision that the withdrawn approval's export never "
     "overturns, line order within one export the order of decision, and the command's line naming the withdrawal)",
     "since E54 (`TheWithdrawal`)"),
    # The excerpt row, the status column.
    ("boundaries by rule and unheard; unverified as music |",
     "boundaries by rule and unheard; unverified as music; E54 (Entry 174): a rejection withdraws a current "
     "approval as well as a stale one; none of the five re-decided |",
     "E54 (Entry 174): a rejection withdraws"),
    # The test_excerpts.py line of the file list.
    ("the row's concepts the targets' where the vocabulary names them once (the left-hand pattern names none).",
     "the row's concepts the targets' where the vocabulary names them once (the left-hand pattern names none). "
     "Since E54, `TheWithdrawal` tests the withdrawal of a current approval: a rejection of it moves it whole to "
     "`superseded` with the rejection as the event that replaced it, the rejection kept in `rejected` with its "
     "reason, and a rerun appends nothing; a later approval is a new decision, and the withdrawn approval's export "
     "merged again never revives it; within one export, line order is the order of decision; the command's line "
     "names the withdrawal.",
     "`TheWithdrawal` tests the withdrawal"),
]
for old, new, marker in edits:
    if marker in raw:
        print(f"already applied: {marker}")
        continue
    assert raw.count(old) == 1, (old, raw.count(old))
    raw = raw.replace(old, new, 1)
    print(f"applied: {marker}")
path.write_bytes(raw.encode("utf-8"))
