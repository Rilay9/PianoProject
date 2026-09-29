"""Replaces this machine's paths in G1b's captures with placeholders (U74's rule; G1a's script, adapted).
Run from anywhere. `<worktree>` the builder's worktree, `<main checkout>` the repository it was cut from,
`<home>` the user folder (Python's and npm's own paths), each in backslash and slash spellings, and the
worktree as vite prints it in a stack trace: relative, `../../…/Piano%20Stuff/…/<worktree name>`.
Idempotent: a second run changes nothing.
"""
import re
from pathlib import Path

WORKTREE = Path(__file__).resolve().parents[4]
MAIN = WORKTREE.parents[2]
HOME = Path.home()

subs = []
for path, name in ((WORKTREE, '<worktree>'), (MAIN, '<main checkout>'), (HOME, '<home>')):
    subs += [(str(path), name), (path.as_posix(), name)]

# Any run of ../ followed by a path that ends in the worktree's own folder name.
RELATIVE = re.compile(r'(?:\.\./)+[^\s:]*?' + re.escape(WORKTREE.name))

changed = 0
for folder in (WORKTREE / 'docs/prompts/runs/G1b', WORKTREE / 'docs/prompts/runs/G1b/red', WORKTREE / 'docs/prompts/pictures/g1b'):
    for target in sorted(folder.iterdir()):
        if not target.is_file() or target.suffix not in ('.txt', '.log', '.json'):
            continue
        raw = target.read_bytes()
        bom = raw.startswith(b'\xef\xbb\xbf')
        text = raw.decode('utf-8-sig', errors='replace')
        out = text
        for old, new in subs:
            out = out.replace(old, new)
        out = RELATIVE.sub('<worktree>', out)
        if out != text:
            target.write_bytes((b'\xef\xbb\xbf' if bom else b'') + out.encode('utf-8'))
            changed += 1
print(f'{changed} capture(s) sanitised')
