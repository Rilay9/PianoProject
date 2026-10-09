"""Catch rate on injected misspellings (an addition to the brief's small known-error set; labelled injected, not natural; 3% of eligible notes, at least 3 a piece).

Rule, fixed before it was run: for every correct score of the ground-truth sets (wir 81, m21ch 380, m21kb 9) take the pitched notes
that are not grace notes, carry no tie, whose (measure, MIDI pitch) is unique in the piece and whose pitch class has a second
spelling with at most one accidental (C/B#, C#/Db, D#/Eb, E/Fb, F/E#, F#/Gb, G#/Ab, A#/Bb, B/Cb; D, G and A have none). Choose
min(all, max(3, round(3% of them))) with random.Random("<key>|20261008"), respell each to its other spelling (octave adjusted so the
sounding pitch is unchanged), drop the note's <accidental> element, and write the piece to build/sp_inject/. Every method is then
run on the injected file exactly as sp_run.py runs it on the clean file; a method catches an injection if it flags the injected
note (note-level kinds) or a pair of consecutive notes that contains it and that it did not flag in the clean file (test 2b).
ps13 and PKSpell see only pitch classes and durations, so their predictions are those of the clean file (asserted equal).
Split by whether the original spelling was diatonic to the key signature in force ("in-key") or not ("chromatic").
"""
from cmp_common import *
import sp_lib as L
import cmp_common as C
import numpy as np, random, hashlib
from multiprocessing import Pool
import xml.etree.ElementTree as ET

PREP = json.load(open(HERE / "sp_prepare.json", encoding="utf8"))
PKS = BUILD / "sp_pks"; IN = BUILD / "sp_in"
INJ = BUILD / "sp_inject"; INJ.mkdir(exist_ok=True)
SEED = "20261008"
PC_SPELLINGS = {0: [("C", 0), ("B", 1)], 1: [("C", 1), ("D", -1)], 3: [("D", 1), ("E", -1)], 4: [("E", 0), ("F", -1)],
                5: [("F", 0), ("E", 1)], 6: [("F", 1), ("G", -1)], 8: [("G", 1), ("A", -1)], 10: [("A", 1), ("B", -1)],
                11: [("B", 0), ("C", -1)]}
METHODS = ["kind2", "pks_gate", "both_gate", "ps13_diff", "pks_diff", "both_diff", "t2b", "t2b_fix", "t2b_fix2"]


def other_spelling(step, alter, midi):
    pc = midi % 12
    if pc not in PC_SPELLINGS:
        return None
    for s, a in PC_SPELLINGS[pc]:
        if (s, a) != (step, alter):
            oct_ = (midi - STEP_PC[s] - a) // 12 - 1
            return s, a, oct_
    return None


def name(step, alter, octave):
    return step + {0: "", 1: "#", -1: "-"}[alter] + str(octave)


def one(p):
    key = p["key"]
    pr = PREP[key]
    if "hash" not in pr:
        return {"key": key, "skipped": "no note table"}
    d = np.load(IN / (pr["hash"] + ".npz"))
    root = C._root_xml(p["path"])
    cand = []
    for pi, part in enumerate(root.findall("part")):
        for mi, meas in enumerate(part.findall("measure")):
            for el in meas.findall("note"):
                pit = el.find("pitch")
                if pit is None or el.find("grace") is not None or el.find("tie") is not None or el.find("notations/tied") is not None:
                    continue
                step = pit.find("step").text
                alter = int(float(pit.findtext("alter", "0")))
                octave = int(pit.find("octave").text)
                midi = 12 * (octave + 1) + STEP_PC[step] + alter
                o = other_spelling(step, alter, midi)
                if o is None or abs(alter) > 1:
                    continue
                cand.append((pi, mi, el, step, alter, octave, midi, o))
    # uniqueness of (measure, midi) in the clean note table
    cnt = {}
    for m, pt in zip(d["measure"], d["pitch"]):
        cnt[(int(m), int(pt))] = cnt.get((int(m), int(pt)), 0) + 1
    cand = [c for c in cand if cnt.get((c[1], c[6]), 0) == 1]
    if not cand:
        return {"key": key, "skipped": "no candidates"}
    rng = random.Random(f"{key}|{SEED}")
    k = min(len(cand), max(3, round(0.03 * len(cand))))
    chosen = rng.sample(cand, k)
    for pi, mi, el, step, alter, octave, midi, o in chosen:
        pit = el.find("pitch")
        pit.find("step").text = o[0]
        al = pit.find("alter")
        if o[1] == 0:
            if al is not None:
                pit.remove(al)
        else:
            if al is None:
                al = ET.Element("alter"); pit.insert(1, al)
            al.text = str(o[1])
        pit.find("octave").text = str(o[2])
        acc = el.find("accidental")
        if acc is not None:
            el.remove(acc)
    f = INJ / (pr["hash"] + ".musicxml")
    ET.ElementTree(root).write(f, encoding="utf-8", xml_declaration=True)
    # ---- run every method on the injected file
    sc, ok = load_notes(f)
    notes = sc.notes
    clean = notes_clean = d
    if len(notes) != len(d["pitch"]) or not np.array_equal(notes["pitch"], d["pitch"]):
        return {"key": key, "skipped": "injected file reads differently (pitch arrays differ)"}
    est = ps13(notes)
    pk = json.load(open(PKS / (pr["hash"] + ".json")))
    ps, pa = L.pks_arrays(pk["tpc"])
    m = L.masks(notes, est, ps, pa)
    # clean masks for the baseline of test 2b
    w_clean = walk_path(p["path"], "sp_" + pr["hash"])
    base = {(h["m"], h["a"], h["b"]) for h in L.t2b_hits(w_clean)}
    w_inj = walk_path(f, "spinj_" + pr["hash"])
    hits = [h for h in L.t2b_hits(w_inj) if (h["m"], h["a"], h["b"]) not in base]
    f_arr = notes["ks_fifths"].astype(int)
    recs = []
    for pi, mi, el, step, alter, octave, midi, o in chosen:
        sel = np.where((sc.measure == mi) & (notes["pitch"] == midi))[0]
        if len(sel) != 1:
            continue
        i = int(sel[0])
        assert str(notes["step"][i]) == o[0] and int(notes["alter"][i]) == o[1], "injected note not found as injected"
        nm = name(o[0], o[1], o[2])
        orig_diat = bool(L.diat_arr(np.array([step]), np.array([alter]), np.array([f_arr[i]]))[0])
        inj_diat = bool(L.diat_arr(np.array([o[0]]), np.array([o[1]]), np.array([f_arr[i]]))[0])
        rec = {"key": key, "m": mi, "orig": name(step, alter, octave), "injected": nm, "orig_diatonic": orig_diat,
               "injected_diatonic": inj_diat, "ps13_says": L.to_m21_name(str(est["step"][i]), int(est["alter"][i])),
               "pks_says": L.to_m21_name(ps[i], pa[i])}
        for mt in ("kind2", "pks_gate", "both_gate", "ps13_diff", "pks_diff", "both_diff"):
            rec[mt] = bool(m[mt][i])
        rel = [h for h in hits if (h["m"] in (mi, mi - 1)) and nm in (h["a"], h["b"])]
        rec["t2b"] = bool(rel)
        rec["t2b_fix"] = any(h["cleared"] in (None, "dim-unison") for h in rel)
        rec["t2b_fix2"] = any(h["cleared"] is None for h in rel)
        recs.append(rec)
    return {"key": key, "set": p["set"], "n_injected": len(recs), "n_candidates": len(cand), "recs": recs}


def main():
    pieces = [p for p in json.load(open(HERE / "sp_pieces.json", encoding="utf8"))["pieces"] if p["set"] in ("wir", "m21ch", "m21kb")]
    out = []
    with Pool(8) as pool:
        for r in pool.imap_unordered(one, pieces, chunksize=2):
            out.append(r)
    out.sort(key=lambda r: r["key"])
    json.dump(out, open(HERE / "sp_inject_results.json", "w", encoding="utf8"), ensure_ascii=False)
    print("pieces", len(out), "skipped", sum(1 for r in out if "skipped" in r), "injections", sum(r.get("n_injected", 0) for r in out))
    for r in out:
        if "skipped" in r:
            print(r)


if __name__ == "__main__":
    main()
