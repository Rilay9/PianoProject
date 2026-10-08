"""
Harmony rules: Roman numerals per chord change and the rules that read them
(docs/classifier/rules/harmony.md holds each definition, its source or validation, the real
positive and negative items, and when it answers UNKNOWN).

One analysis per score, shared by every rule here and in rules/form.py (`analyse`):

- the key: the signature's major or relative minor, chosen by the ending (the final chord's
  root and quality) with partitura's Krumhansl-Schmuckler estimate as the second witness;
  a key the evidence does not settle is UNKNOWN, and so is every numeral that needs it;
- the chord timeline: from the printed chord symbols when the file has them (music21 reads
  each <harmony> element; partitura keeps only the root), otherwise inferred from the notes
  by template matching after Pardo and Birmingham (2002), segment by segment, with UNKNOWN
  where the texture does not show the chords;
- the bass line (lowest left-hand note per onset) and the melody (highest right-hand note per
  onset), under score.py's one hand rule.

Libraries: music21 (chord-symbol parsing, scale degree of a root in a key), partitura (notes,
key estimate). Custom: the symbol positions (a small MusicXML walk, because partitura drops the
chord kind), the template matcher (a published algorithm, no maintained implementation installed),
and the numeral spelling (jazz-style, so I7 reads as I7 and not music21's 'Ib753').
"""
from __future__ import annotations

import bisect
import warnings
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

import score as S

# --------------------------------------------------------------------------- pitch helpers
STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SHARP_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
MAJOR_SCALE = (0, 2, 4, 5, 7, 9, 11)
NAT_MINOR = (0, 2, 3, 5, 7, 8, 10)


def spell(step: str, alter: int) -> str:
    alter = int(alter or 0)
    if abs(alter) > 2:  # a corrupt alteration in the file: name the pitch class plainly
        return SHARP_NAMES[(STEP_PC[step] + alter) % 12]
    return step + ("#" * alter if alter > 0 else "b" * (-alter))


def pc_of(step: str, alter: int) -> int:
    return (STEP_PC[step] + int(alter or 0)) % 12


# --------------------------------------------------------------------------- chord qualities
#: music21 chord kind -> (triad, seventh). triad: M m d A sus 5 x(augmented sixth, Tristan, pedal);
#: seventh: None, '7' (minor seventh above the root), 'maj7', 'o7' (diminished seventh), '6'.
KIND = {
    "major": ("M", None), "minor": ("m", None), "augmented": ("A", None), "diminished": ("d", None),
    "dominant-seventh": ("M", "7"), "dominant-ninth": ("M", "7"), "dominant-11th": ("M", "7"), "dominant-13th": ("M", "7"),
    "seventh-flat-five": ("M", "7"),
    "major-seventh": ("M", "maj7"), "major-ninth": ("M", "maj7"), "major-11th": ("M", "maj7"), "major-13th": ("M", "maj7"),
    "minor-seventh": ("m", "7"), "minor-ninth": ("m", "7"), "minor-11th": ("m", "7"), "minor-13th": ("m", "7"),
    "minor-major-seventh": ("m", "maj7"), "minor-major-ninth": ("m", "maj7"), "minor-major-11th": ("m", "maj7"), "minor-major-13th": ("m", "maj7"),
    "diminished-seventh": ("d", "o7"), "diminished-ninth": ("d", "o7"), "diminished-11th": ("d", "o7"), "diminished-minor-ninth": ("d", "o7"),
    "half-diminished-seventh": ("d", "7"), "half-diminished-ninth": ("d", "7"), "half-diminished-11th": ("d", "7"),
    "half-diminished-13th": ("d", "7"), "half-diminished-minor-ninth": ("d", "7"),
    "augmented-seventh": ("A", "7"), "augmented-dominant-ninth": ("A", "7"), "augmented-dominant-13th": ("A", "7"),
    "augmented-11th": ("A", "7"),
    "augmented-major-seventh": ("A", "maj7"), "augmented-major-ninth": ("A", "maj7"), "augmented-major-11th": ("A", "maj7"),
    "augmented-major-13th": ("A", "maj7"),
    "major-sixth": ("M", "6"), "minor-sixth": ("m", "6"),
    "suspended-second": ("sus", None), "suspended-fourth": ("sus", None), "suspended-fourth-seventh": ("sus", "7"),
    "power": ("5", None),
    "Neapolitan": ("M", None), "Italian": ("x", None), "French": ("x", None), "German": ("x", None),
    "Tristan": ("x", None), "pedal": ("x", None),
}
#: chord-tone semitones above the root per quality (for chord-tone tests on the notes).
TONES = {("M", None): (0, 4, 7), ("m", None): (0, 3, 7), ("d", None): (0, 3, 6), ("A", None): (0, 4, 8),
         ("M", "7"): (0, 4, 7, 10), ("M", "maj7"): (0, 4, 7, 11), ("m", "7"): (0, 3, 7, 10), ("m", "maj7"): (0, 3, 7, 11),
         ("d", "o7"): (0, 3, 6, 9), ("d", "7"): (0, 3, 6, 10), ("A", "7"): (0, 4, 8, 10), ("A", "maj7"): (0, 4, 8, 11),
         ("M", "6"): (0, 4, 7, 9), ("m", "6"): (0, 3, 7, 9), ("sus", None): (0, 5, 7), ("sus", "7"): (0, 5, 7, 10),
         ("5", None): (0, 7)}


def chord_tones(ch: "Chord") -> set[int]:
    if ch.pcs:
        return set(ch.pcs)
    return {(ch.root_pc + i) % 12 for i in TONES.get((ch.triad, ch.seventh), (0,))}


# --------------------------------------------------------------------------- data
@dataclass
class Key:
    tonic_pc: int
    tonic: str
    mode: str  # "major" | "minor"
    confidence: float
    why: str

    @property
    def name(self) -> str:
        return f"{self.tonic} {self.mode}"


@dataclass
class Chord:
    t0: float  # onset, quarters from the start of the score
    t1: float
    m: int  # 0-based measure index
    beat: float  # 1-based beat in the measure (in the measure's beat unit)
    root_pc: int
    root: str
    triad: str
    seventh: str | None
    src: str  # "symbol" | "notes"
    text: str = ""
    bass_pc: int | None = None  # a slash bass (symbols only)
    conf: float = 1.0
    pcs: tuple = ()  # the symbol's own pitch classes (music21), when it lists more than the quality's
    deg: int | None = None  # semitones from the tonic
    label: str | None = None  # the numeral, or None without a key


@dataclass
class Analysis:
    key: Key | None
    key_unknown: str | None
    chords: list[Chord]  # resolved chords only, in time order, consecutive duplicates merged
    source: str | None  # "symbols" | "notes" | None
    unknown: str | None  # why the timeline is UNKNOWN
    resolved_share: float = 0.0
    gaps: list[tuple[float, float]] = field(default_factory=list)  # unresolved spans (notes path)
    bass: list[tuple[float, float, int, int]] = field(default_factory=list)  # (onset, end, midi, measure)
    melody: list[tuple[float, float, int, int]] = field(default_factory=list)
    end: float = 0.0
    measure_len: list[float] = field(default_factory=list)
    beat_len: list[float] = field(default_factory=list)
    beats_per_bar: list[int] = field(default_factory=list)


# --------------------------------------------------------------------------- the MusicXML walk for <harmony>
def _xml(path: Path) -> ET.Element:
    if path.suffix == ".mxl":
        with zipfile.ZipFile(path) as z:
            name = None
            if "META-INF/container.xml" in z.namelist():
                c = ET.fromstring(z.read("META-INF/container.xml"))
                rf = [e for e in c.iter() if e.tag.endswith("rootfile")]
                if rf:
                    name = rf[0].get("full-path")
            if name is None:
                name = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")][0]
            return ET.fromstring(z.read(name))
    return ET.parse(str(path)).getroot()


def _int(e, tag, default=0):
    x = e.find(tag)
    try:
        return int(float(x.text)) if x is not None and x.text else default
    except ValueError:
        return default


def read_symbols(sc: S.Score) -> list[tuple[float, int, object, str]]:
    """Every <harmony> element: (onset in quarters, measure index, music21 ChordSymbol or None for N.C., text)."""
    from music21.musicxml import xmlToM21
    root = _xml(sc.path)
    if not any(e.tag == "harmony" for e in root.iter()):
        return []
    mp = xmlToM21.MeasureParser()
    out = []
    for part in root.findall("part"):
        div = 1
        for mi, meas in enumerate(part.findall("measure")):
            if mi >= len(sc.measure_starts):
                break
            pos = 0
            for e in meas:
                if e.tag == "attributes":
                    div = _int(e, "divisions", div) or div
                elif e.tag == "note":
                    if e.find("grace") is not None or e.find("chord") is not None:
                        continue
                    pos += _int(e, "duration")
                elif e.tag == "backup":
                    pos -= _int(e, "duration")
                elif e.tag == "forward":
                    pos += _int(e, "duration")
                elif e.tag == "harmony":
                    off = _int(e, "offset")
                    kind = e.find("kind")
                    text = (kind.get("text") if kind is not None else None) or ""
                    if kind is not None and (kind.text or "").strip() == "none":
                        cs = None
                    else:
                        try:
                            with warnings.catch_warnings():
                                warnings.simplefilter("ignore")
                                cs = mp.xmlToChordSymbol(e)
                        except Exception:  # noqa: BLE001 - an unreadable symbol is skipped, not guessed
                            continue
                    out.append((sc.measure_starts[mi] + (pos + off) / div, mi, cs, text))
    out.sort(key=lambda r: r[0])
    dedup = []
    for r in out:  # the same symbol printed on two staves at one onset is one chord
        if dedup and abs(dedup[-1][0] - r[0]) < 1e-6:
            continue
        dedup.append(r)
    return dedup


# --------------------------------------------------------------------------- grid
def _grid(sc: S.Score) -> tuple[list[float], list[float], list[int], float]:
    n = sc.notes
    end = float(np.max(n["onset_quarter"] + n["duration_quarter"])) if len(n) else 0.0
    starts = sc.measure_starts
    mlen, blen, bpb = [], [], []
    ts_by_m = {}
    for m, b, bt, mb in zip(sc.measure, n["ts_beats"], n["ts_beat_type"], n["ts_mus_beats"]):
        ts_by_m.setdefault(int(m), (int(b), int(bt), int(mb)))
    last = (4, 4, 4)
    for i, s in enumerate(starts):
        e = starts[i + 1] if i + 1 < len(starts) else max(end, s)
        ts = ts_by_m.get(i, last)
        last = ts
        full = ts[0] * 4.0 / ts[1]
        mus = max(1, ts[2])
        bl = full / mus
        mlen.append(e - s)
        blen.append(bl)
        bpb.append(mus)
    return mlen, blen, bpb, end


def measure_of(sc: S.Score, t: float) -> int:
    i = int(np.searchsorted(np.array(sc.measure_starts), t + 1e-9, side="right") - 1)
    return max(0, i)


# --------------------------------------------------------------------------- streams
def _line(sc: S.Score, hand: str, lowest: bool) -> list[tuple[float, float, int, int]]:
    n = sc.notes
    sel = sc.hand == hand
    if not sel.any():
        return []
    on = n["onset_quarter"][sel]
    du = n["duration_quarter"][sel]
    pi = n["pitch"][sel]
    ms = sc.measure[sel]
    out = {}
    for o, d, p, m in zip(on, du, pi, ms):
        k = round(float(o), 4)
        if k not in out or (p < out[k][2] if lowest else p > out[k][2]):
            out[k] = (float(o), float(o + d), int(p), int(m))
    return [out[k] for k in sorted(out)]


def bass_line(sc: S.Score):
    if sc.staves >= 2 or sc.parts >= 2 or sc.item.get("hands") == "left":
        return _line(sc, "L", True)
    return []


def melody_line(sc: S.Score):
    if (sc.hand == "R").any():
        return _line(sc, "R", False)
    return []


# --------------------------------------------------------------------------- key
def _fifths_tonic(fifths: int) -> int:
    return (7 * fifths) % 12


def _quality_mode(triad: str) -> str | None:
    return {"M": "major", "m": "minor"}.get(triad)


def infer_key(sc: S.Score, final: Chord | None, first: Chord | None) -> tuple[Key | None, str | None]:
    """The signature's major or relative minor, settled by the ending; the K-S estimate is the second witness."""
    from partitura.musicanalysis import estimate_key
    n = sc.notes
    if not len(n):
        return None, "no notes"
    order = np.argsort(n["onset_quarter"], kind="stable")
    fifths = int(n["ks_fifths"][order[0]])
    maj = _fifths_tonic(fifths)
    mnr = (maj + 9) % 12
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            ks = estimate_key(n)
        ks_minor = ks.endswith("m")
        name = ks[:-1] if ks_minor else ks
        ks_pc = pc_of(name[0], name[1:].count("#") - name[1:].count("b"))
        ks_key = (ks_pc, "minor" if ks_minor else "major")
    except Exception:  # noqa: BLE001
        ks_key = None

    def spelled(pc: int, mode: str) -> str:
        # spell the tonic from the signature's own spelling where it is a scale member, else the sharp/flat default
        from music21 import key as m21key
        k = m21key.KeySignature(fifths)
        sc_pitches = (k.asKey("major") if mode == "major" else k.asKey("minor")).getScale().getPitches()
        for p in sc_pitches:
            if p.pitchClass == pc:
                return p.name.replace("-", "b")
        return SHARP_NAMES[pc]

    def mk(pc, mode, conf, why):
        return Key(pc, spelled(pc, mode), mode, conf, why), None

    pair = {(maj, "major"), (mnr, "minor")}

    def chord_key(ch):
        if ch.triad == "M":  # a major triad, a blues I7 or a major seventh all end a major-mode piece
            return (ch.root_pc, "major")
        if ch.triad == "m":
            return (ch.root_pc, "minor")
        return None

    def bass_key(pc):
        return (maj, "major") if pc == maj else (mnr, "minor") if pc == mnr else None

    on = n["onset_quarter"]
    end = chord_key(final) if final is not None else bass_key(int(n["pitch"][on == on.max()].min()) % 12)
    beg = chord_key(first) if first is not None else bass_key(int(n["pitch"][on == on.min()].min()) % 12)
    # the ending outweighs the other two, unless it is a lone right-hand note in a two-hand piece (no bass under it)
    last = on == on.max()
    end_w = 2 if final is not None or len(set(sc.hand.tolist())) < 2 or (sc.hand[last] == "L").any() else 1
    votes: dict = {}
    for k, w in ((end, end_w), (beg, 1), (ks_key, 1)):
        if k is not None:
            votes[k] = votes.get(k, 0) + w
    inside = sorted(((v, k) for k, v in votes.items() if k in pair), reverse=True)
    said = f"ending {end}, opening {beg}, K-S {ks_key}"
    if inside and inside[0][0] >= 2 and (len(inside) == 1 or inside[0][0] > inside[1][0]):
        v, k = inside[0]
        agree = [nm for nm, kk in (("ending", end), ("opening", beg), ("K-S", ks_key)) if kk == k]
        conf = {4: 0.95, 3: 0.9 if "ending" in agree else 0.85, 2: 0.8 if "ending" not in agree else 0.7}[v]
        return mk(k[0], k[1], conf, f"the signature's {k[1]} key: {' + '.join(agree)} agree ({said})")
    if len(inside) == 1 and inside[0][0] == 1 and not any(k in pair for k in votes if k != inside[0][1]):
        k = inside[0][1]
        agree = [nm for nm, kk in (("ending", end), ("opening", beg), ("K-S", ks_key)) if kk == k]
        return mk(k[0], k[1], 0.6, f"the signature's {k[1]} key: only the {agree[0]} settles it and nothing inside the signature contradicts it ({said})")
    if end is not None and end == ks_key and end not in pair:
        return mk(end[0], end[1], 0.7, f"the ending and the K-S estimate agree on a key outside the signature ({said})")
    return None, f"key unresolved: signature {fifths}, {said}"


# --------------------------------------------------------------------------- numerals
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"]


def numeral(ch: Chord, key: Key) -> str:
    from music21 import key as m21key, pitch as m21pitch
    k = m21key.Key(key.tonic.replace("b", "-"), key.mode)
    p = m21pitch.Pitch(ch.root.replace("b", "-"))
    deg, acc = k.getScaleDegreeAndAccidentalFromPitch(p)
    a = acc.alter if acc is not None else 0
    if key.mode == "minor" and deg in (6, 7) and a == 1:  # harmonic and melodic minor's raised degrees carry no accidental
        a = 0 if deg == 7 else a
    prefix = "#" * int(a) if a > 0 else "b" * int(-a)
    r = ROMAN[deg - 1]
    if ch.triad in ("m", "d"):
        r = r.lower()
    suffix = {("d", None): "°", ("d", "o7"): "°7", ("d", "7"): "ø7", ("A", None): "+", ("A", "7"): "+7",
              ("A", "maj7"): "+maj7", ("sus", None): "sus", ("sus", "7"): "7sus", ("5", None): "5", ("x", None): "x"}.get(
        (ch.triad, ch.seventh))
    if suffix is None:
        suffix = {None: "", "7": "7", "maj7": "maj7", "6": "6", "o7": "°7"}.get(ch.seventh, "")
    return prefix + r + suffix


# --------------------------------------------------------------------------- the notes path (Pardo and Birmingham 2002)
#: templates in the order of their prior (P&B's tie-break): major, dominant seventh, minor, diminished seventh,
#: half-diminished seventh, diminished.
TEMPLATES = [(("M", None), (0, 4, 7)), (("M", "7"), (0, 4, 7, 10)), (("m", None), (0, 3, 7)),
             (("d", "o7"), (0, 3, 6, 9)), (("d", "7"), (0, 3, 6, 10)), (("d", None), (0, 3, 6))]
_MASK = np.zeros((0, 12))
_TPL: list = []
_SIZES = np.zeros(0)
_ROOTS = np.zeros(0, int)


def set_templates(templates) -> None:
    global _MASK, _TPL, _SIZES, _ROOTS
    _MASK = np.zeros((len(templates) * 12, 12))
    _TPL = []
    for ti, (q, iv) in enumerate(templates):
        for r in range(12):
            for i in iv:
                _MASK[ti * 12 + r, (r + i) % 12] = 1
            _TPL.append((q, r, len(iv)))
    _SIZES = np.array([t[2] for t in _TPL])
    _ROOTS = np.array([t[1] for t in _TPL])


set_templates(TEMPLATES)
#: minimum share of a resolved segment's sounding duration that its chord explains (validated against
#: the printed symbols: docs/classifier/rules/harmony.md, "Validation of the notes path").
MIN_COVERAGE = 0.8
#: the measured root agreement with the printed symbols per coverage band (the same validation): a resolved
#: segment's confidence.
AGREEMENT = ((0.9, 0.90), (0.8, 0.78))
#: minimum share of the item's beats that resolve for the timeline to stand.
MIN_RESOLVED = 0.6
#: weight of the bass note on a template's root (0 is Pardo and Birmingham as published).
BASS_W = 1.0


def _bass_weights(sc: S.Score, bass, a: float, b: float, bl: float) -> np.ndarray:
    bo, be, bp = bass
    w = np.zeros(12)
    sel = (bo < b - 1e-9) & (be > a + 1e-9)
    if sel.any():
        np.add.at(w, bp[sel] % 12, (np.minimum(be[sel], b) - np.maximum(bo[sel], a)) / bl)
    return w


def _weights(sc: S.Score, a: float, b: float, bl: float) -> np.ndarray:
    n = sc.notes
    on = n["onset_quarter"]
    off = on + n["duration_quarter"]
    sel = (on < b - 1e-9) & (off > a + 1e-9)
    w = np.zeros(12)
    if sel.any():
        ov = (np.minimum(off[sel], b) - np.maximum(on[sel], a)) / bl
        np.add.at(w, n["pitch"][sel] % 12, ov)
    return w


def _best(w: np.ndarray, wb: np.ndarray | None = None):
    tot = w.sum()
    P = _MASK @ w
    N = tot - P
    present = (_MASK * (w > 1e-9)).sum(axis=1)
    M = _SIZES - present
    sc_ = P - N - M
    if BASS_W and wb is not None:
        sc_ = sc_ + BASS_W * wb[_ROOTS]
    best = None
    for idx in np.argsort(-sc_, kind="stable")[:12]:
        if best is None or sc_[idx] > sc_[best] + 1e-9:
            best = idx
        elif abs(sc_[idx] - sc_[best]) <= 1e-9:
            rb, ri = _TPL[best][1], _TPL[idx][1]
            if w[ri] > w[rb] + 1e-9:  # P&B's first tie-break: root weight; then template order (idx order)
                best = idx
    return best, float(sc_[best]), float(P[best]), float(tot), int(present[best])


def _spell_pc(sc: S.Score, pc: int, a: float, b: float) -> str:
    n = sc.notes
    on = n["onset_quarter"]
    sel = (n["pitch"] % 12 == pc) & (on < b) & (on + n["duration_quarter"] > a)
    if sel.any():
        names = [spell(s, al) for s, al in zip(n["step"][sel], n["alter"][sel])]
        return max(set(names), key=names.count)
    return SHARP_NAMES[pc]


def _lowest_line(sc: S.Score):
    n = sc.notes
    out = {}
    for o, d, p, m in zip(n["onset_quarter"], n["duration_quarter"], n["pitch"], sc.measure):
        k = round(float(o), 4)
        if k not in out or p < out[k][2]:
            out[k] = (float(o), float(o + d), int(p), int(m))
    return [out[k] for k in sorted(out)]


def notes_timeline(sc: S.Score, an: Analysis) -> tuple[list[Chord], list[tuple[float, float]], float]:
    chords, gaps = [], []
    total = resolved = 0.0
    line = an.bass or _lowest_line(sc)
    bass = (np.array([x[0] for x in line]), np.array([x[1] for x in line]), np.array([x[2] for x in line], int))
    for m, s in enumerate(sc.measure_starts):
        L, bl = an.measure_len[m], an.beat_len[m]
        nb = max(1, min(12, int(round(L / bl)))) if L > 1e-6 else 0
        if nb == 0:
            continue
        edges = [s + k * L / nb for k in range(nb + 1)]
        W = [_weights(sc, edges[k], edges[k + 1], bl) for k in range(nb)]
        WB = [_bass_weights(sc, bass, edges[k], edges[k + 1], bl) for k in range(nb)] if BASS_W else [None] * nb
        cache = {}
        for i in range(nb):
            acc = np.zeros(12)
            accb = np.zeros(12)
            for j in range(i, nb):
                acc = acc + W[j]
                if BASS_W:
                    accb = accb + WB[j]
                cache[(i, j)] = (_best(acc, accb) if acc.sum() > 1e-9 else None, acc.copy())
        best = [0.0] * (nb + 1)
        back = [0] * (nb + 1)
        for j in range(1, nb + 1):
            bestv = None
            for i in range(j):
                r, acc = cache[(i, j - 1)]
                v = best[i] + (r[1] if r is not None else 0.0)
                if bestv is None or v > bestv + 1e-9:
                    bestv, back[j] = v, i
            best[j] = bestv
        spans = []
        j = nb
        while j > 0:
            i = back[j]
            spans.append((i, j - 1))
            j = i
        for i, j in reversed(spans):
            r, acc = cache[(i, j)]
            a, b = edges[i], edges[j + 1]
            if r is None:
                continue  # a rest: no evidence, neither resolved nor counted
            idx, score_, P, tot, present = r
            (triad, seventh), root, size = _TPL[idx]
            total += b - a
            cov = P / tot if tot else 0.0
            if present < 3 or cov < MIN_COVERAGE:
                gaps.append((a, b))
                continue
            resolved += b - a
            chords.append(Chord(a, b, m, round(1 + (a - s) / bl, 3), root, _spell_pc(sc, root, a, b), triad, seventh,
                                "notes", conf=next(a for lo, a in AGREEMENT if cov >= lo - 1e-9)))
    return chords, gaps, (resolved / total if total else 0.0)


# --------------------------------------------------------------------------- the analysis
_CACHE: dict = {"key": None, "val": None}


def _merge(chords: list[Chord]) -> list[Chord]:
    out = []
    for c in chords:
        if out and out[-1].root_pc == c.root_pc and out[-1].triad == c.triad and out[-1].seventh == c.seventh \
                and out[-1].bass_pc == c.bass_pc and abs(out[-1].t1 - c.t0) < 1e-6 and out[-1].src == c.src:
            out[-1].t1 = c.t1
            out[-1].conf = min(out[-1].conf, c.conf)
            continue
        out.append(c)
    return out


def analyse(sc: S.Score) -> Analysis:
    if _CACHE["key"] is sc:
        return _CACHE["val"]
    mlen, blen, bpb, end = _grid(sc)
    an = Analysis(key=None, key_unknown=None, chords=[], source=None, unknown=None, end=end,
                  measure_len=mlen, beat_len=blen, beats_per_bar=bpb)
    an.bass = bass_line(sc)
    an.melody = melody_line(sc)
    syms = read_symbols(sc) if len(sc.notes) else []
    real = [s for s in syms if s[2] is not None and s[2].root() is not None]
    if real:
        an.source = "symbols"
        chords = []
        for i, (t, mi, cs, text) in enumerate(syms):
            t1 = syms[i + 1][0] if i + 1 < len(syms) else max(end, t)
            if cs is None or cs.root() is None or t1 <= t + 1e-9:
                continue
            tri, sev = KIND.get(cs.chordKind, ("?", None))
            if tri == "?":
                continue
            root = cs.root()
            bass = cs.bass()
            bpc = bass.pitchClass if bass is not None and bass.pitchClass != root.pitchClass else None
            chords.append(Chord(t, t1, mi, round(1 + (t - sc.measure_starts[mi]) / blen[mi], 3), root.pitchClass,
                                root.name.replace("-", "b"), tri, sev, "symbol", text=cs.figure, bass_pc=bpc,
                                pcs=tuple(sorted({p.pitchClass for p in cs.pitches}))))
        an.chords = _merge(chords)
        an.resolved_share = 1.0
    else:
        poly = _polyphonic(sc)
        if not len(sc.notes):
            an.unknown = "no notes"
        elif not poly:
            an.unknown = "melody only: one line, no chord symbols; the texture does not show the chords"
        else:
            chords, gaps, share = notes_timeline(sc, an)
            an.source = "notes"
            an.gaps = gaps
            an.resolved_share = share
            an.chords = _merge(chords)
            if share < MIN_RESOLVED:
                an.unknown = f"the texture does not show the chords: {share:.0%} of sounding beats resolve to a chord (needs {MIN_RESOLVED:.0%})"
    final = an.chords[-1] if an.chords and an.chords[-1].t1 >= end - 1e-6 else None
    if final is None and an.source == "notes" and an.chords and an.chords[-1].m == len(sc.measure_starts) - 1:
        final = an.chords[-1]
    if final is not None and final.src == "notes" and final.triad == "m":
        # a minor triad with its minor seventh is also the major sixth chord a minor third up (Dm7 = F6, a common
        # jazz ending): the final chord does not tell the two keys apart, so the ending falls back to the bass
        w = _weights(sc, final.t0, final.t1, 1.0)
        if w[(final.root_pc + 10) % 12] > 1e-9:
            final = None
    first = an.chords[0] if an.chords else None
    if an.unknown is None and an.chords:
        an.key, an.key_unknown = infer_key(sc, final, first)
    elif len(sc.notes):  # the key without a chord timeline: the ending and opening bass, and K-S
        an.key, an.key_unknown = infer_key(sc, None, None)
    if an.key is not None:
        for c in an.chords:
            c.deg = (c.root_pc - an.key.tonic_pc) % 12
            c.label = numeral(c, an.key)
    _CACHE["key"], _CACHE["val"] = sc, an
    return an


def _polyphonic(sc: S.Score) -> bool:
    """True when at least two notes sound at once somewhere (an accompaniment or a chord), or two hands play."""
    n = sc.notes
    if len(set(sc.hand.tolist())) > 1:
        return True
    on = np.round(n["onset_quarter"], 4)
    off = on + n["duration_quarter"]
    order = np.argsort(on)
    on, off = on[order], off[order]
    run_end = -1.0
    for o, e in zip(on, off):
        if o < run_end - 1e-6:
            return True
        run_end = max(run_end, e)
    return False


# --------------------------------------------------------------------------- shared helpers for rules
def timeline_unknown(an: Analysis) -> str | None:
    if an.unknown:
        return an.unknown
    if not an.chords:
        return "no chord symbols and no resolvable chords"
    if an.key is None:
        return an.key_unknown or "key unresolved"
    return None


def provenance(an: Analysis) -> tuple[str, float | None]:
    if an.source == "symbols" and an.key is not None and an.key.confidence >= 0.85:
        return "one-witness", None
    conf = an.key.confidence if an.key else 0.0
    if an.source == "notes":
        cs = [c.conf for c in an.chords]
        conf *= (sum(cs) / len(cs) if cs else 0.0)
    return "inferred", round(conf, 3)


def chord_at(an: Analysis, t: float) -> Chord | None:
    for c in an.chords:
        if c.t0 - 1e-6 <= t < c.t1 - 1e-6:
            return c
    return None


def result(an: Analysis, value, where=None) -> S.Result:
    prov, conf = provenance(an)
    return S.Result(value=value, provenance=prov, confidence=conf, where=sorted(set(where or [])))


# =========================================================================== harmony.roman
@S.measures("harmony.roman")
def roman(sc: S.Score) -> S.Result:
    an = analyse(sc)
    why = timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    chords = [[c.m, c.beat, c.label] for c in an.chords]
    value = {"key": an.key.name, "source": an.source, "chords": chords}
    if an.source == "notes":
        value["resolved"] = round(an.resolved_share, 3)
    return result(an, value, [c.m for c in an.chords])


# --------------------------------------------------------------------------- shared sequence helpers
def diatonic(key: Key) -> set[int]:
    """Scale degrees (semitones above the tonic) counted as in the key: the major scale; in minor the natural
    minor plus the raised sixth and seventh (harmonic and melodic minor are the minor key's own)."""
    return set(MAJOR_SCALE) if key.mode == "major" else set(NAT_MINOR) | {9, 11}


def seq(an: Analysis) -> list[Chord]:
    """The chord changes with inversions ignored: consecutive chords of one root and quality are one."""
    out: list[Chord] = []
    for c in an.chords:
        if out and out[-1].root_pc == c.root_pc and out[-1].triad == c.triad and out[-1].seventh == c.seventh \
                and abs(out[-1].t1 - c.t0) < 1e-6:
            out[-1] = Chord(**{**out[-1].__dict__, "t1": c.t1})
            continue
        out.append(c)
    return out


def is_dominant(c: Chord) -> bool:
    return c.triad == "M" and c.seventh in (None, "7")


def is_tonic(c: Chord, key: Key) -> bool:
    return c.deg == 0 and c.triad == ("M" if key.mode == "major" else "m")


def chord_is_diatonic(c: Chord, key: Key) -> bool:
    dia = diatonic(key)
    return all((p - key.tonic_pc) % 12 in dia for p in chord_tones(c))


def strong(an: Analysis, sc: S.Score, t: float) -> bool:
    m = measure_of(sc, t)
    off = t - sc.measure_starts[m]
    if abs(off) < 1e-6:
        return True
    bpb = an.beats_per_bar[m]
    return bpb >= 4 and bpb % 2 == 0 and abs(off - an.beat_len[m] * bpb / 2) < 1e-6


def blues_tonic(sq: list[Chord]) -> bool:
    """The tonic chord is a dominant seventh most of the time: the blues' I7, which is the home chord, not V7/IV."""
    t = [c for c in sq if c.deg == 0]
    return bool(t) and sum(1 for c in t if c.triad == "M" and c.seventh == "7") > len(t) / 2


# =========================================================================== key.minor-form
@S.measures("key.minor-form")
def minor_form(sc: S.Score) -> S.Result:
    an = analyse(sc)
    if an.key is None:
        return S.Result.unknown_because(an.key_unknown or "key unresolved")
    if an.key.mode == "major":
        return S.Result(value={"mode": "major", "forms": []}, provenance="inferred", confidence=an.key.confidence)
    n = sc.notes
    counts = {"b6": 0, "6": 0, "b7": 0, "7": 0}
    forms: dict[str, list[int]] = {"natural": [], "harmonic": [], "melodic": []}
    for hand in ("R", "L"):
        sel = np.where(sc.hand == hand)[0]
        if not len(sel):
            continue
        order = sel[np.lexsort((n["pitch"][sel], n["onset_quarter"][sel]))]
        degs = [(int(n["pitch"][i]) - an.key.tonic_pc) % 12 for i in order]
        for k, i in enumerate(order):
            d = degs[k]
            prev = degs[k - 1] if k else None
            nxt = degs[k + 1] if k + 1 < len(degs) else None
            m = int(sc.measure[i])
            if d == 8:
                counts["b6"] += 1
            elif d == 10:
                counts["b7"] += 1
                forms["natural"].append(m)
            elif d == 9:
                counts["6"] += 1
                if nxt == 11 or prev == 7 and nxt in (11, 0):
                    forms["melodic"].append(m)
            elif d == 11:
                counts["7"] += 1
                if prev == 9:
                    forms["melodic"].append(m)
                else:
                    forms["harmonic"].append(m)
    used = sorted(f for f, ms in forms.items() if ms)
    where = [m for f in used for m in forms[f]]
    return S.Result(value={"mode": "minor", "forms": used, "counts": counts}, provenance="inferred",
                    confidence=an.key.confidence, where=sorted(set(where)))


# =========================================================================== scale.collection
COLLECTIONS = {
    "major (diatonic)": (0, 2, 4, 5, 7, 9, 11),
    "harmonic minor": (0, 2, 3, 5, 7, 8, 11),
    "melodic minor": (0, 2, 3, 5, 7, 9, 11),
    "melodic minor, both directions": (0, 2, 3, 5, 7, 8, 9, 10, 11),
    "major pentatonic": (0, 2, 4, 7, 9),
    "blues scale": (0, 3, 5, 6, 7, 10),
    "whole-tone": (0, 2, 4, 6, 8, 10),
}
MODES = {0: "ionian (major)", 2: "dorian", 4: "phrygian", 5: "lydian", 7: "mixolydian", 9: "aeolian (natural minor)",
         11: "locrian"}


def name_collection(pcs: frozenset, key: Key | None) -> tuple[str, bool]:
    """The named collection the set equals, rooted on the tonic where the tonic is in it. (name, used the key)."""
    if len(pcs) == 12:
        return "all twelve pitch classes", False
    if len(pcs) < 5:
        return f"fewer than five pitch classes ({len(pcs)})", False
    for nm, iv in COLLECTIONS.items():
        for r in range(12):
            if frozenset((r + i) % 12 for i in iv) == pcs:
                t = key.tonic_pc if key else None
                if nm == "major (diatonic)":
                    if t is not None and t in pcs:
                        return f"{MODES[(t - r) % 12]} on {key.tonic}", True
                    return f"diatonic set of {SHARP_NAMES[r]} major", False
                if nm == "major pentatonic":
                    if t is not None and (t - r) % 12 == 0:
                        return f"major pentatonic on {key.tonic}", True
                    if t is not None and (t - r) % 12 == 9:
                        return f"minor pentatonic on {key.tonic}", True
                    return f"pentatonic set of {SHARP_NAMES[r]} major pentatonic", False
                if nm == "whole-tone":
                    return "whole-tone", False
                if t is not None and t == r:
                    return f"{nm} on {key.tonic}", True
                return f"{nm} set on {SHARP_NAMES[r]}", False
    return f"no named collection ({len(pcs)} pitch classes)", False


def _scalar_run(line, length: int = 4) -> bool:
    """True when the line moves through `length` different notes in one direction by scale steps (one to three
    semitones): the collection is played as a scale, not only sounded as chord figures (a boogie bass's root, fifth
    and sixth over two chords sound five pitch classes without one scale run)."""
    ps = [x[2] for x in line]
    ps = [p for k, p in enumerate(ps) if k == 0 or p != ps[k - 1]]
    run, direction = 1, 0
    for p, q in zip(ps, ps[1:]):
        d = q - p
        step = 1 <= abs(d) <= 3
        if step and (direction == 0 or (d > 0) == (direction > 0)):
            run += 1
            direction = d
        else:
            run, direction = (2, d) if step else (1, 0)
        if run >= length:
            return True
    return False


NAMED = ("ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian", "diatonic", "minor", "pentatonic",
         "blues", "whole-tone")


@S.measures("scale.collection")
def collection(sc: S.Score) -> S.Result:
    an = analyse(sc)
    n = sc.notes
    if not len(n):
        return S.Result.unknown_because("no notes")
    out, used_key = {}, False
    hands = [h for h in ("R", "L") if (sc.hand == h).any()]
    parts = [("all", np.ones(len(n), bool))] + ([(h, sc.hand == h) for h in hands] if len(hands) > 1 else [])
    for nm, sel in parts:
        name, k = name_collection(frozenset(int(p) % 12 for p in n["pitch"][sel]), an.key)
        h = nm if nm != "all" else hands[0] if len(hands) == 1 else None
        if h and any(w in name for w in NAMED) and not _scalar_run(_line(sc, h, h == "L")):
            name += " (no scale run)"
        out[nm] = name
        used_key |= k
    passages, where = [], []
    nbars = len(sc.measure_starts)
    for h in hands:
        hs = sc.hand == h
        line = _line(sc, h, h == "L")
        whole = out.get(h, out["all"])
        for a in range(0, nbars, 4):
            sel = hs & (sc.measure >= a) & (sc.measure < a + 4)
            seg = [x for x in line if a <= x[3] < a + 4]
            if len(seg) < 6 or not _scalar_run(seg):
                continue
            name, k = name_collection(frozenset(int(p) % 12 for p in n["pitch"][sel]), an.key)
            if any(w in name for w in ("pentatonic", "blues", "whole-tone")) and name != whole:
                passages.append({"bars": [a, min(a + 3, nbars - 1)], "hand": h, "collection": name})
                where.extend(range(a, min(a + 4, nbars)))
                used_key |= k
    if passages:
        out["passages"] = passages
    if used_key:
        return S.Result(value=out, provenance="inferred", confidence=an.key.confidence, where=where)
    return S.Result(value=out, provenance="exact", where=where)


# =========================================================================== harmony.progression
NAMED_FOUR = {
    "I-V-vi-IV": ((0, "M"), (7, "M"), (9, "m"), (5, "M")),
    "I-vi-IV-V": ((0, "M"), (9, "m"), (5, "M"), (7, "M")),
    "vi-IV-I-V": ((9, "m"), (5, "M"), (0, "M"), (7, "M")),
    "I-vi-ii-V": ((0, "M"), (9, "m"), (2, "m"), (7, "M")),
}


def _tri(c: Chord) -> tuple:
    return (c.deg, c.triad)


@S.measures("harmony.progression")
def progression(sc: S.Score) -> S.Result:
    an = analyse(sc)
    why = timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    key = an.key
    sq = seq(an)
    found: dict[str, list[int]] = {}

    def add(label, m):
        found.setdefault(label, []).append(m)

    tonic_q = "M" if key.mode == "major" else "m"
    primary = {(0, tonic_q), (5, tonic_q), (7, "M")}
    vocab = {_tri(c) for c in sq if c.triad not in ("5",)}
    if vocab and vocab <= primary and {d for d, _ in vocab} == {0, 5, 7}:
        add("I-IV-V only" if key.mode == "major" else "i-iv-V only", sq[0].m)
    for a, b in zip(sq, sq[1:]):
        if b.deg == 0 and b.triad == tonic_q and a.deg == 7 and a.triad == "M":
            add(("V7-" if a.seventh == "7" else "V-") + ("I" if key.mode == "major" else "i"), b.m)
        if b.deg == 0 and b.triad == tonic_q and a.deg == 5 and a.triad in ("M", "m") and a.seventh is None:
            add("IV-I" if key.mode == "major" else ("IV-i" if a.triad == "M" else "iv-i"), b.m)
    for a, b, c in zip(sq, sq[1:], sq[2:]):
        if (b.root_pc - a.root_pc) % 12 == 5 and (c.root_pc - b.root_pc) % 12 == 5 and is_dominant(b) \
                and c.triad in ("M", "m") and c.seventh in (None, "maj7", "6", "7"):
            minor = c.triad == "m"
            if minor and a.triad in ("m", "d") and a.seventh in (None, "7"):
                lab = "ii-V-i"
            elif not minor and a.triad == "m" and a.seventh in (None, "7"):
                lab = "ii-V-I"
            else:
                continue
            home = c.deg == 0 and c.triad == tonic_q
            add(lab if home else f"{lab} (local, to {c.label})", c.m)
    tri = [_tri(c) for c in sq]
    i = 0
    while i <= len(tri) - 12:  # four chords played at least three times running
        pat = tri[i:i + 4]
        if pat == tri[i + 4:i + 8] == tri[i + 8:i + 12] and len({d for d, _ in pat}) >= 3:
            add("four-chord loop " + "-".join(c.label for c in sq[i:i + 4]), sq[i].m)
            j = i + 12
            while j + 4 <= len(tri) and tri[j:j + 4] == pat:
                j += 4
            i = j
            continue
        i += 1
    if key.mode == "major":
        for i in range(len(tri) - 3):
            for nm, pat in NAMED_FOUR.items():
                if tuple(tri[i:i + 4]) == pat:
                    add(nm, sq[i].m)
    # rhythm changes: the bridge III7-VI7-II7-V7, each chord holding at least a bar, after an A section with I-vi-ii-V
    for i in range(len(sq) - 3):
        run = sq[i:i + 4]
        if [c.deg for c in run] == [4, 9, 2, 7] and all(c.triad == "M" and c.seventh == "7" for c in run) \
                and all(c.t1 - c.t0 >= an.measure_len[c.m] - 1e-6 for c in run):
            a_found = any(tuple(tri[j:j + 4]) in (NAMED_FOUR["I-vi-ii-V"], ((0, "M"), (9, "M"), (2, "m"), (7, "M")))
                          for j in range(max(0, i - 16), i))
            add("rhythm changes" if a_found else "III7-VI7-II7-V7 chain (no I-vi-ii-V A section before it)", run[0].m)
    value = {k: len(v) for k, v in sorted(found.items())}
    return result(an, value, [m for v in found.values() for m in v])


# =========================================================================== harmony.applied
@S.measures("harmony.applied")
def applied(sc: S.Score) -> S.Result:
    an = analyse(sc)
    why = timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    key = an.key
    sq = seq(an)
    targets = {2, 4, 5, 7, 9} if key.mode == "major" else {3, 5, 7, 8, 10}
    btonic = blues_tonic(sq)
    found: dict[str, list[int]] = {}

    def add(label, m):
        found.setdefault(label, []).append(m)

    tonicised = set()
    for i, (a, b) in enumerate(zip(sq, sq[1:])):
        # secondary dominant: V or V7 of a diatonic chord other than I, chromatic, resolving to it
        if is_dominant(a) and (b.root_pc - a.root_pc) % 12 == 5 and b.deg in targets and b.triad in ("M", "m") \
                and not chord_is_diatonic(a, key) and not (btonic and a.deg == 0):
            add(f"V{'7' if a.seventh == '7' else ''}/{b.label.rstrip('7').replace('maj', '').replace('6', '')}", a.m)
            tonicised.add(b.label.rstrip("7").replace("maj", "").replace("6", ""))
        # secondary leading-tone chord: a diminished chord a semitone below a diatonic target
        if a.triad == "d" and (b.root_pc - a.root_pc) % 12 == 1 and b.deg in targets and not chord_is_diatonic(a, key):
            add(f"vii°/{b.label.rstrip('7').replace('maj', '')}", a.m)
        # tritone substitute: a dominant seventh a semitone above the chord it resolves to
        if a.triad == "M" and a.seventh == "7" and (a.root_pc - b.root_pc) % 12 == 1:
            add("subV7", a.m)
        # chromatic approach chord: a chord of the next chord's quality a semitone away, not in the key
        if (a.triad, a.seventh) == (b.triad, b.seventh) and (a.root_pc - b.root_pc) % 12 in (1, 11) \
                and not chord_is_diatonic(a, key) and a.t1 - a.t0 <= b.t1 - b.t0 + 1e-6:
            add("chromatic approach", a.m)
    for p, a, b in zip(sq, sq[1:], sq[2:]):
        # chromatic passing chord: roots step in one direction through a chord not in the key
        d1 = (a.root_pc - p.root_pc) % 12
        d2 = (b.root_pc - a.root_pc) % 12
        up = d1 in (1, 2) and d2 in (1, 2) and d1 + d2 in (2, 3)
        down = d1 in (10, 11) and d2 in (10, 11) and d1 + d2 in (21, 22)
        if (up or down) and not chord_is_diatonic(a, key) and a.t1 - a.t0 <= max(p.t1 - p.t0, b.t1 - b.t0) + 1e-6:
            add("passing", a.m)
        # tonicisation by a local ii-V
        if (a.root_pc - p.root_pc) % 12 == 5 and (b.root_pc - a.root_pc) % 12 == 5 and is_dominant(a) \
                and p.triad in ("m", "d") and b.deg in targets and b.triad in ("M", "m"):
            tonicised.add(b.label.rstrip("7").replace("maj", "").replace("6", ""))
    value = {k: len(v) for k, v in sorted(found.items())}
    if tonicised:
        value["tonicised"] = sorted(tonicised)
    return result(an, value, [m for v in found.values() for m in v])


# =========================================================================== harmony.voicing
def classify_voicing(midis: list[int], ch: Chord, other_low: int | None = None) -> str:
    ps = sorted(set(midis))
    rel = [(p - ch.root_pc) % 12 for p in ps]
    rs = set(rel)
    tones = {(t - ch.root_pc) % 12 for t in chord_tones(ch)}  # the symbol's own tones (an add9 counts its ninth)
    third = {"M": {4}, "A": {4}, "m": {3}, "d": {3}}.get(ch.triad, set())
    seventh = {"7": {10}, "maj7": {11}, "6": {9}, "o7": {9}}.get(ch.seventh, set())
    if len(ps) >= 3:
        gaps = [b - a for a, b in zip(ps, ps[1:])]
        if all(g == 5 for g in gaps[:-1]) and gaps[-1] in (4, 5) and sum(1 for g in gaps if g == 5) >= 2:
            return "quartal"
    if ch.seventh and 0 in rs and rs <= {0} | third | seventh and len(rs) in (2, 3) and rs & (third | seventh):
        return "shell"
    if ch.seventh and 0 not in rs and third <= rs and seventh <= rs and len(rs) >= 3 and seventh:
        return "rootless"
    if ch.seventh and third and seventh and rs == third | seventh:
        # the third and seventh alone: a shell split between the hands when the other hand sounds the root below
        return "shell (split hands)" if other_low is not None and other_low % 12 == ch.root_pc else "guide tones (3-7)"
    chord_pcs = sorted(tones)
    if len(ps) >= 3 and rs <= tones:
        # adjacent notes skip no chord tone: close; a span over an octave with a chord tone skipped: open
        idx = [chord_pcs.index(r) for r in rel]
        steps = [(b - a) % len(chord_pcs) for a, b in zip(idx, idx[1:])]
        if ps[-1] - ps[1] < 12 and all(s == 1 for s in steps if s):  # upper notes within an octave, no chord tone skipped
            return "close"
        if ps[-1] - ps[0] >= 12:
            return "open"
    return "other"


@S.measures("harmony.voicing")
def voicing(sc: S.Score) -> S.Result:
    an = analyse(sc)
    if an.source != "symbols":
        return S.Result.unknown_because("no chord symbols: a voicing is read against its symbol's root, and a rootless "
                                        "or quartal voicing hides the root from the notes")
    n = sc.notes
    counts: dict[str, int] = {}
    where: dict[str, list[int]] = {}
    for h in ("L", "R"):
        sel = sc.hand == h
        if not sel.any():
            continue
        on = np.round(n["onset_quarter"][sel], 4)
        pi = n["pitch"][sel]
        ms = sc.measure[sel]
        for t in np.unique(on):
            at = on == t
            if at.sum() < 2:
                continue
            ch = chord_at(an, float(t))
            if ch is None:
                continue
            other = (sc.hand != h) & (n["onset_quarter"] <= t + 1e-6) & (n["onset_quarter"] + n["duration_quarter"] > t + 1e-6)
            low = int(n["pitch"][other].min()) if other.any() else None
            v = classify_voicing([int(p) for p in pi[at]], ch, low if low is not None and low < int(pi[at].min()) else None)
            counts[f"{h}:{v}"] = counts.get(f"{h}:{v}", 0) + 1
            where.setdefault(v, []).append(int(ms[at][0]))
    if not counts:
        return S.Result.unknown_because("no hand plays two or more notes at once under a chord symbol")
    return S.Result(value=dict(sorted(counts.items())), provenance="one-witness",
                    where=[m for v, ms in where.items() if v != "other" for m in ms])


# =========================================================================== harmony.bass-behaviour
@S.measures("harmony.bass-behaviour")
def bass_behaviour(sc: S.Score) -> S.Result:
    an = analyse(sc)
    why = timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    if not an.bass:
        return S.Result.unknown_because("no bass line: one staff and the item is not a left-hand part")
    bass = an.bass
    bon = np.array([b[0] for b in bass])
    sq = seq(an)
    # root at the change: the bass note struck with each chord change
    hits = root = slash = 0
    for c in an.chords:  # every printed change, a slash chord over the same root included
        k = np.where(np.abs(bon - c.t0) < 1e-4)[0]
        if not len(k):
            continue
        hits += 1
        pc = bass[k[0]][2] % 12
        if pc == c.root_pc:
            root += 1
        elif c.bass_pc is not None and pc == c.bass_pc:
            slash += 1
    # pedal point: one bass pitch class for every bass note across at least two chord changes, a chord in the span
    # not containing it, and the span at least two bars long (one bar's neighbour chord over a held bass is not one)
    pedals = []
    i = 0
    while i < len(bass):
        j = i
        while j + 1 < len(bass) and bass[j + 1][2] % 12 == bass[i][2] % 12 and bass[j + 1][0] <= bass[j][1] + an.beat_len[bass[j][3]] + 1e-6:
            j += 1
        t0, t1 = bass[i][0], bass[j][1]
        inside = [c for c in sq if c.t0 < t1 - 1e-6 and c.t1 > t0 + 1e-6]
        changes = sum(1 for c in inside if c.t0 > t0 + 1e-6)
        if changes >= 2 and any(bass[i][2] % 12 not in chord_tones(c) for c in inside) \
                and bass[j][3] - bass[i][3] >= 1 and t1 - t0 >= 2 * an.measure_len[bass[i][3]] - 1e-6:
            pedals.append(bass[i][3])
        i = j + 1
    # anticipated bass: the next chord's root struck within the beat before the change, not in the current chord,
    # and no new bass note at the change itself
    antic = []
    for a, b in zip(sq, sq[1:]):
        if a.root_pc == b.root_pc:
            continue
        bl = an.beat_len[b.m]
        for o, e, p, m in bass:
            if b.t0 - bl - 1e-6 <= o < b.t0 - 1e-6 and p % 12 == b.root_pc and p % 12 not in chord_tones(a):
                struck_at = np.any(np.abs(bon - b.t0) < 1e-4)
                if not struck_at or e > b.t0 + 1e-6:
                    antic.append(m)
                break
    value = {"changes_with_bass": hits, "root_on_change": round(root / hits, 3) if hits else None,
             "slash_bass_on_change": slash, "pedal_points": len(pedals), "anticipations": len(antic)}
    return result(an, value, pedals + antic)


# =========================================================================== melody.chord-relation
@S.measures("melody.chord-relation")
def chord_relation(sc: S.Score) -> S.Result:
    an = analyse(sc)
    why = timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    mel = an.melody
    if not mel:
        return S.Result.unknown_because("no melody: the item has no right-hand line")
    key = an.key
    dia = diatonic(key)
    sq = seq(an)
    strong_n = strong_ct = guide = 0
    approach = {"chromatic": 0, "diatonic": 0}
    blue = {"b3": 0, "b5": 0, "b7": 0}
    antic = 0
    where = []
    starts = [c.t0 for c in sq]
    n = sc.notes
    step_at = {(round(float(o), 4), int(p)): str(st) for o, p, st in zip(n["onset_quarter"], n["pitch"], n["step"])}
    tonic_step = "CDEFGAB".index(key.tonic[0])
    for k, (o, e, p, m) in enumerate(mel):
        ch = chord_at(an, o)
        if ch is None:
            continue
        pc = p % 12
        ct = chord_tones(ch)
        is_ct = pc in ct
        if strong(an, sc, o):
            strong_n += 1
            strong_ct += is_ct
            iv = (pc - ch.root_pc) % 12
            if ch.seventh in ("7", "maj7") and iv in ({3, 4} | {10, 11}) and iv in set(TONES.get((ch.triad, ch.seventh), ())):
                guide += 1
        if not is_ct and k + 1 < len(mel):
            no, ne, nxt, nm = mel[k + 1]
            nch = chord_at(an, no)
            if nch is not None and nxt % 12 in chord_tones(nch) and 1 <= abs(nxt - p) <= 2 and not strong(an, sc, o):
                if (pc - key.tonic_pc) % 12 not in dia and abs(nxt - p) == 1:
                    approach["chromatic"] += 1
                elif (pc - key.tonic_pc) % 12 in dia:
                    approach["diatonic"] += 1
                where.append(m)
        d = (pc - key.tonic_pc) % 12
        st = step_at.get((round(o, 4), p))
        gen = ("CDEFGAB".index(st) - tonic_step) % 7 if st in tuple("CDEFGAB") else None
        if key.mode == "major":
            # spelled as a lowered third, fifth or seventh of the key (E flat, G flat, B flat in C): a raised second or
            # fourth (D sharp, F sharp) is a chromatic approach, not a blue note
            b = {(3, 2): "b3", (6, 4): "b5", (10, 6): "b7"}.get((d, gen))
            if b and (not is_ct or (ch.deg == 0 and ch.triad == "M" and ch.seventh == "7")):
                blue[b] += 1
                where.append(m)
        elif d == 6 and gen == 4 and not is_ct:
            blue["b5"] += 1
            where.append(m)
        # anticipation: the next chord's tone, foreign to the current chord, struck within the beat before the change
        # and held into it or repeated on it
        ni = bisect.bisect_right(starts, o + 1e-6)
        nxt_ch = sq[ni] if ni < len(sq) else None
        if nxt_ch is not None and not is_ct and pc in chord_tones(nxt_ch) \
                and nxt_ch.t0 - an.beat_len[m] - 1e-6 <= o < nxt_ch.t0 - 1e-6:
            held = e > nxt_ch.t0 + 1e-6
            repeated = k + 1 < len(mel) and abs(mel[k + 1][0] - nxt_ch.t0) < 1e-4 and mel[k + 1][2] == p
            if held or repeated:
                antic += 1
                where.append(m)
    if not strong_n:
        return S.Result.unknown_because("no melody note on a strong beat under a chord")
    value = {"strong_beat_chord_tones": round(strong_ct / strong_n, 3), "strong_beats": strong_n,
             "guide_tones_on_strong_beats": guide, "approach": approach, "blue": blue, "anticipations": antic}
    return result(an, value, where)


# =========================================================================== texture.bass-walk-up
def _walking(an: Analysis, bass, m: int) -> bool:
    """A bar whose bass strikes a new pitch on every beat (a walking texture)."""
    if m < 0 or m >= len(an.beats_per_bar):
        return False
    notes = [b for b in bass if b[3] == m]
    if len(notes) < an.beats_per_bar[m]:
        return False
    pitches = [b[2] for b in notes]
    return all(p != q for p, q in zip(pitches, pitches[1:]))


@S.measures("texture.bass-walk-up")
def walk_up(sc: S.Score) -> S.Result:
    an = analyse(sc)
    why = timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    if not an.bass:
        return S.Result.unknown_because("no bass line: one staff and the item is not a left-hand part")
    bass = an.bass
    sq = seq(an)
    found = []
    for prev, c in zip(sq, sq[1:]):
        k = next((i for i, b in enumerate(bass) if abs(b[0] - c.t0) < 1e-4), None)
        if k is None or bass[k][2] % 12 != c.root_pc:
            continue
        run = 0
        i = k
        # the approach notes sound under the one chord before the target: a root progression by step
        # (I-ii-iii with one bass note per chord) is not a walk-up
        while i > 0 and 1 <= bass[i][2] - bass[i - 1][2] <= 2 and run < 5 and bass[i - 1][0] >= prev.t0 - 1e-6:
            run += 1
            i -= 1
        # run counts the approach notes; the note before them must not continue the climb
        if 2 <= run <= 4 and not (_walking(an, bass, bass[k - 1][3]) and _walking(an, bass, bass[k - 1][3] - 1)):
            found.append(bass[k - run][3])
    return result(an, {"walk_ups": len(found)}, found)


# =========================================================================== harmony.cadence
def marks(sc: S.Score) -> dict:
    """Marked structure from partitura: repeat spans, endings, double and final bars, fermatas, key changes, D.C./Fine.
    Times in quarters (part 0's measures; every part's marks are pooled)."""
    import partitura.score as ps
    out = {"repeats": [], "endings": [], "bars": [], "fermatas": [], "keys": [], "dacapo": [], "fine": []}
    for part in sc.part_score.parts:
        q = part.quarter_map
        for o in part.iter_all(ps.Repeat):
            out["repeats"].append((float(q(o.start.t)), float(q(o.end.t)) if o.end is not None else None))
        for o in part.iter_all(ps.Ending):
            out["endings"].append((float(q(o.start.t)), float(q(o.end.t)) if o.end is not None else None, str(o.number)))
        for o in part.iter_all(ps.Barline):
            if o.style in ("light-light", "light-heavy", "heavy-light", "heavy-heavy"):
                out["bars"].append((float(q(o.start.t)), o.style))
        for o in part.iter_all(ps.Fermata):
            out["fermatas"].append(float(q(o.start.t)))
        for o in part.iter_all(ps.KeySignature):
            out["keys"].append((float(q(o.start.t)), int(o.fifths)))
        for o in part.iter_all(ps.DaCapo):
            out["dacapo"].append(float(q(o.start.t)))
        for o in part.iter_all(ps.Fine):
            out["fine"].append(float(q(o.start.t)))
        for o in part.iter_all(ps.Words):
            txt = (o.text or "").lower().replace(" ", "")
            if "d.c." in txt or "dacapo" in txt:
                out["dacapo"].append(float(q(o.start.t)))
            if txt.startswith("fine"):
                out["fine"].append(float(q(o.start.t)))
    for k in out:
        out[k] = sorted(set(out[k]))
    return out


def phrase_ends(sc: S.Score, an: Analysis) -> list[tuple[float, str]]:
    """Notated phrase ends only: the final bar, the end of every repeat and double bar, every fermata. (time, kind):
    the time is the moment the cadence's last chord sounds."""
    mk = marks(sc)
    ends = [(an.end, "final")]
    for a, b in mk["repeats"]:
        if b is not None:
            ends.append((b, "repeat"))
    for t, _style in mk["bars"]:
        ends.append((t, "double bar"))
    for t in mk["fermatas"]:
        ends.append((t + 1e-3, "fermata"))
    out = []
    for t, kind in sorted(ends, key=lambda e: (round(e[0], 3), e[1] != "final")):
        if t <= 1e-6 or any(abs(t - u) < 1e-3 for u, _ in out):
            continue
        out.append((t, kind))
    return out


def cadence_at(an: Analysis, sq: list[Chord], t: float, key: Key) -> tuple[str, Chord | None, Chord | None]:
    last = [c for c in sq if c.t0 < t - 1e-6]
    if len(last) < 2:
        return "none", None, None
    y, x = last[-1], last[-2]
    tonic_q = "M" if key.mode == "major" else "m"
    if x.deg == 7 and x.triad == "M" and y.deg == 0 and y.triad == tonic_q:
        return "authentic", x, y
    if x.deg == 11 and x.triad == "d" and y.deg == 0 and y.triad == tonic_q:
        return "authentic (leading-tone)", x, y
    if y.deg == 7 and y.triad == "M":
        return "half", x, y
    if x.deg == 5 and x.triad in ("M", "m") and y.deg == 0 and y.triad == tonic_q:
        return "plagal", x, y
    if x.deg == 7 and x.triad == "M" and ((y.deg == 9 and y.triad == "m") or (y.deg == 8 and y.triad == "M")):
        return "deceptive", x, y
    return "none", x, y


def _outer(sc: S.Score, t: float) -> tuple[int | None, int | None]:
    n = sc.notes
    on = n["onset_quarter"]
    sel = (on <= t + 1e-6) & (on + n["duration_quarter"] > t + 1e-6)
    if not sel.any():
        return None, None
    return int(n["pitch"][sel].min()), int(n["pitch"][sel].max())


@S.measures("harmony.cadence")
def cadence(sc: S.Score) -> S.Result:
    an = analyse(sc)
    why = timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    sq = seq(an)
    out, where = [], []
    for t, kind in phrase_ends(sc, an):
        typ, x, y = cadence_at(an, sq, t, an.key)
        if typ == "authentic":
            # perfect: both chords in root position (the lowest note sounding at each chord's onset is its root) and the
            # tonic on top at the end (the highest note sounding at the last chord's onset)
            bx, _ = _outer(sc, x.t0)
            by, ty = _outer(sc, max(y.t0, min(t - 1e-3, y.t1 - 1e-3)) if kind == "fermata" else y.t0)
            pac = bx is not None and by is not None and bx % 12 == x.root_pc and by % 12 == y.root_pc and ty % 12 == an.key.tonic_pc
            typ = "perfect authentic" if pac else "imperfect authentic"
        m = measure_of(sc, t - 1e-3)
        out.append([m, kind, typ])
        if typ != "none":
            where.append(m)
    return result(an, {"phrase_ends": "notated only (final bar, repeats, double bars, fermatas)", "cadences": out}, where)
