# E31 Repeats, endings and jump marks: the WRITTEN signs only (no expansion, no playing order, no played length).
#
# Chosen implementation: music21 for the repeat barlines (bar.Repeat on a Measure's left/right barline: direction and
# `times`); a small raw read of the first part for three things music21 loses or gets wrong (measured below): the
# volta endings, the jump marks (D.C., D.S., Fine, To Coda, Coda, Segno) and segno/coda written on a barline. music21's
# RepeatBracket and RepeatExpression objects are NOT used. Nothing is expanded: presence and place only, which is what
# my row asks for. From presence nothing is derived about form or played length (ChatGPT's point, adopted).
#
# Reported: repeats (bar index + printed number, side, forward/backward, times); endings (numbers as a list and as
# written, first and last bar, how closed: stop / discontinue / not closed); marks (kind, target, bar, offset, sources,
# printed); counts per kind; flags (forward repeats never closed by a backward one, endings not closed, stops with no
# start, endings with no number). First part only: a barline belongs to the whole system (as E19), and directions are
# read from every staff of the first part and counted once (a mark written on both staves, or a direction with no
# <staff> that music21 copies to both, is one mark). Bar label = the file's own printed <measure number> (so MuseScore's
# "X1" stays "X1"; music21 would give number 1 + suffix "X1"); the bar INDEX (0-based position in the first part) is the
# join key with the other rows.
#
# Probed on hand-made MusicXML (test_e31.py and scratch probes p31a-c.py), music21 10.5:
# - repeat barlines arrive as bar.Repeat on the barline, direction "start" (forward) / "end" (backward), `times` kept;
#   the same repeat comes once per staff (a 2-staff part is two PartStaffs) and once per part: read from score.parts[0].
# - music21 does not read ANY <sound> attribute: dacapo, dalsegno, fine, tocoda, coda, segno vanish (a <sound
#   dacapo="yes"/> with no words becomes an empty TextExpression); a jump is known only if its WORDS match music21's
#   list, and then the whole text must match: "D.C. al Fine", "Fine", "Segno" are found; "D. C. al Fine" is, but
#   "D.C. senza repetizione al Fine", "<i>D.C. al Fine</i>", "D.C. sino al Fine", "Menuet I da capo" are not. "To Coda"
#   and "Coda" both become the one class Coda (the jump and its destination are not told apart).
# - a <segno/> or <coda/> written inside a <barline> is dropped (direction-type segno/coda are kept).
# - endings: RepeatBracket is wrong when an ending is not closed (probe: a start with no stop gives no bracket; start
#   1, start 2, stop 2 gives ONE bracket numbered 2 from the first bar to the end of the second); a stop with no start
#   gives a bracket numbered 0; a missing number attribute becomes number 1 (invented). number "1, 2" becomes [1, 2],
#   "1." becomes 1, discontinue is handled like stop.
#
# Measured on our 842 files (scratch p31scan.py raw counts, p31m21.py music21 on parts[0] with its parse cache,
# p31cmp.py, p31end.py; the final run p31run.py re-parses every file, 71 s on this machine with 3 processes):
# - Repeat barlines: 652 forward and 961 backward in 298 files; music21 equals the raw barlines (bar, side, direction,
#   times) in all 842 files, including the 11 `times` attributes in 7 files. Used as is. Repeat barlines are identical on every
#   part in 832 files; the 10 others differ in the list of signs, see "Not done on purpose".
# - Endings: 563 starts in 101 files (numbers 1 and 2 only; no ending without a number); 9 starts have no stop or
#   discontinue before the next start, in 4 files (mxl/1/29 jS9Mf9CY, 14/24 sSLBthdj, 3/56 mnCwLpda, 9/41 ZmyPBAxU: the
#   encoder left a stop out). music21 gives 554 brackets and in those 4 files WRONG ones: e.g. 9/41 bar index 137 is
#   an ending 2 with no stop, and music21 makes it an ending "1" running from index 137 to 237 (the next ending 1), and
#   then loses that ending 1; 1/29 index 2 (ending 1) is lost and ending 2 is made to run from index 2 to 5. The
#   endings are therefore read raw and paired here: a start is closed by the next stop/discontinue with the same
#   number; a start met while another is open leaves the open one "not closed"; no span is invented for it.
# - Jump marks: <sound> attributes in the first part: fine 35 (28 files), dacapo 34 (27), dalsegno 7 (7), tocoda 4 (4),
#   coda 6 (6), segno 7 (6): music21 sees none of them. Result: 99 marks in 42 files (da_capo 38, fine 35, coda 8, segno
#   7, dal_segno 7, to_coda 4); music21 (RepeatExpression objects from the words and symbols) has 83 of the 99 at the
#   right bar and 16 are missing in 14 files; it has no mark that we lack; its class Coda stands for both the 8 coda and
#   the 4 to_coda marks. 93 marks have a <sound> attribute, 6 are written as words only. Their words are, in my regexes below, what the files write: "Fine" (34), "D.C. al Fine" (19+), "D.C."
#   (4), "To Coda" (4), "D.S. al Coda" (4), "D.S." (2), "D. C. al Fine", "<i>D.C. al Fine</i>", "D.C. sino al Fine",
#   "D.C. senza repetizione al Fine", "<font ...></font>D.C.", "Menuetto da Capo al Fine.", "Menuet I da capo", "Thema da
#   capo", "Allegretto da capo", "da capo Trio". Texts that contain the same words and are NOT jumps and are not marked:
#   "poco a poco accelerando al fine", "sempre stretto sin al fine", "Ped a chaque mesure al fine." (al fine alone is
#   not a mark), "play repeat signs after D.C." (an instruction about a D.C.: more than two words before it), song
#   verses, notes to the reader. segno/coda symbols: 6 files each, both as <segno/>/<coda/> in a direction; barline
#   segno/coda: none in our files (the patch is for the standard, tested by hand-made cases only).
# Whole-corpus check against an independent plain count (scratch p31check.py, 842 files, 0 differences): forward 652 and
# backward 961 repeats equal a plain count of <repeat direction> in every file; ending starts 563 = endings reported,
# starts' number texts equal, stops + discontinues = closed endings + orphan stops (0 orphans), 9 not closed; the
# (bar, kind) set of <sound> jump attributes equals the marks that name "sound" as a source in every file; segno/coda
# symbols (13) likewise; music21's first-part measure count equals the raw measure count in every file (so the bar
# index is the same in both). The word rule's accepted texts were read (20 distinct, all genuine jumps) and so were
# the 9 texts with jump words it rejected (tempo words "... al fine", the D.C. instruction sentence, verse and
# prose): none is a jump. That word check uses the function's own word rule, so it cannot show a jump written in
# words outside the list (a text with none of D.C./D.S./da capo/dal segno/fine/coda/segno): none was looked for. 7 files have a forward repeat not closed by a later backward one (flagged, e.g. repeat to the end of the piece).
# Directions are read with _raw.directions(root, "direction") (time position inside the bar), whole <direction> by
# <direction>, so the words, symbol and <sound> of one direction merge into ONE mark whose `sources` say which of
# "words", "symbol", "sound", "barline" wrote it. A mark found only by words is marked so: the row's pitfall "jumps
# written only as words". `printed` is False when the direction has print-object="no".
#
# From my row (adopted): barline repeat direction, endings with numbers and bars, segno/coda, <sound> attributes plus
# words, "second reader" music21 (used as the reader for repeats; for endings and jumps it is the reader that loses
# marks). From ChatGPT (adopted): element type, printed bar, number(s), unpaired/malformed flags, exact token
# boundaries for D.C./D.S./Fine, targets al Fine / al Coda, titles and prose do not count (the words must be a whole
# direction text of at most two words before the jump phrase), presence is not form and not played length. Not adopted:
# music21 Expander (expansion belongs to a later row; the old branch found it right on 27 of 81 disputed files).
#
# Not done on purpose: <sound> that is a direct child of <measure> (0 in our files); jump marks on parts after the
# first (10 files have later parts with different sign lists; in all 10 the later part has fewer signs than the first, except mxl/14/55 whose later part
# has only lyric words; I read 3 of the 10 (14/55, 12/11, 15/5), the first part held every jump mark there; the other 7 were compared by count only); "1-3" style ending ranges (the numbers are the
# integers found in the text, the text is kept).
import re
from fractions import Fraction

from _raw import directions, raw_root

SOUND_KIND = {"dacapo": "da_capo", "dalsegno": "dal_segno", "fine": "fine", "tocoda": "to_coda", "coda": "coda",
              "segno": "segno"}
_MARKUP = re.compile(r"<[^>]*>")
_DC = re.compile(r"(?<![a-z])(?:d\.\s?c\.?|dc|da\s+capo)(?![a-z])")
_DS = re.compile(r"(?<![a-z])(?:d\.\s?s\.?|ds|dal\s+segno)(?![a-z])")
_AL_FINE = re.compile(r"(?<![a-z])(?:sino|sin|fino)?\s*al\s+fine(?![a-z])")
_AL_CODA = re.compile(r"(?<![a-z])al\s+coda(?![a-z])")


def word_kind(text):
    """(kind, target) of a direction's words, or None. Closed list on the text with markup removed, lower-cased and
    spaces folded: Fine (the whole text), To Coda / Al Coda, Coda and Segno (the whole text), and D.C. / D.S. (the
    phrase may follow at most two other words: a section name such as "Menuet I da capo"), with the target al Fine or
    al Coda when written."""
    t = re.sub(r"\s+", " ", _MARKUP.sub("", text or "")).strip().lower()
    t = t.strip(" .,;:!()[]")
    if not t:
        return None
    if t == "fine":
        return "fine", None
    if t in ("coda", "the coda"):
        return "coda", None
    if t in ("to coda", "al coda", "to the coda"):
        return "to_coda", None
    if t == "segno":
        return "segno", None
    for kind, rx in (("da_capo", _DC), ("dal_segno", _DS)):
        mo = rx.search(t)
        if mo and len(t[:mo.start()].split()) <= 2:
            rest = t[mo.end():]
            target = "fine" if _AL_FINE.search(rest) else "coda" if _AL_CODA.search(rest) else None
            return kind, target
    return None


def _ints(text):
    return [int(x) for x in re.findall(r"\d+", text or "")]


def repeats_and_jumps(score, path):
    """Repeat barlines, endings and jump marks as written, in the first part. See the comment at the top."""
    import music21 as m
    root = raw_root(path)
    first = next(root.iter("part"), None)
    raw_measures = first.findall("measure") if first is not None else []
    labels = [x.get("number") for x in raw_measures]

    def where(i):
        return {"bar_index": i, "bar": labels[i] if i < len(labels) else None}

    # 1. repeat barlines: music21, first part
    repeats = []
    if len(score.parts):
        for i, meas in enumerate(score.parts[0].getElementsByClass(m.stream.Measure)):
            for side, attr in (("left", "leftBarline"), ("right", "rightBarline")):
                b = getattr(meas, attr)
                if isinstance(b, m.bar.Repeat):
                    repeats.append({**where(i), "side": side, "direction": "forward" if b.direction == "start" else "backward",
                                    "times": b.times})
    # a forward repeat is "closed" by a backward one before the next forward one
    unclosed_forward, cur = [], None
    for r in repeats:
        if r["direction"] == "forward":
            if cur is not None:
                unclosed_forward.append(cur)
            cur = r
        elif cur is not None:
            cur = None
    if cur is not None:
        unclosed_forward.append(cur)

    # 2. endings and barline segno/coda: raw, first part, document order
    endings, orphan_stops, open_, marks = [], [], None, {}
    for i, meas in enumerate(raw_measures):
        for b in meas.findall("barline"):
            side = b.get("location") or "right"
            for tag in ("segno", "coda"):
                if b.find(tag) is not None:
                    mk = marks.setdefault((i, side, tag), {"kind": tag, "target": None, **where(i), "offset": None,
                                                           "side": side, "sources": [], "printed": True})
                    if "barline" not in mk["sources"]:
                        mk["sources"].append("barline")
            for e in b.findall("ending"):
                typ, num = e.get("type"), e.get("number")
                if typ == "start":
                    if open_ is not None:
                        endings.append({**open_, "end_type": None, "closed": False})
                    open_ = {"numbers": _ints(num), "text": num, "first": i, "side": side}
                elif typ in ("stop", "discontinue"):
                    if open_ is not None and (open_["text"] or "").strip() == (num or "").strip():
                        endings.append({**open_, "last": i, "end_type": typ, "closed": True})
                        open_ = None
                    else:
                        orphan_stops.append({**where(i), "numbers": _ints(num), "type": typ})
    if open_ is not None:
        endings.append({**open_, "end_type": None, "closed": False})
    out_endings = []
    for e in endings:
        d = {"numbers": e["numbers"], "text": e["text"], "first_bar_index": e["first"],
             "first_bar": labels[e["first"]], "closed": e["closed"], "end_type": e["end_type"]}
        if e["closed"]:
            d.update(last_bar_index=e["last"], last_bar=labels[e["last"]])
        else:
            d.update(last_bar_index=None, last_bar=None)
        out_endings.append(d)
    out_endings.sort(key=lambda d: d["first_bar_index"])

    # 3. jump marks from the directions: words + symbol + sound of one direction merge
    for pi, mi, _, off, d in directions(root, "direction"):
        if pi != 0:
            continue
        found = {}  # kind -> (target, sources)
        for dt in d.findall("direction-type"):
            for w in dt.findall("words"):
                wk = word_kind("".join(w.itertext()))
                if wk:
                    found.setdefault(wk[0], [wk[1], []])
                    found[wk[0]][1].append("words")
                    found[wk[0]][0] = found[wk[0]][0] or wk[1]
            for tag in ("segno", "coda"):
                if dt.find(tag) is not None:
                    found.setdefault(tag, [None, []])[1].append("symbol")
        for s in d.findall("sound"):
            for attr, kind in SOUND_KIND.items():
                v = s.get(attr)
                if v is not None and v.strip().lower() != "no":
                    found.setdefault(kind, [None, []])[1].append("sound")
        hidden = d.get("print-object") == "no"
        for kind, (target, sources) in found.items():
            key = (mi, off, kind)
            mk = marks.setdefault(key, {"kind": kind, "target": target, **where(mi), "offset": str(off), "side": None,
                                        "sources": [], "printed": not hidden})
            mk["target"] = mk["target"] or target
            mk["printed"] = mk["printed"] or not hidden
            for s in sources:
                if s not in mk["sources"]:
                    mk["sources"].append(s)
    out_marks = sorted(marks.values(), key=lambda k: (k["bar_index"], k["offset"] or "", k["kind"]))
    for k in out_marks:
        k["sources"] = sorted(k["sources"])

    kinds = {}
    for k in out_marks:
        kinds[k["kind"]] = kinds.get(k["kind"], 0) + 1
    return {
        "has_repeats": bool(repeats), "has_endings": bool(out_endings), "has_jump_marks": bool(out_marks),
        "forward": sum(r["direction"] == "forward" for r in repeats),
        "backward": sum(r["direction"] == "backward" for r in repeats),
        "repeats": repeats, "endings": out_endings, "marks": out_marks, "mark_counts": kinds,
        "flags": {"forward_repeats_not_closed": [{"bar_index": r["bar_index"], "bar": r["bar"]} for r in unclosed_forward],
                  "endings_not_closed": sum(not e["closed"] for e in out_endings),
                  "orphan_ending_stops": orphan_stops,
                  "endings_without_number": sum(not e["numbers"] for e in out_endings),
                  "marks_from_words_only": sum(k["sources"] == ["words"] for k in out_marks)},
    }

