# E40 Repeated pitches; runs of equal values (two separate counts).
#
# Chosen implementation: music21, one written voice at a time (Measure.voices by Voice id, followed across bars; a
# one-voice bar is voice "1"). Within a voice, in order: attacks are printed, non-grace notes or chords; a tie
# continuation is not an attack and neither extends nor breaks a run; a printed rest breaks both runs; a hidden rest
# (voice padding, not printed: _notes.py) does not. Two counters, reported apart (ChatGPT's split):
# (1) repeated pitches: the longest run of consecutive attacks with the same pitch content - one pitch struck again
#     and again, or the same chord repeated (repeated-note and repeated-chord technique both, and which it was is
#     reported); (2) equal values: the longest run of consecutive attacks with the same written value (type, dots and
#     tuplet ratio), whatever the pitches (a Hanon line changes pitch every note).
#
# Why: run-length counting over music21's voice sequences; no library has it (new-library-research.md: jSymbolic's
# RepeatedNotesFeature is a whole-piece share, not a run). Old branch validated the idea (Asturias right hand
# repeated-note run 96; Hanon 20 run of 241 sixteenths). Limit stated (ChatGPT): exporter voice labels can split one
# line into two voices, which shortens runs; the bar where each longest run starts is given so it can be read.


from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
def runs(score):
    """Per staff: longest repeated-pitch run and longest equal-value run (within one written voice), with bars."""
    import music21 as m
    from e01_layout import layout
    from _notes import _keep
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        seqs = {}
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            bar = bar_label(meas)
            for v in (list(meas.voices) or [meas]):
                vid = str(v.id) if v is not meas else "1"
                for x in v.notesAndRests:
                    if isinstance(x, (m.harmony.ChordSymbol, m.note.Unpitched)) or x.duration.isGrace:
                        continue
                    if x.isRest:
                        if not x.style.hideObjectOnPrint:
                            seqs.setdefault(vid, []).append(None)
                        continue
                    members = [y for y in (x.notes if x.isChord else [x]) if _keep(y)]  # hidden and slash heads out
                    if not members or all(y.tie is not None and y.tie.type in ("stop", "continue") for y in members):
                        continue
                    t = x.duration.tuplets
                    value = (x.duration.type, x.duration.dots, (t[0].numberNotesActual, t[0].numberNotesNormal) if t else None)
                    seqs.setdefault(vid, []).append((tuple(sorted(y.pitch.midi for y in members)), value, bar))
        best_rep, best_val = (0, None, None), (0, None, None)
        for seq in seqs.values():
            rep = val = 0
            prev = None
            rep_start = val_start = None
            for e in seq:
                if e is None:
                    rep = val = 0
                    prev = None
                    continue
                if prev is not None and e[0] == prev[0]:
                    rep += 1
                else:
                    rep, rep_start = 1, e
                if prev is not None and e[1] == prev[1]:
                    val += 1
                else:
                    val, val_start = 1, e
                if rep > best_rep[0]:
                    best_rep = (rep, rep_start[0], rep_start[2])
                if val > best_val[0]:
                    best_val = (val, val_start[1], val_start[2])
                prev = e
        v = best_val[1]
        out[k + 1] = {"repeated_pitch_run": best_rep[0],
                      "repeated_pitch": list(best_rep[1]) if best_rep[1] else None,
                      "repeated_is_chord": bool(best_rep[1]) and len(best_rep[1]) > 1, "repeated_from_bar": best_rep[2],
                      "equal_value_run": best_val[0],
                      "equal_value": (v[0] + "." * v[1] + (f" {v[2][0]}:{v[2][1]}" if v[2] else "")) if v else None,
                      "equal_value_from_bar": best_val[2]}
    return out
