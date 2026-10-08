"""Section 5 corrected helper on every readable item; Bellman-Budge and Aarden-Essen (music21) on the reference items
(generated: recipe keySig; real: the title's key, six titles corrected). Writes keys_v.json."""
from common import *
import re, time, warnings
import rules.harmony as H
from keyfix import infer_key2

PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SKIP_FAM = {"seventh_arpeggio", "broken_seventh", "chromatic", "rhythm", "clave", "meter", "syncopation", "modal_vamp"}
FIX = {"song.classical.chopin-etude-op10-11.nifc": (3, "major"), "song.classical.chopin-mazurka-op67-4.nifc": (9, "minor"),
       "song.classical.chopin-mazurka-op68-2.nifc": (9, "minor"), "song.classical.chopin-mazurka-op68-4.nifc": (5, "minor"),
       "song.classical.chopin-polonaise-g-minor.nifc": (7, "minor"), "song.classical.chopin-polonaise-g-sharp-minor.nifc": (8, "minor")}


def pc_name(s):
    s = s.strip()
    base = PC[s[0].upper()]
    rest = s[1:].lower().replace("-flat", "b").replace(" flat", "b").replace("-sharp", "#").replace(" sharp", "#").replace("-", "b").replace("♭", "b").replace("♯", "#")
    return (base + rest.count("#") - rest.count("b")) % 12


def reference(it):
    if pipeline(it) == "generated":
        f = fam(it)
        ks = it.get("keySig")
        if f in SKIP_FAM or not ks:
            return None
        t, m = ks.split()
        return [pc_name(t), m.lower(), "recipe"]
    if it["id"] in FIX:
        return [*FIX[it["id"]], "title corrected"]
    m = re.search(r"\bin ([A-G](?:[- ]?(?:flat|sharp)|b|#|♭|♯)?)[ -]+(major|minor)\b", it["title"], re.I)
    if not m:
        return None
    return [pc_name(m.group(1)), m.group(2).lower(), "title"]


only = set(sys.argv[1:])
out = {}
t0 = time.time()
for idx, it in enumerate(ITEMS):
    if only and it["id"] not in only:
        continue
    rec = {"p": pipeline(it), "fam": fam(it), "ref": reference(it)}
    try:
        sc = load(it)
        if not len(sc.notes):
            continue
        an = H.analyse(sc)
        rec["old"] = [an.key.tonic_pc, an.key.mode, an.key.confidence] if an.key else None
        res, info, flags = infer_key2(sc, an)
        rec["new"] = list(res) if res else None
        rec["info"] = {k: (list(v) if isinstance(v, tuple) else v) for k, v in info.items()}
        rec["flags"] = flags
        if rec["ref"] is not None:
            from music21 import converter
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                s = converter.parse(str(CONTENT / it["file"]))
                bb = s.analyze("bellman")
                ae = s.analyze("key")
            rec["bb"] = [bb.tonic.pitchClass, bb.mode]
            rec["ae"] = [ae.tonic.pitchClass, ae.mode]
    except Exception as e:  # noqa
        rec["error"] = repr(e)[:150]
    out[it["id"]] = rec
    if idx % 200 == 0:
        print(idx, round(time.time() - t0), flush=True)
name = "keys_v_sel.json" if only else "keys_v.json"
json.dump(out, open(OUT / name, "w"), indent=0)
print("done", round(time.time() - t0))
