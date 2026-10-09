"""POP909 ground truth for texture.melody-location: build a two-staff piano score per song, with the dataset's own melody labels.

Selection rule (fixed before any method was scored): MidiBERT's POP909 test split (86 songs, build/midibert/repo/data_creation/
preprocess_pop909/split.pkl) intersected with its list of songs qualified as 4/4 (qual_pieces.pkl): the songs MidiBERT never trained on.

Construction (the data is a performance MIDI with beat annotations, not a score):
  - times of MELODY, BRIDGE and PIANO notes -> beats by linear interpolation on beat_midi.txt (extrapolated at the ends);
  - onsets and offsets rounded to the 16th (a quarter = 4 units); a note shorter than one unit gets one unit;
  - bars start at the annotated downbeats (column 3 of beat_midi.txt; a short first bar becomes a bar with leading rest);
  - staff: MIDI pitch >= 60 -> staff 1 (right hand), below -> staff 2 (left hand), all three tracks merged;
  - label: MELODY track = melody (M), BRIDGE = B, PIANO = P. The same pitch at the same onset in two tracks becomes one note; label M beats B beats P.
Writes build/pop909/scores/<id>.musicxml, <id>.mid (single track, for MidiBERT) and <id>.truth.json (notes with staff and label).
"""
import sys, pickle, json, math, collections
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from mel_common import *
import numpy as np
import mido
from xmlwrite import score_xml

REPO = BUILD / "pop909/repo/POP909"
MB = BUILD / "midibert/repo/data_creation/preprocess_pop909"
OUT = BUILD / "pop909/scores"
OUT.mkdir(parents=True, exist_ok=True)


def select():
    sp = pickle.load(open(MB / "split.pkl", "rb"))
    qual = set(pickle.load(open(MB / "qual_pieces.pkl", "rb")))
    test = [f[:-4] for f in sp["test_data"]]
    return sorted(i for i in test if i in qual), len(test)


def midi_notes(path):
    m = mido.MidiFile(path)
    tpb = m.ticks_per_beat
    tempos = [(0, 500000)]
    t = 0
    for msg in m.tracks[0]:
        t += msg.time
        if msg.type == "set_tempo":
            tempos.append((t, msg.tempo))

    def sec(tick):
        s, last_t, last_tempo = 0.0, 0, tempos[0][1]
        for tt, tp in tempos[1:]:
            if tt >= tick:
                break
            s += (tt - last_t) * last_tempo / 1e6 / tpb
            last_t, last_tempo = tt, tp
        return s + (tick - last_t) * last_tempo / 1e6 / tpb

    out = []
    for tr in m.tracks:
        name = tr.name
        if name not in ("MELODY", "BRIDGE", "PIANO"):
            continue
        t, on = 0, {}
        for msg in tr:
            t += msg.time
            if msg.type == "note_on" and msg.velocity > 0:
                on.setdefault(msg.note, []).append((t, msg.velocity))
            elif msg.type in ("note_off", "note_on"):
                if on.get(msg.note):
                    st, vel = on[msg.note].pop(0)
                    out.append((name, msg.note, sec(st), sec(t), vel))
    return out


def build(song):
    d = REPO / song
    notes = midi_notes(d / f"{song}.mid")
    rows = [l.split() for l in open(d / "beat_midi.txt").read().splitlines()]
    bt = np.array([float(r[0]) for r in rows])
    down = np.array([float(r[2]) for r in rows])
    n = len(bt)

    def beat(t):
        if t <= bt[0]:
            return (t - bt[0]) / (bt[1] - bt[0])
        if t >= bt[-1]:
            return (n - 1) + (t - bt[-1]) / (bt[-1] - bt[-2])
        return float(np.interp(t, bt, np.arange(n)))

    k0 = int(np.argmax(down == 1.0))
    shift = (4 - k0 % 4) % 4
    q = []
    for name, p, s, e, vel in notes:
        b0, b1 = beat(s) + shift, beat(e) + shift
        q.append((name, p, int(round(b0 * 4)), int(round(b1 * 4)), vel))
    mn = min(x[2] for x in q)
    extra = 0
    if mn < 0:
        extra = int(math.ceil(-mn / 16)) * 16
    merged = {}
    pri = {"MELODY": 3, "BRIDGE": 2, "PIANO": 1}
    for name, p, a, b, vel in q:
        a += extra; b += extra
        dur = max(1, b - a)
        k = (a, p)
        if k in merged:
            old = merged[k]
            lab = name if pri[name] > pri[old[1]] else old[1]
            merged[k] = (max(dur, old[0]), lab, max(vel, old[2]))
        else:
            merged[k] = (dur, name, vel)
    lab = {"MELODY": "M", "BRIDGE": "B", "PIANO": "P"}
    notes16 = sorted((a, d_, p, 1 if p >= 60 else 2, lab[nm], vel) for (a, p), (d_, nm, vel) in merged.items())
    n_dup = len(q) - len(notes16)
    return notes16, n_dup, {"k0": k0, "shift": shift, "extra": extra, "beats": n}


def write(song):
    notes16, n_dup, info = build(song)
    xml = score_xml([(a, d, p, st) for a, d, p, st, _, _ in notes16], 16, title=f"POP909 {song}")
    (OUT / f"{song}.musicxml").write_text(xml, encoding="utf-8")
    # single-track MIDI, 120 ticks per 16th
    mf = mido.MidiFile(type=0, ticks_per_beat=480)
    tr = mido.MidiTrack(); mf.tracks.append(tr)
    # the song's own first tempo (MidiBERT has a tempo token; the first run of this comparison used a constant 120 bpm, kept in pop_mb_results_tempo120.json)
    tempo0 = next((m.tempo for m in mido.MidiFile(REPO / song / f"{song}.mid").tracks[0] if m.type == "set_tempo"), 500000)
    tr.append(mido.MetaMessage("set_tempo", tempo=tempo0, time=0))
    tr.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    ev = []
    vel_of = {}
    for a, d, p, st, l, vel in notes16:
        ev.append((a * 120, 1, p)); ev.append(((a + d) * 120, 0, p))
        vel_of[(a * 120, p)] = vel
    ev.sort(key=lambda x: (x[0], x[1]))
    last = 0
    for t, on, p in ev:
        tr.append(mido.Message("note_on", note=p, velocity=vel_of.get((t, p), 64) if on else 0, time=t - last)); last = t
    mf.save(str(OUT / f"{song}.mid"))
    n_bars = max((a + d - 1) // 16 for a, d, *_ in notes16) + 1
    jdump({"song": song, "bars": n_bars, "dup_merged": n_dup, "info": info,
           "notes": [{"on": a, "dur": d, "pitch": p, "staff": st, "label": l, "vel": vel} for a, d, p, st, l, vel in notes16]}, OUT / f"{song}.truth.json")
    return n_bars, len(notes16), collections.Counter(x[4] for x in notes16)


if __name__ == "__main__":
    ids, n_test = select()
    print("test split", n_test, "4/4 qualified", len(ids))
    tot = collections.Counter()
    for s in ids:
        nb, nn, c = write(s)
        tot.update(c)
        print(s, nb, nn, dict(c))
    print(dict(tot))
