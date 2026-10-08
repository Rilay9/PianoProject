"""catq.py ID ... : catalogue fields of interest."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BYID
for k in sys.argv[1:]:
    i = BYID[k]
    print(k, "| concepts", i.get("concepts"), "| tracks", i.get("tracks"), "| timeSig", i.get("timeSig"), "| drill", i.get("drill"), "| hands", i.get("hands"))
