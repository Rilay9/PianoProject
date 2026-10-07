"""U118a mutants: apply or undo one named mutant (idempotent, checks its marker).

usage: mutate.py <M1|M2> <apply|undo>
M1 (the test's old form): the hand pressed with the bare click again, after the fold.
M2 (the app): a tap on the folded sheet no longer brings the bar back.
"""
import sys

W = '<worktree>/'
MUTANTS = {
    'M1': (
        W + 'app/tests/e2e/score.run.spec.ts',
        "    await pressControl(page, '#score-hands-both');\n    await page.waitForTimeout(500);\n    await expect(page.locator('#score-stage')).toHaveAttribute('data-hands', 'both');",
        "    await page.locator('#score-hands-both').click(); // U118a-M1\n    await page.waitForTimeout(500);\n    await expect(page.locator('#score-stage')).toHaveAttribute('data-hands', 'both');",
    ),
    'M2': (
        W + 'app/src/ui/screens/ScoreScreen.ts',
        "    if (section.dataset.chrome === 'folded') {\n      showBar();\n      return;\n    }",
        "    if (section.dataset.chrome === 'folded') {\n      return; // U118a-M2\n    }",
    ),
}
name, action = sys.argv[1], sys.argv[2]
path, original, mutant = MUTANTS[name]
raw = open(path, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if action == 'apply':
    if mutant in text:
        print(f'{name} already applied')
    else:
        assert original in text, f'{name}: original not found'
        text = text.replace(original, mutant, 1)
        print(f'{name} applied')
else:
    if original in text and mutant not in text:
        print(f'{name} already undone')
    else:
        assert mutant in text, f'{name}: mutant not found'
        text = text.replace(mutant, original, 1)
        print(f'{name} undone')
out = text.replace('\n', '\r\n') if crlf else text
open(path, 'wb').write(out.encode('utf-8'))
