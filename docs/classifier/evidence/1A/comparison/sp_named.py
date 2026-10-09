"""The items the validation row names, flag by flag, with each method's verdict -> sp_named.json.

For each item: every flag of the current detector (kind 2 notes, test 2b pairs) and, for the kind-2 candidates, what ps13 and PKSpell
say; for each flag whether each method also flags that note (note-level methods: either note of a 2b pair) or keeps/clears it
(the fix). Context = the three notes before and after in the same part/staff/voice, as written.
"""
from cmp_common import *
import sp_lib as L
import numpy as np, hashlib

PREP = json.load(open(HERE / "sp_prepare.json", encoding="utf8"))
PKS = BUILD / "sp_pks"; IN = BUILD / "sp_in"
ITEMS = {
    "minecraft": "song.classical.c418-minecraft-nether.pdmx",
    "inv9": "song.classical.bach-invention-no-9-in-f-minor-bwv-780.pdmx",
    "a_harm_minor": "exercise.scale.a-harmonic-minor.1oct.similar.both.2",
    "gs_harm_minor": "exercise.scale.g-sharp-harmonic-minor.1oct.similar.both.2",
    "chromatic_d": "exercise.chromatic.d.1oct.right",
    "arp_ab_min7": "exercise.arpeggio7.a-flat-minor7.2oct.both",
    "arp_ab_halfdim": "exercise.arpeggio7.a-flat-half-diminished7.2oct.both",
}
NOTE_KINDS = ["kind2", "ps13_diff", "pks_diff", "pks_gate", "both_diff", "both_gate"]


def analyse(item_id):
    key = "cat:" + item_id
    pr = PREP[key]
    d = np.load(IN / (pr["hash"] + ".npz"))
    FIELDS = ["onset_beat", "duration_beat", "onset_div", "duration_div", "step", "alter", "octave", "pitch", "onset_quarter",
              "duration_quarter", "ks_fifths", "voice", "staff"]
    notes = np.zeros(len(d["pitch"]), dtype=[(f, d[f].dtype) for f in FIELDS])
    for f in FIELDS:
        notes[f] = d[f]
    est = ps13(notes)
    pk = json.load(open(PKS / (pr["hash"] + ".json")))
    ps, pa = L.pks_arrays(pk["tpc"])
    m = L.masks(notes, est, ps, pa)
    meas = d["measure"]
    name = lambda i: L.to_m21_name(str(notes["step"][i]), int(notes["alter"][i])) + str(int(notes["octave"][i]))
    idx = {}
    for i in range(len(notes)):
        idx.setdefault((int(meas[i]), name(i)), []).append(i)

    def at(mm, nm):
        return idx.get((mm, nm), [])

    w = walk_path(CONTENT / BYID[item_id]["file"], "sp_" + pr["hash"])
    hits = L.t2b_hits(w)
    # context from the walk
    seq = {}
    for n in w["notes"]:
        if L.struck(n) and not n["grace"] and not n["chord"]:
            seq.setdefault((n["part"], n["staff"], n["voice"]), []).append(n)
    for k in seq:
        seq[k].sort(key=lambda n: n["t"])

    def ctx(part, mm, nm_a):
        for k, ns in seq.items():
            if k[0] != part:
                continue
            for j, n in enumerate(ns):
                nn = n["step"] + {0: "", 1: "#", -1: "-", 2: "##", -2: "--"}[int(n["alter"])] + str(n["octave"])
                if n["m"] == mm and nn == nm_a:
                    return " ".join(
                        ("[" + (x["step"] + {0: "", 1: "#", -1: "-", 2: "##", -2: "--"}[int(x["alter"])] + str(x["octave"])) + "]") if x is n
                        else (x["step"] + {0: "", 1: "#", -1: "-", 2: "##", -2: "--"}[int(x["alter"])] + str(x["octave"]))
                        for x in ns[max(0, j - 3): j + 4])
        return ""

    import collections as _c
    bd = _c.Counter()
    for i in np.where(m["ps13_diff"] | m["pks_diff"])[0]:
        bd[f"{L.to_m21_name(str(notes['step'][i]), int(notes['alter'][i]))} -> ps13 {L.to_m21_name(str(est['step'][i]), int(est['alter'][i]))} / PKSpell {L.to_m21_name(ps[i], pa[i])}"] += 1
    flagged_notes = {kd: sorted({(int(meas[i]), name(i)) for i in np.where(m[kd])[0]}) for kd in NOTE_KINDS}
    out = {"flagged_notes": flagged_notes, "diff_breakdown": dict(bd), "item": item_id, "n_notes": int(len(notes)), "ks": sorted(set(int(x) for x in notes["ks_fifths"])),
           "counts": {k: int(v.sum()) for k, v in m.items()}, "t2b": [], "kind2": []}
    for h in hits:
        cand = at(h["m"], h["a"]) + at(h["m"] + 1, h["b"]) + at(h["m"], h["b"])
        rec = dict(h)
        for kd in NOTE_KINDS:
            rec[kd] = bool(any(m[kd][i] for i in cand))
        rec["t2b"] = True
        rec["t2b_fix"] = h["cleared"] in (None, "dim-unison")
        rec["t2b_fix2"] = h["cleared"] is None
        rec["ctx"] = ctx(h["part"], h["m"], h["a"])
        out["t2b"].append(rec)
    for i in np.where(m["kind2"])[0]:
        rec = {"bar": int(meas[i]) + 1, "written": name(i), "ps13": L.to_m21_name(str(est["step"][i]), int(est["alter"][i])),
               "pks": L.to_m21_name(ps[i], pa[i]), "ks": int(notes["ks_fifths"][i])}
        for kd in NOTE_KINDS:
            rec[kd] = bool(m[kd][i])
        part = 0
        rec["ctx"] = ""
        for pi in range(len(w["parts"])):
            c = ctx(pi, int(meas[i]), name(i))
            if c:
                rec["ctx"] = c; break
        # test 2b involvement
        rec["t2b_pair"] = any(h["m"] in (int(meas[i]), int(meas[i]) - 1) and name(i) in (h["a"], h["b"]) for h in hits)
        out["kind2"].append(rec)
    return out


def main():
    res = {k: analyse(v) for k, v in ITEMS.items()}
    # the 13 notes in 8 generated items (kind 1, missing accidentals) and what the spelling tools say about them
    import common
    missing = {}
    for it in BYID.values():
        i = it["id"]
        if not i.startswith("exercise."):
            continue
        w = walk.cache(i)
        mm = [(n["m"], n["step"] + str(n["octave"]), int(n["alter"])) for n, c, info in common.accidental_model(w) if c == "missing"]
        if mm:
            missing[i] = mm
    res["kind1_missing_accidentals"] = {"items": len(missing), "notes": sum(len(v) for v in missing.values()), "by_item": missing}
    # spelling tools on those notes: any flag at the note?
    flagged = {}
    for i, mm in missing.items():
        a = analyse(i)
        hitnames = {(h["m"], h["a"]) for h in a["t2b"]} | {(h["m"], h["b"]) for h in a["t2b"]} | {(h["m"] + 1, h["b"]) for h in a["t2b"]}
        mine = [(mm_, n_ + ("" if al == 0 else ""), al) for mm_, n_, al in missing[i]]
        def nm_(n_, al):
            return n_[0] + {0: "", 1: "#", -1: "-"}[al] + n_[1:]
        hit_by = {kd: sum(1 for mm_, n_, al in missing[i] if (mm_, nm_(n_, al)) in set(map(tuple, a["flagged_notes"][kd]))) for kd in NOTE_KINDS}
        hit_by["t2b"] = sum(1 for mm_, n_, al in missing[i] if (mm_, nm_(n_, al)) in hitnames)
        flagged[i] = {"kind2_counts": a["counts"]["kind2"], "ps13_diff": a["counts"]["ps13_diff"], "pks_diff": a["counts"]["pks_diff"],
                      "t2b_pairs": len(a["t2b"]), "missing_notes": len(missing[i]), "missing_notes_flagged_by": hit_by}
    res["kind1_missing_accidentals"]["spelling_flags_in_those_items"] = flagged
    # arpeggio7 half-diminished family: chord-tone spelling by interval from the root
    fam = {}
    for it in BYID.values():
        i = it["id"]
        if ".arpeggio7." in i and "half-diminished7" in i:
            fam[i] = None
    res["_half_dim_items"] = sorted(fam)
    json.dump(res, open(HERE / "sp_named.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
    for k in ITEMS:
        r = res[k]
        print("=====", k, r["item"], r["counts"])
        for h in r["t2b"][:20]:
            print("  2b", h["m"] + 1, h["a"], h["b"], h["iv"], "fix:", h["cleared"], {kd: h[kd] for kd in NOTE_KINDS if h[kd]}, "|", h["ctx"])
        for h in r["kind2"][:40]:
            print("  k2 bar", h["bar"], h["written"], "ps13", h["ps13"], "pks", h["pks"], {kd: h[kd] for kd in NOTE_KINDS if h[kd]}, "2b:", h["t2b_pair"], "|", h["ctx"])
    print(json.dumps(res["kind1_missing_accidentals"], indent=0)[:3000])


if __name__ == "__main__":
    main()
