"""Trim noise-pdmx-pool.txt (over the 300 KB kept-log limit) to its summary: the counts, every distinct delta under 5,
the first 40 pairs at the smallest deltas, and the size of each section left out."""
from pathlib import Path

lines = Path('build/x42/census/noise-pdmx-pool.txt').read_text(encoding='utf-8').splitlines()
pairs_at = next(i for i, l in enumerate(lines) if l.startswith('every pair at a delta of'))
multi_at = next(i for i, l in enumerate(lines) if l.startswith('positions with more than one sound'))
values_at = next(i for i, l in enumerate(lines) if l.startswith('every non-integer <sound tempo>'))
out = ['X42 noise scan over the unbuilt PDMX pool (build/pdmx, build/pdmx-folk, build/pdmx-p22 in the main checkout, read',
       'only; sources are the pool\'s shard folders). Trimmed: the full listing was 1.2 MB and is not kept.', '']
out += lines[:pairs_at + 1]
out += lines[pairs_at + 1:pairs_at + 41]
out.append(f'  ... {multi_at - pairs_at - 41} more pairs under 5 not kept; among them, every 68.1-against-68 and 74.1-against-74 pair:')
out += [l for l in lines[pairs_at + 41:multi_at] if 'sound 68.1 against quarter=68 ' in l or 'sound 74.1 against quarter=74 ' in l]
out.append(f'{lines[multi_at]} {values_at - multi_at - 1} positions (listing not kept; pool-stakes.txt reads it)')
out.append(f'{lines[values_at]} (not kept)')
Path('build/x42/census/noise-pdmx-pool-summary.txt').write_text('\n'.join(out) + '\n', encoding='utf-8')
print(len('\n'.join(out)))
