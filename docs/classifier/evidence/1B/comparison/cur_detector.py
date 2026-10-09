"""The project's current detectors, as chunk-1 validators re-implemented them, wrapped as functions.

- key.tonic-mode: `H.analyse(sc).key` is the first version (rules/harmony.py infer_key); `keyfix.infer_key2` is the
  corrected ending vote. Both are called unchanged (keyfix.py is imported from ../validation).
- key.change: validation/t_kc.py is a script, not a module. Its helper functions (ks_key, relation, sounding_pcs, excluded)
  are loaded by executing the source above its `out = {}` line, unchanged. The per-item loop body (lines after
  `for idx, it in enumerate(ITEMS)`) is turned into the function `kc_areas` below with the loop's I/O removed and
  nothing else changed (same window 4, area 4, 8-note minimum, same cadence search, same exclusion).
"""
from cmp_common import *
import numpy as np

W, L = 4, 4

_SRC = (VALID / "t_kc.py").read_text(encoding="utf-8")
_head = _SRC.split("\nout = {}\n", 1)[0]
_ns = {"__name__": "t_kc_funcs"}
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
_saved = sys.argv
sys.argv = ["t_kc_funcs"]
exec(compile(_head, str(VALID / "t_kc.py"), "exec"), _ns)   # common.py (validation/) also runs: reads the catalogue
sys.argv = _saved
ns = _ns                                                      # also carries validation/common.py's BYID, ITEMS, load
ks_key = _ns["ks_key"]
excluded = _ns["excluded"]
sounding_pcs = _ns["sounding_pcs"]
kc_relation = _ns["relation"]
import rules.harmony as H                                    # noqa: E402  (after the path set-up)
from keyfix import infer_key2                                 # noqa: E402


def global_key(sc):
    """-> (an, first, corrected, ks) each (pc, mode) or None; corrected = (pc, mode, conf) or None."""
    an = H.analyse(sc)
    first = (an.key.tonic_pc, an.key.mode) if an.key else None
    res, info, flags = infer_key2(sc, an)
    corr = (res[0], res[1]) if res else None
    ks = tuple(info["ks"]) if info.get("ks") else None
    return an, first, (corr, res[2] if res else None, flags), ks


def local_windows(sc):
    """Raw per-bar local key of the current detector: partitura estimate_key over bars b-1 .. b+2 (None under 8 notes)."""
    n = sc.notes
    nb = len(sc.measure_starts)
    loc = []
    for b in range(nb):
        sel = (sc.measure >= b - 1) & (sc.measure <= b + W - 2)
        loc.append(ks_key(n[sel]) if sel.sum() >= 8 else None)
    return loc


def kc_areas(sc, an, local=None):
    """The writer's areas and cadences (t_kc.py loop body). Returns None when home is UNKNOWN or the item has under 8
    bars, else a list of {bars, key, relation, first_version, corrected}."""
    n = sc.notes
    nb = len(sc.measure_starts)
    home = (an.key.tonic_pc, an.key.mode) if an.key else None
    if home is None or nb < 8:
        return None, home
    if local is None:
        local = local_windows(sc)
    areas, b = [], 0
    while b < nb:
        k = local[b]
        e = b
        while e + 1 < nb and local[e + 1] == k:
            e += 1
        if k is not None and k != home and e - b + 1 >= L:
            areas.append([b, e, k])
        b = e + 1
    sq = H.seq(an) if not an.unknown else []
    res = []
    on = n["onset_quarter"]
    for a, e, k in areas:
        on_dom = k[0] == (home[0] + 7) % 12
        cads = []
        for x, y in zip(sq, sq[1:]):
            if a - 1 <= y.m <= e + 1 and x.root_pc == (k[0] + 7) % 12 and x.triad == "M" and y.root_pc == k[0] and y.triad == ("M" if k[1] == "major" else "m") and abs(y.beat - 1) < 1e-6:
                cads.append(("chords", y.m, y.t0))
        if not sq:
            for bb in range(max(1, a - 1), min(nb, e + 2)):
                t = sc.measure_starts[bb]
                at = (on <= t + 1e-6) & (on + n["duration_quarter"] > t + 1e-6)
                if not at.any() or int(n["pitch"][at].min()) % 12 != k[0]:
                    continue
                before = [x for x in an.bass if x[0] < t - 1e-6]
                if not before or before[-1][2] % 12 != (k[0] + 7) % 12:
                    continue
                if ((n["pitch"][sc.measure == bb - 1] % 12) == (k[0] + 11) % 12).any():
                    cads.append(("bass", bb, t))
        first = cads[0] if cads else None
        kept, excl = None, []
        for by, m, t in cads:
            hit = excluded(sc, an, sq, home, t, m, by) if on_dom else []
            if hit:
                excl.append([by, m, [list(h) for h in hit]])
            else:
                kept = [by, m]
                break
        res.append({"bars": [a, e], "key": [k[0], k[1]], "relation": kc_relation(home, k),
                    "first_version": [first[0], first[1]] if first else None, "corrected": kept, "excluded": excl,
                    "timeline": bool(sq)})
    return res, home


def timelines(nb, home, areas):
    """Per-bar key series from areas: home everywhere, the area's key inside an area. Three variants:
    all (every area), first (areas with a cadence, first version), corr (areas confirmed after the exclusion)."""
    out = {}
    for name, keep in (("all", lambda a: True), ("first", lambda a: a["first_version"] is not None), ("corr", lambda a: a["corrected"] is not None)):
        t = [list(home)] * nb
        for a in areas:
            if keep(a):
                for b in range(a["bars"][0], a["bars"][1] + 1):
                    t[b] = a["key"]
        out[name] = t
    return out
