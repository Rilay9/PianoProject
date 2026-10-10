# E02 Bar references and bar lengths.
#
# Chosen implementation: music21 Measures. Location = the measure's position index (unique) plus the printed number
# as the file writes it (_raw.bar_label: music21's number + suffix misprints MuseScore's "X1" bars). Length of a bar = the largest
# Measure.highestTime over the staves (music21 has already resolved <backup>, <forward>, voices and changed
# <divisions>). Nominal length = barDuration of the time signature in force: the measure's own .timeSignature, else
# getContextByClass (which, probed, does not see a time signature inside the measure itself); if no time signature
# exists the state is "unknown" (music21's barDuration silently falls back to 4/4, so it is not used then).
#
# Why: my old version walked <duration>/<backup>/<forward> by hand: the same arithmetic music21 does, re-implemented.
#
# One raw read, for a measured gap: music21 drops <measure implicit="yes"> (probed: the flag is not kept on Measure;
# showNumber stays "default"). The flag is the editor's own statement that a short first bar is a pickup (E10), so it
# is read from the file by measure order in the first part.
#
# A second raw read, for a gap the E32 builder measured: music21 stretches a whole-measure rest (<rest measure="yes">
# without <type>, or typed whole/breve) to the time signature's bar and ignores its own <duration> (Rest.fullMeasure
# True). Where the other staff is shorter (a pickup, a split bar), the bar then reads as full: 30 bars in 10 of our 842
# files, among them pickups E10 missed (QmSPmy... bar 1: music21 4 quarters, file 1/2). Only bars holding such a rest are
# re-measured with the file's time cursor (_raw.bar_lengths), and the cursor wins only when it differs by more than 1/8
# quarter (integer <duration>s drift by up to 0.03 in files with odd tuplets, where music21 is right). Such bars carry
# "corrected_from" (music21's length) so the change is visible.
#
# From ChatGPT's review (adopted): a unique index beside the printed number, since repeated numbers and endings are
# not unique; explicit rests and unfilled voice gaps reported apart. music21 does not turn a <forward> inside a voice
# into a rest (probed), so a voice that stops before the bar's nominal length is an unfilled gap, listed per staff and
# voice, while explicit rests count as filled. The largest end time is "encoded extent", not proof the bar is
# editorially complete; that is why gaps are listed rather than folded into "full". Interior counts leave out the
# first and last bars (pickup and its completing bar, E10).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from fractions import Fraction


def bars(score, path):
    """Per bar: index, printed number, implicit flag, length and nominal length in quarters, state, voice gaps."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root, bar_lengths
    staves = [score.parts[i] for i in layout(score)["staves"]]
    first_part = next(raw_root(path).iter("part"), None)
    implicit = [x.get("implicit") == "yes" for x in first_part.findall("measure")] if first_part is not None else []
    per_staff = [list(p.getElementsByClass(m.stream.Measure)) for p in staves]
    n = max((len(x) for x in per_staff), default=0)
    stretched = {i for i in range(n) if any(i < len(s) and any(r.fullMeasure is True for r in s[i].recurse().getElementsByClass(m.note.Rest))
                                            for s in per_staff)}
    written = bar_lengths(path, stretched) if stretched else {}
    out = []
    for i in range(n):
        ms = [x[i] for x in per_staff if i < len(x)]
        ref = ms[0]
        # a measure's own time signature first: getContextByClass on a Measure does not look inside it (probed)
        ts = ref.timeSignature or ref.getContextByClass(m.meter.TimeSignature)
        nominal = Fraction(ts.barDuration.quarterLength).limit_denominator(10000) if ts else None
        length = max(Fraction(x.highestTime).limit_denominator(10000) for x in ms)
        corrected = None
        if i in written and abs(written[i] - length) > Fraction(1, 8):
            corrected, length = str(length), written[i]
        state = "unknown" if nominal is None else ("full" if length == nominal else "short" if length < nominal else "over-full")
        gaps = []
        if nominal is not None:
            for k, x in enumerate(ms):
                voices = list(x.voices) or [x]
                for v in voices:
                    end = max((Fraction(e.offset + e.quarterLength).limit_denominator(10000) for e in v.notesAndRests), default=Fraction(0))
                    if end < nominal:
                        gaps.append({"staff": k + 1, "voice": getattr(v, "id", None) if v is not x else None, "missing": str(nominal - end)})
        out.append({"index": i, "number": bar_label(ref), "implicit": i < len(implicit) and implicit[i],
                    "length": str(length), "nominal": str(nominal) if nominal is not None else None, "state": state, "gaps": gaps,
                    **({"corrected_from": corrected} if corrected else {})})
    interior = out[1:-1]
    return {"bars": len(out), "interior_short": sum(b["state"] == "short" for b in interior),
            "interior_over": sum(b["state"] == "over-full" for b in interior),
            "bars_with_voice_gaps": sum(bool(b["gaps"]) for b in out), "measures": out}
