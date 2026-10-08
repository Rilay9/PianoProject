"""runrules.py FUNC ID ... : run tools/classifier/rules/rhythm.py's FUNC (shuffle, secondary_rag, ...) on items."""
import sys, json, warnings
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load
warnings.simplefilter("ignore")
from rules import rhythm as R
fn = getattr(R, sys.argv[1])
for iid in sys.argv[2:]:
    try:
        r = fn(load(iid))
        print(iid, json.dumps(r.to_json(), default=str)[:400])
    except Exception as ex:
        print(iid, "ERROR", repr(ex)[:200])
