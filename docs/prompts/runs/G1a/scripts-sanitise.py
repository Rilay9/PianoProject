"""Replaces this machine's paths in G1a's captures with placeholders (U74's rule). Run from docs/prompts/runs/G1a.

`<worktree>` the builder's worktree, `<main checkout>` the repository it was cut from, `<scratch>` the
builder's scratch folder (where the before app was built), each in backslash and slash spellings, and
the scratch folder's tail as vite printed it relative to `app/`.
"""
import os
import sys
from pathlib import Path

WORKTREE = Path(__file__).resolve().parents[4]
MAIN = WORKTREE.parents[2]
SCRATCH = Path(sys.argv[1]) if len(sys.argv) > 1 else None

subs = []
if SCRATCH is not None:
    subs += [(str(SCRATCH), '<scratch>'), (SCRATCH.as_posix(), '<scratch>')]
    parts = SCRATCH.as_posix().split('/')
    # vite's relative spelling: ../../…/AppData/…/scratchpad
    if 'AppData' in parts:
        subs.append(('/'.join(parts[parts.index('AppData'):]), '<scratch>'))
subs += [(str(WORKTREE), '<worktree>'), (WORKTREE.as_posix(), '<worktree>')]
subs += [(str(MAIN), '<main checkout>'), (MAIN.as_posix(), '<main checkout>')]

changed = 0
for folder in ('.', os.path.join('..', '..', 'pictures', 'g1a')):
    for name in sorted(os.listdir(folder)):
        if not name.endswith(('.txt', '.log', '.json')):
            continue
        target = os.path.join(folder, name)
        raw = open(target, 'rb').read()
        bom = raw.startswith(b'\xef\xbb\xbf')
        text = raw.decode('utf-8-sig')
        out = text
        for old, new in subs:
            out = out.replace(old, new)
        if out != text:
            open(target, 'wb').write((b'\xef\xbb\xbf' if bom else b'') + out.encode('utf-8'))
            changed += 1
            print('sanitised', target)
print('files changed:', changed)
