"""U63: one line per learner, state and size: session rows, reasons cut, rows over 96 px, the tallest row,
before and after. Throwaway; every number as measured in that run, on this machine and its face."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
pairs = [('before', 'after'), ('before-verdana', 'after-verdana')]
SIZES = ['342x740', '342x740-dark', '342x740-115', '390x844', '740x342', '768x1024', '900x1200']


def load(label, name):
    path = os.path.join(OUT, label, name + '.json')
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf8') as f:
        return json.load(f)


def facts(rows):
    return {
        'n': len(rows),
        'cut': sum(1 for r in rows if r['reasonCut']),
        'over': sum(1 for r in rows if r['height'] > 96),
        'max': max(r['height'] for r in rows),
        'two_two': sum(1 for r in rows if r['titleLines'] == 2 and r['reasonLines'] == 2),
    }


print('learner/state/size                 rows | reasons cut  before -> after | rows > 96 px  before -> after | tallest (px) before -> after | 2-line title and 2-line reason, after')
for before, after in pairs:
    face = ' (Verdana)' if 'verdana' in after else ''
    for learner in ['c6', 'held', 'waits']:
        for state in ['card', 'running']:
            for size in SIZES:
                name = f'{learner}-{state}-{size}'
                b, a = load(before, name), load(after, name)
                if not b or not a:
                    continue
                fb, fa = facts(b), facts(a)
                print(f"{(name + face):<34} {fa['n']:>4} | {fb['cut']:>2} -> {fa['cut']:<2} | {fb['over']:>2} -> {fa['over']:<2} | {fb['max']:>6} -> {fa['max']:<6} | {fa['two_two']}")
