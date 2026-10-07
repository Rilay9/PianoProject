"""X1: report, and with --fix normalise, the line endings of the files X1 edited (a file the Edit tool
touched can end up with lone LF lines inside a CRLF file; git normalises on commit, but the working copy
should be one kind). Run from the worktree root.

    python docs/prompts/runs/X1/scripts-line_endings.py [--fix]
"""
import pathlib
import sys

FILES = [
    'app/src/ui/screens/TodayScreen.ts', 'app/src/ui/screens/ScoreScreen.ts', 'app/src/ui/screens/DrillScreen.ts',
    'app/src/ui/screens/LessonScreen.ts', 'app/src/curriculum/session.ts', 'app/src/curriculum/eligibility.ts',
    'app/src/ui/help.ts', 'app/src/style.css', 'app/src/router.ts', 'docs/04-ui-spec.md', 'docs/prompts/checks.json',
    'app/tests/unit/oneGateBoundary.test.ts', 'app/tests/unit/taughtByAncestry.test.ts', 'app/tests/unit/todayOpensWithItsRung.test.ts',
    'app/tests/unit/lessonPagePicksPassTheAdmission.test.ts', 'app/tests/unit/fallbackOrder.test.ts',
    'app/tests/unit/sightReadingIsNotAPiece.test.ts', 'app/tests/unit/parallelStrands.test.ts',
    'app/tests/e2e/today.spec.ts', 'app/tests/e2e/transfer-offer.spec.ts',
]
fix = '--fix' in sys.argv
for rel in FILES:
    p = pathlib.Path(rel)
    b = p.read_bytes()
    crlf = b.count(b'\r\n')
    lone = b.count(b'\n') - crlf
    note = ''
    if crlf and lone and fix:
        p.write_bytes(b.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'))
        note = ' -> all CRLF'
    print(f'{rel}: CRLF {crlf}, lone LF {lone}{note}')
