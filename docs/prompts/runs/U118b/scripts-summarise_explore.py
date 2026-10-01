"""U118b: the exploration probe's reads (`scripts-explore.spec.ts`, run on the code before U118b), per
geometry and piece: the band the screen held, and the away sentence laid in an unseen copy of the chip
(as `foldedCornerReserve` lays every candidate) at 86 400, at Number.MAX_SAFE_INTEGER and at sixteen of
each digit, with the sixteen-digit runs' widths. Usage: python summarise_explore.py <explore-out> <out.md>
"""
import json
import sys
from pathlib import Path

rows = []
fonts = set()
for f in sorted(Path(sys.argv[1]).glob('*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    w = d['widths']
    widest = max(range(10), key=lambda i: w[i])
    tallest_digit = max(d['digits'], key=lambda x: x['bottom'])
    fonts.add(d['font'])
    by = d.get('byDigits')
    rows.append(
        f"| {d['cell']} | {d['at']} | {round(d['band'], 2)} | {d['old']['lines']} / {d['old']['bottom']} | "
        f"{d['max']['lines']} / {d['max']['bottom']} | {tallest_digit['lines']} / {tallest_digit['bottom']} | "
        f"{min(w)}–{max(w)} (widest {widest}) | {d['maxWidth']} | {''.join(str(x) for x in by) if by else '—'} |"
    )
out = [
    f"# U118b: the away sentence against the band ({sys.argv[3] if len(sys.argv) > 3 else 'on the code before U118b'}; this machine, Chromium)",
    '',
    f"The chip's computed type: {'; '.join(sorted(fonts))}. Lines / bottom edge in px from the stage's padding box.",
    'The last column: the away sentence\'s lines with a count of k of the widest digit, k = 1 … 16, left to right.',
    '',
    '| cell | bar m / m | band held by the build | at 86 400 | at MAX_SAFE_INTEGER | tallest of the ten 16-digit runs | 16-digit run widths | MAX_SAFE_INTEGER width | lines for k = 1 … 16 digits |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
] + rows
Path(sys.argv[2]).write_text('\n'.join(out) + '\n', encoding='utf-8')
print('\n'.join(out))
