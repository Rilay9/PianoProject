from common import *
import collections
D = json.load(open(OUT / "kc_v.json"))
ok = {k: r for k, r in D.items() if isinstance(r.get("areas"), list)}
print("real items run:", len(D), "with areas searched (home key known, >= 8 bars):", len(ok), "errors:", [k for k, r in D.items() if "error" in r])
fv = [(k, a) for k, r in ok.items() for a in r["areas"] if a["first_version"]]
cv = [(k, a) for k, r in ok.items() for a in r["areas"] if a["corrected"]]
print("confirmed areas: first version", len(fv), "in", len({k for k, _ in fv}), "items; corrected", len(cv), "in", len({k for k, _ in cv}), "items")
rem = [(k, a["bars"], a["key"], a["relation"], [e[2] for e in a["excluded"]]) for k, a in fv if not a["corrected"]]
print("areas the exclusion removed:", len(rem))
for x in rem:
    print("   ", x)
print("\n== Bach Inventions")
for k, r in sorted(ok.items()):
    if "invention" in k:
        print(k.split(".")[2], r["home"], [(a["bars"], a["key"], a["relation"], a["first_version"], a["corrected"]) for a in r["areas"] if a["relation"] in ("dominant", "relative") or a["first_version"]])
print("\n== named examples")
for k in ["song.folk.happy-birthday-piano.pdmx", "song.folk.bella-ciao", "song.folk.hallelujah-easy.pdmx", "song.pop.clementi-opus-36-no-1-first-movement.pdmx",
          "song.classical.beethoven-ode-to-joy.easy", "song.classical.beethoven-fur-elise", "song.classical.bach-invention-no-14-in-b-flat-major-bwv-785.pdmx"]:
    r = D.get(k)
    print(k, r and r.get("home"), r and [(a["bars"], a["key"], a["relation"], a["first_version"], a["corrected"], a["excluded"][:1]) for a in r["areas"]] if r and isinstance(r.get("areas"), list) else r and r.get("areas"))
print("\n== agent trigger")
short = [(k, r["bars"]) for k, r in ok.items() if r["bars"] <= 32 and any(a["corrected"] for a in r["areas"])]
nocad = sum(1 for k, r in ok.items() for a in r["areas"] if not a["corrected"])
domnocad = [(k, a["bars"]) for k, r in ok.items() for a in r["areas"] if a["relation"] == "dominant" and not a["corrected"]]
items_sent = {k for k, r in ok.items() for a in r["areas"] if not a["corrected"]} | {k for k, _ in short}
print("items <= 32 bars with a confirmed area (corrected):", len(short), short[:30])
print("areas without a cadence (corrected):", nocad, "| on the home dominant without a cadence:", len(domnocad))
print("items sent to the agent by (i)-(iii):", len(items_sent), "of", len(ok))
print("folk items with a confirmed area: first", len({k for k, a in fv if '.folk.' in k}), "corrected", len({k for k, a in cv if '.folk.' in k}))
print("   first:", sorted({k for k, a in fv if '.folk.' in k}))
