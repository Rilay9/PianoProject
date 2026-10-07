"""The bar-by-bar event table for the re-staffing brief, from events-by-role.json (reader A) with
reader B's agreement read from readers.json. Durations in quarters; beats 1-based. Writes
event-table.md."""
import json
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
ev = json.loads((HERE / "events-by-role.json").read_text(encoding="utf-8"))
rd = json.loads((HERE / "readers.json").read_text(encoding="utf-8"))
roles = ev["roles"]
NAME = {"4": "w", "3": "h.", "2": "h", "3/2": "q.", "1": "q", "3/4": "8.", "1/2": "8", "7/16": "16..",
        "1/4": "16", "1/16": "64"}


def cell(items, rests=()):
    rows = [(Fraction(e["onset"]), e["head"], e["dur"], e.get("tie")) for e in items]
    rows += [(Fraction(r["onset"]), "r", r["dur"], None) for r in rests]
    groups = {}
    for onset, head, dur, tie in sorted(rows, key=lambda x: (x[0], x[1])):
        groups.setdefault((onset, dur), []).append(head + ("~" if tie else ""))
    return " ".join(f"{'+'.join(h)}:{NAME.get(d, d)}@{float(onset + 1):g}" for (onset, d), h in groups.items())


lines = [f"Source: raw member sha256 `{ev['raw_sha256']}`; reader A (raw MusicXML walk) and reader B (music21) agree on "
         f"{rd['agreement']['events_a']} of {rd['agreement']['events_b']} note heads and {rd['agreement']['rests_a']} of "
         f"{rd['agreement']['rests_b']} rests (role, bar, onset, duration, spelled pitch, tie); claims identical: {rd['claims_agree']}.",
         "",
         "Notation: `head:value@beat`; `+` joins heads struck together; values w h. h q. q 8. 8 16.. 16 64; `r` a rest.",
         "",
         "| Bar | Plan (root) | Lower staff of the edition: roots (Piano staff 2) | Upper staff of the edition: riff (part Riff) | Omitted: voicing (Piano staff 1) | Omitted: drums (heads) |",
         "| --- | --- | --- | --- | --- | --- |"]
for b in range(1, 13):
    k = str(b)
    plan = rd["claims_a"]["plan"][k]["roman"] if k in rd["claims_a"]["plan"] else rd["claims_a"]["plan"][b]["roman"]
    lines.append(f"| {b} | {plan} | {cell(roles['root'].get(k, []))} | {cell(roles['riff'].get(k, []), roles.get('riff_rests', {}).get(k, []))} "
                 f"| {cell(roles['voicing'].get(k, []))} | {len(roles['drum'].get(k, []))} |")
tot = {r: sum(len(v) for v in roles[r].values()) for r in ("root", "riff", "voicing", "drum")}
lines += ["", f"Totals (heads): roots {tot['root']}, riff {tot['riff']} plus {sum(len(v) for v in roles.get('riff_rests', {}).values())} rests, "
          f"voicings {tot['voicing']}, drums {tot['drum']}. No tie in any part (both readers)."]
(HERE / "event-table.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
