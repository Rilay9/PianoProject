"""G1b's mutants: each one text change to a source file, the named unit files run against it, the
file restored by its bytes (sha256 checked) before the next. A mutant is caught when the run fails.

Run from the worktree root: python docs/prompts/runs/G1b/scripts-mutants.py [name ...]
Writes docs/prompts/runs/G1b/mutants.txt (or mutants-<first name>.txt when names are given).
"""
import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
APP = ROOT / 'app'
RUNS = ROOT / 'docs/prompts/runs/G1b'

LIFE = 'tests/unit/projectLifecycle.test.ts'
SHEET = 'tests/unit/projectSheet.test.ts'
STAGE9 = 'tests/unit/stage9ProjectsPage.test.ts'
PROGRESS = 'tests/unit/progressProjects.test.ts'
FINISH = 'tests/unit/projectOnTheFinishSheet.test.ts'
BACKUP = 'tests/unit/backup.test.ts'

STORE = 'src/data/projectStore.ts'
DB = 'src/data/db.ts'

# name, file, old, new, tests, the mechanism it breaks
MUTANTS = [
    ('no-upgrade', DB, "      if (oldVersion < 9) {\n", "      if (oldVersion < 0) {\n", [LIFE], 'the version-9 upgrade makes the store'),
    ('not-in-backup', DB, "  'contacts',\n  'projects',\n] as const;", "  'contacts',\n] as const;", [LIFE, BACKUP], 'the backup carries the store'),
    ('backup-overwrites', 'src/data/backup.ts', "      } else if (store === 'projects' && !options.replace) {", "      } else if (store === 'projects' && options.replace === 'never') {", [LIFE], 'a merge restore joins, never overwrites'),
    ('retired-offers-learn', STORE, "  retired: ['bring-back'],", "  retired: ['bring-back', 'learn'],", [LIFE], 'the transitions table'),
    ('offers-not-checked', STORE, "  if (!actionsFor(existing?.state).includes(action)) {", "  if (false as boolean) {", [LIFE], 'an action not offered is refused'),
    ('history-rewritten', STORE, "    ? { ...existing, state, since: when, history: [...existing.history, step] }", "    ? { ...existing, state, since: when, history: [step] }", [LIFE], 'the history is appended, never rewritten'),
    ('id-only-matches-any-id', STORE, "    .filter((row) => row.itemId === target.itemId)", "    .filter((row) => row.itemId === target.itemId || row.material.kind === 'id')", [LIFE], 'an id-only project answers for its own id alone'),
    ('material-ignored', STORE, "  const byMaterial = knownMaterial(target.material) ? rows.find((row) => sameMaterial(asIdentity(row.material), target.material)) : undefined;", "  const byMaterial = undefined as ProjectRow | undefined;", [LIFE], 'one piece under two ids is one project'),
    ('writes-race', STORE, "  const next = queue.then(change, change);", "  const next = change();", [SHEET], 'two quick edits never lose one'),
    ('performed-makes-a-performance', STORE, "  return write(row);\n}\n\n/** R18: this week's goal", "  if (action === 'performed') await (await import('./progressStore')).recordRun({ itemId: target.itemId, mode: 'tempo', tempoPct: 100, accuracy: 1, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 1, passed: false, masterEligible: false, performance: true, ...(known ? { material: known } : {}) }, at);\n  return write(row);\n}\n\n/** R18: this week's goal", [LIFE, SHEET], 'I performed it manufactures no performance run'),
    ('performed-makes-an-encounter', STORE, "  return write(row);\n}\n\n/** R18: this week's goal", "  if (action === 'performed') await (await import('./encounterStore')).recordEncounter({ kind: 'heard', itemId: target.itemId, material: known, source: { tab: 'progress' }, visit: 'project', at });\n  return write(row);\n}\n\n/** R18: this week's goal", [LIFE, SHEET], 'I performed it manufactures no encounter'),
    ('future-performance-day', STORE, "  return real && day <= today;", "  return real;", [LIFE], 'a performance day is on or before today'),
    ('sections-unbounded', STORE, "    if (!whole || from < 1 || to < from || (bars !== undefined && to > bars)) {", "    if (!whole || from < 1 || to < from) {", [LIFE, SHEET], 'the piece\'s bars bound the sections'),
    ('merge-takes-theirs', STORE, "    state: last.state,\n    since: last.at,", "    state: theirs.state,\n    since: theirs.since,", [LIFE], 'a merge keeps the latest state'),
    ('stage9-reads-runs', 'src/ui/screens/LessonScreen.ts', "    return stage !== undefined && PROJECT_STAGES.has(stage.number);", "    return stage !== undefined && PROJECT_STAGES.has(stage.number) && false;", [STAGE9], 'the Stage 9 page reads projects, not runs'),
    ('stage9-shows-counts', 'src/ui/screens/LessonScreen.ts', "    counts.hidden = asProjects;\n    if (asProjects) counts.replaceChildren();\n    else drawCounts(lesson, reading);", "    counts.hidden = false;\n    drawCounts(lesson, reading);", [STAGE9], 'no count on a Stage 9 page'),
    ('stage9-keeps-mark-done', 'src/ui/screens/LessonScreen.ts', "    if (asProjects) for (const node of actions.querySelectorAll('#lesson-state, #lesson-know, #lesson-done')) node.remove();", "    if (asProjects) for (const node of actions.querySelectorAll('#lesson-know')) node.remove();", [STAGE9], 'no completion claim on a Stage 9 page'),
    ('progress-offers-every-pass', 'src/ui/screens/ProgressScreen.ts', "      .filter(({ row, item }) => projectIn(list, { itemId: row.itemId, material: materialOfItem(item) }) === undefined)", "      .filter(({ row }) => row.itemId !== '')", [PROGRESS], 'a piece with a project is offered none'),
    ('progress-makes-projects', 'src/ui/screens/ProgressScreen.ts', "    projects.dataset.drawn = 'true';\n", "    projects.dataset.drawn = 'true';\n    for (const { row, item } of learned) void import('../../data/projectStore').then((store) => store.applyProjectAction({ itemId: row.itemId, material: materialOfItem(item) }, 'keep'));\n", [PROGRESS, LIFE], 'a pass is never made a project automatically'),
    ('progress-oldest-first', 'src/ui/screens/ProgressScreen.ts', "      .sort((a, b) => b.since.localeCompare(a.since))", "      .sort((a, b) => a.since.localeCompare(b.since))", [PROGRESS], 'newest change first'),
    ('door-on-a-phrase', 'src/ui/screens/ScoreScreen.ts', "    const projectPiece = item !== undefined && isProjectable(item) ? item : undefined;", "    const projectPiece = item;", [FINISH], 'a phrase is no piece'),
    ('door-forgets-the-bytes', 'src/ui/screens/ScoreScreen.ts', "                material: encounterTarget?.material ?? playedMaterial(projectPiece, loadedIdentity === undefined ? {} : { loaded: loadedIdentity }),", "                material: undefined,", [FINISH], 'an import\'s project is its stored bytes'),
    ('met-line-without-length', 'src/ui/projectSheet.ts', "  const facts = await familiarity({ itemId: item.id, material, ...(bars === undefined ? {} : { extent: bars }) });", "  const facts = await familiarity({ itemId: item.id, material });", [FINISH], 'the encounter line reads the whole piece as played'),
    ('sheet-saves-on-open', 'src/ui/projectSheet.ts', "  void projectFor(target).then((row) => {\n    if (written) return;\n    project = row;\n    draw();\n  });", "  void projectFor(target).then((row) => {\n    if (written) return;\n    project = row;\n    draw();\n    if (!row) void act('save');\n  });", [SHEET, PROGRESS, FINISH], 'opening the sheet makes nothing'),
    ('sheet-outlives-its-screen', 'src/ui/projectSheet.ts', "  if (options.owner) {\n    onScreenDispose(options.owner, () => {", "  if (options.owner && false) {\n    onScreenDispose(options.owner, () => {", [SHEET, PROGRESS, FINISH], 'leaving the screen closes the sheet'),
    ('reset-keeps-projects', 'src/ui/screens/SettingsScreen.ts', "export const RESET_STORES = ['progress', 'sessions', 'streak', 'skills', 'encounters', 'contacts', 'projects'] as const;", "export const RESET_STORES = ['progress', 'sessions', 'streak', 'skills', 'encounters', 'contacts'] as const;", [SHEET], 'Reset progress clears the projects'),
]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run(names: list[str]) -> None:
    chosen = [m for m in MUTANTS if not names or m[0] in names]
    out_name = 'mutants.txt' if not names else f'mutants-{names[0]}.txt'
    lines = [f'{len(chosen)} mutant(s); each file restored by its bytes after its run\n']
    caught = 0
    for name, rel, old, new, tests, why in chosen:
        path = APP / rel
        original = path.read_bytes()
        text = original.decode('utf-8')
        crlf = '\r\n' in text
        plain = text.replace('\r\n', '\n')
        if plain.count(old) != 1:
            lines.append(f'{name}: SKIPPED — the text to change is not in {rel} exactly once\n')
            continue
        mutated = plain.replace(old, new)
        if crlf:
            mutated = mutated.replace('\n', '\r\n')
        try:
            path.write_bytes(mutated.encode('utf-8'))
            result = subprocess.run(['npx', 'vitest', 'run', *tests], cwd=APP, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=True)
        finally:
            path.write_bytes(original)
        assert sha(path.read_bytes()) == sha(original), f'{rel} not restored'
        failed = [line.strip() for line in (result.stdout + result.stderr).splitlines() if line.strip().startswith('×') or 'FAIL' in line][:4]
        verdict = 'caught' if result.returncode != 0 else 'SURVIVED'
        caught += result.returncode != 0
        lines.append(f'{name} ({rel}; {why}): {verdict}, exit {result.returncode}\n')
        for line in failed:
            lines.append(f'    {line}\n')
    lines.append(f'{caught} of {len(chosen)} caught\n')
    (RUNS / out_name).write_text(''.join(lines), encoding='utf-8')
    print(''.join(lines))


if __name__ == '__main__':
    run(sys.argv[1:])
