"""The chain preflight (FABLE.md section 2 item 5, the Convergence sentence): one record broken per class.

`tools/content/preflight_chains.py` runs the defect classes the A7c.1 slice found on every chain record. Each class is
shown here on a small constructed tree (a catalogue, a curriculum, the app code the prerequisites are read from, the
verified facts, the excerpt rows, two MusicXML files) with a record that passes it, and the same record broken in the
one way that class exists to catch, which fails naming the evidence. The constructed tree needs no content build; the
cases on the real tree (the shipped A7c.1 record, its lesson, the app's own code) run only where the built catalogue is
present (`app/public/content/catalog.json`, written by `tools/content/build.py`), and say so when skipped.

PF2 (2026-10-07) added three things, each with its broken records below: `--strict` fails only a record whose status is
`reviewed` or `shipped` (a draft's FAILs are reported), and CI runs it that way after the content build; class 3 accepts
an earlier rung named by id as review or prerequisite; class 6 has a template for a counted Reading-and-theory drill.

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


def with_review_drill(ctx: pf.Context) -> pf.Context:
    """The constructed tree plus a drill that only rung 1.1 lists (the placed rung t.2 has 1.1 in its ancestry)."""
    ctx.catalog.append({"id": "drill.review", "title": "A review drill", "type": "drill", "file": None,
                        "drill": {"kind": "chord"}, "measurement": {"status": "runtime", "reason": "made when it opens"}})
    ctx.by_id["drill.review"] = ctx.catalog[-1]
    ctx.lesson("1.1")[2]["exerciseOptions"] = ["drill.review"]
    return ctx


def review_record(action: str) -> dict:
    rec = record()
    rec["steps"].append(step("Reading and theory drills", "generated", "drill.review", action, "A drill row.",
                             ["app plays it"]))
    return rec


def with_counted_drill(ctx: pf.Context, *, kind: str = "chord", generic: bool = False, songs: bool = True) -> pf.Context:
    """The constructed tree plus a drill t.2 lists and a requirement that names it (and, for A7b.1's shape, the generic
    requirement of any two distinct exercises; ``songs=False`` drops the songs requirement, leaving exactly A7b.1's two)."""
    ctx.catalog.append({"id": "drill.counted", "title": "A counted drill", "type": "drill", "file": None,
                        "drill": {"kind": kind}, "measurement": {"status": "runtime", "reason": "made when it opens"}})
    ctx.by_id["drill.counted"] = ctx.catalog[-1]
    lesson = ctx.lesson("t.2")[2]
    lesson["exerciseOptions"] = lesson["exerciseOptions"] + ["drill.counted"]
    lesson["requirements"] = [r for r in lesson["requirements"] if r["from"] == "songs" and songs] + (
        [{"kind": "runs", "from": "exercises", "count": 2}] if generic else
        [{"kind": "runs", "from": "exercises", "items": ["exercise.cell.c"], "count": 1}]
    ) + [{"kind": "runs", "from": "exercises", "items": ["drill.counted"], "count": 1}]
    return ctx


def drill_record(*, counted: bool = True, second_exercise: bool = False) -> dict:
    """The good record with a drill step: the songs requirement's cut run, the drill, and (optionally) the cell run."""
    said = ("Plays the drill's cards. This is the counted run." if counted else "Plays the drill's cards.")
    recorded = ("A drill row that counts toward the requirement whose items name this drill." if counted
                else "A drill row; not counted: nothing requires it.")
    rec = record()
    rec["steps"] = [s for s in rec["steps"] if not (s["tool"] == "Keep tempo" and s["content"]["ref"] == "exercise.cell.c")]
    rec["steps"].append(step("Reading and theory drills", "generated", "drill.counted", said, recorded, ["app plays it"]))
    if second_exercise:
        rec["steps"].append(step("Keep tempo", "generated", "exercise.cell.c", "Plays the cell in C. This is the counted run.",
                                 "A session row that counts toward the exercises requirement."))
    rec["evidence"]["updates"] = [
        f"One Keep tempo run of the cut, {CUT}, at the pass pair, opened from t.2.",
        "One run of drill.counted at the pass accuracy, opened from t.2."]
    if second_exercise:
        rec["evidence"]["updates"].append("One Keep tempo run of exercise.cell.c at the pass pair, opened from t.2.")
    return rec


def a7b_record(*, counted: bool = True, cells: int = 0) -> dict:
    """A7b.1's shape: the rung lesson, one named drill, and (optionally) counted runs of the two cells. Nothing else is
    counted; no step is added to hold the rung's generic requirement."""
    rec = record()
    rec["steps"] = [rec["steps"][0]]
    said = "Plays the drill's cards. This is the counted run." if counted else "Plays the drill's cards."
    recorded = ("A drill row that counts toward the requirement whose items name this drill." if counted
                else "A drill row; not counted: nothing requires it.")
    rec["steps"].append(step("Reading and theory drills", "generated", "drill.counted", said, recorded, ["app plays it"]))
    for cell in ("exercise.cell.c", "exercise.cell.f")[:cells]:
        rec["steps"].append(step("Keep tempo", "generated", cell, "Plays the cell. This is the counted run.",
                                 "A session row that counts toward the exercises requirement."))
    return rec


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


#: PF5 (the reviewer's ruling ``docs/review/responses/a7a-lanes-landing.md`` section 10, ``PF1-authored-hand-proof``):
#: an authored two-staff control, such as the C shuffle, is not trusted for having two staves. Its hands are proved by
#: current ``hand`` rows (HD2) that confirm (or override) the model's reading for every staff and voice that sounds a
#: note in the bars used. The authored file here: four bars, the right hand's whole notes on staff 1 voice 1 and the
#: left hand's on staff 2 voice 2 (the shape the shuffle's built file has, ``docs/prompts/runs/A7a1/shuffle_read.out``).
AUTH = "exercise.auth.two"
AUTH_SHA = "9" * 64


def auth_xml(bars: int = 4, lh_voice: int = 2) -> str:
    body = []
    for n in range(1, bars + 1):
        head = ('<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>'
                '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>'
                '</attributes>') if n == 1 else ""
        body.append(f'<measure number="{n}">{head}'
                    '<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice>'
                    '<type>whole</type><staff>1</staff></note><backup><duration>4</duration></backup>'
                    f'<note><pitch><step>C</step><octave>2</octave></pitch><duration>4</duration><voice>{lh_voice}</voice>'
                    '<type>whole</type><staff>2</staff></note></measure>')
    return ('<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1">'
            '<part-name>Piano</part-name></score-part></part-list><part id="P1">' + "".join(body) + "</part></score-partwise>")


def auth_row() -> dict:
    return {"id": AUTH, "title": "An authored two-staff control", "type": "exercise", "hands": "both",
            "file": "scores/auth.musicxml", "tempoBpm": 88.0, "notation": {"bars": 4, "staves": 2, "chordCount": 4},
            "measurement": {"status": "measured", "span": {"R": [60, 60], "L": [36, 36]}},
            "provenance": {"identity": {"kind": "file", "sha256": AUTH_SHA},
                           "facts": {"hands": {"kind": "authored", "via": "this repository's score"}}}}


def hand_fact(staff: int, voice: int, hand: str, first: int = 1, last: int = 4, *, identity: str = AUTH_SHA,
              item: str = AUTH) -> dict:
    return {"item": item, "identity": {"kind": "file", "sha256": identity}, "bars": [first, last], "staff": staff,
            "voice": voice, "kind": "hand", "fact": hand, "rungs": None,
            "proof": {"method": "notation: the model dump of the built file", "date": "2026-10-07", "evidence": "e"}}


def confirming_pair(first: int = 1, last: int = 4, **kw) -> list[dict]:
    """The authored mapping stated as facts: the upper line (staff 1, voice 1) as R, the lower (staff 2, voice 2) as L."""
    return [hand_fact(1, 1, "R", first, last, **kw), hand_fact(2, 2, "L", first, last, **kw)]


class Class1AuthoredHandProof(unittest.TestCase):
    """PF5: class 1 learns authored two-staff controls through current ``hand`` rows, and never through the staves."""

    @classmethod
    def setUpClass(cls):
        cls.dir = SCRATCH / "class1auth"
        shutil.rmtree(cls.dir, ignore_errors=True)
        (cls.dir / "scores").mkdir(parents=True)
        (cls.dir / "scores" / "auth.musicxml").write_text(auth_xml(), encoding="utf-8")

    def verdict(self, facts: list[dict], action: str = "Plays the left hand of the control.", bars: str = "",
                content: Path | None = None) -> tuple[str, str]:
        ctx = context(content=content or self.dir, rows=catalog() + [auth_row()], facts=facts)
        rec = {"steps": [step("Keep tempo", "piece", AUTH + bars, action)]}
        (result,) = pf.check_hand_reading(rec, ctx)
        return result.verdict, " | ".join(result.evidence)

    def test_confirming_facts_for_every_staff_and_voice_pass_the_whole_item(self):
        verdict, said = self.verdict(confirming_pair())
        self.assertEqual(verdict, pf.PASS, said)
        self.assertIn("current hand fact", said)
        self.assertIn("staff 2 voice 2 read as L on bars 1-4", said)

    def test_the_same_facts_pass_a_passage_inside_their_bars_and_either_hand(self):
        for hand in ("left", "right"):
            verdict, said = self.verdict(confirming_pair(), f"Plays the {hand} hand of the control, bars 2 to 3.", "@bars=2-3")
            self.assertEqual(verdict, pf.PASS, said)

    def test_broken_two_staves_alone_never_pass(self):
        # The row is authored, both hands, two staves, and the model reads L and R: none of it is a fact.
        verdict, said = self.verdict([])
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("no current verified fact covers bars 1-4", said)
        self.assertIn("staff 1 voice 1", said)

    def test_broken_a_stale_fact_for_another_identity_covers_nothing(self):
        facts = confirming_pair(identity="e" * 64)
        verdict, said = self.verdict(facts)
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("hand fact", said)
        self.assertIn("stale: the file identity changed since it was proved", said)

    def test_broken_a_fact_short_of_the_bars_used_fails_on_the_rest(self):
        verdict, said = self.verdict(confirming_pair(1, 3))
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("no current verified fact covers bars 4", said)

    def test_broken_a_fact_for_other_bars_covers_nothing_here(self):
        verdict, said = self.verdict(confirming_pair(5, 8))
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("no current verified fact covers bars 1-4", said)

    def test_broken_a_fact_for_a_staff_and_voice_the_file_does_not_sound_covers_nothing(self):
        facts = [hand_fact(1, 1, "R"), hand_fact(2, 1, "L")]  # the left hand is staff 2 voice 2
        verdict, said = self.verdict(facts)
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("staff 2 voice 2 has no current hand fact", said)

    def test_broken_a_fact_for_the_right_voice_on_the_wrong_staff_covers_nothing(self):
        facts = [hand_fact(1, 1, "R"), hand_fact(1, 2, "L")]  # voice 2 is sounded on staff 2, not staff 1
        verdict, said = self.verdict(facts)
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("staff 2 voice 2 has no current hand fact", said)

    def test_broken_a_fact_for_one_voice_of_a_bar_leaves_the_other_voice_unproved(self):
        verdict, said = self.verdict([hand_fact(2, 2, "L")])  # a left-hand step, but the right hand's voice is unproved
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("staff 1 voice 1 has no current hand fact", said)

    def test_broken_another_items_facts_cover_nothing(self):
        verdict, said = self.verdict(confirming_pair(item="exercise.other"))
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("no current verified fact covers bars 1-4", said)

    def test_broken_two_facts_that_disagree_fail_naming_both(self):
        facts = confirming_pair() + [hand_fact(2, 2, "R", 2, 3)]
        verdict, said = self.verdict(facts)
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("staff 2 voice 2 bars 2-3 are L in one and R in the other", said)

    def test_broken_a_step_playing_a_hand_the_facts_do_not_establish_fails(self):
        facts = [hand_fact(1, 1, "L"), hand_fact(2, 2, "L")]  # both lines stated as the left hand
        verdict, said = self.verdict(facts, "Plays the right hand of the control.")
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("the proofs establish ['L'] only", said)

    def test_broken_a_malformed_hand_row_covers_nothing(self):
        bad = hand_fact(2, 2, "L")
        bad["voice"] = None
        verdict, said = self.verdict([hand_fact(1, 1, "R"), bad])
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("`voice` must be a voice number", said)

    def test_broken_a_file_whose_voices_cannot_be_read_gets_no_coverage(self):
        verdict, said = self.verdict(confirming_pair(), content=SCRATCH / "class1auth-nowhere")
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("is not there", said)

    def test_a_fact_that_overrides_the_default_reading_counts_the_same_way(self):
        # HD2's own case (The Crave's inner line): the row says what the hand is, whether or not the model agrees.
        facts = [hand_fact(1, 1, "R"), hand_fact(2, 2, "L")]
        self.assertEqual(self.verdict(facts)[0], pf.PASS)

    def test_broken_another_items_passage_proof_does_not_stand_in_for_this_items_bars(self):
        self.assertEqual(self.verdict(confirming_pair(3, 4) + [demand_row(1, 2)])[0], pf.FAIL)

    def test_a_passage_proof_and_hand_facts_cover_different_bars_of_one_passage(self):
        proof = {**demand_row(1, 2, identity=AUTH_SHA), "item": AUTH}
        verdict, said = self.verdict(confirming_pair(3, 4) + [proof], "Plays the right hand of the control.")
        self.assertEqual(verdict, pf.PASS, said)
        self.assertIn("current passage proof", said)
        self.assertIn("current hand fact", said)

    def test_the_reader_names_staff_and_voice_per_printed_bar(self):
        got, why = pf.score_voices(self.dir / "scores" / "auth.musicxml")
        self.assertEqual(why, "")
        self.assertEqual(got, {n: {(1, 1), (2, 2)} for n in (1, 2, 3, 4)})

    def test_the_reader_reads_a_compressed_file_and_refuses_what_it_cannot_read(self):
        import zipfile

        path = self.dir / "scores" / "auth.mxl"
        with zipfile.ZipFile(path, "w") as z:
            z.writestr("META-INF/container.xml", '<container><rootfiles><rootfile full-path="auth.xml"/></rootfiles></container>')
            z.writestr("auth.xml", auth_xml(2, lh_voice=5))
        self.assertEqual(pf.score_voices(path), ({1: {(1, 1), (2, 5)}, 2: {(1, 1), (2, 5)}}, ""))
        two_parts = self.dir / "scores" / "two.musicxml"
        two_parts.write_text(auth_xml(1).replace("</part></score-partwise>", "</part><part id=\"P2\"/></score-partwise>"),
                             encoding="utf-8")
        self.assertIsNone(pf.score_voices(two_parts)[0])
        self.assertIsNone(pf.score_voices(self.dir / "scores" / "missing.mxl")[0])


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


class Class3EarlierRungReview(unittest.TestCase):
    """PF2: a step may open an item that only an earlier rung lists, when it names that rung by id and says review or
    prerequisite (A7b.1's step 3 opens the seventh-quality ear drill on jazz.5 as review)."""

    def reach(self, action: str, ctx: pf.Context | None = None):
        results = run(review_record(action), ctx or with_review_drill(context()))
        return verdicts(results, 3)[len(review_record(action)["steps"])], evidence(results, 3, len(review_record(action)["steps"]))

    def test_an_earlier_rung_named_by_id_as_review_passes(self):
        verdict, text = self.reach("Opens drill.review on 1.1 as review of the earlier rung.")
        self.assertEqual(verdict, pf.PASS, text)
        self.assertIn("an earlier-rung review: the step names 1.1", text)

    def test_the_word_prerequisite_passes_too(self):
        self.assertEqual(self.reach("Opens drill.review from the prerequisite rung 1.1.")[0], pf.PASS)

    def test_broken_a_step_that_names_no_rung(self):
        verdict, text = self.reach("Opens drill.review as review of what came before.")
        self.assertEqual(verdict, pf.FAIL)
        self.assertIn("nor name an earlier one of those rungs by id as review or prerequisite", text)

    def test_broken_a_rung_named_without_saying_review_or_prerequisite(self):
        self.assertEqual(self.reach("Opens drill.review on 1.1.")[0], pf.FAIL)

    def test_broken_a_rung_named_in_one_clause_and_review_said_in_another(self):
        self.assertEqual(self.reach("Opens drill.review on 1.1; this is review.")[0], pf.FAIL)

    def test_broken_a_named_rung_that_does_not_list_the_item(self):
        # t.2 is the placed rung and does not list it; 1.1 is not what the step names.
        self.assertEqual(self.reach("Opens drill.review on t.2 as review.")[0], pf.FAIL)

    def test_broken_a_named_rung_that_is_not_earlier(self):
        ctx = with_review_drill(context())
        later = {"id": "t.3", "concepts": [], "textFile": "lessons/t.3.md", "prerequisites": ["t.2"],
                 "exerciseOptions": ["drill.review"], "songOptions": []}
        ctx.curriculum["stages"][1]["units"][0]["lessons"].append(later)
        ctx._ancestry = None
        verdict, text = self.reach("Opens drill.review on t.3 as review.", ctx)
        self.assertEqual(verdict, pf.FAIL, text)

    def test_broken_a_rung_id_that_is_only_part_of_a_longer_id(self):
        self.assertEqual(self.reach("Opens drill.review on 1.1.2 as review.")[0], pf.FAIL)

    def test_the_placed_rung_and_the_later_rung_cases_are_unchanged(self):
        self.assertEqual(verdicts(run(record(), context()), 3)[3], pf.PASS)
        rec = record()
        rec["steps"][7]["content"]["ref"] = "song.nowhere"
        self.assertEqual(verdicts(run(rec, context()), 3)[8], pf.FAIL)


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


def hands_both(ctx: pf.Context, *which: int) -> pf.Context:
    """The constructed tree with ``hands: both`` on the given requirements of t.2 (1 = the exercises one, 2 = the songs one)."""
    for k in which:
        ctx.lesson("t.2")[2]["requirements"][k - 1]["hands"] = "both"
    return ctx


def duet_step(tool: str = "Duet", scaffold=None, action: str = "Plays the left hand of the cell in C alone, choosing L, "
              "while the app plays the right hand. This is the counted run.") -> dict:
    return step(tool, "generated", "exercise.cell.c", action, "A session row that counts toward the exercises requirement.",
                scaffold or ["notation", "app plays the other hand"])


class Class4HandsBoth(unittest.TestCase):
    """PF4 (A7a-hands-both-requirement): a runs requirement with ``hands: both`` counts only a run whose hands.played is
    both; the record may not count a one-hand run toward it, in a step or in an update."""

    def test_a_both_hands_keep_tempo_step_passes_a_hands_both_requirement(self):
        results = run(record(), hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[None], pf.PASS, evidence(results, 4, None))
        self.assertEqual(verdicts(results, 4)[5], pf.PASS, evidence(results, 4, 5))
        self.assertIn("hands both", evidence(results, 4, 5))

    def test_broken_a_duet_step_counted_for_a_hands_both_requirement_fails(self):
        rec = record()
        rec["steps"].append(duet_step())
        results = run(rec, hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[9], pf.FAIL, evidence(results, 4, 9))
        self.assertIn("counts hands both; this step plays one hand", evidence(results, 4, 9))
        self.assertIn("the app plays the other hand", evidence(results, 4, 9))
        self.assertEqual(verdicts(results, 4)[None], pf.FAIL)
        self.assertIn("step 9 says its run counts toward requirement 1, which counts only runs with hands both",
                      evidence(results, 4, None))

    def test_broken_the_same_step_without_the_word_duet_fails_on_the_hands_played(self):
        rec = record()
        rec["steps"].append(duet_step(tool="Keep tempo"))
        results = run(rec, hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[9], pf.FAIL, evidence(results, 4, 9))
        self.assertIn("the app plays the other hand", evidence(results, 4, 9))

    def test_broken_a_keep_tempo_step_naming_one_hand_for_a_hands_both_requirement_fails(self):
        rec = record()
        rec["steps"].append(duet_step(tool="Keep tempo", scaffold=["notation"],
                                      action="Plays the left hand of the cell in C in Keep tempo. This is the counted run."))
        results = run(rec, hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[9], pf.FAIL, evidence(results, 4, 9))
        self.assertIn("the step names hand L alone", evidence(results, 4, 9))

    def test_a_step_that_says_both_hands_is_not_read_as_one_hand(self):
        rec = record()
        rec["steps"].append(duet_step(tool="Keep tempo", scaffold=["notation"],
                                      action="Plays the cell in C with both hands, the left hand under the right. "
                                             "This is the counted run."))
        results = run(rec, hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[9], pf.PASS, evidence(results, 4, 9))

    def test_broken_a_counted_run_of_an_item_the_hand_reading_class_reads_as_one_hand_fails(self):
        # The songs requirement names the left-hand cut: no run of it can record both hands.
        results = run(record(), hands_both(context(), 2))
        self.assertEqual(verdicts(results, 4)[6], pf.FAIL, evidence(results, 4, 6))
        self.assertIn("reads excerpt.p.b1-4.lh as hand L only", evidence(results, 4, 6))

    def test_a_one_hand_step_that_claims_nothing_would_count_nothing_and_is_not_applicable(self):
        rec = record()
        rec["steps"].append(duet_step(tool="Keep tempo", scaffold=["notation"],
                                      action="Plays the left hand of the cell in C in Keep tempo."))
        rec["steps"][-1]["recorded"] = "A session row with hands.appPlayed."
        results = run(rec, hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[9], pf.NA, evidence(results, 4, 9))
        self.assertIn("nothing would count: the run plays one hand", evidence(results, 4, 9))
        self.assertEqual(verdicts(results, 4)[None], pf.PASS, evidence(results, 4, None))

    def test_broken_an_update_saying_a_one_hand_run_counts_fails(self):
        rec = record()
        rec["evidence"]["updates"][0] = ("One Keep tempo run of exercise.cell.c with the left hand alone at the pass "
                                         "pair, opened from t.2.")
        results = run(rec, hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[None], pf.FAIL)
        self.assertIn("update 1 says a one-hand run of exercise.cell.c counts, and requirement 1 counts it only with hands both",
                      evidence(results, 4, None))

    def test_an_update_saying_both_hands_passes(self):
        rec = record()
        rec["evidence"]["updates"][0] = ("One Keep tempo run of exercise.cell.c with both hands at the pass pair, "
                                         "opened from t.2.")
        results = run(rec, hands_both(context(), 1))
        self.assertEqual(verdicts(results, 4)[None], pf.PASS, evidence(results, 4, None))

    def test_broken_a_hands_value_the_requirement_type_does_not_read(self):
        ctx = context()
        ctx.lesson("t.2")[2]["requirements"][0]["hands"] = "left"
        results = run(record(), ctx)
        self.assertEqual(verdicts(results, 4)[None], pf.FAIL)
        self.assertIn("carries hands 'left'", evidence(results, 4, None))

    def test_a_requirement_without_hands_behaves_exactly_as_before(self):
        # The same Duet step, counted, on the constructed tree with no hands field: the old verdict and evidence, and no
        # hands wording anywhere.
        rec = record()
        rec["steps"].append(duet_step())
        results = run(rec, context())
        self.assertEqual(verdicts(results, 4)[9], pf.FAIL)
        self.assertIn("the rung would not count it", evidence(results, 4, 9))
        self.assertNotIn("hands both", evidence(results, 4, 9) + evidence(results, 4, None))
        self.assertNotIn("one hand", evidence(results, 4, 9) + evidence(results, 4, None))
        self.assertEqual(verdicts(results, 4)[None], pf.PASS)
        # a one-hand Keep tempo step that says it counts toward nothing, on a requirement without hands, is still a leak
        rec = record()
        rec["steps"].append(duet_step(tool="Keep tempo", scaffold=["notation"],
                                      action="Plays the left hand of the cell in C. This counts toward nothing."))
        self.assertEqual(verdicts(run(rec, context()), 4)[9], pf.FAIL)
        # a one-hand Keep tempo step that is silent, on a requirement without hands, would still count and is a FAIL
        rec = record()
        rec["steps"].append(duet_step(tool="Keep tempo", scaffold=["notation"],
                                      action="Plays the left hand of the cell in C."))
        rec["steps"][-1]["recorded"] = "A session row."
        self.assertEqual(verdicts(run(rec, context()), 4)[9], pf.FAIL)

    def test_counted_by_prints_hands_both_in_its_label_and_only_then(self):
        ctx = context()
        lesson = ctx.lesson("t.2")[2]
        self.assertEqual(pf.counted_by("exercise.cell.c", lesson),
                         ["requirement 1 (runs from exercises, items ['exercise.cell.c'])"])
        hands_both(ctx, 1)
        self.assertEqual(pf.counted_by("exercise.cell.c", lesson),
                         ["requirement 1 (runs from exercises, hands both, items ['exercise.cell.c'])"])
        lesson["requirements"][0].pop("items")
        self.assertIn("hands both, unnamed: any of its", pf.counted_by("exercise.cell.c", lesson)[0])


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
        self.assertIn("toContainText([/complete/i])", text)  # every requirement held by the record's own runs: completion asserted
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


class Class6CountedDrill(unittest.TestCase):
    """PF2: a counted Reading-and-theory drill run has a journey template (A7b.1's counted minor drill)."""

    def plan(self, rec: dict, ctx: pf.Context):
        results, placement, plan = pf.run_record(rec, ctx)
        return results, placement, plan

    def test_a_counted_drill_opens_from_the_rungs_row_plays_its_cards_and_moves_the_counts_line(self):
        ctx = with_counted_drill(context())
        rec = drill_record()
        results, placement, plan = self.plan(rec, ctx)
        drill = [s for s in plan if s.kind == "drill"]
        self.assertEqual([s.record_step for s in drill], [len(rec["steps"])])
        self.assertEqual(drill[0].counts, "2 of 3")  # the cut run first (1 of 3), then the drill
        self.assertEqual(verdicts(results, 6)[len(rec["steps"])], pf.PASS)
        text = pf.render_journey(rec, ctx, placement, plan)
        self.assertIn('await openDrillRow(page, "A counted drill");', text)
        self.assertIn('await playDrillToFinish(page, midi, "drill.counted");', text)
        self.assertIn("expect(page.url()).toContain(`rung=${RUNG}`);", text)
        self.assertIn("toMatch(/2 of 3/)", text)
        self.assertNotIn("test.fixme(true, \"no journey template for the tool 'Reading and theory drills'", text)
        self.assertIn("installMidiMock", text)

    def test_the_drill_helper_reads_what_the_card_expects_and_leaves_no_card_unanswered(self):
        ctx = with_counted_drill(context())
        rec = drill_record()
        _results, placement, plan = self.plan(rec, ctx)
        text = pf.render_journey(rec, ctx, placement, plan)
        self.assertIn("data-expects", text)
        self.assertIn("'data-drill', 'finished'", text)
        self.assertIn("midi.noteOn(pitch, 90)", text)

    def test_a_drill_the_step_does_not_count_leaves_the_counts_line_where_it_was(self):
        ctx = with_counted_drill(context())
        rec = drill_record(counted=False)
        _results, placement, plan = self.plan(rec, ctx)
        drill = [s for s in plan if s.kind == "drill"][0]
        self.assertEqual(drill.counts, "unchanged")
        text = pf.render_journey(rec, ctx, placement, plan)
        self.assertIn("const before = await countsLine(page);", text)

    def test_broken_a_drill_kind_no_midi_answer_can_play_stays_a_fixme_line(self):
        ctx = with_counted_drill(context(), kind="rhythm")
        rec = drill_record()
        results, placement, plan = self.plan(rec, ctx)
        self.assertEqual([s.kind for s in plan][-1], "fixme")
        self.assertEqual(verdicts(results, 6)[len(rec["steps"])], pf.NA)
        self.assertIn("test.fixme(true", pf.render_journey(rec, ctx, placement, plan))

    def test_a_counted_drill_holding_its_named_requirement_passes_while_the_generic_one_stays_unheld(self):
        # PF3, A7b.1's shape (PF1-ability-journey-scope): the named drill, and any two distinct exercise runs. One drill
        # run holds the named requirement and gives the generic one 1 of its 2: the ability is demonstrated, the rung is
        # honestly partly complete ("1 of 2"), and no Plan completion is asserted. No second exercise run is added.
        ctx = with_counted_drill(context(), generic=True, songs=False)
        rec = a7b_record()
        results, placement, plan = self.plan(rec, ctx)
        self.assertEqual(verdicts(results, 6)[None], pf.PASS, evidence(results, 6, None))
        self.assertEqual([s.counts for s in plan if s.counts and s.counts != "unchanged"], ["1 of 2"])
        self.assertIn("completion not asserted on Plan", evidence(results, 6, None))
        self.assertIn("any 2 distinct runs from exercises", evidence(results, 6, None))
        text = pf.render_journey(rec, ctx, placement, plan)
        self.assertIn("toMatch(/1 of 2/)", text)
        self.assertNotIn("toContainText([/complete/i])", text)
        self.assertNotIn(".badge", text)  # the Plan row's complete badge is never read
        self.assertIn("No completion asserted", text)

    def test_broken_a_record_whose_counted_runs_hold_no_named_requirement_still_fails(self):
        # The drill is played but the step does not count it: nothing named is held, so the ability is not demonstrated.
        ctx = with_counted_drill(context(), generic=True, songs=False)
        results, _placement, _plan = self.plan(a7b_record(counted=False), ctx)
        self.assertEqual(verdicts(results, 6)[None], pf.FAIL)
        self.assertIn("leave a requirement that names its items unheld", evidence(results, 6, None))

    def test_broken_generic_runs_alone_do_not_demonstrate_a_named_requirement(self):
        # One counted cell run is 1 of the generic requirement's 2, so no requirement is held ("0 of 2"), and the named
        # drill requirement is left unheld.
        ctx = with_counted_drill(context(), generic=True, songs=False)
        rec = a7b_record(counted=False, cells=1)
        results, _placement, plan = self.plan(rec, ctx)
        self.assertEqual([s.counts for s in plan if s.counts and s.counts != "unchanged"], ["0 of 2"])
        self.assertEqual(verdicts(results, 6)[None], pf.FAIL)
        self.assertIn("leave a requirement that names its items unheld", evidence(results, 6, None))
        self.assertIn("drill.counted", evidence(results, 6, None))

    def test_the_chains_own_counted_steps_holding_the_whole_rung_may_assert_completion(self):
        # The complementary case (A7c.1's): the named drill and two exercise runs hold every requirement of the rung.
        ctx = with_counted_drill(context(), generic=True, songs=False)
        rec = a7b_record(cells=2)
        results, placement, plan = self.plan(rec, ctx)
        self.assertEqual(verdicts(results, 6)[None], pf.PASS, evidence(results, 6, None))
        self.assertIn("completion asserted on Plan", evidence(results, 6, None))
        text = pf.render_journey(rec, ctx, placement, plan)
        self.assertIn("toContainText([/complete/i])", text)
        self.assertNotIn("No completion asserted", text)

    def test_broken_a_generic_only_rung_held_part_way_names_no_evidence(self):
        # A rung whose only requirement is the generic "any two exercises", with one counted run: nothing names its items,
        # so there is no counted evidence of the ability to demonstrate.
        ctx = context()
        ctx.lesson("t.2")[2]["requirements"] = [{"kind": "runs", "from": "exercises", "count": 2}]
        rec = a7b_record(counted=False, cells=1)
        results, _placement, _plan = self.plan(rec, ctx)
        self.assertEqual(verdicts(results, 6)[None], pf.FAIL)
        self.assertIn("none names its items", evidence(results, 6, None))

    def test_the_second_exercise_run_completes_it(self):
        ctx = with_counted_drill(context(), generic=True)
        rec = drill_record(second_exercise=True)
        results, _placement, plan = self.plan(rec, ctx)
        self.assertEqual(verdicts(results, 6)[None], pf.PASS, evidence(results, 6, None))
        self.assertEqual([s.counts for s in plan if s.counts and s.counts != "unchanged"][-1], "3 of 3")

    def test_the_ear_drill_row_still_has_no_template(self):
        # The step that opens an ear drill is self-checked ("says its quality aloud"); only Reading and theory drills
        # are templated.
        ctx = with_counted_drill(context(), kind="ear-chord")
        rec = drill_record()
        rec["steps"][-1]["tool"] = "Ear drills"
        self.assertEqual([s.kind for s in self.plan(rec, ctx)[2]][-1], "fixme")


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

    def chains_root(self, name: str, **statuses: str) -> Path:
        """A root holding one record per ``ability=status`` (the abilities are the file names)."""
        root = SCRATCH / name
        shutil.rmtree(root, ignore_errors=True)
        (root / "docs" / "chains").mkdir(parents=True)
        for ability, status in statuses.items():
            (root / "docs" / "chains" / f"{ability}.yaml").write_text(
                yaml.safe_dump({"ability": ability, "status": status, "steps": []}), encoding="utf-8")
        return root

    def run_main(self, root: Path, *args: str) -> tuple[int, str]:
        import contextlib
        import io
        from unittest import mock

        failing = ([pf.Result(4, None, pf.FAIL, ["a constructed failure"])], pf.Placement("t.2", []), [])
        out = io.StringIO()
        with mock.patch.object(pf.Context, "from_tree", lambda root, content=None: context()), \
                mock.patch.object(pf, "run_record", lambda rec, ctx: failing), contextlib.redirect_stdout(out), \
                contextlib.redirect_stderr(out):
            code = pf.main(["--root", str(root), "--out", str(root / "out"), *args])
        return code, out.getvalue()

    def test_strict_blocks_a_reviewed_or_shipped_record_and_only_reports_a_drafts_fails(self):
        draft = self.chains_root("strict-draft", **{"D.1": "draft"})
        code, shown = self.run_main(draft, "--strict")
        self.assertEqual(code, 0, "a draft's FAILs are reported, not blocking")
        self.assertIn("1 FAIL in all", shown)
        self.assertIn("draft: 1 FAIL, not blocking", shown)
        for status in ("reviewed", "shipped"):
            with self.subTest(status=status):
                code, shown = self.run_main(self.chains_root(f"strict-{status}", **{"R.1": status}), "--strict")
                self.assertEqual(code, 1)
                self.assertIn(f"{status}: 1 FAIL, blocking", shown)

    def test_strict_with_a_draft_and_a_reviewed_record_blocks_on_the_reviewed_one_alone(self):
        root = self.chains_root("strict-mixed", **{"D.1": "draft", "R.1": "reviewed"})
        code, shown = self.run_main(root, "--strict")
        self.assertEqual(code, 1)
        self.assertIn("2 FAIL in all, 1 blocking", shown)
        # without --strict nothing blocks, whatever the status
        self.assertEqual(self.run_main(root)[0], 0)

    def test_strict_refuses_to_pass_having_run_no_record(self):
        # A path that matches nothing must not read as a pass.
        root = self.chains_root("strict-none")
        code, shown = self.run_main(root, "--strict")
        self.assertEqual(code, 2)
        self.assertIn("no record", shown)

    def test_a_record_without_a_known_status_blocks_under_strict(self):
        # Fail closed: only a draft is exempt.
        code, _shown = self.run_main(self.chains_root("strict-odd", **{"O.1": "approved"}), "--strict")
        self.assertEqual(code, 1)

    def test_no_built_catalogue_stops_the_run_with_exit_2(self):
        with self.assertRaises(pf.InputsMissing) as stop:
            pf.Context.from_tree(ROOT, SCRATCH / "no-such-content")
        self.assertIn("no built catalogue", str(stop.exception))
        from unittest import mock

        with mock.patch("sys.stderr"):
            self.assertEqual(pf.main(["--content", str(SCRATCH / "no-such-content"), "--out", str(SCRATCH / "cli2")]), 2)


class TheWorkflowStep(unittest.TestCase):
    """The strict preflight runs in ci.yml's content job, after the content build whose catalogue it reads (docs-integrity
    installs PyYAML alone and builds no content, so the preflight, which exits 2 without the catalogue, cannot run there)."""

    WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"

    def steps(self) -> list[tuple[str, str]]:
        text = self.WORKFLOW.read_text(encoding="utf-8")
        job = text.split("\n  content-and-unit:\n", 1)[1].split("\n  e2e:\n", 1)[0]
        parts = re.split(r"\n      - (?=name:|uses:)", "\n" + job.split("    steps:\n", 1)[1])
        found = []
        for part in (x for x in parts if x.strip()):
            name = re.match(r"name: (.+)", part)
            found.append((name.group(1).strip() if name else part.splitlines()[0], part))
        return found

    def test_the_step_runs_strict_after_the_content_build_and_asserts_its_own_file(self):
        steps = self.steps()
        names = [n for n, _ in steps]
        at = next(i for i, (_n, body) in enumerate(steps) if "tools/content/preflight_chains.py --strict" in body)
        self.assertGreater(at, names.index("Build content"), "the catalogue is built before the preflight reads it")
        body = steps[at][1]
        self.assertRegex(body, r"test -f tools/content/preflight_chains\.py", "a missing preflight must not pass silently")
        self.assertRegex(body, r"test -f app/public/content/catalog\.json")
        self.assertIn("--out build/preflight", body)  # never the committed docs/prompts/runs/PF1 reports
        self.assertNotIn("continue-on-error", body)
        self.assertEqual(sum("preflight_chains.py" in b for _n, b in steps), 1)

    def test_docs_integrity_does_not_run_it(self):
        # It builds nothing, so the preflight would exit 2 there; the reason is written where the step is.
        text = (ROOT / ".github" / "workflows" / "docs-integrity.yml").read_text(encoding="utf-8")
        self.assertNotIn("preflight_chains.py", text)
        self.assertIn("preflight_chains.py", self.WORKFLOW.read_text(encoding="utf-8"))


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

    # PF5 (``PF1-authored-hand-proof``): the C shuffle, A7a.1's authored two-staff control, on the real tree.
    SHUFFLE = "exercise.blues.twelve-bar-shuffle.c"

    def shuffle_class1(self, facts: list[dict]) -> dict[int, str]:
        rec = yaml.safe_load((ROOT / "docs/chains/A7a.1.yaml").read_text(encoding="utf-8"))
        ctx = pf.Context(root=ROOT, catalog=self.ctx.catalog, curriculum=self.ctx.curriculum, demands=self.ctx.demands,
                         facts=facts, excerpts=self.ctx.excerpts, code=self.ctx.code, content=self.ctx.content,
                         lesson_text=lambda rung: "", resolver=self.ctx.resolver, version=self.ctx.version())
        steps = {n: s for n, s in enumerate(rec["steps"], 1)
                 if (s.get("content") or {}).get("ref") == self.SHUFFLE and pf.norm(s.get("tool")) in pf.SCORE_TOOLS}
        self.assertTrue(steps, "A7a.1 has no Score-screen step on the C shuffle")
        found = {r.step: r.verdict for r in pf.check_hand_reading(rec, ctx) if r.step in steps}
        self.assertEqual(sorted(found), sorted(steps))
        return found

    def test_the_shuffle_voices_are_read_from_its_built_file(self):
        voices, why = self.ctx.voices(self.SHUFFLE)
        self.assertEqual(why, "")
        self.assertEqual(voices, {n: {(1, 1), (2, 2)} for n in range(1, 13)})

    def test_a7a1_the_shuffle_steps_pass_class_1_on_the_committed_hand_facts(self):
        self.assertEqual(set(self.shuffle_class1(self.ctx.facts).values()), {pf.PASS})

    def test_broken_a7a1_without_the_shuffles_hand_facts_fails_class_1_on_every_shuffle_step(self):
        without = [f for f in self.ctx.facts if not (f.get("item") == self.SHUFFLE and f.get("kind") == "hand")]
        self.assertEqual(set(self.shuffle_class1(without).values()), {pf.FAIL})

    def test_broken_a7a1_with_the_shuffles_hand_facts_on_another_identity_fails_class_1(self):
        moved = [{**f, "identity": {"kind": "file", "sha256": "0" * 64}} if f.get("item") == self.SHUFFLE else f
                 for f in self.ctx.facts]
        self.assertEqual(set(self.shuffle_class1(moved).values()), {pf.FAIL})

    def test_broken_a7a1_with_one_of_the_shuffles_two_lines_unproved_fails_class_1(self):
        rows = [f for f in self.ctx.facts if f.get("item") == self.SHUFFLE and f.get("kind") == "hand"]
        self.assertEqual(sorted((f["staff"], f["voice"], f["fact"]) for f in rows), [(1, 1, "R"), (2, 2, "L")])
        one = [f for f in self.ctx.facts if f not in rows] + [r for r in rows if r["staff"] == 2]
        self.assertEqual(set(self.shuffle_class1(one).values()), {pf.FAIL})

    def test_the_generated_journey_pairs_every_record_step_with_the_hand_written_walk(self):
        spec = ROOT / "app/tests/e2e/a7c1-phone-walk.spec.ts"
        _results, _placement, plan = pf.run_record(self.rec, self.ctx)
        lines = pf.compare_journey(plan, pf.parse_written_journey(spec.read_text(encoding="utf-8")))
        self.assertEqual([line for line in lines if "no hand-written step" in line or "no record step pairs" in line], [])


if __name__ == "__main__":
    unittest.main()
