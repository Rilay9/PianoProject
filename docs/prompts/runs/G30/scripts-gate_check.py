"""The build's physical gate over the whole plan, faults counted per family and kind (G30's red and green).

usage: python docs/prompts/runs/G30/scripts-gate_check.py <out.txt>
`confirm_physical` stops the build at the first faulting item; this reads every item through the same
`family_contracts.physical_faults` and lists what it finds, so a red names every family it reaches.
"""
from __future__ import annotations

import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402


def kind(fault: str) -> str:
    if "the row says none" in fault:
        return "fingering printed where the row says none"
    return fault.split(":", 1)[0]


def main() -> None:
    by_family: dict[str, Counter] = defaultdict(Counter)
    items: Counter = Counter()
    faulting: Counter = Counter()
    for sc, entry in G.default_plan(quick=False):
        family = entry["drill"]["generator"]["family"]
        items[family] += 1
        faults = FC.physical_faults(FC.contract(family), FC.recipe_of(entry), sc, entry)
        if faults:
            faulting[family] += 1
        for fault in faults:
            by_family[family][kind(fault)] += 1
    lines = [f"plan items: {sum(items.values())}; families: {len(items)}; families with a faulting item: {len(faulting)}"]
    for family in sorted(by_family):
        lines.append(f"  {family}: {faulting[family]} of {items[family]} items fault; "
                     + "; ".join(f"{k} x{n}" for k, n in sorted(by_family[family].items())))
    Path(sys.argv[1]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:8]), f"\n... ({len(lines) - 1} families listed)")


if __name__ == "__main__":
    main()
