"""Natural errors with a rule-given answer: the generated seventh-arpeggio family (keyless items, spelled by chord).

Ground truth, from the chord and not from any tool: in `exercise.arpeggio7.<root>-<quality>7.2oct.both` every chord is root, third,
fifth, seventh of the named chord, so its four letters are the root's letter and the letters 2, 4 and 6 steps above it
(letter = the one the interval name requires; the accidental then follows from the sounding pitch). A note whose letter is not one of
the four is a misspelling (the 'D for E double-flat' of the half-diminished A-flat arpeggio on rules/area-1B.md is one);
a note whose letter is one of the four is taken as correctly spelled. Compared per method at the note level (test 2b: a note is
flagged if it belongs to a flagged pair, matched by bar and written name). -> sp_arp7.json, frag_arp7.md
"""
from cmp_common import *
import sp_lib as L
import numpy as np, re, collections

PREP = json.load(open(HERE / "sp_prepare.json", encoding="utf8"))
PKS = BUILD / "sp_pks"; IN = BUILD / "sp_in"
LET = "CDEFGAB"
FIELDS = ["onset_beat", "duration_beat", "onset_div", "duration_div", "step", "alter", "octave", "pitch", "onset_quarter",
          "duration_quarter", "ks_fifths", "voice", "staff"]
KINDS = ["kind2", "ps13_diff", "pks_diff", "pks_gate", "both_diff", "both_gate", "t2b", "t2b_fix", "t2b_fix2"]


def root_letter(i):
    m = re.match(r"exercise\.arpeggio7\.([a-g])(?:-(?:flat|sharp))?-([a-z-]+?)7\.", i)
    return (m.group(1).upper(), m.group(2)) if m else (None, None)


def main():
    items = [it["id"] for it in BYID.values() if it["id"].startswith("exercise.arpeggio7.")]
    out = {"items": {}, "totals": {}}
    tot = collections.defaultdict(lambda: collections.Counter())
    for i in sorted(items):
        letter, quality = root_letter(i)
        pr = PREP["cat:" + i]
        d = np.load(IN / (pr["hash"] + ".npz"))
        notes = np.zeros(len(d["pitch"]), dtype=[(f, d[f].dtype) for f in FIELDS])
        for f in FIELDS:
            notes[f] = d[f]
        est = ps13(notes)
        pk = json.load(open(PKS / (pr["hash"] + ".json")))
        ps, pa = L.pks_arrays(pk["tpc"])
        m = L.masks(notes, est, ps, pa)
        meas = d["measure"]
        names = [L.to_m21_name(str(notes["step"][k]), int(notes["alter"][k])) + str(int(notes["octave"][k])) for k in range(len(notes))]
        w = walk_path(CONTENT / BYID[i]["file"], "sp_" + pr["hash"])
        hits = L.t2b_hits(w)
        fl = {"t2b": set(), "t2b_fix": set(), "t2b_fix2": set()}
        by = collections.defaultdict(list)
        for k in range(len(notes)):
            by[(int(meas[k]), names[k])].append(k)
        for h in hits:
            ks_ = by.get((h["m"], h["a"]), []) + by.get((h["m"], h["b"]), []) + by.get((h["m"] + 1, h["b"]), [])
            for kk in ks_:
                fl["t2b"].add(kk)
                if h["cleared"] in (None, "dim-unison"): fl["t2b_fix"].add(kk)
                if h["cleared"] is None: fl["t2b_fix2"].add(kk)
        li = LET.index(letter)
        ok_letters = {LET[(li + s) % 7] for s in (0, 2, 4, 6)}
        wrong = [k for k in range(len(notes)) if str(notes["step"][k]) not in ok_letters]
        rec = {"root_letter": letter, "quality": quality, "notes": len(notes), "wrong_notes": len(wrong), "ks": sorted(set(int(x) for x in notes["ks_fifths"]))}
        for kd in KINDS:
            flagged = set(np.where(m[kd])[0]) if kd in m else fl[kd]
            tp = len(flagged & set(wrong)); fp = len(flagged - set(wrong))
            rec[kd] = {"flagged": len(flagged), "on_wrong": tp, "on_correct": fp}
            tot[kd]["wrong_caught"] += tp; tot[kd]["false"] += fp; tot[kd]["flagged"] += len(flagged)
            if wrong and tp: tot[kd]["items_with_error_caught"] += 1
            if not wrong and fp: tot[kd]["correct_items_flagged"] += 1
        tot["_"]["notes"] += len(notes); tot["_"]["wrong"] += len(wrong); tot["_"]["items"] += 1
        tot["_"]["items_with_error"] += 1 if wrong else 0
        out["items"][i] = rec
    out["totals"] = {k: dict(v) for k, v in tot.items()}
    wrong_items = {i: r["wrong_notes"] for i, r in out["items"].items() if r["wrong_notes"]}
    out["wrong_items"] = wrong_items
    json.dump(out, open(HERE / "sp_arp7.json", "w", encoding="utf8"), indent=1)
    t = out["totals"]["_"]
    lines = [f"**Seventh-arpeggio family: {t['items']} items, {t['notes']:,} notes, {t['wrong']} misspelled notes in {t['items_with_error']} items ({', '.join(sorted(wrong_items))}).**\n",
             "| method | flagged notes | on misspelled notes (caught of %d) | on correct notes (false flags) | items with an error where it flags a misspelled note | correct items it flags |" % t["wrong"],
             "| --- | --- | --- | --- | --- | --- |"]
    lab = {"kind2": "current: spelling filter (PS13 + gate; no exception for keyless chord items)", "ps13_diff": "ps13, every difference",
           "pks_diff": "PKSpell, every difference", "pks_gate": "PKSpell with the gate", "both_diff": "ps13 and PKSpell agree",
           "both_gate": "the same, with the gate", "t2b": "current: test 2b", "t2b_fix": "test 2b with fix v1", "t2b_fix2": "test 2b with fix v2"}
    for kd in KINDS:
        v = out["totals"][kd]
        lines.append(f"| {lab[kd]} | {v['flagged']} | {v['wrong_caught']} of {t['wrong']} | {v['false']} | {v.get('items_with_error_caught', 0)} of {t['items_with_error']} | {v.get('correct_items_flagged', 0)} of {t['items'] - t['items_with_error']} |")
    (HERE / "frag_arp7.md").write_text("\n".join(lines) + "\n", encoding="utf8")
    print("\n".join(lines)); print(wrong_items)


if __name__ == "__main__":
    main()
