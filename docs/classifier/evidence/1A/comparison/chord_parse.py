"""notation.chord-symbols, symbol-system parse: the current reading (validation/r_misc.chord_symbols, steps 1, 2, 4) against music21's <harmony> reader,
and the text parsers (music21 harmony.ChordSymbol(text), Tonal Chord.get, the validators' regex) against the symbols the catalogue prints.

Items: every catalogue item with <harmony> (found by the validators' raw walk): generated / PDMX / other.
Reference (what the notation states): the raw MusicXML <harmony> root, bass, kind, after the de-duplication of step 1 (a reading of the file by
validation/walk.py, independent of music21).
Outputs: chord_parse_items.json (per item), chord_parse_text.json (per printed string), chord_parse_summary.json (the tables' figures).
"""
import sys, json, re, collections, time, subprocess, warnings
from mel_common import *
load_validators()
import common
from walk import cache, BYID
import r_misc

from music21 import converter, harmony, pitch as m21pitch

STEP = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def pc(step_alter):
    s, a = step_alter
    if s is None:
        return None
    return (STEP[s] + (int(float(a)) if a not in (None, "") else 0)) % 12


def ref_symbols(w):
    d = common.dedup_symbols(w)
    out = []
    for h in d:
        if h["kind"] == "none":
            out.append(("N.C.", None, None)); continue
        r = pc(h["root"]); b = pc(h["bass"])
        out.append(("sym", r, b if b is not None else r))
    return out


def m21_symbols(path):
    s = converter.parse(str(path))
    raw, seen, out, nc = 0, set(), [], 0
    kinds = collections.Counter()
    for h in s.recurse().getElementsByClass(harmony.Harmony):
        raw += 1
        if isinstance(h, harmony.NoChord):
            key = (round(float(h.getOffsetInHierarchy(s)), 4), "NC")
            if key in seen: continue
            seen.add(key); out.append(("N.C.", None, None)); continue
        r = h.root().pitchClass if h.root() is not None else None
        b = h.bass().pitchClass if h.bass() is not None else r
        key = (round(float(h.getOffsetInHierarchy(s)), 4), r, b, h.chordKind)
        if key in seen: continue
        seen.add(key); out.append(("sym", r, b)); kinds[h.chordKind] += 1
    return raw, out, kinds


def printed(h):
    """the symbol as a player reads it, from the file's own printed pieces: root + kind text + /bass (None if the file prints no kind text)."""
    if h["kind"] == "none" or h["ktext"] is None:
        return None
    def nm(sa):
        s, a = sa
        al = int(float(a)) if a not in (None, "") else 0
        return s + ("#" * al if al > 0 else "b" * (-al))
    t = nm(h["root"]) + h["ktext"]
    if h["bass"][0]:
        t += "/" + nm(h["bass"])
    return t


def tonal_batch(strings):
    script = (BUILD / "tonal/run.cjs")
    script.write_text("const {Chord} = require('tonal');\nconst fs = require('fs');\nconst xs = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));\n"
                      "console.log(JSON.stringify(xs.map(s => {const c = Chord.get(s); return {s, empty: c.empty, tonic: c.tonic, bass: c.bass, name: c.name, notes: c.notes};})));\n", encoding="utf-8")
    inp = BUILD / "tonal/in.json"
    inp.write_text(json.dumps(strings), encoding="utf-8")
    r = subprocess.run(["node", str(script), str(inp)], capture_output=True, text=True, cwd=str(BUILD / "tonal"), encoding="utf-8")
    if r.returncode:
        raise RuntimeError(r.stderr[:500])
    return {x["s"]: x for x in json.loads(r.stdout)}


def pcname(n):
    if not n:
        return None
    m = re.fullmatch(r"([A-G])(#{1,2}|b{1,2})?", n)
    if not m:
        return None
    return (STEP[m.group(1)] + (len(m.group(2)) * (1 if m.group(2)[0] == "#" else -1) if m.group(2) else 0)) % 12


if __name__ == "__main__":
    items = [i for i in BYID if cache(i)["harm"]]
    per = {}
    t_cur = t_m21 = 0.0
    for n, i in enumerate(items):
        w = cache(i)
        t = time.time(); cur = r_misc.chord_symbols(w); t_cur += time.time() - t
        ref = ref_symbols(w)
        t = time.time()
        try:
            raw, m21, kinds = m21_symbols(CONTENT / BYID[i]["file"])
            err = None
        except Exception as e:
            raw, m21, kinds, err = None, None, {}, f"{type(e).__name__}: {e}"
        t_m21 += time.time() - t
        pl = common.pipeline(i)
        row = {"pipeline": pl, "raw_walk": cur["raw"], "dedup_walk": cur["symbols"], "nc_walk": cur["nc"], "slash_walk": cur["slash"],
               "m21_error": err, "m21_raw": raw}
        if m21 is not None:
            row["m21_dedup"] = len(m21)
            row["m21_nc"] = sum(1 for x in m21 if x[0] == "N.C.")
            row["m21_slash"] = sum(1 for x in m21 if x[0] == "sym" and x[1] != x[2])
            row["m21_multiset_equal"] = collections.Counter(m21) == collections.Counter(ref)
            row["m21_kinds"] = dict(kinds)
        row["ref_slash"] = sum(1 for x in ref if x[0] == "sym" and x[1] != x[2])
        row["ref_nc"] = sum(1 for x in ref if x[0] == "N.C.")
        row["walk_multiset_equal"] = (cur["symbols"] == len(ref) and cur["nc"] == row["ref_nc"] and cur["slash"] == row["ref_slash"])
        row["text_candidates"] = cur["text_candidates"]
        per[i] = row
    jdump(per, HERE / "chord_parse_items.json")
    # text route
    toks = collections.Counter(); truth = {}
    noprint = 0
    for i in items:
        w = cache(i)
        for h in common.dedup_symbols(w):
            t = printed(h)
            if t is None:
                noprint += 1; continue
            toks[t] += 1
            r = pc(h["root"]); b = pc(h["bass"])
            truth.setdefault(t, (r, b if b is not None else r))
    strings = sorted(toks)
    ton = tonal_batch(strings)
    res = {}
    for s in strings:
        r, b = truth[s]
        ent = {"count": toks[s], "truth_root": r, "truth_bass": b}
        try:
            c = harmony.ChordSymbol(s)
            ent["m21"] = {"ok": True, "root": c.root().pitchClass, "bass": c.bass().pitchClass, "kind": c.chordKind}
        except Exception as e:
            ent["m21"] = {"ok": False, "err": f"{type(e).__name__}"}
        x = ton[s]
        ent["tonal"] = {"ok": not x["empty"], "root": pcname(x["tonic"]), "bass": pcname(x["bass"]) if x["bass"] else (pcname(x["tonic"]) if not x["empty"] else None), "name": x["name"]}
        m = r_misc.CHORD_TXT.match(s)
        ent["regex"] = {"ok": bool(m)}
        res[s] = ent
    jdump(res, HERE / "chord_parse_text.json")
    summ = {"items_with_symbols": collections.Counter(per[i]["pipeline"] for i in items), "no_printed_text_symbols": noprint,
            "seconds_walk_total": t_cur, "seconds_m21_total": t_m21}
    jdump(summ, HERE / "chord_parse_summary.json")
    print(len(items), "items;", len(strings), "distinct printed strings;", "walk", round(t_cur, 1), "s m21", round(t_m21, 1), "s")
