"""Counts the U122c walk's records mechanically: per device and moment, the cells measured and the cells
with no failure; every failure; what the row carried; the music's edge and stave through the walk."""
import collections
import glob
import json
import os
import sys

folder = sys.argv[1]
DEVICE = {
    (568, 320): 'phone sideways', (780, 360): 'phone sideways',
    (342, 740): 'phone upright', (360, 780): 'phone upright',
    (1024, 768): 'tablet', (768, 1024): 'tablet', (1366, 1024): 'tablet', (1024, 1366): 'tablet',
}
MOMENTS = ['rest', 'count-in', 'armed', 'playing', 'paused', 'refused', 'finished']
measured = collections.Counter()
clean = collections.Counter()
failures = []
cells = 0
cells_clean = 0
hands = collections.Counter()
deferred = collections.Counter()
today = collections.Counter()
modes = collections.Counter()
edge = collections.defaultdict(float)
verdict = collections.Counter()
primary = collections.Counter()
for f in sorted(glob.glob(os.path.join(folder, '*.json'))):
    d = json.load(open(f, encoding='utf-8'))
    c = d['cell']
    dev = DEVICE[(c['w'], c['h'])]
    cells += 1
    if not d['failures']:
        cells_clean += 1
    failed_moments = {x.split(':', 1)[0] for x in d['failures']}
    for x in d['failures']:
        failures.append(f"{c['w']}x{c['h']} {c['text']}% {c['face']} {c['piece']} — {x}")
    rest = None
    for m in d['record']:
        mo = m['moment']
        measured[(dev, mo)] += 1
        if mo not in failed_moments:
            clean[(dev, mo)] += 1
        if mo == 'rest':
            rest = m
            ctl = m['controls']
            on = bool(ctl.get('handsR') and ctl['handsR']['shown'])
            hands[(dev, 'Hands on the row' if on else 'Hands behind ⋯')] += 1
            if on and m.get('handsFloor') == 'false':
                deferred[(dev, f"{c['w']}x{c['h']} {c['text']}% {c['face']}")] += 1
            if m.get('row') == 'today':
                today[(dev, f"{c['w']}x{c['h']} {c['text']}% {c['face']}", 'mode whole' if m.get('modeWhole') else 'mode cut')] += 1
            modes[(dev, m.get('modeLabel'))] += 1
        elif mo != 'finished' and rest and m['staveTop'] is not None and rest['staveTop'] is not None:
            edge[dev] = max(edge[dev], abs(m['staveTop'] - rest['staveTop']))
        if mo == 'finished' and m.get('finished'):
            fin = m['finished']
            verdict[(dev, 'verdict whole' if fin.get('verdictWhole') in (True, None) else 'verdict cut')] += 1
            primary[(dev, fin.get('primary'), 'whole' if fin.get('primaryWhole') else 'NOT whole')] += 1
print(f'cells {cells}, with no failure {cells_clean}')
print('\nper device and moment: cells with no failure / cells measured')
for dev in ['phone sideways', 'phone upright', 'tablet']:
    row = [f"{mo} {clean[(dev, mo)]}/{measured[(dev, mo)]}" for mo in MOMENTS if measured[(dev, mo)]]
    print(f'  {dev}: ' + ', '.join(row))
print('\nthe largest move of the music\'s top edge from rest, any moment but finished (px):')
for dev, v in edge.items():
    print(f'  {dev}: {v:.2f}')
print('\nat rest: Hands')
for k, v in sorted(hands.items()):
    print(f'  {k[0]}: {k[1]} {v}')
print('\nat rest: Hands kept at its own width where the floor alone would send it behind ⋯ (the open trade)')
for k, v in sorted(deferred.items()):
    print(f'  {k[0]}: {k[1]} ({v})')
print("\nat rest: today's row kept upright, where the chooser would keep less (the open trade)")
for k, v in sorted(today.items()):
    print(f'  {k[0]}: {k[1]}, {k[2]} ({v})')
print('\nat rest: the selected mode as drawn (Keep tempo selected)')
for k, v in sorted(modes.items(), key=lambda kv: (kv[0][0], str(kv[0][1]))):
    print(f'  {k[0]}: "{k[1]}" {v}')
print('\nfinished: the verdict and the primary action in the first view')
for k, v in sorted(verdict.items()):
    print(f'  {k[0]}: {k[1]} {v}')
for k, v in sorted(primary.items(), key=lambda kv: str(kv[0])):
    print(f'  {k[0]}: "{k[1]}" {k[2]} {v}')
print(f'\nfailures ({len(failures)}):')
for x in failures:
    print('  ' + x)
