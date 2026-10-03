"""Exploration: python-ly's own traceback on each Joplin .ly it refuses (the last frames only)."""
import sys
import traceback
from pathlib import Path

import ly.musicxml

root = Path(sys.argv[1])
for rel in sys.argv[2:]:
    writer = ly.musicxml.writer()
    try:
        writer.parse_text((root / rel).read_text(encoding="utf-8", errors="replace"))
        xml = writer.musicxml().tostring()
        print(rel, "ok", len(xml), xml.count(b"<note"))
    except Exception:  # noqa: BLE001
        print("==", rel)
        traceback.print_exc(limit=-4, file=sys.stdout)
