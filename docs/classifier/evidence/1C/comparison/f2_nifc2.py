"""Nocturne op. 55 no. 2 (NIFC): bar index 1 and bar index 0 as the walk and the render see them, and the bar-0 XML."""
import sys, re, json
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1a"), str((HERE / "../../1A/validation").resolve())]
import f2_osmd as FO
from common import *

i = "song.classical.chopin-nocturne-op55-2.nifc"
w = cache(i)
rr = FO.render(i)
for m in (0, 1):
    print("--- bar index", m)
    print("walk :", sorted([(float(n["t"]), n["staff"], n["step"] + str(n["octave"]), float(n["dur"]), "grace" if n["grace"] else "", n["voice"]) for n in w["notes"] if n["m"] == m and not n["rest"]])[:14])
    print("render:", sorted([(r["t"], r["staff"], r["note"].split(",")[0][-4:], r["drawn"]) for r in rr if r["m"] == m])[:14])
x = FO.to_xml(i).read_text(encoding="utf8")
ms = re.findall(r"<measure .*?</measure>", x, re.S)
print("XML measure 1 (first 2500 chars):")
print(ms[0][:2500])
print("divisions:", re.findall(r"<divisions>(\d+)</divisions>", x)[:3])
print("durations that are not integers:", len(re.findall(r"<duration>\d+\.\d+</duration>", x)))
