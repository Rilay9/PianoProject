# E23 Slurs.
#
# Chosen implementation: slur marks read from the file, paired by time, notes from music21. music21's Slur spanner is
# NOT used. The file is walked once with the MusicXML time cursor (the same cursor as _raw.directions, which yields only
# <direction> elements, so it is repeated here for <note>) to get every <slur> mark with its bar, time, staff, voice and
# number. Marks are paired per part in TIME order by `number`; when a stop finds several open starts with its number,
# it takes the one in its own staff and voice, then its own voice, then its own staff, then the latest. Which notes
# count, and how many lie under a slur, come from music21: _notes.printed attacks (a chord = one attack, grace notes
# are not attacks) of the start note's staff, from the start to the stop note inclusive. Locations are bar index +
# printed number; counts are per start staff (1..n of e01_layout).
#
# Why not music21 alone. Probed on hand-made MusicXML (test_e23.py and scratch probes): a Slur holds only its first and
# last note; the number becomes idLocal and a stop is matched to the first INCOMPLETE slur with that number in DOCUMENT
# order within the part. Right: plain, unnumbered, nested (1/2), number reused, across a barline, type="continue",
# grace-note ends, an end on a rest, tied or same-pitch ends, a start on a print-object="no" note (kept; the flag is
# not). Wrong, five ways: (1) a stop written earlier in the file than its start (cross-staff, start on staff 2 written
# after the staff 1 stop) gives a one-note slur and the start vanishes; (2) a note written <start/><stop/> in that order
# merges the next slur into the old one (the <stop/><start/> order is fine); (3) a mark on every member of a chord adds a
# one-note slur; (4) the same number open twice at once (two voices, two staves) across a barline is merged; (5) a
# start never closed vanishes without a trace and a stop with no start becomes a complete one-note slur.
# Measured on our 842 files (raw marks counted from the XML, scratch s23_*.py, Pool(3)): 510 files have slurs, 38,486
# start and 38,491 stop marks (6 type="continue" in 1 file). Numbers are not unique in a part: 307 files use one number
# on more than one staff, and 236 files had 5,619 stops that met several open starts. Pairing by (part, number) in time
# order alone leaves 4,680 starts unclosed (and 4,685 stops without a start); by (part, staff, number) 1,152 (1,157); staff first,
# then part, 58 (63); the ranked rule above 7 and 12, in 7 files (below). music21 against this function, (start, stop) pairs by bar and time:
# 37,798 of 38,479 identical; 42 files differ, 681 pairs; music21 makes 260 one-note fragments (251 of them in 39 of
# those 42 files).
#
# Read in the raw XML, who was right. mxl/16/21 QmYgtP... (87 fragments): voice 6 of staff 2 writes <start n=1> at beat
# 1, the stops of the same number are written earlier in the bar (staff 1 voice 2 and staff 2 voice 5, at beat 1.5);
# music21 pairs the start with a stop in the NEXT bar (m2@0 -> m3@1.5) and leaves m2's own stops for earlier starts;
# time order pairs m2@0 -> m2@1.5, and the start in m1 (staff 1, C5) with the staff 1 stop. This function is right. The
# same pattern in mxl/4/7 Qme8Dz... (8 fragments), mxl/15/6 QmX7Fq... (84), Clair de Lune (musetrainer; music21 has
# m39@3 -> m60@3/2, 21 bars), and build/pieces/shelf/einsame-blumen-op-82-no-3 (m47: start staff 1 voice 2 at beat 1,
# stop staff 1 voice 1 at beat 2.5, which this function pairs; music21 stretches it to m49 over a start of staff 2).
# music21 was RIGHT in mxl/2/21 Qmcgj..., where two number-1 slurs run at once in a bar: a voice-1 line crossing to
# staff 2 (start staff 1 voice 1, stop staff 2 voice 1) and a voice-5 slur on staff 2. My first rule (own staff before
# own voice) swapped their ends; own voice first fixed it. In two more files (QmUjQcdgg..., QmYjdUU...) the
# "differences" are only my comparison: the file's times are off by up to 1/60 of a quarter from music21's offsets
# (their <backup>/<duration> values do not add up); the pairing is the same.
# Marks left over after pairing (7 starts, 12 stops, 7 files; reported, never given an invented end): innocence-op-100-
# no-5 (a start in m7, stops in both volta endings, m8 and m9: the second stop has no start in time order), QmX7Fq (6
# starts in the last two bars, never stopped), Chopin Etudes op. 25 No. 4 (a start in m1 never stopped), QmQ69p (a stop at the start of m25 whose
# start was closed in m23, and similar stops in m29-m35) and 3 more files not read. A slur across a volta is NOT patched.
# A mark may be written twice on one note (two slurs end there): kept (QmX7Fq m162). Only repeats on <chord/> members
# are merged. An earlier version merged by time and key and joined a run of grace notes (QmVHCi8 m89); dropped.
# Time: the file's cursor and music21's offsets agree exactly for 74,718 of 74,749 slur marks on printed non-grace notes
# and differ by up to 1/24 of a quarter for the other 31: a slur end is moved to the nearest attack of its staff within
# 1/16 (_snap). ends_not_located (an end on a printed note with no attack in reach) is 0 in all 842 files.
#
# Decisions on the cases the row names. Voice: a slur's notes are those of the voice of its start note and of its stop
# note (they differ in 1,287 slurs in 109 files), in a bar that holds several voices; a bar with one voice counts all
# its notes (music21 gives such a bar no Voice objects). My row said "all notes of the staff between start and stop":
# that was run on all 510 files and adds 17,069 notes (191,624 -> 208,693, of 531,390 attacks in those files); 304
# files change, the largest staff goes from 122 to 350 of 389 attacks, because accompaniment voices that carry no slur
# would count as slurred. Cross-staff (672 slurs, 91 files): counted at the start staff, notes of that staff only,
# flagged. Hidden: a slur with either end on a print-object="no" note is not printed and not counted (166 slurs, 27
# files; not_printed). An end on a rest (143 slurs, 24 files) is counted and flagged (ends_on_rest). Same pitch: a slur
# between two consecutive attacks of one voice with the same pitches and no tie between them is listed as
# possible_tie (313 slurs, 71 files); NOT asserted to be a tie (ChatGPT: a repeated-note slur exists). Read: QmRUGz m19,
# the last chord F4 Bb4 Eb5 carries slurs 1, 2, 3 (one per note) to the same chord at the start of m20, no <tie>: ties
# written as slurs. Chord slurs written one per member with different numbers count as that many slurs, as written.
# notes_under is the union (nothing counted twice); avg_notes_per_slur is the mean of each slur's own count, ends included.
#
# Checks. test_e23.py: found / not found / the row's same-pitch fool, one case per gap above; the planted bug (time order
# replaced by document order) fails 2 cases. Whole corpus (842 files, no error, no UNKNOWN): this function's starts and
# stops per file equal an independent raw count (chord repeats merged by largest multiplicity; scratch s23_corpus.py)
# in all 842 files (38,486 and 38,491); printed attacks, 747,754, are the same total as E22's. Notes under, recomputed
# from the raw XML (raw time cursor, own voice rule) on 4 real files, equal the function's slurs, notes_under and
# averages in every staff: mxl/16/21 (198 and 204 slurs), mxl/4/7 (99, 148), mxl/0/22 (10, 5), mxl/2/21 (63, 78). That
# check shares the pairing with the function, so it tests the notes side; the pairing was checked by reading the
# files above. Slowest file 18.8 s with its music21 parse (3 workers at once, this machine).
#
# From my row (adopted): per staff the number of slurs, notes under them and their share, the average per slur, bars,
# same-pitch slurs listed apart, dangling starts and stops. Changed: voice-restricted notes under (above). From
# ChatGPT (adopted): pair by number within the part, with staff and voice only to choose between open slurs, never to
# forbid a pair (cross-staff and voice-changing slurs are found: 672 and 1,287); ambiguity reported (ambiguous_stops,
# and ambiguous_no_winner, 7 stops in 6 files, where two open starts ranked alike and the latest was taken); tests with
# overlapping and cross-voice starts and stops; a slur is a written mark, not proof of legato or phrasing. Not adopted:
# a per-slur list of source and target notes (38,479 entries; bars and unpaired marks are listed, and a consumer that
# needs one slur can read it from the file).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from bisect import bisect_left, bisect_right
from fractions import Fraction


EPS = Fraction(1, 100)   # two attacks of one voice are never this close
SNAP = Fraction(1, 16)   # a slur end is moved to the nearest attack of its staff if the file's time is off by up to this


def _find(lst, mi, pos):
    """Index of the attack at bar `mi`, time `pos` (within EPS) in a sorted list of (bar, time), or None."""
    i = bisect_left(lst, (mi, pos - EPS))
    return i if i < len(lst) and lst[i] <= (mi, pos + EPS) else None


def _snap(times, mi, pos):
    """The time of the attack nearest to `pos` in bar `mi` of a sorted list of all (bar, time) of a staff, if it is within
    SNAP; else None. The file's own time cursor and music21's offsets agree exactly for 74,718 of 74,749 slur marks on
    printed notes in our files; the other 31 are off by up to 1/24 of a quarter (files whose <backup>/<duration> values
    do not add up)."""
    i = bisect_left(times, (mi, pos))
    best = None
    for j in (i - 1, i):
        if 0 <= j < len(times) and times[j][0] == mi:
            d = abs(times[j][1] - pos)
            if best is None or d < best[0]:
                best = (d, times[j][1])
    return best[1] if best is not None and best[0] <= SNAP else None


def _fr(x):
    return x if isinstance(x, Fraction) else Fraction(x).limit_denominator(10 ** 6)


def _slur_marks(root):
    """Every <slur> mark in the file, one dict each: part, bar index, time in the bar (quarters), grace, staff (as
    written), voice, number, type, on a rest / on a note that is not printed, document order. A mark repeated on the
    <chord/> members of a chord is one mark (a note carrying the same mark twice keeps both: two slurs end or start there). The time is the
    MusicXML cursor: a note that is not a <chord/> member and not a grace note moves it by its duration, <backup> back,
    <forward> on (the same cursor as _raw.directions, which yields only <direction> elements). A <chord/> member
    takes the time of the note before it."""
    out = []
    for pi, part in enumerate(root.iter("part")):
        div = 1
        for mi, meas in enumerate(part.findall("measure")):
            pos, last = Fraction(0), Fraction(0)
            for el in meas:
                if el.tag == "attributes" and el.findtext("divisions"):
                    div = int(float(el.findtext("divisions")))
                elif el.tag == "note":
                    chord, grace = el.find("chord") is not None, el.find("grace") is not None
                    if not chord:
                        last = pos
                    if not chord:
                        group = {}
                    same, hidden = {}, el.get("print-object") == "no"
                    for sl in el.iter("slur"):
                        kind = (sl.get("number") or "1", sl.get("type"))
                        same[kind] = same.get(kind, -1) + 1
                        if chord and (kind, same[kind]) in group:   # the mark already written on an earlier member
                            group[(kind, same[kind])]["hidden"] &= hidden
                            continue
                        group[(kind, same[kind])] = e = {
                            "part": pi, "mi": mi, "pos": last, "grace": grace, "staff": int(el.findtext("staff") or 1),
                            "voice": el.findtext("voice"), "number": kind[0], "type": kind[1],
                            "rest": el.find("rest") is not None, "hidden": hidden, "order": len(out)}
                        out.append(e)
                    if not chord and not grace and el.findtext("duration"):
                        pos += Fraction(int(float(el.findtext("duration"))), div)
                elif el.tag == "backup":
                    pos -= Fraction(int(float(el.findtext("duration") or 0)), div)
                elif el.tag == "forward":
                    pos += Fraction(int(float(el.findtext("duration") or 0)), div)
    return out


def _pair(marks):
    """Pairs start and stop marks. Per part, in time order (a grace note comes just before the note it is written
    with); a stop closes a start with the same `number`. A stop that finds several open starts with its number takes,
    in this order: the one in its own staff and voice, then its own voice, then its own staff, then the most recent.
    At one time position the stops that close an open slur are taken before the starts (a note that ends one slur and
    starts the next); a stop with nothing open then pairs with a start at its own time, one written before it if any. Returns (spans, unclosed starts,
    orphan stops, the stops that had several open starts as (stop, True if no start ranked above the others))."""
    spans, unclosed, orphans, ambiguous = [], [], [], []
    by_part = {}
    for e in marks:
        if e["type"] in ("start", "stop"):
            by_part.setdefault(e["part"], []).append(e)
    for evs in by_part.values():
        evs.sort(key=lambda e: (e["mi"], e["pos"], -1 if e["grace"] else 0, e["order"]))
        open_ = {}  # number -> open starts, oldest first

        def close(s, same_time=False):
            cand = open_.get(s["number"], [])
            # a stop that waited for starts of its own time position takes first those written before it
            pool = ([c for c in cand if c["order"] < s["order"]] if same_time else cand) or cand
            if not pool:
                return False
            rank = [(c["staff"] == s["staff"] and c["voice"] == s["voice"], c["voice"] == s["voice"], c["staff"] == s["staff"])
                    for c in pool]
            if len(pool) > 1:
                ambiguous.append((s, rank.count(max(rank)) > 1))
            best = max(range(len(pool)), key=lambda k: (rank[k], k))
            spans.append((cand.pop(cand.index(pool[best])), s))
            return True
        i = 0
        while i < len(evs):
            t = (evs[i]["mi"], evs[i]["pos"], evs[i]["grace"])
            j = i
            while j < len(evs) and (evs[j]["mi"], evs[j]["pos"], evs[j]["grace"]) == t:
                j += 1
            group, i = evs[i:j], j
            late = [s for s in group if s["type"] == "stop" and not close(s)]
            for s in group:
                if s["type"] == "start":
                    open_.setdefault(s["number"], []).append(s)
            orphans += [s for s in late if not close(s, same_time=True)]
        for v in open_.values():
            unclosed += v
    return spans, unclosed, orphans, ambiguous


def slurs(score, path):
    """Per staff (keys 1..n, by the staff of the START note): printed attacks, slurs, notes under them (union), their
    share, average notes per slur, cross-staff and voice-changing slurs, slurs ending on a rest, slurs not printed
    (hidden end), same-pitch slurs that may be mis-encoded ties, unclosed starts, orphan stops, ambiguous stops, bars."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    from _raw import raw_root
    L = layout(score)
    root = raw_root(path)
    n_raw_parts = len(list(root.iter("part")))
    if n_raw_parts != len(L["parts"]):
        return {"UNKNOWN": f"{n_raw_parts} parts in the file, {len(L['parts'])} in music21"}
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    part_of = {idx: pi for pi, pt in enumerate(L["parts"]) for idx in pt["staff_indices"]}
    raw_bars = [len(p.findall("measure")) for p in root.iter("part")]
    for idx in L["staves"]:
        n = len(score.parts[idx].getElementsByClass(m.stream.Measure))
        if n != raw_bars[part_of[idx]]:
            return {"UNKNOWN": f"staff {staff_no[idx]}: {n} bars in music21, {raw_bars[part_of[idx]]} in the file"}
    # printed attacks of every staff, from music21: one printed note or chord object (one voice) is one attack;
    # att[staff][voice id, None for a bar that holds a single voice] = [(bar, time, midi set, tie types)] in time order
    att, labels = {}, {}
    for idx in L["staves"]:
        k = staff_no[idx]
        att[k], labels[k] = {}, []
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            labels[k].append(bar_label(meas))
            for n, ps in printed(meas):
                if n.duration.isGrace:
                    continue
                v = n.activeSite.id if isinstance(n.activeSite, m.stream.Voice) else None
                members = n.notes if n.isChord else [n]
                att[k].setdefault(v, []).append((mi, _fr(n.getOffsetInHierarchy(meas)), frozenset(p.midi for p in ps),
                                                 {x.tie.type for x in members if x.tie is not None}))
    keys = {}
    for k in att:
        keys[k] = {}
        for v in att[k]:
            att[k][v].sort(key=lambda a: (a[0], a[1]))
            keys[k][v] = [(a[0], a[1]) for a in att[k][v]]
    times = {k: sorted({key for lst in keys[k].values() for key in lst}) for k in keys}
    # slur marks from the file, mapped to staves
    marks = []
    for e in _slur_marks(root):
        ids = L["parts"][e["part"]]["staff_indices"]
        if e["staff"] - 1 < len(ids) and ids[e["staff"] - 1] in staff_no:
            e["staff"] = staff_no[ids[e["staff"] - 1]]
            marks.append(e)
    spans, unclosed, orphans, ambiguous = _pair(marks)
    out = {k: {"attacks": sum(len(a) for a in att[k].values()), "slurs": 0, "notes_under": 0, "share_under": None,
               "avg_notes_per_slur": None, "cross_staff": 0, "voice_change": 0, "ends_on_rest": 0, "ends_not_located": 0, "not_printed": 0, "ambiguous_stops": 0, "ambiguous_no_winner": 0,
               "possible_tie": [], "unclosed_starts": [], "orphan_stops": [], "bars": []} for k in att}
    cover, total, starts = {k: set() for k in att}, {k: 0 for k in att}, {k: {} for k in att}
    where = lambda e: {"bar_index": e["mi"], "bar": labels[e["staff"]][e["mi"]], "number": e["number"]}  # noqa: E731
    for a, b in spans:
        r = out[a["staff"]]
        if a["hidden"] or b["hidden"]:
            r["not_printed"] += 1
            continue
        r["slurs"] += 1
        r["cross_staff"] += a["staff"] != b["staff"]
        r["voice_change"] += a["voice"] != b["voice"]
        r["ends_on_rest"] += a["rest"] or b["rest"]
        # the time of each end: that of the attack of its staff nearest to the file's time (a rest or a grace note has no
        # attack, its time is taken as written); ends_not_located counts slurs with an end on a printed note and no attack
        # within SNAP
        ta, tb, lost = [], [], False
        for e, dest in ((a, ta), (b, tb)):
            s = None if e["rest"] or e["grace"] else _snap(times[e["staff"]], e["mi"], e["pos"])
            lost |= s is None and not e["rest"] and not e["grace"]
            dest.append(e["pos"] if s is None else s)
        ta, tb = ta[0], tb[0]
        r["ends_not_located"] += lost
        starts[a["staff"]][a["mi"]] = labels[a["staff"]][a["mi"]]
        # notes under: attacks of the start staff, in the voice of the start note or of the stop note (a bar that holds one
        # voice has no voice object: its attacks count), from the start note to the stop note inclusive
        lo = (a["mi"], ta, -1 if a["grace"] else 0)
        hi = (b["mi"], tb, -1 if b["grace"] else 0)
        n = 0
        for v, lst in keys[a["staff"]].items():
            if v is not None and v not in (a["voice"], b["voice"]):
                continue
            i0 = bisect_left(lst, (lo[0], lo[1] - EPS))
            i1 = bisect_right(lst, (hi[0], hi[1] + EPS)) if hi[2] == 0 else bisect_left(lst, (hi[0], hi[1] - EPS))
            n += max(0, i1 - i0)
            cover[a["staff"]].update((v, i) for i in range(i0, i1))
        total[a["staff"]] += n
        # same pitches, consecutive attacks of one voice in one staff, not tied together: a possible mis-encoded tie
        if a["staff"] == b["staff"] and a["voice"] == b["voice"] and not a["grace"] and not b["grace"]:
            for v in (a["voice"], None):
                ia = _find(keys[a["staff"]].get(v, []), a["mi"], ta)
                ib = _find(keys[a["staff"]].get(v, []), b["mi"], tb)
                if ia is not None and ib is not None:
                    pa, pb = att[a["staff"]][v][ia], att[a["staff"]][v][ib]
                    if ib == ia + 1 and pa[2] == pb[2] and not ("start" in pa[3] and "stop" in pb[3]) \
                            and "continue" not in pa[3]:
                        r["possible_tie"].append(where(a))
                    break
    for s, no_winner in ambiguous:
        if not s["hidden"]:
            out[s["staff"]]["ambiguous_stops"] += 1
            out[s["staff"]]["ambiguous_no_winner"] += no_winner
    for e in unclosed:
        if not e["hidden"]:
            out[e["staff"]]["unclosed_starts"].append(where(e))
    for e in orphans:
        if not e["hidden"]:
            out[e["staff"]]["orphan_stops"].append(where(e))
    for k, r in out.items():
        r["notes_under"] = len(cover[k])
        r["share_under"] = round(r["notes_under"] / r["attacks"], 4) if r["attacks"] else None
        r["avg_notes_per_slur"] = round(total[k] / r["slurs"], 2) if r["slurs"] else None
        r["bar_indices"] = sorted(starts[k])
        r["bars"] = [starts[k][i] for i in r["bar_indices"]]
    return out
