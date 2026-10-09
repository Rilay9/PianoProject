"""Reproduction check: this folder's flag code against the validators' own functions (r_sanity.spelling, r_sanity.test2b executed
from source, untruncated), and against the counts validation.md row 26 gives. Writes sp_check_repro.json.

For every item: the validator's PS13 difference count and kind-2 candidates against sp_lib's; the validator's test 2b count against
sp_lib.t2b_hits'; plus, where the validation row states a figure, that figure.
"""
from cmp_common import *
import sp_lib as L
import numpy as np

rs = _rs = None
import cmp_common as C
rs = C._load_sanity()

ROW = {   # figures validation.md row 26 and rules/area-1A.md section 26 state for these items
    "song.classical.c418-minecraft-nether.pdmx": {"ps13_differs": 65, "kind2": 30},
    "song.classical.bach-invention-no-9-in-f-minor-bwv-780.pdmx": {"kind2": 4, "t2b": 13},
    "exercise.scale.a-harmonic-minor.1oct.similar.both.2": {"t2b": 4},
    "exercise.chromatic.d.1oct.right": {"t2b": 10},
    "exercise.arpeggio7.a-flat-minor7.2oct.both": {"kind2": 8},
}
ITEMS = list(ROW) + ["exercise.scale.g-sharp-harmonic-minor.1oct.similar.both.2", "exercise.blues-scale.b-flat.1oct.right",
                     "song.classical.chopin-nocturne-in-e-flat-major-op-9-no-2.pdmx", "exercise.hanon.01.both",
                     "exercise.arpeggio7.a-flat-half-diminished7.2oct.both"]


def main():
    out = {}
    for i in ITEMS:
        if i not in BYID:
            out[i] = {"missing": True}; continue
        v = rs.spelling(i)
        w = rs.cache(i)
        v2 = rs.test2b(w)
        sc, ok = load_notes(CONTENT / BYID[i]["file"])
        est = ps13(sc.notes)
        m = L.masks(sc.notes, est)
        hits = L.t2b_hits(w)
        r = {"validator_ps13_differs": v["ps13_differs"], "mine_ps13_differs": int(m["ps13_diff"].sum()),
             "validator_kind2": v["candidates"], "mine_kind2": int(m["kind2"].sum()),
             "validator_2b": v2["count"], "mine_2b": len(hits), "mine_2b_after_fix": sum(1 for h in hits if h["cleared"] is None),
             "row_states": ROW.get(i)}
        r["same"] = (r["validator_ps13_differs"] == r["mine_ps13_differs"] and r["validator_kind2"] == r["mine_kind2"]
                     and r["validator_2b"] == r["mine_2b"])
        out[i] = r
        print(i, json.dumps(r))
    json.dump(out, open(HERE / "sp_check_repro.json", "w", encoding="utf8"), indent=1)
    print("all same:", all(v.get("same") for v in out.values() if "missing" not in v))


if __name__ == "__main__":
    main()
