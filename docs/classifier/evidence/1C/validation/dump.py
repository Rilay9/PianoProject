"""dump.py ID FIRST LAST : notes (tied) per staff for 0-based bar indices FIRST..LAST, positions in quarters."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import *  # noqa

iid, a, z = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
sc = load(iid)
starts = [fr(s) for s in sc.measure_starts]
nums = [m.number for m in sc.part_score.parts[0].measures]
import partitura as pt
for pi, part in enumerate(sc.part_score.parts):
    q = part.quarter_map
    rows = []
    for n in part.notes_tied:
        o = fr(q(n.start.t)); e = fr(q(n.end_tied.t))
        m = max(j for j in range(len(starts)) if starts[j] <= o)
        if a <= m <= z:
            sd = n.symbolic_duration or {}
            rows.append((m, n.staff, o - starts[m], n.step + (('#' if n.alter == 1 else 'b' if n.alter == -1 else '') if n.alter else '') + str(n.octave),
                         float(e - o), sd.get("type"), sd.get("dots", 0), sd.get("actual_notes"), "tied" if n.tie_next else "",
                         ",".join(getattr(n, "articulations", None) or []), n.voice))
    for r in sorted(rows, key=lambda r: (r[0], r[1] or 0, r[2])):
        print(f"part{pi} bar[{r[0]}] no.{nums[r[0]] if r[0] < len(nums) else '?'} st{r[1]} v{r[10]} at {str(r[2]):>6} {r[3]:<5} dur {r[4]:.3g} {r[5]}{'.' * (r[6] or 0)} {('tup' + str(r[7])) if r[7] else ''} {r[8]} {r[9]}")
print("metres:", {m: (int(sc.notes['ts_beats'][i]), int(sc.notes['ts_beat_type'][i])) for i, m in enumerate(sc.measure) if a <= m <= z})
