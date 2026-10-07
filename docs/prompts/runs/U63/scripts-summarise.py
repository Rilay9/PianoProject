"""U63: the probe's per-row measurements, before and after, side by side, per learner, state and size.

Throwaway; reads app/build/u63/out/<label>/*.json and prints one line per row. Every number is as
measured in that run, on this machine and its face.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
labels = sys.argv[1:] or ['before', 'after']
SIZES = ['342x740', '342x740-dark', '342x740-115', '390x844', '740x342', '768x1024', '900x1200']


def load(label, name):
    path = os.path.join(OUT, label, name + '.json')
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf8') as f:
        return json.load(f)


def short(text, n=34):
    return text if len(text) <= n else text[: n - 1] + '~'


for learner in ['c6', 'held', 'waits']:
    for state in ['card', 'running']:
        for size in SIZES:
            name = f'{learner}-{state}-{size}'
            sets = [(label, load(label, name)) for label in labels]
            if not any(rows for _, rows in sets):
                continue
            print(f'== {name}')
            count = max(len(rows or []) for _, rows in sets)
            for i in range(count):
                parts = []
                for label, rows in sets:
                    if not rows or i >= len(rows):
                        parts.append(f'{label}: -')
                        continue
                    r = rows[i]
                    over = ' >96' if r['height'] > 96 else ''
                    parts.append(
                        f"{label}: t{r['titleLines']}{'c' if r['titleCut'] else ''} r{r['reasonLines']}{' CUT' if r['reasonCut'] else ' whole'}"
                        f" h{r['height']}{over} col{r['textWidth']} side{r['sideWidth']}{' badge-beside' if r['badgeBesideActions'] else (' badge-line' if r['badges'] else '')}"
                        f" | {r['reasonShown']}"
                    )
                first = (sets[-1][1] or sets[0][1])[i]
                print(f"  {first['slot']:<12} {short(first['title'])!s:<35} {first['badges'] or '':<10}")
                for part in parts:
                    print('     ' + part)
