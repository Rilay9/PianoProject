"""G1b: splices docs/prompts/checks.json as text (never re-serialised): two rows for the new modules
(projectStore.ts, projectSheet.ts), and projects.spec.ts added to the rows of the files that now
hold a project door or reader (the lesson page, Progress, the Score screen, the schema) and to the
two frame helpers' unions, which must name every spec their importing screens' rows name (Q65b).
Idempotent: each splice checks its own marker first. Run from the worktree root."""
from pathlib import Path

PATH = Path(__file__).resolve().parents[4] / 'docs/prompts/checks.json'
raw = PATH.read_bytes().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
SPEC = '"tests/e2e/projects.spec.ts"'


def add_spec(pattern: str, after: str) -> None:
    """Adds projects.spec.ts to one row's e2e list, right after `after` (a spec already in it)."""
    global text
    start = text.index(f'{{"pattern": "{pattern}"')
    end = text.index('\n', start)
    row = text[start:end]
    if SPEC in row:
        return
    anchor = f'"{after}"'
    assert row.count(anchor) == 1, (pattern, after)
    text = text[:start] + row.replace(anchor, f'{anchor}, {SPEC}') + text[end:]


add_spec('app/src/ui/screens/LessonScreen.ts', 'tests/e2e/plan.spec.ts')
add_spec('app/src/ui/screens/ProgressScreen.ts', 'tests/e2e/progress.hierarchy.spec.ts')
add_spec('app/src/ui/screens/ScoreScreen.*', 'tests/e2e/today.spec.ts')
add_spec('app/src/data/db.ts', 'tests/e2e/converted-import.spec.ts')
add_spec('app/src/ui/screens/screenFrame.ts', 'tests/e2e/progress.spec.ts')
add_spec('app/src/ui/screens/subScreen.ts', 'tests/e2e/progress.spec.ts')
# The two test-side helpers the new spec imports: their rows name every file that reads them.
add_spec('app/tests/e2e/fixtures/playInTime.ts', 'tests/e2e/lesson-flow.spec.ts')
add_spec('app/tests/e2e/scoreControls.ts', 'tests/e2e/perf.spec.ts')
FOUR = 'a Keep tempo run played in time from inside the page (T37): the four spec files that import it'
FIVE = 'a Keep tempo run played in time from inside the page (T37): the five spec files that import it'
if FOUR in text:
    text = text.replace(FOUR, FIVE)

ROWS = [
    ('    {"pattern": "app/src/data/importStore.ts"',
     '    {"pattern": "app/src/data/projectStore.ts", "checks": {"e2e": ["tests/e2e/projects.spec.ts", "tests/e2e/progress.spec.ts", "tests/e2e/lesson-flow.spec.ts"]}, "reason": "the learner\'s projects (G1b): the store the project sheet writes and Progress and Stage 9\'s page read — the two doors and the Stage 9 page in a browser (projects.spec), the backup round trip over every store (progress.spec), the lesson page it now feeds (lesson-flow); the transitions, identity, backup merge and the no-side-effect guards are unit files in the whole unit suite (projectLifecycle, projectSheet, stage9ProjectsPage, progressProjects, projectOnTheFinishSheet)"},'),
    ('    {"pattern": "app/src/ui/openItem.ts"',
     '    {"pattern": "app/src/ui/projectSheet.ts", "checks": {"e2e": ["tests/e2e/projects.spec.ts", "tests/e2e/progress.spec.ts"]}, "reason": "the project sheet (G1b), opened from the Score screen\'s finish sheet and from Progress: both doors, the actions, the history and encounter lines (projects.spec), and the Progress screen it draws over (progress.spec)"},'),
]
for anchor, row in ROWS:
    pattern = row.split('"pattern": "')[1].split('"')[0]
    if f'"pattern": "{pattern}"' in text:
        continue
    at = text.index(anchor)
    line_start = text.rindex('\n', 0, at) + 1
    # the new row goes after the anchor row
    line_end = text.index('\n', at)
    text = text[:line_end + 1] + row + '\n' + text[line_end + 1:]

out = text.replace('\n', '\r\n') if crlf else text
PATH.write_bytes(out.encode('utf-8'))
print('spliced; crlf =', crlf)
