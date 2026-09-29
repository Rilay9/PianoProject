"""Doc-splice (Entry 121): the doc rows of Entries 109, 112-116 spliced into docs/03, docs/04 and docs/08.

Every operation names an anchor that must occur exactly once in its file, and either inserts whole lines
after the line holding the anchor, or replaces one substring (which must occur exactly once) with a longer
one that keeps it or corrects it. Nothing is re-serialised: the files are read and written as text with
their CRLF line endings kept. Idempotent: an operation whose inserted key phrase is already in the file is
skipped and reported "already present".

Run from the repository root: `python docs/prompts/runs/Doc-splice/scripts/splice.py`.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
D03 = "docs/03-content-pipeline.md"
D04 = "docs/04-ui-spec.md"
D08 = "docs/08-test-map.md"


def wrap(text: str, width: int, first: str, rest: str) -> list[str]:
    """Greedy fill, never breaking inside a backtick span."""
    tokens: list[str] = []
    for piece in re.findall(r"(?:`[^`]*`|[^\s`])+", text):
        tokens.append(piece)
    lines: list[str] = []
    line = first
    empty = True
    for token in tokens:
        candidate = line + ("" if empty else " ") + token
        if not empty and len(candidate) > width:
            lines.append(line)
            line = rest + token
        else:
            line = candidate
        empty = False
    lines.append(line)
    return lines


# ---- docs/08 -----------------------------------------------------------------------------------------

G1_ROW = (
    "| **What the learner met, and first contact from it** (G1; Part 27, L97; the brief approved with its "
    "required change, `responses/7863bee.md`; the durability constraint, `responses/9193261.md`): `db.ts` "
    "version 8 (`encounters`, `contacts`), `encounterStore` (`recordEncounter`, `familiarityIn`, "
    "`firstContactIn`, `historyFor`, `familiarity`), the Score screen's visit, viewing, playback writes, "
    "history read, derivation and recheck, `progressStore.pruneSessions`'s fold (`foldRun`, "
    "`mergeSummaries`), `contact` with `how`, `material.textIdentity`, `db.isPhraseRun`, the backup's join "
    "| a phrase played to the learner on one visit and read on the next recorded as a first reading; this "
    "visit's viewing counted against it, or another visit's (a reload, a return, another tab — before this "
    "one opened or after) not counted; a playback written as both kinds, or *Hear it* as a hearing; a "
    "viewing in Blind; bars 1–8 practised making bars 25–32 or the whole piece familiar; excerpt A making "
    "excerpt B or the whole familiar; the whole piece leaving its excerpt new; another arrangement claiming "
    "this notation read; a phrase met by its row's id; a duplicate import restoring first contact; the cap "
    "deleting the only proof a passage was practised; a summary carrying evidence or growing on a second "
    "fold; a restore overwriting a device's summary; a piece played again losing its pass or rung credit to "
    "the first-contact fact | `app/tests/unit/encounterModel.test.ts`, `firstContactOnTheScore.test.ts`, "
    "`encounterRetention.test.ts` (added); `tests/e2e/lab.spec.ts` (one case added); "
    "`contactNovelty.test.ts`, `observationsFromRun.test.ts`, `backup.test.ts`, `help.test.ts` (revised) — "
    "red on the committed code; 25 mutants caught | done (G1, Entry 112); nothing heard; the reload, return, "
    "two-tab and held-bar cases unit only; the session's offer reads runs only (Not done 1) |"
)

ETAIL_ROW = (
    "| **E-tail**: the excerpt-target warning (E29), edition texts and cut version 2 (E33), private-use "
    "glyphs drawn (E31), a text metronome mark read at import (E32), retention's `only` filter reached "
    "(E37), the measuring fingerprint and the untrusted due rule (E40, E41), converter stamps and what the "
    "door does not know (E42), the desktop line (E35), the learner's stated tempo (E48) | a cut approved "
    "for what it does not carry passing silently; a band direction or a copyright line in a cut; an "
    "approval carried to a new cutter's cut; a box for a chord's accidental; a printed tempo played at the "
    "default; an excerpt retained as a piece; stored imports never re-measured after a detector change; a "
    "converter's inferred staves read as authored; a learner's stated tempo overwritten by the launch | "
    "`tools/content/tests/test_validate_excerpts.py`, `test_excerpts.py`, "
    "`app/tests/unit/importMeasuredTruth.test.ts`, `textGlyphs.test.ts`, `excerptItems.test.ts`, "
    "`app/tests/e2e/excerpts.spec.ts` | done (E-tail, Entry 115); nothing heard |"
)

Q47_ROW = (
    "| **The MIDI converter on real recordings, and the port's hand split, in CI** (Q47 with Q46; the brief "
    "approved with one required change, `responses/f52ebde.md`): `fetch_maestro.py` fetches three MAESTRO "
    "v3.0.0 performances in the step \"Fetch the MAESTRO test recordings\", verified against the published "
    "SHA256, mapped by member path against the archive's metadata and pinned member bytes, a restored cache "
    "validated; `TestRealRecordings` fails under CI without them and skips on a developer's checkout; "
    "`parity_reference.py` fails on a missing committed fixture, and under CI on a missing recording, and "
    "writes the committed one-track fixture with a hand split | nine converter invariants (among them no "
    "note lost or invented between the file and the score) and the port's hand split never checked in CI "
    "because their inputs were absent and the tests skipped; a composer–title–year match taking the other "
    "2011 BWV 885 performance; a cache restore trusted as proof; a partial fetch hidden by references "
    "written for the committed fixtures | `tools/midi-cleanup/tests/test_converter.py` "
    "(`TestTheRealRecordingsGate`, added; `TestRealRecordings`, the skip site revised), "
    "`test_fetch_maestro.py` (added), `test_parity_reference.py` (added), `app/tests/unit/midiParity.test.ts` "
    "(*splits the hands the same way* on `one-track-two-hands` and on the three recordings), "
    "`tools/content/tests/test_ci_order.py` (the MAESTRO steps' order) — red on the committed code, 17 "
    "mutants red (`docs/prompts/runs/Q47/`) | done (Q47, Entry 113); the runner's proof read at the "
    "reviewer's acceptance, as the entry's amendment records (runs 36523543429 and 36525222177: the fetch, "
    "the harness, the parity reference and the unit tests passed, the second from a validated restore); "
    "nothing heard |"
)

U74_ROW = (
    "| **The first window at open, on every path in** (U74; U42's product part) | the window priced before "
    "the piece was measured: one system for the whole window at a smaller staff, re-planned on idle after "
    "the first paint, on every open and after every engraving search; D4's and D4a's pictures of the "
    "two-bar scale from Today caught it and were read as a path difference | "
    "`tests/unit/windowRendererStage.test.ts` (the real renderer against a controlled stage: the four "
    "causes, the first draw, the measurement per settled zoom, the search's shape, the deferred word), "
    "`tests/e2e/score-fit-paths.spec.ts` (the two paths settled alike; the first frame is the settled layout "
    "on both) — the first-draw cases red on the committed code | done for pieces within the probe's reach "
    "(U74, 2026-09-29); longer pieces keep the idle re-plan; the screen's own height change after the first "
    "draw (the bar and the keyboard strip) not covered |"
)

CI_PARAGRAPH = (
    "**CI** (`.github/workflows/ci.yml`) runs the full required suites on a push to the branch: the content "
    "build and its tests, the MAESTRO fetch, the converter harness and the parity reference, lint, "
    "typecheck, unit, e2e, the app build, the render check and a second validation; "
    "`tools/content/tests/test_ci_order.py` holds the order and asserts that CI runs every check the "
    "path-to-checks map names. A push that touches only the record and the review stream (`docs/review/`, "
    "the entries and their runs and pictures under `docs/prompts/`, `docs/pending-review.md`, "
    "`docs/prompts/in-flight.md`, `.claude/`) starts no run (Q63, `paths-ignore`). One run per branch runs "
    "at a time and the run in progress completes: a push that arrives meanwhile waits in the one pending "
    "slot, a newer one replaces it, and the replaced tree gets no conclusion of its own (the concurrency "
    "rule). The reviewer's views are checked on every push by `.github/workflows/docs-integrity.yml` "
    "(`test_prompt_views`, without the app's suites; a newer push cancels an older docs run) and again in "
    "the full run's content tests; the "
    "validator's last step regenerates them everywhere but on GitHub's runner, where it compares and writes "
    "nothing. The minimum checks for the paths a landing touches are `docs/prompts/checks.json`, printed by "
    "`tools/docs/checks_for_paths.py`; a path no pattern names takes the full suites and is printed as "
    "unmatched. `tools/docs/evidence_manifest.py <seam>` writes the seam's evidence (captures, exits, "
    "changed files, chain, CI) as `runs/<seam>/MANIFEST.md`. (Q-tooling, Entry 116. The ignore list, the "
    "concurrency rule and where the docs' own checks run are as the two workflows read at 71ee5f4: the "
    "entry's text had every docs-only push ignored, a code push cancelling the run in progress and the "
    "docs' checks waiting for the next code push — Q63's first form, which ef80e86 and b51579a replaced; "
    "Doc-splice, Entry 121.)"
)

FIT_PATHS_E2E = (
    "- `score-fit-paths.spec.ts` — the score fills the stage on every path in (U74): the two-bar blues "
    "scale at 342 × 740 with D4's seeded learner settles to the same stage box, systems, bars and staff "
    "from Today and by a link after a fresh load of the same route, and from the first frame that draws it "
    "the stage shows the settled layout on both paths — every frame recorded by the page from before the "
    "tap."
)

ENCOUNTER_MODEL = (
    "- `encounterModel.test.ts` — the encounter model (G1): the material key against D4's equality; an "
    "import's identity its text's sha256; the version-7 upgrade leaving every store as it was; encounters "
    "stored, found by material, kept in memory without a database; the backup's two stores, a merge "
    "restored twice adding nothing and joining summaries; the query per facet (the kinds, heard the "
    "superset, the run facets by what happened, the range rule, parent to excerpt and not back, an excerpt "
    "over practised bars, the composition facet, a legacy history by id, a phrase never by its row's id, "
    "the visit, a pruned run's summary); first contact on constructed visits; contact with `how`, D4's "
    "verdicts; the summary's join and its id; a piece played again passing, meeting its rung, flagged "
    "nothing; the Score screen the one writer."
)

ENCOUNTER_RETENTION = (
    "- `encounterRetention.test.ts` — the retention adversary (G1): a practised passage and a legacy run "
    "pruned by the real job at the real cap; the passage still practised, the other passage novel, the "
    "excerpts right, contact met with `how`, the legacy id met by id; a backup after the prune restoring "
    "the same answers."
)

FIRST_CONTACT = (
    "- `firstContactOnTheScore.test.ts` — the Score screen writes what the learner met and reads it back "
    "(G1): one viewing a visit with its source and visit, none in Blind; `Hear it` and a held bar a "
    "demonstration, *Play it to me* a hearing; heard then read on another visit (the sheet's sentence as "
    "drawn, no first-contact evidence), viewed earlier, viewed now, a reload, two tabs before and after "
    "opening, a run under another row id; a piece's first and second runs, an excerpt beside other bars "
    "and of a piece played whole, a duplicate import by its bytes."
)

WINDOW_STAGE = (
    "- `windowRendererStage.test.ts` — the real `WindowRenderer` against a stage the test controls, the "
    "engraver stood in (U74): a change delivered inside a fit, an off-run height change, a width change "
    "off and during a run, and a taller stage met first all come out as a renderer made on the final "
    "stage; the first window drawn is the settled one; the probe is measured once per settled zoom and "
    "never at a search's trial zoom; the search re-engraves the window it sizes; a piece past the probe's "
    "reach keeps the idle load; `data-settled` is said a frame after the fit and taken back by a stage "
    "change."
)

CHECKS_FOR_PATHS = (
    "- `test_checks_for_paths.py` — the path-to-checks map (Q65). The union is deduplicated and kept in "
    "the chain's order, the whole suite wins over named files, and `{self}` and globs are expanded. A path "
    "under no pattern takes the full suites, is printed as unmatched, and is never refused. On the "
    "committed map, every name exists, every pattern matches a path, a lesson edit is covered, and a "
    "docs-only change runs nothing (Q-tooling)."
)

CI_ORDER = (
    "- `test_ci_order.py` — the CI workflow's order where it is the point (Q24): the build before the "
    "content tests, the converter harness present, the parity reference before the unit tests, and (Q47) "
    "the MAESTRO restore, fetch and save before the harness and the reference; and that the steps the "
    "gated failure messages cite exist. Since Q-tooling, CI also runs every check the path map names; the "
    "state gallery is the one pinned exception."
)

EVIDENCE_MANIFEST = (
    "- `test_evidence_manifest.py` — the evidence manifest (Q64), on a fixture folder in a throwaway "
    "repository: for each capture its command, and its exit read from the last line, a `.done` file beside "
    "it, or F2's first-line label; its size and sha256 as git stores it; the changed files with blob ids, "
    "the red lines, the mutants and the chain; a capture naming a command with no exit is refused, one "
    "with no command line is named in its own list; the CI run reported is the first carrying one that "
    "finished (Q-tooling)."
)

MATRIX_EDIT = (
    "- `test_matrix_edit.py` — the record scripts' table edits by row id. It refuses a stale old text, a "
    "no-op, a doubled match, a lost id and a row of a different width. Each step searches what the last one "
    "left, a refused batch writes nothing, and the views are regenerated after the matrix is written "
    "(Q-tooling)."
)

PROMPT_VIEWS = (
    "- `test_prompt_views.py` — the reviewer's views match the canonical files. This is the gate for a "
    "stale commit (the reviewer's request, 2026-09-26; the line Q-tooling's)."
)

PROMPT_VIEWS_REFRESH = (
    "- `test_prompt_views_refresh.py` — the validator's last step regenerates stale views and then "
    "compares. On GitHub's runner it compares and writes nothing, so `test_prompt_views` still fails a "
    "stale commit (Q-tooling)."
)

FETCH_MAESTRO = (
    "- `fetch_maestro.py` — not a test: the CI step \"Fetch the MAESTRO test recordings\", and a "
    "developer's way to the three performances. It verifies the archive's published SHA256, maps each "
    "alias to one archive member by path against the archive's metadata, pins each member's bytes, and "
    "writes `build/midi-real/` with `SOURCE.md` (members, version, checksum, licence quoted, citation). "
    "With `--cache-hit true` it validates a restore and never downloads (Q47)."
)

TEST_FETCH_MAESTRO = (
    "- `test_fetch_maestro.py` — the fetch's rules on a fixture archive: the checksum before extraction, a "
    "member listed zero or several times, a row naming another performance, an empty, absent or altered "
    "member refused with nothing written, exactly three files and `SOURCE.md`, a restored cache validated; "
    "the real aliases equal the harness's (Q47)."
)

TEST_PARITY_REFERENCE = (
    "- `test_parity_reference.py` — the reference writer's gates: the one-track fixture written with a "
    "split, a must-split fixture refused without one and its earlier reference removed, a missing "
    "recording failing under CI after the rest is written and reported otherwise, a missing committed "
    "fixture failing (Q47)."
)

MIDI_FIXTURES = (
    "- `fixtures/` — `make-one-track-two-hands-midi.py` and the `one-track-two-hands.mid` it writes: both "
    "hands in one note track, deterministic, its notes stated in the script (Q46)."
)

# ---- docs/04 -----------------------------------------------------------------------------------------

U74_PARAGRAPH = (
    "**The first window is the measured one (U74, 2026-09-29).** A piece within the probe's reach has its "
    "probe loaded with the slots and measured before the first window is priced, so the first frame that "
    "draws the music draws the shape and size it settles on. Before, the chooser had nothing to price with, "
    "drew the whole window as one system, and re-planned when the measurement landed on idle, after the "
    "first paint — the one small system at the top of an empty stage in D4's pictures of the two-bar scale, "
    "on every path in (the two paths settled alike; the pictures were taken before they settled). Before "
    "the first note, the piece is measured again at each engraving zoom the fit settles on, never at a zoom "
    "the engraving search only tries, and the search re-engraves the shape on the glass. A longer piece "
    "keeps the idle load and its first-window re-plan. `data-settled` is said a frame after the fit, once "
    "the stage has held still through that frame; any stage change takes it back. The observer refits "
    "every stage change (a height alone off a run; a width always, releasing and retaking a run's size), "
    "as it did."
)

# ---- docs/03 -----------------------------------------------------------------------------------------

E42_CONVERTERS = (
    "`CONVERTER_STAMPS` lists each recognised converter's stamp and what it converted from; any other "
    "MusicXML keeps its staves and signature authored, and the `via` names what the encoding block names "
    "and says the door does not know whether an edition or a converter from MIDI wrote them. MuseScore's "
    "name is not a stamp: its exports carry it however the score was made (E42)."
)

E40_MEASURED_UNDER = (
    "For a score the detectors measured, `value` is `\"<converter version>;<measuring fingerprint>\"` "
    "(E40); the fingerprint is `app/src/data/measuringFingerprint.ts`'s (the detectors, the model, the "
    "vocabulary, the density file, the engraver's release), never compared with the build's. The launch "
    "also measures a measured row under other definitions or none (`definitions`), and one whose tempo is "
    "inferred with a tempo-sensitive demand and no untrusted list (`untrusted`, E41); a PDF or an "
    "unreadable file follows the version alone."
)

E32_TEMPO = (
    "**An import's tempo** (E32, E48): where the file writes no `<sound tempo>` or `<metronome>`, a words "
    "direction that is only a metronome mark is read at import (E32; the glyph mapped from SMuFL's code "
    "point, the metre's beat in x/4 or x/2 where the glyph is missing) and written as a measure-level "
    "`<sound tempo>` beside it; `facts.tempo` authored, quoting the mark. The learner states a tempo "
    "through `importStore.stateImportTempo` (E48), which writes it into the first bar, measures again, "
    "names the learner in `facts.tempo`, clears only the untrusted entries the tempo resolves and never "
    "loses to a launch measurement."
)

E33_BLOCK = (
    "`approvedCutVersion` (the cutter the approval was merged under; below `cutVersion`, stale by cut "
    "version, carried to nothing) and `dropped` (the edition's texts the cutter left out) are in the block "
    "too (E33)."
)

G1_IMPORT_IDENTITY = (
    "**An import's identity** (G1): the build keys none, and the catalogue row an import becomes carries no "
    "bytes, so `material.materialOfItem` answers `none` for it; where the Score screen loads the stored "
    "score it hashes the text (`material.textIdentity`: the sha256 of its UTF-8 bytes) and the import's runs "
    "and encounters carry `{kind: 'file', sha256}` — a duplicate import under a new id is the same material. "
    "An excerpt's `fromBar`/`toBar` also scope what the learner met: the encounter query normalises an "
    "excerpt's bars into its parent's by them (`encounterStore.familiarityIn`)."
)

E29_DEFINITION = (
    "`cutVersion` is recorded by the merge (E33); `validate.py` also warns a row merged under an older "
    "cutter and a target the built cut does not establish (E29), naming the count."
)

E33_CUT_E31 = (
    "The edition's texts that are not the music are left out — a copyright or licence line, a swing the app "
    "does not play, a direction to other players — each listed in `dropped` (E33, cut version 2). The "
    "renderer draws SMuFL's private-use accidentals and metronome notes in an edition's text as their "
    "Unicode characters, in a cut and in every other score it loads (`OsmdView.load`, E31); the file is "
    "unchanged."
)

# (file, kind, anchor, payload, key phrase for idempotence)
#   kind "after": insert payload lines after the one line containing anchor
#   kind "replace": replace the one occurrence of anchor (a substring) with payload
OPS: list[tuple[str, str, str, object, str]] = [
    # docs/08, the pieces table
    (D08, "after", "| **The transfer offer's relationship persisted before play** (D4a;", [G1_ROW],
     "**What the learner met, and first contact from it**"),
    (D08, "after", "| **One public gate; novelty bound to D4; the seed concepts passed to the concept prompts** (E2a;",
     [ETAIL_ROW], "| **E-tail**:"),
    (D08, "after", "| **A key signature Humdrum writes between two bars** (`convert.py`: `place_loose_attributes`)",
     [Q47_ROW], "**The MIDI converter on real recordings, and the port's hand split, in CI**"),
    (D08, "after", "| **How many systems the stage holds, and who decides it** |", [U74_ROW],
     "**The first window at open, on every path in**"),
    # docs/08, how to run the pieces
    (D08, "after", "`playwright.states.config.ts`.", [""] + wrap(CI_PARAGRAPH, 99, "", ""),
     "**CI** (`.github/workflows/ci.yml`)"),
    # docs/08, the e2e list
    (D08, "after", "  breakpoint (B's remainder, a sweep).", [FIT_PATHS_E2E], "- `score-fit-paths.spec.ts` —"),
    (D08, "replace", "and never on a shape that then changes);",
     "and never on a shape that then changes; since U74 said a frame after the fit, once the stage has held "
     "still, and taken back by any stage change);",
     "since U74 said a frame after the fit, once the stage has held still, and taken back by any stage change"),
    (D08, "append", "- `lab.spec.ts` — the accompaniment lab from the Library line",
     " Since G1, today's phrase demonstrated at noon, the screen left, read in the evening (the clock fixed "
     "by the test): the run `unseen: false`, the sheet's *not heard* sentence, and Progress's history line "
     "*not first sight*.",
     "Since G1, today's phrase demonstrated at noon"),
    # docs/08, the unit list
    (D08, "replace", "*not measured* included (C1).",
     "*not measured* included (C1); the encounters and the summaries of pruned runs (G1).",
     "the encounters and the summaries of pruned runs (G1)"),
    (D08, "replace", "and the store's every row read through `contact`.",
     "and the store's every row read through `contact`; since G1 a `met` says how (G1; this file's rows are "
     "runs, and `contact` reading the encounters and pruned runs' summaries beside them is held in "
     "`encounterModel.test.ts` and `encounterRetention.test.ts` — Doc-splice, Entry 121).",
     "since G1 a `met` says how"),
    (D08, "after", "- `el.test.ts` —", [ENCOUNTER_MODEL, ENCOUNTER_RETENTION], "- `encounterModel.test.ts` —"),
    (D08, "after", "- `fallbackOrder.test.ts` —", [FIRST_CONTACT], "- `firstContactOnTheScore.test.ts` —"),
    (D08, "replace", "and C3's *Not judged* sentences;", "and C3's *Not judged* sentences and G1's *seen before* sentence;",
     "and G1's *seen before* sentence"),
    (D08, "replace", "the input and range, `unseen` true and false, `demonstrated`.",
     "the input and range, `unseen` true and false, and on a piece since G1, `demonstrated`.",
     "`unseen` true and false, and on a piece since G1"),
    (D08, "replace", "and the two committed MIDI fixtures converted with `hands=auto`: the same tracks, grid, swing "
     "counts, quantised onsets, hand split and boundary, key,",
     "the app's two committed MIDI fixtures and `tools/midi-cleanup/tests/fixtures/one-track-two-hands.mid`, "
     "the last three converted with `hands=auto`: the same tracks, grid, swing counts, quantised onsets, key,",
     "`tools/midi-cleanup/tests/fixtures/one-track-two-hands.mid`, the last three converted with `hands=auto`"),
    (D08, "replace", "read back off each side's written file. Skips with a message naming "
     "`tools/midi-cleanup/tests/parity_reference.py` when `build/midi-parity/` is not there.",
     "read back off each side's written file. The hand split and its boundary are compared on the one-track "
     "fixture on every run, and on the three recordings wherever they are present (in CI always, Q47). Fails "
     "naming `tools/midi-cleanup/tests/parity_reference.py` and the CI step when `build/midi-parity/` is not "
     "there (Q24).",
     "The hand split and its boundary are compared on the one-track fixture on every run"),
    (D08, "after", "- `wavEncode.test.ts` —", [WINDOW_STAGE], "- `windowRendererStage.test.ts` —"),
    # docs/08, tools/content/tests
    (D08, "after", "- `test_bar_splits.py` —", [CHECKS_FOR_PATHS, CI_ORDER], "- `test_checks_for_paths.py` —"),
    (D08, "after", "- `test_evidence_gate.py` —", [EVIDENCE_MANIFEST], "- `test_evidence_manifest.py` —"),
    (D08, "after", "- `test_licensing.py` —", [MATRIX_EDIT], "- `test_matrix_edit.py` —"),
    (D08, "after", "- `test_physical_gate.py` —", [PROMPT_VIEWS, PROMPT_VIEWS_REFRESH], "- `test_prompt_views.py` —"),
    (D08, "replace", "- `test_technique_units.py` — `add_technique_units.py` is idempotent.",
     "- `test_technique_units.py` — `add_technique_units.py` is idempotent; reads the generated catalogue "
     "from the repository's `build/`, from any working directory (Q46).",
     "from any working directory (Q46)"),
    # docs/08, tools/midi-cleanup/tests
    (D08, "replace", "and the app's own `crossed-hands.mid` and `two-hands.mid` (`hands=auto`, the option the app "
     "passes).",
     "and committed MIDI fixtures (`hands=auto`, the option the app passes): the app's `crossed-hands.mid` and "
     "`two-hands.mid`, and `fixtures/one-track-two-hands.mid`, whose reference must hold a hand split. It "
     "fails on a missing committed fixture, and under CI on a missing recording after writing the rest (Q47).",
     "whose reference must hold a hand split. It fails on a missing committed fixture"),
    (D08, "replace", "The cases that need the three real Disklavier recordings are `skipUnless`, because `build/` "
     "is gitignored; the skip message names the files.",
     "The cases that need the three real Disklavier recordings skip on a developer's checkout and fail under "
     "CI, naming `fetch_maestro.py` and the step \"Fetch the MAESTRO test recordings\" (Q47); "
     "`TestTheRealRecordingsGate` holds that rule with the files made absent.",
     "skip on a developer's checkout and fail under CI, naming `fetch_maestro.py`"),
    (D08, "before", "- `parity_reference.py` — not a test: it writes what each stage of the converter decided",
     [FETCH_MAESTRO], "- `fetch_maestro.py` — not a test"),
    (D08, "after", "- `test_converter.py` — the committed harness for `midi_to_musicxml.py`:",
     [TEST_FETCH_MAESTRO, TEST_PARITY_REFERENCE, MIDI_FIXTURES], "- `test_fetch_maestro.py` —"),
    # docs/04 §5
    (D04, "replace", "(one frame after the first draw)",
     "(before the first draw, for a piece within the probe's reach of 48 bars; on idle after it for a "
     "longer one; U74)",
     "(before the first draw, for a piece within the probe's reach of 48 bars; on idle after it for a longer one"),
    (D04, "after", "that still shrinks it, once.", [""] + wrap(U74_PARAGRAPH, 95, "", ""),
     "**The first window is the measured one (U74, 2026-09-29).**"),
    # docs/03 §4a
    (D03, "after", "  their versions move separately.", wrap(E42_CONVERTERS, 99, "  ", "  "),
     "`CONVERTER_STAMPS` lists each recognised converter's stamp"),
    (D03, "after", "  it came through is not on the row.",
     wrap(E40_MEASURED_UNDER, 99, "  ", "  ") + wrap(E32_TEMPO, 99, "- ", "  "),
     "`importStore.stateImportTempo` (E48)"),
    (D03, "after", "  cut, the level estimated on the cut, the hands and the boundary authored by the approved row.",
     wrap(E33_BLOCK, 99, "  ", "  "), "`approvedCutVersion` (the cutter the approval was merged under"),
    (D03, "after", "  §4c has the rest.", wrap(G1_IMPORT_IDENTITY, 99, "- ", "  "), "**An import's identity** (G1)"),
    # docs/03 §4c
    (D03, "after", "  parent bytes is warned as stale.", wrap(E29_DEFINITION, 99, "  ", "  "),
     "`cutVersion` is recorded by the merge (E33)"),
    (D03, "after", "  (the parent's, whole), which the Library's Source and Licence rows and the lesson row show.",
     wrap(E33_CUT_E31, 99, "  ", "  "), "each listed in `dropped` (E33, cut version 2)"),
]


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text)


def main() -> int:
    files: dict[str, list[str]] = {}
    ends: dict[str, bool] = {}
    for path in (D03, D04, D08):
        raw = (ROOT / path).read_bytes().decode("utf-8")
        ends[path] = raw.endswith("\r\n")
        body = raw[:-2] if ends[path] else raw
        if "\n" in body.replace("\r\n", ""):
            print(f"{path}: mixed line endings; refusing to write")
            return 1
        files[path] = body.split("\r\n")
    failed = 0
    for path, kind, anchor, payload, key in OPS:
        lines = files[path]
        if key in squash("\n".join(lines)) or key in "\n".join(lines):
            print(f"already present  {path}: {key[:70]}")
            continue
        if kind in ("after", "before", "append"):
            hits = [i for i, line in enumerate(lines) if anchor in line]
            if len(hits) != 1:
                print(f"REFUSED  {path}: anchor {anchor[:70]!r} found on {len(hits)} lines")
                failed += 1
                continue
            at = hits[0]
            if kind == "append":
                lines[at] = lines[at] + str(payload)
                print(f"appended {path}: line {at + 1} gains {len(str(payload))} chars ({anchor[:50]!r})")
                continue
            new = list(payload)  # type: ignore[arg-type]
            where = at + 1 if kind == "after" else at
            lines[where:where] = new
            print(f"inserted {path}: {len(new)} line(s) {kind} line {at + 1} ({anchor[:50]!r}); now lines {where + 1}-{where + len(new)}")
        else:
            whole = "\r\n".join(lines)
            count = whole.count(anchor)
            if count != 1:
                print(f"REFUSED  {path}: replace anchor {anchor[:70]!r} found {count} times")
                failed += 1
                continue
            line_no = whole[:whole.index(anchor)].count("\r\n") + 1
            whole = whole.replace(anchor, str(payload))
            files[path] = lines = whole.split("\r\n")
            print(f"replaced {path}: line {line_no}, {len(anchor)} chars -> {len(str(payload))} chars ({anchor[:50]!r})")
    if failed:
        print(f"{failed} operation(s) refused; nothing written")
        return 1
    for path, lines in files.items():
        text = "\r\n".join(lines) + ("\r\n" if ends[path] else "")
        (ROOT / path).write_bytes(text.encode("utf-8"))
    print(f"{len(OPS)} operations; files written: {', '.join(files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
