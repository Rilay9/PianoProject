"""X3d (not a test): sorts corpus-models.txt's moved scores by whether the label before and after equals the
catalogue's tempoBpm (the content build's own reading, rounded as the label rounds), and counts each kind;
writes corpus-models-summary.txt beside this script.
Usage, from the worktree root: python docs/prompts/runs/X3d/scripts-corpus-summary.py
"""

import pathlib
import re

HERE = pathlib.Path("docs/prompts/runs/X3d")
text = (HERE / "corpus-models.txt").read_text(encoding="utf8").splitlines()
rows = [line for line in text if "\t" in line and "→" in line]
kinds: dict[str, list[str]] = {}
for line in rows:
    ident, change, catalogue, _entries = line.split("\t")
    before, after = (int(n) for n in re.findall(r"(\d+)", change)[:2])
    cat = re.search(r"catalogue (\S+)", catalogue).group(1)
    target = None if cat == "None" else round(float(cat))
    if target is None:
        kind = "the catalogue names no tempo"
    elif after == target and before != target:
        kind = "now the catalogue's tempo (before, not)"
    elif after == target and before == target:
        kind = "both the catalogue's"
    elif before == target:
        kind = "was the catalogue's, no longer"
    else:
        kind = "neither the catalogue's"
    kinds.setdefault(kind, []).append(f"{ident}\t{before} → {after}\tcatalogue {cat}")
out = [f"moved: {len(rows)}"]
for kind, lines in sorted(kinds.items(), key=lambda item: -len(item[1])):
    out.append(f"{kind}: {len(lines)}")
for kind, lines in sorted(kinds.items(), key=lambda item: -len(item[1])):
    out.append("")
    out.append(f"== {kind}")
    out.extend(lines)
(HERE / "corpus-models-summary.txt").write_text("\n".join(out) + "\n", encoding="utf8")
print("\n".join(out[: 1 + len(kinds)]))
