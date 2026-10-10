# E22 Articulation marks.
#
# Chosen implementation: music21 alone, no raw read. A mark is a child of <notations><articulations> as music21 imports
# it: each one becomes an object in note.articulations whose EXACT class says which tag it was (the library's own table,
# musicxml.xmlObjects.ARTICULATION_MARKS: accent, strong-accent, staccato, staccatissimo, spiccato, tenuto,
# detached-legato, scoop, plop, doit, falloff, breath-mark, caesura, stress, unstress, other-articulation). The unit
# counted is the ATTACK: one printed note or chord object (one voice), once per kind. Note on the name: here, as in E23
# and E27 (747,754 over the corpus in all three), an "attack" includes tie continuations, which are printed but not
# struck again (E36-E45 leave them out); on_tied_continuation says how many marked ones there are. Only printed notes count
# (_notes.py). Grace notes are counted apart.
#
# Probed on hand-made MusicXML (test_e22.py and the scratch probes):
# - every tag above arrives as its own class, on the Note, or on the Chord for a chord (the Chord holds one list; its
#   members' lists are emptied). placement and breath-mark symbol arrive; other-articulation keeps its words in
#   displayText (reported as other_text: the "typed as words" pitfall of my row).
# - TRAP 1, class hierarchy: StrongAccent and Spiccato are subclasses of Accent, Spiccato and Staccatissimo of
#   Staccato. isinstance(a, Staccato) would count staccatissimo and spiccato as staccato. type(a) is used.
# - TRAP 2, n.articulations also holds the <technical> marks (fingering, up-bow, harmonic ...): only the 16 classes
#   of the table above are kept, the rest are other rows (E27 fingering).
# - MERGE (my old note "music21 folds chord articulations together", verified): when members of a chord are joined,
#   music21 keeps one object per class: staccato on 1 of 3 members, on 2 or on all 3 gives one Staccato on the Chord,
#   and which member carried it is not kept. The same note written with a duplicate (<staccato/><staccato/>) keeps
#   both objects, so marks are de-duplicated per attack here.
# - NOT IMPORTED: <soft-accent/> (MusicXML 4.0) is not in music21's table and vanishes. A mark on a print-object="no"
#   member of a chord that has printed members is attributed to the chord, and print-object="no" on the mark itself is
#   ignored (both probed).
#
# Measured on our 842 candidate files (raw XML count, scratch art_gap.py; printed non-grace notes, a chord is one
# attack): 62,760 marked attacks. By kind: staccato 45,502 in 315 files, accent 11,142 in 264, staccatissimo 3,933 in 59,
# tenuto 1,984 in 86, strong-accent 1,372 in 71, detached-legato 350 in 15, breath-mark 47 in 8, caesura 3, doit 1,
# falloff 1. The merge loses nothing here: the same kind is never on two members of a chord (0 cases in 142,670
# chords), and in the 27,562 marked chords the mark sits on one member, the first-written one (the lowest; MuseScore
# writes a chord's mark on its first note), so "which chord member" carries no meaning and is not reported (ChatGPT's
# "note position" is bar + staff + attack only).
# Whole-corpus check of this function against an independent raw count (scratch art_cmp.py, all 842 files, printed
# non-grace attacks 747,754): identical attack totals and identical per-kind totals, except in 4 files, each explained:
# <soft-accent/> 1 mark in 1 file (mxl/12/28 QmUkagE...); marks on print-object="no" members of printed chords, 5 marks
# in 3 files (mxl/8/56 QmQzDP... accent+1 tenuto+2; Chopin op. 25 No. 5 accent+1; mxl/3/8 Qmd9krj... staccato+1).
# Those two gaps are NOT patched: 6 marks of 62,760, and a per-staff raw read (as e07/e13) would add code for them
# alone. Marks written on the mark itself with print-object="no": 0 files. Marks on rests: 4 in 3 files, ignored (not
# notes). If the corpus grows and these count, patch them then.
# Not gaps, but decisions: 236 notes in 8 files carry the same tag twice (two <staccato/>, an export artefact) and
# count once (duplicate_marks says how many extra were dropped). Marks on a tied continuation, 147 in 37 files, are
# printed and counted; on_tied_continuation gives how many, so they can be discounted.
#
# Who was right, music21 or my old reader, on the disputed files (cross-check CSV, 41 rows): music21, with a reason in
# each file read in the raw XML. The old reader counted staccato once per time position over all voices of a staff;
# music21 (and this function) counts once per written note or chord in each voice. Raw count of the same file by both
# units: mxl/1/31 Qmbm31y...H6nnDAe6 staccato 123 per voice, 106 per time position (old reader 106, music21 123);
# mxl/7/16 QmPD9R...oFYeWFS staccato 296 vs 242 (old 242, music21 296); mxl/8/26 QmQjjt...XE4ayv9 1632 vs 1586 (old
# 1586, music21 1632); mxl/0/4 ja9nDEv3 119 vs 109. The accent case, mxl/7/10 QmPAiAn...y5yjCQ: old reader 0, music21
# 29 in the cross-check, 45 accents in the raw file (all on staff 2 notes written <type size="cue">: small printed
# notes, which the old reader dropped as cues and which the project counts, _notes.py). This function gives 45.
#
# From my row (adopted): counts by kind per staff, bars; the chord pitfall (a staccato on every member counted once
# per chord: music21 gives that for free, and the file corpus never writes it). From ChatGPT's review (adopted): exact
# tags kept (jazz scoop/plop/doit/falloff, breath-mark, caesura, stress); compound marks kept (tenuto+staccato is its
# own entry in combos, not folded into either); a printed staccato is a requested touch, not a measured note length,
# so nothing here is "how short the notes sound"; no inference from words. Not adopted: "note position" within a chord
# (see above), counting by time position across voices (two voices each carrying a staccato are two marks written).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter


def articulations(score):
    """Per staff: attacks, marked attacks, attacks by kind, combos, grace marks, duplicates, tied-continuation marks,
    other-articulation words, bars."""
    import music21 as m
    from music21.musicxml.xmlObjects import ARTICULATION_MARKS
    from e01_layout import layout
    from _notes import printed
    kind_of = {cls: tag for tag, cls in ARTICULATION_MARKS.items()}  # exact class -> MusicXML tag
    L = layout(score)
    out = {}
    for k, idx in enumerate(L["staves"]):
        by_kind, combos, grace, words, bars = Counter(), Counter(), Counter(), Counter(), []
        attacks = marked = dup = tied = 0
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            label = bar_label(meas)
            for n, _ in printed(meas):
                marks = [a for a in n.articulations if type(a) in kind_of]
                kinds = sorted({kind_of[type(a)] for a in marks})
                if n.duration.isGrace:
                    grace.update(kinds)
                    continue
                members = n.notes if n.isChord else [n]
                continuation = all(x.tie is not None and x.tie.type in ("stop", "continue") for x in members)
                attacks += 1
                if not kinds:
                    continue
                marked += 1
                dup += len(marks) - len(kinds)
                by_kind.update(kinds)
                if len(kinds) > 1:
                    combos["+".join(kinds)] += 1
                for a in marks:
                    if type(a) is m.articulations.Articulation and a.displayText:
                        words[a.displayText] += 1
                if continuation:
                    tied += 1
                if not bars or bars[-1] != label:
                    bars.append(label)
        out[k + 1] = {"attacks": attacks, "marked_attacks": marked,
                      "share_marked": round(marked / attacks, 4) if attacks else None,
                      "by_kind": dict(by_kind), "combos": dict(combos), "grace_by_kind": dict(grace),
                      "duplicate_marks": dup, "on_tied_continuation": tied, "other_text": dict(words), "bars": bars}
    return out
