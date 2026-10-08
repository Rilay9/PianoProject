from common import *
import collections
D = json.load(open(OUT / "coll_v.json"))
err = [k for k, r in D.items() if "error" in r]
print("items:", len(D), "errors:", err)
real = {k: r for k, r in D.items() if r["p"] != "generated" and "item" in r}
gen = {k: r for k, r in D.items() if r["p"] == "generated" and "item" in r}
print("\n== item level, real", len(real))
print(collections.Counter(r["item"][1] for r in real.values()))
named = collections.Counter(r["item"][0].split(" on ")[0] for r in real.values() if r["item"][1] == "named")
print("named:", dict(named))
print("8-9 pitch-class sets (set only):", sum(1 for r in real.values() if r["n_item"] in (8, 9)))
for nm in ["excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b1-8", "song.pop.misc-christmas-we-wish-you-a-merry-christmas.pdmx", "song.classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx",
           "song.classical.grieg-morgenstimmung.pdmx", "song.pop.clementi-opus-36-no-1-third-movement.pdmx"]:
    if nm in real:
        print("  ", nm, real[nm]["item"])
cands = [k for k in real if "anh-113" in k or "merry-christmas" in k or "119-no-3" in k or "morgen" in k or "36-no-1" in k or "599" in k]
print("  matching ids:", [(k, real[k]["item"][0]) for k in cands][:12])
# mode names on real items whose helper key is major/minor: a non-ionian/aeolian mode
modal = [(k, r["item"][0], r["home"]) for k, r in real.items() if r["item"][1] == "named" and any(m in r["item"][0] for m in ("dorian", "phrygian", "lydian", "mixolydian", "locrian", "Phrygian dominant", "Lydian dominant", "altered"))]
print("real items named a mode or chord scale at item level:", len(modal), modal[:20])
print("\n== item level, generated declared families")
by = collections.defaultdict(collections.Counter)
for k, r in gen.items():
    f = r["fam"]
    sub = k.split(".")[2] if f == "scale" else ""
    kind = "harmonic" if "harmonic" in sub else "melodic" if "melodic" in sub else "natural" if "natural" in sub else "major" if f == "scale" else ""
    by[f"{f} {kind}".strip()][r["item"][0].split(" on ")[0]] += 1
for f, c in sorted(by.items()):
    print(" ", f, dict(c))
print("\n== passage level")
for grp, R in (("real", real), ("generated", gen)):
    runs = [x for r in R.values() for x in r.get("runs", [])]
    print(grp, "single-note runs >= 6:", len(runs), "by pitch-class count:", dict(sorted(collections.Counter(x["npc"] for x in runs).items())))
    print("   answer kind:", dict(collections.Counter(x["how"] for x in runs)))
    six = [x for x in runs if x["npc"] == 6]
    print("   six-pc runs by answer kind:", dict(collections.Counter(x["how"] for x in six)))
    print("   direction test fired on runs:", sum(1 for x in runs if x.get("direction_test")))
    mi = [x for x in runs if x["lk"][1] == "minor"]
    print("   runs in a minor local key:", len(mi), "section 6 run-level answers:", dict(collections.Counter((x["form"].split(" (")[0] if x["form"] else None) for x in mi)))
    # deviation: 'part of harmonic minor' for a run with only the raised seventh (one variable degree)
    ph = [x for x in mi if x["name"].startswith("part of") and "harmonic" in x["name"]]
    one = [x for x in ph if x["form"] and x["form"].startswith("undetermined")]
    print("   'part of ... harmonic minor scale':", len(ph), "of which section 6 calls undetermined (one variable degree):", len(one))
    pm = [x for x in mi if x["name"].startswith("part of") and "melodic" in x["name"]]
    print("   'part of ... melodic minor scale':", len(pm), "undetermined in section 6:", sum(1 for x in pm if x["form"] and x["form"].startswith("undetermined")))
gm = {k: r for k, r in gen.items() if "melodic-minor" in k}
print("\n== generated melodic minor scales: items where the direction test fired:", sum(1 for r in gm.values() if any(x.get("direction_test") for x in r["runs"])), "of", len(gm))
print("   items whose runs include 'melodic minor, ascending form':", sum(1 for r in gm.values() if any(x["form"] == "melodic minor, ascending form" for x in r["runs"])))
for f in ["harmonic-minor", "natural-minor"]:
    G = {k: r for k, r in gen.items() if f in k}
    print(f, len(G), "run forms:", dict(collections.Counter(x["form"] for r in G.values() for x in r["runs"])))
print("\n== El Condor Pasa runs:", [(x["bar"], x["name"], x["form"]) for x in D.get("song.folk.el-condor-pasa-if-i-could.pdmx", {}).get("runs", [])])
