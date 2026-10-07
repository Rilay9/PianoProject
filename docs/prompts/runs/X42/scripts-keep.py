"""
Copy X42's run files into docs/prompts/runs/X42/ with machine paths replaced (<worktree>, <home>) and ANSI colour
stripped; refuse any kept file over 300 KB. Run from the worktree root.

Usage: python build/x42/keep.py <src>=<dest> ...
"""
import re
import sys
from pathlib import Path

WORKTREE = str(Path.cwd())
HOME = str(Path.home())
VARIANTS = []
for root, token in ((WORKTREE, '<worktree>'), (HOME, '<home>')):
    forward = root.replace('\\', '/')
    VARIANTS += [(root, token), (forward, token), ('/' + forward[0].lower() + forward[2:], token),
                 (root.replace('\\', '\\\\'), token)]
ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')
OUT = Path('docs/prompts/runs/X42')
OUT.mkdir(parents=True, exist_ok=True)
for pair in sys.argv[1:]:
    src, dest = pair.split('=', 1)
    text = Path(src).read_text(encoding='utf-8', errors='replace')
    text = ANSI.sub('', text)
    for old, new in VARIANTS:
        text = text.replace(old, new)
    text = text.replace('\r\n', '\n')
    data = text.encode('utf-8')
    assert len(data) <= 300 * 1024, f'{dest} is {len(data)} bytes, over 300 KB'
    (OUT / dest).write_bytes(data)
    print(f'{dest}: {len(data)} bytes')
