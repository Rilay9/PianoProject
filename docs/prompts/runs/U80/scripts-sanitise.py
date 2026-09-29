"""U80: machine paths in the captures replaced by <worktree>, <main checkout> and <temp>.

Run from the worktree root after the captures are final. Text files under docs/prompts/runs/U80/
only; each file is rewritten only if something in it changes.
"""
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
MAIN = ROOT.parents[2]

def forms(path: pathlib.Path) -> list[str]:
    text = str(path)
    return sorted({text, text.replace('\\', '/'), text.replace('\\', '/').replace(' ', '%20')}, key=len, reverse=True)

RULES: list[tuple[str, str]] = []
for form in forms(ROOT):
    RULES.append((form, '<worktree>'))
for form in forms(MAIN):
    RULES.append((form, '<main checkout>'))
# The vitest stack traces write the worktree relative to the working directory's drive root.
RULES.append(('../../../../../../Piano%20Stuff/PianoProject/.claude/worktrees/' + ROOT.name, '<worktree>'))
TEMP = re.compile(r'C:[\\/]Users[\\/][^\\/]+[\\/]AppData[\\/]Local[\\/]Temp[^\s"\']*', re.IGNORECASE)
USER = re.compile(r'C:[\\/]Users[\\/][^\\/\s]+', re.IGNORECASE)

changed = []
for path in sorted(HERE.glob('*.txt')):
    raw = path.read_text(encoding='utf-8', errors='replace')
    text = raw
    for before, after in RULES:
        text = text.replace(before, after)
    text = TEMP.sub('<temp>', text)
    text = USER.sub('<home>', text)
    if text != raw:
        path.write_text(text, encoding='utf-8')
        changed.append(path.name)
print('sanitised:', ', '.join(changed) if changed else 'nothing')
