"""Composes app/tests/unit/projectOnTheFinishSheet.test.ts from the Score-screen harness of
firstContactOnTheScore.test.ts (the mocks and helpers, lines 33-374, unchanged) and G1b's own
header and cases. Run once from the worktree root; rerunning writes the same file."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
source = (ROOT / 'app/tests/unit/firstContactOnTheScore.test.ts').read_text(encoding='utf-8').split('\n')
harness = '\n'.join(source[32:374])  # lines 33..374: imports, mocks, helpers, beforeEach/afterEach


def drop_block(text: str, start: str) -> str:
    """Removes a top-level declaration (and the one doc comment right above it) that the cases do not use."""
    lines = text.split('\n')
    at = next(i for i, line in enumerate(lines) if line.startswith(start))
    begin = at
    if begin > 0 and lines[begin - 1].startswith('/**') and lines[begin - 1].rstrip().endswith('*/'):
        begin -= 1
    end = at
    while not lines[end].startswith('}'):
        end += 1
    del lines[begin:end + 2 if end + 1 < len(lines) and lines[end + 1] == '' else end + 1]
    return '\n'.join(lines)


# What the G1 cases need and these do not (lint refuses unused declarations).
for start in ('function reload(', 'function contactFields(', 'async function storedEncounters(', 'async function encounterRows('):
    harness = drop_block(harness, start)
for old, new in (
    ("import type { EncounterRow, ImportRow, SessionRow } from '../../src/data/db';", "import type { ImportRow, SessionRow } from '../../src/data/db';"),
    ("const { recentSessions, recordRun, resetProgressForTest, contact, getProgress, rungRows } = await import('../../src/data/progressStore');",
     "const { recentSessions, resetProgressForTest } = await import('../../src/data/progressStore');"),
    ("const { openDatabase, resetDatabaseForTest, isPhraseRun } = await import('../../src/data/db');\n", ''),
    ("const { meetsStandard } = await import('../../src/evidence/rungState');\n", ''),
    ("const { historyDetail } = await import('../../src/ui/screens/ProgressScreen');\n", ''),
):
    assert old in harness, old
    harness = harness.replace(old, new)

HEADER = '''// @vitest-environment jsdom
/**
 * The finish sheet is the project sheet's first door (G1b item 5; the reviewer's ruling 3).
 *
 * At the end of a run of a piece the sheet offers *What next with this piece?*; it opens the project
 * sheet over the finish sheet, reading what the history says of the piece — the run just played
 * among it — and makes nothing until the learner chooses an action. A generated sight-reading phrase
 * is no piece (C5, S8) and is offered none. An import's project is its stored bytes, the identity its
 * runs carry (G1). The real Score screen with the engraver and the session stubbed (the harness of
 * `firstContactOnTheScore.test.ts`, copied as it is), the real stores, a fake IndexedDB.
 */'''

CASES = '''
const { allProjects, resetProjectsForTest } = await import('../../src/data/projectStore');
const { dayKey } = await import('../../src/data/progressStore');
const { materialKey } = await import('../../src/curriculum/material');

beforeEach(() => {
  resetProjectsForTest();
});

describe('What next with this piece?', () => {
  it('a piece’s finish sheet offers it; the sheet it opens says the piece was just played, and makes nothing until the learner acts', async () => {
    const section = await open(`#/score/${SONG_ID}`);
    playThrough();
    await lastStored();
    const door = document.getElementById('summary-project');
    expect(door, 'the finish sheet has no door to the project sheet').not.toBeNull();
    expect(door?.textContent).toBe('What next with this piece?');
    click('summary-project');
    await vi.waitFor(() => expect(document.querySelector('#project-sheet')).not.toBeNull());
    expect(document.getElementById('project-state')?.textContent).toBe('Not a project yet');
    await vi.waitFor(() => expect(document.getElementById('project-met')?.textContent).toBe(`You last played it on ${dayKey(new Date())}.`));
    expect(await allProjects(), 'opening the sheet made a project').toEqual([]);
    click('project-action-learn');
    await vi.waitFor(async () => expect((await allProjects()).map((row) => [row.itemId, row.state, row.material])).toEqual([[SONG_ID, 'learning', file('s')]]));
    // Leaving the Score screen takes the sheet with it (found in the pictures: it stayed over the next screen).
    // The shell disposes the screen and puts the next one in its place; the body is not cleared.
    disposeScreen(section);
    expect(document.querySelector('#project-sheet'), 'the sheet outlived the Score screen').toBeNull();
  });

  it('a sight-reading phrase is no piece: its finish sheet offers no project', async () => {
    await open(PHRASE);
    playThrough();
    await lastStored();
    expect(document.getElementById('summary-done')).not.toBeNull();
    expect(document.getElementById('summary-project')).toBeNull();
  });

  it('an import’s project is its stored bytes', async () => {
    const identity = await textIdentity(IMPORT_TEXT);
    await open(`#/score/${IMPORT_ONE}`);
    playThrough();
    await lastStored();
    click('summary-project');
    await vi.waitFor(() => expect(document.getElementById('project-action-save')).not.toBeNull());
    click('project-action-save');
    await vi.waitFor(async () => expect((await allProjects()).map((row) => row.id)).toEqual([materialKey(identity, IMPORT_ONE)]));
  });
});
'''

out = HEADER + '\n' + harness + '\n\nconst PHRASE = `#/score/${READ_ID}?seed=4242`;\n' + CASES
target = ROOT / 'app/tests/unit/projectOnTheFinishSheet.test.ts'
target.write_text(out, encoding='utf-8', newline='\n')
print(f'wrote {target.relative_to(ROOT)}: {len(out.splitlines())} lines')
