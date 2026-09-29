"""Doc-splice-2: replace this machine's paths in the captures with placeholders (<worktree>,
<main checkout>, <scratchpad>, <home>), as earlier seams' records do. Run from the worktree root:
    python docs/prompts/runs/Doc-splice-2/scripts-sanitise.py
"""
import pathlib
import re

here = pathlib.Path(__file__).resolve().parent
worktree = here.parents[3]
main = worktree.parents[2]
home = pathlib.Path.home()
pairs = []
for path, name in ((worktree, '<worktree>'), (main, '<main checkout>'), (home, '<home>')):
    for spelling in {str(path), path.as_posix(), str(path).replace('\\', '\\\\')}:
        pairs.append((spelling, name))
scratch = re.compile(r'(?:<home>|[A-Za-z]:[\\/]Users[\\/][^\\/]+)[\\/]AppData[\\/]Local[\\/]Temp[\\/][^\s\'"]*?scratchpad', re.I)
for capture in sorted(here.glob('*.txt')):
    text = capture.read_text(encoding='utf-8', errors='replace')
    before = text
    text = scratch.sub('<scratchpad>', text)
    for spelling, name in sorted(pairs, key=lambda p: -len(p[0])):
        text = text.replace(spelling, name)
    text = scratch.sub('<scratchpad>', text)
    if text != before:
        capture.write_text(text, encoding='utf-8')
        print(f'{capture.name}: paths replaced')
