"""The entry's `## Content` lines, one per item, from the two plan snapshots and the edited build (CL15).

usage: python content_list.py <plan-base.json> <plan-after.json> <catalog-after.json> <out.md>
Notes are written bar:beat pitch (beat counted from 0 in quarters; pitches as music21 spells them,
'-' a flat). Each line: the item, where it lives, what moved, before -> after, and the identity.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def staff(row: dict) -> str:
    return "LH" if row["hands"] == "left" else "RH"


def sounded(rows: list[str]) -> list[tuple[str, str, float, str]]:
    out = []
    for event in rows:
        place, name, length, *tie = event.split(" ")
        if name == "rest":
            continue
        out.append((place, name, float(length), tie[0] if tie else ""))
    return out


def melody(rows: list[str]) -> str:
    """Pitches in order, a tie continuation dropped, lengths as q (quarter) h (half) w (whole) e (eighth) s (sixteenth)."""
    names = {0.25: "s", 0.5: "e", 1.0: "q", 1.5: "q.", 2.0: "h", 3.0: "h.", 4.0: "w"}
    out = []
    for _place, name, length, tie in sounded(rows):
        if tie == "tie-stop":
            out[-1] = out[-1] + f"~{names.get(length, length)}"
            continue
        out.append(f"{name}{names.get(length, length)}")
    return " ".join(out)


def identity(old: dict, new: dict, carried: bool) -> str:
    link = "the old identity carried (`formerGeneratorIdentities`, digest unchanged)" if carried else "no link to the old identity (notes changed)"
    if old["digest"] == new["digest"] and not carried:
        link = "digest unchanged"
    return f"identity {old['identity']['family']} v{old['identity']['version']} → v{new['identity']['version']}, {link}"


def main() -> None:
    base = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    after = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    catalog = {row["id"]: row for row in json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))}
    lines: list[str] = []
    for item_id in sorted(after):
        old, new = base[item_id], after[item_id]
        family = new["family"]
        if family not in ("tremolo_octaves", "pentatonic", "syncopation", "interval_reading", "walking_bass", "power_chord"):
            continue
        carried = bool((catalog[item_id].get("provenance") or {}).get("formerGeneratorIdentities"))
        where = f"`{item_id}` (`scores/generated/{item_id}.mxl` and its catalogue row)"
        if family == "tremolo_octaves":
            s = staff(new)
            b = [(p, n) for p, n, _l, _t in sounded(old["notes"][s])][1::2][::4]
            a = [(p, n) for p, n, _l, _t in sounded(new["notes"][s])][1::2][::4]
            lows = [n for _p, n, _l, _t in sounded(new["notes"][s])][0::2][::4]
            if old["digest"] == new["digest"]:
                what = f"notes unchanged (octaves {', '.join(f'{lo}–{hi}' for lo, (_p, hi) in zip(lows, a))})"
            else:
                pairs = [f"{lo}–{hb} → {lo}–{ha}" for lo, (_p, hb), (_q, ha) in zip(lows, b, a) if hb != ha]
                what = f"upper note of the tremolo on degrees 2 and 3: {'; '.join(pairs)} (degrees 1 and 4 unchanged)"
        elif family == "pentatonic":
            if old["digest"] == new["digest"]:
                what = f"notes unchanged ({melody(new['notes']['RH'])})"
            else:
                what = (f"up and back twice instead of once, the tonic not struck twice at the turn: "
                        f"{len(sounded(old['notes']['RH']))} eighths ({old['notes']['RH'][-1].split(':')[0]} bars) → "
                        f"{len(sounded(new['notes']['RH']))} eighths ({new['notes']['RH'][-1].split(':')[0]} bars); "
                        f"after: {melody(new['notes']['RH'])}")
        elif family == "interval_reading":
            s = staff(new)
            if old["digest"] == new["digest"]:
                what = f"notes unchanged ({melody(new['notes'][s])}): this seed's first draw gives the same note under both rules"
            else:
                what = f"melody {melody(old['notes'][s])} → {melody(new['notes'][s])}"
        elif family == "walking_bass":
            b, a = sounded(old["notes"]["LH"]), sounded(new["notes"]["LH"])
            if len(a) > len(b):
                closing = " ".join(n for _p, n, _l, _t in a[-4:])
                sym = new["notes"].get("symbols", [])[-1].split(" ", 1)[1]
                what = (f"bars 1–12 unchanged (bar 12's last note {b[-1][1]}, the approach a semitone under the tonic); "
                        f"bar 13 added under {sym}: {closing}")
            else:
                what = f"bar {a[-1][0].split(':')[0]}'s last note {b[-1][1]} → {a[-1][1]} (the bar was {' '.join(n for _p, n, _l, _t in b[-4:])}, now {' '.join(n for _p, n, _l, _t in a[-4:])})"
        elif family == "syncopation":
            parts = []
            if old["title"] != new["title"]:
                parts.append(f"title “{old['title']}” → “{new['title']}”")
            if old["concepts"] != new["concepts"]:
                parts.append(f"concepts {old['concepts']} → {new['concepts']}")
            if old["digest"] != new["digest"]:
                parts.append(f"right hand {melody(old['notes']['RH'])} → {melody(new['notes']['RH'])} (~ a tie)")
            else:
                parts.append("notes unchanged")
            what = "; ".join(parts)
        else:  # power_chord
            if old["role"] == new["role"]:
                continue
            what = f"role {old['role']} → {new['role']} (notes, title and identity unchanged)"
        tail = "" if family == "power_chord" else f"; {identity(old, new, carried)}"
        lines.append(f"- {where}: {what}{tail}.")
    Path(sys.argv[4]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(lines)} lines")


if __name__ == "__main__":
    main()
