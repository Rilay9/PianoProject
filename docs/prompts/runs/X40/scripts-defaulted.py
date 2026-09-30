"""Read-only: the rows whose source states no tempo, what the built file writes, and what the catalogue says."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
catalog = {r['id']: r for r in json.loads((ROOT / 'app/public/content/catalog.json').read_text(encoding='utf-8'))}
reader = {json.loads(l)['id']: json.loads(l) for l in (ROOT / 'build/x40/reader-dump.jsonl').read_text(encoding='utf-8').splitlines() if l.strip()}
mt = json.loads((ROOT / 'build/x40/mt-sources.json').read_text(encoding='utf-8'))
table = {r['id']: r for r in json.loads((ROOT / 'build/x40/table.json').read_text(encoding='utf-8'))['rows']}
rows = []
for rid, one in reader.items():
    c = catalog[rid]
    if one['source'] == 'MT':
        defaulted = 'no tempo of its own' in mt[rid]['normalised']
    else:
        st = table[rid]['sourceTable']['kernStatements'] or []
        defaulted = not any(s['kind'] == '*MM' for s in st)
    if not defaulted:
        continue
    facts = (c.get('provenance') or {}).get('facts', {}).get('tempo')
    ev = one['events']
    rows.append((one['source'], rid, c.get('tempoBpm'), [(e['measure'], e['offset'], e['bpm'], e['from'], (e.get('mark') or {}).get('quarters')) for e in ev], facts, c.get('tags')))
for r in rows:
    print(r)
print(len(rows), 'defaulted rows')
