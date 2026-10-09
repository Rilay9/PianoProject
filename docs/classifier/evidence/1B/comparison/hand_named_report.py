"""Named items of area-1B validation rows 3 and 4: the five-finger families, the 10 position_shift drills, block-chord steps,
Hanon. Reads hand_pos_named.json. Writes frag_named.md and hand_named_metrics.json."""
import json, collections
from hand_xml import HERE
import hand_def as D
import hand_fix as FX
import frames as FR

N = json.load(open(HERE / "hand_pos_named.json"))
man = json.load(open(HERE / "hand_manifest.json"))
meta = {x["id"]: x for x in man["named"]}
out, M = [], {}


def row(*c):
    return "| " + " | ".join(str(x) for x in c) + " |"


def fam_items(f):
    return [k for k in N if meta[k]["family"] == f]


def kind_counts(bounds):
    return collections.Counter(k for _, k in bounds)


# ---------------- N1: families the page reads as one five-finger frame per hand
out.append("**Families the page reads as one five-finger position per hand (truth by reading: the recipe declares the position; `five_finger` 48, `interval_reading` 16, `riff` 4 items).** An item counts when every hand present has exactly one frame / segment and its class is five-finger.")
out.append("")
out.append(row("family", "items", "current detector", "current with fixes", "pianoplayer fingering (hand_def.py)", "pianoplayer: items with a hand-segment of class extended"))
out.append(row(*["---"] * 6))
for f in ("five_finger", "interval_reading", "riff"):
    ks = fam_items(f)
    res = collections.Counter()
    ext = 0
    for k in ks:
        for m in ("current", "fixed", "pp"):
            ok, have = True, True
            for h, hr in N[k]["hands"].items():
                if h == "R" or h == "L":
                    mv = hr.get(m)
                    if mv is None:
                        have = False
                        break
                    fr = mv["frames"] if m != "pp" else mv["segs"]
                    if len(fr) != 1 or fr[0]["cls"] != "five-finger":
                        ok = False
                    if m == "pp" and any(s["cls"] == "extended" for s in fr):
                        ext += 1
            # a hand with no notes is not in hands
            if have and ok:
                res[m] += 1
            if have and all(len((hr.get(m)["frames"] if m != "pp" else hr.get(m)["segs"])) == 1 for h, hr in N[k]["hands"].items()):
                res[m + "_onepos"] += 1
            if not have:
                res[m + "_nores"] += 1
    out.append(row(f, len(ks), f"{res['current']} of {len(ks)}", f"{res['fixed']} of {len(ks)}", f"{res['pp']} of {len(ks)} ({res['pp_onepos']} with one segment per hand of any class; {res['pp_nores']} no output)", ext))
    M[f"fam|{f}"] = dict(res, items=len(ks), pp_extended=ext)
out.append("")

# ---------------- N2: position_shift drills
out.append("**The 10 `position_shift` drills.** Truth by reading (the page's own positive; `gap-plan.md` lists the drill as a move of the hand with no thumb-under): exactly one change of position, a `shift`, at the leap. The leap is located by script as the event after the largest melodic step of the hand (reading checked on the first drill: C D E F / G F E D / G A B C / D C B G, leap D4 to G4).")
out.append("")
out.append(row("drill", "leap at event", "current: changes (event, kind)", "current with fixes F1+F2", "pianoplayer: segment starts (event, kind)"))
out.append(row(*["---"] * 5))
tot = collections.Counter()
for k in sorted(fam_items("position_shift")):
    for h, hr in N[k]["hands"].items():
        lows = hr["lows"]
        steps = [abs(b - a) for a, b in zip(lows, lows[1:])]
        leap = steps.index(max(steps)) + 1
        cur = hr["current"]["bounds"]
        fix = hr["fixed"]["bounds"]
        pp = hr.get("pp", {}).get("bounds")
        ppf = ""
        if "pp" in hr:
            ppf = " ".join(str(hr["pp"].get("fingers", ""))) if False else ""
        out.append(row(k.replace("exercise.position-shift.", ""), leap, cur, fix, pp if pp is not None else "no output"))
        tot["drills"] += 1
        tot["cur_one"] += (len(cur) == 1)
        tot["cur_shift"] += sum(1 for _, kd in cur if kd == "shift")
        tot["cur_near"] += any(abs(b - leap) <= 1 for b, _ in cur)
        tot["fix_one"] += (len(fix) == 1)
        tot["fix_shift"] += sum(1 for _, kd in fix if kd == "shift")
        tot["fix_near"] += any(abs(b - leap) <= 1 for b, _ in fix)
        if pp is not None:
            tot["pp_have"] += 1
            tot["pp_one"] += (len(pp) == 1)
            tot["pp_near"] += any(abs(b - leap) <= 1 for b, _ in pp)
            tot["pp_shift_near"] += any(abs(b - leap) <= 1 and kd == "shift" for b, kd in pp)
        for vv in ("f1", "f2"):
            tot[vv + "_shift_near"] += any(abs(b - leap) <= 1 and kd == "shift" for b, kd in hr[vv]["bounds"])
        tot["cur_shift_near"] +=any(abs(b - leap) <= 1 and kd == "shift" for b, kd in cur)
        tot["fix_shift_near"] += any(abs(b - leap) <= 1 and kd == "shift" for b, kd in fix)
out.append("")
out.append(f"Totals over {tot['drills']} drills: current detector exactly one change {tot['cur_one']}, within +-1 event of the leap {tot['cur_near']}, kind `shift` anywhere {tot['cur_shift']}, `shift` at the leap {tot['cur_shift_near']}. With fixes: exactly one change {tot['fix_one']}, near the leap {tot['fix_near']}, `shift` at the leap {tot['fix_shift_near']} (F1 alone {tot['f1_shift_near']}, F2 alone {tot['f2_shift_near']}). pianoplayer (output for {tot['pp_have']} drills): exactly one segment change {tot['pp_one']}, near the leap {tot['pp_near']}, `shift` at the leap {tot['pp_shift_near']}.")
out.append("")
M["drills"] = dict(tot)

# ---------------- N3: block-chord steps
out.append("**Block-chord steps.** Truth by reading: a change of frame between two chord events (3 or more notes each) is the hand moving, a `shift`; a thumb cannot pass under a block chord. Items: the 12 `exercise.cadence.*.root` items (root-position I-IV-V-I) and built parallel triads (C-E-G, D-F-A, E-G-B, F-A-C in one hand, one chord per quarter; built with `frames.built`, current detector and fixes only, there is no score to finger).")
out.append("")
cc = collections.Counter()
for k in sorted(N):
    if meta[k]["family"] == "cadence" and k.endswith(".root") or ".root." in k and meta[k]["family"] == "cadence":
        for h, hr in N[k]["hands"].items():
            sz = hr["sizes"]
            for m in ("current", "fixed", "pp", "f1", "f2"):
                mv = hr.get(m)
                if not mv:
                    continue
                for b, kd in mv["bounds"]:
                    if sz[b] >= 3 and sz[b - 1] >= 3:
                        cc[(m, kd)] += 1
                    else:
                        cc[(m, "other:" + kd)] += 1
rootids = [k for k in N if meta[k]["family"] == "cadence" and ".root" in k]
out.append(f"Root-position cadence items found: {len(rootids)}.")
out.append("")
out.append(row("method", "chord-to-chord changes typed shift", "typed crossing", "other changes (a single note on one side) shift / crossing"))
out.append(row(*["---"] * 4))
for m, nm in (("current", "current detector"), ("fixed", "current with fixes F1+F2"), ("f1", "current with F1 only"), ("f2", "current with F2 only"), ("pp", "pianoplayer fingering (hand_def.py)")):
    out.append(row(nm, cc[(m, "shift")], cc[(m, "crossing")], f"{cc[(m, 'other:shift')]} / {cc[(m, 'other:crossing')]}"))
M["blockchord_cadence_root"] = {f"{a}|{b}": n for (a, b), n in cc.items()}
out.append("")
# built parallel triads
from frames import built
trs = ["C3 E3 G3", "D3 F3 A3", "E3 G3 B3", "F3 A3 C4", "G3 B3 D4", "A3 C4 E4"]
evs = built(trs)
bc = collections.Counter()
for label, f_, c_ in (("current", FR.frames, FR.changes), ("fixed", FX.frames_f3, FX.changes_fixed),
                      ("F1 only", FR.frames, lambda e, f: FX.changes_fixed(e, f, True, False)),
                      ("F2 only", FR.frames, lambda e, f: FX.changes_fixed(e, f, False, True))):
    fr = f_(evs)
    ch = c_(evs, fr)
    out.append(f"Built parallel triads {trs}: {label}: {len(fr)} frames, changes " + str([(c["index"] if "index" in c else None, c["kind"]) for c in ch]) + ".")
    bc[label] = [c["kind"] for c in ch]
out.append("")
M["built_triads"] = {k: v for k, v in bc.items()}

# ---------------- Hanon
out.append("**Hanon (page: extended positions, a sixth in each hand).** Class of the segments per method over the 60 `hanon` items (no fingering truth; descriptive).")
out.append("")
cl = collections.defaultdict(collections.Counter)
for k in fam_items("hanon"):
    for h, hr in N[k]["hands"].items():
        for m in ("current", "fixed", "pp"):
            mv = hr.get(m)
            if mv:
                for f in (mv["frames"] if m != "pp" else mv["segs"]):
                    cl[m][f["cls"]] += 1
out.append(row("method", "five-finger frames", "extended", "beyond"))
out.append(row(*["---"] * 4))
for m, nm in (("current", "current detector"), ("fixed", "current with fixes"), ("pp", "pianoplayer fingering (hand_def.py)")):
    out.append(row(nm, cl[m]["five-finger"], cl[m]["extended"], cl[m]["beyond"]))
M["hanon"] = {m: dict(c) for m, c in cl.items()}
out.append("")

# ---------------- Chopin Op. 25 No. 6 (row 3 b)
k = "song.classical.chopin-etude-op25-6.nifc"
if k in N:
    hr = N[k]["hands"].get("R")
    if hr:
        out.append("**Chopin Op. 25 No. 6, right hand (row 3 (b): chromatic double thirds, 0-based bar 4, E-flat5+F-sharp5 to G5+B-flat5).**")
        out.append("")
        for m in ("current", "fixed"):
            fr = hr[m]["frames"]
            hit = [f for f in fr if any(hr["bars"][i] == 4 for i in range(f["first"], f["last"] + 1))]
            out.append(f"- {m}: {len(fr)} frames in the hand; frames holding events of bar 4: " + str([(f["first"], f["last"], f["cls"], round(hr['lows'][f['last']] - hr['lows'][f['first']])) for f in hit]) + " (first event, last event, class, rise of the lowest note)")
        out.append("")
open(HERE / "frag_named.md", "w", encoding="utf-8").write("\n".join(out) + "\n")
json.dump(M, open(HERE / "hand_named_metrics.json", "w"), indent=1)
print("\n".join(out))
