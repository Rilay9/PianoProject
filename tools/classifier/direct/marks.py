"""
The printed marks (docs/classifier/characteristics.yaml, area notation): counted straight from the score, no
musical rule. Primary reader music21; the second witness is a count of the same elements in the raw MusicXML
(for pedal marks, partitura's `SustainPedalDirection` as well). Where the two counts agree the value is
`two-witnesses`; where they disagree the item is UNKNOWN with both numbers, never one of them chosen. The
pickup is `score.load`'s own fact (partitura's measure lengths); the file's `implicit` flag is reported beside
it, because writers often leave that flag off a short first bar.

Every value is a dict with `count`: the number of the printed things, each counted where it is printed (a
dynamic written under both staves is two). `where` is the 0-based measure index of each (part 0's measures,
the same as every module's).
"""
from __future__ import annotations

import collections

import score as S
from . import _common as C


def _result(count: int, where, prov: str = "exact", **extra) -> S.Result:
    v = {"count": count}
    v.update(extra)
    return C.res(value=v, provenance=prov, where=where)


def _checked(count: int, raw: tuple, where, name: str, **extra) -> S.Result:
    """Two witnesses: music21's count and the raw XML's (any of the acceptable raw counts). Disagreement is UNKNOWN."""
    if count in raw:
        return _result(count, where, "two-witnesses", **extra)
    return C.unknown(f"witnesses disagree on {name}: music21 {count}, raw XML {' or '.join(str(r) for r in sorted(set(raw)))}")


def _root_recurse(sc):
    return C.m21(sc).recurse()


def _raw_iter(sc, tag):
    return C.xml_root(sc).iter(tag)


def _span_start_where(sc, spanner) -> list[int]:
    els = spanner.getSpannedElements()
    if not els:
        return []
    q = C.m21_offset(els[0], C.m21(sc))
    return [C.measure_of(sc, q)] if q is not None else []


# --------------------------------------------------------------------------- clef
@C.direct("clef.treble")
def clef_treble(sc: S.Score) -> S.Result:
    """Treble (G clef on line 2, octave-transposed forms included) clef signs printed, music21 `clef.TrebleClef`;
    witness: the raw `<clef>` elements with sign G on line 2. `initial` is the number of staves that open
    with one; `changes` the signs after the opening (`where` lists their measures)."""
    from music21 import clef as m21clef
    root = C.m21(sc)
    treble = [c for c in root.recurse().getElementsByClass(m21clef.Clef) if isinstance(c, m21clef.TrebleClef)]
    initial, changes = 0, []
    for part in (root.parts or [root]):
        first = None
        for c in part.recurse().getElementsByClass(m21clef.Clef):
            if first is None:
                first = c
                if isinstance(c, m21clef.TrebleClef):
                    initial += 1
            elif isinstance(c, m21clef.TrebleClef):
                changes.append(c)
    raw = sum(1 for c in _raw_iter(sc, "clef") if (c.findtext("sign") or "").strip() == "G" and (c.findtext("line") or "2").strip() == "2")
    return _checked(len(treble), (raw,), C.m21_where(sc, changes), "treble clefs", initial=initial, changes=len(changes),
                    transposed=sum(1 for c in treble if getattr(c, "octaveChange", 0)))


# --------------------------------------------------------------------------- dynamics, hairpins
@C.direct("mark.dynamics")
def mark_dynamics(sc: S.Score) -> S.Result:
    """Dynamic letters printed (p, mf, sfz ...), music21 `dynamics.Dynamic`; witness: the children of the raw
    `<dynamics>` elements. `distinct` lists the values used."""
    from music21 import dynamics
    dyn = list(_root_recurse(sc).getElementsByClass(dynamics.Dynamic))
    raw = sum(len(list(d)) for d in _raw_iter(sc, "dynamics"))
    return _checked(len(dyn), (raw,), C.m21_where(sc, dyn), "dynamics", distinct=sorted({d.value for d in dyn if d.value}))


@C.direct("mark.hairpin")
def mark_hairpin(sc: S.Score) -> S.Result:
    """Crescendo and diminuendo wedges, music21 `dynamics.Crescendo` / `Diminuendo` (the `<wedge>` spanners),
    positioned at the first note each spans; witness: the raw `<wedge>` starts."""
    from music21 import dynamics
    cres = list(_root_recurse(sc).getElementsByClass(dynamics.Crescendo))
    dim = list(_root_recurse(sc).getElementsByClass(dynamics.Diminuendo))
    where = C.merge_where(*[_span_start_where(sc, s) for s in cres + dim])
    raw = sum(1 for w in _raw_iter(sc, "wedge") if w.get("type") in ("crescendo", "diminuendo"))
    return _checked(len(cres) + len(dim), (raw,), where, "hairpins", crescendo=len(cres), diminuendo=len(dim))


# --------------------------------------------------------------------------- articulations, slurs
def _articulations(sc):
    from music21 import articulations
    out = []
    for n in C.sounding_notes(C.m21(sc)):
        for a in n.articulations:
            if isinstance(a, articulations.TechnicalIndication):
                continue  # fingerings and string/fret marks are not articulations; mark.fingering counts them
            out.append((n, a))
    return out


@C.direct("mark.articulation")
def mark_articulation(sc: S.Score) -> S.Result:
    """Articulation marks on notes and chords (staccato, staccatissimo, accent, strong accent, tenuto, breath and
    caesura marks), music21 `articulations.Articulation` less the technical indications (fingerings). A chord
    carries its mark once. Witness: the children of the raw `<articulations>`, counted over every note
    or over each chord's first note (a writer repeats a chord's mark on its notes or not). `kinds` counts by name."""
    arts = _articulations(sc)
    kinds = collections.Counter(type(a).__name__.lower() for _, a in arts)
    a_all = a_lead = 0
    for nt in _raw_iter(sc, "note"):
        k = sum(len(list(ar)) for ar in nt.iter("articulations"))
        a_all += k
        if nt.find("chord") is None:
            a_lead += k
    return _checked(len(arts), (a_all, a_lead), C.m21_where(sc, [n for n, _ in arts]), "articulations", kinds=dict(sorted(kinds.items())))


@C.direct("mark.slur")
def mark_slur(sc: S.Score) -> S.Result:
    """Slurs printed (the `<slur>` start/stop pairs music21 closes into `spanner.Slur`), positioned at the first note
    each covers; witness: the raw `<slur type="start">` count."""
    from music21 import spanner
    sl = list(_root_recurse(sc).getElementsByClass(spanner.Slur))
    raw = sum(1 for s in _raw_iter(sc, "slur") if s.get("type") == "start")
    return _checked(len(sl), (raw,), C.merge_where(*[_span_start_where(sc, s) for s in sl]), "slurs")


# --------------------------------------------------------------------------- pedal
@C.direct("mark.pedal")
def mark_pedal(sc: S.Score) -> S.Result:
    """Sustain-pedal presses, music21 `expressions.PedalMark` (the spanner music21 builds from a `<pedal>` start and
    its stop). `count` is the number of presses; `symbol` and `line` split it by how it is printed ("Ped." and
    "*" signs, or a bracket line); positioned at the first note each covers. Witnesses: the raw `<pedal>` starts
    (type start, plus change, which restarts the pedal) and partitura's `SustainPedalDirection` count; a
    value is `two-witnesses` only where all three agree, otherwise UNKNOWN with the three numbers."""
    from music21 import expressions
    import partitura.score as ps
    pm = list(_root_recurse(sc).getElementsByClass(expressions.PedalMark))
    forms = collections.Counter(str(p.pedalForm) for p in pm)
    raw = sum(1 for p in _raw_iter(sc, "pedal") if p.get("type") in ("start", "change"))
    pt = sum(len(list(part.iter_all(ps.SustainPedalDirection))) for part in sc.part_score.parts)
    if not (len(pm) == raw == pt):
        return C.unknown(f"witnesses disagree on pedal marks: music21 {len(pm)}, raw XML {raw}, partitura {pt}")
    return _result(len(pm), C.merge_where(*[_span_start_where(sc, p) for p in pm]), "two-witnesses",
                   symbol=forms.get("symbol", 0), line=forms.get("line", 0))


# --------------------------------------------------------------------------- ornaments, tremolo
@C.direct("mark.ornament")
def mark_ornament(sc: S.Score) -> S.Result:
    """Ornaments: trills, mordents, turns and the like (music21 `expressions.Ornament` on a note, tremolo
    excluded because mark.tremolo counts it), plus grace notes (`duration.isGrace`; a grace chord is one).
    Witness: the raw `<ornaments>` children (less tremolo, wavy-line, accidental-mark) plus the `<grace/>`
    notes that are not chord followers. `kinds` counts by class name, grace notes under `grace`."""
    from music21 import expressions
    kinds = collections.Counter()
    hits = []
    for n in C.sounding_notes(C.m21(sc)):
        for e in n.expressions:
            if isinstance(e, expressions.Ornament) and not isinstance(e, expressions.Tremolo):
                kinds[type(e).__name__.lower()] += 1
                hits.append(n)
        if n.duration.isGrace:
            kinds["grace"] += 1
            hits.append(n)
    raw = sum(1 for orn in _raw_iter(sc, "ornaments") for c in orn if c.tag not in ("tremolo", "wavy-line", "accidental-mark"))
    raw += sum(1 for nt in _raw_iter(sc, "note") if nt.find("grace") is not None and nt.find("chord") is None)
    return _checked(sum(kinds.values()), (raw,), C.m21_where(sc, hits), "ornaments", kinds=dict(sorted(kinds.items())))


@C.direct("mark.tremolo")
def mark_tremolo(sc: S.Score) -> S.Result:
    """Tremolo marks, music21 `expressions.Tremolo` (single-note slashes) and `TremoloSpanner` (between two notes);
    witness: raw `<tremolo>` of type single or start."""
    from music21 import expressions
    hits = []
    for n in C.sounding_notes(C.m21(sc)):
        hits += [n for e in n.expressions if isinstance(e, expressions.Tremolo)]
    spans = list(_root_recurse(sc).getElementsByClass(expressions.TremoloSpanner))
    where = C.merge_where(C.m21_where(sc, hits), *[_span_start_where(sc, s) for s in spans])
    raw = sum(1 for t in _raw_iter(sc, "tremolo") if t.get("type", "single") in ("single", "start"))
    return _checked(len(hits) + len(spans), (raw,), where, "tremolos", single=len(hits), between_notes=len(spans))


# --------------------------------------------------------------------------- 8va, fermata
@C.direct("mark.ottava")
def mark_ottava(sc: S.Score) -> S.Result:
    """8va / 8vb / 15ma / 15mb lines, music21 `spanner.Ottava`, positioned at the first note each covers; witness: the
    raw `<octave-shift>` starts (type up or down). `kinds` counts by music21's type."""
    from music21 import spanner
    ot = list(_root_recurse(sc).getElementsByClass(spanner.Ottava))
    kinds = collections.Counter(str(o.type) for o in ot)
    raw = sum(1 for t in _raw_iter(sc, "octave-shift") if t.get("type") in ("up", "down"))
    return _checked(len(ot), (raw,), C.merge_where(*[_span_start_where(sc, s) for s in ot]), "ottava lines", kinds=dict(sorted(kinds.items())))


@C.direct("mark.fermata")
def mark_fermata(sc: S.Score) -> S.Result:
    """Fermatas on notes, rests and barlines, music21 `expressions.Fermata`; witness: the raw `<fermata>` elements,
    counted over every note or over each chord's first note and the barlines."""
    from music21 import expressions
    hits = []
    for el in _root_recurse(sc):
        exps = getattr(el, "expressions", None)
        if exps and any(isinstance(e, expressions.Fermata) for e in exps):
            hits.append(el)
    n = sum(sum(1 for e in el.expressions if isinstance(e, expressions.Fermata)) for el in hits)
    f_all = sum(1 for _ in _raw_iter(sc, "fermata"))
    f_lead = sum(1 for nt in _raw_iter(sc, "note") if nt.find("chord") is None for _ in nt.iter("fermata"))
    f_lead += sum(1 for bl in _raw_iter(sc, "barline") for _ in bl.iter("fermata"))
    return _checked(n, (f_all, f_lead), C.m21_where(sc, hits), "fermatas")


# --------------------------------------------------------------------------- repeats
@C.direct("mark.repeat")
def mark_repeat(sc: S.Score) -> S.Result:
    """Repeat structure printed: repeat barlines (`bar.Repeat`, start or end), volta brackets (`RepeatBracket`) and
    navigation marks (segno, coda, D.C., D.S., fine: `repeat.RepeatMark`). A mark written under both staves of
    one bar is one mark (counted once per measure and direction, per bracket number, per navigation
    kind). `count` is their sum. Witness for the barlines and voltas: the raw `<repeat direction>` per measure
    and the raw `<ending type="start">` per measure and number; navigation marks are music21 alone."""
    from music21 import bar, repeat, spanner
    root = C.m21(sc)
    seen: dict[tuple[int, str], object] = {}
    for rp in root.recurse().getElementsByClass(bar.Repeat):
        q = C.m21_offset(rp, root)
        if q is None:
            continue
        mi = C.measure_of(sc, q - 1e-3 if rp.direction == "end" else q)
        seen[(mi, rp.direction)] = rp
    uniq: dict = {}
    for b in root.recurse().getElementsByClass(spanner.RepeatBracket):
        w = _span_start_where(sc, b)
        uniq.setdefault((w[0] if w else -1, str(b.number)), b)
    brackets = list(uniq.values())
    nav_pos = {}
    for r in root.recurse().getElementsByClass(repeat.RepeatMark):
        if isinstance(r, bar.Repeat):
            continue  # a repeat barline is counted above
        m = r.getContextByClass("Measure")
        key = (type(r).__name__, getattr(m, "number", None), round(float(r.offset), 3))
        nav_pos.setdefault(key, C.measure_of(sc, C.m21_offset(r, root) or 0.0))
    raw_rep, raw_end = set(), set()
    for p in C.xml_parts(sc):
        for mi, meas in enumerate(p.findall("measure")):
            for bl in meas.findall("barline"):
                r = bl.find("repeat")
                if r is not None:
                    raw_rep.add((mi, r.get("direction")))
            for e in meas.iter("ending"):
                if e.get("type") == "start":
                    raw_end.add((mi, e.get("number")))
    starts = sum(1 for _, d in seen if d == "start")
    ends = sum(1 for _, d in seen if d == "end")
    r_starts = sum(1 for _, d in raw_rep if d == "forward")
    r_ends = sum(1 for _, d in raw_rep if d == "backward")
    if (starts, ends, len(brackets)) != (r_starts, r_ends, len(raw_end)):
        return C.unknown(f"witnesses disagree on repeats: music21 {starts} starts, {ends} ends, {len(brackets)} endings; "
                         f"raw XML {r_starts}, {r_ends}, {len(raw_end)}")
    where = C.merge_where([m for m, _ in seen], *[_span_start_where(sc, b) for b in brackets], list(nav_pos.values()))
    return _result(len(seen) + len(brackets) + len(nav_pos), where, "two-witnesses",
                   starts=starts, ends=ends, endings=len(brackets), navigation=len(nav_pos))


# --------------------------------------------------------------------------- fingering, pickup
@C.direct("mark.fingering")
def mark_fingering(sc: S.Score) -> S.Result:
    """Fingering digits printed over notes, music21 `articulations.Fingering`; witness: the raw `<fingering>`
    elements. `notes` is the number of notes or chords carrying at least one."""
    from music21 import articulations
    hits, total = [], 0
    for n in C.sounding_notes(C.m21(sc)):
        f = [a for a in n.articulations if isinstance(a, articulations.Fingering)]
        if f:
            hits.append(n)
            total += len(f)
    raw = sum(1 for _ in _raw_iter(sc, "fingering"))
    return _checked(total, (raw,), C.m21_where(sc, hits), "fingerings", notes=len(hits))


@C.direct("mark.anacrusis")
def mark_anacrusis(sc: S.Score) -> S.Result:
    """A pickup (anacrusis) bar: the first measure is shorter than its time signature (`score.load`'s `pickup`, from
    partitura's measure lengths, so a short first bar counts whether or not the writer set `implicit="yes"`).
    `count` is 1 or 0; `quarters` the pickup's length; `flagged` whether the file marks the bar implicit."""
    parts = C.xml_parts(sc)
    first = parts[0].find("measure") if parts else None
    flagged = bool(first is not None and first.get("implicit") == "yes")
    if sc.pickup:
        length = sc.measure_starts[1] - sc.measure_starts[0]
        return _result(1, [0], quarters=round(float(length), 4), flagged=flagged)
    return _result(0, [], flagged=flagged)
