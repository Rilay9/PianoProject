# E13 Triplets and other tuplets.
#
# Chosen implementation: music21 Duration.tuplets for where tuplets are (runs per voice, bars) and for the printed
# signs (Tuplet.type "start" from a <tuplet> notation, .bracket, .tupletActualShow); the written ratio counts come from
# the file's <time-modification> elements, counted per staff.
#
# Definition (my row after ChatGPT's required change): a tuplet note has a time modification with actual and normal
# both 2-12, unequal, ratio strictly between 0.5 and 2. Other ratios (28:6, 80:12, 6:6, 160:107 ...) are re-export
# artefacts: listed as suspect, not tuplets. Rests inside a tuplet are not notes but do not break the run. The printed
# bracket or number is a separate display fact: measured, 4,906 notes at 3:2 in 92 of our files have no <tuplet>
# element, so "printed bracket" must never stand in for "tuplet".
#
# Why music21 is the base: on the files where my old raw reader and music21 disagreed, music21 was right (Bach
# BWV 858 fugue: 62 time-modified notes in the file, music21 62, old reader 0; Chopin Op. 25 No. 1: 2,091 in the file,
# music21 2,085, old reader 234).
#
# One raw read, for a measured gap: music21 reduces the written ratio (probed: 6:4 -> 3:2, 10:8 -> 5:4, 4:6 -> 2:3)
# and drops equal ratios such as 6:6. The rhythm is the same, but a printed sextuplet is not a triplet for a reader,
# and 6:4 is common here: 24,941 notes in 44 of our 842 files (also 12:8 1,405, 9:6 810, 8:12 188). So
# notes_by_ratio and suspect are counted from <time-modification> as written (part order + <staff>, as E01 maps
# them; grace and rest notes left out; hidden (print-object="no") notes left
# out: _notes.py). No notes are re-read for anything else.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter


def plausible(a, n):
    return a is not None and n is not None and 2 <= a <= 12 and 2 <= n <= 12 and a != n and 0.5 < a / n < 2


def tuplets(score, path):
    """Per staff: tuplet notes by written ratio, suspect ratios, runs, printed brackets/numbers, bars."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root
    L = layout(score)
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    written, suspect = Counter(), Counter()
    raw_parts = list(raw_root(path).iter("part"))
    if len(raw_parts) == len(L["parts"]):
        for pi, part in enumerate(raw_parts):
            ids = L["parts"][pi]["staff_indices"]
            for note in part.iter("note"):
                tm = note.find("time-modification")
                if tm is None or note.get("print-object") == "no" or any(note.find(x) is not None for x in ("rest", "grace")):
                    continue
                st = int(note.findtext("staff") or 1)
                k = staff_no.get(ids[st - 1]) if st - 1 < len(ids) else None
                if k is None:
                    continue
                try:
                    a, n = int(tm.findtext("actual-notes")), int(tm.findtext("normal-notes"))
                except (TypeError, ValueError):
                    suspect[(k, "unreadable")] += 1
                    continue
                (written if plausible(a, n) else suspect)[(k, f"{a}:{n}")] += 1
    out = {}
    for idx, k in staff_no.items():
        runs, brackets, numbers, bars = 0, 0, 0, []
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            for v in (list(meas.voices) or [meas]):
                prev = None
                for x in v.notesAndRests:
                    if x.duration.isGrace or isinstance(x, m.harmony.ChordSymbol) or x.style.hideObjectOnPrint:
                        continue
                    t = x.duration.tuplets
                    r = (t[0].numberNotesActual, t[0].numberNotesNormal) if t and plausible(t[0].numberNotesActual, t[0].numberNotesNormal) else None
                    if r and (r != prev or (t[0].type == "start" and prev is not None)):
                        runs += 1
                        bar = bar_label(meas)
                        if not bars or bars[-1] != bar:
                            bars.append(bar)
                    for tt in t:
                        if tt.type == "start":
                            brackets += tt.bracket not in (False, None)
                            numbers += tt.tupletActualShow not in (None, "none")
                    prev = r
        out[k] = {"notes_by_ratio": {r: c for (s, r), c in written.items() if s == k},
                  "suspect": {r: c for (s, r), c in suspect.items() if s == k},
                  "runs": runs, "printed_brackets": brackets, "printed_numbers": numbers, "bars": bars}
    return out
