"""Station 2 adversaries: the reader must go red on a major third on an m7 bar, a whole-step
approach, and the major-blues sibling read against the minor contract. Also prints the written
spelling (step, alter) of every left-hand beat-4 note, which the pitch-class reader cannot see.

Usage: py -3.11 walk_adversary.py <dir with built .mxl>
"""
from __future__ import annotations

import copy
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
from pdmx.quarry_core import mxl_inner_xml  # noqa: E402
from walk_read import check, read  # noqa: E402

src = Path(sys.argv[1])
cm = read(src / "exercise.walking-bass.c.minor-blues.mxl")
print("clean C minor:", check("exercise.walking-bass.c.minor-blues", cm)["problems"])

a = copy.deepcopy(cm)
a[0]["lh"][1]["midi"] += 1  # Eb2 -> E2 in bar 1: a major third on Cm7
print("major third on bar 1:", check("exercise.walking-bass.c.minor-blues", a)["problems"])

b = copy.deepcopy(cm)
b[7]["lh"][3]["midi"] -= 1  # bar 8's approach G2 -> Gb2: a whole step below Ab
print("whole-step approach bar 8:", check("exercise.walking-bass.c.minor-blues", b)["problems"])

c = copy.deepcopy(cm)
c[4]["lh"][1]["midi"] += 1  # bar 5 Ab2 -> A2: a major third on Fm7
print("major third on iv7 bar 5:", check("exercise.walking-bass.c.minor-blues", c)["problems"])

maj = read(src / "exercise.walking-bass.c.blues.mxl")
print("major sibling against the minor contract:",
      len(check("exercise.walking-bass.c.minor-blues", maj)["problems"]), "problems, e.g.",
      check("exercise.walking-bass.c.minor-blues", maj)["problems"][:3])

for item in ("c", "f", "b-flat", "e-flat"):
    xml = mxl_inner_xml((src / f"exercise.walking-bass.{item}.minor-blues.mxl").read_bytes())
    root = ET.fromstring(xml)
    key = [k.findtext("fifths") for k in root.iter("key")]
    spell = []
    for m in root.iter("measure"):
        lh = [n for n in m.iter("note") if n.findtext("staff") == "2" and n.find("rest") is None]
        if len(lh) >= 4:
            p = lh[3].find("pitch")
            acc = lh[3].findtext("accidental")
            spell.append(f"{m.get('number')}:{p.findtext('step')}{p.findtext('alter') or ''}{p.findtext('octave')}"
                         f"{'(' + acc + ')' if acc else ''}")
    print(item, "fifths", key, "beat-4 spellings:", " ".join(spell))
