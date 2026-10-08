"""summ.py [--bars a-b] ID ... : the corrected syncopation and ties per item, compact; events limited to the bar range
(0-based) when given, else the first 12 events of each kind."""
import sys, json
from collections import defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import warnings
warnings.simplefilter("ignore")
from sync import analyse

args = sys.argv[1:]
rng = None
if args[0] == "--bars":
    a, z = args[1].split("-"); rng = (int(a), int(z)); args = args[2:]
for iid in args:
    try:
        r = analyse(iid, detail=True)
    except Exception as ex:
        print(iid, "ERROR", repr(ex)[:200]); continue
    print(f"== {iid}  readable={r['readable']} skipped={r['skipped_onsets']} present_page={r['present_page']} proper={r['present_proper']} dyn={r['dyn_texts']}")
    print("   kinds:", json.dumps(r["kinds"]))
    print("   ties :", json.dumps(r["ties"]))
    per = defaultdict(list)
    for ev in r["events"]:
        if rng and not (rng[0] <= ev[2] <= rng[1]):
            continue
        per[ev[1]].append(ev)
    for k, evs in per.items():
        print(f"   {k}: " + "; ".join(f"{e[0]} idx{e[2]}(no.{e[3]}) @{e[4]} p{e[5]} {e[6]}" for e in evs[: (100 if rng else 12)]))
    tv = [t for t in r["tie_ev"] if (not rng or (rng[0] <= t[1] <= rng[1]))]
    if tv:
        print("   tie ev:", "; ".join(f"{t[0]} idx{t[1]}(no.{t[2]}) @{t[3]} p{t[4]} {t[6]}" for t in tv[: (100 if rng else 12)]))
