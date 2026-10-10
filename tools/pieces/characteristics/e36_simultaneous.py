# E36 Notes struck together, per staff.
#
# Chosen implementation: music21 notes, grouped two ways side by side (my row; ChatGPT asked for both). "Per staff":
# every struck printed note on the staff with the same onset (bar index + offset), across all written voices. "Per
# voice": the notes of one music21 Note/Chord object, i.e. one written voice. Struck = printed (_notes.py), not a grace
# note, not a tie continuation (a chord member that only continues a tie is held, not struck). Same-pitch doublings at
# one onset (two voices sharing a note) count once, and how many were folded is reported (ChatGPT: an explicit unison
# policy). Stacks of 7 or more distinct pitches on one staff are flagged as a possible encoding fault (duplicated
# voices: the old branch found 8 in one voice of a Clair de lune file). Two-note attacks get their harmonic interval
# both in semitones and spelled, from music21 interval.Interval(...).name (ChatGPT: an augmented fourth and a
# diminished fifth are the same keys but different notation).
#
# Why: the grouping is a few lines over music21's notes, offsets and Pitch; no library gives per-staff simultaneity
# with voices kept apart (new-library-research.md: chordify merges staves). These are NOTATED clusters on a staff:
# two voices on one staff may be split between the hands, so nothing here claims one hand plays them (ChatGPT; my
# row). The grouping is also used by E37 (span) and E38 (octaves), which import _staff_attacks from this file.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter
from fractions import Fraction


def _staff_attacks(score, idx):
    """Struck attacks of one staff: list of dicts with bar_index, bar, offset, time (quarters from the start, as written,
    no repeats), pitches (distinct MIDI, ascending),
    spelled (music21 Pitch objects, one per distinct MIDI, lowest spelling kept), doublings, voice_sizes, rolled."""
    import music21 as m
    from _notes import printed, _keep
    spanned = set()
    for sp in score.recurse().getElementsByClass(m.expressions.ArpeggioMarkSpanner):
        if sp.type != "non-arpeggio":
            spanned |= {id(e) for e in sp.getSpannedElements()}
    at = {}
    for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
        for n, _ in printed(meas):
            if n.duration.isGrace:
                continue
            members = [x for x in (n.notes if n.isChord else [n])
                       if _keep(x) and (x.tie is None or x.tie.type == "start")]
            if not members:
                continue
            key = (mi, Fraction(n.getOffsetInHierarchy(meas)).limit_denominator(10000))
            a = at.setdefault(key, {"bar_index": mi, "bar": bar_label(meas), "offset": key[1],
                                    "time": Fraction(meas.offset).limit_denominator(10000) + key[1],
                                    "all": [], "voice_sizes": [], "rolled": False})
            a["all"] += [x.pitch for x in members]
            a["voice_sizes"].append(len({x.pitch.midi for x in members}))
            a["rolled"] |= id(n) in spanned or any(isinstance(e, m.expressions.ArpeggioMark) and e.type != "non-arpeggio"
                                                    for e in n.expressions)
    out = []
    for key in sorted(at):
        a = at[key]
        by_midi = {}
        for p in sorted(a["all"], key=lambda p: (p.midi, p.diatonicNoteNum)):
            by_midi.setdefault(p.midi, p)
        a["pitches"] = sorted(by_midi)
        a["spelled"] = [by_midi[x] for x in a["pitches"]]
        a["doublings"] = len(a["all"]) - len(by_midi)
        del a["all"]
        out.append(a)
    return out


def simultaneous(score):
    """Per staff: attacks by number of notes struck together (per staff and per written voice), largest, doublings,
    possible encoding faults, bars with 4+, two-note harmonic intervals (semitones and spelled)."""
    import music21 as m
    from e01_layout import layout
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        at = _staff_attacks(score, idx)
        per_staff = Counter(min(len(a["pitches"]), 7) for a in at)
        per_voice = Counter(min(s, 7) for a in at for s in a["voice_sizes"])
        semis, names = Counter(), Counter()
        for a in at:
            if len(a["pitches"]) == 2:
                semis[a["pitches"][1] - a["pitches"][0]] += 1
                names[m.interval.Interval(a["spelled"][0], a["spelled"][1]).name] += 1
        bars4 = []
        for a in at:
            if len(a["pitches"]) >= 4 and (not bars4 or bars4[-1] != a["bar"]):
                bars4.append(a["bar"])
        label = lambda c: {(str(x) + "+" if x == 7 else str(x)): v for x, v in sorted(c.items())}  # noqa: E731
        out[k + 1] = {"per_staff": label(per_staff), "per_voice": label(per_voice),
                      "largest": max((len(a["pitches"]) for a in at), default=0),
                      "largest_in_one_voice": max((s for a in at for s in a["voice_sizes"]), default=0),
                      "unison_doublings": sum(a["doublings"] for a in at),
                      "possible_encoding_fault": sum(1 for a in at if len(a["pitches"]) >= 7),
                      "bars_4_plus": bars4,
                      "two_note_semitones": dict(sorted(semis.items())), "two_note_intervals": dict(names)}
    return out
