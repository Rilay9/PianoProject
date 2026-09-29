"""Doc-splice (Entry 121): each doc row of Entries 109, 112-116 against the target doc and the code at HEAD.

For every row: how many times its key phrase is in the target file (idempotence: 0 = to splice, 1 = present),
and each code fact the row names, as a file and a regular expression that must match at HEAD, printed with
its first matching line number. A fact that does not match is printed MISSING, and the script exits 1.

Run from the repository root: `python docs/prompts/runs/Doc-splice/scripts/verify_rows.py`.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]

D01 = "docs/01-architecture.md"
D02 = "docs/02-curriculum.md"
D03 = "docs/03-content-pipeline.md"
D04 = "docs/04-ui-spec.md"
D08 = "docs/08-test-map.md"

# (row id, target file, key phrase, [(code file, regex), ...])
ROWS: list[tuple[str, str, str, list[tuple[str, str]]]] = [
    # Entry 109, D4a
    ("109-a docs/04 §2 transfer bullet", D04, "(D4a; `data/offerSnapshot.ts`, one `settings` row)", [
        ("app/src/data/offerSnapshot.ts", r"OFFER_SNAPSHOT_KEY = 'pianopath\.transferOffer'"),
        ("app/src/data/offerSnapshot.ts", r"'missing' \| 'superseded' \| 'other-item' \| 'other-skill' \| 'other-day' \| 'corrupt' \| 'unreadable'"),
        ("app/src/ui/help.ts", r"This offer is no longer on today’s card; opened as practice\."),
        ("app/src/ui/help.ts", r"This offer could not be read back; opened as practice\."),
        ("app/src/ui/screens/TodayScreen.ts", r"function supersedeOffer\(\)"),
        ("app/src/router.ts", r"offer=<token>"),
    ]),
    ("109-b docs/08 state row", D08, "**The transfer offer's relationship persisted before play**", [
        ("app/src/curriculum/material.ts", r"export type RunFacts = MaterialFacts & \(TransferFact \| NoTransferFact\)"),
        ("app/src/data/offerSnapshot.ts", r"export function loadOffer\("),
    ]),
    ("109-c docs/08 unit offerSnapshot", D08, "- `offerSnapshot.test.ts` — the transfer offer as Today kept it", [
        ("app/tests/unit/offerSnapshot.test.ts", r"."),
    ]),
    ("109-d docs/08 unit todayOfferSnapshot", D08, "- `todayOfferSnapshot.test.ts` — Today keeps the transfer offer", [
        ("app/tests/unit/todayOfferSnapshot.test.ts", r"."),
    ]),
    ("109-e docs/08 unit transferOfferOnTheRun", D08, "- `transferOfferOnTheRun.test.ts` — a transfer-intended run", [
        ("app/tests/unit/transferOfferOnTheRun.test.ts", r"."),
    ]),
    ("109-f docs/08 e2e transfer-offer gain", D08, "Since D4a, a second case: the card's offer captured", [
        ("app/src/app/testHooks.ts", r"todayCard\?: \(\) => TodayCardView"),
    ]),
    # Entry 112, G1
    ("112-a docs/02 Part G bullet (not this seam's)", D02, "on any visit since G1", []),
    ("112-b docs/02 Part E2 contact (not this seam's)", D02, "Since G1 (`progressStore.contact`)", []),
    ("112-c docs/03 §4a an import's identity", D03, "**An import's identity** (G1)", [
        ("app/src/curriculum/material.ts", r"if \(item\.imported === true\) return IMPORT;"),
        ("app/src/curriculum/material.ts", r"const IMPORT: Identity = \{ kind: 'none'"),
        ("app/src/curriculum/material.ts", r"export async function textIdentity\(text: string\)"),
        ("app/src/curriculum/material.ts", r"subtle\.digest\('SHA-256', new TextEncoder\(\)\.encode\(text\)\)"),
        ("app/src/ui/screens/ScoreScreen.ts", r"let loadedIdentity: Awaited<ReturnType<typeof textIdentity>>"),
        ("app/src/data/encounterStore.ts", r"\[excerpt\.fromBar - 1 \+ bars\[0\], excerpt\.fromBar - 1 \+ bars\[1\]\]"),
        ("app/src/data/encounterStore.ts", r"export function familiarityIn\("),
    ]),
    ("112-d docs/08 state row (G1)", D08, "**What the learner met, and first contact from it**", [
        ("app/src/data/db.ts", r"export const DB_VERSION = 8;"),
        ("app/src/data/db.ts", r"createObjectStore\('encounters'"),
        ("app/src/data/db.ts", r"createObjectStore\('contacts'"),
        ("app/src/data/db.ts", r"export function isPhraseRun\("),
        ("app/src/data/encounterStore.ts", r"export async function recordEncounter\("),
        ("app/src/data/encounterStore.ts", r"export function firstContactIn\("),
        ("app/src/data/encounterStore.ts", r"export async function historyFor\("),
        ("app/src/data/encounterStore.ts", r"export async function familiarity\("),
        ("app/src/data/progressStore.ts", r"export async function pruneSessions\("),
        ("app/src/data/progressStore.ts", r"export function foldRun\("),
        ("app/src/data/progressStore.ts", r"export function mergeSummaries\("),
        ("app/src/data/progressStore.ts", r"how\?: ContactHow\[\];"),
        ("app/src/data/backup.ts", r"mergeSummaries\(await db\.get\('contacts'"),
        ("app/tests/e2e/lab.spec.ts", r"heard at noon, left, read in the evening"),
        ("app/src/curriculum/session.ts", r"const contact = contactIn\(rows, item\.id, material\);"),
    ]),
    ("112-e docs/08 unit encounterModel", D08, "- `encounterModel.test.ts` —", [
        ("app/tests/unit/encounterModel.test.ts", r"the store reads the encounters and the summaries for contact"),
    ]),
    ("112-f docs/08 unit encounterRetention", D08, "- `encounterRetention.test.ts` —", [
        ("app/tests/unit/encounterRetention.test.ts", r"a practised passage survives the sessions cap"),
    ]),
    ("112-g docs/08 unit firstContactOnTheScore", D08, "- `firstContactOnTheScore.test.ts` —", [
        ("app/tests/unit/firstContactOnTheScore.test.ts", r"an import is its stored bytes"),
    ]),
    ("112-h docs/08 contactNovelty gain", D08, "since G1 a `met` says how", [
        ("app/tests/unit/contactNovelty.test.ts", r"how: \['played'\]"),
        # the rows this file stores are runs (recordRun); no encounter or summary is written in it
        ("app/tests/unit/contactNovelty.test.ts", r"await recordRun\(run\('song\.old-name', file\('a'\)\)"),
        ("app/tests/unit/encounterModel.test.ts", r"contact over the store: heard from the Library and never played is met"),
        ("app/tests/unit/encounterRetention.test.ts", r"contact met with how"),
    ]),
    ("112-i docs/08 observationsFromRun gain", D08, "`unseen` true and false, and on a piece since G1", [
        ("app/tests/unit/observationsFromRun.test.ts", r"Revised \(G1\): first contact is written on every run since G1"),
    ]),
    ("112-j docs/08 backup gain", D08, "the encounters and the summaries of pruned runs (G1)", [
        ("app/tests/unit/backup.test.ts", r"put\('encounters'"),
        ("app/tests/unit/backup.test.ts", r"put\('contacts'"),
    ]),
    ("112-k docs/08 help gain", D08, "and G1's *seen before* sentence", [
        ("app/tests/unit/help.test.ts", r"SUMMARY_TEXT\.sightReadSeen"),
    ]),
    ("112-l docs/08 e2e lab gain", D08, "Since G1, today's phrase demonstrated at noon", [
        ("app/tests/e2e/lab.spec.ts", r"setFixedTime\(new Date\('2026-09-29T12:00:00'\)\)"),
        ("app/tests/e2e/lab.spec.ts", r"Sight-reading counts only on music you have not heard — this run is kept as practice\."),
        ("app/tests/e2e/lab.spec.ts", r"toContainText\('not first sight'\)"),
    ]),
    ("112-m docs/04 §5 what the screen writes (builder)", D04, "**What the screen writes of what the learner met, and reads back (G1, 2026-09-29).**", []),
    ("112-n docs/04 §5f seen-before sentence (builder)", D04, "Since G1 the hearing can be on an earlier visit", []),
    ("112-o docs/04 §6 history line (builder)", D04, "*Not first sight* is a phrase's alone (G1)", []),
    ("112-p docs/01 §4.5 the two stores (builder)", D01, "**`DB_VERSION` is 8.**", []),
    # Entry 113, Q47
    ("113-a docs/08 pieces row (Q47)", D08, "**The MIDI converter on real recordings, and the port's hand split, in CI**", [
        ("tools/midi-cleanup/tests/fetch_maestro.py", r'ARCHIVE_SHA256 = "70470ee2'),
        ("tools/midi-cleanup/tests/test_converter.py", r"class TestTheRealRecordingsGate"),
        ("tools/midi-cleanup/tests/test_converter.py", r"self\.fail\(real_reason\)"),
        ("tools/midi-cleanup/tests/parity_reference.py", r'\("tools/midi-cleanup/tests/fixtures/one-track-two-hands\.mid", True\)'),
        ("app/tests/unit/midiParity.test.ts", r"splits the hands the same way"),
    ]),
    ("113-b docs/08 midiParity line (replace)", D08, "`tools/midi-cleanup/tests/fixtures/one-track-two-hands.mid`, the last three converted with `hands=auto`", [
        ("app/tests/unit/midiParity.test.ts", r"it\('has a reference to compare against'"),
        ("app/tests/unit/midiParity.test.ts", r'"Write the MIDI parity reference"'),
        ("app/tests/unit/midiParity.test.ts", r"it\.skipIf\(reference\.handSplit === null\)\('splits the hands the same way'"),
    ]),
    ("113-c docs/08 test_ci_order line (add; merged with 116-c)", D08, "- `test_ci_order.py` —", [
        ("tools/content/tests/test_ci_order.py", r"def test_the_content_is_built_before_the_content_tests_read_it"),
        ("tools/content/tests/test_ci_order.py", r"def test_the_converter_harness_runs"),
        ("tools/content/tests/test_ci_order.py", r'"tools/midi-cleanup/tests/parity_reference\.py", "npm run test"'),
        ("tools/content/tests/test_ci_order.py", r"def test_the_recordings_are_fetched_before_anything_reads_them"),
        ("tools/content/tests/test_ci_order.py", r"def test_the_steps_the_failure_messages_name_exist"),
        ("tools/content/tests/test_ci_order.py", r"def test_ci_runs_every_check_the_path_map_names"),
        ("tools/content/tests/test_ci_order.py", r'NOT_IN_CI = \("states",\)'),
    ]),
    ("113-d docs/08 test_technique_units line (replace)", D08, "from any working directory (Q46)", [
        ("tools/content/tests/test_technique_units.py", r"catalog_path = BUILD_DIR / \"catalog\.generated\.json\""),
    ]),
    ("113-e docs/08 parity_reference line (replace)", D08, "whose reference must hold a hand split. It fails on a missing committed fixture", [
        ("tools/midi-cleanup/tests/parity_reference.py", r"if must_split and data\[\"handSplit\"\] is None"),
        ("tools/midi-cleanup/tests/parity_reference.py", r"FAILED, a committed input is missing"),
        ("tools/midi-cleanup/tests/parity_reference.py", r"failed = bool\(missing or refused or \(unfetched and in_ci\) or not written\)"),
    ]),
    ("113-f docs/08 test_converter sentence (replace)", D08, "skip on a developer's checkout and fail under CI, naming `fetch_maestro.py`", [
        ("tools/midi-cleanup/tests/test_converter.py", r"if os\.environ\.get\(\"CI\"\):\s*\n\s*self\.fail\(real_reason\)\s*\n\s*self\.skipTest\(real_reason\)"),
    ]),
    ("113-g docs/08 fetch_maestro.py line", D08, "- `fetch_maestro.py` — not a test", [
        ("tools/midi-cleanup/tests/fetch_maestro.py", r"--cache-hit true"),
        ("tools/midi-cleanup/tests/fetch_maestro.py", r"Archive SHA256: `\{archive_sha256\}`, verified before anything was extracted"),
    ]),
    ("113-h docs/08 test_fetch_maestro.py line", D08, "- `test_fetch_maestro.py` —", [
        ("tools/midi-cleanup/tests/test_fetch_maestro.py", r"def test_a_wrong_archive_checksum_stops_before_anything_is_extracted"),
        ("tools/midi-cleanup/tests/test_fetch_maestro.py", r"def test_the_aliases_are_the_ones_the_harness_reads"),
    ]),
    ("113-i docs/08 test_parity_reference.py line", D08, "- `test_parity_reference.py` —", [
        ("tools/midi-cleanup/tests/test_parity_reference.py", r"def test_a_missing_committed_fixture_fails_everywhere"),
    ]),
    ("113-j docs/08 fixtures/ line", D08, "- `fixtures/` — `make-one-track-two-hands-midi.py`", [
        ("tools/midi-cleanup/tests/fixtures/make-one-track-two-hands-midi.py", r"."),
        ("tools/midi-cleanup/tests/fixtures/one-track-two-hands.mid", r""),
    ]),
    # Entry 114, U74
    ("114-a docs/04 §5 One size phrase (replace)", D04, "(before the first draw, for a piece within the probe's reach of 48 bars; on idle after it for a longer one; U74)", [
        ("app/src/score/WindowRenderer.ts", r"const PROBE_MAX_BARS = 48;"),
        ("app/src/score/WindowRenderer.ts", r"if \(options\.model\.sourceMeasureCount <= PROBE_MAX_BARS\) \{"),
    ]),
    ("114-b docs/04 §5 the first window paragraph", D04, "**The first window is the measured one (U74, 2026-09-29).**", [
        ("app/src/score/WindowRenderer.ts", r"private measureBeforePricing\(\): void"),
        ("app/src/score/WindowRenderer.ts", r"if \(this\.disposed \|\| this\.fitting \|\| this\.running \|\| this\.layout !== 'window' \|\| this\.currentStep > 0\) return;"),
        ("app/src/score/WindowRenderer.ts", r"const MEASURE_IDLE_TIMEOUT_MS = 600;"),
        ("app/src/score/WindowRenderer.ts", r"check\.frame = requestAnimationFrame"),
        ("app/src/score/WindowRenderer.ts", r"this\.cancelSettledCheck\(\);\s*\n\s*delete this\.el\.dataset\.settled;"),
    ]),
    ("114-c docs/08 pieces row (U74)", D08, "**The first window at open, on every path in**", [
        ("app/tests/unit/windowRendererStage.test.ts", r"the first window drawn is the window the fit settles on"),
        ("app/tests/e2e/score-fit-paths.spec.ts", r"the two-bar scale settles the same from Today and by a link after a fresh load"),
    ]),
    ("114-d docs/08 e2e score-fit-paths", D08, "- `score-fit-paths.spec.ts` —", [
        ("app/tests/e2e/score-fit-paths.spec.ts", r"viewport: \{ width: 342, height: 740 \}"),
    ]),
    ("114-e docs/08 unit windowRendererStage", D08, "- `windowRendererStage.test.ts` —", [
        ("app/tests/unit/windowRendererStage.test.ts", r"a longer piece than the probe reaches keeps the idle load"),
    ]),
    ("114-f docs/08 score.screen.spec gain", D08, "since U74 said a frame after the fit, once the stage has held still, and taken back by any stage change", [
        ("app/src/score/WindowRenderer.ts", r"private publishSettled\(\): void"),
    ]),
    # Entry 115, E-tail
    ("115-a docs/03 §4a measuredUnder (E40, E41)", D03, "`\"<converter version>;<measuring fingerprint>\"` (E40)", [
        ("app/src/data/importStore.ts", r"value: read && fingerprint \? `\$\{String\(version\)\};\$\{fingerprint\}` : String\(version\)"),
        ("app/src/data/measuringFingerprint.ts", r"export const MEASURING_DEFINITIONS"),
        ("app/src/data/importStore.ts", r"row\.kind === 'musicxml' && under\.fingerprint !== fingerprint\) return 'definitions'"),
        ("app/src/data/importStore.ts", r"return 'untrusted';"),
        ("app/src/data/db.ts", r"export type ImportKind = 'musicxml' \| 'pdf';"),
    ]),
    ("115-b docs/03 §4a an import's tempo (E32, E48)", D03, "`importStore.stateImportTempo` (E48)", [
        ("app/src/data/importStore.ts", r"export function textTempoOf\(xml: string\)"),
        ("app/src/data/importStore.ts", r'return `\$\{direction\}<sound tempo="\$\{String\(bpm\)\}"/>`;'),
        ("app/src/data/importStore.ts", r"const metreBeat = beatType === 4 \? 1 : beatType === 2 \? 2 : undefined;"),
        ("app/src/data/importStore.ts", r"the metronome mark printed in the file as text"),
        ("app/src/data/importStore.ts", r"export async function stateImportTempo\("),
        ("app/src/data/importStore.ts", r"the learner’s stated tempo, "),
    ]),
    ("115-c docs/03 §4a converters (E42)", D03, "`CONVERTER_STAMPS` lists each recognised converter's stamp", [
        ("app/src/data/importStore.ts", r"export const CONVERTER_STAMPS"),
        ("app/src/data/importStore.ts", r"facts\.key = \{ kind: 'authored', via: `the file’s signature — \$\{origin\}` \};"),
    ]),
    ("115-d docs/03 §4a excerpt block (E33)", D03, "`approvedCutVersion` (the cutter the approval was merged under", [
        ("tools/content/excerpts.py", r'block\["approvedCutVersion"\] = '),
        ("tools/content/excerpts.py", r'block\["dropped"\] = '),
    ]),
    ("115-e docs/03 §4c the cut and the definition (E33, E29)", D03, "each listed in `dropped` (E33, cut version 2)", [
        ("tools/content/excerpts.py", r"^CUT_VERSION = 2$"),
        ("tools/content/excerpts.py", r"^EDITION_TEXTS: "),
        ("tools/content/excerpts.py", r'row\["cutVersion"\] = CUT_VERSION'),
        ("tools/content/validate.py", r"stale by cut version — approved when the cutter was version"),
        ("tools/content/validate.py", r"def excerpt_target_warnings\("),
    ]),
    ("115-f docs/03 §4c private-use glyphs drawn (E31)", D03, "(`OsmdView.load`, E31)", [
        ("app/src/score/OsmdView.ts", r"await this\.osmd\.load\(mapTextGlyphs\(musicXml\)\);"),
        ("app/src/score/textGlyphs.ts", r"export function mapTextGlyphs\("),
    ]),
    ("115-g docs/08 row (E-tail)", D08, "| **E-tail**:", [
        ("tools/content/tests/test_validate_excerpts.py", r"class TheTargetCheck"),
        ("tools/content/tests/test_excerpts.py", r"class TheEditionTexts"),
        ("app/tests/unit/importMeasuredTruth.test.ts", r"the learner states an import’s tempo \(E48\)"),
        ("app/tests/unit/textGlyphs.test.ts", r"."),
        ("app/tests/unit/excerptItems.test.ts", r"\(E37\)"),
        ("app/tests/e2e/excerpts.spec.ts", r"\(E35\)"),
    ]),
    # Entry 116, Q-tooling
    ("116-a docs/08 CI paragraph", D08, "**CI** (`.github/workflows/ci.yml`)", [
        ("tools/content/validate.py", r"split_prompt_views\.refresh_for_validator\(\)"),
        ("tools/content/build.py", r'python\("validate\.py", \*args\)'),
        ("tools/docs/split_prompt_views.py", r'if os\.environ\.get\("GITHUB_ACTIONS"\) == "true":'),
        (".github/workflows/ci.yml", r"cancel-in-progress: false"),
        (".github/workflows/ci.yml", r"- 'docs/review/\*\*'"),
        (".github/workflows/ci.yml", r"- 'docs/prompts/entry-\*\.md'"),
        (".github/workflows/ci.yml", r"- '\.claude/\*\*'"),
        (".github/workflows/docs-integrity.yml", r"python3 -m unittest tools\.content\.tests\.test_prompt_views"),
        ("docs/prompts/checks.json", r'"id": "prompt-views"'),
        ("tools/docs/checks_for_paths.py", r"."),
        ("tools/docs/evidence_manifest.py", r"MANIFEST\.md"),
    ]),
    ("116-b docs/08 test_checks_for_paths line", D08, "- `test_checks_for_paths.py` —", [
        ("tools/content/tests/test_checks_for_paths.py", r"def test_the_unmatched_path_is_conspicuous_and_never_a_refusal"),
        ("tools/content/tests/test_checks_for_paths.py", r"def test_a_docs_only_change_runs_nothing"),
    ]),
    ("116-c docs/08 test_ci_order line (merged with 113-c)", D08, "Since Q-tooling, CI also runs every check the path map names", [
        ("tools/content/tests/test_ci_order.py", r"def test_ci_runs_every_check_the_path_map_names"),
    ]),
    ("116-d docs/08 test_evidence_manifest line", D08, "- `test_evidence_manifest.py` —", [
        ("tools/content/tests/test_evidence_manifest.py", r"A throwaway repository"),
        ("tools/content/tests/test_evidence_manifest.py", r"def test_a_capture_naming_a_command_without_an_exit_line_is_refused"),
        ("tools/content/tests/test_evidence_manifest.py", r"def test_the_first_carrying_run_that_finished_is_the_one"),
    ]),
    ("116-e docs/08 test_matrix_edit line", D08, "- `test_matrix_edit.py` —", [
        ("tools/content/tests/test_matrix_edit.py", r"def test_writing_the_matrix_regenerates_the_views_and_keeps_its_line_endings"),
        ("tools/content/tests/test_matrix_edit.py", r"def test_a_refused_batch_leaves_the_file_as_it_was"),
    ]),
    ("116-f docs/08 test_prompt_views line", D08, "- `test_prompt_views.py` —", [
        ("tools/content/tests/test_prompt_views.py", r"def test_views_match_the_canonical_files"),
    ]),
    ("116-g docs/08 test_prompt_views_refresh line", D08, "- `test_prompt_views_refresh.py` —", [
        ("tools/content/tests/test_prompt_views_refresh.py", r"def test_on_github_s_runner_it_compares_and_writes_nothing"),
        ("tools/content/tests/test_prompt_views_refresh.py", r"def test_validate_main_calls_the_step_before_its_verdict_line"),
    ]),
]


def main() -> int:
    texts: dict[str, str] = {}
    missing = 0
    for row_id, target, key, facts in ROWS:
        # Whitespace collapsed, so a phrase the file wraps across lines is still found once.
        text = texts.setdefault(target, re.sub(r"\s+", " ", (ROOT / target).read_text(encoding="utf-8")))
        found = text.count(re.sub(r"\s+", " ", key))
        print(f"{row_id}\n  {target}: key phrase found {found} time(s)")
        for path, pattern in facts:
            file = ROOT / path
            if not file.exists():
                print(f"  MISSING file {path}")
                missing += 1
                continue
            if pattern == "":
                print(f"  ok  {path} (exists, {file.stat().st_size > 0 and 'non-empty' or 'EMPTY'})")
                continue
            body = file.read_text(encoding="utf-8")
            match = re.search(pattern, body, re.M)
            if match is None:
                print(f"  MISSING {path}: /{pattern}/")
                missing += 1
            else:
                print(f"  ok  {path}:{body.count(chr(10), 0, match.start()) + 1}")
    print(f"{len(ROWS)} rows; {missing} code fact(s) missing")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
