# E29 Chord symbols.
#
# Chosen implementation: music21 alone, no raw read. Every <harmony> element arrives as a harmony.ChordSymbol (or its
# subclasses NoChord and tablature.ChordWithFretBoard) with root(), bass(), chordKind (the MusicXML <kind>, with the
# library's own alias table: "dominant" -> "dominant-seventh", "major-minor" -> "minor-major-seventh",
# "half-diminished" -> "half-diminished-seventh"), chordKindStr (the kind's text="" attribute, the printed abbreviation),
# chordStepModifications (the <degree> add/alter/subtract) and style.hideObjectOnPrint (print-object="no"). The function
# only SORTS these objects (what is a chord, a no-chord mark, a function label, a text label), removes true duplicates
# and counts. It reports the SYMBOL AS WRITTEN. It never claims the sounding harmony: music21 builds pitches for a
# symbol, those pitches are not used or reported (ChatGPT: "<kind> is the written symbol, not verified sounding quality").
# Chord names typed as <words> ("Bb7") are not <harmony> and are not counted (my row; music21's text parser misread
# "Bb7" as root B on the old branch).
#
# Probed on hand-made MusicXML (test_e29.py and the scratch probes p29*.py):
# - Root with alter (C#, Db, F##), bass with alter (G7/Bb), kind text, degrees (add 9, alter b5, subtract 3, add 13 + add
#   b9), unknown kinds (kept as the written string: "min7", "Neapolitan"), 11ths/13ths, power, other: all arrive right.
# - TRAP 1, STAFF COPIES: a <harmony> with no <staff> in a part with two staves is imported into BOTH PartStaffs (one
#   written symbol appears twice, like a <direction>, e25); a <staff>2</staff> harmony stays on staff 2. A symbol also
#   written twice, or in two parts, is a duplicate too. Duplicates are removed only when they share the SAME position
#   (bar index + offset in the bar) AND the same content (root, kind, bass, degrees, text, function). Two DIFFERENT
#   symbols at one position are both kept and listed in `conflicts` (ChatGPT: not safe to merge).
# - TRAP 2, kind none is not N.C.: music21 makes every <kind>none</kind> a NoChord, and gives it the text "N.C." when the
#   text is empty. In our files that is wrong for most of them (measured below): functional-harmony labels (<function>V7
#   </function> with kind none) and free text in the kind's text="" ("Sol", "1", "rit.", "RE-7"). A NoChord is called
#   no_chord only when it has no function and its text is empty/N.C./NC/N/C/No Chord; with a function it is a function
#   label (music21 keeps the function: cs.romanNumeral.figure, the written "V7", for a symbol that has no pitches);
#   otherwise it is a text label. Function labels and text labels are listed apart and are NOT chord symbols here.
# - TRAP 3, a symbol music21 cannot spell: .figure and repr() of a pitchless ChordSymbol (function/numeral, no root)
#   raise a RecursionError. Nothing here calls them for a symbol without pitches.
# - `<kind/>` empty with a root ("Db" written bare, 87 in one file): music21 gives chordKind "" and a one-note "pedal"
#   chord whose .figure says "Dbpedal". Reported as kind "" (bare root, which in lead-sheet writing is the major triad;
#   it is counted in the class "major" and bare_root says how many).
# - ChordSymbols DO appear in measure.recurse().notes (and in notesAndRests). The shared _notes.printed and the rows that
#   read notes directly (e01, e11-e14, e19, e40 by grep) skip the class; test_e29 pins that printed() and layout() give the
#   same result with and without symbols. This function reads only the ChordSymbol class and never a note.
# - Not imported by music21: MusicXML 4 <numeral> (a pitchless ChordSymbol with no function: reported as `unresolved`),
#   <inversion> text, print-frame, use-symbols. The frame itself is flagged by the class (ChordWithFretBoard).
# - A <harmony> whose <root> has no <root-step> (invalid MusicXML) makes music21's whole parse of the file raise
#   AttributeError. Not handled here (it fails before this function); measured in our files below.
#
# Measured on our 842 candidate files (raw XML, scratch raw29.py / none29.py): <harmony> in 39 files (4.6%), 1,992
# elements: print-object="no" 0, explicit <staff> 0, <offset> 60 (8 files), <degree> 69 (8 files), <bass> 221 (19 files),
# <frame> 31 (2 files), <function> 217 (1 file), <numeral> 0, empty <kind/> 87 (1 file), root without root-step 0, 9 files
# with harmony in more than one part. Kind none: 293 elements: 217 function labels, 73 free text labels, 3 real N.C.
# (empty text, 2 files). So the old reader's N.C. count (293) was wrong by 290; this function says 3.
# Whole-corpus run of this function over all 842 files against an independent raw walk (scratch cmp29.py: its own time
# cursor over <divisions>, <duration>, <backup>, <forward>, <offset>; its own root/bass/degree spelling; the same
# deduplication key; compares the SET of (bar index, offset, category, root, kind, bass, degrees, function)): no file
# failed in either reader; 1,992 raw <harmony> elements = 1,926 distinct (position, content) in raw and in this function,
# identical sets except 27 function labels in one file (mxl/9/8 QmR9uamC...: the written U+00B0 degree sign in 'vii°7',
# 'vii°7/V' and 'vii°7/ii' comes out as 'o' ('viio7'): music21's RomanNumeral respells it; the label is the same, the spelling
# is the library's, not patched; every other function label, even 'I764-664', comes back as written). Distinct entries
# (position + content) in both readers: chords 1,633 (219 of them with a slash bass), function labels 217, text labels 73,
# N.C. 3, unresolved 0, hidden 0.
# Duplicates (`duplicates_detail` counts music21 OBJECTS merged into an existing entry, not written elements): 1,427 are
# music21's copy of a staff-less symbol onto the second staff of the same part (other_staff_of_same_part), 58 are the same
# symbol in a second part (other_part; 36 + 22 in two files, which equals the raw difference between elements and distinct
# in those files), 16 are same_staff_twice = 8 symbols written twice in one file (mxl/4/38 Qmeq6Qk...; each shows as 2
# objects because of the staff copy), and raw elements minus raw distinct is 66 = 36 + 22 + 8. So `duplicates_removed`
# overstates the file's own duplicates unless it is read through the detail. The old branch's 4,984 -> 3,619 was the same
# effect on another corpus.
# Conflicts (different symbols at one place, kept): 7 places in 2 files. mxl/17/41 (Guitarra and Cavaquinho parts): the
# two parts disagree (Am6 against Am at bar 7, D7 against D, Am7/G against Am), read in the raw XML; mxl/4/10: Em/G and N.C.
# at bar 13 beat 3. They are reported, not merged, and not resolved.
# Three real files checked by eye against the raw XML (mxl/1/40 slash chords, mxl/15/44 degrees and 9th/sus kinds, mxl/8/30
# bare roots): the first eight symbols of each match (root, alter, kind, text, bass, degrees, bar number), totals 102/35 bass,
# 82/53 degrees, 134 with 87 bare roots.
#
# From my row (adopted): number of symbols, distinct symbols, kinds with the four classes (major, minor, dominant 7th,
# other) plus N.C., slash basses, duplicates removed, symbols per bar, bars, bar list. From ChatGPT's review (adopted):
# root alteration, bass and degrees kept in each symbol; every written kind kept as its own string (`kinds`), the classes
# are only a summary; N.C. kept, not dropped as a parse error; duplicates collapsed only with identical position and
# content; no harmonic-function claim (a function label is reported as typed). Not adopted: any reading of the chord's
# role or "progression" (a separate analysis, ChatGPT: "separate label recognition from progression"), and a per-staff
# split (no corpus symbol names a staff; `staves` still lists where music21 put it).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter
from fractions import Fraction

_NC_TEXT = {"nc", "nochord", "n/c"}
_CLASS = {"major": "major", "minor": "minor", "dominant-seventh": "dominant 7th"}


def _alter(semitones):
    return {0: "", 1: "#", -1: "b", 2: "##", -2: "bb"}.get(semitones, f"{semitones:+d}")


def _name(p):
    return p.name.replace("-", "b")


def _read(cs, m):
    """One ChordSymbol-family object -> dict of what was written, plus its category."""
    kind = cs.chordKind or ""
    text = cs.chordKindStr or ""
    d = {"category": None, "root": None, "kind": kind, "bass": None, "degrees": [], "text": text, "function": None,
         "frame": isinstance(cs, m.tablature.ChordWithFretBoard), "figure": None}
    has_pitches = len(cs.pitches) > 0
    if not has_pitches:
        try:
            fig = cs.romanNumeral.figure  # for a pitchless symbol this is the written <function>; '' when none
        except Exception:  # noqa: BLE001
            fig = ""
        d["function"] = fig or None
    if isinstance(cs, m.harmony.NoChord):
        squashed = "".join(text.lower().replace(".", "").split())
        d["category"] = ("function" if d["function"] else "no_chord" if squashed in _NC_TEXT else "text_label")
        if d["category"] == "function":
            d["text"] = ""  # the "N.C." music21 puts on an empty text is its default, not what was written
        return d
    if not has_pitches:
        d["category"] = "function" if d["function"] else "unresolved"
        return d
    d["category"] = "chord"
    d["root"] = _name(cs.root())
    bass = _name(cs.bass())
    d["bass"] = bass if bass != d["root"] else None
    for x in cs.chordStepModifications:
        d["degrees"].append(f"{x.modType} {_alter(x.interval.semitones if x.interval is not None else 0)}{x.degree}")
    if kind:  # a bare root has no kind; music21's own spelling of it ("Dbpedal") would be wrong to quote
        try:
            d["figure"] = cs.figure.replace("-", "b")
        except Exception:  # noqa: BLE001
            d["figure"] = None
    else:
        d["figure"] = d["root"] + (f"/{d['bass']}" if d["bass"] else "")
    return d


def chord_symbols(score):
    """Chord symbols as written in <harmony>. Returns bars, counts (symbols, chords, no_chord, distinct, kinds, classes,
    slash basses, degrees, frames), duplicates removed, symbols per bar, the list of symbols (bar index + printed number
    + offset in quarters), conflicts, and apart: function labels, text labels, unresolved, hidden."""
    import music21 as m
    groups = {}  # (bar_index, offset, content) -> entry
    order = 0
    n_bars = 0
    dup = Counter()  # why an object was merged into an entry that already existed
    for pi, part in enumerate(score.parts):
        measures = list(part.getElementsByClass(m.stream.Measure))
        n_bars = max(n_bars, len(measures))
        source = part.id.rsplit("-Staff", 1)[0] if isinstance(part, m.stream.PartStaff) else f"part{pi}"
        for bi, meas in enumerate(measures):
            for cs in meas.recurse().getElementsByClass(m.harmony.ChordSymbol):
                d = _read(cs, m)
                off = Fraction(cs.getOffsetInHierarchy(meas)).limit_denominator(10000)
                content = (d["category"], d["root"], d["kind"], d["bass"], tuple(d["degrees"]), d["text"], d["function"])
                key = (bi, off, content)
                shown = not cs.style.hideObjectOnPrint
                if key not in groups:
                    order += 1
                    d.update(bar_index=bi, bar=bar_label(meas), offset=str(off),
                             staves=[], sources=[], printed=shown, _order=order, _off=off)
                    groups[key] = d
                else:
                    dup["same_staff_twice" if pi in groups[key]["staves"] else "other_staff_of_same_part"
                        if source in groups[key]["sources"] else "other_part"] += 1
                e = groups[key]
                e["printed"] = e["printed"] or shown
                if pi not in e["staves"]:
                    e["staves"].append(pi)
                if source not in e["sources"]:
                    e["sources"].append(source)

    entries = sorted(groups.values(), key=lambda e: (e["bar_index"], e["_off"], e["_order"]))
    hidden = [e for e in entries if not e["printed"]]
    shown = [e for e in entries if e["printed"]]
    chords = [e for e in shown if e["category"] == "chord"]
    ncs = [e for e in shown if e["category"] == "no_chord"]
    marks = sorted(chords + ncs, key=lambda e: (e["bar_index"], e["_off"], e["_order"]))
    at = {}
    for e in marks:
        at.setdefault((e["bar_index"], e["_off"]), []).append(e)
    conflicts = [{"bar_index": k[0], "bar": v[0]["bar"], "offset": str(k[1]), "symbols": [x["figure"] or x["text"] or "N.C." for x in v]}
                 for k, v in sorted(at.items()) if len(v) > 1]
    seq = [(e["category"], e["root"], e["kind"], e["bass"], tuple(e["degrees"])) for e in marks]
    changes = sum(1 for a, b in zip(seq, seq[1:]) if a != b)
    kinds = Counter(e["kind"] or "(none written)" for e in chords)
    classes = Counter(_CLASS.get(e["kind"], "major" if e["kind"] == "" else "other") for e in chords)
    if ncs:
        classes["no chord"] = len(ncs)
    per_bar = Counter(e["bar_index"] for e in marks)
    numbers = {e["bar_index"]: e["bar"] for e in marks}
    distinct = sorted({e["figure"] for e in chords})
    distinct_keys = {(e["root"], e["kind"], e["bass"], tuple(e["degrees"])) for e in chords}

    def clean(e):
        return {k: v for k, v in e.items() if not k.startswith("_")}

    return {
        "bars": n_bars,
        "n": len(marks), "n_chords": len(chords), "n_no_chord": len(ncs),
        "distinct": len(distinct_keys), "distinct_symbols": distinct,
        "kinds": dict(kinds), "classes": dict(classes),
        "slash_bass": sum(1 for e in chords if e["bass"]),
        "with_degrees": sum(1 for e in chords if e["degrees"]), "degrees": dict(Counter(x for e in chords for x in e["degrees"])),
        "frames": sum(1 for e in chords if e["frame"]), "bare_root": sum(1 for e in chords if e["kind"] == ""),
        "duplicates_removed": sum(dup.values()), "duplicates_detail": dict(dup),
        "bars_with_symbols": len(per_bar), "per_bar": round(len(marks) / n_bars, 3) if n_bars else 0,
        "max_in_bar": max(per_bar.values(), default=0), "changes": changes,
        "bar_list": [{"bar_index": b, "bar": numbers[b], "n": c} for b, c in sorted(per_bar.items())],
        "conflicts": conflicts,
        "symbols": [clean(e) for e in marks],
        "function_labels": [clean(e) for e in shown if e["category"] == "function"],
        "text_labels": [clean(e) for e in shown if e["category"] == "text_label"],
        "unresolved": [clean(e) for e in shown if e["category"] == "unresolved"],
        "n_function_labels": sum(1 for e in shown if e["category"] == "function"),
        "n_text_labels": sum(1 for e in shown if e["category"] == "text_label"),
        "n_unresolved": sum(1 for e in shown if e["category"] == "unresolved"),
        "hidden_not_counted": len(hidden),
    }
