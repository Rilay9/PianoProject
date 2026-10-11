# E47 Hand marks: the printed hand instructions, and the notes written on the other staff of their part.
#
# Purpose: the per-staff rows treat staff as hand (upper staff = right hand, lower = left). This row says where that is
# false in the score itself. It never infers a hand from pitch, register or clef; it reports only what is written
# (a printed hand word, the <staff> and <voice> a note carries) and where the staff convention is contradicted.
#
# Chosen implementation: music21 for the hand WORDS (every <words> arrives as expressions.TextExpression with its text,
# bar, offset and, through the PartStaff it sits in, its staff; the same reading as E26), the shared E01 layout for the
# staff-to-part grouping, and _raw.bar_label for the printed bar number. ONE small raw read for a measured music21 gap:
# the <voice> of a note. music21 turns a MusicXML staff-measure into Voice objects ONLY when that staff-measure holds two
# or more voices; with one voice the notes sit directly in the Measure and the voice number is gone (probed on the
# measured cases: 127 bar 7 staff 2 has Voices '1' and '5', bar 24 staff 1 has 5 notes and no Voice at all; 124 bar 18
# staff 2 has 2 notes and no Voice; the same in 134 bar 70 and 135 bar 49). A note that is "voice 1 written on the
# lower staff" cannot be told apart from an ordinary lower-staff note without that number, so the cross-staff part reads
# (voice, staff, onset, duration) of every pitched note straight from the XML with the same time cursor as
# _raw.directions. Notes themselves (pitch, count per staff) are not taken from here; the notes counted here are
# cross-checked in the corpus run against music21's per-staff note counts (see the numbers at the end of this comment).
#
# THE HAND WORDS (closed vocabulary, whole tokens, case-blind, accent-blind, punctuation ignored, so "m.g." = "m g"):
#   left   m.g. / m.s. / mg / ms, l.h. / lh, left hand, linke(n) Hand, linkerhand, main gauche, mano sinistra, mano izquierda
#   right  m.d. / md,  r.h. / rh, right hand, rechte(n) Hand, rechterhand, main droite, mano destra, mano derecha
# Any other text is not read here (E26 keeps the other words). One entry per hand token, so "m.d. e m.g." gives two.
# A hand word split over two <words> ("m." + "g.") is not joined (not measured in our files; see the corpus numbers).
# Where the mark sits: `staff` is the staff number in the part that carries the TextExpression ("all" when a direction
# without <staff> was imported into every staff of the part, music21's behaviour, same as E25/E26; then the staves are
# merged by (bar, offset, text) so the word is counted once).
#
# WHAT THE SCORE SHOWS ABOUT SCOPE: MusicXML has no extent for a hand word. So nothing is claimed about how many notes a
# mark governs EXCEPT this structural fact, which is what the measured cases show: when a mark is written for a staff
# (explicit <staff>) and that staff holds no pitched note in the mark's bar, the run of bars from there until that staff
# holds a note again is `staff_empty_run`, and the notes written on the part's other staff(s) in those bars are listed
# (staff, voices, count). Case 132 (m.g. on the lower staff in bar 5; the lower staff is empty in bars 5-6 and the
# left-hand notes are voice 2 on the upper staff). Which voice is the hand is not decided: the voices are listed. A mark
# whose staff does hold notes in its bar has `governed` = None (UNKNOWN: the scope is not written).
# `against_staff_order` = True when a RIGHT-hand word is written on the lower staff of a two-staff part, or a LEFT-hand
# word on the upper staff (the staff the direction is attached to); None when the mark is on all staves, or the part has
# not two staves.
#
# CROSS-STAFF NOTES: in a part with two or more staves, a voice number that ordinarily lives on one staff ("home staff")
# but is written on another staff in some bar. Per part and voice: the staves of its pitched notes are counted over the
# whole piece; the home staff is the staff with the most notes (a tie means no home: the voice is `ambiguous`). A voice is
# also `ambiguous` (and never flagged) when in any bar its notes on two staves OVERLAP in time: then the number is reused
# for separate lines on each staff (the Finale/Sibelius habit of voice 1 on both staves), not one line moving between
# staves. Otherwise every bar in which that voice has notes on a non-home staff gives one entry: bar index, printed bar,
# voice, home staff, staff written on, number of notes there, and `whole_bar` = the voice has no note on its home staff in
# that bar (127 bars 7-8, the voice written wholly on the other staff) against partly (124 bars 18-21, 127 bar 24, 134
# bar 70, 135 bar 49, the line crossing). Nothing here says which hand plays them.
# Grace notes count as notes of their voice (they are in the voice's line); cue notes and unpitched notes are left out.
# Raw part order is taken to match music21's parts (E01 grouping); if the counts differ the cross-staff part is UNKNOWN.
#
# Not adopted: any hand inference from pitch or register (the owner's rule and the brief); joining split words;
# <lyric> or credit text; reading the extent of a bracket or dashes line as the hand's extent.
import os
import re
import sys
import unicodedata
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _raw import bar_label, raw_root  # noqa: E402

LEFT = [("m", "g"), ("m", "s"), ("mg",), ("ms",), ("l", "h"), ("lh",), ("left", "hand"), ("linke", "hand"),
        ("linken", "hand"), ("linke", "hande"), ("linkerhand",), ("linker", "hand"), ("main", "gauche"),
        ("mano", "sinistra"), ("mano", "izquierda")]
RIGHT = [("m", "d"), ("md",), ("r", "h"), ("rh",), ("right", "hand"), ("rechte", "hand"), ("rechten", "hand"),
         ("rechte", "hande"), ("rechterhand",), ("rechter", "hand"), ("main", "droite"), ("mano", "destra"),
         ("mano", "derecha")]
_PHRASES = sorted([(p, "left") for p in LEFT] + [(p, "right") for p in RIGHT], key=lambda x: -len(x[0]))


def _norm(text):
    t = unicodedata.normalize("NFKC", text or "").lower()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", t).split()


def hand_words(text):
    """[(hand, phrase)] for one text, in reading order: whole tokens only ('rhythm' and 'm.m.' never match)."""
    toks = _norm(text)
    out, i = [], 0
    while i < len(toks):
        for ph, hand in _PHRASES:
            if tuple(toks[i:i + len(ph)]) == ph:
                out.append((hand, " ".join(ph)))
                i += len(ph)
                break
        else:
            i += 1
    return out


def _q(s):
    return Fraction(s.strip()) if s and s.strip() else Fraction(0)


def raw_notes(root):
    """Pitched notes of every raw <part>: {part, mi, voice, staff, onset, end} with the MusicXML time cursor (a note that
    is not a <chord/> member moves it by its <duration>, <backup> back, <forward> on). Cue and unpitched notes are left out
    of the list (cue notes still move the cursor). Positions in quarters."""
    notes, nstaves = [], {}
    for pi, part in enumerate(root.iter("part")):
        div = Fraction(1)
        for mi, meas in enumerate(part.findall("measure")):
            pos = Fraction(0)
            last_start = Fraction(0)
            for el in meas:
                if el.tag == "attributes":
                    if el.findtext("divisions"):
                        div = _q(el.findtext("divisions")) or Fraction(1)
                    if el.findtext("staves"):
                        nstaves[pi] = int(el.findtext("staves"))
                elif el.tag == "note":
                    d = _q(el.findtext("duration")) / div
                    chord = el.find("chord") is not None
                    grace = el.find("grace") is not None
                    start = last_start if chord else pos
                    if el.find("pitch") is not None and el.find("cue") is None:
                        notes.append({"part": pi, "mi": mi, "voice": el.findtext("voice") or "1",
                                      "staff": int(el.findtext("staff") or 1), "onset": start,
                                      "end": start + (Fraction(0) if grace else d)})
                    if not chord:
                        last_start = pos
                        if not grace:
                            pos += d
                elif el.tag == "backup":
                    pos -= _q(el.findtext("duration")) / div
                elif el.tag == "forward":
                    pos += _q(el.findtext("duration")) / div
    return notes, nstaves


def _overlap(a, b):
    """Two note spans overlap in time (touching is not overlap; two zero-length grace spans overlap when equal)."""
    if a["onset"] == a["end"] or b["onset"] == b["end"]:
        return a["onset"] == b["onset"] and a["onset"] == a["end"] == b["end"] == b["onset"]
    return a["onset"] < b["end"] and b["onset"] < a["end"]


def cross_staff(notes):
    """(entries, ambiguous voices) over the pitched notes of ONE raw part."""
    by_voice = {}
    for n in notes:
        by_voice.setdefault(n["voice"], []).append(n)
    entries, ambiguous = [], []
    for v, ns in sorted(by_voice.items()):
        staves = sorted({n["staff"] for n in ns})
        if len(staves) < 2:
            continue
        per_bar = {}
        for n in ns:
            per_bar.setdefault(n["mi"], {}).setdefault(n["staff"], []).append(n)
        counts = {s: sum(1 for n in ns if n["staff"] == s) for s in staves}
        top = max(counts.values())
        winners = [s for s, c in counts.items() if c == top]
        reused = any(_overlap(a, b) for bar in per_bar.values() if len(bar) > 1
                     for sa in bar for sb in bar if sa < sb for a in bar[sa] for b in bar[sb])
        if len(winners) != 1 or reused:
            ambiguous.append({"voice": v, "staves": staves, "reason": "tie" if len(winners) != 1 else "overlap in a bar",
                              "counts": counts})
            continue
        home = winners[0]
        for mi, bar in sorted(per_bar.items()):
            away = [s for s in bar if s != home]
            if not away:
                continue
            for s in sorted(away):
                entries.append({"bar_index": mi, "voice": v, "home_staff": home, "written_on_staff": s,
                                "notes": len(bar[s]), "whole_bar": home not in bar})
    return entries, ambiguous


def hand_marks(score, path):
    """Hand words (with staff, bar index and printed bar) and cross-staff notes. `score` is the music21 Score, `path` the
    file (read for the voice of each note, the measured music21 gap). See the top comment."""
    import music21 as m
    from e01_layout import layout
    lay = layout(score)
    root = raw_root(path)
    notes, nstaves = raw_notes(root)
    by_part = {}
    for n in notes:
        by_part.setdefault(n["part"], []).append(n)
    n_raw_parts = len(list(root.iter("part")))
    aligned = n_raw_parts == len(lay["parts"])
    marks = []
    for k, pt in enumerate(lay["parts"]):
        sidx = pt["staff_indices"]
        n_staves = len(sidx)
        found = {}  # (bar_index, offset, text) -> {"bar", "staves"}
        for si in sidx:
            st = score.parts[si]
            num = int(st.id.rsplit("-Staff", 1)[1]) if isinstance(st, m.stream.PartStaff) and "-Staff" in st.id else 1
            for mi, meas in enumerate(st.getElementsByClass(m.stream.Measure)):
                for x in meas.recurse().getElementsByClass(m.expressions.TextExpression):
                    text = " ".join((x.content or "").split())
                    if not hand_words(text):
                        continue
                    off = Fraction(x.getOffsetInHierarchy(meas)).limit_denominator(10000)
                    e = found.setdefault((mi, off, text), {"bar": bar_label(meas), "staves": []})
                    if num not in e["staves"]:
                        e["staves"].append(num)
        ms0 = list(score.parts[sidx[0]].getElementsByClass(m.stream.Measure))
        # which staves hold pitched notes in which bars (raw, same source as the cross-staff part)
        held = {}
        if aligned:
            for n in by_part.get(k, []):
                held.setdefault(n["mi"], {}).setdefault(n["staff"], []).append(n)
        for (mi, off, text), e in sorted(found.items(), key=lambda kv: (kv[0][0], kv[0][1], kv[0][2])):
            st_list = sorted(e["staves"])
            all_staves = n_staves > 1 and len(st_list) == n_staves
            staff = "all" if all_staves else st_list[0] if len(st_list) == 1 else st_list
            for hand, phrase in hand_words(text):
                opp = None
                if n_staves == 2 and staff in (1, 2):
                    opp = (hand == "right" and staff == 2) or (hand == "left" and staff == 1)
                run, governed = [], None
                if aligned and isinstance(staff, int) and n_staves > 1:
                    j = mi
                    while held.get(j) and staff not in held[j]:
                        run.append(j)
                        j += 1
                    if run:
                        other = {}
                        for j in run:
                            for s, ns in held[j].items():
                                o = other.setdefault(s, {"voices": set(), "notes": 0})
                                o["voices"] |= {n["voice"] for n in ns}
                                o["notes"] += len(ns)
                        governed = {"basis": "staff_empty_run", "staff_empty": staff,
                                    "other_staves": {s: {"voices": sorted(o["voices"]), "notes": o["notes"]}
                                                     for s, o in sorted(other.items())}}
                marks.append({"part": k, "bar_index": mi, "bar": e["bar"], "offset": str(off), "text": text,
                              "hand": hand, "phrase": phrase, "staff": staff, "against_staff_order": opp,
                              "staff_empty_run": run,
                              "staff_empty_run_bars": [bar_label(ms0[j]) for j in run if j < len(ms0)],
                              "governed": governed})
    cross, ambiguous, labels = [], [], {}
    if aligned:
        for k, pt in enumerate(lay["parts"]):
            if len(pt["staff_indices"]) < 2 and nstaves.get(k, 1) < 2:
                continue
            ents, amb = cross_staff(by_part.get(k, []))
            first = score.parts[pt["staff_indices"][0]]
            ms = list(first.getElementsByClass(m.stream.Measure))
            for ent in ents:
                ent["part"] = k
                ent["bar"] = bar_label(ms[ent["bar_index"]]) if ent["bar_index"] < len(ms) else None
                cross.append(ent)
            ambiguous += [{**a, "part": k} for a in amb]
    cross.sort(key=lambda e: (e["bar_index"], e["part"], e["voice"], e["written_on_staff"]))
    marks.sort(key=lambda e: (e["bar_index"], Fraction(e["offset"])))
    by_hand = {}
    for x in marks:
        by_hand[x["hand"]] = by_hand.get(x["hand"], 0) + 1
    out = {"marks": marks, "n_marks": len(marks), "by_hand": by_hand,
           "n_against_staff_order": sum(1 for x in marks if x["against_staff_order"]),
           "cross_staff": cross, "cross_staff_bars": sorted({(e["bar_index"], e["part"]) for e in cross}),
           "n_cross_staff_entries": len(cross), "n_cross_staff_notes": sum(e["notes"] for e in cross),
           "ambiguous_voices": ambiguous}
    out["cross_staff_bars"] = [list(b) for b in out["cross_staff_bars"]]
    if not aligned:
        out["cross_staff_status"] = f"UNKNOWN: {n_raw_parts} raw parts against {len(lay['parts'])} music21 parts"
    return out
