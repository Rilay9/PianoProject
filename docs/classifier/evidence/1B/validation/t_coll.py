"""Section 8 scale.collection as corrected: item and hand level (equality, at most 7 pitch classes, with the tonic),
passage level (scale runs of >= 6 single notes, named by the local key; the direction test; 'part of' and
'contained in'); and section 6's run-level minor form on the same runs. Writes coll_v.json."""
from common import *
import time, warnings, collections
import numpy as np
from partitura.musicanalysis import estimate_key
import rules.harmony as H
from rules.texture import view
from rules.technique import scale_runs

NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SEVEN = {  # collection: (intervals, {tonic offset from root: name})
    "diatonic": ((0, 2, 4, 5, 7, 9, 11), {0: "ionian (major)", 2: "dorian", 4: "phrygian", 5: "lydian", 7: "mixolydian", 9: "aeolian (natural minor)", 11: "locrian"}),
    "harmonic minor": ((0, 2, 3, 5, 7, 8, 11), {0: "harmonic minor", 7: "Phrygian dominant"}),
    "melodic minor": ((0, 2, 3, 5, 7, 9, 11), {0: "melodic minor (ascending)", 5: "Lydian dominant", 11: "altered"}),
    "pentatonic": ((0, 2, 4, 7, 9), {0: "major pentatonic", 9: "minor pentatonic"}),
    "b3 pentatonic": ((0, 2, 3, 7, 9), {0: "b3 pentatonic"}),
    "blues scale": ((0, 3, 5, 6, 7, 10), {0: "blues scale"}),
    "whole-tone": ((0, 2, 4, 6, 8, 10), None),
}
BIG = {"melodic minor, both directions": (0, 2, 3, 5, 7, 8, 9, 10, 11), "dominant bebop": (0, 2, 4, 5, 7, 9, 10, 11),
       "major bebop": (0, 2, 4, 5, 7, 8, 9, 11), "octatonic": (0, 1, 3, 4, 6, 7, 9, 10)}


def sets(iv):
    return [(r, frozenset((r + i) % 12 for i in iv)) for r in range(12)]


def item_name(pcs, tonic):
    n = len(pcs)
    if n == 12:
        return "all twelve pitch classes", "twelve"
    if n < 5:
        return f"fewer than five ({n})", "few"
    if n <= 7:
        for c, (iv, names) in SEVEN.items():
            for r, s in sets(iv):
                if s == pcs:
                    if names is None:
                        return c, "named"
                    if tonic is not None and (tonic - r) % 12 in names:
                        return f"{names[(tonic - r) % 12]} on {NAMES[tonic]}", "named"
                    return f"{c} set on {NAMES[r]} (tonic not its own)", "set-of"
        return f"set only ({n})", "set only"
    cont = [c for c, iv in BIG.items() for r, s in sets(iv) if pcs <= s]
    return f"set only ({n}){' contained in ' + ', '.join(sorted(set(cont))) if cont else ''}", "set only"


def ks_key(sub):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        k = estimate_key(sub)
    minor = k.endswith("m")
    nm = k[:-1] if minor else k
    return ((PC[nm[0]] + nm[1:].count("#") - nm[1:].count("b")) % 12, "minor" if minor else "major")


def local_keys(sc, home):
    n = sc.notes
    nb = len(sc.measure_starts)
    loc = [home] * nb
    if nb < 8:
        return loc
    win = []
    for b in range(nb):
        sel = (sc.measure >= b - 1) & (sc.measure <= b + 2)
        win.append(ks_key(n[sel]) if sel.sum() >= 8 else None)
    b = 0
    while b < nb:
        k = win[b]
        e = b
        while e + 1 < nb and win[e + 1] == k:
            e += 1
        if k is not None and k != home and e - b + 1 >= 4:
            for x in range(b, e + 1):
                loc[x] = k
        b = e + 1
    return loc


MAJOR = (0, 2, 4, 5, 7, 9, 11)
NAT, HARM, MEL = (0, 2, 3, 5, 7, 8, 10), (0, 2, 3, 5, 7, 8, 11), (0, 2, 3, 5, 7, 9, 11)


def passage_name(pcs, lk):
    n = len(pcs)
    t, mode = lk
    scale = MAJOR if mode == "major" else NAT
    if frozenset((t + i) % 12 for i in scale) == pcs:
        return f"{NAMES[t]} {'major' if mode == 'major' else 'natural minor'} scale (local key)", "local key"
    if mode == "minor":
        for nm, iv in (("harmonic minor", HARM), ("melodic minor (ascending)", MEL)):
            if frozenset((t + i) % 12 for i in iv) == pcs:
                return f"{NAMES[t]} {nm} (local key)", "local key"
    CHORD_SCALE = {"Phrygian dominant", "Lydian dominant", "altered"}
    for c, (iv, names) in SEVEN.items():
        if len(iv) == n:
            for r, s in sets(iv):
                if s == pcs:
                    if c == "whole-tone":
                        return "whole-tone", "set"
                    # reading: a non-diatonic collection is named by the local tonic when that tonic gives it a
                    # non-chord-scale name in the table (pentatonics, b3 pentatonic, blues, harmonic and melodic minor)
                    off = (t - r) % 12
                    if c != "diatonic" and names and off in names and names[off] not in CHORD_SCALE:
                        return f"{names[off]} on {NAMES[t]} (local key)", "local key"
                    return f"{c} set on {NAMES[r]} (mode to the agent)", "parent set"
    if n == 12:
        return "chromatic", "set"
    # contained
    if pcs <= frozenset((t + i) % 12 for i in scale):
        return f"part of {NAMES[t]} {'major' if mode == 'major' else 'natural minor'} scale", "part of"
    if mode == "minor":
        for nm, iv in (("harmonic minor", HARM), ("melodic minor (ascending)", MEL)):
            if pcs <= frozenset((t + i) % 12 for i in iv):
                return f"part of {NAMES[t]} {nm} scale", "part of"
    cont = sorted({c for c, (iv, _) in SEVEN.items() for r, s in sets(iv) if pcs <= s})
    if cont:
        return "contained in " + ", ".join(cont), "contained in"
    return f"set only ({n})", "set only"


def minor_run_form(degs_seq, direction):
    """section 6 run level: variable degrees passed (8, 9, 10, 11) and direction -> answer."""
    v = sorted({d for d in degs_seq if d in (8, 9, 10, 11)})
    s = set(v)
    if s == {9, 11}:
        return "melodic minor, ascending form" if direction > 0 else "melodic minor, raised forms descending"
    if s == {8, 10}:
        return "natural minor"
    if s == {8, 11}:
        return "harmonic minor"
    if len(s) == 1:
        return f"undetermined (one variable degree {v[0]})"
    if not s:
        return "no variable degree"
    return f"other {v}"


only = set(sys.argv[1:])
out = {}
t0 = time.time()
for idx, it in enumerate(ITEMS):
    p = pipeline(it)
    if only and it["id"] not in only:
        continue
    if p == "generated" and fam(it) not in ("scale", "pentatonic", "blues_scale", "modal_vamp", "octave_scale", "double_scale", "chromatic", "five_finger"):
        continue
    rec = {"p": p, "fam": fam(it)}
    try:
        if one_line_staff(it):
            continue
        sc = load(it)
        n = sc.notes
        if not len(n):
            continue
        an = H.analyse(sc)
        home = (an.key.tonic_pc, an.key.mode) if an.key else None
        rec["home"] = home
        tonic = home[0] if home else None
        pcs = frozenset(int(x) % 12 for x in n["pitch"])
        rec["item"] = item_name(pcs, tonic)
        rec["n_item"] = len(pcs)
        rec["hands"] = {h: item_name(frozenset(int(x) % 12 for x in n["pitch"][sc.hand == h]), tonic) for h in sorted(set(sc.hand.tolist()))}
        v = view(sc)
        runs = []
        if not v.unknown and home:
            loc = local_keys(sc, home)
            for h, evs in v.hands.items():
                for i, j, kind in scale_runs(v, h):
                    if kind in ("thirds", "sixths", "octaves"):
                        continue
                    seg = evs[i:j + 1]
                    rp = frozenset(e.low % 12 for e in seg)
                    lk = loc[seg[0].bar]
                    direction = 1 if seg[-1].low > seg[0].low else -1
                    nm, how = passage_name(rp, lk)
                    form = minor_run_form([(e.low - lk[0]) % 12 for e in seg], direction) if lk[1] == "minor" else None
                    runs.append({"h": h, "bar": seg[0].bar, "n": len(seg), "npc": len(rp), "dir": direction, "lk": [lk[0], lk[1]],
                                 "name": nm, "how": how, "form": form, "pcs": sorted(rp)})
            # the direction test: an ascending run with 9 and 11 and the next descending run with 10 and 8, one minor key area
            for a, b in zip(runs, runs[1:]):
                if a["h"] == b["h"] and a["lk"] == b["lk"] and a["lk"][1] == "minor" and a["dir"] > 0 and b["dir"] < 0:
                    da = {(x - a["lk"][0]) % 12 for x in a["pcs"]}
                    db = {(x - b["lk"][0]) % 12 for x in b["pcs"]}
                    if {9, 11} <= da and {8, 10} <= db:
                        a["direction_test"] = b["direction_test"] = "melodic minor, both directions"
        rec["runs"] = runs
    except Exception as ex:  # noqa
        rec["error"] = repr(ex)[:150]
    out[it["id"]] = rec
    if idx % 200 == 0:
        print(idx, round(time.time() - t0), flush=True)
json.dump(out, open(OUT / ("coll_v_sel.json" if only else "coll_v.json"), "w"), indent=0, default=list)
print("done", round(time.time() - t0))
