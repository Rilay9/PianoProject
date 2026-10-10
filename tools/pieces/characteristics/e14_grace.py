# E14 Grace notes.
#
# Chosen implementation: music21 Duration.isGrace (a GraceDuration) for which notes are grace notes and for runs: in
# each voice of each bar, in score order, consecutive grace events (a grace chord is one event) form a run; the run
# belongs to the next main note in that voice - in the next bar if the run ends a bar (fixed after ChatGPT's review:
# such runs had been called after-runs; runs_across_barline counts them) - or is an after-run when the voice has no
# later main note at all. Count = grace note heads, small-size ones included (printed notes only, small ones
# included: see _notes.py).
#
# Why music21: it already orders grace notes in their voice at the main note's offset (probed), which is what pairing
# by part/staff/voice in score order needs (ChatGPT's review: not mere XML adjacency).
#
# One raw read, for a measured gap: music21 reports every grace note as slashed (probed: an unslashed <grace/> after
# a slashed one comes in with GraceDuration.slash True; the attribute defaults to True and is not reset). So slashed
# vs unslashed is counted per staff from <grace slash="yes"> in the file (part order + <staff>, as E01 maps them).
# The slash is a printed sign only: per ChatGPT, acciaccatura vs appoggiatura performance is not inferred from it.
# Long runs (6+ in Chopin, from the old branch) are written-out flourishes and are reported as runs, not ornaments.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter


def grace(score, path):
    """Per staff: grace heads, slashed / unslashed (from the file), runs, longest run, after-runs, bars."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root
    L = layout(score)
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    slash = Counter()
    raw_parts = list(raw_root(path).iter("part"))
    if len(raw_parts) == len(L["parts"]):
        for pi, part in enumerate(raw_parts):
            ids = L["parts"][pi]["staff_indices"]
            for note in part.iter("note"):
                g = note.find("grace")
                if g is None or note.find("rest") is not None or note.get("print-object") == "no":
                    continue
                st = int(note.findtext("staff") or 1)
                k = staff_no.get(ids[st - 1]) if st - 1 < len(ids) else None
                if k:
                    slash[(k, "slashed" if g.get("slash") == "yes" else "unslashed")] += 1
    out = {}
    for idx, k in staff_no.items():
        heads, runs, after, cross, longest, bars = 0, 0, 0, 0, 0, []
        pending = {}  # voice id -> (run length, bar label where it started): carried across the barline
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            for v in (list(meas.voices) or [meas]):
                vid = str(v.id) if v is not meas else "1"
                run, start_bar = pending.pop(vid, (0, None))
                carried = run > 0
                for x in v.notes:
                    if isinstance(x, (m.harmony.ChordSymbol, m.note.Unpitched)) or x.style.hideObjectOnPrint:
                        continue
                    if x.duration.isGrace:
                        heads += len(x.pitches)
                        if not run:
                            start_bar = bar_label(meas)
                        run += 1
                        continue
                    if run:
                        runs += 1
                        cross += carried
                        longest = max(longest, run)
                        if not bars or bars[-1] != start_bar:
                            bars.append(start_bar)
                    run, carried = 0, False
                if run:  # grace notes after the last main note of this voice in the bar: wait for the next bar
                    pending[vid] = (run, start_bar)
        for run, start_bar in pending.values():  # no later main note in that voice: an after-run
            runs += 1
            after += 1
            longest = max(longest, run)
        out[k] = {"n": heads, "slashed": slash[(k, "slashed")], "unslashed": slash[(k, "unslashed")],
                  "runs": runs, "longest_run": longest, "after_runs": after, "runs_across_barline": cross, "bars": bars}
    return out
