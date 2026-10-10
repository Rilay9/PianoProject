# E11 Note and rest values, dots and ties, per staff.
#
# Chosen implementation: music21 Duration on each note and rest. Written value = Duration.type and .dots, which
# music21 takes from <type>/<dot>; the encoded length is .quarterLength from <duration>. When the two disagree music21
# keeps both and sets Duration.linked = False (probed: <type>quarter with a 3/4-quarter duration -> type quarter,
# quarterLength 0.75, linked False; tuplet notes stay linked), so the type/duration mismatch count is linked == False.
# Whole-bar rests (<rest measure="yes">, Rest.fullMeasure) are counted apart: 7,031 rests in 380 of our 842 files have
# no <type>, and music21 then derives one from the bar length (a 3/4 bar rest becomes a "dotted half"), which is not
# what is printed. Ties from music21 Note.tie (per note inside chords too): a chain begins at a "start"; it crosses a
# barline at each "stop"/"continue" note that sits at offset 0 of its bar (tied notes are contiguous, so the next note
# of a chain starts exactly where the last ended).
#
# Why: all of this is what my old raw walk did by hand. Ties: ChatGPT's review asked for <tied> (engraving) as well as
# <tie> (sound); music21 reads only <tie> (probed: a <tied>-only pair comes in untied). Measured on our 842 files:
# 48,607 notes carry a tie mark and only 10, in one file, have <tied> without <tie>, so no raw patch is made for it.
# A note without <type> gets one derived by music21; that cannot be told apart, and the value is still correct.
#
# Kept from my row and ChatGPT: written type and encoded duration are separate facts; a quarter tied to an eighth is
# one quarter + one eighth + one chain, not a dotted quarter; values shorter than a 128th are flagged as re-export
# artefacts (old branch: they all sat in bars carrying a quantisation ratio) and left out of `shortest`. Grace notes are
# E14's. Tuplet notes keep their written type (E13 reports the tuplet).
#
# Which notes count: printed notes only, small ones included, hidden ones (print-object="no") left out - the rule
# and its measurements are in _notes.py. Hidden rests (voice padding, 6,817 in 251 of our files) are not printed rests
# either and are left out of the rest counts. This row also reports how many printed notes are small (<cue/> or
# <type size="cue">) per staff, as a printed-size fact: music21 marks only <type size="cue"> (style.noteSize "cue") and
# ignores <cue/> (probed), so that count is read from the file (part order + <staff>).
from collections import Counter

ORDER = ["breve", "whole", "half", "quarter", "eighth", "16th", "32nd", "64th", "128th", "256th", "512th", "1024th", "2048th"]


def values(score, path):
    """Per staff: notes and rests by written type, dots, whole-bar rests, mismatches, tie chains and crossings, and
    how many printed notes are small (<cue/> or <type size="cue">; they count like any printed note)."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root
    L = layout(score)
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    small = Counter()
    raw_parts = list(raw_root(path).iter("part"))
    if len(raw_parts) == len(L["parts"]):
        for pi, part in enumerate(raw_parts):
            ids = L["parts"][pi]["staff_indices"]
            for note in part.iter("note"):
                t = note.find("type")
                if note.find("rest") is None and note.get("print-object") != "no" and                         (note.find("cue") is not None or (t is not None and t.get("size") == "cue")):
                    st = int(note.findtext("staff") or 1)
                    small[staff_no.get(ids[st - 1]) if st - 1 < len(ids) else None] += 1
    out = {}
    for k, idx in enumerate(L["staves"]):
        notes, rests, dots, mismatch, chains, cross, odd, full = Counter(), Counter(), Counter(), 0, 0, 0, 0, 0
        struck = []
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            for n in meas.recurse().notesAndRests:
                if isinstance(n, (m.harmony.ChordSymbol, m.note.Unpitched)) or n.duration.isGrace:
                    continue
                d = n.duration
                if n.isRest:
                    if n.style.hideObjectOnPrint:
                        continue
                    if getattr(n, "fullMeasure", False) in (True, "always"):
                        full += 1
                    else:
                        rests[d.type] += 1
                    mismatch += not d.linked
                    continue
                members = [x for x in (n.notes if n.isChord else [n]) if not x.style.hideObjectOnPrint]
                if not members:
                    continue
                notes[d.type] += 1
                dots[min(d.dots, 2)] += d.dots > 0
                mismatch += not d.linked
                if d.type in ORDER and ORDER.index(d.type) > ORDER.index("128th"):
                    odd += 1
                at0 = n.getOffsetInHierarchy(meas) == 0
                ties = [x.tie for x in members]
                if all(t is not None and t.type in ("stop", "continue") for t in ties):
                    pass  # a continuation: not a new written attack
                elif d.type in ORDER and ORDER.index(d.type) <= ORDER.index("128th"):
                    struck.append(d.type)
                for t in ties:
                    if t is None:
                        continue
                    chains += t.type == "start"
                    cross += t.type in ("stop", "continue") and at0
        out[k + 1] = {"notes_by_type": dict(notes), "rests_by_type": dict(rests), "whole_bar_rests": full,
                      "dotted": dots[1], "double_dotted": dots[2],
                      "shortest": max(struck, key=ORDER.index) if struck else None,
                      "type_duration_mismatch": mismatch, "shorter_than_128th": odd,
                      "tie_chains": chains, "tie_crossings": cross, "small_notes": small[k + 1]}
    return out
