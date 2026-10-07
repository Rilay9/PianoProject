"""Summarise a vitest log: summary lines, every FAIL name, and each failure's assertion lines (ANSI stripped)."""
import re
import sys
from pathlib import Path

src, dst, command, exit_code = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4]
text = re.sub(r"\x1b\[[0-9;]*m", "", src.read_text(encoding="utf-8", errors="replace"))
lines = text.splitlines()
out = [f"$ {command}", f"# summarised from the full log ({src.stat().st_size} bytes) by build/f3a/summarise.py:",
       "# the summary lines, every failing test's name, and the assertion lines under each failure", ""]
out += [l for l in lines if re.search(r"Test Files|^\s+Tests\s|Duration|Start at", l)]
out.append("")
fails = sorted({l.strip() for l in lines if l.startswith(" FAIL ")})
out.append(f"## failing tests ({len(fails)})")
out += fails
out.append("")
out.append("## assertion lines")
block = None
for l in lines:
    if l.startswith(" FAIL "):
        block = l.strip()
        out.append(block)
        continue
    if block and re.search(r"AssertionError|expected .* (to|not to) (contain|be|equal)|^\s+[-+] ", l):
        s = l.rstrip()
        out.append("    " + (s[:400] + " …" if len(s) > 400 else s))
out.append("")
out.append(f"exit={exit_code}")
dst.write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"wrote {dst} ({dst.stat().st_size} bytes)")
