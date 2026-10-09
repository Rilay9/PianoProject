"""Look up catalogue ids by regex (helper). Usage: python ids.py <regex>"""
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[5]
CAT = json.load(open(ROOT / "app/public/content/catalog.json", encoding="utf8"))
if __name__ == "__main__":
    rx = re.compile(sys.argv[1])
    for x in CAT:
        if rx.search(x["id"]):
            print(x["id"], x.get("file"))
    print(len(CAT), sum(1 for x in CAT if x.get("file")))
