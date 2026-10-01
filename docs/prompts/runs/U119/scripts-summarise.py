"""U119: one line per probe cell, from the probe's JSONs. Usage: python summarise.py <label> [--long]"""
import glob
import json
import os
import sys

label = sys.argv[1]
long = '--long' in sys.argv
here = os.path.dirname(os.path.abspath(__file__))
rows = []
for f in sorted(glob.glob(os.path.join(here, 'probe-out', f'{label}-*.json'))):
    d = json.load(open(f, encoding='utf-8'))
    p = d['paused']
    if 'error' in p:
        rows.append(f"{d['vw']}x{d['vh']} t{d['text']} {d['face']:5} {d['variant']:4} ERROR {p['error'][:80]}")
        continue
    bad = {k: v for k, v in d['trial'].items() if v != 'ok'}
    mode = next(c for c in p['controls'] if c['sel'] == '#score-mode')
    tempo = next(c for c in p['controls'] if c['sel'] == '#score-tempo-label')
    line = (
        f"{d['vw']}x{d['vh']} t{d['text']} {d['face']:5} {d['variant']:4} | "
        f"group {p['group']['width']:6.1f} (content {p['group']['scrollWidth']}) first-control@{p['firstControlLeft']:6.1f} | "
        f"back {p['back']['shown']:5.1f}/{p['back']['box']['width']:5.1f} whole={p['back']['textWhole']!s:5} | "
        f"title {p['title']['box']['width']:5.1f} | "
        f"where {p['where']['shown']:5.1f}/{p['where']['box']['width']:5.1f} whole={p['where']['textWhole']!s:5} | "
        f"status shown {p['status']['shown']:5.1f}/{p['status']['box']['width']:5.1f} ell={p['status']['ellipsis']!s:5} | "
        f"rows {p['bar']['rows']} h {p['bar']['height']} | mode '{mode.get('text')}' {mode['box']['width']:.0f} | tempo '{tempo.get('text')}' | "
        f"over {p['over']} | trial-bad {bad} | real-play {d['realPlay']}"
    )
    if 'wideWhere' in d and 'error' not in d['wideWhere']:
        w = d['wideWhere']
        line += f" || wide '{w['where']['text']}' {w['where']['shown']:.1f}/{w['where']['box']['width']:.1f} whole={w['where']['textWhole']} over={w['over']}"
    rows.append(line)
    if long:
        rows.append('    controls ' + ', '.join(f"{c['sel'][1:]}:{c['box']['left']:.0f}-{c['box']['right']:.0f}:{c['hit']}" for c in p['controls'] if c.get('present')))
print('\n'.join(rows))
