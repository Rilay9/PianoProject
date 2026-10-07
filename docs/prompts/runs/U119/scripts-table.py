"""U119: the probe's cells as a tight table. Usage: python table.py <label>"""
import glob
import json
import os
import sys

label = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
print('cell                         | group  | back      | where (whole)        | wide where           | status shown | title | tempo          | covered controls (geometry) | trial-bad | real ▶')
for f in sorted(glob.glob(os.path.join(here, 'probe-out', f'{label}-*.json'))):
    d = json.load(open(f, encoding='utf-8'))
    p = d['paused']
    cell = f"{d['vw']}x{d['vh']} t{d['text']} {d['face']:5} {d['variant']:7}"
    if 'error' in p:
        print(cell, 'ERROR')
        continue
    tempo = next(c for c in p['controls'] if c['sel'] == '#score-tempo-label')
    covered = sorted({o.split('>')[1] for o in p['over']})
    bad = {k: v.replace('intercepted by ', 'x ') for k, v in d['trial'].items() if v != 'ok'}
    wide = ''
    if 'wideWhere' in d and 'error' not in d['wideWhere']:
        w = d['wideWhere']['where']
        wide = f"{w['shown']:5.1f}/{w['box']['width']:5.1f} {'whole' if w['textWhole'] else 'CUT'}"
    print(
        f"{cell} | {p['group']['width']:6.1f} | "
        f"{p['back']['shown']:4.1f}/{p['back']['box']['width']:4.1f} {'ok' if p['back']['textWhole'] else 'CUT'} | "
        f"{p['where']['shown']:5.1f}/{p['where']['box']['width']:5.1f} {'whole' if p['where']['textWhole'] else 'CUT':5} | {wide:20} | "
        f"{p['status']['shown']:5.1f} | {p['title']['box']['width']:5.1f} | {tempo.get('text')!s:14} | {covered} | {bad} | {d['realPlay'].replace('intercepted by ', 'x ')}"
    )
