"""Compare an OMR result (Audiveris MusicXML, one file per page) with the MIDI file published with the same score.

Both are reduced to a sequence of onsets, each the set of MIDI pitches starting together, in time order; the two
sequences are aligned with difflib, and every onset that differs is listed with the OMR bar it falls in. Timing is
not compared beyond order, so a different tempo or a missing pickup does not count as a difference; a repeat written
out in the MIDI and not in the score shows as a run of extra MIDI onsets. Grace notes count as their own onset, just before the main note. Bars of the wrong length (against the time
signature) are listed too: Audiveris's rhythm errors show there (pilot, FABLE step 3).

Usage: python tools/pieces/omr_vs_midi.py file.mid page1.mxl [page2.mxl ...]
"""
import difflib, sys


def omr_onsets(paths):
    import music21
    ev, bad, bar0, t0, last = {}, [], 0, 0.0, None
    for p in paths:
        s = music21.converter.parse(p)
        parts = list(s.parts)
        staves = [list(x.getElementsByClass(music21.stream.Measure)) for x in parts]
        n = min(len(x) for x in staves)
        for i in range(n):
            ts = staves[0][i].getContextByClass(music21.meter.TimeSignature) or last  # a later page may not restate it
            last = ts
            want = ts.barDuration.quarterLength if ts else 4.0
            for k, st in enumerate(staves):
                m = st[i]
                if abs(m.duration.quarterLength - want) > 1e-6 and not (bar0 + i == 0):
                    bad.append((bar0 + i + 1, "RH" if k == 0 else "LH", float(m.duration.quarterLength), float(want)))
                for nt in m.recurse().notes:
                    on = round(t0 + float(m.offset - staves[k][0].offset) + float(nt.getOffsetInHierarchy(m)), 3)
                    if nt.duration.isGrace:  # the MIDI plays a grace note just before its main note
                        on = round(on - 0.01, 3)
                    tied = nt.tie is not None and nt.tie.type in ("stop", "continue")
                    for pt in nt.pitches:
                        if not tied:
                            ev.setdefault(on, (set(), bar0 + i + 1))[0].add(pt.midi)
        t0 += float(sum(m.duration.quarterLength for m in staves[0][:n]))
        bar0 += n
    seq = sorted(ev.items())
    return [tuple(sorted(v[0])) for _, v in seq], [v[1] for _, v in seq], bad


def midi_onsets(path):
    import music21
    s = music21.converter.parse(path, quantizePost=True)
    ev = {}
    for nt in s.flatten().notes:
        on = round(float(nt.offset), 3)
        for pt in nt.pitches:
            ev.setdefault(on, set()).add(pt.midi)
    return [tuple(sorted(v)) for _, v in sorted(ev.items())]


def main():
    mid, pages = sys.argv[1], sys.argv[2:]
    a, bars, bad = omr_onsets(pages)
    b = midi_onsets(mid)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    same = sum(x.size for x in sm.get_matching_blocks())
    print(f"OMR onsets {len(a)}, MIDI onsets {len(b)}, matching {same} ({100 * same / max(len(a), 1):.0f}% of OMR)")
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        where = f"bars {bars[i1]}-{bars[i2 - 1]}" if i2 > i1 else f"after bar {bars[i1 - 1] if i1 else 0}"
        print(f"  {tag:7} {where}: OMR {a[i1:i2][:6]} | MIDI {b[j1:j2][:6]}")
    print(f"bars of the wrong length: {len(bad)}", bad[:20])


if __name__ == "__main__":
    main()
