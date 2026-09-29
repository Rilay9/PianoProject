"""F2b: the five diaries before and after, byte for byte, and the rungs each covers."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
total = 0
for sub in ("c4c", "c6"):
    for before in sorted((HERE / "diaries-before" / sub).glob("*.txt")):
        after = HERE / "diaries-after" / sub / before.name
        a, b = before.read_bytes(), after.read_bytes()
        rungs = sorted(set(re.findall(r"rung ([0-9a-z.]+)", a.decode("utf-8"))))
        lines = a.decode("utf-8").splitlines()
        if a == b:
            print(f"== {sub}/{before.name}: byte-identical ({len(lines)} lines; rungs {', '.join(rungs)})")
            continue
        other = b.decode("utf-8").splitlines()
        differ = [i for i in range(max(len(lines), len(other)))
                  if (lines[i] if i < len(lines) else None) != (other[i] if i < len(other) else None)]
        total += len(differ)
        print(f"== {sub}/{before.name}: {len(differ)} lines differ of {len(lines)}")
        for i in differ[:20]:
            print(f"  line {i + 1}\n    before: {lines[i] if i < len(lines) else ''}\n    after:  {other[i] if i < len(other) else ''}")
print(f"{total} differing lines across the diaries")
