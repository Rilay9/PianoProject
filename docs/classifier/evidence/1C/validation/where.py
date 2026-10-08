"""where.py ID REGEX : printed measure numbers (part 0 and others) whose body matches REGEX, with match counts."""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import item_xml
t = item_xml(sys.argv[1])
for pm in re.finditer(r"<part\b[^>]*id=\"([^\"]+)\".*?</part>", t, re.S):
    for mm in re.finditer(r'<measure\b[^>]*number="([^"]*)"[^>]*>(.*?)</measure>', pm.group(0), re.S):
        k = len(re.findall(sys.argv[2], mm.group(2)))
        if k:
            print(pm.group(1), "measure", mm.group(1), k)
