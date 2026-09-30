"""
X42: on the unbuilt PDMX pool (noise-pdmx-pool.txt's list of positions with more than one sound and a mark), what the
reader would play at each position under the committed rule (the first sound), under the amended rule at the chosen
tolerance, and under two wider readings of "agrees" the rulings reject (a tolerance of 1, which would take a printed
integer as its sound's truncation; X40's ratio 1.1), to show what the tolerance's far side decides for an import.

Usage: python pool_stakes.py <noise-pdmx-pool.txt> <tolerance> <out.txt>
"""
import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding='utf-8').splitlines()
tolerance = float(sys.argv[2])
start = next(i for i, l in enumerate(text) if l.startswith('positions with more than one sound and a mark'))
end = next(i for i, l in enumerate(text) if l.startswith('every non-integer <sound tempo>'))
rows = []
for line in text[start + 1:end]:
    m = re.match(r'\s+(\S+) @(\S+): first mark (\S+) \(([\d.e+-]+)\); sounds (.*)$', line)
    if not m:
        continue
    mark = float(m.group(4))
    sounds = [float(s) for s in re.findall(r'([\d.]+) \(delta', m.group(5))]
    rows.append((m.group(1), m.group(2), m.group(3), mark, sounds))


def pick(sounds, agrees):
    return next((s for s in sounds if agrees(s)), sounds[0])


counts = {'positions': len(rows), 'amended moves': 0, 'tolerance 1 differs from amended': 0, 'ratio 1.1 differs from amended': 0}
examples = {'amended moves': [], 'tolerance 1 differs from amended': [], 'ratio 1.1 differs from amended': []}
for name, at, printed, mark, sounds in rows:
    first = sounds[0]
    amended = pick(sounds, lambda s: abs(s - mark) <= tolerance)
    wide = pick(sounds, lambda s: abs(s - mark) <= 1)
    ratio = pick(sounds, lambda s: max(s, mark) / min(s, mark) <= 1.1)
    for key, other in (('amended moves', first), ('tolerance 1 differs from amended', wide), ('ratio 1.1 differs from amended', ratio)):
        if (amended != other) if key != 'amended moves' else (amended != first):
            counts[key] += 1
            if len(examples[key]) < 12:
                examples[key].append(f"  {name} @{at}: mark {printed}; sounds {sounds[:6]}{'...' if len(sounds) > 6 else ''}; "
                                     f"first {first:g}, amended {amended:g}, tolerance-1 {wide:g}, ratio-1.1 {ratio:g}")
lines = [f"PDMX pool positions with more than one sound and a mark: {counts['positions']} (tolerance {tolerance})"]
for key in ('amended moves', 'tolerance 1 differs from amended', 'ratio 1.1 differs from amended'):
    lines.append(f"{key}: {counts[key]}")
    lines += examples[key]
Path(sys.argv[3]).write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
