"""U118: rewrite the named files with LF line endings (git normalises to LF on commit either way)."""
import sys
from pathlib import Path

CRLF = b"\r\n"
for name in sys.argv[1:]:
    p = Path(name)
    raw = p.read_bytes()
    count = raw.count(CRLF)
    p.write_bytes(raw.replace(CRLF, b"\n"))
    print(f"{name}: {count} CRLF -> LF")
