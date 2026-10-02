"""G30's re-pin of tools/content/tests/fixtures/identity_pins.json: the 42 families' versions move, their digests do not.

usage: python docs/prompts/runs/G30/scripts-repin.py
The family digest is a hash of the family's items' music digests (test_family_contracts.TestIdentity), and
G30 changes no item's music (Hypothesis 1, baseline.txt), so each row keeps its digest byte for byte and only
its version moves: `test_a_family_s_music_changes_only_with_its_version` then proves the digest unchanged
rather than this script asserting it. Idempotent; the file round-trips byte for byte, so it is re-serialised.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "tools" / "content" / "tests" / "fixtures" / "identity_pins.json"

spec = importlib.util.spec_from_file_location("edit_contracts", Path(__file__).with_name("scripts-edit_contracts.py"))
edit_contracts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(edit_contracts)

NOTE = ("Re-pinned by G30, each with its version moved and its digest unchanged: the 42 families whose contract called "
        "their printed fingering the generator's own convention, not a published source, stopped printing it, and no "
        "item's notes changed. Their items keep learner continuity through tools/content/generator_continuity.json.")


def dump(data: dict, crlf: bool) -> bytes:
    text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    return (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    data = json.loads(raw.decode("utf-8"))
    assert dump(data, crlf) == raw
    moved = []
    for family, left in edit_contracts.FLIP.items():
        pin = data["families"][family]
        if pin["version"] == left:
            pin["version"] = left + 1
            moved.append(f"{family}: v{left} -> v{left + 1}, digest kept {pin['digest'][:12]}")
        else:
            assert pin["version"] == left + 1, (family, pin["version"])
    if NOTE not in data["_comment"]:
        data["_comment"].append(NOTE)
    out = dump(data, crlf)
    if out != raw:
        PATH.write_bytes(out)
    print(f"{len(moved)} re-pinned", *moved, sep="\n  ")


if __name__ == "__main__":
    main()
