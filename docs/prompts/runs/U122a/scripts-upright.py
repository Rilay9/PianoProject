"""Upright, c1 against c4 at rest: the header, the bar, the stage, and the controls on the row, per cell."""
import glob
import json
import os

base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
cells = {}
for f in sorted(glob.glob(os.path.join(base, 'r-up*-upright-*.json'))):
    d = json.load(open(f, encoding='utf-8'))
    cells.setdefault((d['vw'], d['vh'], d['text'], d['face'], d['piece']), {})[d['cand']] = d
for k, cs in sorted(cells.items()):
    out = []
    for c in ('c1', 'c4'):
        v = cs.get(c, {}).get('rest')
        if not v:
            continue
        g = v['geometry']
        t = v['texts']
        out.append(f"{c} head {g['head']['height'] if g['head'] else '-'} bar {g['bar']['height']} stage {v['glass']['stage']['height']} stave {v['glass']['stavePx']} slots {v['glass']['slotCount']} hear {t['hearOnBar']} hands {t['handsOnBar']} rows {v['controlRows']}")
    print(k, ' | '.join(out))
