"""The height each candidate's chrome takes at rest, per text size and face: the bar, the top line or zone,
the thin line, and the band a run keeps (c5, c6), from the run flow's at-rest state."""
import glob
import json
import os
from collections import defaultdict

base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
rows = defaultdict(lambda: defaultdict(set))
for f in sorted(glob.glob(os.path.join(base, 'r-*.json'))):
    d = json.load(open(f, encoding='utf-8'))
    v = d.get('rest')
    if not isinstance(v, dict) or 'geometry' not in v:
        continue
    g = v['geometry']
    k = (d['mode'], d['cand'], d['text'], d['face'])
    for name in ('bar', 'top', 'line', 'head'):
        if g.get(name):
            rows[k][name].add(round(g[name]['height'], 1))
    if g.get('band'):
        rows[k]['band'].add(g['band'])
for k in sorted(rows):
    print(' '.join(k), {n: sorted(s) for n, s in rows[k].items()})
