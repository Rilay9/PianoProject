"""U118b: read one grid cell's reruns. Usage: python read_reruns.py <prefix> <cell file stem> [arm reads: run|turnedRun]"""
import json
import sys
from pathlib import Path

prefix, stem = sys.argv[1], sys.argv[2]
part = sys.argv[3] if len(sys.argv) > 3 else 'run'
for folder in sorted(Path('build/u118b').glob(f'grid-{prefix}*')):
    f = folder / f'{stem}.json'
    if not f.exists():
        print(folder.name, 'missing')
        continue
    d = json.loads(f.read_text(encoding='utf-8'))
    r = d[part]
    fold = d['fold'] if part == 'run' else d['turnedFold']
    print(folder.name, f"{r['slots']}/{r['systems']}/{r['shown']}", r['drawn'], 'band', r['band'], [(p['top'], p['ahead']) for p in fold['placed']])
