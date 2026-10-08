"""
The sections a score states about itself (docs/classifier/characteristics.yaml, area form).
"""
from __future__ import annotations

import collections

import numpy as np

import score as S
from . import _common as C


@C.direct("form.sections")
def form_sections(sc: S.Score) -> S.Result:
    """Sections the score marks: a new section starts at a measure that follows a repeat sign (`repeat`: the bar
    after a backward repeat, or a forward repeat's own bar), follows a double or final barline (`double`:
    light-light, light-heavy, heavy-light, heavy-heavy barlines that are not a repeat's), carries a rehearsal
    mark (`rehearsal`), or opens in a different key signature than the bar before (`key`). Read from the raw
    barlines and rehearsal marks and the key in force in the note array. `sections` is the number of boundaries plus
    one; `boundaries` lists the starting measure of each later section and `by_kind` counts them (a place marked
    twice counts under each kind, once as a boundary). The final barline is not a boundary. `where` lists the
    boundaries."""
    parts = C.xml_parts(sc)
    if not parts:
        return C.unknown("no parts")
    nbar = max(len(p.findall("measure")) for p in parts)
    kinds: dict[int, set] = collections.defaultdict(set)
    for part in parts:
        for mi, meas in enumerate(part.findall("measure")):
            for bl in meas.findall("barline"):
                loc = bl.get("location", "right")
                rep = bl.find("repeat")
                style = (bl.findtext("bar-style") or "").strip()
                if rep is not None:
                    if rep.get("direction") == "forward" and mi > 0:
                        kinds[mi].add("repeat")
                    elif rep.get("direction") == "backward" and mi + 1 < nbar:
                        kinds[mi + 1].add("repeat")
                elif style in ("light-light", "light-heavy", "heavy-light", "heavy-heavy") and loc == "right" and mi + 1 < nbar:
                    kinds[mi + 1].add("double")
            for rh in meas.iter("rehearsal"):
                if mi > 0:
                    kinds[mi].add("rehearsal")
    n = sc.notes
    if len(n):
        first_key = {}
        for i in np.argsort(np.round(n["onset_quarter"].astype(float), 5), kind="stable"):
            m = int(sc.measure[i])
            if m not in first_key:
                first_key[m] = (int(n["ks_fifths"][i]), int(n["ks_mode"][i]) if not np.isnan(float(n["ks_mode"][i])) else 0)
        ms = sorted(first_key)
        for a, b in zip(ms, ms[1:]):
            if first_key[a] != first_key[b]:
                kinds[b].add("key")
    by_kind = collections.Counter(k for ks in kinds.values() for k in ks)
    b = sorted(kinds)
    return C.res({"sections": len(b) + 1, "boundaries": b, "by_kind": {k: by_kind.get(k, 0) for k in ("repeat", "double", "rehearsal", "key")}},
                 where=b)
