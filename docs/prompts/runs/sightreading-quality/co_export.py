"""
The text export for the outside reviewer's ordinary artefact review (brief §6).

    py -3.11 co_export.py <run dir>     # writes co/SAMPLE.md (and co/SAMPLE-2.md if over 300 KB)

A declared sample, one block per item: id, stratum, row, rung, seed, version, key, metre,
then per bar per hand every note's name, octave and value (from partitura's reading of the
file), and the item's check row. The sample: 2 items per level from stratum O (the first two
daily seeds of the level's first row), one item per recurring failure (its first example), and
one item per refusal reason. Everything else is unread by the reviewer; the count is printed.
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import check_corpus as cc  # noqa: E402

VALUE = {"whole": "whole", "half": "half", "quarter": "quarter", "eighth": "eighth", "16th": "16th"}


def value(e: dict) -> str:
    v = VALUE.get(e.get("type") or "", e.get("type") or "?")
    if e.get("dots"):
        v = "dotted " + v
    if e.get("tm"):
        v += f" ({e['tm'][0]}:{e['tm'][1]})"
    return v


def block(item: dict, res: dict, check: dict, run: Path) -> str:
    o = res["options"]
    lines = [f"## {item['id']}", "",
             f"- stratum {item['stratum']}; row {res.get('row') or 'level table'}; rung held {res.get('heldAt')}; "
             f"seed {item['seed']}; version {(res.get('generator') or {}).get('version')}",
             f"- options: `{json.dumps({k: v for k, v in o.items() if k != 'seed'})}`"]
    if res["outcome"] == "REFUSE":
        lines += ["- outcome: REFUSE", *[f"  - {r}" for r in res.get("reasons", [])], ""]
        return "\n".join(lines)
    p = cc.read_partitura(run / "items" / f"{item['id']}.musicxml")
    lines.append(f"- key: {p['keys']} fifths; metre: {p['times']}; bars: {len(p['measures'])}")
    by = defaultdict(list)
    for e in [*p["notes"], *[dict(r, rest=True) for r in p["rests"]]]:
        by[(e["m"], e["staff"])].append(e)
    for m in range(len(p["measures"])):
        for staff in (1, 2):
            es = sorted(by.get((m, staff), []), key=lambda e: (e["pos"], -(e.get("midi") or 0)))
            if not es:
                continue
            words = []
            for e in es:
                if e.get("rest"):
                    words.append(f"rest {value(e)}")
                else:
                    tie = " tied-on" if e["tieStart"] else ""
                    words.append(f"{cc.m21name(e['step'], e['alter']).replace('-', 'b')}{e['octave']} {value(e)}{tie}")
            lines.append(f"  - bar {m + 1} {'RH' if staff == 1 else 'LH'}: " + "; ".join(words))
    lines.append(f"- checks: {json.dumps(check['props'])}")
    if check.get("notes"):
        lines.append(f"- check notes: {json.dumps(check['notes'], ensure_ascii=False)[:600]}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    run = Path(sys.argv[1])
    manifest = json.loads((HERE / "MANIFEST.json").read_text(encoding="utf-8"))
    results = {r["id"]: r for r in json.loads((run / "results.json").read_text(encoding="utf-8"))}
    checks = {r["id"]: r for r in json.loads((run / "checks.json").read_text(encoding="utf-8"))}
    items = {i["id"]: i for i in manifest["items"]}
    chosen: list[tuple[str, str]] = []
    for level in range(1, 8):
        o = [i for i in manifest["items"] if i["stratum"] == "O" and int(results[i["id"]]["options"]["level"]) == level]
        for i in o[:2]:
            chosen.append((i["id"], f"O, level {level}"))
    seen = set()
    for c in checks.values():
        for p, v in c["props"].items():
            key = (c["level"], p)
            if v == "FAIL" and key not in seen:
                n = sum(1 for d in checks.values() if d["level"] == c["level"] and d["props"].get(p) == "FAIL")
                if n > 1:
                    seen.add(key)
                    chosen.append((c["id"], f"recurring failure L{c['level']} P{p}"))
    reasons = set()
    for r in results.values():
        if r["outcome"] == "REFUSE":
            key = r["reasons"][1] if len(r.get("reasons", [])) > 1 else r["reasons"][0]
            if key not in reasons:
                reasons.add(key)
                chosen.append((r["id"], "refusal reason"))
    merged: dict[str, list[str]] = {}
    for iid, why in chosen:
        merged.setdefault(iid, []).append(why)
    chosen = [(iid, "; ".join(whys)) for iid, whys in merged.items()]
    text = ["# Sight-reading quality lane: notation sample for the outside reviewer", "",
            f"Run: `{run.name}`. Sample n = {len(chosen)} of {len(manifest['items'])}; "
            f"{len(manifest['items']) - len(chosen)} left unread. Pitches as partitura read them from the "
            "file. Not heard. Findings on this sample are evidence with their own denominator, never a "
            "verdict, and nothing in the lane waits on them.", "",
            "| Item | Why chosen |", "| --- | --- |", *[f"| `{i}` | {why} |" for i, why in chosen], ""]
    for iid, why in chosen:
        text.append(block(items[iid], results[iid], checks[iid], run))
    out = "\n".join(text)
    (HERE / "co").mkdir(exist_ok=True)
    (HERE / "co" / "SAMPLE.md").write_text(out, encoding="utf-8")
    print(len(chosen), "items;", len(out.encode("utf-8")), "bytes")


if __name__ == "__main__":
    main()
