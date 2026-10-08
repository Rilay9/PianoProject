"""pick.py PREFIX [KIND] : ids in sync_all.json starting with PREFIX (and having KIND), with their kinds and concepts."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BYID, HERE
res = json.loads((HERE / "sync_all.json").read_text(encoding="utf-8"))
for r in res:
    if r["id"].startswith(sys.argv[1]) and "error" not in r:
        ks = {k for c in r["kinds"].values() for k in c}
        if len(sys.argv) > 2 and sys.argv[2] not in ks:
            continue
        if len(sys.argv) > 3 and ks & {"held", "held at the subdivision", "accent", "rest"}:
            continue
        print(r["id"], r["kinds"], "|", (BYID[r["id"]].get("concepts") or [])[:6])
for r in res:
    if "error" in r and r["id"].startswith(sys.argv[1]):
        print("ERROR", r["id"], r["error"])
