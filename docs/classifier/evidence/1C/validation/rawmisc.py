"""rawmisc.py ID ... : first-bar length against its signature (anacrusis), signatures with symbols, tuplet notes per ratio
(chord members once, grace out), beam groups of the first two bars of part 0 (top-level beams)."""
import re, sys
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import item_xml
from times import measures, siglen
for iid in sys.argv[1:]:
    t = item_xml(iid)
    ms = measures(iid)
    first = ms[0]
    sigs = sorted(set(re.sub(r"\s+", "", x) for x in re.findall(r"<time(?:\s[^>]*)?>.*?</time>", t, re.S)))
    tup = Counter()
    for n in re.findall(r"<note\b.*?</note>", t, re.S):
        if "<chord" in n or "<grace" in n:
            continue
        m = re.search(r"<actual-notes>(\d+)</actual-notes>\s*<normal-notes>(\d+)", n)
        if m:
            tup[f"{m.group(1)}:{m.group(2)}"] += 1
    part = re.search(r"<part\b.*?</part>", t, re.S).group(0)
    beams = []
    for mm in list(re.finditer(r"<measure\b.*?</measure>", part, re.S))[:2]:
        g = []; cur = 0
        for n in re.findall(r"<note\b.*?</note>", mm.group(0), re.S):
            if "<chord" in n or "<staff>2" in n:
                continue
            b = re.search(r'<beam number="1">(\w+)</beam>', n)
            if b and b.group(1) == "begin":
                cur = 1
            elif b and b.group(1) == "continue":
                cur += 1
            elif b and b.group(1) == "end":
                g.append(cur + 1); cur = 0
        beams.append(g)
    print(iid, "| first bar len", first["len"], "sig", first["sig"], "full", siglen(first["sig"]) if first["sig"] else None,
          "| sigs", sigs[:3], "| tuplets", dict(tup.most_common(6)), "| beam groups bars 1-2 (staff 1)", beams)
