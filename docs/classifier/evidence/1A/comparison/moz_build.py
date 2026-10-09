"""Mozart piano sonatas: melody labels from Simonetta et al. (ISMIR 2019; 38 movements, annotated by a professional pianist) put onto
the When in Rome scores (CC BY-SA 4.0, real two-staff MusicXML) of the same movements.

The annotated data is a list of notes (pitch, onset, duration, soprano=1 for melody) with repeats played out and an initial rest
removed; it has no staves or bars. The When in Rome score of the same movement has the staves and bars. Rule (fixed before any method was scored):
  - for each score measure, find the pickled-note time t at which the measure's notes (pitch, onset relative to the measure) are found in the
    pickled notes (rule: highest fraction of the measure's notes found; ties -> the t nearest the end of the previous matched measure);
  - a measure is *aligned* when at least 90% of its score notes are found; its score notes take label melody if the matching pickled note has soprano=1;
  - only aligned measures are evaluated; the detectors still see the whole score.
Movements: the Simonetta list (kv279..284, 330..333, 457, 533 in 3 movements each; kv330 mov 2 is marked broken in the dataset, kv475 is not a sonata in When in Rome).
Writes build/mozart/<name>.truth.json and <name>.mid (all score notes, one track, 480 ticks per quarter, constant 120 bpm, velocity 64).
"""
import sys, bz2, pickle, collections
from mel_common import *
import numpy as np
import mido
import score as S

DATA = BUILD / "simonetta/data/solo-accompaniment-dataset/mozart"
WIR = BUILD / "when-in-rome/repo/Corpus/Piano_Sonatas/Mozart,_Wolfgang_Amadeus"
OUT = BUILD / "mozart"
OUT.mkdir(parents=True, exist_ok=True)
MOVS = [(k, m) for k in (279, 280, 281, 282, 283, 284, 330, 331, 332, 333, 457, 533) for m in (1, 2, 3) if (k, m) != (330, 2)]


def pickled(k, m):
    a = pickle.load(bz2.BZ2File(DATA / f"kv{k}_{m}.pyc.bz"), encoding="latin1")
    return a


def build(k, m):
    a = pickled(k, m)
    path = WIR / f"K{k}" / str(m) / "score.mxl"
    sc = S.load({"id": f"K{k}-{m}", "file": str(path), "hands": "both"}, Path("/"))
    n = sc.notes
    on = np.round(n["onset_quarter"], 4)
    pit = n["pitch"].astype(int)
    meas = sc.measure
    staff = np.where(sc.hand == "R", 1, 2)
    # pickled index: onset (rounded to 1/96) -> {pitch: soprano}
    pk = collections.defaultdict(dict)
    for p, o, d, s in zip(a["pitch"], a["onset"], a["duration"], a["soprano"]):
        pk[int(round(float(o) * 96))][int(p)] = int(s)
    by_pitch_on = collections.defaultdict(list)    # pitch -> sorted onsets (in 1/96)
    for o, ps in pk.items():
        for p in ps:
            by_pitch_on[p].append(o)
    nb = len(sc.measure_starts)
    starts = list(sc.measure_starts) + [float(on.max() + n["duration_quarter"].max())]

    def try_scale(sc_f, bars):
        hits = tot = 0
        for b in bars:
            idx = np.where(meas == b)[0]
            if len(idx) == 0:
                continue
            rel = [(int(round((on[i] - starts[b]) * sc_f * 96)), int(pit[i])) for i in idx]
            r0, p0 = min(rel)
            best = 0
            for o in by_pitch_on.get(p0, []):
                t = o - r0
                best = max(best, sum(1 for r, p in rel if p in pk.get(t + r, {})))
            hits += best; tot += len(rel)
        return hits / tot if tot else 0
    probe = list(range(0, min(nb, 40)))
    scale = max((1.0, 2.0, 0.5), key=lambda f: try_scale(f, probe))
    label = np.full(len(n), -1, dtype=int)
    aligned = []
    prev_end = 0
    for b in range(nb):
        idx = np.where(meas == b)[0]
        if len(idx) == 0:
            continue
        rel = [(int(round((on[i] - starts[b]) * scale * 96)), int(pit[i])) for i in idx]
        r0, p0 = min(rel)
        cand = [o - r0 for o in by_pitch_on.get(p0, [])]
        best, bt = (0.0, None), None
        for t in cand:
            hit = sum(1 for r, p in rel if p in pk.get(t + r, {}))
            f = hit / len(rel)
            key = (f, -abs(t - prev_end))
            if key > best if bt is not None else True:
                best, bt = key, t
        if bt is None or best[0] < 0.9:
            continue
        aligned.append(b)
        prev_end = bt + int(round((starts[b + 1] - starts[b]) * scale * 96))
        for i, (r, p) in zip(idx, rel):
            s = pk.get(bt + r, {}).get(p)
            if s is not None:
                label[i] = s
    notes = [{"on": float(on[i]) * scale, "dur": float(n["duration_quarter"][i]) * scale, "pitch": int(pit[i]), "staff": int(staff[i]), "bar": int(meas[i]),
              "label": int(label[i])} for i in range(len(n))]
    ts = (int(n["ts_beats"][0]), int(n["ts_beat_type"][0]))
    jdump({"name": f"K{k}-{m}", "bars": nb, "aligned_bars": aligned, "ts": ts, "quarter_scale": scale, "pickled_notes": int(len(a)), "score_notes": len(n), "notes": notes},
          OUT / f"K{k}-{m}.truth.json")
    mf = mido.MidiFile(type=0, ticks_per_beat=480)
    tr = mido.MidiTrack(); mf.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
    tr.append(mido.MetaMessage("time_signature", numerator=ts[0], denominator=ts[1], time=0))
    ev = []
    t0 = min(x["on"] for x in notes)
    for x in notes:
        ev.append((int(round((x["on"] - t0) * 480)), 1, x["pitch"])); ev.append((int(round((x["on"] - t0 + max(x["dur"], 1 / 16)) * 480)), 0, x["pitch"]))
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for t, o, p in ev:
        tr.append(mido.Message("note_on", note=p, velocity=64 if o else 0, time=t - last)); last = t
    mf.save(str(OUT / f"K{k}-{m}.mid"))
    lab = collections.Counter(x["label"] for x in notes)
    return nb, len(aligned), ts, dict(lab), scale


if __name__ == "__main__":
    tot_b = tot_a = 0
    for k, m in MOVS:
        try:
            nb, na, ts, lab, scale = build(k, m)
        except Exception as e:
            print(f"K{k}-{m} FAILED {type(e).__name__}: {e}")
            continue
        tot_b += nb; tot_a += na
        print(f"K{k}-{m} bars {nb} aligned {na} ts {ts} scale {scale} labels {lab}", flush=True)
    print("total bars", tot_b, "aligned", tot_a)
