"""
X40: every non-trivial row in full. For each position where the facts disagree (a sound against a
co-located printed mark beyond R, two different sounds at one position, a second printed mark at one
position), what each candidate rule would play there, and whether the position sounds at all (a tempo at
a bar's end is superseded at the next bar's start before any note).

Candidate rules, for the reviewer's question (none is applied anywhere; the app's reader is unchanged):
  first  - the first sound in score order (the app's reader today, `tempoFromXml.ts` resolve :237);
  last   - the last sound in score order (MuseScore 2.1.0's own tempo map: `TempoMap::setTempo` overwrites
           the entry at a tick, and `Score::fixTicks` calls it for each tempo text of a segment in turn);
  agree  - a sound that agrees (within R) with a co-located printed mark, else the first sound;
  mark   - the printed numeric mark over any sound at its position (the reviewer's provisional product rule).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = float(sys.argv[1]) if len(sys.argv) > 1 else 1.1
table = {r['id']: r for r in json.loads((ROOT / 'build/x40/table.json').read_text(encoding='utf-8'))['rows']}
raw = {json.loads(l)['id']: json.loads(l) for l in (ROOT / 'build/x40/raw-scan.jsonl').read_text(encoding='utf-8').splitlines() if l.strip()}


def ratio(a, b):
    return max(a, b) / min(a, b)


out = []
for rid, row in table.items():
    scan = raw[rid]
    by_pos = {}
    for s in scan['statements']:
        by_pos.setdefault((s['measure'], s['offset']), []).append(s)
    cases = []
    for (measure, offset), here in sorted(by_pos.items()):
        sounds = [s['sound'] for s in here if s['sound'] is not None]
        marks = [m['quarters'] for s in here for m in s['marks'] if m['quarters']]
        # A sound that agrees with no printed mark at its position (two marks each with its own agreeing
        # sound is a second mark, not a contradiction).
        contradiction = bool(marks) and any(all(ratio(s, m) > R for m in marks) for s in sounds)
        differing = len(set(sounds)) > 1
        two_marks = len(set(marks)) > 1
        if not (contradiction or differing or two_marks):
            continue
        lengths = scan['measureLengths'].get(str(here[0]['part'])) or scan['measureLengths'].get(here[0]['part'])
        length = lengths[measure] if lengths and measure < len(lengths) else None
        silent = length is not None and offset >= length - 0.01
        first = sounds[0] if sounds else None
        last = sounds[-1] if sounds else None
        agreeing = next((s for s in sounds for m in marks[:1] if ratio(s, m) <= R), None)
        agree = agreeing if agreeing is not None else first
        mark = marks[0] if marks else first
        detail = '; '.join(
            (f"sound {s['sound']:g}" if s['sound'] is not None else 'no sound')
            + ''.join(f" with mark {'/'.join(m['beatUnit'])}{'.' * m['dots']}={m['perMinute']}" for m in s['marks'])
            + (f" on words {s['words']}" if s['words'] else '')
            for s in here)
        kinds = [k for k, v in (('sound contradicts mark', contradiction), ('two different sounds', differing), ('two different marks', two_marks)) if v]
        cases.append({
            'at': f"{measure}:{offset:g}", 'number': here[0]['number'], 'kinds': kinds, 'barLength': length,
            'sounds': not silent, 'statements': detail,
            'plays': {'first (today)': first, 'last': last, 'agree': agree, 'mark': mark},
        })
    extra = []
    if row['catalogueEqualsOpening'] is False:
        extra.append(f"catalogue tempoBpm {row['catalogueTempoBpm']} but the reader opens at {row['reader']['openingPlays']:g} (reader opening {row['reader']['opening']})")
    if cases or extra:
        out.append({'id': rid, 'source': row['source'], 'software': scan['software'], 'verdict': row['verdict'],
                    'catalogueTempoBpm': row['catalogueTempoBpm'], 'openingPlays': row['reader']['openingPlays'],
                    'cases': cases, 'other': extra})

(ROOT / 'build/x40/disagreements.json').write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
lines = [f"R = {R}. Rows with a non-trivial case: {len(out)}."]
for o in out:
    lines.append(f"\n## {o['id']} ({o['source']}, {', '.join(o['software'] or [])}) - verdict: {o['verdict']}; catalogue {o['catalogueTempoBpm']}; opening plays {o['openingPlays']:g}")
    for x in o['other']:
        lines.append(f"  - {x}")
    for c in o['cases']:
        p = c['plays']
        lines.append(f"  - @{c['at']} (bar number {c['number']}; {' + '.join(c['kinds'])}; {'sounds' if c['sounds'] else 'silent: at the bar end, superseded at the next bar'}): {c['statements']}")
        lines.append(f"      plays: first (today) {p['first (today)']}; last {p['last']}; agree-with-mark {p['agree']}; mark-over-sound {p['mark']}")
(ROOT / 'build/x40/disagreements.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
