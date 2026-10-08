"""
Shared helpers for the direct-reading modules (not itself a measuring module: the leading
underscore keeps measure.py from importing it as one).

Three readers, in the order they are preferred:

1. `score.load`'s partitura note array, for every statement about which notes sound when, in
   which hand. All note-based modules start from `streams`, which only reshapes that array.
2. music21 (`m21`), for the printed marks and the structures partitura does not expose
   (articulations, ornaments, slurs, tuplet groups, chord symbols, spanners). One parse per
   score, cached on the `Score`.
3. The raw MusicXML (`xml_root`), for marks music21 does not model (`<pedal>`), as the second
   witness for the music21 counts, and for a few structural facts (staves per part, barline
   styles, rehearsal marks, instrument programs).

Nothing here guesses: a helper that cannot answer returns None and the caller says UNKNOWN.
"""
from __future__ import annotations

import io
import warnings
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any, Callable

import numpy as np

import score as S

EPS = 1e-4
STEP_INDEX = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}


# ----------------------------------------------------------------------------- results
class Unreadable(Exception):
    """A library cannot read this file; the measurement is UNKNOWN with this reason, never a guess."""


def direct(cid: str) -> Callable:
    """Register a measurer under `cid` (`score.measures`), turning `Unreadable` into UNKNOWN."""
    def wrap(fn: Callable[[S.Score], S.Result]) -> Callable[[S.Score], S.Result]:
        def run(sc: S.Score) -> S.Result:
            try:
                return fn(sc)
            except Unreadable as e:
                return S.Result.unknown_because(str(e))
        run.__name__ = fn.__name__
        run.__doc__ = fn.__doc__
        S.measures(cid)(run)
        return run
    return wrap



def native(v: Any) -> Any:
    """Python-native copy of a value: numpy scalars and arrays become int, float, bool, list; keys become str
    where they are not already (so `Result.to_json` always serialises)."""
    if isinstance(v, dict):
        return {(k if isinstance(k, str) else str(native(k))): native(x) for k, x in v.items()}
    if isinstance(v, (list, tuple, set)):
        return [native(x) for x in v]
    if isinstance(v, np.generic):
        return v.item()
    if isinstance(v, np.ndarray):
        return [native(x) for x in v.tolist()]
    return v


def res(value: Any, provenance: str = "exact", where=None, confidence: float | None = None) -> S.Result:
    return S.Result(value=native(value), provenance=provenance, confidence=confidence,
                    where=sorted({int(w) for w in (list(where) if where is not None else [])}))


def unknown(why: str) -> S.Result:
    return S.Result.unknown_because(why)


# ----------------------------------------------------------------------------- caching
def cached(sc: S.Score, key: str, make: Callable[[], Any]) -> Any:
    """One computation per score and key: the measurers of a score share its parses."""
    store = sc.__dict__.setdefault("_direct_cache", {})
    if key not in store:
        store[key] = make()
    return store[key]


# ----------------------------------------------------------------------------- raw MusicXML
def xml_text(sc: S.Score) -> str:
    import zipfile as zf

    path = sc.path
    if path.suffix.lower() == ".mxl":
        with zf.ZipFile(path) as z:
            root_name = None
            if "META-INF/container.xml" in z.namelist():
                cont = ET.fromstring(z.read("META-INF/container.xml"))
                for rf in cont.iter("rootfile"):
                    root_name = rf.get("full-path")
                    break
            if root_name is None:
                root_name = next(n for n in z.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.startswith("META-INF"))
            return z.read(root_name).decode("utf-8", "replace")
    return path.read_text(encoding="utf-8", errors="replace")


def xml_root(sc: S.Score) -> ET.Element:
    """The score-partwise root. A timewise file is not expected (the catalogue holds partwise only)."""
    return cached(sc, "xml_root", lambda: ET.fromstring(xml_text(sc).encode("utf-8")))


def xml_parts(sc: S.Score) -> list[ET.Element]:
    return list(xml_root(sc).iter("part"))


# ----------------------------------------------------------------------------- music21
def m21(sc: S.Score):
    """The music21 parse of the score, once."""
    def make():
        from music21 import converter
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                return converter.parse(str(sc.path), forceSource=False)
            except Exception as e:  # noqa: BLE001 - recorded as the reason the item is UNKNOWN
                return Unreadable(f"music21 cannot read the file: {type(e).__name__}: {e}"[:200])
    got = cached(sc, "m21", make)
    if isinstance(got, Unreadable):
        raise got
    got._pt_shift = pt_shift(sc)
    return got


def pt_shift(sc: S.Score) -> float:
    """Add this to a music21 offset to get partitura's quarter-note time. music21 starts the score at 0 with a
    pickup bar included; partitura puts bar 1 of a score with a pickup at 0, so the pickup's notes lie before it
    (negative) and its first measure starts at `measure_starts[0]`."""
    return float(sc.measure_starts[0]) if sc.measure_starts else 0.0


def m21_layout(sc: S.Score) -> list[tuple[int, int]]:
    """(xml part index, staff number) for each music21 part, in music21's order.

    music21 splits a two-staff part into one PartStaff per staff, in staff order, so the
    list is the staves of each XML part in turn."""
    def make():
        out = []
        for pi, p in enumerate(xml_parts(sc)):
            staves = 1
            for st in p.iter("staves"):
                try:
                    staves = max(staves, int(st.text))
                except (TypeError, ValueError):
                    pass
            for st in p.iter("staff"):
                try:
                    staves = max(staves, int(st.text))
                except (TypeError, ValueError):
                    pass
            out += [(pi, s + 1) for s in range(staves)]
        return out
    return cached(sc, "m21_layout", make)


def hand_for(sc: S.Score, part_index: int, staff: int) -> str:
    """score.py's hand rule for an XML part index and staff number."""
    if sc.parts == 1 and sc.staves <= 1:
        return "L" if sc.item.get("hands") == "left" else "R"
    if sc.parts >= 2 and sc.staves <= 1:
        return "R" if part_index == 0 else "L"
    return "R" if staff == 1 else "L"


def m21_hands(sc: S.Score) -> list[str]:
    """The hand of each music21 part, in `m21(sc).parts` order."""
    def make():
        parts = list(m21(sc).parts) or [m21(sc)]
        layout = m21_layout(sc)
        if len(layout) == len(parts):
            return [hand_for(sc, pi, st) for pi, st in layout]
        return ["R" if i == 0 else "L" for i in range(len(parts))]
    return cached(sc, "m21_hands", make)


def measure_of(sc: S.Score, quarter: float) -> int:
    """0-based measure index of a quarter-note offset from the start, by part 0's measure starts."""
    starts = sc.measure_starts
    if not starts:
        return 0
    i = int(np.searchsorted(np.array(starts), quarter + EPS, side="right")) - 1
    return max(0, i)


def m21_offset(el, root) -> float | None:
    from music21.sites import SitesException
    try:
        return float(el.getOffsetInHierarchy(root)) + getattr(root, "_pt_shift", 0.0)
    except SitesException:
        return None


def sounding_and_rests(stream) -> list:
    """The notes, chords and rests of a music21 stream (recursively), leaving out chord symbols: music21's
    `ChordSymbol` is a `Chord`, so `.notes` would count every printed symbol as a played chord."""
    from music21 import harmony
    return [el for el in stream.recurse().notesAndRests if not isinstance(el, harmony.Harmony)]


def sounding_notes(stream) -> list:
    return [el for el in sounding_and_rests(stream) if not el.isRest]


def m21_where(sc: S.Score, elements) -> list[int]:
    root = m21(sc)
    out = set()
    for el in elements:
        q = m21_offset(el, root)
        if q is not None:
            out.add(measure_of(sc, q))
    return sorted(out)


@dataclass
class M21Note:
    """One music21 note, chord or rest placed on the timeline, with its hand and the marks it carries."""
    hand: str
    on: float
    end: float
    rest: bool
    pitches: list
    tuplet: tuple | None   # (actual, normal, total length in quarters of one full tuplet group) of the outermost tuplet
    short: bool            # staccato, staccatissimo, spiccato
    accent: bool           # accent, strong accent
    tenuto: bool


def m21_notes(sc: S.Score) -> tuple[list[M21Note], dict]:
    """Every non-grace note, chord and rest of the music21 parse with absolute onset and the hand rule applied,
    and {id(element): M21Note} so spanners can find their notes."""
    def make():
        from music21 import articulations as art
        from music21 import note as m21note
        root = m21(sc)
        parts = list(root.parts) or [root]
        hands = m21_hands(sc)
        shift = pt_shift(sc)
        out: list[M21Note] = []
        byid: dict = {}
        for pi, part in enumerate(parts):
            h = hands[pi] if pi < len(hands) else "R"
            for el in sounding_and_rests(part.flatten()):
                d = el.duration
                if d.isGrace:
                    continue
                on = round(float(el.offset) + shift, 5)
                tup = None
                if d.tuplets:
                    t = d.tuplets[0]
                    tup = (int(t.numberNotesActual), int(t.numberNotesNormal), float(t.totalTupletLength()))
                isrest = isinstance(el, m21note.Rest)
                arts = [] if isrest else list(el.articulations)
                n = M21Note(h, on, round(on + float(d.quarterLength), 5), isrest,
                            [] if isrest else [int(p.midi) for p in el.pitches], tup,
                            any(isinstance(a, (art.Staccato, art.Staccatissimo, art.Spiccato)) for a in arts),
                            any(isinstance(a, (art.Accent, art.StrongAccent)) for a in arts),
                            any(isinstance(a, art.Tenuto) for a in arts))
                out.append(n)
                byid[id(el)] = n
        return out, byid
    return cached(sc, "m21_notes", make)


def m21_slurs(sc: S.Score) -> list[tuple[str, float, float]]:
    """(hand, start, end) of each slur, from its first spanned note's onset to its last spanned note's end."""
    def make():
        from music21 import spanner
        _, byid = m21_notes(sc)
        out = []
        for sl in m21(sc).recurse().getElementsByClass(spanner.Slur):
            els = [byid[id(e)] for e in sl.getSpannedElements() if id(e) in byid]
            if els:
                out.append((els[0].hand, min(e.on for e in els), max(e.end for e in els)))
        return out
    return cached(sc, "m21_slurs", make)


# ----------------------------------------------------------------------------- note streams
@dataclass
class Hand:
    """One hand's notes from the partitura note array, in onset order, and its onset groups."""
    name: str
    on: np.ndarray        # onset in quarters
    end: np.ndarray       # onset + duration, in quarters
    pitch: np.ndarray     # MIDI
    dia: np.ndarray       # diatonic index from the spelling (octave*7 + step), for generic intervals
    voice: np.ndarray
    staff: np.ndarray
    meas: np.ndarray      # 0-based measure index of the onset
    bar_q: np.ndarray     # length of the note's bar in quarters, from its time signature
    gon: np.ndarray       # sorted unique onset times
    gstart: np.ndarray    # index into the arrays of each group's first note

    @property
    def n(self) -> int:
        return len(self.on)

    def group(self, k: int) -> slice:
        a = self.gstart[k]
        b = self.gstart[k + 1] if k + 1 < len(self.gstart) else self.n
        return slice(a, b)


def _round(a: np.ndarray) -> np.ndarray:
    return np.round(a.astype(float), 5)


def streams(sc: S.Score) -> dict[str, Hand]:
    """{"R": Hand, "L": Hand} for the hands that have notes (a missing hand is absent)."""
    def make():
        out: dict[str, Hand] = {}
        n = sc.notes
        if not len(n):
            return out
        for h in ("R", "L"):
            sel = sc.hand == h
            if not sel.any():
                continue
            a = n[sel]
            m = sc.measure[sel]
            timed = a["duration_quarter"].astype(float) > EPS  # a grace note has no duration: it is not part of the texture
            a, m = a[timed], m[timed]
            if not len(a):
                continue
            on = _round(a["onset_quarter"])
            order = np.lexsort((a["pitch"], on))
            a, m, on = a[order], m[order], on[order]
            dur = _round(a["duration_quarter"])
            dia = a["octave"].astype(int) * 7 + np.array([STEP_INDEX.get(str(s), 0) for s in a["step"]], int)
            gon, gstart = np.unique(on, return_index=True)
            bar = a["ts_beats"].astype(float) * 4.0 / a["ts_beat_type"].astype(float)
            out[h] = Hand(h, on, np.round(on + dur, 5), a["pitch"].astype(int), dia, a["voice"].astype(int),
                          a["staff"].astype(int), m.astype(int), bar, gon, gstart)
        return out
    return cached(sc, "streams", make)


def two_hands(sc: S.Score) -> tuple[Hand, Hand] | None:
    s = streams(sc)
    if "R" in s and "L" in s:
        return s["R"], s["L"]
    return None


def group_pitches(h: Hand, k: int) -> np.ndarray:
    return h.pitch[h.group(k)]


def timed_mask(sc: S.Score) -> np.ndarray:
    """Notes of the note array that last (grace notes, which partitura keeps with zero duration, do not)."""
    return sc.notes["duration_quarter"].astype(float) > EPS if len(sc.notes) else np.zeros(0, bool)


def sounding_at(h: Hand, t: float) -> np.ndarray:
    """Indices of the hand's notes sounding at time t (struck at or before it, not yet ended)."""
    return np.nonzero((h.on <= t + EPS) & (h.end > t + EPS))[0]


def bars_of(h: Hand, idx) -> list[int]:
    return sorted({int(h.meas[i]) for i in idx})


def merge_where(*lists) -> list[int]:
    out: set[int] = set()
    for l in lists:
        out.update(l)
    return sorted(out)
