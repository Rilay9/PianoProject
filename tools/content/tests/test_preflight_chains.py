"""The chain preflight (FABLE.md section 2 item 5, the Convergence sentence): one record broken per class.

`tools/content/preflight_chains.py` runs the defect classes the A7c.1 slice found on every chain record. Each class is
shown here on a small constructed tree (a catalogue, a curriculum, the app code the prerequisites are read from, the
verified facts, the excerpt rows, two MusicXML files) with a record that passes it, and the same record broken in the
one way that class exists to catch, which fails naming the evidence. The constructed tree needs no content build; the
cases on the real tree (the shipped A7c.1 record, its lesson, the app's own code) run only where the built catalogue is
present (`app/public/content/catalog.json`, written by `tools/content/build.py`), and say so when skipped.

Temporary files go under the repository's gitignored `build/test_preflight_chains/`.

Run: `py -3.11 -m unittest tools.content.tests.test_preflight_chains`
"""
from __future__ import annotations

import copy
import re
import shutil
import sys
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import preflight_chains as pf  # noqa: E402

SCRATCH = ROOT / "build" / "test_preflight_chains"
BUILT = ROOT / "app" / "public" / "content"
SHA = "a" * 64

# ------------------------------------------------------------------------------------------------
# The constructed tree
# ------------------------------------------------------------------------------------------------

#: The app code class 3 reads, cut to the lines its rules read: the same statements ScoreScreen.ts, settingsStore.ts,
#: ChordChartScreen.ts, openItem.ts and router.ts hold at this head.
SCORE_TS = """
const MODES: { id: Mode; label: string }[] = [
  { id: 'wait', label: 'Wait for me' },
  { id: 'tempo', label: 'Keep tempo' },
  { id: 'listen', label: 'Play it to me' },
  { id: 'free', label: 'Free play' },
];
const SHORT_MODES: Record<Mode, string> = {};
  let rhythmOnly = settings.rhythmOnly;
  const hearButton = button('Hear it', () => toggleHear(), 'score-hear');
  function ladderApplies(): boolean {
    return mode === 'tempo' && loopBars !== null && !performanceRun;
  }
  stage.addEventListener('dblclick', (event) => {
    const measure = measureAt(event.target, event.clientX, event.clientY);
    // a mode change is prose here, not a condition
    loopAnchor = measure;
  });
      mode = input === 'none' ? settings.defaultModeWithoutInput : settings.defaultModeWithInput;
    const rhythmAvailable = mode === 'tempo' && !blind && !performanceRun;
    const otherExists = hands !== 'both' && model?.handsPresent[other] === true;
"""
SETTINGS_TS = "  defaultModeWithInput: 'wait' | 'tempo';\n  defaultModeWithInput: 'wait',\n  defaultModeWithoutInput: 'tempo',\n"
CHART_INDEPENDENT = """
  function onBeat(beat: MetronomeBeat): void {
      if (comping) compBar();
      if (backing) scheduleBacking(bars[bar]?.pitchClasses);
  }

  function compBar(): void {
    const symbol = bars[bar];
  }

  const compChip = chip('Comp', {
    onClick: () => {
      comping = !comping;
    },
  });

  const backingChip = chip('Bass + drums', {
    onClick: () => {
      backing = !backing;
    },
  });
"""
#: Before CB1 (Entry 267): Bass + drums forced Comp on, and the backing was scheduled from compBar.
CHART_COUPLED = CHART_INDEPENDENT.replace(
    "      backing = !backing;\n", "      backing = !backing;\n      if (backing) comping = true;\n").replace(
    "    const symbol = bars[bar];\n", "    const symbol = bars[bar];\n    scheduleBacking(symbol.pitchClasses);\n")
OPEN_ITEM_TS = "export function hasChordSymbols(item: CatalogItem): boolean {\n  return (item.notation?.chordCount ?? 0) > 0;\n}\n"
ROUTER_TS = "  if (tab === 'play') return { tab: 'today', play: true };\n"

CUT = "excerpt.p.b1-4.lh"


def catalog() -> list[dict]:
    return [
        {"id": "song.p", "title": "The Piece", "type": "song", "hands": "both", "file": "scores/song.p.musicxml",
         "notation": {"bars": 20, "staves": 2, "chordCount": 0},
         "measurement": {"status": "measured", "span": {"R": [60, 72], "L": [40, 55]}},
         "provenance": {"identity": {"kind": "file", "sha256": SHA}, "facts": {"hands": {"kind": "authored"}}}},
        {"id": CUT, "title": "The Piece, bars 1-4, left hand", "type": "excerpt", "excerptOf": "song.p",
         "hands": "left", "file": "scores/cut.musicxml", "tempoBpm": 60.0, "tags": [],
         "notation": {"bars": 4, "staves": 1, "chordCount": 0},
         "measurement": {"status": "measured", "span": {"L": [40, 55]}},
         "provenance": {"identity": {"kind": "file", "sha256": "b" * 64},
                        "facts": {"hands": {"kind": "authored", "via": "the approved selection"}}}},
        {"id": "exercise.cell.c", "title": "Cell in C", "type": "exercise", "hands": "both",
         "file": "scores/generated/exercise.cell.c.mxl", "demands": ["rhythm.eighths", "rhythm.sixteenths"],
         "measurement": {"status": "measured", "located": {}, "span": {"L": [48, 48], "R": [60, 67]}},
         "drill": {"kind": "accompaniment", "generator": {"family": "cell"}}},
        {"id": "exercise.cell.f", "title": "Cell in F", "type": "exercise", "hands": "both",
         "file": "scores/generated/exercise.cell.f.mxl", "demands": ["rhythm.eighths"],
         "measurement": {"status": "measured", "located": {}, "span": {"L": [53, 53]}},
         "drill": {"kind": "accompaniment", "generator": {"family": "cell"}}},
        {"id": "drill.runtime", "title": "A runtime drill", "type": "drill", "file": None,
         "drill": {"kind": "chord"}, "measurement": {"status": "runtime", "reason": "made when it opens"}},
        {"id": "song.chart", "title": "The Chart", "type": "song", "hands": "right", "file": "scores/chart.musicxml",
         "notation": {"bars": 8, "staves": 1, "chordCount": 8},
         "measurement": {"status": "measured", "span": {"R": [60, 72]}},
         "provenance": {"identity": {"kind": "file", "sha256": "c" * 64}, "facts": {"hands": {"kind": "authored"}}}},
        {"id": "song.nowhere", "title": "Not on a rung", "type": "song", "hands": "right", "file": "scores/n.musicxml",
         "notation": {"bars": 8, "staves": 1, "chordCount": 8}, "measurement": {"status": "measured", "span": {"R": [60, 72]}},
         "provenance": {"identity": {"kind": "file", "sha256": "d" * 64}, "facts": {"hands": {"kind": "authored"}}}},
    ]


def curriculum() -> dict:
    return {"stages": [
        {"number": 1, "units": [{"id": "1.1", "track": "core", "lessons": [
            {"id": "1.1", "concepts": [], "textFile": "lessons/1.1.md", "exerciseOptions": [], "songOptions": []}]}]},
        {"number": 2, "units": [{"id": "t.2.1", "track": "t", "lessons": [
            {"id": "t.2", "concepts": [], "textFile": "lessons/t.2.md", "prerequisites": ["1.1"],
             "exerciseOptions": ["exercise.cell.c", "exercise.cell.f", "drill.runtime"],
             "songOptions": [CUT, "song.p", "song.chart"],
             "mastery": {"minAccuracy": 0.9, "minTempoPct": 0.8},
             "tools": [{"kind": "lab", "preset": "p"}],
             "requirements": [{"kind": "runs", "from": "exercises", "items": ["exercise.cell.c"], "count": 1},
                              {"kind": "runs", "from": "songs", "items": [CUT], "count": 1}]}]}]},
    ]}


DEMANDS = {"rhythm.eighths": {"id": "rhythm.eighths", "taughtAt": ["1.1"]},
           "rhythm.sixteenths": {"id": "rhythm.sixteenths", "taughtAt": ["t.2"]}}

#: The rung's lesson: it names Keep tempo with Rhythm only, and switches Rhythm only off, in one sentence each.
LESSON_T2 = ("Open the cell. Choose Keep tempo and L, then switch Rhythm only on and tap.\n\n"
             "Now switch Rhythm only off and play the notes.\n")


def demand_row(first: int = 1, last: int = 20, identity: str = SHA) -> dict:
    return {"item": "song.p", "identity": {"kind": "file", "sha256": identity}, "bars": [first, last], "staff": 2,
            "voice": None, "kind": "demand", "fact": {"demand": "rhythm.cell", "hand": "L"}, "rungs": [],
            "proof": {"method": "m", "date": "2026-10-07", "evidence": "e",
                      "verified": {"bars": [first, last], "staff": 2, "demand": "rhythm.cell", "hand": "L",
                                   "version": "v", "numbers": list(range(first, last + 1)),
                                   "app": [1], "witness": [1], "disagree": [], "hands": [], "declaredHand": None}}}


def context(*, chart: str = CHART_INDEPENDENT, lesson: str = LESSON_T2, facts: list[dict] | None = None,
            content: Path | None = None, rows: list[dict] | None = None, score: str = SCORE_TS) -> pf.Context:
    return pf.Context(
        root=ROOT, catalog=rows if rows is not None else catalog(), curriculum=curriculum(), demands=copy.deepcopy(DEMANDS),
        facts=facts if facts is not None else [demand_row()],
        excerpts=[{"of": "song.p", "fromBar": 1, "toBar": 4, "selection": "left"}],
        code={"score": score, "settings": SETTINGS_TS, "chart": chart, "openItem": OPEN_ITEM_TS, "router": ROUTER_TS},
        content=content or SCRATCH, lesson_text=lambda rung: lesson if rung == "t.2" else "", version="v")


def step(tool: str, kind: str, ref: str, action: str = "Does it.", recorded: str = "Nothing.", scaffold=None) -> dict:
    return {"action": action, "content": {"kind": kind, "ref": ref}, "tool": tool, "scaffold": scaffold or ["notation"],
            "feedback": "f", "recorded": recorded, "cannot_establish": "c", "removes": [], "no_removal_reason": "r"}


def record() -> dict:
    """A record that passes every class on the constructed tree."""
    return {
        "ability": "T.1", "status": "draft",
        "steps": [
            step("lesson", "explanation", "content/lessons/t.2.md"),
            step("Hear it", "excerpt", CUT, "Hears the left-hand cut."),
            step("Rhythm only", "generated", "exercise.cell.c", "Taps the cell, pitch removed."),
            step("Keep tempo", "generated", "exercise.cell.f", "Plays the cell in F.",
                 "A session row; not counted: the requirement names the C item alone."),
            step("Keep tempo", "generated", "exercise.cell.c", "Plays the cell in C. This is the counted run.",
                 "A session row that counts toward the exercises requirement."),
            step("Keep tempo", "excerpt", CUT, "Plays the left-hand cut. This is the counted run.",
                 "A session row that counts toward the songs requirement."),
            step("Hear it", "piece", "song.p@bars=1-12", "Hears the left hand of the piece, bars 1 to 12."),
            step("Chord chart", "piece", "song.chart", "Comps the chart with Comp off and Bass + drums on."),
        ],
        "evidence": {
            "updates": ["One Keep tempo run of exercise.cell.c at the pass pair, opened from t.2.",
                        f"One Keep tempo run of the cut, {CUT}, at the pass pair, opened from t.2."],
            "self_checked": ["x"], "never_credits": ["A run of exercise.cell.f standing for the counted run."]},
    }


def verdicts(results: list[pf.Result], cls: int) -> dict:
    return {r.step: r.verdict for r in results if r.cls == cls}


def run(rec: dict, ctx: pf.Context) -> list[pf.Result]:
    return pf.run_record(rec, ctx)[0]


def evidence(results: list[pf.Result], cls: int, where) -> str:
    return " | ".join(line for r in results if r.cls == cls and r.step == where for line in r.evidence)


# ------------------------------------------------------------------------------------------------
# The good record passes; each class's broken record fails
# ------------------------------------------------------------------------------------------------


class TheGoodRecord(unittest.TestCase):
    def test_every_class_passes_or_is_not_applicable(self):
        results = run(record(), context())
        fails = [(r.cls, r.step, r.evidence) for r in results if r.verdict == pf.FAIL and r.cls != 2]
        self.assertEqual(fails, [])

    def test_the_placed_rung_is_read_from_the_lesson_file_and_the_requirements(self):
        placement = pf.placed_rung(record(), context())
        self.assertEqual(placement.rung, "t.2")
        self.assertTrue(any("lesson file" in h for h in placement.how))
        self.assertTrue(any("requirement's items" in h for h in placement.how))


class Class1HandReading(unittest.TestCase):
    def test_a_one_staff_cut_with_an_authoritative_left_hand_passes(self):
        self.assertEqual(verdicts(run(record(), context()), 1)[2], pf.PASS)

    def test_broken_a_one_staff_left_cut_whose_hand_is_only_inferred_reads_as_the_right_hand(self):
        # BZ1: the catalogue says left, nothing authoritative declares it, the one-staff rule reads it as the right hand.
        rows = catalog()
        rows[1]["provenance"]["facts"]["hands"] = {"kind": "inferred"}
        results = run(record(), context(rows=rows))
        self.assertEqual(verdicts(results, 1)[2], pf.FAIL)
        self.assertIn("the BZ1 mismatch", evidence(results, 1, 2))

    def test_a_two_staff_passage_covered_by_a_current_proof_passes(self):
        self.assertEqual(verdicts(run(record(), context()), 1)[7], pf.PASS)

    def test_broken_a_two_staff_passage_with_no_verified_fact_fails_naming_the_bars(self):
        results = run(record(), context(facts=[]))
        self.assertEqual(verdicts(results, 1)[7], pf.FAIL)
        self.assertIn("no current verified fact covers bars 1-12", evidence(results, 1, 7))

    def test_broken_a_proof_on_another_file_is_stale_and_covers_nothing(self):
        results = run(record(), context(facts=[demand_row(identity="e" * 64)]))
        self.assertEqual(verdicts(results, 1)[7], pf.FAIL)
        self.assertIn("stale", evidence(results, 1, 7))

    def test_broken_a_proof_short_of_the_bars_used_fails_on_the_rest(self):
        results = run(record(), context(facts=[demand_row(1, 8)]))
        self.assertIn("bars 9-12", evidence(results, 1, 7))

    def test_broken_a_step_playing_the_right_hand_where_only_the_left_is_proved(self):
        rec = record()
        rec["steps"][6]["action"] = "Plays the right hand of the piece, bars 1 to 12."
        rec["steps"][6]["tool"] = "Keep tempo"
        self.assertEqual(verdicts(run(rec, context()), 1)[7], pf.FAIL)

    def test_the_lesson_page_and_the_chart_read_no_hands(self):
        results = run(record(), context(facts=[]))
        self.assertEqual(verdicts(results, 1)[8], pf.NA)
        self.assertEqual(verdicts(results, 1)[1], pf.NA)


#: A two-staff parent: 4 bars of 2/4, ♩ = 60 printed over the upper staff (as the Bizet prints it), a p on the lower.
PARENT_XML = """<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>-1</fifths></key><time><beats>2</beats><beat-type>4</beat-type></time>
        <staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>
      <direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>60</per-minute></metronome></direction-type><staff>1</staff><sound tempo="60"/></direction>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type><staff>1</staff></note>
      <backup><duration>2</duration></backup>
      <note><pitch><step>D</step><octave>2</octave></pitch><duration>2</duration><voice>5</voice><type>half</type><staff>2</staff></note>
    </measure>
    <measure number="2">
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type><staff>1</staff></note>
      <backup><duration>2</duration></backup>
      <direction placement="below"><direction-type><dynamics><p/></dynamics></direction-type><staff>2</staff></direction>
      <note><pitch><step>A</step><octave>2</octave></pitch><duration>2</duration><voice>5</voice><type>half</type><staff>2</staff></note>
    </measure>
    <measure number="3">
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type><staff>1</staff></note>
      <backup><duration>2</duration></backup>
      <note><pitch><step>F</step><octave>3</octave></pitch><duration>2</duration><voice>5</voice><type>half</type><staff>2</staff></note>
    </measure>
    <measure number="4">
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>half</type><staff>1</staff></note>
      <backup><duration>2</duration></backup>
      <note><pitch><step>D</step><octave>2</octave></pitch><duration>2</duration><voice>5</voice><type>half</type><staff>2</staff></note>
    </measure>
  </part>
</score-partwise>
"""


def one_staff_cut(tempo: bool, dynamic: bool) -> str:
    """The left-hand cut written by hand, with or without the carried tempo and the lower staff's p."""
    metronome = ('<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit>'
                 '<per-minute>60</per-minute></metronome></direction-type><sound tempo="60"/></direction>') if tempo else ""
    p = '<direction placement="below"><direction-type><dynamics><p/></dynamics></direction-type></direction>' if dynamic else ""
    bars = []
    for n, (step_, octave) in enumerate((("D", 2), ("A", 2), ("F", 3), ("D", 2)), 1):
        head = ('<attributes><divisions>1</divisions><key><fifths>-1</fifths></key><time><beats>2</beats>'
                '<beat-type>4</beat-type></time><clef><sign>F</sign><line>4</line></clef></attributes>' + metronome) if n == 1 else ""
        bars.append(f'<measure number="{n}">{head}{p if n == 2 else ""}<note><pitch><step>{step_}</step><octave>{octave}</octave>'
                    f'</pitch><duration>2</duration><voice>1</voice><type>half</type></note></measure>')
    return ('<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1">'
            '<part-name>Piano</part-name></score-part></part-list><part id="P1">' + "".join(bars) + "</part></score-partwise>")


class Class2CutTempoAndMarks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = SCRATCH / "class2"
        shutil.rmtree(cls.dir, ignore_errors=True)
        (cls.dir / "scores").mkdir(parents=True)
        (cls.dir / "scores" / "song.p.musicxml").write_text(PARENT_XML, encoding="utf-8")

    def ctx_with(self, cut_text: str | None, tags=None, tempo_bpm=60.0) -> pf.Context:
        rows = catalog()
        rows[1]["tags"] = list(tags or [])
        rows[1]["tempoBpm"] = tempo_bpm
        if cut_text is not None:
            (self.dir / "scores" / "cut.musicxml").write_text(cut_text, encoding="utf-8")
        return context(content=self.dir, rows=rows)

    def test_the_real_cutter_keeps_the_parents_tempo_and_marks(self):
        # The cutter itself (excerpts.cut, with DF2's carry of the upper staff's tempo onto the kept lower staff).
        import excerpts

        excerpts.cut(self.dir / "scores" / "song.p.musicxml", 1, 4, "left", CUT, self.dir / "scores" / "cut.mxl")
        rows = catalog()
        rows[1]["file"] = "scores/cut.mxl"
        results = run(record(), context(content=self.dir, rows=rows))
        self.assertEqual(verdicts(results, 2)[2], pf.PASS, evidence(results, 2, 2))

    def test_broken_the_real_cutter_without_dfs_carry_fails(self):
        # The mechanism DF2 fixed, restored as a mutant: the dropped upper staff takes its tempo mark with it.
        from unittest import mock

        import excerpts

        with mock.patch.object(excerpts, "_carry_tempo_from_the_dropped_staff", lambda staves, keep: None):
            made = excerpts.cut(self.dir / "scores" / "song.p.musicxml", 1, 4, "left", CUT, self.dir / "scores" / "mutant.mxl")
        rows = catalog()
        rows[1]["file"] = "scores/mutant.mxl"
        rows[1]["tempoBpm"] = made.tempo_bpm
        results = run(record(), context(content=self.dir, rows=rows))
        self.assertEqual(verdicts(results, 2)[2], pf.FAIL)
        self.assertIn("the parent's in force is 60.0 (DF2)", evidence(results, 2, 2))

    def test_a_hand_written_cut_with_both_marks_passes(self):
        results = run(record(), self.ctx_with(one_staff_cut(tempo=True, dynamic=True)))
        self.assertEqual(verdicts(results, 2)[2], pf.PASS, evidence(results, 2, 2))
        self.assertEqual(verdicts(results, 2)[6], pf.PASS)  # the same cut again, read once

    def test_broken_a_cut_that_lost_the_tempo_on_the_dropped_staff(self):
        # DF2: before the carry, a left-hand cut lost the upper staff's mark and played at the converter's default.
        results = run(record(), self.ctx_with(one_staff_cut(tempo=False, dynamic=True), tempo_bpm=96.0))
        self.assertEqual(verdicts(results, 2)[2], pf.FAIL)
        text = evidence(results, 2, 2)
        self.assertIn("the parent's in force is 60.0", text)
        self.assertIn("tempoBpm 96.0", text)

    def test_broken_a_cut_that_lost_a_dynamic_on_its_kept_staff(self):
        results = run(record(), self.ctx_with(one_staff_cut(tempo=True, dynamic=False)))
        self.assertEqual(verdicts(results, 2)[2], pf.FAIL)
        self.assertIn("dynamics on the kept staff the cut lost", evidence(results, 2, 2))

    def test_broken_a_defaulted_tempo_left_unflagged(self):
        parent_without = PARENT_XML.replace(
            '<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>60</per-minute></metronome></direction-type><staff>1</staff><sound tempo="60"/></direction>', "")
        (self.dir / "scores" / "song.p.musicxml").write_text(parent_without, encoding="utf-8")
        try:
            results = run(record(), self.ctx_with(one_staff_cut(tempo=False, dynamic=True), tempo_bpm=96.0))
            self.assertEqual(verdicts(results, 2)[2], pf.FAIL)
            self.assertIn("no tempo-defaulted tag", evidence(results, 2, 2))
            flagged = run(record(), self.ctx_with(None, tags=["tempo-defaulted"], tempo_bpm=96.0))
            self.assertEqual(verdicts(flagged, 2)[2], pf.PASS, evidence(flagged, 2, 2))
        finally:
            (self.dir / "scores" / "song.p.musicxml").write_text(PARENT_XML, encoding="utf-8")


class Class3ControlReachable(unittest.TestCase):
    def test_rhythm_only_passes_when_the_lesson_names_keep_tempo_with_it(self):
        results = run(record(), context())
        self.assertEqual(verdicts(results, 3)[3], pf.PASS)
        self.assertIn("Choose Keep tempo and L, then switch Rhythm only on", evidence(results, 3, 3))

    def test_broken_rhythm_only_where_the_item_opens_in_wait_for_me_and_nothing_says_keep_tempo(self):
        # The phone walk's step 7a (Entry 270): the row exists only in Keep tempo, the drill opens in Wait for me.
        results = run(record(), context(lesson="Open the cell and switch Rhythm only on.\n"))
        self.assertEqual(verdicts(results, 3)[3], pf.FAIL)
        self.assertIn("Rhythm only needs 'Keep tempo' first (code", evidence(results, 3, 3))

    def test_the_prerequisite_is_read_from_the_code_not_a_table(self):
        # Were the row drawn in Wait for me too, the opening mode would hold it and nothing need be said.
        score = SCORE_TS.replace("const rhythmAvailable = mode === 'tempo'", "const rhythmAvailable = (mode === 'tempo' || mode === 'wait')")
        results = run(record(), context(lesson="Open the cell and switch Rhythm only on.\n", score=score))
        self.assertEqual(verdicts(results, 3)[3], pf.PASS)

    def test_broken_a_remembered_rhythm_only_before_a_keep_tempo_run_that_nothing_switches_off(self):
        results = run(record(), context(lesson="Choose Keep tempo, then switch Rhythm only on.\n"))
        self.assertEqual(verdicts(results, 3)[4], pf.FAIL)
        self.assertIn("remembered across pieces", evidence(results, 3, 4))

    def test_broken_comp_off_with_bass_and_drums_on_where_the_code_couples_them(self):
        # CB1 (Entry 267): Bass + drums forced Comp on, and the backing ran only from the comp.
        results = run(record(), context(chart=CHART_COUPLED))
        self.assertEqual(verdicts(results, 3)[8], pf.FAIL)
        self.assertIn("the code couples them", evidence(results, 3, 8))
        self.assertEqual(verdicts(run(record(), context()), 3)[8], pf.NA)  # independent, the chart's drawing routed

    def test_broken_an_item_no_rung_lists(self):
        rec = record()
        rec["steps"][7]["content"]["ref"] = "song.nowhere"
        results = run(rec, context())
        self.assertEqual(verdicts(results, 3)[8], pf.FAIL)
        self.assertIn("an option of no rung", evidence(results, 3, 8))

    def test_broken_duet_with_no_hand_named(self):
        rec = record()
        rec["steps"][6] = step("Keep tempo", "piece", "song.p@bars=1-12", "Plays along.",
                               "Counts toward nothing.", ["notation", "app plays the other hand"])
        self.assertEqual(verdicts(run(rec, context()), 3)[7], pf.FAIL)


class Class4CountedItems(unittest.TestCase):
    def test_the_named_requirements_match_the_updates(self):
        results = run(record(), context())
        self.assertEqual(verdicts(results, 4)[None], pf.PASS, evidence(results, 4, None))

    def test_broken_an_unnamed_pool_counts_what_a_step_says_never_counts(self):
        # G13: the exercises requirement counted any exercise option until it named the control.
        ctx = context()
        lesson = ctx.lesson("t.2")[2]
        del lesson["requirements"][0]["items"]
        results = run(record(), ctx)
        self.assertEqual(verdicts(results, 4)[None], pf.FAIL)
        self.assertIn("the G13 class", evidence(results, 4, None))
        self.assertEqual(verdicts(results, 4)[4], pf.FAIL)  # the F run would count, the step says it does not

    def test_broken_an_update_naming_no_item_id(self):
        rec = record()
        rec["evidence"]["updates"][1] = "One Keep tempo run of the left-hand cut at the pass pair, opened from t.2."
        results = run(rec, context())
        self.assertIn("names no item id", evidence(results, 4, None))
        self.assertIn(f"requirement 2 counts {CUT}; no update names it by id", evidence(results, 4, None))

    def test_broken_a_count_that_disagrees(self):
        rec = record()
        rec["evidence"]["updates"][0] = rec["evidence"]["updates"][0].replace("One", "Two")
        self.assertIn("update 1 says 2 run(s)", evidence(run(rec, context()), 4, None))

    def test_broken_a_step_that_says_it_counts_on_an_item_no_requirement_counts(self):
        rec = record()
        rec["steps"][3]["recorded"] = "A session row that counts toward the exercises requirement."
        self.assertEqual(verdicts(run(rec, context()), 4)[4], pf.FAIL)

    def test_broken_no_placed_rung(self):
        rec = record()
        rec["steps"][0]["content"]["ref"] = "content/lessons/elsewhere.md"
        rec["evidence"]["updates"] = ["One run of exercise.unknown."]
        self.assertEqual(verdicts(run(rec, context()), 4)[None], pf.FAIL)


class Class5TaughtSet(unittest.TestCase):
    def test_a_generated_item_asking_only_what_its_rung_taught_passes(self):
        self.assertEqual(verdicts(run(record(), context()), 5)[3], pf.PASS)

    def test_broken_a_generated_item_asking_a_demand_its_rung_never_taught(self):
        ctx = context()
        ctx.demands["rhythm.sixteenths"]["taughtAt"] = ["9.9"]
        results = run(record(), ctx)
        self.assertEqual(verdicts(results, 5)[3], pf.FAIL)
        self.assertIn("rhythm.sixteenths", evidence(results, 5, 3))

    def test_a_runtime_item_is_said_not_measured(self):
        rec = record()
        rec["steps"][2]["content"]["ref"] = "drill.runtime"
        results = run(rec, context())
        self.assertEqual(verdicts(results, 5)[3], pf.NA)
        self.assertIn("runtime", evidence(results, 5, 3))


class Class6Journey(unittest.TestCase):
    def test_the_journey_routes_counts_and_completes(self):
        ctx = context()
        rec = record()
        results, placement, plan = pf.run_record(rec, ctx)
        self.assertEqual(verdicts(results, 6)[None], pf.PASS)
        counted = [s.counts for s in plan if s.counts and s.counts != "unchanged"]
        self.assertEqual(counted, ["1 of 2", "2 of 2"])
        text = pf.render_journey(rec, ctx, placement, plan)
        self.assertIn('await openRow(page, "Cell in C");', text)
        self.assertIn("toMatch(/2 of 2/)", text)
        self.assertIn("await setToggle(page, 'score-rhythm', false);", text)  # the remembered Rhythm only, switched off
        self.assertNotIn("// acceptance-ability:", text)  # a skeleton never claims to be an acceptance journey

    def test_broken_a_record_whose_counted_runs_cannot_complete_the_rung(self):
        rec = record()
        rec["steps"][5]["tool"] = "Rhythm only"
        self.assertEqual(verdicts(run(rec, context()), 6)[None], pf.FAIL)

    def test_a_tool_with_no_template_is_a_fixme_line(self):
        results, placement, plan = pf.run_record(record(), context())
        self.assertEqual(verdicts(results, 6)[8], pf.NA)
        self.assertIn("test.fixme(true", pf.render_journey(record(), context(), placement, plan))

    def test_the_comparison_lists_a_difference(self):
        written = """
const T = {
  cell: 'Cell in C',
};
type Verdict = 'PASS';
test('walk', async ({ page }) => {
  await step('3', 'tap', 'x', async (obs, shots) => {
    await openRow(page, T.cell, obs);
    await setMode(page, 'tempo', obs);
    await setHand(page, 'L', obs);
    await setToggle(page, 'score-rhythm', true, obs, 'Rhythm only');
    await playToSummary(page, obs);
    expect(after).toBe(before);
  });
});
"""
        _results, _placement, plan = pf.run_record(record(), context())
        lines = pf.compare_journey(plan, pf.parse_written_journey(written))
        self.assertIn("record step 3 <-> written step 3: hand: generated None, written ['L']", lines)
        self.assertTrue(any(line.startswith("record step 5 (") and "no hand-written step" in line for line in lines))


class TheCommandLine(unittest.TestCase):
    def test_report_mode_exits_0_and_strict_exits_1_on_a_fail(self):
        from unittest import mock

        out = SCRATCH / "cli"
        shutil.rmtree(out, ignore_errors=True)
        failing = ([pf.Result(4, None, pf.FAIL, ["a constructed failure"])], pf.Placement("t.2", []), [])
        with mock.patch.object(pf.Context, "from_tree", lambda root, content=None: context()), \
                mock.patch.object(pf, "run_record", lambda rec, ctx: failing), \
                mock.patch("sys.stdout"):
            self.assertEqual(pf.main(["A7c.1", "--out", str(out)]), 0)
            self.assertEqual(pf.main(["A7c.1", "--out", str(out), "--strict"]), 1)
        text = (out / "preflight-A7c.1.txt").read_text(encoding="utf-8")
        self.assertIn("a constructed failure", text)
        self.assertTrue((out / "journey-A7c.1.spec.ts").is_file())

    def test_no_built_catalogue_stops_the_run_with_exit_2(self):
        with self.assertRaises(pf.InputsMissing) as stop:
            pf.Context.from_tree(ROOT, SCRATCH / "no-such-content")
        self.assertIn("no built catalogue", str(stop.exception))
        from unittest import mock

        with mock.patch("sys.stderr"):
            self.assertEqual(pf.main(["--content", str(SCRATCH / "no-such-content"), "--out", str(SCRATCH / "cli2")]), 2)


# ------------------------------------------------------------------------------------------------
# The real tree (needs the built catalogue)
# ------------------------------------------------------------------------------------------------


@unittest.skipUnless((BUILT / "catalog.json").is_file(), "no built catalogue: run tools/content/build.py first")
class TheRealTree(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ctx = pf.Context.from_tree(ROOT)
        cls.rec = yaml.safe_load((ROOT / "docs/chains/A7c.1.yaml").read_text(encoding="utf-8"))

    def test_the_code_rules_are_found_in_the_app(self):
        facts = pf.code_facts(self.ctx.code)
        self.assertEqual(facts.opening_with_input, "wait")
        self.assertEqual(facts.rhythm_modes, {"tempo"})
        self.assertTrue(facts.rhythm_remembered)
        self.assertTrue(facts.loop_any_mode)
        self.assertEqual(facts.chart_coupled, [])  # CB1 landed
        self.assertTrue(facts.play_route)

    def test_a7c1_holds_the_classes_its_slice_found(self):
        results = run(self.rec, self.ctx)
        fails = [(r.cls, r.step) for r in results if r.verdict == pf.FAIL and r.cls in (1, 2, 3, 5, 6)]
        self.assertEqual(fails, [])

    def test_broken_a7c1_with_its_lesson_silent_on_keep_tempo_fails_the_rhythm_only_steps(self):
        lesson = self.ctx.lesson_text("latin.4")
        silent = re.sub(r"Keep\s+tempo", "the other mode", lesson)  # across a line break too
        self.assertNotIn("keep tempo", re.sub(r"\s+", " ", silent).casefold())
        ctx = pf.Context(root=ROOT, catalog=self.ctx.catalog, curriculum=self.ctx.curriculum, demands=self.ctx.demands,
                         facts=self.ctx.facts, excerpts=self.ctx.excerpts, code=self.ctx.code, content=self.ctx.content,
                         lesson_text=lambda rung: silent, resolver=self.ctx.resolver, version=self.ctx.version())
        results = run(self.rec, ctx)
        failed = sorted(r.step for r in results if r.cls == 3 and r.verdict == pf.FAIL)
        rhythm_steps = [n for n, s in enumerate(self.rec["steps"], 1) if s["tool"] == "Rhythm only"]
        self.assertEqual(failed, rhythm_steps)

    def test_the_generated_journey_pairs_every_record_step_with_the_hand_written_walk(self):
        spec = ROOT / "app/tests/e2e/a7c1-phone-walk.spec.ts"
        _results, _placement, plan = pf.run_record(self.rec, self.ctx)
        lines = pf.compare_journey(plan, pf.parse_written_journey(spec.read_text(encoding="utf-8")))
        self.assertEqual([line for line in lines if "no hand-written step" in line or "no record step pairs" in line], [])


if __name__ == "__main__":
    unittest.main()
