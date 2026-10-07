"""
L120e: what the regenerated candidate-rungs report (`docs/prompts/runs/D3/candidate-rungs.md`) changed against the
committed one it replaces, read from the two markdown files: the header lines, each study's measured-demands line,
its candidate rungs (gained, lost) and every *Admitted by* cell that is not "taught". The committed report was
written at D3 (Entry 100) and its header corrected at D3a; its rows were never regenerated after that, so rows moved
by later seams (E0a's ancestry, F2c, L120b, L120d) show here beside L120e's column. Run from the worktree root:

    python docs/prompts/runs/L120e/scripts-candidate-rungs-diff.py BEFORE.md AFTER.md OUT.txt
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def parse(path: Path) -> tuple[list[str], dict[str, dict]]:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    head, *sections = text.split("\n## ")
    studies: dict[str, dict] = {}
    for section in sections:
        lines = section.split("\n")
        ident_line = next(line for line in lines if line.startswith("`"))
        ident = re.match(r"`([^`]+)`", ident_line).group(1)
        header = next((line for line in lines if line.startswith("| Rung |")), "")
        admitted_col = "Admitted by" in header
        rungs: dict[str, str] = {}
        for line in lines:
            if line.startswith("| ") and not line.startswith("| Rung |") and not line.startswith("| ---"):
                cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
                rung = cells[0].split(" (")[0]
                rungs[rung] = cells[1] if admitted_col else "(no column)"
        studies[ident] = {"title": lines[0], "measured": ident_line, "rungs": rungs}
    return head.split("\n"), studies


def main(before: str, after: str, out: str) -> int:
    head_b, b = parse(ROOT / before)
    head_a, a = parse(ROOT / after)
    lines = [f"python docs/prompts/runs/L120e/scripts-candidate-rungs-diff.py {before} {after} {out}", ""]
    lines.append("## The header")
    lines.append("")
    lines += [f"- before: {line}" for line in head_b if line not in head_a]
    lines += [f"+ after:  {line}" for line in head_a if line not in head_b]
    lines.append("")
    pairs_b = sum(len(s["rungs"]) for s in b.values())
    pairs_a = sum(len(s["rungs"]) for s in a.values())
    lines.append("## The studies")
    lines.append("")
    lines.append(f"- studies: before {len(b)}, after {len(a)}; (study, rung) pairs: before {pairs_b}, after {pairs_a}")
    lines.append(f"- only before: {sorted(set(b) - set(a)) or 'none'}; only after: {sorted(set(a) - set(b)) or 'none'}")
    lines.append("")
    for ident in sorted(set(b) | set(a)):
        rb, ra = (b.get(ident) or {}).get("rungs", {}), (a.get(ident) or {}).get("rungs", {})
        gained = [r for r in ra if r not in rb]
        lost = [r for r in rb if r not in ra]
        measured_moved = (b.get(ident) or {}).get("measured") != (a.get(ident) or {}).get("measured")
        if gained or lost or measured_moved:
            lines.append(f"- {ident}: gained {gained or 'none'}; lost {lost or 'none'}"
                         + ("; its measured-demands line moved" if measured_moved else ""))
    lines.append("")
    lines.append("## Every *Admitted by* cell that is not \"taught\" (after)")
    lines.append("")
    flagged = [(ident, rung, cell) for ident, s in sorted(a.items()) for rung, cell in s["rungs"].items() if cell != "taught"]
    lines.append(f"- {len(flagged)} of {pairs_a} (study, rung) pairs")
    lines += [f"  - {ident} at {rung}: {cell}" for ident, rung, cell in flagged]
    Path(ROOT / out).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:4]))
