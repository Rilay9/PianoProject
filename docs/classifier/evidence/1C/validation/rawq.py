"""rawq.py ID REGEX : count and show the first matches of REGEX in the item's raw MusicXML."""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import item_xml
t = item_xml(sys.argv[1])
ms = list(re.finditer(sys.argv[2], t, re.S))
print(len(ms))
for m in ms[: int(sys.argv[3]) if len(sys.argv) > 3 else 5]:
    print(repr(m.group(0)[:300]))
