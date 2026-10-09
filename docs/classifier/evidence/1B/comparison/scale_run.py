"""scale.collection: the current detector and music21 deriveRanked on the catalogue (item level and passage level).
Writes scale_results.json. Tonal is run afterwards by scale_tonal.py on the sets this file records.

Items: (1) the 374 generated items of the families whose recipe declares a collection (scale, pentatonic, blues_scale,
modal_vamp, octave_scale, double_scale, chromatic, five_finger: the validators' own list in t_coll.py); (2) every readable real
item (one-line-staff items and unreadable ones left out, as t_coll.py does).
Expected answers (fixed before any method was scored; see the page, section 1):
  generated: from the recipe: family, the id's sub-kind and keySig (tonic);
  real with a key in the title (t_keys.py reference(), executed unchanged): the project's table name of the item's pitch-class set
  at the title's tonic if the set equals a table collection of at most 7 pitch classes, else "none";
  real without a title key: set-level only (does the set equal a collection of the table).
Usage: python -X utf8 scale_run.py [limit]
"""
from scale_lib import *
from multiprocessing import Pool

_tk = (VALID / "t_keys.py").read_text(encoding="utf-8").split("\nonly = set(sys.argv[1:])\n", 1)[0]
_tkns = {"__name__": "t_keys_funcs"}
_s = sys.argv
sys.argv = ["t_keys_funcs"]
exec(compile(_tk, str(VALID / "t_keys.py"), "exec"), _tkns)
sys.argv = _s
reference = _tkns["reference"]

GEN_FAMS = ("scale", "pentatonic", "blues_scale", "modal_vamp", "octave_scale", "double_scale", "chromatic", "five_finger")
M21_NAMES = ["Major", "Minor", "HarmonicMinor", "MelodicMinor", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Locrian",
             "WholeTone", "Octatonic", "WeightedHexatonicBlues", "Chromatic"]
_m21_cache = {}


def parse_ks(ks):
    import re
    m = re.match(r"^([A-Ga-g])([#b]?)\s+(major|minor)$", ks.strip())
    pc = (PCN[m.group(1).upper()] + (1 if m.group(2) == "#" else -1 if m.group(2) == "b" else 0)) % 12
    return pc, m.group(3)


def expected_generated(it):
    """-> (label or None, tonic or None, why)"""
    f, i = fam(it), it["id"]
    ks = it.get("keySig")
    t = parse_ks(ks)[0] if ks else None
    if f == "scale":
        sub = i.split(".")[2]
        if "harmonic" in sub:
            return "harmonic minor", t, "recipe: harmonic minor scale"
        if "melodic" in sub:
            return None, t, "recipe: melodic minor scale, up and down: 9 pitch classes at item level, no 7-class name (the page's rule)"
        if "natural" in sub:
            return "aeolian (natural minor)", t, "recipe: natural minor scale"
        return "ionian (major)", t, "recipe: major scale"
    if f in ("octave_scale", "double_scale"):
        return "ionian (major)", t, "recipe: major scale in octaves / thirds / sixths"
    if f == "pentatonic":
        if i.endswith(".blues"):
            return "blues scale", t, "recipe: blues scale"
        return "minor pentatonic", t, "recipe: minor pentatonic"
    if f == "blues_scale":
        return "blues scale", t, "recipe: blues scale"
    if f == "modal_vamp":
        return "aeolian (natural minor)", t, "recipe: minor vamp i, bVII, bVI (natural minor)"
    if f == "chromatic":
        return "all twelve", None, "recipe: chromatic scale"
    if f == "five_finger":
        return None, t, "recipe: five-finger pattern (a pentachord is not a scale)"
    raise ValueError(f)


def spelling_of(it):
    """Most frequent spelled name (music21 'name', e.g. 'E-', 'F#') of each pitch class in the item's score, read with music21's
    converter (the project's note array has no spelling; the blues class of deriveRanked depends on it). -> ({pc: name}, seconds)"""
    from music21 import converter
    t0 = time.perf_counter()
    s = converter.parse(str(CONTENT / it["file"]))
    cnt = {}
    for p in s.flatten().pitches:
        cnt.setdefault(int(p.pitchClass), {}).setdefault(p.name, 0)
        cnt[int(p.pitchClass)][p.name] += 1
    return {pc: max(d, key=d.get) for pc, d in cnt.items()}, time.perf_counter() - t0


def m21_cands(S, spell=None):
    """deriveRanked of every scale class on the pitch set S (one pitch per class, spelled as the score spells it). -> (list of
    {cls, tonic, w, pcs, n}, seconds, cached). Full matches only are kept (weight == |S|), Chromatic only when |S| == 12;
    duplicate (class, tonic pc) removed."""
    spell = spell or {}
    key = (frozenset(S), tuple(sorted((pc, spell.get(pc)) for pc in S)))
    if key in _m21_cache:
        return _m21_cache[key][0], _m21_cache[key][1], True
    from music21 import scale
    names = [spell.get(x, SHARP[x]) for x in sorted(S)]
    n = len(S)
    t0 = time.perf_counter()
    out, seen = [], set()
    for cn in M21_NAMES:
        cls = getattr(scale, cn if cn.endswith("Scale") or cn == "WeightedHexatonicBlues" else cn + "Scale")
        res = cls().deriveRanked(names, resultsReturned=12, comparisonAttribute="pitchClass")
        for w, sc in res:
            if w != n or (cn == "Chromatic" and n != 12):
                continue
            tpc = int(sc.tonic.pitchClass)
            if (cn, tpc) in seen:
                continue
            seen.add((cn, tpc))
            pcs = sorted({int(p.pitchClass) for p in sc.pitches})
            out.append({"cls": cn, "tonic": tpc, "w": int(w), "pcs": pcs, "n": len(pcs)})
    dt = time.perf_counter() - t0
    _m21_cache[key] = (out, dt)
    return out, dt, False


def run_item(idx):
    it = ITEMS[idx]
    p = pipeline(it)
    rec = {"id": it["id"], "p": p, "fam": fam(it)}
    try:
        if one_line_staff(it):
            rec["skip"] = "one-line staff"
            return rec
        sc = load(it)
        n = sc.notes
        if not len(n):
            rec["skip"] = "no notes"
            return rec
        t = time.perf_counter()
        an = H.analyse(sc)
        rec["sec_key"] = time.perf_counter() - t
        home = (an.key.tonic_pc, an.key.mode) if an.key else None
        rec["home"] = list(home) if home else None
        T = home[0] if home else None
        S = frozenset(int(x) % 12 for x in n["pitch"])
        rec["S"] = sorted(S)
        # expected
        if p == "generated":
            e, et, why = expected_generated(it)
            rec["exp"] = {"label": e, "tonic": et, "why": why}
            ref_t = et
        else:
            ref = reference(it)
            if ref:
                ref_t = int(ref[0])
                l, tt = lab(S, ref_t) if (len(S) <= 7 or len(S) == 12) else (None, ref_t)
                if l and "tonic not its own" in l:
                    l = None
                rec["exp"] = {"label": l, "tonic": ref_t, "why": f"title key {key_str((ref[0], ref[1]))} ({ref[2]}); name of the set at that tonic by the project's table"}
            else:
                ref_t = None
                rec["exp"] = None
        rec["ref_t"] = ref_t
        # current detector
        t = time.perf_counter()
        cu = item_name(S, T)
        rec["cur"] = {"res": list(cu), "sec": time.perf_counter() - t}
        if ref_t is not None:
            rec["cur_ref"] = list(item_name(S, ref_t))
        # music21
        try:
            spell, sec_parse = spelling_of(it)
        except Exception as ex:  # noqa
            spell, sec_parse = {}, None
            rec["spell_error"] = repr(ex)[:100]
        c, dt, _ = m21_cands(S, spell)
        rec["m21"] = {"cands": c, "sec": dt, "sec_parse": sec_parse}
        c2, dt2, _ = m21_cands(S, {})          # sharps-only spelling, to show what the spelling changes
        rec["m21_sharp"] = {"cands": c2, "sec": dt2}
        # passage level: generated items and the page's real positive
        if p == "generated" or "el-condor-pasa" in it["id"]:
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
                        t = time.perf_counter()
                        nm, how = passage_name(rp, lk)
                        sec_cur = time.perf_counter() - t
                        cands, sec_m, cached = m21_cands(rp, spell)
                        runs.append({"h": h, "bar": seg[0].bar, "n": len(seg), "dir": direction, "lk": [lk[0], lk[1]],
                                     "pcs": sorted(rp), "cur": [nm, how], "sec_cur": sec_cur,
                                     "m21": cands, "sec_m21": sec_m, "m21_cached": cached})
            rec["runs"] = runs
    except Exception as ex:  # noqa
        rec["error"] = repr(ex)[:200]
    return rec


if __name__ == "__main__":
    idxs = []
    for i, it in enumerate(ITEMS):
        p = pipeline(it)
        if p == "generated" and fam(it) not in GEN_FAMS:
            continue
        idxs.append(i)
    lim = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if lim:
        idxs = idxs[::max(1, len(idxs) // lim)][:lim]
    print("items", len(idxs), flush=True)
    t0 = time.time()
    out = []
    with Pool(3, maxtasksperchild=40) as pool:
        for k, r in enumerate(pool.imap(run_item, idxs, chunksize=4)):
            out.append(r)
            if k % 100 == 0:
                print(k, round(time.time() - t0), flush=True)
    json.dump(out, open(HERE / ("scale_results.json" if not lim else f"scale_pilot{lim}.json"), "w"))
    print("done", round(time.time() - t0), "errors", sum(1 for r in out if "error" in r), "skipped", sum(1 for r in out if "skip" in r))
