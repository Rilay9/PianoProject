"""rhythm.tuplets-other: where do the groups that fix D drops (and nobody named) sit? Prints the measures of each such group and, for each,
the notes of the first measure as rawbar.py prints them, so the group can be read (printed bracket absent? a real septuplet?).
Reads out/f3_groups.json; the raw bar uses the validators' rawbar logic copied here (read-only)."""
import json, re, sys, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1c")]
from common import item_xml
rows = json.load(open(HERE / "out/f3_groups.json", encoding="utf8"))
NAMED_ITEMS = {"song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx": None}
drop = [r for r in rows if r["ratio"] != "3:2" and not r["within5"] and not r["multi_brackets"]]
named_ratios = {"160:107", "80:53", "120:67", "48:43", "320:179", "320:301", "60:53", "640:321", "320:161", "15:14", "20:17", "480:371", "320:239", "160:119", "24:17", "40:37", "12:11"}
unv = [r for r in drop if r["ratio"] not in named_ratios]
print("groups D drops that are not named artefacts:", len(unv), "| notes:", sum(r["notes"] for r in unv))
for r in unv:
    t = item_xml(r["item"])
    ms = []
    for mm in re.finditer(r'<measure\b[^>]*number="([^"]*)"[^>]*>(.*?)</measure>', t, re.S):
        a, b = r["a"], r["b"]
        if re.search(r"<actual-notes>%d</actual-notes>\s*<normal-notes>%d</normal-notes>" % (a, b), mm.group(2)):
            ms.append(mm.group(1))
    print(f"  {r['ratio']:7} {r['item'].replace('song.', '')[:62]:62} notes {r['notes']:3} <tuplet>-notes {r['notes_with_tuplet_element']} measures {ms[:5]}")
