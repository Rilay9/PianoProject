"""
L120d (item 5): the table's difference after the re-run, pair by pair, and the tool against the app's probe —
L120c's script (`docs/prompts/runs/L120c/scripts-table-diff.py`) with its 4.4 marker replaced by this lane's: each
pair's row marked inside or not inside the fixed positions taught at its rung (the leap's own positions after, the
skip's where the leap has none), and its sixteenth section by the interval.leap pairs that remain.

    python docs/prompts/runs/L120d/scripts-table-diff.py BEFORE_DIR AFTER_DIR PROBE-refusals.txt OUT.txt

BEFORE_DIR/AFTER_DIR hold `untaught-options.json`, `catalog.json` and `curriculum.json` (build/l120d-<class>).
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import claims  # noqa: E402

LINE = re.compile(r"^(\S+) (\S+): (\{.*\})$")


def pairs(report: dict) -> dict[tuple[str, str, str], dict]:
    return {(line["rung"], line["item"], row["id"]): {**row, "title": line["title"]}
            for line in report["lines"] for row in line["demands"]}


def probe_untaught(path: Path) -> dict[tuple[str, str], tuple[str, ...]]:
    out = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        match = LINE.match(raw.strip())
        if match:
            verdict = json.loads(match.group(3))
            if verdict.get("why") == "untaught":
                out[(match.group(1), match.group(2))] = tuple(verdict["demands"])
    return out


def main(argv: list[str]) -> int:
    before_dir, after_dir, probe_path, out_path = (Path(a) for a in argv[:4])
    before = json.loads((before_dir / "untaught-options.json").read_text(encoding="utf-8"))
    after = json.loads((after_dir / "untaught-options.json").read_text(encoding="utf-8"))
    catalog = {it["id"]: it for it in json.loads((after_dir / "catalog.json").read_text(encoding="utf-8"))}
    curriculum = json.loads((after_dir / "curriculum.json").read_text(encoding="utf-8"))
    ancestry = claims.rung_ancestry(curriculum)
    concepts = claims.concepts_by_rung(curriculum)
    _skills, demands = claims.load_vocabulary()
    reader = demands["interval.leap"] if demands["interval.leap"].get("fixedPositions") else demands["interval.skip"]

    def inside(rung: str, item: str) -> str:
        behind = {c for r in ancestry.get(rung, set()) for c in concepts.get(r, set())}
        held = claims.in_taught_position(catalog.get(item, {}), reader, behind)
        span = ((catalog.get(item) or {}).get("measurement") or {}).get("span") or {}
        where = ", ".join(f"{h} {lo}-{hi}" for h, (lo, hi) in span.items()) or "no span"
        return f"{'inside' if held else 'not inside'} a taught position, {where}"

    pb, pa = pairs(before), pairs(after)
    out = [f"# The table after this re-run: {before_dir} -> {after_dir}", "", "## Summaries", ""]
    for name, report in (("before", before), ("after", after)):
        s = report["summary"]
        out.append(f"- {name}: {s['options']} options, {s['pairs']} pairs; by class "
                   + ", ".join(f"{k} {v}" for k, v in s["pairsByClass"].items())
                   + "; by resolution " + ", ".join(f"{k} {s['linesByResolution'].get(k, 0)}" for k in ("reading", "ownership", "placement"))
                   + f"; unread {s['unread']}")
    out.append("")
    per_before = Counter(k[2] for k in pb)
    per_after = Counter(k[2] for k in pa)
    out.append("| demand | pairs before | pairs after |")
    out.append("| --- | --- | --- |")
    for demand in sorted(set(per_before) | set(per_after), key=lambda d: (-per_before.get(d, 0), d)):
        out.append(f"| {demand} | {per_before.get(demand, 0)} | {per_after.get(demand, 0)} |")
    out.append("")
    left = sorted(set(pb) - set(pa))
    came = sorted(set(pa) - set(pb))
    moved = sorted(k for k in set(pb) & set(pa) if pb[k]["class"] != pa[k]["class"] or pb[k] != pa[k])
    lines_before = {(line["rung"], line["item"]) for line in before["lines"]}
    lines_after = {(line["rung"], line["item"]) for line in after["lines"]}
    out.append(f"- pairs that left: {len(left)} ({', '.join(f'{d} {n}' for d, n in sorted(Counter(k[2] for k in left).items())) or 'none'})")
    out.append(f"- pairs that appeared: {len(came)} ({', '.join(f'{d} {n}' for d, n in sorted(Counter(k[2] for k in came).items())) or 'none'})")
    out.append(f"- pairs that stayed and changed in any field: {len(moved)}")
    out.append(f"- options (lines) that left the table: {len(lines_before - lines_after)}"
               + "".join(f"\n  - {k[0]} {k[1]}" for k in sorted(lines_before - lines_after)))
    out.append(f"- options (lines) that appeared: {len(lines_after - lines_before)}"
               + "".join(f"\n  - {k[0]} {k[1]}" for k in sorted(lines_after - lines_before)))
    out.append("")
    for title, keys, side in (("Pairs that left the table", left, pb), ("Pairs that appeared", came, pa)):
        out.append(f"## {title}, by demand and rung")
        out.append("")
        grouped: dict[str, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))
        for key in keys:
            grouped[key[2]][key[0]].append(f"{key[1]} ({'was' if side is pb else 'now'} {side[key]['class']}; {inside(key[0], key[1])})")
        for demand in sorted(grouped):
            out.append(f"### {demand} ({sum(len(v) for v in grouped[demand].values())})")
            for rung in sorted(grouped[demand]):
                out.append(f"- {rung} ({len(grouped[demand][rung])}): " + "; ".join(grouped[demand][rung]))
            out.append("")
        if not keys:
            out.append("none")
            out.append("")
    out.append("## Pairs that stayed and changed")
    out.append("")
    for key in moved:
        out.append(f"- {key[0]} {key[1]} {key[2]}: {json.dumps(pb[key])} -> {json.dumps(pa[key])}")
    if not moved:
        out.append("none")
    out.append("")
    out.append("## The interval.leap pairs that remain, each read against the positions")
    out.append("")
    remain = sorted(k for k in pa if k[2] == "interval.leap")
    for key in remain:
        out.append(f"- {key[0]} {key[1]} ({pa[key]['class']}; {inside(key[0], key[1])})")
    left_inside = [k for k in remain if inside(k[0], k[1]).startswith("inside")]
    out.append("")
    out.append(f"- interval.leap pairs that remain: {len(remain)}; of them inside a taught position: {len(left_inside)} (the hypothesis says 0)")
    out.append("")
    out.append("## The tool against the app's probe at this head")
    out.append("")
    probe = probe_untaught(probe_path)
    mine = {(line["rung"], line["item"]): tuple(row["id"] for row in line["demands"]) for line in after["lines"]}
    only_probe = sorted(set(probe) - set(mine))
    only_mine = sorted(set(mine) - set(probe))
    differing = sorted(k for k in set(probe) & set(mine) if probe[k] != mine[k])
    out.append(f"- probe `untaught` lines: {len(probe)}; tool lines: {len(mine)}")
    out.append(f"- only the probe has: {len(only_probe)}" + "".join(f"\n  - {k[0]} {k[1]} {list(probe[k])}" for k in only_probe))
    out.append(f"- only the tool has: {len(only_mine)}" + "".join(f"\n  - {k[0]} {k[1]} {list(mine[k])}" for k in only_mine))
    out.append(f"- the same option read with different demands: {len(differing)}"
               + "".join(f"\n  - {k[0]} {k[1]} probe {list(probe[k])} tool {list(mine[k])}" for k in differing))
    Path(out_path).write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out[:8]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
