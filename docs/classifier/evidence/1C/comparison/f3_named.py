"""rhythm.tuplets-other, named (item, ratio) cases: kept as a tuplet by the current rules, by fix A, fix B, and fix A plus the 5% bound.
Truth = the validators' reading on the page (real printed figure vs re-export artefact), fixed in expected_tuplets.json before any run.
Reads out/f3_groups.json (f3_analyse.py)."""
import json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
rows = json.load(open(HERE / "out/f3_groups.json", encoding="utf8"))
G = {(r["item"], r["ratio"]): r for r in rows}
MAL = "song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx"
PUC = "song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx"
AIN = "song.jazz.fats-waller-ain-t-misbehavin.pdmx"
TRO = "song.pop.misc-christmas-silent-night-trombone-duet.pdmx"
RAI = "song.classical.chopin-prelude-no-15-in-d-flat-major-op-28.pdmx"
NAMED = [("song.classical.chopin-polonaise-op53.nifc", "29:20", "real"), ("song.classical.chopin-ballade-1", "39:32", "real"),
         ("song.classical.chopin-ballade-1", "28:16", "real"), ("song.classical.chopin-ballade-1", "21:16", "real"), ("song.classical.chopin-ballade-1", "29:16", "real"),
         ("song.classical.beethoven-moonlight-iii", "5:4", "real"), ("song.classical.beethoven-moonlight-iii", "6:4", "real"), ("song.classical.beethoven-moonlight-iii", "7:4", "real"),
         ("song.classical.debussy-clair-de-lune", "2:3", "real"), ("song.classical.chopin-nocturne-in-f-sharp-major-op-15-no-2.pdmx", "5:4", "real"),
         ("song.classical.chopin-prelude-op28-18.nifc", "11:8", "real"), ("song.classical.chopin-berceuse.nifc", "11:8", "real"),
         ("song.classical.schubert-liszt-standchen", "9:8", "real"), ("song.classical.chopin-nocturne-op9-1", "11:6", "real")]
NAMED += [(MAL, r, "artefact") for r in ("160:107", "80:53", "120:67", "48:43", "320:179", "320:301", "60:53", "640:321", "320:161", "15:14", "20:17", "480:371")]
NAMED += [(PUC, r, "artefact") for r in ("320:239", "160:119")] + [(AIN, r, "artefact") for r in ("24:17", "40:37", "23:24")]
NAMED += [(TRO, "12:11", "artefact")] + [(RAI, r, "artefact") for r in ("40:39", "160:159", "80:79")]
cur = lambda r: not (r["within5"] or (r["brackets"] and r["short_brackets"] == r["brackets"]))   # the page's two noise rules at group level
READERS = {"current (5% bound)": cur, "A closed <tuplet> bracket": lambda r: bool(r["brackets"]), "B bracket drawn": lambda r: bool(r["drawn_brackets"]),
           "A + 5% bound": lambda r: bool(r["brackets"]) and not r["within5"],
           "A + 5% + sum test": lambda r: bool(r["complete_brackets"]) and not r["within5"],
           "C: A + 5% + bracket of 2+ notes": lambda r: bool(r["multi_brackets"]) and not r["within5"],
           "D: bracket of 2+ notes, a != b": lambda r: bool(r["multi_brackets"]) and r["a"] != r["b"]}
res = collections.Counter(); out = []
for item, ratio, truth in NAMED:
    r = G.get((item, ratio))
    if r is None:
        print("ABSENT", item, ratio); res[("absent", truth)] += 1; continue
    k = {n: f(r) for n, f in READERS.items()}
    out.append({"item": item, "ratio": ratio, "truth": truth, "notes": r["notes"], "brackets": r["brackets"], "drawn": r["drawn_brackets"], "kept": k})
    print(item.replace("song.", "")[:48].ljust(48), ratio.ljust(8), truth.ljust(8), "notes", str(r["notes"]).ljust(4), "closed", r["brackets"], "drawn", r["drawn_brackets"], "| kept:",
          " | ".join(("yes" if v else "NO ") for v in k.values()))
    for n, v in k.items():
        res[(n, truth, v)] += 1
json.dump(out, open(HERE / "out/f3_named.json", "w"), indent=1)
nr = sum(1 for x in NAMED if x[2] == "real"); na = sum(1 for x in NAMED if x[2] == "artefact")
print(f"\nNAMED: {nr} real, {na} artefact (item, ratio) cases")
for n in READERS:
    print(f"  {n:28} right: real kept {res[(n,'real',True)]}/{nr}, artefact dropped {res[(n,'artefact',False)]}/{na}  | wrong: real dropped {res[(n,'real',False)]}, artefact kept {res[(n,'artefact',True)]}")
