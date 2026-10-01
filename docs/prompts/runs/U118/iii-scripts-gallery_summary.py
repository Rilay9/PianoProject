"""U118: the state gallery's chip read and broken cells, on the code before U118 and with it (this lane's
gallery.ts both times), from the two runs' states.json."""
import json
import sys
from pathlib import Path

out = []
for label, path in (("before U118 (base source)", sys.argv[1]), ("U118", sys.argv[2])):
    shots = json.loads(Path(path).read_text(encoding="utf-8"))
    chip = [s for s in shots if s.get("chip")]
    over = [s for s in chip if s["chip"]["under"]]
    broken = [s for s in shots if s["broke"]]
    out.append(f"## {label}\n")
    out.append(f"cells {len(shots)}; the chip drawn in {len(chip)}; the chip over the score's ink (chipOverInk) in {len(over)}; cells breaking anything: {len(broken)}\n")
    out.append("| cell | viewport | chip lines | marks under the chip |\n| --- | --- | --- | --- |")
    for s in chip:
        v = s["state"]["viewport"]
        out.append(f"| {s['cell']} | {v['w']}x{v['h']} | {s['chip']['lines']} | {', '.join(s['chip']['under']) or 'none'} |")
    out.append("\nbroken:\n")
    for s in broken:
        out.append(f"- {s['cell']}: {' | '.join(s['broke'])}")
    out.append("")
print("\n".join(out))
