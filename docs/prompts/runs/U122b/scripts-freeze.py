"""The frozen run's stave at one cell in every run of the grid, and in U122a's probe rerun."""
import glob
import json

CELL = '780x360-t115-stack-moon'
for run in ('g', 'g2', 'g3-interrupted', 'f', 'ff'):
    label = run.split('-')[0]
    for f in glob.glob(f'build/u122b/out-{run}/{label}-c6-{CELL}.json'):
        d = json.load(open(f, encoding='utf-8'))
        p = d['playing']
        m = p['B'] if 'B' in p else p
        print(run, m['glass']['stavePx'])
for f in sorted(glob.glob('build/u122a/out/chk-*.json')):
    d = json.load(open(f, encoding='utf-8'))
    print(f.replace('\\', '/').split('/')[-1], d['run-frozen']['glass']['stavePx'])
