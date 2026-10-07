"""Prints the at-rest stage, ink and bar coverage from U122a's unchanged probe (build/u122a/out/chk-*.json)."""
import glob
import json

for f in sorted(glob.glob('build/u122a/out/chk-*.json')):
    d = json.load(open(f, encoding='utf-8'))
    for k in ('rest', 'run-frozen', 'paused'):
        m = d.get(k)
        if not m or 'glass' not in m:
            continue
        g = m['glass']
        print(f.replace('\\', '/').split('/')[-1], k, 'stage', g['stage']['top'], g['stage']['bottom'], 'ink', g['ink'],
              'stave', g['stavePx'], g['fitBy'], 'bar', {kk: g['chrome']['bar'][kk] for kk in ('notes', 'texts', 'paths')} if 'bar' in g['chrome'] else None)
