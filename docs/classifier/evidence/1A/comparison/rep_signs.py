"""Where the segno / coda signs sit inside their bars, and the raw jump directions, for the named items (reading aid for the expected counts).
Prints, per item: every segno/coda direction or barline sign with its bar (1-based), its offset into the bar (quarter notes), the bar's length, and every
<sound> jump attribute. No played-bar count is computed here."""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from rcommon import *
walk, common, rr = load_validators()
from common import BYID, cache

IDS = sys.argv[1:] or ["song.folk.down-by-the-riverside.pdmx.2", "song.classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx",
                       "song.classical.nazareth-carioca-1913.pdmx", "song.classical.anonymous-romance-anonimo-romanza.pdmx"]
for i in IDS:
    w = cache(i)
    starts = {k: (s, l) for k, (s, l) in enumerate(w["measures"][0])}
    print("==", i, "bars", len(starts))
    for d in w["dirs"]:
        if d["part"] != 0:
            continue
        if d["kind"] in ("segno", "coda", "soundjump") or (d["kind"] == "words" and d["text"] and any(x in d["text"].lower() for x in ("coda", "d.c", "d.s", "fine", "segno", "da capo", "dal"))):
            s, l = starts[d["m"]]
            print(f"  bar {d['m']+1} off {float(d['t']-s):.2f} of {float(l):.2f}  {d['kind']}  {d.get('text') or d.get('attrs') or ''}")
    for b in w["bars"]:
        if b["part"] == 0 and (b["segno"] or b["coda"]):
            print(f"  bar {b['m']+1} barline {b['loc']}  segno={b['segno']} coda={b['coda']}")
