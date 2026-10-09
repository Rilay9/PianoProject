"""rhythm.tuplets-other: for every file of the catalogue, the time-modification ratios and the printed <tuplet> brackets.

Per item: for each ratio a:b (non-grace, non-chord notes with <time-modification>), how many notes there are, how many carry a
<tuplet> notation, how many lie inside a start..stop bracket of their staff and voice; and every closed bracket with its ratio,
the number of notes inside (rests included, chord members once, grace notes not), its measure and its printed attributes
(bracket= yes/no/absent, show-number= actual/both/none/absent). Brackets are tracked across bar lines by (part, staff, voice, number).
Writes out/f3_scan.json.  Run with the repo .venv:  python f3_scan.py
"""
import sys, json, collections
import xml.etree.ElementTree as ET
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1c")]
from fractions import Fraction as F
from common import CAT, CONTENT, xml_text

# written length of a note type in whole notes (rests have a type too; a measure rest has none: wsum becomes None)
WRITTEN = {"whole": F(1), "half": F(1, 2), "quarter": F(1, 4), "eighth": F(1, 8), "16th": F(1, 16), "32nd": F(1, 32), "64th": F(1, 64),
           "128th": F(1, 128), "256th": F(1, 256), "512th": F(1, 512), "1024th": F(1, 1024), "breve": F(2)}


def scan(text):
    root = ET.fromstring(text)
    notes = collections.defaultdict(lambda: [0, 0, 0])   # ratio -> [notes, with <tuplet> element, inside a bracket]
    brackets = []
    for pi, part in enumerate(root.findall("part")):
        open_ = {}
        for meas in part.findall("measure"):
            mno = meas.get("number")
            for n in meas.findall("note"):
                grace = n.find("grace") is not None
                chord = n.find("chord") is not None
                tm = n.find("time-modification")
                ratio = None
                if tm is not None:
                    a, b = tm.findtext("actual-notes"), tm.findtext("normal-notes")
                    if a and b:
                        ratio = (int(a), int(b))
                staff = n.findtext("staff") or "1"
                voice = n.findtext("voice") or "1"
                tups = n.findall("notations/tuplet")
                starts = [t for t in tups if t.get("type") == "start"]
                stops = [t for t in tups if t.get("type") == "stop"]
                for t in starts:
                    # key by (voice, number) within the part: a bracket may run across the two staves of one voice (Ballade 1 bar 247)
                    open_[(voice, t.get("number") or "1")] = {"ratio": ratio, "count": 0, "m": mno, "wsum": F(0),
                                                                      "bracket": t.get("bracket"), "show": t.get("show-number"), "type": t.get("show-type")}
                inside = False
                wl = WRITTEN.get(n.findtext("type") or "", None)
                if wl is not None:
                    wl = wl * (2 - F(1, 2 ** len(n.findall("dot"))))
                if not grace:
                    for k, o in open_.items():
                        if k[0] == voice:
                            inside = True
                            if not chord:
                                o["count"] += 1
                                o["wsum"] = (o["wsum"] + wl) if (wl is not None and o["wsum"] is not None) else None
                if ratio and not grace and not chord:
                    r = notes[ratio]
                    r[0] += 1
                    if tups:
                        r[1] += 1
                    if inside:
                        r[2] += 1
                for t in stops:
                    k = (voice, t.get("number") or "1")
                    if k in open_:
                        o = open_.pop(k)
                        brackets.append([o["ratio"], o["count"], o["m"], pi, o["bracket"], o["show"], o["type"], str(o["wsum"]) if o["wsum"] is not None else None])
        for o in open_.values():   # never closed
            brackets.append([o["ratio"], o["count"], o["m"], pi, o["bracket"], o["show"], "UNCLOSED", None])
    return {f"{a}:{b}": v for (a, b), v in notes.items()}, brackets


if __name__ == "__main__":
    out = {}
    for it in CAT:
        if not it.get("file"):
            continue
        try:
            nt, br = scan(xml_text(CONTENT / it["file"]))
        except Exception as e:
            out[it["id"]] = {"error": repr(e)[:200]}
            continue
        out[it["id"]] = {"notes": nt, "brackets": br}
    json.dump(out, open(HERE / "out/f3_scan.json", "w", encoding="utf8"))
    print("items scanned:", len(out), "errors:", sum(1 for v in out.values() if "error" in v))
