"""Re-pins CL15's five families in identity_pins.json from a plan snapshot, spliced as text.

usage: python repin.py <plan-after.json> <identity_pins.json>
The family digest is test_family_contracts.TestIdentity's: sha256 over json.dumps of the family's
sorted (id, music digest) pairs. Each row is checked against the base pin first (the version it held).
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

#: family: (version held, version now)
BUMPED = {"interval_reading": (1, 2), "pentatonic": (1, 2), "syncopation": (1, 2), "tremolo_octaves": (1, 2), "walking_bass": (2, 3)}

NOTE = ("Re-pinned by CL15, each with its version moved, where its notes changed: tremolo_octaves (the key's own thirds), "
        "pentatonic (the five-note form up and down twice), syncopation (two ties in the tie drill), interval_reading "
        "(the first note any degree of the position), walking_bass (the line ends on the tonic). Each family's unchanged "
        "items keep learner continuity through tools/content/generator_continuity.json, not through the pin.")


def main() -> None:
    plan = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    path = Path(sys.argv[2])
    text = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in text
    text = text.replace("\r\n", "\n")
    items: dict[str, list] = defaultdict(list)
    for item_id, row in plan.items():
        items[row["family"]].append((item_id, row["digest"]))
    for family, (held, now) in BUMPED.items():
        digest = hashlib.sha256(json.dumps(sorted(items[family])).encode("utf-8")).hexdigest()
        pattern = re.compile(r'(    "%s": \{\n      "version": )(\d+)(,\n      "items": )(\d+)(,\n      "digest": ")([0-9a-f]{64})(")' % family)
        found = pattern.search(text)
        assert found, family
        assert int(found.group(4)) == len(items[family]), (family, found.group(4), len(items[family]))
        if int(found.group(2)) == now and found.group(6) == digest:
            print(f"already: {family}")
            continue
        assert int(found.group(2)) in (held, now), (family, found.group(2))
        text = text[:found.start()] + found.group(1) + str(now) + found.group(3) + found.group(4) + found.group(5) + digest + found.group(7) + text[found.end():]
        print(f"re-pinned: {family} v{held} -> v{now} {digest[:12]}")
    if NOTE not in text:
        marker = 'version moved, where the spelling policy changed the notes: seventh_arpeggio, broken_seventh, seventh_voicing, ii_v_i, four_chord_loop, tritone_sub, walking_bass, open_voicing, passing_chord."'
        assert text.count(marker) == 1
        text = text.replace(marker, marker + ",\n    " + json.dumps(NOTE, ensure_ascii=False))
    json.loads(text)
    path.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))


if __name__ == "__main__":
    main()
