"""Test of the mechanism behind the two unaligned NIFC files: OSMD's absolute times drift by the grace notes that close a bar.

Hypothesis (from f2_nifc.py / f2_nifc2.py): in these files grace notes at the END of a bar (they belong to the first note of the
next bar) take a slot in OSMD's timeline (+0.5 quarter per group here) but have duration 0 in the walk, so every later bar's
absolute times differ and the validators' key (bar, staff, absolute onset, letter, octave) no longer pairs.
Test: re-key both sides by the onset RELATIVE to the first note of the bar and count how many bars then align exactly.
If the hypothesis holds, the emulation and the render should agree on (nearly) every note after re-keying.
Also counts the end-of-bar grace groups per file from the walk.
"""
import sys, json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1a"), str((HERE / "../../1A/validation").resolve())]
import f2_osmd as FO
import osmd_emul
from common import *

res = {}
for i in ("song.classical.chopin-nocturne-op55-2.nifc", "song.classical.chopin-scherzo-2.nifc",
          "song.classical.chopin-mazurka-op7-3.nifc", "song.classical.chopin-fantaisie-impromptu.nifc"):
    w = cache(i)
    rr = FO.render(i)
    # end-of-bar grace groups in the walk: a grace note whose onset equals the bar's end
    ends = collections.Counter()
    for n in w["notes"]:
        if n["grace"]:
            mstart, mlen = w["measures"][n["part"]][n["m"]]
            if n["t"] >= mstart + mlen:
                ends[n["m"]] += 1
    # relative re-keying
    rfirst = {}
    for r in rr:
        rfirst[r["m"]] = min(rfirst.get(r["m"], 1e9), r["t"])
    emu = osmd_emul.osmd_model(w)
    wfirst = {}
    for (m, staff, t, step, octv, shown), c in emu.items():
        wfirst[m] = min(wfirst.get(m, 1e9), t)
    mine = collections.Counter()
    for (m, staff, t, step, octv, shown), c in emu.items():
        mine[(m, staff, round(t - wfirst[m], 3), step, octv, shown)] += c
    osm = collections.Counter()
    for r in rr:
        key = r["note"].split(",")[0].replace("Key: ", "")
        octv = int(r["note"].split("octave: ")[1]) + 3
        osm[(r["m"], r["staff"], round(r["t"] - rfirst[r["m"]], 3), key[0], octv, r["drawn"] not in (None, "NONE"))] += 1
    both = mine & osm
    # bars that are exact after re-keying
    bars_m, bars_o = collections.defaultdict(collections.Counter), collections.defaultdict(collections.Counter)
    for k, c in mine.items(): bars_m[k[0]][k] += c
    for k, c in osm.items(): bars_o[k[0]][k] += c
    exact = sum(1 for m in bars_o if bars_m.get(m, collections.Counter()) == bars_o[m])
    res[i] = {"bars": len(bars_o), "bars_with_end_of_bar_graces": len(ends), "end_graces": sum(ends.values()),
              "agree_after_rekey": sum(both.values()), "emu_only": sum((mine - osm).values()), "render_only": sum((osm - mine).values()),
              "shown_agree": sum(v for k, v in both.items() if k[5]), "bars_exactly_equal": exact,
              "render_only_are_grace_notes": None}
    # of the render-only notes, how many are grace notes in the walk? (letter, octave in the same bar)
    gr = collections.Counter()
    for n in w["notes"]:
        if n["grace"] and not n["rest"] and n["step"]:
            gr[(n["m"], n["staff"], n["step"], n["octave"])] += 1
    ro = collections.Counter()
    for k, c in (osm - mine).items():
        ro[(k[0], k[1], k[3], k[4])] += c
    res[i]["render_only_are_grace_notes"] = sum(min(c, gr.get(k, 0)) for k, c in ro.items())
    print(i, json.dumps(res[i]))
json.dump(res, open(HERE / "out/f2_nifc3.json", "w"), indent=1)
