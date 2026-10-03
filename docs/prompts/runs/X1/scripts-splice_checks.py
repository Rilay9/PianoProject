"""X1: the path-to-checks map's rows for the new files and the new spec, spliced as text (never
re-serialised). Each edit checks its own marker; a rerun changes nothing. Line endings kept.
"""
import pathlib

p = pathlib.Path('docs/prompts/checks.json')
raw = p.read_bytes()
crlf = b'\r\n' in raw
t = raw.decode('utf-8').replace('\r\n', '\n')
SPEC = '"tests/e2e/session-run.spec.ts"'


def line_of(prefix: str) -> tuple[int, str]:
    lines = t.split('\n')
    hits = [i for i, line in enumerate(lines) if line.lstrip().startswith(prefix)]
    if len(hits) != 1:
        raise SystemExit(f'expected one row starting {prefix!r}, found {len(hits)}')
    return hits[0], lines[hits[0]]


def add_spec(prefix: str) -> None:
    global t
    i, line = line_of(prefix)
    if SPEC in line:
        return
    if line.count('"e2e": [') != 1:
        raise SystemExit(f'{prefix}: no single e2e list')
    new = line.replace('"e2e": [', f'"e2e": [{SPEC}, ', 1)
    lines = t.split('\n')
    lines[i] = new
    t = '\n'.join(lines)


def add_row_after(prefix: str, row: str, marker: str) -> None:
    global t
    if marker in t:
        return
    i, _ = line_of(prefix)
    lines = t.split('\n')
    lines.insert(i + 1, row)
    t = '\n'.join(lines)


def reword(old: str, new: str) -> None:
    global t
    if new in t:
        return
    if t.count(old) != 1:
        raise SystemExit(f'expected one {old!r}, found {t.count(old)}')
    t = t.replace(old, new)


add_row_after(
    '{"pattern": "app/src/data/**",',
    '    {"pattern": "app/src/data/sessionRun.ts", "checks": {"e2e": ["tests/e2e/session-run.spec.ts", "tests/e2e/today.spec.ts"]}, "reason": "today\'s session record and its state machine (X1): the session run through its activities with the transition after each, Continue after a reload, the finish line and the start-time recheck on the glass (session-run.spec); Today\'s card drawn from the running record (today.spec)"},',
    '"pattern": "app/src/data/sessionRun.ts"',
)
add_row_after(
    '{"pattern": "app/src/ui/*.ts",',
    '    {"pattern": "app/src/ui/sessionRunner.ts", "checks": {"e2e": ["tests/e2e/session-run.spec.ts", "tests/e2e/today.spec.ts", "tests/e2e/transfer-offer.spec.ts", "tests/e2e/lab.spec.ts"]}, "reason": "the session runner\'s one adapter (X1), imported by TodayScreen, ScoreScreen and DrillScreen: the opener (a transfer offer\'s snapshot kept before its route), the screens\' lifecycle events, the recheck through the session\'s contact reader, the transition on the Score screen\'s and the drill\'s end sheets, the visible-time clock; the session on the glass, Today, the offer\'s route and the daily read\'s heard-at-noon case"},',
    '"pattern": "app/src/ui/sessionRunner.ts"',
)
add_spec('{"pattern": "app/src/ui/screens/TodayScreen.ts",')
add_spec('{"pattern": "app/src/curriculum/session.ts",')
add_spec('{"pattern": "app/src/ui/screens/ScoreScreen.*",')
add_spec('{"pattern": "app/src/ui/screens/DrillScreen.*",')
# The frame helper's row names the union of its importing screens' rows (Q65b; test_checks_for_paths.py).
add_spec('{"pattern": "app/src/ui/screens/screenFrame.ts",')
add_spec('{"pattern": "app/tests/e2e/fixtures/playInTime.ts",')
add_spec('{"pattern": "app/tests/e2e/scoreControls.ts",')
reword('a Keep tempo run played in time from inside the page (T37): the four spec files that import it', 'a Keep tempo run played in time from inside the page (T37): the five spec files that import it')
reword('the helpers for the score\'s ⋯ and tempo sheets: the 32 of the 111 e2e spec files that import it', 'the helpers for the score\'s ⋯ and tempo sheets: the 34 of the 113 e2e spec files that import it')

p.write_bytes((t.replace('\n', '\r\n') if crlf else t).encode('utf-8'))
print('checks.json spliced')
