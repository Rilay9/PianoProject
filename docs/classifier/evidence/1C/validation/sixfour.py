"""sixfour.py: every item with a 6/4 or 12/4 signature: the <time> elements (with symbol), words holding '3/2' or '=',
and what metre.grouping's routes would give (composite numerator, counting words; beams are not read in X/4)."""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CAT, CONTENT, xml_text
for it in CAT:
    if not it.get("file"):
        continue
    t = xml_text(CONTENT / it["file"])
    times = re.findall(r"<time(?:\s[^>]*)?>.*?</time>", t, re.S)
    sigs = {re.sub(r"\s+", "", x) for x in times}
    if not any(re.search(r"<beats>(6|12)</beats><beat-type>4</beat-type>", s) for s in sigs):
        continue
    words = [w for w in re.findall(r"<words[^>]*>([^<]*)</words>", t) if re.search(r"3/2|=|\d\s*\+\s*\d", w)]
    print(it["id"], "|", sorted(sigs)[:4], "| words", words[:4])

