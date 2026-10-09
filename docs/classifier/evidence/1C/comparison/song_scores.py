"""Turn the 111 Song stimuli into MusicXML scores the current detector can read, and check each by reading it back.

For each stimulus (song_stimuli.json): the two pattern bars (bars 3 and 4 of the .rhy; bars 1-2 are the metronome) are
repeated to five bars [b3, b4, b3, b4, b3]; every note lasts until the next onset (the dataset's convention: "notes are
supposed to end where the next note starts", SynPy/WNBD), a note crossing a bar line is tied, a gap before the first
onset is a rest. One part, one line, no dynamics. The detector's value for a stimulus counts the events in bars 1, 2 and
3 (0-based) only, so that the first bar (which has no earlier note) and the last (whose last note has no later onset
to be held through) do not decide it.

Writes build/song_scores/<name>.musicxml and song_scores_check.json (intended onset ticks against the onsets read back
through the project's reader, per stimulus). Run with the main .venv (music21, partitura).
"""
import json, sys, warnings
from fractions import Fraction as F
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syn_common as C

warnings.simplefilter("ignore")
from music21 import stream, note, meter, tempo, clef  # noqa: E402

OUTDIR = C.BUILD / "song_scores"
OUTDIR.mkdir(parents=True, exist_ok=True)
REPEATS = 5


def build(name, rec):
    ts = rec["ts"]
    num, den = map(int, ts.split("/"))
    barq = F(4 * num, den)
    pat = [rec["bars"][2], rec["bars"][3]]
    bars = [pat[i % 2] for i in range(REPEATS)]
    n_ticks = len(bars[0])
    tickq = barq / n_ticks
    onsets = []  # absolute tick of every onset
    for bi, b in enumerate(bars):
        for ti, v in enumerate(b):
            if v:
                onsets.append(bi * n_ticks + ti)
    total = REPEATS * n_ticks
    part = stream.Part()
    part.append(clef.TrebleClef())
    for bi in range(REPEATS):
        m = stream.Measure(number=bi + 1)
        if bi == 0:
            m.append(meter.TimeSignature(ts))
        part.append(m)
    # segments: (start_tick, end_tick, is_note)
    segs = []
    if onsets and onsets[0] > 0:
        segs.append((0, onsets[0], False))
    for i, o in enumerate(onsets):
        e = onsets[i + 1] if i + 1 < len(onsets) else total
        segs.append((o, e, True))
    for (s, e, is_note) in segs:
        # split at bar lines
        pieces = []
        a = s
        while a < e:
            bar_end = ((a // n_ticks) + 1) * n_ticks
            b_ = min(e, bar_end)
            pieces.append((a, b_))
            a = b_
        for k, (a, b_) in enumerate(pieces):
            bi = a // n_ticks
            m = part.getElementsByClass(stream.Measure)[bi]
            if is_note:
                n = note.Note("C5")
                n.quarterLength = F(b_ - a) * tickq
                if len(pieces) > 1:
                    n.tie = None
                    from music21 import tie
                    if k == 0:
                        n.tie = tie.Tie("start")
                    elif k == len(pieces) - 1:
                        n.tie = tie.Tie("stop")
                    else:
                        n.tie = tie.Tie("continue")
            else:
                n = note.Rest()
                n.quarterLength = F(b_ - a) * tickq
            m.insert(F(a - bi * n_ticks) * tickq, n)
    sc = stream.Score()
    sc.append(part)
    fp = OUTDIR / f"{name}.musicxml"
    sc.write("musicxml", fp=str(fp))
    return fp, onsets, n_ticks, barq


def main():
    stim = json.loads((C.HERE / "song_stimuli.json").read_text(encoding="utf-8"))
    vs, vc = C.current()
    check = {}
    bad = 0
    for name, rec in stim.items():
        fp, onsets, n_ticks, barq = build(name, rec)
        item = {"id": "song." + name, "file": str(fp), "hands": "right"}
        vc.BYID[item["id"]] = item
        try:
            sc = vc.load(item["id"])
            starts = [vc.fr(s) for s in sc.measure_starts]
            read = []
            for part in sc.part_score.parts:
                q = part.quarter_map
                for n in part.notes_tied:
                    read.append(vc.fr(q(n.start.t)))
            read = sorted(read)
            tickq = barq / n_ticks
            want = sorted(F(o) * tickq for o in onsets)
            ok = (read == want)
        except Exception as ex:  # noqa: BLE001
            ok = False
            read = repr(ex)[:200]
            want = []
        bad += (not ok)
        check[name] = {"ts": rec["ts"], "ticks": n_ticks, "ok": ok, "n_onsets": len(want),
                       "read": None if ok else str(read)[:300], "want": None if ok else [str(x) for x in want][:20]}
    (C.HERE / "song_scores_check.json").write_text(json.dumps(check, indent=0), encoding="utf-8")
    print(len(check), "scores;", bad, "whose read-back onsets differ from the intended ones")


if __name__ == "__main__":
    main()
