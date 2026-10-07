"""U118: report each file's line endings (CRLF, LF-only, or mixed)."""
import sys
from pathlib import Path

for name in sys.argv[1:]:
    raw = Path(name).read_bytes()
    crlf = raw.count(b"\r\n")
    lf = raw.count(b"\n") - crlf
    print(f"{name}: CRLF {crlf}, bare LF {lf}")
