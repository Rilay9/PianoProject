"""notation.times: the 49 catalogue items with a signature change, read four ways.
  current       times.py as the validators wrote it (classify + device_runs), unchanged                                  [tm_current.json from tm_changes.py]
  current+fix   the same file with ONE substitution: the label "cadenza bar (one longer bar)" becomes "change"
                 (the evidence in the validation row: that clause turns measured one-bar changes into cadenza bars; the fix drops the clause)
  music21       plain read: part 0's Measure list, the TimeSignature in each measure (ratioString), carried forward; a change = a bar whose signature differs from the one before
  partitura     plain read: part 0's TimeSignature objects (beats, beat_type) at their Measure's start, carried forward; same change rule
Per item: the signature change indices each reader gives, and for the two detector variants the label of every change. Writes tm_results.json."""
import sys, json, types, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tcommon import *
common, T = load_times()

# patched copy of times.py: one substitution
src = (VAL1C / "times.py").read_text(encoding="utf-8")
a = 'lab = "cadenza bar (one longer bar)"'
assert src.count(a) == 1
src = src.replace(a, 'lab = "change"')
TF = types.ModuleType("times_fix")
TF.__file__ = str(VAL1C / "times.py")
exec(compile(src, str(VAL1C / "times.py"), "exec"), TF.__dict__)

cur = json.load(open(OUT / "tm_current.json", encoding="utf8"))
ids = list(cur)


def classify_item(mod, iid):
    ms = mod.measures(iid)
    ch, cad = mod.classify(ms)
    lab = mod.device_runs(ms, cad)
    return ms, ch, {int(k): v for k, v in lab.items()}


def kind_of(label):
    if label is None:
        return "change"          # unlabelled change: counted
    if label.startswith("cadenza"):
        return "cadenza"
    if label.startswith("device"):
        return "device"
    return "change"


def m21_read(path):
    from music21 import converter, stream, meter
    s = converter.parse(str(path))
    part = s.parts[0] if s.parts else s
    sigs = []
    cur_sig = None
    for m in part.getElementsByClass(stream.Measure):
        ts = m.getElementsByClass(meter.TimeSignature)
        if len(ts):
            cur_sig = ts[0].ratioString
        sigs.append(cur_sig)
    ch = [i for i in range(1, len(sigs)) if sigs[i] != sigs[i - 1]]
    return sigs, ch


def pt_read(path):
    import partitura as pt
    from partitura import score as ps
    sc = pt.load_musicxml(str(path))
    part = sc.parts[0]
    meas = sorted(part.iter_all(ps.Measure), key=lambda m: m.start.t)
    starts = [m.start.t for m in meas]
    tss = sorted(part.iter_all(ps.TimeSignature), key=lambda t: t.start.t)
    sigs = []
    cur_sig = None
    k = 0
    for i, m in enumerate(meas):
        while k < len(tss) and tss[k].start.t <= starts[i]:
            cur_sig = f"{tss[k].beats}/{tss[k].beat_type}"
            k += 1
        sigs.append(cur_sig)
    ch = [i for i in range(1, len(sigs)) if sigs[i] != sigs[i - 1]]
    return sigs, ch


res = {}
for iid in ids:
    path = CONTENT / common.BYID[iid]["file"]
    ms, ch, lab = classify_item(T, iid)
    msf, chf, labf = classify_item(TF, iid)
    r = {"bars": len(ms), "raw_changes": ch, "sigs": [f"{m['sig'][0]}/{m['sig'][1]}" if m["sig"] else None for m in ms],
         "current": {str(i): lab.get(i) for i in ch}, "fix": {str(i): labf.get(i) for i in chf}}
    try:
        s21, c21 = m21_read(path)
        r["m21_bars"] = len(s21); r["m21_changes"] = c21
        r["m21_sigs_equal_raw"] = (s21 == r["sigs"])
    except Exception as e:
        r["m21_error"] = repr(e)[:120]
    try:
        spt, cpt = pt_read(path)
        r["pt_bars"] = len(spt); r["pt_changes"] = cpt
        r["pt_sigs_equal_raw"] = (spt == r["sigs"])
    except Exception as e:
        r["pt_error"] = repr(e)[:120]
    res[iid] = r
json.dump(res, open(OUT / "tm_results.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
print("items:", len(res))
bad21 = [i for i, r in res.items() if "m21_error" in r or r.get("m21_changes") != r["raw_changes"]]
badpt = [i for i, r in res.items() if "pt_error" in r or r.get("pt_changes") != r["raw_changes"]]
print("music21 plain read differs from the raw change list in", len(bad21), "items:", bad21[:10])
print("partitura plain read differs from the raw change list in", len(badpt), "items:", badpt[:10])
