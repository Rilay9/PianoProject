"""Why do two files of the 30 (chopin-nocturne-op55-2.nifc, chopin-scherzo-2.nifc) not align between the walk and the OSMD render?
Prints, per file: the walk's bar starts, the render's per-bar first onset, and the first bar where they differ, then tests
the mechanism (the render's note times are absolute positions OSMD builds from each measure's length)."""
import sys, json, collections, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1a"), str((HERE / "../../1A/validation").resolve())]
import f2_osmd as FO
from common import *

for i in ("song.classical.chopin-nocturne-op55-2.nifc", "song.classical.chopin-scherzo-2.nifc"):
    w = cache(i)
    rr = FO.render(i)
    ms = w["measures"][0]
    print("=====", i, "| walk bars:", len(ms), "| render max measure index +1:", max(r["m"] for r in rr) + 1)
    # first onset per bar in the render
    first = {}
    for r in rr:
        first[r["m"]] = min(first.get(r["m"], 1e9), r["t"])
    # walk: bar starts and time signatures
    print("walk times:", [(t["m"], t["beats"] + "/" + t["bt"]) for t in w["times"]][:6])
    print("walk bar start/len (first 6):", [(float(a), float(b)) for a, b in ms[:6]])
    print("render first onset per bar (first 6):", [(m, first[m]) for m in sorted(first)[:6]])
    # first bar where walk's bar start differs from the render's first onset when the walk has a note at the bar start
    wfirst = {}
    for n in w["notes"]:
        if not n["rest"] and n["step"] and not n["grace"]:
            wfirst[n["m"]] = min(wfirst.get(n["m"], 1e9), float(n["t"]))
    bad = None
    for m in sorted(first):
        if m in wfirst and abs(wfirst[m] - first[m]) > 1e-6:
            bad = m; break
    print("first bar index where the first onset differs (walk vs render):", bad,
          "| walk", wfirst.get(bad), "render", first.get(bad))
    # offsets inside bars: render onset minus bar's render first onset vs the walk's offset
    d = collections.Counter()
    for m in sorted(first):
        if m in wfirst:
            d[round(wfirst[m] - first[m], 3)] += 1
    print("distribution of (walk first onset - render first onset) over bars:", dict(sorted(d.items())[:12]), "... bars:", sum(d.values()))
    # per-bar shift as a function of bar index (first 12 bars with a difference)
    shifts = [(m, round(wfirst[m] - first[m], 3)) for m in sorted(first) if m in wfirst]
    print("shift by bar (first 14):", shifts[:14])
    # is there an incomplete / implicit measure in the XML?
    x = FO.to_xml(i).read_text(encoding="utf8")
    print("implicit measures:", len(re.findall(r'<measure[^>]*implicit="yes"', x)), "| non-controlling:", len(re.findall(r'<measure[^>]*non-controlling', x)),
          "| <repeat:", len(re.findall(r"<repeat ", x)), "| <ending:", len(re.findall(r"<ending ", x)), "| measure elements (part 1):", len(re.findall(r"<measure ", x)))
