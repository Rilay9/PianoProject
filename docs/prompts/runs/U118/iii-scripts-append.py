"""U118: append a block to a file, matching the file's own line endings. Idempotent by a marker line."""
import sys
from pathlib import Path

target, block, marker = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
raw = target.read_bytes()
if marker.encode("utf-8") in raw:
    print("already appended")
    sys.exit(0)
crlf = b"\r\n" in raw
text = block.read_text(encoding="utf-8").replace("\r\n", "\n")
if crlf:
    text = text.replace("\n", "\r\n")
target.write_bytes(raw + text.encode("utf-8"))
print(f"appended ({'CRLF' if crlf else 'LF'})")
