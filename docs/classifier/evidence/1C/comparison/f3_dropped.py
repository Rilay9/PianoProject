"""rhythm.tuplets-other: an exact accounting of the groups (ratios other than 3:2) that fix D does not keep, split by what they are.
Reads out/f3_groups.json. D keeps a group when it has a closed bracket of 2+ notes and a != b."""
import json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
rows = [r for r in json.load(open(HERE / "out/f3_groups.json", encoding="utf8")) if r["ratio"] != "3:2"]
cur = lambda r: "noise" if (r["within5"] or (r["brackets"] and r["short_brackets"] == r["brackets"])) else "tuplet"
D = lambda r: bool(r["multi_brackets"]) and r["a"] != r["b"]
MAL = "song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx"; PUC = "song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx"
AIN = "song.jazz.fats-waller-ain-t-misbehavin.pdmx"; TRO = "song.pop.misc-christmas-silent-night-trombone-duet.pdmx"; RAI = "song.classical.chopin-prelude-no-15-in-d-flat-major-op-28.pdmx"
NAMED = {(MAL, r) for r in ("160:107", "80:53", "120:67", "48:43", "320:179", "320:301", "60:53", "640:321", "320:161", "15:14", "20:17", "480:371")} | \
        {(PUC, "320:239"), (PUC, "160:119"), (AIN, "24:17"), (AIN, "40:37"), (AIN, "23:24"), (TRO, "12:11"), (RAI, "40:39"), (RAI, "160:159"), (RAI, "80:79")}
dropped = [r for r in rows if not D(r)]
print("groups of ratios other than 3:2:", len(rows), "| D keeps", len(rows) - len(dropped), "| D drops", len(dropped), "(notes", sum(r["notes"] for r in dropped), ")")
cat = collections.defaultdict(list)
for r in dropped:
    if (r["item"], r["ratio"]) in NAMED: k = "named artefact"
    elif r["a"] == r["b"]: k = "ratio 1 (a = b)"
    elif r["within5"]: k = "unnamed, ratio within 5% of 1"
    else: k = "unnamed, other"
    cat[k].append(r)
for k, v in cat.items():
    print(f"  {k}: {len(v)} groups, {sum(r['notes'] for r in v)} notes; current rules: kept {sum(1 for r in v if cur(r)=='tuplet')}, noise {sum(1 for r in v if cur(r)=='noise')}")
    if k != "named artefact":
        for r in v:
            print("      ", r["ratio"], r["item"], "notes", r["notes"], "closed brackets", r["brackets"], "current:", cur(r))
