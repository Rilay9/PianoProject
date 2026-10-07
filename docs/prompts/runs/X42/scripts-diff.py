"""
X42's corpus diff: the app reader's events on every built score, committed reader (before.jsonl) against the
amended one (after.jsonl), both written by census.table.ts. Lists every position whose event changed, every row
whose opening changed, and X40's findings (a sound the reader plays against the printed mark beside it beyond
R = 1.1, `tempoSoundAgainstMark.test.ts`) before and after on the MuseTrainer and kern rows.

Usage: python diff.py <before.jsonl> <after.jsonl> <catalog.json> <tolerance> <out.txt>
"""
import json
import sys
from pathlib import Path

before = {json.loads(l)['id']: json.loads(l) for l in Path(sys.argv[1]).read_text(encoding='utf-8').splitlines() if l.strip()}
after = {json.loads(l)['id']: json.loads(l) for l in Path(sys.argv[2]).read_text(encoding='utf-8').splitlines() if l.strip()}
catalog = json.loads(Path(sys.argv[3]).read_text(encoding='utf-8'))
items = {i['id']: i for i in (catalog if isinstance(catalog, list) else catalog['items'])}
tolerance = sys.argv[4]
R = 1.1


def findings(row):
    return [f"@{e['at']} sound {e['bpm']:g} against mark {e['mark']:g}" for e in row['events']
            if e['from'] == 'sound' and e['mark'] is not None and max(e['bpm'], e['mark']) / min(e['bpm'], e['mark']) > R]


lines = [f"X42 corpus census through the app's reader (toMusicXml + tempoEvents), SERIALIZATION_TOLERANCE = {tolerance}",
         f"rows read: before {len(before)}, after {len(after)}; same ids: {set(before) == set(after)}; "
         f"MuseTrainer and kern rows: {sum(1 for r in after.values() if r['mtOrKern'])}"]
moved_positions = []
moved_rows = set()
for rid in sorted(before):
    b, a = before[rid], after[rid]
    bat = {e['at']: e for e in b['events']}
    aat = {e['at']: e for e in a['events']}
    if list(bat) != list(aat):
        moved_rows.add(rid)
        moved_positions.append(f"  {rid}: positions differ: before {list(bat)} after {list(aat)}")
        continue
    for at, e in bat.items():
        if e != aat[at]:
            moved_rows.add(rid)
            moved_positions.append(f"  {rid} ({b['source']}) @{at}: before {e['bpm']:g} from {e['from']} (mark {e['mark']}); "
                                   f"after {aat[at]['bpm']:g} from {aat[at]['from']} (mark {aat[at]['mark']})")
lines.append(f"positions whose event changed: {len(moved_positions)}, on {len(moved_rows)} rows (of {len(before)}):")
lines += moved_positions
lines.append("rows whose played sequence changed (every event's bpm, in order):")
def seq(row):
    return ','.join(format(e['bpm'], 'g') for e in row['events'])


for rid in sorted(moved_rows):
    lines.append(f"  {rid}: before {seq(before[rid])}; after {seq(after[rid])}")
lines.append("rows whose opening (the event at 0:0) changed, with the catalogue's tempoBpm:")
for rid in sorted(before):
    bo = next((e['bpm'] for e in before[rid]['events'] if e['at'] == '0:0'), None)
    ao = next((e['bpm'] for e in after[rid]['events'] if e['at'] == '0:0'), None)
    if bo != ao:
        cat = items.get(rid, {}).get('tempoBpm')
        lines.append(f"  {rid}: opening before {bo:g}, after {ao:g}; catalogue tempoBpm {cat}; catalogue equals opening before "
                     f"{cat == bo}, after {cat == ao}")
fb = {rid: findings(r) for rid, r in before.items() if r['mtOrKern']}
fa = {rid: findings(r) for rid, r in after.items() if r['mtOrKern']}
nb = sum(len(v) for v in fb.values())
na = sum(len(v) for v in fa.values())
lines.append(f"X40's findings (R = {R}) on the MuseTrainer and kern rows: before {nb} on {sum(1 for v in fb.values() if v)} rows; "
             f"after {na} on {sum(1 for v in fa.values() if v)} rows")
for rid in sorted(set(fb) | set(fa)):
    gone = [f for f in fb.get(rid, []) if f not in fa.get(rid, [])]
    new = [f for f in fa.get(rid, []) if f not in fb.get(rid, [])]
    kept = [f for f in fa.get(rid, []) if f in fb.get(rid, [])]
    if gone or new:
        lines.append(f"  {rid}: gone {gone}; new {new}; kept {len(kept)}")
    elif kept:
        lines.append(f"  {rid}: unchanged, {len(kept)} kept")
fall = {rid: findings(r) for rid, r in after.items() if not r['mtOrKern']}
fball = {rid: findings(r) for rid, r in before.items() if not r['mtOrKern']}
lines.append(f"the same findings on every other built row (not pinned anywhere; for the diff only): before "
             f"{sum(len(v) for v in fball.values())}, after {sum(len(v) for v in fall.values())}, "
             f"identical {fball == fall}")
Path(sys.argv[5]).write_text('\n'.join(lines) + '\n', encoding='utf-8')
sys.stdout.buffer.write(('\n'.join(lines) + '\n').encode('utf-8'))
