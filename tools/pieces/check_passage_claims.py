"""Checks ChatGPT's step-3 passage records (bundle entries 121-135) against the score, using only our existing
characteristic rows (tools/pieces/characteristics, E01-E46). It builds no lessons and adds no category list.

Per passage record it
  1. cuts the bundle's MusicXML to the passage's bars (a copy with the attributes in force carried into the first bar),
     parses the cut with music21 and runs the rows on it; some rows are also run on each bar alone (E11 values, E12
     dotted figures, E19 fermatas, E21 hairpins and words, E25/E26 tempo words, E36 chords, E39 intervals) because they
     report counts for the whole stretch given; E31 is also run on the whole piece, for a repeat or Fine named outside
     the passage;
  2. splits "what the score shows" (and the title) into statements, each tied to the one row that can decide it
     (note values E11, dotted E12, tuplets E13, grace E14, ornaments E15, dynamics E20, hairpins E21, articulation
     E22, slurs E23, pedal E24, tempo words E25/E26, clefs E03, keys E06, time E09, repeats E31, chords E36, octaves
     E38, scalar/leaping E39, accidentals E07, pickup E10, fermata E19); a statement no row decides is UNCHECKABLE,
     never guessed;
  3. marks each decidable statement TRUE or FALSE with what the row reports, and lists what the rows report in the
     bars that the text does not mention.

Output (build/pieces/passage-claims/): claims.csv (passage_id, bars, claim_text, row, verdict, row_says),
unmentioned.csv (passage_id, bars, row, reported), and, when an answer key is given, measure.md.
Staff 1 is the upper and staff 2 the lower staff of the piano part; a staff is not a hand (E01), so a claim about
a hand is judged on the staff that normally carries it and says so.

Rules that set what a word means (fixed in the code, not per passage; the numbers are STRICT_SHARE, LOOSE_SHARE,
SCALAR_SHARE below):
  - a note value with no qualifier is an existence claim (the value occurs on the staff in the bars); 'continuous',
    'even', 'unbroken', 'running', 'throughout' ask for the value to be the main one in 75% of the bars that hold notes;
    'mainly', 'often' in 50%; a position word right before it ('begins with', 'then') drops it back to existence;
  - an 'eighth' does not count the long half of a dotted eighth+16th figure (E12), nor a 'quarter' that of a dotted
    quarter+eighth, so dotted pairs are not 'eighths';
  - 'chord(s)' and 'block chords' need 3 or more notes struck together (E36), 'chordal' 2 or more, 'dyad' / 'double
    notes' exactly 2; 'chord tones' is not a chord;
  - 'scalar', 'scale', 'run' need 60% of the melodic intervals in the bars (E39, within bars) to be 1-2 semitones;
  - 'held' / 'sustained' notes are half notes or longer, or tied, or under a fermata;
  - a bar named once belongs to the nearest mark or word only; 'mN' for a stretch of music means 'from mN on';
  - positive-only (never FALSE, UNCHECKABLE when absent): 'detached'/'separated' (touch can be made without a mark),
    an ornament name not said to be printed (a written-out turn is a pattern, E15), generic 'ornament', and 'legato' /
    'dolce' / 'cantabile' / 'sempre' not said to be printed;
  - never decided by any row: pick-ups as a figure (no row gives the beat a figure starts on), that a theme returns or
    differs, register ('high', 'low'), tonic/harmony, direction of a line, relative speed, 'broken' / 'arpeggiated'
    figures (E16 is only the printed rolled-chord sign).

Usage:  python tools/pieces/check_passage_claims.py PASSAGES.csv [--bundle DIR] [--out DIR] [--jobs N] [--measure]
"""
import argparse
import copy
import csv
import json
import os
import re
import sys
import warnings
import xml.etree.ElementTree as ET
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(HERE, "characteristics"))

ATTR_ORDER = ["divisions", "key", "time", "staves", "part-symbol", "instruments", "clef", "staff-details", "transpose",
              "directive", "measure-style"]
PER_BAR_ROWS = ["E11", "E12", "E19", "E21", "E25", "E26", "E36", "E39"]
# E35 (entropy) is slow and describes nothing a passage statement says; D01/D02 are not row facts about notation.
SKIP_ROWS = {"E35", "D01"}


# --------------------------------------------------------------------------------------------------------------
# 1. cutting and running the rows
# --------------------------------------------------------------------------------------------------------------
def _akey(ch):
    return ch.tag + (ch.get("number") or "") if ch.tag in ("clef", "staff-details") else ch.tag


def cut_musicxml(src, first, last, out):
    """Writes a copy of `src` holding only measure positions first..last (1-based, positions in the first part, which
    equal the printed numbers in these files). Attributes in force before `first` (divisions, key, time, staves, clefs)
    are carried into the first kept bar so the cut stands alone. Nothing else is changed."""
    tree = ET.parse(src)
    root = tree.getroot()
    for part in root.findall("part"):
        state = {}
        for i, meas in enumerate(part.findall("measure"), 1):
            if i >= first:
                break
            for at in meas.findall("attributes"):
                for ch in at:
                    state[_akey(ch)] = ch
        for i, meas in enumerate(list(part.findall("measure")), 1):
            if i < first or i > last:
                part.remove(meas)
                continue
            if i == first:
                kids0 = list(meas)
                at = meas.find("attributes")
                if at is None or kids0.index(at) != 0:
                    at = ET.Element("attributes")
                    meas.insert(0, at)
                have = {_akey(ch) for ch in at}
                for k, ch in state.items():
                    if k not in have:
                        at.append(copy.deepcopy(ch))
                kids = list(at)
                for ch in kids:
                    at.remove(ch)
                kids.sort(key=lambda c: ATTR_ORDER.index(c.tag) if c.tag in ATTR_ORDER else 99)
                for ch in kids:
                    at.append(ch)
    tree.write(out, encoding="utf-8", xml_declaration=True)


def run_rows(path, only=None):
    """Parses `path` with music21 once and runs the rows on it (run_all.ROWS), returning {row id: result or {"ERROR"}}."""
    warnings.filterwarnings("ignore")
    import importlib
    import music21 as m
    from run_all import ROWS, jsonable
    score = m.converter.parse(path)
    out = {}
    for rid, mod, fn, needs_path in ROWS:
        if rid in SKIP_ROWS or (only is not None and rid not in only):
            continue
        try:
            func = getattr(importlib.import_module(mod), fn)
            out[rid] = jsonable(func(score, path) if needs_path else func(score))
        except Exception as e:  # noqa: BLE001
            out[rid] = {"ERROR": f"{type(e).__name__}: {e}"}
    return out


def gather(job):
    """job = (passage_id, score path, first, last, work dir). Returns the rows on the passage, on a one-bar-earlier
    copy for the rows that report changes (E03 clefs, E06 keys, E09 time), and per bar for PER_BAR_ROWS."""
    pid, src, first, last, work = job
    os.makedirs(work, exist_ok=True)
    p = os.path.join(work, f"{pid}.musicxml")
    cut_musicxml(src, first, last, p)
    res = {"rows": run_rows(p)}
    if first > 1:
        pc = os.path.join(work, f"{pid}-ctx.musicxml")
        cut_musicxml(src, first - 1, last, pc)
        res["ctx"] = run_rows(pc, only={"E03", "E06", "E09"})
    else:
        res["ctx"] = {k: res["rows"][k] for k in ("E03", "E06", "E09") if k in res["rows"]}
    res["piece_E31"] = run_rows(src, only={"E31"}).get("E31")
    res["bars"] = {}
    for b in range(first, last + 1):
        pb = os.path.join(work, f"{pid}-b{b}.musicxml")
        cut_musicxml(src, b, b, pb)
        res["bars"][str(b)] = run_rows(pb, only=set(PER_BAR_ROWS))
        os.remove(pb)
    return pid, res


# --------------------------------------------------------------------------------------------------------------
# 2. the passage text: statements and the things each one says
# --------------------------------------------------------------------------------------------------------------
FFFD = "\ufffd"
PROTECT = re.compile(r"\b(?:cresc|dim|dimin|rall|rit|riten|ritard|accel|tr)\.|\bm\.g\.|\bD\.C\.|\bd\.c\.", re.I)


def clean(s):
    s = (s or "").replace("pi" + FFFD, "più").replace(FFFD, "-").replace("\u2013", "-").replace("\u2014", "-")
    s = s.replace("*", "")
    return re.sub(r"\s+", " ", s).strip()


def fold(s):
    return s.lower().replace("ù", "u").replace("è", "e").replace("é", "e")


HAND_RE = [
    (re.compile(r"\b(?:rh|right[- ]hand)\b"), 1),
    (re.compile(r"\bright\b"), 1),
    (re.compile(r"\bleft\b"), 2),
    (re.compile(r"\bupper\b"), 1),
    (re.compile(r"\b(?:melody|tune)\b"), 1),
    (re.compile(r"\b(?:lh|left[- ]hand)\b"), 2),
    (re.compile(r"\blower\b"), 2),
    (re.compile(r"(?<!to )(?<!in )(?<!into )\bbass(?![- ]clef)\b"), 2),
    (re.compile(r"\baccompaniment\b"), 2),
    (re.compile(r"\bboth hands\b"), "both"),
]


def hand_marks(lows, groups):
    """[(group, statement index, position, 1 | 2 | 'both')] for the hand words of a sentence's statements (lower-case
    text), in order. A group is a run of statements about one subject: it ends at ';' and before 'while', 'then',
    'before', 'but', 'though', so a hand named earlier is not carried over them. 'melody' and 'tune' are read as the
    upper staff (a staff is not a hand; row_says says so)."""
    marks = []
    for i, low in enumerate(lows):
        for rx, h in HAND_RE:
            for m in rx.finditer(low):
                marks.append((groups[i], i, m.start(), h))
    return sorted(marks, key=lambda t: (t[1], t[2]))


GAP_BLOCKS = re.compile(r"\b(?:over|above|under|beneath|against|with|by|for|of|to|while|and|then)\b")


def hand_at(marks, grp, idx, pos, end=None, adjacent=False, text=""):
    """The hand word right after the item (within 14 characters with no preposition between: 'tuplet LH groups', but
    not 'semiquavers over sparer bass'), else the nearest one before it in the same statement (a hand named in an earlier statement is not carried: "ending on a firm chord" is not about the LH of the clause before). With
    adjacent=True only a hand word within 16 characters before or 14 after counts (for marks that belong to the whole
    sentence, such as 'with chromatic alterations'). A hand word that only follows later is not taken."""
    if end is not None:
        near = [h for g, i, p, h in marks if g == grp and i == idx and end <= p <= end + 14 and not GAP_BLOCKS.search(text[end:p])]
        if near:
            return near[0]
    if adjacent:
        close = [h for g, i, p, h in marks if g == grp and i == idx and pos - 16 <= p < pos]
        return close[-1] if close else None
    before = [(i, p, h) for g, i, p, h in marks if g == grp and i == idx and p < pos]
    if not before:
        return None
    i, p, h = before[-1]
    # 'melody returns above chord supports': inside one statement, 'above/over/under/beneath' between a hand word and the
    # item puts the item with the other staff
    if i == idx and h in (1, 2) and re.search(r"\b(?:above|over|under|beneath|below|against)\b", text[p:pos]):
        return 3 - h
    return h


def bar_refs(seg_lc):
    """[(start, end, lo, hi)] bar references in a statement: 'm4-8', 'm28', 'XML m28'."""
    refs = []
    for m in re.finditer(r"(?<![a-z])m(\d+)\s*-\s*(?:m)?(\d+)", seg_lc):
        refs.append((m.start(), m.end(), int(m.group(1)), int(m.group(2))))
    taken = [(a, b) for a, b, _, _ in refs]
    for m in re.finditer(r"(?<![a-z.])m(\d+)(?!\d)", seg_lc):
        if not any(a <= m.start() < b for a, b in taken):
            refs.append((m.start(), m.end(), int(m.group(1)), int(m.group(1))))
    return sorted(refs)


def nearest_ref(refs, pos):
    return min(refs, key=lambda r: min(abs(pos - r[0]), abs(pos - r[1]))) if refs else None


STRICT = re.compile(r"\b(?:continuous\w*|unbroken|even|evenly|steady|steadily|constant|consecutive|uninterrupted|regular|"
                    r"running|throughout|ostinato|all the|each bar|every bar|per bar|in each)\b")
LOOSE = re.compile(r"\b(?:mainly|mostly|often|many|frequent\w*|largely|almost always|most)\b")
POSITION = re.compile(r"\b(?:begin\w*|first|open\w*|start\w*|then|later|return\w*|final|clos\w+|end\w*|next|after|"
                      r"before|alternat\w+|occasional\w*|some|sometimes|briefly|gives? way)\b")


def normalise_values(s):
    """Spelling of note values to one form (on lower-case text): 16th, eighth, quarter ..."""
    s = re.sub(r"\bsemiquavers?\b|\bsixteenths?\b|\b16ths?\b", "16th", s)
    s = re.sub(r"\bdemisemiquavers?\b|\bthirty-seconds?\b|\b32nds?\b", "32nd", s)
    s = re.sub(r"\beight(?:h)?[- ]notes?\b|\beighths?\b|\bquavers?\b", "eighth", s)
    s = re.sub(r"\bcrotchets?\b", "quarter", s)
    return s


class Item:
    """One thing a statement says, tied to a topic (and so to a row): topic, label, bar scope (lo, hi) or None, the
    hand it is about (1 upper staff, 2 lower staff, 'both', None), an event bar (a single named bar) and parameters."""

    def __init__(self, topic, label, scope=None, hand=None, event_bar=None, **params):
        self.topic, self.label, self.scope, self.hand, self.event_bar, self.params = topic, label, scope, hand, event_bar, params


DYN_RE = re.compile(r"(?<![\w.])(ppp|pp|p|mp|mf|ff|fff|f|sfz|sf|fz|fp|rf)(?![\w.])")
DYN_WORDS = [("fortissimo", "ff"), ("pianissimo", "pp"), ("mezzo-forte", "mf"), ("forte", "f"), ("piano", "p"),
             ("sforzando", "sf")]
PRINTED = ["un poco adagio", "andante con espressione", "con espressione", "con allegrezza", "con spirito", "allegro vivace",
           "dolce lusingando", "lusingando", "più lento", "piu lento", "in tempo", "a tempo", "poco rit", "poco rall",
           "rallentando", "ritardando", "rall", "riten", "rit", "accel", "allegretto", "allegro", "andante", "adagio", "vivace",
           "spiritoso", "moderato", "presto", "lento", "legato", "dolce", "cantabile", "sempre", "m.g."]
PRINTED_RE = re.compile(r"(?<![a-z])(" + "|".join(re.escape(w) for w in sorted(PRINTED, key=len, reverse=True)) + r")(?![a-z])")
HAIRPIN_RE = re.compile(r"\b(cresc\w*|dimin\w*|dim|decresc\w*|swell\w*|hairpins?)\b")
TIME_RE = re.compile(r"(?<![\d:/])(\d{1,2})/(\d{1,2})(?![\d:/])")
NOTE_NAMES = {"c": 0, "g": 1, "d": 2, "a": 3, "e": 4, "b": 5, "f": -1}


def key_fifths(name, acc):
    f = NOTE_NAMES[name]
    if acc == "flat":
        f -= 7
    elif acc == "sharp":
        f += 7
    return f


def find_items(seg, idx, marks, source="text", grp=0):
    """The Items one statement makes. `seg` as written, `idx` its place in the sentence, `marks` the sentence's hand words."""
    low = normalise_values(seg.lower())
    items = []
    refs = bar_refs(low)
    ev_log = []
    owned = set()  # bar references taken by a mark or word (cresc. m3, a tempo at m26); they do not scope a stretch of music

    def scope_of(pos, event=False, end=None):
        """(scope, event bar). A single 'mN' names an event bar; for a stretch of music it means 'from mN on'; with 'by',
        'until' or 'before' it says nothing about where the music is, so the whole passage is looked at."""
        r = nearest_ref(refs if event else [x for x in refs if x not in owned], pos)
        if r is None:
            return None, None
        a, b, lo, hi = r
        pre = low[max(0, a - 8):a]
        if lo != hi:
            if event:
                owned.add(r)
            return (lo, hi), None
        if event:
            ev_log.append((pos, end if end is not None else pos + 1))
            return None, lo
        if re.search(r"\b(?:by|until|before|to)\s*$", pre):
            return None, None
        return (lo, None), lo

    def hand(pos, end=None, adjacent=False):
        return hand_at(marks, grp, idx, pos, end, adjacent, low)

    claimed = []

    def free(a, b):
        return not any(x < b and a < y for x, y in claimed)

    def take(m, item):
        items.append(item)
        claimed.append((m.start(), m.end()))

    for m in TIME_RE.finditer(low):
        sc, ev = scope_of(m.start(), True, m.end())
        take(m, Item("time", f"time signature {m.group(1)}/{m.group(2)}", sc, None, ev, sig=f"{m.group(1)}/{m.group(2)}"))
    for m in re.finditer(r"(?:(treble|bass)\s+clefs?|(?:back )?(?:to|in|into) (treble|bass)(?![- ](?:register|range|note|tone|line|clef))|"
                         r"\bclefs?\b)", low):
        which = m.group(1) or m.group(2)
        ctx_ = low[max(0, m.start() - 45):m.end() + 25]
        change = bool(re.search(r"switch\w*|shift\w*|chang\w*|moves?|back to|returns?|to (?:treble|bass)|among", ctx_))
        sc, ev = scope_of(m.start(), True, m.end())
        take(m, Item("clef", f"clef {'change' if change else 'state'}" + (f" {which}" if which else ""), sc, hand(m.start(), m.end()), ev,
                     clef=which, change=change))
    for m in re.finditer(r"(?:key signature|key)\b[^.;]{0,25}?(?:chang\w+|moves?)\s+(?:back )?to ((?:one|two|three|four|\d) (?:flats?|sharps?)|[a-g](?:-flat|-sharp)?\b)", low):
        sc, ev = scope_of(m.start(), True, m.end())
        take(m, Item("key", "key change", sc, None, ev, change=True, target=m.group(1)))
    for m in re.finditer(r"\b(one|two|three|four) (flats?|sharps?)\b", low):
        if free(m.start(), m.end()):
            sc, ev = scope_of(m.start(), True, m.end())
            n = {"one": 1, "two": 2, "three": 3, "four": 4}[m.group(1)]
            take(m, Item("key", f"key signature {n} {m.group(2)}", sc, None, ev, change=False, target=m.group(0)))
    for m in re.finditer(r"\b([a-g])(?:-(flat|sharp))? ?(major|minor|signature|area)\b", low):
        if free(m.start(), m.end()):
            take(m, Item("key", f"key {m.group(0)}", None, None, None, change=False, tonic=m.group(1), acc=m.group(2),
                         mode=m.group(3)))
    for m in re.finditer(r"(?<![a-z])(d\.c\.?|da capo|fine|fin)(?![a-z])", low):
        sc, ev = scope_of(m.start(), True, m.end())
        kind = "da_capo" if m.group(1) in ("d.c.", "d.c", "da capo") else "fine"
        take(m, Item("jump", f"{kind} mark", sc, None, ev, kind=kind))
    for m in re.finditer(r"\b(?:(forward|backward|first|closing|final|second)\s+)?(?:repeated\s+barline|repeats?(?!-like))\b", low):
        word = m.group(0)
        sc, ev = scope_of(m.start(), True, m.end())
        d = "forward" if "forward" in word else "backward" if re.search(r"backward|closing|final", word) else None
        take(m, Item("repeat", "repeat sign" + (f" {d}" if d else ""), sc, None, ev, direction=d))
    for m in HAIRPIN_RE.finditer(low):
        w = m.group(1)
        kind = "cresc" if w.startswith("cresc") else "dim" if w.startswith(("dim", "decresc")) else "any"
        sc, ev = scope_of(m.start(), True, m.end())
        take(m, Item("hairpin", w, sc, None, ev, kind=kind))
    for m in PRINTED_RE.finditer(low):
        if free(m.start(), m.end()):
            sc, ev = scope_of(m.start(), True, m.end())
            w = m.group(1)
            take(m, Item("word", f"printed '{w}'", sc, None, ev, word=w,
                         cued=bool(re.search("print|mark|read|ask|explicit|notation", low))))
    for m in DYN_RE.finditer(low):
        if free(m.start(), m.end()):
            sc, ev = scope_of(m.start(), True, m.end())
            take(m, Item("dynamic", f"dynamic {m.group(1)}", sc, None, ev, level=m.group(1)))
    for w, lvl in DYN_WORDS:
        for m in re.finditer(r"\b" + w + r"\b", low):
            if free(m.start(), m.end()):
                sc, ev = scope_of(m.start(), True, m.end())
                take(m, Item("dynamic", f"dynamic {w}", sc, None, ev, level=lvl))
    for m in re.finditer(r"\b(soft(?:ly)?|quiet(?:ly)?|loud(?:ly)?)\b", low):
        sc, ev = scope_of(m.start(), True, m.end())
        items.append(Item("dynlevel", f"'{m.group(1)}'", sc, None, ev, soft=m.group(1).startswith(("soft", "quiet"))))
    for m in re.finditer(r"\bdynamic(?:s| punctuation| changes?)\b", low):
        sc, ev = scope_of(m.start(), True, m.end())
        items.append(Item("dynamic", "dynamic marks", sc, None, ev, level=None))
    for m in re.finditer(r"\bfermatas?\b", low):
        sc, ev = scope_of(m.start(), True, m.end())
        items.append(Item("fermata", "fermata", sc, None, ev))
    # A bar named once belongs to one event only: to the one it follows with 'at/in/near ...' ('dimin. at m90 and p m91'),
    # else the nearest ('cresc. and a rall. in m7' - the bar is the rall.'s). Refs taken by an event do not scope music.
    evs = [it for it in items if it.event_bar is not None]
    if evs and len(evs) == len(ev_log):
        dist = lambda p, r: min(abs(p - r[0]), abs(p - r[1]))  # noqa: E731
        for it, (p, e) in zip(evs, ev_log):
            it.pos, it.end = p, e
        prep = re.compile(r"^\W*(?:at|in|near|around|on|by|of)?\W*$")
        for ref in {nearest_ref(refs, it.pos) for it in evs}:
            before = [o for o in evs if o.end <= ref[0] and ref[0] - o.end <= 8 and prep.match(low[o.end:ref[0]])]
            owner = max(before, key=lambda o: o.end) if before else min(evs, key=lambda o: dist(o.pos, ref))
            owned.add(ref)
            for it in evs:
                if nearest_ref(refs, it.pos) == ref and it is not owner:
                    it.event_bar, it.scope = None, None
    for m in re.finditer(r"\b(accent\w*|strong(?:ly)? marked|hard accents)\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("artic", "accent", sc, hand(m.start(), m.end()), None, group="accent"))
    for m in re.finditer(r"\b(staccato|staccatissimo)\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("artic", "staccato", sc, hand(m.start(), m.end()), None, group="staccato"))
    for m in re.finditer(r"\b(detached|separated)\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("artic", "detached/separated", sc, hand(m.start(), m.end()), None, group="staccato", positive_only=True))
    for m in re.finditer(r"\b(slurs?|slurred|phrase marks?)\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("slur", "slurs", sc, hand(m.start(), m.end()), None))
    for m in re.finditer(r"\bpedal\w*\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("pedal", "pedal", sc, None, None))
    for m in re.finditer(r"\b(trills?|mordents?|turns?|ornament\w*)\b(?! (?:to|into|toward\w*|back|on)\b)", low):
        w = m.group(1)
        kind = "trill" if w.startswith("trill") else "turn" if w.startswith("turn") else "mordent" if w.startswith("mordent") else "any"
        sc, _ = scope_of(m.start())
        items.append(Item("ornament", w, sc, hand(m.start(), m.end(), True), None, kind=kind,
                          cued=bool(re.search("printed|prints|sign|marked", low))))
    for m in re.finditer(r"\b(grace[- ]notes?|acciaccatur\w+|appoggiatur\w+)\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("grace", "grace notes", sc, hand(m.start(), m.end(), True), None))
    for m in re.finditer(r"\b(triplets?|three-note tuplet\w*|3:2|sextuplets?|six-note tuplet\w*|6:4|(?:small )?3 tuplet|tuplets?)\b", low):
        w = m.group(1)
        ratio = "6:4" if w.startswith(("sextuplet", "six", "6:")) else "3:2" if w.startswith(("triplet", "three", "3", "small")) else None
        sc, _ = scope_of(m.start())
        near = low[max(0, m.start() - 40):m.start()] + " " + low[m.end():m.end() + 25]
        items.append(Item("tuplet", f"tuplets {ratio or 'any'}", sc, hand(m.start(), m.end()), None, ratio=ratio,
                          strict=bool(STRICT.search(near)), printed=bool(re.search("printed|prints|bracket", low))))
    for m in re.finditer(r"\bdotted[- ](?:quarter|eighth|half|16th)\b|\bdotted(?:[- ](?:rhythms?|looking|pairs?|figures?|notes?))?\b|\blong-short\b", low):
        txt = m.group(0)
        fig = "quarter_eighth" if "quarter" in txt else "eighth_16th" if "eighth" in txt else None
        sc, _ = scope_of(m.start())
        take(m, Item("dotted", txt, sc, hand(m.start(), m.end()), None, fig=fig))
    for m in re.finditer(r"\b(chromatic\w*|accidentals?|altered|raised)\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("accidental", m.group(0), sc, hand(m.start(), m.end(), True), None))
    for m in re.finditer(r"\boctaves?\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("octave", "octaves", sc, hand(m.start(), m.end()), None))
    for m in re.finditer(r"\b(block[- ]chords?|chords?|triads?)\b(?![- ]?(?:tones?|changes|progressions|symbols))", low):
        sc, _ = scope_of(m.start())
        items.append(Item("chord", "chords of 3+ notes", sc, hand(m.start(), m.end()), None, size=3, top=99))
    for m in re.finditer(r"\bchordal\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("chord", "chordal (2+ notes together)", sc, hand(m.start(), m.end()), None, size=2, top=99))
    for m in re.finditer(r"\b(dyads?|double[- ]notes?|two-note|paired|thirds/sixths)\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("chord", "two-note groups", sc, hand(m.start(), m.end()), None, size=2, top=2))
    for m in re.finditer(r"\b(scalar|scales?|scale-like|stepwise|(?:quick|rapid|fast|unbroken|brief|long|high|16th|ascending|descending)(?:-register)? runs?|runs of)\b", low):
        sc, _ = scope_of(m.start())
        near = low[max(0, m.start() - 20):m.end() + 20]
        vs = re.findall(r"\b(16th|eighth)\b", near)
        items.append(Item("scalar", m.group(0), sc, hand(m.start(), m.end()), None, value=vs[0] if vs else None))
    for m in re.finditer(r"\brests?\b", low):
        sc, _ = scope_of(m.start())
        items.append(Item("rest", "rests", sc, hand(m.start(), m.end()), None))
    for m in re.finditer(r"\bpick-?ups?\b", low):
        items.append(Item("pickup", "pick-up figure", None, hand(m.start(), m.end()), None))
    with_dots = bool(re.search(r"dotted|long-short", low))
    vals = []
    for m in re.finditer(r"(?<![a-z])(dotted[- ])?(whole|half|quarter|eighth|16th|32nd)s?(?:[- ]notes?)?(?![a-z])", low):
        v = m.group(2)
        if m.group(1) or not free(m.start(), m.end()):
            continue
        pre = low[max(0, m.start() - 9):m.start()]
        if v == "half" and re.search(r"(?:first|second|last|other|latter|remaining|closing|next|front|back)\s*$", pre):
            continue
        window = low[max(0, m.start() - 30):m.start()]
        level = "exist"
        if STRICT.search(window) or re.search(r"\bthroughout\b", low[m.end():m.end() + 30]):
            level = "strict"
        elif LOOSE.search(window):
            level = "loose"
        if level != "exist" and POSITION.search(window):
            level = "exist"
        sc, _ = scope_of(m.start())
        it = Item("value", f"{v} notes ({level})", sc, hand(m.start(), m.end()), None, value=v, level=level, with_dots=with_dots, group=(v,))
        items.append(it)
        vals.append((m.start(), m.end(), it))
    # values joined by 'and' / 'or' / '/' ('half and quarter notes', 'sixteenths/eighths') are one set when a share is asked
    joined = re.compile(r"^\s*(?:and|or|/|,)?\s*(?:long\s+|short\s+|the\s+)?$")
    for (a0, a1, ia), (b0, b1, ib) in zip(vals, vals[1:]):
        if joined.match(low[a1:b0]):
            g = tuple(sorted(set(ia.params["group"]) | set(ib.params["group"])))
            for x in vals:
                if set(x[2].params["group"]) & set(g):
                    x[2].params["group"] = g
    for m in re.finditer(r"\b(sustained|held|holds?|long)\b((?:\W+\w+){0,3}?)\W+(notes?|tones?|sonorit\w+|harmon\w+|melody|chords?)\b", low):
        if m.group(1) == "long" and re.search("slur|phrase|run|ascent|scale|line|passage", m.group(2)):
            continue
        sc, _ = scope_of(m.start())
        items.append(Item("value", "long notes (half or longer)", sc, hand(m.start(), m.end()), None, value="long", level="exist",
                          held=m.group(1) in ("sustained", "held", "hold", "holds"), with_dots=with_dots, group=("long",)))
    return items


def statement_items(text, source="text"):
    """[(statement, [Item])] for a passage text, one entry per statement (clause between ';', ',', 'while', 'then',
    'before', 'but', 'though' or a sentence end; abbreviations with a point do not end a sentence). A statement with no
    Item is one no row can decide."""
    t = clean(text)
    prot = PROTECT.sub(lambda m: m.group(0).replace(".", "\x00"), t)
    out = []
    for sent in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", prot):
        sent_raw = sent.replace("\x00", ".")
        segs, groups, g = [], [], 0
        for clause in sent_raw.split(";"):
            g += 1
            for m in re.finditer(r"[^,]+", clause):
                for part in re.split(r"\s+(?=(?:while|then|before|but|though)\b)", m.group(0)):
                    seg = part.strip(" .")
                    if len(re.findall(r"[A-Za-z]", seg)) >= 3:
                        if re.match(r"(?:while|then|before|but|though)\b", seg.lower()):
                            g += 1
                        segs.append(seg)
                        groups.append(g)
        marks = hand_marks([normalise_values(x.lower()) for x in segs], groups)
        for i, seg in enumerate(segs):
            out.append((seg, find_items(seg, i, marks, source, groups[i])))
    return out


# --------------------------------------------------------------------------------------------------------------
# 3. what the rows say about the bars, and the verdicts
# --------------------------------------------------------------------------------------------------------------
TRUE, FALSE, UNCHECK = "TRUE", "FALSE", "UNCHECKABLE"
SOFT = {"pppp", "ppp", "pp", "p"}
LOUD = {"f", "ff", "fff", "ffff"}
ACCENT_DYN = {"sf", "sfz", "sffz", "fz", "rf", "rfz", "sfp", "fp"}
LONG_TYPES = ("whole", "half", "breve")
STRICT_SHARE, LOOSE_SHARE, SCALAR_SHARE = 0.75, 0.5, 0.6  # fixed before the full run; see the module docstring


class Result:
    def __init__(self, verdict, row, says, bars=""):
        self.verdict, self.row, self.says, self.bars = verdict, row, says, bars


def _int(x):
    try:
        return int(re.match(r"\d+", str(x)).group(0))
    except (AttributeError, TypeError):
        return None


def compress(pairs):
    """[(bar, label)] -> '1-4 16th, 5 eighth' (runs of consecutive bars with the same label)."""
    out, i = [], 0
    pairs = list(pairs)
    while i < len(pairs):
        j = i
        while j + 1 < len(pairs) and pairs[j + 1][1] == pairs[i][1] and pairs[j + 1][0] == pairs[j][0] + 1:
            j += 1
        a, b = pairs[i][0], pairs[j][0]
        out.append(f"{a}{'-' + str(b) if b != a else ''} {pairs[i][1]}")
        i = j + 1
    return ", ".join(out)


def bars_str(lo, hi):
    return f"m{lo}" if lo == hi else f"m{lo}-{hi}"


class Facts:
    """The rows' answers for one passage (`g` is gather()'s result), with small helpers; it parses no music."""

    def __init__(self, g, first, last):
        self.first, self.last = first, last
        self.R, self.ctx = g["rows"], g.get("ctx", {})
        self.PB = {int(k): v for k, v in g.get("bars", {}).items()}
        self.piece31 = g.get("piece_E31")
        self.staves = sorted(int(k) for k in self.R.get("E11", {}) if str(k).isdigit()) or [1, 2]

    # ---- scope
    def resolve(self, item):
        """(lo, hi, outside) : bars to look at, clipped to the passage; outside is True when the item names bars the
        passage does not hold."""
        lo, hi, sc = self.first, self.last, item.scope
        if item.event_bar is not None and sc is None:
            lo = hi = item.event_bar
        elif sc is not None:
            a, b = sc
            lo = a if a is not None else self.first
            hi = b if b is not None else self.last
        if hi < self.first or lo > self.last:
            return lo, hi, True
        return max(lo, self.first), min(hi, self.last), False

    def staves_for(self, hand):
        if hand in (1, 2):
            return [hand]
        return list(self.staves)

    # ---- per-bar values (E11, E12)
    def bv(self, b, s, raw=False):
        """For bar b, staff s: written values {type: n} with the long half of a dotted eighth+16th / dotted quarter+eighth
        figure taken out of 'eighth' / 'quarter' (E12), rests, attacks."""
        pb = self.PB.get(b, {})
        e11 = (pb.get("E11") or {}).get(str(s)) or {}
        e12 = (pb.get("E12") or {}).get(str(s)) or {}
        t = dict(e11.get("notes_by_type") or {})
        d8 = e12.get("dotted_eighth_sixteenth", 0) + e12.get("dotted_eighth_sixteenth_then_rest", 0)
        d4 = e12.get("dotted_quarter_eighth", 0) + e12.get("dotted_quarter_eighth_then_rest", 0)
        if raw:
            d8 = d4 = 0
        if d8 and "eighth" in t:
            t["eighth"] = max(0, t["eighth"] - d8)
        if d4 and "quarter" in t:
            t["quarter"] = max(0, t["quarter"] - d4)
        rests = sum((e11.get("rests_by_type") or {}).values()) + (e11.get("whole_bar_rests") or 0)
        if b in self.PB and not (pb.get("E11") or {}):
            rests = 1  # the one-bar run gave no staff at all: a bar with no pitched note, so rests
        return {"t": t, "attacks": sum((e11.get("notes_by_type") or {}).values()), "rests": rests,
                "dotted": e11.get("dotted", 0), "d8": d8, "d4": d4, "long": sum(t.get(x, 0) for x in LONG_TYPES)}

    def main_value(self, b, s):
        x = self.bv(b, s)
        if not x["attacks"]:
            return "rests only" if x["rests"] else "empty"
        order = ["breve", "whole", "half", "quarter", "eighth", "16th", "32nd", "64th"]
        t = {k: v for k, v in x["t"].items() if v}
        if not t:
            return "dotted pairs"
        top = max(t.values())
        name = [k for k in order if t.get(k) == top][-1] if any(t.get(k) == top for k in order) else max(t, key=t.get)
        if x["d8"] or x["d4"]:
            name += "+dotted pairs"
        return name

    # ---- events
    def marks_e20(self):
        ms = (self.R.get("E20") or {}).get("marks") or []
        return sorted(ms, key=lambda x: (x["bar_index"], Fraction(x["offset"])))

    def texts_at(self, b):
        """Direction words at bar b from the one-bar runs of E25 (tempo words) and E26 (changes, other words)."""
        pb = self.PB.get(b, {})
        out = []
        e25, e26 = pb.get("E25") or {}, pb.get("E26") or {}
        out += [w.get("text", "") for w in e25.get("tempo_words", [])]
        out += [c.get("text", "") for c in e26.get("changes", [])]
        out += list((e26.get("other_words") or {}).keys())
        return [fold(x) for x in out]

    def clef_sign(self, code):
        return {"G": "treble", "F": "bass", "C": "c-clef"}.get(str(code).split("/")[0], str(code))


def _staff_label(F, hand):
    return {1: "staff 1 (upper)", 2: "staff 2 (lower)"}.get(hand, "either staff") if hand != "both" else "both staves"


def _hand_note(it):
    return "" if it.hand is None else " [hand read as staff]"


def combine(hand, oks):
    """Verdict over staves: one hand -> that staff; both -> all; none named -> any."""
    return all(oks) if hand == "both" else any(oks)


# ---- note values --------------------------------------------------------------------------------------------
def d_value(F, it):
    v, level = it.params["value"], it.params["level"]
    group = it.params.get("group") or (v,)
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E11", "the bars named are outside the passage cut", bars_str(lo, hi))
    bars = list(range(lo, hi + 1))
    oks, notes = [], []
    held_unsure = False
    for s in F.staves_for(it.hand):
        per = [(b, F.bv(b, s, raw=it.params.get("with_dots", False))) for b in bars]
        one = lambda x, g: x["long"] if g == "long" else x["t"].get(g, 0)  # noqa: E731
        have = [b for b, x in per if one(x, v) > 0]
        nonempty = [b for b, x in per if x["attacks"] > 0]
        dom = [b for b, x in per if x["attacks"] and sum(one(x, g) for g in group) / x["attacks"] >= 0.5]
        if level == "exist":
            ok = bool(have)
        else:
            need = STRICT_SHARE if level == "strict" else LOOSE_SHARE
            ok = bool(nonempty) and len(dom) / len(nonempty) >= need
        if v == "long" and it.params.get("held") and not ok:
            ties = ((F.R.get("E11") or {}).get(str(s)) or {}).get("tie_chains", 0)
            ferm = [b for b in bars if ((F.PB.get(b, {}).get("E19") or {}).get("marks", 0))]
            if ties or ferm:
                ok = True
                have = have or ferm
        oks.append(ok)
        if v == "long" and it.params.get("held") and not ok:
            held_unsure = True
        notes.append(f"staff {s}: {v} in {len(have)} of {len(bars)} bars" +
                     (f", {'+'.join(group)} the main value in {len(dom)} of {len(nonempty)} bars with notes" if level != "exist" else "") +
                     "; main value by bar: " + compress((b, F.main_value(b, s)) for b in bars))
    tag = "" if it.hand is None else f" (claim about {_staff_label(F, it.hand)})"
    ok = combine(it.hand, oks)
    if not ok and held_unsure:
        return Result(UNCHECK, "E11+E12", "'held' / 'sustained' is relative to the notes around it; no half note or longer, tie or fermata in the bars. " + " | ".join(notes), bars_str(lo, hi))
    return Result(TRUE if ok else FALSE, "E11+E12", f"{level}{tag}: " + " | ".join(notes), bars_str(lo, hi))


def d_dotted(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E12", "the bars named are outside the passage cut", bars_str(lo, hi))
    fig = it.params["fig"]
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        hits = []
        for b in range(lo, hi + 1):
            x = F.bv(b, s)
            n = x["d4"] if fig == "quarter_eighth" else x["d8"] if fig == "eighth_16th" else (x["d4"] + x["d8"] or x["dotted"])
            if n:
                hits.append(b)
        oks.append(bool(hits))
        notes.append(f"staff {s}: dotted {fig or 'values'} in bars {compress((b, '') for b in hits) or 'none'}".replace(" ,", ","))
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E12+E11", " | ".join(notes), bars_str(lo, hi))


def d_tuplet(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E13", "the bars named are outside the passage cut", bars_str(lo, hi))
    ratio = it.params["ratio"]
    e13 = F.R.get("E13") or {}
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        r = e13.get(str(s)) or {}
        by = r.get("notes_by_ratio") or {}
        n = sum(c for k, c in by.items() if ratio is None or k == ratio)
        tb = [_int(x) for x in r.get("bars", [])]
        inb = [b for b in tb if b is not None and lo <= b <= hi]
        ok = n > 0 and bool(inb)
        if ok and it.params["strict"]:
            nonempty = [b for b in range(lo, hi + 1) if F.bv(b, s)["attacks"]]
            ok = bool(nonempty) and len(set(inb)) / len(nonempty) >= STRICT_SHARE
        oks.append(ok)
        notes.append(f"staff {s}: tuplet notes by written ratio {by or 'none'}, in {len(set(inb))} of {hi - lo + 1} bars; "
                     f"printed numbers {r.get('printed_numbers', 0)}, brackets {r.get('printed_brackets', 0)}")
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E13", " | ".join(notes), bars_str(lo, hi))


def d_grace(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E14", "the bars named are outside the passage cut", bars_str(lo, hi))
    e14 = F.R.get("E14") or {}
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        r = e14.get(str(s)) or {}
        inb = [b for b in (_int(x) for x in r.get("bars", [])) if b is not None and lo <= b <= hi]
        oks.append(bool(inb))
        notes.append(f"staff {s}: {r.get('n', 0)} grace notes, bars {r.get('bars') or 'none'}")
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E14", " | ".join(notes), bars_str(lo, hi))


def d_ornament(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E15", "the bars named are outside the passage cut", bars_str(lo, hi))
    kind = it.params["kind"]
    e15 = (F.R.get("E15") or {}).get("per_staff") or {}
    e14 = F.R.get("E14") or {}
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        r = e15.get(str(s)) or {}
        by = r.get("by_kind") or {}
        want = [k for k in by if (kind == "any") or kind in k or (kind == "trill" and "shake" in k)]
        inb = [b for b in (_int(x) for x in r.get("bars", [])) if b is not None and lo <= b <= hi]
        g = e14.get(str(s)) or {}
        gin = [b for b in (_int(x) for x in g.get("bars", [])) if b is not None and lo <= b <= hi]
        ok = bool(want) and bool(inb)
        if kind == "any" and gin:
            ok = True
        oks.append(ok)
        notes.append(f"staff {s}: printed ornament signs {by or 'none'} (bars {r.get('bars') or 'none'}), grace notes in bars {g.get('bars') or 'none'}")
    ok = combine(it.hand, oks)
    if not ok and kind != "any" and not it.params.get("cued"):
        return Result(UNCHECK, "E15", "no printed sign, but the statement does not say 'printed'; a written-out ornament is a pattern, not an E15 fact. " + " | ".join(notes), bars_str(lo, hi))
    if not ok and kind == "any":
        return Result(UNCHECK, "E15+E14", "no printed ornament sign or grace note; written-out ornaments are patterns, not an E15 fact. " + " | ".join(notes), bars_str(lo, hi))
    return Result(TRUE if ok else FALSE, "E15", " | ".join(notes), bars_str(lo, hi))


# ---- marks and words ----------------------------------------------------------------------------------------
def _in_force(F, upto_bar):
    """Last ordinary dynamic level marked at or before `upto_bar` inside the passage, or None."""
    last = None
    for m in F.marks_e20():
        b = _int(m["bar"])
        if b is not None and b <= upto_bar and m["value"] not in ACCENT_DYN:
            last = m["value"]
    return last


def d_dynamic(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E20", "the bar named is outside the passage cut", bars_str(lo, hi))
    lvl = it.params["level"]
    marks = [m for m in F.marks_e20() if _int(m["bar"]) is not None and lo <= _int(m["bar"]) <= hi]
    accept = {lvl} | ({"sf", "sfz", "sffz"} if lvl in ("sf", "sfz") else set())
    seen = ", ".join(f"{m['value']}@{m['bar']}" for m in marks) or "none"
    if lvl is None:
        return Result(TRUE if marks else FALSE, "E20", f"dynamic marks in the bars: {seen}", bars_str(lo, hi))
    ok = any(m["value"] in accept for m in marks)
    if not ok and it.event_bar is None and it.scope is None and F.first > 1:
        return Result(UNCHECK, "E20", f"marks in the bars: {seen}; no bar is named and the passage starts at bar {F.first}, so a level in force from before it is not seen", bars_str(lo, hi))
    return Result(TRUE if ok else FALSE, "E20", f"marks in the bars: {seen}", bars_str(lo, hi))


def d_dynlevel(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E20", "the bar named is outside the passage cut", bars_str(lo, hi))
    soft = it.params["soft"]
    marks = [m for m in F.marks_e20() if _int(m["bar"]) is not None and lo <= _int(m["bar"]) <= hi and m["value"] not in ACCENT_DYN]
    levels = [m["value"] for m in marks]
    inforce = _in_force(F, lo - 1) if lo > F.first else None
    if inforce:
        levels = [inforce] + levels
    seen = ", ".join(f"{m['value']}@{m['bar']}" for m in marks) or "none"
    want, other = (SOFT, LOUD) if soft else (LOUD, SOFT)
    if any(x in want for x in levels):
        return Result(TRUE, "E20", f"marks in the bars: {seen}", bars_str(lo, hi))
    if any(x in other for x in levels):
        return Result(FALSE, "E20", f"marks in the bars: {seen}; no {'soft' if soft else 'loud'} level among them", bars_str(lo, hi))
    return Result(UNCHECK, "E20", f"marks in the bars: {seen}; no soft or loud level marked inside the passage (one in force from before is not seen)", bars_str(lo, hi))


def d_hairpin(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E21", "the bar named is outside the passage cut", bars_str(lo, hi))
    kind = it.params["kind"]
    wrx = {"cresc": r"cresc", "dim": r"dim|decresc", "any": r"cresc|dim|decresc"}[kind]
    found = []
    for b in range(lo, hi + 1):
        e = (F.PB.get(b, {}).get("E21")) or {}
        for h in e.get("hairpins", []):
            if kind == "any" or (kind == "cresc" and h["kind"] == "crescendo") or (kind == "dim" and h["kind"] == "diminuendo"):
                found.append((b, f"hairpin {h['kind']}"))
        for u in e.get("unclosed", []):
            if kind == "any" or (kind == "cresc" and u["kind"] == "crescendo") or (kind == "dim" and u["kind"] == "diminuendo"):
                found.append((b, f"hairpin {u['kind']}"))
        for w in e.get("words", []):
            if re.search(wrx, w, re.I):
                found.append((b, f"word '{w}'"))
        for w in F.texts_at(b):
            if re.search(wrx, w, re.I) and not any(x[0] == b and "word" in x[1] for x in found):
                found.append((b, f"word '{w}' (E25/E26)"))
    allfound = ", ".join(f"{x} at {b}" for b, x in found) or "none"
    return Result(TRUE if found else FALSE, "E21", f"{kind} hairpins/words in the bars: {allfound}", bars_str(lo, hi))


def d_word(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E25+E26", "the bar named is outside the passage cut", bars_str(lo, hi))
    w = fold(it.params["word"])
    rx = re.compile(r"(?<![a-z])" + re.escape(w))
    hits = [b for b in range(lo, hi + 1) if any(rx.search(t) for t in F.texts_at(b))]
    alltext = sorted({t for b in range(lo, hi + 1) for t in F.texts_at(b)})
    shown = "; ".join(f"{b}: {t}" for b in range(lo, hi + 1) for t in F.texts_at(b)) or "no direction words"
    if hits:
        return Result(TRUE, "E25+E26", f"found at bar(s) {hits}", bars_str(lo, hi))
    if w == "legato":
        sl = sum(((F.R.get("E23") or {}).get(str(s)) or {}).get("slurs", 0) for s in F.staves)
        if sl:
            return Result(TRUE, "E23", f"no word 'legato', but {sl} slurs in the passage (legato read from the slurs); words: {shown}", bars_str(lo, hi))
    if w in ("legato", "dolce", "cantabile", "sempre") and not it.params["cued"]:
        return Result(UNCHECK, "E25+E26", f"not among the direction words, and the statement does not say it is printed; words: {shown}", bars_str(lo, hi))
    return Result(FALSE, "E25+E26", f"not among the direction words of the bars: {shown}", bars_str(lo, hi))


def d_time(F, it):
    sigs = (F.ctx.get("E09") or {}).get("signatures") or []
    seen = [s["time"] for s in sigs if (_int(s["bar"]) or 0) >= F.first]
    ok = it.params["sig"] in seen
    return Result(TRUE if ok else FALSE, "E09", f"time signatures in the passage: {', '.join(seen) or 'none'}", bars_str(F.first, F.last))


def _clef_timeline(F, s):
    e03 = F.ctx.get("E03") or {}
    ev = [c for c in e03.get("changes", []) if c["staff"] == s and _int(c["bar"]) is not None and _int(c["bar"]) >= F.first]
    return F.clef_sign((e03.get("start") or {}).get(str(s), "UNKNOWN")), ev


def d_clef(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E03", "the bar named is outside the passage cut", bars_str(lo, hi))
    want = it.params["clef"]
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        start, ev = _clef_timeline(F, s)
        if it.params["change"]:
            hit = [c for c in ev if lo <= _int(c["bar"]) <= hi and (want is None or F.clef_sign(c["to"]) == want)]
            oks.append(bool(hit))
            notes.append(f"staff {s}: clef changes in the passage " + ("; ".join(f"bar {c['bar']} to {F.clef_sign(c['to'])}" for c in ev) or "none"))
        else:
            state = start
            for c in ev:
                if _int(c["bar"]) <= lo:
                    state = F.clef_sign(c["to"])
            oks.append(want is None or state == want)
            notes.append(f"staff {s}: clef at bar {lo} is {state}")
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E03", " | ".join(notes), bars_str(lo, hi))


def _fifths_of(F):
    e06 = F.ctx.get("E06") or {}
    start = ((e06.get("start") or {}).get("1") or {}).get("fifths")
    ev = [c for c in e06.get("changes", []) if c["staff"] == 1 and _int(c["bar"]) is not None and _int(c["bar"]) >= F.first]
    return start, ev


def d_key(F, it):
    start, ev = _fifths_of(F)
    p = it.params
    if start is None:
        return Result(UNCHECK, "E06", "no key signature read", bars_str(F.first, F.last))
    lo, hi, out = F.resolve(it)
    seen = f"start {start:+d} fifths" + "".join(f"; bar {c['bar']}: {c['from']['fifths']:+d} to {c['to']['fifths']:+d}" for c in ev)
    nums = {"one": 1, "two": 2, "three": 3, "four": 4}
    tgt = p.get("target")
    if "tonic" in p:
        t, acc = p["tonic"], p.get("acc")
        major = key_fifths(t, acc)
        wanted = {major, major - 3}
        have = {start} | {c["to"]["fifths"] for c in ev}
        ok = bool(wanted & have)
        if not ok and p["mode"] in ("signature", "area") and acc in ("flat", "sharp"):
            flats = ["b", "e", "a", "d", "g", "c", "f"]
            sharps = ["f", "c", "g", "d", "a", "e", "b"]
            for f in have:
                if (acc == "flat" and f < 0 and t in flats[:-f]) or (acc == "sharp" and f > 0 and t in sharps[:f]):
                    ok = True
        return Result(TRUE if ok else FALSE, "E06", f"key signature(s) in the passage: {seen}", bars_str(F.first, F.last))
    if tgt and re.match(r"(one|two|three|four|\d)", tgt):
        n = nums.get(tgt.split()[0]) or int(tgt.split()[0])
        want = -n if "flat" in tgt else n
    else:
        want = key_fifths(tgt[0], "flat" if tgt.endswith("flat") else "sharp" if tgt.endswith("sharp") else None)
    if p.get("change"):
        if out:
            return Result(UNCHECK, "E06", "the bar named is outside the passage cut", bars_str(lo, hi))
        hit = [c for c in ev if lo <= _int(c["bar"]) <= hi and c["to"]["fifths"] == want]
        return Result(TRUE if hit else FALSE, "E06", f"key signature changes in the passage: {seen}", bars_str(lo, hi))
    state = start
    for c in ev:
        if _int(c["bar"]) <= lo:
            state = c["to"]["fifths"]
    return Result(TRUE if state == want else FALSE, "E06", f"key signature in force at bar {lo} is {state:+d}; {seen}", bars_str(lo, hi))


def _e31(F, bar):
    """The E31 result that covers `bar`: the passage cut, or the whole piece for a bar outside it."""
    if bar is not None and not (F.first <= bar <= F.last) and F.piece31:
        return F.piece31, "whole piece"
    return F.R.get("E31") or {}, "passage"


def d_repeat(F, it):
    d = it.params["direction"]
    bar = it.event_bar
    if it.scope is not None:
        lo, hi = it.scope[0] or F.first, it.scope[1] or F.last
    elif bar is not None:
        lo = hi = bar
    else:
        lo, hi = F.first, F.last
    e31, where = _e31(F, bar)
    reps = [r for r in e31.get("repeats", []) if _int(r["bar"]) is not None and lo <= _int(r["bar"]) <= hi and (d is None or r["direction"] == d)]
    seen = ", ".join(f"{r['direction']}@{r['bar']}" for r in e31.get("repeats", [])) or "none"
    return Result(TRUE if reps else FALSE, "E31", f"repeat signs ({where}): {seen}", bars_str(lo, hi))


def d_jump(F, it):
    kind, bar = it.params["kind"], it.event_bar
    if it.scope is not None:
        lo, hi = it.scope[0] or F.first, it.scope[1] or F.last
    elif bar is not None:
        lo = hi = bar
    else:
        lo, hi = F.first, F.last
    e31, where = _e31(F, bar)
    ms = [m for m in e31.get("marks", []) if m["kind"] == kind and _int(m["bar"]) is not None and lo <= _int(m["bar"]) <= hi]
    seen = ", ".join(f"{m['kind']}@{m['bar']}" for m in e31.get("marks", [])) or "none"
    return Result(TRUE if ms else FALSE, "E31", f"jump marks ({where}): {seen}", bars_str(lo, hi))


def d_fermata(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E19", "the bar named is outside the passage cut", bars_str(lo, hi))
    marks = lambda b: ((F.PB.get(b, {}).get("E19") or {}).get("marks", 0) or (F.PB.get(b, {}).get("E19") or {}).get("barline_fermatas"))  # noqa: E731
    placed = [b for b in range(F.first, F.last + 1) if marks(b)]
    total = (F.R.get("E19") or {}).get("marks", 0) or (F.R.get("E19") or {}).get("barline_fermatas")
    note = ""
    if total and not placed:
        # the one-bar runs skip a bar with no pitched note, so a fermata over a rest-only bar is placed there
        rest_only = [b for b in range(F.first, F.last + 1) if b in F.PB and not (F.PB[b].get("E11") or {})]
        placed = rest_only
        note = " (placed on the bar(s) with no pitched note, where the one-bar run cannot read a fermata)"
    hits = [b for b in placed if lo <= b <= hi]
    return Result(TRUE if hits else FALSE, "E19", f"fermatas in bars {hits or 'none'}; whole passage: {total or 0} marks{note}", bars_str(lo, hi))


def d_artic(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E22", "the bars named are outside the passage cut", bars_str(lo, hi))
    grp = {"accent": ("accent", "strong-accent"), "staccato": ("staccato", "staccatissimo")}[it.params["group"]]
    e22 = F.R.get("E22") or {}
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        r = e22.get(str(s)) or {}
        by = r.get("by_kind") or {}
        n = sum(by.get(k, 0) for k in grp)
        inb = [b for b in (_int(x) for x in r.get("bars", [])) if b is not None and lo <= b <= hi]
        oks.append(n > 0 and bool(inb))
        notes.append(f"staff {s}: marks by kind {by or 'none'} (marked bars {r.get('bars') or 'none'})")
    ok = combine(it.hand, oks)
    if not ok and it.params.get("positive_only"):
        return Result(UNCHECK, "E22", "no staccato mark; 'detached' can also be made by rests and touch. " + " | ".join(notes), bars_str(lo, hi))
    return Result(TRUE if ok else FALSE, "E22", " | ".join(notes), bars_str(lo, hi))


def d_slur(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E23", "the bars named are outside the passage cut", bars_str(lo, hi))
    e23 = F.R.get("E23") or {}
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        r = e23.get(str(s)) or {}
        inb = [b for b in (_int(x) for x in r.get("bars", [])) if b is not None and lo <= b <= hi]
        oks.append(r.get("slurs", 0) > 0 and bool(inb))
        notes.append(f"staff {s}: {r.get('slurs', 0)} slurs, {r.get('avg_notes_per_slur')} notes per slur, bars {r.get('bars') or 'none'}")
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E23", " | ".join(notes), bars_str(lo, hi))


def d_pedal(F, it):
    e24 = F.R.get("E24") or {}
    return Result(TRUE if e24.get("marks") else FALSE, "E24", f"pedal marks {e24.get('marks', 0)}", bars_str(F.first, F.last))


# ---- simultaneity, motion --------------------------------------------------------------------------------------
def d_chord(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E36", "the bars named are outside the passage cut", bars_str(lo, hi))
    size = it.params["size"]
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        hit, big = [], 0
        for b in range(lo, hi + 1):
            sizes = (((F.PB.get(b, {}).get("E36") or {}).get(str(s)) or {}).get("per_staff")) or {}
            n = sum(c for k, c in sizes.items() if size <= int(k) <= it.params.get("top", 99))
            big = max([big] + [int(k) for k in sizes])
            if n:
                hit.append(b)
        oks.append(bool(hit))
        notes.append(f"staff {s}: attacks of {size}{'+' if it.params.get('top', 99) > 2 else ''} notes together in bars {compress((b, '') for b in hit) or 'none'}; most notes together {big}")
    ok = combine(it.hand, oks)
    if not ok and it.hand is None:
        return Result(UNCHECK, "E36", "no staff has them alone, but no hand is named and a chord can be shared between the two staves (E36 reads one staff at a time). " + " | ".join(notes), bars_str(lo, hi))
    return Result(TRUE if ok else FALSE, "E36", " | ".join(notes), bars_str(lo, hi))


def d_octave(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E38", "the bars named are outside the passage cut", bars_str(lo, hi))
    e38 = F.R.get("E38") or {}
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        r = e38.get(str(s)) or {}
        inb = [b for b in (_int(x) for x in r.get("bars", [])) if b is not None and lo <= b <= hi]
        oks.append(bool(inb))
        notes.append(f"staff {s}: octave dyads {r.get('octave_dyads', 0)}, octave-span chords {r.get('octave_span_chords', 0)}, bars {r.get('bars') or 'none'}")
    ok = combine(it.hand, oks)
    if not ok and it.hand is None:
        return Result(UNCHECK, "E38", "no staff has octaves alone, but no hand is named and the two hands can play an octave apart on separate staves (E38 reads one staff at a time). " + " | ".join(notes), bars_str(lo, hi))
    return Result(TRUE if ok else FALSE, "E38", " | ".join(notes), bars_str(lo, hi))


def d_scalar(F, it):
    """'Scalar', 'scale', 'run' name a stretch of stepwise motion, not the whole passage: TRUE when at least one bar (with
    4 or more melodic intervals, among the bars with the named value if one is named) has 60% or more of its intervals
    of 1-2 semitones (E39, inside the bar); FALSE when no such bar; UNCHECKABLE when no bar has intervals."""
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E39", "the bars named are outside the passage cut", bars_str(lo, hi))
    v = it.params["value"]
    oks, notes, none = [], [], 0
    for s in F.staves_for(it.hand):
        scalar, judged = [], []
        for b in range(lo, hi + 1):
            if v and not F.bv(b, s)["t"].get(v):
                continue
            h = (((F.PB.get(b, {}).get("E39") or {}).get(str(s)) or {}).get("voice_semitones")) or {}
            n = sum(c for k, c in h.items() if k != "0")
            if n >= 4:
                judged.append(b)
                if (h.get("1", 0) + h.get("2", 0)) / n >= SCALAR_SHARE:
                    scalar.append(b)
        if len(judged) < 2 and not scalar:
            none += 1
            oks.append(False)
            notes.append(f"staff {s}: no bar{' with ' + v if v else ''} has 4 or more melodic intervals")
            continue
        oks.append(bool(scalar))
        notes.append(f"staff {s}: stepwise bars {compress((b, '') for b in scalar) or 'none'} of {len(judged)} bars judged{' with ' + v if v else ''}")
    if none == len(oks):
        return Result(UNCHECK, "E39", " | ".join(notes), bars_str(lo, hi))
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E39", " | ".join(notes), bars_str(lo, hi))


def d_rest(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E11", "the bars named are outside the passage cut", bars_str(lo, hi))
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        bs = [b for b in range(lo, hi + 1) if F.bv(b, s)["rests"]]
        oks.append(bool(bs))
        notes.append(f"staff {s}: rests in bars {compress((b, '') for b in bs) or 'none'}")
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E11", " | ".join(notes), bars_str(lo, hi))


def d_accidental(F, it):
    lo, hi, out = F.resolve(it)
    if out:
        return Result(UNCHECK, "E07", "the bars named are outside the passage cut", bars_str(lo, hi))
    e07 = F.R.get("E07") or {}
    oks, notes = [], []
    for s in F.staves_for(it.hand):
        r = e07.get(str(s)) or {}
        per = r.get("per_bar_index") or {}
        inb = [F.first + int(i) for i, c in per.items() if c and lo <= F.first + int(i) <= hi]
        oks.append(bool(inb))
        notes.append(f"staff {s}: accidentals {r.get('by_kind') or 'none'}, in bars {compress((b, '') for b in sorted(inb)) or 'none'}")
    return Result(TRUE if combine(it.hand, oks) else FALSE, "E07", " | ".join(notes), bars_str(lo, hi))


def d_pickup(F, it):
    return Result(UNCHECK, "E10", "no row reports on which beat a figure starts; E10 tests only whether the first bar is short", bars_str(F.first, F.last))


DECIDERS = {"value": d_value, "dotted": d_dotted, "tuplet": d_tuplet, "grace": d_grace, "ornament": d_ornament,
            "dynamic": d_dynamic, "dynlevel": d_dynlevel, "hairpin": d_hairpin, "word": d_word, "time": d_time,
            "clef": d_clef, "key": d_key, "repeat": d_repeat, "jump": d_jump, "fermata": d_fermata, "artic": d_artic,
            "slur": d_slur, "pedal": d_pedal, "chord": d_chord, "octave": d_octave, "scalar": d_scalar, "rest": d_rest,
            "accidental": d_accidental, "pickup": d_pickup}


def decide(F, it):
    """Result for one Item: the row that decides it, TRUE/FALSE, and what the row reports."""
    try:
        r = DECIDERS[it.topic](F, it)
    except Exception as e:  # noqa: BLE001 - a bug in a decider must not look like a verdict
        return Result(UNCHECK, "", f"decider error {type(e).__name__}: {e}")
    if it.hand in (1, 2) and r.verdict != UNCHECK:
        r.says += " [claim says a hand; judged on the staff that normally carries it]"
    return r


# --------------------------------------------------------------------------------------------------------------
# 4. one passage: claims, unmentioned, and the run
# --------------------------------------------------------------------------------------------------------------
CLAIM_COLS = ["passage_id", "bars", "claim_text", "row", "verdict", "row_says", "source", "item"]
UNMENTIONED_COLS = ["passage_id", "bars", "row", "reported"]


def mention_keys(it):
    """Strings naming what an Item talks about, for the 'unmentioned' check."""
    p, t = it.params, it.topic
    keys = {t}
    if t == "value":
        keys.add("value:" + p["value"])
        if p["value"] == "long":
            keys |= {"value:half", "value:whole"}
    elif t == "artic":
        keys.add("artic:" + p["group"])
    elif t == "ornament":
        keys.add("ornament:" + p["kind"])
    elif t == "tuplet":
        keys.add("tuplet:" + (p["ratio"] or "any"))
    elif t == "hairpin":
        keys.add("hairpin:" + p["kind"])
    elif t == "dynamic":
        keys.add("dynamic:" + str(p["level"]))
    elif t == "word":
        keys.add("word:" + fold(p["word"]))
    elif t == "chord":
        keys.add("chord:%d" % p["size"])
        if p["top"] > 2:
            keys.add("chord:3")
    return keys


def check_passage(rec, F):
    """-> (claim rows, unmentioned rows) for one passage record and its Facts."""
    pid = rec["passage_id"]
    rows, mentioned = [], set()
    for source, text in (("text", rec["musical_notation_observation"]), ("title", rec["teaching_passage_title"])):
        for seg, items in statement_items(text, source):
            if not items:
                if source == "text":
                    rows.append({"passage_id": pid, "bars": "", "claim_text": seg, "row": "", "verdict": UNCHECK,
                                 "row_says": "no row decides this statement", "source": source, "item": ""})
                continue
            for it in items:
                mentioned |= mention_keys(it)
                r = decide(F, it)
                rows.append({"passage_id": pid, "bars": r.bars, "claim_text": seg, "row": r.row, "verdict": r.verdict,
                             "row_says": r.says, "source": source, "item": it.label})
    low = clean(rec["musical_notation_observation"] + " " + rec["teaching_passage_title"]).lower()
    return rows, unmentioned(pid, F, mentioned, low)


def _share(n, d):
    return f"{100 * n / d:.0f}%" if d else "0%"


def unmentioned(pid, F, M, low):
    """What the rows report in the passage's bars that the text and title never mention, as rows of UNMENTIONED_COLS.
    Only changes and marks are listed (constant context such as the opening clef, key and time is not)."""
    out = []
    R, rng = F.R, bars_str(F.first, F.last)

    def add(row, reported, bars=rng):
        out.append({"passage_id": pid, "bars": bars, "row": row, "reported": reported})

    # note values (E11): any value that is 15% or more of a staff's notes
    for s in F.staves:
        r = (R.get("E11") or {}).get(str(s)) or {}
        by = r.get("notes_by_type") or {}
        tot = sum(by.values())
        for v, n in sorted(by.items(), key=lambda kv: -kv[1]):
            if tot and n / tot >= 0.15 and "value:" + v not in M and not (v in LONG_TYPES and "value:long" in M):
                add("E11", f"staff {s}: {v} notes are {_share(n, tot)} of its {tot} notes")
    # dotted figures (E12 / E11)
    if "dotted" not in M:
        for s in F.staves:
            r = (R.get("E12") or {}).get(str(s)) or {}
            n = sum(r.get(k, 0) for k in ("dotted_quarter_eighth", "dotted_eighth_sixteenth"))
            if n:
                add("E12", f"staff {s}: {n} dotted figures", ", ".join(r.get("bars", [])) or rng)
    # tuplets (E13)
    for s in F.staves:
        r = (R.get("E13") or {}).get(str(s)) or {}
        for ratio, n in (r.get("notes_by_ratio") or {}).items():
            if "tuplet:" + ratio not in M and "tuplet:any" not in M:
                add("E13", f"staff {s}: {n} notes in {ratio} tuplets, {r.get('printed_numbers', 0)} printed numbers",
                    ", ".join(r.get("bars", [])[:12]) or rng)
    # grace notes (E14), ornaments (E15)
    for s in F.staves:
        r = (R.get("E14") or {}).get(str(s)) or {}
        if r.get("n") and "grace" not in M and "ornament:any" not in M:
            add("E14", f"staff {s}: {r['n']} grace notes", ", ".join(r.get("bars", [])))
        r = ((R.get("E15") or {}).get("per_staff") or {}).get(str(s)) or {}
        for k, n in (r.get("by_kind") or {}).items():
            base = "trill" if "trill" in k or "shake" in k else "turn" if "turn" in k else "mordent" if "mordent" in k else "any"
            if "ornament:" + base not in M and "ornament:any" not in M:
                add("E15", f"staff {s}: {n} printed {k}", ", ".join(r.get("bars", [])))
    # arpeggio sign, fermata, ottava, fingering, chord symbols, tremolo, glissando
    for s in F.staves:
        r = (R.get("E16") or {}).get(str(s)) or {}
        if r.get("arpeggiated_chords") and "arpeggi" not in low:
            add("E16", f"staff {s}: {r['arpeggiated_chords']} rolled-chord signs", ", ".join(r.get("bars", [])))
    e19 = R.get("E19") or {}
    if (e19.get("marks") or e19.get("barline_fermatas")) and "fermata" not in M:
        add("E19", f"{e19.get('marks', 0)} fermata marks at {e19.get('time_positions', 0)} places")
    if (R.get("E04") or {}).get("n_spans") and "8va" not in low and "ottava" not in low:
        add("E04", f"{R['E04']['n_spans']} ottava lines")
    if sum(((R.get("E27") or {}).get(str(s)) or {}).get("fingered_attacks", 0) for s in F.staves) and "finger" not in low:
        add("E27", "fingering numbers printed")
    if (R.get("E29") or {}).get("n") and "chord symbol" not in low:
        add("E29", f"{R['E29']['n']} chord symbols")
    for rid, key, word in (("E17", "single", "tremolo"), ("E18", "glissando", "gliss")):
        r = R.get(rid) or {}
        n = sum((r.get(str(s)) or {}).get(key, 0) for s in F.staves) if rid == "E17" else r.get(key, 0)
        if n and word not in low:
            add(rid, f"{n} {word} marks")
    # dynamics (E20), hairpins and words (E21)
    levels = sorted({m["value"] for m in F.marks_e20()})
    if levels and "dynamic:None" not in M:
        miss = [x for x in levels if "dynamic:" + x not in M and not (x in ACCENT_DYN and ("dynamic:sf" in M or "dynamic:sfz" in M))]
        if miss and "dynlevel" not in M:
            marks = F.marks_e20()
            add("E20", "dynamic marks not named: " + ", ".join(f"{x}@{','.join(sorted({m['bar'] for m in marks if m['value'] == x}, key=_int))}" for x in miss))
    seen_h = set()
    for b in range(F.first, F.last + 1):
        e = (F.PB.get(b, {}).get("E21")) or {}
        for h in e.get("hairpins", []) + e.get("unclosed", []):
            seen_h.add(("cresc" if h["kind"] == "crescendo" else "dim", b))
        for w in e.get("words", []):
            seen_h.add(("cresc" if re.search("cresc", w, re.I) else "dim", b))
    for kind in ("cresc", "dim"):
        bs = sorted(b for k, b in seen_h if k == kind)
        if bs and "hairpin:" + kind not in M and "hairpin:any" not in M:
            add("E21", f"{'crescendo' if kind == 'cresc' else 'diminuendo'} (hairpin or word) at bars {', '.join(map(str, bs))}")
    # articulation (E22), slurs (E23), pedal (E24)
    for s in F.staves:
        r = (R.get("E22") or {}).get(str(s)) or {}
        for k, n in (r.get("by_kind") or {}).items():
            grp = "accent" if k in ("accent", "strong-accent") else "staccato" if k in ("staccato", "staccatissimo") else k
            if "artic:" + grp not in M:
                add("E22", f"staff {s}: {n} {k} marks", ", ".join(r.get("bars", [])[:12]))
        r = (R.get("E23") or {}).get(str(s)) or {}
        if r.get("slurs") and "slur" not in M:
            add("E23", f"staff {s}: {r['slurs']} slurs", ", ".join(r.get("bars", [])[:12]))
    if (R.get("E24") or {}).get("marks") and "pedal" not in M:
        add("E24", f"{R['E24']['marks']} pedal marks")
    # clef, key and time changes (E03, E06, E09)
    e03 = F.ctx.get("E03") or {}
    chg = [c for c in e03.get("changes", []) if _int(c["bar"]) is not None and _int(c["bar"]) >= F.first]
    if chg and "clef" not in M:
        add("E03", "clef changes: " + "; ".join(f"staff {c['staff']} bar {c['bar']} to {F.clef_sign(c['to'])}" for c in chg))
    start, ev = _fifths_of(F)
    if ev and "key" not in M:
        add("E06", "key signature changes: " + "; ".join(f"bar {c['bar']}: {c['from']['fifths']:+d} to {c['to']['fifths']:+d}" for c in ev))
    e09 = [s for s in (F.ctx.get("E09") or {}).get("signatures", []) if s.get("change") and (_int(s["bar"]) or 0) >= F.first]
    if e09 and "time" not in M:
        add("E09", "time signature changes: " + "; ".join(f"bar {s['bar']} to {s['time']}" for s in e09))
    # direction words (E25/E26)
    words = {}
    for b in range(F.first, F.last + 1):
        for t in F.texts_at(b):
            words.setdefault(t, []).append(b)
    mw = {k[5:] for k in M if k.startswith("word:")}
    for t, bs in words.items():
        covered = any(w and (re.search(r"(?<![a-z])" + re.escape(w), t)) for w in mw) or \
            ("hairpin:cresc" in M and "cresc" in t) or ("hairpin:dim" in M and "dim" in t) or "hairpin:any" in M and re.search("cresc|dim", t)
        if not covered and t.strip():
            add("E25+E26", f"direction word '{t}'", "m" + ",".join(map(str, bs[:6])))
    # repeats and jumps (E31)
    e31 = R.get("E31") or {}
    if (e31.get("repeats") or e31.get("marks")) and "repeat" not in M and "jump" not in M:
        add("E31", "; ".join([f"{r['direction']} repeat at {r['bar']}" for r in e31.get("repeats", [])] +
                             [f"{m['kind']} at {m['bar']}" for m in e31.get("marks", [])]))
    elif e31.get("marks") and "jump" not in M:
        add("E31", "; ".join(f"{m['kind']} at {m['bar']}" for m in e31["marks"]))
    # accidentals (E07), octaves (E38), chords (E36), pickup (E10)
    for s in F.staves:
        r = (R.get("E07") or {}).get(str(s)) or {}
        if r.get("n") and "accidental" not in M:
            add("E07", f"staff {s}: {r['n']} accidentals {r.get('by_kind')}")
        r = (R.get("E38") or {}).get(str(s)) or {}
        if (r.get("octave_dyads") or r.get("octave_span_chords")) and "octave" not in M:
            add("E38", f"staff {s}: {r.get('octave_dyads', 0)} octave dyads, {r.get('octave_span_chords', 0)} octave-span chords", ", ".join(r.get("bars", [])[:12]))
        sizes = ((R.get("E36") or {}).get(str(s)) or {}).get("per_staff") or {}
        n3 = sum(c for k, c in sizes.items() if int(k) >= 3)
        if n3 and "chord:3" not in M:
            add("E36", f"staff {s}: {n3} attacks of 3 or more notes together")
    e10 = R.get("E10") or {}
    if F.first == 1 and (e10.get("confirmed") or e10.get("candidate")) and "pickup" not in M:
        add("E10", f"first bar holds {e10.get('first_length')} of {e10.get('nominal')} quarters (a pickup)", "m1")
    return out


_E31_CACHE = {}


def read_passages(path):
    with open(path, encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def bundle_score(bundle, number):
    n = f"{int(number):03d}"
    for d in sorted(os.listdir(bundle)):
        if d.startswith(n + "_"):
            return os.path.join(bundle, d, "score.musicxml")
    raise FileNotFoundError(n)


def write_csv(path, cols, rows):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def run(passages_csv, bundle, out, jobs=3):
    from multiprocessing import Pool
    recs = read_passages(passages_csv)
    cache = os.path.join(out, "cache")
    os.makedirs(cache, exist_ok=True)
    todo = []
    for r in recs:
        if not os.path.exists(os.path.join(cache, r["passage_id"] + ".json")):
            todo.append((r["passage_id"], bundle_score(bundle, r["score_number"]), int(r["xml_start_1_based"]),
                         int(r["xml_end_1_based"]), os.path.join(out, "cuts")))
    if todo:
        with Pool(jobs) as pool:
            for pid, res in pool.imap_unordered(gather, todo):
                with open(os.path.join(cache, pid + ".json"), "w", encoding="utf-8") as fh:
                    json.dump(res, fh)
    claims, unm = [], []
    for r in recs:
        with open(os.path.join(cache, r["passage_id"] + ".json"), encoding="utf-8") as fh:
            g = json.load(fh)
        F = Facts(g, int(r["xml_start_1_based"]), int(r["xml_end_1_based"]))
        c, u = check_passage(r, F)
        claims += c
        unm += u
    write_csv(os.path.join(out, "claims.csv"), CLAIM_COLS, claims)
    write_csv(os.path.join(out, "unmentioned.csv"), UNMENTIONED_COLS, unm)
    return claims, unm


# --------------------------------------------------------------------------------------------------------------
# 5. measuring against the answer key (build/pieces/chatgpt-121-135-check.md, task 3)
# --------------------------------------------------------------------------------------------------------------
# The 30 passages the Opus checker judged, claim by claim, and the 18 claims it found FALSE (passage, a phrase from
# ChatGPT's claim as the checker quotes it, a regex that picks our claim row for it). Used to MEASURE the script; no
# rule in the script was set from these rows.
KEY_PASSAGES = ["121-01", "121-03", "122-01", "122-04", "123-02", "123-04", "124-01", "124-03", "125-01", "125-02", "126-01",
                "126-04", "127-01", "127-03", "128-01", "128-03", "129-02", "129-06", "130-03", "130-05", "131-01", "131-03",
                "132-01", "132-02", "133-01", "133-03", "134-03", "134-05", "135-01", "135-04"]
KEY_FALSE = [
    ("122-01", "continuous 16th pulses", r"continuous 16th", r"16th"),
    ("122-04", "left-hand scalar 16ths", r"left-hand scalar", r"scalar"),
    ("124-01", "eighth-note pick-ups in the RH", r"pick-ups", r"pick-up"),
    ("124-03", "above continuous LH eighths", r"continuous LH eighths", r"eighth"),
    ("126-01", "16th pick-ups", r"16th pick-ups", r"pick-up"),
    ("127-01", "LH moves into broken eighths m4-8", r"broken eighths", r"eighth"),
    ("127-03", "active bass eighth patterns", r"bass eighth patterns", r"eighth"),
    ("127-03", "closes on held tonic notes", r"held tonic", r"long"),
    ("128-01", "walking LH broken quarters (title)", r"broken quarters", r"quarter"),
    ("128-03", "shorter crescendos", r"shorter crescendos", r"cresc"),
    ("128-03", "second theme (title)", r"[Ss]econd theme", r"^$"),
    ("130-05", "closing upper scalar descent", r"scalar descent", r"scalar"),
    ("131-01", "both hands switch toward block-chord attacks", r"block-chord attacks", r"chord"),
    ("131-01", "firm dynamic punctuation", r"firm dynamic punctuation", r"dynamic marks"),
    ("133-03", "LH begins repeated eighth figures", r"repeated LH eighth figures", r"eighth"),
    ("133-03", "altered upper intervals", r"altered upper intervals", r"altered"),
    ("134-03", "fresh p long-note melody", r"long-note melody", r"long"),
    ("135-01", "sextuplets alternating with quicker ordinary note groups", r"quicker ordinary", r"^$"),
]


def measure(claims, unm, out):
    """Writes measure.md: how the script's verdicts compare with the answer key on the 30 judged passages, the share of
    statements no row reaches, and what the text leaves out most often."""
    from collections import Counter
    L = []
    nv = Counter(r["verdict"] for r in claims)
    text = [r for r in claims if r["source"] == "text"]
    L += ["# Passage claims against the score: measurement", "",
          f"All 68 passages: {len(claims)} claim rows (text {len(text)}, title {len(claims) - len(text)}). "
          f"TRUE {nv[TRUE]}, FALSE {nv[FALSE]}, UNCHECKABLE {nv[UNCHECK]} ({100 * nv[UNCHECK] / max(1, len(claims)):.0f}% of all rows; "
          f"{100 * sum(r['verdict'] == UNCHECK for r in text) / max(1, len(text)):.0f}% of the text rows).", ""]
    key = [r for r in claims if r["passage_id"] in KEY_PASSAGES]
    kv = Counter(r["verdict"] for r in key)
    L += [f"The 30 passages the Opus checker judged: {len(key)} rows. TRUE {kv[TRUE]}, FALSE {kv[FALSE]}, UNCHECKABLE {kv[UNCHECK]} "
          f"({100 * kv[UNCHECK] / max(1, len(key)):.0f}%). The checker's count there: 133 claims, 113 TRUE, 18 FALSE, 2 unverifiable.", "",
          "## Recall of the 18 FALSE claims", "", "| passage | key claim | our rows matching it | outcome |", "|---|---|---|---|"]
    hits = {"dev": 0, "held": 0}
    tot = {"dev": 0, "held": 0}
    matched_false = set()
    for pid, desc, rx, irx in KEY_FALSE:
        rows = [r for r in key if r["passage_id"] == pid and re.search(rx, r["claim_text"]) and re.search(irx, r["item"])]
        vs = [r["verdict"] for r in rows]
        if FALSE in vs:
            outcome = "HIT (FALSE)"
        elif TRUE in vs:
            outcome = "missed: marked TRUE"
        elif UNCHECK in vs:
            outcome = "not reached: UNCHECKABLE"
        else:
            outcome = "not reached: no row"
        grp = "dev" if pid in DEV_PASSAGES else "held"
        tot[grp] += 1
        hits[grp] += outcome.startswith("HIT")
        for r in rows:
            if r["verdict"] == FALSE:
                matched_false.add((r["passage_id"], r["claim_text"], r["item"]))
        shown = ", ".join(r["item"] + "=" + r["verdict"] for r in rows) or "-"
        L.append(f"| {pid} | {desc} | {shown} | {outcome} |")
    L += ["", f"Recall: {hits['dev'] + hits['held']} of {tot['dev'] + tot['held']}. In the 8 passages whose output I read while building "
          f"({', '.join(sorted(DEV_PASSAGES))}): {hits['dev']} of {tot['dev']}. In the other 22 key passages, read for the first time at "
          f"the full run: {hits['held']} of {tot['held']}.", "",
          "## FALSE rows in the 30 key passages that match none of the 18 key claims (to be read against the score)", "",
          "| passage | item | statement | bars | row says |", "|---|---|---|---|---|"]
    extra = [r for r in key if r["verdict"] == FALSE and (r["passage_id"], r["claim_text"], r["item"]) not in matched_false]
    for r in extra:
        L.append(f"| {r['passage_id']} | {r['item']} | {r['claim_text'][:90]} | {r['bars']} | {r['row_says'][:230]} |")
    L += ["", f"{len(extra)} such rows.", "", "## Statements and items nothing decides (UNCHECKABLE)", ""]
    why = Counter()
    for r in claims:
        if r["verdict"] == UNCHECK:
            why[(r["row"] or "no row", r["item"] or "(whole statement)")] += 1
    for (row, item), n in why.most_common(25):
        L.append(f"- {n} x {item} [{row}]")
    L += ["", "## What the rows report that the text leaves out (all 68 passages)", ""]
    byrow = Counter(u["row"] for u in unm)
    for row, n in byrow.most_common():
        L.append(f"- {row}: {n} passages-rows")
    with open(os.path.join(out, "measure.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(L) + "\n")


DEV_PASSAGES = {"121-01", "122-01", "123-04", "125-01", "128-01", "128-03", "131-01", "135-04"}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("passages", help="ChatGPT's passages CSV (data, never run)")
    ap.add_argument("--bundle", default=os.path.join(ROOT, "build", "pieces", "chatgpt-bundle"))
    ap.add_argument("--out", default=os.path.join(ROOT, "build", "pieces", "passage-claims"))
    ap.add_argument("--jobs", type=int, default=3)
    ap.add_argument("--measure", action="store_true", help="also write measure.md against the answer key")
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    claims, unm = run(a.passages, a.bundle, a.out, a.jobs)
    print(f"{len(claims)} claim rows, {len(unm)} unmentioned rows -> {a.out}")
    if a.measure:
        measure(claims, unm, a.out)
        print("measure.md written")


if __name__ == "__main__":
    main()
