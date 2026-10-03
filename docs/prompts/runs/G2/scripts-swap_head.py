"""
G2: put HEAD's bytes of the sources G2 changed in place (`swap`), run what needs HEAD's code, then
put G2's bytes back (`restore`), each file checked by sha256 against the copy taken at `swap`.
Run from the repository root. Never touches git's index or refs: HEAD's blobs are read with
`git show`, written with the checkout's CRLF line endings.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
KEEP = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "build" / "g2-swap"
FILES = [
    "app/src/evidence/ladder.ts",
    "app/src/evidence/evidence.ts",
    "app/src/curriculum/transfer.ts",
    "app/src/curriculum/session.ts",
    "app/src/data/progressStore.ts",
    "app/src/demands/vocabulary.ts",
    "app/src/ui/screens/TodayScreen.ts",
    "app/tests/unit/helpers/observed.ts",
    "content/curriculum/vocabulary/skills.json",
    "content/curriculum/vocabulary/skills.schema.json",
]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def swap() -> None:
    KEEP.mkdir(parents=True, exist_ok=True)
    record = {}
    for rel in FILES:
        path = ROOT / rel
        mine = path.read_bytes()
        (KEEP / rel.replace("/", "__")).write_bytes(mine)
        record[rel] = sha(mine)
        head = subprocess.run(["git", "show", f"HEAD:{rel}"], capture_output=True, check=True).stdout
        if b"\r\n" in mine and b"\r\n" not in head:
            head = head.replace(b"\n", b"\r\n")
        path.write_bytes(head)
        print("head", sha(head), rel)
    (KEEP / "record.json").write_text(json.dumps(record, indent=1))


def restore() -> None:
    record = json.loads((KEEP / "record.json").read_text())
    bad = 0
    for rel, want in record.items():
        data = (KEEP / rel.replace("/", "__")).read_bytes()
        (ROOT / rel).write_bytes(data)
        got = sha((ROOT / rel).read_bytes())
        ok = got == want
        bad += 0 if ok else 1
        print("restored" if ok else "MISMATCH", got, rel)
    if bad:
        sys.exit(f"{bad} file(s) not restored to G2's bytes")
    shutil.rmtree(KEEP)


if __name__ == "__main__":
    {"swap": swap, "restore": restore}[sys.argv[1]]()
