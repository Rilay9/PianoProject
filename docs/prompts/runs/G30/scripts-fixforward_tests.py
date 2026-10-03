"""G30's fix-forward tests (docs/review/responses/09ec1337.md §3): repeated_notes moves like the other 42.

usage: python docs/prompts/runs/G30/scripts-fixforward_tests.py
- tools/content/tests/test_family_contracts.py: no row is held any more; the held-row case is replaced by the
  discriminating proof (the four-to-a-note items pass the gate by the declared solution, with no printed finger,
  the threshold untouched, the declaration this drill's alone); the counts 42 -> 43.
- app/tests/unit/lessonClaimsAboutMusic.test.ts: technique.5's case, replaced (the old assumption: the files print
  3-2-1 / 4-3-2-1 and the lesson says so).
- app/tests/unit/generatedIdentityContinuity.test.ts: repeated_notes joins the moved families read off the catalogue.
Idempotent splices; line endings kept.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
FC_TEST = ROOT / "tools" / "content" / "tests" / "test_family_contracts.py"
LC_TEST = ROOT / "app" / "tests" / "unit" / "lessonClaimsAboutMusic.test.ts"
TS_TEST = ROOT / "app" / "tests" / "unit" / "generatedIdentityContinuity.test.ts"

EDITS = {
    FC_TEST: [
        ("""- **G30**: a row prints fingering only with a named source (the one held row named, with why); the
  print step, not the maker's tables, withholds an unsourced convention; and the bump that withdrew it
  carries every item of the 42 families, a second bump of a CL15 family carrying CL15's identities too.""",
         """- **G30**: a row prints fingering only with a named source; the print step, not the maker's tables,
  withholds an unsourced convention; the repeated-note drill passes the physical gate by the solution its
  row declares, with no printed finger and the threshold untouched; and the bump that withdrew it carries
  every item of the 43 families, a second bump of a CL15 family carrying CL15's identities too."""),
        ("""#: Rows that still print a convention no source gives, each with why. Held, not decided: removing the
#: change of finger fails the physical gate on the four-to-a-note items (Entry 211's open question).
HELD_UNSOURCED = {"repeated_notes": "the printed change of finger is what passes the repeated-note check at 0.25 s"}""",
         """#: Rows that still print a convention no source gives, each with why. None since the review's required
#: change (`responses/09ec1337.md` §3): repeated_notes, held by Entry 211, declares its drill's solution instead.
HELD_UNSOURCED: dict[str, str] = {}
#: The rows that declare a solution for a fast repeated note: each one's drill, never a rule for every family.
DECLARES_REPEATED_NOTES = {"rhythm", "repeated_notes"}"""),
        ("""        families = g30_families()
        self.assertEqual(len(families), 42)
        for family in families:""",
         """        families = g30_families()
        self.assertEqual(len(families), 43)
        for family in families:"""),
        ("""    def test_the_held_row_still_prints_and_says_why(self) -> None:
        for family in HELD_UNSOURCED:
            fingering = FC.contract(family)["physical"]["fingering"]
            self.assertEqual(fingering["printed"], "printed", f"{family} moved: take it out of HELD_UNSOURCED")
            self.assertIn("Held at printed by G30", fingering["note"])
""",
         """    def test_the_repeated_note_drill_passes_by_its_declared_solution(self) -> None:
        \"\"\"
        The review's required change (`responses/09ec1337.md` §3, option (b)). The four-to-a-note items re-strike
        every 0.25 s, under `FAST_REPEAT_SECONDS`; with the numbers gone they pass the physical gate because the
        row declares this drill's solution, not because the gate moved or a finger is still on the page. Without
        the declaration the same scores fail, for that reason.
        \"\"\"
        self.assertEqual(FC.FAST_REPEAT_SECONDS, 0.3, "the threshold is not this lane's to move")
        row = FC.contract("repeated_notes")
        self.assertEqual(row["physical"]["fingering"]["printed"], "none")
        self.assertIn("change finger on each strike", row["physical"]["repeatedNotes"]["solution"])
        self.assertIn("prescribes none", row["physical"]["repeatedNotes"]["solution"])
        self.assertIn("not a rule that every fast repeated note", row["physical"]["repeatedNotes"]["why"])
        undeclared = copy.deepcopy(row)
        undeclared["physical"].pop("repeatedNotes")
        four = [(sc, entry) for sc, entry in planned.by_family()["repeated_notes"] if entry["drill"]["params"]["perNote"] == 4]
        self.assertEqual(len(four), 6)
        for sc, entry in four:
            recipe = FC.recipe_of(entry)
            facts = FC.physical_facts(sc)["hands"]
            repeats = [r for fact in facts.values() for r in fact["repeats"]]
            with self.subTest(item=entry["id"]):
                self.assertEqual(sum(fact["fingered"] for fact in facts.values()), 0, "a finger is still printed")
                self.assertTrue(repeats and not any(changes for _gap, changes, _where in repeats))
                self.assertEqual(FC.physical_faults(row, recipe, sc, entry), [])
                faults = FC.physical_faults(undeclared, recipe, sc, entry)
                self.assertTrue(faults and all(f.startswith("repeated note:") for f in faults), faults)

    def test_a_repeated_note_solution_is_declared_only_where_its_drill_is(self) -> None:
        declared = {family for family, row in FC.contracts().items() if row["physical"].get("repeatedNotes")}
        self.assertEqual(declared, DECLARES_REPEATED_NOTES)
"""),
        ("""    def test_every_item_of_the_42_families_carries_its_identity_from_before(self) -> None:
        table = FC.continuity_table()["families"]
        families = g30_families()
        self.assertEqual(len(families), 42, "the rows G30 moved")""",
         """    def test_every_item_of_the_43_families_carries_its_identity_from_before(self) -> None:
        table = FC.continuity_table()["families"]
        families = g30_families()
        self.assertEqual(len(families), 43, "the rows G30 moved")"""),
    ],
    LC_TEST: [
        ("""    'technique.5',
    'the repeated-note exercises print 3-2-1 on this rung and 4-3-2-1 on the next, which is how the lesson now describes them',
    () => {
      const three = t12Line('exercise.repeated-notes.c.3x.left', 2).map((note) => note.finger);
      const four = t12Line('exercise.repeated-notes.c.4x.left', 2).map((note) => note.finger);
      const text = f0mText('technique.5');
      return (
        t12Exercises('technique.5').includes('exercise.repeated-notes.c.3x.left') &&
        t12Exercises('technique.6').includes('exercise.repeated-notes.c.4x.left') &&
        three.length > 0 &&
        three.join('') === '321'.repeat(three.length / 3) &&
        four.length > 0 &&
        four.join('') === '4321'.repeat(four.length / 4) &&
        text.includes('3-2-1 for three strikes here, 4-3-2-1 for four on the next technique rung') &&
        !text.includes('always coming towards')""",
         """    'technique.5',
    // Revised by G30's fix-forward (`responses/09ec1337.md` §3; the old assumption: the files print 3-2-1 and
    // 4-3-2-1 and the lesson says so). The order was the generator's own, so none is printed; the lesson asks for a
    // change of finger on each strike and leaves the order to the learner.
    'the repeated-note exercises print no finger, and the lesson asks for a change of finger on each strike in an order the learner chooses',
    () => {
      const three = t12Line('exercise.repeated-notes.c.3x.left', 2);
      const four = t12Line('exercise.repeated-notes.c.4x.left', 2);
      const text = f0mText('technique.5');
      return (
        t12Exercises('technique.5').includes('exercise.repeated-notes.c.3x.left') &&
        t12Exercises('technique.6').includes('exercise.repeated-notes.c.4x.left') &&
        three.length > 0 &&
        four.length > 0 &&
        [...three, ...four].every((note) => note.finger === null) &&
        text.includes('Changing finger on each strike is one way to keep a fast repeated note even') &&
        text.includes('No fingers are printed, and the order is yours to choose.') &&
        !text.includes('3-2-1') &&
        !text.includes('always coming towards')"""),
    ],
    TS_TEST: [
        ("""    // CL15 changed every walking-bass item, so its v2 identities were never carried; G30's v3 is.
    ['exercise.walking-bass.', 'walking_bass', 4],
  ];""",
         """    // CL15 changed every walking-bass item, so its v2 identities were never carried; G30's v3 is.
    ['exercise.walking-bass.', 'walking_bass', 4],
    // Moved by G30's fix-forward (`responses/09ec1337.md` §3): never bumped before, so its v1 is carried.
    ['exercise.repeated-notes.', 'repeated_notes', 2],
  ];"""),
    ],
}


def main() -> None:
    for path, edits in EDITS.items():
        raw = path.read_bytes()
        crlf = b"\r\n" in raw
        text = raw.decode("utf-8").replace("\r\n", "\n")
        done = 0
        for old, new in edits:
            if new in text:
                continue
            assert text.count(old) == 1, (path.name, old[:70])
            text = text.replace(old, new)
            done += 1
        out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
        if out != raw:
            path.write_bytes(out)
        print(f"{path.name}: {done} of {len(edits)} edits applied")


if __name__ == "__main__":
    main()
