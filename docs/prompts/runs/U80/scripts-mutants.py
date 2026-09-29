"""U80's mutants: each part of the change undone alone, the unit file run, the source restored.

Run from the worktree root. Writes docs/prompts/runs/U80/mutants-<name>.txt per mutant (first
line the command, last line exit=<code>) and mutants-summary.txt. The source is restored byte for
byte after every mutant, and checked against its original at the end.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
SRC = ROOT / 'app' / 'src' / 'ui' / 'screens' / 'ScoreScreen.ts'
OUT = ROOT / 'docs' / 'prompts' / 'runs' / 'U80'
UNIT = 'tests/unit/scoreSidePanelDecision.test.ts'

ORIGINAL = SRC.read_bytes()
TEXT = ORIGINAL.decode('utf-8')
NL = '\r\n' if '\r\n' in TEXT else '\n'

MUTANTS = {
    # The mark, without the wait: the first draw priced before the decision.
    'no-wait': (
        '      if (sideDecided) {\n        let bound: number | undefined;',
        '      if (sideDecided && false) {\n        let bound: number | undefined;',
    ),
    # The wait, without its bound: a lesson that never answers holds the score for ever.
    'no-bound': (
        '            bound = window.setTimeout(resolve, SIDE_PANEL_WAIT_MS);',
        '            bound = window.setTimeout(() => undefined, SIDE_PANEL_WAIT_MS);',
    ),
    # A piece on no rung left undecided, as the committed code left it.
    'no-rung-undecided': (
        "      if (!found) {\n        decideSidePanel('empty');\n        return;\n      }",
        '      if (!found) {\n        return;\n      }',
    ),
    # A lesson that will not read left undecided.
    'failure-undecided': (
        "    } catch {\n      decideSidePanel('empty');\n    }",
        '    } catch {\n      sidePanel.hidden = true;\n    }',
    ),
    # The panel's body found by id when the lesson lands, as the committed code found it.
    'found-by-id': (
        '      sideBody.replaceChildren(renderMarkdown(',
        "      (document.getElementById('score-side-body') ?? sideBody).replaceChildren(renderMarkdown(",
    ),
    # Marked `empty` at construction on every screen, as the committed code marked it. (The
    # once-only guard then also refuses the real decision; every tablet case should see it.)
    'decided-at-build': (
        "  } else {\n    section.dataset.side = 'empty';\n  }",
        "  }\n  section.dataset.side = 'empty';",
    ),
}

summary = []
failed_setup = False
for name, (before, after) in MUTANTS.items():
    before, after = before.replace('\n', NL), after.replace('\n', NL)
    if TEXT.count(before) != 1:
        summary.append(f'{name}: the anchor is not found exactly once; mutant not applied')
        failed_setup = True
        continue
    SRC.write_bytes(TEXT.replace(before, after).encode('utf-8'))
    command = f'npx vitest run {UNIT}'
    try:
        run = subprocess.run(command, cwd=ROOT / 'app', shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=300)
        output = run.stdout + run.stderr
        code = run.returncode
    finally:
        SRC.write_bytes(ORIGINAL)
    (OUT / f'mutants-{name}.txt').write_text(f'(in app, ScoreScreen.ts mutated: {name}) {command}\n{output}\nexit={code}\n', encoding='utf-8')
    failing = [line.strip() for line in output.splitlines() if line.strip().startswith('×')]
    summary.append(f'{name}: exit={code}; red cases: {len(failing)}' + ''.join(f'\n    {line}' for line in failing))

restored = SRC.read_bytes() == ORIGINAL
summary.append(f'source restored byte for byte: {restored}')
(OUT / 'mutants-summary.txt').write_text('\n'.join(summary) + '\n', encoding='utf-8')
print('\n'.join(summary))
sys.exit(0 if restored and not failed_setup else 1)
