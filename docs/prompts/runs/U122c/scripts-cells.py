"""One line per cell and moment from the walk's records: the music's top edge and stave, what the row
carried, the count's box, the finished sheet's verdict and primary action, and the failures."""
import glob
import json
import os
import sys

folder, out = sys.argv[1], sys.argv[2]
lines = ['cell | moment | stave top / size (px) | drawn controls | row | count box | notes']
for f in sorted(glob.glob(os.path.join(folder, '*.json'))):
    d = json.load(open(f, encoding='utf-8'))
    c = d['cell']
    name = f"{c['w']}x{c['h']} {c['text']}% {c['face']} {c['piece']}"
    for m in d['record']:
        ctl = m['controls']
        drawn = ' '.join(k + ('' if v['floor'] else '<40') for k, v in ctl.items() if v and v['shown'])
        notes = []
        if m.get('finished'):
            fin = m['finished']
            notes.append(f"outcome '{fin.get('heading')}' whole={fin.get('headingWhole')} verdict whole={fin.get('verdictWhole')} primary '{fin.get('primary')}' whole={fin.get('primaryWhole')} hit={fin.get('primaryHit')}")
        if m.get('refusal'):
            notes.append(f"refusal whole={m['refusal'].get('whole')}")
        if m.get('cue'):
            notes.append(f"cue whole={m['cue'].get('whole')}")
        if m.get('modeLabel'):
            notes.append(f"mode '{m['modeLabel']}' whole={m.get('modeWhole')}")
        if m.get('row'):
            notes.append(f"row={m['row']}")
        if m.get('handsFloor'):
            notes.append(f"handsFloor={m['handsFloor']}")
        deep = [p for p in m['chrome'] if p['depth'] > 0]
        if deep:
            notes.append('touches ' + ', '.join(f"{p['name']} {p['depth']}" for p in deep))
        lines.append(f"{name} | {m['moment']} | {m['staveTop']} / {m['stavePx']} | {drawn} | {m.get('chromeState')} | {m.get('countBox')} | {'; '.join(notes)}")
    for x in d['failures']:
        lines.append(f'{name} | FAILURE | {x}')
open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(len(lines), 'lines')
