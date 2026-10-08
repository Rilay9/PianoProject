"""rawbar.py ID MEASURE_NUMBER [FILE]: the raw notes of that printed measure in part 0 (type, dots, duration, staff, voice,
time-modification, tuplet start/stop, chord, rest, cue, grace), from the app's file or a given file."""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import item_xml, xml_text
t = xml_text(sys.argv[3]) if len(sys.argv) > 3 else item_xml(sys.argv[1])
part = re.search(r"<part\b.*?</part>", t, re.S).group(0)
mm = re.search(r'<measure\b[^>]*number="%s"[^>]*>(.*?)</measure>' % re.escape(sys.argv[2]), part, re.S)
for n in re.finditer(r"<note\b.*?</note>|<backup>.*?</backup>|<forward>.*?</forward>", mm.group(1), re.S):
    s = n.group(0)
    if s.startswith("<backup") or s.startswith("<forward"):
        print(s.split(">")[0] + ">", re.search(r"<duration>(\d+)", s).group(1)); continue
    g = lambda p: (re.search(p, s) or [None, ""])[1]
    pitch = g(r"<step>(\w)</step>") + g(r"<alter>(-?\d)</alter>") + g(r"<octave>(\d)</octave>")
    typ = g(r"<type[^>]*>(\w+)</type>"); dur = g(r"<duration>(\d+)"); st = g(r"<staff>(\d+)"); vo = g(r"<voice>(\d+)")
    an = g(r"<actual-notes>(\d+)"); nn = g(r"<normal-notes>(\d+)")
    tups = " ".join(re.findall(r'<tuplet[^>]*type="(\w+)"', s))
    ties = ",".join(re.findall(r'<tie type="(\w+)"', s))
    print(("chord " if "<chord" in s else "") + ("REST " if "<rest" in s else "") + ("CUE " if "<cue" in s or 'size="cue"' in s else "") +
          ("GRACE " if "<grace" in s else "") + f"{pitch} {typ}{'.' * s.count('<dot')} dur {dur} st{st} v{vo} tm {an}:{nn} {tups} {('tie:' + ties) if ties else ''}")
