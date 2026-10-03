"""Spot checks behind sentences in the design's §8: the next music under c1, c4's at-rest cost cells, the
smallest stave under an at-rest refusal per candidate, the refusal counts per state, and the test totals."""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import analyse  # noqa: E402

cells = analyse.load()
keys = sorted(cells)
here = os.path.dirname(os.path.abspath(__file__))

print('## next music in view under c1, sideways, at rest and at the freeze')
for s in ('rest', 'run-frozen'):
    n = [analyse.nxt(analyse.st(cells[k]['c1'], s)['glass']) for k in keys if k[0] == 'sideways' and analyse.st(cells[k]['c1'], s)]
    print(f"  {s}: in view {sum(1 for x in n if x)} of {len(n)}")

print('## c4: cells where the stave is smaller than c1 at rest (by more than half a pixel)')
rows = []
for k in keys:
    if k[0] != 'sideways':
        continue
    a, b = analyse.st(cells[k]['c4'], 'rest'), analyse.st(cells[k]['c1'], 'rest')
    if a and b and a['glass']['stavePx'] is not None and b['glass']['stavePx'] - a['glass']['stavePx'] > 0.5:
        rows.append(analyse.cell_name(k))
print(f"  {len(rows)}: " + '; '.join(rows))

print('## the smallest stave under an at-rest refusal, per candidate, sideways')
for c in analyse.CANDS:
    best = None
    for k in keys:
        if k[0] != 'sideways' or c not in cells[k]:
            continue
        for s in analyse.REST_REFUSALS:
            v = analyse.st(cells[k][c], s)
            if v and v['glass']['stavePx'] is not None and (best is None or v['glass']['stavePx'] < best[0]):
                best = (v['glass']['stavePx'], analyse.cell_name(k), s)
    print(f"  {c}: {best}")

print('## refusal states that are not ok, per candidate and state, sideways')
for c in analyse.CANDS:
    for s in analyse.REST_REFUSALS + ['paused-refused-play']:
        n = bad = 0
        for k in keys:
            if k[0] != 'sideways' or c not in cells[k]:
                continue
            v = analyse.st(cells[k][c], s)
            if not v or not v.get('refusal'):
                continue
            r = v['refusal']
            nm = r['named'] or {}
            n += 1
            ok = r['whole'] and r['lines'] == 1 and r['inWindow'] and nm.get('shown') and nm.get('inWindow') and not nm.get('missed')
            bad += 0 if ok else 1
        print(f"  {c} {s}: {n - bad} of {n} ok")

print('## tests run, from the logs')
total = 0
for f in sorted(glob.glob(os.path.join(here, 'run-[rq]-*.txt')) + glob.glob(os.path.join(here, 'rerun-*.txt'))):
    t = open(f, encoding='utf-8', errors='replace').read()
    m = re.search(r'(\d+) passed', t)
    fl = re.search(r'(\d+) failed', t)
    total += int(m.group(1)) if m else 0
    if fl:
        print('  FAILED in', os.path.basename(f), fl.group(1))
print(f"  passed in all: {total}")
pairs = sum(len(v) for v in cells.values())
print(f"  cell-candidate pairs in the final data: {pairs}")
states = 0
for k in keys:
    for c, d in cells[k].items():
        states += sum(1 for s in analyse.ALL_STATES if analyse.st(d, s))
print(f"  measured states in the final data (rest counted once): {states}")
