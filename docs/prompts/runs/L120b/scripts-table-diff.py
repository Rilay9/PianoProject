"""
L120b: the table's difference after a class (item 6), pair by pair, and the tool against the app's probe.

    python docs/prompts/runs/L120b/scripts-table-diff.py BEFORE.json AFTER.json CATALOG_AFTER.json PROBE-refusals.txt OUT.txt [--skips]

BEFORE/AFTER are `untaught_options.py --json` outputs. A pair is (rung, item, demand) with its class. Written:
the summaries side by side; every class-A pair before and where it went; every pair that left or appeared, by
demand and rung, with whether its row has a 3/8 bar and a `timeSig`; with `--skips`, every `interval.skip`
pair before, with its row's hands (`measurement.span`), and whether it stayed; and the tool's lines against
the probe's `untaught` lines at the same head (only the runtime reading row should differ).
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

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


def tag(item: dict | None) -> str:
    if item is None:
        return "not in the catalogue"
    times = (item.get("notation") or {}).get("times") or []
    bar = "3/8 bar" if item.get("timeSig") == "3/8" or "3/8" in times else "no 3/8 bar"
    return f"{bar}; timeSig {item.get('timeSig') or 'none'}"


def span(item: dict | None) -> str:
    s = ((item or {}).get("measurement") or {}).get("span")
    if not s:
        return "no span"
    return ", ".join(f"{hand} {low}-{high}" for hand, (low, high) in sorted(s.items(), key=lambda kv: kv[0] != "R"))


def main(argv: list[str]) -> int:
    before_path, after_path, catalog_path, probe_path, out_path = argv[:5]
    skips = "--skips" in argv
    before = json.loads(Path(before_path).read_text(encoding="utf-8"))
    after = json.loads(Path(after_path).read_text(encoding="utf-8"))
    catalog = {it["id"]: it for it in json.loads(Path(catalog_path).read_text(encoding="utf-8"))}
    pb, pa = pairs(before), pairs(after)
    out = [f"# The table after this class: {before_path} -> {after_path}", ""]
    out.append("## Summaries")
    out.append("")
    for name, report in (("before", before), ("after", after)):
        s = report["summary"]
        out.append(f"- {name}: {s['options']} options, {s['pairs']} pairs; by class "
                   + ", ".join(f"{k} {v}" for k, v in s["pairsByClass"].items())
                   + "; by resolution " + ", ".join(f"{k} {s['linesByResolution'].get(k, 0)}" for k in ("reading", "ownership", "placement"))
                   + f"; unread {s['unread']}")
    out.append("")
    left = sorted(set(pb) - set(pa))
    came = sorted(set(pa) - set(pb))
    moved = sorted(k for k in set(pb) & set(pa) if pb[k]["class"] != pa[k]["class"])
    out.append(f"- pairs that left: {len(left)} ({', '.join(f'{d} {n}' for d, n in sorted(Counter(k[2] for k in left).items())) or 'none'})")
    out.append(f"- pairs that appeared: {len(came)} ({', '.join(f'{d} {n}' for d, n in sorted(Counter(k[2] for k in came).items())) or 'none'})")
    changed = ", ".join(pb[k]["class"] + "->" + pa[k]["class"] + " " + k[2] for k in moved) or "none"
    out.append(f"- pairs that stayed and changed class: {len(moved)} ({changed})")
    out.append("")
    out.append("## The class-A pairs before, and where each went")
    out.append("")
    for key in sorted(k for k in pb if pb[k]["class"] == "A"):
        now = pa.get(key)
        where = f"stays, now {now['class']}" + (f" (doubt: {'; '.join(now['doubt'])})" if now and now["doubt"] else "") if now else "left the table (the gate no longer refuses it)"
        out.append(f"{key[0]} {key[1]} {key[2]} — was A (doubt: {'; '.join(pb[key]['doubt'])}) — {where} [{tag(catalog.get(key[1]))}]")
    out.append("")
    out.append("## Pairs that left the table")
    out.append("")
    for key in left:
        out.append(f"{key[0]} {key[1]} {key[2]} — was {pb[key]['class']} ({pb[key]['verdict']}, located {pb[key]['located']}) [{tag(catalog.get(key[1]))}]")
    out.append("")
    out.append("## Pairs that appeared")
    out.append("")
    for key in came:
        out.append(f"{key[0]} {key[1]} {key[2]} — now {pa[key]['class']} ({pa[key]['verdict']}, located {pa[key]['located']}) [{tag(catalog.get(key[1]))}]")
    if not came:
        out.append("none")
    out.append("")
    out.append("## Pairs that stayed and changed class")
    out.append("")
    for key in moved:
        out.append(f"{key[0]} {key[1]} {key[2]} — {pb[key]['class']} -> {pa[key]['class']} [{tag(catalog.get(key[1]))}]")
    if not moved:
        out.append("none")
    if skips:
        out.append("")
        out.append("## The interval.skip pairs before, each with its hands")
        out.append("")
        for key in sorted(k for k in pb if k[2] == "interval.skip"):
            fate = "stays" if key in pa else "removed by the predicate"
            out.append(f"{key[0]} {key[1]} ({pb[key]['title']}) — {fate} — {span(catalog.get(key[1]))}")
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
    print("\n".join(out[:12]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
