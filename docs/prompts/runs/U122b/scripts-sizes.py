"""U124 and the tap floor: every drawn control's box per text size under B, across every cell and state, as min width x min height."""
import collections
import glob
import json
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'build/u122b/out'
LABEL = sys.argv[2] if len(sys.argv) > 2 else 'g2'
agg = collections.defaultdict(lambda: [1e9, 1e9, 0, 0])
bar_h = collections.defaultdict(set)
for f in glob.glob(f'{SRC}/{LABEL}-*.json'):
    d = json.load(open(f, encoding='utf-8'))
    for key, v in d.items():
        if not isinstance(v, dict):
            continue
        m = v.get('B', v) if ('B' in v or 'A' in v) else v
        if not isinstance(m, dict) or 'controls' not in m:
            continue
        for c in m['controls']:
            if not c['shown'] or c['missed']:
                continue
            a = agg[(d['text'], c['id'])]
            a[0] = min(a[0], c['rect']['width'])
            a[1] = min(a[1], c['rect']['height'])
            a[2] += 1
        if m['geometry']['bar'] and m['x']['barVisible'] == 'true' and key in ('rest', 'rest-tempo'):
            bar_h[d['text']].add(m['geometry']['bar']['height'])
for (t, cid), (w, h, n, _) in sorted(agg.items()):
    print(f"t{t} {cid:20} min {w:6.2f} x {h:5.2f}  ({n} drawn, hit at five points)")
for t, hs in sorted(bar_h.items()):
    print(f"t{t} the row's height at rest: {sorted(hs)}")
