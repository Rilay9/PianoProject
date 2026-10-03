"""The paused and rest rows at 780x360 Moonlight: the row's box, its controls, and the flush row priced against the ink."""
import glob
import json

for f in sorted(glob.glob('build/u122b/out/g2-c6-780x360-*-moon.json')):
    d = json.load(open(f, encoding='utf-8'))
    for key in ('rest', 'paused', 'paused-refused'):
        m = d[key] if key == 'rest' else d[key]['B']
        g = m['glass']
        bar = g['chrome'].get('bar')
        fl = g['priced']['row-flush']
        ctl = {n: (c['rect']['top'], c['rect']['bottom']) for n, c in g['chrome'].items() if n.startswith('ctl:')}
        print(f.replace('\\', '/').split('/')[-1][7:-5], key, 'stave', g['stavePx'], 'ink', g['ink'], 'stage', g['stage']['bottom'],
              'bar', (bar['rect']['top'], bar['paths'], bar['depth']) if bar else None,
              'flush', (fl['rect'][1], fl['notes'], fl['texts'], fl['paths'], fl['depth']), 'ctl tops', sorted({v[0] for v in ctl.values()}))
