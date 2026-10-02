"""Two runs of the grid side by side (states.txt from each): every cell and state whose checks or music differ.

Usage: python compare.py tables-g/states.txt tables-g2/states.txt
"""
import re
import sys


def load(f):
    r = {}
    for line in open(f, encoding='utf-8'):
        m = re.match(r'(\S+ \S+ \S+ \S+) \| (\S+) +(A|B) \| 1 (.*?) \| 2 (.*?) \| 3 top (\S+) stave (\S+)(.*?) \| 4 (.*)$', line.rstrip('\n'))
        if m:
            cell, key, var, c1, c2, top, stave, moved, c4 = m.groups()
            r[(cell, key, var)] = {'1': c1, '2': c2, 'top': top, 'stave': stave, 'moved': moved.strip(), '4': c4.split(':')[0]}
    return r


a, b = load(sys.argv[1]), load(sys.argv[2])
same = diff = 0
for k in sorted(set(a) | set(b)):
    x, y = a.get(k), b.get(k)
    if x is None or y is None:
        print('only in one run:', k)
        diff += 1
        continue
    d = [f'{f}: {x[f]!r} -> {y[f]!r}' for f in ('1', '2', '4', 'stave', 'top', 'moved') if x[f] != y[f]]
    if d:
        diff += 1
        print(f"{k[0]} | {k[1]} {k[2]} | " + ' | '.join(d))
    else:
        same += 1
print(f'{same} states identical in both runs, {diff} differ')
