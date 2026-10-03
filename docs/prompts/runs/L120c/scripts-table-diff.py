"""
L120c: the table's difference after a re-run (item 11), pair by pair, and the tool against the app's probe.

    python docs/prompts/runs/L120c/scripts-table-diff.py BEFORE.json AFTER.json CURRICULUM_AFTER.json PROBE-refusals.txt OUT.txt

BEFORE/AFTER are `untaught_options.py --json` outputs. A pair is (rung, item, demand) with its class. Written: the
summaries side by side with the per-demand counts; every pair that left or appeared, and every pair that stayed and
changed class, grouped by demand and rung, each rung marked with whether 4.4 is on its path (the brief's hypothesis,
item 12); the sixteenth pairs that remain, by rung; and the tool's lines against the probe's `untaught` lines at the
same head (only the runtime reading row should differ).
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
    before_path, after_path, curriculum_path, probe_path, out_path = argv[:5]
    before = json.loads(Path(before_path).read_text(encoding="utf-8"))
    after = json.loads(Path(after_path).read_text(encoding="utf-8"))
    ancestry = claims.rung_ancestry(json.loads(Path(curriculum_path).read_text(encoding="utf-8")))
    on44 = lambda rung: "4.4 on its path" if "4.4" in ancestry.get(rung, set()) else "4.4 not on its path"  # noqa: E731
    pb, pa = pairs(before), pairs(after)
    out = [f"# The table after this re-run: {before_path} -> {after_path}", "", "## Summaries", ""]
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
    moved = sorted(k for k in set(pb) & set(pa) if pb[k]["class"] != pa[k]["class"])
    out.append(f"- pairs that left: {len(left)} ({', '.join(f'{d} {n}' for d, n in sorted(Counter(k[2] for k in left).items())) or 'none'})")
    out.append(f"- pairs that appeared: {len(came)} ({', '.join(f'{d} {n}' for d, n in sorted(Counter(k[2] for k in came).items())) or 'none'})")
    out.append(f"- pairs that stayed and changed class: {len(moved)} "
               f"({', '.join(f'{c} {n}' for c, n in sorted(Counter(pb[k]['class'] + '->' + pa[k]['class'] + ' ' + k[2] for k in moved).items())) or 'none'})")
    out.append("")
    for title, keys, side in (("Pairs that left the table", left, pb), ("Pairs that appeared", came, pa)):
        out.append(f"## {title}, by demand and rung")
        out.append("")
        grouped: dict[str, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))
        for key in keys:
            grouped[key[2]][key[0]].append(f"{key[1]} (was {side[key]['class']})" if side is pb else f"{key[1]} (now {side[key]['class']})")
        for demand in sorted(grouped):
            out.append(f"### {demand} ({sum(len(v) for v in grouped[demand].values())})")
            for rung in sorted(grouped[demand]):
                items = grouped[demand][rung]
                out.append(f"- {rung} [{on44(rung)}] ({len(items)}): " + "; ".join(items))
            out.append("")
        if not keys:
            out.append("none")
            out.append("")
    out.append("## Pairs that stayed and changed class")
    out.append("")
    for key in moved:
        out.append(f"- {key[0]} [{on44(key[0])}] {key[1]} {key[2]}: {pb[key]['class']} -> {pa[key]['class']}")
    if not moved:
        out.append("none")
    out.append("")
    out.append("## The sixteenth pairs that remain, by rung")
    out.append("")
    remain = defaultdict(list)
    for key in sorted(k for k in pa if k[2] == "rhythm.sixteenths"):
        remain[key[0]].append(f"{key[1]} ({pa[key]['class']})")
    for rung in sorted(remain):
        out.append(f"- {rung} [{on44(rung)}] ({len(remain[rung])}): " + "; ".join(remain[rung]))
    on_path = [k for k in pa if k[2] == "rhythm.sixteenths" and "4.4" in ancestry.get(k[0], set())]
    out.append("")
    out.append(f"- sixteenth pairs on a rung with 4.4 on its path: {len(on_path)} (the hypothesis says 0)")
    out.append("")
    out.append("## The tool against the app's probe at this head")
    out.append("")
    probe = probe_untaught(Path(probe_path))
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
