"""Where the stage's reserve for the bar (`--score-bar-h`) disagrees with the bar's drawn height at rest.

At rest the stage stops `--score-bar-h` above the keys; `measureBar` writes it on a resize and a fold. A
disagreement means the reserve was measured at a moment the bar had another height, and the stage (so the
music) answers that moment, not the layout being measured.
"""
import glob
import json
import os
import sys

base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
pattern = sys.argv[1] if len(sys.argv) > 1 else '[rq]-*.json'
bad = 0
total = 0
for f in sorted(glob.glob(os.path.join(base, pattern))):
    d = json.load(open(f, encoding='utf-8'))
    for s, v in d.items():
        if not isinstance(v, dict) or 'geometry' not in v:
            continue
        if v.get('running') == 'true':
            continue
        g = v['geometry']
        if not g.get('bar') or g.get('barVisible') != 'true' or not g.get('barH'):
            continue
        total += 1
        h = float(g['barH'].rstrip('px'))
        if abs(h - g['bar']['height']) > 1.5:
            bad += 1
            print(f"{os.path.basename(f)} {s}: reserve {h} bar {g['bar']['height']}")
print(f"{bad} of {total} at-rest states disagree")
