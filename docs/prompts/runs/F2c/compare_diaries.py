"""
F2c: the five diaries run on this tree's after build against the base's (F2b's landed diaries, committed
at the base as `runs/F2b/diaries-after-<suite>-<name>.txt`), text for text. The committed files are
checked out with CRLF (core.autocrlf), the fresh run writes LF, so line endings are normalised; every
other byte is compared.
"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / "F2b"
total = 0
for sub in ("c4c", "c6"):
    for after in sorted((HERE / "diaries-after" / sub).glob("*.txt")):
        before = BASE / f"diaries-after-{sub}-{after.name}"
        a = before.read_bytes().replace(b"\r\n", b"\n")
        b = after.read_bytes().replace(b"\r\n", b"\n")
        text = a.decode("utf-8")
        rungs = sorted(set(re.findall(r"rung ([0-9a-z.]+)", text)))
        lines = text.splitlines()
        if a == b:
            print(f"== {sub}/{after.name}: identical to the base's but for line endings ({len(lines)} lines; rungs {', '.join(rungs)})")
            continue
        other = b.decode("utf-8").splitlines()
        differ = [i for i in range(max(len(lines), len(other)))
                  if (lines[i] if i < len(lines) else None) != (other[i] if i < len(other) else None)]
        total += len(differ)
        print(f"== {sub}/{after.name}: {len(differ)} lines differ of {len(lines)}")
        for i in differ[:20]:
            print(f"  line {i + 1}\n    base:  {lines[i] if i < len(lines) else ''}\n    after: {other[i] if i < len(other) else ''}")
print(f"{total} differing lines across the diaries")
