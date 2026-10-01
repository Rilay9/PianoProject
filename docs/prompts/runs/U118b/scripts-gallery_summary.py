"""U118b: the state gallery's chip read and broken cells, on the code before U118b and with it, from the
two runs' states.json (U118's `iii-scripts-gallery_summary.py`, with this lane's labels).
Usage: python gallery_summary.py <before states.json> <after states.json> <out .md>"""
import json
import sys
from pathlib import Path

out = ['# U118b: the state gallery before and after the fourteen-digit bound', '']
for label, path in (('before U118b (the sentinel at 86 400)', sys.argv[1]), ('U118b (fourteen of the widest digit)', sys.argv[2])):
    shots = json.loads(Path(path).read_text(encoding='utf-8'))
    chip = [s for s in shots if s.get('chip')]
    over = [s for s in chip if s['chip']['under']]
    broken = [s for s in shots if s['broke']]
    out.append(f'## {label}\n')
    out.append(f"cells {len(shots)}; the chip drawn in {len(chip)}; the chip over the score's ink (chipOverInk) in {len(over)}; cells breaking anything: {len(broken)}\n")
    out.append('| cell | viewport | chip lines | marks under the chip |\n| --- | --- | --- | --- |')
    for s in chip:
        v = s['state']['viewport']
        out.append(f"| {s['cell']} | {v['w']}x{v['h']} | {s['chip']['lines']} | {', '.join(s['chip']['under']) or 'none'} |")
    out.append('\nbroken:\n')
    for s in broken:
        out.append(f"- {s['cell']}: {' | '.join(s['broke'])}")
    out.append('')
Path(sys.argv[3]).write_text('\n'.join(out), encoding='utf-8')
print('\n'.join(line for line in out if line.startswith(('cells', '- ', '##'))))
