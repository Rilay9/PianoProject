"""E50a: which bytes the committed `pinned_archive` layout wrote differently on Windows and elsewhere. The layout of
338cc916 (no creating system set) is reproduced here under a patched `sys.platform` and the two outputs compared
byte by byte. Output: zip-platform-diff.txt."""
import io
import sys
import zipfile
from pathlib import Path
from unittest import mock

W = Path(__file__).resolve().parents[4]
ENTRIES = [("META-INF/container.xml", b"<container/>"), ("score.musicxml", b"<score-partwise/>\n" * 200)]


def committed_layout() -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in ENTRIES:
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            archive.writestr(info, data)
    return buffer.getvalue()


out = {}
for platform in ("win32", "linux"):
    with mock.patch.object(sys, "platform", platform):
        out[platform] = committed_layout()
a, b = out["win32"], out["linux"]
diffs = [i for i in range(min(len(a), len(b))) if a[i] != b[i]]
cd = a.rfind(b"PK\x01\x02", 0)
lines = [f"lengths: win32 {len(a)}, linux {len(b)}", f"differing byte offsets: {diffs}",
         f"each is byte 5 of a central-directory header (\"version made by\", its high byte the creating system): "
         f"{all(a[i - 5:i - 1] == b'PK' + bytes([1, 2]) for i in diffs)}",
         f"values: win32 {[a[i] for i in diffs]}, linux {[b[i] for i in diffs]}"]
(W / "docs" / "prompts" / "runs" / "E50a" / "zip-platform-diff.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
