"""texture.melody-location on the items the validation row names (right and wrong), per bar: the current detector, the plain skyline, MidiBERT (if mb_run.py chord has run on them),
beside what the score holds in the bar (notes per staff). Expected hand per bar is stated in EXPECT from reading the notes printed here (reading, not annotation).
Output: mel_named.json."""
import sys, json, collections
from mel_common import *
load_validators()
import common
from walk import cache, BYID
import r_melody as RM
import score as S
import mido

FI = "song.classical.chopin-fantaisie-impromptu-in-c-sharp-minor-op-66.pdmx"
MD = "song.beautiful.mariage-damour"
ITEMS = {
    FI: list(range(0, 8)),
    MD: list(range(0, 5)),
    "song.classical.bach-invention-no-4-in-d-minor-bwv-775.pdmx": [0, 1],
    "song.folk.when-the-saints.alternating": list(range(0, 9)),
    "exercise.boogie.b-flat.walking-eighths": list(range(0, 4)),
    "song.classical.bach-little-prelude-in-d-major-bwv-936.pdmx": [0, 1, 2, 3],
    "song.classical.bach-o-sacred-head-johann-sebastian-bach-on-a-tune-by-hans-leo-hassler.pdmx": [0, 1, 2, 3],
}


def staff_summary(w, m):
    out = {}
    for s in (1, 2):
        ns = [n for n in w["notes"] if n["m"] == m and n["staff"] == s and common.struck(n)]
        on = collections.defaultdict(list)
        for n in ns:
            on[n["t"]].append(common.midi(n))
        t0 = min((n["t"] for n in ns), default=0)
        out[s] = [(round(float(t - t0), 3), sorted(v)) for t, v in sorted(on.items())][:7]
    return out


def export_midi():
    outd = BUILD / "chord"; outd.mkdir(exist_ok=True)
    for i in ITEMS:
        if i not in BYID:
            continue
        sc = S.load(BYID[i], content=RM.HERE)
        n = sc.notes
        notes = [{"on": float(n["onset_quarter"][k]), "dur": float(n["duration_quarter"][k]), "pitch": int(n["pitch"][k]), "bar": int(sc.measure[k]), "staff": 1 if sc.hand[k] == "R" else 2} for k in range(len(n))]
        t0 = min(x["on"] for x in notes)
        mf = mido.MidiFile(type=0, ticks_per_beat=480); tr = mido.MidiTrack(); mf.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0)); tr.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
        ev = []
        for x in notes:
            ev.append((int(round((x["on"] - t0) * 480)), 1, x["pitch"])); ev.append((int(round((x["on"] - t0 + max(x["dur"], 1 / 16)) * 480)), 0, x["pitch"]))
        ev.sort(key=lambda e: (e[0], e[1])); last = 0
        for t, o, p in ev:
            tr.append(mido.Message("note_on", note=p, velocity=64 if o else 0, time=t - last)); last = t
        mf.save(str(outd / f"{i}.mid"))
        jdump({"t0": t0, "notes": notes}, outd / f"{i}.notes.json")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "export":
        export_midi(); print("exported"); sys.exit()
    mbp = HERE / "chord_mb_results.json"
    mb = jload(mbp) if mbp.exists() else {}
    res = {}
    for i, bars in ITEMS.items():
        if i not in BYID:
            res[i] = "NOT IN CATALOGUE"; print(i, "NOT IN CATALOGUE"); continue
        w = cache(i)
        cur = RM.melody(i)
        sc = S.load(BYID[i], content=RM.HERE)
        n = sc.notes
        # plain skyline per bar
        top = {}
        for k in range(len(n)):
            key = (int(sc.measure[k]), round(float(n["onset_quarter"][k]), 4))
            if key not in top or n["pitch"][k] > n["pitch"][top[key]]:
                top[key] = k
        sky = collections.defaultdict(collections.Counter)
        for (m, _), k in top.items():
            sky[m]["R" if sc.hand[k] == "R" else "L"] += 1
        mbpred = None
        if i in mb:
            nj = jload(BUILD / "chord" / f"{i}.notes.json")["notes"]
            mbpred = collections.defaultdict(collections.Counter)
            for k in set(mb[i]["midibert"]["idx"]) | set(mb[i]["midibert"].get("idx_bridge", [])):
                mbpred[nj[k]["bar"]]["R" if nj[k]["staff"] == 1 else "L"] += 1
        rows = []
        for m in bars:
            c = cur.get(m) if isinstance(cur, dict) and "unknown" not in cur else None
            sk = sky.get(m)
            rows.append({"bar0": m, "current": (f"{c[0]} {c[1]}" if c else "UNKNOWN"),
                         "skyline": (("R" if sk["R"] >= sk["L"] else "L") if sk else None),
                         "midibert": (dict(mbpred[m]) if mbpred is not None and mbpred.get(m) else ({} if mbpred is not None else "not run")),
                         "score": staff_summary(w, m)})
        res[i] = rows
        print("==", i)
        for r in rows:
            print("  bar0", r["bar0"], "| current:", r["current"], "| skyline:", r["skyline"], "| midibert:", r["midibert"], "| staff1:", r["score"][1][:5], "| staff2:", r["score"][2][:5])
    jdump(res, HERE / "mel_named.json")
    # score against the expected hand per bar (reading of the notes printed above; 'none' = no melody in the bar; undecided items are left out)
    EXPECT = {
        FI: {0: "none", 1: "none", 2: "none", 3: "none", 4: "R", 5: "R", 6: "R", 7: "R"},
        MD: {0: "none", 1: "none", 2: "R", 3: "R", 4: "R"},
        "song.classical.bach-invention-no-4-in-d-minor-bwv-775.pdmx": {0: "R", 1: "R"},
        "song.folk.when-the-saints.alternating": {0: "R", 1: "R", 2: "R", 3: "R", 4: "L", 5: "L", 6: "L", 7: "L", 8: "L"},
    }
    sc_tab = {}
    for i, ex in EXPECT.items():
        rows = {r["bar0"]: r for r in res[i]}
        t = {"bars": len(ex), "current": 0, "skyline": 0, "midibert": 0}
        for b, e in ex.items():
            r = rows[b]
            cur = r["current"].split()[-1] if r["current"].startswith("rule") else None
            sk = r["skyline"]
            mbv = r["midibert"]
            mbh = None if (not isinstance(mbv, dict) or not mbv) else max(mbv, key=mbv.get)
            for name, a in (("current", cur), ("skyline", sk), ("midibert", mbh)):
                t[name] += (a is None) if e == "none" else (a == e)
        sc_tab[i] = t
    jdump(sc_tab, HERE / "mel_named_scores.json")
    print(sc_tab)
