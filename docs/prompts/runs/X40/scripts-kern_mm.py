"""Read-only: each kern row's `*MM` statements in its .krn against the built file's events (the reader's)
and against the catalogue's tempoBpm; the tempo words the .krn states (OMD, LO:TX) beside them."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
rows = json.loads((ROOT / 'build/x40/table.json').read_text(encoding='utf-8'))['rows']
counts = Counter()
lines = []
for r in rows:
    if r['source'] != 'kern':
        continue
    st = r['sourceTable']['kernStatements'] or []
    mm = [s for s in st if s['kind'] == '*MM']
    values = [float(s['text'].split()[0][3:]) for s in mm]
    events = r['reader']['events']
    ev = [e['bpm'] for e in events]
    words = [f"{s['kind']}@{s['line']}: {s['text']}" for s in st if s['kind'] != '*MM']
    if not mm:
        kind = 'no *MM (defaulted)'
    elif len(mm) == 1 and ev == values:
        kind = 'one *MM, built plays it'
    elif ev == values:
        kind = 'several *MM, built plays each'
    else:
        kind = 'MISMATCH'
    counts[kind] += 1
    cat = r['catalogueTempoBpm']
    if kind != 'one *MM, built plays it' or (cat is not None and cat != values[0]):
        lines.append(f"{r['id']}: {kind}; *MM {[(s['line'], s['text']) for s in mm]}; built events {[(e['measure'], e['offset'], e['bpm'], e['from']) for e in events]}; catalogue {cat}; words {words}")
    else:
        lines.append(f"{r['id']}: {kind} ({values[0]:g}); catalogue {cat}; words {words}")
print(dict(counts))
(ROOT / 'build/x40/kern-mm.txt').write_text(json.dumps(dict(counts)) + '\n' + '\n'.join(lines) + '\n', encoding='utf-8')
for l in lines:
    if 'MISMATCH' in l or 'several' in l:
        print(l)
