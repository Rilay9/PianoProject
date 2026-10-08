import sys, warnings
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load
warnings.simplefilter("ignore")
from rules import rhythm as R
for iid in sys.argv[1:]:
    try:
        sc = load(iid); b = R.Bars(sc)
        print(iid, "loads;", len(sc.notes), "notes;", len(b.readable), "readable bars")
    except Exception as ex:
        print(iid, "FAILS", repr(ex)[:150])
