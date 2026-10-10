# E24 Pedal marks.
#
# Chosen implementation: the <pedal> directions are read from the file with _raw.directions (time position inside the
# bar, staff as written) and paired per part, staff and `number` in TIME order by a small first-in-first-out pairing kept
# in this file (reason below); the pedal WORDS ("Ped.", "con pedale", "una corda", "tre corde" ...) are read from the same
# directions and matched against a closed list; the staff layout comes from music21 (e01_layout); bar labels are the file's own printed numbers. music21's
# expressions.PedalMark spanner is NOT used for the marks. Reported: events by type; spans (kind, form, first and last
# bar as index + printed number, changes and gaps inside) per staff; starts with no stop; stops with no start; bars under
# pedal (closed spans only) and their share; the words with a kind; hidden marks; parts that carry marks; playback-only
# <sound> pedal values. Pedal marks say what is printed: where a pedal is written, never how a pianist pedals.
#
# Why not music21 PedalMark (probed on hand-made MusicXML in test_e24.py, then measured on our 842 files, scratch
# p24cmp.py / p24why.py): it makes one spanner per start..stop and its ends are the NOTES under the marks, not the marks;
# a "change" becomes a PedalBounce object; a start with no stop is not imported (probe: start,start,stop gives 1
# PedalMark); a stop with nothing open is dropped; stops are paired in DOCUMENT order, not time order; a direction with
# no <staff> in a two-staff part is copied into BOTH staves; a PedalMark has no staff at all. Measured: 11,109 starts in
# 179 files, music21 11,063 PedalMarks: 46 starts lost in 27 files (it never has more). Replaying each of the 27 files'
# marks shows a cause in every one: document order differs from time order (16 files), a start written while another
# is open (16), a start never closed (11); 18 of the 27 lose exactly one start although every start is closed in the
# file - that is my old note "one pedal mark lost per affected file", and it is this, not chance.
# Disputed files, read in the raw XML (who is right):
# - mxl/7/47 QmPUyKD5K...: raw 26 starts and 26 stops, music21 25. Bar 16 writes start@0, stop@end, stop@beat 4, start@beat
#   4 (two voices); in time order that is two marks inside bar 16. music21 pairs by document order and chains
#   16->17, 17->18, 18->19 (probed: spanned notes in bars [16,17], [17,18], [18,19]). Raw is right.
# - mxl/9/11 QmRbY9fx5...: raw 1 start (staff 2, bar 1) and no stop anywhere, music21 0. A mark is printed; it is unclosed.
#   Raw is right that it exists; the unclosed list says it has no end.
# - mxl/0/17 Qmaej71c...: raw 33, music21 32. Printed bar 40 has start@0 (a rest voice), start@1.5 (another voice) and two
#   stops at the end: two overlapping marks. music21 loses one. Raw is right.
# - ASAP Chopin Etudes Op. 25 No. 1: raw 96 starts, music21 81 (15 lost).
# The raw read is therefore only the <pedal> and <words> directions through the shared _raw.directions plus the owning
# <direction> element (staff present? print-object?), not a reader of the file.
#
# Pairing (why it is not _raw.pair_spans): pair_spans keeps ONE open mark per key and calls an earlier open start
# "unclosed" when another start comes. Here that pattern is real and balanced - 190 start-start and 185 stop-stop
# neighbours in 52 files (two voices both carrying the mark, mxl/0/48 Qmavwni... bars 16-17, mxl/1/46 Qmbu31r... bar 38) -
# and pair_spans gives 10,916 spans, 193 unclosed, 189 orphan stops over the 179 files. First-in-first-out (a stop
# closes the OLDEST open start, as music21 does) gives 11,073 spans, 36 unclosed in 11 files, 32 orphan stops: starts -
# stops, which is all the file can tell. At one time position a stop that can close an open start is taken before a start
# (a change written as stop+start); a stop with nothing open and a start at the same time makes an empty span, as in
# pair_spans. Events are sorted by time, not document order: pairing in document order (same code otherwise) differs in
# 4 files (mxl/0/17, 12/21, 5/12, 6/36: 4 spans lost, 4 unclosed, 4 orphans, and the bars under pedal overstated by 12,
# 14 and 10 bars in mxl/0/17, 12/21 and 6/36). Staff is part of the key: part+number only gives 225 start-start and
# 224 stop-stop neighbours, staff 190 and 185. A second pass pairing leftovers ACROSS staves (the ASAP Etudes write starts
# on staff 1, stops on staff 2) was tried and resolved 1 span in 1 file (Etudes Op. 25 No. 5): not kept. ASAP Etudes Op. 25
# No. 1 (96 starts, 86 stops, no line/sign attributes) write a start for every printed "Ped." and no stop where the next
# "Ped." follows: 19 unclosed starts, reported as such and never given an invented end.
# A direction with no <staff> belongs to the only staff of a one-staff part (216 marks in 5 files, all of that kind; the
# files with a second part include a Marimba/Vibraphone one, and parts_with_marks names the parts that carry marks); in a
# part with several staves it would be "unspecified" (ChatGPT: do not invent a staff). No file here has that case; it is
# built in test_e24.py.
# Bar labels are the printed numbers as the file writes them, not music21's: for MuseScore's non-numeric bar numbers
# ("X1", "X2") music21 gives number + suffix like "966X1"; 10 of the 179 files with marks have such bars (mxl/8/26 has
# bar 999 "X1" -> music21 "966X1"). The bar INDEX is the join key with the other rows.
#
# Measured on our 842 files (scratch p24scan.py, raw XML): 179 files have <pedal> marks (the row's 179 of 842), 11,109
# starts and 11,105 stops, only types "start" and "stop" (0 change, continue, sostenuto, resume, discontinue, 0 hidden, 0
# other types; the other types are built in the tests), line=yes in 170 files, no line/sign attribute in 9, sign only in 2,
# a number in 1 file (shelf strange-man-op-68-no-29), marks in more than one part in 6 files.
# Words (reported by this function, closed list below): "una corda" 13 in 9 files, "tre corde"/"tutte le corde"/"3
# Cordes" 12 in 8, "Ped."-type instructions 18 in 15, sostenuto PEDAL ("sost. ped.") 1, damper words ("senza sordino/
# sordini", "con sordina") 3 in 3 files. 3 files have pedal words and no pedal marks; 153 of the 179 files with marks have
# no pedal words. Not reported, by design: "sostenuto" alone is a tempo/expression word (Adagio sostenuto ...), "Pedal de
# dominante" / "en un pedal de dominante" is a pedal POINT in analysis text (mxl/11/26, 11/54), and "developed" contains
# "ped": the list is anchored, not a substring search (9 substring hits left out, all of these kinds). Words come from the
# file, not from music21 TextExpression, which equals them in 30 of the 31 files with a hit and in the 31st (11/54) lists the
# two analysis texts twice because they have no <staff>.
# <sound damper-pedal="yes|no"> is playback, not a printed mark: 4 values in 1 file (shelf hunting-song-op-68-no-7, which also
# has printed marks); reported in playback_only, never counted as pedal.
#
# Whole-corpus check against an independent raw count (scratch p24cmp.py, all 842 files, no failures): per type the
# events equal a plain count of <pedal> elements (start 11,109, stop 11,105) in every file; the multiset of bars holding a
# start (spans' first bars + unclosed starts) equals the plain per-measure count of start elements in every file; closed
# spans + orphan stops = stops in every file; every span's last bar holds a stop; staff counts equal the plain count by
# <staff> except 5 files where the plain count numbers staves inside each part and this function numbers them over the
# score (read by hand, all agree: mxl/1/10, 0/9, 10/47, 11/26, 12/30); no file has more bars under pedal than bars.
#
# From my row (adopted): events by type, spans with bars, share of bars under pedal, sostenuto and soft pedal kept apart
# from sustain (never one "pedal" flag), una corda / tre corde from words, staff "unspecified" when absent in a multi-staff
# part, pedal lines with no stop reported. Not adopted: "music21 PedalMark as the second reader" (it loses what is above;
# the comparison uses an independent raw count instead); "marks on staff 1 apply to the whole piano" is the pitfall, so
# nothing is spread to the other staff. From ChatGPT (adopted): no invented staff or hand; type, number and line/sign form
# kept; sustain, sostenuto and soft pedal apart; an absent mark is not "pedal inappropriate" (has_pedal_marks False says
# only that none is printed); unidentified types counted (unknown_type), words outside the closed list not guessed. Not
# adopted: "encoded depth": MusicXML has no depth on <pedal> (half pedal exists only as <sound damper-pedal="50">, which
# playback_only would show); a separate list of "unidentified pedal words" (nothing in our files needed it).
import re
from collections import Counter, defaultdict
from itertools import groupby

TYPES = ("start", "stop", "change", "continue", "sostenuto", "resume", "discontinue")

# Closed word lists, matched on the text lower-cased with runs of spaces folded. Soft pedal words are searched inside the
# text (they are never part of another phrase here); sustain words must be the WHOLE text (optionally with one or two
# leading modifiers and a trailing "simile"), so analysis text about a pedal point does not match.
_MOD = r"(?:(?:sempre|senpre|con|col|con il|with|mit|avec)\.?\s+){0,2}"
SOFT_ON = re.compile(r"(?<![a-z])(una\s+corda|due\s+corde|u\.\s?c\.)", re.I)
SOFT_OFF = re.compile(r"(?<![a-z0-9])(tre\s+corde|tutte\s+le\s+corde|3\s+cordes?|t\.\s?c\.)", re.I)
SOSTENUTO_PEDAL = re.compile(r"^\W*(sost(enuto)?\.?\s+ped(al|ale|\.)?)\W*$", re.I)
SUSTAIN_OFF = re.compile(r"^\W*(senza|ohne|without|sans)\s+p[eé]d(al|ale|\.)?\W*$", re.I)
SUSTAIN_ON = re.compile(r"^\W*" + _MOD + r"ped(\.|ale|al)?(?![a-zà-ÿ])(\s*(simile|sim\.|a chaque mesure.*|al fine.*))?\W*$", re.I)
DAMPER = re.compile(r"(?<![a-z])(senza|con)\s+sordin[aoie]", re.I)


def word_kind(text):
    """Kind of a pedal word from the closed lists, or None."""
    t = re.sub(r"\s+", " ", text.strip())
    if SOFT_ON.search(t):
        return "soft_pedal_on"
    if SOFT_OFF.search(t):
        return "soft_pedal_off"
    if SOSTENUTO_PEDAL.match(t):
        return "sostenuto_pedal"
    if SUSTAIN_OFF.match(t):
        return "sustain_off"
    if SUSTAIN_ON.match(t):
        return "sustain_on"
    if DAMPER.search(t):
        return "damper_words"
    return None


def _pair(events):
    """First-in-first-out pairing of one key's events (dicts: time, order, type, el). Returns (spans as dicts with
    start, stop, changes, gaps), unclosed starts, orphan stop count, orphan change count."""
    events = sorted(events, key=lambda e: (e["time"], e["order"]))
    open_, spans, orphan_stops, orphan_changes = [], [], 0, 0
    for _, group in groupby(events, key=lambda e: e["time"]):
        same = list(group)
        stops = [e for e in same if e["type"] == "stop"]
        starts = [e for e in same if e["type"] in ("start", "sostenuto")]
        others = [e for e in same if e["type"] in ("change", "discontinue")]
        while open_ and stops:
            sp = open_.pop(0)
            sp["stop"] = stops.pop(0)
            spans.append(sp)
        for e in others:  # a change or gap belongs to the oldest open mark
            if open_:
                open_[0]["changes" if e["type"] == "change" else "gaps"] += 1
            elif e["type"] == "change":
                orphan_changes += 1
        for e in starts:
            open_.append({"start": e, "stop": None, "changes": 0, "gaps": 0})
        while stops:
            if open_:
                sp = open_.pop(0)
                sp["stop"] = stops.pop(0)
                spans.append(sp)
            else:
                stops.pop(0)
                orphan_stops += 1
    return spans, open_, orphan_stops, orphan_changes


def _form(el):
    line, sign = el.get("line") == "yes", el.get("sign") == "yes"
    return "line+symbol" if line and sign else "line" if line else "symbol"


def pedal(score, path):
    """Pedal marks and pedal words per staff, with bars; see the top comment for what each key means."""
    from e01_layout import layout
    from _raw import raw_root, directions
    L = layout(score)
    root = raw_root(path)
    if len(list(root.iter("part"))) != len(L["parts"]):
        return {"UNKNOWN": f"{len(list(root.iter('part')))} parts in the file, {len(L['parts'])} in music21"}
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    measures = [part.findall("measure") for part in root.iter("part")]

    def label(pi, mi):
        """The bar's printed number as the file writes it (music21 turns MuseScore's "X1" into "966X1")."""
        return measures[pi][mi].get("number") if mi < len(measures[pi]) else None

    def where(pi, st, has_staff):
        """Staff number (1..n over the score), 'unspecified', or None when the staff is not a pitched piano staff."""
        ids = L["parts"][pi]["staff_indices"]
        if not has_staff and len(ids) > 1:
            return "unspecified"
        return staff_no.get(ids[st - 1]) if st - 1 < len(ids) else None

    owner = {}
    for tag in ("pedal", "words"):
        for d in root.iter("direction"):
            for x in d.iter(tag):
                owner[x] = d
    keys = [k for k in staff_no.values()] + ["unspecified"]
    per = {k: {"events": Counter(), "forms": Counter(), "spans": [], "unclosed": [], "orphan_stops": 0, "orphan_changes": 0}
           for k in keys}
    by_key, hidden, unknown, ignored = defaultdict(list), 0, 0, 0
    for order, (pi, mi, st, pos, el) in enumerate(directions(root, "pedal")):
        d = owner[el]
        typ = el.get("type")
        if d.get("print-object") == "no" or el.get("print-object") == "no":
            hidden += 1
            continue
        w = where(pi, st, d.find("staff") is not None)
        if w is None:
            ignored += 1
            continue
        if typ not in TYPES:
            unknown += 1
            continue
        per[w]["events"][typ] += 1
        by_key[(pi, w, el.get("number") or "1")].append({"time": (mi, pos), "order": order, "type": typ, "el": el})
    covered = {"sustain": set(), "sostenuto": set()}
    for (pi, w, _), evs in by_key.items():
        spans, unclosed, o_stops, o_changes = _pair(evs)
        p = per[w]
        p["orphan_stops"] += o_stops
        p["orphan_changes"] += o_changes
        for u in unclosed:
            e = u["start"]
            p["unclosed"].append({"kind": "sostenuto" if e["type"] == "sostenuto" else "sustain", "form": _form(e["el"]),
                                  "bar_index": e["time"][0], "bar": label(pi, e["time"][0])})
        for s in spans:
            a, b = s["start"], s["stop"]
            m0, (m1, p1) = a["time"][0], b["time"]
            kind = "sostenuto" if a["type"] == "sostenuto" else "sustain"
            p["forms"][_form(a["el"])] += 1
            p["spans"].append({"kind": kind, "form": _form(a["el"]), "first_bar_index": m0, "first_bar": label(pi, m0),
                               "last_bar_index": m1, "last_bar": label(pi, m1), "changes": s["changes"], "gaps": s["gaps"]})
            # bars with the pedal down for some time: a stop on the downbeat of a later bar does not cover that bar
            covered[kind].update(range(m0, m1 + (0 if p1 == 0 and m1 > m0 else 1)))
    for p in per.values():
        p["spans"].sort(key=lambda s: s["first_bar_index"])
        p["unclosed"].sort(key=lambda s: s["bar_index"])
        p["events"] = dict(p["events"])
        p["forms"] = dict(p["forms"])
    n_bars = max((len(ms) for pi, ms in enumerate(measures) if L["parts"][pi]["staff_indices"]), default=0)
    marks = sum(c for p in per.values() for t, c in p["events"].items() if t in ("start", "sostenuto"))
    words, by_kind = [], Counter()
    for pi, mi, st, pos, el in directions(root, "words"):
        d = owner[el]
        kind = word_kind(el.text or "")
        if kind is None or d.get("print-object") == "no":
            continue
        words.append({"text": " ".join((el.text or "").split()), "kind": kind, "bar_index": mi, "bar": label(pi, mi),
                      "staff": where(pi, st, d.find("staff") is not None)})
        by_kind[kind] += 1
    playback = Counter(f"{a}={s.get(a)}" for s in root.iter("sound") for a in ("damper-pedal", "soft-pedal", "sostenuto-pedal")
                       if s.get(a) is not None)
    named = sorted({L["parts"][pi]["name"] for (pi, _, _) in by_key})
    return {"staves": per, "marks": marks, "parts_with_marks": named, "has_pedal_marks": marks > 0,
            "bars": n_bars, "bars_under_pedal": {k: len(v) for k, v in covered.items()},
            "share_bars_under_pedal": {k: round(len(v) / n_bars, 4) if n_bars else None for k, v in covered.items()},
            "words": words, "words_by_kind": dict(by_kind), "hidden_marks": hidden, "unknown_type": unknown,
            "ignored_not_on_pitched_staff": ignored, "playback_only": dict(playback)}
