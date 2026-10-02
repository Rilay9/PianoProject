"""G30's rows in docs/08-test-map.md: test_family_contracts.py extended, generatedIdentityContinuity.test.ts listed.

usage: python docs/prompts/runs/G30/scripts-edit_test_map.py
Idempotent: each splice checks its own result first; line endings kept.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "docs" / "08-test-map.md"

FC_OLD = ("identity pinned to each family's version, and a mutation of every promise failing its gate (D0); since D2 a family "
          "marked `heard: true` has a `heard` decision on a current item in the review record, with its adversaries (none, "
          "notation, stale, triage).")
FC_NEW = FC_OLD + (" Since CL15 a family-wide version bump carries each unchanged item's old identity, proven per item by its "
                   "music digest against `generator_continuity.json`, and no changed item's. Since G30 a row prints fingering "
                   "only with a named source (the one held row, `repeated_notes`, named with why); the print step "
                   "(`print_as_contracted`), not the maker's tables, withholds an unsourced convention, shown by reading the row "
                   "as printing; a fingered item of a row that says none stops the build; every item of the 42 rows G30 moved "
                   "carries its identity from before, and a second bump of a CL15 family carries CL15's identities as well, the "
                   "capture that would drop them shown red.")

TS_ANCHOR = "- `formerIdentity.test.ts` — a stored row names the same material after the converter stopped writing a date (E50a)"
TS_NEW = ("- `generatedIdentityContinuity.test.ts` — a family-wide generator version bump keeps an unchanged sibling's learner "
          "history, and only that (CL15; the reviewer's five guards on the built catalogue): an unchanged octave tremolo's or "
          "blues-form pentatonic's old identities resolve to its current row, a CL15-changed sibling's v1 identity never does, "
          "the review identity stays exact and the family unchanged; on a hand-built catalogue a current identity is never read "
          "back as a former one and the learner's key agrees with `sameMaterial`. Since G30, the bump that withdrew 42 families' "
          "unsourced printed fingering: an item of a moved family carries its pre-G30 identity and a run stored against it is "
          "contact, and a run recorded against an octave tremolo's identity before CL15 is contact with the row G30 wrote, "
          "through the store, in one lookup.\n")


HELPER_ANCHOR = "- `test_abc_tools.py` — the ABC preprocessor: inline voices to blocks, fingerings extracted."
HELPER_NEW = ("- `convention.py` — not a test: `convention_printed()`, a generator family's own fingering convention read as "
              "if its row printed it (G30). The tests of a convention a row no longer prints (coordination, position shift, "
              "accompaniment, five-finger, cadence, pedal, inversions, trill, walking bass, walk-up, interval reading's "
              "first finger, in `test_generator.py`, `test_generator_fingering.py`, `test_harmony_families.py` and "
              "`test_generator_invariants.py`) read it inside; what reaches the page is `test_physical_gate`'s and "
              "`test_family_contracts`'.\n")


LC_OLD = ("- `lessonClaimsAboutMusic.test.ts` — the harder half: what a lesson says *about* a piece, read out of the "
          "built `.mxl` rather than off the `notation` summary.")
LC_NEW = LC_OLD + (" Since G30, where a lesson's family no longer prints its unsourced fingering (technique.4's inversions, "
                   "technique.7's thirds, sixths and octaves), the case holds the file to no printed finger and the lesson "
                   "to giving the fingering in words.")


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    if FC_NEW not in text:
        assert text.count(FC_OLD) == 1
        text = text.replace(FC_OLD, FC_NEW)
        print("test_family_contracts.py row extended")
    if "- `generatedIdentityContinuity.test.ts`" not in text:
        assert text.count(TS_ANCHOR) == 1
        text = text.replace(TS_ANCHOR, TS_NEW + TS_ANCHOR)
        print("generatedIdentityContinuity.test.ts row added")
    if LC_NEW not in text:
        assert text.count(LC_OLD) == 1
        text = text.replace(LC_OLD, LC_NEW)
        print("lessonClaimsAboutMusic.test.ts row extended")
    if "- `convention.py` — not a test:" not in text:
        assert text.count(HELPER_ANCHOR) == 1
        text = text.replace(HELPER_ANCHOR, HELPER_NEW + HELPER_ANCHOR)
        print("convention.py row added")
    out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
    if out != raw:
        PATH.write_bytes(out)


if __name__ == "__main__":
    main()
