"""Read-only, over the raw scan: every MuseTrainer tempo direction that carries a sound and words but no printed
mark, split into words that are a number ("47", MuseScore's written rit. steps) and words that are not; those
carrying exactly 120 listed in full, the rest counted by value (the pattern behind item 1's mechanism)."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
rows = [json.loads(l) for l in (ROOT / 'build/x40/raw-scan.jsonl').read_text(encoding='utf-8').splitlines() if l.strip()]
at120, other, numbers = [], Counter(), Counter()
for r in rows:
    if r['source'] != 'MT':
        continue
    software = (r['software'] or ['?'])[0]
    for s in r['statements']:
        if s['sound'] is None or s['marks'] or not s['words']:
            continue
        words = ' '.join(s['words'])
        if words.replace('.', '').strip().isdigit():
            numbers[s['sound'] == 120.0] += 1
            continue
        if s['sound'] == 120.0:
            at120.append(f"{r['id']} ({software}) @{s['measure']}:{s['offset']:g} \"{words}\" 120")
        else:
            other[s['sound']] += 1
lines = [f"words-only tempo directions (not a number) with a sound, no printed mark: {len(at120) + sum(other.values())}",
         f"carrying exactly 120: {len(at120)}"] + ['  ' + x for x in at120]
lines.append(f"carrying another value: {sum(other.values())}; the most frequent: {other.most_common(8)}")
lines.append(f"number-as-words directions (rit. steps written as numbers): {sum(numbers.values())}, of which at 120: {numbers[True]}")
(ROOT / 'docs/prompts/runs/X40/words-only-tempo.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines[:2] + lines[-2:]))
