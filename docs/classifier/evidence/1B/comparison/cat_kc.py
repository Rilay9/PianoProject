"""key.change on the named catalogue items of validation row 7: Bach Inventions 1-15 (No. 1 is unreadable by the project's
score reader: score.py line 109), Mozart K. 545 i, WTC I Prelude 1, Happy Birthday (piano, PDMX).

Where each expected answer comes from:
  K. 545 i, WTC I Prelude 1 : the When in Rome annotation of the same work (build/when-in-rome, wir_pieces.json): expected
      areas = runs of at least 4 bars whose annotated local key differs from the annotated global key. The catalogue score
      is another edition than When in Rome's: the bar counts are compared and printed; the bars are used only if they match.
  Inventions 2-15           : reading (the standard analysis, as stated on rules/area-1B.md section 7 validation paragraph:
      every Invention modulates to the dominant or the relative key). Expected = at least one area of at least 4 bars in the
      relation dominant or relative, confirmed by a cadence. No annotated Inventions exist in When in Rome (checked: Bach
      under Keyboard_Other holds only WTC I and II).
  Happy Birthday            : reading (a V/V-V half cadence in C major; the check on rules/area-1B.md): expected = no
      confirmed modulation.
Writes cat_kc_results.json: per item, the series and areas of the current detector (first version / corrected confirmation),
music21 floatingKey (smoothed), music21 4-bar-window Bellman-Budge / Aarden-Essen, all with the reference home key.
"""
from cmp_common import *
import cur_detector as C

NS = C.ns
BYID, load = NS["BYID"], NS["load"]
reference = None
_src = (VALID / "t_keys.py").read_text(encoding="utf-8").split("\nonly = set(sys.argv[1:])\n", 1)[0]
_n2 = {"__name__": "t_keys_funcs"}
_sv = sys.argv
sys.argv = ["x"]
exec(compile(_src, "t_keys.py", "exec"), _n2)
sys.argv = _sv
reference = _n2["reference"]

INV = [f"song.classical.bach-invention-no-{n}-in-{k}.pdmx" for n, k in [
    (1, "c-major-bwv-772"), (2, "c-minor-bwv-773"), (3, "d-major-bwv-774"), (4, "d-minor-bwv-775"), (5, "e-flat-major-bwv-776"),
    (6, "e-major-bwv-777"), (7, "e-minor-bwv-778"), (8, "f-major-bwv-779"), (9, "f-minor-bwv-780"), (10, "g-major-bwv-781"),
    (11, "g-minor-bwv-782"), (12, "a-major-bwv-783"), (13, "a-minor-bwv-784"), (14, "b-flat-major-bwv-785"), (15, "b-minor-bwv-786")]]
ITEMS_NAMED = [(i, "reading: invention modulates to the dominant or relative key") for i in INV] + [
    ("song.classical.mozart-k545-i", "When in Rome: Corpus/Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K545/1"),
    ("song.classical.bach-wtc1-prelude-1", "When in Rome: Corpus/Keyboard_Other/Bach,_Johann_Sebastian/The_Well-Tempered_Clavier_I/01"),
    ("song.folk.happy-birthday-piano.pdmx", "reading: no modulation (V/V-V half cadence in C major)")]
WIR_OF = {"song.classical.mozart-k545-i": "Corpus/Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K545/1",
          "song.classical.bach-wtc1-prelude-1": "Corpus/Keyboard_Other/Bach,_Johann_Sebastian/The_Well-Tempered_Clavier_I/01"}


def areas_from_series(series, home, L=4):
    """Runs of at least L bars with the same key different from home (a None breaks a run), as t_kc.py."""
    nb = len(series)
    out, b = [], 0
    while b < nb:
        k = series[b]
        k = tuple(k) if k is not None else None
        e = b
        while e + 1 < nb and (tuple(series[e + 1]) if series[e + 1] is not None else None) == k:
            e += 1
        if k is not None and k != tuple(home) and e - b + 1 >= L:
            out.append({"bars": [b, e], "key": list(k), "relation": C.kc_relation(home, k)})
        b = e + 1
    return out


def m21_series(path):
    from music21 import converter
    from music21.analysis import floatingKey
    s = converter.parse(path)
    out = {}
    t = time.perf_counter()
    ka = floatingKey.KeyAnalyzer(s)
    out["m21_float"] = [m21_key(k) for k in ka.run()]
    out["sec_m21_float"] = time.perf_counter() - t
    n = len(s.parts[0].getElementsByClass("Measure"))
    for tag, ident in (("BB", "bellman"), ("AE", "aarden")):
        t = time.perf_counter()
        ser = []
        for i in range(n):
            lo, hi = max(0, i - 1), min(n - 1, i + 2)
            try:
                sub = s.measures(lo, hi, indicesNotNumbers=True)
                ser.append(m21_key(sub.analyze(ident)) if len(sub.recurse().notes) >= 8 else None)
            except Exception:  # noqa
                ser.append(None)
        out["m21_win_" + tag] = ser
        out["sec_m21_win_" + tag] = time.perf_counter() - t
    out["bars_m21"] = n
    return out


if __name__ == "__main__":
    wir = {p["dir"]: p for p in json.load(open(HERE / "wir_pieces.json"))["pieces"]}
    results = []
    for iid, source in ITEMS_NAMED:
        it = BYID[iid]
        rec = {"id": iid, "expected_source": source, "err": {}}
        try:
            ref = reference(it)
            path = str(CONTENT / it["file"])
            try:
                sc = load(it)
            except Exception as e:  # noqa
                sc = None
                rec["err"]["cur_load"] = repr(e)[:150]
            truth = None
            if iid in WIR_OF:
                p = wir[WIR_OF[iid]]
                tb = {n: tuple(k) for n, k in p["truth"]["bars"]}
                glob = tuple(p["truth"]["global"])
                rec["wir_bars"] = len(tb)
                truth_series = [list(tb[n]) for n in sorted(tb)]
                rec["expected_areas"] = areas_from_series(truth_series, glob)
                rec["truth_global"] = list(glob)
                home = glob
            else:
                home = (ref[0], ref[1]) if ref else None
            src = "When in Rome global key" if iid in WIR_OF else (ref[2] if ref else None)
            if home is None and iid == "song.folk.happy-birthday-piano.pdmx":   # the title names no key
                home, src = (0, "major"), "reading: C major (rules/area-1B.md section 7 names it so)"
            rec["home_reference"] = list(home) if home else None
            rec["home_source"] = src
            tools = {}
            if sc is not None:
                rec["bars_sc"] = len(sc.measure_starts)
                t = time.perf_counter()
                an = C.H.analyse(sc)
                areas, chome = C.kc_areas(sc, an)
                rec["sec_cur_areas"] = time.perf_counter() - t
                rec["cur_home"] = list(chome) if chome else None
                rec["cur_areas"] = areas
                loc = C.local_windows(sc)
                tools["cur_win"] = [list(k) if k else None for k in loc]
            tools.update(m21_series(path))
            sec = {k: v for k, v in tools.items() if k.startswith("sec_")}
            rec["sec"] = sec
            rec["bars_m21"] = tools.pop("bars_m21")
            for k in list(tools):
                if k.startswith("sec_"):
                    tools.pop(k)
            rec["tool_areas"] = {k: areas_from_series(v, home) for k, v in tools.items() if home}
            rec["tool_series"] = tools
        except Exception as e:  # noqa
            rec["err"]["piece"] = repr(e)[:200]
        results.append(rec)
        print(iid, rec.get("home_reference"), rec["err"], flush=True)
    json.dump(results, open(HERE / "cat_kc_results.json", "w"))
