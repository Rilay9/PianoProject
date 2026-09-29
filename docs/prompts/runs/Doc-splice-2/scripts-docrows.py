"""Print the size of each entry's Doc rows section (from its heading to the next '## ' heading or
the end), or with --print the section itself. Read only."""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parents[2]
show = '--print' in sys.argv
for n in [a for a in sys.argv[1:] if not a.startswith('--')]:
    text = (root / f'entry-{n}.md').read_text(encoding='utf-8').splitlines()
    start = next((i for i, l in enumerate(text) if re.match(r'^(## Doc rows|\*\*Doc rows)', l)), None)
    if start is None:
        print(f'== {n}: no Doc rows section')
        continue
    end = next((i for i in range(start + 1, len(text)) if text[i].startswith('## ')), len(text))
    body = text[start:end]
    print(f'== {n}: lines {start + 1}-{end}, {sum(len(l.split()) for l in body)} words')
    if show:
        print('\n'.join(body))
