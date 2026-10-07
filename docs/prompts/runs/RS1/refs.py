"""RS1: A7a.1's Blues Riff refs, with and without this lane's pdmx.json row (the checker's own Resolver and check_file).

    py -3.11 docs/prompts/runs/RS1/refs.py
"""
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import check_chains as cc  # noqa: E402

CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
tools, _ = cc.vocabulary(REPO)
record = REPO / "docs" / "chains" / "A7a.1.yaml"
for label, drop in (("with the row", False), ("without the row (the base)", True)):
    resolver = cc.Resolver(REPO)
    if drop:
        row = resolver.pdmx_by_cid.pop(CID)
        resolver.pdmx_by_id.pop(row["id"])
    failures, unresolved, status = cc.check_file(record, resolver, tools, REPO)
    print(f"A7a.1 ({status}) {label}: {len(failures)} failure(s), {len(unresolved)} unresolved")
    for item in unresolved:
        print("   ", item)
row = cc.Resolver(REPO).pdmx_by_cid[CID]
print("the CID resolves to", row["id"], "file", row["file"])
