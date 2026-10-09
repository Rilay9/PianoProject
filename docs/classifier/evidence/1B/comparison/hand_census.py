"""Census: which catalogue items carry printed fingering on enough notes to serve as a fingered-passage truth.
Rule fixed before any method ran: an item hand is TRUTH-ELIGIBLE if >= 24 of its struck notes on that hand carry a single
digit 1..5 and those are >= 80% of that hand's struck notes (every note fingered or nearly). Writes hand_census.json."""
import json, sys, time
from hand_xml import *

cat = json.load(open(CONTENT / "catalog.json", encoding="utf-8"))
out = {}
t0 = time.time()
for it in cat:
    if not it.get("file"):
        continue
    try:
        notes, np_, st = read_notes(CONTENT / it["file"])
    except Exception as e:
        out[it["id"]] = {"error": f"{type(e).__name__}: {e}"}
        continue
    assign_hand(notes, np_, st, it.get("hands"))
    row = {"src": it.get("provenance", {}).get("source"), "family": (it.get("provenance", {}).get("generator") or {}).get("family")}
    for h in "RL":
        evs = events(notes, h)
        struck = [n for e in evs for n in e]
        fd = [n for n in struck if digit(n) is not None]
        anyf = [n for n in struck if n["fing"]]
        row[h] = {"struck": len(struck), "digit": len(fd), "anyfing": len(anyf),
                  "eligible": len(fd) >= 24 and len(fd) >= 0.8 * len(struck)}
    out[it["id"]] = row
json.dump(out, open(HERE / "hand_census.json", "w"), indent=1)
elig = {k: v for k, v in out.items() if "error" not in v and (v["R"]["eligible"] or v["L"]["eligible"])}
anyf = {k: v for k, v in out.items() if "error" not in v and (v["R"]["anyfing"] or v["L"]["anyfing"])}
errs = [k for k, v in out.items() if "error" in v]
import collections
print("items with a file", len(out), "errors", len(errs), "seconds", round(time.time() - t0))
print("items with any fingering", len(anyf), collections.Counter(v["src"] for v in anyf.values()))
print("truth-eligible items", len(elig), collections.Counter(v["src"] for v in elig.values()))
for k, v in sorted(elig.items()):
    print(k, v["src"], "R", v["R"]["digit"], "/", v["R"]["struck"], "L", v["L"]["digit"], "/", v["L"]["struck"])
