"""H1 of the re-staffing brief, tested in scratch only (nothing kept in the repository as an edition):
parse the raw member with convert.parse_source, keep the parts Riff and P1-Staff2 by id, run the
unchanged convert.normalise and write_mxl into build/, then read the written file with a raw
MusicXML walk (reader A's rules, independent of music21) and compare its staff 1 and staff 2 events
with the source's riff and root events from events-by-role.json."""
import hashlib
import io
import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
import convert  # noqa: E402

CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
raw = HERE / "pdmx" / "raw" / f"{CID}.mxl"
score = convert.parse_source(raw)
print("parts:", [p.id for p in score.parts])
for p in list(score.parts):
    if p.id not in ("Riff", "P1-Staff2"):
        score.remove(p)
print("kept:", [p.id for p in score.parts])
out_score, result = convert.normalise(score, keep_lyrics=False, tempo_bpm=None)
dest = HERE / "h1-scratch" / f"{CID}.restaff.mxl"
dest.parent.mkdir(exist_ok=True)
convert.write_mxl(out_score, dest)
print("normalise notes:", result.warnings if hasattr(result, "warnings") else result)
print("scratch sha256:", hashlib.sha256(dest.read_bytes()).hexdigest())


def inner(data):
    z = zipfile.ZipFile(io.BytesIO(data))
    c = ET.fromstring(z.read("META-INF/container.xml"))
    for el in c.iter():
        if el.tag.endswith("rootfile"):
            return z.read(el.get("full-path"))


def spell(p):
    a = int(float(p.findtext("alter") or 0))
    return p.findtext("step") + {-1: "b", 0: "", 1: "#"}[a] + p.findtext("octave")


root = ET.fromstring(inner(dest.read_bytes()))
ev, rests, unp = Counter(), Counter(), 0
for part in root.findall("part"):
    div = 1
    for m in part.findall("measure"):
        bar, pos, last = int(m.get("number")), Fraction(0), Fraction(0)
        for el in m:
            if el.tag == "attributes" and el.findtext("divisions"):
                div = int(el.findtext("divisions"))
            elif el.tag == "backup":
                pos -= Fraction(int(el.findtext("duration")), div)
            elif el.tag == "forward":
                pos += Fraction(int(el.findtext("duration")), div)
            elif el.tag == "note":
                d = Fraction(int(el.findtext("duration") or 0), div)
                ch = el.find("chord") is not None
                on = last if ch else pos
                st = el.findtext("staff") or "1"
                hidden = el.get("print-object") == "no"
                if el.find("rest") is not None:
                    rests[(st, bar, str(on), str(d), "hidden" if hidden else "")] += 1
                elif el.find("pitch") is not None:
                    ev[(st, bar, str(on), str(d), spell(el.find("pitch")))] += 1
                elif el.find("unpitched") is not None:
                    unp += 1
                if not ch:
                    last = on
                    pos += d
src = json.loads((HERE / "events-by-role.json").read_text(encoding="utf-8"))["roles"]
want = Counter()
for st, role in (("1", "riff"), ("2", "root")):
    for b, items in src[role].items():
        for e in items:
            want[(st, int(b), str(Fraction(e["onset"])), str(Fraction(e["dur"])), e["head"])] += 1
print("edition sounding heads", sum(ev.values()), "source riff+roots", sum(want.values()))
print("only in edition:", sorted((ev - want).elements()))
print("only in source:", sorted((want - ev).elements()))
print("unpitched in edition:", unp)
print("rests in edition:", sorted(rests.elements()))
print("staves:", [s.text for s in root.iter("staves")], "parts:", len(root.findall("part")),
      "clefs:", [c.findtext("sign") + (c.findtext("line") or "") for c in root.iter("clef")])
