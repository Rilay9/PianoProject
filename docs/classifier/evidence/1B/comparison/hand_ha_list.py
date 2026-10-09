"""Item list for the hand-assignment run (prereq.hand-assignment). Writes hand_ha_list.json.
 words     = every non-generated file with a printed hand word (hand_words.json): hand truth from the word (rule in hand.md 3.1)
 named     = items named by area-1A validation row prereq.hand-assignment
 generated = generated two-staff items declared hands 'both', every 8th by sorted id (hand = staff by construction)
 pdmx      = two-staff PDMX / other-real items, every 20th by sorted id (agreement only, no truth)
"""
import json
from hand_xml import *

cat = {i["id"]: i for i in json.load(open(CONTENT / "catalog.json", encoding="utf-8"))}
words = json.load(open(HERE / "hand_words.json"))
NAMED = ["song.classical.albeniz-asturias.pdmx", "song.folk.amazing-grace-satb.pdmx", "song.classical.abide-with-me-william-henry-monk.pdmx",
         "song.classical.grieg-album-leaf-op-47-no-2.pdmx", "song.classical.bach-invention-no-8-in-f-major-bwv-779.pdmx",
         "exercise.clave.bossa.pulse", "song.classical.bach-adagio-bwv-974-after-marcello.pdmx", "excerpt.blues.wabash-blues.b1-4",
         "song.classical.bach-fugue-in-g-minor-bwv-578-piano-transcription.pdmx",
         "excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28"]
gen, real = [], []
for k in sorted(cat):
    i = cat[k]
    if not i.get("file"):
        continue
    src = i.get("provenance", {}).get("source")
    if k in words or k in NAMED:
        continue
    try:
        notes, npart, st = read_notes(CONTENT / i["file"])
    except Exception:
        continue
    two = (npart == 1 and st[0] >= 2) or npart >= 2
    if not two:
        continue
    if src == "generated" and i.get("hands") == "both":
        gen.append(k)
    elif src != "generated":
        real.append(k)
out = {"words": sorted(words), "named": [k for k in NAMED if k in cat], "generated": gen[::8], "pdmx": real[::20]}
out["missing_named"] = [k for k in NAMED if k not in cat]
lst = []
for grp in ("words", "named", "generated", "pdmx"):
    for k in out[grp]:
        lst.append({"id": k, "file": cat[k]["file"], "group": grp})
out["list"] = lst
json.dump(out, open(HERE / "hand_ha_list.json", "w"), indent=0)
print({g: len(out[g]) for g in ("words", "named", "generated", "pdmx")}, out["missing_named"], "generated pool", len(gen), "real pool", len(real))
