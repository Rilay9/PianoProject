# E30 Slash notation.
#
# Chosen implementation: music21 for the slash NOTEHEADS (note.notehead == "slash", chord members individually), plus
# one small raw read of <measure-style> for the slash / beat-repeat / measure-repeat marks, which music21 cannot see.
# The unit counted is the ATTACK: one printed note or chord object, as in E22; only printed notes count (_notes.py).
#
# Probed on hand-made MusicXML (test_e30.py and the scratch probes p30.py / p30b.py):
# - <notehead>slash</notehead> arrives as notehead "slash" on a Note, and on each member of a Chord separately (a chord
#   can be half slash, half normal: counted as a slash attack and flagged in mixed_chords). Staff 2 works the same.
# - TRAP, look-alikes: "slashed" and "back slashed" are different heads that music21 keeps as their own strings, and
#   "x", "cross", "diamond" are other heads; the test is equality with "slash", never "slash" in the string. "none"
#   (an invisible head) arrives as None.
# - <stem>none</stem> arrives as stemDirection "noStem" (a beat slash: head only); up/down is a stem (a rhythm slash).
#   With no <stem> element it stays "unspecified" (the renderer decides), so stems are reported as none / not none.
# - print-object="no" on the note or on a chord member sets style.hideObjectOnPrint (_notes.py): a hidden slash head
#   is not drawn and is not counted; hidden_slash says how many were left out. Grace notes with a slash head are
#   counted apart (grace_slash). Unpitched notes also carry notehead "slash" (probed) but the project does not treat
#   unpitched notes as notes (_notes.py, E01): they are not in the per-staff counts; unpitched_slash, at the top of
#   each call's result under key 0, says how many there were (0 in our files).
# - The pitch written under a slash head is a placeholder for the renderer (the one real file writes A3 for chord
#   slashes in bar 1 and C4 / D3 for the rhythm bars), so no pitch of a slash note is reported.
# - GAP, music21 loses <measure-style><slash>, <beat-repeat> and <measure-repeat>: its importer has "TODO: slash",
#   "TODO: beat-repeat", "TODO: measure-repeat" (xmlToM21.handleMeasureStyle, which reads only <multiple-rest>); probed
#   with all four forms in a part: no object of any kind comes out. Those marks are read from the raw XML here and
#   nothing else is: part order + the measure-style's staff number map to the staves as E01/E13 map them (no number =
#   every staff of the part). Marks are listed with bar index + printed number, and start/stop pairs are joined with
#   _raw.pair_spans (the span's two ends are given; whether the stop bar is itself slashed is not claimed).
#
# Measured on our 842 candidate files (raw XML, scratch s30_scan.py): slash noteheads 239, in 1 file (mxl/4/38 Qmeq6Qk...,
# the same lead-sheet file as E29's slash chords: 121 on staff 1, 118 on staff 2, all quarters, all <stem>none</stem> (beat
# slashes), all printed, none on rests / chords / grace notes, 0 hidden). Every other notehead in the corpus is "normal" (1,702 notes in 43 files)
# - not even an "x". <measure-style> appears in NONE of the 842 files (not even <multiple-rest>), so the gap patched has
# 0 occurrences here: the raw read is kept because the row's definition names it and a function that answered "0 slash
# bars" for a file with them would be silently wrong, but it is ~25 lines and moves nothing in this corpus. Slash
# notation is very rare in our files: 1 of 842.
# Read in that file (raw XML): bar 1 four A3 slashes on staff 1 (staff 2 a rest) with chord symbols above; bars 6-10,
# 13-18, 21, 33-47 four quarter slashes on each staff (C4 on staff 1, D3 on staff 2); mixed bars (3 slashes plus a real note
# or rest) are bars 12, 20, 32 on staff 1 and 12, 20 on staff 2. The function gives 31 / 30 slash bars, longest run 16 bars.
#
# Whole-corpus run (scratch cmp30.py, all 842 files, 0 errors, results JSON-serialisable) against an independent raw count
# (printed, non-grace, pitched, non-rest notes with notehead slash, a chord counted at its first member; bars = distinct
# (part, bar, staff)): 239 slash attacks in 61 staff-bars in this function and in the raw count, identical; measure-style
# slash / beat-repeat / measure-repeat 0 in both. Files with a hit: that one.
# From my row (adopted): slash noteheads counted, measure-style slash and beat-repeat counted, bars listed. From
# ChatGPT's review (adopted): the three notations are kept apart (slash heads / measure-style slash / beat-repeat and
# measure-repeat are separate counts, a beat-repeat is never counted as a slash head); slash durations (by_type);
# rhythm (stems) vs beat (no stem) slashes (stem_none / stem_not_none); mixed bars (slash and real notes together) are
# separated from full slash bars; unclosed start marks are listed. Not adopted: any claim that a slash means improvised
# comping, a role, or that the student can comp (ChatGPT: "an encoded chart fact"); repetition checks for a beat-repeat
# (no file has one). This reports what is printed, nothing about what is played.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter


def _label(meas):
    return bar_label(meas)


def slash_notation(score, path):
    """Per staff: printed attacks, slash-head attacks (by duration type, stem, mixed chords), full / mixed slash bars,
    longest run of consecutive slash bars, bar list, plus the measure-style marks (slash, beat-repeat, measure-repeat)
    read from the raw XML. Key 0 holds file-wide figures (unpitched slash heads)."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    from _raw import raw_root, pair_spans
    L = layout(score)
    out = {}
    for k, idx in enumerate(L["staves"]):
        attacks = slash = mixed_chords = grace = hidden = stem_none = 0
        by_type, full_bars, mixed_bars, bar_list, bar_idx = Counter(), 0, 0, [], []
        for bi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            n_att = n_sl = 0
            for n, _ in printed(meas, slash=True):  # slash heads are left out of printed() by default
                members = [x for x in (n.notes if n.isChord else [n]) if not x.style.hideObjectOnPrint]
                heads = [x for x in members if x.notehead == "slash"]
                if not heads:
                    if not n.duration.isGrace:
                        n_att += 1
                    continue
                if n.duration.isGrace:
                    grace += 1
                    continue
                n_att += 1
                n_sl += 1
                mixed_chords += len(heads) < len(members)
                by_type[n.duration.type] += 1
                stem_none += n.stemDirection == "noStem"
            for n in meas.recurse().notes:  # slash heads that are not drawn (every member print-object="no")
                if isinstance(n, (m.harmony.ChordSymbol, m.note.Unpitched, m.percussion.PercussionChord)):
                    continue
                mem = n.notes if n.isChord else [n]
                if all(x.style.hideObjectOnPrint for x in mem) and any(x.notehead == "slash" for x in mem):
                    hidden += 1
            attacks += n_att
            slash += n_sl
            if n_sl:
                bar_idx.append(bi)
                bar_list.append({"bar_index": bi, "bar": _label(meas), "n": n_sl})
                if n_sl == n_att:
                    full_bars += 1
                else:
                    mixed_bars += 1
        longest = run = 0
        for i, b in enumerate(bar_idx):
            run = run + 1 if i and b == bar_idx[i - 1] + 1 else 1
            longest = max(longest, run)
        out[k + 1] = {"attacks": attacks, "slash_attacks": slash,
                      "share_slash": round(slash / attacks, 4) if attacks else None,
                      "by_type": dict(by_type), "stem_none": stem_none, "stem_not_none": slash - stem_none,
                      "mixed_chords": mixed_chords, "grace_slash": grace, "hidden_slash": hidden,
                      "bars_with_slash": len(bar_list), "full_slash_bars": full_bars, "mixed_bars": mixed_bars,
                      "longest_run_bars": longest, "bar_list": bar_list,
                      "measure_style": {"slash": 0, "beat-repeat": 0, "measure-repeat": 0}, "style_marks": [],
                      "style_spans": [], "style_unclosed": [], "measure_style_read": True}

    # the raw read: <measure-style> children music21 drops
    raw_parts = list(raw_root(path).iter("part"))
    events, order = [], 0
    if len(raw_parts) == len(L["parts"]):
        staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
        for pi, part in enumerate(raw_parts):
            ids = L["parts"][pi]["staff_indices"]
            meas_music21 = score.parts[ids[0]].getElementsByClass(m.stream.Measure)
            for bi, meas in enumerate(part.findall("measure")):
                for ms in meas.iter("measure-style"):
                    num = ms.get("number")
                    targets = ids if num is None else ids[int(num) - 1:int(num)]
                    for child in ms:
                        if child.tag not in ("slash", "beat-repeat", "measure-repeat") or child.get("type") not in ("start", "stop"):
                            continue
                        label = _label(meas_music21[bi]) if bi < len(meas_music21) else meas.get("number")
                        for t in targets:
                            k = staff_no.get(t)
                            if k is None:
                                continue
                            order += 1
                            mark = {"kind": child.tag, "type": child.get("type"), "bar_index": bi, "bar": label,
                                    "use_stems": child.get("use-stems"), "slashes": child.get("slashes")}
                            out[k]["style_marks"].append(mark)
                            events.append({"key": (k, child.tag), "time": bi, "order": order, "start": child.get("type") == "start",
                                           "mark": mark})
                            if child.get("type") == "start":
                                out[k]["measure_style"][child.tag] += 1
        spans, unclosed, _orphans = pair_spans(events)
        for a, b in spans:
            out[a["key"][0]]["style_spans"].append({"kind": a["key"][1], "start_bar_index": a["mark"]["bar_index"],
                                                    "start_bar": a["mark"]["bar"], "stop_bar_index": b["mark"]["bar_index"],
                                                    "stop_bar": b["mark"]["bar"]})
        for a in unclosed:
            out[a["key"][0]]["style_unclosed"].append({"kind": a["key"][1], "start_bar_index": a["mark"]["bar_index"],
                                                       "start_bar": a["mark"]["bar"]})
    else:
        for v in out.values():
            v["measure_style_read"] = False

    out[0] = {"unpitched_slash": sum(1 for n in score.recurse().getElementsByClass(m.note.Unpitched) if n.notehead == "slash")}
    return out
