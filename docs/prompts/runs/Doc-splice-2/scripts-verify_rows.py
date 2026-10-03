"""Doc-splice-2: each doc row's code facts at HEAD, and how often its key phrase is in its target.

Read only. For every row: the target file and the count of the row's key phrase in it (0 before the
splice, 1 after, or the count of an already-present row), then each code fact the row names — a file
and a pattern — with the first line that matches, or MISSING. Run from the worktree root:

    python docs/prompts/runs/Doc-splice-2/scripts-verify_rows.py

Exit 1 if any code fact is missing (a row whose code is not at HEAD is not spliced).
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
A = 'app/src/'
T = 'app/tests/'
C = 'tools/content/'

# (row, target doc, key phrase in the target, [(file, regex), ...])
ROWS: list[tuple[str, str, str, list[tuple[str, str]]]] = [
    # --- Q65a (Entry 120) and Q65b (Entry 124): docs/08's run section and the map's test line
    ('120-a', 'docs/08-test-map.md', 'a push that\narrives meanwhile waits in the one pending slot', [('.github/workflows/ci.yml', r'cancel-in-progress:\s*false'), (C + 'tests/test_ci_order.py', r'def test_')]),
    ('120-b', 'docs/08-test-map.md', '**The minimum for a landing**', [('docs/prompts/checks.json', r'the map never subtracts one'), ('docs/prompts/checks.json', r'"pattern": "app/vite.config.ts"'), (C + 'tests/test_checks_for_paths.py', r'def test_every_named_file_exists')]),
    ('120-c', 'docs/08-test-map.md', '`score-fit-paths.spec.ts` — the score fills the stage on every path in (U74)', [(T + 'e2e/score-fit-paths.spec.ts', r'test\(')]),
    ('120-d', 'docs/08-test-map.md', 'Since Q65a it also holds the minimum semantics', [(C + 'tests/test_checks_for_paths.py', r'class TheMinimumSemantics'), (C + 'tests/test_checks_for_paths.py', r'def test_a_machine_read_docs_path_runs_its_readers'), ('docs/prompts/runs/Q65a/scripts-mutants.py', r'.')]),
    ('124-a', 'docs/08-test-map.md', 'The two screen frames, `screenFrame.ts` and `subScreen.ts`', [(C + 'tests/test_checks_for_paths.py', r'def test_a_frame_helper_names_the_union_of_its_screens_specs'), ('docs/prompts/checks.json', r'"pattern": "app/src/ui/screens/subScreen.ts"')]),
    ('124-b', 'docs/08-test-map.md', 'by a `path.join` from its own folder counts, Q65b', [(C + 'tests/test_checks_for_paths.py', r"a path\.join from its own folder")]),
    ('124-c', 'docs/08-test-map.md', 'the walk stopping at the shell and the entry', [(C + 'tests/test_checks_for_paths.py', r'^MOUNTS = frozenset'), ('docs/prompts/runs/Q65b/scripts-mutants.py', r'.')]),
    # --- X3 (Entry 118)
    ('118-a', 'docs/04-ui-spec.md', 'the **import sheet** opens by', [(A + 'ui/screens/LibraryScreen.ts', r'if \(lastRow && \(assign \|\| guessedFor\(lastRow\)\)\)')]),
    ('118-b', 'docs/04-ui-spec.md', '**Wherever the app guessed is the exception**', [(A + 'ui/screens/LibraryScreen.ts', r"facts\?\.hands\?\.kind === 'inferred' \|\| facts\?\.key\?\.kind === 'inferred'")]),
    ('118-c', 'docs/04-ui-spec.md', 'Its hands sentence is derived from the row at render (U72)', [(A + 'ui/help.ts', r'conversionHandsYours:')]),
    ('118-d', 'docs/04-ui-spec.md', '**The import sheet** (X3, 2026-09-29)', [(A + 'ui/importSheet.ts', r'export function openImportSheet'), (A + 'ui/importSheet.ts', r'export function swapHands'), (A + 'ui/help.ts', r'export function whoseFact')]),
    ('118-e', 'docs/04-ui-spec.md', "An import's detail line names where its notes came from", [(A + 'ui/help.ts', r'export function importSourceWords'), (A + 'ui/help.ts', r'export function importStateWords')]),
    ('118-f', 'docs/04-ui-spec.md', "A placeholder's detail sheet", [(A + 'ui/screens/LibraryScreen.ts', r"placeholder \? \[\] : \[\['What it trains'"), (A + 'ui/screens/LibraryScreen.ts', r'item\.importHint \?\? IMPORT_TEXT\.wanted')]),
    ('118-g', 'docs/08-test-map.md', '**The import experience** (X3;', [(T + 'unit/importSheet.test.ts', r'describe\('), (T + 'unit/libraryImportWords.test.ts', r'describe\('), (T + 'e2e/import-experience.spec.ts', r'test\(')]),
    ('118-h', 'docs/08-test-map.md', '`importSheet.test.ts` — the import sheet from the stored row', [(T + 'unit/importSheet.test.ts', r'.')]),
    ('118-i', 'docs/08-test-map.md', '`libraryImportWords.test.ts` — the row', [(T + 'unit/libraryImportWords.test.ts', r'.')]),
    ('118-j', 'docs/08-test-map.md', '`import-experience.spec.ts` — the learner path', [(T + 'e2e/import-experience.spec.ts', r'left-hand-first\.mid')]),
    # --- G1a (Entry 119)
    ('119-a', 'docs/04-ui-spec.md', "a run's first contact (`firstContact`, G1a) is the relation", [(A + 'data/db.ts', r'^\s*firstContact\?: boolean;'), (A + 'ui/screens/ScoreScreen.ts', r'sightReading \? \{ firstContact, unseen, recipe')]),
    ('119-b', 'docs/04-ui-spec.md', "Runs G1's app stored between its landing and G1a's", [(A + 'data/db.ts', r'export function isPhraseRun')]),
    ('119-c', 'docs/04-ui-spec.md', '*Not first sight* is a phrase\'s alone (G1, G1a)', [(A + 'ui/help.ts', r"notFirstSight: 'not first sight'")]),
    ('119-d', 'docs/08-test-map.md', '**The first-contact fact under its own name** (G1a;', [(T + 'unit/firstContactOnTheScore.test.ts', r'firstContact'), (T + 'unit/evidenceJobRecomputes.test.ts', r'G1a')]),
    ('119-e', 'docs/08-test-map.md', 'Since G1a the relation as `firstContact` on every run', [(T + 'unit/firstContactOnTheScore.test.ts', r'two tabs|two-tab|another tab')]),
    ('119-f', 'docs/08-test-map.md', 'since G1a, a piece played again as G1a stores it', [(T + 'unit/encounterModel.test.ts', r'G1a')]),
    ('119-g', 'docs/08-test-map.md', 'with `firstContact` beside it since G1a', [(T + 'unit/observationsFromRun.test.ts', r'firstContact')]),
    ('119-h', 'docs/08-test-map.md', "since G1a, a gone piece's run carrying the relation", [(T + 'unit/evidenceJobRecomputes.test.ts', r'G1a')]),
    ('119-i', 'docs/01-architecture.md', 'the field a consumer of general contact reads, and `unseen` is the', [(A + 'data/db.ts', r"This is the field a consumer of general contact reads")]),
    ('119-j', 'docs/02-curriculum.md', 'since G1a, never `unseen`', [(A + 'ui/screens/ScoreScreen.ts', r': \{ firstContact \}, demonstrated\)')]),
    # --- G1 (Entry 112), the two docs/02 rows Entry 121 left for the next docs seam
    ('112-a', 'docs/02-curriculum.md', 'A visit is one opening of the Score screen', [(A + 'data/encounterStore.ts', r'export'), (A + 'ui/screens/ScoreScreen.ts', r'visit')]),
    ('112-b', 'docs/02-curriculum.md', 'contact reads the encounters that are not runs', [(A + 'data/progressStore.ts', r'export async function contact\('), (A + 'data/progressStore.ts', r"how: HOW_ORDER"), (A + 'curriculum/session.ts', r'export function contactOf\('), (A + 'ui/screens/TodayScreen.ts', r'learnerContact = \{ encounters, summaries \}')]),
    # --- Q65b handled above; X3a (Entry 122) and X3b (Entry 128)
    ('128-a', 'docs/04-ui-spec.md', '**Use this tempo** (X3a, X3b)', [(A + 'data/importStore.ts', r'export const STATED_TEMPO_RANGE = \{ min: 20, max: 400 \}'), (A + 'ui/importSheet.ts', r'stateImportTempo'), (A + 'ui/help.ts', r"tempoYours: 'tempo yours'")]),
    ('128-b', 'docs/08-test-map.md', 'a stated tempo that cannot be stated again', [(T + 'unit/importSheet.test.ts', r'stated again|twice')]),
    ('128-c', 'docs/08-test-map.md', 'the learner\'s tempo stated and stated again, from the sheet', [(T + 'e2e/import-experience.spec.ts', r'Use this tempo|stateImportTempo|stated')]),
    # --- U80 (Entry 125)
    ('125-a', 'docs/04-ui-spec.md', '**On a tablet the first draw waits for the side panel (U80', [(A + 'ui/screens/ScoreScreen.ts', r'export const SIDE_PANEL_WAIT_MS'), (A + 'ui/screens/ScoreScreen.ts', r"section\.dataset\.side = 'empty';")]),
    ('125-b', 'docs/04-ui-spec.md', "Since U80 the Score screen's first draw on a tablet waits", [(A + 'ui/screens/ScoreScreen.ts', r'When it is decided is marked \(U80\)')]),
    ('125-c', 'docs/08-test-map.md', "**The tablet side panel's arrival** (U80)", [(T + 'unit/scoreSidePanelDecision.test.ts', r'.'), (T + 'e2e/side-panel-prose.spec.ts', r"data-side")]),
    ('125-d', 'docs/08-test-map.md', "Every case reads the panel only after the screen's `data-side`", [(T + 'e2e/side-panel-prose.spec.ts', r"toHaveAttribute\('data-side'")]),
    ('125-e', 'docs/08-test-map.md', '`scoreSidePanelDecision.test.ts` — the tablet side panel', [(T + 'unit/scoreSidePanelDecision.test.ts', r'.')]),
    # --- F2b (Entry 123)
    ('123-a', 'docs/08-test-map.md', 'F2b (Entry 123): `practice.1` stands on 1.1', [(C + 'claims.py', r'"leap": "interval\.leap"'), ('content/curriculum/stage-1.json', r'.')]),
    ('123-b', 'docs/08-test-map.md', 'since F2b `practice.1` stands on 1.1 (the floor', [(C + 'tests/test_taught_at.py', r'practice\.1|F2b')]),
    ('123-c', 'docs/08-test-map.md', "since F2b the practice floor's one untaught row", [(C + 'tests/test_measured_truth.py', r'F2b|leaps')]),
    ('123-d', 'docs/08-test-map.md', "since F2b the practice floor stands on 1.1 and Today's practice row", [(T + 'unit/taughtByAncestry.test.ts', r'F2b|practice\.1')]),
    ('123-e', 'docs/08-test-map.md', 'since F2b the two leaps on Skills at 342', [(T + 'e2e/plan.spec.ts', r"the two leaps on Skills \(F2b\)")]),
    # --- U82 (Entry 127)
    ('127-a', 'docs/04-ui-spec.md', "Since U74 that count is priced from the piece's measurement", [(T + 'e2e/score.slide.spec.ts', r'U82')]),
    ('127-b', 'docs/08-test-map.md', 'U82: it had asserted the count asked', [(T + 'e2e/score.slide.spec.ts', r'asserts the rule rather than the count asked \(U82\)')]),
    ('127-c', 'docs/08-test-map.md', 'fewer said as `across` — from the first draw, and over bars', [(T + 'unit/windowRendererStage.test.ts', r"sideways, the count follows what reaches across")]),
    ('127-d', 'docs/08-test-map.md', '`tests/e2e/score.slide.spec.ts` (sideways: the window said', [(T + 'e2e/score.slide.spec.ts', r'.')]),
    # --- G2 (Entry 126)
    ('126-a', 'docs/05-score-follow-engine.md', 'the transfer policy reads as `demonstrated`: first contact', [(A + 'evidence/transferPolicy.ts', r'export function transferReading'), (A + 'evidence/ladder.ts', r"transfer demonstrated \| proficient, and supporting full-standard evidence the transfer policy reads as `demonstrated`")]),
    ('126-b', 'docs/05-score-follow-engine.md', 'a failed full-standard attempt the transfer policy spares does not count', [(A + 'evidence/transferPolicy.ts', r'export function sparesFailure'), (A + 'evidence/transferPolicy.ts', r"run\.context\.firstContact === true && \(reading\.differs\.length > 0 \|\| \(reading\.newDemands"), (A + 'evidence/ladder.ts', r'export function countsTowardsMovingDown')]),
    ('126-c', 'docs/05-score-follow-engine.md', '**Each attempt carries its own facts** (G2)', [(A + 'data/progressStore.ts', r'async function withAttemptFacts'), (A + 'data/progressStore.ts', r'export function playedCandidate'), (A + 'evidence/evidence.ts', r'function keptAttemptFacts'), (A + 'evidence/ladder.ts', r'established: MaterialReference\[\];'), (A + 'evidence/ladder.ts', r'transferScope: \{ on: Dimension\[\]; since: string \}\[\];'), ('content/curriculum/vocabulary/skills.json', r'"transfer"')]),
    ('126-d', 'docs/08-test-map.md', '**The transfer policy over the attempt\'s own facts** (G2;', [(T + 'unit/transferPolicy.test.ts', r'.'), (T + 'unit/transferFactsOnTheAttempt.test.ts', r'.'), (C + 'tests/test_skill_transfer.py', r'.'), (C + 'validate.py', r'def skills_without_transfer'), (A + 'curriculum/transfer.ts', r'function establishing\('), (A + 'curriculum/session.ts', r'export function contactOf\(')]),
    ('126-e', 'docs/08-test-map.md', '`transferPolicy.test.ts` — the transfer policy (G2)', [(T + 'unit/transferPolicy.test.ts', r'.')]),
    ('126-f', 'docs/08-test-map.md', '`transferFactsOnTheAttempt.test.ts` — the fact path (G2)', [(T + 'unit/transferFactsOnTheAttempt.test.ts', r'.')]),
    ('126-g', 'docs/08-test-map.md', "transfer where a first reading's facts differ on the skill's dimensions", [(T + 'unit/masteryLadder.test.ts', r'G2')]),
    ('126-h', 'docs/08-test-map.md', 'a fifth moving exactly where the policy says demonstrated (G2)', [(T + 'unit/materialOnTheRecord.test.ts', r'G2')]),
    ('126-i', 'docs/08-test-map.md', 'a piece heard once or practised and pruned `met` through `contactOf`', [(T + 'unit/transferOffer.test.ts', r'contactOf|heard')]),
    # --- X3c (Entry 129) with X3d's replacements (Entry 133)
    ('129-a', 'docs/04-ui-spec.md', '**The tempo line** (X3c, X3d)', [(A + 'ui/help.ts', r'tempoFileMark:'), (A + 'ui/help.ts', r'tempoFileApart:'), (A + 'ui/help.ts', r"tempoFileLater: 'The file writes no tempo at its opening, only later in the piece\.'"), (A + 'ui/help.ts', r'`about \$\{String\(figure\)\}`'), (A + 'ui/importSheet.ts', r"from '\.\./score/tempoFromXml'")]),
    ('129-b', 'docs/08-test-map.md', "a printed mark's number said as a quarter note's", [(T + 'unit/importSheet.test.ts', r'X3c')]),
    ('129-c', 'docs/08-test-map.md', "the file's own tempo: the mark in its own note beside the opening tempo", [(T + 'unit/importSheet.test.ts', r'X3c')]),
    # --- F2c (Entry 130)
    ('130-a', 'docs/08-test-map.md', 'F2c (Entry 130): the advanced `leaps` maps to no demand', [(C + 'claims.py', r'`leaps` maps to no demand')]),
    ('130-b', 'docs/08-test-map.md', 'since F2c the advanced `leaps` maps to no demand: `blues.7`', [(C + 'tests/test_taught_at.py', r'F2c')]),
    ('130-c', 'docs/08-test-map.md', 'since F2c neither `blues.7` nor `ragtime.9` claims the leap', [(C + 'tests/test_measured_truth.py', r'F2c')]),
    ('130-d', 'docs/08-test-map.md', 'since F2c no study is a candidate for `blues.7`', [(C + 'tests/test_study.py', r'F2c')]),
    ('130-e', 'docs/03-content-pipeline.md', 'one detector for seven concepts, names none', [(C + 'claims.py', r'"stride-bass": "texture\.left-hand-pattern"')]),
    # --- Q75 (Entry 131)
    ('131-a', 'docs/08-test-map.md', '**The claim rule judges only what a build measured** (Q75', [(C + 'claims.py', r'CHECKED'), (C + 'validate.py', r'def concept_claim_findings'), (C + 'validate.py', r'0 unmeasured on this build'), (C + 'tests/test_validate_claims.py', r'class TestOnlyWhatThisBuildMeasured'), (C + 'tests/test_validate_claims.py', r'class TestTheReportCountsTheUnmeasuredApart'), (C + 'validate.py', r'def rung_claims_warning|rung_claims_warning')]),
    ('131-b', 'docs/08-test-map.md', 'since Q75 an unmeasured option counted apart from the checked ones', [(C + 'tests/test_validate_claims.py', r'unmeasured')]),
    ('131-c', 'docs/03-content-pipeline.md', "**The public build's placeholders, which no cache changes (Q75", [(C + 'build.py', r'no notation is bundled: it arrives when the learner imports the piece')]),
    # --- G2a (Entry 132)
    ('132-a', 'docs/05-score-follow-engine.md', 'never another cut of a composition the learner has already played', [(A + 'evidence/transferPolicy.ts', r'composition\.playedAs\.length === 0')]),
    ('132-b', 'docs/05-score-follow-engine.md', 'never read for another cut of a composition already played', [(A + 'evidence/ladder.ts', r'read for another cut of a composition already played, G2a')]),
    ('132-c', 'docs/04-ui-spec.md', 'never another cut of a piece already played (G2, G2a)', [(A + 'ui/help.ts', r"transfer: 'shown on different material'")]),
    ('132-d', 'docs/04-ui-spec.md', "No screen shows the transfer policy's reading of a run", [(A + 'ui/screens/SkillsScreen.ts', r'.')]),
    ('132-e', 'docs/08-test-map.md', 'adversaries 4, 5 and 6 revised by G2a to `unknown`', [(T + 'unit/transferPolicy.test.ts', r'G2a')]),
    ('132-f', 'docs/08-test-map.md', 'G2a (Entry 132): related-composition material reads `unknown`', [(T + 'unit/transferPolicy.test.ts', r'G2a')]),
    ('132-g', 'docs/08-test-map.md', 'a composition already played read before the dimensions and never credited', [(T + 'unit/transferPolicy.test.ts', r'playedAs')]),
    ('132-h', 'docs/08-test-map.md', 'another cut of a piece already played neither transfers nor is spared', [(T + 'unit/masteryLadder.test.ts', r'G2a')]),
    # --- U90 (Entry 135)
    ('135-a', 'docs/04-ui-spec.md', '**A name is never cut (U90, 2026-09-29).**', [(A + 'style.css', r'\.skill-concept \.list-row__title \{'), (A + 'style.css', r'flex: 1 1 5rem;')]),
    ('135-b', 'docs/04-ui-spec.md', 'And **Skills** (U90, 2026-09-29)', [(A + 'style.css', r'On Skills a name is never cut')]),
    ('135-c', 'docs/08-test-map.md', 'since U90 the F2b case on Skills at 342', [(T + 'e2e/plan.spec.ts', r"Verdana, 'DejaVu Sans'"), (T + 'e2e/plan.spec.ts', r"names on Skills cut to an ellipsis")]),
    # --- X3d (Entry 133) and X3e (Entry 137)
    ('133-a', 'docs/05-score-follow-engine.md', '**The tempo map is the file\'s** (X3d, Entry 133; X3e, Entry 137)', [(A + 'score/tempoFromXml.ts', r'export const BEAT_UNIT_QUARTERS'), (A + 'score/extractScoreModel.ts', r'^\s*musicXml: string;'), (A + 'score/OsmdView.ts', r'extractModel\(options'), (A + 'ui/screens/ScoreScreen.ts', r'bpmAt\(model\.tempoMap'), (A + 'evidence/evidence.ts', r'export function msPerQuarterAt'), (A + 'score/difficulty.ts', r'model\.tempoMap\[0\]')]),
    ('133-d', 'docs/04-ui-spec.md', "The bpm is the score model's tempo at the cursor", [(A + 'ui/screens/ScoreScreen.ts', r'function writtenBpm')]),
    ('133-g', 'docs/08-test-map.md', '**The tempo map** (X3d;', [(T + 'unit/tempoFromXml.test.ts', r'.'), (T + 'unit/scoreModelTempo.test.ts', r'.'), (T + 'e2e/import-experience.spec.ts', r'120')]),
    ('133-h', 'docs/08-test-map.md', '`tempoFromXml.test.ts` — the one tempo reader', [(T + 'unit/tempoFromXml.test.ts', r'.')]),
    ('133-i', 'docs/08-test-map.md', '`scoreModelTempo.test.ts` — the model\'s map from the file', [(T + 'unit/scoreModelTempo.test.ts', r'.')]),
    ('133-j', 'docs/08-test-map.md', 'the number the line names is the tempo the Score screen opens at; a mark alone', [(T + 'unit/importSheet.test.ts', r'X3d')]),
    ('133-k', 'docs/08-test-map.md', "a marked file's tempo on the Score screen and a statement on it (X3d)", [(T + 'e2e/import-experience.spec.ts', r'X3d')]),
    ('133-l', 'docs/08-test-map.md', "ragtime.6's tempo check now reads the reader's placement", [(T + 'unit/lessonClaimsAboutApp.test.ts', r'ragtime\.6')]),
    ('137-b', 'docs/04-ui-spec.md', 'A MusicXML file in the timewise form is kept as its partwise twin', [(A + 'data/importStore.ts', r'xml = toPartwise\(xml\);'), (A + 'data/importStore.ts', r'const corrected = toPartwise\(correctedXml\);')]),
    ('137-c', 'docs/08-test-map.md', 'a timewise import stored as it came', [(T + 'unit/toPartwise.test.ts', r'.'), (T + 'e2e/import-experience.spec.ts', r'timewise')]),
    ('137-d', 'docs/08-test-map.md', "`toPartwise.test.ts` — the door's timewise-to-partwise conversion", [(T + 'unit/toPartwise.test.ts', r'.')]),
    ('137-e', 'docs/08-test-map.md', "`helpers/timewise.ts` — a partwise fixture's timewise twin", [(T + 'unit/helpers/timewise.ts', r'.')]),
    # --- X1 (Entry 134)
    ('134-a', 'docs/04-ui-spec.md', '**"Start session" runs today\'s session** (X1', [(A + 'data/sessionRun.ts', r"export const SESSION_RUN_KEY = 'pianopath\.sessionRun'"), (A + 'data/sessionRun.ts', r"db\.get\('settings', SESSION_RUN_KEY\)"), (A + 'ui/help.ts', r"endSession: 'End today’s session'"), (A + 'ui/help.ts', r"deferred: 'left for another day'")]),
    ('134-b', 'docs/04-ui-spec.md', "**An automatic row from a rung's own list asks the one gate**", [(A + 'curriculum/eligibility.ts', r'export function automaticFromList')]),
    ('134-c', 'docs/04-ui-spec.md', "**The practice row's place** (X1", [(A + 'curriculum/session.ts', r"const METHOD_TRACKS: ReadonlySet<string> = new Set\(\['practice'\]\)")]),
    ('134-d', 'docs/04-ui-spec.md', "| jam, the option not chord-and-feel material", [(A + 'ui/help.ts', r"claim\.plain === true \? `From \$\{claim\.rung\.title\}`")]),
    ('134-e', 'docs/04-ui-spec.md', "the card: *Shifting position: something new*", [(A + 'ui/help.ts', r'export function cardLine')]),
    ('134-f', 'docs/04-ui-spec.md', '`somethingNewHead` "something new"', [(A + 'ui/help.ts', r"somethingNewHead: 'something new'")]),
    ('134-g', 'docs/04-ui-spec.md', 'chord-and-feel material first (a score with chord symbols', [(A + 'curriculum/session.ts', r"function chordAndFeel\(item: CatalogItem\)")]),
    ('134-h', 'docs/04-ui-spec.md', 'This offer could not be kept on this phone', [(A + 'ui/help.ts', r"offerNotKept: 'This offer could not be kept on this phone, so it was not opened\. Try again\.'"), (A + 'ui/screens/TodayScreen.ts', r'SESSION_TEXT\.offerNotKept')]),
    ('134-i', 'docs/04-ui-spec.md', "**In today's session** (X1)", [(A + 'ui/help.ts', r"keptHere: 'Still unstable, so we’re not moving on'"), (A + 'ui/help.ts', r"lastOne: 'That was the last one — today’s session is done'"), (A + 'ui/sessionRunner.ts', r'export async function drawTransition')]),
    ('134-j', 'docs/04-ui-spec.md', "In today's session the end sheet's closing action is the same transition", [(A + 'ui/screens/DrillScreen.ts', r'sessionHandle|drawTransition')]),
    ('134-k', 'docs/04-ui-spec.md', "This lesson has no drill that measures a run yet", [(A + 'ui/screens/DrillScreen.ts', r'export function measuresARun'), (A + 'ui/screens/LessonScreen.ts', r"'This lesson has no drill that measures a run yet\.'")]),
    ('134-l', 'docs/02-curriculum.md', "How to practise's row comes after the learner's own rung's new material", [(A + 'curriculum/session.ts', r'!METHOD_TRACKS\.has\(one\.track\)')]),
    ('134-m', 'docs/08-test-map.md', "**Today's session, run** (X1;", [(T + 'unit/sessionRun.test.ts', r'.'), (T + 'unit/sessionAdaptation.test.ts', r'.'), (T + 'unit/sessionRecheck.test.ts', r'.'), (T + 'unit/sessionRunNeverEvidence.test.ts', r'.'), (T + 'unit/todaySessionRun.test.ts', r'.'), (T + 'unit/sessionTransition.test.ts', r'.'), (T + 'unit/sessionClock.test.ts', r'.'), (T + 'unit/sessionProtocol.test.ts', r'.'), (T + 'e2e/session-run.spec.ts', r'.'), (A + 'data/sessionRun.ts', r'export function validateRun'), (A + 'data/sessionRun.ts', r'export async function applySessionEvent'), (A + 'data/sessionRun.ts', r'export async function closeSessionRun'), (A + 'data/sessionRun.ts', r'export function scoreOutcome'), (A + 'data/sessionRun.ts', r'export function drillOutcomeOf'), (A + 'ui/sessionRunner.ts', r'export async function openActivity'), (A + 'ui/sessionRunner.ts', r'export function sessionHandle'), (A + 'ui/sessionRunner.ts', r'export function transitionView'), (A + 'ui/sessionRunner.ts', r'export function openOutside'), (A + 'curriculum/session.ts', r'export function contactAssumption')]),
    ('134-n', 'docs/08-test-map.md', '`session-run.spec.ts` — Today\'s session run at 342', [(T + 'e2e/session-run.spec.ts', r'342')]),
    ('134-o', 'docs/08-test-map.md', "`sessionRun.test.ts` — the session record's state machine", [(T + 'unit/sessionRun.test.ts', r'.')]),
    # --- Q76 (Entry 136)
    ('136-a', 'docs/02-curriculum.md', 'Cielito Lindo | Mendoza y Cortés 1882', [('content/sources/mutopia.json', r'.')]),
    ('136-b', 'docs/03-content-pipeline.md', '**The `[MUTO]` import (Q76, 2026-09-29), and why it reads MIDI.**', [(C + 'import_mutopia.py', r'def _placeholder')]),
    ('136-c', 'docs/08-test-map.md', "**The public build keeps 2.4's tie and ragtime.8's stride bass** (Q76", [(C + 'tests/test_import_mutopia.py', r'.'), (C + 'tests/test_public_tie_option.py', r'.'), (C + 'import_mutopia.py', r'.')]),
    ('136-d', 'docs/08-test-map.md', 'and since Q76 `mutopia` among the sources a row may come from', [(C + 'tests/test_measured_truth.py', r'mutopia')]),
    ('136-e', 'docs/08-test-map.md', "ragtime.8's two claims rewritten for Q76", [(T + 'unit/lessonClaimsAboutApp.test.ts', r'ragtime\.8')]),
    ('136-f', 'docs/prompts/checks.json', '"pattern": "tools/midi-cleanup/midi_to_musicxml.py"', [('docs/prompts/checks.json', r'test_import_mutopia\.py')]),
    # --- G1b (Entry 138) and G1c (Entry 139)
    ('138-a', 'docs/04-ui-spec.md', "**A project stage's page (G1b; L86).**", [(A + 'data/projectStore.ts', r'export const PROJECT_STAGES'), (A + 'ui/help.ts', r"stageNine: 'A project: there is no rung to pass here\.'"), (A + 'ui/screens/LessonScreen.ts', r'PROJECT_STAGES\.has\(stage\.number\)')]),
    ('138-b', 'docs/04-ui-spec.md', '**What next with this piece? (G1b).**', [(A + 'ui/help.ts', r"door: 'What next with this piece\?'"), (A + 'ui/projectSheet.ts', r'.'), (A + 'ui/help.ts', r"never: 'You have never opened it\.'")]),
    ('138-c', 'docs/04-ui-spec.md', '**Projects (G1b).** What the learner says', [(A + 'ui/help.ts', r"learnedHeading: 'Pieces you have passed, not yet projects'"), (A + 'ui/screens/ProgressScreen.ts', r"button\('Pick a piece'")]),
    ('138-d', 'docs/05-score-follow-engine.md', '**A project is not evidence (G1b;', [(T + 'unit/projectLifecycle.test.ts', r'.')]),
    ('138-e', 'docs/01-architecture.md', '| `projects` |', [(A + 'data/db.ts', r'export const DB_VERSION = 9;'), (A + 'data/db.ts', r"createObjectStore\('projects', \{ keyPath: 'id' \}\)"), (A + 'data/projectStore.ts', r'export function mergeProjects')]),
    ('138-f', 'docs/08-test-map.md', "**The learner's projects** (G1b;", [(A + 'data/projectStore.ts', r'export function applyProjectAction'), (A + 'data/projectStore.ts', r'export const OFFERS'), (A + 'data/projectStore.ts', r'export const ACTION_STATE'), (A + 'data/projectStore.ts', r'export function projectIn'), (A + 'data/projectStore.ts', r'export function setProjectNotes'), (A + 'data/projectStore.ts', r'export function addProjectSection'), (A + 'ui/screens/SettingsScreen.ts', r'resetPracticeHistory'), (T + 'e2e/projects.spec.ts', r'.')]),
    ('138-g', 'docs/08-test-map.md', '`projects.spec.ts` — the learner\'s projects (G1b)', [(T + 'e2e/projects.spec.ts', r'.')]),
    ('138-h', 'docs/08-test-map.md', "`progressProjects.test.ts` — Progress's Projects block", [(T + 'unit/progressProjects.test.ts', r'.')]),
    ('138-i', 'docs/08-test-map.md', '`projectLifecycle.test.ts` — the repertoire lifecycle', [(T + 'unit/projectLifecycle.test.ts', r'.')]),
    ('138-j', 'docs/08-test-map.md', "`projectOnTheFinishSheet.test.ts` — the finish sheet's door", [(T + 'unit/projectOnTheFinishSheet.test.ts', r'.')]),
    ('138-k', 'docs/08-test-map.md', '`projectSheet.test.ts` — the project sheet (G1b)', [(T + 'unit/projectSheet.test.ts', r'.')]),
    ('138-l', 'docs/08-test-map.md', "`stage9ProjectsPage.test.ts` — Stage 9's page", [(T + 'unit/stage9ProjectsPage.test.ts', r'.')]),
    ('138-m', 'docs/08-test-map.md', 'the projects (G1b)', [(T + 'unit/backup.test.ts', r'project')]),
    ('138-n', 'docs/08-test-map.md', ', through version 9 since G1b', [(T + 'unit/encounterModel.test.ts', r'9')]),
    ('139-a', 'docs/04-ui-spec.md', 'none on Stage 9, a project stage, whose line says what it is', [(A + 'ui/screens/PlanScreen.ts', r'function isProjectStage')]),
    ('139-b', 'docs/04-ui-spec.md', "**A project stage on Plan (G1c; G83, L86).**", [(A + 'ui/screens/PlanScreen.ts', r'PROJECT_TEXT\.stageNine'), (A + 'ui/screens/PlanScreen.ts', r'!isProjectStage\(stage\) && completion\(stage')]),
    ('139-c', 'docs/08-test-map.md', "Plan counting a project stage's rungs, drawing its bar or badging its rows (G1c)", [(T + 'e2e/plan.spec.ts', r"Plan: a project stage counts nothing \(G1c\)"), (T + 'unit/planProjectStage.test.ts', r'.')]),
    ('139-d', 'docs/08-test-map.md', '`planProjectStage.test.ts` — Plan reads a project stage', [(T + 'unit/planProjectStage.test.ts', r'.')]),
    ('139-e', 'docs/08-test-map.md', "a project stage's line, bar and rows at 342 × 740 beside Stage 8's", [(T + 'e2e/plan.spec.ts', r'Stage 8|stage="8"|8')]),
    ('139-f', 'docs/08-test-map.md', "the session and Plan importing only the project stages' constant (G1c)", [(T + 'unit/projectLifecycle.test.ts', r'G1c')]),
    # --- Q77
    ('Q77', 'docs/03-content-pipeline.md', 'the one check found, `test_pdmx.py`', [(C + 'build.py', r'entry\["measurement"\] = \{"status": "unmeasured", "reason": reason\}'), (C + 'build.py', r'facts\["demands"\] = \{"kind": "unmeasured", "why": measurement\.get\("reason"\)\}'), (C + 'tests/test_pdmx.py', r'self\.assertIn\(import_pdmx\.PERSONAL_BUILD_TAG, item\["tags"\]\)')]),
]


def first_line(path: pathlib.Path, pattern: str) -> int | None:
    rx = re.compile(pattern, re.M)
    text = path.read_text(encoding='utf-8', errors='replace')
    m = rx.search(text)
    return None if m is None else text.count('\n', 0, m.start()) + 1


def main() -> int:
    missing = 0
    for row, target, key, facts in ROWS:
        doc = (ROOT / target).read_text(encoding='utf-8')
        count = ' '.join(doc.split()).count(' '.join(key.split()))  # across the file's wrapping
        print(f'{row}  {target}  key x{count}  ({key[:70]!r})')
        for rel, pattern in facts:
            path = ROOT / rel
            if not path.exists():
                print(f'    MISSING FILE {rel}')
                missing += 1
                continue
            line = first_line(path, pattern)
            if line is None:
                print(f'    MISSING {rel} /{pattern}/')
                missing += 1
            else:
                print(f'    ok {rel}:{line}')
    print(f'{len(ROWS)} rows; {missing} code facts missing')
    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main())
