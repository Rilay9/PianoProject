"""Exploration: where convert.py's conversion of a python-ly MusicXML fails (the traceback's last frames)."""
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))
import convert  # noqa: E402

root = Path(sys.argv[1])
out = Path(sys.argv[2])
for rel in sys.argv[3:]:
    try:
        r = convert.convert_file(root / rel, out / (Path(rel).stem + ".mxl"))
        print(rel, "ok", r.measures)
    except Exception:  # noqa: BLE001
        print("==", rel)
        traceback.print_exc(limit=-6, file=sys.stdout)
