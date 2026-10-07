"""G1a's mutants and reader-move experiments, run from `app/`.

Each entry replaces one exact text in one source file, runs vitest on a named set of unit files,
records whether any test failed (caught / the verdict changed) and which, and restores the file
byte for byte (its sha256 checked after every restore).

- Mutants (m*): a fault in G1a's own change. Expected: caught.
- Reader moves (r*): a reader of `unseen` switched to `firstContact`, the refuting test of the
  orchestrator's hypothesis. A phrase read that moves changes verdicts on phrase rows (rows that
  carry `unseen` and no `firstContact`: every phrase row before G1a) or on a piece's run; the
  failing tests name which.

Usage: python ../docs/prompts/runs/G1a/scripts-mutants.py <out.txt | -> [ids...]
"""
import hashlib
import io
import subprocess
import sys

G1A_FILES = [
    'tests/unit/firstContactOnTheScore.test.ts',
    'tests/unit/observationsFromRun.test.ts',
    'tests/unit/encounterModel.test.ts',
]
FIELD_FILES = G1A_FILES + [
    'tests/unit/backup.test.ts', 'tests/unit/competenceSurvivesPruning.test.ts', 'tests/unit/contactNovelty.test.ts',
    'tests/unit/demandIsNotAbility.test.ts', 'tests/unit/demandReadings.test.ts', 'tests/unit/encounterRetention.test.ts',
    'tests/unit/evidenceAdversarial.test.ts', 'tests/unit/evidenceByDemand.test.ts', 'tests/unit/evidenceJobRecomputes.test.ts',
    'tests/unit/evidenceJobReport.test.ts', 'tests/unit/evidenceOnlyMeasured.test.ts', 'tests/unit/evidenceProperty.test.ts',
    'tests/unit/evidenceTouchesNamedSkills.test.ts', 'tests/unit/feedbackFromMeasurements.test.ts', 'tests/unit/firstThirtyDays.test.ts',
    'tests/unit/gateAtTheConsumers.test.ts', 'tests/unit/help.test.ts', 'tests/unit/legacySkillsAreExposures.test.ts',
    'tests/unit/masteryLadder.test.ts', 'tests/unit/materialLayer.test.ts', 'tests/unit/materialOnTheRecord.test.ts',
    'tests/unit/oneGateBoundary.test.ts', 'tests/unit/oneSkillState.test.ts', 'tests/unit/progressHistoryLines.test.ts',
    'tests/unit/readerAdversarial.test.ts', 'tests/unit/recordTruth.test.ts', 'tests/unit/repertoireRetention.test.ts',
    'tests/unit/requirementsCanBeShown.test.ts', 'tests/unit/rungStateFromEvidence.test.ts', 'tests/unit/scoreSummaryTruth.test.ts',
    'tests/unit/sightReadingFromReadingState.test.ts', 'tests/unit/sightReadingIsNotAPiece.test.ts', 'tests/unit/slotsFromEvidence.test.ts',
    'tests/unit/taughtByAncestry.test.ts', 'tests/unit/transferOffer.test.ts', 'tests/unit/transferOfferOnTheRun.test.ts',
    'tests/unit/transferRelationship.test.ts', 'tests/unit/tripletPrecision.test.ts',
]

SCORE = 'src/ui/screens/ScoreScreen.ts'
DB = 'src/data/db.ts'
STORE = 'src/data/progressStore.ts'
EVIDENCE = 'src/evidence/evidence.ts'
SESSION = 'src/curriculum/session.ts'
RUNG = 'src/evidence/rungState.ts'
JOB = 'src/data/evidenceJob.ts'
PROGRESS = 'src/ui/screens/ProgressScreen.ts'

ENTRIES = [
    # --- mutants of G1a's change ---
    ('m1-recheck-reads-unseen', SCORE,
     'if (result.firstContact !== true || !encounterTarget) return result;',
     'if (result.unseen !== true || !encounterTarget) return result;', G1A_FILES),
    ('m2-unseen-on-every-run', SCORE,
     ': { firstContact }, demonstrated)',
     ': { firstContact, unseen }, demonstrated)', G1A_FILES),
    ('m3-no-relation-on-a-phrase', SCORE,
     '{ firstContact, unseen, recipe: phraseRecipe(item.id) }',
     '{ unseen, recipe: phraseRecipe(item.id) }', G1A_FILES),
    ('m4-recheck-leaves-the-relation', SCORE,
     'return { ...result, firstContact: false, unseen: false, passed: false, masterEligible: false };',
     'return { ...result, unseen: false, passed: false, masterEligible: false };', G1A_FILES),
    ('m5-rung-rows-infer-the-relation', STORE,
     '  const { steps: _steps, bars: _bars, ...rest } = row;\r\n  return rest;',
     '  const { steps: _steps, bars: _bars, ...rest } = row;\r\n  return rest.firstContact === undefined && rest.unseen !== undefined ? { ...rest, firstContact: rest.unseen } : rest;',
     G1A_FILES),
    ('m6-isPhraseRun-flag-alone', DB,
     "  return material === undefined || (material.kind === 'generator' && material.family === 'sight-reading');",
     '  return material !== null;', G1A_FILES),
    ('m7-isPhraseRun-reads-the-relation', DB,
     '  if (row.recipe !== undefined) return true;',
     '  if (row.recipe !== undefined || (row as { firstContact?: boolean }).firstContact !== undefined) return true;', G1A_FILES),
    # --- reader moves: each `unseen` reader switched to the relation ---
    ('r1-session-daily-read', SESSION,
     'const read = met.some((row) => row.unseen === true);',
     'const read = met.some((row) => row.firstContact === true);', FIELD_FILES),
    ('r2-session-reads', SESSION,
     '.filter((row) => row.unseen === true && byId.has(row.itemId))',
     '.filter((row) => row.firstContact === true && byId.has(row.itemId))', FIELD_FILES),
    ('r3-evidence-context', EVIDENCE,
     'firstContact: observation.unseen === true,',
     'firstContact: (observation as { firstContact?: boolean }).firstContact === true,', FIELD_FILES),
    ('r4-evidence-condition', EVIDENCE,
     "unseen: { field: 'SessionRow.unseen', met: (o) => o.unseen === true },",
     "unseen: { field: 'SessionRow.unseen', met: (o) => (o as { firstContact?: boolean }).firstContact === true },", FIELD_FILES),
    ('r5-recordRun', STORE,
     'const evidence = !(result.unseen === false && isPhraseRun(result));',
     'const evidence = !(result.firstContact === false);', FIELD_FILES),
    ('r6-rungState-measured', RUNG,
     '!(row.unseen === false && isPhraseRun(row)) &&',
     '!(row.firstContact === false) &&', FIELD_FILES),
    ('r7-history-line', PROGRESS,
     'if (session.unseen === false && isPhraseRun(session)) flags.push(HISTORY_TEXT.notFirstSight);',
     'if (session.firstContact === false) flags.push(HISTORY_TEXT.notFirstSight);', FIELD_FILES),
    ('r8-evidenceJob-mark', JOB,
     '(row.unseen !== undefined && isPhraseRun(row)) ||',
     '(row.firstContact !== undefined) ||', FIELD_FILES),
]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    out_path = sys.argv[1]
    wanted = set(sys.argv[2:])
    out = sys.stdout if out_path == '-' else io.open(out_path, 'a', encoding='utf8')
    for ident, path, old, new, files in ENTRIES:
        if wanted and ident not in wanted:
            continue
        original = open(path, 'rb').read()
        text = original.decode('utf8')
        if text.count(old) != 1:
            out.write(f'{ident}: NOT APPLIED — the text occurs {text.count(old)} times in {path}\n')
            out.flush()
            continue
        open(path, 'wb').write(text.replace(old, new).encode('utf8'))
        try:
            proc = subprocess.run(['npx', 'vitest', 'run', *files], capture_output=True, text=True, encoding='utf8', errors='replace', shell=True)
        finally:
            open(path, 'wb').write(original)
        assert sha(open(path, 'rb').read()) == sha(original), f'{path} not restored'
        failed = [line.strip() for line in proc.stdout.splitlines() if line.strip().startswith('FAIL ') or line.strip().startswith('×')]
        summary = [line.strip() for line in proc.stdout.splitlines() if 'Tests ' in line and ('passed' in line or 'failed' in line)]
        verdict = 'CAUGHT / verdict changed' if proc.returncode != 0 else 'SURVIVED / no verdict changed'
        out.write(f'{ident} ({path}, {len(files)} files): {verdict}; exit {proc.returncode}; {summary[-1] if summary else "no summary"}\n')
        for line in [l for l in failed if l.startswith('×')][:12]:
            out.write(f'    {line}\n')
        out.write(f'    restored: sha256 {sha(original)[:16]} matches\n')
        out.flush()
    if out is not sys.stdout:
        out.close()


if __name__ == '__main__':
    main()
